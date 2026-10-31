#!/usr/bin/env node
/*
 * tools/component-contract/from-code.mjs — a component's contract read from code: the
 * same shape derive.cjs reads from Figma (contract 1), so a reader of
 * contracts cannot tell, and need not ask, where one came from.
 *
 *   node tools/component-contract/from-code.mjs --project <label> <component> [--rebuild] [--code-only]
 *
 * The component is one the project's parity mappings name, governed or
 * compared (tools/parity loadParity): rendered on its own host (a Storybook,
 * a site's fragments) through the engine's session (openSource, below), and
 *
 *   props     the story's controls: an enum where it lists options, a boolean,
 *             a string or a number where its control or source type is one;
 *             the default the component declares, else the story's own arg;
 *             required where the source says so;
 *             a slot where it takes content (a ReactNode, a snippet, an
 *             element the story starts it with): a stand-in word is put in
 *             it, and the element the word lands in is the slot
 *   anatomy   the rendered tree at the defaults, one element per DOM element
 *             (an svg is one graphic), named by the stored layer it is
 *             (data-figma-id), else the framework's slot class (its profile's
 *             partClass) or by tag, numbered when repeated
 *   values    each computed style matched to the token holding that value,
 *             among the tokens of its kind (a background among Background
 *             colours); where several hold it, the one the library's
 *             contracts use most, and the tie is reported; no token, the value
 *   variants  each prop value rendered with the rest at their defaults, and
 *             what it changes against the default render
 *
 * Self-checked as derive.cjs is: expand() rebuilds every render it saw.
 * Then compared with the contract derived from Figma, element by element
 * through the parity map's selectors: the trial's question is whether the
 * two describe the same component in the same words.
 *
 * Writes <project home>/parity/from-code/<component>.json. The contract editor's
 * Pull from code runs it, on any project the parity engine reads. Not read:
 * pointer states, and sizes a layout resolves (hug, fill).
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { forField, usedGroups } from '../contract-editor/anatomy.mjs';
import { parseColour, weightName, insetStroke } from '../parity/values.mjs';
import { camel, sentence } from './layers.mjs';
import { variantValues } from '../shared/names.js';
import { compareNames, writeReport } from '../shared/output.mjs';
import { cssName } from '../tokens/names.mjs';

import { realpathSync } from 'node:fs';
const TOOLKIT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const req = createRequire(import.meta.url);
const { expand, variantDefaults } = req('./derive.cjs');

/* ---- pure parts ---- */

/* A prop that takes content a caller passes: a ReactNode or element, a Svelte snippet, a Vue or Angular template,
   as the docgen says its type, or an element the story starts it with; a host with no docgen states it (controls
   `type: 'slot'`). Its stand-in is a word no
   component draws, so the element it lands in is found by it. */
export const isSlot = (a) => a.control === 'slot' || a.element || /\b(ReactNode|ReactElement|JSX\.Element|Snippet|VNode|TemplateRef|slot)\b/.test(String(a.summary || ''));
export const slotMark = (code) => `slot·${code}·here`;

const sameColour = (a, b) => { const x = parseColour(a), y = parseColour(b); return !!x && !!y && x.slice(0, 3).every((v, i) => Math.abs(v - y[i]) <= 1) && Math.abs(x[3] - y[3]) <= 0.01; };

/* The fields of a part each kind of value fills, as the contract editor names
   them (tools/contract-editor/anatomy.mjs), whose `forField` says which tokens
   a field offers: Figma's own scopes where the snapshot recorded them, else
   the groups the library's contracts use for that field. */
/* A corner as the walk reads it: its radius in pixels, and whether it asks
   for a full round. A percentage is of the box (50% rounds a square fully),
   never pixels; a length rounder than the box's longest side is full too.
   Run in the page, so it names nothing outside itself. */
export function cornerOf(css, w, h) {
  const px = (v) => +(+parseFloat(v) || 0).toFixed(2);
  const pct = /%$/.test(css) ? parseFloat(css) : null;
  const radius = pct === null ? px(css) : px((pct / 100) * Math.min(w, h));
  return { radius, ...((pct === null ? radius * 2 > Math.max(w, h) : pct >= 50) && { full: true }) };
}

const FIELDS = { background: ['background'], text: ['color'], icon: ['fill'], stroke: ['stroke'], space: ['gap', 'padding'], radius: ['radius'], width: ['strokeWidth'], fontSize: ['fontSize'] };

/* A library's tokens in one mode, each with the fields Figma scopes it to where
   the snapshot recorded them, and its collection: the rows designTokenFor reads. */
export function tokenTable(snapshot, mode) {
  const rows = [];
  for (const c of Object.values((snapshot && snapshot.collections) || {})) {
    const md = (c.modes || []).find((x) => x.toLowerCase() === String(mode || '').toLowerCase()) || (c.modes || [])[0];
    for (const [k, v] of Object.entries((c.values || {})[md] || {})) rows.push([k, v, c.scopes && c.scopes[k], c.name]);
  }
  return rows;
}

/* Which tokens each field offers, for a library: forField over its contracts'
   own groups; null for a field nothing says anything of (no scopes recorded,
   and the library sets it nowhere), so it narrows nothing. */
export function offerFor(contracts) {
  const groups = usedGroups(contracts);
  return (field, list) => (list.some((t) => t.scopes) || (groups[field] || []).length ? forField(list, groups[field], field) : null);
}

/* Which token holds a value: among the tokens the field offers (`offered`,
   offerFor; a field nothing is known of names none; no `offered`, every
   token), the one the code wrote it with (`vars`, the custom properties its
   value came through, authoredVars), else the one the library's contracts
   use most; `tie` lists the rest that hold it too, and `more` says several
   held it, so the code's own words are worth reading. */
export function designTokenFor(kind, value, table, usage, under = null, judge = null, offered = null, vars = null) {
  const colour = ['background', 'text', 'icon', 'stroke'].includes(kind);
  const list = table.map(([name, v, scopes]) => ({ name, value: v, ...(scopes && { scopes }) }));
  // the tokens the kind's fields offer. Where nothing is known of them (no scopes recorded, and the library
  // sets them nowhere) no token is named: a guess among every token of the same number is a wrong name
  // said with confidence (toolkit-standard §D 15). Without `offered` at all, every token is a candidate.
  const known = offered ? (FIELDS[kind] || []).map((f) => offered(f, list)).filter(Boolean) : null;
  if (known && !known.length) return { value };
  const allowed = new Set((known ? known.flat() : list).map((t) => t.name));
  const own = table.filter(([name]) => allowed.has(name));
  let hits = own.filter(([, v]) => (colour ? sameColour(v, value) : typeof v === 'number' && +v === +value));
  // none exact: a translucent token that draws this colour over what is behind it
  if (!hits.length && colour && under && judge) hits = own.filter(([, v]) => typeof v === 'string' && judge({ color: v }, value, under) === 'looks-same');
  if (!hits.length) return { value };
  if (hits.length > 1 && vars && vars.length) {
    // the outermost name first: the token the code wrote, before the primitive it aliases
    for (const v of vars) { const said = hits.find((h) => writtenAs(v, h[0], h[3])); if (said) return { token: said[0] }; }
  }
  hits.sort((a, b) => (usage[b[0]] || 0) - (usage[a[0]] || 0) || compareNames(a[0], b[0]));
  const top = usage[hits[0][0]] || 0;
  const tie = hits.slice(1).filter(([n]) => (usage[n] || 0) === top).map(([n]) => n);
  return { token: hits[0][0], ...(tie.length && { tie }), ...(hits.length > 1 && { more: true }) };
}

/* Whether a custom property is a token's: the name the toolkit's own code
   gives it (tools/tokens/names.mjs cssName), or one that ends in the token's
   words (`--ds-color-background-primary` for Color/Background/Primary). */
const fold = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, '');
export function writtenAs(custom, token, collection = '') {
  if (custom === cssName(collection || '', token)) return true;
  const t = fold(token);
  return t.length > 2 && fold(custom).endsWith(t);
}

export function styleFor(t, styles, usage) {
  const hits = styles.filter((s) => s.size === t.size && Math.abs(s.size * s.lineHeight - t.lineHeight) < 0.6 && String(s.weight).replace(/\s/g, '').toLowerCase() === t.weight);
  if (!hits.length) return { value: `${t.size}/${t.lineHeight} ${t.weight}` };
  hits.sort((a, b) => (usage[b.name] || 0) - (usage[a.name] || 0) || compareNames(a.name, b.name));
  const top = usage[hits[0].name] || 0;
  const tie = hits.slice(1).filter((s) => (usage[s.name] || 0) === top).map((s) => s.name);
  return { token: hits[0].name, ...(tie.length && { tie }) };
}

/* How often each token and text style is named across a library's contracts. */
export function usageIn(contracts) {
  const n = {};
  const visit = (v) => { if (typeof v === 'string') n[v] = (n[v] || 0) + 1; else if (v && typeof v === 'object') Object.values(v).forEach(visit); };
  for (const c of contracts) { visit(c.anatomy); visit(c.variants); }
  return n;
}

/* What a render changes against the default one, as a variant layer's set/add/remove. */
export function delta(base, other) {
  const set = {}, add = {}, remove = [];
  for (const [id, e] of Object.entries(other)) {
    if (!base[id]) { add[id] = e; continue; }
    for (const k of new Set([...Object.keys(base[id]), ...Object.keys(e)])) if (JSON.stringify(base[id][k]) !== JSON.stringify(e[k])) set[`${id}.${k}`] = e[k];
  }
  for (const id of Object.keys(base)) if (!other[id]) remove.push(id);
  return { ...(Object.keys(set).length && { set }), ...(Object.keys(add).length && { add }), ...(remove.length && { remove }) };
}

/* The code's contract in the house's Figma conventions (figma-standard), so
   that it reads as the one derive.cjs would read from a Figma component:
   - an enum's values and name take the token vocabulary (figma-standard rule 22): where each
     value's tokens share one path segment no other value's do (Danger, Info,
     Neutral), that segment is the value, and the segment the most of them
     share just before it the prop (Feedback). Not where that segment is a
     token's leaf (primary, secondary: an emphasis, never a category), and
     not otherwise: the code's words stay;
   - names in sentence case (figma-standard rule 18): showAvatar → Show avatar;
   - a swap that can show nothing is a boolean that shows the element and,
     beside it, the swap (figma-standard rule 5);
   - props first, then the axes in the order the house settings give (axisOrder, figma-standard rule 1).
   `renamed` lists every change, so a reader can see what the code said. */
export function asFigma(contract, { axisOrder = [] } = {}) {
  const renamed = [];
  const props = {}, valueMap = {};
  const tokensOf = (anatomy) => Object.values(anatomy).flatMap((e) => [e.background, e.color].filter((t) => typeof t === 'string' && t.includes('/')));
  for (const [k, p] of Object.entries(contract.props)) {
    if (p.type === 'enum' && p.role !== 'interaction') {
      // each value's tokens: the default's from the anatomy, the others' from what their layer sets
      const of = (v) => (v === p.default ? tokensOf(contract.anatomy) : contract.variants.filter((x) => Object.keys(x.when).length === 1 && x.when[k] === v).flatMap((x) => Object.values(x.set || {}).filter((t) => typeof t === 'string' && t.includes('/'))));
      const segs = Object.fromEntries(p.values.map((v) => [v, of(v)]));
      const common = Object.fromEntries(p.values.map((v) => [v, segs[v].length ? segs[v].map((t) => new Set(t.split('/'))).reduce((a, b) => new Set([...a].filter((x) => b.has(x)))) : new Set()]));
      const own = Object.fromEntries(p.values.map((v) => [v, [...common[v]].filter((x) => p.values.filter((u) => u !== v).every((u) => !common[u].has(x)))]));
      // a value that is a token's leaf is an emphasis (primary, secondary), not a vocabulary word:
      // Brand/primary against Brand/secondary names no category, and the code's words stay
      const leaf = p.values.some((v) => segs[v].some((t) => t.split('/').at(-1) === own[v][0]));
      if (p.values.every((v) => own[v].length === 1) && !leaf) {
        const before = {};
        for (const v of p.values) for (const t of segs[v]) { const parts = t.split('/'); const i = parts.indexOf(own[v][0]); if (i > 0) before[parts[i - 1]] = (before[parts[i - 1]] || 0) + 1; }
        const name = Object.entries(before).sort((a, b) => b[1] - a[1])[0]?.[0] || sentence(k);
        valueMap[k] = Object.fromEntries(p.values.map((v) => [v, own[v][0].toLowerCase()]));
        for (const v of p.values) if (valueMap[k][v] !== v) renamed.push(`${k} ${v} → ${name} ${valueMap[k][v]}`);
        const key = name[0].toLowerCase() + name.slice(1).replace(/\s+(.)/g, (_, c) => c.toUpperCase());
        if (key !== k) renamed.push(`${k} → ${name}`);
        props[key] = { type: 'enum', values: p.values.map((v) => valueMap[k][v]), default: valueMap[k][p.default], figma: name, code: p.code };
        valueMap[k].__key = key;
        continue;
      }
    }
    if (p.type === 'swap' && p.shows) {
      const shown = sentence(p.shows[0].split('/').pop());
      const bkey = shown[0].toLowerCase() + shown.slice(1).replace(/\s+(.)/g, (_, c) => c.toUpperCase());
      props[bkey] = { type: 'boolean', default: !/^(none|)$/i.test(p.default), figma: shown, shows: p.shows, code: p.code };
      props[`${bkey}Swap`] = { type: 'swap', default: p.default, figma: `${shown} swap`, code: p.code };
      renamed.push(`${k} → ${shown} (boolean) + ${shown} swap`);
      valueMap[k] = { __key: bkey, __swap: true };
      continue;
    }
    const name = sentence(k);
    props[k] = { ...p, figma: name };
  }
  // figma-standard rule 1's order: props and booleans, then the axes the house orders (audit-settings
  // axisOrder, by the contract's own spelling of them), then the rest of the enums
  const AXES = axisOrder.map(camel);
  const rank = ([k, p]) => (p.type !== 'enum' ? -1 : AXES.includes(k) ? AXES.indexOf(k) : AXES.length);
  const ordered = Object.fromEntries(Object.entries(props).map((e, i) => [e, i]).sort((a, b) => rank(a[0]) - rank(b[0]) || a[1] - b[1]).map(([e]) => e));
  const variants = contract.variants.map((x) => {
    const when = {};
    for (const [k, v] of Object.entries(x.when)) {
      const m = valueMap[k];
      if (m && m.__swap) when[m.__key] = !/^(none|)$/i.test(v);
      else if (m) when[m.__key] = m[v];
      else when[k] = v;
    }
    return { ...x, when };
  });
  return { contract: { ...contract, props: ordered, variants }, renamed };
}

/* ---- where the code is opened ---- */

/*
 * A component's code, opened the one way for every project (tools/parity:
 * loadParity, then the engine's session and its host), whoever governs it.
 * What the run below asks of it:
 *
 *   render(args, state)  the component on screen with those args, a pointer
 *                        state forced where one is asked; `container` holds it
 *   api()                the code's own props: { args, argTypes } — a story's
 *                        controls, or, where the host declares none, the
 *                        mapping's `controls`
 *   root, pseudoOf       where it starts, and each pointer state: its pseudo class and the element it is forced on
 *   elements(figma)      each Figma element the mapping (or the rule) places, by selector
 *   joins(figma, argTypes)  which code prop does each Figma prop's job
 *   argsOf(when)         the args that draw a combination of Figma's props
 *
 * A library built elsewhere is compared: its mapping is sparse and joined by
 * rule (tools/parity/external.mjs). A repo whose code follows the design is
 * governed: its mapping states every variant's args, so a combination's args
 * are read off it and nothing is guessed.
 */
/* A pointer state forced where the mapping says that state is taken (`on`, a selector in the page), then
   held until its transitions have run: what both kinds of source do after a render. */
async function forceAt(tab, at) {
  if (!at || !at.on) return;
  const { forceState, waitFor } = await import('../shared/cdp.mjs');
  await forceState(tab, [{ selector: at.on, pseudo: at.pseudo }]);
  await waitFor(tab, 'document.getAnimations().every((a) => a.playState !== "running" || a.effect?.getTiming().iterations === Infinity)', { timeout: 3000 }).catch(() => {});
}

async function openSource(label, name, { rebuild, codeOnly }) {
  const { loadParity } = await import('../parity/project.mjs');
  const project = await loadParity(label);
  if (codeOnly && project.mode !== 'compared') throw Object.assign(new Error(`${label}: its code is built from the design (governed), so it has no component of its own to read`), { usage: true });
  if (codeOnly) return codeOnlySource(label, name, rebuild);
  if (project.mode === 'compared') return comparedSource(label, name, rebuild);
  return governedSource(project, name);
}

/* A component the code has and Figma does not: its story found by its name
   in their Storybook, read from its root, with nothing to pair it with. */
async function codeOnlySource(label, name, rebuild) {
  const X = await import('../parity/external.mjs');
  const L = await X.openLibrary(label, { rebuild });
  const story = X.storyIndex(L.out).stories.get(X.storyKey(name));
  if (!story) { L.close(); throw Object.assign(new Error(`${name}: no story for it in ${label}'s Storybook`), { usage: true }); }
  const src = {
    label, tab: L.tab, lib: L.lib, repo: L.repo, out: L.dir, mode: L.map.mode, tokens: L.tokens, value: L.value, textStyle: L.textStyle,
    components: L.where.paths.components, story, container: '#storybook-root', m: { story }, pseudoOf: {}, root: null, codeOnly: true,
    instanceOf: (fw) => (L.map.rootClass ? L.map.rootClass.replace('{Name}', fw) : null),
    instancePattern: L.map.rootClass ? (await import('../parity/pair.mjs')).rootPattern(L.map.rootClass) : null,
    async render(all) { const { __state, ...args } = all; await L.show(story, args, src.m); },
    api: () => L.page.api(L.tab),
    // the story's own first element: what it draws is the component
    elements: async () => ({ root: { selector: '#storybook-root > *' } }),
    close: () => L.close(),
  };
  return src;
}

async function comparedSource(label, name, rebuild) {
  const X = await import('../parity/external.mjs');
  const L = await X.openLibrary(label, { rebuild });
  const m0 = L.map.components[name];
  if (!m0) { L.close(); throw Object.assign(new Error(`${name}: not in ${label}'s parity mappings`), { usage: true }); }
  const src = {
    label, tab: L.tab, lib: L.lib, repo: L.repo, out: L.dir, mode: L.map.mode, tokens: L.tokens, value: L.value, textStyle: L.textStyle,
    components: L.where.paths.components, story: m0.story, container: '#storybook-root', m: m0, pseudoOf: {}, root: null,
    // the framework's own root class for a component, where the library names its framework (audit-defaults frameworks)
    instanceOf: (fw) => (L.map.rootClass ? L.map.rootClass.replace('{Name}', fw) : null),
    instancePattern: L.map.rootClass ? (await import('../parity/pair.mjs')).rootPattern(L.map.rootClass) : null,
    async render(all) {
      const { __state, ...args } = all;
      await L.show(src.story, args, src.m);
      await forceAt(L.tab, src.pseudoOf[__state]);
    },
    api: () => L.page.api(L.tab),
    async elements(figma) { return (await X.pairedElements(L.tab, L.show, figma, src.m, L.value, L.textStyle, false, undefined, undefined, L.lib.frameworkProfile.instance || null)).elements; },
    joins(figma, argTypes) { const side = X.propsSide(L.repo, L.lib, figma, src.m, argTypes); return side; },
    argsOf(all, m) { return X.argsFor(all, m).args; },
    close: () => L.close(),
  };
  return src;
}

/*
 * A governed mapping as from-code reads it, with nothing opened: `t` is the
 * engine's target (tools/parity/project.mjs: its mapping, and each Figma
 * variant's expanded args, pseudo state and the element that takes it), `b`
 * the component's bridge (derive.cjs). Each Figma combination draws the
 * variant the mapping expands for it; a Figma prop's code prop is the arg
 * that moves when that prop alone moves; a mapped layer is the contract
 * element its stored path is; a pointer state is forced where its option
 * says (`on`), else where the mapping's `state` says. Tested by
 * test-from-code.mjs.
 */
export function governedReading(t, b, { stateAxis = null, container = '' } = {}) {
  const at = (sel) => (sel ? `${container} ${sel}`.trim() : null);
  const names = [...t.variants.keys()];
  const optionsOf = variantValues;
  const propOf = Object.fromEntries(Object.entries(b.props).map(([id, p]) => [p.figma, id]));
  const valueIn = (id, option) => { const v = Object.entries(b.props[id].values || {}).find(([, o]) => o === option); return v ? v[0] : String(option).toLowerCase(); };
  const whenOf = (n) => Object.fromEntries(Object.entries(optionsOf(n)).filter(([p]) => propOf[p]).map(([p, o]) => [propOf[p], valueIn(propOf[p], o)]));
  const variantFor = (when) => names.find((n) => { const w = whenOf(n); return Object.keys(w).every((k) => k in when && String(w[k]) === String(when[k])); });
  const stateId = stateAxis && propOf[stateAxis];
  const pseudoOf = {};
  for (const [n, v] of t.variants) if (v.pseudo && stateId) { const w = whenOf(n); if (w[stateId] && !pseudoOf[w[stateId]]) pseudoOf[w[stateId]] = { pseudo: v.pseudo, on: at(v.on || t.mapping.state || t.mapping.root) }; }
  return {
    pseudoOf,
    argsOf(all) { const v = t.variants.get(variantFor(all)); return v ? { ...(t.mapping.sample || {}), ...v.args } : null; },
    joins(figma, defaults) {
      const base = t.variants.get(variantFor(defaults)) || { args: {} };
      const map = { props: {}, twice: {} };
      for (const [k, p] of Object.entries(figma.props)) {
        if (p.role === 'interaction') continue;
        for (const v of p.type === 'enum' ? p.values : p.type === 'boolean' ? [true, false] : []) {
          const r = t.variants.get(variantFor({ ...defaults, [k]: v }));
          if (!r) continue;
          // an arg set, changed or left unset (back to the code's own default) between the two
          for (const arg of new Set([...Object.keys(r.args || {}), ...Object.keys(base.args || {})])) {
            const x = (r.args || {})[arg];
            if (JSON.stringify(x) === JSON.stringify(base.args[arg])) continue;
            const e = (map.props[k] = map.props[k] || { arg, values: {} });
            // left unset is recorded as unset: that option draws at the code's own default
            if (e.arg === arg) e.values[String(v)] = x;
            // a prop is one code prop: a second arg it moves is said, never dropped in silence
            else if (!(map.twice[k] || []).includes(arg)) (map.twice[k] = map.twice[k] || [e.arg]).push(arg);
          }
        }
      }
      return map;
    },
    // each layer the mapping places, as the contract element it is; a ruling or a layer that is not exactly
    // one element is refused, as the compared reader refuses it, never dropped
    elements() {
      const out = {};
      for (const [path, sel] of Object.entries(t.mapping.layers || {})) {
        if (sel === null) continue;
        if (typeof sel !== 'string') throw new Error(`the layer ${path} carries a ruling (${JSON.stringify(sel)}): a governed mapping rules in its waivers`);
        const ids = b.ids[path] || [];
        if (ids.length !== 1) throw new Error(`the layer ${path} is ${ids.length ? `several elements of the design (${ids.join(', ')})` : 'no layer of the design'}`);
        out[ids[0]] = { selector: at(sel) };
      }
      if (t.mapping.root && !out.root) out.root = { selector: at(t.mapping.root) };
      return out;
    },
  };
}

/* A host that declares no props (a site's fragments): the mapping's `controls`, as a story's controls read. */
export function controlsApi(controls) {
  if (!controls || !Object.keys(controls).length) return null;
  return { declared: true, args: Object.fromEntries(Object.entries(controls).map(([k, x]) => [k, x.default])),
    argTypes: Object.fromEntries(Object.entries(controls).map(([k, x]) => [k, { options: x.options || null, control: x.options ? 'select' : x.type, default: x.default }])) };
}

async function governedSource(project, name) {
  const { bridge } = req('./derive.cjs');
  const X = await import('../parity/external.mjs');
  const { session } = await import('../parity/session.mjs');
  const { valueOf } = req('../snapshot/tokens.cjs');
  const t = project.targets.find((x) => x.kind === 'component' && (x.folder === name || x.name === name));
  if (!t) throw Object.assign(new Error(`${name}: not in ${project.config.project}'s parity mappings`), { usage: true });
  const lib = project.lib;
  // a governed run measures every tier; a contract is read in the first, as the project lists them
  const tier = project.parity.tiers[0];
  const host = project.parity.host.kind;
  const container = host === 'storybook' ? '#storybook-root' : '[data-parity="c"]';
  const b = bridge(req('../snapshot/store.cjs').readSpec(project.paths.components, t.folder, { compact: true }));
  const G = governedReading(t, b, { stateAxis: lib.tokens && lib.tokens.stateAxis, container });
  let elements;
  try { elements = G.elements(); } catch (e) { throw Object.assign(new Error(`${name}'s mapping: ${e.message}`), { usage: true }); }
  if (!Object.keys(elements).length) throw Object.assign(new Error(`${name}'s mapping places no element (no \`root\`, no \`layers\`): nothing to read the code from`), { usage: true });
  const api = host === 'storybook' ? null : controlsApi(t.mapping.controls);
  if (host !== 'storybook' && !api) throw Object.assign(new Error(`${name}: the ${host} host declares no props, and the mapping lists no \`controls\` — add them, so the code's props can be read`), { usage: true });
  const S = await session(project, { app: false });
  const tab = await S.acquire();
  const tokens = project.snapshot;
  const src = {
    governed: true, label: project.config.project, tab, lib, repo: project.repo, out: project.where.parity, mode: tier, tokens,
    value: (x) => (typeof x === 'string' ? valueOf(tokens, x, tier) ?? x : x),
    textStyle: (n) => (tokens.textStyles || []).find((x) => x.name === n),
    components: project.paths.components, story: t.mapping.storyId || t.name, container,
    m: { story: t.mapping.storyId || t.name }, root: t.mapping.root || null, pseudoOf: G.pseudoOf,
    // another component of the library inside this one, by the project's instance pattern (parity.instance)
    instanceOf: (slug) => (project.parity.instance ? project.parity.instance.replace(/\{(?:slug|Name)\}/, slug) : null),
    instancePattern: project.parity.instance ? (await import('../parity/pair.mjs')).rootPattern(project.parity.instance) : null,
    async render(all) {
      const { __state, ...args } = all;
      if (host === 'storybook') await S.PAGE.open(tab, { storyId: t.mapping.storyId, args, tier });
      else await S.PAGE.open(tab, [{ key: 'c', html: await S.PAGE.fragment(t.name, Object.fromEntries(Object.entries(args).filter(([, v]) => v !== undefined))) }], { tier, viewport: [1280, 800] });
      await forceAt(tab, src.pseudoOf[__state]);
    },
    api: async () => api || S.PAGE.api(tab),
    elements: async () => elements,
    // the mapping's joins, and the engine's one rule (effectiveProps) for a prop the mapping's variants do not move (a text)
    joins: (figma, argTypes, g = G.joins(figma, variantDefaults(figma))) => ({ twice: g.twice, map: { props: X.effectiveProps(figma, g.props, Object.fromEntries(Object.keys(argTypes).map((k) => [k, {}])), argTypes, lib.codeProfile || {}) }, code: argTypes, framework: null, fw: lib.codeProfile || {} }),
    argsOf: (all) => G.argsOf(all) || {},
    close: () => S.close(),
  };
  return src;
}

/* ---- the run ---- */

async function main() {
  const argv = process.argv.slice(2);
  const opt = (k) => { const i = argv.indexOf(k); return i >= 0 ? argv.splice(i, 2)[1] : null; };
  const label = opt('--project');
  const rebuild = argv.includes('--rebuild'); if (rebuild) argv.splice(argv.indexOf('--rebuild'), 1);
  const codeOnly = argv.includes('--code-only'); if (codeOnly) argv.splice(argv.indexOf('--code-only'), 1);
  const name = argv[0];
  if (!label || !name) { console.error('usage: from-code.mjs --project <label> <component> [--rebuild] [--code-only]'); process.exit(2); }
  const { judge, elementIn, authoredWidth, authoredVars, compareProps, invisibleBorder, cssShadows, shadowKey } = await import('../parity/external.mjs');
  const { call } = await import('../shared/cdp.mjs');
  let L;
  try { L = await openSource(label, name, { rebuild, codeOnly }); } catch (e) { if (!e.usage) throw e; console.error(e.message); process.exit(2); }
  // the library's official contracts (official.mjs): Figma's readings, or the project's own where it takes the contract as its source
  const { contracts: officialContracts } = await import('./official.mjs');
  const official = new Map(officialContracts(req('../snapshot/projects.cjs').layout(null, label)).map((x) => [x.folder, x.contract]));
  // a component only in code has no Figma contract: nothing to pair its elements with or compare it to
  const figmaContract = codeOnly ? null : official.get(name);
  if (!codeOnly && !figmaContract) { console.error(`from-code: ${name} has no contract: snapshot the library first`); process.exit(2); }
  const t0 = Date.now();
  // which element is which Figma element: the mapping's, where it states them, else the pairing rule's
  let m = { ...L.m, elements: await L.elements(figmaContract) };

  // the token table, in the mode the code is compared in, and what the library's own contracts use
  const table = tokenTable(L.tokens, L.mode);
  const contracts = [...official.values()];
  const usage = usageIn(contracts);
  const offered = offerFor(contracts);
  // the library's fullest radius: the largest the radius field offers
  const tokenList = table.map(([n, v, sc]) => ({ name: n, value: v, ...(sc && { scopes: sc }) }));
  const fullest = () => { const r = (offered('radius', tokenList) || []).filter((t) => typeof t.value === 'number').sort((a, b) => b.value - a.value)[0]; return r ? r.name : null; };
  const ties = [], notes = [];
  // the library's other components, by the name the code's markup gives them (a framework's, or the
  // project's instance pattern), where one name is one component (a framework's TextField is five inputs: none)
  const byName = {};
  for (const [fig, code] of Object.entries(L.lib.frameworkComponents || {})) (byName[code] = byName[code] || []).push(fig);
  if (!Object.keys(byName).length && L.instancePattern) for (const [f, c] of official) (byName[f] = byName[f] || []).push(c.component);
  const ownName = (figmaContract && (L.lib.frameworkComponents || {})[figmaContract.component]) || name;
  const others = Object.fromEntries(Object.entries(byName).filter(([code, figs]) => figs.length === 1 && code !== ownName).map(([code, figs]) => [code, figs[0]]));
  // how the markup names a part and an icon: the library's own (code.partClass, code.iconClass), else its framework's (audit-defaults frameworks)
  const partClass = (L.lib.code && L.lib.code.partClass) || L.lib.frameworkProfile?.partClass || null;
  const partModifiers = L.lib.frameworkProfile?.partModifiers || null;
  const iconClass = (L.lib.code && L.lib.code.iconClass) || null;

  try {
    // a contract's values are words: an option the story lists as null (no icon) is "null" in it, and null to the story
    let nullable = new Set();
    // a slot's stand-in: a Storybook will not take a word for content through its address (an object control), so
    // it is set through the preview's own channel once the story has drawn, and waited for on screen
    const slotArgs = {};
    const show = async (all) => {
      const fill = Object.fromEntries(Object.entries(all).filter(([k]) => k in slotArgs));
      const viaChannel = Object.keys(fill).length && await call(L.tab, () => !!window.__STORYBOOK_PREVIEW__);
      await L.render(Object.fromEntries(Object.entries(all).filter(([k]) => !(viaChannel && k in fill)).map(([k, v]) => [k, v === 'null' && nullable.has(k) ? null : v])));
      if (!viaChannel) return;
      const got = await call(L.tab, async (args) => {
        const p = window.__STORYBOOK_PREVIEW__;
        p.channel.emit('updateStoryArgs', { storyId: p.currentRender.id, updatedArgs: args });
        for (let i = 0; i < 100; i++) { if (Object.values(args).every((m) => document.body.textContent.includes(m))) return true; await new Promise((r) => setTimeout(r, 50)); }
        return false;
      }, fill);
      if (!got) throw new Error(`the slot stand-in for ${Object.keys(fill).join(', ')} never drew: the story may not render that prop`);
    };
    await show({});
    // the code's own props and their starting values
    const story = await L.api();
    nullable = new Set(Object.entries(story.argTypes).filter(([, a]) => (a.options || []).includes(null)).map(([k]) => k));
    const props = {};
    for (const [k, a] of Object.entries(story.argTypes)) {
      const start = story.args[k];
      // required as the source says it (the docgen's), for the props a contract holds
      const must = a.required ? { required: true } : {};
      if (a.options && a.options.length) props[camel(k)] = { type: 'enum', values: a.options.map(String), default: String(a.default ?? start ?? a.options[0]), code: k, ...must, ...(a.default == null && { undeclared: true }) };
      else if (a.control === 'boolean' || a.type === 'boolean') props[camel(k)] = { type: 'boolean', default: a.default === true || (a.default == null && start === true), code: k, ...must };
      else if ((a.control === 'text' || a.type === 'string') && typeof start === 'string') props[camel(k)] = { type: 'string', code: k, sample: start, ...must };
      else if (a.control === 'number' || a.type === 'number') props[camel(k)] = { type: 'number', code: k, ...((a.default ?? start) != null && { default: a.default ?? start }), ...must };
      // content a caller passes (a ReactNode, a snippet, a template): a slot, found where a stand-in for it lands
      else if (isSlot(a)) props[camel(k)] = { type: 'slot', code: k, ...must };
    }
    if (story.declared) notes.push('the props are the ones the mapping declares (`controls`): the host does not say them, so they are taken as stated, not read');
    // the pointer states the mapping says how to force: a State prop of the contract's own kind (role
    // interaction), read like any other prop. A governed mapping states them per variant; a compared one
    // through its joins, where the rules supply a state's pseudo classes when a person gave none
    if (!Object.keys(L.pseudoOf).length && figmaContract) {
      const joined = L.joins(figmaContract, story.argTypes).map;
      const mapState = Object.values(joined.props || {}).find((x) => x && typeof x === 'object' && x.pseudo);
      if (mapState) L.pseudoOf = Object.fromEntries(Object.entries(mapState.pseudo).filter(([v]) => !(mapState.skip || []).includes(v)).map(([v, pseudo]) => [v, { pseudo }]));
    }
    if (Object.keys(L.pseudoOf).length) props.state = { type: 'enum', values: ['rest', ...Object.keys(L.pseudoOf)], default: 'rest', role: 'interaction', pointer: Object.keys(L.pseudoOf), code: '__state' };
    let defaults = Object.fromEntries(Object.entries(props).filter(([, p]) => p.type !== 'string').map(([, p]) => [p.code, p.type === 'slot' ? slotMark(p.code) : p.default]));
    // each slot's stand-in, by the prop it stands in for: the element it lands in is the slot
    const marks = Object.entries(props).filter(([, p]) => p.type === 'slot').map(([k, p]) => [slotMark(p.code), k]);
    for (const [k, p] of Object.entries(props)) if (p.type === 'slot') slotArgs[p.code] = slotMark(p.code);

    // one render, read as anatomy. The walk starts at the component's own root: the mapping's `root`, or
    // the framework's root class for it, which holds every part (the first paired element may be one part
    // of it, a switch's track beside its thumb); none, the first paired element
    const own = !L.root && L.instanceOf(ownName);
    const ownRoot = L.root ? `${L.container} ${L.root}` : own && await call(L.tab, (sel) => !!document.querySelector(sel), `${L.container} .${own}`) ? `${L.container} .${own}` : null;
    const rootSel = ownRoot || Object.values(m.elements)[0].selector;
    // pointer states are forced on the component itself, where the mapping names no element that takes them
    for (const at of Object.values(L.pseudoOf)) if (!at.on) at.on = rootSel;
    // a governed mapping states which element is which Figma layer: those take Figma's ids; a compared
    // library's are paired by rule, a guess, so its parts keep the names their markup gives them
    const named = L.governed ? Object.entries(m.elements).map(([id, e]) => [e.selector, id]).sort((a, b) => a[1].split('/').length - b[1].split('/').length) : [];
    const read = async (args) => {
      await show(args);
      const raw = await call(L.tab, ([sel, others, rootRe, container, named, partRe, modRe, iconRe, cornerSrc, WEIGHT, strokeSrc, marks]) => {
        const corner = new Function(`return ${cornerSrc}`)();
        const insetStroke = new Function(`return ${strokeSrc}`)();
        // a colour that paints nothing: fully transparent, whatever its channels
        const clear = (c) => /rgba\(.*,\s*0\)$|transparent/.test(c);
        let root = document.querySelector(sel); if (!root) return null;
        const holder = document.querySelector(container);
        while (root.parentElement && root.parentElement !== holder && root.parentElement !== document.body) root = root.parentElement;
        // the shallowest layer an element plays names it; a deeper one on the same element is its own words (a label written straight into its box)
        for (const [s, id] of named) { const n = document.querySelector(s); if (!n) continue; if (!n.hasAttribute('data-figma-id')) n.setAttribute('data-figma-id', id); else if (!n.hasAttribute('data-figma-text')) n.setAttribute('data-figma-text', id); }
        const out = [], seen = {};
        const px = (v) => +(+parseFloat(v) || 0).toFixed(2);
        const typeOf = (s) => ({ size: px(s.fontSize), lineHeight: px(s.lineHeight), weight: WEIGHT[s.fontWeight] });
        const slot = (n) => { if (partRe) for (const c of n.classList) { const x = c.match(new RegExp(partRe)); if (x && !(modRe && new RegExp(modRe).test(x[1]))) return x[1]; } return n.tagName.toLowerCase() === 'svg' ? 'icon' : n.tagName.toLowerCase(); };
        const walk = (n, parent, order) => {
          const s = getComputedStyle(n);
          // not drawn: hidden, or a native control MUI keeps for its behaviour at no opacity (a switch's input)
          if (s.display === 'none' || s.visibility === 'hidden' || +s.opacity === 0) return;
          const tag = n.tagName.toLowerCase();
          // an element the mapping states is a Figma layer takes that layer's id; else its place and its part's name
          let id = parent == null ? 'root' : n.getAttribute('data-figma-id') || `${parent === 'root' ? '' : `${parent}/`}${slot(n)}`;
          seen[id] = (seen[id] || 0) + 1; if (seen[id] > 1) id += seen[id];
          // its own words, as drawn: a thin space is a character (MUI's required mark is "\u2009*", two text nodes)
          const plain = (t) => t.replace(/[ \n\t\r]+/g, ' ');
          const text = [...n.childNodes].filter((x) => x.nodeType === 3 && plain(x.textContent).replace(/ /g, '')).map((x) => plain(x.textContent)).join('').replace(/^ +| +$/g, '');
          // a box whose only content is its words is a text, unless the mapping says its words are a layer of their own
          // the element a slot's stand-in landed in is the slot, what the caller puts there its content, not its parts
          const filled = marks.find(([m]) => text === m);
          const kind = filled ? 'slot' : tag === 'svg' ? 'graphic' : text && !n.children.length && !n.hasAttribute('data-figma-text') ? 'text' : 'container';
          const e = { id, kind, ...(parent != null && { parent, order }), ...(+s.opacity < 1 && { opacity: +(+s.opacity).toFixed(3) }), ...(filled && { content: `{${filled[1]}}` }) };
          n.setAttribute('data-contract-id', id);
          // another component of the library, drawn inside this one (a chip's avatar): an instance of it, its
          // inside the other component's business; named by the library's own class (MuiAvatar-root)
          const other = parent != null && rootRe && [...n.classList, n.tagName.toLowerCase()].map((c) => (c.match(new RegExp(rootRe)) || [])[1]).find((x) => x && others[x]);
          if (other) { seen[id]--; id = `${parent === 'root' ? '' : `${parent}/`}${other[0].toLowerCase()}${other.slice(1)}`; seen[id] = (seen[id] || 0) + 1; if (seen[id] > 1) id += seen[id];
            n.setAttribute('data-contract-id', id);
            out.push({ id, kind: 'instance', parent, order, component: others[other], width: px(s.width), height: px(s.height), ...(n.querySelector('img') && { image: true }) }); return; }
          // an icon set's name for it, where its class carries one (lucide-circle-x), as Figma's swap names it
          if (kind === 'graphic') { e.width = px(s.width); e.height = px(s.height); e.icon = s.color; const set = iconRe && [...n.classList].map((c) => c.match(new RegExp(iconRe))).find(Boolean); if (set) e.asset = set[1]; }
          else if (kind === 'text') { e.color = s.color; e.type = typeOf(s); e.textAlign = s.textAlign === 'left' ? 'start' : s.textAlign === 'right' ? 'end' : s.textAlign; e.content = text; }
          if (kind === 'container' || kind === 'text' || kind === 'slot') {
            if (/flex/.test(s.display)) {
              const A = { 'flex-start': 'start', start: 'start', normal: 'start', center: 'center', 'flex-end': 'end', end: 'end', 'space-between': 'space-between', stretch: 'stretch' };
              e.layout = { direction: /column/.test(s.flexDirection) ? 'column' : 'row', gap: s.gap === 'normal' ? 0 : px(s.gap), align: A[s.justifyContent] || s.justifyContent, crossAlign: A[s.alignItems] || s.alignItems };
            }
            const pad = { top: px(s.paddingTop), end: px(s.paddingRight), bottom: px(s.paddingBottom), start: px(s.paddingLeft) };
            if (Object.values(pad).some(Boolean)) (e.layout = e.layout || {}).padding = pad;
            if (!clear(s.backgroundColor)) e.background = s.backgroundColor;
            if (px(s.borderTopLeftRadius)) { const r = n.getBoundingClientRect(); Object.assign(e, corner(s.borderTopLeftRadius, r.width, r.height)); }
            if (s.borderTopStyle !== 'none' && px(s.borderTopWidth)) e.border = { color: s.borderTopColor, width: px(s.borderTopWidth) };
            // a stroke drawn as an inset shadow with no offset and no blur is a border (values.mjs insetStroke, as the code audit reads it)
            else { const st = String(s.boxShadow).split(/,(?![^(]*\))/).map(insetStroke).find((x) => x && x.width > 0); if (st) e.border = { color: st.colour, width: px(st.width) }; }
            if (s.overflow === 'hidden') e.overflow = 'hidden';
            // its shadow: drop shadows and inner ones
            // every shadow but an inset one with no offset or blur, which is the border read above
            const isBorder = (p) => !!insetStroke(p);
            const drops = String(s.boxShadow) === 'none' ? [] : String(s.boxShadow).split(/,(?![^(]*\))/).filter((p) => !isBorder(p));
            if (drops.length) e.shadow = drops.join(',');
            // a box no flex lays out, or one with nothing to hug, has a size of its own (a switch's thumb, an avatar's image)
            if (kind === 'container' && (!n.children.length || !/flex/.test(s.display))) { e.width = px(s.width); e.height = px(s.height); }
            // placed by code at a point inside its parent (a thumb over its track): where, so a drawing can place it so
            if (parent != null && s.position === 'absolute') { const pr = n.parentElement.getBoundingClientRect(), r = n.getBoundingClientRect(); e.absolute = { x: px(r.left - pr.left), y: px(r.top - pr.top) }; }
          }
          // what it is drawn over: the nearest ancestor that paints, for a translucent colour's token
          let a = kind === 'container' && e.background ? n.parentElement : n, under = null;
          while (a && !under) { const bg = getComputedStyle(a).backgroundColor; if (!clear(bg)) under = bg; a = a.parentElement; }
          e.under = under;
          out.push(e);
          // a box's children, and its own words where it has them beside its children (a label written straight
          // into a link beside its icon): a text part of its own, where it sits among them
          if (kind === 'container') {
            let i = 0, said = false;
            for (const c of n.childNodes) {
              if (c.nodeType === 1) walk(c, id, i++);
              else if (c.nodeType === 3 && text && !said && plain(c.textContent).replace(/ /g, '')) {
                said = true;
                let tid = n.getAttribute('data-figma-text') || `${id === 'root' ? '' : `${id}/`}text`;
                seen[tid] = (seen[tid] || 0) + 1; if (seen[tid] > 1) tid += seen[tid];
                // drawn over this box's own fill where it paints one, else over what this box is drawn over
                const over = clear(s.backgroundColor) ? under : s.backgroundColor;
                out.push({ id: tid, kind: 'text', parent: id, order: i++, color: s.color, type: typeOf(s),
                  textAlign: s.textAlign === 'left' ? 'start' : s.textAlign === 'right' ? 'end' : s.textAlign, content: text, under: over });
              }
            }
          }
        };
        walk(root, null, 0);
        // an order counts only the siblings drawn
        const byParent = {}; for (const e of out) if (e.parent != null) (byParent[e.parent] = byParent[e.parent] || []).push(e);
        for (const xs of Object.values(byParent)) xs.forEach((e, i) => { e.order = i; });
        return out;
      }, [rootSel, others, L.instancePattern, L.container, named, partClass, partModifiers, iconClass, cornerOf.toString(), Object.fromEntries([100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((w) => [w, weightName(w)])), insetStroke.toString(), marks]);
      if (!raw) throw new Error(`${rootSel} drew nothing with ${JSON.stringify(args)}`);
      // a whole computed border may be a floored one (1.5px reads 1px): the cascade's, as the code audit reads it
      for (const e of raw) if (e.border && Number.isInteger(e.border.width)) { const w = await authoredWidth(L.tab, `[data-contract-id="${e.id}"]`, 'border-top-width'); if (w != null && Math.floor(w) === e.border.width) e.border.width = w; }
      // a box the code sizes itself (height: 24px, a minimum), which a hug would lose: the cascade's own value,
      // as the contract's minHeight/minWidth (Figma's min sizes on an auto layout)
      for (const e of raw) if (e.kind === 'container' && e.layout) for (const [css, field] of [['height', 'minHeight'], ['min-height', 'minHeight'], ['width', 'minWidth'], ['min-width', 'minWidth']]) {
        const v = await authoredWidth(L.tab, `[data-contract-id="${e.id}"]`, css);
        if (v && !(field in e)) e[field] = v;
      }
      // values to tokens
      const anatomy = {}, drawn = {};
      let under = null;
      const asRgba = (v) => { const c = parseColour(v); return c ? `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${c[3]})` : v; };
      // where several tokens hold a value, the one the code wrote it with: the custom properties of the css it came from
      const tok = async (kind, v, at, css = []) => {
        let r = designTokenFor(kind, v, table, usage, under, judge, offered);
        if (r.more && css.length) {
          const el = at.slice(0, at.lastIndexOf('.'));
          for (const p of css) { const vars = await authoredVars(L.tab, `[data-contract-id="${el}"]`, p); if (vars.length) { r = designTokenFor(kind, v, table, usage, under, judge, offered, vars); break; } }
        }
        if (r.tie) ties.push({ at, token: r.token, tie: r.tie });
        return r.token ?? (['background', 'text', 'icon', 'stroke'].includes(kind) ? asRgba(r.value) : r.value);
      };
      const SIDE = { top: 'padding-top', end: 'padding-right', bottom: 'padding-bottom', start: 'padding-left' };
      for (const e of raw) {
        const { id, under: u, ...x } = e;
        under = u;
        drawn[id] = { background: x.background || x.icon || null, color: x.color || null, under: u, border: x.border ? x.border.color : null };
        if (x.layout) {
          if ('gap' in x.layout) x.layout.gap = await tok('space', x.layout.gap, `${id}.gap`, ['row-gap', 'column-gap', 'gap']);
          if (x.layout.padding) for (const k of Object.keys(x.layout.padding)) x.layout.padding[k] = await tok('space', x.layout.padding[k], `${id}.padding`, [SIDE[k]]);
        }
        if (x.background) x.background = await tok('background', x.background, `${id}.background`, ['background-color', 'background']);
        if (x.icon) { x.background = await tok('icon', x.icon, `${id}.icon`, ['fill', 'color']); delete x.icon; }
        if (x.color) x.color = await tok('text', x.color, `${id}.color`, ['color']);
        // a corner rounder than the element's longest side asks for a full round: the library's fullest radius
        if (x.radius) x.radius = x.full ? fullest() || x.radius : await tok('radius', x.radius, `${id}.radius`, ['border-top-left-radius', 'border-radius']);
        delete x.full;
        if (x.border) x.border = { color: await tok('stroke', x.border.color, `${id}.border`, ['border-top-color', 'border-color', 'border']), width: await tok('width', x.border.width, `${id}.border-width`, ['border-top-width', 'border-width']) };
        // a shadow is the library's effect style that draws it (layers matched by what they draw); none, its css
        if (x.shadow) { const k = shadowKey(cssShadows(x.shadow)); const hit = (L.tokens.effects || []).find((fx) => shadowKey((fx.layers || []).filter((l) => /SHADOW/.test(l.type)).map((l) => ({ inset: l.type === 'INNER_SHADOW', x: l.x, y: l.y, blur: l.blur, spread: l.spread, color: l.color }))) === k); x.shadow = hit ? hit.name : x.shadow; }
        if (x.type) { const r = styleFor(x.type, L.tokens.textStyles || [], usage); if (r.tie) ties.push({ at: `${id}.typography`, token: r.token, tie: r.tie }); x.typography = r.token ?? r.value; delete x.type; }
        if (x.kind === 'text') { const p = Object.entries(props).find(([, q]) => q.type === 'string' && (args[q.code] ?? q.sample) === x.content); if (p) x.content = `{${p[0]}}`; }
        anatomy[id] = x;
      }
      Object.defineProperty(anatomy, 'drawn', { value: drawn });
      return anatomy;
    };

    let base, variants, renders;
    const build = async () => {
    base = await read(defaults); variants = []; renders = [[{}, base]];
    for (const [k, p] of Object.entries(props)) {
      if (p.type === 'swap') continue;
      const others = p.type === 'enum' ? p.values.filter((v) => v !== p.default) : p.type === 'boolean' ? [!p.default] : [];
      // a value that draws what the default draws picks content, not style (an icon by name):
      // two such in a row make the prop a swap, as Figma's instance swap is, and none of the rest is rendered
      const absent = p.type === 'enum' ? others.filter((v) => /^(none|)$/i.test(v)) : [];
      let alike = 0;
      for (const v of [...absent, ...others.filter((x) => !absent.includes(x))]) {
        const got = await read({ ...defaults, [p.code]: v });
        const d = delta(base, got);
        // a pointer state that changes nothing here (a checked switch's hover) is still a state, never a swap
        if (!absent.includes(v) && p.type === 'enum' && p.role !== 'interaction' && !Object.keys(d).length && ++alike === 2) { props[k] = { type: 'swap', default: p.default, code: p.code, ...(props[k].shows && { shows: props[k].shows }) }; break; }
        renders.push([{ [k]: p.type === 'boolean' ? v : String(v) }, got]);
        if (absent.includes(v) && d.remove && !d.add) props[k].shows = d.remove;
        if (Object.keys(d).length) variants.push({ when: { [k]: p.type === 'boolean' ? v : String(v) }, ...d });
      }
      // a swap's renders are the default's: nothing to rebuild beyond it
      if (props[k].type === 'swap') for (let i = renders.length - 1; i > 0; i--) if (k in renders[i][0] && !/^(none|)$/i.test(renders[i][0][k])) renders.splice(i, 1);
    }
    };
    await build();
    // an enum the component declares no default for starts where it draws with the prop unset,
    // not where the story starts it; one at a time, each against renders made with the defaults so far
    for (const [k, p] of Object.entries(props)) {
      if (p.type !== 'enum' || !p.undeclared) continue;
      const unset = await read({ ...defaults, [p.code]: undefined });
      const hit = renders.find(([w, got]) => (k in w || !Object.keys(w).length) && !Object.keys(delta(unset, got)).length);
      const v = hit && (k in hit[0] ? hit[0][k] : p.default);
      if (!hit) notes.push(`${k}: unset, the component draws none of its values; the default is the story's, ${p.default}`);
      else if (v !== p.default) { p.default = v; defaults = { ...defaults, [p.code]: v }; await build(); }
    }
    for (const p of Object.values(props)) delete p.undeclared;

    // what two props do together that each alone does not explain: read every pair of
    // non-default values, and where expand() mispredicts it, a pair layer (as derive.cjs has)
    const fromCode = { contract: 1, component: name, code: { story: m.story, from: 'code' }, props: Object.fromEntries(Object.entries(props).map(([k, p]) => { const { sample, ...rest } = p; return [k, rest]; })), anatomy: base, variants };
    const valuesOf = (p) => (p.type === 'enum' ? p.values.filter((v) => v !== p.default) : p.type === 'boolean' ? [!p.default] : p.type === 'swap' && p.shows ? ['none'] : []);
    const argOf = (p, v) => (p.type === 'boolean' ? v : String(v));
    const keys = Object.keys(props);
    const combos = (n) => { const out = []; const go = (i, acc) => { if (acc.length === n) { out.push(acc); return; } for (let j = i; j < keys.length; j++) for (const v of valuesOf(props[keys[j]])) go(j + 1, [...acc, [keys[j], v]]); }; go(0, []); return out; };
    for (const pair of combos(2)) {
      const when = Object.fromEntries(pair.map(([k, v]) => [k, argOf(props[k], v)]));
      const got = await read({ ...defaults, ...Object.fromEntries(pair.map(([k, v]) => [props[k].code, v])) });
      const d = delta(expand(fromCode, when), got);
      if (Object.keys(d).length) variants.push({ when, ...d });
      renders.push([when, got]);
    }
    // the self-check reads what built nothing: every three-prop combination, which the layers must predict
    const unread = [];
    for (const three of combos(3)) {
      const when = Object.fromEntries(three.map(([k, v]) => [k, argOf(props[k], v)]));
      const got = await read({ ...defaults, ...Object.fromEntries(three.map(([k, v]) => [props[k].code, v])) });
      if (Object.keys(delta(expand(fromCode, when), got)).length) unread.push([when, got]);
    }
    // what three props together do beyond their pairs is a layer of its own, read the way a grid is read:
    // it applies wherever those three hold, whatever the rest (a combination layer naming every prop applied
    // at the default of the others alone, and the four-prop check below found it wrong in every feedback)
    const allDefaults = Object.fromEntries(Object.entries(fromCode.props).filter(([, p]) => 'default' in p).map(([k, p]) => [k, p.default]));
    for (const [when, got] of unread) {
      const d = delta(expand(fromCode, when), got);
      if (Object.keys(d).length) variants.push({ when, ...d });
    }
    // read once more after: a combination still not rebuilt is a defect of the contract, reported
    const stillUnread = unread.filter(([when, got]) => Object.keys(delta(expand(fromCode, { ...allDefaults, ...when }), got)).length).map(([w]) => JSON.stringify(w));
    // and the check reads what built nothing at all: every four-prop combination, which the layers, pairs
    // and three-prop combinations must predict; one they do not is a defect of the contract, reported
    for (const four of combos(4)) {
      const when = Object.fromEntries(four.map(([k, v]) => [k, argOf(props[k], v)]));
      const got = await read({ ...defaults, ...Object.fromEntries(four.map(([k, v]) => [props[k].code, v])) });
      if (Object.keys(delta(expand(fromCode, { ...allDefaults, ...when }), got)).length) stillUnread.push(JSON.stringify(when));
    }

    // self-check, as derive.cjs's: every render rebuilt by expand(), and every unread one predicted
    const bad = [...renders.filter(([when, got]) => JSON.stringify(sortKeys(expand(fromCode, when))) !== JSON.stringify(sortKeys(got))).map(([w]) => JSON.stringify(w)), ...stillUnread];

    // compared with Figma's, element by element where the map pairs them, at each
    // combination Figma's grid reads as a layer (the default, then one prop at a time),
    // the code rendered at the same combination through the map's args; a component only in code, with nothing
    const compare = [], structure = [], whens = [{}];
    let side = { map: {}, code: story.argTypes };
    if (figmaContract) {
      const figma = figmaContract;
      // the map as the code audit uses it: its props joined by rule where a person joined none
      side = L.joins(figma, story.argTypes);
      for (const [k, args] of Object.entries(side.twice || {})) notes.push(`${k}: its variants move ${args.join(' and ')}; joined to ${args[0]}, the first, and the rest are not compared`);
      m = { ...side.map, elements: m.elements };
      // a governed mapping's elements already carry Figma's ids in the walk; a compared library's are found where its selectors land
      const pairs = L.governed ? Object.fromEntries(Object.keys(m.elements).map((k) => [k, k])) : await pairUp(L, m, read, call, defaults);
      // a slot is joined where it is filled: the code's slot that fills the element Figma's slot fills
      for (const [k, p] of Object.entries(figma.props)) {
        const had = (side.map.props || {})[k];
        if (p.type !== 'slot' || typeof had === 'string' || (had && (had.arg || had.code))) continue;
        const fid = Object.keys(figma.anatomy).find((id) => figma.anatomy[id].content === `{${k}}`);
        const filled = fid && pairs[fid] && fromCode.anatomy[pairs[fid]] && String(fromCode.anatomy[pairs[fid]].content || '').match(/^\{(.+)\}$/);
        if (filled && props[filled[1]] && props[filled[1]].type === 'slot') side.map = { ...side.map, props: { ...(side.map.props || {}), [k]: { arg: props[filled[1]].code } } };
      }
      const fDefaults = variantDefaults(figma);
      for (const [k, p] of Object.entries(figma.props)) {
        if (p.role === 'interaction' || !(k in (m.props || {}))) continue;
        for (const v of p.type === 'enum' ? p.values : p.type === 'boolean' ? [true, false] : []) if (v !== p.default) whens.push({ [k]: v });
      }
      const value = (t) => (typeof t === 'string' ? L.value(t) : t);
      for (const when of whens) {
        // a text prop's default is the design's sample copy: the map's fixed sample stands in, as in the code audit
        const all = { ...fDefaults, ...Object.fromEntries(Object.entries(m.props || {}).filter(([, x]) => x && typeof x === 'object' && x.fixed != null).map(([k, x]) => [k, x.fixed])), ...when };
        const f = expand(figma, all);
        // the code's own starting values give way to every prop the map drives, under whichever name it
        // drives it (a switch's `checked` set through `defaultChecked`)
        const driven = new Set(Object.values(m.props || {}).flatMap((x) => (typeof x === 'string' ? [x] : x ? [x.arg, x.code].filter(Boolean) : [])));
        // unset first, so the story's own starting value (checked: true) gives way too
        const sent = { ...Object.fromEntries(Object.entries(defaults).filter(([k]) => !driven.has(k))), ...Object.fromEntries([...driven].map((k) => [k, undefined])), ...L.argsOf(all, m) };
        const c = await read(sent);
        for (const [mapped, cid] of Object.entries(pairs).filter(([k]) => !k.includes('@'))) {
          const fid = elementIn(f, mapped) || mapped;
          if (!f[fid] && !c[cid]) continue;
          if (!f[fid] || !c[cid]) { compare.push({ when, figma: fid, code: cid, verdict: f[fid] ? 'code draws none' : 'figma draws none' }); continue; }
          for (const k of ['background', 'color', 'typography', 'radius', 'border']) {
            // a shape Figma draws as an ellipse is a fully round box in code: its roundness is the shape's
            if (k === 'radius' && f[fid].kind === 'graphic' && c[cid].radius === fullest()) continue;
            if (!(k in f[fid]) && !(k in c[cid])) continue;
            const fv = k === 'border' && f[fid].border ? { color: f[fid].border.color, width: [].concat(f[fid].border.width)[0] } : f[fid][k] ?? null;
            const cv = c[cid][k] ?? null;
            let verdict = JSON.stringify(fv) === JSON.stringify(cv) ? 'same token' : 'differs';
            // another token, or none, that draws the same colour
            if (verdict === 'differs' && (k === 'background' || k === 'color') && fv) {
              const got = k === 'color' ? c.drawn[cid].color : c.drawn[cid].background;
              if (got && judge({ color: value(fv) }, got, c.drawn[cid].under) !== 'differs') verdict = 'same on screen';
            }
            // a border the design does not draw that code draws in a colour its own fill hides, as the audit judges it
            if (verdict === 'differs' && k === 'border' && !fv && c.drawn[cid].border && invisibleBorder({ 'border-color': c.drawn[cid].border, background: c.drawn[cid].background, under: c.drawn[cid].under })) verdict = 'same on screen';
            compare.push({ when, figma: fid, code: cid, field: k, figmaValue: fv, codeValue: cv, verdict });
          }
        }
      }
      // built differently: where a paired element is another kind of thing, or sits at another depth,
      // or a size comes from padding on one side and a set size on the other — the visual audit judges
      // whether they come out the same, this says how they are made
      const fBase = expand(figma, { ...fDefaults, ...Object.fromEntries(Object.entries(m.props || {}).filter(([, x]) => x && typeof x === 'object' && x.fixed != null).map(([k, x]) => [k, x.fixed])) });
      for (const [mapped, cid] of Object.entries(pairs).filter(([k]) => !k.includes('@'))) {
        const fid = elementIn(fBase, mapped), f = fid && fBase[fid], c = base[cid];
        if (!f || !c) continue;
        const fDepth = fid.split('/').length, cDepth = cid.split('/').length;
        const wraps = fid.split('/').slice(0, -1).filter((seg, i, a) => fBase[a.slice(0, i + 1).join('/')]?.kind === 'instance');
        if (f.kind !== c.kind || fDepth !== cDepth) structure.push(`${fid}: a ${f.kind} ${fDepth > cDepth ? `inside ${wraps.length ? `the ${wraps.map((w) => fBase[fid.split('/').slice(0, fid.split('/').indexOf(w) + 1).join('/')]?.component || w).join(' and ')} instance` : `${fDepth - cDepth} more layer(s)`}` : ''} in Figma; a ${c.kind} (${cid}) in code`);
        const pad = (e) => e.layout && e.layout.padding ? ['top', 'bottom'].map((k) => value(e.layout.padding[k]) || 0) : [0, 0];
        const [fp, cp] = [pad(f), pad(c)];
        if ((fp[0] !== cp[0] || fp[1] !== cp[1]) && (f.minHeight != null || c.minHeight != null)) structure.push(`${fid}: its height from ${f.minHeight != null ? `a set height of ${value(f.minHeight)}` : `padding (${fp[0]} top, ${fp[1]} bottom)`} in Figma, from ${c.minHeight != null ? `a set height of ${c.minHeight}` : `padding (${cp[0]} top, ${cp[1]} bottom)`} in code`);
      }

    }

    // a part that is another library component is that component's to compare, in its own audit: said
    const nested = Object.assign({}, base, ...variants.map((v) => v.add || {}));
    for (const [id, e] of Object.entries(nested)) if (e.kind === 'instance' && e.component) structure.push(`${id}: the ${e.component} component, drawn as its instance; its own values are compared in ${e.component}'s audit, not here`);

    // in the house's Figma conventions; its props against Figma's as the code audit judges them (one comparison, compareProps)
    const shaped = asFigma(fromCode, { axisOrder: (L.lib.tokens && L.lib.tokens.axisOrder) || [] });
    const propsCompare = figmaContract ? compareProps(figmaContract, side.map, side.code, side.framework, side.fw || {}) : [];
    // a check that read nothing the layers were not built from cannot fail: said, not passed
    const heldOut = combos(4).length;
    const report = { at: new Date().toISOString(), seconds: Math.round((Date.now() - t0) / 1000), selfCheck: bad.length ? { notRebuilt: bad } : heldOut ? `every render rebuilt, ${heldOut} four-prop combination(s) among them that built nothing` : 'every render rebuilt, but fewer than four props vary: nothing was left unread to check the layers against',
      ...(notes.length && { notes }), ties, compare, propsCompare, structure, renamed: shaped.renamed, contract: fromCode, asFigma: shaped.contract };
    const out = path.join(L.out, 'from-code', `${name}.json`);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    // the same code reads back to the same file: a run that found nothing new leaves it as it was
    writeReport(out, report);
    const n = (v) => compare.filter((x) => x.verdict === v).length;
    console.log(`${name}: ${Object.keys(props).length} props, ${Object.keys(base).length} elements, ${variants.length} variant layers; self-check ${bad.length ? `${bad.length} not rebuilt` : heldOut ? `ok on ${heldOut} unread combination(s)` : 'nothing left unread to check'}; ${ties.length} tie(s); ${figmaContract ? `against Figma at ${whens.length} combinations: ${n('same token')} same token, ${n('same on screen')} same on screen, ${compare.length - n('same token') - n('same on screen')} differ; props ${propsCompare.filter((x) => x.findings.every((f) => f.kind === 'ok')).length} of ${propsCompare.length} without a finding` : 'only in code: nothing in Figma to compare'} — ${path.relative(TOOLKIT, out)}, ${report.seconds}s`);
    // what the run could not read as asked reaches whoever ran it, not only the file
    for (const x of notes) console.log(`  note: ${x}`);
  } finally { L.close(); }
}

const sortKeys = (v) => (Array.isArray(v) ? v.map(sortKeys) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, sortKeys(v[k])])) : v);

/* The map's selectors name the DOM element each Figma element landed on; the
   code contract names it by its own walk, so pair them by element. */
async function pairUp(L, m, read, call, defaults) {
  // the walk tags each element it reads with its id: a mapped element is the one its selector finds, or the
  // nearest tagged element holding it, so pairing names elements exactly as the walk does
  await read(defaults);
  return call(L.tab, (els) => Object.fromEntries(Object.entries(els).map(([fid, e]) => {
    const n = document.querySelector(e.selector);
    const tagged = n && n.closest('[data-contract-id]');
    return [fid, tagged ? tagged.getAttribute('data-contract-id') : null];
  })), m.elements);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === realpathSync(process.argv[1])) main().catch((e) => { console.error(e); process.exit(1); });
