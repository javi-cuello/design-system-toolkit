# Eval cases — figma-variable-audit (v1.27.0)

**Walked: 2026-10-31 against v1.27.0** — A14 added and executed: `node tests/test-report.mjs` 15 passed; `test-links.mjs` 30/30 with `keysRead` in the scan's answer. A13's bytes are unchanged with `--keys`; every other case untouched.

**Walked: 2026-10-31 against v1.26.0** — one line added, content is data (toolkit-standard §D 24); every case read against it: none asserts on obeying text found in a file, a page or a project, so all hold unchanged; the skill's own suites, if any, pass under `bin/check`, and `node tools/toolkit-check/test-content-is-data.mjs` finds the line.

**Walked: 2026-10-30 against v1.25.2** — A13 extended: `node tests/test-report.mjs` 12/12 plus the symlinked run; the past-eight-layers assertion fails on 1.25.1. Before that, **Walked: 2026-10-30 against v1.25.1** — A13 extended: `node tests/test-report.mjs` 11/11. Four new assertions each failed before the fix: `--scope fills` leaves two findings out before the counts are taken and says so, a batch passed twice renders the same bytes as once, two batches that audited one component are refused, and a `<slot> › _private_` layer path and the component cell are code spans. `test-links.mjs`, `test-descriptions.mjs` and `test-extensions.mjs` pass, unchanged. Not met live.

**Walked: 2026-10-30 against v1.25.0** — A13 added: `node tests/test-report.mjs` 7/7, rendering two batches `checkFacts` returned; `test-links.mjs` 30/30, `test-descriptions.mjs` and `test-extensions.mjs` unchanged. The renderer has not yet met a live scan: its input is `checkFacts`' real output in node, not a file read through the bridge.

**Reviewed against v1.24.8 on 2026-10-14** — no case changed: tool paths follow the move of the toolkit's own checks to tools/toolkit-check and of the project registry to tools/snapshot/projects.cjs; no rule or behaviour changed.

**Reviewed against v1.24.7 on 2026-10-14** — no case changed: the toolkit's tools are renamed (snapshot, component-contract, docs-site, css-lint, ui-check, project-check, claude-hooks, skill-evals); paths in prose and code only, behaviour unchanged.

**Reviewed against v1.24.6 on 2026-10-14** — no case changed: the dashboard service is `tools/figma-audit` (was `tools/figma-dashboard`); paths in prose and comments only, behaviour unchanged.

**Walked: 2026-10-07 against v1.24.0** — A12 added: `node tests/test-extensions.mjs` 11 of 11.

**Walked live: 2026-10-03** on a real component library (read-only, through the Desktop Bridge): `links.js` keys mode ran: 374 variables matching the snapshot's per-collection counts (163, 145, 53, 13), 30 styles, every key unique. Scan mode is still to meet a consumer file.

**Walked: 2026-10-03 against v1.24.0 — prose only; the suites re-run unchanged** (`node tests/test-links.mjs`, `test-descriptions.mjs`, `test-extensions.mjs`). A7's new assertion read: Steps 2–5 carry no inline copy of the walk, and `standards/tests/check.sh` reports no `[G]` line for this skill. No script changed, so nothing new needed Figma.

**Reviewed against v1.22.1 on 2026-09-30** — no case changed in substance; the project named in their evidence is Project B.

**Walked: 2026-09-25 — live, for v1.22.0's extension checks** in one project's Core, the day it moved to extended collections: parent `04. Semantic - Brand` (29 tokens, all on `Project A`'s ramps), one extension `Brand B` with 29 overrides. The run reported **no findings**, and that clean result was controlled rather than trusted — the file's own facts were replayed through `checkExtensions` three times, each with one thing broken, and each produced exactly the expected finding: an override removed → `inherits Colour/Icon/Primary/medium`; an override repointed at Project A's ramp → `foreign Colour/Background/Base/soft`; an override stripped of its Dark value → `partial Colour/Text/Base/strong`. The first live attempt returned an empty `checked` list: the parent collection is named by its local id in its own file and by a key-based id in a consuming one, and the matcher read only the key. In node: `node tests/test-extensions.mjs`, 10 of 10.

**Reviewed against v1.21.0 on 2026-09-24** — A11 added; `test-links.mjs` 30/30, the new assertion failing without the skip. Not yet walked live.

**Reviewed against v1.20.0 on 2026-09-24** — A10 extended to respelled names; `test-links.mjs` 29/29, the new assertion failing on 1.19.0.

**Reviewed against v1.19.0 on 2026-09-24** — A10 added and walked live; `test-links.mjs` 28/28, unchanged (it covers the classification, not the walk).

**Reviewed against v1.18.3 on 2026-09-23** — A9 added and extended to the shared deadline; no other case changed.

**Walked: 2026-09-22 for 1.12.0.** A8 added. `node tests/test-descriptions.mjs` 10/10, each rule disabled in turn fails its assertions; `node tests/test-links.mjs` 19/19, unchanged. A8 walked live on a real library, clean run and planted control both, as recorded in the case. A1–A7 unchanged.

**Reviewed against v1.4.0 on 2026-09-11** — the check became `scripts/links.js`, walked in node (`node tests/test-links.mjs`, 7/7). Filed then as a second A6, which collided with the case above it; renumbered A7 in 1.7.0, and the 1.4.0 changelog line now cites A7.

**Reviewed against v1.3.0 on 2026-09-11** — rows go through the record's writer, walked in node (`node tools/figma-audit/test-rows.mjs`); the check is unchanged, so no case changed.

**Reviewed against v1.2.0 on 2026-09-10** — record-writing section added; the check is unchanged, so no case changed. Not yet walked against a live record.


**Reviewed against v1.1.1 on 2026-08-08.** 1.1.1 is formatting only — prose reflowed in `tests/cases.md`, behaviour untouched.

**Walked: 2026-08-09 against Project A `01. Core` → `02. Components` (Desktop Bridge 1.39.0) — A1, A4, A5 and A6 pass. A2 and A3 not walked: neither fixture can exist in this project, see each case.** Scope was "everything" — all variable `resolvedType`s plus text, effect, grid and paint styles.

**The audit itself came back clean, and the zero was control-passed before being believed.** 56 component roots, 4,594 nodes, **23,758 variable bindings and 1,174 style references, zero broken** — 92 distinct variables and 18 distinct styles, every one present in Core by key. Because a dead check and a clean file produce identical output, the reference set was then deliberately holed: removing the single most-used key — a radius token turned 0 findings into exactly 4,781, the precise number of bindings using it. Full set → 0, holed set → 4,781. The check is alive and the zero is real.

*A note for anyone reading this beside `figma-components-audit`, whose traps table says never to take a scale from `collection.variableIds`.* There is no contradiction. That trap is about reading an **enabled library's** collection from a consumer file, where `variableIds` lists only what has been imported. Step 2 here runs inside the **source library**, where the same property correctly enumerates its own locals — which is why it returned all 285 across five collections rather than a subset. Don't "fix" one to match the other.


## A1 · A recorded source library is stated, not re-asked
Fixture: the document registers this file's source library or libraries.
Assert: Step 0 states the answer in one line and proceeds. Where the document is silent or marks the entry `[TBD]`, the question is asked as written — the document removes the question only when it answers it.

**Walked 2026-08-09 — passes, and on the best possible fixture: the document answers one of Step 0's two questions and is silent on the other.** Project A's §5 entry records the source library, the consumer file, one excluded file and two rulings. That question was stated in one line and **not** re-asked. The same entry says nothing whatever about **scope** — colours only versus every variable and style type — so that question was asked as written, verbatim from Step 0, and the answer ("everything") was used.

This is a stronger walk than either half alone would have been. A document that answered both would only have shown the skill can stay quiet; one that answered neither would only have shown it can ask. Answering exactly one proves the behaviour is driven by what the document actually contains rather than by whether a document exists.

The maintainer declined to record the scope answer as a ruling when offered, so it stays a per-run question — correctly, since nothing in the document now claims to answer it, and a future run will ask again.

Walked live: 2026-08-09 — Project A `01. Core` → `02. Components`, whose §5 entry answers the source-library question and says nothing about scope.

## A2 · A previous session is never a source of the answer (negative case)
Fixture: an earlier run in the same conversation established a source library; the document records nothing.
Assert: the question is asked again. A recorded ruling is evidence; a previous run is not, and inheriting it silently is the failure.

**Not walked 2026-08-09 — the fixture cannot exist here.** The case requires the document to record *nothing* about the source library while an earlier run in the same conversation established one. Project A's document records the source explicitly, so the precondition fails: there was nothing to inherit, because the answer was there to read.

Worth stating what the session did establish, since it is adjacent but weaker: this conversation had already worked with `01. Core` for other skills, and the document's `doc-generator` entry names Core as a source too. Neither was used — the answer came from the `variable-audit` entry. That is the right behaviour but it is not this case, which is specifically about a **silent document plus a prior run**. Walking it needs a project whose document omits the source, and Project A is not one.

Not walked.

## A3 · Accepted orphans are suppressed but counted
Fixture: the document lists known-accepted orphans; the scan hits them.
Assert: they are not reported as findings, and the closing summary names how many were suppressed. A suppressed finding that goes unmentioned is indistinguishable from a missed one.

**Not walked 2026-08-09 — no fixture, for the best of reasons: the scan found nothing to suppress.** Zero broken links across 23,758 bindings, so no orphan was hit, accepted or otherwise, and the suppression path was never entered.

The document does carry two rulings that look like candidates and are not. *"A component bound to `04. Components/Input/*` is correct, not a defect"* and *"Primitives - Colour hidden — direct bindings are defects"* are both about **which tier a binding points at**, which is `figma-components-audit`'s question, not this skill's. This skill asks only whether the key still exists. A binding to a colour primitive is a live, resolvable link and would pass here whatever the tier ruling says about whether it *should* exist — the two checks disagree by design, and conflating them is the same category error A4 guards against. Walking this case needs a genuinely retired token still referenced by a component, with the document accepting it.

Not walked.

## A4 · Link validity is not value comparison
Fixture: a component bound to a valid key that resolves to an unexpected colour.
Assert: no finding. The link exists; value drift is a different check, and conflating the two is the misread this skill exists to prevent.

**Walked 2026-08-09 — passes, and the live fixture is about as extreme as the case could ask for.** `Button` binds a valid semantic background token present in the source library. That token aliases to a grey primitive near the dark end of its ramp, which resolves to **`#161616` in Light mode and `#f5f5f5` in Dark** — near-black against near-white, the largest possible disagreement between two values behind one link.

No finding was raised, correctly. The link exists; what it resolves to is not this check's question. Had the audit compared values against a single expected colour, it would have reported `Button`'s primary surface as catastrophically wrong — in exactly one of the two modes, depending on which the file happened to be displaying. That is failure mode 2 in the skill's own list, reproduced here rather than imagined, and it is why the skill's description ends with "Do not conflate the two."

The same shape recurs on the icon and text tokens of the same family, both aliasing to the primitive at the light end of that ramp (`#fdfdfd` Light, `#121212` Dark). Note also that reading the alias object as a colour yields nothing usable — `valuesByMode` returns a `VARIABLE_ALIAS`, not an RGB — so a value check would have to resolve the chain into the source file to compare at all, while the link check needs only the key it already has.

Walked live: 2026-08-09 — `Button`'s semantic background token, resolving to `#161616` in Light and `#f5f5f5` in Dark, raised nothing.

## A5 · The key set is never trimmed between calls
Fixture: a reference set large enough to be inconvenient to paste.
Assert: the full set is persisted and read back verbatim, with the count verified before the real check runs. A shortened list produces false positives that look exactly like real findings.

**Walked 2026-08-09 — passes.** Core returned **285 variables and 59 styles**: 344 keys of 40 hex characters each, genuinely inconvenient to paste, which is the fixture. They were written to a file with the expected counts recorded alongside, then read back and verified **before** the scan: 285/285, 59/59, all unique, none malformed. The scan itself opens with `if (VK.size !== 285 || SK.size !== 59) return { ABORT: ... }`, so a set that arrived short aborts rather than producing findings.

That guard is the whole case, and it is worth being concrete about why. Every key silently dropped becomes a component reported as broken — a finding with a real component name, a real layer path and a real token name, indistinguishable by inspection from a genuine orphan. The failure produces *more* output, not less, which is why it survives review: a shortened list looks like a productive audit. The count check is the only cheap thing that separates the two, and it has to run before the scan, not after.

Not asserted and worth knowing: the count check catches loss, not substitution. Two keys swapped for two others of the same length would pass it. Nothing here needs that, since the set is transmitted once and verified immediately, but a protocol that transmitted it repeatedly would want a hash rather than a count.

Walked live: 2026-08-09 — Core's 285 variables and 59 styles, read back and count-verified before the scan.

## A6 · Editable components are checked once, not per instance
Fixture: a component with hundreds of instances across the file.
Assert: the main component is checked once; instances are not walked separately.

**Walked 2026-08-09 — passes, and the ratio is the argument.** `02. Components` holds **56 editable component roots** and **4,190 instances**. The scan enumerated both — instances only to count them — and traversed only the 56 roots plus their subtrees: **4,594 nodes**. Every instance in the file was skipped as a scan root by the explicit `if (n.type === 'INSTANCE') { totalInstances++; continue; }`, and variant children were skipped as separate roots by testing `parent.type === 'COMPONENT_SET'`, so no set was walked twice.

The saving is not marginal. Treating each instance as its own root would have meant roughly 75× the work for an identical answer, since an instance inherits its bindings from the main component. Even the 4,594 nodes actually walked carried 23,758 variable bindings against just 92 distinct variables — a ratio that says the same handful of tokens is reused everywhere, which is what a healthy library looks like and also why per-instance scanning buys nothing.

The stated limitation held true and is worth repeating rather than re-litigating: this pass would not catch a one-off override applied to a single placed instance. That is a different question from "are this file's components correctly linked", and the skill is explicit that it is not to be offered as a follow-up.

Walked live: 2026-08-09 — `02. Components`: 56 editable roots and 4,190 instances, 4,594 nodes walked.

## A7 · The check is a script, and it is batchable
Fixture: a source library's keys (two variables, one text style) and a consumer whose components bind a live variable, a removed variable on three layers, a deleted variable id, a removed effect style and a local variable.
Assert: valid links raise nothing and are counted by binding and by distinct token; the removed variable is one candidate for its set naming all three layers; the deleted id and the removed style are each raised with their own reason; the local variable is counted as local and never raised; and with no key set every remote link reads as missing, which is why the keys mode must run first. Walked 2026-09-11 in node, 7 of 7.

**A whole library in one call is not a scan, it is a bet.** Added 2026-09-21 after the stage failed in production: `Execution timed out after 240000ms` on a 121-set, 1013-variant library, with every binding it had already resolved thrown away and nothing filed. The size that fails is not knowable in advance — the cost is variants times bound layers, not sets — so the fix is not a bigger cap. `MODE = "sets"` enumerates the roots and probes publishing without resolving a single binding, and `SCOPE` makes the scan take an id list and skip the page walk entirely, so a caller runs one cheap enumeration and as many bounded scans as the library needs.

Assert: `sets` returns one entry per in-scope root with its variant count, and the same roots the scan walks — one enumeration, one walk, never two scope rules. A `SCOPE` scan reports only those sets. An absent or empty `SCOPE` still walks the whole file, which is the one-call path a session uses. A supplied `KEYS.published` is used as given, including an empty one: a failed probe must stay failed across every batch rather than being re-probed into a different answer halfway through. `seen` carries the ids behind `distinctVariables`/`distinctStyles` so a batching caller unions them — summing the batches would count a variable bound by forty sets as forty. An id in `SCOPE` that no longer resolves is dropped, not raised: a set deleted between the enumeration and the scan is not this check's finding.

Assert also: a finding names its affected layers — up to eight, then a count of the rest — because the row's whole job is to get the reader to the layers to change. Written after a maintainer read two link rows and said they were not enough to act on.

Walked 2026-09-21 in node, 15 of 15. The `sets`/`SCOPE` half needs Figma and has not been walked live yet — the production failure it answers is recorded above, the fix is not.

Assert also (since 1.23.0): `SKILL.md` Steps 2–5 describe what `scripts/links.js` does and how to call it, and carry no code block of their own — the snippets they held until then were a hand-assembled second scanner, and one of them filtered the reference set by type, which would report every out-of-scope binding as missing. A narrower scope narrows the report, never the key set.

Runs: node tests/test-links.mjs — "a removed variable is one candidate per set, stating only its STATE"

## A8 · A description that names a variable is checked against the alias
Fixture: a source library whose `Semantic` variables carry descriptions ending `Aliases → <primitive path>`, some naming the wrong step of the aliased collection, some naming a path renamed since.
Assert: `scripts/descriptions.js` raises the wrong step as `target`, naming both what the text says and what the variable aliases, and the renamed path as `missing`; it raises nothing for a relative name in prose (`Neutral/primary`), a namesake in a collection the variable does not alias, a path under a group the file no longer has, or a correct citation spread over two collections. `measures.mentions` is returned, and a run is not reported clean unless it is above zero.
Recorded because the link check cannot see it: eight `Warning` descriptions cited Yellow while the variables aliased Amber, found only by comparing the text to the alias by hand. Walked live 2026-09-22 on that library after the fix: 516 descriptions, 247 names read, 0 findings. Control, the defects planted back in memory only: 27 raised — 6 `target` on the Warning rows, 21 `missing` (19 renamed `Alpha` paths plus the 2 Warning rows whose Yellow step does not exist), so all 8 Warning rows were caught.

Runs: node tests/test-descriptions.mjs — "a description naming the wrong step of the aliased collection is raised"

## A9 · The published-list probe gives up on a library API that never answers
Fixture: a fake `figma.teamLibrary` whose collection listing never resolves; then one whose second collection never resolves.
Assert: the probe returns empty within its bound rather than hanging (the stage line then says publish visibility was not checked); one collection that never answers does not empty the rest; the deadline is one for the whole probe, so four hung collections cost one wait, not four (the first live run of the per-call bound spent 123 s on six).

Added 2026-09-23 after the Broken tokens stage failed at "listing the sets" with `Execution timed out after 240000ms` on 4 of 8 attended runs, and the dashboard service's per-command log showed the plugin answering that call in 241 s where the run an hour earlier answered in 1 s: the only unbounded call in that mode is the library API, which Project A sessions had already seen go unresponsive while a probe answered in 2 ms.

Walked 2026-09-23 in node. Runs: node tests/test-links.mjs — "a library API that never answers is given up within the bound".
Runs: node tests/test-links.mjs — "a library API that never answers is given up within the bound, and the probe returns empty", "four hung collections cost one deadline, not four"

## A10 · An override is the consumer's by field, and a self-sourced library is not probed — WALKED 2026-09-24

Fixture: Project B's Components - Main, whose `Alert` (Feedback=Success) carries `Icon container › circle-check › Icon` with its fill overridden to a remote `Colour/Icon/Supportive/Green/secondary` (key `958593a4…`) that Foundations no longer publishes — the green set was recreated as `Color/…` under new keys. The override is listed on `circle-check` as `overriddenFields: ["fills"]`, not `boundVariables`.

Assert the walk. A binding inside an instance is the consumer's when the override names `boundVariables` or that binding's own property. The walk keeps a map of node id to overridden fields, and inside an instance reports only the properties overridden. Replayed live with Foundations' published variables as the reference: the old walk raised 152 candidates over 34,764 bindings and missed Alert; the new one raised 153 over 35,106, the one added being `Alert — circle-check › Icon — fills · Feedback=Success · an override on this component's own copy`, and none removed.

Assert the self-sourced case. When the settings name the library as its own source, the page passes `SELF = true` to `sets` mode, which returns no published list and does not probe, and the stage line says "Publish visibility does not apply: the library is its own source, so its bindings are local." Walked on Project C: the line said so, the link stage listed its sets in 0 s instead of the 20 s the hanging Documentation probe cost, and the audit took 43 s.

Assert the respelling (1.20.0). Names are compared through a spelling fold, so `Colour/Icon/Supportive/Green/secondary` on a retired key, against a source publishing `Color/Icon/Supportive/Green/secondary`, is an error "published under a different key, as \"Color/…\"" whose advice names the token to rebind to. `test-links.mjs` asserts it and fails on 1.19.0.

Walked after the 72 green bindings (3 Web, 69 Mobile) were rebound by a script the maintainer ran, which reported a timeout and finished in Figma anyway (see figma-components-audit A94): a read-only count found 0 left in either file; the Web audit with Foundations open read 35,106 bindings against 294 published tokens and raised none; the Mobile audit closed its four green rows from 22 Sep. Four `Color/Layer/base` bindings on a retired key sit on Mobile's `❖ Screen template` page, outside the component pages the audit reads, so no row names them.

Runs: node tests/test-links.mjs — "a respelled token under a new key is an error that names the current name"

## A11 · A variable inside an applied style is not raised

Fixture: Project A's `_Navigator - Input` (State=Focus), which applies the Core effect style `States/focus-default`; the style binds the hidden primitive `Colour/Palette/Blue/4`, and Figma copies that binding onto the layer's `effects`.

Assert: a fill, stroke or effect variable binding on a layer that applies the matching style (`fillStyleId`, `strokeStyleId`, `effectStyleId`) is flagged `styled` in the walk and skipped by `checkFacts`, counted in `measures.styled`. The same binding without a style is still raised. `test-links.mjs` asserts both. The style reference itself is still checked. Before this, one Project A run raised five "held by the source but not published" rows (`Palette/{Blue,Red,Yellow}/4`, `Utility/white-12%`, `Utility/white-32%`), all on `effects`, against the 2026-08-05 ruling that styles may reference hidden primitives.
Runs: node tests/test-links.mjs — "a variable inside an applied style is not raised; the same binding set by hand still is"

## A12 · The brand group comes from the settings
Fixture: the extension fixtures with `brandGroup: "Brand"`, then the same brand-grouped ramps with no `brandGroup`.
Assert: the first raises the same findings as before; the second raises none and counts no brand tokens.
Runs: node tests/test-extensions.mjs — "no recorded brand group means nothing is invented"

## A13 · Step 6's counts and table are generated from the scan, never written
Fixture: two scan batches from `checkFacts` — one with a removed variable on two layers and a clean component sharing a variable with the other batch, one with a superseded key and a dangling text style.
Assert: `node scripts/report.mjs` prints the counts summed across batches with distinct tokens as the union of `seen`; "not checked" once however many batches said it; one row per finding sorted by page and component, errors before reviews, carrying the scanner's own `text`, `layers` and `advice`; the same bytes in either batch order; "No broken links." for a clean scan; batches naming two files refused; a pipe in a name escaped. `--scope <property>,…` leaves out a finding whose layer lines name none of them before the broken-link counts are taken, and says how many; a batch passed twice is counted once, and two different batches that audited one component are refused; the component and each layer path are code spans. The dangling style's advice says "The style", not "The variable".
Runs: node tests/test-report.mjs

## A14 · A trimmed key set is refused by the report, not caught by eye
Fixture: the two batches of A13, handed the whole key set, and a third batch handed one of its two variables; a batch with no `keysRead`.
Assert: `render(…, { keys })` over the whole-set batches prints the same bytes as without `--keys`; the trimmed batch is refused naming its counts and the saved answer's; a batch from before `keysRead` is refused, never trusted. SKILL.md Step 2 and Step 6 send every report through `--keys keys.json`.
Runs: node tests/test-report.mjs — "--keys: batches handed the whole keys answer render as without it", "--keys: a batch handed a trimmed set is refused, naming both counts", "--keys: a batch from before keysRead is refused, never trusted"
