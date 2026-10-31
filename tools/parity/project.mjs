/*
 * tools/parity/project.mjs — a project as the parity engine sees it, part of
 * the design-to-code parity engine (README.md here; the method is
 * skills/design-code-parity).
 *
 *   loadProject(repo) → { repo, config, parity, paths, snapshot, library, specs, frames, targets, orphans, unusedFalse, backlog }
 *   target            { name, kind, folder, family, file, mapping, spec, frame?, variants, unrendered }
 *
 * A target's `family` is what a run is scoped to by one word (run.mjs): the
 * folder of the mapping module that declares it, or, in a screens file or a
 * printed list, the part of its key before `--` (`contact--1-2-error-email`
 * is of `contact`).
 *
 * Everything that differs between projects is read here from the project's
 * own files, and nowhere else: `snapshot.config.json` (its `paths` and its
 * `parity` block) and its mapping files. Two spellings of a mapping are read,
 * because two projects wrote them and both are clear:
 *
 *   axes      `axes: { Size: { lg: { size: 'lg' } }, State: { Hover: { pseudo: 'hover' } } }`,
 *             a value's `layers` naming a layer's element where that value draws it
 *             or `variants: { 'Size=lg': { size: 'lg' } }` — each variant the
 *             spec holds expanded from what each axis value means
 *   list      `variants: [{ figma, props, nodes?, waivers? }]` with `nodes`
 *             for layers — each listed variant, and (where the project's
 *             `parity.variants` says how) the state and disabled siblings of
 *             a resting one
 *
 * and both come out as one shape: `variants`, a Map of the variant name to
 * `{ args, pseudo, on, layers, waivers }`, with what no mapping renders in
 * `unrendered` for gate 3. Mappings are found by `parity.mappings`: a
 * `module` glob (`src/design-system/*\/parity.mjs`, one `*` naming the
 * folder), a `command` printing JSON keyed by name, or a `json` file keyed by
 * frame whose entries may start from a `base`.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { layerAt } from './layers.mjs';
/* What a project's facts lack is said to its user, never thrown as a stack: an error made here carries `usage`, and each
   command that loads a project prints its message and exits 2 (from-code, run, gates, pages). */
const said = (message) => Object.assign(new Error(message), { usage: true });
import { variantValues } from '../shared/names.js';

const require = createRequire(import.meta.url);
const spec = require('../snapshot/spec.cjs');
const store = require('../snapshot/store.cjs');

const readJson = (file, fallback) => { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; } };

/** The folder each `*` of a one-star glob matches, with the file it names. */
function globOne(repo, pattern) {
  const [before, after] = pattern.split('*');
  const dir = path.join(repo, before);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).sort().map((d) => ({ folder: d, file: path.join(dir, d + after) })).filter((x) => fs.existsSync(x.file));
}

/*
 * A screens file keyed by frame, where an entry may name the `base` it starts
 * from: its layers, waivers, exclusions and runtime list are the base's with
 * its own over them, and `false` drops one it would inherit (null already
 * means "this layer has no element of its own"). Ten of nineteen screens once
 * carried a node map byte-identical to a sibling's, and a selector fix had to
 * be made three times. A `false` that drops nothing is pushed to `unused`
 * (`entry: table key`): it reads as a decision and decides nothing, and
 * thirteen sat in one file after its paths were respelled.
 */
const MERGED = ['nodes', 'waivers', 'excluded'];
export function resolveBases(raw, unused = []) {
  const out = {};
  const one = (key, seen = new Set()) => {
    if (out[key]) return out[key];
    const s = raw[key];
    if (!s) throw said(`parity: "${key}" names a base that is not in the screens file`);
    if (seen.has(key)) throw said(`parity: "${key}" is its own base, through a cycle`);
    seen.add(key);
    const b = s.base ? one(s.base, seen) : null;
    const merged = { ...(b || {}), ...s };
    delete merged.base;
    if (b) {
      for (const k of MERGED) if (b[k] || s[k]) merged[k] = { ...b[k], ...(s[k] || {}) };
      merged.runtime = s.runtime || b.runtime;
    }
    for (const k of MERGED) for (const [n, v] of Object.entries(merged[k] || {})) {
      if (v !== false) continue;
      if (!b || !b[k] || !(n in b[k])) unused.push(`${key}: ${k} "${n}" is false and inherits nothing to drop`);
      delete merged[k][n];
    }
    return (out[key] = merged);
  };
  for (const key of Object.keys(raw)) if (!key.startsWith('_')) one(key);
  return out;
}

/* Every exported object of a mapping module that claims something. */
async function exportsOf(file, claims) {
  const mod = await import(pathToFileURL(file).href);
  return [...new Set(Object.values(mod).filter((m) => m && typeof m === 'object' && claims(m)))];
}

/** The mappings a project declares, as raw `{ name, kind, folder, file, raw }`; `unused` collects a screens file's `false` entries that drop nothing. */
async function rawMappings(repo, P, unused) {
  const out = [];
  const from = P.mappings || {};
  for (const kind of ['components', 'screens']) {
    const how = from[kind];
    if (!how) continue;
    if (how.module) {
      for (const { folder, file } of globOne(repo, how.module)) {
        if (kind === 'components') {
          const [m] = await exportsOf(file, (x) => x.layers || x.axes || x.variants);
          if (m) out.push({ name: folder, kind: 'component', folder, family: folder, file, raw: m });
        } else {
          for (const m of await exportsOf(file, (x) => x.layers || x.screen)) {
            out.push({ name: m.screen || folder, kind: 'screen', folder: m.screen || folder, family: folder, file, raw: m });
          }
        }
      }
    } else if (how.command) {
      const all = JSON.parse(execSync(how.command, { cwd: repo, encoding: 'utf8', maxBuffer: 64e6 }));
      for (const [name, m] of Object.entries(all)) {
        out.push({ name, kind: kind === 'components' ? 'component' : 'screen', folder: m.component || m.screen || name, family: name.split('--')[0], file: how.command, raw: m });
      }
    } else if (how.json) {
      const file = path.join(repo, how.json);
      for (const [name, m] of Object.entries(resolveBases(readJson(file, {}), unused))) {
        out.push({ name, kind: kind === 'components' ? 'component' : 'screen', folder: m.screen || name, family: name.split('--')[0], file, raw: m });
      }
    }
  }
  return out;
}

/*
 * One mapping shape. `nodes` is the list spelling of `layers`, and `$root` in
 * a layer map is the mapping's `root` (the selector of the variant itself).
 */
function normalise(raw) {
  const layers = { ...(raw.layers || raw.nodes || {}) };
  let root = raw.root;
  if ('$root' in layers) { root = layers.$root; delete layers.$root; }
  return {
    ...raw,
    layers, root,
    waivers: raw.waivers || {},
  };
}

const pairs = (name) => Object.entries(variantValues(name));
const withAxis = (name, axis, value) => name.split(', ').map((p) => (p.startsWith(`${axis}=`) ? `${axis}=${value}` : p)).join(', ');

/*
 * What each variant the spec holds renders as. The axes spelling expands
 * every variant from its axis values (complete by construction: an
 * undeclared value is unrendered, and gate 3 says so); the list spelling
 * renders what it lists, plus — when the project's `parity.variants` names
 * its state axis and the mapping names the element that takes the state —
 * the Hover, Focus and Press siblings of each resting variant, and its
 * disabled sibling when the mapping's controls offer `disabled`.
 */
export function expand(mapping, variants, conventions = {}) {
  const rendered = new Map();
  const named = (n) => variants.find((v) => v.name === n);
  if (Array.isArray(mapping.variants)) {
    const S = conventions.state, D = conventions.disabled;
    for (const [i, v] of mapping.variants.entries()) {
      const args = { ...(mapping.sample || {}), ...(v.props || {}) };
      const layers = { ...mapping.layers, ...(v.nodes || v.layers || {}) };
      if ('$root' in layers) delete layers.$root;
      const base = { args, layers, own: v.waivers || {}, index: i };
      if (!rendered.has(v.figma)) rendered.set(v.figma, { ...base });
      const rest = S && pairs(v.figma).some(([a, x]) => a === S.axis && x === S.rest);
      if (rest && mapping.state) {
        for (const [value, pseudo] of Object.entries(S.pseudo || {})) {
          const name = withAxis(v.figma, S.axis, value);
          if (named(name) && !rendered.has(name)) rendered.set(name, { ...base, pseudo, on: mapping.state });
        }
      }
      const off = D && rest && pairs(v.figma).some(([a, x]) => a === D.axis && x === D.off);
      const offered = mapping.controls && mapping.controls[D && D.arg];
      if (off && offered) {
        const name = withAxis(v.figma, D.axis, D.on);
        if (named(name) && !rendered.has(name)) rendered.set(name, { ...base, args: { [D.arg]: true, ...args } });
      }
    }
    return rendered;
  }
  for (const v of variants) {
    if (mapping.variants && v.name in mapping.variants) { rendered.set(v.name, { args: mapping.variants[v.name], layers: mapping.layers, own: {} }); continue; }
    if (!mapping.axes) continue;
    const args = {};
    const layers = { ...mapping.layers };
    let pseudo, on, ok = true;
    for (const [axis, value] of pairs(v.name)) {
      const declared = mapping.axes[axis];
      if (!declared || !(value in declared)) { ok = false; break; }
      const rule = declared[value];
      if (rule && rule.pseudo) { pseudo = rule.pseudo; on = rule.on; }
      // an axis value may say a layer is a different element there (`layers`)
      if (rule && rule.layers) Object.assign(layers, rule.layers);
      Object.assign(args, rule && rule.args ? rule.args : rule);
    }
    if (!ok) continue;
    delete args.pseudo; delete args.on; delete args.layers;
    rendered.set(v.name, { args, pseudo, on, layers, own: {} });
  }
  return rendered;
}

/*
 * Gate 3: every variant the library draws is rendered by the mapping, or
 * named in `unmeasured` with a reason; and an excuse or a listed variant the
 * design no longer draws is stale.
 */
export function unrenderedOf(name, mapping, variants, rendered) {
  const out = [];
  const unmeasured = mapping.unmeasured || {};
  for (const v of variants) if (!rendered.has(v.name) && !(v.name in unmeasured)) out.push(`${name} :: ${v.name}`);
  for (const n of Object.keys(unmeasured)) if (!variants.some((v) => v.name === n)) out.push(`${name} :: "${n}" is excused and no longer exists`);
  /* An excuse has a reason, and an owner where someone will close it; a field
     nothing reads is refused, as on a waiver (`accepted: true` sat on one
     project's modal after the waivers gate dropped it). */
  for (const [n, e] of Object.entries(unmeasured)) {
    if (typeof e === 'string' && e.trim()) continue;
    if (!e || typeof e !== 'object' || typeof e.reason !== 'string' || !e.reason.trim()) { out.push(`${name} :: "${n}" is unmeasured with no reason`); continue; }
    for (const f of Object.keys(e)) if (!['reason', 'fix'].includes(f)) out.push(`${name} :: "${n}": "${f}" is not an unmeasured field (reason, fix) — nothing reads it`);
    if (e.fix !== undefined && !['figma', 'code'].includes(e.fix)) out.push(`${name} :: "${n}": fix is 'figma' or 'code', not ${JSON.stringify(e.fix)}`);
  }
  const listed = Array.isArray(mapping.variants) ? mapping.variants.map((v) => v.figma) : Object.keys(mapping.variants || {});
  for (const n of listed) if (!variants.some((v) => v.name === n)) out.push(`${name} :: the mapping renders "${n}", which the design no longer draws`);
  return out;
}

/*
 * The facts a run cannot go without, checked once and named by key. Each was
 * a TypeError deep in a run, or a full wait for a page that could never
 * render: no `host` read `.kind` of undefined; a storybook host with no
 * `paths.storybook.themeGlobal` and a fragments host with no `url` threw on
 * the first page; an app with no `shell` waited thirty seconds a route and
 * said the route did not render. A run with no `tiers` measured a default
 * pair no project had named.
 */
const HOSTS = {
  storybook: (H, config) => [
    H.base || (H.build && H.build.run) ? null : 'parity.host.base or parity.host.build.run (where the built Storybook is, or how to build it)',
    // a library compared, not governed, is measured at its components' own size and in the tier it renders
    // a compared library is built here, into the project's home: its previews and the stamp the audit keys on
    ...(config.compared ? [H.build && H.build.run ? null : 'parity.host.build.run (a library compared is built by the run: where it is, is not enough)'] : [
      H.frameGlobal ? null : 'parity.host.frameGlobal (the global a story reads its frame size from)',
      config.paths && config.paths.storybook && config.paths.storybook.themeGlobal ? null : 'paths.storybook.themeGlobal (the global a story reads its tier from)',
    ]),
  ],
  fragments: (H) => [
    H.base ? null : 'parity.host.base (the site the fragments come from)',
    H.url ? null : 'parity.host.url (a fragment\'s address, with {component})',
  ],
  /* Every page is the running product at a route (hosts.mjs `app`): its facts
     are `parity.app`'s, and a mapping with no route has no page to open. */
  app: (H, config, unrouted = []) => unrouted.length ? [`a route on every mapping, since parity.host.kind is app (none on ${unrouted.slice(0, 3).join(', ')}${unrouted.length > 3 ? ' …' : ''})`] : [],
};
export function checkFacts(config, routes = false, unrouted = []) {
  const P = config.parity || {};
  const missing = [];
  if (!P.host || !P.host.kind) missing.push('parity.host.kind (storybook, fragments or app)');
  else if (!HOSTS[P.host.kind]) missing.push(`parity.host.kind is "${P.host.kind}", not storybook, fragments or app`);
  else missing.push(...HOSTS[P.host.kind](P.host, config, unrouted).filter(Boolean));
  if (P.host && P.host.kind === 'app') routes = true;
  if (!Array.isArray(P.tiers) || !P.tiers.length) missing.push('parity.tiers (the tiers a page is measured in, as the host names them)');
  else if (config.compared && P.tiers.length !== 1) missing.push('parity.tiers: one tier, since a library compared is opened as it renders and cannot be put in another');
  if (!P.mappings || !Object.keys(P.mappings).length) missing.push('parity.mappings (where the mappings are)');
  if (routes) {
    const A = P.app || {};
    if (!A.base) missing.push('parity.app.base (a mapping names a route)');
    else if (A.base.includes('{port}') && !A.port) missing.push('parity.app.port (parity.app.base has {port})');
    if (!A.shell) missing.push('parity.app.shell (what is on screen once a route has drawn)');
  }
  return missing;
}

/*
 * The targets a run's words name: a word is a target's name or folder, or
 * else every target of its family (`contact` is the contact page's states,
 * as the project script the run replaced read it; review 2026-10-02 round 2,
 * R8). Returns the targets and the words that named nothing.
 */
export function scopeTargets(all, words) {
  const scope = (w) => { const named = all.filter((t) => t.name === w || t.folder === w); return named.length ? named : all.filter((t) => t.family === w); };
  return { targets: all.filter((t) => words.some((w) => scope(w).includes(t))), unknown: words.filter((w) => !scope(w).length) };
}

/** The project at `repo`, read once. */
export async function loadProject(repo) {
  repo = path.resolve(repo);
  const read = require('../shared/repo-config.cjs').readRepoConfig(repo);
  if (read.error) throw said(`parity: ${read.error}`);
  const config = read.config;
  const P = config.parity || {};
  const paths = store.paths(repo, config.paths || {});
  const snapshot = readJson(paths.tokens, null);
  if (!snapshot) throw said(`parity: no token snapshot at ${paths.tokens}`);

  // The library this repo builds, resolved: what a frame's instances are
  // compared against when it changes something inside one (gate 18).
  const library = new Map();
  const specs = new Map();
  {
    for (const { folder, spec: resolved } of store.readSpecs(paths.components)) {
      specs.set(folder, resolved);
      if (resolved.name) library.set(resolved.name, resolved);
    }
  }
  const frames = new Map(store.readScreens(paths.screens).map((s) => [s.id, s]));

  const targets = [];
  const claims = new Map();
  const orphans = [];
  const unusedFalse = [];
  for (const m of await rawMappings(repo, P, unusedFalse)) {
    const mapping = normalise(m.raw);
    const t = { name: m.name, kind: m.kind, folder: m.folder, family: m.family, file: m.file, mapping };
    if (m.kind === 'component') {
      const s = specs.get(m.folder);
      if (!s) { orphans.push(`${m.name}: a mapping for "${m.folder}", which no component spec holds`); continue; }
      t.spec = s;
    } else {
      if (claims.has(m.folder)) throw said(`parity: two screen mappings claim the frame "${m.folder}"`);
      claims.set(m.folder, m.name);
      const frame = frames.get(m.folder);
      if (!frame) { orphans.push(`a screen mapping claims the frame "${m.folder}", which no snapshot holds — renamed, or its Ready for dev mark taken off`); continue; }
      const tree = mapping.rootLayer ? layerAt(frame.tree, mapping.rootLayer) : frame.tree;
      if (!tree) { orphans.push(`${m.name}: no layer "${mapping.rootLayer}" in the frame`); continue; }
      t.frame = frame;
      t.spec = { variants: [{ ...tree, name: frame.name }] };
      // a screen is one variant, rendered as the page
      if (!mapping.axes && !mapping.variants) mapping.variants = { [frame.name]: {} };
    }
    t.variants = expand(mapping, t.spec.variants, P.variants);
    /* A mapping may measure a private half (`component: 'modal-dialog'`) under
       the name of the public component it belongs to; that component's own
       variants are then excused by name in the same `unmeasured`. */
    const own = m.kind === 'component' && m.name !== m.folder ? specs.get(m.name) : null;
    if (own) t.covers = m.name;
    const variants = own ? [...t.spec.variants, ...own.variants] : t.spec.variants;
    t.unrendered = unrenderedOf(t.name, mapping, variants, t.variants);
    targets.push(t);
  }
  const missing = checkFacts(config, targets.some((t) => t.mapping.route), targets.filter((t) => !t.mapping.route).map((t) => t.name));
  if (missing.length) throw said(`parity: ${path.join(repo, 'snapshot.config.json')} is missing what a run needs:\n  ${missing.join('\n  ')}`);
  const backlogFile = P.backlog ? path.join(repo, P.backlog) : null;
  return {
    // the window a page and a component are measured in, where the parity facts name none: the interface settings'
    limits: require('../snapshot/projects.cjs').interfaceLimits(config.project || null),
    repo, config, parity: P, paths, snapshot, library, specs, frames, targets, orphans, unusedFalse,
    backlog: backlogFile ? readJson(backlogFile, {}) : {},
  };
}

/*
 * A project's parity facts, wherever they live. A repo whose code follows the
 * design states them in its snapshot.config.json `parity` block (governed:
 * loadProject above). A library built elsewhere states them in its context
 * document, as its library's `code.parity` (compared): the host and how to
 * build it, its one tier, and where its mappings are, relative to the
 * project's home; its code is `code.repo`, and its Storybook is built into
 * the home, where the docs site serves it. Both give the same mappings, read
 * from the same format; a compared target carries its mapping raw, since the
 * gates that expand it into variants do not run on a library the project
 * does not govern. `parityMode` says which a project is, without loading it
 * (the contract editor asks it to offer Pull from code).
 */
/* The components library a project's tools work on, one rule for all of them: the one its code builds or compares
   (parityMode), else its first. to-figma, the contract editor and the parity engine each chose their own, so with two
   libraries a drawing could take its keys from one and its axis order from another. `{ libKey, lib }`, both empty for
   a project with none. */
export function libraryOf(label) {
  const pm = parityMode(label);
  if (pm.error) return { error: pm.error };
  if (pm.libKey) return { libKey: pm.libKey, lib: pm.lib || {} };
  const projects = require('../snapshot/projects.cjs');
  const [libKey, lib] = Object.entries(projects.auditContext(pm.where.doc).libraries || {})[0] || [];
  return { libKey: libKey || null, lib: lib || {} };
}

export function parityMode(label) {
  const projects = require('../snapshot/projects.cjs');
  const where = projects.layout(null, label);
  if (where.error) return { error: where.error };
  const ctx = projects.auditContext(where.doc);
  if (where.repo && (readJson(path.join(where.repo, 'snapshot.config.json'), {}) || {}).parity) {
    // the library the repo builds: the one its routing names, else its only components library
    const libKey = (where.figmaKey && ctx.libraries[where.figmaKey]) ? where.figmaKey : Object.keys(ctx.libraries || {})[0];
    return { mode: 'governed', where, libKey, lib: (ctx.libraries || {})[libKey] || {} };
  }
  const [libKey, lib] = Object.entries(ctx.libraries || {}).find(([, l]) => l.code && l.code.parity) || [];
  if (!lib) return { mode: null, where };
  // its mappings, in the project's home, where its code.parity says
  const m = lib.code.parity.mappings && lib.code.parity.mappings.components && lib.code.parity.mappings.components.json;
  return { mode: 'compared', where, libKey, lib, mappings: m ? path.join(where.projectDir, m) : null };
}

export async function loadParity(label) {
  const projects = require('../snapshot/projects.cjs');
  const found = parityMode(label);
  if (found.error) throw said(`${label}: ${found.error}`);
  const { where, libKey, lib } = found;
  if (found.mode === 'governed') return { ...(await loadProject(where.repo)), mode: 'governed', label, where, lib, libKey };
  if (!lib) throw said(`${label}: no parity facts — a repo's snapshot.config.json \`parity\` block, or a library's \`code.parity\` in the context document`);
  const P = lib.code.parity;
  const config = { project: label, parity: P, compared: true };
  const missing = checkFacts(config);
  if (missing.length) throw said(`${label}: the context document's code.parity is missing what a run needs:\n  ${missing.join('\n  ')}`);
  if (!found.mappings) throw said(`${label}: code.parity.mappings.components.json (the mappings, relative to the project's home)`);
  if (!lib.code.repo) throw said(`${label}: code.repo (where the library's code is)`);
  const file = found.mappings;
  const specs = new Map();
  const targets = [];
  const orphans = [];
  for (const [folder, mapping] of Object.entries(readJson(file, {}))) {
    const onDisk = store.readSpec(where.paths.components, folder, { compact: true });
    if (!onDisk) { orphans.push(`${folder}: a mapping for a component the snapshot does not hold`); continue; }
    specs.set(folder, onDisk);
    targets.push({ name: folder, kind: 'component', folder, family: folder, file, mapping, spec: onDisk });
  }
  return {
    mode: 'compared', label, where, lib, libKey, repo: projects.expand(lib.code.repo), config, parity: P, paths: where.paths, limits: projects.interfaceLimits(label),
    storybookOut: where.storybook, snapshot: readJson(where.paths.tokens, null), specs, targets, orphans, file,
  };
}

