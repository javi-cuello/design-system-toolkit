# Reviewing the result, and known limits

How to read what `plan()`, `applyPage()` and `audit()` return, and what the skill does not do. [SKILL.md](../SKILL.md) step 7 points here.

## Reviewing the result

| Field | Returned by | What it means |
|---|---|---|
| `primaryGuessed` | `plan()`, `applyPage()` | No component carried the page's name, so the order rests on containment and tree order |
| `containmentScanned: false` | `plan()`, `applyPage()` | The containment scan ran out of budget; matters only on a page with several components |
| `problems` | `audit()` | Should be empty: missing and stale rows, titles, and labels with `{ labels: true }` |
| `orderDisagreements` | `audit()` | Usually not empty, and not errors: a hygiene finding about the component |
| `unreadable` | `audit()`, `applyPage()` | Broken layers skipped because Figma said they do not exist |

`primaryGuessed` is usually right. It also catches a page name and component name that have drifted apart, which is worth fixing at the source.

`problems` compares each table's rows with the rows loaded from the component's contract. It names the missing and the stale per table, because a renamed property leaves a stale row that a title-and-count check passes. A table whose component has no rows loaded is reported as such.

`orderDisagreements` is the one live read left, and never table content. Each means a component's stored option order and its variant grid have drifted apart. That normally points at untidy arrangement in the set.

`unreadable` counts only "does not exist" errors. Any other error ends the call, because counting it would let a fault in the script read as a clean audit.

Also surface to the person any note that reads oddly, and any component whose mirrored defaults look wrong. Both are findings about components, not about tables.

## Known limits

The rows' sources:

- A contract keeps a boolean axis's `figmaValues` only when Figma's order or spelling is not False, True. Otherwise both are read from the spec, in the same walk.
- A component no contract can be derived for gets no table. `derive.cjs` refuses it, as it does on a snapshot, and `--live` names it.
- The rows need the audit service and the Desktop Bridge. With either missing, `--live` says which and the table waits. The stored snapshot is never read instead, since it can be older than the file.

The tables:

- Creating a Properties section from scratch is not implemented. Pages without one are skipped.
- A page whose properties table is missing or renamed is skipped rather than matched by shape. Shape matching would sooner or later find a data-table example and overwrite its cells.
- Detection picks the first table meeting the shape and score test; `setConfig()` is the escape hatch.
- The rows slot is matched by name, never by position. A header row can itself be built on a slot, above the rows, so a positional fallback writes rows over the column headings. A renamed rows slot means a re-profile, which is the safer failure.
