# Adoption score

A Figma widget that scores how closely a product file's screens use its design system. Place it on the canvas, press **Run scan**, and it draws a total out of 100 and a band per check, folded under **Details**; **Run again** re-scans after changes.

## Run

1. Figma desktop → **Widgets → Development → Import widget from manifest…** → this folder's `manifest.json`.
2. Open the product file, insert **Adoption score** from **Widgets → Development**, and press **Run scan**.
3. To name your design system: click **Connect libraries** on the card (or **System libraries…** in the widget's menu), paste a link to each library, one per line, and a Figma personal access token with the `library_content:read` scope (Figma › Settings › Security). Without libraries, every library counts as the system. With them, an instance of this file's own components, or of a component its library no longer publishes, counts as not the system. Changing the libraries clears the last result.
4. To narrow the scan, pick **This page** (leaving out an archive or sketches) or **Selection** (the frames, instances or sections you select before clicking Run) with the radio buttons above Run.

A changed manifest needs a re-import.

## What it scores

Every visible frame and instance at the top of a page, or inside a section there, is a screen; components, widgets, stickies and loose layers are not. Each screen is read by figma-components-audit's composed-frame check (`FCA.composedFrame`, [scanner-checks.md §3.13](../../skills/figma-components-audit/references/scanner-checks.md)): only what the designer drew, never a library instance's own layers.

| Check | Passes / judged |
|---|---|
| System components | placed instances from the system libraries (every library, until some are set) / instances plus raw layers (a rectangle, vector, group…; text is scored under Text style bound) |
| Not detached | instances / instances plus frames inside a screen that Figma marks as detached. A whole screen detached from a template was meant to be, and a frame only named like a component may be the designer's own, so neither counts |
| Colour bound | visible solid fills and strokes with a variable or a style / all of them |
| Spacing and radius bound | non-zero gap, padding and radius with a variable / all of them |
| Text style bound | text layers with a text style / all of them |

The total is the plain average of the checks that had something to judge, shown with every check's own share so one weak check is never hidden in it. Bands: **Good** 75 and up, **Fair** 60 to 74, **Poor** below 60. No design-system source publishes a pass mark; these follow Google's code-coverage guidelines, where 60% is acceptable and 75% commendable, since coverage is the same kind of share (knowledge/code/adoption.md).

## What it does not do

- It does not score effects (shadows, blurs), gradients or images, nor values overridden inside an instance.
- A text with mixed styles counts as styled.
- A detached copy Figma no longer marks (made before the flag existed) is not counted as a detach.
- A detached frame costs twice: once as a detach, and its own layers, now drawn by hand, as raw layers, unbound values and texts.
- It lists no offenders: the composed-frame check names each one, and `figma-components-audit` reports them per screen.

## Files

- `ui.html`: the System libraries window.
- `code.js`: the widget. Its generated block (the components audit's `probes.js`) is written by `node plugins/adoption-score/sync.mjs`, never by hand; `bin/check` runs `sync.mjs --check` and fails when it differs.

## Data this plugin stores

- **Synced state** (on the widget node, in the file, seen by everyone who opens it): the last run's counts and time, the scope, and the system libraries' links.
- **clientStorage** (this computer only): the Figma token. **Forget** in the System libraries window deletes it.
- **Network**: `api.figma.com` only, one `GET /v1/files/:key/components` per system library per run, with the token. No pluginData.

## The look

The card on the canvas takes FigUI3's light-theme values, which the plugins' windows use (`plugins/_shared/figui3/fig.css`), copied into `code.js`'s `UI` constant since a widget cannot read CSS: a widget does not follow Figma's dark theme. The System libraries window is a plugin window like the others: FigUI3 elements and the shared ui-base, inlined by `node plugins/_shared/sync.mjs`.
