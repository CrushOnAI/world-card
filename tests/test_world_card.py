from __future__ import annotations

import json
from pathlib import Path
import unittest

from world_card import (
    normalize_card,
    sillytavern_to_world_card,
    validate_card,
    world_card_to_crushon,
)

ROOT = Path(__file__).resolve().parents[1]


class WorldCardTests(unittest.TestCase):
    def test_examples_are_valid(self) -> None:
        for path in sorted((ROOT / "examples").glob("*.world-card.json")):
            with self.subTest(path=path.name):
                card = json.loads(path.read_text(encoding="utf-8"))
                self.assertEqual(validate_card(card), [])

    def test_duplicate_ids_are_rejected(self) -> None:
        card = {
            "spec": "world-card",
            "spec_version": "1.0",
            "name": "Test",
            "description": "Test world",
            "entries": [
                {"id": "same", "title": "A", "content": "A", "keywords": []},
                {"id": "same", "title": "B", "content": "B", "keywords": []},
            ],
        }
        self.assertTrue(any("must be unique" in issue.message for issue in validate_card(card)))

    def test_normalizer_adds_defaults_and_deduplicates(self) -> None:
        card = {
            "spec": " world-card ",
            "spec_version": " 1.0 ",
            "name": " Test ",
            "description": " A world ",
            "tags": ["fantasy", "fantasy", " mystery "],
            "entries": [{
                "id": " Old Tower ",
                "title": " Tower ",
                "content": " Stone walls. ",
                "keywords": ["tower", "tower", " stone "],
            }],
        }
        normalized = normalize_card(card)
        self.assertEqual(normalized["language"], "en")
        self.assertEqual(normalized["tags"], ["fantasy", "mystery"])
        self.assertEqual(normalized["entries"][0]["id"], "old-tower")
        self.assertEqual(normalized["entries"][0]["priority"], 50)
        self.assertTrue(normalized["entries"][0]["enabled"])

    def test_sillytavern_to_crushon_mapping(self) -> None:
        lorebook = {
            "entries": {
                "0": {
                    "uid": 0,
                    "key": ["lighthouse", "harbor"],
                    "comment": "The Old Lighthouse",
                    "content": "The beam reveals hidden markings.",
                    "order": 70,
                    "disable": False,
                    "category": "location",
                }
            }
        }
        card = sillytavern_to_world_card(lorebook, name="Moonlit Harbor")
        self.assertEqual(validate_card(card), [])
        converted = world_card_to_crushon(
            card, genre_tag="original", content_tags=["mystery", "magic"]
        )
        self.assertEqual(converted["visibility"], "WORLD_CARD_VISIBILITY_PRIVATE")
        self.assertEqual(converted["rating"], "WORLD_CARD_RATING_FILTERED")
        note = converted["notes"][0]
        self.assertEqual(note["note_type"], "WORLD_CARD_NOTE_TYPE_LOCATIONS")
        self.assertEqual(note["items"][0]["key_words"], ["lighthouse", "harbor"])
        self.assertEqual(note["items"][0]["priority_level"], 3)

    def test_unknown_category_uses_explicit_default(self) -> None:
        lorebook = {
            "entries": [{"comment": "Custom lore", "content": "A fact.", "key": []}]
        }
        card = sillytavern_to_world_card(lorebook)
        converted = world_card_to_crushon(card, default_note_type="items")
        item = converted["notes"][0]["items"][0]
        self.assertEqual(item["note_type"], "WORLD_CARD_NOTE_TYPE_ITEMS")
        self.assertEqual(item["trigger_mode"], "WORLD_CARD_TRIGGER_MODE_ALWAYS_ON")

    def test_comprehensive_sillytavern_fixture(self) -> None:
        lorebook = json.loads(
            (ROOT / "examples" / "sillytavern-comprehensive.json").read_text(
                encoding="utf-8"
            )
        )
        card = sillytavern_to_world_card(lorebook, name="Moonlit Harbor Collection")

        # Disabled and empty entries are omitted. Duplicate titles receive stable,
        # unique IDs instead of making the generated World Card invalid.
        self.assertEqual(len(card["entries"]), 7)
        self.assertEqual(
            [entry["id"] for entry in card["entries"] if entry["title"] == "Twin Gate"],
            ["twin-gate", "twin-gate-2"],
        )
        self.assertNotIn("Disabled Draft", {entry["title"] for entry in card["entries"]})
        self.assertNotIn("Empty Draft", {entry["title"] for entry in card["entries"]})

        # Both list and comma-separated keys are normalized and deduplicated.
        by_title = {entry["title"]: entry for entry in card["entries"]}
        self.assertEqual(by_title["Captain Mira"]["keywords"], ["captain", "mira"])
        self.assertEqual(
            by_title["Star Compass"]["keywords"], ["compass", "star compass"]
        )

        converted = world_card_to_crushon(card)
        by_type = {note["note_type"]: note for note in converted["notes"]}
        self.assertTrue({
            "WORLD_CARD_NOTE_TYPE_CHARACTERS",
            "WORLD_CARD_NOTE_TYPE_LOCATIONS",
            "WORLD_CARD_NOTE_TYPE_ORGANIZATIONS",
            "WORLD_CARD_NOTE_TYPE_EVENTS",
            "WORLD_CARD_NOTE_TYPE_RULES",
            "WORLD_CARD_NOTE_TYPE_ITEMS",
        }.issubset(by_type))

        rule = by_type["WORLD_CARD_NOTE_TYPE_RULES"]["items"][0]
        self.assertEqual(rule["name"], "Harbor Oath")
        self.assertEqual(rule["trigger_mode"], "WORLD_CARD_TRIGGER_MODE_ALWAYS_ON")
        self.assertNotIn("key_words", rule)

    def test_namespaced_optional_character_fields_are_preserved(self) -> None:
        card = json.loads(
            (ROOT / "examples" / "character-cast.world-card.json").read_text(
                encoding="utf-8"
            )
        )
        normalized = normalize_card(card)
        fields = normalized["entries"][0]["extensions"]["ai.crushon.world-card"]
        self.assertEqual(fields["age_group"], "adult")
        self.assertEqual(fields["gender"], "female")

        # Optional extension fields are preserved in World Card but deliberately
        # not invented in the tested CrushOn normalized mapping.
        converted = world_card_to_crushon(normalized)
        character = converted["notes"][0]["items"][0]
        self.assertNotIn("age_group", character)
        self.assertNotIn("gender", character)

if __name__ == "__main__":
    unittest.main()
