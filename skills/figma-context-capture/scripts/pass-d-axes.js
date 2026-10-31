// pass-d-axes.js - discovery pass D (references/discovery-passes.md): the axes of
// 3-5 sampled interactive component sets, in authored order, with how many
// variants each set has against the full grid. Read-only. Fill CONFIG.ids from
// pass A and send this file's body as the code of one figma_execute call.
var CONFIG = {
  ids: []   // component-set ids picked from pass A's setIds
};

var out = [];
for (var i = 0; i < CONFIG.ids.length; i++) {
  var s = await figma.getNodeByIdAsync(CONFIG.ids[i]);
  if (!s || s.type !== 'COMPONENT_SET') { out.push({ id: CONFIG.ids[i], error: s ? 'not a component set' : 'not found' }); continue; }
  var defs;
  try { defs = s.componentPropertyDefinitions; } catch (e) {
    // Figma refuses to read a set it considers broken; that is a finding, not a crash.
    if (!/existing errors/.test(e && e.message)) throw e;
    out.push({ id: CONFIG.ids[i], name: s.name, error: 'unreadable: ' + e.message }); continue;
  }
  var axes = [], grid = 1;
  for (var p in defs) {
    var options = defs[p].variantOptions || null;
    axes.push({ name: p.split('#')[0], type: defs[p].type, options: options });
    if (defs[p].type === 'VARIANT' && options) grid *= options.length;
  }
  // variantCount below fullGrid is a sparse set; whether that is a house stance is the agent's call.
  out.push({ name: s.name, axes: axes, variantCount: s.children.length, fullGrid: grid });
}
return out;
