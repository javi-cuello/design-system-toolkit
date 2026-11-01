#!/usr/bin/env node
// bin/audit --file (audit-session.mjs), filing a judged payload, against a
// real service over a scratch project: refused when missing or stale; a dry
// run names what it would close and writes nothing; --write files the rows,
// the library's measures and a run. Step one (scanning through /exec) needs a
// file open in Figma and is not run here. Run: node tools/figma-audit/test-session.mjs
import assert from "node:assert/strict";
import fs from "node:fs";
import { onFreePort } from "../shared/free-port.mjs";
import os from "node:os";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { isOpen } from "./rows.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
let n = 0;
const ok = (name, cond, why = "") => { n++; assert.ok(cond, `${name}${why ? `\n${why}` : ""}`); console.log("ok", name); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// a free port in the bridge's range, which the service insists on (from the middle: test-routes counts down, test-socket up)
const PORTS = [9227, 9228, 9226, 9229, 9225, 9230];

// a scratch project: its context document routes one library, and its record holds one open row
const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "audit-session-")));
const ROOT = path.join(dir, "projects"), KEY = "AbCdEf0123456789";
const home = path.join(ROOT, "project-a", "figma-design-system"), audit = path.join(home, "audit");
fs.mkdirSync(audit, { recursive: true });
const block = (tag, v) => "```json " + tag + "\n" + JSON.stringify(v, null, 2) + "\n```\n";
fs.writeFileSync(path.join(home, "design-system-context.md"), "# Project A\n\n" + block("snapshot-routing", { files: { library: { key: KEY, id: KEY, roles: ["components", "tokens"] } } }) + "\n" + block("audit-settings", { libraries: { [KEY]: {} } }));
const recordFile = path.join(audit, KEY + ".json");
const old = { where: "Card", check: "Card: a layer is named Frame 12", key: "card|naming|frame-12", rule: "naming", owner: "figma-components-audit", bucket: "b2", sev: "warn", fix: ["Card: a layer is named Frame 12"], rec: ["Name it for what it holds."], done: false, firstSeen: "2026-10-01" };
fs.writeFileSync(recordFile, JSON.stringify({ rows: { "r-old": old }, libraries: {}, runs: {} }, null, 2));
const env = { ...process.env, ANTHROPIC_API_KEY: "", TOOLKIT_PROJECTS_ROOT: ROOT };

// the service is given an empty project list, so it builds no docs site for the scratch project (where Astro is
// installed, as in CI, it would); it files rows by its audit folder, which is the one bin/audit finds it by
fs.mkdirSync(path.join(dir, "none"));
let server = null, log = "";
process.on("exit", () => { if (server) server.kill(); fs.rmSync(dir, { recursive: true, force: true }); });
// started on the first port of PORTS it can bind: one taken between the probe and the bind moves to the next
const up = await onFreePort(PORTS, async (port) => {
  log = "";
  const s = server = spawn("node", [path.join(HERE, "server.mjs"), "--data", audit, "--port", String(port), "--key-file", path.join(dir, "no-key")], { stdio: ["ignore", "pipe", "pipe"], env: { ...env, TOOLKIT_PROJECTS_ROOT: path.join(dir, "none") } });
  s.stdout.on("data", (c) => { log += c; });
  s.stderr.on("data", (c) => { log += c; });
  for (let i = 0; i < 80 && !log.includes("figma audit") && s.exitCode === null; i++) await sleep(100);
  if (!log.includes("figma audit")) { s.kill(); throw new Error(`the service never started:\n${log}`); }
});
if (!up) { console.log("skip: the middle ports the bridge scans (9225–9230) are taken, so the session path cannot be tested here"); process.exit(77); }
const PORT = up.port;

const session = (...args) => spawnSync("node", [path.join(HERE, "audit-session.mjs"), ...args], { encoding: "utf8", env });
const payload = (at = new Date().toISOString()) => {
  const f = path.join(dir, `payload-${n}.json`);
  const stage = { owner: "figma-components-audit", fileKey: KEY, origin: "session-audit", full: true, exhaustive: true, language: "en-GB", scope: ["Card", "Button"], ran: ["naming", "binding"],
    findings: [{ where: "Button", node: "1:2", check: "Button: the fill is not bound to a variable", key: "button|binding|fill", rule: "binding", bucket: "b1", sev: "warn", fix: ["Button: the fill is not bound to a variable"], rec: ["Bind it to the fill token."] }],
    dismissed: [] };
  fs.writeFileSync(f, JSON.stringify({ project: "project-a", fileKey: KEY, at, measures: { coverage: 100, sets: 2, variants: 6, variables: 12 }, stages: [stage] }));
  return f;
};
const record = () => JSON.parse(fs.readFileSync(recordFile, "utf8"));

const missing = session("--file", path.join(dir, "nope.json"));
ok("a payload that is not there is the usage line, not a stack", missing.status === 2 && /usage: bin\/audit --file <payload>/.test(missing.stderr) && !/at .*\.mjs:\d+/.test(missing.stderr), missing.stderr);

const stale = session("--file", payload(new Date(Date.now() - 2 * 3600e3).toISOString()));
ok("a payload scanned over an hour ago is refused: filed late it would close rows a newer audit raised", stale.status === 2 && /over an hour ago; scan again with bin\/audit project-a/.test(stale.stderr), stale.stderr);

const before = fs.readFileSync(recordFile, "utf8");
const dry = session("--file", payload());
ok("a dry run names the row it would close and what each stage would add, and writes nothing",
  dry.status === 0 && /would close: Card \| Card: a layer is named Frame 12/.test(dry.stdout) && /figma-components-audit: would add 1, update 0, reopen 0, close 1/.test(dry.stdout)
  && /dry run: nothing written/.test(dry.stdout) && fs.readFileSync(recordFile, "utf8") === before, dry.stdout + dry.stderr);

const wrote = session("--file", payload(), "--write");
const after = record();
const rows = Object.values(after.rows);
ok("--write files the rows through the service: the new finding open, the row no longer raised closed",
  wrote.status === 0 && /figma-components-audit: added 1, updated 0, reopened 0, closed 1/.test(wrote.stdout)
  && rows.some((r) => r.where === "Button" && isOpen(r)) && after.rows["r-old"] && !isOpen(after.rows["r-old"]), wrote.stdout + wrote.stderr + JSON.stringify(after.rows));
const run = Object.values(after.runs || {})[0];
ok("…and the library's measures and a session run, as the page's audit records them",
  after.libraries[KEY] && after.libraries[KEY].metrics.sets === 2 && after.libraries[KEY].metrics.openFindings === 1
  && run && run.via === "session" && run.found === 1 && run.cleared === 1 && /measures and run .* recorded/.test(wrote.stdout), JSON.stringify({ libraries: after.libraries, runs: after.runs }));

console.log(`${n}/${n} passed`);
// the service is a child with open pipes, which keep this process alive: exit, and the handler above stops it
process.exit(0);
