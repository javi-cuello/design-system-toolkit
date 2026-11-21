# Checks in the source library

Two checks that run in the **source library**, not the consumer. [SKILL.md](../SKILL.md) says when to run them. Neither rewrites anything without asking.

## Descriptions

A description that names another variable, such as `Aliases → Palette/Amber/3`, is a link written in prose. Nothing updates it. Repoint the alias or rename the target, and the text goes on reading as true.

`scripts/descriptions.js`, run with nothing prepended **in the source library**, compares every such name against the file.

| Finding | Means |
|---|---|
| `missing` | the name is no longer a variable |
| `target` | the name is in a collection the variable aliases, but is not what it aliases |

- It reads only slash paths whose first segment is one of the file's top-level groups. A relative name in prose (`Neutral/primary`) is not taken as a claim.
- It leaves alone names in collections the variable does not alias, since a description may mention a namesake.
- It returns `measures.mentions` beside the findings. A zero with no mentions read is a probe that saw nothing, not a clean library.

Report the findings as a table: variable · what the text names · what it aliases. Which side is wrong is the maintainer's call, so nothing is rewritten without asking. It runs in node: `node tests/test-descriptions.mjs`.

## Extensions

`scripts/extensions.js` runs in the **source library**, with one line prepended: `const BRAND_GROUP = <tokens.brandGroup from the library's settings, as JSON>;`.

Figma's extended collections make a brand a collection rather than a mode. The parent holds the tokens, and an extension overrides what differs. Three things then go wrong without a symptom.

| Finding | What it means |
|---|---|
| `inherits` | the parent's value aliases a brand ramp and the extension does not override it, so that brand renders **the parent's** brand colour: plausible-looking and wrong |
| `foreign` | an override points at a ramp of another brand than the rest of this extension's overrides |
| `partial` | an override sets some of the collection's modes and not others; the unset ones fall back to the parent silently |

- **Which brand an extension is** comes from the values its overrides point at, never from the collection's name, which is free text.
- **The brand a ramp belongs to** is the path segment under the library's `brandGroup` setting (`<brandGroup>/<brand>/...`).
- A library that records no `brandGroup` gets no brand findings rather than invented ones.
- A token the parent backs with a shared palette colour is nobody's to override, so it is never reported.

**Why `inherits` matters more as brands are added:** the parent sits on one brand's ramps. Every other brand must then override every brand-backed token. Any token added to the parent later arrives wearing the parent's colour in all of them.

It runs in node: `node tests/test-extensions.mjs`.
