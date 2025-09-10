#!/usr/bin/env python3
"""
COMPREHENSIVE INDIA LOCATION HUB API EXPLORER
=============================================

This script provides complete exploration of the India Location Hub API,
which offers FREE access to 500,000+ Indian geographical locations including
census-related information about zipcodes, states, districts, talukas, and villages.

🎯 KEY FEATURES:
- Completely FREE API with no authentication required
- No rate limits or usage restrictions
- Access to 500,000+ Indian locations with real-time data
- Complete geographical hierarchy (State → District → Taluka → Village)
- Census-relevant demographic data extraction
- Export functionality to CSV format for analysis
- Real-time search capabilities across all administrative levels

🔗 API DETAILS:
Base URL: https://india-location-hub.in/api
Documentation: https://www.india-location-hub.in/api-docs
Database: 34 States/UTs, 195+ Districts, 2,593+ Talukas, 527,467+ Villages

🛠️ USAGE EXAMPLES:
python india_location_api_explorer.py

📊 OUTPUTS:
- comprehensive_indian_states_data.csv - All states with statistics
- Various location-specific CSV files for detailed analysis
- Census-relevant demographic breakdowns
- Administrative hierarchy mappings

Author: Generated for comprehensive census data analysis
Date: September 2025
"""

import requests
import json
import pandas as pd
import csv
import time
from datetime import datetime
from typing import Dict, List, Optional, Any
import logging
import sys
import os

class IndiaLocationHubAPI:
    """
    Comprehensive Python client for India Location Hub API

    This class provides access to Indian geographical and census-related location data
    through a free, no-authentication-required API that covers all administrative levels
    from states down to individual villages.
    """

    def __init__(self):
        self.base_url = "https://india-location-hub.in/api"
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Python-IndiaLocationAPI/1.0',
            'Accept': 'application/json',
        })

        # Setup logging
        logging.basicConfig(
            level=logging.INFO, 
            format='%(asctime)s - %(levelname)s - %(message)s'
        )
        self.logger = logging.getLogger(__name__)

        self._print_banner()

    def _print_banner(self):
        """Print API information banner"""
        print("🇮🇳 " + "="*70)
        print("   INDIA LOCATION HUB API - COMPREHENSIVE EXPLORER")
        print("="*74)
        print("✅ FREE API - No authentication or API keys required")
        print("✅ No rate limits - Unlimited usage")
        print("✅ Real-time data - Updated regularly from official sources")
        print("✅ Complete coverage - 500,000+ locations across India")
        print("✅ Census-ready - Hierarchical administrative data")
        print("="*74)

    def _make_request(self, endpoint: str, params: Optional[Dict] = None, retries: int = 3) -> Dict[str, Any]:
        """Make HTTP request with retry mechanism and error handling"""
        for attempt in range(retries):
            try:
                url = f"{self.base_url}{endpoint}"
                self.logger.info(f"API Request {attempt+1}/{retries}: {endpoint}")

                response = self.session.get(url, params=params, timeout=15)
                response.raise_for_status()

                return response.json()

            except requests.exceptions.Timeout:
                self.logger.warning(f"Request timeout on attempt {attempt+1}")
                if attempt == retries - 1:
                    return {"success": False, "error": "Request timeout after all retries"}
                time.sleep(2)

            except requests.exceptions.RequestException as e:
                self.logger.error(f"Request failed: {e}")
                return {"success": False, "error": str(e)}

    # ==============================================
    # CORE API METHODS - DIRECT ENDPOINT ACCESS
    # ==============================================

    def get_api_statistics(self) -> Dict[str, Any]:
        """
        Get comprehensive API database statistics

        Returns:
            Dict containing total counts of states, districts, talukas, villages,
            last update timestamp, and available API endpoints
        """
        return self._make_request("/stats")

    def get_all_states(self) -> Dict[str, Any]:
        """
        Get all Indian states and union territories with detailed statistics

        Returns:
            Dict containing array of all 34 states/UTs with their codes,
            district counts, taluka counts, and village counts
        """
        return self._make_request("/states")

    def get_districts_by_state_code(self, state_code: str) -> Dict[str, Any]:
        """
        Get all districts in a specific state

        Args:
            state_code: Two-digit state code (e.g., "27" for Maharashtra)

        Returns:
            Dict containing array of districts with names and codes
        """
        return self._make_request("/districts", {"state_code": state_code})

    def get_talukas_by_district_code(self, district_code: str) -> Dict[str, Any]:
        """
        Get all talukas (sub-districts) in a specific district

        Args:
            district_code: District code

        Returns:
            Dict containing array of talukas with names and codes
        """
        return self._make_request("/talukas", {"district_code": district_code})

    def get_villages_by_taluka_code(self, taluka_code: str) -> Dict[str, Any]:
        """
        Get all villages in a specific taluka

        Args:
            taluka_code: Taluka code

        Returns:
            Dict containing array of villages with names, codes, and hierarchy
        """
        return self._make_request("/villages", {"taluka_code": taluka_code})

    def search_locations(self, query: str, limit: int = 25) -> Dict[str, Any]:
        """
        Search for locations by name, pincode, or partial match

        Args:
            query: Search term (location name, pincode, etc.)
            limit: Maximum number of results to return

        Returns:
            Dict containing array of matching locations with full hierarchy
        """
        return self._make_request("/search", {"q": query, "limit": limit})

    # ==============================================
    # SPECIALIZED CENSUS ANALYSIS METHODS
    # ==============================================

    def analyze_pincode(self, pincode: str) -> Dict[str, Any]:
        """
        Comprehensive analysis of a specific pincode for census purposes

        Args:
            pincode: 6-digit Indian pincode

        Returns:
            Dict with detailed location analysis including administrative hierarchy,
            all related locations, and demographic boundaries
        """
        analysis = {
            "pincode": pincode,
            "analysis_timestamp": datetime.now().isoformat(),
            "locations_found": [],
            "administrative_summary": {
                "states": set(),
                "districts": set(),
                "talukas": set(),
                "total_locations": 0
            },
            "census_relevance": {
                "urban_rural_classification": [],
                "administrative_boundaries": [],
                "postal_service_areas": []
            },
            "success": False
        }

        # Search for the pincode
        search_result = self.search_locations(pincode, limit=20)

        if search_result.get("success") and "results" in search_result:
            analysis["success"] = True
            results = search_result["results"]
            analysis["administrative_summary"]["total_locations"] = len(results)

            for location in results:
                location_data = {
                    "name": location.get("name"),
                    "full_hierarchy": location.get("full_path", ""),
                    "state": location.get("state_name"),
                    "district": location.get("district_name"),
                    "taluka": location.get("taluka_name"),
                    "location_code": location.get("code"),
                    "classification": self._classify_location_for_census(location)
                }

                analysis["locations_found"].append(location_data)

                # Build administrative summary
                if location.get("state_name"):
                    analysis["administrative_summary"]["states"].add(location["state_name"])
                if location.get("district_name"):
                    analysis["administrative_summary"]["districts"].add(location["district_name"])
                if location.get("taluka_name"):
                    analysis["administrative_summary"]["talukas"].add(location["taluka_name"])

                # Census relevance analysis
                classification = location_data["classification"]
                if classification not in [item["type"] for item in analysis["census_relevance"]["urban_rural_classification"]]:
                    analysis["census_relevance"]["urban_rural_classification"].append({
                        "type": classification,
                        "example_location": location_data["name"]
                    })

        # Convert sets to lists for JSON serialization
        for key in analysis["administrative_summary"]:
            if isinstance(analysis["administrative_summary"][key], set):
                analysis["administrative_summary"][key] = list(analysis["administrative_summary"][key])

        return analysis

    def analyze_state_demographics(self, state_name: str) -> Dict[str, Any]:
        """
        Comprehensive demographic analysis of a state's administrative structure

        Args:
            state_name: Full name of the state (e.g., "Maharashtra")

        Returns:
            Dict with complete state analysis including all administrative levels,
            sample data, and census-relevant statistics
        """
        analysis = {
            "state_name": state_name,
            "analysis_date": datetime.now().isoformat(),
            "state_info": {},
            "all_districts": [],
            "sample_talukas": [],
            "sample_villages": [],
            "demographic_statistics": {
                "total_districts": 0,
                "total_talukas_estimated": 0,
                "total_villages_estimated": 0,
                "sample_talukas_analyzed": 0,
                "sample_villages_retrieved": 0
            },
            "administrative_structure": {
                "district_names": [],
                "taluka_distribution": {},
                "village_distribution": {}
            },
            "success": False
        }

        # Find the state in the states list
        states_response = self.get_all_states()
        if not states_response.get("success"):
            return analysis

        target_state = None
        for state in states_response.get("states", []):
            if state["name"].upper() == state_name.upper():
                target_state = state
                analysis["state_info"] = state
                break

        if not target_state:
            analysis["error"] = f"State '{state_name}' not found in database"
            return analysis

        # Get all districts for this state
        districts_response = self.get_districts_by_state_code(target_state["code"])
        if districts_response.get("success"):
            analysis["all_districts"] = districts_response.get("districts", [])
            analysis["demographic_statistics"]["total_districts"] = len(analysis["all_districts"])
            analysis["administrative_structure"]["district_names"] = [d["name"] for d in analysis["all_districts"]]

            # Sample talukas from multiple districts
            sample_districts = analysis["all_districts"][:5]  # Sample first 5 districts

            for district in sample_districts:
                talukas_response = self.get_talukas_by_district_code(district["code"])
                if talukas_response.get("success"):
                    district_talukas = talukas_response.get("talukas", [])

                    # Take sample from each district
                    sample_talukas = district_talukas[:3]  # 3 talukas per district
                    analysis["sample_talukas"].extend(sample_talukas)

                    # Track taluka distribution
                    analysis["administrative_structure"]["taluka_distribution"][district["name"]] = len(district_talukas)
                    analysis["demographic_statistics"]["sample_talukas_analyzed"] += len(sample_talukas)

            # Sample villages from first few talukas
            for taluka in analysis["sample_talukas"][:3]:  # Sample villages from first 3 talukas
                villages_response = self.get_villages_by_taluka_code(taluka["code"])
                if villages_response.get("success"):
                    villages = villages_response.get("villages", [])
                    sample_villages = villages[:10]  # 10 villages per taluka
                    analysis["sample_villages"].extend(sample_villages)

                    # Track village distribution
                    analysis["administrative_structure"]["village_distribution"][taluka["name"]] = len(villages)
                    analysis["demographic_statistics"]["sample_villages_retrieved"] += len(sample_villages)

        # Calculate estimates
        if analysis["state_info"]:
            analysis["demographic_statistics"]["total_talukas_estimated"] = int(analysis["state_info"].get("talukas", 0))
            analysis["demographic_statistics"]["total_villages_estimated"] = int(analysis["state_info"].get("villages", 0))

        analysis["success"] = True
        return analysis

    def get_location_hierarchy(self, location_query: str) -> Dict[str, Any]:
        """
        Get complete administrative hierarchy for any location

        Args:
            location_query: Location name, pincode, or search term

        Returns:
            Dict with hierarchical breakdown of all matching locations
            organized by administrative level (state, district, taluka, village)
        """
        hierarchy = {
            "query": location_query,
            "search_timestamp": datetime.now().isoformat(),
            "total_matches": 0,
            "administrative_levels": {
                "state_level": [],
                "district_level": [],
                "taluka_level": [],
                "village_level": []
            },
            "geographic_distribution": {
                "states_represented": set(),
                "districts_represented": set(),
                "regions_covered": []
            },
            "success": False
        }

        search_result = self.search_locations(location_query, limit=30)

        if search_result.get("success") and "results" in search_result:
            hierarchy["success"] = True
            results = search_result["results"]
            hierarchy["total_matches"] = len(results)

            for result in results:
                location_info = {
                    "name": result.get("name"),
                    "full_path": result.get("full_path", ""),
                    "state": result.get("state_name"),
                    "district": result.get("district_name"),
                    "taluka": result.get("taluka_name"),
                    "code": result.get("code"),
                    "administrative_level": self._determine_admin_level(result),
                    "census_category": self._classify_location_for_census(result)
                }

                # Categorize by administrative level
                level = location_info["administrative_level"]
                hierarchy["administrative_levels"][f"{level}_level"].append(location_info)

                # Track geographic distribution
                if result.get("state_name"):
                    hierarchy["geographic_distribution"]["states_represented"].add(result["state_name"])
                if result.get("district_name"):
                    hierarchy["geographic_distribution"]["districts_represented"].add(result["district_name"])

        # Convert sets to lists
        for key in hierarchy["geographic_distribution"]:
            if isinstance(hierarchy["geographic_distribution"][key], set):
                hierarchy["geographic_distribution"][key] = list(hierarchy["geographic_distribution"][key])

        return hierarchy

    def _classify_location_for_census(self, location_data: Dict) -> str:
        """Classify location type for census analysis purposes"""
        if location_data.get("code") and location_data.get("taluka_name"):
            return "Rural Settlement/Village"
        elif location_data.get("taluka_name") and not location_data.get("code"):
            return "Urban Area/Town"
        elif location_data.get("district_name") and not location_data.get("taluka_name"):
            return "District Headquarters"
        elif location_data.get("state_name") and not location_data.get("district_name"):
            return "State Capital/Major City"
        else:
            return "Administrative Unit"

    def _determine_admin_level(self, location_data: Dict) -> str:
        """Determine the administrative level of a location"""
        if location_data.get("code") and location_data.get("taluka_name"):
            return "village"
        elif location_data.get("taluka_name") and location_data.get("district_name"):
            return "taluka"
        elif location_data.get("district_name") and location_data.get("state_name"):
            return "district"
        elif location_data.get("state_name"):
            return "state"
        else:
            return "unknown"

    # ==============================================
    # DATA EXPORT AND REPORTING METHODS
    # ==============================================

    def export_to_csv(self, data: Any, filename: str, data_type: str = "generic") -> str:
        """
        Export various types of API data to CSV format

        Args:
            data: Data to export (can be dict, list, or DataFrame)
            filename: Output filename
            data_type: Type of data being exported for proper formatting

        Returns:
            Success/error message string
        """
        try:
            if data_type == "states" and isinstance(data, list):
                df = pd.DataFrame(data)
                df.to_csv(filename, index=False)
                return f"✅ States data exported to {filename}"

            elif data_type == "search_results":
                if isinstance(data, dict) and "results" in data:
                    df = pd.DataFrame(data["results"])
                elif isinstance(data, list):
                    df = pd.DataFrame(data)
                else:
                    return "❌ Invalid search results format"
                df.to_csv(filename, index=False)
                return f"✅ Search results exported to {filename}"

            elif data_type == "census_analysis":
                if isinstance(data, dict) and "locations_found" in data:
                    df = pd.DataFrame(data["locations_found"])
                elif isinstance(data, list):
                    df = pd.DataFrame(data)
                else:
                    return "❌ Invalid census analysis format"
                df.to_csv(filename, index=False)
                return f"✅ Census analysis exported to {filename}"

            elif data_type == "hierarchy":
                if isinstance(data, dict) and "administrative_levels" in data:
                    # Flatten all levels into one DataFrame
                    all_locations = []
                    for level, locations in data["administrative_levels"].items():
                        for loc in locations:
                            loc["level"] = level
                            all_locations.append(loc)
                    df = pd.DataFrame(all_locations)
                    df.to_csv(filename, index=False)
                    return f"✅ Hierarchy analysis exported to {filename}"

            else:
                # Generic export
                if isinstance(data, list):
                    df = pd.DataFrame(data)
                elif isinstance(data, dict):
                    df = pd.DataFrame([data])
                else:
                    return f"❌ Cannot export data type: {type(data)}"

                df.to_csv(filename, index=False)
                return f"✅ Data exported to {filename}"

        except Exception as e:
            return f"❌ Export failed: {str(e)}"

    def generate_comprehensive_report(self, location_query: str, include_samples: bool = True) -> Dict[str, Any]:
        """
        Generate a comprehensive location report with all available data

        Args:
            location_query: Location to analyze (name, pincode, etc.)
            include_samples: Whether to include sample data in the report

        Returns:
            Complete report dictionary with all analysis results
        """
        print(f"\n🔍 GENERATING COMPREHENSIVE REPORT FOR: '{location_query}'")
        print("="*70)

        report = {
            "query": location_query,
            "report_generated": datetime.now().isoformat(),
            "basic_search": {},
            "pincode_analysis": {},
            "hierarchy_analysis": {},
            "export_files": [],
            "summary": {
                "total_locations_found": 0,
                "administrative_coverage": {},
                "data_quality_metrics": {}
            }
        }

        # 1. Basic search
        print("1️⃣  Performing comprehensive location search...")
        basic_search = self.search_locations(location_query, limit=25)
        report["basic_search"] = basic_search

        if basic_search.get("success") and "results" in basic_search:
            results = basic_search["results"]
            report["summary"]["total_locations_found"] = len(results)
            print(f"   ✅ Found {len(results)} locations")

            # Export basic search results
            if results:
                filename = f"comprehensive_search_{location_query.replace(' ', '_')}.csv"
                export_result = self.export_to_csv(basic_search, filename, "search_results")
                report["export_files"].append(filename)
                print(f"   {export_result}")

        # 2. Pincode analysis (if applicable)
        if location_query.isdigit() and len(location_query) == 6:
            print("2️⃣  Performing detailed pincode analysis...")
            pincode_analysis = self.analyze_pincode(location_query)
            report["pincode_analysis"] = pincode_analysis

            if pincode_analysis.get("success"):
                locations_count = len(pincode_analysis["locations_found"])
                admin_summary = pincode_analysis["administrative_summary"]
                print(f"   ✅ Pincode analysis complete - {locations_count} locations")
                print(f"   📊 Coverage: {len(admin_summary['states'])} states, {len(admin_summary['districts'])} districts")

                # Export pincode analysis
                filename = f"pincode_{location_query}_comprehensive_analysis.csv"
                export_result = self.export_to_csv(pincode_analysis, filename, "census_analysis")
                report["export_files"].append(filename)
                print(f"   {export_result}")

        # 3. Hierarchical analysis
        print("3️⃣  Performing administrative hierarchy analysis...")
        hierarchy_analysis = self.get_location_hierarchy(location_query)
        report["hierarchy_analysis"] = hierarchy_analysis

        if hierarchy_analysis.get("success"):
            levels = hierarchy_analysis["administrative_levels"]
            total_by_level = {level: len(locations) for level, locations in levels.items()}
            print(f"   ✅ Hierarchy analysis complete")
            print(f"   📊 Distribution: {dict(total_by_level)}")

            # Export hierarchy analysis
            filename = f"hierarchy_{location_query.replace(' ', '_')}_analysis.csv"
            export_result = self.export_to_csv(hierarchy_analysis, filename, "hierarchy")
            report["export_files"].append(filename)
            print(f"   {export_result}")

        # 4. Generate summary
        self._generate_report_summary(report)

        print("✅ Comprehensive report generation completed!")
        return report

    def _generate_report_summary(self, report: Dict[str, Any]) -> None:
        """Generate summary statistics for the comprehensive report"""
        basic_results = report["basic_search"].get("results", [])

        # Administrative coverage analysis
        states = set()
        districts = set()
        talukas = set()
        location_types = {}

        for result in basic_results:
            if result.get("state_name"):
                states.add(result["state_name"])
            if result.get("district_name"):
                districts.add(result["district_name"])
            if result.get("taluka_name"):
                talukas.add(result["taluka_name"])

            loc_type = self._classify_location_for_census(result)
            location_types[loc_type] = location_types.get(loc_type, 0) + 1

        report["summary"]["administrative_coverage"] = {
            "states_covered": list(states),
            "districts_covered": list(districts),
            "talukas_covered": list(talukas),
            "coverage_statistics": {
                "unique_states": len(states),
                "unique_districts": len(districts),
                "unique_talukas": len(talukas)
            },
            "location_type_distribution": location_types
        }

        # Data quality metrics
        report["summary"]["data_quality_metrics"] = {
            "locations_with_full_hierarchy": len([r for r in basic_results if r.get("state_name") and r.get("district_name") and r.get("taluka_name")]),
            "locations_with_codes": len([r for r in basic_results if r.get("code")]),
            "data_completeness_percentage": (len([r for r in basic_results if r.get("full_path")]) / len(basic_results) * 100) if basic_results else 0
        }

def main():
    """
    Main function demonstrating all API capabilities
    """
    # Initialize API client
    api = IndiaLocationHubAPI()

    print("\n🚀 STARTING COMPREHENSIVE API EXPLORATION")
    print("="*74)

    # 1. Get API overview
    print("\n1️⃣  API OVERVIEW AND STATISTICS")
    print("-" * 50)
    stats = api.get_api_statistics()
    if stats.get("success"):
        print(f"📊 Database contains:")
        print(f"   • States/UTs: {stats.get('totalStates', 'N/A')}")
        print(f"   • Districts: {stats.get('totalDistricts', 'N/A')}")
        print(f"   • Talukas: {stats.get('totalTalukas', 'N/A')}")
        print(f"   • Villages: {stats.get('totalVillages', 'N/A')}")

    # 2. Get all states data
    print("\n2️⃣  ALL STATES DATA ANALYSIS")
    print("-" * 50)
    states_data = api.get_all_states()
    if states_data.get("success"):
        states_list = states_data.get("states", [])
        print(f"📍 Retrieved {len(states_list)} states/UTs")

        # Export states data
        export_result = api.export_to_csv(states_list, "all_indian_states_comprehensive.csv", "states")
        print(f"   {export_result}")

        # Show statistics
        if states_list:
            df = pd.DataFrame(states_list)
            df['villages'] = df['villages'].astype(int)
            total_villages = df['villages'].sum()
            print(f"📊 Total villages across India: {total_villages:,}")

            # Top 5 states by village count
            top_states = df.nlargest(5, 'villages')
            print("🏆 Top 5 states by village count:")
            for i, (_, state) in enumerate(top_states.iterrows()):
                print(f"   {i+1}. {state['name']}: {state['villages']:,} villages")

    # 3. Demonstrate search functionality
    print("\n3️⃣  SEARCH FUNCTIONALITY DEMONSTRATION")
    print("-" * 50)

    search_examples = [
        ("Mumbai", "Major city search"),
        ("110001", "Pincode search"), 
        ("Anand", "Common name search"),
        ("Kerala", "State search")
    ]

    for query, description in search_examples:
        print(f"\n🔍 {description}: '{query}'")
        search_result = api.search_locations(query, limit=8)

        if search_result.get("success") and "results" in search_result:
            results = search_result["results"]
            print(f"   Found {len(results)} locations")

            # Show sample results
            for i, result in enumerate(results[:3]):
                print(f"     {i+1}. {result.get('full_path', result.get('name', 'N/A'))}")

            if len(results) > 3:
                print(f"     ... and {len(results)-3} more")

            # Export results
            filename = f"search_{query.replace(' ', '_')}_results.csv"
            export_result = api.export_to_csv(search_result, filename, "search_results")
            print(f"   {export_result}")

    # 4. Pincode analysis demonstration
    print("\n4️⃣  PINCODE ANALYSIS DEMONSTRATION")
    print("-" * 50)

    sample_pincodes = ["110001", "400001", "560001"]

    for pincode in sample_pincodes:
        print(f"\n📮 Analyzing pincode {pincode}:")
        analysis = api.analyze_pincode(pincode)

        if analysis.get("success"):
            locations = analysis["locations_found"]
            admin_summary = analysis["administrative_summary"]

            print(f"   📊 Results: {len(locations)} locations found")
            print(f"   🗺️  Coverage: {len(admin_summary['states'])} states, {len(admin_summary['districts'])} districts")

            if locations:
                print(f"   🏠 Primary location: {locations[0]['name']}")

            # Export analysis
            filename = f"pincode_{pincode}_detailed_analysis.csv"
            export_result = api.export_to_csv(analysis, filename, "census_analysis")
            print(f"   {export_result}")

    # 5. State demographic analysis
    print("\n5️⃣  STATE DEMOGRAPHIC ANALYSIS")
    print("-" * 50)

    # Analyze a sample state
    state_to_analyze = "GOA"  # Smaller state for complete analysis
    print(f"\n🏛️  Analyzing {state_to_analyze}:")

    state_analysis = api.analyze_state_demographics(state_to_analyze)
    if state_analysis.get("success"):
        stats = state_analysis["demographic_statistics"]
        print(f"   📊 Districts: {stats['total_districts']}")
        print(f"   📊 Sample talukas analyzed: {stats['sample_talukas_analyzed']}")
        print(f"   📊 Sample villages retrieved: {stats['sample_villages_retrieved']}")

        # Export state analysis
        if state_analysis["all_districts"]:
            filename = f"{state_to_analyze.lower()}_demographic_analysis.csv"
            districts_df = pd.DataFrame(state_analysis["all_districts"])
            api.export_to_csv(state_analysis["all_districts"], filename, "states")
            print(f"   ✅ Exported districts to {filename}")

    # 6. Generate comprehensive reports
    print("\n6️⃣  COMPREHENSIVE REPORT GENERATION")
    print("-" * 50)

    report_queries = ["400001", "Pune"]

    for query in report_queries:
        print(f"\n📋 Generating report for '{query}':")
        report = api.generate_comprehensive_report(query)

        if report["basic_search"].get("success"):
            summary = report["summary"]
            print(f"   📊 Total locations: {summary['total_locations_found']}")

            coverage = summary.get("administrative_coverage", {})
            if coverage:
                stats = coverage.get("coverage_statistics", {})
                print(f"   🗺️  Administrative coverage: {stats.get('unique_states', 0)} states, {stats.get('unique_districts', 0)} districts")

            print(f"   📁 Files generated: {len(report['export_files'])}")

    # Final summary
    print("\n" + "="*74)
    print("🎉 COMPREHENSIVE API EXPLORATION COMPLETED!")
    print("="*74)
    print("\n📋 SUMMARY OF CAPABILITIES DEMONSTRATED:")
    print("   ✅ Database statistics and API overview")
    print("   ✅ Complete state and administrative data retrieval")
    print("   ✅ Advanced location search functionality")
    print("   ✅ Pincode-based census analysis")
    print("   ✅ State demographic structure analysis")
    print("   ✅ Administrative hierarchy mapping")
    print("   ✅ Comprehensive location reporting")
    print("   ✅ Multi-format data export (CSV)")
    print("   ✅ Census-ready data extraction")

    print("\n🎯 API ADVANTAGES:")
    print("   • Completely FREE - No authentication required")
    print("   • No rate limits - Unlimited usage")
    print("   • Real-time data - Always up-to-date")
    print("   • Complete coverage - 500,000+ locations")
    print("   • Census-ready - Hierarchical administrative data")
    print("   • Export-friendly - CSV format for analysis")

    print("\n🇮🇳 Ready for comprehensive census data analysis!")
    print("="*74)

if __name__ == "__main__":
    main()
