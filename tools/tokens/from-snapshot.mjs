#!/usr/bin/env node
/*
 * A stored snapshot's tokens file → DTCG token files, with no Figma open.
 *
 *   node tools/tokens/from-snapshot.mjs <tokens.json | downloaded snapshot.json> <out-dir>
 *
 * Checks that every reference resolves inside each resolution (refusing to
 * write otherwise), writes the collection folders and `tokens.resolver.json`
 * (DTCG Resolver Module 2025.10, which replaced the house manifest.json), then the
 * TypeScript modules (generate-ts, into <out-dir>/dist/ts) and checks them
 * (verify-ts). This is
 * the export's one refresh: a live refresh server was retired in 2.5.0 because
 * it read the library a second time, beside the snapshot every other output
 * reads.
 *
 * The snapshot plugin already read the file; reading it again through the
 * bridge to export tokens was a second reader of the same variables. This
 * converts what the snapshot holds into the shape dtcg.js takes and writes the
 * DTCG files, resolver included. dtcg.js stays the one converter, and its tests stay the gate.
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

/* Whether a variable's gap in a mode of its collection is another library's mode, joined by the snapshot under the
   collection's name (the plugin joins two remote collections of one name: a mode both have holds both sides' variables,
   a mode only one side has only that side's). Figma gives every variable of a collection a value in every mode of it,
   so where some variable of the collection has a value in the mode and in every mode this one has a value in, the mode
   is this variable's own collection's and the gap a gap; where none does, the mode is the other side's. */
export function otherSide(c, name, mode) {
  if (!c.remote) return false;
  const values = c.values || {}, has = (n, m) => (values[m] || {})[n] !== undefined;
  const own = c.modes.filter((m) => has(name, m));
  if (!own.length || own.includes(mode)) return false;
  const names = new Set(c.modes.flatMap((m) => Object.keys(values[m] || {})));
  return ![...names].some((n) => n !== name && has(n, mode) && own.every((m) => has(n, m)));
}

/** The snapshot's tokens → the shape dtcg.js's buildFiles takes. */
export function toDtcgSnapshot(t) {
  const collections = Object.entries(t.collections || {});
  // Which collection defines a name, for aliases (recorded by name only).
  // A name can live in two collections (a semantic `Colour/Primary` over a
  // primitive of the same name); an alias never points at itself, so prefer a
  // collection other than the aliasing variable's own.
  // Another library's variable (a collection sent `remote`) whose name a local variable holds is that one, as a remote
  // collection or text style is: CSS drops the collection from a name and a contract names a token without it, so
  // two of one name could not be told apart (Carbon's theme Transparent and its foundations' Transparent).
  // (and between two other libraries' collections, an older copy of a foundations library beside its new one, the
  // first in the store's order holds the name)
  const namesOf = (c) => new Set(c.modes.flatMap((m) => Object.keys((c.values || {})[m] || {})));
  // (names compared as the custom property CSS writes, the collection dropped (build-tokens nameOf): `🌮 Font
  // Weight/Bold` and `Font Weight/Bold` are one property, and so are `a - b/c` and `a/b/c` within one collection)
  const css = (n) => n.split('/').map(DTCG.slug).filter(Boolean).join('-');
  const holder = new Map();
  for (const [cname, c] of [...collections.filter(([, x]) => !x.remote), ...collections.filter(([, x]) => x.remote)])
    for (const n of namesOf(c)) if (!holder.has(css(n))) holder.set(css(n), `${cname}\u0000${n}`);
  const shadowed = (cname, c, name) => !!c.remote && holder.get(css(name)) !== `${cname}\u0000${name}`;
  const homes = new Map();
  for (const [cname, c] of collections) {
    for (const mode of c.modes) for (const name of Object.keys((c.values || {})[mode] || {})) {
      if (shadowed(cname, c, name)) continue;
      if (!homes.has(name)) homes.set(name, []);
      if (!homes.get(name).includes(cname)) homes.get(name).push(cname);
    }
  }
  // a reference to a variable left out for its name is to the one that holds the name (`🌮 Font Weight/Bold` → the local
  // `Font Weight/Bold`): an alias, a text style's or an effect's binding
  const held = (n) => (n == null || homes.has(n) ? n : (holder.get(css(n)) || '').split('\u0000')[1] || n);
  const homeOf = (alias, from, name) => {
    const list = homes.get(alias) || [];
    return list.find((c) => c !== from) || (alias !== name ? list[0] : undefined);
  };
  const typeOf = (v) => (isColour(v) ? 'COLOR' : typeof v === 'number' ? 'FLOAT' : typeof v === 'boolean' ? 'BOOLEAN' : 'STRING');

  // each collection under the name its slug is built from (dtcg.js collectionSlugs: another library's that slugs like
  // one already taken is numbered), its Figma name kept for the export's extensions
  const S = DTCG.collectionSlugs(collections.map(([name, c]) => ({ name, remote: !!c.remote })));
  const built = (n) => (S[n] && S[n] !== DTCG.slug(n) ? S[n] : n);
  const out = collections.map(([cname, c]) => {
    const names = [...new Set(c.modes.flatMap((m) => Object.keys((c.values || {})[m] || {})))].filter((n) => !shadowed(cname, c, n));
    return {
      name: built(cname),
      ...(built(cname) !== cname && { figmaName: cname }),
      modes: c.modes,
      // Figma's default mode, the resolver's default and the token build's base (the plugin records it since 0.88.0)
      ...(c.defaultMode && { defaultMode: c.defaultMode }),
      variables: names.map((name) => {
        const values = {};
        let type = null;
        for (const mode of c.modes) {
          // (another library's collection the snapshot joined under one name: a mode only one side has holds only that
          // side's variables, and Figma resolves a variable in its own collection, whose mode a layer set for the other
          // side's does not select: its own default's value there, where it holds one; never one it does not hold. Known
          // as joined by what the modes hold (otherSide): a gap in a collection's own mode stays a gap, refused below)
          const own = ((c.values || {})[mode] || {})[name] !== undefined ? mode : c.defaultMode && otherSide(c, name, mode) && ((c.values || {})[c.defaultMode] || {})[name] !== undefined ? c.defaultMode : mode;
          const raw = ((c.values || {})[own] || {})[name];
          if (raw === undefined) continue;
          type = type || typeOf(raw);
          const alias = held(((c.alias || {})[own] || {})[name]);
          const at = alias && homeOf(alias, cname, name);
          if (at) values[mode] = { alias: { collection: built(at), name: alias } };
          else values[mode] = isColour(raw) ? figmaRgba(raw) : raw;
        }
        // a string Figma scopes to font family (FONT_FAMILY) is a family where its name says no kind (dtcg.js classify:
        // the name first, as it always was); a string weight is not taken from a scope, which may be mis-set and which names a
        // value the build may not map, and a reference to one it skips would refuse the build
        const scopes = (c.scopes || {})[name] || [];
        const font = type === 'STRING' && scopes.includes('FONT_FAMILY') ? 'fontFamily' : undefined;
        return { name, type, hidden: (c.hidden || []).includes(name), description: (c.descriptions || {})[name] || '', values, ...(font && { font }) };
      }),
    };
  });
  // and a string a family-scoped one aliases is a family too (a theme's Brand font, scoped to nothing, that a type
  // scale's Font names): passed down every alias until nothing changes. A weight is not passed on: a string a weight
  // names may be no weight the build can map ("Bold Italic"), and a reference to one it skips would refuse the build
  // (by either name: an alias carries the build's, a text style's binding Figma's)
  const byName = new Map(out.flatMap((c) => { const m = new Map(c.variables.map((v) => [v.name, v])); return [[c.name, m], ...(c.figmaName ? [[c.figmaName, m]] : [])]; }));
  // a string a text style binds as its font family is one too, whatever its scope (Carbon's Fixed/Body/Font family,
  // scoped to everything): Figma took it as the family there
  for (const st of t.textStyles || []) {
    // (by where the binding lands: one to another library's variable a local one names is the local one)
    const b = st.bound && st.bound.fontFamily, n = b && held(b.name), h = n && homes.get(n), at = h && (h.includes(b.collection) ? b.collection : h[0]);
    const v = at && (byName.get(at) || new Map()).get(n);
    if (v && v.type === 'STRING' && !v.font) v.font = 'fontFamily';
  }
  for (let moved = true; moved;) {
    moved = false;
    for (const c of out) for (const v of c.variables) {
      if (v.font !== 'fontFamily') continue;
      for (const x of Object.values(v.values)) {
        const to = x && x.alias && (byName.get(x.alias.collection) || new Map()).get(x.alias.name);
        if (to && to.type === 'STRING' && !to.font) { to.font = v.font; moved = true; }
      }
    }
  }  // and a family only where every alias it holds lands on a family: a target its name makes something else (a
  // `…/weight`) is skipped or typed apart, and the reference would dangle; that undoes the referrer, and so on up
  const nameKind = (v) => { const seg = v.name.split('/'); return seg.some((x) => /^famil/i.test(x)) ? 'fontFamily' : seg.some((x) => /^weight/i.test(x)) ? 'fontWeight' : null; };
  const isFamily = (v) => (nameKind(v) || v.font) === 'fontFamily';
  for (let moved = true; moved;) {
    moved = false;
    for (const c of out) for (const v of c.variables) {
      if (v.font !== 'fontFamily' || nameKind(v)) continue;
      const off = Object.values(v.values).some((x) => { const to = x && x.alias && (byName.get(x.alias.collection) || new Map()).get(x.alias.name); return to && !isFamily(to); });
      // (nor one whose name is also a group, Brand/Font beside Brand/Font/Family: typed, it would take the path first)
      if (off || c.variables.some((x) => x.name.startsWith(`${v.name}/`))) { delete v.font; moved = true; }
    }
  }


  // A text style's bindings, as the snapshot records them (plugin 0.24.0 on).
  // A snapshot from before that is refused, not guessed at: the naming
  // convention it once relied on, `<style>/size`, missed every binding that
  // did not follow it, and exported them as literals without a word.
  const old = (t.textStyles || []).filter((s) => !s.bound).map((s) => s.name);
  if (old.length) throw new Error(`the snapshot predates plugin 0.24.0 (${old.length} text styles without their bindings, e.g. ${old[0]}): take a new snapshot`);
  // A binding to a variable this snapshot does not hold (another library's)
  // cannot become a reference the build resolves: the literal value stands.
  const own = (x) => { const n = x && held(x.name), h = n && homes.get(n); return h ? { collection: built(h.includes(x.collection) ? x.collection : h[0]), name: n } : null; };
  // A number is a weight, never a length (400, not 25rem), where Figma scopes it to one, its name says "font weight"
  // (a weight scoped to text or to everything; "weight" alone is also a stroke's) or a text style binds it as one, and
  // only where every value is a weight, no scope is a length's and no style binds it as a length. It is passed along
  // aliases, up from a weight by scope or name alone (a 400 a style binds may be a width's too), down only where all that
  // alias the target are weights, and dropped wherever an alias and its target would differ in type.
  const variableAt = (x) => x && byName.get(x.collection)?.get(x.name);
  const asLength = new Set([...(t.textStyles || []).flatMap((s) => Object.keys(s.bound).filter((k) => k !== 'fontWeight').map((k) => s.bound[k])),
    ...(t.effects || []).flatMap((e) => (e.layers || []).flatMap((l) => Object.values(l.bound || {})))].map((b) => variableAt(own(b))));
  const couldWeigh = new Set(), weighs = new Set(), said = new Set();
  out.forEach((c, i) => c.variables.forEach((v) => {
    const scopes = (collections[i][1].scopes || {})[v.name] || [];
    if (v.type !== 'FLOAT' || asLength.has(v) || DTCG.classify(v) !== 'dimension') return;
    if (!scopes.every((s) => ['FONT_WEIGHT', 'FONT_STYLE', 'TEXT_CONTENT', 'ALL_SCOPES'].includes(s))) return;
    if (!Object.values(v.values).every((x) => x?.alias || DTCG.fontWeight(x) !== null)) return;
    couldWeigh.add(v);
    if (scopes.includes('FONT_WEIGHT') || /font[\s/_-]*weight/i.test(v.name)) { weighs.add(v); said.add(v); }
  }));
  for (const s of t.textStyles || []) { const v = variableAt(own(s.bound.fontWeight)); if (couldWeigh.has(v)) weighs.add(v); }
  const links = out.flatMap((c) => c.variables.flatMap((v) => Object.values(v.values).map((x) => [v, variableAt(x?.alias)]).filter(([, to]) => to)));
  const aliasedBy = new Map();
  for (const [from, to] of links) aliasedBy.set(to, (aliasedBy.get(to) || new Set()).add(from));
  for (let size = -1; size !== weighs.size + said.size;) {
    size = weighs.size + said.size;
    for (const [to, froms] of aliasedBy) {
      if (said.has(to)) for (const from of froms) if (couldWeigh.has(from)) { weighs.add(from); said.add(from); }
      if (couldWeigh.has(to) && !weighs.has(to) && [...froms].every((from) => weighs.has(from))) weighs.add(to);
    }
  }
  for (let size = -1; size !== weighs.size;) {
    size = weighs.size;
    for (const [from, to] of links) if (weighs.has(from) !== weighs.has(to)) { weighs.delete(from); weighs.delete(to); }
  }
  for (const v of weighs) v.font = 'fontWeight';
  // (a number left a length is no reference for a weight: the style's own weight stands)
  const asWeight = (b) => { const v = variableAt(b); return v?.type === 'FLOAT' && !weighs.has(v) ? null : b; };
  const boundOf = (s) => ({ fontFamily: own(s.bound.fontFamily), fontSize: own(s.bound.fontSize), fontWeight: asWeight(own(s.bound.fontWeight)) });
  const textStyles = (t.textStyles || []).map((s) => ({
    name: s.name,
    description: s.description || '',
    fontFamily: s.family,
    fontWeight: s.weight,
    fontSize: s.size,
    // none stored (an AUTO the snapshot could not measure) goes on as AUTO, which dtcg.js warns of and omits, never NaN or 0
    lineHeight: typeof s.lineHeight === 'number' ? { unit: 'PERCENT', value: +(s.lineHeight * 100).toFixed(4) } : { unit: 'AUTO' },
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
  const paintColour = (c) => (isColour(c) ? { color: figmaRgba(c) } : { color: { r: 0, g: 0, b: 0, a: 1 }, bound: { color: own({ name: c }) } });
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
     type has no member for them (Format 2025.10 §9.8 lists exactly five). They
     go in the token's $extensions, merged beside any tracking fraction already
     there: a conforming reader ignores them, the house build reads them, and
     dropping them would lose the design silently. Always written, zero
     included, for the same reason as letter-spacing, and under noExtensions
     too: they are the design, not provenance. */
  const vendor = opts.vendor || DTCG.VENDOR;
  const bySlug = new Map((tokens.textStyles || []).map((s) => [s.name.split('/').map(DTCG.slug).join('/'), s]));
  for (const f of built.files) {
    const walk = (node, path) => {
      for (const [k, v] of Object.entries(node)) {
        if ((k.startsWith('$') && k !== '$root') || !v || typeof v !== 'object') continue;
        if (v.$type === 'typography') {
          const s = bySlug.get([...path, k].slice(1).filter((x) => x !== '$root').join('/'));
          if (s) {
            v.$extensions ||= {};
            v.$extensions[vendor] = { ...v.$extensions[vendor], paragraphSpacing: { value: s.paragraphSpacing || 0, unit: 'px' }, listSpacing: { value: s.listSpacing || 0, unit: 'px' } };
          }
        } else if (v.$value === undefined) walk(v, [...path, k]);
      }
    };
    walk(f.tokens, []);
  }
  // Every reference must resolve inside each resolution, checked before a
  // file is written: verify-ts resolves across every module at once, so a
  // reference that resolves only in another resolution's sources passed it
  // and failed in Style Dictionary. A refused export leaves the last one in place.
  const refs = DTCG.verifyReferences(Object.fromEntries(built.files.map((f) => [f.name, f.tokens])), built.axes);
  if (!refs.ok) {
    const list = refs.dangling.slice(0, 10).map((d) => `${d.build}: {${d.reference}}`).join('; ');
    throw Object.assign(new Error(`${refs.dangling.length} reference(s) do not resolve inside their resolution, nothing written: ${list}${refs.dangling.length > 10 ? '; …' : ''}`), { refused: true });
  }
  // Refuse a folder this export did not write: a wrong --out would otherwise
  // delete whatever it names. An export is known by what its marker says, not
  // its name, since `tokens.resolver.json` is the name the standard suggests to
  // everyone: a resolver whose description opens as the export's does, or the house
  // manifest.json ({ builds: [...] }) exports wrote before it (until
  // 2026-11-17), which stays owned so the first export after the change
  // removes it. In one it did write, only what an export owns is replaced
  // (those two files and the collection folders, which hold nothing but mode
  // files); a README, a .gitignore and dist/ beside them stay.
  const marks = [RESOLVER, 'manifest.json'];
  const read = (f) => { try { return JSON.parse(readFileSync(join(dir, f), 'utf8')); } catch { return null; } };
  const ours = String(read(RESOLVER)?.description).startsWith(DTCG.OURS) || Array.isArray(read('manifest.json')?.builds);
  if (existsSync(dir) && readdirSync(dir).length && !ours)
    throw Object.assign(new Error(`${dir} is not empty and holds no ${RESOLVER} this export wrote: not a token export, not deleting it`), { refused: true });
  if (existsSync(dir)) {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const at = join(dir, e.name);
      const owned = marks.includes(e.name) || (e.isDirectory() && e.name !== 'dist' && readdirSync(at).every((f) => f.endsWith('.json')));
      if (owned) rmSync(at, { recursive: true, force: true });
    }
  }
  for (const f of built.files) {
    const file = join(dir, f.name);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, JSON.stringify(f.tokens, null, 2) + '\n');
  }
  writeFileSync(join(dir, RESOLVER), JSON.stringify(built.resolver, null, 2) + '\n');
  return built;
}

/** The resolver's file name, at the export's root: the Resolver Module asks for a `.resolver.json` extension. */
export const RESOLVER = 'tokens.resolver.json';

/** The tokens from either input: a stored `tokens.json`, or the whole file the
 *  snapshot plugin saves when no receiver is listening, which holds them under
 *  `tokens` beside the components. */
export function tokensOf(json) {
  return json && json.tokens && json.tokens._meta ? json.tokens : json;
}

if ((process.argv[1] && (() => { try { return realpathSync(process.argv[1]); } catch { return null; } })() === fileURLToPath(import.meta.url))) {
  const [src, dir] = process.argv.slice(2);
  if (!src || !dir) { console.error('usage: from-snapshot.mjs <tokens.json | downloaded snapshot.json> <out-dir>'); process.exit(2); }
  // a missing or unreadable input is one line naming it, never a stack (as tools/figma-audit/scores.mjs)
  const readJson = (f) => { try { return JSON.parse(readFileSync(f, 'utf8')); } catch (e) { console.error(`${f}: ${e.code === 'ENOENT' ? 'no such file' : e.code === 'EISDIR' ? 'a folder, not a file' : 'not JSON (' + e.message + ')'}`); process.exit(1); } };
  let built;
  // a refusal is one line; anything else is a bug and keeps its stack
  try { built = writeDtcg(tokensOf(readJson(src)), dir); } catch (e) { if (!e?.refused) throw e; console.error(e.message); process.exit(1); }
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
