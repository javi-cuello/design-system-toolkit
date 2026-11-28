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
  // (each member's slug as the build gives it, dtcg.js collectionSlugs; and its Figma name, which a layer's modes say)
  const S = DTCG.collectionSlugs(collections);
  for (const c of [...collections].sort((a, b) => S[a.name].localeCompare(S[b.name]))) {
    if (c.modes.length < 2) continue;
    const modes = c.modes.map(slug);
    const set = [...modes].sort().join('|');
    if (!bySet.has(set)) bySet.set(set, { modes, members: [], names: [] });
    bySet.get(set).members.push(S[c.name]);
    bySet.get(set).names.push(c.name);
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
  const axis = axes.find((a) => (a.names || []).includes(collection)) || axes.find((a) => a.members.includes(c));
  return axis && axis.modes.includes(m) ? { key: axis.key, value: m } : null;
}

/** A layer's modes ({ collection: mode }, by Figma names) as code names them ({ key: value }); a collection no
 *  axis holds (a tokens file that lacks it) keyed under its own slug, so it is still said, not dropped. */
function keyed(axes, modes) {
  const out = {};
  for (const [c, m] of Object.entries(modes || {})) { const k = modeOf(axes, c, m) || { key: slug(c), value: slug(m) }; out[k.key] = k.value; }
  return out;
}

/** The attribute a mode is written under: `data-<key>`. */
const attribute = (key) => `data-${key}`;

/** A layer's modes ({ key: value }) as the attributes they are written under. */
const attributesOf = (modes) => Object.fromEntries(Object.entries(modes || {}).map(([k, v]) => [attribute(k), v]));

/** Whether two layers' modes are the same, in any order; none and empty alike. */
const sameModes = (a, b) => JSON.stringify(Object.entries(a || {}).sort()) === JSON.stringify(Object.entries(b || {}).sort());

/** The axes of a snapshot's tokens file (`collections: { name: { modes } }`). */
const axesOfTokens = (tokens) => axesOf(Object.entries((tokens && tokens.collections) || {}).map(([name, c]) => ({ name, modes: c.modes || [], ...(c.remote && { remote: true }) })));

/** The custom properties the token build declares under each mode's attribute, from its stylesheet:
 *  { key: { value: [[name, value]] } }, for a sheet that sets a mode where no attribute can (a pointer state: to-code
 *  re-declares them under its pseudo-class). Only a rule whose selector is that attribute alone, at any nesting (a
 *  theme's under `@media screen`); declarations one per `;`, as the build writes them. */
function blocksOf(css) {
  const out = {}, text = String(css || '').replace(/\/\*[\s\S]*?\*\//g, '');
  for (const m of text.matchAll(/(?:^|(?<=[{};]))\s*\[data-([a-z0-9-]+)="([^"]*)"\]\s*\{([^{}]*)\}/g)) {
    const decls = [...m[3].matchAll(/(--[\w-]+)\s*:\s*([^;]+?)\s*(?:;|$)/g)].map((d) => [d[1], d[2]]);
    if (decls.length) ((out[m[1]] ||= {})[m[2]] ||= []).push(...decls);
  }
  return out;
}

module.exports = { slug, THEME, RESPONSIVE, kindOf, axesOf, axesOfTokens, modeOf, keyed, attribute, attributesOf, sameModes, blocksOf };
