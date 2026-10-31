# Layer organiser

Arranges layers on the canvas from their names. With grouping on, the text before
the separator picks the **column** and the text after it orders the **rows** inside
that column: `1 - 1`, `1 - 2`, `1 - 3` stack in one column, `2 - 1` starts the next,
`3 - 1` the one after — a layer that is alone in its group still gets its own column.
With grouping off, every layer becomes its own column, in name order.

**Flow direction** decides which way the groups run. *Horizontal* (the default) puts
each group in a column, side by side: `1 - 1`, `1 - 2`, `1 - 3` stack downwards and
`2 - 1` starts the next column. *Vertical* is the transpose — each group is a row,
members running left to right, and the next group starts the row below. Grouping and
sort order are identical either way; only the placement changes.

The first layer lands on **0, 0** and everything is placed from there, so the grid
has a fixed origin rather than one that depends on wherever the layers were sitting.
Inside a frame or section that is its top-left corner; on a page it is the canvas
origin.

Groups are spaced by a real **gap**: each one clears its own widest member when they
run across, or its own tallest when they run down, so groups of unequal size never
overlap. Members are spaced the same way from their own width or height.

The separator defaults to `-` and can be any string. Sorting is number-aware, so
`1 - 10` follows `1 - 9` rather than landing between `1 - 1` and `1 - 2`.

## Scope
The current selection, or — when nothing is selected — every top-level layer on the
page. Only layers that share one parent are moved: `x`/`y` are parent-relative, so
mixing parents would place layers by coordinates that don't mean the same thing.
Layers inside an auto-layout frame are skipped, because the frame owns their position.
The count of skipped layers is shown under the button.

## The Layers panel
A run also reorders the layers inside their parent so the Layers panel reads in the
same order as the canvas, group by group: under *Horizontal* the first column top to
bottom, then the next; under *Vertical* the first row left to right, then the next. This changes
z-order, which is harmless here because the arrangement never overlaps layers — but
it does mean a deliberate stacking order among the arranged layers is not preserved.

## Re-running
After a successful run the plugin writes a relaunch button onto whatever holds the
arranged layers — the page, or the frame or section they sit in. Selecting that
parent shows **Organise layers** in the Design panel, and clicking it re-runs
immediately with the settings last saved from the UI: no window, one notification,
undoable like any other edit.

Reaching the button means selecting the container, so the relaunch path reads a lone
selected node with children as "arrange what is inside it" rather than "arrange this
one node", which is what the plain selection rule would otherwise do. With the button
on the page, nothing is selected and the whole page is arranged.

Removing the button: right-click the parent → Plugins → the button's own remove control.

## Run
Figma → Plugins → Development → Import plugin from manifest → select this folder's `manifest.json`.
A changed manifest needs a re-import; "run last plugin" will not pick it up.

## Data this plugin stores
Two places, both small.

- `clientStorage`, one key — `organize-layers:settings`: the separator, the grouping
  toggle, the flow direction, and the two gap values. Per user, per plugin, survives file changes; a few
  dozen bytes against the 5 MB budget.
- **Relaunch data** on the parent of the arranged layers, written by `setRelaunchData`.
  This is `pluginData` on that node (100 kB per entry, enforced) and it travels with
  the file, so a collaborator opening the file sees the button. One entry, one short
  description string.

No `sharedPluginData`, no network calls.
