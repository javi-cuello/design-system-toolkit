// @runs: tools/tokens/build.mjs, which each project's token build and check call.
/*
 * build-tokens — DTCG token files → the stylesheets every project imports.
 *
 * The one token build: every project runs this, through Style Dictionary, and
 * nothing about a project changes what it writes (code-standard rules 51–55).
 * Style Dictionary is passed in by the caller, so this file carries no
 * dependency of its own and one copy serves every repo:
 *
 *   import StyleDictionary from 'style-dictionary';
 *   import { buildTokens } from '<toolkit>/tools/tokens/build-tokens.mjs';
 *   await buildTokens(StyleDictionary, { tokens: '<dtcg dir>', out: '<dir>' });
 *
 * It writes three files:
 *   _tokens.scss       every custom property: the base on :root, then the other
 *                      modes of each collection as their standard selector
 *   _breakpoints.scss  $sm … $xl in rem and @mixin from($bp) — a media query
 *                      cannot read var(), so breakpoints are Sass, never properties
 *   _text-styles.scss  @mixin text-style($name), applying one style's fields
 *
 * The conventions, each decided once:
 *   - a property is named by its Figma variable path, kebab-case, with no
 *     prefix and without the collection: `Colour/Text/strong` is
 *     `--colour-text-strong`; two paths that land on one name fail the build;
 *   - references are kept (`outputReferences`): a semantic token is
 *     `var(--palette-grey-12)`, so a mode switch re-points one tier;
 *   - an axis writes its collection's default mode in Figma on :root (the
 *     resolver's default, never the first file by name); a Light/Dark one writes the other under
 *     `[data-theme="<it>"]` and under the system preference when nothing is
 *     chosen — both on screen only, because a page printed in the dark tier
 *     prints near-white text on white paper; a Mobile/Tablet/Desktop collection writes Mobile on :root and the
 *     others from the sm/md breakpoint; any other mode is `[data-<collection>="<mode>"]`;
 *   - every mode, the base too, is also an attribute (`modeSelector`), so a layer
 *     set to a mode in Figma (a component's small variant at its Mobile type) is
 *     that mode in code wherever it sits: its block re-declares the axis's tokens
 *     and every single-mode token aliasing them, since a custom property's
 *     var() is resolved where it is declared, before it is inherited
 *     (css-variables-1 §2), and an alias left on :root would keep the page's mode;
 *   - lengths are rem, so they follow the reader's font size, except the ones
 *     that must not scale: radii, strokes, blur and shadow offsets stay px;
 *   - a text style is its fields (`--heading-lg-font-size`, …), never a `font`
 *     shorthand, which cannot carry letter-spacing;
 *   - a font family gets the system fallback stack.
 */
import { readdirSync, readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';

const MODES = createRequire(import.meta.url)('./modes.cjs');

const ROOT_PX = 16;
const FALLBACK = 'system-ui, sans-serif';
// Lengths that must not scale with the reader's text size.
const FIXED = /(^|-)(radius|stroke|border|blur|spread|position|offset|shadow|elevation)(-|$)/;
const { RESPONSIVE } = MODES;
const CORNER = { 45: 'to top right', 135: 'to bottom right', 225: 'to bottom left', 315: 'to top left' };
/** The CSS angle a Figma gradient angle becomes. Diagonals are corner
 *  keywords: Figma's angle lives in the node's unit square and stretches with
 *  the frame, which the keywords do and degrees do not. Exported because the
 *  docs site drew the same gradients from the same snapshot with plain
 *  degrees, so its preview swatch and the CSS this build ships were drawn at
 *  different angles at 45, 135, 225 and 315, with nothing to show they
 *  differed. */
export const gradientAngle = (angle) => CORNER[angle] || `${angle}deg`;

const kebab = (s) => String(s).replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
/** The house name: the path without its collection (or style-group) segment. */
// (a group's own token, `$root`, is named as the group: color.text.warning.$root is --color-text-warning; ROOT_SD is
// the segment Style Dictionary is handed for it, house/root-segment)
const ROOT_SD = '@root';
// (a name kept with its collection, `KEPT`: one variable name two collections hold at different values, each a token
// of its own, named with its collection's slug as a prefix, code-standard rule 52; set by buildTokens for its build)
let KEPT = new Set();
const restOf = (path) => path.slice(1).filter((x) => x !== '$root' && x !== ROOT_SD).join('.');
/** A token path's house name where `kept` (sharedNames' keys) names the paths written with their collection: one name
 *  for the build and every reader (names.mjs cssName). */
export const nameIn = (path, kept) => (kept && kept.has(`${path[0]}\0${restOf(path)}`) ? path : path.slice(1)).filter((x) => x !== '$root' && x !== ROOT_SD).map(kebab).join('-');
export const nameOf = (path) => nameIn(path, KEPT);
// the style groups the export writes beside the collections (dtcg.js: text, colour and effect styles' roots): a style
// meeting a variable's name is no collection's name met twice
const STYLE_ROOTS = new Set(['text-style', 'color-style', 'effect-style']);
/* One variable name in several collections: { kept, dropped }, keys `<collection>\0<path>`. Where every collection
   holds it at the same values (the set of its modes' values, compared as written), it is one token, written once, from
   the first collection: the others are dropped. Where they differ, each is its own token, and each is kept with its
   collection, so only those names move (code-standard rule 52). */
export function sharedNames(collections) {
  const by = new Map();
  for (const [col, c] of collections) {
    if (STYLE_ROOTS.has(col)) continue;
    for (const f of c.modes.values()) for (const [path, t] of tokensOf(read(f))) {
      const rest = restOf([col, ...path.slice(1)]);
      if (!by.has(rest)) by.set(rest, new Map());
      const cols = by.get(rest);
      if (!cols.has(col)) cols.set(col, new Set());
      cols.get(col).add(JSON.stringify(t.$value));
    }
  }
  const kept = new Set(), dropped = new Set();
  for (const [rest, cols] of by) {
    if (cols.size < 2) continue;
    const sets = [...cols.values()].map((v) => [...v].sort().join('\n'));
    const [first, ...others] = [...cols.keys()];
    if (sets.every((x) => x === sets[0])) for (const col of others) dropped.add(`${col}\0${rest}`);
    else for (const col of [first, ...others]) kept.add(`${col}\0${rest}`);
  }
  return { kept, dropped };
}
const refName = (ref) => nameOf(String(ref).replace(/^\{|\}$/g, '').split('.'));
// A breakpoint is named for one, a `Breakpoint/<name>` variable or any variable
// in a collection named for breakpoints; its Sass name is what follows either.
const bpAt = (path) => (path[1] === 'breakpoint' ? 2 : /(^|-)breakpoints?$/.test(path[0]) ? 1 : 0);
/** A token path's Sass breakpoint name (`$md`, less the `$`), or null: by the name alone. */
export const breakpointName = (path) => (bpAt(path) ? path.slice(bpAt(path)).filter((x) => x !== '$root' && x !== ROOT_SD).join('-') : null);
/** A token's Sass breakpoint name, or null, from its path and its value in each of its collection's modes. The name
 *  alone is not enough: a breakpoint is one width a media query reads at build time, so it is a literal length and
 *  the same in every mode (a query reads neither a mode nor a var(); knowledge/code/tokens.md, "a mode carries no
 *  breakpoint width"). A collection named for breakpoints that has modes is a responsive axis, its tokens values per
 *  viewport (a padding, a font size), and they are custom properties like any other: taken as breakpoints by the
 *  name, they were written as `NaNrem` from an alias, or as a width from a font weight, and the properties they
 *  should have been were never written. An alias is not followed: a breakpoint aliasing another token is written as
 *  a property. */
export const breakpointOf = (path, values) => {
  const name = breakpointName(path);
  if (!name || !values.length || (bpAt(path) === 1 && values.length > 1)) return null;
  const at = values.map(px);
  return at.every((n) => Number.isFinite(n) && n === at[0]) ? name : null;
};

const read = (f) => JSON.parse(readFileSync(f, 'utf8'));

const RESOLVER = 'tokens.resolver.json';
const VENDOR = 'com.figma.variables';
/** Each modifier's default in the export's resolver: [{ mode, folders }], the folders its contexts' files sit in
 *  (one per collection that moves on it). None where there is no resolver. */
function defaultsOf(dir) {
  const file = join(dir, RESOLVER);
  if (!existsSync(file)) return [];
  return Object.values(read(file).modifiers || {}).filter((m) => m && typeof m.default === 'string').map((m) => ({
    mode: m.default,
    // the modes in Figma's order, as the export lists them
    order: Object.keys(m.contexts || {}),
    // recorded from Figma's defaultModeId (dtcg.js marks it); an older export's default is only Figma's first mode
    recorded: !!(m.$extensions && m.$extensions[VENDOR] && m.$extensions[VENDOR].defaultMode),
    folders: new Set(Object.values(m.contexts || {}).flat().map((r) => String(r && r.$ref).split('/')[0])),
  }));
}

/** Folders of DTCG files: collection → { modes: Map(mode → file) }. */
export function discover(dir) {
  const out = new Map();
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (!e.isDirectory()) continue;
    const modes = new Map();
    for (const f of readdirSync(join(dir, e.name)).sort()) if (f.endsWith('.json')) modes.set(f.replace(/\.json$/, ''), join(dir, e.name, f));
    if (modes.size) out.set(e.name, { modes });
  }
  return out;
}

/* A DTCG folder's single-mode files and its axes (modes.cjs, the one owner of how modes are named in code). */
function axesOf(collections) {
  // (an axis names its members and modes by the export's slugs, and they are looked up here by folder and file name:
  // a folder the export did not write would find nothing)
  for (const [name, c] of collections) for (const n of [name, ...c.modes.keys()]) if (MODES.slug(n) !== n) throw new Error(`${name}/${n}: not a name the DTCG export writes (${MODES.slug(n)}); export the tokens again`);
  const single = [...collections].filter(([, c]) => c.modes.size === 1).map(([, c]) => [...c.modes.values()][0]);
  return { single, axes: MODES.axesOf([...collections].map(([name, c]) => ({ name, modes: [...c.modes.keys()] }))) };
}

/** The selector a mode of a collection is written under, by the names Figma gives them ("5. Responsive type",
 *  "Mobile" → `[data-5-responsive-type="mobile"]`); null where the collection has one mode or no such mode. */
export function modeSelector(tokens, collection, mode) {
  const m = MODES.modeOf(axesOf(discover(tokens)).axes, collection, mode);
  return m ? `[${MODES.attribute(m.key)}="${m.value}"]` : null;
}

/** Walk a DTCG tree, yielding [path, token]. */
function* tokensOf(node, path = []) {
  for (const [k, v] of Object.entries(node)) {
    if ((k.startsWith('$') && k !== '$root') || !v || typeof v !== 'object') continue;
    if (v.$value !== undefined) yield [[...path, k], v];
    else yield* tokensOf(v, [...path, k]);
  }
}

// A length in px from any shape it arrives in: a DTCG dimension, a number, or
// a string already transformed ("0.0625rem" is 1px, never 0.0625).
const COMPOSITE = new Set(['shadow', 'gradient']);
const px = (v) => (typeof v === 'object' && v !== null ? (v.unit === 'rem' ? v.value * ROOT_PX : v.value)
  : typeof v === 'string' && /rem\s*$/.test(v) ? parseFloat(v) * ROOT_PX : parseFloat(v));
const rem = (n) => `${+(n / ROOT_PX).toFixed(4)}rem`;

// a typography token's DTCG fields, by the name each is written under and its type
export const FIELD = { fontFamily: ['font-family', 'fontFamily'], fontWeight: ['font-weight', 'fontWeight'], fontSize: ['font-size', 'dimension'], lineHeight: ['line-height', 'number'], letterSpacing: ['letter-spacing', 'dimension'], paragraphSpacing: ['paragraph-spacing', 'dimension'], listSpacing: ['list-spacing', 'dimension'] };

function register(SD) {
  SD.registerTransform({
    name: 'name/house', type: 'name',
    transform: (t) => nameOf(t.path),
  });
  SD.registerTransform({
    name: 'size/house', type: 'value', transitive: true,
    filter: (t) => (t.$type ?? t.type) === 'dimension',
    transform: (t) => {
      const v = t.$value ?? t.value;
      const n = px(v);
      if (!Number.isFinite(n)) return v;
      return FIXED.test(nameOf(t.path)) ? `${+n.toFixed(4)}px` : rem(n);
    },
  });
  SD.registerTransform({
    name: 'fontFamily/house', type: 'value', transitive: true,
    filter: (t) => (t.$type ?? t.type) === 'fontFamily',
    transform: (t) => {
      const v = String(t.$value ?? t.value).replace(/^['"]|['"]$/g, '');
      return /,/.test(v) ? v : `"${v}", ${FALLBACK}`;
    },
  });
  /* A gradient keeps its stops as references where Figma bound them, so a
     theme that re-points the palette re-points the gradient too. Diagonals
     are corner keywords: Figma's angle lives in the node's unit square and
     stretches with the frame, which the keywords do and degrees do not. */
  SD.registerTransform({
    name: 'gradient/house', type: 'value', transitive: true,
    filter: (t) => (t.$type ?? t.type) === 'gradient',
    transform: (t) => {
      const ext = Object.values(t.$extensions || {}).find((e) => e && e.angle !== undefined);
      const angle = ext ? ext.angle : 180;
      const original = (t.original && (t.original.$value ?? t.original.value)) || [];
      const resolved = t.$value ?? t.value;
      const stops = resolved.map((s, i) => {
        const o = original[i] && original[i].color;
        const colour = typeof o === 'string' && o.startsWith('{') ? `var(--${refName(o)})` : cssColour(s.color);
        return `${colour} ${+(s.position * 100).toFixed(1)}%`;
      });
      return `linear-gradient(${gradientAngle(angle)}, ${stops.join(', ')})`;
    },
  });
  // Hex when opaque, rgb() with alpha when not: what a person reads and a
  // design tool shows, not Style Dictionary's percentage channels.
  SD.registerTransform({
    name: 'color/house', type: 'value', transitive: true,
    filter: (t) => (t.$type ?? t.type) === 'color',
    transform: (t) => cssColour(t.$value ?? t.value),
  });
  SD.registerTransform({
    name: 'shadow/house', type: 'value', transitive: true,
    filter: (t) => (t.$type ?? t.type) === 'shadow',
    transform: (t) => shadowCss(t.$value ?? t.value, t.original && (t.original.$value ?? t.original.value)),
  });
  /* A text style becomes its fields BEFORE references resolve, so a field
     bound to a variable stays `var(--that-variable)`. Style Dictionary's own
     `expand` runs after resolution: a style bound to a Mobile/Desktop size
     came out as a fixed rem and stopped following the breakpoint. */
  SD.registerPreprocessor({
    name: 'house/expand-typography',
    preprocessor: (dict) => {
      const walk = (n) => {
        for (const [k, v] of Object.entries(n)) {
          if (k.startsWith('$') || !v || typeof v !== 'object') continue;
          if (v.$value === undefined) { walk(v); continue; }
          if ((v.$type) !== 'typography' || typeof v.$value !== 'object') continue;
          const group = {};
          for (const [field, val] of Object.entries(v.$value)) {
            const [name, type] = FIELD[field] || [field, undefined];
            group[name] = { $value: val, ...(type && { $type: type }) };
          }
          // paragraph and list spacing are no DTCG typography members, so the
          // export keeps them in its $extensions (from-snapshot.mjs); after the
          // five, in this order, as the stylesheet has always listed them. Read
          // from whichever vendor key the export was given, as the gradient
          // angle is, so an export under another key loses nothing here
          const ext = Object.assign({}, ...Object.values(v.$extensions || {}).filter((e) => e && typeof e === 'object'));
          for (const field of ['paragraphSpacing', 'listSpacing']) {
            if (ext[field] === undefined) continue;
            const [name, type] = FIELD[field];
            group[name] = { $value: ext[field], $type: type };
          }
          // tracking that is a share of a size bound by mode is written in
          // em, so it follows the size the breakpoint picks (dtcg.js)
          if (ext.letterSpacingEm !== undefined) group['letter-spacing'] = { $value: `${ext.letterSpacingEm}em` };
          n[k] = group;
        }
        return n;
      };
      return walk(dict);
    },
  });
  // Style Dictionary 5.5.3 resolves `{a.b.$root}` but cannot write it as var(): outputReferences builds its match
  // from the path unescaped (createPropertyFormatter.js:233), so `$` reads as an end anchor and the raw reference
  // is printed. It is handed `@root` instead, a segment no exported name has (slugs are [a-z0-9-]), named as the
  // group all the same (nameOf).
  SD.registerPreprocessor({
    name: 'house/root-segment',
    preprocessor: (dict) => {
      const walk = (n) => {
        if (typeof n === 'string') return n.replace(/\.\$root(?=[.}])/g, `.${ROOT_SD}`);
        if (Array.isArray(n)) return n.map(walk);
        if (!n || typeof n !== 'object') return n;
        return Object.fromEntries(Object.entries(n).map(([k, v]) => [k === '$root' ? ROOT_SD : k, walk(v)]));
      };
      return walk(dict);
    },
  });
  SD.registerPreprocessor({
    name: 'house/strip-descriptions',
    preprocessor: (dict) => {
      const walk = (n) => { for (const [k, v] of Object.entries(n)) { if (k.startsWith('$') || !v || typeof v !== 'object') continue; if (v.$value !== undefined) delete v.$description; else walk(v); } return n; };
      return walk(dict);
    },
  });
}

/** One text style applied whole, as the declarations the `text-style` mixin writes: what a generated stylesheet
    writes where it cannot call the mixin (to-code's plain CSS). Fields a style does not set fall back to the
    platform default rather than to nothing. */
export const textStyleFields = (name) => [
  ['font-family', `var(--${name}-font-family)`],
  ['font-weight', `var(--${name}-font-weight, 400)`],
  ['font-size', `var(--${name}-font-size)`],
  ['line-height', `var(--${name}-line-height, normal)`],
  ['letter-spacing', `var(--${name}-letter-spacing, normal)`],
];

/** A DTCG shadow value (one layer or several) as a CSS `box-shadow`. Exported
    so a reader showing a shadow (the docs site) draws the one this writes. */
export function shadowCss(v, original) {
  // A member the source wrote as a reference is written as that variable,
  // by position, the way gradient stops are. Style Dictionary's own reference
  // pass finds a resolved value in the string and swaps in a name, so two
  // members holding 0px could each get the other's variable.
  const orig = original ? (Array.isArray(original) ? original : [original]) : [];
  const ref = (o) => (typeof o === 'string' && o.startsWith('{') ? `var(--${refName(o)})` : null);
  const one = (l, i) => {
    const o = orig[i] || {};
    return [l.inset ? 'inset' : null, ...['offsetX', 'offsetY', 'blur', 'spread'].map((k) => ref(o[k]) || `${+px(l[k] ?? 0).toFixed(4)}px`), ref(o.color) || cssColour(l.color)].filter(Boolean).join(' ');
  };
  return (Array.isArray(v) ? v : [v]).map(one).join(', ');
}

function cssColour(c) {
  if (typeof c === 'string') return c;
  if (!c || !c.components) return String(c);
  const [r, g, b] = (c.components || [0, 0, 0]).map((v) => Math.round(v * 255));
  const a = c.alpha === undefined ? 1 : c.alpha;
  return a < 1 ? `rgb(${r} ${g} ${b} / ${+a.toFixed(4)})` : (c.hex || `rgb(${r} ${g} ${b})`);
}

const TRANSFORMS = (SD) => [
  ...SD.hooks.transformGroups.css.filter((n) => !['name/kebab', 'size/rem', 'fontFamily/css', 'color/css', 'shadow/css/shorthand'].includes(n)),
  'name/house', 'size/house', 'fontFamily/house', 'color/house', 'shadow/house', 'gradient/house',
];

/**
 * Build `out/_tokens.scss`, `_breakpoints.scss`, `_text-styles.scss` from a
 * folder of DTCG files. Returns the file map; writes unless `write: false`.
 */
export async function buildTokens(SD, { tokens, out, write = true, banner = 'Generated from the Figma snapshot by the toolkit token build. Do not edit: change Figma, snapshot, and this regenerates.' }) {
  register(SD);
  const collections = discover(tokens);
  const shared = sharedNames(collections);
  KEPT = shared.kept;
  try { return await build(SD, collections, shared.dropped, { tokens, out, write, banner }); } finally { KEPT = new Set(); }
}

async function build(SD, collections, dropped, { tokens, out, write, banner }) {
  const { single, axes } = axesOf(collections);
  // An axis's base (:root) is its collection's default mode in Figma, which the export's resolver records as the
  // modifier's default (dtcg.js buildResolver). The files are read in name order, so their first is no base: one
  // library's :root was an accent theme, not Light. The default is trusted only where the export marks it recorded
  // from Figma; otherwise the build falls back and says so, naming the collections.
  const defaults = defaultsOf(tokens), based = new Map();
  const baseMode = (axis) => {
    if (based.has(axis)) return based.get(axis);
    // (a responsive axis is mobile first whatever Figma's default: its other modes switch at min-width queries)
    if (axis.kind === 'responsive' && axis.modes.includes('mobile')) return 'mobile';
    const d = defaults.find((x) => axis.members.every((s) => x.folders.has(s)) && axis.modes.includes(x.mode));
    let mode = d && d.recorded ? d.mode : null;
    if (!mode) {
      // an older export: a theme keeps Light; any other axis Figma's first mode, in the resolver's order; with no
      // resolver, Figma's order is unknown and the first by name is all there is
      const light = axis.kind === 'theme' && axis.modes.find((m) => m.toLowerCase() === 'light');
      mode = light || (d && d.order.find((m) => axis.modes.includes(m))) || axis.modes[0];
      const why = d ? `${RESOLVER} names Figma's first mode, not its recorded default` : `no ${RESOLVER} for it, so the order by name`;
      console.warn(`tokens: ${axis.members.join(', ')}: no default mode recorded (${why}); ${mode} taken as the base. Snapshot the file again and export the tokens`);
    }
    based.set(axis, mode);
    return mode;
  };
  const baseFiles = [...single, ...axes.flatMap((a) => a.members.map((s) => collections.get(s).modes.get(baseMode(a))))];

  // Breakpoints, read straight from the files: they are Sass, not properties. A token is one by its name and its
  // value in every mode of its collection (breakpointOf); a token named for one that is not stays a property.
  const breakpoints = {}, bpPaths = new Set();
  for (const [, c] of collections) {
    // one value per mode of the collection, a mode that lacks the token holding undefined (no length)
    const values = new Map(), files = [...c.modes.values()];
    files.forEach((f, i) => { for (const [path, t] of tokensOf(read(f))) if (bpAt(path)) { const k = path.join('.'); if (!values.has(k)) values.set(k, Array(files.length).fill(undefined)); values.get(k)[i] = t.$value; } });
    for (const [k, vs] of values) {
      const name = breakpointOf(k.split('.'), vs);
      if (name) { breakpoints[name] = px(vs[0]); bpPaths.add(k); }
    }
  }
  // (a `Breakpoint` token beside `Breakpoint/md` names no breakpoint: a Sass name of nothing is not written)
  // (a Style Dictionary path, asFile below, first called once it is defined)
  const isBreakpoint = (path) => bpPaths.has(asFile(path.join('.')));

  const tmp = mkdtempSync(join(tmpdir(), 'tokens-'));
  const platform = (file, selector, filter) => ({
    css: {
      transforms: TRANSFORMS(SD), buildPath: `${tmp}/`,
      // Composites write their own references, member by member (shadowCss,
      // the gradient transform); Style Dictionary's pass would re-place them.
      files: [{ destination: file, format: 'css/variables', filter, options: { outputReferences: (t) => !COMPOSITE.has(t.$type ?? t.type), selector, showFileHeader: false } }],
    },
  });
  const block = async (sources, file, selector, filter) => {
    const sd = new SD({ source: sources, preprocessors: ['house/root-segment', 'house/strip-descriptions', 'house/expand-typography'], log: { verbosity: 'silent', warnings: 'disabled' }, platforms: platform(file, selector, filter) });
    await sd.buildAllPlatforms();
    // A mode holding nothing CSS can carry (a collection of booleans) writes
    // no file, and gets no block.
    return existsSync(join(tmp, file)) ? readFileSync(join(tmp, file), 'utf8').trim() : '';
  };

  // (a name another collection already writes at the same values is written once: the copy is not)
  const notBreakpoint = (t) => !isBreakpoint(t.path) && !dropped.has(`${t.path[0]}\0${restOf(t.path)}`);
  // every reference a value makes (`{type.body.size}` → 'type.body.size'), and, per axis, the single-mode tokens a
  // chain of them leads to its tokens from: re-declared beside the axis's own wherever a mode is set on an element
  const refsIn = (v) => [...JSON.stringify(v ?? '').matchAll(/\{([^{}]+)\}/g)].map((x) => x[1]);
  const graph = new Map();
  for (const f of single) for (const [path, t] of tokensOf(read(f))) {
    graph.set(path.join('.'), refsIn(t.$value));
    // a text style is written as its fields, each a token another may alias (`{text-style.body.font-size}`)
    if (t.$type === 'typography' && t.$value && typeof t.$value === 'object') for (const [field, v] of Object.entries(t.$value)) graph.set([...path, (FIELD[field] || [field])[0]].join('.'), refsIn(v));
  }
  const reached = (axis) => {
    const hit = new Set(axis.members.flatMap((s) => [...tokensOf(read(collections.get(s).modes.get(baseMode(axis))))].map(([path]) => path.join('.'))));
    for (let grew = true; grew;) { grew = false; for (const [k, rs] of graph) if (!hit.has(k) && rs.some((r) => hit.has(r))) { hit.add(k); grew = true; } }
    // a token of another axis aliasing this one would need both axes' modes at once to be re-declared: not written,
    // and said, so an element set to this mode is not silently left with it at the page's
    for (const other of axes) if (other !== axis) for (const s of other.members) for (const [path, t] of tokensOf(read(collections.get(s).modes.get(baseMode(other))))) if (refsIn(t.$value).some((r) => hit.has(r))) console.warn(`tokens: ${path.join('.')} aliases ${axis.key} across two mode axes; an element set to a ${axis.key} mode keeps it at the page's`);
    return hit;
  };
  // (a token's collection is its path's first segment: a typography token the build expands into its fields has no
  // file of its own)
  // (Style Dictionary's paths say `@root` where the files say `$root`, house/root-segment)
  const asFile = (p) => p.replace(new RegExp(`(^|\\.)${ROOT_SD}(?=\\.|$)`, 'g'), '$1$$root');
  const singleSlugs = new Set([...collections].filter(([, c]) => c.modes.size === 1).map(([k]) => k));
  const withAliases = (axis, hit) => (t) => notBreakpoint(t) && (axis.members.includes(t.path[0]) || (singleSlugs.has(t.path[0]) && (hit.has(asFile(t.path.join('.'))) || refsIn(t.original && (t.original.$value ?? t.original.value)).some((r) => hit.has(asFile(r))))));
  const parts = [`/* ${banner} */`, '', await block(baseFiles, 'base.css', ':root', notBreakpoint)];

  // the page's own switches first (the system's dark preference, a breakpoint), then every mode as its attribute,
  // last, so an element set to one wins over what it would inherit (an attribute on :root over a media query's :root)
  const scoped = [];
  for (const axis of axes) {
    const kind = axis.kind, base = baseMode(axis), hit = reached(axis), attr = MODES.attribute(axis.key);
    for (const mode of axis.modes) {
      const own = axis.members.map((s) => collections.get(s).modes.get(mode));
      const sources = [...baseFiles.filter((f) => !axis.members.some((s) => collections.get(s).modes.get(base) === f)), ...own];
      const m = mode.toLowerCase();
      const body = await block(sources, `${m}.css`, `[${attr}="${m}"]`, withAliases(axis, hit));
      if (!body) continue;
      // (a theme on screen only: a page printed in the dark tier prints near-white text on white paper)
      scoped.push(kind === 'theme' ? ['', '@media screen {', indent(body), '}'] : ['', body]);
      if (mode === base) continue;
      if (kind === 'theme') parts.push('', `@media screen and (prefers-color-scheme: ${m}) {`, indent(body.replace(`[data-theme="${m}"]`, `:root:not([data-theme="${base.toLowerCase()}"])`)), '}');
      else if (kind === 'responsive') {
        const at = RESPONSIVE[m], bp = breakpoints[at];
        if (bp === undefined) throw new Error(`${axis.members.join(', ')}: mode ${mode} needs Breakpoint/${at}, and no collection defines it`);
        parts.push('', `@media (min-width: ${rem(bp)}) {`, indent(body.replace(`[${attr}="${m}"]`, ':root')), '}');
      }
    }
  }
  for (const s of scoped) parts.push(...s);
  rmSync(tmp, { recursive: true, force: true });
  const css = parts.join('\n') + '\n';

  // Two paths that land on one property would let one silently win (code-standard rule 52): refused, every such
  // property listed (`collisions`, in the order written), so the caller names the Figma names that meet in one line
  const collisions = [];
  for (const b of css.split(/\n(?=[^\s])/)) {
    const names = [...b.matchAll(/^\s*(--[a-z0-9-]+):/gm)].map((x) => x[1]);
    for (const dup of names.filter((n, i) => names.indexOf(n) !== i)) if (!collisions.includes(dup)) collisions.push(dup);
  }
  if (collisions.length) throw Object.assign(new Error(`two tokens become ${collisions[0]} in one block: rename one in Figma${collisions.length > 1 ? ` (${collisions.length - 1} more)` : ''}`), { refused: true, collisions });

  const bpNames = Object.keys(breakpoints);
  const bpScss = [
    `// ${banner}`,
    '// Sass, not custom properties: a media query cannot read var(). rem, so a',
    "// query still holds when the reader has scaled their text up.",
    ...bpNames.map((k) => `$${k}: ${rem(breakpoints[k])};`),
    '',
    '// Mobile first: min-width only, so the base holds the smallest case.',
    '@mixin from($bp) {', '  @media (min-width: $bp) {', '    @content;', '  }', '}', '',
  ].join('\n');

  const textStyles = [...new Set([...css.matchAll(/--([a-z0-9-]+)-font-family:/g)].map((x) => x[1]))].sort();
  const tsScss = [
    `// ${banner}`,
    '// One text style, applied whole. Fields a style does not set fall back to',
    '// the platform default rather than to nothing.',
    '@mixin text-style($name) {',
    ...textStyleFields('#{$name}').map(([prop, value]) => `  ${prop}: ${value};`),
    '}',
    '',
    `// ${textStyles.length} styles: ${textStyles.join(', ')}`,
    '',
  ].join('\n');

  const files = new Map([['_tokens.scss', css], ['_breakpoints.scss', bpScss], ['_text-styles.scss', tsScss]]);
  if (write) {
    mkdirSync(out, { recursive: true });
    for (const [f, body] of files) writeFileSync(join(out, f), body);
  }
  return files;
}

const indent = (s) => s.split('\n').map((l) => (l ? `  ${l}` : l)).join('\n');
