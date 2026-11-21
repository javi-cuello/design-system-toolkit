# Callers and the project's record

Who runs this skill, and how its findings reach the project's audit record. [SKILL.md](../SKILL.md) links here from its workflow.

## Callers

Other skills name this one to run; none reads its files.

| Caller | What it runs |
|---|---|
| `figma-components-audit` | An optional stage after its own scan, on the same components, when the project has a code target |
| `figma-project-audit` | The target the library's settings name as `codeTarget` |
| The audit dashboard's *Audit* | The recorded target, over the live file |
| The docs site | `validate()` and `translations()` for each component's Implementation section, over the snapshot |

Its findings join the fix queue under their class ids, in the *Decide* section. None is a safe automatic fix, because each is a choice between Figma, code and accept.

**The dashboard's Audit reads the live file.** The service runs the snapshot plugin's own file headless through the bridge (`plugins/design-system-snapshot/code.js`, 0.45.0). It walks every component set into the very shape the store records, then resolves those specs as it resolves stored ones. An audit is about the present, and a snapshot about a stored state (toolkit-standard §D 5). Reading the snapshot here once left a shadow removed at lunch on the Web build board at night.

**Its judgement pass may drop a class only where a ruling names it.** Every finding here is a decision for the maintainer. A judge that dismissed "deliberate-looking" strokes reversed itself between two runs of one file.

**The docs site reads the snapshot**, because a documentation page describes a stored state and must be reproducible from it.

## Writing to the project's record

A project may keep an audit record: `<project>/audit/<fileKey>.json`, one per library, named in the context document's registry. A library is a Figma file, and two files have two runs. Where a record exists, a run writes its findings there as well as reporting them. The dashboard then shows them beside the audits' rows.

File them through the record's one writer, never by hand:

```sh
POST /rows                                           # on the project's dashboard service
node tools/figma-audit/rows.mjs --data <record>      # when no service runs
```

The payload is `{ owner: "component-validator", target, fileKey, full, scope, findings }`. Each finding is one class hit:

| Field | Value |
|---|---|
| `rule` | The class id |
| `check` | The engine's `detail`, as given |
| `key` | As given; the writer matches on it before the wording |
| `where` | The component, and bucket 3 |

**A run closes only rows it owns, for the target it ran.**

- `target` is part of a row's identity, so a web run never closes an iOS row on the same component.
- Only a run with `full: true` over `scope` closes the classes it no longer raises there.
- A ruling goes to the context document, never onto the row.
