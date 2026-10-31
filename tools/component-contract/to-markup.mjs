#!/usr/bin/env node
/*
 * A component contract as markup: the component for React, as a web component's markup or as a Kirby snippet, its parity mapping and its
 * stories, generated from the contract the snapshot derived, beside the stylesheet to-code writes (toolkit-standard
 * §D 23: what the source determines is generated). How each is written is knowledge/code/react.md's and
 * knowledge/code/web-components.md's: the native element carries the behaviour (code-standard rule 8), the rest of the
 * native props and the ref reach it, a variant is an attribute, a state the browser's (code-standard rule 9), nothing
 * is parsed as HTML. What the contract cannot say (an element other than a button or a text entry, a role, an icon's
 * drawing, what only a pointer state draws, when an event fires) is written into the file as a marked gap,
 * `frontend-build:`, for that skill to fill; the file is then the project's own (its banner taken out, it is never
 * written over).
 *
 *   node tools/component-contract/to-markup.mjs --project <label> [--framework react|web-components|kirby] [component…]
 *   node tools/component-contract/to-markup.mjs --project <label> --contract <file> [--platform <p>]
 *   node tools/component-contract/to-markup.mjs --repo <dir> [component…]
 *
 * Where: the repo's `paths.components`, one folder per component, beside its spec: `<folder>.tsx` (React) or
 * `<folder>.js` (a function that builds the markup, through the one `dom.js` the folder above holds), `parity.mjs`,
 * and `<folder>.stories.tsx|js`; for Kirby, the snippet `<folder>.php` that frontend-build's scaffold registers as
 * snippet('<prefix>/<folder>'), the same markup as the web component's, its mapping and the gallery's
 * `<folder>.stories.php`. Framework: `--framework`, else the repo's snapshot.config.json `framework`. Names:
 * `styles.naming`, as to-code names the hooks (`namer`): React takes class naming (`.ds-chip`, `.ds-chip__label`),
 * web components and Kirby element naming (`ds-chip`, `[data-part="label"]`), so the generated sheet styles what is
 * written.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { namer, partSeg, copyOf, entryOf, controlOf, selectorOf, ringOf, placedIn, PREFIX, said, HOUSE, pseudoClasses, disabledKey } from './to-code.mjs';
import { officials, homeIn } from './official.mjs';
import { partName, figmaWord, camel } from './layers.mjs';

const require = createRequire(import.meta.url);
export const BANNER = "Generated from the component's contract by the toolkit's to-markup. A gap marked frontend-build: is that skill's to fill; once filled, take this line out and the file is the project's.";
export const FRAMEWORKS = ['react', 'web-components', 'kirby'];
// the naming each framework's markup is written to: a React root is the native element, a class its hook; a web
// component is a custom element, its parts by data-part
export const NAMING = { react: 'class', 'web-components': 'element', kirby: 'element' };

const str = JSON.stringify;
const IDENT = /^[A-Za-z_$][\w$]*$/;
/* How the tree spells a prop and a literal: JavaScript's, or a PHP snippet's (a variable, a single-quoted string that
   nothing in it is read in), with the names a Kirby snippet is handed already (kirby, site, page, slot, slots) and the
   ones it binds itself taken. */
const phpStr = (s) => `'${String(s).replace(/[\\']/g, (m) => `\\${m}`)}'`;
const JS = { ref: (n) => n, str, taken: new Set() };
const PHP = { ref: (n) => `$${n}`, str: phpStr, php: true, taken: new Set(['kirby', 'site', 'page', 'slot', 'slots', 'attrs', 'host', 'restAttrs', 'hostAttrs', 'GLOBALS']) };
const cap = (s) => camel(s).replace(/^./, (x) => x.toUpperCase());
// a name code can use: a component's, from its words (one that starts with a digit is given a letter)
const pascal = (s) => { const p = cap(s); return /^[A-Za-z_$]/.test(p) ? p : `C${p}`; };
// a component that holds no box of its own is phrasing content (a span), so it may sit in a button or a line of text
const phrasing = (c) => ![...Object.entries(c.anatomy || {}), ...(c.variants || []).flatMap((v) => Object.entries(v.add || {}))].some(([id, e]) => id !== 'root' && (e.kind === 'container' || e.kind === 'slot'));
const placedFolder = (placed) => require('../snapshot/store.cjs').folderOf(placed.component, placed.platform || null);
// a control that draws no words of its own: its name is the caller's to give, and its type requires it
// (code-standard rule 18; knowledge/code/react.md, *Icon-only needs a name, by type*)
const iconOnlyOf = (c) => !!controlOf(c.component, placedIn(c)) && ![...partsOf(c).values()].some((x) => x.e.kind === 'text' && !x.inside && !x.slotted);
const at = (c, id) => (c.anatomy || {})[id] || (c.variants || []).map((v) => (v.add || {})[id]).find(Boolean);
// a value a busy state is: the control stays focusable and refuses the action (knowledge/code/react.md, *The native
// element first*)
const BUSY = /^(loading|pending|busy|progress|submitting|saving)$/i;
// a prop spelt as an HTML or ARIA attribute says something else to a reader and to the element it reaches
// (code-standard rules 9 and 10): Role is a variant
// and the names the generated code binds itself: a prop spelt as one would be bound twice, or hide the helper
const TAKEN = new Set(['role', 'hidden', 'title', 'lang', 'dir', 'id', 'slot', 'style', 'className', 'class', 'tabIndex', 'type', 'name', 'form', 'ref', 'key', 'children', 'rest', 'host', 'cx', 'h', 'onClick', 'String',
  // and JavaScript's own words: a Figma boolean called New or Default is camel-cased into one
  ...'break case catch class const continue debugger default delete do else enum export extends false finally for function if implements import in instanceof interface let new null package private protected public return static super switch this throw true try typeof var void while with yield await arguments eval undefined'.split(' ')]);
// the handlers React and the DOM both know: one is the element's own, passed with the rest; another on- name (onPress,
// onOpenChange) is the component's own event, a gap
const HANDLERS = new Set(['onClick', 'onDoubleClick', 'onChange', 'onInput', 'onFocus', 'onBlur', 'onKeyDown', 'onKeyUp', 'onSubmit', 'onMouseEnter', 'onMouseLeave', 'onMouseDown', 'onMouseUp', 'onPointerDown', 'onPointerUp', 'onPointerEnter', 'onPointerLeave', 'onContextMenu', 'onScroll', 'onWheel']);

/* Storybook's id for a story: its title and its export, each lower case, a run of what is not a letter or digit one
   hyphen (Storybook's `sanitize`). */
export const storyIdOf = (title, name) => [title, name].map((s) => String(s).toLowerCase().replace(/[ ’–—―′¿'`~!@#$%^&*()_|+\-=?;:'",.<>{}[\]\\/]/gi, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '')).join('--');
export const titleOf = (c, platform = null) => `Design system/${c.component}${platform ? ` (${platform})` : ''}`;

/* What the markup knows of each prop: its name in code, how it reaches the element (an attribute the sheet keys on,
   the control's own disabled, a part's text, an input's placeholder, a placed component's prop) and its type. A
   pointer state is the browser's (a pseudo-class), so only the values the product sets (a Loading) are a prop. */
export function propsOf(c, library = {}, lang = JS, settings = HOUSE) {
  const control = controlOf(c.component, placedIn(c)), entry = entryOf(c), dis = disabledKey(c, settings);
  const out = [];
  for (const [key, p] of Object.entries(c.props || {})) {
    if (!IDENT.test(key)) throw new Error(`${c.component}: ${str(key)} is not a name code can use`);
    const base = { key, p, name: key };
    if (p.role === 'interaction') {
      const own = (p.values || []).filter((v) => !(p.pointer || []).includes(v));
      if (own.length > 1) out.push({ ...base, type: 'enum', values: own, default: p.default, attr: true, busy: own.filter((v) => BUSY.test(v)) });
      continue;
    }
    if (entry && key === entry.flag) continue;
    if (entry && (p.sets || []).includes(entry.value)) { out.push({ ...base, type: 'value', default: p.default ?? '' }); continue; }
    if (entry && (p.sets || []).includes(entry.placeholder)) { out.push({ ...base, type: 'string', default: p.default ?? '', input: 'placeholder' }); continue; }
    if (p.type === 'enum') out.push({ ...base, type: 'enum', values: p.values || [], default: p.default, attr: true });
    else if (p.type === 'boolean') out.push({ ...base, type: 'boolean', default: p.default === true, native: key === dis && !!(control || entry), attr: !(key === dis && (control || entry)) });
    else if (p.type === 'string') out.push({ ...base, type: 'string', default: p.default ?? '' });
    else if (p.type === 'number') out.push({ ...base, type: 'number', default: Number.isFinite(Number(p.default)) ? Number(p.default) : 0 });
    else if (p.type === 'instance') out.push({ ...base, ...swapOf(c, p, library, lang) });
    else if (p.type === 'slot') out.push({ ...base, type: 'node', slot: slotPartOf(c, key) });
    // an event: a DOM handler (onClick) is the element's own, typed by it and passed with the rest; another is a gap
    else if (p.type === 'event') { if (!HANDLERS.has(key)) out.push({ ...base, type: 'event' }); }
  }
  // one icon in code where Figma keeps a swap for each size of one part (Icon (16), Icon (20)): the first stays, named
  // without its size, and answers to each one's Figma name; the sheet sizes the icon
  const icons = new Map();
  for (const x of [...out]) {
    const part = x.type === 'icon' && (x.p.swaps || [])[0];
    if (!part) continue;
    const first = icons.get(part);
    if (!first) { icons.set(part, x); continue; }
    first.figmas = [...(first.figmas || [first.p.figma]), x.p.figma];
    out.splice(out.indexOf(x), 1);
  }
  for (const x of icons.values()) { const bare = x.key.replace(/\d+$/, ''); if (x.figmas && bare && !out.some((y) => y.name === bare)) x.name = bare; }
  // Role is variant (appearance, where variant is taken): its hook stays the attribute the sheet keys on
  const names = new Set(out.map((x) => x.name));
  // a rename never lands on a name another prop has (type beside typeOption)
  const free = (n, i = 2) => (names.has(n) ? (names.has(n + i) ? free(n, i + 1) : n + i) : n);
  for (const x of out) if (TAKEN.has(x.name) || lang.taken.has(x.name)) { x.renamed = x.name; x.name = x.name === 'role' && !names.has('variant') ? 'variant' : x.name === 'role' && !names.has('appearance') ? 'appearance' : free(`${x.name}Option`); names.add(x.name); }
  return out;
}
/* A swap: among icons (a component the library does not hold), the icon's name; of a part inside a placed component,
   that component's own prop, passed to it; among the library's components, what is placed. */
function swapOf(c, p, library, lang) {
  const id = (p.swaps || [])[0];
  const e = id && at(c, id);
  for (let up = id && id.includes('/') ? id.slice(0, id.lastIndexOf('/')) : null; up; up = up.includes('/') ? up.slice(0, up.lastIndexOf('/')) : null) {
    const holder = at(c, up);
    if (!holder || holder.kind !== 'instance' || !library[holder.component]) continue;
    const placed = library[holder.component], rel = id.slice(up.length + 1);
    // the placed component's own swap: by the part it swaps, else by its name, as Figma surfaces a nested instance's
    // property under the name it has there
    const [to, q] = Object.entries(placed.props || {}).find(([, x]) => (x.swaps || []).includes(rel)) || Object.entries(placed.props || {}).find(([, x]) => x.type === 'instance' && x.figma && x.figma === p.figma) || [];
    if (!to) break;
    const theirs = propsOf(placed, library, lang).find((x) => x.key === to);
    const given = (holder.with || {})[q.figma];
    return { type: theirs ? theirs.type : 'node', default: given ?? (theirs && theirs.default) ?? '', pass: { part: up, to: theirs ? theirs.name : to } };
  }
  if (e && e.kind === 'instance' && !library[e.component]) return { type: 'icon', default: e.component || '' };
  return { type: 'node' };
}
// a slot prop's part: the slot whose content names it, else the slot part of its name, which a boolean that shows it
// may lead (Show extra content / Extra content slot), base or added by a variant; never a placed component's own slot
function slotPartOf(c, key) {
  const all = { ...(c.anatomy || {}), ...Object.assign({}, ...(c.variants || []).map((v) => v.add || {})) };
  const placedIn = (id) => { for (let e = all[id]; e && e.parent; e = all[e.parent]) if ((all[e.parent] || {}).kind === 'instance') return true; return false; };
  const slots = Object.entries(all).filter(([id, e]) => e.kind === 'slot' && !placedIn(id));
  const last = (id) => camel(id.split('/').pop());
  const hit = slots.find(([, e]) => e.content === `{${key}}`) || slots.find(([id]) => last(id) === key) || slots.find(([id]) => last(id).endsWith(cap(key)));
  return hit ? hit[0] : null;
}

/* Each part, base and added, with its parent and the conditions it is drawn under: the variants that add it and those
   that take it away, a pointer state's left to the stylesheet. A part only a pointer state draws is a gap; a focus ring
   drawn as a layer of its own is the ringed element's outline; a part inside a placed component is that component's;
   one inside a slot is a caller's sample. */
export function partsOf(c) {
  const props = c.props || {};
  const pointer = (k, v) => (props[k] || {}).role === 'interaction' && ((props[k] || {}).pointer || []).includes(v);
  const parts = new Map();
  for (const [id, e] of Object.entries(c.anatomy || {})) parts.set(id, { id, e, base: true, adds: [], removes: [], pointerOnly: false, rings: [] });
  for (const v of c.variants || []) {
    const when = v.when || {};
    const byPointer = Object.entries(when).some(([k, x]) => pointer(k, x));
    for (const [id, e] of Object.entries(v.add || {})) {
      if (!parts.has(id)) parts.set(id, { id, e, base: false, adds: [], removes: [], pointerOnly: true, rings: [] });
      if (byPointer) { parts.get(id).rings.push(!!ringOf(c, when, id, e, { ...c.anatomy, ...v.add })); continue; }
      parts.get(id).pointerOnly = false;
      parts.get(id).adds.push(when);
    }
    for (const id of v.remove || []) if (parts.has(id)) { if (byPointer) parts.get(id).pointerGone = true; else parts.get(id).removes.push(when); }
  }
  for (const part of parts.values()) {
    // a ring where to-code makes it the ringed element's outline at every focus that draws it (to-code's ringOf, the one rule)
    part.ring = !part.base && part.pointerOnly && part.rings.length > 0 && part.rings.every(Boolean);
    for (let up = part.e.parent; up && up !== 'root'; up = ((parts.get(up) || {}).e || {}).parent) {
      const k = ((parts.get(up) || {}).e || {}).kind;
      if (k === 'instance') part.inside = up;
      if (k === 'slot') part.slotted = up;
    }
  }
  return parts;
}

/* A part's condition as code, over the props' names in code: null where it is always drawn, 'false' where never. */
function conditionOf(c, part, props, known = { yes: new Set(), no: new Set() }, lang = JS) {
  const byKey = new Map(props.map((x) => [x.key, x]));
  const entry = entryOf(c);
  let unknown = false;
  const term = (when) => {
    const out = [];
    for (const [k, v] of Object.entries(when)) {
      const x = byKey.get(k), p = (c.props || {})[k] || {};
      if (!x) {
        // a prop with no name in code: a field's has-value is its input's, an interaction prop with one value its default
        if (entry && k === entry.flag) { unknown = true; continue; }
        if (v !== p.default) return 'false';
        continue;
      }
      const ref = lang.ref(x.name);
      out.push(typeof v === 'boolean' ? (v ? ref : `!${ref}`) : `${ref} === ${lang.str(v)}`);
    }
    return out.length ? out.join(' && ') : 'true';
  };
  const terms = (list) => list.map(term).filter((x) => x !== 'false');
  const any = (t) => (!t.length ? 'false' : t.includes('true') ? 'true' : t.length === 1 ? t[0] : t.map((x) => `(${x})`).join(' || '));
  // what a box it sits in already says is not said again (`{a && (… {a && …})}` repeats itself, and TypeScript refuses
  // a comparison the outer one has already ruled out)
  let add = part.base ? 'true' : any(terms(part.adds));
  if (known.yes.has(add)) add = 'true';
  // what adds it, said once: a part Show icon adds and Show icon with Loading takes away is drawn at showIcon && !loading
  const one = !part.base && part.adds.length === 1 ? part.adds[0] : {};
  const no = terms(part.removes.map((w) => Object.fromEntries(Object.entries(w).filter(([k, v]) => one[k] !== v)))).filter((x) => !known.no.has(x));
  const gone = any(no);
  const wrap = (x) => (/^!?[\w$]+$/.test(x) ? x : `(${x})`);
  const not = (x) => (/^![\w$]+$/.test(x) ? x.slice(1) : `!${wrap(x)}`);
  const cond = gone === 'false' ? add : gone === 'true' ? 'false' : add === 'true' ? not(gone) : add === 'false' ? 'false' : `${wrap(add)} && ${not(gone)}`;
  return { when: cond === 'true' ? null : cond, unknown, known: { yes: new Set([...known.yes, add]), no: new Set([...known.no, ...no]) } };
}

/* The tree, built once for both frameworks: each element as a tag, its attributes (a literal, or code) and its
   children, printed as JSX or as `h()` calls. */
function build(c, folder, { naming, library = {}, jsx, lang = JS, settings = HOUSE }) {
  const n = namer(folder, naming);
  const props = propsOf(c, library, lang, settings), ref = lang.ref;
  const parts = partsOf(c);
  const entry = entryOf(c);
  const control = controlOf(c.component, placedIn(c));
  const inline = phrasing(c);
  const gaps = [];
  const used = new Set(); // the placed components the markup draws, each imported once
  const kids = new Map();
  for (const part of parts.values()) if (part.id !== 'root') { const up = part.e.parent || 'root'; kids.set(up, [...(kids.get(up) || []), part]); }
  for (const list of kids.values()) list.sort((a, b) => (a.e.order ?? 0) - (b.e.order ?? 0));
  const seg = (id) => partSeg(c, copyOf(c, id) || id);
  // a part's hook: its class (React) or its data-part (a web component)
  const hook = (id) => (n.element ? [['data-part', { lit: seg(id) }]] : [['className', { lit: n.part(seg(id)).slice(1) }]]);
  const named = (key) => props.find((x) => x.key === key);
  const textOf = (id, e) => { const x = props.find((y) => y.type === 'string' && !y.input && (y.p.sets || []).includes(id)); return x ? { code: ref(x.name) } : { lit: e.content || '' }; };
  const busy = props.find((x) => x.busy && x.busy.length);
  const busyCode = busy && busy.busy.map((v) => `${ref(busy.name)} === ${lang.str(v)}`).join(' || ');
  const node = (part, holds) => {
    const { id, e } = part;
    if (part.ring || part.inside || part.slotted) return null;
    if (entry && (id === entry.value || id === entry.placeholder)) return id === entry.value || !at(c, entry.value) ? input() : null;
    if (part.pointerOnly) { gaps.push(`${partName(id)} is drawn only at a pointer state: the stylesheet's, or frontend-build's to add`); return { comment: `frontend-build: ${partName(id)}, drawn only at a pointer state` }; }
    const { when, unknown, known } = conditionOf(c, part, props, holds, lang);
    if (part.pointerGone) gaps.push(`${partName(id)} is taken away at a pointer state: the stylesheet's, or frontend-build's to take away`);
    if (unknown) gaps.push(`${partName(id)} is drawn by whether the field holds a value: the input's own :placeholder-shown, or frontend-build's to say`);
    if (when === 'false') return null;
    const icon = props.find((x) => x.type === 'icon' && (x.p.swaps || []).includes(id));
    const slot = props.find((x) => x.type === 'node' && (x.slot === id || (x.p.swaps || []).includes(id)));
    const tag = e.kind === 'text' || control || inline ? 'span' : 'div';
    let out;
    if (icon || (e.kind === 'instance' && !library[e.component])) {
      gaps.push(`${partName(id)}: draw the icon ${icon ? `its ${icon.name} names` : e.component}, as the project draws icons`);
      out = { tag: 'span', attrs: [...hook(id), ['data-icon', icon ? { code: ref(icon.name) } : { lit: e.component }], ['aria-hidden', { lit: 'true' }]], children: [] };
    } else if (slot) {
      out = { tag, attrs: hook(id), children: [lang.php ? { code: `$slots->${slot.name}()`, raw: true } : { code: slot.name }] };
    } else if (e.kind === 'instance') {
      const placed = library[e.component], theirs = propsOf(placed, library, lang, settings);
      const given = Object.entries(e.with || {}).map(([fig, v]) => {
        const x = theirs.find((y) => (y.figmas || [y.p.figma]).includes(fig));
        if (!x) return null;
        // Figma's word for it ("False", "Secondary") as the placed component's own value in code; a pointer state the browser's
        if (x.type === 'boolean') return [x.name, { lit: v === true || /^true$/i.test(String(v)) }];
        // a placed field's Value is its input's first text, and only where the instance is drawn holding one
        if (x.type === 'value') { const f = entryOf(placed), on = f && (e.with || {})[(placed.props[f.flag] || {}).figma]; return f && String(on).toLowerCase() === String(f.on) ? [jsx ? 'defaultValue' : 'value', { lit: v }] : null; }
        const i = (x.p.figmaValues || []).indexOf(v), lit = i >= 0 ? x.p.values[i] : v;
        return x.type === 'enum' && !x.values.includes(lit) ? null : [x.name, { lit }];
      }).filter(Boolean);
      // one icon for a swap Figma keeps per size: the one the instance draws (its glyph's own name), else the first
      for (const x of theirs.filter((y) => y.figmas)) {
        const drawnAs = String((at(c, `${id}/${x.p.swaps[0]}`) || {}).component || '').split('/').pop();
        const mine = given.filter(([k]) => k === x.name), keep = mine.find(([, v]) => String(v.lit) === drawnAs) || mine[0];
        for (const g of mine) if (g !== keep) given.splice(given.indexOf(g), 1);
      }
      if (iconOnlyOf(placed)) {
        const icon = given.find(([k]) => theirs.some((y) => y.type === 'icon' && y.name === k));
        gaps.push(`${partName(id)}: its aria-label is the icon's name until frontend-build says what it does`);
        given.push(['aria-label', { lit: String(icon ? icon[1].lit : placed.component) }]);
      }
      for (const x of props.filter((y) => y.pass && y.pass.part === id && y.type !== 'value')) { const i = given.findIndex(([k]) => k === x.pass.to); if (i >= 0) given.splice(i, 1); given.push([x.pass.to, { code: ref(x.name) }]); }
      out = { placed: placed, folder: placedFolder(placed), attrs: given, hook: hook(id), own: theirs.map((x) => x.name) };
      used.add(placed.component);
    } else if (e.kind === 'graphic') {
      out = { tag: 'span', attrs: [...hook(id), ['aria-hidden', { lit: 'true' }]], children: [] };
    } else if (e.kind === 'text') {
      out = { tag, attrs: hook(id), children: [textOf(id, e)] };
    } else {
      out = { tag, attrs: hook(id), children: (kids.get(id) || []).map((k) => node(k, known)).filter(Boolean) };
    }
    return when ? { when, node: out } : out;
  };
  // a text entry: one input, its own value the Value text and its ::placeholder the Placeholder (to-code's entryOf)
  const input = () => {
    const ph = props.find((x) => x.input === 'placeholder'), dis = props.find((x) => x.native);
    // a snippet has no rest to carry the field's value to its input: it is the snippet's own, left out while empty
    const value = lang.php && props.find((x) => x.type === 'value');
    return { tag: 'input', control: true, attrs: [...hook('input'), ...(ph ? [['placeholder', { code: ref(ph.name) }]] : []), ...(value ? [['value', { code: ref(value.name), filled: true }]] : []), ...(dis ? [['disabled', { code: ref(dis.name), bool: true }]] : [])], children: [] };
  };
  // the root's hooks: each prop value an attribute (a boolean "true" or "false", as the sheet reads both defaults),
  // Disabled the control's own, a busy state the control's aria-disabled
  const hooks = props.filter((x) => x.attr).map((x) => [n.attr(x.key), x.type === 'boolean' ? { code: lang.php ? `${ref(x.name)} ? 'true' : 'false'` : `String(${x.name})` } : { code: ref(x.name) }]);
  const own = [];
  // busy, a submit button is a plain one, so the form it is in is not sent either
  if (control) own.push(['type', { code: busyCode ? (lang.php ? `(${busyCode}) ? 'button' : $type` : `${busyCode} ? "button" : type`) : ref('type') }]);
  const dis = props.find((x) => x.native);
  if (dis && control) own.push(['disabled', { code: ref(dis.name), bool: true }]);
  if (busyCode && control) {
    own.push(['aria-disabled', lang.php ? { code: busyCode, bool: 'true' } : { code: jsx ? `${busyCode} || undefined` : `(${busyCode}) ? 'true' : null` }]);
    gaps.push(`${busy.name}: say it in the page's status region as it starts and ends (knowledge/code/react.md, *The native element first*)`);
    // a server's markup has no handler to refuse the click: the page's script does, as a busy control is not disabled
    if (lang.php) gaps.push(`${busy.name}: the page's script refuses the click while aria-disabled is "true", as a busy control stays enabled`);
  }
  const children = (kids.get('root') || []).map((k) => node(k)).filter(Boolean);
  if (!control && !entry) gaps.push(`its element and role: a ${n.element ? 'custom element' : inline ? 'span' : 'div'} until frontend-build says what it is (code-standard rule 8)`);
  if (!entry && props.some((x) => /^placeholder$/i.test(x.key))) gaps.push('a field drawn with a Placeholder and no Value text: its <input>, and its text the input\'s ::placeholder (to-code reads a text entry from the two texts)');
  for (const x of props) if (x.type === 'event') gaps.push(`${x.name}: when it fires, frontend-build's to wire (taken here, so it reaches no element)`);
  for (const x of props) if (x.type === 'number') gaps.push(`${x.name}: what the number does`);
  for (const x of props.filter((y) => y.renamed && y.renamed !== 'role')) gaps.push(`${x.name}: Figma's ${x.p.figma || x.renamed} is an HTML attribute's name, so it is ${x.name} here; name it for what it means`);
  return { n, props, gaps, hooks, own, children, control, entry, busy: busyCode, inline, placed: [...used].sort(), iconOnly: iconOnlyOf(c) };
}

/* ── React ───────────────────────────────────────────────────────────── */

const tsType = (x) => (x.type === 'enum' ? x.values.map(str).join(' | ') : x.type === 'boolean' ? 'boolean' : x.type === 'number' ? 'number' : x.type === 'node' ? 'ReactNode' : x.type === 'event' ? '() => void' : 'string');
const litOf = (x) => (x.type === 'node' || x.type === 'event' || x.type === 'value' ? null : x.type === 'boolean' ? String(x.default === true) : x.type === 'number' ? String(Number.isFinite(Number(x.default)) ? Number(x.default) : 0) : str(x.default));

function jsxOf(item, depth) {
  const pad = '  '.repeat(depth);
  if (item.comment) return `${pad}{/* ${said(item.comment)} */}`;
  // an either-or is bracketed, or the && after it would bind to its last term alone
  if (item.when) return `${pad}{${/\|\|/.test(item.when) ? `(${item.when})` : item.when} && (\n${jsxOf(item.node, depth + 1)}\n${pad})}`;
  if (item.code !== undefined) return `${pad}{${item.code}}`;
  if (item.lit !== undefined) return `${pad}{${str(item.lit)}}`;
  const attr = ([k, v]) => (v.lit === true ? ` ${k}` : typeof v.lit === 'boolean' || typeof v.lit === 'number' ? ` ${k}={${v.lit}}` : v.lit !== undefined ? ` ${k}=${/^[^"{}<>&\\\n\r\t]*$/.test(v.lit) ? str(v.lit) : `{${str(v.lit)}}`}` : ` ${k}={${v.code}}`);
  if (item.placed) {
    const cls = item.hook.find(([k]) => k === 'className');
    return `${pad}<${pascal(item.placed.component)}${cls ? attr(cls) : ''}${item.attrs.map(attr).join('')} />`;
  }
  const open = `<${item.tag}${(item.spread || '')}${item.attrs.map(attr).join('')}`;
  if (item.tag === 'input' || !item.children.length) return `${pad}${open}${item.tag === 'input' ? ' />' : `></${item.tag}>`}`;
  const inline = item.children.length === 1 && (item.children[0].code !== undefined || item.children[0].lit !== undefined);
  if (inline) return `${pad}${open}>${jsxOf(item.children[0], 0)}</${item.tag}>`;
  return `${pad}${open}>\n${item.children.map((x) => jsxOf(x, depth + 1)).join('\n')}\n${pad}</${item.tag}>`;
}

/* The React component: its own props typed and documented, the root element's other props, its ref and its events
   passed through, the root's hooks, the parts, the generated sheet imported. */
export function toReact(c, folder, { naming, library = {}, stylesheet = null, settings = HOUSE } = {}) {
  const name = pascal(c.component);
  const t = build(c, folder, { naming, library, jsx: true, settings });
  const own = t.props.filter((x) => x.type !== 'value');
  // the element the rest of the props reach: the control, the field's input, else the root
  const target = t.entry ? 'input' : t.control || (t.inline ? 'span' : 'div');
  const placed = t.placed;
  const root = { tag: t.entry ? 'div' : target, attrs: [], children: t.children };
  const cls = ['className', { code: `cx(${str(t.n.root.slice(1))}, className)` }];
  if (t.entry) {
    root.attrs = [cls, ['style', { code: 'style' }], ...t.hooks];
    const fill = (x) => (x.tag === 'input' ? Object.assign(x, { spread: ' {...rest}' }) : (x.node && fill(x.node), (x.children || []).forEach(fill)));
    root.children.forEach(fill);
  } else {
    root.spread = ' {...rest}';
    root.attrs = [...t.own, cls, ...t.hooks, ...(t.busy ? [['onClick', { code: `${t.busy} ? undefined : onClick` }]] : [])];
  }
  const doc = (x) => {
    const what = x.type === 'icon' ? 'The icon\'s name.' : x.type === 'node' ? 'What a caller puts here.' : x.busy && x.busy.length ? `${x.busy.map(str).join(' or ')} keeps the control focusable and refuses its action.` : '';
    return `  /** ${said(`${what ? `${what} ` : ''}${litOf(x) != null ? `@default ${litOf(x)}` : ''}`)} */`.replace('  /**  */', '').replace(/ \*\/$/, ' */').replace('/** @', '/** @');
  };
  const lines = [`/* ${BANNER} */`, ...(t.gaps.length ? ['/*', ...[...new Set(t.gaps)].map((g) => ` * frontend-build: ${said(g)}`), ' */'] : []),
    `import type { ComponentPropsWithRef${own.some((x) => x.type === 'node') ? ', ReactNode' : ''} } from 'react';`,
    ...placed.map((p) => `import { ${pascal(p)} } from '../${placedFolder(library[p])}/${placedFolder(library[p])}';`),
    ...(stylesheet ? [`import ${str(stylesheet)};`] : []),
    '',
    `const cx = (...names: Array<string | false | null | undefined>) => names.filter(Boolean).join(' ');`,
    '',
    ...(own.length ? [
      `type Own = {`,
      ...own.flatMap((x) => [doc(x), `  ${x.name}?: ${tsType(x)};`].filter((l) => l.trim())),
      `};`,
      '',
      `export type ${name}Props = Own & Omit<ComponentPropsWithRef<${str(target)}>, keyof Own>${t.iconOnly ? ` & { 'aria-label': string }` : ''};`,
    ] : [`export type ${name}Props = ComponentPropsWithRef<${str(target)}>${t.iconOnly ? ` & { 'aria-label': string }` : ''};`]),
    '',
    `export function ${name}({ ${[...own.map((x) => (x.type === 'event' ? `${x.name}: _${x.name}` : litOf(x) == null ? x.name : `${x.name} = ${litOf(x)}`)), ...(t.control ? ['type = "button"'] : []), 'className', ...(t.entry ? ['style'] : []), ...(t.busy && !t.entry ? ['onClick'] : []), '...rest'].join(', ')} }: ${name}Props) {`,
    `  return (`,
    jsxOf(root, 2),
    `  );`,
    `}`];
  return lines.join('\n').replace(/\n\n+/g, '\n\n') + '\n';
}

/* ── web components ──────────────────────────────────────────────────── */

const fnOf = (c) => `render${pascal(c.component)}`;
function hOf(item, depth) {
  const pad = '  '.repeat(depth);
  if (item.comment) return `${pad}/* ${said(item.comment)} */ null`;
  if (item.when) return `${pad}(${item.when}) && ${hOf(item.node, depth).trimStart()}`;
  if (item.code !== undefined) return `${pad}${item.code}`;
  if (item.lit !== undefined) return `${pad}${str(item.lit)}`;
  const obj = (list) => `{ ${list.map(([k, v]) => `${IDENT.test(k) ? k : str(k)}: ${v.lit !== undefined ? str(v.lit) : v.code}`).join(', ')} }`;
  if (item.placed) return `${pad}${fnOf(item.placed)}(${obj(item.attrs)}, ${obj(item.hook)})`;
  const attrs = item.spread ? `{ ${item.spread}${item.attrs.length ? `, ${obj(item.attrs).slice(2, -2)}` : ''} }` : obj(item.attrs);
  if (!item.children.length) return `${pad}h(${str(item.tag)}, ${attrs})`;
  return `${pad}h(${str(item.tag)}, ${attrs},\n${item.children.map((x) => hOf(x, depth + 1)).join(',\n')})`;
}

/* The web component's markup, as a function that builds it: the host carries the variant, the native control inside
   it the behaviour (code-standard rule 8), the rest of the props given it reach the control, and every value is an
   attribute's text or a text node (dom.js `h`), never parsed as HTML. No class is registered: a visual or native
   interactive component is markup and its stylesheet (knowledge/code/web-components.md). */
export function toElement(c, folder, { naming, library = {}, settings = HOUSE } = {}) {
  const t = build(c, folder, { naming, library, jsx: false, settings });
  const tag = t.n.root;
  const own = t.props.filter((x) => x.type !== 'value');
  const placed = t.placed;
  let host;
  // a busy control is not given its click (React's onClick guard, the same): h() adds no listener for a null
  const guard = t.control && t.busy ? [['onClick', { code: `(${t.busy}) ? null : onClick` }]] : [];
  if (t.control) host = { tag, attrs: t.hooks, spread: '...host', children: [{ tag: t.control, spread: '...rest', attrs: [...t.own, ...guard], children: t.children }] };
  else if (t.entry) {
    host = { tag, attrs: t.hooks, spread: '...host', children: t.children };
    const fill = (x) => (x.tag === 'input' ? Object.assign(x, { spread: '...rest' }) : (x.node && fill(x.node), (x.children || []).forEach(fill)));
    host.children.forEach(fill);
  } else host = { tag, attrs: t.hooks, spread: '...rest, ...host', children: t.children };
  const attrsSaid = own.filter((x) => x.attr).map((x) => `${t.n.attr(x.key)}${x.type === 'enum' ? ` (${x.values.map(str).join(' | ')}, default ${str(x.default)})` : ` ("true" | "false", default "${x.default}")`}`);
  return [`/* ${BANNER} */`, ...(t.gaps.length ? ['/*', ...[...new Set(t.gaps)].map((g) => ` * frontend-build: ${said(g)}`), ' */'] : []),
    `import { h } from '../dom.js';`,
    ...placed.map((p) => `import { ${fnOf(library[p])} } from '../${placedFolder(library[p])}/${placedFolder(library[p])}.js';`),
    '',
    `/**`,
    ` * ${said(`<${tag}>${attrsSaid.length ? `: ${attrsSaid.join('; ')}` : ''}.`)}`,
    ` * The first argument's other values reach the ${t.control ? `<${t.control}>` : t.entry ? '<input>' : 'host'}; the second's, the host (a holder's hook).`,
    ...(t.iconOnly ? [` * It draws no words: give it its name, its "aria-label" (code-standard rule 18).`] : []),
    ` */`,
    `export function ${fnOf(c)}({ ${[...own.map((x) => (x.type === 'event' ? `${x.name}: _${x.name}` : litOf(x) == null ? x.name : `${x.name} = ${litOf(x)}`)), ...(t.control ? ['type = "button"'] : []), ...(guard.length ? ['onClick'] : []), '...rest'].join(', ')} } = {}, host = {}) {`,
    `  return ${hOf(host, 1).trimStart()};`,
    `}`, ''].join('\n');
}

/* The one helper every component's markup is built with: an element, its attributes and its children, nothing parsed
   as HTML (knowledge/code/web-components.md, *Rendering once, updating in place*). A null or false attribute or child
   is left out, true is an attribute with no value, a function on an on- name is a listener. */
export const DOM = `/* ${BANNER} */
export function h(tag, attrs = {}, ...children) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (typeof v === 'function' && /^on[A-Z]/.test(k)) e.addEventListener(k === 'onDoubleClick' ? 'dblclick' : k.slice(2).toLowerCase(), v);
    else e.setAttribute(k, v === true ? '' : String(v));
  }
  e.append(...children.flat(Infinity).filter((x) => x != null && x !== false && x !== true));
  return e;
}
`;

/* ── a Kirby snippet ─────────────────────────────────────────────────── */

/* The web component's markup as a server writes it: one snippet, `snippet('<prefix>/<folder>', [...])`, as
   frontend-build's scaffold registers it, with the elements, attributes and text the web component builds (the test
   holds the two to one tree), every value through Kirby's esc() for where it lands (skills/kirby-cms, *Security*), a
   slot Kirby's own, and what a caller adds to the control in `attrs` and to the host in `host`, through the scaffold's
   `<prefix>_attrs()`. */
const PHPVAR = /^[A-Za-z_]\w*$/;
const snippetBase = (naming) => String(naming.prefix || '').replace(/-$/, '');
const phpLit = (v) => (typeof v === 'boolean' || typeof v === 'number' ? String(v) : phpStr(v));
const phpDefault = (x) => (x.type === 'boolean' ? String(x.default === true) : x.type === 'number' ? String(Number.isFinite(Number(x.default)) ? Number(x.default) : 0) : x.type === 'value' ? "''" : phpStr(x.default ?? ''));
// an attribute's literal as it stands where nothing in it can be read as markup or code, else through esc()
const attrLit = (v) => (/^[A-Za-z0-9 _.:/-]*$/.test(v) ? v : `<?= esc(${phpStr(v)}, 'attr') ?>`);

function phpOf(item, depth, base) {
  const pad = '  '.repeat(depth);
  if (item.comment) return `${pad}<?php /* ${said(item.comment)} */ ?>`;
  if (item.when) return `${pad}<?php if (${item.when}): ?>\n${phpOf(item.node, depth + 1, base)}\n${pad}<?php endif ?>`;
  if (item.code !== undefined) return `${pad}<?= ${item.raw ? item.code : `esc(${item.code})`} ?>`;
  if (item.lit !== undefined) return `${pad}<?= esc(${phpStr(item.lit)}) ?>`;
  const pairs = (list) => list.map(([k, v]) => `${phpStr(k)} => ${v.lit !== undefined ? phpLit(v.lit) : v.code}`).join(', ');
  if (item.placed) {
    // its own props by name; anything else (an aria-label, a field's value) reaches its control through its attrs
    const own = item.attrs.filter(([k]) => item.own.includes(k)), rest = item.attrs.filter(([k]) => !item.own.includes(k));
    const data = [...(own.length ? [pairs(own)] : []), ...(rest.length ? [`'attrs' => [${pairs(rest)}]`] : []), `'host' => [${pairs(item.hook)}]`];
    return `${pad}<?php snippet(${phpStr(`${base}/${item.folder}`)}, [${data.join(', ')}]) ?>`;
  }
  const attr = ([k, v]) => (v.bool === true ? `<?= ${v.code} ? ' ${k}' : '' ?>`
    : v.bool ? `<?= ${v.code} ? ' ${k}="${v.bool}"' : '' ?>`
    : v.filled ? `<?= ${v.code} !== '' ? ' ${k}="' . esc(${v.code}, 'attr') . '"' : '' ?>`
    : v.lit !== undefined ? ` ${k}="${attrLit(String(v.lit))}"` : ` ${k}="<?= esc(${v.code}, 'attr') ?>"`);
  const open = `<${item.tag}${item.attrs.map(attr).join('')}${item.spread ? `<?= ${item.spread} ?>` : ''}>`;
  if (item.tag === 'input') return `${pad}${open}`;
  if (!item.children.length) return `${pad}${open}</${item.tag}>`;
  const inline = item.children.length === 1 && (item.children[0].code !== undefined || item.children[0].lit !== undefined);
  if (inline) return `${pad}${open}${phpOf(item.children[0], 0, base)}</${item.tag}>`;
  return `${pad}${open}\n${item.children.map((x) => phpOf(x, depth + 1, base)).join('\n')}\n${pad}</${item.tag}>`;
}

export function toSnippet(c, folder, { naming, library = {}, settings = HOUSE } = {}) {
  const t = build(c, folder, { naming, library, jsx: false, lang: PHP, settings });
  const base = snippetBase(naming), tag = t.n.root;
  // a slot is Kirby's ($slots), an event no server's: the rest are the snippet's variables
  const own = t.props.filter((x) => x.type !== 'event' && x.type !== 'node');
  for (const x of own) if (!PHPVAR.test(x.name)) throw new Error(`${c.component}: ${str(x.name)} is not a name PHP can use`);
  let host;
  if (t.control) host = { tag, attrs: t.hooks, spread: '$hostAttrs', children: [{ tag: t.control, spread: '$restAttrs', attrs: t.own, children: t.children }] };
  else if (t.entry) {
    host = { tag, attrs: t.hooks, spread: '$hostAttrs', children: t.children };
    const fill = (x) => (x.tag === 'input' ? Object.assign(x, { spread: '$restAttrs' }) : (x.node && fill(x.node), (x.children || []).forEach(fill)));
    host.children.forEach(fill);
  } else host = { tag, attrs: t.hooks, spread: '$restAttrs', children: t.children };
  const attrsSaid = own.filter((x) => x.attr).map((x) => `${t.n.attr(x.key)}${x.type === 'enum' ? ` (${x.values.map(str).join(' | ')}, default ${str(x.default)})` : ` ("true" | "false", default "${x.default}")`}`);
  const slots = t.props.filter((x) => x.type === 'node').map((x) => x.name);
  const takes = t.control ? `<${t.control}>` : t.entry ? '<input>' : 'host';
  return ['<?php', `/* ${BANNER} */`, ...(t.gaps.length ? ['/*', ...[...new Set(t.gaps)].map((g) => ` * frontend-build: ${said(g)}`), ' */'] : []),
    '/**',
    ` * ${said(`<${tag}>${attrsSaid.length ? `: ${attrsSaid.join('; ')}` : ''}.`)}`,
    ` * $attrs reach the ${takes}; $host, the host (a holder's hook).${slots.length ? ` Slots: ${said(slots.join(', '))}.` : ''}`,
    ...(t.iconOnly ? [` * It draws no words: give it its name, 'aria-label' in $attrs (code-standard rule 18).`] : []),
    ' */',
    ...own.map((x) => `$${x.name} = $${x.name} ?? ${phpDefault(x)};`),
    ...(t.control ? ["$type = $type ?? 'button';"] : []),
    t.control || t.entry ? `$restAttrs = ${base}_attrs($attrs ?? []);` : `$restAttrs = ${base}_attrs(array_merge($attrs ?? [], $host ?? []));`,
    ...(t.control || t.entry ? [`$hostAttrs = ${base}_attrs($host ?? []);`] : []),
    '?>',
    phpOf(host, 0, base), ''].join('\n');
}

/* The gallery's story file (frontend-build's scaffold): the controls the gallery renders the real snippet with, each
   at its default; what a server cannot be handed there (a slot, an event) is left out, as the stories leave it out. */
export function toGallery(c, { library = {} } = {}) {
  const props = propsOf(c, library, PHP).filter((x) => x.type !== 'event' && x.type !== 'node');
  const control = (x) => (x.type === 'enum' ? `['type' => 'select', 'options' => [${x.values.map(phpStr).join(', ')}], 'default' => ${phpDefault(x)}]`
    : x.type === 'boolean' ? `['type' => 'boolean', 'default' => ${phpDefault(x)}]`
    : `['type' => 'text', 'default' => ${x.type === 'number' ? phpStr(phpDefault(x)) : phpDefault(x)}]`);
  const api = (x) => (x.type === 'enum' ? x.values.join(' · ') : x.type === 'boolean' ? 'true · false' : x.type === 'icon' ? "the icon's name" : x.type === 'value' ? "the field's value" : x.type === 'number' ? 'a number' : 'text');
  const tier = controlOf(c.component, placedIn(c)) || entryOf(c) ? 'Native interactive' : 'Visual';
  return ['<?php', `/* ${BANNER} */`, 'return [',
    `    'title'    => ${phpStr(c.component)},`,
    `    'tier'     => ${phpStr(tier)},`,
    `    'api'      => [${props.map((x) => `${phpStr(x.name)} => ${phpStr(api(x))}`).join(', ')}],`,
    `    'controls' => [`, ...props.map((x) => `        ${phpStr(x.name)} => ${control(x)},`), '    ],',
    '];', ''].join('\n');
}

/* ── the mapping and the stories ─────────────────────────────────────── */

/* The element the markup draws a part as, by the selector the sheet styles it by (to-code's): a focus ring the ringed
   element, a field's two texts its input, a numbered copy its place among its own (`:nth-child(2 of …)`). */
export function partSelector(c, n, id, part = partsOf(c).get(id)) {
  const entry = entryOf(c), first = copyOf(c, id);
  if (id === 'root' || (part && part.ring)) return selectorOf(c, n, 'root');
  if (entry && (id === entry.value || id === entry.placeholder)) return selectorOf(c, n, entry.input);
  if (!first) return selectorOf(c, n, id);
  const s = selectorOf(c, n, first), seg = n.part(partSeg(c, first)), i = s.lastIndexOf(seg) + seg.length;
  return `${s.slice(0, i)}:nth-child(${Number(/_(\d+)$/.exec(id)[1])} of ${seg})${s.slice(i)}`;
}

/* The parity mapping (tools/parity/README.md, The mapping format), keyed by Figma's own names: every axis and its every
   option, so the run measures the whole set (code-standard rule 33), each by the args its story takes; every layer by
   the selector the sheet styles it by (to-code's). */
export function toParity(c, folder, { naming, library = {}, platform = null, framework = 'react', settings = HOUSE } = {}) {
  const n = namer(folder, naming);
  // each variant's args by the names its markup takes: a snippet's variables, where those differ
  const props = propsOf(c, library, framework === 'kirby' ? PHP : JS, settings);
  const byKey = new Map(props.map((x) => [x.key, x]));
  const entry = entryOf(c);
  // the mapping's `pseudo` is the class without its colon (tools/parity/README.md, The mapping format)
  const PSEUDO = Object.fromEntries(Object.entries(pseudoClasses(settings)).map(([v, ps]) => [v, ps.replace(/^:/, '')]));
  const axes = {};
  for (const [key, p] of Object.entries(c.props || {})) {
    const fig = p.figma || key, x = byKey.get(key), name = x ? x.name : key;
    const word = (v, i) => (p.figmaValues || [])[i] ?? figmaWord(v);
    if (p.role === 'interaction') axes[fig] = Object.fromEntries((p.values || []).map((v, i) => [word(v, i), v === p.default ? {} : (p.pointer || []).includes(v) && PSEUDO[v] ? { pseudo: PSEUDO[v] } : { [name]: v }]));
    else if (p.type === 'enum') axes[fig] = Object.fromEntries((p.values || []).map((v, i) => [word(v, i), v === p.default ? {} : { [name]: v }]));
    else if (entry && key === entry.flag) {
      // has a value: the input holds the Value's sample text
      const value = props.find((y) => y.type === 'value'), arg = framework === 'react' ? 'defaultValue' : 'value';
      axes[fig] = { [figmaWord(entry.on)]: { [arg]: (value && value.default) || 'Value' }, [figmaWord(!entry.on)]: {} };
    } else if (p.type === 'boolean' && (p.axis || (p.shows || []).length || key === disabledKey(c, settings))) axes[fig] = { False: p.default === true ? { [name]: false } : {}, True: p.default === true ? {} : { [name]: true } };
  }
  const parts = partsOf(c);
  const root = selectorOf(c, n, 'root');
  // a layer as the store spells its path (tools/parity layers.mjs): a repeat by its number, Item#2
  const nameOf = (id) => { const e = (parts.get(id) || {}).e || {}; const m = /_(\d+)$/.exec(id); return (e.name || partName(id)) + (m ? `#${m[1]}` : ''); };
  const pathOf = (id) => { const names = []; for (let up = id; up && up !== 'root'; up = (parts.get(up) || {}).e?.parent) names.unshift(nameOf(up)); return names.join(' > '); };
  const layers = {};
  for (const x of parts.values()) {
    if (x.id === 'root') continue;
    layers[pathOf(x.id)] = x.inside ? { skip: `drawn by ${((parts.get(x.inside) || {}).e || {}).component}, compared in its own mapping` }
      : x.slotted ? { skip: 'a sample of what a caller puts in the slot' }
      : x.pointerOnly && !x.ring ? { skip: 'drawn only at a pointer state: frontend-build adds it' }
      : partSelector(c, n, x.id, x);
  }
  return { storyId: storyIdOf(titleOf(c, platform), 'Default'), root, state: root, axes, layers, waivers: {} };
}

/* The stories: the component at its defaults, and one for each value and each yes-or-no the contract draws, the
   accessibility check failing the run (knowledge/code/react.md, *Stories in CSF3*). */
export function toStories(c, folder, framework, { library = {}, platform = null, storybook = '@storybook/react', settings = HOUSE } = {}) {
  const name = pascal(c.component);
  const props = propsOf(c, library, JS, settings);
  const shown = props.filter((x) => !['node', 'event', 'value'].includes(x.type));
  const args = Object.fromEntries(shown.map((x) => [x.name, x.default]));
  if (iconOnlyOf(c)) args['aria-label'] = c.component;
  const stories = [['Default', {}]];
  const seen = new Set(['Default']);
  const add = (id, a) => { let s = id.replace(/[^\w$]/g, ''); if (!IDENT.test(s)) s = `S${s}`; while (seen.has(s)) s += '_'; seen.add(s); stories.push([s, a]); };
  for (const x of shown) {
    if (x.type === 'enum') for (const v of x.values) { if (v !== x.default) add(`${cap(x.name)}${cap(String(v))}`, { [x.name]: v }); }
    else if (x.type === 'boolean') add(x.default ? `No${cap(x.name)}` : cap(x.name), { [x.name]: !x.default });
  }
  const title = titleOf(c, platform);
  const each = stories.map(([s, a]) => (framework === 'react' ? `export const ${s}: Story = ${Object.keys(a).length ? `{ args: ${str(a)} }` : '{}'};` : `export const ${s} = ${Object.keys(a).length ? `{ args: ${str(a)} }` : '{}'};`)).join('\n');
  if (framework === 'react') return [`/* ${BANNER} */`, `import type { Meta, StoryObj } from '${storybook}';`, `import { ${name} } from './${folder}';`, '',
    `const meta = { title: ${str(title)}, component: ${name}, args: ${str(args)}, parameters: { a11y: { test: 'error' } } } satisfies Meta<typeof ${name}>;`,
    `export default meta;`, `type Story = StoryObj<typeof meta>;`, '', each, ''].join('\n');
  return [`/* ${BANNER} */`, `import { ${fnOf(c)} } from './${folder}.js';`, '',
    `export default { title: ${str(title)}, render: (args) => ${fnOf(c)}(args), args: ${str(args)}, parameters: { a11y: { test: 'error' } } };`, '', each, ''].join('\n');
}

/* Why a framework's markup cannot be written to a naming, or null: the one check, the CLI's and the contract editor's
   Settings and Push to code alike. */
export function namingFault(framework, naming) {
  if (!naming || naming.kind !== NAMING[framework]) return `${framework} markup is written to ${NAMING[framework]} naming: set styles.naming's kind to "${NAMING[framework]}"`;
  if (framework === 'web-components' && !PREFIX.test(naming.prefix || '')) return 'a custom element\'s name needs a hyphen: set a prefix that ends in one, such as "ds-"';
  // the scaffold's snippet folder and helper are the prefix without its hyphen (snippet('ds/button'), ds_attrs())
  if (framework === 'kirby' && !/^[a-z][a-z0-9]*-$/.test(naming.prefix || '')) return 'a Kirby snippet\'s element is its prefix and folder, the prefix one word and a hyphen, as the scaffold\'s: such as "ds-"';
  return null;
}

/* Every file one component's folder gets, by name. */
/* Where a React project's story types come from: its Storybook framework's package (Storybook, *Writing stories in
   TypeScript*), read from its package.json; the renderer's own where it names none. */
const STORYBOOK = ['@storybook/nextjs-vite', '@storybook/nextjs', '@storybook/react-vite', '@storybook/react-webpack5'];
export function storybookOf(pkg = {}) {
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  return STORYBOOK.find((x) => deps[x]) || '@storybook/react';
}

export function filesFor(c, folder, { framework, naming, library = {}, stylesheet = null, platform = null, storybook, settings = HOUSE }) {
  const fault = namingFault(framework, naming);
  if (fault) throw new Error(fault);
  const parity = `/* ${BANNER} */\nexport const parity = ${JSON.stringify(toParity(c, folder, { naming, library, platform, framework, settings }), null, 2)};\nexport default parity;\n`;
  if (framework === 'kirby') return { [`${folder}.php`]: toSnippet(c, folder, { naming, library, settings }), 'parity.mjs': parity, [`${folder}.stories.php`]: toGallery(c, { library }) };
  const ext = framework === 'react' ? 'tsx' : 'js';
  return {
    [`${folder}.${ext}`]: framework === 'react' ? toReact(c, folder, { naming, library, stylesheet, settings }) : toElement(c, folder, { naming, library, settings }),
    'parity.mjs': parity,
    [`${folder}.stories.${ext}`]: toStories(c, folder, framework, { library, platform, storybook, settings }),
  };
}

if (process.argv[1] && fs.realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const flag = (k) => { const i = args.indexOf(`--${k}`); return i < 0 ? null : args.splice(i, 2)[1]; };
  const label = flag('project'), repoFlag = flag('repo'), contractFlag = flag('contract'), platform = flag('platform'), fwFlag = flag('framework');
  const fail = (why) => { console.error(`to-markup: ${why}`); process.exit(2); };
  if (!label && !repoFlag) fail('--project <label> or --repo <dir>');
  let where;
  if (repoFlag) {
    const repo = path.resolve(repoFlag);
    where = { repo, paths: require('../snapshot/store.cjs').paths(repo, require('../shared/repo-config.cjs').repoConfig(repo, 'to-markup').paths || {}), ...homeIn(repo) };
  } else {
    where = require('../snapshot/projects.cjs').layout(null, label);
    if (where.error) fail(where.error);
    if (!where.repo) fail(`${label} has no code repo to write components into`);
  }
  const config = require('../shared/repo-config.cjs').repoConfig(require('../snapshot/projects.cjs').expand(where.repo), 'to-markup');
  const framework = fwFlag || config.framework;
  if (!FRAMEWORKS.includes(framework)) fail(`name the framework: --framework ${FRAMEWORKS.join('|')}, or "framework" in snapshot.config.json`);
  const naming = config.styles && config.styles.naming;
  const pkg = path.join(require('../snapshot/projects.cjs').expand(where.repo), 'package.json');
  const storybook = storybookOf(fs.existsSync(pkg) ? JSON.parse(fs.readFileSync(pkg, 'utf8')) : {});
  const dir = where.paths.components;
  const { of } = officials(where);
  const settingsOf = require('../snapshot/projects.cjs').librarySettingsFor(dir);
  const stored = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => fs.existsSync(path.join(dir, f, 'contract.json'))).sort() : [];
  const library = {}, folderOf = {};
  for (const f of stored) { const x = of(JSON.parse(fs.readFileSync(path.join(dir, f, 'contract.json'), 'utf8'))); library[x.component] = x; folderOf[f] = x; }
  const draft = contractFlag && JSON.parse(fs.readFileSync(path.resolve(contractFlag), 'utf8'));
  const only = args.filter((a) => !a.startsWith('--'));
  const jobs = draft ? [[require('../snapshot/store.cjs').folderOf(draft.component, platform), draft]] : stored.filter((f) => !only.length || only.includes(f)).map((f) => [f, folderOf[f]]);
  let wrote = 0, kept = 0;
  const write = (file, body) => {
    // the project's own file (one never generated, or one whose banner was taken out) is never written over
    if (fs.existsSync(file) && !fs.readFileSync(file, 'utf8').includes(BANNER)) { kept++; console.log(`kept  ${path.relative(where.repo, file)}: the project's own`); return; }
    fs.writeFileSync(file, body);
    wrote++;
  };
  try {
    for (const [folder, c] of jobs) {
      if (!folder) fail(`${c.component}: its name makes no folder`);
      const into = path.join(dir, folder);
      const sheet = where.paths.componentStyles && path.relative(into, path.join(where.paths.componentStyles, `${folder}.css`));
      const files = filesFor(c, folder, { framework, naming, library, platform: c.platform || platform, stylesheet: sheet && (sheet.startsWith('.') ? sheet : `./${sheet}`), storybook, settings: settingsOf(folder) });
      fs.mkdirSync(into, { recursive: true });
      for (const [f, body] of Object.entries(files)) write(path.join(into, f), body);
    }
    if (framework === 'web-components' && jobs.length) write(path.join(dir, 'dom.js'), DOM);
  } catch (e) { fail(e.message); }
  console.log(`to-markup: ${wrote} file(s) written, ${kept} kept, ${framework}`);
}
