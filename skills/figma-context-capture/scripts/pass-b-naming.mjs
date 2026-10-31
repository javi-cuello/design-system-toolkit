#!/usr/bin/env node
// pass-b-naming.mjs - discovery pass B (references/discovery-passes.md), in node over what passes A and D
// returned: the counting half of the naming conventions, so no prefix, stem or suffix is tallied by hand
// (toolkit-standard §D 23).
//   node scripts/pass-b-naming.mjs <pass-a.json> [<pass-d.json>]
// Prints JSON: `prefixes` (each leading mark with its count, pages and examples, `recordable` at 3 or more),
// `separators` (per candidate separator, the stems two or more siblings share), `contradictions` (a name
// carried both prefixed and bare, with the pages of each) and `suffixes` (layer-name endings in two or more
// of pass D's sampled sets). What they mean stays the agent's: whether a prefix marks parts nobody consumes
// (spot-check two or three nestings), which separator is the convention, and every contradiction, which is
// an open question and never a guess.
import { readFileSync, realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";

export const SEPARATORS = [" / ", "/", " - ", " · ", ", "];
const MIN_PREFIX = 3, EXAMPLES = 5;
// a leading run of marks (`_`, `.`, `🔒 `), or a first segment that names privacy in words (`Internal / `)
const LEADING = /^([^\p{L}\p{N}\s]+)\s*/u;
const WORDED = /^((?:internal|private)\s*\/\s*)/i;

const leading = (name) => { const m = WORDED.exec(name) || LEADING.exec(name); return m ? m[1] : null; };

export function naming(passA, passD = []) {
  const all = [];
  for (const p of passA.pages || []) for (const name of p.names || []) all.push({ name, page: p.name });

  const byPrefix = new Map();
  for (const { name, page } of all) {
    const pre = leading(name);
    if (!pre) continue;
    const key = pre.trim();
    const e = byPrefix.get(key) || { prefix: key, count: 0, pages: [], examples: [] };
    e.count++;
    if (!e.pages.includes(page)) e.pages.push(page);
    if (e.examples.length < EXAMPLES) e.examples.push(name);
    byPrefix.set(key, e);
  }
  const prefixes = [...byPrefix.values()].map((e) => ({ ...e, recordable: e.count >= MIN_PREFIX }))
    .sort((a, b) => b.count - a.count || a.prefix.localeCompare(b.prefix));

  const separators = [];
  for (const sep of SEPARATORS) {
    const stems = new Map();
    for (const { name, page } of all) {
      const i = name.indexOf(sep);
      if (i <= 0) continue;
      // " / " found inside "a / b" is not also a "/" separator: the bare form counts only unspaced
      if (sep === "/" && (name[i - 1] === " " || name[i + 1] === " ")) continue;
      const stem = name.slice(0, i);
      const g = stems.get(stem) || { stem, members: [], pages: [] };
      g.members.push(name);
      if (!g.pages.includes(page)) g.pages.push(page);
      stems.set(stem, g);
    }
    const groups = [...stems.values()].filter((g) => g.members.length >= 2);
    if (groups.length) separators.push({ separator: sep, groups: groups.length, names: groups.reduce((n, g) => n + g.members.length, 0), stems: groups });
  }
  separators.sort((a, b) => b.names - a.names);

  const bare = new Map();
  for (const { name, page } of all) if (!leading(name)) (bare.get(name) || bare.set(name, []).get(name)).push(page);
  const contradictions = [];
  for (const { name, page } of all) {
    const pre = leading(name);
    if (!pre) continue;
    const rest = name.slice(pre.length);
    if (bare.has(rest)) contradictions.push({ name: rest, prefixed: name, prefixedOn: page, bareOn: [...new Set(bare.get(rest))] });
  }

  const ends = new Map();
  for (const set of passD || []) {
    if (!set || !set.layers) continue;
    const seen = new Set();
    for (const layer of set.layers) {
      const m = /([-_][\p{L}]+)$/u.exec(String(layer).trim());
      if (!m || m[1].length < 3) continue;
      const suf = m[1].toLowerCase();
      if (seen.has(suf)) continue;
      seen.add(suf);
      const e = ends.get(suf) || { suffix: suf, sets: [], examples: [] };
      e.sets.push(set.name);
      if (e.examples.length < EXAMPLES) e.examples.push(layer);
      ends.set(suf, e);
    }
  }
  const suffixes = [...ends.values()].filter((e) => e.sets.length >= 2).sort((a, b) => b.sets.length - a.sets.length || a.suffix.localeCompare(b.suffix));
  const sampled = (passD || []).filter((s) => s && s.layers).length;

  return { names: all.length, prefixes, separators, contradictions, suffixes,
    suffixSample: sampled ? sampled + " sets" : "none: pass D's output was not given, so suffixes are unread" };
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [a, d] = process.argv.slice(2);
  if (!a) { console.error("usage: node scripts/pass-b-naming.mjs <pass-a.json> [<pass-d.json>]"); process.exit(2); }
  const passA = JSON.parse(readFileSync(a, "utf8"));
  if (!passA || !Array.isArray(passA.pages)) { console.error(a + " is not pass A's output (no pages)"); process.exit(1); }
  console.log(JSON.stringify(naming(passA, d ? JSON.parse(readFileSync(d, "utf8")) : []), null, 2));
}
