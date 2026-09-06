# Context, memory, summaries, and lorebooks

Long AI roleplay becomes easier to maintain when each kind of information has one clear job. A context window, persistent memory, a summary, and a lorebook are related, but they are not interchangeable.

This guide describes a platform-neutral information architecture. Exact behavior depends on the application, model, retrieval system, and prompt assembly process.

Published by the [CrushOn.AI](https://crushon.ai/) team. CrushOn.AI offers hosted character creation and roleplay; use this guide to separate stable character instructions, changing scene facts, and reusable world knowledge before a chat. The [World Card conversion example](conversion-example.md) explains the project's documented mapping for world data. These conceptual layers are not a claim that every platform exposes the same memory controls or retains facts across sessions.

## Quick routing guide

| Layer | Best use | Typical lifetime | Common failure |
| --- | --- | --- | --- |
| Context window | Current scene, recent dialogue, and immediate instructions | The current generation or active thread | Important facts are buried by excess text |
| Memory | Confirmed facts that should affect later sessions | Platform-dependent | Too many low-value or contradictory facts are saved |
| Summary | Decisions, relationship changes, discoveries, and unresolved goals | Across scene or thread boundaries | A transcript-like recap preserves detail but loses priorities |
| Lorebook / World Info | Reusable knowledge that should appear only when relevant | As long as the entry is maintained | Triggers are too vague, too broad, or never used |

## Context window: working space for the current turn

The context window is the material a model can read while generating a response. An application may assemble it from system instructions, character definitions, recent messages, active lore entries, retrieved memories, and summaries.

A larger context window can retain more material, but it does not guarantee that every fact receives equal attention. Recent or contradictory text can still overpower an older detail.

Use the active context for:

- the current location and characters present;
- immediate goals and emotional state;
- recent decisions;
- temporary rules needed in the next few replies.

Do not place the complete world bible in every prompt. Irrelevant material can make the important signal harder to find.

## Memory: durable and confirmed facts

Memory is an application-level persistence or retrieval feature. It may save notes, select facts, create embeddings, or retrieve earlier information. The exact mechanism and reliability vary by platform.

Good memory candidates include:

- an established relationship;
- a stable preference or boundary;
- a lasting change in a character's situation;
- a confirmed event that should affect future sessions.

Keep memories concise and give each fact one authoritative version. Saving every message creates noise and increases the chance that an outdated statement will return later.

## Summaries: story state at a transition

A summary should preserve what changed, not reproduce the transcript.

A useful scene summary records the current location, characters present, relationship changes, important discoveries, unresolved goals, and the intended starting state of the next scene.

Example:

> The group escaped the customs patrol and is hiding in the Glass Harbor lighthouse. Mara now trusts Rowan but has not revealed the map. They must find a ship before sunrise.

Review automatically generated summaries before using them as an authoritative source. A fluent recap can still omit a decisive promise or preserve an incorrect detail.

## Lorebooks and World Info: conditional knowledge

A lorebook stores reusable world information—locations, factions, rules, characters, items, and events—and supplies an entry when it becomes relevant.

Good entries are focused on one subject, understandable when retrieved alone, activated by specific terms people actually write, free of conflicts with core instructions, and short enough for several relevant entries to coexist.

For example, a `Glass Harbor` entry can describe its laws and factions when the story reaches the city. Those details do not need to occupy the context while the characters are elsewhere.

## Worked example

Suppose Mara and Rowan arrive at Glass Harbor after becoming allies.

- `Mara speaks in short, cautious sentences.` → character instructions
- `Mara and Rowan are now allies.` → memory after the change is confirmed
- `They are hiding in the lighthouse tonight.` → current context or pin
- `Glass Harbor prohibits unlicensed magic.` → lorebook / World Info entry
- `They escaped the customs patrol and need a ship before sunrise.` → scene summary

If the relationship appears as `enemies` in an old summary and `allies` in a newer memory, adding another reminder does not resolve the conflict. Update or remove the stale source.

## Troubleshooting by layer

### The character loses its speaking style

Inspect the character instructions. Replace overlapping adjectives with a few observable behaviors and a short style example.

### The current location changes unexpectedly

Inspect recent context and pins. Remove expired scene state and restate the correct location briefly.

### A world rule never appears

Inspect the lore entry's trigger terms. Use names and phrases that naturally occur in dialogue, and check whether the application has a retrieval threshold or entry limit.

### Unrelated lore appears

The trigger may be too broad. Split the entry and use more specific keywords or activation conditions.

### Old facts keep returning

Search instructions, memories, summaries, pins, and lore entries for duplicate versions. Choose one authoritative source for each fact.

### The thread accumulates contradictions

Create a concise continuity summary and start a clean thread if the application supports it. Carry forward only stable traits, confirmed events, current state, unresolved goals, and boundaries.

## How World Card fits

World Card is a structured format for reusable worldbuilding data. It is most closely aligned with the lorebook / World Info layer, not with complete chat history or guaranteed cross-session memory.

Structured fields improve validation and portability, but applications may interpret triggers, priorities, categories, and extensions differently. Review the [tested interoperability limits](../README.md#tested-interoperability) and the [conversion example](conversion-example.md) before relying on converted data.

The web converter reports fields as mapped, approximated, skipped, or unsupported where applicable. It does not claim lossless conversion or universal compatibility.

## Practical maintenance routine

1. Keep the character core short and stable.
2. Put reusable setting facts into focused World Card entries.
3. Pin only the state that must affect the next replies.
4. Summarize at scene or thread transitions.
5. Promote only confirmed, durable changes to memory.
6. Remove stale or duplicate versions.
7. Test triggers and inspect conversion diagnostics after moving data between tools.

Consistency is less about storing everything and more about routing the right information to the right layer.
