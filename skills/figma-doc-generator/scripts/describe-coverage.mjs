#!/usr/bin/env node
// Which variables have a description, from a project's stored snapshot
// (snapshot/tokens.json), for *Variable descriptions* in SKILL.md: per
// collection, how many variables and how many described, and each undescribed
// one grouped by its grammar position (its path less the last segment), so one
// template can be drafted per group; and each description that names a
// sibling's word but not its own (wrongWord). Plain node; reads, never writes.
//
//   node describe-coverage.mjs <tokens.json> [--only <regex>] [--json]
//
// --only keeps the collections whose name matches (case-blind), e.g. semantic.
import { readFileSync, realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export function coverage(tokens, only) {
  const re = only ? new RegExp(only, 'i') : null;
  // (another library's collection the components bind, sent `remote`, is described in that library, never this one)
  return Object.entries(tokens.collections || {}).filter(([name, c]) => !c.remote && (!re || re.test(name))).map(([name, c]) => {
    const names = [...new Set(Object.values(c.values || {}).flatMap((m) => Object.keys(m)))].sort();
    const missing = names.filter((n) => !String((c.descriptions || {})[n] || '').trim());
    const groups = {};
    for (const n of missing) { const g = n.includes('/') ? n.slice(0, n.lastIndexOf('/')) : '(top level)'; (groups[g] = groups[g] || []).push(n); }
    return { collection: name, variables: names.length, described: names.length - missing.length, groups, wrongWord: wrongWord(names, c.descriptions || {}) };
  });
}

// A description that names a sibling role and not its own: the role is the last
// capitalised segment below the type, its siblings the other values it takes
// under the same parent (Info beside Danger). A copied description shows as
// "Default colour for danger text." on Text/Info/default. Token paths quoted in
// a description (Stroke/Danger/soft, an alias line's Palette/Green/12) are
// references, not its subject, and are left out on both sides; a word matches
// at its start, so "icons" names Icon. A report to read, not a gate: a word
// that is also a sibling's name in plain prose ("overlays" beside an Overlay
// role) is a false hit, and a copy that never names a role (only its meaning
// words, or a compound role like OnDanger) is not caught.
export function wrongWord(names, descriptions) {
  const kids = {};
  for (const n of names) { const p = n.split('/'); p.forEach((seg, i) => { const k = p.slice(0, i).join('/'); (kids[k] = kids[k] || new Set()).add(seg); }); }
  const says = (text, w) => new RegExp(`(^|[^a-z])${w.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).test(text);
  // leading segments every name shares are a namespace, not a grammar slot
  let lead = 0;
  while (names.length > 1 && names.every((n) => n.split('/').length > lead + 2 && n.split('/')[lead] === names[0].split('/')[lead])) lead++;
  const out = [];
  for (const n of names) {
    const full = String(descriptions[n] || '').toLowerCase();
    if (!full.trim()) continue;
    const text = full.replace(/\S*\/\S*/g, ' ');
    const p = n.split('/');
    // the role: the last capitalised segment that is neither the leaf nor the first below any
    // namespace every name shares (Info in Colour/Text/Info/default, Text/Info/Default)
    // (a namespace two or more deep is type and property, Colour/Text, so the role is the first segment after it;
    // one deep is ambiguous by shape, Colour/Level/x against Text/Info/x, and an all-Text collection with no type goes unchecked)
    const at = (min) => p.map((seg, j) => (j >= min && j < p.length - 1 && /^[A-Z]/.test(seg) ? j : -1)).filter((j) => j >= 0).pop();
    const i = at(lead + 1) ?? (lead >= 2 ? at(lead) : undefined);
    if (i === undefined) continue;
    const own = p[i];
    const named = [...kids[p.slice(0, i).join('/')]].filter((w) => w !== own && w.length > 2 && says(text, w));
    if (named.length && !says(text, own)) out.push({ name: n, own, names: named });
  }
  return out;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === (() => { try { return realpathSync(process.argv[1]); } catch { return null; } })()) {
  const [file, ...rest] = process.argv.slice(2);
  if (!file) { console.error('usage: describe-coverage.mjs <tokens.json> [--only <regex>] [--json]'); process.exit(2); }
  const i = rest.indexOf('--only');
  const out = coverage(JSON.parse(readFileSync(file, 'utf8')), i >= 0 ? rest[i + 1] : null);
  if (rest.includes('--json')) console.log(JSON.stringify(out, null, 1));
  else for (const c of out) {
    console.log(`${c.collection}: ${c.described}/${c.variables} described`);
    for (const w of c.wrongWord) console.log(`  ${w.name}: describes ${w.names.join(', ')}, not ${w.own}`);
    for (const [g, ns] of Object.entries(c.groups)) console.log(`  ${g}: ${ns.length} without (${ns.slice(0, 3).map((n) => (n.includes('/') ? n.slice(g.length + 1) : n)).join(', ')}${ns.length > 3 ? ', …' : ''})`);
  }
}
