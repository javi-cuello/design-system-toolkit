/*
 * A contract part's fields as CSS declarations: the one translation from the
 * contract's words (layout, sizing, fills, strokes, type) to CSS, for every
 * reader that writes CSS from a contract: `to-code.mjs` writes a component's
 * stylesheet with it, its values named as the token build names them, and the
 * contract editor's preview draws its sketch with it, its values resolved.
 *
 *   declarations(e, at, names) → { decls: [[property, value, note?]], unread: [field] }
 *   e      a part's fields, as the contract's anatomy (or a variant layer's set) holds them
 *   at     { root, holds, row, anchors }: the outer box, a part that lays out children, whether the part's
 *          parent lays them out in a row (fill along it is flex, across it stretch), and whether a part inside
 *          it is placed out of the flow (it is then their containing block)
 *   names  how a value is said: { token(name) → css, textStyle(name) → [[property, value]], number?(n) → css }
 *          (a number not given is rem, or px where it must not scale); a token it cannot name is undefined, and a
 *          declaration with any part unnamed is not written
 *
 * The mapping is figma-handoff's (knowledge/code/figma-handoff.md, auto layout to flex and grid; strokes) and
 * code-standard's: a length in rem and a radius, stroke or shadow offset in px (code-standard rule 54), a stroke in the CSS
 * that takes the room Figma's takes (code-standard rule 63), a literal carrying its reason (code-standard rule 22). What the contract says
 * that CSS cannot (a corner's smoothing, an image fill) is returned in `unread`, never dropped quietly.
 */

const SIDES = ['top', 'end', 'bottom', 'start'];
import { alignToCss, centreOffset, share, negative, pullProp, fillCss, rawColour as raw, smoothingToCss, pathsToCss, pathsToMask, blendToCss, typeOfValue, familyToCss, looksLikeValue, spacingToCss, CASE_ROWS, DECORATION_ROWS, textToCss, CLEARED, UNCLIPPED } from './rules.mjs';
// what a part's markup says, not its styles: the template's, never a declaration
const STRUCTURE = new Set(['kind', 'parent', 'order', 'name', 'content', 'component', 'with', 'swappedBy', 'inner', 'text', 'autoResize', 'canvas', 'figma']);
const NOTE = 'no token in the design';
// a text's own values say why they are values and no more: a variable may be bound to one, which the snapshot does not record
const TEXT_NOTE = 'no text style in the design';
// what a text with no style says by leaving it out, each inherited in CSS, so written or it takes its host's
const UNSAID = [['font-style', 'normal'], ['letter-spacing', 'normal'], ['text-transform', 'none'], ['font-variant-caps', 'normal']];

const rem = (n) => `${+(n / 16).toFixed(4)}rem`;
/* Whether a part that scales with its parent can be written as a share of it: the parent's size on that axis, its own
   offset and its own size, each a number (the parent's above 0). Where not (a parent that hugs or fills, a part with no
   size or point of its own there), the sheet says it unread and declarations() returns the axis as unshared; what code
   draws there is code's (eval.mjs leftToCode, through to-code's unsharedAt). */
export const shareable = (whole, offset, own) => typeof whole === 'number' && whole > 0 && typeof offset === 'number' && typeof own === 'number';

export function declarations(e, { root = false, holds = false, row = true, wrap = false, anchors = false, box = null, pull = null, words = null } = {}, names) {
  // (unshared: the axes a scale constraint could not be written on, as a share of the parent: shareable)
  const decls = [], unread = [], unshared = [];
  const put = (prop, value, note) => { if (value !== undefined && value !== null && !/\bundefined\b/.test(String(value))) decls.push(note ? [prop, value, note] : [prop, value]); };
  // a value as a length: a token by its custom property, a number in rem (or px where it must not scale)
  const len = (v, px = false) => (typeof v === 'string' ? names.token(v) : typeof v === 'number' ? (v === 0 ? '0' : names.number ? names.number(v) : px ? `${+v.toFixed(4)}px` : rem(v)) : undefined);
  const literal = (v) => (typeof v === 'number' && v !== 0 ? NOTE : undefined);
  const done = new Set();
  const take = (k) => { done.add(k); return e[k]; };

  if (pull != null) put(pullProp(!row), len(pull), literal(pull));
  const l = take('layout');
  if (l && holds) {
    // an outer box that hugs sits in its line as a word does (figma-handoff: a hugging button is inline-flex)
    put('display', root && (e.width === undefined || e.width === 'hug') ? 'inline-flex' : 'flex');
    put('flex-direction', l.direction === 'column' ? 'column' : 'row');
    if (l.wrap) put('flex-wrap', 'wrap');
    // spaced between, Figma sets the gap aside (its auto spacing); CSS would add it to the space
    // a gap below 0 CSS cannot say: each child after the first pulls back by it (`pull`, rules.mjs)
    if (l.gap !== undefined && l.align !== 'space-between' && !negative(l.gap)) put('gap', len(l.gap), literal(l.gap));
    if (l.crossGap !== undefined) put(l.direction === 'column' ? 'column-gap' : 'row-gap', len(l.crossGap), literal(l.crossGap));
    const pad = l.padding || {};
    if (SIDES.some((s) => pad[s] !== undefined)) {
      const four = SIDES.map((s) => len(pad[s] ?? 0));
      put('padding', four[0] === four[2] && four[1] === four[3] ? (four[0] === four[1] ? four[0] : `${four[0]} ${four[1]}`) : four.join(' '), SIDES.some((s) => literal(pad[s])) ? NOTE : undefined);
    }
    if (alignToCss(l.align)) put('justify-content', alignToCss(l.align));
    if (alignToCss(l.crossAlign)) put('align-items', alignToCss(l.crossAlign));
    if (l.firstOnTop) unread.push('layout.firstOnTop');
  }
  // a root with no auto layout is a box all the same: a custom element is inline by default, 0 wide, so a part
  // centred at 50% of it lands at its start
  else if (root) put('display', e.width === undefined || e.width === 'hug' ? 'inline-block' : 'block');

  // fill, hug or a size: hug is the box's own, fill grows along the parent's flow or stretches across it
  for (const [k, prop, along] of [['width', 'inline-size', row], ['height', 'block-size', !row]]) {
    const v = take(k);
    // an outer box that hugs keeps its own width where a parent would stretch it
    if (v === 'hug' && root && k === 'width' && l && holds) put('inline-size', 'fit-content');
    // a placed component that hugs takes its own main's size, never one the main's sheet gives it to fill or fixes
    // (down as across: a list's item that hugs, its main 56 high at those props, is as high as what it holds)
    if (v === 'hug' && !root && e.kind === 'instance') { put(prop, 'fit-content'); if (along) put('flex', 'none'); }
    if (v === undefined || v === 'hug') continue;
    // filled across and capped (a dialog's panel to 556): stretched, the cap would pin it to the start, so it takes
    // the full size instead and sits where its parent aligns it, as Figma has it
    // (along, its share and no more: Figma's fill does not grow to what it holds, a state layer 40 tall holding 44, so
    // CSS's automatic minimum, min-width: auto (css-flexbox-1 §4.5), is set to 0, unless the part has a minimum of its own,
    // or its parent wraps: there the content size is where a line breaks, and at 0 no item would ever wrap)
    if (v === 'fill') { if (root) continue; if (along) { put('flex', '1 1 0'); if (!wrap && e[k === 'width' ? 'minWidth' : 'minHeight'] === undefined) put(`min-${prop}`, '0'); } else if (e[k === 'width' ? 'maxWidth' : 'maxHeight'] !== undefined) put(prop, '100%'); else { put('align-self', 'stretch'); if (e.kind === 'instance') put(prop, 'auto'); } continue; }
    put(prop, len(v), literal(v));
  }
  for (const [k, prop] of [['minWidth', 'min-inline-size'], ['minHeight', 'min-block-size'], ['maxWidth', 'max-inline-size'], ['maxHeight', 'max-block-size']]) {
    const v = take(k);
    if (v !== undefined) put(prop, len(v), literal(v));
  }

  // its fills, bottom up as Figma lists them, as CSS's background layers (rules.mjs fillCss): a colour with no variable
  // written as itself, said so; a name its token's
  const bg0 = take('background');
  // (a fill an instance clears, `none` (rules.mjs CLEARED): none drawn over its component's)
  if (bg0 === CLEARED) put('background', 'none');
  const bg = bg0 === CLEARED ? undefined : bg0;
  // (a colour style is Figma's name for the colour beside it, which background or color writes: nothing of its own)
  take('fillStyle');
  const fill = fillCss(bg, { w: e.width, h: e.height }, (f) => (raw(f) ? f : names.token(f)));
  put('background', fill.value, [].concat(bg ?? []).some((f) => raw(f) || (f && Array.isArray(f.stops) && f.stops.some((st) => raw(st.color)))) ? NOTE : undefined);
  unread.push(...fill.unread);
  const color = take('color');
  // (a colour with no variable written as itself, as a fill's is: never as a token of its name)
  if (typeof color === 'string') put('color', raw(color) ? color : names.token(color), raw(color) ? NOTE : undefined);

  const radius = take('radius');
  if (radius === 'mixed') unread.push('radius (mixed corners, unrecorded)');
  else if (Array.isArray(radius)) put('border-radius', radius.map((r) => len(r, true) ?? '0').join(' '), radius.some(literal) ? NOTE : undefined);
  else if (radius !== undefined) put('border-radius', len(radius, true), literal(radius));
  const shape = take('shape');
  if (shape === 'ellipse') put('border-radius', '50%');
  // an arc (part of an ellipse, a ring where it is hollow) as a mask: a conic sweep from Figma's start (0 at the x axis,
  // clockwise, as CSS's conic turns from the top, so 90 more) and, hollow, a radial cut at the inner ratio, intersected
  // (Figma's ArcData, developers.figma.com/docs/plugins/api/ArcData; read back by from-code)
  const arc = take('arc');
  if (arc) {
    const turn = (a) => +((((a % 360) + 360) % 360).toFixed(2));
    const sweep = turn(arc.end - arc.start) || 360, inner = +(100 * (arc.inner || 0)).toFixed(2);
    put('mask', [`conic-gradient(from ${turn(arc.start + 90)}deg, #000 ${sweep}deg, #0000 0)`, ...(inner > 0 ? [`radial-gradient(closest-side, #0000 ${inner}%, #000 ${inner}%)`] : [])].join(', '));
    if (inner > 0) put('mask-composite', 'intersect');
  }

  // a vector's own outline as a clip of its box (rules.mjs pathsToCss): its fill drawn in the shape Figma draws; an open
  // path, or several, no clip says (unread)
  // (a clip is in fixed pixels: only on a vector drawn at its own size on both axes, and with no stroke or shadow the clip
  // would cut; elsewhere its box stays and the paths are said unread)
  const paths = take('paths');
  if (paths !== undefined) {
    const sized = ['width', 'height'].every((k) => e[k] === undefined || typeof e[k] === 'number') && !['horizontal', 'vertical'].some((k) => /^(scale|stretch)$/.test((e.constraints || {})[k] || ''));
    const painted = (e.border && e.border !== CLEARED) || (e.shadow && e.shadow !== CLEARED);
    const clip = sized && !painted ? pathsToCss(paths) : null;
    // (what no one clip says, several paths, a rule of none or a vector that scales, a mask of them stretched over the
    // box says, at the vector's own size: rules.mjs pathsToMask; not beside an arc's mask)
    const mask = !clip && !painted && !arc ? pathsToMask(paths, e.width, e.height) : null;
    if (clip) put('clip-path', clip);
    else if (mask) { put('mask', `${mask} 0 0 / 100% 100% no-repeat`); }
    else unread.push(`paths (${painted ? 'a clip would cut its stroke or shadow' : 'an open path, or one in a box of no set size'})`);
  }

  // a stroke in the channel that takes the room Figma's takes (code-standard rule 63)
  // a stroke with no paint draws nothing, whatever its weight
  const b = take('border');
  const rings = [];
  if (b && b.color !== undefined) {
    // a side's width by its token, else the weight the stroke records for that side (derive's `sides` where the stroke
    // says no one width: a 3 on the bottom is 3, never the 1 an unstated width would be)
    const widths = Array.isArray(b.width) ? b.width : SIDES.map((s) => b.width ?? (b.sides && typeof b.sides[s] === 'number' ? b.sides[s] : 1));
    const on = SIDES.map((s, i) => (b.sides ? !!b.sides[s] : widths[i] !== 0) && widths[i] !== 0);
    const w = (i) => len(widths[i], true) ?? (b.sides && typeof b.sides[SIDES[i]] === 'number' ? len(b.sides[SIDES[i]], true) : undefined);
    const c = raw(b.color) ? b.color : names.token(b.color);
    const align = b.align || 'inside';
    // a dashed stroke all round, one width: an outline dashed, pulled in as far as the stroke's alignment puts it (an inset
    // shadow cannot dash); CSS sets no dash's length, so the pattern is the browser's (the user's ruling, 2026-11-17)
    const dash = !!b.dash && (!Array.isArray(b.dash) || b.dash.length > 0);
    // (a stroke that takes room in the layout is a border, which dashes as it is)
    const dashed = dash && !(align === 'inside' && b.inLayout) && on.every(Boolean) && widths.every((x) => x === widths[0]) && !(e.kind === 'graphic' && (e.width === 0 || e.height === 0));
    // a line (a layer no wide or no tall, a divider): its stroke is the one edge it draws, its leading one, as parity reads it
    const line = e.kind === 'graphic' && (e.width === 0 || e.height === 0);
    // (a line dashes that one edge: a border dashes as it is)
    if (dash && !dashed && !line && !(align === 'inside' && b.inLayout)) unread.push('border.dash (on some sides: CSS dashes a whole outline only)');
    if (dashed) { put('outline', `${w(0)} dashed ${c}`); put('outline-offset', align === 'inside' ? `calc(-1 * ${w(0)})` : align === 'center' ? `calc(${w(0)} / -2)` : '0'); }
    else if (line) put(e.width === 0 ? 'border-left' : 'border-top', `${w(on.findIndex(Boolean) < 0 ? 0 : on.findIndex(Boolean))} ${dash ? 'dashed' : 'solid'} ${c}`);
    else if (align === 'inside' && b.inLayout) {
      SIDES.forEach((s, i) => { if (on[i]) put(`border-${{ top: 'top', end: 'right', bottom: 'bottom', start: 'left' }[s]}`, `${w(i)} ${dash ? 'dashed' : 'solid'} ${c}`); });
    } else if (on.every(Boolean) && widths.every((x) => x === widths[0])) {
      // all round, one width: one ring, inward, outward or across the edge
      if (align === 'inside') rings.push(`inset 0 0 0 ${w(0)} ${c}`);
      // beside an effect style, an outside ring is one of box-shadow's layers, first, as parity reads it
      else if (align === 'outside' && typeof e.shadow === 'string' && e.shadow !== 'literal') rings.push(`0 0 0 ${w(0)} ${c}`);
      else { put('outline', `${w(0)} solid ${c}`); put('outline-offset', align === 'center' ? `calc(${w(0)} / -2)` : '0'); }
    } else {
      // some sides: one offset shadow per side, inset for an inside stroke, outside the box otherwise
      // an inset shadow shifted toward the box's middle draws that edge inside it; an outer one, shifted out, outside
      const inset = align === 'inside';
      const neg = (v) => (/^[\d.]/.test(v) ? `-${v}` : `calc(-1 * ${v})`);
      const IN = { top: (v) => `0 ${v}`, end: (v) => `${neg(v)} 0`, bottom: (v) => `0 ${neg(v)}`, start: (v) => `${v} 0` };
      const OUT = { top: (v) => `0 ${neg(v)}`, end: (v) => `${v} 0`, bottom: (v) => `0 ${v}`, start: (v) => `${neg(v)} 0` };
      SIDES.forEach((s, i) => { if (on[i]) rings.push(`${inset ? 'inset ' : ''}${(inset ? IN : OUT)[s](w(i))} 0 0 ${c}`); });
      if (align === 'center') unread.push('border (a centre stroke on some sides only, which no CSS property draws)');
    }
  }
  const shadow = take('shadow');
  // (a shadow an instance clears, `none` (rules.mjs CLEARED): none drawn, unless a ring is)
  if (shadow === CLEARED && !rings.length) put('box-shadow', 'none');
  if (shadow === 'literal') unread.push('shadow (an effect with no style)');
  else if (typeof shadow === 'string' && shadow !== CLEARED) rings.push(names.token(shadow));
  if (rings.length) put('box-shadow', rings.join(', '));

  const opacity = take('opacity');
  if (opacity !== undefined) put('opacity', typeof opacity === 'string' ? names.token(opacity) : String(opacity), literal(opacity));
  // (a clip, or one an instance stops where its component clips: UNCLIPPED, rules.mjs, over the component's `hidden`)
  const overflow = take('overflow');
  if (overflow === 'hidden' || overflow === UNCLIPPED) put('overflow', overflow);
  const blend = take('blend');
  if (blend) put('mix-blend-mode', blendToCss(blend));
  const rotation = take('rotation');
  // Figma's rotation turns counter-clockwise on screen (figma-fact:rotation-direction; the Plugin API: atan2(-m10, m00), y down) and CSS's rotate
  // clockwise: the same turn is its negative. (Figma turns about the layer's top-left, CSS about its centre: a limit)
  if (rotation) put('rotate', `${-rotation}deg`);
  // a mirror: its own property, as rotate is, so neither undoes the other
  const flip = take('flip');
  if (flip === 'x' || flip === 'y') put('scale', flip === 'x' ? '-1 1' : '1 -1');
  if (take('mask')) unread.push('mask');
  // corner smoothing as corner-shape (rules.mjs: an approximation of Figma's curve; a browser without corner-shape draws
  // the plain circle), written whatever the radius: on a square corner it draws nothing, as in Figma, and keeps the value
  const smoothing = take('smoothing'), shapeCss = smoothingToCss(smoothing);
  if (shapeCss) put('corner-shape', shapeCss);
  else if (smoothing !== undefined && smoothing !== 0) unread.push(`smoothing (${smoothing}: no corner-shape says it)`);

  // a part out of its parent's flow, pinned as its constraints say (an edge, both edges, or the centre)
  const position = take('position'), at = take('absolute'), cons = take('constraints');
  if (position === 'absolute' || at) {
    put('position', 'absolute');
    // with no constraints recorded (a snapshot before 0.61.0), pinned at its point where it has one; with neither,
    // centred, as a spinner over a button's words is, and said
    const c = cons || (at ? { horizontal: 'min', vertical: 'min' } : { horizontal: 'center', vertical: 'center' });
    if (!cons && !at) unread.push('constraints (none recorded: drawn centred)');
    const shift = [];
    for (const [to, near, far, o, f, size, k] of [[c.horizontal, 'inset-inline-start', 'inset-inline-end', at?.x, at?.end, 'inline-size', 'width'], [c.vertical, 'inset-block-start', 'inset-block-end', at?.y, at?.bottom, 'block-size', 'height']]) {
      const off = len(o ?? 0), offFar = f !== undefined ? len(f) : null;
      shift.push(to === 'center' ? '-50%' : '0');
      // centred keeps the distance of its centre from the parent's, as Figma's centre constraint does (a value
      // indicator 52 off the track's middle): `calc(50% ± d)`, d half the near offset less the far (derive.cjs writes
      // both), else from the sizes where they are numbers; else at the middle; a pixel's rounding is none (centreOffset)
      if (to === 'center') { const whole = box && box[k], own = e[k], d = typeof o === 'number' && typeof f === 'number' ? centreOffset(o, f) : typeof whole === 'number' && typeof own === 'number' && typeof o === 'number' ? +(o + own / 2 - whole / 2).toFixed(2) : 0; put(near, d ? `calc(50% ${d < 0 ? '-' : '+'} ${len(Math.abs(d))})` : '50%'); }
      else if (to === 'max') put(far, offFar ?? '0');
      // pinned to both edges, it takes its size from them
      else if (to === 'stretch') { put(near, off); put(far, offFar ?? off); for (let i = decls.length - 1; i >= 0; i--) if (decls[i][0] === size) decls.splice(i, 1); if (e.kind === 'instance') put(size, 'auto'); }
      // scaled with its parent: CSS has no such constraint, and its synonym (rules.mjs SCALE) is a share of the parent,
      // its offset and its size each a percentage of the parent's size
      else if (to === 'scale') {
        const whole = box && box[k], own = e[k];
        if (shareable(whole, o, own)) {
          put(near, share(o, whole));
          for (let i = decls.length - 1; i >= 0; i--) if (decls[i][0] === size) decls.splice(i, 1);
          put(size, share(own, whole));
        } else { unread.push(`constraints (scale: its parent's ${k}, its own or its offset is no number, so no share of it can be written)`); unshared.push(k === 'width' ? 'horizontal' : 'vertical'); }
      }
      else put(near, off);
    }
    if (shift.includes('-50%')) put('translate', shift.join(' '));
  } else if (anchors) put('position', 'relative');

  const ts = take('typography'), own = typeOfValue(ts);
  // a text with no style, by its values (rules.mjs typeValue), written as values, never a var() no token defines; one
  // whose values the contract does not hold (an older snapshot's literal, or mixed) is said, as an unstyled effect is
  if (own) {
    if (own.family) put('font-family', familyToCss(own.family), TEXT_NOTE);
    put('font-size', len(own.size), TEXT_NOTE); put('line-height', own.lineHeight ? len(own.lineHeight) : 'normal', own.lineHeight ? TEXT_NOTE : undefined); put('font-weight', String(own.cssWeight), TEXT_NOTE);
    if (own.italic) put('font-style', 'italic');
  }
  else if (ts === 'literal' || ts === 'mixed') unread.push(`typography (a text with ${ts === 'mixed' ? 'several styles' : 'no style'}, whose values the contract does not hold)`);
  else if (looksLikeValue(ts)) unread.push(`typography (${ts}: values no form writes)`);
  else if (typeof ts === 'string') for (const [p, v] of names.textStyle(ts)) put(p, v);
  // spacing, case and decoration no style gives (derive.cjs says them only then)
  const said = take('letterSpacing');
  // (a number the snapshot spells as words, `0.16`, kept so where no style is said at all, is that many px, not a token)
  const ls = typeof said === 'string' && said !== '' && !isNaN(said) ? +said : said;
  if (ls !== undefined) { const share = spacingToCss(ls); put('letter-spacing', share ?? len(ls, true), share || literal(ls) ? TEXT_NOTE : undefined); }
  for (const [k, rows] of [['textCase', CASE_ROWS], ['textDecoration', DECORATION_ROWS]]) {
    const w = take(k), d = w && textToCss(rows, w);
    if (d) put(d[0], d[1]); else if (w) unread.push(`${k} (${w}: no CSS writes it)`);
  }
  if (own) for (const [p, v] of UNSAID) if (!decls.some(([q]) => q === p)) put(p, v);
  const align = take('textAlign');
  if (align && align !== 'start') put('text-align', align);
  const lines = take('maxLines'), cut = take('truncate');
  // a text's white space is drawn as typed (a code block's newlines and indents), where CSS collapses it: words that
  // hold a newline, a tab or a run of spaces keep them (`words`: what a text bound to a property shows, its default)
  // (a single trailing newline is a gap: Figma's hug draws its empty last line, a browser under pre draws none)
  const kept = e.kind === 'text' && /[\n\t]| {2}/.test(typeof e.content === 'string' && !/^\{.+\}$/.test(e.content) ? e.content : words || '');
  // (one cut to a single line stays nowrap, which its ellipsis needs: its newlines are spaces there)
  if (lines === 1 && cut) { put('overflow', 'hidden'); put('white-space', 'nowrap'); put('text-overflow', 'ellipsis'); }
  else if (lines > 1) { put('display', '-webkit-box'); put('-webkit-box-orient', 'vertical'); put('-webkit-line-clamp', String(lines)); put('overflow', 'hidden'); if (kept) put('white-space', 'pre-wrap'); }
  // a text that hugs its width grows on one line and never wraps (Figma's WIDTH_AND_HEIGHT); CSS's shrink-to-fit
  // would wrap it at the room it has, so it is said with nowrap (rules.mjs autoResizeOf), one the design sizes all the
  // same too (a text placed by scale in a frame with no auto layout keeps the size it measured)
  // (kept white space: pre where the text hugs, still never wrapping; pre-wrap where it wraps)
  else if (kept) put('white-space', e.width === 'hug' || e.autoResize === 'width_and_height' ? 'pre' : 'pre-wrap');
  else if (e.kind === 'text' && (e.width === 'hug' || e.autoResize === 'width_and_height')) put('white-space', 'nowrap');
  // a text that grows down to its words (Figma's HEIGHT) at a height the design states all the same (no auto layout
  // sizes it): that height, never cutting its words, its minimum the words' own (rules.mjs autoResizeOf reads it back)
  if (e.kind === 'text' && e.autoResize === 'height' && typeof e.height === 'number' && !lines && e.minHeight === undefined) put('min-block-size', 'fit-content');
  // (a text that grows to its words has no room to place them in: nothing is lost there)
  if (take('verticalAlign') !== undefined && !/^(width_and_height|height)$/.test(e.autoResize || '')) unread.push('verticalAlign (text set in a taller box)');

  for (const k of Object.keys(e)) if (!done.has(k) && !STRUCTURE.has(k)) unread.push(k);
  return { decls, unread, unshared };
}

/* The kinds that hold parts: a container, and a slot, which Figma draws as a frame holding its default contents. */
export const holds = (kind) => kind === 'container' || kind === 'slot';
