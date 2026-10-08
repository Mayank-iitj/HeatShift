// HeatShift Work-Safety Policies

@id("permit_baseline")
permit(
    principal,
    action == HeatShift::Action::"ScheduleWork",
    resource
)
when {
    resource.tier <= 3
};

@id("forbid_extreme_heavy_unshaded")
forbid(
    principal,
    action == HeatShift::Action::"ScheduleWork",
    resource
)
when {
    resource.tier == 3 &&
    (principal.heavy_labor || principal.unshaded)
};

@id("forbid_extreme_peak_hours")
forbid(
    principal,
    action == HeatShift::Action::"ScheduleWork",
    resource
)
when {
    resource.tier == 3 &&
    (resource.start_hour >= 12 && resource.start_hour < 16)
};

@id("forbid_high_tier_continuous_standard")
forbid(
    principal,
    action == HeatShift::Action::"ScheduleWork",
    resource
)
when {
    resource.tier == 2 &&
    resource.continuous_minutes > 45
};

@id("forbid_high_tier_continuous_vulnerable")
forbid(
    principal,
    action == HeatShift::Action::"ScheduleWork",
    resource
)
when {
    resource.tier == 2 &&
    principal.over50_share.greaterThan(decimal("0.30")) &&
    resource.continuous_minutes > 30
};

@id("forbid_moderate_tier_continuous")
forbid(
    principal,
    action == HeatShift::Action::"ScheduleWork",
    resource
)
when {
    resource.tier == 1 &&
    resource.continuous_minutes > 90
};
