// Step 6's results, rendered from what links.js's scan returned, never assembled by hand.
//
//   node scripts/report.mjs [--scope <property>,…] <scan.json> [<scan.json> …]
//
// Each file is one `scan` result saved verbatim; a library scanned in batches passes every batch,
// and the distinct counts are the union of each batch's `seen`, never their sum. A batch passed
// twice is counted once; two different batches that audited the same component are refused,
// since their measures cannot be told apart. `--scope` is Step 0's narrower scope as the
// properties the layer lines name (`fills,strokes` for colours, `textStyleId` for text styles):
// a finding naming none of them is left out before anything is counted, and the count left out
// is said. Output is markdown on stdout: the counts, what the run could not check, and one table
// row per finding, the same bytes for the same input whatever order the batches come in.

import { readFileSync, realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";

const SUMMED = ["sets", "bindings", "styleRefs", "local", "broken", "dead", "styled"];
const SEV = { error: 0, review: 1 };
const cell = (s) => String(s).replace(/\|/g, "\\|").replace(/\n/g, " ");
const code = (s) => "`" + String(s).replace(/`/g, "'") + "`";
// A layer line is "<path> — <props>[ · …]"; the path is a name, so it is a code span.
const SEP = " \u2014 ";
const layerCell = (l) => {
  const i = l.lastIndexOf(SEP);
  if (i < 0 || l.startsWith("the component frame" + SEP)) return l;
  return code(l.slice(0, i)) + l.slice(i);
};
const propsOf = (l) => {
  const i = l.lastIndexOf(SEP);
  return i < 0 ? [] : l.slice(i + SEP.length).split(" \u00b7 ")[0].split(", ");
};
const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const plural = (n, one, many) => n.toLocaleString("en-US") + " " + (n === 1 ? one : many);

export function render(scans, { scope, keys } = {}) {
  if (!scans.length) throw new Error("no scan given");
  // --keys: every batch must have been handed the whole of the source's keys answer
  if (keys) {
    const want = { variables: (keys.variables || []).length, styles: (keys.styles || []).length };
    scans.forEach((s, i) => {
      const got = s.keysRead;
      if (!got) throw new Error("batch " + (i + 1) + " carries no keysRead: re-run it with the current links.js");
      if (got.variables !== want.variables || got.styles !== want.styles)
        throw new Error("batch " + (i + 1) + " was handed " + got.variables + " variables and " + got.styles + " styles; the source's keys hold " +
          want.variables + " and " + want.styles + ". Prepend the saved keys file whole and re-run it");
    });
  }
  const files = new Set(scans.map((s) => s.fileName));
  if (files.size > 1) throw new Error("the batches name different files (" + [...files].sort().join(", ") + "); re-run them in the intended file");
  const batches = [...new Map(scans.map((s) => [JSON.stringify(s), s])).values()];
  const owner = new Map();
  for (const s of batches) for (const a of s.audited || []) {
    if (owner.has(a.id) && owner.get(a.id) !== s) throw new Error(a.set + " (" + a.id + ") is in two batches; pass each batch once, or re-run them without overlap");
    owner.set(a.id, s);
  }
  const m = Object.fromEntries(SUMMED.map((k) => [k, 0]));
  const vars = new Set(), styles = new Set(), notChecked = new Set(), rows = [];
  let outside = 0;
  // links.js's `props` names every bound property; a scan from before it has the eight layers named
  const inScope = (c) => !scope || (c.props || (c.layers || []).flatMap(propsOf)).some((p) => scope.includes(p));
  for (const s of batches) {
    for (const k of SUMMED) m[k] += (s.measures && s.measures[k]) || 0;
    for (const id of (s.seen && s.seen.variables) || []) vars.add(id);
    for (const id of (s.seen && s.seen.styles) || []) styles.add(id);
    for (const line of s.notChecked || []) notChecked.add(line);
    for (const a of s.audited || []) for (const c of a.candidates || []) {
      if (!inScope(c)) { outside++; continue; }
      rows.push({ page: a.page || "", set: a.set, sev: c.sev, text: c.text, layers: c.layers || [], advice: c.advice || "" });
    }
  }
  rows.sort((a, b) => cmp(a.page, b.page) || cmp(a.set, b.set) || (SEV[a.sev] ?? 9) - (SEV[b.sev] ?? 9) || cmp(a.text, b.text));
  const errors = rows.filter((r) => r.sev === "error").length;

  const out = [
    "`" + [...files][0] + "`: " + plural(m.sets, "component", "components") + " scanned, " +
      plural(m.bindings, "variable binding", "variable bindings") + " and " + plural(m.styleRefs, "style reference", "style references") +
      " (" + plural(vars.size, "distinct variable", "distinct variables") + ", " + plural(styles.size, "distinct style", "distinct styles") + "). " +
      plural(rows.length, "broken link", "broken links") + ": " + errors + " error" + (errors === 1 ? "" : "s") + ", " + (rows.length - errors) + " to review.",
    "Not raised: " + plural(m.local, "local token", "local tokens") + ", " + plural(m.styled, "binding inside an applied style", "bindings inside applied styles") +
      ", " + plural(m.dead, "layer whose binding paints nothing", "layers whose bindings paint nothing") + ".",
  ];
  if (scope) out.push("Outside the scope (" + scope.join(", ") + "): " + plural(outside, "finding", "findings") + " left out.");
  for (const line of [...notChecked].sort()) out.push("Not checked: " + line + ".");
  out.push("");
  if (!rows.length) out.push("No broken links.");
  else out.push(
    "| Component | Severity | Finding | Layers | Fix |", "|---|---|---|---|---|",
    ...rows.map((r) => "| " + [code((r.page ? r.page + " › " : "") + r.set), r.sev, r.text, r.layers.map(layerCell).join("<br>"), r.advice].map(cell).join(" | ") + " |"));
  out.push("");
  return out.join("\n");
}

// through the real path: run from ~/.claude/skills, argv[1] is the symlink and never equals this module
if (process.argv[1] && fileURLToPath(import.meta.url) === realpathSync(process.argv[1])) {
  const args = process.argv.slice(2), at = args.indexOf("--scope");
  const scope = at < 0 ? undefined : (args.splice(at, 2)[1] || "").split(",").map((p) => p.trim()).filter(Boolean);
  const kat = args.indexOf("--keys"), keysFile = kat < 0 ? null : args.splice(kat, 2)[1];
  if (!args.length || (scope && !scope.length) || (kat >= 0 && !keysFile)) { console.error("usage: node report.mjs [--keys <keys.json>] [--scope <property>,…] <scan.json> [<scan.json> …]"); process.exit(2); }
  try { process.stdout.write(render(args.map((p) => JSON.parse(readFileSync(p, "utf8"))), { scope, keys: keysFile ? JSON.parse(readFileSync(keysFile, "utf8")) : undefined })); }
  catch (e) { console.error(e.message); process.exit(1); }
}
