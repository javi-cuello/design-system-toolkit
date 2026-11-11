# Component validator

What a code target cannot reproduce as a Figma component is drawn: the engine that reads component trees and reports, per target (web, iOS, Android, with a framework's constraints on top), each place the platform cannot draw as designed, with the choice to make (change it in Figma, translate it in code, or accept it as a named deviation).

## Use

```sh
node tools/component-validator/validate.mjs --target web|ios|android [--text-styles tokens.json] [--states '{"axis":…,"options":[…]}'] [--snapshot] components.json
```

It prints `{ target, silent, findings }` as JSON and exits 1 when there is a finding, 2 on a usage error; it writes nothing. `--snapshot` reads a stored snapshot's component records (`fromSnapshot`). A framework's rules (`frameworks`: `mui`) are reached from the module only.

As a module: `validate(components, target, opts)`, `translations`, `fromSnapshot` and the rest of its exports. Its callers: the [component-validator](../../skills/component-validator/SKILL.md) skill, which says how to read and act on a report and keeps the live reader `walk-figma.js`; a repo's check through [`tools/project-check/validate.mjs`](../project-check/README.md), which the snapshot router runs after every library snapshot; the docs site; and the audit dashboard's `/validate` ([tools/figma-audit](../figma-audit/README.md)).

## How it fits

One engine, so every caller gets one answer. It was the skill's `scripts/validate.mjs` until 2026-10-31 and moved here because projects call it (toolkit-standard §D 1, skill-standard §A clause G). The rule sets' sources are the skill's references (`skills/component-validator/references/`).

## Test

```sh
node tools/component-validator/test-validate.mjs     # every target over fixtures/components.json, and the CLI
```
