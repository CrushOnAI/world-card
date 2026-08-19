"""Dependency-free structural validation for World Card v1."""

from __future__ import annotations

from dataclasses import dataclass
import re
from typing import Any

ID_PATTERN = re.compile(r"^[a-z0-9][a-z0-9_-]{0,99}$")
VERSION_PATTERN = re.compile(r"^1\.[0-9]+$")

TOP_LEVEL_FIELDS = {
    "spec", "spec_version", "name", "description", "language", "authors",
    "tags", "scenario", "rules", "entries", "metadata", "extensions",
}
ENTRY_FIELDS = {
    "id", "title", "content", "keywords", "category", "priority",
    "enabled", "extensions",
}
METADATA_FIELDS = {"created_at", "updated_at", "source", "license"}


@dataclass(frozen=True)
class ValidationIssue:
    path: str
    message: str

    def __str__(self) -> str:
        return f"{self.path}: {self.message}"


def _is_non_empty_string(value: Any) -> bool:
    return isinstance(value, str) and bool(value.strip())


def _validate_string_list(value: Any, path: str, issues: list[ValidationIssue], *, unique: bool = False) -> None:
    if not isinstance(value, list):
        issues.append(ValidationIssue(path, "must be an array"))
        return
    seen: set[str] = set()
    for index, item in enumerate(value):
        if not _is_non_empty_string(item):
            issues.append(ValidationIssue(f"{path}[{index}]", "must be a non-empty string"))
        elif unique and item in seen:
            issues.append(ValidationIssue(f"{path}[{index}]", "must be unique"))
        elif isinstance(item, str):
            seen.add(item)


def validate_card(card: Any) -> list[ValidationIssue]:
    issues: list[ValidationIssue] = []
    if not isinstance(card, dict):
        return [ValidationIssue("$", "must be a JSON object")]

    unknown = sorted(set(card) - TOP_LEVEL_FIELDS)
    for field in unknown:
        issues.append(ValidationIssue(f"$.{field}", "unknown field; use extensions for application-specific data"))

    if card.get("spec") != "world-card":
        issues.append(ValidationIssue("$.spec", "must equal 'world-card'"))
    version = card.get("spec_version")
    if not isinstance(version, str) or not VERSION_PATTERN.fullmatch(version):
        issues.append(ValidationIssue("$.spec_version", "must match 1.x, for example '1.0'"))
    for field in ("name", "description"):
        if not _is_non_empty_string(card.get(field)):
            issues.append(ValidationIssue(f"$.{field}", "must be a non-empty string"))

    for field in ("authors", "tags", "rules"):
        if field in card:
            _validate_string_list(card[field], f"$.{field}", issues, unique=field in {"authors", "tags"})

    if "language" in card and not _is_non_empty_string(card["language"]):
        issues.append(ValidationIssue("$.language", "must be a non-empty string"))
    if "scenario" in card and not isinstance(card["scenario"], str):
        issues.append(ValidationIssue("$.scenario", "must be a string"))
    if "extensions" in card and not isinstance(card["extensions"], dict):
        issues.append(ValidationIssue("$.extensions", "must be an object"))

    metadata = card.get("metadata")
    if metadata is not None:
        if not isinstance(metadata, dict):
            issues.append(ValidationIssue("$.metadata", "must be an object"))
        else:
            for field in sorted(set(metadata) - METADATA_FIELDS):
                issues.append(ValidationIssue(f"$.metadata.{field}", "unknown metadata field"))
            for field, value in metadata.items():
                if field in METADATA_FIELDS and not _is_non_empty_string(value):
                    issues.append(ValidationIssue(f"$.metadata.{field}", "must be a non-empty string"))

    entries = card.get("entries")
    if not isinstance(entries, list) or not entries:
        issues.append(ValidationIssue("$.entries", "must be a non-empty array"))
        return issues

    ids: set[str] = set()
    for index, entry in enumerate(entries):
        path = f"$.entries[{index}]"
        if not isinstance(entry, dict):
            issues.append(ValidationIssue(path, "must be an object"))
            continue
        for field in sorted(set(entry) - ENTRY_FIELDS):
            issues.append(ValidationIssue(f"{path}.{field}", "unknown field; use extensions"))
        entry_id = entry.get("id")
        if not isinstance(entry_id, str) or not ID_PATTERN.fullmatch(entry_id):
            issues.append(ValidationIssue(f"{path}.id", "must use lowercase letters, digits, '_' or '-'"))
        elif entry_id in ids:
            issues.append(ValidationIssue(f"{path}.id", "must be unique"))
        else:
            ids.add(entry_id)
        for field in ("title", "content"):
            if not _is_non_empty_string(entry.get(field)):
                issues.append(ValidationIssue(f"{path}.{field}", "must be a non-empty string"))
        if "keywords" not in entry:
            issues.append(ValidationIssue(f"{path}.keywords", "is required"))
        else:
            _validate_string_list(entry["keywords"], f"{path}.keywords", issues, unique=True)
        if "category" in entry and not _is_non_empty_string(entry["category"]):
            issues.append(ValidationIssue(f"{path}.category", "must be a non-empty string"))
        priority = entry.get("priority")
        if priority is not None and (isinstance(priority, bool) or not isinstance(priority, int) or not 0 <= priority <= 100):
            issues.append(ValidationIssue(f"{path}.priority", "must be an integer from 0 to 100"))
        if "enabled" in entry and not isinstance(entry["enabled"], bool):
            issues.append(ValidationIssue(f"{path}.enabled", "must be a boolean"))
        if "extensions" in entry and not isinstance(entry["extensions"], dict):
            issues.append(ValidationIssue(f"{path}.extensions", "must be an object"))

    return issues
