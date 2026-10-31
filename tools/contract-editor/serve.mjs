#!/usr/bin/env node
/*
 * node tools/contract-editor/serve.mjs [--project <label>] [--snapshot <dir>] [--port 9250] [--no-router]
 *
 * Serves the contract editor on localhost. A server rather than a file to
 * open, because a page opened from disk cannot load its own modules. One
 * server serves one library, as each project's docs site serves its own:
 * --project the registered project's (/project.json: its settings, contracts
 * and tokens), and no other is offered or answered; with no flag, the house's
 * settings alone. A second project is a second server (--port). --snapshot opens one snapshot folder,
 * or a repo whose snapshot.config.json says where its snapshot is, with no
 * project registered: its components and tokens under the house's settings,
 * Push to Figma and Pull from code left to a project. It writes nothing of its own but
 * a project's official contracts, where its library takes the contract as its source
 * (component-contract's official.mjs): the contract otherwise leaves through the
 * browser's download, and /sync runs the toolkit tool that owns each side (below),
 * which writes what that tool writes.
 */
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFile, spawn } from 'node:child_process';
import net from 'node:net';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { tokenLists, usedGroups } from './anatomy.mjs';
import { parityMode, libraryOf } from '../parity/project.mjs';
import { codeComponents, compare } from '../shared/code-inventory.mjs';
import { officials, readings, behind, figmaBrief, same, switchTo } from '../component-contract/official.mjs';
import { samePath } from '../shared/real-path.mjs';
import { namingFault, NAMING, FRAMEWORKS } from '../component-contract/to-markup.mjs';

const require = createRequire(import.meta.url);
const HERE = path.dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const arg = (k) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : null; };
const SNAP = arg('--snapshot') && path.resolve(arg('--snapshot'));
// the label a snapshot folder is served under
const SNAP_LABEL = 'snapshot';
// the project served; one started on none takes the one it makes (Settings, Create a project), and none other after
let start = arg('--project') || (SNAP && SNAP_LABEL);
const projects = require('../snapshot/projects.cjs');
// --port, else the project's own (its project block's `editorPort`, where its docs site links to), else the editor's default
const port = Number(arg('--port') || (arg('--project') && projects.layout(null, arg('--project')).editorPort) || projects.EDITOR_PORT);
const store = require('../snapshot/store.cjs');
const SETTINGS = path.join(HERE, '..', '..', 'standards', 'audit-settings.json');

function project(label) {
  const house = JSON.parse(fs.readFileSync(SETTINGS, 'utf8'))['audit-defaults'];
  const plain = { project: null, settings: projects.flatSettings(house, {}), optionOrder: house.optionOrder || {}, contracts: [], tokens: tokenLists() };
  if (!label) return plain;
  if (label === SNAP_LABEL && SNAP) {
    // a repo states its layout in snapshot.config.json; a bare snapshot folder is the canonical one
    const repo = fs.existsSync(path.join(SNAP, 'snapshot.config.json')) ? projects.locate(SNAP) : null;
    if (repo && repo.error) throw new Error(repo.error);
    // a registered project's repo keeps its own settings, as --project reads them; one the registry does not know, the house's
    const own = (repo && libraryOf(repo.project).lib) || {};
    return { ...read(store.paths(SNAP, repo ? repo.paths : {}), plain), project: repo ? repo.project : path.basename(SNAP), settings: own.tokens || plain.settings, optionOrder: own.optionOrder || plain.optionOrder, hasCode: false, toFigma: false };
  }
  const where = projects.layout(null, label);
  if (where.error) throw new Error(where.error);
  const ctx = projects.auditContext(where.doc);
  if (!ctx.ok) throw new Error(`${label}: ${ctx.errors.join('; ')}`);
  // the library its tools work on, as every tool chooses it (parity's libraryOf)
  const { libKey, lib } = libraryOf(label);
  // whether its code can be read back: a parity mapping, governed by its repo or compared from its context document
  const mode = parityMode(label);
  // the official contracts: Figma's readings, or, where the library takes the contract as its source, its own files,
  // with what Figma is behind on and the brief that says so
  const o = officials(where);
  const facts = read(where.paths || {}, plain, o.of);
  const late = behind(where);
  for (const d of late) if (d.kind === 'gone') facts.contracts.push(d.official);
  return { ...facts, source: o.source, behind: late.map((d) => ({ kind: d.kind, component: d.component, key: (d.official || d.figma).figma.key, figma: d.figma, brief: figmaBrief(d) })), project: where.name || label, settings: lib.tokens || plain.settings, optionOrder: lib.optionOrder || plain.optionOrder, hasCode: !!mode.mode, codeOnly: codeOnlyOf(mode, facts.contracts), toFigma: true, settingsDoc: !!libKey, scratch: (lib.draw && lib.draw.scratch) || null, docs: docsOf(where), code: codeOf(where) };
}
// the code repo the project routes to, and where Push to code writes a component's stylesheet and how it names it
function codeOf(where) {
  if (!where.repo) return null;
  const config = JSON.parse(fs.readFileSync(path.join(projects.expand(where.repo), 'snapshot.config.json'), 'utf8'));
  return { repo: where.repo, styles: (config.paths && config.paths.componentStyles) || null, prefix: (config.styles && config.styles.naming && config.styles.naming.prefix) || '', framework: config.framework || null, naming: (config.styles && config.styles.naming) || null };
}

/* The components a library built elsewhere has and Figma does not, by the one
   rule the docs site's Coverage page lists them (code-inventory's compare): to
   be read from their stories and drafted into Figma. Code built from the
   design (governed) has none of its own. */
function codeOnlyOf(mode, contracts) {
  const code = mode.mode === 'compared' && mode.lib.code;
  if (!code || !code.repo) return [];
  const found = codeComponents(path.join(projects.expand(code.repo), code.components || ''));
  if (!found) return [];
  const built = mode.lib.frameworkComponents || {};
  return compare(contracts.map((c) => ({ title: c.component })), found, (name) => built[name]).codeOnly.map((c) => c.name);
}

/* The project's docs site, where the figma-audit service serves it (its project block's `port`), and each component's
   page there by its name, read from the site's last build (api/index.json): the page a library component links to. */
function docsOf(where) {
  const index = path.join(where.site || '', 'api', 'index.json');
  if (!where.port || !fs.existsSync(index)) return null;
  const pages = {};
  for (const p of JSON.parse(fs.readFileSync(index, 'utf8')).components || []) for (const s of p.sets || []) if (s.path) pages[s.name] = `components/${s.path}/`;
  return { url: `http://localhost:${where.port}/`, pages };
}

/* What a snapshot holds, by its paths: the contracts, the tokens a part may take, the icons, and each component's preview. */
function read(paths, plain, of = (c) => c) {
  const dir = paths.components;
  const contracts = [];
  // each component's folder, by its name: what the code tools key a component by
  const folders = Object.create(null);
  if (dir && fs.existsSync(dir)) for (const f of fs.readdirSync(dir).sort()) {
    const file = path.join(dir, f, 'contract.json');
    if (!fs.existsSync(file)) continue;
    const c = of(JSON.parse(fs.readFileSync(file, 'utf8')));
    contracts.push(c);
    folders[c.component] = f;
  }
  // the tokens a part may take, from the project's token snapshot
  const snap = paths.tokens;
  const tokens = snap && fs.existsSync(snap) ? tokenLists(JSON.parse(fs.readFileSync(snap, 'utf8'))) : plain.tokens;
  tokens.uses = usedGroups(contracts);
  // the project's icons, by file name without .svg, for the preview to draw
  const iconDir = paths.icons;
  const icons = iconDir && fs.existsSync(iconDir) ? fs.readdirSync(iconDir).filter((f) => /^[a-z0-9-]+\.svg$/.test(f)).map((f) => f.slice(0, -4)) : [];
  // each component the snapshot drew a preview of (store.cjs previews, by its folder's name), for an image fill the
  // contract cannot hold: a graphic drawn as Figma draws it, light and dark
  const previewDir = paths.previews;
  const has = (f) => previewDir && fs.existsSync(path.join(previewDir, f));
  const previews = Object.fromEntries(Object.entries(folders).filter(([, f]) => has(`${f}.png`)).map(([name, f]) => [name, { file: f, dark: has(`${f}.dark.png`) }]));
  return { contracts, icons, tokens, iconDir, folders, previews, previewDir, snapshotFile: snap };
}

// read per project when the page first asks for it
const cache = new Map();
// read again when the snapshot is taken again: a new snapshot rewrites its file, and its contracts with it
// and when the official contracts or the setting that says which are official change (a save, a switch, a pull)
const stamp = (f) => { try { return f ? fs.statSync(f).mtimeMs : 0; } catch { return 0; } };
const stampOf = (label, facts) => {
  const where = label && label !== SNAP_LABEL ? projects.layout(null, label) : {};
  const dir = where.projectDir && path.join(where.projectDir, 'contracts');
  const own = dir && fs.existsSync(dir) ? fs.readdirSync(dir).map((f) => stamp(path.join(dir, f))) : [];
  return [stamp(facts.snapshotFile), stamp(where.doc), stamp(dir), ...own].join();
};
const factsOf = (label) => {
  const k = label || '', had = cache.get(k);
  if (!had || stampOf(label, had.facts) !== had.at) { const facts = project(label); cache.set(k, { facts, at: stampOf(label, facts) }); }
  return cache.get(k).facts;
};
// the one library this server serves: the project it was started on, or the snapshot folder; none, the house's settings
const registered = () => (SNAP ? [{ label: SNAP_LABEL, name: path.basename(SNAP) }] : start ? [{ label: start, name: start }] : []);
if (arg('--project') && !projects.projects().list.some((p) => p.name === start)) { console.error(`no project called ${start}`); process.exit(2); }
if (arg('--project') && SNAP) { console.error('one library per server: --project or --snapshot'); process.exit(2); }
// the page's own files, read from this folder on each request, so a file added here is served without a restart
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css' };
const SYSTEM = path.join(HERE, '..', 'docs-site', 'src', 'styles', 'system.css');
const fileFor = (url) => {
  if (url === '/') return path.join(HERE, 'index.html');
  if (url === '/system.css') return SYSTEM;
  if (url === '/theme.js') return path.join(HERE, '..', 'docs-site', 'src', 'scripts', 'theme.js');
  // the toolkit's own modules the page imports beside its own, each the one owner of what it does: the variants drawn as
  // the contract says (component-contract), and a value read as the parity engine reads it (a font weight, a colour, through shared/colour.js)
  if (['/component-contract/layers.mjs', '/component-contract/css.mjs', '/parity/values.mjs', '/shared/colour.js'].includes(url)) return path.join(HERE, '..', url.slice(1));
  const name = url.slice(1);
  // one name in this folder, never a path out of it, and never the tests
  return /^[a-z-]+\.(html|js|mjs|css)$/.test(name) && !name.startsWith('test-') ? path.join(HERE, name) : null;
};

/*
 * The sync between the page and the project's Figma and code, each run by
 * the toolkit tool that owns it: the snapshot read again (Pull from Figma),
 * to-figma.mjs drawing a contract into the scratch file the library's settings name
 * (Push to Figma; never the library), from-code.mjs reading the library's
 * own code (Pull from code, and a component only the code has). The page asks only from itself: a request from
 * another origin is refused.
 */
const CONTRACT = path.join(HERE, '..', 'component-contract');
const run = (args) => new Promise((resolve) => execFile(process.execPath, args, { cwd: path.join(HERE, '..', '..'), timeout: 600000, maxBuffer: 1 << 24 },
  (e, out, err) => resolve({ ok: !e, output: `${out || ''}${err || ''}`.trim() })));
// a component among the contracts by its Figma key, else by its name (a draft from before keys were sent)
const byKey = (list, c) => (!c ? null : c.figma && c.figma.key ? list.find((x) => x.figma && x.figma.key === c.figma.key) || null : list.find((x) => x.component === c.component) || null);
async function sync(body) {
  const { action, label, component, contract, base } = body;
  /* A project made for an editor started on none: its home and context document, by the registry's one maker
     (projects.create), so every tool reads it as any other project; this server serves it from then on. */
  if (action === 'create') {
    if (start) return { status: 400, ok: false, output: `This editor serves ${start}: a project is made from one started on none.` };
    // made of a snapshot the router kept for a file no project claimed: its id is the file's, and the snapshot is
    // then delivered to it (deliver.cjs, as a kept payload is), so the library is there without a second snapshot
    const code = typeof body.code === 'string' ? body.code.trim().toUpperCase() : '';
    const kept = code && projects.unclaimed().find((u) => u.code === code);
    if (code && !kept) return { status: 400, ok: false, output: 'No snapshot is kept under that code: run the plugin in the library again, and copy the code it shows.' };
    // where the snapshot says which file it is (a plugin run from Development does not), it is the library named
    if (kept && kept.key && kept.key !== body.library) return { status: 400, ok: false, output: `That snapshot came from another file (${kept.key}), not the library you named.` };
    const made = projects.create(body.project, { library: body.library, id: kept ? kept.id : body.id });
    if (made.error) return { status: 400, ok: false, output: made.error };
    start = body.project;
    if (!kept) return { status: 200, ok: true, project: start, output: `${start} made, at ${made.home}. Snapshot the library to bring its components in.` };
    const r = await run([path.join(HERE, '..', 'snapshot', 'deliver.cjs'), start, 'library', kept.file]);
    if (r.ok) projects.dropUnclaimed(kept.file);
    return { status: 200, ok: true, project: start, output: r.ok ? `${start} made, at ${made.home}, with its library's components.` : `${start} made, at ${made.home}, but its snapshot was not written:\n${r.output}\n\nRun the plugin in the library again.` };
  }
  if (!registered().some((p) => p.label === label)) return { status: 404, ok: false, output: `no project called ${label}` };
  if (action === 'pull-figma') { cache.delete(label); return { status: 200, ok: true, facts: factsOf(label) }; }
  if ((action === 'push-figma' || action === 'patch-figma' || action === 'pull-code' || action === 'push-code' || action === 'settings' || action === 'connect-repo') && label === SNAP_LABEL) return { status: 400, ok: false, output: 'A snapshot folder has no project to draw into or code to read: open it with --project.' };
  /* The library's settings the page sets, each written to the context document by its owner: the scratch file a new
     component is drawn into (draw.scratch), and the source of truth (official.mjs's switch, refused back to Figma while
     Figma is behind, unless confirmed). */
  /* A local git repo made the project's code repo by init.mjs, the one tool that connects a repo: run dry first, its
     plan shown to be confirmed, since it writes into the repo and routes the library's snapshots there from then on. */
  if (action === 'connect-repo') {
    if (!body.repo) return { status: 400, ok: false, output: 'Name the repo: its folder on this machine.' };
    const repo = path.resolve(projects.expand(body.repo)), cfg = path.join(repo, 'snapshot.config.json');
    const had = projects.layout(null, label).repo;
    if (had) return { status: 400, ok: false, output: `${label}'s code repo is ${had} already: its context document's snapshot-routing names it.` };
    // init keeps a config there: one that names another project, or not the two every tool reads it by, is refused here,
    // so no project is routed to a repo its tools then refuse
    let config = null;
    try { config = fs.existsSync(cfg) ? JSON.parse(fs.readFileSync(cfg, 'utf8')) : null; } catch { return { status: 400, ok: false, output: `${cfg} is not JSON.` }; }
    if (config && config.project && config.project !== label) return { status: 400, ok: false, output: `${repo} is ${config.project}'s repo already.` };
    if (config && !(config.toolkit && config.project)) return { status: 400, ok: false, output: `${cfg} names no "toolkit" and "project": add both, or move it aside.` };
    const r = await run([path.join(HERE, '..', 'project-check', 'init.mjs'), '--repo', repo, '--project', label, ...(body.confirm ? [] : ['--dry-run'])]);
    if (!r.ok || !body.confirm) return { status: r.ok ? 200 : 400, ...r };
    cache.delete(label);
    // init says what it could not do and exits well: connected is the project routed to this repo, read back
    const now = projects.layout(null, label);
    if (now.error || !now.repo || !samePath(projects.expand(now.repo), repo)) return { status: 400, ok: false, output: `${r.output}\n\n${now.error || `${label} is not routed to ${repo}: see what init left to do, above.`}` };
    return { status: 200, ok: true, output: `${r.output}\n\nSnapshot the library again: its snapshots go to the repo now.`, facts: factsOf(label) };
  }
  if (action === 'settings') {
    const { libKey } = libraryOf(label);
    if (!libKey) return { status: 400, ok: false, output: `${label} has no components library.` };
    const said = [];
    // every field checked before any is written, so a refusal leaves all of them as they were
    if ('styles' in body && (typeof body.styles !== 'string' || (body.styles && !/^(?!\/)(?!.*(^|\/)\.)[\w./-]+$/.test(body.styles)))) return { status: 400, ok: false, output: 'Name the styles folder inside the repo: src/components/styles.' };
    if ('prefix' in body && (typeof body.prefix !== 'string' || !/^([a-z][a-z0-9-]*)?$/.test(body.prefix))) return { status: 400, ok: false, output: 'A class prefix is lower case, digits and hyphens: ds-.' };
    if ('framework' in body && !['', ...FRAMEWORKS].includes(body.framework)) return { status: 400, ok: false, output: `The framework is one of ${FRAMEWORKS.join(', ')}.` };
    const { repo } = projects.layout(null, label);
    if (('styles' in body || 'prefix' in body || 'framework' in body) && !repo) return { status: 400, ok: false, output: 'Connect a code repo first.' };
    if ('scratch' in body && body.scratch && (typeof body.scratch !== 'string' || !/^[A-Za-z0-9]{10,64}$/.test(body.scratch))) return { status: 400, ok: false, output: 'That is not a Figma file key: copy the scratch file\'s address.' };
    if (body.source && !['figma', 'contract'].includes(body.source)) return { status: 400, ok: false, output: 'The source of truth is figma or contract.' };
    // the code settings tried on a copy, with the other checks: a naming the framework's markup cannot carry is refused,
    // never rewritten unsaid, and before anything else here is written
    const codeSet = 'styles' in body || 'prefix' in body || 'framework' in body;
    const apply = (c) => {
      if ('styles' in body) { c.paths = { ...c.paths, componentStyles: body.styles }; if (!body.styles) delete c.paths.componentStyles; }
      if ('prefix' in body) c.styles = { ...c.styles, naming: { kind: 'class', part: '__', ...(c.styles && c.styles.naming), prefix: body.prefix } };
      // a framework's markup is written to the naming it takes (to-markup's NAMING): React's root a class, a web
      // component's host a custom element; the part separator stays for a switch back
      if ('framework' in body) {
        c.framework = body.framework;
        if (!body.framework) delete c.framework;
        else c.styles = { ...c.styles, naming: { part: '__', prefix: 'ds-', ...(c.styles && c.styles.naming), kind: NAMING[body.framework] } };
      }
    };
    const next = codeSet && JSON.parse(fs.readFileSync(path.join(projects.expand(repo), 'snapshot.config.json'), 'utf8'));
    if (codeSet) apply(next);
    // element naming is a custom element's name with or without a framework named, so its prefix is held to one either way
    const naming = codeSet && next.styles && next.styles.naming;
    const fw = codeSet && (next.framework || (naming && naming.kind === 'element' && 'web-components'));
    const fault = fw && namingFault(fw, naming);
    if (fault) return { status: 400, ok: false, output: `Not saved: ${fault}.` };
    // the one that can be refused goes first, so a refusal has written nothing
    if (body.source) {
      const r = switchTo(label, body.source, { confirm: !!body.confirm });
      if (r.refused) return { status: 409, ok: false, refused: true, output: r.said };
      said.push(r.said);
    }
    if ('scratch' in body) {
      projects.setLibrary(projects.layout(null, label).doc, libKey, (lib) => {
        if (body.scratch) lib.draw = { ...lib.draw, scratch: body.scratch };
        else if (lib.draw) { delete lib.draw.scratch; if (!Object.keys(lib.draw).length) delete lib.draw; }
      });
      said.push(body.scratch ? `Scratch file set to ${body.scratch}.` : 'Scratch file cleared.');
    }
    // where Push to code writes a component's stylesheet, the prefix its classes take and the framework its markup is in,
    // kept in the repo's own config
    if (codeSet) {
      projects.setRepoConfig(repo, apply);
      said.push('Code settings saved in the repo\'s snapshot.config.json.');
    }
    cache.delete(label);
    return { status: 200, ok: true, output: said.join(' '), facts: factsOf(label) };
  }
  if (action === 'push-figma') {
    if (!contract || !contract.component) return { status: 400, ok: false, output: 'No contract to draw.' };
    const into = body.into || libraryOf(label).lib.draw?.scratch;
    if (!/^[A-Za-z0-9]{10,64}$/.test(into || '')) return { status: 400, ok: false, output: 'Name a scratch file: its key, from its address (figma.com/design/<key>/…).' };
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'contract-push-'));
    const file = path.join(dir, 'contract.json');
    fs.writeFileSync(file, JSON.stringify(contract, null, 2));
    const r = await run([path.join(CONTRACT, 'to-figma.mjs'), file, '--run', '--project', label, '--into', into]);
    fs.rmSync(dir, { recursive: true, force: true });
    return { status: 200, ...r };
  }
  /* A linked draft's library component updated in place, in the library file (to-figma.mjs --patch), then read back and
     held to the draft (--verify). Refused where the library's component is no longer what the draft was made from:
     here against the snapshot, and then by to-figma against the file itself, read live (--base). */
  if (action === 'patch-figma') {
    if (!contract || !base || !base.component) return { status: 400, ok: false, output: 'No draft, or no library component it was made from.' };
    cache.delete(label);
    const now = byKey(factsOf(label).contracts, base);
    if (!now) return { status: 400, ok: false, output: `${base.component} is no longer in ${label}'s library.` };
    const sorted = (x) => (Array.isArray(x) ? x.map(sorted) : x && typeof x === 'object' ? Object.fromEntries(Object.keys(x).sort().map((k) => [k, sorted(x[k])])) : x);
    if (JSON.stringify(sorted(now)) !== JSON.stringify(sorted(base))) return { status: 409, ok: false, output: `${base.component} has changed in the library since this draft was made. Open it from the library again and make the changes there, or push this draft as a new component.` };
    const id = now.figma && now.figma.id, { libKey } = libraryOf(label);
    if (!id || !libKey) return { status: 400, ok: false, output: `The snapshot names no node for ${base.component}, or ${label} names no library file.` };
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'contract-patch-'));
    const file = path.join(dir, 'contract.json');
    fs.writeFileSync(file, JSON.stringify({ ...contract, component: base.component, figma: now.figma }, null, 2));
    // held to what Figma has: the draft's own base, or, where the official contract is the project's own, Figma's reading of it
    const where = projects.layout(null, label);
    const o = officials(where);
    const reading = o.source === 'contract' && readings(where).find((r) => r.contract.figma && r.contract.figma.key === now.figma.key);
    // the official contract is the source: the draft becomes it first, so Figma is then brought up to it, never ahead of it
    if (reading) fs.writeFileSync(o.fileOf(now.figma.key), JSON.stringify({ ...contract, figma: now.figma }, null, 2) + '\n');
    const was = path.join(dir, 'base.json');
    fs.writeFileSync(was, JSON.stringify(reading ? reading.contract : base));
    const r = await run([path.join(CONTRACT, 'to-figma.mjs'), file, '--patch', id, '--base', was, '--project', label, '--into', libKey]);
    const v = r.ok ? await run([path.join(CONTRACT, 'to-figma.mjs'), file, '--verify', '--patch', id, '--project', label, '--into', libKey]) : null;
    fs.rmSync(dir, { recursive: true, force: true });
    return { status: 200, ok: r.ok, saved: !!reading, output: [r.output, v && v.output].filter(Boolean).join('\n') };
  }
  // a new component's stylesheet written into the repo from the draft, by the tool that writes it (to-code.mjs), and,
  // where the repo names its framework, its markup, parity mapping and story (to-markup.mjs)
  if (action === 'push-code') {
    if (!contract || !contract.component) return { status: 400, ok: false, output: 'No contract to write.' };
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'contract-code-'));
    const file = path.join(dir, 'contract.json');
    fs.writeFileSync(file, JSON.stringify(contract, null, 2));
    // named as the store will name its folder, after the library's platform where it is routed with one
    const { libKey } = libraryOf(label), lib = libKey && projects.auditRecords(projects.layout(null, label)).find((x) => x.key === libKey);
    const platform = lib && lib.platform ? ['--platform', lib.platform] : [];
    // a naming the markup cannot carry is said before anything is written; a later failure of to-markup's leaves the
    // sheet to-code wrote, and its output says so
    const code = codeOf(projects.layout(null, label)) || {};
    const fault = code.framework && namingFault(code.framework, code.naming);
    if (fault) { fs.rmSync(dir, { recursive: true, force: true }); return { status: 400, ok: false, output: `Not written: ${fault}.` }; }
    const r = await run([path.join(CONTRACT, 'to-code.mjs'), '--project', label, '--contract', file, ...platform]);
    const m = r.ok && (codeOf(projects.layout(null, label)) || {}).framework ? await run([path.join(CONTRACT, 'to-markup.mjs'), '--project', label, '--contract', file, ...platform]) : null;
    fs.rmSync(dir, { recursive: true, force: true });
    return { status: 200, ok: r.ok && (!m || m.ok), output: [r.output, m && m.output].filter(Boolean).join('\n') };
  }
  if (action === 'pull-code') {
    // the code tools key a component by its folder; only one the library has is read, or one only its code has
    const facts = factsOf(label);
    const only = !facts.folders[component] && (facts.codeOnly || []).includes(component);
    const folder = facts.folders[component] || (only ? component : null);
    if (!folder) return { status: 400, ok: false, output: `${component} is not one of ${label}'s components.` };
    const where = projects.layout(null, label);
    const report = where.parity && path.join(where.parity, 'from-code', `${folder}.json`);
    // a component only in code opened to be read: its last reading, where there is one, since a reading renders every combination
    const r = body.cached && report && fs.existsSync(report) ? { ok: true, output: '' } : await run([path.join(CONTRACT, 'from-code.mjs'), '--project', label, folder, ...(only ? ['--code-only'] : [])]);
    const read = r.ok && report && fs.existsSync(report) ? JSON.parse(fs.readFileSync(report, 'utf8')) : null;
    return { status: 200, ...r, contract: read ? read.asFigma || read.contract || null : null };
  }
  /* Where the library takes the contract as its source: a linked draft saved as its component's official contract
     (refused where that contract changed since the draft was made, as an update to Figma is), Figma's reading taken as
     official, or the official contract of a component Figma no longer has dropped. */
  if (action === 'save-official' || action === 'take-figma' || action === 'drop-official') {
    const where = projects.layout(null, label);
    const o = officials(where);
    if (o.source !== 'contract') return { status: 400, ok: false, output: `${label} takes Figma as its source: its contracts are Figma's.` };
    cache.delete(label);
    const facts = factsOf(label);
    // by its Figma key: a component redrawn under its old name is two, one new and one gone
    const asked = action === 'save-official' ? base : { component, figma: { key: body.key } };
    const name = asked && asked.component;
    const now = asked && byKey(facts.contracts, asked);
    const file = now && o.fileOf(now.figma && now.figma.key);
    if (!file) return { status: 400, ok: false, output: `${name} has no official contract in ${label}.` };
    if (action === 'save-official') {
      if (!contract || !contract.component) return { status: 400, ok: false, output: 'No draft to save.' };
      if (!same(now, base)) return { status: 409, ok: false, output: `${name}'s official contract has changed since this draft was made. Open it again and make the changes there.` };
      fs.writeFileSync(file, JSON.stringify({ ...contract, figma: now.figma }, null, 2) + '\n');
    } else if (action === 'take-figma') {
      const late = facts.behind.find((d) => d.key === now.figma.key && d.figma);
      if (!late) return { status: 400, ok: false, output: `Figma is not behind on ${name}.` };
      fs.writeFileSync(file, JSON.stringify(late.figma, null, 2) + '\n');
    } else {
      if (!fs.existsSync(file)) return { status: 400, ok: false, output: `${name} has no official contract file to drop.` };
      fs.rmSync(file);
    }
    cache.delete(label);
    return { status: 200, ok: true, output: action === 'drop-official' ? `${name}'s official contract dropped.` : `${name}'s official contract saved.`, facts: factsOf(label) };
  }
  return { status: 400, ok: false, output: `no action called ${action}` };
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost').pathname;
  const send = (code, type, body) => { res.writeHead(code, { 'content-type': type + '; charset=utf-8', 'cache-control': 'no-store' }); res.end(body); };
  // only this machine's names for itself: a page elsewhere that points its own name here (DNS rebinding) reads nothing
  const hosts = [`localhost:${server.address().port}`, `127.0.0.1:${server.address().port}`];
  if (!hosts.includes(req.headers.host)) return send(403, 'text/plain', 'refused');
  if (url === '/sync') {
    // a write, so only from this page: its own origin
    if (req.method !== 'POST' || req.headers.origin !== `http://${req.headers.host}`) return send(403, 'application/json', JSON.stringify({ ok: false, output: 'refused' }));
    let body = '';
    req.on('data', (c) => { body += c; if (body.length > 1 << 22) req.destroy(); });
    req.on('end', async () => {
      let r;
      try { r = await sync(JSON.parse(body || '{}')); } catch (e) { r = { status: 500, ok: false, output: e.message }; }
      const { status, ...rest } = r;
      send(status, 'application/json', JSON.stringify(rest));
    });
    return;
  }
  // started on none, the snapshots the router kept for files no project claims, to make one of
  if (url === '/projects.json') return send(200, 'application/json', JSON.stringify({ start, projects: registered(), ...(start ? {} : { kept: projects.unclaimed().length > 0 }) }));
  if (url === '/project.json') {
    const label = new URL(req.url, 'http://localhost').searchParams.get('label');
    if (label && !registered().some((p) => p.label === label)) return send(404, 'application/json', JSON.stringify({ error: `no project called ${label}` }));
    try { return send(200, 'application/json', JSON.stringify(factsOf(label))); } catch (e) { return send(500, 'application/json', JSON.stringify({ error: e.message })); }
  }
  // one of the project's icons: a file name in its icons folder, never a path out of it
  if (url === '/icon.svg') {
    const q = new URL(req.url, 'http://localhost').searchParams;
    const label = q.get('label');
    const name = q.get('file') || '';
    if (!registered().some((p) => p.label === label) || !/^[a-z0-9-]+$/.test(name)) return send(404, 'text/plain', 'not found');
    const dir = factsOf(label).iconDir;
    const f = dir && path.join(dir, name + '.svg');
    if (!f || !fs.existsSync(f)) return send(404, 'text/plain', 'not found');
    res.writeHead(200, { 'content-type': 'image/svg+xml', 'cache-control': 'max-age=60' });
    return res.end(fs.readFileSync(f));
  }
  // a component's preview: a folder name the snapshot drew one for, never a path out of the previews folder
  if (url === '/preview.png') {
    const q = new URL(req.url, 'http://localhost').searchParams;
    const label = q.get('label');
    const name = q.get('file') || '';
    if (!registered().some((p) => p.label === label) || !/^[a-z0-9-]+$/.test(name)) return send(404, 'text/plain', 'not found');
    const { previews, previewDir } = factsOf(label);
    const known = Object.values(previews || {}).find((x) => x.file === name);
    const f = known && path.join(previewDir, `${name}${q.get('dark') === '1' && known.dark ? '.dark' : ''}.png`);
    if (!f || !fs.existsSync(f)) return send(404, 'text/plain', 'not found');
    res.writeHead(200, { 'content-type': 'image/png', 'cache-control': 'max-age=60' });
    return res.end(fs.readFileSync(f));
  }
  const file = fileFor(url);
  if (!file || !fs.existsSync(file)) return send(404, 'text/plain', 'not found');
  send(200, TYPES[path.extname(file)], fs.readFileSync(file));
}).listen(port, '127.0.0.1', () => {
  // the port read back, so --port 0 (any free one, as the test asks) prints the one it got
  console.log(`contract editor: http://localhost:${server.address().port}/` + (start ? ` (starting on ${start})` : ''));
  if (!start && !argv.includes('--no-router')) router();
});
// a taken port is said, with the way round it, not thrown as a stack (a first run from a clone met one, 2026-10-30)
server.on('error', (e) => {
  console.error(e.code === 'EADDRINUSE' ? `port ${port} is already in use: stop what holds it, or start on another with --port <n>` : e.message);
  process.exit(1);
});

/* Started on no project, the snapshot router too, where nothing holds its port (a login agent, another editor): the
   plugin's snapshot of a library no project claims is then kept for Settings to make a project of, in one run. It
   stops with the editor. --no-router leaves it out (a test). */
function router() {
  const probe = net.connect(9317, '127.0.0.1');
  probe.on('connect', () => probe.destroy());
  probe.on('error', () => {
    const child = spawn(process.execPath, [path.join(HERE, '..', 'snapshot', 'router.mjs')], { stdio: 'inherit' });
    process.on('exit', () => child.kill());
    for (const s of ['SIGINT', 'SIGTERM']) process.on(s, () => { child.kill(); process.exit(0); });
  });
}
