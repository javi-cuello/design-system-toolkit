#!/usr/bin/env node
// node tools/docs-site/test-changelog.mjs — what a component's change log shows
// for one entry (src/lib/facts.js, read by components/ChangeLog.astro).
import assert from "node:assert/strict";
import { factsOf } from "./src/lib/facts.js";

let n = 0;
const ok = (name, cond) => { n++; assert.ok(cond, name); console.log("ok", name); };

// Review of 2 October 2026, round 3: a layer that moved is removed from one
// parent and added under another, two notes of one name. Grouped by wording
// alone they were one row under the first note's rule, "Layer Title · Added".
const moved = factsOf({ changed: ["action-bar"], detail: { "action-bar": [
  { what: "Layer Title", before: "none", after: "added", rule: "layer-added" },
  { what: "Layer Title", before: "present", after: "removed", rule: "layer-removed" },
] } }, "action-bar");
ok("an added and a removed note of one name are two facts, each under its own rule", moved.length === 2 && moved.map((f) => f.rule).sort().join() === "layer-added,layer-removed");

// …while the same property in several variants is still one line
const variants = factsOf({ changed: ["chip"], detail: { chip: [
  { what: "Label: fill", before: "Text/strong", after: "Text/weak", rule: "values-changed" },
  { what: "Label: fill", before: "Text/strong", after: "Text/weak", rule: "values-changed" },
] } }, "chip");
ok("one property moved in two variants is one fact", variants.length === 1 && /2 variants/.test(variants[0].what));

console.log(n + "/" + n + " passed");
