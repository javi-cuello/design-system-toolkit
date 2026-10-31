// Run: node plugins/organize-layers/tests/test-organize.js
//
// code.js has no module boundary — it is a Figma plugin main thread, evaluated
// against a global `figma`. So this stubs the parts it touches, evaluates the
// file in this scope, and asserts on the functions it defines. Everything here
// caught something real while the plugin was being written: the column/row
// split, gap arithmetic against unequal widths, number-aware sort, the
// Layers-panel reorder, the relaunch path's lone-container rule, and the
// settings fallbacks.

var fs = require('fs');
var path = require('path');

var failures = 0;
var checks = 0;
function ok(cond, what) {
  checks++;
  if (!cond) { failures++; console.log('  FAIL  ' + what); }
}
function eq(actual, expected, what) {
  ok(JSON.stringify(actual) === JSON.stringify(expected),
     what + '\n          expected ' + JSON.stringify(expected) + '\n          actual   ' + JSON.stringify(actual));
}

// ---- stub ------------------------------------------------------------------

var notices = [];
var closed = false;
var storage = null;

function makeNode(name, w, h, x, y, parent) {
  return { name: name, width: w, height: h, x: x, y: y, parent: parent };
}

// A parent that behaves like ChildrenMixin: appendChild moves an existing child
// to the end, which is what the reorder depends on.
function container(base) {
  base.children = [];
  base.appendChild = function (n) {
    var at = base.children.indexOf(n);
    if (at !== -1) base.children.splice(at, 1);
    base.children.push(n);
  };
  base.setRelaunchData = function (d) { base.relaunch = d; };
  return base;
}

var PAGE = container({ type: 'PAGE', selection: [] });

global.__html__ = '<html></html>';
global.figma = {
  command: undefined,
  showUI: function () {},
  on: function () {},
  skipInvisibleInstanceChildren: false,
  notify: function (m) { notices.push(m); },
  closePlugin: function () { closed = true; },
  ui: { postMessage: function () {}, onmessage: null },
  clientStorage: {
    getAsync: async function () { return storage; },
    setAsync: async function (k, v) { storage = v; }
  },
  get currentPage() { return PAGE; }
};

// The Layers panel lists children back to front, so panel order is the reverse.
function panelOrder() { return PAGE.children.slice().reverse().map(function (n) { return n.name; }); }
function names(plan) { return plan.columns.map(function (c) { return c.items.map(function (n) { return n.name; }); }); }
function places(ns) { return ns.map(function (n) { return n.name + '@' + n.x + ',' + n.y; }); }

function reset(nodes) {
  PAGE.children = [];
  nodes.forEach(function (n) { PAGE.appendChild(n); });
  PAGE.selection = [];
  notices = [];
  closed = false;
}

eval(fs.readFileSync(path.join(__dirname, '..', 'code.js'), 'utf8'));

// ---- 1 · columns come from the first part, rows from the second ------------

var a = [
  makeNode('2 - 1', 100, 50, 999, 999, PAGE),
  makeNode('1 - 3', 200, 50, 999, 999, PAGE),
  makeNode('1 - 1', 300, 50, 10, 20, PAGE),
  makeNode('3 - 1', 100, 50, 999, 999, PAGE),
  makeNode('1 - 2', 100, 50, 999, 999, PAGE),
  makeNode('1 - 10', 100, 50, 999, 999, PAGE)
];
reset(a);
settings = { delimiter: '-', grouped: true, direction: 'horizontal', gapX: 200, gapY: 80 };

var plan = buildPlan();
eq(names(plan), [['1 - 1', '1 - 2', '1 - 3', '1 - 10'], ['2 - 1'], ['3 - 1']],
   '1 · every first part is its own column; a single-layer group is never merged');
ok(names(plan)[0][3] === '1 - 10', '1 · sort is number-aware: 1 - 10 follows 1 - 3, not 1 - 1');

eq(applyPlan(plan), 6, '1 · every layer moved');

// Column 1 is 300 wide, so column 2 starts at 10 + 300 + 200. Column 2 is 100
// wide, so column 3 starts at 510 + 100 + 200. A fixed pitch would overlap.
eq(places(a).sort(),
   ['1 - 1@0,0', '1 - 10@0,390', '1 - 2@0,130', '1 - 3@0,260', '2 - 1@500,0', '3 - 1@800,0'].sort(),
   '1 · the first layer lands on 0,0, and gaps measure from each column\'s widest layer and each layer\'s own height');
ok(a.filter(function (n) { return n.x === 0 && n.y === 0; }).length === 1,
   '1b · exactly one layer sits on the origin, whatever the layers started at');

// ---- 1c · vertical flow is the transpose, not a second algorithm -----------

// Groups now advance down and members run across, so each group clears its own
// TALLEST member instead of its widest. Same fixture, same gaps.
settings.direction = 'vertical';
var vplan = buildPlan();
eq(names(vplan), [['1 - 1', '1 - 2', '1 - 3', '1 - 10'], ['2 - 1'], ['3 - 1']],
   '1c · the grouping does not change with the direction');
eq(applyPlan(vplan), 6, '1c · every layer moved');
eq(places(a).sort(),
   ['1 - 1@0,0', '1 - 2@500,0', '1 - 3@800,0', '1 - 10@1200,0', '2 - 1@0,130', '3 - 1@0,260'].sort(),
   '1c · groups run down, members run across, each group clearing its tallest member');
eq(panelOrder(), ['1 - 1', '1 - 2', '1 - 3', '1 - 10', '2 - 1', '3 - 1'],
   '1c · the Layers panel order is the plan, whichever way it is drawn');

// Back to horizontal, and the layout is exactly what it was before the detour.
settings.direction = 'horizontal';
applyPlan(buildPlan());
eq(places(a).sort(),
   ['1 - 1@0,0', '1 - 10@0,390', '1 - 2@0,130', '1 - 3@0,260', '2 - 1@500,0', '3 - 1@800,0'].sort(),
   '1d · horizontal is unchanged by the setting existing');

// ---- 2 · the Layers panel follows the canvas -------------------------------

eq(panelOrder(), ['1 - 1', '1 - 2', '1 - 3', '1 - 10', '2 - 1', '3 - 1'],
   '2 · panel reads first column top to bottom, then the next');

// ---- 3 · grouping off: every layer is its own column ------------------------

settings.grouped = false;
eq(names(buildPlan()), [['1 - 1'], ['1 - 2'], ['1 - 3'], ['1 - 10'], ['2 - 1'], ['3 - 1']],
   '3 · grouping off gives one column per layer, in name order');
settings.grouped = true;

// ---- 4 · scope: selection wins, and what is skipped -------------------------

PAGE.selection = [a[0], a[3]];
eq(names(buildPlan()), [['2 - 1'], ['3 - 1']], '4 · a selection overrides the whole page');

var AL = { type: 'FRAME', layoutMode: 'VERTICAL' };
var OTHER = { type: 'FRAME', layoutMode: 'NONE' };
PAGE.selection = [
  makeNode('1 - 1', 10, 10, 0, 0, PAGE),
  makeNode('1 - 2', 10, 10, 0, 0, AL),
  makeNode('2 - 1', 10, 10, 0, 0, OTHER)
];
var skipPlan = buildPlan();
eq(names(skipPlan), [['1 - 1']], '4 · an auto-layout parent and a foreign parent are both skipped');
eq(skipPlan.skipped, 2, '4 · and both are counted, not dropped silently');

// ---- 5 · names with no separator ------------------------------------------

reset([makeNode('10', 10, 10, 0, 0, PAGE), makeNode('9', 10, 10, 0, 0, PAGE), makeNode('2', 10, 10, 0, 0, PAGE)]);
eq(names(buildPlan()), [['2'], ['9'], ['10']], '5 · a name with no separator is its own column key, sorted naturally');

// ---- 6 · settings fallbacks ------------------------------------------------

eq(normalise(null), { delimiter: '-', grouped: true, direction: 'horizontal', gapX: 200, gapY: 80 },
   '6 · no stored settings falls back to the "-" separator and horizontal flow');
eq(normalise({ delimiter: '/', grouped: false, gapX: -5, gapY: 1.6 }),
   { delimiter: '/', grouped: false, direction: 'horizontal', gapX: 0, gapY: 2 },
   '6 · settings saved before the direction existed come back horizontal, not undefined');
eq(normalise({ direction: 'vertical' }).direction, 'vertical', '6 · vertical survives a round trip');
eq(normalise({ direction: 'sideways' }).direction, 'horizontal', '6 · an unknown direction falls back');

// ---- 7 · the relaunch path -------------------------------------------------

(async function () {
  // Nothing selected: the whole page, using the settings last saved.
  storage = { delimiter: '/', grouped: true, gapX: 10, gapY: 10 };
  var r = [makeNode('a / 1', 100, 50, 0, 0, PAGE), makeNode('a / 2', 100, 50, 0, 0, PAGE), makeNode('b / 1', 100, 50, 0, 0, PAGE)];
  reset(r);
  await runFromRelaunch();
  eq(settings.delimiter, '/', '7 · the relaunch loads the saved separator, not the default');
  eq(places(r), ['a / 1@0,0', 'a / 2@0,60', 'b / 1@110,0'], '7 · and the saved gaps');
  ok(closed, '7 · the relaunch closes the plugin');
  ok(PAGE.relaunch && PAGE.relaunch.organize, '7 · and writes its own button back onto the parent');

  // The container selected: reaching the button means selecting it, and the
  // plain selection rule would read that as "arrange this one node".
  storage = { delimiter: '-', grouped: true, gapX: 100, gapY: 100 };
  var FRAME = container({ type: 'FRAME', layoutMode: 'NONE' });
  var kids = [
    makeNode('2 - 1', 100, 50, 500, 500, FRAME),
    makeNode('1 - 2', 100, 50, 500, 500, FRAME),
    makeNode('1 - 1', 100, 50, 0, 0, FRAME)
  ];
  kids.forEach(function (k) { FRAME.appendChild(k); });
  PAGE.children = [FRAME];
  PAGE.selection = [FRAME];
  closed = false;
  await runFromRelaunch();
  eq(places(kids).sort(), ['1 - 1@0,0', '1 - 2@0,150', '2 - 1@200,0'].sort(),
     '7 · one selected node with children means "arrange what is inside it"');
  ok(FRAME.relaunch && FRAME.relaunch.organize, '7 · the button is rewritten on the container, not the page');

  // Nothing to arrange still closes, and says so.
  PAGE.children = [];
  PAGE.selection = [];
  notices = [];
  closed = false;
  await runFromRelaunch();
  ok(notices.length === 1 && /Nothing to organise/.test(notices[0]), '7 · an empty run notifies');
  ok(closed, '7 · and still closes');

  // A parent with no appendChild is a no-op, not a throw.
  var ORPHAN = { type: 'PAGE' };
  reorderLayers([makeNode('9 - 1', 10, 10, 0, 0, ORPHAN)]);
  ok(true, '7 · reorder on a parent that cannot take children does not throw');

  console.log(failures === 0
    ? 'pass — ' + checks + ' checks'
    : 'FAIL — ' + failures + ' of ' + checks + ' checks');
  process.exit(failures === 0 ? 0 : 1);
})();
