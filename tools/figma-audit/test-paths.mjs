#!/usr/bin/env node
// Every file server.mjs reads from the toolkit by default is there: each
// `join(HERE, …)` it names, and each `join(<default folder>, "<file>")` under a
// folder it defaults with one. Run: node tools/figma-audit/test-paths.mjs
//
// When the validator's engine moved to tools/validator, the service still
// looked for it in the skill's scripts/ folder, found nothing, and the page
// said the stage did not run (review, 2026-10-31): nothing failed.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const src = fs.readFileSync(path.join(HERE, "server.mjs"), "utf8");
// written at run time, never shipped
const RUNTIME = new Set(["audit.json"]);
const lits = (args) => [...args.matchAll(/"([^"]*)"/g)].map((m) => m[1]);
const JOIN = /join\(HERE((?:, "[^"]*")+)\)/g;

let n = 0;
const ok = (cond, name) => { n++; assert.ok(cond, name); };

const folders = new Map();
for (const m of src.matchAll(/const ([A-Z_]+) = (?:arg\("--[a-z-]+", )?join\(HERE((?:, "[^"]*")+)\)/g)) folders.set(m[1], path.join(HERE, ...lits(m[2])));
for (const m of src.matchAll(JOIN)) {
  const p = path.join(HERE, ...lits(m[1]));
  if (RUNTIME.has(path.basename(p))) continue;
  ok(fs.existsSync(p), `server.mjs names ${path.relative(path.join(HERE, "..", ".."), p)}, which is not there`);
}
for (const m of src.matchAll(/join\(([A-Z_]+), "([^"]+)"\)/g)) {
  if (!folders.has(m[1])) continue;
  const p = path.join(folders.get(m[1]), m[2]);
  ok(fs.existsSync(p), `server.mjs reads ${m[2]} from ${m[1]} (${path.relative(path.join(HERE, "..", ".."), folders.get(m[1]))}), which does not hold it`);
}
ok(n > 10, "the paths were read at all");
console.log(`${n}/${n} passed`);
