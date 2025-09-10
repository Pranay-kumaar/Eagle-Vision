# Environment:
#   pip install sentinelhub pystac-client shapely geopandas rasterio harp
# Notes:
#   - Sentinel Hub requires SH_CLIENT_ID/SH_CLIENT_SECRET from an SH account.
#   - For S5P L2 NetCDF, use CDSE STAC to discover and then process with HARP.

import os
import datetime as dt
import numpy as np
import matplotlib.pyplot as plt
from shapely.geometry import shape, Polygon
from shapely.ops import transform
import pyproj

from sentinelhub import (
    SHConfig, BBox, BBoxSplitter, CRS, MimeType,
    SentinelHubRequest, DataCollection, bbox_to_dimensions
)

# -----------------------
# Config and AOI
# -----------------------
SH_CLIENT_ID = os.getenv("SH_CLIENT_ID")
SH_CLIENT_SECRET = os.getenv("SH_CLIENT_SECRET")

config = SHConfig()
if SH_CLIENT_ID and SH_CLIENT_SECRET:
    config.sh_client_id = SH_CLIENT_ID
    config.sh_client_secret = SH_CLIENT_SECRET

# Example AOI: replace with own GeoJSON polygon
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

# Small windows around dates to increase probability of cloud-free scenes
win_days = 14
time1 = (str(date1 - dt.timedelta(days=win_days)), str(date1 + dt.timedelta(days=win_days)))
time2 = (str(date2 - dt.timedelta(days=win_days)), str(date2 + dt.timedelta(days=win_days)))

# Output resolution (meters)
resolution = 10
size = bbox_to_dimensions(bbox, resolution=resolution)

# -----------------------
# Evalscript for NDVI (Sentinel-2 L2A)
# -----------------------
evalscript_ndvi = """
//VERSION=3
function setup() {
  return {
    input: [{
      bands: ["B08","B04","SCL"],
      units: "REFLECTANCE"
    }],
    output: { bands: 1, sampleType: "FLOAT32" }
  }
}

// Cloud/shadow mask using SCL (Scene Classification Layer)
function isClear(scl) {
  // 4: vegetation, 5: bare soils, 6: water, 7: unclassified, 8: cloud medium prob
  // 9: cloud high prob, 10: thin cirrus, 11: snow
  // Keep SCL 4,5,6,7; mask out clouds/shadows/snow
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
            mosaicking_order='leastCC'  # pick least cloudy pixel in window
        )],
        responses=[SentinelHubRequest.output_response("default", MimeType.TIFF)],
        bbox=bbox, size=size, config=config
    )
    data = request.get_data().squeeze()
    return data

ndvi1 = get_ndvi(time1)
ndvi2 = get_ndvi(time2)
ndvi_diff = ndvi2 - ndvi1

# Quicklook
fig, axes = plt.subplots(1, 3, figsize=(15,4))
for ax, arr, title, vmin, vmax in [
    (axes, ndvi1, f"NDVI {date1}", -0.2, 0.9),
    (axes[1], ndvi2, f"NDVI {date2}", -0.2, 0.9),
    (axes[2], ndvi_diff, "NDVI change (t2 - t1)", -0.5, 0.5),
]:
    im = ax.imshow(arr, vmin=vmin, vmax=vmax, cmap="RdYlGn")
    ax.set_title(title)
    ax.axis('off')
    fig.colorbar(im, ax=ax, fraction=0.046, pad=0.04)
plt.tight_layout()
plt.show()

# -----------------------
# Sentinel-5P NO2 AOI monthly means (outline)
# -----------------------
# Approach A (recommended for L2 -> AOI stats): use CDSE STAC to find NO2 OFFL L2 orbits,
#   download NetCDFs intersecting AOI and month, then aggregate with HARP.
#   Collection ids follow CDSE S5P L2 conventions (e.g., sentinel-5p-l2-no2-offl).
#   The snippet shows discovery and HARP aggregation; users should add authentication for downloads.

from pystac_client import Client
import requests
import tempfile
import harp
import geopandas as gpd

def month_range(center_date, days=15):
    start = center_date - dt.timedelta(days=days)
    end = center_date + dt.timedelta(days=days)
    return start.isoformat(), end.isoformat()

def s5p_no2_monthly_mean(center_date, aoi_polygon: Polygon):
    # 1) STAC search for S5P L2 NO2 OFFL products intersecting AOI and date window
    stac_url = "https://browser.stac.dataspace.copernicus.eu/"
    client = Client.open(stac_url)
    start, end = month_range(center_date, days=15)
    # Note: collection name patterns can be inspected in the STAC browser; adjust if needed.
    search = client.search(
        collections=["sentinel-5p-l2-no2-offl"],
        intersects=aoi_polygon.__geo_interface__,
        datetime=f"{start}/{end}",
        limit=50
    )
    items = list(search.get_items())
    if not items:
        return None

    # 2) Download NetCDFs (requires authentication to the asset href if protected)
    vals = []
    with tempfile.TemporaryDirectory() as tdir:
        for it in items[:10]:  # sample subset
            # Asset key may vary (often 'data' or 'measurement'); inspect item.assets keys
            asset = it.assets.get("data") or next(iter(it.assets.values()))
            href = asset.href
            # Download (pseudo; add token if required)
            local_path = os.path.join(tdir, os.path.basename(href))
            with requests.get(href, stream=True) as r:
                r.raise_for_status()
                with open(local_path, "wb") as f:
                    for chunk in r.iter_content(1 << 20):
                        f.write(chunk)

            # 3) HARP import + AOI subset + regrid to a small lat/lon grid + mean
            # Variable name for tropospheric NO2 column varies; common: tropospheric_NO2_column_number_density
            # HARP operations: spatial subsetting, binning to 0.05 deg and averaging
            ops = (
                "derive(datetime_stop {time_of_day});"
                "bin_spatial(3600, -90, 0.05, 7200, -180, 0.05);"
            )
            prod = harp.import_product(local_path, operations=ops)
            # AOI mask by bounding box (coarse); refine with rasterization if needed
            ds = prod.to_xarray()
            # Grid mean (already binned); compute global mean within AOI bounds
            lat = ds['latitude']
            lon = ds['longitude']
            da = ds['tropospheric_NO2_column_number_density']  # adjust if needed
            # Take overall mean for simplicity
            vals.append(float(da.mean().values))

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
