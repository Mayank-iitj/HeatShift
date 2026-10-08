"""Time utilities for HeatShift.

Handles IST conversion, virtual clock for replay mode, and
time-related formatting.
"""

from datetime import datetime, timezone, timedelta

IST = timezone(timedelta(hours=5, minutes=30))


def now_ist() -> datetime:
    """Current time in IST."""
    return datetime.now(IST)


def to_ist(dt: datetime) -> datetime:
    """Convert a datetime to IST."""
    return dt.astimezone(IST)


def parse_iso(s: str) -> datetime:
    """Parse an ISO 8601 string to a timezone-aware datetime."""
    dt = datetime.fromisoformat(s)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=IST)
    return dt


def format_iso(dt: datetime) -> str:
    """Format a datetime as ISO 8601 string."""
    return dt.isoformat()


def format_ist_display(dt: datetime) -> str:
    """Format a datetime for display in IST: 'Tue, 14 May 14:00 IST'."""
    ist_dt = to_ist(dt)
    return ist_dt.strftime("%a, %d %b %H:%M IST")


def hour_range(start_hour: int, end_hour: int) -> list[int]:
    """Generate list of hours from start to end (exclusive).

    Handles overnight wrapping (e.g., 22 to 6).
    """
    if start_hour <= end_hour:
        return list(range(start_hour, end_hour))
    else:
        return list(range(start_hour, 24)) + list(range(0, end_hour))


def is_stale(last_ingest_iso: str, max_age_minutes: int = 90) -> bool:
    """Check if a reading is stale (older than max_age_minutes)."""
    if not last_ingest_iso:
        return True
    last = parse_iso(last_ingest_iso)
    delta = now_ist() - last
    return delta.total_seconds() > max_age_minutes * 60
