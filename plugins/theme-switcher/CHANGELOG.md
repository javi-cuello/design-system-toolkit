# Changelog — theme-switcher
## [3.11.2] - 2026-10-31
### Fixed
- **The README said Clear is disabled with an empty selection.** Only Apply is; Clear is the page-wide reset and works with nothing selected, as the README's own account of it and the panel's note say.
- Merged with the focus-ring release below; nothing of either changed.

## [3.11.1] - 2026-10-31
### Fixed
- **Focus shows as a ring.** The shared baseline (ui-base v3) gives a focused input or select a 2px ring under the keyboard; a border colour alone was the only sign (WCAG 2.4.7, 1.4.11).

## [3.11.0] - 2026-10-25
### Added
- **Brands kept as modes of one collection can be switched.** A file whose brand collection carries modes `A` and `B` offered no brand at all: those names are not shared, so they are not a theme, and there is no extension to make a brand row. Any collection with modes to pick that the theme does not cover is now its own row, under the collection's name, and Apply pins the mode picked there. The test now builds both shapes, modes and extensions, and checks the rows each produces.

## [3.10.1] - 2026-10-08
### Changed
- Comments cite the standard that owns each rule (skill-standard §B 4 for the ui-base block).

## [3.10.0] - 2026-09-25
### Added
- **A Tools entry.** *Switch theme or brand* now sits in the right-hand panel beside the other plugins' entries, so it is reachable without the plugin menu. The relaunch data is written once rather than on every run: the write is a document edit, and a file nobody touched should not show one.

## [3.9.0] - 2026-09-25
### Added
- **A row switches to a select past three options.** Four segments in a 300px panel get about 65px each, which truncates any real brand name, and the brand list is the one here that grows. Up to three it stays segmented, which is faster to hit and shows every option at once. Exercised by running the real `render()` against a DOM stub with two brands and with five: buttons, then a select carrying five options with the current one marked.

## [3.8.0] - 2026-09-25
### Fixed
- **Clicking a button in the panel took seconds to respond.** `model()` runs on every selection change, and it re-walked the whole current page and re-resolved every pinned collection id each time. Both are cached — the page walk per page, invalidated by a write or by stepping onto another page; the collections for the session. Repeat models: **seconds → 2ms**.
- **The brand read the brand collection and only became `Project A` later, or not at all.** Two faults. The instant pass cannot afford the derivation, so it showed the collection's name until the full pass replaced it; the derived name is now remembered in the file (`themeSwitcherBrandNames`), so every open after the first is right immediately. And in a *consuming* file the derivation found nothing at all: a remote collection's `variableIds` under-reports and is routinely empty, which is exactly the case the name exists for. It falls back to listing the collection's variables through the team library and importing a few.

## [3.7.0] - 2026-09-25
### Fixed
- **Clear could not remove a brand pin at all.** `clearExplicitVariableModeForCollection(extension)` silently does nothing — no throw, no change — and the pin only goes when the **parent** collection is passed instead. Traced on a live frame: set parent → one entry; set extension → the entry becomes the extension's; clear extension → unchanged; clear parent → empty. Caught by a regression run, not by review: Clear was reporting six pins removed while one remained and the canvas kept its brand. Leftovers are now counted from what is actually still on the node, because the call that does nothing does not throw.
- **Dragging the plugin window stuttered.** `loadAllPagesAsync()` keeps every page in memory for as long as the plugin is open — the cost `documentAccess: dynamic-page` exists to avoid. Other pages are now hunted one at a time, only when nothing already known is an extension, stopping at the first one found, and `figma.skipInvisibleInstanceChildren` is set before any traversal (§B 3, which this plugin was not meeting). Full pass on the 28-page library: **4.6s → 1.2s**, and a file that already remembers its brands reads no other page at all.

### Changed
- Refactor: `collections()` returned `{collection, source, library}` and nothing had read `source` or `library` since the per-collection row list was replaced in 3.0.0. It returns collections.

## [3.6.0] - 2026-09-25
### Fixed
- **Clear still missed the pin that mattered.** 3.5.0 walked the selection's subtree, which still excludes the page node — and the page is precisely where versions 3.0.0–3.1.0 wrote pins when nothing was selected, so the pin a reader most wanted gone was the one Clear could not reach. Clear is now the reset button: the current page and everything on it, whatever set the pins, and it no longer needs a selection. Verified live on a page pin, a frame pin and a nested pin at once: 3 removed, 0 left.
- **The buttons kept the old pick after a Clear.** The UI preserves what you have chosen across the messages that arrive while it works, and that guard applied to Clear too, so the panel went on showing a brand nothing was pinned to. Clear drops the remembered picks and takes the fresh state.
- Spacing between the buttons and the line under them.

## [3.5.0] - 2026-09-25
### Fixed
- **Clear left the canvas exactly as it was.** It cleared the selected layer and stopped, but a pin on a nested frame overrides the one above it, so the screen did not move while the plugin correctly reported success. Clear now walks the whole subtree, counts what it removed, and says when a pin could not be removed at all instead of swallowing it — the id-string form of `clearExplicitVariableModeForCollection` throws (`… with a collection id in incremental mode`), so a collection that no longer resolves has no route left.
- **The theme and brand buttons lagged.** Every click re-rendered the panel, which re-measures and asks the main thread to resize; the press is painted directly now and the round trip is gone.

### Changed
- **The base brand is called what it actually is.** the brand collection names the collection's job, not a brand, which read as a category sitting beside `Brand B`. Its tokens alias primitives called `Colour/Brand/Project A/Primary/5`, so the name is in the file one level down: a sample of the parent's variables is followed to its aliases and the segment after `Brand/` is tallied. Live: **Project A**. Falls back to the collection's name, then to "Default".

## [3.4.0] - 2026-09-25
### Fixed
- **The buttons were cut off.** The window asked for a fixed 232px while its height is really a function of how many rows the file offers, and stacking Apply over Clear pushed the bottom past it. The UI measures itself after every render and asks for the height it needs.
- **Clear looked like a second Apply.** ui-base drops a secondary button's border when it is disabled, so in the state the plugin opens in — nothing selected — both buttons were identical grey blocks. Clear is outlined and quiet in both states now.

## [3.3.0] - 2026-09-25
### Fixed
- **Every `figma.teamLibrary` call was throwing.** The manifest never declared `"permissions": ["teamlibrary"]`, so each call failed with `"teamlibrary" permission not specified in manifest.json` — and `within()` caught the rejection and returned an empty list, so the plugin reported "no library collections" rather than an error. Three versions and two live test runs missed it; Figma showed the error on screen in a third file. The permission is declared, and `within()` now reports the first error it swallows via `figma.notify`, once per message.
- Bound in the toolkit rather than here alone: `toolkit-standard` §B 2 makes `permissions` required when the code needs one (Part B 1.8.0), `standards/tests/check.sh` errors on a plugin calling `figma.teamLibrary` without it (case P6, walked both ways), and `figma-plugin-creator`'s conformance checklist §1 gains the grep.

### Changed
- Apply and Clear are stacked, Apply on top, each full width.

## [3.2.0] - 2026-09-25
### Fixed (all three reported from real use, none caught by a live test here)
- **The window sat blank for seconds.** Both slow sources memoised their *result*, and the variable was set before the work finished — so the UI's own first request arrived mid-flight, saw a warm cache, skipped the instant path and waited out the full pass behind it. They memoise the promise now, and the fast answer goes out at 0ms with two callers racing.
- **Apply worked with nothing selected, and did nothing.** The target fell back to the page, which every frame below it overrides with its own pin: "Applied to 1 layer", no visible change. There is no page fallback now; Apply and Clear are disabled on an empty selection and the note reads *Select a layer*.
- **Picking a brand appeared to do nothing** — the same defect seen from the other end, since the brand pin landed on the page and was overridden.

## [3.1.0] - 2026-09-25
### Fixed
- **No Brand row in a consuming file.** Discovery scanned the current page, so a file whose brand is pinned on some *other* page offered no brand at all — reported from a real file within minutes of 3.0.0 shipping, and not caught here because the library it was tested in holds its collections locally. The walk now covers the whole document (2.0s on a 28-page, 17k-node file, once per open, after the window is drawn), and the base brand is the *absence* of an extension pin rather than the parent collection, so the row survives a parent that cannot be resolved from a consumer.

### Added
- **Clear**, beside Apply: every mode pin off the target, including ones this plugin never set. Not the opposite of Apply — a stale pin from a library that reorganised its modes is what it is for. It was in v1, dropped in 3.0.0 on the reasoning that choosing a brand clears the others; that covers the brands and nothing else.

## [3.0.0] - 2026-09-25
### Changed
- **Two controls, not a list.** v1 matched collections and modes by name — `Primitive - Colour`, `light`, `brand a` — one project's arrangement written into a tool every project uses; the day that project moved its brands into an extended collection the plugin could neither see them nor set them, and said nothing, because names simply stopped matching. v2 (below, same day) removed the names but replaced them with the raw truth: every pinnable collection, every mode, one row each. That is a mode inspector. Setting a theme by hand across four collections is the work this plugin exists to remove, so this version reads the shape instead of listing it — **Theme** is a mode name two or more multi-mode collections share, **Brand** is the extension family plus the parent it extends, and Apply does both at once. Still no names: in the library it was built against, that resolves to `Light`/`Dark` and the brand collection/`Brand B` with nothing hardcoded.
- **Scope is implicit**: the selection, or the page when nothing is selected, stated under the button rather than chosen in a control. *Clear* is gone as a separate action — choosing a brand clears the ones you did not choose, which was what it was for.

### Fixed (each found by running this code against a real library, not by review)
- **The window never filled.** `getVariablesInLibraryCollectionAsync` did not come back for one subscribed collection — 6.9s, twice, against 1ms for its neighbour — so an awaited discovery pass simply hung. Every team-library call is now raced against a timeout, the phase is capped at 3s and resolved once per open (4.1s first, 2ms after), and local collections plus the file's own pins render before the library is asked.
- **Nothing read back as pinned.** A collection resolved through an imported variable carries a different id from the one Figma writes on a node — `…/1233:2790` against `…/1225:1037` — so whole-id comparison reported an unpinned layer that was plainly pinned. Every comparison uses the key.
- **Extensions never appeared.** Importing a variable to resolve a library collection lands on the parent, since an extension exposes no variables of its own. They are discovered from pins instead, and remembered in `figma.root` pluginData so a brand does not vanish on a page that does not pin it. Constructing `VariableCollectionId:<key>` as a way round this was tested and returns `null`.

### Verified
- On a temp frame in the live library: no pins → Dark + Brand B pins `Primitives - Colour` `Dark`, `Semantic` `Dark` and the `Brand B` extension, and reads back as Dark/Brand B → Light + base brand swaps the extension pin for the parent's and reads back as Light/base. Frame removed.

## [2.0.0] - 2026-09-25
Superseded by 3.0.0 the same day; its account is folded into the entry above. The version existed: it removed v1's hardcoded names and added extension support, a Selection/Page scope control and a Clear button.

## [1.2.1] - 2026-09-16
### Fixed
- **Secondary buttons turned brand-blue under the pointer.** ui-base's `button:hover` (0-1-1) beat `.btn-secondary` (0-1-0), so every secondary button in the plugin took the primary hover — the collision §4 of the plugin standard warns about, on a state rather than on sizing. Fixed in the canonical `plugins/_shared/ui-base.css` and re-inlined (block is now **ui-base v2**), so it is fixed for every plugin at once rather than patched here.

## [1.2.0] - 2026-08-09
### Fixed
- **The inactive half of the Appearance toggle flashed brand purple on hover.** `.toggle-btn:hover` declared `color` only. It is more specific than ui-base's `button:hover`, but since it never declared `background`, that property resolved between `.toggle-btn` (0,1,0) and `button:hover` (0,1,1) — ui-base won. The active half was spared only because `.toggle-btn.active` outranks both, which is why this read as a quirk rather than a bug.
- **Disabled buttons were double-dimmed.** `.btn:disabled` set `opacity: 0.4` and declared neither background nor colour, so ui-base's `button:disabled` tokens applied underneath and the opacity stacked on top. Now uses `--figma-color-bg-disabled` / `--figma-color-text-ondisabled` directly, which is skill-standard §B 4's stated treatment.

### Changed
- `.btn` and `.toggle-btn` declare explicit `height` + `box-sizing`, matching what they previously inherited from ui-base's bare `button,.btn` selector. No visual change — §4 requires the override even where the inherited value already matches, because a rule reading `padding: 9px` with no height implies the padding sets the size, and it did not.
- Conformed to skill-standard §B v1.5.0 (was v1.1.0, three minor versions behind: the collision-safety rule arrived in 1.2.0 and its state half in 1.3.0). **The `standard v1.1.0` stamp in `code.js` was accurate the whole time and nothing read it** — these defects are exactly what it was pointing at.

## [1.1.0] - 2026-08-05
### Changed
- ui-base v1 inlined (mandatory per skill-standard §B v1.1.0).
- **Fixed:** :root previously hardcoded a fixed dark palette (#1e1e1e etc.) with no Figma tokens at all, so the UI never matched the user's actual theme. Now fully retokenized onto --figma-color-* variables.
- code.js: added themeColors: true to figma.showUI (was missing — no tokens were reaching the UI before this fix). Bespoke rules (toggle buttons, spinner) preserved.

## Unreleased
### Added
- tsconfig.json + // @ts-check (no-build type-checking) -- was declared in package.json's devDependencies but never actually wired up. Found during the lucide-icon-importer full-review session; same fix applied here for consistency across the toolkit.

## [1.0.0] - 2026-08-05
### Changed
- Conformed to skill-standard §B v1.0.0: manifest gains `documentAccess: "dynamic-page"` (code verified async-clean first), explicit `networkAccess`; added package.json versioning, this changelog, README. Plugin logic untouched.
