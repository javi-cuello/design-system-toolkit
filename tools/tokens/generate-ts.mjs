#!/usr/bin/env node
/* Generates TypeScript modules from a folder of DTCG token files.
 *
 *   node generate-ts.mjs <tokens-dir> [out-dir]     (default out: <tokens-dir>/dist/ts)
 *
 * Input layout is one folder per collection, one file per mode — see discover.mjs.
 *
 * One module per collection, mirroring the export and nothing else. Every name,
 * mode and group is discovered from the files present — this script knows no
 * collection names, no mode names and no brands.
 *
 * Modes live INSIDE a module (`{ light, dark }`), which is the opposite of the
 * JSON layer where the mode is the file name. Both are right for the same
 * reason: JSON has no way to express a mode and TypeScript does.
 *
 * Aliases are emitted as expressions into the module that owns the target, not
 * as resolved values. That is what keeps the tier alive in TypeScript: change a
 * primitive and everything under it changes, exactly as `outputReferences` does
 * for CSS. It is also why a wrong path shows up as `undefined` at import time
 * rather than as a plausible wrong colour — see verify-ts.mjs.
 *
 * Node's standard library only; no install step.
 */
import fs from 'fs';
import path from 'path';
import { discover, camel } from './discover.mjs';

const [, , TOKENS_DIR, OUT_ARG] = process.argv;
if (!TOKENS_DIR) {
  console.error('usage: generate-ts.mjs <tokens-dir> [out-dir]');
  process.exit(2);
}
const DIR = path.resolve(TOKENS_DIR);
// Generated output lives under dist/ beside every other generated artefact:
// TypeScript is a build product exactly as CSS is, and the convention that has
// settled in shipping token repos is source at the root, everything generated in
// dist/ (gitignored, published). Style Dictionary prescribes nothing here and
// DTCG says nothing about directories at all — this is convention, not a rule.
const OUT = path.resolve(OUT_ARG ?? path.join(DIR, 'dist', 'ts'));
const load = f => JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8'));

/* ---- discovery ---- */
const collections = discover(DIR);
if (!collections.size) { console.error(`no collection folders in ${DIR}`); process.exit(1); }

/* ---- naming ---- */
const key = k => (/^[A-Za-z_$][\w$]*$/.test(k) ? k : `'${k}'`);
const access = k => (/^[A-Za-z_$][\w$]*$/.test(k) ? `.${k}` : `['${k}']`);
const raw = expr => ({ __raw: expr });
const moduleName = slug => camel(slug);

/* ---- values ---- */
const hex2 = n => Math.round(Math.max(0, Math.min(1, n)) * 255).toString(16).padStart(2, '0');
function colorLiteral(v) {
  if (typeof v === 'string') return v;                 // legacy hex-string exports
  const a = v.alpha === undefined ? 1 : v.alpha;
  if (a >= 1) return v.hex ?? `#${v.components.map(hex2).join('')}`;
  const [r, g, b] = v.components.map(c => Math.round(c * 255));
  return `rgba(${r}, ${g}, ${b}, ${+a.toFixed(4)})`;
}

/* ---- serialisation ---- */
function serialise(node, indent = 2) {
  const pad = ' '.repeat(indent);
  if (node && node.__raw) return node.__raw;
  if (Array.isArray(node)) return `[${node.map(n => serialise(n, indent)).join(', ')}]`;
  if (node !== null && typeof node === 'object') {
    const body = Object.entries(node)
      .map(([k, v]) => `${pad}${key(k)}: ${serialise(v, indent + 2)},`)
      .join('\n');
    return `{\n${body}\n${' '.repeat(indent - 2)}}`;
  }
  return typeof node === 'string' ? `'${node.replace(/'/g, "\\'")}'` : String(node);
}

const header = name => `/**
 * ${name}
 *
 * GENERATED from the DTCG token files. Do not edit — change the variable in the
 * design tool, re-export, and regenerate, or the next run reverts you.
 */
`;

/* ---- a reference becomes an expression into whichever module owns it ---- */
// Three cases, and the third is the one that only appears once this is general.
// A file's own mode indexes the target only when the target HAS that mode. A
// collection whose modes are brands referencing a collection whose modes are
// themes shares no mode name at all, so the reference expands over the target's
// modes instead — the brand token becomes { light, dark } rather than pointing
// at a mode that does not exist. Indexing blindly by the current mode compiles
// and throws at import time, which is how this was found.
function refExpr(target, mode) {
  const [slug, ...rest] = target.split('.');
  const collection = collections.get(slug);
  if (!collection) throw new Error(`reference into an unknown collection: ${target}`);
  const tail = rest.map(seg => access(camel(seg))).join('');
  const name = moduleName(slug);
  if (collection.single) return raw(`${name}${tail}`);
  if (collection.modes.has(mode)) return raw(`${name}.${camel(mode)}${tail}`);
  const over = {};
  for (const targetMode of collection.modes.keys())
    over[camel(targetMode)] = raw(`${name}.${camel(targetMode)}${tail}`);
  return over;
}

/* ---- walk one DTCG document ---- */
function tree(doc, slug, mode) {
  const root = doc[slug] === undefined ? doc : doc[slug];
  /* One recursive value walker, because a composite can be an array. A layered
   * shadow's $value is an array of shadow objects, and the earlier version
   * excluded arrays from the composite branch and fell through to returning the
   * raw value — so every reference inside a multi-layer shadow was emitted as the
   * literal string "{semantic.colour.shadow.medium}". It compiled, it read as a
   * token, and a consumer got brace text where a colour belonged. */
  const value = (v, type) => {
    if (typeof v === 'string' && v.startsWith('{')) return refExpr(v.slice(1, -1), mode);
    if (Array.isArray(v)) return v.map(item => value(item, type));
    if (v && typeof v === 'object') {
      if (v.unit !== undefined) return v.value;                    // dimension
      if (type === 'color' || v.colorSpace !== undefined) return colorLiteral(v);
      const composite = {};
      for (const [k, sub] of Object.entries(v)) composite[k] = value(sub, undefined);
      return composite;
    }
    return v;
  };
  const leaf = token => value(token.$value, token.$type);
  const walk = node => {
    const out = {};
    for (const [k, v] of Object.entries(node)) {
      if (k.startsWith('$') || !v || typeof v !== 'object') continue;
      out[camel(k)] = v.$value === undefined ? walk(v) : leaf(v);
    }
    return out;
  };
  return walk(root);
}

/* ---- build every module ---- */
// Imports are discovered from the document's own reference strings rather than
// from the built tree, because by then a reference is an opaque expression.
const modules = new Map();
for (const [slug, { modes, single }] of collections) {
  const imports = new Set();
  const built = {};
  for (const [mode, file] of modes) {
    const doc = load(file);
    for (const m of JSON.stringify(doc).matchAll(/"\{([^}]+)\}"/g)) imports.add(m[1].split('.')[0]);
    built[camel(mode)] = tree(doc, slug, mode);
  }
  imports.delete(slug);
  modules.set(slug, { value: single ? built[camel([...modes.keys()][0])] : built, imports });
}

/* ---- write ---- */
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
for (const [slug, { value, imports }] of modules) {
  const importLines = [...imports].sort()
    .map(dep => `import { ${moduleName(dep)} } from './${dep}';`).join('\n');
  const name = moduleName(slug);
  fs.writeFileSync(path.join(OUT, `${slug}.ts`),
    `${header(slug)}${importLines ? importLines + '\n\n' : ''}export const ${name} = ${serialise(value)} as const;

export type ${name[0].toUpperCase()}${name.slice(1)} = typeof ${name};
`);
}
fs.writeFileSync(path.join(OUT, 'index.ts'),
  `${header('Generated token modules, one per collection')}${[...modules.keys()].sort()
    .map(slug => `export * from './${slug}';`).join('\n')}\n`);

console.log(`${modules.size} modules → ${path.relative(process.cwd(), OUT)}`);
for (const [slug, { modes, single }] of collections)
  console.log(`  ${slug}${single ? '' : `  { ${[...modes.keys()].join(', ')} }`}`);
