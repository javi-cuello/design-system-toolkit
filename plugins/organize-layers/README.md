# Layer organiser

This Figma plugin arranges layers on the canvas from their names. It turns a pile of named variants or screens into a tidy grid, with no dragging by hand.

## How names become a grid

With grouping on, the text before the separator picks the **column**. The text after it orders the **rows** inside that column. So `1 - 1`, `1 - 2` and `1 - 3` stack in one column. `2 - 1` starts the next column, and `3 - 1` the one after. A layer that is alone in its group still gets its own column. With grouping off, every layer becomes its own column, in name order.

**Flow direction** decides which way the groups run:

- *Horizontal* is the default. Each group is a column, and the columns sit side by side. `1 - 1`, `1 - 2` and `1 - 3` stack downwards, and `2 - 1` starts the next column.
- *Vertical* is the transpose. Each group is a row, with members running left to right. The next group starts the row below.

Grouping and sort order are the same either way. Only the placement changes.

The first layer lands on **0, 0**, and everything is placed from there. So the grid has a fixed origin, not one that depends on where the layers were sitting. Inside a frame or section, that is its top-left corner. On a page, it is the canvas origin.

Groups are spaced by a real **gap**. Each group clears its own widest member when groups run across, or its own tallest when they run down. So groups of unequal size never overlap. Members are spaced the same way, from their own width or height.

The separator defaults to `-` and can be any string. Sorting is number-aware, so `1 - 10` follows `1 - 9`. It does not land between `1 - 1` and `1 - 2`.

## Scope

It arranges the current selection. When nothing is selected, it arranges every top-level layer on the page.

- Only layers that share one parent are moved. Their `x` and `y` are relative to the parent, so mixing parents would place layers by coordinates that mean different things.
- Layers inside an auto-layout frame are skipped, because the frame owns their position.
- The count of skipped layers is shown beside the button.

## The Layers panel

A run also reorders the layers inside their parent. The Layers panel then reads in the same order as the canvas, group by group. Under *Horizontal*, that is the first column top to bottom, then the next. Under *Vertical*, it is the first row left to right, then the next.

This changes z-order. That is harmless here, because the arrangement never overlaps layers. But a deliberate stacking order among the arranged layers is not kept.

## Re-running

After a successful run, the plugin writes a relaunch button onto whatever holds the arranged layers. That is the page, or the frame or section they sit in. Select that parent and **Organise layers** shows in the Design panel. Clicking it re-runs at once with the settings last saved from the window. There is no window, just one notification, and it undoes like any other edit.

To reach the button you select the container. So the relaunch path reads one selected node with children as "arrange what is inside it". The plain selection rule would instead arrange that one node. With the button on the page, nothing is selected and the whole page is arranged.

To remove the button, right-click the parent, then go to Plugins and use the button's own remove control.

## Run

In Figma, go to Plugins → Development → Import plugin from manifest, and select this folder's `manifest.json`. A changed manifest needs a re-import. "Run last plugin" will not pick it up.

## Test

```sh
node plugins/organize-layers/tests/test-organize.js
```

It tests the logic against a stubbed `figma`, and `bin/check` runs it. A stub cannot know the Layers panel order, placement on real frames or relaunch data. The script `tests/figma-api-check.js` checks those, run inside Figma. The script `tests/render-check.sh` checks how the window renders. [`tests/MANUAL.md`](tests/MANUAL.md) says how to run both and when they last passed.

## Data this plugin stores

It stores data in two places, both small.

| Where | What |
|---|---|
| `clientStorage` | One key, `organize-layers:settings`. It holds the separator, the grouping toggle, the flow direction and the two gap values. It is per user and per plugin, and survives file changes. It is a few dozen bytes against the 5 MB budget. |
| Relaunch data | Written by `setRelaunchData` on the parent of the arranged layers. This is `pluginData` on that node, enforced at 100 kB per entry. It travels with the file, so a collaborator opening it sees the button. It is one entry, one short description string. |

It uses no `sharedPluginData` and makes no network calls.
