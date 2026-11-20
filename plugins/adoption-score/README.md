# Adoption score

This Figma widget scores how closely a product file's screens use its design system. Place it on the canvas and press **Run scan**. It draws a total out of 100, and a band for each check folded under **Details**. **Run again** scans again after changes.

## Run

1. In Figma desktop, go to **Widgets → Development → Import widget from manifest…** and pick this folder's `manifest.json`.
2. Open the product file. Insert **Adoption score** from **Widgets → Development**, and press **Run scan**.
3. To name your design system, click **Connect libraries** on the card. **System libraries…** in the widget's menu does the same.
4. Paste a link to each library, one per line. Add a Figma personal access token with the `library_content:read` scope, made in Figma › Settings › Security.
5. To narrow the scan, use the radio buttons above Run. **This page** leaves out an archive or sketches. **Selection** scans the frames, instances or sections you select before clicking Run.

Without libraries, every library counts as the system. With them, some instances count as not the system. These are instances of this file's own components, and of a component its library no longer publishes. Changing the libraries clears the last result.

A changed manifest needs a re-import.

## What it scores

A screen is every visible frame and instance at the top of a page, or inside a section there. Components, widgets, stickies and loose layers are not screens. Each screen is read by figma-components-audit's composed-frame check, `FCA.composedFrame`, described in [scanner-checks.md §3.13](../../skills/figma-components-audit/references/scanner-checks.md). It reads only what the designer drew, never a library instance's own layers.

| Check | Passes / judged |
|---|---|
| System components | Placed instances from the system libraries, which means every library until some are set. Judged against instances plus raw layers, such as a rectangle, vector or group. Text is scored under Text style bound. |
| Not detached | Instances, judged against instances plus frames inside a screen that Figma marks as detached. A whole screen detached from a template was meant to be. A frame only named like a component may be the designer's own. So neither counts. |
| Colour bound | Visible solid fills and strokes with a variable or a style, out of all of them. |
| Spacing and radius bound | Non-zero gap, padding and radius with a variable, out of all of them. |
| Text style bound | Text layers with a text style, out of all of them. |

The total is the plain average of the checks that had something to judge. Every check's own share is shown beside it, so one weak check is never hidden.

The bands are **Good** at 75 and up, **Fair** from 60 to 74, and **Poor** below 60. No design-system source publishes a pass mark. These follow Google's code-coverage guidelines, where 60% is acceptable and 75% commendable. Coverage is the same kind of share (knowledge/code/adoption.md).

## What it does not do

- It does not score effects such as shadows and blurs, gradients or images. Nor does it score values overridden inside an instance.
- A text with mixed styles counts as styled.
- Some detached copies were made before Figma's flag existed. Figma no longer marks them, so they are not counted as a detach.
- A detached frame costs twice. It counts once as a detach. Its own layers, now drawn by hand, count again as raw layers, unbound values and texts.
- It lists no offenders. The composed-frame check names each one, and `figma-components-audit` reports them per screen.

## Files

- `ui.html` is the System libraries window.
- `code.js` is the widget. Its generated block is the components audit's `probes.js`. `sync.mjs` writes it, never a person. `bin/check` runs `sync.mjs --check` and fails when it differs.

## Data this plugin stores

| Where | What |
|---|---|
| Synced state | The last run's counts and time, the scope, and the system libraries' links. It sits on the widget node, in the file, so everyone who opens it sees it. |
| clientStorage | The Figma token, on this computer only. **Forget** in the System libraries window deletes it. |
| Network | `api.figma.com` only, with the token. One `GET /v1/files/:key/components` per system library per run. |

It writes no pluginData.

## The look

The card on the canvas takes FigUI3's light-theme values, which the plugin windows use. They come from `plugins/_shared/figui3/fig.css`. They are copied into the `UI` constant in `code.js`, because a widget cannot read CSS. So the card does not follow Figma's dark theme.

The System libraries window is a plugin window like the others. It uses FigUI3 elements and the shared ui-base, inlined by `_shared/sync.mjs` ([plugins/_shared](../_shared/README.md)).

## Test

```sh
node plugins/adoption-score/sync.mjs --check
```

`bin/check` runs it.
