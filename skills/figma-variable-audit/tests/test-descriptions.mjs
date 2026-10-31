// Runs the description check in node against fixture facts, with no Figma.
//   node skills/figma-variable-audit/tests/test-descriptions.mjs
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, "..", "scripts", "descriptions.js"), "utf8");
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
const checkDescriptions = await new AsyncFunction(src)();

let failed = 0, passed = 0;
function expect(name, got, want) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (ok) passed++; else { failed++; console.log("FAIL " + name + "\n  got  " + JSON.stringify(got) + "\n  want " + JSON.stringify(want)); }
}
const P = "Primitive - Color", S = "Semantic", B = "Semantic - Brand", ST = "Primitive - Color static";
const prim = (name, coll = P) => ({ name, collection: coll, description: "", targets: [] });
const sem = (name, description, targets, coll = S) => ({ name, collection: coll, description,
  targets: targets.map(([n, c]) => ({ name: n, collection: c || P })) });
const base = [prim("Palette/Amber/3"), prim("Palette/Yellow/3"), prim("Palette/Gray/Alpha/11"),
  prim("Brand/Alpha/3"), prim("Brand/Beta/3"), prim("Black/base", ST), prim("White/base", ST),
  prim("Shadow/Composite/Input field/input field")];
const kinds = (r) => r.findings.map((f) => f.variable + " | " + f.kind);

// Found live on 2026-09-22: eight Warning tokens cited Yellow while aliasing Amber.
let r = checkDescriptions([...base,
  sem("Color/Background/Feedback/Warning/primary", "A warning background.\n\nAliases → Palette/Yellow/3", [["Palette/Amber/3"], ["Palette/Amber/3"]])]);
expect("a description naming the wrong step of the aliased collection is raised", kinds(r),
  ["Color/Background/Feedback/Warning/primary | target"]);
expect("and the finding names both sides", r.findings[0].text,
  "description names Palette/Yellow/3 but the variable aliases Palette/Amber/3");

r = checkDescriptions([...base,
  sem("Color/Background/Feedback/Warning/primary", "Aliases → Palette/Amber/3", [["Palette/Amber/3"], ["Palette/Amber/3"]])]);
expect("a description naming the real target raises nothing", kinds(r), []);

// Found live the same day: descriptions still named Utilities/* after the move.
r = checkDescriptions([...base,
  sem("Color/Text/Neutral/primary", "Aliases → Light: Palette/Gray/Alphas/11 · Dark: Utilities/White/white",
    [["Palette/Gray/Alpha/11"], ["White/base", ST]])]);
expect("a named path that no longer exists is raised, once per path", r.findings.map((f) => f.kind + " " + f.text.split('"')[1]),
  ["missing Palette/Gray/Alphas/11"]);
expect("a stale path under an unknown root is not read as a claim", r.findings.some((f) => /Utilities/.test(f.text)), false);

r = checkDescriptions([...base,
  sem("Color/Text/Neutral/primary", "Aliases → Light: Palette/Gray/Alpha/11 · Dark: White/base",
    [["Palette/Gray/Alpha/11"], ["White/base", ST]])]);
expect("targets in two collections, each named, raise nothing", kinds(r), []);

// Prose: relative names and namesakes in another collection are not claims.
r = checkDescriptions([...base, prim("Color/Layer/base", S),
  sem("Color/Background/Neutral/secondary", "One step back from Neutral/primary.\n\nAliases → Palette/Gray/Alpha/11", [["Palette/Gray/Alpha/11"]]),
  sem("Color/Layer/base", "Paired with Semantic's own Color/Layer/base.\n\nAliases → Alpha: Brand/Alpha/3 · Beta: Brand/Beta/3",
    [["Brand/Alpha/3"], ["Brand/Beta/3"]], B)]);
expect("relative names and a namesake in an unaliased collection raise nothing", kinds(r), []);

r = checkDescriptions([...base,
  sem("Color/Layer/base", "Aliases → Alpha: Brand/Alpha/3", [["Brand/Alpha/3"], ["Brand/Beta/3"]], B)]);
expect("a target the description leaves out is raised", kinds(r), ["Color/Layer/base | target"]);

r = checkDescriptions([...base, sem("Effect", "Uses Shadow/Composite/Input field/input field", [])]);
expect("a named path containing a space still resolves", kinds(r), []);

expect("measures count what was read, so a zero can be told from a dead probe",
  checkDescriptions([...base, sem("Color/X", "Aliases → Palette/Amber/3", [["Palette/Amber/3"]])]).measures,
  { variables: 9, described: 1, mentions: 1, broken: 0 });

console.log((failed ? "FAIL" : "pass") + " — " + passed + " of " + (passed + failed) + " assertions");
process.exit(failed ? 1 : 0);
