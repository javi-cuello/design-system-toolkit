# Changelog — component-graph

## [3.7.2] - 2026-10-31
### Fixed
- **Focus shows as a ring.** The shared baseline (ui-base v3) gives a focused input or select a 2px ring under the keyboard; a border colour alone was the only sign (WCAG 2.4.7, 1.4.11).
- The search field, which opted out of the ring for a border colour, takes it too.

## [3.7.1] - 2026-10-31
### Changed
- **The scan skips what is hidden inside an instance** (`figma.skipInvisibleInstanceChildren`, skill-standard §B 3), so a large file's walk reads less. The counts do not change: an instance nested in another is a mirrored copy, which the graph already discarded.
- The audit stamp names the standard it was audited against, `plugin-standard v1.4.0`, the retired file whose numbering it is (skill-standard §B 8).
- Merged with the keyboard release below; nothing of either changed.

## [3.7.0] - 2026-10-31
### Changed
- **Works from the keyboard, and says what each control is.** The sidebar's group heads and rows, the details panel's lines and the graph's nodes, ⓘ circles, "+ N more" and "See details" were click-only: the heads and rows are buttons (a head says whether it is open), and each graph shape is a named tab stop that Enter or Space presses; the ⓘ sits beside its node rather than inside it. Arrow keys move focus with the list cursor, and a redraw (a group collapsed, a node opened, a scan landing) keeps focus on the same item. The search field and the icon-only toolbar buttons are labelled, `lang` is set, and Local and External are toggle buttons that say which is on, not tabs with no panels. An unpublished component is said by an italic name and in words, not by a fainter icon alone; `tests/test-ui-keyboard.mjs` holds it, in Chrome. README: the import step and test, no `COMMUNITY.md` (it never existed here), and a roadmap item that shipped in v3 removed.

## [3.6.2] - 2026-10-08
### Changed
- Comments cite the standard that owns each rule (skill-standard §B 4 for the ui-base block).

## [3.6.1] - 2026-09-16
### Fixed
- **Secondary buttons turned brand-blue under the pointer.** ui-base's `button:hover` (0-1-1) beat `.btn-secondary` (0-1-0), so every secondary button in the plugin took the primary hover — the collision §4 of the plugin standard warns about, on a state rather than on sizing. Fixed in the canonical `plugins/_shared/ui-base.css` and re-inlined (block is now **ui-base v2**), so it is fixed for every plugin at once rather than patched here.

## [3.6.0] - 2026-08-06
### Added
- **Missing-from-library detection.** External components whose main no longer exists upstream were previously indistinguishable from healthy ones: their instances keep rendering from a local copy, `getMainComponentAsync` resolves, and `getPublishStatusAsync` answers `UNPUBLISHED` for everything outside the library file itself (which is why the catalog assumes `CURRENT` for remote components). `figma.importComponentByKeyAsync` is documented to reject when no published component has that key, so each distinct remote key is now probed with it. On demand only -- a "Check" button in the sidebar's External tab -- because it costs one network round-trip per external component. Results surface as a pinned "Not found in any library" group, a red instance count on the row, a "Library link" row in the details panel, and a red dashed graph node. The sidebar's own count carries the summary -- an extra banner above the graph was tried and dropped as redundant.
- **Local orphan detection** (free, no network): a main deleted from *this* file resolves to a component no page can reach, so `metaFor` now flags `orphan`. They used to sit unlabelled in a "No page" group; they now lead the Local tab under "Deleted from this file" with the Restore-component hint.
- Honesty guards on the check: each probe retries once so a transient failure can't masquerade as a deletion; a rejection is reported as "not found in any enabled library" (an un-enabled library and a deleted component reject identically); and if *every* probe fails, that is read as a connectivity or access problem and nothing is flagged at all.

### Fixed
- **ui-base collisions (skill-standard §B 4).** The tabs, the toggle, and the Read-more link are all `<button>`s that never restated `:hover`, so ui-base's bare `button:hover{background:brand-hover}` painted them brand blue -- most visibly as the blue hover on the Local/External tabs, and on the *off* toggle, where it read as on. Every bespoke control now declares its own height, `box-sizing`, hover and disabled states: `.segment` (26px), `.switch`, `.read-more`, `.strip button` (22px), `#details-close` (24px), `#toolbar button` (26px), `#libcheck-btn` (22px), `#search`.
- `#toolbar button:disabled` dimmed with `opacity: 0.35` -- the exact anti-pattern §4 names. Now uses `--figma-color-text-disabled`.
- Hardcoded colour removed: the toggle knob was `#fff` with an `rgba(0,0,0,.25)` shadow; it now uses `--figma-color-icon-onbrand` and drops the shadow, matching Figma's own toggle.
- Graph node hover used `filter: brightness(0.96)`, which darkens on hover -- backwards in dark theme. Now a `--figma-color-bg-hover` fill. Since that is a real fill, the canvas serializer freezes hover out (`#svg.exporting`) before reading computed styles, so a resting pointer can't tint the exported frame.
- Details-panel rows turned their label blue on hover; they now use a background wash, the way Figma's own lists behave.
- Cursors are Figma-native `default` throughout instead of `pointer`.

### Changed
- Version reconciled to 3.6.0. `package.json` had drifted to 3.1.1 (set by the standard-conformance commits) while the README's release narrative had reached v3.5 describing features already in the code. 3.6.0 is ahead of both, so the two numberings stop contradicting each other.
- `tsconfig.json` + `// @ts-check` (no-build type-checking) -- declared in package.json's devDependencies but never wired up. Found during the lucide-icon-importer full-review session; same fix applied here.

## [3.1.1] - 2026-08-05
### Changed
- ui-base v1 inlined (mandatory per skill-standard §B v1.1.0). Additive: existing token-aliased :root and all bespoke styling untouched; base defines shared metrics/controls beneath the plugin's own overrides.

## [3.1.0] - 2026-08-05
### Changed
- Conformed to skill-standard §B v1.0.0: manifest gains `documentAccess: "dynamic-page"` (code verified async-clean first), explicit `networkAccess`; added package.json versioning, this changelog. Plugin logic untouched.
