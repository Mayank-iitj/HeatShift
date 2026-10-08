# HeatShift Decisions Log

This document records design decisions made during development, especially
where the build prompt was ambiguous or multiple valid approaches existed.

## Phase 1 — Foundation

### D001: Wet-bulb approximation rounding
**Decision:** Round wet-bulb output to 2 decimal places for readability and
DynamoDB storage. The Stull (2011) approximation itself has ~1°C accuracy,
so further decimal places are not meaningful.

### D002: DynamoDB table design
**Decision:** Use separate tables per entity type (Readings, Sites, Plans,
Alerts, Confirmations, Metrics, State, Connections, Feed) rather than
single-table design. Rationale: separate DynamoDB Streams per entity type
enable targeted fan-out without Lambda filter complexity. PAY_PER_REQUEST
billing keeps free-tier friendly.

### D003: Zone coordinates
**Decision:** Used representative point coordinates for each of the 12 Delhi
zones. These are approximate central points, not administrative boundaries.
No polygon/boundary data is used to keep the scope narrow.

### D004: Bedrock model selection
**Decision:** Default to `anthropic.claude-3-haiku-20240307-v1:0` as the
primary model for cost efficiency. Document that the user should verify
model availability in `ap-south-1` and may need to enable model access
in the Bedrock console. A deterministic fallback planner ensures the
system works even without Bedrock access.

### D005: Tier boundary semantics
**Decision:** Tier boundaries use `<` for the upper threshold of the lower
tier. So exactly 32.0°C apparent temperature is tier 1 (Moderate), not
tier 0 (Low). This matches "32–38" range in the spec.

### D006: Lambda layer vs. inline code
**Decision:** Use a SAM Lambda Layer for shared `backend/common/` code to
avoid duplicating it in each function's CodeUri. The Makefile `build-layer`
target prepares this.

### D007: Time handling
**Decision:** All timestamps stored as ISO 8601 with IST offset (+05:30).
Internal computation uses Python `datetime` with `timezone(timedelta(hours=5.5))`.
DynamoDB sort keys use ISO timestamps for natural ordering.
