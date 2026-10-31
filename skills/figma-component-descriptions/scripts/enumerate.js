// enumerate.js - SKILL.md steps 1, 2c and 2e: every published component in the
// file, which pages hold nothing but their components, and the virtual sets.
// Read-only. Fill CONFIG from the rulebook and send this file's body as the code
// of one figma_execute call; step 8 sends it again to diff against the targets.
const CONFIG = {
  internalPrefix: "_",   // from the rulebook; private components never form a virtual set
  separator: "/"         // virtual-set separator; null disables grouping
};

// Leaf content only, and only outside components (step 2e): a bare wrapper frame
// does not make a page documented, and nothing a component contains does either.
const CONTENT = ['TEXT','INSTANCE','VECTOR','RECTANGLE','ELLIPSE','LINE','POLYGON','STAR','BOOLEAN_OPERATION'];
// A broken layer throws "does not exist" on reads of its name or parent; it counts
// as inside a component, so it is never taken for loose page content.
const GONE = /does not exist/;
const safe = (fn, fallback) => { try { return fn(); } catch (e) { if (GONE.test(e && e.message)) return fallback; throw e; } };
const inComponent = (n) => safe(() => {
  let q = n.parent;
  while (q && q.type !== 'PAGE' && q.type !== 'DOCUMENT') {
    if (q.type === 'COMPONENT' || q.type === 'COMPONENT_SET') return true;
    q = q.parent;
  }
  return false;
}, true);

await figma.loadAllPagesAsync();
const pages = [];
const groups = new Map();
for (const page of figma.root.children) {
  if (!page.children.length) continue;
  // findAllWithCriteria descends the whole page: libraries wrap a page in one
  // outer frame, so page.children alone makes a documented file look empty.
  // A COMPONENT whose parent is a COMPONENT_SET is a variant, not a component.
  const items = page.findAllWithCriteria({ types: ['COMPONENT_SET', 'COMPONENT'] })
    .filter(n => !(n.type === 'COMPONENT' && n.parent && n.parent.type === 'COMPONENT_SET'))
    .map(n => ({ id: n.id, name: n.name, type: n.type, descLen: (n.description || '').length }));
  const alone = items.length > 0 &&
    page.findAll(n => safe(() => CONTENT.includes(n.type), false) && !inComponent(n)).length === 0;
  pages.push({ page: page.name, alone, items });
  if (!CONFIG.separator) continue;
  for (const it of items) {
    // An empty or null prefix means "no private components", not "every name is private".
    if (CONFIG.internalPrefix && it.name.startsWith(CONFIG.internalPrefix)) continue;
    const key = it.name.split(CONFIG.separator)[0].trim();
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push({ id: it.id, name: it.name, page: page.name });
  }
}
// Two or more siblings make a virtual set; a lone slashed name does not.
const virtualSets = [...groups].filter(([, m]) => m.length > 1).map(([stem, members]) => ({ stem, members }));
return { pages, virtualSets };
