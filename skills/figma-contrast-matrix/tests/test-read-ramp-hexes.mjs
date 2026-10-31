// Runs scripts/read-ramp-hexes.js against a fake ramp — no Figma needed. The
// script is figma_execute-shaped (top-level await and return), so it is wrapped
// in an async function with a mock `figma`, as the bridge does; its constants
// are filled by replacing their empty defaults, as the agent does.
// Run: node tests/test-read-ramp-hexes.mjs   (exits non-zero on failure)
import { readFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import assert from "node:assert/strict";

const src = readFileSync(fileURLToPath(new URL("../scripts/read-ramp-hexes.js", import.meta.url)), "utf8");
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
const fill = (name, value) => {
  const out = src.replace(`const ${name} = "";`, `const ${name} = ${JSON.stringify(value)};`);
  assert.notEqual(out, src, `the script still declares an empty ${name}`);
  return out;
};
const run = (code, figma) => new AsyncFunction("figma", code)(figma);

const solid = (r, g, b, opacity = 1) => ({ type: "SOLID", visible: true, opacity, color: { r, g, b } });
const SCALE = Array.from({ length: 12 }, (_, i) => 1 - i / 11);       // light to dark
function column(i, rowFills) {
  return { name: "Swatches", type: "FRAME", children: rowFills.map((f, r) => ({ name: "Row " + (r + 1), type: "FRAME", fills: f })) };
}
function ramp(id, opts = {}) {
  const cols = SCALE.slice(0, opts.steps || 12).map((v, i) => column(i, [[solid(v, v, 1)], [solid(v, 1, v)]]));
  if (opts.mutate) opts.mutate(cols);
  // each step column wraps its Swatches, as a ramp's step layout does
  const steps = cols.map((c, i) => ({ name: "Step " + (i + 1), type: "FRAME", children: [{ name: "Label", type: "TEXT" }, c] }));
  const all = (n) => (n.children || []).flatMap((c) => [c, ...all(c)]);
  const inst = { id, name: "Blue ramp", type: "INSTANCE", children: steps, getMainComponentAsync: async () => ({ name: opts.main || "_Colour ramp" }) };
  inst.findAll = (fn) => all(inst).filter(fn);
  return inst;
}
const frameWith = (id, children) => ({ id, name: "Blue", type: "FRAME", children });
const world = (frame) => ({
  getNodeByIdAsync: async (id) => (id === frame.id ? frame : null),
  currentPage: { children: [frame] },
});

let failures = 0;
async function check(name, fn) {
  try { await fn(); console.log(`ok   ${name}`); }
  catch (e) { failures++; console.log(`FAIL ${name}\n     ${e.message}`); }
}
const rejects = (p, re) => assert.rejects(p, re);

await check("reads both rows of all 12 steps, in step order, as #RRGGBB", async () => {
  const fr = frameWith("1:1", [ramp("1:2")]);
  const r = await run(fill("FRAME_ID", "1:1"), world(fr));
  const a = r.row1.split(","), b = r.row2.split(",");
  assert.equal(a.length, 12);
  assert.equal(a[0], "#FFFFFF");
  assert.equal(a[11], "#0000FF");
  assert.equal(b[11], "#00FF00");
  assert.equal(r.instance, "1:2");
});
await check("finds the frame by name on the current page, and the ramp as a child by its main component", async () => {
  const fr = frameWith("1:1", [{ id: "1:5", name: "Note", type: "INSTANCE", children: [], getMainComponentAsync: async () => ({ name: "Sticky" }) }, ramp("1:9")]);
  const r = await run(fill("FRAME_NAME", "Blue"), world(fr));
  assert.equal(r.instance, "1:9");
});
await check("the list it returns is what build-matrix-script.py accepts for --color-a", async () => {
  const fr = frameWith("1:1", [ramp("1:2")]);
  const r = await run(fill("FRAME_ID", "1:1"), world(fr));
  const map = fileURLToPath(new URL("../references/node-map.example.json", import.meta.url));
  const py = fileURLToPath(new URL("../scripts/build-matrix-script.py", import.meta.url));
  const dir = mkdtempSync(join(tmpdir(), "ramp-"));
  try {
    // throws on a non-zero exit, which is how the builder refuses a malformed or short list (case A7)
    execFileSync("python3", [py, "--node-map", map, "--instance", "9:9", "--color-a", r.row1, "--color-a-name", "Blue",
      "--out", join(dir, "apply.js")], { stdio: "pipe" });
    assert.match(readFileSync(join(dir, "apply.1.js"), "utf8"), /#FFFFFF/i);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
await check("a ramp without 12 Swatches columns throws, never returns a short list", async () => {
  await rejects(run(fill("FRAME_ID", "1:1"), world(frameWith("1:1", [ramp("1:2", { steps: 11 })]))), /11 Swatches columns, expected 12/);
});
await check("a translucent or non-solid step throws, naming the step and row", async () => {
  await rejects(run(fill("FRAME_ID", "1:1"), world(frameWith("1:1", [ramp("1:2", { mutate: (c) => { c[3].children[1].fills = [solid(0, 0, 0, 0.5)]; } })]))), /step 4, row 2 is 50% opaque/);
  await rejects(run(fill("FRAME_ID", "1:1"), world(frameWith("1:1", [ramp("1:2", { mutate: (c) => { c[0].children[0].fills = [{ type: "GRADIENT_LINEAR", visible: true }]; } })]))), /step 1, row 1 is a GRADIENT_LINEAR/);
});
await check("a frame whose only instance is another component throws, rather than reading it", async () => {
  await rejects(run(fill("FRAME_ID", "1:1"), world(frameWith("1:1", [ramp("1:2", { main: "Ramp copy" })]))), /no direct child instance of "_Colour ramp"/);
});
await check("empty constants and a missing frame throw", async () => {
  await rejects(run(src, world(frameWith("1:1", []))), /both empty/);
  await rejects(run(fill("FRAME_ID", "7:7"), world(frameWith("1:1", []))), /no frame found for id "7:7"/);
});

console.log(failures ? `\n${failures} failed` : "\nall passed");
process.exit(failures ? 1 : 0);
