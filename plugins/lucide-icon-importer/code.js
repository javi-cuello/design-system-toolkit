// Lucide Icon Importer — v1.13.3 · plugin-standard v1.4.0
// @ts-check

var SETTINGS_KEY = 'lucideIconImporterSettings';

var BOX_PADDING   = 24; // padding on the box every icon (single or multi-size) is inserted into — matches VARIANT_GAP so spacing is consistent throughout
var VARIANT_GAP   = 24; // gap between size variants inside a component set
var CHROME_STROKE = { type: 'SOLID', color: { r: 0.5921568870544434, g: 0.27843138575553894, b: 1 }, opacity: 1 }; // Figma's default dashed component-set boundary color
var CHROME_STROKE_WEIGHT = 1; // ALWAYS 1 -- the chrome boundary is decorative, independent of any user setting

// Stashes what's needed to rebuild this icon later (the "Update icon"
// relaunch button uses this), and registers the relaunch button itself.
function tagPluginNode(node, iconName, svgString, tags) {
  try {
    node.setPluginData('lucideIconName', iconName);
    node.setPluginData('lucideSvgSource', svgString);
    node.setPluginData('lucideTags', JSON.stringify(tags || []));
    node.setRelaunchData({ 'update-icon': '' });
  } catch (e) {}
}

function setPadding(node, v) {
  node.paddingLeft = node.paddingRight = node.paddingTop = node.paddingBottom = v;
}

// fillMode: 'literal' -> fillColor {r,g,b} used directly (default black)
//           'variable' -> fillVariableId bound to the icon's fill
var DEFAULT_SETTINGS = {
  frameName: 'Icons',
  sizes: [24],
  fillMode: 'literal',
  fillColor: { r: 0, g: 0, b: 0 },
  fillOpacity: 1,
  fillVariableId: null,
  bgColor: { r: 0.9607843137254902, g: 0.9607843137254902, b: 0.9607843137254902 }, // #f5f5f5
  bgOpacity: 1,
  strokeWeight: 2 // matches Lucide's own icon stroke convention; unrelated to the component-set chrome stroke, which is hardcoded (see CHROME_STROKE_WEIGHT)
};

function normalizeFrameName(name) {
  var trimmed = (name && String(name).trim()) || '';
  return trimmed || DEFAULT_SETTINGS.frameName;
}

// Returns the cleaned sizes array — deliberately CAN be empty. Emptying the
// sizes field is allowed; addIcon() is what actually errors if it's empty,
// not this normalizer.
function normalizeSizes(input) {
  var arr;
  if (Array.isArray(input)) {
    arr = input;
  } else {
    arr = String(input || '').split(',');
  }
  var clean = arr
    .map(function(n) { return Math.round(Number(n)); })
    .filter(function(n) { return isFinite(n) && n > 0; });
  clean = Array.from(new Set(clean)).sort(function(a, b) { return a - b; });
  return clean;
}

function normalizeColor(color, fallback) {
  return (color && typeof color.r === 'number' && typeof color.g === 'number' && typeof color.b === 'number') ? color : fallback;
}

function normalizeStrokeWeight(w) {
  var n = Number(w);
  return isFinite(n) && n > 0 ? n : DEFAULT_SETTINGS.strokeWeight;
}

function normalizeOpacity(o, fallback) {
  var n = Number(o);
  if (!isFinite(n)) return fallback;
  return Math.min(1, Math.max(0, n));
}

// Settings live inside the Figma FILE itself (figma.root pluginData), not
// tied to your Figma account. That means: different files can have
// different settings, and anyone who opens this same file — including
// teammates — automatically gets the same configuration. No per-person
// setup needed.
async function loadSettings() {
  var raw = figma.root.getPluginData(SETTINGS_KEY);
  var stored = null;
  if (raw) {
    try { stored = JSON.parse(raw); } catch (e) {}
  }
  if (!stored) return JSON.parse(JSON.stringify(DEFAULT_SETTINGS));

  return {
    frameName: normalizeFrameName(stored.frameName),
    sizes: normalizeSizes(stored.sizes),
    fillMode: stored.fillMode === 'variable' ? 'variable' : 'literal',
    fillColor: normalizeColor(stored.fillColor, DEFAULT_SETTINGS.fillColor),
    fillOpacity: normalizeOpacity(stored.fillOpacity, DEFAULT_SETTINGS.fillOpacity),
    fillVariableId: stored.fillVariableId || null,
    bgColor: normalizeColor(stored.bgColor, DEFAULT_SETTINGS.bgColor),
    bgOpacity: normalizeOpacity(stored.bgOpacity, DEFAULT_SETTINGS.bgOpacity),
    strokeWeight: normalizeStrokeWeight(stored.strokeWeight)
  };
}

async function saveSettings(raw) {
  var settings = {
    frameName: normalizeFrameName(raw.frameName),
    sizes: normalizeSizes(raw.sizes),
    fillMode: raw.fillMode === 'variable' ? 'variable' : 'literal',
    fillColor: normalizeColor(raw.fillColor, DEFAULT_SETTINGS.fillColor),
    fillOpacity: normalizeOpacity(raw.fillOpacity, DEFAULT_SETTINGS.fillOpacity),
    fillVariableId: raw.fillVariableId || null,
    bgColor: normalizeColor(raw.bgColor, DEFAULT_SETTINGS.bgColor),
    bgOpacity: normalizeOpacity(raw.bgOpacity, DEFAULT_SETTINGS.bgOpacity),
    strokeWeight: normalizeStrokeWeight(raw.strokeWeight)
  };
  figma.root.setPluginData(SETTINGS_KEY, JSON.stringify(settings));
  return settings;
}

function getIconsFrame(frameName) {
  return figma.currentPage.findOne(function(n) {
    return n.name === frameName && n.type === 'FRAME';
  }); // may be null — callers handle inserting directly on canvas instead
}

// Duplicate check when there's no wrapper frame: look at top-level
// components/component sets on the page directly (avoids false positives
// against unrelated frames/text/shapes with the same name).
function getExistingIconNamesOnPage() {
  var names = {};
  figma.currentPage.children.forEach(function(n) {
    if (n.type === 'COMPONENT' || n.type === 'COMPONENT_SET') names[n.name] = true;
  });
  return names;
}

function getExistingIconNames(iconsFrame) {
  var names = {};
  for (var i = 0; i < iconsFrame.children.length; i++) {
    names[iconsFrame.children[i].name] = true;
  }
  return names;
}

function getExistingNames(iconsFrame) {
  return iconsFrame ? getExistingIconNames(iconsFrame) : getExistingIconNamesOnPage();
}

// Resolves a fill paint from settings — either a literal color, or a color
// bound to a variable (falls back to literal if the variable can't load).
// Opacity applies either way — it's a paint-level property, independent of
// whether the color itself is a variable.
async function resolveFillPaint(settings) {
  var paint = { type: 'SOLID', color: settings.fillColor, opacity: settings.fillOpacity };
  if (settings.fillMode === 'variable' && settings.fillVariableId) {
    var variable = await figma.variables.getVariableByIdAsync(settings.fillVariableId);
    if (variable) {
      paint = figma.variables.setBoundVariableForPaint(paint, 'color', variable);
    }
  }
  return paint;
}

// Scaled vector clone, centered within a `size`×`size` box.
function buildScaledIcon(size, masterIcon, fillPaint) {
  var factor = size / 24;
  var icon = masterIcon.clone();
  icon.resize(masterIcon.width * factor, masterIcon.height * factor);
  icon.x = (size - icon.width) / 2;
  icon.y = (size - icon.height) / 2;
  icon.fills = [fillPaint];
  return icon;
}

// Bare frame — exactly size×size, no padding/fill — holding the icon.
function buildBareIconFrame(size, masterIcon, fillPaint, layerName) {
  var icon = buildScaledIcon(size, masterIcon, fillPaint);
  var frame = figma.createFrame();
  frame.name         = layerName;
  frame.resize(size, size);
  frame.fills        = [];
  frame.strokes      = [];
  frame.clipsContent = false;
  frame.layoutMode   = 'NONE';
  frame.appendChild(icon);
  return frame;
}

function buildVariantComponent(size, masterIcon, fillPaint) {
  var frame = buildBareIconFrame(size, masterIcon, fillPaint, 'Size=' + size);
  return figma.createComponentFromNode(frame); // keeps frame's name
}

// A one-size icon is a plain, padded, bg-colored FRAME (matching every
// other icon's outer box) wrapping the actual icon COMPONENT — the
// reusable/swappable unit is the icon itself, not the padded box around it.
// Returns { frame, component } — frame gets inserted/positioned on canvas,
// component gets the name/description/docs link (the "publishable" node).
function buildSingleComponent(size, masterIcon, fillPaint, bgPaint, iconName) {
  var iconFrame = buildBareIconFrame(size, masterIcon, fillPaint, iconName);
  var comp = figma.createComponentFromNode(iconFrame); // keeps iconName

  var outer = figma.createFrame();
  outer.layoutMode            = 'HORIZONTAL';
  outer.primaryAxisAlignItems = 'CENTER';
  outer.counterAxisAlignItems = 'CENTER';
  outer.primaryAxisSizingMode = 'AUTO';
  outer.counterAxisSizingMode = 'AUTO';
  setPadding(outer, BOX_PADDING);
  outer.itemSpacing = 0;
  outer.fills = [bgPaint];
  outer.appendChild(comp);
  return { frame: outer, component: comp };
}

// Builds either a single component (1 size) or a component set (2+ sizes)
// for iconName, appended into `parent`. Already named/described/linked —
// shared by both the normal add flow and the relaunch-triggered update
// flow, so the two can never drift out of sync with each other.
function buildIconNode(iconName, masterIcon, fillPaint, bgPaint, settings, tags, parent) {
  var sizes = settings.sizes;
  var node, publishable;

  if (sizes.length === 1) {
    var built = buildSingleComponent(sizes[0], masterIcon, fillPaint, bgPaint, iconName);
    parent.appendChild(built.frame);
    node = built.frame;
    publishable = built.component;
  } else {
    var variantComps = [];
    try {
      for (var s = 0; s < sizes.length; s++) {
        variantComps.push(buildVariantComponent(sizes[s], masterIcon, fillPaint));
      }
    } catch (e) {
      variantComps.forEach(function(vc) { try { vc.remove(); } catch (err) {} });
      throw e;
    }

    var maxWidth = 0;
    variantComps.forEach(function(vc) { if (vc.width > maxWidth) maxWidth = vc.width; });
    var offsetY = 0;
    variantComps.forEach(function(vc) {
      vc.x = (maxWidth - vc.width) / 2;
      vc.y = offsetY;
      offsetY += vc.height + VARIANT_GAP;
    });

    var componentSet;
    try {
      componentSet = figma.combineAsVariants(variantComps, parent);
    } catch (e) {
      variantComps.forEach(function(vc) { try { vc.remove(); } catch (err) {} });
      throw e;
    }

    try {
      componentSet.layoutMode            = 'VERTICAL';
      componentSet.primaryAxisSizingMode = 'AUTO'; // HUG -- correct as of Figma's
      componentSet.counterAxisSizingMode = 'AUTO'; // current ("Updated") auto-layout
      componentSet.primaryAxisAlignItems = 'MIN';  // engine; see note below.
      componentSet.counterAxisAlignItems = 'CENTER';
      componentSet.itemSpacing = VARIANT_GAP;
      setPadding(componentSet, BOX_PADDING);
      componentSet.fills = [bgPaint];
      // The dashed purple boundary Figma itself uses on component sets
      // created via the "Combine as variants" UI action.
      componentSet.strokes = [CHROME_STROKE];
      componentSet.strokeWeight = CHROME_STROKE_WEIGHT; // hardcoded -- never settings.strokeWeight (that's for icon import, unrelated)
      componentSet.strokeAlign  = 'INSIDE';
      componentSet.dashPattern  = [10, 5];

      // A padding-24 set of 16/20/24 variants with 24px gaps computes to
      // 156 by pure padding+content+gap math -- but under Figma's CURRENT
      // ("Updated") auto-layout engine, an INSIDE-aligned stroke correctly
      // participates in that box-model calculation, adding its own width
      // (1px x 2 sides = 158). This is expected, correct platform behavior,
      // not a bug: pre-existing icons elsewhere in this library showing 156
      // predate Figma's engine update and are pinned to "Legacy" auto-layout
      // for backward compatibility (visible per-node via the Layout:
      // Updated/Legacy control in Figma's own properties panel; not exposed
      // via the Plugin API). Every node this plugin creates is created NOW,
      // so it always gets Updated behavior automatically -- no special
      // handling needed. Do not force an explicit height here; Hug is
      // correct.
    } catch (e) {}

    node = componentSet;
    publishable = componentSet;
  }

  node.name = iconName;
  if (publishable !== node) publishable.name = iconName;
  if (tags && tags.length > 0) {
    try { publishable.description = tags.join(', '); } catch (e) {}
  }
  try {
    publishable.documentationLinks = [{ uri: 'https://lucide.dev/icons/' + iconName }];
  } catch (e) {}

  return node;
}

// Inserts resultNode into iconsFrame alphabetically (or drops it centered on
// canvas if there's no wrapper frame), then selects/zooms to it.
function finalizeAndInsert(resultNode, iconsFrame) {
  if (iconsFrame) {
    var kids = iconsFrame.children;
    var insertAt = kids.length - 1;
    for (var m = 0; m < kids.length - 1; m++) {
      if (kids[m].name.localeCompare(resultNode.name) > 0) {
        insertAt = m;
        break;
      }
    }
    if (insertAt < kids.length - 1) {
      iconsFrame.insertChild(insertAt, resultNode);
    }
  } else {
    // No wrapper frame configured/found — drop it straight onto the canvas,
    // centered in the current viewport instead of trying to sort it among
    // whatever unrelated content is already on the page.
    resultNode.x = figma.viewport.center.x - resultNode.width / 2;
    resultNode.y = figma.viewport.center.y - resultNode.height / 2;
  }

  figma.currentPage.selection = [resultNode];
  figma.viewport.scrollAndZoomIntoView([resultNode]);
  figma.viewport.zoom = 4;
}

// Parses an SVG string into a single flattened vector: outline every
// stroked path, union everything together, then flatten.
function buildMasterIcon(svgString, strokeWeight) {
  var svgGroup;
  try {
    svgGroup = figma.createNodeFromSvg(svgString);
  } catch (e) {
    throw new Error('Failed to parse SVG: ' + e.message);
  }

  var toProcess = [];
  for (var i = svgGroup.children.length - 1; i >= 0; i--) {
    var child = svgGroup.children[i];
    if (child.strokes && child.strokes.length > 0) {
      /*
       * A path that is BOTH filled and stroked contributes two shapes, not
       * one: outlining the stroke gives the ring, and the fill it also
       * carries is the interior. Keeping only the ring is why Lucide's
       * `palette` and `tag` — whose accent dots are drawn as tiny filled
       * circles with the inherited stroke on top — imported as rings with a
       * hole rather than as dots. The interior is cloned out before the
       * stroke is outlined, and the union puts the two back together.
       */
      if (child.fills && child.fills.length > 0 && child.fills.some(function(f) { return f.visible !== false; })) {
        try {
          var filled = child.clone();
          filled.strokes = [];
          figma.currentPage.appendChild(filled);
          toProcess.push(filled);
        } catch (e) {}
      }
      /*
       * The Settings field for stroke weight was stored, shown and never
       * applied -- Lucide's own `stroke-width="2"` came through untouched
       * whatever it said, so a library that wanted a 1.5 set got a 2 set
       * and nothing reported it. The weight is set on the path HERE, while
       * it is still a stroke: after `outlineStroke()` the thickness is
       * geometry and no setting can reach it. Left undefined (an update of
       * an icon imported before this), the SVG's own width stands, so
       * nothing already in a library moves unless someone asks it to.
       */
      if (typeof strokeWeight === 'number' && isFinite(strokeWeight) && strokeWeight > 0) {
        try { child.strokeWeight = strokeWeight; } catch (e) {}
      }
      toProcess.push(child.outlineStroke());
    } else {
      /*
       * A path with no stroke — a filled shape — has to be moved OUT of the
       * group before the group is removed, or it is removed with it and the
       * union then fails on a node that no longer exists ("The node with id
       * ... does not exist"). Every Lucide icon inherits a stroke from the
       * root <svg>, so this branch never ran on one; it ran the first time a
       * custom filled glyph was imported, and took the whole import with it.
       */
      child.strokes = [];
      figma.currentPage.appendChild(child);
      toProcess.push(child);
    }
  }
  svgGroup.remove();

  toProcess.forEach(function(node) {
    try { node.fills = []; } catch (e) {}
    try { node.strokes = []; } catch (e) {}
  });

  var unioned;
  try {
    // A single shape has nothing to union with, and `figma.union` refuses a
    // one-node list; flatten takes it directly. Only reachable for a glyph
    // drawn as one filled path, which is what a custom icon usually is.
    unioned = toProcess.length > 1 ? figma.union(toProcess, figma.currentPage) : toProcess[0];
  } catch (e) {
    toProcess.forEach(function(node) { try { node.remove(); } catch (err) {} });
    throw new Error('Union failed: ' + e.message);
  }

  var masterIcon;
  try {
    masterIcon = figma.flatten([unioned]);
  } catch (e) {
    try { unioned.remove(); } catch (err) {}
    throw new Error('Flatten failed: ' + e.message);
  }

  masterIcon.name        = 'Icon';
  masterIcon.fills       = [];
  masterIcon.strokes     = [];
  masterIcon.constraints = { horizontal: 'SCALE', vertical: 'SCALE' };
  masterIcon.x = 0;
  masterIcon.y = 0;
  return masterIcon;
}

async function addIcon(iconName, svgString, tags) {
  var settings = await loadSettings();
  var iconsFrame = getIconsFrame(settings.frameName); // may be null
  var insertParent = iconsFrame || figma.currentPage;

  var existingNames = getExistingNames(iconsFrame);
  if (existingNames[iconName]) {
    return { success: false, error: '"' + iconName + '" is already in the library.' };
  }

  if (!settings.sizes || settings.sizes.length === 0) {
    return { success: false, error: 'Add at least one icon size in Settings before adding icons.' };
  }

  var fillPaint = await resolveFillPaint(settings);
  var bgPaint   = { type: 'SOLID', color: settings.bgColor, opacity: settings.bgOpacity };

  var masterIcon;
  try {
    masterIcon = buildMasterIcon(svgString, settings.strokeWeight);
  } catch (e) {
    return { success: false, error: e.message };
  }

  var node;
  try {
    node = buildIconNode(iconName, masterIcon, fillPaint, bgPaint, settings, tags, insertParent);
  } catch (e) {
    try { masterIcon.remove(); } catch (err) {}
    return { success: false, error: 'Failed to build icon: ' + e.message };
  }
  masterIcon.remove();

  try {
    finalizeAndInsert(node, iconsFrame);
    tagPluginNode(node, iconName, svgString, tags);
  } catch (e) {
    try { node.remove(); } catch (err) {}
    return { success: false, error: 'Failed to finalize icon: ' + e.message };
  }

  return { success: true, iconName: iconName };
}

// Headless: runs from the "Update icon" relaunch button, no UI shown.
// Rebuilds each selected icon from its stored source SVG using whatever
// Settings are currently configured (fill/variable, sizes, stroke weight,
// background), replacing it in place at the same position/parent/index.
async function runUpdateIcon() {
  var sel = figma.currentPage.selection;
  if (sel.length === 0) {
    throw new Error('Select an icon created by this plugin first.');
  }

  var settings = await loadSettings();

  if (!settings.sizes || settings.sizes.length === 0) {
    throw new Error('Add at least one icon size in Settings before updating icons.');
  }

  var fillPaint = await resolveFillPaint(settings);
  var bgPaint   = { type: 'SOLID', color: settings.bgColor, opacity: settings.bgOpacity };

  var updated = 0, skipped = 0;
  var newSelection = [];

  for (var i = 0; i < sel.length; i++) {
    var oldNode   = sel[i];
    var svgSource = oldNode.getPluginData('lucideSvgSource');
    var iconName  = oldNode.getPluginData('lucideIconName');
    if (!svgSource || !iconName) { skipped++; continue; }

    var tagsRaw = oldNode.getPluginData('lucideTags');
    var tags = [];
    try { tags = tagsRaw ? JSON.parse(tagsRaw) : []; } catch (e) {}

    var parent = oldNode.parent;
    var index  = parent.children.indexOf(oldNode);
    var x = oldNode.x, y = oldNode.y;

    var masterIcon;
    try {
      masterIcon = buildMasterIcon(svgSource, settings.strokeWeight);
    } catch (e) {
      skipped++;
      continue;
    }

    var newNode;
    try {
      newNode = buildIconNode(iconName, masterIcon, fillPaint, bgPaint, settings, tags, parent);
    } catch (e) {
      try { masterIcon.remove(); } catch (err) {}
      skipped++;
      continue;
    }
    masterIcon.remove();

    newNode.x = x;
    newNode.y = y;
    try { parent.insertChild(index, newNode); } catch (e) {}
    tagPluginNode(newNode, iconName, svgSource, tags);

    oldNode.remove();
    newSelection.push(newNode);
    updated++;
  }

  if (newSelection.length) figma.currentPage.selection = newSelection;

  if (updated > 0) {
    figma.notify('Updated ' + updated + ' icon' + (updated === 1 ? '' : 's') + ' with current settings');
  } else if (skipped > 0) {
    figma.notify("Selected layer(s) weren't created by this plugin — nothing to update.", { error: true });
  }
}

// Resolve a variable's color for the picker preview swatch, following alias
// chains up to a few levels deep. Falls back to grey if it can't resolve.
async function resolveVariableColor(variable, depth) {
  depth = depth || 0;
  if (depth > 5) return { r: 0.6, g: 0.6, b: 0.6 };
  var modeIds = Object.keys(variable.valuesByMode);
  if (!modeIds.length) return { r: 0.6, g: 0.6, b: 0.6 };
  var value = variable.valuesByMode[modeIds[0]];
  if (value && value.type === 'VARIABLE_ALIAS') {
    var aliased = await figma.variables.getVariableByIdAsync(value.id);
    if (aliased) return resolveVariableColor(aliased, depth + 1);
    return { r: 0.6, g: 0.6, b: 0.6 };
  }
  if (value && typeof value.r === 'number') return value;
  return { r: 0.6, g: 0.6, b: 0.6 };
}

// Collects color variables from BOTH this file's local variables and any
// enabled/subscribed team library. Library variables get imported locally
// (required before they can be bound to anything) so their returned id is
// immediately usable.
async function getAllColorVariables() {
  var list = [];

  try {
    var localVars = await figma.variables.getLocalVariablesAsync('COLOR');
    var localCollections = await figma.variables.getLocalVariableCollectionsAsync();
    var localCollectionNames = {};
    localCollections.forEach(function(c) { localCollectionNames[c.id] = c.name; });

    for (var i = 0; i < localVars.length; i++) {
      var color = await resolveVariableColor(localVars[i]);
      list.push({
        id: localVars[i].id,
        collection: localCollectionNames[localVars[i].variableCollectionId] || 'Local variables',
        name: localVars[i].name,
        color: color
      });
    }
  } catch (e) {
    console.error('Lucide Icon Importer: failed to read local color variables —', e);
  }

  try {
    var collections = await figma.teamLibrary.getAvailableLibraryVariableCollectionsAsync();
    for (var c = 0; c < collections.length; c++) {
      var libVars = await figma.teamLibrary.getVariablesInLibraryCollectionAsync(collections[c].key);
      for (var v = 0; v < libVars.length; v++) {
        if (libVars[v].resolvedType !== 'COLOR') continue;
        try {
          var imported = await figma.variables.importVariableByKeyAsync(libVars[v].key);
          var libColor = await resolveVariableColor(imported);
          list.push({
            id: imported.id,
            collection: collections[c].libraryName + ' / ' + collections[c].name,
            name: libVars[v].name,
            color: libColor
          });
        } catch (err) {
          console.error('Lucide Icon Importer: failed to import library variable "' + libVars[v].name + '" —', err);
        }
      }
    }
  } catch (e) {
    // Common cause: manifest.json is missing "permissions": ["teamlibrary"].
    console.error('Lucide Icon Importer: failed to read library variable collections (check manifest permissions) —', e);
  }

  list.sort(function(a, b) {
    return a.collection.localeCompare(b.collection) || a.name.localeCompare(b.name);
  });
  return list;
}

figma.ui.onmessage = async function(msg) {
  if (msg.type === 'GET_EXISTING') {
    var settingsForExisting = await loadSettings();
    var frameForExisting = getIconsFrame(settingsForExisting.frameName);
    figma.ui.postMessage({ type: 'EXISTING_ICONS', names: getExistingNames(frameForExisting) });
  }

  if (msg.type === 'GET_SETTINGS') {
    var settings = await loadSettings();
    figma.ui.postMessage({ type: 'SETTINGS', settings: settings });
  }

  if (msg.type === 'SAVE_SETTINGS') {
    var saved = await saveSettings(msg.settings || {});
    figma.ui.postMessage({ type: 'SETTINGS_SAVED', settings: saved });
  }

  if (msg.type === 'RESET_SETTINGS') {
    figma.root.setPluginData(SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
    figma.ui.postMessage({ type: 'SETTINGS', settings: JSON.parse(JSON.stringify(DEFAULT_SETTINGS)) });
    figma.notify('Settings reset to defaults');
  }

  // Powers the custom color-variable picker dropdown.
  if (msg.type === 'GET_COLOR_VARIABLES') {
    var list = [];
    try { list = await getAllColorVariables(); } catch (e) {}
    figma.ui.postMessage({ type: 'COLOR_VARIABLES', variables: list });
  }

  // Batch add -- also used for a single icon (the UI always sends an array,
  // even for one). Reuses addIcon() unchanged, once per item, in order --
  // each call fully completes (including the alphabetical insert) before
  // the next starts, so insert order stays correct with no extra logic.
  if (msg.type === 'ADD_ICONS') {
    var items = msg.icons || [];
    var results = [];
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var result;
      try {
        result = await addIcon(item.iconName, item.svgString, item.tags);
      } catch (e) {
        result = { success: false, error: e.message };
      }
      result.iconName = result.iconName || item.iconName;
      results.push(result);
    }

    figma.ui.postMessage({ type: 'ADD_ICONS_RESULT', results: results });

    var succeeded = results.filter(function(r) { return r.success; }).length;
    var failed = results.length - succeeded;
    if (succeeded > 0 && failed === 0) {
      figma.notify(succeeded + ' icon' + (succeeded === 1 ? '' : 's') + ' added!');
    } else if (succeeded > 0) {
      figma.notify(succeeded + ' added, ' + failed + ' failed', { error: true });
    } else if (results.length > 0) {
      figma.notify(results[0].error || 'Something went wrong', { error: true });
    }
  }

  if (msg.type === 'CLOSE') {
    figma.closePlugin();
  }
};

// ── Entry point ──────────────────────────────────────────────────────────
// Makes a relaunch button available from the design sidebar generally
// (page/canvas level), not just on individual icons — lets you reopen the
// plugin's search UI without going through the Plugins menu.
figma.root.setRelaunchData({ 'import-lucide-icon': '' });

if (figma.command === 'update-icon') {
  // Triggered via the relaunch button on an existing icon — runs headlessly
  // (no UI) and re-applies current Settings to the selected icon(s).
  runUpdateIcon()
    .catch(function(e) { figma.notify(e.message || 'Something went wrong', { error: true }); })
    .then(function() { figma.closePlugin(); });
} else {
  // Covers both a normal manual launch (figma.command is undefined) and the
  // "Import Lucide icon" relaunch button (figma.command === 'import-lucide-icon').
  figma.showUI(__html__, { width: 360, height: 600, title: 'Lucide Icon Importer', themeColors: true });

  // Live-refresh "already in library" state while the plugin stays open.
  // Without this, the UI's existingNames is a one-time snapshot taken at
  // launch (GET_EXISTING, sent once) -- deleting an icon on canvas (or
  // adding one some other way) leaves the grid showing stale exists/
  // duplicate state until the plugin is closed and reopened. Scoped to
  // figma.currentPage.on('nodechange', ...) rather than the heavier
  // figma.on('documentchange', ...), which requires loadAllPagesAsync()
  // first -- the exists-check is already current-page-only (see
  // getExistingNames), so no multi-page loading is needed. Debounced since
  // nodechange can fire many times in a row during a single edit.
  var existingRefreshTimer = null;
  figma.currentPage.on('nodechange', function() {
    if (existingRefreshTimer) clearTimeout(existingRefreshTimer);
    existingRefreshTimer = setTimeout(function() {
      loadSettings().then(function(settings) {
        var frame = getIconsFrame(settings.frameName);
        figma.ui.postMessage({ type: 'EXISTING_ICONS', names: getExistingNames(frame) });
      });
    }, 400);
  });
}
