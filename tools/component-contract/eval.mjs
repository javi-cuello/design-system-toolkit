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
 *   node tools/component-contract/eval.mjs --project <label> --second [components…]
 *
 * Each leg says how many components came back the same of all, how many were measured, and its rows folded to causes (a
 * part missing or extra is one cause at its root, `causes`); a reading taken of another contract than today's, or kept
 * from an earlier drawing, is stale and said (taken.json). --twice reads the self leg twice and fails where a reading
 * differs: a measure is trusted only where it repeats. --second goes round the self leg again from what the first came
 * back as (from-code --second, <home>/round-trip/self2/from-code/), and the `second` leg holds that to the first: a row
 * there is the translation not settling, a cause the first leg's count cannot show.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { contracts, hashOf } from './official.mjs';
import { roundTrip } from './to-figma.mjs';
import { partsOf, unexposed, pointerWords } from './to-markup.mjs';

const req = createRequire(import.meta.url);
const HERE = path.dirname(fileURLToPath(import.meta.url));

/* A row's field, with the element said as * (a field that differs in many elements is one cause). */
export const fieldOf = (at) => (at.includes('.') ? `*.${at.split('.').slice(1).join('.')}` : at).replace(/\.\d+(?=\.|$)/g, '.N');

export { hashOf };
/* When each reading was taken, of which contract: <home>/round-trip/taken.json, { self|figma: { <component>: { hash, kept? } } }. */
const takenFile = (home) => path.join(home, 'round-trip', 'taken.json');
const readTaken = (home) => { try { return JSON.parse(fs.readFileSync(takenFile(home), 'utf8')); } catch { return {}; } };
function noteTaken(home, leg, folder, contract, kept = false, inputs = null) {
  const t = readTaken(home);
  t[leg] = { ...(t[leg] || {}), [folder]: kept && t[leg] && t[leg][folder] ? { ...t[leg][folder], kept: true } : { hash: hashOf(contract), ...(kept && { kept: true }), ...(inputs && { inputs }) } };
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

/* What the toolkit's own markup leaves to the code that uses it, by design: a part drawn only at a pointer state (a menu
   open at focus: frontend-build's, said as a gap in the markup), but a focus ring, which to-code draws as an outline;
   and what a slot holds in the design (its sample content: the slot's filler is the caller's). The self legs count the
   rows of these apart (`left`), never among the differences, and never dropped. */
export function leftToCode(contract, mainOf = null) {
  // (a slot of a placed component is filled by the markup, its parts drawn: only the component's own slot is a sample;
  // and a part inside a placed component no prop of it carries, an override the markup cannot pass: to-markup's gap)
  const parts = partsOf(contract);
  const ids = [...parts.values()].filter((p) => (p.pointerOnly && !p.ring) || (p.slotted && !(parts.get(p.slotted) || {}).inside) || (mainOf && !!unexposed(contract, p.id, mainOf))).map((p) => p.id);
  // words only a pointer state changes (a field's "Search" at focus): to-markup's gap, as no markup holds them
  // (per text, the words its pointer states draw: a row is theirs only where the design side holds one of them, as rows
  // merge every combination under one place)
  const only = new Map(), words = new Map();
  for (const v of contract.variants || []) for (const [k, w] of Object.entries(v.set || {})) if (k.endsWith('.content')) {
    const p = pointerWords(contract, v.when);
    only.set(k, (only.get(k) ?? true) && p);
    if (p) words.set(k, [...(words.get(k) || []), w]);
  }
  const said = (at, row) => only.get(at) && row && (words.get(at) || []).includes(row.library);
  const over = new Map(mainOf ? [...parts.values()].map((p) => [p.id, unexposed(contract, p.id, mainOf)]).filter(([, w]) => w) : []);
  // (of such an override, only what markup would pass: the part itself, its kind, component, words and props; its
  // styles the sheet reaches, and a name the reading gives it is the reader's)
  const passed = new Set(['', 'kind', 'component', 'content', 'with']);
  // (a whole part the component does not draw takes its insides with it; a field it draws otherwise, only that field)
  // a part of a placed component's own that the design keeps only as the way down to such an override (an item's
  // content, holding the avatar it has no prop for): its whole-part row goes with the override, its fields stay
  const P = partsOf(contract);
  const placedIn = (el) => { const q = P.get(el); if (!q || !q.inside) return false; for (let up = q.e.parent; up && up !== q.slotted; up = ((P.get(up) || {}).e || {}).parent) if ((((P.get(up) || {}).e) || {}).kind === 'instance') return true; return !q.slotted; };
  const carries = (el) => mainOf && !over.has(el) && [...over.keys()].some((id) => id.startsWith(`${el}/`)) && placedIn(el);
  // a placed icon's colour where the design leaves it its own (a combination that takes the glyph's override away): the
  // icon set's own colour, which no main in the library holds, so what code draws there is its own to say
  const all = { ...(contract.anatomy || {}), ...Object.assign({}, ...(contract.variants || []).map((v) => v.add || {})) };
  const ownColour = (el, field, row) => field === 'background' && row && row.library == null && mainOf && (all[el] || {}).kind === 'instance' && !mainOf(all[el].component, all[el].key)
    && (contract.variants || []).some((v) => (v.remove || []).some((r) => r.startsWith(`${el}/`) && all[r] && all[r].background != null));
  // a placed component's own look the design overrides on the instance (its layout, corners, stroke, effect, clipping,
  // smoothing): code places a component and leaves its look to its own sheet (to-code's PLACED, code-standard rule 5),
  // so what the markup cannot pass is code's to say. (Not its fill: on an instance that is an icon's colour, which code
  // writes, ownColour above)
  const LOOK = new Set(['layout', 'radius', 'border', 'shadow', 'overflow', 'smoothing']);
  // (only where the design states one: a look the reading shows and the design leaves to the component is the
  // component's own sheet drifting, a difference)
  const ownLook = (el, field, row) => !!mainOf && !!row && row.library != null && LOOK.has(field.split('.')[0]) && (all[el] || {}).kind === 'instance' && !!mainOf(all[el].component, all[el].key);
  return (at, row) => { const el = at.split('.')[0], field = at.slice(el.length + 1); return said(at, row) || !!ownColour(el, field, row) || ownLook(el, field, row) || (field === '' && !!carries(el)) || ids.some((id) => (el === id || el.startsWith(`${id}/`)) && !(over.has(id) && !((el !== id && over.get(id) === 'part') || passed.has(field)))); };
}
const splitLeft = (rows, isLeft) => ({ rows: rows.filter((r) => !isLeft(r.at, r)), left: rows.filter((r) => isLeft(r.at, r)) });

/* Every leg for one project: { home, legs: { browser, self, figma } }, each leg { <component>: { rows, combinations, cut? } | { skipped } }. */
export function measure(where) {
  const home = where.projectDir;
  const readings = path.join(home, 'parity', 'from-code');
  const drawn = path.join(home, 'round-trip');
  const read = (f) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return null; } };
  const legs = { browser: {}, self: {}, second: {}, figma: {} };
  const taken = readTaken(home);
  // a reading of another contract than today's, or one kept when its drawing went unanswered, is stale: measured, said apart
  const stale = (leg, folder, contract) => { const t = (taken[leg] || {})[folder]; return !t ? 'taken before readings were fingerprinted' : t.kept ? 'kept from an earlier drawing (an import went unanswered)' : t.hash !== hashOf(contract) ? 'its contract changed since' : null; };
  // each component by its name, as the pipeline resolves it, for what an instance of it draws at its defaults
  const mains = req('./derive.cjs').byComponentName(contracts(where).map(({ contract }) => contract));
  const selfDir = path.join(drawn, 'self', 'from-code');
  for (const { folder, contract } of contracts(where)) {
    const code = read(path.join(readings, `${folder}.json`));
    if (!code || !code.asFigma) legs.browser[folder] = { skipped: 'no reading from code (from-code.mjs has not read it)' };
    // from-code fingerprints a reading from code with the contract it read against (`of`)
    else { const r = roundTrip(contract, code.asFigma, { mains }), st = !code.of ? 'taken before readings were fingerprinted' : code.of !== hashOf(contract) ? 'its contract changed since' : null; legs.browser[folder] = { rows: r.rows, combinations: r.combinations, ...(r.cut && { cut: r.cut }), ...(st && { stale: st }) }; }
    const own = read(path.join(selfDir, `${folder}.json`));
    if (!own || !own.asFigma) legs.self[folder] = { skipped: 'not read from the toolkit\'s own rendering (eval.mjs --self)' };
    else { const r = roundTrip(contract, own.asFigma, { mains }), st = stale('self', folder, contract); legs.self[folder] = { ...splitLeft(r.rows, leftToCode(contract, mains)), combinations: r.combinations, ...(r.cut && { cut: r.cut }), ...(st && { stale: st }) }; }
    // the second trip, held to the first: what it changes is the translation not settling (idempotence)
    const again = read(path.join(drawn, 'self2', 'from-code', `${folder}.json`));
    if (!again || !again.asFigma || !own || !own.asFigma) legs.second[folder] = { skipped: 'not read a second time (eval.mjs --second)' };
    else {
      // held to the first reading as it stands: one taken again since the second trip went round is stale
      // only the combinations the library draws (a reading carries no invalid list of its own)
      const r = roundTrip({ ...own.asFigma, invalid: contract.invalid }, again.asFigma, { mains }), t = (taken.second || {})[folder];
      const st = !t ? 'taken before readings were fingerprinted' : t.hash !== hashOf(own.asFigma) ? 'its first reading was taken again since' : legs.self[folder].stale ? `its first reading is stale (${legs.self[folder].stale})` : null;
      legs.second[folder] = { ...splitLeft(r.rows, leftToCode(contract, mains)), combinations: r.combinations, ...(r.cut && { cut: r.cut }), ...(st && { stale: st }) };
    }
    const back = read(path.join(drawn, `${folder}.roundtrip.json`));
    const st = back && stale('figma', folder, contract);
    legs.figma[folder] = back ? { rows: back.rows, combinations: back.combinations, ...(back.cut && { cut: back.cut }), ...(st && { stale: st }) } : { skipped: 'not drawn and read back (eval.mjs --draw)' };
  }
  return { home, legs };
}

/* The counts a measure stands at, and what rose or went against the accepted ones. */
// (what is left to code is held too, as its own leg: a part that comes to be drawn only at a pointer state moves its rows
// there, and that rise is said, not hidden)
export const counts = (legs) => Object.fromEntries(Object.entries(legs).flatMap(([leg, cs]) => {
  const out = [[leg, Object.fromEntries(Object.entries(cs).filter(([, x]) => x.rows).map(([c, x]) => [c, x.rows.length]))]];
  // (every component the leg splits, 0 included: one whose left rows fall to none is measured, not gone)
  const left = Object.entries(cs).filter(([, x]) => x.rows && x.left);
  return left.length ? [...out, [`${leg} left`, Object.fromEntries(left.map(([c, x]) => [c, x.left.length]))]] : out;
}));
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
    console.log(`${label} ${leg}: ${m.filter(([, x]) => !x.rows.length).length} of ${all} the same; measured ${m.length} of ${all}; ${nc} causes, ${rows.length} differing rows${m.some(([, x]) => x.left && x.left.length) ? `; ${m.reduce((a, [, x]) => a + (x.left || []).length, 0)} rows left to code (drawn only at a pointer state, slot samples, or overrides a placed component has no prop for)` : ''}${old.length ? `; ${old.length} stale (${[...new Set(old.map(([, x]) => x.stale))].join('; ')})` : ''}${skipped.length ? `; ${skipped.length} not measured (${[...new Set(skipped.map(([, x]) => x.skipped))].join('; ')})` : ''}`);
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
  // a component Figma never publishes (`_`, `.`) is placed from its own page in the scratch file, so it is drawn before
  // the components that place it: a modal drawn first placed its dialog as it was before this run
  const unpublished = (c) => /^[_.]/.test(c.component || '');
  const order = contracts(where).sort((a, b) => unpublished(b.contract) - unpublished(a.contract));
  for (const { folder, contract } of order) {
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
    // a scratch file another project claims refuses every drawing alike: a setup error, not a reading, so the last
    // reading goes back and the run stops at once
    if (!d.ok && /refused: \S+ is \S+'s scratch file/.test(d.out)) { fs.unlinkSync(file); if (last) fs.writeFileSync(reading, last); console.log(`${folder}: ${d.out.trim().split('\n').pop()}`); process.exitCode = 1; return; }
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

/* The reader's own code: every tool file a reading runs through, but to-markup's and to-code's, whose output selfInputs
   hashes instead (each component's markup, sheet, mapping and props, and what every page shares: the base sheet, the DOM
   helper, the pointer states) (a change to either moves only the components whose markup or sheet it changes). */
function readerCode() {
  const tools = path.join(HERE, '..'), h = createHash('sha1');
  const walk = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    if (e.isDirectory()) { if (!/^(node_modules|sample|fixtures|\..*)$/.test(e.name)) walk(path.join(d, e.name)); continue; }
    if (!/\.(mjs|cjs|js)$/.test(e.name) || /^test-/.test(e.name) || (d === HERE && /^(to-markup|to-code)\.mjs$/.test(e.name))) continue;
    h.update(path.relative(tools, path.join(d, e.name))).update('\0').update(fs.readFileSync(path.join(d, e.name))).update('\0');
  } };
  for (const d of ['component-contract', 'parity', 'shared', 'tokens', 'snapshot', 'contract-editor']) if (fs.existsSync(path.join(tools, d))) walk(path.join(tools, d));
  return h.digest('hex');
}

/* What each component's self reading is read from, as one hash per component: it and every component it places,
   transitively (each one's contract, spec, markup, sheet, parity mapping and props as stories give them), the base sheet,
   the tokens and their values, the project's parity settings, and the reader's own code. Two readings from the same
   inputs are the same reading (--twice holds the leg to that), so --changed reads only the components whose hash moved. */
export async function selfInputs(label, where) {
  const { loadParity } = await import('../parity/project.mjs');
  const project = await loadParity(label, { self: true });
  const { toElement, toParity, propsOf, DOM } = await import('./to-markup.mjs');
  const { toCss, BASE, pseudoClasses } = await import('./to-code.mjs');
  const { ELEMENT } = await import('./site.mjs');
  const store = req('../snapshot/store.cjs');
  const library = Object.fromEntries(contracts(where).map(({ folder, contract }) => [contract.component, { ...contract, folder }]));
  const byFolder = Object.fromEntries(Object.values(library).map((c) => [c.folder, c]));
  const read = (f) => { try { return fs.readFileSync(f, 'utf8'); } catch { return ''; } };
  const hash = (xs) => createHash('sha1').update(xs.join('\0')).digest('hex');
  const own = {}, unscoped = [], mains = req('./derive.cjs').byComponentName(Object.values(library));
  for (const c of Object.values(library)) {
    let spec = ''; try { spec = JSON.stringify(store.readSpec(project.paths.components, c.folder, { compact: true })); } catch { /* none: its hash says so */ }
    const sheet = toCss(c, c.folder, { naming: ELEMENT, mains });
    // every sheet is on the one page: one whose rules reach past its own element reaches every reading
    if (!scopedTo(sheet, `ds-${c.folder}`)) unscoped.push(sheet);
    own[c.folder] = hash([JSON.stringify(c), spec, toElement(c, c.folder, { naming: ELEMENT, library }), sheet, JSON.stringify(toParity(c, c.folder, { naming: ELEMENT, library, framework: 'web-components' })), JSON.stringify(propsOf(c, library))]);
  }
  // what every reading shares: the reader's code and the house settings it reads (standards/audit-settings.json: the
  // pointer states, the pseudo-classes), the base sheet, an unscoped sheet, the tokens and the project's settings, every
  // contract (a token named by a raw value breaks its ties by the whole library's use, from-code usageIn), and the
  // browser and system the page is measured in (its fallback font)
  let chrome = ''; try { const { findChrome } = await import('../shared/cdp.mjs'); chrome = execFileSync(findChrome(), ['--version'], { encoding: 'utf8' }); } catch { /* none: no reading either */ }
  // (and the fonts installed here: a family the tokens name, once installed, is measured in place of the fallback)
  const fonts = ['/Library/Fonts', '/System/Library/Fonts', path.join(process.env.HOME || '', 'Library', 'Fonts'), '/usr/share/fonts', '/usr/local/share/fonts', path.join(process.env.HOME || '', '.fonts'), path.join(process.env.HOME || '', '.local', 'share', 'fonts')]
    .flatMap((d) => { try { return fs.readdirSync(d, { recursive: true }).map((f) => `${d}/${f}`); } catch { return []; } }).sort().join('\n');
  const shared = hash([readerCode(), read(path.join(HERE, '..', '..', 'standards', 'audit-settings.json')), BASE, DOM, JSON.stringify(pseudoClasses()), fonts, ...unscoped, where.paths.styles ? read(path.join(where.paths.styles, '_tokens.scss')) : '', JSON.stringify(project.parity), JSON.stringify(project.snapshot || null), JSON.stringify(project.lib || null), JSON.stringify(Object.values(library)), chrome, `${process.platform} ${(await import('node:os')).release()}`]);
  return closureHashes(library, own, shared);
}

/* Whether every rule of a sheet names its element (`ds-x`), so it styles nothing outside it: its selectors, at-rules aside. */
export function scopedTo(css, root) {
  const bare = css.replace(/\/\*[\s\S]*?\*\//g, '');
  for (const m of bare.matchAll(/([^{};]+)\{/g)) {
    const sel = m[1].trim();
    // a name every sheet shares (an animation's, a registered property's, a font's) is no element's: unscoped
    if (/^@(keyframes|property|font-face|counter-style)\b/.test(sel)) return false;
    if (!sel || sel.startsWith('@') || /^(from|to|\d+%)(\s*,\s*(from|to|\d+%))*$/.test(sel)) continue;
    // (each selector of the list: commas inside :is(), :where() and :has() are theirs)
    const list = []; let depth = 0, at = 0;
    for (let i = 0; i < sel.length; i++) { const ch = sel[i]; if (ch === '(') depth++; else if (ch === ')') depth--; else if (ch === ',' && !depth) { list.push(sel.slice(at, i)); at = i + 1; } }
    list.push(sel.slice(at));
    if (list.some((x) => !new RegExp(`(^|[^\\w-])${root}(?![\\w-])`).test(x))) return false;
  }
  return true;
}

/* Each component's hash with every component it places, transitively (a component a contract names anywhere, placed or
   swapped to, that the library holds; `library` by component name, each with its folder), over each one's own hash and
   what all share: so a change to one moves it and what places it, nothing else. */
export function closureHashes(library, own, shared) {
  const byFolder = Object.fromEntries(Object.values(library).map((c) => [c.folder, c]));
  const placed = (c) => { const out = new Set(); JSON.stringify(c, (k, v) => { if (k === 'component' && typeof v === 'string' && library[v]) out.add(library[v].folder); return v; }); return out; };
  const closure = (f, seen = new Set()) => { if (seen.has(f)) return seen; seen.add(f); for (const g of placed(byFolder[f])) closure(g, seen); return seen; };
  const hash = (xs) => createHash('sha1').update(xs.join('\0')).digest('hex');
  return Object.fromEntries(Object.keys(byFolder).map((f) => [f, hash([shared, ...[...closure(f)].sort().map((g) => `${g}:${own[g]}`)])]));
}

/* contract → to-markup and to-code → Chrome → from-code's walk → contract, per component (from-code --self), `jobs` at a
   time (each its own browser), stopping after three failures in a row. Each reading is noted with the hash of what it
   was read from (selfInputs); `changed` reads only the components whose hash moved since their last reading (the second
   trip: since the first reading it goes round from, too). */
async function readSelf(where, label, only, second = false, { changed = false, jobs = 1 } = {}) {
  const inputs = await selfInputs(label, where);
  const firstOf = (folder) => read1(path.join(where.projectDir, 'round-trip', 'self', 'from-code', `${folder}.json`));
  const read1 = (f) => { try { return fs.readFileSync(f, 'utf8'); } catch { return null; } };
  const keyOf = (folder) => (second ? createHash('sha1').update(`${inputs[folder]}\0${firstOf(folder) || ''}`).digest('hex') : inputs[folder]);
  const taken = readTaken(where.projectDir)[second ? 'second' : 'self'] || {};
  const todo = [];
  for (const { folder, contract } of contracts(where)) {
    if (only.length && !only.includes(folder)) continue;
    const file = path.join(where.projectDir, 'round-trip', second ? 'self2' : 'self', 'from-code', `${folder}.json`);
    if (changed && taken[folder] && taken[folder].inputs === keyOf(folder) && fs.existsSync(file)) { console.log(`${folder}: unchanged since its last reading`); continue; }
    todo.push({ folder, contract });
  }
  let fails = 0, stopped = false;
  const one = ({ folder, contract }) => new Promise((done) => {
    execFile('node', [path.join(HERE, 'from-code.mjs'), '--project', label, folder, second ? '--second' : '--self'], { encoding: 'utf8', maxBuffer: 64 << 20 }, (e, stdout, stderr) => {
      const ok = !e, out = ok ? stdout : `${stdout || ''}${stderr || ''}`;
      // its own summary line, else the last line that is not a stack frame (what went wrong)
      const lines = out.trim().split('\n').reverse(), last = lines.find((l) => l.startsWith(`${folder}:`)) || lines.find((l) => !/^\s+at /.test(l) && /\w{3}/.test(l)) || '';
      console.log(`${folder}: ${ok ? last.split(' — ')[0] : `not read — ${last}`}`);
      if (ok) {
        fails = 0;
        if (!second) noteTaken(where.projectDir, 'self', folder, contract, false, keyOf(folder));
        // the second trip is fingerprinted with the first reading it went round from
        else { const f = firstOf(folder); if (f) noteTaken(where.projectDir, 'second', folder, JSON.parse(f).asFigma, false, keyOf(folder)); }
      } else {
        process.exitCode = 1;
        if (++fails >= 3 && !stopped) { stopped = true; console.log('three failures in a row: stopped'); }
      }
      done();
    });
  });
  const queue = [...todo];
  await Promise.all(Array.from({ length: Math.max(1, Math.min(jobs, queue.length)) }, async () => { while (queue.length && !stopped) await one(queue.shift()); }));
}

/* The self leg read twice: a reading that is not the same both times is a measure that cannot be trusted. Returns the
   exit code: 1 where any differs or was not read. */
async function readTwice(where, label, only, opts) {
  const dir = path.join(where.projectDir, 'round-trip', 'self', 'from-code');
  // a reading less what every run changes (its date, its seconds; shared/output.mjs writeReport's volatile fields)
  const snap = () => Object.fromEntries(contracts(where).filter(({ folder }) => !only.length || only.includes(folder)).map(({ folder }) => { try { const { at, seconds, ...r } = JSON.parse(fs.readFileSync(path.join(dir, `${folder}.json`), 'utf8')); return [folder, JSON.stringify(r)]; } catch { return [folder, null]; } }));
  // each pass starts with no readings, so one that fails is missing, never the last pass's file compared with itself
  const clear = () => { for (const f of Object.keys(snap())) fs.rmSync(path.join(dir, `${f}.json`), { force: true }); };
  clear(); await readSelf(where, label, only, false, opts); const first = snap();
  clear(); await readSelf(where, label, only, false, opts); const second = snap();
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
  const fields = flag('--fields'), check = flag('--check'), accept = flag('--accept'), byCause = flag('--causes'), twice = flag('--twice'), second = flag('--second');
  const opts = { changed: flag('--changed'), jobs: Math.max(1, +(opt('--jobs') || 1)) };
  if (!label) { console.error('usage: eval.mjs --project <label> [--fields] [--causes] [--check | --accept]\n       eval.mjs --project <label> --draw <scratch fileKey> [components…]\n       eval.mjs --project <label> --self [--twice] [--changed] [--jobs N] [components…]\n       eval.mjs --project <label> --second [--changed] [--jobs N] [components…]'); process.exit(2); }
  const where = req('../snapshot/projects.cjs').layout(null, label);
  if (where.error) { console.error(where.error); process.exit(2); }
  // the long legs hold the one measuring lock, niced (tools/shared/lock.mjs); from-code, run under it, does not wait
  if (into || self || second) await (await import('../shared/lock.mjs')).hold(`eval.mjs ${process.argv.slice(2).join(' ')}`);
  if (into) { draw(where, label, into, argv); process.exit(); }
  if (self && second) { console.error('--self and --second are two runs: the first, then the second'); process.exit(2); }
  if (self && twice) { process.exit(await readTwice(where, label, argv, { jobs: opts.jobs })); }
  if (self) { await readSelf(where, label, argv, false, opts); process.exit(); }
  if (second) { await readSelf(where, label, argv, true, opts); process.exit(); }
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
