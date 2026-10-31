// pass-e-descriptions.js - discovery pass E (references/discovery-passes.md): the
// description dialect, counted. Read-only. Fill CONFIG (or leave ids empty to
// take the first described sets and components) and send this file's body as
// the code of one figma_execute call with an explicit fileKey.
//
// Per sampled component: its descriptionMarkdown's headings as written, bullet
// count and how many end in a full stop, and spelling pairs counted (colour /
// color and the like). Then, on the first sample's page, the instances outside
// any component whose name says header: candidates for the canvas documentation
// header, with their main component and text-layer names. Which dialect the
// counts make, whether a candidate is the header, and that it was read on one
// page only, are the agent's reading, never the script's.
var CONFIG = {
  ids: [],      // component or set ids to read; empty = the first CONFIG.sample described ones
  sample: 3
};
var PAIRS = [['colour', 'color'], ['behaviour', 'behavior'], ['centre', 'center'], ['grey', 'gray'], ['licence', 'license']];

function isVariant(n) { return n.type === 'COMPONENT' && n.parent && n.parent.type === 'COMPONENT_SET'; }
function insideComponent(n) {
  for (var p = n.parent; p; p = p.parent) if (p.type === 'COMPONENT' || p.type === 'COMPONENT_SET') return true;
  return false;
}
function pageOf(n) { for (var p = n; p; p = p.parent) if (p.type === 'PAGE') return p; return null; }

var picked = [];
if (CONFIG.ids.length) {
  for (var i = 0; i < CONFIG.ids.length; i++) {
    var n = await figma.getNodeByIdAsync(CONFIG.ids[i]);
    picked.push(n || { id: CONFIG.ids[i], missing: true });
  }
} else {
  await figma.loadAllPagesAsync();
  for (var pi = 0; pi < figma.root.children.length && picked.length < CONFIG.sample; pi++) {
    var nodes = figma.root.children[pi].findAllWithCriteria({ types: ['COMPONENT_SET', 'COMPONENT'] });
    for (var j = 0; j < nodes.length && picked.length < CONFIG.sample; j++)
      if (!isVariant(nodes[j]) && (nodes[j].descriptionMarkdown || nodes[j].description || '').length) picked.push(nodes[j]);
  }
}

var spelling = {};
for (var q = 0; q < PAIRS.length; q++) { spelling[PAIRS[q][0]] = 0; spelling[PAIRS[q][1]] = 0; }
var samples = [];
for (var k = 0; k < picked.length; k++) {
  var c = picked[k];
  if (c.missing) { samples.push({ id: c.id, error: 'not found' }); continue; }
  // descriptionMarkdown, never description: the plain one strips the markdown this pass reads
  var md = c.descriptionMarkdown || '';
  var lines = md.split('\n'), headings = [], bullets = 0, stops = 0;
  for (var l = 0; l < lines.length; l++) {
    var t = lines[l].trim();
    if (/^#{1,6}\s/.test(t)) headings.push(t);
    else if (/^([-*•]|\d+\.)\s/.test(t)) { bullets++; if (/\.$/.test(t)) stops++; }
  }
  var low = md.toLowerCase();
  for (var r = 0; r < PAIRS.length; r++)
    for (var s = 0; s < 2; s++) spelling[PAIRS[r][s]] += (low.match(new RegExp('\\b' + PAIRS[r][s] + '\\w*', 'g')) || []).length;
  samples.push({ id: c.id, name: c.name, length: md.length, headings: headings, bullets: bullets, bulletsWithStop: stops });
}

var headers = [];
var first = null;
for (var f = 0; f < picked.length && !first; f++) if (!picked[f].missing) first = pageOf(picked[f]);
if (first) {
  if (first.loadAsync) await first.loadAsync();   // ids mode loads no page, and dynamic-page throws on an unloaded one
  var inst = first.findAllWithCriteria({ types: ['INSTANCE'] });
  for (var h = 0; h < inst.length && headers.length < 5; h++) {
    if (!/header/i.test(inst[h].name) || insideComponent(inst[h])) continue;
    var main = await inst[h].getMainComponentAsync();
    var texts = inst[h].findAll(function (x) { return x.type === 'TEXT'; }).map(function (x) { return x.name; });
    headers.push({ id: inst[h].id, name: inst[h].name, component: main ? (main.parent && main.parent.type === 'COMPONENT_SET' ? main.parent.name : main.name) : null, textLayers: texts.slice(0, 10) });
  }
}
return { fileKey: figma.fileKey, samples: samples, spelling: spelling, headerPage: first ? first.name : null, headerCandidates: headers };
