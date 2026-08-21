---
title: AI World Card Converter
emoji: 🗺️
colorFrom: indigo
colorTo: blue
sdk: static
pinned: false
license: mit
short_description: Convert AI roleplay lorebooks into portable World Card JSON.
---

# AI World Card Converter

A privacy-first browser tool for converting SillyTavern Lorebook JSON into the open
World Card draft and a CrushOn normalized structural JSON file.

All conversion happens locally in the visitor's browser. Uploaded files are not sent to
an application server. Output defaults to **Private** visibility and **Filtered** rating.

Before download, the converter now shows a validation and field-mapping report with:

- source, converted, and skipped-entry counts;
- disabled, empty, and invalid skip reasons;
- unknown categories that used the selected fallback note type;
- duplicate keywords removed during normalization;
- source fields that are not represented in the tested output mapping; and
- warnings for invalid key or order values.

Malformed JSON errors include a line and column when the browser exposes a parse
position. The report is explanatory: it does not claim lossless conversion or official
native import/export compatibility.

This is a compatibility utility, not an official native CrushOn export. Source format and
tested limits: [CrushOnAI/world-card](https://github.com/CrushOnAI/world-card).

## Local test

```bash
node app.test.mjs
```
