# Lucide Icon Importer

This Figma plugin imports [Lucide](https://lucide.dev) icons as components, with size variants. It saves drawing or pasting each icon by hand.

## Install

It runs with no build step. In Figma, go to Plugins → Development → Import plugin from manifest… and pick `manifest.json`.

## Right to left

Some projects ship a right-to-left language, such as Arabic, Hebrew, Farsi or Urdu. For those, turn on **Mark mirroring** in Settings. Each icon added then gets `Right to left: mirrors` or `Right to left: stays` at the end of its description. figma-components-audit reads that line to know the decision is made.

With one icon selected, the **Mirrors right to left** checkbox sets it. The box is prefilled from the name, using the audit's own direction words. Arrows, chevrons, undo and send mirror. Up, down and playback controls stay.

Icons added several at a time get the line only if someone selected each one and saw its box. A guess would silence the audit's question. **Update icon** keeps a decision already made, including one written by hand.

## Data this plugin stores

| What | Where and why |
|---|---|
| The file's settings | `pluginData` on the document root, under `lucideIconImporterSettings`. They travel with the file. There is no `clientStorage`. |
| Each icon it builds | `pluginData` keys `lucideIconName`, `lucideSvgSource`, `lucideTags` and `lucideRtl`. The **Update icon** relaunch button rebuilds the icon from them. |
| Network | Lucide's `tags.json` and each icon's SVG, from `cdn.jsdelivr.net`. The manifest allows that domain alone. |
| Libraries | The `teamlibrary` permission. It lets the **Variable** picker offer the colour variables the file's enabled libraries publish. |

The settings hold the frame name, sizes, stroke, colours, the chosen variable, and whether to mark right to left. `lucideRtl` is `mirrors`, `stays` or empty. The SVGs come from the `lucide-static` package, at the version `ui.html` pins.

Only this plugin can read that data. Other code, such as the Desktop Bridge, reads nothing, even on icons this plugin built. See [Checking a library against the importer](REFERENCE.md#checking-a-library-against-the-importer).

## Tests

Run each from this folder. `bin/check` runs them all.

```sh
node tests/test-importer.mjs      # icon building, list parsing, settings, the right-to-left line
node tests/test-svg-clean.mjs     # a hostile SVG from the CDN is rebuilt from its shapes only
node tests/test-ui-keyboard.mjs   # the window works from the keyboard, every control named
node tests/test-ui-fetch.mjs      # the fetch queue matches its source in figma-plugin-creator
```

Each test's header says what it holds. [Tests](REFERENCE.md#tests) has the detail.

## How it fits

The plugin builds icons. It does not sort a file. [How a full Lucide set is laid out](REFERENCE.md#how-a-full-lucide-set-is-laid-out) gives the maintainer's convention for a whole set. It also covers three Figma behaviours to work around.
