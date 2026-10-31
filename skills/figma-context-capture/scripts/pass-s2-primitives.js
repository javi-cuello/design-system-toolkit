// pass-s2-primitives.js - discovery pass S2 (references/discovery-passes.md): the
// internal grammar of a source file's primitive collections, counted. Read-only.
// Send this file's body as the code of one figma_execute call with an explicit
// fileKey, in the source file itself, after pass S1.
//
// For each collection read (CONFIG.collections by name; empty = every collection
// S1 would call hidden — on the collection or on every variable): its variables
// grouped by parent path (`Blue/1`..`Blue/12` is the ramp `Blue`), each ramp's
// steps in library order with their count, the steps that carry a marker
// (`8-anchor`, `7-source`), and the ramps that read as alpha (`Alphas/…`, `A0`).
// `stepCounts` says how many ramps have each length. What a marker means (a brand
// colour kept verbatim) and the grammar's name are the agent's reading.
var CONFIG = {
  collections: [],   // collection names; empty = the hidden ones
  ramps: 100         // ramps returned per collection; `truncated` says when it bit
};
var MARKER = /^(\d+)[-_ ]?([a-z]+)$/i;
var cols = await figma.variables.getLocalVariableCollectionsAsync();
var out = [];
for (var i = 0; i < cols.length; i++) {
  var c = cols[i], ids = c.variableIds || [], vars = [], hidden = 0;
  for (var j = 0; j < ids.length; j++) {
    var v = await figma.variables.getVariableByIdAsync(ids[j]);
    if (v) { vars.push(v); if (v.hiddenFromPublishing) hidden++; }
  }
  var wanted = CONFIG.collections.length ? CONFIG.collections.indexOf(c.name) > -1
    : c.hiddenFromPublishing || (vars.length > 0 && hidden === vars.length);
  if (!wanted) continue;
  var ramps = {}, order = [];
  for (var k = 0; k < vars.length; k++) {
    var parts = String(vars[k].name).split('/'), step = parts.pop(), path = parts.join('/');
    if (!ramps[path]) { ramps[path] = { ramp: path, steps: [], markers: [], alpha: false }; order.push(path); }
    var r = ramps[path];
    r.steps.push(step);
    var m = MARKER.exec(step);
    if (m) r.markers.push(step);
    if (/alpha/i.test(path) || /^A\d+$/.test(step)) r.alpha = true;
  }
  var stepCounts = {};
  for (var o = 0; o < order.length; o++) {
    var n = ramps[order[o]].steps.length;
    stepCounts[n] = (stepCounts[n] || 0) + 1;
  }
  out.push({ key: c.key, name: c.name, variables: vars.length, rampCount: order.length, stepCounts: stepCounts,
    truncated: order.length > CONFIG.ramps,
    ramps: order.slice(0, CONFIG.ramps).map(function (p) { var r = ramps[p]; r.count = r.steps.length; return r; }) });
}
return { fileKey: figma.fileKey, collections: out };
