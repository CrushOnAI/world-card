# CrushOn normalized World Card fixture

`examples/crushon-normalized.sanitized.json` is a sanitized structural fixture
derived from a real, manually created CrushOn World Card.

It is **not** represented as a native CrushOn export. At the time this fixture
was prepared, the CrushOn web interface supported importing SillyTavern and
Chub JSON files but did not expose a World Card export action.

The fixture retains the fields needed for format and converter work:

- name and introduction
- rating and visibility enums
- genre and content tags
- note grouping and note type
- item name and description
- trigger mode, keywords, and priority

The following data was removed or intentionally omitted:

- account email and creator username
- user, creator, World Card, and note item IDs
- timestamps, counters, reviews, and moderation state
- avatars, thumbnails, and internal storage URLs
- any authentication or session data

The setting and note text are original, SFW test content. Do not use this file
to claim that CrushOn currently supports native JSON export.

## Verified mapping

The following input and output behaviors have been tested:

| Source | CrushOn normalized field |
|---|---|
| Lorebook `comment` | item `name` |
| Lorebook `content` | item `description` |
| Lorebook `key[]` | item `key_words[]` |
| Non-empty keywords | `WORLD_CARD_TRIGGER_MODE_KEYWORD` |
| No keywords | `WORLD_CARD_TRIGGER_MODE_ALWAYS_ON` |
| World Card `category` | one of the six CrushOn note types |
| Lorebook `order: 70` in the tested fixture | CrushOn priority level `3` |

For other World Card priorities, the adapter applies a documented, deterministic
0–100 to 1–5 conversion policy. This policy is an adapter decision, not a claim
that CrushOn exposes the same numeric scale.

Supported CrushOn note groups are Characters, Locations, Organizations,
Events, Rules, and Items. Because plain SillyTavern Lorebook entries do not
always identify a category, the converter uses `--default-note-type` instead
of guessing.

## Conversion command

```bash
world-card convert-sillytavern examples/sillytavern-lighthouse.json \
  --format crushon \
  --name "Moonlit Harbor" \
  --genre original \
  --tag mystery \
  --tag magic \
  --default-note-type locations \
  --output crushon-normalized.json
```

The command only creates a local JSON file. It does not authenticate to
CrushOn or publish a World Card.
