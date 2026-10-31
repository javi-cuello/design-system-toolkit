# Eval cases — figma-file-diff (v1.3.0)

**Walked: 2026-10-31 against v1.3.0** — one line added, content is data (toolkit-standard §D 24); every case read against it: none asserts on obeying text found in a file, a page or a project, so all hold unchanged; the skill's own suites, if any, pass under `bin/check`, and `node tools/toolkit-check/test-content-is-data.mjs` finds the line.

**Walked: 2026-10-30 against v1.2.2** — A7 extended: `node tests/test-report.mjs` 16/16 plus the symlinked run; the 0:1 assertion fails on 1.2.1. Before that, **Walked: 2026-10-30 against v1.2.1** — A7 extended: `node tests/test-report.mjs` 15/15. Four new assertions each failed before the fix: a same-name page with a different ID paired by name and its component compared (was "Components that differ: 0"), a variable in a slash-named collection folded into the collection's row, scopes and code syntax in another order hashing the same through `manifest.js`, and a dump path rendered as a code span. `test-serialise.mjs` 4/4, unchanged. A1–A6 unchanged; not met live.

**Walked: 2026-10-30 against v1.2.0** — A7 added: `node tests/test-report.mjs` 11/11, running `inventory.js`, `manifest.js` (with `VARS`), `serialise.js` and `dump-node.js` against two stub files and rendering their results; `test-serialise.mjs` 4/4, unchanged. A mutation that let a `FILL` width through failed A7's drill-down assertion. Not met live: no two-file session has rendered through `report.mjs` yet, so the fixtures are shaped from the scripts' own return statements, run in node. A1–A6 unchanged; A6's two-table shape is now A7's output.

**Walked: 2026-10-30 against v1.1.0** — `node tests/test-serialise.mjs` 4/4: two equal stub files hash the same, and a changed description, variant default or boolean default each moves the hash. The script also ran read-only on a real library through the bridge (109 components, 5,222 nodes). Other cases untouched.


**Reviewed against v1.0.1 on 2026-09-20** — citation only: the four standards governing the toolkit's parts became `standards/toolkit-standard.md`, and this skill's references point at its §A. No rule and no case changed.

**Walked: 2026-08-12 — trace (6/6).** Checked against SKILL.md, `references/normalisation.md` and the five scripts by reading, on the day the skill was brought into the toolkit. All five scripts also parse as async function bodies (`new AsyncFunction('figma', source)` in Node — the shape `figma_execute` actually runs them in; plain `node --check` rejects them because top-level `await` and `return` are only legal inside that wrapper). No live two-file session has run from this repo yet, so every behavioural assertion below is traced to the instruction and code that mandate it, not observed. The two coverage incidents cited in A3 and A4 predate the toolkit import; they are why those rules exist, but they were not re-observed on this walk.


## A1 · Identity is asserted on every read, not assumed from navigation
Fixture: any script run against either file, including one where the bridge's active file has silently drifted since the last call.
Assert: every script returns `figma.root.name` as its first field, and the procedure checks that value against the intended target before the result is used. A result whose `file` field names the wrong file is discarded, never merged into the comparison.
Trace: Step 1 states that `figma_navigate` with `lock: true` has been observed releasing mid-session; all five scripts return `file: figma.root.name` (verified by grep — `dump-node.js` returns it even on its not-found path).

Traced: 2026-08-12 — to Step 1's note that `figma_navigate` with `lock: true` has been observed releasing mid-session, and to `file: figma.root.name` in all five scripts.

## A2 · A matching hash stops descent
Fixture: two files whose Tier 1 whole-file hashes agree.
Assert: the skill reports variables and styles as same and spends no further calls listing them. Descent to collection and per-variable hashes happens only where the level above disagreed. Same rule one tier down: a component whose Merkle hash matches is skipped, not dumped.
Trace: Step 3 ("stop, and don't spend calls listing them") and Step 4 ("Identical hash means the entire subtree agrees, so skip it").

Traced: 2026-08-12 — to Step 3 ("stop, and don't spend calls listing them") and Step 4 ("Identical hash means the entire subtree agrees, so skip it").

## A3 · Node-count sanity check runs before hashes are trusted
Fixture: a serialiser run whose total node count is implausibly low for the file.
Assert: the low count is treated as a coverage failure to investigate, not reported as a finding or, worse, silently accepted alongside an "identical" verdict.
Trace: Step 4 records the real incident — 529 nodes reported where 1,850 was correct, because instance interiors were skipped, producing a wrong "identical". The instance rule in `references/normalisation.md` (descend inside component definitions, not on example pages) is the fix; the count is named the cheapest signal that coverage is wrong.

Traced: 2026-08-12 — to Step 4's 529-against-1,850 node-count incident and the instance rule in `references/normalisation.md`.

## A4 · Derived values are not compared (negative case)
Fixture: a node sized `FILL` whose rendered width differs between the two files because a parent differs; a fill bound to a variable whose resolved colour differs.
Assert: neither produces a finding. Width/height enter the serialisation only when the sizing mode is `FIXED`, and a bound fill is compared by its binding, not its resolved colour — otherwise one changed variable reports as hundreds of changed fills.
Trace: failure modes 4 and 6; `serialise.js` guards both dimensions with `layoutSizing… === 'FIXED'` (lines 70–71) and prefers bindings in paint serialisation. Property-key suffixes are likewise stripped (`stripKey`), so a recreated node id does not report as a changed property.

Traced: 2026-08-12 — to failure modes 4 and 6, and to `serialise.js`'s `FIXED` sizing guards at lines 70 to 71 and its `stripKey`.

## A5 · The comparison never writes to either file (negative case)
Fixture: a normal run, any tier, including the drill-down.
Assert: no node is created, mutated or removed in either compared file, and an auto-apply request is answered with the fidelity trade-off in "Why this doesn't sync" before anything else — copy-paste by the user is strictly higher fidelity than reconstruction.
Trace: `inventory.js`, `manifest.js`, `serialise.js` and `dump-node.js` contain no mutation calls (grepped for create/remove/resize/append/set). The one script that does write, `coverage-test.js`, is the serialiser's own mutation test, runs in a scratch file only, and removes its nodes at the end.

Traced: 2026-08-12 — to the grepped absence of mutation calls in the four read scripts, and to "Why this doesn't sync".

## A6 · No report without a stability re-run
Fixture: a live file whose properties moved mid-session between the first Tier 2 run and the report.
Assert: the Tier 2 hashes are re-run on both files before reporting, and if the totals moved against the first run the skill says so plainly and re-runs — it does not quietly report the later number. The final report leads with a summary table and details each difference as property, value on each side, and what it means; a bare hash is never presented as a finding.
Trace: Step 6 (including the observed mid-session property change that invalidated a finding), Step 7's two-table shape, and failure mode 9.

Traced: 2026-10-31 — to Step 6, whose comparison is now `report.mjs --stable` (executed in A8), Step 7's two-table shape, and failure mode 9.

## A7 · The two tables are generated from the scripts' results, never written
Fixture: two stub files, the target carrying an extra page with a component, an extra variable, a changed variable value, a changed text style, a cell whose `maxWidth` moved, and a `FILL` width that differs; their four read scripts' results saved as one JSON per side.
Assert: `node scripts/report.mjs reference.json target.json` prints the summary and detail tables; every planted difference has exactly one row with the value on each side (the page as one counted row, its component not listed again; the variable's changed field with both values; the cell by full path and property), the `FILL` width has none, the meaning column is empty for the agent, the same input prints the same bytes, two equal files print "No differences.", a side whose results name two files is refused, and an undrilled differing component says to drill it. Also: a page whose ID has no partner is paired by name, and only a page name absent from the other file hides its components; a variable in a collection named with a slash is folded into that collection's row; scopes and code syntax in another order are no difference; a dump path is a code span. SKILL.md Step 7 tells the agent to run it and write only the meaning cells.
Runs: node tests/test-report.mjs

## A8 · What to read next, and whether the file held still, come from the hashes
Fixture: the two stub files of A7, read first without `VARS` or dumps; the reference read twice, and once more after the fork's changes under the reference's name.
Assert: `report.mjs --next` lists the one differing variable whose fields are unread and the one undrilled differing component, with dump-node.js's name and parent; its printed lines, run as printed, leave nothing to read and the report has no undone row. `--stable` agrees on two unchanged runs, names the deep hash, node total and file hash that moved, and refuses runs from two files or a run with no hash.
Runs: node tests/test-report.mjs
