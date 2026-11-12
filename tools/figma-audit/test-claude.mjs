#!/usr/bin/env node
// The /claude proxy against a fake API (FIGMA_AUDIT_TEST_API): what it sends, the cap on what a page may ask for, and
// the port guard the other tests step around (FIGMA_AUDIT_TEST_PORT). No real key and no call out.
// Run: node tools/figma-audit/test-claude.mjs
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { onFreePort, freePort } from "../shared/free-port.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
let pass = 0, fail = 0;
const ok = (name, c, why = "") => { if (c) { pass++; console.log("ok", name); } else { fail++; console.log("FAIL " + name + (why ? "\n" + why : "")); } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "audit-claude-"));
fs.mkdirSync(path.join(dir, "audit")); fs.mkdirSync(path.join(dir, "projects"));
fs.writeFileSync(path.join(dir, "key"), "sk-ant-test-" + "x".repeat(40));

// the fake API: keeps each body it is sent and answers as the Messages API does
const sent = [];
const api = http.createServer((req, res) => {
  let b = ""; req.on("data", (c) => { b += c; });
  req.on("end", () => { sent.push({ path: req.url, key: req.headers["x-api-key"], body: JSON.parse(b) }); res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ model: "claude-sonnet-5", content: [{ type: "text", text: "fine" }], stop_reason: "end_turn", usage: { input_tokens: 10, output_tokens: 2 } })); });
});
await new Promise((r) => api.listen(0, "127.0.0.1", r));

let server = null, log = "";
process.on("exit", () => { if (server) server.kill(); fs.rmSync(dir, { recursive: true, force: true }); });
const up = await onFreePort([await freePort()], async (port) => {
  const s = server = spawn("node", [path.join(HERE, "server.mjs"), "--data", path.join(dir, "audit"), "--port", String(port), "--key-file", path.join(dir, "key")],
    { stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, ANTHROPIC_API_KEY: "", FIGMA_AUDIT_TEST_PORT: "1", FIGMA_AUDIT_TEST_API: `http://127.0.0.1:${api.address().port}`, TOOLKIT_PROJECTS_ROOT: path.join(dir, "projects") } });
  s.stdout.on("data", (c) => { log += c; }); s.stderr.on("data", (c) => { log += c; });
  for (let i = 0; i < 80 && !log.includes("figma audit") && s.exitCode === null; i++) await sleep(100);
  if (!log.includes("figma audit")) { s.kill(); throw new Error(`the service never started:\n${log}`); }
});
if (!up) throw new Error("the port the system picked was taken before the service bound it: run again");
const PORT = up.port;
const post = (body) => new Promise((resolve, reject) => {
  const req = http.request({ host: "127.0.0.1", port: PORT, method: "POST", path: "/claude", headers: { host: `localhost:${PORT}`, origin: `http://localhost:${PORT}`, "content-type": "application/json" } }, (res) => {
    let t = ""; res.on("data", (c) => { t += c; }); res.on("end", () => resolve(JSON.parse(t)));
  });
  req.on("error", reject); req.end(JSON.stringify(body));
});
const asked = async (max_tokens) => { await post({ prompt: "x", max_tokens }); return sent.at(-1).body.max_tokens; };

const first = await post({ prompt: "say fine" });
ok("the proxy calls the API with the key and the prompt, and answers with its text and spend", first.ok && first.text === "fine" && first.spend.input === 10
  && sent[0].path === "/v1/messages" && /^sk-ant-test-/.test(sent[0].key) && sent[0].body.messages[0].content === "say fine", JSON.stringify({ first, sent: sent[0] }));
ok("no max_tokens is 2000", sent[0].body.max_tokens === 2000);
ok("a page's largest ask, the judge's 16000, is sent as asked", await asked(16000) === 16000);
ok("more than that is capped at 16000", await asked(999999) === 16000 && await asked("1e400") === 16000);
ok("a negative, zero, fraction or word never reaches the API as one", await asked(-5) === 1 && await asked(0.5) === 1 && await asked(100.7) === 100 && await asked("abc") === 2000);
server.kill(); api.close();

// the guard the seam steps around still holds without it
const out = spawnSync("node", [path.join(HERE, "server.mjs"), "--data", path.join(dir, "audit"), "--port", "9999"], { encoding: "utf8", env: { ...process.env, FIGMA_AUDIT_TEST_PORT: "" }, timeout: 20000 });
ok("a port outside the bridge's range is refused without the test seam", out.status !== 0 && /--port must be a whole number in 9223–9232/.test(out.stderr), out.stderr);
console.log(`${pass}/${pass + fail} passed`);
process.exit(fail ? 1 : 0);
