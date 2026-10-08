"""Build replay dataset for HeatShift demo.

Fetches historical ERA5 and forecast data for the hottest stretch in Delhi
during the 2024 pre-monsoon season, and caches it for replay mode.
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

ARCHIVE_URL = "https://archive-api.open-meteo.com/v1/archive"
PREVIOUS_URL = "https://previous-runs-api.open-meteo.com/v1/forecast"

def fetch_data(url: str, params: dict) -> dict:
    for attempt in range(3):
        try:
            resp = requests.get(url, params=params, timeout=30)
            resp.raise_for_status()
            return resp.json()
        except Exception as e:
            logger.warning(f"Fetch failed: {e}")
            if attempt == 2:
                raise
            time.sleep(2)


def main():
    zones = load_zones()
    data_dir = _find_data_dir()
    replay_dir = data_dir / "replay"
    replay_dir.mkdir(parents=True, exist_ok=True)
    
    # We choose May 20 to May 30 2024 as the peak heat wave
    start_date = "2024-05-20"
    end_date = "2024-05-30"
    
    lats = ",".join(str(z["lat"]) for z in zones)
    lons = ",".join(str(z["lon"]) for z in zones)
    
    logger.info(f"Fetching replay dataset for {start_date} to {end_date}")
    
    # We fetch Previous Runs (1-day lead time) to simulate forecast
    params = {
        "latitude": lats,
        "longitude": lons,
        "start_date": start_date,
        "end_date": end_date,
        "hourly": "temperature_2m,relative_humidity_2m,apparent_temperature,shortwave_radiation,wind_speed_10m",
        "timezone": "Asia/Kolkata",
        "models": "best_match"
    }
    
    data = fetch_data(PREVIOUS_URL, params)
    
    if not isinstance(data, list):
        data = [data]
        
    for i, zone in enumerate(zones):
        zone_data = data[i]
        out_file = replay_dir / f"{zone['id']}.json"
        with open(out_file, "w") as f:
            json.dump(zone_data, f)
            
    logger.info("Replay dataset built.")

if __name__ == "__main__":
    main()
