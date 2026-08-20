# SillyTavern Show and tell draft

## Proposed title

World Card: an open JSON draft and browser-local Lorebook converter

## Proposed post

Hi everyone — we have published an early World Card draft and a small, free converter
for experimenting with portable worldbuilding data across roleplay tools.

The current tested path accepts a SillyTavern Lorebook JSON and converts supported
entries into a documented normalized structure. The web version runs entirely in the
browser: the selected file is not uploaded to an application server. Generated output
defaults to Private visibility and Filtered rating.

- Live converter: https://huggingface.co/spaces/CrushonAI/world-card-converter
- Repository and specification: https://github.com/CrushOnAI/world-card
- Conversion example: https://github.com/CrushOnAI/world-card/blob/main/docs/conversion-example.md
- Converter screenshot: https://github.com/CrushOnAI/world-card/blob/main/docs/assets/world-card-converter-success.png

The adapter currently handles `entries` supplied as an object or array, skips disabled
or empty entries, and maps Characters, Locations, Organizations, Events, Rules, and
Items. Unknown categories need an explicit fallback note type.

We are deliberately describing the result as normalized structural JSON, not as an
official native CrushOn export. The repository documents the tested scope and includes
SFW fixtures and automated tests.

Feedback would be especially useful on:

1. Lorebook fields or edge cases that should be preserved but currently are not.
2. Whether the proposed note-type mapping feels predictable.
3. Additional sanitized fixtures we should add before calling the adapter broadly
   compatible.

## Publication checklist

- Confirm the live converter is running.
- Confirm all three links above are public.
- Attach `docs/assets/world-card-converter-success.png`, captured after a successful
  conversion of the public SFW lighthouse fixture.
- Post from an account that can clearly disclose its CrushOn.AI affiliation.
- Reply to technical feedback without claiming complete compatibility.

## First reply if affiliation is asked

Yes, this is maintained by CrushOn.AI. We are sharing it as an open draft and testable
tool, and we welcome format and compatibility feedback from the wider roleplay tooling
community.
