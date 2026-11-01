/*
 * Where a project's snapshot lives, and the one writer for projects that have
 * no repo of their own.
 *
 * Every consumer — the docs site, the design tracker, the dashboard, the
 * validator — needs to find a project's snapshot without knowing how that
 * project happens to lay its files out. `paths()` is the answer: a canonical
 * layout under one root, which a repo may override key by key in its
 * snapshot.config.json because its specs already live beside its code.
 *
 * A project with no repo (a design-only engagement) is written here, by the
 * router, into the project's own figma-design-system/ folder. Such a project often
 * spreads one design system over several Figma files — tokens in a Core file,
 * components in another — so a write MERGES: collections and styles by name,
 * components tracked by the file they came from, so snapshotting one file
 * never erases what another file contributed.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { compact, resolve, slug, layerPaths } = require('./spec.cjs');
const payload = require('./payload.cjs');
const contract = require('../component-contract/derive.cjs');
const { compareNames } = require('../shared/output.mjs');
const { nameOf } = require('./graph.cjs');

/* The canonical layout, relative to a store root. */
const DEFAULT_PATHS = {
  tokens: 'tokens.json',
  components: 'components',
  icons: 'icons',
  graphics: 'graphics',
  previews: 'previews',
  screens: 'screens',
  changes: 'changes.json',
  index: 'index.json',
  logs: '.snapshot-logs',
};

/* Locations a repo may state in `paths` that the canonical layout does not
 * write: where its stylesheets go (tokens', components'), what it serves, where its gallery and its
 * parity report live. The list sat in `tools/tokens/check.mjs` instead, so
 * adding a key here failed code-standard rule 55 from a second list nobody updated. */
const EXTRA_PATHS = ['styles', 'componentStyles', 'public', 'stylesheets', 'storybook', 'parity'];
/** Every `paths` key the toolkit knows: the canonical layout plus the above. */
const PATH_KEYS = [...Object.keys(DEFAULT_PATHS), ...EXTRA_PATHS];

/**
 * Absolute paths for a store. `overrides` come from a repo's
 * snapshot.config.json `paths` and win key by key; keys the canonical layout
 * does not know (a Storybook build, a public folder) pass through resolved.
 */
function paths(root, overrides = {}) {
  const out = {};
  for (const [k, v] of Object.entries({ ...DEFAULT_PATHS, ...overrides })) {
    if (typeof v === 'string') out[k] = path.resolve(root, v);
    else if (Array.isArray(v)) out[k] = v.map((x) => (typeof x === 'string' ? path.resolve(root, x) : x));
    else if (v && typeof v === 'object' && typeof v.dir === 'string') out[k] = { ...v, dir: path.resolve(root, v.dir) };
    else out[k] = v;
  }
  return out;
}

const readJson = (file, fallback) => { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; } };
const text = (data) => JSON.stringify(data, null, 2) + '\n';

/** Write only when the content differs, so a repeat snapshot moves no files. */
function writeIfChanged(file, content) {
  const had = fs.existsSync(file) ? fs.readFileSync(file) : null;
  const next = Buffer.isBuffer(content) ? content : Buffer.from(content);
  if (had && had.equals(next)) return false;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, next);
  return true;
}

/* ---- tokens ------------------------------------------------------------- */

const byName = (list) => new Map((list || []).map((x) => [x.name, x]));

/**
 * Merge one file's tokens into what the store holds, by name: each collection
 * and style the file carries replaces its namesake, and everything another
 * file owns stays. The components file of a two-file system carries almost no
 * variables, and letting it replace the core file's tokens would empty the
 * foundations on every component snapshot.
 *
 * Each source records what it owns, so a collection or style a file deletes
 * in Figma is removed here too: the first version merged and never removed,
 * and a deleted style lived on in the store until it was rebuilt. A store
 * written before ownership was recorded (or by a repo's own receiver, which
 * wrote one file whole) is replaced whole by its one file.
 */
const OWNED = ['textStyles', 'paintStyles', 'effects'];
/*
 * What a token snapshot holds: every collection under its Figma name, and the
 * styles. The plugin also sends four convenience keys (global, semantic,
 * layout, type), which are one project's reading of the collections, not the
 * design; they are not stored, and a reader looks a value up by name and
 * mode in the collections (valueOf). The shape is the one the more careful of
 * two receivers already wrote.
 */
// A collection's values and aliases are maps, and Figma returns them in
// whatever order it read them: one snapshot moved 3,000 lines in a file whose
// job is to be diffable, with nothing changed. Sorted by name, so a diff shows
// what moved. The order of the collections and of the styles is the file's own
// and is kept — the docs pages follow it.
const sortMap = (o) => Object.fromEntries(Object.keys(o || {}).sort().map((k) => [k, o[k]]));
const sortCollection = (c) => ({ ...c, values: Object.fromEntries(Object.entries(c.values || {}).map(([m, v]) => [m, sortMap(v)])), ...(c.alias ? { alias: sortMap(c.alias) } : {}) });
const canonical = (t) => ({
  collections: Object.fromEntries(Object.entries(t.collections || {}).map(([n, c]) => [n, sortCollection(c)])),
  textStyles: t.textStyles || [], paintStyles: t.paintStyles || [], effects: t.effects || [],
});
const metaOf = (m) => ({
  file: m.file || null,
  // Both names the file answers to. A run that sends no key (a plugin before
  // 0.67.0) has none here, and nothing carries a previous value forward: a key invented from history
  // outlives the file it described.
  fileKey: m.fileKey || null, fileId: m.fileId || null,
  // the plugin release that took it (0.49.3 on), read by the grade (`knownFor`)
  plugin: m.plugin || null,
  collectionCounts: m.collectionCounts || {}, lineHeightNote: m.lineHeightNote || null,
  // What the plugin saw on a layer and could not send: the evidence the
  // spec-key gate needs that the file is holding something back.
  unrecorded: m.unrecorded || null,
  // The file's pages in order, category headers included (plugin 0.21.0).
  pages: m.pages || null,
});
function mergeTokens(before, incoming, { iconSets = [], iconPage = null, iconGroups = null, iconDescriptions = null, icons = [], ref = null, ids = [], orphan = () => false } = {}) {
  /*
   * One entry per FILE, under the identity the index uses (`ref`, the routing
   * entry's first). A file answers to its key and its document id, and a UI
   * run and a headless run carry different ones: keyed by whichever arrived,
   * One project's web library was stored twice, and the docs reader filed its
   * pages from the first list and found nothing left for the second.
   */
  const id = ref || incoming._meta.fileKey || incoming._meta.fileId;
  const alias = new Set([id, incoming._meta.fileKey, incoming._meta.fileId, ...ids].filter(Boolean));
  // Each file's page list stays with the file: a two-file system's pages are
  // two lists, and the last file snapshotted must not replace the other's.
  // `iconPage` is the page those icon names sit on. An icon page's components
  // get no spec — a spec per glyph would swamp the store — so the names are
  // all a reader has, and without the page they cannot be placed. A reader may
  // not assume what an icon page is called (toolkit-standard §D 7), so the
  // file says. Absent (plugin < 0.35.0, or a file with no icon page) the key
  // is simply not there, and a reader reports icons as unaddressed.
  // What the icon library's checks read (figma-foundations-audit): the sizes
  // each set was drawn at, and, from plugin 0.53.0, the variants holding a
  // paint no variable or style binds. Only an export carries them; a run with
  // export off keeps the last export's, as it keeps the files on disk.
  const exported = icons.length ? { iconSizes: icons.reduce((m, i) => ((m[i.name] = [...(m[i.name] || []), i.size].sort((a, b) => a - b)), m), {}),
    ...(icons.every((i) => typeof i.unbound === 'number') && { unboundIcons: icons.filter((i) => i.unbound > 0).map((i) => `${i.name}@${i.size}`) }),
    // the variable each icon's glyph is painted with (plugin 0.63.0): what an instance is drawn in until given a colour
    ...(icons.some((i) => i.fill) && { iconColours: Object.fromEntries(icons.filter((i) => i.fill).map((i) => [i.name, i.fill])) }) } : null;
  const owns = { collections: Object.keys(incoming.collections || {}), icons: iconSets, ...(iconPage ? { iconPage } : {}), ...Object.fromEntries(OWNED.map((k) => [k, (incoming[k] || []).map((x) => x.name)])) };
  const source = { [id]: { file: incoming._meta.file, at: incoming._meta.snapshot, ...(incoming._meta.pages && { pages: incoming._meta.pages }), ...(incoming._meta.plugin && { plugin: incoming._meta.plugin }), owns } };
  const stored = before && before._meta && before._meta.sources;
  // The same file under another of its identities is this entry, not another.
  // A source no routed file claims is a file that moved (writeLibrary): it goes, and so does what only it owned.
  const moved = stored ? Object.keys(stored).filter((k) => !alias.has(k) && orphan(k)) : [];
  const sources = stored && Object.fromEntries(Object.entries(stored).filter(([k]) => (k === id || !alias.has(k)) && !moved.includes(k)));
  const earlier = stored && [id, ...alias].map((k) => stored[k]).find(Boolean);
  const keep = exported || (earlier && earlier.owns && earlier.owns.iconSizes ? { iconSizes: earlier.owns.iconSizes, ...(earlier.owns.unboundIcons && { unboundIcons: earlier.owns.unboundIcons }), ...(earlier.owns.iconColours && { iconColours: earlier.owns.iconColours }) } : null);
  if (keep) Object.assign(owns, keep);
  // Each icon's group, the frame or section the file keeps it in (plugin
  // 0.55.0), so the docs head each group as the file does. A run without it
  // keeps the last one's, as a run with export off keeps the sizes.
  const groups = iconGroups || (earlier && earlier.owns && earlier.owns.iconGroups);
  if (groups) owns.iconGroups = groups;
  // Each icon's description (plugin 0.56.0), its search keywords, kept the same way.
  const described = iconDescriptions || (earlier && earlier.owns && earlier.owns.iconDescriptions);
  if (described) owns.iconDescriptions = described;
  source[id].seq = 1 + Math.max(0, ...Object.values(stored || {}).map((v) => (v && v.seq) || 0)); // this store's write order
  if (!sources) return { _meta: { ...metaOf(incoming._meta), collections: Object.keys(incoming.collections || {}), sources: source }, ...canonical(incoming) };
  // What this file owned last time and no longer carries is gone from Figma.
  const was = (earlier && earlier.owns) || null;
  const ownedBy = (list, k) => new Set(list.flatMap((s) => (s.owns && s.owns[k]) || []));
  const live = (k) => ownedBy([{ owns }, ...Object.entries(sources).filter(([s]) => s !== id).map(([, v]) => v)], k);
  // A name this file dropped goes even if another source also lists it, when
  // the one stored copy is this file's (it wrote the name last): keeping it
  // would serve deleted values as the other's. Missing is safer than wrong; the
  // other's next write restores it. A copy another source wrote later is that
  // source's, and stays.
  // Write order is each entry's `seq`, not its day: two files snapshotted the same day tie on `at`.
  const laterOwner = (k, name) => Object.entries(sources).some(([s, v]) => s !== id && v && v.owns && (v.owns[k] || []).includes(name) && (v.seq || 0) > ((earlier && earlier.seq) || 0));
  const dropped = (k, name) => (was && (was[k] || []).includes(name) && !owns[k].includes(name) && !laterOwner(k, name))
    || (moved.length > 0 && ownedBy(moved.map((m) => stored[m]), k).has(name) && !live(k).has(name));
  // A collection name two sources own has two copies. `collections` holds the
  // last writer's, the name-keyed view every reader takes; `shared[name][source]`
  // holds each other source's, so pass C can read a library's own values and a
  // copy the last writer drops is replaced by another's, not lost. The stored
  // copy's writer is the owner with the highest `seq`; a tie (entries from before
  // `seq`) names no one, and that copy is kept nowhere else: another source writing
  // the name replaces it, as before `shared`.
  const self = (k) => k === id || alias.has(k);
  const writerOf = (name) => {
    const owners = Object.entries(stored).filter(([, v]) => v && v.owns && (v.owns.collections || []).includes(name));
    const top = Math.max(-1, ...owners.map(([, v]) => v.seq || 0));
    const at = owners.filter(([, v]) => (v.seq || 0) === top);
    return at.length === 1 ? at[0][0] : null;
  };
  const owner = (s, name) => !self(s) && sources[s] && !moved.includes(s) && ((sources[s].owns && sources[s].owns.collections) || []).includes(name);
  const shared = {};
  for (const [name, copies] of Object.entries(before.shared || {}))
    for (const [s, c] of Object.entries(copies)) if (owner(s, name)) (shared[name] = shared[name] || {})[s] = c;
  for (const name of Object.keys(incoming.collections || {})) {
    const w = (before.collections || {})[name] && writerOf(name);
    if (w && owner(w, name)) (shared[name] = shared[name] || {})[w] = before.collections[name];
  }
  // The copy shown for a name whose stored one is going: the latest other source's.
  const heir = (name) => Object.keys(shared[name] || {}).sort((a, b) => (sources[b].seq || 0) - (sources[a].seq || 0))[0];
  const collections = {};
  for (const [c, v] of Object.entries(before.collections || {})) {
    const w = writerOf(c);
    const going = dropped('collections', c) || (w && moved.includes(w));
    const h = going && heir(c);
    // a moved writer's copy with no live one kept goes: kept, a later write would file it as the live owner's
    if (h) { collections[c] = shared[c][h]; delete shared[c][h]; } else if (!going) collections[c] = v;
  }
  const merged = { ...canonical(before), collections: { ...collections, ...(incoming.collections || {}) } };
  const kept = Object.keys(shared).filter((n) => n in merged.collections && Object.keys(shared[n]).length).sort();
  if (kept.length) merged.shared = Object.fromEntries(kept.map((n) => [n, Object.fromEntries(Object.keys(shared[n]).sort().map((s) => [s, sortCollection(shared[n][s])]))]));
  for (const key of OWNED) {
    const m = byName((before[key] || []).filter((x) => !dropped(key, x.name)));
    for (const x of incoming[key] || []) m.set(x.name, x);
    merged[key] = [...m.values()];
  }
  // The file-level fields describe the merged store, not the last file.
  const all = { ...sources, ...source };
  return { _meta: { ...metaOf(incoming._meta), collections: Object.keys(merged.collections), sources: all }, ...merged };
}

/* ---- changes ------------------------------------------------------------ */

/*
 * ONE DETECTOR. What moved between two snapshots is found once, below, as
 * typed facts — each named by the rule in GRADE_RULES it falls under — and
 * everything that reports a change reads those facts: the change log's lists
 * and notes (`diff`, `specNotes`), the grade (`grade`), the docs site's
 * Changes page and the audit queue (both through `gradeOf`). There were two
 * detectors in this file, one for the notes and one for the grade, and on a
 * renamed layer the page said "Layers added, removed" beside a grade that said
 * "renamed". snapshot-standard rule 20.
 */

/**
 * rule → [figma, code, group, what a reader is told]. The levels are for the
 * designers' files that use the library and for the code built from it
 * (snapshot-standard rule 20, where the sources are). The group is the
 * change's type on the docs site — Added, Removed, Renamed, Restyled,
 * Changed, Deprecated, Docs — so the site types by the same table that grades. Renamed is
 * its own type because it is a patch to a Figma file and, where code uses
 * the name (tokens, props, modes), major for code;
 * Restyled is a value that moved, a size included (its grade, not its type,
 * says it can break a fixed layout); Changed is what is left (a retype, a
 * re-pointing, a new default). One table: a level, a group or
 * a wording is changed here and every reader agrees.
 */
const GRADE_RULES = {
  'collection-removed': ['major', 'major', 'Removed', 'a variable collection removed: bindings to it are left pointing at nothing, and its tokens leave the code'],
  'collection-renamed': ['patch', 'major', 'Renamed', 'a variable collection renamed: Figma bindings follow it, and the code’s file or prefix named after it changes'],
  'collection-added': ['minor', 'minor', 'Added', 'a variable collection added'],
  'mode-removed': ['major', 'major', 'Removed', 'a mode removed: frames set to it fall back to the default mode without a warning, and its theme leaves the code'],
  'mode-renamed': ['patch', 'major', 'Renamed', 'a mode renamed: Figma frames keep it, and the code’s theme name changes'],
  'mode-added': ['minor', 'minor', 'Added', 'a mode added'],
  'token-removed': ['major', 'major', 'Removed', 'variables removed: bindings to them are left holding a stale value, and their names leave the code'],
  'token-renamed': ['patch', 'major', 'Renamed', 'variables renamed: Figma bindings follow them, and their code names change'],
  'token-added': ['minor', 'minor', 'Added', 'variables added'],
  'token-retyped': ['major', 'major', 'Changed', 'a variable changed type: it was recreated, so every binding to the old one is lost'],
  'token-value': ['minor', 'minor', 'Restyled', 'token values moved'],
  'style-removed': ['major', 'major', 'Removed', 'a style removed: layers using it are detached, and its token leaves the code'],
  'style-renamed': ['patch', 'major', 'Renamed', 'a style renamed: Figma layers keep it, and its code name changes'],
  'style-added': ['minor', 'minor', 'Added', 'a style added'],
  'style-changed': ['minor', 'minor', 'Restyled', 'a style’s values moved'],
  'component-removed': ['major', 'major', 'Removed', 'removed from the library: placed instances keep rendering and never update again'],
  'component-renamed': ['patch', 'minor', 'Renamed', 'renamed: instances follow it, and anything that finds it by name needs the new one'],
  'component-added': ['minor', 'minor', 'Added', 'new component'],
  'component-deprecated': ['minor', 'minor', 'Deprecated', 'marked deprecated: instances keep working, and new work should use its replacement'],
  'prop-removed': ['major', 'major', 'Removed', 'a property removed: every instance loses the value it set, and a Code Connect mapping to it fails'],
  'slot-removed': ['major', 'major', 'Removed', 'a slot removed: every instance loses what was put in it'],
  'prop-retyped': ['major', 'major', 'Changed', 'a property changed type: it was recreated, so every instance falls back to its default'],
  'prop-renamed': ['patch', 'major', 'Renamed', 'a property renamed: instances keep their values, and the code prop it maps to is renamed'],
  'prop-added': ['minor', 'minor', 'Added', 'a property added'],
  'option-removed': ['major', 'major', 'Removed', 'a variant option removed: instances on it are left on a variant that no longer exists'],
  'option-renamed': ['patch', 'major', 'Renamed', 'a variant option renamed: instances follow it, and a Code Connect enum mapping keyed on the old value stops matching without failing'],
  'axis-renamed': ['patch', 'major', 'Renamed', 'a variant property renamed: instances follow it, and the code prop it maps to is renamed'],
  'option-added': ['minor', 'minor', 'Added', 'a variant option added'],
  'default-variant': ['patch', 'minor', 'Changed', 'the default variant changed: only new instances get it, and code defaults should follow'],
  'nested-repointed': ['major', 'minor', 'Changed', 'a nested instance points at another component or variant: overrides consumers made on it are dropped'],
  'layer-removed': ['major', 'minor', 'Removed', 'a layer removed: overrides consumers made on it are lost, and a mapping that names it fails'],
  'layer-renamed': ['patch', 'minor', 'Renamed', 'a layer renamed or moved: overrides follow it on update, and a mapping that names it needs the new name'],
  'layer-added': ['minor', 'patch', 'Added', 'a layer added'],
  'size-changed': ['major', 'minor', 'Restyled', 'its size changed: instances placed in fixed layouts may now overlap or leave gaps'],
  'values-changed': ['minor', 'minor', 'Restyled', 'its values moved'],
  'docs': ['patch', 'patch', 'Docs', 'its description or page changed'],
};
const RANK = { patch: 1, minor: 2, major: 3 };
// How many before-and-after rows one token fact keeps for the docs site; the
// count in its detail is always the whole.
const VALUE_ROWS = 200;
const higher = (a, b) => ((RANK[a] || 0) >= (RANK[b] || 0) ? a : b);
const jsonOf = (x) => JSON.stringify(x === undefined ? null : x);
const listOf = (xs, n = 6) => `${xs.slice(0, n).join(', ')}${xs.length > n ? ` +${xs.length - n}` : ''}`;
// Two slash paths that differ in exactly one segment: that segment's pair, or
// null. A rename respells one part of a name; two names that share a value and
// nothing else are a removal and an addition (snapshot-standard rule 20).
const segPair = (f, t) => { const A = String(f).split('/'), B = String(t).split('/'); if (A.length !== B.length) return null; const d = A.map((x, i) => (x !== B[i] ? i : -1)).filter((i) => i > -1); return d.length === 1 ? [A[d[0]], B[d[0]]] : null; };

/**
 * Tokens and styles as facts. A collection is paired by name, or else by what
 * it holds (nine in ten token names); a mode by name, or one-out-one-in with
 * the same values; a token by name, or a removed and an added one with the
 * same value in every mode and a name respelled in one segment; a style by name, or by an identical body. The
 * snapshot carries no variable ids, so a rename is paired from evidence, and
 * anything unpaired is a removal.
 */
function tokenFacts(bt, at) {
  const facts = [], fact = (rule, detail, extra) => facts.push({ rule, subject: 'tokens', detail, ...extra });
  const kind = (v) => (v && typeof v === 'object' ? (Array.isArray(v) ? 'list' : Object.keys(v).sort().join(',')) : typeof v);
  const cb = (bt && bt.collections) || {}, ca = (at && at.collections) || {};
  const tokenNames = (col) => new Set(Object.values(col.values || {}).flatMap((v) => Object.keys(v || {})));
  const overlap = (x, y) => { const X = tokenNames(x), Y = tokenNames(y); if (!X.size || !Y.size) return 0; let n = 0; for (const k of X) if (Y.has(k)) n++; return n / Math.max(X.size, Y.size); };
  const goneC = Object.keys(cb).filter((c) => !(c in ca)), newC = Object.keys(ca).filter((c) => !(c in cb));
  const pairs = Object.keys(ca).filter((c) => c in cb).map((c) => [c, c]);
  for (const c of goneC) {
    const twin = newC.filter((d) => overlap(cb[c], ca[d]) >= 0.9);
    if (twin.length === 1) { fact('collection-renamed', `${c} → ${twin[0]}`, { from: c, to: twin[0] }); pairs.push([c, twin[0]]); newC.splice(newC.indexOf(twin[0]), 1); }
    else fact('collection-removed', c, { names: [...tokenNames(cb[c])] });
  }
  for (const c of newC) fact('collection-added', c, { names: [...tokenNames(ca[c])] });
  for (const [cBefore, c] of pairs) {
    const b = cb[cBefore], a = ca[c];
    const bm = b.modes || [], am = a.modes || [];
    const goneM = bm.filter((m) => !am.includes(m)), newM = am.filter((m) => !bm.includes(m));
    if (goneM.length === 1 && newM.length === 1 && jsonOf((b.values || {})[goneM[0]]) === jsonOf((a.values || {})[newM[0]])) fact('mode-renamed', `${c}: ${goneM[0]} → ${newM[0]}`);
    else { for (const m of goneM) fact('mode-removed', `${c}: ${m}`); for (const m of newM) fact('mode-added', `${c}: ${m}`); }
    const shared = am.filter((m) => bm.includes(m));
    const names = (side, modes) => new Set(modes.flatMap((m) => Object.keys((side.values || {})[m] || {})));
    const bn = names(b, bm), an = names(a, am);
    // A token's value in a mode as a reader sees it: what it resolves to, and
    // the variable it aliases where it aliases one. An alias retargeted to a
    // variable of the same value is still a change: every theme that later
    // moves the new target moves this token with it.
    const cell = (side, m, n) => { const v = ((side.values || {})[m] || {})[n], al = ((side.alias || {})[m] || {})[n]; return al ? { value: v, alias: al } : { value: v }; };
    const valueOf = (side, n) => jsonOf(shared.map((m) => cell(side, m, n)));
    const rows = (names_, side, modes, key) => { const out = []; for (const n of names_) for (const m of modes) { if (out.length >= VALUE_ROWS) return out; out.push({ name: n, mode: m, [key]: cell(side, m, n) }); } return out; };
    const gone = [...bn].filter((n) => !an.has(n)), added = [...an].filter((n) => !bn.has(n));
    const pool = new Map();
    for (const n of added) { const v = valueOf(a, n); pool.set(v, (pool.get(v) || []).concat(n)); }
    const renamed = [], removed = [];
    // A rename keeps the value in every mode AND respells one segment of the
    // name: `a/old` and `b/new` both 8 are two tokens, not one moved, and
    // calling them a rename hid the removal Figma files feel.
    for (const n of gone) {
      const v = valueOf(b, n), cands = (pool.get(v) || []).filter((x) => segPair(n, x));
      if (cands.length === 1 && gone.filter((x) => valueOf(b, x) === v && segPair(x, cands[0])).length === 1) {
        renamed.push([n, cands[0]]);
        const left = pool.get(v).filter((x) => x !== cands[0]);
        if (left.length) pool.set(v, left); else pool.delete(v);
      } else removed.push(n);
    }
    const stillAdded = [...pool.values()].flat();
    if (removed.length) fact('token-removed', `${c}: ${removed.length} — ${listOf(removed)}`, { names: removed, values: rows(removed, b, bm, 'before') });
    if (renamed.length) fact('token-renamed', `${c}: ${renamed.length} — ${listOf(renamed.map(([x, y]) => `${x} → ${y}`), 3)}`, { pairs: renamed, values: renamed.slice(0, VALUE_ROWS).map(([x, y]) => ({ name: y, mode: '', before: { value: x }, after: { value: y } })) });
    if (stillAdded.length) fact('token-added', `${c}: ${stillAdded.length} — ${listOf(stillAdded)}`, { names: stillAdded, values: rows(stillAdded, a, am, 'after') });
    const retyped = new Set(), moved = [];
    for (const m of shared) {
      for (const n of an) {
        if (!bn.has(n)) continue;
        const x = cell(b, m, n), y = cell(a, m, n);
        if (jsonOf(x) === jsonOf(y)) continue;
        if (kind(x.value) !== kind(y.value)) retyped.add(n); else moved.push({ name: n, mode: m, before: x, after: y });
      }
    }
    const movedRows = moved.filter((r) => !retyped.has(r.name));
    const movedNames = [...new Set(movedRows.map((r) => r.name))];
    if (retyped.size) fact('token-retyped', `${c}: ${listOf([...retyped])}`, { names: [...retyped] });
    if (movedNames.length) fact('token-value', `${c}: ${movedNames.length}`, { names: movedNames, values: movedRows.slice(0, VALUE_ROWS) });
  }
  for (const [k, label] of [['textStyles', 'text style'], ['paintStyles', 'colour style'], ['effects', 'effect']]) {
    const b = byName(bt && bt[k]), a = byName(at && at[k]);
    const gone = [...b.keys()].filter((n) => !a.has(n)), fresh = [...a.keys()].filter((n) => !b.has(n));
    const body = (x) => { const { name, ...rest } = x; return jsonOf(rest); };
    for (const n of gone) {
      const twin = fresh.filter((f) => body(a.get(f)) === body(b.get(n)));
      if (twin.length === 1 && gone.filter((x) => body(b.get(x)) === body(b.get(n))).length === 1) { fact('style-renamed', `${label} ${n} → ${twin[0]}`, { pairs: [[`${label} ${n}`, `${label} ${twin[0]}`]] }); fresh.splice(fresh.indexOf(twin[0]), 1); }
      else fact('style-removed', `${label} ${n}`, { names: [`${label} ${n}`] });
    }
    for (const n of fresh) fact('style-added', `${label} ${n}`, { names: [`${label} ${n}`] });
    for (const [n, x] of a) {
      const o = b.get(n);
      if (!o || jsonOf(o) === jsonOf(x)) continue;
      const fields = Object.keys({ ...o, ...x }).filter((f) => jsonOf(o[f]) !== jsonOf(x[f]));
      fact('style-changed', `${label} ${n}: ${fields.map((f) => (typeof x[f] === 'object' || typeof o[f] === 'object' ? f : `${f} ${o[f] ?? '—'} → ${x[f] ?? '—'}`)).join(', ')}`, { names: [`${label} ${n}`] });
    }
  }
  return facts;
}

/**
 * A component's properties as facts. A VARIANT axis is a list of options;
 * anything else is its type. An axis whose options all reappear under one new
 * name, or the one property of a type swapped for the one new property of
 * that type, is a rename; one option out and one in on an axis is a renamed
 * option.
 */
function propFacts(op = {}, np = {}) {
  const facts = [], isAxis = Array.isArray, sorted = (v) => jsonOf([...v].sort());
  const goneP = Object.keys(op).filter((k) => !(k in np)), newP = Object.keys(np).filter((k) => !(k in op));
  for (const k of [...goneP]) {
    const twin = isAxis(op[k]) ? newP.filter((n) => isAxis(np[n]) && sorted(np[n]) === sorted(op[k])) : newP.filter((n) => !isAxis(np[n]) && np[n] === op[k]);
    const same = isAxis(op[k]) ? goneP.filter((x) => isAxis(op[x]) && sorted(op[x]) === sorted(op[k])) : goneP.filter((x) => !isAxis(op[x]) && op[x] === op[k]);
    if (twin.length === 1 && same.length === 1) {
      facts.push({ rule: isAxis(op[k]) ? 'axis-renamed' : 'prop-renamed', detail: `${k} → ${twin[0]}`, from: k, to: twin[0] });
      newP.splice(newP.indexOf(twin[0]), 1); goneP.splice(goneP.indexOf(k), 1);
    }
  }
  for (const k of goneP) facts.push({ rule: op[k] === 'SLOT' ? 'slot-removed' : 'prop-removed', detail: k, k });
  for (const k of newP) facts.push({ rule: 'prop-added', detail: k, k });
  for (const k of Object.keys(np)) {
    if (!(k in op)) continue;
    if (isAxis(op[k]) !== isAxis(np[k]) || (!isAxis(np[k]) && op[k] !== np[k])) { facts.push({ rule: 'prop-retyped', detail: `${k}: ${isAxis(op[k]) ? 'variant' : op[k]} → ${isAxis(np[k]) ? 'variant' : np[k]}`, k }); continue; }
    if (!isAxis(np[k])) continue;
    const out = op[k].filter((v) => !np[k].includes(v)), inn = np[k].filter((v) => !op[k].includes(v));
    if (out.length === 1 && inn.length === 1) facts.push({ rule: 'option-renamed', detail: `${k}: ${out[0]} → ${inn[0]}`, k });
    else { for (const v of out) facts.push({ rule: 'option-removed', detail: `${k}=${v}`, k }); for (const v of inn) facts.push({ rule: 'option-added', detail: `${k}=${v}`, k }); }
  }
  return facts;
}

/**
 * Layers, per variant both sides share, as facts: added and removed leaf
 * names; renamed (same parent, same type) or moved (same name, new parent),
 * which overrides follow; nested instances whose component KEY changed
 * (re-pointed: overrides on them are dropped) and whose key stayed while the
 * set's name changed (a rename of the nested set, which drops nothing); and
 * whether a variant root changed size. `names` are the component names the
 * two snapshots know: a nested instance's set is the longest of them its
 * reference starts with (graph.cjs `nameOf`), since a set's own name may
 * hold " / " (`Table - Cell / Fill / Size=md`).
 */
function layerFacts(rv, nv, names = []) {
  const A = new Map(rv.map((v) => [v.name, v])), B = new Map(nv.map((v) => [v.name, v]));
  const removed = new Map(), added = new Map(), repointed = [], setRenamed = [];
  let sized = false;
  const at = (tree) => { const m = new Map(); layerPaths(tree, (x, p) => { m.set(p, x); }); return m; };
  const keyOf = (z) => z.instanceOfKey || z.instanceOfId || null;
  const has = ((set) => (n) => set.has(n))(new Set(names));
  const setOf = (v) => nameOf(v, has);
  const variantOf = (v) => { const s = String(v || '').trim(), n = setOf(s); return s.slice(n.length).replace(/^\s*\/\s*/, ''); };
  for (const [name, va] of A) {
    const vb = B.get(name); if (!vb) continue;
    const wa = at(va), wb = at(vb);
    for (const [p, x] of wa) if (!wb.has(p)) removed.set(p, x);
    for (const [p, x] of wb) if (!wa.has(p)) added.set(p, x);
    for (const [p, x] of wa) {
      const y = wb.get(p); if (!y || !(x.instanceOf || keyOf(x))) continue;
      const leaf = p.split(' > ').pop();
      const kx = keyOf(x), ky = keyOf(y);
      // With keys, a changed key is a re-pointing and a kept one a rename. A
      // spec from before keys were recorded has only names: the set's name
      // changing while the variant part stays is read as the set renamed.
      const pointed = kx && ky ? kx !== ky : x.instanceOf !== y.instanceOf && !(setOf(x.instanceOf) !== setOf(y.instanceOf) && variantOf(x.instanceOf) === variantOf(y.instanceOf));
      if (pointed) repointed.push({ leaf, from: x.instanceOf, to: y.instanceOf });
      else if (x.instanceOf !== y.instanceOf && setOf(x.instanceOf) !== setOf(y.instanceOf)) setRenamed.push({ leaf, from: setOf(x.instanceOf), to: setOf(y.instanceOf) });
    }
    if (va.w !== vb.w || va.h !== vb.h) sized = true;
  }
  const parent = (p) => p.split(' > ').slice(0, -1).join(' > '), leaf = (p) => p.split(' > ').pop();
  /*
   * Pairing, one depth at a time, so a layer is judged under its parent's
   * new path once the parent is paired:
   *   1. under a paired parent, the same name and type is the same layer,
   *      and nothing happened to it (its path moved with the parent);
   *   2. moves (same name and type, new parent), then renames (same parent
   *      and type, new name), each only when one candidate fits: pairing a
   *      rename first took a moved layer's new place as some other layer's
   *      new name;
   *   3. instances renamed together — N out and N in under one parent, of
   *      one component (its key; before keys were recorded, its variant) —
   *      paired in order. Never plain layers, which carry no such evidence.
   *      One candidate per layer was the only rule, so five renamed items
   *      were five removals, graded major (one project, 1 October 2026), when a
   *      rename keeps every override.
   */
  const renamed = [], pathOf = new Map();
  const depth = (p) => p.split(' > ').length;
  const parentNow = (p) => (pathOf.has(parent(p)) ? pathOf.get(parent(p)) : parent(p));
  const pair = (p, q, quiet) => { if (!quiet) renamed.push({ from: leaf(p), to: leaf(q), moved: leaf(p) === leaf(q) }); removed.delete(p); added.delete(q); pathOf.set(p, q); };
  const deepest = Math.max(0, ...[...removed.keys()].map(depth));
  for (let d = 1; d <= deepest; d++) {
    const here = () => [...removed].filter(([p]) => depth(p) === d);
    for (const [p, x] of here()) {
      if (!pathOf.has(parent(p))) continue;
      const q = `${pathOf.get(parent(p))} > ${leaf(p)}`, y = added.get(q);
      if (y && y.type === x.type) pair(p, q, true);
    }
    for (const same of [(p, q) => leaf(q) === leaf(p), (p, q) => parent(q) === parentNow(p)]) {
      for (const [p, x] of here()) {
        const cand = [...added].filter(([q, y]) => y.type === x.type && same(p, q));
        if (cand.length === 1) pair(p, cand[0][0]);
      }
    }
    // grouped by parent, type and instance key, so an instance never pairs
    // with one of another component. An instance in a spec from before keys
    // were recorded is known by its variant, as a re-pointing is above (the
    // set renamed, its variant kept: one project's 21 September renames). A
    // plain layer is never grouped: `[Icon, Badge]` out and `[Divider,
    // Spacer]` in under one parent were paired as renames, a patch, and the
    // removal's major was lost (review of 2 October 2026, round 2).
    const which = (z) => keyOf(z) || (z.type === 'INSTANCE' && z.instanceOf ? `variant:${variantOf(z.instanceOf)}` : null);
    const groups = new Map(), id = (par, z) => `${par}\u0000${z.type}\u0000${which(z)}`;
    for (const [p, x] of here()) { if (!which(x)) continue; const k = id(parentNow(p), x); (groups.get(k) || groups.set(k, { from: [], to: [] }).get(k)).from.push(p); }
    for (const [q, y] of added) { if (!which(y)) continue; const g = groups.get(id(parent(q), y)); if (g) g.to.push(q); }
    for (const { from, to } of groups.values()) if (from.length === to.length) from.forEach((p, i) => pair(p, to[i]));
  }
  const leaves = (m) => [...new Set([...m.keys()].map(leaf))];
  const once = (xs, k) => xs.filter((x, i) => xs.findIndex((y) => k(y) === k(x)) === i);
  // re-pointings and set renames are kept per occurrence: a note counts the layers they touch
  return { removed: leaves(removed), added: leaves(added), renamed: once(renamed, (r) => r.from + '\u0000' + r.to), repointed, setRenamed, sized };
}

/** Marked deprecated: the word, not the stem — `Notice` renamed `Deprecation notice` is a rename. */
const deprecated = (x) => /\bdeprecated\b/i.test(`${(x && x.name) || ''} ${(x && x.page) || ''}`);

/**
 * Components paired by node id where both sides carry one, else by folder.
 * The id wins: a component deleted and recreated under the same name keeps
 * its folder and gets a new id, and every instance placed from the old one
 * is orphaned — a removal and an addition, not a change. The folder decided
 * first, and graded it a layer added.
 */
function pairComponents(sb = {}, sa = {}) {
  const idOf = (x) => (x && (x.id || x.key)) || null;
  const afterById = new Map(Object.entries(sa).map(([f, x]) => [idOf(x), f]).filter(([id]) => id));
  // Two node ids that disagree. Only `id`: a key changes when a file is
  // duplicated, and the node ids a duplicate keeps are what says it is the same.
  // Except across a variant set and a single component: a set collapsed to
  // its one surviving variant (or a component made a set) changes id with
  // the set node, while the variant instances point at keeps its own — the
  // folder pairs them, and the axes lost are graded as properties.
  // One project's `sidebar-primary-section`, 22 September 2026, was graded a
  // removal and an addition (review of 2 October 2026, round 2).
  const isSet = (x) => Object.values((x && x.props) || {}).some(Array.isArray);
  const recreated = (x, y) => !!(x && y && x.id && y.id && x.id !== y.id && isSet(x) === isSet(y));
  const pairs = [], removed = [], seen = new Set();
  for (const [f, was] of Object.entries(sb)) {
    const byId = afterById.get(idOf(was));
    const to = byId || (f in sa && !recreated(was, sa[f]) ? f : null);
    if (!to || seen.has(to)) { removed.push(f); continue; }
    seen.add(to); pairs.push([f, to]);
  }
  return { pairs, removed, added: Object.keys(sa).filter((f) => !seen.has(f)) };
}

/*
 * The fields the old snapshot recorded anywhere, library-wide: every key of
 * every node of every variant, and each binding as `bindings.<field>`. A
 * field outside it is one the plugin began to record, not a value a designer
 * set — the day the plugin learned to store effects, every shadow in the
 * library arrived at once — and neither the notes nor the grade call it a
 * change. Library-wide, not per component: a fill added to a component that
 * had none is still a fill added. The grade read it per component and the
 * notes not at all for bindings, so a 0.48 → 0.49 snapshot said "its values
 * moved" with no note, and Project C's padding bindings were notes
 * beside a grade that said nothing (review of 2 October 2026, round 3).
 */
function recordedFields(specs = {}) {
  const known = new Set();
  const add = (n) => { for (const k of Object.keys(n)) known.add(k); for (const k of Object.keys(n.bindings || {})) known.add(`bindings.${k}`); };
  for (const x of Object.values(specs)) {
    let vs; try { vs = resolve(x).variants || []; } catch { continue; }
    for (const v of vs) { add(v); layerPaths(v, add); }
  }
  return known;
}

/*
 * Which fields a grade reads across two snapshots. The rule above cannot
 * tell "the plugin did not record this then" from "no layer had this then":
 * the first rotation, opacity or shadow a library ever drew was graded as
 * nothing (review of 2 October 2026, round 4; Project C's Icosphere
 * turned on 16 September with no note). So where both snapshots say which
 * plugin release took them (`_meta.plugin`, 0.49.3 on) and it is the same,
 * every field counts; the absence rule is kept for pairs an older plugin
 * took, where nothing better is known.
 */
const ALL = { has: () => true };
/* The releases that took a snapshot: one per source file (`_meta.sources`),
   because a two-file project's last writer stamps `_meta.plugin` and the
   components may have come from the other file by an older release. Every
   field counts only where every file on both sides was taken by one release;
   a mixed pair, or a pair across a release, keeps the absence rule. */
const recorderOf = (s) => {
  const m = s && s.tokens && s.tokens._meta;
  if (!m) return null;
  const stamps = [...new Set(Object.values(m.sources || {}).map((x) => x && x.plugin).filter(Boolean))];
  if (!stamps.length) return m.plugin || null;
  return stamps.length === 1 ? stamps[0] : null;
};
function knownFor(before, after) {
  const was = recorderOf(before);
  return was && was === recorderOf(after) ? ALL : recordedFields((before && before.specs) || {});
}

/** The component names two snapshots' specs know, for resolving nested references. */
const namesOf = (...sides) => sides.flatMap((s) => Object.values(s || {}).map((x) => x && x.name).filter(Boolean));

/** Every component change as facts, one walk per changed component. */
function componentFacts(sb = {}, sa = {}, known = recordedFields(sb)) {
  const { pairs, removed, added } = pairComponents(sb, sa);
  const names = namesOf(sb, sa);
  const facts = [];
  for (const f of removed) facts.push({ rule: 'component-removed', subject: f });
  for (const f of added) facts.push({ rule: 'component-added', subject: f });
  for (const [from, to] of pairs) {
    const was = sb[from], now = sa[to], s = to, push = (rule, detail) => facts.push({ rule, subject: s, ...(detail ? { detail } : {}) });
    if (jsonOf(was) === jsonOf(now)) continue;
    // Marked deprecated is its own change, not a rename: systems that mark it
    // (GitLab Pajamas, Carbon, this toolkit's projects) put the word in the
    // component's or the page's name, and the rename that carries it is the
    // marking, so it is said once, as that.
    const marked = !deprecated(was) && deprecated(now);
    if (marked) push('component-deprecated', now.name);
    else if ((was.name || '') !== (now.name || '')) push('component-renamed', `${was.name} → ${now.name}`);
    if ((was.description || '') !== (now.description || '') || (!marked && (was.page || '') !== (now.page || ''))) push('docs');
    for (const p of propFacts(was.props, now.props)) push(p.rule, p.detail);
    let rv, nv;
    try { rv = resolve(was).variants || []; nv = resolve(now).variants || []; } catch { push('values-changed', 'the variants could not be compared'); continue; }
    if (was.default && now.default && was.default.name !== now.default.name && rv.some((v) => v.name === now.default.name)) push('default-variant', `${was.default.name} → ${now.default.name}`);
    const lf = layerFacts(rv, nv, names);
    if (lf.removed.length) push('layer-removed', listOf(lf.removed, 4));
    if (lf.renamed.length) push('layer-renamed', listOf(lf.renamed.map((r) => (r.moved ? `${r.from} moved` : `${r.from} → ${r.to}`)), 4));
    if (lf.added.length) push('layer-added', listOf(lf.added, 4));
    if (lf.repointed.length) push('nested-repointed', listOf([...new Set(lf.repointed.map((r) => r.leaf))], 4));
    if (lf.sized) push('size-changed');
    // A value the facts above already explain is not a second change: a
    // nested instance's reference, and, when the size moved, every width,
    // height and position, which a resize moves down the tree. Anything else
    // that moved beside a resize — a fill, a padding — is still said: the
    // size change used to swallow it.
    // One detector: the grade says "values moved" exactly where the notes a
    // reader sees say so (`specNotes`, rule values-changed). `specFields`
    // counted a paint said longer (IMAGE → IMAGE:FIT) and a node's first
    // binding of a field known nowhere, which the notes skip, so 80 grades
    // across four logs said values moved with no note to show (review of 2
    // October 2026, round 4).
    if (specNotes(was, now, known, names).some((n) => n.rule === 'values-changed')) push('values-changed');
  }
  return { pairs, removed, added, facts };
}

/**
 * A list of changes, rolled up for a reader: the highest level for each
 * audience, and the words for it. The Changes page and the audit queue both
 * say "breaking for code" through this, so they cannot word it two ways.
 */
function gradeOf(changes) {
  let figma = null, code = null;
  for (const c of changes || []) { figma = higher(figma, c.figma); code = higher(code, c.code); }
  const audience = figma === 'major' && code === 'major' ? 'Figma files and code' : figma === 'major' ? 'Figma files' : code === 'major' ? 'code' : null;
  const label = audience ? (audience === 'Figma files and code' ? 'Breaking' : `Breaking for ${audience}`) : figma || code ? ((RANK[higher(figma, code)] === 2) ? 'Minor' : 'Patch') : '';
  return { figma, code, audience, label };
}

/**
 * What moved between two snapshots, by name: the lists the change log keeps.
 * The docs site's "changed since the last snapshot" and the tracker's
 * "changed since review" both read this; a developer's commonest handoff
 * complaint is that designs change afterwards and nobody says which. Read
 * from the detector's facts, so the log and the grade cannot disagree.
 */
function diff(before, after) {
  const tf = tokenFacts(before.tokens, after.tokens);
  const pick = (rules, f) => tf.filter((x) => rules.includes(x.rule)).flatMap(f);
  const tokens = {
    added: [...pick(['token-added', 'style-added', 'collection-added'], (x) => x.names || []), ...pick(['mode-added'], (x) => [`mode ${x.detail}`])].sort(),
    removed: [...pick(['token-removed', 'style-removed', 'collection-removed'], (x) => x.names || []), ...pick(['mode-removed'], (x) => [`mode ${x.detail}`])].sort(),
    changed: pick(['token-value', 'token-retyped', 'style-changed'], (x) => x.names || []).sort(),
    renamed: [...pick(['token-renamed', 'style-renamed'], (x) => (x.pairs || []).map(([p, q]) => `${p} \u2192 ${q}`)),
              ...pick(['collection-renamed'], (x) => [`collection ${x.detail}`]), ...pick(['mode-renamed'], (x) => [`mode ${x.detail}`])],
  };
  /*
   * A RENAME IS ONE EVENT, NOT AN ADD AND A REMOVE. Specs carry the set's
   * node id, which a rename keeps; a removed folder and an added one with
   * the same id are the same component under a new name (`pairComponents`).
   * It is the change that silently breaks everything downstream — audit
   * rows, fingerprints, the framework map, doc pages — and a log that
   * reported it as "+1 −1" was the same silence the audit paid for all
   * afternoon: one library's four renames on 22 Sep were logged as +4 −4.
   *
   * WHICH fields moved, for each changed component: "changed" was one bit,
   * and a respell of every description logged "120 of 120 changed". Computed
   * only for the components that moved, so a 196-component write pays for
   * the few that did.
   */
  const sb = before.specs || {}, sa = after.specs || {};
  const { pairs, removed, added } = pairComponents(sb, sa);
  const known = knownFor(before, after), names = namesOf(sb, sa);
  const components = { added: added.sort(), removed: removed.sort(), changed: [], renamed: [], fields: {}, detail: {} };
  for (const [from, to] of pairs) {
    const x = sb[from], y = sa[to];
    if (from !== to) {
      const fields = specFields(x, y).filter((f) => f !== 'name');
      const notes = specNotes(x, y, known, names).filter((n) => n.what !== 'Name');
      components.renamed.push({ from: x.name, to: y.name, id: x.id || x.key || null, folder: to, ...(fields.length && { fields, notes }) });
      continue;
    }
    if (jsonOf(x) === jsonOf(y)) continue;
    components.changed.push(to);
    components.fields[to] = specFields(x, y);
    components.detail[to] = specNotes(x, y, known, names);
  }
  components.changed.sort();
  components.total = Object.keys(sa).length;
  return { tokens, components };
}

/**
 * What changed, said for a reader: one line per thing, the layer named, both
 * values shown — "Tab item: radius 0 → 8", "Variants added: Overflow=Left".
 * The component's own change log on its docs page is built from these. A
 * few lines per field, then "and N more"; a change too wide to list is
 * still counted.
 */
function specNotes(a, b, known = recordedFields({ a }), names = [a && a.name, b && b.name]) {
  const out = [];
  const j = (x) => JSON.stringify(x === undefined ? null : x);
  // A note is { what, before, after }: the subject, and both values as a
  // reader sees them. A field's name as a designer says it; a four-sided
  // padding that is all 8 is "8"; an enum is words; nothing is "none".
  const WORDS = { fills: 'fill', strokes: 'stroke', pad: 'padding', gap: 'gap', crossGap: 'gap between wrapped rows', radius: 'corner radius', strokeWeight: 'stroke width', opacity: 'opacity', effects: 'effects', effect: 'effect style', textStyle: 'text style', w: 'width', h: 'height', layout: 'layout', wrap: 'wrapping', align: 'alignment', sizing: 'sizing', textAutoResize: 'text sizing', lineHeight: 'line height', letterSpacing: 'letter spacing', fontSize: 'font size', hidden: 'visibility', clips: 'clipping', minmax: 'min and max size', x: 'position', y: 'position', text: 'text', truncate: 'truncation', maxLines: 'max lines', blendMode: 'blend mode', mask: 'mask', absolute: 'positioning', strokeAlign: 'stroke alignment', smoothing: 'corner smoothing', rotation: 'rotation', dashed: 'dashes', instanceOf: 'instance of' };
  const word = (k) => WORDS[k] || k;
  const show = (v) => {
    if (v === undefined || v === null || v === '') return 'none';
    if (Array.isArray(v)) { const u = [...new Set(v.map((x) => show(x)))]; return u.length === 1 ? u[0] : u.join(' / '); }
    if (typeof v === 'string') return /^[A-Z_]{3,}$/.test(v) ? v.toLowerCase().replace(/_/g, ' ') : v;
    if (typeof v === 'object') return Object.entries(v).map(([k, x]) => `${word(k)} ${show(x)}`).join(', ');
    return String(v);
  };
  // `items`, on a note that collapses several, keeps each one it stands for:
  // the docs site lists them when a reader opens the change.
  // `rule`, on a note the detector's facts account for, is the GRADE_RULES
  // rule of the change it belongs to: a reader joins a note to its graded
  // change on it, rather than deriving the pairing again from the wording.
  const note = (what, before, after, items, rule) => out.push({ what, before: before === undefined ? '' : String(before), after: after === undefined ? '' : String(after), ...(rule ? { rule } : {}), ...(items && items.length ? { items } : {}) });
  const list = (xs) => xs.join(', ');
  // Node ids and stamps are how the store finds things, not what a designer changed.
  const IDS = new Set(['id', 'key', 'instanceOfId', 'instanceOfKey']);
  const marked = !deprecated(a) && deprecated(b);
  if ((a.name || '') !== (b.name || '')) note('Name', a.name, b.name, null, marked ? 'component-deprecated' : 'component-renamed');
  if ((a.page || '') !== (b.page || '')) note('Page', a.page, b.page, null, marked ? 'component-deprecated' : 'docs');
  if ((a.description || '') !== (b.description || '')) note('Description', a.description || 'none', b.description || 'none', null, 'docs');
  const pa = a.props || {}, pb = b.props || {};
  const propsMoved = j(pa) !== j(pb);
  // Added, removed and renamed properties are the detector's facts, so a
  // renamed property is one line here as it is one change in the grade.
  const pf = propFacts(pa, pb);
  // the loudest of the facts one note stands for (an option out and two in)
  const loud = (r) => RANK[higher(GRADE_RULES[r][0], GRADE_RULES[r][1])];
  const loudest = (fs) => fs.map((f) => f.rule).sort((x, y) => loud(y) - loud(x))[0] || null;
  for (const f of pf) {
    if (f.rule === 'prop-renamed' || f.rule === 'axis-renamed') note('Property renamed', f.from, f.to, null, f.rule);
    else if (f.rule === 'prop-added') note(`Property ${f.k}`, 'none', Array.isArray(pb[f.k]) ? list(pb[f.k]) : String(pb[f.k]), null, f.rule);
    else if (f.rule === 'prop-removed' || f.rule === 'slot-removed') note(`Property ${f.k}`, Array.isArray(pa[f.k]) ? list(pa[f.k]) : String(pa[f.k]), 'none', null, f.rule);
  }
  for (const k of Object.keys(pb).filter((k) => k in pa && j(pa[k]) !== j(pb[k]))) note(`Property ${k}`, show(pa[k]), show(pb[k]), null, loudest(pf.filter((f) => f.k === k)));
  if (j(a.slots) !== j(b.slots)) note('Slot settings', '', 'changed');
  if (a.links && b.links && j(a.links) !== j(b.links)) note('Property links', '', 'changed');
  let ra, rb;
  try { ra = resolve(a).variants || []; rb = resolve(b).variants || []; } catch { note('Variants', 'could not be compared', ''); return out; }
  const na = new Set(ra.map((v) => v.name)), nb = new Set(rb.map((v) => v.name));
  const vAdded = [...nb].filter((n) => !na.has(n)), vRemoved = [...na].filter((n) => !nb.has(n));
  // A property change already says what the grid gained; the variant names it
  // produced are the same fact enumerated. Named only when nothing else explains them.
  if (!propsMoved) { if (vAdded.length) note('Variants added', 'none', list(vAdded)); if (vRemoved.length) note('Variants removed', list(vRemoved), 'none'); }
  else if (vAdded.length || vRemoved.length) note('Variants', String(ra.length), String(rb.length), null, loudest(pf));
  const binds = [], values = [];
  // Layers added, removed, renamed or moved, and nested instances re-pointed:
  // the detector's facts, the same ones the grade reads.
  const lf = layerFacts(ra, rb, names);
  const A = new Map(ra.map((v) => [v.name, v])), B = new Map(rb.map((v) => [v.name, v]));
  const walk = (tree) => { const at = {}; layerPaths(tree, (n, p) => { at[p] = n; }); at[''] = tree; return at; };
  const seen = new Set();
  // A field the old snapshot never recorded is the plugin's new record (`recordedFields`).
  for (const [name, va] of A) {
    const vb = B.get(name); if (!vb) continue;
    const wa = walk(va), wb = walk(vb);
    for (const p of Object.keys(wa)) {
      if (!(p in wb)) continue;
      const x = wa[p], y = wb[p], label = p ? p.split(' > ').pop() : (b.name || 'root');
      const bx = x.bindings || {}, by = y.bindings || {};
      for (const k of new Set([...Object.keys(bx), ...Object.keys(by)])) {
        if (!known.has(`bindings.${k}`) && bx[k] === undefined) continue;
        if (j(bx[k]) === j(by[k])) continue;
        const from = [].concat(bx[k] === undefined ? [] : bx[k]), to = [].concat(by[k] === undefined ? [] : by[k]);
        const key = `${label}|${k}|${j(from)}|${j(to)}`; if (seen.has(key)) continue; seen.add(key);
        binds.push({ label, k, from: [...new Set(from)], to: [...new Set(to)] });
      }
      const { children: _c, bindings: _b, name: _n, ...rx } = x, { children: _d, bindings: _e, name: _m, ...ry } = y;
      // A paint or style is stored by its token's NAME on the node (fills,
      // strokes, effect, text style), so a respelled token shows up here,
      // not under bindings; it is collapsed the same way.
      // …an instance's set name has slashes too, and is not a token.
      const tokenish = (v) => v !== undefined && [].concat(v).length > 0 && [].concat(v).every((s) => typeof s === 'string' && s.includes('/'));
      for (const k of new Set([...Object.keys(rx), ...Object.keys(ry)])) {
        // an instance reference both sides have is the detector's (re-pointed, or its set renamed); one that appears or goes is a value
        if (IDS.has(k) || (k === 'instanceOf' && rx[k] && ry[k]) || j(rx[k]) === j(ry[k])) continue;
        if (!known.has(k) && rx[k] === undefined) continue;
        // A paint the plugin began to record in more detail — `image` became
        // `IMAGE:FILL` — is the same paint said longer, not a design change.
        // Paints only: a text "Total" becoming "Total: 0" is a change.
        if ((k === 'fills' || k === 'strokes') && show(ry[k]).toLowerCase().split(':')[0] === show(rx[k]).toLowerCase()) continue;
        const key = `${label}|${k}|${j(rx[k])}|${j(ry[k])}`; if (seen.has(key)) continue; seen.add(key);
        if (k !== 'instanceOf' && tokenish(rx[k]) && tokenish(ry[k])) binds.push({ label, k, from: [...new Set([].concat(rx[k]))], to: [...new Set([].concat(ry[k]))] });
        else values.push({ what: `${label}: ${word(k)}`, before: show(rx[k]), after: show(ry[k]), k });
      }
    }
  }
  for (const l of lf.added) note(`Layer ${l}`, 'none', 'added', null, 'layer-added');
  for (const l of lf.removed) note(`Layer ${l}`, 'present', 'removed', null, 'layer-removed');
  for (const r of lf.renamed) note(`Layer ${r.from}`, 'present', r.moved ? 'moved' : `renamed to ${r.to}`, null, 'layer-renamed');
  /*
   * Token renames are one event, not one line per layer. When a binding
   * moves from `Colour/Text/strong` to `Color/Text/strong` the token was
   * respelled, and a hundred layers moved with it; the log says so once.
   * A rename is a path that differs from the old one in exactly one
   * segment; the same segment pair over three or more bindings is the
   * event, and the rest are listed as the changes they are.
   */
  const pairOf = (bd) => { const pairs = bd.from.length === bd.to.length ? bd.from.map((f, i) => segPair(f, bd.to[i])) : [null]; return pairs.every((x) => x && pairs[0] && x[0] === pairs[0][0] && x[1] === pairs[0][1]) ? pairs[0] : null; };
  const counts = new Map();
  for (const bd of binds) { const pr = pairOf(bd); if (pr) counts.set(pr.join('\u0000'), (counts.get(pr.join('\u0000')) || 0) + 1); }
  const collapsed = new Set([...counts.entries()].filter(([, n]) => n >= 3).map(([k]) => k));
  for (const k of [...collapsed].sort((x, y) => counts.get(y) - counts.get(x))) { const [f, t] = k.split('\u0000'); note(`Tokens renamed (${counts.get(k)} bindings)`, `${f}/…`, `${t}/…`, binds.filter((bd) => { const pr = pairOf(bd); return pr && pr.join('\u0000') === k; }).map((bd) => ({ what: `${bd.label}: ${word(bd.k)}`, before: show(bd.from), after: show(bd.to) })), 'values-changed'); }
  for (const bd of binds) { const pr = pairOf(bd); if (pr && collapsed.has(pr.join('\u0000'))) continue; note(`${bd.label}: ${word(bd.k)}`, show(bd.from), show(bd.to), null, 'values-changed'); }
  /*
   * Nested instances, from the detector: a set renamed under the same key is
   * one event however many layers it touches, and so is a re-pointing of
   * three or more layers between the same two components; fewer are named.
   */
  const groups = (xs) => { const m = new Map(); for (const r of xs) { const key = `${r.from}\u0000${r.to}`; m.set(key, (m.get(key) || []).concat(r)); } return m; };
  for (const [key, rs] of groups(lf.setRenamed)) { const [f, t] = key.split('\u0000'); note(`Nested component renamed (${rs.length} ${rs.length === 1 ? 'layer' : 'layers'})`, f, t, rs.map((r) => ({ what: r.leaf, before: r.from, after: r.to }))); }
  for (const [key, rs] of groups(lf.repointed)) {
    const [f, t] = key.split('\u0000');
    if (rs.length >= 3) note(`Instances re-pointed (${rs.length} layers)`, f, t, rs.map((r) => ({ what: r.leaf, before: r.from, after: r.to })), 'nested-repointed');
    else for (const r of rs) note(`${r.leaf}: instance of`, f, t, null, 'nested-repointed');
  }
  // a width, height or position beside a resize is the resize's, as the grade counts it
  for (const { k, ...v } of values) out.push({ ...v, rule: lf.sized && ['w', 'h', 'x', 'y'].includes(k) ? 'size-changed' : 'values-changed' });
  return out;
}

/**
 * The fields that differ between two specs of one component, in the order a
 * reader would ask: name, description, props, variants, layers, bindings,
 * values. `values` is everything else a layer carries — a size, a padding,
 * a fill — when nothing more specific explains the change.
 */
function specFields(a, b, ignore = [], known = null) {
  const out = [];
  const j = (x) => JSON.stringify(x === undefined ? null : x);
  if ((a.name || '') !== (b.name || '')) out.push('name');
  if ((a.page || '') !== (b.page || '')) out.push('page');
  if ((a.description || '') !== (b.description || '')) out.push('description');
  if (j(a.props) !== j(b.props)) out.push('props');
  if (j(a.slots) !== j(b.slots)) out.push('slots');
  if (a.links && b.links && j(a.links) !== j(b.links)) out.push('links');
  // The record's own fields — id, key, platform, figmaName — and nothing the
  // design shows: a spec re-stamped by a newer plugin is "identity", so a
  // changed component is never left with no label at all.
  const ident = (x) => j([x.id || null, x.key || null, x.platform || null, x.figmaName || null]);
  const rest = () => out.length === 0 && ident(a) !== ident(b);
  if (rest()) out.push('identity');
  let ra, rb;
  try { ra = resolve(a).variants || []; rb = resolve(b).variants || []; } catch { return out.concat('variants'); }
  const vnames = (vs) => vs.map((v) => v.name).sort();
  if (j(vnames(ra)) !== j(vnames(rb))) out.push('variants');
  // Per variant, by name: the layer paths, the bindings at each, and the rest.
  const byName = (vs) => new Map(vs.map((v) => [v.name, v]));
  const A = byName(ra), B = byName(rb);
  let layers = false, bindings = false, values = false;
  for (const [name, va] of A) {
    const vb = B.get(name); if (!vb) continue;
    // `known` (the grade's): a field the old snapshot never recorded is left out on both sides
    const drop = (o) => { const c = { ...o }; for (const k of ignore) delete c[k]; if (known) for (const k of Object.keys(c)) if (k !== 'children' && k !== 'bindings' && !known.has(k)) delete c[k]; if (known && c.bindings) c.bindings = Object.fromEntries(Object.entries(c.bindings).filter(([k]) => known.has(`bindings.${k}`))); return c; };
    const walk = (tree) => { const paths = [], binds = {}, rest = {}; layerPaths(tree, (n, p) => { paths.push(p); const { children, bindings, ...other } = drop(n); binds[p] = j(bindings); rest[p] = j(other); }); return { paths: paths.sort(), binds, rest }; };
    const wa = walk(va), wb = walk(vb);
    if (j(wa.paths) !== j(wb.paths)) layers = true;
    for (const p of wa.paths) if (p in wb.binds && wa.binds[p] !== wb.binds[p]) bindings = true;
    for (const p of wa.paths) if (p in wb.rest && wa.rest[p] !== wb.rest[p]) values = true;
    const { children: _c, bindings: rootA, ...restA } = drop(va), { children: _d, bindings: rootB, ...restB } = drop(vb);
    if (j(rootA) !== j(rootB)) bindings = true;
    if (j(restA) !== j(restB)) values = true;
  }
  if (layers) out.push('layers');
  if (bindings) out.push('bindings');
  if (values) out.push('values');
  return out;
}

/**
 * The same change, graded the way an API version would be, FOR EACH OF ITS
 * TWO AUDIENCES: the designers' files that use the library, and the code
 * built from it (snapshot-standard rule 20). Each fact the detector found
 * takes its levels, group and wording from GRADE_RULES.
 *
 * Returns `{ level, figma, code, changes, breaking, minor, patch }`: `changes`
 * is `[{ level, figma, code, group, rule, subject, what }]`, the three lists
 * are its lines by level, and `level` is `first` without a previous snapshot,
 * null when nothing moved, else BREAKING / minor / patch.
 */
function grade(before, after) {
  const g = { level: null, figma: null, code: null, changes: [], breaking: [], minor: [], patch: [] };
  if (!before || !before.tokens) return { ...g, level: 'first' };
  const facts = [...tokenFacts(before.tokens, after.tokens), ...componentFacts(before.specs, after.specs, knownFor(before, after)).facts];
  for (const f of facts) {
    const [figma, code, group, what] = GRADE_RULES[f.rule];
    g.changes.push({ level: higher(figma, code), figma, code, group, rule: f.rule, subject: f.subject, what: f.detail ? `${what} \u2014 ${f.detail}` : what, ...(f.values && f.values.length ? { values: f.values } : {}) });
  }
  const r = gradeOf(g.changes);
  g.figma = r.figma; g.code = r.code;
  for (const c of g.changes) (c.level === 'major' ? g.breaking : c.level === 'minor' ? g.minor : g.patch).push(c.subject === 'tokens' ? c.what : `${c.subject}: ${c.what}`);
  const top = higher(g.figma, g.code);
  g.level = top === 'major' ? 'BREAKING' : top || null;
  return g;
}

/**
 * A grade as the change log stores it: the level per audience and every
 * change with the rule that set it. The three line lists are the same facts
 * again, for printing, and are not stored. Null when nothing was graded.
 */
const storedGrade = (g) => (g && g.changes && g.changes.length ? { level: g.level, figma: g.figma, code: g.code, changes: g.changes } : null);

/** A grade as the lines a receiver prints under it: breaking and minor in full (six each), patches on one line. */
const gradeLines = (g) => [
  ...g.breaking.slice(0, 6).map((l) => `breaking: ${l}`),
  ...g.minor.slice(0, 6).map((l) => `minor: ${l}`),
  ...(g.patch.length ? [`patch: ${g.patch.slice(0, 6).join('; ')}${g.patch.length > 6 ? ` +${g.patch.length - 6}` : ''}`] : []),
];

const empty = (d) => ['tokens', 'components'].every((k) => ['added', 'removed', 'changed'].every((x) => !d[k][x].length)) && !(d.components.renamed || []).length && !(d.tokens.renamed || []).length;

/** Append one entry to the changes log, newest last. All of it is kept: a cap cut the backfilled history on the next snapshot. */
function recordChanges(file, entry) {
  if (empty(entry)) return false;
  const log = readJson(file, []);
  log.push(entry);
  writeIfChanged(file, text(log));
  return true;
}
/** The log as stored, and the whole of it written back — the backfill's way in, through this file. */
const readChanges = (file) => readJson(file, []);
const writeChanges = (file, entries) => writeIfChanged(file, text(entries));
const emptyChange = empty;



/* ---- writers ------------------------------------------------------------ */

/** Replace a folder's files of one extension with `wanted`, leaving others. */
function replaceFiles(dir, ext, wanted) {
  let written = 0;
  for (const [name, content] of wanted) if (writeIfChanged(path.join(dir, name), content)) written++;
  let removed = 0;
  if (fs.existsSync(dir)) {
    for (const f of fs.readdirSync(dir)) {
      if (f.endsWith(ext) && !wanted.has(f)) { fs.rmSync(path.join(dir, f)); removed++; }
    }
  }
  return { written, removed };
}

/**
 * A spec the library no longer has, in a repo where code lives beside specs.
 *
 * Removing the folder is right for an UNBUILT one: a folder holding only
 * figma.json is a backlog entry, and the backlog should not keep an entry the
 * design dropped. It is wrong for everything else. One receiver deleted a
 * whole built component because the designer fixed a typo in its name, and
 * another silently deleted the spec of every renamed built component, leaving
 * its code with nothing to measure against. A rename is not a removal.
 *
 * So: a folder with no figma.json was never the receiver's to manage; a
 * folder with code beside its spec is a decision for a person, kept and
 * named. Returns the removed and kept folders, and every dropped spec as it
 * was, for the changes log.
 */
function pruneSpecs(dir, keep) {
  const out = { removed: [], kept: [], before: {} };
  if (!fs.existsSync(dir)) return out;
  for (const d of fs.readdirSync(dir)) {
    const folder = path.join(dir, d);
    if (keep.has(d) || !fs.statSync(folder).isDirectory()) continue;
    const files = fs.readdirSync(folder);
    if (!files.includes('figma.json')) continue;
    out.before[d] = readJson(path.join(folder, 'figma.json'), null);
    // the contract is the receiver's own, derived from the spec beside it, not code
    if (files.filter((f) => f !== 'contract.json').length > 1) { out.kept.push(d); continue; }
    fs.rmSync(folder, { recursive: true, force: true });
    out.removed.push(d);
  }
  return out;
}

/* A stable digest, so a snapshot whose content did not move keeps its stamp. */
const hashOf = (text) => { let h = 5381; for (const c of text) h = (h * 33 + c.charCodeAt(0)) >>> 0; return h.toString(16); };
// currentColor, so a glyph takes the colour of the text it sits in; each
// project's own icon build did this itself, one of them also stripping the
// newlines between paths. The fill and the attributes' order change, nothing else:
// they are sorted, because Figma's cloud writes the same path with
// them in another order than the app (the MCP route, snapshot-standard rule 26).
const attrsOrdered = (svg) => svg.replace(/<([\w:-]+)((?:\s+[\w:-]+="[^"]*")+)(\s*\/?)>/g,
  (m, tag, attrs, end) => `<${tag} ${attrs.match(/[\w:-]+="[^"]*"/g).sort().join(' ')}${end}>`);
const glyph = (svg) => attrsOrdered(svg).replace(/fill="#[0-9a-fA-F]{3,8}"/g, 'fill="currentColor"');

/**
 * POST /library, for every project: one writer, the paths each project's
 * snapshot.config.json gives (a design-only project's are its folder in the
 * toolkit). Throws with the schema's own words when the payload is
 * malformed, before touching a file.
 *
 * Returns `{ lines }`: what to print, `{ label, text, detail }` each, most
 * important first.
 *
 * `version` is the release the snapshot is pinned to (version.cjs): an object,
 * null when a token found none, undefined when the project has no token.
 */
// a component's folder in the store: its name, after its library's platform where the library is routed with one
const folderOf = (name, platform = null) => (platform ? `${slug(platform)}-${slug(name)}` : slug(name));
function writeLibrary(p, P, { now = new Date(), platform = null, version, ids = [], files = [], deriveWith = {} } = {}) {
  const problems = payload.library(p);
  if (problems.length) throw new Error(`malformed library payload:\n    ${problems.slice(0, 8).join('\n    ')}`);
  /*
   * A file has two ids and either one identifies it (snapshot-standard 2): a
   * plugin before 0.67.0 run from the UI had no `fileKey` and sent the document id; one run
   * through the bridge has both. Specs are tracked by the file they came from,
   * and comparing that field against ONE of the two made a payload arriving
   * under the other id treat every spec this file had already stored as
   * another file's — kept, never pruned. Measured: eight specs of renamed
   * components survived a fresh snapshot, and the stored-spec read returned
   * 128 components for a file with 120. `ids` is the routing entry's pair;
   * the index converges on its first (the key where the project states one).
   */
  const fileId = p.tokens._meta.fileKey || p.tokens._meta.fileId;
  const thisFile = new Set([fileId, ...ids].filter(Boolean));
  const fileRef = ids[0] || fileId;
  const lines = [];
  const say = (label, text, detail = []) => lines.push({ label, text, detail });
  say('payload', `${p.components.length} components, ${(p.iconSets || []).length} icon sets named, ${p.icons.length} icon files`);

  const tokensBefore = readJson(P.tokens, null);
  const index = readJson(P.index, { components: {} });
  /*
   * A record under an identity no routed file claims belongs to a file that
   * moved: duplicated to a new key, its stamped id carried along. `files` is
   * every file the project routes, one [key, id] pair each. Judged only once
   * every one of them has reported under its current identity, so a moved
   * file's records are never dropped before it has written their successors.
   * Found when a project's two files moved to new keys and fourteen dropped
   * components kept docs pages, filed under keys nothing routed any more.
   */
  const reported = (tokensBefore && tokensBefore._meta && tokensBefore._meta.sources) || {};
  const claimed = new Set(files.flat());
  const settled = files.length > 0 && files.every((g) => g.some((i) => thisFile.has(i) || i in reported));
  const orphan = (f) => settled && !claimed.has(f);

  // Components, tracked by the file each came from. A file routed with a
  // platform (a mobile library beside a web one) keeps its components apart:
  // both draw a Button, and one folder per name would let the second file
  // overwrite the first.
  const key = (name) => folderOf(name, platform);
  const specsBefore = {}, specsAfter = {};
  const mine = new Set(), changed = [], noContract = [];
  // every name a component instance could resolve to: this library's and what the store already holds
  const known = [...p.components.map((c) => c.name), ...Object.values(index.components || {}).map((x) => x.name)];
  for (const c of p.components) {
    const s = key(c.name);
    mine.add(s);
    const spec = platform ? { ...compact(c), platform } : compact(c);
    const file = path.join(P.components, s, 'figma.json');
    const was = readJson(file, null);
    if (was) specsBefore[s] = was;
    specsAfter[s] = spec;
    if (writeIfChanged(file, text(spec))) changed.push(was ? s : `${s} (new)`);
    // the contract, derived beside it on every snapshot (tools/component-contract); one
    // that cannot be derived is named and never costs the snapshot
    // one that cannot be derived leaves no old contract behind to be read as current
    const cf = path.join(P.components, s, 'contract.json');
    try { writeIfChanged(cf, text(contract.derive(spec, known, deriveWith))); } catch (e) { fs.rmSync(cf, { force: true }); noContract.push(`${s}: ${e.message}`); }
    index.components[s] = { name: c.name, page: c.page, file: fileRef, ...(platform && { platform }) };
  }
  // A spec this file no longer has: removed when nothing is built on it,
  // kept and named when code sits beside it (pruneSpecs). Another file's
  // specs are never this file's to judge.
  const others = Object.entries(index.components).filter(([s, e]) => !thisFile.has(e.file) && !mine.has(s) && !orphan(e.file)).map(([s]) => s);
  const pruned = pruneSpecs(P.components, new Set([...mine, ...others]));
  Object.assign(specsBefore, pruned.before);
  for (const s of [...pruned.removed, ...pruned.kept]) delete index.components[s];
  say('components', changed.length ? `${changed.length} changed — ${changed.join(', ')}` : 'none changed', [
    ...pruned.removed.map((d) => `${d} is no longer in the library — its spec removed (nothing was built on it)`),
    ...pruned.kept.map((d) => `the library no longer has "${d}", and there is code beside its spec — left alone. A renamed component? Move the code to the new folder; a dropped one? Delete it.`),
    ...noContract.map((m) => `no contract derived — ${m}`),
  ]);

  // Tokens, with what the rest of the loop reads off them: the components and
  // icon sets the library names, and a stamp that moves only with content.
  // Collections and styles merge by name, so one another source file already
  // owns under this name is replaced by this file's in the name-keyed view
  // (a collection's other copy is kept under `shared`; a style's is not), and
  // both sources still list it in `owns`. Said, never silent. "Another"
  // is judged as mergeTokens judges it: every identity this file answers to is
  // this file, and a source no routed file claims (a moved file, before routing
  // has settled too) is not another file: the warning deletes nothing, so it need not wait.
  const selfIds = new Set([fileRef, p.tokens._meta.fileKey, p.tokens._meta.fileId, ...thisFile].filter(Boolean));
  const otherSources = Object.entries(reported).filter(([k]) => !selfIds.has(k) && !(claimed.size && !claimed.has(k)));
  const KINDS = [['collections', 'collection', Object.keys(p.tokens.collections || {})], ...OWNED.map((k) => [k, { textStyles: 'text style', paintStyles: 'paint style', effects: 'effect style' }[k], (p.tokens[k] || []).map((x) => x.name)])];
  for (const [k, noun, names] of KINDS) {
    const shared = names.map((c) => [c, otherSources.filter(([, s]) => s && s.owns && (s.owns[k] || []).includes(c)).map(([id, s]) => s.file || id)]).filter(([, by]) => by.length);
    if (shared.length) say('warning', `${shared.length} ${noun}(s) share a name with another source file's; the store shows this file's copy${k === 'collections' ? " and keeps other sources' copies under shared where it has them" : ', the other\'s is not kept'}`, shared.map(([c, by]) => `${c} — also owned by ${by.join(', ')}`));
  }
  const tokens = mergeTokens(tokensBefore, p.tokens, { iconSets: p.iconSets || [...new Set(p.icons.map((i) => i.name))], iconPage: p.iconPage || null, iconGroups: p.iconGroups || null, iconDescriptions: p.iconDescriptions || null, icons: p.icons, ref: fileRef, ids: [...thisFile], orphan });
  const { _meta: m, ...content } = tokens;
  const hash = hashOf(JSON.stringify({ t: content, c: p.components, i: p.icons.map((x) => [x.name, x.size, attrsOrdered(x.svg)]), is: p.iconSets, ip: p.iconPage || null, ig: p.iconGroups || null, id: p.iconDescriptions || null }));
  // nothing moved, so neither does the day each file was taken (toolkit-standard §D 23)
  const was = tokensBefore && tokensBefore._meta && tokensBefore._meta.hash === hash && tokensBefore._meta.sources;
  if (was) for (const [k, x] of Object.entries(m.sources || {})) { if (was[k] && was[k].at) x.at = was[k].at; if (was[k] && was[k].seq) x.seq = was[k].seq; }
  // Each file's own release beside its entry: a project routes several library
  // files, and the top-level stamp is only the last writer's (deliver.cjs pinned).
  if (m.sources && m.sources[fileRef]) m.sources[fileRef].version = version || null;
  tokens._meta = {
    file: m.file, fileKey: m.fileKey, fileId: m.fileId,
    // nothing moved, so neither does the stamp
    snapshotAt: tokensBefore && tokensBefore._meta && tokensBefore._meta.hash === hash ? tokensBefore._meta.snapshotAt : now.toISOString(),
    collections: m.collections, collectionCounts: m.collectionCounts,
    // Pinned to the release (version.cjs), or null: never omitted, so nothing
    // later reads its absence as "at the latest release".
    version: version || null,
    lineHeightNote: m.lineHeightNote, unrecorded: m.unrecorded, pages: m.pages, hash,
    // What the loop reads off the library: the components and icon sets it names.
    components: [...new Set(Object.values(index.components).map((e) => e.name))].sort(),
    icons: [...new Set(Object.values(m.sources || {}).flatMap((x) => (x.owns && x.owns.icons) || []))].sort(),
    sources: m.sources,
  };
  // Keys in the file's own order: _meta first, then the design.
  const ordered = { _meta: tokens._meta, ...content };
  say('tokens', writeIfChanged(P.tokens, text(ordered)) ? 'written' : 'identical to the last snapshot — nothing written');
  if (version !== undefined) {
    if (!version) say('pinned', 'no publish recorded (never published, or the token cannot read it)');
    else say('pinned', `the library publish of ${version.at}`, version.editedSince && version.editedSince > version.at
      ? [`edited at ${version.editedSince}, after its last publish — this may hold unpublished work. If that edit was publishable, publish and snapshot again.`] : []);
  }

  // Assets: each set replaced only when the payload carries it, so a run with
  // images switched off keeps the files the last run wrote. Only this file's
  // own are pruned, by the names the index says it wrote: a mobile library's
  // icons must not erase the web library's. A store from before the index
  // kept names has no record, and falls back once to replacing the whole set.
  const owned = (index.assets ||= {});
  const assets = (kind, dir, ext, wanted) => {
    const mineA = (owned[kind] ||= {});
    // Owned under either of the file's ids; converges on the routing key.
    const before = mineA[fileRef] || [...thisFile].map((i) => mineA[i]).find(Boolean);
    for (const i of thisFile) if (i !== fileRef) delete mineA[i];
    const theirs = Object.keys(mineA).filter(orphan).flatMap((k) => { const l = mineA[k]; delete mineA[k]; return l; });
    let r;
    if (!before && Object.keys(mineA).length === 0) r = replaceFiles(dir, ext, wanted);
    else {
      r = { written: 0, removed: 0 };
      for (const [f, content] of wanted) if (writeIfChanged(path.join(dir, f), content)) r.written++;
      const kept = new Set(Object.entries(mineA).filter(([k]) => k !== fileRef).flatMap(([, l]) => l));
      for (const f of [...(before || []), ...theirs]) {
        if (!wanted.has(f) && !kept.has(f) && fs.existsSync(path.join(dir, f))) { fs.rmSync(path.join(dir, f)); r.removed++; }
      }
    }
    mineA[fileRef] = [...wanted.keys()].sort();
    return `${r.written} written, ${r.removed} removed`;
  };
  // Two sets under one name write one file and count as one icon: the second
  // replaces the first on disk and nothing else in the run says so. One
  // project's icon page held a name twice; 199 sets stored as 198 icons.
  const twice = [...new Set((p.iconSets || []).filter((n, i, a) => a.indexOf(n) !== i))];
  if (twice.length) say('icons', `named twice on the icon page, one file each: ${twice.join(', ')}`);
  if (p.icons.length) say('icons', assets('icons', P.icons, '.svg', new Map(p.icons.map((i) => [`${slug(i.name)}-${i.size}.svg`, glyph(i.svg)]))));
  else if ((p.iconSets || []).length) say('icons', `export was off; ${p.iconSets.length} sets named, the files on disk stand`);
  // A project whose graphics come from elsewhere sets `paths.graphics` to false.
  if (P.graphics && (p.graphics || []).length) say('graphics', assets('graphics', P.graphics, '.png', previewFiles(p.graphics, slug)));
  if ((p.previews || []).length) {
    let written = 0;
    const files = previewFiles(p.previews, key);
    for (const [f, bytes] of files) if (writeIfChanged(path.join(P.previews, f), bytes)) written++;
    // Only this file's previews are pruned: another file's stay. One of its
    // own goes when this run did not send it (a dark render the library lost).
    let removed = 0;
    if (fs.existsSync(P.previews)) {
      for (const f of fs.readdirSync(P.previews)) {
        const s = f.replace(/(\.dark|\.anatomy|\.variant-[^.]+(\.dark)?)?\.(png|json)$/, '');
        if (/\.(png|json)$/.test(f) && (mine.has(s) ? !files.has(f) : index.components[s] === undefined)) { fs.rmSync(path.join(P.previews, f)); removed++; }
      }
    }
    say('previews', `${written} written, ${removed} removed`);
  }
  writeIfChanged(P.index, text(index));

  // What moved: logged by name for the docs and the tracker, and graded.
  const before = { tokens: tokensBefore, specs: specsBefore }, after = { tokens, specs: specsAfter };
  // The file is logged by IDENTITY, never by the name it had that day: a
  // rename otherwise splits one file's history into two (projects.cjs,
  // "ONE FILE, ONE IDENTITY"), and a reader names it at the point it reads.
  const g = grade(tokensBefore && before, after);
  if (tokensBefore && recordChanges(P.changes, { at: now.toISOString(), file: p.tokens._meta.fileKey || p.tokens._meta.fileId || p.tokens._meta.file, ...diff(before, after), ...(storedGrade(g) && { grade: storedGrade(g) }) })) say('changes', 'recorded');
  say('grade', g.level === 'first' ? 'first snapshot of this library' : g.level || 'no change', gradeLines(g));
  return { lines };
}

/*
 * A screen's folder name, from the frame-name taxonomy of snapshot-standard rule 24.
 * A frame is named `<Section> <flow>-<step> - <Screen>[ - <State>]` —
 * `<Projects> 3-3 - Rename dialog - Error` — and its folder is its section,
 * its page and its name without the prefix or the numbers:
 * `projects--main-screens--rename-dialog-error`. The prefix is the section the
 * frame sits in (its page, in a file with no sections), so a name says where
 * it belongs and a frame moved without renaming is caught. The numbers are
 * order only, so reordering a flow renames nothing.
 *
 * It replaces a scheme that keyed on the frame name and fell back to the page
 * NAME: two sections each with a "-- Main screens" drawing "2-1 - List" were
 * one key, both were dropped, and a reader called the projects list a
 * duplicate in the design for a day (13 Oct). Nothing is written from a name
 * the taxonomy refuses, and nothing from two frames that would share a folder
 * or a number on one page: the caller refuses the whole snapshot and names
 * each, because a frame skipped quietly is a screen measured stale.
 */
const STATES = ['Initial', 'Empty', 'Filled', 'In progress', 'Ready', 'Error', 'Success', 'Scrolled', 'Selected', 'Menu open', 'No results', 'Deleted', 'Expired'];
const FRAME_NAME = /^<([^>]+)> (\d+)-(\d+) - (\S.*)$/;
function screenIds(ready, states = []) {
  const vocabulary = new Set([...STATES, ...states]);
  const ids = new Map(), problems = [];
  const where = (s) => [s.section, s.page, s.frame].filter(Boolean).join(' / ');
  const plain = (name) => name.replace(/^[-\s]+/, '').trim();
  const seen = new Map();
  const once = (key, s, what) => {
    if (!seen.has(key)) { seen.set(key, s); return true; }
    problems.push(`${where(s)} — the same ${what} as ${seen.get(key).frame}`);
    return false;
  };
  for (const s of ready) {
    const place = plain(s.section || s.page);
    const m = FRAME_NAME.exec(s.frame);
    if (!m) { problems.push(`${where(s)} — not "<Section> <flow>-<step> - <Screen>[ - <State>]", e.g. "<${place}> 3-3 - Rename dialog - Error"`); continue; }
    const [, prefix, flow, step, rest] = m;
    if (prefix.toLowerCase() !== place.toLowerCase()) { problems.push(`${where(s)} — starts <${prefix}> but sits in ${place}: rename it <${place[0]}${place.slice(1).toLowerCase()}> …, or move it`); continue; }
    const [screen, state, ...more] = rest.split(' - ');
    if (more.length) { problems.push(`${where(s)} — one state at most`); continue; }
    if (!/^[A-Z0-9]/.test(screen)) { problems.push(`${where(s)} — "${screen}" starts with a capital`); continue; }
    if (state !== undefined && !vocabulary.has(state.replace(/ \d+$/, ''))) {
      problems.push(`${where(s)} — "${state}" is not a state (${[...vocabulary].join(', ')}; a project adds its own in snapshot.config.json screens.states)`);
      continue;
    }
    const page = slug(s.page), section = s.section && slug(s.section) !== page ? slug(s.section) : null;
    const id = [section, page, slug(rest)].filter(Boolean).join('--');
    if (!once(`id ${id}`, s, 'screen and state') | !once(`n ${section}/${page}/${flow}-${step}`, s, 'number')) continue;
    ids.set(s, id);
  }
  return { ids, problems };
}

/*
 * What changed on a frame since the last snapshot, in layers and properties
 * rather than a diff of two 4,000-line files. Content — sample text and the
 * boxes that move with it — is counted, not listed, so a changed sample does
 * not bury a changed binding.
 */
function screenChanges(oldTree, newTree) {
  const walk = (tree) => { const out = new Map(); layerPaths(tree, (node, p) => { out.set(p, node); }); return out; };
  const o = walk(oldTree), n = walk(newTree);
  const content = new Set(['x', 'y', 'w', 'h', 'text', 'visual']);
  const short = (v) => { const t = v === undefined ? '—' : JSON.stringify(v); return t.length > 60 ? t.slice(0, 57) + '…' : t; };
  const lines = [];
  let moved = 0;
  for (const p of o.keys()) if (!n.has(p)) lines.push(`− ${p}`);
  for (const p of n.keys()) if (!o.has(p)) lines.push(`+ ${p}`);
  for (const [p, node] of n) {
    const was = o.get(p);
    if (!was) continue;
    for (const k of new Set([...Object.keys(was), ...Object.keys(node)])) {
      if (k === 'children' || k === 'id' || JSON.stringify(was[k]) === JSON.stringify(node[k])) continue;
      if (content.has(k)) { moved++; continue; }
      lines.push(`~ ${p} ${k}: ${short(was[k])} → ${short(node[k])}`);
    }
  }
  return { lines, moved };
}

/* A run's detail, kept in a file rather than scrolled past; the newest five. */
function keepLog(dir, kind, text, now) {
  if (!dir) return null;
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${kind}-${now.toISOString().replace(/[:.]/g, '-')}.log`);
  fs.writeFileSync(file, text);
  for (const old of fs.readdirSync(dir).filter((f) => new RegExp(`^${kind}-\\d`).test(f)).sort().slice(0, -5)) fs.rmSync(path.join(dir, old));
  return file;
}

/**
 * POST /screens, for every project. Only frames the designer marked Ready for
 * dev are written — Figma's own status, visible where they work — and the rest
 * are named, so a forgotten mark is visible rather than a screen quietly
 * missing. A frame no longer marked is kept on disk and named: a mapping may
 * still measure it, and deleting it is a person's decision.
 *
 * Returns `{ lines }`, or `{ lines, refused }` when writing would be wrong.
 */
function writeScreens(p, P, { now = new Date(), version, states = [], ids: routed = [] } = {}) {
  const problems = payload.screens(p);
  if (problems.length) throw new Error(`malformed screens payload:\n    ${problems.slice(0, 8).join('\n    ')}`);
  const fileId = p._meta.fileKey || p._meta.fileId;
  const lines = [];
  const say = (label, text, detail = []) => lines.push({ label, text, detail });
  const refuse = (why) => ({ lines, refused: why });
  // Three ways a snapshot can look like a pass and write nothing true: no
  // frames at all; a plugin older than 0.7.2, which sends no ready status, so
  // every draft would enter; and frames sent with none marked, where writing
  // would empty the screens and orphan every mapping.
  if (!p.screens.length) return refuse('the file has no frames to snapshot, so nothing was written.');
  if (!p.screens.some((s) => 'devStatus' in s)) return refuse('this copy of the plugin is too old (before 0.7.2) to say which frames are ready for dev. Reload it (Plugins › Development › Reload), then snapshot again.');
  const ready = p.screens.filter((s) => s.tree), drafts = p.screens.filter((s) => !s.tree);
  if (!ready.length) return refuse(`none of the ${drafts.length} frames is marked ready for dev, so nothing was written. Mark the frames to hand over as Ready for dev in Figma, then snapshot again.`);

  const index = readJson(P.index, { components: {} });
  const owned = ((index.assets ||= {}).screens ||= {});
  /* The file's other id: frames stored under the document id, from runs that had no key, are this file's too
     (plugin 0.67.0 sends the key). Folded onto the key, or renamed-frame matching loses them; only an id the
     project's routing lists for this file, since a duplicate carries its original's id and would take its frames. */
  for (const other of [p._meta.fileId, p._meta.fileKey].filter((x) => x && x !== fileId && routed.includes(x))) {
    if (owned[other]) { owned[fileId] = [...new Set([...(owned[fileId] || []), ...owned[other]])].sort(); delete owned[other]; }
    if (index.screens && index.screens[other]) { index.screens[fileId] ||= index.screens[other]; delete index.screens[other]; }
  }
  if (ready.some((s) => !('section' in s))) return refuse('this copy of the plugin is too old (before 0.57.0) to say which section each frame is in. Reload it (Plugins › Development › Reload), then snapshot again.');
  const { ids, problems: misnamed } = screenIds(ready, states);
  if (misnamed.length) return { lines: [{ label: 'misnamed', text: `${misnamed.length} frame(s) the naming refuses — rename in Figma, then snapshot again`, detail: misnamed }], refused: `${misnamed.length} ready frame(s) have a name the screen naming cannot read, so nothing was written. First: ${misnamed[0]}. Rename them as "<Section> 1-2 - Screen - State", then snapshot again.` };
  const changes = [];
  let images = 0;
  /*
   * A RENAMED FRAME IS ONE FRAME. Its node id survives the rename, so a stored
   * folder this post does not write, holding a node the post writes under
   * another name, is that frame's old folder: compared against, then removed.
   * Kept, it sat beside its successor as a second screen — `2-1 - Selected`
   * renamed `2-1 - Selection - Some selected` left both on disk on 1 Oct, and
   * the project's mapping went on measuring the dead one. A frame that merely
   * stops being ready has no successor and still stays.
   */
  const written = new Set(ids.values());
  const byNode = new Map();
  for (const d of owned[fileId] || []) {
    const old = !written.has(d) && readJson(path.join(P.screens, d, 'figma.json'), null);
    if (old && old.id) byNode.set(old.id, d);
  }
  const renamed = [];
  /* A designer's annotations (plugin 0.58.0), by layer: every one is counted,
     and one that is new or changed since the stored frame is listed whole —
     a note is behaviour to build, and a note nobody reads is how it is lost. */
  const said = (list) => list.map((x) => `${x.category ? `[${x.category}] ` : ''}${x.text}${x.properties ? ` (${x.properties.join(', ')})` : ''}`).join(' · ');
  const notesIn = (tree) => {
    const m = new Map();
    if (!tree) return m;
    if (tree.notes) m.set('(the frame)', said(tree.notes));
    layerPaths(tree, (n, at) => { if (n.notes) m.set(at, said(n.notes)); });
    return m;
  };
  const notes = { total: 0, screens: 0, fresh: [] };
  for (const [s, id] of ids) {
    const dir = path.join(P.screens, id);
    const spec = { name: s.frame, section: s.section, page: s.page, id: s.id, devStatus: s.devStatus, tree: s.tree };
    let was = readJson(path.join(dir, 'figma.json'), null);
    const from = !was && byNode.get(s.id);
    if (from) { was = readJson(path.join(P.screens, from, 'figma.json'), null); renamed.push({ from, to: id }); }
    if (!was) changes.push({ id, lines: ['+ new frame'], moved: 0 });
    else {
      const c = screenChanges(was.tree, s.tree);
      if (from) changes.push({ id, ...c, lines: [`renamed from ${from}`, ...c.lines] });
      else if (c.lines.length || c.moved) changes.push({ id, ...c });
    }
    const now = notesIn(s.tree), before = notesIn(was && was.tree);
    if (now.size) { notes.total += now.size; notes.screens++; }
    for (const [at, t] of now) if (before.get(at) !== t) notes.fresh.push(`${id} · ${at}: ${t.replace(/\s+/g, ' ')}`);
    writeIfChanged(path.join(dir, 'figma.json'), text(spec));
    if (s.image && s.image.data) { writeIfChanged(path.join(dir, `reference@${s.image.scale}x.png`), Buffer.from(s.image.data, 'base64')); images++; }
  }
  for (const { from } of renamed) fs.rmSync(path.join(P.screens, from), { recursive: true, force: true });
  const gone = (owned[fileId] || []).filter((d) => !written.has(d) && fs.existsSync(path.join(P.screens, d)));
  owned[fileId] = [...new Set([...written, ...gone])].sort();
  // The release this snapshot is pinned to, and when it last moved, per file.
  const meta = ((index.screens ||= {})[fileId] ||= {});
  const hash = hashOf(JSON.stringify(ready.map((s) => [s.page, s.frame, s.tree])));
  Object.assign(meta, { file: p._meta.file || null, snapshotAt: meta.hash === hash ? meta.snapshotAt : now.toISOString(), hash, version: version || null });
  writeIfChanged(P.index, text(index));

  say('ready', `${ready.length} of ${p.screens.length} frames marked ready for dev${images ? `, ${images} exported as images` : ''}`);
  const fresh = changes.filter((c) => c.lines[0] === '+ new frame'), moved = changes.filter((c) => /^renamed from /.test(c.lines[0]));
  const edited = changes.filter((c) => !fresh.includes(c) && !moved.includes(c));
  const list = (xs) => (xs.length <= 6 ? xs.join(', ') : `${xs.length}`);
  say('changed', changes.length ? `${fresh.length} new, ${moved.length} renamed, ${edited.length} edited` : 'none since the last snapshot', [
    ...(fresh.length ? [`new: ${list(fresh.map((c) => c.id))}`] : []),
    ...(renamed.length ? [`renamed: ${list(renamed.map((r) => `${r.from} → ${r.to}`))}`] : []),
    ...(edited.length ? [`edited: ${list(edited.map((c) => c.id))}`] : []),
  ]);
  if (gone.length) say('no longer ready', `${list(gone)} (kept on disk)`);
  if (notes.total) say('notes', `${notes.total} annotated layer(s) on ${notes.screens} screen(s)${notes.fresh.length ? `, ${notes.fresh.length} new or changed — build each, or say in the mapping why not` : ', none new'}`, notes.fresh);
  if (drafts.length) say('passed over', `${list(drafts.map((d) => `${d.page} / ${d.frame}`))} (not marked ready)`);
  const log = changes.length && keepLog(P.logs, 'screens', changes.map((c) => `${c.id}${c.moved ? ` — ${c.moved} content move(s)` : ''}\n${c.lines.map((l) => `    ${l}`).join('\n')}`).join('\n\n') + '\n', now);
  if (log) say('detail', log);
  if (version !== undefined) {
    if (!version) say('pinned', 'no named version recorded');
    else say('pinned', `the named version "${version.label}" of ${version.at}`, version.editedSince && version.editedSince > version.at
      ? [`edited at ${version.editedSince}, after its last named version — this may hold unreleased work; save a named version and snapshot again if it was meant for the release`] : []);
  }
  // What Figma holds back: a renderable property on a layer the snapshot does not send.
  const unrecorded = p._meta.unrecorded || [];
  if (unrecorded.length) say('warning', `${unrecorded.length} renderable propert${unrecorded.length === 1 ? 'y is' : 'ies are'} on a layer and not in the snapshot: ${unrecorded.slice(0, 8).join(', ')}${unrecorded.length > 8 ? ' …' : ''}`);
  // A frame binding a name the library no longer has has not taken the
  // library update: its values compare as nothing, and it reads exactly like
  // a wrong page in the report.
  const lib = readJson(P.tokens, null);
  if (lib) {
    const known = new Set([...Object.values(lib.collections || {}).flatMap((c) => Object.values(c.values || {}).flatMap(Object.keys)), ...['textStyles', 'paintStyles', 'effects'].flatMap((k) => (lib[k] || []).map((x) => x.name))]);
    const stale = new Map();
    const bound = (n, id) => {
      const names = [...['fills', 'strokes'].flatMap((k) => n[k] || []), ...Object.values(n.bindings || {}).flat()];
      // a raw colour with an alpha, rgb(r g b / a), carries a slash too
      for (const v of names) if (typeof v === 'string' && v.includes('/') && !v.startsWith('rgb(') && !known.has(v)) (stale.get(v) || stale.set(v, new Set()).get(v)).add(id);
      (n.children || []).forEach((c) => bound(c, id));
    };
    for (const [s, id] of ids) bound(s.tree, id);
    if (stale.size) say('warning', `the file binds ${stale.size} name(s) the library no longer has — it has not taken the library update (Assets › Libraries › Update, then snapshot again)`, [...stale].slice(0, 8).map(([n, f]) => `${n} — ${[...f].slice(0, 4).join(', ')}${f.size > 4 ? ` +${f.size - 4}` : ''}`));
  }
  return { lines };
}

/**
 * A stored screen by id, or every one: the one way anything reads them — `{ id, name, page,
 * figmaId, devStatus, tree, reference }` — `id` the folder (what a mapping
 * names), `reference` the frame's exported picture when there is one.
 */
/** A stored component spec, the one reader of `<components>/<folder>/figma.json`: resolved, so a delta variant reads
    whole (a delta read flat is the trap spec.cjs exists for), or as stored with `{ compact: true }`; null where the
    folder has none. One that does not parse throws, naming it: a broken stored spec is a finding, never a component
    quietly left out. About ten tools read the file themselves, each resolving or not, and two never resolved. */
function readSpec(dir, folder, { compact: asStored = false } = {}) {
  const file = dir && path.join(dir, folder, 'figma.json');
  if (!file || !fs.existsSync(file)) return null;
  let spec;
  try { spec = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { throw new Error(`${file} does not parse: ${e.message}`); }
  return asStored ? spec : resolve(spec);
}
/** Every stored component spec in a library folder, in folder order: `[{ folder, spec }]`. */
function readSpecs(dir, opts) {
  if (!dir || !fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name).sort()
    .map((folder) => ({ folder, spec: readSpec(dir, folder, opts) })).filter((x) => x.spec);
}
function readScreen(dir, id) {
  const spec = dir && readJson(path.join(dir, id, 'figma.json'), null);
  if (!spec) return null;
  const ref = fs.readdirSync(path.join(dir, id)).find((f) => /^reference@\d+(\.\d+)?x\.png$/.test(f));
  return { id, name: spec.name, page: spec.page, figmaId: spec.id, devStatus: spec.devStatus, tree: spec.tree,
    reference: ref ? { file: path.join(dir, id, ref), scale: +ref.match(/@([\d.]+)x/)[1] } : null };
}
function readScreens(dir) {
  if (!dir || !fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).filter((e) => e.isDirectory())
    .map((e) => readScreen(dir, e.name)).filter(Boolean).sort((a, b) => compareNames(a.id, b.id));
}

/** Each preview's files: `<name>.png`; `<name>.dark.png` with a dark render;
    `<name>.anatomy.png` and `.anatomy.json` (size and parts) with an anatomy. */
function previewFiles(list, name) {
  return new Map(list.flatMap((g) => {
    const n = name(g.name);
    const { png, ...anatomy } = g.anatomy || {};
    return [[`${n}.png`, Buffer.from(g.png, 'base64')],
      ...(g.dark ? [[`${n}.dark.png`, Buffer.from(g.dark, 'base64')]] : []),
      ...(g.anatomy ? [[`${n}.anatomy.png`, Buffer.from(png, 'base64')], [`${n}.anatomy.json`, JSON.stringify(anatomy, null, 2) + '\n']] : []),
      // an asset library's variants, each an asset of its own: `<name>.variant-<variant>.png`, and `.dark.png` beside it
      ...(g.variants || []).flatMap((v) => [[`${n}.variant-${slug(v.name)}.png`, Buffer.from(v.png, 'base64')], ...(v.dark ? [[`${n}.variant-${slug(v.name)}.dark.png`, Buffer.from(v.dark, 'base64')]] : [])])];
  }));
}


/**
 * The components that live on an icon page, as `{ name, page }`.
 *
 * They have no stored spec — an icon page is exported as SVGs and a spec per
 * glyph would swamp the store — so their names in `owns.icons` and the page in
 * `owns.iconPage` are all there is, and joining the two is this function's
 * whole job. Before plugin 0.35.0 the page was not recorded, and a library
 * audited from its snapshot saw 40 of its 69 components with no way to say
 * which 29 were missing: the second return value names the sources whose
 * icons are still unplaceable, so a run reports them rather than passing over
 * them.
 */
function iconComponents(tokens) {
  const sources = (tokens && tokens._meta && tokens._meta.sources) || {};
  const out = [];
  const unplaced = [];
  for (const [id, src] of Object.entries(sources)) {
    const owns = src.owns || {};
    const names = owns.icons || [];
    if (!names.length) continue;
    if (!owns.iconPage) { unplaced.push({ file: src.file || id, icons: names.length }); continue; }
    for (const name of names) out.push({ name, page: owns.iconPage });
  }
  return { icons: out, unplaced };
}

module.exports = { attrsOrdered, GRADE_RULES, gradeOf, storedGrade, DEFAULT_PATHS, PATH_KEYS, paths, iconComponents, mergeTokens, diff, grade, gradeLines, recordChanges, readChanges, writeChanges, emptyChange, replaceFiles, pruneSpecs, folderOf, writeLibrary, writeScreens, readSpec, readSpecs, readScreen, readScreens, screenIds, STATES };
