#!/usr/bin/env node
// Which variables have a description, from a project's stored snapshot
// (snapshot/tokens.json), for *Variable descriptions* in SKILL.md: per
// collection, how many variables and how many described, and each undescribed
// one grouped by its grammar position (its path less the last segment), so one
// template can be drafted per group. Plain node; reads, never writes.
//
//   node describe-coverage.mjs <tokens.json> [--only <regex>] [--json]
//
// --only keeps the collections whose name matches (case-blind), e.g. semantic.
import { readFileSync, realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export function coverage(tokens, only) {
  const re = only ? new RegExp(only, 'i') : null;
  return Object.entries(tokens.collections || {}).filter(([name]) => !re || re.test(name)).map(([name, c]) => {
    const names = [...new Set(Object.values(c.values || {}).flatMap((m) => Object.keys(m)))].sort();
    const missing = names.filter((n) => !String((c.descriptions || {})[n] || '').trim());
    const groups = {};
    for (const n of missing) { const g = n.includes('/') ? n.slice(0, n.lastIndexOf('/')) : '(top level)'; (groups[g] = groups[g] || []).push(n); }
    return { collection: name, variables: names.length, described: names.length - missing.length, groups };
  });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === (() => { try { return realpathSync(process.argv[1]); } catch { return null; } })()) {
  const [file, ...rest] = process.argv.slice(2);
  if (!file) { console.error('usage: describe-coverage.mjs <tokens.json> [--only <regex>] [--json]'); process.exit(2); }
  const i = rest.indexOf('--only');
  const out = coverage(JSON.parse(readFileSync(file, 'utf8')), i >= 0 ? rest[i + 1] : null);
  if (rest.includes('--json')) console.log(JSON.stringify(out, null, 1));
  else for (const c of out) {
    console.log(`${c.collection}: ${c.described}/${c.variables} described`);
    for (const [g, ns] of Object.entries(c.groups)) console.log(`  ${g}: ${ns.length} without (${ns.slice(0, 3).map((n) => (n.includes('/') ? n.slice(g.length + 1) : n)).join(', ')}${ns.length > 3 ? ', …' : ''})`);
  }
}
