/*
 * The toolkit's own rendering of a library, with no project code: each component's web component (to-markup's
 * toElement, through the one DOM helper), its sheet (to-code's toCss) and the tokens as custom properties, on one
 * static page that exposes each component's render function as window.R[<folder>]. test-to-markup renders the sample
 * library through it; from-code reads a project's library through it (--self), so what differs there is the
 * toolkit's own translation loss, apart from the project's code.
 *
 *   const s = await serveSite(siteFiles(library, { tokensCss }));   // s.url, s.close()
 *
 * `library` is { <component>: contract with its folder }, as to-markup takes it; `tokensCss` the custom properties
 * (the project's generated _tokens.scss, which is plain CSS, or a :root block built from a sample).
 */
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { toElement, toParity, DOM } from './to-markup.mjs';
import { toCss, BASE } from './to-code.mjs';
import { importClosure } from '../shared/import-closure.mjs';
import { createRequire } from 'node:module';
const { byComponentName } = createRequire(import.meta.url)('./derive.cjs');

export const ELEMENT = { kind: 'element', prefix: 'ds-' };

/* What the self leg draws of one component: its markup, its sheet and its parity mapping, under its library's settings
   (`settings`, the house's where none). The one source: the site's files are written from it (siteFiles), the self
   source maps from it (from-code), and the inputs hash is taken of it (eval.mjs selfInputs), so a reading's hash moves
   with what is written. Tested by test-eval.mjs. */
export function selfDrawn(c, { library, mains, settings, naming = ELEMENT }) {
  return { markup: toElement(c, c.folder, { naming, library, settings }), sheet: toCss(c, c.folder, { naming, mains, settings }), mapping: selfMapping(c, { library, settings, naming }) };
}

/* Its parity mapping alone, for a reader that needs no more (from-code's self source): selfDrawn's. */
export function selfMapping(c, { library, settings, naming = ELEMENT }) {
  return toParity(c, c.folder, { naming, library, framework: 'web-components', settings });
}

/* The folders of `folders` and every component they place, transitively (`library` by component name, each with its
   folder): what a component's drawing and reading are made from, beside it (drawnAll's key, eval.mjs selfInputs). */
// (placed: an instance's `component`, or a variant's swap of one, `<part>.component` in its set, each with its `key`
// beside it, resolved as the drawing resolves it, derive's byComponentName: by key first, then by name in any case; the
// exact name too, so the closure is never narrower than either)
export function closureOf(library, folders) {
  const byFolder = Object.fromEntries(Object.values(library).map((c) => [c.folder, c])), main = byComponentName(Object.values(library));
  const placed = (c) => {
    const out = new Set(), take = (name, key) => { for (const m of [main(name, key ?? null), library[name]]) if (m && m.folder) out.add(m.folder); };
    JSON.stringify(c, function (k, v) {
      if (typeof v === 'string' && k === 'component') take(v, this.key);
      else if (typeof v === 'string' && k.endsWith('.component')) take(v, this[`${k.slice(0, -'.component'.length)}.key`]);
      return v;
    });
    return out;
  };
  const seen = new Set();
  const visit = (f) => { if (seen.has(f) || !byFolder[f]) return; seen.add(f); for (const g of placed(byFolder[f])) visit(g); };
  for (const f of folders) visit(f);
  return seen;
}

/* selfDrawn for every component of the library, by folder, each kept on disk between runs under the hash of what it is
   drawn from: the generator's code (site.mjs's import closure, and the house naming preferences), its settings and naming, and the contracts of it and
   every component it places (closureOf; checked on all three outside libraries, 2026-11-21: drawing a component from
   that closure alone writes the same as from the whole library). Every self reading drew the whole library, about three
   quarters of each (150 of 206 s, a Material 3 reading, 2026-11-21). `dir` null, or TOOLKIT_SELF_DRAWN_CACHE=0, draws
   every one; a file that cannot be read or written is drawn. */
export const DRAWN_CACHE = path.join(os.tmpdir(), 'toolkit-self-drawn');
// (taken as the module loads, beside the code it hashes: taken later, a run waiting on the measuring lock while the files
// were edited kept its old drawings under the new code's hash, and every later run drew them from the cache)
// (null where a file of it cannot be read: then nothing is kept or taken from the cache, every component drawn)
export const GENERATOR = (() => { try {
  const here = fileURLToPath(import.meta.url), h = createHash('sha1');
  for (const f of importClosure([here])) h.update(path.relative(path.dirname(here), f)).update('\0').update(fs.readFileSync(f)).update('\0');
  // and the house naming preferences HOUSE is built from, read by a path importClosure does not follow (projects.cjs)
  try { h.update(fs.readFileSync(path.join(path.dirname(here), '..', '..', 'standards', 'naming-preferences.json'))); } catch { /* none */ }
  return h.digest('hex');
} catch { return null; } })();
export function drawnAll(library, { settingsOf = () => undefined, naming = ELEMENT, only = null, dir = process.env.TOOLKIT_SELF_DRAWN_CACHE === '0' ? null : DRAWN_CACHE } = {}) {
  const mains = byComponentName(Object.values(library)), byFolder = Object.fromEntries(Object.values(library).map((c) => [c.folder, c]));
  const out = {};
  // (`only`: the folders drawn, each still against the whole library, as a placed name resolves in it)
  for (const c of Object.values(library).filter((x) => !only || only.has(x.folder))) {
    const settings = settingsOf(c.folder);
    const key = () => createHash('sha1').update([GENERATOR, JSON.stringify(settings ?? null), JSON.stringify(naming), ...[...closureOf(library, [c.folder])].sort().map((f) => `${f}\0${JSON.stringify(byFolder[f])}`)].join('\0')).digest('hex');
    const file = dir && GENERATOR && path.join(dir, `${key()}.json`);
    if (file) { try { out[c.folder] = JSON.parse(fs.readFileSync(file, 'utf8')); continue; } catch { /* not kept yet */ } }
    out[c.folder] = selfDrawn(c, { library, mains, settings, naming });
    if (file) { try { fs.mkdirSync(dir, { recursive: true }); const tmp = `${file}.${process.pid}`; fs.writeFileSync(tmp, JSON.stringify(out[c.folder])); fs.renameSync(tmp, file); } catch { /* drawn again next time */ } }
  }
  return out;
}

/* The site's files, by path: { 'index.html', 'all.css', 'components/dom.js', 'components/<folder>/<folder>.js' }.
   Each component written under its library's settings (`settingsOf`, by folder: its state names), the house's where none. */
export function siteFiles(library, { tokensCss = '', stylesheets = [], naming = ELEMENT, settingsOf = () => undefined, only = null } = {}) {
  const files = { 'components/dom.js': DOM };
  // the base the sheets assume first (to-code's BASE), then the tokens and each component's sheet
  let css = `${BASE}${tokensCss}\n`;
  // each component's render function, by the name its file exports (to-markup's to say, not this file's to guess)
  const fn = {};
  // each drawn with the components it places as the project's build gives them (to-code's main), so a rule reaching inside one is written
  // (`only`: the folders served, each drawn against the whole library: drawn against the served few alone, a name two
  // contracts share resolves where the library leaves it unresolved, derive's byComponentName)
  const drawn = drawnAll(library, { settingsOf, naming, only });
  for (const c of Object.values(library).filter((x) => !only || only.has(x.folder))) {
    const { markup: js, sheet } = drawn[c.folder];
    files[`components/${c.folder}/${c.folder}.js`] = js;
    fn[c.folder] = (/export function (\w+)\(/.exec(js) || [])[1];
    if (!fn[c.folder]) throw new Error(`${c.component}: to-markup's file exports no render function`);
    css += sheet;
  }
  files['all.css'] = css;
  const imports = Object.entries(fn).map(([f, n], i) => `import { ${n} as C${i} } from './components/${f}/${f}.js';`).join('');
  files['index.html'] = `<!doctype html><html><head><meta charset="utf-8">${stylesheets.map((h) => `<link rel="stylesheet" href="${h}">`).join('')}<link rel="stylesheet" href="all.css"></head><body><main id="stage"></main><script type="module">${imports} window.R = { ${Object.keys(fn).map((f, i) => `${JSON.stringify(f)}: C${i}`).join(', ')} }; window.ready = true;</script></body></html>`;
  return files;
}

/* The custom property declarations in a sheet, in order: { name, start, end, value }, `start`..`end` the whole
   declaration (its `;` included where it has one). Read by a scanner, never by line: a token build may put several on
   one line, and a value may hold a string, a comment, a `;` or a block inside brackets. Tested by test-from-code.mjs. */
export function customProperties(css) {
  const out = [], n = css.length;
  // past a comment or a string starting at j
  const past = (j) => {
    if (css[j] === '/' && css[j + 1] === '*') { const e = css.indexOf('*/', j + 2); return e < 0 ? n : e + 2; }
    const q = css[j];
    // (a string ends at its quote, or unclosed at the line's end, as CSS ends a bad string)
    for (j++; j < n; j++) { if (css[j] === '\\') j++; else if (css[j] === q) return j + 1; else if (css[j] === '\n') return j; }
    return n;
  };
  const opens = (ch) => ch === '"' || ch === "'";
  let fresh = true;
  for (let i = 0; i < n;) {
    const ch = css[i];
    if (opens(ch) || (ch === '/' && css[i + 1] === '*')) { const comment = ch === '/'; i = past(i); if (!comment) fresh = false; continue; }
    if (ch === '{' || ch === '}' || ch === ';') { fresh = true; i++; continue; }
    if (/\s/.test(ch)) { i++; continue; }
    // (a name of any characters CSS takes in one: escaped, or past ASCII)
    const name = fresh && ch === '-' && css[i + 1] === '-' && /^--(?:[\w-]|\\[\s\S]|[^\x00-\x7f])*/.exec(css.slice(i, i + 256))[0];
    fresh = false;
    if (!name) { i++; continue; }
    let j = i + name.length;
    while (j < n && (/\s/.test(css[j]) || (css[j] === '/' && css[j + 1] === '*'))) j = /\s/.test(css[j]) ? j + 1 : past(j);
    if (css[j] !== ':') { i = j; continue; }
    // the value: up to a `;` or the block's `}`, outside strings, comments and brackets
    const from = ++j;
    for (let depth = 0; j < n;) {
      const c = css[j];
      if (opens(c) || (c === '/' && css[j + 1] === '*')) { j = past(j); continue; }
      if (c === '(' || c === '[' || c === '{') depth++;
      else if (c === ')' || c === ']' || (c === '}' && depth > 0)) depth--;
      else if (depth === 0 && (c === ';' || c === '}')) break;
      j++;
    }
    out.push({ name, start: i, end: css[j] === ';' ? j + 1 : j, value: css.slice(from, j).trim() });
    i = j;
  }
  return out;
}

/* `tokensCss` keeping only the custom properties `from` (the sheets and markup served beside it) reaches through
   var(), and those their own values reach, at any depth; every other statement is kept as written. A name met in a
   comment or a string is kept too: more than needed, never less. Tested by test-from-code.mjs. */
export function reachedTokens(tokensCss, from) {
  const decls = customProperties(tokensCss), valueOf = new Map();
  for (const d of decls) valueOf.set(d.name, `${valueOf.get(d.name) || ''} ${d.value}`);
  const refs = (s) => [...s.matchAll(/var\(\s*(--(?:[\w-]|\\[\s\S]|[^\x00-\x7f])+)/g)].map((m) => m[1]);
  // (and whatever the sheet itself names outside the declarations found: a property of its own, `font: var(--x)`, or a
  // declaration the scanner did not take, so its var()s are followed even then)
  let rest = '', from0 = 0;
  for (const d of decls) { rest += tokensCss.slice(from0, d.start); from0 = d.end; }
  const keep = new Set(), todo = [...refs(from), ...refs(rest + tokensCss.slice(from0))];
  while (todo.length) { const v = todo.pop(); if (keep.has(v)) continue; keep.add(v); todo.push(...refs(valueOf.get(v) || '')); }
  let out = '', at = 0;
  for (const d of decls) if (!keep.has(d.name)) { out += tokensCss.slice(at, d.start); at = d.end; }
  return out + tokensCss.slice(at);
}

/* The self reading's page for one component (from-code --self): only it and the components it places (closureOf),
   with only the tokens their sheets and markup reach (reachedTokens). Every matched-styles answer matches the page's
   whole sheet and carries the whole tokens rule it inherits, so the whole library's page made each about ten times
   slower than this one (2026-11-22); the reading is the same, as nothing outside the closure styles the component.
   Tested by test-from-code.mjs. */
export function selfSiteFiles(library, folder, { tokensCss = '', settingsOf = () => undefined } = {}) {
  const only = closureOf(library, [folder]);
  const bare = siteFiles(library, { settingsOf, only });
  return siteFiles(library, { tokensCss: reachedTokens(tokensCss, Object.values(bare).join('\n')), settingsOf, only });
}

/* Served from memory on a free local port. */
export async function serveSite(files) {
  const type = (p) => (p.endsWith('.js') ? 'text/javascript' : p.endsWith('.css') ? 'text/css' : 'text/html');
  const server = http.createServer((req, res) => {
    const p = decodeURIComponent(new URL(req.url, 'http://x').pathname).replace(/^\//, '') || 'index.html';
    if (!(p in files)) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'content-type': type(p) });
    res.end(files[p]);
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  return { url: `http://127.0.0.1:${server.address().port}/`, close: () => new Promise((r) => { server.closeAllConnections(); server.close(r); }) }; // a spare connection never closes itself (Node 22)
}
