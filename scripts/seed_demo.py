"""Seed demo data for HeatShift.

Creates a few registered sites in the local or remote DynamoDB so the UI
has something to show immediately without requiring registration.
"""

import logging
import os
import sys
import time

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from backend.common import ddb
from backend.common.config import load_zones
from backend.common.time_utils import format_iso, now_ist

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def main():
    zones = load_zones()
    if not zones:
        logger.error("No zones found")
        return

    # Seed 3 sites in different zones
    demo_sites = [
        {
            "name": "Okhla Hub Logistics",
            "zone_idx": 3,  # Okhla Industrial
            "worker_count": 45,
            "over50_share": 0.15,
            "unshaded": True,
            "heavy_labor": True,
            "shift_start": 8,
            "shift_end": 18,
        },
        {
            "name": "Connaught Place Delivery",
            "zone_idx": 0,  # Connaught Place
            "worker_count": 120,
            "over50_share": 0.25,
            "unshaded": False,
            "heavy_labor": False,
            "shift_start": 9,
            "shift_end": 19,
        },
        {
            "name": "Dwarka Construction Sector 10",
            "zone_idx": 1,  # Dwarka
            "worker_count": 80,
            "over50_share": 0.35, # Vulnerable
            "unshaded": True,
            "heavy_labor": True,
            "shift_start": 7,
            "shift_end": 17,
        }
    ]

    count = 0
    for s in demo_sites:
        zone = zones[s["zone_idx"]]
        site_id = f"demo_{count + 1}"
        
        # Check if exists
        existing = ddb.get_site(site_id)
        if existing:
            logger.info(f"Site {site_id} already exists, skipping")
            continue
            
        link_code = ddb.generate_link_code()
        
        site = {
            "site_id": site_id,
            "name": s["name"],
            "zone_id": zone["id"],
            "worker_count": s["worker_count"],
            "over50_share": s["over50_share"],
            "unshaded": s["unshaded"],
            "heavy_labor": s["heavy_labor"],
            "shift_start": s["shift_start"],
            "shift_end": s["shift_end"],
            "contact_email": None,
            "telegram_chat_id": None,
            "link_code": link_code,
            "created_at": format_iso(now_ist()),
            "data_mode": ddb.get_state().get("mode", "LIVE"),
        }
        
        ddb.put_site(site)
        
        ddb.put_feed_event({
            "event_type": "site",
            "timestamp": format_iso(now_ist()),
            "site_id": site_id,
            "zone_id": zone["id"],
            "summary": f"Demo site '{s['name']}' seeded in zone {zone['id']}",
            "data_mode": site["data_mode"],
            "data": {"site_id": site_id},
        })
        
        logger.info(f"Seeded site {site_id}: {s['name']}")
        count += 1
        
    logger.info(f"Seeded {count} demo sites.")

if __name__ == "__main__":
    main()
