"""WebSocket connect handler."""

import json
import logging
import os
import sys

sys.path.insert(0, "/opt/python")
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from backend.common import ddb

logger = logging.getLogger()
logger.setLevel(logging.INFO)


def lambda_handler(event, context):
    """Handle $connect and subscribe routes."""
    logger.info(f"WS event: {json.dumps(event)[:300]}")

    route_key = event.get("requestContext", {}).get("routeKey", "$connect")
    connection_id = event["requestContext"]["connectionId"]

    if route_key == "$connect":
        ddb.put_connection(connection_id, "global")
        return {"statusCode": 200, "body": "Connected"}

    elif route_key == "subscribe":
        body = json.loads(event.get("body", "{}"))
        channel = body.get("channel", "global")
        ddb.put_connection(connection_id, channel)
        return {"statusCode": 200, "body": json.dumps({"subscribed": channel})}

    return {"statusCode": 200, "body": "OK"}
