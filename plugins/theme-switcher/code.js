// Theme Switcher — v3.11.0 · standard v1.8.0
// @ts-check

/*
 * Two choices and one button: a theme, a brand, Apply.
 *
 * v1 matched collections and modes by NAME — patterns like "Primitive -
 * Colour" and modes called "brand a"/"brand b" — one project's arrangement
 * written into a tool every project uses. v2 removed the names but replaced
 * them with the raw truth: every pinnable collection, every mode, one row
 * each. That is a mode inspector, not a theme switcher; nobody wants to set
 * Light on four collections by hand.
 *
 * So this version knows no names either, but it reads the shape instead of
 * listing it:
 *
 *   THEME  — a mode name shared by two or more collections that HAVE a
 *            choice (two modes or more). In a file whose colour, semantic
 *            and brand collections all carry Light and Dark, that is exactly
 *            Light and Dark; a lone collection's "Mode 1" never qualifies.
 *   BRAND  — the extended collections in the file, plus a base entry that
 *            means no extension pinned. The row is absent in a file with no
 *            extensions.
 *   CHOICE — any other collection with modes to pick that the theme does
 *            not cover: brands kept as modes of one collection rather than
 *            as extensions, say. Shape cannot tell a brand set from a
 *            density set, so each is its own row under its collection's name.
 *
 * Apply sets the chosen theme on every collection that offers it, pins the
 * chosen brand, and clears the brands not chosen, in one action, on the
 * selection. Clear is the reset: every pin on the page, whatever set it.
 */


// §B 3: read-only traversal skips invisible instance children. This plugin
// walks pages looking for mode pins, and an invisible variant's children can
// never carry one that matters.
figma.skipInvisibleInstanceChildren = true;

// The Tools entry in the right-hand panel, so this is reachable without the
// plugin menu. Written once — the write is a document edit, and rewriting it
// on every run would show up as an edit in a file nobody touched. Quiet on a
// view-only file.
try {
  if (!("switch" in figma.root.getRelaunchData())) {
    figma.root.setRelaunchData({ switch: "Set the theme and brand on a layer" });
  }
} catch (e) { /* view-only */ }

figma.showUI(__html__, { themeColors: true, width: 300, height: 232, title: "Theme Switcher" });

var SIZE_KEY = "themeSwitcherSize";
// Collections this plugin has resolved before, in THIS file. Document data
// the plugin owns (skill-standard §B 6). Discovery is page-scoped — an
// extension is only reachable through an id already written on a node — so
// without this, a brand offered on one page vanishes on the next. Ids that
// stop resolving are dropped on the next read.
var KNOWN_KEY = "themeSwitcherKnownCollections";
// Brand names this plugin has derived in THIS file. Deriving one means
// following a sample of the parent's tokens to the primitives they alias,
// which is not something the instant pass can afford — so the first open
// shows the collection's name for as long as that takes, and every open
// after it is right immediately.
var BRAND_KEY = "themeSwitcherBrandNames";
// Both slow sources are memoised as PROMISES, not as their results. Holding
// the result meant setting the variable before the work finished, so a second
// caller arriving mid-flight saw a warm cache, skipped the instant path and
// waited out the full pass behind it — which is precisely how the window came
// to sit blank for six seconds while the fast answer was already available.
var libPromise = null;   // team-library collections, resolved once per open
var pinsPromise = null;  // the other pages' pins, hunted at most once
// The current page's pins, cached per page. model() runs on every selection
// change, and re-walking a large page each time is what made clicking a
// button in the panel feel like it hung. Writes invalidate it; so does
// stepping onto another page.
var pageCache = { id: "", pins: null };
var colCache = {};       // collection id → collection, for the same reason

/**
 * What a change applies to: the selection, and nothing else.
 *
 * Falling back to the page when nothing was selected looked helpful and was
 * a trap. A mode pinned on the page is overridden by every frame below it
 * that carries its own pin, so Apply reported "1 layer" and the canvas did
 * not move — the plugin telling you it had worked while nothing had. Apply
 * is disabled with an empty selection instead.
 */
function targets() {
  return figma.currentPage.selection.slice();
}

/**
 * The key a collection keeps across generations.
 *
 * A remote collection's id is `VariableCollectionId:<key>/<local id>`, and the
 * local half CHANGES between published generations: resolving a collection
 * through an imported variable gave `…/1233:2790` while the same collection,
 * set on a node, was stored as `…/1225:1037`. Comparing whole ids therefore
 * says "nothing is pinned" on a node that plainly is. The key is the stable
 * half, so every comparison here uses it.
 */
/**
 * Resolve a promise, or give up on it.
 *
 * `getVariablesInLibraryCollectionAsync` does not always come back: against a
 * real library one subscribed collection never resolved in seven seconds,
 * twice, while the collection beside it answered in one millisecond. Awaited
 * plainly that is a plugin whose window never fills — no error, no list, no
 * way to tell it apart from a slow file. Every team-library call here is
 * therefore raced, and a source that does not answer is simply left out.
 */
var reported = {};
function within(promise, ms) {
  return Promise.race([
    promise.catch(function (e) {
      // Say it once. Swallowing these silently is how this plugin shipped
      // three versions calling figma.teamLibrary without the "teamlibrary"
      // permission: every call threw, the guard turned each throw into an
      // empty list, and the plugin reported nothing at all.
      var m = (e && e.message) || String(e);
      if (!reported[m]) { reported[m] = true; figma.notify(m, { error: true }); }
      return null;
    }),
    new Promise(function (done) { setTimeout(function () { done(null); }, ms); }),
  ]);
}

function keyOf(id) {
  var s = String(id || "");
  var at = s.indexOf("/");
  return at === -1 ? s : s.slice(0, at);
}

/**
 * Team-library collections, resolved the long way round: there is no API that
 * hands over a remote collection object, so one variable per library
 * collection is imported and its `variableCollectionId` resolved. Runs once
 * per open — against a real library the dead call below costs 1.5s of the
 * 3s budget, and paying that on every selection change would make the window
 * feel broken.
 */
async function resolveLibrary() {
  var out = [];
  var lib = (await within(figma.teamLibrary.getAvailableLibraryVariableCollectionsAsync(), 2000)) || [];
  var deadline = Date.now() + 3000;      // the whole phase, not per call
  for (var l = 0; l < lib.length; l++) {
    if (Date.now() > deadline) { break; }
    var vars = (await within(figma.teamLibrary.getVariablesInLibraryCollectionAsync(lib[l].key), 1500)) || [];
    if (!vars.length) { continue; }                       // hidden tier, extension, or no answer
    var imported = await within(figma.variables.importVariableByKeyAsync(vars[0].key), 1500);
    if (!imported) { continue; }
    var col = await figma.variables.getVariableCollectionByIdAsync(imported.variableCollectionId);
    if (col) { out.push(col); }
  }
  return out;
}

/**
 * Hunt other pages for a pinned extension, one page at a time, stopping at
 * the first one found.
 *
 * Page scope was the wrong boundary — opening the plugin on a page that
 * happens not to pin a brand offered no brand at all — but the first fix went
 * too far the other way: `loadAllPagesAsync()` keeps every page in memory for
 * as long as the plugin is open, which is the cost `documentAccess:
 * dynamic-page` exists to avoid, and in a large file it makes Figma itself
 * feel heavy (dragging the plugin window stutters). It is also usually
 * wasted: the file remembers the collections it has resolved before, so this
 * runs only when nothing known is an extension, and stops as soon as one
 * turns up.
 */
async function huntExtensions(known) {
  var found = {};
  var pages = figma.root.children;
  for (var i = 0; i < pages.length; i++) {
    if (pages[i].id === figma.currentPage.id) { continue; }     // already walked
    await pages[i].loadAsync();
    var fresh = [];
    var stack = pages[i].children.slice();
    var modes = pages[i].explicitVariableModes;
    if (modes) { Object.keys(modes).forEach(function (k) { if (!found[k]) { found[k] = true; fresh.push(k); } }); }
    while (stack.length) {
      var n = stack.pop();
      var m = n.explicitVariableModes;
      if (m) { Object.keys(m).forEach(function (k) { if (!found[k]) { found[k] = true; fresh.push(k); } }); }
      if (n.children) { for (var c = 0; c < n.children.length; c++) { stack.push(n.children[c]); } }
    }
    var hit = false;
    for (var f = 0; f < fresh.length; f++) {
      if (known[keyOf(fresh[f])]) { continue; }
      var col = await figma.variables.getVariableCollectionByIdAsync(fresh[f]);
      if (col && col.isExtension) { hit = true; }
    }
    if (hit) { break; }
  }
  return found;
}

/**
 * Every collection this file can pin a mode on, from two sources because
 * neither is complete on its own.
 *
 * Local collections come straight from the API, and library collections are
 * resolved by importing one of their variables — there is no API that hands
 * over a remote collection object directly.
 *
 * EXTENDED COLLECTIONS need the second source. `getAvailableLibraryVariable-
 * CollectionsAsync` does list them, but `getVariablesInLibraryCollectionAsync`
 * returns none — an extension shares its parent's variables — so importing a
 * variable resolves to the PARENT and the extension never appears. The only
 * handle the API leaves is an id already written on a node, so the page is
 * scanned for pins and anything found there is offered too. Consequence, and
 * it is a real one: a file that has never pinned a brand cannot be offered
 * that brand here. Pin it once from Figma's own mode menu and it appears.
 */
async function collections(quick) {
  var found = [];
  var seen = {};
  var add = function (col) {
    if (!col || seen[keyOf(col.id)]) { return; }
    seen[keyOf(col.id)] = true;
    found.push(col);
  };

  var local = await figma.variables.getLocalVariableCollectionsAsync();
  for (var i = 0; i < local.length; i++) { add(local[i]); }

  if (!quick) {
    if (!libPromise) { libPromise = resolveLibrary(); }
    var fromLib = await libPromise;
    for (var q = 0; q < fromLib.length; q++) { add(fromLib[q]); }
  }

  if (pageCache.id !== figma.currentPage.id || !pageCache.pins) {
    var here = {};
    var roots = figma.currentPage.children.slice();
    var pageModes = figma.currentPage.explicitVariableModes;
    if (pageModes) { Object.keys(pageModes).forEach(function (k) { here[k] = true; }); }
    while (roots.length) {
      var r = roots.pop();
      var rm = r.explicitVariableModes;
      if (rm) { Object.keys(rm).forEach(function (k) { here[k] = true; }); }
      if (r.children) { for (var rc = 0; rc < r.children.length; rc++) { roots.push(r.children[rc]); } }
    }
    pageCache = { id: figma.currentPage.id, pins: here };
  }
  var pinned = {};
  Object.keys(pageCache.pins).forEach(function (k) { pinned[k] = true; });
  var remembered = [];
  try { remembered = JSON.parse(figma.root.getPluginData(KNOWN_KEY) || "[]"); } catch (e) { remembered = []; }
  for (var r = 0; r < remembered.length; r++) { pinned[remembered[r]] = true; }

  // Only when nothing to hand is an extension is the rest of the document
  // worth the pages it costs to read.
  if (!quick) {
    var haveExt = false;
    for (var e = 0; e < found.length; e++) { if (found[e].isExtension) { haveExt = true; } }
    if (!haveExt) {
      var knownKeys = {};
      Object.keys(pinned).forEach(function (k) { knownKeys[keyOf(k)] = true; });
      found.forEach(function (c) { knownKeys[keyOf(c.id)] = true; });
      if (!pinsPromise) { pinsPromise = huntExtensions(knownKeys); }
      var elsewhere = await pinsPromise;
      Object.keys(elsewhere).forEach(function (k) { pinned[k] = true; });
    }
  }

  // Resolving a pinned id is a round trip each, and model() runs on every
  // selection change. Cached for the session: a collection does not change
  // shape while the plugin is open.
  var pinnedIds = Object.keys(pinned);
  var alive = [];
  for (var p = 0; p < pinnedIds.length; p++) {
    if (colCache[pinnedIds[p]] === undefined) {
      colCache[pinnedIds[p]] = await figma.variables.getVariableCollectionByIdAsync(pinnedIds[p]);
    }
    var col = colCache[pinnedIds[p]];
    if (!col) { continue; }                     // a generation that no longer resolves
    alive.push(col.id);
    add(col);
  }
  try { figma.root.setPluginData(KNOWN_KEY, JSON.stringify(alive)); } catch (e) { /* read-only file */ }
  return found;
}

/**
 * What the base brand is actually called.
 *
 * The collection holding it is named for its job — `Semantic - Brand`, say —
 * so offering that as one of two brand choices reads as a category beside a
 * name. The brand's own name is in the file, one level down: these tokens
 * alias primitives called `Colour/Brand/Acme/Primary/5`, and the segment
 * after `Brand/` is the answer. Derived by tallying a sample rather than
 * trusting the first hit; the collection's own name is the fallback when the
 * primitives are not named that way, and "Default" when there is no parent
 * collection to name at all.
 */
var brandNames = null;
function rememberedNames() {
  if (brandNames) { return brandNames; }
  try { brandNames = JSON.parse(figma.root.getPluginData(BRAND_KEY) || "{}"); } catch (e) { brandNames = {}; }
  return brandNames;
}

async function baseBrandName(parent, quick) {
  if (!parent) { return "Default"; }
  var cached = rememberedNames()[keyOf(parent.id)];
  if (cached || quick) { return cached || parent.name; }
  var fallback = parent.name;
  var mode = parent.modes[0].modeId;
  var tally = {};
  var vars = [];
  var ids = (parent.variableIds || []).slice(0, 10);
  for (var d = 0; d < ids.length; d++) { vars.push(await figma.variables.getVariableByIdAsync(ids[d])); }
  if (!vars.length) {
    // A REMOTE collection's `variableIds` under-reports and is routinely
    // empty, which is the whole of a consuming file — the case this name is
    // for. The library route is the only one left: list the collection's
    // variables and import a few to get objects with values on them.
    var byKey = (await within(figma.teamLibrary.getVariablesInLibraryCollectionAsync(keyOf(parent.id).replace("VariableCollectionId:", "")), 2000)) || [];
    for (var b = 0; b < byKey.length && b < 10; b++) {
      vars.push(await within(figma.variables.importVariableByKeyAsync(byKey[b].key), 2000));
    }
  }
  for (var i = 0; i < vars.length; i++) {
    var v = vars[i];
    if (!v) { continue; }
    var val = v.valuesByMode ? v.valuesByMode[mode] : null;
    if (!val || val.type !== "VARIABLE_ALIAS") { continue; }
    var target = await figma.variables.getVariableByIdAsync(val.id);
    if (!target) { continue; }
    var m = /(?:^|\/)Brand\/([^/]+)\//.exec(target.name);
    if (!m) { continue; }
    tally[m[1]] = (tally[m[1]] || 0) + 1;
  }
  var best = "";
  Object.keys(tally).forEach(function (n) { if (!best || tally[n] > tally[best]) { best = n; } });
  if (!best) { return fallback; }
  brandNames[keyOf(parent.id)] = best;
  try { figma.root.setPluginData(BRAND_KEY, JSON.stringify(brandNames)); } catch (e) { /* read-only file */ }
  return best;
}

/**
 * The themes and brands this file offers, and which of them is set on the
 * target right now.
 *
 * A theme is a mode NAME rather than a mode id, because the same theme is a
 * different mode id in every collection — that is the whole reason a reader
 * cannot do this from Figma's own menu without visiting each collection in
 * turn.
 */
async function model(quick) {
  var cols = await collections(quick);

  // Themes: names offered by collections that have a choice to make. A name
  // carried by two or more of them is a theme; "Mode 1" on five single-mode
  // collections is not, and neither is a breakpoint set that only one
  // collection defines.
  var choosers = cols.filter(function (c) { return c.modes.length > 1; });
  var count = {};
  var order = [];
  choosers.forEach(function (c) {
    c.modes.forEach(function (m) {
      if (count[m.name] === undefined) { count[m.name] = 0; order.push(m.name); }
      count[m.name]++;
    });
  });
  var themes = order.filter(function (n) { return count[n] > 1; });
  // A file with one multi-mode collection has no shared name to find; its own
  // modes are still a perfectly good theme list.
  if (!themes.length && choosers.length === 1) {
    themes = choosers[0].modes.map(function (m) { return m.name; });
  }

  // Brands: the extensions, plus the base — which is the ABSENCE of an
  // extension pin, not a collection of its own. Naming the base after the
  // parent when the parent resolves is a courtesy; an id of "" is what makes
  // the row work in a file where the parent is remote and does not.
  var byKey = {};
  cols.forEach(function (c) { byKey[keyOf(c.id)] = c; });
  var extensions = cols.filter(function (c) { return c.isExtension; });
  var brands = [];
  if (extensions.length) {
    var parent = byKey[keyOf(extensions[0].parentVariableCollectionId || "")];
    if (!parent) {
      try { parent = await figma.variables.getVariableCollectionByIdAsync(extensions[0].parentVariableCollectionId); } catch (e) { parent = null; }
    }
    brands.push({ id: "", name: await baseBrandName(parent, quick), isExtension: false });
    var seenB = {};
    extensions.forEach(function (c) {
      if (seenB[keyOf(c.id)]) { return; }
      seenB[keyOf(c.id)] = true;
      brands.push({ id: c.id, name: c.name, isExtension: true });
    });
  }

  // Choices: collections with modes to pick that the theme does not cover.
  // One project keeps brands as extensions, another as modes A and B of a
  // single collection; the second offers no theme name and no extension, so
  // without this row the file's brand could not be switched at all.
  var choices = [];
  var seenC = {};
  choosers.forEach(function (c) {
    if (c.isExtension || seenC[keyOf(c.id)]) { return; }
    if (c.modes.some(function (m) { return themes.indexOf(m.name) !== -1; })) { return; }
    seenC[keyOf(c.id)] = true;
    choices.push({ id: keyOf(c.id), name: c.name, modeId: c.modes[0].modeId,
      modes: c.modes.map(function (m) { return { id: m.modeId, name: m.name }; }) });
  });

  // What is set on the target now.
  var nodes = targets();
  var pinned = {};
  nodes.forEach(function (n) {
    var on = n.explicitVariableModes || {};
    Object.keys(on).forEach(function (k) { pinned[keyOf(k)] = on[k]; });
  });
  var theme = "";
  var brandId = "";
  cols.forEach(function (c) {
    var set = pinned[keyOf(c.id)];
    if (!set) { return; }
    var mode = c.modes.filter(function (m) { return m.modeId === set; })[0];
    if (mode && themes.indexOf(mode.name) !== -1 && !theme) { theme = mode.name; }
    if (c.isExtension && !brandId) { brandId = c.id; }
  });
  choices.forEach(function (c) {
    var set = pinned[c.id];
    if (set && c.modes.some(function (m) { return m.id === set; })) { c.modeId = set; }
  });
  return {
    type: "MODEL",
    themes: themes,
    brands: brands,
    theme: theme || themes[0] || "",
    brandId: brandId,
    choices: choices,
    count: nodes.length,
  };
}

/**
 * One action: theme on everything that offers it, chosen brand pinned, the
 * other brands cleared, each choice row's mode pinned.
 */
async function apply(msg) {
  var nodes = targets();
  if (!nodes.length) { throw new Error("Select a layer first."); }
  var cols = await collections();
  var chosen = keyOf(msg.brandId || "");
  var picks = msg.picks || {};
  var touched = 0;

  for (var n = 0; n < nodes.length; n++) {
    var did = false;
    for (var i = 0; i < cols.length; i++) {
      var col = cols[i];
      var isBrand = !!col.isExtension;
      var unchosen = isBrand && keyOf(col.id) !== chosen;   // chosen is "" for the base
      var mode = col.modes.filter(function (m) { return m.name === msg.theme; })[0];
      var picked = picks[keyOf(col.id)];
      try {
        if (unchosen) {
          did = (await clearAll(nodes[n], col)) || did;
        } else if (picked && col.modes.some(function (m) { return m.modeId === picked; })) {
          nodes[n].setExplicitVariableModeForCollection(col, picked);
          did = true;
        } else if (mode) {
          nodes[n].setExplicitVariableModeForCollection(col, mode.modeId);
          did = true;
        } else if (isBrand) {
          // A brand with no mode of that name still has to be selectable.
          nodes[n].setExplicitVariableModeForCollection(col, col.modes[0].modeId);
          did = true;
        }
      } catch (e) { /* not every node accepts a mode */ }
    }
    if (did) { touched++; }
  }
  pageCache.pins = null;
  return touched;
}

/**
 * Remove every generation of a collection's pin, not just the current one: a
 * remote id's local half changes when the library republishes, so a node can
 * carry a pin whose id no longer matches the collection you hold. That stale
 * pin is exactly what switching brand has to get rid of.
 */
/**
 * The collection you must PASS to clear a pin stored under `id`.
 *
 * A pin set on an extension is stored under the extension's id, and
 * `clearExplicitVariableModeForCollection(extension)` silently does nothing —
 * no throw, no change. It only clears when the PARENT is passed. Traced on a
 * live frame: set parent → one entry; set extension → the entry becomes the
 * extension's; clear extension → unchanged; clear parent → empty.
 */
async function clearableFor(col) {
  if (!col || !col.isExtension) { return col; }
  var parent = await figma.variables.getVariableCollectionByIdAsync(col.parentVariableCollectionId);
  return parent || col;
}

async function clearAll(node, col) {
  var on = node.explicitVariableModes || {};
  var ks = Object.keys(on);
  var did = false;
  for (var g = 0; g < ks.length; g++) {
    if (keyOf(ks[g]) !== keyOf(col.id)) { continue; }
    // Resolve the id to a collection object first: the string form of this
    // call is deprecated, and a generation that no longer resolves has
    // nothing left to clear anyway.
    var gen = await clearableFor(await figma.variables.getVariableCollectionByIdAsync(ks[g]));
    if (!gen) { continue; }
    try { node.clearExplicitVariableModeForCollection(gen); did = true; } catch (e) { /* gone */ }
  }
  return did;
}

/**
 * Every explicit mode off the current page and everything on it.
 *
 * Scope here has been wrong twice. Clearing the selected layer alone left
 * nested pins, which override it, so the canvas did not move. Clearing the
 * selection's subtree still missed the page node itself — and the page is
 * exactly where earlier versions of this plugin wrote pins when nothing was
 * selected, so the pin a reader most wants gone was the one Clear could not
 * reach. It is the reset button: it takes the page back to what the library
 * says, whatever set the pins and whatever is selected.
 *
 * The collection has to be passed as an object: the id string form throws
 * `Cannot call clearExplicitVariableModeForCollection with a collection id in
 * incremental mode`, and a pin whose collection no longer resolves at all
 * cannot be removed by any route — it is counted and reported rather than
 * swallowed.
 */
async function clearEverything() {
  var cols = {};
  var layers = 0;
  var pins = 0;
  var stuck = 0;
  var stack = [figma.currentPage];
  while (stack.length) {
    var node = stack.pop();
    if (node.children) { for (var c = 0; c < node.children.length; c++) { stack.push(node.children[c]); } }
    var ks = Object.keys(node.explicitVariableModes || {});
    if (!ks.length) { continue; }
    var did = false;
    for (var k = 0; k < ks.length; k++) {
      if (cols[ks[k]] === undefined) {
        cols[ks[k]] = await clearableFor(await figma.variables.getVariableCollectionByIdAsync(ks[k]));
      }
      if (!cols[ks[k]]) { continue; }
      try { node.clearExplicitVariableModeForCollection(cols[ks[k]]); did = true; pins++; } catch (e) { /* counted below */ }
    }
    // Counted from what is actually left, not from what threw: the call that
    // does nothing does not throw, and that is the failure worth reporting.
    stuck += Object.keys(node.explicitVariableModes || {}).length;
    if (did) { layers++; }
  }
  pageCache.pins = null;
  return { layers: layers, pins: pins, stuck: stuck };
}

figma.ui.onmessage = async function (msg) {
  try {
    if (msg.type === "MODEL") { await post(); return; }
    if (msg.type === "CLEAR") {
      var c = await clearEverything();
      figma.notify(c.pins
        ? "Cleared " + c.pins + (c.pins === 1 ? " pin on " : " pins on ") + c.layers + (c.layers === 1 ? " layer" : " layers") + (c.stuck ? " · " + c.stuck + " could not be removed" : "")
        : (c.stuck ? c.stuck + " pin(s) could not be removed" : "Nothing was pinned here"));
      figma.ui.postMessage(await model());
      return;
    }
    if (msg.type === "APPLY") {
      var n = await apply(msg);
      figma.notify("Applied to " + n + (n === 1 ? " layer" : " layers"));
      figma.ui.postMessage(await model());
      return;
    }
    if (msg.type === "RESIZE") {
      figma.ui.resize(Math.max(280, msg.width | 0), Math.max(120, msg.height | 0));
      await figma.clientStorage.setAsync(SIZE_KEY, { width: msg.width | 0, height: msg.height | 0 });
      return;
    }
  } catch (e) {
    figma.notify(e && e.message ? e.message : "Something went wrong", { error: true });
  }
};

/**
 * Show what is known now, then what needs the library.
 *
 * Resolving team-library collections took four seconds against a real library
 * — all of it waiting on one call that never answers — and an empty window
 * for four seconds reads as a broken plugin. Local collections and the pins
 * already in the file are instant, so they go out first and the library tops
 * the list up when it arrives. The UI keeps the reader's picks across the
 * second message.
 */
async function post() {
  if (!libPromise) { figma.ui.postMessage(await model(true)); }
  figma.ui.postMessage(await model());
}

figma.on("selectionchange", function () {
  model().then(function (m) { figma.ui.postMessage(m); }).catch(function () {});
});

(async function () {
  var size = null;
  try { size = await figma.clientStorage.getAsync(SIZE_KEY); } catch (e) { size = null; }
  if (size && size.width && size.height) { figma.ui.resize(size.width, size.height); }
  await post();
})();
