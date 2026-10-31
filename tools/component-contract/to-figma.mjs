#!/usr/bin/env node
/*
 * tools/component-contract/to-figma.mjs — a component contract drawn as a Figma
 * component set, in the house's conventions. The last step of
 * code → contract (from-code.mjs) → conventions (asFigma) → Figma.
 *
 *   node tools/component-contract/to-figma.mjs <contract> <keys.json>  > plugin.js
 *   node tools/component-contract/to-figma.mjs <contract> --run --project <label> --into <scratch fileKey>
 *   node tools/component-contract/to-figma.mjs <contract> --verify --project <label> --into <scratch fileKey>
 *
 * prints plugin code for the Desktop Bridge, or runs it through the project's
 * docs service (figma-audit services.mjs): the set drawn on a page of the
 * component's own name in the scratch file, one drawing at a time. Keys come
 * from the snapshot (text styles, the components it places); what it lacks
 * is looked up by name in the library file (LOOKUP); `keys.json` names them
 * when the code is only printed. `--verify` reads the drawing back and holds
 * it to the contract.
 *
 *   plan(contract) → { name, axes, booleans, text, variants }
 *
 * A Figma boolean can only show or hide a layer, so a prop whose layer
 * changes anything else (a padding, a colour) is a variant axis, True/False;
 * one that only adds or removes layers (and the order they leave) is a
 * boolean bound to their visibility. Every enum is an axis. Each variant is
 * expand() at its axis values with every boolean on, so every layer exists
 * to be shown or hidden. A graphic is an instance of the library's Icon
 * container at its size, its swap set to the icon the code names (rule:
 * the house's icons are Icon container instances); its exposed props are
 * the component's (Figma's nested instance properties).
 *
 * What is drawn and what still differs from the library it came from is the
 * README's account (held to it on 2026-10-20 over one library's 63 components).
 */
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { partName, figmaWord, camel, sentence } from './layers.mjs';
import { parseColour } from '../parity/values.mjs';
import { variantValues } from '../shared/names.js';

import { realpathSync } from 'node:fs';
const req = createRequire(import.meta.url);
const { nameOf } = req('../snapshot/graph.cjs');
const { expand } = req('./derive.cjs');

// a slot's layer is named as its prop is in Figma: Figma names the slot property after it
const slotName = (e, props) => { const ref = e.kind === 'slot' && typeof e.content === 'string' && /^\{(.+)\}$/.exec(e.content); return ref ? (props[ref[1]] || {}).figma ?? null : null; };

export function plan(contract, { axisOrder = [] } = {}) {
  const props = contract.props;
  const AXES = axisOrder.map(camel);
  // a boolean is an axis where the contract says so, or where a layer of its own styles beyond adding, removing and
  // ordering, which a boolean property cannot; one that only shares a layer with an axis stays a property
  const styles = (k) => props[k].axis === true || contract.variants.some((v) => !v.combination && Object.keys(v.when).join() === k && Object.keys(v.set || {}).some((f) => !/\.order$/.test(f)));
  const booleans = Object.entries(props).filter(([k, p]) => p.type === 'boolean' && !styles(k)).map(([k, p]) => ({ key: k, figma: p.figma, default: p.default, shows: p.shows || [] }));
  const axes = Object.entries(props).filter(([k, p]) => p.type === 'enum' || (p.type === 'boolean' && styles(k)))
    .map(([k, p]) => ({ key: k, figma: p.figma, values: p.type === 'enum' ? [p.default, ...p.values.filter((v) => v !== p.default)] : [p.default, !p.default], boolean: p.type === 'boolean' }))
    // figma-standard rule 1: props and booleans first, then the axes in the house's order (audit-settings axisOrder)
    .sort((a, b) => (AXES.includes(a.key) ? AXES.indexOf(a.key) : a.boolean ? -1 : AXES.length) - (AXES.includes(b.key) ? AXES.indexOf(b.key) : b.boolean ? -1 : AXES.length));
  const text = Object.entries(props).filter(([, p]) => p.type === 'string').map(([k, p]) => ({ key: k, figma: p.figma, default: p.default }));
  const swap = Object.values(props).find((p) => p.type === 'swap');
  // an instance swap property and the instances it may swap: the one a part names where several swap it, else each
  // that lists it (the drawing links it to the one whose default is its component)
  const swaps = Object.entries(props).filter(([, p]) => p.type === 'instance' && p.figma).map(([k, p]) => ({ key: k, figma: p.figma, parts: p.swaps || [] }));
  // a value as the library writes it: its own spelling where the contract keeps one, else the house's
  const show = (a, v) => { const q = props[a.key]; return q.figmaValues && q.values ? q.figmaValues[q.values.indexOf(v)] ?? figmaWord(v) : figmaWord(v); };
  // every combination of the axes, less those the contract says are not drawn (its invalid list, a canvas fact)
  const notDrawn = Array.isArray(contract.invalid) ? contract.invalid : [];
  const grid = axes.reduce((acc, a) => acc.flatMap((w) => a.values.map((v) => ({ ...w, [a.key]: v }))), [{}])
    .filter((w) => !notDrawn.some((x) => Object.entries(x).every(([k, v]) => w[k] === v)));
  // where each is placed in the set's grid: a row per combination of the axes but the last, a column per value of
  // the last, so a combination not drawn leaves its cell empty rather than shifting the rest of its row
  const last = axes[axes.length - 1];
  const rowKeys = [...new Set(grid.map((w) => JSON.stringify(axes.slice(0, -1).map((a) => w[a.key]))))];
  const cellOf = (w) => (last ? [rowKeys.indexOf(JSON.stringify(axes.slice(0, -1).map((a) => w[a.key]))), last.values.indexOf(w[last.key])] : [0, 0]);
  const variants = grid.map((w) => {
    const on = Object.fromEntries(booleans.map((b) => [b.key, true]));
    const anatomy = expand(contract, { ...w, ...on });
    // each element a boolean shows: there with it on, gone with it off
    // a layer one boolean names is its; one gone only with its parent goes by that parent's (a button by its own
    // Show secondary button, not the Show buttons of the row it is in)
    for (const b of booleans) { const off = expand(contract, { ...w, ...on, [b.key]: false }); for (const id of Object.keys(anatomy)) if (b.shows.includes(id) || (!off[id] && !anatomy[id].shownBy)) anatomy[id] = { ...anatomy[id], shownBy: b.figma }; }
    // a boolean shows the topmost of what it shows: the layers inside go with it
    for (const e of Object.values(anatomy)) if (e.shownBy && e.parent && anatomy[e.parent] && anatomy[e.parent].shownBy === e.shownBy) e.under = true;
    for (const e of Object.values(anatomy)) if (e.under) { delete e.shownBy; delete e.under; }
    for (const e of Object.values(anatomy)) if (e.kind === 'graphic' && !e.asset && swap) e.asset = swap.default;
    for (const [id, e] of Object.entries(anatomy)) if (e.kind === 'instance') { const by = e.swappedBy ? swaps.filter((x) => x.key === e.swappedBy) : swaps.filter((x) => x.parts.includes(id)); if (by.length) anatomy[id] = { ...e, swapProps: by.map((x) => x.figma) }; }
    for (const e of Object.values(anatomy)) if (e.kind === 'text') { const t = text.find((x) => e.content === `{${x.key}}`); if (t) e.text = t.figma; }
    return { name: axes.map((a) => `${a.figma}=${show(a, w[a.key])}`).join(', '), cell: cellOf(w), anatomy: Object.fromEntries(Object.entries(anatomy).map(([id, e]) => [id, { ...e, name: slotName(e, contract.props || {}) ?? e.name ?? partName(id) }])) };
  });
  const slots = Object.values(contract.props || {}).filter((p) => p.type === 'slot' && p.figma).map((p) => ({ figma: p.figma, settings: p.settings || null, description: p.description || '', preferred: p.preferred || [] }));
  return { name: /^[a-z][A-Za-z0-9-]*$/.test(contract.component) ? sentence(contract.component) : contract.component, slots, axes: axes.map((a) => a.figma), booleans: booleans.map((b) => ({ figma: b.figma, default: b.default })), swaps: swaps.map((x) => ({ figma: x.figma })), text: text.map((t) => ({ figma: t.figma, default: t.default })), order: Object.values(props).map((p) => p.figma).filter(Boolean), rows: Math.max(rowKeys.length, 1), cols: last ? last.values.length : 1, variants };
}

/* What the plugin runs: the plan drawn, every value bound to the variable,
   style or component the contract names; what it could not bind, listed.
   Drawn on `page`, the run's own, whichever page Figma shows meanwhile. */
const RUNTIME = async (P, K, page = figma.currentPage) => {
  const missing = new Set();
  // a Figma call that never returns (seen mid-run: one text style call in twenty, while the same call alone
  // took 8 ms) is given 8 s and one retry; still nothing, it is reported as not bound and the drawing goes on
  const tried = async (what, f) => { figma.root.setPluginData('to-figma-step', `${new Date().toISOString().slice(11, 19)} ${what}`); figma.root.setPluginData('to-figma-beat', String(Date.now())); for (let i = 0; i < 2; i++) { const r = await Promise.race([f().then((v) => ({ v }), (e) => ({ failed: String(e && e.message || e) })), new Promise((res) => setTimeout(() => res(null), 8000))]); if (r && 'v' in r) return r.v; if (r) { missing.add(`${what} (${r.failed})`); return null; } } missing.add(`${what} (no answer)`); return null; };
  // every call to Figma is made up front, side by side, then the layers are built without waiting on it:
  // with Figma in the background each call waits its turn for a slow tick, and a drawing that made its
  // hundreds of calls one after another took minutes
  // variables by the keys the runner looked up in the library file (listing a library's variables from
  // here hung for a minute at a time)
  const lib = K.vars || {};
  const els = P.variants.flatMap((v) => Object.values(v.anatomy));
  const names = new Set();
  for (const e of els) for (const t of [...[e.background, e.color, e.border && e.border.color].flat().flatMap((p) => (p && p.stops ? p.stops.map((st) => st.color) : [p])), ...[].concat((e.border && e.border.width) || []), ...[].concat(e.radius ?? []), e.opacity, e.layout && e.layout.gap, e.layout && e.layout.crossGap, ...Object.values((e.layout && e.layout.padding) || {}), e.width, e.height, e.minWidth, e.maxWidth, e.minHeight, e.maxHeight].flat()) if (typeof t === 'string' && t.includes('/')) names.add(t);
  const vars = {};
  // side by side, then once more one at a time for any that went unanswered side by side
  const imp = (n) => figma.variables.importVariableByKeyAsync(lib[n]);
  await Promise.all([...names].map(async (n) => { vars[n] = lib[n] ? await Promise.race([imp(n).catch(() => null), new Promise((r) => setTimeout(() => r(null), 8000))]) : null; }));
  for (const n of names) if (lib[n] && !vars[n]) vars[n] = await tried(n, () => imp(n));
  const V = async (n) => { if (typeof n !== 'string' || !n.includes('/')) return null; if (!vars[n]) missing.add(n); return vars[n] || null; };
  // unbound, a value is drawn as the token's own value from the snapshot (K.values), never grey or square:
  // the drawing looks right, and the report still says what is not bound
  // read as the parity engine reads a colour (its parseColour, written into the plugin code beside this, as the
  // shared variant-name reader is)
  const colourOf = (c) => { const x = parseColour(c); return x ? { rgb: x.slice(0, 3).map((v) => v / 255), a: x[3] } : null; };
  // a fill or stroke as the contract says it: a token, a gradient whose stops are tokens, or a list of either
  // an image is not in the contract (its picture is the library's asset): said, not painted grey
  const paints = async (x) => Promise.all([].concat(x).filter((p) => p != null && !(typeof p === 'string' && /^IMAGE/.test(p) && missing.add(`an image fill (${p})`))).map(async (p) => {
    if (!p || typeof p !== 'object' || !/^GRADIENT_/.test(p.type || '')) return solid(p);
    const stops = await Promise.all((p.stops || []).map(async (st) => {
      const v = await V(st.color); const c = colourOf((K.values || {})[st.color] ?? st.color);
      return { position: st.position, color: c ? { r: c.rgb[0], g: c.rgb[1], b: c.rgb[2], a: c.a } : { r: 0.5, g: 0.5, b: 0.5, a: 1 }, ...(v ? { boundVariables: { color: figma.variables.createVariableAlias(v) } } : {}) };
    }));
    return { type: p.type, gradientTransform: p.transform || [[1, 0, 0], [0, 1, 0]], gradientStops: stops };
  }));
  const solid = async (n) => { const v = await V(n); const c = colourOf((K.values || {})[n] ?? n); const p = { type: 'SOLID', color: c ? { r: c.rgb[0], g: c.rgb[1], b: c.rgb[2] } : { r: 0.5, g: 0.5, b: 0.5 }, opacity: c && !v ? c.a : 1 }; return v ? figma.variables.setBoundVariableForPaint(p, 'color', v) : p; };
  // a size in pixels: a contract also says one as fill, hug or a token, which are set once the part is placed
  const px = (x) => (typeof x === 'number' ? Math.max(x, 0.01) : null);
  const num = async (node, field, n) => { const v = await V(n); const raw = typeof n === 'number' ? n : (K.values || {})[n]; if (v) node.setBoundVariable(field, v); else if (typeof raw === 'number') node[field] = raw; };
  const ALIGN = { start: 'MIN', center: 'CENTER', end: 'MAX', 'space-between': 'SPACE_BETWEEN', baseline: 'BASELINE', stretch: 'MIN' };
  const styles = {}, fonts = {}, icons = {}, sets = {}, effects = {}, toEffect = [];
  const typos = [...new Set(els.map((e) => e.typography).filter(Boolean))], assets = [...new Set(els.map((e) => e.asset).filter(Boolean))];
  const [container] = await Promise.all([
    K.iconContainer ? tried('icon container', () => figma.importComponentSetByKeyAsync(K.iconContainer)) : null,
    ...typos.map(async (t) => { const key = K.styles && K.styles[t]; if (key) styles[key] = await tried(t, () => figma.importStyleByKeyAsync(key)); }),
    ...assets.map(async (a) => { if (K.icons && K.icons[a]) icons[a] = await tried(`icon ${a}`, () => figma.importComponentByKeyAsync(K.icons[a])); }),
    tried('Inter', () => figma.loadFontAsync({ family: 'Inter', style: 'Regular' })),
    ...Object.entries(K.sets || {}).map(async ([name, key]) => { sets[name] = await tried(name, () => figma.importComponentSetByKeyAsync(key)); }),
    ...Object.entries(K.effects || {}).map(async ([name, key]) => { effects[name] = await tried(name, () => figma.importStyleByKeyAsync(key)); }),
  ]);
  await Promise.all(Object.values(styles).filter(Boolean).map(async (st) => { fonts[JSON.stringify(st.fontName)] = await tried(`font of ${st.name}`, () => figma.loadFontAsync(st.fontName)) !== null; }));
  // a text's style is applied at the end, all at once (it is the one call per layer left)
  const toStyle = [];
  // a part centred on its parent, once text styles have given every box its final size
  const toCentre = [];
  // placed at a point and sized, then how it follows its parent's size, once its parent has its own: a constraint
  // set while the parent was still shrinking to hug what it holds stretched the part past nothing, and Figma
  // flipped it (a focus ring mirrored, off its box)
  const toPlace = [];
  // an icon's colour: its strokes where it is drawn in strokes, else its fills
  // an instance's own props as the contract sets them (a feedback message's Danger, a label's words), by Figma's names;
  // a swap is said by the part inside it, which swapTo draws
  const withProps = async (n, e) => {
    const defs = n.componentProperties;
    for (const [k, v] of Object.entries(e.with || {})) {
      const key = Object.keys(defs).find((x) => x.split('#')[0] === k);
      if (!key) continue;
      // a swap names the component by its last name ("x" for Icon/x): set to that component's variant at the one now in
      // place (a 16 for a 16), even where the variant drawn hides it
      if (defs[key].type === 'INSTANCE_SWAP') {
        const cur = await figma.getNodeByIdAsync(defs[key].value);
        const curName = cur && (cur.parent && cur.parent.type === 'COMPONENT_SET' ? cur.parent.name : cur.name);
        const is = (name) => name === String(v) || String(name).endsWith('/' + v);
        if (is(curName)) continue;
        const cname = Object.keys(K.variants || {}).find(is);
        if (!cname) { missing.add(`${k}=${v} (not found in the library)`); continue; }
        const first = Object.values(K.variants[cname])[0];
        const got = await tried(`${cname}`, () => figma.importComponentSetByKeyAsync(first).catch(() => figma.importComponentByKeyAsync(first)));
        const same = (c) => cur && cur.variantProperties && c.variantProperties && Object.entries(cur.variantProperties).every(([pk, pv]) => c.variantProperties[pk] === pv);
        const to = got && got.type === 'COMPONENT_SET' ? got.children.find(same) || got.defaultVariant : got;
        if (to) n.setProperties({ [key]: to.id }); else missing.add(`${k}=${v} (its key would not import)`);
        continue;
      }
      try { n.setProperties({ [key]: defs[key].type === 'BOOLEAN' ? v === true || v === 'True' || v === 'true' : String(v) }); } catch (err) { missing.add(`${e.component} ${k}=${v} (${err.message})`); }
    }
  };
  // an instance inside another made the component the contract names, at the variant its props choose
  const swapTo = async (n, e) => {
    const main = await n.getMainComponentAsync();
    const now = main && (main.parent && main.parent.type === 'COMPONENT_SET' ? main.parent.name : main.name);
    if (now === e.component) return;
    const vs = K.variants && K.variants[e.component];
    if (!vs) { missing.add(`${e.component} (not found in the library)`); return; }
    const fit = (name) => Object.entries(variantValues(name)).filter(([k, v]) => String((e.with || {})[k]) === v).length;
    const name = Object.keys(vs).reduce((a, b) => (fit(b) > fit(a) ? b : a));
    // the key is the component set's when the main is a variant, the component's when it stands alone
    const got = await tried(`${e.component} ${name}`, () => figma.importComponentSetByKeyAsync(vs[name]).catch(() => figma.importComponentByKeyAsync(vs[name])));
    const comp = got && got.type === 'COMPONENT_SET' ? got.children.find((c) => c.name === name) || got.defaultVariant : got;
    if (comp) n.swapComponent(comp); else missing.add(`${e.component} (its key would not import)`);
  };
  // a value the contract gives a layer inside an instance, set only where the instance draws another: a value it
  // already draws is no override
  const boundTo = (paints) => (Array.isArray(paints) && paints[0] && paints[0].boundVariables && paints[0].boundVariables.color ? paints[0].boundVariables.color.id : null);
  const paintIf = async (n, field, token) => { if (typeof token !== 'string' || !(field in n)) return; const v = await V(token); if (v && boundTo(n[field]) === v.id) return; n[field] = [await solid(token)]; };
  const override = async (n, e) => {
    if (e.kind === 'instance' && e.component && n.type === 'INSTANCE') { await swapTo(n, e); await withProps(n, e); }
    if (e.kind === 'text' && n.type === 'TEXT') {
      await paintIf(n, 'fills', e.color);
      const words = typeof e.content === 'string' && !/^\{.*\}$/.test(e.content) ? e.content : null;
      if (words !== null && n.characters !== words && n.fontName !== figma.mixed) { await tried(`font of ${n.name}`, () => figma.loadFontAsync(n.fontName)); n.characters = words; }
    } else if (e.kind === 'graphic' && n.type === 'VECTOR') await paintIf(n, n.strokes.length ? 'strokes' : 'fills', e.background);
    else if (e.kind !== 'text') await paintIf(n, 'fills', e.background);
    if (e.border && e.border.color) await paintIf(n, 'strokes', e.border.color);
    // how it is sized where the contract says otherwise than the instance (a label hugging its words in a message)
    const flowing = (x) => x && 'layoutMode' in x && x.layoutMode !== 'NONE';
    const sizes = [['width', 'layoutSizingHorizontal'], ['height', 'layoutSizingVertical']].map(([k, axis]) => [axis, { fill: 'FILL', hug: 'HUG' }[e[k]]])
      .filter(([axis, want]) => want && axis in n && n[axis] !== want && (want === 'FILL' ? flowing(n.parent) : flowing(n) || n.type === 'TEXT'));
    const resize = n.type === 'TEXT' && e.autoResize && n.textAutoResize !== e.autoResize.toUpperCase();
    // a text's font is loaded only where something about it changes: a library's text is a slow load where one fails
    if (n.type === 'TEXT' && (sizes.length || resize) && (n.fontName === figma.mixed || await tried(`font of ${n.name}`, () => figma.loadFontAsync(n.fontName)) === null)) return;
    for (const [axis, want] of sizes) n[axis] = want;
    if (resize) n.textAutoResize = e.autoResize.toUpperCase();
  };
  const recolour = (n, paint) => { for (const v of 'findAll' in n ? n.findAll((x) => x.type === 'VECTOR') : n.type === 'VECTOR' ? [n] : []) { if (v.strokes.length) v.strokes = [paint]; else v.fills = [paint]; } };
  const comps = [];
  for (const variant of P.variants) {
    const nodes = {};
    // the parts that are an instance's own layers, and, by the layer each is in, those of its layers the contract
    // lists: one it does not list was hidden where it was read (a snapshot skips hidden layers inside an instance)
    const inner = new Set(), levels = new Map();
    // an instance's layer as it is now: setting the props of an instance in a slot of another rebuilds its sibling
    // instances there, and a layer found before is gone; found again by its name and number below its parent
    const alive = (n) => { try { return !!n && !n.removed && (!('children' in n) || Array.isArray(n.children)); } catch { return false; } };
    const nthOf = (id) => +((/_(\d+)$/.exec(id.split('/').pop()) || [])[1] || 1) - 1;
    const live = (id) => {
      if (!inner.has(id) || alive(nodes[id])) return nodes[id];
      const e = variant.anatomy[id], up = live(e.parent);
      return (nodes[id] = ('children' in up ? up.children.filter((c) => c.name === e.name) : [])[nthOf(id)] || up);
    };
    const ids = Object.keys(variant.anatomy).sort((a, b) => a.split('/').length - b.split('/').length || (variant.anatomy[a].order ?? 0) - (variant.anatomy[b].order ?? 0));
    for (const id of ids) {
      const e = variant.anatomy[id];
      // a part inside another component's instance is that component's own layer, found by its name (a repeat by
      // its number), so what the contract says of it is an override
      if (id !== 'root' && nodes[e.parent] && (inner.has(e.parent) || nodes[e.parent].type === 'INSTANCE')) {
        inner.add(id);
        const up = live(e.parent);
        const nth = nthOf(id);
        const kids = 'children' in up ? up.children : [];
        let at = kids.filter((c) => c.name === e.name)[nth];
        // an instance a swap renamed after its new component ("x" for an Icon): the instance at its place, named back
        const named = (c) => Object.values(variant.anatomy).some((x) => x.parent === e.parent && x.name === c.name);
        if (!at && e.kind === 'instance' && kids[e.order ?? 0] && kids[e.order ?? 0].type === 'INSTANCE' && !named(kids[e.order ?? 0])) { at = kids[e.order ?? 0]; at.name = e.name; }
        // not there (the instance draws another variant than the one read): an icon's colour still goes on its vectors
        if (!at) { if (e.kind === 'graphic' && e.background) recolour(up, await solid(e.background)); else missing.add(`${e.name} inside ${up.name}`); nodes[id] = up; continue; }
        if (!levels.has(e.parent)) levels.set(e.parent, new Set());
        levels.get(e.parent).add(id);
        nodes[id] = at;
        await override(at, e);
        continue;
      }
      let n;
      // recorded the moment it exists, so a drawing that fails partway is this tool's to clear, not a stranger
      if (id === 'root') { n = figma.createComponent(); page.appendChild(n); n.name = variant.name; if (globalThis.__drawingStarted) globalThis.__drawingStarted(n.id); }
      else if (e.kind === 'text') {
        n = figma.createText(); nodes[e.parent].appendChild(n);
        const key = K.styles && K.styles[e.typography];
        const st = key && styles[key];
        if (st && fonts[JSON.stringify(st.fontName)]) toStyle.push([n, st, e.typography]); else missing.add(e.typography);
        // the prop's sample where a prop sets it, else the words code drew (a required mark's *)
        n.characters = e.text || (typeof e.content === 'string' && !/^\{.*\}$/.test(e.content) ? e.content : 'Text');
        if (e.textAlign) n.textAlignHorizontal = { center: 'CENTER', end: 'RIGHT', justify: 'JUSTIFIED' }[e.textAlign] || 'LEFT';
        if (e.color) n.fills = await paints(e.color);
        // how the box follows the words and where they sit; spacing and case where no style gives them
        if (e.autoResize) n.textAutoResize = e.autoResize.toUpperCase();
        if (e.verticalAlign) n.textAlignVertical = { center: 'CENTER', end: 'BOTTOM' }[e.verticalAlign] || 'TOP';
        if (e.truncate) n.textTruncation = 'ENDING';
        if (e.maxLines) n.maxLines = e.maxLines;
        const unit = (v) => (v === 'auto' ? { unit: 'AUTO' } : /%$/.test(String(v)) ? { value: parseFloat(v), unit: 'PERCENT' } : { value: +v, unit: 'PIXELS' });
        if (e.letterSpacing != null) n.letterSpacing = unit(e.letterSpacing);
        if (e.lineHeight != null) n.lineHeight = unit(e.lineHeight);
        if (e.paragraphSpacing != null) n.paragraphSpacing = e.paragraphSpacing;
        if (e.listSpacing != null) n.listSpacing = e.listSpacing;
        if (e.textCase) n.textCase = e.textCase.toUpperCase();
        if (e.textDecoration) n.textDecoration = e.textDecoration.toUpperCase();
      } else if (e.kind === 'graphic' && container && e.asset) {
        n = (container.children.find((c) => P.sizeAxis && c.name === `${P.sizeAxis}=${e.width}`) || container.defaultVariant).createInstance();
        if (e.asset && K.icons && K.icons[e.asset]) {
          const swapKey = Object.keys(n.componentProperties).find((k) => n.componentProperties[k].type === 'INSTANCE_SWAP');
          if (swapKey && icons[e.asset]) n.setProperties({ [swapKey]: icons[e.asset].id });
        } else if (e.asset) missing.add(`icon ${e.asset}`);
        if (e.background) recolour(n, await solid(e.background));
      } else if (e.kind === 'instance' && e.component) {
        // another component of the library: its instance, at the size nearest the code's (the settings' size axis,
        // valued in pixels), a photo where the code shows an image (a Content axis whose options name one); not in the library, a plain frame
        const set = sets[e.component];
        if (set) {
          const opts = set.componentPropertyDefinitions;
          const pick = (v) => Object.entries(opts).filter(([, d]) => d.type === 'VARIANT').every(([k, d]) => {
            const val = v.variantProperties[k];
            if (P.sizeAxis && k.toLowerCase() === P.sizeAxis.toLowerCase() && d.variantOptions.every((o) => /^\d+$/.test(o))) return val === d.variantOptions.reduce((a, b) => (Math.abs(+b - e.width) < Math.abs(+a - e.width) ? b : a));
            if (/^content$/i.test(k) && d.variantOptions.some((o) => /photo|image/i.test(o))) return /photo|image/i.test(val) === !!e.image;
            return val === d.defaultValue || val === set.defaultVariant.variantProperties[k];
          });
          n = (set.children.find(pick) || set.defaultVariant).createInstance();
          if (e.width && Math.round(n.width) !== Math.round(e.width)) missing.add(`${e.component} at ${e.width}px (the library's nearest is ${Math.round(n.width)})`);
        } else if (Object.keys((K.variants || {})[e.component] || {}).length) {
          // a variant the snapshot met: the one whose pixel size (on the settings' size axis) is nearest the part's, else the first
          const vs = K.variants[e.component];
          const sizeOf = (name) => { const m = P.sizeAxis && new RegExp(`(?:^|, )${P.sizeAxis.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}=(\\d+)(?:,|$)`).exec(name); return m ? +m[1] : null; };
          const sized = Object.keys(vs).filter((x) => sizeOf(x) !== null);
          const name = px(e.width) && sized.length ? sized.reduce((a, b) => (Math.abs(sizeOf(b) - e.width) < Math.abs(sizeOf(a) - e.width) ? b : a)) : Object.keys(vs)[0];
          // the key is the component set's when the main is a variant, the component's when it stands alone
          const got = await tried(`${e.component} ${name}`, () => figma.importComponentSetByKeyAsync(vs[name]).catch(() => figma.importComponentByKeyAsync(vs[name])));
          const main = got && got.type === 'COMPONENT_SET' ? got.children.find((c) => c.name === name) || got.defaultVariant : got;
          if (main) n = main.createInstance();
          // its own props as the contract sets them (a feedback message's Danger, a label's words), by Figma's names
          if (main) await withProps(n, e);
          else { n = figma.createFrame(); n.fills = []; n.resize(px(e.width) || 24, px(e.height) || px(e.width) || 24); missing.add(`${e.component} (its key would not import)`); }
        } else { n = figma.createFrame(); n.fills = []; n.resize(px(e.width) || 24, px(e.height) || px(e.width) || 24); missing.add(`${e.component} (not found in the library)`); }
      // a slot: Figma's own, its property made with it and named after it; the variants' slots of one name are one property
      // a slot with no property of this component's (one inside an instance drawn as a stand-in) is a frame
      } else if (e.kind === 'slot' && (P.slots || []).some((sl) => sl.figma === e.name)) { n = nodes.root.createSlot(); n.fills = []; }
      // a shape no icon names: a line (no width or no height, a divider) is Figma's vector, an ellipse its ellipse
      else if (e.kind === 'graphic' && (e.width === 0 || e.height === 0)) { const len = px(e.width === 0 ? e.height : e.width) || 1; n = figma.createVector(); n.vectorPaths = [{ windingRule: 'NONE', data: e.width === 0 ? `M 0 0 L 0 ${len}` : `M 0 0 L ${len} 0` }]; }
      else if (e.kind === 'graphic' && e.shape === 'ellipse') { n = figma.createEllipse(); if (e.arc) n.arcData = { startingAngle: (e.arc.start * Math.PI) / 180, endingAngle: (e.arc.end * Math.PI) / 180, innerRadius: e.arc.inner || 0 }; }
      else if (e.kind === 'graphic' && e.shape === 'rectangle') n = figma.createRectangle();
      else { n = figma.createFrame(); n.fills = []; }
      if (id !== 'root') n.name = e.name;
      if (e.opacity != null) await num(n, 'opacity', e.opacity);
      if (e.blend) n.blendMode = e.blend.toUpperCase();
      if (e.mask) n.isMask = true;
      if (e.rotation) n.rotation = e.rotation;
      if (['FRAME', 'COMPONENT', 'SLOT', 'VECTOR', 'ELLIPSE', 'RECTANGLE'].includes(n.type)) {
        if (e.layout) {
          n.layoutMode = e.layout.direction === 'column' ? 'VERTICAL' : 'HORIZONTAL';
          n.primaryAxisSizingMode = 'AUTO'; n.counterAxisSizingMode = 'AUTO';
          n.primaryAxisAlignItems = ALIGN[e.layout.align] || 'MIN'; n.counterAxisAlignItems = ALIGN[e.layout.crossAlign] || 'MIN';
          if (e.layout.gap != null) await num(n, 'itemSpacing', e.layout.gap);
          if (e.layout.firstOnTop) n.itemReverseZIndex = true;
          if (e.layout.wrap) { n.layoutWrap = 'WRAP'; if (e.layout.crossGap != null) await num(n, 'counterAxisSpacing', e.layout.crossGap); }
          const pad = e.layout.padding || {};
          for (const [side, f] of [['top', 'paddingTop'], ['end', 'paddingRight'], ['bottom', 'paddingBottom'], ['start', 'paddingLeft']]) if (pad[side] != null) await num(n, f, pad[side]);
          // a box with nothing inside: its measured size, not Figma's 100 for an empty auto layout
          if (px(e.width) && !ids.some((x) => variant.anatomy[x].parent === id)) { n.primaryAxisSizingMode = 'FIXED'; n.counterAxisSizingMode = 'FIXED'; n.resize(px(e.width), px(e.height) || px(e.width)); }
          for (const f of ['minWidth', 'maxWidth', 'minHeight', 'maxHeight']) if (e[f] != null) await num(n, f, e[f]);
        } else if (n.type !== 'VECTOR' && n.type !== 'ELLIPSE' && ids.some((x) => variant.anatomy[x].parent === id && !variant.anatomy[x].absolute)) {
          // a box no flex lays out that holds parts: they flow side by side, as inline content does (a label and
          // its required mark), never stacked at one point
          n.layoutMode = 'HORIZONTAL'; n.primaryAxisSizingMode = 'AUTO'; n.counterAxisSizingMode = 'AUTO'; n.counterAxisAlignItems = 'CENTER';
        // a line's length is its path's, and it has no width to give
        } else if (px(e.width) && n.type !== 'VECTOR') n.resize(px(e.width), px(e.height) || px(e.width));
        n.fills = e.background ? await paints(e.background) : [];
        // one radius, or one per corner in Figma's order: top left, top right, bottom right, bottom left
        // an ellipse has no corners: a radius a variant kept from a rectangle is not drawn
        if (e.radius != null && n.type !== 'ELLIPSE') for (const [i, f] of ['topLeftRadius', 'topRightRadius', 'bottomRightRadius', 'bottomLeftRadius'].entries()) await num(n, f, Array.isArray(e.radius) ? e.radius[i] : e.radius);
        if (e.border) {
          n.strokes = e.border.color ? await paints(e.border.color) : [];
          // where the contract says (a divider's on its centre), else inside; taking room in the layout only where it says
          n.strokeAlign = (e.border.align || 'inside').toUpperCase();
          if ('layoutMode' in n && n.layoutMode !== 'NONE') n.strokesIncludedInLayout = !!e.border.inLayout;
          if (e.border.dash) n.dashPattern = e.border.dash;
          if (e.border.cap && 'strokeCap' in n) n.strokeCap = e.border.cap.toUpperCase();
          const side = (i) => (Array.isArray(e.border.width) ? e.border.width[i] : e.border.width ?? (e.border.sides || {})[['top', 'end', 'bottom', 'start'][i]] ?? 1);
          // a vector has one weight, a box one a side
          if ('strokeTopWeight' in n) { for (const [i, f] of ['strokeTopWeight', 'strokeRightWeight', 'strokeBottomWeight', 'strokeLeftWeight'].entries()) await num(n, f, side(i)); } else await num(n, 'strokeWeight', side(0));
        }
        if (e.smoothing && 'cornerSmoothing' in n) n.cornerSmoothing = e.smoothing;
        // Figma's frames clip by default; the contract says which do
        if ('clipsContent' in n) n.clipsContent = e.overflow === 'hidden';
        // its shadow: the library's effect style, bound at the end with the text styles; an unmatched one, said
        if (e.shadow) { if (effects[e.shadow]) toEffect.push([n, effects[e.shadow], e.shadow]); else missing.add(`shadow ${e.shadow}`); }
      }
      if (id !== 'root' && n.parent !== nodes[e.parent]) nodes[e.parent].appendChild(n);
      // a size said as intent, set once the part has its parent: fill the parent's flow, hug what it holds, a fixed
      // number, or a token's value, bound
      const flows = (x) => x && 'layoutMode' in x && x.layoutMode !== 'NONE';
      for (const [k, axis] of [['width', 'layoutSizingHorizontal'], ['height', 'layoutSizingVertical']]) {
        const sz = e[k];
        if (sz === 'fill') { if (id !== 'root' && flows(nodes[e.parent]) && !e.absolute && e.position !== 'absolute') n[axis] = 'FILL'; }
        else if (sz === 'hug') { if (flows(n) || n.type === 'TEXT') n[axis] = 'HUG'; }
        // a number in an auto layout, which would hug what it holds: fixed at that size
        else if (typeof sz === 'number' && flows(n)) { n[axis] = 'FIXED'; n.resize(k === 'width' ? px(sz) : n.width, k === 'height' ? px(sz) : n.height); }
        // an instance at another size than its component's (a 16 icon drawn at 12): resized, its layers following
        else if (typeof sz === 'number' && n.type === 'INSTANCE' && Math.abs(n[k] - sz) > 0.01) n.resize(k === 'width' ? px(sz) : n.width, k === 'height' ? px(sz) : n.height);
        else if (typeof sz === 'string') { const v = await V(sz); const raw = (K.values || {})[sz]; if (v) n.setBoundVariable(k, v); else if (typeof raw === 'number') n.resize(k === 'width' ? raw : n.width, k === 'height' ? raw : n.height); }
      }
      // placed at a point in its parent (a thumb over its track): absolute in Figma's auto layout, kept at its order
      // among its siblings, which is what it paints over (a spinner under the content it sits behind)
      if (id !== 'root' && e.absolute && nodes[e.parent].layoutMode && nodes[e.parent].layoutMode !== 'NONE') { n.layoutPositioning = 'ABSOLUTE'; n.x = e.absolute.x; n.y = e.absolute.y; }
      // in a box no layout places, at its point
      else if (id !== 'root' && e.absolute) { n.x = e.absolute.x; n.y = e.absolute.y; }
      if (id !== 'root' && (e.absolute || e.constraints)) toPlace.push([n, e]);
      nodes[id] = n;
    }
    for (const [pid, kids] of levels) { const kept = new Set([...kids].map((k) => live(k).id)); for (const c of live(pid).children) if (!kept.has(c.id)) c.visible = false; }
    // placed out of the flow with no point given (a focus ring round its box): centred on its parent, above the rest
    for (const id of ids) {
      const e = variant.anatomy[id], n = nodes[id], up = nodes[e.parent];
      if (id === 'root' || inner.has(id) || e.absolute || e.position !== 'absolute' || n === up || !up.layoutMode || up.layoutMode === 'NONE') continue;
      up.appendChild(n); n.layoutPositioning = 'ABSOLUTE'; toCentre.push([n, up]);
    }
    comps.push({ node: nodes.root, anatomy: variant.anatomy, nodes, inner, cell: variant.cell });
  }
  await Promise.all([...toStyle.map(([n, st, t]) => tried(t, () => n.setTextStyleIdAsync(st.id))), ...toEffect.map(([n, st, t]) => tried(t, () => n.setEffectStyleIdAsync(st.id)))]);
  for (const [n, e] of toPlace) {
    if (e.absolute) {
      // its size: stretched, its parent's less both offsets; else its own
      const c = e.constraints || {}, up = n.parent, at = e.absolute;
      const w = c.horizontal === 'stretch' && at.end != null ? up.width - at.x - at.end : typeof e.width === 'number' ? e.width : n.width;
      const h = c.vertical === 'stretch' && at.bottom != null ? up.height - at.y - at.bottom : typeof e.height === 'number' ? e.height : n.height;
      if ('resize' in n && n.type !== 'VECTOR' && (Math.abs(w - n.width) > 0.01 || Math.abs(h - n.height) > 0.01)) n.resize(px(w), px(h));
      // pinned to its parent's end or bottom: from there
      n.x = c.horizontal === 'max' && at.end != null ? up.width - at.end - n.width : at.x;
      n.y = c.vertical === 'max' && at.bottom != null ? up.height - at.bottom - n.height : at.y;
    }
    if (e.constraints && 'constraints' in n) n.constraints = { horizontal: e.constraints.horizontal.toUpperCase(), vertical: e.constraints.vertical.toUpperCase() };
  }
  for (const [n, up] of toCentre) { n.x = Math.round((up.width - n.width) / 2); n.y = Math.round((up.height - n.height) / 2); }
  // one variant is a component, never a set of one
  const single = comps.length === 1;
  const set = single ? comps[0].node : figma.combineAsVariants(comps.map((c) => c.node), page);
  set.name = P.name;
  if (globalThis.__drawingStarted) globalThis.__drawingStarted(set.id);
  // the grid the plan placed each variant in, as Figma's grid auto layout lays it out, 24 apart and 24 in; a Figma
  // without grid layout gets the same grid by hand, and the result says which, and why
  let layout = 'one variant';
  if (!single) {
  try {
    set.layoutMode = 'GRID';
    set.gridRowCount = P.rows; set.gridColumnCount = P.cols;
    set.gridRowGap = 24; set.gridColumnGap = 24;
    set.paddingTop = set.paddingRight = set.paddingBottom = set.paddingLeft = 24;
    set.gridRowSizes = Array.from({ length: P.rows }, () => ({ type: 'HUG' })); set.gridColumnSizes = Array.from({ length: P.cols }, () => ({ type: 'HUG' }));
    set.layoutSizingHorizontal = 'HUG'; set.layoutSizingVertical = 'HUG';
    for (const c of comps) set.appendChildAt(c.node, c.cell[0], c.cell[1]);
    // a variant that fills its set fills its cell, the track fixed at the size the library's set gives it (else the
    // most its variants draw at)
    for (const [k, axis, tracks, at] of [['width', 'layoutSizingHorizontal', 'gridColumnSizes', 1], ['height', 'layoutSizingVertical', 'gridRowSizes', 0]]) {
      if (!comps.some((c) => c.anatomy.root[k] === 'fill')) continue;
      set[tracks] = set[tracks].map((_, j) => ({ type: 'FIXED', value: Math.max(1, ...comps.filter((c) => c.cell[at] === j).map((c) => (c.anatomy.root.canvas || {})[k] ?? c.node[k])) }));
      for (const c of comps) if (c.anatomy.root[k] === 'fill') c.node[axis] = 'FILL';
    }
    layout = 'grid';
  } catch (e) {
    layout = 'by hand: ' + (e && e.message || e);
    set.layoutMode = 'NONE';
    const w = [], h = [];
    for (const c of comps) { w[c.cell[1]] = Math.max(w[c.cell[1]] || 0, c.node.width); h[c.cell[0]] = Math.max(h[c.cell[0]] || 0, c.node.height); }
    const at = (sizes, i) => 24 + sizes.slice(0, i).reduce((t, x) => t + (x || 0) + 24, 0);
    for (const c of comps) { c.node.x = at(w, c.cell[1]); c.node.y = at(h, c.cell[0]); }
    set.resizeWithoutConstraints(Math.max(...comps.map((c) => c.node.x + c.node.width)) + 24, Math.max(...comps.map((c) => c.node.y + c.node.height)) + 24);
  }
  set.fills = []; set.strokes = [{ type: 'SOLID', color: { r: 0.59, g: 0.28, b: 1 } }]; set.dashPattern = [10, 5]; set.cornerRadius = 5;
  }
  // properties in the contract's order, which the panel keeps (figma-standard rules 1 and 5: a boolean, then what it
  // reveals); a variant axis is placed by Figma, and only a drag in its panel moves one
  const refs = {};
  // each instance swap property, its default the component of the first instance it may swap that no property before
  // it has: Figma swaps a linked instance to its property's default, so each size's icon has its own (Icon (16), (20))
  const mainOf = new Map(), defaults = new Map();
  for (const c of comps) for (const [id, e] of Object.entries(c.anatomy)) if (e.swapProps && !c.inner.has(id) && c.nodes[id].type === 'INSTANCE') mainOf.set(c.nodes[id], ((await c.nodes[id].getMainComponentAsync()) || {}).id);
  for (const name of P.order || []) {
    const t = P.text.find((x) => x.figma === name), b = P.booleans.find((x) => x.figma === name), sw = (P.swaps || []).find((x) => x.figma === name);
    if (t) refs[t.figma] = set.addComponentProperty(t.figma, 'TEXT', t.default || t.figma);
    else if (b) refs[b.figma] = set.addComponentProperty(b.figma, 'BOOLEAN', b.default);
    else if (sw) {
      const taken = new Set(defaults.values());
      const first = comps.flatMap((c) => Object.entries(c.anatomy).map(([id, e]) => [c.nodes[id], e])).find(([n, e]) => e.swapProps && e.swapProps.includes(sw.figma) && mainOf.get(n) && !taken.has(mainOf.get(n)));
      if (first) { defaults.set(sw.figma, mainOf.get(first[0])); refs[sw.figma] = set.addComponentProperty(sw.figma, 'INSTANCE_SWAP', mainOf.get(first[0])); } else missing.add(`${sw.figma} (no instance of it drawn)`);
    }
  }
  // each slot's property, made with its layer, given the slot's settings and description
  for (const sl of P.slots || []) {
    const key = Object.keys(set.componentPropertyDefinitions).find((k) => k.split('#')[0] === sl.figma && set.componentPropertyDefinitions[k].type === 'SLOT');
    if (!key) { missing.add(`slot ${sl.figma} (no layer of it drawn)`); continue; }
    // a preferred instance is the snapshot's key of a component set or a component, which Figma takes with its type
    const preferred = [];
    for (const k of sl.preferred) {
      const got = await figma.importComponentSetByKeyAsync(k).then(() => 'COMPONENT_SET', () => figma.importComponentByKeyAsync(k).then(() => 'COMPONENT', () => null));
      if (got) preferred.push({ type: got, key: k }); else missing.add(`${sl.figma}'s preferred instance ${k} (its key would not import)`);
    }
    const edit = { ...(sl.settings ? { slotSettings: sl.settings } : {}), ...(sl.description ? { description: sl.description } : {}), ...(preferred.length ? { preferredValues: preferred } : {}) };
    if (Object.keys(edit).length) set.editComponentProperty(key, edit);
  }
  for (const c of comps) for (const [id, e] of Object.entries(c.anatomy)) {
    // a layer inside an instance is the other component's: Figma links none of them to this one's props
    if (c.inner.has(id)) continue;
    const n = c.nodes[id];
    if (e.text && refs[e.text]) n.componentPropertyReferences = { characters: refs[e.text] };
    if (e.shownBy && refs[e.shownBy]) n.componentPropertyReferences = { ...(n.componentPropertyReferences || {}), visible: refs[e.shownBy] };
    const swappedBy = e.swapProps && n.type === 'INSTANCE' && e.swapProps.find((f) => refs[f] && defaults.get(f) === mainOf.get(n));
    if (swappedBy) n.componentPropertyReferences = { ...(n.componentPropertyReferences || {}), mainComponent: refs[swappedBy] };
    else if (e.swapProps && n.type === 'INSTANCE') missing.add(`${e.name}'s swap (${e.swapProps.join(' or ')}: no default is its component)`);
    // a slot's default contents are the person's to replace, and Figma exposes none of them
    const inSlot = (x) => { for (let up = x.parent; up && up.type !== 'COMPONENT'; up = up.parent) if (up.type === 'SLOT') return true; return false; };
    // Figma exposes one only where its component's props reference its layers, and has no call that asks: one with
    // props beyond its variants is offered, and one Figma refuses could be exposed in no file
    if (n.type === 'INSTANCE' && !inSlot(n) && Object.values(n.componentProperties).some((x) => x.type !== 'VARIANT')) { try { n.isExposedInstance = true; } catch { /* its props reference none of its layers */ } }
  }
  // the set at the page's origin, where it is looked for
  set.x = 0; set.y = 0;
  page.selection = [set];
  return { set: set.id, parts: comps.map((c) => c.node.id), variants: comps.length, layout, props: Object.keys(set.componentPropertyDefinitions), missing: [...missing] };
};

/* Each named component's variants, as the snapshot's specs met them: an
   instance records its main component ("Icon/check / Size=20") and its key,
   which imports without the library file open. */
export function variantKeys(dir, names, tails = []) {
  const out = {};
  const wanted = (n) => names.includes(n) || tails.includes(n.split('/').pop());
  const walk = (v) => {
    if (Array.isArray(v)) { v.forEach(walk); return; }
    if (!v || typeof v !== 'object') return;
    if (typeof v.instanceOf === 'string' && v.instanceOfKey) {
      // the set as every reader of `instanceOf` resolves it (graph.cjs nameOf), asked for by name or by its last
      // name, as a swap names it ("x" for Icon/x); the variant's name is what follows it
      const set = nameOf(v.instanceOf, wanted);
      if (wanted(set)) (out[set] = out[set] || {})[set === v.instanceOf ? set : v.instanceOf.slice(set.length + 3)] = v.instanceOfKey;
    }
    Object.values(v).forEach(walk);
  };
  if (names.length || tails.length) for (const { spec } of req('../snapshot/store.cjs').readSpecs(dir, { compact: true })) walk(spec);
  return out;
}

/* The plan as the plugin gets it: each distinct element once, a variant's anatomy its indices. */
export function pluginCode(contract, keys, { before = '', after = '', failed = '', axisOrder = [], sizeAxis = null } = {}) {
  const p = plan(contract, { axisOrder }), table = [], at = new Map();
  const ref = (e) => { const j = JSON.stringify(e); if (!at.has(j)) { at.set(j, table.length); table.push(e); } return at.get(j); };
  // the size axis by the library's settings' name (sizeAxis), carried to the drawing; none named, no variant is picked by size
  const packed = { ...p, sizeAxis, elements: table, variants: p.variants.map((v) => ({ name: v.name, cell: v.cell, anatomy: Object.fromEntries(Object.entries(v.anatomy).map(([id, e]) => [id, ref(e)])) })) };
  // a layer hidden inside an instance is one to draw and match too: the snapshot's walk, run in the same plugin
  // before (the update's live read, the audit), leaves Figma skipping them
  return `figma.skipInvisibleInstanceChildren = false;\n${before}const P = ${JSON.stringify(packed)}; for (const v of P.variants) for (const id in v.anatomy) v.anatomy[id] = P.elements[v.anatomy[id]];\nconst parseColour = ${parseColour.toString()};
const variantValues = ${variantValues.toString()};
let __res; try { __res = await (${RUNTIME.toString()})(P, ${JSON.stringify(keys)}${before ? ', __page' : ''});\n${after}} catch (e) { ${failed} throw e; }\nreturn __res;`;
}

/* The names a plan needs keys for: its text styles and icons. */
export function needs(p) {
  const els = p.variants.flatMap((v) => Object.values(v.anatomy));
  const vars = new Set();
  for (const e of els) for (const t of [...[e.background, e.color, e.border && e.border.color].flat().flatMap((p) => (p && p.stops ? p.stops.map((st) => st.color) : [p])), ...[].concat((e.border && e.border.width) || []), ...[].concat(e.radius ?? []), e.opacity, e.layout && e.layout.gap, e.layout && e.layout.crossGap, ...Object.values((e.layout && e.layout.padding) || {}), e.width, e.height, e.minWidth, e.maxWidth, e.minHeight, e.maxHeight].flat()) if (typeof t === 'string' && t.includes('/')) vars.add(t);
  return { styles: [...new Set(els.map((e) => e.typography).filter(Boolean))], icons: [...new Set(els.map((e) => e.asset).filter(Boolean))], vars: [...vars], components: [...new Set(els.filter((e) => e.kind === 'instance' && e.component).map((e) => e.component))], swaps: [...new Set(els.flatMap((e) => Object.values(e.with || {})).filter((v) => typeof v === 'string'))], effects: [...new Set(els.map((e) => e.shadow).filter((x) => x && !/\(/.test(x)))] };
}

/* In the library file: the keys of the text styles, icons and icon container
   named, found where the library uses them (a text node in that style, an
   instance of that icon), since a style or icon another library owns is not
   among this file's own. Passed to the service's /exec. */
const LOOKUP = async (want) => {
  await figma.loadAllPagesAsync();
  const styles = {}, icons = {}, vars = {}, sets = {};
  let container = null;
  // a variable's key from what the library's own layers are bound to (listing a library's variables hung)
  const ids = new Set();
  const collectIds = (v) => { if (!v) return; if (Array.isArray(v)) v.forEach(collectIds); else if (typeof v === 'object') { if (v.type === 'VARIABLE_ALIAS' && v.id) ids.add(v.id); else Object.values(v).forEach(collectIds); } };
  if (want.vars && want.vars.length) {
    for (const n of figma.root.findAll((x) => x.type === 'COMPONENT' || x.type === 'FRAME' || x.type === 'TEXT' || x.type === 'INSTANCE' || x.type === 'VECTOR')) {
      collectIds(n.boundVariables);
      if (Array.isArray(n.fills)) for (const f of n.fills) collectIds(f.boundVariables);
      if (Array.isArray(n.strokes)) for (const f of n.strokes) collectIds(f.boundVariables);
    }
    for (const v of await Promise.all([...ids].map((id) => figma.variables.getVariableByIdAsync(id)))) if (v && want.vars.includes(v.name) && !vars[v.name]) vars[v.name] = v.key;
  }
  for (const n of figma.root.findAllWithCriteria({ types: ['TEXT', 'INSTANCE', 'COMPONENT_SET'] })) {
    if (n.type === 'COMPONENT_SET' && n.name === want.container && !container) container = n.key;
    if ((n.type === 'COMPONENT_SET') && (want.components || []).includes(n.name) && !sets[n.name]) sets[n.name] = n.key;
    if (n.type === 'TEXT' && typeof n.textStyleId === 'string' && n.textStyleId) { const st = await figma.getStyleByIdAsync(n.textStyleId); if (st && want.styles.includes(st.name) && !styles[st.name]) styles[st.name] = st.key; }
    if (n.type === 'INSTANCE' && want.icons.length) { const mc = await n.getMainComponentAsync(); if (mc && want.icons.includes(mc.name) && !icons[mc.name]) icons[mc.name] = mc.key; }
    if (container && Object.keys(styles).length === want.styles.length && Object.keys(icons).length === want.icons.length) break;
  }
  return { styles, icons, iconContainer: container, vars, sets };
};

/* Where a drawing goes: a page of the component's own name in the scratch file,
   made if missing and put in alphabetical order, at 0,0, so nothing on another page is touched. The page records
   the drawings this tool made, by node id (a copy someone makes keeps the
   name, never the id), and anything on it this tool did not draw refuses the
   run. The last drawing of the component is replaced only once the new one
   is drawn; one an instance in this file still uses is kept, renamed as
   superseded (instances in other files are not visible from here; a scratch
   drawing is not published, so has none). */
export const BEFORE = (name) => `await figma.loadAllPagesAsync();
  // one drawing at a time in the file, asked before any page is made or shown: a run the runner gave up on goes on in
  // Figma, and two at once tangled the record. A run is alive while it beats (each Figma call it makes); one silent
  // for a minute is taken as stalled. The token is taken at once, so no run starts between the asking and the taking
  const __beat = +figma.root.getPluginData('to-figma-beat') || 0;
  const __running = +figma.root.getPluginData('to-figma-running') || 0;
  if (__running && Date.now() - Math.max(__beat, __running) < 60000) return { refused: 'another drawing is still running in this file (last heard ' + Math.round((Date.now() - Math.max(__beat, __running)) / 1000) + ' s ago); wait for it' };
  // this run's token: a stalled run that wakes after a newer one began finds the token changed and records nothing
  const __token = Date.now(); figma.root.setPluginData('to-figma-running', String(__token));
  const __release = () => { if (figma.root.getPluginData('to-figma-running') === String(__token)) figma.root.setPluginData('to-figma-running', ''); };
  // each component on a page of its own name, put after the last page whose name comes before it
  let __page = figma.root.children.find((p) => p.name === ${JSON.stringify(name)});
  if (!__page) { __page = figma.createPage(); __page.name = ${JSON.stringify(name)}; const __before = figma.root.children.filter((p) => p !== __page && p.name.localeCompare(${JSON.stringify(name)}, 'en') < 0 /* the locale pinned, as compareNames (tools/shared/output.mjs) pins it: this runs in Figma, which cannot import it */).pop(); figma.root.insertChild(__before ? figma.root.children.indexOf(__before) + 1 : 0, __page); }
  await figma.setCurrentPageAsync(__page);
  const __rec = JSON.parse(__page.getPluginData('drawings') || '{"by":{},"all":[]}');
  // the record holds only drawings that still exist, once each
  const __exists = async (x) => !!(await figma.getNodeByIdAsync(x.replace(/^kept:/, '')));
  __rec.all = [...new Set(__rec.all)]; { const keep = []; for (const x of __rec.all) if (await __exists(x)) keep.push(x); __rec.all = keep; }
  for (const [k, v] of Object.entries(__rec.by)) if (!__rec.all.includes(v)) delete __rec.by[k];
  // a drawing that failed partway: recorded when it began, finished by none, so cleared
  for (const id of __rec.all.filter((x) => !Object.values(__rec.by).includes(x))) { const n = await figma.getNodeByIdAsync(id); if (n) n.remove(); }
  __rec.all = __rec.all.filter((x) => Object.values(__rec.by).includes(x) || x.startsWith('kept:'));
  // an instance of one of this tool's drawings, placed to look at it, is a person's and stays; anything else refuses
  const __mine = (id) => __rec.all.includes(id) || __rec.all.includes('kept:' + id);
  const __other = [];
  for (const n of __page.children) {
    if (__mine(n.id)) continue;
    if (n.type === 'INSTANCE') { const mc = await n.getMainComponentAsync(); let a = mc; while (a && a.parent && a.parent.type !== 'PAGE') a = a.parent; if (a && __mine(a.id)) continue; }
    __other.push(n);
  }
  if (__other.length) { __release(); return { refused: 'the ' + __page.name + ' page holds something this tool did not draw: ' + __other.map((n) => n.name).slice(0, 5).join(', ') }; }
  __page.setPluginData('drawings', JSON.stringify(__rec));
  // each node the drawing makes, recorded as it is made, so a run that fails partway is cleared by the next
  globalThis.__drawingStarted = (id) => { if (figma.root.getPluginData('to-figma-running') !== String(__token)) return; __rec.all.push(id); __page.setPluginData('drawings', JSON.stringify(__rec)); };
  // what the page held before this run: a part made but never placed when the run fails is left on the page, so cleared
  const __pre = new Set(__page.children.map((n) => n.id));
`;
/* A run that throws: what it made and never placed is cleared, its record kept, the token given back; a run a newer
   one took over from touches nothing, the page and the record being that run's now. */
export const FAILED = "if (figma.root.getPluginData('to-figma-running') === String(__token)) { __page.setPluginData('drawings', JSON.stringify(__rec)); for (const n of [...__page.children]) if (!__pre.has(n.id) && !__rec.all.includes(n.id)) n.remove(); __release(); }";
export const AFTER = (name) => `{
  if (figma.root.getPluginData('to-figma-running') !== String(__token)) { const mine = await figma.getNodeByIdAsync(__res.set); if (mine) mine.remove(); return { refused: 'a newer drawing began while this one was stalled; this one was discarded' }; }
  const old = __rec.by[${JSON.stringify(name)}] && await figma.getNodeByIdAsync(__rec.by[${JSON.stringify(name)}]);
  if (old) {
    let used = false; for (const c of old.type === 'COMPONENT' ? [old] : old.findAll((x) => x.type === 'COMPONENT')) if ((await c.getInstancesAsync()).length) { used = true; break; }
    // kept above everything on the page, so drawings superseded in turn never overlap
    if (used) { old.name += ' (superseded ' + new Date().toISOString().slice(0, 10) + ')'; old.y = Math.min(...__page.children.map((n) => n.y)) - old.height - 200; __rec.all = __rec.all.filter((x) => x !== old.id).concat('kept:' + old.id); }
    else { old.remove(); __rec.all = __rec.all.filter((x) => x !== __rec.by[${JSON.stringify(name)}]); }
  }
  __rec.all = __rec.all.filter((x) => !__res.parts.includes(x)); __rec.by[${JSON.stringify(name)}] = __res.set; if (!__rec.all.includes(__res.set)) __rec.all.push(__res.set);
  __page.setPluginData('drawings', JSON.stringify(__rec)); __release(); }
`;

/* A library component updated in place (the editor's "Update the library component", which it offers, not
   recommends): the contract drawn as for a new one, beside it, then copied onto the existing set node by node and
   the drawing removed. The set and every variant that stays keep their node and key, so each instance in every file
   stays linked and takes the change when the library publishes; a layer that stays keeps its node, so an
   instance's override on it stays too. A variant matches by its values, a layer by its name (and its number among
   those of that name). A variant the contract no longer draws is removed, its instances in this file counted; a
   renamed option is a removed variant and a new one; a renamed, added or removed axis is refused. */
export const PATCH_BEFORE = (target) => `await figma.loadAllPagesAsync();
  const __beat = +figma.root.getPluginData('to-figma-beat') || 0;
  const __running = +figma.root.getPluginData('to-figma-running') || 0;
  if (__running && Date.now() - Math.max(__beat, __running) < 60000) return { refused: 'another drawing is still running in this file; wait for it' };
  const __token = Date.now(); figma.root.setPluginData('to-figma-running', String(__token));
  const __release = () => { if (figma.root.getPluginData('to-figma-running') === String(__token)) figma.root.setPluginData('to-figma-running', ''); };
  const __target = await figma.getNodeByIdAsync(${JSON.stringify(target)});
  if (!__target || (__target.type !== 'COMPONENT_SET' && __target.type !== 'COMPONENT')) { __release(); return { refused: 'no component or component set ' + ${JSON.stringify(target)} + ' in this file' }; }
  // a point in the file's version history to go back to, named, before anything changes: a patch that fails partway
  // leaves the set half changed, and Figma's history is how it is undone
  try { await figma.saveVersionHistoryAsync('Before the contract editor updated ' + __target.name, 'to-figma --patch'); } catch (e) { __release(); return { refused: 'Figma would not save a version to go back to (' + e.message + '); nothing was changed' }; }
  let __page = __target; while (__page.type !== 'PAGE') __page = __page.parent;
  await figma.setCurrentPageAsync(__page);
  // each node the new drawing makes, so a run that fails partway leaves nothing of it behind
  const __made = []; globalThis.__drawingStarted = (id) => __made.push(id);
  // set once the library's set begins to change, so a failure after it says how to go back
  let __patching = false;
`;
// what the drawing made, less what was moved into the library's set: removing that would empty the set, and Figma
// would remove it
export const PATCH_FAILED = "for (const id of __made) { const n = await figma.getNodeByIdAsync(id); let up = n; while (up && up !== __target) up = up.parent; if (n && !n.removed && !up) n.remove(); } __release(); if (__patching) throw new Error('the library set was changed partway, then this failed (' + (e && e.message || e) + '): restore the version named Before the contract editor updated ' + __target.name + ' from the version history');";
export const PATCH_AFTER = `{ __res = await (${(async (res, target, token, patching) => {
  const fresh = await figma.getNodeByIdAsync(res.set);
  // a run a newer one took over from, or a set that would change kind, changes nothing in the library
  if (figma.root.getPluginData('to-figma-running') !== String(token)) { fresh.remove(); return { refused: 'a newer drawing began while this one was stalled; nothing was changed' }; }
  // a run its caller may have given up on (it waits nine minutes, the patch given the last four): it reports a
  // failure, so it changes nothing
  if (Date.now() - token > 300000) { fresh.remove(); return { refused: 'the drawing took too long, and its caller may have stopped waiting; nothing was changed' }; }
  if ((fresh.type === 'COMPONENT_SET') !== (target.type === 'COMPONENT_SET')) { fresh.remove(); return { refused: `the library's ${target.type === 'COMPONENT_SET' ? 'set' : 'component'} would become a ${fresh.type === 'COMPONENT_SET' ? 'set' : 'single component'}: draw it as a new component instead` }; }
  // an axis renamed, added or removed: a variant moved into a set takes the set's axes, so the change would not take
  const axes = (n) => n.type === 'COMPONENT_SET' ? Object.entries(n.componentPropertyDefinitions).filter(([, d]) => d.type === 'VARIANT').map(([k]) => k).sort().join(', ') : '';
  if (axes(fresh) !== axes(target)) { fresh.remove(); return { refused: `the variants' properties would change (${axes(target)} to ${axes(fresh)}), which Figma does not take in place: rename them in Figma first, or draw it as a new component` }; }
  // what the drawing could not draw as the contract says (a value it could not bind, copied raw over the library's
  // bound one; a layer inside an instance it could not find)
  if (res.missing.length) { fresh.remove(); return { refused: `the drawing could not draw ${res.missing.join(', ')}; nothing was changed` }; }
  patching();
  const missing = [], changed = { kept: 0, added: 0, removed: 0, layers: 0 };
  // a property's own name, Figma's id less its #suffix
  const nameOf = (k) => k.split('#')[0];
  const defsOf = (n) => n.componentPropertyDefinitions;
  // the properties made the drawing's: removed, added and given their defaults; a variant's are its values, set below
  const ids = {};
  // a slot new to the set: made with its layer below, in each variant that draws it, then given the drawing's settings
  const newSlots = [], slotMade = {};
  for (const [k, d] of Object.entries(defsOf(target))) if (d.type !== 'VARIANT' && !Object.keys(defsOf(fresh)).some((x) => nameOf(x) === nameOf(k) && defsOf(fresh)[x].type === d.type)) { if (d.type === 'SLOT') missing.push(`slot ${nameOf(k)} (removing a slot is left to Figma)`); else target.deleteComponentProperty(k); }
  for (const [k, d] of Object.entries(defsOf(fresh))) {
    if (d.type === 'VARIANT') continue;
    const was = Object.keys(defsOf(target)).find((x) => nameOf(x) === nameOf(k) && defsOf(target)[x].type === d.type);
    if (!was) { if (d.type === 'SLOT') { newSlots.push([nameOf(k), d]); continue; } ids[k] = target.addComponentProperty(nameOf(k), d.type, d.defaultValue, d.preferredValues ? { preferredValues: d.preferredValues } : undefined); continue; }
    ids[k] = was;
    if (d.type !== 'SLOT' && JSON.stringify(defsOf(target)[was].defaultValue) !== JSON.stringify(d.defaultValue)) target.editComponentProperty(was, { defaultValue: d.defaultValue });
    if (d.preferredValues && JSON.stringify(defsOf(target)[was].preferredValues) !== JSON.stringify(d.preferredValues)) target.editComponentProperty(was, { preferredValues: d.preferredValues });
  }
  const refs = (r) => (r ? Object.fromEntries(Object.entries(r).filter(([, v]) => ids[v]).map(([f, v]) => [f, ids[v]])) : null);
  // what a layer is, copied: each field Figma lets a node of its type take, in the order layout needs
  const FIELDS = ['visible', 'opacity', 'blendMode', 'isMask', 'layoutMode', 'layoutWrap', 'primaryAxisSizingMode', 'counterAxisSizingMode', 'primaryAxisAlignItems', 'counterAxisAlignItems', 'itemSpacing', 'counterAxisSpacing', 'itemReverseZIndex', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'strokesIncludedInLayout', 'minWidth', 'maxWidth', 'minHeight', 'maxHeight', 'fills', 'strokes', 'strokeWeight', 'strokeTopWeight', 'strokeRightWeight', 'strokeBottomWeight', 'strokeLeftWeight', 'strokeAlign', 'dashPattern', 'strokeCap', 'topLeftRadius', 'topRightRadius', 'bottomRightRadius', 'bottomLeftRadius', 'cornerSmoothing', 'clipsContent', 'effects', 'arcData', 'vectorPaths', 'constraints', 'isExposedInstance', 'fontName', 'fontSize', 'textAlignHorizontal', 'textAlignVertical', 'textAutoResize', 'textTruncation', 'maxLines', 'textCase', 'textDecoration', 'letterSpacing', 'lineHeight', 'paragraphSpacing', 'listSpacing'];
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const copy = async (from, to) => {
    let n = 0;
    if (from.type === 'TEXT') {
      // a text's font loaded before anything about it changes, its style before its words
      for (const f of [...(from.characters ? from.getRangeAllFontNames(0, from.characters.length) : [from.fontName]), ...(to.characters ? to.getRangeAllFontNames(0, to.characters.length) : [to.fontName])]) if (f !== figma.mixed) await figma.loadFontAsync(f);
      if (from.textStyleId !== to.textStyleId && typeof from.textStyleId === 'string' && from.textStyleId) { await to.setTextStyleIdAsync(from.textStyleId); n++; }
      if (to.characters !== from.characters) { to.characters = from.characters; n++; }
    }
    for (const f of FIELDS) {
      if (!(f in from) || !(f in to) || from[f] === figma.mixed || same(from[f], to[f])) continue;
      try { to[f] = from[f]; n++; } catch (e) { missing.push(`${to.name} ${f} (${e.message})`); }
    }
    // the size on an axis that is fixed (one that hugs or fills is its contents' or its parent's), then how each
    // axis follows its parent and its contents, which a resize had made fixed
    const fixed = (f) => !(f in from) || from[f] === 'FIXED';
    const w = fixed('layoutSizingHorizontal') ? from.width : to.width, h = fixed('layoutSizingVertical') ? from.height : to.height;
    if ((Math.abs(w - to.width) > 0.01 || Math.abs(h - to.height) > 0.01) && 'resize' in to && to.type !== 'COMPONENT_SET') { try { to.resize(w, h); n++; } catch { /* sized by its contents */ } }
    for (const f of ['layoutPositioning', 'layoutSizingHorizontal', 'layoutSizingVertical', 'primaryAxisSizingMode', 'counterAxisSizingMode', 'textAutoResize']) if (f in from && f in to && to.parent && from[f] !== to[f]) { try { to[f] = from[f]; n++; } catch { /* a parent with no auto layout */ } }
    if (to.parent && to.parent.type !== 'COMPONENT_SET' && (!('layoutMode' in to.parent) || to.parent.layoutMode === 'NONE' || to.layoutPositioning === 'ABSOLUTE') && (to.x !== from.x || to.y !== from.y)) { to.x = from.x; to.y = from.y; n++; }
    // what each field is bound to, the bound one's variable, an unbound one let go (a paint carries its own)
    const bound = (x) => Object.fromEntries(Object.entries(x.boundVariables || {}).filter(([f, v]) => !['fills', 'strokes', 'effects', 'componentProperties'].includes(f) && v && v.id));
    const bf = bound(from), bt = bound(to);
    for (const f of new Set([...Object.keys(bf), ...Object.keys(bt)])) {
      if ((bf[f] && bf[f].id) === (bt[f] && bt[f].id)) continue;
      try { to.setBoundVariable(f, bf[f] ? await figma.variables.getVariableByIdAsync(bf[f].id) : null); n++; } catch (e) { missing.push(`${to.name} ${f} (${e.message})`); }
    }
    if ('effectStyleId' in from && from.effectStyleId !== to.effectStyleId && typeof from.effectStyleId === 'string') { await to.setEffectStyleIdAsync(from.effectStyleId); n++; }
    return n;
  };
  // a layer brought over whole into the set: Figma drops a layer's links to properties as it leaves the drawing, and
  // lets one be set only inside the set, so they are read before the move and set, as the set's, after it
  const bring = (n, move) => {
    const links = [n, ...('findAll' in n ? n.findAll(() => true) : [])].map((x) => [x, x.componentPropertyReferences]).filter(([, r]) => r && Object.keys(r).length);
    move();
    for (const [x, r] of links) { try { x.componentPropertyReferences = refs(r); } catch (e) { missing.push(`${x.name}'s link (${e.message})`); } }
  };
  // a layer and what it holds made the drawing's, matched by name and number; an instance's layers are overrides,
  // never added or removed
  const patch = async (from, to, inInstance) => {
    changed.layers += await copy(from, to);
    if (to.type === 'INSTANCE') {
      const [fm, tm] = await Promise.all([from.getMainComponentAsync(), to.getMainComponentAsync()]);
      if (fm && (!tm || fm.id !== tm.id)) { to.swapComponent(fm); changed.layers++; }
      const props = Object.fromEntries(Object.entries(from.componentProperties).filter(([k, v]) => k in to.componentProperties && !same(v.value, to.componentProperties[k].value)).map(([k, v]) => [k, v.value]));
      if (Object.keys(props).length) { to.setProperties(props); changed.layers++; }
    }
    if (!inInstance && to.type !== 'COMPONENT' && !same(refs(from.componentPropertyReferences) || {}, to.componentPropertyReferences || {})) { to.componentPropertyReferences = refs(from.componentPropertyReferences) || {}; changed.layers++; }
    if (!('children' in from) || !('children' in to)) return;
    const key = (kids) => { const seen = {}; return kids.map((c) => `${c.name}#${(seen[c.name] = (seen[c.name] || 0) + 1)}`); };
    const fk = key(from.children), tk = key(to.children);
    const fromKids = [...from.children], toKids = [...to.children];
    const kept = [];
    for (const [i, c] of fromKids.entries()) {
      const j = tk.indexOf(fk[i]);
      // a layer of another type (a frame where a text was) is replaced, not reshaped
      const t = j >= 0 && toKids[j].type === c.type ? toKids[j] : null;
      if (t) { await patch(c, t, inInstance || to.type === 'INSTANCE'); kept.push(t); }
      // a new layer moved over, then linked to the set's properties, which Figma lets only a layer inside it name
      // a new slot is made in the variant, as Figma makes a slot's property with its layer; what it holds moved in
      else if (!inInstance && to.type !== 'INSTANCE' && c.type === 'SLOT') {
        let comp = to; while (comp && comp.type !== 'COMPONENT') comp = comp.parent;
        const sl = comp.createSlot(); sl.name = c.name; to.appendChild(sl);
        // each variant's createSlot makes a property of its own: the first one made stands, the others' slots are
        // linked to it and their own properties deleted, so the set has one, as a drawing's combined variants do
        const made = sl.componentPropertyReferences.slotContentId;
        if (slotMade[c.name]) { sl.componentPropertyReferences = { slotContentId: slotMade[c.name] }; target.deleteComponentProperty(made); } else slotMade[c.name] = made;
        await copy(c, sl);
        for (const kid of [...c.children]) bring(kid, () => sl.appendChild(kid));
        kept.push(sl); changed.layers++;
      }
      else if (!inInstance && to.type !== 'INSTANCE') { bring(c, () => to.appendChild(c)); kept.push(c); changed.layers++; }
    }
    if (inInstance || to.type === 'INSTANCE') return;
    for (const c of toKids) if (!kept.includes(c)) { c.remove(); changed.layers++; }
    // in the drawing's order
    for (const [i, c] of kept.entries()) if (to.children[i] !== c) to.insertChild(i, c);
  };
  // one variant each: a set's, matched by its values; a component of one variant, itself
  const vOf = (n) => JSON.stringify(Object.entries(n.variantProperties || {}).sort());
  const freshV = fresh.type === 'COMPONENT_SET' ? [...fresh.children] : [fresh];
  const targetV = target.type === 'COMPONENT_SET' ? [...target.children] : [target];
  // the set keeps the library's own layout: a variant that stays stays where it is; a new one goes in its cell of a
  // grid, after the rest in an auto layout, else in a row under them, the set grown to hold it
  const cells = new Map(freshV.map((f) => [f, [f.gridRowAnchorIndex, f.gridColumnAnchorIndex]]));
  const matched = new Set(), added = [];
  for (const f of freshV) {
    figma.root.setPluginData('to-figma-beat', String(Date.now()));
    const t = targetV.find((x) => !matched.has(x) && vOf(x) === vOf(f));
    if (t) { matched.add(t); await patch(f, t, false); changed.kept++; }
    else { added.push(f); changed.added++; }
  }
  // the new variants in before the old ones go: a set left with none is removed by Figma, and its key with it
  if (target.type === 'COMPONENT_SET') {
    const bottom = Math.max(0, ...[...matched].map((c) => c.y + c.height));
    let x = 24;
    for (const f of added) {
      const [row, col] = cells.get(f);
      const free = () => ![...matched].some((c) => c.gridRowAnchorIndex === row && c.gridColumnAnchorIndex === col);
      bring(f, () => { try { if (target.layoutMode === 'GRID' && free()) { target.appendChildAt(f, row, col); return; } } catch { /* outside the library's grid: after the rest */ } target.appendChild(f); });
      if (target.layoutMode === 'NONE') { f.x = x; f.y = bottom + 24; x += f.width + 24; }
    }
  }
  for (const [name, d] of newSlots) {
    const key = Object.keys(defsOf(target)).find((x) => nameOf(x) === name && defsOf(target)[x].type === 'SLOT');
    if (!key) { missing.push(`slot ${name} (Figma made no property for it)`); continue; }
    const edit = Object.fromEntries(['slotSettings', 'description', 'preferredValues'].filter((f) => d[f] != null && !(Array.isArray(d[f]) && !d[f].length)).map((f) => [f, d[f]]));
    if (Object.keys(edit).length) try { target.editComponentProperty(key, edit); } catch (e) { missing.push(`slot ${name}'s settings (${e.message})`); }
  }
  let orphaned = 0;
  for (const t of targetV) if (!matched.has(t)) { orphaned += (await t.getInstancesAsync()).length; t.remove(); changed.removed++; }
  if (target.type === 'COMPONENT_SET' && target.layoutMode === 'NONE' && (added.length || changed.removed)) target.resizeWithoutConstraints(Math.max(...target.children.map((c) => c.x + c.width)) + 24, Math.max(...target.children.map((c) => c.y + c.height)) + 24);
  // a drawing whose every variant was moved over is gone already, Figma removing an empty set
  if (!fresh.removed) fresh.remove();
  return { set: target.id, variants: target.type === 'COMPONENT_SET' ? target.children.length : 1, changed, orphaned, props: Object.keys(defsOf(target)), missing, layout: res.layout };
}).toString()})(__res, __target, __token, () => { __patching = true; });
  __release(); }
`;

/* In the scratch file: the drawing recorded for a component, read back as
   each variant's layers with what each is bound to (variable names, the text
   style, the component an instance is of), for verify(). */
const READBACK = async (name, id = null) => {
  await figma.loadAllPagesAsync();
  const page = figma.root.children.find((p) => p.name === name);
  const rec = page && JSON.parse(page.getPluginData('drawings') || '{"by":{}}');
  // a set patched in place is read by its own id, wherever it is
  const drawing = id ? await figma.getNodeByIdAsync(id) : rec && rec.by[name] && await figma.getNodeByIdAsync(rec.by[name]);
  if (!drawing) return { missing: `no recorded drawing of ${name}` };
  const ids = new Set(), out = [];
  const varOf = (b) => (b && b.type === 'VARIABLE_ALIAS' ? b.id : null);
  // a component of one variant is its own; a set's are inside it
  for (const comp of drawing.type === 'COMPONENT' ? [drawing] : drawing.findAll((n) => n.type === 'COMPONENT')) {
    const layers = {};
    const mains = [];
    const walk = (n, inInstance) => {
      const fill = Array.isArray(n.fills) && n.fills[0]; const stroke = Array.isArray(n.strokes) && n.strokes[0];
      const e = { type: n.type, visible: n.visible,
        fill: fill ? varOf(fill.boundVariables && fill.boundVariables.color) : null,
        stroke: stroke ? varOf(stroke.boundVariables && stroke.boundVariables.color) : null,
        radius: varOf(n.boundVariables && n.boundVariables.topLeftRadius), gap: varOf(n.boundVariables && n.boundVariables.itemSpacing),
        paddingLeft: varOf(n.boundVariables && n.boundVariables.paddingLeft), textStyleId: n.type === 'TEXT' ? n.textStyleId : null, effectStyleId: typeof n.effectStyleId === 'string' && n.effectStyleId ? n.effectStyleId : null };
      for (const k of ['fill', 'stroke', 'radius', 'gap', 'paddingLeft']) if (e[k]) ids.add(e[k]);
      if (n.type === 'INSTANCE') mains.push([e, n]);
      // an instance's own drawn colour is on its vector, inside it
      if (n.type === 'INSTANCE') { const v = n.findOne((x) => x.type === 'VECTOR'); const p = v && ((v.strokes && v.strokes[0]) || (v.fills && v.fills[0])); e.inner = p ? varOf(p.boundVariables && p.boundVariables.color) : null; if (e.inner) ids.add(e.inner); }
      layers[n === comp ? '(root)' : n.name] = e;
      if (n.type !== 'INSTANCE' && 'children' in n) for (const c of n.children) walk(c, inInstance);
    };
    walk(comp, false);
    // what an instance is of, read after the walk (dynamic-page access: asynchronously)
    for (const [e, n] of mains) { const mc = await n.getMainComponentAsync(); e.instanceOf = mc ? (mc.parent && mc.parent.type === 'COMPONENT_SET' ? mc.parent.name : mc.name) : null; }
    out.push({ variant: comp.name, layers });
  }
  const names = {};
  for (const v of await Promise.all([...ids].map((id) => figma.variables.getVariableByIdAsync(id)))) if (v) names[v.id] = v.name;
  const styles = {};
  for (const sid of new Set(out.flatMap((v) => Object.values(v.layers).map((e) => e.textStyleId).filter((x) => typeof x === 'string' && x)))) { const st = await figma.getStyleByIdAsync(sid); if (st) styles[sid] = st.name; }
  for (const sid of new Set(out.flatMap((v) => Object.values(v.layers).map((e) => e.effectStyleId).filter(Boolean)))) { const st = await figma.getStyleByIdAsync(sid); if (st) styles[sid] = st.name; }
  for (const v of out) for (const e of Object.values(v.layers)) { for (const k of ['fill', 'stroke', 'radius', 'gap', 'paddingLeft', 'inner']) if (e[k]) e[k] = names[e[k]] || e[k]; if (e.textStyleId) { e.textStyle = styles[e.textStyleId] || null; delete e.textStyleId; } if (e.effectStyleId) { e.effect = styles[e.effectStyleId] || null; delete e.effectStyleId; } }
  return { variants: out };
};

/* The drawing against the contract it was drawn from, value by value: each
   variant's layers, by name, against what the plan says they carry. The
   third side of contract (Figma's), contract (code's) and drawing. */
export function verify(p, drawn) {
  // a variant's name, its values in one order: a library may order its axes otherwise
  const byValues = (n) => String(n).split(', ').sort().join(', ');
  const rows = [];
  for (const v of p.variants) {
    // a component of one variant is drawn under the component's name, not a variant's
    const d = (drawn.variants || []).find((x) => byValues(x.variant) === byValues(v.name)) || (p.variants.length === 1 && (drawn.variants || []).length === 1 ? drawn.variants[0] : null);
    if (!d) { rows.push({ variant: v.name, what: 'the variant', verdict: 'not drawn' }); continue; }
    // the instance a part sits inside, if any: such a part is that component's own layer, drawn as an override at most
    const host = (id) => { for (let up = v.anatomy[id].parent; up && v.anatomy[up]; up = v.anatomy[up].parent) if (v.anatomy[up].kind === 'instance') return up; return null; };
    for (const [id, e] of Object.entries(v.anatomy)) {
      const inside = host(id);
      if (inside) {
        const at = d.layers[v.anatomy[inside].name];
        if (e.kind === 'graphic' && e.background && at) rows.push({ variant: v.name, what: `${e.name} colour`, want: e.background, got: at.inner || null, verdict: e.background === at.inner ? 'same' : at.inner ? 'differs' : 'not bound' });
        continue;
      }
      const layer = d.layers[id === 'root' ? '(root)' : e.name];
      if (!layer) { rows.push({ variant: v.name, what: e.name, verdict: 'not drawn' }); continue; }
      const checks = [];
      const tok = (t) => (typeof t === 'string' && t.includes('/') ? t : null);
      if (e.kind === 'text') checks.push(['text style', e.typography, layer.textStyle], ['colour', e.color, layer.fill]);
      if (e.kind === 'graphic') checks.push(['colour', e.background, layer.inner || layer.fill]);
      if (e.kind === 'instance') checks.push(['component', e.component, layer.instanceOf]);
      if (e.kind === 'container') {
        checks.push(['fill', e.background, layer.fill], ['radius', tok(e.radius), layer.radius], ['border', tok(e.border && e.border.color), layer.stroke], ['shadow', e.shadow && !/\(/.test(e.shadow) ? e.shadow : null, layer.effect]);
        if (e.layout) checks.push(['gap', tok(e.layout.gap), layer.gap], ['padding', tok(e.layout.padding && e.layout.padding.start), layer.paddingLeft]);
      }
      // only what the contract names: a value it does not give is nothing to check
      // a component by its name or, as a swap names it, its last name ("check" for Icon/check)
      const is = (what, want, got) => want === got || (what === 'component' && typeof got === 'string' && want.split('/').pop() === got);
      for (const [what, want, got] of checks) if (want) rows.push({ variant: v.name, what: `${e.name} ${what}`, want, got: got || null, verdict: is(what, want, got) ? 'same' : got ? 'differs' : 'not bound' });
    }
  }
  return rows;
}

/* verify's record, `<report>.drawn.json`: written when its rows changed, else
   left as it is, so a run that found what the last one found changes no file. */
export function writeDrawn(out, rows) {
  try { if (JSON.stringify(JSON.parse(fs.readFileSync(out, 'utf8')).rows) === JSON.stringify(rows)) return false; } catch { /* none yet, or unreadable: write it */ }
  fs.writeFileSync(out, JSON.stringify({ at: new Date().toISOString(), rows }, null, 2) + '\n');
  return true;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === realpathSync(process.argv[1])) {
  const argv = process.argv.slice(2);
  const opt = (k) => { const i = argv.indexOf(k); return i >= 0 ? argv.splice(i, 2)[1] : null; };
  let run = argv.includes('--run'); if (run) argv.splice(argv.indexOf('--run'), 1);
  const check = argv.includes('--verify'); if (check) argv.splice(argv.indexOf('--verify'), 1);
  const label = opt('--project'), into = opt('--into');
  // the component set to update in place, by its node id in the file `into` names (the library's, for the editor)
  const target = opt('--patch');
  // the contract the update was made from: the library's component, read live, must still be it
  const baseFile = opt('--base');
  if (target && !check) run = true;
  const [report, keysFile] = argv;
  if (!report || (!run && !check && !keysFile) || ((run || check) && (!label || !into))) { console.error('usage: to-figma.mjs <from-code report> <keys.json>            prints the plugin code\n       to-figma.mjs <from-code report> --run --project <label> --into <scratch fileKey>   draws it through the project\'s docs service\n       to-figma.mjs <contract> --patch <set id> [--base <contract>] --project <label> --into <fileKey>   updates that component set in place, refused where the set is no longer the base\n       to-figma.mjs <contract> --verify --project <label> --into <scratch fileKey> [--patch <set id>]   reads the drawing back and holds it to the contract'); process.exit(2); }
  const r = JSON.parse(fs.readFileSync(report, 'utf8'));
  const c = r.asFigma || r;
  // with no project, the house's own axis order (audit-defaults, derived as for a library)
  const house = () => req('../snapshot/projects.cjs').flatSettings(JSON.parse(fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), '../../standards/audit-settings.json'), 'utf8'))['audit-defaults'], {});
  if (!run && !check) { process.stdout.write(pluginCode(c, JSON.parse(fs.readFileSync(keysFile, 'utf8')), { axisOrder: house().axisOrder || [], sizeAxis: house().sizeAxis || null })); process.exit(0); }
  // through the project's own docs service, which holds the Figma bridge
  const contractRouter = req('../snapshot/projects.cjs');
  const TOOLKIT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
  const where = contractRouter.layout(null, label);
  if (where.error) { console.error(where.error); process.exit(2); }
  const { serviceFor, figmaExec } = await import('../figma-audit/services.mjs');
  const svc = serviceFor(where.audit);
  if (!svc) { console.error(`${label}: no docs service running for ${where.audit}`); process.exit(2); }
  const exec = (code, fileKey, timeout) => figmaExec(svc, fileKey, code, timeout);
  // the library the drawing takes its components, styles and variables from, as every tool chooses it (libraryOf)
  const { libraryOf } = await import('../parity/project.mjs');
  const { libKey, lib } = libraryOf(label);
  // the library's Icon container (its `draw`) and the mode its code is compared in (its code.parity's one tier), where
  // its context document says; without them, the lookups below find them, and a value is its collection's first mode's
  const map = { draw: lib.draw, mode: lib.code && lib.code.parity && lib.code.parity.tiers && lib.code.parity.tiers[0] };
  // the house's axis order, as that library's settings derive it (figma-standard rule 1)
  const axisOrder = (lib.tokens || {}).axisOrder || [];
  const sizeAxis = (lib.tokens || {}).sizeAxis || null;
  const p = plan(c, { axisOrder }), want = needs(p);
  if (check) {
    // the drawing read back and held to the contract it was drawn from; with the code contract held to
    // Figma's by from-code.mjs, that is all three sides
    const drawn = await exec(`return (${READBACK.toString()})(${JSON.stringify(p.name)}, ${JSON.stringify(target)});`, into, 60000);
    if (drawn.missing) { console.error(drawn.missing); process.exit(1); }
    const rows = verify(p, drawn);
    const n = (v) => rows.filter((r) => r.verdict === v).length;
    const out = path.join(path.dirname(report), `${path.basename(report, '.json')}.drawn.json`);
    const wrote = writeDrawn(out, rows);
    console.log(`${p.name} as drawn, against its contract: ${n('same')} the same, ${n('not bound')} not bound, ${n('differs')} differ, ${n('not drawn')} not drawn (${rows.length}) — ${path.relative(process.cwd(), out)}${wrote ? '' : ' (unchanged)'}`);
    // not bound is a failure too: a drawing is held to its contract, and a value it could not bind is not held
    process.exit(n('differs') + n('not drawn') + n('not bound') ? 1 : 0);
  }
  // a text style's key from the snapshot (plugin 0.51.0 on); the rest looked up where the library uses them
  const stored = JSON.parse(fs.readFileSync(where.paths.tokens, 'utf8')).textStyles || [];
  const keys = { styles: Object.fromEntries(stored.filter((x) => x.key && want.styles.includes(x.name)).map((x) => [x.name, x.key])), icons: {}, iconContainer: null };
  const missing = { styles: want.styles.filter((n) => !keys.styles[n]), icons: want.icons, container: (map.draw && map.draw.iconContainer) || null, vars: want.vars, components: want.components };
  const tl = Date.now();
  // a variable's key from the snapshot (plugin 0.52.0 on); else looked up in the library file below
  keys.vars = {};
  for (const col of Object.values(JSON.parse(fs.readFileSync(where.paths.tokens, 'utf8')).collections || {})) for (const [n, k] of Object.entries(col.keys || {})) if (want.vars.includes(n) && !keys.vars[n]) keys.vars[n] = k;
  missing.vars = want.vars.filter((n) => !keys.vars[n]);
  // each token's own value, drawn where its variable cannot be bound
  const { valueOf } = req('../snapshot/tokens.cjs');
  const tokenFile = JSON.parse(fs.readFileSync(where.paths.tokens, 'utf8'));
  // an effect style's key from the snapshot, which has always recorded it
  keys.effects = Object.fromEntries((tokenFile.effects || []).filter((fx) => fx.key && want.effects.includes(fx.name)).map((fx) => [fx.name, fx.key]));
  keys.values = Object.fromEntries(want.vars.map((n) => [n, valueOf(tokenFile, n, map.mode)]).filter(([, v]) => v != null));
  // each component's variants as the snapshot met them (an instance's `instanceOfKey`): no library file needs to be open
  keys.variants = variantKeys(where.paths.components, want.components, want.swaps);
  const notOpen = [];
  if (libKey) {
    // the rest where the library uses them, in the library file itself, which must be open with the Desktop Bridge
    const found = await exec(`return (${LOOKUP.toString()})(${JSON.stringify(missing)});`, libKey, 60000).catch((e) => { notOpen.push(`the library file (${libKey}) is not open with the Desktop Bridge, so only what the snapshot names was found: ${e.message.split('\n')[0]}`); return null; });
    if (found) { Object.assign(keys.styles, found.styles); keys.icons = found.icons; keys.iconContainer = found.iconContainer; Object.assign(keys.vars, found.vars); keys.sets = found.sets; }
  }
  // a variable the library hides from publishing cannot be imported here: its name, said with why it is not bound
  const hidden = new Set(Object.values(tokenFile.collections || {}).flatMap((col) => col.hidden || []));
  const looked = Math.round((Date.now() - tl) / 1000);
  if (process.env.DEBUG) console.error('keys', JSON.stringify(keys));
  if (target && baseFile) {
    // the library's component as it is now, read by the snapshot's own walk (the shape the snapshot stores) and its
    // contract derived as the snapshot derives it: a draft made before someone changed the component would undo
    // their change. The last snapshot is not enough, being only as new as whoever last took one
    const walk = fs.readFileSync(path.join(TOOLKIT, 'plugins/design-system-snapshot/code.js'), 'utf8');
    const live = await exec(`const SCOPE = ${JSON.stringify([target])};\n${walk}\nreturn __headless();`, into, 120000);
    const comp = live && (live.components || []).find((x) => x.id === target);
    if (!comp) { console.error(`refused: ${target} could not be read from the library; nothing was changed`); process.exit(1); }
    const { compact } = req('../snapshot/spec.cjs');
    const { derive } = req('./derive.cjs');
    let index = {};
    try { index = JSON.parse(fs.readFileSync(where.paths.index, 'utf8')).components || {}; } catch { /* no index: only its own name is known */ }
    const entry = Object.values(index).find((x) => x.name === comp.name) || {};
    const spec = entry.platform ? { ...compact(comp), platform: entry.platform } : compact(comp);
    const now = derive(spec, [...Object.values(index).map((x) => x.name), comp.name], contractRouter.deriveOptions(contractRouter.auditContext(where.doc), into));
    if (process.env.DEBUG) console.error('live', JSON.stringify(now));
    const sorted = (x) => (Array.isArray(x) ? x.map(sorted) : x && typeof x === 'object' ? Object.fromEntries(Object.keys(x).sort().map((k) => [k, sorted(x[k])])) : x);
    if (JSON.stringify(sorted(now)) !== JSON.stringify(sorted(JSON.parse(fs.readFileSync(baseFile, 'utf8'))))) {
      // a snapshot whose contracts an older toolkit derived differs from any read now, changed or not: said so, as
      // opening it again from the library would bring the same old contract back
      const folder = Object.keys(index).find((k) => index[k].name === comp.name);
      const read = (f) => { try { return JSON.parse(fs.readFileSync(path.join(where.paths.components, folder, f), 'utf8')); } catch { return null; } };
      const stored = folder && read('figma.json'), kept = folder && read('contract.json');
      const older = stored && kept && JSON.stringify(sorted(derive(stored, Object.values(index).map((x) => x.name), contractRouter.deriveOptions(contractRouter.auditContext(where.doc), into)))) !== JSON.stringify(sorted(kept));
      console.error(older ? `refused: ${comp.name}'s snapshot is older than the toolkit's contracts, so it cannot be told whether the library changed; take a snapshot, then open it again and make the change; nothing was changed` : `refused: ${comp.name} has changed in the library since this draft was made; nothing was changed`);
      process.exit(1);
    }
  }
  const t0 = Date.now();
  // importing the library's variables is most of a drawing's time: two minutes allowed
  // the plugin runs a long execution only while a message is in flight: with none, it sat at one call
  // for a minute, and advanced only while another call ran. A no-op every 2 s keeps it going
  let drawing = true;
  const awake = (async () => { while (drawing) { await exec('return 1', into, 5000).catch(() => {}); await new Promise((r) => setTimeout(r, 2000)); } })();
  const code = target ? pluginCode(c, keys, { before: PATCH_BEFORE(target), after: PATCH_AFTER, failed: PATCH_FAILED, axisOrder, sizeAxis }) : pluginCode(c, keys, { before: BEFORE(p.name), after: AFTER(p.name), failed: FAILED, axisOrder, sizeAxis });
  // an update in place given longer than a drawing: one that times out here may still be changing the library
  const res = await exec(code, into, target ? 540000 : 120000).catch((e) => {
    if (!target) throw e;
    console.error(`failed: ${e.message.split('\n')[0]}${/version history/.test(e.message) ? '' : `; the library set may have been changed partway: restore the version named Before the contract editor updated ${p.name} from the version history`}`);
    process.exit(1);
  }).finally(() => { drawing = false; });
  await awake;
  if (res && res.refused) { console.error(`refused: ${res.refused}`); process.exit(1); }
  for (const x of notOpen) console.log(`note: ${x}`);
  if (target) {
    const ch = res.changed;
    console.log(`${p.name} updated in place (${res.set}): ${ch.kept} variant(s) kept, ${ch.added} added, ${ch.removed} removed${res.orphaned ? ` (${res.orphaned} instance(s) in this file used a removed one)` : ''}, ${ch.layers} change(s) to layers; props ${res.props.map((k) => k.split('#')[0]).join(', ')}; ${res.missing.length ? `not bound or not changed: ${res.missing.join(', ')}` : 'every value bound'}; in ${Math.round((Date.now() - t0) / 1000)}s`);
    process.exit(0);
  }
  console.log(`${p.name}: ${res.variants} variants into ${into}, laid out ${res.layout}, props ${res.props.join(', ')}; ${res.missing.length ? `not bound: ${res.missing.map((n) => (hidden.has(n) ? `${n} (hidden from publishing in the library: choose a published token)` : n)).join(', ')}` : 'every value bound'}; keys looked up: ${Object.keys(keys.vars || {}).length} variable(s), ${Object.keys(keys.styles).length} style(s), ${Object.keys(keys.icons).length} icon(s)${keys.iconContainer ? ', the icon container' : ''} in ${looked}s; drawn in ${Math.round((Date.now() - t0) / 1000)}s`);
}
