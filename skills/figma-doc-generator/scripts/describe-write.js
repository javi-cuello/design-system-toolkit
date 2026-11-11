/* describe-write.js — *Variable descriptions* step 4, as one figma_execute call per collection.
 *
 * Send the whole file as the call's code with CONFIG filled: the collection's
 * name, the approved descriptions by variable name, and the names the person
 * said may be overwritten. It finds each variable by its name in that
 * collection, writes only an empty description (or one named in `overwrite`),
 * then reads every one back, so a write that did not land is named, not
 * assumed (skill-standard §A clause G).
 *
 * Returns { collection, written, kept, missing, mismatched }:
 *   written    — names whose description is now the approved text
 *   kept       — names with a description of their own, left alone (not in `overwrite`)
 *   missing    — names in `descriptions` the collection does not hold
 *   mismatched — names whose read-back differs from what was written
 * Throws when the collection is not in this file: the bridge is on the wrong one.
 */
const CONFIG = {
  collection: '', // e.g. "04. Semantic"
  descriptions: {}, // { "bg/surface/default": "The page's base surface. …" }
  overwrite: [], // names whose existing description the person said may be replaced
};

const cols = await figma.variables.getLocalVariableCollectionsAsync();
const col = cols.find((c) => c.name === CONFIG.collection);
if (!col) throw new Error(`no local collection "${CONFIG.collection}" in this file: pin the library that owns it (Step 0.1)`);
const vars = (await figma.variables.getLocalVariablesAsync()).filter((v) => v.variableCollectionId === col.id);
const byName = new Map(vars.map((v) => [v.name, v]));
const out = { collection: col.name, written: [], kept: [], missing: [], mismatched: [] };
const may = new Set(CONFIG.overwrite || []);
for (const [name, text] of Object.entries(CONFIG.descriptions || {})) {
  const v = byName.get(name);
  if (!v) { out.missing.push(name); continue; }
  if ((v.description || '').trim() && v.description !== text && !may.has(name)) { out.kept.push(name); continue; }
  v.description = text;
}
// read back from a fresh lookup, not the objects just written
for (const name of Object.keys(CONFIG.descriptions || {})) {
  const v0 = byName.get(name);
  if (!v0 || out.kept.includes(name)) continue;
  const v = await figma.variables.getVariableByIdAsync(v0.id);
  if (v && v.description === CONFIG.descriptions[name]) out.written.push(name);
  else out.mismatched.push(name);
}
return out;
