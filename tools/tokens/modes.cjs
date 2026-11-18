/*
 * How a variable collection's modes are named in code, owned once: the token
 * build writes each mode under this attribute, and every reader that sets or
 * reads a mode on an element (derive, to-figma, to-markup, from-code) names it
 * here, so a layer Figma sets to "5. Responsive type: Mobile" and the element
 * code writes as `data-5-responsive-type="mobile"` are one fact.
 *
 * Multi-mode collections sharing a mode set are one axis and move together (a
 * theme's primitives and semantics), written under one attribute: `theme` for
 * Light/Dark, else the first member collection's own name, members in name
 * order. A collection or mode is taken by its Figma name or by the slug the
 * DTCG export gives it (dtcg.js `pathFor`), which are the same once slugged.
 */
const DTCG = require('./dtcg.js');

const slug = (name) => DTCG.pathFor(String(name), '')[0];
const THEME = new Set(['light', 'dark']);
// a responsive mode's base is Mobile; the others switch at a breakpoint
const RESPONSIVE = { mobile: null, tablet: 'sm', desktop: 'md' };

/** 'theme', 'responsive' or 'other', by a mode set's names. */
function kindOf(modes) {
  const m = modes.map((x) => slug(x));
  if (m.every((x) => THEME.has(x))) return 'theme';
  if (m.every((x) => x in RESPONSIVE)) return 'responsive';
  return 'other';
}

/**
 * The axes of a set of collections: [{ key, kind, modes, members }], modes and
 * members as slugs, members in name order. `collections` is [{ name, modes }]
 * by Figma names or slugs; a collection of one mode is no axis.
 */
function axesOf(collections) {
  const bySet = new Map();
  for (const c of [...collections].sort((a, b) => slug(a.name).localeCompare(slug(b.name)))) {
    if (c.modes.length < 2) continue;
    const modes = c.modes.map(slug);
    const set = [...modes].sort().join('|');
    if (!bySet.has(set)) bySet.set(set, { modes, members: [] });
    bySet.get(set).members.push(slug(c.name));
  }
  return [...bySet.values()].map((a) => {
    const kind = kindOf(a.modes);
    return { ...a, kind, key: kind === 'theme' ? 'theme' : a.members[0] };
  });
}

/** A collection's mode as code names it: { key, value } (`5-responsive-type`, `mobile`), or null where the
 *  collection is no axis or has no such mode. */
function modeOf(axes, collection, mode) {
  const c = slug(collection), m = slug(mode);
  const axis = axes.find((a) => a.members.includes(c));
  return axis && axis.modes.includes(m) ? { key: axis.key, value: m } : null;
}

/** The attribute a mode is written under: `data-<key>`. */
const attribute = (key) => `data-${key}`;

/** The axes of a snapshot's tokens file (`collections: { name: { modes } }`). */
const axesOfTokens = (tokens) => axesOf(Object.entries((tokens && tokens.collections) || {}).map(([name, c]) => ({ name, modes: c.modes || [] })));

module.exports = { slug, THEME, RESPONSIVE, kindOf, axesOf, axesOfTokens, modeOf, attribute };
