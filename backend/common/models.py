"""Pydantic models for HeatShift data structures."""

from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


class DataMode(str, Enum):
    LIVE = "LIVE"
    REPLAY = "REPLAY"


class GeneratedBy(str, Enum):
    AGENT = "agent"
    RULES = "rules"


class BlockType(str, Enum):
    WORK = "work"
    REST = "rest"
    SHIFT_HINT = "shift_hint"


class ConfirmationDecision(str, Enum):
    CONFIRMED = "confirmed"
    REJECTED = "rejected"


class ZoneReading(BaseModel):
    """Hourly weather reading and risk assessment for a zone."""
    zone_id: str
    timestamp: str  # ISO 8601
    temperature: float
    relative_humidity: float
    apparent_temperature: float
    wet_bulb: float
    effective_apparent: float
    tier: int
    tier_label: str
    shortwave_radiation: Optional[float] = None
    wind_speed: Optional[float] = None
    precipitation: Optional[float] = None
    data_mode: DataMode = DataMode.LIVE
    stale: bool = False
    ingested_at: Optional[str] = None


class SiteProfile(BaseModel):
    """Contractor site registration."""
    site_id: Optional[str] = None
    name: str
    zone_id: str
    worker_count: int = Field(ge=1, le=500)
    over50_share: float = Field(ge=0.0, le=1.0, default=0.0)
    unshaded: bool = False
    heavy_labor: bool = False
    shift_start: int = Field(ge=0, le=23, default=8)  # hour IST
    shift_end: int = Field(ge=0, le=23, default=18)    # hour IST
    contact_email: Optional[str] = None
    telegram_chat_id: Optional[str] = None
    link_code: Optional[str] = None
    created_at: Optional[str] = None
    data_mode: DataMode = DataMode.LIVE


class WorkBlock(BaseModel):
    """A single work or rest block in a plan."""
    start: int  # hour IST (0-23)
    end: int    # hour IST (0-23)
    type: BlockType
    intensity: Optional[str] = None  # "light", "moderate", "heavy"
    continuous_minutes: int = 60
    tier: Optional[int] = None


class CedarDecision(BaseModel):
    """Record of a Cedar policy evaluation."""
    block_index: int
    action: str = "ScheduleWork"
    decision: str  # "allow" or "deny"
    reasons: list[str] = []
    policy_ids: list[str] = []


class CoolingPoint(BaseModel):
    """A nearby cooling or water point."""
    name: str
    type: str  # "drinking_water", "library", etc.
    lat: float
    lon: float
    distance_km: float


class SitePlan(BaseModel):
    """Agent or rule-generated work plan for a site-day."""
    plan_id: Optional[str] = None
    date: str  # YYYY-MM-DD
    zone_id: str
    site_id: str
    overall_tier_max: int
    blocks: list[WorkBlock]
    recommended_shift_start: Optional[int] = None
    recommended_shift_end: Optional[int] = None
    rest_rule: str
    hydration_note: str
    cooling_points: list[CoolingPoint] = []
    messages: dict[str, str] = {}  # {"en": "...", "hi": "..."}
    trace: list[dict] = []  # agent tool call trace
    generated_by: GeneratedBy = GeneratedBy.RULES
    cedar_decisions: list[CedarDecision] = []
    tier_signature: Optional[str] = None  # for caching
    created_at: Optional[str] = None
    data_mode: DataMode = DataMode.LIVE


class Alert(BaseModel):
    """Alert sent to a contractor."""
    alert_id: Optional[str] = None
    site_id: str
    plan_id: str
    channel: str  # "telegram", "email", "sms"
    message_lang: str = "en"
    message_text: str
    sent_at: Optional[str] = None
    delivered: bool = False
    data_mode: DataMode = DataMode.LIVE


class Confirmation(BaseModel):
    """Contractor's response to an alert."""
    confirmation_id: Optional[str] = None
    site_id: str
    plan_id: str
    alert_id: Optional[str] = None
    decision: ConfirmationDecision
    source: str = "telegram"  # "telegram" or "web"
    exposure_hours_avoided: float = 0.0  # modeled
    confirmed_at: Optional[str] = None
    data_mode: DataMode = DataMode.LIVE


class AppState(BaseModel):
    """Global application state."""
    mode: DataMode = DataMode.LIVE
    replay_date: Optional[str] = None
    replay_virtual_time: Optional[str] = None
    replay_speed: int = 1  # hours per tick
    replay_execution_arn: Optional[str] = None
    last_ingest: Optional[str] = None


class WebSocketConnection(BaseModel):
    """Tracked WebSocket connection."""
    connection_id: str
    subscribed_to: str = "global"  # "global" or site_id
    connected_at: str
    ttl: int  # epoch seconds


class FeedEvent(BaseModel):
    """Event for the live feed."""
    event_id: Optional[str] = None
    event_type: str  # "reading", "plan", "alert", "confirmation", "metric", "clock"
    zone_id: Optional[str] = None
    site_id: Optional[str] = None
    summary: str
    summary_hi: Optional[str] = None
    data: dict = {}
    timestamp: str
    data_mode: DataMode = DataMode.LIVE
