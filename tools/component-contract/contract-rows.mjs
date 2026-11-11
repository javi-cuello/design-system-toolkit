/**
 * contract-rows.mjs — a component's properties, read from its contract.
 *
 * The contract (tools/component-contract, `contract.json` beside each stored
 * spec) is the one source for a component's props: the snapshot router writes
 * it on every snapshot, so it is as current as the snapshot. Two readers take
 * it from here:
 *
 *   rowsOf(contract, spec)    the Properties table's rows, four cells each (property, type,
 *                             options, notes) plus the evidence for each note; figma-properties-table
 *                             draws them
 *   propsOf(contract, spec)   each prop in Figma's words: { name, type, values, default }
 *                             (type is Figma's: VARIANT, BOOLEAN, TEXT, INSTANCE_SWAP, SLOT),
 *                             in rowsOf's order; the docs site's properties table
 *
 *   rowsFromWalk(components, { known, deriveWith, platform })
 *                             the rows of components the snapshot plugin's walk returned, each
 *                             recorded as the store records it (store.cjs recordOf: compact, derive)
 *
 * Run as a script on the project's stored components folder, it prints each component's rows as JSON.
 * With --live, it asks the project's audit service to run the snapshot plugin's walk on the open file
 * (the service's /table-rows) and prints the call that loads those rows into figma-properties-table's script:
 *
 *   node tools/component-contract/contract-rows.mjs <components folder> [component name…]
 *   node tools/component-contract/contract-rows.mjs --live <project> <page name…> [--file <library key>]
 */
import { readFileSync, existsSync, readdirSync, realpathSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const TYPE = { enum: 'VARIANT', boolean: 'BOOLEAN', string: 'TEXT', instance: 'INSTANCE_SWAP', slot: 'SLOT' };

const typeOf = (p) => (p.axis ? 'VARIANT' : TYPE[p.type] || String(p.type).toUpperCase());

// A variant axis's options as Figma spells and orders them. An enum carries
// them (`figmaValues`); a False/True axis does not yet (derive.cjs keeps
// `figmaValues` for enums only), so its order and spelling are read from the
// stored spec the contract was derived from, in the same snapshot. Without a
// spec, False then True.
const optionsOf = (p, spec) => {
  if (p.type === 'enum') return p.figmaValues || p.values;
  if (p.axis) return p.figmaValues || (Array.isArray(spec?.props?.[p.figma]) ? spec.props[p.figma] : ['False', 'True']);
  return [];
};
// A value as Figma spells it: an enum's from `figmaValues`, a boolean axis's from its options.
const spell = (p, v, spec) => {
  if (p.type === 'enum') return (p.figmaValues || p.values)[p.values.indexOf(v)] ?? v;
  if (p.axis) return optionsOf(p, spec).find((o) => o.toLowerCase() === String(v)) ?? String(v);
  return v;
};

export function propsOf(contract, spec) {
  // in the Properties table's order (rowsOf, through propRows), so the docs site and the Figma table list them alike
  const order = rowsOf(contract, spec).map((r) => r.values[0]);
  return Object.values(contract.props || {}).map((p) => {
    const type = typeOf(p);
    const values = optionsOf(p, spec);
    const d = p.type === 'enum' || p.axis ? spell(p, p.default, spec)
      : p.type === 'boolean' ? String(p.default)
      : p.type === 'string' ? p.default : undefined;
    return { name: p.figma, type, values, default: d };
  }).sort((a, b) => order.indexOf(a.name) - order.indexOf(b.name));
}

// Every part the contract draws, from the default anatomy and every variant
// layer that adds one, with its parent and its place among its siblings.
const partsOf = (contract) => {
  const parts = new Map(Object.entries(contract.anatomy || {}).map(([id, x]) => [id, { ...x, added: false }]));
  for (const v of contract.variants || []) for (const [id, x] of Object.entries(v.add || {})) if (!parts.has(id)) parts.set(id, { ...x, added: true });
  return parts;
};
const chain = (parts, id) => { const out = []; for (let at = id; at && parts.has(at); at = parts.get(at).parent) out.unshift(at); return out; };
// Tree order: by each level's place; at a tie, a part a variant adds sits
// before the default's (the layer a boolean shows is drawn where it goes, and
// its siblings move along).
const treeKey = (parts, id) => chain(parts, id).map((x) => [parts.get(x).order ?? 0, parts.get(x).added ? 0 : 1]);
const before = (a, b) => {
  for (let i = 0; i < Math.min(a.length, b.length); i++) for (let j = 0; j < 2; j++) if (a[i][j] !== b[i][j]) return a[i][j] - b[i][j];
  return a.length - b.length;
};
// The parts a prop drives: what a boolean shows, a text sets, a swap swaps,
// and a slot fills (its part's content names it).
const partsFor = (key, p, parts) => {
  const own = [...(p.shows || []), ...(p.sets || []), ...(p.swaps || [])];
  for (const [id, x] of parts) if (x.content === `{${key}}` || x.swappedBy === key) own.push(id);
  return [...new Set(own)].filter((id) => parts.has(id));
};

// The rows from the props as one neutral list. Each prop: name, type (Figma's), options (an axis's, verbatim),
// default, at (the place of its first part, numbers compared in turn, a prefix first; null when it drives
// none), gate (the innermost other boolean that shows that part) and when (the values it is drawn under).
// Variant axes first in declared order, the rest in layer order, those that drive no part last. Options
// verbatim; only a False/True axis marks its default; a boolean is False then True, a convention since Figma
// gives it no order. Notes from the gate and `when`, capped at two.
const propRows = (props) => {
  const LABEL = { VARIANT: 'Variant', BOOLEAN: 'Boolean', TEXT: 'Editable string', INSTANCE_SWAP: 'Component swap', SLOT: 'Slot' };
  const earlier = (a, b) => { for (let i = 0; i < Math.min(a.length, b.length); i++) if (a[i] !== b[i]) return a[i] - b[i]; return a.length - b.length; };
  const lower = (v) => String(v).toLowerCase();
  const axes = props.filter((p) => p.type === 'VARIANT');
  const rest = props.filter((p) => p.type !== 'VARIANT');
  const placed = rest.filter((p) => p.at).sort((a, b) => earlier(a.at, b.at));
  const order = axes.concat(placed, rest.filter((p) => !p.at));
  return order.map((p) => {
    let options = '-';
    if (p.type === 'VARIANT') {
      const o = p.options || [];
      const binary = o.length === 2 && o.every((v) => v === 'True' || v === 'False');
      options = binary ? o.map((v) => (v === p.default ? v + ' (default)' : v)).join('\n') : o.join('\n');
    } else if (p.type === 'BOOLEAN') {
      const on = p.default === true || p.default === 'true';
      options = ['False', 'True'].map((v) => ((v === 'True') === on ? v + ' (default)' : v)).join('\n');
    }
    let notes = '-';
    if (p.type !== 'VARIANT') {
      const conds = [];
      if (p.gate) conds.push(lower(p.gate) + '=true');
      for (const [axis, vals] of Object.entries(p.when || {})) if (axis !== p.gate) conds.push(lower(axis) + '=' + [].concat(vals).map(lower).join(' or '));
      if (conds.length) notes = 'Only for ' + conds.slice(0, 2).join(' and ');
    }
    return { values: [p.name, LABEL[p.type] || p.type, options, notes], evidence: p.evidence || null };
  });
};

// This reader says, from the contract, where each prop's first part sits, which boolean shows it and which
// values draw it. figma-properties-table draws these rows, read live by the snapshot's own walk (--live).
export function rowsOf(contract, spec) {
  const entries = Object.entries(contract.props || {});
  const byKey = Object.fromEntries(entries);
  const parts = partsOf(contract);
  const drives = Object.fromEntries(entries.map(([k, p]) => [k, partsFor(k, p, parts)]));
  // the boolean whose shown part holds a part (the part itself, or its nearest ancestor)
  const shownBy = new Map();
  for (const [k, p] of entries) if (p.type === 'boolean' && !p.axis) for (const id of p.shows || []) if (!shownBy.has(id)) shownBy.set(id, k);
  return propRows(entries.map(([k, p]) => {
    const type = typeOf(p);
    const out = { name: p.figma, type, options: optionsOf(p, spec), default: type === 'VARIANT' ? spell(p, p.default, spec) : p.default, at: null, gate: null, when: null };
    if (type === 'VARIANT') return out;
    const ev = { parts: drives[k] };
    const first = drives[k].map((id) => treeKey(parts, id)).sort(before)[0];
    if (first) {
      out.at = first.flat();
      const path = chain(parts, drives[k][0]);
      // the innermost other boolean that shows a part on the way down
      const gate = path.slice().reverse().map((id) => shownBy.get(id)).find((g) => g && g !== k);
      if (gate) { out.gate = byKey[gate].figma; ev.gatedBy = byKey[gate].figma; }
      // the part (or its nearest ancestor) drawn only under some props' values
      const w = path.slice().reverse().map((id) => contract.when?.[id]).find(Boolean);
      if (w) {
        out.when = {};
        for (const [q, vals] of Object.entries(w)) if (byKey[q] && q !== gate) out.when[byKey[q].figma] = [].concat(vals).map((v) => String(spell(byKey[q], v, spec)));
        ev.when = w;
      }
    }
    out.evidence = ev;
    return out;
  }));
}

// One entry per component, keyed as the table's script looks it up: by key, else by full name.
const entryOf = (spec, c) => { const key = spec.key || c.figma?.key || null; return [key || spec.name, { name: spec.name, key, rows: rowsOf(c, spec) }]; };

// A live walk's components, each read as the store reads what it wrote (JSON), so a row cannot differ
// between the snapshot and the open file for any reason but the file having changed.
export function rowsFromWalk(components, { known = [], deriveWith = {}, platform = null } = {}) {
  const { recordOf } = require('../snapshot/store.cjs');
  const names = [...new Set([...components.map((c) => c.name), ...known])];
  const rows = {}, noContract = [];
  for (const c of components) {
    let r;
    try { r = recordOf(c, names, deriveWith, platform); } catch (e) { r = { error: e.message }; }
    if (!r.contract) { noContract.push(`${c.name}: ${r.error}`); continue; }
    const [k, e] = entryOf(JSON.parse(JSON.stringify(r.spec)), JSON.parse(JSON.stringify(r.contract)));
    rows[k] = e;
  }
  return { rows, noContract };
}

// ------------------------------------------------------------------ the script

// run as a script, through the installed symlink too: both paths resolved, as Node resolves the module's own
const isMain = !!process.argv[1] && fileURLToPath(import.meta.url) === (() => { try { return realpathSync(process.argv[1]); } catch { return null; } })();
if (isMain && process.argv[2] === '--live') {
  const args = process.argv.slice(3), fi = args.indexOf('--file');
  const file = fi >= 0 ? args.splice(fi, 2)[1] : null;
  const [label, ...pages] = args;
  if (!label || !pages.length) { console.error('usage: node tools/component-contract/contract-rows.mjs --live <project> <page name…> [--file <library key>]'); process.exit(2); }
  const { layout, entries } = require('../snapshot/projects.cjs');
  const w = layout(null, label);
  if (!w || w.error) { console.error(`${label}: ${(w && w.error) || 'no such project'}`); process.exit(1); }
  // the library file, as the snapshot's MCP path picks it: the one routed, or the one named when several are
  const { libraryKey } = await import('../snapshot/mcp.mjs');
  const lib = libraryKey(entries(w.files && w.files.library), file);
  if (lib.error) { console.error(`${label}: ${lib.error}`); process.exit(1); }
  const { serviceFor, call } = await import('../figma-audit/services.mjs');
  const svc = serviceFor(w.audit || join(dirname(w.doc), 'audit'));
  if (!svc) { console.error(`${label}: its audit service is not running. Start it (bin/audit ${label}), then run this again.`); process.exit(1); }
  let r;
  try { r = await call(svc, '/table-rows', { fileKey: lib.key, pages }); }
  catch (e) {
    // a service started before /table-rows existed answers its plain-text 404, which is not JSON
    const old = e instanceof SyntaxError ? ' The audit service runs an older server.mjs: launchctl kickstart -k gui/$UID/com.toolkit.figma-audit, then run this again.' : '';
    console.error(`${label}: ${e.message}${old}`); process.exit(1);
  }
  // a failed read answers ok:false, with or without its reason
  if (!r || r.ok === false || !Array.isArray(r.noContract)) { console.error(`${label}: the service could not read the file${r && r.error ? `: ${r.error}` : ' and gave no reason'}`); process.exit(1); }
  if (r.noContract.length) console.error(`no contract could be derived for ${r.noContract.join('; ')}`);
  if (!Object.keys(r.rows).length) { console.error(`no components on ${pages.join(', ')} in the open file (a page named Scratch is never read: snapshot-standard rule 27)`); process.exit(1); }
  console.log(`PT.rows(${JSON.stringify(r.rows)});`);
} else if (isMain) {
  const [dir, ...names] = process.argv.slice(2);
  if (!dir) { console.error('usage: node tools/component-contract/contract-rows.mjs <components folder> [component name…]'); process.exit(2); }
  if (!existsSync(dir)) { console.error(`${dir}: no stored snapshot there. Take a snapshot first (the table in Figma reads the open file: --live).`); process.exit(1); }
  const read = (f) => JSON.parse(readFileSync(f, 'utf8'));
  const out = {}, missing = [];
  for (const folder of readdirSync(dir).sort()) {
    const sf = join(dir, folder, 'figma.json'), cf = join(dir, folder, 'contract.json');
    if (!existsSync(sf)) continue;
    const spec = read(sf);
    if (names.length && !names.includes(spec.name)) continue;
    if (!existsSync(cf)) { missing.push(spec.name); continue; }
    // the spec's name is the component's full name in Figma (`Tree/L4 header`), which the file is matched by
    const [k, e] = entryOf(spec, read(cf));
    out[k] = e;
  }
  const found = new Set(Object.values(out).map((e) => e.name).concat(missing));
  const unknown = names.filter((n) => !found.has(n));
  if (missing.length) console.error(`no stored contract for ${missing.join(', ')}: take a snapshot first (the router writes a contract beside each spec).`);
  if (unknown.length) console.error(`not in the stored snapshot: ${unknown.join(', ')}. Take a snapshot first if they are new.`);
  console.log(JSON.stringify(out, null, 2));
  if (missing.length || unknown.length) process.exit(1);
}
