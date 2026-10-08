"""Build cached cooling points data from OpenStreetMap.

Queries Overpass API for amenities like drinking water and libraries
near each zone, and caches to data/cooling_points.json.
"""

import json
import logging
import os
import sys
import time

import requests

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from backend.common.config import load_zones, _find_data_dir

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

OVERPASS_URL = "https://overpass-api.de/api/interpreter"

def get_cooling_points(lat: float, lon: float, radius: int = 3000) -> list[dict]:
    """Query Overpass API for points within radius."""
    query = f"""
    [out:json][timeout:25];
    (
      node["amenity"="drinking_water"](around:{radius},{lat},{lon});
      node["amenity"="water_point"](around:{radius},{lat},{lon});
      node["amenity"="library"](around:{radius},{lat},{lon});
      node["amenity"="community_centre"](around:{radius},{lat},{lon});
    );
    out body;
    >;
    out skel qt;
    """
    
    for attempt in range(3):
        try:
            response = requests.post(OVERPASS_URL, data={'data': query}, timeout=30)
            response.raise_for_status()
            data = response.json()
            break
        except Exception as e:
            logger.warning(f"Attempt {attempt+1} failed: {e}")
            if attempt == 2:
                return []
            time.sleep(2)
            
    points = []
    for element in data.get("elements", []):
        if element.get("type") == "node":
            tags = element.get("tags", {})
            name = tags.get("name")
            if not name:
                amenity = tags.get("amenity", "water_point")
                name = amenity.replace("_", " ").title()
                
            points.append({
                "name": name,
                "type": tags.get("amenity", "unknown"),
                "lat": element.get("lat"),
                "lon": element.get("lon"),
            })
            
    # Sort by distance (simple approx)
    def dist_sq(p):
        return (p["lat"] - lat)**2 + (p["lon"] - lon)**2
        
    points.sort(key=dist_sq)
    return points


def main():
    zones = load_zones()
    all_points = []
    
    for zone in zones:
        logger.info(f"Fetching points for {zone['name']}")
        points = get_cooling_points(zone["lat"], zone["lon"])
        
        # Approximate distance in km (1 deg ~ 111 km)
        for p in points:
            dist_km = ((p["lat"] - zone["lat"])**2 + (p["lon"] - zone["lon"])**2)**0.5 * 111.0
            p["distance_km"] = round(dist_km, 2)
            p["zone_id"] = zone["id"]
            
        all_points.extend(points)
        
        # Be nice to Overpass
        time.sleep(1)
        
    data_dir = _find_data_dir()
    out_file = data_dir / "cooling_points.json"
    
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(all_points, f, indent=2, ensure_ascii=False)
        
    logger.info(f"Saved {len(all_points)} cooling points to {out_file}")

if __name__ == "__main__":
    main()
