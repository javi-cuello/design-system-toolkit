# Eval cases — figma-tokens-examples (v1.5.0)

**Walked: 2026-10-31 against v1.5.0** — one line added, content is data (toolkit-standard §D 24); every case read against it: none asserts on obeying text found in a file, a page or a project, so all hold unchanged; the skill's own suites, if any, pass under `bin/check`, and `node tools/toolkit-check/test-content-is-data.mjs` finds the line.

**Walked live: 2026-10-30 against v1.4.0** — T8's `rows` mode on a real library through the Desktop Bridge, read-only, with four of its Semantic Background names and one made up: category Background, content Frame, each row's Role/Type/Emphasis and label as the names give them (a Neutral row with no Type), and only the made-up name flagged `[check-token]`. Before that, **Walked: 2026-10-30 against v1.4.0 — T8 added and executed in node** (`node tests/test-tokens-mapping.mjs`, 14/14); T1–T7 unchanged by it (T7's ten assertions still pass). `rows` mode's name resolution runs against a mock `figma`; not walked live.

**Walked: 2026-10-03 against v1.3.1 — T7 extended, executed in node** (`node tests/test-tokens-mapping.mjs`, 10/10). Removing the per-cell catch in `writeCells` fails the batch assertion; removing the `Stroke` `Sample`-has-fills check fails its new assertion. Not walked live.

**Walked: 2026-10-03 against v1.3.0 — T7 executed in node** (`node tests/test-tokens-mapping.mjs`, 8/8; putting the old prose's two shapes back — the `Text` swatch as `A`, no pill reset — fails 6 of the 8). T1, T2 and T5's rules are now asserted there against mock nodes as well. **The script has not met a live file**: its Figma calls (`setProperties`, `setBoundVariableForPaint`, the name resolution against bound colours, the frame-name check's assumption that a `Level` instance is a direct child of the frame it names) are syntax-checked by the same suite parsing the whole body, not observed. Watch its first real run.

**Reviewed against v1.2.3 on 2026-10-01** — no case changed; the release is one table cell's separator, and the skill has no suite to run.

**Walked: 2026-08-09 against Project A `04. Documentation` → its `Tokens examples` mapping page, 58 token cells across two sections — T1, T2, T4, T5 pass; T3 half-walked; T6 passes at the document level.** Read-only: nothing was built, bound or switched. The page was already populated, so every assertion could be checked against a real implementation rather than one this walk created — which is better evidence, since the file was authored before these cases existed and cannot have been fitted to them.

**Two findings and one open question came out of it**, all recorded in the case that produced them and queued in Project A's context. The open question is a direct contradiction between this skill's stated rule and the reference file it documents, and it is left open deliberately rather than resolved by guessing which side is stale.

Every case below pins a mistake the skill already documents. That is deliberate: §5 is a list of failures someone hit and wrote down, and a documented failure with no case is exactly what invites the regression back.

## T1 · The swatch is bound, never the pill
Fixture: a row whose `Content` pill carries a neutral overlay fill and whose `Sample` swatch is the layer that should receive the variable.
Assert: the binding lands on the named swatch layer, located by name. Assert the negative explicitly: a generic recursive search for "the first child with a fill" fails this case, because it reaches the pill first. This is the skill's own "single most common and hardest-to-spot mistake" — the pill still renders *something*, usually a leftover colour from whatever the instance was cloned from, so the row looks populated and is wrong.

**Walked 2026-08-09 — passes, and the negative is confirmed at 58 out of 58.** The naive search was implemented exactly as the case describes — breadth-first from the token instance, first descendant with a visible fill — and run against every token cell on the page. It returned `FRAME:Content`, the pill, **every single time**. It reached `Sample` zero times. There is no cell in this table where the shortcut would have worked, so a run taking it would bind the wrong layer on all 58 and produce a table that renders in full.

**The positive half was first recorded wrongly, and the correction is the most useful thing in this case.** The initial pass reported "all 58 targets bound, zero missing". It had looked for the `Text` swatch under the layer name the skill's §2 table gave — `Sample > A` — and the file names it `Aa`. `findOne` returned null for all 21 `Text` cells, the guard `if (target && …)` skipped them rather than counting them, and the remaining 37 all being bound produced a confident "58 of 58". **A name that matches nothing does not throw; it silently shrinks the population and reports a clean result on the remainder.**

Re-run with the real name: 58 of 58 genuinely are bound, so the headline conclusion survives — but it survived by luck, and the wrong method concealed the finding below. The skill's table is corrected in 1.2.1, with a note that a name-lookup returning nothing is a finding about the name and never a cell to skip.

**Finding, since fixed: the whole `Text` section was bound to a single token.** All 21 of its cells pointed at the neutral-medium text token while labelled as 21 different ones, and six of those labels named a `soft` emphasis that does not exist for that category. Found only after correcting the layer name above — the wrong name had excluded exactly those 21 cells from the check. Resolved 2026-08-09: six phantom rows removed, 15 cells rebound one-for-one, verified at 15 distinct tokens with zero label-binding mismatches.

**A route worth recording for anyone rebinding from a script:** `importVariableByKeyAsync` hangs indefinitely through the Desktop Bridge with no error. Variables already used elsewhere in the same file are reachable without any library fetch — harvest their consumer-side ids off an existing binding and pass those to `getVariableByIdAsync`. A remote collection's `variableIds` is no guide to what is available; it under-reported by more than half here.

**Finding: the pill is treated two different ways in one table, and neither matches this skill's rule.** 42 of the 58 pills carry a fill **bound** to a neutral background token; the other 16 are unbound at a flat `#000000 a=0.03`. The skill states the pill is "**always** a flat neutral overlay, never bound to a variable" and names that exact paint, so the 16 comply and the 42 do not. The split is not random — the `Text` section is uniformly bound (21/21) while the `Background` section is mixed (21 bound, 16 not).

**This is emphatically not the failure T1 describes, and the difference matters.** T1's failure is a *stale* colour surviving from whatever the instance was cloned from. Zero pills are bound to the same variable as their own swatch, and both treatments resolve to a neutral — so nothing bled, and the table is not wrong in the way this case guards against. What it is, is inconsistent, plus a live contradiction with the rule. Left open rather than settled here: binding the overlay to a neutral token is arguably better than hardcoding it, since `#000000 a=0.03` cannot respond to dark mode, so the skill's rule may be the stale half. That is the maintainer's call, and guessing it would bake one answer into 58 cells.

Walked live: 2026-08-09 — Project A's `04. Documentation` mapping page, all 58 token cells; the naive search returned `FRAME:Content` 58 times and reached `Sample` zero times.

## T2 · A variant switch resets the layers that must stay neutral
Fixture: a cell switched from `Content=Shape` to `Content=Text`, where the previous variant left an override on a same-named layer.
Assert: the layers §2's table lists as "must stay neutral" are explicitly reset after the switch, not assumed clean. Variant-switch bleed carries an old override onto the identically-named layer in the new variant, which renders as a plausible colour rather than as an error.

**Walked 2026-08-09 — passes.** §2's table names one layer that must stay neutral after a switch: for the `Text` variant, the `Content > Sample` FRAME fill, which can inherit a prior `Shape` swatch's colour. All **21** `Text`-variant cells were checked: every one carries `#000000 a=0.03`, none is bound to a variable, and none holds any other colour.

The uniformity is the evidence. A bleed would show as one or two cells carrying a stale swatch colour among otherwise-neutral siblings — the plausible-looking wrong value this case exists for. Twenty-one identical values across cells that were built at different times is the signature of an explicit reset rather than of luck, since bleed is per-instance and would not land on every one identically.

Worth noting alongside T1: within these same 21 cells the `Sample` frame is hardcoded neutral while the `Content` pill above it is bound to a token. So the file distinguishes the two layers deliberately and treats each consistently — which is what makes the `Background` section's mixed pill treatment look like drift rather than a decision.

Walked live: 2026-08-09 — the 21 `Text`-variant cells on the same page; every one at `#000000 a=0.03`, none bound.

## T3 · Feedback type names are confirmed per category, never copied across
Fixture: two categories where one uses `Warning` and another still carries an older `Yellow` for the same slot, and a third is missing a Feedback type the others have.
Assert: each category's type names are read from that category's actual variable list. Assert the negative: copying the name set from the first category produces rows naming variables that do not exist, and a plausible name matching the project's formula is not evidence the token exists — it must be marked `[check-token]` rather than guessed (toolkit-standard §D 15).

**Half-walked 2026-08-09 — the positive is confirmed; the negative cannot be tested in this library, and the reason is worth stating.**

*Positive.* Both sections' Type cells read `Primary · Secondary · Danger · Positive · Info · Warning`. Checked against Core's Semantic collection: `Primary`/`Secondary` are the Accent types and `Danger`/`Info`/`Positive`/`Warning` are the Feedback types, under both `Colour/Background/*` and `Colour/Text/*`. Every name in the table corresponds to a real variable in its own category. No `[check-token]` marker was needed because no name was unverifiable.

*Negative — **testable after all, and the library fails it.** This corrects an earlier reading in this same walk.* The first pass concluded the categories agreed and so the case could not be exercised. They agree on **Feedback type names** — all four, in every category — but they do **not** agree on **emphasis** names, which is the axis this case actually bites on. `Text` has `strong`, `medium` and `inverse`. `Icon` additionally has `soft`.

The `Text` section names **six tokens that do not exist**: the `soft` emphasis on both Accent types and on all four Feedback types. Core holds 15 `Colour/Text/*` variables and none of them is a `soft`. Those six rows are the shape this case predicts in as many words — a name that matches the project's formula, is entirely plausible, and refers to nothing — and the neighbouring category that *does* have `soft` is the obvious source. Marking them `[check-token]` rather than writing them is exactly what toolkit-standard §D 15 asks for.

*Adjacent finding, raised as a question rather than a defect.* `Colour/Background/*` carries a fourth Role, `Overlay`, that `Text` and `Icon` do not — and the Background section documents only `Neutral`, `Accent` and `Feedback`. The skill is explicit that these are representative example tables rather than exhaustive mirrors, so omitting rows is expected; omitting a whole **Role** is a larger call, since the table's stated purpose is showing which combinations the taxonomy produces. Worth a deliberate yes or no.

Walked live: 2026-08-09 — both sections' Type cells against Core's Semantic collection; six `soft` names found that match no `Colour/Text/*` variable.

## T4 · Missing combinations are blank cells, not absent rows
Fixture: a Role where one Emphasis has no `Hover` state.
Assert: the cell is rendered blank via the `Empy` convention rather than the row being shortened or the column omitted. A shortened row silently changes the table's shape, so a reader cannot tell "this combination does not exist" from "nobody filled this in" — and the table's whole purpose is showing which combinations the taxonomy actually produces.

**Walked 2026-08-09 — passes.** The page holds **114** instances carrying the `Empy` property, 91 set `False` and **23 set `True`**. The blanks are real instances switched to their empty variant, not absent nodes — nothing was deleted to hide a column.

The distribution shows the convention doing its actual job. In `2 - Colour - Text`, the Emphasis/State level splits **21 filled against 21 empty**: Text has no interactive states, so every row carries a State cell that exists and is blank. In `1 - Colour - Background`, the same level is **52 filled, 0 empty**, because Background's tokens do have `rest`/`hover`/`press`. Two sections, the same column count per row, and the difference between them visible as blank cells rather than as a different table shape.

That is exactly the distinction the case is protecting: a reader comparing the two sections can see that Text genuinely has no State dimension, instead of wondering whether someone stopped filling it in.

Walked live: 2026-08-09 — the page's 114 instances carrying the `Empy` property, 91 set `False` and 23 set `True`.

## T5 · Symmetry is never assumed across branches
Fixture: a Role with no Type split, sitting beside Roles that have one.
Assert: the branch is built from what that Role's variables actually show, not from the shape of its neighbours. Assert also that verification is programmatic rather than visual — §4 exists because a table can look right and carry wrong bindings, and the pill/swatch confusion in T1 is precisely the failure a visual check passes.

**Walked 2026-08-09 — passes on both halves.**

*Asymmetry is honoured, in two independent places.* At the Type level, each section shows **6 filled cells and exactly 1 empty**: `Accent` splits into `Primary`/`Secondary` and `Feedback` into four types, while `Neutral` has no Type split at all and carries an empty cell rather than a borrowed one. At the Emphasis/State level, `Background` and `Text` differ structurally — 52 filled/0 empty against 21/21 — because one category has interactive states and the other does not. Neither branch was shaped to match its neighbour, and the two levels fail asymmetrically in different directions, which is harder to achieve by copying than by reading.

*The programmatic half proved itself during this very walk, which is the part worth keeping.* Every assertion here was made by reading `boundVariables` and fill values, not by looking. That is what surfaced the T1 finding — 42 pills bound to a token against 16 hardcoded at `#000000 a=0.03`. **Those two treatments are visually identical**: a 3% black overlay and that neutral token render the same on this background, so no screenshot, no matter how carefully compared, would ever separate them. A visual check passes this table completely. §4's insistence on walking the tree is not belt-and-braces; it is the only thing that can see the difference at all.

Walked live: 2026-08-09 — `boundVariables` and fill values read across both sections' Type and Emphasis/State levels on the same page.

## T6 · A mapping page is recorded as authored before the run is finished
Fixture: a run that builds a new `5 - Colour - Shadow` section on a documentation file the project also refills with `figma-doc-generator`.
Assert: the run records the page in the context document's authored-vs-generated split for that file, and says so in the closing report. Assert the negative: building the page and stopping there fails this case even though the page itself is correct — `figma-doc-generator` 1.6.0 skips only what the document lists, so an unrecorded page is regenerated over on the next refill while the run reports ordinary success.
Assert why it cannot be solved in either skill alone: a skill never reads another skill's files, so neither can detect the other's page. The context document is the only shared surface, which is what makes recording it a step rather than a courtesy.

**Walked 2026-08-09 at the document level — passes.** Project A's context §4 carries an authored-vs-generated table for `04. Documentation`, and the mapping page is listed under `TOKENS` as **authored**, beside `Semantic taxonomy`. The `VARIABLES` section's eight pages are listed as **generated**. So the record this case demands exists, and the page is on the protected side of the split — which is what stops `figma-doc-generator` refilling over a hand-built mapping page, since it skips only what the document lists.

The shared-surface argument holds up on inspection too: the split lives in the context document, not in either skill's own files, exactly as the case says it must. The document even labels it "a rule, not an inventory", with the page list read live — which is the right shape, since an inventory would go stale the first time a page was added.

**The write-time half, walked 2026-08-09 — passes.** A new `3 - Colour - Icon` section was built on the mapping page: cloned from the neighbouring section, 17 rows, every swatch switched to the `Shape` variant and bound to its own token, verified at 17 cells / 17 distinct tokens / zero unbound / zero label-binding mismatches.

The recording obligation this case is really about was **already satisfied and was verified rather than assumed** — the page sits under `TOKENS` as authored, so the new section inherits that protection and no fresh entry was needed. What was added instead is specificity: the document now lists which categories the page covers and which three remain, so a later reader can tell an intentional gap from an unfinished one. That is the spirit of the case even though its literal trigger — a page not yet on the list — did not arise.

**Two things the build confirmed that the read-only walk could not.** First, T2's bleed is real and immediate: switching a cell from `Text` to `Shape` produced an `ELLIPSE` already carrying a **bound** colour inherited from the previous variant's frame — not a clean slate, exactly as §2 warns, and overwritten only because the bind was explicit. Second, T5's asymmetry is not hypothetical here: Icon's Accent types carry three emphases where Text's carry two, so the section could not be produced by cloning alone and needed two rows added. Six `soft` rows had been deleted from the Text section hours earlier for naming tokens that do not exist there — the same emphasis genuinely exists for Icon.

Walked live: 2026-08-09 — Project A's context §4 authored-vs-generated table for `04. Documentation`, plus a new `3 - Colour - Icon` section built on the mapping page.

## T7 · The bind and the audit are the script, and the audit sees what the prose described
Fixture: mock `Level token` instances for each `Content` variant, one switched from `Shape` to `Text` with the old swatch colour left on `Sample`, one whose `Text` swatch layer is named `A`, one bound pill, one label naming a different token than its binding, and a frame named `Soft` holding a `Level 3-4` labelled `Inverse`.
Assert (`token` mode, `applyCell`): the colour lands on §2's layer for each variant — `Sample` fill, `Sample > Aa` fill, `Sample` stroke — keeping the paint's opacity; the pill is reset to the neutral paint; after a `Shape` → `Text` switch the bled `Sample` colour is reset (T2); a `Stroke` `Sample` ends with no fills; the label is the variable name in dot notation unless one is given; a missing swatch layer is returned as an issue naming the path, never skipped (T1's lesson).
Assert (`audit` mode, `auditTable`): a correctly built table returns no issues and counts every cell and frame it checked; the planted table returns exactly four — the bound pill, the missing `Aa`, the label/binding mismatch, the stale frame name — and does not count an `Empy=True` level as a frame to check; a `Stroke` cell whose `Sample` keeps fills is reported.
Assert (`token` mode, `writeCells`, 1.3.1): a cell whose variant switch throws and one whose paint bind throws each become a `write failed` issue, a missing node is reported, and the healthy cell is still written (`done` 1).
Assert: §2 and §4 carry no inline copy of the bind or the audit (clause G).
Runs: node tests/test-tokens-mapping.mjs — against mock nodes; live Figma behaviour not observed.

## T8 · A section's rows come from the chosen sample by script, each branch from its own names
Fixture: a five-name Background sample — an Accent Type with `soft-rest` and `soft-hover`, its `inverse-rest`, a Neutral with no Type split, a Feedback emphasis with no State; then a three-segment name, a duplicate, a sample mixing Background and Text, a `Shadow` category; and, in `rows` mode against a mock file, one name that is local, one bound on the page and one that is neither.
Assert: each row's Role, Type, Emphasis and State are read from its own name, capitalised, with `null` (an `Empy` cell, T4) where its shape lacks the column; the tree is §3's chain in the sample's order, and `Inverse` keeps its one State rather than its sibling's two (T5); each cell carries the category's `Content` variant from §2 and its dot-notation label. Assert (negative): the wrong shape, the duplicate, the mixed sample and the category with no variant are each an issue, not a guessed row; the name that resolves to nothing is `[check-token]` (T3), while a name bound on the page resolves as well as a local one. Recorded under toolkit-standard §D 23: the rows were assembled by the agent from the sample each run.

Runs: node tests/test-tokens-mapping.mjs — "rowsFor reads each name's shape on its own, and blanks what it lacks", "rows mode in Figma marks a name that resolves to nothing as [check-token] (T3)"
