#!/usr/bin/env node
// registry.mjs - the cross-file passes (references/discovery-passes.md, "Registry" and "Dependency graph"),
// in node over each file's pass A output and, where it ran, its pass C output: the context template's §2 rows
// and its dependency line, so neither is copied out by hand (toolkit-standard §D 23).
//   node scripts/registry.mjs <pass-a.json> [--c <pass-c.json>] [<pass-a.json> [--c <pass-c.json>]]...
// Each --c belongs to the pass A before it. Markdown on stdout, in the template's shape. A role is a proposal
// from the inventory, tagged [inferred] for the user to confirm (no components = a variable source); audience
// is never read from a file, so it is [TBD]. Edges are drawn from collection keys, labelled by library name.
import { readFileSync, realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";

const count = (a, k) => (a.pages || []).reduce((n, p) => n + (p[k] || 0), 0);

export function registry(files) {
  const rows = ["| File | fileKey | Role | Audience |", "|---|---|---|---|"];
  const edges = [];
  for (const { a, c } of files) {
    const sets = count(a, "sets"), comps = count(a, "comps");
    const role = sets + comps === 0
      ? "variable source `[inferred — no components; confirm]`"
      : "component library `[inferred — " + sets + " sets, " + comps + " components; confirm]`";
    rows.push("| " + String(a.fileName || "").replace(/\|/g, "\\|") + " | `" + a.fileKey + "` | " + role + " | `[TBD — ask]` |");
    const libs = new Map();
    for (const col of (c && c.collections) || []) {
      const l = libs.get(col.library) || [];
      l.push(col.key);
      libs.set(col.library, l);
    }
    for (const [lib, keys] of [...libs].sort((x, y) => String(x[0]).localeCompare(String(y[0])))) edges.push(lib + " → " + a.fileName + " (collections " + keys.map((k) => "`" + k + "`").join(", ") + ")");
  }
  const dep = edges.length ? "Dependency: " + edges.join("; ") + "." : "Dependency: `[TBD — pass C did not run for any file]`.";
  return rows.join("\n") + "\n\n" + dep + "\n";
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2), files = [];
  const load = (f) => JSON.parse(readFileSync(f, "utf8"));
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--c") { if (!files.length) { console.error("--c follows the pass A it belongs to"); process.exit(2); } files[files.length - 1].c = load(args[++i]); continue; }
    const a = load(args[i]);
    if (!a || !a.fileKey || !Array.isArray(a.pages)) { console.error(args[i] + " is not pass A's output (no fileKey or pages)"); process.exit(1); }
    files.push({ a });
  }
  if (!files.length) { console.error("usage: node scripts/registry.mjs <pass-a.json> [--c <pass-c.json>]..."); process.exit(2); }
  process.stdout.write(registry(files));
}
