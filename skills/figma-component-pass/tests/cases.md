# Eval cases — figma-component-pass (v1.7.2)

**Reviewed against v1.7.0 on 2026-10-02** — A2's rename assertion corrected to the tested behaviour: a rename breaks the API, not the overrides. Traced to *The checkpoint*; no other case changed.

**Reviewed against v1.5.1 on 2026-09-20** — citation only: the four standards governing the toolkit's parts became `standards/toolkit-standard.md`, and this skill's references point at its §A. No rule and no case changed.

**Reviewed against v1.5.0 on 2026-09-10** — stages now run the other skills by name; the ordering and consent cases are unchanged.

**Reviewed against v1.4.1 on 2026-09-10** — rename only: the audit skill is now `figma-components-audit`; no case changed.

This skill orchestrates three others, so almost nothing it does is visible in a single artefact. Its failures are ordering failures and consent failures: the output looks well-formed in every one of them. Cases below pin the invariants that make the bundle worth more than running the three skills by hand.

**Walked: 2026-08-08 by tracing (9/9); 2026-08-09 against live components — A2, A5, A6 and A7 observed, A1 and A8 partly. A3, A4 and A9 still need a run that writes or a user decision.** The 2026-08-08 pass traced each assertion to the instruction mandating it and observed no behaviour; that is the weaker kind of walk and it was recorded as such. This line replaces it for the cases now settled and keeps the distinction for those not.

**The 2026-08-09 pass was dry-run: stage 1 executed for real (it is read-only), stage 2 via `PT.plan`, stage 3 drafted but never applied.** Nothing was written to the library. That is enough to settle the ordering and consent invariants, which are what this skill exists for, and not enough for the four cases whose subject is what happens *after* a write or a decision.

Two components carried the walk, chosen because their audit results differ: `_Arrow button` (❖ Numerical input) has an interface-changing finding and `Tab item` (❖ Tabs) has none — so one exercises the checkpoint stopping and the other exercises the run continuing.

## A1 · The order never changes, even when stages are skipped
Fixture: the user asks only for "the properties table and the description" on a component, explicitly not the audit.
Assert: stage 1 is skipped as asked, and the table is still generated before the description. Requesting a subset removes stages; it never reorders the survivors.
Assert also: asking for them in the wrong order ("write the description, then do the table") does not reorder the run — the skill produces table then description regardless of the phrasing. Per *Partial and repeat runs*: "the relative order never changes."

**Half-walked 2026-08-09 — the ordering assertion is observed; the skip assertion is not.**

*Ordering, observed.* `Tab item` was taken through the reversed request — description first, then table — and the run produced the **table first**: `PT.plan('❖ Tabs')` returned its six rows (`Selected`, `Disabled`, `State`, `Icon`, `Icon swap`, `Label text`) before any description work began. The phrasing did not move the stages. This matters more than it sounds, because both artefacts derive from the same interface read, so a run that honoured the phrasing would be drafting prose from an interface it had not yet finished enumerating.

*Skip, not observed.* The fixture requires stage 1 to be explicitly declined, and stage 1 was run on both components in this pass — deliberately, since it was needed to establish which component had an interface-changing finding for A2. So "requesting a subset removes stages" was never exercised. Walking it needs a run where the audit is refused outright.

Walked live: 2026-08-09 — a live component set put through the reversed-order request; the ordering half observed, the skip half not.

## A2 · Running inside the bundle is not approval to fix (negative case)
Fixture: a "full pass, get it ready to publish" on a component whose audit finds an interface-changing fix — a mis-suffixed property, say.
Assert: detection runs, findings are presented, and the skill **stops and waits**. No fix is applied, and the run does not proceed to stage 2 on the assumption that "full pass" authorised the change.
Assert also: interface-changing fixes are flagged as such when presented, and a variant property rename is flagged as breaking for the API (Code Connect, name-keyed scripts, Swap library) — never as rewriting instance overrides, which it does not (tested in Figma 2026-10-01, `figma-components-audit` case A98).
This is the case with the most to lose. Per *The checkpoint*: "Running inside this bundle is not implicit approval." An unattended pipeline that restructures someone's component is the failure the checkpoint exists to prevent, and it will look like a successful run.

**Walked 2026-08-09 — passes, on a live interface-changing finding.** Stage 1 on `_Arrow button` (❖ Numerical input) returned its axes as `State → Disabled`, against the project canon of `… Disabled → State` with `State` last. That is an interface change: it alters the component's declared property order, not its rendering. The run **stopped there**. No fix was applied and stage 2 was not started for that component — the table was never derived from an interface under discussion.

**One nuance the case does not currently cover, and should.** The case assumes the finding is unapproved. Here the project's context document already carries a ruling — *"Ruled 2026-08-08: fix both to `Disabled → State`"* — so approval to make the change exists in principle. The checkpoint still stopped, on the reading that a recorded ruling that something **should** happen is not the same as authorisation to execute a write **now**, inside a run the maintainer started for a different purpose. Every skill in this repo separates deciding from writing; the checkpoint is where that separation lives for the bundle.

**A second nuance, on how the finding was flagged.** The case asks that a variant property rename be flagged as breaking (as written then, because it rewrites every instance override — a claim withdrawn on 2026-10-01, when a test in Figma showed renames keep every override). This finding is a **reorder**, not a rename, and Figma matches variant properties by name rather than position — which the context document records explicitly — so it is interface-changing and **non**-breaking. Reporting it as breaking would have been wrong and would have made a cheap fix look expensive. Worth adding to the case: interface-changing and breaking are two axes, not one.

Walked live: 2026-08-09 — a live component whose audit returned an interface-changing axis order.

## A3 · An applied interface fix forces re-detection before anything is mirrored
Fixture: the user approves a fix that renames a variant axis from `Status` to `Feedback`, and it is applied.
Assert: detection is re-run on the same component and each finding confirmed cleared **before** stage 2 begins. The table and description mirror the corrected interface, so no `Status` row and no `Status` reference survives anywhere in the output.
Per *Why this order*: both artefacts are derived from the interface, and a stale mirror "still looks perfectly well-formed" — nothing downstream will catch it.


**Walked 2026-08-09 — passes, on a real applied fix rather than a staged one.** The maintainer authorised applying the axis reorder that A2 had stopped at, so A2 and A3 were walked back to back on the same component: A2 halted before the fix, A3 governs everything after it.

*Before.* Five variants all named `State=…, Disabled=…`, axis order `State → Disabled`, against a canon of `… Disabled → State` with `State` last. The state of all **46** instances was captured first.

*Applied.* Each variant renamed to put `Disabled` first. Figma derives axis order from the variant-name strings, so this is the whole fix.

*Re-detection, before stage 2 and this is the assertion.* Axes read `Disabled, State`; the order check passes; and the stored-versus-canvas option order agrees on every axis, so the rename did not desync the grid from the definitions. **The finding is confirmed cleared, not assumed cleared.**

*The non-breaking claim, measured.* All 46 instances were re-read: **46 of 46 still hold their original selection**, none changed, none detached. The context document asserts that Figma matches variant properties by name rather than position; that is now observed here rather than quoted. It is the claim that made the fix cheap, and it would have been expensive to be wrong about.

*Then stage 2.* The table for that component now reads `Disabled → State → Icon swap`. Walked earlier the same day under A2, before the fix, it read `State → Disabled → Icon swap`. **No stale reference survives anywhere in the output**, and the pairing is the strongest evidence either case produced: the same generator faithfully mirrored the defective order when the component was defective, and the corrected order once it was corrected. A table that could not do both would be useless for exactly the thing this bundle exists to do.

Walked live: 2026-08-09 — the same component after the axis reorder was applied, with all 46 instances re-read.

## A4 · Declined findings are named in the report, not just noted
Fixture: the audit finds two interface-affecting issues; the user declines both and asks to continue.
Assert: the run continues and the table is still generated. The final report states that the table and description mirror a component with known open findings **and names which ones**.
Assert also: a report that merely says "some findings were declined" fails this case. The point is that a later reader cannot mistake the documentation for a clean bill of health, and an unnamed finding does not achieve that.


**Not walked 2026-08-09 — requires a user decision.** The fixture needs the maintainer to decline findings and ask to continue. Nothing was declined here; the `_Arrow button` finding is queued, not refused. Worth noting the assertion is about *naming* the declined findings rather than counting them, so a run that says "2 findings declined" fails it — which makes this a case about report wording that only a real decision can produce.

Not walked.

## A5 · Instance dedupe is keyed per variant, not per set
Fixture: a stepper component set with a `Layout` axis, whose slot children are all named `Step item` but resolve to `Step item / Horizontal` under one Layout value and `Step item / Vertical` under the other.
Assert: both mains appear in the composition list. A dedupe keyed on instance name alone across the whole set keeps only whichever variant was scanned first, and fails this case.
Assert also: the resulting count is cross-checked against the number of distinct mains the variant axes predict, and a shortfall is raised rather than accepted.
This is a recorded production failure, not a hypothetical — stage 0 carries the keying code and the warning that "the failure is quiet and plausible-looking", because the short list is correct as far as it goes and nothing downstream flags it.

**Walked 2026-08-09 — passes, and the fixture exists in this library with the exact shape the case describes.** Both keyings were run side by side across all **56** component sets: the shipped `variant.name + '::' + i.name`, and the broken `i.name` alone. Exactly **one** set diverges.

`Calendar` (❖ Calendar, 4 variants on `Selected × Range`). Every day cell in it is named **`_Day`** — a single instance name — and it resolves to `_Day item / Default` under `Range=False` and to **`_Day item / Range`** under `Range=True`. That is `Step item` → `Step item / Horizontal|Vertical` verbatim, with `Range` playing the part of `Layout`. Per-variant keying scans 16 instances and returns 5 mains; name-alone keying scans 4 and returns 4, **losing `_Day item / Range` entirely**.

**One divergence in 56 is the whole point, and it is why this reached production.** A run using the broken keying is correct on 55 sets and silently wrong on the 56th. There is no error, no empty result, and no shortfall visible in the output — `Calendar`'s composition list would simply read one item short, naming a `_Day item / Default` that is genuinely there. A bug that fires 2% of the time survives every casual check.

The cross-check half of the assertion is satisfiable here too: the `Range` axis has two values and `_Day item` has two mains, so the axes predict 2 and the naive keying returns 1 — a shortfall a run can detect rather than accept.

Walked live: 2026-08-09 — both keyings run side by side across all 56 component sets in a live library.

## A6 · A missing Properties section is skipped and reported, never improvised (negative case)
Fixture: a documentation page with no Properties section at all.
Assert: stage 2 is skipped and the report says so. The skill does **not** create a Properties section, invent an anatomy for it, or write the table somewhere else that looks reasonable.
Per *Stage 2*: "the stage is skipped rather than improvised — say so in the report instead of building one."

**Walked 2026-08-09 — passes.** `❖ Select menu` holds components (`Menu - Item`, `Menu / Default`, `Menu / Filtering`) and **no Properties section**. Stage 2 against it returned `skipped: "no properties table"` and wrote nothing. No section was created, no anatomy invented, and the table was not placed somewhere else that would have looked plausible.

The underlying reason is worth recording because it is a design decision rather than an accident: the table is located by the profiled `tableName`, with **no shape-based fallback**. `figma-properties-table` documents why — matching "anything table-shaped" would eventually find a data-table example on some page and overwrite its cells with property rows. So the skip is structural. A run cannot improvise here even if it wanted to, which is a stronger guarantee than an instruction not to.

Walked live: 2026-08-09 — a live documentation page with no Properties section.

## A7 · A known defect is omitted from the description, not written up as a feature (negative case)
Fixture: the audit finds a hardcoded text layer with no corresponding text property; the fix is deferred.
Assert: the description says nothing about that text, and the report notes the description will need a line once the property exists.
Assert also: describing it as fixed or intentional content fails this case, even though such a sentence reads perfectly well. Per *Stage 3*: "Writing around a known defect quietly bakes it in."
Assert the prior question, because this case is worthless without it: **unbound text must first be judged a defect or not, and only defects reach the rule above.** Assert the default with it — **most text layers do need a property**, and the finding stands unless one of two narrow exceptions applies: static by design (weekday headings, a mandatory asterisk) or written by code at runtime (a live `Uploading - 64%` readout). A filename, caption, heading or label is a gap.
Assert the negative that matters most here: **a run that reaches for either exception freely fails this case.** "Probably static" is available for any text at all, so an exclusion applied loosely swallows exactly the findings the check exists to produce — the same failure as flagging everything, arrived at from the other side. In the walked library the split was two static, one runtime-driven, two genuine gaps.


**Walked 2026-08-09 — passes, on two independently described components.** The fixture is live and had to be found carefully. A first scan for "text with no text property" flagged components whose text is bound to a property owned by a **nested** component — the outer set's `componentPropertyDefinitions` excludes those, so the naive test reports bound text as hardcoded. That is the trap `scanner-checks.md` documents for unused-property checks, hit here from a different angle; the corrected test ignores text inside nested instances and requires no `characters` reference at all.

Corrected, five in-scope components hold genuinely unbound text, and **two of the five are designed** — a calendar's weekday labels and a mandatory-field asterisk are fixed content, not defects, which is the exclusion any check here needs. Of the three real ones, two are described: a navigation panel holding unbound `Title`, `Label` and `Caption` layers, and a toolbar holding an unbound description line.

**Neither description mentions the unsettable text.** Both document only what genuinely is settable — slots and variants — and stay silent on the rest, which is exactly what this case asserts. The negative half did not occur either: neither writes the text up as intentional or fixed content. The third component is undescribed, so it had nothing to write around.

Walked live: 2026-08-09 — two live components holding genuinely unbound text.

## A8 · One consolidated report, not three
Fixture: a run in which all three stages execute.
Assert: exactly one report is produced, carrying the Audit / Properties tables / Descriptions / Open decisions structure, with `Open decisions` listing only what genuinely waits on the user.
Assert also: each section leads with results rather than process, and findings about the *component* — an axis named against house style, a default that looks wrong — appear even though they are not defects in the documentation. Three separate reports, or a report that omits component findings because they are "not documentation problems", fail this case.

**Half-walked 2026-08-09.** The pass produced a single consolidated report carrying the four sections, and it did include a finding about the *component* rather than its documentation — `_Arrow button`'s axis order, which is a build defect and not a documentation defect, and which the case explicitly requires to appear. `Open decisions` listed only the two items genuinely waiting on the maintainer.

**What was not tested is the case's real target.** The fixture is "a run in which all three stages execute", and no stage wrote anything here, so the report describes a dry run rather than a completed pass. A consolidated report is also the easy half of this case — the failure it guards against is three reports emitted as each stage finishes, which only becomes tempting when the stages are long and actually writing. Settle it on a real pass.

Walked live: 2026-08-09 — a dry-run pass; one consolidated report observed, but no stage wrote.

## A9 · A whole-library run goes component by component, not stage by stage
Fixture: the user asks for a full pass across an entire page of components.
Assert: each component is taken through all three stages before the next is started — not stage 1 across the whole page, then stage 2 across the whole page.
Assert also: one complete description is shown for confirmation before the run continues at scale.
Per *Partial and repeat runs*: per-component ordering is what keeps the interface reading, the table and the prose in sync; a stage-wide sweep reintroduces exactly the drift the ordering exists to prevent.


**Not walked 2026-08-09 — single-component pass only.** Two components were taken through stages, but not as a library sweep, so the per-component-versus-per-stage ordering was never under pressure. This is the case most likely to fail in practice and least likely to fail in a small test: batching stage-wide is a temptation that appears at scale, when running one stage across thirty components is obviously faster than thirty three-stage passes. It needs a genuine whole-page run to mean anything.

Not walked.

## P10 · The interface can change mid-pass, and only a fresh read catches it — WALKED 2026-08-14 (twice in one session, on a live shared file)
Fixture: two components in one session of a file the maintainer was editing at the same time. A `Sheet` gained a sixth property (`Tabs`) between the stage 0 interface read and the stage 3 write. A `Message card` gained the `Message text` property whose *absence* had just been reported as a finding and carefully written around, so the description said less than the component now supported.
Assert the detection: both were caught by the stage 3 cross-check comparing the written description against a **re-read** `componentPropertyDefinitions`, not against the stage 2 plan captured minutes earlier. A cross-check against the cached plan agrees with itself and reports clean.
Assert the response: **stages 2 and 3 re-run together**, never the description alone. On `Sheet` the table was already applied from the pre-change interface, so patching only the prose would have left a 5-row table and a 6-property description — the exact half-updated state the ordering exists to prevent, and one that looks well-formed from either side.
Assert the negative, because it is what stops this becoming ceremony: this is not a licence to re-read continuously. One fresh read at the verification step caught both; polling between every write would have cost calls and caught nothing extra.
Assert why it is a skill rule and not a note: neither change announced itself, and both would have shipped as correct-looking documentation of a component that had moved on. A shared file is the normal case, not the exception.

Walked live: 2026-08-14 — two components in a shared file the maintainer was editing during the session.
