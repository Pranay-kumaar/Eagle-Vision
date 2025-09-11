# Environment requirements:
#   pip install sentinelhub pystac-client shapely geopandas rasterio harp

import os
import datetime as dt
import numpy as np
import matplotlib.pyplot as plt
from shapely.geometry import shape, Polygon
from shapely.ops import transform
import pyproj

from sentinelhub import (
    SHConfig, BBox, CRS, MimeType,
    SentinelHubRequest, DataCollection, bbox_to_dimensions
)

# -----------------------
# Config and AOI
# -----------------------
SH_CLIENT_ID = "7aec417f-5f23-455d-803a-23d186e2376f"
SH_CLIENT_SECRET = "sGKXYzLoL7eFjXB6wk9tnda3rGKCd0cK"

config = SHConfig()
if SH_CLIENT_ID and SH_CLIENT_SECRET:
    config.sh_client_id = SH_CLIENT_ID
    config.sh_client_secret = SH_CLIENT_SECRET

# Example AOI: replace with your region of interest
aoi_geojson = {
    "type": "Polygon",
    "coordinates": [[
        [77.55, 12.90], [77.75, 12.90], [77.75, 13.10], [77.55, 13.10], [77.55, 12.90]
    ]]
}
aoi = shape(aoi_geojson)
bbox = BBox(aoi.bounds, crs=CRS.WGS84)

# Two dates 5 years apart
date1 = dt.date(2020, 11, 1)
date2 = dt.date(2025, 11, 1)

# 14-day windows for cloud-free scenes
win_days = 14
time1 = (str(date1 - dt.timedelta(days=win_days)), str(date1 + dt.timedelta(days=win_days)))
time2 = (str(date2 - dt.timedelta(days=win_days)), str(date2 + dt.timedelta(days=win_days)))

# Output resolution (meters)
resolution = 10
size = bbox_to_dimensions(bbox, resolution=resolution)

# -----------------------
# Corrected NDVI Evalscript (per-band units!)
# -----------------------
evalscript_ndvi = """
//VERSION=3
function setup() {
  return {
    input: [
      { bands: ["B08", "B04"], units: "REFLECTANCE" },
      { bands: ["SCL"], units: "DN" }
    ],
    output: { bands: 1, sampleType: "FLOAT32" }
  }
}

// Cloud/shadow mask using SCL (Scene Classification Layer)
function isClear(scl) {
  // 4: vegetation, 5: bare soils, 6: water, 7: unclassified
  // Mask out clouds/shadows/snow
  return (scl === 4 || scl === 5 || scl === 6 || scl === 7);
}

function evaluatePixel(s) {
  if (!isClear(s.SCL)) { return [NaN]; }
  let ndvi = (s.B08 - s.B04) / (s.B08 + s.B04);
  return [ndvi];
}
"""

def get_ndvi(time_interval):
    request = SentinelHubRequest(
        evalscript=evalscript_ndvi,
        input_data=[SentinelHubRequest.input_data(
            data_collection=DataCollection.SENTINEL2_L2A,
            time_interval=time_interval,
            mosaicking_order='leastCC'  # use least-cloudy pixel
        )],
        responses=[SentinelHubRequest.output_response("default", MimeType.TIFF)],
        bbox=bbox, size=size, config=config
    )
    data = request.get_data().squeeze()
    return data

ndvi1 = get_ndvi(time1)
ndvi2 = get_ndvi(time2)
ndvi_diff = ndvi2 - ndvi1

# Quicklook visualization
fig, axes = plt.subplots(1, 3, figsize=(15, 4))
titles = [f"NDVI {date1}", f"NDVI {date2}", "NDVI change (t2 - t1)"]
arrays = [ndvi1, ndvi2, ndvi_diff]
vmins = [-0.2, -0.2, -0.5]
vmaxs = [0.9, 0.9, 0.5]

for ax, arr, title, vmin, vmax in zip(axes, arrays, titles, vmins, vmaxs):
    im = ax.imshow(arr, vmin=vmin, vmax=vmax, cmap="RdYlGn")
    ax.set_title(title)
    ax.axis('off')
    fig.colorbar(im, ax=ax, fraction=0.046, pad=0.04)
plt.tight_layout()
plt.show()

# -----------------------
# Sentinel-5P NO2 AOI monthly means (outline)
# -----------------------
from pystac_client import Client
import requests
import tempfile
# import harp
import geopandas as gpd

def month_range(center_date, days=15):
    start = center_date - dt.timedelta(days=days)
    end = center_date + dt.timedelta(days=days)
    return start.isoformat(), end.isoformat()

def s5p_no2_monthly_mean(center_date, aoi_polygon: Polygon):
    # STAC search for S5P L2 NO2 OFFL products
    stac_url = "https://browser.stac.dataspace.copernicus.eu/"
    client = Client.open(stac_url)
    start, end = month_range(center_date, days=15)
    search = client.search(
        collections=["sentinel-5p-l2-no2-offl"],
        intersects=aoi_polygon.__geo_interface__,
        datetime=f"{start}/{end}",
        limit=50
    )
    items = list(search.get_items())
    if not items:
        return None

    # Download NetCDFs (authentication may be required)
    vals = []
    with tempfile.TemporaryDirectory() as tdir:
        for it in items[:10]:  # sample subset
            asset = it.assets.get("data") or next(iter(it.assets.values()))
            href = asset.href
            local_path = os.path.join(tdir, os.path.basename(href))
            with requests.get(href, stream=True) as r:
                r.raise_for_status()
                with open(local_path, "wb") as f:
                    for chunk in r.iter_content(1 << 20):
                        f.write(chunk)

            # Process with harp (requires installed library)
            # ops = (
            #     "derive(datetime_stop {time_of_day});"
            #     "bin_spatial(3600, -90, 0.05, 7200, -180, 0.05);"
            # )
            # prod = harp.import_product(local_path, operations=ops)
            # ds = prod.to_xarray()
            # da = ds['tropospheric_NO2_column_number_density']
            # vals.append(float(da.mean().values))
    return float(np.mean(vals)) if vals else None

no2_mean_t1 = s5p_no2_monthly_mean(date1, aoi)
no2_mean_t2 = s5p_no2_monthly_mean(date2, aoi)
if no2_mean_t1 is not None and no2_mean_t2 is not None:
    print("NO2 monthly mean (approx.):")
    print(f"{date1:%Y-%m} -> {no2_mean_t1:.3e}")
    print(f"{date2:%Y-%m} -> {no2_mean_t2:.3e}")
    print(f"Delta -> {(no2_mean_t2 - no2_mean_t1):.3e}")
else:
    print("No S5P NO2 samples found or access requires authentication.")

# Main entry point (optional, for script organization)
if __name__ == "__main__":
    # You can wrap above logic in 'main()' if desired.
    pass  # The script runs directly.
