# Lucide Icon Importer
Imports Lucide icons as components with size variants.

Runs with no build step: import `manifest.json` via Figma → Plugins → Development.

## Data this plugin stores
- clientStorage: settings/preferences only (if any) — see code header.
- pluginData: none unless documented here.

## Tests

    node tests/test-importer.mjs

Loads `code.js` against a fake Figma and exercises `buildMasterIcon` (stroke weight, filled paths, single shapes, fill-plus-stroke), the paste-a-list parser and the settings normalisers.

## How a full Lucide set is laid out

The maintainer's convention for a file holding the whole set, applied once to one project's icon library on 2026-10-08 (1,875 sets: 232 moved, 1,509 built, none failed). The plugin builds icons; it does not sort a file. Re-sorting is a one-off run through the audit dashboard's `POST /exec`, so the SVGs never pass through a chat; the reference run is `~/Projects/handoff/sort-icons.mjs`, outside this repo because it names one file's ids.

- An icon goes to the **first** category Lucide lists for it (`icons/<name>.json`, `categories[0]`); 60% of icons list two or more.
- An icon already in the file is **moved**, which keeps its component key, never rebuilt.
- One top-level frame per category, named with Lucide's category title, on a single `Icons` page: Figma's assets panel groups by page and then by top-level frame or section, and by nothing deeper.
- Each frame is a 10-column grid with automatic positioning (`gridItemsPositioning: ROW_AUTO_FLOW`, `gridAutoTracks: ROWS`), hug tracks, gaps and padding bound to the spacing tokens, children alphabetical.
- An icon that is not Lucide's (named `… _custom`) goes to a `Custom` frame; the unsorted frame ends empty.

Two Figma behaviours the run had to work around:

- A grid frame created through the API starts with flexible tracks and takes hug tracks only once the frame itself hugs: set the frame's sizing to hug first, then the tracks.
- Setting an `Icon` swap again resets the colour override on the icon's vector, so re-apply the fill binding after a swap.
