# In-Figma checks

Two layers already cover everything below them. `test-organize.js` covers the
logic against a stubbed `figma`; `figma-api-check.js` covers the API assumptions
that stub cannot know, by building fixtures on a scratch page and removing them
again — **run 2026-08-25 against a real file, all assumptions confirmed**: the
reverse `appendChild` really produces that Layers panel order, the placement
arithmetic really lands where it says, `setRelaunchData` takes on both a page
and a frame, and a lone selected container really means "arrange what is inside".

A third, `render-check.sh`, renders `ui.html` headlessly at 260x420 in light and
dark and measures it — it found the separator input rendering at 468px inside a
260px window. What is left here is what none of the three can reach: the real
injected token values, and anything the plugin **host** draws or keeps.

Run after any change to `ui.html`, `manifest.json`, or the relaunch path.
Import via Plugins → Development → Import plugin from manifest; a changed
manifest needs a re-import, and "run last plugin" will not pick it up.

## 1 · The window
`render-check.sh` measures the layout at 260x420 in both themes and asserts every
control's width, so what is left here is what only the real editor can settle:
- [ ] The injected `--figma-color-*` values are the real ones, not the check's
      approximations. Anything hardcoded would show here — a static read says
      the only literal in the plugin's CSS is the `#fff` fallback on
      `--figma-color-icon-onbrand`, which is what a fallback is for.
- [ ] The checkbox tick is legible on the blue box. Drawn by the plugin from
      `--figma-color-icon-onbrand` for exactly this reason: `accent-color` let
      the native control pick its own tick colour and it picked a dark one.

## 2 · The preview
- [ ] Change the selection with the plugin open: the preview follows.
- [ ] Set the separator to something the names do not contain: every layer
      becomes its own group, and the preview says so before anything moves.
- [ ] Switch the flow to Vertical: the preview transposes, and a run puts each
      group on its own row. Both directions are measured by `render-check.sh`
      and exercised by `test-organize.js`; what needs eyes is whether the
      segmented control reads as a control in the real editor chrome.

## 3 · The arrangement
Columns clearing the widest layer, the first layer on 0,0, and the Layers panel
order are all covered by `figma-api-check.js`. One thing is not:
- [ ] Cmd+Z restores both the positions **and** the layer order in one step.
      The reorder and the placement are separate API calls, and undo grouping is
      the editor's business, not the plugin's.

## 4 · Relaunch — confirmed 2026-08-25
Maintainer, on a real file: **Organise layers** appears in the Design panel after
a run, and clicking it re-runs with the saved settings without opening the window.
That was the last claim resting on nothing — `figma-api-check.js` had confirmed
the data is written on both a page and a frame, but whether the editor surfaces
it is host behaviour no script can see.

Still worth a glance if the manifest changes, since the entry depends on the
manifest `id`: without one it is rewritten under a fresh id on every import and
disappears.
- [ ] After a run inside a frame, select that frame: the button is on the frame,
      and arranges the frame's children rather than the frame itself.

## 5 · Persistence and scale
- [ ] Change the settings, close, reopen: they come back.
- [ ] Run in a large multi-page file: no sync-API throw, no unexpected page
      loading. `documentAccess: "dynamic-page"` makes sync document APIs throw,
      and a small file will never show it.
