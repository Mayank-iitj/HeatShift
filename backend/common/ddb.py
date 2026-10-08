"""DynamoDB helpers for HeatShift.

Provides table access, CRUD operations, and stream utilities.
Uses single-table design patterns where appropriate.
"""

import os
import time
import uuid
from datetime import datetime, timezone, timedelta
from typing import Any, Optional

import boto3
from boto3.dynamodb.conditions import Key, Attr

IST = timezone(timedelta(hours=5, minutes=30))

_ddb_resource = None
_ddb_client = None


def _get_resource():
    global _ddb_resource
    if _ddb_resource is None:
        endpoint = os.environ.get("DDB_ENDPOINT_URL")
        kwargs = {"region_name": os.environ.get("AWS_REGION", "ap-south-1")}
        if endpoint:
            kwargs["endpoint_url"] = endpoint
        _ddb_resource = boto3.resource("dynamodb", **kwargs)
    return _ddb_resource


def _get_client():
    global _ddb_client
    if _ddb_client is None:
        endpoint = os.environ.get("DDB_ENDPOINT_URL")
        kwargs = {"region_name": os.environ.get("AWS_REGION", "ap-south-1")}
        if endpoint:
            kwargs["endpoint_url"] = endpoint
        _ddb_client = boto3.client("dynamodb", **kwargs)
    return _ddb_client


def _table_name(suffix: str) -> str:
    prefix = os.environ.get("DDB_TABLE_PREFIX", "HeatShift")
    return f"{prefix}-{suffix}"


def _table(suffix: str):
    return _get_resource().Table(_table_name(suffix))


def now_iso() -> str:
    return datetime.now(IST).isoformat()


def generate_id() -> str:
    return str(uuid.uuid4())[:8]


def generate_link_code() -> str:
    """Generate a 6-character alphanumeric link code."""
    return str(uuid.uuid4())[:6].upper()


# --- Zones / Readings ---

def put_reading(reading: dict) -> None:
    """Store a zone-hour reading."""
    table = _table("Readings")
    reading["ttl"] = int(time.time()) + 7 * 86400  # 7-day TTL
    table.put_item(Item=reading)


def get_latest_readings(zone_id: str, limit: int = 72) -> list[dict]:
    """Get the most recent readings for a zone."""
    table = _table("Readings")
    resp = table.query(
        KeyConditionExpression=Key("zone_id").eq(zone_id),
        ScanIndexForward=False,
        Limit=limit,
    )
    return resp.get("Items", [])


def get_all_zones_latest() -> list[dict]:
    """Get the latest reading for each zone (scan + filter)."""
    table = _table("Readings")
    # Use a GSI or scan — for 12 zones this is fine
    from backend.common.config import load_zones
    zones = load_zones()
    results = []
    for z in zones:
        readings = get_latest_readings(z["id"], limit=1)
        if readings:
            results.append(readings[0])
    return results


# --- Sites ---

def put_site(site: dict) -> None:
    table = _table("Sites")
    table.put_item(Item=site)


def get_site(site_id: str) -> Optional[dict]:
    table = _table("Sites")
    resp = table.get_item(Key={"site_id": site_id})
    return resp.get("Item")


def get_sites_by_zone(zone_id: str) -> list[dict]:
    table = _table("Sites")
    resp = table.query(
        IndexName="zone-index",
        KeyConditionExpression=Key("zone_id").eq(zone_id),
    )
    return resp.get("Items", [])


def get_all_sites() -> list[dict]:
    table = _table("Sites")
    resp = table.scan()
    return resp.get("Items", [])


def get_site_by_link_code(code: str) -> Optional[dict]:
    table = _table("Sites")
    resp = table.scan(
        FilterExpression=Attr("link_code").eq(code),
    )
    items = resp.get("Items", [])
    return items[0] if items else None


def update_site_telegram(site_id: str, chat_id: str) -> None:
    table = _table("Sites")
    table.update_item(
        Key={"site_id": site_id},
        UpdateExpression="SET telegram_chat_id = :cid",
        ExpressionAttributeValues={":cid": chat_id},
    )


# --- Plans ---

def put_plan(plan: dict) -> None:
    table = _table("Plans")
    table.put_item(Item=plan)


def get_latest_plan(site_id: str) -> Optional[dict]:
    table = _table("Plans")
    resp = table.query(
        KeyConditionExpression=Key("site_id").eq(site_id),
        ScanIndexForward=False,
        Limit=1,
    )
    items = resp.get("Items", [])
    return items[0] if items else None


def get_plans_for_site(site_id: str, limit: int = 10) -> list[dict]:
    table = _table("Plans")
    resp = table.query(
        KeyConditionExpression=Key("site_id").eq(site_id),
        ScanIndexForward=False,
        Limit=limit,
    )
    return resp.get("Items", [])


# --- Alerts ---

def put_alert(alert: dict) -> None:
    table = _table("Alerts")
    table.put_item(Item=alert)


def get_alerts_for_site(site_id: str, limit: int = 10) -> list[dict]:
    table = _table("Alerts")
    resp = table.query(
        KeyConditionExpression=Key("site_id").eq(site_id),
        ScanIndexForward=False,
        Limit=limit,
    )
    return resp.get("Items", [])


# --- Confirmations ---

def put_confirmation(confirmation: dict) -> None:
    table = _table("Confirmations")
    table.put_item(Item=confirmation)


def get_confirmations_for_site(site_id: str, limit: int = 10) -> list[dict]:
    table = _table("Confirmations")
    resp = table.query(
        KeyConditionExpression=Key("site_id").eq(site_id),
        ScanIndexForward=False,
        Limit=limit,
    )
    return resp.get("Items", [])


# --- Metrics ---

def put_metric(metric: dict) -> None:
    table = _table("Metrics")
    table.put_item(Item=metric)


def get_metrics_totals() -> dict:
    """Get aggregate metrics. Simple scan for small dataset."""
    table = _table("Metrics")
    resp = table.scan()
    items = resp.get("Items", [])
    totals = {
        "total_exposure_hours_avoided": 0.0,
        "total_sites_confirmed": 0,
        "total_plans_generated": 0,
        "total_alerts_sent": 0,
    }
    for item in items:
        totals["total_exposure_hours_avoided"] += float(
            item.get("exposure_hours_avoided", 0)
        )
        totals["total_sites_confirmed"] += int(item.get("confirmed", 0))
        totals["total_plans_generated"] += int(item.get("plans_generated", 0))
        totals["total_alerts_sent"] += int(item.get("alerts_sent", 0))
    return totals


def increment_metric(metric_key: str, field: str, value: float = 1) -> None:
    """Atomically increment a metric counter."""
    from decimal import Decimal
    table = _table("Metrics")
    table.update_item(
        Key={"metric_key": metric_key},
        UpdateExpression=f"ADD {field} :val",
        ExpressionAttributeValues={":val": Decimal(str(value))},
    )


# --- State ---

def get_state() -> dict:
    table = _table("State")
    resp = table.get_item(Key={"state_key": "global"})
    return resp.get("Item", {"state_key": "global", "mode": "LIVE"})


def put_state(state: dict) -> None:
    table = _table("State")
    state["state_key"] = "global"
    table.put_item(Item=state)


# --- WebSocket Connections ---

def put_connection(connection_id: str, subscribed_to: str = "global") -> None:
    table = _table("Connections")
    table.put_item(Item={
        "connection_id": connection_id,
        "subscribed_to": subscribed_to,
        "connected_at": now_iso(),
        "ttl": int(time.time()) + 24 * 3600,
    })


def delete_connection(connection_id: str) -> None:
    table = _table("Connections")
    table.delete_item(Key={"connection_id": connection_id})


def get_connections(subscribed_to: Optional[str] = None) -> list[dict]:
    table = _table("Connections")
    if subscribed_to:
        resp = table.query(
            IndexName="subscription-index",
            KeyConditionExpression=Key("subscribed_to").eq(subscribed_to),
        )
    else:
        resp = table.scan()
    return resp.get("Items", [])


# --- Feed Events ---

def put_feed_event(event: dict) -> None:
    table = _table("Feed")
    event["ttl"] = int(time.time()) + 24 * 3600
    table.put_item(Item=event)


def get_feed(limit: int = 50) -> list[dict]:
    """Get recent feed events, newest first."""
    table = _table("Feed")
    # Scan and sort in memory for simplicity (small dataset)
    resp = table.scan(Limit=limit * 2)
    items = resp.get("Items", [])
    items.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
    return items[:limit]
