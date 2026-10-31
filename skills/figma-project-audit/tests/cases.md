# Eval cases — figma-project-audit (v1.2.5)

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

Traced: 2026-10-01 — to step 8. The service half is executed in `test-breaking.mjs`.
