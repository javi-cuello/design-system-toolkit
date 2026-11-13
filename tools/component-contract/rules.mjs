/*
 * The translation table between the contract and both sides, read in every direction (work in progress: phase 0
 * holds the sizing rows' reading of CSS; css.mjs still writes CSS, and is to read its rows from here).
 *
 * A row reads what CSS means, never what a render measured (CSSOM gives a width as used pixels, so hug and fill are
 * gone from a computed style): the authored declarations of the element and of its parent, as the cascade chose them.
 *
 *   sizeFromCss(axis, own, parent, at) → { value: 'hug' | 'fill' | <authored length> } | { lossy: <why> }
 *   axis    'width' | 'height'
 *   own     the element's declarations, { property: value } (inline-size or width, flex, align-self…)
 *   parent  its parent's, the same way ({} for the root)
 *   at      { root }: whether it is the component's outer box
 *
 * CSS's own rules, cited: a flex item grows along the main axis by flex-grow (css-flexbox-1 §7); across it, an item
 * whose cross size is auto is stretched where align-self (or the parent's align-items, through auto) is stretch or
 * normal (css-flexbox-1 §8.3); a block-level box's auto width fills its container, its auto height is its content's
 * (css2 §10.3.3, §10.6.3); an inline-level box (inline-flex) shrinks to fit.
 */

/* Alignment, one row per word: the contract's, Figma's (primaryAxisAlignItems, counterAxisAlignItems), CSS's
   (justify-content, align-items). Figma has no stretch alignment: the contract's stretch is drawn at MIN, said lossy.
   CSS's own words for the same thing (start, end, normal) read as the row they mean; `normal` is start along the
   main axis and stretch across it (css-align-3 §5.1, §6.1, for a flex container). */
export const ALIGN_ROWS = [
  ['start', 'MIN', 'flex-start', ['start', 'left']],
  ['center', 'CENTER', 'center', []],
  ['end', 'MAX', 'flex-end', ['end', 'right']],
  ['space-between', 'SPACE_BETWEEN', 'space-between', []],
  ['baseline', 'BASELINE', 'baseline', ['first baseline']],
  ['stretch', null, 'stretch', []],
];
export const ALIGN_LOSSY = { stretch: { toFigma: 'MIN', why: 'Figma has no stretch alignment; a child fills to stretch' } };
const byContract = Object.fromEntries(ALIGN_ROWS.map((r) => [r[0], r]));
const byFigma = Object.fromEntries(ALIGN_ROWS.filter((r) => r[1]).map((r) => [r[1], r[0]]));
const byCss = Object.fromEntries(ALIGN_ROWS.flatMap((r) => [[r[2], r[0]], ...r[3].map((w) => [w, r[0]])]));
// Figma's snapshot also says STRETCH where a layer stretched (an older reading): it reads as stretch
byFigma.STRETCH = 'stretch';

export const alignFromFigma = (v) => byFigma[v] || v;
export const alignToFigma = (w) => (byContract[w] && byContract[w][1]) || (ALIGN_LOSSY[w] && ALIGN_LOSSY[w].toFigma) || 'MIN';
export const alignToCss = (w) => (byContract[w] ? byContract[w][2] : undefined);
// across, normal and stretch stretch the children with no size of their own: that is each child's fill, read with the
// child (sizeFromCss), so the container's own word is Figma's, start
export const alignFromCss = (v, main) => { const s = String(v ?? '').trim(); if (!s || s === 'normal' || (!main && s === 'stretch')) return 'start'; return byCss[s] || s; };
// the same tables as plain data, for code that runs in the page or in Figma's plugin, where no import reaches
export const ALIGN_DATA = { toFigma: Object.fromEntries(ALIGN_ROWS.map((r) => [r[0], alignToFigma(r[0])])), fromCss: byCss };

/* Sizing words: the contract's hug and fill are Figma's HUG and FILL (layoutSizingHorizontal/Vertical); anything else
   is a fixed size, a number or a token. */
export const SIZE_ROWS = [['hug', 'HUG'], ['fill', 'FILL']];
export const sizeFromFigma = (v) => (SIZE_ROWS.find((r) => r[1] === v) || [])[0];
export const sizeToFigma = (w) => (SIZE_ROWS.find((r) => r[0] === w) || [])[1];

/* Auto layout from an element's authored declarations: flex is Figma's auto layout (figma-handoff), its direction,
   gap, padding, alignment and wrap read as they were written (a token's var() kept, for the caller to name).
   CSS has no gap below 0 (a negative gap is invalid, dropped): its synonym is a negative start margin on every child
   after the first (`pullProp`; to-code has every child say it on its own rule, 0 for the first in the flow and a placed part), which `next`, the second child's declarations, gives back as the gap.
   Null where the box does not lay out its children. */
export const negative = (g) => (typeof g === 'number' ? g < 0 : typeof g === 'string' && /\/-[\d.]/.test(g));
export const pullProp = (column) => (column ? 'margin-block-start' : 'margin-inline-start');
export function layoutFromCss(own, next = null) {
  if (!/flex/.test(word(own.display))) return null;
  const column = /column/.test(word(own['flex-direction']));
  const l = { direction: column ? 'column' : 'row' };
  const both = word(own.gap).match(/(?:[^\s(]+|\([^)]*\))+/g) || [];
  // gap is row-gap then column-gap: along a row the gap between children is the column gap
  const gap = own[column ? 'row-gap' : 'column-gap'] ?? (both.length ? both[column ? 0 : both.length - 1] : null);
  if (gap != null && word(gap) !== 'normal') l.gap = word(gap);
  const pull = next && word(next[pullProp(column)] ?? next[column ? 'margin-top' : 'margin-left']);
  // (a length below 0, or a token or calc(), whose sign is its value's: the caller, which can resolve it, confirms it)
  if (pull && (/^-/.test(pull) || /^(var|calc)\(/.test(pull)) && (l.gap == null || /^0(px|rem)?$/.test(l.gap))) { l.gap = pull; l.pulled = true; }
  const pad = sides(own);
  if (pad) l.padding = pad;
  l.align = alignFromCss(own['justify-content'], true);
  l.crossAlign = alignFromCss(own['align-items'], false);
  if (/^wrap/.test(word(own['flex-wrap']))) {
    l.wrap = true;
    const cross = own[column ? 'column-gap' : 'row-gap'] ?? (both.length ? both[column ? both.length - 1 : 0] : null);
    if (cross != null && word(cross) !== 'normal') l.crossGap = word(cross);
  }
  return l;
}

// the padding shorthand's one to four values, then its longhands over them, as top, end, bottom, start
function sides(own) {
  const out = {};
  const v = word(own.padding).match(/(?:[^\s(]+|\([^)]*\))+/g);
  if (v) { const [t, e = t, b = t, s = e] = v; Object.assign(out, { top: t, end: e, bottom: b, start: s }); }
  for (const [k, ps] of [['top', ['padding-top', 'padding-block-start']], ['end', ['padding-right', 'padding-inline-end']], ['bottom', ['padding-bottom', 'padding-block-end']], ['start', ['padding-left', 'padding-inline-start']]]) for (const p of ps) if (own[p] != null) out[k] = word(own[p]);
  return Object.keys(out).length ? out : null;
}

/* Placement out of the flow, from an element's authored declarations: Figma's absolute position and its constraints
   (min, max, center, stretch), as css.mjs writes them the other way: an edge's inset pins it there, both edges stretch it
   between them, an inset of 50% shifted back by half its own size centres it. The offsets are read as written (a
   token's var() kept); the point it sits at is the caller's, as Figma records x and y whatever pins it.
   Figma's scale constraint has no CSS constraint; its synonym is a share of the parent: the offset and the size each a
   percentage of the parent's size (css.mjs writes it so where the parent's size is a number), and a percentage offset
   beside a percentage size reads back as scale.
   Null where it is in the flow. */
export const share = (part, whole) => `${+((100 * part) / whole).toFixed(4)}%`;
export function placeFromCss(own) {
  if (!/^(absolute|fixed)$/.test(word(own.position))) return null;
  const all = (word(own.inset).match(/(?:[^\s(]+|\([^)]*\))+/g) || []);
  const [t, r = t, b = t, l = r] = all;
  const pick = (...ks) => { for (const k of ks) if (own[k] != null && word(own[k]) !== 'auto') return word(own[k]); return null; };
  const sizes = [word(own['inline-size'] ?? own.width), word(own['block-size'] ?? own.height)];
  // the shift back: translate, or a transform's translate(), translate3d(), translateX() or translateY()
  const tf = word(own.transform), one = (f) => (tf.match(new RegExp(`${f}\\(([^)]*)\\)`)) || [])[1];
  const shift = word(own.translate) && word(own.translate) !== 'none' ? word(own.translate).split(/\s+/)
    : (one('translate') || one('translate3d') || '').split(/[\s,]+/).filter(Boolean).length ? (one('translate') || one('translate3d')).split(/[\s,]+/)
      : [one('translateX') || '', one('translateY') || ''];
  const axis = (near, far, i) => {
    const n = near ?? null, f = far ?? null;
    if (n === '50%' && /^-50%$/.test(shift[i] || '')) return { to: 'center' };
    if (n != null && /%$/.test(n) && /%$/.test(sizes[i])) return { to: 'scale', near: n };
    // both edges and a size of its own is over-constrained: the far inset gives way (css2 §10.3.7, §10.6.4), unless
    // auto margins centre it, which the caller measures
    if (n != null && f != null && sizes[i] && !/^(auto|fit-content|max-content|min-content)$/.test(sizes[i])) return { to: 'min', near: n };
    if (n != null && f != null) return { to: 'stretch', near: n, far: f };
    if (f != null) return { to: 'max', far: f };
    return { to: 'min', ...(n != null && { near: n }) };
  };
  const h = axis(pick('inset-inline-start', 'left') ?? (l !== 'auto' ? l : null), pick('inset-inline-end', 'right') ?? (r !== 'auto' ? r : null), 0);
  const v = axis(pick('inset-block-start', 'top') ?? (t !== 'auto' ? t : null), pick('inset-block-end', 'bottom') ?? (b !== 'auto' ? b : null), 1);
  return { constraints: { horizontal: h.to, vertical: v.to }, offsets: { x: h.near, end: h.far, y: v.near, bottom: v.far } };
}

const LENGTH = /^(-?[\d.]+(px|rem|em)|0|var\(--[\w-]+\)|calc\(.+\))$/;
const word = (v) => (v == null ? '' : String(v).trim());
const grows = (flex, grow) => {
  const g = word(grow);
  if (g) return parseFloat(g) > 0;
  const f = word(flex);
  if (!f || f === 'none' || f === 'initial') return false;
  if (f === 'auto') return true;
  // a lone basis (flex: 0px) is 1 1 <basis> (css-flexbox-1 §7.1.1)
  if (/^-?[\d.]+[a-z%]+$/.test(f) && !/^-?[\d.]+$/.test(f)) return true;
  return parseFloat(f.split(/\s+/)[0]) > 0;
};

export function sizeFromCss(axis, own, parent, { root = false } = {}) {
  const inline = axis === 'width';
  const size = word(own[inline ? 'inline-size' : 'block-size'] ?? own[axis]);
  const flexParent = /flex/.test(word(parent.display));
  // along a flex parent's flow, growth and a basis come before the size (css-flexbox-1 §7.2.3, §9.2.3)
  const along = !root && flexParent && inline === !/column/.test(word(parent['flex-direction']));
  if (along) {
    if (grows(own.flex, own['flex-grow'])) return { value: 'fill' };
    // its values, a var() or calc() with spaces inside kept whole
    const parts = word(own.flex).match(/(?:[^\s(]+|\([^)]*\))+/g) || [];
    // a basis that is a length, not growing: flex: 0 0 24px, or flex: 0 24px
    const basis = word(own['flex-basis']) || (parts.length === 3 ? parts[2] : parts.length === 2 && LENGTH.test(parts[1]) && !/^-?[\d.]+$/.test(parts[1]) ? parts[1] : '');
    // (a zero basis is no size: the item is its content's)
    if (LENGTH.test(basis) && !/%/.test(basis) && !/^0(px|rem|em)?$/.test(basis)) return { value: basis };
  }
  if (LENGTH.test(size) && !/%/.test(size)) return { value: size };
  if (/^(fit-content|max-content|min-content)$/.test(size)) return { value: 'hug' };
  const upSize = word(parent[inline ? 'inline-size' : 'block-size'] ?? parent[axis]);
  // the outer box filling a frame that sets its size (a story's frame at 550 px) is that size: the frame stands where
  // Figma's component sets its own
  // (with no size of its own, only across: a block box's auto width fills, its auto height is its content's)
  if (root && LENGTH.test(upSize) && !/%/.test(upSize) && (size === '100%' || (!size && inline && !/^inline/.test(word(own.display))))) return { value: upSize };
  // a percentage height of a parent whose height is its content's is auto (css2 §10.5)
  // (a definite height comes from the parent's own length or a grid area; a flex row of auto height gives none, and a
  // percentage that resolves to auto stops the item stretching: css-flexbox-1 §9.8 makes only the stretched item's
  // own size definite, for its children)
  const percent = /%$/.test(size);
  const pct = percent && (inline || LENGTH.test(upSize) || /grid/.test(word(parent.display)));
  // a grid item with no size of its own is stretched in both axes where its self-alignment is normal or stretch
  // (css-align-3 §6.1, css-grid-1 §11.3)
  if (!root && /grid/.test(word(parent.display))) {
    const self = word(own[inline ? 'justify-self' : 'align-self']) || word(parent[inline ? 'justify-items' : 'align-items']);
    return { value: pct || !self || self === 'normal' || self === 'stretch' || self === 'auto' ? 'fill' : 'hug' };
  }
  if (root || !flexParent) {
    // the outer box, or a box in a flow that is not flex: inline-level hugs; block-level fills across, hugs down
    if (pct) return { value: 'fill' };
    if (/^inline/.test(word(own.display))) return { value: 'hug' };
    return { value: inline ? 'fill' : 'hug' };
  }
  if (along) return { value: pct ? 'fill' : 'hug' };
  // across: a percentage that resolves fills; one that does not is auto, and no longer stretches
  if (percent) return { value: pct ? 'fill' : 'hug' };
  const self = word(own['align-self']);
  const align = !self || self === 'auto' ? word(parent['align-items']) : self;
  return { value: !align || align === 'normal' || align === 'stretch' ? 'fill' : 'hug' };
}
