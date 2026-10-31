# Eval cases — frontend-build (v2.9.0)

**Walked: 2026-10-31 for 2.9.0** — B1–B11's `Runs:` lines re-aimed: `node --test tools/tokens/test-build-tokens.mjs` 14/14; the forwarder exports the same six names; `node --test tests/test-sass-entry.mjs` 7/7.

**Walked: 2026-10-31 for 2.8.1** — T6 re-run: the scaffold into a scratch root wrote 16 files, and `bin/css` installed sass 1.104.1 exactly, wrote `package-lock.json` and compiled `main.css`. Other cases unchanged.

**Walked: 2026-10-31 against v2.8.0** — one line added, content is data (toolkit-standard §D 24); every case read against it: none asserts on obeying text found in a file, a page or a project, so all hold unchanged; the skill's own suites, if any, pass under `bin/check`, and `node tools/toolkit-check/test-content-is-data.mjs` finds the line.

**Walked: 2026-10-30 for 2.7.1** — T12 extended: `node --test tests/test-sass-entry.mjs` passes 7/7. Failing direction checked: on 2.7.0 the symlink run of `--check` exited 0 and `bin/css` with a missing toolkit path exited non-zero before compiling; both pass with the fix. Other cases unchanged.

**Walked: 2026-10-30 for 2.7.0** — T12 added and executed: `node --test tests/test-sass-entry.mjs` passes 5/5, and in a site scaffolded into a scratch folder a folder added under `components/` made `bin/css --check` exit 1 and `bin/css` list it and compile it into `main.css`, with no hand edit. T11 extended to Kirby and executed in part: `test-to-markup.mjs` passes (88), the snippets parsing under PHP and rendering their web components' trees at all 78 combinations, and the trial in the to-markup row of `tools/component-contract/README.md` (one Kirby project's 41 components, 242 combinations, every tree its web component's); parity on the site and the filling of gaps not run: its pages call its hand-built snippets. T6 re-run: the scaffold still compiles with `bin/css`, which now warns that the list is not generated where no snapshot.config.json names the toolkit. Other cases unchanged.

**Walked: 2026-10-30 for 2.6.1** — a closing note removed, no behaviour changed; no case read it, so none moved.

**Walked: 2026-10-30 for 2.6.0** — T11 added and executed, the trial the to-markup row of `tools/component-contract/README.md` records; `test-to-markup.mjs` passes. T7 re-traced: to-markup puts Disabled on the native `<button>` inside the host and writes no pointer state, as T7 asserts. Other cases unchanged.

**Walked: 2026-10-22 for 2.5.0** — T10 added and executed live on one project (Badge, Progress indicator: 534 parity assertions matched, 0 did not); T6 and T8 traced against the new step 5: the scaffold's worked component has no contract, so it stays hand-written, as the step says. Other cases unchanged.

**Walked: 2026-10-22 for 2.4.5** — B5 re-run: the mixin is now written from `textStyleFields`, and `node --test tests/test-build-tokens.mjs` passes 14/14; both registered repos regenerate their token files unchanged (`tools/tokens/build.mjs --check`). Other cases unchanged.

**Reviewed against v2.4.4 on 2026-10-14** — 2.4.1–2.4.2 made both dark blocks `screen` only: B2 asserts exactly that and `node --test tests/test-build-tokens.mjs` passes 14/14; the axe step the audit gained is tools/ui-check's, tested there (test-axe.mjs). 2.4.3–2.4.4 changed paths and names only.

**Walked: 2026-10-12 for 2.4.0** — A9 added: the knowledge is held to, page by page. Other cases unchanged.

**Walked: 2026-10-11 for 2.3.0** — A8 added: look before you ship; its tool half runs in `tools/ui-check/test-check.mjs`. Other cases unchanged.

**Walked: 2026-10-11 for 2.2.0** — the build references moved to `knowledge/code/`; every path in SKILL.md and these cases repointed, and the audit pass's §3 gained the `knowledge/code/` depth line; A6 re-traced: the skill's references are now `audit/` alone. Traces re-read against the moved pages' real section names: T1 (*Three tiers*) and T2 (*Custom properties or Sass variables*) resolve as written; T2's note now says `responsive.md` *Breakpoints* defers the reason to that tokens section; T3 re-traced from the old *Focus and keyboard* to `accessibility.md` *Visible focus* and `figma-handoff.md` *Focus rings: reading their geometry*; T5 from the old *Fidelity, and where to break it* to `figma-handoff.md` *Reporting deviations*; T6 re-read: the focus-ring geometry is stated once, in `figma-handoff.md`, and `accessibility.md` and `css-architecture.md` link to it.

**Walked: 2026-10-11 for 2.1.0** — references moved to `build/` and `audit/`, and every path in SKILL.md, the references and these cases repointed; A6 added and walked; A7 walked live, the first end-to-end audit of a real build. The cases below re-read against the new paths.

**Walked: 2026-10-11 for 2.0.0** — the skill now audits as well as builds. A1 **executed**: `tools/ui-check/test-check.mjs` 16/16, and `tools/ui-check/check.mjs` over six pages of a live docs site, clean, after a probe confirmed it saw their tab list, segmented groups, menus and searches. A5 **executed** by grep, widened after the first review round. A2–A4 traced. T1–T5 and T7 walked for the first time (T4 executed, the rest traced), T3 against its new home. B1–B11 unchanged (`test-build-tokens.mjs` re-run).

**Walked: 2026-10-03 for 1.4.2** — T9 added, *traced*: the Components step's sentence read against §D 8's three moments; the signal matched against the four comments the review moved (one project's hairline and focus partials, its base sheet's dim, its font script).

**Walked: 2026-10-02 for 1.4.1** — T8 **executed** again: the scaffold into a scratch root wrote 16 files, a second run wrote 0 and kept 16, `sass` compiled the reset ring at `calc(var(--space-4) - var(--state-focus-stroke-width))` and the button dim on `ds-button:has(> :is(button:disabled, a[aria-disabled=true]))` through `--ds-dim`, with no literal opacity; its third assertion, now one citation of code-standard rule 62 from `SKILL.md`, read against both files. `test-build-tokens.mjs` 14 of 14. T1–T7 unchanged.

**Walked: 2026-10-02 for 1.4.0** — T8 added and **executed**: the scaffold run into a scratch Kirby root wrote 16 files including `base/_focus.sass` and `base/_hairline.sass`, a second run wrote 0 and kept 16, and `sass` compiled `index.sass` with the reset's ring at `calc(var(--space-4) - var(--state-focus-stroke-width))` and the button's dim on the host through `--ds-dim`. T3 re-traced: the scaffold now says `0`, never `none`, in its ring knob. B1–B11 unchanged (`test-build-tokens.mjs` re-run, see below); T1, T2, T4–T7 unchanged.

**Reviewed against v1.3.6 on 2026-09-20** — citation only: the four standards governing the toolkit's parts became `standards/toolkit-standard.md`, and this skill's references point at its §A. No rule and no case changed.

**Walked: 2026-09-19 for 1.3.5** — `test-build-tokens.mjs` 14/14; the slot case fails on 1.3.4. Real input: one library's modal shadow now writes `0px` in the spread Figma leaves unbound; the other repo changes only by 1.3.4's px spreads.

**Walked: 2026-09-19 for 1.3.4** — `test-build-tokens.mjs` 13/13; the new case (a shadow whose spread is bound to a spread token) fails on 1.3.3. Real input: one library regenerated, its parity gate green, the 176 moved measurements read one by one, all dark-theme shadow colours with unchanged geometry.

**Walked: 2026-09-19 for 1.3.3** — no case changed; `test-build-tokens.mjs` 12/12 with the `shadowCss` export case, and both repos regenerate byte-identical.

**Walked: 2026-09-19 for 1.3.2** — no case changed; `test-build-tokens.mjs` 11/11 after `breakpointName` moved to module level and the dead map went. The docs site's names were then checked against both registered repos' generated files: 314 and 374 properties, 18 mixins, 0 missing.

**Walked: 2026-09-19 — pass (18/18), re-walked for 1.3.1.** B10 and B11 added from the build's first run on two libraries it had never met, both stored snapshots of projects without a repo: one crashed on a collection of booleans, and the same library's breakpoints came out as custom properties. Both cases fail on 1.3.0 and pass now; `node --test tests/test-build-tokens.mjs` 11/11, and both registered repos regenerate byte-identical (`bin/tokens --check`).

**Walked: 2026-09-19 — pass (16/16).** Re-walked for 1.3.0. E1–E5 retired with `tokens-to-css.mjs`; B1–B9 replace them, **executed** by `node --test tests/test-build-tokens.mjs` (9/9) against the real Style Dictionary 5.5.1, and shown to fail — three reds — with the collision check disabled and the rem transform broken. The build also ran on two real projects, whose every computed custom property matched their old output (4,080 and 1,432 compared). T1–T7 unchanged: T2 re-traced to `knowledge/code/tokens.md`, whose example now uses the generated `from($md)` mixin.

**Walked: 2026-08-27 — pass (12/12).** Re-walked for 1.2.0. T6 and T7 added and **executed against a real project**, not traced: the scaffold ran into a second Kirby site, the gallery served its component through the real snippet, a second run overwrote nothing, and removing the host config took `/design-system` to 404. E1–E5 re-run (12/12); T1–T5 unchanged.

**Walked: 2026-08-21 — pass (10/10).** E1–E5 executed (`node tests/test-tokens-to-css.mjs`, 12/12); T1–T5 traced again after 1.1.0 added the pointer to `code-standard.md` — no instruction changed, so no trace moved. The skill has now run on one real build (2026-08-20); that run's lessons are in the standard, not here.

**Walked: 2026-08-14 — pass (10/10).** Two kinds of check, stated per case. E1–E5 are **executed**: `node tests/test-tokens-to-css.mjs` runs 12 assertions against the engine, all passing, plus one end-to-end CLI run. T1–T5 are **traced** — each assertion followed to the instruction in `SKILL.md` or a reference that mandates it. No case here has been observed against a live build; the skill has not yet run on a real design. That is the gap to close on the first project, and cases T2, T4 and T5 are the ones a real run could still falsify.

Run the executable half from the repo root:

```sh
node --test tools/tokens/test-build-tokens.mjs
```

It borrows Style Dictionary from a registered repo's `node_modules` (the build takes it injected) and reports the tests as skipped where none has it installed — a skip is not a pass.

---

## B1 · An alias stays a reference — *executed*
Assert: `--text-link: var(--palette-blue-600);`, never the literal colour, and no property carries its collection (`--semantic-…`). A generator that copies the value destroys the semantic tier while producing output that looks correct.
Runs: node --test tools/tokens/test-build-tokens.mjs — "an alias stays a reference, named by its path without the collection"

## B2 · Light is the base; Dark is the attribute and the unchosen system preference — *executed*
Assert: the Light value on `:root`, the Dark value under `@media screen { [data-theme="dark"] }` and again under `@media screen and (prefers-color-scheme: dark) { :root:not([data-theme="light"]) }` — screen only, so print keeps the light tier. Either alone fails a reader: the attribute alone ignores the OS, the media query alone ignores the toggle.
Runs: node --test tools/tokens/test-build-tokens.mjs — "Light is the base, Dark is the attribute and the unchosen system preference"

## B3 · rem, except what must not scale — *executed*
Assert: `space/2: 8px` → `0.5rem`; `radius/md: 8px` stays `8px`; a colour is untouched. A radius in rem grows with the reader's text size and stops matching its border.
Runs: node --test tools/tokens/test-build-tokens.mjs — "lengths are rem except the ones that must not scale; colours are untouched"

## B4 · Responsive modes switch at the breakpoints, which are Sass — *executed*
Assert: Desktop's value inside `@media (min-width: 64rem) { :root }`; no `--breakpoint-*` property; `$sm: 40rem` and `@mixin from($bp)` in `_breakpoints.scss`. A media condition cannot read `var()`.
Runs: node --test tools/tokens/test-build-tokens.mjs — "Mobile is the base and Desktop switches at the md breakpoint, which is Sass"

## B5 · A text style is its fields, a bound field stays a reference — *executed*
Assert: `--body-font-family` with the fallback stack, `--body-font-size: var(--body-size)`, letter-spacing present at zero, no `font` shorthand, and `text-style($name)` in `_text-styles.scss`. Regression: Style Dictionary's own `expand` resolved the reference first, so responsive type stopped following its breakpoint.
Runs: node --test tools/tokens/test-build-tokens.mjs — "a text style is its fields, a bound field stays a reference, and the mixin applies it"

## B6 · Two paths that become one property fail the build *(negative)* — *executed*
Assert: rejects, naming the property. With the collection dropped from names, `Primitive/Space/2` and `Spacing/Space/2` collide, and without the check one silently wins.
Runs: node --test tools/tokens/test-build-tokens.mjs — "two paths that become one property fail the build"

## B7 · An alias to nothing fails the build *(negative)* — *executed*
Assert: rejects. It must never emit `var(--missing)`, which renders as an unset property with no error anywhere.
Runs: node --test tools/tokens/test-build-tokens.mjs — "an alias to nothing fails the build rather than writing var() to nothing"

## B8 · A responsive mode with no breakpoint fails the build *(negative)* — *executed*
Assert: rejects with `needs Breakpoint/md`. Writing the mode with no query would apply Desktop values everywhere.
Runs: node --test tools/tokens/test-build-tokens.mjs — "a responsive mode with no breakpoint to switch at fails the build"

## B9 · A diagonal gradient is a corner keyword; a bound stop stays a reference — *executed*
Assert: a 135° gradient with one bound stop renders `linear-gradient(to bottom right, var(--palette-blue-600) 0%, #ffffff 100%)`. Figma's angle lives in the node's unit square and stretches with the frame, which the corner keywords do and degrees do not. Added 2026-09-19 because no real library had a diagonal gradient to prove it on; shown to fail with 135 removed from the corner table.
Runs: node --test tools/tokens/test-build-tokens.mjs — "a diagonal gradient is a corner keyword, and a bound stop stays a reference"

## B10 · A mode holding nothing CSS can carry writes no block *(regression)* — *executed*
Fixture: a collection whose two modes hold only booleans (a component's show/hide switches), so every mode file is empty after export.
Assert: the build completes, writes no `[data-<collection>]` block, and everything else is intact. It used to crash reading a file Style Dictionary never wrote for an empty mode.
Runs: node --test tools/tokens/test-build-tokens.mjs — "a mode holding nothing CSS can carry writes no block and does not stop the build"

## B11 · A collection named for breakpoints is Sass, never custom properties *(regression)* — *executed*
Fixture: `05. Breakpoints` holding `tablet: 1024`, and `6. Breakpoints` holding `Breakpoint/xl: 1280`.
Assert: `$tablet: 64rem` and `$xl: 80rem` in `_breakpoints.scss`, and no `--tablet` property. A library that keeps breakpoints in their own collection, without a `Breakpoint/` group, came out as `--mobile`/`--tablet`/`--desktop` with an empty `_breakpoints.scss`; the first fix then named the grouped kind `$breakpoint-xl`, caught by a registered repo's `bin/tokens --check` before it shipped. The group wins over the collection.
Runs: node --test tools/tokens/test-build-tokens.mjs — "a collection named for breakpoints is Sass too, never custom properties"

## T9 · A deviation is decided where it is found — *traced*
Fixture: a component whose stylesheet is about to carry a comment explaining why the code differs from the design (an outside hairline drawn as an outer shadow; a ring offset derived from the stroke width; a dim on the host rather than the control).
Assert: the Components step tells the builder to decide in that change whether the comment is a project fact (the context document) or a toolkit lesson (a rule, a scaffold file, an engine rule), and to write it there in the same commit — not at the session's close (toolkit-standard §D 8).
Negative: 1.4.1 said nothing at this step; the four comments it would have caught reached the toolkit through a review a month later.
Traced: 2026-10-08 — to SKILL.md's Components step, which says to decide in that change where a Figma-to-code mismatch lives.

## T1 · Semantic tier only in components
Assert: the skill instructs that components consume semantic tokens only, and that a primitive appearing in a component stylesheet is a defect. Traced to `knowledge/code/tokens.md` §Three tiers ("Components consume semantic tokens only"), which `SKILL.md` step 2 points to.
Traced: 2026-10-11 for 2.0.0.

## T2 · Breakpoints are Sass variables; the values they change are custom properties
Assert: the skill states both halves, and states the reason — custom properties are not permitted in media conditions. A skill that gives only the first half leaves a reader writing `@media (min-width: var(--bp-md))`, which fails silently. Traced to `knowledge/code/tokens.md` §Custom properties or Sass variables.
Traced: 2026-10-11 for 2.2.0: both halves and the reason are there; `knowledge/code/responsive.md` *Breakpoints* defers the names to code-standard rule 54 and the reason to this tokens section.

## T3 · Focus is never removed
Assert: the skill forbids `outline: none`, requires `:focus-visible` with `outline-offset`, and requires the ring to be checked against every surface it appears on — not just the page background. Traced to `knowledge/code/accessibility.md` §Visible focus (`:focus-visible`, `outline: 0` never `none`, every surface via `ui/design/accessibility.md` *Focus visibility*) and `knowledge/code/figma-handoff.md` §Focus rings: reading their geometry (the `outline-offset` arithmetic). 2.0.0 removed the restated list from `SKILL.md`; the example is `@include focus.ring(...)`, whose offset is computed, never typed.
Traced: 2026-10-11 for 2.2.0.

## T4 · The skill prescribes no runtime *(negative)*
Assert: no reference names a JS framework, templating language or CMS as required, and `SKILL.md` explicitly defers the HTML-rendering layer to whatever else covers it. The skill must stay silent here — a front-end skill that assumes a runtime is unusable on the next project, and the toolkit's self-containment rule forbids leaning on another skill's files. Falsifiable by grep.
Walked live: 2026-10-11 for 2.0.0 — `grep -rniE 'react|vue|svelte|angular|next\.js|kirby|wordpress' references/` finds nothing; `SKILL.md` names Kirby only as the one runtime the optional scaffold writes.

## T5 · Deviations are reported, not applied silently
Assert: where the skill overrides the design — a contrast failure, a touch target under 24px, a label allowed to wrap — it requires the deviation and its reason to be said back to the user. A build that silently corrects a design teaches nobody anything and gets reverted at review. Traced to `SKILL.md` §Reporting back from a build and `knowledge/code/figma-handoff.md` §Reporting deviations.
Traced: 2026-10-11 for 2.2.0.

## T6 · The library shape is scaffolded, not re-derived — *executed*
Fixture: a Kirby project with `site/` and no design system. Run
`node scripts/scaffold-design-system.mjs --root <project> --vendor acme --prefix ds`.
Assert: it writes the plugin, the Sass entry with its five cascade layers, the starter tokens, the base layer, one worked component as a `<name>.php` / `_<name>.sass` / `<name>.stories.php` triple, and the gallery — and `bin/css` compiles `index.sass` to `assets/css/main.css` without further edits.
Assert: a component is registered from its folder name alone; nothing in the plugin lists components by hand.
Assert: a second run **writes nothing and reports what it kept**. It must never overwrite a file the project already has.
Assert: `/design-system` serves the gallery only where the project's config sets `<vendor>.designsystem.gallery`; without it the routes are not registered at all and the URL 404s. A gallery that reflects query strings into snippets must not be reachable because someone forgot a flag.
Walked live: 2026-08-27 — the scaffold run into a second Kirby site: the gallery served its component through the real snippet, a second run overwrote nothing, and removing the host config took `/design-system` to 404.

## T8 · The scaffold's components inherit the ring, the hairline and the dim — *executed*
Fixture: a Kirby root with `site/`. Run `node scripts/scaffold-design-system.mjs --root <project> --vendor acme --prefix ds`, then compile `assets/design-system/index.sass` with Sass.
Assert: `base/_focus.sass` and `base/_hairline.sass` are written, emit no CSS of their own, and `focus.ring` takes `$clear` with no default (every caller states where its ring sits) and computes `outline-offset: calc(<clear> - var(--state-focus-stroke-width))` — never a typed offset.
Assert: the compiled button dims `ds-button:has(> :is(button:disabled, a[aria-disabled="true"]))` with `opacity: var(--ds-dim, var(--state-disabled-opacity))`, and nothing dims the inner control or writes a literal opacity.
Assert: `knowledge/code/figma-handoff.md` cites `code-standard` 63 for the stroke table rather than copying it and states the focus-ring geometry once; the disabled dim is cited once, from `SKILL.md`, as code-standard rule 62, with the scaffold's knob and nothing of the rule's text.
Walked live: 2026-10-02 — as in the header.

## T10 · A component's stylesheet is generated; the markup meets its hooks — *executed*
Fixture: a repo with `paths.componentStyles` and a component whose contract is stored. Run `bin/component-styles`, then build the component.
Assert: the build writes no rule the generated sheet already holds; the markup carries the root and part classes the sheet's *Parts* line names, nested as its anatomy nests them, and each prop value as its *Chosen by* line says.
Assert: the component's own sheet holds only what the header lists as *Not written* (an arc, an image fill) and behaviour the design does not draw; where nothing is left, there is none.
Assert: `bin/component-styles --check` is green, and parity on the component matches every assertion with no new waiver.
Walked live: 2026-10-22 — one project's Badge (generated sheet alone) and Progress indicator (an own sheet for the arc's mask alone): 534 parity assertions matched, 0 did not, both themes.

## T11 · Generated markup carries the sheet's hooks; its gaps are this step's — *executed in part*
Fixture: a React, web-component or Kirby repo (`framework` in its snapshot.config.json) whose components have stored contracts. Run to-markup, then build a component it marked.
Assert: the markup is to-markup's, not rewritten: its type-check and lint pass, and parity on it matches with no new waiver.
Assert: each `frontend-build:` gap at its top is filled (an element and role, a pointer state's part, an icon, a placed control's name) and the banner then taken out; a gap with no answer in the design is asked, not guessed.
Walked live: 2026-10-30 — the trial in the to-markup row of `tools/component-contract/README.md`; a sample of its gaps read (icon drawings, icon-only names, a dropdown's open state drawn at focus). Parity and the filling of gaps not run: the copy's screens call the hand-built components' API, not this one.

## T12 · The Sass entry's components list is its folders' — *executed*
Fixture: a site scaffolded by `scripts/scaffold-design-system.mjs`, its snapshot.config.json naming the toolkit. Add a folder `components/card/` holding `_card.sass`.
Assert: `bin/css --check` exits 1 naming code-standard rule 23 and writes nothing; `bin/css` adds the card's line between the entry's two marker lines, in name order, changes nothing outside them, and compiles it.
Assert: a folder with no partial named after it is not listed, an entry without the markers is refused naming them, and where no snapshot.config.json names the toolkit, or it names a path with no `sass-entry.mjs`, `bin/css` says the list was not generated and compiles, and `--check` fails; run through a symlink, `sass-entry.mjs --check` still checks.
Runs: node --test tests/test-sass-entry.mjs — "(negative) run through a symlink, --check still checks", "(negative) bin/css with a toolkit path that does not exist warns and compiles; --check still fails".
Walked live: 2026-10-30 — as the 2.7.0 line above records.

## T7 · Native interactive wraps the control, never replaces it — *traced*
Fixture: "add a disabled state to our `ds-button`."
Assert: the answer puts `disabled` on the native `<button>` inside the custom element, not as an attribute on the wrapper, and says why — the browser keeps the control out of the tab order and out of form submission.
Assert: for the link form it uses an `<a>` without `href` plus `aria-disabled`, rather than a disabled attribute an anchor does not have.
Assert: it does not propose JavaScript to emulate any of it, and it does not add a `state` attribute for hover, focus or press.
Traced: 2026-10-11 for 2.0.0: `SKILL.md` §component library cites code-standard rules 8 and 9, which state all three.

## A1 · An audit of a build runs the page checker and names each breach by rule — *executed*
Fixture: a page with five segmented buttons, a menu after its search, a menu reading only "All" and not disabled, and a tab list that moves 60px when its second tab is chosen.
Assert: `node tools/ui-check/check.mjs <url>` reports design-standard rules 4, 3, 5, 12 and 2, each naming the control, and exits 1; a page keeping every rule exits 0 with "clean".
Assert: before a clean result is reported, the audit confirms the checker saw the controls it judges (SKILL.md: "a probe that returns nothing is a finding about the probe").
Runs: node tools/ui-check/test-check.mjs — "in a browser: five segmented buttons are found"
Runs: node tools/ui-check/test-check.mjs — "in a browser: the tab bar that moves 60px on a switch is found"
Walked live: 2026-10-11 — `tools/ui-check/test-check.mjs` 16/16 (the fixture above in headless Chrome, and each rule's judge fired and quiet); six docs-site pages clean, with their one tab list, five segmented groups, two menus and two searches confirmed seen.

## A2 · An audit of a design reads the snapshot and runs the Figma audit skills by name — *traced*
Fixture: "audit this Figma screen."
Assert: the answer runs `figma-components-audit` and `figma-foundations-audit` by name for what they measure (an audit reads the live file, toolkit-standard §D 5's exception), says no skill checks a whole screen's contrast, and walks design-standard on screenshots of the frames. It reads none of those skills' files (skill-standard §A clause H).
Traced: 2026-10-11 for 2.0.0 to `SKILL.md` §Audit, the *A design* row.

## A3 · Comparing a build with its design is handed to parity *(negative)* — *traced*
Fixture: "audit the design and the build of this page."
Assert: the answer runs both audits and names `design-code-parity` for the comparison; it never diffs the design against the page itself.
Traced: 2026-10-11 for 2.0.0 to `SKILL.md` (the opening "does not do" paragraph and the *Both* row).

## A4 · A finding leads with what it does to people, then the rule, then the fix — *traced*
Fixture: a filter menu that hides its empty options.
Assert: the finding reads like "Two areas disappear when they are empty, so the menu changes shape under the reader: keep them, disabled (design-standard rule 5)", not "design-standard rule 5 violated"; a candidate is raised as a suggestion with its source; what was not checked is named.
Traced: 2026-10-11 for 2.0.0 to `SKILL.md` §Reporting findings, which cites design-standard rule 10.

## A5 · The skill restates neither standard *(regression)* — *executed*
Assert: no file in the skill types a focus offset or width, puts `light-dark()` in a component, declares its own layer order, styles its examples by class or modifier class, or names breakpoints the token build does not write — the places 1.4.7 disagreed with code-standard rules 4, 6, 9, 53 and 54.
Walked live: 2026-10-11 for 2.1.0 — `grep -rnE "outline-offset: [0-9]|outline: [0-9]px|\.card \{ background: light-dark|@layer reset, base, layout, components, utilities|\.card__title \{|bp-sidebar|modifier class|Name the class|Style with a class|^\.(button|grid|prose|card|card-region) |@media \(min-width: bp" SKILL.md references/` (with `-r`) printed nothing, after a first review found six class-styled examples the narrower grep had missed.

## A6 · Guidance past the rules is consulted in knowledge/, never copied into the skill — *traced*
Fixture: "how should this form mark required fields?"
Assert: the answer consults `knowledge/ui/patterns/forms.md` (toolkit repo) and cites it, and the skill holds no copy of that guidance: its only reference is `audit/` (the judgement pass); how to write the code is `knowledge/code/`.
Traced: 2026-10-11 for 2.1.0 — to `SKILL.md`'s knowledge paragraph and *Where the rest is*; `ls references` shows `audit` only (2.2.0).

## A7 · An audit of a real build runs end to end: checks, then the judgement pass on screenshots
Fixture: a live docs site, two page types (an overview page and the audit queue), at 1280 and 390 wide.
Assert: the mechanical half runs and its probe confirms it saw the controls; the judgement half looks at screenshots at both widths and walks `references/audit/audit-pass.md`; each finding leads with what it does to people, cites the knowledge page or rule behind it, and names what was not checked.
Walked live: 2026-10-11 for 2.1.0 — `tools/ui-check/check.mjs` clean on six pages, controls confirmed seen; the judgement pass raised two recommendations at 390 wide (the Ask rail keeps about 45px of a 390px column open, squeezing the queue; the top navigation's tabs run off the edge with no cue that more exist: `knowledge/ui/patterns/navigation.md`, mobile navigation) and none at 1280. Not checked: both themes, keyboard, a screen reader, and the code gates, which the docs site does not run (code-standard's gates are a project's).

## A8 · No interface change ships before its screenshots are looked at
Fixture: an agent reports a batch of visual fixes done, every gate green, and the person has said "push it all".
Assert: the session takes `tools/ui-check/check.mjs --shots` of every changed page type (desktop light, dark, phone), opens every file, and fixes or reports what it sees before committing; the agent's own "I looked" and the permission to push do not count as the look.
Negative: pushing on green gates and permission alone.
Runs: node tools/ui-check/test-check.mjs — "--shots saves desktop, dark and phone for each page checked"
Traced: 2026-10-11 for 2.3.0 — to SKILL.md *Look before you ship* and step 6 of the order of work.

## A9 · An audit holds the site to the whole of the applicable knowledge
Fixture: a docs site whose findings list is all fixed, and whose dates are still plain text with no `<time>` element on any page.
Assert: the audit walks every applicable knowledge page section by section against every page type and reports the dates as a finding cited to `knowledge/ui/patterns/data.md` *Dates and times*, not as a recommendation; a gap the project accepts is a ruling in its context document.
Negative: calling the audit complete when the findings list is empty.
Traced: 2026-10-12 for 2.4.0 — to SKILL.md *Hold it to the whole of the knowledge* and *Reporting findings*.

