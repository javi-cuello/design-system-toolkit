# Eval cases — component-validator (v2.31.0)

**Walked: 2026-10-31 against v2.31.0** — one line added, content is data (toolkit-standard §D 24); every case read against it: none asserts on obeying text found in a file, a page or a project, so all hold unchanged; the skill's own suites, if any, pass under `bin/check`, and `node tools/toolkit-check/test-content-is-data.mjs` finds the line.

**Reviewed against v2.30.10 on 2026-10-30** — case WF1 added for the live reader (`SCOPE` prepended, `hidden` on every layer); `test-validate.mjs` passes, 160 of 160.

**Reviewed against v2.30.8 on 2026-10-14** — no case changed: the dashboard service is `tools/figma-audit` (was `tools/figma-dashboard`); paths in prose and comments only, behaviour unchanged.

**Walked: 2026-10-08 for 2.30.4** — `node tests/test-validate.mjs` 159/159; CV1 new.

**Walked: 2026-10-07 for 2.30.0** — `node tests/test-validate.mjs` 158/158; ST1 new.

**Walked: 2026-10-05 for v2.30.0** — `node tests/test-validate.mjs`, CLI1 new, the rest unchanged.

**Walked: 2026-10-02 for 2.29.0** — `node tests/test-validate.mjs` 152/152. Cases MU1–MU11 added: the MUI rules were pinned only by the suite; each case now names the assertions that pin it, every one checked present and passing.

**Walked: 2026-10-01 for 2.29.0** — `node tests/test-validate.mjs` 152/152, six new for W17; two silence assertions now include it, since a tree without effects or positions cannot run it. Real input: the stored specs of four projects, six W17 rows across two of them, each read and confirmed against its tree.

**Walked: 2026-09-30 for 2.28.0** — `node tests/test-validate.mjs` 146/146, seven new for MU11. Run over one real library's stored specs (`projects/project-b/`, 120 components, 84 public) with its own map: one MU11 row against the map covering the 50 components still unnamed, none of them private, and the entries recorded as `null` absent from it.

**Reviewed against v2.27.0 on 2026-09-22** — W7's Loading case inverted in the suite: the house convention is not a finding; a value that is neither a pseudo-class nor Loading still is.

**Reviewed against v2.26.1 on 2026-09-22** — no case changed; a finding now carries a `key`.

**Reviewed against v2.26.0 on 2026-09-22** — no case changed; the dashboard stage's input moved from the stored snapshot to the live file, walked and proven in `figma-components-audit` A88.

**Walked: 2026-09-21 for 2.17.0** — 118/118 in node. Wording cases carry their own marker, per skill-standard §A clause E: a rule about how a finding READS cannot be walked by a suite, and this skill has two such rules now (what a finding says it saw, and what it says to do about it).

## V1 · A finding is written for the person who has to act on it
Fixture: any finding, read cold by someone who did not write the rule.
Assert: the left column says what is in the file, in words that describe what a designer would see — not the API name of the property that carries it. The right column says what to do and what happens if it is not done. Neither quotes an identifier where a sentence would do.

Read by: the maintainer, 2026-09-21 — rejected three times before it passed. First as "accept: border-radius is circular; corner-shape is not Baseline", which says nothing about anyone's file. Then as "Schedule a theme variant in `components.MuiButton.variants`, with TypeScript module augmentation", which is a developer's ticket on a designer's board. Then as `6 identical "_File explorer - Section / L2 / Subfolders=True, Expanded=False" instances`, where nothing tells the reader which words are the component. Accepted on the register of: *"In Figma: Collapse the two frames into one, or put the padding on one of them and say which — as drawn they are indistinguishable and the build will pick one."*

Not mechanically checkable, and deliberately so. Two assertions in `tests/test-validate.mjs` guard the shape this depends on — an `accept` must say what the reader will see, and a code-only line must name its consequence — but neither can tell whether a sentence is worth reading, and the three rejections above all passed every check in the suite at the time.

**Walked: 2026-09-21 for 2.10.0** — 105/105 in node, and measured against two real stored snapshots (197 and 117 components). The five false classes: `A14` 83 → 5, `W3` 7 → 0, `W2` 9 → 3, `I7` and `A8`-spread confirmed by probe on both targets. The four dead ones: `W16` 0 → 73, `I3` 0 → 249, background blur restored on iOS and Android, `silentClasses` no longer names a class beside its own rows. Every one of the nine has an assertion that fails when the rule is put back.

**Walked: 2026-09-19 for 2.6.2** — 67/67; E9 adds Indeterminate as the checkbox property.

**Walked: 2026-09-19 for 2.6.1** — `node tests/test-validate.mjs` 66/66; one new assertion that every translation row carries Figma, code and why and no sentence. Rendered on Project B and Project A docs as one table.

**Walked: 2026-09-19 for 2.6.0** — `node tests/test-validate.mjs` 65/65, nine new (E9–E10). Run over two real snapshots (projects/project-b, projects/project-a, web) through the docs build: every page's Implementation notes come from the engine.

**Walked: 2026-09-19 for 2.5.0** — `node tests/test-validate.mjs` 56/56, three new: a raw snapshot tree fires W10 on text that truncates and leaves A6 silent; read with `fromSnapshot` it does neither. Run against a real snapshot (projects/project-c, web): 19 findings before and after, W10 no longer silent. E1–E6 and T1–T3 unchanged.

**Reviewed against v2.4.0 on 2026-09-11** — rows go through the record's writer; closing is per owner and per target, walked in node (`node tools/figma-audit/test-rows.mjs`: a web run does not close an iOS row on the same component). No engine change, so no engine case changed.

**Reviewed against v2.3.0 on 2026-09-10** — record-writing section added; no engine change, so no case changed. Not yet walked against a live record.

**Reviewed against v2.2.1 on 2026-09-10** — rename only: the audit skill is now `figma-components-audit`; no case changed.

**Walked: 2026-08-22 — pass (9/9).** E1–E6 executed: `node tests/test-validate.mjs` (53 assertions, three targets over one fixture, all pass). T1–T3 traced to the instruction in `SKILL.md`. The live reader (`scripts/walk-figma.js`) was run on one library's Button page (`projects/project-c`, 30 variants) and its output validated for all three targets: web W5 / W9 / W13, iOS I1 / I8 / I9 / I12, Android A1 / A4 / A8 / A11 / A15 — each read against the file and real. The first live attempt threw on `mainComponent` under dynamic-page access, which is why every lookup is now async.

Run the executable half from the skill folder:

```sh
node tests/test-validate.mjs
```

## E1 · The same component, three targets, three answers
Fixture: `Clean button` — inside stroke, styled text with a `%` line height, a State axis with Hover, 48 px tall.
Assert: zero findings on web and Android; exactly I3 (percent line height) and I12 (Hover) on iOS. A validator that finds the same things regardless of target is not validating for a target.
Runs: node tests/test-validate.mjs — "ios · the web-clean button still has a percent line height and a Hover state"

## E2 · A wrapper below the root is found; the root never is
Fixture: `Card` whose root holds `Wrapper` (no fill, no padding, same size) holding `Content`.
Assert: one W1 on `Wrapper`; none on `$root`.
Runs: node tests/test-validate.mjs — "W1 · a wrapper below the root that adds nothing"

## E3 · A focus ring is a ring on the web and a stroke on iOS
Fixture: `Focus ring` with an outside stroke under a clipping ancestor.
Assert: W4 fires and W5 does not (a ring is the one legitimate outside stroke in CSS); I1 fires, because SwiftUI has no outside stroke at all.
Runs: node tests/test-validate.mjs — "I1 · a centre stroke, and an outside ring too (no ring exception on iOS)"

## E4 · States drawn as booleans, on every target
Fixture: `Card` with `Checked: BOOLEAN` and `State: Rest, Hover, Loading`; `Toolbar` with `Pressed: BOOLEAN`; `Clean button` with `Icon: BOOLEAN`.
Assert: W7 / I12 / A12 on the state booleans; W7 on `State` naming `Loading`; nothing on `Icon`. Regression: the state-word match was case-sensitive and missed `Checked` on the first run.
Runs: node tests/test-validate.mjs — "W7 · a boolean named like a state"

## E5 · Hit target and fill siblings are native-only
Fixture: `Toolbar`, 320 × 32, interactive, with two fill-width labels in a row.
Assert: I13 and A11 on `$root` (under 44 pt / 48 dp); I7 and A2 on the fill pair; no web finding for either. A fixed-height root around text is I5 / A7 — the root counts, because a 32 px row is the case.
Runs: node tests/test-validate.mjs — "I13 · an interactive root under 44 pt"

## E5b · A fixed leaf beside a fill sibling is not W8
Fixture: `Card › Body` (fill, max width 640) holding `Avatar` (fixed 48).
Assert: W8 on `Body`, none on `Avatar`. Regression: the first detector flagged nine checkboxes and avatars in one library.
Runs: node tests/test-validate.mjs — "W8 · a max width on a fill child, and not a fixed leaf beside it"

## E6 · Identical findings collapse across variants
Assert: every finding carries a `variants` array and no `variant` key; an unknown target throws rather than returning an empty, clean-looking array.
Runs: node tests/test-validate.mjs — "every finding carries a variants list"

## E7 · A stored tree is read as it is, and what it cannot show is named
Fixture: an inline `Chip` with a hex fill, a variable-named stroke at centre, a named effect style, and a text style whose line height is Auto in the styles list.
Assert: the hex reads as unbound (I11), the stroke still reads (I1), the named effect is not a literal (no I9), the line height comes from `--text-styles` (W9); `silentClasses` names W10, W13, W14, W15 and W11 for that tree and nothing for the full fixture. Regression: the full fixture had no mask or image layer, so the "nothing silent" assertion failed honestly until one was added.
Runs: node tests/test-validate.mjs — "stored · a hex literal reads as an unbound fill"

## E8 · A resolved Auto line height is still Auto
Fixture: the inline `Chip` with its style listed as `measured`, then as `style`.
Assert: W9 on `Label` for `measured`, none for `style`. Regression from the first live run: the stored path had reported no W9 on a Button whose live tree showed Auto on every label, because the styles list records what Auto resolved to.
Runs: node tests/test-validate.mjs — "stored · a line height the styles list resolved (measured / metric) is still Auto"

**And the NODE's own Auto, which the store could not carry until 2026-09-22.** The rule tests `lineHeight === 'auto'`, and the snapshot plugin dropped a node's line height entirely when its unit was AUTO — so the field was absent, which is indistinguishable from "not a text node" and from "an older snapshot". W9 and A4 therefore could not fire on stored input at all: 15 rows exist from when the check ran live, none from any snapshot since, and the class read as "checked and clean" while it was structurally unable to answer. The fixture here has always supplied `'auto'` directly, so this suite stayed green over a rule the real input could never trigger — which is the failure this case now exists to name.
Assert, against a real stored tree rather than the fixture: some node carries `lineHeight: 'auto'`, or every text node carries an explicit value. A tree where NO node has the field at all is a store written before plugin 0.39.0, and W9's silence there means nothing.
Not walked against a re-snapshot yet — the plugin change ships ahead of the next run of it.

## T1 · The target is asked, not assumed
Assert: the skill instructs that the target is read from the context document or asked, one per run, and that a multi-platform library is validated once per target. Traced to §Step 0.
Not walked.

## T2 · The choice goes to the designer before code
Assert: each row ends in Figma / code / accept and nothing under that component starts in code on that target until chosen. Traced to §Running it, step 3.
Not walked.

## T3 · What the engine cannot see is stated
Assert: the report names screen-level classes, live-only fields and the reverse direction as outside the engine. Traced to §What the engine cannot see.
Not walked.

## E9 · Translations name what the web builds differently
Fixture: the inline `Field` — a State axis with Loading, Disabled, `Role#0:0`, Align, Size; an inside stroke on the root in two variants, Auto gap, a one-line and a two-line truncation, a rotated chevron, and a focus ring only on Focus.
Assert: WT1 maps Hover to `:hover` and leaves Loading a property; WT2 fires; WT3 renames Role (suffix stripped) and flags Align, not Size; WT6 names the ring 4px out and WT7 does not list it; WT7 is one note for both variants; WT10, WT11 (ellipsis and clamp), WT12 fire.
Runs: node tests/test-validate.mjs — "WT1 · State values become pseudo-classes, Loading stays a property"

## E10 · Translations stay out of the audit's way
Fixture: `Clean button` from the shared fixture.
Assert: `validate()` finds nothing on it on the web while `translations()` returns exactly WT7 (its inside stroke); iOS returns no translations. The audit's output is unchanged by 2.6.0.
Runs: node tests/test-validate.mjs — "translations · the web-clean button still gets its inside stroke translated, and ios has none yet"

## E11 · A drop shadow that Figma and CSS cast differently — *executed*
Fixture: a 160 by 120 frame, radius 24, fill, one drop shadow, Clip content off; variations with a square child in a corner, with clipping on, with no fill and a round child, with spread, with an outside focus ring, and with a child inset from the corners.
Assert: W17 fires for the square corner child, for the unfilled frame whose shadow takes a child's shape, and for spread on an unclipped frame; it names the reason in each.
Assert also (negative): clipping on silences it, a focus ring outside the frame is not a finding (it is meant to sit there, WT6), and a child clear of the corners is silent. The behaviour behind the class was tested in Figma on 2026-10-01, not inferred from documentation, which states neither the child-silhouette rule nor what clipping does to it.
Runs: node tests/test-validate.mjs — "W17 · a square child in a rounded corner of an unclipped shadowed frame", "W17 · the same frame with Clip content on is silent"

## MU1 · A value outside a closed enum cannot exist in the build
Fixture: the MUI fixture's `Text input`, mapped to `TextField`, with an `Underline` variant value.
Assert: one MU1 row, on `Text input`, naming the `Underline` axis value — `TextField.variant` has no `| string` tail, so no theme can add it.
Runs: node tests/test-validate.mjs — "mui · a CLOSED enum value is a finding: TextField.variant has no `| string` tail"

## MU2 · A value outside an open enum is a theme variant to schedule
Fixture: the MUI fixture's `Button` with a `Ghost` value.
Assert: an MU2 row on `Button` naming `Ghost`, whose advice is module augmentation — a cost, not a defect. A `Size` axis matching the prop raises nothing.
Runs: node tests/test-validate.mjs — "mui · an OPEN enum value is a theme variant to schedule, not a defect"; "mui · a Size axis matching the prop raises nothing"

## MU3 · A drawn Loading state needs a component with a `loading` prop
Fixture: Loading drawn on both `Chip` and `Button`.
Assert: one MU3 row, on `Chip`; Button takes `loading` and raises nothing.
Runs: node tests/test-validate.mjs — "mui · Loading on Chip has no prop; Loading on Button does"

## MU4 · A drawn focus ring adds to the one MUI renders
Fixture: a `Button` with a drawn focus ring.
Assert: one MU4 row, on `Button`.
Runs: node tests/test-validate.mjs — "mui · a drawn focus ring is additive to the one MUI renders"

## MU5 · An icon in the middle of a field has no adornment position
Fixture: `Text input` with an icon between prefix and value; `Search input` with a leading icon; `Password input` whose trailing icon sits under a State layer overlay.
Assert: one MU5 row, on `Text input`. Assert also (negative): the leading icon and the overlaid trailing icon raise nothing.
Runs: node tests/test-validate.mjs — "mui · an icon between the prefix and the value has no adornment position"; "mui · a leading icon is a start adornment and raises nothing"; "mui · overlays do not count toward a position: the trailing icon is still last"

## MU6 · A Chip trailing icon that is not a delete affordance maps to no slot
Fixture: `Chip` with a trailing `close` icon behind a boolean.
Assert: one MU6 row whose detail names `deleteIcon`.
Runs: node tests/test-validate.mjs — "mui · a Chip trailing icon behind a boolean that is not a delete affordance"

## MU7 · Withdrawn, and stays silent (negative)
Fixture: a `Dropdown input` mapped to `Select` with a `Value text` property.
Assert: no MU7 row. A `Value text` property sets a Select's displayed value; it is not evidence of typing.
Runs: node tests/test-validate.mjs — "mui · the withdrawn Select/Autocomplete rule raises nothing"

## MU8 · A non-square icon is stretched by font-size sizing
Fixture: `Badge` with a 24×16 icon; `Chip` with a square one.
Assert: one MU8 row naming `24×16`; the square icon raises nothing.
Runs: node tests/test-validate.mjs — "mui · a non-square icon is stretched by font-size sizing"; "mui · and a square one is not"

## MU9 · A component the build calls something else
Fixture: `Spinner` mapped to `CircularProgress`, `Button` and `Chip` mapped to themselves, an unmapped `Nudger`.
Assert: one MU9 row, on `Spinner`, with `expected` `CircularProgress`. Assert also (negative): matching names and the unmapped component raise nothing — no rename by guesswork.
Runs: node tests/test-validate.mjs — "MU9 · a component the build calls something else"; "MU9 · and one whose name already matches raises nothing"; "MU9 · an unmapped component is left alone"

## MU10 · An axis that means a prop but is not named for it
Fixture: `Button` with a `Role` axis; `Chip` with a `variant` axis.
Assert: one MU10 row on the `Role` axis with `expected` `variant`; `Chip` raises nothing.
Runs: node tests/test-validate.mjs — "MU10 · an axis that means a prop but is not named for it"; "MU10 · and an axis already named for its prop raises nothing"; "MU9 and MU10 both state what the build calls it"

## MU11 · A component the map does not name is one row against the map
Fixture: six components, two mapped (`Org switcher` to `null`), two public ones unmapped, two private parts.
Assert: one MU11 row filed against `frameworkComponents`, naming `Spinner` and `Toast` only, landing in `accept`. Assert also (negative): `null` is an answer and is not raised, private parts are left to their parent, a fully named library raises nothing, and a `null` entry breaks no other rule.
Runs: node tests/test-validate.mjs — "MU11 · components the map does not name are one row, filed against the map" and the six MU11 assertions after it

## CLI1 · The file may follow `--snapshot`
Fixture: one component in a temporary file, run as `--target web --snapshot <file>` and as `<file> --target web --snapshot`.
Assert: neither prints usage, and both print the same report.
Runs: node tests/test-validate.mjs — "CLI · the file may follow --snapshot, a flag that takes no value"

## ST1 · The state axis and its options come from the settings
Fixture: `Tab` with `State: [Rest, Hover, Selected]`, and with `Interaction: [Idle, Selected]`.
Assert: with `states` naming `State` and the house options, `Selected` is W7 and `Loading` is not; with `states` naming `Interaction`, the finding sits on `Interaction`; with no `states`, no axis finding.
Runs: node tests/test-validate.mjs — "WT1 · no recorded state axis, no pseudo-class translation", "W7 · a state value outside the recorded options", "W7 · a recorded state option (Loading) is not a finding", "W7 · no recorded state axis, no state-axis check", "W7 · a renamed state axis is read from the settings". (The settings reader the validator is given, `validatorStates`, is the toolkit's and is tested with it, in tools/snapshot/test-router.mjs.)

## CV1 · A component whose name holds " / " is named whole
Fixture: `Table` drawing five instances of `Table - Cell / Fill / Size=md`, validated with `known` naming `Table`, `Table - Cell` and `Table - Cell / Fill`.
Assert: the W12 finding names `Table - Cell / Fill`, the longest known name the path starts with, not `Table - Cell`.
Runs: node tests/test-validate.mjs — "W12 · a component whose own name holds a spaced slash is named whole, from the known names (CV1)"

## WF1 · The live reader takes a prepended SCOPE and marks every hidden layer
Fixture: a fake page of two sets, `Chip` and `Tag`, each variant holding a hidden TEXT layer and a shown VECTOR, run through `scripts/walk-figma.js` as `figma_execute` runs it (a function body).
Assert: no SCOPE walks both sets; `const SCOPE = ["2:2"];` prepended walks `Tag` alone; the hidden leaf carries `hidden: true` and the shown one no `hidden`. Found by a review on 2026-10-30: SCOPE was declared inside the walk, so a prepended one was shadowed, and `hidden` was recorded on containers only.
Runs: node tests/test-validate.mjs — "walk-figma · no SCOPE walks every set on the page", "walk-figma · a prepended SCOPE walks those sets alone", "walk-figma · a hidden leaf layer is recorded hidden, a shown one is not"
