#!/usr/bin/env node
/*
 * A project's audit from a session, with no API key: the dashboard's Audit runs
 * the same scanners and then asks the Claude judge; here the session judges.
 *
 *   bin/audit <project> [fileKey]          scan through the project's service, write the payload
 *   bin/audit --file <payload> [--write]   show what filing it would add, update and close; --write files it
 *
 * Step one runs the stages the audit's one list gives a session
 * (skills/figma-project-audit/scripts/stages.json), through the loop every runner
 * shares (stages.mjs runStages: its order, its applicability rule, a stage
 * that fails stopping only itself), through the project's own service
 * (POST /exec), and writes one payload per stage that ran, every candidate a
 * finding. A stage that stopped is named on stderr and the run exits 1, the
 * payload still written for the stages that ran. The session judges it: a finding it drops moves to
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
import { bucketFor, gatherCode, gatherTimeout, runStages, stoppedLines } from './stages.mjs';
import { lucideVersion } from './lucide.mjs';

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
const exec = (port, fileKey, code, ms) => figmaExec({ port }, fileKey, code, ms);

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
    for (const p of stages) { const r = await call(port, '/rows', Object.assign({}, p, { dryRun: true })); console.log(`${p.owner}${p.target ? ' ' + p.target : ''}: would add ${r.added}, update ${r.updated}, reopen ${r.reopened}, close ${r.closed}`); }
    console.log('dry run: nothing written; add --write to file it');
    process.exit(0);
  }
  // Both stages are dry-run again first, so a stage the writer refuses stops the filing before anything lands.
  for (const p of stages) await call(port, '/rows', Object.assign({}, p, { dryRun: true }));
  let found = 0, cleared = 0;
  for (const p of stages) { const r = await call(port, '/rows', p); found += r.added + r.reopened; cleared += r.closed; console.log(`${p.owner}${p.target ? ' ' + p.target : ''}: added ${r.added}, updated ${r.updated}, reopened ${r.reopened}, closed ${r.closed}`); }
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
// Every candidate carries its own fix in `advice` (both scanners' suites assert it); a stock sentence
// here would put the same words on every row and hide a check that shipped without one.
const findings = (s, stage, rulesFile = null) => s.audited.flatMap((e) => e.candidates.map((c) => {
  if (!c.advice) throw new Error(`a ${c.rule} candidate (${c.key}) carries no advice; the scanner that raised it needs its fix written`);
  return { where: e.set, node: e.id || null, check: c.text, key: c.key, rule: c.rule, bucket: bucketFor(stage, c.rule, { rulesFile }),
    sev: c.sev === 'error' ? 'error' : c.sev === 'preference' ? 'pref' : 'warn', fix: [c.text], rec: [c.advice] };
}));
// The project record says who uses this file's tokens: liveChecks runs the unused-tokens check on its own bindings only
// where it is their only user (library.mjs selfUsedOf); otherwise the snapshot watch, which reads every components library, runs it.
const records = contract.auditRecords(where);
// The tokens and icons stages share one read of the file (the snapshot plugin's facts mode) and one run of the checks,
// made when the first of them asks; the dashboard's timeout for it. A read that fails stops those two stages only.
let library = null;
const readLibrary = (stage) => library || (library = (async () => {
  const facts = await exec(port, fileKey, gatherCode(stage, read(stage.gather.script)), gatherTimeout(stage));
  if (!facts || !facts.tokens) throw new Error('the facts read answered, but not with the file\'s tokens; is the snapshot plugin current?');
  if (facts.fileKey && facts.fileKey !== fileKey) throw new Error(`that read ${facts.fileName || 'another file'}, not ${lib.name}`);
  const L = await import(path.join(TOOLKIT, stage.checks.script));
  const { slug } = createRequire(import.meta.url)('../snapshot/spec.cjs');
  const set = ((ctx.icons || {})[fileKey] || {}).names;
  return { applies: L.liveApplies(facts), out: L[stage.checks.call](facts, fileKey, { names: set ? await L.iconSetNames(set, lucideVersion()) : null, slug, selfUsed: L.selfUsedOf(records, fileKey) }) };
})());
// Whether the file has components at all (stages.json `applies`, the fact Audit lite reads the same way), asked once.
let hasComponents = null;
// It loads every page, so it waits as long as the stage it decides.
const componentSets = (stage) => hasComponents || (hasComponents = exec(port, fileKey,
  "await figma.loadAllPagesAsync(); return figma.root.findAllWithCriteria({ types: ['COMPONENT_SET', 'COMPONENT'] }).length > 0;", gatherTimeout(stage)).then((r) => r === true));
// The facts appliesTo reads for a stage: only the one its `applies` names, read when that stage comes up.
const factsFor = async (stage) => {
  const fact = (stage.applies || {}).fact;
  if (fact === 'componentSets') return { componentSets: await componentSets(stage) };
  if (fact === 'tokens' || fact === 'icons') return (await readLibrary(stage)).applies;
  return {};
};
const base = { fileKey, origin: 'session-audit', full: true, exhaustive: true, language: ctx.language };
const stages = [];
const file = (stage, p) => stages.push(Object.assign({}, base, { owner: stage.owner }, p));
let scan = null;
// One handler per stage the registry gives a session, keyed by its id (skills/figma-project-audit/tests/test-stages.mjs);
// runStages (stages.mjs) runs them in the registry's order, as the dashboard and Audit lite do.
const HANDLERS = {
  // The closing scope is every component the script reached, never only the ones with candidates:
  // with `exhaustive`, a row on a component outside the scope closes as renamed or removed.
  foundations: async (stage) => {
    const fnd = await exec(port, fileKey, gatherCode(stage, read(stage.gather.script), { TOKENS: lib.tokens }), gatherTimeout(stage));
    if (!fnd || !fnd.reach) throw new Error('the foundations script returned no reach, so nothing it closes can be scoped; is it current?');
    file(stage, { scope: fnd.reach, ran: fnd.ran, findings: findings(fnd, stage) });
  },
  components: async (stage) => {
    scan = await exec(port, fileKey, gatherCode(stage, read(stage.gather.script), { TARGETS: [], SCALES: lib.optionOrder, TOKENS: lib.tokens }), gatherTimeout(stage));
    if (!scan || !scan.audited) throw new Error('the components scanner answered, but not with a scan');
    file(stage, { scope: scan.audited.map((e) => e.set), ran: scan.ran, findings: findings(scan, stage, JSON.parse(read(stage.buckets.from))),
      ...(!scan.measures && { full: false, exhaustive: false }) });
  },
  tokens: (stage) => libraryStage(stage),
  icons: (stage) => libraryStage(stage),
};
async function libraryStage(stage) {
  const out = (await readLibrary(stage)).out[stage.checks.result];
  // nothing to read (an icon page with no icons): an empty full run would close rows, so it files nothing
  if (!out || !out.ran.length) return 'empty';
  file(stage, { target: stage.target, scope: out.scope, ran: out.ran, findings: out.findings.map((f) => Object.assign({}, f, { bucket: bucketFor(stage, f.rule, { own: f.bucket }) })) });
}
const ran = await runStages(JSON.parse(read('skills/figma-project-audit/scripts/stages.json')), 'session', HANDLERS, { facts: factsFor, settings: lib });
const out = path.join(os.tmpdir(), `audit-${project}-${fileKey}.json`);
fs.writeFileSync(out, JSON.stringify({ project, fileKey, at: new Date().toISOString(), measures: (scan && scan.measures) || null, stages }, null, 2));
const WHY = { 'n/a': 'does not apply to this file', empty: 'nothing here to check' };
const notRun = ran.filter((r) => r.status !== 'ran');
console.log(`${lib.name}: ${stages.map((p) => `${p.findings.length} ${p.target || p.owner}`).join(', ') || 'no stage filed'} candidates → ${out}${notRun.length ? ` (${notRun.map((r) => `${r.label}: ${WHY[r.status] || r.status + (r.why ? ' — ' + r.why : '')}`).join('; ')})` : ''}`);
// a setting the scanner ignored as invalid: its on/off-scale verdict did not run, which no finding shows
if (scan && Array.isArray(scan.settings) && scan.settings.length) console.log(`settings the scanner ignored: ${scan.settings.join('; ')} — fix them in the context document`);
console.log('judge them: move a finding the project has ruled on, or that is wrong, into that stage\'s `dismissed` with a `why`; then bin/audit --file ' + out);
// a stage that stopped: the payload above holds the rest, but the run is not whole, so a scripted caller is told (exit 1)
const stopped = stoppedLines(ran);
if (stopped.length) { for (const l of stopped) console.error(l); process.exitCode = 1; }
