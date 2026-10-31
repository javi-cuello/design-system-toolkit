# Changelog — lucide-icon-importer
## [1.11.4] - 2026-10-08
### Changed
- README records how a full Lucide set is laid out (first category, moved not rebuilt, one grid frame per category) and two Figma behaviours a re-sort works around.

## [1.11.3] - 2026-10-08
### Changed
- Comments cite the standard that owns each rule (skill-standard §B 4 for the ui-base block).

## [1.11.2] - 2026-10-03
### Fixed
- **A failed icon spent all its retries within milliseconds.** The retry re-observed the card at once, so against a rate-limited CDN every attempt failed the same way before the limit had lifted. It now waits 500ms × the retry number before re-observing. Copied from figma-plugin-creator 1.10.1's `assets/fetch-queue.js`; `tests/test-ui-fetch.mjs` holds the copy to it.

## [1.11.1] - 2026-10-03
### Fixed
- **A card still on screen never retried a failed icon.** The retry called `observe()` on a card that was still being observed, which the IntersectionObserver spec makes a no-op, so the retry waited until the card was scrolled out of view and back. It now unobserves first.
- **A fetch that failed at once kept its queue slot.** After six of them the queue stopped for good and no further icon loaded.
- Both came from this file carrying its own queue and retry. It now carries figma-plugin-creator's `assets/fetch-queue.js`, the house pattern, as a copy that `tests/test-ui-fetch.mjs` holds to the source. Found while that pattern was moved out of the skill's prose, where the same two bugs sat.

## [1.11.0] - 2026-09-24
### Added
- **A test suite, the plugin's first** (`tests/test-importer.mjs`, 19 assertions). It loads the shipped `code.js` against a fake Figma whose nodes record what was done to them, so the functions under test are the real ones rather than copies. Each of the four defects fixed today was re-broken in turn and the suite named the right one every time; a case that throws is reported as a failure instead of crashing the run.

### Fixed
- **A path carrying both a fill and a stroke lost its interior.** Only the outlined stroke survived, so Lucide's `palette` and `tag` — whose accent dots are tiny filled circles under the inherited stroke — imported as rings with a hole. The interior is now cloned out before the stroke is outlined and the union puts the two back together. Verified by re-importing both into a live library.

## [1.10.2] - 2026-09-24
### Fixed
- **An SVG containing a path with no stroke could not be imported at all.** The non-stroked branch kept the child and then removed the group it still belonged to, so the union ran against a deleted node and the import died with "The node with id ... does not exist". Every Lucide icon inherits a stroke from the root `<svg>`, so the branch had never run on one — it ran the first time a custom filled glyph was imported, and took the whole import with it. The child is now moved to the page before the group goes.
- **A one-shape glyph failed the same import.** `figma.union` refuses a single-node list; `flatten` takes it directly. A custom icon is usually exactly this: one filled path.
- Known and not fixed here: a child carrying both a fill and a stroke keeps only its outlined stroke, because fills are cleared before the union. Lucide uses this for the small solid dots in `palette` and `tag`, which import as rings rather than dots.

## [1.10.1] - 2026-09-24
### Fixed
- **The stroke weight setting did nothing.** It was normalised, stored, restored into the Settings field and never applied to anything: the SVG went into `createNodeFromSvg` exactly as Lucide serves it, so a library asking for 1.5 got Lucide's 2 and nothing said otherwise. Found by reading the code while scripting a 155-icon import, not by a report — a setting that silently ignores you leaves no symptom to report.
- The weight is now set on each stroked path before `outlineStroke()`, because after that call the thickness is geometry and no setting can reach it. Measured on `plus` at 24px: weight 1 gives a 15.0 master, 1.5 gives 15.5, and 2 (the default) gives 16.0 — the value every icon imported before this already has, so nothing in a library moves.
- Updating an icon imported before the fix leaves its weight alone unless the setting says otherwise.

## [1.10.0] - 2026-09-24
### Added
- **Paste a list.** A collapsed field under the search bar takes names separated by commas, spaces or newlines and selects them all at once, on top of whatever is already selected. Added because selecting by clicking does not scale: a library's second icon pass was 155 names, which is 155 cards to find and click, and the search box can only filter to one substring at a time.
- The parser takes what a person actually has to hand: kebab names as the CDN serves them, and React import names (`ChevronsUpDown`, `ArrowUpRight`) converted to kebab. Seven parser cases walked, including quoted and trailing-comma forms.
- Names Lucide does not carry, and names the target frame already holds, are **counted and named in the status line** rather than dropped. A half-applied paste that says nothing is how a set ends up missing icons nobody notices. Renamed icons (`Loader2`) are not mapped to their current names — they surface in the not-in-Lucide list, which is the honest answer rather than a guess.

## [1.9.1] - 2026-09-16
### Fixed
- **Secondary buttons turned brand-blue under the pointer.** ui-base's `button:hover` (0-1-1) beat `.btn-secondary` (0-1-0), so every secondary button in the plugin took the primary hover — the collision §4 of the plugin standard warns about, on a state rather than on sizing. Fixed in the canonical `plugins/_shared/ui-base.css` and re-inlined (block is now **ui-base v2**), so it is fixed for every plugin at once rather than patched here.
- Its own `.btn-secondary:hover` override goes with it: a local patch for a shared gap is the duplication `_shared` exists to prevent.

## [1.9.0] - 2026-08-06
### Added
- **Multi-select icons.** Click toggles an icon in/out of a selection set (no modifier key needed) instead of replacing a single selection. Selections persist across searches -- pick some from "arrow", search "circle", pick more, then Add all of them together. Preview panel shows the familiar single-icon view when exactly one is selected; 2+ shows a count and "Ready to add" once every selected icon's SVG has loaded. The Add button label updates ("Add icon" / "Add 3 icons") and stays disabled while any selection is still loading. If some selected icons failed to load, Add proceeds with whichever succeeded rather than blocking the whole batch.
- code.js: new `ADD_ICONS` message (replaces `ADD_ICON`) takes an array and loops the existing, unchanged `addIcon()` once per item in order -- insert-alphabetically logic already re-reads the frame fresh each call, so order stays correct with no new logic. Reports back one summary (`ADD_ICONS_RESULT`) with per-icon success/failure.

### Fixed
- Separator-agnostic search: typing "alert circle" (space) now finds "alert-circle" (hyphen) -- names/tags and the query are both normalized (hyphens/underscores -> spaces) before matching. Previously a literal substring match, so the extremely common habit of typing a search with spaces instead of kebab-case silently found nothing.
- `renderEmpty()` had a leftover reference to the old (now-removed) `selectedIcon` variable -- would have thrown a ReferenceError on any zero-result search. Also stopped calling `resetPreview()` there: a temporary "no results for this query" state must not clear selections made from a different, earlier search now that selection persists across searches by design.

## [1.8.0] - 2026-08-06
### Added
- `tsconfig.json` (no-build type-checking via `@figma/plugin-typings`) and `// @ts-check` as code.js's second line -- was declared as a devDependency in package.json since the first conformance pass but never actually wired up. Found during a full-file review; same gap existed in component-graph and theme-switcher, fixed there too.
### Fixed
- Removed a redundant `box-sizing: border-box` declaration in ui.html's bespoke reset block -- ui-base already sets it globally; kept the margin/padding reset the bespoke rule also provided.

## [1.7.0] - 2026-08-06
### Added
- Icon grid placeholders now pulse gently while loading, instead of sitting as static grey squares -- a clearer, more familiar "this is loading" signal (the standard skeleton/shimmer pattern), and better perceived performance while icons stream in. Pure CSS, no JS touched: same markup, same loading/retry/failed-state logic, just an animation on the base placeholder. Explicitly disabled (animation: none) on the terminal "failed, click to retry" state, so a stopped card doesn't visually claim to still be working.

## [1.6.0] - 2026-08-06
### Fixed — 1.5.0's fix was incomplete
- After deploying 1.5.0 (pinning the version to remove the @latest redirect), a live console log showed the DIRECT, non-redirected request was STILL CORS-blocked, now with "net::ERR_FAILED 500 (Internal Server Error)" alongside it. This means unpkg.com's CDN rejects requests from a null origin outright (what a Figma plugin UI sandboxed iframe always sends) -- independent of any redirect. Pinning the version was necessary but not sufficient.
- Switched both fetch URLs (icon list + individual SVGs) from unpkg.com to jsdelivr's npm CDN (cdn.jsdelivr.net/npm/lucide-static@...), which documents unconditional `Access-Control-Allow-Origin: *` on every response, specifically for cross-origin cases like this. Added cdn.jsdelivr.net to manifest.json's networkAccess.allowedDomains (unpkg.com left in place, unused by fetch code now but harmless to keep listed). Still version-pinned via the same LUCIDE_STATIC_VERSION constant, for the same predictability reasons as 1.5.0.
- Not independently verified against a live jsdelivr response before this release -- neither CDN is reachable from the environment this was built in. This needs a real test in Figma to confirm.

## [1.5.0] - 2026-08-06
### Fixed — the actual root cause, found via the browser console
- The "empty gaps" bug from 1.1.0 onward was never network flakiness or concurrency: it was a 100%-reproducible CORS failure, invisible without console access. `lucide-static@latest` 302-redirects to a pinned version (unpkg's normal behavior), and that redirect drops the CORS header needed for a fetch from a null-origin context -- which is exactly what a Figma plugin UI is (a sandboxed data: URL iframe). Every single icon fetch was failing, always, with "Access to fetch ... has been blocked by CORS policy" (origin 'null'). The 1.1.0 retry logic and 1.4.0 concurrency queue were both correct engineering for the wrong problem -- no amount of retrying a deterministic policy rejection can ever succeed.
- Fixed by pinning both fetch URLs (icon list + individual SVGs) to an exact version (1.28.0, read directly from the real redirect target in a live console log) instead of @latest, eliminating the redirect -- and with it, the CORS failure -- entirely. Centralized into one `LUCIDE_STATIC_VERSION` constant so a future version bump is a one-line change; re-verify CORS behavior on redirects before ever reverting to @latest.
- The 1.1.0 retry/honest-failure-state UI and 1.4.0 concurrency queue remain in place -- they're still correct defenses against genuine transient issues (a real network blip, a truly missing icon), just no longer fighting a 100% wall.

## [1.4.0] - 2026-08-06
### Added
- Bounded concurrency queue (max 6 simultaneous fetches) for grid icon loading. Previously every card that entered the viewport fired its fetch immediately and in parallel -- a large results grid could trigger dozens at once, risking connection/rate-limit issues that cause bursts of failures large enough to exhaust the per-card retry budget (added in 1.1.0) together. Now fetches queue behind a 6-at-a-time limit (the conventional safe per-host concurrent-connection count); the retry logic from 1.1.0 is unchanged and still applies per-card. The single-icon preview-panel fetch is untouched -- it's one on-demand fetch, not part of the grid-scroll burst pattern, and shouldn't wait behind the queue.

## [1.3.0] - 2026-08-06
### Fixed — root cause finally identified correctly, by the maintainer
- The entire strokeWeight investigation since 1.0.5 was chasing the wrong problem. `settings.strokeWeight` (Settings tab "Border thickness") is meant for icon import and correctly defaults to 2, matching Lucide's own icon stroke convention -- it was never supposed to be 1. The REAL bug: `componentSet.strokeWeight = settings.strokeWeight` wired the purple chrome boundary stroke to this user-editable setting, when the chrome is purely decorative and must never change regardless of any setting or stored data.
- Also explains why every fix since 1.0.5 failed to stick: settings persist per-FILE via figma.root.pluginData, which is scoped per-plugin-id and invisible to diagnostic tools running under a different plugin (Desktop Bridge) -- every "storage is empty" check this session was reading the wrong plugin's namespace, worthless as evidence. The one-time migration (1.0.7) was solving a problem that didn't exist and had its own failure mode: once its flag fired, it could never re-run, even after a later autosave silently reverted the "fix."
- `DEFAULT_SETTINGS.strokeWeight` reverted to 2 (correct, matches Lucide). The one-time migration and its flag (`STROKE_MIGRATION_KEY`) removed entirely -- nothing to migrate. The chrome stroke now uses a new hardcoded constant, `CHROME_STROKE_WEIGHT = 1`, with zero dependency on settings or stored data of any kind -- immune to this entire class of bug permanently.

## [1.2.0] - 2026-08-06
### Reverted — 1.0.8/1.0.9's fix was solving the wrong problem
- 1.0.8 forced an explicit height (156, via primaryAxisSizingMode: 'FIXED') to sidestep a "HUG + inside-stroke" discrepancy, believing 156 was correct and 158 was a bug. This was wrong. The real explanation (found by the maintainer, via Figma's own "Layout: Updated / Legacy" control in the properties panel): Figma's CURRENT auto-layout engine ("Updated") correctly has an INSIDE-aligned stroke participate in the box-model size calculation, so 158 is the correct, expected height. Pre-existing icons elsewhere in the library that read 156 predate this engine update and are pinned to "Legacy" auto-layout for backward compatibility -- not something new icons need to match.
- Reverted to plain Hug sizing (primaryAxisSizingMode/counterAxisSizingMode: 'AUTO'), no explicit resize. Every node this plugin creates is created NOW, so it automatically gets Updated engine behavior -- no special handling needed. Verified via live rebuild: 158px, Hug mode, matches.
- The "Layout: Updated/Legacy" distinction is not exposed via the Plugin API (checked directly -- no layoutVersion or similar property found on either an old-engine or new-engine component set).

## [1.1.0] - 2026-08-06
### Fixed
- Icon grid showed permanent blank gaps for some icons. Root cause: the IntersectionObserver's fetch callback had an empty `.catch()`, and marked the card "loaded" + unobserved it BEFORE the fetch even started — so any transient failure (CDN hiccup, many concurrent fetches as the grid scrolled into view) left that card blank forever with no retry. Icon names come from the same `lucide-static@latest` package as the SVGs, so a name/data mismatch was ruled out — this is a network/concurrency issue. Now retries up to 3 times automatically (re-observing an already- intersecting card re-fires the callback), and after exhausting retries shows an honest "failed to load, click to retry" state instead of a silent blank square.
- The "already in library" grey/checkmark state on grid icons was a one-time snapshot taken when the plugin launched (`GET_EXISTING`, sent once) — deleting an icon on canvas while the plugin stayed open left it showing as still-existing until the plugin was closed and reopened. Now `figma.currentPage.on('nodechange', ...)` (debounced 400ms) re-pushes `EXISTING_ICONS` whenever the page changes, and the UI already re-renders the grid on that message — so the "exists" state stays live. Scoped to the current page only (not the heavier `figma.on('documentchange', ...)`, which needs `loadAllPagesAsync()` first — unnecessary here since the exists-check was already current-page-scoped).

## [1.0.9] - 2026-08-06
### Removed
- Two unused `figma.loadFontAsync({ family: 'Inter', style: 'Regular' })` calls (in `addIcon` and `runUpdateIcon`) — this plugin never creates a text node anywhere; the font was never used. Minor unnecessary delay on every add/update, now gone.

### Changed
- Simplified the component-set sizing block: `primaryAxisSizingMode = 'AUTO'` was set and then immediately overridden to `'FIXED'` 25 lines later (from the 1.0.8 fix) — the intermediate AUTO assignment was dead weight. Now sets `'FIXED'` directly, once. No behavior change; verified via a live rebuild producing 156px, matching 1.0.8's result exactly.

## [1.0.8] - 2026-08-06
### Fixed
- Component sets were coming out 2px taller than the padding/gap math predicts (e.g. 158 instead of 156) — uniformly, on every icon, confirmed via live rebuild tests including a plain rectangle with no icon geometry involved. Root cause: HUG sizing (primaryAxisSizingMode: 'AUTO') on a frame with an INSIDE-aligned stroke reserves the stroke's width as EXTRA space beyond padding+content instead of drawing it into the padding — a 1px stroke adds 2px total (1px x 2 sides), matching the discrepancy exactly. Now computes the intended height explicitly (padding x2 + variant sizes + gaps x(n-1)) and forces it via primaryAxisSizingMode: 'FIXED', sidestepping the HUG/stroke interaction entirely. Verified via a live rebuild in Figma: 156px, exact match. Width remains on AUTO/HUG (no discrepancy observed there). Supersedes the "icon-specific geometry" theory floated in earlier investigation notes — that was wrong; this affects every icon uniformly.

## [1.0.7] - 2026-08-06
### Fixed
- The 1.0.5 strokeWeight default change (2→1) never took effect in files already used with this plugin: settings persist per-FILE via figma.root.pluginData, and a previously-saved 2 correctly overrode the new code default every time (that's how settings persistence is supposed to work) — no manual Settings edit was actually applying either, contrary to the 1.0.5 note's assumption. Added a one-time migration: on first load after this version, a stored strokeWeight of exactly 2 is silently updated to 1 and a flag is set so it never happens again — a deliberate future choice of 2 is respected permanently after that.

## [1.0.6] - 2026-08-06
### Changed
- `BOX_PADDING` was 32, now 24 — matches `VARIANT_GAP`, so box padding and inter-variant spacing are the same value throughout (confirmed via Figma's own auto-layout panel: itemSpacing already read 24 correctly; padding read 32/32, which is what was visually reading as inconsistent). Supersedes the "investigated, not changed" note in 1.0.5 — the report was about padding, not the gap; gap was correct all along.

## [1.0.5] - 2026-08-06
### Fixed
- `DEFAULT_SETTINGS.strokeWeight` was 2, now 1 — the component-set boundary stroke (colour #9747FF, matching Figma's own combine-as-variants chrome) now defaults to 1px. Only affects NEW icon sets and fresh Settings state; a previously-saved "Border thickness" value in Settings persists in clientStorage and needs Reset (or manual edit) to pick up the new default.

### Investigated, not changed
- Reported: 32px separation between size variants inside a set, expected 24. Traced the code: VARIANT_GAP (the actual between-variant itemSpacing) is already 24. BOX_PADDING (32) is a distinct value — padding around the whole box/set, not inter-variant spacing. No bug found matching the report as stated; holding for clarification on which measurement is meant before changing either constant.

## [1.0.4] - 2026-08-06
### Fixed
- `.tab:hover` changed only text colour, never a background — no visible hover feedback existed. Added `background: var(--figma-color-bg-hover)` (Figma's neutral hover token, same family already used for input focus).
- `.btn-primary:disabled` used `opacity: 0.4` to dim the blue background+text together, producing low-contrast washed-blue text instead of Figma's actual disabled treatment. ui-base already defines the correct one (`--figma-color-bg-disabled` / `--figma-color-text-ondisabled`) on the bare `button:disabled` selector, but this plugin's more specific `.btn-primary:disabled` silently overrode it. Now uses the same tokens explicitly — same root cause as 1.0.3, different property (state styling, not sizing).

## [1.0.3] - 2026-08-06
### Fixed — silent CSS collisions with the inlined ui-base baseline
- ui-base.css uses bare element selectors (`button`, `input[type=text]`, `select`), which apply to every matching tag regardless of its class. Five bespoke controls (`.tab`, `.clear-btn`, `.btn`/`.btn-primary`/`.btn-secondary`, `#searchInput`, `.field-row-control` inputs/select) were silently inheriting ui-base's 32px/30px height and default padding on top of their own sizing — accidental, not broken, but not intentional either (this is what surfaced as the earlier focus-ring inconsistency report).
- Each now declares its own `height`/`box-sizing`/padding explicitly, so nothing in this file relies on accidental cascade from the shared baseline. No class renamed, no markup or script touched, no visible size change expected (values match what was already being inherited) — this makes the sizing deliberate rather than coincidental.
- See standards/toolkit-standard.md §4 (v1.2.0) for the general pattern this fix follows, and _shared/ui-base.css's own header note.

## [1.0.2] - 2026-08-06
### Fixed
- `.tab` buttons had no explicit focus style, so keyboard/click focus fell back to the browser's native ring (orange on macOS) — visibly inconsistent with the blue `--figma-color-border-selected` focus already used on inputs. Added an explicit `:focus-visible` rule using the same token, so all focusable controls now share one focus treatment.

## [1.0.1] - 2026-08-05
### Changed
- ui-base v1 inlined (mandatory per skill-standard §B v1.1.0). Additive: existing token-aliased :root and all bespoke styling untouched.

## [1.0.0] - 2026-08-05
### Changed
- Conformed to skill-standard §B v1.0.0: manifest gains `documentAccess: "dynamic-page"` (code verified async-clean first), explicit `networkAccess`; added package.json versioning, this changelog, README. Plugin logic untouched.
