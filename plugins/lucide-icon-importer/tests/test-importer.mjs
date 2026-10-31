#!/usr/bin/env node
/*
 * The importer had no test of any kind until four real defects turned up in
 * one afternoon: a stroke-weight setting that did nothing, a non-stroked path
 * that killed the whole import, a one-shape glyph that `union` refused, and
 * fill-plus-stroke children losing their interior. All four lived in
 * `buildMasterIcon`, so that is what this exercises — against a fake Figma
 * whose nodes record what was done to them, loading the shipped code.js
 * rather than a copy of it.
 *
 *   node tests/test-importer.mjs
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const code = readFileSync(join(here, '..', 'code.js'), 'utf8');
const ui = readFileSync(join(here, '..', 'ui.html'), 'utf8');

let pass = 0;
const fail = [];
const is = (got, want, what) => {
  if (JSON.stringify(got) === JSON.stringify(want)) pass++;
  else fail.push(`${what}: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);
};
const ok = (cond, what) => { if (cond) pass++; else fail.push(what); };
// A case that throws is a failure, not a crashed run: every defect this suite
// covers surfaced as an exception from inside buildMasterIcon.
const check = (what, fn) => { try { fn(); } catch (e) { fail.push(`${what}: threw "${e.message}"`); } };

/* ---- a Figma just real enough to run buildMasterIcon ------------------- */
function makeFigma(children) {
  const page = {
    on() {}, off() {}, children: [],
    appendChild(n) {
      if (n.parent && n.parent.children) n.parent.children = n.parent.children.filter((c) => c !== n);
      n.parent = page;
      page.children.push(n);
    },
  };
  const node = (props) => {
    const n = { removed: false, fills: [], strokes: [], ...props };
    n.clone = () => node({ ...n, fills: [...n.fills], strokes: [...n.strokes], cloned: true });
    n.outlineStroke = () => { const o = node({ outlinedFrom: n.id }); page.appendChild(o); return o; };
    n.remove = () => { n.removed = true; };
    return n;
  };
  const group = { children: children.map(node) };
  group.children.forEach((c) => { c.parent = group; });
  group.remove = () => { group.removed = true; group.children.forEach((c) => { if (c.parent === group) c.removed = true; }); };
  const figma = {
    // code.js registers a UI and handlers at load; the suite loads the whole
    // file so the functions under test are the shipped ones.
    ui: { onmessage: null, postMessage() {}, resize() {} },
    root: { setRelaunchData() {}, getPluginData: () => '', setPluginData() {} },
    showUI() {}, on() {}, off() {}, notify() {}, closePlugin() {}, command: '',
    clientStorage: { getAsync: async () => null, setAsync: async () => {} },
    variables: { getLocalVariablesAsync: async () => [], getVariableByIdAsync: async () => null },
    currentPage: page,
    createNodeFromSvg: () => group,
    union: (nodes) => {
      if (nodes.length < 2) throw new Error('union needs more than one node');
      nodes.forEach((n) => { if (n.removed) throw new Error('The node with id "x" does not exist'); });
      return node({ unionOf: nodes.length });
    },
    flatten: (nodes) => {
      nodes.forEach((n) => { if (n.removed) throw new Error('flatten on a removed node'); });
      return node({ unionOf: nodes[0].unionOf });
    },
  };
  return { figma, page, group };
}
const load = (figma, tail) => new Function('figma', '__html__', code + '\n' + tail)(figma, '<html></html>');
const build = (children, weight) => {
  const { figma, group } = makeFigma(children);
  const master = load(figma, 'return buildMasterIcon;')('<svg/>', weight);
  return { master, group };
};

const stroked = (id) => ({ id, strokes: [{ type: 'SOLID' }], fills: [] });
const filled = (id) => ({ id, strokes: [], fills: [{ type: 'SOLID', visible: true }] });
const both = (id) => ({ id, strokes: [{ type: 'SOLID' }], fills: [{ type: 'SOLID', visible: true }] });

check('an ordinary two-path Lucide glyph', () => {
  const { master } = build([stroked('a'), stroked('b')]);
  is(master.unionOf, 2, 'two stroked paths union into one shape');
  is(master.name, 'Icon', 'the master vector is named Icon');
});

check('the stroke weight reaches the path', () => {          // v1.10.1
  let seen = null;
  const { figma, group } = makeFigma([stroked('a')]);
  Object.defineProperty(group.children[0], 'strokeWeight', { set(v) { seen = v; }, get() { return seen; } });
  load(figma, 'return buildMasterIcon;')('<svg/>', 1.5);
  is(seen, 1.5, 'the settings stroke weight is set on the path before it is outlined');
});

check('a stroke weight of nothing leaves the SVG alone', () => {
  let seen = null;
  const { figma, group } = makeFigma([stroked('a')]);
  Object.defineProperty(group.children[0], 'strokeWeight', { set(v) { seen = v; }, get() { return seen; } });
  load(figma, 'return buildMasterIcon;')('<svg/>', undefined);
  is(seen, null, "no weight given means the SVG's own width stands");
});

check('a filled path survives its group being removed', () => {   // v1.10.2
  const { master, group } = build([filled('solo')]);
  ok(group.removed, 'the svg group is removed');
  ok(master && !master.removed, 'a single filled path still produces a master icon');
});

check('a single shape is flattened, never unioned', () => {       // v1.10.2
  const { master } = build([filled('solo')]);
  is(master.unionOf, undefined, 'union is not called with one node');
});

check('fill plus stroke keeps both the ring and its interior', () => {  // v1.11.0
  const { master } = build([both('dot')]);
  is(master.unionOf, 2, 'a filled, stroked path contributes its interior as well as its outlined ring');
});

check('a hidden fill adds no geometry', () => {
  const { master } = build([{ id: 'x', strokes: [{ type: 'SOLID' }], fills: [{ type: 'SOLID', visible: false }] }]);
  is(master.unionOf, undefined, 'an invisible fill is not resurrected as a shape');
});

check('the paste-a-list parser', () => {                          // v1.10.0
  const toKebab = new Function('return ' + ui.match(/function toKebab\(raw\)[\s\S]*?\n}/)[0])();
  is(toKebab('chevrons-up-down'), 'chevrons-up-down', 'a kebab name is left alone');
  is(toKebab('ChevronsUpDown'), 'chevrons-up-down', 'a React import name converts');
  is(toKebab('  circle-check, '), 'circle-check', 'whitespace and a trailing comma are trimmed');
  is(toKebab('"folder-open"'), 'folder-open', 'quotes are trimmed');
  is(toKebab('Loader2'), 'loader-2', 'a digit splits off, so a renamed icon surfaces as unknown rather than guessed');
  is(toKebab(''), '', 'an empty entry yields nothing');
});

check('the settings normalisers', () => {
  const api = load(makeFigma([]).figma, 'return { sizes: normalizeSizes, weight: normalizeStrokeWeight, frame: normalizeFrameName };');
  is(api.sizes('24, 16,20'), [16, 20, 24], 'sizes are cleaned, de-duplicated and sorted');
  is(api.sizes('abc'), [], 'a junk size list comes back empty rather than NaN');
  is(api.weight('0'), 2, 'a zero stroke weight falls back to the default');
  is(api.frame('   '), 'Icons', 'a blank frame name falls back to Icons');
});

console.log(fail.length ? `FAIL — ${fail.length} of ${pass + fail.length}\n  ${fail.join('\n  ')}` : `pass — ${pass} of ${pass} assertions`);
process.exit(fail.length ? 1 : 0);
