#!/usr/bin/env node
// The plugin socket of server.mjs, driven over a real connection: who may hold
// a file's slot, and whose answer counts. Run: node tools/figma-audit/test-socket.mjs
//
// The client is the third-party Desktop Bridge, which sends `Origin: null` and
// no token, so a page in the browser can open the same socket. What these hold
// is that such a page can neither take an open file from the plugin nor answer
// a call sent to it (toolkit review, 2026-10-31).
import assert from "node:assert/strict";
import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { decoder } from "./frames.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
let n = 0;
const ok = (name, cond) => { n++; assert.ok(cond, name); console.log("ok", name); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// a free port in the range the bridge scans, which the server insists on
const free = (port) => new Promise((done) => { const s = net.createServer(); s.once("error", () => done(false)); s.listen(port, "127.0.0.1", () => s.close(() => done(true))); });
let PORT = 0;
for (let p = 9223; p <= 9232 && !PORT; p++) if (await free(p)) PORT = p;
if (!PORT) { console.log("every port the bridge scans (9223–9232) is taken, so the socket cannot be tested here"); process.exit(1); }

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "audit-socket-"));
fs.mkdirSync(path.join(dir, "audit"));
const server = spawn("node", [path.join(HERE, "server.mjs"), "--data", path.join(dir, "audit"), "--port", String(PORT)], { stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, ANTHROPIC_API_KEY: "" } });
let log = "";
server.stdout.on("data", (c) => { log += c; });
server.stderr.on("data", (c) => { log += c; });
const done = () => { server.kill(); fs.rmSync(dir, { recursive: true, force: true }); };
process.on("exit", done);
for (let i = 0; i < 80 && !log.includes("figma audit"); i++) await sleep(100);
if (!log.includes("figma audit")) { console.log(`the service never started:\n${log}`); process.exit(1); }

/* A client frame: masked, as RFC 6455 requires of a client. */
function frame(op, payload = Buffer.alloc(0)) {
  const mask = Buffer.from([1, 2, 3, 4]), p = Buffer.from(payload);
  const head = p.length < 126 ? Buffer.from([0x80 | op, 0x80 | p.length]) : Buffer.concat([Buffer.from([0x80 | op, 0x80 | 126]), Buffer.from([p.length >> 8, p.length & 255])]);
  return Buffer.concat([head, mask, Buffer.from(p.map((b, i) => b ^ mask[i % 4]))]);
}
/* A socket the way the bridge opens one; `pongs: false` acts out a runtime Figma tore down. */
function connect({ host = `localhost:${PORT}`, origin = "null", pongs = true } = {}) {
  return new Promise((resolve) => {
    const s = net.connect(PORT, "127.0.0.1");
    const c = { s, got: [], closed: false, upgraded: false, send: (o) => s.write(frame(1, JSON.stringify(o))) };
    let head = Buffer.alloc(0);
    const feed = decoder();
    s.on("data", (d) => {
      if (!c.upgraded) {
        head = Buffer.concat([head, d]);
        const end = head.indexOf("\r\n\r\n");
        if (end < 0) return;
        c.upgraded = /^HTTP\/1\.1 101/.test(head.toString());
        d = head.subarray(end + 4);
        resolve(c);
      }
      for (const ev of feed(d)) {
        if (ev.type === "ping" && pongs) s.write(frame(10, ev.data));
        if (ev.type === "text") c.got.push(JSON.parse(ev.data.toString()));
      }
    });
    s.on("close", () => { c.closed = true; resolve(c); });
    s.on("error", () => {});
    s.write(`GET / HTTP/1.1\r\nHost: ${host}\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==\r\nSec-WebSocket-Version: 13\r\nOrigin: ${origin}\r\n\r\n`);
  });
}
// 127.0.0.1, not localhost: the service holds only that stack, and localhost may resolve to another listener on ::1
const base = `http://127.0.0.1:${PORT}`;
const status = async () => (await (await fetch(`${base}/status`)).json());
const exec = (code, fileKey) => fetch(`${base}/exec`, { method: "POST", headers: { origin: base, "content-type": "application/json" }, body: JSON.stringify({ code, fileKey, timeout: 4000 }) }).then((r) => r.json());
const waitFor = async (f, ms = 6000) => { for (let t = 0; t < ms; t += 50) { if (await f()) return true; await sleep(50); } return false; };

try {
  const rebound = await connect({ host: `attacker.example:${PORT}` });
  ok("a socket for another Host is refused, as the HTTP routes refuse it", !rebound.upgraded && rebound.closed);

  const none = await exec("return 0");
  ok("a call with no plugin connected says so, and is not left waiting", none.ok === false && none.error === "plugin_not_connected");

  const plugin = await connect();
  ok("the bridge's socket, Origin null, is taken", plugin.upgraded);
  plugin.send({ type: "FILE_INFO", data: { fileKey: "FILE", fileName: "Real library" } });
  await waitFor(async () => (await status()).files.some((f) => f.fileName === "Real library"));

  // one file open and a socket beside it that never said its file: a call naming no file goes to the file's plugin,
  // and the silent socket is neither counted as a file nor sent the call
  const mute = await connect();
  await sleep(200);
  const st = await status();
  ok("a socket that never said its file is not listed as an open file", mute.upgraded && st.plugin === true && st.files.length === 1 && st.files[0].fileKey === "FILE");
  const lone = exec("return 3");
  ok("with one file open, a call naming no file goes to that file's plugin, never to the silent socket beside it",
    await waitFor(async () => plugin.got.some((m) => m.method === "EXECUTE_CODE" && m.params.code === "return 3")) && !mute.got.length);
  plugin.send({ id: plugin.got.find((m) => m.params && m.params.code === "return 3").id, result: { lone: true } });
  ok("…and its answer comes back", (await lone).result.lone === true);
  const absent = await exec("return 4", "NOT-OPEN");
  ok("a call naming a file that is not open is refused, never sent to the open one", absent.ok === false && absent.error === "wrong_file_not_open" && !plugin.got.some((m) => m.params && m.params.code === "return 4"));
  mute.s.destroy();

  const page = await connect();
  page.send({ type: "FILE_INFO", data: { fileKey: "FILE", fileName: "Posing page" } });
  await waitFor(async () => page.closed);
  const held = (await status()).files.find((f) => f.fileKey === "FILE");
  ok("a second socket cannot take an open file whose socket still answers", page.closed && held && held.fileName === "Real library" && !plugin.closed);

  // a call to the file goes to the plugin; another socket answering its id is not taken
  const other = await connect();
  const call = exec("return 1", "FILE");
  await waitFor(async () => plugin.got.some((m) => m.method === "EXECUTE_CODE" && m.params.code === "return 1"));
  const sent = plugin.got.find((m) => m.method === "EXECUTE_CODE" && m.params.code === "return 1");
  ok("the call is sent down the file's own socket only", !!sent && !other.got.length);
  other.send({ id: sent.id, result: { forged: true } });
  await sleep(200);
  plugin.send({ id: sent.id, result: { real: true } });
  const answer = await call;
  ok("an answer counts only from the socket the call was sent to", answer.ok && answer.result && answer.result.real === true && !answer.result.forged);

  // a runtime Figma tore down: still connected, never answering, so a reconnect takes the file
  const dead = await connect({ pongs: false });
  dead.send({ type: "FILE_INFO", data: { fileKey: "GONE", fileName: "Reloaded" } });
  await waitFor(async () => (await status()).files.some((f) => f.fileKey === "GONE"));
  const back = await connect();
  back.send({ type: "FILE_INFO", data: { fileKey: "GONE", fileName: "Reloaded, again" } });
  ok("a socket that no longer answers gives its file to the reconnect", await waitFor(async () => (await status()).files.some((f) => f.fileName === "Reloaded, again")) && await waitFor(async () => dead.closed));

  // a call whose socket closes fails at once, and only that call
  const lost = exec("return 2", "GONE");
  await waitFor(async () => back.got.some((m) => m.method === "EXECUTE_CODE"));
  back.s.destroy();
  const failed = await lost;
  ok("a call whose socket closed fails at once, not timing out", failed.ok === false && failed.error === "plugin_not_connected");
  // Figma runs one plugin a file: the snapshot closes the bridge, so the next call names the file to reopen
  const reopen = await exec("return 5", "GONE");
  ok("a call for a file whose plugin closed names that file and why it closes", reopen.error === "wrong_file_not_open"
    && /^Run the bridge plugin in "Reloaded, again" again\. It is no longer connected; running another plugin in that file, such as the snapshot, closes it\./.test(reopen.hint), reopen.hint);

  // two claims on a silent holder at once: the first takes it, and the second is asked of the new holder, not let in
  const stale = await connect({ pongs: false });
  stale.send({ type: "FILE_INFO", data: { fileKey: "RACE", fileName: "Stale" } });
  await waitFor(async () => (await status()).files.some((f) => f.fileKey === "RACE"));
  const first = await connect(), second = await connect();
  first.send({ type: "FILE_INFO", data: { fileKey: "RACE", fileName: "First" } });
  second.send({ type: "FILE_INFO", data: { fileKey: "RACE", fileName: "Second" } });
  await waitFor(async () => stale.closed && (first.closed || second.closed), 9000);
  const race = (await status()).files.find((f) => f.fileKey === "RACE");
  ok("two claims racing on a silent holder leave one, and it answers", race && first.closed !== second.closed && race.fileName === (first.closed ? "Second" : "First"));
  // a call naming no file: never to a socket that has not said which file it is, nor a guess among several
  const silent = await connect();
  await new Promise((r) => setTimeout(r, 200));
  const unnamed = await exec("return 1");
  await new Promise((r) => setTimeout(r, 200));
  ok("a call naming no file is not sent to a socket that never said its file, nor to one of several open files", unnamed.ok === false && unnamed.error === "several_files_open_name_one" && !silent.got.some((m) => m.method === "EXECUTE_CODE"));
  console.log(`${n}/${n} passed`);
} finally { done(); }
process.exit(0);
