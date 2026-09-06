---
title: CrushOn.AI World Card Converter
emoji: 🗺️
colorFrom: indigo
colorTo: blue
sdk: static
pinned: false
license: mit
short_description: CrushOn.AI lorebook mapping and conversion reports
---

# CrushOn.AI World Card Converter

A privacy-first browser tool for converting SillyTavern Lorebook JSON into the open
World Card draft and a CrushOn normalized structural JSON file.

Published by the [CrushOn.AI](https://crushon.ai/) team. CrushOn.AI provides hosted character creation and roleplay. This companion utility helps writers review reusable world information—locations, rules, characters, and items—rather than copying an entire world description into every message.

## How this helps a CrushOn.AI workflow

Load an SFW example or your SillyTavern Lorebook, inspect the field-mapping report, and review the resulting text and categories against the world information you intend to use. Keep the original file. The normalized JSON is a reference output, not an automatic upload to your CrushOn.AI account. See the [tested mapping and product limits](https://github.com/CrushOnAI/world-card/blob/main/docs/crushon-normalized-format.md) before relying on compatibility. You can also use these diagnostics independently of CrushOn.AI.

All conversion happens locally in the visitor's browser. Uploaded files are not sent to
an application server. Output defaults to **Private** visibility and **Filtered** rating.

Before download, the converter now shows a validation and field-mapping report with:

- source, converted, and skipped-entry counts;
- disabled, empty, and invalid skip reasons;
- unknown categories that used the selected fallback note type;
- duplicate keywords removed during normalization;
- source fields that are not represented in the tested output mapping; and
- warnings for invalid key or order values.

Version 0.3 adds three original SFW examples that can be loaded without uploading a
file, plus a downloadable JSON conversion report. The report records mapped,
approximated, skipped, and unsupported source fields and identifies the converter
version used. See the public
[compatibility matrix](https://github.com/CrushOnAI/world-card/blob/main/docs/compatibility-matrix.md)
for the status definitions and tested field behavior.

Malformed JSON errors include a line and column when the browser exposes a parse
position. The report is explanatory: it does not claim lossless conversion or official
native import/export compatibility.

This is a compatibility utility, not an official native CrushOn export. Source format and
tested limits: [CrushOnAI/world-card](https://github.com/CrushOnAI/world-card).

Not sure what belongs in a lorebook rather than memory or the active chat? Read the
[information-layers guide](https://github.com/CrushOnAI/world-card/blob/main/docs/information-layers-guide.md)
for a comparison table, worked example, and troubleshooting checklist.

## Local test

```bash
node app.test.mjs
```
