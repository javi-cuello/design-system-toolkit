# Theme Switcher

Two choices and one button: **Theme**, **Brand**, **Apply**.

**Version 3.11.2** · runs with no build step: import `manifest.json` via Figma → Plugins → Development.

Setting a theme by hand means visiting every collection that carries it — the colour primitives, the semantics, the brand — and picking the same mode in each. That is what this does in one click, on the selected layers.

It knows no collection or mode names. It reads the shape of the file instead:

- **Theme** — a mode name that two or more collections *with a choice* both offer. In a file whose colour, semantic and brand collections all carry `Light` and `Dark`, that is exactly `Light` and `Dark`; `Mode 1` on five single-mode collections is not a theme, and neither is a breakpoint set only one collection defines.
- **Brand** — the [extended collections](https://help.figma.com/hc/en-us/articles/32131755337367) in the file, plus a base entry. The base is the *absence* of an extension pin rather than a collection of its own, which is what lets the row work in a consuming file where the parent is remote. It is named by following the parent's tokens to the primitives they alias and reading the segment after `Brand/` — `Colour/Brand/Acme/Primary/5` gives **Acme** — because the collection's own name states its job, not a brand. Fallbacks: the collection name, then "Default". The row is absent in a file with no extensions.

- **Choice** — any other collection with modes to pick that the theme does not cover, one row each under the collection's name. This is how a file that keeps brands as modes of one collection (`Semantic - Brand` with `A` and `B`) gets its brand switched: no extension, no theme name, but still a choice. Shape cannot tell a brand set from a density set, so the row says which collection it sets rather than guessing.

Each row is segmented buttons up to three options and a select beyond that — four segments in a 300px panel truncate any real brand name.

Apply sets the theme on every collection that offers it, pins each choice row's mode, pins the chosen brand, and clears the brands you did not choose — including pins left by an earlier published generation of that collection, which is what otherwise resolves to a default nobody picked.

**Clear** is not the opposite of Apply. It is the reset button: every mode pin on the **current page and everything on it**, whatever set them, with or without a selection. Scope here has to be that wide — a pin on a nested frame overrides the one above it, and a pin on the page node itself is invisible to any walk that starts from the selection, so anything narrower reports success while the canvas does not move.

## Three things the API forces

**An extension is only reachable once something pins it.** `getAvailableLibraryVariableCollectionsAsync` lists extended collections, but `getVariablesInLibraryCollectionAsync` returns none for them — an extension shares its parent's variables — so importing a variable resolves to the parent and the extension never appears. Resolving the bare `VariableCollectionId:<key>` was tried against a live library: `null` for all six collections. The only handle left is an id already written on a node, so the plugin scans **the whole document** for pins and remembers what it finds in this file. Pin a brand once, anywhere in the file, from Figma's own mode menu, and it stays on the list. Page scope was tried first and was the wrong boundary: opening the plugin on a page that happens not to pin a brand offered no brand at all, in a file that plainly has one.

**A collection's id is not stable across published generations.** The same collection resolved through an imported variable came back as `…/1233:2790` while the id stored on a node was `…/1225:1037`. Comparing whole ids reports "nothing is pinned" on a layer that plainly is, so every comparison here uses the key — the half before the slash.

**A team-library call can simply not come back.** `getVariablesInLibraryCollectionAsync` never resolved for one subscribed collection in seven seconds, twice, while the collection beside it answered in one millisecond. Awaited plainly that is a window that never fills. Every team-library call is raced against a timeout, the whole library phase is capped at three seconds and resolved once per open, and what is already known — local collections and the pins in the file — is shown before the library is asked at all.

## Why there is no "apply to the page"
A mode pinned on a page is overridden by every frame below it that carries its own pin, so an Apply with nothing selected reported "1 layer" and the canvas did not move — the plugin saying it had worked while nothing had. Apply is disabled with an empty selection instead, and the panel says so ("Apply needs a layer · Clear covers the page"). Clear stays enabled: it is the page-wide reset described above, and needs no selection.

## A fourth thing the API forces
**A pin set on an extension is cleared through its parent.** `clearExplicitVariableModeForCollection(extension)` does nothing at all — it does not throw, and the pin stays. Pass the parent collection instead. The same asymmetry runs the other way at the start: *setting* the extension's mode replaces the parent's entry rather than adding one, because the two share a slot.

## Data this plugin stores
- **Relaunch data** on `figma.root`: one `switch` entry, so *Switch theme or brand* appears under **Tools** in the right-hand panel. Written once, never rewritten — the write is a document edit.
- `clientStorage`: the window size only (`themeSwitcherSize`).
- `pluginData` on `figma.root`: `themeSwitcherKnownCollections`, the ids of collections resolved in this file, so an extension stays offered on pages that do not pin it (ids that stop resolving are dropped on the next read); and `themeSwitcherBrandNames`, the base brand names derived here, so the first open pays for the derivation and no later one does.
