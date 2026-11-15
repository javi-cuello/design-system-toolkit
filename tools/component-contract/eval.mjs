#!/usr/bin/env node
/*
 * The pipeline held to its goal, end to end: a component that goes from Figma to code, or to Figma and back, comes back
 * the same contract. Each official contract (official.mjs) is compared by value (to-figma's roundTrip: every combination
 * the library draws, expanded from both sides) with
 *
 *   browser  the contract from-code read off the code as it renders (parity/from-code/<component>.json, kept by
 *            from-code: a run that reads the same writes nothing)
 *   self     the contract from-code read off the toolkit's own rendering of the contract (from-code --self: to-markup's
 *            web component and to-code's sheet, no project code; <home>/round-trip/self/from-code/<component>.json,
 *            written by --self). What differs here is the toolkit's loss; what differs only in browser is the project's
 *   figma    the contract read back from to-figma's drawing of it by the snapshot's walk and derive
 *            (<home>/round-trip/<component>.roundtrip.json, written by --draw)
 *
 * and the differing rows are counted per component and per field. The counts accepted are stored
 * (<home>/round-trip/accepted.json); --check fails where a count rose, or a reading went, against them, and --accept
 * stores the present ones. A count only falls by a fix: the difference is a battery case first (test-battery.mjs),
 * then a row of the translation table (rules.mjs), then the count drops and is accepted.
 *
 *   node tools/component-contract/eval.mjs --project <label> [--fields] [--check | --accept]
 *   node tools/component-contract/eval.mjs --project <label> --draw <scratch fileKey> [components…]
 *   node tools/component-contract/eval.mjs --project <label> --self [--twice] [components…]
 *   node tools/component-contract/eval.mjs --project <label> --causes
 *
 * Each leg says how many components came back the same of all, how many were measured, and its rows folded to causes (a
 * part missing or extra is one cause at its root, `causes`); a reading taken of another contract than today's, or kept
 * from an earlier drawing, is stale and said (taken.json). --twice reads the self leg twice and fails where a reading
 * differs: a measure is trusted only where it repeats.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { contracts } from './official.mjs';
import { roundTrip } from './to-figma.mjs';

const req = createRequire(import.meta.url);
const HERE = path.dirname(fileURLToPath(import.meta.url));

/* A row's field, with the element said as * (a field that differs in many elements is one cause). */
export const fieldOf = (at) => (at.includes('.') ? `*.${at.split('.').slice(1).join('.')}` : at).replace(/\.\d+(?=\.|$)/g, '.N');

/* A contract's fingerprint: a reading taken of another is stale. */
export const hashOf = (contract) => createHash('sha1').update(JSON.stringify(contract)).digest('hex').slice(0, 12);
/* When each reading was taken, of which contract: <home>/round-trip/taken.json, { self|figma: { <component>: { hash, kept? } } }. */
const takenFile = (home) => path.join(home, 'round-trip', 'taken.json');
const readTaken = (home) => { try { return JSON.parse(fs.readFileSync(takenFile(home), 'utf8')); } catch { return {}; } };
function noteTaken(home, leg, folder, contract, kept = false) {
  const t = readTaken(home);
  t[leg] = { ...(t[leg] || {}), [folder]: kept && t[leg] && t[leg][folder] ? { ...t[leg][folder], kept: true } : { hash: hashOf(contract), ...(kept && { kept: true }) } };
  // written whole and renamed into place, so a reader never meets half a file (two runs at once can still lose one entry,
  // which then reads stale: the safe side)
  fs.mkdirSync(path.dirname(takenFile(home)), { recursive: true });
  const tmp = `${takenFile(home)}.${process.pid}`;
  fs.writeFileSync(tmp, JSON.stringify(t, null, 2) + '\n');
  fs.renameSync(tmp, takenFile(home));
}

/* The rows folded to their causes: a part missing or extra on one side in every combination compared is one cause at the
   shallowest such part, every row inside it (its children, its fields) folded into it; any other row is its own, a part
   missing in only some combinations included (its field rows come from the others, and are causes of their own). Rows
   are merged across combinations, `in` saying how many. { cause: rows }. */
export function causes(rows, combinations) {
  const gone = rows.filter((r) => !r.at.includes('.') && r.at !== 'props' && (r.library == null || r.drawn == null));
  const inAll = (at) => combinations == null || gone.filter((r) => r.at === at).reduce((a, r) => a + (r.in || 1), 0) >= combinations;
  const whole = new Set(gone.map((r) => r.at).filter(inAll));
  const out = {};
  for (const r of rows) {
    const el = r.at.split('.')[0], segs = el.split('/');
    let root = null;
    for (let i = 1; i <= segs.length && !root; i++) if (whole.has(segs.slice(0, i).join('/'))) root = segs.slice(0, i).join('/');
    const key = root ? `${root} (${gone.find((x) => x.at === root).library == null ? 'extra' : 'missing'})` : r.at;
    out[key] = (out[key] || 0) + 1;
  }
  return out;
}

/* Every leg for one project: { home, legs: { browser, self, figma } }, each leg { <component>: { rows, combinations, cut? } | { skipped } }. */
export function measure(where) {
  const home = where.projectDir;
  const readings = path.join(home, 'parity', 'from-code');
  const drawn = path.join(home, 'round-trip');
  const read = (f) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return null; } };
  const legs = { browser: {}, self: {}, figma: {} };
  const taken = readTaken(home);
  // a reading of another contract than today's, or one kept when its drawing went unanswered, is stale: measured, said apart
  const stale = (leg, folder, contract) => { const t = (taken[leg] || {})[folder]; return !t ? 'taken before readings were fingerprinted' : t.kept ? 'kept from an earlier drawing (an import went unanswered)' : t.hash !== hashOf(contract) ? 'its contract changed since' : null; };
  // each component by its name, as the pipeline resolves it, for what an instance of it draws at its defaults
  const mains = req('./derive.cjs').byComponentName(contracts(where).map(({ contract }) => contract));
  const selfDir = path.join(drawn, 'self', 'from-code');
  for (const { folder, contract } of contracts(where)) {
    const code = read(path.join(readings, `${folder}.json`));
    if (!code || !code.asFigma) legs.browser[folder] = { skipped: 'no reading from code (from-code.mjs has not read it)' };
    else { const r = roundTrip(contract, code.asFigma, { mains }); legs.browser[folder] = { rows: r.rows, combinations: r.combinations, ...(r.cut && { cut: r.cut }) }; }
    const own = read(path.join(selfDir, `${folder}.json`));
    if (!own || !own.asFigma) legs.self[folder] = { skipped: 'not read from the toolkit\'s own rendering (eval.mjs --self)' };
    else { const r = roundTrip(contract, own.asFigma, { mains }), st = stale('self', folder, contract); legs.self[folder] = { rows: r.rows, combinations: r.combinations, ...(r.cut && { cut: r.cut }), ...(st && { stale: st }) }; }
    const back = read(path.join(drawn, `${folder}.roundtrip.json`));
    const st = back && stale('figma', folder, contract);
    legs.figma[folder] = back ? { rows: back.rows, combinations: back.combinations, ...(back.cut && { cut: back.cut }), ...(st && { stale: st }) } : { skipped: 'not drawn and read back (eval.mjs --draw)' };
  }
  return { home, legs };
}

/* The counts a measure stands at, and what rose or went against the accepted ones. */
export const counts = (legs) => Object.fromEntries(Object.entries(legs).map(([leg, cs]) => [leg, Object.fromEntries(Object.entries(cs).filter(([, x]) => x.rows).map(([c, x]) => [c, x.rows.length]))]));
export function worse(now, accepted) {
  const out = [];
  for (const [leg, cs] of Object.entries(accepted || {})) for (const [c, n] of Object.entries(cs)) {
    const m = (now[leg] || {})[c];
    if (m === undefined) out.push(`${leg} ${c}: accepted at ${n}, now not measured`);
    else if (m > n) out.push(`${leg} ${c}: ${n} → ${m}`);
  }
  // a component measured since the accept is held from its first count: accepted once, with what its rows say
  for (const [leg, cs] of Object.entries(now)) for (const [c, m] of Object.entries(cs)) if (m > 0 && ((accepted || {})[leg] || {})[c] === undefined) out.push(`${leg} ${c}: newly measured at ${m}, not accepted yet`);
  return out;
}

function report(label, { legs }, fields, byCause) {
  for (const [leg, cs] of Object.entries(legs)) {
    const m = Object.entries(cs).filter(([, x]) => x.rows), skipped = Object.entries(cs).filter(([, x]) => x.skipped);
    const rows = m.flatMap(([, x]) => x.rows);
    const all = Object.keys(cs).length, old = m.filter(([, x]) => x.stale), nc = m.reduce((a, [, x]) => a + Object.keys(causes(x.rows, x.combinations)).length, 0);
    console.log(`${label} ${leg}: ${m.filter(([, x]) => !x.rows.length).length} of ${all} the same; measured ${m.length} of ${all}; ${nc} causes, ${rows.length} differing rows${old.length ? `; ${old.length} stale (${[...new Set(old.map(([, x]) => x.stale))].join('; ')})` : ''}${skipped.length ? `; ${skipped.length} not measured (${[...new Set(skipped.map(([, x]) => x.skipped))].join('; ')})` : ''}`);
    for (const [c, x] of m) if (x.cut) console.log(`  ${c}: ${x.cut} combination(s) past the first ${x.combinations} not compared`);
    if (byCause) for (const [c, k, n] of m.flatMap(([c, x]) => Object.entries(causes(x.rows, x.combinations)).map(([k, n]) => [c, k, n])).sort((a, b) => b[2] - a[2])) console.log(`  ${String(n).padStart(4)}  ${c}: ${k}`);
    if (!fields) continue;
    const by = {};
    for (const r of rows) by[fieldOf(r.at)] = (by[fieldOf(r.at)] || 0) + 1;
    for (const [f, n] of Object.entries(by).sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(4)}  ${f}`);
  }
}

/* contract → to-figma → the scratch file → the snapshot's walk and derive → contract, per component: to-figma's own
   --verify reads it back and writes <component>.roundtrip.json beside the contract it was given. */
function draw(where, label, into, only, retry = true) {
  const dir = path.join(where.projectDir, 'round-trip');
  fs.mkdirSync(dir, { recursive: true });
  let fails = 0;
  // a drawing an import went unanswered in measures the library's silence, not the translation: its last reading stays,
  // and it is drawn once more after the rest
  const unanswered = [];
  const failed = (folder, what, out) => { console.log(`${folder}: ${what} — ${out.trim().split('\n').pop()}`); process.exitCode = 1; if (++fails < 3) return false; console.log('three failures in a row: stopped'); process.exitCode = 1; return true; };
  for (const { folder, contract } of contracts(where)) {
    if (only.length && !only.includes(folder)) continue;
    const file = path.join(dir, `${folder}.json`);
    fs.writeFileSync(file, JSON.stringify(contract, null, 2) + '\n');
    // the last run's reading goes first: a drawing that fails now must not be counted by the last one's rows
    const reading = path.join(dir, `${folder}.roundtrip.json`), last = fs.existsSync(reading) ? fs.readFileSync(reading) : null;
    fs.rmSync(reading, { force: true });
    const run = (args) => { try { return { out: execFileSync('node', [path.join(HERE, 'to-figma.mjs'), file, ...args, '--project', label, '--into', into, '--library', file, '--folder', folder], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }), ok: true }; } catch (e) { return { out: `${e.stdout || ''}${e.stderr || ''}`, ok: false }; } };
    // a drawing still holding the file (one that failed lets go within a minute), or a connection that dropped, is waited
    // out: 15 s, eight times (a failed one lets go within two minutes), then it counts as a failure
    let d = run(['--run']);
    for (let i = 0; i < 8 && !d.ok && /still running in this file|Unable to establish connection/.test(d.out); i++) { execFileSync('sleep', ['15']); d = run(['--run']); }
    if (!d.ok) { fs.unlinkSync(file); if (failed(folder, 'not drawn', d.out)) return; continue; }
    // a library import (a component, icon, style or variable) unanswered; a font that never loads is the machine's, and
    // stays a row of the reading
    if (d.out.split(/, |: |\n/).some((x) => /\(no answer/.test(x) && !/^(font of |Inter \()/.test(x.trim()))) {
      fs.unlinkSync(file);
      if (last) { fs.writeFileSync(reading, last); noteTaken(where.projectDir, 'figma', folder, contract, true); }
      unanswered.push(folder);
      console.log(`${folder}: an import went unanswered, ${last ? 'its last reading kept' : 'no reading yet'}${retry ? '; drawn again after the rest' : ''}`);
      if (!retry) process.exitCode = 1;
      continue;
    }
    const v = run(['--verify']);
    fs.unlinkSync(file);
    fs.rmSync(path.join(dir, `${folder}.drawn.json`), { force: true });
    const line = v.out.split('\n').find((l) => /against the library's own/.test(l));
    if (!line) { if (failed(folder, 'not read back', v.out)) return; continue; }
    fails = 0;
    noteTaken(where.projectDir, 'figma', folder, contract);
    console.log(line);
  }
  if (retry && unanswered.length) draw(where, label, into, unanswered, false);
}

/* contract → to-markup and to-code → Chrome → from-code's walk → contract, per component (from-code --self), stopping
   after three failures in a row. */
function readSelf(where, label, only) {
  let fails = 0;
  for (const { folder, contract } of contracts(where)) {
    if (only.length && !only.includes(folder)) continue;
    let out, ok = true;
    try { out = execFileSync('node', [path.join(HERE, 'from-code.mjs'), '--project', label, folder, '--self'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }); } catch (e) { out = `${e.stdout || ''}${e.stderr || ''}`; ok = false; }
    // its own summary line, else the last line that is not a stack frame (what went wrong)
    const lines = out.trim().split('\n').reverse(), last = lines.find((l) => l.startsWith(`${folder}:`)) || lines.find((l) => !/^\s+at /.test(l) && /\w{3}/.test(l)) || '';
    console.log(`${folder}: ${ok ? last.split(' — ')[0] : `not read — ${last}`}`);
    if (ok) { fails = 0; noteTaken(where.projectDir, 'self', folder, contract); continue; }
    process.exitCode = 1;
    if (++fails >= 3) { console.log('three failures in a row: stopped'); return; }
  }
}

/* The self leg read twice: a reading that is not the same both times is a measure that cannot be trusted. Returns the
   exit code: 1 where any differs or was not read. */
function readTwice(where, label, only) {
  const dir = path.join(where.projectDir, 'round-trip', 'self', 'from-code');
  // a reading less what every run changes (its date, its seconds; shared/output.mjs writeReport's volatile fields)
  const snap = () => Object.fromEntries(contracts(where).filter(({ folder }) => !only.length || only.includes(folder)).map(({ folder }) => { try { const { at, seconds, ...r } = JSON.parse(fs.readFileSync(path.join(dir, `${folder}.json`), 'utf8')); return [folder, JSON.stringify(r)]; } catch { return [folder, null]; } }));
  // each pass starts with no readings, so one that fails is missing, never the last pass's file compared with itself
  const clear = () => { for (const f of Object.keys(snap())) fs.rmSync(path.join(dir, `${f}.json`), { force: true }); };
  clear(); readSelf(where, label, only); const first = snap();
  clear(); readSelf(where, label, only); const second = snap();
  const differ = Object.keys(first).filter((f) => first[f] === null || second[f] === null || first[f] !== second[f]);
  for (const f of differ) console.log(`  ${f}: ${first[f] === null || second[f] === null ? 'not read' : 'read differently the second time'}`);
  console.log(`${label} self, read twice: ${Object.keys(first).length - differ.length} of ${Object.keys(first).length} the same both times`);
  return differ.length || process.exitCode ? 1 : 0;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === (() => { try { return fs.realpathSync(process.argv[1]); } catch { return null; } })()) {
  const argv = process.argv.slice(2);
  const opt = (k) => { const i = argv.indexOf(k); return i >= 0 ? argv.splice(i, 2)[1] : null; };
  const flag = (k) => { const i = argv.indexOf(k); if (i >= 0) argv.splice(i, 1); return i >= 0; };
  const label = opt('--project'), into = opt('--draw'), self = flag('--self');
  const fields = flag('--fields'), check = flag('--check'), accept = flag('--accept'), byCause = flag('--causes'), twice = flag('--twice');
  if (!label) { console.error('usage: eval.mjs --project <label> [--fields] [--causes] [--check | --accept]\n       eval.mjs --project <label> --draw <scratch fileKey> [components…]\n       eval.mjs --project <label> --self [--twice] [components…]'); process.exit(2); }
  const where = req('../snapshot/projects.cjs').layout(null, label);
  if (where.error) { console.error(where.error); process.exit(2); }
  if (into) { draw(where, label, into, argv); process.exit(); }
  if (self && twice) { process.exit(readTwice(where, label, argv)); }
  if (self) { readSelf(where, label, argv); process.exit(); }
  const m = measure(where);
  report(label, m, fields, byCause);
  const file = path.join(m.home, 'round-trip', 'accepted.json');
  const now = counts(m.legs);
  if (accept) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(now, null, 2) + '\n');
    console.log(`accepted: ${path.relative(process.cwd(), file)}`);
  } else if (check) {
    if (!fs.existsSync(file)) { console.log(`no accepted counts at ${file}: run with --accept once`); process.exit(1); }
    // a check that measured nothing has not passed: the project reads its components first, or rules the gate out
    if (!Object.values(now).some((cs) => Object.keys(cs).length)) { console.log('nothing measured: no component has a reading from code or from Figma'); process.exit(1); }
    const bad = worse(now, JSON.parse(fs.readFileSync(file, 'utf8')));
    for (const b of bad) console.log(`  rose: ${b}`);
    if (bad.length) { console.log('a count rose against the accepted one: fix what the rows say, or accept with a reason in the commit'); process.exit(1); }
  }
}
