# Contributing

Thank you for helping improve World Card.

## Before opening a pull request

1. Open an issue for specification changes or new fields.
2. Keep examples original, SFW, and free of personal data.
3. Add tests for changes to validation or normalization.
4. Run:

```bash
PYTHONPATH=src python -m unittest discover -s tests -v
PYTHONPATH=src python -m world_card validate examples/minimal.world-card.json
```

## Specification changes

Describe the use case, proposed field semantics, backward-compatibility impact, and at least one example. Application-specific data should normally use a namespace under `extensions` instead of adding a core field.

By contributing, you agree that your contribution is licensed under the repository's MIT License.
