// Runs scripts/discover-node-map.js against a stand-in grid instance, no Figma
// needed. The script is figma_execute-shaped (top-level await and return), so
// it is wrapped in an async function with a stand-in `figma` and the two
// values the session prepends, as the bridge call does.
// Run: node skills/figma-contrast-matrix/tests/test-discover-node-map.mjs
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";

const src = readFileSync(fileURLToPath(new URL("../scripts/discover-node-map.js", import.meta.url)), "utf8");
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
const run = (figma, TOKENS, TARGET_INSTANCE_ID) => new AsyncFunction("figma", "TOKENS", "TARGET_INSTANCE_ID", src)(figma, TOKENS, TARGET_INSTANCE_ID);
const TOKENS = { ratiosGrid: "_Ratios grid" };

// The grid: [Title, Content]; Content is a spacer, 12 column headers, then 12
// rows of a header and 12 blocks. Each child's id is the instance address.
const props = {
  header: { "Label text#12:0": { type: "TEXT" }, "Corner#12:1": { type: "VARIANT", variantOptions: ["Yes", "No"] } },
  block: { "Label text#13:0": { type: "TEXT" }, "Contrast": { type: "VARIANT", variantOptions: ["Light", "Dark"] } },
};
function grid({ id = "5:1", mainName = "_Ratios grid", contentCount = 169, blockProps = props.block } = {}) {
  let n = 0;
  const child = (type, componentProperties) => ({ id: `I${id};0:${100 + n++}`, type, componentProperties });
  const kids = [child("FRAME")];
  for (let c = 0; c < 12; c++) kids.push(child("INSTANCE", props.header));
  for (let r = 0; r < 12; r++) { kids.push(child("INSTANCE", props.header)); for (let b = 0; b < 12; b++) kids.push(child("INSTANCE", blockProps)); }
  const title = { id: `I${id};0:1`, type: "TEXT" }, content = { id: `I${id};0:2`, type: "FRAME", children: kids.slice(0, contentCount) };
  return { id, type: "INSTANCE", children: [title, content], getMainComponentAsync: async () => (mainName ? { name: mainName } : null) };
}
const file = (...nodes) => ({ loadAllPagesAsync: async () => {}, getNodeByIdAsync: async (id) => nodes.find((x) => x.id === id) || null });

let failures = 0;
async function check(name, fn) {
  try { await fn(); console.log(`ok   ${name}`); }
  catch (e) { failures++; console.log(`FAIL ${name}\n     ${e.message}`); }
}

await check("the map holds every suffix after the instance's own id, in the documented shape", async () => {
  const m = await run(file(grid()), TOKENS, "5:1");
  const example = JSON.parse(readFileSync(fileURLToPath(new URL("../references/node-map.example.json", import.meta.url)), "utf8"));
  for (const k of Object.keys(example).filter((k) => !k.startsWith("_"))) assert.ok(k in m, `the map has ${k}, as the example does`);
  assert.equal(m.titleSuffix, "0:1");
  assert.equal(m.contentWrapperSuffix, "0:2");
  assert.equal(m.spacerSuffix, "0:100");
  assert.equal(m.columnHeaderSuffixes.length, 12);
  assert.equal(m.columnHeaderSuffixes[0], "0:101");
  assert.equal(m.rows.length, 12);
  assert.equal(m.rows[0].headerSuffix, "0:113");
  assert.equal(m.rows[0].blockSuffixes[0], "0:114");
  assert.equal(m.rows[11].blockSuffixes[11], "0:268");
});

await check("property keys are read off the instances: a header's variant is not a light/dark pair, a block's is", async () => {
  const m = await run(file(grid()), TOKENS, "5:1");
  assert.equal(m.componentPropertyKeys.header.labelText, "Label text#12:0");
  assert.equal(m.componentPropertyKeys.header.isLightDarkPair, false);
  assert.equal(m.componentPropertyKeys.block.variant, "Contrast");
  assert.equal(m.componentPropertyKeys.block.isLightDarkPair, true);
});

await check("without the settings or the instance prepended it says what to prepend", async () => {
  await assert.rejects(() => run(file(grid()), undefined, "5:1"), /prepend the library's settings/);
  await assert.rejects(() => run(file(grid()), TOKENS, ""), /prepend `const TARGET_INSTANCE_ID/);
});

await check("a node that is not there, not an instance, or not the settings' grid is refused by name", async () => {
  await assert.rejects(() => run(file(grid()), TOKENS, "9:9"), /no node found for TARGET_INSTANCE_ID "9:9"/);
  await assert.rejects(() => run(file({ id: "5:1", type: "FRAME" }), TOKENS, "5:1"), /is a FRAME, expected INSTANCE/);
  await assert.rejects(() => run(file(grid({ mainName: "Button" })), TOKENS, "5:1"), /named "Button", expected "_Ratios grid"/);
  await assert.rejects(() => run(file(grid({ mainName: null })), TOKENS, "5:1"), /no resolvable main component/);
});

await check("a restructured grid throws rather than emit a shifted map", async () => {
  await assert.rejects(() => run(file(grid({ contentCount: 168 })), TOKENS, "5:1"), /Content has 168 children, expected 169/);
  await assert.rejects(() => run(file(grid({ blockProps: { "Label text#13:0": { type: "TEXT" } } })), TOKENS, "5:1"), /first block has no VARIANT property/);
});

console.log(failures ? `\n${failures} failed` : "\nall passed");
process.exit(failures ? 1 : 0);
