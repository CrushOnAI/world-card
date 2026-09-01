# SillyTavern to CrushOn compatibility matrix

This matrix documents the behavior tested by converter version 0.3.0. It is not a claim of lossless, native, or universal compatibility.

The machine-readable source is [`compatibility/sillytavern-to-crushon.v0.3.json`](../compatibility/sillytavern-to-crushon.v0.3.json). The browser converter uses the same classifications in its downloadable report.

## Status definitions

- **Mapped** — represented directly or used to control an explicitly documented conversion action.
- **Approximated** — represented through a documented fallback, reduction, or change in meaning.
- **Skipped** — intentionally omitted because the normalized target does not represent the source behavior.
- **Unsupported** — not recognized by the converter; detected field names are listed in each conversion report.

## Field matrix

| SillyTavern field | Status | Normalized target | Tested behavior |
| --- | --- | --- | --- |
| `uid` | Skipped | — | Source-local sequence identifiers are not exported. |
| `comment` | Approximated | `name` | Used as the title when present; falls back to `name` or `Entry N`. |
| `name` | Mapped | `name` | Used when `comment` is empty. |
| `content` | Mapped | `description` | Trimmed text; empty entries are skipped. |
| `key` | Mapped | `key_words` | Comma-separated strings are split and duplicate values are removed. |
| `keysecondary` | Skipped | — | Secondary-key logic is not represented by the normalized target. |
| `category` | Approximated | `note_type` | Recognized categories are mapped; unknown values use the selected fallback. |
| `constant` | Mapped | `trigger_mode` | `true` becomes Always On; otherwise entries with keys use Keyword. |
| `order` | Approximated | `priority_level` | Reduced to levels 1–5 using `floor(order / 25) + 1`, then clamped. |
| `disable` | Mapped | conversion action | Disabled entries are skipped and reported. |
| `enabled` | Mapped | conversion action | Entries explicitly set to `false` are skipped and reported. |
| `selective` | Skipped | — | Selective activation logic is not represented by the normalized target. |
| `position` | Skipped | — | Prompt insertion position is frontend-specific. |
| `extensions` | Skipped | — | Unverified extensions are not copied automatically. |

## Report interpretation

The downloadable JSON report records only the recognized fields observed in the submitted file. Unknown field names appear in `unsupported_source_fields`. A successful conversion does not mean every source behavior was preserved; review approximated, skipped, and unsupported fields before using the output.
