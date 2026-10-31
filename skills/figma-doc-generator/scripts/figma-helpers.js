/* figma-helpers.js — the node-touching half of figma-doc-generator.
 *
 * Companion to scripts/docgen.js. Everything here needs a live Figma node, so
 * none of it can be unit-tested outside the plugin sandbox — but it is still
 * CODE, and code belongs in a file that `node --check` can parse and git can
 * diff, not in prose that gets retyped into every call.
 *
 * Split rule: if a function needs `figma` or a node, it is here. If it does
 * not, it is in docgen.js with a test. Pure logic that used to hide inside a
 * node function has been lifted out to docgen.js and is called back into here
 * (matchesPropKey, normaliseWidths) so there is exactly one implementation.
 *
 * Prepend BOTH files to a generating figma_execute call, docgen.js FIRST —
 * keyFor and normaliseFrameWidths call into DOCGEN at runtime. After the FIRST
 * paste each file caches its own source (see the tail of this file), so later
 * calls need only the three-line bootstrap in SKILL.md rather than the 51KB.
 * This header used to claim there is no `eval` in the sandbox. There is — that
 * was tested on 2026-08-08 and is what the self-caching below depends on, so
 * the claim was already false when 1.11.0 shipped the caching four versions
 * before anyone re-read the paragraph above it. What IS true, and was also
 * measured rather than assumed: indirect eval does not leak declarations into
 * globals here, which is why every public name is installed explicitly.
 *
 * Written in ES5 for consistency with docgen.js, not because the sandbox
 * requires it. The reasoning behind each function — why match by name and never by
 * type, why the Pill must be set as well as the cell, which detector catches
 * which overflow mode — is in references/helpers.md, which is now prose.
 */

// Wrapped in a named factory so the script can hand back its own source
// via toString() and cache itself — an IIFE cannot, and a bare script has
// nothing to take the source from. Indirect eval does NOT leak declarations
// into globals in this sandbox (tested 2026-08-08), so every public name is
// installed explicitly below rather than left to scope.
globalThis.__FIGMA_HELPERS_FACTORY = function () {

/* ===== Node matching — data rows and header row ===== */
// data rows — exact name, and assert the type
function rowsSlotOf(tbl) {
  return tbl.findOne(function(n){ return n.name === "Rows slot" && n.type === "SLOT"; });
}
// header row — reach it through the Row - Header instance, never by bare slot name
function headerCellsOf(tbl) {
  var hr = tbl.findOne(function(n){ return n.name === "Row - Header" && n.type === "INSTANCE"; });
  return hr ? hr.findOne(function(n){ return n.name === "Content slot"; }) : null;
}

// The rendered header labels, in column order — the column contract. Never
// address a column by index; map labels to fields with columnMap.
function headerLabels(tbl) {
  var hs = headerCellsOf(tbl), labels = [];
  if (!hs) return labels;
  for (var L = 0; L < hs.children.length; L++) {
    var c = hs.children[L];
    var t = (c.type === "TEXT") ? c
          : (typeof c.findOne === "function") ? c.findOne(function (n) { return n.type === "TEXT"; }) : null;
    labels.push(t ? t.characters : "");
  }
  return labels;
}

// {fieldFor, unknown} for a table's header. Write cells by fieldFor[i]; report
// unknown to the user rather than guessing what a new column means.
function columnMap(tbl) {
  return DOCGEN.fieldsForLabels(headerLabels(tbl));
}

/* ===== Frame chrome ===== */
// The skill's own fixed design, identical on every page type. One copy: the
// three recipes each carried their own until 1.18.0.
function docFrame(page, name, x) {
  var fr = figma.createFrame();
  fr.name = name;
  fr.layoutMode = "VERTICAL";
  fr.itemSpacing = 64;
  fr.paddingTop = fr.paddingBottom = fr.paddingLeft = fr.paddingRight = 160;
  fr.primaryAxisSizingMode = "AUTO";
  fr.counterAxisSizingMode = "AUTO";
  fr.cornerRadius = 40;
  fr.cornerSmoothing = 0.6;
  fr.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
  fr.x = x || 0; fr.y = 0;
  page.appendChild(fr);
  return fr;
}

/* ===== Node matching — swatch and row cells ===== */
function swatchOf(cell) {
  return cell.findOne(function(n) {
    return n.name === "Swatch" && n.fills && n.fills !== figma.mixed && n.fills.length;
  });
}

// Row cell containers differ BY COMPONENT and CHANGE BETWEEN LIBRARY EDITS:
//   Row - Colour / Row - Global          -> SLOT  "Content slot"
//   Row - Effects                        -> FRAME "Content"     (fixed 6)
//   Row - Text style values              -> SLOT "Content slot" originally;
//                                           observed as FRAME "Content" (fixed 6)
//                                           after the user edited the doc library.
// Never hardcode which. Accept both names AND both types, then decide whether you
// actually need to resize: a fixed FRAME is harmless when the column count already
// matches, and only a problem when you need to add or remove one.
function getCells(row) {
  var f = row.children[0];
  if (!f || !f.children) return row.children;
  if (f.type === "SLOT" || f.name === "Content" || f.name === "Content slot") return f.children;
  return row.children;
}

/* ===== Cell writers ===== */
function setCellText(c, v) {
  var p = c.componentProperties;
  for (var k in p) { if (p[k].type === "TEXT") { var o = {}; o[k] = v; c.setProperties(o); return; } }
}

function setCellContent(c, mode) { // "Text" | "Alias" | "Status"
  var p = c.componentProperties;
  for (var k in p) {
    if (k === "Content" && p[k].type === "VARIANT") { var o = {}; o[k] = mode; c.setProperties(o); return; }
  }
}

// Property keys carry #id suffixes ("Label#0:1"). The matching rule and the
// reason for it (defect 17) are with the implementation, in docgen.js. The type
// check here is belt and braces, not a substitute for the boundary.
function keyFor(node, name, type) {
  var p = node.componentProperties;
  // The # boundary rule is DOCGEN.matchesPropKey — tested, one implementation.
  for (var k in p) if (DOCGEN.matchesPropKey(k, name) && (!type || p[k].type === type)) return k;
  return null;
}

function setSwatchBool(c, on) {
  var k = keyFor(c, "Swatch", "BOOLEAN");
  if (k) { var o = {}; o[k] = on; c.setProperties(o); }
}

/* ===== The Pill — required for every alias cell ===== */
function setPill(cell, v) {
  var pill = cell.findOne(function(n){ return n.type === "INSTANCE" && n.name === "Pill"; });
  if (!pill) return false;
  var pp = pill.componentProperties;
  for (var k in pp) { if (pp[k].type === "TEXT") { var o = {}; o[k] = v; pill.setProperties(o); return true; } }
  return false;
}

function setAliasCell(cell, label, isColor) {
  setCellContent(cell, "Alias");
  setCellText(cell, label);
  setPill(cell, label);
  setSwatchBool(cell, !!isColor);
}

/* ===== Verification: assert on what RENDERS, never on what was written =====
   componentProperties is the input side. On an alias cell the visible string
   comes from the nested Pill, so re-reading the property you just set reports
   success while the page shows "Label". These read the rendered artefact. */
function renderedText(node) {
  if (node.type === "TEXT") return effVisible(node) ? node.characters : "";
  var out = "";
  var kids = (typeof node.findAll === "function")
    ? node.findAll(function (n) { return n.type === "TEXT"; }) : [];
  for (var i = 0; i < kids.length; i++) if (effVisible(kids[i])) out += kids[i].characters;
  return out;
}

// Every text that actually renders one of `words` (default: the shipped
// placeholders). Text inside a hidden ancestor is excluded by effVisible,
// which is what keeps a correctly hidden _Title from reading as a defect.
function placeholderTexts(root, words) {
  var bad = words || ["Label", "Title", "Subcomponent", "Heading", "Subheading", ""];
  var hits = [];
  var all = (typeof root.findAll === "function")
    ? root.findAll(function (n) { return n.type === "TEXT"; }) : [];
  for (var i = 0; i < all.length; i++) {
    if (!effVisible(all[i])) continue;
    if (bad.indexOf(all[i].characters) !== -1) hits.push(all[i]);
  }
  return hits;
}

/* ===== Swatch binding ===== */
async function bindSwatch(cell, variable, collectionObj, modeId) {
  if (collectionObj && modeId) cell.setExplicitVariableModeForCollection(collectionObj, modeId);
  var sw = swatchOf(cell);
  if (!sw) return false;
  var paint = JSON.parse(JSON.stringify(sw.fills[0]));
  sw.fills = [figma.variables.setBoundVariableForPaint(paint, "color", variable)];
  return true;
}

/* Pin every collection an alias chain passes through, by the column's mode
   name. bindSwatch pins only the swatch variable's own collection; when that
   variable is itself an alias (a component token -> a semantic -> a primitive)
   the next tier fell back to the page default, so a Dark column showed a Light
   value and a brand page showed the base brand. On an extension's page the
   extension is pinned in its parent's place, and its overrides are followed. */
async function pinAliasChain(cell, idx, v, modeName, docColl) {
  var seen = {};
  for (var d = 0; v && d < 10; d++) {
    var c = idx.collById[v.variableCollectionId];
    if (!c || seen[c.id]) break;
    seen[c.id] = true;
    var pin = DOCGEN.pinTarget(c.id, docColl) === c.id ? c : docColl;
    var mId = DOCGEN.modeIdByName(pin.modes, modeName);
    cell.setExplicitVariableModeForCollection(pin, mId);
    var vals = pin !== c && v.valuesByModeForCollectionAsync ? await v.valuesByModeForCollectionAsync(pin) : v.valuesByMode;
    var val = vals[mId] !== undefined ? vals[mId] : v.valuesByMode[DOCGEN.modeIdByName(c.modes, modeName)];
    if (!val || val.type !== "VARIABLE_ALIAS") break;
    v = await resolveAlias(idx, val.id);
  }
}

/* ===== Source index — the ONE place a run gets its variables from =====
   Works whether the collection is local to this file or consumed from a
   library, so the page recipe has a single code path. Cross-file was the
   gap that made a seven-page build hand-written: generate() called
   getLocalVariablesAsync and simply threw when source != target. */
async function sourceIndex(collName, libraryName, msBudget) {
  var byId = {}, collById = {};
  var locals = await figma.variables.getLocalVariableCollectionsAsync();
  for (var i = 0; i < locals.length; i++) collById[locals[i].id] = locals[i];

  var target = null;
  for (var j = 0; j < locals.length; j++) if (locals[j].name === collName) target = locals[j];

  if (target) {
    var all = await figma.variables.getLocalVariablesAsync();
    var mine = [], valuesById = null;
    for (var k = 0; k < all.length; k++) {
      byId[all[k].id] = all[k];
      if (!target.isExtension && all[k].variableCollectionId === target.id) mine.push(all[k]);
    }
    // An EXTENDED collection (a brand as a collection) owns no variables: it
    // lists its parent's and overrides some of their values under its OWN mode
    // ids. Matching by variableCollectionId found none, so the page came out
    // empty and reported success; and a variable's valuesByMode holds only the
    // parent's modes. valuesByModeForCollectionAsync is the one read that
    // returns this collection's values, overrides and inherited ones alike.
    if (target.isExtension) {
      valuesById = {};
      for (var x = 0; x < target.variableIds.length; x++) {
        var ev = byId[target.variableIds[x]];
        if (!ev) continue;
        mine.push(ev);
        valuesById[ev.id] = await ev.valuesByModeForCollectionAsync(target);
      }
    }
    return { collection: target, modes: target.modes, vars: mine, valuesById: valuesById, byId: byId, collById: collById, remote: false };
  }

  // Not local — reach it as a library collection. Match on libraryName too:
  // collection names are NOT unique across libraries, and picking the first
  // match silently documents the wrong source. Observed live — a doc-component
  // library and the token library both exposed "Semantic" and
  // "Primitives - Global", and the doc library sorted first.
  var libs = await figma.teamLibrary.getAvailableLibraryVariableCollectionsAsync();
  var matches = [];
  for (var l = 0; l < libs.length; l++) {
    if (libs[l].name !== collName) continue;
    if (libraryName && libs[l].libraryName !== libraryName) continue;
    matches.push(libs[l]);
  }
  if (!matches.length) throw new Error(
    "Collection '" + collName + "'" + (libraryName ? " in library '" + libraryName + "'" : "") +
    " is neither local nor an enabled library collection here. " +
    "Available: " + libs.map(function (x) { return x.libraryName + " :: " + x.name; }).join(", "));
  if (matches.length > 1) throw new Error(
    "'" + collName + "' is ambiguous — " + matches.length + " enabled libraries expose a collection with that " +
    "name: " + matches.map(function (x) { return x.libraryName; }).join(", ") +
    ". Pass the library name as the second argument; picking one silently would document the wrong source.");
  var hit = matches[0];

  var entries = await figma.teamLibrary.getVariablesInLibraryCollectionAsync(hit.key);
  if (!entries.length) throw new Error(
    "'" + collName + "' publishes 0 variables — every variable is hiddenFromPublishing, which is what a " +
    "deliberately hidden primitive tier looks like from a consuming file. It cannot be bound or enumerated " +
    "from here. Either generate this page inside the source file, or document a published tier and let the " +
    "alias chain reach this one (getVariableByIdAsync on an alias target still works).");

  // Importing is the slow part — ~170ms each on a good connection and much worse
  // on a tired one, so a 187-variable collection does not fit one 30s call.
  // Two things make the resume actually work, and the first was learned the hard
  // way: re-importing an already-imported variable is NOT cheap, so a naive
  // retry restarts and can go BACKWARDS on a degrading bridge (measured 81/187,
  // then 32/187). Cache key -> id, and on later passes fetch by id instead.
  //
  // A cached id is only good for the library version it was imported from. After
  // the library publishes, importing the same key returns a NEW id, while the
  // cached one still resolves — to the pre-publish copy, old name and old values.
  // Observed live 2026-09-11: a ten-day-old cache regenerated a page from the
  // variables as they were before the publish while the library list already
  // carried the new names. So the cache is a resume aid for one run, not a store:
  // it expires an hour after it was started, and a cached variable whose name no
  // longer matches the library entry is re-imported even inside that hour.
  var cacheKey = "srcIdx:" + hit.libraryName + "::" + collName;
  var CACHE_TTL_MS = 60 * 60 * 1000;
  var seen = {}, cacheAt = Date.now();
  try {
    var raw = JSON.parse(figma.root.getPluginData(cacheKey) || "{}");
    // the old undated shape was a bare key -> id map; it has no age, so it is not trusted
    if (raw && typeof raw.at === "number" && raw.ids && Date.now() - raw.at < CACHE_TTL_MS) { seen = raw.ids; cacheAt = raw.at; }
  } catch (e) { seen = {}; }
  var saveCache = function () { figma.root.setPluginData(cacheKey, JSON.stringify({ at: cacheAt, ids: seen })); };
  var mine2 = [], t0 = Date.now(), budget = (typeof msBudget === "number") ? msBudget : 20000, dirty = false;
  for (var e = 0; e < entries.length; e++) {
    if (Date.now() - t0 > budget) {
      if (dirty) saveCache();
      return { partial: true, imported: mine2.length, of: entries.length,
               collectionName: collName, libraryName: hit.libraryName,
               note: "call sourceIndex again with the same arguments to continue; progress is cached" };
    }
    var v = null;
    if (seen[entries[e].key]) {
      v = await figma.variables.getVariableByIdAsync(seen[entries[e].key]);
      if (v && v.name !== entries[e].name) v = null;      // renamed since it was cached
    }
    if (!v) { v = await figma.variables.importVariableByKeyAsync(entries[e].key);
              seen[entries[e].key] = v.id; dirty = true; }
    byId[v.id] = v; mine2.push(v);
    if (!collById[v.variableCollectionId])
      collById[v.variableCollectionId] = await figma.variables.getVariableCollectionByIdAsync(v.variableCollectionId);
  }
  if (dirty) saveCache();
  var rc = collById[mine2[0].variableCollectionId];
  return { collection: rc, modes: rc.modes, vars: mine2, byId: byId, collById: collById, remote: true };
}

// Alias targets can live in an UNPUBLISHED tier. Key import fails there, but
// getVariableByIdAsync on the alias id does not — that is the only route in,
// and it is what lets a semantic page bind swatches to hidden primitives.
async function resolveAlias(idx, id) {
  if (idx.byId[id]) return idx.byId[id];
  var v = await figma.variables.getVariableByIdAsync(id);
  if (!v) return null;
  idx.byId[id] = v;
  if (!idx.collById[v.variableCollectionId])
    idx.collById[v.variableCollectionId] = await figma.variables.getVariableCollectionByIdAsync(v.variableCollectionId);
  return v;
}

/* ===== Styles come from the project's snapshot =====
   The Shadows and Text styles recipes take their styles from
   DOCGEN.stylesFromSnapshot(tokens) (docgen.js), fed from the project's stored
   snapshot, the one reader of the file. The two live readers that stood here,
   snapshotEffectStyles and snapshotTextStyles, were removed in 1.16.0. Their
   output carried bound-variable NAMES, as the snapshot's does, and
   styleIndexByName() below resolves those names in the target. */

// name -> live variable, for resolving a snapshot's bound-variable names in the
// target. Spans every collection the file can see, so an alias into another
// tier still resolves.
async function styleIndexByName() {
  var byName = {}, collById = {};
  var locals = await figma.variables.getLocalVariablesAsync();
  for (var i = 0; i < locals.length; i++) byName[locals[i].name] = locals[i];
  var colls = await figma.variables.getLocalVariableCollectionsAsync();
  for (var c = 0; c < colls.length; c++) collById[colls[c].id] = colls[c];
  var libs = await figma.teamLibrary.getAvailableLibraryVariableCollectionsAsync();
  for (var l = 0; l < libs.length; l++) {
    var entries = [];
    try { entries = await figma.teamLibrary.getVariablesInLibraryCollectionAsync(libs[l].key); } catch (e) { continue; }
    for (var n = 0; n < entries.length; n++) {
      if (byName[entries[n].name]) continue;
      var v = await figma.variables.importVariableByKeyAsync(entries[n].key);
      byName[v.name] = v;
      if (!collById[v.variableCollectionId])
        collById[v.variableCollectionId] = await figma.variables.getVariableCollectionByIdAsync(v.variableCollectionId);
    }
  }
  return { byName: byName, collById: collById };
}

/* ===== Fonts =====
   `docFonts` has been persisted in two shapes by different runs — {family,style}
   objects and "Family|Style" strings — and loadFontAsync only accepts the first.
   Passing a string throws a validation error which the bridge surfaces as a
   TIMEOUT, so the run looks slow rather than broken. Normalise, never assume. */
function normaliseFontList(raw) {
  var list = [], i;
  if (typeof raw === "string") { try { raw = JSON.parse(raw); } catch (e) { raw = []; } }
  if (!raw || !raw.length) return list;
  for (i = 0; i < raw.length; i++) {
    var f = raw[i];
    if (f && typeof f === "object" && f.family) { list.push({ family: f.family, style: f.style || "Regular" }); continue; }
    if (typeof f === "string") {
      var parts = f.split("|");
      if (parts.length === 2) { list.push({ family: parts[0], style: parts[1] }); continue; }
    }
  }
  return list;
}

async function loadDocFonts() {
  var fonts = normaliseFontList(figma.root.getPluginData("docFonts"));
  var failed = [];
  for (var i = 0; i < fonts.length; i++) {
    try { await figma.loadFontAsync(fonts[i]); }
    catch (e) { failed.push(fonts[i].family + " " + fonts[i].style); }
  }
  return { loaded: fonts.length - failed.length, failed: failed };
}

/* ===== Cold imports are the #1 cause of a timed-out first call ===== */
async function warmImports(keyMap) {
  var out = { ok: [], failed: [] };
  for (var name in keyMap) {
    try {
      try { await figma.importComponentSetByKeyAsync(keyMap[name]); }
      catch (e) { await figma.importComponentByKeyAsync(keyMap[name]); }
      out.ok.push(name);
    } catch (e2) { out.failed.push(name + ": " + (e2.message || e2)); }
  }
  return out;
}

/* ===== Slot sizing ===== */
// A slot takes about ONE structural mutation per instance per call; after that
// every handle inside it throws. It is per instance and it is a cooldown, so
// drive many slots one step each and call again until `remaining` is 0.
// Grow before shrink: additions keep working long after removals stop.
function stepRowCounts(pairs) {
  var moved = 0, remaining = 0, failed = [];
  for (var pass = 0; pass < 2; pass++) {          // 0 = grow, 1 = shrink
    for (var i = 0; i < pairs.length; i++) {
      var slot = pairs[i].slot, want = pairs[i].want;
      try {
        var n = slot.children.length;
        if (n === want) continue;
        if (pass === 0 && n < want) { slot.appendChild(slot.children[n - 1].clone()); moved++; }
        else if (pass === 1 && n > want) { slot.children[n - 1].remove(); moved++; }
      } catch (e) { failed.push(pairs[i].label || i); }
    }
  }
  for (var j = 0; j < pairs.length; j++) {
    try { if (pairs[j].slot.children.length !== pairs[j].want) remaining++; } catch (e) { remaining++; }
  }
  return { moved: moved, remaining: remaining, failed: failed };
}

function adjustRowCount(slot, n) {
  while (slot.children.length < n) slot.appendChild(slot.children[slot.children.length-1].clone());
  while (slot.children.length > n) slot.children[slot.children.length-1].remove();
}

// SLOT-only by design. Returns null for Row - Effects (FRAME "Content", fixed 6 columns).
// Check the return value rather than assuming it worked.
function setColumnCount(row, n) {
  var s = row.findOne(function(x){ return x.name === "Content slot" && x.type === "SLOT"; });
  if (!s) return null;
  while (s.children.length < n) s.appendChild(s.children[s.children.length-1].clone());
  while (s.children.length > n) s.children[s.children.length-1].remove();
  return s;
}

/* ===== Section header and table title ===== */
function applySectionHeader(frame, shSet, headingPart, subtitlePart) {
  var vn = subtitlePart ? "Subtitle=True" : "Subtitle=False", variant = null;
  for (var i = 0; i < shSet.children.length; i++) if (shSet.children[i].name === vn) variant = shSet.children[i];
  if (!variant) variant = shSet.defaultVariant;
  var hdr = variant.createInstance();
  frame.appendChild(hdr);                    // MUST come first
  var p = {};
  var hk = keyFor(hdr, "Heading text"), sk = keyFor(hdr, "Subheading text");
  if (hk) p[hk] = headingPart;
  if (subtitlePart && sk) p[sk] = subtitlePart;
  if (Object.keys(p).length) hdr.setProperties(p);
  hdr.layoutSizingHorizontal = "FILL";       // set AFTER appending
}

function setupTable(tbl, tableName, frameGroupName) {
  var title = tbl.findOne(function(n){ return n.name === "_Title" && n.type === "INSTANCE"; });
  if (!title) return;
  if (tableName.toLowerCase() === frameGroupName.toLowerCase()) { title.visible = false; return; }
  var p = {};
  var tk = keyFor(title, "Title text"), lk = keyFor(title, "Label", "BOOLEAN");
  if (tk) p[tk] = tableName;
  if (lk) p[lk] = false;
  if (Object.keys(p).length) title.setProperties(p);
}

/* ===== Badged tables (Step 2.2) ===== */
function setupTableBadged(tbl, tableName, badgeText) {
  var title = tbl.findOne(function (n) { return n.name === "_Title" && n.type === "INSTANCE"; });
  if (!title) return false;
  title.visible = true;
  var p = {}, tk = keyFor(title, "Title text", "TEXT"),
      lk = keyFor(title, "Label", "BOOLEAN"), lt = keyFor(title, "Label text", "TEXT");
  if (tk) p[tk] = tableName;
  if (lk) p[lk] = true;
  if (lt) p[lt] = badgeText;
  if (Object.keys(p).length) title.setProperties(p);
  return !!(lk && lt);
}

/* ===== Width measurement — the two detectors ===== */
// Returns intrinsic width of `chars` in the given font, or null on failure.
async function intrinsicWidth(chars, fontName, fontSize) {
  try { await figma.loadFontAsync(fontName); } catch (e) { return null; }
  var t = figma.createText();
  t.fontName = fontName;
  t.fontSize = fontSize;
  t.textAutoResize = "WIDTH_AND_HEIGHT";
  t.characters = chars;
  var w = t.width;
  t.remove();                        // always remove — it lands on the current page
  return w;
}

// A cell misbehaves if its text needs more room than the cell gives it,
// or if the rendered text node already occupies more than one line.
function wrapsOrClips(textNode, intrinsic) {
  if (intrinsic !== null && intrinsic > textNode.width + 0.5) return true;
  var lh = textNode.lineHeight;
  var lhPx = (lh && lh.unit === "PIXELS") ? lh.value
           : (lh && lh.unit === "PERCENT") ? textNode.fontSize * lh.value / 100
           : textNode.fontSize * 1.2;
  return textNode.height > lhPx * 1.5;
}

// The third detector: a pill (or any hugging text) that runs past its cell.
// Returns the overflow in px. Measure in a later call than any resize.
function clipsCell(textNode, cell) {
  return DOCGEN.boxOverflow(textNode.absoluteBoundingBox, cell.absoluteBoundingBox);
}

/* ===== Frame width normalisation ===== */
function normaliseFrameWidths(frame) {
  var tables = [];
  for (var i = 0; i < frame.children.length; i++) {
    var n = frame.children[i];
    if (n.type === "INSTANCE" && n.name.indexOf("Table") === 0) tables.push(n);
  }
  if (tables.length < 2) return null;                 // nothing to reconcile
  // Widen-up-to-the-widest is DOCGEN.normaliseWidths — tested, one implementation.
  var widths = [];
  for (var t = 0; t < tables.length; t++) widths.push(tables[t].width);
  var max = DOCGEN.normaliseWidths(widths)[0];
  var changed = 0;
  for (var k = 0; k < tables.length; k++)
    if (Math.round(tables[k].width) !== max) { tables[k].resize(max, tables[k].height); changed++; }
  return { target: max, resized: changed };
}

/* ===== Descendant walk ===== */
function descendants(node) {
  if (typeof node.findAll === "function")
    return node.findAll(function(n){ return n.visible && n.absoluteBoundingBox; });
  return (node.visible && node.absoluteBoundingBox) ? [node] : [];
}

/* ===== Font harvesting (one-off discovery) ===== */
// Collect every fontName used by the doc components into `fonts` (created when
// omitted) and return it. The accumulator is a parameter: it used to be a free
// variable named `fonts`, which the caller's `var fonts = {}` inside a
// figma_execute body can never satisfy — that body is a function scope, and
// this factory's scope is not inside it — so harvest threw ReferenceError.
function harvest(node, fonts) {
  fonts = fonts || {};
  var texts = (typeof node.findAll === "function") ? node.findAll(function(x){ return x.type === "TEXT"; }) : [];
  for (var t = 0; t < texts.length; t++) {
    var fn = texts[t].fontName;
    if (fn && fn.family) fonts[fn.family + "||" + fn.style] = true;
  }
  return fonts;
}

/* ===== Probe / debug formatting ===== */
function safeAll(n){ return (typeof n.findAll === "function") ? n.findAll(function(x){return true;}) : []; }
function d(n){ return n.type + " '" + n.name + "'" + (n.children ? " ("+n.children.length+")" : ""); }

/* ===== Structural probe (Step 1.2) =====
   Instantiate a doc component on a scratch page, dump what it really is, remove
   it. `comp` is a COMPONENT or COMPONENT_SET (its defaultVariant is used). The
   probe does not judge — reading the result for the five answers (Swatch type,
   nested Pill, SLOT or FRAME row container, append/remove success, header
   labels) is the caller's. The scratch page is left in place for the next probe;
   delete "__probe_tmp" in final housekeeping. ~3 imports per call at most. */
async function probeComponent(comp, opts) {
  opts = opts || {};
  var maxDepth = opts.depth || 4;
  var tmp = null;
  for (var i = 0; i < figma.root.children.length; i++)
    if (figma.root.children[i].name === "__probe_tmp") tmp = figma.root.children[i];
  if (!tmp) { tmp = figma.createPage(); tmp.name = "__probe_tmp"; }
  await figma.setCurrentPageAsync(tmp);       // createInstance lands on the CURRENT page
  while (tmp.children.length) tmp.children[0].remove();

  var isSet = comp.type === "COMPONENT_SET";
  var inst = (isSet ? comp.defaultVariant : comp).createInstance();
  tmp.appendChild(inst);
  var out = { name: comp.name, props: Object.keys(inst.componentProperties || {}), width: inst.width };
  if (isSet) out.variants = comp.children.map(function (c) { return c.name; });

  // full tree first — cheaper than guessing, and shows the Rows-slot/Content-slot pair
  var lines = [];
  (function walk(n, dep) {
    if (dep > maxDepth) return;
    var pad = ""; for (var q = 0; q < dep; q++) pad += "  ";
    lines.push(pad + d(n));
    if (n.children) for (var c = 0; c < n.children.length; c++) walk(n.children[c], dep + 1);
  })(inst, 0);
  out.tree = lines;

  try {
    // data rows — EXACT name ("Content slot" is not unique)
    var slot = inst.findOne(function (n) { return n.name === "Rows slot"; });
    out.rowsSlot = slot ? d(slot) : null;
    if (slot && slot.children.length) {
      try { slot.appendChild(slot.children[slot.children.length - 1].clone()); out.append = "ok"; }
      catch (e) { out.append = "FAIL: " + e.message; }
      try { slot.children[slot.children.length - 1].remove(); out.remove = "ok"; }
      catch (e) { out.remove = "FAIL: " + e.message; }

      var row = slot.children[0];
      out.row = d(row);
      out.rowProps = Object.keys(row.componentProperties || {});
      // accept BOTH names and BOTH types
      var cont = (typeof row.findOne === "function")
        ? row.findOne(function (n) { return n.name === "Content slot" || n.name === "Content"; }) : null;
      out.container = cont ? d(cont) : null;     // SLOT means resizable, FRAME means fixed
      if (cont && cont.children.length) {
        var cell = cont.children[0];
        out.cell = d(cell);
        out.cellProps = Object.keys(cell.componentProperties || {});
        out.cellNodes = safeAll(cell).map(d);
      }
    }
    // header row + its shipped labels — the column contract
    var hs = headerCellsOf(inst);
    out.headerCols = hs ? hs.children.length : null;
    if (hs) out.headerLabels = headerLabels(inst);

    var ttl = inst.findOne(function (n) { return n.name === "_Title" && n.type === "INSTANCE"; });
    out.titleProps = ttl ? Object.keys(ttl.componentProperties || {}) : null;
  } finally {
    inst.remove();                              // ALWAYS — even when a step above threw
  }
  return out;
}

/* ===== Verification predicates (failures.md F4, F5) ===== */
// Scanning node.visible checks only the node itself: a _Title correctly hidden
// as redundant still has TEXT children reporting visible:true. Walk ancestors.
function effVisible(n) {
  var p = n;
  while (p && p.type !== "PAGE") { if (p.visible === false) return false; p = p.parent; }
  return true;
}

// A placeholder scan for "Title"/"Label"/"Heading" hits the _Title instances of
// tables genuinely CALLED Title and Label — which is most type scales. Exclude
// text inside a _Title before scanning the remainder.
function inTitle(n) {
  var p = n;
  while (p && p.type !== "PAGE") { if (p.type === "INSTANCE" && p.name === "_Title") return true; p = p.parent; }
  return false;
}

/* ===== Doc component discovery by key (Step 1, routes 2 and 3) ===== */
// CONTRACT is the list of doc component names to find. Returns
// {name: {key, setKey}} for everything located; the caller decides whether an
// incomplete result means route 4 or a genuine miss. Persist the result to the
// TARGET's plugin data — plugin data is per file (defect 5).
async function discoverDocKeys(CONTRACT) {
  // Default contract names. _Title is deliberately absent: unpublished, no importable
  // key — it arrives nested inside every table instance (see the Step 1 trap).
  // A default, not a redeclaration: `var CONTRACT = [...]` here used to discard
  // whatever list the caller passed.
  CONTRACT = (CONTRACT && CONTRACT.length) ? CONTRACT : ["Section header","Table","Table - Colour","Table - Global","Table - Effects",
    "Table - Text values","Table - Text sample","Row - Colour","Row - Global","Row - Effects",
    "Row - Text style values","Row - Header","Cell - Default","Cell - Header",
    "Preview - Effects","Effect item","Pill"];

  // Route 2 — cached keys from a previous run. Validate ONE import before trusting the map.
  var cached = null;
  try { cached = JSON.parse(figma.root.getPluginData("docComponentKeys") || "null"); } catch (e) {}
  if (cached && cached["Cell - Default"]) {
    try { await figma.importComponentByKeyAsync(cached["Cell - Default"].key); /* map is live */ }
    catch (e) { cached = null; /* unpublished or revoked — fall through to route 3 */ }
  }

  // Route 3 — instances already in the file are live pointers into the enabled library.
  // Two performance rules shape this scan. Load and search PAGE BY PAGE with an early
  // exit — loadAllPagesAsync on a big file is the expensive way to find what page one
  // usually holds. And getMainComponentAsync is an await PER INSTANCE, so run it first
  // over instances whose OWN name matches the contract (instance names default to the
  // component name); only fall back to the remaining instances if the contract is
  // still incomplete — renamed instances are the exception, not the rule.
  var found = {};
  function contractDone(){ var n = 0; for (var k in found) n++; return n >= CONTRACT.length; }
  async function scan(list) {
    for (var i = 0; i < list.length && !contractDone(); i++) {
      var mc = list[i].getMainComponentAsync ? await list[i].getMainComponentAsync()
                                             : list[i].mainComponent;
      if (!mc) continue;
      // A variant's contract name is its PARENT SET's name. Remote variants may report
      // parent === null — record the variant key anyway; it still imports.
      var setNode = (mc.parent && mc.parent.type === "COMPONENT_SET") ? mc.parent : null;
      var cname = setNode ? setNode.name : mc.name;
      if (CONTRACT.indexOf(cname) !== -1 && !found[cname])
        found[cname] = { key: mc.key, setKey: setNode ? setNode.key : null };
    }
  }
  for (var p = 0; p < figma.root.children.length && !contractDone(); p++) {
    var pg = figma.root.children[p];
    if (pg.loadAsync) await pg.loadAsync();
    var insts = pg.findAll(function(n){ return n.type === "INSTANCE"; });
    var named = [], rest = [];
    for (var q2 = 0; q2 < insts.length; q2++)
      (CONTRACT.indexOf(insts[q2].name) !== -1 ? named : rest).push(insts[q2]);
    await scan(named);
    if (!contractDone()) await scan(rest);
  }
  return found;
}

  // public surface — explicit, because eval scope will not do it for us
  globalThis.rowsSlotOf = rowsSlotOf;
  globalThis.headerCellsOf = headerCellsOf;
  globalThis.headerLabels = headerLabels;
  globalThis.columnMap = columnMap;
  globalThis.docFrame = docFrame;
  globalThis.probeComponent = probeComponent;
  globalThis.swatchOf = swatchOf;
  globalThis.getCells = getCells;
  globalThis.setCellText = setCellText;
  globalThis.setCellContent = setCellContent;
  globalThis.keyFor = keyFor;
  globalThis.setSwatchBool = setSwatchBool;
  globalThis.setPill = setPill;
  globalThis.setAliasCell = setAliasCell;
  globalThis.bindSwatch = bindSwatch;
  globalThis.adjustRowCount = adjustRowCount;
  globalThis.setColumnCount = setColumnCount;
  globalThis.applySectionHeader = applySectionHeader;
  globalThis.setupTable = setupTable;
  globalThis.setupTableBadged = setupTableBadged;
  globalThis.intrinsicWidth = intrinsicWidth;
  globalThis.wrapsOrClips = wrapsOrClips;
  globalThis.clipsCell = clipsCell;
  globalThis.pinAliasChain = pinAliasChain;
  globalThis.normaliseFrameWidths = normaliseFrameWidths;
  globalThis.descendants = descendants;
  globalThis.harvest = harvest;
  globalThis.safeAll = safeAll;
  globalThis.d = d;
  globalThis.normaliseFontList = normaliseFontList;
  globalThis.loadDocFonts = loadDocFonts;
  globalThis.styleIndexByName = styleIndexByName;
  globalThis.sourceIndex = sourceIndex;
  globalThis.resolveAlias = resolveAlias;
  globalThis.warmImports = warmImports;
  globalThis.stepRowCounts = stepRowCounts;
  globalThis.renderedText = renderedText;
  globalThis.placeholderTexts = placeholderTexts;
  globalThis.effVisible = effVisible;
  globalThis.inTitle = inTitle;
  globalThis.discoverDocKeys = discoverDocKeys;
};

// Self-cache: store this factory's own source so later calls bootstrap from
// plugin data instead of the agent re-sending the node helpers. Only Figma runs this;
// node loads the file to compute the expected hash.
if (typeof figma !== 'undefined') {
  globalThis.__FIGMA_HELPERS_FACTORY();
  var __s = globalThis.__FIGMA_HELPERS_FACTORY.toString();
  // The hash GATES the write. Reporting it afterwards would be too late: a
  // corrupt transcription would already be cached and reused by every later
  // session. Set globalThis.__DG_EXPECT to the matching line from
  // `node scripts/hash.js` and a bad paste is refused instead of persisted.
  var __e = globalThis.__DG_EXPECT && globalThis.__DG_EXPECT['dg.helpers.v1'];
  var __ok = !__e || (typeof DOCGEN !== 'undefined' && DOCGEN.srcHash(__s) === __e);
  if (__ok) figma.root.setPluginData('dg.helpers.v1', __s);
  globalThis.__DG_CACHED = Object.assign(globalThis.__DG_CACHED || {}, { 'dg.helpers.v1': __ok });
}
