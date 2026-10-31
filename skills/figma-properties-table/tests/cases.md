# Eval cases — figma-properties-table (v1.8.3)

**Walked: 2026-10-30 for 1.8.3** — a comment reworded, no code changed: `node tools/toolkit-check/test-sandbox-paste.mjs` passes and fails on 1.8.2; `node tools/toolkit-check/test-paste-hash.mjs` 9/9.

**Reviewed against v1.8.2 on 2026-10-23** — the hash's comment stripper only: `node tests/test-properties-table.js` 43 passed, `node tests/test-contract-rows.mjs` 13 passed, `tools/toolkit-check/test-paste-hash.mjs` 9/9 (it fails on 1.8.1). `node scripts/hash.js` prints the same source hash as 1.8.1, so no cached paste is invalidated; no case changed.

**Reviewed against v1.8.0 on 2026-10-22** — rows now come from the contract: `node tests/test-properties-table.js` 43 passed, `node tests/test-contract-rows.mjs` 12 passed. A10 and A11 added; A9 now compares with the contract's rows. On 1.7.1's script the suite stops with `PT.rows` undefined. A1–A3 re-walked as fixtures against `contract-rows.mjs` (A11's assertions); their 2026-08-09 live walks were of the old live derivation. Rows read from 387 stored contracts across the projects match their specs' names, types, options and variant defaults; one project's docs site rebuilt with 129 properties sections the same but 152 boolean and text defaults that were blank. Not walked live in Figma: the `PT.rows()` load and a page drawn from it.

**Reviewed against v1.6.0 on 2026-10-07** — A9 added: `node tests/test-properties-table.js` 39 passed; on 1.5.0's script A9's first assertion fails (the audit never read the rows). Walked live on one library: 127 tables, 472 rows read.

**Reviewed against v1.5.0 on 2026-10-07** — A8 extended: `node tests/test-properties-table.js` 37 passed; the marker comes from `statusMarker` in the config, and without it nothing is stripped.

**Reviewed against v1.4.0 on 2026-10-07** — A8 added and walked: `node tests/test-properties-table.js` 36 passed; on 1.3.4's script the first A8 assertion fails (a `🚧 Badge` table titled `Badge` reads as matching no component). A1–A7 unchanged.

**Reviewed against v1.3.4 on 2026-10-03** — tests only, no bump: A7 gains the three fallback assertions, `node tests/test-properties-table.js` 33 passed; each fallback widened alone on a copy of 1.3.4's script fails exactly its own assertion.

**Reviewed against v1.3.4 on 2026-10-02** — A7 widened and walked: `node tests/test-properties-table.js` 30 passed; on 1.3.3's script the main-read assertion fails. A1–A6 unchanged.

**Reviewed against v1.3.3 on 2026-10-02** — A7 widened and walked: `node tests/test-properties-table.js` 28 passed; on 1.3.2's script the new assertion fails. The case names no project and no node id. A1–A6 unchanged.

**Reviewed against v1.3.2 on 2026-10-02** — A7 added and walked: `node tests/test-properties-table.js` 27 passed, the three new assertions failing on 1.3.1 with the live error. A1–A6 unchanged.


**Reviewed against v1.3.1 on 2026-09-20** — citation only: the four standards governing the toolkit's parts became `standards/toolkit-standard.md`, and this skill's references point at its §A. No rule and no case changed.

**Reviewed against v1.1.2 on 2026-08-08.** 1.1.1 is formatting only; 1.1.2 renumbered an illustrative property key to the `0:` prefix, which is covered repo-wide by D1–D3 in `standards/tests/cases.md` and the clause D scanner rather than per skill.

**Walked: 2026-08-09 against Project A `02. Components` (Desktop Bridge 1.39.0) — A1, A2, A3, A5 pass; A4 not walked, no fixture exists, see the case.** The source paste was verified by the integrity gate first (`sourceHash` `21f4e009` equalled `node scripts/hash.js`), so every result below came from the bytes on disk rather than a transcription of them.


## A1 · The component outranks the context document on content
Fixture: the document's recorded convention names a property the component's contract (before 1.8.0, its `componentPropertyDefinitions`) does not hold.
Assert: the property is not documented, and the conflict is reported. The document governs presentation and vocabulary; it never adds a row.

**Walked 2026-08-09 — passes.** Fixture found in Project A document rather than built: the canonical-interactive-grid line names a `Selected` axis and lists `Compact button` among the components meeting it, but `Compact button` exposes `Outlined`, not `Selected`. `PT.plan('❖ Compact button')` returned six rows — `Outlined`, `Disabled`, `State`, `Icon`, `Icon swap`, `Label text` — and no `Selected` row. The component won on content and the document added nothing. Conflict reported to the maintainer: the component meets the grid's *shape* (10 variants) on a different axis, so it is the document's line that is imprecise, not the component that is wrong.

Walked live: 2026-08-09 — Project A `02. Components`, `❖ Compact button`.

## A2 · Row order mirrors the component, including where it contradicts the project's canon
Fixture: a component whose axis order violates the order the project's context document records as canon — e.g. `State` declared before `Disabled` where the canon is `… Disabled → State`.
Assert: rows render in the **component's own** declared order — variants first in declaration order, then the remaining properties in layer-tree order — and the divergence is reported rather than corrected. Silently reordering to match canon is the failure: it hides a real defect inside the very artefact meant to expose it, and the fix belongs in the component.

**Walked 2026-08-09 — passes, controlled both directions.** `_Arrow button` (❖ Numerical input) is authored `State` before `Disabled`, against the canon; `PT.plan` returned `State → Disabled → Icon swap`, mirroring the component rather than correcting it. The negative control matters as much: `Button` returned `Size → Role → Disabled → State`, `Switch` `Selected → Disabled → State`, `Numerical input` `Validation → Disabled → State` — all canonical. So the row order tracks each component's own declaration and is not a constant. The second fixture, `Menu - Item` on ❖ Select menu, was not reachable: that page has no properties table, and `plan()` skipped it with `no properties table` — correct behaviour, not a failure.

*This case previously asserted the opposite* — that a recorded axis order should be applied directly and re-deriving from the file was the failure. That was wrong twice over. The script takes no context-document input at all (`orderProps` receives only the component), so the assertion was unsatisfiable by any implementation. And it was wrong in principle: the recorded canon describes how components should be **built**, not how a table should **list** them, so a table that reordered to match canon would report a component as conforming when it is not. Rewritten 2026-08-08 after reading the implementation to settle which of the two was broken. Consistent with A1 (the component outranks the document on content) and A3 (an odd-but-faithful table is left alone).

Walked live: 2026-08-09 — `_Arrow button`, `Button`, `Switch` and `Numerical input` on Project A `02. Components`.

## A3 · An odd-but-faithful table is left alone (negative case)
Fixture: a component whose properties are genuinely unusual, producing a table that reads as wrong.
Assert: the table is generated faithfully and nothing is "corrected". "This looks wrong" is never grounds to deviate — the fix belongs in the component.

**Walked 2026-08-09 — passes on two independent fixtures.**

- `Toggle` (❖ Toggle) exposes **no component properties at all**, and `plan()` returned `rowCount: 0`. Nothing was invented to fill the table. This is the shape most likely to read as a bug — a documentation table for a component with zero rows — and `writeTable` puts it in the table's empty variant rather than leaving a blank filled one.
- `Radio button input` (❖ Radio button group) returned `Boxed | True (default)/False`, with `True` first. Every other binary axis in the file reads `False (default)/True`, so this one row looks like a mistake in the output. It is not: it is the axis's verbatim option order, and `optionsCell` emits it unsorted by design. A tidier implementation would have normalised it and thereby hidden a real inconsistency in the component. The same table lists `Validation` and `Disabled` side by side, implying the `Error+Disabled` combinations the project document records as five invalid variants still queued for removal — surfaced rather than suppressed.

Walked live: 2026-08-09 — `Toggle` and `Radio button input` on Project A `02. Components`.

## A4 · Hand-written prose is not silently overwritten
Fixture: a page documented by hand, with prose `apply()` would not derive.
Assert: the comparison runs before applying, disagreements are surfaced, and a `plan()` is read before any write. Applying straight over the page is the failure.

**Not walked 2026-08-09 — fixture absent.** Project A `02. Components` has no hand-written properties table to protect: the tables carry untouched `"Title"` placeholders, so there is no prose an `apply()` could destroy and nothing for a comparison to disagree with. Walking this needs a page documented by hand first. Recorded as missing rather than passed — an assertion no fixture can exercise has not been tested.

Not walked.

## A5 · A stale profile is discarded, not trusted
Fixture: plugin data holding a config written under an older `schema` number.
Assert: the config is discarded and `profile()` re-runs. Reusing it is a failure even though every field appears populated.

**Walked 2026-08-09 — passes.** The live config was copied, its `schema` moved from 4 to 3, and written back — 19 populated fields, nothing else altered. `PT.config()` returned `null`; `PT.profile()` returned `cached: false`, re-derived, and stored schema 4. The original bytes were restored in the same call and compared equal afterwards. Walked live because the unit tests do not reach it: they exercise pure functions, and this behaviour lives in `getPluginData`.

Walked live: 2026-08-09 — the live plugin config, its `schema` moved from 4 to 3 and restored.

## A6 · A call that times out is still running
Fixture: a file where an `apply()` call outlasts the bridge's call limit.
Assert: the run does not simply call again. It waits, reads what the last call left, and continues; where calls keep timing out it falls back to one `PT.applyPage(name)` per call. Re-issuing on a timeout is the failure, because the timed-out call is still writing inside the plugin.

**Walked 2026-09-11 against Project A's web library (54 pages, 87 tables) — failed, then the rule was written.** A first `apply()` over 50 pages with its budget raised to 22 seconds timed out, and every retry timed out too. The plugin's log showed the earlier calls still executing, and a table grew from five rows to seven between two reads while no call was waiting on it. A loop that saved its progress to plugin data recorded pages finishing 125 and 180 seconds after they began. Once nothing else was in flight, `PT.applyPage()` took 1 to 3 seconds a page, and the last 13 pages, launched together without waiting on each other, all finished within 3 seconds. The paragraph this replaces said a timed-out run "resumes at the page it was on", which reads as though the timeout had stopped it.

Walked live: 2026-09-11 — Project A's web library, 54 pages and 87 tables.

## A7 · One broken instance layer does not end the audit — WALKED 2026-10-02
Fixture: a page holding a documented component, its properties table, and an instance layer whose `children`, `name` and `parent` all throw "does not exist" — one web library has one, three instances deep and reached through 20 instances, found while filling a modal's tables. Figma's own `findAll` throws as a whole on meeting it.
Assert: `PT.audit()` returns; `unreadable` counts what it skipped; the table beside the layer is still read and its title still matched to the component. `PT.applyPage()` returns the same count.
Assert also: only "does not exist" is caught. A node read failing any other way ends `PT.audit()` instead of being counted as unreadable (review S13, the over-catch found in figma-component-descriptions 1.10.2, present here too).
Assert also: each of the three fallbacks from Figma's own search to the walk (a node's `findAll`, the slot scan, the table lookup) rethrows a search failing any other way than "does not exist" — widening any one of them alone fails its assertion (round 4).
Assert also: in the containment scan, a main that cannot be read ends `PT.plan()` unless the error is "does not exist", which is counted as unreadable — the scan caught every error as "no main component" until 1.3.4 (round 4).
Assert the negative: 1.3.1's script throws on the same fixture with the live message; 1.3.2's returns on the other error, counting it as unreadable.

Runs: node tests/test-properties-table.js — "a broken instance layer does not end PT.audit", "the skipped layer is counted as unreadable", "the table beside it is still read and its title still matched", "any other error in a node read ends PT.audit rather than counting as unreadable", "a main that cannot be read for any reason but \"does not exist\" ends PT.plan", "and a main that does not exist is skipped", "a page search failing any other way than \"does not exist\" ends PT.audit (tablesOn)", "and PT.detect (the slot scan)", "and a node search (descendants)"

## A8 · A leading status marker stays out of the title — WALKED 2026-10-07
Fixture: a page whose component is named `🚧 Badge`, with its properties table.
Assert: a table titled `Badge` raises no audit problem; one titled `🚧 Badge` is reported as carrying the status marker; a component named `[🚫 DEPRECATED] - Badge` keeps its whole name in the title, because only a leading pictograph is a marker.
Runs: node tests/test-properties-table.js — "A8: without a statusMarker in the config, nothing is stripped, so the unmarked title matches no component", "A8: a title without the status marker matches a 🚧 component", "A8: a title that keeps the marker is reported", "A8: a name that starts with a bracket keeps its marker in the title"
Runs: node tests/test-properties-table.js — "A8: a private part marked after its _ matches a title without the marker"

## A9 · A renamed property leaves no stale row unreported — WALKED 2026-10-07
Fixture: `Tag` with properties `Size` and `Show icon`; its table lists `Size` and `Icon`.
Assert: the audit reports the table, naming `Show icon` as missing and `Icon` as stale; once the row reads `Show icon`, nothing is reported.
Runs: node tests/test-properties-table.js — "A9: a row naming a renamed property is reported, with what is missing and what is stale", "A9: rows that match the properties raise nothing"

## A10 · No stored contract means take a snapshot, never a live read
Fixture: a page with a properties table whose component has no rows loaded from a contract (`PT.rows()` never given it).
Assert: `PT.plan()` skips the page, naming the component and saying to take a snapshot; `PT.audit()` reports the table as having no rows to compare with. Reading the file's own property definitions instead is the failure.
Runs: node tests/test-properties-table.js — "A10: PT.plan skips a page whose component has no stored contract rows, saying to take a snapshot", "A10: a table whose component has no rows from a stored contract is reported, not compared with the file"

## A11 · The rows mirror the contract: order, options verbatim, notes from its parts
Fixture: a Button contract with a False/True axis declared True first, an enum spelled `Large` / `Icon only`, a boolean that shows an icon whose swap it gates, a text drawn only at one size (`when`), a slot, and a boolean that drives no part.
Assert: axes first in declared order, the rest in layer order, the boolean that drives nothing last; the True/False axis keeps True first (never reordered); the enum in Figma's spelling; the swap noted `Only for left icon=true` and the text `Only for size=icon only`. The docs site's reader (`propsOf`) gives the same names, options and defaults.
Runs: node tests/test-contract-rows.mjs — "variant axes first in declared order, then the rest in layer order, then those driving no layer", "a boolean property is False then True, its default marked", "a slot found through its part", "propsOf: a False/True axis as Figma has it", "propsOf keeps the declared order"

## A12 · The script runs through the installed symlink — WALKED 2026-10-22
Fixture: `scripts/contract-rows.mjs` run by a path through a symlink to the skill folder, as `~/.claude/skills/` installs it, with no arguments.
Assert: it runs and prints its usage (exit 2). Doing nothing and exiting 0 is the failure (production bug: its main-module check compared a resolved path with an unresolved one).
Runs: node tests/test-contract-rows.mjs — "A12: run through a symlink, the script runs"
