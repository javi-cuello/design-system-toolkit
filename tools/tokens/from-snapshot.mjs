#!/usr/bin/env node
/*
 * A stored snapshot's tokens file → DTCG token files, with no Figma open.
 *
 *   node tools/tokens/from-snapshot.mjs <tokens.json | downloaded snapshot.json> <out-dir>
 *
 * Writes the collection folders and manifest, then the TypeScript modules
 * (generate-ts, into <out-dir>/dist/ts) and checks them (verify-ts). This is
 * the export's one refresh: a live refresh server was retired in 2.5.0 because
 * it read the library a second time, beside the snapshot every other output
 * reads.
 *
 * The snapshot plugin already read the file; reading it again through the
 * bridge to export tokens was a second reader of the same variables. This
 * converts what the snapshot holds into the shape dtcg.js takes and writes the
 * same files, manifest included, that the live export writes. dtcg.js is not
 * changed: it stays the one converter, and its tests stay the gate.
 *
 * What the snapshot records differently, and how each is recovered:
 *  - values arrive resolved, with each alias's first hop by name only; the
 *    collection an alias points into is found by looking the name up, so a
 *    semantic token stays a reference to its primitive;
 *  - colours arrive as CSS strings (`#161616`, `rgb(22 22 22 / 0.116)`) and are
 *    parsed back into channels;
 *  - text styles and shadow layers carry their bindings as `bound` (plugin
 *    0.24.0 and 0.25.0); a snapshot older than that is refused.
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync, existsSync, realpathSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const require = createRequire(import.meta.url);
const HERE = dirname(fileURLToPath(import.meta.url));
const DTCG = require('./dtcg.js');

/** `#rrggbb`, `#rrggbbaa`, `rgb(r g b / a)`, `rgba(r, g, b, a)` → Figma's
 *  `{r,g,b,a}` in 0–1. Named for its OUTPUT: `design-code-parity`'s
 *  `parseColour` reads the same spellings and returns `[r,g,b,a]` with r in
 *  0–255, and the two sat under one name until the shared-jobs check pointed
 *  at the toolkit itself and found three. A skill may not call another
 *  skill's scripts, so `figma-doc-generator` carries its own copy of this by
 *  design; what was wrong was the name, not the second copy. */
export function figmaRgba(s) {
  const str = String(s).trim();
  let m = str.match(/^#([0-9a-f]{6})([0-9a-f]{2})?$/i);
  if (m) {
    const n = parseInt(m[1], 16);
    return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255, a: m[2] ? parseInt(m[2], 16) / 255 : 1 };
  }
  m = str.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:\s*[/,]\s*([\d.]+%?))?\s*\)$/i);
  if (m) {
    const a = m[4] === undefined ? 1 : m[4].endsWith('%') ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
    return { r: +m[1] / 255, g: +m[2] / 255, b: +m[3] / 255, a };
  }
  return null;
}
const isColour = (v) => typeof v === 'string' && figmaRgba(v) !== null;

/** The snapshot's tokens → the shape dtcg.js's buildFiles takes. */
export function toDtcgSnapshot(t) {
  const collections = Object.entries(t.collections || {});
  // Which collection defines a name, for aliases (recorded by name only).
  // A name can live in two collections (a semantic `Colour/Primary` over a
  // primitive of the same name); an alias never points at itself, so prefer a
  // collection other than the aliasing variable's own.
  const homes = new Map();
  for (const [cname, c] of collections) {
    for (const mode of c.modes) for (const name of Object.keys((c.values || {})[mode] || {})) {
      if (!homes.has(name)) homes.set(name, []);
      if (!homes.get(name).includes(cname)) homes.get(name).push(cname);
    }
  }
  const homeOf = (alias, from, name) => {
    const list = homes.get(alias) || [];
    return list.find((c) => c !== from) || (alias !== name ? list[0] : undefined);
  };
  const typeOf = (v) => (isColour(v) ? 'COLOR' : typeof v === 'number' ? 'FLOAT' : typeof v === 'boolean' ? 'BOOLEAN' : 'STRING');

  const out = collections.map(([cname, c]) => {
    const names = [...new Set(c.modes.flatMap((m) => Object.keys((c.values || {})[m] || {})))];
    return {
      name: cname,
      modes: c.modes,
      variables: names.map((name) => {
        const values = {};
        let type = null;
        for (const mode of c.modes) {
          const raw = ((c.values || {})[mode] || {})[name];
          if (raw === undefined) continue;
          type = type || typeOf(raw);
          const alias = ((c.alias || {})[mode] || {})[name];
          const at = alias && homeOf(alias, cname, name);
          if (at) values[mode] = { alias: { collection: at, name: alias } };
          else values[mode] = isColour(raw) ? figmaRgba(raw) : raw;
        }
        return { name, type, hidden: (c.hidden || []).includes(name), description: (c.descriptions || {})[name] || '', values };
      }),
    };
  });

  // A text style's bindings, as the snapshot records them (plugin 0.24.0 on).
  // A snapshot from before that is refused, not guessed at: the naming
  // convention it once relied on, `<style>/size`, missed every binding that
  // did not follow it, and exported them as literals without a word.
  const old = (t.textStyles || []).filter((s) => !s.bound).map((s) => s.name);
  if (old.length) throw new Error(`the snapshot predates plugin 0.24.0 (${old.length} text styles without their bindings, e.g. ${old[0]}): take a new snapshot`);
  // A binding to a variable this snapshot does not hold (another library's)
  // cannot become a reference the build resolves: the literal value stands.
  const own = (b) => (b && homes.has(b.name) ? { collection: homes.get(b.name).includes(b.collection) ? b.collection : homes.get(b.name)[0], name: b.name } : null);
  const boundOf = (s) => ({ fontFamily: own(s.bound.fontFamily), fontSize: own(s.bound.fontSize), fontWeight: own(s.bound.fontWeight) });
  const textStyles = (t.textStyles || []).map((s) => ({
    name: s.name,
    description: s.description || '',
    fontFamily: s.family,
    fontWeight: s.weight,
    fontSize: s.size,
    lineHeight: { unit: 'PERCENT', value: +(s.lineHeight * 100).toFixed(4) },
    // Always, zero included: a stylesheet reading `var(--…-letter-spacing)`
    // where nothing defines it drops the whole declaration.
    letterSpacing: { unit: 'PERCENT', value: +((s.letterSpacing || 0) * 100).toFixed(4) },
    bound: boundOf(s),
  }));

  const effectStyles = (t.effects || []).map((e) => ({
    name: e.name,
    description: e.description || '',
    effects: (e.layers || []).map((l) => ({
      type: l.type, visible: true, color: figmaRgba(l.color) || { r: 0, g: 0, b: 0, a: 1 },
      offset: { x: l.x, y: l.y }, radius: l.blur, spread: l.spread || 0,
      // The snapshot's names for the layer's fields; DTCG's shadowLayer reads
      // Figma's (offsetX, offsetY, radius). A foreign variable keeps the literal.
      bound: Object.fromEntries([['color', 'color'], ['x', 'offsetX'], ['y', 'offsetY'], ['blur', 'radius'], ['spread', 'spread']]
        .map(([from, to]) => [to, own((l.bound || {})[from])]).filter(([, b]) => b)),
    })),
  }));

  // A stop or solid names a variable when it holds a path, a colour otherwise.
  const paintColour = (c) => (isColour(c) ? { color: figmaRgba(c) } : { color: { r: 0, g: 0, b: 0, a: 1 }, bound: { color: homes.has(c) ? { collection: homes.get(c)[0], name: c } : null } });
  const paintStyles = (t.paintStyles || []).map((s) => ({
    name: s.name,
    description: s.description || '',
    paints: (s.paints || []).map((p) => (p.type === 'SOLID'
      ? { type: 'SOLID', visible: true, ...paintColour(p.color) }
      : p.type === 'GRADIENT_LINEAR'
        ? { type: 'GRADIENT_LINEAR', visible: true, angle: p.angle, stops: p.stops.map((st) => ({ position: st.position, ...paintColour(st.color) })) }
        : { type: p.type, visible: true })),
  }));

  return { collections: out, textStyles, effectStyles, paintStyles };
}

/** Write DTCG files for a snapshot tokens file into `dir`, replacing what is there. */
export function writeDtcg(tokens, dir, opts = {}) {
  const snap = toDtcgSnapshot(tokens);
  const built = DTCG.buildFiles(snap, { colorFormat: 'object', unit: 'px', rootSize: 16, ...opts });
  /* Paragraph and list spacing belong to a text style and DTCG's typography
     type has no member for them. They ride on the typography value as two
     extra members, the same trade the shadow export makes for `inset`: a
     strict validator flags them, and dropping them loses the design silently.
     Always written, zero included, for the same reason as letter-spacing. */
  const bySlug = new Map((tokens.textStyles || []).map((s) => [s.name.split('/').map(DTCG.slug).join('/'), s]));
  for (const f of built.files) {
    const walk = (node, path) => {
      for (const [k, v] of Object.entries(node)) {
        if (k.startsWith('$') || !v || typeof v !== 'object') continue;
        if (v.$type === 'typography') {
          const s = bySlug.get([...path, k].slice(1).join('/'));
          if (s) Object.assign(v.$value, { paragraphSpacing: { value: s.paragraphSpacing || 0, unit: 'px' }, listSpacing: { value: s.listSpacing || 0, unit: 'px' } });
        } else if (v.$value === undefined) walk(v, [...path, k]);
      }
    };
    walk(f.tokens, []);
  }
  // Refuse a folder this export did not write: a wrong --out would otherwise
  // delete whatever it names. In one it did write, only what an export owns is
  // replaced (the manifest and the collection folders, which hold nothing but
  // mode files); a README, a .gitignore and dist/ beside them stay.
  if (existsSync(dir) && readdirSync(dir).length && !existsSync(join(dir, 'manifest.json')))
    throw new Error(`${dir} is not empty and holds no manifest.json: not a token export, not deleting it`);
  if (existsSync(dir)) {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const at = join(dir, e.name);
      const owned = e.name === 'manifest.json' || (e.isDirectory() && e.name !== 'dist' && readdirSync(at).every((f) => f.endsWith('.json')));
      if (owned) rmSync(at, { recursive: true, force: true });
    }
  }
  for (const f of built.files) {
    const file = join(dir, f.name);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, JSON.stringify(f.tokens, null, 2) + '\n');
  }
  writeFileSync(join(dir, 'manifest.json'), JSON.stringify(built.manifest, null, 2) + '\n');
  return built;
}

/** The tokens from either input: a stored `tokens.json`, or the whole file the
 *  snapshot plugin saves when no receiver is listening, which holds them under
 *  `tokens` beside the components. */
export function tokensOf(json) {
  return json && json.tokens && json.tokens._meta ? json.tokens : json;
}

if ((process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url))) {
  const [src, dir] = process.argv.slice(2);
  if (!src || !dir) { console.error('usage: from-snapshot.mjs <tokens.json | downloaded snapshot.json> <out-dir>'); process.exit(2); }
  const built = writeDtcg(tokensOf(JSON.parse(readFileSync(src, 'utf8'))), dir);
  const r = built.report;
  console.log(`${built.files.length} files → ${dir}`);
  for (const k of ['skipped', 'warnings', 'renamed']) if ((r[k] || []).length) console.log(`  ${k}: ${r[k].length} (${r[k].slice(0, 3).map((x) => x.name).join(', ')}${r[k].length > 3 ? ', …' : ''})`);
  // The TypeScript mirror and its check, as every refresh has run them: a
  // failure here means the JSON is written and the modules are not to be trusted.
  for (const step of ['generate-ts.mjs', 'verify-ts.mjs']) {
    const run = spawnSync(process.execPath, [join(HERE, step), dir], { stdio: 'inherit' });
    if (run.status !== 0) { console.error(`${step} failed: the token files are written, the TypeScript is not trustworthy`); process.exit(1); }
  }
}
