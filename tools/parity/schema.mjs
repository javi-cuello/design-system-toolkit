/*
 * tools/parity/schema.mjs — what the differ can judge, part of the
 * design-to-code parity engine (README.md here; the method is
 * skills/design-code-parity).
 *
 * The closed table of assertion kinds and their comparators, and the closed
 * table of props an assertion (and so a waiver key, `Layer.prop`) can name.
 * Closed on purpose: a comparison that can invent a kind can also quietly skip
 * one, and a typo'd prop makes its waiver key unmatchable in silence.
 *
 * Every comparator is `compare(expected, actual, assertion, tolerances)` and
 * answers one question with a boolean, so one assertion is one judged row.
 * Most kinds compare the one prop the probe read; a kind whose question spans
 * the record or the layers says so with `read` (and `reads`, what the probe
 * must read for it, or `core`, the probe's fixed record), and `show` for how
 * its values print. A `read` that returns SKIP has nothing to ask (a position
 * with no measured ancestor, which is its own `nomatch`).
 * `expected` is already resolved for the tier (never a token name); `actual`
 * is what the probe read. How far apart two values may be is the project's,
 * from `parity.tolerances` in its snapshot.config.json, keyed by kind, and
 * defaults to exact: no project's numbers live here. Two projects wrote these
 * separately, and one judged every number within ±1 — which passes an opacity
 * of 0.4 against 1 and a font size of 13 against 14. A tolerance per kind is
 * what lets a project allow a pixel of box rounding without allowing that.
 */
import { parseColour, parseShadow, parseGradient } from './values.mjs';

/* What a kind's `read` returns when its question has nothing to be asked of:
   the differ reports no row (the reason is a row of its own elsewhere). */
export const SKIP = Symbol('not judged');

const COLOUR_IN = /rgba?\([^)]*\)|color\([^)]*\)|#[0-9a-fA-F]{3,8}/;

/* A number and its unit: `12px` → [12, 'px']; a bare number has no unit, and
   matches any (one project reads numbers, the other the browser's strings). */
const split = (v) => {
  if (typeof v === 'number') return [v, null];
  const m = /^\s*(-?[\d.]+(?:e-?\d+)?)\s*([a-z%]*)\s*$/i.exec(String(v));
  return m ? [parseFloat(m[1]), m[2]] : [NaN, null];
};
/* Within `tol` of each other, element by element for a list (padding's four
   sides, a radius's four corners). Same unit, or no unit on one side. */
/* CSS Backgrounds 4 §snap-as-a-border-width, as Chrome reports it. */
const BORDER_LIKE = /^border-\w+-width$/;
const ringKind = (prop, drawn) => ({
  reads: [prop, drawn],
  read: ({ record }) => ({ value: record[prop], drawn: record[drawn] }),
  show: (v) => (v && typeof v === 'object' && 'value' in v ? v.value : v),
  off: (e, a) => Math.abs(parseFloat(e) - parseFloat(a && typeof a === 'object' ? a.value : a)),
  compare: (e, a, _, t = {}) => {
    const v = a && typeof a === 'object' && 'value' in a ? a.value : a, how = a && typeof a === 'object' ? a.drawn : undefined;
    return near(e, v, t.strokeWidth) || (how === 'an outline' && near(snapBorder(e), v, t.strokeWidth));
  },
});
export const snapBorder = (v) => {
  const [x, u] = split(v);
  if (!Number.isFinite(x) || (u && u !== 'px') || x <= 0 || Number.isInteger(x)) return v;
  return `${x < 1 ? 1 : Math.floor(x)}px`;
};
const near = (e, a, tol = 0) => {
  if (Array.isArray(e)) return Array.isArray(a) && e.length <= a.length && e.every((v, i) => near(v, a[i], tol));
  if (typeof e === 'string' && e === a) return true;
  const [x, u] = split(e), [y, w] = split(a);
  return Number.isFinite(x) && Number.isFinite(y) && Math.abs(x - y) <= tol && (u === null || w === null || u === w);
};

/*
 * Two colours, as a string or a parsed `[r, g, b, a]`. Alpha is compared in
 * the 1/255 steps a browser stores: the library's 0.116 comes back as 0.118,
 * and string equality reported every translucent token as a difference.
 * `tolerances.colour` = `{ channel, alpha }` (0–255 per channel, alpha in
 * alpha units), default exact. Anything unparseable is compared as written,
 * which fails loudly rather than matching by accident.
 */
const sameColour = (e, a, tol = {}) => {
  const x = Array.isArray(e) ? e : parseColour(e), y = Array.isArray(a) ? a : parseColour(a);
  if (!x || !y) return e != null && a != null && String(e).trim() === String(a).trim();
  const q = (v) => Math.round(v * 255);
  return [0, 1, 2].every((i) => Math.abs(x[i] - y[i]) <= (tol.channel || 0))
    && Math.abs(q(x[3]) - q(y[3])) <= (tol.alpha || 0) * 255 + 1e-9;
};

/* One colour as the browser would write it, for an expectation and a report. */
export const css = (rgba) => (rgba ? `rgba(${rgba[0]}, ${rgba[1]}, ${rgba[2]}, ${rgba[3]})` : null);

/* One shadow layer → `inset? r,g,b,a x y blur spread`, so the two spellings
   of the same shadow compare equal; alpha quantised as above. A shadow may
   omit its spread, and the browser always reports four lengths. */
const canonColour = (s) => {
  const c = parseColour(s);
  return c ? `${c[0]},${c[1]},${c[2]},${Math.round(c[3] * 255)}` : String(s).trim();
};
/* Inset layers paint inside the border box and outer ones outside it, so an
   inset never covers an outer one: only the order within each set is drawn
   (item 40 of the 2026-10-02 review — the whole list compared in order failed
   `inset A, outer B` against `outer B, inset A`, which paint the same). */
function canonShadow(value) {
  if (value === undefined || value === null) return String(value);
  const layers = parseShadow(value).map((l) => {
    const found = l.raw.match(COLOUR_IN);
    return { inset: l.inset, text: `${l.inset ? 'inset ' : ''}${found ? canonColour(found[0]) : '?'} ${l.lengths.join(' ')}` };
  });
  return [...layers.filter((l) => !l.inset), ...layers.filter((l) => l.inset)].map((l) => l.text).join(' | ');
}
/*
 * A gradient's stops with every position stated, as CSS Images 3 §3.4.3 fixes
 * the ones left out: the first at 0%, the last at 100%, one before an earlier
 * one's position moved up to it, and a run of unpositioned stops spread evenly
 * between the positioned stops either side. Chrome's computed value for
 * `linear-gradient(red, blue)` states no positions at all, and dropping them
 * judged correct code a difference.
 */
export function stopPositions(stops) {
  const at = stops.map((s) => s.position);
  if (!at.length) return [];
  if (at[0] === null) at[0] = 0;
  if (at[at.length - 1] === null) at[at.length - 1] = Math.max(100, ...at.filter((x) => x !== null));
  for (let i = 1, top = at[0]; i < at.length; i++) if (at[i] !== null) { if (at[i] < top) at[i] = top; top = at[i]; }
  for (let i = 1; i < at.length; i++) {
    if (at[i] !== null) continue;
    let j = i; while (at[j] === null) j++;
    for (let k = i; k < j; k++) at[k] = at[i - 1] + ((at[j] - at[i - 1]) * (k - i + 1)) / (j - i + 1);
    i = j;
  }
  return stops.map((s, i) => ({ ...s, position: +at[i].toFixed(4) }));
}
function canonGradient(value) {
  if (typeof value !== 'string') return String(value);
  const g = parseGradient(value);
  if (!g) return value.trim();
  // The angle is stated even where the browser dropped it: `linear-gradient(
  // 180deg, …)` comes back without it, top to bottom being the default.
  return [`${g.angle}deg`, ...stopPositions(g.stops).map((st) => {
    const found = st.raw.match(COLOUR_IN);
    return `${found ? canonColour(found[0]) : st.raw} ${st.position}%`;
  })].join(' | ');
}

/* A radius's eight radii as CSS draws them on box `{ w, h }`: `h1 h2 … / v1
   v2 …`, each side expanded from one to four values, a percentage against its
   own axis, and all scaled down together where corners overrun a side. */
function corners(v, box) {
  const [hs, vs = hs] = String(v).trim().split('/').map((side) => side.trim().split(/\s+/));
  const four = (parts, along) => {
    const n = parts.map((x) => (/%$/.test(x) ? (parseFloat(x) / 100) * along : parseFloat(x)));
    const [tl, tr = tl, br = tl, bl = tr] = n;
    return [tl, tr, br, bl];
  };
  const h = four(hs, box.w), w = four(vs, box.h);
  const f = Math.min(1, box.w / (h[0] + h[1]) || 1, box.w / (h[3] + h[2]) || 1, box.h / (w[0] + w[3]) || 1, box.h / (w[1] + w[2]) || 1);
  return [...h, ...w].map((x) => x * f);
}

export const KINDS = {
  colour: { compare: (e, a, _, t = {}) => sameColour(e, a, t.colour) },
  // A length, or a list of them: `12px`, or a number the probe read.
  length: { compare: (e, a, _, t = {}) => near(e, a, t.length) },
  // Its own kind because a project that allows a pixel of box rounding on
  // `length` must not thereby allow 13 against 14 (exact by default).
  fontSize: { compare: (e, a, _, t = {}) => near(e, a, t.fontSize) },
  // A stroke's width, for the same reason: a pixel of box rounding allowed
  // on `length` passed a 1px border drawn as no border at all.
  // A border or an outline is "snapped as a border width" before Chrome
  // reports it: under 1px is 1px, past it the fraction is dropped (0.5 → 1,
  // 1.5 → 1, measured in Chrome at DPR 1 and 2). So a design's 0.5px stroke
  // drawn as a 0.5px border reads 1px, and was red on correct code (review
  // 2026-10-02 round 3, S7). A ring drawn as a shadow is not snapped, so the
  // width as written still passes; what this cannot tell apart is a 1px ring
  // written where the design draws 0.5 — the browser reports both the same.
  strokeWidth: { compare: (e, a, as = {}, t = {}) => near(e, a, t.strokeWidth)
    || (BORDER_LIKE.test(as.prop || '') && near(snapBorder(e), a, t.strokeWidth)) },
  /* A ring's width, read with how the probe found it drawn (`-ring-drawn`,
     `-inner-ring-drawn`): an outline is snapped as a border is, a shadow's
     spread is reported as written, so the snapped width is accepted for an
     outline only — a 1px shadow ring where the design draws 1.5 was passing
     as snapped (review 2026-10-02, round 4). */
  ringWidth: ringKind('-ring-width', '-ring-drawn'),
  innerRingWidth: ringKind('-inner-ring-width', '-inner-ring-drawn'),
  // Opacity: exact by default; ±1 on a ratio is no comparison at all.
  ratio: { compare: (e, a, _, t = {}) => near(e, a, t.ratio) },
  // focus rings: the outlines in a ring's colour, which the code may fall short of (a ring drawn as a
  // shadow is not an outline) but never pass; an outline in another colour is a stroke, not a ring
  rings: {
    show: (v) => (Array.isArray(v) ? v.length : v && typeof v === 'object' ? v.count : v),
    compare: (e, a, _, t = {}) => (a || []).filter((c) => e.colours.some((x) => sameColour(x, c, t.colour))).length <= e.count,
  },

  /*
   * A length on a HUG or FILL axis, within the slack the adapter derived: a
   * pixel per whole-pixel text box in series along that axis, because Figma
   * sizes a hugging text box to a whole pixel and a browser does not ("Label"
   * in Inter Medium 14 is 37 in the file and 36.28 in Chrome; adapt.mjs
   * `sizeSlack`). A rule's number, carried on the assertion as `within`,
   * never a project's; none where nothing in series hugs text.
   */
  hugLength: {
    compare: (e, a, asn = {}) => {
      const x = parseFloat(String(e)), y = parseFloat(String(a));
      return Number.isFinite(x) && Number.isFinite(y) && Math.abs(x - y) <= (asn.within ?? 0);
    },
  },

  text: { compare: (e, a) => String(e) === String(a) },

  // A font stack, compared on the family that actually wins: the design names
  // one family, and a fallback stack behind it is correct code.
  family: { compare: (e, a) => e === String(a || '').split(',')[0].trim().replace(/^["']|["']$/g, '') },

  // A box-shadow, layer by layer and in order, whatever either side's
  // spelling: `0px 0px 0px 3px rgb(22 22 22 / 0.116)` against the browser's
  // `rgba(22, 22, 22, 0.116) 0px 0px 0px 3px`.
  shadow: { compare: (e, a) => canonShadow(e) === canonShadow(a) },

  /*
   * A gradient: its direction and its stops in order, `expected` as
   * `{ transform, stops: [{ colour, position }] }` (position in percent along
   * Figma's gradient) or, for an axis-aligned one recorded without its
   * transform, `{ angle, stops }`, against the rendered background-image and
   * the box it fills.
   *
   * Figma's colour at a point (u, v) of the layer's unit square is
   * t = a·u + b·v + c, the first row of the paint's transform. On a w×h box
   * that runs along (a/w, b/h), so the CSS angle is atan2(a/w, −b/h). CSS
   * stretches its gradient line from corner to corner, so a stop at t falls at
   * (t − t₀)/(t₁ − t₀) of it, t₀ and t₁ the least and greatest t at the four
   * corners. A corner keyword (`to right bottom`) is resolved on the box as
   * CSS resolves it: perpendicular to the diagonal through the other two
   * corners. An axis-aligned angle is the same on every box.
   *
   * A stop at alpha 0 on both sides is the same stop whatever its channels:
   * CSS interpolates premultiplied, so a transparent stop has no colour of
   * its own. Positions within `tolerances.gradientStops` percent. A string
   * `expected` is compared as one canonical gradient.
   */
  gradient: {
    reads: ['background-image', 'width', 'height'],
    read: ({ record }) => ({ image: record['background-image'], w: parseFloat(record.width), h: parseFloat(record.height) }),
    show: (v) => {
      if (!v || typeof v !== 'object') return v;
      if (v.image !== undefined) return v.image;
      const head = v.transform ? `transform ${JSON.stringify(v.transform[0])}` : `${v.angle}deg`;
      return `linear-gradient(${head}, ${v.stops.map((st) => `${st.colour} ${st.position}%`).join(', ')})`;
    },
    compare: (e, a, _, t = {}) => {
      const image = a && typeof a === 'object' ? a.image : a;
      if (typeof e === 'string') return canonGradient(e) === canonGradient(image);
      const g = parseGradient(image);
      if (!g || !e || !Array.isArray(e.stops)) return false;
      const w = a && Number.isFinite(a.w) && a.w > 0 ? a.w : null, h = a && Number.isFinite(a.h) && a.h > 0 ? a.h : null;
      const deg = (x) => (((x % 360) + 360) % 360);
      const apart = (x, y) => Math.min(Math.abs(deg(x) - deg(y)), 360 - Math.abs(deg(x) - deg(y)));
      const atan = (y, x) => (Math.atan2(y, x) * 180) / Math.PI;
      const EDGES = { 'to top': 0, 'to right': 90, 'to bottom': 180, 'to left': 270 };
      const CORNERS = { right: 1, left: -1, top: -1, bottom: 1 };
      let have = g.angle;
      if (typeof have === 'string') {
        if (have in EDGES) have = EDGES[have];
        else {
          const words = have.replace(/^to\s+/, '').split(/\s+/);
          const x = words.map((k) => (k === 'right' || k === 'left' ? CORNERS[k] : 0)).find(Boolean);
          const y = words.map((k) => (k === 'top' || k === 'bottom' ? CORNERS[k] : 0)).find(Boolean);
          if (!x || !y || !w || !h) return false;
          have = atan(x * h, -y * w);
        }
      }
      let want, at = (p) => p;
      if (Array.isArray(e.transform)) {
        if (!w || !h) return false;
        const [ta, tb, tc] = e.transform[0];
        want = atan(ta / w, -tb / h);
        const corners = [0, 1].flatMap((u) => [0, 1].map((v) => ta * u + tb * v + tc));
        const t0 = Math.min(...corners), t1 = Math.max(...corners);
        at = (p) => ((p / 100 - t0) / (t1 - t0)) * 100;
      } else want = e.angle;
      if (apart(want, have) > 0.5) return false;
      const stops = stopPositions(g.stops);
      const clear = (x, y) => x && y && x[3] === 0 && y[3] === 0;
      return stops.length === e.stops.length && e.stops.every((st, i) => {
        const wantColour = parseColour(st.colour), got = stops[i].colour;
        return !!wantColour && !!got && (clear(wantColour, got) || sameColour(wantColour, got, t.colour))
          && Math.abs(at(st.position) - stops[i].position) <= (t.gradientStops || 0) + 1e-6;
      });
    },
  },

  /*
   * A corner radius, as CSS draws it: corners that together overrun a side
   * are scaled down until they fit (Backgrounds 3 §5.5), so 999px on a
   * 44-high pill is 22. A percentage resolves per axis — the horizontal
   * radius against the width, the vertical against the height — so `50%` on
   * an 80×44 box is a 40×22 ellipse, not the 22 pill Figma's 999 draws (item
   * 14 of the 2026-10-02 review). Each corner is compared as its two radii,
   * both sides scaled against the box the browser drew, within
   * `tolerances.length`. Reads the box too.
   */
  radius: {
    reads: ['border-radius', 'width', 'height'],
    read: ({ record }) => ({ r: record['border-radius'], w: parseFloat(record.width), h: parseFloat(record.height) }),
    show: (v) => (v && typeof v === 'object' ? `${v.r} on ${v.w}×${v.h}` : v),
    compare: (e, a, _, t = {}) => {
      if (!a || !Number.isFinite(a.w) || !Number.isFinite(a.h)) return near(e, a && a.r, t.length);
      const x = corners(e, a), y = corners(a.r, a);
      return x.every((v, i) => Number.isFinite(v) && Number.isFinite(y[i]) && Math.abs(v - y[i]) <= (t.length || 0));
    },
    // how far a waiver must reach: the largest difference of any one corner's radius, as drawn
    off: (e, a) => {
      if (!a || !Number.isFinite(a.w) || !Number.isFinite(a.h)) return Math.abs(parseFloat(e) - parseFloat(a && a.r));
      const x = corners(e, a), y = corners(a.r, a);
      return Math.max(...x.map((v, i) => Math.abs(v - y[i])));
    },
  },

  /*
   * Where a layer sits against its nearest measured ancestor, in px, from the
   * probe's fixed record (`core`). `chain` lists the mapped ancestors nearest
   * first, each with the offset of the unmapped layers between; the first one
   * measured, and not the same element, is the one judged against, on the
   * axis its layout leaves free. A layer with nothing measured to sit in
   * (that ancestor is its own `nomatch`), or on the axis the ancestor's
   * layout decides, is not judged.
   */
  position: {
    core: true,
    reads: [],
    read: ({ record, measured, assertion }) => {
      const pick = assertion.chain.map((link) => ({ link, p: measured[link.layer] })).find((x) => x.p);
      if (!pick || record.self === pick.p.self) return SKIP;
      const layout = assertion.absolute ? 'NONE' : (pick.link.layout || 'NONE');
      const x = assertion.prop === '-x';
      if (layout === (x ? 'HORIZONTAL' : 'VERTICAL')) return SKIP;
      // where it sits in the design's terms: the unmapped layers' offsets
      // between are the design's, not the code's to reproduce one by one
      return Math.round(x ? record.left - pick.p.left : record.top - pick.p.top) - pick.link.off[x ? 'x' : 'y'];
    },
    compare: (e, a, _, t = {}) => near(e, a, t.position),
  },

  // A turn in degrees, against the computed `rotate` (`none`, `180deg`).
  rotation: {
    compare: (e, a) => {
      const norm = (d) => ((Math.round(d) % 360) + 360) % 360;
      return norm(e) === norm(a === 'none' || a === undefined ? 0 : parseFloat(a));
    },
    // the shorter way round, in degrees: 350 against 10 is 20 apart
    off: (e, a) => {
      const d = Math.abs(parseFloat(e) - (a === 'none' || a === undefined ? 0 : parseFloat(a))) % 360;
      return Math.min(d, 360 - d);
    },
  },

  /*
   * An attribute an instance prop sets, from the probe's fixed record:
   * `{ mode: 'value', want }` its value, `{ mode: 'flag', want: 'set'|'unset' }`
   * present or not, `{ mode: 'off-only', want: 'unset' }` absent. Selected and
   * Checked live on the control, so a checked input in the element sets them;
   * and a link's selected state is ARIA's — `aria-current` (any value but
   * `false`) or `aria-selected="true"` — so a navigation item that marks the
   * page it is on is read as selected (one project's 100 rows read "unset"
   * while every link carried aria-current, 2026-10-03).
   */
  attr: {
    core: true,
    reads: [],
    read: ({ record, assertion }) => {
      const name = assertion.prop.slice('-attr:'.length);
      const attrs = record.attrs || {};
      const aria = name === 'selected' && ((attrs['aria-current'] !== undefined && attrs['aria-current'] !== 'false') || attrs['aria-selected'] === 'true');
      const set = name in attrs || (/^(selected|checked)$/.test(name) && !!attrs.__checked) || aria;
      return assertion.expected.mode === 'value' ? (attrs[name] === undefined ? 'no attribute' : attrs[name]) : set ? 'set' : 'unset';
    },
    show: (v) => (v && typeof v === 'object' ? v.want : v),
    compare: (e, a) => e.want === a,
  },

  // Which glyph an instance swap places: the `data-name` of the library
  // element `tag` (or any of a list: an icon and a graphic are both swaps)
  // the probe's record lists among the children. A swap whose
  // glyph is not drawn at all (the boolean that shows it is off) is not judged.
  swap: {
    core: true,
    reads: [],
    read: ({ record, assertion }) => {
      const icons = (record.children || []).filter((k) => [].concat(assertion.tag).includes(k.tag)).map((k) => k.icon).filter(Boolean);
      // a swap whose glyph the design does not draw (its boolean is off) has
      // nothing to show; one it draws and the page does not is a difference
      return icons.length ? icons.join(' ') : assertion.drawn === false ? SKIP : 'none';
    },
    compare: (e, a) => String(a).split(' ').includes(e),
  },

  /*
   * The library instances a layer holds, outermost and in order, labels
   * where the design names one. An instance a different mapped layer holds
   * is that layer's; one inside another library instance is part of it.
   */
  children: {
    core: true,
    reads: [],
    read: ({ record, measured, doc, assertion }) => {
      const library = new Set(assertion.library);
      const claimed = new Set(Object.entries(measured).flatMap(([o, g]) => (o !== doc.layer && g && g.anc && g.anc.includes(record.self) ? (g.children || []).map((k) => k.idx) : [])));
      return (record.children || []).filter((k) => library.has(k.tag) && !claimed.has(k.idx) && !k.ancestors.some((x) => library.has(x))).map((k) => ({ tag: k.tag, label: k.text }));
    },
    show: (v) => (Array.isArray(v) ? v.map((k) => k.tag + (k.label ? `(${k.label})` : '')).join(' ') || 'none' : v),
    compare: (e, a) => Array.isArray(a) && e.length === a.length && e.every((w, i) => w.tag === a[i].tag && (!w.label || a[i].label === w.label)),
  },

  // `text-align: left` and the initial `start` are one alignment in a
  // left-to-right document.
  textAlign: {
    compare: (e, a) => {
      const same = (v) => ({ left: 'start', right: 'end' }[v] || v);
      return same(e) === same(a);
    },
  },

  // Figma clips or it does not; CSS answers per axis (`hidden auto`), and an
  // element that scrolls its overflow still clips what the design clipped.
  overflow: {
    compare: (e, a) => {
      const clips = (v) => String(v).trim().split(/\s+/).every((x) => x !== 'visible');
      return e === a || (e === 'hidden' && clips(a));
    },
  },

  /*
   * A flex alignment, judged where the children are: the design's axis
   * (`axis`, h or v) read off the children's boxes (the probe's `-place-*`),
   * each child for `align-items` and the run for `justify-content`, so the
   * same placement made another way — auto margins, a row justified where
   * the design has a column aligned — is the same placement. The computed
   * property answers where the boxes cannot (no free space, a baseline).
   * "The default" has several spellings: Figma's MIN is the initial value,
   * and a browser reports an unset one as `normal`.
   */
  alignment: {
    reads: ['-place-h', '-place-v', 'align-items', 'justify-content'],
    read: ({ record, assertion }) => {
      const placed = assertion.axis && assertion.expected !== 'baseline' ? record[`-place-${assertion.axis}`] : null;
      const v = placed && (assertion.prop === 'align-items' ? placed.items : placed.run);
      return v || record[assertion.prop];
    },
    compare: (e, a) => {
      // a text's lines fill its box: no room to align, whatever the design says
      if (a === 'filled') return true;
      const DEFAULTS = new Set(['normal', 'flex-start', 'start', 'stretch']);
      if (DEFAULTS.has(e) && DEFAULTS.has(a)) return true;
      const same = { 'flex-end': 'end', end: 'flex-end' };
      return e === a || same[e] === a || same[a] === e;
    },
  },
};

/*
 * Every prop an assertion can name: a CSS property, or a named question the
 * probe answers (`-stacking`: which way the children run; `-clipped`: text cut
 * by its box; `-ring-width`, `-ring-offset`, `-ring-color`, `-ring-radius`: a ring as drawn,
 * outline or spread shadow; `-inner-ring-width`, `-inner-ring-color`: a ring
 * drawn inside the box, inset shadow or inward outline; `-rings`: the colour
 * of each outline the box and what it holds draw; `-present`: a layer this variant does not draw,
 * rendered anyway; `-stroke`: whether the element draws an edge at all;
 * `-max-lines`, `-truncate`: how text is cut on purpose; `-text`: the words),
 * or a kind reads it off the probe's fixed record (`-x`, `-y`, `-children`,
 * `-attr:<name>` for an attribute an instance prop sets, `-swap:<prop>` for
 * the glyph a swap places). What the probe reads is tools/parity/probe.mjs.
 */
const SIDES = ['top', 'right', 'bottom', 'left'];
export const PROPS = new Set([
  ...SIDES.flatMap((s) => [`padding-${s}`, `border-${s}-width`, `border-${s}-color`]),
  'row-gap', 'column-gap', 'justify-content', 'align-items', 'flex-wrap', 'overflow',
  'width', 'height', 'min-width', 'min-height', 'max-width', 'max-height', 'border-radius',
  'background-color', 'background-image', 'color', 'fill', 'stroke', 'stroke-width', 'opacity', 'box-shadow',
  'font-family', 'font-size', 'font-weight', 'line-height', 'letter-spacing', 'text-align',
  'text-transform', 'font-variant-caps', 'text-decoration-line', 'mix-blend-mode', ...SIDES.map((x) => `border-${x}-style`), 'rotate', 'filter', 'backdrop-filter',
  '-stacking', '-clipped', '-present', '-ring-width', '-ring-offset', '-ring-color', '-ring-radius', '-ring-drawn', '-inner-ring-width', '-inner-ring-color', '-inner-ring-drawn', '-rings', '-stroke',
  '-max-lines', '-truncate', '-text', '-x', '-y', '-children',
]);

/*
 * The props whose assertion is a number — a length, a hugged length, a
 * position, a ratio, a font size, a stroke's width — so a waiver on one must
 * say how far it excuses (`within`): an open waiver on a number absorbed a 3.5px
 * difference and would absorb 30 (waivers.mjs `checkWaiver`).
 */
export const NUMERIC = new Set([
  'width', 'height', 'min-width', 'min-height', 'max-width', 'max-height',
  ...SIDES.flatMap((s) => [`padding-${s}`, `border-${s}-width`]),
  'row-gap', 'column-gap', 'line-height', 'letter-spacing', 'font-size', 'opacity', 'stroke-width',
  '-ring-width', '-ring-offset', '-ring-radius', '-inner-ring-width', '-x', '-y',
  // a radius is bounded by its largest per-corner difference, a turn in
  // degrees (KINDS radius.off, rotation.off): left out until 2 Oct, a waiver
  // on either excused 8px against 999px, or any turn, forever
  'border-radius', 'rotate',
]);

export const isProp = (p) => PROPS.has(p) || /^-attr:[a-z0-9-]+$|^-swap:[a-z0-9-]+$/.test(p);
