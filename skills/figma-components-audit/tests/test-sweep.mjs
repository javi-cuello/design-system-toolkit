// The fingerprint sweep (scanner/sweep.js) on the real library slice test-audit
// uses, through a stand-in for the `figma` global built from it: one print per
// component set on the pages the audit walks, the same print for the same file,
// and a print that moves for what the sweep says it reads and only for that.
//   node skills/figma-components-audit/tests/test-sweep.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, "..", "scanner", "sweep.js"), "utf8");
const FX = JSON.parse(readFileSync(join(here, "fixtures", "library-slice.json"), "utf8"));
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
let n = 0;
const ok = (name, cond, why = "") => { n++; assert.ok(cond, `${name}${why ? `\n${why}` : ""}`); console.log("ok", name); };

/* The file as the Plugin API shows it: pages that load, parents linked, a typed search over descendants. */
function figmaOf(given) {
  const fx = JSON.parse(JSON.stringify(given));   // its own copy: the links make it circular
  const link = (node, parent) => { node.parent = parent; for (const c of node.children || []) link(c, node); return node; };
  const all = (node, types, out = []) => { for (const c of node.children || []) { if (types.includes(c.type)) out.push(c); all(c, types, out); } return out; };
  const pages = fx.pages.map((p) => link({ type: "PAGE", name: p.name, children: p.sets, loadAsync: async () => {}, findAllWithCriteria({ types }) { return all(this, types); } }, null));
  return { root: { name: fx.file.name || "Library", children: pages }, fileKey: fx.file.key || "KEY", loadAllPagesAsync: async () => {} };
}
const sweep = (fx, tokens = fx.settings.tokens) => new AsyncFunction("figma", "TOKENS", src)(figmaOf(fx), tokens);
const fresh = () => JSON.parse(JSON.stringify(FX));
const setNamed = (fx, name) => fx.pages.flatMap((p) => p.sets).find((s) => s.name === name);

const first = await sweep(fresh());
const names = FX.pages.flatMap((p) => p.sets.map((s) => s.name));
ok("one print for every component set on a component page", Object.keys(first.sets).sort().join() === [...names].sort().join() && names.length === 8, Object.keys(first.sets).join(", "));
ok("it says which file it read, so a diff against another file can be refused", first.fileKey === figmaOf(FX).fileKey && first.fileName === figmaOf(FX).root.name && !Number.isNaN(Date.parse(first.at)));
const again = await sweep(fresh());
ok("the same file prints the same", JSON.stringify(again.sets) === JSON.stringify(first.sets));

// what moves a print, and what does not
const moved = async (change) => { const fx = fresh(); change(fx); const r = await sweep(fx); return Object.keys(first.sets).filter((k) => r.sets[k] !== first.sets[k]); };
const target = names[0];
ok("binding a variable on a layer moves that set's print, and no other's",
  JSON.stringify(await moved((fx) => { setNamed(fx, target).children[0].boundVariables = { ...setNamed(fx, target).children[0].boundVariables, zzz: { id: "x" } }; })) === JSON.stringify([target]));
ok("a layer renamed moves it", JSON.stringify(await moved((fx) => { setNamed(fx, target).children[0].children[0].name += " renamed"; })) === JSON.stringify([target]));
ok("a property's options changed move it", JSON.stringify(await moved((fx) => { const d = setNamed(fx, target).componentPropertyDefinitions; const axis = Object.keys(d).find((k) => d[k].type === "VARIANT"); d[axis].variantOptions = [...d[axis].variantOptions, "Extra"]; })) === JSON.stringify([target]));
ok("a layer hidden moves it", JSON.stringify(await moved((fx) => { setNamed(fx, target).children[0].children[0].visible = false; })) === JSON.stringify([target]));
ok("a colour changed without a binding does not: the sweep reads structure and bindings, not values", (await moved((fx) => { setNamed(fx, target).children[0].fills = [{ type: "SOLID", color: { r: 1, g: 0, b: 0 } }]; })).length === 0);

// which pages it reads: the audit's rule, from the project's tokens
const section = FX.pages.find((p) => new RegExp(FX.settings.tokens.sectionHeader).test(p.name) && FX.pages.indexOf(p) > 0 && FX.pages.slice(FX.pages.indexOf(p) + 1).some((q) => q.sets.length));
const skipped = await sweep(fresh(), { ...FX.settings.tokens, excludeSections: [section.name] });
const after = FX.pages.slice(FX.pages.indexOf(section) + 1);
const nextSection = after.findIndex((p) => new RegExp(FX.settings.tokens.sectionHeader).test(p.name));
const inSection = (nextSection < 0 ? after : after.slice(0, nextSection)).flatMap((p) => p.sets.map((s) => s.name));
ok(`a section the project excludes (${section.name}) is not swept, and the rest are`, inSection.length > 0 && inSection.every((s) => !(s in skipped.sets)) && Object.keys(skipped.sets).length === names.length - inSection.length);
const noPages = await sweep(fresh(), { ...FX.settings.tokens, componentPages: "^nothing matches$" });
ok("pages the component-page rule does not match are not swept", Object.keys(noPages.sets).length === 0);
console.log(`${n}/${n} passed`);
