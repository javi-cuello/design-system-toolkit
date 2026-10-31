#!/usr/bin/env node
// node tools/parity/test-project.mjs — from the toolkit root. How a project's
// mappings are read: bases, and what each variant renders as.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { resolveBases, expand, unrenderedOf, scopeTargets, checkFacts, loadParity } from './project.mjs';

let n = 0;
const ok = (name, cond) => { n++; assert.ok(cond, name); console.log('ok', name); };
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const V = (...names) => names.map((name) => ({ name, children: [] }));

const screens = resolveBases({
  home: { route: '/', nodes: { Main: 'main', Footer: 'footer' }, waivers: { 'Main.height': 'feed' } },
  scrolled: { base: 'home', page: { scroll: 'end' }, nodes: { Footer: false, Aside: 'aside' }, waivers: { 'Main.height': false } },
});
ok('a screen starts from its base, its own entries win, and false drops what it would inherit',
  screens.scrolled.route === '/' && screens.scrolled.nodes.Main === 'main' && !('Footer' in screens.scrolled.nodes)
  && screens.scrolled.nodes.Aside === 'aside' && !('Main.height' in screens.scrolled.waivers) && screens.home.waivers['Main.height'] === 'feed');
ok('a base that names itself through a cycle is refused', (() => { try { resolveBases({ a: { base: 'b' }, b: { base: 'a' } }); return false; } catch (e) { return /cycle/.test(e.message); } })());

const button = V('Size=lg, State=Rest', 'Size=lg, State=Hover', 'Size=sm, State=Rest', 'Size=sm, State=Hover', 'Size=xl, State=Rest');
const axes = { layers: { Label: '.label' }, axes: { Size: { lg: { size: 'lg' }, sm: { size: 'sm', layers: { Label: '.small' } } }, State: { Rest: {}, Hover: { pseudo: 'hover', on: '.box' } } } };
const r = expand(axes, button);
ok('axes expand every variant they declare, args and states included',
  r.size === 4 && r.get('Size=lg, State=Hover').pseudo === 'hover' && r.get('Size=lg, State=Hover').on === '.box' && r.get('Size=sm, State=Rest').args.size === 'sm');
ok('an axis value may name a layer\'s element where it draws it', r.get('Size=sm, State=Rest').layers.Label === '.small' && r.get('Size=lg, State=Rest').layers.Label === '.label'
  && !('layers' in r.get('Size=sm, State=Rest').args));
ok('a value nobody declared is unrendered, and gate 3 names it', unrenderedOf('button', axes, button, r).join() === 'button :: Size=xl, State=Rest');

const C = { state: { axis: 'State', rest: 'Rest', pseudo: { Hover: 'hover', Focus: 'focus-visible' } }, disabled: { axis: 'Disabled', off: 'False', on: 'True', arg: 'disabled' } };
const input = V('Disabled=False, Validation=None, State=Rest, Value=True', 'Disabled=False, Validation=None, State=Hover, Value=True',
  'Disabled=False, Validation=None, State=Focus, Value=True', 'Disabled=True, Validation=None, State=Rest, Value=True');
const list = { state: 'input', controls: { disabled: { type: 'boolean' } }, sample: { label: 'Label' }, nodes: { Field: '.f' },
  variants: [{ figma: 'Disabled=False, Validation=None, State=Rest, Value=True', props: { value: 'x' }, nodes: { Icon: null }, waivers: { 'Field.width': 'w' } }] };
const l = expand(list, input, C);
ok('a listed resting variant brings its state siblings, on the element the mapping names, with its own layers and waivers',
  l.get('Disabled=False, Validation=None, State=Hover, Value=True').pseudo === 'hover' && l.get('Disabled=False, Validation=None, State=Focus, Value=True').on === 'input'
  && l.get('Disabled=False, Validation=None, State=Focus, Value=True').layers.Icon === null && l.get('Disabled=False, Validation=None, State=Hover, Value=True').own['Field.width'] === 'w');
ok('and its disabled sibling wherever the axes sit in the name, with the sample words', l.get('Disabled=True, Validation=None, State=Rest, Value=True').args.disabled === true
  && l.get('Disabled=True, Validation=None, State=Rest, Value=True').args.label === 'Label' && l.get('Disabled=True, Validation=None, State=Rest, Value=True').args.value === 'x');
// Review 2026-10-02 round 2, R10: `unmeasured` kept `accepted: true` after
// the waivers gate refused it, because nothing checked an excuse's fields.
ok('an unmeasured excuse is a reason, or { reason, fix }; a field nothing reads is refused',
  unrenderedOf('modal', { unmeasured: { 'Size=lg, State=Rest': { reason: 'the scrim', accepted: true } } }, button, r).some((l) => /"accepted" is not an unmeasured field/.test(l))
  && unrenderedOf('modal', { unmeasured: { 'Size=lg, State=Rest': { reason: 'wired wrong', fix: true } } }, button, r).some((l) => /fix is 'figma' or 'code'/.test(l))
  && !unrenderedOf('modal', { unmeasured: { 'Size=lg, State=Rest': { reason: 'wired wrong', fix: 'figma' }, 'Size=sm, State=Rest': 'why' } }, button, r).some((l) => /field|fix is|no reason/.test(l)));
// R8: `bin/parity contact --shots`, documented, answered "no such target".
{
  const T = [{ name: 'contact--1-1-initial', folder: 'contact--1-1-initial', family: 'contact' }, { name: 'contact--1-1-initial--402', folder: 'contact--1-1-initial--402', family: 'contact' },
    { name: 'contacts-list', folder: 'contacts-list', family: 'contacts-list' }, { name: '1-1-people', folder: '1-1-people', family: 'contacts-list' }];
  const s = (...w) => { const x = scopeTargets(T, w); return [x.targets.map((t) => t.name).join(), x.unknown.join()]; };
  ok('a word scopes a run to the target it names, or else to its family; a word naming neither is unknown',
    eq(s('contact'), ['contact--1-1-initial,contact--1-1-initial--402', '']) && eq(s('contacts-list'), ['contacts-list', ''])
    && eq(s('contact--1-1-initial'), ['contact--1-1-initial', '']) && eq(s('cont'), ['', 'cont']));
}
// R15: hosts.mjs has an app host, and checkFacts refused it by name.
ok('a project whose every page is a route may name the app host, and then owes the app\'s facts and a route on every mapping',
  checkFacts({ parity: { host: { kind: 'app' }, tiers: ['light'], mappings: { screens: {} }, app: { base: 'http://x', shell: 'main' } } }, true, []).length === 0
  && checkFacts({ parity: { host: { kind: 'app' }, tiers: ['light'], mappings: { screens: {} } } }, false, []).some((l) => /parity\.app\.base/.test(l))
  && checkFacts({ parity: { host: { kind: 'app' }, tiers: ['light'], mappings: { screens: {} }, app: { base: 'http://x', shell: 'main' } } }, true, ['badge']).some((l) => /route on every mapping/.test(l)));
// A third project adopts the engine with facts alone: a config, a token
// snapshot, a component spec and a mapping file — no code of its own.
{
  const { mkdtempSync, mkdirSync, writeFileSync } = await import('node:fs');
  const { join } = await import('node:path');
  const { tmpdir } = await import('node:os');
  const { loadProject } = await import('./project.mjs');
  const repo = mkdtempSync(join(tmpdir(), 'third-project-'));
  mkdirSync(join(repo, 'design/components/badge'), { recursive: true });
  // Review 2026-10-02 item 10: this fixture wrote `host: 'fragments'`, a
  // string, which loaded and then threw `no host "undefined"` in session().
  const config = {
    paths: { tokens: 'design/figma.json', components: 'design/components', screens: 'design/screens' },
    parity: { host: { kind: 'fragments', base: 'http://localhost:1', url: '/c/{component}' }, tiers: ['light'], mappings: { components: { json: 'design/parity.json' } } },
  };
  writeFileSync(join(repo, 'snapshot.config.json'), JSON.stringify(config));
  writeFileSync(join(repo, 'design/figma.json'), JSON.stringify({ collections: {} }));
  writeFileSync(join(repo, 'design/components/badge/figma.json'), JSON.stringify({
    name: 'Badge', default: { name: 'Size=md', type: 'COMPONENT', w: 40, h: 20, children: [] }, variants: [],
  }));
  writeFileSync(join(repo, 'design/parity.json'), JSON.stringify({ badge: { root: 'ds-badge', variants: { 'Size=md': {} } } }));
  const p = await loadProject(repo);
  ok('a third project with only a config, a snapshot and a mapping loads: one target, nothing orphaned or unrendered',
    p.targets.length === 1 && p.targets[0].name === 'badge' && p.orphans.length === 0 && p.targets[0].unrendered.length === 0);
  const { session } = await import('./session.mjs');
  const S = await session(p, { page: true, app: false, browser: false, say: () => {} });
  ok('and its pages come up through the session and the host it names, no browser asked',
    typeof S.PAGE.fragment === 'function' && S.PAGE.scope('k') === '[data-parity="k"]' && S.ROUTES === null);
  S.close();
  // Review 2026-10-02 item 23: a missing fact was a TypeError mid-run
  const refused = async (parity, paths = config.paths) => {
    writeFileSync(join(repo, 'snapshot.config.json'), JSON.stringify({ paths, parity: { mappings: config.parity.mappings, ...parity } }));
    try { await loadProject(repo); return ''; } catch (e) { return e.message; }
  };
  ok('a config missing what a run needs is refused at load, each key named',
    /parity\.host\.kind/.test(await refused({ tiers: ['light'] }))
    && /parity\.host\.url/.test(await refused({ host: { kind: 'fragments', base: 'x' }, tiers: ['light'] }))
    && /paths\.storybook\.themeGlobal/.test(await refused({ host: { kind: 'storybook', frameGlobal: 'f', base: 'x' }, tiers: ['light'] }))
    && /parity\.tiers/.test(await refused({ host: config.parity.host })));
  // Review 2026-10-02 item 42: an unknown flag ran a full run in silence, and
  // a run with nothing to measure exited 0
  const { spawnSync } = await import('node:child_process');
  const run = (...args) => spawnSync(process.execPath, [new URL('./run.mjs', import.meta.url).pathname, '--repo', repo, ...args], { encoding: 'utf8' });
  writeFileSync(join(repo, 'snapshot.config.json'), JSON.stringify(config));
  const typo = run('--acept');
  writeFileSync(join(repo, 'design/parity.json'), '{}');
  const empty = run();
  ok('an option nobody reads is refused, and a run with nothing to measure is red',
    typo.status === 2 && /no such option: --acept/.test(typo.stdout) && empty.status === 1 && /nothing to measure/.test(empty.stdout));
  writeFileSync(join(repo, 'design/parity.json'), JSON.stringify({ badge: { root: 'ds-badge', route: '/badge', variants: { 'Size=md': {} } } }));
  ok('and a route with no app to open it on names parity.app.base and shell', /parity\.app\.base[\s\S]*parity\.app\.shell/.test(await refused(config.parity)));
}

// a library built elsewhere: its parity facts in its context document, its mappings in the project's home
{
  const compared = { project: 'x', compared: true, parity: { host: { kind: 'storybook', build: { run: 'build -o {out}', dir: 'apps/sb' } }, tiers: ['Light'], mappings: { components: { json: 'parity/mappings.json' } } } };
  ok('a library compared needs no frame or theme global, and has one tier', checkFacts(compared).length === 0
    && checkFacts({ ...compared, parity: { ...compared.parity, tiers: ['Light', 'Dark'] } }).some((m) => /one tier/.test(m))
    && checkFacts({ ...compared, compared: false, paths: {} }).some((m) => /frameGlobal/.test(m)));
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'parity-compared-'));
  const home = path.join(root, 'acme', 'figma-design-system');
  fs.mkdirSync(path.join(home, 'snapshot', 'components', 'chip'), { recursive: true });
  fs.mkdirSync(path.join(home, 'parity'));
  fs.writeFileSync(path.join(home, 'snapshot', 'components', 'chip', 'figma.json'), JSON.stringify({ name: 'Chip', props: { Size: ['Md'] }, variants: [{ name: 'Size=Md', type: 'COMPONENT', children: [] }] }));
  fs.writeFileSync(path.join(home, 'parity', 'mappings.json'), JSON.stringify({ chip: { storyId: 'chip--playground' }, gone: { storyId: 'gone--x' } }));
  const settings = { libraries: { KEYA: { framework: 'mui', code: { repo: '~/elsewhere', components: 'src', parity: compared.parity } } } };
  fs.writeFileSync(path.join(home, 'design-system-context.md'), '# acme\n\n```json snapshot-routing\n' + JSON.stringify({ files: { library: [{ key: 'KEYA', id: 'IDA', roles: ['components', 'tokens'] }] } }) + '\n```\n\n```json audit-settings\n' + JSON.stringify(settings) + '\n```\n');
  const before = process.env.TOOLKIT_PROJECTS_ROOT;
  process.env.TOOLKIT_PROJECTS_ROOT = root;
  try {
    const p = await loadParity('acme');
    ok('a library compared is read from its context document: its code, its one tier, its mappings in the project\'s home, built where the docs site serves it',
      p.mode === 'compared' && p.repo.endsWith('/elsewhere') && p.targets.length === 1 && p.targets[0].mapping.storyId === 'chip--playground'
      && p.storybookOut === path.join(home, 'storybook') && p.lib.frameworkProfile.instance === 'Mui{Name}-root');
    ok('a mapping for a component the snapshot does not hold is said, never measured', p.orphans.length === 1 && /gone/.test(p.orphans[0]));
  } finally { if (before === undefined) delete process.env.TOOLKIT_PROJECTS_ROOT; else process.env.TOOLKIT_PROJECTS_ROOT = before; fs.rmSync(root, { recursive: true, force: true }); }
}

console.log(`${n}/${n} passed`);
