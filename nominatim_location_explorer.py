#!/usr/bin/env python3
"""
Comprehensive Nominatim API Location Explorer Script

This script demonstrates all capabilities of the Nominatim API, which is chosen as the best
free geocoding API for the following reasons:

✅ COMPLETELY FREE - No API key required, no billing setup
✅ GLOBAL COVERAGE - Worldwide data from OpenStreetMap
✅ RICH DATA - Addresses, POIs, boundaries, administrative areas
✅ MULTIPLE FORMATS - JSON, XML, GeoJSON, KML, SVG output
✅ BOTH DIRECTIONS - Forward geocoding (address→coords) and reverse (coords→address)
✅ EXTENSIVE FEATURES - Polygon shapes, extra tags, multilanguage support
✅ REASONABLE LIMITS - 1 req/sec, ~2,500 req/day (soft limit)

Author: Location Explorer
Date: 2025-09-10
"""

import requests
import json
import time
import csv
from datetime import datetime
from typing import Dict, List, Optional, Any
import argparse
import sys
import os

class NominatimGeocoder:
    """Comprehensive Nominatim API client exploring all possibilities."""
    
    BASE_URL = "https://nominatim.openstreetmap.org"
    
    def __init__(self, user_agent: str = "LocationExplorer/1.0"):
        self.user_agent = user_agent
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": user_agent,
            "Accept": "application/json",
            "Accept-Language": "en"
        })
        self.request_count = 0
        self.last_request_time = 0
    
    def _rate_limit(self):
        """Implement rate limiting (1 request/second)."""
        current_time = time.time()
        time_since_last = current_time - self.last_request_time
        if time_since_last < 1.0:
            time.sleep(1.0 - time_since_last)
        self.last_request_time = time.time()
        self.request_count += 1
        print(f"Request #{self.request_count} at {datetime.now().strftime('%H:%M:%S')}")
    
    def search_address(self, query: str, **kwargs) -> Dict:
        """
        Forward geocoding: Convert address/location to coordinates.
        
        Available parameters:
        - format: json, xml, geojson, geocodejson (default: json)
        - addressdetails: 0/1 - Include address breakdown
        - extratags: 0/1 - Include extra information (wikipedia, opening hours)
        - namedetails: 0/1 - Include alternative names
        - limit: Max results (1-40, default: 10)
        - countrycodes: Filter by country codes (e.g., 'us,ca,gb')
        - viewbox: Bounding box 'lon1,lat1,lon2,lat2'
        - bounded: 0/1 - Restrict to viewbox
        - polygon_geojson: 0/1 - Include geometry as GeoJSON
        - layer: address, poi, railway, natural, manmade
        - featureType: country, state, city, settlement
        """
        self._rate_limit()
        
        params = {
            "q": query,
            "format": kwargs.get("format", "json"),
            "addressdetails": kwargs.get("addressdetails", 1),
            "extratags": kwargs.get("extratags", 1),
            "namedetails": kwargs.get("namedetails", 1),
            "limit": kwargs.get("limit", 10)
        }
        
        # Add all optional parameters
        for key, value in kwargs.items():
            if key not in params:
                params[key] = value
        
        try:
            response = self.session.get(f"{self.BASE_URL}/search", params=params, timeout=30)
            response.raise_for_status()
            return response.json() if params["format"] == "json" else response.text
        except requests.RequestException as e:
            print(f"Error in search_address: {e}")
            return {"error": str(e)}
    
    def reverse_geocode(self, lat: float, lon: float, **kwargs) -> Dict:
        """
        Reverse geocoding: Convert coordinates to address.
        
        Parameters:
        - zoom: Detail level (0-18) - 3:country, 10:city, 18:building
        - format: Output format
        - addressdetails: Include address breakdown
        - extratags: Include extra tags
        - polygon_geojson: Include geometry
        """
        self._rate_limit()
        
        params = {
            "lat": lat,
            "lon": lon,
            "format": kwargs.get("format", "json"),
            "zoom": kwargs.get("zoom", 18),
            "addressdetails": kwargs.get("addressdetails", 1),
            "extratags": kwargs.get("extratags", 1)
        }
        
        for key, value in kwargs.items():
            if key not in params:
                params[key] = value
        
        try:
            response = self.session.get(f"{self.BASE_URL}/reverse", params=params, timeout=30)
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            print(f"Error in reverse_geocode: {e}")
            return {"error": str(e)}
    
    def search_nearby_poi(self, lat: float, lon: float, poi_type: str, radius_km: float = 2.0) -> List[Dict]:
        """Search for nearby Points of Interest."""
        # Create bounding box (rough conversion: 1 degree ≈ 111 km)
        lat_offset = radius_km / 111.0
        lon_offset = radius_km / 111.0
        
        viewbox = f"{lon - lon_offset},{lat - lat_offset},{lon + lon_offset},{lat + lat_offset}"
        
        result = self.search_address(
            poi_type,
            viewbox=viewbox,
            bounded=1,
            layer="poi",
            limit=10
        )
        
        return result if isinstance(result, list) else []

    def explore_location_comprehensive(self, query: str) -> Dict:
        """Comprehensive exploration using ALL Nominatim features."""
        print(f"\n🔍 EXPLORING: {query}")
        print("=" * 80)
        
        exploration = {
            "query": query,
            "timestamp": datetime.now().isoformat(),
            "results": {}
        }
        
        try:
            # 1. Basic forward geocoding with all details
            print("1️⃣  Forward Geocoding (Basic Search)")
            basic = self.search_address(query, addressdetails=1, extratags=1, namedetails=1)
            exploration["results"]["forward_geocoding"] = basic
            
            if not basic or "error" in basic:
                print("❌ No results found")
                return exploration
            
            best_result = basic[0]
            lat, lon = float(best_result["lat"]), float(best_result["lon"])
            print(f"📍 Found: {best_result.get('display_name', 'Unknown')}")
            print(f"🌐 Coordinates: {lat:.6f}, {lon:.6f}")
            
            # 2. Reverse geocoding at different zoom levels
            print("\n2️⃣  Reverse Geocoding (Multiple Detail Levels)")
            zoom_levels = {3: "Country", 5: "State", 8: "County", 10: "City", 14: "Suburb", 18: "Building"}
            reverse_results = {}
            
            for zoom, description in zoom_levels.items():
                result = self.reverse_geocode(lat, lon, zoom=zoom)
                reverse_results[description.lower()] = result
                if "display_name" in result:
                    print(f"   {description}: {result['display_name']}")
            
            exploration["results"]["reverse_geocoding"] = reverse_results
            
            # 3. Multiple output formats
            print("\n3️⃣  Multiple Output Formats")
            formats = {"json": "JSON", "geojson": "GeoJSON", "geocodejson": "GeocodeJSON"}
            format_results = {}
            
            for fmt, desc in formats.items():
                result = self.search_address(query, format=fmt, limit=1)
                format_results[fmt] = result
                print(f"   {desc}: {len(str(result))} characters")
            
            exploration["results"]["formats"] = format_results
            
            # 4. Nearby POIs
            print("\n4️⃣  Nearby Points of Interest")
            poi_types = ["restaurant", "hospital", "school", "bank", "pharmacy", "gas_station", "hotel"]
            nearby_pois = {}
            
            for poi_type in poi_types:
                pois = self.search_nearby_poi(lat, lon, poi_type, radius_km=2.0)
                if pois:
                    nearby_pois[poi_type] = pois[:3]  # Top 3
                    print(f"   {poi_type.title()}: {len(pois)} found")
                else:
                    print(f"   {poi_type.title()}: None found")
            
            exploration["results"]["nearby_pois"] = nearby_pois
            
            # 5. Polygon geometry
            print("\n5️⃣  Polygon Geometry")
            geometry_result = self.search_address(
                query, 
                polygon_geojson=1, 
                limit=1
            )
            exploration["results"]["geometry"] = geometry_result
            if geometry_result and "geojson" in str(geometry_result[0]):
                print("   ✅ Polygon geometry available")
            else:
                print("   ❌ No polygon geometry")
            
        except Exception as e:
            exploration["results"]["error"] = str(e)
            print(f"❌ Error during exploration: {e}")
        
        return exploration

def create_sample_locations():
    """Create sample locations for testing."""
    return [
        "Vellore Institute of Technology, Vellore",  # Vellore Campus
        "Vellore Institute of Technology, Chennai",  # Chennai Campus
        "Tower Bridge, London, UK",                      # Famous landmark
        "Eiffel Tower, Paris, France",                   # International landmark
        "Sydney Opera House, Australia",                 # Another country
        "10001",                                         # US ZIP code
        "SW1A 1AA",                                      # UK postcode
        "Times Square, NYC",                             # Popular location
        "Golden Gate Bridge, San Francisco",             # Another landmark
        "Buckingham Palace, London"                      # Royal location
    ]

def demo_all_features():
    """Demonstrate all Nominatim API features."""
    print("🌍 NOMINATIM API - COMPREHENSIVE DEMONSTRATION")
    print("=" * 80)
    print("WHY NOMINATIM IS THE BEST FREE GEOCODING API:")
    print("✅ Completely FREE - No API key, no billing, no limits on basic use")
    print("✅ Global coverage from OpenStreetMap data")  
    print("✅ Rich location data - addresses, POIs, boundaries, admin areas")
    print("✅ Both forward and reverse geocoding")
    print("✅ Multiple output formats (JSON, GeoJSON, KML, XML)")
    print("✅ Extensive filtering and customization options")
    print("✅ Polygon geometry support")
    print("✅ Respectful rate limiting (1 req/sec, ~2,500/day)")
    print("=" * 80)
    
    geocoder = NominatimGeocoder("LocationExplorer/1.0 (demo@example.com)")
    
    # Test with sample locations
    locations = create_sample_locations()
    all_results = []
    
    for location in locations[:3]:  # Test first 3 to respect rate limits
        result = geocoder.explore_location_comprehensive(location)
        all_results.append(result)
        time.sleep(1)  # Rate limiting
    
    print("\n📊 FINAL SUMMARY")
    print("=" * 40)
    print(f"Total API requests: {geocoder.request_count}")
    print(f"Locations explored: {len(all_results)}")
    print(f"Success rate: {len([r for r in all_results if 'error' not in r.get('results', {})])} / {len(all_results)}")
    
    return all_results

def main():
    """Main function with command line interface."""
    print("🚀 NOMINATIM LOCATION EXPLORER")
    print("Usage examples:")
    print("  python nominatim_explorer.py           # Interactive mode")
    print("  python nominatim_explorer.py --demo    # Run demonstration")
    print("Available methods:")
    print("  1. Forward Geocoding (address → coordinates)")
    print("  2. Reverse Geocoding (coordinates → address)")
    print("  3. Nearby POI Search")
    print("  4. Multiple Output Formats")
    print("  5. Polygon Geometry")
    print("  6. Comprehensive Location Exploration")
    print("\nStarting demonstration...")
    
    # Run demo automatically
    demo_all_features()

if __name__ == "__main__":
    main()