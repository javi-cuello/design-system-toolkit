/**
 * contract-rows.mjs — a component's properties, read from its contract.
 *
 * The contract (tools/component-contract, `contract.json` beside each stored
 * spec) is the one source for a component's props: the snapshot router writes
 * it on every snapshot, so it is as current as the snapshot. Two readers take
 * it from here:
 *
 *   propsOf(contract, spec)   each prop in Figma's words: { name, type, values, default }
 *                             (type is Figma's: VARIANT, BOOLEAN, TEXT, INSTANCE_SWAP, SLOT);
 *                             the docs site's properties table
 *   rowsOf(contract, spec)    the Properties table's rows in Figma, four cells each
 *                             (property, type, options, notes) plus the evidence for each note
 *
 * Run as a script on the project's stored components folder, it prints the
 * call that loads the rows into the file, for figma-properties-table's scripts/properties-table.js to draw:
 *
 *   node tools/component-contract/contract-rows.mjs <components folder> [component name…]
 */
import { readFileSync, existsSync, readdirSync, realpathSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { propRows } from '../shared/prop-rows.js';

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
  return Object.values(contract.props || {}).map((p) => {
    const type = typeOf(p);
    const values = optionsOf(p, spec);
    const d = p.type === 'enum' || p.axis ? spell(p, p.default, spec)
      : p.type === 'boolean' ? String(p.default)
      : p.type === 'string' ? p.default : undefined;
    return { name: p.figma, type, values, default: d };
  });
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

// The rows themselves are tools/shared/prop-rows.js's: this reader only says, from the contract, where
// each prop's first part sits, which boolean shows it and which values draw it. The Figma table reads the
// same from the open file and hands it to the same function.
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

// ------------------------------------------------------------------ the script

// run as a script, through the installed symlink too: both paths resolved, as Node resolves the module's own
const isMain = !!process.argv[1] && fileURLToPath(import.meta.url) === realpathSync(process.argv[1]);
if (isMain) {
  const [dir, ...names] = process.argv.slice(2);
  if (!dir) { console.error('usage: node tools/component-contract/contract-rows.mjs <components folder> [component name…]'); process.exit(2); }
  if (!existsSync(dir)) { console.error(`${dir}: no stored snapshot there. Take a snapshot first; the table is drawn from it.`); process.exit(1); }
  const read = (f) => JSON.parse(readFileSync(f, 'utf8'));
  const out = {}, missing = [];
  for (const folder of readdirSync(dir).sort()) {
    const sf = join(dir, folder, 'figma.json'), cf = join(dir, folder, 'contract.json');
    if (!existsSync(sf)) continue;
    const spec = read(sf);
    if (names.length && !names.includes(spec.name)) continue;
    if (!existsSync(cf)) { missing.push(spec.name); continue; }
    const c = read(cf);
    // the spec's name is the component's full name in Figma (`Tree/L4 header`), which the file is matched by
    const key = spec.key || c.figma?.key || null;
    out[key || spec.name] = { name: spec.name, key, rows: rowsOf(c, spec) };
  }
  const found = new Set(Object.values(out).map((e) => e.name).concat(missing));
  const unknown = names.filter((n) => !found.has(n));
  if (missing.length) console.error(`no stored contract for ${missing.join(', ')}: take a snapshot first (the router writes a contract beside each spec).`);
  if (unknown.length) console.error(`not in the stored snapshot: ${unknown.join(', ')}. Take a snapshot first if they are new.`);
  console.log(`PT.rows(${JSON.stringify(out)});`);
  if (missing.length || unknown.length) process.exit(1);
}
