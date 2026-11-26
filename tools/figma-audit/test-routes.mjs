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
import { onFreePort, freePort } from "../shared/free-port.mjs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
let n = 0;
const ok = (name, cond, why = "") => { n++; assert.ok(cond, `${name}${why ? `\n${why}` : ""}`); console.log("ok", name); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));


// a scratch project: its audit folder, no context document, no site yet, and no project list, so nothing real is read
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "audit-routes-"));
fs.mkdirSync(path.join(dir, "audit"));
fs.mkdirSync(path.join(dir, "projects"));
fs.writeFileSync(path.join(dir, "secret.txt"), "outside the site");
let server = null, log = "";
const done = () => { if (server) server.kill(); fs.rmSync(dir, { recursive: true, force: true }); };
process.on("exit", done);
// a port the system picks, outside the bridge's range under the service's test seam: a real Desktop Bridge plugin never
// dials in (it scans 9223–9232, the flake this had), and a machine whose ten bridge ports are all held still runs it
const up = await onFreePort([await freePort()], async (port) => {
  log = "";
  const s = server = spawn("node", [path.join(HERE, "server.mjs"), "--data", path.join(dir, "audit"), "--port", String(port), "--key-file", path.join(dir, "no-key")],
  { stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, FIGMA_TOKEN: "", FIGMA_TOKEN_FILE: path.join(dir, "no-figma-token"), ANTHROPIC_API_KEY: "", FIGMA_AUDIT_TEST_PORT: "1", TOOLKIT_PROJECTS_ROOT: path.join(dir, "projects") } });
  s.stdout.on("data", (c) => { log += c; });
  s.stderr.on("data", (c) => { log += c; });
  for (let i = 0; i < 80 && !log.includes("figma audit") && s.exitCode === null; i++) await sleep(100);
  if (!log.includes("figma audit")) { s.kill(); throw new Error(`the service never started:\n${log}`); }
});
if (!up) throw new Error("the port the system picked was taken before the service bound it: run again");
const PORT = up.port;

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
  // snapshot-standard 11: the [::1] half is held too, so no console MCP can take it and answer the plugin in its place
  const six = await new Promise((resolve) => { const r = http.request({ host: "::1", port: PORT, path: "/status", headers: { host: `localhost:${PORT}` } }, (res) => { let t = ""; res.on("data", (c) => { t += c; }); res.on("end", () => { let json = null; try { json = JSON.parse(t); } catch {} resolve({ code: res.statusCode, json }); }); }); r.on("error", (e) => resolve({ code: 0, error: e.code })); r.end(); });
  // a machine with no IPv6 loopback has no [::1] to take (EADDRNOTAVAIL, EAFNOSUPPORT): said, never failed
  if (/^EADDRNOTAVAIL$|^EAFNOSUPPORT$/.test(six.error || "")) console.log(`skip [::1]: ${six.error} on this machine`);
  else ok("the service answers on [::1] too, and says nothing holds it in its place", six.code === 200 && six.json && six.json.loopback6Clash === null, JSON.stringify(six));
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
    && st.supervised === false /* run by hand, no IPC parent: nothing brings it back (check-services' judge reads it) */
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

  // the audit's stages and the live tokens and icons checks (skills/figma-project-audit/scripts/stages.json)
  const sc = (await ask("GET", "/scripts")).json;
  ok("/scripts serves the audit's one list of stages", sc && sc.stages && sc.stages.stages.some((s) => s.id === "tokens" && s.runners.includes("dashboard")));
  // every stage the dashboard runs fetches its gather script by the key the registry names (gather.served)
  const unserved = sc.stages.stages.filter((s) => s.gather && s.runners.includes("dashboard") && typeof sc[s.gather.served] !== "string").map((s) => `${s.id} → ${s.gather.served}`);
  ok("/scripts serves every stage's gather script under the key stages.json names", unserved.length === 0, unserved.join(", "));
  // own components, but no record says the file is their only user (the scratch project has no context document)
  const facts = { fileKey: "K1", tokens: { collections: { Base: { modes: ["Value"], values: { Value: { "Space/4": 4 } }, alias: { Value: {} }, descriptions: {} } }, textStyles: [], effects: [] },
    icons: [{ name: "plus", size: 16, unbound: 1 }], iconSets: ["plus"], iconPage: "Icons", used: [], components: 3 };
  const lc = await post("/library-checks", { facts, fileKey: "K1" });
  ok("/library-checks runs the tokens and icons checks on live facts", lc.json.ok && lc.json.tokens.findings.some((f) => f.rule === "tokens-description") && lc.json.icons.findings.some((f) => f.rule === "icons-fill"));
  ok("…and where the record does not give the file both the tokens and the components role, runs no unused check, whatever components it has", !lc.json.tokens.ran.includes("tokens-unused"));
  ok("…and says which of the two stages apply, for the page's appliesTo", JSON.stringify(lc.json.applies) === JSON.stringify({ tokens: true, icons: true }));
  ok("/library-checks refuses facts read from another file", (await post("/library-checks", { facts, fileKey: "K2" })).json.ok === false);
  ok("/library-checks without facts is a 400", (await post("/library-checks", { fileKey: "K1" })).code === 400);
  { const fr = (await ask("GET", "/freshness", { origin: SELF })).json;
    ok("/freshness with no Figma token marks no file and says why", fr.ok && !Object.keys(fr.files).length && /no Figma token/.test(fr.note), JSON.stringify(fr)); }
  ok("/audit-stored without a fileKey is a 400", (await post("/audit-stored", {})).code === 400);
  { const st = (await post("/audit-stored", { fileKey: "K1" })).json;
    ok("/audit-stored on a service with no stored tokens says so, never files nothing as a clean run", st.ok === false && /no tokens snapshot/.test(st.error), JSON.stringify(st)); }

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
  // a key no record and no routing names creates no record of its own (/rows's guard, on every writer)
  { const r = await post("/patch", { path: "rows.n1-1", value: { done: true }, lib: "NOT-A-LIBRARY" });
    ok("/patch naming a library this project does not know is refused, and creates no record", r.code === 400 && /does not know the file key/.test(r.json.error) && !fs.existsSync(path.join(dir, "audit", "NOT-A-LIBRARY.json"))); }
  { const r = await ask("PUT", "/data?lib=NOT-A-LIBRARY", { origin: SELF, body: rec });
    ok("PUT /data naming a library this project does not know is refused, and creates no record", r.code === 400 && !fs.existsSync(path.join(dir, "audit", "NOT-A-LIBRARY.json"))); }
  ok("/patch with null at a top-level key is refused, every row kept", (await post("/patch", { path: "rows", value: null })).code === 400
    && (await post("/patch", { path: "rows" })).code === 400 && (await ask("GET", "/data")).json.rows["n1-1"].comp === "Button");
  ok("/patch with null inside the record stores null, which readers take as none", (await post("/patch", { path: "rows.n1-1.note", value: null })).json.ok === true
    && (await ask("GET", "/data")).json.rows["n1-1"].note === null);
  ok("/ruling with no text is a 400", (await post("/ruling", { text: "  " })).code === 400);
  ok("/ruling with no context document says where it looked, and writes nothing", /no context document/.test((await post("/ruling", { text: "a ruling" })).json.error));
  {
    // a ruling recorded, then taken back: the document reads as it did before, and taking back one not there says so
    const ctxFile = path.join(dir, "design-system-context.md");
    const before = fs.readFileSync(path.join(HERE, "..", "..", "skills", "figma-context-capture", "assets", "context-template.md"), "utf8");
    fs.writeFileSync(ctxFile, before);
    ok("/ruling records a ruling", (await post("/ruling", { text: "Keep the raw stroke", where: "Alert" })).json.ok === true && fs.readFileSync(ctxFile, "utf8").includes("Keep the raw stroke"));
    ok("/ruling with remove takes it back, the document as before it", (await post("/ruling", { text: "Keep the raw stroke", remove: true })).json.removed === true && fs.readFileSync(ctxFile, "utf8") === before);
    ok("/ruling with remove on a ruling not there says absent and writes nothing", (await post("/ruling", { text: "Keep the raw stroke", remove: true })).json.absent === true && fs.readFileSync(ctxFile, "utf8") === before);
    ok("/ruling with remove other than true writes nothing", (await post("/ruling", { text: "Keep the raw stroke", where: "Alert" })).json.ok === true && (await post("/ruling", { text: "Keep the raw stroke", remove: "false" })).json.already === true);
    // several at once, on a document long enough that its read is an await another request runs in: each reads the
    // document after the one before wrote, so none is lost (unqueued, six of these lost two to four)
    fs.writeFileSync(ctxFile, before + "\n<!-- " + "x".repeat(4e6) + " -->\n");
    const extra = ["Third", "Fourth", "Fifth", "Sixth"].map((w) => post("/ruling", { text: w + " at once", where: "Badge" }));
    const both = await Promise.all([post("/ruling", { text: "First at once", where: "Alert" }), post("/ruling", { text: "Second at once", where: "Chip" }), ...extra]);
    const after = fs.readFileSync(ctxFile, "utf8");
    ok("each /ruling call answers the date cell it wrote, one per row", new Set(both.map((r) => r.json.date)).size === 6 && both.every((r) => /^\d{4}-\d\d-\d\d[b-z]?$/.test(r.json.date)), both.map((r) => r.json.date).join(" "));
    const dateOf = (w) => both[["First", "Second", "Third", "Fourth", "Fifth", "Sixth"].indexOf(w)].json.date;
    ok("six /ruling calls at once all land in §6", both.every((r) => r.json.ok === true) && ["First", "Second", "Third", "Fourth", "Fifth", "Sixth"].every((w) => after.includes(w + " at once")), both.map((r) => JSON.stringify(r.json)).join("\n"));
    // taken back under a name it was not recorded with, and no ruling day: another component's row, whose finding it
    // still closes (a row closed by it before rulingAlready marked such rows), so it stays
    const elsewhere = (await post("/ruling", { text: "Second at once", where: "Chip renamed", remove: true })).json;
    ok("/ruling remove under another component keeps that component's row and says so", elsewhere.ok === true && elsewhere.elsewhere === true && fs.readFileSync(ctxFile, "utf8").includes("Second at once"), JSON.stringify(elsewhere));
    // the same, with the date cell its record call answered: the component renamed, so its own row goes
    { const r = (await post("/ruling", { text: "Second at once", where: "Chip renamed", ruledOn: dateOf("Second"), remove: true })).json;
      ok("/ruling remove under a renamed component, ruled the day the row was recorded, takes it back", r.removed === true && !fs.readFileSync(ctxFile, "utf8").includes("Second at once"), JSON.stringify(r)); }
    ok("/ruling remove on the component it was recorded on takes it back", (await post("/ruling", { text: "First at once", where: "Alert", remove: true })).json.removed === true && !fs.readFileSync(ctxFile, "utf8").includes("First at once"));
    // two dashboard rows of one text the same day (a document from before the duplicate refusal), neither on this component: refused
    const twice = fs.readFileSync(ctxFile, "utf8").replace(/^(\| .*\| Third at once \|.*\n)/m, (row) => row + row.replace("on Badge", "on Card"));
    fs.writeFileSync(ctxFile, twice);
    // (a page from before `ruledOn`: the day of its ruledAt, read from the row, so a run across midnight still holds)
    const which = (await post("/ruling", { text: "Third at once", where: "Chip", ruledAt: dateOf("Third").slice(0, 10) + "T12:00:00.000Z", remove: true })).json;
    ok("/ruling remove with two rows of that text that day on other components removes nothing and says so", which.ok === false && /2 rows/.test(which.error) && fs.readFileSync(ctxFile, "utf8") === twice, JSON.stringify(which));
    ok("/ruling remove with two rows takes back the one on its own component", (await post("/ruling", { text: "Third at once", where: "Card", remove: true })).json.removed === true && fs.readFileSync(ctxFile, "utf8").split("Third at once").length === 2);
    // the same component's row from another day, beside the one ruled: `ruledOn` takes back that row and no other
    const two = fs.readFileSync(ctxFile, "utf8").replace(/^(\| .*\| Fourth at once \|.*\n)/m, (row) => row + row.replace(/^\| [^|]+\|/, "| 2026-01-02 |").replace("on Badge.", "on Badge, about: other."));
    fs.writeFileSync(ctxFile, two);
    { const r = (await post("/ruling", { text: "Fourth at once", where: "Badge renamed", ruledOn: dateOf("Fourth"), remove: true })).json;
      ok("/ruling remove by its date cell takes back that row and not the same component's row of another day", r.removed === true && fs.readFileSync(ctxFile, "utf8").split("Fourth at once").length === 2 && fs.readFileSync(ctxFile, "utf8").includes("| 2026-01-02 |"), JSON.stringify(r)); }
    // a row under this very component re-dated by hand: neither taken by name nor called another's
    { const doc = fs.readFileSync(ctxFile, "utf8"), redated = doc.replace(/^\| [^|]+(\| Audit \| Sixth at once \|)/m, "| 2026-02-03 $1");
      fs.writeFileSync(ctxFile, redated);
      const r = (await post("/ruling", { text: "Sixth at once", where: "Badge", ruledOn: dateOf("Sixth"), remove: true })).json;
      ok("/ruling remove of its own component's row re-dated by hand is refused, not answered elsewhere", redated !== doc && r.ok === false && /another date/.test(r.error) && fs.readFileSync(ctxFile, "utf8") === redated, JSON.stringify(r)); }
    // the same under its own name: the date cell first, so the other day's row on Badge still stays
    { const r = (await post("/ruling", { text: "Fifth at once", where: "Badge", ruledOn: dateOf("Fifth"), remove: true })).json;
      ok("/ruling remove under its own name keeps that component's row of another day", r.removed === true && fs.readFileSync(ctxFile, "utf8").includes("| 2026-01-02 |"), JSON.stringify(r)); }
    // a take-back that removed its line while its row did not reopen: the row still holds the date cell, so the next
    // ruling that day is not given it (a retry of that take-back would otherwise remove the newer ruling)
    { const rec = (await post("/ruling", { text: "Held date", where: "Tag" })).json;
      const recFile = fs.readdirSync(path.join(dir, "audit")).filter((f) => f.endsWith(".json"))[0];
      const data = JSON.parse(fs.readFileSync(path.join(dir, "audit", recFile), "utf8"));
      data.rows = data.rows || {}; data.rows["held-row"] = { ruledOn: rec.date, ruling: "Held date", done: true };
      fs.writeFileSync(path.join(dir, "audit", recFile), JSON.stringify(data));
      const back = (await post("/ruling", { text: "Held date", where: "Tag", ruledOn: rec.date, remove: true })).json;
      const next = (await post("/ruling", { text: "After the held date", where: "Tag" })).json;
      ok("a date cell a row still holds is not given to the next ruling", rec.ok && back.removed === true && next.ok === true && next.date && next.date !== rec.date, JSON.stringify({ rec, back, next }));
      delete data.rows["held-row"]; fs.writeFileSync(path.join(dir, "audit", recFile), JSON.stringify(data)); }
    // written by hand: the maintainer strikes it in the document, the page never removes it
    const hand = before.replace(/^(\| \{date\} \|.*\n)/m, "$1| 2026-11-10 | Audit | Hand rule | Decided in review | Maintainer |  |  |\n");
    fs.writeFileSync(ctxFile, hand);
    const byHand = (await post("/ruling", { text: "Hand rule", where: "Alert", remove: true })).json;
    ok("/ruling remove on a ruling written by hand answers byHand and writes nothing", hand !== before && byHand.ok === false && byHand.byHand === true && fs.readFileSync(ctxFile, "utf8") === hand, JSON.stringify(byHand));
    fs.rmSync(ctxFile);
  }

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
