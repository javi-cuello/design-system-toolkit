/*
 * tools/parity/waivers.mjs — gate 6, the waiver policy, part of the design-to-code parity
 * engine (README.md here; the method is skills/design-code-parity).
 *
 * How a waiver excuses a difference, and when it has gone stale (§6).
 *
 * Each project's differ compares its own documents in its own way; the
 * policy for the excuse is this one, so a waiver means the same thing on
 * every project. Two projects wrote it separately and each had half: one
 * bounded a waiver by the size of the difference it excuses, the other
 * failed a waiver whose difference had gone and checked a claim that two
 * layers are one element.
 *
 * A waiver is an object (a string is read as its reason, and refused by
 * `checkWaiver` for want of an owner):
 *   { reason, fix: 'figma' | 'code', within?, sameAs? }   a difference someone will close
 *   { reason, content: true, within? }                     live data the frame cannot state
 *   { reason, decision: true, within? }                    a ruled translation nobody will change
 *   { reason, decision: 'unset' }                          on a number: the page sets nothing, ruled so
 * `within` is required on a number (schema.mjs NUMERIC) and refused elsewhere.
 * One owner a waiver: `fix`, `content` and `decision` exclude each other.
 *
 * `decision: 'unset'` excuses exactly a page that sets nothing — the prop
 * reads 0 or a keyword (`none`, `normal`, `auto`) — and nothing else. It
 * exists because the gate forced that ruling to be written as a bound equal
 * to the whole expected value (`Main.min-height { decision, within: 1117 }`
 * on some fifty screens, 171 of 207 such rows on two projects), which also
 * passed any number from 0 to 2234 the page might start to set.
 */
import { isProp, NUMERIC } from './schema.mjs';

export const FIELDS = new Set(['reason', 'within', 'sameAs', 'content', 'decision', 'fix']);
/* The numbers a page leaves at 0 or a keyword when it sets nothing: what a
   `decision: 'unset'` may rule on. A size or a position at 0 is a box drawn
   empty or in place, which is a difference to bound, not a property unset. */
export const UNSETTABLE = /^(padding-(top|right|bottom|left)|(min|max)-(width|height)|(row|column)-gap|line-height|letter-spacing)$/;
export const OWNERS = ['figma', 'code'];

/** A waiver key's layer and prop: `[Variant :: ]Layer.prop`, or a bare layer (an app waiver for a layer the product may not draw). */
export function keyParts(key) {
  const s = key.includes(' :: ') ? key.slice(key.indexOf(' :: ') + 4) : key;
  for (let i = s.lastIndexOf('.'); i > 0; i = s.lastIndexOf('.', i - 1)) if (isProp(s.slice(i + 1))) return { layer: s.slice(0, i), prop: s.slice(i + 1) };
  return { layer: s, prop: null };
}

/*
 * What is wrong with one declared waiver's shape, one line each (gate 6, at
 * load). Written after a review found `fix` and `accepted` declared and read by
 * nothing, 41 and 6 open waivers on one project and the other citing a pixel
 * figure in prose — "3.5px narrower" — that nothing held them to, so the 3.5
 * could become 30 in green. A number is bounded by the size it excuses; every
 * waiver says who closes it, or that it is live data or a ruling; a field the
 * engine does not read is refused rather than trusted.
 */
export function checkWaiver(key, waiver) {
  const out = [];
  const w = typeof waiver === 'string' ? { reason: waiver } : waiver;
  if (!w || typeof w !== 'object' || Array.isArray(w)) return [`${key}: a waiver is { reason, fix | content | decision, within? }`];
  for (const f of Object.keys(w)) if (!FIELDS.has(f)) out.push(`${key}: "${f}" is not a waiver field (${[...FIELDS].join(', ')}) — nothing reads it`);
  if (typeof w.reason !== 'string' || !w.reason.trim()) out.push(`${key}: no reason`);
  if (w.content !== undefined && w.content !== true) out.push(`${key}: content is true or absent`);
  if (w.decision !== undefined && w.decision !== true && w.decision !== 'unset') out.push(`${key}: decision is true, 'unset' or absent`);
  if (w.fix !== undefined && !OWNERS.includes(w.fix)) out.push(`${key}: fix is ${OWNERS.map((o) => `'${o}'`).join(' or ')}, not ${JSON.stringify(w.fix)}`);
  const owners = ['fix', 'content', 'decision'].filter((f) => w[f] !== undefined);
  if (!owners.length) out.push(`${key}: no owner — fix: 'figma' or 'code' says who closes it; content or decision says nobody will`);
  // a ruling nobody will change cannot also be a fix someone will make, or live data
  if (owners.length > 1) out.push(`${key}: one owner — ${owners.join(' and ')} say different things about who closes it`);
  const { prop } = keyParts(key);
  const numeric = prop && NUMERIC.has(prop);
  if (w.decision === 'unset') {
    // a bare layer (an app waiver, often globbed) spreads onto every prop it
    // measures, and every non-number read as "nothing set" (round 3, S9)
    if (!prop) out.push(`${key}: decision 'unset' rules one property, so the key names it (Layer.prop)`);
    else if (!UNSETTABLE.test(prop)) out.push(`${key}: decision 'unset' rules a property the page leaves at its initial 0 or keyword (padding, a gap, min- and max- sizes, line-height, letter-spacing), and ${prop} is not one`);
    if (w.within !== undefined) out.push(`${key}: decision 'unset' excuses exactly 0 or a keyword, so it takes no within`);
  } else if (numeric && w.within === undefined) {
    out.push(w.decision
      ? `${key}: a decision on a number excuses a keyword only — say decision: 'unset' when the page sets nothing (0 or a keyword), or bound it (within)`
      : `${key}: ${prop} is a number, so the waiver says how far it excuses (within)`);
  }
  if (w.within !== undefined && !(typeof w.within === 'number' && Number.isFinite(w.within) && w.within >= 0)) out.push(`${key}: within is a finite number of the prop's own unit, at least 0`);
  // a key naming a whole layer (an app waiver, often globbed) covers its numbers too
  else if (w.within !== undefined && prop && !numeric) out.push(`${key}: within bounds a number, and ${prop} is not one`);
  if (w.sameAs !== undefined && typeof w.sameAs !== 'string') out.push(`${key}: sameAs names a layer`);
  return out;
}

/** A key with `*` in it as a regular expression: `*` spans anything, the rest is literal. */
export const glob = (key) => new RegExp('^' + key.split('*').map((x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.*') + '$');

/*
 * The running product's waivers (a mapping's `appWaivers`) as the differ
 * reads them: a key with `*` is expanded onto every layer, and every
 * `layer.prop`, of this render that it matches, each keeping the key it was
 * declared under for staleness. A bare layer covers that layer (its absence:
 * a board with nobody on it draws no cards) and, through the differ, its
 * props. `docs` is the adapter's output for one render.
 */
export function appWaivers(declared, docs) {
  const out = {};
  for (const [k, why] of Object.entries(declared || {})) {
    if (!k.includes('*')) { out[k] = { ...asWaiver(why), key: k }; continue; }
    const re = glob(k);
    for (const d of docs) {
      if (re.test(d.layer)) out[d.layer] = { ...asWaiver(why), key: k };
      for (const a of d.assertions) if (re.test(`${d.layer}.${a.prop}`)) out[`${d.layer}.${a.prop}`] = { ...asWaiver(why), key: k };
    }
  }
  return out;
}

/*
 * The largest difference each declared waiver excused on one target, kept in
 * `excused` (`Map(target → Map(key → { off, within }))`) for `looseBounds`
 * and the accepted run. `declaredAt(key)` is the waiver as the target (or
 * the variant) declares it, undefined for an app waiver, which is bounded by
 * what the data can be and not by today's.
 */
export function recordExcused(excused, target, rows, declaredAt) {
  for (const r of rows) {
    if (r.kind !== 'waived' || !r.waiver || r.off === undefined) continue;
    const w = asWaiver(declaredAt(r.waiver));
    if (!w) continue;
    if (!excused.has(target)) excused.set(target, new Map());
    const at = excused.get(target);
    if (!at.has(r.waiver) || at.get(r.waiver).off < r.off) at.set(r.waiver, { off: r.off, within: w.within });
  }
  return excused;
}

/** A declared waiver in one shape, or null. */
export const asWaiver = (w) => (w == null ? null : typeof w === 'string' ? { reason: w } : w);

/**
 * Does this waiver excuse this difference? `sameElement` is the project's
 * answer to "do this layer and `sameAs` resolve to one element", when the
 * waiver makes that claim.
 *
 * `within`: a waiver written for two pixels of stroke on a group's height
 * silently absorbed a twenty-two pixel bug, a label still rendering after it
 * was told to hide, and the run stayed green. A waiver that says `within: 2`
 * is a fact about the difference and fails the moment it becomes another.
 *
 * @returns {{ excused: true } | { excused: false, why: string }}
 */
export function excuses(waiver, { expected, actual, sameElement, numeric = false, off: given } = {}) {
  const w = asWaiver(waiver);
  if (!w) return { excused: false, why: 'no waiver' };
  if (w.sameAs && sameElement === false) return { excused: false, why: `waiver claims one element with "${w.sameAs}" but the selectors differ` };
  // a kind whose value is not one number (a radius's corners, a turn) says its own distance
  const off = given !== undefined ? given : Math.abs(parseFloat(expected) - parseFloat(actual));
  if (w.decision === 'unset') {
    /* Exactly 0 or a keyword a number reads when nothing is set, on a
       number: a colour, a shadow or `nowrap` parsed to NaN and passed as
       "unset" when a bare-layer app waiver spread onto them (round 3, S9). */
    if (!numeric) return { excused: false, why: "decision 'unset' rules a number, and this is not one" };
    const raw = typeof actual === 'object' && actual ? actual.r : actual;
    const set = parseFloat(raw);
    return set === 0 || (!Number.isFinite(set) && /^(none|normal|auto)$/.test(String(raw).trim())) ? { excused: true } : { excused: false, why: `ruled unset, and the page sets ${typeof actual === 'string' ? actual : JSON.stringify(actual)}` };
  }
  /* A number measured as a keyword (`normal`, `none`, `auto`) has no distance
     to bound: only a ruling excuses it — a ::placeholder that has no line box
     of its own, a cap the code does not need. Bounded or not, a number
     measured as a number is excused only within its bound. */
  if (numeric && !Number.isFinite(off)) return w.decision ? { excused: true } : { excused: false, why: `measured ${actual}, a keyword, which only a decision excuses` };
  if (numeric && w.within === undefined) return { excused: false, why: 'a waiver on a number says how far it excuses (within)' };
  // `within` bounds a number where there is one (a whole-layer key covers
  // colours too), to the hundredth a browser reports
  if (w.within !== undefined && Number.isFinite(off) && off > w.within + 1e-6) return { excused: false, why: `waived only within ${w.within}, off by ${+off.toFixed(4)}` };
  return { excused: true };
}

/**
 * Declared waivers no difference used: stale, and a stale waiver fails,
 * because an excuse for a difference that has gone reads as a pass and is
 * how excuses pile up. Exempt: a `content` waiver against live data (`live`,
 * the running product's appWaivers: the day the data happens to match the
 * frame is not the day its excuse died), and a `content` or `decision`
 * waiver that bounds nothing, which records why a layer is not an element of
 * its own and has no difference to match. A bound (`within`) or an `'unset'`
 * ruling is a fact about a difference on pinned content: if no row uses it,
 * it describes nothing (round 3 of the 2026-10-02 review, S14: 59 and 48
 * such bounds and 16 'unset' rulings sat unused, never stale).
 */
const exempt = (x, live) => x && (x.content || x.decision) && (live || (x.within === undefined && x.decision !== 'unset'));
export function stale(declared, used, live = false) {
  return Object.entries(declared || {})
    .filter(([key, w]) => !used.has(key) && !exempt(asWaiver(w), live))
    .map(([key]) => key);
}

/**
 * Stale across every target that declares a waiver: `results` is
 * `[{ name, declared, used, live? }]`, one per component, screen or job. One waiver
 * is often declared by several targets — a screen inherits its base's, a
 * shell spread into every frame — so it is stale only when no target that
 * declares that same waiver (key and value) used it. Judged per target, an
 * inherited waiver read as stale on every frame but the one that showed its
 * difference: a per-frame count once flagged 533 where 109 were real.
 * Returns `[{ key, names }]`.
 */
export function staleAcross(results) {
  const id = (k, w) => `${k}\0${JSON.stringify(w)}`;
  const usedAnywhere = new Set();
  for (const r of results) for (const k of Object.keys(r.declared || {})) if (r.used.has(k)) usedAnywhere.add(id(k, r.declared[k]));
  const out = new Map();
  for (const r of results) {
    const used = new Set(Object.keys(r.declared || {}).filter((k) => usedAnywhere.has(id(k, r.declared[k]))));
    for (const k of stale(r.declared, used, r.live)) {
      const i = id(k, r.declared[k]);
      if (!out.has(i)) out.set(i, { key: k, names: [] });
      if (!out.get(i).names.includes(r.name)) out.get(i).names.push(r.name);
    }
  }
  return [...out.values()];
}

/*
 * Bounds wider than what they excused on the target that declares them. A
 * waiver shared through a screens file's `base` or a spread mapping was
 * bounded by the largest of its sharers, so on the rest it passed what it was
 * never measured against: `Main.padding-bottom { within: 320 }` held 76 on
 * seventeen screens, and a 700px regression of a 662px page passed under 1390
 * (the 2026-10-02 review's second round, R2). `excused` is
 * `Map(target → Map(key → { off, within }))`, the largest difference each
 * waiver excused there; a bound may exceed it by a unit of rounding (a pixel,
 * a degree; a hundredth of an opacity). Returns `[{ name, key, within, off, excess }]`.
 */
export function looseBounds(excused) {
  const out = [];
  for (const [name, at] of excused) for (const [key, { off, within }] of at) {
    if (within === undefined || !Number.isFinite(off)) continue;
    const excess = within - off;
    if (excess > (/\.opacity$/.test(key) ? 0.01 : 1)) out.push({ name, key, within, off, excess: +excess.toFixed(2) });
  }
  return out;
}
