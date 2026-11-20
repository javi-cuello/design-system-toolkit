# Theme Switcher

This Figma plugin sets a theme and a brand on the selected layers in one click. By hand, you would visit every collection that carries the theme and pick the same mode in each. That means the colour primitives, the semantics and the brand. The plugin has two choices and one button: **Theme**, **Brand** and **Apply**.

## Install

It runs with no build step. In Figma, go to Plugins → Development → Import plugin from manifest… and pick `manifest.json`. Its version is in `package.json`, and its history in `CHANGELOG.md`.

## What it offers

It knows no collection or mode names. It reads the shape of the file instead.

| Row | What it is |
|---|---|
| **Theme** | A mode name that two or more collections *with a choice* both offer. |
| **Brand** | The [extended collections](https://help.figma.com/hc/en-us/articles/32131755337367) in the file, plus a base entry. |
| **Choice** | Any other collection with modes that the theme does not cover. Each gets one row, under the collection's name. |

Say a file's colour, semantic and brand collections all carry `Light` and `Dark`. Then the themes are exactly `Light` and `Dark`. `Mode 1` on five single-mode collections is not a theme. Nor is a breakpoint set that only one collection defines.

A brand's name comes from the primitives its tokens point to. `Colour/Brand/Acme/Primary/5` gives **Acme**. The Brand row is absent in a file with no extensions. A Choice row lets a file that keeps brands as modes of one collection switch brand too. [How the rows are read](REFERENCE.md#how-the-rows-are-read) has the detail.

Each row is a segmented control for up to three options, and a dropdown beyond that. Four segments in a 300px panel cut off any real brand name.

## Apply and Clear

Apply sets the theme on every collection that offers it. It pins each choice row's mode and the chosen brand. It clears the brands you did not choose.

Apply needs a selection. A mode pinned on a page is overridden by every frame below it with its own pin. So an Apply with nothing selected once reported "1 layer" while the canvas did not move. Apply is now disabled with an empty selection, and the panel says "Apply needs a layer · Clear covers the page".

**Clear** is not the opposite of Apply. It is the reset button. It removes every mode pin on the **current page and everything on it**, whatever set them. It works with or without a selection. Anything narrower would report success while the canvas stayed the same.

## How it fits

Figma's API forces four workarounds, described in [Four things the API forces](REFERENCE.md#four-things-the-api-forces). In short, an extension is found only once something pins it. Collection ids change between published versions. A library call may never return. And an extension's pin is cleared through its parent.

## Test

```sh
node plugins/theme-switcher/tests/test-switcher.js
```

It runs `code.js` against a stub `figma`. It checks the stable half of a collection id, the timeout every library call races, and the rows read from local collections. `bin/check` runs it.

## Data this plugin stores

| Where | What |
|---|---|
| Relaunch data | One `switch` entry on `figma.root`. It puts *Switch theme or brand* under **Tools**. |
| `clientStorage` | The window size only. |
| `pluginData` | Collection ids found in this file, and the base brand names worked out here. |

Keys and reasons are in [Data this plugin stores](REFERENCE.md#data-this-plugin-stores).
