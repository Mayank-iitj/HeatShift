"""WebSocket fan-out handler.

Triggered by DynamoDB Streams on Readings, Plans, Alerts, Confirmations.
Pushes typed events to all connected WebSocket clients.
"""

import json
import logging
import os
import sys
from decimal import Decimal

import boto3

sys.path.insert(0, "/opt/python")
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from backend.common import ddb

logger = logging.getLogger()
logger.setLevel(logging.INFO)


class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj) if obj % 1 else int(obj)
        return super().default(obj)


def _get_api_client():
    url = os.environ.get("WEBSOCKET_API_URL", "")
    if not url:
        return None
    # Convert wss:// to https:// for management API
    endpoint = url.replace("wss://", "https://")
    return boto3.client(
        "apigatewaymanagementapi",
        endpoint_url=endpoint,
        region_name=os.environ.get("AWS_REGION", "ap-south-1"),
    )


def _determine_event_type(event_source_arn: str) -> str:
    """Determine event type from the DynamoDB stream ARN."""
    arn_lower = event_source_arn.lower()
    if "readings" in arn_lower:
        return "reading"
    elif "plans" in arn_lower:
        return "plan"
    elif "alerts" in arn_lower:
        return "alert"
    elif "confirmations" in arn_lower:
        return "confirmation"
    return "unknown"


def lambda_handler(event, context):
    logger.info(f"Fan-out: {len(event.get('Records', []))} records")

    api_client = _get_api_client()
    if not api_client:
        logger.warning("No WebSocket API URL configured")
        return {"statusCode": 200}

    for record in event.get("Records", []):
        if record.get("eventName") not in ("INSERT", "MODIFY"):
            continue

        new_image = record.get("dynamodb", {}).get("NewImage", {})
        if not new_image:
            continue

        # Deserialize DynamoDB format to plain dict
        from boto3.dynamodb.types import TypeDeserializer
        deserializer = TypeDeserializer()
        item = {k: deserializer.deserialize(v) for k, v in new_image.items()}

        event_type = _determine_event_type(record.get("eventSourceARN", ""))
        zone_id = item.get("zone_id")
        site_id = item.get("site_id")

        payload = json.dumps({
            "type": event_type,
            "data": item,
            "zone_id": zone_id,
            "site_id": site_id,
        }, cls=DecimalEncoder)

        # Get all connections (global + specific subscriptions)
        targets = set()
        global_conns = ddb.get_connections("global")
        for c in global_conns:
            targets.add(c["connection_id"])

        if site_id:
            site_conns = ddb.get_connections(site_id)
            for c in site_conns:
                targets.add(c["connection_id"])

        if zone_id:
            zone_conns = ddb.get_connections(zone_id)
            for c in zone_conns:
                targets.add(c["connection_id"])

        # Send to all targets
        stale_connections = []
        for conn_id in targets:
            try:
                api_client.post_to_connection(
                    ConnectionId=conn_id,
                    Data=payload.encode("utf-8"),
                )
            except api_client.exceptions.GoneException:
                stale_connections.append(conn_id)
            except Exception as e:
                logger.warning(f"Failed to send to {conn_id}: {e}")

        # Clean up stale connections
        for conn_id in stale_connections:
            try:
                ddb.delete_connection(conn_id)
            except Exception:
                pass

    return {"statusCode": 200}
