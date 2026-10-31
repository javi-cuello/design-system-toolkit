---
name: figma-project-audit
description: Run a project's whole Figma audit by sequencing the stand-alone audit skills — figma-components-audit, figma-foundations-audit, component-validator for the project's code target, and figma-variable-audit where a source library is registered — into one audit record and one dashboard. Holds nothing of its own. Settings and rulings come from the project's context document, each skill reads them itself and owns the rows it raises, and this skill only decides what runs and in what order, then reports one line per stage. Use when someone asks to "audit everything", "run the full audit", "check the whole library", "update the dashboard", or wants some of the audits run together.
---

# Figma Project Audit

**Version 1.2.5** — history in CHANGELOG.md.

A library is checked by several skills, each owning one subject: its components, the file as a whole, how it will translate to code, whether its token links still resolve. Each runs alone. This skill runs them together, in the one order that keeps their results consistent, into the project's one audit record, so the dashboard shows the whole library's state and every row says which skill raised it.

It orchestrates and nothing else. It holds no settings, no checks and no rows. It names each skill to run and never reads another skill's files, because a skill that reads another's files is coupled to its internals and breaks when they move.

## Project context first

If a **design system context document** is available — in Claude Code, as a file in the working folder (the project's CLAUDE.md names it); in claude.ai, via Project knowledge or provided in the conversation — it is the authoritative per-project configuration. Match the connected file's `fileKey` against its registry and hydrate every setting this skill needs from the matching sections — run discovery **only** for items the document marks `[TBD]`. Rulings recorded there outrank file evidence; report conflicts rather than re-deriving. New rulings produced by a run are recorded in the document: when it is a writable file (Claude Code), update it in place in the same turn; otherwise output the updated sections for the maintainer to paste back.

What this skill reads from the document is only what decides the sequence: the file registry (which library, which record, whether a source library exists) and, from the library's `audit-settings` entry, `codeTarget`. Every stage reads its own settings itself.

## Who owns what

Ownership is the record contract in `tools/figma-audit/README.md`: settings and rulings live in the context document, each stage owns the rows it raises and closes only those, and this skill owns only the sequence and the one-line report.

## The sequence

1. **Confirm the library and the record** from the document's registry. Pin the file (`figma_navigate({ lock: true })`) and probe the bridge (`figma_get_status({ probe: true })`) once, for every stage.
2. **Foundations first:** run `figma-foundations-audit`. A file-level fix (page order) never changes a component, so nothing later is invalidated by it. The order matters only when fixes land between stages; the dashboard's *Audit* applies none, so it runs the components stage first and the file second, and that is not a deviation.
3. **Components next:** run `figma-components-audit` over every component in scope. Where the dashboard is running, its *Audit all* is stages 2 to 6 in one press.
4. **Code target:** where the library's settings name a `codeTarget`, run `component-validator` for that target over the same components. Its findings are decisions, never fixes.
5. **Links:** where the project routes a library with the role `tokens` (snapshot-standard rule 17), run `figma-variable-audit` against it. The dashboard's *Audit* runs this stage too when the source is open in Figma.
6. **Code:** where the library's settings name its `code`, run `design-code-parity`'s existence comparison and pairing question: which components the code has, and which it may have under another name. The dashboard's *Audit* runs this stage last.
7. **Report** one line per stage: what ran, what it found, what it closed, and every stage skipped with its reason. The rows are in the record; the dashboard shows them.
8. **Breaking changes are already in the queue, and are not a stage.** Each snapshot the store records is graded for the designers' files that use the library and for its code, and the dashboard service files every change major for either as a row under *Breaking changes* (snapshot-standard rule 21). An audit reads the live file, so it never files or closes these; the report names how many are open, because a library about to be published with an undecided breaking change is the one thing worth saying before the stage lines.

**Any subset runs in the same relative order.** "Just the file and the components" is stages 2 and 3. A stage that fails stops only itself: say which, and run the rest.

**Fixes wait for the maintainer.** This skill runs checks. Each stage's own rules decide what may be fixed and when, and running inside this skill is never approval to fix.

## What this skill never does

- Hold a setting or a ruling. If a stage needs one the document lacks, that stage reports it; this skill does not supply a default.
- Read another skill's files, or re-implement a check.
- Close, rewrite or renumber a row another skill raised.
- Write a composite score. Each stage reports its own measures.
