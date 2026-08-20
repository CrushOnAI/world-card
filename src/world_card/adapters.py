"""Adapters between tested lorebook structures and World Card v1."""

from __future__ import annotations

from collections import defaultdict
from typing import Any

from .normalizer import normalize_card


CRUSHON_NOTE_TYPES = {
    "character": "WORLD_CARD_NOTE_TYPE_CHARACTERS",
    "characters": "WORLD_CARD_NOTE_TYPE_CHARACTERS",
    "location": "WORLD_CARD_NOTE_TYPE_LOCATIONS",
    "locations": "WORLD_CARD_NOTE_TYPE_LOCATIONS",
    "organization": "WORLD_CARD_NOTE_TYPE_ORGANIZATIONS",
    "organizations": "WORLD_CARD_NOTE_TYPE_ORGANIZATIONS",
    "faction": "WORLD_CARD_NOTE_TYPE_ORGANIZATIONS",
    "event": "WORLD_CARD_NOTE_TYPE_EVENTS",
    "events": "WORLD_CARD_NOTE_TYPE_EVENTS",
    "rule": "WORLD_CARD_NOTE_TYPE_RULES",
    "rules": "WORLD_CARD_NOTE_TYPE_RULES",
    "lore": "WORLD_CARD_NOTE_TYPE_RULES",
    "item": "WORLD_CARD_NOTE_TYPE_ITEMS",
    "items": "WORLD_CARD_NOTE_TYPE_ITEMS",
}


def _entries_from_sillytavern(document: dict[str, Any]) -> list[dict[str, Any]]:
    entries = document.get("entries")
    if isinstance(entries, list):
        return [entry for entry in entries if isinstance(entry, dict)]
    if isinstance(entries, dict):
        return [entry for entry in entries.values() if isinstance(entry, dict)]
    raise ValueError("SillyTavern lorebook must contain an entries object or array")


def _slug(value: str, fallback: str) -> str:
    import re

    slug = re.sub(r"[^a-z0-9_-]", "-", value.strip().lower())
    slug = re.sub(r"-+", "-", slug).strip("-")
    return slug[:100] or fallback


def sillytavern_to_world_card(
    document: dict[str, Any],
    *,
    name: str = "Imported Lorebook",
    description: str = "Converted from a SillyTavern Lorebook.",
) -> dict[str, Any]:
    """Convert a SillyTavern Lorebook into the open World Card draft."""

    converted: list[dict[str, Any]] = []
    used_ids: set[str] = set()
    for index, entry in enumerate(_entries_from_sillytavern(document)):
        if entry.get("disable") is True:
            continue
        content = str(entry.get("content") or "").strip()
        if not content:
            continue
        title = str(entry.get("comment") or entry.get("name") or f"Entry {index + 1}").strip()
        candidate = _slug(title, f"entry-{index + 1}")
        entry_id = candidate
        suffix = 2
        while entry_id in used_ids:
            entry_id = f"{candidate[:96]}-{suffix}"
            suffix += 1
        used_ids.add(entry_id)
        keys = entry.get("key") or []
        if isinstance(keys, str):
            keys = [part.strip() for part in keys.split(",")]
        keywords = [str(key).strip() for key in keys if str(key).strip()]
        category = str(entry.get("category") or "uncategorized").strip().lower()
        order = entry.get("order", 50)
        priority = order if isinstance(order, int) and not isinstance(order, bool) else 50
        converted.append({
            "id": entry_id,
            "title": title,
            "content": content,
            "keywords": keywords,
            "category": category,
            "priority": min(100, max(0, priority)),
            "enabled": True,
        })
    if not converted:
        raise ValueError("SillyTavern lorebook has no enabled entries with content")
    return normalize_card({
        "spec": "world-card",
        "spec_version": "1.0",
        "name": name,
        "description": description,
        "entries": converted,
    })


def _crushon_priority(priority: Any) -> int:
    if not isinstance(priority, int) or isinstance(priority, bool):
        return 3
    return min(5, max(1, priority // 25 + 1))


def world_card_to_crushon(
    card: dict[str, Any],
    *,
    genre_tag: str = "other",
    content_tags: list[str] | None = None,
    default_note_type: str = "rules",
    visibility: str = "WORLD_CARD_VISIBILITY_PRIVATE",
    rating: str = "WORLD_CARD_RATING_FILTERED",
) -> dict[str, Any]:
    """Map a valid World Card draft to the tested CrushOn normalized model.

    The returned object contains no account, creator, review, or internal ID data.
    Unknown categories use ``default_note_type`` instead of being guessed.
    """

    normalized = normalize_card(card)
    fallback = CRUSHON_NOTE_TYPES.get(default_note_type.lower())
    if fallback is None:
        raise ValueError(f"unsupported default note type: {default_note_type}")

    grouped: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for entry in normalized["entries"]:
        if entry.get("enabled") is False:
            continue
        note_type = CRUSHON_NOTE_TYPES.get(str(entry.get("category", "")).lower(), fallback)
        keywords = entry.get("keywords") or []
        item: dict[str, Any] = {
            "name": entry["title"],
            "description": entry["content"],
            "note_type": note_type,
            "trigger_mode": (
                "WORLD_CARD_TRIGGER_MODE_KEYWORD"
                if keywords else "WORLD_CARD_TRIGGER_MODE_ALWAYS_ON"
            ),
            "priority_level": _crushon_priority(entry.get("priority")),
        }
        if keywords:
            item["key_words"] = keywords
        grouped[note_type].append(item)

    return {
        "name": normalized["name"],
        "introduction": normalized["description"],
        "rating": rating,
        "visibility": visibility,
        "tags": {
            "genre_tag": genre_tag,
            "content_tags": list(content_tags or []),
        },
        "notes": [
            {"note_type": note_type, "items": items}
            for note_type, items in grouped.items()
        ],
    }
