"""Command-line interface for World Card tools."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
import sys
from typing import Any

from .adapters import sillytavern_to_world_card, world_card_to_crushon
from .normalizer import normalize_card
from .validator import validate_card


def _load(path: Path) -> Any:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def _validate(path: Path) -> int:
    try:
        card = _load(path)
    except (OSError, json.JSONDecodeError) as error:
        print(f"ERROR: {error}", file=sys.stderr)
        return 2
    issues = validate_card(card)
    if issues:
        for issue in issues:
            print(f"ERROR: {issue}", file=sys.stderr)
        return 1
    print(f"Valid World Card: {path}")
    return 0


def _normalize(source: Path, output: Path | None) -> int:
    try:
        card = normalize_card(_load(source))
    except (OSError, json.JSONDecodeError, TypeError, ValueError) as error:
        print(f"ERROR: {error}", file=sys.stderr)
        return 1
    rendered = json.dumps(card, ensure_ascii=False, indent=2) + "\n"
    if output:
        output.write_text(rendered, encoding="utf-8")
        print(f"Normalized World Card written to {output}")
    else:
        print(rendered, end="")
    return 0


def _convert_sillytavern(args: argparse.Namespace) -> int:
    try:
        card = sillytavern_to_world_card(
            _load(args.file), name=args.name, description=args.description
        )
        if args.format == "crushon":
            card = world_card_to_crushon(
                card,
                genre_tag=args.genre,
                content_tags=args.tag,
                default_note_type=args.default_note_type,
            )
    except (OSError, json.JSONDecodeError, TypeError, ValueError) as error:
        print(f"ERROR: {error}", file=sys.stderr)
        return 1
    rendered = json.dumps(card, ensure_ascii=False, indent=2) + "\n"
    if args.output:
        args.output.write_text(rendered, encoding="utf-8")
        print(f"Converted file written to {args.output}")
    else:
        print(rendered, end="")
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="world-card", description="Validate and normalize World Card JSON files.")
    commands = parser.add_subparsers(dest="command", required=True)
    validate_parser = commands.add_parser("validate", help="validate a World Card")
    validate_parser.add_argument("file", type=Path)
    normalize_parser = commands.add_parser("normalize", help="normalize and validate a World Card")
    normalize_parser.add_argument("file", type=Path)
    normalize_parser.add_argument("--output", "-o", type=Path)
    convert_parser = commands.add_parser(
        "convert-sillytavern", help="convert a SillyTavern Lorebook"
    )
    convert_parser.add_argument("file", type=Path)
    convert_parser.add_argument("--output", "-o", type=Path)
    convert_parser.add_argument("--format", choices=("world-card", "crushon"), default="world-card")
    convert_parser.add_argument("--name", default="Imported Lorebook")
    convert_parser.add_argument("--description", default="Converted from a SillyTavern Lorebook.")
    convert_parser.add_argument("--genre", default="other")
    convert_parser.add_argument("--tag", action="append", default=[])
    convert_parser.add_argument(
        "--default-note-type",
        choices=("characters", "locations", "organizations", "events", "rules", "items"),
        default="rules",
        help="CrushOn type for Lorebook entries without a recognized category",
    )
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    if args.command == "validate":
        return _validate(args.file)
    if args.command == "convert-sillytavern":
        return _convert_sillytavern(args)
    return _normalize(args.file, args.output)
