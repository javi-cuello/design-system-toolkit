// Executes assets/fetch-queue.js — the copy-in pattern from
// references/network-fetch-patterns.md — with no browser and no Figma.
// Run: node tests/test-fetch-queue.mjs   (exits non-zero on failure)
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";

const src = readFileSync(fileURLToPath(new URL("../assets/fetch-queue.js", import.meta.url)), "utf8");
// setTimeout is injected so the retry's delays are recorded and run on demand.
const timers = [];
const fakeSetTimeout = (fn, ms) => { timers.push({ fn, ms }); };
const flushTimers = () => { while (timers.length) timers.shift().fn(); };
const { createFetchQueue, retryOrFail } = new Function("setTimeout", `${src}; return { createFetchQueue, retryOrFail };`)(fakeSetTimeout);

const tick = () => new Promise((r) => setTimeout(r, 0));
let failures = 0;
async function check(name, fn) {
  try { await fn(); console.log(`ok   ${name}`); }
  catch (e) { failures++; console.log(`FAIL ${name}\n     ${e.message}`); }
}

await check("never runs more than `max` jobs at once, and runs them all", async () => {
  const q = createFetchQueue(3);
  let running = 0, peak = 0;
  const job = (v) => () => { running++; peak = Math.max(peak, running); return new Promise((r) => setTimeout(() => { running--; r(v); }, 2)); };
  const out = await Promise.all(Array.from({ length: 10 }, (_, i) => q(job(i))));
  assert.equal(peak, 3);
  assert.deepEqual(out, [...Array(10).keys()]);
});

await check("a rejection reaches its caller and frees its slot", async () => {
  const q = createFetchQueue(1);
  await assert.rejects(q(() => Promise.reject(new Error("cors"))), /cors/);
  assert.equal(await q(() => Promise.resolve("next")), "next");
});

await check("a job that throws synchronously rejects and does not stall the queue", async () => {
  const q = createFetchQueue(1);
  await assert.rejects(q(() => { throw new Error("sync"); }), /sync/);
  const after = await Promise.race([q(() => Promise.resolve("ran")), tick().then(tick).then(() => "stalled")]);
  assert.equal(after, "ran");
});

const fakeObserver = () => {
  const watched = new Set(), log = [];
  return { watched, log, observe: (c) => { log.push(watched.has(c) ? "noop" : "observe"); watched.add(c); }, unobserve: (c) => { log.push("unobserve"); watched.delete(c); } };
};

await check("retries up to maxRetries, re-observing from unobserved each time", async () => {
  const card = { dataset: { loaded: "1" } }, obs = fakeObserver();
  obs.watched.add(card);  // still observed after a failed load, as in a real callback
  assert.equal(retryOrFail(card, obs, 2), true);
  assert.equal(card.dataset.loaded, "");
  flushTimers();
  assert.equal(retryOrFail(card, obs, 2), true);
  flushTimers();
  assert.deepEqual(obs.log, ["unobserve", "observe", "unobserve", "observe"]);
});

await check("a retry waits a growing delay before re-observing, never at once", async () => {
  const card = { dataset: { loaded: "1" } }, obs = fakeObserver();
  obs.watched.add(card);
  retryOrFail(card, obs, 3);
  assert.equal(obs.watched.has(card), false, "not re-observed synchronously");
  retryOrFail(card, obs, 3);
  assert.deepEqual(timers.map((t) => t.ms), [500, 1000]);
  flushTimers();
  assert.equal(obs.watched.has(card), true);
});

await check("past maxRetries it stops observing and reports the terminal state", async () => {
  const card = { dataset: { retries: "3", loaded: "1" } }, obs = fakeObserver();
  obs.watched.add(card);
  assert.equal(retryOrFail(card, obs, 3), false);
  assert.equal(obs.watched.has(card), false);
  assert.equal(card.dataset.retries, "4");
});

console.log(failures ? `\n${failures} failed` : "\nall passed");
process.exit(failures ? 1 : 0);
