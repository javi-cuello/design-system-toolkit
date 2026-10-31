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
 *   - a Light/Dark collection writes Light on :root and Dark under
 *     `[data-theme="dark"]` and under the system preference when nothing is
 *     chosen — both on screen only, because a page printed in the dark tier
 *     prints near-white text on white paper; a Mobile/Tablet/Desktop collection writes Mobile on :root and the
 *     others from the sm/md breakpoint; any other mode is `[data-<collection>="<mode>"]`;
 *   - lengths are rem, so they follow the reader's font size, except the ones
 *     that must not scale: radii, strokes, blur and shadow offsets stay px;
 *   - a text style is its fields (`--heading-lg-font-size`, …), never a `font`
 *     shorthand, which cannot carry letter-spacing;
 *   - a font family gets the system fallback stack.
 */
import { readdirSync, readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const ROOT_PX = 16;
const FALLBACK = 'system-ui, sans-serif';
// Lengths that must not scale with the reader's text size.
const FIXED = /(^|-)(radius|stroke|border|blur|spread|position|offset|shadow|elevation)(-|$)/;
const THEME = new Set(['light', 'dark']);
const RESPONSIVE = { mobile: null, tablet: 'sm', desktop: 'md' };
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
export const nameOf = (path) => path.slice(1).map(kebab).join('-');
const refName = (ref) => nameOf(String(ref).replace(/^\{|\}$/g, '').split('.'));
// A breakpoint is a `Breakpoint/<name>` variable, or any variable in a
// collection named for breakpoints; its Sass name is what follows either.
const bpAt = (path) => (path[1] === 'breakpoint' ? 2 : /(^|-)breakpoints?$/.test(path[0]) ? 1 : 0);
/** A token path's Sass breakpoint name (`$md`, less the `$`), or null. */
export const breakpointName = (path) => (bpAt(path) ? path.slice(bpAt(path)).join('-') : null);

const read = (f) => JSON.parse(readFileSync(f, 'utf8'));

/** Folders of DTCG files: collection → { modes: Map(mode → file) }. */
function discover(dir) {
  const out = new Map();
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (!e.isDirectory()) continue;
    const modes = new Map();
    for (const f of readdirSync(join(dir, e.name)).sort()) if (f.endsWith('.json')) modes.set(f.replace(/\.json$/, ''), join(dir, e.name, f));
    if (modes.size) out.set(e.name, { modes });
  }
  return out;
}

/** Walk a DTCG tree, yielding [path, token]. */
function* tokensOf(node, path = []) {
  for (const [k, v] of Object.entries(node)) {
    if (k.startsWith('$') || !v || typeof v !== 'object') continue;
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
  const FIELD = { fontFamily: ['font-family', 'fontFamily'], fontWeight: ['font-weight', 'fontWeight'], fontSize: ['font-size', 'dimension'], lineHeight: ['line-height', 'number'], letterSpacing: ['letter-spacing', 'dimension'], paragraphSpacing: ['paragraph-spacing', 'dimension'], listSpacing: ['list-spacing', 'dimension'] };
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
          n[k] = group;
        }
        return n;
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
  const isBreakpoint = (path) => bpAt(path) > 0;

  // Axes: multi-mode collections sharing a mode set move together.
  const single = [], axes = new Map();
  for (const [slug, c] of collections) {
    if (c.modes.size === 1) { single.push([...c.modes.values()][0]); continue; }
    const modes = [...c.modes.keys()];
    const key = [...modes].sort().join('|');
    if (!axes.has(key)) axes.set(key, { modes, members: [] });
    axes.get(key).members.push(slug);
  }
  const kindOf = (modes) => {
    const m = modes.map((x) => x.toLowerCase());
    if (m.every((x) => THEME.has(x))) return 'theme';
    if (m.every((x) => x in RESPONSIVE)) return 'responsive';
    return 'other';
  };
  const baseMode = (axis) => {
    const k = kindOf(axis.modes);
    const want = k === 'theme' ? 'light' : k === 'responsive' ? 'mobile' : null;
    return axis.modes.find((m) => m.toLowerCase() === want) || axis.modes[0];
  };
  const baseFiles = [...single, ...[...axes.values()].flatMap((a) => a.members.map((s) => collections.get(s).modes.get(baseMode(a))))];

  // Breakpoints, read straight from the files: they are Sass, not properties.
  const breakpoints = {};
  for (const f of baseFiles) for (const [path, t] of tokensOf(read(f))) if (isBreakpoint(path)) breakpoints[breakpointName(path)] = px(t.$value);

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
    const sd = new SD({ source: sources, preprocessors: ['house/strip-descriptions', 'house/expand-typography'], log: { verbosity: 'silent', warnings: 'disabled' }, platforms: platform(file, selector, filter) });
    await sd.buildAllPlatforms();
    // A mode holding nothing CSS can carry (a collection of booleans) writes
    // no file, and gets no block.
    return existsSync(join(tmp, file)) ? readFileSync(join(tmp, file), 'utf8').trim() : '';
  };

  const notBreakpoint = (t) => !isBreakpoint(t.path);
  const parts = [`/* ${banner} */`, '', await block(baseFiles, 'base.css', ':root', notBreakpoint)];

  for (const axis of axes.values()) {
    const kind = kindOf(axis.modes), base = baseMode(axis);
    for (const mode of axis.modes.filter((m) => m !== base)) {
      const own = axis.members.map((s) => collections.get(s).modes.get(mode));
      const sources = [...baseFiles.filter((f) => !axis.members.some((s) => collections.get(s).modes.get(base) === f)), ...own];
      const mine = (t) => notBreakpoint(t) && own.includes(t.filePath);
      const m = mode.toLowerCase();
      if (kind === 'theme') {
        const body = await block(sources, `${m}.css`, `[data-theme="${m}"]`, mine);
        if (!body) continue;
        parts.push('', '@media screen {', indent(body), '}');
        parts.push('', `@media screen and (prefers-color-scheme: ${m}) {`, indent(body.replace(`[data-theme="${m}"]`, `:root:not([data-theme="${base.toLowerCase()}"])`)), '}');
      } else if (kind === 'responsive') {
        const at = RESPONSIVE[m], bp = breakpoints[at];
        if (bp === undefined) throw new Error(`${axis.members.join(', ')}: mode ${mode} needs Breakpoint/${at}, and no collection defines it`);
        const body = await block(sources, `${m}.css`, ':root', mine);
        if (body) parts.push('', `@media (min-width: ${rem(bp)}) {`, indent(body), '}');
      } else {
        const body = await block(sources, `${m}.css`, `[data-${axis.members[0]}="${m}"]`, mine);
        if (body) parts.push('', body);
      }
    }
  }
  rmSync(tmp, { recursive: true, force: true });
  const css = parts.join('\n') + '\n';

  // Two paths that land on one property would let one silently win.
  for (const b of css.split(/\n(?=[^\s])/)) {
    const names = [...b.matchAll(/^\s*(--[a-z0-9-]+):/gm)].map((x) => x[1]);
    const dup = names.find((n, i) => names.indexOf(n) !== i);
    if (dup) throw new Error(`two tokens become ${dup} in one block: rename one in Figma`);
  }

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
