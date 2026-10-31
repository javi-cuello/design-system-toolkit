// Layer organiser — v0.6.2 · standard v1.7.0
// @ts-check
// Arranges layers on the canvas from their names: the text before the delimiter
// picks the group, the text after it orders the members inside it. Groups advance
// across the canvas or down it, depending on the flow direction.
// Data stored: clientStorage key "organize-layers:settings", plus relaunch data
// on the arranged layers' parent (see README).

var SETTINGS_KEY = 'organize-layers:settings';

/** @typedef {{ delimiter: string, grouped: boolean, direction: string, gapX: number, gapY: number }} Settings */

/** @type {Settings} */
var settings = { delimiter: '-', grouped: true, direction: 'horizontal', gapX: 200, gapY: 80 };

// ---- name parsing ---------------------------------------------------------

/**
 * Split a layer name at the first delimiter.
 * "1 - 2" with "-" -> { key: "1", rest: "2" }. No delimiter -> the whole name
 * is the key, so unmatched layers still land somewhere predictable.
 * @param {string} name
 * @param {string} delimiter
 * @returns {{ key: string, rest: string }}
 */
function parseName(name, delimiter) {
  var i = delimiter ? name.indexOf(delimiter) : -1;
  if (i === -1) return { key: name.trim(), rest: '' };
  return { key: name.slice(0, i).trim(), rest: name.slice(i + delimiter.length).trim() };
}

/**
 * Number-aware chunking so "10" sorts after "9", not between "1" and "2".
 * Text chunks carry num === -1.
 * @param {string} s
 * @returns {Array<{ num: number, txt: string }>}
 */
function chunks(s) {
  /** @type {Array<{ num: number, txt: string }>} */
  var out = [];
  var re = /(\d+)|(\D+)/g;
  var m = re.exec(s);
  while (m !== null) {
    if (m[1] !== undefined) out.push({ num: parseInt(m[1], 10), txt: '' });
    else out.push({ num: -1, txt: m[2].toLowerCase() });
    m = re.exec(s);
  }
  return out;
}

/**
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
function naturalCompare(a, b) {
  var A = chunks(a);
  var B = chunks(b);
  var n = Math.min(A.length, B.length);
  for (var i = 0; i < n; i++) {
    var x = A[i];
    var y = B[i];
    if (x.num >= 0 && y.num >= 0) {
      if (x.num !== y.num) return x.num - y.num;
    } else if (x.num >= 0) {
      return -1; // numbers before words
    } else if (y.num >= 0) {
      return 1;
    } else if (x.txt !== y.txt) {
      return x.txt < y.txt ? -1 : 1;
    }
  }
  return A.length - B.length;
}

// ---- target collection ----------------------------------------------------

/**
 * Selection if there is one, otherwise everything on the page — unless a caller
 * hands over its own pool. Only nodes that share one parent are arranged: x/y
 * are parent-relative, so mixing parents would place layers by coordinates that
 * do not mean the same thing. Layers inside an auto-layout frame are skipped
 * because the frame owns their position.
 * @param {SceneNode[] | null} [poolOverride]
 * @returns {{ nodes: SceneNode[], skipped: number }}
 */
function collectTargets(poolOverride) {
  var sel = figma.currentPage.selection;
  /** @type {SceneNode[]} */
  var pool = poolOverride ? poolOverride
    : sel.length > 0 ? sel.slice() : figma.currentPage.children.slice();

  /** @type {SceneNode[]} */
  var nodes = [];
  /** @type {BaseNode | null} */
  var parent = null;
  var skipped = 0;

  for (var i = 0; i < pool.length; i++) {
    var node = pool[i];
    var p = node.parent;
    if (!p) { skipped++; continue; }
    if ('layoutMode' in p && p.layoutMode !== 'NONE') { skipped++; continue; }
    if (parent === null) parent = p;
    if (p !== parent) { skipped++; continue; }
    nodes.push(node);
  }
  return { nodes: nodes, skipped: skipped };
}

// ---- plan -----------------------------------------------------------------

/** @typedef {{ key: string, items: SceneNode[] }} Column */

/**
 * Columns left to right, rows top to bottom, before anything moves.
 * @param {SceneNode[] | null} [poolOverride]
 * @returns {{ columns: Column[], skipped: number }}
 */
function buildPlan(poolOverride) {
  var target = collectTargets(poolOverride);
  var delimiter = settings.delimiter;
  /** @type {Column[]} */
  var columns = [];

  if (!settings.grouped) {
    // Every layer is its own column, in name order.
    var flat = target.nodes.slice().sort(function (a, b) { return naturalCompare(a.name, b.name); });
    for (var f = 0; f < flat.length; f++) {
      columns.push({ key: parseName(flat[f].name, delimiter).key, items: [flat[f]] });
    }
    return { columns: columns, skipped: target.skipped };
  }

  /** @type {Record<string, SceneNode[]>} */
  var byKey = Object.create(null);
  /** @type {string[]} */
  var keys = [];
  for (var i = 0; i < target.nodes.length; i++) {
    var node = target.nodes[i];
    var key = parseName(node.name, delimiter).key;
    if (!byKey[key]) { byKey[key] = []; keys.push(key); }
    byKey[key].push(node);
  }
  keys.sort(naturalCompare);

  for (var k = 0; k < keys.length; k++) {
    var items = byKey[keys[k]].slice().sort(function (a, b) {
      var ra = parseName(a.name, delimiter).rest;
      var rb = parseName(b.name, delimiter).rest;
      var byRest = naturalCompare(ra, rb);
      return byRest !== 0 ? byRest : naturalCompare(a.name, b.name);
    });
    columns.push({ key: keys[k], items: items });
  }
  return { columns: columns, skipped: target.skipped };
}

/**
 * The plan as plain data the UI can render.
 * @param {{ columns: Column[], skipped: number }} plan
 */
function planForUI(plan) {
  var delimiter = settings.delimiter;
  var count = 0;
  var columns = plan.columns.map(function (col) {
    return col.items.map(function (node) {
      count += 1;
      var parts = parseName(node.name, delimiter);
      return { key: parts.key, rest: parts.rest, name: node.name };
    });
  });
  return { type: 'preview', columns: columns, skipped: plan.skipped, count: count,
           direction: settings.direction };
}

// ---- apply ----------------------------------------------------------------

/**
 * The first layer lands on 0,0 and everything is placed from there, so the grid
 * has a fixed, predictable origin rather than one that depends on wherever the
 * layers happened to be sitting.
 *
 * Gaps, not a fixed pitch: each group clears its own widest (or tallest) member,
 * so groups of unequal size never overlap whichever way they run.
 * @param {{ columns: Column[], skipped: number }} plan
 * @returns {number} layers moved
 */
function applyPlan(plan) {
  var moved = 0;
  var c, i;
  if (plan.columns.length === 0) return 0;

  // One loop for both directions. `lead` is the axis groups advance along — x
  // when they run across, y when they run down; `cross` is the axis members
  // advance along inside a group. Swapping which is which is the whole feature.
  var down = settings.direction === 'vertical';
  /** @type {SceneNode[]} */
  var order = [];
  var lead = 0;
  for (c = 0; c < plan.columns.length; c++) {
    var items = plan.columns[c].items;
    var thickness = 0;
    var cross = 0;
    for (i = 0; i < items.length; i++) {
      var n = items[i];
      if (down) { n.x = cross; n.y = lead; } else { n.x = lead; n.y = cross; }
      var t = down ? n.height : n.width;
      if (t > thickness) thickness = t;
      cross += down ? n.width + settings.gapX : n.height + settings.gapY;
      order.push(n);
      moved += 1;
    }
    lead += thickness + (down ? settings.gapY : settings.gapX);
  }
  reorderLayers(order);
  return moved;
}

/**
 * Match the Layers panel to the canvas. Arranging the frames leaves the panel
 * in whatever order they happened to be created in, which is the thing the
 * arrangement was meant to fix.
 *
 * The panel lists children back to front, so the LAST child is the top row:
 * appending the plan in reverse leaves the panel reading first column top to
 * bottom, then the next. Safe only because the arrangement never overlaps
 * layers, so z-order carries no meaning here.
 * @param {SceneNode[]} order layers in plan order, column by column
 */
function reorderLayers(order) {
  if (order.length === 0) return;
  var parent = order[0].parent;
  if (!parent || !('appendChild' in parent)) return;
  for (var i = order.length - 1; i >= 0; i--) parent.appendChild(order[i]);
}

/**
 * Puts the plugin's own button in the Design panel of whatever holds the
 * arranged layers, so re-running after a rename or a new frame is one click
 * rather than a trip through the plugin menu. The button opens this UI.
 * @param {SceneNode} node any layer that was just arranged
 */
function setRelaunch(node) {
  var parent = node.parent;
  if (!parent) return;
  parent.setRelaunchData({ organize: 'Arrange these layers into columns again' });
}

/**
 * The run itself. The UI's button and the relaunch button share it so the two
 * cannot drift apart.
 * @param {SceneNode[] | null} [poolOverride]
 * @returns {number} layers moved
 */
function organise(poolOverride) {
  var plan = buildPlan(poolOverride);
  var moved = applyPlan(plan);
  if (moved === 0) {
    figma.notify('Nothing to organise \u2014 select some layers, or open a page with top-level layers.');
    return 0;
  }
  setRelaunch(plan.columns[0].items[0]);
  figma.notify('Organised ' + moved + ' layer' + (moved === 1 ? '' : 's') +
    ' into ' + plan.columns.length + ' column' + (plan.columns.length === 1 ? '' : 's') + '.');
  return moved;
}

/**
 * Relaunch button: re-run with the last saved settings, no UI.
 * The button sits on the container of the layers it arranged, and reaching it
 * means selecting that container — so one selected node with children reads as
 * "arrange what is inside it", not "arrange this single node", which is what
 * the plain selection rule would otherwise do.
 */
async function runFromRelaunch() {
  try {
    settings = normalise(await figma.clientStorage.getAsync(SETTINGS_KEY));
    var sel = figma.currentPage.selection;
    var only = sel.length === 1 ? sel[0] : null;
    /** @type {SceneNode[] | null} */
    var pool = null;
    if (only && 'children' in only && only.children.length > 0) pool = only.children.slice();
    organise(pool);
  } catch (e) {
    figma.notify(String((e && e.message) || e), { error: true });
  }
  figma.closePlugin();
}

// ---- settings -------------------------------------------------------------

/**
 * @param {any} raw
 * @returns {Settings}
 */
function normalise(raw) {
  var src = raw && typeof raw === 'object' ? raw : {};
  var delimiter = typeof src.delimiter === 'string' && src.delimiter.length > 0 ? src.delimiter : '-';
  var gapX = typeof src.gapX === 'number' && isFinite(src.gapX) ? src.gapX : 200;
  var gapY = typeof src.gapY === 'number' && isFinite(src.gapY) ? src.gapY : 80;
  return {
    delimiter: delimiter,
    grouped: src.grouped !== false,
    direction: src.direction === 'vertical' ? 'vertical' : 'horizontal',
    gapX: Math.max(0, Math.round(gapX)),
    gapY: Math.max(0, Math.round(gapY))
  };
}

function sendPreview() {
  figma.ui.postMessage(planForUI(buildPlan()));
}

// ---- lifecycle ------------------------------------------------------------

figma.skipInvisibleInstanceChildren = true;

if (figma.command === 'organize') {
  runFromRelaunch();
} else {
  figma.showUI(__html__, { themeColors: true, width: 260, height: 420, title: 'Layer organiser' });

  figma.on('selectionchange', function () { sendPreview(); });

  figma.ui.onmessage = async (msg) => {
    try {
      switch (msg.type) {
        case 'init': {
          settings = normalise(await figma.clientStorage.getAsync(SETTINGS_KEY));
          figma.ui.postMessage({ type: 'settings', settings: settings });
          sendPreview();
          break;
        }
        case 'settings': {
          settings = normalise(msg.settings);
          await figma.clientStorage.setAsync(SETTINGS_KEY, settings);
          sendPreview();
          break;
        }
        case 'run': {
          organise(null);
          sendPreview();
          figma.ui.postMessage({ type: 'done' });
          break;
        }
        case 'close': figma.closePlugin(); break;
      }
    } catch (e) {
      figma.notify(String((e && e.message) || e), { error: true });
      figma.ui.postMessage({ type: 'done' });
    }
  };
}
