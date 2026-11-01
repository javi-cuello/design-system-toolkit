#!/usr/bin/env node
// pass-c-scales.mjs - discovery pass C (references/discovery-passes.md), in node over what pass-c-libraries.js
// returned: the counting half of the token scales, so no step, slot or spelling is read off a list of names
// by hand (toolkit-standard §D 23).
//   node scripts/pass-c-scales.mjs <pass-c.json> [--tokens <tokens.json>]
// A name's number is not its value: `Spacing/4` may be 16px and `space/100` 8px, and the audit compares raw
// px against TOKENS.spacing and TOKENS.radius. So the names give only `nameSteps`; px come from --tokens, the
// source library's stored snapshot tokens (tools/snapshot/store.cjs layout), and only px reach `audit`.
// A pass C collection is matched to the snapshot collection of its name owned by the source file of its
// library (`_meta.sources[*].file` and `owns.collections`, or `_meta.file`), never by a variable name across
// collections: two collections, or two libraries, can hold the same name with different values. A matched
// collection's names are read from the snapshot, which is complete, not from pass C's capped list.
// Prints JSON:
//   scales    per collection, each family (matched without case) with two or more numbered names, or with
//             --tokens two or more numeric values: `nameSteps` (sorted numbers read from the names; `4px`
//             reads 4, `-4` reads -4), `px` (the union of every mode's values) and `pxByMode`, each with
//             `gaps` (a jump larger than the step on both sides; a missing first or last step cannot be
//             seen and is never reported), `steps` where the step changes, `unparsed` names that are no
//             plain number, `notNumeric` values that are no number (`"1rem"`, null, an alias the snapshot
//             did not follow), `kind` from whole words of the family's name, `complete` false when the
//             names are pass C's truncated list
//   skipped   families that are not scales but may hide one: a lone numbered name, mostly unparsed names,
//             or a family named for spacing or radius with no number at all, each with what it holds
//   notInSnapshot  with --tokens, the collections the snapshot does not hold for their library, or holds
//             under a name more than one source owns, and why (naming the snapshot's source files)
//   grammar   per collection: separator, how many names have each slot count, each slot's values counted
//   spelling  colour and color counted over every collection and variable name, with the tag they earn
//   audit     { spacing, radius } from px only, a kind with no values left out; null without --tokens, and
//             null with `auditWhy` (on stderr too, exit 1) when no collection matched the snapshot
// What they mean stays the agent's: which family is spacing or radius, whether a gap is intended, what an
// unparsed step stands for, and the slots' official names, which no name list carries.
import { readFileSync, realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";

// a plain step, with any word stuck before it (`space-16`, `r8`) and an optional unit (`4px`); `0-5` and
// `1_5` are not 5 and 5, so they are read as unparsed, never as a number. A step that is only `-4` is -4.
const STEP = /^(.*?)[-_ ]?(\d+(?:\.\d+)?)(?:px)?$/i;
const NEG = /^-\d+(?:\.\d+)?(?:px)?$/i;
const SPLIT = /^\d+[-_]\d+$/;
// whole words of the family's name, never a substring: `Background` holds "round", `Workspace` "spac"
const KINDS = [["spacing", /^(?:spacing|spacings|space|spaces|spacer|spacers|gap|gaps|padding|paddings|margin|margins|inset|insets|gutter|gutters)$/i],
  ["radius", /^(?:radius|radii|radiuses|corner|corners|rounded|rounding|round)$/i]];

const sepOf = (names) => {
  const has = (s) => names.filter((n) => n.includes(s)).length;
  return has("/") * 2 >= names.length && has("/") ? "/" : has("-") * 2 >= names.length && has("-") ? "-" : null;
};

function families(names) {
  const fams = new Map();
  for (const name of names) {
    const i = name.lastIndexOf("/");
    const parent = i < 0 ? "" : name.slice(0, i), last = name.slice(i + 1).trim();
    const m = SPLIT.test(last) ? null : STEP.exec(last);
    const neg = NEG.test(last);
    const stem = m && !neg ? m[1] : "";
    const family = m ? (parent && stem ? parent + "/" + stem : parent || stem) : parent;
    const id = family.toLowerCase();
    const f = fams.get(id) || { family, steps: [], names: [], unparsed: [] };
    f.names.push(name);
    if (m) f.steps.push(neg ? -Number(m[2]) : Number(m[2])); else f.unparsed.push(name);
    fams.set(id, f);
  }
  return [...fams.values()];
}

function run(nums) {
  const values = [...new Set(nums)].sort((a, b) => a - b);
  const d = values.slice(1).map((v, i) => +(v - values[i]).toFixed(4));
  const gaps = [];
  for (let i = 1; i < d.length - 1; i++) {
    if (!(d[i] > d[i - 1] && d[i] > d[i + 1])) continue;
    const s = Math.min(d[i - 1], d[i + 1]), missing = [];
    for (let v = values[i] + s; v < values[i + 1] - 1e-9; v = +(v + s).toFixed(4)) missing.push(v);
    gaps.push({ after: values[i], before: values[i + 1], missing });
  }
  return { values, gaps, steps: d.filter((x, i) => i === 0 || x !== d[i - 1]), duplicates: nums.length - values.length };
}

const kindOf = (family) => {
  const words = family.split(/[\/\-_ ]+/).filter(Boolean);
  return (KINDS.find(([, re]) => words.some((w) => re.test(w))) || [null])[0];
};

// The snapshot collection pass C's collection is, or why there is none. The join is by file name: pass C's
// library read gives only `libraryName`, the library file's name, never its key, so the source whose `file`
// equals it is the library's (a renamed library file breaks the join until it is snapshotted again). The store
// merges every source's collections by name: `collections` shows the last writer's copy of a name two sources
// own (the owner with the highest `seq`), and `shared[name][source]` keeps each other source's. A store from
// before `shared`, or a tie on `seq`, names no copy as the library's, and the name is reported, not guessed.
const filesOf = (tokens) => { const m = tokens._meta || {}; return m.sources ? Object.values(m.sources).map((s) => s && s.file).filter(Boolean) : m.file ? [m.file] : []; };
function snapshotOf(tokens, c) {
  const meta = tokens._meta || {}, entry = (tokens.collections || {})[c.name];
  const sources = meta.sources ? Object.values(meta.sources).filter(Boolean) : null;
  // every source with the library's file name: two (a file snapshotted under two keys) may each own a part
  const owners = sources ? sources.filter((s) => s.file === c.library) : meta.file === c.library ? [{ owns: { collections: Object.keys(tokens.collections || {}) } }] : [];
  if (!owners.length) return { why: "the snapshot is not of " + JSON.stringify(c.library) + "; its source files are " + (filesOf(tokens).map((f) => JSON.stringify(f)).join(", ") || "unnamed") };
  if (!entry || !owners.some((o) => ((o.owns && o.owns.collections) || []).includes(c.name))) return { why: JSON.stringify(c.library) + "'s snapshot holds no collection " + JSON.stringify(c.name) };
  const named = meta.sources ? Object.entries(meta.sources).filter(([, s]) => s && s.owns && (s.owns.collections || []).includes(c.name)) : [];
  if (named.length > 1) {
    // the library's latest source first: two entries of one file name (a moved file before routing settles)
    const mine = named.filter(([, s]) => s.file === c.library).sort(([, a], [, b]) => (b.seq || 0) - (a.seq || 0)).map(([k]) => k);
    const top = Math.max(...named.map(([, s]) => s.seq || 0)), last = named.filter(([, s]) => (s.seq || 0) === top);
    if (last.length === 1 && mine.includes(last[0][0])) return { entry };
    const kept = ((tokens.shared || {})[c.name]) || {};
    const own = mine.find((k) => kept[k]);
    if (own) return { entry: kept[own] };
    return { shared: true, why: JSON.stringify(c.name) + " is owned by more than one source and the store names no copy as " + JSON.stringify(c.library) + "'s (a snapshot from before `shared`: snapshot the library again)" };
  }
  return { entry };
}

// The collections pass C read: the libraries' and, named by the file's own name (pass C's `file`), the file's
// local ones. A library that is its own source has no library collection at all, and read without its locals
// it returned an empty audit block on a live library whose scales were all local (2026-11-01).
const readOf = (passC) => [...(passC.collections || []),
  ...(passC.file ? (passC.localCollections || []).map((l) => ({ key: l.id, name: l.name, library: passC.file, local: true, names: l.names || [], truncated: !!l.truncated })) : [])];

export function scales(passC, tokens = null) {
  const read = readOf(passC);
  const out = { scales: [], skipped: [], ...(tokens ? { notInSnapshot: [] } : {}), grammar: [], spelling: { colour: 0, color: 0, tag: null }, audit: null,
    note: "nameSteps are numbers read from names, not px; the end steps of a scale cannot be seen to be missing" };
  for (const c of read) {
    let names = c.names || [], entry = null;
    if (tokens) {
      const s = snapshotOf(tokens, c);
      if (s.entry) { entry = s.entry; names = [...new Set(Object.values(entry.values || {}).flatMap((v) => Object.keys(v || {})))]; }
      else out.notInSnapshot.push({ key: c.key, collection: c.name, library: c.library, why: s.why, ...(s.shared ? { shared: true } : {}) });
    }
    const id = { key: c.key, collection: c.name, library: c.library, ...(c.local ? { local: true } : {}), complete: entry ? true : !c.truncated };
    for (const f of families(names)) {
      const byMode = {}, notNumeric = [];
      if (entry) for (const mode of entry.modes || Object.keys(entry.values || {})) {
        const vals = (entry.values || {})[mode] || {};
        for (const n of f.names) {
          if (!(n in vals)) continue;
          if (typeof vals[n] === "number") (byMode[mode] || (byMode[mode] = [])).push(vals[n]);
          else notNumeric.push({ name: n, mode, value: vals[n] === undefined ? null : vals[n] });
        }
      }
      const px = Object.values(byMode).flat();
      const byName = f.steps.length >= 2 && f.steps.length >= f.unparsed.length, byValue = new Set(px).size >= 2;
      if (!byName && !byValue) {
        const kind = kindOf(f.family);
        if (f.steps.length || px.length || kind) out.skipped.push({ ...id, family: f.family, kind, nameSteps: f.steps, px: [...new Set(px)], unparsed: f.unparsed,
          why: f.steps.length === 0 && px.length === 0 ? "no numbered name" : Math.max(f.steps.length, new Set(px).size) < 2 ? "one numbered name" : "mostly unparsed" });
        continue;
      }
      const ns = run(f.steps);
      out.scales.push({ ...id, family: f.family, kind: kindOf(f.family),
        nameSteps: ns.values, gaps: ns.gaps, steps: ns.steps, duplicates: ns.duplicates, unparsed: f.unparsed,
        ...(entry ? { px: run(px), pxByMode: Object.fromEntries(Object.entries(byMode).map(([m, v]) => [m, [...new Set(v)].sort((a, b) => a - b)])), notNumeric } : {}) });
    }
    const sep = sepOf(names);
    const depths = {}, slots = [];
    for (const name of names) {
      const parts = sep ? name.split(sep).map((p) => p.trim()) : [name];
      depths[parts.length] = (depths[parts.length] || 0) + 1;
      parts.forEach((p, i) => { const s = slots[i] || (slots[i] = {}); s[p] = (s[p] || 0) + 1; });
    }
    out.grammar.push({ ...id, separator: sep, depths,
      slots: slots.map((v, i) => ({ slot: i + 1, label: "[TBD — confirm official slot names]", distinct: Object.keys(v).length, values: v })) });
    for (const s of [c.name, ...names]) {
      out.spelling.colour += (String(s).match(/colour/gi) || []).length;
      out.spelling.color += (String(s).match(/color/gi) || []).length;
    }
  }
  const { colour, color } = out.spelling;
  if (colour || color) out.spelling.tag = colour === color ? "[TBD — tied: ask]"
    : (colour && color ? "[inferred] " : "[confirmed] ") + (colour > color ? "colour" : "color");
  if (tokens && !read.length) {
    // nothing read: an older pass C output (no `file`) over a library that is its own source
    out.audit = null;
    out.auditWhy = "pass C read no collection: no library collection, and no local ones (re-run pass-c-libraries.js, which names the file and its locals)";
  } else if (tokens && out.notInSnapshot.length === read.length) {
    // nothing matched: the wrong store, or a renamed library. An empty block would read as "no scale found".
    out.audit = null;
    out.auditWhy = out.notInSnapshot.every((x) => x.shared)
      ? "every collection of pass C is in shared ownership: more than one source owns its name, and the store names no copy as the library's"
      : "no collection of pass C is in this snapshot; its source files are " + (filesOf(tokens).map((f) => JSON.stringify(f)).join(", ") || "unnamed");
  } else if (tokens) {
    out.audit = {};
    for (const k of ["spacing", "radius"]) {
      // a kind with no values is left out: `[]` is no scale, and a key present says one was found
      const v = [...new Set(out.scales.filter((s) => s.kind === k && s.px).flatMap((s) => s.px.values))].sort((a, b) => a - b);
      if (v.length) out.audit[k] = v;
    }
  }
  return out;
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const arg = (k) => { const i = args.indexOf(k); return i < 0 ? null : args[i + 1]; };
  const json = (f) => { try { return JSON.parse(readFileSync(f, "utf8")); } catch (e) { console.error(`${f}: ${e.code === "ENOENT" ? "no such file" : e.code === "EISDIR" ? "a folder, not a file" : "not JSON (" + e.message + ")"}`); process.exit(1); } };
  const c = args[0], t = arg("--tokens");
  if (!c || c.startsWith("--") || (args.includes("--tokens") && (!t || t.startsWith("--")))) { console.error("usage: node scripts/pass-c-scales.mjs <pass-c.json> [--tokens <tokens.json>]"); process.exit(2); }
  const passC = json(c);
  if (!passC || !Array.isArray(passC.collections)) { console.error(c + " is not pass C's output (no collections)"); process.exit(1); }
  const tokens = t ? json(t) : null;
  if (tokens && (typeof tokens.collections !== "object" || !tokens.collections)) { console.error(t + " is not a snapshot's tokens (no collections)"); process.exit(1); }
  const out = scales(passC, tokens);
  console.log(JSON.stringify(out, null, 2));
  if (out.auditWhy) { console.error(t + ": " + out.auditWhy); process.exit(1); }
}
