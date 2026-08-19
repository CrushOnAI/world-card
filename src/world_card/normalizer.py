"""Normalization for World Card v1 documents."""

from __future__ import annotations

from copy import deepcopy
import re
from typing import Any

from .validator import validate_card


def _clean_string(value: Any) -> Any:
    return value.strip() if isinstance(value, str) else value


def _unique_strings(values: Any) -> Any:
    if not isinstance(values, list):
        return values
    result: list[Any] = []
    seen: set[str] = set()
    for value in values:
        cleaned = _clean_string(value)
        if isinstance(cleaned, str):
            if not cleaned or cleaned in seen:
                continue
            seen.add(cleaned)
        result.append(cleaned)
    return result


def _normalize_id(value: Any) -> Any:
    if not isinstance(value, str):
        return value
    value = value.strip().lower()
    value = re.sub(r"\s+", "-", value)
    return re.sub(r"[^a-z0-9_-]", "", value)


def normalize_card(card: dict[str, Any], *, validate: bool = True) -> dict[str, Any]:
    if not isinstance(card, dict):
        raise TypeError("card must be a dictionary")

    result = deepcopy(card)
    for field in ("spec", "spec_version", "name", "description", "language", "scenario"):
        if field in result:
            result[field] = _clean_string(result[field])
    result.setdefault("spec", "world-card")
    result.setdefault("spec_version", "1.0")
    result.setdefault("language", "en")

    for field in ("authors", "tags", "rules"):
        if field in result:
            result[field] = _unique_strings(result[field])

    entries = result.get("entries")
    if isinstance(entries, list):
        for entry in entries:
            if not isinstance(entry, dict):
                continue
            if "id" in entry:
                entry["id"] = _normalize_id(entry["id"])
            for field in ("title", "content", "category"):
                if field in entry:
                    entry[field] = _clean_string(entry[field])
            if "keywords" in entry:
                entry["keywords"] = _unique_strings(entry["keywords"])
            entry.setdefault("priority", 50)
            entry.setdefault("enabled", True)

    if validate:
        issues = validate_card(result)
        if issues:
            details = "\n".join(str(issue) for issue in issues)
            raise ValueError(f"normalized card is invalid:\n{details}")
    return result
