// Runs scripts/find-grid-instances.js against a fake page — no Figma needed.
// The script is figma_execute-shaped (top-level await and return), so it is
// wrapped in an async function with a mock `figma` global, as the bridge does.
// Run: node tests/test-find-grid-instances.mjs   (exits non-zero on failure)
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";

const src = readFileSync(fileURLToPath(new URL("../scripts/find-grid-instances.js", import.meta.url)), "utf8");
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
// the session prepends the library's settings, as the bridge call does (`const TOKENS = …;`)
const run = (figma, TOKENS = { ratiosGrid: "_Ratios grid" }) => new AsyncFunction("figma", "TOKENS", src)(figma, TOKENS);

const inst = (id, name, mainName, children = []) => ({
  id, name, type: "INSTANCE", children,
  getMainComponentAsync: async () => (mainName ? { name: mainName } : null),
});
const text = (name, characters) => ({ name, type: "TEXT", characters });

const nodes = [
  inst("1:1", "Grey matrix", "_Ratios grid", [text("Title", "Grey"), { name: "Content", type: "FRAME" }]),
  inst("1:2", "Button", "Button"),
  inst("1:3", "Detached", null),
  inst("1:4", "Green matrix", "_Ratios grid", []),
  inst("1:5", "Lookalike", "_Ratios grid copy", [text("Title", "Purple")]),
];
const page = { findAllWithCriteria: ({ types }) => nodes.filter((n) => types.includes(n.type)) };

let failures = 0;
async function check(name, fn) {
  try { await fn(); console.log(`ok   ${name}`); }
  catch (e) { failures++; console.log(`FAIL ${name}\n     ${e.message}`); }
}

await check("matches the main component by exact name only", async () => {
  const r = await run({ currentPage: page });
  assert.deepEqual(r.map((x) => x.id), ["1:1", "1:4"]);
});
await check("returns the Title text, or null when there is none", async () => {
  const r = await run({ currentPage: page });
  assert.equal(r[0].title, "Grey");
  assert.equal(r[1].title, null);
});
await check("an instance with no resolvable main component is skipped, not thrown on", async () => {
  const r = await run({ currentPage: { findAllWithCriteria: () => [inst("9:9", "x", null)] } });
  assert.deepEqual(r, []);
});

await check("the component's name is the settings', never one written in the script", async () => {
  const r = await run({ currentPage: page }, { ratiosGrid: "_Ratios grid copy" });
  assert.deepEqual(r.map((x) => x.id), ["1:5"]);
});
await check("without the settings it says what to prepend, rather than matching a name of its own", async () => {
  await assert.rejects(run({ currentPage: page }, {}), /prepend the library's settings/);
});

console.log(failures ? `\n${failures} failed` : "\nall passed");
process.exit(failures ? 1 : 0);
