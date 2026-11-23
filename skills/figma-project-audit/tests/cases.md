# Eval cases — figma-project-audit (v1.9.0)

**Walked: 2026-11-23 against v1.9.0** — O8 added and executed with O7: `node tests/test-stages.mjs` (the one Audit, its radios, the file checkboxes, the four ways a file is audited, the lock held across files); O1 to O6 re-read against the changed step-2 line, none changed.

**Walked: 2026-11-23 against v1.8.0** — `gather.timeout` added to every Figma stage: O7 re-run, `node tests/test-stages.mjs` 92/92 (each stage carries a timeout, none is defaulted, no runner keeps a number of its own); O1 to O6 untouched, no stage or order changed.

**Walked: 2026-11-22 against v1.7.4** — four `stages.json` descriptions shortened: O7 re-run, `node tests/test-stages.mjs` 85/85 (each is still a one-line sentence); O1 to O6 untouched by a wording change.

**Walked: 2026-11-22 against v1.7.3** — the registry moved to `scripts/stages.json`: O7 re-run, `node tests/test-stages.mjs` 85/85.

**Walked: 2026-11-21 against v1.7.2** — main's clause-I rewrite (1.5.0) merged with the stage registry (1.6.0 to 1.7.2): the sequence is the list in `stages.json` again, in the clause-I layout. O7 executed: `node tests/test-stages.mjs` 85/85. O5 now traces to step 3 and *Breaking changes are not a stage*. O1 to O4 and O6 re-read and hold.

**Walked: 2026-11-21 against v1.7.1** — O7 rewritten to what the test checks, and executed: `node tests/test-stages.mjs` 82/82. Each runner's HANDLERS run through `runStages` as stubs (a row per stage, in order, none unhandled); the planted missing handler, reversed handlers, skipped id and reordered rows are each caught.

**Walked: 2026-11-21 against v1.7.0** — O7 executed: `node tests/test-stages.mjs` 66/66, Audit lite no longer skipped (its `HANDLERS` keys are the four stages the list gives it), every stage has a label and a one-line description, and `appliesTo` answers always, a fact and a setting. O1 holds: Audit lite now runs the file stage before the components, in the list's order. O2 to O6 unchanged.

**Walked: 2026-11-21 against v1.6.0** — O7 added and executed: `node tests/test-stages.mjs` 54/54, its planted handler caught both ways. O1 and O6 re-read against the new sequence: O1's order now comes from `stages.json` and holds; O6's `bin/get` path holds because SKILL.md still says to run each owner, which the suite asserts. O2 to O5 unchanged.

**Walked: 2026-11-21 against v1.5.0** — SKILL.md rewritten to skill-standard §A clause I; every case re-read. O1 to O4 and O6 hold unchanged (O6's *A stage whose skill is not installed* is kept). O5 now traces to step 7 and *Breaking changes are not a stage*, where old step 8 moved; the report still opens with the open breaking changes.

**Walked: 2026-11-20 against v1.4.1** — the record contract is cited in tools/figma-audit/REFERENCE.md (the README rewrite); no case reads the path, so none re-traced.

**Walked: 2026-10-31 against v1.4.0** — O6 added and traced; O1 to O5 re-read against the new paragraph, none changed (a missing stage is a skip, as O2's missing setting is).

**Walked: 2026-10-31 against v1.3.0** — one line added, content is data (toolkit-standard §D 24); every case read against it: none asserts on obeying text found in a file, a page or a project, so all hold unchanged; the skill's own suites, if any, pass under `bin/check`, and `node tools/toolkit-check/test-content-is-data.mjs` finds the line.

**Reviewed against v1.2.5 on 2026-10-14** — no case changed: the dashboard service is `tools/figma-audit` (was `tools/figma-dashboard`); paths in prose and comments only, behaviour unchanged.

**Walked: 2026-10-01 for 1.2.0** — O5 added and traced to step 8; the filing it describes is executed by `tools/figma-audit/test-breaking.mjs` (12/12).

**Reviewed against v1.1.0 on 2026-09-30** — no case changed; a sixth stage was added to the sequence, after the links stage, and no case asserts the stage count.

**Walked: never.** Written with the skill on 2026-09-10 while the Figma bridge was disconnected. Each assertion traces to an instruction in `SKILL.md`; none has been observed in a live run yet.

## O1 · The order holds for any subset
Fixture: a request to audit "the components and the file" on a library whose settings name a code target.
Assert: the foundations audit runs before the components audit when a stage may apply fixes, and neither the validator nor the variable audit runs, since they were not asked for. The dashboard's *Audit*, which applies no fixes, runs components first and is not a failure of this case. The report names the two stages that ran and the two that were not asked for.

Not walked.

## O2 · A missing setting is the stage's to report, never this skill's to fill
Fixture: a library whose `audit-settings` entry has no `codeTarget`.
Assert: the validator stage is skipped with the reason "no code target recorded". This skill does not choose web, or any target, on the project's behalf.

Not walked.

## O3 · It names skills and reads none
Fixture: a full run.
Assert: every stage is started by naming its skill. This skill opens none of their files, and holds no check, prompt or scale of its own.

Not walked.

## O4 · Running here is not approval to fix
Fixture: a full run in which the components audit raises a safe programmatic fix.
Assert: nothing is written to Figma. The finding is filed as a row, and the report says which fixes wait for the maintainer.

Not walked.

## O5 · Breaking changes are reported, never run or closed by the audit
Fixture: a library whose audit record holds two open rows owned by `figma-snapshot-router` (a property removed, a variant option renamed) and whose live file is otherwise clean.
Assert: the report's first line says two breaking changes are undecided and names them; no stage files, re-raises or closes a `figma-snapshot-router` row.
Assert also (negative): the audit does not read the change log as a stage; a stage reads the live file (toolkit-standard §D 5).

Traced: 2026-10-01 — to step 8, now step 3 and *Breaking changes are not a stage* (v1.7.2). The service half is executed in `test-breaking.mjs`.

## O6 · A stage skill that is not installed is named, and the rest run
Fixture: a full run in a session where `component-validator` is not among the installed skills, on a library whose settings name a code target.
Assert: the report's code-target line says the stage was skipped because `component-validator` is not installed, and how to get it (`bin/get skills/figma-project-audit`, then `./install.sh`). Every other stage runs. This skill performs none of the validator's checks in its place.

Traced: 2026-10-31 — to *A stage whose skill is not installed*. That `bin/get skills/figma-project-audit` takes `component-validator` with it is executed by `bin/check`'s "every skill, from bin/get, has what it names".

## O7 · One list of stages, and every runner holds to it
Fixture: `scripts/stages.json` and the three runners: the dashboard page (`tools/docs-site/src/dashboard/audit.js`), `bin/audit` (`tools/figma-audit/audit-session.mjs`) and Audit lite.
Assert: each runner's `const HANDLERS` keys are exactly the stages the list gives it; its source calls `runStages(…, "<runner>", HANDLERS` and has no `for (… of stagesFor(` loop of its own (Audit lite's own code, its generated block left out); and its handler keys, run through `runStages` as stubs, give every stage a row, in the list's order, each one run. SKILL.md says to run every owner the list names.
Assert also (planted): a handler for a stage the list lacks, and a stage left without one, are caught in the source; through `runStages`, a missing handler is an `unhandled` row, handlers written in reverse still run in the list's order, and a run that skips an id or reorders the rows is caught.
Assert also: `runStages` stops only a stage that throws (with its reason), never calls a handler `appliesTo` rules out (a fact, a setting) or a runner skips, and a facts read that fails stops only the stages that need it; every stage carries a `label` and a one-line `description`; `stoppedLines` gives one plain line per stopped or unhandled stage, and `bin/audit` prints them and exits 1 after writing the payload; the dashboard names each stage in its run lines by its queue chip (`ownerChipLabel`), the `label` being Audit lite's checkbox.
Runs: node tests/test-stages.mjs — "it runs its stages through runStages, with its handlers", "it keeps no stage loop of its own", "its handlers, run through runStages, give every stage the list gives it a row, in order, each run", "(planted) a missing handler is a row that says unhandled, and the check names it", "(planted) handlers written in reverse still run in the registry's order", "(planted) a run that skips a stage's id is caught", "(planted) a run in another order is caught", "runStages: a stage that throws is stopped with its reason, and the stages after it still run", "runStages: a facts read that fails stops the stages that need it, and only those", "(planted) a handler for a stage the list does not name, and a stage left without one, are both caught", "stoppedLines: one plain line per stopped or unhandled stage, naming it and why; none for ran, n/a, empty or a skip", "bin/audit prints stoppedLines for its run and exits 1 when there are any, after writing the payload", "dashboard: its run lines name each stage by its queue chip, the registry it runs relabelled through ownerChipLabel"

## O8 · One Audit, over the files ticked in the list
Fixture: the dashboard page (`tools/docs-site/src/dashboard/`): `Dashboard.astro`, `audit.js` `runFiles`, `measures.js` `paintFiles`/`pickedFiles`, `dashboard.css`; the service's `POST /audit-stored`.
Assert: one Audit button and no menu; *Whole* and *Changed since the last audit* are two radios, always shown; no tab hides the button; every audited file row carries a checkbox, and the Audit runs the ticked ones. An open components file is switched to and scanned live; a closed one is skipped and said; an open tokens or icons file runs its stages live; a closed one is checked from its last snapshot through `/audit-stored`, which refuses when nothing is stored rather than closing rows. The run lock is held from the first file to the last.
Runs: node tests/test-stages.mjs — "dashboard: one Audit button, no menu that comes and goes", "dashboard: Whole and Changed are radios always in view", "dashboard: no tab hides the Audit button", "dashboard: each file row carries a checkbox, read by pickedFiles", "runFiles: a closed components file is skipped and said, a closed tokens or icons file is checked from its snapshot", "runFiles: an open file is switched to, then audited live", "runFiles: the lock is held for the whole run and released once, in finally"; node tools/figma-audit/test-routes.mjs — "/audit-stored on a service with no stored tokens says so, never files nothing as a clean run"
