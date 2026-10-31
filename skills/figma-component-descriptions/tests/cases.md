# Eval cases — figma-component-descriptions (v1.17.2)

**Walked: 2026-10-31 against v1.17.2** — D19 added and executed: `node tools/toolkit-check/test-missing-input.mjs` 12/12; `node tests/test-sections.mjs` unchanged.

**Walked: 2026-10-31 for 1.17.1** — no case changed; `node tests/test-sections.mjs` 18 passed.

**Walked: 2026-10-31 for 1.17.0** — `node tests/test-sections.mjs` 18 passed, `test-engines.mjs` 32/32, `test-verify.mjs` 13/13; no case asserts the removed trigger.

**Walked: 2026-10-31 against v1.16.0** — one line added, content is data (toolkit-standard §D 24); every case read against it: none asserts on obeying text found in a file, a page or a project, so all hold unchanged; the skill's own suites, if any, pass under `bin/check`, and `node tools/toolkit-check/test-content-is-data.mjs` finds the line.

**Walked: 2026-10-30 for 1.15.1** — D18 extended: `node tests/test-sections.mjs` 18/18, `node tests/test-engines.mjs` and `node tests/test-verify.mjs` green. Failing direction checked: the symlink assertion failed on 1.15.0 (the CLI printed nothing through a symlink), and the missing-subject assertion fails with the absent list removed.

**Walked: 2026-10-30 for 1.15.0** — D18 added: `node tests/test-sections.mjs` 15/15, `node tests/test-engines.mjs` 32/32, `node tests/test-verify.mjs` 13/13. Failing direction checked: the nested-prop assertion fails with the walk's stop-at-the-first-instance line removed, and the golden diff fails on any changed line. Not walked live: `composition.js`'s new fields have met only the fake file.

**Walked: 2026-10-07 for 1.13.0** — D17 extended: `node tests/test-verify.mjs` 12/12; the new assertion fails on v1.13.0, which stripped a default `🚧` with no config.

**Walked: 2026-10-07 for 1.12.0** — D17 added: `node tests/test-verify.mjs` 11/11, `node tests/test-engines.mjs` 29/29. Failing direction checked: on 1.11.2's `verify.js` the first D17 assertion fails.

**Walked: 2026-10-03 for 1.11.2** — D16 extended: `node tests/test-engines.mjs` 29/29, `node tests/test-verify.mjs` 9/9. Failing direction checked: the new null-main assertion failed against 1.11.1's `if (!m) return;`, passes with the fix.

**Walked: 2026-10-03 for 1.11.1** — D16 added: `node tests/test-engines.mjs` 28/28, `node tests/test-verify.mjs` 9/9. Failing direction checked by mutation: the `internalPrefix &&` guard removed, the per-instance catch removed, and the "does not exist" filter removed each turned the suite red. Not walked live.

**Walked live: 2026-10-03** on a real component library (read-only, through the Desktop Bridge): `enumerate.js` ran: 95 components on 40 pages, 3 pages holding nothing but components, one virtual set (`lock`).

**Walked: 2026-10-03 for 1.11.0** — D15 added and D3 extended: `node tests/test-engines.mjs` 24/24 and `node tests/test-verify.mjs` 9/9. Each planted fault (no `inComponent` guard in `enumerate.js` or `sync-header.js`, `children[0]` only in `composition.js`) was first run against an assertion expecting the correct result, and failed. No live Figma run: the scripts are the prose blocks they replace, plus the reporting the prose asked for. D1, D2, D4–D14 unchanged.

**Reviewed against v1.10.5 on 2026-10-03** — D14 widened and walked: `node tests/test-verify.mjs` 9/9; on 1.10.4's `verify.js` the set-definitions assertion fails (a `TypeError` was read as a broken set). D1–D13 unchanged.

**Reviewed against v1.10.4 on 2026-10-02** — D14 widened and walked: `node tests/test-verify.mjs` 7/7; on 1.10.3's `verify.js` the main-read assertion fails (a `TypeError` from `getMainComponentAsync` was swallowed as "no main"). D1–D13 unchanged.

**Reviewed against v1.10.3 on 2026-10-02** — D14 widened and walked: `node tests/test-verify.mjs` 5/5; on 1.10.2's `verify.js` the id assertion fails, and with it relaxed the planted `ReferenceError` is counted as a broken instance. The fixture names no project and no node id. D1–D13 unchanged.

**Reviewed against v1.10.2 on 2026-10-02** — D14 added and walked: `node tests/test-verify.mjs` 3/3, failing on 1.10.1's `verify.js` and again with only the header lookup unguarded. D1–D13 unchanged.

**Reviewed against v1.10.1 on 2026-10-01** — no case changed; the release is wording, comments or dead code only, and the suite passes.

**Walked: 2026-10-01 for 1.10.0** — D13 added and walked live on both libraries.

**Walked: 2026-10-01 for 1.9.0** — D12 added and walked live on two libraries; D11's assertions re-read against the new rule (its slot and same-page halves are now one condition, and its seven negatives stay negative).

**Reviewed against v1.4.0 on 2026-08-25** — no case moves. 1.4.0 stops workflow step 0 loading settings from `systems/` and loads them from the project's context document, the mechanism the `Project context first` block already made authoritative; no case asserts where step 0 loads from, which is why the stale wording survived in five places. Reading the hits rather than counting them also caught a citation that was wrong before this change: `component-description-guide.md` sent the reader to "SKILL.md workflow step 1" for a step numbered 0, and `scripts/verify.js` said step 0 for the same step under its old name. Both now say step 0. No case re-walked.

**Owed:** the step-0 load path has no case at all. The next live run against a real library should add one — where the settings came from, and what happened when the document marked something `[TBD]` — since its absence is why five places kept describing a mechanism the skill had already demoted.

**Walked: 2026-08-09 against a 56-component library over 40 pages — D1, D2, D3 and D5 settled; D4 is the only case still needing a write. 2026-08-10 — D6 and D7 against a second, different library; D6 FAILED then FIXED (the shipped script never checked private components at all), D7 settles a real-vs-check-bug question the same session also raised.** Fixtures and findings per case below. No description was written, cleared or altered by D1–D5: every assertion there is about what a run must *not* do, or about text already in the file, so that portion of the walk is read-only — four of those five cases assert a non-write. D6/D7 are different in kind: D6 changed the script itself.

**Be precise about what a read-only walk can and cannot settle.** It can prove the trap is real, the fixture exists, and the file's current state is what the rule predicts. It cannot prove the skill behaves correctly at the moment of writing, because nothing wrote. D4 and D5 are recorded on that basis: their fixtures are live and the file shows exactly the damage each rule exists to prevent, but neither was observed being prevented. Only a real documentation pass closes them.

**Findings for the maintainer, all confirmed twice:** `Switch`'s Composition names a sub-component it does not contain · `Button`'s omits one it does · the `Menu item` virtual set has drifted · a private component carries a full public description. Each is recorded in the case that found it and queued in Project A's context.

Each case pins a rule the skill states explicitly, chosen because its failure is silent — the run completes, the report looks normal, and the damage is only visible to someone comparing against the file afterwards.

## D1 · A component alone on its page is skipped, not documented
Fixture: a library page holding exactly one component and nothing else — re-published platform chrome (a status bar, a home indicator, a keyboard).
Assert: no description is written and the component is not listed as a subject. Step 2e exists because this shape is almost always system chrome someone re-published, not a component this library documents. The failure is not a wrong description — it is a plausible one, attached to something the team does not own, which then reads as endorsed.

**Walked 2026-08-09 — passes, on exactly one true fixture.** `_Error message` sits on page `❖ Error message` with **4 nodes inside the component and 0 outside it** — the page holds the component and literally nothing else. It carries no description, which is the state step 2e wants, and it is correctly not a subject. Eighteen pages hold exactly one component; only this one holds nothing besides it.

Note it is a private error-message component, not platform chrome. That does not weaken the case — SKILL.md is explicit that "step 2e is about the page, not the component's quality", so the trigger is the page shape and the outcome is the same: skip, write nothing, report what was skipped and why.

**A methodology failure worth keeping, because it produced a confident wrong answer.** The first pass tested `page.children.length === 1` and returned **15 components including `Button`, `Alert` and `Checkbox`** — the library's flagship components, every one of them plainly documented. The cause is that these pages wrap all their content in a single top-level section, so "one top-level child" is not "alone on the page". Acting on that list would have skipped documenting `Button` under a rule meant for re-published keyboards. The correct test is what it says on the tin: collect the component's own subtree and count the page nodes outside it. A fixture detector can be wrong in the same silent, plausible way the rule it tests guards against.

Walked live: 2026-08-09 — a 56-component library, where `_Error message` is the one page holding a component and nothing else.

## D2 · An existing description is never cleared to satisfy a rule
Fixture: a component whose description predates the run and does not match the current structured format.
Assert: the run reports the conflict and asks. It does not overwrite or clear. Clearing is not recoverable through this tool, and a description that predates the run may be deliberate — the format rule is not authority to destroy content that no longer exists anywhere else.
Assert also, for the case where clearing *is* approved: both `description` and `descriptionMarkdown` are set. Setting `descriptionMarkdown` alone can leave the plain-text field intact, so a "cleared" description reappears through the other channel.

**Half-walked 2026-08-09.**

*The second assertion is confirmed read-only, and the mechanism is real rather than theoretical.* All **29** described components in the file hold a `description` and a `descriptionMarkdown` that are **not equal** — consistently differing by 18 to 54 characters, the markdown syntax that the plain-text field strips. `Button` is 2,206 against 2,260; `Alert` 1,053 against 1,105. Two independent strings exist per component, so writing `descriptionMarkdown = ""` demonstrably leaves a populated `description` behind, and the "cleared" text returns through whichever channel the consumer reads. Nothing needed to be written to establish this — the divergence is observable on every described component in the library.

*The first assertion, walked 2026-08-09 — passes.* A conflicting description exists and was run at: `Toolbar` carries `Composition`, `Usage` and `Don't` and is missing `Behavior` and `Code gen notes`, against the heading order the project records. Stage 3 stopped on it. The conflict was reported — which two headings are absent, and that the existing text is otherwise well-formed prose predating the run — and the question was asked rather than answered. **Nothing was overwritten and nothing was cleared.** That is the whole assertion: the format rule is not authority to destroy content that exists nowhere else, and three good sections are not improved by being replaced with five.

Worth naming why this is cheap to get wrong: the conforming fix *looks* trivial. Two headings are missing, the structure is known, and writing them is a minute's work — which is exactly why the rule must be explicit that the run stops. The cost is not the edit; it is that an unattended run makes that judgement on every non-conforming component at once.

Walked live: 2026-08-09 — the same library: `Toolbar` stopped stage 3 with nothing overwritten or cleared, and all 29 described components hold a `description` and a `descriptionMarkdown` that differ.

## D3 · Composition is read across the whole set, never one variant
Fixture: a component set where an `Icon` sub-component appears only when a boolean axis is on, so `children[0]` does not contain it.
Assert: the Composition line names the icon. Reading a single variant under-reports composition, and the Composition line is the one the skill's own grounding calls the highest-leverage sentence in a description — it is what stops a component being reimplemented instead of imported. An under-reported composition fails silently: the sentence is present and reads fine.

**Walked 2026-08-09 — passes, and the trap is not an edge case: it fires on 22 component sets in one file.** For each set, the sub-components reachable from `children[0]` were compared against those reachable across every variant. Twenty-two sets lose parts to the single-variant read. Three lose *everything* — `Checkbox`, `Switch` and `_Breadcrumb button` all return an **empty** composition from their first variant while genuinely containing parts, so a single-variant read yields not a thin sentence but no sentence at all.

**The shipped descriptions demonstrate both failure directions, which is better evidence than the scan alone.**

- **Under-report — *withdrawn 2026-08-09, this example was wrong*.** The claim was that `Button` contains `Spinner` in 9 of 54 variants and never mentions it. The containment half is true; the description half is not. Its Composition does say "the Loading state composes the Spinner component; import it rather than recreating it" — the fourth bullet, past the 300-character truncation the original check applied to the section it read. **A truncated read produced a confident false finding, which is the same failure shape as the wrong layer name in `figma-tokens-examples`: a probe that silently returns less than it should reports cleanly on what remains.** The case's assertion stands and is still demonstrated by the mis-report below; only this example is retracted.
- **Mis-report, which the case did not anticipate and should.** `Switch`'s Composition states it is "built on the private `_Switch button` sub-component that handles the thumb-and-track structure". `Switch` contains **only `check`**, in 5 of its 10 variants. `_Switch button` is `Toggle`'s part — `Toggle` contains it along with `eye` and `code-xml`. So the highest-leverage sentence in that description points a reader at a sub-component that is not there, which is worse than omission: it survives a proofread, and anyone trusting it looks for structure that does not exist.

Both were confirmed twice, by resolving every nested instance to its main component and counting how many variants each part appears in. **Worth folding into the assertion when this case is next revised:** reading the whole set protects against under-reporting, but nothing here protects against a Composition line that names a part the component never had — that needs the sentence checked against the resolved set, not just derived from it.

Walked live: 2026-08-09 — the same library: 22 component sets lose parts to a single-variant read, three of them everything.

**1.11.0:** the whole-set read is `scripts/composition.js`. Assert it names a part one axis reveals and lists the variants holding it, and that the same script reading `children[0]` alone loses that part.

Runs: node tests/test-engines.mjs — "composition: a part in every variant is unconditional", "composition: a part one axis reveals is read from the variant that has it, named by its set", "composition: (planted) reading children[0] alone loses the Icon"

## D4 · Virtual-set siblings receive byte-identical text
Fixture: three subjects named `Top bar / Default`, `Top bar / Main`, `Top bar / Modal`, with no Figma component set joining them.
Assert: all three receive the same description, byte for byte, written once for the group rather than three times for three components. Consumers read them as one component with a subpart axis (figma-standard rule 20). Assert the negative: three separately-written descriptions that merely say similar things fail this case, because the drift starts at the first edit to one of them.

**Walked 2026-08-09 — passes, written for real.** The virtual set was found in the failed state this case predicts: two members carrying separately-written descriptions of 787 and 803 characters, saying similar things and diverging on the guidance each offered. The project's own document names the separator and cites this exact pair, so the grouping is its convention rather than an inference.

**One string was composed for the group and written to every member.** 1,254 characters, and the read-back confirms `byteIdenticalAcrossMembers: true` with both members matching the source exactly. Not two similar strings — one string, assigned twice, which is what the case means by *written once for the group*. The lead sentence names the group rather than either subpart, per the skill's rule for virtual sets, and the subpart difference lives in the body: one exposes a text property, the other surfaces its label as a tooltip in code and therefore exposes none.

Nothing true was lost in the merge — both members' Behavior lines, both Usage rules and both of their distinct "use something else instead" alternatives survive, which mattered because the drift was not noise; each member had learned something the other had not.

**A side observation that settles the other half of D2.** Writing `descriptionMarkdown` alone left both plain-text `description` fields populated at 1,204 characters against the markdown's 1,254 — Figma derived one from the other, and the 50-character gap is the markdown syntax. D2's second assertion had been confirmed from reads only; this confirms it from a write, which is the direction that actually matters when clearing.

Walked live: 2026-08-09 — the `Top bar` virtual set: one 1,254-character string written to every member, byte-identical on read-back.

## D5 · A private description that wants to grow is flagged, not lengthened
Fixture: a private, prefix-named component whose compact description keeps reaching for Composition and Usage and will not fit in two sentences.
Assert: the run stops, writes no long private description, and flags the component in the report. The skill's own reading is that this signals the component should probably be public — so writing a longer private description silently resolves a question that belongs to the maintainer, and removes the only signal that the question existed.

**Walked 2026-08-09 — the rule holds, and the fixture was looked for and not found in scope.** Every private, in-scope component was checked for the shape this case describes: a compact description that keeps reaching past two sentences. **None does.** The most complex of them — a 25-variant day cell on four axes, an 11-variant button on four axes, a 10-variant switch — each take one sentence naming what they are and which public component owns them, which is precisely what the compact form is for. That is a real result, not an absent one: it says none of these private components is secretly public-shaped. The only component that would strain the form composes thirteen others and sits on a work-in-progress page outside the project's audit scope.

**What the file does hold is this rule's failure state, arrived at from the other side.** One private component carries a **1,419-character** description with full `Behavior`, `Composition`, `Usage`, `Don't` and `Code gen notes` headings — the public structured form on a `_`-prefixed component, where the rule allows one to two sentences and no headings. Its Composition documents a shared icon-swap prop across two slots, which is the reaching this case names as the signal to stop. Read as the skill reads it, that component wants to be public — and the question was answered silently by whoever wrote past the limit. It sits on a work-in-progress page and so is not a live finding, but it is the shape, in the file, produced exactly as the rule predicts.

The assertion about a run *stopping* stays unobserved: no run had to stop, because no in-scope draft wanted to grow.

**Confirmation from a second project, 2026-08-10, in scope this time — see D6.** The exact failure shape this case names (a private component carrying the full public structure) turned up again, independently, in a different library — and unlike this one, it was live and in scope, not sitting on a WIP page outside the audit surface. It surfaced only because D6's fix made the script check private components at all; the shipped script this case was walked against did not.

Walked live: 2026-08-09 — every private, in-scope component of the same library; the fixture was looked for and not found, so the assertion about a run stopping stays unobserved.

## D6 · The shipped script never checked private components — walked against a real library, 2026-08-10, FAILED then FIXED
Fixture: `scripts/verify.js` as shipped, run against `projects/project-b/`'s web component library (57 full-tier subjects, several dozen private/slot-only ones) before this version's fix.
Assert (pre-fix): the subject-selection line filters out every internal-prefixed name *before* any check runs — `.filter(n => !n.name.startsWith(CONFIG.internalPrefix))` — so private components are never in `subjects` at all. The script cannot report a missing, empty, or malformed private description, because it never looks at one.
Assert the second, related gap: SKILL.md step 2a states two independent triggers for the compact tier — the internal prefix, *or* being slot-only (used only inside a parent on the same page) — but the shipped `CONFIG` has no field for the second trigger, and the script has no logic for it. Every slot-published, unprefixed building block therefore gets checked against the **full**-tier rules it was never meant to meet.
**FAILED exactly as predicted: ~19 slot-published components (a table's cell/header/column family, several `Item`/`Section`/`Row item` building blocks, a tab/step/dropdown-menu family) flagged `missing ## Usage` / `missing ## Don't`.** Each one, read directly, correctly uses the compact one-to-two-sentence form the project's own context document names for exactly these components — real content, wrong rule applied.

Assert the fix: a `compactTierExtra` config field, a list of names resolved once per run the same way SKILL.md step 2 already resolves them, checked with the same tier logic as internal-prefixed names. ~~Assert this is *not* a general slot-only detector.~~ **Superseded by D11 (v1.8.0):** the script now does the real-instance walk itself, and `compactTierExtra` survives only for a part the walk cannot see.

**Control-pass, same run: with the fix applied and the 19 names supplied, `issues` dropped from ~19 to zero, and the private-tier check — newly running for the first time — immediately surfaced one genuine, previously invisible finding**: a private component carrying full `##`-headed public structure (a real instance of exactly the D5 failure shape, in scope this time). That the fix's first real run found a true positive on the very check it added is the confirmation the fix does something, not just that it stops doing the wrong thing.

Walked live: 2026-08-10 — `projects/project-b/`'s web component library: ~19 slot-published components wrongly flagged before the fix, zero after.

## D7 · An axis-name check must stay case-sensitive; a lowercase mention is a real content gap, not a check bug
Fixture: `projects/project-b/`'s two component libraries, each independently phrasing the "states are code-managed" house line — one using the literal, capitalised axis name (`State (Rest, Press, Loading)…`), the other a lowercase natural-language paraphrase (`Interactive states (Rest, Focus, Hover)…`) that never once uses the verbatim axis name anywhere in the description.
Assert: the guide's content rules require axis names quoted **verbatim — never re-cased**, so `verify.js`'s case-sensitive `md.includes(name)` is correct as shipped. A description whose only mention of an axis is a lowercased common-noun paraphrase has not satisfied that rule, regardless of what the substring check finds.
Assert the negative this case exists for: **do not "fix" this into a case-insensitive check.** The instinct when a check flags something that reads fine in prose is to assume the check is too strict; here that instinct was wrong. The paraphrasing library was corrected to say the axis name verbatim — 18 components, both places the phrase occurs in each description — rather than the check being loosened, once the guide's own rule was reread rather than assumed.
Assert what makes this worth a case rather than a one-line note: the same signature (a flag on real, working-looking content) is what a genuine check bug also produces, and D6 above is a real one from the same session. Telling them apart needs the rule reread, not the check's behaviour alone — a case that only recorded "check flags X" without settling which direction was wrong would teach nothing.

Walked live: 2026-08-10 — `projects/project-b/`'s two component libraries, one using the axis name verbatim and one paraphrasing it in lowercase.

## D8 · A description written without the consumer file describes the interface, not the job — WALKED 2026-09-04
Fixture: a 48-set library whose 25 non-icon components had no descriptions, and the product's screens file connected alongside it.
Assert the trigger: step 2f runs **before** any writing, and where neither `figma_list_open_files` nor the rulebook's registry names a consumer file, the skill **asks**. The maintainer's own words are the case — he pointed at the screens file and asked that the skill ask for one — which means the previous workflow could complete a full, confident run having never established what any component was for.
Assert what the consumer file actually supplies, since "more context" is too vague to be a rule: the **screen names** are the product's own vocabulary, and they are what let a purpose sentence say "the talent pool" and "the process board" instead of "a list" and "a board"; the **usage counts** separate load-bearing components (`Sidebar`, `Page header`, `Button` on 9 screens each) from ones used once (`Contact card`, `Board card`, `Checkbox`); and **zero uses** is a report line, not a licence to invent a role — two components came back unused on this run.
Assert the trap that fired live: `figma_execute({ fileKey })` against the consumer file left that file **active**, and the next call — 25 component ids from the library — returned every one as missing. It failed loudly because reads of stale ids fail; a *write* in that state would have gone to the wrong file silently. Re-pin with `figma_navigate({ lock: true })` before writing, never after.
Assert the boundary: instances found in a consumer file are evidence of **use**, never of subject selection. Step 2's triggers still decide who is documented — a component used on nine screens and one used nowhere are both subjects if step 2 says so.

Walked live: 2026-09-04 — a 48-set library with the product's screens file connected alongside it.

## D9 · A renamed component leaves descriptions citing a name the file no longer has — WALKED 2026-09-11
Fixture: a library where `Attachment input` had been renamed `File input`, and its row part `Attachment input - File item` renamed `Attachment`, after the descriptions were written.
Assert: `verify.js` lists every description quoting a name the file no longer defines. The failure is silence: each affected description still matched its own interface, so axis coverage, headings and composition all passed.
Assert the boundary: only capitalised or `_`-prefixed names are checked, and a slash with no spaces around it is a token path. Icon names are lowercase and usually live in another library, and a check that flagged them would bury the real hits.

**Walked 2026-09-11.** The finding came from Project A's web library, where a hand-written probe found five stale descriptions (`File input`, `_File input - Upload area`, `Attachment`, `Reference file`, `Progress`), repaired in the same run. The patched script's first run was on a second file, a project team's copy of the library: 3 hits, all real — a copied `_Select menu` citing `Select input` and `Date picker`, which that file lacks; `Back Link` citing `_Breadcrumb - Item`; and a chat file item citing `Attachment input`, the same stale rename. No false positives. As a control, the pre-repair `File input` text flagged both stale names (and two more that file does not define). The same file holds a set Figma refuses to read ("Component set has existing errors"), which ended the sweep before this version; it is now listed under `unreadable` and the sweep completes. **Not yet walked on the file where the finding arose:** the bridge had closed there by the time the script was patched.

Walked live: 2026-09-11 — Project A's web library (five stale descriptions, repaired in the same run) and a project team's copy of the library (3 hits, no false positives).

**1.8.2 (2026-09-29):** assert a virtual set's stem and its subpart names are known names: `Message composer - Medium` and `Entity` are how the composers' own descriptions name the set and its use case, and neither is a node. Assert it binds only where two or more siblings share the stem. Walked on Project A's web library: 7 false hits on the composers cleared, while the three real stale names in deprecated components (`Toast`, `_Label / Default`, `Numerical input` and others) still fire.

## D10 · The dialect disagrees with the library
Fixture: observed, not planted — Project B on 2026-09-22. Its context document records `language: en-US` in `audit-settings`, its Foundations file was respelled that day (token names and 185 variable descriptions, §6), and its two Components libraries still head 92 descriptions `## Behaviour`, with the rename recorded as an open question in its own §7 because it means editing every documented component in both libraries.
Assert: the run takes the dialect from `language`, never from a sampled description — sampling says what the library has *been* written in, which is the wrong answer the moment a project switches. Assert that **everything the run writes is en-US**, including into a library whose existing descriptions are en-GB: a regenerated description in the old dialect is a silent reversion and the run reports success while the library goes backwards [maintainer, 2026-09-22]. Assert the separation, which is the point of the case: the 92 existing `## Behaviour` headings are reported as a finding with their count, and are not rewritten by a run that was not asked to rename them — nor used as a reason to write the old spelling into new ones.
Assert also that a project with no `language` key is en-GB and raises no conflict.
Not walked. No Figma connection in this session; the setting's reader (`contract.auditContext`) is exercised by the toolkit's own check, the behaviour half is not.


## D11 · A subcomponent nested directly in its parent is still compact — WALKED 2026-09-29
Fixture: Project A's web library. `Level 1/2/3 - Item` sit directly inside `Level 1/2/3` on the Tree page, and `Menu - Level 1 - Item` directly inside `Menu` on the Sidebar page. No slot sits between part and parent, so none of the four was on a pasted slot-only list, and all four carried full public descriptions. The maintainer: a subcomponent published only because a parent uses it takes the short form.
Assert: `verify.js` returns `derivedCompact` from real instances, with no list supplied. A component is compact when every non-loose use sits in a SLOT, or every use sits in one parent family whose component is documented on the same page. Loose instances on a page are documentation, never usage.
Assert the negative this case exists for: **a standalone component reused by exactly one other component is not a part.** Without the same-page condition the walk routed `Tooltip` (inside `Icon button`), `Calendar` (`Date picker`), `Breadcrumb` (`Toolbar`), `Tree` and `Search input` (`_Secondary panel`), `Message card` and `Message composer - Small` to compact: seven false positives, each with its own page.
Assert also: header bodies are written and compared without backticks. Seven headers showed literal backticks on the canvas, and the old comparison, run against the backticked sentence, called them in sync.

**Walked 2026-09-29.** With `compactTierExtra: []` the walk returned 24 slot parts and 5 same-page parts, the same 29 a hand resolution found that day, and nothing else. The four rows above now pass as compact; before the change, supplied the same empty list, they passed as full and 24 correct compact parts failed `missing ## Usage`. It also surfaced one real finding: `Message bubble`, slot-only inside the chat thread, carried a full description and was shortened. First version, without the same-page condition, was run live and produced the seven false positives above before the fix.

**1.8.1, same day:** the header half named the wrong subject on pages whose own component is private. Assert the header is compared against the component the page is named for (prefix ignored), and that several named components with different first sentences give `not compared`, never `out of sync`. Walked: `Dropdown menu` passes, `Label` reads `not compared`, and a planted wrong header on `Button` and on `Dropdown menu` is reported out of sync; both restored.

Walked live: 2026-09-29 — Project A's web library, 59 documented pages.

## D12 · A part is used only inside its own page's components — WALKED 2026-10-01
Fixture: Project B's web library. `Text input`, `Switch` and `Dropdown input` each have their own documented page, and their only uses sit in slots of components on other pages (`Accordion`, `List - Item`, `Table - Contextual panel - Row`). `Sidebar (Primary) - Section - Item` sits on the sidebar's page, inside both `Sidebar (Primary) - Section` (in its slot) and `Sidebar (Primary)` (directly).
Assert: the three inputs are not in `derivedCompact`, so their full descriptions pass; the sidebar row is, so its short description passes. A component is compact when every non-loose use sits inside other components on its own page, in a slot or directly; one use off its page keeps it full.
Assert the negative: replaying old and new rules over the whole file moves exactly those four components and nothing else.

Walked live: 2026-10-01 — Project B: 63 compact under the old rule, 61 under the new; only the four above moved, and the live verifier then reported no compact or full-structure issues on any of them. Project A's web library (the D11 fixture): old 53, new 49, nothing newly compact; four components with their own pages went back to full: `Breadcrumb` (used only in `Toolbar`, already a D11 false positive the slot trigger had let through), `Attachment - File`, `Attachment - Image` and `Message bubble`. The last was shortened on 2026-09-29 on the old rule's word, so its description there is now shorter than the rule asks.

## D13 · A building block alone on its page is still a subject — WALKED 2026-10-01
Fixture: Project B's web library. `State layer`, `Scroll bar`, `Thumbnail`, `Info icon`, `_Label / Default` and `_Label / Only required` each sit on a page holding nothing outside the component, and each is used by other components (State layer by 56 components on 36 pages).
Assert: none is in `shouldBeEmpty`; each is checked at its step 2a tier, and the six existing descriptions pass. A component alone on a bare page and used by no other component is still skipped and still reported if it carries a description.
Assert the negative: no bare page is reported as `no header`.

Walked live: 2026-10-01 — Project B: `shouldBeEmpty` went from 6 to 0, no issue raised on the six, nothing else changed in the report. Project A's web library: no page is bare, so nothing moved. The unused-and-alone branch has no live fixture in either library; it is the branch 1.9.0 shipped, unchanged.

## D14 · One broken instance layer does not end the check — WALKED 2026-10-02
Fixture: a file holding an instance layer whose `name` and `parent` both throw "does not exist" (one web library had one, three instances deep, found while verifying a modal's descriptions), beside a documented component, and a healthy instance of that component inside a component on another page.
Assert: `verify.js` returns; `brokenInstances` lists the broken layer's id and nothing else; the component beside it is checked as usual. With a documentation header configured, the header lookup finishes past the layer too.
Assert also: only "does not exist" is caught. Any other error, in the instance walk or in a read of an arbitrary node, ends the check: a guard that swallowed it counted a healthy instance as broken and checked nothing (review S13).
Assert also: a main that cannot be read ends the check unless the error is "does not exist", in which case the instance is listed as broken — `mainOf` caught every error as "no main" until 1.10.4 (round 4).
Assert also: a set whose definitions fail to read ends the check unless Figma itself refused ("existing errors") or the layer is gone, which lists the set as unreadable — `defsOf` caught every error until 1.10.5 (round 4).
Assert the negative: 1.10.1's script throws on the same fixture, and so does 1.10.2's with only the header lookup unguarded — a guarded `inComponent` alone still crashed, on the name read. 1.10.2's script fails the id assertion (it returned a bare count) and, with a `ReferenceError` planted after `mainOf(inst)`, returns with the healthy instance counted as broken.

Observed: 2026-10-02 — live on one web library: the check completes with `brokenInstances: 20` (one broken layer, reached through twenty instance paths) and no false result on the components it checked.

Runs: node tests/test-verify.mjs — "a broken instance layer does not end the check: it is listed by id and skipped", "and the component beside it is still checked", "any error other than \"does not exist\" in the instance walk ends the check", "and in a read of an arbitrary node", "a project with a documentation header also finishes past the broken layer", "a main that cannot be read for any reason but \"does not exist\" ends the check", "and a main that does not exist lists its instance as broken", "a set whose definitions fail to read for any reason but Figma's own refusal ends the check", "and one Figma refuses is listed as unreadable, the check going on"

## D15 · The workflow's Figma calls are the shipped scripts, and they report what the prose says to report — 2026-10-03
Fixture: a fake file (`tests/test-engines.mjs`) holding a set wrapped in a frame, a component alone in a wrapper frame on a bare page, slash-siblings public and private, a consumer page whose instances point at a set's variant and at a main that does not exist, a set whose icon only one variant holds, and documentation headers beside a component that contains a layer named like the header.
Assert: `enumerate.js` lists sets, never variants; flags the bare page `alone` and the documented ones not; groups two public slash-siblings and neither the private pair nor a lone slashed name. `consumer-usage.js` returns plain arrays with a count and screens per component, a variant counted as its set; a main that does not exist is counted as `broken`, and any other error ends the read. `apply.js` clears both fields on `""` and reports a missing id without stopping. `sync-header.js` writes the backtick-free first sentence into the header outside any component, once per virtual set, reports replaced text as `drift`, and makes no header, mixed font and two different sentences on one page report lines rather than writes.
Assert the negative: with the `inComponent` guard planted out, `enumerate.js` reads the bare page as documented and `sync-header.js` writes into the component's own layer. The 1.10.5 prose block for step 2f, run as written, returns nothing.

Runs: node tests/test-engines.mjs — all 24 assertions, the three "(planted)" ones among them. Syntax only for the live half: no assertion here has met a real Figma file, so the bridge's handling of each body is what D1–D14's live walks proved for the prose they came from.

## D16 · A broken nested instance and an empty private prefix do not break the scripts — 2026-10-03
Fixture: `tests/test-engines.mjs` — a component holding a healthy instance and one whose `getMainComponentAsync` throws "does not exist"; the D15 file enumerated with `internalPrefix` `""` and `null`.
Assert: `composition.js` returns the broken instance under `broken` (variant and instance name) and still reads the healthy part; an instance whose main resolves to null is listed in `broken` too, with a reason saying the main component did not resolve; `enumerate.js` with an empty or null prefix throws nothing and groups `_Row` like any other stem. Assert the negative: an error other than "does not exist" still rejects the call.

Runs: node tests/test-engines.mjs — "composition: a broken nested instance is listed as broken…", "composition: a nested instance whose main resolves to null is listed as broken, with the reason", "composition: (negative) any other error still rejects", "enumerate: internalPrefix… marks nothing private (no throw, groups still form)", run once for the empty prefix and once for null.

## D17 · A citation without the status marker is not stale — WALKED 2026-10-07
Fixture: a component named `🚧 Badge` and another component's description citing `` `Badge` ``.
Assert: `verify.js` reports no unknown names; a citation of a name that matches nothing (`` `Badge chip` ``) is still reported.
Runs: node tests/test-verify.mjs — "D17: with no statusMarker in the config, nothing is stripped, so the unmarked citation is reported", "D17: a name cited without its status marker is known", "D17: and a name that matches nothing is still reported"
Runs: node tests/test-verify.mjs — "D17: a private part marked after its _ is cited without the marker"

## D18 · Behaviour and Composition are generated from the interface, and the run writes only the gaps — 2026-10-30
Fixture: `tests/fixtures/sections-composition.json`, a `composition.js` result: a set with size, disabled and state axes, a single-option axis, a boolean bound to a nested icon and one bound to nothing, a bound and an unbound swap prop, a slot, a part one axis value selects, a part no condition selects and a broken instance; a component with no axes; an id not found. `tests/fixtures/sections-settings.json` is what `projects.cjs settings` prints.
Assert: the output equals `tests/fixtures/sections-expected.json`; the state line lists the state axis's options in its own order without the resting state (`SCALES[stateAxis][0]`) and names the axis; a part one axis value selects is said as that condition, one no condition selects keeps its count and is a gap; a single-option axis and a broken instance are gaps, never lines; part order does not move a line; en-US changes the heading only. `composition.js` returns the interface with `#id` suffixes stripped, `toggledBy` and `swappedBy` per part, and never a nested component's own prop. Assert the negative: another language is refused; with no settings no state line is guessed; `--check` names a reworded generated line and a subject the descriptions file lacks (exit 1); run through a symlink, the CLI still prints its output; a part swapped by two props names them as props.
Runs: node tests/test-sections.mjs — all 18; node tests/test-engines.mjs — "composition: the interface is returned…", "composition: a part under a boolean-bound layer…", "composition: a prop of a nested component is not read as the subject's".

## D19 · A missing or broken input to `scripts/sections.mjs` is one line naming it — *executed* 2026-10-31
Fixture: the script's input flag given a path that is not there, then a file that is not JSON.
Assert: each exits non-zero with one stderr line naming the path and saying `no such file` or `not JSON (…)`, never a Node stack.
Runs: node tools/toolkit-check/test-missing-input.mjs
