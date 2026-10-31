/*
 * Live reader for component-validator. Paste into figma_execute (or the
 * plugin console) in the library file; it returns the component trees the
 * validator reads, one `{ name, props, variants: [tree] }` per component set
 * (or plain component) on the current page, or, with `const SCOPE = [ids];`
 * prepended, for those node ids alone. (SCOPE was declared inside the walk,
 * so a prepended one was shadowed and the walk always took the whole page.)
 *
 * Small on purpose (~4 KB) so it is pasted per run rather than cached. Every
 * lookup is the async form, because a library file runs under
 * documentAccess: dynamic-page and the sync ones throw there.
 */
return (async () => {
// node ids to limit the walk, from a prepended `const SCOPE = [ids];`; absent or empty = every component on the page
const SCOPED = typeof SCOPE !== 'undefined' && Array.isArray(SCOPE) ? SCOPE : [];
const paintKinds = (ps) => (ps === figma.mixed || !ps) ? null : ps.filter((p) => p.visible !== false).map((p) => p.type === 'SOLID' ? (p.boundVariables && p.boundVariables.color ? 'VAR' : 'SOLID') : p.type === 'IMAGE' ? 'IMAGE:' + p.scaleMode : p.type);
const walk = async (n) => {
  const o = { name: n.name, type: n.type, w: Math.round(n.width), h: Math.round(n.height) };
  if ('x' in n) { o.x = Math.round(n.x); o.y = Math.round(n.y); }
  if ('layoutMode' in n && n.layoutMode !== 'NONE') {
    o.layout = n.layoutMode; o.wrap = n.layoutWrap === 'WRAP';
    o.pad = [n.paddingTop, n.paddingRight, n.paddingBottom, n.paddingLeft];
    o.gap = n.primaryAxisAlignItems === 'SPACE_BETWEEN' ? 'auto' : n.itemSpacing;
    o.align = [n.primaryAxisAlignItems, n.counterAxisAlignItems];
  }
  if ('layoutSizingHorizontal' in n) o.sizing = n.layoutSizingHorizontal + '/' + n.layoutSizingVertical;
  if ('minWidth' in n && (n.minWidth || n.maxWidth || n.minHeight || n.maxHeight)) o.minmax = [n.minWidth, n.maxWidth, n.minHeight, n.maxHeight];
  if ('layoutPositioning' in n && n.layoutPositioning === 'ABSOLUTE') o.absolute = true;
  if ('clipsContent' in n && n.clipsContent) o.clips = true;
  if ('fills' in n) { const f = paintKinds(n.fills); if (f && f.length) o.fills = f; }
  if ('strokes' in n && n.strokes.length) { o.strokes = paintKinds(n.strokes); o.strokeAlign = n.strokeAlign; o.strokeWeight = n.strokeWeight === figma.mixed ? 'mixed' : n.strokeWeight; if ('strokesIncludedInLayout' in n) o.strokesInLayout = n.strokesIncludedInLayout; }
  if ('cornerRadius' in n && n.cornerRadius) { o.radius = n.cornerRadius === figma.mixed ? 'mixed' : n.cornerRadius; if (n.cornerSmoothing) o.smoothing = n.cornerSmoothing; }
  if ('effects' in n && n.effects.length) { o.effect = n.effectStyleId ? 'style' : 'literal'; o.effects = n.effects.filter((e) => e.visible !== false).map((e) => e.type + (e.blurType === 'PROGRESSIVE' ? '_PROGRESSIVE' : '') + (e.type === 'INNER_SHADOW' || e.type === 'DROP_SHADOW' ? (e.spread ? ':spread' : '') : '')); }
  if ('blendMode' in n && n.blendMode !== 'PASS_THROUGH' && n.blendMode !== 'NORMAL') o.blendMode = n.blendMode;
  if ('opacity' in n && n.opacity < 1) o.opacity = n.opacity;
  if (n.isMask) o.mask = true;
  if (n.type === 'TEXT') {
    o.text = n.characters.slice(0, 60);
    o.textStyle = n.textStyleId && n.textStyleId !== figma.mixed ? ((await figma.getStyleByIdAsync(n.textStyleId)) || {}).name || 'style' : 'literal';
    const lh = n.lineHeight; o.lineHeight = lh === figma.mixed ? 'mixed' : lh.unit === 'AUTO' ? 'auto' : lh.unit;
    const ls = n.letterSpacing; o.letterSpacing = ls === figma.mixed ? 'mixed' : ls.unit; o.letterSpacingValue = ls === figma.mixed ? 'mixed' : ls.value;
    o.textAutoResize = n.textAutoResize; o.truncation = n.textTruncation; if (n.maxLines) o.maxLines = n.maxLines;
    o.fontSize = n.fontSize === figma.mixed ? 'mixed' : n.fontSize;
  }
  if (n.type === 'INSTANCE') { const m = await n.getMainComponentAsync(); if (m) o.instanceOf = (m.parent && m.parent.type === 'COMPONENT_SET' ? m.parent.name : m.name); }
  // on every layer: a hidden icon or label was walked as shown, and judged as if the build drew it
  if ('visible' in n && !n.visible) o.hidden = true;
  if (n.type === 'INSTANCE' || n.type === 'FRAME' || n.type === 'COMPONENT' || n.type === 'GROUP' || n.type === 'SECTION') {
    o.children = []; for (const k of n.children) o.children.push(await walk(k)); // instances keep their tree: a nested icon is still a child
  }
  return o;
};
const propsOf = (set) => {
  const d = set.componentPropertyDefinitions || {}, out = {};
  for (const [k, v] of Object.entries(d)) out[k.split('#')[0]] = v.type === 'VARIANT' ? v.variantOptions : v.type;
  return out;
};
const roots = SCOPED.length ? await Promise.all(SCOPED.map((id) => figma.getNodeByIdAsync(id))) : figma.currentPage.findAll((n) => (n.type === 'COMPONENT_SET') || (n.type === 'COMPONENT' && n.parent.type !== 'COMPONENT_SET'));
const out = [];
for (const set of roots.filter(Boolean)) {
  const variants = [];
  for (const v of set.type === 'COMPONENT_SET' ? set.children : [set]) variants.push(await walk(v));
  out.push({ name: set.name, props: propsOf(set), variants });
}
return out;
})();
