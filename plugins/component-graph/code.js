// Component Graph — v3.7.2 · plugin-standard v1.4.0
// @ts-check
//
// One file-wide scan produces everything the plugin knows:
//   • an upstream index    (who instantiates whom, 1 level deep)
//   • page placements      (instances sitting directly on pages/frames)
//   • instance totals      (how many live instances each component has)
//   • a component catalog  (local + external-seen-in-use, publish status,
//                           derived library provenance)
//
// Plus, on demand only, a library health check — see "Library health" below.
//
// The scan runs in two phases so the sidebar appears fast:
//   Phase A — load pages, catalog components + publish status → partial index
//   Phase B — resolve every instance → final index, then cached to
//             clientStorage so the *next* launch paints instantly from cache
//             while a fresh scan runs behind it.
//
// Downstream ("what does the selected component contain") stays live per
// selection: a single-subtree walk is cheap and always current.

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const UI_SIZE = { width: 1180, height: 660 };
const SELECTION_DEBOUNCE_MS = 120;
const INSTANCE_BATCH = 250;  // parallel async plugin-API calls per chunk
const SELECT_CAP = 250;      // max instances selected from a details page line
const CACHE_KEEP = 5;        // per-file sidebar caches retained (LRU by last use)
const LIBMAP_MAX = 20000;    // provenance map entry cap (clientStorage is finite)
const LIBCHECK_BATCH = 8;    // concurrent library probes (each is a round-trip)
const LIBCHECK_RETRIES = 1;  // extra attempts before a rejection counts as missing

figma.showUI(__html__, { width: UI_SIZE.width, height: UI_SIZE.height, themeColors: true });
// A read-only walk (skill-standard §B 3): Figma skips what is hidden inside an instance. Nothing is lost, since an
// instance nested in another is a mirrored copy the graph already discards (resolveInstance).
figma.skipInvisibleInstanceChildren = true;

// ─────────────────────────────────────────────────────────────────────────────
// Node helpers
// ─────────────────────────────────────────────────────────────────────────────

function isComponentLike(node) {
  return node && (node.type === "COMPONENT" || node.type === "COMPONENT_SET");
}

// Collapses a variant (COMPONENT inside a COMPONENT_SET) up to its parent set,
// so the graph shows "Button" rather than "Type=Primary, Size=Large".
function collapseToSet(node) {
  if (node.type === "COMPONENT" && node.parent && node.parent.type === "COMPONENT_SET") {
    return node.parent;
  }
  return node;
}

function nearestComponentAncestor(node, includeSelf) {
  let current = includeSelf ? node : node.parent;
  while (current) {
    if (isComponentLike(current)) return current;
    current = current.parent;
  }
  return null;
}

function pageOf(node) {
  let current = node;
  while (current && current.type !== "PAGE") current = current.parent;
  return current || null;
}

// True if this instance sits inside another instance's subtree — a mirrored
// copy of a nested component, not a placement anyone authored here. Mirrored
// copies are excluded everywhere; each nesting counts once, where authored.
function isNestedInsideAnotherInstance(node) {
  let current = node.parent;
  while (current) {
    if (current.type === "INSTANCE") return true;
    if (current.type === "PAGE") return false;
    current = current.parent;
  }
  return false;
}

// First instance on each branch only — content inside an instance belongs to a
// deeper level of the graph, keeping this view genuinely 1-deep.
function findTopLevelInstances(root) {
  const results = [];
  (function walk(node) {
    if (!node.children) return;
    for (const child of node.children) {
      if (child.type === "INSTANCE") results.push(child);
      else walk(child);
    }
  })(root);
  return results;
}

function isRemote(node) {
  return node.remote === true;
}

// Figma's plugin API doesn't expose a remote component's source library name
// (an open feature request), so provenance is derived from the naming
// convention most libraries follow: "Library / Category / Name" → "Library".
// Returns null when the name carries no prefix.
function libraryGroupOf(name) {
  const i = name.indexOf("/");
  return i > 0 ? name.slice(0, i).trim() || null : null;
}

// Runs fn over items in bounded-concurrency chunks. Keeps huge pages (tens of
// thousands of instances) from spawning that many simultaneous promises.
async function mapInBatches(items, batchSize, fn) {
  const out = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const chunk = await Promise.all(items.slice(i, i + batchSize).map(fn));
    for (const c of chunk) out.push(c);
  }
  return out;
}

// Resolve an instance to its main component; shared by every scan path.
async function resolveInstance(inst) {
  try {
    if (isNestedInsideAnotherInstance(inst)) return null; // mirrored copy
    const main = await inst.getMainComponentAsync();
    if (!main) return { unresolved: true };
    return { main, container: nearestComponentAncestor(inst, false) };
  } catch (e) {
    return { unresolved: true };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// File index
//
// fileIndex = {
//   upstream:       Map<variantOrComponentId, Map<containerSetId, { count, variantNames:Set }>>
//   pagePlacements: Map<collapsedComponentId, Map<pageId, { pageName, count }>>
//   usage:          Map<collapsedComponentId, number>   // every authored instance
//   components:     Map<collapsedComponentId, meta>
//   unresolvedCount: number
// }
// meta = { id, name, type, pageId, pageName, remote, key, publishStatus, libraryGroup }
// ─────────────────────────────────────────────────────────────────────────────

let fileIndex = null;
let indexBuildPromise = null;
let indexStale = false;
const watchedPageIds = new Set();

const CACHE_KEY = "component-graph-cache::" + figma.root.name;

// ── Library provenance map (self-seeding) ───────────────────────────────────
// clientStorage is shared across files, so every time the plugin runs it
// records this file's component keys → this file's name. In any consumer file,
// a remote component whose key appears in the map resolves to its *exact*
// source library name — no API needed, it converges as the team's library
// files are opened. The "Library / Name" prefix heuristic stays as fallback
// for libraries never opened with the plugin.
const LIBMAP_KEY = "component-graph-libmap";
let libraryMap = {}; // componentKey → source file name

async function loadLibraryMap() {
  try {
    const stored = await figma.clientStorage.getAsync(LIBMAP_KEY);
    if (stored && typeof stored === "object") libraryMap = stored;
  } catch (e) { /* storage unavailable */ }
}

// entries: { componentKey: fileName } gathered from this file's local
// components (sets AND their variants, since remote mains resolve at variant
// level and a remote variant's parent set isn't always reachable).
async function seedLibraryMap(entries) {
  const keys = Object.keys(entries);
  if (!keys.length) return;
  for (const k of keys) libraryMap[k] = entries[k]; // update in-memory first

  // clientStorage is a finite, plugin-wide budget: cap the map, keeping the
  // current file's entries (freshest) and as many older ones as fit.
  const allKeys = Object.keys(libraryMap);
  if (allKeys.length > LIBMAP_MAX) {
    const trimmed = {};
    for (const k of keys) trimmed[k] = entries[k];
    for (const k of allKeys) {
      if (Object.keys(trimmed).length >= LIBMAP_MAX) break;
      if (!(k in trimmed)) trimmed[k] = libraryMap[k];
    }
    libraryMap = trimmed;
  }

  try {
    await figma.clientStorage.setAsync(LIBMAP_KEY, libraryMap);
  } catch (e) { /* storage full/unavailable — in-memory map still works this session */ }
}

function metaFor(node, page, publishStatus) {
  const p = page || pageOf(node);
  const remote = isRemote(node);
  return {
    id: node.id,
    name: node.name,
    type: node.type,
    pageId: p ? p.id : null,
    pageName: p ? p.name : null,
    remote,
    // A local main that no page can reach: deleted from this file, but kept by
    // Figma so its surviving instances can still be restored. Phase A only ever
    // sees components that live on a page, so this can only come from Phase B
    // resolving an instance back to an off-tree main.
    orphan: !remote && !p,
    key: node.key || null,
    // Remote components are published by definition (that's how they got here).
    publishStatus: publishStatus || (remote ? "CURRENT" : "UNKNOWN"),
    // Exact source library name if this key was seeded by running the plugin
    // inside that library file; the name-prefix heuristic is the fallback.
    libraryName: remote && node.key ? (libraryMap[node.key] || null) : null,
    libraryGroup: remote ? libraryGroupOf(node.name) : null
  };
}

function serializeCatalog(componentsMap, usageMap) {
  return Array.from(componentsMap.values()).map((m) => ({
    id: m.id,
    name: m.name,
    type: m.type,
    pageId: m.pageId,
    pageName: m.pageName,
    remote: m.remote,
    orphan: !!m.orphan,
    publishStatus: m.publishStatus,
    libraryName: m.libraryName,
    libraryGroup: m.libraryGroup,
    usage: usageMap ? (usageMap.get(m.id) || 0) : null
  }));
}

async function buildFileIndex() {
  const upstream = new Map();
  const pagePlacements = new Map();
  const usage = new Map();
  const components = new Map();
  let unresolvedCount = 0;

  const pages = figma.root.children;
  const total = pages.length;

  // Seeded provenance must be loaded before metaFor runs on remote components.
  await loadLibraryMap();
  const seedEntries = {};

  // ── Phase A: pages + component catalog + publish status ──────────────────
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    figma.ui.postMessage({ type: "progress", phase: "components", done: i, total, pageName: page.name });
    await page.loadAsync();

    const allComponentNodes = page.findAllWithCriteria({ types: ["COMPONENT", "COMPONENT_SET"] });

    // Every local component key (sets and variants alike) maps to this file's
    // name — this is what lets other files resolve exact provenance later.
    for (const n of allComponentNodes) {
      if (!isRemote(n) && n.key) seedEntries[n.key] = figma.root.name;
    }

    const componentNodes = allComponentNodes
      .filter((n) => !(n.type === "COMPONENT" && n.parent && n.parent.type === "COMPONENT_SET"));

    const statuses = await mapInBatches(componentNodes, INSTANCE_BATCH, (n) =>
      n.getPublishStatusAsync ? n.getPublishStatusAsync().catch(() => "UNKNOWN") : Promise.resolve("UNKNOWN")
    );
    componentNodes.forEach((n, j) => components.set(n.id, metaFor(n, page, statuses[j])));
  }

  seedLibraryMap(seedEntries); // fire-and-forget; in-memory map updates synchronously

  // Sidebar can render the moment the catalog exists — instance counts follow.
  figma.ui.postMessage({
    type: "index",
    quality: "partial",
    components: serializeCatalog(components, null),
    unresolvedCount: 0
  });

  // ── Phase B: resolve every instance (the dominant cost) ──────────────────
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    figma.ui.postMessage({ type: "progress", phase: "instances", done: i, total, pageName: page.name });

    const instances = page.findAllWithCriteria({ types: ["INSTANCE"] });
    const results = await mapInBatches(instances, INSTANCE_BATCH, resolveInstance);

    for (const r of results) {
      if (!r) continue;
      if (r.unresolved) { unresolvedCount++; continue; }

      const target = collapseToSet(r.main);
      usage.set(target.id, (usage.get(target.id) || 0) + 1);

      // External components enter the catalog the moment we see them used.
      if (!components.has(target.id)) components.set(target.id, metaFor(target, null, null));

      if (r.container) {
        // Instance authored inside another component → an upstream edge.
        const containerSet = collapseToSet(r.container);
        if (!upstream.has(r.main.id)) upstream.set(r.main.id, new Map());
        const inner = upstream.get(r.main.id);
        if (!inner.has(containerSet.id)) inner.set(containerSet.id, { count: 0, variantNames: new Set() });
        const entry = inner.get(containerSet.id);
        entry.count++;
        if (r.container.id !== containerSet.id) entry.variantNames.add(r.container.name);
      } else {
        // Instance sitting directly on a page/frame → a page placement.
        if (!pagePlacements.has(target.id)) pagePlacements.set(target.id, new Map());
        const perPage = pagePlacements.get(target.id);
        if (!perPage.has(page.id)) perPage.set(page.id, { pageName: page.name, count: 0 });
        perPage.get(page.id).count++;
      }
    }
  }

  figma.ui.postMessage({ type: "progress", phase: "instances", done: total, total, pageName: null });
  return { upstream, pagePlacements, usage, components, unresolvedCount };
}

// Every page is loaded once the index is built, so per-page nodechange watchers
// attach for free (unlike documentchange, which under dynamic-page access would
// force loadAllPagesAsync on every launch). We only flag staleness — the user
// decides when a rescan of a possibly huge file is worth it.
function watchForStaleness() {
  for (const page of figma.root.children) {
    if (watchedPageIds.has(page.id)) continue;
    watchedPageIds.add(page.id);
    try {
      page.on("nodechange", () => {
        if (!indexStale) {
          indexStale = true;
          figma.ui.postMessage({ type: "stale" });
        }
      });
    } catch (e) { /* page not loaded — shouldn't happen post-build */ }
  }
}

function emptyIndex() {
  return { upstream: new Map(), pagePlacements: new Map(), usage: new Map(), components: new Map(), unresolvedCount: 0 };
}

async function ensureFileIndex(forceRebuild) {
  if (forceRebuild) fileIndex = null;
  if (fileIndex) return fileIndex;
  if (!indexBuildPromise) {
    indexBuildPromise = buildFileIndex()
      .then((result) => {
        fileIndex = result;
        indexStale = false;
        watchForStaleness();
        postSidebar();
        saveCache(result);
        return result;
      })
      .catch((e) => {
        // Never leave the plugin wedged on a spinner: report, degrade to an
        // empty index for this call, and leave fileIndex null so Refresh
        // retries the scan from scratch.
        figma.notify("Component Graph: scan failed — press Refresh to retry.");
        figma.ui.postMessage({ type: "index-error" });
        return emptyIndex();
      })
      .finally(() => { indexBuildPromise = null; });
  }
  return indexBuildPromise;
}

function postSidebar() {
  if (!fileIndex) return;
  figma.ui.postMessage({
    type: "index",
    quality: "final",
    components: serializeCatalog(fileIndex.components, fileIndex.usage),
    unresolvedCount: fileIndex.unresolvedCount
  });
}

// ── clientStorage cache: instant sidebar on the next launch ─────────────────
// Only serializable catalog data is stored (never node references). Keyed by
// file name — an id would be better, but figma.fileKey isn't exposed to public
// plugins; the payload double-checks the name to avoid cross-file bleed.
const CACHE_REGISTRY_KEY = "component-graph-cache-registry";

async function saveCache(index) {
  try {
    // LRU registry: remember which files have caches, evict the oldest beyond
    // CACHE_KEEP so heavy multi-file use can't exhaust the storage budget.
    const registry = (await figma.clientStorage.getAsync(CACHE_REGISTRY_KEY)) || {};
    registry[figma.root.name] = Date.now();
    const byRecency = Object.keys(registry).sort((a, b) => registry[b] - registry[a]);
    for (const stale of byRecency.slice(CACHE_KEEP)) {
      delete registry[stale];
      try { await figma.clientStorage.deleteAsync("component-graph-cache::" + stale); } catch (e) { /* already gone */ }
    }
    await figma.clientStorage.setAsync(CACHE_REGISTRY_KEY, registry);

    await figma.clientStorage.setAsync(CACHE_KEY, {
      fileName: figma.root.name,
      savedAt: Date.now(),
      components: serializeCatalog(index.components, index.usage)
    });
  } catch (e) { /* storage unavailable — cache is a nicety, not a dependency */ }
}

async function hydrateFromCache() {
  try {
    const cached = await figma.clientStorage.getAsync(CACHE_KEY);
    if (cached && cached.fileName === figma.root.name && Array.isArray(cached.components)) {
      figma.ui.postMessage({
        type: "index",
        quality: "cached",
        components: cached.components,
        unresolvedCount: 0
      });
    }
  } catch (e) { /* no cache */ }
}

// ─────────────────────────────────────────────────────────────────────────────
// Library health — "does this external component still exist upstream?"
//
// A component deleted from its library leaves every instance here working:
// Figma keeps a local mirror of the main, so getMainComponentAsync resolves and
// the component looks perfectly healthy to a scan. getPublishStatusAsync can't
// help either — outside the library file itself it answers UNPUBLISHED for
// everything, which is why the catalog assumes CURRENT for remote components.
//
// The one API that actually asks the library is importComponentByKeyAsync:
// documented to reject when no published component has that key. So each
// distinct remote key gets probed once. That's a network round-trip per key, so
// this never runs as part of a scan — the UI asks for it explicitly.
//
// Honesty about what a rejection means: an un-enabled library, a file you lack
// access to, and a genuinely deleted component all reject the same way. The
// verdict is therefore reported as "not found in any enabled library", not
// "deleted" — and if EVERY probe fails, that's read as a connectivity/access
// problem and nothing is flagged at all.
// ─────────────────────────────────────────────────────────────────────────────

let libraryCheck = null;      // Map<componentId, "present" | "missing">
let libraryCheckRunning = false;

// One probe, with a retry so a transient failure can't masquerade as a deletion.
async function probeLibraryKey(meta) {
  for (let attempt = 0; attempt <= LIBCHECK_RETRIES; attempt++) {
    try {
      if (meta.type === "COMPONENT_SET") await figma.importComponentSetByKeyAsync(meta.key);
      else await figma.importComponentByKeyAsync(meta.key);
      return "present";
    } catch (e) {
      if (attempt === LIBCHECK_RETRIES) return "missing";
    }
  }
  return "missing";
}

async function checkLibraries() {
  if (libraryCheckRunning) return;
  const index = await ensureFileIndex(false);

  const targets = Array.from(index.components.values()).filter((m) => m.remote && m.key);
  if (!targets.length) {
    libraryCheck = new Map();
    figma.ui.postMessage({ type: "library-check", done: true, total: 0, results: [], inconclusive: false });
    return;
  }

  libraryCheckRunning = true;
  libraryCheck = new Map();
  const results = [];
  try {
    for (let i = 0; i < targets.length; i += LIBCHECK_BATCH) {
      const chunk = targets.slice(i, i + LIBCHECK_BATCH);
      const verdicts = await Promise.all(chunk.map(probeLibraryKey));
      chunk.forEach((m, j) => {
        libraryCheck.set(m.id, verdicts[j]);
        results.push({ id: m.id, status: verdicts[j] });
      });
      figma.ui.postMessage({
        type: "library-check", done: false,
        checked: Math.min(i + LIBCHECK_BATCH, targets.length), total: targets.length
      });
    }

    // Every single probe failing says more about the connection or library
    // access than about the components — flag nothing rather than everything.
    const missing = results.filter((r) => r.status === "missing").length;
    const inconclusive = missing === results.length && results.length >= 4;
    if (inconclusive) libraryCheck = null;

    figma.ui.postMessage({
      type: "library-check", done: true, total: targets.length,
      results: inconclusive ? [] : results, inconclusive
    });
  } finally {
    libraryCheckRunning = false;
  }
}

function libraryStatusOf(id) {
  return libraryCheck ? (libraryCheck.get(id) || null) : null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Browse history — component ids, independent of canvas selection so it also
// works for external (library) components that can't be selected at all.
// ─────────────────────────────────────────────────────────────────────────────

let history = [];
let historyIndex = -1;
let lastShownId = null;

function pushHistory(id) {
  if (history[historyIndex] === id) return;
  history = history.slice(0, historyIndex + 1);
  history.push(id);
  historyIndex = history.length - 1;
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared lookups (graph + details use the same code paths)
// ─────────────────────────────────────────────────────────────────────────────

function graphNodeShape(target, count, variantNames) {
  const meta = fileIndex && fileIndex.components.get(target.id);
  return {
    id: target.id,
    name: meta ? meta.name : target.name,
    count,
    variantNames: Array.from(variantNames || []),
    pageName: meta ? meta.pageName : (pageOf(target) ? pageOf(target).name : null),
    remote: meta ? meta.remote : isRemote(target),
    orphan: meta ? !!meta.orphan : false,
    libraryStatus: libraryStatusOf(target.id),
    usage: fileIndex ? (fileIndex.usage.get(target.id) || 0) : null
  };
}

// Upstream = component containers (from the index) + page placements.
async function upstreamFor(selected, index) {
  const upstreamMap = new Map();
  const nodeCache = new Map(); // containerId → node (avoid re-fetching across variants)
  let unresolvedCount = 0;

  const variantIds = selected.type === "COMPONENT_SET"
    ? selected.children.map((c) => c.id)
    : [selected.id];

  for (const vId of variantIds) {
    const inner = index.upstream.get(vId);
    if (!inner) continue;
    for (const [containerId, edge] of inner) {
      if (containerId === selected.id) continue; // self-nesting edge case

      if (!nodeCache.has(containerId)) {
        nodeCache.set(containerId, await figma.getNodeByIdAsync(containerId));
      }
      const containerNode = nodeCache.get(containerId);
      if (!containerNode) { unresolvedCount += edge.count; continue; } // deleted since build

      if (!upstreamMap.has(containerId)) {
        upstreamMap.set(containerId, graphNodeShape(containerNode, 0, new Set()));
      }
      const entry = upstreamMap.get(containerId);
      entry.count += edge.count;
      for (const vn of edge.variantNames) {
        if (entry.variantNames.indexOf(vn) === -1) entry.variantNames.push(vn);
      }
    }
  }

  const perPage = index.pagePlacements.get(selected.id);
  const pages = perPage
    ? Array.from(perPage.entries())
        .map(([pageId, v]) => ({ pageId, pageName: v.pageName, count: v.count }))
        .sort((a, b) => b.count - a.count)
    : [];

  return { entries: Array.from(upstreamMap.values()), pages, unresolvedCount };
}

// Downstream = live walk of the selected subtree.
async function downstreamFor(selected) {
  const downstreamMap = new Map();
  let unresolvedCount = 0;
  let totalInstances = 0;

  const results = await mapInBatches(findTopLevelInstances(selected), INSTANCE_BATCH, async (inst) => {
    try {
      const main = await inst.getMainComponentAsync();
      return main ? { main } : { unresolved: true };
    } catch (e) {
      return { unresolved: true };
    }
  });

  for (const r of results) {
    if (r.unresolved) { unresolvedCount++; continue; }
    totalInstances++;
    const target = collapseToSet(r.main);
    if (!downstreamMap.has(target.id)) downstreamMap.set(target.id, graphNodeShape(target, 0, new Set()));
    const entry = downstreamMap.get(target.id);
    entry.count++;
    if (r.main.id !== target.id && entry.variantNames.indexOf(r.main.name) === -1) {
      entry.variantNames.push(r.main.name);
    }
  }
  return { entries: Array.from(downstreamMap.values()), totalInstances, unresolvedCount };
}

// ─────────────────────────────────────────────────────────────────────────────
// Graph building
// ─────────────────────────────────────────────────────────────────────────────

let buildToken = 0; // discard results of superseded builds

async function buildGraphForId(id, opts) {
  opts = opts || {};
  const token = ++buildToken;

  const node = await figma.getNodeByIdAsync(id);
  if (!node || !isComponentLike(node)) {
    figma.notify("That component no longer exists.");
    return false;
  }
  const selected = collapseToSet(node);

  figma.ui.postMessage({ type: "loading" });
  const index = await ensureFileIndex(false);
  if (token !== buildToken) return true;

  const down = await downstreamFor(selected);
  if (token !== buildToken) return true;
  const up = await upstreamFor(selected, index);
  if (token !== buildToken) return true;

  if (!opts.fromHistory) pushHistory(selected.id);
  lastShownId = selected.id;

  figma.ui.postMessage({
    type: "graph",
    selected: {
      id: selected.id,
      name: selected.name,
      kind: selected.type,
      remote: isRemote(selected),
      orphan: !!(index.components.get(selected.id) || {}).orphan,
      libraryStatus: libraryStatusOf(selected.id),
      usage: index.usage.get(selected.id) || 0,
      // The "Used by" column lists components only; this count lets the UI
      // explain an empty column when all usage is directly on pages/frames.
      pagePlacementCount: up.pages.reduce((s, p) => s + p.count, 0),
      viaInstance: !!opts.viaInstance
    },
    downstream: down.entries,
    upstream: up.entries,
    canGoBack: historyIndex > 0,
    canGoForward: historyIndex < history.length - 1,
    unresolvedCount: down.unresolvedCount + up.unresolvedCount + index.unresolvedCount,
    stale: indexStale
  });
  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// Details panel payload
// ─────────────────────────────────────────────────────────────────────────────

function detailsList(entries) {
  return entries
    .map((e) => ({ id: e.id, name: e.name, count: e.count, remote: e.remote }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

async function buildDetailsForId(id) {
  const node = await figma.getNodeByIdAsync(id);
  if (!node || !isComponentLike(node)) {
    figma.notify("That component no longer exists.");
    return;
  }
  const selected = collapseToSet(node);
  const index = await ensureFileIndex(false);
  const meta = index.components.get(selected.id) || metaFor(selected, null, null);

  const up = await upstreamFor(selected, index);
  const down = await downstreamFor(selected);

  let variants = null;
  if (selected.type === "COMPONENT_SET") {
    let props = [];
    try { props = Object.keys(selected.variantGroupProperties || {}); } catch (e) { /* invalid set */ }
    variants = { count: selected.children.length, props };
  }

  let description = "";
  try { description = selected.description || ""; } catch (e) { /* remote without access */ }

  figma.ui.postMessage({
    type: "details",
    d: {
      id: selected.id,
      name: selected.name,
      kind: selected.type,
      remote: meta.remote,
      orphan: !!meta.orphan,
      libraryStatus: libraryStatusOf(selected.id), // null until the check is run
      libraryName: meta.libraryName,   // exact, from the seeded map; null if never seeded
      libraryGroup: meta.libraryGroup, // derived from name prefix; null if underivable
      pageName: meta.pageName,
      publishStatus: meta.publishStatus,
      description,
      usage: index.usage.get(selected.id) || 0,
      insideComponents: {
        instances: up.entries.reduce((s, e) => s + e.count, 0),
        list: detailsList(up.entries)
      },
      pages: up.pages,
      contains: {
        instances: down.totalInstances,
        list: detailsList(down.entries)
      },
      variants,
      key: meta.key
    }
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Canvas selection → graph
// ─────────────────────────────────────────────────────────────────────────────

// Maps whatever is selected to the component to show: a component/set/variant
// directly, an instance's main component, or the nearest component ancestor
// (so clicking a layer deep inside a component still shows that component).
async function componentIdFromSelection() {
  const selection = figma.currentPage.selection;
  if (selection.length !== 1) return null;
  const picked = selection[0];

  if (isComponentLike(picked)) {
    return { id: collapseToSet(picked).id, viaInstance: false };
  }
  if (picked.type === "INSTANCE") {
    try {
      const main = await picked.getMainComponentAsync();
      if (main) return { id: collapseToSet(main).id, viaInstance: true };
    } catch (e) { /* unresolvable */ }
    return null;
  }
  const ancestor = nearestComponentAncestor(picked, false);
  if (ancestor) return { id: collapseToSet(ancestor).id, viaInstance: false };
  return null;
}

async function onSelectionSettled() {
  const hit = await componentIdFromSelection();
  if (!hit) {
    // Empty canvas / unrelated layers keep the current graph; the sidebar and
    // history remain the way to move around.
    if (!lastShownId) {
      figma.ui.postMessage({
        type: "empty",
        message: "Select a component on the canvas, or pick one from the sidebar."
      });
    }
    return;
  }
  if (hit.id === lastShownId) return;
  await buildGraphForId(hit.id, { viaInstance: hit.viaInstance });
}

let debounceTimer = null;
function scheduleSelectionBuild() {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    onSelectionSettled();
  }, SELECTION_DEBOUNCE_MS);
}

// Select + zoom to a local node. Returns false for missing/external nodes.
async function selectAndReveal(id) {
  const node = await figma.getNodeByIdAsync(id);
  if (!node || isRemote(node)) return false;
  const page = pageOf(node);
  if (!page) return false;
  if (page.id !== figma.currentPage.id) await figma.setCurrentPageAsync(page);
  figma.currentPage.selection = [node];
  figma.viewport.scrollAndZoomIntoView([node]);
  return true;
}

// Select every instance of a component sitting directly on a given page
// (clicking a page line in the details panel). Batched with an early exit so a
// huge page stops resolving once the cap is hit.
async function selectInstancesOnPage(componentId, pageId) {
  const page = await figma.getNodeByIdAsync(pageId);
  if (!page || page.type !== "PAGE") return;
  await page.loadAsync();

  const instances = page.findAllWithCriteria({ types: ["INSTANCE"] });
  const matches = [];
  for (let i = 0; i < instances.length && matches.length < SELECT_CAP; i += INSTANCE_BATCH) {
    const chunk = await Promise.all(
      instances.slice(i, i + INSTANCE_BATCH).map(async (inst) => {
        try {
          if (isNestedInsideAnotherInstance(inst)) return null;
          if (nearestComponentAncestor(inst, false)) return null; // lives inside a component
          const main = await inst.getMainComponentAsync();
          return main && collapseToSet(main).id === componentId ? inst : null;
        } catch (e) {
          return null;
        }
      })
    );
    for (const m of chunk) {
      if (m && matches.length < SELECT_CAP) matches.push(m);
    }
  }

  if (!matches.length) {
    figma.notify("No instances found on that page — try Refresh.");
    return;
  }
  if (page.id !== figma.currentPage.id) await figma.setCurrentPageAsync(page);
  figma.currentPage.selection = matches;
  figma.viewport.scrollAndZoomIntoView(matches);
  figma.notify("Selected " + matches.length + (matches.length === SELECT_CAP ? "+" : "") +
    " instance" + (matches.length === 1 ? "" : "s") + " on " + page.name);
}

// ─────────────────────────────────────────────────────────────────────────────
// Insert the graph on the canvas as native nodes.
//
// The UI walks its rendered SVG and sends a primitive display list (rects,
// texts, bezier paths) with all CSS-variable colors already resolved — so the
// canvas artifact matches the on-screen graph exactly, including the current
// expand state, with no layout logic duplicated here. Native nodes (not an SVG
// import) so the result has real, editable text and clean vectors.
// ─────────────────────────────────────────────────────────────────────────────

function solidPaint(c) {
  return { type: "SOLID", color: { r: c.r, g: c.g, b: c.b }, opacity: c.a === undefined ? 1 : c.a };
}

async function loadFirstAvailableFont(candidates) {
  for (const f of candidates) {
    try { await figma.loadFontAsync(f); return f; } catch (e) { /* try next */ }
  }
  return null;
}

async function insertGraphOnCanvas(spec) {
  const regular = await loadFirstAvailableFont([
    { family: "Inter", style: "Regular" }, { family: "Roboto", style: "Regular" }
  ]);
  if (!regular) { figma.notify("Couldn't load a font (Inter or Roboto) — canvas insert aborted."); return; }
  const semibold = await loadFirstAvailableFont([
    { family: "Inter", style: "Semi Bold" }, { family: "Inter", style: "Bold" }, { family: "Roboto", style: "Bold" }
  ]) || regular;
  const italic = await loadFirstAvailableFont([
    { family: "Inter", style: "Italic" }, { family: "Roboto", style: "Italic" }
  ]) || regular;

  const frame = figma.createFrame();
  frame.name = "Component graph — " + spec.name;
  frame.resize(spec.width, spec.height);
  frame.fills = spec.bg && spec.bg.a > 0 ? [solidPaint(spec.bg)] : [];
  frame.cornerRadius = 8;

  for (const it of spec.items) {
    if (it.t === "path") {
      const v = figma.createVector();
      // Path data arrives pre-rebased to its own bbox origin; the bbox min is
      // carried in it.x/it.y. Set position AFTER vectorPaths, since assignment
      // recomputes the node's geometry.
      v.vectorPaths = [{ windingRule: "NONE", data: it.d }];
      v.strokes = [solidPaint(it.stroke)];
      v.strokeWeight = it.sw;
      v.fills = [];
      v.opacity = it.opacity;
      v.x = it.x || 0;
      v.y = it.y || 0;
      frame.appendChild(v);

    } else if (it.t === "rect") {
      const r = figma.createRectangle();
      r.resize(it.w, it.h);
      r.x = it.x; r.y = it.y;
      r.cornerRadius = it.r;
      r.fills = it.fill && it.fill.a > 0 ? [solidPaint(it.fill)] : [];
      if (it.stroke) {
        r.strokes = [solidPaint(it.stroke)];
        r.strokeWeight = it.sw;
        if (it.dash) r.dashPattern = it.dash;
      } else {
        r.strokes = [];
      }
      frame.appendChild(r);

    } else if (it.t === "text") {
      const t = figma.createText();
      t.fontName = it.italic ? italic : (it.semibold ? semibold : regular);
      t.characters = it.text;
      t.fontSize = it.size;
      t.fills = [solidPaint(it.fill)];
      if (it.ls) t.letterSpacing = { unit: "PIXELS", value: it.ls };
      t.x = it.x;
      // SVG positions text by baseline; Figma by the line box top. Align the
      // two by matching optical centers (browser text center ≈ baseline − 0.35em).
      t.y = (it.baseline - it.size * 0.35) - t.height / 2;
      frame.appendChild(t);
    }
  }

  frame.x = Math.round(figma.viewport.center.x - spec.width / 2);
  frame.y = Math.round(figma.viewport.center.y - spec.height / 2);
  figma.currentPage.selection = [frame];
  figma.viewport.scrollAndZoomIntoView([frame]);
  figma.notify("Graph added to canvas");
}

// ─────────────────────────────────────────────────────────────────────────────
// Messages from the UI
// ─────────────────────────────────────────────────────────────────────────────

figma.ui.onmessage = async (msg) => {
  try {
    await handleUiMessage(msg);
  } catch (e) {
    figma.notify("Component Graph: something went wrong — try again or Refresh.");
  }
};

async function handleUiMessage(msg) {
  if (msg.type === "refresh") {
    if (debounceTimer) { clearTimeout(debounceTimer); debounceTimer = null; }
    libraryCheck = null; // verdicts belong to the index they were probed against
    await ensureFileIndex(true);
    if (lastShownId) await buildGraphForId(lastShownId, { fromHistory: true });
    // If the details panel is open, the UI passes its component along so the
    // panel is rebuilt from the fresh index too.
    if (msg.detailsId) buildDetailsForId(msg.detailsId);

  } else if (msg.type === "open-component") {
    // Local components get selected on canvas (the selectionchange that follows
    // builds the graph); external ones can't be selected → direct build.
    lastShownId = null; // force a rebuild even for the same component
    const revealed = await selectAndReveal(msg.id);
    if (!revealed) buildGraphForId(msg.id, {});

  } else if (msg.type === "insert-graph") {
    insertGraphOnCanvas(msg.spec);

  } else if (msg.type === "get-details") {
    buildDetailsForId(msg.id);

  } else if (msg.type === "check-libraries") {
    await checkLibraries();
    // The graph and the open details panel both carry a library-status field.
    if (lastShownId) await buildGraphForId(lastShownId, { fromHistory: true });
    if (msg.detailsId) buildDetailsForId(msg.detailsId);

  } else if (msg.type === "select-instances-on-page") {
    selectInstancesOnPage(msg.componentId, msg.pageId);

  } else if (msg.type === "go-back" || msg.type === "go-forward") {
    const delta = msg.type === "go-back" ? -1 : 1;
    const targetIndex = historyIndex + delta;
    if (targetIndex < 0 || targetIndex >= history.length) return;
    historyIndex = targetIndex;
    const id = history[targetIndex];
    const ok = await buildGraphForId(id, { fromHistory: true });
    if (ok) {
      await selectAndReveal(id); // best effort; no-op for external components
    } else {
      history.splice(targetIndex, 1); // prune dead entries
      historyIndex = Math.min(historyIndex, history.length - 1);
    }
  }
}

figma.on("selectionchange", scheduleSelectionBuild);

// Registers the plugin in the file's right-panel "Tools" section (root-level
// relaunch data). Idempotent: only writes when not already set, so opening the
// plugin doesn't dirty a file that already has the entry. This is the one
// document write the plugin performs besides explicit "Add to canvas".
function ensureRelaunchButton() {
  try {
    const data = figma.root.getRelaunchData();
    if (!data || !("open" in data)) {
      figma.root.setRelaunchData({ open: "Explore component dependencies and usage" });
    }
  } catch (e) { /* view-only file or API unavailable — skip quietly */ }
}

// ─────────────────────────────────────────────────────────────────────────────
// Startup: file name first, cached sidebar (if any) immediately, then the real
// scan in the background, then whatever is already selected.
// ─────────────────────────────────────────────────────────────────────────────

(async () => {
  figma.ui.postMessage({ type: "file-info", fileName: figma.root.name });
  figma.ui.postMessage({
    type: "empty",
    message: "Select a component on the canvas, or pick one from the sidebar."
  });
  ensureRelaunchButton();
  await hydrateFromCache();
  await ensureFileIndex(false);
  onSelectionSettled();
})();
