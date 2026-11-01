#!/usr/bin/env node
// The HTTP routes of server.mjs, against a real service on a scratch project:
// who may call them (Host, Origin), what /status says, how /exec fails, the
// record's guards, and the site folder it serves. Run: node tools/figma-audit/test-routes.mjs
//
// test-socket.mjs holds the plugin socket and /exec with a plugin on it;
// test-paths.mjs the service's defaults. These routes had no test (toolkit
// review, 2026-10-31).
import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
let n = 0;
const ok = (name, cond, why = "") => { n++; assert.ok(cond, `${name}${why ? `\n${why}` : ""}`); console.log("ok", name); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// a free port in the range the bridge scans, which the server insists on (counted down: test-socket counts up)
const free = (port) => new Promise((done) => { const s = net.createServer(); s.once("error", () => done(false)); s.listen(port, "127.0.0.1", () => s.close(() => done(true))); });
let PORT = 0;
for (let p = 9232; p >= 9223 && !PORT; p--) if (await free(p)) PORT = p;
if (!PORT) { console.log("every port the bridge scans (9223–9232) is taken, so the routes cannot be tested here"); process.exit(1); }

// a scratch project: its audit folder, no context document, no site yet, and no project list, so nothing real is read
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "audit-routes-"));
fs.mkdirSync(path.join(dir, "audit"));
fs.mkdirSync(path.join(dir, "projects"));
fs.writeFileSync(path.join(dir, "secret.txt"), "outside the site");
const server = spawn("node", [path.join(HERE, "server.mjs"), "--data", path.join(dir, "audit"), "--port", String(PORT), "--key-file", path.join(dir, "no-key")],
  { stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, ANTHROPIC_API_KEY: "", TOOLKIT_PROJECTS_ROOT: path.join(dir, "projects") } });
let log = "";
server.stdout.on("data", (c) => { log += c; });
server.stderr.on("data", (c) => { log += c; });
const done = () => { server.kill(); fs.rmSync(dir, { recursive: true, force: true }); };
process.on("exit", done);
for (let i = 0; i < 80 && !log.includes("figma audit"); i++) await sleep(100);
if (!log.includes("figma audit")) { console.log(`the service never started:\n${log}`); process.exit(1); }

/* One request with the headers a browser would send; fetch cannot set Host, so this is node:http. */
const ask = (method, p, { host = `localhost:${PORT}`, origin, body, accept } = {}) => new Promise((resolve, reject) => {
  const headers = { host };
  if (origin !== undefined) headers.origin = origin;
  if (accept) headers.accept = accept;
  if (body !== undefined) headers["content-type"] = "application/json";
  const req = http.request({ host: "127.0.0.1", port: PORT, method, path: p, headers }, (res) => {
    let text = "";
    res.on("data", (c) => { text += c; });
    res.on("end", () => { let json = null; try { json = JSON.parse(text); } catch {} resolve({ code: res.statusCode, text, json }); });
  });
  req.on("error", reject);
  req.end(body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body));
});
const SELF = `http://localhost:${PORT}`;
const post = (p, body, origin = SELF) => ask("POST", p, { origin, body });

try {
  // who may call
  const rebound = await ask("GET", "/status", { host: `attacker.example:${PORT}` });
  ok("a request addressed to another name is refused, before any route reads it", rebound.code === 421 && rebound.json.error === "wrong_host");
  ok("…and so is the health probe under another name", (await ask("GET", "/health", { host: `attacker.example:${PORT}` })).code === 421);
  for (const h of [`localhost:${PORT}`, `127.0.0.1:${PORT}`, `[::1]:${PORT}`]) ok(`the service answers when addressed as ${h}`, (await ask("GET", "/status", { host: h })).code === 200);
  const crossRead = await ask("GET", "/status", { origin: "https://attacker.example" });
  ok("a cross-site read of /status is refused", crossRead.code === 403 && crossRead.json.error === "cross_origin");
  const crossRun = await post("/exec", { code: "return 1" }, "https://attacker.example");
  ok("a cross-site POST to /exec is refused, before it reaches the plugin", crossRun.code === 403 && crossRun.json.error === "cross_origin");
  ok("a POST with no Origin is refused: a same-origin POST always sends one", (await ask("POST", "/exec", { body: { code: "return 1" } })).code === 403);
  ok("a POST from the dashboard's own origin, by either name, is let through", (await post("/exec", {}, SELF)).code === 400 && (await post("/exec", {}, `http://127.0.0.1:${PORT}`)).code === 400);
  const health = await ask("GET", "/health", { origin: "null" });
  ok("the plugin's health probe is answered from its sandbox origin, and says which service this is",
    health.code === 200 && health.json.status === "ok" && health.json.service === "figma-console-mcp" && health.json.port === PORT);

  // what it says
  const st = (await ask("GET", "/status")).json;
  ok("/status with no plugin: no file open, no Claude key, the audit folder",
    st.plugin === false && Array.isArray(st.files) && st.files.length === 0 && st.file === null && st.claude === false
    && fs.realpathSync(st.data) === fs.realpathSync(path.join(dir, "audit")), JSON.stringify(st));
  // a folder no project list holds: the docs build is not started to crash, and /status says why there is no site
  ok("/status says the site is not built because the project does not resolve, rather than a build's crash",
    /^not built: /.test(st.buildError || "") && !/TypeError/.test(st.buildError), st.buildError);

  // how /exec fails
  const noCode = await post("/exec", { timeout: 1000 });
  ok("/exec with no code is a 400, never sent", noCode.code === 400 && noCode.json.error === "code required");
  const noPlugin = await post("/exec", { code: "return 1" });
  ok("/exec with no plugin connected answers plugin_not_connected at once", noPlugin.code === 200 && noPlugin.json.ok === false && noPlugin.json.error === "plugin_not_connected");
  const noFile = await post("/exec", { code: "return 1", fileKey: "NOT-OPEN" });
  ok("/exec naming a file that is not open answers wrong_file_not_open", noFile.json.ok === false && noFile.json.error === "wrong_file_not_open"
    && /^Run the bridge plugin in the file NOT-OPEN\./.test(noFile.json.hint));
  // the one client (services.mjs) keeps the hint in the error it throws: a CLI prints the message and nothing else
  const { figmaExec } = await import("./services.mjs");
  const thrown = await figmaExec({ port: PORT }, "NOT-OPEN", "return 1", 1000).catch((e) => e.message);
  ok("the client's error for a file that is not open carries the hint on its one line", /^wrong_file_not_open: Run the bridge plugin in the file NOT-OPEN\./.test(thrown) && !thrown.includes("\n"), thrown);
  const notJson = await post("/exec", "{not json");
  ok("/exec with a body that is not JSON is a 500 that says so, and the service stays up", notJson.code === 500 && /JSON/.test(notJson.json.error) && (await ask("GET", "/health")).code === 200);
  ok("/claude with no key says so rather than calling out", (await post("/claude", { prompt: "x" })).json.error === "no_api_key");

  // the record's guards
  const empty = (await ask("GET", "/data")).json;
  ok("/data before any audit is an empty record, not an error", empty && JSON.stringify(empty.rows) === "{}" && JSON.stringify(empty.runs) === "{}");
  for (const bad of [{ oops: 1 }, [], { rows: [] }, "null"]) {
    const r = await ask("PUT", "/data", { origin: SELF, body: bad });
    ok(`PUT /data refuses what is not a record (${JSON.stringify(bad)})`, r.code === 400 && r.json.ok === false);
  }
  ok("…and wrote nothing", fs.readdirSync(path.join(dir, "audit")).length === 0);
  const rec = { rows: { "n1-1": { comp: "Button", check: "a check", sev: "warn" } }, libraries: {}, runs: {}, meta: {} };
  ok("PUT /data takes a record", (await ask("PUT", "/data", { origin: SELF, body: rec })).json.ok === true);
  ok("…and GET /data returns it as written", JSON.stringify((await ask("GET", "/data")).json.rows) === JSON.stringify(rec.rows));
  for (const p of ["__proto__.polluted", "rows.constructor.x", "rows..x", "prototype"]) {
    const r = await post("/patch", { path: p, value: 1 });
    ok(`/patch refuses the path ${p}`, r.code === 400 && r.json.error === "bad_path");
  }
  ok("/patch with no path is a 400", (await post("/patch", { value: 1 })).code === 400);
  ok("/patch merges one path into the record", (await post("/patch", { path: "rows.n1-1", value: { done: true } })).json.ok === true
    && (await ask("GET", "/data")).json.rows["n1-1"].done === true && (await ask("GET", "/data")).json.rows["n1-1"].comp === "Button");
  ok("/ruling with no text is a 400", (await post("/ruling", { text: "  " })).code === 400);
  ok("/ruling with no context document says where it looked, and writes nothing", /no context document/.test((await post("/ruling", { text: "a ruling" })).json.error));

  // the site it serves
  const building = await ask("GET", "/");
  ok("before the site's first build the service says it is being built, not a bare 404", building.code === 503 && /being built/.test(building.text));
  fs.mkdirSync(path.join(dir, "site", "page"), { recursive: true });
  fs.writeFileSync(path.join(dir, "site", "index.html"), "<h1>home</h1>");
  fs.writeFileSync(path.join(dir, "site", "page", "index.html"), "<h1>page</h1>");
  fs.writeFileSync(path.join(dir, "site", "404.html"), "<h1>not here</h1>");
  ok("the site's index is served", (await ask("GET", "/")).text === "<h1>home</h1>");
  ok("a folder is served as its index", (await ask("GET", "/page")).text === "<h1>page</h1>");
  for (const p of ["/../secret.txt", "/%2e%2e/secret.txt", "/page/%2e%2e/%2e%2e/secret.txt"]) {
    const r = await ask("GET", p);
    ok(`a path out of the site is never served (${p})`, r.code === 404 && !r.text.includes("outside the site"));
  }
  ok("a page that is not there gets the site's own 404 page", (await ask("GET", "/gone", { accept: "text/html" })).text === "<h1>not here</h1>");
  ok("an unknown route that is not a GET is a 404", (await post("/nothing", {})).code === 404);

  ok("the service is still up and logged no crash", (await ask("GET", "/health")).code === 200 && !/TypeError|ReferenceError/.test(log), log);
  console.log(`${n}/${n} passed`);
} finally { done(); }
process.exit(0);
