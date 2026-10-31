/* recipes.js — page-level generation procedures for figma-doc-generator.
 *
 * The third file in the split, and the top layer of it:
 *   docgen.js        pure logic, tested with node
 *   figma-helpers.js node primitives, syntax-checked only
 *   recipes.js       whole-page procedures built from both
 *
 * Prepend all three, in that order — these call DOCGEN.* and the node helpers
 * at runtime. Written in ES5 for consistency with the other two, not because
 * the sandbox requires it.
 *
 * references/recipes.md keeps the reasoning: which component each page type
 * uses, what the frame chrome is, and the per-page decisions a run must make.
 */

// Wrapped in a named factory so the script can hand back its own source
// via toString() and cache itself — an IIFE cannot, and a bare script has
// nothing to take the source from. Indirect eval does NOT leak declarations
// into globals in this sandbox (tested 2026-08-08), so every public name is
// installed explicitly below rather than left to scope.
globalThis.__RECIPES_FACTORY = function () {

/* One value cell. This is the whole of what used to be four prose snippets in
 * references/recipes.md, and leaving it there is why a seven-page run wrote it
 * by hand — badly, in one case: an alias cell needs its nested Pill set, and a
 * hand-rolled version that set only the cell property shipped 367 cells reading
 * "Label". setAliasCell has always done both; call it, never reimplement it. */
async function fillValueCell(cell, row, mode, modeNames, fmt, idx, collObj) {
  var val = row.v.values[mode.modeId];
  if (val === undefined) { setCellContent(cell, "Text"); setSwatchBool(cell, false); setCellText(cell, "-"); return; }

  if (val && val.type === "VARIABLE_ALIAS") {
    var pv = await resolveAlias(idx, val.id);
    var isColor = !!pv && pv.resolvedType === "COLOR";
    setAliasCell(cell, pv ? pv.name : "?", isColor);       // Content + text + PILL + swatch bool
    if (isColor) {
      var pc = idx.collById[pv.variableCollectionId];
      if (pc) {
        // Match the target collection's mode BY NAME, so a Light column shows the
        // primitive's Light value and not merely its first mode.
        var pmId = pc.modes[0].modeId;
        for (var i = 0; i < pc.modes.length; i++) if (pc.modes[i].name === mode.name) pmId = pc.modes[i].modeId;
        await bindSwatch(cell, pv, pc, pmId);
        await pinAliasChain(cell, idx, pv, mode.name, collObj);
      }
    }
    return;
  }

  setCellContent(cell, "Text");
  if (val && val.r !== undefined) {                         // COLOR literal
    setSwatchBool(cell, true);
    if (row.live) await bindSwatch(cell, row.live, collObj, mode.modeId);
    setCellText(cell, DOCGEN.colourLabel(val, row.v, fmt, mode.name, modeNames));
  } else {                                                  // FLOAT / STRING / TIMING / EASING
    setSwatchBool(cell, false);
    setCellText(cell, DOCGEN.literalLabel(val, row.v.type));
  }
}

// figma.createPage() APPENDS. A regenerated page must go back where the old one
// was, or every refill walks it to the bottom of the file — past the section
// divider pages, out of the group it belongs to, breaking a documented page order
// that no cell-level check looks at. Observed live: regenerating Semantic and
// Shadows moved both out of VARIABLES and below LAYOUT, and both pages were
// otherwise perfect. Only meaningful when a page was replaced; oldIdx is -1 for a
// first build, where appending is correct.
function restorePagePosition(page, oldIdx) {
  if (oldIdx < 0 || oldIdx >= figma.root.children.length) return false;
  figma.root.insertChild(oldIdx, page);
  return true;
}

// BUILD FIRST, REPLACE LAST. Every recipe used to remove the old page before
// building the new one, so a build that threw halfway left a half-built page and
// no original: observed live on a text-styles page, whose content existed nowhere
// else in the file once the call crashed. Now the old page stays until the new one
// is complete; on failure the new page is discarded and the old one is untouched.
async function swapInPage(page, old, oldIdx) {
  if (!old) return;
  if (figma.currentPage.id === old.id) await figma.setCurrentPageAsync(page);
  old.remove();
  restorePagePosition(page, oldIdx);
}
async function discardPage(page, old) {
  try {
    if (figma.currentPage.id === page.id) await figma.setCurrentPageAsync(old || figma.root.children[0]);
    page.remove();
  } catch (e) {}
}

async function generate(collName, pageName, fmt, shSet, tblSet, firstColLabel, libraryName, opts) {
  // First-column label: pass what the file's EXISTING generated pages use — the shipped
  // template can differ (Table - Colour ships "Label"; generated pages here use "Name").
  firstColLabel = firstColLabel || "Name";
  await loadDocFonts();

  // sourceIndex resolves the collection whether it is local to this file or
  // consumed from a library, so source != target needs no separate recipe.
  // opts.index takes a completed sourceIndex result, which the partial-index
  // error below has always told callers to pass and nothing used to read.
  var idx = (opts && opts.index) || await sourceIndex(collName, libraryName);
  if (idx.partial) throw new Error(
    "sourceIndex could not finish importing '" + collName + "' inside one call (" + idx.imported +
    " of " + idx.of + "). Call sourceIndex(collName, libraryName) directly until it stops returning " +
    "`partial`, then pass the result in as `opts.index`.");
  var collObj = idx.collection;
  var modes = idx.modes, modeNames = modes.map(function (m) { return m.name; });

  var live = {}, payload = [];
  idx.vars.forEach(function (v) {
    live[v.name] = v;
    // an extended collection's values are keyed by ITS modes, not the parent's (sourceIndex)
    payload.push({ name: v.name, description: v.description, type: v.resolvedType,
      values: (idx.valuesById && idx.valuesById[v.id]) || v.valuesByMode });
  });

  // Step 3: a first segment shared by EVERY variable is a namespace, not a group,
  // and it can be several segments deep. DOCGEN.stripNamespace is the one tested
  // implementation; this function carried an inline copy of it until 1.18.0.
  var ns = DOCGEN.stripNamespace(payload.map(function (v) { return v.name; }));
  var effNames = ns.effs, strippedLast = ns.strippedLast;

  var plan = {};
  payload.forEach(function (v, vi) {
    var eff = effNames[vi];
    var seg = eff.split("/"), g, tbl, rn;
    if (seg.length >= 3)       { g = seg[0]; tbl = seg[1]; rn = seg.slice(2).join("/"); }
    else if (seg.length === 2) { g = seg[0]; tbl = seg[0]; rn = seg[1]; }
    else {
      // 1 segment only arises after stripping ("Colour/white" -> "white"). Group it
      // under the stripped namespace (or the collection); table = group so setupTable
      // hides the _Title. Without this branch, rn is undefined and lands in a Name cell.
      g = strippedLast || collName; tbl = g; rn = seg[0];
    }
    if (!plan[g]) plan[g] = {};
    if (!plan[g][tbl]) plan[g][tbl] = [];
    plan[g][tbl].push({ rn: rn, val: v.values[modes[0].modeId], v: v, live: live[v.name] });
  });

  var old = null, oldIdx = -1;
  for (var q = 0; q < figma.root.children.length; q++)
    if (figma.root.children[q].name === pageName) { old = figma.root.children[q]; oldIdx = q; }
  var page = figma.createPage(); page.name = pageName;   // the old page stays until this one is built
  var built = false;
  try {

  // Resolve BOTH variants once; the choice is made per table below (Step 4: the variant
  // must be right BEFORE rows are cloned, so clones inherit it).
  var plainVariant = null, aliasVariant = null;
  for (var w = 0; w < tblSet.children.length; w++) {
    if (tblSet.children[w].name === "Alias=False") plainVariant = tblSet.children[w];
    if (tblSet.children[w].name === "Alias=True")  aliasVariant = tblSet.children[w];
  }
  if (!plainVariant) plainVariant = tblSet.defaultVariant;
  if (!aliasVariant) aliasVariant = plainVariant;

  var groups = Object.keys(plan).sort(), frames = [], xOffset = 0;
  var expect = { fmt: fmt, frames: [] };               // what verifyPage checks the page against
  for (var gi = 0; gi < groups.length; gi++) {
    var g = groups[gi];
    var frame = docFrame(page, groups.length > 1 ? ((gi + 1) + " - " + g) : g, xOffset);
    frames.push(frame);
    var exFrame = { name: frame.name, group: g, tables: [] };
    expect.frames.push(exFrame);
    applySectionHeader(frame, shSet, g, null);

    var tableNames = Object.keys(plan[g]).sort();
    for (var ti = 0; ti < tableNames.length; ti++) {
      var tName = tableNames[ti];
      var rows = DOCGEN.orderRows(plan[g][tName]);

      // Any VARIABLE_ALIAS anywhere in the table -> Alias=True, decided BEFORE the
      // instance exists (primitive collections come out all-plain automatically).
      var anyAlias = false;
      for (var ar = 0; ar < rows.length && !anyAlias; ar++)
        for (var am = 0; am < modes.length; am++) {
          var av = rows[ar].v.values[modes[am].modeId];
          if (av && av.type === "VARIABLE_ALIAS") { anyAlias = true; break; }
        }
      var tbl = (anyAlias ? aliasVariant : plainVariant).createInstance();
      frame.appendChild(tbl);
      setupTable(tbl, tName, g);              // hides _Title when it repeats the frame group
      exFrame.tables.push({ heading: tName, headers: [firstColLabel].concat(modeNames),
        rows: rows.map(function (row) {
          return { name: row.rn, alias: modes.filter(function (md) {
            var x = row.v.values[md.modeId]; return !!x && x.type === "VARIABLE_ALIAS"; }).length };
        }) });

      var hs = headerCellsOf(tbl);
      adjustRowCount(hs, modes.length + 1);
      setCellText(hs.children[0], firstColLabel);
      for (var hm = 0; hm < modes.length; hm++) setCellText(hs.children[hm + 1], modes[hm].name);

      var rowsSlot = rowsSlotOf(tbl);
      adjustRowCount(rowsSlot, rows.length);
      for (var r = 0; r < rows.length; r++) {
        var row = rowsSlot.children[r];
        setColumnCount(row, modes.length + 1);
        var cells = getCells(row);
        setCellContent(cells[0], "Text");
        setSwatchBool(cells[0], false);
        setCellText(cells[0], rows[r].rn);
        for (var m = 0; m < modes.length; m++) {
          await fillValueCell(cells[m + 1], rows[r], modes[m], modeNames, fmt, idx, collObj);
        }
      }
    }
    xOffset += frame.width + 160;
  }
  // frame 1 to the top of the layers panel
  for (var z = frames.length - 1; z >= 0; z--) page.appendChild(frames[z]);
  page.setPluginData("dg.expect", JSON.stringify(expect));
  built = true;
  } finally { if (!built) await discardPage(page, old); }
  await swapInPage(page, old, oldIdx);              // regenerating replaces; it never appends
  return page;
}


/* ===================== Shadows page =====================
 * One frame per effect-style group, a Preview strip, then one Table - Effects
 * per style and one row per effect. Order comes from the styles array at every
 * level — an elevation ramp alphabetised is destroyed.
 * `styles` is DOCGEN.stylesFromSnapshot(tokens).effectStyles; `vidx` is
 * styleIndexByName(). Pass the live array in-file and it behaves the same. */
async function generateShadows(pageName, shSet, teComp, peComp, styles, vidx, fmt) {
  await loadDocFonts();
  fmt = fmt || "hex";
  vidx = vidx || { byName: {}, collById: {} };

  var groupOrder = [], byGroup = {};
  for (var i = 0; i < styles.length; i++) {
    var sp = DOCGEN.splitEffectName(styles[i].name);
    if (!byGroup[sp.frameGroup]) { byGroup[sp.frameGroup] = []; groupOrder.push(sp.frameGroup); }
    byGroup[sp.frameGroup].push({ style: styles[i], table: sp.tableName, sub: sp.hasSubtitle });
  }

  var old = null, oldIdx = -1;
  for (var q = 0; q < figma.root.children.length; q++)
    if (figma.root.children[q].name === pageName) { old = figma.root.children[q]; oldIdx = q; }
  var page = figma.createPage(); page.name = pageName;   // the old page stays until this one is built
  var built = false;
  try {

  var frames = [], xOffset = 0;
  var EFFECT_FIELDS = ["offsetX", "offsetY", "radius", "spread", "color"];   // fillEffectRow's columns 2-6
  var expect = { fmt: fmt, frames: [] };               // what verifyPage checks the page against
  for (var g = 0; g < groupOrder.length; g++) {
    var grp = groupOrder[g], entries = byGroup[grp];
    var frame = docFrame(page, (g + 1) + " - " + grp, xOffset);
    frames.push(frame);
    var exFrame = { name: frame.name, group: grp, tables: [] };
    expect.frames.push(exFrame);
    applySectionHeader(frame, shSet, grp, null);

    // Preview strip — built from the SAME entries array as the tables below, so
    // the two orders cannot drift apart.
    if (peComp) {
      var pv = peComp.createInstance();
      frame.appendChild(pv);
      var pslot = pv.findOne(function (n) { return n.name === "Content slot" && n.type === "SLOT"; });
      if (pslot) {
        adjustRowCount(pslot, entries.length);
        for (var pi = 0; pi < entries.length && pi < pslot.children.length; pi++) {
          var item = pslot.children[pi];
          var ip = item.componentProperties;
          for (var k in ip) if (ip[k].type === "TEXT") { var o = {}; o[k] = entries[pi].table; item.setProperties(o); break; }
          var sw = item.findOne(function (n) { return n.name === "Swatch"; });
          if (sw && entries[pi].style.id) { try { await sw.setEffectStyleIdAsync(entries[pi].style.id); } catch (e) {} }
          else if (sw) sw.effects = liveEffects(entries[pi].style.effects);
        }
      }
    }

    for (var t = 0; t < entries.length; t++) {
      var ent = entries[t], effects = ent.style.effects;
      var tbl = teComp.createInstance();
      frame.appendChild(tbl);
      setupTable(tbl, ent.table, grp);
      var hs = headerCellsOf(tbl);
      var HEAD = ["Type", "X", "Y", "Blur", "Spread", DOCGEN.ours("Colour")];
      adjustRowCount(hs, HEAD.length);
      for (var h = 0; h < HEAD.length && h < hs.children.length; h++) setCellText(hs.children[h], HEAD[h]);
      exFrame.tables.push({ heading: ent.table, headers: HEAD,
        rows: effects.map(function (e) {
          return { name: DOCGEN.shadowType(e.type),
                   alias: EFFECT_FIELDS.filter(function (fd) { return !!(e.bound || {})[fd]; }).length };
        }) });

      var rowsSlot = rowsSlotOf(tbl);
      adjustRowCount(rowsSlot, effects.length);
      for (var r = 0; r < effects.length; r++) {
        var cells = getCells(rowsSlot.children[r]);
        await fillEffectRow(cells, effects[r], vidx, fmt);
      }
    }
    xOffset += frame.width + 160;
  }
  for (var z = frames.length - 1; z >= 0; z--) page.appendChild(frames[z]);
  page.setPluginData("dg.expect", JSON.stringify(expect));
  built = true;
  } finally { if (!built) await discardPage(page, old); }
  await swapInPage(page, old, oldIdx);
  return page;
}

function liveEffects(effects) {
  var out = [];
  for (var i = 0; i < effects.length; i++) {
    var e = effects[i];
    if (e.type === "BACKGROUND_BLUR" || e.type === "LAYER_BLUR") { out.push({ type: e.type, visible: true, radius: e.radius }); continue; }
    // Build the key, never assign it undefined. Figma validates effects by exact
    // key set per type, and an INNER_SHADOW carrying showShadowBehindNode:undefined
    // is rejected as an unrecognized key — the property is present whatever its
    // value. Killed a whole Shadows run at the first inner shadow it met.
    var shadow = { type: e.type, visible: true, blendMode: "NORMAL",
      color: e.color || { r: 0, g: 0, b: 0, a: 0.1 },
      offset: { x: e.x || 0, y: e.y || 0 }, radius: e.radius || 0, spread: e.spread || 0 };
    if (e.type === "DROP_SHADOW") shadow.showShadowBehindNode = false;
    out.push(shadow);
  }
  return out;
}

async function fillEffectRow(cells, eff, vidx, fmt) {
  var FIELDS = [null, "offsetX", "offsetY", "radius", "spread", "color"];
  var RAW = [null, eff.x, eff.y, eff.radius, eff.spread, eff.color];
  setCellContent(cells[0], "Text"); setSwatchBool(cells[0], false);
  setCellText(cells[0], DOCGEN.shadowType(eff.type));      // Type is never a variable
  for (var c = 1; c < cells.length && c < FIELDS.length; c++) {
    var name = (eff.bound || {})[FIELDS[c]];
    var isColor = FIELDS[c] === "color";
    if (name) {
      setAliasCell(cells[c], isColor ? name : DOCGEN.lastSegment(name), isColor);
      var pv = vidx.byName[name];
      if (isColor && pv) {
        var pc = vidx.collById[pv.variableCollectionId];
        if (pc) await bindSwatch(cells[c], pv, pc, pc.modes[0].modeId);
      } else if (isColor) {
        // The token is real but UNREACHABLE from here — a hidden primitive tier
        // publishes nothing, so vidx cannot hold it. Leaving the swatch alone is
        // the trap: rows are cloned from a donor, so it keeps the donor's binding
        // and renders a plausible chip of an unrelated token while the label names
        // the right one. Observed live — three focus rings and an inner highlight
        // all showed Background/Neutral/soft. Paint the literal and drop the
        // inherited binding; a static swatch is correct for a hidden tier.
        var sw = swatchOf(cells[c]);
        if (sw && RAW[c]) sw.fills = [{ type: "SOLID", visible: true, blendMode: "NORMAL",
          opacity: (RAW[c].a === undefined ? 1 : RAW[c].a),
          color: { r: RAW[c].r, g: RAW[c].g, b: RAW[c].b } }];
      }
      continue;
    }
    setCellContent(cells[c], "Text"); setSwatchBool(cells[c], false);
    if (RAW[c] === undefined || RAW[c] === null) { setCellText(cells[c], "-"); continue; }
    // no backing variable means no authored OKLCH, so a colour correctly stays hex
    setCellText(cells[c], isColor ? DOCGEN.colourLabel(RAW[c], null, fmt) : DOCGEN.num(RAW[c]));
  }
}

/* ===================== Text styles page =====================
 * `styles` is DOCGEN.stylesFromSnapshot(tokens).textStyles. `webByGroup` is the per-group unit
 * decision from Step 2.1, keyed by the ORIGINAL first segment. Returns the
 * pages it built — one per parent tier, or a single page when there is none. */
async function generateTextStyles(styles, plan, shSet, tvComp, tsComp, webByGroup, vidx, opts) {
  await loadDocFonts();
  webByGroup = webByGroup || {}; vidx = vidx || { byName: {}, collById: {} };
  // The web letter-spacing unit is a PROJECT decision, not a fact about the styles.
  // unitTextFor's web branch emits em, which is right for a CSS-em project and
  // wrong for one that documents rem — and rem is not em-with-a-different-suffix:
  // Figma's percent is relative to the FONT size and rem to the ROOT, so one
  // authored -1% is a different rem at every size it is used at. Defaulting to em
  // preserves existing behaviour; passing {letterSpacingUnit:"rem", rootSize:16}
  // makes the page regenerable for a project whose ruling says rem. Without this
  // the generator silently reverted such a ruling on every refill.
  opts = opts || {};

  var buckets = [], order = [];
  for (var i = 0; i < styles.length; i++) {
    var full = styles[i].name, parts = full.split("/");
    var parent = plan.mode === "single" ? null : parts[0];
    var rest = parent ? parts.slice(1) : parts;
    var pageName = parent ? ("Text styles - " + parent) : "Text styles";
    if (order.indexOf(pageName) === -1) { order.push(pageName); buckets[pageName] = { parent: parent, tableOrder: [], tables: {} }; }
    var b = buckets[pageName];
    var table = rest[0], row = rest.slice(1).join("/");
    if (!b.tables[table]) { b.tables[table] = []; b.tableOrder.push(table); }
    b.tables[table].push({ row: row, s: styles[i], web: !!webByGroup[parts[0]] });
  }

  var built = [];
  for (var pi = 0; pi < order.length; pi++) {
    var pageName2 = order[pi], bucket = buckets[pageName2];
    var old = null, oldIdx = -1;
    for (var q = 0; q < figma.root.children.length; q++)
      if (figma.root.children[q].name === pageName2) { old = figma.root.children[q]; oldIdx = q; }
    var page = figma.createPage(); page.name = pageName2;   // the old page stays until this one is built
    var pageDone = false;
    try {

    var mk = function (nm, x, heading) {
      var fr = docFrame(page, nm, x);
      // a reader deep-linked into a frame cannot see the page name, so the
      // subtitle still carries the platform
      applySectionHeader(fr, shSet, heading, bucket.parent);
      return fr;
    };
    var fv = mk("1 - Values", 0, "Values");
    var fs = mk("2 - Samples", 1476, "Samples");
    var TEXT_FIELDS = ["fontFamily", "fontSize", "fontStyle", "letterSpacing", "lineHeight"];  // fillTextValueRow's columns 2-6
    var exV = { name: fv.name, group: "Values", tables: [] }, exS = { name: fs.name, group: "Samples", tables: [] };

    for (var t = 0; t < bucket.tableOrder.length; t++) {
      var tName = bucket.tableOrder[t], rows = bucket.tables[tName];

      var tv = tvComp.createInstance(); fv.appendChild(tv);
      setupTable(tv, tName, "");                       // never redundant on this page
      var HEAD = ["Name", "Family", "Size", "Weight", "Letter spacing", "Line-height"];
      exV.tables.push({ heading: tName, headers: HEAD, rows: rows.map(function (en) {
        return { name: en.row, alias: TEXT_FIELDS.filter(function (fd) { return !!(en.s.bound || {})[fd]; }).length };
      }) });
      if (tsComp) exS.tables.push({ heading: tName, samples: rows.map(function (en) { return en.row; }) });
      var hs = headerCellsOf(tv);
      adjustRowCount(hs, HEAD.length);
      for (var h = 0; h < HEAD.length && h < hs.children.length; h++) setCellText(hs.children[h], HEAD[h]);
      var rs = rowsSlotOf(tv);
      adjustRowCount(rs, rows.length);
      for (var r = 0; r < rows.length; r++) {
        var cells = getCells(rs.children[r]);
        await fillTextValueRow(cells, rows[r], vidx, opts);
      }

      if (tsComp) {
        var ts = tsComp.createInstance(); fs.appendChild(ts);
        setupTable(ts, tName, "");
        var slot = ts.findOne(function (n) { return n.name === "Content slot" && n.type === "SLOT"; });
        if (slot) {
          adjustRowCount(slot, rows.length);
          for (var si = 0; si < rows.length && si < slot.children.length; si++) {
            var sample = slot.children[si];
            var lab = sample.findOne(function (n) { return n.type === "TEXT" && n.name === "Label"; });
            if (lab) lab.characters = rows[si].row;
            var body = sample.findOne(function (n) { return n.type === "TEXT" && n.name === "Text"; });
            if (!body) body = sample.findAll(function (n) { return n.type === "TEXT"; })[0];
            // import and apply in the SAME call — a style id does not survive a
            // plugin restart, so a cached one comes back "Cannot find style"
            if (body && rows[si].s.key) {
              try { var st = await figma.importStyleByKeyAsync(rows[si].s.key); await body.setTextStyleIdAsync(st.id); }
              catch (e) {}
            } else if (body && rows[si].s.id) { try { await body.setTextStyleIdAsync(rows[si].s.id); } catch (e) {} }
          }
        }
      }
    }
    var ordered = page.children.slice();
    for (var z = ordered.length - 1; z >= 0; z--) page.appendChild(ordered[z]);
    // fmt null: a text-styles page carries no colour, so the format check does not apply
    page.setPluginData("dg.expect", JSON.stringify({ fmt: null, frames: [exV, exS] }));
    pageDone = true;
    } finally { if (!pageDone) await discardPage(page, old); }
    await swapInPage(page, old, oldIdx);
    built.push(page);
  }
  return built;
}

// One place decides the letter-spacing string, so the table and any badged
// metric table cannot disagree. rem is size-dependent, so it is computed from
// the style's OWN fontSize against the project root — never from the root alone.
function letterSpacingText(st, web, opts) {
  if (web && opts && opts.letterSpacingUnit === "rem") {
    var o = st.letterSpacing;
    if (!o || !o.value) return "0rem";
    return DOCGEN.cssLetterSpacingRem(o, st.fontSize, opts.rootSize || 16) || "0rem";
  }
  return DOCGEN.unitTextFor("letterSpacing", st.letterSpacing, st.fontSize, web);
}

async function fillTextValueRow(cells, entry, vidx, opts) {
  opts = opts || {};
  var st = entry.s, b = st.bound || {};
  var FIELD = [null, "fontFamily", "fontSize", "fontStyle", "letterSpacing", "lineHeight"];
  setCellContent(cells[0], "Text"); setSwatchBool(cells[0], false); setCellText(cells[0], entry.row);
  for (var c = 1; c < cells.length && c < FIELD.length; c++) {
    var name = b[FIELD[c]];
    if (name) { setAliasCell(cells[c], DOCGEN.lastSegment(name), false); continue; }  // never convert an alias
    setCellContent(cells[c], "Text"); setSwatchBool(cells[c], false);
    if (FIELD[c] === "letterSpacing") setCellText(cells[c], letterSpacingText(st, entry.web, opts));
    else if (FIELD[c] === "lineHeight") setCellText(cells[c], DOCGEN.unitTextFor("lineHeight", st.lineHeight, st.fontSize, entry.web));
    else if (FIELD[c] === "fontFamily") setCellText(cells[c], st.family);
    else if (FIELD[c] === "fontSize") setCellText(cells[c], DOCGEN.num(st.fontSize));
    else setCellText(cells[c], st.style);
  }
}

/* ===================== Step 2.2: type metrics that are not variables =====================
 * Badged Name | Value tables on the VARIABLES page, built into the frame that
 * already holds the type tokens. `styles` is DOCGEN.stylesFromSnapshot(tokens)
 * .textStyles (or live styles). opts: { lineHeightUnit: "unitless" | "authored",
 * letterSpacingUnit: "em" | "rem" | "authored", rootSize, badgeText, fields }.
 * Both units are the maintainer's answers (Step 2.2 asks them; nothing here
 * defaults them silently); rem needs rootSize. Each table is inserted at its
 * alphabetical place among the frame's existing tables, so it interleaves with
 * Family/Size/Weight — the badge, not the position, marks it as not a token.
 * Exclude these rows from any coverage count: they map to no variable. */
function tableTitleText(tbl) {
  var t = tbl.findOne(function (n) { return n.name === "_Title" && n.type === "INSTANCE"; });
  if (!t) return "";
  var k = keyFor(t, "Title text", "TEXT");
  return k ? String(t.componentProperties[k].value) : "";
}

// The badge text when the table's Label is on, else "" — a table with no badge
// was not built by generateMetricTables.
function tableBadgeText(tbl) {
  var t = tbl.findOne(function (n) { return n.name === "_Title" && n.type === "INSTANCE"; });
  if (!t) return "";
  var lk = keyFor(t, "Label", "BOOLEAN"), lt = keyFor(t, "Label text", "TEXT");
  if (!lk || !lt || t.componentProperties[lk].value !== true) return "";
  return String(t.componentProperties[lt].value);
}

function insertTableAlphabetically(frame, tbl, tableName) {
  var at = frame.children.length, key = tableName.toLowerCase();
  for (var i = 0; i < frame.children.length; i++) {
    var c = frame.children[i];
    if (c === tbl || c.type !== "INSTANCE" || c.name.indexOf("Table") !== 0) continue;
    if (tableTitleText(c).toLowerCase() > key) { at = i; break; }
  }
  frame.insertChild(at, tbl);
}

function generateMetricTables(frame, tblVariant, styles, opts) {
  opts = opts || {};
  var badge = opts.badgeText || "Not a variable";
  var fields = opts.fields || ["letterSpacing", "lineHeight"];
  var out = [], plan = [];
  // Validate every field before writing anything, so a refusal leaves no half-built page.
  for (var f = 0; f < fields.length; f++) {
    var field = fields[f], isLs = field === "letterSpacing";
    var unit = isLs ? opts.letterSpacingUnit : opts.lineHeightUnit;
    if (!unit) throw new Error("generateMetricTables: no " + (isLs ? "letterSpacingUnit" : "lineHeightUnit") +
      " — Step 2.2 asks this; it has no safe default.");
    if (isLs && unit === "rem" && !opts.rootSize) throw new Error(
      "generateMetricTables: rem needs rootSize — ask for it, and state it in the badge and report.");
    // line-height is ALWAYS value-keyed; only rem letter-spacing is size-dependent
    var rows = DOCGEN.metricRows(styles, field, isLs && unit === "rem");
    var labels = rows.map(function (row) {
      return isLs ? DOCGEN.letterSpacingLabel(row, unit, opts.rootSize) : DOCGEN.lineHeightLabel(row, unit);
    });
    for (var q = 0; q < rows.length; q++) if (labels[q] === null) throw new Error(
      "generateMetricTables: " + field + " " + DOCGEN.metricRowName(rows[q]) + " is in pixels, and " + unit +
      " needs the font size to convert it — answer 'authored' for this field, or bind the value to a variable.");
    plan.push({ isLs: isLs, rows: rows, labels: labels, name: isLs ? "Letter spacing" : "Line height" });
  }
  for (var p = 0; p < plan.length; p++) {
    var rows = plan[p].rows, labels = plan[p].labels, name = plan[p].name;

    // remove a previous run's table of the same name — idempotent on retry.
    // Only a badged table: a real variable table generate() built can share the
    // title, and setupTable forces its Label off. Any badge text, not just this
    // run's — the badge changes when the user states the root size in it.
    for (var i = frame.children.length - 1; i >= 0; i--) {
      var c = frame.children[i];
      if (c.type === "INSTANCE" && c.name.indexOf("Table") === 0 && tableTitleText(c) === name &&
          tableBadgeText(c) !== "") c.remove();
    }
    var tbl = tblVariant.createInstance();
    insertTableAlphabetically(frame, tbl, name);
    var badged = setupTableBadged(tbl, name, badge);   // NOT setupTable — that forces Label off

    var hs = headerCellsOf(tbl);
    adjustRowCount(hs, 2);
    setCellText(hs.children[0], "Name");
    setCellText(hs.children[1], "Value");
    var rs = rowsSlotOf(tbl);
    adjustRowCount(rs, rows.length);
    for (var r = 0; r < rows.length; r++) {
      setColumnCount(rs.children[r], 2);
      var cells = getCells(rs.children[r]);
      for (var k = 0; k < 2; k++) { setCellContent(cells[k], "Text"); setSwatchBool(cells[k], false); }
      setCellText(cells[0], DOCGEN.metricRowName(rows[r]));
      setCellText(cells[1], labels[r]);
    }
    out.push({ table: name, rows: rows.length, badged: badged });
  }
  return out;
}

  // public surface — explicit, because eval scope will not do it for us
  globalThis.generateMetricTables = generateMetricTables;
  globalThis.generate = generate;
  globalThis.restorePagePosition = restorePagePosition;
  globalThis.fillValueCell = fillValueCell;
  globalThis.generateShadows = generateShadows;
  globalThis.fillEffectRow = fillEffectRow;
  globalThis.liveEffects = liveEffects;
  globalThis.generateTextStyles = generateTextStyles;
  globalThis.fillTextValueRow = fillTextValueRow;
  globalThis.letterSpacingText = letterSpacingText;
  globalThis.tableTitleText = tableTitleText;        // scripts/verify.js reads headings and badges through these
  globalThis.tableBadgeText = tableBadgeText;
};

// Self-cache: store this factory's own source so later calls bootstrap from
// plugin data instead of the agent re-sending the page recipes. Only Figma runs this;
// node loads the file to compute the expected hash.
if (typeof figma !== 'undefined') {
  globalThis.__RECIPES_FACTORY();
  var __s = globalThis.__RECIPES_FACTORY.toString();
  // The hash GATES the write. Reporting it afterwards would be too late: a
  // corrupt transcription would already be cached and reused by every later
  // session. Set globalThis.__DG_EXPECT to the matching line from
  // `node scripts/hash.js` and a bad paste is refused instead of persisted.
  var __e = globalThis.__DG_EXPECT && globalThis.__DG_EXPECT['dg.recipes.v1'];
  var __ok = !__e || (typeof DOCGEN !== 'undefined' && DOCGEN.srcHash(__s) === __e);
  if (__ok) figma.root.setPluginData('dg.recipes.v1', __s);
  globalThis.__DG_CACHED = Object.assign(globalThis.__DG_CACHED || {}, { 'dg.recipes.v1': __ok });
}
