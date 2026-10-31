/* verify.js — Step 5's programmatic checks, as one call per page.
 *
 * Reads a generated page back into plain data (readDocPage) and hands it to
 * DOCGEN.verifyDoc, which runs every query in references/failures.md's
 * *Verification queries* table over every row and returns
 *   { verdict: "clean" | "partial" | "issues", issues, notRun, fallbacks, counts }.
 * The checks are the tested half (tests/test-docgen.js); this file only reads,
 * and is exercised against the fake Figma in tests/test-recipes.js.
 *
 * Load after docgen.js, figma-helpers.js and recipes.js (pasted or bootstrapped
 * from their cache), then, in a call AFTER the one that built or resized the
 * page (F7: a measurement never comes from the call that changed the geometry):
 *
 *   return await verifyPage(figma.root.children.find(p => p.name === "Semantic"))
 *
 * The expectation is the one the recipe stored on the page as it built it
 * (plugin data `dg.expect`: frames, tables, headings, header labels, row names
 * in order, alias count per row, colour format). After a hand refill in place,
 * pass the expectation as the second argument instead. With none, the checks
 * that need the source are listed in `notRun` and the verdict is "partial".
 *
 * What stays the agent's: whether each finding is a defect (governing lesson 3)
 * and the checks in SKILL.md Step 5 that are about intent rather than state.
 * Reads only; writes nothing.
 */

async function readDocCell(c, varName) {
  var p = c.componentProperties || {}, label = null, swatchOn = false, content = null;
  for (var k in p) {
    if (label === null && p[k].type === "TEXT") label = String(p[k].value);
    if (k === "Content" && p[k].type === "VARIANT") content = p[k].value;
  }
  var sk = keyFor(c, "Swatch", "BOOLEAN");
  if (sk) swatchOn = p[sk].value === true;
  var pill = null;
  if (content === "Alias") {
    var pn = c.findOne(function (n) { return n.type === "INSTANCE" && n.name === "Pill"; });
    var pp = pn ? pn.componentProperties : {};
    for (var q in pp) if (pp[q].type === "TEXT") { pill = String(pp[q].value); break; }
  }
  var sw = swatchOf(c), bv = sw && sw.fills[0] && sw.fills[0].boundVariables && sw.fills[0].boundVariables.color;
  return { content: content, label: label, pill: pill, rendered: renderedText(c), swatchOn: swatchOn,
           swatchVar: bv ? await varName(bv.id) : null };
}

async function readDocTable(t, varName) {
  var title = t.findOne(function (n) { return n.name === "_Title" && n.type === "INSTANCE"; });
  var out = { id: t.id, name: t.name, heading: tableTitleText(t), titleVisible: !!title && effVisible(title),
              badge: tableBadgeText(t), width: t.width, headers: headerLabels(t) };
  var rs = rowsSlotOf(t);
  if (rs) {
    out.rows = [];
    for (var r = 0; r < rs.children.length; r++) {
      var row = rs.children[r];
      if (!effVisible(row)) continue;
      var cells = getCells(row), read = [];
      for (var c = 0; c < cells.length; c++) if (effVisible(cells[c])) read.push(await readDocCell(cells[c], varName));
      out.rows.push({ cells: read });
    }
    return out;
  }
  // Table - Text sample: no rows, one sample per style, labelled by its Label text.
  var slot = t.findOne(function (n) { return n.name === "Content slot"; });
  out.samples = [];
  if (slot) for (var s = 0; s < slot.children.length; s++) {
    if (!effVisible(slot.children[s])) continue;
    var lab = slot.children[s].findOne(function (n) { return n.type === "TEXT" && n.name === "Label"; });
    out.samples.push(lab ? lab.characters : "");
  }
  delete out.headers;
  return out;
}

async function readDocPage(page) {
  var names = {};
  var varName = async function (id) {
    if (!(id in names)) { var v = null; try { v = await figma.variables.getVariableByIdAsync(id); } catch (e) {} names[id] = v ? v.name : "(unresolved " + id + ")"; }
    return names[id];
  };
  var snap = { page: page.name, children: [] };
  for (var i = 0; i < page.children.length; i++) {
    var f = page.children[i], fr = { id: f.id, type: f.type, name: f.name };
    if (f.type === "FRAME") {
      fr.cornerRadius = f.cornerRadius; fr.cornerSmoothing = f.cornerSmoothing; fr.itemSpacing = f.itemSpacing;
      fr.padding = [f.paddingTop, f.paddingRight, f.paddingBottom, f.paddingLeft];
      fr.tables = [];
      for (var j = 0; j < f.children.length; j++) {
        var t = f.children[j];
        if (t.type === "INSTANCE" && t.name.indexOf("Table") === 0 && effVisible(t)) fr.tables.push(await readDocTable(t, varName));
      }
      // Visible placeholder words outside any _Title (F4, F5); verifyDoc excuses the intended ones.
      fr.placeholders = placeholderTexts(f, DOCGEN.VERIFY_WORDS)
        .filter(function (n) { return !inTitle(n); })
        .map(function (n) { return { id: n.id, text: n.characters }; });
    }
    snap.children.push(fr);
  }
  return snap;
}

async function verifyPage(page, expect) {
  if (!page) throw new Error("verifyPage: no page — pass the page node, found by name in figma.root.children");
  if (page.loadAsync) await page.loadAsync();   // dynamic-page: another page's children are empty until loaded
  if (!expect) { var raw = page.getPluginData("dg.expect"); expect = raw ? JSON.parse(raw) : null; }
  var result = DOCGEN.verifyDoc(await readDocPage(page), expect);
  result.page = page.name;
  result.expectation = expect ? "stored by the recipe or passed in" : "none";
  return result;
}

// Installed explicitly: indirect eval does not leak declarations here (recipes.js).
globalThis.readDocPage = readDocPage;
globalThis.verifyPage = verifyPage;
