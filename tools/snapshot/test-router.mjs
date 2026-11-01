#!/usr/bin/env node
// What the snapshot chain must get right, walked against real files, real
// projects and a real server. Run: node test-router.mjs
//
// Every case here is a way a snapshot could land in the wrong repo, be lost,
// or be reported as something it was not — which is the whole reason any of
// this exists. Before the router, whichever receiver happened to be listening
// wrote whatever was snapshotted.

import assert from 'node:assert';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { spawn, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import contract from './projects.cjs';

// Deliveries are timed on the machine (deliver.cjs RUNS); a test's go to a scratch file, never the real one.
process.env.TOOLKIT_SNAPSHOT_RUNS = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'snapshot-runs-')), 'runs.json');

const { identify, projects, route, routing } = contract;
const HERE = path.dirname(fileURLToPath(import.meta.url));

/* This machine's pairing code, for the routers the suite starts: a file of
   the suite's own, never the user's ~/.toolkit/pairing-code. */
const PAIRING_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'snapshot-pairing-'));
const PAIRING = path.join(PAIRING_DIR, 'pairing-code');
const CODE = 'suite-pairing-code-0123';
fs.writeFileSync(PAIRING, CODE + '\n', { mode: 0o600 });
process.on('exit', () => fs.rmSync(PAIRING_DIR, { recursive: true, force: true }));
const paired = (url) => url + (url.includes('?') ? '&' : '?') + 'code=' + CODE;

/*
 * A world of projects on disk: each one a context document naming its files
 * and its repo, and a repo whose snapshot.config.json names one step after
 * each kind, which records that it ran. `exit` makes that step a required one
 * that fails, to act out a crash.
 */
const roots = [];
process.on('exit', () => { for (const r of roots) fs.rmSync(r, { recursive: true, force: true }); });
function world(specs) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'snapshot-world-'));
  roots.push(root);
  const made = [];
  for (const spec of specs) {
    const { name, files, exit = 0, step = null } = spec;
    const repo = path.join(root, 'repos', name);
    fs.mkdirSync(repo, { recursive: true });
    const log = path.join(repo, 'handled.txt');
    const after = (kind) => [{ label: 'recorded', run: step || `echo ${kind} >> handled.txt; exit ${exit}`, required: true }];
    fs.writeFileSync(path.join(repo, 'snapshot.config.json'),
      JSON.stringify({ toolkit: root, project: name, after: { library: after('library'), screens: after('screens') } }));
    const docDir = path.join(root, 'projects', name);
    fs.mkdirSync(docDir, { recursive: true });
    fs.writeFileSync(path.join(docDir, 'design-system-context.md'),
      `# ${name}\n\n\`\`\`json snapshot-routing\n${JSON.stringify({ repo, files }, null, 2)}\n\`\`\`\n`);
    made.push({ name, repo, log, files, doc: path.join(docDir, 'design-system-context.md') });
  }
  return { root, projectsDir: path.join(root, 'projects'), made };
}

const two = () => world([
  { name: 'alpha', files: { library: { key: 'KEYA', id: 'IDA' }, screens: { key: 'SKEYA', id: 'SIDA' } } },
  { name: 'beta', files: { library: { key: 'KEYB', id: 'IDB' }, screens: { key: 'SKEYB', id: 'SIDB' } } },
]);

/* The smallest payloads payload.cjs accepts: the router refuses anything
   less before routing, so these carry the shape and nothing else. */
const tokensOf = (id, extra = {}) => ({
  _meta: { file: 'UI library', fileId: id, snapshot: '2026-09-18' },
  collections: { Base: { modes: ['Mode 1'], values: { 'Mode 1': { 'Spacing/4': 4 } }, alias: {} } },
  textStyles: [], paintStyles: [], effects: [], ...extra,
});
const lib = (id, extra = {}) => ({ tokens: tokensOf(id, extra.tokens), components: extra.components || [], icons: [], iconSets: [] });
const scr = (id, screens = [{ section: null, page: 'Page', frame: '<Page> 1-1 - Main', id: '1:1', devStatus: { type: 'READY_FOR_DEV' }, tree: { name: '<Page> 1-1 - Main', type: 'FRAME', w: 100 } }]) => ({ _meta: { fileId: id }, screens });

/* One server, driven over HTTP, so what is tested is the thing that runs. */
async function serving(projectsDir, body) {
  const port = 9400 + Math.floor(Math.random() * 500);
  // SNAPSHOT_QUIET: the router would otherwise spawn the describer after a library write, and the suite must not call an API.
  const server = spawn('node', [path.join(HERE, 'router.mjs'), '--projects', projectsDir, '--port', String(port)],
    { stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, SNAPSHOT_QUIET: '1', TOOLKIT_UNCLAIMED: `${projectsDir}-unclaimed`, TOOLKIT_PAIRING: PAIRING } });
  let banner = '';
  await new Promise((done, fail) => {
    server.stdout.on('data', (c) => { banner += c; if (banner.includes('In Figma')) done(); });
    server.on('exit', () => fail(new Error(`the router exited: ${banner}`)));
    setTimeout(() => fail(new Error(`the router never started: ${banner}`)), 8000);
  });
  const post = (url, payload) => fetch(`http://127.0.0.1:${port}${paired(url)}`, { method: 'POST', body: JSON.stringify(payload) });
  try { return await body({ post, port, banner }); } finally { server.kill(); }
}

test('only the plugin and local tools reach the router: a web page, a look-alike host and a rebound Host are refused, and no answer names a project', async () => {
  const { projectsDir } = two();
  const http = await import('node:http');
  const ask = (port, headers, method = 'GET') => new Promise((done, fail) => {
    const r = http.request({ host: '127.0.0.1', port, path: '/', method, headers }, (res) => { let b = ''; res.on('data', (c) => { b += c; }); res.on('end', () => done({ status: res.statusCode, body: b, cors: res.headers['access-control-allow-origin'] })); });
    r.on('error', fail); r.end(method === 'POST' ? '{}' : undefined);
  });
  await serving(projectsDir, async ({ port }) => {
    const local = await ask(port, {});
    assert.equal(local.status, 200, 'a local tool, with no Origin');
    assert.equal(typeof JSON.parse(local.body).projects, 'number', 'a count, never the names');
    const plugin = await ask(port, { Origin: 'null' });
    assert.equal(plugin.status, 200); assert.equal(plugin.cors, 'null');
    assert.equal((await ask(port, { Origin: 'https://www.figma.com' })).status, 200);
    for (const origin of ['https://evil.example', 'https://evilfigma.com', 'https://figma.com.evil.example']) {
      const r = await ask(port, { Origin: origin });
      assert.equal(r.status, 403, origin); assert.equal(r.cors, undefined, `${origin} gets no CORS`);
      assert.equal((await ask(port, { Origin: origin }, 'POST')).status, 403, `${origin} cannot post`);
    }
    assert.equal((await ask(port, { Host: `attacker.example:${port}` })).status, 403, 'a rebound DNS name');
  });
});

test('only the paired plugin may post or ask about a file: no code, a wrong code or a code from a page writes nothing, keeps nothing and says where the code is', async () => {
  const { projectsDir, made } = two();
  await serving(projectsDir, async ({ port }) => {
    const at = `http://127.0.0.1:${port}`;
    const unclaimed = `${projectsDir}-unclaimed`;
    for (const q of ['', '?code=', '?code=wrong', `?code=${CODE.slice(0, -1)}`, `?code=${CODE}x`]) {
      // a library no project claims: the one a page would use to fill the unclaimed folder
      const stranger = await fetch(`${at}/library${q}`, { method: 'POST', headers: { Origin: 'null' }, body: JSON.stringify(lib('STRANGER')) });
      assert.equal(stranger.status, 401, `posted with ${q || 'no code'}`);
      assert.match(await stranger.text(), /not paired.*node .*pairing\.cjs/, 'the refusal names the command that prints the code');
      assert.equal((await fetch(`${at}/library${q}`, { method: 'POST', body: JSON.stringify(lib('IDA')) })).status, 401, `a claimed library, ${q || 'no code'}`);
      const asked = await fetch(`${at}/?file=KEYA${q ? '&' + q.slice(1) : ''}`, { headers: { Origin: 'null' } });
      assert.equal(asked.status, 401);
      const said = await asked.json();
      assert.equal(said.paired, false); assert.equal(said.kind, undefined, 'no kind told');
    }
    assert.ok(!fs.existsSync(unclaimed) || !fs.readdirSync(unclaimed).length, 'nothing kept to make a project of');
    assert.ok(!fs.existsSync(made[0].log), 'no after-snapshot step ran');
    // the bare question stays open: the plugin asks it before it has a code, and it names nothing
    assert.equal((await fetch(at, { headers: { Origin: 'null' } })).status, 200);
    // and with the code, the same post is routed and written
    assert.equal((await fetch(`${at}${paired('/library')}`, { method: 'POST', headers: { Origin: 'null' }, body: JSON.stringify(lib('IDA')) })).status, 200);
    assert.equal((await (await fetch(`${at}/${paired('?file=KEYA')}`)).json()).kind, 'library');
  });
});

test('the pairing code is made once, for this user alone, and printed by its command', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pairing-made-'));
  const file = path.join(dir, 'nested', 'pairing-code');
  const run = () => execFileSync('node', [path.join(HERE, 'pairing.cjs')], { env: { ...process.env, TOOLKIT_PAIRING: file }, encoding: 'utf8' }).trim();
  const first = run();
  assert.ok(first.length >= 16, `a code worth guessing at: ${first}`);
  assert.equal(run(), first, 'the same code every time it is asked for');
  assert.equal(fs.statSync(file).mode & 0o777, 0o600, 'readable by this user only');
  assert.equal(fs.statSync(path.dirname(file)).mode & 0o777, 0o700);
  fs.chmodSync(file, 0o644);
  run();
  assert.equal(fs.statSync(file).mode & 0o777, 0o600, 'a file others could read is narrowed before use');
  fs.rmSync(dir, { recursive: true, force: true });
});

test('the login agents log where only this user reads, never the shared temp folder', () => {
  const install = fs.readFileSync(path.join(HERE, '..', '..', 'install.sh'), 'utf8');
  for (const plist of [path.join(HERE, 'com.toolkit.figma-snapshot.plist'), path.join(HERE, '..', 'figma-audit', 'com.toolkit.figma-audit.plist')]) {
    const text = fs.readFileSync(plist, 'utf8');
    assert.doesNotMatch(text, /<string>\/tmp\//, `${path.basename(plist)} logs to /tmp`);
    const logs = [...text.matchAll(/<key>Standard(?:Out|Error)Path<\/key>\s*<string>([^<]+)<\/string>/g)].map((m) => m[1]);
    assert.equal(logs.length, 2, path.basename(plist));
    assert.ok(logs.every((l) => l.startsWith('LOGS/')), `${path.basename(plist)}: ${logs.join(', ')}`);
  }
  assert.match(install, /logs="\$HOME\/Library\/Logs\/toolkit"/);
  assert.match(install, /chmod 700 "\$logs"/, 'a folder only this user reads');
  assert.match(install, /-e "s\|LOGS\|\$logs\|g"/, 'install.sh fills it in');
});

test('a project is discovered by its context document; one without a block claims nothing', () => {
  const { projectsDir, root } = two();
  fs.mkdirSync(path.join(root, 'projects', 'half-done'), { recursive: true });
  fs.writeFileSync(path.join(root, 'projects', 'half-done', 'design-system-context.md'), '# nothing machine-readable yet\n');
  const { list, errors } = projects(projectsDir);
  assert.deepEqual(list.map((p) => p.name).sort(), ['alpha', 'beta']);
  /* Silence about it, too: a project part-way through setup is not an error,
     it just does not claim anything yet. */
  assert.deepEqual(errors, []);
});

test('a routing block that is not valid JSON is reported, never skipped in silence', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'snapshot-bad-'));
  const doc = path.join(dir, 'design-system-context.md');
  fs.writeFileSync(doc, '```json snapshot-routing\n{ not json\n```\n');
  assert.match(routing(doc).error, /not valid JSON/);
  fs.mkdirSync(path.join(dir, 'projects', 'broken'), { recursive: true });
  fs.copyFileSync(doc, path.join(dir, 'projects', 'broken', 'design-system-context.md'));
  assert.match(projects(path.join(dir, 'projects')).errors[0], /not valid JSON/);
});

test("either of a file's two names addresses it, and the routes do not cross", () => {
  const { projectsDir } = two();
  const { list } = projects(projectsDir);
  assert.equal(route(list, 'library', 'KEYA').project.name, 'alpha');
  assert.equal(route(list, 'library', 'IDA').project.name, 'alpha');
  assert.equal(route(list, 'screens', 'SIDB').project.name, 'beta');
  /* A screens id offered on the library route belongs to nobody: two files,
     two routes, and they are not interchangeable. */
  assert.match(route(list, 'library', 'SIDA').error, /no project lists this file/);
  assert.equal(identify(lib('IDA')), 'IDA');
  assert.equal(identify(scr('SIDA')), 'SIDA');
  assert.equal(identify({}), null);
});

test('an unknown id and a missing id are refused, and say what to do', () => {
  const { projectsDir } = two();
  const { list } = projects(projectsDir);
  const r = route(list, 'library', 'STRANGER'), unknown = r.error;
  assert.match(unknown, /no project lists this file as its library.*"STRANGER"/);
  assert.doesNotMatch(unknown, /alpha/, 'the plugin is not shown the other projects');
  assert.match(r.detail, /alpha KEYA \/ IDA/, 'the router log is');
  assert.match(unknown, /snapshot-routing block/);
  assert.ok(route(list, 'library', 'NEWKEY', 'fNEW').error.includes('{"key":"NEWKEY","id":"fNEW"}'), 'a run that sends both names is told to add both');
  assert.ok(route(list, 'library', 'NEWKEY').error.includes('{"key":"NEWKEY"}'), 'a run that sends only the key is told to add it as the key');
  assert.ok(route(list, 'library', 'fOLD', 'fOLD').error.includes('{"id":"fOLD"}'), 'a run before 0.67.0 sends only the id');
  const bare = [{ name: 'old', files: { library: { id: 'fBARE' } } }];
  assert.ok(route(bare, 'library', 'BAREKEY', 'fBARE').error.includes('{"key":"BAREKEY","id":"fBARE"}') && /only if this is that file, not a duplicate/.test(route(bare, 'library', 'BAREKEY', 'fBARE').error), 'an entry routed by id alone is the file, not its original: told to add the key beside it');
  assert.ok(route(list, 'library', 'NEWKEY', 'IDA').error.includes('{"key":"NEWKEY"}'), "a copy is never told to add its original's id");
  assert.match(route(list, 'library', null).error, /too old \(before 0\.17\.0\)/);
});

test('two projects claiming one id is refused, naming both', () => {
  const { projectsDir, made } = two();
  const doc = made[1].doc;
  fs.writeFileSync(doc, fs.readFileSync(doc, 'utf8').replace('"IDB"', '"IDA"'));
  const { list } = projects(projectsDir);
  assert.match(route(list, 'library', 'IDA').error, /alpha and beta both list this file/);
});

test('an icon page\'s components are addressable: names joined to the page they sit on', async () => {
  const { createRequire } = await import('node:module');
  const store = createRequire(import.meta.url)('./store.cjs');
  // An icon page is exported as SVGs and gets no component spec, so its
  // names in `owns.icons` and the page in `owns.iconPage` are all a reader
  // has. Before plugin 0.35.0 the page was not recorded and a library
  // audited from its snapshot saw 40 of 69 components with no way to name
  // the 29 it lacked.
  const placed = { _meta: { sources: {
    A: { file: 'UI library', owns: { icons: ['plus', 'search'], iconPage: '\u2756 Icon' } },
    B: { file: 'Mobile', owns: { icons: [] } },
  } } };
  const r = store.iconComponents(placed);
  assert.deepEqual(r.icons, [{ name: 'plus', page: '\u2756 Icon' }, { name: 'search', page: '\u2756 Icon' }]);
  assert.deepEqual(r.unplaced, [], 'a source with no icons is not unplaced, it simply has none');
  const older = { _meta: { sources: { A: { file: 'UI library', owns: { icons: ['plus', 'search'] } } } } };
  const o = store.iconComponents(older);
  assert.deepEqual(o.icons, [], 'an older store places nothing');
  assert.deepEqual(o.unplaced, [{ file: 'UI library', icons: 2 }], 'and says whose icons it could not place, rather than passing over them');
});

test('a second table in the rulings section is not a table of rulings', () => {
  // §6 holds the rulings table and, on one project, fourteen narrative
  // sections after it — one of which ends in a routing table. Every row of it
  // was served to the dashboard and the audit judge as a project ruling
  // (`{date: "Route", scope: "Accepts only"}`), and worse: the dashboard
  // appends a new ruling after the LAST row it walked, so a ruling recorded
  // from the page would have been written into the middle of that table.
  const md = [
    '## 6 \u00b7 Rulings log',
    '',
    '| Date | Scope | Ruling | Why | Decided by |',
    '|---|---|---|---|---|',
    '| 2026-09-01 | Web | **A real ruling** | because | Maintainer |',
    '',
    '### 2026-09-02 \u2014 a narrative section, which \u00a76 also holds',
    '',
    '| Route | Accepts only | Recorded in |',
    '|---|---|---|',
    '| `/library` | `KEY` (UI library) | the routing block |',
    '',
  ].join('\n');
  const rulings = contract.rulingsOf(md);
  assert.equal(rulings.length, 1, 'one table of rulings, one ruling');
  assert.equal(rulings[0].date, '2026-09-01');
  assert.equal(rulings[0].why, 'because', 'the Why column travels with the ruling: a dashboard ruling names its component there');
  let last = -1;
  contract.walkRulings(md.split('\n'), (i) => { last = i; });
  assert.equal(md.split('\n')[last], '| 2026-09-01 | Web | **A real ruling** | because | Maintainer |',
    'and a new ruling would be appended under the rulings table, not under the other one');
});

test('the server writes each payload into the right repo and runs that repo\'s steps', async () => {
  const { projectsDir, made } = two();
  await serving(projectsDir, async ({ post }) => {
    assert.equal((await post('/library', lib('IDB'))).status, 200);
    assert.equal((await post('/screens', scr('SIDA'))).status, 200);
    const stranger = await post('/library', lib('NOBODYS'));
    assert.equal(stranger.status, 409);
    assert.match(await stranger.text(), /no project lists this file.*with the code [A-Z0-9]{6}: this snapshot is kept/);
    const screens = await post('/screens', scr('NOBODYSSCREENS'));
    assert.equal(screens.status, 409);
    assert.doesNotMatch(await screens.text(), /with the code/, 'a screens file no project claims is refused, not kept');
  });
  // kept, for the contract editor to make a project of; a screens file is not
  const kept = fs.readdirSync(`${projectsDir}-unclaimed`).filter((f) => !f.endsWith('.meta.json'));
  assert.equal(kept.length, 1, 'a library no project claims is kept, once');
  assert.match(kept[0], /^[A-Z2-9]{6}\.json$/, 'under its one-time code, not its id');
  assert.equal(fs.statSync(`${projectsDir}-unclaimed`).mode & 0o777, 0o700, "the folder is this user's alone");
  assert.equal(fs.statSync(path.join(`${projectsDir}-unclaimed`, kept[0])).mode & 0o777, 0o600, 'and so is each snapshot in it');
  const [alpha, beta] = made;
  assert.equal(fs.readFileSync(beta.log, 'utf8').trim(), 'library');
  assert.equal(fs.readFileSync(alpha.log, 'utf8').trim(), 'screens');
  assert.ok(fs.existsSync(path.join(beta.repo, 'tokens.json')), "beta's library was written in beta's repo");
  assert.ok(fs.existsSync(path.join(alpha.repo, 'screens/page--main/figma.json')), "alpha's screen was written in alpha's repo");
  /* One payload each: the stranger reached neither of them. */
  assert.ok(!fs.existsSync(path.join(alpha.repo, 'tokens.json')));
});

test('a kept snapshot: the five newest, none past a day, none oversized, never in a folder others may read', () => {
  // in a process of its own: the folder is read from the environment when projects.cjs loads
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kept-')), at = path.join(dir, 'kept');
  try {
    const run = (js) => execFileSync(process.execPath, ['-e', `const p = require(${JSON.stringify(path.join(HERE, 'projects.cjs'))}); const fs = require('fs'); const lib = (id) => ({ tokens: { _meta: { fileId: id } } }); ${js}`], { env: { ...process.env, TOOLKIT_UNCLAIMED: at }, encoding: 'utf8' }).trim();
    const codes = run(`console.log(JSON.stringify(Array.from({ length: 7 }, (_, i) => p.keepUnclaimed(lib('f' + i)))))`);
    const left = JSON.parse(run(`console.log(JSON.stringify(p.unclaimed().map((u) => u.code)))`));
    assert.equal(left.length, 5, 'the five newest are kept');
    assert.ok(left.includes(JSON.parse(codes)[6]), 'the one just kept among them');
    assert.deepEqual(JSON.parse(run(`console.log(JSON.stringify(p.unclaimed().map((u) => u.id).sort()))`)), ['f2', 'f3', 'f4', 'f5', 'f6'], 'and the two oldest are the ones gone');
    const one = path.join(at, `${left[0]}.json`), old = (Date.now() - 25 * 3600 * 1000) / 1000;
    fs.utimesSync(one, old, old);
    assert.equal(JSON.parse(run(`console.log(JSON.stringify(p.unclaimed().map((u) => u.code)))`)).length, 4, 'one past a day is not offered');
    assert.ok(!fs.existsSync(one), 'and is removed');
    assert.match(run(`try { p.keepUnclaimed({ tokens: { _meta: { fileId: 'big' } }, pad: 'x'.repeat(257 * 1024 * 1024) }); } catch (e) { console.log(e.message); }`), /not kept/, 'one over 256 MB is not kept');
    fs.chmodSync(at, 0o755);
    assert.match(run(`try { p.keepUnclaimed(lib('g')); } catch (e) { console.log(e.message); }`), /not this user's alone/, 'a folder others may read is not written into, and says why');
    assert.equal(run(`console.log(p.unclaimed().length)`), '0', 'nor read');
    fs.rmSync(at, { recursive: true, force: true });
    assert.equal(run(`console.log(p.unclaimed().length)`), '0', 'a folder not there holds none, and says so without throwing');
    // a code drawn twice: the second snapshot draws again rather than write over the first
    const draws = run(`const c = require('node:crypto'); const seq = [...Array(12).fill(0), ...Array(6).fill(1)]; c.randomInt = () => seq.shift() ?? 2; console.log(JSON.stringify([p.keepUnclaimed(lib('one')), p.keepUnclaimed(lib('two'))]))`);
    assert.deepEqual(JSON.parse(draws), ['AAAAAA', 'BBBBBB'], 'a code another kept snapshot has is drawn again');
    assert.deepEqual(JSON.parse(run(`console.log(JSON.stringify(p.unclaimed().map((u) => u.id).sort()))`)), ['one', 'two'], 'and both are kept');
    // a copy carries its original's id: kept under its own key
    const roots = path.join(dir, 'projects'), home = path.join(roots, 'orig', 'figma-design-system');
    fs.mkdirSync(home, { recursive: true });
    fs.writeFileSync(path.join(home, 'design-system-context.md'), '```json snapshot-routing\n' + JSON.stringify({ files: { library: { key: 'ORIGKEY0001', id: 'fORIG' } } }) + '\n```\n');
    const copied = execFileSync(process.execPath, ['-e', `const p = require(${JSON.stringify(path.join(HERE, 'projects.cjs'))}); p.keepUnclaimed({ tokens: { _meta: { fileKey: 'COPYKEY0001', fileId: 'fORIG' } } }); console.log(JSON.stringify(p.unclaimed()[0]))`], { env: { ...process.env, TOOLKIT_UNCLAIMED: at, TOOLKIT_PROJECTS_ROOT: roots }, encoding: 'utf8' });
    assert.equal(JSON.parse(copied).id, 'COPYKEY0001', "a copy's id another project claims is dropped, so a project can be made of it");
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('the answer is the OUTCOME: a refusal is 409, a failed required step is 500', async () => {
  const { projectsDir } = world([
    { name: 'refuser', files: { screens: { id: 'R' } } },
    { name: 'crasher', files: { library: { id: 'C' } }, exit: 1 },
  ]);
  await serving(projectsDir, async ({ post }) => {
    /* Figma only reads the status, so this is what the person pressing the
       button is told. It used to be 200 the moment the payload arrived. A
       plugin older than 0.7.2 sends no ready status: writing would let every
       draft in, so the store refuses. */
    assert.equal((await post('/screens', scr('R', [{ page: 'P', frame: 'F', id: '1', tree: { name: 'F', type: 'FRAME' } }]))).status, 409);
    assert.equal((await post('/library', lib('C'))).status, 500);
    assert.equal((await post('/nonsense', lib('C'))).status, 404);
  });
});

test('deliveries to one project are serialised, and two projects still run at once', async () => {
  const { root } = world([]);
  const made = [];
  for (const name of ['slow', 'other']) {
    const repo = path.join(root, 'repos', name);
    fs.mkdirSync(repo, { recursive: true });
    const log = path.join(repo, 'handled.txt');
    /* A step that records when it starts and when it stops, so an overlap is visible. */
    const step = [{ label: 'slow', run: 'echo in >> handled.txt; sleep 1; echo out >> handled.txt' }];
    fs.writeFileSync(path.join(repo, 'snapshot.config.json'), JSON.stringify({ toolkit: root, project: name, after: { library: step, screens: step } }));
    const docDir = path.join(root, 'projects', name);
    fs.mkdirSync(docDir, { recursive: true });
    fs.writeFileSync(path.join(docDir, 'design-system-context.md'),
      `\`\`\`json snapshot-routing\n${JSON.stringify({ repo, files: { library: { id: `${name}-lib` }, screens: { id: `${name}-scr` } } })}\n\`\`\`\n`);
    made.push({ name, log });
  }
  const started = Date.now();
  await serving(path.join(root, 'projects'), async ({ post }) => {
    await Promise.all([
      post('/library', lib('slow-lib')),
      post('/screens', scr('slow-scr')),
      post('/library', lib('other-lib')),
    ]);
  });
  const lines = fs.readFileSync(made[0].log, 'utf8').trim().split('\n');
  assert.equal(lines.length, 4, "both of slow's payloads ran");
  /* in, out, in, out — never in, in: one at a time over one repo's files. */
  assert.deepEqual(lines, ['in', 'out', 'in', 'out']);
  /* Two projects in parallel: three one-second runs, serialised only per
     project, so well under three seconds. */
  assert.ok(Date.now() - started < 2800, 'the other project did not wait its turn');
});

test('the payload it routed is kept, newest three per project and kind', async () => {
  const { projectsDir } = two();
  const keep = path.join(os.tmpdir(), 'figma-snapshot-router');
  const mine = () => (fs.existsSync(keep) ? fs.readdirSync(keep).filter((f) => f.startsWith('beta-library-')) : []);
  for (const f of mine()) fs.rmSync(path.join(keep, f), { force: true });
  await serving(projectsDir, async ({ post }) => {
    for (let i = 0; i < 4; i++) await post('/library', lib('IDB', { tokens: { n: i } }));
  });
  assert.equal(mine().length, 3);
  const newest = mine().sort().pop();
  assert.ok(JSON.parse(fs.readFileSync(path.join(keep, newest), 'utf8')).tokens);
});

test('snapshot-standard 11: both loopback stacks answer, and no other address does', async () => {
  const { projectsDir } = two();
  await serving(projectsDir, async ({ port }) => {
    const v4 = await fetch(`http://127.0.0.1:${port}/`).then((r) => r.status, (e) => e.cause?.code || e.message);
    const v6 = await fetch(`http://[::1]:${port}/`).then((r) => r.status, (e) => e.cause?.code || e.message);
    assert.equal(typeof v4, 'number', `127.0.0.1 did not answer: ${v4}`);
    assert.equal(typeof v6, 'number', `::1 did not answer: ${v6}`);
    // a machine address beyond loopback must be refused: the router is not on the network
    const lan = Object.values(os.networkInterfaces()).flat().find((i) => i && i.family === 'IPv4' && !i.internal);
    if (lan) assert.equal(await fetch(`http://${lan.address}:${port}/`).then(() => 'answered', (e) => e.cause?.code), 'ECONNREFUSED');
  });
});

test('a body past the largest a snapshot is is refused, and the plugin is told so, nothing written', async () => {
  const { projectsDir } = two();
  await serving(projectsDir, async ({ port }) => {
    const big = Buffer.alloc(257 * 1024 * 1024, 32);
    const r = await fetch(`http://127.0.0.1:${port}${paired('/library')}`, { method: 'POST', body: big }).then(async (x) => [x.status, await x.text()], (e) => [e.cause?.code || e.message, '']);
    assert.equal(r[0], 413, `answered ${r[0]}`);
    assert.match(r[1], /at most 256 MB/);
  });
});

test('snapshot-standard 12: a step\'s detail goes to .snapshot-logs, newest five kept, and the answer carries its first line only', async () => {
  const { projectsDir, made } = world([{ name: 'gamma', files: { library: { key: 'KEYG', id: 'IDG' } }, step: 'echo "recorded: one line"; for i in $(seq 1 40); do echo "detail $i"; done' }]);
  let last = '';
  await serving(projectsDir, async ({ post }) => {
    for (let i = 0; i < 7; i++) { const r = await post('/library', lib('IDG', { tokens: { n: i } })); last = await r.text(); await new Promise((d) => setTimeout(d, 5)); }
  });
  const logs = path.join(made[0].repo, '.snapshot-logs');
  const kept = fs.readdirSync(logs).filter((f) => f.startsWith('library-steps-'));
  assert.equal(kept.length, 5);
  assert.match(fs.readFileSync(path.join(logs, kept.sort().pop()), 'utf8'), /detail 40/);
  assert.ok(!/detail 40/.test(last), 'the detail stayed out of the answer');
});

test('snapshot-standard 13: an unidentified payload after an identified one is refused, never given the last one\'s file', async () => {
  const { projectsDir, made } = two();
  await serving(projectsDir, async ({ post }) => {
    assert.equal((await post('/library', lib('IDB'))).status, 200);
    const before = fs.readFileSync(path.join(made[1].repo, 'tokens.json'), 'utf8');
    const bare = lib('IDB'); delete bare.tokens._meta.fileId;
    const r = await post('/library', bare);
    assert.ok(r.status >= 400, `an unidentified payload was accepted (${r.status})`);
    assert.equal(fs.readFileSync(path.join(made[1].repo, 'tokens.json'), 'utf8'), before);
    assert.ok(!fs.existsSync(path.join(made[0].repo, 'tokens.json')));
  });
});

test('every project with a repo gets the toolkit\'s stored-state checks after its own steps: the validator on a library, the parity gates on both', async () => {
  const { createRequire } = await import('node:module');
  const { toolkitSteps } = createRequire(import.meta.url)('./deliver.cjs');
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'steps-'));
  const labels = (kind, config) => toolkitSteps(kind, { repo }, config).map((s) => s.label).join(',');
  fs.mkdirSync(path.join(repo, 'src/ds'), { recursive: true });
  assert.equal(labels('library', { paths: { components: 'src/ds' }, parity: {} }), 'validate,parity gates');
  assert.equal(labels('screens', { paths: { components: 'src/ds' }, parity: {} }), 'parity gates');
  assert.equal(labels('library', {}), '', 'no components stored: nothing to validate');
  // the canonical layout, with no `paths` said, is validated too
  fs.mkdirSync(path.join(repo, 'components'));
  assert.equal(labels('library', {}), 'validate');
  fs.rmSync(repo, { recursive: true, force: true });
  assert.equal(toolkitSteps('library', { repo: null }, { parity: {} }).length, 0);
});

test('ADDING A PROJECT: a third one routes without touching anything that exists', async () => {
  /*
   * The question this whole design has to answer. A new project is a context
   * document with a routing block and a repo with a snapshot.config.json —
   * nothing is registered, nothing else is edited, and no existing project
   * changes behaviour because it arrived.
   */
  const { projectsDir, root, made } = two();
  await serving(projectsDir, async ({ post, banner }) => {
    assert.match(banner, /2 project\(s\)/);
    assert.equal((await post('/library', lib('IDNEW'))).status, 409);
  });

  const name = 'newcomer';
  const repo = path.join(root, 'repos', name);
  fs.mkdirSync(repo, { recursive: true });
  const log = path.join(repo, 'handled.txt');
  fs.writeFileSync(path.join(repo, 'snapshot.config.json'), JSON.stringify({ toolkit: root, project: name, after: { library: [{ label: 'recorded', run: 'echo library >> handled.txt' }] } }));
  const docDir = path.join(root, 'projects', name);
  fs.mkdirSync(docDir, { recursive: true });
  fs.writeFileSync(path.join(docDir, 'design-system-context.md'),
    `\`\`\`json snapshot-routing\n${JSON.stringify({ repo, files: { library: { id: 'IDNEW' }, screens: { id: 'SIDNEW' } } })}\n\`\`\`\n`);

  await serving(projectsDir, async ({ post, banner }) => {
    assert.match(banner, /3 project\(s\)/);
    assert.equal((await post('/library', lib('IDNEW'))).status, 200);
    /* And the two that were already there are untouched by its arrival. */
    assert.equal((await post('/library', lib('IDA'))).status, 200);
    assert.equal((await post('/screens', scr('SIDB'))).status, 200);
  });
  assert.equal(fs.readFileSync(log, 'utf8').trim(), 'library');
  assert.equal(fs.readFileSync(made[0].log, 'utf8').trim().split('\n').length, 1);
  assert.equal(fs.readFileSync(made[1].log, 'utf8').trim().split('\n').length, 1);

  // A config every READER refuses must not be a config the WRITER accepts:
  // deliver parsed the file itself and swallowed the error, so a repo missing
  // `toolkit`/`project` had its snapshot written at the default layout while
  // the docs site, the tracker and the dashboard all reported the error.
  fs.writeFileSync(path.join(repo, 'snapshot.config.json'), '{ "project": "newcomer" }');
  const before = fs.existsSync(path.join(repo, 'design')) ? fs.readdirSync(path.join(repo, 'design')).length : 0;
  await serving(projectsDir, async ({ post }) => {
    const res = await post('/library', lib('IDNEW'));
    assert.equal(res.status, 409, 'a config naming no toolkit is refused, not written at the default layout');
    // The plugin is told the cause and the fix, not sent to the router's output.
    const said = await res.text();
    assert.match(said, /setup is broken: .*toolkit/);
    assert.doesNotMatch(said, /see the router/);
  });
  const after = fs.existsSync(path.join(repo, 'design')) ? fs.readdirSync(path.join(repo, 'design')).length : 0;
  assert.equal(after, before, 'nothing was written');
});

test('--pin without a Figma token keeps the stored stamps, and a config every reader refuses is refused', async () => {
  const { createRequire } = await import('node:module');
  const req = createRequire(import.meta.url);
  const store = req('./store.cjs'), { repin } = req('./deliver.cjs');
  const { projectsDir, made } = two();
  const project = projects(projectsDir).list.find((p) => p.name === 'alpha');
  const P = store.paths(made[0].repo, contract.locate(made[0].repo).paths);
  const stamp = { id: '42', at: '2026-09-30', label: 'Release' };
  fs.mkdirSync(path.dirname(P.tokens), { recursive: true });
  fs.writeFileSync(P.tokens, JSON.stringify({ _meta: { version: stamp } }));
  fs.writeFileSync(P.index, JSON.stringify({ screens: { Home: { version: stamp } } }));
  const saved = process.env.FIGMA_TOKEN, savedFile = process.env.FIGMA_TOKEN_FILE;
  delete process.env.FIGMA_TOKEN;
  process.env.FIGMA_TOKEN_FILE = path.join(made[0].repo, 'no-token-here');
  try {
    // pin() resolves undefined without a token, and `|| null` wrote that over
    // every stamp: a re-pin with no way to read a release erased the releases.
    assert.equal(await repin(project), 'skipped');
    assert.deepEqual(JSON.parse(fs.readFileSync(P.tokens, 'utf8'))._meta.version, stamp);
    assert.deepEqual(JSON.parse(fs.readFileSync(P.index, 'utf8')).screens.Home.version, stamp);
    fs.writeFileSync(path.join(made[0].repo, 'snapshot.config.json'), '{ "project": "alpha" }');
    assert.equal(await repin(project), 'refused');
  } finally { if (saved !== undefined) process.env.FIGMA_TOKEN = saved; if (savedFile !== undefined) process.env.FIGMA_TOKEN_FILE = savedFile; else delete process.env.FIGMA_TOKEN_FILE; }
});

/* Figma as version.cjs reads it, per file key: each file's last publish, and a
   version list whose one named version sits on the second page. */
function fakeFigma(published, edited = '2026-10-01') {
  const seen = [];
  const json = (body) => ({ json: async () => body });
  const fake = async (url) => {
    const u = new URL(url); seen.push(u.pathname + u.search);
    const [, , , key, what] = u.pathname.split('/');
    if (what === 'components') return json({ meta: { components: [{ updated_at: published[key] }] } });
    if (what === 'styles') return json({ meta: { styles: [] } });
    if (u.searchParams.get('before')) return json({ versions: [{ id: `${key}-named`, label: 'Release', created_at: '2026-01-01' }], pagination: {} });
    return json({ versions: Array.from({ length: 50 }, (_, i) => ({ id: `${key}-${i}`, label: null, created_at: typeof edited === 'function' ? edited() : edited })), pagination: { next_page: `https://api.figma.com/v1/files/${key}/versions?page_size=50&before=1` } });
  };
  return { fake, seen };
}

test('each library file a project routes is pinned to its own publish and checked against it, not the first file\'s', async () => {
  const { createRequire } = await import('node:module');
  const req = createRequire(import.meta.url);
  const { deliver, pinned, repin } = req('./deliver.cjs');
  const { projectsDir, made } = world([{ name: 'multi', files: { library: [{ key: 'KEYT', id: 'IDT', name: 'Tokens' }, { key: 'KEYC', id: 'IDC', name: 'Components' }] } }]);
  const project = projects(projectsDir).list.find((p) => p.name === 'multi');
  const published = { KEYT: '2026-10-01T00:00:00Z', KEYC: '2026-10-20T00:00:00Z' };
  const { fake } = fakeFigma(published);
  const saved = { fetch: globalThis.fetch, token: process.env.FIGMA_TOKEN };
  globalThis.fetch = fake; process.env.FIGMA_TOKEN = 'test';
  const quiet = { say: () => {}, under: () => {} };
  try {
    const withKey = (key, id) => { const p = lib(id); p.tokens._meta.fileKey = key; return p; };
    assert.equal((await deliver(project, 'library', withKey('KEYC', 'IDC'), quiet)).result, 'written');
    assert.equal((await deliver(project, 'library', withKey('KEYT', 'IDT'), quiet)).result, 'written');
    const P = req('./store.cjs').paths(made[0].repo, contract.locate(made[0].repo).paths);
    const sources = JSON.parse(fs.readFileSync(P.tokens, 'utf8'))._meta.sources;
    assert.equal(sources.KEYC.version.at, published.KEYC, 'the components file carries its own publish');
    assert.equal(sources.KEYT.version.at, published.KEYT);
    assert.deepEqual((await pinned(project)).stale, [], 'both files at their release');
    published.KEYC = '2026-10-29T00:00:00Z';
    assert.deepEqual((await pinned(project)).stale.map((l) => l.split(':')[0]), ['library "Components"'], 'only the file that moved is stale');
    assert.equal(await repin(project), 'written');
    assert.equal(JSON.parse(fs.readFileSync(P.tokens, 'utf8'))._meta.sources.KEYC.version.at, published.KEYC);
    assert.deepEqual((await pinned(project)).stale, []);
  } finally {
    globalThis.fetch = saved.fetch;
    if (saved.token !== undefined) process.env.FIGMA_TOKEN = saved.token; else delete process.env.FIGMA_TOKEN;
  }
});

test('a version Figma saved after the last delivery of a file is named: its edits may not be in the snapshot', async () => {
  const { createRequire } = await import('node:module');
  const req = createRequire(import.meta.url);
  const { deliver, pinned } = req('./deliver.cjs');
  const { projectsDir } = world([{ name: 'late', files: { library: [{ key: 'KEYL', id: 'IDL', name: 'UI' }] } }]);
  const project = projects(projectsDir).list.find((p) => p.name === 'late');
  let edited = '2026-09-01T00:00:00Z';
  const { fake } = fakeFigma({ KEYL: '2026-10-20T00:00:00Z' }, () => edited);
  const saved = { fetch: globalThis.fetch, token: process.env.FIGMA_TOKEN, runs: process.env.TOOLKIT_SNAPSHOT_RUNS };
  globalThis.fetch = fake; process.env.FIGMA_TOKEN = 'test';
  process.env.TOOLKIT_SNAPSHOT_RUNS = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'runs-')), 'runs.json');
  try {
    assert.deepEqual((await pinned(project)).notes, [], 'never delivered: no time to compare, nothing said');
    const p = lib('IDL'); p.tokens._meta.fileKey = 'KEYL';
    assert.equal((await deliver(project, 'library', p, { say: () => {}, under: () => {} })).result, 'written');
    const at = JSON.parse(fs.readFileSync(process.env.TOOLKIT_SNAPSHOT_RUNS, 'utf8')).KEYL;
    assert.ok(at && !Number.isNaN(Date.parse(at)), 'the delivery is timed, outside the repo');
    edited = '2026-10-25T00:00:00Z';
    assert.deepEqual((await pinned(project)).notes, [], 'saved before the delivery: in it');
    edited = '2999-01-01T00:00:00Z';
    const r = await pinned(project);
    assert.deepEqual(r.stale, [], 'still at its release, so not stale');
    assert.equal(r.notes.length, 1);
    assert.match(r.notes[0], /^library: Figma saved a version at 2999-01-01T00:00:00Z, after its last snapshot here \(.+\); edits in it may not be in the snapshot — if one was meant for code, publish and snapshot again/);
  } finally {
    globalThis.fetch = saved.fetch;
    for (const [k, v] of [['FIGMA_TOKEN', saved.token], ['TOOLKIT_SNAPSHOT_RUNS', saved.runs]]) if (v !== undefined) process.env[k] = v; else delete process.env[k];
  }
});

test('a store written before per-file stamps reads the top one for its first routed file, whichever wrote last, and each screens file is checked on its own', async () => {
  const { createRequire } = await import('node:module');
  const req = createRequire(import.meta.url);
  const { pinned } = req('./deliver.cjs');
  const published = { KEYT: '2026-10-01T00:00:00Z', KEYC: '2026-10-20T00:00:00Z' };
  const { fake } = fakeFigma(published);
  const saved = { fetch: globalThis.fetch, token: process.env.FIGMA_TOKEN };
  globalThis.fetch = fake; process.env.FIGMA_TOKEN = 'test';
  const stamp = (key) => ({ id: published[key], at: published[key], label: 'published' });
  const store = (made, meta, screens = {}) => {
    const P = req('./store.cjs').paths(made[0].repo, contract.locate(made[0].repo).paths);
    fs.mkdirSync(path.dirname(P.tokens), { recursive: true });
    fs.writeFileSync(P.tokens, JSON.stringify({ _meta: meta }));
    fs.writeFileSync(P.index, JSON.stringify({ screens }));
  };
  try {
    const one = world([{ name: 'one', files: { library: { key: 'KEYT', id: 'IDT' } } }]);
    store(one.made, { fileKey: 'KEYT', version: stamp('KEYT'), sources: { KEYT: { at: '2026-10-02' } } });
    assert.deepEqual((await pinned(projects(one.projectsDir).list[0])).stale, [], 'one file: the top stamp is its own');
    const several = world([{ name: 'several', files: {
      library: [{ key: 'KEYT', id: 'IDT', name: 'Tokens' }, { key: 'KEYC', id: 'IDC', name: 'Components' }],
      screens: [{ key: 'KEYS1', id: 'S1', name: 'App' }, { key: 'KEYS2', id: 'S2', name: 'Web' }] } }]);
    store(several.made, { fileKey: 'KEYC', version: stamp('KEYT'), sources: { KEYT: { at: '2026-10-02' }, KEYC: { at: '2026-10-21' } } },
      { KEYS1: { version: { id: 'KEYS1-named' }, snapshotAt: '2026-10-02' }, S2: { version: { id: 'old' }, snapshotAt: '2026-10-02' } });
    const stale = (await pinned(projects(several.projectsDir).list[0])).stale;
    assert.deepEqual(stale.map((l) => l.split(':')[0]), ['library "Components"', 'screens "Web"'], 'the first routed file reads the top stamp (the old pin read its release) though Components wrote last; the other file and the screens file behind are named');
    assert.match(stale[0], /unpinned/);
  } finally {
    globalThis.fetch = saved.fetch;
    if (saved.token !== undefined) process.env.FIGMA_TOKEN = saved.token; else delete process.env.FIGMA_TOKEN;
  }
});

test('a named version behind a full page of autosaves is found, and a Figma that never answers times out', async () => {
  const { createRequire } = await import('node:module');
  const { released } = createRequire(import.meta.url)('./version.cjs');
  const { fake, seen } = fakeFigma({});
  const saved = globalThis.fetch;
  try {
    globalThis.fetch = fake;
    assert.equal((await released('KEYS', 'named', 't')).id, 'KEYS-named', 'the second page is read');
    assert.equal(seen.length, 2);
    // never answers, until the read gives up
    globalThis.fetch = (url, { signal }) => new Promise((_, fail) => signal.addEventListener('abort', () => fail(signal.reason)));
    await assert.rejects(released('KEYS', 'named', 't', { timeout: 50 }), /did not answer within/);
    // headers in time, the body not: a timeout, never "not JSON"
    globalThis.fetch = async () => ({ json: async () => { throw new DOMException('late', 'TimeoutError'); } });
    await assert.rejects(released('KEYS', 'named', 't', { timeout: 50 }), /did not answer within/);
    // a 404 is also a file the token's account cannot open: said, not a bare "Not found"
    globalThis.fetch = async () => ({ json: async () => ({ status: 404, err: 'Not found' }) });
    await assert.rejects(released('KEYS', 'published', 't'), /account cannot open the file/);
  } finally { globalThis.fetch = saved; }
});

test('a token comes from the environment, else the project\'s command, else the machine\'s one file, else none', async () => {
  const { createRequire } = await import('node:module');
  const { tokenFor } = createRequire(import.meta.url)('./version.cjs');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tok-'));
  const saved = process.env.FIGMA_TOKEN, savedFile = process.env.FIGMA_TOKEN_FILE;
  delete process.env.FIGMA_TOKEN;
  process.env.FIGMA_TOKEN_FILE = path.join(dir, 'token');
  try {
    assert.equal(tokenFor(dir, {}), null);
    fs.writeFileSync(path.join(dir, 'token'), 'from-file\n');
    assert.equal(tokenFor(dir, {}), 'from-file');
    assert.equal(tokenFor(dir, { figmaToken: 'echo from-command' }), 'from-command');
    assert.equal(tokenFor(dir, { figmaToken: 'false' }), 'from-file');
    process.env.FIGMA_TOKEN = 'from-env';
    assert.equal(tokenFor(dir, { figmaToken: 'echo from-command' }), 'from-env');
  } finally {
    if (saved !== undefined) process.env.FIGMA_TOKEN = saved; else delete process.env.FIGMA_TOKEN;
    if (savedFile !== undefined) process.env.FIGMA_TOKEN_FILE = savedFile; else delete process.env.FIGMA_TOKEN_FILE;
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('a project added while the router is RUNNING is picked up, with no restart', async () => {
  const { projectsDir, root } = two();
  await serving(projectsDir, async ({ post }) => {
    assert.equal((await post('/library', lib('IDLATE'))).status, 409);
    const repo = path.join(root, 'repos', 'latecomer');
    fs.mkdirSync(repo, { recursive: true });
    fs.writeFileSync(path.join(repo, 'snapshot.config.json'), JSON.stringify({ toolkit: root, project: 'latecomer' }));
    const docDir = path.join(root, 'projects', 'latecomer');
    fs.mkdirSync(docDir, { recursive: true });
    fs.writeFileSync(path.join(docDir, 'design-system-context.md'),
      `\`\`\`json snapshot-routing\n${JSON.stringify({ repo, files: { library: { id: 'IDLATE' } } })}\n\`\`\`\n`);
    assert.equal((await post('/library', lib('IDLATE'))).status, 200);
  });
});

test('a malformed payload is refused before anything is written', async () => {
  const { projectsDir, made } = two();
  await serving(projectsDir, async ({ post }) => {
    const broken = lib('IDA');
    delete broken.tokens.collections;
    const res = await post('/library', broken);
    assert.equal(res.status, 400);
    assert.match(await res.text(), /tokens\.collections/);
  });
  assert.equal(fs.existsSync(made[0].log), false, 'no step ran');
  assert.equal(fs.existsSync(path.join(made[0].repo, 'tokens.json')), false, 'and nothing was written');
});

test('DESIGN-ONLY: a project with no repo is stored in its own toolkit folder, and a second file merges', async () => {
  const { projectsDir } = world([]);
  const docDir = path.join(projectsDir, 'studio');
  fs.mkdirSync(docDir, { recursive: true });
  fs.writeFileSync(path.join(docDir, 'design-system-context.md'),
    '# studio\n\n```json project\n{ "name": "Studio", "phase": "design" }\n```\n\n```json snapshot-routing\n' +
    JSON.stringify({ files: { library: [{ id: 'CORE' }, { id: 'COMPS' }, { id: 'MOBILE', platform: 'mobile' }] } }) + '\n```\n');
  const node = (name) => ({ name, type: 'COMPONENT', w: 10, h: 10 });
  const button = { name: 'Button', id: '1:1', page: '🚧 Button', description: '## Usage\n- One per view', props: { Size: ['sm'] }, variants: [node('Size=sm')] };
  await serving(projectsDir, async ({ post }) => {
    assert.equal((await post('/library', lib('CORE', { tokens: { textStyles: [{ name: 'Body', family: 'Inter', size: 16, lineHeight: 1.5 }] } }))).status, 200);
    const comps = lib('COMPS', { components: [button] });
    comps.tokens._meta.pages = ['Cover', '---', '🔷 ACTIONS', '🚧 Button'];
    comps.tokens.collections = { Local: { modes: ['Mode 1'], values: { 'Mode 1': { x: 1 } }, alias: {} } };
    comps.previews = [{ name: 'Button', w: 10, h: 10, png: Buffer.from('png').toString('base64'), dark: Buffer.from('drk').toString('base64'),
      anatomy: { w: 12, h: 12, png: Buffer.from('ana').toString('base64'), parts: [{ name: 'Label', type: 'text', x: 2, y: 2, w: 8, h: 8 }] },
      variants: [{ name: 'Product=Alpha', png: Buffer.from('aca').toString('base64'), dark: Buffer.from('acd').toString('base64') }] }];
    comps.icons = [{ name: 'check', size: 16, svg: '<svg/>', fill: 'Colour/Icon/strong' }];
    comps.iconGroups = { check: 'Accessibility' };
    comps.iconDescriptions = { check: 'done, tick' };
    assert.equal((await post('/library', comps)).status, 200);
    assert.ok(fs.existsSync(path.join(docDir, 'snapshot/previews/button.dark.png')), 'a dark render lands beside the light one');
    const ana = JSON.parse(fs.readFileSync(path.join(docDir, 'snapshot/previews/button.anatomy.json'), 'utf8'));
    assert.deepEqual(ana, { w: 12, h: 12, parts: [{ name: 'Label', type: 'text', x: 2, y: 2, w: 8, h: 8 }] }, 'the parts of an anatomy land beside its render, without the image inlined');
    assert.ok(fs.existsSync(path.join(docDir, 'snapshot/previews/button.anatomy.png')));
    assert.ok(fs.existsSync(path.join(docDir, 'snapshot/previews/button.variant-product-alpha.png')), "an asset library's variant lands as a render of its own");
    assert.ok(fs.existsSync(path.join(docDir, 'snapshot/previews/button.variant-product-alpha.dark.png')), 'and its dark render beside it');
    const owned = (id) => JSON.parse(fs.readFileSync(path.join(docDir, 'snapshot/tokens.json'), 'utf8'))._meta.sources[id].owns;
    assert.deepEqual(owned('COMPS').iconGroups, { check: 'Accessibility' }, "each icon's group is kept with the file that sent it");
    assert.deepEqual(owned('COMPS').iconDescriptions, { check: 'done, tick' }, 'and its description');
    assert.deepEqual(owned('COMPS').iconColours, { check: 'Colour/Icon/strong' }, 'and the variable its glyph is painted with');
    // A mobile library draws its own Button: it must land beside the web one, not over it,
    // and must not prune the web file's preview.
    const mobile = lib('MOBILE', { components: [{ ...button, id: '9:9', description: 'Mobile button' }] });
    mobile.tokens.collections = {};
    mobile.previews = [{ name: 'Button', w: 10, h: 10, png: Buffer.from('mob').toString('base64') }];
    mobile.icons = [{ name: 'bell', size: 16, svg: '<svg/>' }];
    assert.equal((await post('/library', mobile)).status, 200);
    assert.ok(fs.existsSync(path.join(docDir, 'snapshot/previews/button.dark.png')), "another file does not prune this file's dark render");
    assert.ok(fs.existsSync(path.join(docDir, 'snapshot/previews/button.variant-product-alpha.png')), "nor its variant renders");
    assert.ok(fs.existsSync(path.join(docDir, 'snapshot/icons/check-16.svg')), "another file's icons do not erase this file's");
    // The library lost its dark mode: its own stale dark render goes. It also
    // swapped its icon: its own old one goes, the mobile file's stays.
    delete comps.previews[0].dark;
    delete comps.previews[0].anatomy;
    delete comps.previews[0].variants;
    comps.icons = [{ name: 'star', size: 16, svg: '<svg/>' }];
    assert.equal((await post('/library', comps)).status, 200);
    assert.ok(!fs.existsSync(path.join(docDir, 'snapshot/icons/check-16.svg')), "a file's own dropped icon is pruned");
    assert.ok(fs.existsSync(path.join(docDir, 'snapshot/icons/bell-16.svg')), "another file's icon is not");
    assert.ok(!fs.existsSync(path.join(docDir, 'snapshot/previews/button.dark.png')), 'a dark render the library no longer sends is pruned');
    assert.ok(!fs.existsSync(path.join(docDir, 'snapshot/previews/button.anatomy.json')), 'so is an anatomy it no longer sends');
    assert.ok(!fs.existsSync(path.join(docDir, 'snapshot/previews/button.variant-product-alpha.png')), 'and a variant render');
    assert.ok(!fs.existsSync(path.join(docDir, 'snapshot/previews/button.variant-product-alpha.dark.png')), 'and its dark render');
    assert.deepEqual(owned('COMPS').iconGroups, { check: 'Accessibility' }, 'a run that sends no groups keeps the last ones');
  });
  const store = path.join(docDir, 'snapshot');
  const tokens = JSON.parse(fs.readFileSync(path.join(store, 'tokens.json'), 'utf8'));
  assert.deepEqual(Object.keys(tokens.collections).sort(), ['Base', 'Local'], "the components file did not erase the core file's collections");
  assert.equal(tokens.textStyles.length, 1, "nor its text styles");
  assert.deepEqual(Object.keys(tokens._meta.sources).sort(), ['COMPS', 'CORE', 'MOBILE'], 'every file is recorded as a source, the first included');
  assert.deepEqual(tokens._meta.sources.COMPS.pages, ['Cover', '---', '🔷 ACTIONS', '🚧 Button'], "each file's page list stays with that file, not overwritten by the next file");
  const spec = JSON.parse(fs.readFileSync(path.join(store, 'components/button/figma.json'), 'utf8'));
  assert.equal(spec.description, '## Usage\n- One per view');
  assert.ok(spec.default, 'stored compacted');
  assert.ok(fs.existsSync(path.join(store, 'previews/button.png')));
  const mob = JSON.parse(fs.readFileSync(path.join(store, 'components/mobile-button/figma.json'), 'utf8'));
  assert.equal(mob.platform, 'mobile');
  assert.equal(mob.description, 'Mobile button');
  assert.equal(JSON.parse(fs.readFileSync(path.join(store, 'components/button/figma.json'), 'utf8')).description, '## Usage\n- One per view', 'the web Button is untouched');
  assert.ok(fs.existsSync(path.join(store, 'previews/mobile-button.png')));
  assert.ok(fs.existsSync(path.join(store, 'previews/button.png')), "the mobile file did not prune the web file's preview");
  const changes = JSON.parse(fs.readFileSync(path.join(store, 'changes.json'), 'utf8'));
  assert.deepEqual(changes.at(-2).components.added, ['button']);
  assert.deepEqual(changes.at(-1).components.added, ['mobile-button']);
  /*
   * An entry names its file by IDENTITY, never by the name it carried that
   * day. Logged by name, one rename splits a file's history into two: Project A's
   * log held "02. Web library" from the router and "03. Web library"
   * from a backfill run minutes apart, and the Changes page drew a chip for
   * each. The reader resolves the name, and resolves a name a pre-identity
   * log recorded back onto the same file, so both group as one.
   */
  assert.deepEqual(changes.map((c) => c.file).sort(), ['COMPS', 'MOBILE'], 'the change log names each file by its identity, not its display name');
  const ident = (f) => contract.fileIdent([{ key: 'COMPS', id: 'comps-id' }], f, tokens._meta.sources);
  assert.equal(ident('comps-id'), 'COMPS', 'the id and the key are one file');
  // Every file in this fixture is called "UI library", and a name two files
  // share identifies neither: it stands as it is rather than being folded
  // onto whichever source was read first.
  assert.equal(ident(tokens._meta.sources.COMPS.file), tokens._meta.sources.COMPS.file, 'a display name two files share resolves to no file');
  assert.equal(contract.fileIdent([{ key: 'COMPS', id: 'comps-id' }], 'Mobile', { COMPS: { file: 'Mobile' } }), 'COMPS',
               'a name only one source carries is that source, so a log written before identities still groups');
  assert.equal(contract.fileLabel({ routes: [{ key: 'COMPS', id: 'comps-id' }], sources: tokens._meta.sources }, 'comps-id'),
               tokens._meta.sources.COMPS.file, 'and the reader names it as the store does now');
  const { layout } = contract;
  const where = layout(projectsDir, 'studio');
  assert.equal(where.name, 'Studio');
  assert.equal(where.phase, 'design');
  assert.equal(where.paths.tokens, path.join(store, 'tokens.json'));
});

test('a character split across two chunks of the body arrives whole', async () => {
  const { projectsDir, made } = two();
  const bytes = Buffer.from(JSON.stringify(lib('IDA', { tokens: { _meta: { file: '🔷 UI library', fileId: 'IDA', snapshot: '2026-09-19' } } })));
  const at = bytes.indexOf(Buffer.from('🔷')) + 2; // mid-character
  await serving(projectsDir, async ({ port }) => {
    const status = await new Promise((done, fail) => {
      const req = http.request({ host: '127.0.0.1', port, path: paired('/library'), method: 'POST', headers: { 'content-length': bytes.length } },
        (res) => { res.resume(); done(res.statusCode); });
      req.on('error', fail);
      req.write(bytes.subarray(0, at));
      setTimeout(() => req.end(bytes.subarray(at)), 50);
    });
    assert.equal(status, 200);
  });
  const got = JSON.parse(fs.readFileSync(path.join(made[0].repo, 'tokens.json'), 'utf8'));
  assert.equal(got._meta.file, '🔷 UI library');
});

test('a page marker is read anywhere before the name, the leftmost winning', () => {
  const m = { '🚧': 'Work in progress', '❖': 'Ready' };
  assert.equal(contract.status('↘︎  ❖ Logos (Used so far)', m)?.marker, '❖');
  assert.equal(contract.status('🚧 ❖ Tabs', m)?.marker, '🚧');
  assert.equal(contract.status('Tabs ❖', m), null);
});

test('screens: addressed by section, page and name without its prefix or numbers; the prefix is the section; a name the taxonomy refuses, or two frames on one folder or one number, refuse the snapshot; a renamed frame moves; a frame no longer ready stays', async () => {
  const { createRequire } = await import('node:module');
  const store = createRequire(import.meta.url)('./store.cjs');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'screens-'));
  const P = { screens: path.join(dir, 'screens'), index: path.join(dir, 'index.json'), logs: null };
  const frame = (section, page, name, ready = true, id = `${section}:${page}:${name}`) => ({ section, page, frame: name, id, devStatus: ready ? { type: 'READY_FOR_DEV' } : null, ...(ready && { tree: { name, type: 'FRAME', w: 100 } }) });
  const post = (fileId, screens, states) => store.writeScreens({ _meta: { fileId }, screens }, P, { states });
  // Two sections each with a "-- Main screens" drawing "2-1 - List": the
  // case the page-name scheme dropped both of.
  post('A', [frame('PROJECTS', '-- Main screens', '<Projects> 2-1 - List'), frame('TEAMS', '-- Main screens', '<Teams> 2-1 - List'), frame('PROJECTS', '-- Main screens', '<Projects> 3-3 - Rename dialog - Error 2'), frame('SIDEBAR', 'SIDEBAR', '<Sidebar> 1-1 - Sidebar'), frame(null, 'Login', '<Login> 1-1 - Login - Expired')]);
  assert.deepEqual(fs.readdirSync(P.screens).sort(), ['login--login-expired', 'projects--main-screens--list', 'projects--main-screens--rename-dialog-error-2', 'sidebar--sidebar', 'teams--main-screens--list']);
  const refused = (screens, states) => { const r = post('B', screens, states); return r.refused ? r.lines.find((l) => l.label === 'misnamed').detail : null; };
  assert.match(refused([frame('S', 'P', '1-1 - List')])[0], /not "<Section> <flow>-<step>.*e\.g\. "<S> 3-3/, 'no prefix: refused, with the name it should have');
  assert.match(refused([frame('S', 'P', '<S> List')])[0], /not "<Section>/, 'no numbers: refused');
  assert.match(refused([frame('TEAMS', '-- Main screens', '<Projects> 1-1 - List')])[0], /starts <Projects> but sits in TEAMS: rename it <Teams>/, 'a prefix not its section (a frame moved, not renamed): refused');
  assert.equal(refused([frame(null, '-- Pool', '<Pool> 1-1 - List')]), null, 'with no section, the prefix is the page');
  assert.match(refused([frame('S', 'P', '<S> 1-1 - new project')])[0], /capital/, 'a lowercase screen: refused');
  assert.match(refused([frame('S', 'P', '<S> 1-1 - List - Opened')])[0], /"Opened" is not a state/, 'a state off the list: refused');
  assert.equal(refused([frame('S', 'P', '<S> 1-1 - List - Opened')], ['Opened']), null, 'and admitted once the project adds it');
  assert.match(refused([frame('S', 'P', '<S> 1-1 - List - Error - Empty')])[0], /one state at most/);
  assert.match(refused([frame('S', 'P', '<S> 1-1 - List'), frame('S', 'P', '<S> 2-1 - List', true, 'x')])[0], /same screen and state as <S> 1-1 - List/, 'one folder twice on a page: refused');
  assert.match(refused([frame('S', 'P', '<S> 2-1 - Company'), frame('S', 'P', '<S> 2-1 - Company - Error')])[0], /same number/, 'one number twice on a page: refused');
  assert.ok(!fs.existsSync(path.join(P.screens, 'company')), 'a refused snapshot writes nothing');
  assert.match(store.writeScreens({ _meta: { fileId: 'B' }, screens: [{ page: 'P', frame: '<P> 1-1 - List', id: 'y', devStatus: { type: 'READY_FOR_DEV' }, tree: { name: 'L', type: 'FRAME', w: 1 } }] }, P).refused, /too old \(before 0\.57\.0\)/, 'a plugin that sends no section: refused');
  const again = post('A', [frame('PROJECTS', '-- Main screens', '<Projects> 2-1 - Projects', true, 'PROJECTS:-- Main screens:<Projects> 2-1 - List'), frame('TEAMS', '-- Main screens', '<Teams> 2-1 - List', false)]);
  assert.ok(fs.existsSync(path.join(P.screens, 'projects--main-screens--projects')), 'a renamed frame takes its new folder');
  assert.ok(!fs.existsSync(path.join(P.screens, 'projects--main-screens--list')), 'and its old folder goes: one node, one screen');
  assert.ok(again.lines.some((l) => l.label === 'changed' && l.detail.some((d) => d === 'renamed: projects--main-screens--list → projects--main-screens--projects')), 'the rename is named as one');
  assert.ok(fs.existsSync(path.join(P.screens, 'teams--main-screens--list')), 'a frame back in draft stays on disk');
  assert.ok(again.lines.some((l) => l.label === 'no longer ready' && /teams--main-screens--list/.test(l.text)), 'and is named');
  assert.equal(store.writeScreens({ _meta: { fileId: 'A' }, screens: [frame('X', 'X', 'Draft', false)] }, P).refused.includes('none of the 1 frames'), true, 'nothing marked ready: refused, nothing emptied');
  // A designer's annotation is listed when new or changed, and counted after.
  const noted = (text) => { const f = frame('NOTES', '-- Main screens', '<Notes> 1-1 - Menu'); f.tree.children = [{ name: 'Account', type: 'FRAME', notes: [{ text, category: 'Development' }] }]; return f; };
  const first = post('C', [noted('Read-only with one account.')]).lines.find((l) => l.label === 'notes');
  assert.deepEqual(first.detail, ['notes--main-screens--menu · Account: [Development] Read-only with one account.'], 'a new note is listed whole, with its layer and category');
  assert.match(post('C', [noted('Read-only with one account.')]).lines.find((l) => l.label === 'notes').text, /1 annotated layer\(s\) on 1 screen\(s\), none new/, 'an unchanged note is counted, not listed');
  assert.equal(post('C', [noted('Switches accounts.')]).lines.find((l) => l.label === 'notes').detail.length, 1, 'a changed note is listed again');
  fs.rmSync(dir, { recursive: true, force: true });
});

test('screens: frames stored under the document id are the same file once the key arrives with it (plugin 0.67.0)', async () => {
  const { createRequire } = await import('node:module');
  const store = createRequire(import.meta.url)('./store.cjs');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fold-'));
  const P = { screens: path.join(dir, 'screens'), index: path.join(dir, 'index.json'), logs: null };
  const frame = (name) => ({ section: 'S', page: 'P', frame: name, id: '9:9', devStatus: { type: 'READY_FOR_DEV' }, tree: { name, type: 'FRAME', w: 1 } });
  store.writeScreens({ _meta: { fileId: 'fid' }, screens: [frame('<S> 1-1 - List')] }, P);
  const copy = store.writeScreens({ _meta: { fileId: 'fid', fileKey: 'COPY' }, screens: [frame('<S> 1-1 - Copy')] }, P);
  assert.ok(fs.existsSync(path.join(P.screens, 's--p--list')) && !copy.lines.some((l) => l.label === 'changed' && l.detail.some((d) => /renamed/.test(d))), "a duplicate carrying the id takes none of the original's frames");
  const r = store.writeScreens({ _meta: { fileId: 'fid', fileKey: 'KEY' }, screens: [frame('<S> 1-1 - Projects')] }, P, { ids: ['KEY', 'fid'] });
  const index = JSON.parse(fs.readFileSync(P.index, 'utf8'));
  assert.deepEqual(Object.keys(index.assets.screens).sort(), ['COPY', 'KEY'], "the routed file's records under its key, the copy's apart");
  assert.ok(!index.screens.fid);
  assert.ok(r.lines.some((l) => l.label === 'changed' && l.detail.some((d) => /renamed: s--p--list → s--p--projects/.test(d))), 'a frame renamed across the change is still one frame');
  assert.ok(!fs.existsSync(path.join(P.screens, 's--p--list')), 'and its old folder goes');
  fs.rmSync(dir, { recursive: true, force: true });
});

test('screens: a bound name the library no longer has is warned of; a raw colour with an alpha is not a name', async () => {
  const { createRequire } = await import('node:module');
  const store = createRequire(import.meta.url)('./store.cjs');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'stale-'));
  const P = { screens: path.join(dir, 'screens'), index: path.join(dir, 'index.json'), logs: null, tokens: path.join(dir, 'tokens.json') };
  fs.writeFileSync(P.tokens, JSON.stringify({ collections: { Semantic: { values: { Light: { 'Surface/Default': '#fff' } } } } }));
  const tree = { name: 'Crop', type: 'FRAME', w: 100, strokes: ['Surface/Default'], children: [{ name: 'Corner', type: 'RECTANGLE', strokes: ['rgb(255 255 255 / 0.8)'] }, { name: 'Edge', type: 'RECTANGLE', fills: ['Surface/Gone'] }] };
  const r = store.writeScreens({ _meta: { fileId: 'A' }, screens: [{ section: 'S', page: 'P', frame: '<S> 1-1 - Crop', id: 'c', devStatus: { type: 'READY_FOR_DEV' }, tree }] }, P);
  const warned = r.lines.find((l) => l.label === 'warning' && /no longer has/.test(l.text));
  assert.deepEqual(warned.detail, ['Surface/Gone — s--p--crop'], 'only the missing name; the corner\'s rgb( / 0.8) is a value, not a binding');
  fs.rmSync(dir, { recursive: true, force: true });
});

test('tokens: the canonical shape, and a style a file deletes is gone from the store, while another file\'s stays', async () => {
  const { createRequire } = await import('node:module');
  const store = createRequire(import.meta.url)('./store.cjs');
  const { valueOf } = createRequire(import.meta.url)('./tokens.cjs');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tokens-'));
  const P = store.paths(dir);
  const ts = (name) => ({ name, family: 'Inter', size: 16, lineHeight: 1.5 });
  const core = lib('CORE', { tokens: { textStyles: [ts('Body'), ts('Caption')], global: { legacy: 1 } } });
  core.tokens.collections = { Semantic: { modes: ['Light', 'Dark'], values: { Light: { fg: '#000' }, Dark: { fg: '#fff' } }, alias: {} } };
  store.writeLibrary(core, P);
  store.writeLibrary(lib('COMPS', { tokens: { textStyles: [ts('Label')] } }), P);
  let t = JSON.parse(fs.readFileSync(P.tokens, 'utf8'));
  assert.deepEqual(Object.keys(t), ['_meta', 'collections', 'textStyles', 'paintStyles', 'effects'], 'no convenience keys: the design, under its own names');
  assert.equal(valueOf(t, 'fg', 'dark'), '#fff', 'a value by name and mode, the mode matched without case');
  core.tokens.textStyles = [ts('Body')];
  store.writeLibrary(core, P);
  t = JSON.parse(fs.readFileSync(P.tokens, 'utf8'));
  assert.deepEqual(t.textStyles.map((x) => x.name).sort(), ['Body', 'Label'], "the core file's deleted Caption is gone; the components file's Label stays");
  const stamp = t._meta.snapshotAt;
  const days = JSON.stringify(Object.values(t._meta.sources).map((x) => x.at));
  // taken again another day, the same design: neither the stamp nor the day each file was taken moves (toolkit-standard §D 23)
  const day = core.tokens._meta.snapshot;
  core.tokens._meta.snapshot = '2099-01-01';
  store.writeLibrary(core, P, { now: new Date(Date.now() + 60000) });
  core.tokens._meta.snapshot = day;
  const again = JSON.parse(fs.readFileSync(P.tokens, 'utf8'))._meta;
  assert.equal(again.snapshotAt, stamp, 'nothing moved, so neither does the stamp');
  assert.equal(JSON.stringify(Object.values(again.sources).map((x) => x.at)), days, 'nor the day each file was taken');
  // Two sets under one name: one file on disk, one entry in _meta.icons, and
  // the count says 198 where the page holds 199, as one icon page did.
  const dupes = lib('ICONS');
  dupes.iconSets = ['check', 'calendar-cog', 'calendar-cog'];
  dupes.icons = [{ name: 'calendar-cog', size: 24, svg: '<svg/>' }];
  const said = store.writeLibrary(dupes, P).lines;
  assert.ok(said.some((l) => l.label === 'icons' && /named twice/.test(l.text) && /calendar-cog/.test(l.text)), 'a name carried by two icon sets is reported, not silently deduped');
  assert.ok(!store.writeLibrary(lib('ICONS2'), P).lines.some((l) => /named twice/.test(l.text)), 'and a file with no duplicate says nothing');
  fs.rmSync(dir, { recursive: true, force: true });
});

test('one file is one source in the store, whichever of its identities a run carried', async () => {
  const { createRequire } = await import('node:module');
  const store = createRequire(import.meta.url)('./store.cjs');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sources-'));
  const P = store.paths(dir);
  const pages = (n) => ({ pages: ['Cover', 'ACTIONS', ...Array.from({ length: n }, (_, i) => 'Page ' + i)] });
  // A UI run sends the document id; a headless run sends the key and a
  // different document id. The route pairs the key with the UI run's id.
  const ui = lib('doc-ui', { tokens: { _meta: { file: 'Web', fileId: 'doc-ui', snapshot: '2026-09-22', ...pages(3) } } });
  store.writeLibrary(ui, P, { ids: ['KEY', 'doc-ui'] });
  const headless = lib('doc-headless', { tokens: { _meta: { file: 'Web', fileKey: 'KEY', fileId: 'doc-headless', snapshot: '2026-09-23', ...pages(4) } } });
  store.writeLibrary(headless, P, { ids: ['KEY', 'doc-ui'] });
  store.writeLibrary(lib('OTHER', { tokens: { _meta: { file: 'Icons', fileId: 'OTHER', snapshot: '2026-09-23', ...pages(1) } } }), P);
  const sources = JSON.parse(fs.readFileSync(P.tokens, 'utf8'))._meta.sources;
  assert.deepEqual(Object.keys(sources).sort(), ['KEY', 'OTHER'], 'the web library once, under the identity the index uses; the other file untouched');
  assert.equal(sources.KEY.pages.length, 6, 'and its page list is the newer run\'s');
  fs.rmSync(dir, { recursive: true, force: true });
});

test('asked about a file, the router says which kind its routing records, so the plugin need not guess', async () => {
  const { projectsDir } = two();
  await serving(projectsDir, async ({ port }) => {
    const kind = async (q) => (await (await fetch(`http://127.0.0.1:${port}/${q ? paired(q) : ''}`)).json()).kind;
    assert.equal(await kind('?file=SIDB'), 'screens', 'a screens file, by its id');
    assert.equal(await kind('?file=nope&file=KEYA'), 'library', 'any of the ids the plugin sends');
    assert.equal(await kind('?file=NOBODYS'), null, 'a file nobody claims is left to the plugin');
    assert.equal(await kind(''), null);
  });
});

test('a file is one file under either of its ids: a payload under the key prunes what an earlier one stored under the document id', async () => {
  const { createRequire } = await import('node:module');
  const store = createRequire(import.meta.url)('./store.cjs');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ids-'));
  const P = store.paths(dir);
  const c = (name, id) => ({ name, id, page: '❖ Page', description: '', props: {}, variants: [{ name, type: 'COMPONENT', w: 10, h: 10 }] });
  // A plugin run from the UI has no fileKey: the first snapshot arrives under the document id.
  store.writeLibrary(lib('DOCID', { components: [c('Button', '1:1'), c('Chip', '1:2')] }), P, { ids: ['KEY', 'DOCID'] });
  assert.ok(fs.existsSync(path.join(P.components, 'chip', 'figma.json')));
  // The same file through the bridge carries its key. Chip is gone from the library.
  const viaBridge = lib('DOCID', { components: [c('Button', '1:1')] }); viaBridge.tokens._meta.fileKey = 'KEY';
  const lines = store.writeLibrary(viaBridge, P, { ids: ['KEY', 'DOCID'] }).lines;
  assert.ok(!fs.existsSync(path.join(P.components, 'chip')), 'the dropped spec is pruned, not kept as another file\'s');
  const index = JSON.parse(fs.readFileSync(P.index, 'utf8'));
  assert.deepEqual(Object.keys(index.components), ['button']);
  assert.equal(index.components.button.file, 'KEY', 'the index converges on the routing key');
  // Without the routing pair the store cannot know the two ids are one file, which is the defect: eight ghosts survived a fresh snapshot.
  const dir2 = fs.mkdtempSync(path.join(os.tmpdir(), 'ids-'));
  const P2 = store.paths(dir2);
  store.writeLibrary(lib('DOCID', { components: [c('Button', '1:1'), c('Chip', '1:2')] }), P2);
  const again = lib('DOCID', { components: [c('Button', '1:1')] }); again.tokens._meta.fileKey = 'KEY';
  store.writeLibrary(again, P2);
  assert.ok(fs.existsSync(path.join(P2.components, 'chip', 'figma.json')), 'without the pair, the old id reads as another file and the ghost stays');
  fs.rmSync(dir, { recursive: true, force: true }); fs.rmSync(dir2, { recursive: true, force: true });
});

test('files that move to new keys: what only the old keys own goes, once every routed file has reported', async () => {
  const { createRequire } = await import('node:module');
  const store = createRequire(import.meta.url)('./store.cjs');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'moved-'));
  const P = store.paths(dir);
  const c = (name, id) => ({ name, id, page: '❖ Page', description: '', props: {}, variants: [{ name, type: 'COMPONENT', w: 10, h: 10 }] });
  const ts = (name) => ({ name, family: 'Inter', size: 16, lineHeight: 1.5 });
  const core = (key, styles) => { const p = lib('IC', { tokens: { textStyles: styles.map(ts) }, components: [c('Logo', '9:1')] }); p.tokens._meta.fileKey = key; p.icons = [{ name: 'check', size: 16, svg: '<svg/>' }]; return p; };
  const comps = (key, names) => { const p = lib('IW', { components: names.map((n, i) => c(n, '1:' + i)) }); p.tokens.collections = { Local: p.tokens.collections.Base }; p.tokens._meta.fileKey = key; return p; };
  // Before: both files routed under their old keys.
  const before = [['KC', 'IC'], ['KW', 'IW']];
  store.writeLibrary(core('KC', ['Body', 'Old']), P, { ids: before[0], files: before });
  store.writeLibrary(comps('KW', ['Button', 'Chip']), P, { ids: before[1], files: before });
  // Both files are duplicated to new keys; the stamped ids come with them. Chip and Old are gone.
  const after = [['KC2', 'IC'], ['KW2', 'IW']];
  store.writeLibrary(comps('KW2', ['Button']), P, { ids: after[1], files: after });
  assert.ok(fs.existsSync(path.join(P.components, 'logo', 'figma.json')), 'until Core reports under its new key, nothing it owned is judged');
  store.writeLibrary(core('KC2', ['Body']), P, { ids: after[0], files: after });
  const index = JSON.parse(fs.readFileSync(P.index, 'utf8'));
  const t = JSON.parse(fs.readFileSync(P.tokens, 'utf8'));
  assert.deepEqual(Object.keys(index.components).sort(), ['button', 'logo'], 'the component only the old key had is gone from the index');
  assert.ok(!fs.existsSync(path.join(P.components, 'chip')), 'and its spec folder with it');
  assert.deepEqual(Object.keys(t._meta.sources).sort(), ['KC2', 'KW2'], 'one source per file, under its new key');
  assert.deepEqual(t.textStyles.map((x) => x.name), ['Body'], 'a style only the old key owned is gone');
  assert.deepEqual(Object.keys(index.assets.icons), ['KC2'], 'and so is its icon list');
  fs.rmSync(dir, { recursive: true, force: true });
});

test('a spec the library dropped: an unbuilt folder goes, one with code stays and is named, a folder without a spec is not ours', async () => {
  const { createRequire } = await import('node:module');
  const store = createRequire(import.meta.url)('./store.cjs');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'specs-'));
  const put = (d, files) => { fs.mkdirSync(path.join(dir, d)); for (const f of files) fs.writeFileSync(path.join(dir, d, f), f === 'figma.json' ? '{"name":"x"}' : ''); };
  put('button', ['figma.json', 'button.php']);   // renamed in Figma, built
  put('chip', ['figma.json']);                   // dropped, never built
  put('icon', ['icon.php']);                     // never had a spec
  put('card', ['figma.json']);                   // still in the library
  const r = store.pruneSpecs(dir, new Set(['card']));
  assert.deepEqual(r.removed, ['chip']);
  assert.deepEqual(r.kept, ['button']);
  assert.ok(fs.existsSync(path.join(dir, 'button', 'figma.json')) && fs.existsSync(path.join(dir, 'icon')) && !fs.existsSync(path.join(dir, 'chip')));
  assert.deepEqual(Object.keys(r.before).sort(), ['button', 'chip']);
});

test('a changed component says which fields moved: description, bindings and a renamed layer are three labels', async () => {
  const { createRequire } = await import('node:module');
  const store = createRequire(import.meta.url)('./store.cjs');
  const spec = createRequire(import.meta.url)('./spec.cjs');
  const t = () => ({ collections: {}, textStyles: [], paintStyles: [], effects: [] });
  const tree = (label, bind) => ({ name: 'Size=sm', type: 'COMPONENT', children: [{ name: label, type: 'TEXT', bindings: { fill: bind } }] });
  const mk = (over) => spec.compact({ name: 'Button', id: '1:1', description: 'A button', props: { Size: ['sm'] }, variants: [tree('Label', 'Text/strong')], ...over });
  const before = { tokens: t(), specs: { button: mk({}) } };
  const one = (over) => store.diff(before, { tokens: t(), specs: { button: mk(over) } }).components;
  assert.deepEqual(one({ description: 'A button, respelled' }).fields.button, ['description'], 'a respelled description is that and nothing else');
  assert.deepEqual(one({ variants: [tree('Label', 'Text/weak')] }).fields.button, ['bindings'], 'a rebound token is a binding change');
  assert.deepEqual(one({ variants: [tree('Text', 'Text/strong')] }).fields.button, ['layers'], 'a renamed layer is a layer change');
  const three = store.diff(before, { tokens: t(), specs: { button: mk({ description: 'x', variants: [tree('Text', 'Text/weak')] }) } }).components;
  assert.deepEqual(three.fields.button, ['description', 'layers'], 'a renamed layer hides its own binding: the path no longer pairs');
  assert.equal(three.total, 1);
  assert.deepEqual(one({}).changed, [], 'and an identical spec is not changed at all');
  // …and said for a reader: the layer, the field, both values.
  const rich = (radius, label, bind, extra = []) => ({ name: 'Size=sm', type: 'COMPONENT', w: 100, h: 40, children: [{ name: 'Tab item', type: 'FRAME', radius, bindings: { fill: bind }, children: [{ name: label, type: 'TEXT' }] }, ...extra] });
  const said = store.diff({ tokens: t(), specs: { button: mk({ variants: [rich(0, 'Label', 'Text/strong')] }) } },
                          { tokens: t(), specs: { button: mk({ description: 'A button, revised', props: { Size: ['sm'], Overflow: ['Left', 'Right'] }, variants: [rich(8, 'Label', 'Text/weak', [{ name: 'Overflow', type: 'FRAME' }]), { name: 'Overflow=Left', type: 'COMPONENT', w: 1, h: 1, children: [] }] }) } }).components;
  assert.deepEqual(said.detail.button, [
    { what: 'Description', before: 'A button', after: 'A button, revised', rule: 'docs' },
    { what: 'Property Overflow', before: 'none', after: 'Left, Right', rule: 'prop-added' },
    { what: 'Variants', before: '1', after: '2', rule: 'prop-added' },
    { what: 'Layer Overflow', before: 'none', after: 'added', rule: 'layer-added' },
    { what: 'Tab item: fill', before: 'Text/strong', after: 'Text/weak', rule: 'values-changed' },
    { what: 'Tab item: corner radius', before: '0', after: '8', rule: 'values-changed' },
  ], 'each change is a subject with both values, for a before/after table, stamped with the rule of the change it belongs to');
  // A token respelled across a component is one line, not one per layer.
  // Two as bindings, one as a paint name on the node: the plugin stores paints by token name, and both are the same event.
  const respell = (pre) => ({ name: 'Size=sm', type: 'COMPONENT', w: 1, h: 1, children: [{ name: 'A', type: 'FRAME', bindings: { fill: `${pre}/Bg/A` } }, { name: 'B', type: 'FRAME', bindings: { fill: `${pre}/Bg/B` } }, { name: 'C', type: 'FRAME', fills: [`${pre}/Bg/C`] }] });
  const r2 = store.diff({ tokens: t(), specs: { button: mk({ variants: [respell('Colour')] }) } }, { tokens: t(), specs: { button: mk({ variants: [respell('Color')] }) } }).components;
  assert.deepEqual(r2.detail.button.map(({ items, ...n }) => n), [{ what: 'Tokens renamed (3 bindings)', before: 'Colour/…', after: 'Color/…', rule: 'values-changed' }]);
  // …and keeps each binding it stands for, whole, for the reader who opens it
  assert.deepEqual(r2.detail.button[0].items.map((i) => `${i.what} ${i.before} > ${i.after}`), ['A: fill Colour/Bg/A > Color/Bg/A', 'B: fill Colour/Bg/B > Color/Bg/B', 'C: fill Colour/Bg/C > Color/Bg/C']);
  // A field the old spec never carried anywhere is the plugin's new field, not a design change.
  const plain = { name: 'Size=sm', type: 'COMPONENT', w: 1, h: 1, children: [{ name: 'A', type: 'FRAME' }] };
  const withEffects = { name: 'Size=sm', type: 'COMPONENT', w: 1, h: 1, children: [{ name: 'A', type: 'FRAME', effects: ['DROP_SHADOW'] }] };
  const r3 = store.diff({ tokens: t(), specs: { button: mk({ variants: [plain] }) } }, { tokens: t(), specs: { button: mk({ variants: [withEffects] }) } }).components;
  assert.deepEqual(r3.detail.button, [], 'a field arriving with a newer plugin is not listed as a change');
  assert.deepEqual(r3.changed, ['button'], 'but the component still counts as changed');
  // …and the grade says nothing moved either: it said "its values moved" with no note to show which
  const g3 = store.grade({ tokens: t(), specs: { button: mk({ variants: [plain] }) } }, { tokens: t(), specs: { button: mk({ variants: [withEffects] }) } });
  assert.deepEqual(g3.changes, [], 'a field arriving with a newer plugin is not graded as a change');
  // Round 4 of the 2026-10-02 review: the absence rule cannot tell a field the
  // plugin began to record from one the library began to use, so where both
  // snapshots were taken by one plugin release (`_meta.plugin`, 0.49.3 on) every
  // field counts: the first shadow a library draws is a change, with its note.
  const stamped = (specs, sources) => ({ tokens: { ...t(), _meta: { ...(t()._meta || {}), plugin: '0.49.3', ...(sources && { sources }) } }, specs });
  const g4 = store.grade(stamped({ button: mk({ variants: [plain] }) }), stamped({ button: mk({ variants: [withEffects] }) }));
  assert.deepEqual(g4.changes.map((c) => c.rule), ['values-changed'], 'the same change between two snapshots of one plugin release is graded');
  const d4 = store.diff(stamped({ button: mk({ variants: [plain] }) }), stamped({ button: mk({ variants: [withEffects] }) })).components;
  assert.equal(d4.detail.button.length, 1, '…with its note');
  // …and the grade is read off the notes: a paint said longer (IMAGE → IMAGE:FIT)
  // is no note, so no grade, where specFields counted it as values moved.
  const img = (v) => ({ name: 'Size=sm', type: 'COMPONENT', w: 1, h: 1, children: [{ name: 'A', type: 'FRAME', fills: [v] }] });
  const g5 = store.grade(stamped({ button: mk({ variants: [img('IMAGE')] }) }), stamped({ button: mk({ variants: [img('IMAGE:FIT')] }) }));
  assert.deepEqual(g5.changes, [], 'a paint said longer is not a change the grade reports without a note');
  // a node's first binding of a field known nowhere, by one release: a change with a note
  const bound = { name: 'Size=sm', type: 'COMPONENT', w: 1, h: 1, children: [{ name: 'A', type: 'FRAME', radius: 8, bindings: { radius: 'Radius/8' } }] };
  const unbound = { name: 'Size=sm', type: 'COMPONENT', w: 1, h: 1, children: [{ name: 'A', type: 'FRAME', radius: 8 }] };
  const g6 = store.grade(stamped({ button: mk({ variants: [unbound] }) }), stamped({ button: mk({ variants: [bound] }) }));
  const d6 = store.diff(stamped({ button: mk({ variants: [unbound] }) }), stamped({ button: mk({ variants: [bound] }) })).components;
  assert.ok(g6.changes.some((c) => c.rule === 'values-changed') && d6.detail.button.some((n) => n.rule === 'values-changed'), 'a first binding by one release is graded, with its note');
  // …but the stamp is every source's, not the last writer's: a two-file project
  // whose library was taken by an older release than its screens file keeps
  // the absence rule, whatever `_meta.plugin` says (review round 4, M3).
  const mixed = { A: { file: 'Library', plugin: '0.49.1' }, B: { file: 'Screens', plugin: '0.49.3' } };
  const g7 = store.grade(stamped({ button: mk({ variants: [plain] }) }, mixed), stamped({ button: mk({ variants: [withEffects] }) }, mixed));
  assert.deepEqual(g7.changes, [], 'a pair with files taken by different releases keeps the absence rule');
  const oneRelease = { A: { file: 'Library', plugin: '0.49.3' }, B: { file: 'Screens', plugin: '0.49.3' } };
  const g8 = store.grade(stamped({ button: mk({ variants: [plain] }) }, oneRelease), stamped({ button: mk({ variants: [withEffects] }) }, oneRelease));
  assert.deepEqual(g8.changes.map((c) => c.rule), ['values-changed'], 'every file by one release on both sides: every field counts');
  // A nested set renamed re-points every instance layer; three or more moving from one set name to another are one line.
  const cal = (setName) => ({ name: 'Size=sm', type: 'COMPONENT', w: 1, h: 1, children: ['Day', 'Day#2', 'Day#3'].map((n) => ({ name: n, type: 'INSTANCE', instanceOf: `${setName} / Selected=False` })) });
  const r4 = store.diff({ tokens: t(), specs: { calendar: mk({ variants: [cal('Date picker/_Single day')] }) } }, { tokens: t(), specs: { calendar: mk({ variants: [cal('_Date picker - Single day')] }) } }).components;
  assert.deepEqual(r4.detail.calendar.map(({ items, ...n }) => n), [{ what: 'Nested component renamed (3 layers)', before: 'Date picker/_Single day', after: '_Date picker - Single day' }]);
  assert.equal(r4.detail.calendar[0].items.length, 3, 'the collapsed note keeps each layer it stands for');
  // A value the plugin began to record in more detail is the same value, not a change.
  const pic = (fill) => ({ name: 'Size=sm', type: 'COMPONENT', w: 1, h: 1, children: [{ name: 'Photo', type: 'RECTANGLE', fills: [fill] }] });
  assert.deepEqual(store.diff({ tokens: t(), specs: { avatar: mk({ variants: [pic('image')] }) } }, { tokens: t(), specs: { avatar: mk({ variants: [pic('IMAGE:FILL')] }) } }).components.detail.avatar, []);
  // A slot change has no value to show; the note says so without pretending to.
  const slotted = (slots) => mk({ slots, variants: [plain] });
  assert.deepEqual(store.diff({ tokens: t(), specs: { button: slotted(['a']) } }, { tokens: t(), specs: { button: slotted(['a', 'b']) } }).components.detail.button, [{ what: 'Slot settings', before: '', after: 'changed' }]);
});

test('a rename is one event, paired by the node id the spec keeps, never by name', async () => {
  const { createRequire } = await import('node:module');
  const store = createRequire(import.meta.url)('./store.cjs');
  const spec = createRequire(import.meta.url)('./spec.cjs');
  const t = () => ({ collections: {}, textStyles: [], paintStyles: [], effects: [] });
  const mk = (name, id, desc = '') => spec.compact({ name, id, description: desc, props: {}, variants: [{ name: 'Default', type: 'COMPONENT' }] });
  const d = store.diff({ tokens: t(), specs: { 'table-context-flyover-item': mk('Table - Context flyover - Item', '9:1'), chip: mk('Chip', '9:2') } },
                       { tokens: t(), specs: { 'table-context-flyover-section-item': mk('Table - Context flyover - Section - Item', '9:1'), badge: mk('Badge', '9:3') } });
  assert.deepEqual(d.components.renamed, [{ from: 'Table - Context flyover - Item', to: 'Table - Context flyover - Section - Item', id: '9:1', folder: 'table-context-flyover-section-item' }]);
  assert.deepEqual([d.components.added, d.components.removed], [['badge'], ['chip']], 'what is not a rename stays an add and a remove');
  // A rename that also changed something says what, and a renamed spec with no id is not paired.
  const e = store.diff({ tokens: t(), specs: { a: mk('A', '1:1') } }, { tokens: t(), specs: { b: mk('B', '1:1', 'now described') } });
  assert.deepEqual(e.components.renamed[0].fields, ['description']);
  const f = store.diff({ tokens: t(), specs: { a: mk('A', null) } }, { tokens: t(), specs: { b: mk('B', null) } });
  assert.deepEqual([f.components.renamed, f.components.added, f.components.removed], [[], ['b'], ['a']]);
});

test('one detector: the change log and the grade name the same change the same way', async () => {
  const { createRequire } = await import('node:module');
  const store = createRequire(import.meta.url)('./store.cjs');
  const spec = createRequire(import.meta.url)('./spec.cjs');
  const tokens = (vals) => ({ collections: { Semantic: { modes: ['Light'], values: { Light: vals } } }, textStyles: [], effects: [] });
  const v = (name, kids) => ({ name, type: 'COMPONENT', w: 80, h: 40, children: kids.map((k) => ({ name: k, type: 'TEXT' })) });
  const button = (kids, props) => spec.compact({ name: 'Button', id: '1:1', props, variants: [v('Size=sm', kids)] });
  const before = { tokens: tokens({ fg: '#000' }), specs: { button: button(['Label'], { Size: ['sm'], Label: 'TEXT' }) } };
  const after = { tokens: tokens({ text: '#000' }), specs: { button: button(['Title'], { Size: ['sm'], Text: 'TEXT' }) } };
  const d = store.diff(before, after), g = store.grade(before, after);
  const notes = d.components.detail.button.map((n) => `${n.what}|${n.before}|${n.after}`);
  // a renamed layer: one note saying so, never "added" beside "removed", and the grade's layer-renamed
  assert.ok(notes.includes('Layer Label|present|renamed to Title') && !notes.some((n) => /^Layer .*\|(added|removed)$/.test(n)));
  assert.ok(g.changes.some((c) => c.rule === 'layer-renamed') && !g.changes.some((c) => c.rule === 'layer-added' || c.rule === 'layer-removed'));
  // a renamed property: one note, and the grade's prop-renamed
  assert.ok(notes.includes('Property renamed|Label|Text') && g.changes.some((c) => c.rule === 'prop-renamed'));
  // a renamed token: the log's renamed list, not an add and a remove, and the grade's token-renamed
  assert.deepEqual([d.tokens.renamed, d.tokens.added, d.tokens.removed], [['fg → text'], [], []]);
  assert.ok(g.changes.some((c) => c.rule === 'token-renamed'));
  // every change carries its group from the one table, and the roll-up words it once
  assert.ok(g.changes.every((c) => c.group === store.GRADE_RULES[c.rule][2]));
  assert.deepEqual(store.gradeOf(g.changes), { figma: 'patch', code: 'major', audience: 'code', label: 'Breaking for code' });
});

test('a token change carries its values: before and after per mode, aliases named, a retarget to the same value still a change', async () => {
  const { createRequire } = await import('node:module');
  const store = createRequire(import.meta.url)('./store.cjs');
  const col = (bg, alias) => ({ collections: { Semantic: { modes: ['Light'], values: { Light: { bg, fg: '#000' } }, alias: { Light: { bg: alias } } } }, textStyles: [], effects: [] });
  let g = store.grade({ tokens: col('#fff', 'White/base') }, { tokens: col('#f5f5f5', 'Gray/1') });
  const moved = g.changes.find((c) => c.rule === 'token-value');
  assert.deepEqual(moved.values, [{ name: 'bg', mode: 'Light', before: { value: '#fff', alias: 'White/base' }, after: { value: '#f5f5f5', alias: 'Gray/1' } }]);
  g = store.grade({ tokens: col('#fff', 'White/base') }, { tokens: col('#fff', 'Paper/base') });
  assert.ok(g.changes.some((c) => c.rule === 'token-value' && c.values[0].after.alias === 'Paper/base'), 'an alias retargeted to the same value is a change');
  const more = col('#fff', 'White/base'); more.collections.Semantic.values.Light.accent = '#06f';
  g = store.grade({ tokens: col('#fff', 'White/base') }, { tokens: more });
  assert.deepEqual(g.changes.find((c) => c.rule === 'token-added').values, [{ name: 'accent', mode: 'Light', after: { value: '#06f' } }]);
});

test('a change is graded per audience: what loses a consumer\'s work is major for Figma, what renames an interface is major for code', async () => {
  const { createRequire } = await import('node:module');
  const store = createRequire(import.meta.url)('./store.cjs');
  const spec = createRequire(import.meta.url)('./spec.cjs');
  const tokens = (over = {}) => ({ collections: { Semantic: { modes: ['Light', 'Dark'], values: { Light: { 'bg': '#fff', 'fg': '#000' }, Dark: { 'bg': '#000', 'fg': '#fff' } } } }, textStyles: [{ name: 'Body', fontSize: 16, lineHeight: 24 }], effects: [], ...over });
  const v = (name, kids, extra = {}) => ({ name, type: 'COMPONENT', w: 80, h: 40, ...extra, children: kids.map((k) => (typeof k === 'string' ? { name: k, type: 'TEXT' } : k)) });
  const button = (variants, props = { Size: ['sm', 'md'], Label: 'TEXT' }, over = {}) => spec.compact({ name: 'Button', id: '1:1', props, variants, ...over });
  const base = { tokens: tokens(), specs: { button: button([v('Size=sm', ['Label']), v('Size=md', ['Label'])]) } };
  const rule = (g, r) => g.changes.find((c) => c.rule === r);
  const only = (g) => g.changes.map((c) => c.rule).sort().join();
  const T = (t) => store.grade(base, { ...base, tokens: t }), C = (sp) => store.grade(base, { ...base, specs: { button: sp } });

  assert.equal(store.grade(null, { tokens: tokens() }).level, 'first');
  assert.equal(store.grade(base, base).level, null);

  // tokens. A moved value is minor for both: the output moves with it.
  let t = tokens(); t.collections.Semantic.values.Dark.bg = '#111';
  let g = T(t); assert.equal(only(g), 'token-value'); assert.equal(g.level, 'minor');
  // a removal is major for both; a rename (same value in every mode) is a patch for Figma and major for code
  t = tokens(); delete t.collections.Semantic.values.Light.fg; delete t.collections.Semantic.values.Dark.fg;
  g = T(t); assert.equal(only(g), 'token-removed'); assert.deepEqual([g.figma, g.code, g.level], ['major', 'major', 'BREAKING']);
  t = tokens(); for (const m of ['Light', 'Dark']) { t.collections.Semantic.values[m].text = t.collections.Semantic.values[m].fg; delete t.collections.Semantic.values[m].fg; }
  g = T(t); assert.equal(only(g), 'token-renamed'); assert.deepEqual([g.figma, g.code], ['patch', 'major']); assert.match(rule(g, 'token-renamed').what, /fg → text/);
  // a mode removed falls back silently in Figma: major; added: minor; renamed with the same values: patch / major
  t = tokens(); t.collections.Semantic.modes = ['Light']; delete t.collections.Semantic.values.Dark;
  assert.equal(only(T(t)), 'mode-removed');
  t = tokens(); t.collections.Semantic.modes.push('Contrast'); t.collections.Semantic.values.Contrast = {};
  assert.equal(only(T(t)), 'mode-added');
  t = tokens(); t.collections.Semantic.modes = ['Light', 'Night']; t.collections.Semantic.values.Night = t.collections.Semantic.values.Dark; delete t.collections.Semantic.values.Dark;
  g = T(t); assert.equal(only(g), 'mode-renamed'); assert.deepEqual([g.figma, g.code], ['patch', 'major']);
  // a collection renamed keeps its tokens: one event, a patch for Figma
  t = tokens(); t.collections = { 'Semantic colour': t.collections.Semantic };
  g = T(t); assert.deepEqual([only(g), g.figma, g.code], ['collection-renamed', 'patch', 'major']);
  // a value that changes kind is a retype, not a move
  t = tokens(); t.collections.Semantic.values.Light.bg = 4; assert.equal(only(T(t)), 'token-retyped');
  // styles: removed, renamed (same body), changed
  assert.equal(only(T(tokens({ textStyles: [] }))), 'style-removed');
  assert.equal(only(T(tokens({ textStyles: [{ name: 'Body/md', fontSize: 16, lineHeight: 24 }] }))), 'style-renamed');
  g = T(tokens({ textStyles: [{ name: 'Body', fontSize: 16, lineHeight: 20 }] })); assert.equal(only(g), 'style-changed'); assert.match(g.minor[0], /lineHeight 24 → 20/);

  // components, each change the Figma test of 2026-10-01 settled
  g = C(button([v('Size=sm', ['Label'])], { Size: ['sm'], Label: 'TEXT' }));
  assert.ok(rule(g, 'option-removed') && g.level === 'BREAKING');
  g = C(button([v('Size=sm', ['Label']), v('Size=lg', ['Label'])], { Size: ['sm', 'lg'], Label: 'TEXT' }));
  assert.deepEqual([only(g), g.figma, g.code], ['option-renamed', 'patch', 'major']);
  g = C(button([v('Scale=sm', ['Label']), v('Scale=md', ['Label'])], { Scale: ['sm', 'md'], Label: 'TEXT' }));
  assert.equal(rule(g, 'axis-renamed').figma, 'patch');
  g = C(button([v('Size=sm', ['Label']), v('Size=md', ['Label'])], { Size: ['sm', 'md'] }));
  assert.deepEqual([only(g), g.figma], ['prop-removed', 'major']);
  g = C(button([v('Size=sm', ['Label']), v('Size=md', ['Label'])], { Size: ['sm', 'md'], Text: 'TEXT' }));
  assert.deepEqual([only(g), g.figma, g.code], ['prop-renamed', 'patch', 'major']);
  g = C(button([v('Size=sm', ['Label']), v('Size=md', ['Label'])], { Size: ['sm', 'md'], Label: 'BOOLEAN' }));
  assert.deepEqual([only(g), g.figma], ['prop-retyped', 'major']);
  const slotted = { ...base, specs: { button: button([v('Size=sm', ['Label']), v('Size=md', ['Label'])], { Size: ['sm', 'md'], Label: 'TEXT', Body: 'SLOT' }) } };
  g = store.grade(slotted, base); assert.equal(only(g), 'slot-removed'); assert.match(g.breaking[0], /loses what was put in it/);
  // layers: renamed (same parent, same type) and moved (same name, new parent) are a patch for Figma
  g = C(button([v('Size=sm', ['Title']), v('Size=md', ['Title'])]));
  assert.deepEqual([only(g), g.figma, g.code], ['layer-renamed', 'patch', 'minor']);
  const wrapped = (n) => v(n, [{ name: 'Wrap', type: 'FRAME', children: [{ name: 'Label', type: 'TEXT' }] }]);
  g = C(button([wrapped('Size=sm'), wrapped('Size=md')]));
  assert.ok(rule(g, 'layer-renamed') && /Label moved/.test(rule(g, 'layer-renamed').what) && rule(g, 'layer-added') && !rule(g, 'layer-removed'));
  g = C(button([v('Size=sm', []), v('Size=md', [])]));
  assert.deepEqual([only(g), g.figma], ['layer-removed', 'major']);
  // a nested instance pointed at another variant drops its overrides; a set renamed under the same key does not
  const withIcon = (k, name) => button([v('Size=sm', ['Label', { name: 'Icon', type: 'INSTANCE', instanceOf: name, instanceOfKey: k }]), v('Size=md', ['Label'])]);
  const iconBase = { ...base, specs: { button: withIcon('k-circle', 'Icon / Shape=Circle') } };
  g = store.grade(iconBase, { ...base, specs: { button: withIcon('k-square', 'Icon / Shape=Square') } });
  assert.deepEqual([only(g), g.figma], ['nested-repointed', 'major']);
  g = store.grade(iconBase, { ...base, specs: { button: withIcon('k-circle', 'Glyph / Shape=Circle') } });
  assert.equal(rule(g, 'nested-repointed'), undefined);
  // a nested set whose own name holds " / " is resolved against the known
  // names, not cut at the first slash: `Table - Cell / Fill` renamed
  // `Table - Cell / Filled` is a set renamed, with keys or without
  const cell = (set, k) => spec.compact({ name: set, id: k || set, props: {}, variants: [v('Size=md', [])] });
  const table = (set, k) => button([v('Size=sm', ['Label', { name: 'Cell', type: 'INSTANCE', instanceOf: `${set} / Size=md`, ...(k ? { instanceOfKey: k } : {}) }]), v('Size=md', ['Label'])]);
  for (const k of ['k-cell', undefined]) {
    const side = (set) => ({ ...base, specs: { button: table(set, k), cell: cell(set, '9:9') } });
    g = store.grade(side('Table - Cell / Fill'), side('Table - Cell / Filled'));
    assert.equal(rule(g, 'nested-repointed'), undefined, `a nested set renamed is no re-pointing (${k ? 'keys' : 'no keys'})`);
    const d = store.diff(side('Table - Cell / Fill'), side('Table - Cell / Filled')).components.detail.button || [];
    assert.ok(d.some((n) => /Nested component renamed/.test(n.what) && n.before === 'Table - Cell / Fill' && n.after === 'Table - Cell / Filled'), `the rename is noted (${k ? 'keys' : 'no keys'})`);
  }
  // a size change is major for Figma (fixed layouts), a paint is minor
  g = C(button([v('Size=sm', ['Label'], { h: 44 }), v('Size=md', ['Label'])]));
  assert.deepEqual([only(g), g.figma, g.code], ['size-changed', 'major', 'minor']);
  // (a paint that moved, not one the plugin recorded for the first time, which is no change)
  const filled = (f) => ({ ...base, specs: { button: button([v('Size=sm', ['Label'], { fills: [f] }), v('Size=md', ['Label'])]) } });
  g = store.grade(filled('Colour/y'), filled('Colour/x'));
  assert.equal(only(g), 'values-changed');
  // components by id: a rename is one event, not a removal and an addition
  g = store.grade(base, { ...base, specs: { 'button-primary': button([v('Size=sm', ['Label']), v('Size=md', ['Label'])], undefined, { name: 'Button primary' }) } });
  assert.deepEqual([only(g), g.figma], ['component-renamed', 'patch']);
  g = store.grade(base, { ...base, specs: {} }); assert.equal(only(g), 'component-removed');
  // marked deprecated (the word in its name or page) is Deprecated, not a rename
  g = store.grade(base, { ...base, specs: { 'deprecated-button': button([v('Size=sm', ['Label']), v('Size=md', ['Label'])], undefined, { name: '[DEPRECATED] Button' }) } });
  assert.deepEqual([only(g), g.figma, g.code, g.changes[0].group], ['component-deprecated', 'minor', 'minor', 'Deprecated']);
  // a description alone is a patch; the lines print by level
  g = C(button([v('Size=sm', ['Label']), v('Size=md', ['Label'])], undefined, { description: 'A button.' }));
  assert.deepEqual([only(g), g.level], ['docs', 'patch']);
  assert.deepEqual(store.gradeLines(g), ['patch: button: its description or page changed']);
  // every rule a change can carry is in the one table
  for (const c of g.changes) assert.ok(store.GRADE_RULES[c.rule]);
});

test('pairing from evidence: renamed siblings, a recreated component, a token that only shares a value (review of 2 October 2026)', async () => {
  const { createRequire } = await import('node:module');
  const store = createRequire(import.meta.url)('./store.cjs');
  const spec = createRequire(import.meta.url)('./spec.cjs');
  const t = () => ({ collections: {}, textStyles: [], paintStyles: [], effects: [] });
  const only = (g) => g.changes.map((c) => c.rule).sort().join();

  // Project B, 1 October: five items of one component in a slot, renamed
  // together. Every one keeps its instance key, so every override survives;
  // it was graded five layer removals, a false major.
  const item = (name, kids, key = '16de1dd5f3') => ({ name, type: 'INSTANCE', instanceOf: 'Section - Item / Selected=False', instanceOfKey: key, ...(kids ? { children: kids } : {}) });
  const section = (names, kids, key) => spec.compact({ name: 'Section', id: '1:2', props: {}, variants: [{ name: 'Expanded=True', type: 'COMPONENT', w: 240, h: 200, children: [
    { name: 'Section header', type: 'INSTANCE', instanceOf: 'Section - Header / State=Rest', instanceOfKey: '6b5e10ba6f' },
    { name: 'Items slot', type: 'SLOT', children: names.map((n) => item(n, kids, key)) }] }] });
  const five = (n) => Array(5).fill(n);
  let g = store.grade({ tokens: t(), specs: { s: section(five('Sidebar (Secondary) - Section - Item')) } }, { tokens: t(), specs: { s: section(five('Item')) } });
  assert.equal(only(g), 'layer-renamed', 'five renamed siblings of one key are five renames');
  assert.deepEqual([g.figma, g.code], ['patch', 'minor']);
  // …and their own children follow them, said nowhere: their paths moved with the parent
  const kids = [{ name: 'Content', type: 'FRAME', children: [{ name: 'Label', type: 'TEXT' }] }];
  g = store.grade({ tokens: t(), specs: { s: section(five('Old item'), kids) } }, { tokens: t(), specs: { s: section(five('Item'), kids) } });
  assert.equal(only(g), 'layer-renamed');
  // counts that do not match pair nothing, and another component's instances never pair
  g = store.grade({ tokens: t(), specs: { s: section(five('Old item')) } }, { tokens: t(), specs: { s: section(Array(4).fill('Item')) } });
  assert.ok(g.changes.some((c) => c.rule === 'layer-removed'));
  g = store.grade({ tokens: t(), specs: { s: section(five('Old item')) } }, { tokens: t(), specs: { s: section(five('Item'), undefined, 'ffff') } });
  assert.ok(g.changes.some((c) => c.rule === 'layer-removed'), 'a different component in their place is a removal');

  // A component deleted and recreated under its old name has a new node id:
  // its placed instances are orphaned. The folder used to win, and graded it a layer added.
  const mk = (id) => spec.compact({ name: 'Chip', id, props: {}, variants: [{ name: 'Default', type: 'COMPONENT' }] });
  g = store.grade({ tokens: t(), specs: { chip: mk('9:1') } }, { tokens: t(), specs: { chip: mk('9:7') } });
  assert.equal(only(g), 'component-added,component-removed');
  g = store.grade({ tokens: t(), specs: { chip: mk('9:1') } }, { tokens: t(), specs: { chip: mk('9:1') } });
  assert.equal(g.level, null, 'the same id is the same component');

  // A token rename respells one segment; two names that share only a value are a removal and an addition.
  const col = (vals) => ({ ...t(), collections: { Space: { modes: ['Default'], values: { Default: vals } } } });
  g = store.grade({ tokens: col({ 'a/old': 8 }) }, { tokens: col({ 'b/new': 8 }) });
  assert.equal(only(g), 'token-added,token-removed');
  g = store.grade({ tokens: col({ 'Space/old': 8 }) }, { tokens: col({ 'Space/new': 8 }) });
  assert.equal(only(g), 'token-renamed');
  // two tokens of one value, each respelled in one segment, are two renames, not an ambiguity
  g = store.grade({ tokens: col({ 'Colour/a': 8, 'Colour/b': 8 }) }, { tokens: col({ 'Color/a': 8, 'Color/b': 8 }) });
  assert.equal(only(g), 'token-renamed'); assert.match(g.changes[0].what, /: 2 —/);

  // Deprecated is the word, not the stem.
  const named = (name) => spec.compact({ name, id: '5:5', props: {}, variants: [{ name: 'Default', type: 'COMPONENT' }] });
  g = store.grade({ tokens: t(), specs: { notice: named('Notice') } }, { tokens: t(), specs: { 'deprecation-notice': named('Deprecation notice') } });
  assert.equal(only(g), 'component-renamed');

  // A resize does not swallow a fill that moved beside it; a resize alone is one change.
  const box = (h, fill, ch) => spec.compact({ name: 'Box', id: '6:6', props: {}, variants: [{ name: 'Default', type: 'COMPONENT', w: 80, h, ...(fill ? { fills: [fill] } : {}), children: [{ name: 'Body', type: 'FRAME', w: 80, h: ch }] }] });
  g = store.grade({ tokens: t(), specs: { box: box(40, '#fff', 30) } }, { tokens: t(), specs: { box: box(48, '#000', 38) } });
  assert.equal(only(g), 'size-changed,values-changed');
  g = store.grade({ tokens: t(), specs: { box: box(40, '#fff', 30) } }, { tokens: t(), specs: { box: box(48, '#fff', 38) } });
  assert.equal(only(g), 'size-changed', 'the heights a resize moves down the tree are the resize');

  // Each note carries the rule of its change, so a layer removed and a layer
  // added on one day are joined to their own changes, not both to the first.
  const lay = (kids) => spec.compact({ name: 'Box', id: '6:6', props: {}, variants: [{ name: 'Default', type: 'COMPONENT', children: kids }] });
  const d = store.diff({ tokens: t(), specs: { box: lay([{ name: 'Icon', type: 'INSTANCE', instanceOfKey: 'k1' }]) } },
                       { tokens: t(), specs: { box: lay([{ name: 'Badge', type: 'TEXT' }]) } });
  assert.deepEqual(d.components.detail.box.map((n) => `${n.what}|${n.rule}`), ['Layer Badge|layer-added', 'Layer Icon|layer-removed']);

  // Round 2 (R7): the group rule pairs instances by their key. Plain layers
  // have none, and two frames out and two in under one parent are a removal
  // and an addition: `[Icon, Badge]` replaced by `[Divider, Spacer]` was
  // graded a rename, a patch, and the major was lost.
  const plain = (names) => lay(names.map((name) => ({ name, type: 'FRAME' })));
  g = store.grade({ tokens: t(), specs: { box: plain(['Icon', 'Badge']) } }, { tokens: t(), specs: { box: plain(['Divider', 'Spacer']) } });
  assert.equal(only(g), 'layer-added,layer-removed', 'plain siblings are never paired as a group');
  // …while instances from a spec that predates keys still are, by their
  // variant: Project B's 21 September renames (`Table/Column` → `Table - Column`).
  const old = (set, names) => lay(names.map((name) => ({ name, type: 'INSTANCE', instanceOf: `${set} / Hug=False` })));
  g = store.grade({ tokens: t(), specs: { box: old('Table/Column', ['Column', 'Column#2']) } }, { tokens: t(), specs: { box: old('Table - Column', ['Table - Column', 'Table - Column#2']) } });
  assert.equal(only(g), 'layer-renamed', 'key-less instances of one variant renamed together are renames');

  // Round 2 (R11): a variant set collapsed to its one surviving component
  // keeps the folder and changes node id — the set's id goes, the variant's
  // stays, and the instances already point at the variant. Not a recreate:
  // Project B's `sidebar-primary-section`, 22 September 2026 (1:12446 → 1:12447).
  const set = spec.compact({ name: 'Section', id: '1:12446', props: { Expanded: ['True', 'False'] }, variants: [{ name: 'Expanded=True', type: 'COMPONENT' }, { name: 'Expanded=False', type: 'COMPONENT' }] });
  const single = spec.compact({ name: 'Section', id: '1:12447', props: {}, variants: [{ name: 'Section', type: 'COMPONENT' }] });
  g = store.grade({ tokens: t(), specs: { section: set } }, { tokens: t(), specs: { section: single } });
  assert.ok(!g.changes.some((c) => /^component-(added|removed)$/.test(c.rule)), 'a set and a single component under one folder pair by the folder');
  assert.ok(g.changes.some((c) => c.rule === 'prop-removed'), 'and the axis it lost is the removal it is');
});

test('a library snapshot writes each component\'s contract beside its spec, and a dropped unbuilt component goes with it', async () => {
  const { createRequire } = await import('node:module');
  const store = createRequire(import.meta.url)('./store.cjs');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'contract-'));
  const P = store.paths(dir);
  const tag = (name, id) => ({ name, id, page: 'P', description: '', props: { Size: ['Large', 'Small'] }, variants: [
    { name: 'Size=Large', type: 'COMPONENT', w: 10, h: 10, children: [] }, { name: 'Size=Small', type: 'COMPONENT', w: 8, h: 8, children: [] }] });
  store.writeLibrary(lib('L', { components: [tag('Tag', '1:1'), tag('Chip', '1:2')] }), P);
  const c = JSON.parse(fs.readFileSync(path.join(P.components, 'tag', 'contract.json'), 'utf8'));
  assert.equal(c.component, 'Tag');
  assert.deepEqual(c.props.size.values, ['large', 'small']);
  store.writeLibrary(lib('L', { components: [tag('Tag', '1:1')] }), P);
  assert.ok(!fs.existsSync(path.join(P.components, 'chip')), 'a spec and its contract are not code: the folder goes');
  // a spec no contract can be derived from leaves no old contract to be read as current
  const derive = createRequire(import.meta.url)('../component-contract/derive.cjs');
  const real = derive.derive;
  derive.derive = () => { throw new Error('cannot'); };
  let said;
  try { said = store.writeLibrary(lib('L', { components: [tag('Tag', '1:1')] }), P).lines; } finally { derive.derive = real; }
  assert.ok(!fs.existsSync(path.join(P.components, 'tag', 'contract.json')), 'the stale contract is gone');
  assert.ok(said.some((l) => (l.detail || []).some((d) => /no contract derived — tag/.test(d))), 'and the snapshot says so');
  fs.rmSync(dir, { recursive: true, force: true });
});

test('snapshot-standard 18: a project block naming an unknown phase is refused, and says which phases exist', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'phase-'));
  const doc = path.join(dir, 'design-system-context.md');
  fs.writeFileSync(doc, '# x\n\n```json project\n{ "name": "X", "phase": "launch" }\n```\n');
  const p = contract.project(doc);
  assert.ok(p.error && /names phase "launch"/.test(p.error) && contract.PHASES.every((ph) => p.error.includes(ph)), p.error);
  fs.writeFileSync(doc, '# x\n\n```json project\n{ "name": "X", "phase": "design" }\n```\n');
  assert.ok(!contract.project(doc).error, 'a known phase is accepted');
  fs.rmSync(dir, { recursive: true, force: true });
});

test('a project is found at <root>/<label>/figma-design-system, its label the repo folder', () => {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'homes-'));
  const home = path.join(rootDir, 'acme-web', contract.HOME);
  fs.mkdirSync(home, { recursive: true });
  fs.writeFileSync(path.join(home, 'design-system-context.md'), '# x\n\n```json project\n{ "name": "Acme" }\n```\n');
  fs.mkdirSync(path.join(rootDir, 'not-a-project'));
  const before = process.env.TOOLKIT_PROJECTS_ROOT;
  process.env.TOOLKIT_PROJECTS_ROOT = rootDir;
  try {
    assert.equal(contract.homeOf('acme-web'), home);
    assert.ok(!contract.homes().some((h) => h.name === 'not-a-project'), 'a repo without the folder is not a project');
    assert.equal(contract.homes().find((h) => h.name === 'acme-web').home, home);
    assert.equal(contract.labelOf(home), 'acme-web');
    const w = contract.layout(null, 'acme-web');
    assert.equal(w.audit, path.join(home, 'audit'));
    assert.equal(w.site, path.join(home, 'site'));
    assert.equal(w.parity, path.join(home, 'parity'));
    assert.equal(w.paths.components, path.join(home, 'snapshot', 'components'));
  } finally {
    if (before === undefined) delete process.env.TOOLKIT_PROJECTS_ROOT; else process.env.TOOLKIT_PROJECTS_ROOT = before;
    fs.rmSync(rootDir, { recursive: true, force: true });
  }
});

test('validatorStates: one library\'s state axis and options by file key; none where it records none or libraries disagree', () => {
  const ctx = { libraries: { A: { tokens: { stateAxis: 'State' }, optionOrder: { State: ['Rest', 'Hover'] } }, B: { tokens: {}, optionOrder: {} } } };
  assert.deepEqual(contract.validatorStates(ctx, 'A'), { axis: 'State', options: ['Rest', 'Hover'] });
  assert.equal(contract.validatorStates(ctx, 'B'), null);
  assert.equal(contract.validatorStates(ctx), null);
});

test('a project block naming a port outside the bridge range is refused; one inside it reaches the layout', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'port-'));
  const doc = path.join(dir, 'design-system-context.md');
  fs.writeFileSync(doc, '# x\n\n```json project\n{ "name": "X", "port": 8080 }\n```\n');
  assert.ok(/names port 8080/.test(contract.project(doc).error || ''));
  fs.writeFileSync(doc, '# x\n\n```json project\n{ "name": "X", "port": 9229 }\n```\n');
  assert.equal(contract.project(doc).port, 9229);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('the contract editor\'s port: the project block\'s editorPort, else the editor\'s default; a bad one, or the docs site\'s own, is refused', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'editor-port-'));
  const doc = path.join(dir, 'design-system-context.md');
  fs.writeFileSync(doc, '# x\n\n```json project\n{ "name": "X", "port": 9229 }\n```\n');
  assert.equal(contract.project(doc).editorPort, contract.EDITOR_PORT);
  fs.writeFileSync(doc, '# x\n\n```json project\n{ "name": "X", "port": 9229, "editorPort": 9251 }\n```\n');
  assert.equal(contract.project(doc).editorPort, 9251);
  for (const bad of ['"9251"', '80', '9229', '9231']) {
    fs.writeFileSync(doc, `# x\n\n\`\`\`json project\n{ "name": "X", "port": 9229, "editorPort": ${bad} }\n\`\`\`\n`);
    assert.ok(/names editorPort/.test(contract.project(doc).error || ''), bad);
  }
  fs.rmSync(dir, { recursive: true, force: true });
});

test('a project block naming an unknown publish mode is refused; a known one reaches the layout', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'publish-'));
  const doc = path.join(dir, 'design-system-context.md');
  fs.writeFileSync(doc, '# x\n\n```json project\n{ "name": "X", "publish": "everyone" }\n```\n');
  assert.ok(/names publish "everyone"/.test(contract.project(doc).error || ''));
  fs.writeFileSync(doc, '# x\n\n```json project\n{ "name": "X", "publish": "password" }\n```\n');
  assert.equal(contract.project(doc).publish, 'password');
  fs.writeFileSync(doc, '# x\n\n```json project\n{ "name": "X" }\n```\n');
  assert.equal(contract.project(doc).publish, null, 'absent: nothing is published');
  fs.rmSync(dir, { recursive: true, force: true });
});

test('figma-standard rule 11: the default marker legend is the project\'s own settings, not the house markers', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'legend-'));
  const doc = path.join(dir, 'design-system-context.md');
  const settings = { libraries: { K: { name: 'Lib', tokens: { statusMarker: '◐', finishedMarker: '●' } } } };
  fs.writeFileSync(doc, '# x\n\n```json project\n{ "name": "X" }\n```\n\n```json snapshot-routing\n{ "files": { "library": { "key": "K", "roles": ["components"] } } }\n```\n\n```json audit-settings\n' + JSON.stringify(settings) + '\n```\n');
  const p = contract.project(doc);
  assert.deepEqual([p.markers, p.done], [{ '◐': 'In progress', '●': 'Finished' }, ['●']]);
  assert.equal(contract.status('◐ Slider', p.markers).label, 'In progress');
  fs.writeFileSync(doc, '# x\n\n```json project\n{ "name": "X" }\n```\n');
  assert.deepEqual(contract.project(doc).markers, contract.MARKERS, 'a project with no settings reads the house legend');
  fs.rmSync(dir, { recursive: true, force: true });
});

test('snapshot-standard 17: the routing block gives each library its roles, and the audit reads them from there', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'roles-'));
  const doc = path.join(dir, 'design-system-context.md');
  const write = (files, settings = { libraries: {} }) => fs.writeFileSync(doc, '# x\n\n```json snapshot-routing\n' + JSON.stringify({ files }) + '\n```\n\n```json audit-settings\n' + JSON.stringify(settings) + '\n```\n');
  write({ library: [{ key: 'T', roles: ['tokens'] }, { key: 'C', roles: ['components'] }, { key: 'I', roles: ['icons'] }, { key: 'X' }] });
  const ctx = contract.auditContext(doc);
  assert.deepEqual(Object.keys(ctx.libraries), ['C'], 'only a components library is scanned');
  assert.equal(ctx.libraries.C.sourceLibrary, 'T', 'its variable source is the tokens library, never written by hand');
  assert.deepEqual(contract.auditRecords({ audit: dir, doc, files: { library: [{ key: 'T' }, { key: 'C' }, { key: 'I' }, { key: 'X' }] } }).map((r) => r.key), ['T', 'C', 'I'], 'every library with a role has a record; one without has none');
  write({ library: [{ key: 'C', roles: ['tokens', 'components'] }] }, { libraries: { Z: { name: 'Stray' } } });
  const stray = contract.auditContext(doc);
  assert.ok(!stray.ok && stray.errors.some((e) => /names Z/.test(e)), 'settings for a library the routing block does not route are an error');
  assert.equal(stray.libraries.C.sourceLibrary, 'C', 'a library that is its own variable source says so with two roles');
  write({ library: [{ key: 'A', roles: ['tokens'] }, { key: 'B', roles: ['tokens'] }, { key: 'C', roles: ['logo'] }] });
  const bad = contract.auditContext(doc).errors;
  assert.ok(bad.some((e) => /both have the role "tokens"/.test(e)) && bad.some((e) => /roles must be a list/.test(e)), bad.join('; '));
  fs.rmSync(dir, { recursive: true, force: true });
});

test('a setting a tool sets is written into its library alone, the rest of the document untouched', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'set-library-'));
  const doc = path.join(dir, 'design-system-context.md');
  fs.writeFileSync(doc, '# x\n\nProse stays.\n\n```json audit-settings\n' + JSON.stringify({ libraries: { A: { name: 'A' }, B: { name: 'B' } } }) + '\n```\n');
  contract.setLibrary(doc, 'A', (lib) => { lib.draw = { scratch: 'abcdefghij12' }; });
  const md = fs.readFileSync(doc, 'utf8');
  const s = JSON.parse(contract.fenced(md, 'audit-settings'));
  assert.deepEqual(s.libraries, { A: { name: 'A', draw: { scratch: 'abcdefghij12' } }, B: { name: 'B' } });
  assert.ok(md.includes('Prose stays.'));
  fs.writeFileSync(doc, '# x\n');
  assert.throws(() => contract.setLibrary(doc, 'A', () => {}), /no audit-settings block/, 'a document with no settings block is said, never invented');
  fs.rmSync(dir, { recursive: true, force: true });
});

test('the pinned check reads the routed screens file, not the first one stored (a project moved to a fresh file)', async () => {
  const { createRequire } = await import('node:module');
  const req = createRequire(import.meta.url);
  const { routedScreens } = req('./deliver.cjs'), contract = req('./projects.cjs');
  const index = { screens: { OLDID: { version: { id: 'old' } }, NEWID: { version: { id: 'new' } } } };
  assert.equal(routedScreens(index, { files: { screens: { key: 'NEWKEY', id: 'NEWID' } } }, contract).version.id, 'new');
  assert.equal(routedScreens(index, { files: { screens: { key: 'NONE' } } }, contract), null);
});

test('a project made from a library key is one every tool reads, and a taken label or key is refused', () => {
  const was = process.env.TOOLKIT_PROJECTS_ROOT;
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'snapshot-create-'));
  process.env.TOOLKIT_PROJECTS_ROOT = tmp;
  try {
    const KEY = 'NEWKEY0123456789';
    const made = contract.create('acme', { library: KEY, id: 'doc-acme-1' });
    assert.ok(made.doc && fs.existsSync(made.doc), 'its context document is written');
    const where = contract.layout(null, 'acme');
    assert.ok(!where.error, where.error);
    assert.equal(where.figmaKey, KEY, 'its library is the one named');
    assert.equal(contract.route(contract.projects().list, 'library', 'doc-acme-1').project.name, 'acme', 'and a snapshot of it routes there by the id the plugin stamps');
    assert.ok(contract.auditContext(made.doc).libraries[KEY], 'its settings have the library\'s entry to write to');
    assert.match(contract.create('acme', { library: 'OTHERKEY012345', id: 'doc-2' }).error, /home already/);
    assert.match(contract.create('other', { library: KEY, id: 'doc-2' }).error, /acme already claims/);
    assert.match(contract.create('other', { library: 'OTHERKEY012345', id: 'doc-acme-1' }).error, /acme already claims/);
    assert.match(contract.create('Bad Label', { library: KEY, id: 'doc-2' }).error, /lower case/);
    assert.match(contract.create('fine', { library: 'figma.com', id: 'doc-2' }).error, /not a Figma file key/);
    assert.match(contract.create('fine', { library: 'OTHERKEY012345', id: 'not an id!' }).error, /not a file id/);
    // the toolkit's own folder, reached through a link to the folder it sits in
    const main = path.resolve(HERE, '../..').replace(/[\\/]\.claude[\\/]worktrees[\\/][^\\/]+$/, '');
    const link = path.join(tmp, 'beside-the-toolkit');
    fs.symlinkSync(path.dirname(main), link);
    process.env.TOOLKIT_PROJECTS_ROOT = link;
    // no id, so the key stands for it: the folder check stops it before anything is written
    assert.match(contract.create(path.basename(main), { library: 'OTHERKEY012345' }).error, /toolkit's own folder/);
    process.env.TOOLKIT_PROJECTS_ROOT = tmp;
    fs.unlinkSync(link);
    // a project whose routing cannot be read may claim the file: nothing is made until it can be
    const broken = path.join(process.env.TOOLKIT_PROJECTS_ROOT, 'broken', 'figma-design-system');
    fs.mkdirSync(broken, { recursive: true });
    fs.writeFileSync(path.join(broken, 'design-system-context.md'), '```json snapshot-routing\n{ not json\n```\n');
    assert.match(contract.create('fine', { library: 'OTHERKEY012345', id: 'doc-2' }).error, /cannot be read/);
    assert.ok(!fs.existsSync(path.join(process.env.TOOLKIT_PROJECTS_ROOT, 'fine')), 'and no home is begun');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
    if (was === undefined) delete process.env.TOOLKIT_PROJECTS_ROOT; else process.env.TOOLKIT_PROJECTS_ROOT = was;
  }
});

test('a module that fails to load is answered, and the router stays up for the next snapshot', async () => {
  // a copy of the tools it loads, so the one being "edited" is not the toolkit's own
  const copy = fs.mkdtempSync(path.join(os.tmpdir(), 'router-copy-'));
  for (const d of ['snapshot', 'shared', 'component-contract']) fs.cpSync(path.join(HERE, '..', d), path.join(copy, 'tools', d), { recursive: true, filter: (f) => !f.includes('node_modules') });
  const { projectsDir } = two();
  const port = 9400 + Math.floor(Math.random() * 500);
  const server = spawn('node', [path.join(copy, 'tools', 'snapshot', 'router.mjs'), '--projects', projectsDir, '--port', String(port)], { stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, SNAPSHOT_QUIET: '1', TOOLKIT_PAIRING: PAIRING } });
  try {
    await new Promise((done, fail) => { let b = ''; server.stdout.on('data', (c) => { b += c; if (b.includes('In Figma')) done(); }); setTimeout(() => fail(new Error(b)), 8000); });
    const store = path.join(copy, 'tools', 'snapshot', 'projects.cjs');
    const was = fs.readFileSync(store, 'utf8');
    fs.appendFileSync(store, '\nthis is not javascript(\n');
    const at = `http://127.0.0.1:${port}`;
    assert.equal((await fetch(`${at}${paired('/library')}`, { method: 'POST', body: JSON.stringify(lib('IDB')) })).status, 500, 'a post is answered');
    assert.equal((await fetch(at)).status, 500, 'and so is the plugin\'s question');
    fs.writeFileSync(store, was);
    assert.equal((await fetch(at)).status, 200, 'and the router is still there once the module loads');
  } finally { server.kill(); fs.rmSync(copy, { recursive: true, force: true }); }
});

test('an icon is stored with its attributes sorted, so the app and the cloud write the same file', async () => {
  const { createRequire } = await import('node:module');
  const store = createRequire(import.meta.url)('./store.cjs');
  const app = '<svg width="16" height="16" fill="none">\n<path d="M0 0" fill-rule="evenodd" fill="#123456"/>\n</svg>';
  const cloud = '<svg width="16" height="16" fill="none">\n<path fill-rule="evenodd" fill="#123456" d="M0 0"/>\n</svg>';
  assert.equal(store.attrsOrdered(app), store.attrsOrdered(cloud));
  assert.equal(store.attrsOrdered(app), '<svg fill="none" height="16" width="16">\n<path d="M0 0" fill-rule="evenodd" fill="#123456"/>\n</svg>');
});
