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
 * that CSS cannot (a corner's smoothing, an image fill, an arc) is returned in `unread`, never dropped quietly.
 */

const SIDES = ['top', 'end', 'bottom', 'start'];
const ALIGN = { start: 'flex-start', center: 'center', end: 'flex-end', 'space-between': 'space-between', baseline: 'baseline', stretch: 'stretch' };
// what a part's markup says, not its styles: the template's, never a declaration
const STRUCTURE = new Set(['kind', 'parent', 'order', 'name', 'content', 'component', 'with', 'swappedBy', 'inner', 'text', 'autoResize', 'canvas', 'figma']);
const NOTE = 'no token in the design';

const rem = (n) => `${+(n / 16).toFixed(4)}rem`;

export function declarations(e, { root = false, holds = false, row = true, anchors = false } = {}, names) {
  const decls = [], unread = [];
  const put = (prop, value, note) => { if (value !== undefined && value !== null && !/\bundefined\b/.test(String(value))) decls.push(note ? [prop, value, note] : [prop, value]); };
  // a value as a length: a token by its custom property, a number in rem (or px where it must not scale)
  const len = (v, px = false) => (typeof v === 'string' ? names.token(v) : typeof v === 'number' ? (v === 0 ? '0' : names.number ? names.number(v) : px ? `${+v.toFixed(4)}px` : rem(v)) : undefined);
  const literal = (v) => (typeof v === 'number' && v !== 0 ? NOTE : undefined);
  const done = new Set();
  const take = (k) => { done.add(k); return e[k]; };

  const l = take('layout');
  if (l && holds) {
    // an outer box that hugs sits in its line as a word does (figma-handoff: a hugging button is inline-flex)
    put('display', root && (e.width === undefined || e.width === 'hug') ? 'inline-flex' : 'flex');
    put('flex-direction', l.direction === 'column' ? 'column' : 'row');
    if (l.wrap) put('flex-wrap', 'wrap');
    // spaced between, Figma sets the gap aside (its auto spacing); CSS would add it to the space
    if (l.gap !== undefined && l.align !== 'space-between') put('gap', len(l.gap), literal(l.gap));
    if (l.crossGap !== undefined) put(l.direction === 'column' ? 'column-gap' : 'row-gap', len(l.crossGap), literal(l.crossGap));
    const pad = l.padding || {};
    if (SIDES.some((s) => pad[s] !== undefined)) {
      const four = SIDES.map((s) => len(pad[s] ?? 0));
      put('padding', four[0] === four[2] && four[1] === four[3] ? (four[0] === four[1] ? four[0] : `${four[0]} ${four[1]}`) : four.join(' '), SIDES.some((s) => literal(pad[s])) ? NOTE : undefined);
    }
    if (ALIGN[l.align]) put('justify-content', ALIGN[l.align]);
    if (ALIGN[l.crossAlign]) put('align-items', ALIGN[l.crossAlign]);
    if (l.firstOnTop) unread.push('layout.firstOnTop');
  }

  // fill, hug or a size: hug is the box's own, fill grows along the parent's flow or stretches across it
  for (const [k, prop, along] of [['width', 'inline-size', row], ['height', 'block-size', !row]]) {
    const v = take(k);
    // an outer box that hugs keeps its own width where a parent would stretch it
    if (v === 'hug' && root && k === 'width' && l && holds) put('inline-size', 'fit-content');
    if (v === undefined || v === 'hug') continue;
    // filled across and capped (a dialog's panel to 556): stretched, the cap would pin it to the start, so it takes
    // the full size instead and sits where its parent aligns it, as Figma has it
    if (v === 'fill') { if (root) continue; if (along) put('flex', '1 1 0'); else if (e[k === 'width' ? 'maxWidth' : 'maxHeight'] !== undefined) put(prop, '100%'); else { put('align-self', 'stretch'); if (e.kind === 'instance') put(prop, 'auto'); } continue; }
    put(prop, len(v), literal(v));
  }
  for (const [k, prop] of [['minWidth', 'min-inline-size'], ['minHeight', 'min-block-size'], ['maxWidth', 'max-inline-size'], ['maxHeight', 'max-block-size']]) {
    const v = take(k);
    if (v !== undefined) put(prop, len(v), literal(v));
  }

  const bg = take('background');
  for (const fill of [].concat(bg ?? [])) {
    // a colour with no variable is written as itself, said so; a name is its token's
    if (typeof fill === 'string' && /^(#|rgba?\(|hsla?\()/.test(fill)) put('background', fill, NOTE);
    else if (typeof fill === 'string' && !fill.startsWith('IMAGE')) put('background', names.token(fill));
    else unread.push(typeof fill === 'string' ? 'background (an image fill: the template supplies the image)' : 'background (a gradient)');
  }
  const color = take('color');
  if (typeof color === 'string') put('color', names.token(color));

  const radius = take('radius');
  if (radius === 'mixed') unread.push('radius (mixed corners, unrecorded)');
  else if (Array.isArray(radius)) put('border-radius', radius.map((r) => len(r, true) ?? '0').join(' '), radius.some(literal) ? NOTE : undefined);
  else if (radius !== undefined) put('border-radius', len(radius, true), literal(radius));
  const shape = take('shape');
  if (shape === 'ellipse') put('border-radius', '50%');
  if (take('arc')) unread.push('arc (part of a ring: no CSS shape draws it)');

  // a stroke in the channel that takes the room Figma's takes (code-standard rule 63)
  // a stroke with no paint draws nothing, whatever its weight
  const b = take('border');
  const rings = [];
  if (b && b.color !== undefined) {
    const widths = Array.isArray(b.width) ? b.width : SIDES.map(() => b.width ?? 1);
    const on = SIDES.map((s, i) => (b.sides ? !!b.sides[s] : widths[i] !== 0) && widths[i] !== 0);
    // a side's width by its token, else the weight the stroke records for that side
    const w = (i) => len(widths[i], true) ?? (b.sides && typeof b.sides[SIDES[i]] === 'number' ? len(b.sides[SIDES[i]], true) : undefined);
    const c = names.token(b.color);
    const align = b.align || 'inside';
    if (b.dash) unread.push('border.dash');
    // a line (a layer no wide or no tall, a divider): its stroke is the one edge it draws, its leading one, as parity reads it
    const line = e.kind === 'graphic' && (e.width === 0 || e.height === 0);
    if (line) put(e.width === 0 ? 'border-left' : 'border-top', `${w(on.findIndex(Boolean) < 0 ? 0 : on.findIndex(Boolean))} solid ${c}`);
    else if (align === 'inside' && b.inLayout) {
      SIDES.forEach((s, i) => { if (on[i]) put(`border-${{ top: 'top', end: 'right', bottom: 'bottom', start: 'left' }[s]}`, `${w(i)} solid ${c}`); });
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
  if (shadow === 'literal') unread.push('shadow (an effect with no style)');
  else if (typeof shadow === 'string') rings.push(names.token(shadow));
  if (rings.length) put('box-shadow', rings.join(', '));

  const opacity = take('opacity');
  if (opacity !== undefined) put('opacity', typeof opacity === 'string' ? names.token(opacity) : String(opacity), literal(opacity));
  if (take('overflow') === 'hidden') put('overflow', 'hidden');
  const blend = take('blend');
  if (blend) put('mix-blend-mode', String(blend).replace(/_/g, '-'));
  const rotation = take('rotation');
  if (rotation) put('rotate', `${rotation}deg`);
  if (take('mask')) unread.push('mask');
  if (take('smoothing') !== undefined) unread.push('smoothing (corner smoothing: CSS rounds corners as circles)');

  // a part out of its parent's flow, pinned as its constraints say (an edge, both edges, or the centre)
  const position = take('position'), at = take('absolute'), cons = take('constraints');
  if (position === 'absolute' || at) {
    put('position', 'absolute');
    // with no constraints recorded (a snapshot before 0.61.0), pinned at its point where it has one; with neither,
    // centred, as a spinner over a button's words is, and said
    const c = cons || (at ? { horizontal: 'min', vertical: 'min' } : { horizontal: 'center', vertical: 'center' });
    if (!cons && !at) unread.push('constraints (none recorded: drawn centred)');
    const shift = [];
    for (const [to, near, far, o, f, size] of [[c.horizontal, 'inset-inline-start', 'inset-inline-end', at?.x, at?.end, 'inline-size'], [c.vertical, 'inset-block-start', 'inset-block-end', at?.y, at?.bottom, 'block-size']]) {
      const off = len(o ?? 0), offFar = f !== undefined ? len(f) : null;
      shift.push(to === 'center' ? '-50%' : '0');
      if (to === 'center') put(near, '50%');
      else if (to === 'max') put(far, offFar ?? '0');
      // pinned to both edges, it takes its size from them
      else if (to === 'stretch') { put(near, off); put(far, offFar ?? off); for (let i = decls.length - 1; i >= 0; i--) if (decls[i][0] === size) decls.splice(i, 1); }
      else if (to === 'scale') unread.push('constraints (scale)');
      else put(near, off);
    }
    if (shift.includes('-50%')) put('translate', shift.join(' '));
  } else if (anchors) put('position', 'relative');

  const ts = take('typography');
  if (typeof ts === 'string') for (const [p, v] of names.textStyle(ts)) put(p, v);
  const align = take('textAlign');
  if (align && align !== 'start') put('text-align', align);
  const lines = take('maxLines'), cut = take('truncate');
  if (lines === 1 && cut) { put('overflow', 'hidden'); put('white-space', 'nowrap'); put('text-overflow', 'ellipsis'); }
  else if (lines > 1) { put('display', '-webkit-box'); put('-webkit-box-orient', 'vertical'); put('-webkit-line-clamp', String(lines)); put('overflow', 'hidden'); }
  if (take('verticalAlign') !== undefined) unread.push('verticalAlign (text set in a taller box)');

  for (const k of Object.keys(e)) if (!done.has(k) && !STRUCTURE.has(k)) unread.push(k);
  return { decls, unread };
}

/* The kinds that hold parts: a container, and a slot, which Figma draws as a frame holding its default contents. */
export const holds = (kind) => kind === 'container' || kind === 'slot';
