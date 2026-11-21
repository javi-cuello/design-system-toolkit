# What profile() must get right

Check these fields in the config `profile()` returns before applying, because everything else depends on them. [SKILL.md](../SKILL.md) step 3 points here.

## The fields to check

| Field | What to look for |
|---|---|
| `tableName`, `seenOnPages` | The documentation table recurs across most pages. A `seenOnPages` of 1 means detection probably found something else. `rejected` lists the runners-up. |
| `columns` | Should match the table's column count, typically 4. A large number means a data table was picked up instead. |
| `titleTextProp`, `titleResolvedBy` | `value match` found the component's name in the title, which is reliable. `name heuristic` is a guess, so check it. |
| `labelTextProp` | The text property not chosen as the title. Look at it when the heuristic was used. |
| `emptyProp`, `emptyValue` | Detected by finding the variant with no rows slot. |
| `scannedPages`, `scanTruncated` | Detection works to a time budget. A truncated scan means a partial count, so `seenOnPages` understates reality. |

The title and the subcomponent label are both TEXT properties, so type alone cannot separate them. That is why `titleResolvedBy` says how the title was chosen.

`columns` and `labelTextProp` are the only two fields the script never reads back. They exist to be looked at here, which is why detection records them.

## A table found on one page

When `seenOnPages` is 1 and the table's title names no component on that page, `profile()` stores nothing. It returns an `error` with the config instead. Once a person has said it is the table, `PT.setConfig(config)` stores it.

## Stale configs

The config carries a `schema` number. A config written by an older version of the script is discarded rather than trusted, so `profile()` simply re-runs.

## What detection needs

Detection needs one table with structure to learn from, not a filled-in one. That is a rows slot holding at least two row instances, each holding at least three cells. Placeholder rows straight from the library are enough.

- In a file where no such table exists, build one by hand first, then profile.
- A table on one page only must be titled with its component's name, or `profile()` stores nothing (above).
- With a placeholder title, read the returned config and store it with `PT.setConfig(config)`.
