# Adoption score

A Figma widget that scores how closely a product file's screens use its design system. Place it on the canvas, press **Run scan**, and it draws a total out of 100 and a band per check; **Run again** re-scans after changes.

## Run

1. Figma desktop → **Widgets → Development → Import widget from manifest…** → this folder's `manifest.json`.
2. Open the product file, insert **Adoption score** from **Widgets → Development**, and press **Run scan**.
3. To score one page only (leaving out an archive or sketches), select the widget and set **Scope** to **This page** in its menu, on the page that matters.

A changed manifest needs a re-import.

## What it scores

Every visible frame and instance at the top of a page, or inside a section there, is a screen; components, widgets, stickies and loose layers are not. Each screen is read by figma-components-audit's composed-frame check (`FCA.composedFrame`, [scanner-checks.md §3.13](../../skills/figma-components-audit/references/scanner-checks.md)): only what the designer drew, never a library instance's own layers.

| Check | Passes / judged |
|---|---|
| Library components | placed instances that resolve / instances plus raw layers (a rectangle, vector, group…; text is scored under Text styles) |
| Not detached | instances / instances plus frames inside a screen that Figma marks as detached. A whole screen detached from a template was meant to be, and a frame only named like a component may be the designer's own, so neither counts |
| Colour bound | visible solid fills and strokes with a variable or a style / all of them |
| Spacing and radius bound | non-zero gap, padding and radius with a variable / all of them |
| Text styles | text layers with a text style / all of them |

The total is the plain average of the checks that had something to judge, shown with every check's own share so one weak check is never hidden in it. Bands: **Good** 90 and up, **Fair** 75 to 89, **Poor** below 75. They are a house choice, not a researched threshold: no published research sets one, and the one vendor that publishes bands uses 40 and 70 (knowledge/code/adoption.md).

## What it does not do

- It does not score effects (shadows, blurs), gradients or images, nor values overridden inside an instance.
- A text with mixed styles counts as styled.
- A detached copy Figma no longer marks (made before the flag existed) is not counted as a detach.
- A detached frame costs twice: once as a detach, and its own layers, now drawn by hand, as raw layers, unbound values and texts.
- It lists no offenders: the composed-frame check names each one, and `figma-components-audit` reports them per screen.

## Files

- `code.js`: the widget. Its generated block (the components audit's `probes.js`) is written by `node plugins/adoption-score/sync.mjs`, never by hand; `bin/check` runs `sync.mjs --check` and fails when it differs.

## Data this plugin stores

The last run's counts and its time, in the widget's synced state, which lives on the widget node in the file and is seen by everyone who opens it. No clientStorage, no pluginData, no network calls.
