# World Card

An open, portable format for describing roleplay worlds, locations, lore, rules, and scenario hooks.

World Card is designed to make structured worldbuilding data easier to validate, share, and adapt across AI roleplay tools. This repository contains the version 1 specification, a JSON Schema, safe example cards, and a small Python toolkit for validation and normalization.

> Status: **Draft v1.0.0**. The format is ready for experimentation and feedback. It does not claim compatibility with third-party products unless that compatibility is explicitly documented and tested.

## What is included

- `spec/world-card-v1.md` — human-readable specification
- `spec/world-card-v1.schema.json` — machine-readable JSON Schema
- `examples/` — original, SFW example cards
- `docs/crushon-normalized-format.md` — tested CrushOn field mapping and privacy notes
- `src/world_card/` — dependency-free validator, normalizer, and CLI
- `spaces/world-card-converter/` — deployment package for the Gradio web converter
- `tests/` — automated tests

## Quick start

Requires Python 3.10 or newer.

```bash
python -m pip install -e .
world-card validate examples/minimal.world-card.json
world-card normalize examples/fantasy-tavern.world-card.json --output normalized.json
world-card convert-sillytavern examples/sillytavern-lighthouse.json \
  --format crushon --name "Moonlit Harbor" --genre original \
  --tag mystery --tag magic --default-note-type locations \
  --output crushon-normalized.json
```

You can also run the module without installing it:

```bash
PYTHONPATH=src python -m world_card validate examples/minimal.world-card.json
```

## Web converter

Try the public [AI World Card Converter on Hugging Face](https://huggingface.co/spaces/CrushonAI/world-card-converter).

The privacy-first static app in `spaces/world-card-converter/` accepts a SillyTavern
Lorebook JSON, shows the normalized result, and provides a download. Conversion runs in
the visitor's browser and defaults to `Private` visibility and `Filtered` rating.

The Space description includes the verified compatibility limits and privacy guidance.
It does not describe the generated file as an official native CrushOn export.

## Minimal card

```json
{
  "spec": "world-card",
  "spec_version": "1.0",
  "name": "Lantern Harbor",
  "description": "A foggy harbor city built around an ancient lighthouse.",
  "entries": [
    {
      "id": "old-lighthouse",
      "title": "The Old Lighthouse",
      "content": "The lighthouse beam reveals magical markings hidden by daylight.",
      "keywords": ["lighthouse", "harbor", "markings"]
    }
  ]
}
```

## Design principles

1. **Portable** — plain JSON with stable, documented fields.
2. **Readable** — useful to people without special tooling.
3. **Extensible** — namespaced metadata can preserve application-specific data.
4. **Safe by default** — no credentials, private conversations, or user identifiers.
5. **Honest interoperability** — adapters are documented only after real testing.

## Tested interoperability

The repository includes a deterministic adapter for this path:

`SillyTavern Lorebook → World Card Draft → CrushOn normalized JSON`

CrushOn's importer accepted the SillyTavern `entries` structure used in
`examples/sillytavern-lighthouse.json`. The normalized CrushOn note model and a
sanitized fixture are documented in
[`docs/crushon-normalized-format.md`](docs/crushon-normalized-format.md).

Important limits:

- CrushOn's web interface did not expose native World Card export during testing.
- Generated CrushOn JSON is a normalized conversion target, not a claimed native export.
- Lorebook entries without a recognized category require an explicit default note type.
- Output defaults to `Filtered` and `Private`.
- Account data, internal IDs, review data, and storage URLs are never generated.

## Roadmap

- Collect feedback on the v1 draft
- Add fixtures for edge cases and larger worlds
- Publish and collect feedback on the browser-based converter
- Extend tested mappings to more note types and edge cases

## Contributing

Issues and pull requests are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) before proposing changes to the specification.

## Security and privacy

World cards may contain personal or sensitive writing. Remove private data before sharing a card publicly. See [SECURITY.md](SECURITY.md).

## License

Code and documentation are released under the [MIT License](LICENSE).

Maintained by [CrushOn.AI](https://chat.crushon.ai/).
