/*
 * The self reading's page answers, kept by what determines them (from-code --self and --second): a change to how a
 * reading is interpreted (derive.cjs, from-code's node side) re-reads every component, and none of it re-runs Chrome.
 *
 * A reading renders a combination, then asks the page questions (the walk, a computed style, an element's matched
 * rules). Each answer is kept under a chain: the page's key (pageKey: every file the page is served, the Chrome
 * version, the fonts installed, the system and the node code that drives Chrome), the render (its args, the pointer
 * state it forces and the render's own source), and every question asked since that render, in order, each by its
 * whole text (a page function travels as its source and its arguments, the walker's sources among them). A question
 * changed anywhere misses, and so does every one after it in that combination: the page is launched (lazily: a
 * reading whose every answer is kept never launches Chrome), the combination rendered and its earlier questions asked
 * again, each held to its kept answer (one the page no longer gives stops the reading and drops the combination), and
 * the rest asked of the page. A miss costs a render; a stale hit would be a wrong measure, so whatever the page could
 * depend on is in the key.
 *
 * One file per combination (gzipped JSON, written whole and renamed into place), under the toolkit's common .git beside
 * the measuring lock, so every worktree and every projects root shares it. TOOLKIT_READ_CACHE=off reads through Chrome
 * and keeps nothing (eval --twice reads so: it holds Chrome's readings to each other).
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { lockDir } from '../shared/lock.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
// the format of what is kept: a change to it moves every key
const VERSION = 'read-cache 1';
const hash = (...parts) => createHash('sha1').update(parts.map(String).join('\0')).digest('hex');
const copy = (v) => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

export const cacheOff = () => /^(off|0|no|false)$/i.test(process.env.TOOLKIT_READ_CACHE || '');
export const cacheDir = () => path.join(lockDir(), 'read-cache');

/* The fonts installed here: a family the tokens name, once installed, is measured in place of the fallback. `stat`: each
   file's size and date beside its name, so one replaced under the same name moves it too (the read cache's key). */
export function fontsInstalled({ stat = false } = {}) {
  const home = process.env.HOME || '';
  const said = (f) => { if (!stat) return f; try { const s = fs.statSync(f); return `${f}\t${s.size}\t${s.mtimeMs}`; } catch { return f; } };
  return ['/Library/Fonts', '/System/Library/Fonts', path.join(home, 'Library', 'Fonts'), '/usr/share/fonts', '/usr/local/share/fonts', path.join(home, '.fonts'), path.join(home, '.local', 'share', 'fonts')]
    .flatMap((d) => { try { return fs.readdirSync(d, { recursive: true }).map((f) => `${d}/${f}`); } catch { return []; } }).sort().map(said).join('\n');
}
/* The locale and time zone the page runs under (Chrome takes its language and dates from them). */
export const localeHere = () => ['LANG', 'LC_ALL', 'TZ'].map((k) => `${k}=${process.env[k] ?? ''}`).join(' ');

/* The node code that shapes what the page answers beyond the files it is served: how Chrome is launched (its flags, the
   window), how a function is evaluated in it, how a pointer state is forced and a page navigated. The reader's
   interpretation is not among them: its questions carry their own source. */
export const pageCodeFiles = () => [path.join(HERE, '..', 'shared', 'cdp.mjs')];

/* A page's key: its served files, the Chrome it runs in (the whole version), the fonts installed, the system, the locale
   and time zone (`env`) and the node code that drives it (`code`: pageCodeFiles' contents and whatever else the caller
   renders with). */
export function pageKey({ files, chrome, fonts, system, code, env = '' }) {
  const served = Object.keys(files).sort().map((f) => `${f}\0${files[f]}`).join('\0');
  return hash(VERSION, served, chrome, fonts, system, code, env);
}

/* The cache kept from growing: a combination not read for `days` (a hit touches its file) is removed, then every pooled
   part no kept combination names (one written in the last day is left: a run still going may not have written the
   combination that names it yet), and a write a dead run left half done. Returns what it removed: { files, bytes }. */
export function prune({ dir = cacheDir(), days = 14, now = Date.now() } = {}) {
  const gone = { files: 0, bytes: 0 }, day = 864e5;
  const remove = (f, st) => { try { fs.rmSync(f); gone.files++; gone.bytes += st.size; } catch { /* another run took it */ } };
  const all = (() => { try { return fs.readdirSync(dir, { recursive: true }).map((f) => path.join(dir, f)); } catch { return []; } })();
  const named = new Set(), pools = [];
  for (const f of all) {
    let st; try { st = fs.statSync(f); } catch { continue; }
    if (!st.isFile()) continue;
    if (f.endsWith('.tmp')) { if (now - st.mtimeMs > day) remove(f, st); continue; }
    if (!f.endsWith('.json.gz')) continue;
    if (f.includes(`${path.sep}pool${path.sep}`)) { pools.push([f, st]); continue; }
    if (now - st.mtimeMs > days * day) { remove(f, st); continue; }
    try { for (const m of zlib.gunzipSync(fs.readFileSync(f)).toString().matchAll(/"\$pool":"([0-9a-f]{40})"/g)) named.add(m[1]); } catch { /* unreadable: its parts are pruned with it */ }
  }
  for (const [f, st] of pools) if (!named.has(path.basename(f, '.json.gz')) && now - st.mtimeMs > day) remove(f, st);
  return gone;
}
// at most once a day, by the date of a stamp beside the cache
function pruneDaily(dir) {
  const stamp = path.join(dir, 'pruned');
  try { if (Date.now() - fs.statSync(stamp).mtimeMs < 864e5) return null; } catch { /* never pruned */ }
  if (!fs.existsSync(dir)) return null;
  const gone = prune({ dir });
  try { fs.writeFileSync(stamp, ''); } catch { /* read-only: pruned again next run */ }
  return gone;
}
export const pageCode = () => pageCodeFiles().map((f) => `${path.basename(f)}\0${fs.readFileSync(f, 'utf8')}`).join('\0');

/* One reading's questions and their kept answers. `key` is the page's (pageKey), `live` launches the page and returns
   its tab (called at the first miss only). reset(label, render) starts a combination (`label` says what is rendered,
   `render` renders it on the live page when a miss needs it); step(kind, text, ask) answers one question, `ask(tab)`
   putting it to the page; send() is a question no key can say (it names node ids): it goes to the page and nothing
   after it in the combination is kept. `pool(object)` says which parts of an answer are kept once by their content,
   whatever answer or combination holds them (an element's matched styles: the tokens' :root rule, inherited by every
   element, is over a megabyte). */
export function recorder({ key, dir = cacheDir(), live, pool = () => false }) {
  const stats = { hits: 0, misses: 0, kept: 0, launched: false, pruned: pruneDaily(dir) };
  let tab = null, scope = null, at = hash(key, 'start'), table = {}, dirty = false, log = [], render = null, isLive = false, keep = true;
  const fileOf = (k) => path.join(dir, k.slice(0, 2), `${k}.json.gz`);
  const write = (f, text) => {
    const tmp = `${f}.${process.pid}.${Date.now()}.tmp`;
    fs.mkdirSync(path.dirname(f), { recursive: true });
    fs.writeFileSync(tmp, zlib.gzipSync(text));
    fs.renameSync(tmp, f);
  };
  const load = (k) => { try { return JSON.parse(zlib.gunzipSync(fs.readFileSync(fileOf(k)))); } catch { return {}; } };
  // a pooled part, by the hash of its text: written once, read once per run
  const poolOf = (h) => path.join(dir, 'pool', h.slice(0, 2), `${h}.json.gz`), pooled = new Map();
  const out = (v) => {
    if (Array.isArray(v)) return v.map(out);
    if (!v || typeof v !== 'object') return v;
    if (pool(v)) { const text = JSON.stringify(v), h = hash(text); if (!pooled.has(h)) { if (!fs.existsSync(poolOf(h))) write(poolOf(h), text); pooled.set(h, v); } return { $pool: h }; }
    return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, out(x)]));
  };
  const back = (v) => {
    if (Array.isArray(v)) return v.map(back);
    if (!v || typeof v !== 'object') return v;
    if (typeof v.$pool === 'string' && Object.keys(v).length === 1) {
      if (!pooled.has(v.$pool)) pooled.set(v.$pool, JSON.parse(zlib.gunzipSync(fs.readFileSync(poolOf(v.$pool)))));
      return copy(pooled.get(v.$pool));
    }
    return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, back(x)]));
  };
  const flush = () => {
    if (!dirty || !scope) return;
    write(fileOf(scope), JSON.stringify(table));
    dirty = false;
  };
  const page = async () => { if (!tab) { tab = await live(); stats.launched = true; } return tab; };
  // the page brought to where the chain stands: the combination rendered, each question since asked again and held to
  // its kept answer
  const goLive = async () => {
    if (isLive) return;
    const t = await page();
    if (render) await render(t);
    for (const s of log) {
      const got = await s.ask(t);
      if (!same(got, s.want)) {
        if (scope) fs.rmSync(fileOf(scope), { force: true });
        table = {}; dirty = false;
        throw new Error(`read cache: the page's answer disagrees with the kept one (${s.kind}, combination ${scope ? scope.slice(0, 12) : 'before the first render'}): the combination is dropped; read again, or with TOOLKIT_READ_CACHE=off`);
      }
    }
    isLive = true;
  };
  return {
    stats,
    async reset(label, renderIt) {
      flush();
      scope = at = hash(key, 'render', label);
      table = load(scope); log = []; render = renderIt; isLive = false; keep = true;
      // (read: its date says so to prune)
      if (Object.keys(table).length) try { const t = new Date(); fs.utimesSync(fileOf(scope), t, t); } catch { /* gone meanwhile */ }
    },
    async step(kind, text, ask) {
      const k = hash(at, kind, text);
      // (a pooled part gone missing is a miss, never an error)
      let want, hit = !isLive && Object.hasOwn(table, k);
      if (hit) try { want = back(table[k].r); } catch { hit = false; delete table[k]; }
      if (hit) { stats.hits++; at = k; log.push({ kind, ask, want }); return copy(want); }
      if (!isLive) { stats.misses++; await goLive(); }
      const r = await ask(await page());
      at = k;
      if (keep && scope) { table[k] = { r: out(copy(r)) }; dirty = true; stats.kept++; }
      return r;
    },
    async send(method, params) {
      await goLive();
      keep = false;
      return (await page()).send(method, params);
    },
    async close() { flush(); },
  };
}
