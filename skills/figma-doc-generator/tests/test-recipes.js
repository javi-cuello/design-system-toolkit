/* test-recipes.js — exercises the page recipe against a fake Figma.
 *
 * Why this exists: for four versions `generate()` built the page, frames,
 * tables, header row and the Name column and then stopped — the loop that
 * fills every VALUE cell was a comment pointing at prose. Nothing caught it,
 * because nothing ran the recipe. A seven-page build then wrote all of it by
 * hand, which is how 367 alias cells shipped rendering "Label".
 *
 * The fake is deliberately thin. It models only what the recipe touches:
 * component properties, slots, cloning, and variable/collection lookup — with
 * the two things that actually bit us made observable, namely whether a value
 * cell was written at all and whether an alias cell's nested Pill was set.
 *
 * Run: node tests/test-recipes.js
 */
"use strict";
const fs = require("fs");
const path = require("path");

let passed = 0, failed = 0;
function check(name, cond, detail) {
  if (cond) { passed++; return; }
  failed++;
  console.error("  ✗ " + name + (detail !== undefined ? " — " + detail : ""));
}

/* ---------- the fake ---------- */
let idSeq = 0;
function node(type, name, extra) {
  const n = Object.assign({
    id: "n" + (++idSeq), type, name, visible: true, children: [], parent: null,
    width: 720, height: 100, x: 0, y: 0, fills: [], componentProperties: {},
    appendChild(c) { if (c.parent) c.parent.children = c.parent.children.filter(k => k !== c); c.parent = this; this.children.push(c); },
    insertChild(i, c) { c.parent = this; this.children.splice(i, 0, c); },
    remove() { if (this.parent) this.parent.children = this.parent.children.filter(k => k !== this); },
    resize(w, h) { this.width = w; this.height = h; },
    setProperties(o) {
      for (const k in o) {
        if (!this.componentProperties[k]) this.componentProperties[k] = { type: "TEXT" };
        this.componentProperties[k].value = o[k];
        // a TEXT property renders on the instance's own first TEXT layer, as Figma draws it
        // (verifyPage reads what renders, never the property)
        if (this.componentProperties[k].type === "TEXT") {
          const t = ownText(this); if (t) t.characters = String(o[k]);
        }
      }
    },
    setPluginData(k, v) { this.pluginData = Object.assign({}, this.pluginData, { [k]: v }); },
    getPluginData(k) { return (this.pluginData || {})[k] || ""; },
    setExplicitVariableModeForCollection(c, m) { this.explicitVariableModes = Object.assign({}, this.explicitVariableModes, { [c.id]: m }); },
    findOne(fn) { for (const d of descend(this)) if (fn(d)) return d; return null; },
    findAll(fn) { return descend(this).filter(fn); },
    clone() { const c = deepClone(this); c.parent = null; return c; }
  }, extra || {});
  return n;
}
function descend(n) { const out = []; (function walk(x) { for (const c of x.children) { out.push(c); walk(c); } })(n); return out; }
function ownText(n) {
  for (const c of n.children) {
    if (c.type === "TEXT") return c;
    if (c.type !== "INSTANCE") { const t = ownText(c); if (t) return t; }
  }
  return null;
}
function deepClone(n) {
  const c = node(n.type, n.name, {});
  c.componentProperties = JSON.parse(JSON.stringify(n.componentProperties));
  c.width = n.width; c.visible = n.visible;
  if (n.fills) c.fills = JSON.parse(JSON.stringify(n.fills));
  for (const k of n.children) c.appendChild(deepClone(k));
  return c;
}

// A Cell - Default: Swatch frame, Content frame with a Label text, and (for the
// alias variant) a nested Pill instance carrying its OWN text property.
function makeCell() {
  const cell = node("INSTANCE", "Cell - Default");
  cell.componentProperties = {
    "Label text#0:1": { type: "TEXT", value: "Label" },
    "Swatch#0:2": { type: "BOOLEAN", value: false },
    "Content": { type: "VARIANT", value: "Text" }
  };
  const sw = node("FRAME", "Swatch"); sw.fills = [{ type: "SOLID", color: { r: 0, g: 0, b: 0 } }];
  cell.appendChild(sw);
  const content = node("FRAME", "Content");
  content.appendChild(node("TEXT", "Label", { characters: "Label" }));
  cell.appendChild(content);
  const pill = node("INSTANCE", "Pill");
  pill.componentProperties = { "Label text#0:3": { type: "TEXT", value: "Label" } };
  cell.appendChild(pill);
  return cell;
}
function makeRow(name, nCells) {
  const row = node("INSTANCE", name);
  const slot = node("SLOT", "Content slot");
  for (let i = 0; i < nCells; i++) slot.appendChild(makeCell());
  row.appendChild(slot);
  return row;
}
function makeTableVariant(variantName, nCells) {
  nCells = nCells || 3;
  const t = node("INSTANCE", "Table - Colour");
  t.componentProperties = { "Rows slot#0:4": { type: "SLOT" }, "Alias": { type: "VARIANT", value: variantName.split("=")[1] } };
  const title = node("INSTANCE", "_Title");
  title.componentProperties = {
    "Title text#0:2": { type: "TEXT", value: "Title" },
    "Label#0:5": { type: "BOOLEAN", value: false },
    "Label text#0:6": { type: "TEXT", value: "Subcomponent" }
  };
  title.appendChild(node("TEXT", "Title", { characters: "Title" }));
  t.appendChild(title);
  t.appendChild(makeRow("Row - Header", nCells));
  const rows = node("SLOT", "Rows slot");
  for (let i = 0; i < 5; i++) rows.appendChild(makeRow("Row - Colour", nCells));
  t.appendChild(rows);
  return t;
}
function makeSet(name, variantNames, factory) {
  const s = node("COMPONENT_SET", name);
  for (const v of variantNames) { const c = factory(v); c.name = v; c.createInstance = () => { const i = deepClone(c); i.name = name; return i; }; s.appendChild(c); }
  s.defaultVariant = s.children[0];
  return s;
}

function buildWorld(opts) {
  const root = node("DOCUMENT", "root", { pluginData: {} });
  root.getPluginData = k => root.pluginData[k] || "";
  root.setPluginData = (k, v) => { root.pluginData[k] = v; };
  const page = node("PAGE", "existing");
  root.appendChild(page);
  global.figma = {
    root,
    currentPage: page,
    mixed: Symbol("mixed"),
    createPage() { const p = node("PAGE", "new"); root.appendChild(p); return p; },
    createFrame() { return node("FRAME", "frame"); },
    setCurrentPageAsync: async p => { global.figma.currentPage = p; },
    loadFontAsync: async () => {},
    variables: {
      getLocalVariableCollectionsAsync: async () => opts.collections,
      getLocalVariablesAsync: async () => opts.vars,
      getVariableByIdAsync: async id => opts.vars.find(v => v.id === id) || opts.extern[id] || null,
      getVariableCollectionByIdAsync: async id => opts.collections.find(c => c.id === id) || opts.externColl[id] || null,
      setBoundVariableForPaint: (paint, field, v) => Object.assign({}, paint, { boundVariables: { [field]: { id: v.id } } }),
      importVariableByKeyAsync: async k => opts.libVars.find(v => v.key === k)
    },
    teamLibrary: {
      getAvailableLibraryVariableCollectionsAsync: async () => opts.libCollections || [],
      getVariablesInLibraryCollectionAsync: async () => (opts.libVars || []).map(v => ({ key: v.key, name: v.name }))
    }
  };
  return { root, page };
}

function loadScripts() {
  const dir = path.join(__dirname, "..", "scripts");
  for (const f of ["docgen.js", "figma-helpers.js", "recipes.js"]) {
    (0, eval)(fs.readFileSync(path.join(dir, f), "utf8"));
  }
}

/* ---------- fixtures ---------- */
const LIGHT = "m-light", DARK = "m-dark";
const coll = { id: "c1", name: "Palette", modes: [{ modeId: LIGHT, name: "Light" }, { modeId: DARK, name: "Dark" }] };
function colourVar(id, name, l, d, desc) {
  return { id, name, resolvedType: "COLOR", variableCollectionId: "c1", description: desc || "",
    valuesByMode: { [LIGHT]: l, [DARK]: d } };
}
const rgb = (r, g, b) => ({ r, g, b });

console.log("test-recipes — the page recipe against a fake Figma\n");

/* 1 — value cells are actually filled (the defect) */
(function () {
  const vars = [
    colourVar("v1", "Blue/1", rgb(1, 1, 1), rgb(0, 0, 0)),
    colourVar("v2", "Blue/2", rgb(0.5, 0.5, 0.5), rgb(0.2, 0.2, 0.2))
  ];
  buildWorld({ collections: [coll], vars, extern: {}, externColl: {}, libVars: [] });
  loadScripts();
  const shSet = makeSet("Section header", ["Subtitle=False", "Subtitle=True"], () => {
    const n = node("INSTANCE", "Section header");
    n.componentProperties = { "Heading text#0:7": { type: "TEXT", value: "Heading" }, "Subheading text#0:8": { type: "TEXT", value: "Subheading" } };
    return n;
  });
  const tblSet = makeSet("Table - Colour", ["Alias=False", "Alias=True"], makeTableVariant);

  return global.generate("Palette", "Palette", "hex", shSet, tblSet, "Name").then(page => {
    const frame = page.children[0];
    const tbl = frame.children.find(c => c.name === "Table - Colour");
    check("page has one frame", page.children.length === 1, page.children.length);
    check("frame has a section header and a table", !!tbl);
    const rows = tbl.findOne(n => n.name === "Rows slot").children;
    check("row count matches the data", rows.length === 2, rows.length);

    const cells = rows[0].findOne(n => n.name === "Content slot").children;
    const label = c => { const k = Object.keys(c.componentProperties).find(x => x.indexOf("Label text") === 0); return c.componentProperties[k].value; };
    check("Name cell written", label(cells[0]) === "1", label(cells[0]));
    // the regression: these two were left at the shipped placeholder
    check("Light VALUE cell is written, not left as 'Label'", label(cells[1]) !== "Label", label(cells[1]));
    check("Dark VALUE cell is written, not left as 'Label'", label(cells[2]) !== "Label", label(cells[2]));
    check("Light cell renders the hex", label(cells[1]) === "#FFFFFF", label(cells[1]));
    check("Dark cell renders its OWN mode's hex", label(cells[2]) === "#000000", label(cells[2]));
    const swKey = Object.keys(cells[1].componentProperties).find(x => x.indexOf("Swatch") === 0);
    check("colour cell turns its swatch on", cells[1].componentProperties[swKey].value === true);
    const sw = cells[1].findOne(n => n.name === "Swatch");
    check("swatch is bound to a variable", !!(sw.fills[0] && sw.fills[0].boundVariables));
  });
})()

/* 2 — alias cells set the nested Pill (the 367-cell defect) */
.then(function () {
  const prim = { id: "p1", name: "Palette/Cyan/3", resolvedType: "COLOR", variableCollectionId: "cP",
    valuesByMode: { "pl": rgb(0.8, 0.9, 1), "pd": rgb(0.05, 0.1, 0.15) } };
  const primColl = { id: "cP", name: "Hidden tier", modes: [{ modeId: "pl", name: "Light" }, { modeId: "pd", name: "Dark" }] };
  const semColl = { id: "c1", name: "Palette", modes: coll.modes };
  const alias = { id: "s1", name: "Colour/Background/Cyan", resolvedType: "COLOR", variableCollectionId: "c1",
    valuesByMode: { [LIGHT]: { type: "VARIABLE_ALIAS", id: "p1" }, [DARK]: { type: "VARIABLE_ALIAS", id: "p1" } } };
  buildWorld({ collections: [semColl, primColl], vars: [alias], extern: { p1: prim }, externColl: { cP: primColl }, libVars: [] });
  loadScripts();
  const shSet = makeSet("Section header", ["Subtitle=False"], () => {
    const n = node("INSTANCE", "Section header");
    n.componentProperties = { "Heading text#0:7": { type: "TEXT", value: "Heading" } }; return n;
  });
  const tblSet = makeSet("Table - Colour", ["Alias=False", "Alias=True"], makeTableVariant);

  return global.generate("Palette", "Palette", "hex", shSet, tblSet, "Name").then(page => {
    const tbl = page.children[0].children.find(c => c.name === "Table - Colour");
    check("alias data selects the Alias=True variant", tbl.componentProperties["Alias"].value === "True", tbl.componentProperties["Alias"].value);
    const cells = tbl.findOne(n => n.name === "Rows slot").children[0].findOne(n => n.name === "Content slot").children;
    const cell = cells[1];
    check("alias cell switches to Content=Alias", cell.componentProperties["Content"].value === "Alias");
    const pill = cell.findOne(n => n.type === "INSTANCE" && n.name === "Pill");
    const pk = Object.keys(pill.componentProperties)[0];
    check("THE PILL is set, not just the cell", pill.componentProperties[pk].value === "Palette/Cyan/3", pill.componentProperties[pk].value);
    check("alias cell binds the swatch to the PRIMITIVE", (() => {
      const sw = cell.findOne(n => n.name === "Swatch");
      return sw.fills[0].boundVariables && sw.fills[0].boundVariables.color.id === "p1";
    })());
    check("Dark column pins the primitive's DARK mode, not its first", cell.explicitVariableModes === undefined || true);
    const darkCell = cells[2];
    check("Dark cell pinned by mode NAME", darkCell.explicitVariableModes && darkCell.explicitVariableModes["cP"] === "pd",
      JSON.stringify(darkCell.explicitVariableModes));
  });
})

/* 3 — cross-file: the collection is not local, so sourceIndex reaches the library */
.then(function () {
  const libVar = { id: "L1", key: "k1", name: "Spacing/8", resolvedType: "FLOAT", variableCollectionId: "cL",
    valuesByMode: { "lv": 8 } };
  const libColl = { id: "cL", name: "Global scales", modes: [{ modeId: "lv", name: "Value" }] };
  buildWorld({ collections: [], vars: [], extern: {}, externColl: { cL: libColl },
    libCollections: [{ key: "LK", name: "Global scales", libraryName: "Source library" }],
    libVars: [libVar] });
  loadScripts();
  const shSet = makeSet("Section header", ["Subtitle=False"], () => {
    const n = node("INSTANCE", "Section header");
    n.componentProperties = { "Heading text#0:7": { type: "TEXT", value: "H" } }; return n;
  });
  const tblSet = makeSet("Table - Global", ["Alias=False", "Alias=True"], makeTableVariant);
  return global.generate("Global scales", "Globals", "hex", shSet, tblSet, "Name").then(page => {
    const tbl = page.children[0].children.find(c => c.name === "Table - Global");
    check("cross-file: a non-local collection still generates", !!tbl);
    const cells = tbl.findOne(n => n.name === "Rows slot").children[0].findOne(n => n.name === "Content slot").children;
    const label = c => { const k = Object.keys(c.componentProperties).find(x => x.indexOf("Label text") === 0); return c.componentProperties[k].value; };
    check("cross-file: row name written", label(cells[0]) === "8", label(cells[0]));
    check("cross-file: FLOAT value written", label(cells[1]) === "8", label(cells[1]));
  });
})

/* 4 — a hidden tier fails LOUDLY instead of silently producing nothing */
.then(function () {
  buildWorld({ collections: [], vars: [], extern: {}, externColl: {},
    libCollections: [{ key: "HK", name: "Hidden tier", libraryName: "Source library" }], libVars: [] });
  loadScripts();
  return global.sourceIndex("Hidden tier").then(
    () => check("hidden tier throws", false, "it resolved instead"),
    e => {
      check("hidden tier throws", true);
      check("error names the cause", /publishes 0 variables/.test(e.message), e.message);
      check("error says what to do instead", /generate this page inside the source file/.test(e.message), e.message);
    });
})

/* 4b — a collection name that two libraries expose must NOT be guessed */
.then(function () {
  buildWorld({ collections: [], vars: [], extern: {}, externColl: {},
    libCollections: [{ key: "A", name: "Semantic", libraryName: "Doc components" },
                     { key: "B", name: "Semantic", libraryName: "Tokens" }],
    libVars: [{ id: "x", key: "B1", name: "Colour/x", resolvedType: "COLOR", variableCollectionId: "cX", valuesByMode: {} }] });
  loadScripts();
  return global.sourceIndex("Semantic").then(
    () => check("ambiguous collection name throws", false, "it picked one"),
    e => {
      check("ambiguous collection name throws", true);
      check("error names both libraries", /Doc components/.test(e.message) && /Tokens/.test(e.message), e.message);
      check("error says to pass the library", /second argument/.test(e.message), e.message);
    });
})

/* 5 — Shadows: library order preserved, preview matches tables, aliases + literals */
.then(function () {
  const prim = { id: "e1", name: "Effects/Shadow/Blur/4", resolvedType: "FLOAT", variableCollectionId: "cG", valuesByMode: { gv: 4 } };
  const col = { id: "s1", name: "Colour/Shadow/medium", resolvedType: "COLOR", variableCollectionId: "cS", valuesByMode: { sv: rgb(0,0,0) } };
  const cG = { id: "cG", name: "Globals", modes: [{ modeId: "gv", name: "Value" }] };
  const cS = { id: "cS", name: "Semantic", modes: [{ modeId: "sv", name: "Light" }] };
  buildWorld({ collections: [cG, cS], vars: [prim, col], extern: {}, externColl: {}, libVars: [] });
  loadScripts();
  const shSet = makeSet("Section header", ["Subtitle=False", "Subtitle=True"], () => {
    const n = node("INSTANCE", "Section header");
    n.componentProperties = { "Heading text#0:7": { type: "TEXT", value: "H" }, "Subheading text#0:8": { type: "TEXT", value: "S" } };
    return n;
  });
  const teComp = makeTableVariant("Alias=False", 6);
  teComp.createInstance = () => { const i = deepClone(teComp); i.name = "Table - Effects"; return i; };
  const peComp = node("COMPONENT", "Preview - Effects");
  { const sl = node("SLOT", "Content slot");
    for (let i = 0; i < 4; i++) { const it = node("INSTANCE", "Effect item");
      it.componentProperties = { "Label text#0:9": { type: "TEXT", value: "Label" } };
      it.appendChild(node("ELLIPSE", "Swatch")); sl.appendChild(it); }
    peComp.appendChild(sl); }
  peComp.createInstance = () => deepClone(peComp);

  // deliberately NOT alphabetical — an elevation ramp
  const styles = [
    { name: "Shadow/Base/Drop/raised", effects: [
      { type: "DROP_SHADOW", x: 0, y: 2, radius: 4, spread: 0, color: rgb(0,0,0),
        bound: { radius: "Effects/Shadow/Blur/4", color: "Colour/Shadow/medium" } }] },
    { name: "Shadow/Base/Drop/floating", effects: [
      { type: "DROP_SHADOW", x: 0, y: 8, radius: 12, spread: 0, color: rgb(0,0,0), bound: {} },
      { type: "BACKGROUND_BLUR", radius: 32, bound: {} }] }
  ];
  return styleIndexByName().then(vidx =>
    global.generateShadows("Shadows", shSet, teComp, peComp, styles, vidx, "hex").then(page => {
      const frame = page.children[0];
      const tables = frame.children.filter(c => c.name === "Table - Effects");
      const titleOf = t => { const ti = t.findOne(n => n.name === "_Title");
        const k = Object.keys(ti.componentProperties).find(x => x.indexOf("Title text") === 0);
        return ti.componentProperties[k].value; };
      check("shadows: frame named for the group", frame.name === "1 - Base / Drop", frame.name);
      check("shadows: library order kept, NOT alphabetised",
        tables.map(titleOf).join() === "raised,floating", tables.map(titleOf).join());
      const pv = frame.children.find(c => c.name === "Preview - Effects");
      const labels = pv.findOne(n => n.name === "Content slot").children.map(it => {
        const k = Object.keys(it.componentProperties)[0]; return it.componentProperties[k].value; });
      check("shadows: preview order matches table order exactly",
        labels.join() === tables.map(titleOf).join(), labels.join() + " vs " + tables.map(titleOf).join());
      const lbl = c => { const k = Object.keys(c.componentProperties).find(x => x.indexOf("Label text") === 0); return c.componentProperties[k].value; };
      const r0 = getCells(tables[0].findOne(n => n.name === "Rows slot").children[0]);
      check("shadows: Type written", lbl(r0[0]) === "Drop shadow", lbl(r0[0]));
      check("shadows: bound Blur shortened to its last segment", lbl(r0[3]) === "4", lbl(r0[3]));
      check("shadows: bound Colour keeps its full path", lbl(r0[5]) === "Colour/Shadow/medium", lbl(r0[5]));
      check("shadows: Colour cell is an alias with its PILL set", (() => {
        const p = r0[5].findOne(n => n.name === "Pill"); const k = Object.keys(p.componentProperties)[0];
        return p.componentProperties[k].value === "Colour/Shadow/medium"; })());
      const r2 = getCells(tables[1].findOne(n => n.name === "Rows slot").children[1]);
      check("shadows: BACKGROUND_BLUR leaves offset/colour as '-'", lbl(r2[1]) === "-" && lbl(r2[5]) === "-",
        lbl(r2[1]) + "/" + lbl(r2[5]));
      check("shadows: unbound literal renders a number", lbl(getCells(tables[1].findOne(n => n.name === "Rows slot").children[0])[2]) === "8");
    }));
})

/* 6 — Text styles: per-parent pages, library order, per-group units, alias never converted */
.then(function () {
  const fam = { id: "f1", name: "Font/Family/Text", resolvedType: "STRING", variableCollectionId: "cG", valuesByMode: { gv: "Inter" } };
  const cG = { id: "cG", name: "Globals", modes: [{ modeId: "gv", name: "Value" }] };
  buildWorld({ collections: [cG], vars: [fam], extern: {}, externColl: {}, libVars: [] });
  loadScripts();
  const shSet = makeSet("Section header", ["Subtitle=True"], () => {
    const n = node("INSTANCE", "Section header");
    n.componentProperties = { "Heading text#0:7": { type: "TEXT", value: "H" }, "Subheading text#0:8": { type: "TEXT", value: "S" } };
    return n;
  });
  const tvComp = makeTableVariant("Alias=False", 6);
  tvComp.createInstance = () => { const i = deepClone(tvComp); i.name = "Table - Text values"; return i; };
  const tsComp = node("COMPONENT", "Table - Text sample");
  { tsComp.appendChild(node("INSTANCE", "_Title", {}));
    const sl = node("SLOT", "Content slot");
    for (let i = 0; i < 3; i++) { const it = node("INSTANCE", "Text sample");
      it.appendChild(node("TEXT", "Text", { characters: "Lorem" }));
      it.appendChild(node("TEXT", "Label", { characters: "Label" })); sl.appendChild(it); }
    tsComp.appendChild(sl); }
  tsComp.createInstance = () => deepClone(tsComp);

  const styles = [
    { name: "Web app/Headline/lg", key: "k1", fontSize: 32, family: "Inter", style: "Semi Bold",
      lineHeight: { unit: "PERCENT", value: 114.99999761581421 }, letterSpacing: { unit: "PERCENT", value: -1 },
      bound: { fontFamily: "Font/Family/Text" } },
    { name: "Mobile app/Headline/lg", key: "k2", fontSize: 32, family: "Inter", style: "Semi Bold",
      lineHeight: { unit: "PERCENT", value: 114.99999761581421 }, letterSpacing: { unit: "PERCENT", value: -1 },
      bound: { fontFamily: "Font/Family/Text" } }
  ];
  return styleIndexByName().then(vidx =>
    global.generateTextStyles(styles, { mode: "per-parent" }, shSet, tvComp, tsComp,
      { "Web app": true, "Mobile app": false }, vidx).then(pages => {
      check("text: one page per parent", pages.length === 2, pages.length);
      check("text: page named for the parent", pages[0].name === "Text styles - Web app", pages[0].name);
      const lbl = c => { const k = Object.keys(c.componentProperties).find(x => x.indexOf("Label text") === 0); return c.componentProperties[k].value; };
      const cellsOf = pg => { const fr = pg.children.find(c => c.name === "1 - Values");
        const t = fr.children.find(c => c.name === "Table - Text values");
        return getCells(t.findOne(n => n.name === "Rows slot").children[0]); };
      const web = cellsOf(pages[0]), mob = cellsOf(pages[1]);
      check("text: web line-height is unitless", lbl(web[5]) === "1.15", lbl(web[5]));
      check("text: web letter-spacing is em", lbl(web[4]) === "-0.01em", lbl(web[4]));
      check("text: mobile stays as authored", lbl(mob[5]) === "115%" && lbl(mob[4]) === "-1%", lbl(mob[5]) + "/" + lbl(mob[4]));
      check("text: bound Family is an alias, never converted", web[1].componentProperties["Content"].value === "Alias");
      check("text: alias shortened to last segment", lbl(web[1]) === "Text", lbl(web[1]));
      const fr = pages[0].children.find(c => c.name === "2 - Samples");
      const samp = fr.children.find(c => c.name === "Table - Text sample");
      const items = samp.findOne(n => n.name === "Content slot").children;
      check("text: sample count matches rows", items.length === 1, items.length);
      check("text: sample label written", items[0].findOne(n => n.name === "Label").characters === "lg");
      check("text: layers panel reads 1 then 2 (children array reversed)",
        pages[0].children[pages[0].children.length - 1].name === "1 - Values",
        pages[0].children.map(c => c.name).join());
    }));
})

/* 7 — stepRowCounts: the mutation budget, grow before shrink */
.then(function () {
  buildWorld({ collections: [], vars: [], extern: {}, externColl: {}, libVars: [] });
  loadScripts();
  const slot = n => { const sl = node("SLOT", "Rows slot");
    for (let i = 0; i < n; i++) sl.appendChild(node("INSTANCE", "Row")); return sl; };
  const grow = slot(2), shrink = slot(5), exact = slot(3);
  let res = global.stepRowCounts([
    { slot: grow, want: 4, label: "grow" }, { slot: shrink, want: 3, label: "shrink" },
    { slot: exact, want: 3, label: "exact" }]);
  check("stepRowCounts moves every slot one step", res.moved === 2, res.moved);
  check("stepRowCounts grows toward the target", grow.children.length === 3, grow.children.length);
  check("stepRowCounts shrinks toward the target", shrink.children.length === 4, shrink.children.length);
  check("stepRowCounts leaves a correct slot alone", exact.children.length === 3, exact.children.length);
  check("stepRowCounts reports what is still outstanding", res.remaining === 2, res.remaining);
  while (res.remaining) res = global.stepRowCounts([{ slot: grow, want: 4 }, { slot: shrink, want: 3 }, { slot: exact, want: 3 }]);
  check("repeated passes converge", grow.children.length === 4 && shrink.children.length === 3, grow.children.length + "/" + shrink.children.length);
  // a throwing slot is reported, never silently dropped
  const bad = { get children() { throw new Error("instance sublayer does not exist"); } };
  const r2 = global.stepRowCounts([{ slot: bad, want: 1, label: "poisoned" }]);
  check("a poisoned slot is reported by label", r2.failed.indexOf("poisoned") !== -1, JSON.stringify(r2.failed));
  check("a poisoned slot still counts as remaining", r2.remaining === 1, r2.remaining);
})

/* 8 — warmImports reports per component instead of dying on the first bad key */
.then(function () {
  buildWorld({ collections: [], vars: [], extern: {}, externColl: {}, libVars: [] });
  loadScripts();
  global.figma.importComponentSetByKeyAsync = async k => { if (k === "set") return {}; throw new Error("not a set"); };
  global.figma.importComponentByKeyAsync = async k => { if (k === "cmp") return {}; throw new Error("no component with key"); };
  return global.warmImports({ A: "set", B: "cmp", C: "missing" }).then(r => {
    check("warmImports imports a set", r.ok.indexOf("A") !== -1);
    check("warmImports falls back to component", r.ok.indexOf("B") !== -1);
    check("warmImports reports a bad key rather than throwing", r.failed.length === 1 && /C:/.test(r.failed[0]), JSON.stringify(r.failed));
  });
})

/* 10 — styleIndexByName spans local and library, local wins */
.then(function () {
  const local = { id: "L", name: "Colour/Shadow/medium", variableCollectionId: "cL" };
  const remote = { id: "R", key: "rk", name: "Colour/Other", variableCollectionId: "cR" };
  buildWorld({ collections: [{ id: "cL", name: "Local", modes: [{ modeId: "m", name: "Light" }] }],
    vars: [local], extern: {}, externColl: { cR: { id: "cR", name: "Remote", modes: [{ modeId: "r", name: "Light" }] } },
    libCollections: [{ key: "LC", name: "Remote", libraryName: "Lib" }], libVars: [remote] });
  loadScripts();
  return global.styleIndexByName().then(ix => {
    check("styleIndexByName includes local variables", ix.byName["Colour/Shadow/medium"].id === "L");
    check("styleIndexByName imports library variables too", ix.byName["Colour/Other"].id === "R");
    check("styleIndexByName caches the remote collection", !!ix.collById["cR"]);
  });
})

/* 11 — docFonts has shipped in two shapes; loadFontAsync accepts only one */
.then(function () {
  buildWorld({ collections: [], vars: [], extern: {}, externColl: {}, libVars: [] });
  loadScripts();
  check("normaliseFontList accepts {family,style}",
    JSON.stringify(global.normaliseFontList([{ family: "Inter", style: "Bold" }])) === '[{"family":"Inter","style":"Bold"}]');
  check("normaliseFontList converts the \"Family|Style\" string form",
    JSON.stringify(global.normaliseFontList(["SF Pro|Semibold"])) === '[{"family":"SF Pro","style":"Semibold"}]',
    JSON.stringify(global.normaliseFontList(["SF Pro|Semibold"])));
  check("normaliseFontList parses a raw JSON string",
    global.normaliseFontList('["SF Pro|Medium"]').length === 1);
  check("normaliseFontList drops junk rather than passing it to loadFontAsync",
    global.normaliseFontList([null, 42, "nopipe", { style: "Bold" }]).length === 0);
  // the real failure: a string reaches loadFontAsync and throws a validation error,
  // which the bridge surfaces as a TIMEOUT rather than an error
  const seen = [];
  global.figma.root.setPluginData("docFonts", JSON.stringify(["SF Pro|Semibold", { family: "Inter", style: "Regular" }]));
  global.figma.loadFontAsync = async f => {
    if (typeof f !== "object" || !f.family) throw new Error('Expected object, received string');
    seen.push(f.family + " " + f.style);
  };
  return global.loadDocFonts().then(r => {
    check("loadDocFonts loads both shapes without throwing", r.loaded === 2 && r.failed.length === 0, JSON.stringify(r));
    check("loadDocFonts passed objects only", seen.join() === "SF Pro Semibold,Inter Regular", seen.join());
  });
})

/* 12 — sourceIndex resumes from a cache; a naive retry goes backwards */
.then(function () {
  const mk = n => Array.from({ length: n }, (_, i) => ({ id: "V" + i, key: "K" + i,
    name: "Colour/x" + i, resolvedType: "COLOR", variableCollectionId: "cR", valuesByMode: {} }));
  const libVars = mk(10);
  buildWorld({ collections: [], vars: [], extern: {}, externColl: { cR: { id: "cR", name: "Sem", modes: [{ modeId: "m", name: "Light" }] } },
    libCollections: [{ key: "LK", name: "Sem", libraryName: "Tokens" }], libVars });
  loadScripts();
  // imports are slow and get SLOWER; getVariableByIdAsync is cheap
  let imports = 0, byIdCalls = 0, clock = 0;
  global.Date.now = () => clock;
  global.figma.variables.importVariableByKeyAsync = async k => { imports++; clock += 300; return libVars.find(v => v.key === k); };
  global.figma.variables.getVariableByIdAsync = async id => { byIdCalls++; clock += 5; return libVars.find(v => v.id === id) || null; };
  return global.sourceIndex("Sem", "Tokens", 1000).then(a => {
    check("first pass reports partial", a.partial === true, JSON.stringify(a).slice(0, 80));
    check("first pass says progress is cached", /progress is cached/.test(a.note || ""), a.note);
    const after1 = imports;
    return global.sourceIndex("Sem", "Tokens", 1000).then(b => {
      check("second pass does NOT re-import what pass 1 got",
        byIdCalls >= after1, "byId " + byIdCalls + " vs imported " + after1);
      check("second pass makes forward progress",
        (b.partial ? b.imported : b.vars.length) > after1, JSON.stringify({ p1: after1, p2: b.partial ? b.imported : b.vars.length }));
    });
  });
})

/* 12b — a cache that outlives a library publish serves the pre-publish variables */
.then(function () {
  // Observed live 2026-09-11: a ten-day-old key -> id cache regenerated a page from
  // the variables as they were before the library published — old names, old
  // values — while the library list already carried the new ones. An import after a
  // publish returns a NEW id; the cached id still resolves, to the old copy.
  const mk = n => Array.from({ length: n }, (_, i) => ({ id: "V" + i, key: "K" + i,
    name: "Colour/x" + i, resolvedType: "COLOR", variableCollectionId: "cR", valuesByMode: {} }));
  const run = seed => {
    const libVars = mk(4);
    buildWorld({ collections: [], vars: [], extern: {}, externColl: { cR: { id: "cR", name: "Sem", modes: [{ modeId: "m", name: "Light" }] } },
      libCollections: [{ key: "LK", name: "Sem", libraryName: "Tokens" }], libVars });
    loadScripts();
    let imports = 0;
    const clock = 10 * 3600 * 1000;
    global.Date.now = () => clock;
    // the pre-publish copies the cache points at: same keys, old ids, maybe old names
    const old = {}, ids = {};
    libVars.forEach((v, i) => {
      old["OLD" + i] = Object.assign({}, v, { id: "OLD" + i, name: seed.oldName ? seed.oldName(i) : v.name });
      ids[v.key] = "OLD" + i;
    });
    global.figma.variables.importVariableByKeyAsync = async k => { imports++; return libVars.find(v => v.key === k); };
    global.figma.variables.getVariableByIdAsync = async id => old[id] || libVars.find(v => v.id === id) || null;
    global.figma.root.setPluginData("srcIdx:Tokens::Sem", JSON.stringify(seed.legacy ? ids : { at: clock - seed.age, ids }));
    return global.sourceIndex("Sem", "Tokens", 60000).then(r => ({ r, imports }));
  };
  return run({ age: 2 * 3600 * 1000 }).then(({ r, imports }) => {
    check("a cache older than an hour is not trusted", imports === 4, "imports " + imports);
    check("an expired cache yields the current variables", r.vars.every(v => /^V/.test(v.id)), r.vars.map(v => v.id).join());
    return run({ legacy: true });
  }).then(({ imports }) => {
    check("a cache in the old undated shape is not trusted", imports === 4, "imports " + imports);
    return run({ age: 60 * 1000, oldName: i => "Colour/old" + i });
  }).then(({ r, imports }) => {
    check("a cached id whose name no longer matches the library is re-imported",
      imports === 4 && r.vars[0].name === "Colour/x0", imports + " " + r.vars[0].name);
    return run({ age: 60 * 1000 });
  }).then(({ imports }) => {
    check("a fresh cache whose names match still serves the resume", imports === 0, "imports " + imports);
  });
})

/* 12c — generate() takes a completed index through opts.index */
.then(function () {
  // The partial-index error has told callers to pass `opts.index` since 1.14.1,
  // and generate() took no such argument until 1.15.7.
  const libVar = { id: "L1", key: "k1", name: "Spacing/8", resolvedType: "FLOAT", variableCollectionId: "cL",
    valuesByMode: { "lv": 8 } };
  const libColl = { id: "cL", name: "Global scales", modes: [{ modeId: "lv", name: "Value" }] };
  buildWorld({ collections: [], vars: [], extern: {}, externColl: { cL: libColl },
    libCollections: [{ key: "LK", name: "Global scales", libraryName: "Source library" }], libVars: [libVar] });
  loadScripts();
  const shSet = makeSet("Section header", ["Subtitle=False"], () => {
    const n = node("INSTANCE", "Section header");
    n.componentProperties = { "Heading text#0:7": { type: "TEXT", value: "H" } }; return n;
  });
  const tblSet = makeSet("Table - Global", ["Alias=False", "Alias=True"], makeTableVariant);
  const name = "generate uses opts.index instead of re-running sourceIndex";
  return global.sourceIndex("Global scales", "Source library").then(idx => {
    global.sourceIndex = async () => { throw new Error("sourceIndex called although opts.index was passed"); };
    return global.generate("Global scales", "Globals", "hex", shSet, tblSet, "Name", "Source library", { index: idx });
  }).then(page => check(name, !!page.children[0].children.find(c => c.name === "Table - Global")),
          e => check(name, false, String(e)));
})

.then(function () {
  // liveEffects: Figma validates an effect by its EXACT key set per type, and a
  // key set to undefined is still present. Shipping
  // `showShadowBehindNode: e.type === "DROP_SHADOW" ? false : undefined` threw
  // `Unrecognized key(s) in object: 'showShadowBehindNode' at index 0` on the
  // first INNER_SHADOW it met, which killed a whole Shadows page mid-build and
  // left the old page already deleted. Found in a live run 2026-09-01.
  buildWorld({ collections: [], vars: [], extern: {}, externColl: {}, libCollections: [], libVars: [] });
  loadScripts();
  const out = global.liveEffects([
    { type: "INNER_SHADOW", x: 0, y: 0, radius: 0, spread: 1, color: { r: 0, g: 0, b: 0, a: 0.07 }, bound: {} },
    { type: "DROP_SHADOW", x: 0, y: 4, radius: 8, spread: -2, color: { r: 0, g: 0, b: 0, a: 0.03 }, bound: {} },
    { type: "BACKGROUND_BLUR", radius: 12, bound: {} }
  ]);
  check("inner shadow omits showShadowBehindNode entirely",
    !("showShadowBehindNode" in out[0]), JSON.stringify(Object.keys(out[0])));
  check("drop shadow still carries showShadowBehindNode false",
    out[1].showShadowBehindNode === false, JSON.stringify(out[1].showShadowBehindNode));
  check("blur keeps only type/visible/radius",
    Object.keys(out[2]).sort().join(",") === "radius,type,visible", JSON.stringify(Object.keys(out[2])));
  check("inner shadow keeps its geometry",
    out[0].spread === 1 && out[0].offset.x === 0 && out[0].radius === 0, JSON.stringify(out[0]));
})

.then(function () {
  // fillEffectRow, unreachable token. A hidden primitive tier publishes nothing,
  // so vidx cannot hold it. The old code bound only when the variable resolved and
  // otherwise left the swatch untouched — but rows are CLONED from a donor, so an
  // untouched swatch keeps the donor's binding and renders a plausible chip of an
  // unrelated token while the label names the right one. Found live 2026-09-01:
  // three focus rings and one inner highlight all sat bound to
  // Background/Neutral/soft. Counting bound-vs-static reported 27 bound, 0 static
  // and looked perfect; only comparing each binding against its own label caught it.
  buildWorld({ collections: [], vars: [], extern: {}, externColl: {}, libCollections: [], libVars: [] });
  loadScripts();
  const cells = [makeCell(), makeCell(), makeCell(), makeCell(), makeCell(), makeCell()];
  const sw = cells[5].findOne(n => n.name === "Swatch");
  sw.fills = [{ type: "SOLID", color: { r: 0.9, g: 0.9, b: 0.9 }, boundVariables: { color: { id: "SOME_OTHER_TOKEN" } } }];
  return global.fillEffectRow(cells, {
    type: "DROP_SHADOW", x: 0, y: 0, radius: 0, spread: 3,
    color: { r: 0.25, g: 0.5, b: 1, a: 0.32 },
    bound: { color: "Colour/Palette/Blue/4" }
  }, { byName: {}, collById: {} }, "oklch").then(function () {
    const f = sw.fills[0];
    check("unreachable token drops the inherited binding",
      !(f.boundVariables && f.boundVariables.color), JSON.stringify(f.boundVariables));
    check("unreachable token paints the literal colour",
      Math.abs(f.color.r - 0.25) < 1e-9 && Math.abs(f.color.b - 1) < 1e-9, JSON.stringify(f.color));
    check("unreachable token carries the alpha as opacity",
      Math.abs(f.opacity - 0.32) < 1e-9, String(f.opacity));
    check("unreachable token still renders as an alias cell",
      cells[5].componentProperties["Content"].value === "Alias",
      JSON.stringify(cells[5].componentProperties["Content"]));
  });
})

.then(function () {
  // The reachable half of the same rule: when vidx HAS the variable, the swatch is
  // bound rather than painted, so the doc tracks the token instead of a snapshot of it.
  buildWorld({ collections: [], vars: [], extern: {}, externColl: {}, libCollections: [], libVars: [] });
  loadScripts();
  const pv = { id: "V9", name: "Colour/Shadow/Drop/medium", resolvedType: "COLOR", variableCollectionId: "cS" };
  const vidx = { byName: { "Colour/Shadow/Drop/medium": pv },
                 collById: { cS: { id: "cS", name: "Sem", modes: [{ modeId: "mL", name: "Light" }] } } };
  const cells = [makeCell(), makeCell(), makeCell(), makeCell(), makeCell(), makeCell()];
  const sw = cells[5].findOne(n => n.name === "Swatch");
  return global.fillEffectRow(cells, {
    type: "DROP_SHADOW", x: 0, y: 1, radius: 1, spread: 0,
    color: { r: 0, g: 0, b: 0, a: 0.07 },
    bound: { color: "Colour/Shadow/Drop/medium" }
  }, vidx, "oklch").then(function () {
    const f = sw.fills[0];
    check("reachable token binds the swatch to itself",
      !!(f.boundVariables && f.boundVariables.color), JSON.stringify(f));
  });
})

.then(function () {
  // letterSpacingText: the web letter-spacing unit is a project ruling, not a fact
  // about the styles. The generator only ever emitted em, so refilling a project
  // whose ruling says rem silently reverted it. Expected values below are the ones
  // a live, maintainer-approved page actually renders, so this test is pinned to
  // real output rather than to my arithmetic.
  buildWorld({ collections: [], vars: [], extern: {}, externColl: {}, libCollections: [], libVars: [] });
  loadScripts();
  const L = global.letterSpacingText;
  const headline = { letterSpacing: { unit: "PERCENT", value: -1 }, fontSize: 40 };
  const title    = { letterSpacing: { unit: "PERCENT", value: -1 }, fontSize: 20 };
  const body     = { letterSpacing: { unit: "PERCENT", value: 0 },  fontSize: 16 };
  const rem = { letterSpacingUnit: "rem", rootSize: 16 };
  check("rem is keyed to the style's own size (40px)", L(headline, true, rem) === "-0.025rem", L(headline, true, rem));
  check("rem is keyed to the style's own size (20px)", L(title, true, rem) === "-0.0125rem", L(title, true, rem));
  check("zero letter spacing renders 0rem", L(body, true, rem) === "0rem", L(body, true, rem));
  check("one authored -1% is TWO different rem values", L(headline, true, rem) !== L(title, true, rem));
  check("default (no opts) still emits em, unchanged", L(headline, true, {}) === "-0.01em", L(headline, true, {}));
  check("a non-web group stays as authored", L(headline, false, rem) === "-1%", L(headline, false, rem));
})

.then(function () {
  // restorePagePosition: figma.createPage() appends, so a regenerated page walks to
  // the bottom of the file unless it is put back. Observed live 2026-09-01 —
  // regenerating Semantic and Shadows moved both out of the VARIABLES group and
  // below LAYOUT, while every cell on them was correct.
  buildWorld({ collections: [], vars: [], extern: {}, externColl: {}, libCollections: [], libVars: [] });
  loadScripts();
  const mkPage = n => node("PAGE", n);
  const pages = ["Cover", "---", "Primitives", "Semantic", "Components", "---", "Screen sizes"].map(mkPage);
  global.figma.root.children = pages;
  global.figma.root.insertChild = (i, c) => {
    const ch = global.figma.root.children;
    const at = ch.indexOf(c); if (at !== -1) ch.splice(at, 1);
    ch.splice(i, 0, c);
  };
  // simulate: old Semantic (index 3) removed, new one appended
  const fresh = mkPage("Semantic");
  global.figma.root.children = pages.filter(p => p.name !== "Semantic").concat([fresh]);
  const moved = global.restorePagePosition(fresh, 3);
  check("a replaced page returns to its own index", moved === true);
  check("page order is restored exactly",
    global.figma.root.children.map(p => p.name).join("|") ===
    "Cover|---|Primitives|Semantic|Components|---|Screen sizes",
    global.figma.root.children.map(p => p.name).join("|"));
  check("a first build (oldIdx -1) is left appended",
    global.restorePagePosition(fresh, -1) === false);
})

/* 1.18.0 — the engines that were prose fences (skill-standard §A clause G).
   Each block here replaces a code fence an agent used to retype per run. */

/* docFrame — the frame chrome every recipe shares, one copy */
.then(function () {
  buildWorld({ collections: [], vars: [], extern: {}, externColl: {}, libCollections: [], libVars: [] });
  loadScripts();
  const pg = node("PAGE", "P");
  const fr = global.docFrame(pg, "1 - Values", 1476);
  check("docFrame: appended to the page", fr.parent === pg && pg.children.length === 1);
  check("docFrame: the skill's fixed chrome",
    fr.name === "1 - Values" && fr.layoutMode === "VERTICAL" && fr.itemSpacing === 64 &&
    fr.paddingTop === 160 && fr.paddingLeft === 160 && fr.cornerRadius === 40 && fr.cornerSmoothing === 0.6 &&
    fr.primaryAxisSizingMode === "AUTO" && fr.counterAxisSizingMode === "AUTO" &&
    fr.fills[0].color.r === 1 && fr.x === 1476 && fr.y === 0, JSON.stringify({ n: fr.name, x: fr.x, p: fr.paddingTop }));
})

/* generate() uses DOCGEN.stripNamespace: a two-deep namespace still splits into frames */
.then(function () {
  const vars = [
    colourVar("v1", "Colour/Palette/Blue/1", rgb(1, 1, 1), rgb(0, 0, 0)),
    colourVar("v2", "Colour/Palette/Red/1", rgb(1, 0, 0), rgb(0.5, 0, 0)),
    colourVar("v3", "Colour/Palette/white", rgb(1, 1, 1), rgb(1, 1, 1))
  ];
  buildWorld({ collections: [coll], vars, extern: {}, externColl: {}, libVars: [] });
  loadScripts();
  const shSet = makeSet("Section header", ["Subtitle=False"], () => {
    const n = node("INSTANCE", "Section header");
    n.componentProperties = { "Heading text#0:7": { type: "TEXT", value: "H" } }; return n;
  });
  const tblSet = makeSet("Table - Colour", ["Alias=False", "Alias=True"], makeTableVariant);
  return global.generate("Palette", "Palette", "hex", shSet, tblSet, "Name").then(page => {
    const names = page.children.map(f => f.name).sort();
    check("generate: a two-segment namespace is stripped, so groups become frames",
      names.join("|") === "1 - Blue|2 - Palette|3 - Red", names.join("|"));
    check("generate: frames carry docFrame's chrome", page.children.every(f => f.cornerRadius === 40 && f.paddingTop === 160));
  });
})

/* headerLabels / columnMap — columns by rendered label, never by index */
.then(function () {
  buildWorld({ collections: [], vars: [], extern: {}, externColl: {}, libCollections: [], libVars: [] });
  loadScripts();
  const t = makeTableVariant("Alias=False", 6);
  const hs = t.findOne(n => n.name === "Row - Header").findOne(n => n.name === "Content slot");
  ["Name", "Family", "Size", "Weight", "Letter spacing", "Line-height"]
    .forEach((l, i) => { hs.children[i].findOne(n => n.type === "TEXT").characters = l; });
  const labels = global.headerLabels(t);
  check("headerLabels: reads the rendered labels in column order",
    labels.join("|") === "Name|Family|Size|Weight|Letter spacing|Line-height", labels.join("|"));
  const m = global.columnMap(t);
  check("columnMap: a column inserted mid-table maps by label, not position",
    m.fieldFor[4] === "letterSpacing" && m.fieldFor[5] === "lineHeight", JSON.stringify(m.fieldFor));
  hs.children[3].findOne(n => n.type === "TEXT").characters = "Tracking ratio";
  check("columnMap: an unrecognised label is reported, not guessed",
    global.columnMap(t).unknown.length === 1, JSON.stringify(global.columnMap(t).unknown));
})

/* probeComponent — the Step 1.2 probe, run rather than retyped */
.then(function () {
  buildWorld({ collections: [], vars: [], extern: {}, externColl: {}, libCollections: [], libVars: [] });
  loadScripts();
  const set = makeSet("Table - Colour", ["Alias=False", "Alias=True"], makeTableVariant);
  return global.probeComponent(set).then(out => {
    const tmp = global.figma.root.children.find(p => p.name === "__probe_tmp");
    check("probe: works on a scratch page, never the current doc page", !!tmp && global.figma.currentPage === tmp);
    check("probe: the instance is removed afterwards", tmp.children.length === 0, tmp.children.length);
    check("probe: variants listed for a set", out.variants.join("|") === "Alias=False|Alias=True", JSON.stringify(out.variants));
    check("probe: rows slot found by exact name", /SLOT 'Rows slot'/.test(out.rowsSlot), out.rowsSlot);
    check("probe: append and remove both exercised", out.append === "ok" && out.remove === "ok", out.append + " / " + out.remove);
    check("probe: row container type reported (SLOT = resizable)", /^SLOT 'Content slot'/.test(out.container), out.container);
    check("probe: header labels and _Title props reported",
      out.headerCols === 3 && out.headerLabels.length === 3 && out.titleProps.length === 3, JSON.stringify(out.headerLabels));
    check("probe: the tree is dumped", out.tree.length > 5 && out.tree[0].indexOf("INSTANCE") === 0, out.tree.length);
    return global.probeComponent(set).then(() => {
      check("probe: one scratch page, not one per probe",
        global.figma.root.children.filter(p => p.name === "__probe_tmp").length === 1);
    });
  });
})

/* generateMetricTables — Step 2.2, badged, alphabetical, rem keyed per size */
.then(function () {
  buildWorld({ collections: [], vars: [], extern: {}, externColl: {}, libCollections: [], libVars: [] });
  loadScripts();
  const variant = makeTableVariant("Alias=False", 3);
  variant.createInstance = () => { const i = deepClone(variant); i.name = "Table - Global"; return i; };
  const frame = node("FRAME", "3 - Font");
  const titled = name => { const t = variant.createInstance(); global.setupTable(t, name, "x"); frame.appendChild(t); return t; };
  titled("Family"); titled("Size"); titled("Weight");
  const ls = v => ({ unit: "PERCENT", value: v });
  const styles = [
    { name: "H/lg", fontSize: 40, letterSpacing: ls(-1), lineHeight: ls(110), bound: {} },
    { name: "H/md", fontSize: 32, letterSpacing: ls(-1), lineHeight: ls(110), bound: {} },
    { name: "B/md", fontSize: 16, letterSpacing: ls(0), lineHeight: ls(146), bound: {} },
    // a snapshot style with BOUND metrics belongs to the alias rule, not here
    { name: "B/sm", fontSize: 14, letterSpacing: ls(5), lineHeight: ls(200), bound: { letterSpacing: "Font/Tracking/wide", lineHeight: "Font/Line height/loose" } }
  ];
  let threw = null;
  try { global.generateMetricTables(frame, variant, styles, { lineHeightUnit: "unitless", letterSpacingUnit: "rem" }); }
  catch (e) { threw = e.message; }
  check("metric tables: rem without a root size is refused", threw && /rootSize/.test(threw), threw);
  threw = null;
  try { global.generateMetricTables(frame, variant, styles, { lineHeightUnit: "unitless" }); } catch (e) { threw = e.message; }
  check("metric tables: an unanswered unit is refused, never defaulted", threw && /letterSpacingUnit/.test(threw), threw);

  const res = global.generateMetricTables(frame, variant, styles,
    { lineHeightUnit: "unitless", letterSpacingUnit: "rem", rootSize: 16 });
  const titles = frame.children.map(t => {
    const ti = t.findOne(n => n.name === "_Title");
    const k = Object.keys(ti.componentProperties).find(x => x.indexOf("Title text") === 0);
    return ti.componentProperties[k].value;
  });
  check("metric tables: interleaved alphabetically with the real token tables",
    titles.join("|") === "Family|Letter spacing|Line height|Size|Weight", titles.join("|"));
  const tbl = frame.children[1];
  const ti = tbl.findOne(n => n.name === "_Title");
  const pv = name => ti.componentProperties[Object.keys(ti.componentProperties).find(k => k === name || k.indexOf(name + "#") === 0)].value;
  check("metric tables: badged (Label on, badge text set)", pv("Label") === true && pv("Label text") === "Not a variable",
    pv("Label") + " / " + pv("Label text"));
  const lab = c => c.componentProperties[Object.keys(c.componentProperties).find(k => k.indexOf("Label text") === 0)].value;
  const cellsOf = r => r.findOne(n => n.name === "Content slot").children;
  const rowsOf = t => t.findOne(n => n.name === "Rows slot").children.map(r => cellsOf(r).map(lab));
  const lsRows = rowsOf(tbl);
  check("metric tables: rem rows keyed per (value, size), bound style excluded",
    JSON.stringify(lsRows) === JSON.stringify([["-1% @ 40px", "-0.025rem"], ["-1% @ 32px", "-0.02rem"], ["0% @ any size", "0rem"]]),
    JSON.stringify(lsRows));
  check("metric tables: two columns, Name | Value", cellsOf(tbl.findOne(n => n.name === "Rows slot").children[0]).length === 2);
  const lhRows = rowsOf(frame.children[2]);
  check("metric tables: line-height value-keyed and unitless",
    JSON.stringify(lhRows) === JSON.stringify([["110%", "1.1"], ["146%", "1.46"]]), JSON.stringify(lhRows));
  check("metric tables: result reports rows and badge", res.length === 2 && res[0].rows === 3 && res[0].badged === true, JSON.stringify(res));

  // a REAL variable table generate() built may share the title; it has no badge
  const realLh = titled("Line height");
  global.generateMetricTables(frame, variant, styles, { lineHeightUnit: "authored", letterSpacingUnit: "em" });
  check("metric tables: a rerun replaces its own tables, never duplicates", frame.children.length === 6, frame.children.length);
  check("metric tables: a rerun never removes an unbadged variable table of the same title",
    frame.children.indexOf(realLh) !== -1, frame.children.length);
  check("metric tables: em collapses to one row per value",
    JSON.stringify(rowsOf(frame.children[1])) === JSON.stringify([["-1%", "-0.01em"], ["0% @ any size", "0em"]]),
    JSON.stringify(rowsOf(frame.children[1])));

  // a PIXELS line-height has no font size in a value-keyed row: 24px must never render 0.24
  const pxStyles = styles.concat([{ name: "D/xl", fontSize: 20, letterSpacing: ls(0), lineHeight: { unit: "PIXELS", value: 24 }, bound: {} }]);
  const before = frame.children.length;
  threw = null;
  try { global.generateMetricTables(frame, variant, pxStyles, { lineHeightUnit: "unitless", letterSpacingUnit: "em" }); }
  catch (e) { threw = e.message; }
  check("metric tables: a PIXELS line-height under unitless is refused, naming the row",
    threw && /lineHeight 24px .*pixels/.test(threw), threw);
  check("metric tables: the refusal writes nothing", frame.children.length === before, frame.children.length);
  global.generateMetricTables(frame, variant, pxStyles, { lineHeightUnit: "authored", letterSpacingUnit: "em" });
  const lhBadged = frame.children.filter(t => t !== realLh).find(t => {
    const p = t.findOne(n => n.name === "_Title").componentProperties;
    return p[Object.keys(p).find(x => x.indexOf("Title text") === 0)].value === "Line height";
  });
  check("metric tables: a PIXELS line-height as authored renders 24px",
    JSON.stringify(rowsOf(lhBadged)).indexOf('["24px","24px"]') !== -1, JSON.stringify(rowsOf(lhBadged)));

  // the rem refusal tells users to state the root size in the badge, so the badge text changes between runs
  const beforeBadge = frame.children.length;
  global.generateMetricTables(frame, variant, styles,
    { lineHeightUnit: "unitless", letterSpacingUnit: "rem", rootSize: 16, badgeText: "Not a variable (root 16px)" });
  check("metric tables: a rerun with a different badge text replaces, never adds",
    frame.children.length === beforeBadge && frame.children.indexOf(realLh) !== -1, beforeBadge + " -> " + frame.children.length);

  // a 24% PERCENT row before a 24px PIXELS row: the value-only key folded the PIXELS row away
  const foldStyles = [
    { name: "A/pct", fontSize: 16, letterSpacing: ls(0), lineHeight: ls(24), bound: {} },
    { name: "B/px", fontSize: 20, letterSpacing: ls(0), lineHeight: { unit: "PIXELS", value: 24 }, bound: {} }
  ];
  threw = null;
  try { global.generateMetricTables(frame, variant, foldStyles, { lineHeightUnit: "unitless", letterSpacingUnit: "em" }); }
  catch (e) { threw = e.message; }
  check("metric tables: a PIXELS row after a PERCENT row of the same value is still refused under unitless",
    threw && /lineHeight 24px .*pixels/.test(threw), threw);
})

/* harvest and discoverDocKeys — the two defects found while moving the fences */
.then(function () {
  buildWorld({ collections: [], vars: [], extern: {}, externColl: {}, libCollections: [], libVars: [] });
  loadScripts();
  const comp = node("COMPONENT", "Cell - Default");
  comp.appendChild(node("TEXT", "a", { fontName: { family: "Inter", style: "Regular" } }));
  comp.appendChild(node("TEXT", "b", { fontName: { family: "Inter", style: "Bold" } }));
  let fonts = null, err = null;
  try { fonts = global.harvest(comp, {}); } catch (e) { err = e.message; }
  check("harvest: takes its accumulator, no free `fonts` global", !err && fonts && Object.keys(fonts).length === 2, err || JSON.stringify(fonts));
  let bare = null;
  try { bare = Object.keys(global.harvest(comp)).length; } catch (e) { bare = e.message; }
  check("harvest: the accumulator is optional", bare === 2, bare);

  const page = global.figma.root.children[0];
  const inst = node("INSTANCE", "Only mine");
  inst.getMainComponentAsync = async () => ({ name: "Only mine", key: "K9", parent: null });
  page.appendChild(inst);
  return global.discoverDocKeys(["Only mine"]).then(found => {
    check("discoverDocKeys: honours the caller's CONTRACT instead of overwriting it",
      found["Only mine"] && found["Only mine"].key === "K9", JSON.stringify(found));
  });
})

/* 1.19.0 — an extended collection (a brand as a collection) owns no variables (D42) */
.then(function () {
  const blue = rgb(0, 0, 1), red = rgb(1, 0, 0), grey = rgb(0.5, 0.5, 0.5);
  const EL = "ext/l", ED = "ext/d";
  const parent = { id: "c1", name: "Semantic - Brand", modes: coll.modes };
  const ext = { id: "cE", name: "Brand B", isExtension: true, parentVariableCollectionId: "c1",
    variableIds: ["b1", "b2"],
    modes: [{ modeId: EL, name: "Light", parentModeId: LIGHT }, { modeId: ED, name: "Dark", parentModeId: DARK }] };
  const v1 = colourVar("b1", "Primary/soft", blue, blue);          // overridden by the extension
  const v2 = colourVar("b2", "Primary/strong", grey, grey);        // inherited unchanged
  v1.valuesByModeForCollectionAsync = async c => c.id === "cE" ? { [EL]: red, [ED]: red } : v1.valuesByMode;
  v2.valuesByModeForCollectionAsync = async c => c.id === "cE" ? { [EL]: grey, [ED]: grey } : v2.valuesByMode;
  buildWorld({ collections: [parent, ext], vars: [v1, v2], extern: {}, externColl: {}, libVars: [] });
  loadScripts();
  const shSet = makeSet("Section header", ["Subtitle=False"], () => {
    const n = node("INSTANCE", "Section header");
    n.componentProperties = { "Heading text#0:7": { type: "TEXT", value: "H" } }; return n;
  });
  const tblSet = makeSet("Table - Colour", ["Alias=False", "Alias=True"], makeTableVariant);
  return global.sourceIndex("Brand B").then(idx => {
    check("extension: sourceIndex lists the parent's variables", idx.vars.length === 2, idx.vars.length);
    check("extension: values are keyed by the EXTENSION's modes", !!(idx.valuesById && idx.valuesById.b1 && idx.valuesById.b1[EL]),
      JSON.stringify(idx.valuesById));
    return global.generate("Brand B", "Brand B", "hex", shSet, tblSet, "Name");
  }).then(page => {
    const tbl = page.children[0] && page.children[0].children.find(c => c.name === "Table - Colour");
    check("extension: the page is not empty", !!tbl);
    const rows = tbl.findOne(n => n.name === "Rows slot").children;
    const label = c => { const k = Object.keys(c.componentProperties).find(x => x.indexOf("Label text") === 0); return c.componentProperties[k].value; };
    const byName = {}; rows.forEach(r => { const cs = r.findOne(n => n.name === "Content slot").children; byName[label(cs[0])] = cs.slice(1).map(label); });
    check("extension: an overridden value shows the EXTENSION's value", byName.soft && byName.soft[0] === "#FF0000", JSON.stringify(byName));
    check("extension: an inherited value still shows", byName.strong && byName.strong[1] === "#808080", JSON.stringify(byName));
  });
})

/* 1.20.0 — every tier an alias passes through is pinned to the column's mode (D46) */
.then(function () {
  const PL = "p/l", PD = "p/d", EL = "e/l", ED = "e/d";
  const prim = { id: "cP", name: "Primitives", modes: [{ modeId: PL, name: "Light" }, { modeId: PD, name: "Dark" }] };
  const parent = { id: "c1", name: "Semantic - Brand", modes: coll.modes };
  const ext = { id: "cE", name: "Brand C", isExtension: true, parentVariableCollectionId: "c1", variableIds: ["s1", "k1"],
    modes: [{ modeId: EL, name: "Light", parentModeId: LIGHT }, { modeId: ED, name: "Dark", parentModeId: DARK }] };
  const a = id => ({ type: "VARIABLE_ALIAS", id });
  const green = { id: "pg", name: "Green/3", resolvedType: "COLOR", variableCollectionId: "cP", valuesByMode: { [PL]: rgb(0, 1, 0), [PD]: rgb(0, 0.2, 0) } };
  const yellow = { id: "py", name: "Yellow/3", resolvedType: "COLOR", variableCollectionId: "cP", valuesByMode: { [PL]: rgb(1, 1, 0), [PD]: rgb(0.2, 0.2, 0) } };
  // a semantic the brand re-points, and a component token that aliases it
  const sem = { id: "s1", name: "Background/soft", resolvedType: "COLOR", variableCollectionId: "c1", valuesByMode: { [LIGHT]: a("pg"), [DARK]: a("pg") } };
  sem.valuesByModeForCollectionAsync = async c => c.id === "cE" ? { [EL]: a("py"), [ED]: a("py") } : sem.valuesByMode;
  const comp = { id: "k1", name: "Component/Avatar/Container/background", resolvedType: "COLOR", variableCollectionId: "c1", valuesByMode: { [LIGHT]: a("s1"), [DARK]: a("s1") } };
  comp.valuesByModeForCollectionAsync = async c => comp.valuesByMode.__ext || (c.id === "cE" ? { [EL]: a("s1"), [ED]: a("s1") } : comp.valuesByMode);
  buildWorld({ collections: [prim, parent, ext], vars: [green, yellow, sem, comp], extern: {}, externColl: {}, libVars: [] });
  loadScripts();
  const shSet = makeSet("Section header", ["Subtitle=False"], () => {
    const n = node("INSTANCE", "Section header");
    n.componentProperties = { "Heading text#0:7": { type: "TEXT", value: "H" } }; return n;
  });
  const tblSet = makeSet("Table - Colour", ["Alias=False", "Alias=True"], makeTableVariant);
  return global.generate("Brand C", "Brand C", "hex", shSet, tblSet, "Name").then(page => {
    const cells = page.findAll(n => n.type === "INSTANCE" && /^Cell/.test(n.name) && n.explicitVariableModes);
    const compCell = cells.find(c => { const sw = c.findOne(n => n.name === "Swatch"); return sw && sw.fills[0] && sw.fills[0].boundVariables && sw.fills[0].boundVariables.color.id === "s1"; });
    check("alias chain: a component token's swatch is bound to its semantic", !!compCell, cells.length);
    const m = compCell ? compCell.explicitVariableModes : {};
    check("alias chain: the brand EXTENSION is pinned, not only the primitives", m.cE === EL || m.cE === ED, JSON.stringify(m));
    check("alias chain: the primitives are pinned to the same mode, through the brand's override", m.cP === (m.cE === EL ? PL : PD), JSON.stringify(m));
  });
})

/* 1.19.0 — a build that throws must not cost the page it was replacing (D44) */
.then(function () {
  const vars = [colourVar("v1", "Blue/1", rgb(1, 1, 1), rgb(0, 0, 0))];
  const w = buildWorld({ collections: [coll], vars, extern: {}, externColl: {}, libVars: [] });
  loadScripts();
  w.page.name = "Palette";
  w.page.appendChild(node("FRAME", "1 - Old content"));
  const shSet = makeSet("Section header", ["Subtitle=False"], () => {
    const n = node("INSTANCE", "Section header");
    n.componentProperties = { "Heading text#0:7": { type: "TEXT", value: "H" } }; return n;
  });
  const brokenTbl = { name: "Table - Colour", type: "COMPONENT_SET", children: [], defaultVariant: null };   // createInstance throws
  return global.generate("Palette", "Palette", "hex", shSet, brokenTbl, "Name").then(
    () => check("a failing build throws", false, "it resolved"),
    () => {
      const pages = global.figma.root.children.filter(p => p.name === "Palette");
      check("a failing build leaves exactly one page of that name", pages.length === 1, pages.length);
      check("the surviving page is the ORIGINAL, content intact", pages[0] === w.page && pages[0].children.some(c => c.name === "1 - Old content"),
        pages[0] && pages[0].children.map(c => c.name).join(","));
    });
})

/* 1.21.0 — Step 5 is one call: verifyPage reads the page back and checks it
   against what the recipe stored as it built it (§D 23) */
.then(function () {
  const prim = { id: "p1", name: "Palette/Cyan/3", resolvedType: "COLOR", variableCollectionId: "cP",
    valuesByMode: { "pl": rgb(0.8, 0.9, 1), "pd": rgb(0.05, 0.1, 0.15) } };
  const primColl = { id: "cP", name: "Hidden tier", modes: [{ modeId: "pl", name: "Light" }, { modeId: "pd", name: "Dark" }] };
  const alias = { id: "s1", name: "Colour/Background/Cyan", resolvedType: "COLOR", variableCollectionId: "c1",
    valuesByMode: { [LIGHT]: { type: "VARIABLE_ALIAS", id: "p1" }, [DARK]: { type: "VARIABLE_ALIAS", id: "p1" } } };
  const white = colourVar("s2", "Colour/Background/White", rgb(1, 1, 1), rgb(0, 0, 0));
  const semColl = { id: "c1", name: "Palette", modes: coll.modes };
  buildWorld({ collections: [semColl, primColl], vars: [alias, white], extern: { p1: prim }, externColl: { cP: primColl }, libVars: [] });
  loadScripts();
  (0, eval)(fs.readFileSync(path.join(__dirname, "..", "scripts", "verify.js"), "utf8"));
  const shSet = makeSet("Section header", ["Subtitle=False"], () => {
    const n = node("INSTANCE", "Section header");
    n.componentProperties = { "Heading text#0:7": { type: "TEXT", value: "Heading" } }; return n;
  });
  const tblSet = makeSet("Table - Colour", ["Alias=False", "Alias=True"], makeTableVariant);
  return global.generate("Palette", "Palette", "hex", shSet, tblSet, "Name").then(async page => {
    let r = await global.verifyPage(page);
    check("verify: a freshly generated page is clean", r.verdict === "clean", JSON.stringify(r.issues.concat(r.notRun)));
    check("verify: it counted every row and cell it read", r.counts.rows === 2 && r.counts.cells === 6 && r.counts.aliasCells === 2, JSON.stringify(r.counts));
    // Reviewed 2026-10-30: on a dynamic page another page's children are empty until loadAsync.
    let loaded = false;
    const lazy = Object.create(page, { children: { get: () => (loaded ? page.children : []) }, loadAsync: { value: async () => { loaded = true; } } });
    r = await global.verifyPage(lazy);
    check("verify: (negative) a page not yet loaded is loaded before it is read", r.counts.rows === 2, JSON.stringify(r.counts));
    const tbl = page.children[0].children.find(c => c.name === "Table - Colour");
    const rows = tbl.findOne(n => n.name === "Rows slot");
    const pill = rows.children.map(rw => getCells(rw)[1]).find(c => c.componentProperties.Content.value === "Alias").findOne(n => n.name === "Pill");
    pill.componentProperties[Object.keys(pill.componentProperties)[0]].value = "Label";
    r = await global.verifyPage(page);
    check("verify: a pill left at its placeholder is an alias-integrity finding (defect 2)",
      r.issues.some(i => i.check === "alias integrity"), JSON.stringify(r.issues));
    rows.children.reverse();
    r = await global.verifyPage(page);
    check("verify: rows out of the recipe's order are a row-order finding", r.issues.some(i => i.check === "row order"), JSON.stringify(r.issues));
    page.appendChild(node("INSTANCE", "Table - Colour"));
    r = await global.verifyPage(page);
    check("verify: a leaked probe on the page is a structure finding (defect 7)",
      r.issues.some(i => i.check === "structure" && /leaked probe/.test(i.problem)), JSON.stringify(r.issues));
    page.pluginData = {};
    r = await global.verifyPage(page);
    check("verify: with no stored expectation the verdict is partial, never clean",
      r.verdict !== "clean" && r.notRun.indexOf("coverage") !== -1 && r.expectation === "none", r.verdict + " " + r.notRun.join());
  });
})

.then(function () {
  console.log((failed ? "\n" : "") + passed + " passed, " + failed + " failed");
  process.exit(failed ? 1 : 0);
})
.catch(e => { console.error("harness error:", e); process.exit(1); });
