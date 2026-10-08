"""WebSocket disconnect handler."""

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
    connection_id = event["requestContext"]["connectionId"]
    ddb.delete_connection(connection_id)
    logger.info(f"Disconnected: {connection_id}")
    return {"statusCode": 200, "body": "Disconnected"}
