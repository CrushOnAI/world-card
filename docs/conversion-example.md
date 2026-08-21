# SillyTavern conversion example

This example uses the original, SFW fixture in
[`examples/sillytavern-lighthouse.json`](../examples/sillytavern-lighthouse.json).

## Input

```json
{
  "entries": {
    "0": {
      "key": ["lighthouse", "harbor"],
      "comment": "The Old Lighthouse",
      "content": "The lighthouse beam reveals magical markings hidden by daylight.",
      "order": 70,
      "disable": false,
      "category": "location"
    }
  }
}
```

## Mapping

| SillyTavern field | Normalized field | Result |
| --- | --- | --- |
| `category: location` | `note_type` | `WORLD_CARD_NOTE_TYPE_LOCATIONS` |
| `key` | `key_words` | `lighthouse`, `harbor` |
| `comment` | `name` | `The Old Lighthouse` |
| `content` | `description` | Entry text is preserved |
| `order: 70` | `priority_level` | `3` |

The converter also adds safe defaults:

- `rating`: `WORLD_CARD_RATING_FILTERED`
- `visibility`: `WORLD_CARD_VISIBILITY_PRIVATE`

## Output excerpt

```json
{
  "rating": "WORLD_CARD_RATING_FILTERED",
  "visibility": "WORLD_CARD_VISIBILITY_PRIVATE",
  "notes": [
    {
      "note_type": "WORLD_CARD_NOTE_TYPE_LOCATIONS",
      "items": [
        {
          "name": "The Old Lighthouse",
          "description": "The lighthouse beam reveals magical markings hidden by daylight.",
          "trigger_mode": "WORLD_CARD_TRIGGER_MODE_KEYWORD",
          "priority_level": 3,
          "key_words": ["lighthouse", "harbor"]
        }
      ]
    }
  ]
}
```

The complete sanitized fixture is available at
[`examples/crushon-normalized.sanitized.json`](../examples/crushon-normalized.sanitized.json).
The result is a normalized structural JSON fixture, not an official native CrushOn
export.
