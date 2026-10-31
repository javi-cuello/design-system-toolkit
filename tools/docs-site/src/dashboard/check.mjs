#!/usr/bin/env node
// Static checks for the dashboard: its markup (Dashboard.astro), its modules
// (*.js here) and its stylesheet. These are the failures that parse fine and
// still break the page.
//
//   node tools/docs-site/src/dashboard/check.mjs
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { parse } from "@babel/parser";

const here = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(here, "Dashboard.astro"), "utf8");
const css = readFileSync(join(here, "dashboard.css"), "utf8");
// The browser modules; data.js and this file run at build time, in node.
const moduleFiles = readdirSync(here).filter((f) => f.endsWith(".js") && f !== "data.js");
const sources = Object.fromEntries(moduleFiles.map((f) => [f, readFileSync(join(here, f), "utf8")]));
const js = Object.values(sources).join("\n");
const fail = [];

// 1. Every name a module uses is declared in it, imported by it, or a browser
//    global; every import names something its module exports. A name nothing
//    declares parses fine and throws only when its line runs: one owner
//    filter threw on every chip but All for half a day, because deleting a
//    counter took the line declaring `shown` with it. Scope-aware (functions,
//    blocks, params, destructuring), so a local that shadows a module-level
//    name is its own.
const GLOBALS = new Set("Array Boolean CSS Date Error JSON Math Object Promise Set Map String Number clearInterval clearTimeout console document encodeURIComponent decodeURIComponent RegExp fetch localStorage location setInterval setTimeout undefined window history requestAnimationFrame matchMedia IntersectionObserver ResizeObserver Node Event navigator addEventListener dispatchEvent".split(" "));
const declaredIn = (p, out) => {
  if (!p) return;
  if (p.type === "Identifier") out.push(p.name);
  else if (p.type === "ObjectPattern") for (const x of p.properties) declaredIn(x.type === "RestElement" ? x.argument : x.value, out);
  else if (p.type === "ArrayPattern") p.elements.forEach((e) => declaredIn(e, out));
  else if (p.type === "AssignmentPattern") declaredIn(p.left, out);
  else if (p.type === "RestElement") declaredIn(p.argument, out);
};
const blockDecls = (stmts) => {
  const names = [];
  for (let s of stmts) {
    if (s.type === "ExportNamedDeclaration" && s.declaration) s = s.declaration;
    if (s.type === "VariableDeclaration" && s.kind !== "var") s.declarations.forEach((d) => declaredIn(d.id, names));
    if (s.type === "FunctionDeclaration" || s.type === "ClassDeclaration") names.push(s.id.name);
    if (s.type === "ImportDeclaration") s.specifiers.forEach((sp) => names.push(sp.local.name));
    // `export { date as fmtDate } from "../lib/format.js"` exports fmtDate and
    // declares nothing. Without this the checker read a re-export as an empty
    // export list and failed every importer of it — which is what a module
    // does when it stops keeping its own copy of something the site owns.
    if (s.type === "ExportNamedDeclaration" && !s.declaration) s.specifiers.forEach((sp) => names.push(sp.exported.name));
  }
  return names;
};
const varDecls = (node, out = []) => {
  if (!node || typeof node !== "object") return out;
  if (Array.isArray(node)) { node.forEach((n) => varDecls(n, out)); return out; }
  if (node.type === "VariableDeclaration" && node.kind === "var") node.declarations.forEach((d) => declaredIn(d.id, out));
  if (/Function/.test(node.type)) return out;
  for (const k of Object.keys(node)) if (!["loc", "start", "end"].includes(k)) varDecls(node[k], out);
  return out;
};
const SKIP = new Set(["loc", "start", "end", "type", "extra", "leadingComments", "trailingComments", "innerComments"]);
function freeNames(root) {
  const free = new Set();
  const patternDefaults = (p, scope) => {
    if (!p) return;
    if (p.type === "AssignmentPattern") { walk(p.right, scope, p, "right"); patternDefaults(p.left, scope); }
    else if (p.type === "ObjectPattern") p.properties.forEach((x) => { if (x.computed) walk(x.key, scope, x, "key"); patternDefaults(x.type === "RestElement" ? x.argument : x.value, scope); });
    else if (p.type === "ArrayPattern") p.elements.forEach((e) => patternDefaults(e, scope));
    else if (p.type === "RestElement") patternDefaults(p.argument, scope);
  };
  const walk = (node, scope, parent, key) => {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) { node.forEach((n) => walk(n, scope, parent, key)); return; }
    const t = node.type;
    if (t === "Identifier") {
      if (parent && /MemberExpression/.test(parent.type) && key === "property" && !parent.computed) return;
      if (parent && /Object(Property|Method)|Class(Method|Property)/.test(parent.type) && key === "key" && !parent.computed) return;
      if (parent && /Labeled|Break|Continue/.test(parent.type)) return;
      if (!scope.has(node.name)) free.add(node.name);
      return;
    }
    if (/Function|ObjectMethod|ClassMethod/.test(t) && t !== "FunctionDeclaration" || t === "FunctionDeclaration") {
      const inner = new Set(scope);
      if (node.id && t === "FunctionExpression") inner.add(node.id.name);
      const params = []; node.params.forEach((p) => declaredIn(p, params)); params.forEach((n) => inner.add(n));
      if (t !== "ArrowFunctionExpression") inner.add("arguments");
      varDecls(node.body).forEach((n) => inner.add(n));
      node.params.forEach((p) => patternDefaults(p, inner));
      if (node.computed && node.key) walk(node.key, scope, node, "key");
      walk(node.body, inner, node, "body");
      return;
    }
    if (t === "BlockStatement" || t === "Program") {
      const inner = new Set(scope); blockDecls(node.body).forEach((n) => inner.add(n));
      node.body.forEach((s) => walk(s, inner, node, "body"));
      return;
    }
    if (/^For(In|Of)?Statement$/.test(t)) {
      const inner = new Set(scope); const init = node.init || node.left;
      if (init && init.type === "VariableDeclaration") init.declarations.forEach((d) => { const n = []; declaredIn(d.id, n); n.forEach((x) => inner.add(x)); });
      for (const k of ["init", "test", "update", "left", "right", "body"]) if (node[k]) walk(node[k], inner, node, k);
      return;
    }
    if (t === "CatchClause") { const inner = new Set(scope); if (node.param) { const n = []; declaredIn(node.param, n); n.forEach((x) => inner.add(x)); } walk(node.body, inner, node, "body"); return; }
    if (t === "VariableDeclarator") { patternDefaults(node.id, scope); if (node.init) walk(node.init, scope, node, "init"); return; }
    if (t === "ImportDeclaration") return;
    // `export { x as y } from "…"` names nothing in this module's scope: the
    // local side is the OTHER module's name, not a use of one here.
    if (t === "ExportNamedDeclaration" && node.source) return;
    for (const k of Object.keys(node)) if (!SKIP.has(k)) walk(node[k], scope, node, k);
  };
  walk(root, new Set(), null, null);
  return free;
}
const exportsOf = {}, importsOf = {}, reExported = {};
for (const [f, src] of Object.entries(sources)) {
  let ast;
  try { ast = parse(src, { sourceType: "module" }); } catch (e) { fail.push(`${f} does not parse: ${e.message}`); continue; }
  exportsOf[f] = new Set(blockDecls(ast.program.body.filter((s) => s.type === "ExportNamedDeclaration")));
  // `export { x } from './y.js'` is ONE thing under two paths, not two
  // meanings — `dashboard/format.js` deliberately re-exports the site's
  // date, plural and escape so both render the same way.
  reExported[f] = new Set(ast.program.body
    .filter((s) => s.type === "ExportNamedDeclaration" && s.source)
    .flatMap((s) => s.specifiers.map((sp) => sp.exported?.name).filter(Boolean)));
  importsOf[f] = ast.program.body.filter((s) => s.type === "ImportDeclaration").map((s) => ({ from: s.source.value.replace(/^\.\//, ""), names: s.specifiers.map((sp) => sp.imported?.name) }));
  for (const n of freeNames(ast.program)) if (!GLOBALS.has(n)) fail.push(`${f}: ${n} is used but nothing declares or imports it`);
}
for (const [f, list] of Object.entries(importsOf))
  for (const { from, names } of list) {
    if (!exportsOf[from]) { fail.push(`${f} imports ./${from}, which is not a module here`); continue; }
    for (const n of names) if (!exportsOf[from].has(n)) fail.push(`${f} imports ${n} from ./${from}, which does not export it`);
  }

// 2. Every getElementById must name an id the markup actually has, or the
//    call returns null and the listener throws on a page that looks fine.
// A <Modal id="x"> renders its heading as id="x-title" (components/Modal.astro).
const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]));
for (const m of html.matchAll(/<Modal\b[^>]*\bid="([^"]+)"/g)) ids.add(m[1] + "-title");
for (const m of js.matchAll(/getElementById\(\s*"([^"]+)"\s*\)/g))
  if (!ids.has(m[1])) fail.push(`getElementById("${m[1]}") — no such id in the markup`);

/*
 * 3. No two modules export the same name.
 *
 * `labels.js` exports `ownerLabel(o, codeTarget, target)` and `owners.js`
 * exports a wrapper of the same name, `(o, target)`, that fills the code
 * target in. Which one a file gets depends on which it imported, and the
 * signatures differ — so a call written for one, in a file that imported the
 * other, renders a label rather than throwing. It is wrong and it is silent.
 *
 * That cost three wrong labels in one day, twice on the same line: the owner
 * filter showed "Web build 53 · Web build 11", one name for two queues, and
 * the MUI queue was unreachable because nothing said which chip it was.
 *
 * Check 1 already proves every imported name exists somewhere; this proves
 * the name means ONE thing. A wrapper keeps its own name now — `labelFor` is
 * the inner one — so the import says which you meant.
 */
{
  const where = new Map();
  for (const [file, names] of Object.entries(exportsOf))
    for (const name of names) {
      if ((reExported[file] || new Set()).has(name)) continue;
      if (!where.has(name)) where.set(name, []);
      where.get(name).push(file);
    }
  /*
   * `tools/docs-site/src/lib/` too, because the dashboard imports from it and one
   * of the three wrong labels lived there. A check written in response to a
   * defect that does not cover where the defect happened is a check that
   * would not have caught it.
   */
  const libDir = join(here, "..", "lib");
  for (const f of readdirSync(libDir).filter((x) => x.endsWith(".js"))) {
    const src = readFileSync(join(libDir, f), "utf8");
    let ast;
    try { ast = parse(src, { sourceType: "module" }); } catch (e) { continue; }
    for (const name of blockDecls(ast.program.body.filter((s2) => s2.type === "ExportNamedDeclaration"))) {
      if (!where.has(name)) where.set(name, []);
      where.get(name).push("lib/" + f);
    }
  }
  for (const [name, files] of where)
    if (files.length > 1)
      fail.push(`"${name}" is exported by ${files.join(" and ")} — one name, two meanings; a call written for one silently renders wrong when the other was imported`);
}

//    Adding a check
//    means touching four files; forgetting one is silent — a rule with no
//    bucket lands in the default bucket, a check missing from the catalogue is
//    invisible to the About tab AND to scoring's "unscanned" arithmetic, and a
//    rule with no dimension quietly scores nothing. This is the check that
//    lets someone add a check without re-reading the page.
// ONE SOURCE for the audit. Every stage hands `fileStage` a `read` whose
// `source` names where its trees came from, and an audit reads the live
// file (toolkit-standard §D 5). This fails on a second value or a missing
// one. It would have fired: the validator stage read the stored snapshot
// for a fortnight, three other stages read Figma, and nine reviews compared
// code against code without asking which stages obey the standard.
{
  const src = sources["audit.js"];
  // Calls, not the definition: the first argument is the owner, a string or OWNER.
  const calls = [...src.matchAll(/fileStage\(\s*(?:"[a-z-]+"|OWNER)\s*,[^;]*?\{([^}]*)\}/gs)].map((m) => m[1]);
  const sourcesNamed = calls.map((c) => (c.match(/source:\s*"([^"]+)"/) || [])[1] || null);
  if (calls.length < 4) fail.push(`audit.js has ${calls.length} fileStage calls — four stages file rows`);
  const distinct = new Set(sourcesNamed);
  if (sourcesNamed.some((s) => !s)) fail.push(`a fileStage call names no source — every stage says where its trees came from`);
  if (distinct.size !== 1 || !distinct.has("figma")) fail.push(`audit stages read from ${[...distinct].join(", ")} — an audit reads one source, the live file`);
}

// ONE caller of the rows route. Every stage files through `fileStage` in
// audit.js, which is the page's one statement of the closing contract
// (full, scope, exhaustive, ran). Four hand-assembled payloads each forgot a
// different field — `full: true` with no scope three times, a scope of 120
// blanks once — and a fifth caller would forget a fifth.
for (const [f, src] of Object.entries(sources)) {
  const n = (src.match(/api\.rows\(/g) || []).length;
  const want = f === "audit.js" ? 1 : 0;
  if (n !== want) fail.push(`${f} calls api.rows ${n} time${n === 1 ? "" : "s"} — rows are filed through fileStage in audit.js, and only there`);
}

const SCANNER = join(here, "..", "..", "..", "..", "skills", "figma-components-audit", "scanner");
const read = (f) => JSON.parse(readFileSync(join(SCANNER, f), "utf8"));
try {
  const audit = readFileSync(join(SCANNER, "audit.js"), "utf8");
  const emitted = new Set([...audit.matchAll(/rule:\s*"([a-z]+)"/g)].map((m) => m[1]));
  const buckets = read("buckets.json");
  const scoring = read("scoring.json");
  const checks = read("checks.json");
  const measures = read("measures.json");

  const bucketed = new Set(["b1", "b2", "b3"].flatMap((b) => buckets[b] || []));
  const scored = new Set(Object.values(scoring.dimensions).flatMap((d) => d.rules || []));
  for (const r of emitted) {
    if (!bucketed.has(r)) fail.push(`audit.js emits rule "${r}" with no bucket in buckets.json`);
    if (!scored.has(r)) fail.push(`audit.js emits rule "${r}" with no dimension in scoring.json`);
  }
  // And the reverse: a rule wired but emitted by nothing is dead, unless its dimension has no
  // scanner check yet (all backlog or session), where the score already counts it unscanned.
  for (const [name, def] of Object.entries(scoring.dimensions)) for (const r of def.rules || []) {
    if (emitted.has(r)) continue;
    const dim = checks.dimensions.find((d) => d.dimension === def.catalogue);
    if (dim && dim.checks.some((c) => c.status === "scanner")) fail.push(`scoring.json wires rule "${r}" (${name}) and audit.js never emits it, though its catalogue claims a scanner check`);
  }

  // Every scoring dimension must name a catalogue entry, or "unscanned is not
  // 100" silently treats it as scanned.
  const dimNames = new Set(checks.dimensions.map((d) => d.dimension));
  for (const [name, def] of Object.entries(scoring.dimensions))
    if (!dimNames.has(def.catalogue || name))
      fail.push(`scoring.json dimension "${name}" points at catalogue "${def.catalogue || name}", which checks.json does not have`);

  // Catalogue entries must carry a status the arithmetic understands.
  const STATUS = new Set(["scanner", "session", "backlog", "rule"]);
  for (const d of checks.dimensions)
    for (const c of d.checks)
      if (!STATUS.has(c.status)) fail.push(`checks.json: "${d.dimension}" has a check with status "${c.status}"`);

  // Measure templates may only name metric keys the scanner actually produces,
  // plus the two derived for templates. A typo here renders an empty string.
  const produced = new Set([...(audit.match(/measures\s*=\s*\{[\s\S]*?\n\};?/) || [""])[0]
    .matchAll(/(\w+)\s*:/g)].map((m) => m[1]));
  ["boundTotal", "contrastShort", "openFindings", "totalFindings"].forEach((k) => produced.add(k));
  for (const m of measures.measures) {
    // A `backlog` measure names inputs nothing records yet — that is its whole
    // point, and the day its check lands the assertion below flips it over.
    if (m.status === "backlog") {
      const v0 = m.value || {};
      const inputs = v0.of ? [v0.of] : v0.num ? [v0.num, v0.den] : (v0.sum || []);
      if (inputs.every((k) => produced.has(k)))
        fail.push(`measures.json "${m.key}" is marked backlog, but the scanner now records every input it needs — flip it to "scanner"`);
      continue;
    }
    for (const tpl of [m.detail, m.detailWhenNotGood, m.why])
      for (const ref of [...String(tpl || "").matchAll(/\{(\w+)\}/g)].map((x) => x[1]))
        if (!produced.has(ref)) fail.push(`measures.json "${m.key}" references {${ref}}, which the scanner does not record`);
    const v = m.value || {};
    for (const k of (v.of ? [v.of] : v.num ? [v.num, v.den] : (v.sum || [])))
      if (!produced.has(k)) fail.push(`measures.json "${m.key}" reads metric "${k}", which the scanner does not record`);
  }
} catch (e) {
  fail.push("could not validate the skill's scanner artifacts: " + e.message);
}

// Every stylesheet's braces balance. A stray `}` costs nothing standalone —
// the browser drops it — but the docs site wraps this stylesheet in
// `@scope (.dash) { … }`, where it closes the scope early: everything after it
// applied to the whole site unscoped, and the scope's own closing brace then
// swallowed the next rule. One sat after the token block for weeks.
{
  let depth = 0, low = 0;
  for (const ch of css.replace(/\/\*[\s\S]*?\*\//g, "")) { if (ch === "{") depth++; else if (ch === "}") low = Math.min(low, --depth); }
  if (depth || low < 0) fail.push(`dashboard.css: braces do not balance (ends at depth ${depth}, dips to ${low})`);
}

// Every custom property the page reads is defined, here or in the site's
// UI system (styles/system.css). A var() nothing defines makes its
// declaration drop without a word; the dashboard and the docs site moved onto
// one set of token names at once, which is exactly where one gets missed.
const system = readFileSync(join(here, "..", "styles", "system.css"), "utf8");
const site = readFileSync(join(here, "..", "styles", "site.scss"), "utf8");
const defined = new Set([...(css + system + site).matchAll(/(--[a-z0-9-]+)\s*:/g)].map((m) => m[1]));
for (const m of js.matchAll(/setProperty\(\s*["'](--[a-z0-9-]+)/g)) defined.add(m[1]);
const reads = new Set([...(css + js + html).matchAll(/var\((--[a-z0-9-]+)\s*\)/g)].map((m) => m[1]));
for (const v of reads) if (!defined.has(v)) fail.push(`var(${v}) is read with no fallback and nothing defines it`);

// Nothing of Node's reaches the browser. The dashboard's modules import
// from ../lib, and a lib module that imports project.js (createRequire,
// node:fs) or a node: module parses, bundles, and throws on load in the
// browser — "createRequire is not a function", the whole dashboard dead,
// from a date helper that began reading the project's language. Followed
// transitively from the browser modules.
{
  const seen = new Set(), queue = moduleFiles.map((f) => join(here, f));
  while (queue.length) {
    const file = queue.pop(); if (seen.has(file)) continue; seen.add(file);
    const src = readFileSync(file, "utf8");
    for (const m of src.matchAll(/^\s*(?:import|export)\b[^;]*?from\s+["']([^"']+)["']/gm)) {
      const spec = m[1];
      if (/^node:|^(fs|path|url|module|child_process|os)$/.test(spec)) fail.push(`${file.slice(here.length + 1)} reaches the browser and imports ${spec}`);
      else if (spec.startsWith(".")) {
        const target = join(dirname(file), spec);
        if (/\/lib\/(project|snapshot|tracker)\.js$/.test(target)) fail.push(`${file.slice(here.length - 9)} reaches the browser and imports ${spec}, a build-time module`);
        else queue.push(target);
      }
    }
  }
}

if (fail.length) { for (const f of fail) console.error("FAIL  " + f); process.exit(1); }
console.log(`pass — dashboard: ${moduleFiles.length} modules, every name and import resolves, ${ids.size} ids`);
