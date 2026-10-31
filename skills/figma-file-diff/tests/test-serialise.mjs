// Executes scripts/serialise.js against a stub file: a component's API surface (description, property
// definitions and defaults) moves its hash, and nothing else in an equal file does.
// Run: node tests/test-serialise.mjs   (exits non-zero on failure)
import fs from "node:fs";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";

const src = fs.readFileSync(fileURLToPath(new URL("../scripts/serialise.js", import.meta.url)), "utf8");
const Async = Object.getPrototypeOf(async function () {}).constructor;
const run = (file) => new Async("figma", src)(file);

const fileOf = ({ description = "A button.", defaultValue = "Default", label = true } = {}) => {
  const variant = (name) => ({ type: "COMPONENT", name, children: [], description: "" });
  const set = { type: "COMPONENT_SET", name: "Button", description, children: [variant("Type=Default"), variant("Type=Ghost")],
    componentPropertyDefinitions: { Type: { type: "VARIANT", defaultValue, variantOptions: ["Default", "Ghost"] }, "Label#1:2": { type: "BOOLEAN", defaultValue: label } } };
  set.children.forEach((c) => { c.parent = set; });
  const page = { type: "PAGE", name: "Button", children: [set], findAllWithCriteria: () => [set, ...set.children] };
  set.parent = page; page.parent = { type: "DOCUMENT" };
  return { mixed: Symbol("mixed"), root: { name: "Library", children: [page] }, loadAllPagesAsync: async () => {},
    variables: { getLocalVariablesAsync: async () => [] }, getLocalPaintStylesAsync: async () => [], getLocalTextStylesAsync: async () => [], getLocalEffectStylesAsync: async () => [] };
};

let n = 0;
const ok = async (name, fn) => { await fn(); n++; console.log(`ok   ${name}`); };
const base = await run(fileOf());
await ok("two equal files hash the same", async () => assert.equal((await run(fileOf())).deepHash, base.deepHash));
await ok("a changed description is a difference", async () => assert.notEqual((await run(fileOf({ description: "A ghost." }))).deepHash, base.deepHash));
await ok("a changed variant default is a difference", async () => assert.notEqual((await run(fileOf({ defaultValue: "Ghost" }))).deepHash, base.deepHash));
await ok("a changed boolean default is a difference", async () => assert.notEqual((await run(fileOf({ label: false }))).deepHash, base.deepHash));
console.log(`${n} passed`);
