# World Card

An open, portable format for describing roleplay worlds, locations, lore, rules, and scenario hooks.

World Card is designed to make structured worldbuilding data easier to validate, share, and adapt across AI roleplay tools. This repository contains the version 1 specification, a JSON Schema, safe example cards, and a small Python toolkit for validation and normalization.

> Status: **Draft v1.0.0**. The format is ready for experimentation and feedback. It does not claim compatibility with third-party products unless that compatibility is explicitly documented and tested.

## What is included

- `spec/world-card-v1.md` — human-readable specification
- `spec/world-card-v1.schema.json` — machine-readable JSON Schema
- `examples/` — original, SFW example cards
- `src/world_card/` — dependency-free validator, normalizer, and CLI
- `tests/` — automated tests

## Quick start

Requires Python 3.10 or newer.

```bash
python -m pip install -e .
world-card validate examples/minimal.world-card.json
world-card normalize examples/fantasy-tavern.world-card.json --output normalized.json
```

You can also run the module without installing it:

```bash
PYTHONPATH=src python -m world_card validate examples/minimal.world-card.json
```

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

## Roadmap

- Collect feedback on the v1 draft
- Add fixtures for edge cases and larger worlds
- Publish a browser-based validator and normalizer
- Design adapters for external formats after compatibility testing

## Contributing

Issues and pull requests are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) before proposing changes to the specification.

## Security and privacy

World cards may contain personal or sensitive writing. Remove private data before sharing a card publicly. See [SECURITY.md](SECURITY.md).

## License

Code and documentation are released under the [MIT License](LICENSE).

Maintained by [CrushOn.AI](https://chat.crushon.ai/).
