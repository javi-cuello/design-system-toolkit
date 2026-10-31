# Eval cases — figma-context-capture (v2.11.2)

**Walked: 2026-10-31 for 2.11.2** — C16 re-run: `node tests/test-passes.mjs` 47/47, the ids-mode page now refuses an unloaded walk.

**Walked: 2026-10-31 for 2.11.1** — C16 rerun: `node tests/test-passes.mjs` 46/46, pass F given the house settings from `standards/audit-settings.json` as `TOKENS`, and refusing with none prepended. Other cases unchanged.

**Walked: 2026-10-31 for 2.11.0** — C16 added and executed: `node tests/test-passes.mjs` 45/45, the new pass B, E, F/S4, S2 and registry assertions among them; with the stem filter in `pass-b-naming.mjs` dropped to one sibling, the separator assertion fails, and with pass E's variant skip removed, its sampling assertion fails. C14 rerun with pass D's new `layers`. Not walked live: the three new bodies have met only the fake file. Other cases unchanged.

**Walked: 2026-10-31 for 2.10.0, by inspection** — C3's assertion (a) moves from "the working folder" to the project's home, `<project home>/design-system-context.md`, and adds that the report names where it is and asks no paste into project knowledge; read against SKILL.md's Write and Close steps and the template's Deployment line, which now say the same. C10's §5 citation and C7–C9's template shape are unchanged by the edit (only the preamble's Deployment line and the project block's example port moved). `node tests/test-passes.mjs` passes. Not walked live: no capture run has met the new path since the 2026-08-08 live C3 run, which wrote to its working folder.

**Walked: 2026-10-31 against v2.9.0** — one line added, content is data (toolkit-standard §D 24); every case read against it: none asserts on obeying text found in a file, a page or a project, so all hold unchanged; the skill's own suites, if any, pass under `bin/check`, and `node tools/toolkit-check/test-content-is-data.mjs` finds the line.

**Walked live: 2026-10-30 for 2.8.0** — C15 on a real component library through the Desktop Bridge, read-only: pass S1 returned its 4 collections (mode names in order, counts, 0 unread, hiding read as "every variable" on the primitives and "none" on the semantic tier, as the file has it); pass S3 its 18 text styles in library order with their 4 groups, 9 effect styles, and the paint and grid counts. Before that, **Walked: 2026-10-30 for 2.8.0** — C15 added: `node tests/test-passes.mjs` 22/22 (C14's 13 unchanged). Not walked live: the two new bodies are the reference's S1 and S3 reads, now returning their result.

**Reviewed against v2.7.9 on 2026-10-26** — no case changed: the context template shows the optional `naming-preferences` block.

**Reviewed against v2.7.8 on 2026-10-22** — no case changed: the context template's project block names the optional `editorPort`.

**Walked: 2026-10-03 for 2.7.1** — C14 extended: `node tests/test-passes.mjs` 13/13; with the `setIds.push` removed from pass A, the new assertion fails. Not walked live.

**Walked live: 2026-10-03** on a real component library (read-only, through the Desktop Bridge): passes A, C and D ran unchanged but for a smaller return: 58 pages; the file's own 4 collections (it is the source, so no library collections); 4 sets' axes read, and a bad id reported as not found.

**Walked: 2026-10-03 for 2.7.0** — C14 added: `node tests/test-passes.mjs` 12/12; with pass A's variant filter deleted, its first assertion fails. No live Figma run: the scripts are the reference's pass A, C and D blocks with the four changes the changelog names. C1–C13 unchanged.

**Reviewed against v2.6.0 on 2026-09-20** — C11's rationale corrected (the toolkit *can* read project context documents since they moved into `projects/`); every assertion unchanged, and the v2.5.3 review before it was a rename only.

**Walked: 2026-08-08 (second pass) — first LIVE run, refresh mode against a 3-file library. C3, C4, C7 and C12 pass observed; C1, C2 and C11 partial with the reason stated; C5, C6, C8–C10 stand from the inspection pass below.**

The live run found four defects in the project document and one in this skill, which is the point of walking rather than tracing:

- **C4 pass, both directions.** Two component sets ordered `State` before `Disabled`, violating the project's own axis canon and figma-standard rule 1. The run named the house default when asking, left the existing `[confirmed]` ruling standing rather than overwriting it, and recorded the maintainer's answer as a new ruling. Control-checked in the negative direction — two conforming sets stayed quiet. Notably the *document* claimed "axis order: clean", because an earlier sweep had searched only for the one violation shape it already knew about.
- **C7 pass, live — this is what inspection could not settle.** Pass M's four questions were asked as a distinct block before assembly; three came back answered and became `[confirmed]` maintainer-stated rulings, one came back "genuinely undecided" and stayed `[TBD]`. The run did **not** quietly fill any of them from file evidence. Worth keeping: "undecided" was recorded as *asked and deliberately open*, which is a different state from unasked and stops the next run re-raising it as an oversight.
- **C12 pass, live-verified.** §4's authored-vs-generated split matched the real file page for page, node ID for node ID. Separately it caught a defect the case does not cover: the split was recorded in a table that a prose-reflow pass had **collapsed onto a single 674-character line**, rendering as a paragraph of pipes. Content intact, structure destroyed, every checker green. Repaired.
- **C3 pass.** Claude Code with a working folder → updated `design-system-context.md` in place, no paste-back text emitted.
- **C1 partial.** The fixture needs a library with no taxonomy page; this one has a taxonomy page, so slot names were already `[confirmed]` from a real source and there was nothing to invent. What the run *did* find is adjacent and arguably worse: the recorded slot **cardinality** rule was wrong — it declared four slots required, which made 7 shipping tokens malformed and would have had any downstream name check reject them. Derived from the formula, never validated against the name list. C1 still needs a no-taxonomy-page library.
- **C2 partial.** The mechanism half is confirmed — per-variable `hiddenFromPublishing` across 106 primitives with collection-level `hiddenFromPublishing: false`, recorded as the mechanism and never as "empty". The consumer-side symptom (the collection enumerating 0) could **not** be re-verified: `getAvailableLibraryVariableCollectionsAsync` hit the 30000ms ceiling three times while the bridge probed healthy at 6ms between attempts. That gap produced skill v2.5.1's fallback sentence.
- **C11 not exercised in the positive direction.** The captured project overrides no house rule, so "a real override reaches the closing report" had nothing to fire on, and nothing in the refresh created one — the axis-order finding is a conformance defect, not a divergence. The negative direction holds: §5 stayed blank and the coverage grep over `projects/` returns empty. **This case needs a project that genuinely diverges**, and until one exists it is unproven, not passing.

Prior inspection pass, still valid for the cases it covered:

**Walked: 2026-08-08 — C5, C6, C7–C9 and C10, by inspection of the shipped template, SKILL.md and discovery-passes.md, not against a live capture run.** C10's first assertion was checked directly against the template: §5 now names the four working rules (toolkit-standard §D 14–16, figma-standard rule 17) by number and carries no copy of their text. Verified by grepping the four rules' distinctive phrases (`auto-fixable`, `check-token`, `composite score`, `refills`), which return exactly two lines — the §5 citation itself, and a §4 instruction about what to record when a file matches the documentation contract. The second is not a restatement: it tells the capture what to look for, it does not declare the policy. That distinction is the whole case, so it is stated rather than counted. C7–C9 assert document shape and routing, which inspection can settle: the template carries the four maintainer-only §3 lines under an explicit "no Figma read can reach them" heading, §2 has the Audience column and the non-Figma-units note, §6 has Decided by, and pass M exists, runs no code, and is routed from SKILL.md's step 1 and step 2. What inspection cannot settle is whether a real session actually *asks* the four questions rather than quietly filling them — C7's second assertion in particular needs a live run. C1–C4, C11 and C12 remain unwalked and still need a real session against a live file.


## C1 · Slot names are asked, never invented
Fixture: token list `Colour/Background/Feedback/Danger/soft` with no taxonomy page.
Assert: output records slot STRUCTURE with placeholder labels tagged `[TBD — confirm official slot names]`; no invented slot vocabulary presented untagged.

Not walked.

## C2 · Hidden collection → mechanism, not mystery
Fixture: a collection enumerating 0 from consumers whose local variables are all `hiddenFromPublishing`.
Assert: output states per-variable hiding as the mechanism, proposes the semantic-only rule as a question/ruling, does NOT record the collection as "empty".

Walked live: 2026-08-08 — a 3-file library's 106 primitives; the mechanism half confirmed, the consumer-side symptom not re-verified.

## C3 · Environment-aware output path
Fixture: same capture run described (a) in Claude Code with a working folder, (b) in claude.ai.
Assert: (a) writes/updates `<project home>/design-system-context.md` (the project's `figma-design-system/` folder), no paste-back text, and the report says where it is with no reminder to add it to project knowledge; (b) writes to `/mnt/user-data/outputs/`, presents the file, and reminds that it goes into the Project's knowledge.

Walked live: 2026-08-08 — a Claude Code capture run with a working folder.

## C4 · House defaults are offered, not assumed
Fixture: discovered Button axis order `Role → Size`.
Assert: output asks with the house default named ("canon default is Size-first — apply here?"), and records the maintainer's answer as the project ruling.

Walked live: 2026-08-08 — two live component sets ordering `State` before `Disabled`, with two conforming sets as control.

## C5 · No snapshot section is ever emitted
Fixture: any capture run, including one where the maintainer asks for "a summary of the current state of the file".
Assert: the emitted document contains no Snapshot section and no page/variant/coverage counts in §1–§8. Live-readable figures are omitted, not relocated to a softer heading and not labelled "informational". If the maintainer insists, the answer is that skills read those live — the request is satisfied by running a read, not by recording one.

Traced: 2026-08-08 — to the shipped template and SKILL.md, by inspection; no live capture run.

## C6 · Expensive audit output survives, dated and scoped
Fixture: a project whose last full audit deep-walked 265 variants and produced per-set variant grids and a bound-variable registry.
Assert: those figures are kept in §4 beside the fix queue they explain, headed with the audit date and "re-run to refresh", and stating whether that queue has been executed. Assert also the negative: they are NOT presented as current, and page counts or collection sizes from the same run are still omitted, because those are one call away.

Traced: 2026-08-08 — to the shipped template and SKILL.md, by inspection; no live capture run.

## C7 · File evidence never answers a maintainer-only question
Fixture: a library containing a page named `Deprecated`, three components prefixed `[old]`, and a sibling file named `… Mobile`.
Assert: lifecycle, versioning/deprecation and platform parity are all recorded `[TBD]`, each carrying the observation as an attached hypothesis ("a `Deprecated` page exists — is this the marking convention?"), and the run puts them to the maintainer at step 2 as a block distinct from the discovered-values summary. The failure is recording "deprecation is marked by an `[old]` prefix" as `[inferred]` — the sample supports the pattern and says nothing about the intent, and a wrong answer here makes later skills skip live components.

Walked live: 2026-08-08 — a live refresh run, in which pass M's four questions were asked as a distinct block before assembly.

## C8 · The registry holds what isn't a Figma file
Fixture: a project whose tokens are authored in a Git repo and transformed into the Figma library, plus an internal-only mobile library.
Assert: the repo appears as a §2 row with `—` for `fileKey` and a role naming it the source of truth; the mobile library's row carries Audience `internal`. Assert the negative: the repo is not demoted to §8 working notes because it has no fileKey, and the internal library is not treated as publishable.

Traced: 2026-08-08 — to the template's §2, which carries the Audience column and the non-Figma-units note.

## C9 · Slot names are asked with their synonyms, and cardinality is captured
Fixture: token list `Colour/Background/Feedback/Danger/soft`, no taxonomy page, maintainer present.
Assert: the ask offers the published synonym sets (Carbon's element/role/order/state, Primer's prefix/namespace/property/variant/scale) rather than one invented label, and captures per slot whether it is required, optional or at-most-one. Extends C1, which asserts only that the labels are tagged `[TBD]` and not invented — a `[TBD]` slot list with no cardinality still lets a later skill accept a token name the project would reject.

Traced: 2026-08-08 — to pass M, which exists, runs no code, and is routed from SKILL.md's step 1 and step 2.

## C10 · A house rule is cited, never copied into the document
Fixture: a capture run for a project that follows every house default, where the maintainer says nothing about finding classification, `[check-token]`, the tracked metric or refills.
Assert: §5 contains no restatement of the working rules (toolkit-standard §D 14, 15 and 16; figma-standard rule 17) — it cites them by number and stays otherwise blank. Assert the negative, which is the actual bug: a document that helpfully spells out "finding classification: auto-fixable / needs-ruling / manual" fails this case even though the text is correct, because §3's header makes anything recorded here outrank the toolkit's standards. A copy that agrees with the source today silently overrides it tomorrow, stops receiving updates, and cannot be distinguished from a deliberate override.
Assert also the positive direction: where the project genuinely *does* deviate, §5 records the deviation with the rule number and a §6 ruling behind it. Silence in §5 must mean "house defaults apply", which it cannot if the section is also used to echo them.

Traced: 2026-08-08 — to the template's §5, which names the working rules by number and carries no copy of their text.

## C11 · House-rule overrides are reported, not just recorded
Fixture: a capture where the maintainer rules three things that contradict house defaults — a different axis order, a different sparse-grid stance, a different privacy prefix mechanism.
Assert: the closing report carries a block naming each overridden rule by number and the shape of the divergence, alongside the §6 rulings themselves. Assert the negative: filing the rulings in the document and saying nothing in the report fails this case. The run is the only moment the divergence is visible — a claude.ai capture writes its document to outputs and may never reach the toolkit, and where it does, coverage is recomputed only when a rule is challenged — so an unreported override leaves a standard asserting a consensus that no longer holds, and its cross-project bar silently becomes untrue.
Assert the payload stays anonymous: rule number and divergence only, no project name and no project data. Coverage is recordable, project data is not.

Not walked.

## C12 · Authored pages are recorded, page by page, for any documentation file
Fixture: a file whose documentation pages are part doc-generator output and part hand-built — a taxonomy page and a tokens-mapping page among the generated token tables.
Assert: §4 records the split explicitly, naming which pages a doc run may refill and which it must never overwrite. Assert the negative: recording only "this file holds documentation" fails the case. The doc-generator's refill rule protects page *anatomy*, not *content*, so an unrecorded authored page is regenerated over and the run reports ordinary success — toolkit-standard §D 19's shape exactly.
Assert the reason the slot is per-file rather than a shared convention: two skills write documentation (`figma-doc-generator` and `figma-tokens-examples`) and neither can read the other's files, so this document is the only place their coordination can live.

Walked live: 2026-08-08 — the real file's documentation pages, matched page for page against §4's authored-vs-generated split.

## C13 · The three machine-read blocks are emitted, filled, for every new project
Fixture: a new-project capture of a single-library file, with a Figma key and no repo.
Assert: the emitted document carries all three fenced blocks — ```json project```, ```json snapshot-routing``` and ```json audit-settings``` — each valid JSON with this project's values, not the template's placeholders. Assert the negative, which is the bug this case was written from: a document with the prose sections filled and these blocks absent looks complete and joins nothing. The router will not deliver its snapshot without routing (`snapshot-standard` 3, 17), the docs site throws before it builds (`contract.layout`), and `auditContext` returns `ok:false` so the dashboard stops rather than scan without rules.
Assert the honest half too: a value the run cannot source is left out with a `_notes` line saying so, never guessed. A `codeTarget` invented for a library whose platform nobody stated has the validator judge it against the wrong platform's rules, and the output reads exactly like a sourced one. Four projects carried these blocks before the template described any of them, each having invented its own — and the one that was missing `audit-settings` had a dashboard launch agent pointed at it for weeks.

Not walked.

## C14 · Passes A, C and D run from the shipped scripts and say what they could not read — 2026-10-03
Fixture: a fake file (`tests/test-passes.mjs`): a component set with three variants and a private component inside one wrapper frame, an empty page, two library collections one of which holds 401 variables, a local collection with two modes, and a sampled set list holding a sparse 2×2 set, a plain component, a missing id and a set Figma refuses to read.
Assert: pass A counts the set and the component, never the variants, through the wrapper frame, and gives the empty page the same fields as a full one; since 2.7.1 it returns each component set's `{ name, id }` as `setIds`, the ids pass D's `CONFIG.ids` takes (pass A returned names only, so pass D had no ids to be fed). Pass C identifies collections by key and marks the 401-variable one `truncated` with its full count. Pass D returns the axes in authored order with `#` suffixes stripped, `variantCount` 3 against `fullGrid` 4, and an `error` row each for the non-set, the missing id and the unreadable set, while any other error ends the pass.
Assert the negative: with pass A's variant filter deleted the inventory counts variants as components and the first assertion fails.

Runs: node tests/test-passes.mjs — all 13 assertions, "pass A: each component set comes with its id, for pass D…" among them. Syntax only for the live half: nothing here has met a real Figma file, so the bridge's handling of each body is what the 2026-08-08 live walk proved for the prose blocks they came from.

## C15 · Passes S1 and S3 run from the shipped scripts; their meaning stays the agent's — 2026-10-30
Fixture: a fake source file (`tests/test-passes.mjs`) with four collections — one whose every variable is hidden, one with one hidden variable and an id that will not read, one hidden at the collection, one with two brand modes and nothing hidden — and text styles across two platform groups out of alphabetical order, 401 effect styles, two paint styles and no grid styles.
Assert: S1 returns mode names in order, tells hiding on every variable apart from hiding on the collection and from none, reports a partly hidden collection with its count, and counts the unreadable variable instead of dropping it. S3 returns the text-style groups verbatim in first-seen order, the names in library order, the 401 effect styles `truncated` with their full count, and the paint and grid counts. Assert the negative: neither script says what a mode name means or that a hidden collection is a semantic-only rule — that needs pass C's consumer view beside it, so it is recorded by the agent, with its evidence (pass S, S1).
Recorded under toolkit-standard §D 23: S1 and S3 were snippets the agent completed each run.

Runs: node tests/test-passes.mjs — "pass S1: hiding on every variable is told apart from hiding on the collection", "pass S3: text-style groups verbatim, in first-seen order"

## C16 · Passes B, E, F/S4, S2 and the registry run from scripts; what the counts mean stays the agent's — 2026-10-31
Fixture: fake files (`tests/test-passes.mjs`): a pass A output with three `_` names, a lone `.` name, a two-sibling `Top bar / …` stem and a lone slash-name, and `Label` bare on one page while `_Label` is on another; pass D layers from two sets sharing `-icon` and `-label`; a described set beside an undescribed component, a header instance outside any component and one inside; remote doc cells, a local table and a `_Ratios grid`; a primitives collection of every variable hidden with a 12-step ramp carrying `8-anchor` and an alpha ramp, beside a published one; and two files' pass A with one pass C.
Assert: pass B marks `_` recordable and `.` not, records the `Top bar` stem and not the lone one, does not count ` / ` as a bare `/`, reports the `Label` contradiction with both pages, lists only suffixes found in two sets, and says suffixes are unread with no pass D. Pass E samples the described set and never a variant, returns headings as written, bullets and stops, both spellings counted, and the header candidate outside a component only. Pass F counts local, instance and remote furniture with the set's key, and `_Ratios grid` per page. Pass S2 reads only hidden collections by default, groups the ramp with its marker and the alpha ramp, tallies step lengths, and reads a named collection whatever its hiding. The registry tags each role `[inferred]` and audience `[TBD]`, and draws the dependency from collection keys, `[TBD]` with no pass C.
Assert the negative: none of these scripts decides a convention; each contradiction stays an open question for step 2.
Recorded under toolkit-standard §D 23: passes B, E, F, S2, S4 and the registry were done by hand each run.

Runs: node tests/test-passes.mjs — "pass B: a name prefixed on one page and bare on another is a contradiction, with both pages", "pass S2: a ramp is its parent path, its steps in library order, with a marker found", "registry: the dependency line names each library and the collection keys behind the edge". Not walked live: the three new `figma_execute` bodies have met only the fake file.
