"""Internationalization helpers for HeatShift.

Provides bilingual (English + Hindi) message generation.
Hindi text is in Devanagari script.
"""

import re


def contains_devanagari(text: str) -> bool:
    """Check if text contains Devanagari characters."""
    return bool(re.search(r'[\u0900-\u097F]', text))


def tier_label(tier: int, lang: str = "en") -> str:
    """Return localized tier label."""
    labels = {
        "en": {0: "Low", 1: "Moderate", 2: "High", 3: "Extreme"},
        "hi": {0: "कम", 1: "मध्यम", 2: "अधिक", 3: "अत्यधिक"},
    }
    return labels.get(lang, labels["en"]).get(tier, "Unknown")


def format_hour_range(start: int, end: int, lang: str = "en") -> str:
    """Format an hour range as human-readable text."""
    def _fmt(h: int) -> str:
        if lang == "hi":
            if h == 0:
                return "12 AM"
            elif h < 12:
                return f"{h} AM"
            elif h == 12:
                return "12 PM"
            else:
                return f"{h - 12} PM"
        else:
            if h == 0:
                return "12 AM"
            elif h < 12:
                return f"{h} AM"
            elif h == 12:
                return "12 PM"
            else:
                return f"{h - 12} PM"
    return f"{_fmt(start)}–{_fmt(end)}"


def build_plan_message(
    zone_name: str,
    zone_name_hi: str,
    date_str: str,
    overall_tier_max: int,
    recommended_start: int,
    recommended_end: int,
    rest_rule: str,
    rest_rule_hi: str,
    hydration: str,
    hydration_hi: str,
    cooling_point_name: str = "",
    dangerous_hours: str = "",
    dangerous_hours_hi: str = "",
    lang: str = "en",
) -> str:
    """Build a templated plan message (fallback if agent Hindi fails).

    Kept under 600 characters, no emojis, action-first.
    """
    if lang == "hi":
        parts = [
            f"दिल्ली {zone_name_hi}, {date_str}:",
        ]
        if overall_tier_max >= 2:
            parts.append(f"अत्यधिक गर्मी {dangerous_hours_hi}।")
        parts.append(
            f"काम का समय {format_hour_range(recommended_start, recommended_end, 'hi')}।"
        )
        parts.append(f"{rest_rule_hi}।")
        parts.append(f"{hydration_hi}")
        if cooling_point_name:
            parts.append(f"पानी: {cooling_point_name}।")
        msg = " ".join(parts)
    else:
        parts = [
            f"Delhi {zone_name}, {date_str}:",
        ]
        if overall_tier_max >= 2:
            parts.append(f"Extreme heat {dangerous_hours}.")
        parts.append(
            f"Work {format_hour_range(recommended_start, recommended_end)}."
        )
        parts.append(f"{rest_rule}.")
        parts.append(hydration)
        if cooling_point_name:
            parts.append(f"Water: {cooling_point_name}.")
        msg = " ".join(parts)

    # Truncate to 600 chars
    if len(msg) > 600:
        msg = msg[:597] + "..."
    return msg


def build_rest_rule_text(tier: int, continuous_minutes: int, lang: str = "en") -> str:
    """Build human-readable rest rule text."""
    if lang == "hi":
        if tier >= 3:
            return "बाहरी कार्य की सलाह नहीं दी जाती"
        return f"हर {continuous_minutes} मिनट काम के बाद छाया में आराम करें"
    else:
        if tier >= 3:
            return "No outdoor work advised"
        return f"Rest in shade after every {continuous_minutes} minutes of work"
