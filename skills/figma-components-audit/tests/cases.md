# Eval cases — figma-components-audit (v2.34.0)

**Walked: 2026-10-31 against v2.34.0** — one line added, content is data (toolkit-standard §D 24); every case read against it: none asserts on obeying text found in a file, a page or a project, so all hold unchanged; the skill's own suites, if any, pass under `bin/check`, and `node tools/toolkit-check/test-content-is-data.mjs` finds the line.

**Walked: 2026-10-30 for 2.33.0** — A128 added: `node tools/figma-audit/test-fix-queue.mjs` 16/16. Failing direction checked: with the pipe replacement removed from `text()`, six assertions fail. Not walked against a real project's record.

**Reviewed against v2.32.0 on 2026-10-26** — A127 added for the preference tier; A125's assertion follows its renamed test; every case walked with the suite, 79 of 79.

**Reviewed against v2.28.0 on 2026-10-18** — A122 added for the `states|token|` check (figma-standard rule 48) and run green with the suite, 67 of 67; no other case reads the new check.

**Reviewed against v2.27.5 on 2026-10-14** — no case changed: tool paths follow the move of the toolkit's own checks to tools/toolkit-check and of the project registry to tools/snapshot/projects.cjs; no rule or behaviour changed.

**Reviewed against v2.27.4 on 2026-10-14** — no case changed: the toolkit's tools are renamed (snapshot, component-contract, docs-site, css-lint, ui-check, project-check, claude-hooks, skill-evals); paths in prose and code only, behaviour unchanged.

**Reviewed against v2.27.3 on 2026-10-14** — no case changed: the dashboard service is `tools/figma-audit` (was `tools/figma-dashboard`); paths in prose and comments only, behaviour unchanged.

**Reviewed against v2.27.2 on 2026-10-14** — no case's assertion changed: the dashboard command's path, and project names in walk records replaced by stand-ins ("Project A") per toolkit-standard §D 6.

**Walked: 2026-10-13 for 2.27.1** — text only: the overlay check cites the project rule; suites unchanged, 66 of 66.

**Walked: 2026-10-13 for 2.27.0** — A120 and A121 added: `node tests/test-audit.mjs` 66 of 66, `node tests/test-probes.mjs` 51 of 51; A121 fails on 2.26.0, which has no overlay check.

**Walked: 2026-10-11 for 2.25.0** — A119 added; every text assertion moved to the new wording and every sentence filter to a key filter (a filter on wording passed vacuously once the wording changed): `node tests/test-audit.mjs` 62 of 62, `node tests/test-probes.mjs` 51 of 51. On 2.24.2's scanner the advice assertion and 24 wording assertions fail. Every run of the suite logged (set, sev, rule, key) and the measures before and after: identical, so no stored row is re-keyed and coverage did not move.

**Walked: 2026-10-11 for 2.24.2** — link-only fix in SKILL.md's template; no case reads it, cases unaffected, not re-run.

**Walked: 2026-10-07 for 2.17.0** — A104 added: `node tests/test-audit.mjs` 37 of 37; on 2.16.0's scanner A104's first assertion fails (no gap check).

**Walked: 2026-10-07 for 2.16.0** — A103 added: `node tests/test-audit.mjs` 35 of 35, `node tests/test-probes.mjs` 50 of 50; on v2.16.0's scanner the renamed-state-axis, boolean-order and property-naming assertions fail.

**Walked: 2026-10-07 for 2.15.0** — A102 added: `node tests/test-audit.mjs` 28 of 28; on 2.14.0's scanner both A102 assertions fail (no size check existed).

**Walked: 2026-10-06 for 2.14.0** — CN1 executed: `node tools/component-contract/test-analyze.mjs` 6/6; filed into five libraries' queues by the docs service, the withdrawn defaults check's rows closed by the next full run.

**Walked: 2026-10-03 for 2.13.2** — A101 extended and runs: `node tests/test-probes.mjs` 46/46, `node tests/test-audit.mjs` 26/26. The new `discover` assertion failed against 2.13.1 (`k-stray` allowed); with the fix in, removing the `remote` skip alone also turned it red. Not walked live.

**Walked: 2026-10-03 for 2.13.1** — A101 added and runs: `node tests/test-probes.mjs` 44/44, `node tests/test-audit.mjs` 26/26. Each fix and each new assertion checked in the failing direction by mutating `probes.js` (local keys dropped from `allowedKeys`, the orphan retry removed, `hasDisabledAxis` forced true, the length-12 placeholder test removed, `disabledPaints` entering instances): every mutation turned the suite red; and the keyless fixture of 2.13.0 fails the new off-library control. Not walked live.

**Walked live: 2026-10-03** on a real component library (read-only, through the Desktop Bridge): `probes.js` pasted comment-stripped with no expectation: the live hash read 739ca811, equal to node's, and nothing was cached. locate, discover, nameSpaces, detachedScan, sweepSchema and the per-set probes ran in 135 ms with plausible candidates. The fix recipes write and are still to meet a scratch file.

**Walked: 2026-10-03 for 2.13.0** — A100 added and runs: `node tests/test-audit.mjs` 24/24, five mutations of the new rules each failing it; a control run over the real eight-set slice with `textRole` and `allowedKeys` set raised only the three known rows; `test-probes.mjs` 40/40. Not walked live.

**Walked: 2026-10-03 for 2.12.0** — A99 added and runs: `node tests/test-probes.mjs` 40/40, `node tests/test-audit.mjs` unchanged and green, `node --check scripts/probes.js`, and five mutations of `probes.js` (variant iteration, the every-pair rule, reference merging, mode-name resolution, the `Array.isArray` guard) each failing the suite before being restored. Not walked live: no probe has run through the bridge in this form, and the load protocol's paste, gate and bootstrap have run only in node. The rest unchanged.

**Reviewed against v2.11.2 on 2026-10-02** — no case changed; changelog form only (the `1.60.0+1` label folded into 1.60.0).

**Reviewed against v2.11.1 on 2026-10-01** — no case changed; the release is wording, comments or dead code only, and the suite passes.

**Walked: 2026-10-01 for 2.11.0** — A98 added and walked live in a scratch file with local components; the rest unchanged.

**Reviewed against v2.10.0 on 2026-09-24** — A97 added; `test-audit.mjs` 22/22, the new assertion failing on 2.9.18.

**Reviewed against v2.9.18 on 2026-09-24** — A95 added and walked live.

**Reviewed against v2.9.17 on 2026-09-24** — no case changed in substance; the project named in their evidence is Project A.

**Reviewed against v2.9.16 on 2026-09-24** — A94 added and walked live.

**Reviewed against v2.9.15 on 2026-09-24** — A93 added and walked live.

**Reviewed against v2.9.14 on 2026-09-24** — A92 added; A87's "one button, no menu" is superseded by it, and its exhaustive claim still holds for Audit all.

**Reviewed against v2.9.13 on 2026-09-22** — no case changed; the link stage's batch is 60 variants, because 120 overran the 240-second cap on three of nine runs and a batch that overruns loses everything it resolved; walked in the clean audits below.

**Reviewed against v2.9.12 on 2026-09-22** — no case changed; the live walk's page selection and the service's snapshot paths follow the standards, walked on Project A (104 sets both ways).

**Reviewed against v2.9.11 on 2026-09-22** — no case changed for 2.9.9 and 2.9.10; for 2.9.11 the suite asserts the `ran` list with and without the gating settings, and the writer's suite refuses a full run from this skill without it.

**Reviewed against v2.9.8 on 2026-09-22** — A90 added and walked: the page does not carry the record, and a bad record is a visible null, not a failed build.

**Reviewed against v2.9.7 on 2026-09-22** — A89 added and runs: every finding carries a key, and the writer finds a reworded finding by it.

**Reviewed against v2.9.6 on 2026-09-22** — A88 added and walked live: every stage reads the live file, and the checker refuses a second source.

**Reviewed against v2.9.5 on 2026-09-22** — A87 added and walked live: the dashboard audits the whole library every time and the components stage claims exhaustive; A84's "Audit the changed sets keeps its list" is superseded by it.

**Reviewed against v2.9.4 on 2026-09-22** — A86 added and walked live: every stage files through one function, and the payloads did not change.

**Reviewed against v2.9.3 on 2026-09-22** — no case changed; the judge route stops sending a parameter the model rejects, walked in A85.

**Reviewed against v2.9.2 on 2026-09-22** — A84 added and walked by dry run: a whole-library audit scopes the scan to nothing.

**Reviewed against v2.9.1 on 2026-09-22** — A83 added, runs and walked live: a layer's identity across variants is its path and what it is, and five false rows on one library are gone with no genuine one lost.

**Reviewed against v2.9.0 on 2026-09-22** — A81 added and walked: the scanner's checks run outside Figma, and moving them changed no output. A82 added and runs: the scanner has a test corpus, and every finding site is reached by a suite that fails when the engine is broken.

**Reviewed against v2.5.5 on 2026-09-20** — citation only: the four standards governing the toolkit's parts became `standards/toolkit-standard.md`, and this skill's references point at its §A. No rule and no case changed.

**Reviewed against v2.5.4 on 2026-09-19** — the REST scanner and its fixture are removed; no case asserted them, so none changed. `check.sh` clean.

**Reviewed against v2.5.3 on 2026-09-19** — no case changed; the page moved, not the record or the scanner. A53 re-walked live: all five views (queue, history, scores, measures, about) render and route from the sidebar on the served site, with no script error, and the moved checker (`node tools/docs-site/src/dashboard/check.mjs`, run by `check.sh`) was shown to fail on a renamed id. Older walks below cite `tools/figma-audit/dashboard.html` and `check.mjs` at their old paths: they record where those files were then.

**Reviewed against v2.5.2 on 2026-09-19** — no case changed. 2.5.2 drops `--site`: the service builds the docs site itself from `tools/docs-site` into `projects/<project>/site/`. A53 and A54 re-walked live: one login agent started four projects (9229–9232) with no site flag, each built its site on start and served `/audits/` with 200, and a touched audit record rebuilt Project C while 40 polls during the rebuild all returned 200.

**Reviewed against v2.5.1 on 2026-09-19** — no case changed. 2.5.1 changes only how the service is reached (the docs site's Audits page, `--site` required); A53 and A54, the cases about the service, were re-read and still hold: one shared service, per-project records, a second instance stood up from a JSON file, a port and now a built site. The start command was run without `--site` and refused with its message. 2.5.0's scanner check (§3.10cc) was not re-walked here and remains owed.

**Reviewed against v2.4.0 on 2026-09-10** — A79 added: the judge's reply names why each drop was dropped. Not yet walked live.

**Reviewed against v2.3.0 on 2026-09-10** — A78 added, traced: the file-level checks are the foundations audit's.

**Reviewed against v2.2.0 on 2026-09-11** — A77 added and walked in node: rows are filed by the record's one writer.

**Reviewed against v2.1.0 on 2026-09-10** — A76 added and walked: settings and rulings live only in the context document.

**Reviewed against v2.0.0 on 2026-09-10** — renamed from `figma-library-audit`; no case changed, and dated cases keep the old name.

**Reviewed against v1.62.2 on 2026-09-10** — A75 added and walked: an audit's outcome agrees with the queue it leaves.

**Reviewed against v1.62.1 on 2026-09-10** — A74 added and walked: a grid-layout frame is checked by its row and column gaps.

**Reviewed against v1.62.0 on 2026-09-10** — A73 added and walked: a section of the file kept out of the audit by position, not by page name.

**Reviewed against v1.61.1 on 2026-09-10** — A72 added and walked: an unused property is an error that says why, and a first run counts what it scanned.

**Reviewed against v1.61.0 on 2026-09-08** — A70 added and walked: an audit consumes the changed-since list for what it scanned.

**Reviewed against v1.60.5 on 2026-09-08** — A69 added: a finding whose id lands on a closed row reopens the row instead of disappearing behind "already in the queue".

**Reviewed against v1.60.4 on 2026-09-08** — A68 added and walked: the state signature keeps the variant root's paints; two navigation rows the dashboard had flagged and re-verified as "still reproduces" were the check, not the file.

**Reviewed against v1.60.0 on 2026-09-06** — A55 added and walked: the `window.claude` shim came out of the dashboard, taking eight unreachable error codes with it and surfacing three defects it had been hiding. A54 walked portability on Project C; A53's owed second project is now walked, and A40's "a template nobody has stood a second instance from is a hypothesis" is met again one architecture later.

**Reviewed against v1.46.0 on 2026-09-05** — A53 added and walked: the shipped page deleted, the scripts moved to the shared tool and served from it, the record reduced to what is per-project.

**Reviewed against v1.45.0 on 2026-09-05** — A52 added; the buttons were rewritten around it and the template resynced.

**Reviewed against v1.44.0 on 2026-09-05** — A51 added and walked: the cache refresh shipped and the seed run found the one misspelled variable.

**Reviewed against v1.43.0 on 2026-09-05** — A50 added, walked: the template was rebuilt from the live page and both hardcoded project values removed.

**Reviewed against v1.42.0 on 2026-09-05** — A49 added and walked across the whole library at three successive strictness levels. The REST-route finding in 1.42.0 was walked against a live response.

**Reviewed against v1.41.0 on 2026-09-05** — A48 added and walked: a dashboard swept and audited a live library with no session in the loop. A47's owed positive half is now walked; A42's negative is fully superseded.

**Reviewed against v1.40.0 on 2026-09-05** — A47 added, recorded not walked: the route is identified and the negative it overturns re-tested, but nothing has been paired yet. A42's negative half is narrowed by it.

**Reviewed against v1.39.0 on 2026-09-05** — A46 added, walked as a live false finding: the fix shipped, broke a component's disabled state, and was withdrawn on a maintainer screenshot. No other case re-walked.

**Reviewed against v1.38.0 on 2026-09-05** — A45 added, walked on both live surfaces: the exceptions-to-the-exception were found by the post-transform check, and the three light-theme contrast failures by re-measuring after the type change. No other case re-walked.

**Reviewed against v1.37.0 on 2026-09-05** — A44 added, walked on the live tracker. No other case re-walked.

**Reviewed against v1.36.0 on 2026-09-05** — A43 added, both halves walked live. A42's owed positive half is also **now walked**: a sweep produced a real diff (4 changed, 3 new), and one of the changed sets had silently lost its description.

**Reviewed against v1.35.0 on 2026-09-05** — A42 added, with the negative half walked: the `host:` MCP declaration was refused at publish, which closes the "launch it from the page" question with evidence rather than reasoning.

**Reviewed against v1.34.0 on 2026-09-05** — A41 added. A38's "recompute every measure" assertion now has two more documents under it and says so.

**Reviewed against v1.33.0 on 2026-09-05** — no case moves; the About view documents the measures rather than changing any. Worth recording as a gap it exposes: **no case asserts that a measure's stated threshold matches the one the page applies.** The About text and the tile logic are two statements of the same rule in one file, which is the drift shape this repo keeps meeting.

**Reviewed against v1.32.0 on 2026-09-04** — A40 added and walked: the live record was rebuilt from the shipped template and republished. No other case re-walked.

**Reviewed against v1.31.1 on 2026-09-04** — no case moves; 1.31.1 is a portability sweep of rule wording plus the one-record-per-project shape, neither of which any case asserts. Worth noting as owed: **no case covers a second project or a second library**, which is exactly the direction the maintainer is heading. The next library added to an existing record is the walk.

**Reviewed against v1.31.0 on 2026-09-04** — A39 extended with the search half (step 2b) the maintainer named immediately after the registration half shipped. No other case re-walked.

**Reviewed against v1.29.1 on 2026-09-04** — no case moves. 1.29.1 adds `sets`, `variants` and `variables` to the health record's run documents; A38's assertion about dropping what was not recomputed already covers them, and the record was reseeded with counts for the three runs that took them and none for the one that did not. No case re-walked.

**Reviewed against v1.29.0 on 2026-09-04** — A38 added, walked forward: the record was built and seeded from four real runs of one library. Its backward direction — that the next run refreshes it rather than leaving it stale — is owed. No other case re-walked.

**Reviewed against v1.28.0 on 2026-09-04** — A37 added, walked forward on the run that produced the ruling. No other case re-walked.

**Reviewed against v1.27.0 on 2026-09-04** — A36 added and walked live against the first tracker. A35's owed backward direction is now partly discharged: ticks reconciled onto the right findings by key. No other case re-walked.

**Reviewed against v1.26.0 on 2026-09-04** — A35 added and walked forward only; its backward direction (a second run against the same tracker) is owed and cannot be walked until a re-audit happens. No other case re-walked.

**Reviewed against v1.25.0 on 2026-08-25** — no case moves, and that is the finding. 1.25.0 stops the workflow loading a library's rulebook from `systems/` and loads it from the project's context document, which is what **A4, A14 and A33 already assert** ("it hydrates the convention from the project context document"). The cases were right and the workflow steps were stale, so nothing here needed changing — and nothing here could have caught it: no case asserts where step 2 loads from, which is exactly why thirteen mentions of a demoted mechanism survived. No case re-walked.

**Owed:** A4, A14 and A33 assert hydration from the context document and were last walked before the workflow steps agreed with them — re-walk all three on the next live audit.

**Reviewed against v1.23.0 on 2026-08-20** — A34 added and walked both directions in one exchange: the failure was observed from a maintainer's screenshot, and the corrected render was confirmed by the absence of a repeat report. No other case re-walked.

**Reviewed against v1.22.0 on 2026-08-20** — A33 added and walked both directions against a live library; its control pass found two bugs in the new check before it shipped. No other case re-walked.

**Reviewed against v1.21.1 on 2026-08-19** — 1.21.1 only trims the frontmatter description under the Agent Skills 1024-character cap (skill-standard §A clause F); no case is affected and none was re-walked.

**Walked: 2026-08-21 — pass.** Re-walked for 1.24.0: step 6b traced; no existing case moves (no scan or report rule changed).

**Walked: 2026-08-08 — A5 and A6 against a live 49-page component library; 2026-08-09 — A1, A2, A3, A4, A14 and A15 against Project A `02. Components` (56 components, 40 pages). A9 could not be walked: no fixture exists in that library. A15 FAILED and is fixed in 1.9.0. 2026-08-10 — A17 and A18 against `projects/project-b/` (`Components - Main`, 101 sets); A18 FAILED and is fixed in 1.10.1. Same day, same run — A19, A20 and A21, all FAILED then fixed in 1.11.0: a second property type (`SLOT`) failing 3.10c the way `VARIANT` axes do, `layoutSizingVertical` lying about fixed-height text even under a real auto-layout parent, and the shipped WCAG target-size figure being the AAA criterion instead of AA.** One audit run against one real library surfaced five distinct, previously-undetected defects across four different checks (orphan-instance, unused-property, fixed-height-text, target-size) between A17 and A21. The scoping bug A5 and A6 pin was found and confirmed in the 2026-08-08 session by resolving every using node's nearest component-set ancestor.

**2026-08-10, same day — A22 added.** An ad-hoc "who consumes this token" search outside this skill's own checks produced a false orphaned-token finding on the same project, withdrawn once a paint-style binding this skill has no check for at all was found to be the real consumer. Recorded as a trap for whenever such a check is written, not a fix to anything shipped — nothing in this skill performs that walk today.

**The shipped blocks were executed verbatim on 2026-08-08**, not merely the adapted versions used to build each case. All six changed checks — 3.10a–3.10f — were extracted from `scanner-checks.md` as written, given a real component-set id, and run: every one completes and returns a correct result on Project A's `Button` (no disabled paints, no groups, no unused properties, no orphans across 99 instances that are mostly remote, no visibility-only axes, no fixed-height text). The distinction matters because a fix that is right in an inline probe and broken in the file is indistinguishable from a fix that works, until an audit runs.

**A7, A8, A10, A11, A12, A13 and A16 are walked (2026-08-08 — see each case for its fixture), as are checks 3.10a and 3.10b, whose walks are recorded in `scanner-checks.md` beside the code.** They arrived with the changes in 1.3.0 through 1.6.0; each new script was syntax-checked as a module, and the traps behind A7, A8 and A13 were derived from the API's documented behaviour rather than observed. A7 and A8 fail silently: A7's failure is a finding on every component, A8's is under-reporting with no error raised, and neither announces itself in a report that looks normal. A13's three exclusions are each the difference between a useful check and one that fires library-wide.


## A1 · Slot-published bare names are verified, not flagged
Fixture: context doc with the slot-publishing rule; unprefixed `Tab item` consumed inside a slot.
Assert: no finding; if slot consumption cannot be verified, a `needs-ruling` item — never an auto-flag.

**Walked 2026-08-09 — passes, on the exact fixture the case names.** Every `SLOT` node in the file was walked and each of its instance children resolved through `getMainComponentAsync()` to the owning set. `Tab item` — unprefixed, and so a bare name — is genuinely slot-consumed, so it is verified rather than flagged. Twenty-four others resolve the same way, including `Accordion item`, `Menu - Item`, `Breadcrumb item`, `Radio button input`, `Interactive icon` and `File item`. The verification is the point: the rule legitimises a bare name *because* it is slot-published, so an audit that assumed rather than resolved would be right by luck.

The case's second half has **no fixture** — resolution succeeded for every slot child in the file, so the `needs-ruling` branch was never entered. It stays untested, and would need a slot holding an instance whose main cannot be resolved (a remote library not loaded, say).

Walked live: 2026-08-09 — every SLOT node's instance children in Project A `02. Components`, resolved to their owning sets; the `needs-ruling` branch never entered.

## A2 · Conforming sparse grid is silent
Fixture: set with Disabled=True variants only at State=Rest, doc records the sparse principle.
Assert: no finding, no mention — silence on pass.

**Walked 2026-08-09 — passes across 26 sets at once.** Every set carrying both a `Disabled` and a `State` axis was checked for `Disabled=True` at any `State` other than `Rest`. **All 26 returned zero**, from `Button` (54 variants, 9 disabled) down to `Interactive icon` (5 variants, 1 disabled). The whole library conforms, so the correct output is silence on all 26 — and any finding here would have been a false positive on every interactive set in the file, which conventions §11 names as the signature of a broken check.

Silence only means something if the measurement was live, so: the same pass counted `Disabled=True` variants and got non-zero, set-specific numbers (9, 8, 5, 3, 2, 1), which proves the variant-name parsing worked and the zero on the non-Rest count is a real zero rather than a parse that silently returned nothing. That distinction is the whole reason §6's output contract says to verify a walk visited nodes before treating silence as clean.

Walked live: 2026-08-09 — 26 sets carrying both a `Disabled` and a `State` axis.

## A3 · Closing metrics block is always present
Fixture: an audit with zero findings.
Assert: report still ends with the three-line block (Coverage / Scope / Date), and the coverage % is a number, not a narrative.

**Walked 2026-08-09 — passes at contract level; state plainly what that does and does not cover.** SKILL.md's reporting rule mandates the block in exactly those terms — *"Every audit report ends with exactly three lines, regardless of findings"* — and the specified format, `Coverage: <semantic-token coverage %> (sampled/full, N bindings)`, forces a number rather than narrative. "Regardless of findings" is unconditional, so the zero-findings fixture cannot produce a report without the block without contradicting the rule outright.

The zero-findings condition was genuinely met on two dimensions this session — A2 returned nothing across 26 sets, A9 nothing across all 56 components — so the case's premise is real rather than hypothetical here. **What was not done is a full end-to-end audit producing a complete report**, which is what would test the block's presence by observation rather than by contract. Recorded as contract-verified, not observed.

Walked live: 2026-08-09 — contract only, against SKILL.md's reporting rule; no end-to-end report was observed.

## A4 · Ruling outranks file evidence
Fixture: doc ruling "accepted deviation X"; file exhibits X.
Assert: X not reported; no silent skip either — the coverage line still names the scanned scope.

**Walked 2026-08-09 — passes, with a fixture that exists rather than a constructed one.** Project A's `Alert` carries axes `Feedback × Bold` and just 5 of the 8 variants a full grid would give: `Bold=True` exists only on `Feedback=Danger`. That is sparseness on a *content* axis, which the project's own conventions call a gap rather than the sparse-grid convention — so the file genuinely exhibits the deviation. The context document's 2026-08-05 rulings log closes it: *"Alert `Bold` Danger-only — closed by ruling, no change."*

So the ruling outranks the file evidence and `Alert`'s `Bold` sparseness is **not** reported, suppressed at the judgment layer per SKILL.md step 5 rather than never looked at — the scan still visits it, the coverage line still counts `Alert` in scope, and the suppression is a decision with a recorded reason behind it. The distinction the case's second clause draws is exactly this: a suppressed finding and an unscanned area produce the same silence in a report, and only the coverage line tells them apart.

Walked live: 2026-08-09 — Project A `Alert`'s `Bold` sparseness against the context document's 2026-08-05 rulings log.

## A5 · Style usage counted inside scope, not file-wide
Fixture: a component-library file whose component documentation pages carry furniture styled with an effect style the components themselves never use — say 130-odd uses spread evenly, five or six on each of 25 pages.
Assert: the style is not reported as a finding, and does not appear in any usage figure attributed to components. Assert the negative too: the audit must not "fix" it by promoting it to the source library or rebinding it — it is correctly-scoped furniture, and the fix queue stays silent.

Walked live: 2026-08-08 — a live 49-page component library.

## A6 · A suspicious usage count is checked by distribution before it is believed
Fixture: two styles in one file — one with roughly equal hits on every page, one concentrated overwhelmingly in a single set.
Assert: the even distribution is treated as furniture and confirmed by resolving nearest component-set ancestors before any finding is raised; the concentrated one is treated as genuine component usage. Assert also that a style used only by components is never dropped from the report because a file-wide sweep overlooked it — under-reporting is as much a failure here as over-reporting.

Walked live: 2026-08-08 — a live 49-page component library.

## A7 · Variant axes are not "unused properties" (the every-component case) — WALKED 2026-08-08
Fixture: a known-good component set with variant axes and non-variant properties. Walked against Project A's `Button` — 54 variants, axes `Size · Role · Disabled · State`, properties `Left icon · Right icon · Icon swap (20) · Label text · Icon swap (16)`.
Assert: check 3.10c reports `unused: []`. **Passed.**
Assert the control, which is what makes this a control pass rather than a run: the same walk *without* the `type !== "VARIANT"` filter returned `["Size", "Role", "Disabled", "State"]` — every axis of a component the maintainer considers correct, and by extension every axis of every set in the library. The trap is real, not theoretical, and the filter is what prevents it. Assert the filter is on `type !== "VARIANT"`, not on a name pattern.

Walked live: 2026-08-08 — Project A `Button`, run with and without the `type !== "VARIANT"` filter.

## A8 · A mixed-fill text node does not abort the paint walk — WALKED 2026-08-08
Fixture: a text layer with per-character styling (`Save changes`, two words two colours → 3 styled segments, `fills === figma.mixed`, `Array.isArray` false), beside a rectangle carrying a genuinely disabled fill. Built as a throwaway probe and removed in the same call, because a component library has no such text naturally — labels are uniform by design, and all 563 `Label` nodes on the page report a single styled segment.
Assert: check 3.10a returns the disabled fill and does not throw. **Passed.** The control is what proves it: the same walk without `Array.isArray` **threw** and returned `[]` — the finding it would have collected was lost.
Assert the failure is described accurately, which the first version of this case did not do. It said "under-reporting with no error raised". There **is** an error — the throw surfaces as a failed `figma_execute`. The realistic silent failure is one layer up: this skill batches the walk per page group, so one batch throwing returns nothing while the others succeed, and an agent that does not check every call reports the union of the successful ones as a complete audit. The loss is silent *in the report*, not at the call.

Walked live: 2026-08-08 — a throwaway mixed-fill text probe beside a rectangle with a disabled fill.
## A9 · Disabled paints are hygiene, not report items
Fixture: a set with several fills toggled off and no other findings.
Assert: the run reports the queue as empty in chat and holds the disabled paints in the tracked/hygiene queue, per the hygiene rule. A user-invisible defect that fills the default report trains the maintainer to skim it.

**Not walked 2026-08-09 — no fixture exists.** Every node of all 56 components in Project A `02. Components` was walked for `fills`, `strokes` and `effects` with `visible === false` (guarding each with `Array.isArray` first, per the `figma.mixed` trap). **Zero across the whole file** — not merely on the `Button` that check 3.10a was walked against in 2026-08-08. So the library has nothing toggled off anywhere, and this case has nothing to assert against. Planting one would mean writing to the maintainer's live library, which an audit walk should not do.

The check itself is not in doubt — 3.10a ran and completed — but its *reporting behaviour*, which is all this case is about, has never been observed with a real hit. Recorded as untested rather than passed.

Not walked.

## A10 · Contrast is resolved per mode, and the alias is followed by mode name — WALKED 2026-08-08
Fixture: five bound semantic colour tokens from Project A's `Button`, each aliasing one hop into a hidden primitive, in a `Light`/`Dark` collection.
Assert: each mode resolves to its own colour. **This failed before the fix.** Following the alias into the target collection's `modes[0]` returned the *Light* colour for every mode — an inverse text token came back `0.992` (near-white) in Dark instead of `0.071` — so every dark-mode ratio was computed from light-mode colours, and Light and Dark reported identical ratios.
Assert why that is worse than the `NaN` trap it sits beside: an unfollowed alias yields `NaN`, which is obviously broken. A wrongly-followed alias yields **a real colour that is the wrong one**, and identical Light/Dark ratios read as a theme-invariant token rather than a broken resolver. Both are silent; only one looks plausible.
Assert the fallback is retained and why: a target collection with no mode of that name — a single-mode primitive collection — is correctly read at `modes[0]`. Figma provides no mapping between collections' modes, so name matching is the heuristic, not a guarantee.
Assert the finding names the mode alongside the token pair. A report naming only the pairing sends the maintainer to a component that looks correct on screen.

Walked live: 2026-08-08 — five bound semantic tokens on Project A `Button` in a Light/Dark collection.

## A11 · A visibility-only axis needs every pair to agree — WALKED 2026-08-08
Fixture: two purpose-built variant sets. **A** — two variants differing only in one rectangle's `visible` flag. **B** — three variants on one axis where two pairs are visibility-only and one carries a real size change. Plus the real 54-variant `Button` as the negative control.
Assert: A reports its axis; B reports nothing, because one matching pair is coincidence and collapsing a legitimate axis into a boolean on that basis is the damage; Button reports nothing. **All three correct after the fix.**
Assert what the walk found, which is the reason the positive direction had to be probed: **the check could not fire at all.** Its signature included the variant root, whose name is literally `Axis=Value`, so every pair differed on the root's name and every pair was disqualified. Against Button it reported nothing across 207 pairs — indistinguishable from a pass. Only fixture A, built to be reportable, exposed it.
Assert the general form, because this is the sharpest instance of it in the repo: **a clean result from a check that cannot fire is not evidence.** Any control pass that only tests the negative direction will certify a dead check as working.

Walked live: 2026-08-08 — two purpose-built variant sets, with the 54-variant `Button` as the negative control.

## A12 · An unused property is reported as a publication defect — WALKED 2026-08-08
Fixture: a component declaring a property applied to no layer. Walked against Project A's `Test button`, which declares a boolean `Icon` referenced by nothing; Figma marks it with a warning icon in the properties panel.
Assert: 3.10c reports `unused: ["Icon"]`. **Passed** — and the same run returned `[]` for the known-good `Button` beside it, so the check is validated in both directions rather than only proven to fire.
Assert the wording names the real consequence: **Figma ignores the whole component at publication**, so consumers never receive it while the publish reports success. Not a dropped property — the component. That was confirmed by the maintainer and reproduced live on 2026-08-08, replacing the weaker "the property will not exist for consumers" this case carried when it was written from an assumption.
Assert the severity: `error`, in the default report, never hygiene and never held back. A defect whose entire cost is paid by someone outside the file, against a publish that reported success, is the one most likely to be deferred if it reads as untidiness.

Walked live: 2026-08-08 — Project A `Test button`'s unused `Icon` boolean, with `Button` beside it as the control.

## A13 · Fixed-height text is caught, designed truncation is not — WALKED 2026-08-08
Fixture: five text layers built as a throwaway probe, because the library has none — all 46 text nodes in scope hug on both axes. (a) `textAutoResize: "NONE"` in an auto-layout frame; (b) the same but truncating; (c) `layoutSizingVertical: "FILL"`; (d) `textAutoResize: "HEIGHT"` inside a **plain** frame; (e) `textAutoResize: "NONE"` inside a plain frame.
Assert: (a) and (e) flag; (b), (c) and (d) do not. **All five correct after the fix; (d) failed before it.**
Assert what the walk found, which is the reason this case is worth its length: the third exclusion was **documented but not implemented**. The check ORed `autoResize === "NONE"` with `vertical === "FIXED"`, and `layoutSizingVertical` reports `FIXED` on any node whose parent is not auto-layout — so a text layer that hugs its height was flagged for its parent's layout mode. The prose said "both are read rather than either alone", which was true and insufficient: the second read has to be *gated* on the parent, not merely accompanied.
Assert fixture (e), which exists so the fix cannot pass by silencing the real case: fixed-height text in a plain frame must still flag.
Assert also: the finding carries the node's character count, not only its height. Height alone cannot distinguish a numeric badge from a description one word away from clipping, and the agent needs that to rank the queue.

Walked live: 2026-08-08 — five throwaway text-layer probes, (a) to (e).

## A14 · Description structure comes from the project, not from this skill
Fixture: a project whose context document records the heading order `Behavior · Composition · Usage · Don't · Code gen notes`, and a public component whose description has every heading except `Don't`.
Assert: the missing `Don't` is reported, because the project's own recorded structure is the standard applied. Assert the negative that this case exists for: a description lacking a "Purpose" **heading** is NOT reported, because the owning skill puts the purpose in an unheaded lead paragraph. Before 1.5.0 `conventions-universal.md` asserted its own five-part shape and got both of these backwards — it would have passed the missing `Don't` and flagged the absent `Purpose`.
Assert also what survives as universal: an absent **Composition** line on a *composite* component is a finding whatever the project's headings are called, and a leaf component legitimately omits it.
Assert the exclusion that decides which of those a component is, and assert it as the negative: **a component whose only nested instances are icon payloads arriving through an `INSTANCE_SWAP` is not composite, and its absent Composition line is not a finding.** Without this, "composite" means "contains any instance", which flags a component whose whole purpose is to hold one swappable icon. Added 2026-08-09 from the walk below, where the two readings differed by 6 findings against 2 on the same seven components.
Assert **all three reference files agree**, not just `conventions-universal.md`. `judgment-protocol.md` §4 kept telling the agent layer to look for "Purpose, Behavior, Composition, Usage, Code-gen notes" for two versions after 1.5.0 removed that shape — while citing the section that no longer said it. A citation that survives a meaning change reads plausibly and asserts the opposite of its source, which is the failure mode toolkit-standard §C's re-read step exists for; nothing applies it to a skill's internal cross-references, so this case does.

**Walked 2026-08-09 — passes, and earned a new exclusion.**

*The three-file agreement holds.* `conventions-universal.md` §6 says the structure "is not this skill's to define" and carries the retraction of the old five-part shape; `judgment-protocol.md` now asks whether a description matches "the heading set the project's context document records", asserting no shape of its own; `scanner-checks.md` §3.6 names no headings at all. The 1.6.0 fix held. This is the one assertion here that needed a read rather than a file, and it is now a control rather than a hope.

*The negative passes overwhelmingly.* Project A records `Behavior · Composition · Usage · Don't · Code gen notes` after an unheaded lead sentence — no `Purpose` heading. Across all **29 described components**, `Purpose` appears as a heading exactly **zero** times, and every one opens with an unheaded lead ("A button triggers an action or event…", "An alert communicates an important message…"). A check asserting a `Purpose` heading would therefore fire on 29 of 29 — the universality signature again. Nothing flags it.

*The named fixture does not exist.* A public component with every heading **except** `Don't` cannot be found: all 29 described components carry `Don't`. The recorded structure was read from 14 described components in 2026-08-05 and the library has since grown to 29 without losing it. The missing-heading mechanism is nonetheless live and observable on the other headings — `Toolbar` lacks `Behavior` and `Code gen notes`, `Switch` and `Dialog` lack `Code gen notes`, `Accordion`/`Tabs`/`Divider` lack `Behavior` — each reportable on exactly the logic the case describes, the project's own recorded order being the standard applied.

*The composite half produced a real exclusion, and it is the finding worth keeping.* The case asserts an absent Composition line is universal on a composite and legitimately absent on a leaf, but neither this case nor §6 ever said **what makes a component composite** — and live data shows the definition decides the outcome. Resolving every nested instance to its main across the seven components whose descriptions omit Composition: `Interactive icon` composes `plus`, `Compact button` composes `calendar`, `Alert` composes `triangle-alert`/`info`/`check`, both `Menu item`s compose `house`. All icons, all arriving through an `INSTANCE_SWAP` property. Counting those as composition makes 6 of 7 "composite" — including a component whose entire purpose is to be one swappable icon.

Excluding swap payloads leaves the two genuine findings: **`Toggle`**, which contains `_Switch button`, and **`Breadcrumb item`**, which contains `_Breadcrumb button`. Both are structural parts, both descriptions omit Composition, both are real. The exclusion is now recorded in `conventions-universal.md` §6 with this evidence, per the scanner-checks procedure's second item. It is §3.10c's mistake in another costume — a check that cannot tell a payload from a part fires on nearly everything.

Walked live: 2026-08-09 — the 29 described components of Project A `02. Components`, plus a read of all three reference files.

## A15 · A new check is not finished until its trap is in the index
Fixture: a reviewer adding a scanner check, and the traps table at the top of `references/scanner-checks.md`.
Assert: every trap documented beside a check also appears as a row in that table, and the detail lives in exactly one place — a row either carries the explanation or points at the prose that does, never both. The file's opening tells an author to read the traps table **before writing or trusting any check**, so a trap recorded only in the section that found it is a trap nobody meets in time. Five were inline-only between 1.3.0 and 1.6.0.
Assert the four-part protocol is applied and not just present: control-pass against known-good output before trusting a hit, an explicit statement of what the check does *not* flag, the trap in the index, and a case whose sharpest assertion is a negative one. A check missing any of the four is reported as a candidate, not as findings.
This case needs a **read**, not a script — whether a stated exclusion is the right exclusion is judgement, exactly as skill-standard §A clause D says of clause D itself. It is here so the review happens rather than being remembered.

**Walked 2026-08-09 — FAILED, and fixed in 1.9.0. This is the case earning its keep.** Every section of `scanner-checks.md` was read against the traps table at its top. Two traps were documented beside their check and had never reached the index:

1. **`!main` as the orphan test never fires** (§3.10d). Deleting a main component leaves `getMainComponentAsync()` still returning it, `removed === false`, still findable by id — only its `parent` goes null. This is recorded in the section, in its code comment, and in A16, which calls it out as a check that "reported nothing on a genuine orphan". It was not in the table. Worse, the table *does* carry a row about `instance.mainComponent` throwing under dynamic-page access — a different trap on the same API — so a reader scanning the index would see `mainComponent` apparently covered and move on.
2. **"Non-canonical page" is not "doesn't start with `❖`"** (§3.9). Labelled "**Confirmed false-positive trap**" in its own section, about `🚧` work-in-progress pages producing "a wall of false positives". Not in the table.

Both are now rows, each pointing at the section that carries the detail rather than restating it, per this case's one-place rule.

**The recurrence is the lesson.** Procedure item 3 in that file says "put the trap in the table above, not only in your section", and records that five traps were inline-only until 1.6.0 for exactly this reason. Two more accumulated after the clean-up, both added by the very versions that wrote the procedure. A rule that must be remembered at the moment of writing is a rule that decays; nothing in the structure prompts an author to touch the table, and this case is the only thing that does — which is precisely the argument its closing line already made for existing at all.

Judged and *not* raised as failures, since inflating a finding count is its own defect: the `SPACE_BETWEEN` inert-gap carve-out (§3, the token-binding check) is an exclusion under procedure item 2, not a trap; and the gap-means-three-properties note sits as prose above the table with a row pointing at it, which is the permitted "row points, prose carries" shape rather than a duplication.

Walked live: 2026-08-09 — every section of `scanner-checks.md` read against its traps table; FAILED, fixed in 1.9.0.

## A16 · An orphaned instance is detected by its main losing its parent — WALKED 2026-08-08
Fixture: an instance whose main component is deleted while the instance survives; plus 40 real instances from Project A's `Button`, 37 of them remote.
Assert: the orphan is flagged and none of the 40 real instances is. **Both correct after the fix.**
Assert the negative that this case exists for: `!main` — the original test — **never fires.** Deleting a main leaves `getMainComponentAsync()` still returning it, with `removed === false`, still findable by id. Only its `parent` goes null. A check written from a plausible API assumption reported nothing on a genuine orphan, and nothing about a clean library run would have shown that.
Assert the fix was measured before it shipped, not after: a rule keyed on `!main.parent` could plausibly have flagged every instance of a remote library component. It does not — a remote main keeps its parent, the `COMPONENT_SET` in its source file — and that was checked against 37 remote instances rather than reasoned about.

**Correction, 2026-08-10 — this generalisation was itself wrong; see A18.** "A remote main keeps its parent" held only because that session's remote source file happened to also be connected, giving the plugin local visibility it does not have by default. `!main.parent` alone is not a safe test for a remote instance; A18 is the fixture that proves it and the fix that gates on `main.key`.

Walked live: 2026-08-08 — a deleted main plus 40 real `Button` instances, 37 of them remote.

## A17 · Fix-queue rows carry a bucket-scoped number — WALKED 2026-08-10
Fixture: a real fix queue from a live run against `projects/project-b/` (`Components - Main`, 101 component sets, full variant walk) — one Approve & I fix row (an unbound stroke weight on a WIP page) and three Decide rows (orphaned default-icon references, one shared root cause).
Assert: each row renders as `N.M` — bucket `N`, position `M` in the bucket's sorted render order — so the maintainer can answer "3.2: accept" without repeating the Where cell. Assert the negative: numbering is **not** authoring order and **not** stable across re-runs; it resets to `N.1` per report, and identity across runs is still carried by the Where cell and deep link, unchanged from before this version.

**Passed.** The report existed unnumbered, before this version shipped, because the maintainer's request was exactly to add this. Retro-fitting the real rows into the new template: the single Approve & I fix item numbered `1.1`; the three Decide rows, all the same severity and un-ordered by ⚠️ (none was user-visible), numbered `3.1`–`3.3` in the order they were found (Icon container's default, then the AI-surface default, then the two Upload area icons as one shared-root-cause pair) — which is a legitimate render order since nothing in the sort key (severity, then ⚠️) distinguished them, and the rule only demands the render order be followed, not a specific tie-break among equals. Bucket 2 (Quick manual fixes) was empty and correctly produced no `2.x` numbers and no gap in the sequence — bucket 3 still opened at `3.1`, confirming numbering is per-bucket rather than a single running count across the whole queue.

Not walked: a genuine cross-run renumbering (the same finding surviving into a second report and landing on a different number) — the fixture only has one run so far. The rule is asserted from the template's own stated contract, not yet observed changing between two real reports of the same library.

*Postscript, same day:* the three Decide rows numbered `3.1`–`3.3` here were themselves withdrawn a few messages later — see A18. That does not touch what this case asserts (the numbering mechanics render correctly on a real bucket), but a reader landing on this case alone should not take `3.1`–`3.3` as a standing finding.

Walked live: 2026-08-10 — a live fix queue from `Components - Main` (101 sets); cross-run renumbering not observed.

## A18 · A remote instance with no locally-visible parent is not automatically an orphan — WALKED 2026-08-10, FAILED then FIXED
Fixture: the same live run as A17, `projects/project-b/` (`Components - Main`) — four instances of icons from a **separate, unconnected** icon-library file: one used as a default swap value inside a shared building block (so it recurs across many consumers), one inside an AI-surface variant, two inside a single upload-style component.
Assert (pre-fix): `!main || !main.parent` (the rule A16 shipped) flags all four as orphaned, because none has a locally-visible parent.
Assert (why that's wrong): each one resolves cleanly via `figma.importComponentByKeyAsync(main.key)` — proof the component is live and healthy, not detached. The parent chain reads as null not because anything is broken, but because the plugin has no local visibility into a source file that simply isn't open in this session.

**FAILED before the fix, exactly as predicted, then corrected — the maintainer caught it, not any check.** All four were reported as `Decide` rows in the live chat report. The maintainer pushed back ("I think you made a mistake flagging these") on direct knowledge of the source file, prompting the live-import verification that withdrew all four. Nothing in the report itself flagged the false positive — case A16's own control test was clean, and the reporting-side "finding on everything" universality rule (§11) didn't fire either, because these four findings were spread across three different sets, not one.

Assert the corrected rule: gate on `main.key`. No key and no parent → the original, narrower A16 case, still trustworthy alone. A key present and no parent → not yet decided; resolve live before flagging, and cache by key within a run since the same remote component recurs (the default-swap icon alone accounted for two of the four sightings, one per consumer).

Assert the negative this case adds beyond A16: **the 1.7.4 validation's own generalisation was unsound.** "37 of 40 remote instances, none flagged, because a remote main keeps its parent" was a true measurement in a session where the remote source file happened to also be connected — which is exactly what gives the plugin the local visibility this fixture shows it does not have by default. The measurement was real; treating it as proof that remote mains *always* keep their parent was the error, and nothing before this walk had a fixture with the source file disconnected to catch it.

Assert one more operational finding, not a correctness bug but worth recording: three consecutive `importComponentByKeyAsync` calls in the same tight loop timed out (20s, 25s, 30s) against a connection that a health probe confirmed was fine (3ms latency) in between. The same keys resolved in a few seconds each when retried individually and spaced out. A timeout on this call is therefore not itself proof of a broken remote reference — retry once, isolated, before concluding the component is genuinely gone.

Walked live: 2026-08-10 — four instances of icons from a separate, unconnected icon library; FAILED, then fixed.

## A19 · A SLOT property fails the "unused" check the identical way a VARIANT axis does — WALKED 2026-08-10
Fixture: the same live run as A17/A18 — a two-variant set with one `SLOT`-type property, correctly conditional (present as a real `SLOT` node on the variant where it should show, absent on the other).
Assert (pre-fix): 3.10c's `type !== "VARIANT"` filter alone flags the `SLOT` property as unused, because no layer carries a `componentPropertyReferences` entry for it — a `SLOT` is filled by presence in the tree, not by a layer referencing it back, the same mechanism gap `VARIANT` axes have.
Assert (why): direct inspection of both variants confirmed the `SLOT` node exists exactly where expected and nowhere it shouldn't — genuinely correct, conditional composition, not a lost-in-a-rename property.
Assert the fix: filter both `type !== "VARIANT" && type !== "SLOT"`. Confirmed after the fix: the same set returns `unused: []`.
Assert the general lesson A7 already proved for `VARIANT` axes turned out to need re-learning for a second property type: a check's exclusion list is a list of everything Figma resolves by a mechanism other than `componentPropertyReferences`, not a single case to remember once.

Walked live: 2026-08-10 — a two-variant set with one conditional `SLOT` property, before and after the filter fix.

## A20 · `layoutSizingVertical` reads `FIXED` even under a real auto-layout parent, when `textAutoResize` hugs — WALKED 2026-08-10, FAILED then FIXED
Fixture: the same live run as A17–A19 — a text layer inside a genuine horizontal auto-layout frame, `textAutoResize: "WIDTH_AND_HEIGHT"`, holding placeholder content matching its own layer name.
Assert (pre-fix): the check flags it as fixed-height, because `layoutSizingVertical` reads `"FIXED"` despite the auto-layout parent existing — the exact precondition the 1.7.2 fix gates on.
Assert (why that's wrong): `textAutoResize: "WIDTH_AND_HEIGHT"` means the box resizes to fit its own content on both axes — it structurally cannot have a fixed height, regardless of what `layoutSizingVertical` reports. Confirmed by direct node inspection, not inferred.
**Hit every one of 33 variants of one layer in one component — the universal-finding signature (§11) — and that is what triggered the re-check rather than trusting the count.**
Assert the fix: `layoutSizingVertical` is read and reported for context but never used to decide "fixed" — only `textAutoResize === "NONE"` decides that (with the existing `FILL` override kept, unaffected by this fix, no evidence against it). This is a narrower, more surprising case than the one 1.7.2 already fixed: 1.7.2's gate was "don't trust `layoutSizingVertical` without an auto-layout parent"; this shows the property can still lie *with* one.

Walked live: 2026-08-10 — a hugging text layer in a real auto-layout frame, hit on all 33 variants; FAILED, then fixed.

## A21 · The WCAG target-size figure this skill ships is the wrong success criterion — WALKED 2026-08-10
Fixture: the same live run — five interactive component sets sampled for target size against `MIN_TARGET`.
Assert (pre-fix, `MIN_TARGET = 44`): nearly every variant across every sampled set flags — buttons, icon buttons, checkboxes, switches — a single undifferentiated wall, the universal-finding signature (§11) that says investigate the check before reporting.
Assert why: 44×44 is WCAG 2.2 SC 2.5.5, **Target Size Enhanced**, level **AAA** — a stricter, different criterion. The skill's own accessibility floor (conventions-universal §5, and every project context document checked so far) is **AA**, whose target-size criterion is SC 2.5.8, **24×24**.
Assert (post-fix, `MIN_TARGET = 24`): the same five sets report zero — every sampled component genuinely clears the AA minimum, which is what an AA-floor library should show.
Assert the general form: a "WCAG reference value" hardcoded into a checklist without naming which success criterion it's from is a value nobody can verify is the right one until it's checked against a real library — this shipped for several versions as a plausible-sounding number that was simply the wrong level.

Walked live: 2026-08-10 — five interactive sets sampled against `MIN_TARGET`, at 44 and again at 24.

## A22 · "Who consumes this token" cannot be answered by alias chains alone — trap recorded, no check regressed
Fixture: a live investigation (outside this skill's own checks — an ad-hoc reverse-consumer search) asking whether a specific published token had any consumers anywhere in a project, per `projects/project-b/`.
Assert: searching every other token's `valuesByMode` for a `VARIABLE_ALIAS` pointing at the target returned zero matches, and was reported as "orphaned" on that basis.
Assert the negative that withdrew it: the token was in fact consumed — by a local **paint style**, one stop of a two-stop gradient, bound directly via `style.paints[].boundVariables.color`. That binding path is invisible to a search that only walks variable-to-variable alias chains, because a Style is not a Variable and carries its own, separate `boundVariables` structure per paint.
Assert this skill is unaffected today: no shipped check in `scanner-checks.md` performs a "does anything consume this token" walk — §3's token-binding check runs the opposite direction, verifying a layer binds *to* a token, never counting a token's consumers. So nothing regressed and no fix landed; the trap in the scanner-checks.md index exists for the check that doesn't exist yet, and for any future ad-hoc version of this same question.

Walked live: 2026-08-10 — an ad-hoc reverse-consumer search whose orphaned-token finding was withdrawn on a paint-style binding.

## A23 · A single-option variant axis flags, and a multi-option one never does — WALKED 2026-08-13, both directions
Fixture: the full 54-set Project A `02. Components` library as the negative control, and a purpose-built two-variant probe set (`Probe=Only, Extra=A|B`) as the positive one, created and removed in the same call per the A8 precedent.
Assert the negative: zero hits across all 54 real sets — every axis in the library carries two or more options, and a library the maintainer considers correct stays silent. **Passed.**
Assert the positive: the probe's `Probe[Only]` axis flags; its `Extra[A|B]` control axis beside it does not. **Passed** — the check can fire, so its silence on the real library is evidence rather than a dead check certifying itself (the A11 lesson, applied at birth this time).
Assert the routing: a hit is worded as a question (leftover vs deliberately staged) and lands in **Decide**, never a batch fix — axis removal rewrites every variant name and instance override.
Assert the negative on scope: non-variant properties (`TEXT`, `BOOLEAN`, `INSTANCE_SWAP`, `SLOT`) are out of scope — no `variantOptions` at all. A set with exactly one variant still flags, framed as a set-shape question (should this be a plain component?).
Operational note from the walk: the first probe attempt named the two variants with **inconsistent axes** (`Probe=Only` beside `Probe=Only, Extra=A`), which makes `componentPropertyDefinitions` throw `Component set has existing errors` — and the throw skips the same-call `set.remove()`, leaving debris in the live file. The retry cleaned up first and named both variants with the same axis set. A probe that writes to a live file needs its cleanup to survive the probe's own failure: clean up at the START of the retry, not only at the end of the happy path.

Walked live: 2026-08-13 — 54 real sets as the negative, a purpose-built probe set as the positive.

## A24 · A score is derived, decomposed, gated, and only produced on request — WALKED 2026-08-13 (first live score report; gate assertion still unexercised)
Fixture: the full-audit run against Project A `02. Components` (54 sets, 407 variants), in the same conversation where the maintainer had requested score reports — satisfying the trigger boundary.

**Walked, and the mechanics held.** Every deduction on every row maps to a fix-queue item (the sharpest check ran in both directions: 40 of 54 sets score a clean 100, and none of them has a queue row; all 14 sub-100 rows do). Every row renders with its six sub-scores; N/A reweighting was exercised for real on 9 of the 14 sub-100 rows (wrapper components with no `State` axis — Toast, Sidebar, Toolbar, Pagination, Segmented control, Section, `_Label / Default`). One uniform debt (the pending ARIA-annotation pass, which touches all 16 interactive sets identically) was footnoted once rather than deducted per row — a deduction that distinguishes nothing between components carries no ranking information, the scoring-side form of §11's universality rule.

**Not exercised: the 25/100 publication gate** — the library has zero unused properties, so no component triggered it. The gate's behaviour with a real hit remains unobserved, exactly as A9's reporting behaviour did for years; recorded rather than glossed.

**One model observation from the walk, recorded as a candidate revision, not a change:** error −25% is lenient for an *empty public description* — Toast, with no description at all, keeps 7.5/10 in Metadata, though the dimension measures nothing but the description. An absent description arguably zeroes its dimension rather than denting it. Left as shipped because one walk is one data point and the weights are a maintainer-visible contract; revisit if a maintainer reads a score as healthier than the component warrants.

Assert (standing, for future walks): every deduction corresponds to a verified post-judgment queue item and suppressed exceptions never deduct; no bare number without its six sub-scores; N/A and unscanned dimensions reweight (unscanned additionally marks the score partial and names the gap); a publication-blocking defect caps at 25/100 with the reason on the row; no scoring output of any kind unless the maintainer asked for scoring in that conversation.

Walked live: 2026-08-13 — the first live score report over 54 sets and 407 variants; the 25/100 gate unexercised.

## A25 · The state-render diff includes the variant root's visual properties, excluding only its name — WALKED 2026-08-13, FAILED twice live then FIXED
Fixture: the 2026-08-13 full audit of Project A `02. Components` — 29 interactive sets diffed, non-Rest vs Rest and Disabled=True vs Disabled=False.
Assert (pre-fix): a signature that excludes the variant root entirely — over-applying §3.10e's exclude-the-root rule, which is about the root's *name* — reports 44 non-rendering states across 13 sets: the universal-finding signature (§11), which is what triggered verification instead of reporting.
Assert the two mechanisms the root carries, both measured on the same run: adding root `opacity` cleared 28 hits (Disabled dims the root — 1.7.7's lesson, which named opacity and stopped there); adding root **fills** cleared 14 more (Hover/Press paint a 3%-alpha state token on the root or on a `Content` frame — found by direct dump of one surviving pair, not reasoned about).
Assert the survivors are real and how that was confirmed: `Button switch` `Selected=True` Hover and Press are byte-identical to Rest under the full-root signature, while the `Selected=False` side renders both states via a `Content` fill — the sibling test in its sharpest form, one binary-axis side correct and the other not, in the same set.

*Postscript, same day: the two survivors were themselves withdrawn two hours later.* When the maintainer questioned the rows, a fresh dump showed the three `Selected=True` variants binding three distinct state tokens (`inverse-rest`/`-hover`/`-press`) — rendering correctly. The maintainer was editing the library live throughout the session (other fixes landed mid-audit), so the most likely reading is that the variants were corrected between scan and re-check, but that cannot be proven from node data and is not claimed. What stands from this case is the signature mechanics, which were measured; what does not stand is treating any finding in a live-edited file as durable. The re-verify-before-acting rule (A28, judgment-protocol §2) applies to a finding a maintainer questions even more than to one they accept.
Assert the general form: **an exclusion earned by one property must not be widened to the node that carries it.** §3.10e earned "exclude the root's name"; two versions later that had silently become "exclude the root," and each of the root's other properties had to be re-earned by a fresh false-positive wall. The signature also includes, for nested `INSTANCE` children, the resolved main id and `componentProperties` — a state passed to a swapped child is invisible to a name-and-visibility signature.

Walked live: 2026-08-13 — 29 interactive sets diffed non-Rest against Rest; FAILED twice, then fixed.

## A26 · In a terminal-rendered chat, the fix queue carries no inline URLs — WALKED 2026-08-13 (the failure was live; the fix re-rendered the same report)
Fixture: the 2026-08-13 Project A audit report, delivered in Claude Code with every Where cell link-wrapped per the then-canonical template. The maintainer replied with a screenshot: each row's markdown link had printed as its full raw Figma URL, three-plus terminal lines per row, and said they could not read it.
Assert: in a terminal-rendered chat the queue and score tables contain no markdown links — Where cells are plain `code` paths — and the full-linked version is written as the `.md` mirror, mandatory in that environment, its path named in the chat message. In a browser-rendered chat the inline-link form remains correct; the rule is per-surface, not a retreat from linking.
Assert the invariant that survives both surfaces: every finding's deep link exists somewhere the maintainer can reach — a finding that cannot be located is treated as unverified, so removing links from chat without writing the mirror would trade a readability defect for a verifiability one.
Assert the negative: the mirror is not a substitute for the chat report (the chat report still renders first, in full, per the reporting rules) — the mirror only absorbs the links and the Done column.

Read by: the maintainer, 2026-08-13 — judged the link-wrapped queue unreadable in the terminal, from a screenshot.

## A27 · Every chat bucket is a table, including Approve & I fix — WALKED 2026-08-13 (maintainer caught the mixed rendering live)
Fixture: the same 2026-08-13 Project A report as A26, re-rendered link-free — buckets 3 and 4 as tables, bucket 1 still the template's checkbox list. The maintainer asked why bucket 1 "didn't come as a table, other did".
Assert: in chat, all four buckets use the same # / Sev / Where / Fix table; bucket 1's shared-approval semantics live in its heading ("one approval applies all"), not in list markup. The checkbox form appears only in the `.md` mirror, where a checkbox is interactive.
Assert the inconsistency this case pins, because it was present from the template's first version: the Done-column rule already stated that a chat checkbox ticks nothing, while the template mandated checkboxes for exactly one bucket — two rules in one section contradicting each other, unnoticed until a maintainer read the mixed output. A template's examples are assertions too; walking the rules means walking them against each other, not only against the output.

Read by: the maintainer, 2026-08-13 — asked why bucket 1 did not render as a table when the others did.

## A28 · Text directly inside a SLOT needs no text property — WALKED 2026-08-13 (ruled on a live finding; verification also killed a second finding for a different reason)
Fixture: two queued fix-queue rows from the same live audit — "add text properties" for a sidebar's `Title`, `Label`, `Caption` and a toolbar's `Description text` — re-verified by locating each layer and walking its ancestors when the maintainer ruled that slot-content text needs no property.
Assert the exclusion: a `TEXT` layer whose ancestry passes through a `SLOT` inside the same component is not a needs-a-text-property finding — slot content is replaced wholesale, so a property on the placeholder would never be used. On the fixture, `Title` sat directly inside the header slot: withdrawn.
Assert the boundary, because the fixture exercised it: the same sidebar's six `Label` layers also sit inside a slot — but *inside `Menu item` instances* placed there, and each already has that component's own text property. Slot-content text owned by a nested instance is the nested component's concern; the exclusion neither flags it nor exempts the nested component from its own rules.
Assert the negative that keeps the rule narrow: two more layers in the same component (`Label`, `Caption` in a plain footer frame, no slot in their ancestry, no property) remain genuine findings — the exclusion is about slots, not about components that happen to contain slots.
Assert the second withdrawal and its different lesson: the toolbar's `Description text` was not excluded — it was *gone*, removed from the file since the finding was recorded four days earlier. A queued finding is a claim about the file at record time; re-verify location before acting on or re-reporting it (judgment-protocol §2's fresh re-read, applied to the queue itself).

Walked live: 2026-08-13 — two queued rows re-verified by locating each layer and walking its ancestors.

## A29 · A resolved colour variable carries alpha, and a resolver that drops it computes confident wrong contrast — WALKED 2026-08-13
Fixture: a live single-component pass — a progress bar whose track binds a soft-surface token (palette near-black at ~5% alpha, rendering light grey over white) and whose fill binds the opaque inverse-surface token.
Assert (the failure, observed): an rgb-only resolver reported both tokens as near-identical near-blacks and computed fill-vs-track contrast of 1.0 in Light — for a pairing whose screenshot shows roughly 15:1. The wrong number is *confident*: nothing about `{r:0.086, g:0.086, b:0.086}` says a quarter of the story is missing.
Assert what caught it: **the impossible result, not any checker** — a ratio of 1.0 between a "soft" background and an "inverse" background cannot be right, and treating suspicious probe output as a finding about the probe (the §11 discipline, and the verify-the-instrument rule) is what turned a false defect into an instrument fix. The component shipped clean.
Assert the rule: resolved `valuesByMode` entries are rgba; a value with `a < 1` must be alpha-composited over its actual backdrop before luminance is computed, and where the backdrop is unknown the pair is reported verify-by-eye rather than scored. A translucent token read as opaque produces false passes as easily as false failures — this fixture happened to fail loudly, but a 50%-alpha white over a dark surface would fail quietly.
Assert the boundary: the shipped §3.7c cached-paint path is unaffected (Figma caches the *blended* display colour onto paints); the trap lives specifically in the per-mode variable-resolution path that A10 built, which reads stored values that were never blended.
Assert the derivation: every deduction on a score row corresponds to a verified, post-judgment finding that also appears in the fix queue — the score is computed from the queue's items, never from raw scanner candidates. A deduction with no queue item is a bug in the report, and the sharpest test runs the other way too: a suppressed accepted-exception (A4's fixture shape) must not deduct.
Assert the decomposition: no score renders as a bare number — every row carries all six sub-scores, and a re-run reports per-dimension deltas, not just the total. This is figma-standard rule 17's *why* enforced structurally, not a formatting preference.
Assert the N/A discipline: a non-interactive component's States dimension reweights pro-rata rather than scoring 0 or 100; an *unscanned* dimension does the same but marks the score partial and names the gap — silence in arithmetic obeys the same §11 rule as silence in a report, and a partial score without its exclusion list is a false claim of coverage.
Assert the gate: a component with an unused property (A12's fixture) scores at most 25/100 regardless of its other dimensions, with the cap's reason on the row — a component consumers never receive must not outscore one that publishes with warnings.
Assert the trigger boundary: no score, no score report, and no per-component numbers appear in any audit output unless the maintainer asked for scoring in that conversation — the default report remains the exception-based fix queue, unchanged.

Walked live: 2026-08-13 — a progress bar binding an alpha soft-surface token against the opaque inverse token.

## A30 · A bucket silently stopped rendering as a table, and the fix was inferred rather than observed — CAUSE STILL UNKNOWN
Fixture: two consecutive 2026-08-14 Project A reports. In both, bucket 4 was authored as a well-formed markdown table and reached the maintainer as plain prose while buckets 1 to 3 rendered as tables on the same screen. The maintainer twice asked why breaking changes came without a table, and on being asked what he actually saw, answered: plain prose, no grid.
Assert the confirmed symptom, which is all that is confirmed: a bucket's table markup can fail to be recognised at all, in a message whose other tables render, and **the author cannot see it** — the report renders correctly in the environment it was composed in.
Assert the diagnostic failure, which is this case's real content: the first fix was reasoned out, not observed. Both rows happened to quote variant option lists (`Type{Default|Outline|Ghost}`) with pipes escaped as `\|`; escaped pipes genuinely can split a row, so the inference was plausible, and 1.18.0 shipped a rule against them. The next report contained no pipes in any cell and **still rendered as prose**. The hypothesis was wrong, and shipping it consumed the version number that a correct fix should have had.
Assert what the pipe rule is now worth: keep it, since a raw or escaped pipe in a cell does break tables in some renderers, but it is a defensible precaution rather than the cause of this incident. Its changelog entry claimed the latter and is corrected accordingly.
Assert the surviving hypothesis, untested: bucket 4 is reliably the widest and longest-celled table in every report, since "fix + blast radius" carries more text than any other bucket's columns. A renderer that abandons tables past a width or length budget would produce exactly this, and would explain why the same bucket fails across two reports with nothing else in common. A short-celled version was sent as a test and the answer never came back.
Assert the discipline the episode teaches, which is the transferable half: **a rendering failure you cannot observe is diagnosed by asking, not by inferring.** One question to the maintainer ("what does it look like?") cost one round trip and eliminated the wrong hypothesis immediately; the inference cost a version, a rule, and two reports that still did not render. The general form is already in the file as the instrument rule — a probe you cannot see the output of is not a probe.

Read by: the maintainer, 2026-08-14 — reported bucket 4 arriving as plain prose in two reports whose other buckets rendered; cause still unknown.

## A31 · A rule with no detector is not a check — text with no text property, found by a human after a clean audit — WALKED 2026-08-14, both directions
Fixture: a one-variant `Message card` whose entire content was an unbound lorem paragraph and which exposed **zero** component properties. It cleared a full 14-set audit with a 100% coverage line, and the gap surfaced only when the description was being written and the author had to decide whether the message was settable. The maintainer: "you should have flagged this before".
Assert the mechanism, because it is the transferable part: conventions §7 had required this since the file was written, and the nearest script (§3.8) ends in `.filter(t => t.boundToProp)` — it returns only layers that **already have** a property, discarding exactly the population the rule is about. A rule stated in the conventions file and absent from the scanner file reads as covered in both: the convention looks enforced, and the scanner looks complete.
Assert the trigger correction: **variance across variants is evidence, never the trigger.** The obvious implementation diffs `characters` across variants, and cannot fire on a single-variant component or on text held identical across a set — the two shapes where a missing property is most likely. The separating question is whether a consumer would ever legitimately set the string.
Assert the latent bug the new §3.8a fixes and §3.8 still has: `set.children` on a plain `COMPONENT` is its **layers**, not its variants. The older walk therefore mislabels every finding on a non-set component, which is the same component shape this case is about.
Assert the negative, now walked: §3.8a is **silent** on `Message bubble`, `Message card`, `Toast`, `Text input` and `Button` across all 54 of its variants, and silent on `Avatar` *after* the missing property was added — the same component that fired before the fix. One component answering both ways across a single change is the strongest fixture available, because it holds every other variable constant.
Assert the distribution: 7 of 71 sets (10%), lumpy rather than universal. A text-property check that fires on most of a library is measuring the check, not the library.
Assert why the agent layer is not optional here, which the sweep demonstrated better than the argument for it did: four of the seven hits are cleared on sight as static by design, two being the exact examples the conventions name (`Calendar`'s 28 weekday labels, `_Label / Default`'s asterisk). A scanner-only version reports all seven, and a maintainer who is wrong four times out of seven stops reading the queue.
Assert what remains unproven, because a walk that claims more than it did is worse than none: the `SLOT` exclusion branch ran but never had to suppress anything — no component in the fixture library holds text directly inside a slot. It rests on the 2026-08-13 ruling, not on this walk.

Walked live: 2026-08-14 — `Message card` and the §3.8a sweep over 71 sets, both directions; the `SLOT` branch never had to suppress anything.

## A32 · A file-level rule with no file-level check — page ordering, spotted by eye after every audit missed it — WALKED 2026-08-14, both directions
Fixture: a 67-page library across 10 categories, and a maintainer's screenshot of the pages panel showing `Date picker` sitting after `Dropdown menu` under `❖ SELECTION`.
Assert the gap this pins, which is structural rather than a bug: **figma-standard rule 11** (categories alphabetical, pages alphabetical within each) was admitted 2026-08-10 against two live projects, and that standard's own checkability paragraph recorded plainly that **no skill implemented it**. It stayed that way for four days and through several full audits of the very file that had drifted. Every check in this skill was set-level — given a component, walk it — so nothing ever read the page list. **A rule can be correctly written, correctly recorded as unimplemented, and still surprise everyone when it fires**, because "stated as an honest gap" reads like coverage to whoever is skimming.
Assert the walk, both directions in one run: 10 section names alphabetical and 9 of 10 sections internally alphabetical — silence where the file is right — with exactly one hit, the pair from the screenshot. Fixed with `figma.root.insertChild`, then re-verified from a **fresh** walk rather than from the mutated in-memory array: zero findings, page count unchanged.
Assert the three traps, each of which invents findings rather than missing them: comparing names with `<` sorts by code point, so any capitalised or accented page mis-sorts against a lowercase neighbour; counting cover and `---` divider pages as section members shifts every index and puts an unsortable name inside a category; and a project that deliberately pins a catch-all category last is exercising the exception that rule itself records, not violating it.
Assert the negative that matters most for future checks: this is the first **file-level** check in the file, and a per-component audit will never surface it no matter how thorough. When a standard's rule is about the file rather than its components, ask which scope the detector needs before writing it — set-level was not a wrong implementation of this rule, it was no implementation at all.

Walked live: 2026-08-14 — a 67-page library's page order, one hit fixed and re-verified from a fresh walk.

## A33 · A convention with no detector, and a detector that reported the convention — naming case — WALKED 2026-08-20, both directions
Fixture: a library swept to sentence case earlier the same day, holding two surviving defects — `Font/Weight/SemiBold` (the only camelCase segment anywhere) and five capitalised value leaves (`Font/Weight/Medium`, `Font/Family/Text`, …) beside the lowercase leaves of another collection. Both were found by a maintainer reading the variables panel, after a full context capture and two bulk renames had walked past them.
Assert, on the split half: a name space containing two names differing only in case is reported every time, with no convention consulted, because every export path lowercases and the two become one token. It fires on the real case in the fixture library — a `switch` graphic beside the `Switch` component set — and reports it as **advisory** there, since components are not exported and nothing collapses.
Assert, on the convention half: **the skill never states which case.** It hydrates the convention from the project context document and, where that is silent, cites figma-standard rule 18 by handle. A version of this check that named the case would freeze a copy of the rule inside a skill, where a project document outranks it — the failure toolkit-standard §C names and the reason the maintainer rejected the first design.
Assert the control pass, which is the load-bearing half: **run against a library already conforming, the check must be silent, and it was not.** It fired four times, and two were bugs in the check rather than facts about the file. (1) A segment with a leading digit (`9-source`) has letters, escaped the non-alpha guard, and was classified `mixed`, making three correct `Utils/*` leaves look like a minority against eight correct ramp anchors. A segment not starting with a letter is now excluded, not classified. (2) All non-leaf segments were pooled, so `Heading` and `md-medium` in one path were compared to each other and one collection reported 54 lowercase against 54 capitalised — the convention as its own violation. Bucketing by depth fixed it. **The first draft claimed to have fixed (2) already**, by splitting leaf from the rest; it had moved the bug one level in, which is why the assertion here is that the check runs clean on a conforming library rather than that it was written carefully.
Assert the minority is never auto-reported as a defect: 20 lowercase icon and graphic names against 22 capitalised components is the imported-asset carve-out, and `Elevation/Raised` is a capitalised leaf that figma-standard rule 18 carries on an explicit allowlist.
Walked 2026-08-20: forward against the morning's state (both defects reported), backward against the corrected library (silent across all five variable collections and both style types), and the two component hits confirmed correct by hand.

Walked live: 2026-08-20 — forward against the morning's state, backward against the corrected library.

## A34 — a long cell un-tables a bucket

**Fixture:** the audit report sent 2026-08-20, second re-run. Bucket 1: three rows, four columns, longest cell ~90 characters. Bucket 3: one row, five columns, `Question` cell ~250 characters because a correction to an earlier finding was folded into it.

**Assertion (negative, and it is the sharp one):** bucket 3 **must not** render as a table for the author while rendering as `#:` / `Sev:` / `Where:` / `Question:` / `Rec:` key-value pairs for the maintainer. It did exactly that, in the same message where bucket 1 rendered correctly — which is what rules out row count and column count as the cause and leaves cell width.

**Assertion (positive):** with the correction moved to a note under the table and the `Question` cell cut to one sentence, the same bucket renders as a table. Walked 2026-08-20 in the following message; the maintainer did not report it again.

**What this case is really pinning:** not the character budget, which is a guess calibrated to one observation, but the diagnosis route. Four earlier rendering failures were reasoned about and one of the four hypotheses was flatly wrong (1.20.0 withdrew it). This one was settled from a screenshot in one round trip. When a bucket does not render, ask to see it before theorising about why.

Read by: the maintainer, 2026-08-20 — reported bucket 3 arriving as key-value pairs, and did not report it again once the long cell was cut.

## A35 · The queue's destination is asked, and a tracker row is keyed on the finding, not its number — WALKED 2026-09-04, forward only
Fixture: a live first audit of a 38-set library producing 17 rows, 11 of them Decide items; the maintainer asked mid-run for the queue as a page he could tick and comment on, and afterwards asked that the choice be offered up front.
Assert the question exists and where it sits: step **2b**, folded into the step-2 rulebook confirmation the skill already stops for. A separate later prompt would be a second interruption for something the maintainer can answer once, and asking at report time is worse still — by then the `.md` mirror has already been written or skipped on the wrong assumption.
Assert the sharp negative, which the live build got wrong before the rule existed: a tracker row **must not** be keyed on its bucket number. The published page used `r1-1`, `r3-8` and so on, and the skill's own template says numbering "resets per report … a same-conversation handle, not identity across re-runs". So the second audit would have carried a ruling written against `3.8` (an eighth Decide row about a page category) onto whatever renumbered into eighth place — a wrong answer attached to a real finding, with nothing in either report to reveal it. Identity is the Where path and node id, exactly as the template already says for the chat report; the tracker inherits that rather than inventing its own.
Assert the second negative: the tracker **does not replace the chat report**. A link with a count under it leaves no queue in the transcript, so the next session — which reads the conversation, not the page — inherits nothing. It replaces the `.md` mirror only, whose job in a terminal is to hold the deep links, which the page does carry.
Assert the honest limit of this walk: only the forward direction ran. State was read back once (`read_db` over `rows` returned no documents — the empty store, which proves the read path but not the mapping) and no second audit has yet been run against a populated tracker, so **the re-run mapping is asserted and untested**. Owed on the next re-audit of any library that chose the tracker.

Walked live: 2026-09-04 — a first audit of a 38-set library, forward direction only; the re-run mapping is untested.

## A36 · A tracker cannot make itself current, and a full-document write erases what it does not own — WALKED 2026-09-04
Fixture: the live 17-row tracker from A35, six rows ticked by the maintainer, re-checked against the Figma file from the session that holds the bridge.
Assert the constraint that shapes the whole feature, and which neither 1.26.0 nor the maintainer had stated until he asked for "a plugin or something that says update audit": a **Figma plugin has no route into an artifact's database**, and the artifact page has no route into Figma — CSP blocks every socket it could open. Only a session touches both. So the re-audit is a phrase the maintainer says, never a button in either surface, and the handover must say so or the tracker ages while reading as live.
Assert the reconciliation is by key: all six ticks landed on the findings they were made against, across four republishes of the page in between. This is A35's untested half, now walked forward.
Assert the case the re-audit exists to produce, observed on the very first check rather than imagined: a row the maintainer had ticked was **half done**. `_Label`'s `Required` axis had its options reordered but its default variant untouched, so the axis went from self-consistent to contradictory — options reading `False · True` while the default stayed `True`. A tick cannot express that, and only a run that read the file could. It resolves to `verified: false` plus what is still wrong, never to silently clearing the row.
Assert the write discipline, which is a silent data-loss bug rather than a wrong report: a store document write is a **full replace** and the store is last-writer-wins, so the page's note-save would have erased the session-written verification stamp the moment the maintainer typed in that row's note. Found by reading the save path, not by any check. Read, merge, write — and the same rule binds the session, which must carry the maintainer's note and tick forward when it stamps.
Assert the negative on authority: the page records that a check was *requested* (`meta/recheck`) and never writes a verification stamp itself. A surface that cannot see the file must not be able to assert that a fix landed, or the document starts claiming things nothing measured.

Walked live: 2026-09-04 — the live 17-row tracker with six maintainer ticks, re-checked against the Figma file.

## A37 · A re-run's delta goes in the doc, and the doc has to say it changed — WALKED 2026-09-04
Fixture: the first live re-audit against the tracker — 48 sets against a stored 38, six rows cleared, five new, two checked and not clear — reported as a full chat table *and* written into the tracker.
Assert the ruling and its shape: the maintainer's response was "when I ask you to recheck audit I need the updates in the doc only not here." A re-run writes the summary to `meta/lastRun` and answers in chat with one line. 1.27.0 had explicitly asked for the delta in chat, so this is the pre-tracker habit surviving into the arrangement built to end it — the same shape as 1.25.0's `systems/`, a retired practice living on in the file that executes.
Assert the exception, which keeps the rule from eating the record: **the first run still gets the full chat report.** There is no doc to read from yet, and the transcript is what a later session inherits. Doc-first applies from the second run on.
Assert the negative the ruling forced into the open, and the reason the change is more than deleting a table: **suppressing the chat delta is only safe if the page carries one.** Without the banner the maintainer opens a document that moved rows and added rows since they last looked, with nothing naming what or when — strictly worse than the duplication being removed. `meta/lastRun` is written in the same pass as the stamps, never after.
Assert the second omission the same run exposed: **new findings require republishing the page.** Row definitions are static HTML and only their state lives in the store, so a stamps-only re-run leaves new findings invisible and cannot reword a row whose question has narrowed — as `file-auxiliary-category`'s had, once the category itself was ruled legitimate and only its position was still open. 1.27.0 never said this; the run needed it.
Walked forward only: the ruling landed on this run and the banner was written and rendered. The next re-audit is the backward direction — chat must carry one line and nothing else.

Walked live: 2026-09-04 — the first live re-audit against the tracker, forward only.

## A38 · A measure that is not recomputed is a claim nobody checked — WALKED 2026-09-04, forward only
Fixture: one library, four runs in a single day, and a queue artifact whose metrics strip had been written once.
Assert the failure that justifies the whole feature, observed rather than argued: the queue's contrast tile read **59 / 60 pass** for hours after the failing pair was fixed by row 1.1. The re-audit had recomputed findings and not measures, so a defect that no longer existed was still being asserted by the document the maintainer was reading — and it was he who noticed, saying the failing pair was "not mentioned anywhere else". A stale measure is worse than a missing one: it is a confident claim with nothing behind it.
Assert the rule that follows, and its shape: **recompute every measure on every run, and drop any that was not recomputed** rather than carrying it forward. The dashboard omits a tile it has no fresh figure for; it never shows a stale one.
Assert why the record is separate from the queue and what that costs: an artifact's database belongs to that artifact, so the record cannot read the tracker's rows and the run writes to both. That is the price of the split, and it is why the write is a numbered step in the workflow rather than a convention — a convention would be skipped once and then drift forever.
Assert the two presentation rules, both of which exist to stop the page being trusted more than it has earned: **the age sits beside the title**, because an unqualified green figure invites more confidence than an unchecked one deserves; and **deferred is visually distinct from outstanding**, because a measure parked by a recorded ruling (annotations, on this library) rendered as amber teaches the maintainer to ignore amber.
Assert what the registry answers that no queue can: which run found a given thing, and where its queue is. Before this, the audit artifact existed only as a URL in one terminal transcript.
Walked forward: built, seeded with four real runs, coverage trend rendering 99.42 → 100. **Owed:** the next re-audit must refresh `libraries/<fileKey>` and append a `runs/` row without being told — that is the assertion this case cannot make yet.

Walked live: 2026-09-04 — the record built and seeded from four real runs of one library, forward only.

## A39 · An in-place artifact's URL is its identity, and losing it fails silently — RECORDED 2026-09-04, not walked
Fixture: a session holding a tracker and a health record it had published itself, and a maintainer asking whether the next audit would create a new document or update the existing one.
Assert the answer and the condition on it: **updates — if the run can find them.** Both artifacts are updated in place on every run, so the URL is the identity rather than a convenience. Nothing in the skill had written that down, which is exactly why the question could be asked of a working system.
Assert the failure mode, which is the reason this is a step and not a nicety: a session that cannot find the tracker **does not fail**. It publishes a second one, correctly, and every tick, note and ruling in the first is stranded — discoverable only by someone opening the old URL months later and finding it frozen. A loud failure needs no rule; this one does.
Assert where the registration goes: the project's context document, in the file registry beside the Figma files, for both artifacts, written the moment each is created rather than at the end of the run that created it.
Assert the other half, added the same day because registering only helps a session that **reads** the registry: a run **looks before it publishes** — context document registry first, then the Artifact tool's `list` action — and only an empty result after both permits creating one. Where the search is empty but the maintainer talks as though a tracker exists, ask for the URL rather than creating a second.
Assert why the search cannot be skipped on a hunch: the duplicate publishes cleanly and renders perfectly. There is no error, no conflict and no visual difference between a fresh tracker and an abandoned one — the only symptom is a maintainer opening the old URL later and finding it frozen at the day it was orphaned.
**Not walked, and it cannot be from inside a session that already holds the URLs.** The real test is a fresh session asked to update the audit with no transcript: it must find both URLs in the context document, or via `list`, and update in place. Owed on the next cold start.

Not walked.

## A40 · A template nobody has published from is a draft — WALKED 2026-09-04
Fixture: a health record built by hand for one project, and the intent to point the skill at a second.
Assert why the page belongs in `assets/` rather than being rebuilt per project: one record per project means a second project needs a second page, and a hand-built one drifts in exactly the details that let two projects be compared — tile order, thresholds, what counts as deferred. Re-deriving costs a session what publishing costs once.
Assert the generalisation that mattered most, because it is the one a sweep misses: the deferred-measure tile had **a project's ruling written into the page** as the reason a measure was parked. Reasons now come from `libraries/<fileKey>.deferred`, a map of measure key to why — data the project owns. A template that knows which measures are parked is carrying one project's decisions into the next, which is clause D's boundary wearing a different hat.
Assert the walk, which is the assertion: the template was used to **rebuild the live record and republish it**, with one edit (`<title>`) and no other change, and the page rendered identically with the parked tile now driven by `deferred`. An asset that has never been published from has not been shown to be a template.
**Owed:** a second project. Everything above is proven against one, and "portable" claimed from a single instance is a hypothesis.

Walked live: 2026-09-04 — the live health record rebuilt from the shipped template and republished.

## A41 · Storage plus a view is not a feature until something recomputes it — RECORDED 2026-09-05
Fixture: change detection and a score table, both built, seeded and rendering correctly, and neither written into the workflow.
Assert the failure, which the maintainer found by asking rather than by anything failing: "will this be reflected automatically in the audit?" — no. The fingerprints were stored, the Components view read them, and no step recomputed them, so the baseline would have sat there looking authoritative and never moving. A stale figure at least ages visibly; a baseline that never diffs reports "nothing changed" forever, which is indistinguishable from a healthy library.
Assert the rule that follows and where it lives: step 6 of the re-audit names **all four** documents — `libraries/`, `runs/`, `fingerprints/`, `scores/` — and states that a partial write is worse than a stale record, because an internally inconsistent record is one nobody can reason about.
Assert what fingerprints are uniquely for, since every other check would have to re-read the whole file to notice: a component edited **after** it was cleared. Nothing else here looks backwards at a row already stamped.
Assert the scoring boundary, measured on the first live table: **only verified findings deduct.** 114 property descriptions are missing across the library and none deducts anything, because none was ever raised as a finding — deducting for it would be inventing a finding inside a report. Median 100, 46 of 48 at full marks.
**Not walked:** the next re-audit is the walk, and its assertion is that all four documents move without being asked.

Not walked.

## A42 · The cheap question is worth separating, and the page cannot ask it — WALKED 2026-09-05 (negative half)
Fixture: a library with a health record, and a maintainer asking whether change detection could happen automatically after an edit.
Assert the split and why it pays: nothing pushes from Figma, so every answer needs a read — but **"has anything moved?" is a fingerprint diff of seconds** while "what is wrong?" is minutes of scanning and judgement. Welded together, the cheap question never gets asked, and the file drifts between audits nobody wants to pay for.
Assert what a sweep must not do: it raises no findings, stamps no row, clears nothing, and writes nothing to Figma. **A moved fingerprint says a component was edited, not that it broke** — a sweep that cleared or flagged rows would be asserting a judgement it never made.
Assert the negative, which is the walked half and settles a question raised twice this session: **the dashboard cannot launch it.** The page's sandbox blocks outbound calls, so the only candidate was the `mcp` capability against a local `host:` MCP server — and the declaration was **refused at publish**: "host servers aren't available in this session". Not inferred from the docs; observed from the platform. The button therefore records a request and says so, since a control that looks like it acts and only queues is worse than one that admits it queues.
Assert where the script lives: `meta/sweepScript` in the record, written by the run — so any surface that ever does get a route to the bridge runs the same definition of a fingerprint, and there is never a second copy to drift.
**Owed:** the positive half. No sweep has yet run and produced a non-empty diff; the first component edited after this baseline is that walk.

Walked live: 2026-09-05 — the negative half only: the `host:` MCP declaration was refused at publish.

## A43 · Two failures nothing reports: an unanswered flag and a property read in the wrong place — WALKED 2026-09-05
Fixture: a tracker whose page offers a "check & clear" button, and a component the maintainer had just fixed by exposing its nested instance.
Assert the first, which is a **repeat**: a run that reads the queue must write `meta/recheck` back with `handled: true`. It was left set on two consecutive days, so the button sat disabled at "Check requested" reporting a request answered hours earlier. **Nothing failed** — the flag is write-once and nothing re-reads it — so both times the maintainer found it by looking at a dead button. A failure with no symptom in the run needs a rule, not more care.
Assert the second, caught one call before it became a false finding: **"expose nested instance" adds nothing to the parent's `componentPropertyDefinitions`.** Reading those reports a correctly exposed component as exposing nothing — and the row had just been ticked, so the report would have contradicted the maintainer about work they had actually done. The flag lives on the child (`isExposedInstance`) and the consumer's view is `instance.exposedInstances`; verify on a throwaway instance and remove it.
Assert the shape both share, which is why they are one case: neither is detectable from the run's own output. A stale flag and a wrong-property read both produce clean, confident, well-formed results. The only defence is knowing where the truth actually lives.

Walked live: 2026-09-05 — a tracker's unanswered `meta/recheck` flag and a just-exposed nested instance.

## A44 · A cell that wraps three lines has stopped being read — WALKED 2026-09-05
Fixture: a tracker row whose "what's wrong" cell ran three wrapped lines of correct, well-sourced prose.
Assert the trigger, which is not length alone: the content was accurate and the maintainer still asked for it as bullets. Prose in a scanning surface is read as a block or not at all; a list of claims is the same content at a glance. **Both columns take it** — a bulleted problem beside a prose recommendation is half a fix, and the asymmetry is what the maintainer named ("same in the other column").
Assert where the rule lives: in the **data**. Claims are stored as arrays, not strings, so a future finding cannot be authored as a paragraph without visibly breaking the shape. A CSS-only fix would have held until the next row was written.
Assert the two limits, because this rule is easy to over-apply: the ~120-character budget becomes **per claim**, so three over-long bullets are worse than the paragraph they replaced; and claims are authored separately rather than sentence-split after the fact.
Assert the check the live conversion needed: 62 cells were split on sentence boundaries and it was safe **only because it was verified first** — an `e.g.` or `vs.` splits a bullet mid-thought, and the scan confirmed none were present before the transform ran.

Walked live: 2026-09-05 — 62 tracker cells converted from prose to bulleted claims, after scanning for unsafe sentence splits.

## A45 · A type floor needs its exception written as a rule, and raising type re-opens contrast — WALKED 2026-09-05
Fixture: the health record and the tracker after roughly a session of incremental edits, with the maintainer asking for "a bit more spaced, try not to have font sizes smaller than 14, contrast check".
Assert the floor and its one exception together, because a floor stated alone gets carved up quietly. 14px is the dense-UI floor Carbon and Polaris both set; 16px is reading text, one step below GOV.UK's 19. The exception is `--t-caps: 12px` for uppercase only, and it earns the carve-out on a reason rather than taste: **uppercase has a taller cap-height than lowercase at the same size**, so 12px small-caps reads where 12px sentence case does not, and 14px uppercase is simply loud. Writing the reason into the token block is what stops the exception spreading to whatever else feels cramped next.
Assert what a mechanical application of that exception cannot see. Converting every block containing `text-transform: uppercase` to the caps size left **two exceptions to the exception**, both invisible to a transform keyed on a property being present in the block: a rule that takes its size from a shared group (`.tier` inheriting from the chip base) never matched at all, and rules that opt *out* of uppercase (`text-transform: none`) while sharing that base were silently shrunk to 12px. The check is not "did the transform run" but "does every uppercase rule now read caps, and does every non-uppercase rule not".
Assert the ordering, which is the part easy to get backwards: **contrast is re-measured after the type pass, not before.** Raising a figure from decoration to text changes which threshold it must clear — the same green and amber passed 3:1 as non-text and failed 4.5:1 the moment they carried text, three pairs in the light theme. A contrast check run before the type change would have been clean and wrong.
Assert the measure rule the same pass added: reading columns cap at 66ch — Bringhurst's 45–75 with 66 as the sweet spot, and WCAG 1.4.8's 80 as the outer bound. It binds the reading column, not the page: the maintainer pasted a wall of body text as the example, and the tables and tiles beside it were never the complaint.

Walked live: 2026-09-05 — the type pass over the record and tracker, with contrast re-measured after it.

## A46 · A nested instance does not inherit its parent variant's opacity — WALKED 2026-09-05 (as a live false finding)
Fixture: a library that renders every `Disabled` variant as `opacity: 0.5` on the variant root, and a Nudger whose minus button is a nested `Icon button` instance at `Disabled=True` carrying its own `opacity: 0.5`.
Assert the false finding and why it was persuasive: with a file-wide convention of root-dimming, a nested 0.5 reads as the same dim applied twice — 25% instead of 50%. The reasoning was consistent with sixteen other components and still wrong, because **an instance does not inherit its main component's root opacity**. That override *is* how the disabled child renders; clearing it made the control look enabled, and the maintainer caught it from a screenshot after two exchanges in which the audit had been confidently defending the fix.
Assert the half that was real, since the case is not "the finding was wrong": the same set's `Disabled=True` variant genuinely carried a nested override inside an already-dimmed root, and that one did multiply to 25%. A finding can be half true, and the half that survives has to be stated as narrowly as it actually holds.
Assert the check that would have caught it: compare the instance's opacity against `(await inst.getMainComponentAsync()).opacity` rather than against the library's convention for parents. The convention describes what a *variant root* does; it says nothing about what an instance of that variant must carry.
Assert the discipline this is really about: **a claim about rendering is verified by rendering it.** The node data was read four times across four calls and agreed with itself every time, because every read was asking the same wrong question. One `figma_capture_screenshot` of the set answered it immediately, and now closes any finding that asserts how something looks.

Walked live: 2026-09-05 — a live false finding on a Nudger's nested `Icon button`, withdrawn on a maintainer screenshot.

## A47 · A refusal answers the question it was asked — RECORDED 2026-09-05
Fixture: a health dashboard whose sweep button records a request, and a skill asserting since 1.35.0 that the page cannot launch the sweep itself.
Assert what was actually tested and what was written down. The test was real and reproduces: declaring a local `host:` MCP server is refused at publish with *"host servers aren't available in this session"*. What got recorded was the much larger claim that **the page cannot reach Figma** — and that one was never tested, because the narrower result felt conclusive enough to stop.
Assert the route that was there all along: a **claude.ai connector** is not a `host:` server. The bridge in use publishes a hosted endpoint that relays to the same desktop plugin through a pairing code, and a page declaring `mcp` against that connector calls `figma_execute` directly, with the viewer's credentials. It sat one section down in the bridge's own README for the whole two versions the skill spent asserting the opposite.
Assert why an evidence-backed negative is the dangerous kind. A guess invites a re-check; *"tested rather than assumed"* in a changelog reads as closed, and the maintainer had to ask three times — the third time saying explicitly that leaving the bridge open was no burden — before the assertion was re-examined rather than re-quoted.
Assert the rule, which is narrower than "test more": **a refusal answers the question it was asked.** Record the refusal at the scope it was tested — "local MCP servers are rejected" — never at the scope you wanted to settle.
Assert the shape the button now takes, since most viewers have neither connector nor pairing: try `claude.use("mcp")`, fall back to recording a request when it resolves `null` or the call returns `server_not_connected`, and keep the fingerprint definition in `meta/sweepScript` so the page and a session cannot drift.
**Owed:** the positive walk. No connector has been paired yet, so the in-page sweep has not run.

Not walked.

## A48 · The page can run the audit — four constraints, each found by breaking something — WALKED 2026-09-05
Fixture: a health record with a sweep button, a hosted MCP bridge added as a claude.ai connector, and a maintainer who has said three times that he wants to work without the terminal.
Assert the outcome first, because it overturns two versions of recorded doctrine: the page swept a real library, diffed 54 sets, scanned the four that moved and wrote the result into its own store, with no session involved. A47 identified the route; this walks it.
Assert the session-binding, which cost two failed pairings: the server stores the relay id in **that MCP session's own storage**, so a pairing code redeemed in a chat binds the chat. The page keeps pointing at whichever relay it last knew and reports *"no plugin connected to cloud relay"* — a pairing failure that reads as a tool error, and the wrong thing to debug. **The page must call the pairing tool itself** and render the code. This was settled by reading the server's source, not by retrying.
Assert the file-binding: a Figma plugin instance is per-file, so opening another file kills the paired one. Pair from the library; do not switch files between pairing and running.
Assert the guard, which is the expensive one. A hosted call takes **no `fileKey`** — it reads whatever the plugin is paired to. The first live sweep read a different file, reported all 54 sets as removed, and **that document replaced the baseline**: silent, immediate, and not recoverable from the page. The script must return the file's identity and the caller must refuse to write on a mismatch. A destructive default belongs behind an assertion, not behind a comment.
Assert `cache: false`, since a fingerprint replayed from the call cache reports "nothing moved" with total confidence — the one wrong answer this feature must never give.
Assert that the judgement half is not optional: the scanner produces candidates, and `sample` decides which survive the project's recorded rulings, read from `meta/rulebook`. Ship the scanner alone and every accepted exception returns as a defect on every run. Where `sample` is unavailable, candidates are shown **labelled unjudged**.
Assert the boundary that remains: **a page cannot write another artifact's database.** An in-page audit records into its own store and a session merges it into the tracker; the tempting fix — a second copy of the queue's rows on the dashboard — is the drift this skill exists to catch.
**Owed:** the judgement pass. The first live audit produced zero candidates, verified independently from a session, so `sample` never executed.

Walked live: 2026-09-05 — the page swept and scanned a real library over a hosted connector, with no session involved; the judgement pass never executed.

## A49 · A check that fires on everything is wrong three times running — WALKED 2026-09-05
Fixture: a library where one of eight focus rings binds `Stroke/2` while the other seven bind `State/Focus/stroke-width`. Both resolve to 2px, so nothing looks wrong and no existing check sees it — the scanner asks whether a value is bound, never *which* token it is bound to.
Assert the real finding first, because the case is not "the idea was bad": the odd ring is a genuine defect, it was found, and it is in the queue. A change to the focus treatment would have reached seven rings out of eight.
Assert the three attempts, since the numbers are the argument. Naive sibling comparison: **45 findings across 46 sets** — a hover variant binding a hover token is correct, and the check called it a defect every time. Suppressing any split a *single* axis explains: **32**, because axes interact and a Validation × State combination is explained by neither alone. Narrowed to a lone outlier against a majority of four or more: **9**, of which four were the same finding repeated once per stroke side and five were still legitimate.
Assert the conclusion and where it comes from: **deciding whether an outlier is explained requires knowing what the axes mean.** That is the agent layer by this skill's own Axis 1, and the attempt was an agent-layer question dressed as a scanner check. Recognising it took three rounds of measurement rather than one round of reasoning, which is the honest cost.
Assert the discipline that saved it: the rule "a finding on everything is evidence the check is wrong" was applied at 45, again at 32, and again at 9 — the third time against a result that looked almost good enough to ship. Almost-good-enough is where a noisy check gets adopted and then ignored.
**Owed:** the judgement-layer form. The question is well posed for `sample` — give it the axes, the variant names and the outlier — and has not been tried there.

Walked live: 2026-09-05 — the whole library at three successive strictness levels: 45 findings, then 32, then 9.

## A50 · The artifact became the source of truth and nobody noticed — WALKED 2026-09-05
Fixture: a skill shipping `assets/health-record.html` as its dashboard template, and a live dashboard that a day of maintainer-driven changes had grown well past it.
Assert the drift, by size, because the number is the point: **1065 lines shipped against 2354 live.** The template was missing the merged fix queue, the action buttons, the connector calls and the ask drawer. A second project publishing from it would have got a working dashboard that was simply a week behind, with no error anywhere to say so.
Assert the other direction, which is worse: the live page had a **hardcoded Figma file key** behind every deep link and a **hardcoded connector display name**. Neither fails in a new project — the links resolve, the connector call runs, and the page audits the wrong library while looking entirely correct. Both now come from `libraries/<fileKey>` (`figmaUrl`, `connector`, `displayTitle`).
Assert who caught it: the maintainer, saying the work had to be project-portable and skill-first. No check in this repo compares a shipped asset against whatever was last published from it, and none can — the published copy is not in the repo.
Assert the rule this leaves: **whatever the session edits is what ships.** A template edited only at the start of a working day, while its published copy absorbs every change after, is a copy, not a template. Sync it back in the same session that changed the live one, and record any new database shape in its header comment — `rows/` moved into the database in this session and the header said nothing about it.

Walked live: 2026-09-05 — the shipped template compared against the live dashboard, 1065 lines against 2354.

## A51 · Cache what rarely changes instead of purifying the architecture — WALKED 2026-09-05
Fixture: a maintainer who has said plainly that re-pairing a Figma plugin on every reopen is not acceptable, and a REST route that promised to remove the plugin entirely.
Assert the wall the REST route hit: **bindings reach REST, definitions do not.** Every node carries `boundVariables` with `"VariableID:0:256"`, and resolving that to `State/Focus/stroke-width` needs the Variables REST API, which is Enterprise-gated — the bridge is documented as "the plan-independent path" precisely because of it. A fully plugin-free audit is therefore impossible below Enterprise, and no amount of scanner work changes that.
Assert why the wall does not matter, which is the case's point: **definitions change rarely.** A library gains a token now and then; it does not churn 369 between two audits. Caching the map at `meta/variables` and refreshing it from any run that does reach the bridge takes the plugin from *needed every run* to *needed when the token set changes*. That is the complaint solved. The plugin-free architecture was never the requirement — it was one route to it, and the expensive one.
Assert the two guards that make the cache safe: never store a map whose `fileKey` disagrees with the record's, and treat a refresh failure as a no-op, since a stale map still resolves every token that existed last time while a missing one resolves nothing.
Assert the reporting rule, because getting it wrong invents defects: an id absent from the cache is **unresolved, not unbound.** "We could not read the name" and "there is no token here" are different findings, and the second is a defect the file does not have.
Assert what seeding it turned up, since it argues for doing this at all: a variable named **`Viewport/screen-widht`**, the only misspelling among 369, which exports under that spelling and reaches the token file.

Walked live: 2026-09-05 — the variable cache seeded over 369 variables, which turned up the one misspelling.

## A52 · The stable path was the one we moved away from — WALKED 2026-09-05
Fixture: a maintainer who will not re-pair a plugin to run an audit, and will not accept an audit that reports less because it could not resolve a token name.
Assert what research settled, because three sessions of engineering rested on assumptions it overturns. **Figma terminates a plugin's iframe runtime every one to three minutes**, regardless of activity — the bridge's own issue #67, where keepalives and shorter ping intervals were tried and failed and the only workaround is an AppleScript that re-opens the plugin from the menu bar. Cloud Mode cannot survive that: a pairing code is single-use, so every runtime kill needs a human. **Local Mode survives it by design** — the plugin scans ports 9223–9232 on launch and a watchdog keeps probing while disconnected, reconnecting the moment a server appears.
Assert the second fact, which closes the escape route: the **Variables REST API is still Enterprise-only in 2026**, so no amount of REST work resolves a token id to a name below that plan.
Assert the resolution, which is neither of the two things being argued about: not a better pairing, not a degraded audit, but **the action moving back to the session while the page stays the record.** Sessions have used Local Mode all along and have never paired once — the same sessions that ran a 771ms full-library sweep and cached 369 variables. Pairing existed solely to put the buttons in the page.
Assert that the maintainer's actual requirement survives this: no terminal. A comment sent to Claude on the artifact wakes the session that runs the audit, so the trigger stays on the page while the work happens where it needs no pairing and loses no accuracy.
Assert the generalisation, which is the reusable part: **when a capability turns out to be unstable, check whether the stable path is the one you moved away from.** Three rounds went into rescuing Cloud Mode — auto-pairing, a REST rewrite, a variable cache — before anyone asked why Local Mode never needed rescuing.

Walked live: 2026-09-05 — the bridge's own issue #67 and the Enterprise gate on the Variables REST API, with the buttons rewritten around the result.

## A53 · A copy is always the stale one — WALKED 2026-09-05
Fixture: a skill whose delivery sections described publishing two Claude artifacts, a day after those artifacts had been replaced by a local service, and a maintainer asking whether any of it was portable to his next two or three projects.
Assert what the question exposed, because nothing failed: a fresh session on a second project would have read the skill, published a tracker and a health record, and walked straight into the pairing wall this session had already spent three attempts escaping. Stale orchestration does not error — it faithfully executes the previous design.
Assert the shipped-copy rule, with its measurement: `assets/health-record.html` was **1065 lines against a live 2704** within a day of being synced. A skill that ships a copy of something living elsewhere in the same repo has two sources of truth, and the copy is the one nobody edits — so it is always the stale one. Deleting it is the fix; syncing it harder is not.
Assert the propagation failure, which is the one that would have bitten silently and late: the scanner and sweep scripts lived **inside each project's record**. A new check would have reached whichever projects someone remembered to update, while the rest ran last month's scanner and reported as current — the same shape as the shipped copy, one level down. Shared code belongs in the shared tool and is served from it; the record keeps only what is genuinely per-project.
Assert the split that makes the difference, since it is the thing to get right rather than to remember: **shared** — the page, the server, the scripts, the checks, the scoring model, the queue's shape. **Per-project** — the rulebook, the rows, the runs, the measures, the library's identity. Every project runs the same files with a different `--data`, so nothing is copied and nothing drifts.
Assert the rule for adding a check: put it in the shared scanner, give its rule a bucket, and read any project opinion from the rulebook. A check that names one library's scale reports false findings in the next project.

Walked live: 2026-09-05 — the shipped page deleted, the scripts moved to the shared tool and served from it.

## A54 · Portability proved on a second project, and what it exposed — WALKED 2026-09-05
Fixture: `projects/project-c`, a registered project with its own context document, its own six numbered variable collections and sixteen recorded rulings — and no audit record at all.
Assert the outcome, since A53 could only claim portability from a single instance: a record hydrated from the context document, a second service on port 9230, and the page rendered **"Project C library dashboard"** from its own `libraries` entry with **zero code changes**. Both services ran at once against the same shared scanner; Project D on 9231 was untouched.
Assert what building the second rulebook taught, which is the part that generalises: **an axis with no recorded ruling is not checked.** Project D's Size runs largest-first *by its maintainer's ruling*, not by any house rule, so copying `optionOrder.Size` into the second project would have reported every Size axis in it as a defect. The entry is deliberately absent and says so. A rulebook is hydrated from a project's own document, never from the last project's rulebook.
Assert the gap it exposed, which no amount of reading would have found: **the page had only ever been seen with data.** A first run — a library recorded, nothing measured — rendered a "Measures" heading above nothing and three charts each saying "No runs yet". Technically honest and useless as a first impression, and it is the state every new project starts in. The page now branches on whether the library has any metrics at all and says what to do instead.
Assert the method, because it is repeatable: standing the second instance up is a JSON file, a port and a screenshot. **A template nobody has stood a second instance from is a hypothesis** — the same rule A40 recorded for the artifact template, met again one architecture later.

Walked live: 2026-09-05 — a second project hydrated from its own context document, a second service on port 9230, zero code changes.

## A55 · A compatibility shim is a deadline, not a layer — WALKED 2026-09-05

Walk: `tools/figma-audit/dashboard.html` at 1.47.0, one day after the artifacts
were retired and after a full code review had already passed over it.

Assert the shape of the miss. The architecture had moved; the *code* had not. A
`window.claude` object stood in for the artifact runtime so that `claude.use("mcp")`
and `callTool(FIGMA_SERVER, "figma_execute", {code, timeout})` still resolved — a
faithful impersonation of a sandbox that no longer existed, wrapping a socket one
function call away. Nothing was broken, which is exactly why it survived a review:
**a shim reads as a layer, and a layer is not a defect.** It is a deadline. Left
past its port, it keeps a codebase fluent in a language nothing in it speaks.

Assert what the shim was hiding, because this is the reusable part. Underneath it
sat **eight error codes only the artifact's MCP capability ever emitted** —
`needs_reauth`, `approval_required`, `not_granted`, `server_unavailable`,
`upstream_error`, `cancelled`, and a regex matching `cloud relay|pair_plugin`.
Every one read as careful error handling. None could fire. Two of the branches
contained a duplicated `say(x), say(x)` that no reader would ever have seen,
because nothing reaches the line. **Dead branches under a shim do not look dead**;
they look like the thorough handling of an API you no longer call.

Assert the three real defects that only surfaced once it came off, none of which
were findable by reading the shim itself:

1. `paintPlugin` fell back to `files[0]` whenever the record had not yet loaded,
   so a second project displayed a green **"Figma connected"** naming *another
   project's* library. The two libraries in play were both called "UI library",
   so the label read as correct. Now: no library key, no claim of connection.
2. A 14-character placeholder in `~/.figma-dashboard-key` satisfied the service's
   only test (`ANTHROPIC_KEY ? …`), so `/status` reported Claude available, the
   page offered the judgement pass, and the run died at the end with the API's own
   prose — *"Audit did not run (API key is invalid.)"* — naming a thing the reader
   cannot fix from the page. The service now shape-checks the key on startup and
   reports it **absent**, which routes the page into the scanner-only branch it
   already had and always handled correctly. **A malformed credential should fail
   at load, where the operator is, not at the end of a long action, where the user is.**
3. The record's eleven historical runs still carried `artifactUrl` fields pointing
   at the retired page. The page never rendered them, which is why nothing caught
   it — **data outlives the code that read it**, so a migration has to sweep the
   record, not only the renderer.

Assert the check that would have caught it, and that it is cheap: after retiring a
delivery mechanism, grep the whole tree for its vocabulary — the capability names,
the transport names, the error codes — and require every surviving hit to be either
*rationale* (why we do not do that) or a live call. `bridge.exec` unwrapping the
plugin's own `{success, result}` envelope, which deleted nine call-site lines,
was available the whole time and invisible while the shim's return shape had to
match an artifact's.

Walked live: 2026-09-05 — the `window.claude` shim removed from `dashboard.html` at 1.47.0, surfacing three defects it had hidden.


## A56 · A null verdict renders as a clean bill of health — WALKED 2026-09-05

Walk: Project C's Button, Checkbox and Avatar through both halves of the audit —
the scanner over the bridge, then the judgement pass over the proxy — on a
library with no prior audit, so the candidate list was real and unfiltered.

Assert the failure, which produced **no error anywhere**. The scanner raised 19
candidates. The verdict call carried a hardcoded `max_tokens: 2000`, and the
answer ran out of budget two thirds of the way through — ending mid-string,
inside the sixteenth finding. The greedy `/\{[\s\S]*\}/` extraction matched
from the first brace to the last one present and returned unterminated JSON.
`askClaude.json` caught the `JSON.parse` throw and **returned `null`**. The
caller read `(verdict && verdict.sets) || []`, counted zero findings, and said:
*"Nothing to fix in 3 components."*

Assert why each step was individually defensible, because that is the shape of
the bug. A default token budget is ordinary. A greedy brace match is the normal
way to pull JSON out of a fenced reply. Returning `null` rather than throwing is
a common, cautious-looking choice. **The three compose into a tool that reports a
clean library when it ran out of room to think.** A missed finding announces
nothing; the reader has no reason to look again.

Assert the rule, which generalises past this page: **a parser that returns `null`
on failure is only safe where the caller can tell `null` from empty.** A
judgement layer structurally cannot — "nothing was wrong" and "nothing came back"
are the same value and render identically. In that position the parser must
throw.

Assert the second rule: **infer nothing you can be told.** Truncation was
detectable from `stop_reason` on the API response the whole time; deriving it
from a failed parse cannot separate "ran out of budget" from "answered in prose",
and those want different messages. The service now passes `stop_reason` through
and the page reports the two cases apart.

Assert the fix held, on the same 19 candidates: budget `800 + 160 × candidates`
(3840 here), reply complete with `truncated: false`, parsed, and the judgement
layer kept **2 of 19** — dropping 17 the project's own rulings already cover,
which is the layer doing exactly its job.

Assert the method, since it is the reusable half: this was invisible to reading
and to every static check. It surfaced only from running both halves against a
library whose candidate list nobody had curated. **A judgement layer tested only
against a clean library is untested** — Project D's Button returned 0 candidates
and would have passed this forever.

Walked live: 2026-09-05 — three Project C components through both halves of the audit, 19 candidates, before and after the budget fix.


## A57 · Shared code carried one project's constants — WALKED 2026-09-05

Walk: a full first audit of Project C's 64 component sets through the shared
scanner, immediately after A54 had "proved" portability by standing up a second
service and rendering its page.

Assert what portability testing missed. A54 proved the *page* was portable: a
second project's record, a second port, the right title, zero code changes. It
never ran the shared **scanner** against the second library, and that is where
the project-specific content had gone. `tools/figma-audit/scripts/audit.js`
opened with `const SPACING=[0,4,8,12,16,20,24,32,40,80], RADIUS=[…],
COLL="Semantic"` — Project D's spacing scale and Project D's semantic collection
name, in a file 1.47.0 had just made every project share precisely so checks
would propagate. The propagation worked. So did the contamination.

Assert the damage, which was quiet and large. Project C's collection is named
`3. Semantic`. A full scan raised **227 candidates, of which 157** read
`fill from 3. Semantic/Background/Neutral/soft (expected Semantic)` — against
bindings that were every one of them correct. Nothing errored. The findings are
individually plausible, uniformly formatted, and wrong at scale, which is the
worst way for a rule to be wrong: 157 of them is not a bug report, it is a
maintainer concluding the tool is noise.

Assert the second instance of the identical shape, found only by reading what
survived. The text-role check tested `!/\/Text\//.test(t.name)` — a LEADING
slash. Project D names text tokens `Colour/Text/Neutral/strong`, which matches.
Project C names them `Text/Neutral/strong`, where the segment is first and the
pattern cannot match, so **every text fill in the library** read as "not a Text
role". Two constants, two libraries, the same failure: an assumption that was
never a rule, only a description of one file.

Assert the design rule, which is stronger than "parameterise it": **a missing
project rule SKIPS its check; it never falls back to a default.** Every default
available in shared code is some other project's answer, and a borrowed default
does not fail loudly — it produces confident findings that look exactly like
real ones. Project C records no spacing scale (its document names `Spacing/*`
and never enumerates the steps), so the on-scale/off-scale annotation does not
run there at all. That is the correct outcome, not a gap to fill.

Assert the measurement: the same scan, with `semantic`, `spacing` and `textRole`
hydrated from each project's `meta.rulebook.tokens`, raises **70** candidates
against 227. Nothing was suppressed by a ruling; 157 findings simply stopped
being generated, because they had never been about project-c.

Assert the general lesson, which sharpens A53's: **moving a check into shared
code is only half the job — the other half is proving nothing project-specific
came with it.** The test that finds this is running the shared thing against a
second library, and it is the one test a single-project repo cannot perform.
A53 said a copy is always the stale one; A57 says the original is always the
contaminated one.

Walked live: 2026-09-05 — a full first audit of Project C's 64 sets through the shared scanner: 227 candidates, 70 after hydration.


## A58 · A specification in prose guarantees a second implementation — WALKED 2026-09-06

Walk: the maintainer stating the requirement outright after two earlier
portability asks had been answered and closed.

Assert the gap, measured rather than asserted. `references/scanner-checks.md`
documents roughly twenty-five checks across eleven dimensions.
`tools/figma-audit/scripts/audit.js` emitted seven rule families:
tokens, naming, schema, states, metadata, structure, properties. Missing
entirely: text-on-surface contrast in every mode, focus-renders, target and text
size, detached-frame candidates, instances with no main component, page and
category ordering, naming case beyond `Frame 12`, state coverage, text overflow,
fixed-height text, slots and overlay anatomy, GRID-mode gaps, disabled paints,
visibility-only axes, variant annotations. **Pressing Audit and running the
skill were two different audits with one name, and neither said so.**

Assert the root cause, which is not carelessness. `scanner-checks.md` was prose
with code snippets — a *specification a session re-implements by reading*. Given
that shape, a second implementation is not a mistake someone made; it is the
only thing the arrangement permits, and a third would appear the moment a second
tool wanted to scan. **A spec that must be re-typed to be executed will be
re-typed differently every time.**

Assert what "shared" had actually bought. 1.47.0 moved the scripts to `tools/`
so a new check would reach every project at once, and that worked — for the
dashboard's scanner. It shared the *wrong artifact*: the copy, not the original.
The skill went on documenting checks nobody's scanner ran.

Assert the fix and its shape: the executable moves **into the skill**
(`scanner/audit.js`, `sweep.js`, `judge.txt`), the dashboard's server serves those
same paths, and SKILL.md step 3 says *run this file* rather than *use the scans
as written*. The judgement prompt moved with it — while the page held its own
copy, the dashboard had a second opinion about what survives a scan, not just a
second scanner. The page now holds zero audit logic and is what the maintainer
asked it to be: a renderer and a launcher.

Assert the honest half, which is the part worth keeping. Closing the divergence
did not close the gap: the shared scanner is the *smaller* of the two
implementations, so a porting backlog now sits at the end of `scanner-checks.md`
naming all nineteen documented checks that do not yet run, ranked, with contrast
first. New step 3a requires them to be named under *Not scanned*. **A check
documented but not executable does not run anywhere** — and reporting silence
over it would be this skill's own "silence on pass" rule turned into a lie.

Assert the rule for closing a backlog item, which folds in A57: port it, delete
its row, and confirm it against **two** libraries before believing it. One
library cannot tell a real check from that library's own constant.

Walked live: 2026-09-06 — the documented checks counted against the rule families the shared scanner actually emits.


## A59 · A UI that describes the tool becomes a second claim about it — WALKED 2026-09-06

Walk: sweeping the dashboard for anything that *decides* rather than *draws*,
after A58 had moved the scanner into the skill and the maintainer restated the
requirement twice more.

Assert what a "renderer" still turned out to own. Four things, none of them
rendering: the bucket-1 **fix prompt** (with one project's description headings
written into it as literals); the **bucket mapping** from rule to action, which
is this skill's reporting contract; the **judgement prompt** (caught in A58); and
the About tab's **45 hand-written catalogue entries**. Moving the scanner felt
like the whole job and was about half of it. **"Source of truth" is not one
artifact — it is every decision, and decisions hide in prose and in UI copy as
readily as in code.**

Assert the worst of the four, which was the documentation. The About tab listed
what the audit checks. It was accurate as a description of the *skill* and false
as a description of what would happen if you pressed the button beside it: of 42
catalogued checks, **12 run in the scanner, 8 are agent-layer, and 22 run
nowhere**. A page that lists a contrast check next to an Audit button that has
never checked contrast is not merely stale; it is the tool vouching for coverage
it does not have. It now renders `scanner/checks.json`, marks every non-`scanner`
entry, and prints per-dimension coverage — Accessibility reads **0 of 4
automated** on the page.

Assert the structural point about the agent layer, which was invisible until the
catalogue was made explicit: the dashboard's judgement pass **filters** scanner
candidates and never originates a finding. So every `who: agent` check is
session-only *by construction*, not by omission. No amount of porting changes
that; it is a real and permanent difference between the two ways to run an audit,
and the honest response is to name it in the catalogue rather than let the page
imply parity.

Assert the self-inflicted duplicate, because it happened inside the fix for
duplication. The porting backlog was written as a table in `scanner-checks.md`
and then, an hour later, as `status` fields in `checks.json` — two homes for one
list, created by the very work meant to end that pattern. Collapsed to the JSON,
with the prose pointing at it. **The pull toward a second copy is strong enough
to survive being the thing you are currently removing.**

Assert the finding the extraction produced for free: the catalogue says bindings
resolve to an allow-listed collection **matched by key rather than name**, and
`audit.js` matches by name. Nobody would have compared the two while one was UI
copy and the other was code. It is recorded against that entry rather than fixed
in passing, because "the collection was renamed" and "two libraries publish the
same collection name" are different failures and the check should say which it
catches. **Making two copies agree is how you discover they never did.**

Walked live: 2026-09-06 — the dashboard swept for anything that decides rather than draws; 12 of 42 catalogued checks run in the scanner.


## A60 · "Full scan" is a property of what was covered, not of how it was asked — WALKED 2026-09-06

Walk: Project C's first real audit, driven by clicking the page's own Audit
button over CDP rather than replaying `runAudit` in a script — replaying it would
have been a second implementation of the run, which is the thing this whole arc
removes.

Assert the first bug and its shape, which is the transferable one. The scanner
returned `measures` only when `TARGETS` was empty, on the reasoning that a
partial scan's counts must never overwrite a library measure — three sets'
counts written over sixty-four's would report a collapse that never happened.
The reasoning is right; the **test** was wrong. The dashboard audits everything
by enumerating all 64 sets from the fingerprint baseline, so an exhaustive scan
arrived as a non-empty list and read as partial. **A guard keyed on the shape of
the request instead of the coverage of the result**: the page could never write
measures, and after three successful audits the record still held `metrics: {}`
and the page still said "Nothing measured yet". Now the gate is `skipped === 0`,
which is what full means.

Assert the second, which had been latent since the schema was written. The trend
charts read `coverage`, `sets`, `variants` and `variables` **off each run**, and
this skill's own record schema lists those fields on `runs/<id>`. `recordRun`
never wrote them. So the registry held three runs while all three charts said
"No runs yet" — and the page had three copies of today with no history at all.
**A trend is measures on the run; measures on the library are only ever the
latest one.**

Assert the third, which is a wording bug that reads as a data bug. An empty
chart said *"No runs yet"* when runs existed and had simply never taken that
measure. Same distinction this skill already draws for tiles — a measure that
was not recomputed is not a measure of zero — applied one level up and missed.
Now: *"No run has recorded this measure."* The Scores pane had the matching
fault, saying "No scores recorded yet" as though an audit would fill it, when
scoring is on-request only and the page never writes it.

Assert the method, because all three were invisible to reading. Every one
survived a code review, a static check and two hand-driven scans of the same
library. They surfaced the first time the actual button ran against a library
whose record was empty. **A first run is its own test case, and it is the one a
project only gets once** — which is why Project C mattered more as a fixture
than as a second project.

Assert the outcome as recorded: 64 sets, 287 variants, 314 variables, 100%
binding coverage, 15 rows — 11 components with no description, 4 variants
rendering identically to their resting sibling.

Walked live: 2026-09-06 — Project C's first real audit, driven by clicking the page's own Audit button over CDP.


## A61 · An empty pane is a missing pipe, not a missing table — WALKED 2026-09-06

Walk: the Components tab, empty after four successful audits, and what happened
when it was filled the wrong way first.

Assert the wrong instinct, which is the case. The tab held two sections, both
empty: "Changed since the last audit" (nothing had moved) and "Scores" (nothing
had ever written any). The response was to **add a third** — a components table
built from per-set facts the scan happened to have. It filled the page and was
immediately rejected: *"I don't know why you created a separate table of
components and now we have 2. We should show just score."* The page had invented
a surface rather than surfacing the audit's output.

Assert the actual defect, which the invented table concealed. Scoring existed as
a fully specified model in SKILL.md and as a finished renderer in the page, with
**no path between them** — no run had ever computed a score, so "No scores
recorded" was not a state the dashboard could leave. An empty pane with a
complete renderer behind it is a **missing pipe**, and the fix is to connect the
two ends, never to put something else in the gap. The gap is the signal.

Assert where the model had to live: `scanner/scoring.json`, encoding §Scoring
verbatim — weights, penalties as fractions of a dimension's own weight, pro-rata
N/A reweighting, the 25/100 publication gate and its reason. The page applies it
and holds no weight, threshold or dimension name of its own.

Assert the part that keeps itself honest. "Unscanned is not 100" needs to know
which dimensions have a running check, and that is **derived from
`checks.json`**, not listed. Accessibility has 0 of 4 automated, so it is
excluded and its weight redistributed instead of scoring full marks, and every
row carries the partial note naming it. Porting a check closes the arithmetic
gap in the same move that closes the coverage gap — one place, no second list to
remember.

Assert the two rendering fixes, which share a root with the invented table:
showing something where there is nothing. "Changed since the last audit" now
appears **only when something moved** — most runs move nothing, and a heading
over an explanation of its own emptiness is worse than no heading — and a ruled
section preceded by a hidden one drops its divider, because a rule that
separates a section from nothing is noise.

Assert the negative result, recorded so it is not retried: `temperature: 0` on
the judgement pass to make it reproducible **is deprecated on this model** and
errors. The same 33 candidates kept 17, then 6, then 25 across runs. The
variance is a property of the layer, not a setting, and the queue is the union
across runs rather than one run's snapshot.

Walked live: 2026-09-06 — the Components tab filled by wiring scoring to `scanner/scoring.json`; `temperature: 0` recorded as a negative result.


## A62 · Where a limit depends on the answer, recover instead of predicting — WALKED 2026-09-06

Walk: the judgement pass truncating for the fourth time, on a fourth budget.

Assert the pattern in the three failed attempts. A flat 2000 truncated on 19
candidates. 160 per candidate truncated on 12. 400 per candidate truncated on
project-d. Each number was measured on a real run and each was wrong on the next
one, and the reason is structural: **the cost of a batch is set by how much the
pass keeps, not by how much it is given.** A library with many real findings
writes `text` and `why` for each; one with few writes almost nothing. No
coefficient exists.

Assert the fix, which is a different shape rather than a fifth number: on
`truncated`, split the batch in half and retry each half. A single set that
still overruns gets one attempt at the whole cap, then fails naming itself
instead of failing the run. The estimate stays as a first guess and stops being
load-bearing.

Assert the general form: **where a limit depends on the answer, make exceeding
it recoverable rather than predicting it.** The three earlier versions all
treated a budget as something to get right; the fourth treats it as something to
survive getting wrong.

Assert the walk: Project D, 24 candidates in three batches, status line moving
throughout, 24 kept, no new rows, and `scores/` written by a run for the first
time — 55 rows, median 100, Accessibility excluded and reweighted, partial note
present.

Assert the consequence recorded rather than hidden: the run wrote only the
measures the scanner computes, so `contrastPass`, `propDesc`, `annotated` and
`statesBroken` — written by earlier session runs — were dropped. That is
"recompute every measure, never carry one forward" working, and it makes plain
that the dashboard shows strictly less than a session until the backlog is
ported. A rule behaving correctly can still be a visible regression, and saying
so is part of the rule.

Walked live: 2026-09-06 — Project D, 24 candidates split into three batches, `scores/` written by a run for the first time.


## A63 · A decision must reach the layer that acts on it — WALKED 2026-09-06

Walk: a maintainer records an icon-order exception in a row's note, presses
Verify, re-runs the audit, and reports that nothing happened.

Assert the three independent failures behind one symptom, because the lesson is
that they were independent:

1. **The note was inert.** It was stored on the row and nowhere else. The
   judgement pass reads `meta.rulebook.rulings`; nothing wrote there, so the
   ruling had no reader and 22 sibling findings returned unchanged. **A decision
   captured where nothing consumes it has not been made.**
2. **Verify compared the wrong two strings.** It matched the scanner's candidate
   text against the row's `fix`, which holds the judge's *tightened rewrite* —
   deliberately different wording. Nothing ever matched, so every ticked row was
   stamped "the finding is gone". The skill's rule is that only a pass which
   read the file may stamp; the pass read the file and then asserted the
   opposite of what it found. **A comparison between two things that were never
   meant to be equal fails silently and confidently.**
3. **The audit could only add.** Amending the recorded `Size` scale stopped the
   scanner raising the icon findings entirely, and all 23 rows stayed open. A
   queue that only grows stops describing the library.

Assert the fixes and where each belongs: the ruling goes to the rulebook (data,
which the page may write); rows carry `check`, the scanner's own wording, and
verification compares against it; a full scan reconciles open rows and closes
what it no longer raises, because a full scan is a pass that read the file.

Assert the better fix found on the way: this ruling was really about the
recorded **scale**, not an exception to it. Changing `optionOrder.Size` to
`xl · lg · md · sm · xs · 16 · 20 · 24` is deterministic, costs no judgement
round, and stops the candidate being raised at all — a suppression is the right
tool for a genuine exception and the wrong one for a scale that was simply
recorded wrong. It also surfaced a contradiction worth reporting rather than
resolving quietly: a ruling from the previous day said the numeric scale ran
`24 · 20 · 16` and that ascending was not a separate convention. The new ruling
supersedes it and says so in its own text.

Assert the walk: zero candidates across 55 components, 23 rows closed by the
run, one open row remaining.

Walked live: 2026-09-06 — a ruling recorded in a row note, then a re-run: zero candidates across 55 components, 23 rows closed.


## A64 · The note scopes the batch — WALKED 2026-09-06

Walk: a maintainer writes "add a description to all components missing one" in
a row's note, presses the fix button, and gets one description.

Assert the gap between the spec and the build. Bucket 1 is defined in this file
as "Approve & I fix — one approval applies the batch." The page implemented the
per-row half and nothing else, and nobody noticed because the per-row half works
perfectly. **A partial implementation of a specified behaviour does not fail; it
just quietly means less than the words promise.**

Assert the wrong first fix and why it was wrong. A `Fix all` in the bucket
header covers every row in the bucket, which is not what "all the components
missing a description" means — bucket 1 also holds naming, structure and token
fixes. The maintainer's correction named the right scope: *"fix all of that row
takes the note into consideration, and fixes all related issues (not necessarily
all from the section)."* **Related is defined by the check that raised the rows,
and the note says what to do about them.**

Assert the resulting shape: three peer actions on the row — `Fix this`,
`Fix all`, `Record as ruling` — all reading the note first, with `Fix all`
present only when the same check raised other open rows. They share one style
deliberately: which one to reach for is the maintainer's judgement, and a
heavier button would make that choice for them.

Assert the sequencing constraint, which is not a preference: each fix writes to
Figma and then re-scans its own component to stamp itself. Two running in
parallel would verify against each other's writes.

Assert the reporting bug the batch exposed: a row carried `appliedCode` and
`appliedAt` but never `done` — the write ran and something threw before the
stamp, and the reason went nowhere, so the batch said "1 left for you, see their
notes" against a row with an empty note. **A batch that reports failures must
put the reason where it tells the reader to look.**

Assert the walk: nine descriptions written on one press, ten of eleven bucket-1
rows closed.

Walked live: 2026-09-06 — a note-scoped batch fix: nine descriptions written on one press, ten of eleven bucket-1 rows closed.


## A65 · A rulebook that contradicts its own source document — WALKED 2026-09-06

Walk: the maintainer asks the dashboard's chat why the queue and the house
standard disagree about state order, and the answer surfaces that fifteen
findings are written against the opposite of the recorded rule.

Assert the defect and where it was. Project C's `meta.rulebook.optionOrder.State`
read `Rest · Hover · Press · Focus`. The project's own context document, §State
vocabulary and order, states `Rest → Focus → Hover → Press` and calls it
unanimous across every sampled interactive set, citing figma-standard rule 4. The
rulebook is *hydrated from that document*, so this was a transcription error at
setup — and **nothing anywhere compares the two after hydration**.

Assert the failure mode, which is the reason this matters more than a typo: a
scale written backwards does not produce silence or an error. It produces a full
set of confident, well-formatted findings against **every component that follows
the standard**, and passes the ones that break it. The audit was precisely
inverted and looked completely normal.

Assert the rule: **a rulebook value that contradicts the document it was
hydrated from is a defect in the rulebook, never a finding about the file.**
Direction-carrying values — scale order, precedence, "largest first" — are the
ones to check twice, because they read as plausible in either direction.

Assert the measurement: correcting it took a full scan from 33 candidates to 7.

Assert the second finding from the same run, which the new failure-recording
surfaced: a generated fix reported *"Job list component (0:8711) not found"*
for a component sitting at exactly that id. The id was correct — the code looked
it up before `loadAllPagesAsync()`, and a node on an unloaded page is not found.
`fix.txt` now specifies the lookup order explicitly (load, then
`getNodeByIdAsync`, then a name search only as fallback, then an explicit
`{error}` naming the step that failed). The same fix applied first try
afterwards. **An instruction that says "call X before searching pages" is weaker
than one that numbers the steps**, because the model reads the first as advice
about a case it may decide it is not in.

Assert the defensive fix kept anyway: rows refresh their `node` from each audit,
since a recreated component gets a new id and a row holding the old one is a
live finding at a dead address — which was the hypothesis before the real cause
was found, and is still true.

Walked live: 2026-09-06 — Project C's inverted `State` order corrected; a full scan went from 33 candidates to 7.


## A66 · Knowledge in the renderer is knowledge that will drift — WALKED 2026-09-06

Walk: a deliberate review of a day's work against the toolkit standards, asked
for in those terms — skill as sole source of truth, project-agnostic, portable,
no hardcoded lines, no stale artifacts, sustainable without re-reading the code.

Assert the security finding, which the standards had already predicted. The
code-standard's own Candidates section, written from this very service earlier
in the day, says a localhost service checks `Origin` *"on the socket upgrade as
well as on HTTP"*. Only the HTTP half was built. A WebSocket is exempt from the
same-origin policy but still sends an Origin, so any page the user visited could
open one, be handed a plugin slot, and answer `/exec` with results of its
choosing — which the record stores as though Figma had said them. **A rule
written down and half-applied reads exactly like a rule applied.** The guard
admits the sandbox and figma.com, refuses web origins, and logs refusals,
because its one failure mode is turning the real plugin away.

Assert the duplication that mattered most. Nine measures lived in the page twice
— as tile logic carrying the thresholds, and as About prose restating them — so
with the skill there were three copies of one fact and two of them were in the
renderer. They moved to `scanner/measures.json`. The vocabulary is deliberately
small (`of` / `num`+`den` / `sum`; percent / ratio / count / cleanOrCount; `gte`
/ `eq`): **a general expression language would have moved the logic back into
the page wearing a different syntax.**

Assert what made the move honest rather than cosmetic: each measure carries a
`status`, and the four whose checks are in the backlog render no tile and are
marked in About. Before, they simply failed to appear, which reads as missing
data rather than as an unbuilt check.

Assert the check that makes the whole arrangement maintainable, which is the
real deliverable. Adding a check now touches five files, and forgetting one is
silent in every case: a rule with no bucket lands in the default, a check
missing from the catalogue is invisible to the About tab *and* to scoring's
"unscanned" arithmetic, a rule with no dimension scores nothing. `check.mjs`
validates all of it, and a backlog measure whose inputs all arrive **fails until
someone flips it**. **A rule nothing enforces is a rule that will be broken by
the person who wrote it** — this file records four separate instances from one
day.

Assert the smaller findings, all of the same family — a fact recorded in one
place and changed in another: the record schema still named `meta/sweepScript`
and `auditScript`, documented 12 of the 21 row fields (omitting `check` and
`rule`, both load-bearing), and pointed at `scripts/`; Project C carried an
orphaned `components` collection written by a renderer deleted the same day; and
the page held two raw colours and two inline styles the standard bans.

Assert what is NOT closed, so it is not mistaken for done: the socket guard has
not yet seen the real plugin, because verifying it costs the maintainer a manual
reopen. It is written to fail loudly if it is wrong.

Walked live: 2026-09-06 — a day's work reviewed against the toolkit standards; the socket guard has not yet met the real plugin.

## A67 · A header the detector cannot see is a flat list it calls clean — WALKED 2026-09-07
Fixture: a 42-page library with `🔷 CATEGORY` header pages, `---` dividers and `AUXILIARY` last; the §3.8b detector as of 1.59.0 (`^❖` headers only).
Assert: the 1.59.0 detector classifies every `🔷` page as furniture, forms no groups and returns no findings — silence that is not a pass.
Assert: the 1.60.0 detector groups eight sections, reads the dividers as furniture, excludes the pinned `AUXILIARY` from the alphabetical check and reports 0 findings on the file as drawn; on the same file with one component page moved out of order it names the page and where it belongs.
Observed on the reference project the day the detector changed: 42 pages, 8 sections, 7 furniture, 0 findings after the fix; the pre-fix run on the same file reported nothing at all.

Walked live: 2026-09-07 — a 42-page reference library, before and after the detector change: nothing at all, then 8 sections and 0 findings.



## A67 · The outcome existed; it was where nobody looks — WALKED 2026-09-07

Walk: the maintainer reports that after verifying a ticked row, or after a fix
finishes, "items disappear from the list but it is not so clear what happened."

Assert what was actually wrong, because it was not a missing feature. Every
outcome message already existed and was already accurate — "3 cleared, 1 still
reproducing", "9 fixed, 1 left for you". They went to the inline status line,
which also carries *"Saving as you go"* and *"Saved 14:32"*. **A place that
mostly shows housekeeping teaches the reader to stop reading it**, and the
result of a minute-long run landed there while the list it changed visibly got
shorter. The information was present and unfindable.

Assert why it matters more than polish: a verified row folds into *cleared*, a
fixed row ticks and leaves its bucket, an audit closes rows it no longer raises.
All three look identical to a row that vanished by mistake. **An interface that
removes something owes an account of why**, and this one had a good account
filed in the wrong place.

Assert the shape: a toast per outcome, carrying what was attempted, what held,
what did not, and a way back to the queue. Warnings and errors do not
auto-dismiss — they are the ones with something to act on, and a message that
removes itself before it is read is the same as no message. The region is
`role="status"`, so the outcome is announced and not merely shown.

Assert the audit's special case: it files and closes rows in the same pass, so
it reports **both** numbers. A net figure would hide one direction entirely, and
"3 findings" reads very differently from "3 new, 12 closed".

Assert the two defects the first render caught, both invisible in code review:
the toasts sat underneath the ask drawer, which is fixed to the same edge — now
offset by the drawer's own `--drawer-w` so they track it in every state instead
of assuming a width; and a message written by the model or returned by the API
was concatenated to a sentence of ours, producing *"…not found Nothing was
stamped"*. **Text from elsewhere ends with punctuation about half the time**;
close it before appending.

Walked live: 2026-09-07 — the toast region rendered, which caught two defects invisible in code review.

## A68 · A signature that excludes the root cannot see a state painted on it — WALKED 2026-09-08

Setup: one project's `Navigation item` and `Navigation button`, two sets on the same page. The dashboard's audit filed `Selected=True, Disabled=False, State=Press renders identically to its Rest sibling` and `Selected=False, Disabled=False, State=Hover renders identically to its Rest sibling`, and its verify pass confirmed both as "still reproduces". The maintainer asked whether it was true.

Assert it was not: on `Navigation item` the Rest root binds `Control/Neutral/soft-rest` (#161616 at 7%) and the Press root binds `Control/Neutral/soft-press` (15%); Label and Icon are identical on both, as they should be; the two PNG exports differ. On `Navigation button` the Rest root has no fill and the Hover root has #161616 at 3%.

Assert the cause is the scanner, not the file: the shipped signature pushed one line per layer and returned `a.slice(1)`, dropping the root line to keep the root's `Axis=Value` name out — and with it the root's fills, which is where both states render. Run against both pairs, the shipped signature reports equal and the same signature with the root line kept (name replaced by `(root)`) reports different. This is §3.5a's own trap, documented 2026-08-13 with 42 false hits on one library, regressed in the scanner.

Assert the rule: **exclude the root's name, never the root.** And the second lesson, which is the reason the row survived a verify pass: a verification that re-runs the same check confirms the check, not the finding. When a maintainer doubts a row, the answer comes from the node — the bound variables, the resolved paints, the export — not from running the scanner again.

Walked live: 2026-09-08 — `Navigation item` and `Navigation button`: the shipped signature reports equal, the root-keeping signature reports different.


## A69 · "Already in the queue" must mean open — WALKED 2026-09-08

Setup: Project C, the run after 1.60.4. The page said *"1 to fix, all already in the queue"* while the queue showed OPEN 0, RAISED 31, CLOSED 31, and the run note read *"1 candidate, 1 survived judgement, 0 filed as new rows."* The maintainer: "the audit says 1 to fix but there's nothing".

Assert what the candidate was, found by running the scanner over the whole library: `Navigation item` — `State options read Rest · Focus · Press · Hover; the recorded scale is Rest · Focus · Hover · Press`. A Hover variant had been added to the set since the previous run and appended after Press. A real finding, and the judge was right to keep it.

Assert why it vanished: the row id is `a-<set>-<32 chars of the check text>`, and the first 32 characters of this check are identical to those of the finished 2026-09-05 row `State options read Rest · Focus · Press; the recorded scale is Rest · Press…`. `fileFindings` skipped any existing id, closed or not, so the finding was neither filed nor shown, and the summary still counted it.

Assert the rule: **a closed row the scan raises again is work.** It is reopened in place — new wording, current node, `reopenedAt`, and a verify note that keeps the old one as a trail — and the summary says "1 reopened", never "already in the queue". An id collision on a closed row is handled by the same path, since the reader sees the current wording either way; a collision on an open row still dedupes, which is the case the truncation exists for.

Walked live: 2026-09-08 — Project C's run after 1.60.4, with the scanner re-run over the whole library to find the vanished candidate.

## A70 · A list titled "since the last audit" must be consumed by an audit — WALKED 2026-09-08

Setup: project-c. A sweep at 07:41 listed `Navigation item` as changed and `badge-minus` as new. Three full audits followed (07:42, 07:49, 07:51, the last with no candidates). The Components tab still showed both under "Changed since the last audit". Maintainer: "I ran an audit and these items should clear I think".

Assert the cause: the section renders `fingerprints.diff`, which only the sweep writes. `runAudit` recorded the run, the measures, the rows and the scores, and never touched the diff — so "since the last audit" was in fact "since the last sweep", and would only have cleared when a later sweep found nothing moved.

Assert the rule: **the audit consumes the diff for what it scanned.** A full audit (the page's default, which names every stored set) empties it, gone sets included, because only an audit of everything can acknowledge a set that is no longer there; a partial audit drops the names it covered and leaves the rest. The fingerprints record carries `auditedAt` so the two dates can be read side by side.

Assert the walk: with both names listed, the page's own audit was run over the whole library; the section disappeared, the diff read empty, and `auditedAt` was stamped after the sweep's `at`.

Walked live: 2026-09-08 — Project C: the page's own audit run over the whole library emptied the diff and stamped `auditedAt`.


## A71 · A name that renders identically — WALKED 2026-09-08

Walk: Project D's first design-to-code snapshot produced a component folder
called `list-item-selection-list-item-selection`, holding 60 variants.

Assert what it was. The component set was named `" List item - Selection"` —
one leading space. The page was `❖ List item - Selection`. The exporter names a
component `<page>/<component>` unless the component's name already *starts with*
the page name, compared the two untrimmed, and so composed
`List item - Selection/ List item - Selection`.

Assert why fourteen audits had not seen it. A leading space renders identically
to no leading space. It is invisible in the layers panel, in the assets panel
and on the canvas; nothing about the file looks wrong, and no check asked. It
was found in a *different system*, by a tool whose only interest in the name was
string comparison — which is the general shape: **a defect that renders
identically is found by whatever reads the name as data, not by anyone looking
at it.** That is precisely the population a scanner exists to cover, and the
scanner did not cover it.

Assert the check: leading or trailing whitespace on a page, component or layer
name, and a double space as hygiene. Error on a component, warning elsewhere,
because the component's name is the one consumers and exporters receive.

Assert the walk, in both directions, which is the part that makes it a check
rather than a claim: silent across 85 sets with the file clean, then the space
restored on the renamed set for the length of one call and the finding fired naming
the set. The rename and its undo were the same call, with the restore in a
`finally`, per A23's lesson that a throw skips same-call cleanup.

Assert the second fix, in the other tool: the exporter now trims both sides
before comparing and sends the name trimmed. Two guards for one defect is right
here — the library should not hold the typo, and a consuming repo should not
inherit one it cannot see.

Walked live: 2026-09-08 — silent across 85 sets, then the leading space restored for the length of one call and the finding fired.

## A72 · An unused property is an error that says why — WALKED 2026-09-10

Fixture: a project's first audit through the dashboard, 82 sets. `Reference file` declares `Icon swap` and no layer uses it.

Assert the defect. The scanner raised it as `warning`. The judge, given only that severity and the bare wording, explained it as "adds noise to the props table", and the row landed as a warning in *Decide*. The score table in the same run capped the component at 25 for "unused property blocks publication". The two surfaces disagreed, and the queue, the one a maintainer works from, was the wrong one.

Assert the fix and why the id holds. The scanner emits `error`, and its text ends with the consequence. The consequence is appended after the first 32 characters, which are all a row id keeps, so ids do not change. The project's open row was rewritten to the new wording in the same change, because reconciliation matches on `check` and would otherwise have closed a live finding as "no longer raised".

Assert the walk. The shipped `audit.js` was run unmodified through the 9229 service over `Reference file`, `Button` and `Icon button`. It raised `error` with the consequence on `Reference file`, and no property finding on either of the other two.

Assert the second defect, from the same run. A first run's scope is empty by design, because empty means every set. The run record, the no-findings line and the toast counted the scope rather than the scan, and read "0 components" over 82. They now fall back to `measures.sets`. **Not walked**: the branch only fires on a project's first run, and no project without fingerprints exists to drive it. The next new project's first audit is the walk.

Assert the gap this leaves open. Nothing checks that a catalogue tier matches the severity the scanner emits. `check.mjs` keys rules to buckets and dimensions, but catalogue entries are prose, not tied to the line that emits them.

Walked live: 2026-09-10 — the shipped `audit.js` run unmodified over `Reference file`, `Button` and `Icon button`; the first-run scope branch is not walked.

## A73 · A section is kept out by position, not by page name — WALKED 2026-09-10

Fixture: a library whose last section, under a `DEPRECATED` header page, holds the components the maintainer has retired. The maintainer rules that nothing in that section is audited.

Assert why the page filter could not do it. `componentPages` tests a page's name, and nothing in the name `❖ Compact button` says it sits under the deprecated header; only its position does. A name list of today's deprecated pages would pass on the day. Then it fails in the direction nothing reports: a page moved back out of the section stays excluded, so its component is never scanned and the queue reads clean.

Assert the rule. `sectionHeader` matches the header pages and `excludeSections` names the headers whose pages stay out. The walk keeps the last header it passed, and skips pages while that header is excluded. Both come from the rulebook, and either one missing excludes nothing. The sweep carries the same lines, because a sweep and an audit that disagree on scope make "nothing moved" meaningless.

Assert the walk, in both directions and on the file rather than on a fixture. With the rule, the sweep saw 85 sets and no deprecated one. Without it, 92, and the seven extra were exactly the sets under the deprecated header, none of them on any other page. The header had gained five sets since the morning's audit, which is the case a page-name list would have missed.

Walked live: 2026-09-10 — the sweep with the section rule (85 sets) and without it (92, the seven extra all under the deprecated header).

## A74 · A grid frame is checked by the gaps it uses — WALKED 2026-09-10

Fixture: a calendar whose day grid uses grid layout, 7 columns of 36 across 252, with `gridRowGap` and `gridColumnGap` at 0 and both bound to tokens. The frame also still carries `itemSpacing: 40` from before it became a grid.

Assert the defect. The scanner read `itemSpacing` on every auto-layout frame and filed "Grid: raw gap=40". The maintainer looked for a 40px gap and found none, because none is drawn. A finding that cannot be located is treated as unverified, and this one was also untrue.

Assert why it survived. `scanner-checks.md` §3.4 already described this false positive and gave the branch that prevents it. The prose was right and the executable never followed it, which is the shape A58 names: a specification in prose does not run.

Assert the fix. A frame in grid layout is checked by `gridRowGap` and `gridColumnGap`, and `itemSpacing` is read only on horizontal and vertical auto-layout.

Assert the walk, both ways, through the shipped file. It raised nothing on the calendar. On a temporary grid component with an unbound 8px row gap it raised `raw row gap=8`. The fixture page was inserted before any section header, so the section rule could not skip it, and it was removed in the same run's cleanup.

Walked live: 2026-09-10 — the calendar's grid frame, plus a temporary grid component with an unbound 8px row gap.

## A75 · An audit's outcome agrees with the queue it leaves — WALKED 2026-09-10

Fixture: an audit that files nothing new and closes nothing, over a queue that still holds one open finding.

Assert the first defect. The toast read "Nothing to fix in 85 components" while the status line beside it said one finding was still open. The headline had no input for findings that survived judgement but were already queued, so it fell through to the clean message. It now takes that count, and the toast says the finding is still open and already in the queue.

Assert the second defect. The library's open-findings figure read 4 over a queue of 2. The measures were written before the run closed the rows it no longer raised, so they counted rows the same run had just cleared. Closing now comes first on both audit paths. The run record was already right, because it was written after the close, and that difference is what located the bug.

Assert the walk and its limit. The page's own `auditHeadline`, extracted and run in node, returned the right sentence for five cases: one finding still open, nothing open, rows closed with one open, a new finding, and a row closed. A live clean audit through the edited page wrote 0 open on both the run and the library. The still-open-with-nothing-new branch has been run only in node, since no connected library had such a queue to drive it.

Walked live: 2026-09-10 — `auditHeadline` extracted and run in node over five cases, plus one live clean audit through the edited page.

## A76 · Settings and rulings have one home — WALKED 2026-09-10

Fixture: three projects whose audit records carried `meta/rulebook`, a copy of settings and rulings hydrated from each project's context document.

Assert the drift. Only 8 of one project's 25 copied rulings still matched the document's wording, 2 of 14 and 7 of 11 in the others. Rulings recorded from the dashboard went to the copy, which the document never saw. A registry row asked the maintainer to copy rulings by hand, and nothing checked that anyone did.

Assert the home. Each context document carries one fenced `json audit-settings` block in §5, per library, keyed by file key. `standards/audit-settings.json` carries `audit-defaults`, which a project key overrides per axis, so a project holding the house state order no longer restates it. Rulings are the rows of the §6 table; a struck row is superseded and not read. The service reads all of it on every request.

Assert the failure mode. A missing or malformed block is reported by name, and a library with no entry stops the audit with that message. A missing rule still skips its check, so a run without settings would otherwise read as clean.

Assert the walk. `/context` returned settings and merged orders for all three projects, with 66, 52 and 50 rulings parsed. `/ruling` on a throwaway copy appended one row whose pipe stayed inside its cell, parsed back as the last ruling, and refused the same ruling twice.

Walked live: 2026-09-10 — `/context` over three projects (66, 52 and 50 rulings), and `/ruling` against a throwaway copy.

## A77 · Rows are filed by one writer — WALKED 2026-09-11 (node)

Fixture: the page's row key, `a-<set slug>-<32 characters of the check's slug>`, applied to two page-order findings that share a prefix; a record holding a row under that key and a legacy row with no owner and no `check`; a validator run per code target.

Assert the defect. Two findings with one 32-character prefix overwrote each other, and the key's slug lived only in the dashboard page while three skills described it in prose, so a session filing rows would have keyed them differently and every open row would have gained a duplicate on its first run.

Assert the writer. `tools/figma-audit/rows.mjs` is the one implementation, reached by `POST /rows` from the page and from every skill, or by its CLI with no service. It matches by owner, component and wording before minting, so an existing 32-character id and a legacy fix-only row are found, not duplicated; a taken key gets a hash of the full wording; severity is coerced to `error` or `warn`; a closed row raised again is reopened with a trail; a full run closes only this owner's rows inside its scope, per target, and a partial run closes nothing.

Assert the walk. `node tools/figma-audit/test-rows.mjs` passes 24 of 24 assertions over those fixtures; `node tools/docs-site/src/dashboard/check.mjs` passes with the page's own filing and reconcile code removed. Not yet walked through the page against a live library.

Walked live: 2026-09-11 — `node tools/figma-audit/test-rows.mjs`, 24 of 24 assertions over those fixtures; not yet through the page.

## A78 · The file-level checks are filed once, by the foundations audit

Fixture: a project audit that runs `figma-foundations-audit` and then this skill over the same library, whose pages hold one swapped pair.

Assert: the swapped pair is one row, owned by `figma-foundations-audit`. This skill's workflow names no page-order or naming-case check of its own (step 3b names the other skill), `scanner/checks.json` carries no entry for either, and §3.8b and §3.8c of `scanner-checks.md` point at the foundations skill rather than holding a walk to run by hand. Traced 2026-09-10 by reading; the two-owner duplicate was never produced live, because the review caught it first.

Read by: the v2.3.0 review, 2026-09-10 — traced by reading; the two-owner duplicate was never produced live.

## A79 · A dismissed candidate's row says why

Fixture: a judgement pass over candidates of which some are covered by a ruling or a mechanism.

Assert: the judge's reply lists every candidate once, in `findings` or in `dropped`, and each drop carries a one-clause `why`. The page sends the drops as `dismissed` with that clause, and the row closes reading "Dismissed by the judgement pass on <date>: <why>. The check still raises it." A drop with no `why` closes saying no reason was given, so a candidate nobody judged is visible as such. The writer half is walked in node (`node tools/figma-audit/test-rows.mjs`); the judge's reply shape is not yet observed live.

Not walked.

## A80 · A layer wired in some variants and not in others

Fixture: a `Button` set of 108 variants, made by merging three per-size sets so that three `Label text` properties collapsed into one; a text-field set holding four distinct layers all named `Label`; a dialog footer holding two sibling layers both named `Button`.

Assert the defect. 36 of the 108 labels kept their `characters` reference and 72 were wired to nothing, and the scan reported the set clean: 3.10c passes the moment ONE layer references a property, so nothing in the file reads the other direction. The maintainer found it by eye.

Assert the check goes red. On a clone with 3 of 108 `characters` references removed it reports `105 on / 3 off` naming the variants; on the repaired set it is silent. Walked live 2026-09-13.

Assert the keys. Keyed by name, a sweep of 88 sets returned four findings and all four were wrong — three from the four different `Label` layers in one field variant, one from the two `Button` siblings in a dialog footer. Keyed by path with an ordinal for same-named siblings, the same sweep returns one finding, `Date input › Field › Label`, which is real: the placeholder is static in the 9 `Value=False` variants and bound in the 9 `Value=True` ones, where the sibling `Text input` binds it in all of them.

Walked live: 2026-09-13 — a clone with 3 of 108 `characters` references removed, and a sweep of 88 sets keyed by name and then by path.

## A81 · The scanner's checks run outside Figma, and moving them changed nothing — WALKED 2026-09-22

Fixture: one project's 120-set web library open on the bridge, and a dump of exactly the nodes `scanner/audit.js` walks with only the properties its rules read — 15,652 nodes, 137 bound variable ids resolved, `figma.mixed` never met — taken by a throw-away probe through the service's `/exec` before the refactor.

Assert the shape. Run with no `figma` in scope, the body returns `checkFacts`; `TOK`, `SPACING`, `COLL`, `TEXTROLE`, `PAGES`, `SECTION`, `SKIPSEC`, `SAXIS` and `SREST` exist only inside it, and the return keeps `{ audited, measures, at, fileKey, fileName }`.

Assert the seam moved no behaviour. The old file live, the new function over the dump, and the new file live returned the same 120 sets, 8 candidates and every measure (`nodes` 5574, `bound` 31631): three outputs identical once `at` is dropped. A scoped run (`TARGETS` naming two sets, `measures` null) and a second open file with no components (measures from 5 collections, 609 variables, 33 text styles, 11 effect styles) matched the same way.

Assert every rule site survived, not only the eight that fired. The old body run under a twenty-line `figma` shim over the dump reproduced the live baseline exactly, which is what makes the shim an instrument; over a copy mutated to fire all 22 finding sites it returned 35 candidates, and the new function returned the same 35.

Walked live: 2026-09-22 — one 120-set library through `/exec` on the project's service, old file and new, plus the dump in node.

## A82 · The scanner has a corpus, and every finding site is reached — RUNS

Fixture: `tests/fixtures/library-slice.json` (plain JSON, one value a line, so a diff and the project-name scan read it; it was gzipped until 2026-10-31) — eight sets of one real 120-set web library (183 variants, 1,124 walked nodes, 77 bound variables), dumped through the bridge on 2026-09-22 with only the properties the rules read, node ids, property keys and variable ids renumbered to the illustrative `0:` prefix and descriptions replaced by a placeholder. Names and structure are as found: the fixture is a slice of a library, not a sketch of one.

Assert the corpus is real. The six findings the suite pins on the slice are, word for word, the ones the scanner raised live on that file the same day; the measures are the walk's own counts and the file facts passed through.

Assert every finding site is reached. A copy of the slice mutated in the test — a raw padding on and off the scale, a raw gap, radius, fill, stroke and stroke weight, a grid's raw row gap, a text with no style and three unbound font fields, a default layer name, a hidden layer wired to nothing, a GROUP, a fill from the wrong collection, a text fill outside the text role, an unused property, a blank description, a component and a layer and a page name with stray whitespace, a double space, a state cloned from Rest, and an axis out of the recorded order — raises 28 candidates, one per plant, and the token measures count the twelve raw values.

Assert the negatives. A scoped run audits the named sets and returns no measures; a rule the settings do not carry skips its check rather than borrowing a value; a raw fill inside an instance is not this set's finding; `componentPages` and `excludeSections` narrow the walk.

Assert the suite can fail. With the text-style check changed to fire only on `null`, the every-site case fails on the missing "Label: no text style"; with the real engine it passes. A first plant, a padding test changed from zero to one, was a no-op on this fixture because every padding in it is bound — a probe that changes nothing proves nothing, so the plant was changed, not the claim.

Runs: node tests/test-audit.mjs — "the eight sets raise what the scanner raised live on 2026-09-22, and nothing else"; "every finding site fires once, where it was planted"; the scope, missing-rule, instance and page-filter cases.

## A83 · A path names a different layer when a sibling is missing — RUNS, WALKED 2026-09-22

Fixture: the slice in A82. Its Button - CTA, Menu button and Autocomplete input each carried an open error row from §3.10cc: "takes a boolean property in 45 variants and is wired to nothing in 9", 36 and 36, 7 and 7. The Button row's unwired nine were all `State=Loading`; Menu button's 36 all `Type=Icon only`; Autocomplete's seven all `Value=False`.

Assert the defect, from the data and not the comment. In Button - CTA's Loading variants `Content` holds one `Icon container` — an instance of the spinner — where every other variant holds the left icon, a label and the right icon; the path named two layers. In Autocomplete the leading icon exists only with a value, so `Field > Icon container` was the chevron in the empty variants. In Menu button the icon is the same component but stands alone in `Icon only`, where no boolean can hide it without emptying the button. The unwired variants falling on exactly one axis value was the signature of a design, and the check's own comment said "a wiring that was missed, never a design".

Assert the fix. A layer is keyed by its path and what it is — its type, and for an instance its children's names — and for `visible` alone by whether it is its parent's only child. On the slice the three rows are gone and Progress bar, Upload area and Password input are raised as before, word for word. On the live library the check went from six findings to those three.

Assert no genuine miss is lost. Three plants on the slice, each the same layer in every variant: Button - CTA's label with its text reference stripped at `Size=Small` fires "in 30 variants and is wired to nothing in 15"; Autocomplete's leading icon forgotten in its two `Value=True, State=Focus` variants fires "in 5 variants and is wired to nothing in 2", where 2.9.0 read 9 by mixing in the chevrons; Tab item's icon wrapper turned into a frame whose only child carries the boolean in six of ten fires "in 6 variants and is wired to nothing in 4".

Assert the suite fails on the old engine. The same cases run against 2.9.0's `audit.js` fail on the three false rows and on the Autocomplete count.

Runs: node tests/test-audit.mjs — "the eight sets raise what the scanner raised live on 2026-09-22, and nothing else"; "a layer that is the same in every variant still fires when some forget it".
Walked live: 2026-09-22 — the fixed engine over the 120-set library through `/exec`: three findings, identical to the headless run over the dump.

## A84 · A whole-library audit scopes the scan to nothing, never to a stale list — WALKED 2026-09-22

Fixture: one library's stored fingerprints holding 120 names of which 7 belong to sets since renamed, and 7 current sets absent; the page's "Audit all" passing those 120 names as `TARGETS`.

Assert the defect. The scanner skips a name it cannot find and says nothing; 113 sets were audited, `measures` came back null, the stage filed `full: false`, and the run line said "In-page audit of 120 components". Every run for five hours was in this state, and the two rows the engine had stopped raising could not close.

Assert the fix. A whole-library audit passes `[]`, which the scanner's contract reads as every set; "Audit the changed sets" keeps its explicit list, and an empty explicit list still says "Nothing to audit".

Assert the walk. `checkFacts` over the captured dump with `TARGETS = []`: 120 audited, measures present. The payload the page now files, posted to the live service as a dry run: `closed 2, updated 3`; the same payload with `full: false`, as the old code filed it: `closed 0`. The record was not written.

Walked live: 2026-09-22 — dry run against the project's service; the page itself is pressed in the end-to-end walk (A85).

## A86 · Every stage files rows through one function, and the move changed no payload — WALKED 2026-09-22

Fixture: the four stages of a page audit — components, file, build (two targets), broken tokens — each assembling its `/rows` payload by hand.

Assert the duplication. Four literals, five payloads, each with its own subset of the closing contract and its own comment about the field it had forgotten: `full: true` with no scope three times over, a scope of 120 blanks once, `exhaustive` on two of the three scanners that walk the file.

Assert the shape. `fileStage(owner, target, read, findings, dismissed)` is the one caller of the rows route. `read` is what the scanner can say about what it read — `names`, `complete`, `everything`, `ran` — and the payload is derived from it in one place. `check.mjs` fails when any other module calls the route; shown by planting a call in `queue.js` and restoring it.

Assert the walk. Audit pressed on the page through headless Chrome before the change and after the rebuild, every `/rows` payload captured from the network. Five payloads each time, same owners and targets, and every contract field — `owner`, `target`, `fileKey`, `origin`, `language`, `full`, `scope`, `exhaustive`, `ran`, and whether `dismissed` is present — identical. The findings differ in two candidates of about eighty: a Password input row the judge kept and then dismissed, a Button W7 row it dismissed and then kept, minutes apart on an unchanged file. That is the judge's variance, not the page's, and the second run reopened the W7 row.

Walked live: 2026-09-22 — two page audits on one 120-set library, the payloads diffed from the network log.

## A87 · The dashboard audits the whole library, and the components stage claims exhaustive — WALKED 2026-09-22

Fixture: the Audit button's two-way menu and the fingerprints behind it — a list of names as the scan's scope.

*Superseded 2026-09-24 by A92: the menu is restored on the maintainer's call. The empty scope for a whole-library audit and the exhaustive claim below still hold.*

Assert the deletion. One Audit button, no menu, no `lastMoved`, no scope: the scanner receives `TARGETS = []`, which its contract reads as every set. A full live scan of 120 sets takes 3.5 seconds; the judgement pass takes minutes and does not shrink with a scope; the file and link stages never read one. *Check changes* and `sweep.js` remain for the sentence "N moved since the last run".

Assert the claim. A scan that skipped nothing walked every component page, so the stage files `exhaustive` and a row naming a set the scan did not meet closes as renamed or removed — the same claim the file and link stages make.

Assert the walk. Audit pressed on the rebuilt page through headless Chrome: the components `/rows` payload carries `full: true`, a 120-name scope and `exhaustive: true`; the run completed in 156 seconds through all four stages. The first rebuild served a page with no Audit handler at all, because the only import of `audit.js` had been the menu painter; the bundle was checked for the handler text before the walk was trusted.

Walked live: 2026-09-22 — one page audit after the rebuild, the payload read from the network log.

## A88 · Every stage reads the live file, and a second source fails the check — WALKED 2026-09-22

Fixture: a page audit whose validator stage read `projects/<label>/snapshot/components/*/figma.json` while the components, file and link stages read Figma. The maintainer had removed a loose drop shadow from `_Dialog - Modal` and restructured its variants; the Broken tokens tab cleared, the Web build tab still said "an effect applied directly, with no style behind it · 6 variants".

Assert the source. The stage runs `plugins/design-system-snapshot/code.js` headless through the bridge — the same walk that writes a snapshot, 120 sets and 2,112 variants in 18 seconds, no scratch page left behind — and hands the service the specs, which it resolves by the same `compact → resolve → fromSnapshot` as a stored one.

Assert equivalence, not by reading. Over the same live specs, the stored transform and the live path returned identical findings (90), scope (124 names), silent classes and unmapped count; a census of every property key at every path matched once both sides passed through `compact` (without it the live tree carried four empty `children` arrays the store drops). The snapshot on disk, hours older, gave 22 findings the file no longer supports and lacked 9 it does.

Assert the walk. Audit pressed on the rebuilt page: `/validate` received 120 specs and answered `read: "figma"`; the Web build stage filed `full`, a 124-name scope and `exhaustive`; the run line reads "Read 120 live components"; 7 rows the snapshot had never shown were filed and 9 stale ones closed — the dialog's shadow as "no longer raises this", the renamed Timeline items as "renamed or removed".

Assert the check. `check.mjs` reads the `source` every `fileStage` call names and fails on a missing one or a second value; planting `"snapshot"` on one stage fails it, restoring passes.

Walked live: 2026-09-22 — one page audit on the 120-set library, the payloads read from the network log, the equivalence run in node over the captured specs.

## A89 · A finding is found again by what it is about, not by its wording — RUNS

Fixture: the writer's three prose fallbacks (exact, masked measurement, prefix), and a check whose wording was changed past any prefix.

Assert the defect. A row is keyed on the check's wording, so rewording a check re-minted every row of that rule and closed the originals as "no longer raised"; the 2.9.1 identity fix kept its sentence byte-identical by care alone.

Assert the shape. Every one of the 24 finding sites emits `key` — rule, subject and layer path, such as `tokens|paddingLeft|/`, `properties|wired|characters|Field > Value|TEXT`, `states|<variant>`, `schema|order|<axis>` — and the other three scanners do the same in their own vocabulary. The row writer matches on the key before the wording; a row filed before keys existed is found by wording once and takes the key; a dismissal names its key too.

Assert the walk. Over a copy of one real record, a keyed scan matched its three open rows by wording and stamped them; every check then reworded past any prefix matched by key — added 0, updated 3 — and the same payload without keys minted 3. The writer's key clause removed fails two assertions.

Runs: node tests/test-audit.mjs — "every candidate carries a key"; node tools/figma-audit/test-rows.mjs — "a reworded check with the same key lands on the same row".

## A90 · The page does not carry the record, and a bad record is a visible null — WALKED 2026-09-22

Fixture: the docs build baking every library's audit record into the dashboard page, and parsing the records in module scope with no try.

Assert the cost. The baked record was 88% of the page on the day it was measured and was thrown away on every load a service answered; a record truncated at 1,000 bytes failed all 131 pages.

Assert the fix. The build mounts the project's audit folder at `/audit/`; the page bakes only the settings and the check catalogue and the published copy fetches `/audit/<fileKey>.json`. `data.js` and `tracker.js` read a record inside a try and warn at build time; the published page throws on the unparseable copy and says so.

Assert the walk. In a scratch copy of the toolkit with a copied project: an intact record builds 131 pages, no `DASH_RECORDS` in the page, both records under `/audit/`; served statically, the page marks itself read-only and shows the library's measures from the mounted copy. The record cut at 1,000 bytes builds 131 pages with the warning, and the served page reports "Unterminated string in JSON at position 996".

Walked live: 2026-09-22 — two scratch builds, both served over a static server and read in headless Chrome.

## A91 · A module imported only for its side effects is imported for them by name — WALKED 2026-09-22

Fixture: `main.js` importing `audit.js` for one named export, the menu painter, while everything `audit.js` does for the page — the Audit button's listener, the four stages — happens at module load.

Assert the defect. The named import was removed with the menu it painted; the bundler then saw no import of `audit.js` at all and dropped the module. The build passed, the dashboard checker passed (it reads sources, not bundles), the service rebuilt and served a page whose Audit button did nothing. Pressing it through headless Chrome sent no request and raised no error; only a grep of the served bundle for the handler's text said the module was missing.

Assert the rule. A module that registers listeners or stages at load is imported as `import './audit.js'`, with a comment saying nothing here calls into it by name, so the next removal of a named export cannot take the module with it.

Assert the walk. The served bundle was grepped for the handler's text before and after the side-effect import: 0 then 1 occurrence, and the next press through the page ran all four stages.

Walked live: 2026-09-22 — the rebuilt bundle read from `projects/<label>/site/_astro/`, and one page audit after it.

## A92 · Audit changes returns, and every run records its trigger and cost — WALKED 2026-09-24

Fixture: a library whose last Check changes saw sets move, and one that saw none.

Assert the menu. With moved sets, Audit opens *Audit changes (N)* and *Audit all*; with none, Audit runs the whole library without asking. *Audit changes* hands the scanner `TARGETS` = the moved names; *Audit all* hands it `[]`, never the stored fingerprints' names (A84). A scoped scan returns no measures, so its rows are not `exhaustive` and it closes only within its scope; `consumeMoved` removes just the sets it read from the moved list.

Assert the record. Every page run writes `trigger: "full" | "changes"` and `cost: {calls, input, output, usd, model}`, summed over every judge call in the run, the later stages included (the run is rewritten with their total). `/claude` returns `spend` per call, priced from the service's table; a model missing from it records tokens with `usd: null`, never a guessed price.

Assert the page. History shows Scope and Cost, "—" for runs recorded before either existed (never inferred), and each run's account opens in a `<dialog>`, one bullet a sentence. `main.js` keeps the side-effect import of `audit.js` beside the named one (A91).

Runs: 2026-09-24 — `check.mjs` and `test-rows.mjs` pass; `/claude` returned `spend` from the restarted service; the rebuilt History rendered the columns and opened the dialog with 8 bullets in headless Chrome.

Walked live: 2026-09-24, Project C, through headless Chrome. Check changes said nothing moved, the menu stayed shut and Audit ran the whole library: `trigger: "full"`, `cost` $0.181 over 5 calls, the later stages' calls included. With two sets written into the stored moved list, Audit opened the menu showing "2"; *Audit changes* recorded `trigger: "changes"`, "In-page audit of 2 components", $0.156 over 4 calls, emptied the moved list, and left open findings at 30, as the full run had. The scoped run cost 86% of the full one: the file, validator and link stages do not shrink with the scope, which is 2.9.5's claim, now measured.

## A93 · The judge runs with the skill's model and effort, for every project — WALKED 2026-09-24

Fixture: `scanner/judge.json` naming `claude-sonnet-5` at effort `low`, and a page audit of project-c.

Assert the owner. The model and effort live in the skill beside `judge.txt`; the service reads them per judge call (`/claude` with `use: "judge"`) and holds no copy. Fix this and Ask send no `use` and keep the service's default. No environment variable or project setting overrides the judge.

Assert the effect. The same Project C judge prompt through `/claude`: 816 and 910 output tokens without `use`, 419 and 418 with it. A full page audit: $0.182 over 5 calls and 148 s before, $0.101 and 70 s after, open findings 30 both times.

Assert the evidence travels. `judge.json` carries the measurement that chose it and says the sample was six candidates, so the next reader knows to re-measure on a library with borderline rows before trusting it further.

Walked live: 2026-09-24 — the restarted service and a fresh browser profile. The first walk after the rebuild ran a cached page with the old bundle and cost the same as before; a run is judged by its record, not by the page having been rebuilt.

## A94 · A timeout says the code may still be running — WALKED 2026-09-24

Fixture: a bridge call whose code outlives its `timeout`.

Assert the message. `/exec` answers a plugin-side "Execution timed out" and its own `plugin_timeout` with a sentence saying the code may still be running in Figma and its writes may still land, so read what it changed before running it again. The page still classes both as `timeout` (matched by prefix), and its notice says to wait with the file idle before trying again.

Assert the evidence. A rebind script reported "Execution timed out after 240000ms" on both files, a dry run straight after still counted 3 and 69 stale bindings, and a quarter of an hour later all 72 were found bound to the target keys: the plugin had finished the write after the bridge stopped waiting.

Walked live: 2026-09-24 — `await` 3 s with `timeout: 1000` through the restarted service returned the timeout with the sentence appended.

## A95 · A ruling that names a defect keeps it — WALKED 2026-09-24

Fixture: Project C's ruling "A missing component description is a defect … `Newsletter block`, `Option select` and `Option select - Selection pill` stay open until they are written", and the three rows it names.

Assert the judge. `judge.txt` says a ruling covers a candidate only when it accepts it; one that names the finding as a defect, says it stays open, or records it as pending is a reason to keep it. Before, the judge dismissed all three "as a named open defect in rulings" and they flipped. Walked: three Project C runs after the change kept all three every time.

Assert the note. A raised, open row whose note begins "Dismissed once" gets "Kept by the judgement pass on <day> after one dismissal, so it stays open." `test-rows.mjs` asserts it and fails on the previous writer; the three rows carry it after the next run.

Assert the retry. A judge answer that is not JSON (`bad_json`) is asked for once more before the stage fails. Seen once in two Project A runs: the Library file stage failed with "the answer was not the JSON this asked for", and the next run of the same stage answered cleanly.

Runs: node tools/figma-audit/test-rows.mjs — "a raise after one dismissal clears the count", "and the note stops saying it was dismissed". Walked live: 2026-09-24 — three Project C runs kept all three rows.

## A96 · A run's "left open" counts every stage's rows — RUNS 2026-09-24

Fixture: an audit whose later stages (Library file, Web build, Broken tokens) file rows the components stage did not.

Assert the count. The run's `open` is written when the components stage records the run, and rewritten after every stage has filed, from the pulled record — the same rewrite that adds the later stages' cost. Before, Project D's clean re-audit recorded 25 open with 53 in the queue: 28 rows came from the two later stages after the count.

Runs: 2026-09-24 — a Project D run after the change recorded 53 with 53 open in the record, and the 12:21 run was corrected to 53 through `/patch`. **Not re-created:** a run in which later stages file new rows; that run had none, so it shows the rewrite agrees with the record, not that it catches the undercount.

## A97 · More than one semantic collection

Fixture: Project A's Core publishes `03. Semantic` and its brand layer `04. Semantic - Brand` (29 variables, all published). Components bind colour from both, and the maintainer rules both correct.

Assert: the `semantic` setting may be a name or a list. A fill bound from any listed collection raises no `fill-collection` warning, and one from an unlisted collection still does, naming every accepted collection. A single name behaves as before. `test-audit.mjs` asserts the list form. Before this, one Project A run raised 25 "bound from 04. Semantic - Brand instead of 03. Semantic" warnings.
Runs: node tests/test-audit.mjs — "a fill from any listed semantic collection is not raised"

## A98 · A breaking fix names which kind it is, and a rename is breaking for the API, not the file — WALKED 2026-10-01
Fixture: a two-variant set (`Size=Large`, `Size=Small`) with a text property, a nested icon instance and a plain text layer; one consumer instance carrying a text-property value, a text override, a fill override on a layer and a fill override inside the nested icon; a component with a slot holding three consumer layers.
Assert: the audit files a variant option or property rename in *Breaking — schedule* as an API change, naming Code Connect, scripts and Swap library, **not** as rewriting overrides. Tested: `Large` → `Lg` and `Size` → `Scale` both kept the instance on its variant with every override.
Assert: a property deletion, a nested instance re-pointed to another variant, and a slot property deletion are filed as losing consumers' work. Tested: deleting the text property reverted the instance's text to its default; swapping the nested icon to `Shape=Square` reset its fill override; deleting the slot property left an empty frame where three layers had been.
Assert: a layer rename is an *Approve & I fix* item only when applied to every variant. Tested: renaming `Bg` set-wide and wrapping `Note` in a new frame kept both overrides; with `Note` renamed to `Hint` in one variant only, a consumer's text override was lost on switching to it, and kept when the names matched.
Assert also (negative): no row claims a variant rename "rewrites instance overrides".

Walked live: 2026-10-01 — each change above tested on a scratch fixture in Figma, as the asserts record.

## A99 · The probes and fix recipes run from code, and the prose holds none — RUNS 2026-10-03

Fixture: `scripts/probes.js`, `references/scanner-checks.md`, and plain-object stand-ins for component sets, variants, instances and variables in `tests/test-probes.mjs`.

Assert the move. `standards/tests/check.sh` raises no `[G]` line for this skill: no fenced `js` block of eight lines or more remains in `SKILL.md` or a reference, and every section of `scanner-checks.md` that held one now names its engine — a rule in `scanner/audit.js` or an `FCA.*` function in `scripts/probes.js`. Every `FCA.*` name the prose cites is defined in the file.

Assert the probes (runs, in node). Schema, property naming, wrap row gap, anatomy, state coverage, metadata, focus rings, sizes, contrast and `resolveInMode`, text coverage, case classification, the detached-page decision, disabled paints, orphans, fixed text and visibility-only axes each have an assertion that fails when the probe is broken. Negative halves, the ones that rot silently: schema raises no state or axis-order finding without the project's words; a hugging text node reported `FIXED` is not fixed text; a healthy remote main is not an orphan, and each remote key is imported once; an axis with one non-visibility pair is not a suspect.

Assert the defects stay fixed. `caseShape("WCAG")` is `upper`; a plain `COMPONENT` is measured as itself, not its layers; an alias resolves by mode name with its alpha; a reference merge keeps the references already there.

Assert the gate (runs, in node only). The hash ignores comments and whitespace and changes with a token; `node scripts/probes.js` prints the hash a paste must report. **Not walked live:** the in-Figma paste, the refusal of a mismatched paste, and the bootstrap's stale-cache refusal. The live calls (`locate`, `discover`, `nameSpaces`, `detachedScan`, `sweepSchema`, `fix.*`) are syntax-checked only.

Runs: `node tests/test-probes.mjs`.

## A100 · The token walk's four extras and the collection key run in the scanner — RUNS 2026-10-03

Fixture: a one-variant probe set in `tests/test-audit.mjs` — a 96px and a 12px raw padding, a 6px raw radius, a rectangle and a text layer bound to a text-role colour, a vector stroked at 1.5 with its weight unbound beside one with it bound, and a frame bound to a variable from a collection whose key is not allowed — and the real eight-set slice.

Assert, with `spacing`, `radius`, `textRole` and `allowedKeys` set: the 96px padding is `review`, *OFF-SCALE, nearest 32*, *may be a layout mechanism*; the 12px padding and 6px radius name their nearest steps; the rectangle's text-role fill is a warning and the text layer's is not; the unbound vector fires on the shorthand and the bound one does not; the foreign key fires once, the allowed bindings never.

Assert (negative): with none of those settings, no nearest step, no review, no role warning and no key warning — only the raw values and the shorthand stroke. Over the real slice with `textRole` and `allowedKeys` set, nothing beyond the three known rows.

**Not walked live.** The slice holds no stroke without per-side weights, so the shorthand rule has no control pass on real data yet; and that a `teamLibrary` collection key equals the imported collection's `key` is assumed until a live run with `allowedKeys` is silent on a known-good library.

Runs: `node tests/test-audit.mjs` — "the scale note names the nearest step…", "without the settings, none of the new notes or checks runs".

**Corrected 2026-10-03 (2.13.1):** the slice's variables carried no `key` at 2.13.0, and the scanner skips a binding without one, so the control run over the slice could not fire and "nothing beyond the three known rows" proved nothing. The fixture's variables now carry illustrative collection keys (`k-<collection>`), and the control is executed: all four allowed is silent beyond the three rows; the Semantic key withheld fires on the slice's own Semantic bindings and nothing else. Runs: `node tests/test-audit.mjs` — "over the real slice with every collection key allowed…", "with the Semantic key not allowed…".

## A101 · Review fixes: local keys allowed, orphan retry, three probe tests that could not fail — RUNS 2026-10-03

Fixture: stand-in nodes and a stand-in `figma` in `tests/test-probes.mjs`.

Assert: `FCA.discover()`'s `allowedKeys` holds each local collection's key labelled `local :: <name>` beside the library keys, so a library binding its own variables raises no off-library warning. Assert (negative, 2.13.2): a default-named local collection (`Collection 1`) is listed with `defaultName` but its key is not allowed, and a collection with `remote === true` is skipped rather than relabelled local. `FCA.orphans` retries a failed key import once: a key that fails then resolves is not an orphan, and a key that fails twice is. Assert (negative): `stateCoverage` reports `hasDisabledAxis: false` for a set without the axis; `metadata` calls an 11-character description with no placeholder word a placeholder; `disabledPaints` never reports a hidden paint inside an instance.

Runs: `node tests/test-probes.mjs` — "discover: allowedKeys holds…", "discover: a default-named collection and a remote collection are not allowed as local", "discover: the default-named stray is still listed and flagged", "orphans: a key that fails once…", "state coverage: a set without the disabled axis…", "metadata: a description under 12 characters…", "disabled paints: found per prop and index, a figma.mixed fill neither throws nor loses them, an instance is never entered".

## CN1 · Consistency rows are filed from the stored contracts and never close this skill's own — *executed*
Fixture: a library whose components carry one prop as a variant on some and a boolean on others, and one prop name spelled two ways.
Assert: each is raised on the components in the minority; same values under different names, subsets and differing defaults raise nothing; a run names every check it made, so the rows of a withdrawn check close.
Runs: node tools/component-contract/test-analyze.mjs — every case

## A102 · Sizes follow figma-standard rule 6 — WALKED 2026-10-07
Fixture: the library slice with `Size` on the recorded scales; `Chip` given an `Icon size` axis of `16`/`32` whose `32` variants draw 24px; three sets with `Size=md` at 40, 40 and 36px.
Assert: Chip is raised for the property name, for values off the scale and for `Icon size=32` drawing 24px; only the 36px set is asked about `Size=md`, naming the 40px majority.
Runs: node tests/test-audit.mjs — "figma-standard rule 6: a size property not named Size, values off the scale, and a numeric size that draws another size", "figma-standard rule 6's ideal: the set drawing a size name off the majority height is asked, the others are not"

## A103 · Every preference comes from the settings; an absent key skips its check — WALKED 2026-10-07
Fixture: sets with a size property, a True/False variant out of order, a state axis named `Interaction`, a bare boolean `Avatar` and a text property `Label text`; run once with the house settings and once with none.
Assert: with the settings, the size, renders-nothing and property-name findings are raised from `sizeAxis`, `stateAxis`, `booleanPrefix` and `textPropertyAvoid`; with none, none of them is raised. Boolean order takes no setting: figma-standard rule 1 raises a True/False axis whose default is not listed first (`schema|bool-default|`) in both runs. The probes behave the same for metadata, minima and exempt pages.
Runs: node tests/test-audit.mjs — "without sizeAxis in the settings, no size finding is raised", "without sizeShared, the shared-value review is not raised", "figma-standard rule 1: a True/False axis whose default is not first is raised; one listing its default first is not", "a state axis named otherwise still gets the renders-nothing check", "a bare boolean and a text property ending in text are raised from the settings", "and without those settings no property name is raised"; node tests/test-probes.mjs — "metadata: without the settings, only an empty description and one that repeats the name are raised", "sizes: with no minima in the settings, nothing is measured against a guess", "detached: with no exempt pages in the settings, a cover page is a candidate like any other"

## A104 · A component's sizes run unbroken — WALKED 2026-10-07
Fixture: a set whose `Size` options are `xl`, `md`, `sm`, `2xs` against the house scale; then `lg`, `md`, `sm`, `xs`.
Assert: the first raises one finding naming `lg` and `xs` as skipped; the second raises none.
Runs: node tests/test-audit.mjs — "figma-standard rule 6: a component's sizes that skip a step are raised, naming the missing steps", "and an unbroken run is not"

## A105 · Disabled sits immediately after its Rest sibling — WALKED 2026-10-08
Fixture: the library slice, whose `Password input` keeps each `Disabled=True` beside its `State=Rest` sibling and whose `Button - CTA` and `Menu button` put it after `Loading`; then `Password input` with one Disabled variant moved after Hover; then no `disabledAxis` setting.
Assert: the slice raises nine `Button - CTA` findings and one `Menu button`, none on `Password input`; the moved variant is raised, naming its sibling's other axes; with no `disabledAxis` nothing is raised (figma-standard rule 3).
Runs: node tests/test-audit.mjs — "figma-standard rule 3: the slice's sets that put Disabled last are raised, and Password input, which keeps it beside Rest, is not", "and a Disabled variant moved after Hover is raised, naming its sibling", "without disabledAxis in the settings, no order finding is raised"

## A106 · The reader reads the judgement rules — 2026-10-08
Fixture: SKILL.md's workflow.
Assert: a step runs `bin/closing --judgement figma-standard` and reads the components against each listed rule before judging; without it, the rules marked *Reviewed:* have no moment they are read.
Traced: 2026-10-08 — to SKILL.md workflow step 4, and to `tools/toolkit-check/closing.mjs` `judgement`, which `node tools/toolkit-check/closing.mjs --judgement figma-standard` runs.

## A107 · An acronym in a property name keeps its capitals — WALKED 2026-10-08
Fixture: properties `Show AM-PM`, `Show AI badge` and `Show Badge` with `propertyCase` sentence.
Assert: only `Show Badge` is raised; an all-capitals word is an acronym (figma-standard rule 18). Found live: Project B's `_🚧 Time input picker` raised `Show AM-PM`.
Runs: node tests/test-audit.mjs — "property naming: an acronym keeps its capitals (figma-standard rule 18)"

## A108 · Binding one side of a uniform stroke binds all four — WALKED 2026-10-08
Fixture: a node with a uniform 1px border (all four per-side weights 1), and one with a top-only border.
Assert: `FCA.fix.bindVariable` on `strokeTopWeight` binds all four sides of the first and only the top of the second. Found live: on one library's time picker, binding the top weight alone made Figma drop the other three sides to 0, and the border lost three edges until they were bound too.
Runs: node tests/test-probes.mjs — "binding one side of a uniform stroke binds all four; a top-only border binds its top alone"

## A109 · The scanner owns axis order and a boolean's default-first order — WALKED 2026-10-08
Fixture: the library slice's `Chip` with `Dense` (True · False, default False) and `Wide` (True · False, default True); `Password input` with its axes reordered State first and Disabled apart from it.
Assert: `Dense` is raised, `Wide` is not; the reordered set raises State-not-last and Disabled-not-before-State (figma-standard rule 1). The probes no longer carry their own copy, so one engine, the one the dashboard runs too, owns each check. Found by the 2026-10-08 review: removing the house's False→True order had switched off the only boolean-order check that ran.
Runs: node tests/test-audit.mjs — "figma-standard rule 1: a True/False axis whose default is not first is raised; one listing its default first is not", "and an axis order with State first and Disabled apart from it is raised twice"

## A110 · A private part's missing description is hygiene — WALKED 2026-10-08
Fixture: the slice's `Chip` and `_Upload area - File item`, both with the description emptied, `internalPrefix` `_`.
Assert: `Chip` raises an error, `_Upload area - File item` hygiene (figma-standard rule 25).
Runs: node tests/test-audit.mjs — "figma-standard rule 25: no description is an error on a public component and hygiene on a private part"

## A111 · Text set by override on a nested instance with variants is raised — 2026-10-08
Fixture: the slice's `Chip` holding three nested instances: `Item`, a `Tree item` instance (two variants) with a text override; `Count`, a single-variant `Badge` instance with a text override; `Other`, a `Tree item` instance with only a fill override.
Assert: only `Item` is raised (figma-standard rule 38). The behaviour it guards was tested on throwaway copies in one library on 2026-10-08: the override is dropped when the nested instance switches variant inside its parent. Walked live 2026-10-08 on three libraries: two candidates in all, Project A's `Pagination` and Project B's `Org switcher`. A value set through the nested item's own text property counts as a `characters` override too (`Pagination - Item`'s number is bound to its `Label text` property and listed as overridden). That route also loses the text on a variant switch, per the same run's test, so the check raising it is right.
Runs: node tests/test-audit.mjs — "figma-standard rule 38: a text override on a nested instance whose set has variants is raised; one on a single-variant set or a fill override is not"

## A112 · A layer a sibling variant shows is not a dead hidden layer — WALKED 2026-10-08
Fixture: the slice's `Chip` with `Spinner` hidden in one variant and shown in another, and `Ghost` hidden in both.
Assert: only `Ghost` is raised as a hidden layer wired to nothing; a layer some variant draws is variant-driven (figma-standard rule 34). Found by the 2026-10-08 review: the check had raised a focus ring or spinner that only one variant shows.
Runs: node tests/test-audit.mjs — "figma-standard rule 34: a layer hidden in every variant is raised; one a sibling variant shows is not"

## A113 · Text contrast in the mode on screen — WALKED 2026-10-10
Fixture: the slice's `Chip` on its light-grey surface with `Pale` (grey 0.8, 14px), `Ink` (grey 0.1, 14px) and `Big grey` (grey 0.5, 28px); a copy whose variant is `Disabled=True` with `disabledAxis` set.
Assert: only `Pale` is raised, at 1.3:1 below 4.5:1; the measure counts 3 judged and 2 passing; the disabled copy raises nothing (figma-standard rule 32, WCAG 1.4.3).
Runs: node tests/test-audit.mjs — "figma-standard rule 32: text under 4.5:1 on its opaque surface is raised; dark text and large text over 3:1 are not", "and the measure counts every text layer judged and every pass", "disabled text is exempt (WCAG 1.4.3)"

## A114 · A frame holding layers uses auto layout — WALKED 2026-10-10
Fixture: the slice's `Chip` with `Overlay` (no auto layout, one rectangle inside) and `Spacer` (no auto layout, empty).
Assert: `Overlay` is raised as a review, `Spacer` is not (figma-standard rule 33). Found live: 23 of 479 frames in one library's snapshot had no auto layout, and an agent reading them through Figma's MCP gets absolute positions.
Runs: node tests/test-audit.mjs — "figma-standard rule 33: a frame holding layers without auto layout is a review; an empty frame is not raised"

## A115 · Every automatic layer name is raised — WALKED 2026-10-10
Fixture: the slice's `Chip` with a `Line 3` and an `Image` layer.
Assert: `Line 3` is raised and counted in `autoNamed`; `Image`, a chosen name, is not (figma-standard rule 10). Found by the 2026-10-10 measurement audit: the scanner's list held 6 types and the site's held 16, so the two counts could disagree.
Runs: node tests/test-audit.mjs — "figma-standard rule 10: \"Line 3\" is an automatic name; a chosen \"Image\" is not", "and the measure counts it"

## A116 · Usage, Don't and Code gen notes; a slot part owes none — WALKED 2026-10-10
Fixture: the slice's `Chip` with a description holding Usage and Don't, a `Chip - Item` component placed in a SLOT of `Chip`, `internalPrefix` `_`; the same run without `internalPrefix`.
Assert: `Chip` raises only the Code gen notes review; `Chip - Item` raises nothing; without the prefix the check does not run (figma-standard rule 25). Found live: `Radio group - Item` is public only so its slot gets updates, and was being asked for Usage it never owes.
Runs: node tests/test-audit.mjs — "figma-standard rule 25: a description with Usage and Don't asks only for Code gen notes", "a slot part (its family's name, placed in a SLOT) is audited and asked for no section", "without the private prefix the check does not run"
Re-walked 2026-10-25: the fixture had put `Chip - Item` on the Cover page, which is never audited, so the slot-part assertion passed without checking anything; it now sits on Chip's page and the assertion requires it to be audited.

## A117 · Focus state, target size and accessible name on interactive components — WALKED 2026-10-10
Fixture: the slice's `Button - CTA` with `focusState` Focus and `minTarget` 24: as is; with Focus removed from its State options; with one variant at 20×20; with every text layer and text property removed, then with an annotation added.
Assert: as is, nothing; without Focus, one error (figma-standard rule 39, WCAG 2.4.7); the 20×20 variant, one review naming it (figma-standard rule 26, WCAG 2.5.8); no text, one review for its accessible name, and the annotation clears it (figma-standard rule 40, WCAG 4.1.2).
Runs: node tests/test-audit.mjs — "figma-standard rule 39: a state axis that has Focus raises nothing", "and one without Focus is an error (WCAG 2.4.7)", "figma-standard rule 26: a variant under the target size is a review naming the smallest (WCAG 2.5.8)", "figma-standard rule 40: an interactive component with no text and no text property is asked for its accessible name (WCAG 4.1.2)", "and an annotation answers it"

## A118 · Text inside a nested instance counts — WALKED 2026-10-10
Fixture: the slice's `Chip` with a pale text inside a nested `Label part` instance; `Button - CTA` with every text removed but a `_Label` instance holding one.
Assert: the pale text is raised for contrast (figma-standard rule 32), and the button is not asked for an accessible name (figma-standard rule 40). Found by the 2026-10-10 review: both checks stopped at instances, where most labels live.
Runs: node tests/test-audit.mjs — "figma-standard rule 32: text inside a nested instance is judged against the component's surface", "figma-standard rule 40: a label inside a nested instance is text of its own"

## A119 · Every finding says what goes wrong, what it does, and the fix — WALKED 2026-10-11
Fixture: the slice with every site planted, as A100 and the planted-sites case build it; the probe set with and without the scales.
Assert: every candidate carries `advice`, never the finding restated; a raw value's sentence names the property as Figma's panel does and the cost ("so a change to the spacing tokens never reaches it"); the advice names the step to bind, or asks the mechanism question for a padding of 80 or more; keys and severities are those of 2.24.2 (design-standard rule 10; content.md *Messages a tool writes about findings*). Found by the 2026-10-11 front-end audit: rows led with the check that fired, and a session audit filed "Fix it in Figma, or record a ruling." on every row.
Runs: node tests/test-audit.mjs — "every candidate carries advice, and the advice is not the finding restated", "and the advice names the step to bind, or asks the mechanism question", "every finding site fires once, where it was planted"

## A120 · A boolean that switches a style stays bare — WALKED 2026-10-12
Fixture: the library slice's `Chip` with an `AI` boolean that shows a childless `AI stroke` frame, under `booleanPrefix` "Show ".
Assert: `AI` is not raised, while `Icon`, which reveals an instance, still is (figma-standard rule 21). Found live: Project B's merged `Button` names its gradient-stroke boolean `AI`, matching `variant="ai"` in code.
Runs: node tests/test-audit.mjs — "a bare boolean that switches a style, revealing no text, instance or slot, is not raised (figma-standard rule 21)", "a bare boolean and a text property ending in text are raised from the settings"

## A121 · An overlay part covers its parent, locked — WALKED 2026-10-13
Fixture: the library slice's `Chip` with a `State layer` instance, under `overlayComponents` ["State layer"]: once locked, Stretch both ways, at 0,0 and its parent's size; once unlocked, Scale, at -1,0 and 4px wider; then with no `overlayComponents`.
Assert: the first is not raised; the second is raised once for the set, naming all four faults; with no setting nothing is raised (a project rule, from its settings). Found live: Project B's web library, 380 of 390 state layers off on 2026-10-13.
Runs: node tests/test-audit.mjs — "overlayComponents: a locked, stretched state layer at 0,0 and its parent's size is not raised", "and one unlocked, scaled, off 0,0 and oversized is raised once, naming each fault", "without overlayComponents nothing is raised"

## A122 · A variant binds the tokens of its own state — WALKED 2026-10-15
Fixture: the library slice's `Button - CTA` with a `Control/Neutral/base-rest` fill on the root of one Hover variant only, a `Control/Neutral/base-hover` fill on the first layer of its Press twin, and a `Knob` carrying `base-rest` in Rest, Hover and Press.
Assert: the Hover root and the Press layer are each raised once as `states|token|`; the knob is not, because its resting sibling carries the same token on the same layer (figma-standard rule 48). Found live on 2026-10-15: a project's web library painted a square Rest fill behind 36 rounded Hover, Press, Focus and Disabled buttons, left a Hover fill on a Date picker's Press variant and a Hover fill on two Focus radios. Pairing layers by index raised 47 false hits on the same file (a Loading spinner shifts every index); pairing by name path and skipping states no token names left it silent across 43 sets once fixed.
Runs: node tests/test-audit.mjs — "figma-standard rule 48: a resting token added in Hover only, and a Hover token in Press, are raised; a knob at rest in every state is not"

## A123 · A part is decided by where it is used, not by its name — WALKED 2026-10-25
Fixture: the slice's `Chip` page gains `Chip preview item`, used only inside `Chip`, and `Chip badge`, used inside `Chip` and inside a `Card` on its own page; `internalPrefix` `_`.
Assert: `Chip preview item` is audited and asked for no section; `Chip badge` raises the Usage and Don't warning (figma-standard rule 25). Found live on 2026-10-25: a project library's `Photo upload preview item`, `Dropdown menu item - Checkbox` and two context-menu rows, named unlike their parents, were asked for full sections the descriptions skill never writes for a part. Against the family-name scanner the first assertion fails.
Runs: node tests/test-audit.mjs — "a part used only inside a component on its own page is audited and owes no section, whatever its name", "a part also used on another page is a component of its own and owes them"

## A124 · A state is a bare word, and Has is for a content variant — WALKED 2026-10-25
Fixture: the slice's `Chip` gains an `Is open` and a `Has value` True/False variant, a `Has border` boolean that shows a frame, and a `Has badge` boolean that shows an instance; `booleanPrefix` `Show `; the same run without it.
Assert: `Is open` and `Has border` raise `naming|prop-state|` with `Open` and `Border` as the fix; `Has value` raises nothing; `Has badge` raises `naming|prop-boolean|` with `Show badge`; without `booleanPrefix` none is raised (figma-standard rule 21). Asked for directly on 2026-10-25: the rule decided both words and nothing checked either.
Runs: node tests/test-audit.mjs — "figma-standard rule 21: "Is open" and a style boolean "Has border" take the bare word; "Has value" on a variant stands", "a revealing boolean named "Has badge" is told to take Show, without the Has", "and without booleanPrefix neither is raised"

## A125 · Names in sentence case, and a part's layer is its last word — WALKED 2026-10-25
Fixture: the slice with `propertyCase` `sentence` and `internalPrefix` `_`; then `Chip` gains layers `Leading Icon` and `Show AM-PM`, a `Tone` axis of `Soft danger` and `Bold Danger`, a `Data Table` component, and instances layered `_Chip close button`, `Chip preview item`, `Item 2` and `Button` of the parts `_Chip close button` and `Chip preview item`.
Assert: the eight real sets raise no case finding; `Leading Icon`, `Bold Danger` and `Data Table` raise `naming|layer-case|`, `naming|value-case|` and `naming|component-case`, `Show AM-PM` nothing; the two full-name layers are told `Button` and `Item`, the numbered and renamed ones nothing; without `propertyCase` no case finding (figma-standard rules 18 and 9). Asked for on 2026-10-25: a project's naming pass was done by hand because the scan checked case on properties only and a part's layer not at all.
Runs: node tests/test-audit.mjs — "figma-standard rule 18: the eight real sets, in sentence case, raise no case finding", "a layer, an option and a component with a capital inside are preferences; an acronym is not", "figma-standard rule 9: a part's layer carrying its whole name is told to take the last word; a numbered copy and a renamed one stand", "and without propertyCase no case finding is raised"

## A126 · A variant's own description is its set's or nothing — WALKED 2026-10-25
Fixture: the slice's `Chip`, its first variant given no description, then the set's text, then other text.
Assert: only the third raises `metadata|variant-description`, a warning naming 1 of the set's variants (figma-standard rule 25). Found live on 2026-10-25: five sets of a project library kept older variant descriptions after the sets' were rewritten, one of them another component's.
Runs: node tests/test-audit.mjs — "a set whose variants hold no description of their own raises nothing", "a variant holding the set's text raises nothing", "a variant holding other text is a warning"

## A127 · A naming preference is filed as one — WALKED 2026-10-26
Fixture: the slice's `Chip` with `Show Badge`, `Label text`, a bare boolean `Icon`, `Is open`, a layer `Leading Icon` and an option `Bold Danger`.
Assert: each is raised with severity `preference`, never `warning` or `hygiene`; a stray space and a default layer name keep `warning` (figma-standard, Naming). Asked by the maintainer on 2026-10-26: naming conventions are preferences.
Runs: node tests/test-audit.mjs — "a layer, an option and a component with a capital inside are preferences; an acronym is not", "a bare boolean and a text property ending in text are raised from the settings", "property naming: an acronym keeps its capitals (figma-standard rule 18)"

## A128 · The fix queue is rendered from the record, not assembled — WALKED 2026-10-30
Fixture: `tools/figma-audit/fixtures/queue-record.json` — one library with a figma URL, two audit runs and a later sweep, and rows across b1–b3: a user-visible error, a warning, a ticked preference nothing verified, a verified row, a legacy row with no owner, a schema reorder, a state question whose option list carries a pipe, a breaking change from the snapshot router and a foundations row with a 146-character claim.
Assert: the mirror and the chat report equal `fixtures/queue-mirror.md` and `fixtures/queue-chat.md`; a verified row is left out and a ticked, unverified one is in, ticked, in the mirror only; user-visible leads its bucket, then error, warning, preference; the chat carries no URL and the mirror deep-links every row with a node; no cell carries a pipe, and every row's pipes match its header; the delta and the metrics come from the latest audit run, never the sweep; `--owner` keeps one skill's rows and the legacy ones; the record's row order moves no line. Assert the negative: the over-budget claim and the missing closing words are named as gaps; with no run there is no delta or metrics block; a record of two libraries needs `--file-key`.
Runs: node tools/figma-audit/test-fix-queue.mjs — all 16.
