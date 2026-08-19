from __future__ import annotations

import json
from pathlib import Path
import unittest

from world_card import normalize_card, validate_card

ROOT = Path(__file__).resolve().parents[1]


class WorldCardTests(unittest.TestCase):
    def test_examples_are_valid(self) -> None:
        for path in sorted((ROOT / "examples").glob("*.json")):
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


if __name__ == "__main__":
    unittest.main()
