# Parity

This folder is the one design-to-code parity engine every project's
`bin/parity` calls: the code that measures a rendered component against its
Figma spec and saves the verdict. `skills/design-code-parity` is the method
(what to compare, the gates, the waiver model, what a red means); this is the
code. A project does not keep its own copy of anything here
(`tools/toolkit-check/owned.json`, code-standard 59).

## Use

Two modes. **Governed**: a project whose code follows the design runs the full loop from its own repo, and a red result blocks. **Comparison**: a library someone else built is measured against the design as a drift report, and nothing blocks.

```sh
# governed, from the project repo (its bin/parity calls this)
node ~/Projects/toolkit/tools/parity/run.mjs --repo .              # every gate and every variant; exit 0 is green
node ~/Projects/toolkit/tools/parity/run.mjs --repo . --gates      # only the gates that need no browser
node ~/Projects/toolkit/tools/parity/run.mjs --repo . --accept     # make this run's measurements the accepted baseline

# comparison: a library someone else built, rendered in its own Storybook
node ~/Projects/toolkit/tools/parity/external.mjs --project <label>
```

**Needs:** Node 22.12+ and Google Chrome. A governed project states its pages, host and baseline in `snapshot.config.json`; a comparison states its code in its context document (`code.repo`, and `code.parity`: the host and how to build it, its one tier, its token files, and where its mappings are). Both write their mappings in one format (below), and `project.mjs` `loadParity` reads either. **Writes** the verdict a docs site shows: `parity/report.json` in the project's `parity` folder (comparison), or where the project's `paths.parity` says (governed).

The method (what is compared, the gates, waivers, what a red means) is the [design-code-parity](../../skills/design-code-parity/SKILL.md) skill; read it before setting a project up.

## The mapping format

One format for every project, keyed by Figma's own names, wherever it lives (a governed repo's `parity.mappings`, or a compared library's `code.parity.mappings`):

| Field | Holds |
|---|---|
| `storyId` (or `route`) | where the component is drawn |
| `root`, `state` | the component's element, and where a pointer state is forced (`state: { layer }` names a layer) |
| `axes` | Figma prop → option → the args it sets, `{ pseudo }` for a forced state, or `{ skip: why }` |
| `props` | Figma prop → what no option says: `arg`, `code` (the component's own prop), `fixed` |
| `layers` | stored layer path (`Content > Label`, `Aside#2`) → selector, or a ruling `{ selector, fields, why }` / `{ skip: why }` |
| `page` | what puts the page in the state measured (`click`, `hover`, `press`, `fill`, `scroll`) |
| `variants`, `waivers`, `unmeasured`, `controls`, `sample` | the governed run's own (gates) |

A governed run reads what is left out as unrendered (gate 3); a comparison joins it by rule (`joinProp`, `pair.mjs`). A comparison works in the contract's ids, read through `contractEntry` and the component's bridge (`tools/component-contract/derive.cjs` `bridge`), which never inverts an id.

## Test

```sh
for t in tools/parity/test-*.mjs; do node "$t" || break; done
```

## Modules

| File | Job |
|---|---|
| `notCompared` (in the report) | Every value the design defines that no measurement covers, with why: a field a ruling leaves out (its `why`), one no element in the story shows, a layer no rendered combination draws (shown only by a prop the map holds fixed), and the prop values the map skips. Parity › Visual shows each as a "Not compared" row; `tools/docs-site/test-parity-pages.mjs` holds the page to the report. Elements the defaults do not draw are paired where one prop moved from its default draws them |
| `watch.mjs` | The code audit keeps itself current: `node tools/parity/watch.mjs <label>` re-runs `external.mjs` when the snapshot, the parity mappings or the code's component and Storybook folders change (the docs service calls it per project). Each component's result carries a hash of what it depends on (its contract, its map entry, the built Storybook, the tokens, the engine), and an unchanged component is not re-measured: with nothing new a run is the browser's start (about 6 s on one project's nine components, against 37 s for all) |
| `pair.mjs` | Which rendered element each contract element lands on, by rule: the element showing the most of the values the contract element defines (its paint and its spacing placed apart, since code often splits them), children before parents and a box preferring the element that holds its children's, a text's literal words, then the most specific; one matching none of its values placed by structure where only one thing can be it, else unpaired. Selectors from the library's own classes, else a path. On one project's nine mapped components it found 21 of the 22 elements a person had mapped (the 22nd is the same icon one level deeper); the hand map shrank to four rulings. Tested by `test-pair.mjs` |
| `external.mjs` | The code audit: a library someone else built, rendered in its own Storybook and measured against the design's component contracts (`tools/component-contract`), for every prop combination the contract allows. Opened by `openLibrary` through `loadParity` and the engine's one session (`session.mjs` builds their Storybook into the project's home, where the docs site serves it), the mappings read in the one format (above: the story, a value spelled differently, and rulings: a layer placed or compared otherwise than the rule does, or `skip` with why) into the contract's ids by `contractEntry`; writes `parity/report.json` in the project's `parity` folder, shown on the docs site's Parity › Tokens, Properties and Visual pages: the design's variables, text styles and effects against the library's generated token files (effects matched by what they draw), each design prop against the code prop that does its job, joined by rule (the same words, less a trailing "text", a shared vocabulary, an enum the code accepts) against the component's API read from its own types through what it extends down to its framework's (the library's `framework` profile, audit-defaults `frameworks`; the platform's props and the shared vocabulary are audit-defaults `codeProps`), with the map overriding only what the rule cannot know (a value spelled differently), and what each element draws. A colour written differently that draws the same over what is behind it is reported apart from a real difference. Tested by `test-external.mjs`. |
| `adapt.mjs` | Figma, translated once: a variant or frame plus its mapping in, expectation documents resolved for the tier out (`adapt`), what the probe must read for them (`plan`), which mapped layers a sibling variant draws an effect or stroke on (`carriers`), and gate 10's declaration of every spec key (`SPEC_KEYS`) with its check that a declared rule is actually read (`unreadRules`). A token, style or paint it cannot resolve is an `unresolved` row, never a skip |
| `layers.mjs` | Which node a mapped path names: exactly the layer at that path as the store spells it (`Content > Label`, `Aside#2`), or `$root`; nothing looser resolves (`layerAt`, `layerIndex`, `pathOf`) |
| `probe.mjs` | What is read off a rendered element, in the page: the props a plan asks in CSS's names (`width`/`height` the border box, an unset gap `0px`, `-stacking` and where children sit `-place-h`/`-place-v` read off the children's boxes, `-clipped`, the focus ring as drawn `-ring-*` and a ring inside the box `-inner-ring-*` (each with how it is drawn, `-ring-drawn`: an outline, whose width Chrome snaps, or a shadow, whose spread it reports as written), whether an edge is drawn `-stroke`, how text is cut on purpose `-max-lines` `-truncate`, the words `-text`, whether an element puts anything on screen `-rendered`), and with `core` the fixed record a baseline compares, positions document-relative; `measure` reads twice and names what moved |
| `hosts.mjs` | How a page is put on screen for the probe and refused when it did not take its tier or args: `storybook` (one story a page), `app` (the running product at a route, signed in), `fragments` (a site's component fragments many to a page, served at its own origin); `drive` puts a page in the state its frame draws (fill, click, scroll the window or the panel that scrolls) |
| `diff.mjs` | The one differ: expectation documents against measurements, one judged row per assertion keyed `Layer.prop`, waivers applied, a layer drawn where the design draws none reported as `-present`, an expectation the adapter could not resolve as `unresolved` (`diff`, `BAD`) |
| `schema.mjs` | What the differ can judge: the closed table of kinds and their comparators (`KINDS`, a few reading across the record or the layers: a radius against its box, a position against its measured ancestor, an instance's attributes and children), and of props a waiver key can name (`PROPS`) |
| `parity-report.mjs` | `saveReport`: the one writer of the saved per-component verdict a docs site or dashboard reads |
| `spec-keys.mjs` | Gate 10: every key a spec records is declared as compared or excused (`checkContract`, `checkDeclarations`, `REASONS`), and no excuse outlives its key in every registered project's snapshot (`staleExcuses`, `corpusOf`; a registered repo not on this machine is a note) |
| `waivers.mjs` | Gate 6: a waiver's shape (`checkWaiver`: an owner, a bound on a number, no field nothing reads), how it excuses a difference and when it is stale, across every target that declares it (`asWaiver`, `excuses`, `stale`, `staleAcross`, `keyParts`); an app waiver's `*` expanded onto a render (`appWaivers`) and each waiver's largest excused difference per target (`recordExcused`) |
| `shots.mjs` | Pictures, advisory: a page as the run left it (`take`), against the set the last accepted run kept (`compareKept`, `keep`), and a screen beside its frame's own picture by region with the contact sheet (`frameCells`); PNGs read and written with zlib alone (`png`, `encodePng`, `pixelDiff`) |
| `pages.mjs` | Three gates over a project's own pages that no frame measurement sees, from `parity.pages`: `axe` (axe-core's WCAG 2.2 A and AA rules, through `tools/ui-check/axe.mjs`; `parity.pages.axe.disable` rules a rule out), `structure` (one `<main>` holding the one `<h1>`, heading levels that never skip, unique ids, named landmarks, aria references that resolve) and `overflow` (a box drawn outside the box meant to hold it, at the widths between the frames too); `node tools/parity/pages.mjs --repo <dir> structure [path]`, or `overflow` |
| `baseline.mjs` | Gate 12: this run's measurements against the last accepted run, in exact numbers, and each waiver's largest excused difference per target beside them |
| `measurements.mjs` | `unstable`: two passes of one render compared, naming layer, property and both values |
| `values.mjs` | Parsing what a browser reports (colour in every spelling Chrome uses, `oklab()` included; shadow, gradient) and a Figma style name's CSS weight (`figmaWeight`, over `WEIGHTS`, the DTCG aliases, and back with `weightName`): the toolkit's one reading of each, which the code audit, the contract tools, the editor and the docs MCP import and the sandbox scripts copy under test; what counts as equal is `schema.mjs` |
| `same-as.mjs` | "Same as…": a design prop and a code prop a person pairs where the code renamed it and no rule could tell (`node tools/parity/same-as.mjs --project <label> <component folder> <design prop> <code prop>`), written into a compared library's mapping JSON as its `props` entry, values it held kept; a governed repo's parity.mjs is code, so the line to add is said instead. Parity › Properties offers each pair as a command to copy, on a design prop joined to no code prop (not checked, or only in Figma) beside the code props joined to nothing. Tested by `test-same-as.mjs` |
| `lessons.mjs` | toolkit-standard §D 8's trigger: what a project rules anew — the mapping's waivers, decisions and `'unset'` rulings, and the stylesheet comments that explain a deviation from the design (`deviations`, under `parity.stylesheets`) — listed when a run is accepted as lessons to triage (`lessons`), one line per ruling however many targets share it, with a toolkit candidate where another registered project rules the same property in the same words; the index of what was listed is kept with the accepted suites (`lessonsIndex`); an accept with lessons is refused until `--triaged "<where>"` says where they went (`triage`) |
| `timing.mjs` | Where a run's time went: every phase timed, per run and per target (`timer`), printed (`summary`) and saved beside the measurements as `timing.json`; the accepted run's time is kept with the accepted suites — the faster of what was held and the run's own, so an accept made under load does not raise the bar (`keep`) — and a full run more than a quarter slower on the same scope — a full run's scope names its target count (`scopeOf`), so a library that grew is a new reference, not a slowdown — prints a warning naming the phase that grew (`slower`); a warning, because machine load varies |
| `run.mjs` | The run, the CLI each project's `bin/parity` execs: `node tools/parity/run.mjs --repo <dir> [target …] [--accept [--triaged "<where>"]] [--shots[=<dir>]] [--gates]`. Every gate, then every variant each mapping renders, in every tier, measured and judged; the verdict saved through `parity-report.mjs`, the measurements held to the accepted run (`baseline.mjs`). A word names a target (its name or folder) or else its family (a mapping module's folder, a screen key before `--`: `contact` is every `contact--…` state) and scopes the run; a scoped run judges no backlog and accepts no baseline. Its summary counts one row per assertion per render; the same specs judged again on the running app beside their stories are counted on a line of their own (their reds are in the total), so a join of every judged row (`PARITY_ROWS`) sums more than the first line. A full run fails a bound wider than the difference it excused on its target (`looseBounds`) `--gates` runs only the gates no browser answers; `--shots` adds the pictures (`shots.mjs`), and with `--accept` keeps them. An option it does not know is refused, and so is a run with nothing to measure |
| `project.mjs` | A project as the engine reads it (`loadProject`): its `parity` facts, refused at load where one a run needs is missing (`checkFacts`), its snapshot and library, and every mapping, from either spelling (`axes`, or a `variants` list with the state and disabled siblings its `parity.variants` describes), as one target shape with what each variant renders (`expand`) and what no mapping renders (`unrenderedOf`); a screens file's `base` chain (`resolveBases`) |
| `session.mjs` | A project's pages, up: the story build made once per change and served, the running product started where it is not up and signed in, one browser with its windows pooled (`session`); a screen opened at its frame's window and driven into the state its mapping names (`screen`, `drivePage`, `screenWindow`, `scrollFor`). The run uses it, and so does a project's own tool that wants a page as the run sees it |
| `gates.mjs` | Every gate, as functions of the project and of what a run read: waivers (6, at load), variants (3), backlog (2, with `RUNNER_CANNOT`), `codeOnly` (4), literals (5), overrides (18, 27), layer coverage of screens and components (8, 13), spec keys (10), stale mappings, the copy, DOM coverage (`DOM_COVERAGE`, run in the page), and what a project leaves off (`configured`, notes, never findings). `node tools/parity/gates.mjs --repo <dir>` runs the ones no browser answers |
| `serve.mjs` | The static server a run serves a built story tool from, in its own process on a port the system picks |
| `../shared/cdp.mjs` | The Chrome DevTools client every browser run drives (moved to [tools/shared](../shared/README.md), since ui-check, the docs checks and the contract tools use it too): `launch`, `newPage`, `navigate`, `findChrome` and the rest. |

Tests sit beside them as `test-<module>.mjs`; the toolkit's `bin/check` runs
them by discovery, and a project's own check does not run them again (they
read nothing in a project). `../shared/test-cdp.mjs`, `test-probe.mjs` and
`test-hosts.mjs` need Chrome and print SKIPPED without it.

The environment: `CHROME` is the browser (default the macOS install path);
`PARITY_WORKERS` the windows measured at once (over `parity.workers`, default
8); `PARITY_APP_PORT` moves the running product to another port, for a second
checkout beside the first; `PARITY_ROWS=<file>` appends every judged row, per
render, as JSON lines — what a reconciliation between two runs joins on. `PARITY_HOST_BASE` points a host that serves the components (fragments) at a second checkout's server, as `PARITY_APP_PORT` moves the app, so an eval's copy is measured and not the first checkout.

## Fast by default

Speed is part of the run's contract (toolkit-standard §D 0's third question,
whose evidence is this engine's own six-fold slowdown of 2026-10-02: a settle
waiting its 5 s cap on lazy pictures the browser never loads, twice a render,
unnoticed by three reviews). What holds it now:

- **Every run prints and saves its time per phase and per target**
  (`timing.mjs`), and a full run slower than the accepted one by more than a
  quarter says so, naming the phase that grew. A project's check prints the
  `time:` line; read it when a push feels slow.
- **Waits are on signals, bounded**: fonts ready, the pictures the browser is
  loading (an eager one, or a lazy one within Chrome's own reach below the
  fold — never one past it), two frames painted, a quiet DOM (100 ms, capped at 3 s),
  a route's shell present. A fixed sleep is a defect; the two left in `drive`
  (150 ms after a click or a scroll) are each a candidate for a signal.
- **One browser, one server, one build a run**: the story build is reused
  while the hash of its inputs is unchanged (`session.mjs`), the product is
  started once and signed in once, windows are pooled (`parity.workers`,
  default 8, `PARITY_WORKERS` over it). The one cache is the story build, keyed
  on a content hash of its inputs (`session.mjs` `inputsHash`), never a
  timestamp; `test-session.mjs` fails if a changed byte reused it.
- **Pictures are opt-in**: `--shots` takes them and compares them with the kept
  set, `--accept --shots` keeps them; nothing gated reads them, so a project's
  check runs without them.
- **What a project must not do to stay fast**: make the run wait for content
  the frame does not measure (an animation that never ends, a resource that
  never answers, a route behind a slow query — pin the content and serve it,
  as Project C's fixture does); run the full suite after every edit
  (scope with a target or a family, accept once); keep a picture step on the
  pre-push path.

## What a project supplies

Its facts, and nothing else: where its things are, which layer is which
element, how its pages are served, its tolerances, its waivers. What a Figma
property means in CSS, how it is read, judged, gated and reported is here.
The facts live in the `parity` block of its `snapshot.config.json` and in its
mapping files:

Required (refused at load, by name, when missing): `mappings`, `host` with
its kind's facts, `tiers`, and `app.base` and `app.shell` once any mapping
names a route.

| Key | What it says | Examples from two projects |
|---|---|---|
| `mappings` | where the mappings are: a `module` glob (one `*` = the folder), a `command` printing JSON, or a `json` file of screens with `base` chains | `src/design-system/*/parity.mjs`; `php tests/parity/stories.php`, `tests/parity/screens.json` |
| `host` | how components are put on screen: `storybook` (`frameGlobal`, and `build.run` + `build.inputs`, or `base`; the tier global is `paths.storybook.themeGlobal`), `fragments` (`base`, `url`, `stylesheets`), or `app` where every mapping names a route (the facts are `app`'s) | |
| `app` | the running product a route is measured on: `base` (`{port}`), `port`, `start`, `env`, `ready`, `session` (a command printing the cookie) and `cookie`, `shell`, `login`, route `params`, and `prefix` for an app with its tenant in the address (`page` it lands from, `pattern` whose first group is the prefix, `except` routes with none) | a Next app on :3000; a PHP site over pinned content on :8643 |
| `tiers` | the tiers, as the adapter names them (a page's `data-theme` is the lower-cased name); the first is the tier the frames are drawn in | `["Dark", "Light"]`, `["light", "dark"]` |
| `window`, `breakpoints`, `typeTiers` | a component's default window; a breakpoint variant's window; the type scale's tier for a window | `[1280, 1400]`; `{ "axis": "Breakpoint", "windows": { "sm": { "atMost": 402 } } }` |
| `variants` | for list mappings: the state axis's resting value and each value's pseudo-class, the disabled axis and the control that sets it; and the name of a focus ring Figma draws as a layer (`focusRing`: the gate maps it and the adapter reads it as a ring by this name alone) | |
| `tolerances` | per assertion kind, exact where a kind is not named | `{ "length": 1, "colour": { "channel": 1, "alpha": 0.01 } }` |
| `position`, `children`, `instance`, `canvas` | what the adapter asserts beyond the design's own properties (opt-in: where a layer sits, the library instances a layer holds), the custom element a library component renders as, the token prefixes that name a frame's window | |
| `props` | an instance's variant props asserted as the attributes of the element it renders (opt-in): `rename` (a prop's attribute name), `skip` (the axes the control answers another way: a pseudo-class, an attribute, a media query), `swap` (the element a swap places, or a list of them, whose glyph is its `data-name`), `label` (`{ prop, placeholder }`: the text prop that gives an instance its words, and the stand-in that constrains nothing) | `{ "rename": { "Role": "variant" }, "skip": ["State"], "swap": "icon", "label": { "prop": "Label text", "placeholder": "Label" } }` |
| `dom.opaque` | what draws as one layer, its insides unmapped | `ds-icon, ds-graphic` |
| `backlog` | the file of what is drawn and not measured, with why; `_code` for component folders with no spec | |
| `baseline` | where the measurements and the accepted set live, and the fields that are not measurements | `{ "dir": "…/measured", "volatile": { "components": ["self", "anc"] } }` |
| `workers` | windows measured at once (default 8) | |
| `stylesheets` | the folders whose stylesheet comments `--accept` reads for a deviation from the design (lessons.mjs) | `["src/design-system", "src/styles"]`, `["assets/design-system"]` |
| `pages` | the project's own pages the structure, axe and overflow gates open (`pages.mjs`): `base`, `paths`, `find` (a selector on the front page whose first link adds that page and its parent), `overflow` (`widths`, `waivers` as `{ child, parent, why }`) | the PHP site's dev server, eight pages at six widths |
| `shots` | where `--shots` leaves its pictures, the kept set (`kept/`) and the contact sheets (`frames/`) | `tests/parity/shots` |

A mapping says, per component or screen: which element each layer is
(`layers`, or `nodes`; `root`), what each variant is (`axes` or a `variants`
list), which element takes the states (`state`, an axis rule's `on`), the
story or the route that renders it (`storyId`, `route`), the page state a
frame draws (`page`: `fill`, `click`, `scroll` in px, `'end'` or a frame
layer, `scroller` naming the box that scrolls when it is not the window, `focus`, `height`), and its excuses, each with why: `waivers`,
`appWaivers`, `unmeasured`, `codeOnly`, `literals`, `overrides`, `excluded`,
`content`. A waiver is `{ reason, fix: 'figma' | 'code' }` — who closes it —
or `{ reason, content: true }` (live data) or `{ reason, decision: true }` (a
ruled translation), one owner only, and on a number it says how far it
excuses (`within`, a finite number: the difference measured when it was
written, on the target that declares it — a full run fails one wider than
what it excused there, and `--accept` records each one's largest difference
per target). A decision on a number without a bound excuses a keyword only,
so a page that sets nothing is `{ reason, decision: 'unset' }`, which excuses
exactly 0 or a keyword on a padding, a gap, a min- or max- size, a line
height or a letter spacing, on a key that names its prop. A bound or an
`'unset'` ruling that nothing used in a full run is stale whoever owns it;
only `appWaivers`, against live data, keep the exemption. A `*` in a key is
read in `appWaivers` only. The `waivers` gate refuses any other shape at
load, and any waiver whose layer no variant or frame draws; an `unmeasured`
excuse is a reason or `{ reason, fix }`, and an `overrides` reason no frame
needs is stale.

A project keeps its build-and-serve facts here rather than in a wrapper:
`bin/parity` is a few lines that exec `run.mjs`, as `bin/tokens` execs
`tools/tokens/build.mjs`.
