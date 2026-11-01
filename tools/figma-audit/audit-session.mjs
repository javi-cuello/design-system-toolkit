#!/usr/bin/env node
/*
 * A project's audit from a session, with no API key: the dashboard's Audit runs
 * the same scanners and then asks the Claude judge; here the session judges.
 *
 *   bin/audit <project> [fileKey]          scan through the project's service, write the payload
 *   bin/audit --file <payload> [--write]   show what filing it would add, update and close; --write files it
 *
 * Step one runs the components scanner and the foundations script through the
 * project's own service (POST /exec) and writes one payload per stage, every
 * candidate a finding. The session judges it: a finding it drops moves to
 * `dismissed` with its reason. Step two runs the record's one writer on a copy
 * first and names every row it would close, since closing is what loses
 * information; only --write sends it to the service's POST /rows.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { serviceFor, call as serve, figmaExec } from './services.mjs';
import { applyRows, isOpen } from './rows.mjs';

const TOOLKIT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const contract = createRequire(import.meta.url)('../snapshot/projects.cjs');
const die = (m) => { console.error(m); process.exit(2); };
// a refused call (a file to reopen, a service gone) is its message, not a stack trace
process.on('uncaughtException', (e) => die(e && e.message || e));
const args = process.argv.slice(2);

function serviceOf(project) {
  const data = contract.layout(null, project).audit;
  const s = serviceFor(data);
  if (!s) die(`no dashboard service is serving ${project}; start it (install.sh loads them) and open the plugin in Figma`);
  return { port: s.port, data };
}
const call = (port, route, body) => serve({ port }, route, body);
const exec = (port, fileKey, code) => figmaExec({ port }, fileKey, code, 240000);

if (args[0] === '--file') {
  const file = args[1]; if (!file || !fs.existsSync(file)) die('usage: bin/audit --file <payload> [--write]');
  const { project, fileKey, stages, at, measures } = JSON.parse(fs.readFileSync(file, 'utf8'));
  // A scan is a reading of the file at one moment; filed later, it closes rows a newer audit raised.
  if (!at || Date.now() - Date.parse(at) > 60 * 60 * 1000) die(`this payload was scanned ${at ? 'at ' + at : 'at an unknown time'}, over an hour ago; scan again with bin/audit ${project} ${fileKey}`);
  const { port, data } = serviceOf(project);
  const record = JSON.parse(fs.readFileSync(path.join(data, fileKey + '.json'), 'utf8'));
  const before = JSON.parse(JSON.stringify(record.rows || {}));
  const copy = JSON.parse(JSON.stringify(record));
  for (const p of stages) applyRows(copy, Object.assign({}, p, { dryRun: false }));
  for (const [id, r] of Object.entries(copy.rows)) if (before[id] && isOpen(before[id]) && !isOpen(r)) console.log(`would close: ${r.where} | ${(r.check || '').slice(0, 80)}`);
  if (!args.includes('--write')) {
    for (const p of stages) { const r = await call(port, '/rows', Object.assign({}, p, { dryRun: true })); console.log(`${p.owner}: would add ${r.added}, update ${r.updated}, reopen ${r.reopened}, close ${r.closed}`); }
    console.log('dry run: nothing written; add --write to file it');
    process.exit(0);
  }
  // Both stages are dry-run again first, so a stage the writer refuses stops the filing before anything lands.
  for (const p of stages) await call(port, '/rows', Object.assign({}, p, { dryRun: true }));
  let found = 0, cleared = 0;
  for (const p of stages) { const r = await call(port, '/rows', p); found += r.added + r.reopened; cleared += r.closed; console.log(`${p.owner}: added ${r.added}, updated ${r.updated}, reopened ${r.reopened}, closed ${r.closed}`); }
  // What the page's audit writes besides rows (tools/docs-site/src/dashboard/audit.js, recordMeasures and
  // recordRun): the library's measures and a run. Without them a session audit filed its rows while the
  // site went on saying "checked at the next full audit". A partial scan has no measures and leaves both.
  if (measures) {
    const rows = Object.values((await call(port, `/data?lib=${fileKey}`)).rows || {});
    const open = rows.filter(isOpen).length;
    const now = new Date().toISOString();
    const metrics = Object.fromEntries(Object.entries(measures).filter(([, v]) => v !== null && v !== undefined));
    await call(port, '/patch', { lib: fileKey, path: `libraries.${fileKey}`, value: { metrics: Object.assign(metrics, { totalFindings: rows.length, openFindings: open }), lastRunAt: now } });
    const id = now.slice(0, 10) + '-session-' + now.slice(11, 19).replace(/:/g, '');
    await call(port, '/patch', { lib: fileKey, path: `runs.${id}`, value: { fileKey, at: now, kind: 'audit', via: 'session', trigger: 'full',
      coverage: measures.coverage, sets: measures.sets, variants: measures.variants, variables: measures.variables, open, found, cleared,
      scope: `Session audit of ${measures.sets} components.`, note: `Judged in session, no API key: ${stages.reduce((n, p) => n + p.findings.length, 0)} kept, ${stages.reduce((n, p) => n + (p.dismissed || []).length, 0)} dismissed.` } });
    console.log(`measures and run ${id} recorded`);
  }
  process.exit(0);
}

const [project, keyArg] = args;
if (!project) die('usage: bin/audit <project> [fileKey]   |   bin/audit --file <payload> [--write]');
const where = contract.layout(null, project);
if (!where || !where.doc) die(contract.notFound(project));
const ctx = contract.auditContext(where.doc);
if (!ctx.ok) die(ctx.errors.join('\n'));
const keys = Object.keys(ctx.libraries);
const fileKey = keyArg || (keys.length === 1 ? keys[0] : null);
if (!fileKey || !ctx.libraries[fileKey]) die(`name the library: ${keys.map((k) => `${k} (${ctx.libraries[k].name})`).join(', ')}`);
const lib = ctx.libraries[fileKey];
const { port } = serviceOf(project);
const status = await call(port, '/status');
if (!(status.files || []).some((f) => f.fileKey === fileKey)) die(`${lib.name} is not open on the bridge (port ${port}); open it in Figma with the plugin running`);

const read = (rel) => fs.readFileSync(path.join(TOOLKIT, rel), 'utf8');
const pre = (o) => Object.entries(o).map(([k, v]) => `const ${k} = ${JSON.stringify(v)};\n`).join('');
const scan = await exec(port, fileKey, pre({ TARGETS: [], SCALES: lib.optionOrder, TOKENS: lib.tokens }) + read('skills/figma-components-audit/scanner/audit.js'));
const fnd = await exec(port, fileKey, pre({ TOKENS: lib.tokens }) + read('skills/figma-foundations-audit/scripts/foundations.js'));
const B = JSON.parse(read('skills/figma-components-audit/scanner/buckets.json'));
const bucketOf = Object.fromEntries(['b1', 'b2', 'b3'].flatMap((b) => (B[b] || []).map((r) => [r, b])));
// Buckets as the page files them: the components scanner's from its buckets.json; the file-level
// stage's page order first and the rest third (tools/docs-site/src/dashboard/audit.js, the foundations stage).
// Every candidate carries its own fix in `advice` (both scanners' suites assert it); a stock sentence
// here would put the same words on every row and hide a check that shipped without one.
const findings = (s, bucket) => s.audited.flatMap((e) => e.candidates.map((c) => {
  if (!c.advice) die(`a ${c.rule} candidate (${c.key}) carries no advice; the scanner that raised it needs its fix written`);
  return { where: e.set, node: e.id || null, check: c.text, key: c.key, rule: c.rule, bucket: bucket(c.rule),
    sev: c.sev === 'error' ? 'error' : c.sev === 'preference' ? 'pref' : 'warn', fix: [c.text], rec: [c.advice] };
}));
const base = { fileKey, origin: 'session-audit', full: true, exhaustive: true, language: ctx.language };
const stages = [
  Object.assign({}, base, { owner: 'figma-components-audit', scope: scan.audited.map((e) => e.set), ran: scan.ran, findings: findings(scan, (r) => bucketOf[r] || B._default || 'b3') }),
  // The closing scope is every component the script reached, never only the ones with candidates:
  // with `exhaustive`, a row on a component outside the scope closes as renamed or removed.
  Object.assign({}, base, { owner: 'figma-foundations-audit', scope: fnd.reach || [], ran: fnd.ran, findings: findings(fnd, (r) => (r === 'page-order' ? 'b1' : 'b3')) }),
];
if (!fnd.reach) die('the foundations script returned no reach, so nothing it closes can be scoped; is it current?');
if (!scan.measures) { stages[0].full = false; stages[0].exhaustive = false; }
const out = path.join(os.tmpdir(), `audit-${project}-${fileKey}.json`);
fs.writeFileSync(out, JSON.stringify({ project, fileKey, at: new Date().toISOString(), measures: scan.measures || null, stages }, null, 2));
console.log(`${lib.name}: ${stages[0].findings.length} component and ${stages[1].findings.length} file candidates → ${out}`);
console.log('judge them: move a finding the project has ruled on, or that is wrong, into that stage\'s `dismissed` with a `why`; then bin/audit --file ' + out);
