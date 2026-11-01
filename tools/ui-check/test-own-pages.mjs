#!/usr/bin/env node
// node tools/ui-check/test-own-pages.mjs — axe over the toolkit's own pages: every page of the docs site
// (the dashboard is its Audits page) as tools/figma-audit/server.mjs builds and serves it, and the contract
// editor (tools/contract-editor/serve.mjs) empty and on a component's three tabs. Fails on a serious or
// critical violation; moderate and minor ones are listed, not failed.
//
// No project's data: the project is the contract editor's sample library (tools/contract-editor/sample,
// made up), copied into a projects root of the run's own, with what the docs site needs beside it — a
// figma.json per component made from its contract, the text styles' bindings (none), and the audit record
// fixture (tools/figma-audit/fixtures/queue-record.json) under the sample's key, so the dashboard has rows.
// Skips (exit 77) without Chrome or without the docs site's packages (pnpm install in tools/docs-site).
// Light mode at the browser's default width; dark mode and phone width are not checked.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { axePages } from './axe.mjs';
import { findChrome } from '../shared/cdp.mjs';
import { onFreePort } from '../shared/free-port.mjs'; // every interface: figma-console's bridge holds one of these ports on ::1

const HERE = path.dirname(fileURLToPath(import.meta.url));
const TOOLS = path.join(HERE, '..');
if (!fs.existsSync(findChrome())) { console.log(`skip: no Chrome at ${findChrome()}; nothing ran`); process.exit(77); }
if (!fs.existsSync(path.join(TOOLS, 'docs-site', 'node_modules', 'astro', 'package.json'))) { console.log('skip: no Astro in tools/docs-site (pnpm install --frozen-lockfile there); nothing ran'); process.exit(77); }

let n = 0;
const ok = (name, cond, why = '') => { n++; assert.ok(cond, `${name}${why ? `\n${why}` : ''}`); console.log('ok', name); };

// the fixture project
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ui-own-pages-'));
const KEY = 'SAMPLEKEY000000';
const home = path.join(root, 'sample', 'figma-design-system');
const snap = path.join(home, 'snapshot');
fs.cpSync(path.join(TOOLS, 'contract-editor', 'sample'), snap, { recursive: true, filter: (f) => path.basename(f) !== '.DS_Store' });
const block = (tag, v) => '```json ' + tag + '\n' + JSON.stringify(v, null, 2) + '\n```\n';
fs.writeFileSync(path.join(home, 'design-system-context.md'), '# Sample\n\n' + block('snapshot-routing', { files: { library: { key: KEY, id: 'fsample', roles: ['components', 'tokens'] } } }) + '\n' + block('audit-settings', { libraries: { [KEY]: {} } }));
const tokensFile = path.join(snap, 'tokens.json');
const tokens = JSON.parse(fs.readFileSync(tokensFile, 'utf8'));
for (const t of tokens.textStyles || []) t.bound ||= {};
fs.writeFileSync(tokensFile, JSON.stringify(tokens, null, 2));
const comps = path.join(snap, 'components');
for (const folder of fs.readdirSync(comps)) {
  const c = path.join(comps, folder, 'contract.json');
  if (!fs.existsSync(c)) continue;
  const { figma } = JSON.parse(fs.readFileSync(c, 'utf8'));
  fs.writeFileSync(path.join(comps, folder, 'figma.json'), JSON.stringify({ name: figma.name, id: figma.id, key: figma.key, page: `❖ ${figma.name.replace(/^_/, '')}`, description: `${figma.name}, a component of the sample library.` }, null, 2));
}
fs.mkdirSync(path.join(home, 'audit'));
fs.writeFileSync(path.join(home, 'audit', `${KEY}.json`), fs.readFileSync(path.join(TOOLS, 'figma-audit', 'fixtures', 'queue-record.json'), 'utf8').replaceAll('LIBKEY', KEY));

const children = [];
process.on('exit', () => { for (const c of children) c.kill(); fs.rmSync(root, { recursive: true, force: true }); });
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => process.exit(130));
// DOCS_WATCH_ENGINE=0: the site is built once from the engine as it is now; another session editing the engine
// would otherwise rebuild it and swap it in mid-run, and a page asked for between the two renames is the service's
// "being built" note, with no title or lang
const env = { ...process.env, DOCS_WATCH_ENGINE: '0', ANTHROPIC_API_KEY: '', TOOLKIT_PROJECTS_ROOT: root, TOOLKIT_UNCLAIMED: path.join(root, 'unclaimed') }; // projects-path: the run's own root
const start = (args, ready) => new Promise((resolve, reject) => {
  const c = spawn(process.execPath, args, { stdio: ['ignore', 'pipe', 'pipe'], env });
  children.push(c);
  let log = '';
  const read = (d) => { log += d; let m; try { m = ready(log); } catch (e) { reject(e); return; } if (m) resolve({ match: m, log: () => log }); };
  c.stdout.on('data', read); c.stderr.on('data', read);
  c.once('exit', (code) => reject(new Error(`${path.basename(args[0])} exited ${code}:\n${log.slice(-1500)}`)));
});

// the dashboard service, on a free port of the range the bridge scans (it insists on one)
// the first free port the service can bind; one taken between the probe and the bind moves to the next
const up = await onFreePort([9223, 9224, 9225, 9226, 9227, 9228, 9229, 9230, 9231, 9232], (p) =>
  // built on start (the engine's lock can make it wait for another project's build); a failed build is said, never waited on
  start([path.join(TOOLS, 'figma-audit', 'server.mjs'), '--data', path.join(home, 'audit'), '--port', String(p), '--key-file', path.join(root, 'no-key')],
    (l) => { if (/sample build failed/.test(l)) throw new Error(`the docs site did not build for the sample library:\n${l.slice(-2000)}`); return /docs site +sample built in/.test(l); }));
const svc = up && up.value, PORT = up && up.port;
if (!svc) { console.log('skip: every port the bridge scans (9223–9232) is taken, so the dashboard cannot be served here; nothing ran'); process.exit(77); }
const site = path.join(home, 'site');
ok('the docs site builds for the sample library', fs.existsSync(path.join(site, 'index.html')), svc.log());

const editor = await start([path.join(TOOLS, 'contract-editor', 'serve.mjs'), '--port', '0', '--no-router', '--project', 'sample'], (l) => (l.match(/http:\/\/localhost:\d+\//) || [])[0]);

// every page the site built, as the service serves it
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
const pages = walk(site).filter((f) => f.endsWith('index.html')).map((f) => path.relative(site, path.dirname(f)).split(path.sep).join('/')).sort();
ok('the dashboard is among them, as the Audits page', pages.includes('audits'));
const SITE = `http://127.0.0.1:${PORT}/`; // the address the service listens on, by its own name for it
const urls = [...pages.map((p) => SITE + (p ? p + '/' : '')), SITE + 'no-such-page/',
  editor.match, `${editor.match}?component=Button`, `${editor.match}?component=Button&tab=anatomy`, `${editor.match}?component=Button&tab=variants`];

// each address answers with the site's own page, so a clean run is about these pages and not another server's
const served = await Promise.all(pages.map(async (p) => { const r = await fetch(SITE + (p ? p + '/' : '')); const t = await r.text(); return { p, good: r.status === 200 && /<html lang="[^"]+"/.test(t) && /<title>[^<]*sample<\/title>/i.test(t) }; }));
ok(`the service serves each of the ${pages.length} built pages, the site's own`, served.every((x) => x.good), served.filter((x) => !x.good).map((x) => x.p || '/').join(', '));

// a page of the run's own that breaks a rule axe calls critical: a run that reads no violation at all would pass every page
const broken = path.join(root, 'broken.html');
fs.writeFileSync(broken, '<!doctype html><html lang="en"><title>Broken</title><main><h1>Broken</h1><img src="x.png"></main></html>');
const [control, ...results] = await axePages(['file://' + broken, ...urls]);
ok('the control page with an image and no alt is a serious or critical violation, so the check can fail', (control.violations || []).some((v) => v.id === 'image-alt' && ['serious', 'critical'].includes(v.impact)));
const failed = results.filter((r) => r.error || !Array.isArray(r.violations));
ok(`all ${urls.length} pages were checked`, failed.length === 0, failed.map((r) => `${r.url}: ${r.error}`).join('\n'));
const SEVERE = new Set(['serious', 'critical']);
const said = (r, list) => list.map((v) => `  ${r.url.replace(/^http:\/\/(localhost|127\.0\.0\.1):\d+/, '')}  ${v.impact} ${v.id}: ${v.help}\n    ${v.targets.slice(0, 4).join('\n    ')}${v.targets.length > 4 ? `\n    … and ${v.targets.length - 4} more` : ''}`).join('\n');
const split = (keep) => results.filter((r) => r.violations).map((r) => [r, r.violations.filter((v) => keep(SEVERE.has(v.impact)))]).filter(([, v]) => v.length);
for (const [r, v] of split((s) => !s)) console.log(`note: ${said(r, v).trimStart()}`);
const severe = split((s) => s);
ok('no serious or critical WCAG A/AA violation on the docs site, the dashboard or the editor', severe.length === 0, severe.map(([r, v]) => said(r, v)).join('\n'));
ok('the site was built once and not rebuilt under the run (the engine is not watched)', (svc.log().match(/sample built in/g) || []).length === 1 && /DOCS_WATCH_ENGINE=0, so a change to the docs engine/.test(svc.log()), svc.log());
console.log(`${n}/${n} passed (${urls.length} pages)`);
process.exit(0);
