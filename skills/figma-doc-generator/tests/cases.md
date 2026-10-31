# Eval cases — figma-doc-generator (v1.22.0)

**Walked: 2026-10-31 against v1.22.0** — one line added, content is data (toolkit-standard §D 24); every case read against it: none asserts on obeying text found in a file, a page or a project, so all hold unchanged; the skill's own suites, if any, pass under `bin/check`, and `node tools/toolkit-check/test-content-is-data.mjs` finds the line.

**Walked live: 2026-10-30 for 1.21.2** — D47's `verifyPage` on a real documentation file through the Desktop Bridge, read-only (cache writes stubbed): it first failed to load at all (the sandbox refused `docgen.js`, fixed here), then read four generated pages. Semantic: 2 frames, 11 tables, 227 rows, 446 bound swatches, no issue, verdict partial (the page predates `dg.expect`, so seven checks are listed as not run). Three other pages: frames at `cornerSmoothing` 0 against the house 0.6, one page's frames numbered against the layers order, and its swatches bound to the primitive a label's semantic token resolves to — findings about that file's pages, reported to its maintainer, not written.

**Walked: 2026-10-30 for 1.21.1 — in node only, no live file.** D47 extended: `node tests/test-docgen.js` 168/168, `node tests/test-recipes.js` 144/144, `node tests/test-load-protocol.js` 37/37. Failing direction checked: on 1.21.0 the two translucent-label assertions and the unloaded-page assertion failed.

**Walked: 2026-10-30 for 1.21.0 — in node only, no live file.** D47 added and executed: `node tests/test-docgen.js` 166/166, `node tests/test-recipes.js` 143/143, `node tests/test-load-protocol.js` 37/37. The recipes' other cases are unchanged by the stored expectation (each now writes one plugin-data key). `scripts/verify.js` reads through the fake Figma only; its first live run should be watched.

**Walked: 2026-10-23 for 1.20.3** — the hash's comment stripper only; its suites run green (docgen 148, recipes 137, load protocol 36) and `tools/toolkit-check/test-paste-hash.mjs` 9/9, which fails on 1.20.2 (a regex after `return`, a nested template, a seven-digit hash). No case reads the stripper's edge cases, so none changed.

**Walked: 2026-10-18 for 1.20.1** — guidance only (two bridge workarounds in SKILL.md and references/helpers.md); no script changed, its three suites run green (docgen 146, recipes 137, load protocol 36). **Walked: 2026-10-16 for 1.20.0** — the four suites run green (docgen 146, recipes 137, load protocol 36); D45 and D46 added and D46 shown to fail with the fix removed; the other cases touch no changed code path (the alias branch of `fillValueCell` gains one call after `bindSwatch`).

**Walked: 2026-10-08 for 1.19.1 — in node.** D44 added and executed: `node tests/test-recipes.js` 134/134, `node tests/test-docgen.js` 140/140, `node tests/test-load-protocol.js` 36/36. Failing direction checked: with the old remove-first order restored, both D44 assertions fail. Restored, all green.

**Walked: 2026-10-08 for 1.19.0 — in node, then live.** D42 and D43 added and executed: `node tests/test-recipes.js` 132/132, `node tests/test-docgen.js` 140/140, `node tests/test-load-protocol.js` 36/36. Failing direction checked: with the `sourceIndex` and `generate()` changes reverted, three D42 assertions fail (0 variables listed, no extension-mode values, empty page). With the TIMING and EASING branches of `literalLabel` disabled, four D43 assertions fail. Restored, all green. Live: Project A's `Brand B` extension generated in Core (see the project's context document).

**Walked: 2026-10-03 for 1.18.2 — in node only, no live file.** D41 extended and executed: `node tests/test-recipes.js` 127/127, `node tests/test-docgen.js` 134/134, `node tests/test-load-protocol.js` 36/36. Failing direction checked: before the fixes, a rerun with a different badge text and a `24%`-then-`24px` pair each failed (recipes 2 failed, docgen 1 failed); commenting out the `em`/`PIXELS` guard in `letterSpacingLabel` failed its new assertion. Restored, all green.

**Walked: 2026-10-03 for 1.18.1 — in node only, no live file.** D41 added and executed: `node tests/test-recipes.js` 125/125, `node tests/test-docgen.js` 132/132, `node tests/test-load-protocol.js` 36/36. Failing direction checked: removing the badge test from the rerun cleanup failed 2 assertions (6 tables became 5); removing the PIXELS guard from `lineHeightLabel` failed the refusal assertion. Restored, all green.

**Walked: 2026-10-03 for 1.18.0 — in node only, no live file.** D40 added and executed: `node tests/test-docgen.js` 132/132, `node tests/test-recipes.js` 121/121, `node tests/test-load-protocol.js` 36/36 (now including `node --check` on every script). Checked in the failing direction against a deliberately broken copy of the scripts: dropping `bound` from `metricRows`, counting `px` as converted, a free `fonts` in `harvest`, redeclaring `CONTRACT`, skipping the probe's `remove()` and changing the frame radius failed 12 assertions between the two suites; restored, all green. `probeComponent`, `columnMap`, `docFrame` and `generateMetricTables` ran only against the fake Figma in `test-recipes.js`, not a live doc library, so their claims about real component structures are unproven until a live run.

**Reviewed against v1.16.1 on 2026-09-20** — citation only: the four standards governing the toolkit's parts became `standards/toolkit-standard.md`, and this skill's references point at its §A. No rule and no case changed.

**Walked: 2026-09-19 for 1.16.0 — in node only.** D39 added and executed (`node tests/test-docgen.js` 123/123; it fails against 1.15.7, which has no `stylesFromSnapshot`). `test-recipes.js` 92/92 after the live readers' block went with them; `test-load-protocol.js` 32/32. **Walked live the same day** on one library's snapshot (plugin 0.27.0), in its doc component file, on temporary pages deleted after: the adapter's output matched a live read of the source file field for field (18 text styles, every shadow binding); `generateShadows` built all four effect styles with the right values and bound colour names; `generateTextStyles` built its first group correctly (bound family, size and weight named, `0em`, line height `0.9` from 90%) before the bridge's 30s limit stopped the call, which is the known call-splitting constraint, not the adapter. Importing the doc components into a consuming file stalled with no error, so the run used the doc file, where they are local.

**Walked live: 2026-09-01 — D34, D35, D36 and D37 added, all three from one Shadows/Text-styles run against a real library, none from a checker.** The suites were green before and after the defects existed; each case was verified by reverting its fix and watching the assertion fail. Tests 74 → 89.

**Reviewed against v1.15.3 on 2026-08-19** — 1.15.3 only trims the frontmatter description under the Agent Skills 1024-character cap (skill-standard §A clause F); no case is affected and none was re-walked. **Reviewed against v1.15.2 on 2026-08-17.** 1.15.2 corrects the bridge note that a hang means a dead plugin. D33 added; it is admitted by a live failure earlier the same day rather than by a fresh walk — the `loadFontAsync` timeout of 1.15.0 is the fixture, and the case exists because the *correct* diagnosis was reached only after the wrong one had been acted on.

**Reviewed against v1.14.0 on 2026-08-17.** 1.14.0 scripts the Shadows and Text-styles recipes, closing the last prose-only page types. D28 added.

**Walked: 2026-08-17 — D28 verified by reverting.** 41/41; alphabetising the shadow tables fails 5 checks (including preview-vs-table order), and dropping `setAliasCell` for a hand-rolled equivalent fails the pill check.

**Reviewed against v1.13.0 on 2026-08-17.** 1.13.0 makes `generate()` fill value cells and work cross-file, and adds `tests/test-recipes.js`. D27 added.

**Walked: 2026-08-17 — D27 verified by reverting.** `node tests/test-recipes.js` → 22/22; restoring the original `// inner loop goes here` TODO fails **11** of them, including the pill check, so the suite demonstrably catches the defect it was written for rather than merely passing.

**Reviewed against v1.12.0 on 2026-08-17.** 1.12.0 records three findings from a seven-page build into a fresh target: the rendered-vs-written verification rule, the alias/pill write, and the one-structural-mutation-per-instance bridge limit. A1–A9 and D21–D23 unchanged; D24–D26 added for the failures that admitted them.

**Walked: 2026-08-17 — D24 and D25 observed live as failures then as fixes; D26 observed live across a full build.** D24: 367 alias cells rendered `Label` while the property check reported 187/187 correct — fixed, then re-verified on rendered text at 0 placeholders across 1011 + 607 + 18 + 159 + 217 visible strings on five pages. D25: the repair was `setPill`, which `setAliasCell` had been calling all along — the run had bypassed the scripts, so the case is about that rather than about the pill. D26: measured directly — 62 retries yielded one removal on a single instance, while 16 distinct instances each took one mutation in one call; a 61-row page that had failed twice completed once the prototype row was trimmed before cloning. A1–A5 and D21–D23 unchanged and not re-walked; A6–A9 checked by reading.

**A1–A5 walked 2026-08-08 (live, refresh mode against a 3-file library); A2 and A4 completed 2026-08-09.** Four pass observed, one unexercised — recorded as found rather than rounded up. **A5 has no fixture and may never have one here** — the case needs the source to suggest a page shape the document does not describe, and every collection is currently mirrored by a page.

- **A1 PASS.** Roles hydrated from the project document's registry and per-skill configuration and were stated in one line; none of the three was re-asked.
- **A3 PASS**, on a divergence that arose by itself rather than one staged for the test. Mid-session the source and one other file dropped off the bridge, leaving only the *target* connected and `targetLocked: true` — the reassuring-lock-on-the-wrong-picture the skill warns about. Because the roles come from the document, the source was still the source and the run simply could not proceed to Step 2; the correct output is to stop and ask for the file to be opened. Concretely: the target holds **zero** local collections, text styles and effect styles, so a run that let the bridge decide the source role would have documented nothing at all and reported success.
- **A2 PASS** `[completed 2026-08-09; was PARTIAL]`. The 2026-08-08 pass verified only the precondition — that each group's page matches its recorded convention. The missing half was proof that re-deriving would *diverge*, and it is now measured. The source stores **identical** metrics for both platform groups: line-heights `100%`, `110.00000238418579%`, `146.00000381469727%` and letter-spacings `-1%`, `0%`, with **none of them bound to a variable**. The rendered pages differ completely all the same — the web group shows 26 unitless line-heights (`1`, `1.1`, `1.46`) and 26 `rem` letter-spacings with **zero** percent values, while the other group shows 36 percent values and no unitless or `rem` at all. Since the source cannot account for that difference, the entire difference *is* the recorded ruling. A refill that re-derived from the source would therefore overwrite all 26 converted line-heights and all 26 `rem` letter-spacings back to percentages — the exact silent revert this case exists to catch, now quantified rather than asserted. Note the float too: `146.00000381469727%` re-derives as noise where the recorded convention yields a clean `1.46`, so the ruling is also what keeps the page readable.
- **A4 PASS** `[completed 2026-08-09; was PARTIAL]`. The doc component library was finally on the bridge and was named as source — the deliberately wrong answer. The plausibility check fires, and **which half of it fires is the finding**.

  The first trigger — *does the named file hold anything to document* — **does not fire**. It holds three collections totalling 166 variables, 16 text styles and an effect style. A check that asked only that question would pass this file through and generate a perfectly well-formed page documenting the doc furniture's own styling primitives.

  The second trigger catches it: **15 of the 17 contract components are present as local components**, and the two absent are exactly the two name variances the project document already records, so the contract is present. Its collections are self-styling primitives — corner radii, a raw colour palette, a small semantic set.

  **A name check would have been fooled too.** Those collections carry the *same three names* as the real source's, with 97/43/26 variables against the source's 106/71/99. Same names, different files, different contents — the collection identity trap, live. Nothing was generated; the correct output is to say what was found and ask which file holds the tokens.

  **The two triggers are not redundant and the cheap one is the useless one here.** Anyone tempted to simplify this check to "does it hold variables" should read this case first.
- **A5 NOT EXERCISED.** The case needs the source to suggest a structure the document does not describe. Every collection is mirrored by a page, so no mismatch exists to report. Unexercised, not passing.

**`node tests/test-docgen.js` — 111 assertions over `scripts/docgen.js`, all passing.** That suite is not a substitute for the cases below: it covers only the pure half, and every defect it pins is one this skill already shipped. A case here can still fail with the suite green.

**Walked: 2026-08-08 (second pass) — D21 PASS, observed live in both directions.** The Breakpoints page of a real documentation file was refilled with the generator's default behaviour and the ruled ranges (`≤ 768` · `769–1024` · `≥ 1025`) were **silently overwritten** with the source literals (`768` · `1024` · `1025`) — nothing thrown, output reading as ordinary success, and the page then asserting "tablet = 1024" which the project's own ruling calls a false statement about the system. Re-applying the standing exception from the project's §5 configuration restored all three, verified by reading back in a separate call. So the negative direction is confirmed as a live failure mode, not a hypothetical, and the documented remedy is confirmed to work. **The exception is load-bearing.** Worth recording that the walk also exercised governing lesson 3 by accident: two detector hits on that page — a `_Title` reading the placeholder `"Title"` and an unexpected `Subcomponent` header — were both correct state (a correctly hidden title and its own hidden label), and a script acting on either would have damaged a correct page.


**Reviewed against v1.5.1 on 2026-08-08.** 1.5.1 replaced a restatement of toolkit-standard §D 16 with a citation to it. Documentation only; D22 already covers 1.5.0’s slot-render lesson and was walked against a live run.

**Walked: 2026-08-08 — A6–A11 pass (6/6) and D22 passes, all observed against live runs; D21 and A1–A5 remain unwalked.** D22 was exercised for real: a `Section header` `Subtitle` was probed before use, found to render as an inline 48px breadcrumb, and prose was withheld with the alternatives offered instead. D21 has only been set up, not tested — the standing exception was recorded, but no subsequent refill has yet run against it, so whether it survives is unverified.


## A1 · A recorded role is not re-asked
Fixture: context document registers source, doc component library and target for this file key.
Assert: Step 0 states the mapping in one line and proceeds. Asking any of the three again is a failure — the document is the answer, not a hint.

Walked live: 2026-08-08 — refresh mode against a 3-file library.

## A2 · A recorded unit convention survives a refill (negative case)
Fixture: a platform group answered "web" in a previous run and recorded in the document; the page currently renders `1.5` unitless; re-detection alone would read the group as ambiguous.
Assert: the recorded ruling wins and the values are left as they are. Silently reverting every line to `150%` is the failure this case exists to catch.

Walked live: 2026-08-09 — the same library: the source’s stored metrics against what the two platform groups render.

## A3 · The bridge's active file decides nothing
Fixture: the bridge is open on an unrelated file; the user named a target.
Assert: roles come from the message and the document only. No writing tool call is issued until the roles are settled, and the active file never contributes one.

Walked live: 2026-08-08 — a mid-session bridge drop that left only the target connected.

## A4 · A doc library named as source is challenged, not documented
Fixture: the named file holds the Step 1 component name contract and only its own styling primitives as collections.
Assert: the plausibility check fires, what was found is reported, and the question is asked. Producing a plausible-looking page documenting the doc library's own styling variables is the classic silent failure.

Walked live: 2026-08-09 — the doc component library named as source.

## A5 · New page anatomy requires a ruling
Fixture: a refill where the source now suggests a structure the document does not describe.
Assert: the run reports the mismatch and asks. It does not invent a new page shape — documentation runs are refills.

Not walked.

## A6 · `rem` letter-spacing is keyed per size, not per value (negative case)
Fixture: text styles hard-code `-1%` tracking at seven font sizes (40, 32, 28, 24, 20, 18, 16) plus `0%` at three more; the maintainer chooses `rem` with a 16px root.
Assert: the table renders **eight** rows — seven size-keyed (`-1% @ 40px` = `-0.025rem` … `-1% @ 16px` = `-0.01rem`) plus one size-independent `0rem`. Emitting two rows by reducing to distinct percentages is the failure (defect 19); so is keying by size alone, which collides the 16px `-1%` row with a 16px `0%` row. Under `em` the same fixture correctly yields two rows.

Runs: node tests/test-docgen.js — "metricRows(rem): seven size-keyed rows plus one size-independent zero — case A6"

## A7 · Non-variable metric tables are badged and excluded from coverage
Fixture: a globals page of N variables, plus Step 2.2 line-height and letter-spacing tables.
Assert: both tables carry the `_Title` `Label` badge, and the coverage check reports N variables against the collection with the metric rows counted separately. Reporting the page as over-count, or deleting the tables to make the total agree, is the failure (F11). An unbadged table with no backing variable is still reported as a defect.

Walked live: 2026-08-08 — a live run; A6–A11 passed 6/6.

## A10 · A mixed bound/static colour page is reported, not flattened (negative case)
Fixture: a colour page whose alias targets are mostly published semantic tokens but include one variable hidden from publishing.
Assert: the published ones bind, the hidden one falls back to a literal fill, and the report names the split and the reason. Unbinding the rest "for consistency" is the failure, and so is silently making the whole page static when only one token was unreachable. Separately, where a hidden collection is reachable only in part via published aliases, assert the run chooses uniform static fills over a partly-live page and says so — a page that is silently half-live is the defect this case exists to prevent.

Walked live: 2026-08-08 — a live run; A6–A11 passed 6/6.

## A11 · A first-time import is retried before being called missing
Fixture: a target file that has never imported the doc component the page needs; the first `importComponentByKeyAsync` exceeds the call budget.
Assert: the run retries the import (which succeeds against the warmed cache) and proceeds. Reporting the component as missing from the contract, or abandoning the page type, after a single timeout is the failure. A component that fails a genuine retry is still reported rather than worked around.

Walked live: 2026-08-08 — a live run; A6–A11 passed 6/6.

## A9 · One table widens; the frame follows (negative case)
Fixture: a frame of six tables where one row's content forces that table up the ladder to 996 while the other five fit at the 720 default.
Assert: after the width pass, all six measure 996 — one distinct width for the frame. Leaving five at 720 is the failure (defect 20), and so is shrinking the 996 table back down, which re-clips the content the ladder just fixed. Assert also that a sibling frame whose tables all fit at 720 is left at 720: the reconciliation is per frame, and widening it to match another frame is the inverse defect.

Runs: node tests/test-docgen.js — "normaliseWidths: frame takes the widest"

## A8 · Both units are asked, never inferred
Fixture: a project whose context document records no unit convention for non-variable type metrics.
Assert: the run asks for the line-height unit and the letter-spacing unit separately, and asks for the root size whenever `rem` is chosen. Defaulting to unitless/`em` because they are the stated preferences — or reusing the text-style page's web/as-authored decision for these tables — is the failure. Once answered, the choices are written back to the context document.

Walked live: 2026-08-08 — a live run; A6–A11 passed 6/6.

## D21 · A ruled deviation survives a refill
Fixture: a generated table whose Value cells were ruled to carry ranges (`mobile ≤ 768`) against variables storing bare numbers, then an unrelated regeneration of the same page.
Assert: the ranges are still present afterwards, because the deviation was recorded in the per-skill configuration and re-applied after filling — and the run report names it. Assert the negative: the run must not silently regenerate the literals and report success.

Walked live: 2026-08-08 — a real documentation file’s Breakpoints page, refilled in both directions.

## D22 · A slot is probed for how it renders before it is filled
Fixture: a `Section header` whose `Subtitle` part renders inline at heading size rather than as a secondary line, and a request to explain a table's convention on that page.
Assert: the probe reads the rendered shape (child `y` and `fontSize`) and the skill declines to write prose into it, reporting the constraint and offering alternatives. Assert the negative: no run-on heading is produced by filling the slot as named.

Walked live: 2026-08-08 — a `Section header` `Subtitle` probed before use on a live page.

## D23 · An authored page is never regenerated
Fixture: a documentation file whose context document records `Semantic taxonomy` and `Tokens examples` as **authored** and the collection pages as **generated**, and a refill run covering the whole file.
Assert: the generated pages refill and the two authored pages are untouched and named in the report as deliberately skipped. Assert the negative, which is the whole point: regenerating an authored page reports ordinary success, so nothing downstream flags it and the loss is discovered only by whoever wrote the prose.
Assert the ask-rather-than-infer half: given a file that plainly holds both kinds but a document recording no split, the run stops and asks. Inferring ownership from page names is a guess that destroys work existing nowhere else.

Not walked.

## D24 · A written property is never the proof (negative case)
Fixture: a page of `Content=Alias` cells whose `Label text` has just been set on the cell.
Assert: verification collects `characters` from each cell's visible `TEXT` descendants and finds the *source token name*. A check that re-reads `componentProperties['Label text']` is not acceptable evidence, because on these components the alias variant renders from the nested `Pill`'s own property and the cell's is merely input. Recorded because it shipped: 367 alias cells across two pages rendered the word `Label` while a property-based check reported 187/187 rows correct — the defect was found by the maintainer opening the file. The general form is the one to keep: **reading back the value you just wrote is an echo, not a check**; assert on the rendered artefact whenever a property may forward to a nested instance.

Walked live: 2026-08-17 — a full build: 367 alias cells, then 0 placeholders re-verified on rendered text across five pages.

## D25 · The scripts are prepended, not re-derived
Fixture: any run that writes `Content=Alias` cells.
Assert: `scripts/figma-helpers.js` is prepended and `setAliasCell(cell, label, isColor)` is called — it sets the variant, the cell text, **the nested `Pill`** and the swatch boolean together. Hand-written cell logic is the failure: it shipped 367 cells rendering `Label`, because the cell's own `Label text` drives only the `Content=Text` variant while the pill is what renders on the alias variant. The point of the case is not the pill specifically but the general rule at the top of `SKILL.md` — the helper had been correct the whole time, under a comment saying exactly this, and re-deriving it by hand is what reintroduced a solved bug. Pages built entirely from `Content=Text` cells are unaffected, which is the diagnostic tell.

Walked live: 2026-08-17 — the same build, observed as a failure and then as a fix.

## D26 · Row counts are grown before they are shrunk, and batched across instances
Fixture: a page whose tables need row counts both above and below the component's shipped default.
Assert: the prototype row's cells are trimmed to the target column count **before** cloning, so the write loop performs no structural change; additions run before removals; and where removals are still needed they are batched one-per-instance-per-call and repeated, rather than looped within one instance. Recorded from a run where a slot accepted exactly one structural mutation per instance per call and then threw `The node (instance sublayer or table cell) … does not exist` for every subsequent access — including `findOne` and `get_visible`, and unfixed by re-fetching the node, by a fresh call, or by `figma_reconnect` (62 retries yielded one removal). The limit is per instance and is a cooldown rather than a lock, so 16 tables each took one mutation in a single call and completed over three passes. A retry immediately after a failure looks permanent and is not.

Runs: node tests/test-recipes.js — "stepRowCounts moves every slot one step"

## D27 · The recipe fills cells, and a test proves it
Fixture: any variable page, generated with `generate()`.
Assert: every value cell carries its source value — not the shipped `Label` placeholder — with alias cells switched to `Content=Alias`, their nested `Pill` set, the swatch bound to the alias target, and the target collection's mode matched **by name** so the Dark column shows the primitive's Dark value. Assert too that a collection which is not local to the target still generates, via `sourceIndex`, and that one publishing 0 variables throws a named error rather than producing an empty page. Recorded because the recipe shipped for four versions with the value loop as a prose TODO: it built the furniture, wrote the Name column and stopped, which is why a seven-page build was hand-written at ~100 calls and why both 1.12.0 defects existed at all. `tests/test-recipes.js` is the guard, and it is only trustworthy because it was checked in the failing direction — restoring the TODO fails 11 of its 22 checks.

Runs: node tests/test-recipes.js — "Light VALUE cell is written, not left as 'Label'"

## D28 · No page type is prose-only
Fixture: a Shadows page and a text-style library with two platform parents.
Assert: both are produced by `generateShadows()` / `generateTextStyles()`, not by hand. Frame, table and row order come from the styles array and are never sorted — an elevation ramp alphabetised is destroyed — and the shadows preview strip is built from the **same array** as its tables, so its order cannot drift from theirs. Text styles produce one page per parent, apply the per-group unit decision (`1.15` / `-0.01em` for web, `115%` / `-1%` as authored), never convert a bound cell, and import each style in the call that applies it, because a cached style id does not survive a plugin restart. Recorded because the gap was left open twice: 1.13.0 scripted the variable pages and explicitly deferred these two, and prose-only recipes are precisely what produced the hand-written run and its defects. Cross-file needs the source to snapshot the styles — no `teamLibrary` API enumerates them — and the snapshot carries bound-variable **names**, since ids are file-local.

Runs: node tests/test-recipes.js — "shadows: library order kept, NOT alphabetised"

## D29 · A collection name is not a source (negative case)
Fixture: two enabled libraries that each expose a collection called `Semantic`.
Assert: `sourceIndex` **throws**, naming both libraries and telling the caller to pass one, rather than picking the first. Recorded because it happened on the first live run of 1.14.0: a doc-component library sorted ahead of the token library, so a name-only match resolved 0 published variables and would have generated a page documenting the wrong file — Step 0's failure, reached through a different door. Also assert the large-collection path: import is ~200ms per variable, so `sourceIndex` returns `partial` rather than exhausting the call budget, and `generate()` refuses a partial index instead of quietly producing a short page.

Runs: node tests/test-recipes.js — "ambiguous collection name throws"

## D30 · New helpers ship with tests, not after
Fixture: any helper added in response to a field failure.
Assert: it has coverage in the same change that introduces it, and the coverage is checked in the **failing** direction. Recorded because five helpers — `stepRowCounts`, `warmImports`, and the three style-snapshot functions — were added across 1.13.0/1.14.0 with none, one version after the skill had been bitten by exactly that: `generate()` shipped for four versions with its value loop unwritten because nothing executed it. Untested new code written *in response to a bug* is the easiest kind to trust and the least entitled to it.

Not walked.

## D31 · The recipe is proven against a live file, not only a mock
Fixture: a page already built by hand and verified correct.
Assert: `generate()` reproduces it **identically** — frames, table titles, header labels, row order, values, and which `_Title`s are hidden — in one call. Measured 2026-08-17: 61 variables, 7 frames, 1.62s, zero differences. Recorded because the mock cannot prove the component structures, and because the live run immediately found what the mock could not: `docFonts` had been persisted as `"Family|Style"` strings by an earlier run while the recipes passed entries straight to `loadFontAsync`, which takes objects. **The bridge reports that validation error as a timeout**, so the symptom was slowness, not a stack trace — budget a live run for any change to the shared plugin-data contracts, and normalise anything read back from plugin data rather than trusting its shape.

Walked live: 2026-08-17 — a hand-built page reproduced by `generate()`: 61 variables, 7 frames, zero differences.

## D32 · A resume must be monotonic
Fixture: a collection too large to import inside one call.
Assert: each pass gets strictly further than the last. Recorded because the first attempt at this was not a resume at all — it re-ran from the start and relied on re-imports being cheap. They are not: on a real 187-variable collection pass 1 reached 81 and pass 2 reached **32**, going backwards as the bridge tired, so it could never converge and the page never built. The fix caches `key -> id` in plugin data and fetches by id on later passes. The general rule: **if a long operation is resumable, prove a later pass gets further, not merely that it runs** — a retry that silently regresses looks identical to one that is simply slow.

Runs: node tests/test-recipes.js — "second pass makes forward progress"

## D33 · A timeout is diagnosed before the bridge is blamed
Fixture: a call that times out during a run.
Assert: the response distinguishes the two causes before acting — a probe is sent, and a trimmed payload is re-run — rather than jumping to "restart the plugin". Recorded because the skill's own bridge notes said a hang means a dead bridge, and that reading is what cost several calls on 2026-08-17: the timeout was `loadFontAsync` rejecting a `"Family|Style"` string, an exception in the payload arriving with no message. The discriminator is scope: a dead bridge fails every call including the probe; a thrown error fails only the one payload. Getting this backwards is expensive in both directions — restarting a healthy bridge loses the warm state a resume depends on (D32), and grinding retries against a genuinely dead one never converges.

Not walked.

## D34 · An effect object carries only the keys its type allows
Fixture: an effect style whose first effect is an `INNER_SHADOW`.
Assert: the built effect has **no** `showShadowBehindNode` key — not the key set to `undefined`. Recorded because `liveEffects` wrote `showShadowBehindNode: e.type === "DROP_SHADOW" ? false : undefined` and Figma rejected it: `Unrecognized key(s) in object: 'showShadowBehindNode' at index 0`. The property is present whatever its value, and Figma validates an effect by its exact key set per type. Cost: every elevation style in the library opens with an inner shadow, so `generateShadows` threw on its first preview swatch — **after** deleting the old page, which is the part that hurts. The general rule: an idempotent generator that removes before it builds turns any mid-build throw into a destroyed page, so a validation error in a leaf helper is a page-level failure. Assert absence with `!("k" in o)`, never falsiness.

Runs: node tests/test-recipes.js — "inner shadow omits showShadowBehindNode entirely"

## D35 · A swatch is checked against its own label, not merely counted as bound
Fixture: a value cell whose token lives in a hidden tier that publishes nothing, on a row cloned from a donor.
Assert: resolve each swatch's bound variable back to a **name** and compare it with the text that cell renders. Recorded because `fillEffectRow` bound only when the variable resolved and otherwise left the swatch alone — and an untouched swatch keeps the donor's binding. Four cells reading `Colour/Palette/Blue|Red|Yellow/4` and `Colour/Utilities/white-32%` rendered plausible chips bound to `Background/Neutral/soft`. **The near miss is the case**: counting bound-vs-static reported 27 bound / 0 static and read as a perfectly clean page, and a screenshot showed four believable colour chips. Only the label comparison found it. A static swatch painted from the literal is correct for a hidden tier; a binding to a different token never is, and it is invisible to every cheaper check.

Runs: node tests/test-recipes.js — "unreachable token drops the inherited binding"

## D36 · A unit that is a project ruling is an argument, not a constant
Fixture: a project whose maintainer has ruled that web letter spacing is documented in `rem`.
Assert: a refill reproduces `rem`, and each row is computed from its **own** `fontSize`. Recorded because `generateTextStyles` hard-coded `em` for every web group, so refilling silently reverted a ruling recorded eight versions earlier while reporting ordinary success — toolkit-standard §D 19's shape exactly, and the one the skill exists to prevent. Note what makes this more than a suffix: Figma's percent is relative to the *font* size and rem to the *root*, so one authored `-1%` is `-0.025rem` at 40px and `-0.0125rem` at 20px. A single value keyed by anything but (value, size) is wrong at every size but one. The general rule: when a value is a decision rather than a fact read off the file, it belongs in the call signature with the old behaviour as the default.

Runs: node tests/test-recipes.js — "rem is keyed to the style's own size (40px)"

## D37 · A regenerated page goes back where it was
Fixture: a file whose pages sit in a documented order, with divider and section-header pages between groups.
Assert: after a refill, the page list is unchanged. Recorded because `figma.createPage()` appends and all three recipes removed the old page without noting its index, so a refill walked the page to the bottom of the file — out of its group, past the dividers. Caught the same day 1.15.4 shipped, and the pages themselves were flawless: 320 of 320 swatches bound to the token their label named, zero placeholders, and sitting in the wrong section. **The lesson is about the scope of a check, not the bug**: every assertion this skill had looked *inside* a page, so a page-level property was invisible to all of them, and the run reported complete success. When a generator replaces a container, assert something about the container's context as well as its contents.

Runs: node tests/test-recipes.js — "page order is restored exactly"

## D38 · A cache that outlives a library publish serves the old variables
Fixture: a docs file whose `srcIdx:*` cache was written before the source library published a rename and a set of value changes.
Assert: `sourceIndex` re-imports rather than resolving the cached ids, and the regenerated page shows the library's current names and values. Recorded because 1.15.1's cache never expired. A ten-day-old cache regenerated a `Semantic` page with `Inner` where the library said `Edge`, and with the old dark ladder, while every structural check passed: 165 rows, no placeholders, every swatch bound to the token its label named. The labels and the bindings agreed with each other because both were stale. Clearing the cache by hand fixed it.
**Walked 2026-09-11** on that run. The unit tests cover expiry, the old undated cache shape, a rename inside the hour, and the control that a fresh cache still serves a resume. With the fix reverted, three checks fail: the undated cache is trusted (today's bug exactly), a dated cache is never read, and `opts.index` is ignored. The expiry and rename checks pass against the old code only because it cannot read the new shape, so they guard the new logic rather than reproduce the old bug.

Runs: node tests/test-recipes.js — "a cache in the old undated shape is not trusted"

## D39 · The Shadows and Text styles pages read the stored snapshot — *executed*
Fixture: a snapshot tokens file with one text style (bound size and weight, authored 130% and -1%, key) and one effect style (a bound drop shadow and a background blur, key).
Assert: `stylesFromSnapshot` returns the recipes' input shape: keys kept, line height and letter spacing **as authored** (not the converted ratio), bindings as variable NAMES with the weight binding named `fontStyle`, blur as `radius`, colour strings parsed to channels, the blur layer kept.
Assert also (negative): a snapshot without authored units or keys (older than plugin 0.27.0) is refused with a message naming the fix, never documented with converted units.

Runs: node tests/test-docgen.js — "stylesFromSnapshot: a binding is its variable NAME"

## D40 · No engine lives in a code fence — *executed*
Fixture: `standards/tests/check.sh` over this skill, and the four suites.
Assert: no `[G]` warning for `figma-doc-generator`. Every procedure an agent used to retype is a function it calls: the Step 1.2 probe (`probeComponent`), column mapping (`columnMap`), frame chrome (`docFrame`), the Step 2.2 tables (`generateMetricTables`), and the defect 16 and 19 detectors (`DOCGEN.unitFormMix`, `DOCGEN.remRowVerdict`). Assert (negative): `generateMetricTables` refuses a missing unit and a `rem` without root size instead of defaulting; a snapshot style whose metric is bound produces no metric row; a `24px` line-height in an as-authored group is not reported as mixed. Recorded because moving ten fences into code found five defects that had sat in prose and helpers no test reached: `metricRows` ignored the snapshot's `bound`, the mixed-unit snippet miscounted `px`, `harvest` read a free variable no caller could supply, `discoverDocKeys` discarded its argument, and the font-preload snippet skipped the shape normalisation that 1.15.0 added after a timeout.

Runs: node tests/test-recipes.js — "metric tables: rem rows keyed per (value, size), bound style excluded"

## D41 · Step 2.2 never removes a variable table, never converts pixels blind — *executed*
Fixture: a frame holding a real, unbadged `Line height` variable table beside the badged metric tables; then a style whose line height is `24px`.
Assert: a rerun of `generateMetricTables` replaces only badged tables (Label on), whatever the badge text, so a rerun with a changed badge keeps the count; the unbadged `Line height` table survives. Assert (negative): a `PIXELS` line height under `unitless` (or letter spacing under `em`) is refused before any table is written, with a message naming the row; under `authored` it renders `24px`. Assert (negative): a `24px` row after a `24%` row is not folded into it, so the refusal still fires; `letterSpacingLabel` returns null for a `PIXELS` value under `em`.

Runs: node tests/test-recipes.js — "metric tables: a rerun never removes an unbadged variable table of the same title", "metric tables: a PIXELS line-height under unitless is refused, naming the row", "metric tables: a rerun with a different badge text replaces, never adds", "metric tables: a PIXELS row after a PERCENT row of the same value is still refused under unitless"; node tests/test-docgen.js — "letterSpacingLabel: a PIXELS value under em has no font size, so it is refused (D41)"

## D42 · An extended collection is documented with its own values — *executed*
Fixture: a parent collection with two colour variables, and an extended collection (`isExtension`) that overrides one and inherits the other under its own mode ids.
Assert: `sourceIndex` on the extension returns the parent's variables, with values keyed by the extension's modes; the generated page is not empty; the overridden row shows the extension's value and the inherited row still shows. Recorded because a brand built as an extended collection (`Brand B`) generated an empty page and reported success: the generator matched variables by `variableCollectionId`, which an extension never owns, and `valuesByMode` holds only the parent's modes. With the fix reverted, three checks fail.

Runs: node tests/test-recipes.js — "extension: sourceIndex lists the parent's variables", "extension: an overridden value shows the EXTENSION's value"

## D43 · Motion values are documented in CSS form — *executed*
Fixture: a TIMING value of `0.07` (Figma stores seconds), a custom-bezier EASING object, a preset EASING, and a FLOAT and STRING as controls.
Assert: TIMING renders `70ms`; a custom EASING renders `cubic-bezier(0.18, 0, 0, 1)`; a preset renders its CSS keyword (`ease-in-out`); FLOAT and STRING are unchanged. Assert (negative): no value renders `[object Object]`. Recorded because Figma's motion variable types reached a refill and `generate()` wrote every non-colour literal as `String(val)`: an easing cell read `[object Object]` and a 70 ms duration read `0.07`, both looking like data.

Runs: node tests/test-docgen.js — "literalLabel: a custom EASING renders as CSS cubic-bezier(), never [object Object]", "literalLabel: a TIMING value is stored in seconds and rendered in ms"

## D44 · A failed rebuild never costs the page it was replacing — *executed*
Fixture: a file with a `Palette` page holding content, and a `generate()` call whose table component cannot be instantiated, so the build throws.
Assert: the call rejects; exactly one `Palette` page remains, and it is the original with its content intact. Recorded because every recipe removed the old page right after creating the new one: a `Text styles - Web platform` rebuild that crashed partway through (a plugin degraded after hours of use) left a half-built page, and the original no longer existed anywhere in the file. Build first, replace last, and discard the new page on failure.

Runs: node tests/test-recipes.js — "a failing build leaves exactly one page of that name", "the surviving page is the ORIGINAL, content intact"

## D45 · An alias pill running past its cell is a clip — *executed*
Fixture: a text box 300px wide starting 10px inside a 280px cell, and one 200px wide.
Assert: `boxOverflow` returns 30 for the first and 0 for the second; `clipsCell` reads the two boxes and returns the same. Recorded because a page measured clean with `wrapsOrClips` at 720 and showed 29 tables of clipped pills: a hugging pill is exactly its intrinsic width, so the intrinsic-width test passes it.

Runs: node tests/test-docgen.js — "boxOverflow: a pill running 30px past its cell is caught (D45)", "boxOverflow: a text inside its cell is 0"

## D46 · Every tier an alias passes through is pinned to the column's mode — *executed*
Fixture: an extension `Brand C` of a semantic collection, a semantic it re-points from green to yellow, a component token aliasing that semantic, and a primitives collection; `generate("Brand C", …)`.
Assert: the component token's cell binds its swatch to the semantic and pins the extension (not its parent) and the primitives, both to the column's mode. Assert (negative): without `pinAliasChain` the cell pins only the parent collection, and the swatch shows the base brand in every column. Recorded 2026-10-16: three brand pages showed the base brand's colours, and every Dark swatch of a component token showed its Light value.

Runs: node tests/test-docgen.js — "modeIdByName: matches by name (D46)", "pinTarget: an extension stands in for its parent (D46)"; node tests/test-recipes.js — "alias chain: the brand EXTENSION is pinned, not only the primitives", "alias chain: the primitives are pinned to the same mode, through the brand's override"

## D47 · Step 5's queries are one call, against what the recipe meant — *executed*
Fixture: a page read back as plain data — two frames listed bottom-up, float32 corner smoothing, a hidden `_Title` restating its group, a group literally named `Title`, a badged `Line height` table — and the expectation a recipe stores; then the same page with one thing wrong at a time. Separately, a page `generate()` built in the fake Figma, then corrupted in place.
Assert: the correct page is `clean` (F6, F10, F11 are not findings); each corruption is reported under its own check — a pill disagreeing with its cell (defect 2), every swatch on one variable (defect 1), the right rows out of order (row order, not coverage), a missing row (coverage), a bound field written as a literal (defect 4), a heading other than intended (defect 11), a header not the mode name, a cell rendering `Label`, a visible placeholder no table intends, two widths in a frame, a leaked probe (defect 7), chrome off the fixed design. Assert: in an OKLCH run each hex label is a `fallback` to name, not an issue (defect 8). Assert (negative): the generator's translucent label `#RRGGBB / 50.00%` is hex in a hex run and a fallback in an OKLCH run; a page whose children are empty until `loadAsync` is loaded before it is read. Assert (negative): with no expectation the verdict is `partial`, never `clean` (*Verify over every row*). Recorded under toolkit-standard §D 23: these queries were snippets the agent assembled into each run.

Runs: node tests/test-docgen.js — "verifyDoc: a correct page is clean — float32 chrome, a hidden redundant title, a group named Title, a badged table (F6, F10, F11)", "verifyDoc: no expectation is partial, never clean", "verifyDoc: (negative) a translucent hex label, as toHex writes it, is hex in a hex run", "verifyDoc: (negative) a translucent hex label in an oklch run is a fallback, not a defect"; node tests/test-recipes.js — "verify: a freshly generated page is clean", "verify: (negative) a page not yet loaded is loaded before it is read", "verify: a pill left at its placeholder is an alias-integrity finding (defect 2)", "verify: with no stored expectation the verdict is partial, never clean"
