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

if __name__ == "__main__":
    unittest.main()
