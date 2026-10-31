// Design system snapshot — v0.67.1 · skill-standard §B v1.1.0
// @ts-check
// Reads everything a codebase takes from a design file and posts it to a
// local server (the toolkit's snapshot ROUTER, which hands it to whichever
// project owns this file): from a library,
// the variables with their aliases, text and effect styles, every
// component's variants as measured node trees and the icon SVGs; from a
// screens file, every top-level frame marked ready for dev. One click after a publish or a named
// version, no bridge, no call limit.
// Data stored: one relaunch-data entry on the document root (the Tools button)
// and one root pluginData key, `snapshotFileId`, written once so the file can
// say which file it is; no clientStorage; one POST to localhost per run, or
// with nothing listening there, a JSON file the user saves.

// Port 9317, and localhost by name: devAllowedDomains takes hostnames only,
// so an IP literal is a manifest error and the IPv6-vs-IPv4 split cannot be
// dodged that way. 9227 had to go because figma-console-mcp holds the ::1
// half of it — localhost resolves there first on a Mac, and every snapshot
// came back "server answered 404" from a server that was not the receiver.
const SERVER = 'http://localhost:9317';

/*
 * HEADLESS: this same file run as a body through the Desktop Bridge, with no
 * UI and no `__html__`. The dashboard's validator stage reads the library
 * this way — the component trees it validates come from the live file, by
 * the same walk that writes the snapshot, so the audit and the store cannot
 * describe one component in two shapes. Nothing is posted anywhere and no
 * relaunch data is written; the scratch page the boolean walk needs is
 * created and removed as it is for a snapshot. The caller may prepend
 * `const SCOPE = [ids]` to walk those component sets alone, and
 * `const PAGES = "<regex source>"` — the project's `componentPages` — and
 * `const SECTION = "<regex>"` with `const EXCLUDE = [names]` — its
 * `sectionHeader` and `excludeSections` — so the walk and the components
 * audit select pages by the one rule the project wrote down, not by this
 * file's own (toolkit-standard §D 7): on one library the plugin's own rule
 * read 111 sets where the audit read 104, the seven in a DEPRECATED section
 * the project keeps out. `const FULL =
 * true` returns the whole library payload instead, previews and icons
 * included: what the UI would post, for a caller that posts it itself.
 */
const HEADLESS = typeof __html__ === 'undefined';

if (!HEADLESS) figma.showUI(__html__, { themeColors: true, width: 320, height: 160 });

// Registers the plugin in the file's right-panel Tools section (root-level
// relaunch data); the manifest's relaunchButtons must carry the same command,
// which means a re-import after the manifest gained it. Written only when
// missing: the write is an edit, and a receiver that compares edits with
// releases would otherwise see every run as unreleased work. Quiet on a
// view-only file.
if (!HEADLESS) try {
  if (!('snapshot' in figma.root.getRelaunchData())) figma.root.setRelaunchData({ snapshot: 'Post tokens, components and frames to the repo' });
} catch (e) { /* view-only */ }

/*
 * Which FILE this is, in a way the receiver can rely on.
 *
 * `figma.fileKey` was undefined for a plugin run from Development, which is how
 * this one is always run, until the manifest asked for it (0.67.0) — so every payload arrived anonymous, and a receiver
 * had nothing to check. That mattered the moment a second project existed: the
 * plugin posts to a fixed port, so whichever repo happened to be listening
 * wrote whatever was snapshotted, and two libraries both named "UI library"
 * gave nobody a clue.
 *
 * So the file identifies itself. The id is generated once, stored on the
 * document root, and travels with every payload after that: unique because we
 * make it, stable because it lives in the file, and unaffected by renaming the
 * file or duplicating a page — but not by duplicating the FILE: a copy carries
 * its original's plugin data, id and all. So the manifest asks for the key
 * (0.67.0), every run sends it, and the router addresses a payload by it
 * first: a copy, with a key of its own, is a new file whatever id it carries.
 *
 * Written only when missing, for the same reason the relaunch data above is:
 * the write is an EDIT, and a file that gains an edit on every snapshot reads
 * as unreleased work to anything comparing edits with releases.
 *
 * A view-only file cannot be stamped. It returns null rather than inventing an
 * id per run, because an id that changes every time is worse than none: it
 * would look like a new file each snapshot.
 */
function fileId() {
  try {
    let id = figma.root.getPluginData('snapshotFileId');
    // headless runs under another plugin (the bridge), whose own pluginData no run of this one reads: an id written
    // there is an edit to the file for nothing, so it is read, never made (the key names the file)
    if (!id && !HEADLESS) {
      id = 'f' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
      figma.root.setPluginData('snapshotFileId', id);
    }
    return id || null;
  } catch (e) {
    return null;   // view-only
  }
}

/** @param {string} text @param {string=} kind */
/* A step, and where it has a count, how far through it is: the window draws
   a bar that fills (knowledge/ui/patterns/feedback.md, *Loading*). */
const say = (text, done, total) => { if (!HEADLESS) figma.ui.postMessage({ type: 'progress', text, done, total }); };

// ---- helpers ---------------------------------------------------------------
/** @param {RGB | RGBA} c @param {number=} opacity */
const colour = (c, opacity) => {
  const a = ('a' in c ? c.a : 1) * (opacity === undefined ? 1 : opacity);
  const rgb = [c.r, c.g, c.b].map((v) => Math.round(v * 255));
  if (a >= 0.9995) return '#' + rgb.map((v) => ('0' + v.toString(16)).slice(-2)).join('');
  return `rgb(${rgb.join(' ')} / ${+a.toFixed(3)})`;
};
// Figma's cloud (the MCP route) hands a description back HTML-escaped, where the app gives the text as typed;
// unescaped on both routes, so a literal entity typed in the app also reads as its character.
/** @param {string} t */
const unescaped = (t) => t.replace(/&(lt|gt|amp|quot|#39);/g, (m, e) => ({ lt: '<', gt: '>', amp: '&', quot: '"', '#39': "'" })[e]);
/** @param {unknown} v */
const clean = (v) => (typeof v === 'symbol' ? 'mixed' : v);
/** @param {unknown} v */
const round = (v) => (typeof v === 'number' ? +v.toFixed(2) : v);

/** @type {Record<string, Variable | null>} */
const varCache = {};
/** @param {string} id */
async function variable(id) {
  if (!(id in varCache)) varCache[id] = await figma.variables.getVariableByIdAsync(id);
  return varCache[id];
}
/** @param {unknown} id */
async function styleName(id) {
  if (!id || typeof id !== 'string') return null;
  const s = await figma.getStyleByIdAsync(id);
  return s ? s.name : null;
}
/** @param {SceneNode} n */
async function numberBindings(n) {
  const bv = /** @type {Record<string, {id: string} | undefined>} */ (('boundVariables' in n && n.boundVariables) || {});
  const name = async (/** @type {string} */ k) => { const b = bv[k]; if (!b || !('id' in b)) return null; const v = await variable(b.id); return v ? v.name : null; };
  const four = async (/** @type {string[]} */ keys) => { const r = await Promise.all(keys.map(name)); return r.some(Boolean) ? r : null; };
  /** @type {Record<string, unknown>} */ const out = {};
  const pad = await four(['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft']); if (pad) out.pad = pad;
  const gap = await name('itemSpacing'); if (gap) out.gap = gap;
  const crossGap = await name('counterAxisSpacing'); if (crossGap) out.crossGap = crossGap;
  const radius = await four(['topLeftRadius', 'topRightRadius', 'bottomRightRadius', 'bottomLeftRadius']);
  if (radius) out.radius = radius.every((r) => r === radius[0]) ? radius[0] : radius;
  const stroke = await four(['strokeTopWeight', 'strokeRightWeight', 'strokeBottomWeight', 'strokeLeftWeight']);
  const strokeOne = await name('strokeWeight');
  if (stroke || strokeOne) out.strokeWeight = stroke ? stroke.map((w) => w || strokeOne) : [strokeOne, strokeOne, strokeOne, strokeOne];
  const opacity = await name('opacity'); if (opacity) out.opacity = opacity;
  for (const k of ['minWidth', 'minHeight', 'maxWidth', 'maxHeight', 'width', 'height']) { const v = await name(k); if (v) out[k === 'width' ? 'w' : k === 'height' ? 'h' : k] = v; }
  return Object.keys(out).length ? out : null;
}

/**
 * A text style's variable bindings: `{ fontFamily, fontSize, fontWeight,
 * lineHeight, letterSpacing }`, each `{ collection, name }`, present only where
 * bound. A weight is bound through `fontStyle` (a string variable such as
 * "Semi Bold") as often as through `fontWeight`; either is the weight.
 * @param {TextStyle} s
 */
async function textStyleBindings(s) {
  const bv = /** @type {Record<string, any>} */ (s.boundVariables || {});
  /** @type {Record<string, {collection: string | null, name: string}>} */ const out = {};
  // a bound key ships as an alias object OR a one-element array of them
  const one = (/** @type {any} */ x) => (Array.isArray(x) ? x[0] : x);
  for (const [field, keys] of [['fontFamily', ['fontFamily']], ['fontSize', ['fontSize']], ['fontWeight', ['fontWeight', 'fontStyle']], ['lineHeight', ['lineHeight']], ['letterSpacing', ['letterSpacing']]]) {
    const alias = keys.map((k) => one(bv[k])).find((a) => a && a.id);
    const v = alias ? await variable(alias.id) : null;
    if (!v) continue;
    const c = await figma.variables.getVariableCollectionByIdAsync(v.variableCollectionId);
    out[field] = { collection: c ? c.name : null, name: v.name };
  }
  return out;
}

/**
 * A component's anatomy, drawn on everything it can show AT ONCE: the default
 * variant as an instance with every boolean property on — except where two of
 * them turn out to be alternatives, which overlap gives away — exported at
 * 2x, and its parts measured on that same instance, relative to the image's
 * edges (its render bounds, which take in shadows), so a marker cannot drift
 * from what it labels. Any boolean switched back off is named in `hidden`,
 * so a reader is told rather than left to wonder what is missing.
 *
 * A part is a text layer or a nested instance, or a container a boolean
 * shows or hides; other frames are looked through. Each says which boolean
 * shows it (`optional`), inherited from a container that does. Repeated
 * siblings of one kind (a slot's five items) are one part with a count.
 * @param {ComponentSetNode | ComponentNode} set @param {SceneNode} shown
 */
// Every temporary node (a render, a measurement) is built on a page of its
// own, removed when the run ends, so nothing appears on the page the
// designer is looking at. A page left by a run that crashed is reused.
const SCRATCH = 'Snapshot (temporary)';
/** @type {PageNode | null} */ let scratchPage = null;
const scratch = () => scratchPage
  || (scratchPage = figma.root.children.find((p) => p.name === SCRATCH) || Object.assign(figma.createPage(), { name: SCRATCH }));

// The same file runs where the Figma MCP runs it (use_figma, tools/snapshot/mcp.mjs), in Figma's cloud: there a node
// whose text is in a font the cloud lacks cannot be moved, and every page is loaded on its own. Each falls back (as does drawnIn, below) only
// where the app's own call is refused, so a snapshot is the same from either.
/** @param {BaseNode & ChildrenMixin} parent @param {SceneNode} node @returns {boolean} whether it moved */
const place = (parent, node) => {
  try { parent.appendChild(node); return true; } catch (e) { if (/unloaded font/.test(message(e))) return false; throw e; }
};
const loadPages = async () => {
  try { await figma.loadAllPagesAsync(); } catch (e) { for (const p of figma.root.children) await p.loadAsync(); }
};

async function anatomyOf(set, shown) {
  const defs = set.componentPropertyDefinitions || {};
  const booleans = Object.keys(defs).filter((k) => defs[k].type === 'BOOLEAN');
  const frame = figma.createFrame();
  scratch().appendChild(frame);
  frame.clipsContent = false;
  /** @type {InstanceNode | null} */ let made = null;
  try {
    const inst = made = /** @type {ComponentNode} */ (shown).createInstance();
    place(frame, inst);
    if (booleans.length) inst.setProperties(Object.fromEntries(booleans.map((k) => [k, true])));
    /*
     * A PLAIN COPY, and a mutable one.
     *
     * Every part is measured against this, and the re-draw below moves it —
     * switching a boolean off changes the instance's bounds. 0.37.0 rebased
     * it with `Object.assign` onto the object Figma returned, which is the
     * API's own and not ours to write: the assignment threw, the throw was
     * swallowed by the catch that keeps a failed anatomy from sinking the
     * preview, and the component lost its anatomy entirely. `table-toolbar` —
     * the very component the overlap rule was written for — came back from
     * the next snapshot with a preview and no anatomy at all.
     */
    const bounds0 = inst.absoluteRenderBounds || inst.absoluteBoundingBox;
    if (!bounds0) return null;
    let origin = { x: bounds0.x, y: bounds0.y, width: bounds0.width, height: bounds0.height };
    const label = (/** @type {string} */ ref) => ref.split('#')[0];
    /** @type {{ name: string, type: string, x: number, y: number, w: number, h: number, optional?: string, component?: string, count?: number }[]} */
    const parts = [];
    /** @param {SceneNode} node @param {string | undefined} optional */
    const walk = async (node, optional) => {
      /** @type {Map<string, any>} */ const seen = new Map();
      for (const c of /** @type {any} */ (node).children || []) {
        if (!c.visible) continue;
        const ref = c.componentPropertyReferences && c.componentPropertyReferences.visible;
        const opt = ref ? label(ref) : optional;
        const b = c.absoluteBoundingBox;
        if (!b || !b.width || !b.height) continue;
        const isPart = c.type === 'INSTANCE' || c.type === 'TEXT' || !!ref;
        if (!isPart) { await walk(c, opt); continue; }
        let component;
        if (c.type === 'INSTANCE') {
          const main = await c.getMainComponentAsync();
          component = main ? (main.parent && main.parent.type === 'COMPONENT_SET' ? main.parent.name : main.name) : undefined;
        }
        const kind = `${c.type}|${c.name}|${component || ''}`;
        if (seen.has(kind)) { seen.get(kind).count = (seen.get(kind).count || 1) + 1; continue; }
        const part = { name: c.name, type: c.type === 'TEXT' ? 'text' : c.type === 'INSTANCE' ? 'instance' : 'frame',
          x: Math.round(b.x - origin.x), y: Math.round(b.y - origin.y), w: Math.round(b.width), h: Math.round(b.height),
          ...(opt && { optional: opt }), ...(component && { component }),
          // where a text box's words sit in it, so a marker points at them
          ...(c.type === 'TEXT' && c.textAlignHorizontal !== 'LEFT' && { align: String(c.textAlignHorizontal).toLowerCase() }) };
        seen.set(kind, part);
        parts.push(part);
      }
    };
    await walk(inst, undefined);
    if (!parts.length) return null;

    /*
     * "Every option on" is wrong where two options are alternatives.
     *
     * A table toolbar has a Filter panel, a Sort panel and a Group panel, and
     * one boolean each. All three on at once is not a component with all its
     * parts showing, it is three overlays stacked on one another: the drawing
     * came out as three popovers on top of each other, most of each hidden,
     * and the markers for the covered parts pointed into another panel.
     *
     * Overlap is the evidence, so nothing has to know what a "panel" is:
     * where two parts shown by DIFFERENT booleans cover each other more than
     * half, they are alternatives. Keep the first in reading order, switch
     * the rest off, and draw again. A boolean that shows a part overlapping
     * nothing is untouched, which is every ordinary optional part.
     */
    const area = (p) => p.w * p.h;
    const over = (p, q) => Math.max(0, Math.min(p.x + p.w, q.x + q.w) - Math.max(p.x, q.x))
      * Math.max(0, Math.min(p.y + p.h, q.y + q.h) - Math.max(p.y, q.y));
    const optional = parts.filter((p) => p.optional);
    /** @type {Set<string>} */ const off = new Set();
    for (let i = 0; i < optional.length; i++) {
      for (let j = i + 1; j < optional.length; j++) {
        const p = optional[i], q = optional[j];
        if (p.optional === q.optional || off.has(p.optional) || off.has(q.optional)) continue;
        if (over(p, q) > Math.min(area(p), area(q)) / 2) off.add(q.optional);
      }
    }
    /*
     * The re-draw must never cost the drawing.
     *
     * Switching the alternatives off is an IMPROVEMENT to the picture, and an
     * improvement that fails should leave the picture it was improving — not
     * take it down with it. The first version threw partway through and the
     * component shipped with no anatomy at all, which is strictly worse than
     * the overlapping one it set out to fix.
     */
    if (off.size) {
      const keep = parts.slice(), keepOrigin = origin;
      try {
        /*
         * BY THE PROPERTY'S FULL KEY, not the label.
         *
         * A component property is addressed as `Filter panel#123:4`, and a
         * layer's `componentPropertyReferences.visible` carries that whole
         * string — which is stripped to `Filter panel` for reading, because
         * that is what a person calls it. Feeding the stripped name back to
         * `setProperties` is not a property this component has, so Figma
         * rejected it and the re-draw threw on EVERY component that needed
         * it. The fallback added alongside it then restored the overlapping
         * drawing, correctly and silently, which is how a rule that fires
         * nowhere looked like a rule with nothing to do.
         */
        const keyOf = new Map(booleans.map((k) => [label(k), k]));
        const pairs = [...off].map((k) => [keyOf.get(k), false]).filter(([k]) => k);
        if (pairs.length !== off.size) throw new Error('a boolean to switch off has no property key');
        inst.setProperties(Object.fromEntries(pairs));
        const again = inst.absoluteRenderBounds || inst.absoluteBoundingBox;
        if (!again) throw new Error('no bounds after the re-draw');
        parts.length = 0;
        origin = { x: again.x, y: again.y, width: again.width, height: again.height };
        await walk(inst, undefined);
        if (!parts.length) throw new Error('the re-draw left nothing to label');
      } catch (e) {
        /*
         * Back to the drawing with everything on, overlaps and all — and the
         * RESTORE has to succeed before the measurements go back with it.
         *
         * The first version swallowed a failed restore and put `parts` back
         * to the all-on measurement anyway, while the instance might still be
         * drawn with the alternatives off. The exported PNG would then
         * disagree with every marker on it, and `hidden` would be empty, so
         * nothing said the picture and its labels were describing different
         * drawings. A missing anatomy is recoverable; a wrong one is believed.
         */
        off.clear();
        try {
          inst.setProperties(Object.fromEntries(booleans.map((k) => [k, true])));
        } catch (e2) {
          return null;   // cannot say what is drawn, so do not label it
        }
        parts.length = 0;
        for (const p of keep) parts.push(p);
        origin = keepOrigin;
      }
    }

    const png = figma.base64Encode(await inst.exportAsync({ format: 'PNG', constraint: { type: 'SCALE', value: 2 } }));
    return { w: Math.round(origin.width), h: Math.round(origin.height), png, parts,
      ...(off.size && { hidden: [...off] }) };
  } finally { frame.remove(); if (made && !made.removed) made.remove(); }
}

/** @type {Record<string, string>} */
const swapCache = {};
/** @param {string} id */
async function swapName(id) {
  if (!(id in swapCache)) {
    const node = await figma.getNodeByIdAsync(id);
    // a variant is named by its set: "sun / Size=20" reads as sun
    swapCache[id] = node ? (node.parent && node.parent.type === 'COMPONENT_SET' ? node.parent.name : node.name) : id;
  }
  return swapCache[id];
}
/** @param {unknown} paints */
/*
 * A linear gradient as an angle and stops, the way CSS wants it.
 *
 * Lived only inside the paint-style loop until 2026-09-08, so a gradient
 * painted directly on a node came through as the bare word GRADIENT_LINEAR —
 * a value nothing downstream could render or compare. An empty state's halo
 * was that word.
 */
async function gradient(p) {
  const [[a, b, c], [d, e, f]] = p.gradientTransform;
  const det = a * e - b * d;
  const inv = (/** @type {number} */ x, /** @type {number} */ y) => [(e * (x - c) - b * (y - f)) / det, (-d * (x - c) + a * (y - f)) / det];
  const [x0, y0] = inv(0, 0.5), [x1, y1] = inv(1, 0.5);
  const angle = Math.round((Math.atan2(y1 - y0, x1 - x0) * 180 / Math.PI + 90 + 360) % 360);
  const stops = [];
  for (const st of p.gradientStops) {
    const bound = st.boundVariables && st.boundVariables.color;
    const v = bound ? await variable(bound.id) : null;
    stops.push({ position: +st.position.toFixed(4), color: v ? v.name : colour(st.color, p.opacity) });
  }
  // The transform itself, rounded: the handles' angle alone does not fix a
  // diagonal's direction on a box that is not square. Two 135° gradients in
  // one screen rendered at CSS 135° and 110.9°; the colour at a point is the
  // transform's first row applied to it, so a reader derives the CSS angle
  // and the stop positions from this and the box it fills.
  const transform = p.gradientTransform.map((row) => row.map((v) => +v.toFixed(6)));
  return { type: 'GRADIENT_LINEAR', angle, transform, stops };
}

async function paintNames(paints) {
  if (!Array.isArray(paints)) return 'mixed';
  const out = [];
  for (const p of paints) {
    if (p.visible === false) continue;
    const bound = p.boundVariables && p.boundVariables.color;
    if (bound) { const v = await variable(bound.id); out.push(v ? v.name : bound.id); }
    else if (p.type === 'SOLID') out.push(colour(p.color, p.opacity));
    else if (p.type === 'GRADIENT_LINEAR') out.push(await gradient(p));
    // An image's scale mode is the whole question for a reader: Crop and Tile
    // have no CSS `object-fit` answer, Fill and Fit do. `IMAGE` alone cannot
    // be told apart, so the validator's image rule was silent on every stored
    // snapshot and fired only from its own live reader.
    else if (p.type === 'IMAGE') out.push('IMAGE:' + p.scaleMode);
    else out.push(p.type);
  }
  return out;
}

// ---- tokens ------------------------------------------------------------------
// Figma's AUTO line height is the font's ascender + descender rounded to whole
// pixels. Measuring it needs a font load, which has hung in degraded sandboxes,
// so the measure is raced against a timeout and falls back to the metric; the
// source is recorded either way.
/** @type {Record<string, number>} */
const METRIC = { Inter: 1.2109375, 'Inter Display': 1.2109375 };
/** @param {TextStyle} s @returns {Promise<number | null>} */
const measureStyle = (s) => new Promise((resolve) => {
  const timer = setTimeout(() => resolve(null), 4000);
  figma.loadFontAsync(s.fontName).then(() => {
    const t = figma.createText();
    scratch().appendChild(t);
    t.fontName = s.fontName; t.fontSize = s.fontSize; t.characters = 'Hg';
    const h = t.height; t.remove();
    clearTimeout(timer); resolve(h);
  }).catch(() => { clearTimeout(timer); resolve(drawnIn(s)); });
});
/* A font the run cannot load (use_figma, in Figma's cloud): the height of a one-line text already drawn in the style,
   which is the same line, set by the same metrics. Null where none is, and the metric stands. */
/** @param {TextStyle} s @returns {number | null} */
const drawnIn = (s) => {
  for (const p of figma.root.children) {
    if (p.name === SCRATCH) continue;
    const t = /** @type {TextNode[]} */ (p.findAllWithCriteria({ types: ['TEXT'] }))
      .find((x) => x.textStyleId === s.id && x.textAutoResize === 'WIDTH_AND_HEIGHT' && x.characters && !/\n/.test(x.characters) && !x.characters.includes(String.fromCharCode(0x2028)));
    if (t) return t.height;
  }
  return null;
};

async function collectTokens() {
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  // Every collection under its own name, with its own modes: the payload
  // assumes no collection is called anything in particular (toolkit-standard
  // §D 7). It carried five named lookups until 0.32.0 — a convenience for two
  // repo receivers that no longer exist — and with them five collection names
  // and four mode names compiled into a plugin that serves every project.
  // No collections is a components-only file of a system whose variables live
  // elsewhere: its tokens are empty, and the store merges it without erasing
  // the other file's.

  /** @param {VariableCollection} collection @param {string=} modeName */
  async function read(collection, modeName) {
    const mode = collection.modes.find((m) => !modeName || m.name === modeName) || collection.modes[0];
    /** @type {Record<string, unknown>} */ const out = {};
    /** @type {Record<string, string>} */ const alias = {};
    /** @type {Record<string, string>} */ const keys = {};
    // the fields Figma's picker offers each variable in; mode-independent, as a key is
    /** @type {Record<string, string[]>} */ const scopes = {};
    /** @type {Record<string, string>} */ const described = {};
    /** @type {string[]} */ const hidden = [];
    for (const id of collection.variableIds) {
      const v = await variable(id);
      if (!v) continue;
      // An EXTENDED collection shares its parent's variables and has modes of
      // its own, so `valuesByMode` — keyed by the parent's modes — has nothing
      // under them. Read here, one project's "Brand B" was stored with both its
      // modes and not one value. Figma resolves the extension's values,
      // overrides and inherited alike, through this call.
      const own = collection.isExtension ? await v.valuesByModeForCollectionAsync(collection) : v.valuesByMode;
      // A tier hidden from publishing is a decision about who may use it; the
      // token export marks it, and lost it when it read the snapshot.
      if (v.hiddenFromPublishing) hidden.push(v.name);
      // What the variable is for, in the designer's words. The doc generator
      // reads OKLCH sources from here and a docs site reads the role; neither
      // could while the snapshot left it behind and they walked the file live.
      if (v.description) described[v.name] = v.description;
      // its key: what another file imports it by (tools/component-contract/to-figma.mjs binds a drawing to it)
      keys[v.name] = v.key;
      scopes[v.name] = [...v.scopes];
      /** @type {VariableValue | undefined} */
      let raw = own[mode.modeId];
      let ref = null;
      // follow aliases to the value, remembering the first hop's name
      while (raw && typeof raw === 'object' && 'type' in raw && raw.type === 'VARIABLE_ALIAS') {
        const target = await variable(raw.id);
        if (!target) break;
        if (!ref) ref = target.name;
        const tc = await figma.variables.getVariableCollectionByIdAsync(target.variableCollectionId);
        // Without case: one collection's `Dark` is another's `dark`, and an
        // exact match falls through to the target's FIRST mode — a Light
        // value written into the Dark map, well-formed and wrong. The store's
        // own reader (tokens.cjs) has matched without case since it was
        // written; this side had not.
        const tm = tc ? (tc.modes.find((m) => m.name.toLowerCase() === mode.name.toLowerCase()) || tc.modes[0]) : null;
        raw = tm ? target.valuesByMode[tm.modeId] : undefined;
      }
      out[v.name] = raw && typeof raw === 'object' && 'r' in raw ? colour(raw) : raw;
      if (ref) alias[v.name] = ref;
    }
    return { values: out, alias, described, hidden, keys, scopes };
  }

  say('reading variables');
  // Every collection, every mode, under Figma's own names. Read once here and
  // reused for the legacy keys below, so nothing is fetched twice.
  /** @type {Record<string, { modes: string[], values: Record<string, unknown>, alias: Record<string, unknown>, descriptions: Record<string, string>, hidden?: string[], keys?: Record<string, string>, scopes?: Record<string, string[]>, extends?: string }>} */
  const byName = {};
  for (const c of collections) {
    const entry = { modes: c.modes.map((m) => m.name), values: {}, alias: {}, descriptions: {} };
    // Which collection an extension extends, so a reader can say what it is.
    if (c.isExtension) {
      const parent = await figma.variables.getVariableCollectionByIdAsync(c.parentVariableCollectionId).catch(() => null);
      if (parent) entry.extends = parent.name;
    }
    for (const m of c.modes) {
      const r = await read(c, m.name);
      entry.values[m.name] = r.values;
      entry.alias[m.name] = r.alias;
      // a description belongs to the variable, not the mode: every mode reads the same one
      entry.descriptions = r.described;
      if (r.hidden.length) entry.hidden = r.hidden;
      entry.keys = r.keys;
      entry.scopes = r.scopes;
    }
    byName[c.name] = entry;
  }
  /** @type {Record<string, number>} */ const collectionCounts = {};
  for (const c of collections) collectionCounts[c.name] = c.variableIds.length;

  say('reading text styles');
  const textStyles = [];
  for (const s of await figma.getLocalTextStylesAsync()) {
    let lh, source;
    if (s.lineHeight.unit === 'AUTO') {
      const h = await measureStyle(s);
      if (h !== null) { lh = +(h / s.fontSize).toFixed(4); source = 'measured'; }
      else { lh = +(Math.round(s.fontSize * (METRIC[s.fontName.family] || 1.2)) / s.fontSize).toFixed(4); source = 'metric'; }
    } else if (s.lineHeight.unit === 'PERCENT') { lh = +(s.lineHeight.value / 100).toFixed(4); source = 'style'; }
    else { lh = +(s.lineHeight.value / s.fontSize).toFixed(4); source = 'style'; }
    textStyles.push({
      // its key, as each effect's: what another file imports it by (tools/component-contract/to-figma.mjs)
      name: s.name, key: s.key, family: s.fontName.family, weight: s.fontName.style, size: s.fontSize,
      lineHeight: lh, lineHeightSource: source,
      // In em, whichever unit the style uses, as the line height is: pixels
      // were sent raw beside percent as a fraction, and every reader took
      // both for em, so -0.5px read as -0.5em.
      letterSpacing: +(s.letterSpacing.unit === 'PERCENT' ? s.letterSpacing.value / 100 : s.letterSpacing.value / s.fontSize).toFixed(4),
      // the two spacings a style owns beside its line height: between the
      // paragraphs of a block, and between the items of a list. A designer
      // changed both on every Text style on 2026-09-06 and the snapshot
      // said nothing, because nothing here carried them. Always sent, 0
      // included, so a change back to nothing is a change the diff can see.
      paragraphSpacing: typeof s.paragraphSpacing === 'number' ? s.paragraphSpacing : 0,
      listSpacing: typeof s.listSpacing === 'number' ? s.listSpacing : 0,
      // The variables the style's fields are bound to, as Figma records them.
      // Readers guessed them from a naming convention (`<style>/size`) because
      // nothing here said; a binding that broke the convention went missing.
      bound: await textStyleBindings(s),
      // As the designer typed them, for documentation that shows the units the
      // file uses (130%, 24px, Auto); the fields above are converted for code.
      authored: { lineHeight: s.lineHeight, letterSpacing: s.letterSpacing },
      // The style's library key, so a documentation page can apply the style
      // itself to its sample text.
      key: s.key,
    });
  }

  // Colour styles: solids and linear gradients, stops as token names where
  // bound. The gradient angle comes from the handles (inverse of
  // gradientTransform, in the node's unit square), so a gradient drawn on a
  // wide frame reads as on a square one — the CSS side states the direction
  // it needs when that is not enough.
  const paintStyles = [];
  for (const ps of await figma.getLocalPaintStylesAsync()) {
    const paints = [];
    for (const p of ps.paints) {
      if (p.visible === false) continue;
      if (p.type === 'SOLID') { paints.push({ type: 'SOLID', color: (await paintNames([p]))[0] }); continue; }
      if (p.type === 'GRADIENT_LINEAR') { paints.push(await gradient(p)); continue; }
      paints.push({ type: p.type });
    }
    paintStyles.push({ name: ps.name, paints });
  }

  const effects = [];
  for (const e of await figma.getLocalEffectStylesAsync()) {
    const layers = [];
    for (const x of e.effects.filter((y) => y.visible !== false)) {
      // A blur layer has a radius and nothing else; it is sent so the style is
      // documented whole, and a token build skips it with a warning, as DTCG's
      // shadow type cannot carry it.
      if (!/SHADOW/.test(x.type)) { layers.push({ type: x.type, blur: /** @type {BlurEffect} */ (x).radius }); continue; }
      const sh = /** @type {DropShadowEffect | InnerShadowEffect} */ (x);
      // The variables each field is bound to, as for a text style: the
      // token export kept a shadow's references and the snapshot sent only
      // its resolved values, so a shadow built from the snapshot lost its tier.
      /** @type {Record<string, {collection: string | null, name: string}>} */ const bound = {};
      const bv = /** @type {Record<string, {id: string} | undefined>} */ (sh.boundVariables || {});
      for (const [field, key] of [['color', 'color'], ['x', 'offsetX'], ['y', 'offsetY'], ['blur', 'radius'], ['spread', 'spread']]) {
        const v = bv[key] ? await variable(/** @type {{id: string}} */ (bv[key]).id) : null;
        if (!v) continue;
        const c = await figma.variables.getVariableCollectionByIdAsync(v.variableCollectionId);
        bound[field] = { collection: c ? c.name : null, name: v.name };
      }
      layers.push({ type: sh.type, x: sh.offset.x, y: sh.offset.y, blur: sh.radius, spread: sh.spread || 0, color: colour(sh.color), ...(Object.keys(bound).length && { bound }) });
    }
    effects.push({ name: e.name, key: e.key, layers });
  }

  return {
    _meta: {
      file: figma.root.name, fileKey: figma.fileKey, fileId: fileId(), snapshot: new Date().toISOString().slice(0, 10), plugin: VERSION,
      // Per collection, under its own name. The store computes the collection
      // LIST from the merged store — a two-file project's list is not this
      // file's — so sending one from here would be a second answer.
      collectionCounts: collectionCounts,
      lineHeightNote: 'AUTO line heights replaced with ratios measured from rendered single-line text nodes; CSS normal does not match Figma AUTO.',
      // The page list in the file's order: category headers (`🔷 INPUTS`),
      // dividers (`---`) and component pages, so a reader can group
      // components the way the file does (figma-standard rule 11).
      // The scratch page this run makes for its own renders is not the
      // file's: it reached a docs site's category list once, between being
      // created and removed.
      pages: figma.root.children.map((p) => p.name).filter((n) => n !== SCRATCH),
    },
    // Every collection, every mode, under Figma's own names.
    collections: byName,
    textStyles,
    paintStyles,
    effects,
  };
}

// ---- node trees --------------------------------------------------------------
// One tree per variant, or per screen frame: what a parity probe needs — box,
// layout, strokes per side and alignment, fills as token names, text style,
// effect. Instances are named, not descended: their spec is their component's.
// screens walk their instances whole (a screen IS an instance of its screen
// component); the library walks only what an override touched
let walkWhole = false;

/* The plugin's release, sent in every payload's `_meta.plugin`, so a reader
   can tell "this field was not recorded then" from "no layer had it then":
   the store graded the first rotation, opacity or shadow a library ever drew
   as nothing, because the field was recorded nowhere in the older snapshot
   (review of 2 October 2026, round 4). Kept equal to package.json by
   tests/test-walk.mjs. */
const VERSION = '0.67.1';

/** @type {string[]} */
const unrecordedSeen = [];

/*
 * A slot is a SLOT only in a component or an instance: detaching an instance
 * turns every slot into a FRAME. The boolean-derived variants below are
 * walked after detachInstance(), so their slots were recorded as frames, and
 * a reader that finds a slot by type (the parity engine's coverage gates)
 * walked into them as the instance's own chrome. The slots are noted on the
 * instance by their place among visible children — the order walk() keeps —
 * and put back on the walked tree.
 */
/** @param {SceneNode} n @param {number[]} [path] @param {number[][]} [out] */
function slotPaths(n, path = [], out = []) {
  const kids = 'children' in n ? n.children.filter((c) => c.visible !== false) : [];
  kids.forEach((c, i) => { const p = [...path, i]; if (c.type === 'SLOT') out.push(p); slotPaths(c, p, out); });
  return out;
}
/** @param {Record<string, unknown>} tree @param {number[][]} paths */
function markSlots(tree, paths) {
  for (const p of paths) {
    /** @type {any} */ let t = tree;
    for (const i of p) t = t && Array.isArray(t.children) ? t.children[i] : undefined;
    if (t) t.type = 'SLOT';
  }
  return tree;
}

/* Annotation categories by id, read once a run: a note names its category
   (Development, Interaction, Accessibility, Content), not an id. */
let noteCategories = null;
/** @param {SceneNode} n */
async function notesOf(n) {
  if (!('annotations' in n) || !n.annotations || !n.annotations.length) return null;
  if (!noteCategories) {
    noteCategories = new Map();
    try { for (const c of await figma.annotations.getAnnotationCategoriesAsync()) noteCategories.set(c.id, c.label); } catch (e) { /* no categories: notes travel without one */ }
  }
  const out = n.annotations
    .map((a) => ({ text: (a.labelMarkdown || a.label || '').trim(), ...(a.categoryId && noteCategories.get(a.categoryId) && { category: noteCategories.get(a.categoryId) }), ...(a.properties && a.properties.length && { properties: a.properties.map((p) => p.type) }) }))
    .filter((a) => a.text || a.properties);
  return out.length ? out : null;
}

/** @param {SceneNode} n @param {number} depth @returns {Promise<Record<string, unknown>>} */
async function walk(n, depth) {
  /** @type {Record<string, unknown>} */
  const o = { name: n.name, type: n.type, w: round(n.width), h: round(n.height) };
  // where the layer sits in its parent: alignment inside a box is what a
  // size-only comparison cannot see (a menu centred instead of packed right)
  // n.x/n.y is the origin of the node's own transform, which for a rotated
  // layer is not where the eye sees it: the disclaimer icosphere is stored at
  // 587 in a 402 frame and drawn at 164. Every consumer has to reason about
  // that, and two of them reasoned differently — one waived x as "the visual
  // right edge", another matched x directly and was also right, because the
  // adjustment depends on the angle. So a rotated layer also carries the box
  // the eye sees, in the same coordinates, and nothing downstream has to
  // derive it. absoluteBoundingBox is Figma's own answer for that box.
  if (depth > 0) {
    o.x = round(n.x); o.y = round(n.y);
    // What a reader sees turned, which is not the layer's rotation: Figma
    // turns an image fill inside its frame with its own transform, and a
    // layer rotated 180 around a fill rotated 180 shows the asset upright.
    // The disclaimer hero shipped upside down because only the layer's
    // rotation was recorded, and a rotation is invisible to every other
    // property — the box, the fills and the effects all measure the same.
    if ('fills' in n && Array.isArray(n.fills)) {
      const img = n.fills.find((f) => f.type === 'IMAGE' && f.imageTransform);
      if (img) {
        const [[a, b], [c, d]] = img.imageTransform;
        const deg = Math.round((Math.atan2(b, a) * 180) / Math.PI);
        if (deg) o.fillRotation = deg;
      }
    }
    if ('rotation' in n && n.rotation && n.absoluteBoundingBox && n.parent && 'absoluteBoundingBox' in n.parent && n.parent.absoluteBoundingBox) {
      const b = n.absoluteBoundingBox, p = n.parent.absoluteBoundingBox;
      o.visual = { x: round(b.x - p.x), y: round(b.y - p.y), w: round(b.width), h: round(b.height) };
    }
  }
  if ('layoutMode' in n && n.layoutMode !== 'NONE') {
    o.layout = n.layoutMode; o.pad = [n.paddingTop, n.paddingRight, n.paddingBottom, n.paddingLeft];
    o.gap = clean(n.itemSpacing); o.wrap = n.layoutWrap === 'WRAP';
    // the spacing between wrapped lines, where Figma sets one apart from
    // itemSpacing; listed as recorded under `gap` until 0.49.0, which it
    // never was. Null is "the same as items", and is recorded as that value:
    // left out, a reader had nothing to hold a wrapped row's line spacing to,
    // and the unrecorded check skips a null (review of 2 October 2026,
    // round 3, S14).
    if (o.wrap) o.crossGap = typeof n.counterAxisSpacing === 'number' ? clean(n.counterAxisSpacing) : o.gap;
    // canvas stacking, first on top: which of two overlapping children paints over the other (0.62.0)
    if (n.itemReverseZIndex) o.firstOnTop = true;
    o.align = n.primaryAxisAlignItems + '/' + n.counterAxisAlignItems;
  }
  if ('layoutSizingHorizontal' in n) o.sizing = n.layoutSizingHorizontal + '/' + n.layoutSizingVertical;
  if ('layoutPositioning' in n && n.layoutPositioning === 'ABSOLUTE') o.absolute = true;
  // how a layer no auto layout places follows its parent's size (a focus ring stretched round its button, a spinner
  // kept at its centre), left out at Figma's default, pinned top left (0.61.0)
  const placed = o.absolute || !(n.parent && 'layoutMode' in n.parent && n.parent.layoutMode !== 'NONE');
  if (placed && n.type !== 'COMPONENT' && n.constraints && (n.constraints.horizontal !== 'MIN' || n.constraints.vertical !== 'MIN')) o.constraints = n.constraints.horizontal + '/' + n.constraints.vertical;
  if ('minWidth' in n) {
    if (n.minWidth) o.minWidth = n.minWidth; if (n.maxWidth) o.maxWidth = n.maxWidth;
    if (n.minHeight) o.minHeight = n.minHeight; if (n.maxHeight) o.maxHeight = n.maxHeight;
  }
  if ('cornerRadius' in n && clean(n.cornerRadius) !== 0) {
    o.radius = clean(n.cornerRadius) === 'mixed' && 'topLeftRadius' in n
      ? [n.topLeftRadius, n.topRightRadius, n.bottomRightRadius, n.bottomLeftRadius] : clean(n.cornerRadius);
  }
  // Corner smoothing (Figma's "squircle") and a mask layer: both change what
  // is drawn and neither has a plain CSS equivalent, which is exactly what a
  // build has to be told. Recorded since 0.33.0 — without them the
  // component-validator's snapshot path reported those classes silent while
  // its live reader saw them.
  if ('cornerSmoothing' in n && n.cornerSmoothing) o.smoothing = round(n.cornerSmoothing);
  if ('isMask' in n && n.isMask) o.mask = true;
  if ('opacity' in n && n.opacity !== 1) o.opacity = round(n.opacity);
  // A designer's Dev Mode annotation: behaviour no measurement can see ("if
  // logged into one account, this item is read-only"). Recorded since 0.58.0
  // with its category, so the store can list a note that is new or changed
  // and a build reads it beside the layer it is pinned to.
  const notes = await notesOf(n);
  if (notes) o.notes = notes;
  // Which numbers are tokens. A padding of 16 and Spacing/16 measure the same;
  // only the binding says whether the design decided it or someone typed it.
  const bound = await numberBindings(n);
  if (bound) o.bindings = bound;
  if ('clipsContent' in n && n.clipsContent) o.clips = true;
  // a blend mode and a dashed stroke both change what is drawn, and neither
  // was recorded
  if ('blendMode' in n && n.blendMode && n.blendMode !== 'PASS_THROUGH' && n.blendMode !== 'NORMAL') o.blendMode = n.blendMode;
  if ('dashPattern' in n && Array.isArray(n.dashPattern) && n.dashPattern.length) o.dashed = n.dashPattern.map(round);
  // a stroke's ends where they are not cut square (a rounded line), and an ellipse drawn as part of a circle or a ring
  // (a progress indicator at 50%), in degrees, left out where it is whole: neither was read, so a half circle drawn
  // back whole compared the same (0.62.0)
  if ('strokeCap' in n && typeof n.strokeCap === 'string' && n.strokeCap !== 'NONE' && Array.isArray(n.strokes) && n.strokes.length) o.strokeCap = n.strokeCap;
  if (n.type === 'ELLIPSE' && n.arcData) {
    const a = n.arcData, deg = (r) => Math.round((r * 180) / Math.PI * 100) / 100;
    if (a.innerRadius || Math.abs(a.endingAngle - a.startingAngle - 2 * Math.PI) > 1e-6) o.arc = { start: deg(a.startingAngle), end: deg(a.endingAngle), inner: Math.round(a.innerRadius * 1000) / 1000 };
  }
  if ('rotation' in n && n.rotation) o.rotation = round(n.rotation);
  if ('fills' in n && Array.isArray(n.fills) && n.fills.length) { const f = await paintNames(n.fills); if (f.length) o.fills = f; }
  if ('fillStyleId' in n) { const fs = await styleName(clean(n.fillStyleId)); if (fs) o.fillStyle = fs; }
  if ('strokes' in n && Array.isArray(n.strokes) && n.strokes.length) {
    o.strokes = await paintNames(n.strokes);
    o.strokeSides = 'strokeTopWeight' in n
      ? [n.strokeTopWeight, n.strokeRightWeight, n.strokeBottomWeight, n.strokeLeftWeight]
      : [clean(n.strokeWeight), clean(n.strokeWeight), clean(n.strokeWeight), clean(n.strokeWeight)];
    o.strokeAlign = n.strokeAlign;
    // Whether an inside stroke SHRINKS the box or is drawn over it. Two nodes
    // in one library disagreed — a text field's stroke took its pixel from the
    // inner frame, a list's did not — and without the flag a comparison has to
    // map both to a CSS border and be two pixels wrong on one of them.
    if ('strokesIncludedInLayout' in n) o.strokesInLayout = n.strokesIncludedInLayout;
  }
  if ('effectStyleId' in n && n.effectStyleId) o.effect = await styleName(n.effectStyleId);
  else if ('effects' in n && Array.isArray(n.effects) && n.effects.length) o.effect = 'literal';
  // WHAT the effects are, beside whether they came from a style. An inner
  // shadow, a shadow with spread, a background or progressive blur each cost
  // a build something different, and a style name says none of it.
  if ('effects' in n && Array.isArray(n.effects) && n.effects.length) {
    const kinds = n.effects.filter((e) => e.visible !== false).map((e) => e.type
      + (e.blurType === 'PROGRESSIVE' ? '_PROGRESSIVE' : '')
      + ((e.type === 'INNER_SHADOW' || e.type === 'DROP_SHADOW') && e.spread ? ':spread' : ''));
    if (kinds.length) o.effects = kinds;
  }
  if (n.type === 'TEXT') {
    // whole, so copy the design decides can be compared with what renders
    o.text = n.characters.slice(0, 400);
    o.textStyle = typeof n.textStyleId === 'symbol' ? 'mixed' : (await styleName(n.textStyleId)) || 'literal';
    // Alignment inside the box, which the box itself cannot show: a heading
    // filling its container measures identically whether the words sit left
    // or centred, and the phone Disclaimer shipped centred against a frame
    // nobody could check. Every other visual difference this loop catches;
    // this one needed a person to notice.
    o.textAlign = n.textAlignHorizontal;
    // Fixed, height-growing or fully hugging: the difference between text
    // that reflows and text that clips, and the input half of every
    // truncation rule a build applies.
    if (n.textAutoResize) o.textAutoResize = n.textAutoResize;
    // Everything else a text layer can say that its style does not, and that
    // a reader can see: SMALL CAPS and UPPERCASE, an underline, where the
    // words sit in a taller box, and letter spacing or line height typed onto
    // the layer over the style's. Each of these renders and none of them was
    // recorded, so the check could not have caught one.
    // Truncation is a design decision the box cannot show: a title clipped to
    // one line with an ellipsis measures exactly like a title whose sample
    // text happens to fit, and the code wrapping it to two lines was waived
    // as "the sample is longer" because nothing recorded the intent.
    if (n.textTruncation && n.textTruncation !== 'DISABLED') o.truncate = n.textTruncation;
    if (typeof n.maxLines === 'number' && n.maxLines > 0) o.maxLines = n.maxLines;
    if (typeof n.paragraphSpacing === 'number' && n.paragraphSpacing > 0) o.paragraphSpacing = round(n.paragraphSpacing);
    if (typeof n.listSpacing === 'number' && n.listSpacing > 0) o.listSpacing = round(n.listSpacing);
    if (n.textCase && n.textCase !== 'ORIGINAL') o.textCase = n.textCase;
    if (n.textDecoration && n.textDecoration !== 'NONE') o.textDecoration = n.textDecoration;
    if (n.textAlignVertical && n.textAlignVertical !== 'TOP') o.textAlignVertical = n.textAlignVertical;
    const ls = n.letterSpacing, lh = n.lineHeight;
    if (ls && typeof ls === 'object' && ls.value) o.letterSpacing = round(ls.value) + (ls.unit === 'PERCENT' ? '%' : '');
    /*
     * A node's AUTO line height is recorded AS 'auto', not dropped.
     *
     * It used to be skipped entirely, so the field was simply absent — which
     * is indistinguishable from "not a text node" and from "an older
     * snapshot". `component-validator`'s W9 and A4 test `lineHeight ===
     * 'auto'` and therefore could never fire on stored input: 15 rows exist
     * from when the check ran live, 0 from every snapshot since, and the
     * class read as "checked and clean" while it was structurally unable to
     * answer. A text style's AUTO is measured to a ratio elsewhere and says
     * so in `lineHeightSource`; a NODE's has no such treatment, so the honest
     * record is the word itself.
     */
    if (lh && typeof lh === 'object') {
      if (lh.unit === 'AUTO') o.lineHeight = 'auto';
      else if (lh.value) o.lineHeight = round(lh.value) + (lh.unit === 'PERCENT' ? '%' : '');
    }
  }
  if (n.type === 'INSTANCE') {
    const mc = await n.getMainComponentAsync();
    // named as the library names the component (page namespace included),
    // so an instance of Graphic/Switch is not read as the Switch control
    o.instanceOf = mc ? componentName(mc.parent && mc.parent.type === 'COMPONENT_SET' ? mc.parent : mc) + (mc.parent && mc.parent.type === 'COMPONENT_SET' ? ' / ' + mc.name : '') : null;
    /*
     * The component's IDENTITY, beside its name.
     *
     * `instanceOf` is a display string, and every reader that tried to turn it
     * back into a component had to guess: cut at the first " / " and a
     * component genuinely named `Table - Cell / Fill` loses half its name
     * (42 components across two projects are named that way, and one library
     * lost 447 of its 4,873 edges to the cut); match by name and a project
     * that defines `Button` in both its web and its mobile library cannot say
     * which was placed (15 such names in one project).
     *
     * Neither is guessable from a string, and neither has to be: the main
     * component is in hand right here. `setKey` is the published key of the
     * SET where there is one, because that is what a reader addresses; `key`
     * is the variant's own. A local-only component has no key, so the id is
     * kept as the within-file fallback.
     */
    if (mc) {
      const owner = mc.parent && mc.parent.type === 'COMPONENT_SET' ? mc.parent : mc;
      if (owner.key) o.instanceOfKey = owner.key;
      o.instanceOfId = owner.id;
    }
    /** @type {Record<string, unknown>} */ const props = {};
    for (const k of Object.keys(n.componentProperties)) {
      const cp = n.componentProperties[k];
      // an instance swap is a node id; the component's name is what a reader needs
      props[k.split('#')[0]] = cp.type === 'INSTANCE_SWAP' && typeof cp.value === 'string' ? await swapName(cp.value) : cp.value;
    }
    o.props = props;
    // an instance is its component's spec — unless something inside it was
    // overridden, in which case the overridden layers are walked so the
    // override is in the snapshot rather than hidden behind the name
    const overrides = n.overrides.filter((ov) => ov.overriddenFields.some((f) => !['componentProperties', 'name', 'visible'].includes(f)));
    // a screen is an instance of a screen component: walked whole, because
    // its layers are the page (a _Default screen with no override had none)
    if ((overrides.length || walkWhole) && depth < 12) {
      o.overrides = overrides.map((ov) => ov.overriddenFields.join(',')).slice(0, 8);
      const kids = [];
      for (const c of n.children) if (c.visible !== false) kids.push(await walk(c, depth + 1));
      o.children = kids;
    }
    return o;
  }
  if (unrecordedSeen.length < 200) unrecordedSeen.push(...unrecorded(n, o));
  if ('children' in n && depth < 12) {
    const kids = [];
    for (const c of n.children) if (c.visible !== false) kids.push(await walk(c, depth + 1));
    o.children = kids;
  }
  return o;
}

// A component is named by its set or itself, under its page when the page is
// not the component's own: the Graphic page's Switch is "Graphic/Switch".
/** @param {SceneNode} s */
const componentName = (s) => {
  let p = s.parent;
  while (p && p.type !== 'PAGE') p = p.parent;
  const pageName = p ? p.name.replace(/^\W+\s*/, '').trim() : '';
  // Trimmed on both sides before comparing. A leading space on a component's
  // name is invisible in the layers panel and made this test fail, so a set
  // called " List item - Selection" on a page of the same name came out as
  // "List item - Selection/ List item - Selection" — a doubled component in
  // every consuming repo, and a folder nobody could explain. The name is sent
  // trimmed too: a repo should not carry a typo it cannot see.
  const own = s.name.trim();
  // a private component's underscore is set aside on both sides: "_Label" on a page "_Label" is that page's own
  return own.replace(/^_/, '').indexOf(pageName.replace(/^_/, '')) === 0 ? own : pageName + '/' + own;
};

/** @param {PageNode} page */
const isIconPage = (page) => /^\W*\s*Icons?$/i.test(page.name);
/* A graphic is an illustration, not a glyph: a raster or a drawing placed at a
   size, with no Size axis and no currentColor. It exports as a PNG because a
   graphic's fill is usually an image, and an SVG of an image is that image
   base64'd inside a wrapper nobody wants. */
const isGraphicPage = (page) => /^\W*\s*Graphics?$/i.test(page.name);
/* How many visible solid fills and strokes inside an icon are not bound to a
   variable or a style: a glyph a consumer cannot recolour by token. Counted
   here because the SVG an icon exports as carries the colour and not where
   it came from. */
const unboundPaints = (node) => {
  let n = 0;
  const visit = (x) => {
    if (x.visible === false) return;
    for (const [kind, style] of [['fills', 'fillStyleId'], ['strokes', 'strokeStyleId']]) {
      const paints = Array.isArray(x[kind]) ? x[kind] : [];
      const bound = (x.boundVariables && x.boundVariables[kind]) || [];
      if (x[style]) continue;
      paints.forEach((p, i) => { if (p && p.type === 'SOLID' && p.visible !== false && !(p.boundVariables && p.boundVariables.color) && !bound[i]) n++; });
    }
    for (const c of x.children || []) visit(c);
  };
  visit(node);
  return n;
};
/* The variable an icon's glyph is painted with: the first visible solid fill or
   stroke bound to one, what an instance of it is drawn in until it is given a
   colour. The SVG it exports as carries the colour and not its token. */
const glyphFill = async (node) => {
  const visit = async (x) => {
    if (x.visible === false) return null;
    for (const kind of ['fills', 'strokes']) {
      const paints = Array.isArray(x[kind]) ? x[kind] : [];
      for (const p of paints) {
        if (!p || p.type !== 'SOLID' || p.visible === false || !(p.boundVariables && p.boundVariables.color)) continue;
        const v = await variable(p.boundVariables.color.id);
        if (v) return v.name;
      }
    }
    for (const c of x.children || []) { const r = await visit(c); if (r) return r; }
    return null;
  };
  return visit(node);
};
/** @param {PageNode | SectionNode | FrameNode} scope */
const componentSets = (scope) => /** @type {(ComponentSetNode | ComponentNode)[]} */ (scope.findAll((n) =>
  n.type === 'COMPONENT_SET' || (n.type === 'COMPONENT' && n.parent !== null && n.parent.type !== 'COMPONENT_SET')));

/** @param {boolean} withIcons */
async function collectLibrary(withIcons) {
  walkWhole = false;
  await loadPages();
  const tokens = await collectTokens();

  // Filled after the closures below exist: the loop is `collectComponents`.
  /** @type {{ name: string, w: number, h: number, png: string, dark?: string }[]} */
  const previews = [];
  // A library with a dark mode gets each preview in it too, so the docs can
  // follow the reader's theme. Dark is the mode whose name says so, the same
  // test the docs use for a mode's ground; a library drawn dark by default
  // already exports dark. The collections are the ones the variables read so
  // far belong to (this file's tokens, and every variable a component walk
  // met), not this file's local ones: a components file whose colours come
  // from a separate foundations library has no local collection at all.
  /** @type {Record<string, VariableCollection | null>} */ const collections = {};
  /*
   * Every collection a bound value depends on, alias chain included.
   *
   * A semantic colour usually aliases a primitive, and the primitive's
   * collection has its own Light and Dark. Switching only the collection the
   * layer binds leaves the alias to resolve in the primitive's default mode:
   * the button's background changed and the icon inside it stayed light-mode
   * dark, on a dark button, in every dark render of one library.
   */
  const dependsOn = async () => {
    const ids = new Set();
    const seen = new Set();
    const follow = async (v) => {
      if (!v || seen.has(v.id)) return;
      seen.add(v.id);
      ids.add(v.variableCollectionId);
      for (const value of Object.values(v.valuesByMode || {})) {
        if (value && value.type === 'VARIABLE_ALIAS') await follow(await variable(value.id));
      }
    };
    for (const v of Object.values(varCache)) await follow(v);
    return ids;
  };
  const darkModes = async () => {
    const out = [];
    for (const id of await dependsOn()) {
      if (!(id in collections)) collections[id] = await figma.variables.getVariableCollectionByIdAsync(id);
      const c = collections[id];
      const m = c && c.modes.find((x) => /dark/i.test(x.name));
      if (c && m && m.modeId !== c.defaultModeId) out.push({ c, m });
    }
    return out;
  };
  const components = await collectComponents({ withIcons, previews, darkModes });

  const iconPage = figma.root.children.find(isIconPage);
  const iconSets = iconPage ? componentSets(iconPage) : [];
  const graphicPage = figma.root.children.find(isGraphicPage);
  const graphicSets = graphicPage ? componentSets(graphicPage) : [];
  const icons = [];
  if (withIcons) {
    for (const [i, s] of iconSets.entries()) {
      say('reading icons', i, iconSets.length);
      for (const k of s.type === 'COMPONENT_SET' ? s.children : [s]) {
        const m = /Size=(\d+)/.exec(k.name);
        const svg = await k.exportAsync({ format: 'SVG_STRING' });
        const fill = await glyphFill(k);
        icons.push({ name: s.name, size: m ? +m[1] : Math.round(k.width), svg, unbound: unboundPaints(k), ...(fill ? { fill } : {}) });
      }
    }
  }
  /*
   * The graphics, at twice the size they are drawn.
   *
   * They came through as bare 320x320 nodes with an IMAGE fill and no asset
   * until 2026-09-08, which left an Empty state with a hole where its
   * illustration goes and nothing in the repo able to draw it. Exported at 2x
   * because the design places them at 120 and 40, and a raster placed at 1x is
   * soft on every screen anyone actually owns.
   */
  const graphics = [];
  if (withIcons) {
    for (const [i, g] of graphicSets.entries()) {
      say('reading graphics', i, graphicSets.length);
      const node = g.type === 'COMPONENT_SET' ? g.children[0] : g;
      const bytes = await node.exportAsync({ format: 'PNG', constraint: { type: 'SCALE', value: 2 } });
      graphics.push({ name: componentName(g), w: Math.round(node.width), h: Math.round(node.height), png: figma.base64Encode(bytes) });
    }
  }

  // What a layer held that no key could carry — the evidence the spec-key gate
  // needs that the file is holding something back. The screens route has sent
  // it since it was written; the library route collected the same list while
  // walking variants and dropped it, so the store recorded `unrecorded: null`
  // for every library and the gate had nothing to read. Filled here rather
  // than in collectTokens, which runs before the walk that populates it.
  tokens._meta.unrecorded = [...new Set(unrecordedSeen)].slice(0, 40);
  // The page the icons came from, by name. An icon page's components are
  // exported as SVGs and get no component spec — deliberately, since a spec
  // per glyph would swamp the store and give the docs a page per icon — but
  // that made every icon invisible to any check that reads names. A library
  // audited from its snapshot saw 40 of its 69 components; the 29 on the icon
  // page were not missing, they were unaddressable, because nothing said
  // which page they were on and a reader may not assume a page's name
  // (toolkit-standard §D 7). The names are already stored; this is the one
  // field that makes them usable.
  // Each icon's group: the frame or section it sits in on the icon page, as
  // the file sorts them (Accessibility, Arrows…), so the docs can head each.
  // The nearest one wins; a set straight on the page has none.
  const groupOf = (n) => { for (let p = n.parent; p && p.type !== 'PAGE'; p = p.parent) if ((p.type === 'FRAME' || p.type === 'SECTION') && p.name.trim()) return p.name.trim(); return null; };
  const iconGroups = Object.fromEntries(iconSets.map((s) => [s.name, groupOf(s)]).filter(([, g]) => g));
  // Each icon's description, where it has one: an icon library keeps its
  // search keywords there (Lucide's tags), which the docs show and search.
  const iconDescriptions = Object.fromEntries(iconSets.map((s) => [s.name, unescaped(s.description || '').trim()]).filter(([, d]) => d));
  return { tokens, components, icons, iconSets: iconSets.map((s) => s.name), iconPage: iconPage ? iconPage.name : null, ...(Object.keys(iconGroups).length && { iconGroups }), ...(Object.keys(iconDescriptions).length && { iconDescriptions }), graphics, previews };
}

async function collectScreens() {
  walkWhole = true;
  await loadPages();
  const screens = [];
  // The section a page sits in: the nearest header page above it. A page
  // named with a leading dash is a member ("-- Main screens"), or a divider
  // when it is nothing but dashes, which ends the section; any other page is
  // a header and starts one. Two sections may each hold a "-- Main screens",
  // so a screen is addressed by section, page and name: snapshot-standard rule 24.
  let section = null, read = 0;
  const ready = figma.root.children.reduce((n, page) => n + page.children.filter((f) => (f.type === 'FRAME' || f.type === 'SECTION') && f.devStatus).length, 0);
  for (const page of figma.root.children) {
    if (/^[-\s]+$/.test(page.name)) { section = null; continue; }
    if (!page.name.trim().startsWith('-')) section = page.name.trim();
    for (const f of page.children) {
      if (f.type !== 'FRAME' && f.type !== 'SECTION') continue;
      // Ready for dev (or Completed) is the designer's own "this one counts",
      // and the API allows it only on a node directly under a page or section
      // — which is exactly this loop. An unmarked frame is a draft: its name
      // travels so the receiver can say what it passed over, its tree does
      // not. A name prefix was the alternative and would have been silent
      // when forgotten; this control is visible in the file.
      const devStatus = (f.devStatus && f.devStatus.type) || null;
      if (!devStatus) { screens.push({ section, page: page.name, frame: f.name, id: f.id, devStatus: null }); continue; }
      say('reading frames', read++, ready);
      // The frame as a picture, beside the frame as numbers. Every property
      // can match while the composition does not: an upside-down image, a
      // border drawn twice, a title that wraps — each measures identical and
      // each shipped. A person spotting them by holding the page next to the
      // frame is the thing this loop exists to replace, so the frame travels
      // with the snapshot and the check does the holding.
      // Scaled so the longest side is 1200: this is compared as regions, not
      // as pixels — two rasterisers never agree pixel for pixel — and a full
      // 9794-tall export would cost more than it tells.
      let image = null;
      try {
        const scale = Math.min(1, 1200 / Math.max(f.width, f.height));
        const bytes = await f.exportAsync({ format: 'PNG', constraint: { type: 'SCALE', value: scale } });
        image = { scale, data: figma.base64Encode(bytes) };
      } catch (e) { /* a frame that will not export still sends its tree */ }
      const tree = await walk(f, 0);
      screens.push({ section, page: page.name, frame: f.name, id: f.id, devStatus, image, tree });
    }
  }
  return { _meta: { file: figma.root.name, fileKey: figma.fileKey, fileId: fileId(), snapshot: new Date().toISOString().slice(0, 10), plugin: VERSION, unrecorded: [...new Set(unrecordedSeen)].slice(0, 40) }, screens };
}

// What a node can say that the snapshot does not send.
//
// The other half of the completeness question: the consuming repo can prove
// every recorded property is compared, and nothing could prove Figma was not
// holding something back. Four defects in one day were exactly that — an
// alignment, a truncation, an image fill's rotation and a rotated layer's
// visible box, each found only after a person saw the page was wrong.
//
// So every renderable property is listed here, and a node carrying one this
// walk does not record is reported with the run. The list is what a browser
// can draw; a property Figma has and CSS cannot express does not belong on
// it, and neither does one whose default means "nothing to draw".
const RENDERABLE = [
  'rotation', 'opacity', 'blendMode', 'clipsContent', 'dashPattern',
  'textAlignHorizontal', 'textAlignVertical', 'textCase', 'textDecoration',
  'textTruncation', 'maxLines', 'letterSpacing', 'lineHeight', 'paragraphSpacing', 'listSpacing',
  'strokeAlign', 'strokeWeight', 'cornerRadius', 'itemSpacing', 'counterAxisSpacing',
  'minWidth', 'maxWidth', 'minHeight', 'maxHeight', 'layoutWrap', 'strokeCap',
];
/** @type {Record<string, unknown>} */
const DEFAULTS = { rotation: 0, opacity: 1, blendMode: 'PASS_THROUGH', clipsContent: false,
  textAlignHorizontal: 'LEFT', textAlignVertical: 'TOP', textCase: 'ORIGINAL',
  textDecoration: 'NONE', textTruncation: 'DISABLED', maxLines: 0, paragraphSpacing: 0, listSpacing: 0,
  strokeAlign: 'INSIDE', cornerRadius: 0, itemSpacing: 0, counterAxisSpacing: null,
  layoutWrap: 'NO_WRAP', strokeCap: 'NONE' };
/** @param {SceneNode} n @param {Record<string, unknown>} o */
function unrecorded(n, o) {
  const missing = [];
  // a stroke property with no visible stroke behind it draws nothing: the
  // first real run flagged 40 properties and every one was this class — an
  // empty dashPattern (the universal default), a strokeAlign on unstroked
  // text, a letter spacing of zero percent
  const stroked = 'strokes' in n && Array.isArray(n.strokes) && n.strokes.some((s) => s.visible !== false);
  for (const k of RENDERABLE) {
    let v; try { v = /** @type {Record<string, unknown>} */ (/** @type {unknown} */ (n))[k]; } catch { continue; }
    if (v === undefined || v === null || typeof v === 'symbol') continue;
    if (k in DEFAULTS && v === DEFAULTS[k]) continue;
    if (typeof v === 'object' && 'unit' in v && v.unit === 'AUTO') continue;
    if (typeof v === 'number' && v === 0) continue;
    if (Array.isArray(v) && v.length === 0) continue;
    if (typeof v === 'object' && 'value' in v && !v.value) continue;
    if ((k === 'strokeWeight' || k === 'strokeAlign' || k === 'dashPattern') && !stroked) continue;
    // recorded under its own name, or under the one this snapshot gives it
    const as = { textAlignHorizontal: 'textAlign', textTruncation: 'truncate', cornerRadius: 'radius',
      itemSpacing: 'gap', dashPattern: 'dashed', clipsContent: 'clips', strokeWeight: 'strokeSides',
      counterAxisSpacing: 'crossGap', layoutWrap: 'wrap', paragraphSpacing: 'paragraphSpacing' }[k] || k;
    if (!(as in o) && !(k in o)) missing.push(`${n.name}.${k}`);
  }
  return missing;
}

// A library has variable collections and component sets; a screens file has
// neither. Decided on open so the button needs no choice.
/*
 * Library or screens. A file with variables is a library. So is one with
 * component sets and no frame marked Ready for dev: a design system can keep
 * its components in a file of their own and its variables in another, and
 * reading "no variables" as "screens" sent one project's whole component
 * library down the screens route, where it was refused as an unknown screens
 * file. A screens file marks its frames; a components file does not.
 */
async function detect() {
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  if (collections.length > 0) return 'library';
  await loadPages();
  const marked = figma.root.children.some((page) => page.children.some((f) => f.devStatus && f.devStatus.type));
  const sets = figma.root.findAllWithCriteria({ types: ['COMPONENT_SET'] }).length;
  return sets > 0 && !marked ? 'library' : 'screens';
}

/*
 * Is the router listening, asked BEFORE the button is live.
 *
 * Collecting a library is half a minute of reading the designer's file, and
 * until now the only way to learn nothing was listening was to spend it and be
 * told at the end. The UI greys the button out and shows the command instead.
 * Any answer is a router listening: one that answers 500 is up and broken, and
 * its own error is what the person needs, never "Nothing is listening" and a
 * snapshot quietly saved as a file (0.67.1).
 */
async function reachable() {
  try {
    const res = await fetch(SERVER, { method: 'GET' });
    return res.status > 0;
  } catch (e) {
    return false;
  }
}

/*
 * The kind the router's routing records for this file, which is the answer;
 * detect() is the guess for a file no project claims yet, where the router
 * will refuse it whichever kind it is sent as.
 */
async function kind() {
  try {
    const q = [figma.fileKey, fileId()].filter(Boolean).map((id) => `file=${encodeURIComponent(String(id))}`).join('&');
    const res = await fetch(`${SERVER}/?${q}`, { method: 'GET' });
    const known = (await res.json()).kind;
    if (known === 'library' || known === 'screens') return known;
  } catch (e) { /* not listening: the guess stands, and the button says so */ }
  return detect();
}


/**
 * Which layers each component property drives, over every layer of every
 * variant, hidden ones included: `{ "Label text": { kind: "characters",
 * layers: [["Content", "Label"]] } }`. A layer is its list of names below its
 * variant, a repeated name numbered among its visible siblings from the second
 * (`Label[2]`), as the contract numbers them; a list, so a name with a slash
 * stays one name. A nested instance is recorded but not entered: the
 * references inside it name the inner component's properties. A property
 * that drives its layers in some variants only names them (`variants`): a
 * set may give each size its own icon swap, both on the one Icon layer.
 * @param {any[]} roots
 */
function propLinks(roots) {
  /** @type {Record<string, { kind: string, layers: string[][], variants?: string[] }>} */ const links = {};
  /** @type {Record<string, Set<string>>} */ const where = {};
  let root = '';
  /** @param {any} node @param {string[]} at */
  const walk = (node, at) => {
    /** @type {Record<string, number>} */ const seen = {};
    for (const c of node.children || []) {
      const n = c.visible === false ? (seen[c.name] || 0) + 1 : (seen[c.name] = (seen[c.name] || 0) + 1);
      const here = [...at, c.name + (n > 1 ? `[${n}]` : '')];
      const refs = c.componentPropertyReferences;
      if (refs) for (const kind of ['characters', 'visible', 'mainComponent']) {
        if (!refs[kind]) continue;
        const prop = refs[kind].split('#')[0];
        const l = links[prop] || (links[prop] = { kind, layers: [] });
        if (!l.layers.some((x) => x.join('/') === here.join('/') && x.length === here.length)) l.layers.push(here);
        (where[prop] || (where[prop] = new Set())).add(root);
      }
      if (c.type !== 'INSTANCE') walk(c, here);
    }
  };
  for (const v of roots) { root = v.name; walk(v, []); }
  for (const [prop, l] of Object.entries(links)) if (where[prop].size < roots.length) l.variants = roots.map((v) => v.name).filter((n) => where[prop].has(n));
  return links;
}

/*
 * Every component set on every component page, as the store records it:
 * props, slots, the variants walked, each boolean flipped once per variant
 * on a scratch page, the description, and — for a snapshot — the previews.
 * One function because two callers walk it: `collectLibrary` for a snapshot
 * and the headless tail below for a live audit, and a second copy of this
 * loop is how a live reader ends up describing a component in a different
 * shape from its stored spec.
 */
async function collectComponents({ withIcons, previews, darkModes, scope = null, pages = null, section = null, exclude = null }) {
  const components = [];
  // A file with an icon page is an asset library (illustrations, photos,
  // graphics): each variant of its sets is an asset of its own, so each gets
  // a preview, not only the default.
  const assetLibrary = figma.root.children.some(isIconPage);
  // A page's section is the last header before it, the same walk the audit
  // scanners make; a page under an excluded section is not a component page.
  let current = null;
  const wanted = [];
  for (const p of figma.root.children) {
    if (section && section.test(p.name)) current = p.name;
    if (isIconPage(p)) continue;
    if (exclude && current && exclude.has(current)) continue;
    if (pages && !pages.test(p.name)) continue;
    wanted.push(p);
  }
  const sets = wanted.map((page) => componentSets(page).filter((x) => !scope || scope.has(x.id)));
  const count = sets.reduce((n, l) => n + l.length, 0);
  let read = 0;
  // each list is its page's: the page a component is filed under (0.65.0 dropped it, and every library snapshot
  // stopped on `page is not defined`)
  for (const [i, list] of sets.entries()) {
    const page = wanted[i];
    for (const s of list) {
      say('reading components', read++, count);
      /** @type {Record<string, unknown>} */ const props = {};
      const defs = s.componentPropertyDefinitions;
      for (const k of Object.keys(defs)) props[k.split('#')[0]] = defs[k].type === 'VARIANT' ? defs[k].variantOptions : defs[k].type;
      /*
       * A SLOT's settings, which live on the PROPERTY and not on the node.
       *
       * A slot is a component property of the set — `props` records it as
       * `"Items slot": "SLOT"` — and everything that says what may go in it
       * and how much of it is on that definition: the description, the
       * preferred instances, and the minimum and maximum number of layers.
       * The first attempt read them off the SLOT node, where only the two
       * limits happen to be mirrored, so `component-validator`'s W12 could
       * ask about the range and never about the contents.
       *
       * Kept beside `props` rather than inside it, because `props[name]` is a
       * type or a list of variant options to every reader there is, and
       * turning one entry into an object would break all of them.
       *
       * Every field is read only where the runtime has it, so an API without
       * one records nothing rather than a confident empty list — the
       * difference between "no preferred instances were set" and "this
       * snapshot cannot see them" is the whole value of the record.
       */
      /** @type {Record<string, unknown>} */ const slots = {};
      for (const k of Object.keys(defs)) {
        const d = /** @type {any} */ (defs[k]);
        if (d.type !== 'SLOT') continue;
        /** @type {Record<string, unknown>} */ const out = {};
        if ('description' in d) out.description = d.description || '';
        /*
         * The limits live inside `slotSettings`, not on the definition.
         *
         * The first two attempts guessed: `minimumLayers`/`maximumLayers` on
         * the NODE (where they are mirrored, so it half-worked), then the
         * same names on the definition (where they do not exist). What
         * settled it was recording `fields` — the keys the runtime actually
         * exposed — and reading them back from a real snapshot: `type`,
         * `description`, `preferredValues`, `slotSettings`.
         *
         * So the object is stored WHOLE rather than picked apart by another
         * guess, and the named fields are lifted out of it where they are
         * there. One more snapshot then shows its shape without a third
         * round of naming things from memory.
         */
        const st = d.slotSettings;
        if (st && typeof st === 'object') {
          /** @type {Record<string, unknown>} */ const copy = {};
          for (const k of Object.keys(st)) { const v = st[k]; if (v === null || typeof v !== 'object') copy[k] = v; }
          out.settings = copy;
          // No lifting. `settings` carries the runtime's own keys —
          // `minChildren`, `maxChildren`, `displayEmptyByDefault`,
          // `allowPreferredValuesOnly`, `stretchChildOnInsert` — and a reader
          // takes them from there. An earlier version lifted them under
          // `minimumLayers`/`maximumLayers`, names the runtime does not use,
          // so every lifted field was `undefined` in every snapshot ever
          // taken. Storing the object whole is what made the real names
          // visible; picking at it again by guess is what this replaced.
        }
        const pref = d.preferredValues || d.preferredInstances;
        if (Array.isArray(pref)) out.preferred = pref.map((x) => (x && (x.name || x.key)) || String(x)).filter(Boolean);
        // Everything the runtime DID expose, so a reader can tell a field
        // that is absent from a field this plugin never asked for.
        out.fields = Object.keys(d);
        slots[k.split('#')[0]] = out;
      }
      /*
       * Which layers each property drives: a text property its words, a
       * boolean what it shows, an instance swap the instance it replaces.
       *
       * The walked trees say what a variant looks like but not why: a
       * component contract (tools/component-contract) read `Label text: TEXT` and a
       * text layer reading "Label", with nothing joining them. Figma keeps
       * the join on the layer, in `componentPropertyReferences`; it is read
       * here over every layer of every variant, hidden ones included (a
       * boolean that is off hides exactly the layer it drives), and kept
       * beside `props` for the same reason `slots` is. A layer is its path
       * of names below the variant, the address the trees use.
       */
      const links = propLinks(s.type === 'COMPONENT_SET' ? s.children : [s]);
      const variants = [];
      for (const v of s.type === 'COMPONENT_SET' ? s.children : [s]) variants.push(await walk(v, 0));
      // A boolean property is a variant the grid does not show: it hides or
      // shows layers inside every variant. Each one is flipped from its
      // default on each variant — one at a time, never the power set — and
      // walked as its own tree named `<variant>, <Prop>=<value>`, so a story
      // can measure it like any other. The instance is detached (an instance
      // is only a name to walk()) and removed; Figma's last-modified moves,
      // which the receiver notes and never fails on.
      const booleans = Object.keys(defs).filter((k) => defs[k].type === 'BOOLEAN');
      for (const k of booleans) {
        const flipped = !defs[k].defaultValue;
        for (const v of s.type === 'COMPONENT_SET' ? s.children : [s]) {
          const inst = /** @type {ComponentNode} */ (v).createInstance();
          // where it could not move to the temporary page it sits on a real one, so it goes whatever is thrown
          /** @type {SceneNode} */ let made = inst;
          try {
            place(scratch(), inst);
            // an instance of a fill-width variant takes its new parent's width;
            // the tree must measure the component as drawn
            inst.resize(v.width, v.height);
            inst.setProperties({ [k]: flipped });
            // noted before detaching: a detached instance has no slots (below)
            const slots = slotPaths(inst);
            const frame = made = inst.detachInstance();
            const tree = markSlots(await walk(frame, 0), slots);
            tree.name = `${v.name}, ${k.split('#')[0]}=${flipped ? 'True' : 'False'}`;
            variants.push(tree);
          } finally { if (!made.removed) made.remove(); }
        }
      }
      // The designer's guidance, as written: purpose, Usage, Don't. Always
      // sent, empty included, so a description deleted in Figma is a change a
      // diff can see. Markdown, because the structured form uses headings.
      const description = unescaped(s.descriptionMarkdown || s.description || '');
      // The default variant as drawn, for documentation before any code
      // exists: the only preview a design-only project can have. Sent beside
      // the components, like graphics, not inside them: a receiver copies a
      // component's keys into a committed spec, and a base64 image there is a
      // megabyte of diff on every snapshot.
      if (withIcons) {
        const shown = s.type === 'COMPONENT_SET' ? (s.defaultVariant || s.children[0]) : s;
        try {
          const bytes = await shown.exportAsync({ format: 'PNG', constraint: { type: 'SCALE', value: 2 } });
          /** @type {{ name: string, w: number, h: number, png: string, dark?: string, anatomy?: any, variants?: {name: string, png: string, dark?: string}[] }} */
          const preview = { name: componentName(s), w: Math.round(shown.width), h: Math.round(shown.height), png: figma.base64Encode(bytes) };
          previews.push(preview);
          {
            // Dark, where the file has a dark mode. An instance inside a frame set to dark: modes are inherited, so
            // the component itself is never touched. Resized as drawn, as the
            // boolean walk above does, or a fill-width variant takes the
            // frame's width. The frame must not clip: a new frame is 100 by
            // 100 and clips, which cut every render at 100px and every
            // shadow at its top and left edge.
            const darkOf = async (/** @type {ComponentNode} */ node) => {
              const frame = figma.createFrame();
              scratch().appendChild(frame);
              frame.clipsContent = false;
              /** @type {InstanceNode | null} */ let made = null;
              try {
                const inst = made = node.createInstance();
                // the mode goes on the frame that holds it, or on the instance itself where it cannot be held
                const held = place(frame, inst);
                inst.resize(node.width, node.height);
                // Every collection the render binds, nested instances included:
                // the walk stops at an instance, so an icon's colour, bound
                // inside the icon, came from a collection it never met and
                // stayed light-mode dark on a dark button.
                for (const n of [inst, ...inst.findAll(() => true)]) {
                  for (const b of Object.values(/** @type {any} */ (n).boundVariables || {})) for (const a of [].concat(b)) if (a && a.id) await variable(a.id);
                }
                const dark = await darkModes();
                if (!dark.length) return null;
                for (const { c, m } of dark) (held ? frame : inst).setExplicitVariableModeForCollection(c, m.modeId);
                return figma.base64Encode(await inst.exportAsync({ format: 'PNG', constraint: { type: 'SCALE', value: 2 } }));
              } catch (e) { return null; /* the light preview still ships */ } finally { frame.remove(); if (made && !made.removed) made.remove(); }
            };
            const d = await darkOf(/** @type {ComponentNode} */ (shown));
            if (d) preview.dark = d;
            // An asset library's variants, each an asset of its own, in both
            // modes: a logo bound to the theme vanished on the docs' dark
            // ground when only its light render was sent.
            if (assetLibrary && s.type === 'COMPONENT_SET' && s.children.length > 1) {
              preview.variants = [];
              for (const v of s.children) {
                try {
                  const vd = d ? await darkOf(/** @type {ComponentNode} */ (v)) : null;
                  preview.variants.push({ name: v.name, png: figma.base64Encode(await v.exportAsync({ format: 'PNG', constraint: { type: 'SCALE', value: 2 } })), ...(vd && { dark: vd }) });
                } catch (e) { /* the rest still ship */ }
              }
            }
          }
          try { const a = await anatomyOf(s, shown); if (a) preview.anatomy = a; } catch (e) { /* the preview still ships */ }
        } catch (e) { /* a component that will not export still sends its spec */ }
      }
      // a page that is not the component's own is a namespace: the Graphic
      // page's Switch is not the control.
      //
      // `figmaName` is what the file itself calls it, sent only where the
      // namespace changed the name. Without it the two cases are one string:
      // a component the plugin prefixed (`cursor` on the Graphic page) and one
      // actually named `Graphic/cursor` in Figma both arrive as
      // `Graphic/cursor`, and a name check reading the store cannot tell them
      // apart. It reported six bare-slash findings against a library that has
      // none, which a live run of the same file disproved.
      const display = componentName(s);
      const own = s.name.trim();
      // The component's own published key, so an instance recorded against it
      // can be resolved to THIS spec without matching a display name. The id
      // is already here and is the within-file fallback for a local-only
      // component, which has no key.
      // `slots` only where the set has one, so its absence on a component
      // without slots is not mistaken for a snapshot that cannot see them.
      const base = { name: display, id: s.id, page: page.name, description, props, variants };
      if (Object.keys(slots).length) base.slots = slots;
      if (Object.keys(links).length) base.links = links;
      // which variant Figma treats as the default, so a contract's defaults are Figma's
      if (s.type === 'COMPONENT_SET' && s.defaultVariant) base.defaultVariant = s.defaultVariant.name;
      if (s.key) base.key = s.key;
      components.push(own === display ? base : Object.assign({ name: display, figmaName: own }, base));
    }
  }
  return components;
}

/** A post that reached nothing: the window offers the download instead. */
class Unreachable extends Error {}
/** @param {unknown} e */
const message = (e) => String((e && typeof e === 'object' && /** @type {{message?: unknown}} */ (e).message) || e);

if (!HEADLESS) {
  Promise.all([kind(), reachable()]).then(([mode, up]) =>
    figma.ui.postMessage({ type: 'ready', mode, up, server: SERVER, file: figma.root.name, version: VERSION }));


  figma.ui.onmessage = async (/** @type {{type: string, icons?: boolean, height?: number}} */ msg) => {
    try {
      if (msg.type === 'snapshot') {
        figma.skipInvisibleInstanceChildren = true;
        const mode = await kind();
        /** @type {any} */ let payload;
        try {
          payload = mode === 'library' ? await collectLibrary(msg.icons !== false) : await collectScreens();
        } catch (e) {
          // Figma's own message alone ("Cannot read properties of null") names no
          // cause a designer can act on; where it stopped does.
          throw new Error(`the snapshot stopped while reading the file, so nothing was sent (${message(e)}). Snapshot again; if it stops at the same place, reload the plugin (Plugins › Development › Reload).`);
        } finally { if (scratchPage) { scratchPage.remove(); scratchPage = null; } }
        const report = 'components' in payload
          ? `${payload.components.length} components, ${payload.iconSets.length} icon sets${msg.icons !== false ? ' exported' : ' named'}, ${(payload.graphics || []).length} graphics`
          : `${payload.screens.filter((s) => s.tree).length} of ${payload.screens.length} frames ready for dev`;
        // Nothing listening: the snapshot is handed to the UI as a file to
        // save, so the plugin works for someone with no router and no repo.
        if (!(await reachable())) {
          say('saving the snapshot as a file');
          figma.ui.postMessage({ type: 'file', mode, report, name: `${figma.root.name} ${mode} snapshot.json`, text: JSON.stringify({ kind: mode, ...payload }) });
          return;
        }
        say('sending the snapshot');
        const res = await fetch(`${SERVER}/${mode}`, { method: 'POST', body: JSON.stringify(payload) })
          .catch(() => { throw new Unreachable(`the router stopped answering, so nothing was written.`); });
        /* Not `res.ok` alone: the router replies once the receiver has finished,
           so the status IS the outcome and the body says what happened. This
           reported "done" over refused and crashed writes for as long as the
           reply came back the moment the payload landed. */
        const answer = await res.text();
        if (!res.ok) throw new Error(answer || `the router answered ${res.status} and said nothing more, so the snapshot may not be written. Its output has the cause.`);
        // The router's own answer names who wrote it ("<project>: written"): a
        // repo's receiver or, for a design-only project, the toolkit's store.
        figma.ui.postMessage({ type: 'done', mode, report, answer });
      }
      if (msg.type === 'resize') figma.ui.resize(320, Math.min(420, Math.max(96, msg.height ?? 96)));
      if (msg.type === 'close') figma.closePlugin();
    } catch (e) {
      // the window says it beside the button; a toast as well said it twice
      figma.ui.postMessage({ type: 'failed', text: message(e), unreachable: e instanceof Unreachable });
    }
  };
}

// No `return` at the top level: Figma evaluates this file as a SCRIPT, and a
// top-level return is a SyntaxError there — the plugin was dead from the
// commit that added the headless branch until the console said "Illegal
// return statement". The bridge evaluates it as a function BODY and needs the
// value, so the service appends `return __headless();` when it serves this
// file for headless use (figma-audit/server.mjs).
async function __headless() {
  figma.skipInvisibleInstanceChildren = true;
  walkWhole = false;
  await loadPages();
  const scope = typeof SCOPE !== 'undefined' && Array.isArray(SCOPE) && SCOPE.length ? new Set(SCOPE) : null;
  const pages = typeof PAGES === 'string' && PAGES ? new RegExp(PAGES) : null;
  const section = typeof SECTION === 'string' && SECTION ? new RegExp(SECTION) : null;
  const exclude = typeof EXCLUDE !== 'undefined' && Array.isArray(EXCLUDE) && EXCLUDE.length ? new Set(EXCLUDE) : null;
  try {
    if (typeof FULL !== 'undefined' && FULL) return Object.assign(await collectLibrary(true), { fileKey: figma.fileKey || null, fileName: figma.root.name });
    const components = await collectComponents({ withIcons: false, previews: [], darkModes: async () => [], scope, pages, section, exclude });
    return { components, fileKey: figma.fileKey || null, fileName: figma.root.name, at: new Date().toISOString() };
  } finally { if (scratchPage) { scratchPage.remove(); scratchPage = null; } }
}
