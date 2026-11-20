# Lucide Icon Importer reference

The detail behind [README.md](README.md).

## How a full Lucide set is laid out

The maintainer's convention for a file holding the whole set, applied once to one project's icon library on 2026-10-08 (1,875 sets: 232 moved, 1,509 built, none failed). The plugin builds icons; it does not sort a file. Re-sorting is a one-off run through the audit dashboard's `POST /exec`, so the SVGs never pass through a chat; the script that ran it is not in this repo, because it names one file's ids.

- An icon goes to the **first** category Lucide lists for it (`icons/<name>.json`, `categories[0]`); 60% of icons list two or more.
- An icon already in the file is **moved**, which keeps its component key, never rebuilt.
- One top-level frame per category, named with Lucide's category title, on a single `Icons` page: Figma's assets panel groups by page and then by top-level frame or section, and by nothing deeper.
- Each frame is a 10-column grid with automatic positioning (`gridItemsPositioning: ROW_AUTO_FLOW`, `gridAutoTracks: ROWS`), hug tracks, gaps and padding bound to the spacing tokens, children alphabetical.
- An icon that is not Lucide's (named `… _custom`) goes to a `Custom` frame; the unsorted frame ends empty.

Three Figma behaviours the runs had to work around:

- A grid frame created through the API starts with flexible tracks and takes hug tracks only once the frame itself hugs: set the frame's sizing to hug first, then the tracks.
- Setting an `Icon` swap again resets the colour override on the icon's vector, so re-apply the fill binding after a swap.
- An icon whose vertical sizing is `FILL` stretches when it is moved into an auto-layout box, and its `SCALE`-constrained vector stretches with it (24×24 to 24×52, 2026-11-13). Set both sizings to `FIXED` before the move; after one, `resizeWithoutConstraints(24, 24)` and rescale the vector back.

## Checking a library against the importer

`pluginData` is scoped to the plugin that wrote it (skill-standard Part B 11), so code run through the Desktop Bridge or the audit service reads empty settings and no icon data, even on icons this plugin built. That is no evidence an icon was not imported here. To check a library against the importer, rebuild each icon from Lucide's SVG with this file's `buildMasterIcon` and compare what is drawn (shape, centring in the box, the box's padding and hug, description and link), as one library's 208 icons were checked on 2026-11-04.

## Tests

- `node tests/test-importer.mjs` — loads `code.js` against a fake Figma and exercises `buildMasterIcon` (stroke weight, filled paths, single shapes, fill-plus-stroke), the paste-a-list parser, the settings normalisers, and the right-to-left line against the audit's own regex and word lists.
- `node tests/test-svg-clean.mjs` — an icon's SVG comes from a CDN, so the window never writes it as markup: `cleanSvg` parses it as XML and rebuilds it from shape elements and presentation attributes only, and that is what the card shows and what Figma is given. This test feeds it a hostile icon in Chrome (scripts, handlers, a foreignObject, links, URL values) and checks nothing ran and only the shapes survive.
- `node tests/test-ui-keyboard.mjs` — the window in Chrome, from the keyboard: the tabs move with Left and Right, the cards and the variable picker are named buttons that say their state, Escape closes the picker and gives focus back, and every control has a name.
- `node tests/test-ui-fetch.mjs` — the window's fetch queue and retry are a copy of figma-plugin-creator's `assets/fetch-queue.js`; this holds the copy to its source and runs it against fetches that fail at once.
