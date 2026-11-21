# Output tables

What Step 7's two tables look like, and which parts of them are yours to write. [SKILL.md](../SKILL.md) Step 7 says how to produce them.

## Generated, not written

Both tables come from `node scripts/report.mjs reference.json target.json` (toolkit-standard §D 23). Aggregate counts alone are not actionable, so the output is always a summary table, then a detail table. Paste what the script prints.

What is yours to write is what the results do not determine:
- each **What it means** cell;
- where several rows share one cause, that cause, said once in a line under the table.

## Rows that are not findings

| Row reads | What it means | What to do |
|---|---|---|
| *not drilled* | Step 5 was left undone | Drill the component, then render again |
| *fields not read* | Step 3's `VARS` re-run was left undone | Re-run `manifest.js` with `VARS`, then render again |
| *differs in a property dump-node.js does not read* | `serialise.js` hashes something `dump-node.js` does not show | Find it in Figma and say what it is |
| A style row | Styles differ by hash only | Read the style in Figma to write its meaning |

## Summary table

One row per area, counts only. The shape the renderer prints:

| | Reference | Target | |
|---|---|---|---|
| Pages | 37 | 40 | target +3 |
| Collections | 4 | 4 | same |
| Variables | 164 | 164 | same |
| Text / effect / paint / grid styles | 12 / 1 / 0 / 0 | 12 / 1 / 0 / 0 | same |
| Components | 43 | 44 | target +1 |
| Nodes inside components | 1,850 | 1,867 | target +17 |
| Components that differ | 2 | 2 | `Row - Effects`, `Table - Effects` |

## Detail table

One row per actual difference. The meaning column is the one you write:

| Where | Reference | Target | What it means |
|---|---|---|---|
| `❖ Effects / Row - Effects` → Cell | maxW 120 | maxW 160 | first column 40px wider in the fork |

Row rules:
- A row uses the full ancestor path (page / … / component → node), never a bare node name.
- A page or collection present on one side only is one counted row, not one row per component or variable on it.
- When several differences share a cause, say it once. A component inheriting a change through nested instances is one cause, not many independent symptoms.
- A meaning says what changed for the user, never a hash: "first column 40px wider", not "hash 8a512215 vs dc5ca29".
