// composition.js - SKILL.md step 3: what each subject contains, read across every
// variant, with the variants each part appears in. Read-only. Fill CONFIG.ids with
// the full-tier subjects' ids and send this file's body as one figma_execute call.
// A part in every variant is unconditional composition; one in a subset is
// revealed by an axis or boolean, and Composition must say so. It also returns
// the subject's `properties`, and on each part the booleans that show or hide
// it (`toggledBy`) and the swap props bound to it (`swappedBy`): the input
// scripts/sections.mjs turns into the Behaviour and Composition lists.
const CONFIG = {
  ids: []   // component or component-set ids from enumerate.js
};

// A property key carries Figma's `#<id>` suffix on every type but a variant axis.
const bare = (k) => String(k).replace(/#[^#]*$/, '');
// Figma refuses the definitions of a set it considers broken; that is reported, not fatal.
const defsOf = (n) => { try { return n.componentPropertyDefinitions || {}; } catch (e) { if (/existing errors|does not exist/.test(e && e.message)) return null; throw e; } };
// The references the SUBJECT's own properties make on the way from the variant
// down to an instance. A layer inside a nested instance refers to that
// instance's component, never to this one, so the walk stops reading below the
// first instance it meets.
const refsTo = (inst, variant) => {
  const path = [];
  for (let q = inst; q && q !== variant; q = q.parent) path.unshift(q);
  const visible = [], swap = [];
  for (const q of path) {
    const r = q.componentPropertyReferences || {};
    if (r.visible) visible.push(bare(r.visible));
    if (q === inst && r.mainComponent) swap.push(bare(r.mainComponent));
    if (q.type === 'INSTANCE') break;
  }
  return { visible, swap };
};

const out = [];
for (const id of CONFIG.ids) {
  const n = await figma.getNodeByIdAsync(id);
  if (!n) { out.push({ id, error: 'not found' }); continue; }
  const variants = n.type === 'COMPONENT_SET' ? n.children : [n];
  // Dedupe by variant AND instance name: by instance name alone the per-variant
  // counts are lost, and reading children[0] alone under-reports.
  const uniq = new Map();
  for (const v of variants) {
    for (const i of v.findAllWithCriteria({ types: ['INSTANCE'] })) {
      const key = v.name + '::' + i.name;
      if (!uniq.has(key)) uniq.set(key, { inst: i, variant: v.name, refs: refsTo(i, v) });
      else { // a second layer of that name: a toggle holds only if it holds on both
        const u = uniq.get(key), r = refsTo(i, v);
        u.refs = { visible: u.refs.visible.filter((b) => r.visible.includes(b)), swap: [...new Set([...u.refs.swap, ...r.swap])] };
      }
    }
  }
  const entries = [...uniq.values()];
  // A broken nested instance throws "does not exist"; it is reported, not fatal.
  // Anything else is a real failure and still rejects.
  const broken = [];
  const mains = await Promise.all(entries.map(e => e.inst.getMainComponentAsync().catch(err => {
    if (!/does not exist/.test(err && err.message)) throw err;
    broken.push({ variant: e.variant, instance: e.inst.name });
    return false;
  })));
  const nested = new Map();   // part name -> set of variants containing it
  const toggles = new Map();  // part name -> the booleans that toggle EVERY occurrence of it
  const swaps = new Map();    // part name -> the swap props bound to any occurrence
  mains.forEach((m, i) => {
    if (m === false) return;   // already listed by the catch
    // A main that resolves to null is as unreadable as one that throws: list it, never drop it.
    if (!m) { broken.push({ variant: entries[i].variant, instance: entries[i].inst.name, reason: 'main component did not resolve' }); return; }
    const name = (m.parent && m.parent.type === 'COMPONENT_SET') ? m.parent.name : m.name;
    if (!nested.has(name)) nested.set(name, new Set());
    nested.get(name).add(entries[i].variant);
    const r = entries[i].refs;
    toggles.set(name, toggles.has(name) ? toggles.get(name).filter((b) => r.visible.includes(b)) : r.visible);
    swaps.set(name, [...new Set([...(swaps.get(name) || []), ...r.swap])]);
  });
  const parts = [...nested].map(([name, vs]) => Object.assign(vs.size === variants.length
    ? { name, inEvery: true }
    : { name, inEvery: false, variants: [...vs] },
    toggles.get(name).length ? { toggledBy: toggles.get(name) } : {},
    swaps.get(name).length ? { swappedBy: swaps.get(name) } : {}));
  const defs = defsOf(n);
  const properties = defs && Object.entries(defs).map(([k, d]) => d.type === 'VARIANT'
    ? { name: k, type: d.type, options: d.variantOptions || [] }
    : { name: bare(k), type: d.type });
  out.push({ id, name: n.name, variantCount: variants.length, variantNames: variants.map((v) => v.name), parts, broken, properties });
}
return out;
