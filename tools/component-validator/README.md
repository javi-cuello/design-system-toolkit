# Component validator

The engine that finds what a code target cannot reproduce of a Figma component as drawn. It reads component trees and reports per target: web, iOS or Android, with a framework's constraints on top. Each finding is a place the platform cannot draw as designed. It comes with the choice to make: change it in Figma, translate it in code, or accept it as a named deviation.

## Use

```sh
node tools/component-validator/validate.mjs --target web|ios|android [--text-styles tokens.json] [--states '{"axis":…,"options":[…]}'] [--snapshot] components.json
```

It prints `{ target, silent, findings }` as JSON. It exits 1 when there is a finding and 2 on a usage error. It writes nothing. `--snapshot` reads a stored snapshot's component records (`fromSnapshot`). A framework's rules (`frameworks`: `mui`) are reached from the module only.

As a module, it exports `validate(components, target, opts)`, `translations`, `fromSnapshot` and more. Its callers:

- the [component-validator](../../skills/component-validator/SKILL.md) skill, which says how to read and act on a report and keeps the live reader `walk-figma.js`;
- a repo's check through [`tools/project-check/validate.mjs`](../project-check/README.md), which the snapshot router runs after every library snapshot;
- the docs site;
- the audit dashboard's `/validate` ([tools/figma-audit](../figma-audit/README.md)).

## How it fits

One engine, so every caller gets one answer. It was the skill's `scripts/validate.mjs` until 2026-10-31. It moved here because projects call it (toolkit-standard §D 1, skill-standard §A clause G). The rule sets' sources are the skill's references (`skills/component-validator/references/`).

## Test

```sh
node tools/component-validator/test-validate.mjs     # every target over fixtures/components.json, and the CLI
```
