/*
 * tools/parity/pair.mjs — which rendered element each contract element lands
 * on, found by rule instead of written into the parity mappings by hand.
 *
 * Every element under the story's root is measured once (collect, run in the
 * page); each contract element is then paired with the rendered element that
 * shows the most of the values it defines itself: its fill, radius, border,
 * padding and gap if it is a box, its colour and type if it is text, its
 * colour if it is a graphic. Kinds must agree (text with an element that has
 * text of its own, a graphic with an svg). Several contract elements may land
 * on one rendered element: a design's nested frames are often one element in
 * code (Button's main container and its content are MUI's root). An element
 * that matches nothing it defines is left unpaired, never guessed.
 *
 *   fieldsFor(element) → the fields the element itself defines
 *   pairElements(anatomy, nodes, want, judge) → { [contract id]: { node, fields, score } }
 *   selectorFor(node, nodes) → a selector that finds that node alone
 *
 * Written 2026-10-06, measured against nine hand-made mappings (test-pair.mjs;
 * the code audit's --auto-pair). Its selectors are the component classes
 * such libraries write (Block-element, a framework's slot class), and its
 * "drawn twice" test reads the
 * framework's root class (its profile's `instance`). A library without such classes gets path selectors and no
 * drawn-twice placement: it still pairs, less readably.
 */

/* What a contract element itself defines, as the code audit's fields. */
export function fieldsFor(e, value = (v) => v) {
  if (!e) return [];
  if (e.kind === 'text') return ['color', 'typography'];
  // a graphic by its fill, or its stroke where it is a line (a divider)
  if (e.kind === 'graphic') return e.background ? ['color'] : e.border ? ['border'] : [];
  // an instance is its component's, but the values set on it here are this one's (a FAB's shadow, an item's radius)
  const f = [];
  if (e.background) f.push('background');
  if (e.radius != null) f.push('radius');
  if (e.border) f.push('border');
  const pad = e.layout && e.layout.padding;
  // a padding of nothing, whatever the library calls its zero, is no padding
  if (pad && Object.values(pad).some((v) => v != null && +value(v) !== 0)) f.push('padding');
  if (e.minWidth != null || e.minHeight != null) f.push('size');
  if (e.shadow) f.push('shadow');
  return f;
}

/* The best rendered element for each contract element. Deepest elements
   first, so a box is paired only with an element that holds what its
   children were paired with (a tab's label inside the same tab, never the
   next one). For each, the candidate of the right kind showing the most of
   the element's own values; text with literal words (Label, *) only where
   those are its words; ties to the most specific candidate. `want(id,
   fields)` gives the expected values as the audit's expected() does;
   `judge(want, got, under)` is the audit's own comparison.

   Values that differ are what the audit is for, so they cannot be all that
   finds an element: one that matches none of its values is placed by
   structure where that is unambiguous (`by: 'structure'`): a graphic on the
   one drawn shape left in its parent's element, a box on the outermost
   rounded or painted element holding its children's. Else it stays unpaired. */
/* A component's root class (audit-defaults frameworks `instance`, `{Name}`
   its name for the component; a governed repo's parity.instance, `{slug}`)
   as a pattern's source: the rest is literal, the name any name, captured. */
export function rootPattern(instance) {
  const lit = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const m = instance.match(/\{(Name|slug)\}/);
  if (!m) return `^${lit(instance)}$`;
  return `^${lit(instance.slice(0, m.index))}(${'[A-Za-z0-9-]+'})${lit(instance.slice(m.index + m[0].length))}$`;
}

export function pairElements(anatomy, nodes, want, judge, keyOf = (k, v) => v, { value = (v) => v, instance = null } = {}) {
  const fieldsOf = (e) => fieldsFor(e, value);
  const rootRe = instance ? new RegExp(rootPattern(instance)) : null;
  const out = {};
  const depth = (id) => id.split('/').length;
  const ids = Object.keys(anatomy).sort((a, b) => depth(b) - depth(a));
  const within = (n, anc) => n.index === anc.index || n.ancestors.includes(anc.index);
  const kids = (id) => Object.keys(out).filter((x) => x.startsWith(`${id}/`) && !x.includes('@')).map((x) => out[x].node);
  const parentPair = (id) => { for (let p = id.split('/').slice(0, -1); p.length; p.pop()) { const q = out[p.join('/')]; if (q) return q.node; } return null; };
  const literal = (e) => e.kind === 'text' && typeof e.content === 'string' && e.content && !/\{/.test(e.content) ? e.content.trim() : null;
  // a shape: an svg, or a box with no words of its own that paints (a switch's handle is a span)
  const shape = (n) => n.svg || (!n.text && !n.inSvg && n.m.paints && n.descendants <= 2);
  const fits = (e, n, id) => (e.kind === 'text' ? !!n.text : e.kind === 'graphic' ? (inInstance(id) ? n.svg : shape(n)) : !n.svg && !n.inSvg);
  const got = (e, n, k) => (e.kind === 'graphic' && k === 'color' && !n.svg ? n.m.background : n.m[k]);
  const same = (exp, g0, k, n) => {
    if (g0 === undefined) return false;
    // a measurement in the form the expected value is in (a shadow's css as its key)
    const g = keyOf(k, g0);
    // fully rounded is any radius at least half the box, however code writes it (999px, 50%, 9999px)
    if (k === 'radius' && typeof exp.want === 'number' && exp.want >= 999) return g >= Math.min(n.m.w, n.m.h) / 2;
    // a computed border is floored to whole pixels (1.5px reads 1px); for finding an element, that is a match
    if (k === 'border-width' && typeof exp.want === 'number' && typeof g === 'number' && Math.floor(exp.want) === g && g > 0) return true;
    const under = k === 'background' ? n.m.under : n.m.background && !/,\s*0\)$/.test(n.m.background) ? n.m.background : n.m.under;
    return judge(exp.want, g, under) !== 'differs';
  };
  // a box's paint (fill, radius, border) and its spacing (padding) are placed apart: in code they are often on
  // two elements (a switch's track paints, the element beside it holds the handle's inset), and where they
  // land on one element the two halves are joined again
  const jobs = [];
  for (const id of ids) {
    const all = fieldsOf(anatomy[id]);
    const paint = all.filter((f) => f !== 'padding' && f !== 'size'), space = all.filter((f) => f === 'padding' || f === 'size');
    if (anatomy[id].kind !== 'container' || !paint.length || !space.length) { if (all.length) jobs.push([id, id, all]); continue; }
    jobs.push([id, id, paint], [`${id}@space`, id, space]);
  }
  // icons land on the drawn icons in order, before any value is read: an icon has one value, its colour,
  // and an icon that differs (the thing to report) would otherwise land on a sibling that happens to
  // match (a chip's delete icon). Code may draw icons the design has not (a delete or close icon): with
  // at least as many svgs as the design's icons, the design's are the first ones, in document order
  const treeKey = (id) => id.split('/').map((_, i, a) => (anatomy[a.slice(0, i + 1).join('/')] || {}).order ?? 0);
  const before = (a, b) => { const x = treeKey(a), y = treeKey(b); for (let i = 0; i < Math.max(x.length, y.length); i++) if ((x[i] ?? -1) !== (y[i] ?? -1)) return (x[i] ?? -1) - (y[i] ?? -1); return 0; };
  // an icon: a graphic inside an instance (an icon container, an icon set's component); a shape drawn on
  // its own (a switch's handle, a dot) is code's to draw as a box, and is placed by its values
  const inInstance = (id) => id.split('/').slice(0, -1).some((_, i, a) => (anatomy[a.slice(0, i + 1).join('/')] || {}).kind === 'instance');
  // every icon keeps its place in the order, a coloured one or not (a dropdown's chevron has no colour of
  // its own, and left out, the error icon after it took its svg)
  const icons = Object.keys(anatomy).filter((id) => anatomy[id].kind === 'graphic' && inInstance(id)).sort(before);
  const svgs = nodes.filter((n) => n.svg);
  if (icons.length && svgs.length >= icons.length) icons.forEach((id, k) => {
    if (!fieldsOf(anatomy[id]).length) return;
    const exp = want(id, fieldsOf(anatomy[id]));
    const hit = Object.keys(exp).filter((f) => same(exp[f], svgs[k].m[f], f, svgs[k])).length;
    out[id] = { node: svgs[k], fields: fieldsOf(anatomy[id]), score: +(hit / Object.keys(exp).length).toFixed(2), by: 'position' };
  });
  for (const [key, id, fields] of jobs) {
    if (out[key] && out[key].by === 'position') continue;
    const e = anatomy[id];
    const exp = want(id, fields);
    const keys = Object.keys(exp);
    if (!keys.length) continue;
    const mine = kids(id);
    const scope = parentPair(id);
    let best = null;
    // ranked by the values shown, then by holding what its children landed on (a design's nesting is not
    // always code's: a switch's handle is the track's sibling), then by its own words where the design has
    // literal ones, then the most specific
    const rank = (n, score) => [score, mine.every((k) => within(k, n)) ? 1 : 0, literal(e) && n.text === literal(e) ? 1 : 0, -n.descendants];
    const better = (a, b) => { for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] > b[i]; return false; };
    for (const n of nodes) {
      if (!fits(e, n, id)) continue;
      const hit = keys.filter((k) => same(exp[k], got(e, n, k), k, n)).length;
      // a box must show something it spaces or paints besides "no fill", which every transparent element shows
      // fewer than half of its own values shown is likelier the wrong element than a difference
      if (hit * 2 < keys.length || (e.kind === 'container' && !n.m.paints && !keys.some((k) => k !== 'background' && same(exp[k], n.m[k], k, n)))) continue;
      const score = hit / keys.length, r = rank(n, score);
      if (!best || better(r, best.rank)) best = { node: n, score, rank: r };
    }
    // a shape code draws as a box is measured by its fill, as the audit reads a box
    const as = (n) => (e.kind === 'graphic' && !n.svg ? fields.map((f) => (f === 'color' ? 'background' : f)) : fields);
    if (best) { out[key] = { node: best.node, fields: as(best.node), score: +best.score.toFixed(2) }; continue; }
    if (key !== id) continue;
    // by structure, where only one element can be it
    const taken = new Set(Object.values(out).map((x) => x.node.index));
    if (e.kind === 'graphic') {
      const left = nodes.filter((n) => (inInstance(id) ? n.svg : shape(n)) && !taken.has(n.index) && (!scope || within(n, scope)) && !nodes.some((m) => m !== n && shape(m) && n.ancestors.includes(m.index)));
      if (left.length === 1) out[id] = { node: left[0], fields: as(left[0]), score: 0, by: 'structure' };
    } else if (e.kind === 'container') {
      const boxes = nodes.filter((n) => !n.svg && !n.inSvg && (n.m.paints || [].concat(n.m.radius).some((r) => r > 0)) && mine.every((k) => within(k, n)) && (!scope || within(n, scope)));
      const outer = boxes.filter((n) => !boxes.some((m) => m !== n && n.ancestors.includes(m.index)));
      // a story that draws one thing several times (two avatars side by side): the same element, so the first
      // (alike: one root class, the framework's for that component, whatever modifiers each carries; none known, none alike)
      const rootOf = (n) => rootRe && n.classes.find((c) => rootRe.test(c));
      const alike = outer.length > 1 && rootOf(outer[0]) && outer.every((n) => rootOf(n) === rootOf(outer[0]));
      if (outer.length === 1 || alike) out[id] = { node: outer[0], fields, score: 0, by: 'structure' };
    }
  }
  // an icon placed by order sits with its own group: where an element of its top-level group (an error
  // message's text) was paired by its values, the icon is the svg beside it, if one is there. A design
  // instance with no icon layer in its contract (a dropdown's chevron) holds no place in the order, and
  // without this the error icon after it took the chevron's svg
  for (const [id, x] of Object.entries(out)) {
    if (x.by !== 'position') continue;
    const group = id.split('/')[0];
    const near = Object.entries(out).filter(([k, y]) => k !== id && k.split('/')[0] === group && k.includes('/') && y.by !== 'position').map(([, y]) => y.node);
    for (const r of near) {
      // inside the text's own element first, then its parent's (which may hold the field's chevron too)
      const free = (n) => n.svg && !Object.values(out).some((y) => y !== x && y.node === n);
      const svg = nodes.find((n) => free(n) && n.ancestors.includes(r.index)) || nodes.find((n) => free(n) && r.ancestors[0] != null && n.ancestors[0] === r.ancestors[0]);
      if (svg && svg !== x.node) {
        const exp = want(id, fieldsOf(anatomy[id]));
        const hit = Object.keys(exp).filter((f) => same(exp[f], svg.m[f], f, svg)).length;
        out[id] = { ...x, node: svg, score: +(hit / Object.keys(exp).length).toFixed(2), by: 'position (beside its group)' };
        break;
      }
    }
  }
  // the two halves on one element are one entry again
  for (const k of Object.keys(out)) {
    if (!k.endsWith('@space')) continue;
    const id = k.slice(0, -6);
    if (out[id] && out[id].node.index === out[k].node.index) { out[id] = { ...out[id], fields: [...out[id].fields, ...out[k].fields] }; delete out[k]; }
  }
  return out;
}

/* A selector that finds this node alone under the story root: its library's
   own class names first (MuiChip-label, ArcButton-label), then the tag, then
   a path of > steps from the nearest ancestor that has one. */
export function selectorFor(n, nodes, root = '#storybook-root') {
  const unique = (sel) => nodes.filter((x) => x.matches.includes(sel)).length === 1;
  const own = n.classes.filter((c) => /^[A-Z][A-Za-z]+-[a-z][A-Za-z]*$/.test(c) && !/-(size|color|variant)[A-Z]|-(filled|outlined|standard|contained|text)$/.test(c));
  for (const c of own) if (unique(`.${c}`)) return `${root} .${c}`;
  for (let i = 0; i < own.length; i++) for (let j = i + 1; j < own.length; j++) if (unique(`.${own[i]}.${own[j]}`)) return `${root} .${own[i]}.${own[j]}`;
  // no class of its own: a child step from the nearest ancestor that has one
  return `${root} ${n.path}`;
}

/* In the page: every element under the root, measured as the audit measures
   one, with what pairElements() and selectorFor() need. Passed to cdp's call(). */
export function collect(rootSel) {
  const root = document.querySelector(rootSel);
  if (!root) return null;
  const px = (v) => +(+parseFloat(v)).toFixed(2);
  // from the page's body, the story's own parts and what it draws in a portal beside them (an open dialog),
  // never Storybook's own chrome
  // which child of the body an element is under: Storybook gives the body itself an sb- class, so it is the
  // body's children that say chrome (sb- wrappers, its docs, highlights, scripts) or story (its root, a portal)
  const top = (el) => { let x = el; while (x.parentElement && x.parentElement !== document.body) x = x.parentElement; return x; };
  const chrome = (el) => { if (el === document.body) return false; const t = top(el); if (t.id === 'storybook-root') return false; return /^(sb-|storybook-)/.test(t.id || '') || [...t.classList].some((c) => /^sb-/.test(c)) || /^(SCRIPT|STYLE|NOSCRIPT|svg)$/i.test(t.tagName); };
  // the body is where the page is, never a part of the component
  const all = [root, ...root.querySelectorAll('*')].filter((el) => el !== document.body && !chrome(el));
  const own = (el) => [...el.classList].filter((c) => /^[A-Z][A-Za-z]+-[a-z][A-Za-z]*$/.test(c));
  // a path from the nearest ancestor with a class of its own, in > and :nth-of-type steps
  const pathOf = (el) => {
    const steps = [];
    let x = el;
    while (x && x !== root) {
      const c = own(x).find((k) => document.querySelectorAll(`.${k}`).length === 1);
      if (c && x !== el) { steps.unshift(`.${c}`); break; }
      const same = [...x.parentElement.children].filter((s) => s.tagName === x.tagName);
      steps.unshift(same.length > 1 ? `${x.tagName.toLowerCase()}:nth-of-type(${same.indexOf(x) + 1})` : x.tagName.toLowerCase());
      x = x.parentElement;
    }
    return steps.join(' > ');
  };
  const out = [];
  const indexOf = new Map(all.map((el, i) => [el, i]));
  for (const el of all) {
    const s = getComputedStyle(el);
    if (s.display === 'none' || s.visibility === 'hidden') continue;
    const box = el.getBoundingClientRect();
    if (!box.width || !box.height) continue;
    const tag = el.tagName.toLowerCase();
    const inSvg = !!el.closest('svg') && tag !== 'svg';
    const text = [...el.childNodes].filter((x) => x.nodeType === 3 && x.textContent.trim()).map((x) => x.textContent.trim()).join(' ');
    let border = { 'border-width': 0, 'border-color': s.borderTopColor };
    // the side that draws it: all four for a box, one for a line (a divider's bottom border)
    const side = ['Top', 'Right', 'Bottom', 'Left'].find((x) => s[`border${x}Style`] !== 'none' && px(s[`border${x}Width`]) > 0);
    if (side) border = { 'border-width': px(s[`border${side}Width`]), 'border-color': s[`border${side}Color`] };
    else for (const part of String(s.boxShadow).split(/,(?![^(]*\))/)) {
      if (!/\binset\b/.test(part)) continue;
      const colour = (part.match(/(?:rgba?|oklab|color)\([^)]*\)|#[0-9a-f]{3,8}/i) || [''])[0];
      const len = part.replace(colour, '').match(/-?[\d.]+px/g) || [];
      if (len.length >= 4 && len.slice(0, 3).every((v) => parseFloat(v) === 0) && parseFloat(len[3]) > 0) { border = { 'border-width': px(len[3]), 'border-color': colour }; break; }
    }
    let a = el.parentElement, under = null;
    while (a && !under) { const bg = getComputedStyle(a).backgroundColor; if (!/rgba\(.*,\s*0\)$|transparent/.test(bg)) under = bg; a = a.parentElement; }
    let transparent = /rgba\(.*,\s*0\)$|transparent/.test(s.backgroundColor);
    // a shape CSS draws with a pseudo-element (a tooltip's arrow is its ::before): measured by that paint
    const before = getComputedStyle(el, '::before');
    const pseudoFill = transparent && before.content !== 'none' && !/rgba\(.*,\s*0\)$|transparent/.test(before.backgroundColor) ? before.backgroundColor : null;
    if (pseudoFill) transparent = false;
    const m = {
      background: pseudoFill || s.backgroundColor, color: s.color,
      // one radius where the four corners agree, else the four, clockwise from top left (as expected() gives them)
      radius: (() => { const c = ['TopLeft', 'TopRight', 'BottomRight', 'BottomLeft'].map((k) => px(s[`border${k}Radius`])); return c.every((x) => x === c[0]) ? c[0] : c; })(),
      'padding-top': px(s.paddingTop), 'padding-end': px(s.paddingRight), 'padding-bottom': px(s.paddingBottom), 'padding-start': px(s.paddingLeft),
      ...border,
      'font-size': px(s.fontSize), 'font-weight': +s.fontWeight, 'line-height': s.lineHeight === 'normal' ? 'normal' : px(s.lineHeight),
      'letter-spacing': s.letterSpacing === 'normal' ? 0 : px(s.letterSpacing), under,
      paints: !transparent || border['border-width'] > 0, w: px(box.width), h: px(box.height), shadow: String(s.boxShadow) === 'none' ? '' : s.boxShadow,
    };
    const ancestors = []; for (let x = el.parentElement; x && indexOf.has(x); x = x.parentElement) ancestors.push(indexOf.get(x));
    const classes = [...el.classList];
    out.push({ index: indexOf.get(el), ancestors, tag, classes, text, svg: tag === 'svg', inSvg, descendants: el.querySelectorAll('*').length, path: pathOf(el), m,
      // the selectors that match it, for uniqueness: each own class, and each pair of them
      matches: [...own(el).map((c) => `.${c}`), ...own(el).flatMap((c, i, xs) => xs.slice(i + 1).map((d) => `.${c}.${d}`))] });
  }
  return out;
}
