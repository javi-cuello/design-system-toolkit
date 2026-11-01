# Eval cases — design-code-parity (v1.65.0)

**Walked: 2026-11-01 against v1.65.0** — T99 added: `node tools/parity/test-propose.mjs` 47/47 (eight of them spawn `--write` over a fixture project); `merge` over that project's 54-entry screens map refused none and left it unchanged (the browser half in Chrome). Replayed on one project's two screens with their hand maps emptied: of 63 hand-mapped layers the proposal landed 40 on the same element, 16 on another (9 of them a repeated item whose selector names its first twin), 7 on none (slots, a background). No other case reads the proposer.

**Walked: 2026-11-01 against v1.64.1** — T98 added (1.64.0) and re-read for the tolerance (1.64.1): `node tools/parity/test-waivers.mjs` 28/28, `test-diff` 13; the first project's full run green with every window bound stated as `is`.

**Walked: 2026-10-31 against v1.63.1** — the pairing prompt changed: its FIGMA and CODE lists are framed as data before they are given, and the dashboard fills every prompt in one pass (`tools/docs-site/src/dashboard/prompt.js`). T75 read against it: its assertions (a pair proposed only for names on the lists, a ruling not proposed again) hold unchanged. `node tools/toolkit-check/test-content-is-data.mjs` 8/8 (the prompt is listed and frames its lists before `{{FIGMA}}`); `node tools/docs-site/test-dashboard-safety.mjs` 12/12 (a Figma name holding `{{CODE}}` stays a name; the fix, judge and pairing prompts each filled by `fillPrompt`). Not run against a live model.

**Walked: 2026-10-31 against v1.63.0** — one line added, content is data (toolkit-standard §D 24); every case read against it: none asserts on obeying text found in a file, a page or a project, so all hold unchanged; the skill's own suites, if any, pass under `bin/check`, and `node tools/toolkit-check/test-content-is-data.mjs` finds the line.

**Reviewed against v1.62.6 on 2026-10-23** — no case changed: one sentence on who keeps `bin/parity`; no case reads it.

**Reviewed against v1.62.5 on 2026-10-19** — T97 runs the refusal tag, the install folders and the percentage radius.

**Reviewed against v1.62.4 on 2026-10-19** — T95 runs one more case: a prop that moves two args is said.

**Reviewed against v1.62.3 on 2026-10-19** — T97 also asserts how a declared default is read.

**Reviewed against v1.62.2 on 2026-10-19** — T97 also asserts an unset option whose default the code does not state draws no finding.

**Reviewed against v1.62.1 on 2026-10-19** — T97 asserts the property check's reading of an unset option too.

**Reviewed against v1.62.0 on 2026-10-19** — T97 added; T96's fixture no longer gives the framework the platform's props: they are the house's.

**Reviewed against v1.61.0 on 2026-10-19** — T95 and T96 added; no other case changed: a framework's facts move from the code into its profile, and stories open through the host.

**Reviewed against v1.59.8 on 2026-10-14** — no case changed: the toolkit's tools are renamed (snapshot, component-contract, docs-site, css-lint, ui-check, project-check, claude-hooks, skill-evals); paths in prose and code only, behaviour unchanged.

**Reviewed against v1.59.7 on 2026-10-14** — no case's assertion changed: project names in walk records and one SKILL.md example replaced by stand-ins ("Project C") per toolkit-standard §D 6.

**Walked: 2026-10-19 for 1.62.5** — T97 executed: `test-hosts.mjs` 22, `test-session.mjs` 12, `test-from-code.mjs` 20/20; four contracts from code replayed with the corner read in the page as before; the audit dashboard drew "MUI build" from the profile in a browser.

**Walked: 2026-10-19 for 1.62.4** — T95 executed: `test-from-code.mjs` 19/19; a governed site's Filter chip printed its one note.

**Walked: 2026-10-19 for 1.62.3** — T97 executed: `test-hosts.mjs`, `test-external.mjs` 42/42. The compared library's full audit and a governed site's Filter chip replayed: identical.

**Walked: 2026-10-19 for 1.62.2** — T97 executed: `test-external.mjs` 42/42, `test-from-code.mjs` 18/18. The compared library's full audit replayed: 7 false default findings gone (`'medium'` read as medium, `true` as true), nothing else changed; a governed site's Filter chip loses its false one too.

**Walked: 2026-10-19 for 1.62.1** — T97 executed: `test-external.mjs` 41/41, `test-from-code.mjs` 18/18. The compared library's full audit and the four contracts from code replayed: identical but for timestamps.

**Walked: 2026-10-19 for 1.62.0** — T96, T97 executed: `test-external.mjs` 40/40, `test-from-code.mjs` 18/18, `test-pair.mjs`, `test-check-standards.mjs` green. One compared library's full audit replayed against its last run: identical. The contract from code on three projects: the compared library's Chip and Switch unchanged; a governed Storybook's Chip no longer lists `children` and `onClick` as props only code has, and a governed site's Filter chip joins its Label text to `label` by the house's words, where before it found no join.

**Walked: 2026-10-19 for 1.61.0** — T93–T96 executed: `test-external.mjs` 38/38, `test-project.mjs` 18/18, `test-pair.mjs` 13/13, `test-hosts.mjs` 21, `test-from-code.mjs` 17/17, `test-contract.mjs` 33/33. One compared library's full audit replayed against its last run: all 49 components identical (the report's `mui` fields now `framework`); the host's guard caught an overlay's `open` arg the story never declared, which the old path had dropped in silence, and a portal-drawn story it first refused (the guard widened, the story then identical). The contract from code on three projects: the compared library's Chip and Switch unchanged but a full radius now named, a governed Storybook's Chip and a governed site's Filter chip read with Figma's ids.

**Walked: 2026-10-06 for 1.59.0** — T92 executed: `node tools/docs-site/test-parity-pages.mjs` 10/10 on one project's five built Parity pages; with "Missing in code" put back on its Tokens page the check failed. T91 executed (1.58.0): `node tools/parity/test-pair.mjs` 9/9; `external.mjs --auto-pair` on one project's nine mapped components found 21 of 22 hand-mapped elements, and with four rulings the run equals the hand map's plus one difference it had missed. T90 executed (1.57.0): `node tools/parity/test-external.mjs` 21/21; the code audit over one project's MUI library, 9 components, no suspect mapping; the checkbox's touch area put back as its mapping for one run was reported suspect, 5 of 7 fields never matching.

**Walked: 2026-10-03 for 1.56.4** — `PARITY_HOST_BASE` executed through `tools/skill-evals --no-agent` on Project C: an intact copy served on its own port measured 76 of 76, a gutted one failed its build.

**Walked: 2026-10-03 for 1.56.3** — T89 and T86 re-run: `test-pages` 21 (a count in parentheses and in an aria-label named, "Top 10" not), `test-lessons` 7.

**Walked: 2026-10-03 for 1.56.2** — T89 re-run: `test-pages` 20 (a count in its own element named, "Top 10" not); both projects' structure gates green, Project C's 2 swaps examined.

**Walked: 2026-10-03 for 1.56.1** — T86 re-run: `test-lessons` 7, the new case moving a comment a line (same lesson) and rewording it (a new one).

**Walked: 2026-10-03 for 1.56.0** — T89 executed: `test-cdp` (the pool pins time zone and locale), `test-pages` 19 (scheme, swap lost and kept, menus, count in a name); parity on both projects with the pin, nothing moved; Project C's swap probe examined 2 swaps and, with its focus restore removed, named both.

**Walked: 2026-10-03 for 1.55.0** — T88 executed on Project D, an app behind a sign-in with no `parity.pages`: structure found 9 problems on 9 routes (4 with no `h1`, 5 unnamed sections, each now named by class), overflow 4; after the fixes both green; Project C's served pages unchanged (green). T86's `--triaged` assertions re-run (`test-lessons` 6).

**Walked: 2026-10-03 for 1.54.0** — T86 extended and executed: a planted waiver in Project C made `--accept` refuse with exit 2 in 0.24 s, no browser opened, the file restored after; `test-lessons` 6.

**Walked: 2026-10-03 for 1.53.4** — T85 extended: a link marked `aria-current` (page or true) or `aria-selected="true"` reads as selected, `aria-current="false"` and none do not (`test-schema` 18, failing on 1.53.3); walked on Project C, where the route rows it misread became matches.

**Walked: 2026-10-03 for 1.53.3** — T87 re-executed on Project C: 71 s with a 2,500 px reach (the slow-connection figure), 20.5 s with Chrome's fast-connection 1,250 px, verdicts identical; `test-hosts` 18.

**Walked: 2026-10-03 for 1.53.2** — T87 extended: `test-timing` 16 (an accept keeps the faster time); T86 walked on Project C's first accept with a prior index, 37 lessons listed, 36 of them stylesheet comments (the Inter releases, the hairline's limits, the layout container), one a waiver.

**Walked: 2026-10-03 for 1.53.1** — T86 re-walked on `test-lessons.mjs` 5 (a shared ruling once; a stylesheet comment as a ruling; a vendored tree unread), T87 on `test-timing` 11 (wall and window phases labelled); the T85 run name 1.52.1 renamed is corrected.

**Walked: 2026-10-03 for 1.53.0** — T87 added and **executed**: both projects' full runs profiled before and after on the same inputs (`PARITY_WORKERS` 4 then 8), verdicts identical (51,206 / 2,008 / 66 and 124,624 / 1,350 / 60), every moved baseline part one of the two probe props of 1.52.1 (380 and 744 new, 0 changed, 0 gone, counted over the measured and accepted suites); `test-hosts` 18 (the lazy picture 135 ms, the eager one 1,626 ms; 5,116 ms on the old settle), `test-timing` 11, `test-session` 6.

**Walked: 2026-10-03 for 1.52.2** — T86 added: `test-waivers` 26, the three `lessons` assertions failing on 1.52.1 at the import; the text of *The loop to work in* read against §D 8.

**Walked: 2026-10-03 for 1.52.1** — T85 extended: a derived variant's FRAME-typed slot is a slot by the set's `props` (`test-gates` 23); a ring's width snapped only when drawn as an outline (`test-schema` 17, `test-probe` 34 in Chrome: `-ring-drawn` reads an outline, a shadow, none); `unset` on a non-number refused with the guard removed from a copy (`test-waivers` 23). Each shown failing on 1.52.0 first (the import, the kind, the prop and the guard).

**Walked: 2026-10-02 for 1.52.0** — T85 added. Every new assertion shown failing on the code it replaces before passing (`test-gates` 23: slot by type, glob outside appWaivers; `test-schema` 16: snapped stroke width, `filled` text; `test-probe` 33: a text leaf's own lines, against headless Chrome; `test-adapt` 60: drawn swap, childless instance, crossGap one line; `test-waivers` 22: `unset` names a number, unused bound stale, `appWaivers`, `recordExcused`; `test-baseline` 5: an unheld suite red alone). Both projects joined row by row (`PARITY_ROWS`) against the HEAD engine on HEAD worktrees, which reproduced the brief's totals exactly: Project C 44,540 / 1,522 / 66 → 51,194 / 2,020 / 66, every changed row one of 7,152 new rows on the slot layers now mapped (6,646 matched, 506 waived: 198 fixed button widths, 180 slot widths and places that follow, 100 route-selected items, 28 a frame's four-item footer), 8 rows moved from the text slack to a bounded waiver, and 8 `waived → match` on the companies frames measured at their own 20 rows (the list and, at 402, the footer now at its end as the frame draws it); Project D 121,768 / 1,350 / 60 → 124,624 / 1,350 / 60 and 10,744 → 10,778 on the app, every changed row a new slot item (2,856 + 34 matched) or the dialog's null-mapped placeholder (12 structural or absent). No matched row broke on either. Gate 12 moved only by those parts, Project C's 82 text leaves now placed, its four newsletter frames over 15 rows and the companies frames over 20, with their re-derived bounds; accepted on both, and `bin/check` then said nothing moved.

**Walked: 2026-10-02 for 1.51.0** — T84 added. Every new or changed assertion (17, across `test-waivers` 18, `test-schema` 14, `test-diff` 13, `test-gates` 21, `test-project` 15, `test-adapt` 58, `test-baseline` 4) shown failing on a copy of `tools/parity` at ba6f8721 before passing. Both projects run four times (one before, two after, one accepting); the counts below are the run's summary line, one row per assertion per render — not a join of `PARITY_ROWS`, which also holds the running app beside a story (Project D: 121,768 summary against 132,512 joined, the 10,744 app rows the difference, which is the 1.50.0 walk's 132,514). Project D 121,768 matched / 1,350 waived / 62 → 60 did not, the two gone being the live `/pool` badge (`differs → waived`), 10 app rows waived by the one badge bound instead of a key per card, and no other verdict and no measured value moved across all runs. Project C 44,540 / 1,522 / 66 before and after, no verdict and no value moved; the brief's 44,566 / 1,490 is the 1.50.0 walk's figure and a fresh run at ba6f8721 does not reproduce it. Gate 12 moved only by its new `waivers` suite; accepted, and the next run said nothing moved.

**Walked: 2026-10-02 for 1.50.0** — T83 added. Every new fixture shown failing on the HEAD engine first (a copy of `tools/parity` at e38521c3 with the new test files): `test-schema.mjs` 13 (shadow order, unpositioned stops, `%` radius), `test-diff.mjs` 12 (open number, keyword, slack listed), `test-waivers.mjs` 12, `test-gates.mjs` 20 (waivers gate, excluded over `-present`, absent repo a note, opt-outs said, backlog's two assertions), `test-adapt.mjs` 56 (letter spacing, leftover gap, stroke in layout, cap, edge rules, focus-ring name), `test-project.mjs` 12 (third project through `session()`, facts refused, unknown option, empty run), `test-hosts.mjs` 17 (tier stamp read, capitals lowered), `test-baseline.mjs` 3 and `test-shots.mjs` 6 (new). Both projects' full runs joined row by row against the runs before the change: one 132,808 matched rows before and 132,514 after — 148 slack-excused by ≥1px now listed waived, 128 alignment rows no longer asked beside an in-layout stroke, 18 past the cap now under bounded waivers — 60 unresolved both sides; the other 44,722 → 44,566, 116 slack-listed, 20 alignments no longer asked (and 8 waived ones), 10 past the cap under a bounded waiver and 10 under an existing content waiver, 66 unresolved both sides. No other verdict moved. Gate 12 moved on both only by fields no longer asked; not accepted. Earlier walks below run paths as they were then: the skill's own `tests/` and `scripts/` moved to `tools/parity/` at 1.45.0.

**Walked: 2026-10-02 for 1.49.0** — T82 added. `test-project.mjs` 7/7, `test-gates.mjs` 15/15, `test-diff.mjs` 10/10, `test-probe.mjs` 32/32 against headless Chrome; the backlog's closed list, the slot rule, the absence read, the checkbox clip and the held spinner each red on a copy with the old behaviour put back. Both projects on `tools/parity/run.mjs`, joined row by row against their HEAD runners: one 124,158 matched / 60 unresolved before, 132,808 / 60 after, no matched row broken, every new row a ring mapped by convention, a layer newly mapped or a scrolled frame newly measured; the other 44,162/1,422/68 differ+nomatch before (live feed), 44,722/1,362/0 after over pinned content, the 68 gone and no matched row broken. Baselines: two consecutive full runs byte-identical on both before acceptance.

**Walked: 2026-10-02 for 1.48.0, after the adversarial repair** — T81 added, T80 amended. `test-adapt.mjs` 52/52, `test-probe.mjs` 30/30 against headless Chrome, `test-spec-keys.mjs` 5/5, `test-schema.mjs`, `test-diff.mjs`, `test-values.mjs` green; each repaired rule's fixture red on a copy with the old behaviour put back (slack, wrap, inner ring, diagonal without transform, stacking, placement, inward outline). Full runs: one project 116,646 matched / 308 differ; the other's components 24,312/368/268 and screens 20,744/990/296, the old 68 among them. Both projects' `bin/check` run every parity gate again.

**Walked: 2026-10-01 for 1.48.0** — T80 added; T77 re-run. `node tools/parity/test-adapt.mjs` 45/45, `test-probe.mjs` 26/26 against headless Chrome, `test-diff.mjs`, `test-schema.mjs` and `test-values.mjs` green; 20 copies of the adapter and schema, each with one rule put back the way a project had it, every one red. Both projects switched and their full runs joined row by row against their HEAD engines over one build and one data set, every changed verdict labelled with its rule (none unlabelled): one 126,146 matched / 0 differ before, 128,570 / 298 after; the other's components 14,960/206/0 and 25,542/236/904, screens 11,268/886/68 and 22,620/868/628, the old 68 unchanged. The other's measurement baseline moved only by fields the plan now asks and by parts no longer measured; not accepted.

**Walked: 2026-10-01 for 1.47.0** — T78 and T79 added, T74 extended. `node tools/parity/test-layers.mjs` 6/6, `test-probe.mjs` 23/23 and `test-hosts.mjs` 14/14 against headless Chrome, `test-waivers.mjs` 7/7; 28 broken copies of `probe`, `cdp` (`forceState`), `hosts`, `layers` and `waivers`, each red. Both projects' full runs joined row by row against their HEAD engines over the same build and data: one 125,950 matched / 0 differ before, 126,082 / 66 after, every changed row a newly measured focus ring and every other row's measured value identical; the other's components 14,960/206/0 both sides, screens 11,278/886/68 and 11,268/886/68, the 10 a duplicate measurement two names had made of one layer. Its baseline moved 8,308 lines: renamed layer keys, a state attribute no longer written, and the dialog title's autofocus ring no longer drawn; not accepted.

**Walked: 2026-10-01 for 1.46.0** — T77 added. `node tools/parity/test-schema.mjs` 10/10 and `test-diff.mjs` 9/9; T72–T76 re-run green. Both projects call the toolkit's differ, and each full run was joined row by row against its old engine over the same measurement: one project 125,950 matched and 0 differ before and after, saved report byte-identical, 3,442 gap rows renamed and all matching; the other's components 14,960/206/0 under the old engine and 14,900/206/60 under the new, its screens 11,278/886/68 and 11,274/886/72, every moved verdict an opacity of 0.5 measured 1 and no unlabelled row. The gap and opacity fixtures were run against each project's old adapter and fail there.

**Walked: 2026-10-01 for 1.45.0** — the engine moved to `tools/parity/`; no case's assertion changed, only the paths in T72–T76 and the `Runs:` lines. From the new home: test-values 3/3, test-cdp 6/6 against headless Chrome, test-measurements 4/4, test-parity-report 10/10, test-spec-keys 4/4, test-waivers 5/5. Both projects' full parity runs before and after the repointing: one's saved report byte-identical (125,950 matched, 0 differ, exit 0 both times); the other's `report.json` and `measured/` identical, its exit 1 the same pre-existing screen differences and unaccepted shadow-order baseline both times.

**Walked: 2026-10-01 for 1.44.0** — T76 added. `node tests/test-values.mjs` 3/3 (`figmaWeight`: both projects' names, spaced and unspaced, unknown is undefined); `node tests/test-cdp.mjs` 6/6 against headless Chrome, and red on two broken copies (close listener removed: the pending-call assertion fails; page exception swallowed: the evaluate-throws assertion fails). Both projects' full parity runs replayed before and after: one project's report byte-identical (125,950 matched, log differs only in timings and PIDs); the other's report and measured dumps identical, its log differing only in the advisory pixel diff. Other suites re-run green.

**Reviewed against v1.43.0 on 2026-10-01** — T72 extended for stable dates; `node tests/test-parity-report.mjs` 10/10, the four new assertions shown failing on the 1.42.1 writer. Not yet run against a project's real report.

**Reviewed against v1.42.1 on 2026-10-01** — no case changed: the change is one sentence describing the store's grade, which snapshot-standard rule 20 governs and the router's suite cases.

**Walked: 2026-09-30 for 1.42.0** — T75 added. The comparison is executed (`node tools/shared/test-code-inventory.mjs`, 4/4). The pairing instruction was run three times through the dashboard service's own routes against one real library (`projects/project-b/`, 84 public components against 88 in code): 47 asked about, 7 to 9 pairs proposed a run, every name on its list, and a dry run of filing them accepted all seven. The stage inside the page's Audit has not run against a live file yet.

**Walked: 2026-09-19 for 1.41.0** — `node tests/test-measurements.mjs` 4/4: agreement is silent, a moved property is named with both values, a layer the second pass lost is named once with what it held, and a stamp is compared whole unless skipped. Both projects' loops call it, and both re-ran green.

**Walked: 2026-09-19 for 1.40.0** — old and new value readings compared over 2,424 strings from one project's snapshot: 0 differences on colours, shadows and gradients, 156 on prose that merely contains a hex (a variable's description), where the shared parser is the stricter and the loop never passes such a string. Both projects re-run: components 14,960/15,166 and screens 11,498/12,396 on one, 0 differences; the other's full parity green.

**Walked: 2026-09-19 for 1.39.0** — the reference project's baseline runs through `scripts/baseline.mjs` unchanged (`nothing moved since the accepted run`, before and after a fresh measured run). `check-specs.cjs` over three projects' stored specs: 53, 40 and 117 specs clean, and proved red on two planted defects (a delta against a base that precedes nothing, a spec stored in full), each named with the run continuing.

**Reviewed against v1.38.0 on 2026-09-19** — §2 and §Running it now describe the toolkit's one writer; no case changed, because no rule of the loop did. Both reference projects were migrated to it and re-run: components 14,960/15,166 and screens 11,498/12,396 on one, 124,510 assertions on the other, 0 differences either side.

**Walked: 2026-09-19 for 1.37.0** — `node tests/test-waivers.mjs` 5/5. One reference project's differ and stale check call it with unchanged results (0 differ on components and screens); the other gained the stale check, which reported 533 per frame, 109 across declarations, one of those a false stale from a clip path it did not count; after the fix and the deletions its full run is 124,510 matched, 0 off, 0 stale.

**Walked: 2026-09-19 for 1.36.0** — `node tests/test-spec-keys.mjs` 4/4. Both reference projects run their gate through it: one passes 3/3 after declaring the gradient keys and `fillStyle` and dropping a dead `hidden` excuse; the other passes 47 of 47 after its seven spec-level excuses went and `maxHeight` gained a rule and a fixture.

**Walked: 2026-09-19 for 1.35.0** — `node tests/test-parity-report.mjs` 6/6. Both reference projects save through it: one's scoped run rewrote only its component's entry and left the other 116 identical; the other's full run wrote 39 match and 1 unmeasured, and its matched total equals the run's own summary (14,960, waived excluded).

**Reviewed against v1.34.0 on 2026-09-17** — T70–T71 added with the two traps
and the read-the-frame-first line. Walked on the reference project: the
collapsed pairs watched turning 52 of 56 differences into mappings, the dialog
subtree watched moving from "x 609 vs 20" to agreement once the sheet's own
layer was mapped beside the scrim, and the deleted switch commit is the
process line's own evidence.

**Reviewed against v1.33.0 on 2026-09-17** — T69 added with gate 8's slot
rule, and T13's exclusion list corrected with it. Walked on the reference
project: the dialog's five filter groups watched going from invisible to
named by the gate, the denominator moving 1756 → 2933 layers, and the three
differences the newly mapped layers held fixed rather than waived.

**Reviewed against v1.32.0 on 2026-09-15** — T67–T68 added with gates 27 and
28. Walked on the reference project: the extended gate watched naming five
inner Indicator props on the real frame with the label unmapped and going
quiet with it mapped, then naming radios and a fixture no other gate had; the
parallel runner watched hanging on tabs and completing on windows, 179s for
104,722 assertions.

**Reviewed against v1.31.0 on 2026-09-15** — T66 added with gate 21's probe
sentence. Walked on the reference project: the suite's helper made to throw
on a page exception, the pager selector broken on purpose and the step
watched failing naming the TypeError, then the real suite holding twelve of
twelve.

**Reviewed against v1.30.0 on 2026-09-15** — T64–T65 added with gates 25 and
26. Walked on the reference project: the route tier measures eight live pages
beside their stories at 95,468 assertions; the gate was watched failing with
the application down after it had passed green over the same gap; and the
runner's new diagnostics named `ERR_CONNECTION_RESET` on the first failing
variant, which is what settled a week of "did not render".

**Reviewed against v1.29.0 on 2026-09-11** — T63 added with gate 8's exclusion
clause. Walked on the reference project: the gate was written, watched failing
on 5 frames for the one layer they draw and the product does not, and watched
failing on 13 frames when a mapped layer was deleted from a map; 42 frames pass
with 808 layers counted.

**Reviewed against v1.28.0 on 2026-09-11** — T62 added with gate 24: what a
backlog may excuse. Walked on the reference project, and proved both ways —
the old free-text excuse was put back and watched failing, then the four
screens it had hidden were mapped and watched passing.

**Reviewed against v1.27.1 on 2026-09-10** — rename only: the audit skill is now `figma-components-audit`; no case changed.

**Walked: 2026-09-10 — T59–T61 added.** From a deep audit run with the loop green: three defects live on the product at that moment, none of them expressible as a difference between a measured box and a design value. Each of the six stylesheet gates in T60 was watched failing on an injected defect and passing again.

**Walked: 2026-09-09 — T56–T58 added.** Three from building twenty-seven screens and wiring them: a value a frame changes inside a component it places (found by a designer, four section tints drawn as one), a rounded frame's clip (found by a designer, a column's corners), and the class the loop cannot see at a frame-height canvas (found by a designer, a header with no height left). Each was watched failing and then passing before it was written here; the first was also watched staying quiet across every other screen, which is what stopped it being a rule that fires on everything.

**Walked: 2026-09-08 — T27–T44 added, and every one of them observed rather than imagined.** Each came from a defect in one day of building a design system's components and its first screen with this loop, and each was watched failing and then passing in that repo before it was written here:

- **T27–T31** (1.18.0): a Button reported 414 matching assertions while rendering half as tall again as its design, in the browser's default serif, with no shadow and no spinner — dependencies unbuilt, fonts unhosted, 5 of 96 variants mapped, states never driven, hug axes never asserted.
- **T32–T35** (1.19.0): a 2px waiver absorbing a 22px bug; four components measuring their "has a value" variant on an empty field; a stepper's two same-named children, one measured twice and one never; a 420-wide list measured at 724.
- **T36** (1.20.0): the foundations page, generated.
- **T37–T39** (1.21.0): the story and the app loading two different stylesheet lists — green as a story, a field three times too tall as a page; an unlayered legacy base out-specifying the components it was meant to sit under; a frame's canvas height reproduced as a page height.
- **T40–T44** (1.22.0): sixty-one translucent colours unasserted because the resolver read one spelling of a colour; a stroke colour asserted on a side the design never drew; the run measuring the previous page on a fast navigation; a receiver deleting hand-written code on a rename; and the sign-in page's own fonts and images redirected by the session guard.

- **T53–T55** (1.25.0): text cut off in a field, invisible to every assertion the loop had.

- **T48–T52** (1.24.0): the design tool's own layout direction and alignment, exempted as "not yet translated" and found by the designer's eye.

- **T45–T47** (1.23.0): reviewing that day's build against code-standard — positional selectors that moved when a band became a section, four rules written at another component's root, and a build step whose silence read as a run that measured nothing.

T1–T26 and C1–C2 were not re-walked in this session; the entries below record when each last was.

**Walked: 2026-09-10 — T59–T61 added.** From a deep audit run with the loop green: three defects live on the product at that moment, none of them expressible as a difference between a measured box and a design value. Each of the six stylesheet gates in T60 was watched failing on an injected defect and passing again.

**Walked: 2026-09-09 — T56–T58 added.** Three from building twenty-seven screens and wiring them: a value a frame changes inside a component it places (found by a designer, four section tints drawn as one), a rounded frame's clip (found by a designer, a column's corners), and the class the loop cannot see at a frame-height canvas (found by a designer, a header with no height left). Each was watched failing and then passing before it was written here; the first was also watched staying quiet across every other screen, which is what stopped it being a rule that fires on everything.

**Walked: 2026-09-08 — T25 and T26 added and walked against a second library.** Re-walked for 1.15.0: the shared snapshot plugin refused a second project's library for want of collections named after the first's, and carried a whole tier only as far as an alias reached it. T1–T24, C1–C2 unchanged.

**Walked: 2026-09-01 — pass (25/25).** Re-walked for 1.13.0: T23 added and observed on the reference project — 239 parity runs in one day, 115 of them full-suite, 109 minutes of wall clock, against four defects that a green run never showed; the baseline gained a refusal after a scoped run and the project gained `bin/states`, which reproduced all four in pictures. T1–T22, C1–C2 unchanged.

**Walked: 2026-09-06 — pass.** Re-walked for 1.14.0 on the reference project: T24 added and observed — the library snapshot reported no change to the text styles while every Text style's paragraph and list spacing had moved (the export carried neither), and the screens payload wrote ten changed Job post frames with no report at all; both closed in the same session (plugin 0.12.0, receiver screen diff, coverage's null-paint rule). T1–T23 unchanged.

**Walked: 2026-09-01 — pass (24/24).** Re-walked for 1.12.0: T22 added and observed on the reference project — a snapshot arrived holding a renamed component, six text styles whose new value reads differently in CSS than in Figma, twelve new icons and a frame that had lost its ready-for-dev mark, and each was found by the maintainer pointing at it rather than by a diff of the arrival. T1–T21, C1–C2 unchanged.

**Walked: 2026-09-01 — pass (23/23).** Re-walked for 1.11.0: T21 added and observed on the reference project — a focus ring measured present on some runs and absent on others survived six full suite runs and was settled in one `getComputedStyle` read (`outline-style: none` with `outline-width: 3px` in the same declaration); accepting the baseline after a two-screen run dropped every other screen from the accepted set and the next full run reported them as new; a frame's raster fill left the exporter nothing to export and the substitute shipped soft; and a `[hidden]` error slot still took its line until the component declared `display: none` for it. T1–T20, C1–C2 unchanged.

**Walked: 2026-08-26 — pass (22/22).** Re-walked for 1.10.0: T20 added and observed on the reference project — the component-layer gate's first sweep read 73%, named the hidden date/divider/label the maintainer had just found by eye, and reaching 100% produced the structural nulls, the ::placeholder probe read and the vacuous-tolerance finding the case asserts. T1–T19, C1–C2 unchanged.

**Walked: 2026-08-26 — pass (21/21).** Re-walked for 1.9.1: T19 added and observed on the reference project — the dropped-shadow gate proved red on the live bug before the fix and green after, the stroked-layer excuse proved by 24 false positives it removed, and the content-owned waiver flag proved by the date rollover that flapped six screens. T1–T18, C1–C2 unchanged.

**Walked: 2026-08-25 — pass (20/20).** Re-walked for 1.9.0: T18 added and observed on the reference project — the enumeration ported onto adapter → schema → differ and proven by equivalence (5,838 checks, 478 waived rows, 0 differences, reproduced identically), the measurement baseline proven in both directions (a mutated padding fired naming layer and values; a mutated feed text, height and offset stayed quiet), and the consumption gate moved from regex to declaration. T1–T17, C1–C2 re-traced against the edited sections; gates renumbered nowhere, gate 12 is additive.

**Walked: 2026-08-25 — pass (19/19).** Re-walked for 1.8.0: T17 added and observed on the reference project — the consumed-properties gate proved red by adding a key nothing reads, the silent-layer report proved red by skipping one layer's comparisons, and the credit rule proved by the aside it had been hiding. T1–T16, C1–C2 unchanged.

**Walked: 2026-08-25 — pass (18/18).** Re-walked for 1.7.2: T16 added and observed on the reference project — an icon swap and a rotated layer's box, each recorded and each unread, each caught on the first run once compared. T1–T15, C1–C2 unchanged.

**Walked: 2026-08-25 — pass (17/17).** Re-walked for 1.7.1: T15 added and observed on the reference project — the click landing on a modal's close button, and every scrolled shot clipped from the document top, both found by looking at the screenshots a run had left. T1–T14, C1–C2 unchanged; the additions are traps, not gates.

**Walked: 2026-08-25 — pass (16/16).** Re-walked for 1.7.0: T14 added and observed on the reference project — a frame marked ready for dev with no map entry, and a mapped screen whose frame was renamed away, each proved red by removing them in turn. T1–T13, C1–C2 re-traced; gate numbering unchanged, gate 9 and the §Running it addition are additive.

**Walked: 2026-08-25 — pass (15/15).** Re-walked for 1.6.0: T13 added and observed on the reference project; T1–T12, C1–C2 re-traced against the edited sections — gate numbering unchanged, §5 and §6 additions are additive.

**Walked: 2026-08-23 — pass (14/14).** Re-walked for 1.5.0: T12 added and observed on the reference project (the run reports "light + dark theme" and check counts doubled from 754 to 1508 on one component); the rest unchanged.

**Walked: 2026-08-22 — pass (13/13).** Re-walked for 1.4.0: T11 added and observed on the reference project (four findings the new reads produced in one run, one the check found unaided); the rest unchanged.

**Walked: 2026-08-21 — pass (12/12).** Re-walked for 1.3.0: T10 added and traced; the rest unchanged.

**Walked: 2026-08-21 — pass (11/11).** Re-walked for 1.2.0: T8 and T9 added; T8 observed on the reference project (a jittering fixture exits 2 by layer name; the real suite agrees on both renders), T9 observed there too (four findings, waived). T1–T7, C1–C2 unchanged.

**Walked: 2026-08-21 — pass (9/9).** Re-walked for 1.1.0: C1 and C2 added and traced to §Comparison mode; T1–T7 unchanged.

**Walked: 2026-08-21 — pass (7/7).** Traced: each assertion followed to the instruction in `SKILL.md` that mandates it, and checked against the one project that has run the loop (`projects/` has no entry for it yet; the fixture is its design-system README and `docs/figma-to-code.md`). No case observed against a second project, which is the gap this skill exists to close; T3, T5 and T6 are the ones a second run could still falsify.

Method-only skill: no engine, nothing to execute (clause G does not apply — the scripts are built per project by design, see the skill's intro).

---

## T1 · The release gate fails on being behind, never on edits since
Fixture: a library whose last publish is older than the snapshot's stamp, and whose last-modified moved afterwards on a canvas nudge.
Assert: the skill says the snapshot passes the gate and the edits are a *note*. It must not describe a gate on last-modified as acceptable. Traced to §1 and the trap "The gate on last-modified cannot be cleared"; code-standard rule 32 cited by number.

Not walked.

## T2 · Specs are default plus deltas, bound values as token names
Fixture: a button with thirty variants, one of which changes only its fill.
Assert: the skill requires the hover variant to be stored as the difference against a named base, the fill as a token name, and a round-trip test holding reader and writer together. Traced to §2 "Spec shape".

Walked live: 2026-09-19 — three projects' stored specs through `check-specs.cjs`: 53, 40 and 117 clean, and red on two planted defects (a delta against a base that precedes nothing, a spec stored in full).

## T3 · Children are compared, not only geometry
Fixture: a nav bar frame that dropped three links and added a toggle, with every mapped layer measuring the same.
Assert: the skill requires the instance list (outermost, in order, labelled unless placeholder) to be compared against the rendered component elements, and names this as the check geometry cannot do. Traced to §5 and code-standard rule 31.

Not walked.

## T4 · A value the comparison cannot name is a finding *(negative)*
Fixture: a spec with a hex fill typed in Figma where a token belongs.
Assert: the skill forbids skipping it — it must be reported, with `literals` keyed `Layer.kind` as the only way past. Traced to §6 gate 4 and code-standard rule 33.

Not walked.

## T5 · Every variant measured or waived by name
Fixture: a story that renders three of a component's eight Figma variants.
Assert: the skill's gates fail the five unmeasured ones unless each is listed under `unmeasured` with a reason; a story's coverage is what it lists, nothing more. Traced to §4 last sentence and §6 gate 3.

Not walked.

## T6 · Waivers go stale
Fixture: a waiver for a padding difference, after the code was fixed.
Assert: the skill says the check fails on a waiver that no longer matches a real difference. Traced to §6 second bullet and gate 5.

Runs: node tools/parity/test-waivers.mjs — "a waiver nothing used is stale, unless it is content or a decision"

## T7 · The skill does not ship the tools *(negative)*
Fixture: a second project asking for "the parity scripts".
Assert: the skill states that tools are built per project to this contract and names why (one project's shape would be baked in); it does not point at another skill's files or at a package. Traced to the intro and the changelog.

Not walked.

## T21 · A flapping measurement is diagnosed in the browser, and the baseline is accepted from a full run
Fixture: a modal heading focused by script whose focus ring measures present on some runs and absent on others; a maintainer who re-runs the suite to investigate; a frame that draws its illustration as a raster fill; a hidden error slot inside a component that sets `display: flex`.
Assert: the skill sends the reader to `getComputedStyle` on the live element before another suite run and names the cause class (a style whose paint is off but whose value is not — `outline: none` keeps its width), requires the accepted baseline to come from a full run and not a scoped one, requires a missing asset to be reported rather than substituted, and requires a component that renders a script-filled slot to declare `[hidden] { display: none }` itself. Traced to Traps; observed 2026-09-01.

Walked live: 2026-09-01 — the reference project, where the flapping focus ring was settled in one `getComputedStyle` read.

## T22 · A snapshot is diffed and reported before anything is built from it
Fixture: a snapshot that renames a component the code renders, sets six text styles to a value whose CSS reading differs from the design tool's, adds icons nothing uses, and drops a frame's ready-for-dev mark.
Assert: the skill requires the whole arrival to be diffed and said back to the designer as a list before code is written, and requires "the design changed" to be told apart from "the export changed" — the frames agreeing with the component spec being the tell for a stale instancing file. Traced to Read a snapshot before building from it; observed 2026-09-01.

Walked live: 2026-09-01 — the reference project, where each of the snapshot's four changes was found by the maintainer pointing at it rather than by a diff of the arrival.

## T23 · The suite is run once, and the states are looked at
Fixture: a session that edits four independent things and runs the full suite after each; a maintainer watching; four defects (a stroke the library dropped, a focus ring, a control a frame added, a value the platform accepts and the design rejects) that every run calls green.
Assert: the skill tells the reader to batch edits, verify against the one component or screen touched, and run the suite once before the commit; requires the baseline to refuse acceptance after a scoped run; and requires a command that renders every mapped state of a touched screen for a person to read, on the argument that parity answers whether the mapped things match and never whether the page is right. Traced to The loop to work in; observed 2026-09-01.

Walked live: 2026-09-01 — the reference project: 239 parity runs in one day, 109 minutes of wall clock, against four defects a green run never showed.

## C1 · Comparison mode reports unmapped things as not compared *(negative)*
Fixture: a snapshot of a component with eight variants and a mapping covering three.
Assert: the skill requires the five others, and any layer without a selector or selector matching nothing, to appear under *not compared* — neither as a pass nor as a failure — and forbids a gate in this mode. Traced to §Comparison mode, third paragraph.

Not walked.

## C2 · A typed code spec is not a measurement *(negative)*
Fixture: a request to "just describe the component's CSS values and score them against the Figma node".
Assert: the skill refuses to call that a check, says why (it measures the typist), and asks for a rendered, computed-style read or an explicit label that the result is a reading. Traced to §Comparison mode, fourth paragraph.

Not walked.

## T8 · A measurement that does not repeat is refused
Fixture: a layer whose width is randomised on load.
Assert: the skill requires two renders, and a disagreement fails by layer name with nothing from the run counted — not a retry, not a pass on the first reading. Traced to §5 "Measured twice"; observed on the reference project's runner.

Runs: node tools/parity/test-measurements.mjs — "a moved property is named with both values, not just its layer"

## T9 · Code ahead of the design is a finding
Fixture: a component whose story controls offer `tint` in six colours while the library draws one variant.
Assert: the skill's gate 4 fails each unmapped value unless waived under `codeOnly` with a reason, and says the gap is the designer's question, not a pass. Traced to §6 gate 4; observed on the reference project (four components).

Walked live: 2026-08-21 — the reference project, four components offering values the library does not draw, each waived.

## T10 · Validation sits between snapshot and build
Fixture: a snapshot that brings a new component.
Assert: the skill requires `component-validator` to run over it and the designer to choose Figma / code / accept before the component starts in code. Traced to §Running it, "Validate before building".

Not walked.

## T11 · What a frame says is measured, not only what it draws
Fixture: a footer whose menu is centred where the frame packs it to the end; a bar whose instance is `Scroll=End` while the element says `scrolling`; an empty state titled differently from the frame's `Title text`.
Assert: the skill requires each to be a measured difference — position on the undecided axis, instance prop as attribute, copy — and requires pages to be measured in the state their frame declares with scripts running. Traced to §5 "And what each frame says"; observed on the reference project.

Walked live: 2026-08-22 — the reference project; four findings the new reads produced in one run, one the check found unaided.

## T12 · The environment is pinned and every shipped state measured
Fixture: a headless run on a machine whose OS is in dark mode, against a token set with a light and a dark tier.
Assert: the skill requires the theme to be stamped on the page and asserted after the render, and both tiers to be measured; it forbids inheriting the host's setting. Traced to §5 "Both tiers, and the environment pinned"; observed on the reference project, where the unstamped check had measured the dark tier only.

Walked live: 2026-08-23 — the reference project, where the unstamped check had measured the dark tier only; check counts doubled from 754 to 1508 on one component.

## T13 · Coverage is total, credited, and gated
Fixture: a project whose screens report "0 differ" with 22% of their layers mapped, three hero renders shipping misplaced; a toggle whose box-model lives on its inner fieldset; a modal slot holding the caller's paragraph.
Assert: the skill requires gate 8 to fail on any unmeasured layer or element by name; counts a library instance as one layer of a screen; credits an element sharing a measured relative's exact box and a nested component under a measured layer's children comparison; excludes what the design never draws (vector innards, accessibility-only elements, `display: contents`) but **not** what a page places in a slot, which is the screen's own (T69). Traced to §6 gate 8; observed on the reference project (22%/56% → 100%/100%, two shipping bugs found by the first newly mapped layer).

Walked live: 2026-08-25 — the reference project, 22%/56% → 100%/100% coverage, two shipping bugs found by the first newly mapped layer.

## T14 · The design file says which frames count, and the gate runs both ways
Fixture: a screens file holding a finished frame nobody has mapped, a draft frame nobody has marked, and a map entry whose frame was renamed in Figma.
Assert: the skill takes only frames marked Ready for dev, fails on the marked-but-unmapped frame *and* on the mapped-but-missing one, and leaves the unmarked draft out of the repo entirely while naming it in the run's output. It must prefer the file's own status over a name prefix or a repo-side draft list, and must not treat a silently absent frame as a pass. Traced to §6 gate 9 and §Running it "Building a screen"; observed on the reference project, which had carried an unmapped marked frame since its first snapshot and where both directions were proven red by removing each in turn.

Walked live: 2026-08-25 — the reference project, which had carried an unmapped marked frame since its first snapshot; both directions proved red by removing each in turn.

## T15 · A state the map cannot reach must fail, and the shot must show the state
Fixture: a page whose script moves the attribute a click selector keys on from the opener to the closer; a frame measured at scroll end whose screenshot is clipped from the document top.
Assert: the skill requires a click selector that matches nothing to be fatal rather than measured as the rest state, and requires the screenshot to be taken where the state left the page. It must treat both as failures that report green, not as cosmetic. Traced to §Traps; observed on the reference project, where the filter modal measured shut for a day under waivers that read as though it were open.

Walked live: 2026-08-25 — the reference project, where the filter modal measured shut for a day under waivers that read as though it were open.

## T16 · A property recorded and never read is not measured
Fixture: a nav bar whose library icon changed from an arrow to a house, the swap recorded in the snapshot and skipped by the comparison; a 180-rotated hero layer whose `rotation` is recorded and whose visible box is derived by hand in two places, differently.
Assert: the skill requires an instance swap to be compared against what the code renders, and rejects the children check as cover for it (every icon is the same element). It requires a waiver whose reason is arithmetic about Figma's storage to be replaced by recording the thing. Traced to §Traps; observed on the reference project, where both shipped visibly wrong behind green runs.

Walked live: 2026-08-25 — the reference project, where both shipped visibly wrong behind green runs.

## T17 · Measured means compared, and credited means provable
Fixture: a snapshot carrying a property no comparison reads; a mapped layer whose selector resolves and about which nothing is asserted; two different layers sharing a name and a parent, one mapped and one credited to it.
Assert: the skill requires a gate that fails on any recorded property neither compared nor named with a reason; requires a mapped layer producing no assertion to be reported and to fail; and requires a credit to hold only when the sibling holds the same thing, by child type rather than name, with the credits printed. It must reject a coverage percentage as evidence that a layer was looked at. Traced to §6 gates 10 and 11; all three observed on the reference project, each proved red on purpose.

Walked live: 2026-08-25 — the reference project, all three proved red on purpose.

## T18 · Figma resolves once, and the baseline gates in both directions
Fixture: a first-generation comparison where translation and judging are one enumeration, being restructured; and a run whose measurements are kept as the accepted set.
Assert: the skill requires the adapter → schema → differ layering with every translation rule pinned as a fixture, and requires a port onto it to be proven by equivalence — reproduce the previous run check for check before improving anything. It requires gate 12's baseline to be trusted only after two consecutive runs measure byte-identical, with volatile fields a stated choice rather than a tolerance, and proven in both directions (a style change fires; a content change stays quiet). It requires gate 10's consumption check to be a declaration in data, naming the regex-over-source version as the trap. Traced to §5 "Figma resolves exactly once", §6 gates 10 and 12; observed on the reference project 2026-08-25.

Walked live: 2026-08-25 — the reference project: the ported enumeration reproduced check for check (5,838 checks, 478 waived rows, 0 differences) and the baseline proved in both directions.

## T19 · An absence is asserted, and a content-owned excuse survives coincidence
Fixture: a phone variant that drops the desktop's shadow while the code keeps drawing it; and a content-driven height waiver on the day the live feed happens to match the frame.
Assert: the skill requires an explicit "none" assertion where a sibling variant declares an effect and this one does not, with states and stroked layers excused; and it allows a waiver to declare its difference content-owned, exempt from staleness with its reason kept. Traced to the two 1.9.1 traps; observed on the reference project 2026-08-26.

Walked live: 2026-08-26 — the reference project: the dropped-shadow gate red on the live bug and green after, the stroked-layer excuse proved by 24 false positives it removed, the content-owned flag by a date rollover that flapped six screens.

## T20 · Every layer a variant draws is mapped, and the first sweep teaches
Fixture: a component whose Viewed variant draws a date, a divider and a styled label that no story mapping mentions, on a project whose screens are layer-gated and whose components are not.
Assert: the skill requires the component-side mirror of gate 8 with its credit rules (Rest-sibling overrides, auto focus ring, nested instances to their own stories), and frames the first sweep as method — structural wrappers become explicit nulls, unreadable text homes extend the probe, and a comparator tolerance that lets a newly-asserted layer pass vacuously is named, never comforted with a waiver. Traced to gate 13; observed 2026-08-26.

Walked live: 2026-08-26 — the reference project, where the first sweep read 73% and named the hidden date, divider and label a maintainer had just found by eye.

## T24 · The designer had to say what changed
Fixture: a designer takes both snapshots after renaming a token group, changing the paragraph and list spacing on every Text style, and restructuring one screen's body; the receiver grades the library BREAKING and writes the screens; the developer reads the run's tail and asks what changed.
Assert: the skill has the text style export carry paragraph and list spacing beside line height and letter spacing, as tokens the stylesheet applies, so the second change is visible in the token diff.
Assert: it has the receiver diff every screen frame against the file it replaces and print the report first — layers added or removed, properties moved, content counted — so the third change is read from the run, not from the designer.
Assert: it names the null-address trap: a wrapper mapped to null while it paints (a page gradient on Main) is a miss, not structure, unless a `.layer` waiver says why.

Walked live: 2026-09-06 — the reference project, where the library snapshot reported no change while every Text style's paragraph and list spacing had moved, and ten changed screen frames were written with no report.


## T25 · A shared tool that names one project's collections has picked a project — WALKED 2026-09-08

Walk: pointing the loop at a second library for the first time —
against the reference project it was written on.

Assert the hard stop. The plugin looked up four collections by name
(`Primitives - Global`, `Semantic`, `Layout`, `Responsive type`) and threw
naming whichever was absent. That library has no responsive-type collection and by
a recorded ruling never will: line height and letter spacing stay raw on its
text styles, so the collection would hold nothing. **The second project could
not take a snapshot at all**, and the error named collections — which reads as
"your library is wrong" rather than "this tool was written against one file".

Assert the quiet half, which is worse. A collection matching none of the named
lookups was carried only as far as an alias reached into it. That library's
`Primitives - Colour` — 163 variables, its largest collection, published
deliberately because hiding it would leave the repo nothing to consume —
arrived as first-hop names inside `semantic.alias` and as no tier at all. A
two-tier token file cannot be generated from aliases. **The reference project
never saw this**, because its own rule is semantic-only consumption with the
primitives hidden, so the omission matched its intent exactly. A tool's blind
spot that coincides with the first project's policy is invisible until the
second project arrives.

Assert the contract, now in part 3: the snapshot carries **every collection,
under the file's own name, with its own modes**, and the project's generator
decides what to do with them. A project's tier model, mode names and collection
count are its own decisions.

Assert the migration shape, because it is the reusable part: the generic map
was **added** and the four named keys **kept**, empty rather than missing when
their collection is absent. The first project's receiver did not change, so the
fix carried no risk to the working project — and the second could start the
same day.

Assert the cross-skill echo: this is `figma-components-audit`'s A57 in a different
tool, three days apart. There, a shared scanner carried one library's semantic
collection name and produced 157 confident false findings. Same root, two
symptoms — a hard refusal here, silent wrong findings there. **When a tool
becomes shared, the audit to run is "what in here is one project's answer?"**

Walked live: 2026-09-08 — a second project's library, which could not take a snapshot at all, and whose largest collection arrived only as first-hop alias names.


## T26 · Generating tokens for a second project, first time — WALKED 2026-09-08

Walk: the second project's first real token generation, 374 variables across
four collections into six stylesheets.

Assert the two defects, both invisible until real data went through and both
producing a *plausible* file rather than an error:

- **Mode order.** The generator wrote Figma's first mode to `:root` and the
  rest under `[data-theme=<mode>]`. This library authors Light first; the repo's
  standing rule is dark on `:root` with `[data-theme="light"]` overriding. Every
  colour was inverted and the file read perfectly. Which mode is the base is a
  project decision, so it is configured, and an unconfigured multi-mode
  collection takes Figma's first and prints that it assumed. The follow-on bug
  is worth naming too: after fixing which mode is the base, the *override* loop
  still took "all modes but the first" and wrote `[data-theme="dark"]` beneath a
  `:root` that already held dark.
- **Weight names.** `fontName.style` is `SemiBold`; `font-weight: SemiBold` is
  invalid CSS and silently falls back to normal — every heading rendering at 400
  reads as a design that never landed, not as a bug.

Assert the shape both share: **neither throws.** A generator's failures are
mostly well-formed wrong files, so its checks belong on what it produced, and
its unmapped cases are reported rather than passed through.

Assert the two gates the same day added, recorded as traps: carry the plugin's
`unrecorded` through a receiver that builds its own `_meta` (it is gate 10's
input), and round-trip every spec **on disk** rather than only the fixtures —
46 components and 541 variants round-tripped identically, which the nine
fixtures could not have told us.

Walked live: 2026-09-08 — the second project's first token generation, 374 variables across four collections into six stylesheets.

## T27 · A component is built after the components it holds

Give the agent a Button spec whose `Icon=True` variant carries an `Icon`
instance and whose `State=Loading` variant carries a `Spinner`, and a Text
input spec carrying `_Label` and `Feedback message` instances. Assert it reads
`instanceOf` and builds the four dependencies first, rather than taking the
icon as an arbitrary caller-supplied node, drawing no spinner, and restating
the label's and the message's type ramps inline. The tell that the shortcut
happened: the field's own value renders in a body ramp where the spec says
`Label/md-medium`, and nothing fails.

An icon set counts. Generated from the exported SVGs into one component with
the design's `Size` axis, painting in `currentColor` so the consumer binds the
colour per instance the way Figma does. A hand-drawn glyph is the same defect
one layer down.

Walked live: 2026-09-08 — one day's component build, where 5 of 96 variants were mapped, the dependencies unbuilt and no spinner drawn.

## T28 · The font the design names is in the repo

Point the loop at a library whose text styles name a family the machine does
not have installed. Assert a check fails naming the missing face — not a run
that reports agreement while every text run measures in the fallback. The real
case was subtler than a missing font: `Inter Display` was installed and `Inter`
was not, so headings were right and every label was wrong by half a pixel per
run, and a `font: inherit` control rendered in Times.

Walked live: 2026-09-08 — the same build, with `Inter Display` installed and `Inter` not: headings right and every label wrong by half a pixel per run.

## T29 · Coverage is declared by axis, not by list

Give the agent a 96-variant Button and a mapping listing five variants. Assert
it reports the ninety-one as unmeasured and moves the mapping to axis-value
declarations, so a variant added in Figma tomorrow fails the gate rather than
passing unnoticed. Assert the reverse too: a declared variant the design no
longer draws is a stale mapping.

Walked live: 2026-09-08 — a 96-variant Button whose mapping listed five, the other ninety-one passing unnoticed.

## T30 · States are forced, on the element that takes them

Assert Hover, Focus and Press are measured by forcing the pseudo-class through
the debugging protocol, and that the mapping says which element takes each —
focus on the control, hover on the box the pointer is over. The failing shape:
a Text input forcing hover on its `<input>` measures every Hover variant at its
resting colour, and the run is green.

Walked live: 2026-09-08 — a Text input forcing hover on its `<input>`, measuring every Hover variant at its resting colour in green.

## T31 · Hug axes are asserted, within a pixel

Assert the adapter emits a size assertion on hug axes as well as fixed ones,
with a stated ≤1px tolerance on hug only, and that a FIXED-width root is
rendered at that width so its FILL children measure against the design's frame.
Prove both directions: "Label" at Inter Medium 14 is 37 in Figma and 36.28 in
Chrome and must pass; a 44-high design rendering 68 because nothing set
`box-sizing` must fail by name.

Walked live: 2026-09-08 — both directions: "Label" at 37 in Figma and 36.28 in Chrome, and a 44-high design rendering 68.

## T32 · A waiver names the size of the difference it excuses

Give the agent a component with a two-pixel difference it cannot fix (an
inside stroke whose layout behaviour the snapshot does not record) and a
waiver for it. Assert the waiver carries a bound — `within: 2` — and that a
later, larger difference on the same property fails naming both values. The
real case: a `$root.height` waiver for two pixels of stroke absorbed a
twenty-two pixel bug (a hidden label the code still rendered) and the run
stayed green while the picture was visibly wrong.

Runs: node tools/parity/test-waivers.mjs — "a bounded waiver excuses its size and fails past it, saying by how much"

## T33 · The args the run asked for are the args the story got

Assert the run reads back the args the story runner applied and fails naming
any that did not arrive. Two shapes, both silent: an arg the story has not
the story has not declared, and a declared arg whose inferred type the runner
cannot match — which a union-typed prop always is. Four components measured
their `Value=True` variant on an empty field, in green, because nothing they
assert about an empty field differs from a full one.

Walked live: 2026-09-08 — four components measuring their `Value=True` variant on an empty field, in green.

## T34 · Two siblings may share a name

Give the agent a stepper drawing `Icon button` twice. Assert the layer index
suffixes the repeat (`#2`) and that the mapping addresses both — not a path
index keyed on the name alone, which keeps the last and leaves the first
measured by nothing.

Walked live: 2026-09-08 — a stepper drawing `Icon button` twice, one measured twice and one never.

## T35 · A FILL root renders at the width the file recorded

Assert a component whose Figma root is FILL is rendered at the width the file
gives it, exactly as a FIXED one is: the width is the parent's decision but the
recorded number is what every FILL child inside was measured against. Only a
hugging root takes the story canvas. Without this a 420-wide list measured 724
and reported four differences that were nothing but the canvas.

Walked live: 2026-09-08 — a 420-wide list measured at 724, reporting four differences that were nothing but the canvas.

## T36 · The foundations are documented, and generated

Assert the project's documentation tool carries a colour, type, scale and
effect reference read from the snapshot rather than typed by hand — so a token
renamed in Figma appears there on the next snapshot with nobody editing
anything. Assert colours are grouped by their name path (a hundred and sixty
loose swatches become thirty ramps), that every mode is shown rather than
whichever the theme toolbar is on, and that each row carries the Figma name and
the generated custom property. If the tool has its own blocks for this, use
them — and note they may need a docs page's context rather than a bare story
canvas, which is a blank error rather than a bad layout.

Walked live: 2026-09-08 — the foundations page, generated from the snapshot rather than typed.

## T37 · The story and the page load the same stylesheet

Assert one entry point — the token layers, the faces, the base — imported by
both the story runner's preview and the application's root layout. Two lists
drift, and neither side can see it: the reference project's Storybook had all
three while the app had none of them and a CSS framework underneath, so a
login screen measured green as a story and shipped with a text field three
times its designed height. When a page and its story disagree, suspect the
stylesheet set before you suspect the component.

Walked live: 2026-09-08 — a login screen measured green as a story and shipped with a text field three times its designed height.

## T38 · A legacy base goes in a cascade layer

Rebuilding an app screen by screen leaves old element styles beside new
components for months. Assert they are in `@layer legacy` with the design
system unlayered, so components win on the layer and not on specificity — an
element selector is not automatically weaker than a class, and
`input:not([type=…])` five times over is (0,5,1). Assert too that no escape
hatch is used instead: `all: revert-layer` on `button.<component-class>` reverts to the
user-agent style and strips every property the component set.

Walked live: 2026-09-08 — an unlayered legacy base out-specifying the components it was meant to sit under.

## T39 · A screen is measured at the viewport its frame was drawn in

Assert the run sets real device metrics to the frame's size and that nothing in
the stylesheet names that size. A frame's height is the window the designer
chose to represent, not a value the page should carry: reproducing it makes a
login page scroll on a laptop, and asserting it compares the viewport against
itself. The page asks for the viewport; the run supplies the frame's.

Walked live: 2026-09-08 — a frame's canvas height reproduced as a page height.

## T40 · A resolver that cannot read a value must not report agreement

Give the agent a library whose colours arrive in two spellings — an opaque hex
and a translucent functional notation — and a resolver that understands only
the first. Assert the unreadable ones are reported by token name and property,
not skipped. The real case: sixty-one translucent colours in one library were
never asserted, and nothing said so, because the resolver returned nothing and
the adapter drops an assertion with no expected value. Assert the same for a
fill that arrives as an object where every other fill is a string.

Assert too that the coarseness a browser stores a value at (alpha in 1/255
steps) is the comparator's business and never the resolver's: rounding it away
makes every translucent token compare equal to the wrong thing.

Walked live: 2026-09-08 — sixty-one translucent colours in one library never asserted, with nothing saying so.

## T41 · A property is asserted where the design draws it

Give the agent a node with a stroke on one edge. Assert colour and width are
emitted per side that has one, not the colour on a fixed side — an unset
`border-color` is `currentColor`, so a report comparing it shows the text
colour and reads as plausible.

Walked live: 2026-09-08 — a stroke colour asserted on a side the design never drew.

## T42 · The run measures this page, and waits for it to settle

Assert the run checks the document's own address as well as its content before
measuring: a navigation command returns before the new document commits, so a
"has it rendered" probe answers for the page still on screen. Assert it waits
for fonts ready, images decoded and two animation frames before the first pass
— a component failed the twice-measured rule on nothing but its own
illustration not having decoded — and that a disagreement names the property
and both values rather than only that there was one.

Walked live: 2026-09-08 — the run measuring the previous page on a fast navigation, and a component failing the twice-measured rule on an undecoded illustration.

## T43 · The receiver never deletes what it did not write

Give the agent a snapshot in which a component has been renamed and a folder
exists that never had a spec. Assert it removes only folders containing nothing
but the generated spec, and reports the rest for a person. A rename is not a
removal: the failing version deleted a documentation folder, a hand-built
component with no spec, and a whole built component whose Figma name had a typo
fixed.

Walked live: 2026-09-08 — a receiver deleting hand-written code on a rename: a documentation folder, a hand-built component with no spec, and a built component whose Figma name had a typo fixed.

## T44 · A screen renders before it measures — assets included

Assert the application's session guard excludes the public asset directories by
name. The failing shape is invisible as a permissions problem and obvious as a
styling one: fonts and images 307 to the sign-in page for anyone not signed in,
so the sign-in screen — the one page that needs them and the one page nobody is
signed in on — renders in a fallback face with broken images. Assert the
exception names directories rather than "any path with a dot", which would let
a route with a dot past the session check.

Walked live: 2026-09-08 — the sign-in page's own fonts and images redirected by the session guard.

## T45 · A mapping addresses a layer by name, not by position

Give the agent a screen whose bands are a mix of element types — one plain
band and three that carry a heading and are therefore sections. Assert the
mapping addresses each by a data attribute rather than `:nth-of-type` or
`:nth-child`. The failing shape is silent and looks like a design change:
turning one band into a section shifts every positional selector after it onto
its neighbour, and the run reports differences in layers that did not move.

Walked live: 2026-09-08 — that day's build reviewed against code-standard: positional selectors that moved when a band became a section.

## T46 · A page turns a knob; it does not write a rule at a component's root

Assert a component publishes a custom property for the one thing a page needs
to change — a field's width, a nested component's dimming — with the design's
value as the default, and that no page or parent component carries a selector
ending at another component's root. A rule at the root moves a measured
property out from under the measurement: the component's own story still says
320 and the page says 100%, and only the story is checked.

Walked live: 2026-09-08 — the same review: four rules written at another component's root.

## T47 · The build in front of the comparison says why it failed

Assert the run prints the build's output when it fails and stops. A build
behind `--quiet` and a redirect reports a syntax error in a mapping as a run
that measured nothing, which is indistinguishable from a component with no
assertions — it cost three runs before the output was restored and the file and
column were named at once.

Walked live: 2026-09-08 — the same review: a build step whose silence read as a run that measured nothing, at a cost of three runs.

## T48 · An excuse comes from a closed list of reasons

Assert that the table declaring which recorded properties are compared accepts,
for a property that is not compared, only a reason from a fixed set — identity,
measured elsewhere, carried by another rule, not drawn, unobservable — and that
free text is refused. The phrase people write is "not yet translated"; it reads
as a plan and works as a permanent exemption, and it survived a fortnight and a
deep code review in the one table whose job is to stop something going
unchecked.

Runs: node tools/parity/test-spec-keys.mjs — "both, dormant without a rule, nothing, an open reason, no specifics, and elsewhere naming nothing real all fail; a real file passes"

## T49 · A declared rule must change something

Assert the check removes each recorded property from every layer that carries
it and re-runs the adapter, failing on any rule whose assertions never move.
Assert it tries every carrier rather than the first: a gap is genuinely inert on
a distributed row, a stroke flag on a layer with no stroke, and a one-sample
version accuses two working rules. Assert a rule that is deliberately dormant —
conditional on something the library does not do yet — is declared as such and
owes a fixture that fires it.

Walked live: 2026-09-08 — every carrier tried, after a one-sample version accused two working rules.

## T50 · Direction and alignment are translated, both axes

Assert the adapter translates the layout direction and both axis alignments, not
only the distributed case. A header drawn as a column whose counter axis is
centred, built as a row centred on its main axis, renders identically at the
canvas width and puts the band against the left edge on a wider screen; every
length agreed.

Walked live: 2026-09-08 — a header drawn as a centred column and built as a centred row: identical at the canvas width, against the left edge on a wider screen, every length agreeing.

## T51 · An alignment is a choice about free space

Assert alignment is asserted only where the spec's own numbers leave space to
align in — the frame, less its padding, less what its children and gaps take —
and per child on the counter axis. Assert direction is not asserted below two
in-flow children, that an absolutely positioned layer is not in the flow, that a
clip is asserted only where a child leaves the box, and that text hugging its
own width is not asked about its alignment. Translating all of it without these
rules produces thousands of differences on a library that renders correctly, and
waiving them would bury the four that are real.

Walked live: 2026-09-08 — translating direction and alignment without these rules produced thousands of differences on a library that renders correctly.

## T52 · Ask which way the children run, not what flex-direction is

Assert the measurement computes stacking from `display` together with the
direction: a block container stacks its children down the page exactly as a flex
column does and answers `flex-direction: row` when asked directly, so asking
directly reads every ordinary stack as a defect. Assert the probe's own source
is parsed in the unit tests — a stray backtick in one of its comments reported
828 assertions as not matching, which reads exactly like the code being wrong.

Walked live: 2026-09-08 — a stray backtick in one of the probe's comments reported 828 assertions as not matching.

## T53 · Every mapped layer is asked whether it cuts its text

Assert the measurement carries a clipping probe, independent of any assertion:
an element that clips whose content box is shorter than its font's own line
box, or whose box leaves its nearest clipping ancestor. Assert the finding goes
through the waiver route and fails the check. Nothing in a computed style says
"clipped" and no design value does either, so a loop built only from assertions
is blind to the defect a designer sees first.

Walked live: 2026-09-08 — text cut off in a field, invisible to every assertion the loop had.

## T54 · A design line height below the font's own cannot be honoured in a control

Assert the ruling: a 100%% line height is a layout box in the design tool, which
paints the glyphs outside it, and a clipping box in a browser. Assert the code
takes the font's line box and returns the difference as margin so the
surrounding frame keeps its drawn height, and that the layer's own height and
line height are waived with the reason and the question put to the designer.

Walked live: 2026-09-08 — a 100% design line height inside a control, clipped by the browser's box.

## T55 · The probe must not move the page, and the page must stop moving

Assert the font's natural line box is read from canvas metrics rather than a
probe element appended to the document. Assert the settle step waits for the DOM
to be quiet, not only for fonts and images. Both failures appear as the
double-measure gate firing on hundreds of variants, with one of the two printed
values a null — as does a machine still running stale headless browsers from
earlier runs.

Walked live: 2026-09-08 — the double-measure gate firing on hundreds of variants with one of the two printed values a null.

## T56 · A value the frame changes inside a component it places

Assert the loop compares every instance's own visual fields against the
component this repo builds, resolved from `instanceOf`, and fails when a
difference is on a layer no mapping names. Assert the comparison reads a
RESOLVED library spec: where a variant is stored as a delta, reading the delta
flat reports every unstated field as an override. Assert an instance the repo
has no spec for is skipped rather than guessed.

Walked live: 2026-09-09 — twenty-seven screens built and wired: four section tints drawn as one, found by a designer.

## T57 · A rounded clipping frame

Assert the clip is asserted when the frame is rounded and a child with a fill of
its own reaches its edge with a smaller radius — and not otherwise. Assert each
of the three conditions alone: a padded frame, an inset child, and a content
frame as round as its parent all stay silent.

Walked live: 2026-09-09 — the same build: a column's corners, found by a designer.

## T58 · What a frame-height canvas cannot show

Assert the loop's own documentation names the class: a canvas as tall as the
frame gives every flex child the height it asks for, so nothing shrinks and a
header squeezed to nothing on a real window measures green.

Walked live: 2026-09-09 — the same build: a header with no height left on a real window, found by a designer.

## T59 · What a page at rest cannot show

Assert the project keeps a suite that DRIVES the product — opens the thing,
presses the control, reads what happened — run beside the parity check rather
than inside it. Assert it covers every interaction the design implies, and that
a frame drawing a state reached by a press stays the parity check's business.

Walked live: 2026-09-10 — a deep audit run with the loop green, three defects live on the product at that moment.

## T60 · The stylesheet rules a measurement cannot express

Assert unit tests over stylesheet SOURCE for: every sheet inside a cascade
layer; no page rule at a component's own selector; no `!important` outside a
reduced-motion block; no style whose "off" leaves a value behind; every literal
a token or a stated reason; no selector naming another component. Assert each
was proved by breaking it — a gate never seen red is a gate with no evidence.

Walked live: 2026-09-10 — each of the six stylesheet gates watched failing on an injected defect and passing again.

## T61 · Green is not done

Assert the project's definition of done names the look: a real window size, the
controls pressed, by a person. Assert the skill says why — that a green run is
precisely what makes that step feel unnecessary.

Walked live: 2026-09-10 — the same deep audit run, none of whose three defects was expressible as a difference between a measured box and a design value.

## T62 · What the backlog may excuse

Assert a SCREEN can be excused only by naming a capability the runner genuinely
lacks, from a closed list the project keeps — and that a free sentence is
refused. Assert a reason mentioning where the code lives fails with the fix in
the message: the screen is moved to where the run reads mappings from, not
written down. Assert the gate was proved by putting the old excuse back and
watching it go red.

The case behind it: four Ready-for-dev frames excused as "the card lives in a
route and the run reads src/screens" went unmeasured for a day, the card was
rebuilt from memory of an older frame, and the designer found the wrong gaps,
structure and graphic by eye — twice — with every gate green.

Walked live: 2026-09-11 — the reference project, proved both ways: the old free-text excuse put back and watched failing, then the four screens it had hidden mapped and watched passing.

## T63 · A layer the frame draws and no mapping names

Assert the coverage gate runs in the direction the loop does not: the frame's
own layers against the mapping, not the mapping against the frame. Assert the
denominator stops at a library instance and counts the instance itself, so a
screen is asked for its own work and not for a Button's insides. Assert a layer
the mapping neither names nor excuses fails the check BY NAME, and that the
excuse lives beside the mapping with its reason — a state the product
deliberately does not draw, a question open with the designer — never as
silence and never as a percentage. Assert a stale excuse fails too: a layer the
frame has stopped drawing whose exclusion survives is an excuse nobody can
check. Assert the gate was proved red on purpose before being trusted.

The case behind it: a project whose every frame was mapped, whose gate had just
gone green at 79,660 assertions, was carrying 89 layers no mapping named. Three
were live defects — a field 320px wide in a 456px column, a second button
measured on no frame at all, and an onboarding card drawing both of its steps
at once, which the maintainer had already found by eye on the deployed site.

Walked live: 2026-09-11 — the reference project: the gate watched failing on 5 frames for a layer the product does not draw and on 13 when a mapped layer was deleted; 42 frames pass with 808 layers counted.

## T64 · The route beside the story

Assert a screen's mapping can name the route its frame is the page of, and
that the run measures the live page — signed in with a session the repo mints,
at the frame's viewport — against the same spec, layers and waivers as the
story. Assert a gate that cannot reach the application starts it itself or
fails, and never prints a green verdict with the route half skipped. Assert the
story is still measured for the states a route cannot reach without a press.

The case behind it: 95,452 green assertions over a pool page that read
"Contacts (148)" where the frame says "121 contacts", because the story passed
the design's words and the route built its own from a translation key; then a
gate that printed "routes are NOT measured" above "green" because the dev
server happened to be down.

Walked live: 2026-09-15 — the reference project: the route tier measuring eight live pages beside their stories at 95,468 assertions, and the gate watched failing with the application down after it had passed green over the same gap.

## T65 · The gate's own server and readiness probe

Assert the static server behind the run holds under every variant reloading
the whole preview with the cache off. Assert a variant that did not render is
reported with what the browser said since the navigation — failed requests,
exceptions, console errors — and the page's own state, never as a bare "did
not render". Assert the readiness probe compares the story's id, globals and
args one by one and waits for the story tool's own rendered signal, and that
the query is never compared as a string. Assert the fix was proved by the
failing components going to zero misses before the full run.

The case behind it: a scripting language's stock file server reset
connections under the load; five to twenty-seven "did not render" a run on
different variants each time, and one button measured in the browser's default
serif with no padding — a stylesheet that never arrived — all read as
flakiness for a week because nothing listened to the browser.

Walked live: 2026-09-15 — the reference project, where the runner's new diagnostics named `ERR_CONNECTION_RESET` on the first failing variant.

## T66 · The driven suite's probe is held to the mapping's bar

Assert that in the suite which drives the product (gate 21) an exception
thrown in the page fails the path by name, and is never returned as an
undefined the step then reads as "nothing happened". Assert a step's
selectors are proved to match before the press is trusted, the same way a
mapped layer matching nothing is fatal. Assert the fix was proved by breaking
a selector on purpose and watching the step fail naming the throw.

The case behind it: a redraw moved a carousel's pager into a section header;
the driven step clicked `.pop()` of an empty list, the TypeError was
swallowed by the evaluate helper, and the step reported "showing 1" — a
press that never happened, read as a page that did not respond.

Walked live: 2026-09-15 — the reference project: the pager selector broken on purpose and the step watched failing naming the TypeError, then the real suite holding twelve of twelve.

## T67 · A prop changed inside a placed instance

Assert the override gate walks the instances inside a placed one beside the
library's own and names a prop that differs on the inner layer, and that a
text prop or a glyph swap is not a finding. Assert naming the inner layer or
a reason — including a `*` glob — answers it. Assert the gate was proved on a
real frame both ways before being trusted.

The case behind it: five filter groups shipped with "Optional" under every
label; the frame had turned each label's Indicator off one level in, and the
gate read only the group's own fields.

Walked live: 2026-09-15 — the reference project: the extended gate naming five inner Indicator props on the real frame with the label unmapped, and going quiet with it mapped.

## T68 · Windows, not tabs; the build reused

Assert each worker measures in a window of its own, not a tab — a headless
browser backgrounds tabs and never runs requestAnimationFrame there. Assert
the cache stays on with a fresh profile per run, the build is reused while
its inputs are unchanged, and a page's own focus is blurred before measuring
unless the variant is the focus state. Assert the run says how long each
stage took.

The case behind it: four workers on tabs sat a quarter of an hour saying "no
reply in 90s"; on windows the same run took three minutes.

Walked live: 2026-09-15 — the reference project: the parallel runner hanging on tabs and completing on windows, 179s for 104,722 assertions.

## T69 · A slot's contents are mapped, not skipped with the instance
Fixture: a screen placing five filter groups into a dialog component's slot, the dialog mapped as one layer, the component's own check rendering that slot empty; a second list in a second slot holding blocks of the same shape.
Assert: the skill requires the walk to descend into what the page placed in a slot and to fail naming those layers until they are mapped, while still counting the component's own chrome with the instance that holds it and letting a mapped block stand for its cousin in a second slot. A gate reporting 100% with a slot's contents unmapped is the failure this case exists for. Traced to §6 gate 8; observed on the reference project, where a group the frame drew went unbuilt past two green runs until a designer pointed at it, and where the corrected walk moved the denominator 1756 → 2933 layers and surfaced three real differences (a sheet 144px too tall, a dialog subtree judged from the scrim's corner, a variant axis written in only one of its two values).

Walked live: 2026-09-17 — the reference project, where the dialog's five filter groups went from invisible to named by the gate and the denominator moved 1756 → 2933 layers.

## T70 · A collapsed pair is mapped, not waived
Fixture: a card whose design draws an outer frame padding nothing around a Content frame padding 20, and a group whose frame gaps 12 between a label and a list the DOM holds in one fieldset; the browser has one element for each pair.
Assert: the skill requires the wrapper to be mapped `null` — permitted because it paints nothing — and the inner frame to be mapped to the element, rather than waiving the `pad` or `gap` the collapse produces. A waiver there is a disagreement recorded where a translation happened, and it hides which of the two layers the element answers for. Traced to §Traps; observed on the reference project, where this turned 52 of 56 newly-surfaced differences into mappings and left four that were real defects.

Walked live: 2026-09-17 — the reference project, where the collapsed pairs turned 52 of 56 differences into mappings and left four that were real defects.

## T71 · A dialog is mapped at the sheet, never at the scrim
Fixture: a modal whose design layer is a full-frame scrim with the sheet inside it, against code whose element is the sheet, placed in the browser's top layer and centred there; only the scrim is mapped.
Assert: the skill requires the dialog's own layer to be mapped to the same element beside the scrim, and explains the symptom of not doing it — every descendant judged from the scrim's corner, so the subtree reads as displaced by half the viewport while nothing is wrong with it. Traced to §Traps; observed on the reference project, where four `x` differences read "609 vs 20" until the sheet's layer was mapped, and where the pre-existing scrim waiver had been describing the same cause for weeks.

Walked live: 2026-09-17 — the reference project, where the dialog subtree moved from "x 609 vs 20" to agreement once the sheet's own layer was mapped beside the scrim.

## T72 · The verdict is saved through the shared writer
Assert: the skill tells every project to save its per-component verdict with `tools/parity/parity-report.mjs` at `paths.parity`, merged per component, counting waived checks as neither matched nor failed. Executable half: `node tools/parity/test-parity-report.mjs` — status from counts, diffs capped, reason only when unmeasured, last-match date kept through a drift, a scoped run leaving other entries alone, an unchanged verdict keeping its stored dates, and a run that changes no verdict leaving the file unwritten.

Runs: node tools/parity/test-parity-report.mjs — "status from the counts: match, drift, unmeasured", "a run that changes no verdict leaves the file untouched", "an unchanged verdict keeps its stored dates while another changes"

## T73 · Gate 10 is the toolkit's script
Assert: a project's spec-key gate calls `tools/parity/spec-keys.mjs` over every component variant and screen tree, with its own declaration in the closed-reason format. Executable half: `node tools/parity/test-spec-keys.mjs` — nested values counted and opaque maps not, an undeclared key named, an unused rule not stale while an unused excuse is, and six malformed declarations each caught.

Runs: node tools/parity/test-spec-keys.mjs — "a recorded key nobody declared fails, by name"

## T74 · Waivers follow the skill's one policy
Assert: a project's differ judges a waiver with `tools/parity/waivers.mjs` (`excuses`, `stale`), staleness is computed across every target that declares the same waiver, and every code path that consults a waiver counts it as used. Executable half: `node tools/parity/test-waivers.mjs` — string and object forms, an open waiver, a bounded one passing and failing with its size, a same-element claim, staleness exempting content and decision waivers, and `staleAcross` judging one waiver across every target that declares it (same key and value).

Runs: node tools/parity/test-waivers.mjs — "a waiver nothing used is stale, unless it is content or a decision"

## T75 · A resemblance is a row to confirm, never a pair
Fixture: a library whose Figma has "Text area input" (recorded as the framework's `TextField`), "Date picker" and "Scroll bar", and whose code has `TextField`, `TextArea`, `DateDropdown` and `BulkActionBar`.
Assert: the comparison ticks "Text area input" in code through its recorded framework name and leaves `TextArea` a code-only row; it pairs nothing by resemblance. The Code parity stage asks about what has no code of its own name, files `TextArea` for "Text area input" and `DateDropdown` for "Date picker" as `design-code-parity` rows keyed `pair|<code name>`, proposes nothing for "Scroll bar", and drops any answer naming a component on neither list.

Observed: 2026-09-30 — through the service's `/parity` and `/claude` routes on one real library, three runs: `TextArea` for "Text area input" every run, `DateDropdown` for "Date picker" in one of three, no pair for "Scroll bar" in any.
Runs: node tools/shared/test-code-inventory.mjs — "a page is in code under its own name or the name the project says it is built as"

## T76 · The browser is driven through the toolkit's DevTools driver
Fixture: a project's parity run, screenshotter or interaction gate that needs a headless browser page.
Assert: it imports `launch`, `attach`, `pageTarget`, `newPage` or `pool` from `tools/shared/cdp.mjs`, depends on no browser automation library, and keeps no copy of its own. Executable half: `node tools/shared/test-cdp.mjs` against headless Chrome — attach to a settled page target, evaluate with promises awaited, an exception the page throws rejects `evaluate`, `newPage` opens an attachable window, and `close` rejects a call still waiting (and every call after it) instead of leaving it pending, because a browser that went away once left a run hanging with no verdict; `launch` reads its port from its own profile, gives up at its timeout, and takes the browser and profile with it on `close` or on exit; `navigate` waits for `DOMContentLoaded`, `load` or `networkIdle` on its own loader; `viewport`, `media`, `screenshot`, `call` and `waitFor` do what they say; `pool` reuses only a released, live window, and that window renders (autofocus runs, which a background tab never does); `paintReady` waits for the images in the clip, not below it, and gives up at its cap. Without Chrome it prints `skip:` and exits 77, which bin/check shows as "skip" and which is not a walk.

Runs: node tools/shared/test-cdp.mjs — "close rejects a call still waiting, and the session says it is dead"

## T77 · One differ; a tolerance per kind, from the project
Fixture: a project whose box geometry rounds by a pixel, so its `parity.tolerances` allows `length: 1`.
Assert: the project's run judges through `tools/parity/diff.mjs` and keeps no differ or schema of its own; one assertion is one row keyed `Layer.prop`; the tolerance comes from the project's config per kind and is exact where unnamed, so 44 against 45 passes as a length while an opacity of 0.4 against 1 and a font size of 13 against 14 fail; a layer the variant does not draw is agreement when the code draws none and a `-present` difference when it does; a kind or prop outside the schema is refused. A gap is asserted on the layout's axis, `column-gap` in a row.

Runs: node tools/parity/test-schema.mjs — "an opacity of 0.4 against 1 differs even where lengths are within a pixel"; node tools/parity/test-diff.mjs — "a layer this variant does not draw: agreement when the code draws none, a difference when it does"

## T78 · A mapping names a layer by its exact path
Fixture: a variant holding `Content > Label` and `Content > Inner > Label`, and two layers named `Aside` side by side; a project mapping that says `Label`.
Assert: the project resolves mapped paths with `tools/parity/layers.mjs` and keeps no search of its own; `Content > Label` and `Content > Inner > Label` name exactly those layers, `Label` and `Inner > Label` name nothing (absent, and the stale-mapping gate says so), `$root` is the variant, the second `Aside` is `Aside#2`, and a node's `pathOf` resolves back to it. A layer at a different path in two variants is mapped per variant; a screen frame holding one page instance roots its paths there (`root`).

Runs: node tools/parity/test-layers.mjs — "a path that skips a level names nothing — the search that found the shallowest Label rebinds when a designer wraps one"

## T79 · One probe; pages put on screen by the toolkit's hosts
Fixture: a project's parity run that reads rendered elements, in its own Storybook, its running app, or its site's component fragments.
Assert: it reads through `tools/parity/probe.mjs` (`measure`, twice, naming what moved) and opens pages through `tools/parity/hosts.mjs` with its facts from `parity.host`/`parity.app` in `snapshot.config.json`, and keeps no probe or page plumbing of its own. Executable half against real Chrome: `test-probe.mjs` — `width`/`height` are the border box, a gap nobody set is `0px`, `-stacking`, `-clipped`, the ring read from an outline or a spread-only shadow and not from an outline with no style, a pseudo-element read on its element, a missed selector `null`, a scope keeping sections apart, core positions document-relative, held instances named by the project's element, and `forceState` holding hover on the element and its ancestors (inside `within` only) and focus as `:focus-visible` that an ancestor's `:has()` sees, all targets in one call; `test-hosts.mjs` — a fragment fetched with its controls, the composed page served at the site's origin with its stylesheet and tier, a story opened as THIS page in its tier with its args and refused when an arg was dropped, the tier missing or the story never drawn, and an app route resolved from the running app, its tier emulated and a refused session named.

Runs: node tools/parity/test-probe.mjs — "hover is held on the element and its ancestors, so a rule keyed on an ancestor fires"; node tools/parity/test-hosts.mjs — "an arg the story dropped is refused by name"

## T80 · One adapter translates Figma; a project supplies its facts
Fixture: a project's parity run with a variant holding a one-sided OUTSIDE hairline, a four-sided INSIDE stroke with `strokesInLayout` off, a 2px stroke recorded in `strokeSides`, a hugging button with a label mapped onto the button's own element, a gradient at 135° on a wide box recorded with its transform, a fill bound to a token the snapshot does not hold, and a sibling variant that draws an effect this one does not.
Assert: the project translates through `tools/parity/adapt.mjs` (`adapt`, `plan`, `carriers`) and keeps no adapter, token resolver or document shim of its own; its consumed gate holds its corpus to the adapter's `SPEC_KEYS` and `unreadRules`. The hairline is expected as `0px 1px 0px 0px` (an outer shadow), the INSIDE stroke as an inner ring (`-inner-ring-width`, `-inner-ring-color`: an inset spread or an inward outline), the stroke width as 2px from the weight; the label is asked no width or height of its own; the gradient's expected CSS angle is derived from its transform and the box, so a transform perpendicular on a 1728×660 box is `110.9deg` and not `135deg`; the unresolvable token is an `unresolved` row that fails the run unless a waiver names it; the dropped effect is `box-shadow: none`, excused in a forced pseudo-state. What the project opts into comes from `parity` in `snapshot.config.json` (`position`, `props`, `canvas`), never a project name in the engine. A changed verdict after a switch is labelled with the rule and fixture that changed it, or the switch is not done.

Runs: node tools/parity/test-adapt.mjs — "an OUTSIDE edge is an outer shadow, a four-sided one a ring, CENTER a ring half in"; node tools/parity/test-adapt.mjs — "a layer on its ancestor's element has that ancestor's box"

## T81 · A new red is the project's only after the engine is proved right about it
Fixture: the first full runs after a switch to the one adapter, red on both projects; among the reds, hug widths off by a pixel per text run, a 135° gradient on a non-square box drawn at a literal `135deg`, an avatar's ring drawn as an outline pulled in by 1px, a centred column drawn with `margin-inline: auto`, a three-track grid, a wrapped tag row, an empty picture slot, and a filled label set from the left in a hugging span.
Assert: each red group is checked against the spec's value, Figma's semantics, the CSS that would render it and what the probe read, and labelled REAL, ENGINE or MAPPING/STORY before anything is fixed. ENGINE errors are fixed in `tools/parity` with a fixture a copy with the old behaviour fails: the hug slack is derived (a pixel per whole-pixel text box in series on the axis), not counted on every run; the gradient's direction comes from its transform and the box, a diagonal without one is `unresolved`, and the derivation is checked against a real render, not fitted to a stylesheet; a four-sided INSIDE ring is read as drawn and apart from a focus ring; direction and alignment are read off the children's boxes on the design's axis; wrap is asserted only where the children overrun; a box that paints nothing is not present; a filled, left-set text box is asked no width. MAPPING and STORY errors are fixed in the project's own files — a story renders Figma's sample text (`sample`), never a wider tolerance. REAL defects stay red and are reported by pattern with the one CSS change that closes each. No check is loosened to pass, and a gate dropped along the way is restored before the step is done.

Runs: node tools/parity/test-adapt.mjs — "a gradient's direction is its transform's on the box, as two real renders show"; node tools/parity/test-adapt.mjs — "a FIXED axis is exact, and a hugging one is within a pixel per text box in series on that axis"; node tools/parity/test-probe.mjs — "which way children run, and where they sit, are read off their boxes"; node tools/parity/test-probe.mjs — "a box that paints nothing is not rendered; a control with no value draws no words"; node tools/parity/test-spec-keys.mjs — "an excuse is stale only when no registered project records its key; a missing repo is named"

## T82 · One run and one set of gates; a project's bin/parity execs them
Fixture: two projects, one with a Storybook it builds, a Next app it starts and axis mappings in `parity.mjs` files, the other with a PHP site's component fragments, list mappings printed by a command, a screens file with `base` chains, and screens that followed a live feed; each with its own runner and its own gate tests under different names.
Assert: each `bin/parity` execs `tools/parity/run.mjs --repo` and keeps no runner, page harness or gate of its own (`owned.json` lists the deleted files, and `check.mjs` fails a third copy); everything that differs is a fact in `snapshot.config.json` `parity` — mappings, host and app (`build`, `start`, `session`), tiers, window and breakpoints, the state and disabled axes and the focus ring's layer name, the baseline's dir and volatile fields. The static gates (`gates.mjs --repo`) and the run's own (stale mappings, stale waivers across declarers, copy where the page was written to match the frame, DOM coverage, the baseline) run for both projects. A screen excused for want of scrolling is refused, because the run scrolls — to px, to the end, or to where the frame draws a layer, in the panel that scrolls. A slot's contents are the screen's own layers and a component's caller's. A focus variant's ring layer is mapped by convention to the element that takes the state. A screen that follows a live feed is served over content pinned at one commit. Old and new rows reconcile per project with every changed verdict labelled and no matched row broken; the baseline is turned on only after two runs measured byte-identical.

Runs: node tools/parity/test-project.mjs — "a listed resting variant brings its state siblings, on the element the mapping names, with its own layers and waivers"; node tools/parity/test-gates.mjs — "a screen excused by a capability the runner has is refused, a folder with no spec needs a reason, and a missing icon is named"; node tools/parity/test-gates.mjs — "a slot holds the screen's own layers, a component's own parts are its instance's, and repeated cards stand behind one"; node tools/parity/test-probe.mjs — "an animation that never ends is held at its start, so its box reads the same twice"

## T83 · A waiver has an owner and a bound; the slack is capped and read
Fixture: a project with a waiver on a width whose reason says "3.5px narrower" and no `within`; a string waiver; a waiver with `fix: true` and one with `accepted: true`; a waiver keyed by a short path no frame draws; a screen's `Main.-present` on a layer its frame draws; a base entry's `false` that drops nothing; a row of thirty hugging labels; a hug off by 2 within a slack of 4; a project with no `position`, `props` or `children`, and a registered project whose repo is not on the machine.
Assert: the `waivers` gate fails, at load and by key, every waiver without an owner (`fix: 'figma' | 'code'`, or `content`, or `decision`), every number without `within`, every field nothing reads, the short path, the drawn `-present` (it is `excluded`) and the `false`; a keyword measured for a number is excused only by a decision; the thirty labels' slack is `SLACK_CAP`; the hug off by 2 is a waived row carrying its slack, not a match; the missing repo and the three opt-outs are notes, never findings. A migration bounds each waiver by the difference it excused in the last run, not a round number.

Runs: node tools/parity/test-gates.mjs — "the waivers gate names an open number with no owner, a short path that names nothing, a -present the frame draws, a field nothing reads and a false that drops nothing; a mapped -present passes"; node tools/parity/test-diff.mjs — "a hug the text slack excuses by a pixel or more is reported waived, with the slack it used; under a pixel it matches"; node tools/parity/test-adapt.mjs — "the hug slack is capped, however many text boxes run in series"; node tools/parity/test-gates.mjs — "a registered project not on this machine is a note, and stale excuses wait for it"

## T84 · A bound is its own target's, and a ruling says what it rules
Fixture: a screens file whose base declares `Main.padding-bottom { decision, within: 320 }`, measuring 76 on the base and 320 on one phone screen; a waiver with `within: Infinity`; one with `decision` and `content`; a bare `decision` on `Main.min-height` where the page reads `0px`; `decision: 'unset'` against a page that sets 600px; a radius waiver `within: 2` on 999px drawn as 8px on 80×44; `rotate` 180 measured `none`; an `unmeasured` excuse carrying `accepted: true`; an `overrides` reason no frame needs; a project with `host.kind: 'app'`; `bin/parity contact` where only `contact--…` keys exist; a badge whose words are each person's own age on the running app.
Assert: the run fails `within 320` on the base, "exceeds what it excused by 244", and passes once the base says 76 and the phone screen declares its own 320; `--accept` records each waiver's largest difference per target, and a later run with the same bound and a moved difference is red at gate 12. Infinity, two owners and the bare decision on a number are refused at load, the last naming `decision: 'unset'` and that a decision excuses a keyword only; `unset` excuses `0px` and `normal` and refuses 600px. The radius waiver fails (14 apart at a corner) and the turn is 180 apart. The `accepted` field and the stale override are findings; the app host loads once every mapping names a route; `contact` scopes to every `contact--…` state. The live badge takes one bound over every card, the farthest any label the product can say lands from any width the frames draw, so it holds whatever age each person's badge says that day. The run's summary is one row per assertion per render, the running app beside a story on its own line, and a walk says which count it reports.

Runs: node tools/parity/test-waivers.mjs — "a bound is a finite number: Infinity and NaN bound nothing", "one owner a waiver: a decision is not also live data, nor a fix someone will make", "load says plainly that a decision on a number excuses a keyword only, and names the two forms that hold", "decision 'unset' excuses exactly 0 or a keyword, and refuses a bound or a prop that is not a number", "a radius and a turn are numbers: a waiver on one says how far it excuses, and is held to the distance it is given", "a bound is held per target to the largest difference it excused there, give or take a unit of rounding"; node tools/parity/test-schema.mjs — "a radius is a number whose distance is its largest per-corner difference as drawn, and a turn the shorter way round"; node tools/parity/test-diff.mjs — "a waiver on a radius is held to the largest corner difference, and a waived number carries the distance it excused"; node tools/parity/test-gates.mjs — "an overrides reason no target declaring it needs is stale; one a sharer needs is not"; node tools/parity/test-project.mjs — "an unmeasured excuse is a reason, or { reason, fix }; a field nothing reads is refused", "a word scopes a run to the target it names, or else to its family; a word naming neither is unknown", "a project whose every page is a route may name the app host, and then owes the app's facts and a route on every mapping"; node tools/parity/test-baseline.mjs — "a suite with nothing accepted is red without hiding a move in the others, and a waiver's excused difference is held like a measurement"; node tools/parity/test-adapt.mjs — "an OUTSIDE ring beside an effect style is one of box-shadow's layers, as an INSIDE ring is; a CENTER one stays an outline", "a wrapping frame's line spacing is the cross-axis gap where the snapshot records one, and nothing where it does not", "the library instances a layer holds, outermost and in order, are its children".

## T85 · A slot is a type, and what the browser snaps is compared as snapped
Fixture: a screen whose Top navigation places two Navigation buttons in a SLOT named "Main menu slot", beside a FRAME named "Content slot"; a 0.5px and a 1.5px border; a 40px text centred by `line-height: 40px` and one at the top of a 40px box; a swap whose glyph the design draws and the page leaves out; a row of hugging icons with no recorded insides; a wrapping row whose children fit on one line with `crossGap 24`; an app waiver `decision: 'unset'` on a bare glob; a `content` bound and an `'unset'` ruling nothing uses; a `*` key under `waivers`; a newsletter frame drawing 15 feed rows where the site shows 50.
Assert: the two buttons are the screen's own layers and are missed until mapped, while the FRAME's contents are walked as ordinary layers; the borders read 1px and match; the first text is `filled` and matches CENTER, the second `flex-start`; the dropped glyph is a difference and a hidden one is not judged; the icon row has no slack; no `row-gap` is asked; the bare `unset` is refused at load and a colour, a shadow or `nowrap` is never excused by it; the unused bound and ruling are stale (live data is not); the `*` key is refused outside `appWaivers`; the newsletter is measured over the frame's 15 rows (`rows=15` on its route) and the bound left is what the rows' days explain, not the 5,974 of the whole feed.
Assert also (1.52.1): a variant the plugin derived from a boolean records its slot as a FRAME, and the set's `props` naming it `SLOT` still makes it a slot for gate 13; a ring drawn as a shadow is not snapped — `1.5px` against a `1px` spread differs, and only an outline's `0.5px` against `1px` matches; `decision: 'unset'` on `none` for a shadow or `nowrap` for a wrap excuses nothing.

Runs: node tools/parity/test-gates.mjs — "a slot is a SLOT whatever it is called, and a frame called "Content slot" is not one", "a glob outside appWaivers is refused; inside them it is read"; node tools/parity/test-schema.mjs — "a fractional border width is compared as Chrome snaps it; a whole width stays exact; a path stroke is never snapped", "a ring's width is compared as snapped only where it is drawn as an outline", "a text whose lines fill its box matches any vertical alignment; one placed at the top does not match center"; node tools/parity/test-probe.mjs — "a text leaf is placed by its own lines: filling its box, at the top, centred"; node tools/parity/test-adapt.mjs — "a swap the design draws and the page leaves out is a difference; one the design hides is not judged", "an instance whose insides were not recorded is a text box only if a text prop gives it words", "a wrapping frame's line spacing is the cross-axis gap where the snapshot records one, and nothing where it does not"; node tools/parity/test-waivers.mjs — "decision 'unset' names its prop, excuses only a number, and only 0 or none/normal/auto", "an unused bound or unset ruling is stale whoever owns it, except against live data", "an app waiver with a * covers every layer and layer.prop it matches, under the key it was declared as", "the excused difference per target is the largest, of declared waivers only; an app waiver and an unmeasured row add nothing"; node tools/parity/test-baseline.mjs — "a suite with nothing accepted is red even when nothing moved in the others".

## T86 · A ruling is triaged when it is accepted, and a ruling two projects share is the toolkit's
Fixture: a project declaring three rulings — a focus-ring offset waived `fix: 'figma'`, a line-height ruled `'unset'`, and one it declared before the last accepted run — beside another registered project that waives the same offset with a reason in the same words.
Assert: `--accept` lists the two new rulings with their owners and not the old one; the offset is named a toolkit candidate with the other project's key, the line-height is not; the index written is the sorted set of target and key; the first accepted run records the index and lists nothing.
Assert also: the skill says the decision — project fact or toolkit lesson — is made in the change that writes the ruling, and that a stylesheet comment explaining a deviation is the same signal (§D 8).
Assert also (1.53.1): a stylesheet comment that says what the design draws is a ruling, keyed by file and its words (1.56.1: not its line, so an insertion lists nothing new and a rewording lists the comment), under the folders `parity.stylesheets` names, a vendored tree unread; one ruling shared by several targets is one lesson naming them all; generic words alone (count, holds, sample) make no candidate.
Assert also (1.54.0): an accept that finds lessons is refused, with exit 2 and before a browser opens, unless `--triaged` names a non-blank place; with it, the accept proceeds and prints where they went; with no lessons, nothing is asked.
Runs: node tools/parity/test-lessons.mjs — "a ruling new since the last accepted run is listed, with its owner; one recorded before is not", "one ruling shared by two targets is one lesson, naming both", "a ruling another project makes on the same property in the same words is a toolkit candidate; generic words alone are not", "the index is the sorted set of target and key", "a comment that says what the design draws is a ruling, by file and line; a vendored tree is not read", "an accept with lessons waits for where they went: a toolkit file that exists, or a reasoned none; a blank, a vague place or a missing file is refused"

## T87 · The run is fast by default, and says where its time went — *executed*
Fixture: the two projects' full runs on one build and one data set, before and after the settle change, with four and with eight windows; a page holding a lazy picture 6,000 px below the fold and one holding an eager picture that answers after 1.5 s; an accepted run's time and a run a quarter slower.
Assert: every run prints `time:` with each phase and the slowest targets and writes `timing.json` beside the measurements; `--accept` keeps the accepted run's time; a full run more than 25 % slower than the accepted one on the same scope warns, naming the phase that grew, and never fails; the settle does not wait on a lazy picture out of reach and does wait on an eager one; the story build's key is a content hash (a touched file reuses, a changed byte rebuilds); verdict counts are identical and no measured value changed before and after, or each difference is explained (a row join was not made: the comparator changed with `ringKind`).
Assert also: an accept keeps the faster of the time it held and its own, saying so, since one made beside another check would make its load the bar.
Assert the negative: the old settle waited 5 s on the lazy page; `slower` says nothing at a fifth slower or on another scope.
Runs: node tools/parity/test-hosts.mjs — "a lazy picture out of reach is not waited on"; node tools/parity/test-timing.mjs; node tools/parity/test-session.mjs

## T88 · The page gates reach an app's routes, and name what they find
Fixture: a project whose pages are an app behind a sign-in (`parity.app` with a session command), no `parity.pages`, and screen targets with routes.
Assert: `pages.mjs structure` and `overflow` open each distinct screen route through the run's signed-in session, at the first tier; a project with neither `parity.pages.base` nor app routes is refused, never passed; an unnamed `nav`, `aside` or `section` is reported with its first class.
Assert also: a project with `parity.pages.base` is served exactly as before.
Runs: node tools/parity/pages.mjs --repo <app project> structure; the same with overflow; and on a served project, the same two unchanged — *executed* 2026-10-03.

## T89 · A check's window is the check's, and the structure gate reads behaviour too
Fixture: a pool given a time zone and a locale; pages served in a scheme the machine is not in; a form whose live swap drops focus beside one that restores it; a floating `details` menu with no Escape beside one with both; a checkbox whose label carries a count.
Assert: every new window renders in the pool's time zone and locale; a served page renders in the scheme the gate gives it, and a page that does not is a failure; the structure gate names the dropped focus, the menu that stays open, and the count in the name, and stays quiet on the restoring form, the closing menu, an in-flow disclosure and an `aria-hidden` count; a count is a number alone in its own element, a "(354)" ending the words, or a trailing number in an aria-label, and a label written "Top 10" is words, not a count; it prints how many swaps it examined.
Runs: node tools/shared/test-cdp.mjs; node tools/parity/test-pages.mjs — *executed* 2026-10-03.

## T90 · A library built elsewhere is compared through the code audit, and a wrong mapping is caught before its findings — *executed*
Fixture: a project whose context document names its code repo and its `code.parity`, with mappings giving a story and selectors per component.
Assert: props are joined by rule against the component's API read from its types (a text prop never joins a flag); a design prop the API lacks is the finding `not-in-code`; a mapping whose element mostly never matches is reported suspect and its differences are not counted; colours that draw the same over what is behind them are the verdict `looks-same`, not differences.
Runs: node tools/parity/test-external.mjs — "props join by rule…", "a mapping is suspect when…", "a colour written differently that draws the same…", "an OKLab colour…"

## T91 · Which element a contract element lands on is found by rule, and the mapping holds only rulings — *executed*
Fixture: a component library's Storybook, a contract per component, and mappings naming stories and, for a few layers, a ruling.
Assert: with no element named, each contract element is paired with the rendered element showing the most of its own values; a box's paint and spacing may land apart; a box prefers the element holding its children's; an element whose values all differ is placed by structure only where one thing can be it, else left unpaired; a pairing showing fewer than half its values is dropped; a map element overrides the rule, and `skip` leaves it uncompared.
Runs: node tools/parity/test-pair.mjs (9 cases); on one project, `external.mjs --auto-pair` against its hand map: 21 of 22 the same element.

## T92 · The Parity pages say every verdict one way, Figma the reference — *executed*
Fixture: a project with a code audit report and its docs site built.
Assert: a difference reads as what the code does (Code differs, Code renames it, Code looks the same, Matches Figma); a thing one side has alone reads Only in Figma or Only in code; no page uses Not in code, Missing in code, Same on screen, Named differently, Code has more, Code lacks it or Code adds it.
Runs: node tools/docs-site/test-parity-pages.mjs — "no Parity page uses a retired verdict word".

## T93 · One mapping format: a compared library's mappings read into the contract's ids, and a name the design lacks is refused — *executed*
Fixture: a compared mapping in Figma's names (an option's arg, a forced state, a skipped option, a ruled layer by stored path), its component's bridge; the same with a renamed prop, an option the design lacks, a layer that is no element and one that is two.
Assert: it reads into exactly the entry the audit works in (contract prop ids, contract values, contract element ids); each wrong name is refused with what it named, never dropped; an axis whose options set different args is refused. Replayed on one real library: every one of its 49 mappings read back identical to the map it replaced, after its stale names (Figma renames the old map ignored) were corrected.
Runs: node tools/parity/test-external.mjs — "a mapping in Figma's names reads…", "a prop, an option or a layer…", "a layer that is several elements…", "an axis whose options…"; node tools/component-contract/test-contract.mjs — the bridge cases.

## T94 · A compared library is loaded from its context document and built by the engine's one session — *executed*
Fixture: a project home whose context document gives a library `code.parity` (a Storybook built in a workspace folder, one tier, mappings in the home); a mapping for a component the snapshot does not hold.
Assert: `loadParity` reads it as compared, with its code repo, its one tier, its mappings and its build into the home; a compared library needs no frame or theme global and refuses two tiers; the orphan mapping is said, never measured; the session builds in `build.dir`, installs when the lockfile moved, and opens a story with no tier stamp as it renders.
Runs: node tools/parity/test-project.mjs — "a library compared needs no frame…", "a library compared is read from its context document…", "a mapping for a component the snapshot does not hold…"; one real library's full audit replayed through the session against its last run.

## T95 · The contract from code reads any project the engine reads, on its own host — *executed*
Fixture: a governed mapping (an expanded target: variants with args, a forced state on another element, a sample copy, layers by stored path) and its bridge; the same with a ruling on a layer, a layer that is two elements and one the design lacks; a host that declares no props, with and without `controls`.
Assert: a Figma combination draws the variant the mapping expands for it; a prop's code prop is the arg that moves when it alone moves, an unset arg included; each state is forced where its option says, else where `state` says; each layer is its contract element; a ruling or an ambiguous layer is refused; `controls` stand in for a host's props, said as declared, and none is refused. A prop whose variants move two args is joined to the first and the second is said, never dropped.
Runs: node tools/component-contract/test-from-code.mjs — "a Figma combination draws the variant…", "a Figma prop's code prop…", "a prop whose variants move two args…", "each pointer state…", "each mapped layer…", "a ruling, or a layer…", "a host that declares no props…"; from-code on a governed Storybook's Chip and a governed site's Filter chip.

## T96 · No framework is known to the code: its facts are a profile the library names — *executed*
Fixture: the house's profile of one framework (root class, part class, types, wrappers, union wrapper, its own words for a prop's job, its own props no design draws), merged over the house's code props (T97); its fixtures' type definitions; two avatars drawn alike.
Assert: the type reader, the prop joiner, the prop comparison and the pairing read every framework fact from the profile; with no profile, two components drawn alike are not taken for one and nothing is joined by a framework's words; a zero padding is no padding whatever its token is called; a report names the framework by its profile's name, and the Parity pages take that name from the report.
Runs: node tools/parity/test-external.mjs (the house profile read from audit-settings); node tools/parity/test-pair.mjs — "an element matching none of its values…", "…and with no framework root class known…", "what an element defines…"; node tools/toolkit-check/test-check-standards.mjs — "a framework's profile is a section the merge reads…".

## T97 · What every library's code is given, and what only its framework adds — *executed*
Fixture: audit-defaults `codeProps` (the platform's props, the shared words for a prop's job, props no design draws) and one framework's profile over it; a library on no framework; a compared option that sets no arg; a governed variant that leaves an arg unset.
Assert: a library on no framework still leaves a handler and a class out of its API; the framework's profile adds its words after the house's and never restates them; an option that sets no arg sends nothing, so the story draws its own default and never the design's word, and the property check reads it as the code's default; an option that leaves its arg unset is joined as unset.
Runs: node tools/parity/test-external.mjs — "a library on no framework still knows a handler…", "an option that sets no arg leaves the arg unset…", "…and the property check reads that option as the code's own default…", "…and where the code states no default…"; node tools/component-contract/test-from-code.mjs — "an option that leaves its arg unset is joined as unset…"; node tools/parity/test-hosts.mjs — "a declared default is read as its value…", "only a dropped arg is tagged a refusal…"; node tools/parity/test-session.mjs — "a build folder with its own lockfile…", "…leaves out its .git…"; node tools/component-contract/test-from-code.mjs — "a percentage radius is of the box…"; node tools/toolkit-check/check-standards.mjs (codeProps keys registered).

## T98 · A value the page holds by rule is stated, not measured from the frame — *executed*
Fixture: a frame drawing Main 2461 tall where the page's Main is the 1117 window, waived `{ decision: true, is: 1117 }`; the same frame redrawn 2468 tall after a text style grows.
Assert: both frames pass with the page at 1117, held as near as the project's `tolerances.length` (exact by default: 1117.4 fails, and passes under 0.5) and the accepted record says 0 for both; the page at 1200 or `auto` fails, saying what it holds; `is` beside `within` or `'unset'`, on a colour, an opacity, a radius or a turn, on a bare layer or as a string is refused at load; an `is` nothing used is stale.
Runs: node tools/parity/test-waivers.mjs — "is excuses exactly the value the page holds…", "is is a number on a numeric prop, alone…", "is states a length…", "an is row records how far the page is from its ruled value…", "a ruled value no difference uses is stale, as a bound is".

## T99 · The screen map is proposed by the engine, and only what the map lacks is written — *executed*
Fixture: a frame placed off the canvas origin with a header holding a title, a main holding a card instance and a vector, and a footer; its map holding the header; a page drawing the header, an empty box beside the title's words, the card as the element its component renders as, and no footer; the same frame drawn as one unpublished page component; a screens map with a `false`, a based entry with no map of its own, a based entry on `layers`, a mixed chain, a `layers` entry another inherits from; an id `:r1:`, a label with a quote, a return and a form feed, an ancestor with no box; a frame named for the instance it wraps; a variant instance of an unpublished set; library ids holding a `useId` shape and a Vue stamp; a CRLF file with no final newline; a map not written yet, one not JSON, one behind a link, one in a folder it cannot write; a fixture project the command line runs `--write` over.
Assert: only the layers the coverage gate counts and nothing maps are proposed for (no primitive, nothing inside an instance), under the page component where the frame is one; an element the map names is never proposed again; the title lands on its words, the card on its element, the footer is said as unmatched; a scrolled page is read in the window; `--write` adds only what the entry lacks as the run reads it, a `false` kept, and refuses a based entry read through `layers`, a mixed chain and a `layers` entry with heirs with the rename, never a copy, writing nothing and exiting 2; a wrapper named for its instance does not take that instance's element; a per-render id anywhere in an id and a Vue stamp are no hook; a variant's set is read as the store reads it; the file keeps its line ends and final newline, is replaced whole, and a map that is code or none is said with the key to use; a missing map is created, a link's file written with its mode, a failed write one line with nothing left; selectors quote what CSS cannot read bare and climb through a boxless ancestor; an entry's route kept, the file's indent kept; a bad command line or no Chrome is one line and exit 2.
Runs: node tools/parity/test-propose.mjs — "the layers proposed for are…", "a new frame whose one child…", "an element the map already names…", "each unmapped layer is paired…", "the layer the page does not build…", "a scrolled page…", "--write merges only…", "a based entry…", "…and a based entry the run reads through `layers`…", "…and so is a mixed chain…", "an id or a label…", "a selector climbs…", "a wrapper named for the instance…", "an id a framework generates…", "--write on a based entry…", "--write on an entry of its own…", "…a variant instance is read by its set…", "a Vue scoped-style stamp…", "…its line ends…", "--write over a map that is code…", "--write where the project names no screens map…", "--write with a map not written yet…", "--write through a link…", "…and a map that cannot be replaced…", "--repo with no value…", "no Chrome…".
