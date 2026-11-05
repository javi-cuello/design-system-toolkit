# Lucide Icon Importer
Imports Lucide icons as components with size variants.

Runs with no build step: import `manifest.json` via Figma → Plugins → Development.

## Right to left
For a project that ships a right-to-left language (Arabic, Hebrew, Farsi, Urdu), turn on **Right to left** in Settings. Each icon added then gets `Right to left: mirrors` or `Right to left: stays` at the end of its description. That line is what figma-components-audit reads to know the decision is made. With one icon selected, the **Mirrors right to left** checkbox sets it. It's prefilled from the name with the audit's own direction words: arrows, chevrons, undo and send mirror; up/down and playback controls stay. Icons added several at a time get the line only if someone selected each one and saw its box. A guess would silence the audit's question. Update icon keeps a decision already made, including one written by hand.

## Data this plugin stores
- **The file's settings**, as `pluginData` on the document root under `lucideIconImporterSettings` (frame name, sizes, stroke, colours, the chosen variable, whether to mark right to left), so they travel with the file. No `clientStorage`.
- **Each icon it builds** keeps `lucideIconName`, `lucideSvgSource`, `lucideTags` and `lucideRtl` (`mirrors`, `stays` or empty) as `pluginData`, which the **Update icon** relaunch button rebuilds it from.
- **Only this plugin can read that data.** `pluginData` is scoped to the plugin that wrote it (skill-standard Part B 11), so code run through the Desktop Bridge or the audit service reads empty settings and no icon data, even on icons this plugin built. That is no evidence an icon was not imported here. To check a library against the importer, rebuild each icon from Lucide's SVG with this file's `buildMasterIcon` and compare what is drawn (shape, centring in the box, the box's padding and hug, description and link), as one library's 208 icons were checked on 2026-11-04.
- **Network:** the window fetches Lucide's `tags.json` and each icon's SVG from `cdn.jsdelivr.net` (`lucide-static`, at the version `ui.html` pins), and nothing else. The manifest allows that domain alone.

## Tests

    node tests/test-importer.mjs

Loads `code.js` against a fake Figma and exercises `buildMasterIcon` (stroke weight, filled paths, single shapes, fill-plus-stroke), the paste-a-list parser, the settings normalisers, and the right-to-left line against the audit's own regex and word lists.

    node tests/test-svg-clean.mjs

An icon's SVG comes from a CDN, so the window never writes it as markup: `cleanSvg` parses it as XML and rebuilds it from shape elements and presentation attributes only, and that is what the card shows and what Figma is given. This test feeds it a hostile icon in Chrome (scripts, handlers, a foreignObject, links, URL values) and checks nothing ran and only the shapes survive.

    node tests/test-ui-keyboard.mjs

The window in Chrome, from the keyboard: the tabs move with Left and Right, the cards and the variable picker are named buttons that say their state, Escape closes the picker and gives focus back, and every control has a name.

## How a full Lucide set is laid out

The maintainer's convention for a file holding the whole set, applied once to one project's icon library on 2026-10-08 (1,875 sets: 232 moved, 1,509 built, none failed). The plugin builds icons; it does not sort a file. Re-sorting is a one-off run through the audit dashboard's `POST /exec`, so the SVGs never pass through a chat; the script that ran it is not in this repo, because it names one file's ids.

- An icon goes to the **first** category Lucide lists for it (`icons/<name>.json`, `categories[0]`); 60% of icons list two or more.
- An icon already in the file is **moved**, which keeps its component key, never rebuilt.
- One top-level frame per category, named with Lucide's category title, on a single `Icons` page: Figma's assets panel groups by page and then by top-level frame or section, and by nothing deeper.
- Each frame is a 10-column grid with automatic positioning (`gridItemsPositioning: ROW_AUTO_FLOW`, `gridAutoTracks: ROWS`), hug tracks, gaps and padding bound to the spacing tokens, children alphabetical.
- An icon that is not Lucide's (named `… _custom`) goes to a `Custom` frame; the unsorted frame ends empty.

Two Figma behaviours the run had to work around:

- A grid frame created through the API starts with flexible tracks and takes hug tracks only once the frame itself hugs: set the frame's sizing to hug first, then the tracks.
- Setting an `Icon` swap again resets the colour override on the icon's vector, so re-apply the fill binding after a swap.
