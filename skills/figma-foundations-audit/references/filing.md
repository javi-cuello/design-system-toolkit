# Judging, filing and closing

Steps 4 to 6 of [SKILL.md](../SKILL.md): which candidates survive, how they reach the record, and when this skill's rows close.

## Contents

- [Judging](#judging)
- [Filing](#filing)
- [Closing](#closing)

## Judging

A page position or name that the document's §6 rules on is suppressed, not reported. Nothing else suppresses a finding, since these checks are deterministic.

**Only the part rule goes to a judgement pass.** The dashboard files the fixed-rule findings (page order, a bare slash, a case collision) as raised. It puts only the part-rule questions to its judgement pass, judged against the rulings alone. A judgement pass over the fixed rules, even one told to keep anything a ruling did not name, dropped a real page-order finding.

## Filing

File the survivors through the record's one writer, never by hand:

- `POST /rows` on the project's dashboard service, or
- `node tools/figma-audit/rows.mjs --data <record>` with the same payload, when no service runs.

The payload is `{ owner: "figma-foundations-audit", fileKey, full, scope, ran, findings }`. Its full shape is at the top of `rows.mjs`.

| Field | What it holds |
|---|---|
| `scope` | What the scan read: its `reach` |
| `ran` | The checks the scan ran: its `ran` |
| `full` | `true` for a full run, `false` for a partial one (*Closing*) |
| `findings` | One finding per survivor |

Each finding carries these fields:

| Field | What it holds |
|---|---|
| `text` | What is wrong, and what it costs the reader |
| `advice` | The concrete fix alone: the name to use, the page to move and above which, the separator to restore |
| `key` | The finding's subject, never its wording |
| `check` | The scanner's own wording |
| `rule` | The rule as the scanner gave it |
| `bucket` | Page order is 1, a safe programmatic fix; naming is 3, a decision, because a rename changes what consumers see |

**`text` and `advice` stay two strings** (design-standard rule 10). The board shows them in different columns, so one string puts the answer where the question goes.

Keys look like `page-order|page|<section>|<page>` or `naming|parent-name|<parent>`.

**The `key` lets the writer find the row after a rewording**, rather than minting a second one. The writer mints the row's key, matches a row already there, and coerces severity.

## Closing

Close only your own rows, and only from a full run that says what it read.

- Send `full: true` with `scope` (the scan's `reach`) and `ran` (its `ran`).
- The writer then closes this skill's open rows that the run no longer raised. It closes only inside that scope, only for the checks that ran, and never a row another skill raised.
- A payload with `full` but no `scope` or no `ran` is refused. The findings are filed, nothing closes, and the result names the missing clause.
- A partial run sends `full: false` and can only add.

**Why both are required.** Without `reach` and `ran`, a clean library and a check that never ran give the same empty answer. A full run would then close rows that are still wrong.
