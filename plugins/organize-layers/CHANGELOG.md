# Changelog — Layer organiser
All notable changes. Format: Keep a Changelog; versioning: SemVer.

## [0.6.3] - 2026-10-31
### Changed
- The Separator field is labelled by its heading, the two gap fields by what each spaces, Flow is a named group, the status line is announced, and the window's language is set. README: the stored settings include the flow direction, and the Layers panel's order follows the direction.

## [0.6.2] - 2026-10-08
### Changed
- Comments cite the standard that owns each rule (skill-standard §B 4 for the ui-base block).

## [0.6.1] - 2026-09-16
### Fixed
- **Secondary buttons turned brand-blue under the pointer.** ui-base's `button:hover` (0-1-1) beat `.btn-secondary` (0-1-0), so every secondary button in the plugin took the primary hover — the collision §4 of the plugin standard warns about, on a state rather than on sizing. Fixed in the canonical `plugins/_shared/ui-base.css` and re-inlined (block is now **ui-base v2**), so it is fixed for every plugin at once rather than patched here.

## [0.6.0] - 2026-08-26
### Added
- **Flow direction**, horizontal or vertical, as a segmented control. Horizontal is the
  default and is exactly what the plugin already did: each group a column, members
  stacking downwards. Vertical is the transpose — each group a row, members running
  left to right. One loop serves both: the group axis and the member axis swap, and
  a group clears its own tallest member instead of its widest.
- The preview shows the transpose too, so the choice is legible before anything moves.

### Changed
- The window is 420px tall to fit the new field, measured at 418px of content.
- The checkbox reads "Group by name". "Group into columns" was only true in horizontal
  flow, and this release makes the other one possible.

### Fixed
- `tests/render-check.sh` printed `skip` and exited 0 when it could not find a browser,
  which is indistinguishable from a pass. It now exits 2, says **DID NOT RUN**, and
  looks for Chromium, Brave and Edge as well as Chrome, plus the playwright and
  puppeteer caches. Found because the Chrome it was written against was missing from
  this machine the next day — a check that depends on something it does not control
  has to be loud when that thing is missing, not quietly green.
- `render-check.sh` also runs both directions now, and asserts the preview group's own
  box rather than its class name: the class is set by JavaScript, so checking it tested
  the script and not the stylesheet. Deleting `.preview.vertical .col` now fails it.

## [0.5.1] - 2026-08-25
### Fixed
- The separator input rendered full width instead of 56px. `.input-compact` ties with
  ui-base's `input[type=text]` on specificity — an attribute selector counts as a class —
  and lost on source order. Element-qualifying it as `input.input-compact` breaks the tie.
  Measured at 468px inside a 260px window; exactly the collision `toolkit-standard.md` §4
  describes, which a rule can name but not catch.

### Added
- `tests/render-check.sh` — renders `ui.html` headlessly at 260x364 in light and dark and
  measures it: overflow, dead space against `showUI`'s height, each control's width, and
  anything past the right edge. `--keep` writes the two screenshots. Colour is indicative
  (Figma injects the real token values at runtime); size is exact, because `ui.html` uses
  no viewport units and no media queries — which the check asserts before trusting itself.

## [0.5.0] - 2026-08-25
### Changed
- The first layer lands on **0, 0**. It previously kept the top-left corner the layers
  already occupied, so the grid's origin depended on wherever they happened to be —
  reported from a real run.

### Added
- `tests/test-organize.js` — 22 checks over the layout, sort, reorder and relaunch
  logic against a stubbed `figma`, verified by breaking the code and watching them fail.
- `tests/figma-api-check.js` — the API assumptions no stub can know, run against a
  real file on 2026-08-25 and all confirmed: reverse `appendChild` produces the
  Layers panel order claimed, the placement arithmetic lands where it says,
  `setRelaunchData` takes on both a page and a frame, and a lone selected
  container means "arrange what is inside it". Builds its own fixtures on an
  empty page and removes them.
- `tests/MANUAL.md` — what is left after those two: `ui.html`, the Design panel,
  undo grouping, and a large multi-page file. Only what the plugin host draws.

## [0.4.0] - 2026-08-25
### Added
- The Layers panel is reordered to match the canvas. Arranging the frames left the
  panel in whatever order they were created in — the thing the arrangement was meant
  to fix. The panel lists children back to front, so the plan is appended in reverse
  and the panel reads first column top to bottom, then the next. Safe only because
  the arrangement never overlaps layers, so z-order carries no meaning here.

### Changed
- Window narrowed from 320 to 260, and its height now matches its content.
- Preview contrast raised: the key renders in `--figma-color-text` at medium weight
  and the rest in `--figma-color-text-secondary`. They were secondary and tertiary on
  a secondary background, which is where the washed-out look came from.
- Field labels are 10px uppercase in `--figma-color-text-secondary`, matching
  `theme-switcher`; the separator field is labelled "Separator", not a sentence.
- The checkbox is drawn by the plugin. `accent-color` left the native control to pick
  its own tick colour, which came out dark on Figma blue; the tick is now
  `--figma-color-icon-onbrand` on `--figma-color-bg-brand`, with a focus ring.
- Dropped a `.container` rule that restated ui-base's own padding. ui-base stays
  verbatim against `plugins/_shared/ui-base.css`, and the checkbox styling is kept
  local rather than added to the shared file — no other plugin in `plugins/` uses a
  checkbox, so widening the baseline would touch five plugins to serve one.

## [0.3.0] - 2026-08-25
### Changed
- The relaunch button re-runs immediately with the settings last saved from the UI,
  instead of reopening the window. `figma.command === 'organize'` now branches before
  `showUI`, so the relaunch path never builds a UI at all and closes when it is done.
- Both paths run through one `organise()` function, so the button in the window and
  the button in the Design panel cannot drift apart.
- The relaunch path treats a lone selected node with children as "arrange what is
  inside it". Reaching the button means selecting the container, and the plain
  selection rule would have read that as a request to arrange the container itself —
  a one-column, one-layer run that moves nothing.

## [0.2.0] - 2026-08-25
### Changed
- Renamed to **Layer organiser**. The manifest `id` stays `organize-layers`: it keys
  the settings already in `clientStorage`, and per `toolkit-standard.md` §2 an id is
  never changed once storage exists.
- The separator now defaults to `-` instead of `/`. A separator already saved from
  0.1.0 is kept as it was; only the fallback moved.
- The two spacing fields swapped places — vertical gap left, horizontal gap right —
  and each carries an icon rather than a text label.

### Added
- Relaunch button. After a run, `setRelaunchData` puts **Organise layers** in the
  Design panel of whatever holds the arranged layers, so re-running does not need
  the plugin menu. Requires the manifest `id` that §2 mandates — without one the
  entry is rewritten under a fresh id on every import and disappears.

### Removed
- The paragraph under the checkbox explaining what grouping does.
- The number inputs' increment steppers.

## [0.1.0] - 2026-08-25
### Added
- Initial release: columns from the text before the delimiter, row order from the text after it.
- Grouping toggle — off, every layer becomes its own column in name order.
- Number-aware sorting, so `10` follows `9` instead of landing between `1` and `2`.
- Spacing is a gap measured from each column's widest layer and each layer's own height,
  not a fixed pitch, so columns of unequal width cannot overlap.
- Live preview of the resulting grid, updating on selection change and on any setting change.
