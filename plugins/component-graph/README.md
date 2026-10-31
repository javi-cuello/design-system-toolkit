# Component Graph — v3.6

A Figma plugin that shows, for any component, what it's built from and what it's used by — one level deep in each direction — plus a sidebar for browsing every component the file knows about.

## Publishing to Figma Community

Listing copy lives in `COMMUNITY.md`. Prerequisites and gotchas:

**Prerequisites**
- The Figma **desktop app** (macOS or Windows) — publishing is impossible from the browser.
- **Two-factor authentication enabled** on your Figma account.
- A real plugin id — already set (`1666041422909265264`, issued by Figma when the plugin was linked). If you ever start a fresh plugin from this code, Figma issues a new id via Plugins → Development → *New plugin* → "Link existing plugin"; don't hand-write one.

**The flow** (desktop app): Figma logo → Plugins → Manage plugins → ⋯ next to the plugin → Publish. Four modal pages: Describe your resource (name, tagline, description, category), Choose some images, Data security (optional disclosure form), Add the final details (publisher identity, support contact, network access label, contributors, comments). Then Publish submits it for review.

**Assets**: icon 128×128, thumbnail 1920×1080, optionally a playground file and up to nine carousel images/videos. The graph itself (via "Add to canvas") makes good carousel material.

**Network access**: with `networkAccess: { allowedDomains: ["none"] }` the listing shows the **No access to network** label automatically — a real trust signal, and worth keeping true. The library check does not compromise it: `importComponentByKeyAsync` is a first-party Figma API, not a `fetch` from the plugin sandbox or UI, so `networkAccess` still correctly declares that the plugin itself makes no network requests. (`grep -cE 'fetch\(|XMLHttpRequest|WebSocket' code.js ui.html` returns 0 for both files.)

**Data security disclosure**: optional, but approval can take up to two weeks and it runs in parallel with review — submit it at the same time if you want it live early. This plugin's answers are simple: nothing is sent anywhere by the plugin; `clientStorage` holds only component names/keys locally. The library check asks Figma's own library service whether a key is still published, via the plugin API — no third party is involved and nothing about the file is transmitted beyond the component key being looked up.

**Test matrix before submitting:** an empty file (friendly empty state, no wedge), a large multi-page file (progress bar, batched scan), a plain non-library file (publish filter auto-disables), a consumer file using several libraries (External tab, provenance tiers, library check finds everything), a file with a known deleted library component (it lands in "Not found in any library"), a file with a deleted local main whose instances survive ("Deleted from this file"), offline (every probe fails → "Couldn't reach the libraries", nothing flagged), and mid-scan file edits (stale strip appears). Run the whole matrix in **both light and dark theme** — the UI is token-driven and the standard requires the visual retest.

**Document writes are minimal and deliberate:** "Add to canvas" (explicit), plus a one-time root-level `setRelaunchData` that registers the plugin in the file's right-panel Tools section — written only if not already present, so reopening never re-dirties a file. Reviewers look for unexpected file mutation, so it's worth stating in the support/description text.

**After approval**: updates don't need re-review — publish them immediately. Listing text and images can be edited any time without publishing a code update (Community page → Manage resource → Edit this page).

## What changed in v3.6 (missing components, native UI pass)

**Components that no longer exist upstream are now findable.** Deleting a component from a library doesn't break the consumer file: Figma keeps a local copy of the main, so instances keep rendering, `getMainComponentAsync` resolves, and nothing in a scan can tell a healthy library component from a deleted one. `getPublishStatusAsync` is no help either — [outside the library file itself it answers `UNPUBLISHED` for everything](https://forum.figma.com/t/publishstatus/67837), which is exactly why the catalog assumes `CURRENT` for remote components. The one API that actually asks the library is `figma.importComponentByKeyAsync`, [documented to reject when no published component has that key](https://developers.figma.com/docs/plugins/api/figma/), so each distinct remote key gets probed with it.

That's a network round-trip per external component, so it is never part of a scan: the External tab carries a **Check** button, and the verdicts live for the session (a Refresh discards them, since they were probed against the old index). Missing components lead the tab under "Not found in any library", carry a red instance count — the number that says what a fix would cost — and appear in the graph as a red dashed node and in the details panel as a "Library link" row. The sidebar's own count is the summary; a banner above the graph was tried and dropped as redundant with it.

The wording is deliberately "not found in any enabled library", not "deleted": a library that isn't enabled in this file, and one you lack access to, reject exactly the same way. Each probe retries once so a transient failure can't masquerade as a deletion, and if *every* probe fails that's read as a connectivity or access problem — nothing is flagged at all, and the row says "Couldn't reach the libraries".

**Local orphans come free.** A main deleted from *this* file resolves to a component no page can reach, which needs no network call at all. Those used to sit unlabelled in a "No page" group; they now lead the Local tab under "Deleted from this file", with the "Restore component" hint.

**UI conformance pass.** The blue hover on the Local/External tabs turned out to be the ui-base collision skill-standard §B 4 warns about: tabs are `<button>`s that never restated `:hover`, so the baseline's bare `button:hover{background:brand-hover}` won. The same collision made the *off* toggle turn brand-blue on hover (reading as on) and put a blue block behind the Read-more link. Every bespoke control now declares its own height, `box-sizing`, hover and disabled state rather than inheriting the baseline's by accident. Alongside: disabled toolbar buttons use `--figma-color-text-disabled` instead of an opacity dim (also §4), the toggle knob uses `--figma-color-icon-onbrand` instead of `#fff`, graph-node hover is a token fill instead of a `brightness()` filter that darkened in dark theme, details rows hover with a background wash instead of turning blue, and cursors are Figma-native `default` throughout.

## What changed in v3.5 (relaunch, focus, provenance hint)

The plugin now registers itself in the right panel's Tools section via root-level relaunch data (declared in the manifest, written idempotently on first run), so it can be relaunched from the file without going through the plugins menu. Focus styling is unified: the browser's default focus ring follows the OS accent color (which produced stray orange rings next to the plugin's blue), so all interactive elements now share a single accent-colored `:focus-visible` treatment. And the External tab shows a short footer hint whenever the unnamed "From libraries" group is present, teaching the seeding mechanism exactly where the gap is visible. For third-party kits whose library files you'll never open, exact names remain a REST-API roadmap item — inferring them from bound variables was considered and rejected, since tokens typically live in a separate library and the inference would mislabel confidently.

## What changed in v3.4 (community hardening)

Robustness work for running on arbitrary strangers' files. A failed scan can no longer wedge the plugin on a spinner: the build promise catches, notifies, posts an error state (sidebar shows "Scan failed — press Refresh to retry"), degrades the current request to an empty index, and leaves state clean so Refresh retries from scratch. The UI message dispatcher is wrapped so one failed action notifies instead of dying silently. Publish-status calls are now batched like everything else (a components page can hold thousands). clientStorage use is bounded: per-file sidebar caches keep an LRU of the 5 most recent files (older caches are deleted via a small registry), and the provenance map caps at 20k entries with the current file's entries always winning. Empty files get a proper "No components in this file yet" state, distinct from "nothing matches your filters".

## What changed in v3.3 (add to canvas)

**The graph can now be inserted onto the canvas as an editable frame.** An "Add to canvas" toolbar button (enabled whenever a graph is shown) materializes the current view as native Figma nodes — rounded rectangles, real text, and vector bezier edges — centered in the viewport and selected, named `Component graph — <name>`. Native nodes rather than `createNodeFromSvg`, because the SVG import path chokes on CSS variables and produces poor text; this way the artifact is fully editable and drops cleanly into documentation pages. To guarantee the inserted frame matches the screen exactly (current theme colors, current "+N more" expand state), the UI serializes its own rendered SVG into a primitive display list — resolving every CSS-variable color via `getComputedStyle` — and the main thread just materializes primitives, so no layout logic is duplicated. UI-only affordances (the ⓘ circles, the "See details →" hint) are excluded from the export. Fonts load with a fallback chain (Inter Regular/Semi Bold/Italic → Bold → Roboto), SVG baseline coordinates are converted to Figma's top-of-line-box positioning by matching optical centers, and edge paths are normalized to Figma's space-separated path grammar. Edge vectors need one extra step: Figma normalizes `vectorPaths` into the node's local coordinate space on assignment, so absolute coordinates don't survive — each path is therefore rebased to its own bounding-box origin in the UI (exact for these curves, whose control points sit at the endpoints' extremes) and the vector node is positioned at that offset, making Figma's normalization a no-op.

## What changed in v3.2 (self-seeding provenance)

**The plugin now learns real library names by being used.** `clientStorage` is shared across files, so every run records the current file's component keys (sets *and* variants) mapped to the file's name — about 30 lines, invisible, no network, no manifest change. In any consumer file, a remote component whose key appears in the map resolves to its exact source library name; the `Library / Name` prefix heuristic remains as fallback for libraries never opened with the plugin. For a design-system team this converges to exact provenance almost immediately, since opening your own library files is routine. The details panel says which tier it's showing: "Learned by opening that library file" (exact), "Derived from the component name" (heuristic), or "Unknown — open the library file with this plugin to learn it". Sidebar groups prefer the exact name; the prefix is only stripped from row labels when it matches the group. Caveats: the map is per-user (a teammate's plugin hasn't seen your libraries), and a renamed library updates on its next open.

## What changed in v3.1 (details & provenance update)

**Used by is components-only again.** Page rows are gone from the graph — that column now answers exactly one question: which components contain this one. Page-level usage moved entirely to the details panel's "On pages" list (still clickable to select the instances on canvas). When the column is empty but the component *is* used, the placeholder says so — "246 on pages, none in components — See details →" — with the hint clickable, so the original "Used by (0)" confusion can't recur.

**External components group by library.** Figma's plugin API still doesn't expose a remote component's source library name (it's an open feature request), so provenance is derived from the naming convention most libraries follow: `Library / Category / Name` → grouped under `Library`, with the redundant prefix stripped from row labels inside each group. Un-prefixed externals fall into a trailing "From libraries" group. The details panel shows the derived library name (labeled as derived), or states plainly that Figma's API doesn't expose it.

**Details panel refinements.** The description clamps to 3 lines with a Read more toggle that only appears when something is actually hidden. "Contains" and "Inside components" are now vertical, scannable name×count lists — each line clickable to jump to that component's graph and details. Refresh (toolbar or stale strip) rebuilds the open details panel from the fresh index, not just the graph and sidebar. The ⓘ affordance lives only on graph nodes now; sidebar rows are back to being purely navigational.

**Cleanup pass.** Instance resolution runs in bounded batches (250 concurrent) everywhere — the index build, downstream walks, and page selection — so a page with tens of thousands of instances no longer spawns that many simultaneous promises; page selection also exits early once the 250-instance cap is hit. A shared `resolveInstance` helper replaced three near-identical inline closures, container-node lookups are memoized per graph build, and magic numbers moved to named constants.

## What changed in v3 (sidebar & details update)

**The sidebar reads like a library panel.** The title is now the file name, groups are collapsible per page, rows are taller with a rounded active highlight, and arrow keys move a focus cursor through the list (Enter opens, Escape clears search) instead of scrolling the container. A Local | External segmented control appears at the top — but only when the file actually contains both local and external components; otherwise it stays hidden and the single population shows.

**"Show unpublished" replaces "Unused only."** The switch (styled after Figma's native toggle, off by default) filters by real publish status via `getPublishStatusAsync()`: by default the list mirrors what the library publishes; toggled on, helpers, WIP, and `.private` components appear too. If nothing in the file is published, the filter auto-disables so the list never comes up empty. The `unused` badge remains per-row; publish status also shows in the details panel (Published / Published — unpublished changes / Unpublished).

**Instant sidebar on launch.** The scan now runs in two phases — components + publish status first (sidebar renders), instance counting second — and the finished catalog is cached to `clientStorage` keyed by file name, so subsequent launches paint the full list immediately from cache while a fresh scan runs in the background. Index messages carry a quality rank (partial < cached < final) so a slower message can never downgrade a better one.

**"Used by (0)" is fixed for real.** Instances placed directly on pages/frames (rather than inside another component) are now indexed as *page placements* and rendered as page rows at the bottom of the Used by column — so a component with 246 direct placements shows `Screens ×180`, `Marketing ×66` instead of "None". Clicking a page row selects those instances on canvas (capped at 250) and zooms to them. Copy throughout now says "instances" — Figma's own term — instead of "placements".

**Details panel replaces tooltips.** Every component (sidebar rows on hover, graph nodes always) has a small ⓘ that opens a right-hand panel with the metadata as a scannable list: type, page, publish status, description, instance count, inside-components breakdown, on-pages breakdown (each line clickable to select), contained components, variant count + property names, and the component key.

## What changed from v1

**One scan powers everything.** v1 built a file-wide upstream index but treated it as a private cache for the graph. v2 turns that same scan into the plugin's single source of truth: it now also produces a component catalog (every local component and set, plus every external one seen in use) and total usage counts for each. The sidebar, the graph, and the usage badges are all projections of one data structure, so they can never disagree, and the file is still only scanned once per Refresh — never per click.

**Sidebar navigation.** The left panel lists all components grouped by page, with external library components in a trailing "From libraries" group. It's searchable, shows a placement count per component, flags components with zero placements as `unused`, and has an "Unused only" filter — which quietly turns the plugin into a dead-component finder, one of the most common real problems in maturing libraries. Clicking an item selects and zooms to it on canvas (local) or opens its graph directly (external). The plugin is now useful with nothing selected at all.

**External (library) components are first-class.** v1 silently degraded when instances resolved to remote components: they appeared in the graph but clicking them failed, and their page showed as blank. v2 knows a component is remote, renders it with a dashed border and a "library" tag, and opens its graph without trying to select it on canvas (remote nodes can't be selected). Note that the Figma plugin API cannot enumerate the contents of a remote library — only variables are listable via `figma.teamLibrary`, not components — so external components enter the catalog the honest way: by being discovered in use in this file.

**Staleness is detected, not guessed.** v1's cache could silently drift after edits, with a comment explaining why `documentchange` wasn't an option (under `dynamic-page` access it forces `loadAllPagesAsync` on every launch). v2 uses the granular alternative Figma recommends instead: after the index build every page is already loaded, so `page.on("nodechange")` watchers attach for free. Any edit shows a "file changed — counts may be outdated" strip with a Refresh button. The data is never rebuilt behind the user's back on a possibly huge file; they decide when a rescan is worth it.

**Selection handling is more forgiving.** Selecting any layer *inside* a component now shows that component's graph (nearest component ancestor), instead of only accepting components, sets, and instances. Clicking empty canvas no longer wipes the view — the current graph stays put and the sidebar/history remain the way to move around. Variant selections still collapse to their parent set.

**History works everywhere.** History now stores component ids rather than piggybacking on canvas selection, so back/forward works for external components too. Dead entries (deleted components) are pruned instead of stranding the pointer.

**Smaller correctness and UX fixes.** Concurrent graph builds are token-guarded so a slow build can't overwrite a newer one. Index builds report per-page progress ("Scanning page 3/12 — Screens"). The UI uses `themeColors: true` and Figma's `--figma-color-*` tokens, so it follows the editor's light/dark theme. Reduced-motion preference disables the spinner animation. Node tooltips now include each component's total placement count.

## Architecture

`code.js` is organized into sections rather than one flat script:

1. **Node helpers** — pure functions (`collapseToSet`, `nearestComponentAncestor`, `isNestedInsideAnotherInstance`, `findTopLevelInstances`).
2. **File index** — `buildFileIndex()` walks every page once, resolving each page's instances in parallel, and returns `{ upstream, usage, components, unresolvedCount }`. Mirrored instances (copies inside another instance's subtree) are excluded from both usage and upstream, so every nesting is counted exactly once, where it was authored. Upstream edges are stored pre-collapsed (`variantId → containerSetId`), so graph time is pure lookup with no live node references to go stale.
3. **History** — an id list independent of canvas selection.
4. **Graph building** — downstream is the one live computation (a single-subtree walk, cheap and always current); upstream and all metadata come from the index.
5. **Selection & messages** — debounced `selectionchange`, `open-component` / `go-back` / `go-forward` / `refresh` from the UI.

6. **Library health** — `checkLibraries()` probes each distinct remote key with `importComponentByKeyAsync` / `importComponentSetByKeyAsync` in bounded-concurrency chunks. Verdicts are in-memory only and are dropped on Refresh.

The UI ↔ main-thread protocol: `progress`, `index` (sidebar catalog), `graph`, `details`, `library-check`, `empty`, `loading`, `stale` going up; `open-component`, `get-details`, `check-libraries`, `select-instances-on-page`, `insert-graph`, `go-back`, `go-forward`, `refresh` coming down.

## Data this plugin stores

- **`clientStorage`** (local to your machine, shared across files, no network): the component-key → library-name provenance map (capped at 20 000 entries), per-file sidebar caches of the serialized catalog (LRU, 5 files) plus the small registry that manages them. Names, ids, keys and counts only — never node contents.
- **Document data**: one root-level `setRelaunchData` entry so the plugin appears in the file's right-panel Tools section, written only if not already present. Plus whatever "Add to canvas" inserts, which is explicit.
- **Not stored at all**: library-check verdicts. They live for the session and are discarded on Refresh, because a cached "missing" would keep accusing a component that has since been republished.

## Known limitations

The upstream view covers this file only: if another file consumes this library, those usages are invisible to the plugin runtime (that would require the REST API — see roadmap). "Unused" therefore means *unused in this file*; for a published library, a component with zero local placements may still be used by consumers. New pages created after the index is built aren't watched for staleness until the next Refresh. Remote components discovered via usage show name and key but not their source library's name — the plugin API doesn't expose it.

The library check cannot distinguish *deleted upstream* from *library not enabled in this file* or *no access to that library* — all three reject identically — which is why its verdict is worded "not found in any enabled library" and why the group carries a confirm-before-deleting caveat. It also can't tell you *when* a component disappeared, or what replaced it.

## Roadmap ideas (from looking at what adjacent plugins solve)

**Cross-file usage via the REST API.** With `networkAccess` and a personal access token, the plugin could query `GET /v1/analytics/libraries/:file_key/component/usages` (library analytics) or scan consumer files, turning "unused in this file" into "unused across the org" — the number people actually want before deleting anything. This is the standard workaround for the plugin API's inability to see other files; community plugins that browse team library components do the same dance, caching data written while running inside the library file.

**Library health beyond usage.** Detached-instance detection (instances that were disconnected and drifted), components with deprecated names still in circulation, and adoption/coverage metrics (what share of a screen is built from library components vs. loose layers) are the other recurring asks in the design-systems space, and all three fall out of the same full-file scan this plugin already performs.

**Depth-2 exploration.** The graph is deliberately 1-deep, with navigation as the way to go deeper. A middle ground — expanding a single neighbor in place to preview *its* neighbors without losing the current center — would make dependency chasing faster without turning the view into spaghetti.

**Persistent index via `clientStorage`.** Serializing the index (ids, names, counts — no node references) would let the sidebar appear instantly on launch from the last session's data, marked stale, while the fresh scan runs behind it. Biggest win in very large files.

**Export.** Dumping the full dependency graph as JSON/DOT for docs or CI checks (e.g. "fail if anything depends on `Deprecated/*`").

## Files

- `manifest.json` — unchanged (`dynamic-page` document access, no network).
- `code.js` — main thread: index, graph, history, selection.
- `ui.html` — sidebar + graph rendering, single file, no build step.
