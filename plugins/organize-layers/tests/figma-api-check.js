// Paste-into-Figma check — the API assumptions test-organize.js has to stub.
//
// Run it through a console/bridge that can execute a plugin-context script
// (Figma Console MCP's figma_execute, or any dev-tools plugin), with an EMPTY
// scratch page as the current page. It builds its own fixtures, runs the two
// scenarios, returns the result, and removes everything it made — the page is
// left with no children and no relaunch entry.
//
// It exists because three claims in this plugin were true only if Figma's API
// behaves the way the stub does, and no unit test can know that:
//   1. appendChild in reverse plan order really produces that Layers panel order
//   2. setting .x/.y on real frames places them where the arithmetic says
//   3. setRelaunchData on a PAGE and on a FRAME both take
//
// Last run 2026-08-25 against a real file, all three confirmed, plus the
// lone-selected-container rule on the relaunch path. What it still cannot
// reach is anything the plugin host draws: ui.html, and whether the relaunch
// button appears in the Design panel. Those stay in MANUAL.md.
//
// Keep the functions below in step with code.js — this is a copy, and a copy
// that has drifted is worse than no check at all.

var settings = { delimiter: '-', grouped: true, direction: 'horizontal', gapX: 200, gapY: 80 };

function parseName(name, delimiter) {
  var i = delimiter ? name.indexOf(delimiter) : -1;
  if (i === -1) return { key: name.trim(), rest: '' };
  return { key: name.slice(0, i).trim(), rest: name.slice(i + delimiter.length).trim() };
}
function chunks(s) {
  var out = [], re = /(\d+)|(\D+)/g, m = re.exec(s);
  while (m !== null) {
    out.push(m[1] !== undefined ? { num: parseInt(m[1], 10), txt: '' } : { num: -1, txt: m[2].toLowerCase() });
    m = re.exec(s);
  }
  return out;
}
function naturalCompare(a, b) {
  var A = chunks(a), B = chunks(b), n = Math.min(A.length, B.length);
  for (var i = 0; i < n; i++) {
    var x = A[i], y = B[i];
    if (x.num >= 0 && y.num >= 0) { if (x.num !== y.num) return x.num - y.num; }
    else if (x.num >= 0) return -1;
    else if (y.num >= 0) return 1;
    else if (x.txt !== y.txt) return x.txt < y.txt ? -1 : 1;
  }
  return A.length - B.length;
}
function collectTargets(poolOverride) {
  var sel = figma.currentPage.selection;
  var pool = poolOverride ? poolOverride : sel.length > 0 ? sel.slice() : figma.currentPage.children.slice();
  var nodes = [], parent = null, skipped = 0;
  for (var i = 0; i < pool.length; i++) {
    var node = pool[i], p = node.parent;
    if (!p) { skipped++; continue; }
    if ('layoutMode' in p && p.layoutMode !== 'NONE') { skipped++; continue; }
    if (parent === null) parent = p;
    if (p !== parent) { skipped++; continue; }
    nodes.push(node);
  }
  return { nodes: nodes, skipped: skipped };
}
function buildPlan(poolOverride) {
  var target = collectTargets(poolOverride), delimiter = settings.delimiter, columns = [];
  var byKey = Object.create(null), keys = [];
  for (var i = 0; i < target.nodes.length; i++) {
    var node = target.nodes[i], key = parseName(node.name, delimiter).key;
    if (!byKey[key]) { byKey[key] = []; keys.push(key); }
    byKey[key].push(node);
  }
  keys.sort(naturalCompare);
  for (var k = 0; k < keys.length; k++) {
    columns.push({ key: keys[k], items: byKey[keys[k]].slice().sort(function (a, b) {
      return naturalCompare(parseName(a.name, delimiter).rest, parseName(b.name, delimiter).rest);
    }) });
  }
  return { columns: columns, skipped: target.skipped };
}
function reorderLayers(order) {
  if (!order.length) return;
  var parent = order[0].parent;
  if (!parent || !('appendChild' in parent)) return;
  for (var i = order.length - 1; i >= 0; i--) parent.appendChild(order[i]);
}
function applyPlan(plan) {
  var moved = 0, order = [], lead = 0;
  if (!plan.columns.length) return 0;
  var down = settings.direction === 'vertical';
  for (var c = 0; c < plan.columns.length; c++) {
    var items = plan.columns[c].items, thickness = 0, cross = 0;
    for (var i = 0; i < items.length; i++) {
      var n = items[i];
      if (down) { n.x = cross; n.y = lead; } else { n.x = lead; n.y = cross; }
      var t = down ? n.height : n.width;
      if (t > thickness) thickness = t;
      cross += down ? n.width + settings.gapX : n.height + settings.gapY;
      order.push(n); moved += 1;
    }
    lead += thickness + (down ? settings.gapY : settings.gapX);
  }
  reorderLayers(order);
  return moved;
}

// ---- the run ---------------------------------------------------------------

var page = figma.currentPage;
if (page.children.length) return { refused: 'current page is not empty', names: page.children.map(function (n) { return n.name; }) };

var fails = [];
function expect(actual, expected, what) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    fails.push(what + ' — expected ' + JSON.stringify(expected) + ', got ' + JSON.stringify(actual));
  }
}

// 1 · a page of frames: scrambled creation order, scattered, unequal widths.
// The 300-wide first column is what a fixed pitch would overlap.
[['3 - 1', 120, 60, 900, 40], ['1 - 2', 120, 60, 400, 700], ['2 - 1', 120, 60, -50, 320],
 ['1 - 10', 120, 60, 650, 500], ['1 - 1', 300, 60, 200, 150], ['1 - 3', 200, 60, 1100, 900]
].forEach(function (s) {
  var f = figma.createFrame();
  f.name = s[0]; f.resize(s[1], s[2]); f.x = s[3]; f.y = s[4];
  f.fills = [{ type: 'SOLID', color: { r: 0.85, g: 0.89, b: 0.95 } }];
  page.appendChild(f);
});
page.selection = [];
var plan = buildPlan(null);
var moved = applyPlan(plan);
plan.columns[0].items[0].parent.setRelaunchData({ organize: 'again' });

expect(plan.columns.map(function (c) { return c.items.map(function (n) { return n.name; }); }),
       [['1 - 1', '1 - 2', '1 - 3', '1 - 10'], ['2 - 1'], ['3 - 1']],
       'columns from the first part, rows number-aware');
expect(moved, 6, 'every layer moved');
expect(page.children.map(function (n) { return n.name + '@' + n.x + ',' + n.y; }).sort(),
       ['1 - 10@0,420', '1 - 1@0,0', '1 - 2@0,140', '1 - 3@0,280', '2 - 1@500,0', '3 - 1@820,0'].sort(),
       'first layer on 0,0; columns clear the widest layer, not a fixed pitch');
expect(page.children.slice().reverse().map(function (n) { return n.name; }),
       ['1 - 1', '1 - 2', '1 - 3', '1 - 10', '2 - 1', '3 - 1'],
       'the Layers panel follows the canvas');
expect(Object.keys(page.getRelaunchData()), ['organize'], 'relaunch data takes on a PAGE');

// 1b · vertical flow on the same real frames: groups run down, members across,
// each group clearing its own tallest member.
settings.direction = 'vertical';
applyPlan(buildPlan(null));
expect(page.children.map(function (n) { return n.name + '@' + n.x + ',' + n.y; }).sort(),
       ['1 - 1@0,0', '1 - 2@500,0', '1 - 3@820,0', '1 - 10@1220,0', '2 - 1@0,140', '3 - 1@0,280'].sort(),
       'vertical flow is the transpose, on real nodes');
settings.direction = 'horizontal';
applyPlan(buildPlan(null));
expect(page.children.map(function (n) { return n.name + '@' + n.x + ',' + n.y; }).sort(),
       ['1 - 10@0,420', '1 - 1@0,0', '1 - 2@0,140', '1 - 3@0,280', '2 - 1@500,0', '3 - 1@820,0'].sort(),
       'and horizontal comes back to exactly where it was');

// 2 · the relaunch path: reaching the button means the container is selected,
// which the plain selection rule would read as "arrange this one node".
var wrap = figma.createFrame();
wrap.name = 'Wrapper'; wrap.resize(900, 500); wrap.x = 0; wrap.y = 1200; wrap.clipsContent = false;
page.appendChild(wrap);
[['2 - 1', 120, 60, 500, 400], ['1 - 2', 120, 60, 500, 400], ['1 - 1', 120, 60, 300, 300]].forEach(function (s) {
  var f = figma.createFrame();
  f.name = s[0]; f.resize(s[1], s[2]); f.x = s[3]; f.y = s[4];
  f.fills = [{ type: 'SOLID', color: { r: 0.95, g: 0.88, b: 0.85 } }];
  wrap.appendChild(f);
});
settings.gapX = 100; settings.gapY = 100;
page.selection = [wrap];
var only = page.selection.length === 1 ? page.selection[0] : null;
var pool = (only && 'children' in only && only.children.length > 0) ? only.children.slice() : null;
expect(pool !== null, true, 'a lone selected container means "arrange what is inside it"');
var plan2 = buildPlan(pool);
applyPlan(plan2);
plan2.columns[0].items[0].parent.setRelaunchData({ organize: 'again' });

expect(wrap.children.map(function (n) { return n.name + '@' + n.x + ',' + n.y; }).sort(),
       ['1 - 1@0,0', '1 - 2@0,160', '2 - 1@220,0'].sort(), 'children placed inside the container');
expect({ x: wrap.x, y: wrap.y }, { x: 0, y: 1200 }, 'the container itself does not move');
expect(Object.keys(wrap.getRelaunchData()), ['organize'], 'relaunch data takes on a FRAME');

// ---- leave the page as it was found ----------------------------------------
page.children.slice().forEach(function (n) { n.remove(); });
page.setRelaunchData({});
expect(page.children.length, 0, 'cleanup left no fixtures behind');

return fails.length ? { FAIL: fails } : { pass: 'all API assumptions hold' };
