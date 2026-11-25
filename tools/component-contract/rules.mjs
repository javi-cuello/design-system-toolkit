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
import { splitTop, parseGradient, COLOUR, WEIGHTS, figmaWeight, weightName } from '../parity/values.mjs';
import { stopPositions } from '../parity/schema.mjs';

/* Cleared: an instance that clears its component's colour style, stroke, fill or shadow (fillStyle, border, background, shadow) says
   `none` (derive's cleared), as does a layer inside an opened instance that draws no fill where its component's layer
   has one; one row for every side. Figma: the instance's style detached, its strokes or fills none (to-figma). CSS: a
   colour style writes nothing (the contract's background says the colour); a fill cleared is `background: none`, a
   shadow cleared `box-shadow: none` (Figma: its effects emptied); a
   stroke cleared is the channel its component draws one in set back (to-code's override of the component's root:
   unset, or its shadow without the ring); both read back from a placed component drawing none where its component's
   root has one (from-code readCleared). */
export const CLEARED = 'none';

/* Unclipped: an instance, or a layer kept inside one, that does not clip where its component's root (or part) does says
   `overflow: visible` (derive's cleared; Figma's clipsContent overridden off). The contract says a clip as `hidden`
   and its absence as nothing, so only where a component's clip would otherwise reach it. Figma: clipsContent false
   (to-figma). CSS: `overflow: visible` over the component's `hidden` (css.mjs); read back from a placed component
   that computes `visible` where its component's root clips (from-code readCleared). */
export const UNCLIPPED = 'visible';

/* Unblended: an instance, or a layer kept inside one, that draws no blend mode where its component's root (or part)
   has one says `blend: normal` (derive's cleared; Figma's blendMode overridden back to pass-through or normal, which
   the walk records as nothing). The contract says a blend by its mode and its absence as nothing, so only where a
   component's blend would otherwise reach it. Figma: blendMode NORMAL (to-figma). CSS: `mix-blend-mode: normal` over
   the component's mode (css.mjs); read back from a placed component that computes `normal` where its component's root
   blends (from-code readCleared). */
export const UNBLENDED = 'normal';

/* A colour written as itself (no variable): css.mjs writes it so, and the editor's preview draws it so. */
export const rawColour = (f) => typeof f === 'string' && /^(#|rgba?\(|hsla?\()/.test(f);

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
/* How far a centred part's centre stands from its parent's in a design, from its two edges. Figma places it on a whole
   pixel, rounding up as to-figma does, so in an odd room the near edge is one more (a 24 box in 61: 19 and 18): that is
   the middle, not an offset of half a pixel. Any other difference is the design's; what code draws has no such grid. */
export const centreOffset = (near, far) => (Number.isInteger(near) && Number.isInteger(far) && near - far === 1 ? 0 : +((near - far) / 2).toFixed(2));
export const SIZE_ROWS = [['hug', 'HUG'], ['fill', 'FILL']];
export const sizeFromFigma = (v) => (SIZE_ROWS.find((r) => r[1] === v) || [])[0];
export const sizeToFigma = (w) => (SIZE_ROWS.find((r) => r[0] === w) || [])[1];

/* A glyph said as its instance (code colours the instance, an svg in currentColor): the instance's one graphic, coloured,
   saying nothing but where it is, its colour and its opacity, inside an instance with no colour of its own (`lone`: it
   is the instance's only layer). to-code writes such a glyph's colour and opacity on the instance; to-figma's comparison
   folds it there, with the colour style it is painted with (a Figma name for that colour, which code does not say). */
export const GLYPH_WORDS = new Set(['kind', 'parent', 'name', 'order', 'background', 'fillStyle', 'opacity']);
export const heldGlyph = (holder, glyph, lone) => !!lone && !!holder && !!glyph && glyph.kind === 'graphic' && glyph.background != null && holder.background == null && Object.keys(glyph).every((k) => GLYPH_WORDS.has(k));
/* Its opacity on the instance: one layer in a group shows at the group's opacity times its own, so the instance's times
   the glyph's, to the three places a reading keeps (from-code: 0.38 by 0.38 is 0.144); the glyph's own where the
   instance has none; undefined where the glyph has none. */
export const heldOpacity = (holder, glyph) => (typeof (glyph || {}).opacity !== 'number' ? undefined : typeof (holder || {}).opacity === 'number' ? +(holder.opacity * glyph.opacity).toFixed(3) : glyph.opacity);

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

/* Text that resizes: Figma's textAutoResize has no CSS property; it is the text's own sizes, said once. A text whose
   width hugs grows both ways (WIDTH_AND_HEIGHT), one whose height hugs wraps at its width (HEIGHT), one fixed both ways
   is NONE. Truncation is its own field (`truncate`, `maxLines`), as the snapshot keeps it. Held on every stored text
   (1,521 of 1,521, four projects, 2026-11-13). */
/* A text style from the declarations that say it: each of its fields as `fieldsOf(name)` writes them (to-code's
   tokenNames.textStyle), every one the element declares matching, so the style is named by what the code wrote, never
   by a measured size two styles share. Null where none matches (the caller falls back to the values). */
export function styleFromCss(own, styles, fieldsOf) {
  const said = ['font-family', 'font-weight', 'font-size', 'line-height', 'letter-spacing'].filter((p) => own[p] != null);
  if (!said.includes('font-size')) return null;
  // (as a built sheet may write it: no space after a comma)
  const same = (a, b) => word(a).replace(/\s*,\s*/g, ',') === word(b).replace(/\s*,\s*/g, ',');
  const hits = styles.filter((name) => { const f = Object.fromEntries(fieldsOf(name)); return said.every((p) => same(own[p], f[p])); });
  return hits.length === 1 ? hits[0] : null;
}

/* Truncation, as css.mjs writes it the other way: one line cut with an ellipsis (nowrap, overflow hidden,
   text-overflow ellipsis), or a clamp to N lines (-webkit-line-clamp, or line-clamp). Null where the text is not cut. */
export const LINES_CSS = ['white-space', 'text-overflow', 'overflow', '-webkit-line-clamp', 'line-clamp'];
export function linesFromCss(own, words = '') {
  const n = parseInt(word(own['-webkit-line-clamp'] ?? own['line-clamp']), 10);
  if (n > 0) return { maxLines: n, truncate: true };
  // (an ellipsis cuts only where the overflow is hidden; under pre only words of one line, as pre cuts each line and
  // shows them all: `words`, the text's)
  if (word(own['text-overflow']) === 'ellipsis' && (/nowrap/.test(word(own['white-space'])) || (/^pre$/.test(word(own['white-space'])) && !/\n/.test(typeof words === 'string' ? words : ''))) && /hidden|clip/.test(word(own.overflow))) return { maxLines: 1, truncate: true };
  return null;
}

/* A text no style names, said by its values in the one form both sides write and read: the snapshot's own word for
   one, `literal`, then `size/lineHeight weight`, in px, a line height of 0 the font's own (Figma's Auto, CSS's
   normal), the weight by its DTCG name (parity/values.mjs WEIGHTS), then ` italic` where it slants, then its family
   (`literal 14/20 semibold italic IBM Plex Sans`). The word leads because a style's name may be all the rest
   (`14/20 Regular`): without it that style was taken for values and lost its var(). From Figma, the
   snapshot's own fields (0.82.0 on: fontSize, fontFamily, fontStyle; lineHeight as `16`, `150%` or `auto`); null where
   it holds no size, face or line height, or a weight the table has no name for. A weight code computes that the table has no name
   for is said as its number, which no form parses: the text is then a value no writer can write, said unread. */
export const typeValue = (t) => `literal ${t.size}/${t.lineHeight} ${t.weight}${t.italic ? ' italic' : ''}${t.family ? ` ${t.family}` : ''}`;
export function typeOfValue(v) {
  const m = /^literal (\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?) ([a-z]+)( italic)?(?: (.+))?$/.exec(word(v));
  return m && Object.hasOwn(WEIGHTS, m[3]) ? { size: +m[1], lineHeight: +m[2], weight: m[3], cssWeight: WEIGHTS[m[3]], italic: !!m[4], family: m[5] } : null;
}
// (a value in the form's shape, parsed or not: never a style's name, so never written as one)
export const looksLikeValue = (v) => /^literal \d+(?:\.\d+)?\/\d/.test(word(v));
/* A face's weight by its name, as the contract says it (a face may join its words, BoldItalic or Bold_Italic; an italic
   alone, or Roman, is the regular weight's): never the font file's own weight class (Lucida Grande's Regular says 500). */
export function faceWeight(style) {
  const face = word(style).replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2'), slant = /\b(italic|oblique)\b/i.test(face);
  const rest = face.replace(/\b(italic|oblique)\b/gi, '').trim();
  return { weight: style ? figmaWeight(!rest || /^roman$/i.test(rest) ? 'Regular' : rest) : undefined, slant };
}
export function typeFromFigma(n) {
  const size = n.fontSize;
  const { weight: w, slant } = faceWeight(n.fontStyle);
  if (typeof size !== 'number' || w === undefined || !n.fontFamily) return null;
  const lh = word(n.lineHeight);
  // (none recorded is several in one text, which no value says: only a recorded auto is Auto)
  if (!lh) return null;
  const lineHeight = lh === 'auto' ? 0 : lh.endsWith('%') ? +((size * parseFloat(lh)) / 100).toFixed(2) : +lh;
  return Number.isFinite(lineHeight) ? typeValue({ size, lineHeight, weight: weightName(w), italic: slant, family: FAMILY_KEYWORD.test(n.fontFamily) ? JSON.stringify(n.fontFamily) : n.fontFamily }) : null;
}
/* A family as CSS writes it: a keyword bare (CSS Fonts 4 §2.1.2's generic families, and the two system names browsers
   take as keywords), as quoted it names a font of that name; any other quoted. Back, the first family a computed or
   written font-family names, unquoted and unescaped, whatever a quoted one holds. */
const FAMILY_KEYWORD = /^(serif|sans-serif|monospace|cursive|fantasy|math|system-ui|ui-serif|ui-sans-serif|ui-monospace|ui-rounded|-apple-system|blinkmacsystemfont)$/i;
// (a font called as a keyword keeps its quotes where the value read has them: Chrome quotes back only the seven serif,
// sans-serif, monospace, cursive, fantasy, math and system-ui, so a quoted "ui-rounded" or "-apple-system" reads bare
// and is written as that keyword; generic(…) is no keyword here, as Chrome refuses the declaration)
export const familyToCss = (f) => (FAMILY_KEYWORD.test(f) || (/^".*"$/.test(f) && FAMILY_KEYWORD.test(f.slice(1, -1))) ? f : JSON.stringify(f));
export function firstFamily(v) {
  const s = word(v), m = /^"((?:\\.|[^"\\])*)"|^'((?:\\.|[^'\\])*)'|^((?:\\.|[^,\\])*)/.exec(s);
  const f = (m[1] ?? m[2] ?? m[3].trim()).replace(/\\(?:([0-9a-f]{1,6}) ?|(.))/gi, (_, hex, ch) => (hex ? String.fromCodePoint(parseInt(hex, 16) || 0xfffd) : ch));
  // (Chrome computes BlinkMacSystemFont as a quoted "system-ui", which is that keyword all the same)
  return (m[1] ?? m[2]) !== undefined && FAMILY_KEYWORD.test(f) && !/^system-ui$/i.test(f) ? JSON.stringify(f) : f;
}

/* Letter spacing where no style gives it: px as a number, a share of the font size as `N%` (the snapshot's own), which
   CSS writes as em (CSS has no % for it in every browser). Read, it is the px computed, whatever unit wrote it: a
   text read always has a size, and a share of a known size is its px (spacingFromFigma). */
export const spacingToCss = (v) => (typeof v === 'string' && v.endsWith('%') ? `${+(parseFloat(v) / 100).toFixed(4)}em` : undefined);
export function spacingFromCss(computed) {
  const px = +(parseFloat(computed) || 0).toFixed(2);
  return px || undefined;
}
// (a share of a size the contract knows is that many px, as code computes it whatever unit wrote it; only where the
// size is unknown does the share stay one)
export const spacingFromFigma = (v, size) => (v == null || v === '' ? undefined : String(v).endsWith('%') ? (!parseFloat(v) ? undefined : typeof size === 'number' ? +((size * parseFloat(v)) / 100).toFixed(2) || undefined : String(v)) : +v || undefined);

/* Case and decoration where no style gives them, Figma's word (lower case, as the contract keeps it) to CSS's property
   and value and back. */
export const CASE_ROWS = [['upper', 'text-transform', 'uppercase'], ['lower', 'text-transform', 'lowercase'], ['title', 'text-transform', 'capitalize'], ['small_caps', 'font-variant-caps', 'small-caps'], ['small_caps_forced', 'font-variant-caps', 'all-small-caps']];
export const DECORATION_ROWS = [['underline', 'text-decoration-line', 'underline'], ['strikethrough', 'text-decoration-line', 'line-through']];
export const textToCss = (rows, w) => { const r = rows.find((x) => x[0] === w); return r ? [r[1], r[2]] : null; };
// `own`: the element's computed values, { property: value }; the first row whose property holds its value
export const textFromCss = (rows, own) => (rows.find((r) => word(own[r[1]]).split(/\s+/).includes(r[2])) || [])[0];

// (`nowrap`: the text is written never to wrap and is not cut, as css.mjs says a WIDTH_AND_HEIGHT text whose width
// the design states all the same)
// (written on the text's own element: a loose text, words its parent holds with no element of their own, reads its
// parent's declarations, and a parent's nowrap says nothing of how this text resizes)
// (`pre` is that too, as css.mjs writes it for a text whose white space is kept and which grows both ways, at a hugging
// width or a set one; at a filled width (`fills`) its width is the room's, not its words')
export const writtenNowrap = (authored, loose = false, fills = false) => !loose && (/^\s*nowrap\s*$/.test(authored || '') || (!fills && /^\s*pre\s*$/.test(authored || '')));
export function autoResizeOf(width, height, nowrap = false) {
  if (width === 'hug' || nowrap) return 'width_and_height';
  if (height === 'hug') return 'height';
  return 'none';
}

/* Placement out of the flow, from an element's authored declarations: Figma's absolute position and its constraints
   (min, max, center, stretch), as css.mjs writes them the other way: an edge's inset pins it there, both edges stretch it
   between them, an inset of 50% shifted back by half its own size centres it. The offsets are read as written (a
   token's var() kept); the point it sits at is the caller's, as Figma records x and y whatever pins it.
   Figma's scale constraint has no CSS constraint; its synonym is a share of the parent: the offset and the size each a
   percentage of the parent's size (css.mjs writes it so where the parent's size is a number), and a percentage offset
   beside a percentage size reads back as scale.
   Null where it is in the flow. */
/* Corner smoothing (Figma's 0–1, iOS-like at 0.6) as CSS corner-shape: superellipse(K), Chromium 139 on; a browser
   without it ignores the declaration and draws the circular corner the radius alone gives. Figma's smoothed corner is
   believed not to be a superellipse (figma-fact:smoothing-not-superellipse: an arc joined to its sides by Bézier
   curves, after figma.com/blog/desperately-seeking-squircles), so the look is an approximation; the value round-trips exactly. K by smooth-corners' mapping
   (lixiaolin94.github.io/smooth-corners-web), its radius compensation left out so the radius stays the design's:
   d = 1 − 1/√2, u = 1 − d/(1 + s), n = ln 2 / ln(1/u), K = log₂ n. */
const SMOOTH_D = 1 - 1 / Math.SQRT2;
export function smoothingToCss(s) {
  if (typeof s !== 'number' || !(s > 0) || s > 1) return null;
  const u = 1 - SMOOTH_D / (1 + s), n = Math.LN2 / Math.log(1 / u);
  return `superellipse(${+Math.log2(n).toFixed(4)})`;
}
export function smoothingFromCss(v) {
  // squircle is superellipse(2), CSS's own keyword for it
  const m = /^\s*squircle\s*$/.test(String(v || '')) ? [, '2'] : /superellipse\(\s*([\d.]+(?:e[-+]?\d+)?)\s*\)/i.exec(String(v || ''));
  if (!m) return null;
  const n = 2 ** +m[1], u = Math.exp(-Math.LN2 / n), s = SMOOTH_D / (1 - u) - 1;
  return s > 0.005 ? +s.toFixed(2) : null;
}

export const share = (part, whole) => `${+((100 * part) / whole).toFixed(4)}%`;
export function placeFromCss(own) {
  if (!/^(absolute|fixed)$/.test(word(own.position))) return null;
  const all = (word(own.inset).match(/(?:[^\s(]+|\([^)]*\))+/g) || []);
  const [t, r = t, b = t, l = r] = all;
  // (unset, initial and revert at the winning rule are an inset's initial value, auto: a variant's rule taking a pin away)
  const pick = (...ks) => { for (const k of ks) if (own[k] != null && !/^(auto|unset|initial|revert|revert-layer)$/.test(word(own[k]))) return word(own[k]); return null; };
  const sizes = [word(own['inline-size'] ?? own.width), word(own['block-size'] ?? own.height)];
  // the shift back: translate, or a transform's translate(), translate3d(), translateX() or translateY()
  const tf = word(own.transform), one = (f) => (tf.match(new RegExp(`${f}\\(([^)]*)\\)`)) || [])[1];
  const shift = word(own.translate) && word(own.translate) !== 'none' ? word(own.translate).split(/\s+/)
    : (one('translate') || one('translate3d') || '').split(/[\s,]+/).filter(Boolean).length ? (one('translate') || one('translate3d')).split(/[\s,]+/)
      : [one('translateX') || '', one('translateY') || ''];
  const axis = (near, far, i) => {
    const n = near ?? null, f = far ?? null;
    // (at the middle, or kept off it, calc(50% ± d): css.mjs's centre either way)
    if ((n === '50%' || /^calc\(\s*50%\s*[-+]\s*[^)]+\)$/.test(n || '')) && /^-50%$/.test(shift[i] || '')) return { to: 'center' };
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

/* A fill as CSS paints it. Figma lists a layer's paints bottom up; CSS's background layers go top first, and only the
   bottom one may be a bare colour, so a colour above another layer is a gradient of that colour alone (the synonym
   capabilities.json names fill-multiple). An image is the project's, set as --image on the component; the sheet holds its place and its fit.
   A linear gradient: Figma's colour at a point (u, v) of the layer's unit square is t = a·u + b·v + c, the first row
   of the paint's transform; on a w×h box that runs along (a/w, b/h), so CSS's angle is atan2(a/w, −b/h), and CSS
   stretches its line corner to corner, so a stop at t falls at (t − t₀)/(t₁ − t₀) of it (parity's schema.mjs
   `gradient`, which measures it the same way). An axis-aligned one is the same on every box; a diagonal needs the
   box's size, unless it runs corner to corner (a corner keyword, the same on every box); otherwise, on a box whose
   size is not a fixed number (its content's, its parent's, a token's), it is not said.
   `colour(name)` says a stop's colour. Returns { value, unread: [why] }. */
export function gradientCss(g, box, colour) {
  if (!g || g.type !== 'GRADIENT_LINEAR' || !Array.isArray(g.stops) || !g.stops.length) return { unread: ['background (a gradient other than linear)'] };
  const [a, b, c] = Array.isArray(g.transform) ? g.transform[0] : [null, null, null];
  let deg;
  if (a === null) { if (g.angle % 90 !== 0) return { unread: ['background (a diagonal gradient recorded without its transform)'] }; deg = g.angle; }
  // (the snapshot rounds a transform to six places, and a handle dragged by hand is near, not exact: within a thousandth)
  else if (Math.abs(a) < 1e-3 * Math.abs(b) || Math.abs(b) < 1e-3 * Math.abs(a)) deg = (Math.atan2(a, -b) * 180) / Math.PI;
  // isolines along a corner-to-corner diagonal on every box: CSS's corner keyword draws them so on any box (CSS
  // Images 3 §3.1.1: the line perpendicular to the diagonal through the other two corners)
  else if (Math.abs(Math.abs(a) - Math.abs(b)) < 1e-3 * Math.max(Math.abs(a), Math.abs(b))) deg = `to ${b < 0 ? 'top' : 'bottom'} ${a > 0 ? 'right' : 'left'}`;
  else if (box && typeof box.w === 'number' && typeof box.h === 'number' && box.w > 0 && box.h > 0) deg = (Math.atan2(a / box.w, -b / box.h) * 180) / Math.PI;
  else return { unread: ['background (a diagonal gradient on a box whose size is not a fixed number)'] };
  const corners = a === null ? [0, 1] : [c, a + c, b + c, a + b + c], t0 = Math.min(...corners), t1 = Math.max(...corners);
  const at = (p) => (a === null ? p : (p - t0) / (t1 - t0 || 1));
  const n = (x) => +x.toFixed(2);
  // a stop whose colour cannot be said leaves the gradient unsaid
  if (g.stops.some((st) => colour(st.color) == null)) return { unread: [] };
  return { value: `linear-gradient(${typeof deg === 'string' ? deg : `${n(((deg % 360) + 360) % 360)}deg`}, ${g.stops.map((st) => `${colour(st.color)} ${n(at(st.position) * 100)}%`).join(', ')})`, unread: [] };
}
// a clear one-pixel image: an image layer's place held until the project gives the image
export const CLEAR = 'url("data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEAAAAALAAAAAABAAEAAAIBAAA=")';
export function fillCss(fills, box, colour) {
  const layers = [], unread = [];
  const list = [].concat(fills ?? []);
  list.forEach((f, i) => {
    // an image fill: the image is the project's, set as --image on the component (an illustration's own asset); until it
    // is, a clear pixel holds its place. Sized as Figma fits it: FIT inside the box, FILL and CROP over it, TILE repeated
    if (typeof f === 'string' && f.startsWith('IMAGE')) {
      const how = f.split(':')[1] || 'FILL';
      layers.unshift(`var(--image, ${CLEAR}) ${how === 'TILE' ? 'repeat' : `center / ${how === 'FIT' ? 'contain' : 'cover'} no-repeat`}`);
      return;
    }
    // a paint the snapshot names by its type (a radial, angular or diamond gradient, a video, a pattern) or a variable
    // it could not resolve is no colour to say
    if (typeof f === 'string' && /^(GRADIENT_|VIDEO|PATTERN|EMOJI|VariableID:)/.test(f)) { unread.push(`background (${f.startsWith('VariableID:') ? 'a variable the snapshot could not name' : `a ${f.toLowerCase().replace(/_/g, ' ')} paint`})`); return; }
    if (typeof f === 'string') { const v = colour(f); if (v == null) return; layers.unshift(i === 0 ? v : `linear-gradient(${v}, ${v})`); return; }
    const g = gradientCss(f, box, colour);
    unread.push(...g.unread);
    if (g.value) layers.unshift(g.value);
  });
  // a bottom colour under an image stays a bare colour; one left above nothing is one too
  if (layers.length) { const last = layers[layers.length - 1], m = /^linear-gradient\((.+), \1\)$/.exec(last); if (m) layers[layers.length - 1] = m[1]; }
  return { value: layers.length ? layers.join(', ') : undefined, unread };
}

/* The way back: a box's painted background (its computed background-color and background-image) as Figma's fills,
   bottom up. A layer that is one colour throughout (linear-gradient(c, c)) is that colour; a linear gradient is a
   GRADIENT_LINEAR paint whose transform's first row runs t = a·u + b·v + c over the layer's unit square, the inverse
   of gradientCss: on a w×h box CSS's direction (sin θ, −cos θ) is (a/w, b/h), scaled so the corners span t 0 to 1, so a
   stop at p% is at p/100; a corner keyword runs corner to corner, |a| = |b|, on any box. The second row is the first
   turned a quarter, which Figma's colours never read, and the angle the snapshot keeps is the handles'. Stop colours stay as the browser gave them, for the caller to
   name. Null where a stop is no colour or not placed by one percentage (a hint, a turn, a length, calc()), a stop
   lies past the ends, or a diagonal needs a box it is not given: the caller says so. */
export function gradientFromCss(g, box) {
  // every stop a colour: a hint (red, 30%, blue), an angle in another unit or an interpolation clause read as a stop is
  // not one, and the layer is left unread rather than drawn wrong
  if (!g || g.stops.length < 2 || g.stops.some((st) => !st.colour)) return null;
  // a position in anything but one percentage (a length, calc(), a second position) is not placed on a guess
  if (g.stops.some((st) => !/^(-?[\d.]+%)?$/.test(st.raw.replace(COLOUR, '').trim()))) return null;
  let a, b;
  if (typeof g.angle === 'string') {
    const w = g.angle.replace(/^to\s+/, '').split(/\s+/);
    const H = w.includes('right') ? 1 : w.includes('left') ? -1 : 0, V = w.includes('bottom') ? 1 : w.includes('top') ? -1 : 0;
    [a, b] = [H, V];
  } else {
    const r = (g.angle * Math.PI) / 180, axis = Math.abs(Math.sin(r)) < 1e-9 || Math.abs(Math.cos(r)) < 1e-9;
    if (!axis && !(box && box.w > 0 && box.h > 0)) return null;
    [a, b] = axis ? [Math.sin(r), -Math.cos(r)] : [box.w * Math.sin(r), -box.h * Math.cos(r)];
  }
  const k = Math.abs(a) + Math.abs(b);
  if (!k) return null;
  const n = (x) => { const v = +x.toFixed(6); return Object.is(v, -0) ? 0 : v; };
  [a, b] = [a / k, b / k];
  const c = -Math.min(0, a) - Math.min(0, b), c2 = -Math.min(0, -b) - Math.min(0, a);
  // a stop with no position where CSS puts it (CSS Images 3 §3.4.3, parity's stopPositions); Figma's positions run 0 to 1
  const at = stopPositions(g.stops).map((st) => st.position);
  if (at.some((x) => x < 0 || x > 100)) return null;
  const colourOf = (raw) => (raw.match(COLOUR) || [raw])[0];
  // the handles' angle as the snapshot records it beside the transform (its `gradient`: start to end through the
  // inverse transform, clockwise from up, whole degrees); here the handles run along (a, b)
  const angle = Math.round((Math.atan2(b, a) * 180) / Math.PI + 90 + 360) % 360;
  return { type: 'GRADIENT_LINEAR', angle, transform: [[n(a), n(b), n(c)], [n(-b), n(a), n(c2)]], stops: g.stops.map((st, i) => ({ position: +(at[i] / 100).toFixed(4), color: colourOf(st.raw) })) };
}
export function fillsFromCss(color, image, box, clear = (c) => !c || /^(transparent|rgba\(0, 0, 0, 0\))$/.test(c), { size = '', repeat = '' } = {}) {
  const fills = [], unread = [];
  if (!clear(color)) fills.push(color);
  const layers = !image || image === 'none' ? [] : splitTop(image).map((x) => x.trim()).reverse();
  // each layer's size and repeat, bottom up as the layers are (CSS repeats a shorter list)
  const per = (v, i, n) => { const xs = v ? splitTop(v).map((x) => x.trim()) : []; return xs.length ? xs[(n - 1 - i) % xs.length] : ''; };
  for (const [i, l] of layers.entries()) {
    // an image: Figma's image fill, by how it is sized (fillCss writes it so)
    if (/^url\(/.test(l)) { const sz = per(size, i, layers.length), rp = per(repeat, i, layers.length); fills.push(/^repeat\b/.test(rp) && !/no-repeat/.test(rp) && !/contain|cover/.test(sz) ? 'IMAGE:TILE' : sz === 'contain' ? 'IMAGE:FIT' : 'IMAGE:FILL'); continue; }
    // (a repeating gradient is stripes, never one Figma gradient)
    const g = /^linear-gradient\(/.test(l) ? parseGradient(l) : null;
    const solid = g && g.stops.length === 2 && g.stops[0].raw === g.stops[1].raw && g.stops.every((st) => st.position == null && st.colour);
    if (solid) { fills.push((g.stops[0].raw.match(COLOUR) || [g.stops[0].raw])[0]); continue; }
    const p = g && gradientFromCss(g, box);
    if (p) fills.push(p); else unread.push(/^url\(/.test(l) ? 'background (an image: content, the template\'s)' : `background (${l.slice(0, 40)}…: a layer no Figma paint reads)`);
  }
  return { fills, unread };
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

/* A box's children in the order they paint, the contract's `order`: `xs` in markup order, each with its CSS order
   (`cssOrder`) and how it stacks (`stack`: from-code stackOf, { out, lifted, z }). The children in the flow keep the
   order the box lays them out in (CSS order, then markup: what their `order` says first is their place); a child out of
   the flow takes its place by paint alone, its CSS order moving nothing (CSS Flexbox 4.1): after the last child in the
   flow it paints over (CSS 2 Appendix E: by z-index; at one z-index, an unpositioned child in the flow under a positioned
   one; among positioned ones, markup order, which Chromium keeps for flex items too). Out-of-flow children in one place
   go in paint order. A child in the flow that paints out of its laid-out order (positioned before a static sibling)
   cannot say both: it says its layout. Runs in the page as well (from-code passes it as source); to-code draws by it. */
export function siblingOrder(xs) {
  const all = xs.map((e, i) => ({ e, i, s: e.stack || {} }));
  const flow = all.filter((x) => !x.s.out).sort((a, b) => (a.e.cssOrder || 0) - (b.e.cssOrder || 0) || a.i - b.i);
  flow.forEach((x, r) => { x.r = r; });
  const plain = (x) => x.s.z == null && !x.s.out && !x.s.lifted;
  const key = (x) => [x.s.z ?? 0, plain(x) ? 0 : 1, plain(x) ? x.r : x.i];
  const under = (a, b) => { const p = key(a), q = key(b); for (let k = 0; k < 3; k++) if (p[k] !== q[k]) return p[k] < q[k]; return false; };
  const outs = all.filter((x) => x.s.out).sort((a, b) => (under(a, b) ? -1 : under(b, a) ? 1 : 0));
  const slot = new Map(outs.map((o) => [o, flow.reduce((at, f, k) => (under(f, o) ? k : at), -1)]));
  const res = outs.filter((o) => slot.get(o) === -1);
  flow.forEach((f, k) => { res.push(f, ...outs.filter((o) => slot.get(o) === k)); });
  return res.map((x) => x.e);
}

/* Whether a box in the flow paints with the positioned ones (siblingOrder's `lifted`), in markup order, with no z-index of
   its own: positioned (relative, sticky), or a stacking context of its own (CSS 2 Appendix E; css-color 4 on opacity;
   css-transforms 1 and 2 on transform, translate, rotate, scale; filter-effects on filter and backdrop-filter;
   compositing on isolation and mix-blend-mode; css-will-change). `get` gives a property's value by its CSS name: a
   computed style's (from-code stackOf) or the declarations to-code writes (restacked), one rule for both. Runs in the
   page as well (passed as source). */
export function liftsAlone(get) {
  const v = (p) => String(get(p) ?? '').trim();
  const said = (p, none) => { const x = v(p); return x !== '' && !none.includes(x) && !/^(initial|unset|inherit|revert|revert-layer)$/.test(x); };
  const o = v('opacity');
  return /^(relative|sticky)$/.test(v('position')) || (said('opacity', []) && !(Number.isFinite(+o) && +o >= 1))
    || ['transform', 'translate', 'rotate', 'scale', 'filter', 'backdrop-filter'].some((p) => said(p, ['none'])) || said('isolation', ['auto']) || said('mix-blend-mode', ['normal'])
    || /\b(opacity|transform|translate|rotate|scale|filter|isolation|mix-blend-mode|position)\b/.test(v('will-change'));
}
