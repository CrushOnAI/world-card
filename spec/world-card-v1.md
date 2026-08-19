# World Card v1 specification

Status: Draft 1.0  
Last updated: 2026-08-20

## 1. Purpose

A World Card is a UTF-8 JSON document that describes a fictional world for roleplay and storytelling. It can contain locations, lore, factions, rules, scenario hooks, and other information that helps an application provide consistent context.

The format intentionally does not define prompting behavior, model settings, moderation policy, or how often an entry is inserted into a conversation.

## 2. Conformance

A conforming v1 document:

- is a JSON object;
- uses `"spec": "world-card"`;
- uses a `spec_version` beginning with `1.`;
- contains a non-empty `name`, `description`, and `entries` array;
- gives every entry a unique `id`;
- does not contain unknown top-level or entry-level fields outside `extensions`.

## 3. Top-level fields

| Field | Type | Required | Description |
|---|---|---:|---|
| `spec` | string | yes | Must be `world-card`. |
| `spec_version` | string | yes | Version of this specification, such as `1.0`. |
| `name` | string | yes | Human-readable world name. |
| `description` | string | yes | Short overview of the setting. |
| `language` | string | no | BCP 47 language tag, for example `en` or `zh-CN`. |
| `authors` | array of strings | no | Authors or maintainers of the card. |
| `tags` | array of strings | no | Discovery and organization tags. |
| `scenario` | string | no | Optional initial situation or roleplay hook. |
| `rules` | array of strings | no | Setting-specific facts or constraints. |
| `entries` | array | yes | Structured lore entries. At least one is required. |
| `metadata` | object | no | Creation and modification information. |
| `extensions` | object | no | Namespaced application-specific data. |

## 4. Entry fields

| Field | Type | Required | Description |
|---|---|---:|---|
| `id` | string | yes | Stable lowercase identifier using letters, digits, `_` or `-`. |
| `title` | string | yes | Human-readable entry name. |
| `content` | string | yes | Lore or contextual content. |
| `keywords` | array of strings | yes | Terms that may help an application find the entry. |
| `category` | string | no | Suggested values include `location`, `faction`, `character`, `item`, `event`, `rule`, and `lore`. |
| `priority` | integer | no | Relative priority from 0 to 100. Higher values are more important. |
| `enabled` | boolean | no | Whether the entry is active. Defaults to `true`. |
| `extensions` | object | no | Namespaced entry-specific data. |

## 5. Metadata

`metadata` may contain:

- `created_at`: RFC 3339 date-time string;
- `updated_at`: RFC 3339 date-time string;
- `source`: URL or short source label;
- `license`: license identifier or name.

## 6. Extensions

Applications may preserve non-standard data in `extensions`. Each key should use a stable namespace, such as a reverse domain name:

```json
{
  "extensions": {
    "ai.example.tool": {
      "custom_setting": true
    }
  }
}
```

Consumers must ignore extension namespaces they do not understand. Credentials, access tokens, private conversations, analytics identifiers, and personal user data must not be stored in extensions.

## 7. Normalization

A normalizer should:

1. trim surrounding whitespace from strings;
2. lowercase entry IDs;
3. replace spaces in IDs with hyphens;
4. remove duplicate tags and keywords while preserving order;
5. add `language: "en"` when language is absent;
6. add `enabled: true` and `priority: 50` when absent;
7. preserve recognized fields and extension data;
8. reject duplicate IDs rather than silently renaming them.

## 8. Privacy and safety

Before publication, remove:

- real names and contact details that are not intended to be public;
- private conversations or memories;
- API keys, session tokens, internal URLs, and credentials;
- copyrighted content that cannot legally be redistributed.

## 9. Compatibility

This repository does not claim automatic compatibility with Character Card, Lorebook, World Info, or other third-party formats. A compatibility claim requires a documented mapping, test fixtures, and round-trip or loss analysis.
