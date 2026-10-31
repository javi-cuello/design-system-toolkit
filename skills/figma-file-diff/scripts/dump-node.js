// Drill-down — flat indented dump of one component's subtree, for diffing by eye
// once serialise.js has flagged which component differs.
//
// Set COMPONENT_NAME (and PARENT_NAME if the name isn't unique) before running.
// Run in BOTH files and compare the two `rows` arrays directly.

const COMPONENT_NAME = 'Row - Effects';
const PARENT_NAME = null; // e.g. '❖ Effects' to disambiguate
// Or the component's full path as serialise.js writes it, which report.mjs --next prints: a name may hold ' / '.
const COMPONENT_PATH = null;

// The full ancestor path, as serialise.js writes it, so report.mjs pairs the dump with its component.
function pathOf(n){ const p=[]; let c=n; while(c&&c.type!=='DOCUMENT'){ p.unshift(c.name); c=c.parent; } return p.join(' / '); }

await figma.loadAllPagesAsync();

let target = null;
const candidates = [];
for (const page of figma.root.children){
  for (const n of page.findAllWithCriteria({ types:['COMPONENT','COMPONENT_SET'] })){
    if (COMPONENT_PATH ? pathOf(n) !== COMPONENT_PATH : n.name !== COMPONENT_NAME) continue;
    if (PARENT_NAME && (!n.parent || n.parent.name !== PARENT_NAME)) continue;
    candidates.push(n);
  }
}
if (candidates.length === 0) return { file: figma.root.name, error: 'not found: ' + (COMPONENT_PATH || COMPONENT_NAME) };
if (candidates.length > 1) return {
  file: figma.root.name,
  error: 'ambiguous, set PARENT_NAME',
  found: candidates.map(c => (c.parent ? c.parent.name : '?') + ' / ' + c.name)
};
target = candidates[0];

const rows = [];
(function rec(n, d){
  rows.push({
    d: d,
    type: n.type,
    name: n.name,
    w: Math.round(n.width), h: Math.round(n.height),
    sh: n.layoutSizingHorizontal || '-', sv: n.layoutSizingVertical || '-',
    maxW: n.maxWidth === undefined ? 'n/a' : n.maxWidth,
    minW: n.minWidth === undefined ? 'n/a' : n.minWidth,
    maxH: n.maxHeight === undefined ? 'n/a' : n.maxHeight,
    minH: n.minHeight === undefined ? 'n/a' : n.minHeight,
    pad: n.layoutMode && n.layoutMode !== 'NONE'
      ? [n.paddingTop, n.paddingRight, n.paddingBottom, n.paddingLeft].join('/') : '-',
    gap: n.itemSpacing === undefined ? '-' : n.itemSpacing
  });
  if (n.children) n.children.forEach(c => rec(c, d + 1));
})(target, 0);

return { file: figma.root.name, path: pathOf(target), nodes: rows.length, rows };
