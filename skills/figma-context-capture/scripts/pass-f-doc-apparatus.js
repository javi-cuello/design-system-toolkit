// pass-f-doc-apparatus.js - discovery passes F and S4 (references/discovery-passes.md):
// the documentation furniture a file holds, counted. Read-only. Send this file's
// body, after `const TOKENS = …;`, as the code of one figma_execute call with an explicit fileKey.
//
// For each name of the doc-generator's contract (CONFIG.prefixes): how many local
// components carry it, how many instances use one, and of those how many come
// from a library (remote), with the library components' keys. Then the page
// names, and per page the `_Ratios grid` instances (the contrast matrix; 0 is
// "not built yet"). Whether the file is a doc library, a generation target or a
// refill, and which library the remote furniture names, are the agent's reading.
// The section header's and the contrast matrix's component names are the library's settings
// (`pageSectionComponent`, `ratiosGrid`), prepended by the session as `const TOKENS = …;` from
// `node tools/snapshot/projects.cjs settings <project>`; the house values stand where it has none.
if (typeof TOKENS === 'undefined' || !TOKENS || !TOKENS.ratiosGrid || !TOKENS.pageSectionComponent)
  throw new Error("prepend the library's settings, `const TOKENS = …;` with ratiosGrid and pageSectionComponent: node tools/snapshot/projects.cjs settings <project>");
var CONFIG = {
  prefixes: ['Table - ', TOKENS.pageSectionComponent, 'Row - ', 'Cell - ', 'Preview - '],
  ratios: TOKENS.ratiosGrid,
  keys: 10        // remote component keys kept per prefix
};
function prefixOf(name) {
  for (var i = 0; i < CONFIG.prefixes.length; i++) if (String(name).indexOf(CONFIG.prefixes[i]) === 0) return CONFIG.prefixes[i];
  return null;
}
function setName(c) { return c.parent && c.parent.type === 'COMPONENT_SET' ? c.parent.name : c.name; }

await figma.loadAllPagesAsync();
var furniture = {};
for (var p = 0; p < CONFIG.prefixes.length; p++) furniture[CONFIG.prefixes[p]] = { local: 0, instances: 0, remote: 0, keys: [] };
var pages = [], ratios = {};
for (var i = 0; i < figma.root.children.length; i++) {
  var page = figma.root.children[i];
  pages.push(page.name);
  var comps = page.findAllWithCriteria({ types: ['COMPONENT_SET', 'COMPONENT'] });
  for (var j = 0; j < comps.length; j++) {
    var c = comps[j];
    if (c.type === 'COMPONENT' && c.parent && c.parent.type === 'COMPONENT_SET') continue;   // a variant is its set's
    var pre = prefixOf(c.name);
    if (pre) furniture[pre].local++;
  }
  var inst = page.findAllWithCriteria({ types: ['INSTANCE'] }), grids = 0;
  for (var k = 0; k < inst.length; k++) {
    var main = await inst[k].getMainComponentAsync();
    if (!main) continue;
    var nm = setName(main);
    if (nm === CONFIG.ratios) { grids++; continue; }
    var pr = prefixOf(nm);
    if (!pr) continue;
    var e = furniture[pr];
    e.instances++;
    if (main.remote) {
      e.remote++;
      var key = main.parent && main.parent.type === 'COMPONENT_SET' ? main.parent.key : main.key;
      if (key && e.keys.indexOf(key) < 0 && e.keys.length < CONFIG.keys) e.keys.push(key);
    }
  }
  if (grids) ratios[page.name] = grids;
}
return { fileKey: figma.fileKey, pages: pages, furniture: furniture, ratiosGrid: ratios };
