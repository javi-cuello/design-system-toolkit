/*
 * tools/parity/probe.mjs — what is read off a rendered element, part of the
 * design-to-code parity engine (README.md here; the method is
 * skills/design-code-parity).
 *
 * One reading, run in the page, for every project: two projects each wrote one
 * and each read what the other could not. One read positions, the border box,
 * both gaps and the focus ring; the other read any CSS property a plan asked
 * for and whether a box cuts the glyphs it holds.
 *
 *   probe(sections, { core, instance }) → { __theme, [key]: { [layer]: record | null } }
 *   sections: { [key]: { scope: selector | null, layers: { [layer]: { selector, props? } } } }
 *
 * `scope` is the element a key's selectors are found under (one section of a
 * batched page), or the whole document. A selector may end in a pseudo-element
 * (`::placeholder`, `::after`), read on its element. A selector that matches
 * nothing is `null`, never an empty record: a dead probe must not read as an
 * element with no differences.
 *
 * `props` are what the plan asks, in CSS's own names, and come back as the
 * browser reports them, except where the browser's answer is not the design's
 * question:
 *   width, height  the border box, as Figma's w/h is — padding and inside
 *                  strokes included — before any transform. The computed width
 *                  is the content box on a content-box element and `auto` on
 *                  an inline one; a rect turns with a rotation.
 *   row-gap,       `normal` is 0px: what a flex or grid container lays out
 *   column-gap
 *   -stacking      which way the children run, read off the first two in-flow
 *                  children's boxes (a three-track grid runs them in a row);
 *                  the display and direction where there are fewer than two
 *   -place-h,      where the children sit along one physical axis, read off
 *   -place-v       their boxes in flex's words: `{ items, run }`, each child
 *                  with room to move and the children as a whole (a column
 *                  centred by auto margins is `center` whatever align-items
 *                  says, and so is a one-child row justified to its centre);
 *                  null for either where the boxes cannot say
 *   -clipped       whether the box cuts the glyphs it holds, or an ancestor that
 *                  clips cuts the box: 'no', or by how much
 *   -ring-width,   the focus ring as drawn: the outline where it has a style,
 *   -ring-offset,  else the first box-shadow layer that is a ring (no blur, a
 *   -ring-color    spread); 0px, 0px and 'none' where there is neither
 *   -rings         the colour of each outline the box and all it holds draw
 *   -inner-ring-width, -inner-ring-color
 *                  a ring drawn inside the box: an inset spread-only shadow,
 *                  else an outline offset inward by its width; 0px and 'none'
 *                  where there is neither. Apart from the ring above, which a
 *                  focused control draws outside it at the same time
 *   -stroke        whether the element draws an edge: 'none', 'a border',
 *                  'an inset ring' (an inset box-shadow layer) or 'an outline'
 *   -max-lines     how many lines the text may take: the line clamp, 1 where
 *                  it does not wrap, else 'unlimited'
 *   -truncate      'ellipsis' where an overflow is cut with one, else the
 *                  text-overflow
 *   -text          the words, whitespace collapsed
 *   -under         the background the element sits on: its nearest ancestor
 *                  that paints one, null where none does
 *   -rendered      'yes' where the element draws something anyone can see, in
 *                  a box with both extents: a fill, an edge, a shadow, words
 *                  (a control's value), a picture, or a child that does; an
 *                  empty slot kept for a picture draws nothing. A hidden
 *                  element keeps the width its
 *                  stylesheet gives it, an empty block is as wide as its
 *                  parent and 0 high, and one at opacity 0 or visibility
 *                  hidden keeps its box; a pseudo-element where it has
 *                  content, a placeholder while its field is empty
 *
 * `core: true` adds the fixed record a measurement baseline compares whatever
 * the plan asked (`self`, `anc`, `w`, `h`, `left`, `top`, …). Positions are
 * DOCUMENT-relative, the rect plus the scroll: viewport-relative tops moved
 * 2,582 values the day an autofocused title scrolled a shared page.
 * `instance` (`ds-{slug}`) names the custom element a library component
 * renders as, for the record's `children`.
 *
 * Measured twice, a fifth of a second apart, by `measure`: a ruler that gives
 * two answers is not a ruler, and the caller is told which layer, property and
 * values moved.
 */
import { unstable } from './measurements.mjs';

/* Runs IN THE PAGE: it travels as its source, so it uses nothing from here. */
export function probe(sections, opts) {
  opts = opts || {};
  const out = { __theme: document.documentElement.getAttribute('data-theme') };

  /* The natural line box of a font: the shortest a box holding it can be
     without cutting anything, from the font's own metrics through a canvas —
     never a probe element, because mutating the page under a measurement is
     how a run reports that its own two passes disagree. */
  const lines = {};
  let canvas = null;
  const naturalLine = (cs) => {
    const font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    if (lines[font] === undefined) {
      canvas = canvas || document.createElement('canvas').getContext('2d');
      canvas.font = font;
      const m = canvas.measureText('Xg@jÅ');
      lines[font] = m.fontBoundingBoxAscent + m.fontBoundingBoxDescent;
    }
    return lines[font];
  };
  // Does this element render text of its own? A wrapper holding a span holds
  // no glyphs, and flagging it would name the wrong layer.
  const rendersText = (el) => {
    // a checkbox's or a radio's value ("on") is not drawn: no glyphs to cut
    if (el.tagName === 'INPUT' && /^(checkbox|radio|range|color|file|hidden|image)$/.test(el.type)) return false;
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') return !!(el.value || el.placeholder);
    if (el.tagName === 'SELECT') return true;
    for (const n of el.childNodes) if (n.nodeType === 3 && n.nodeValue.trim()) return true;
    return false;
  };
  const CLIPS = ['hidden', 'clip', 'auto', 'scroll'];
  // per axis: `overflow-x: clip` cuts nothing vertically (hidden on one axis
  // computes the other to auto, so the computed value already says so)
  const control = (el) => ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName);
  const clipsX = (el, cs) => control(el) || CLIPS.includes(cs.overflowX);
  const clipsY = (el, cs) => control(el) || CLIPS.includes(cs.overflowY);
  const clipping = (el, cs) => {
    if (!rendersText(el)) return 'no';
    const cut = [];
    const inner = el.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    if (clipsY(el, cs) && inner > 0 && inner + 0.5 < naturalLine(cs)) cut.push(`vertically by ${(naturalLine(cs) - inner).toFixed(1)}px`);
    if (clipsX(el, cs) && el.scrollWidth > el.clientWidth + 1) cut.push(`horizontally by ${el.scrollWidth - el.clientWidth}px`);
    const r = el.getBoundingClientRect();
    // the page itself scrolls: what lies past the window is not cut
    for (let p = el.parentElement; p && p !== document.body && p !== document.documentElement; p = p.parentElement) {
      const ps = getComputedStyle(p);
      const x = clipsX(p, ps), y = clipsY(p, ps);
      if (!x && !y) continue;
      const pr = p.getBoundingClientRect();
      const over = Math.max(x ? r.right - pr.right : 0, x ? pr.left - r.left : 0, y ? r.bottom - pr.bottom : 0, y ? pr.top - r.top : 0);
      if (over > 1) cut.push(`by ${over.toFixed(1)}px inside ${p.className || p.tagName}`);
      break;
    }
    return cut.length ? cut.join(', ') : 'no';
  };
  /*
   * Which way the children run, and where they sit, are read off the
   * children's boxes, as the design states them: a grid of three column
   * tracks runs its children in a row whatever its auto-flow, and a column
   * centred by `margin-inline: auto` is centred whatever `align-items` says.
   * The computed values answer only where the boxes cannot: fewer than two
   * in-flow children, or no free space to place them in.
   */
  const flowKids = (el) => [...el.children].filter((k) => {
    const ks = getComputedStyle(k);
    if (ks.display === 'none' || ks.position === 'absolute' || ks.position === 'fixed') return false;
    const r = k.getBoundingClientRect();
    return r.width > 0 || r.height > 0;
  }).map((k) => k.getBoundingClientRect());
  const stacking = (cs, el) => {
    const kids = el ? flowKids(el) : [];
    if (kids.length >= 2) {
      const [a, b] = kids;
      if (b.top >= a.bottom - 0.5) return 'column';
      if (b.left >= a.right - 0.5 || b.right <= a.left + 0.5) return 'row';
    }
    const d = cs.display;
    if (d === 'flex' || d === 'inline-flex') return cs.flexDirection.startsWith('column') ? 'column' : 'row';
    if (d === 'grid' || d === 'inline-grid') return cs.gridAutoFlow.startsWith('column') ? 'row' : 'column';
    return d.startsWith('inline') && d !== 'inline-block' ? 'row' : 'column';
  };
  // Where the children sit along one physical axis, in flex's words: `items`,
  // each child with room to move on it (what align-items decides when it is
  // the cross axis), and `run`, the children as a whole (what
  // justify-content decides when it is the main one). null for either where
  // the boxes cannot say: no child with room, no free space.
  // A text leaf's lines, top to bottom, each as tall as its line-height:
  // the glyphs' own box widened by the half-leading on either side.
  const textLines = (el, cs) => {
    if (![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) return null;
    const range = document.createRange();
    range.selectNodeContents(el);
    const rects = [...range.getClientRects()].filter((q) => q.height > 0);
    if (!rects.length) return null;
    const lh = parseFloat(cs.lineHeight);
    const hl = Number.isFinite(lh) ? (lh - rects[0].height) / 2 : 0;
    return { top: Math.min(...rects.map((q) => q.top)) - hl, bottom: Math.max(...rects.map((q) => q.bottom)) + hl };
  };
  const placement = (el, cs, horizontal) => {
    const kids = flowKids(el);
    const [s0, s1] = horizontal ? ['left', 'right'] : ['top', 'bottom'];
    const [e0, e1] = horizontal ? ['Left', 'Right'] : ['Top', 'Bottom'];
    const r = el.getBoundingClientRect();
    const box = { [s0]: r[s0] + parseFloat(cs[`border${e0}Width`]) + parseFloat(cs[`padding${e0}`]), [s1]: r[s1] - parseFloat(cs[`border${e1}Width`]) - parseFloat(cs[`padding${e1}`]) };
    const where = (before, after) => (Math.abs(before) <= 0.5 ? 'flex-start' : Math.abs(after) <= 0.5 ? 'flex-end' : Math.abs(before - after) <= 1 ? 'center' : `${before.toFixed(1)}px before, ${after.toFixed(1)}px after`);
    /* Text with no element inside: where its lines sit in its own box. A
       fixed-height text centred by a line-height as tall as the box was read
       as `normal` and red against the design's CENTER (review 2026-10-02
       round 3, S7). Lines that fill the box leave no room to align in:
       `filled`, and the line-height, asserted on its own, decides the rest. */
    if (!kids.length) {
      const t = !horizontal && textLines(el, cs);
      if (!t) return null;
      const before = t.top - box.top, after = box.bottom - t.bottom;
      const at = before + after <= 0.5 ? 'filled' : where(before, after);
      return { items: at, run: at };
    }
    // Children that wrapped onto several lines are each placed within their
    // line, not the box: where on this axis they lie apart, no child's place
    // can be read against the box. The run is read off all of them together,
    // which holds for one line, several, or a column flattened into the box.
    const apart = kids.some((a) => kids.some((b) => b[s0] >= a[s1] - 0.5 && a !== b));
    const seen = new Set(kids.filter((k) => box[s1] - box[s0] - (k[s1] - k[s0]) > 0.5).map((k) => where(k[s0] - box[s0], box[s1] - k[s1])));
    const items = seen.size && !apart ? [...seen].join(' / ') : null;
    const lead = Math.min(...kids.map((k) => k[s0])) - box[s0], trail = box[s1] - Math.max(...kids.map((k) => k[s1]));
    let run = null;
    if (lead + trail > 0.5) run = where(lead, trail);
    else if (kids.length > 1) {
      const gap = parseFloat(cs[horizontal ? 'columnGap' : 'rowGap']) || 0;
      const used = kids.reduce((t, k) => t + (k[s1] - k[s0]), 0) + gap * (kids.length - 1);
      if (box[s1] - box[s0] - used > 0.5) run = 'space-between';
    }
    return { items, run };
  };
  // The ring as drawn: an outline with a style, else a spread-only shadow.
  const ring = (cs) => {
    // `drawn` says which, because Chrome snaps an outline's width as it
    // does a border's and leaves a shadow's spread as written (schema.mjs)
    if (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0) return { width: cs.outlineWidth, offset: cs.outlineOffset, color: cs.outlineColor, drawn: 'an outline' };
    for (const layer of cs.boxShadow === 'none' ? [] : cs.boxShadow.split(/,(?![^(]*\))/)) {
      const colour = (layer.match(/(rgba?|color)\([^)]*\)/) || [''])[0];
      const n = layer.replace(colour, '').match(/-?[\d.]+px/g) || [];
      const [, , blur = '0px', spread = '0px'] = n;
      if (parseFloat(blur) === 0 && parseFloat(spread) > 0) return { width: spread, offset: /inset/.test(layer) ? `-${spread}` : '0px', color: colour, drawn: 'a shadow' };
    }
    return { width: '0px', offset: '0px', color: 'none', drawn: 'none' };
  };
  // The ring's outer corner radius: an outline's and a spread shadow's corners
  // follow the box's border-radius grown by how far the ring reaches past it
  // (offset plus width), so the radius written on the box is not the ring's.
  // Tested in Chromium 2026-10-25: radius 12, a 2px outline at offset 2, draws
  // 16. Capped at half the ring's shorter side, as a pill's is.
  const ringRadius = (el, cs) => {
    const r = ring(cs);
    if (r.drawn === 'none') return '0px';
    const reach = r.drawn === 'an outline' ? parseFloat(r.offset) + parseFloat(r.width) : parseFloat(r.width);
    const box = el.getBoundingClientRect(), cap = Math.min(box.width, box.height) / 2 + reach;
    const own = parseFloat(cs.borderTopLeftRadius) || 0;
    return `${+Math.min(own > 0 ? own + reach : 0, cap).toFixed(2)}px`;
  };
  // A ring drawn inside the box, over or under its content: an inset
  // spread-only shadow layer, else an outline pulled in by at least its own
  // width. Read apart from the ring above, because a focused control carries
  // both: its stroke inside, its focus ring outside.
  const innerRing = (cs) => {
    for (const layer of cs.boxShadow === 'none' ? [] : cs.boxShadow.split(/,(?![^(]*\))/)) {
      if (!/inset/.test(layer)) continue;
      const colour = (layer.match(/(rgba?|color)\([^)]*\)/) || [''])[0];
      const [x = '0px', y = '0px', blur = '0px', spread = '0px'] = layer.replace(colour, '').match(/-?[\d.]+px/g) || [];
      if ([x, y, blur].every((v) => parseFloat(v) === 0) && parseFloat(spread) > 0) return { width: spread, color: colour, drawn: 'a shadow' };
    }
    const w = parseFloat(cs.outlineWidth);
    if (cs.outlineStyle !== 'none' && w > 0 && parseFloat(cs.outlineOffset) <= -w + 0.01) return { width: cs.outlineWidth, color: cs.outlineColor, drawn: 'an outline' };
    return { width: '0px', color: 'none', drawn: 'none' };
  };
  /*
   * Whether an element puts anything on screen: a picture or a drawing, a
   * fill, an edge, a shadow, words, a pseudo-element with content, or a child
   * that does. A form control's words are its value. An empty slot kept for
   * a picture that is not there has a box and draws nothing, and a layer the
   * design leaves out is not "drawn anyway" by it.
   */
  const clearColour = (c) => /^(transparent|rgba\([^)]*,\s*0\)|rgb\([^)]*\/\s*0\))$/.test(String(c).trim());
  const paints = (e) => {
    const r = e.getBoundingClientRect();
    if (!(r.width > 0 && r.height > 0) || !e.checkVisibility({ opacityProperty: true, visibilityProperty: true })) return false;
    if (/^(IMG|VIDEO|CANVAS|IFRAME|OBJECT|EMBED)$/.test(e.tagName) || e.namespaceURI === 'http://www.w3.org/2000/svg') return true;
    const s = getComputedStyle(e);
    if (!clearColour(s.backgroundColor) || s.backgroundImage !== 'none' || s.boxShadow !== 'none') return true;
    if (['Top', 'Right', 'Bottom', 'Left'].some((x) => parseFloat(s[`border${x}Width`]) > 0 && s[`border${x}Style`] !== 'none' && !clearColour(s[`border${x}Color`]))) return true;
    if (s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0 && !clearColour(s.outlineColor)) return true;
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.tagName)) return !!e.value || [...e.children].some(paints);
    if ([...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) return true;
    if (['::before', '::after'].some((w) => { const c = getComputedStyle(e, w).content; return c && c !== 'none' && c !== 'normal'; })) return true;
    return [...e.children].some(paints);
  };
  // The layout's border box, before any transform: a spinner turning under
  // the rect read a different width each pass. `auto` (an inline box, which
  // no transform applies to) is its rect.
  const borderBox = (el, cs, p) => {
    const v = parseFloat(cs[p]);
    if (!Number.isFinite(v)) return `${el.getBoundingClientRect()[p]}px`;
    if (cs.boxSizing === 'border-box') return cs[p];
    const [a, b] = p === 'width' ? ['Left', 'Right'] : ['Top', 'Bottom'];
    return `${v + parseFloat(cs[`padding${a}`]) + parseFloat(cs[`padding${b}`]) + parseFloat(cs[`border${a}Width`]) + parseFloat(cs[`border${b}Width`])}px`;
  };
  const read = (el, cs, pseudo, p) => {
    if (p === '-clipped') return clipping(el, cs);
    if (p === '-stacking') return stacking(cs, pseudo ? null : el);
    if (p === '-place-h' || p === '-place-v') return pseudo ? null : placement(el, cs, p === '-place-h');
    if (p === '-ring-radius') return ringRadius(el, cs);
    if (p.startsWith('-ring-')) return ring(cs)[p.slice(6)];
    if (p.startsWith('-inner-ring-')) return innerRing(cs)[p.slice(12)];
    // the colour of each outline the box and what it holds draw: a part's ring beside its holder's is a second ring
    if (p === '-rings') return pseudo ? null : [el, ...el.querySelectorAll('*')].map((x) => getComputedStyle(x)).filter((c) => c.outlineStyle !== 'none' && parseFloat(c.outlineWidth) > 0 && !clearColour(c.outlineColor)).map((c) => c.outlineColor);
    if (p === '-stroke') {
      // an edge drawn in a transparent colour draws nothing
      const seen = (c) => !/^(transparent|rgba\([^)]*,\s*0\)|rgb\([^)]*\/\s*0\))$/.test(String(c).trim());
      const border = ['Top', 'Right', 'Bottom', 'Left'].some((x) => parseFloat(cs[`border${x}Width`]) > 0 && cs[`border${x}Style`] !== 'none' && seen(cs[`border${x}Color`]));
      const inset = cs.boxShadow === 'none' ? [] : cs.boxShadow.split(/,(?![^(]*\))/).filter((l) => /inset/.test(l) && seen((l.match(/(rgba?|color)\([^)]*\)/) || ['transparent'])[0]));
      const outline = cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0 && seen(cs.outlineColor);
      return border ? 'a border' : inset.length ? 'an inset ring' : outline ? 'an outline' : 'none';
    }
    if (p === '-max-lines') return cs.webkitLineClamp && cs.webkitLineClamp !== 'none' ? String(parseInt(cs.webkitLineClamp, 10)) : cs.whiteSpace === 'nowrap' ? '1' : 'unlimited';
    if (p === '-truncate') return cs.textOverflow === 'ellipsis' || (cs.webkitLineClamp && cs.webkitLineClamp !== 'none') ? 'ellipsis' : cs.textOverflow;
    if (p === '-rendered') {
      const b = el.getBoundingClientRect();
      const seen = b.width > 0 && b.height > 0 && el.checkVisibility({ opacityProperty: true, visibilityProperty: true });
      // a pseudo-element is there when it has content; a placeholder while the field is empty
      if (pseudo === '::placeholder') return seen && !el.value && !!el.placeholder ? 'yes' : 'no';
      if (pseudo) return seen && cs.content !== 'none' && cs.content !== 'normal' && cs.display !== 'none' ? 'yes' : 'no';
      return seen && paints(el) ? 'yes' : 'no';
    }
    if (p === '-text') return el.textContent.replace(/\s+/g, ' ').trim();
    if (p === '-under') {
      // what the element sits on: its nearest ancestor that paints a background, null where none does
      for (let a = el.parentElement; a; a = a.parentElement) { const bg = getComputedStyle(a).backgroundColor; if (!/rgba\(.*,\s*0\)$|transparent/.test(bg)) return bg; }
      return null;
    }
    if ((p === 'width' || p === 'height') && !pseudo) return borderBox(el, cs, p);
    const v = cs.getPropertyValue(p).trim();
    return (p === 'row-gap' || p === 'column-gap') && v === 'normal' ? '0px' : v;
  };

  const prefix = opts.instance ? String(opts.instance).split('{slug}')[0].toUpperCase() : null;
  const core = (el, cs, pseudo, at, scope) => {
    const b = el.getBoundingClientRect();
    const attrs = {};
    for (const a of el.attributes) attrs[a.name] = a.value;
    // Selected and Checked live on the control: a checked input inside (or the element itself) sets them
    if ((el.matches && el.matches(':checked')) || el.querySelector(':scope input:checked')) attrs.__checked = '1';
    const anc = [];
    for (let n = el.parentElement; n && n !== scope; n = n.parentElement) anc.push(at.get(n));
    const px = (v) => parseFloat(v);
    return {
      self: at.get(el), anc, w: pseudo ? px(cs.width) || b.width : b.width, h: pseudo ? px(cs.height) || b.height : b.height,
      left: b.left + scrollX, top: b.top + scrollY, text: el.textContent.replace(/\s+/g, ' ').trim(), attrs,
      pad: [cs.paddingTop, cs.paddingRight, cs.paddingBottom, cs.paddingLeft].map(px),
      rowGap: px(cs.rowGap) || 0, columnGap: px(cs.columnGap) || 0, justify: cs.justifyContent,
      radius: [cs.borderTopLeftRadius, cs.borderTopRightRadius, cs.borderBottomRightRadius, cs.borderBottomLeftRadius].map(px),
      minHeight: px(cs.minHeight) || 0, minWidth: px(cs.minWidth) || 0, maxWidth: cs.maxWidth, maxHeight: cs.maxHeight,
      bg: cs.backgroundColor, bgImage: cs.backgroundImage, color: cs.color, shadow: cs.boxShadow, opacity: px(cs.opacity),
      clipped: (cs.overflow !== 'visible' || cs.textOverflow === 'ellipsis') && (el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1),
      textAlign: cs.textAlign, direction: cs.direction, rotate: px(cs.rotate) || 0, lineClamp: cs.webkitLineClamp === 'none' ? null : cs.webkitLineClamp,
      whiteSpace: cs.whiteSpace, textOverflow: cs.textOverflow, textCase: cs.textTransform, textDecoration: cs.textDecorationLine,
      letterSpacing: cs.letterSpacing, blendMode: cs.mixBlendMode, borderStyle: cs.borderTopStyle, alignItems: cs.alignItems,
      border: [cs.borderTopWidth, cs.borderRightWidth, cs.borderBottomWidth, cs.borderLeftWidth].map(px),
      outline: cs.outlineStyle === 'none' ? 0 : px(cs.outlineWidth), outlineOffset: px(cs.outlineOffset) || 0, outlineColor: cs.outlineColor,
      font: { size: px(cs.fontSize), weight: +cs.fontWeight, lineHeight: px(cs.lineHeight), family: cs.fontFamily.split(',')[0].replace(/"/g, '') },
      ...(prefix ? {
        children: [...el.querySelectorAll('*')].filter((k) => k.tagName.startsWith(prefix) && k.getClientRects().length > 0).map((k) => {
          const a = [];
          for (let n = k.parentElement; n && n !== el; n = n.parentElement) if (n.tagName.startsWith(prefix)) a.push(n.tagName.slice(prefix.length).toLowerCase());
          return { idx: at.get(k), tag: k.tagName.slice(prefix.length).toLowerCase(), ancestors: a, text: k.textContent.replace(/\s+/g, ' ').trim(), icon: k.dataset.name || '' };
        }),
      } : null),
    };
  };

  for (const [key, section] of Object.entries(sections)) {
    const scope = section.scope ? document.querySelector(section.scope) : document;
    if (!scope) { out[key] = null; continue; }
    // indexOf over 1800 elements, once per mapped layer and per ancestor, was
    // the one loop that grew with a page's content: indexed once
    const at = opts.core ? new Map([...scope.querySelectorAll('*')].map((e, i) => [e, i])) : null;
    const res = {};
    for (const [layer, { selector, props = [] }] of Object.entries(section.layers)) {
      const cut = selector ? selector.indexOf('::') : -1;
      const pseudo = cut < 0 ? null : selector.slice(cut);
      const el = selector ? scope.querySelector(cut < 0 ? selector : selector.slice(0, cut)) : null;
      if (!el) { res[layer] = null; continue; }
      const cs = getComputedStyle(el, pseudo);
      const r = opts.core ? core(el, cs, pseudo, at, section.scope ? scope : null) : {};
      // a field of the fixed record keeps its own reading (`opacity` a number,
      // `rotate` in degrees), so a baseline does not move when a plan asks too
      for (const p of props) if (!(p in r)) r[p] = read(el, cs, pseudo, p);
      res[layer] = r;
    }
    out[key] = res;
  }
  return out;
}

/** The probe as the source a DevTools evaluate takes. */
export const probeSource = () => `(${probe})`;

/**
 * Read `sections` twice, a fifth of a second apart, through `tab`
 * (tools/shared/cdp.mjs). `moved` names each layer, property and both values
 * that did not repeat; empty is a measurement.
 */
export async function measure(tab, sections, opts = {}) {
  /* An animation is held where it rests, so the two readings can agree: one
     that ends is finished (a hover's colour transition lands on its colour),
     one that never ends (a spinner) is held at its start. A rotating
     spinner's box differs at every frame, and two readings of it never did. */
  await tab.evaluate(`document.getAnimations().forEach((a) => { const t = a.effect && a.effect.getComputedTiming(); if (t && t.iterations === Infinity) { a.pause(); a.currentTime = 0; } else { try { a.finish(); } catch { /* an unfinishable one stays */ } } }); true`).catch(() => {});
  const once = () => tab.evaluate(`${probeSource()}(${JSON.stringify(sections)}, ${JSON.stringify(opts)})`);
  const read = await once();
  await new Promise((r) => setTimeout(r, 200));
  const again = await once();
  const moved = [];
  for (const key of Object.keys(sections)) for (const l of unstable(read[key], again[key])) moved.push(`${key} › ${l}`);
  return { read, moved };
}
