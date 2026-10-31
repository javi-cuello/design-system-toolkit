// Step 7's two tables, rendered from what the scripts returned, never assembled by hand.
//
//   node scripts/report.mjs <reference.json> <target.json>
//
// Each side is one JSON file holding that file's script results, saved verbatim:
//   { "inventory": <inventory.js>, "manifest": <manifest.js>, "serialise": <serialise.js>,
//     "dumps": [<dump-node.js>, …] }
// Every key is optional; a row needs the results it counts. Output is markdown on stdout, the
// same bytes for the same input. The "What it means" column is left empty: it is the agent's
// to write, and nothing else in the tables is.
//
// It refuses a side whose results name different files (Step 1: the active file drifts), and
// warns on stderr when both sides name the same file.

import { readFileSync, realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";

const num = (n) => (typeof n === "number" ? n.toLocaleString("en-US") : "—");
const code = (s) => "`" + String(s).replace(/`/g, "'") + "`";
const cell = (s) => String(s).replace(/\|/g, "\\|").replace(/\n/g, " ");
const delta = (a, b) => {
  if (typeof a !== "number" || typeof b !== "number") return "";
  const d = b - a;
  return d === 0 ? "same" : "target " + (d > 0 ? "+" : "-") + num(Math.abs(d));
};
const sorted = (xs) => [...xs].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
const union = (a, b) => sorted(new Set([...a, ...b]));
const under = (path, page) => path === page || path.startsWith(page + " / ");

// The file every result on one side names. Two names mean a read landed in the wrong file.
export function fileOf(side, label) {
  const names = new Set();
  for (const k of ["inventory", "manifest", "serialise"]) if (side[k] && side[k].file != null) names.add(side[k].file);
  for (const d of side.dumps || []) if (d.file != null) names.add(d.file);
  if (names.size > 1) throw new Error(label + ": results name different files (" + sorted(names).join(", ") + "); re-run them in the intended file");
  return names.size ? [...names][0] : "?";
}

// serialise.js returns "path = hash (nodes)" per component.
function comps(side) {
  const out = new Map();
  for (const line of (side.serialise && side.serialise.comps) || []) {
    const m = /^(.*) = ([0-9a-f]+) \((\d+)\)$/.exec(line);
    if (m) out.set(m[1], { h: m[2], n: Number(m[3]) });
  }
  return out;
}

const STYLE_KINDS = [["textStyles", "Text style"], ["effectStyles", "Effect style"], ["paintStyles", "Paint style"]];
const VAR_FIELDS = ["type", "scopes", "codeSyntax", "description", "hidden", "values"];
const DUMP_FIELDS = ["type", "w", "h", "sh", "sv", "maxW", "minW", "maxH", "minH", "pad", "gap"];

// A dump's rows keyed by ancestor path below the component, same-named siblings told apart by occurrence.
function dumpRows(dump) {
  const out = new Map(), stack = [], counts = [];
  for (const row of dump.rows || []) {
    stack.length = row.d; counts.length = row.d + 1;
    const seen = (counts[row.d] = counts[row.d] || {});
    seen[row.name] = (seen[row.name] || 0) + 1;
    stack.push(row.name + (seen[row.name] > 1 ? " #" + seen[row.name] : ""));
    out.set(stack.slice(1).join(" › "), row);
  }
  return out;
}

// Width and height only where sizing is fixed: FILL and HUG are computed from context (failure mode 4).
function dumpProps(a, b) {
  const computed = (s) => s === "FILL" || s === "HUG";
  return DUMP_FIELDS.filter((f) => {
    if (f === "w" && (computed(a.sh) || computed(b.sh))) return false;
    if (f === "h" && (computed(a.sv) || computed(b.sv))) return false;
    return String(a[f]) !== String(b[f]);
  });
}

const side = (has, here) => (has ? here : "absent");

export function render(ref, tgt) {
  const rName = fileOf(ref, "reference"), tName = fileOf(tgt, "target");
  const summary = [], detail = [];
  const row = (where, a, b) => detail.push([where, a, b]);
  const ri = ref.inventory, ti = tgt.inventory, rm = ref.manifest, tm = tgt.manifest;
  const rc = comps(ref), tc = comps(tgt);

  // Pages: by id where lineage is intact (the target was duplicated from the reference), then by
  // name for a page with no id partner. Every file's first page is 0:1, so one shared id says
  // nothing about the rest.
  const absentPages = [];   // a page name on one side only is one row, not one per component on it
  if (ri || ti) {
    const rp = ri ? ri.pages : [], tp = ti ? ti.pages : [];
    const pairs = [], left = new Set(rp), right = new Set(tp);
    let byName = 0;
    // same id and name first, then name alone, then id alone (a rename): so 0:1 never pairs two
    // pages whose names each have a partner on the other side
    const take = (match, counted) => { for (const p of [...left]) { const q = [...right].find((q) => match(p, q)); if (q) { pairs.push([p, q]); left.delete(p); right.delete(q); if (counted) byName++; } } };
    take((p, q) => p.id === q.id && p.name === q.name);
    take((p, q) => p.name === q.name, true);
    take((p, q) => p.id === q.id);
    for (const [x, y] of pairs) if (x.name !== y.name) row("Page " + code(x.name), "named " + code(x.name), "named " + code(y.name));
    const names = (ps) => new Set(ps.map((p) => p.name));
    const rn = names(rp), tn = names(tp);
    const lone = [...left].map((p) => [p, true]).concat([...right].map((p) => [p, false]))
      .sort((a, b) => (a[0].name < b[0].name ? -1 : a[0].name > b[0].name ? 1 : a[1] === b[1] ? 0 : a[1] ? -1 : 1));
    for (const [p, isRef] of lone) {
      const n = [...(isRef ? rc : tc).keys()].filter((c) => under(c, p.name)).length;
      if (!(isRef ? tn : rn).has(p.name)) absentPages.push(p.name);
      const here = "present" + (n ? ", " + num(n) + " component" + (n === 1 ? "" : "s") : "");
      row("Page " + code(p.name), side(isRef, here), side(!isRef, here));
    }
    summary.push(["Pages", num(rp.length), num(tp.length),
      delta(rp.length, tp.length) + (byName ? " (matched by name: page ids differ)" : "")]);
  }

  // Collections; a collection on one side only is one row, not one per variable in it.
  const absentCols = new Set(), allCols = [];
  if (ri || ti) {
    const a = new Map(((ri && ri.collections) || []).map((c) => [c.name, c]));
    const b = new Map(((ti && ti.collections) || []).map((c) => [c.name, c]));
    allCols.push(...union(a.keys(), b.keys()));
    for (const k of union(a.keys(), b.keys())) {
      const x = a.get(k), y = b.get(k);
      if (x && y) { if (x.modes.join(",") !== y.modes.join(",")) row("Collection " + code(k) + " → modes", x.modes.join(", "), y.modes.join(", ")); continue; }
      absentCols.add(k);
      const here = "present, " + num((x || y).varCount) + " variables";
      row("Collection " + code(k), side(x, here), side(y, here));
    }
    summary.push(["Collections", num(a.size), num(b.size), delta(a.size, b.size)]);
  }

  // A manifest key is "<collection>/<variable>", and either may hold a slash: the collection is
  // the longest name the inventory knows that prefixes the key.
  const colOf = (k) => allCols.filter((c) => k.startsWith(c + "/")).sort((a, b) => b.length - a.length)[0];

  // Variables: counts from the inventory, differences from the manifest's per-variable hashes,
  // and the differing field where the manifest was run with VARS.
  if (ri || ti || rm || tm) {
    const a = ri ? ri.totalVariables : rm && rm.total, b = ti ? ti.totalVariables : tm && tm.total;
    let differ = 0;
    if (rm && tm && rm.fileHash !== tm.fileHash) {
      const rv = rm.perVar || {}, tv = tm.perVar || {};
      for (const k of union(Object.keys(rv), Object.keys(tv))) {
        if (rv[k] === tv[k] || absentCols.has(colOf(k))) continue;
        differ++;
        if (!(k in rv) || !(k in tv)) { row(code(k), side(k in rv, "present"), side(k in tv, "present")); continue; }
        const x = rm.bodies && rm.bodies[k], y = tm.bodies && tm.bodies[k];
        if (!x || !y) { row(code(k) + " (fields not read: run manifest.js with VARS)", "differs", "differs"); continue; }
        const show = (v) => code(typeof v === "string" ? v : JSON.stringify(v));
        for (const f of VAR_FIELDS) if (JSON.stringify(x[f]) !== JSON.stringify(y[f])) row(code(k) + " → " + f, show(x[f]), show(y[f]));
      }
    }
    const d = delta(a, b);
    const tail = rm && tm
      ? (rm.fileHash === tm.fileHash ? "same" : [d === "same" ? "" : d, num(differ) + " differ"].filter(Boolean).join(", "))
      : d + (d ? " (values not compared: no manifest)" : "");
    summary.push(["Variables", num(a), num(b), tail]);
  }

  // Styles: counts from the inventory, differences by name from the manifest.
  if (ri || ti) {
    const types = ["text", "effect", "paint", "grid"];
    const counts = (inv) => (inv ? types.map((t) => num(inv.styles[t])).join(" / ") : "—");
    const moved = ri && ti ? types.filter((t) => ri.styles[t] !== ti.styles[t])
      .map((t) => t + " " + delta(ri.styles[t], ti.styles[t]).replace("target ", "")) : [];
    let differ = 0;
    if (rm && tm) for (const [key, label] of STYLE_KINDS) {
      const a = new Map((rm[key] || []).map((s) => [s.name, s.h])), b = new Map((tm[key] || []).map((s) => [s.name, s.h]));
      for (const n of union(a.keys(), b.keys())) {
        if (a.get(n) === b.get(n)) continue;
        differ++;
        const both = a.has(n) && b.has(n);
        row(label + " " + code(n), side(a.has(n), both ? "differs" : "present"), side(b.has(n), both ? "differs" : "present"));
      }
    }
    summary.push(["Text / effect / paint / grid styles", counts(ri), counts(ti),
      (moved.length ? "target " + moved.join(", ") : "same") + (differ ? ", " + num(differ) + " differ" : "")]);
  }

  // Components, and inside each differing one the nodes its dumps disagree on.
  if (ref.serialise || tgt.serialise) {
    const rs = ref.serialise || {}, ts = tgt.serialise || {};
    summary.push(["Components", num(rs.count), num(ts.count), delta(rs.count, ts.count)]);
    summary.push(["Nodes inside components", num(rs.totalNodes), num(ts.totalNodes), delta(rs.totalNodes, ts.totalNodes)]);
    const dumps = (s) => new Map((s.dumps || []).filter((d) => d.rows).map((d) => [d.path, d]));
    const rd = dumps(ref), td = dumps(tgt);
    const differing = [];
    for (const k of union(rc.keys(), tc.keys())) {
      const a = rc.get(k), b = tc.get(k);
      if ((a && b && a.h === b.h) || absentPages.some((p) => under(k, p))) continue;
      if (!a || !b) { row(code(k), side(a, a && "present, " + num(a.n) + " nodes"), side(b, b && "present, " + num(b.n) + " nodes")); continue; }
      differing.push(k);
      const x = rd.get(k), y = td.get(k);
      if (!x || !y) { row(code(k) + " (not drilled: run dump-node.js in both)", num(a.n) + " nodes", num(b.n) + " nodes"); continue; }
      const xr = dumpRows(x), yr = dumpRows(y);
      let found = 0;
      for (const p of union(xr.keys(), yr.keys())) {
        const where = code(k) + (p ? " → " + code(p) : ""), u = xr.get(p), v = yr.get(p);
        if (!u || !v) { found++; row(where, side(u, u && "present (" + u.type + ")"), side(v, v && "present (" + v.type + ")")); continue; }
        const fs = dumpProps(u, v);
        if (fs.length) { found++; row(where, fs.map((f) => f + " " + u[f]).join(", "), fs.map((f) => f + " " + v[f]).join(", ")); }
      }
      if (!found) row(code(k), "differs in a property dump-node.js does not read", "differs in a property dump-node.js does not read");
    }
    const names = differing.slice(0, 5).map((k) => code(k.split(" / ").pop())).join(", ") +
      (differing.length > 5 ? ", and " + num(differing.length - 5) + " more" : "");
    summary.push(["Components that differ", num(differing.length), num(differing.length), names || "none"]);
  }

  const table = (head, rows) => [
    "| " + head.join(" | ") + " |", "|" + head.map(() => "---").join("|") + "|",
    ...rows.map((r) => "| " + r.map(cell).join(" | ") + " |"),
  ].join("\n");
  return [
    "Reference: " + code(rName) + " · Target: " + code(tName), "",
    table(["", "Reference", "Target", ""], summary), "",
    detail.length ? table(["Where", "Reference", "Target", "What it means"], detail.map((r) => [...r, ""])) : "No differences.",
    "",
  ].join("\n");
}

// through the real path: run from ~/.claude/skills, argv[1] is the symlink and never equals this module
if (process.argv[1] && fileURLToPath(import.meta.url) === realpathSync(process.argv[1])) {
  const [a, b] = process.argv.slice(2);
  if (!a || !b) { console.error("usage: node report.mjs <reference.json> <target.json>"); process.exit(2); }
  try {
    const ref = JSON.parse(readFileSync(a, "utf8")), tgt = JSON.parse(readFileSync(b, "utf8"));
    if (fileOf(ref, "reference") === fileOf(tgt, "target")) console.error("warning: both sides name the same file; confirm by file key that two files were read");
    process.stdout.write(render(ref, tgt));
  } catch (e) { console.error(e.message); process.exit(1); }
}
