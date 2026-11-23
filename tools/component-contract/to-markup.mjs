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
import { namer, partSeg, copyOf, markupOrder, partsOf, childrenOf, entryOf, controlOf, selectorOf, nestedSelector, ringOf, placedIn, PREFIX, said, HOUSE, pseudoClasses, disabledKey } from './to-code.mjs';
import { officials, homeIn } from './official.mjs';
import { partName, figmaWord, camel, placedOf } from './layers.mjs';

const require = createRequire(import.meta.url);
const MODES = require('../tokens/modes.cjs');
const { atProps, asPlaced } = require('./derive.cjs');
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
    // a string with no default of its own draws its layer's words (a placeholder's "Search")
    else if (p.type === 'string') { const t = (c.anatomy[(p.sets || [])[0]] || {}).content; out.push({ ...base, type: 'string', default: p.default ?? (typeof t === 'string' && !/^\{.+\}$/.test(t) ? t : '') }); }
    else if (p.type === 'number') out.push({ ...base, type: 'number', default: Number.isFinite(Number(p.default)) ? Number(p.default) : 0 });
    else if (p.type === 'instance') out.push({ ...base, ...swapOf(c, p, library, lang) });
    else if (p.type === 'slot') out.push({ ...base, type: 'node', slot: slotPartOf(c, key), slots: slotParts(c, key) });
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
/* A combination that is a pointer state (a hover, a focus; partsOf's own test): what is drawn there no markup holds. */
export const pointerWords = (c, when) => Object.entries(when || {}).some(([k, v]) => ((c.props || {})[k] || {}).role === 'interaction' && (((c.props || {})[k] || {}).pointer || []).includes(v));

/* A part inside a placed component that no prop of that component carries (an avatar's icon shown in a switcher
   that has no prop for it): an override the markup cannot pass, so the generated code leaves it to the developer,
   named as a gap. `mainOf` is a component's contract by its name. Tested by test-to-markup.mjs. */
/* The placed component a part is held to: outside any slot, the outermost it sits in; in a slot this component fills
   (a menu's items), the one placed in that fill (an item, its avatar the override); a slot's own sample, none. */
export function overrideHost(c, id) {
  const parts = partsOf(c), part = parts.get(id);
  if (!part || !part.inside) return null;
  if (!part.slotted) return part.inside;
  if (!(parts.get(part.slotted) || {}).inside) return null;
  let host = null;
  for (let up = part.e.parent; up && up !== part.slotted; up = ((parts.get(up) || {}).e || {}).parent) if ((((parts.get(up) || {}).e) || {}).kind === 'instance') host = up;
  return host;
}

export function unexposed(c, id, mainOf) {
  const parts = partsOf(c), part = parts.get(id);
  const host = overrideHost(c, id);
  if (!host) return false;
  const he = (parts.get(host) || {}).e || {};
  const main = mainOf(he.component, he.key);
  if (!main) return false;
  const rel = id.slice(host.length + 1);
  const props = Object.values(main.props || {});
  // a part the component draws in one of its variants is passed by that variant's prop, and a field a variant sets or
  // draws it with, by that field's; never a pointer state's (hover is no value markup passes)
  const passing = (main.variants || []).filter((v) => !pointerWords(main, v.when));
  // (one drawn only in a variant is held, as one of its base, to the part the component draws at the instance's props)
  const added = passing.some((v) => (v.add || {})[rel]);
  const own = (main.anatomy || {})[rel] || (added ? atProps(main, he.with)[rel] : undefined);
  if (added && !own) return false;
  // (a variant that adds the part draws a field it names only at that value: it passes this one only where it is ours)
  const varied = (f) => passing.some((v) => `${rel}.${f}` in (v.set || {}) || ((v.add || {})[rel] && JSON.stringify(v.add[rel][f] ?? null) === JSON.stringify(part.e[f] ?? null) && v.add[rel][f] !== undefined));
  // a part the component does not draw at all: nothing in the markup can pass it ('part', its insides with it)
  if (!own) return 'part';
  // else each field markup would have to pass, held to the prop that passes that field
  const by = (key) => props.some((q) => (q[key] || []).includes(rel));
  const differs = (k) => JSON.stringify(own[k] ?? null) !== JSON.stringify(part.e[k] ?? null);
  if (differs('kind')) return 'part';
  if (differs('component') && !by('swaps') && !varied('component')) return 'part';
  if (differs('content') && !by('sets') && !varied('content')) return 'field';
  // a nested instance's own props reach it through a prop the component passes down to it
  // (each prop it is given on its own: one a variant of the component sets to that value is passed by that variant's
  // prop; one no variant ever sets so, a Type no prop of the list reaches, is not, though another prop of it varies)
  const mine = (part.e.with && typeof part.e.with === 'object') ? part.e.with : {}, theirs = (own.with && typeof own.with === 'object') ? own.with : {};
  const reached = (k) => passing.some((v) => { const w = (v.set || {})[`${rel}.with`] ?? ((v.add || {})[rel] || {}).with; return w && typeof w === 'object' && JSON.stringify(w[k]) === JSON.stringify(mine[k]); });
  const unreached = Object.keys(mine).some((k) => JSON.stringify(mine[k]) !== JSON.stringify(theirs[k] ?? null) && !reached(k));
  if (differs('with') && (!varied('with') || unreached) && !props.some((q) => [...(q.sets || []), ...(q.swaps || [])].some((l) => l.startsWith(`${rel}/`) || l === rel))) return 'field';
  return false;
}

/* A swap: among icons (a component the library does not hold), the icon's name; of a part inside a placed component,
   that component's own prop, passed to it; among the library's components, what is placed. */
function swapOf(c, p, library, lang) {
  const id = (p.swaps || [])[0];
  const e = id && at(c, id);
  for (let up = id && id.includes('/') ? id.slice(0, id.lastIndexOf('/')) : null; up; up = up.includes('/') ? up.slice(0, up.lastIndexOf('/')) : null) {
    const holder = at(c, up);
    if (!holder || holder.kind !== 'instance' || !placedOf(library, holder)) continue;
    const placed = placedOf(library, holder), rel = id.slice(up.length + 1);
    // the placed component's own swap: by the part it swaps, else by its name, as Figma surfaces a nested instance's
    // property under the name it has there
    const [to, q] = Object.entries(placed.props || {}).find(([, x]) => (x.swaps || []).includes(rel)) || Object.entries(placed.props || {}).find(([, x]) => x.type === 'instance' && x.figma && x.figma === p.figma) || [];
    if (!to) break;
    const theirs = propsOf(placed, library, lang).find((x) => x.key === to);
    const given = (holder.with || {})[q.figma];
    return { type: theirs ? theirs.type : 'node', default: given ?? (theirs && theirs.default) ?? '', pass: { part: up, to: theirs ? theirs.name : to } };
  }
  // a swap of a drawing the code takes by name, as an icon is: one no main in the library draws, or one whose main is a
  // drawing alone (no props, no words, nothing placed: an empty state's ghost), where a component is the caller's to place
  const drawing = (m) => m && !Object.keys(m.props || {}).length && Object.values(m.anatomy || {}).every((x) => x && ['container', 'graphic'].includes(x.kind));
  if (e && e.kind === 'instance' && (!placedOf(library, e) || drawing(placedOf(library, e)))) return { type: 'icon', default: e.component || '' };
  // a component of the library's, swapped: content the caller passes, the design's own instance where it passes none
  // (`placed`: each part it swaps drawn so, and the first's component, which a reading of the code takes as its default)
  if (e && e.kind === 'instance' && placedOf(library, e)) {
    const parts = (p.swaps || []).filter((x) => { const y = at(c, x); return y && y.kind === 'instance' && placedOf(library, y); });
    return { type: 'node', placed: { parts, component: e.component } };
  }
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
// every part that shows a slot prop: its own, and another a variant draws in its place (a dialog's content moved to
// the root when immersive: the variant takes the slot's own part away and adds one whose content names it), never a
// placed component's own slot, nor a second one drawn beside the first (the content would show twice)
function slotParts(c, key) {
  const own = slotPartOf(c, key);
  if (!own) return [];
  const all = { ...(c.anatomy || {}), ...Object.assign({}, ...(c.variants || []).map((v) => v.add || {})) };
  const placedIn = (id) => { for (let e = all[id]; e && e.parent; e = all[e.parent]) if ((all[e.parent] || {}).kind === 'instance') return true; return false; };
  const moved = (c.variants || []).flatMap((v) => ((v.remove || []).includes(own) ? Object.entries(v.add || {}) : []))
    .filter(([id, e]) => id !== own && e && e.kind === 'slot' && e.content === `{${key}}` && !placedIn(id)).map(([id]) => id);
  return [...new Set([own, ...moved])];
}


/* A box's children in the one order every variant draws them: to-code's markupOrder, the pass its CSS order is written
   by where no one order keeps every variant's (an icon added before a label, the label's order set after it). */
export { partsOf };

const inOrder = (c, list) => markupOrder(c, list).order;

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
  let cond = gone === 'false' ? add : gone === 'true' ? 'false' : add === 'true' ? not(gone) : add === 'false' ? 'false' : `${wrap(add)} && ${not(gone)}`;
  // a base part one variant takes away and a later one puts back (a bar's menu gone at sm, back at sm with end): drawn
  // there too, but for a narrower removal stacked on it (gone again at sm, end and loading); and so a part only variants
  // draw, where an add narrower than a removal puts it back (a tag's close button gone at outline and disabled, back at
  // medium with them): only those adds, as the broader ones are what the removal takes away
  const narrower = (w) => part.removes.filter((r) => Object.keys(r).length > Object.keys(w).length && Object.entries(w).every(([k, v]) => r[k] === v));
  const putsBack = (w) => part.base || part.removes.some((r) => Object.keys(r).length < Object.keys(w).length && Object.entries(r).every(([k, v]) => w[k] === v));
  const backs = part.adds.filter(putsBack).flatMap((w) => { const [t] = terms([w]); if (!t) return []; const rs = terms(narrower(w)); return [rs.length ? `${wrap(t)} && ${not(any(rs))}` : t]; });
  const back = any(backs);
  if (back !== 'false' && cond !== 'true') cond = cond === 'false' || back === 'true' ? back : `${wrap(cond)} || ${wrap(back)}`;
  // a pointer state that puts the part in (partsOf `pointerShown`, base or added) holds it wherever that state's
  // combination is, past any removal the rest make: the sheet hides it where the contract draws none
  const shown = any(terms(part.pointerShown || []));
  if (shown !== 'false' && cond !== 'true') cond = cond === 'false' || shown === 'true' ? shown : `${wrap(cond)} || ${wrap(shown)}`;
  // (a removal it is put back over rules nothing out for its children: they keep their own)
  return { when: cond === 'true' ? null : cond, unknown, known: { yes: new Set([...known.yes, add]), no: new Set([...known.no, ...(back === 'false' ? no : [])]) } };
}

/* The tree, built once for both frameworks: each element as a tag, its attributes (a literal, or code) and its
   children, printed as JSX or as `h()` calls. */
function build(c, folder, { naming, library = {}, jsx, lang = JS, settings = HOUSE }) {
  const n = namer(folder, naming);
  const props = propsOf(c, library, lang, settings), ref = lang.ref;
  const parts = partsOf(c, settings);
  const entry = entryOf(c);
  const control = controlOf(c.component, placedIn(c));
  const inline = phrasing(c);
  const gaps = [];
  const used = new Set(); // the placed components the markup draws, each imported once
  const kids = childrenOf(parts);
  for (const [up, list] of kids) kids.set(up, inOrder(c, list));
  const seg = (id) => partSeg(c, copyOf(c, id) || id);
  // a part's hook: its class (React) or its data-part (a web component)
  // and the design's own name for a layer whose name its id does not give back (Icon on a part called show-icon-icon), so
  // reading the code back names it as the design does
  // (and where a variant renames it, that variant's name there, the later variant first, as modeAttrs says a mode; one
  // a variant takes away, null, is empty there, which names nothing)
  const nameAttr = (id) => {
    const nm = ((parts.get(id) || {}).e || {}).name;
    const sets = (c.variants || []).filter((v) => v.set && `${id}.name` in v.set).sort((x, y) => !!x.combination - !!y.combination);
    const code = byVariant(sets, (v) => lang.str(v.set[`${id}.name`] || ''), lang.str(nm || ''));
    return code ? [['data-figma-name', { code }]] : nm ? [['data-figma-name', { lit: nm }]] : [];
  };
  const hook = (id) => [...(n.element ? [['data-part', { lit: seg(id) }]] : [['className', { lit: n.part(seg(id)).slice(1) }]]), ...nameAttr(id), ...modeAttrs(id)];
  const named = (key) => props.find((x) => x.key === key);
  // the code that holds at a variant's props (null: never in markup; 'true': always)
  const testOf = (when) => {
    const out = [];
    for (const [k, v] of Object.entries(when)) {
      const x = props.find((y) => y.key === k);
      if (!x) { if (v !== ((c.props || {})[k] || {}).default) return null; continue; }
      out.push(typeof v === 'boolean' ? (v ? ref(x.name) : `!${ref(x.name)}`) : `${ref(x.name)} === ${lang.str(v)}`);
    }
    return out.length ? out.join(' && ') : 'true';
  };
  // a value each variant says in turn over `base`, the later variant first: the code that picks it, null where no variant
  // the markup can test says one
  const byVariant = (sets, valueOf, base) => {
    let code = base, any = false;
    for (const v of sets) { const t = testOf(v.when), w = valueOf(v); if (!t) continue; code = t === 'true' ? w : `${t.includes('&&') || t.includes('===') ? `(${t})` : t} ? ${w} : ${any ? `(${code})` : code}`; any = true; }
    return any ? code : null;
  };
  // a text's words: its property's, else its own, else, where a variant puts it back with other words (a label's * that
  // reads Optional when not required), those there, the later variant first
  const textOf = (id, e, words = []) => {
    // words a pointer state draws (a field's "Search" at focus): no markup holds them, so a gap, never a silent drop
    if ((parts.get(id) || {}).pointerWords) gaps.push(`${partName(id)}'s words change at a pointer state: frontend-build's to add, or the design's to drop`);
    // one text two string props set (a placeholder, and the value a variant shows instead): the one no variant swaps in,
    // and each variant's own where it is drawn
    const xs = props.filter((y) => y.type === 'string' && !y.input && (y.p.sets || []).includes(id));
    if (xs.length) {
      const swapped = (w) => xs.find((y) => `{${y.key}}` === w);
      const first = xs.find((y) => `{${y.key}}` === e.content) || xs.find((y) => !words.some(([, w]) => swapped(w) === y)) || xs[0];
      // (a literal the text holds where every prop setting it is swapped in by a variant, a date field's "Select a
      // date", is drawn as it stands where none is)
      const literal = e.content && !/^\{[^}]*\}$/.test(e.content) && xs.every((y) => words.some(([, w]) => swapped(w) === y));
      let code = literal ? lang.str(e.content) : ref(first.name);
      let nested = false;
      // (and words of its own a variant gives it, a status label's "Incomplete" beside the props' words)
      // (words a prop setting the text gives anyway are that prop's, never written in where the prop was: another prop's
      // first, a variant that gives the text other words being that prop's place, else the one shown otherwise; a
      // choice between the same words is none)
      const holds = (y, w) => ((y.p || {}).default ?? y.default) === w;
      const gives = (w) => (/^\{.*\}$/.test(w) ? undefined : xs.find((y) => y !== first && holds(y, w)) || (holds(first, w) ? first : undefined));
      for (const [when, w0] of words) { const g = gives(w0), w = g ? `{${g.key}}` : w0; const y = swapped(w), t = (y || !/^\{.*\}$/.test(w)) && testOf(when); if (!t) continue; const say = y ? ref(y.name) : lang.str(w); if (say === code) continue; code = t === 'true' ? say : `${t.includes('&&') || t.includes('===') ? `(${t})` : t} ? ${say} : ${nested ? `(${code})` : code}`; nested = true; }
      return { code };
    }
    let code = lang.str(e.content || ''), any = false;
    for (const [when, w] of words) { const t = testOf(when); if (!t) continue; code = t === 'true' ? lang.str(w) : `${t.includes('&&') || t.includes('===') ? `(${t})` : t} ? ${lang.str(w)} : ${any ? `(${code})` : code}`; any = true; }
    return any ? { code } : { lit: e.content || '' };
  };
  // a part's variable modes, each under the attribute the token build writes it as (tools/tokens/modes.cjs): its own,
  // else what a variant sets, the later variant first; one a variant leaves unset is empty there, which no mode matches
  const modeAttrs = (id) => {
    const e = id === 'root' ? (c.anatomy || {}).root || {} : ((parts.get(id) || {}).e || {});
    // (as expand() layers them: a combination last, over the rest)
    const sets = (c.variants || []).filter((v) => v.set && `${id}.modes` in v.set).sort((x, y) => !!x.combination - !!y.combination);
    const keys = new Set([...Object.keys(e.modes || {}), ...sets.flatMap((v) => Object.keys(v.set[`${id}.modes`] || {}))]);
    return [...keys].sort().map((k) => {
      const code = byVariant(sets, (v) => lang.str((v.set[`${id}.modes`] || {})[k] || ''), lang.str((e.modes || {})[k] || ''));
      return [MODES.attribute(k), code ? { code } : { lit: (e.modes || {})[k] || '' }];
    });
  };
  const busy = props.find((x) => x.busy && x.busy.length);
  const busyCode = busy && busy.busy.map((v) => `${ref(busy.name)} === ${lang.str(v)}`).join(' || ');
  const node = (part, holds, fill = false) => {
    const { id, e } = part;
    // (`fill`: what this component puts in a placed component's slot, drawn as that slot's content)
    if (part.ring || ((part.inside || part.slotted) && !fill)) return null;
    if (entry && (id === entry.value || id === entry.placeholder)) return id === entry.value || !at(c, entry.value) ? input() : null;
    if (part.pointerOnly) { gaps.push(`${partName(id)} is drawn only at a pointer state: the stylesheet's, or frontend-build's to add`); return { comment: `frontend-build: ${partName(id)}, drawn only at a pointer state` }; }
    const { when, unknown, known } = conditionOf(c, part, props, holds, lang);
    if (part.pointerGone) gaps.push(`${partName(id)} is taken away at a pointer state: the stylesheet's, or frontend-build's to take away`);
    if (part.pointerShown && (!part.base || part.removes.length)) gaps.push(`${partName(id)} is also drawn at a pointer state: held here, the stylesheet's to show there and hide elsewhere`);
    if (unknown) gaps.push(`${partName(id)} is drawn by whether the field holds a value: the input's own :placeholder-shown, or frontend-build's to say`);
    if (when === 'false') return null;
    const icon = props.find((x) => x.type === 'icon' && (x.p.swaps || []).includes(id));
    const slot = props.find((x) => x.type === 'node' && ((x.slots || [x.slot]).includes(id) || (x.p.swaps || []).includes(id)));
    const tag = e.kind === 'text' || control || inline ? 'span' : 'div';
    let out;
    if (icon || (e.kind === 'instance' && !placedOf(library, e))) {
      gaps.push(`${partName(id)}: draw the icon ${icon ? `its ${icon.name} names` : e.component}, as the project draws icons`);
      // the glyph a variant changes (an alert's error icon): the one its condition draws, else the part's own
      let glyph = icon ? { code: ref(icon.name) } : { lit: e.component };
      if (!icon) for (const v of c.variants || []) {
        const g = (v.set || {})[`${id}.component`], t = typeof g === 'string' && !library[g] && testOf(v.when);
        if (!t) continue;
        // (a nested choice bracketed: PHP 8 refuses an unbracketed one)
        const prev = glyph.code ? `(${glyph.code})` : lang.str(glyph.lit);
        glyph = { code: t === 'true' ? lang.str(g) : `${t.includes('&&') || t.includes('===') ? `(${t})` : t} ? ${lang.str(g)} : ${prev}` };
      }
      // the glyph's own size, where it is drawn at another (a 16 check drawn at 12): which of its set's sizes it is
      // (at any combination: a variant that draws it smaller says the same glyph's size)
      const widths = [e.width, ...(c.variants || []).map((v) => (v.set || {})[`${id}.width`]).filter((w) => w !== undefined)];
      const size = !icon && e.with && e.with.Size !== undefined && widths.some((w) => String(w) !== String(e.with.Size)) && !(c.variants || []).some((v) => `${id}.with` in (v.set || {})) ? String(e.with.Size) : null;
      out = { tag: 'span', attrs: [...hook(id), ['data-icon', glyph], ...(size ? [['data-icon-size', { lit: size }]] : []), ['aria-hidden', { lit: 'true' }]], children: [] };
    } else if (slot) {
      // marked as a slot, so a reading of a component that fills it finds it (from-code)
      out = { tag, attrs: [...hook(id), ...((slot.slots || [slot.slot]).includes(id) ? [['data-slot', { lit: slot.key }]] : [])], children: [lang.php ? { code: `$slots->${slot.name}()`, raw: true } : { code: slot.name }] };
      // a swapped component of the library's: what the caller passes, else the design's own instance, as Figma draws
      // the swap at its default (a snippet takes no markup from its caller: there the slot stays)
      // (each layer the swap drives, and as a variant swaps that instance for another of the library's: instanceOut)
      if (!lang.php && e.kind === 'instance' && slot.p.type === 'instance' && ((slot.placed || {}).parts || []).includes(id) && placedOf(library, e)) {
        const given = `${ref(slot.name)} != null`, gone = `${ref(slot.name)} == null`, and = (t) => (when ? `(${when}) && ${t}` : t);
        return [{ when: and(given), node: out }, ...instanceOut(and(gone))];
      }
    } else if (e.kind === 'instance') {
      return instanceOut(when);
    } else if (e.kind === 'graphic') {
      out = { tag: 'span', attrs: [...hook(id), ['aria-hidden', { lit: 'true' }]], children: [] };
    } else if (e.kind === 'text') {
      out = { tag, attrs: hook(id), children: [textOf(id, e, part.words)] };
    } else {
      out = { tag, attrs: hook(id), children: (kids.get(id) || []).flatMap((k) => node(k, known, fill)).filter(Boolean) };
    }
    return when ? { when, node: out } : out;
    // a placed instance under the condition `w`: each component a variant swaps in where it holds, the base's elsewhere
    // (a list either way)
    function instanceOut(w) {
      // a variant that places another of the library's components here (a card's Elevated state for its Outlined one,
      // an app bar's Text Large at Large): each drawn where its variant holds and no later one swaps it again, the
      // base's where none does, as expand layers them (a combination last)
      // (the combinations last and reversed: of those, the first that holds is drawn, as expand and layers.mjs take it)
      const swaps = (c.variants || []).filter((v) => typeof (v.set || {})[`${id}.component`] === 'string');
      const layers = [...swaps.filter((v) => !v.combination), ...swaps.filter((v) => v.combination).reverse()]
        .map((v) => ({ t: testOf(v.when || {}), e: { ...e, component: v.set[`${id}.component`], key: (v.set || {})[`${id}.key`] ?? null } }))
        .filter((x) => x.t && x.t !== 'false' && placedOf(library, x.e));
      if (layers.some((x) => placedOf(library, x.e) !== placedOf(library, e))) {
        const wrap = (x) => (/^!?[\w$]+$/.test(x) || /^!\([^()]*\)$/.test(x) ? x : `(${x})`), not = (x) => (x === 'true' ? 'false' : /^[\w$]+$/.test(x) ? `!${x}` : `!(${x})`);
        const all = (ts) => { const xs = ts.filter((x) => x !== 'true'); return ts.includes('false') ? 'false' : !xs.length ? 'true' : xs.length === 1 ? xs[0] : xs.map(wrap).join(' && '); };
        // (a later layer at another value of the same prop never holds with this one: not said)
        const one = (t) => /^([\w$.]+) === ("[^"]*"|'[^']*')$/.exec(t), apart = (a, b) => { const x = one(a), y = one(b); return !!x && !!y && x[1] === y[1] && x[2] !== y[2]; };
        const alts = [{ t: all(layers.map((x) => not(x.t))), e }, ...layers.map((x, i) => ({ t: all([x.t, ...layers.slice(i + 1).filter((y) => !apart(x.t, y.t)).map((y) => not(y.t))]), e: x.e }))].filter((x) => x.t !== 'false');
        return alts.map((x) => { const t = all([...(w ? [w] : []), x.t]); const item = placedItem(x.e); return t === 'true' ? item : { when: t, node: item }; });
      }
      const item = placedItem(e);
      return [w ? { when: w, node: item } : item];
    }
    // a placed instance of the library's: the component, the props it is given and what this one puts in its slots
    function placedItem(e) {
      const placed = placedOf(library, e), theirs = propsOf(placed, library, lang, settings);
      const valueOf = (fig, v, w = e.with || {}) => {
        const x = theirs.find((y) => (y.figmas || [y.p.figma]).includes(fig));
        if (!x) return null;
        if (v === undefined) return [x.name, { lit: undefined }];
        // Figma's word for it ("False", "Secondary") as the placed component's own value in code; a pointer state the browser's
        if (x.type === 'boolean') return [x.name, { lit: v === true || /^true$/i.test(String(v)) }];
        // a placed field's Value is its input's first text, and only where the instance is drawn holding one
        if (x.type === 'value') { const f = entryOf(placed), on = f && w[(placed.props[f.flag] || {}).figma]; return f && String(on).toLowerCase() === String(f.on) ? [jsx ? 'defaultValue' : 'value', { lit: v }] : null; }
        const i = (x.p.figmaValues || []).indexOf(v), lit = i >= 0 ? x.p.values[i] : v;
        return x.type === 'enum' && !x.values.includes(lit) ? null : [x.name, { lit }];
      };
      // a value a variant sets on the placed component (a selected list item selects its checkbox): the value at each of
      // those props, the base's elsewhere, said by this component's props; a variant at a prop code has no name for (a
      // pointer state) is the stylesheet's, not the markup's
      // each variant that states the instance's props (a whole `with`, one of them, or the `with` it adds the instance
      // with), in the order the props resolve them (expand: later layers over earlier, a combination's last): the first of
      // this list that holds wins
      // (a layer's `with` replaces the one before it whole, as expand applies it: a prop it leaves out is the placed
      // component's default there)
      const stated = (v) => {
        // (a variant that sets it to null draws the instance at its own defaults: every prop the base gives it, unset)
        if ((v.set || {})[`${id}.with`] === null) return { when: v.when || {}, w: {}, sets: new Set(Object.keys(e.with || {})) };
        const whole = (v.set || {})[`${id}.with`] ?? ((v.add || {})[id] || {}).with;
        if (!whole || typeof whole !== 'object') return { when: v.when || {}, w: {}, sets: new Set() };
        return { when: v.when || {}, w: whole, sets: new Set([...Object.keys(e.with || {}), ...Object.keys(whole)]) };
      };
      const vs = c.variants || [];
      // (a combination is drawn alone, the first that holds: one that holds and states nothing here still shadows the next,
      // so the layers below it give the value there)
      const combos = vs.filter((v) => v.combination).map(stated), varied = vs.filter((v) => !v.combination).reverse().map(stated).filter(({ sets }) => sets.size);
      const litCode = (l) => (l === undefined ? (lang.php ? 'null' : 'undefined') : typeof l === 'boolean' || typeof l === 'number' ? String(l) : lang.str(String(l)));
      const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
      const figs = [...new Set([...Object.keys(e.with || {}), ...[...combos, ...varied].flatMap(({ sets }) => [...sets])])];
      // (a choice that always holds ends the chain: what follows it is never reached)
      const chain = (all, end) => { const k0 = all.findIndex(([t]) => t === 'true'), alts = k0 < 0 ? all : all.slice(0, k0), last = k0 < 0 ? end : (typeof all[k0][1] === 'string' ? all[k0][1] : litCode(all[k0][1][1].lit)); return alts.reduceRight((acc, [t, g], k) => `${/^[\w$!.]+$/.test(t) ? t : `(${t})`} ? ${typeof g === 'string' ? (/\?/.test(g) ? `(${g})` : g) : litCode(g[1].lit)} : ${k === alts.length - 1 && !/\?/.test(acc) ? acc : `(${acc})`}`, last); };
      const given = figs.map((fig) => {
        const base = fig in (e.with || {}) ? valueOf(fig, e.with[fig]) : null, at0 = base ? base[1].lit : undefined;
        // (each as its value in code, so Figma's "False" and false are one value)
        let alts = varied.filter(({ sets }) => sets.has(fig)).map(({ when, w }) => [testOf(when), valueOf(fig, w[fig], w)]).filter(([t, g]) => t && g);
        // one that gives the base's value matters only where one after it, which it outranks, gives another
        alts = alts.filter(([, g], k) => !same(g[1].lit, at0) || alts.slice(k + 1).some(([, h]) => !same(h[1].lit, at0)));
        // the combinations first, up to the last that states this one: each that holds gives its value, or the layers' below
        const lastCombo = combos.map(({ sets }) => sets.has(fig)).lastIndexOf(true);
        const gate = combos.slice(0, lastCombo + 1).map(({ when, w, sets }) => [testOf(when), sets.has(fig) ? valueOf(fig, w[fig], w) : null]).filter(([t, g]) => t && (g || g === null));
        if (!alts.length && !gate.some(([, g]) => g)) return base;
        const name = (base || (alts[0] || [])[1] || gate.find(([, g]) => g)[1])[0];
        // a flag that follows this component's own: the test itself
        if (!gate.length && alts.length === 1 && alts[0][1][1].lit === true && (at0 === false || at0 === undefined)) return [name, { code: alts[0][0] }];
        // nested choices bracketed, as PHP 8 requires
        const below = chain(alts, litCode(at0));
        const code = gate.length ? chain(gate.map(([t, g]) => [t, g || below]), below) : below;
        return [name, { code }];
      }).filter(Boolean);
      // one icon for a swap Figma keeps per size: the one the instance draws (its glyph's own name, where its insides are
      // stated), else the swap its component draws that part by at the instance's props (Size xs: Icon (16)), else the first
      for (const x of theirs.filter((y) => y.figmas)) {
        // (on any layer the swap drives that the instance states: a nav item swaps its icon and its icon_2, and a
        // selected one states only icon_2's)
        const drawnAs = String((x.p.swaps.map((s) => at(c, `${id}/${s}`)).find((y) => y && y.component) || {}).component || '').split('/').pop();
        const by = (atProps(placed, e.with)[x.p.swaps[0]] || {}).swappedBy, byFigma = by && (placed.props[by] || {}).figma;
        const byValue = byFigma && (e.with || {})[byFigma];
        const mine = given.filter(([k]) => k === x.name), keep = mine.find(([, v]) => String(v.lit) === drawnAs) || (byValue !== undefined && mine.find(([, v]) => String(v.lit) === String(byValue))) || mine[0];
        for (const g of mine) if (g !== keep) given.splice(given.indexOf(g), 1);
      }
      if (iconOnlyOf(placed)) {
        const icon = given.find(([k]) => theirs.some((y) => y.type === 'icon' && y.name === k));
        gaps.push(`${partName(id)}: its aria-label is the icon's name until frontend-build says what it does`);
        given.push(['aria-label', { lit: String(icon ? icon[1].lit : placed.component) }]);
      }
      // what this component puts in the placed one's slot (a menu's items): that slot's content, each drawn as its own
      // component; a snippet's slot takes no markup from its caller, so there it is frontend-build's
      for (const x of theirs.filter((y) => y.type === 'node' && y.slot)) {
        // (under any part that shows that slot: its own, or one a variant draws in its place)
        const { back } = asPlaced(atProps(placed, e.with));
        const under = [...new Set((x.slots || [x.slot]).flatMap((sp) => kids.get(`${id}/${Object.keys(back).find((k) => back[k] === sp) || sp}`) || []))];
        if (!under.length) continue;
        if (lang.php) { gaps.push(`${partName(id)}: what it puts in ${placed.component}'s ${x.name} (a snippet takes no markup there)`); continue; }
        // under the instance's own condition (known), so an item repeats none of it
        const items = under.flatMap((k) => node(k, known, true)).filter(Boolean);
        if (!items.length) continue;
        for (let i = given.length - 1; i >= 0; i--) if (given[i][0] === x.name) given.splice(i, 1);
        given.push([x.name, { nodes: items }]);
      }
      for (const x of props.filter((y) => y.pass && y.pass.part === id && y.type !== 'value')) { const i = given.findIndex(([k]) => k === x.pass.to); if (i >= 0) given.splice(i, 1); given.push([x.pass.to, { code: ref(x.name) }]); }
      used.add(placed.component);
      return { placed: placed, folder: placedFolder(placed), attrs: given, hook: hook(id), own: theirs.map((x) => x.name) };
    }
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
  const hooks = [...props.filter((x) => x.attr).map((x) => [n.attr(x.key), x.type === 'boolean' ? { code: lang.php ? `${ref(x.name)} ? 'true' : 'false'` : `String(${x.name})` } : { code: ref(x.name) }]), ...modeAttrs('root')];
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
  const children = (kids.get('root') || []).flatMap((k) => node(k)).filter(Boolean);
  // an override a placed component has no prop for: the markup cannot pass it (only the outermost such part is named)
  const ancestors = (id) => { const out = []; for (let up = (at(c, id) || {}).parent; up && up !== 'root'; up = (at(c, up) || {}).parent) out.push(up); return out; };
  for (const part of partsOf(c).values()) if (unexposed(c, part.id, (name, key) => placedOf(library, { component: name, key })) && !ancestors(part.id).some((up) => unexposed(c, up, (name, key) => placedOf(library, { component: name, key })) === 'part')) gaps.push(`${partName(part.id)}: drawn here inside ${partName(overrideHost(c, part.id))}, which has no prop for it — an override frontend-build adds, or a prop to give that component`);
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
  const attr = ([k, v]) => (v.nodes ? ` ${k}={<>\n${v.nodes.map((x) => jsxOf(x, depth + 2)).join('\n')}\n${pad}  </>}` : v.lit === true ? ` ${k}` : typeof v.lit === 'boolean' || typeof v.lit === 'number' ? ` ${k}={${v.lit}}` : v.lit !== undefined ? ` ${k}=${/^[^"{}<>&\\\n\r\t]*$/.test(v.lit) ? str(v.lit) : `{${str(v.lit)}}`}` : ` ${k}={${v.code}}`);
  if (item.placed) {
    // its class and its layer name; data-part is the element's own, and a placed component renders its own root
    const own = item.hook.filter(([k]) => k === 'className' || k === 'data-figma-name' || (k.startsWith('data-') && k !== 'data-part'));
    return `${pad}<${pascal(item.placed.component)}${own.map(attr).join('')}${item.attrs.map(attr).join('')} />`;
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
  const obj = (list) => `{ ${list.map(([k, v]) => `${IDENT.test(k) ? k : str(k)}: ${v.nodes ? `[${v.nodes.map((x) => hOf(x, 0)).join(', ')}]` : v.lit !== undefined ? str(v.lit) : v.code}`).join(', ')} }`;
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
    // (a variant that places a sibling of its own set calls this file's own function: no import of itself)
    ...placed.filter((p) => library[p].component !== c.component).map((p) => `import { ${fnOf(library[p])} } from '../${placedFolder(library[p])}/${placedFolder(library[p])}.js';`),
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
export function partSelector(c, n, id, part = partsOf(c).get(id), library = {}) {
  const entry = entryOf(c), first = copyOf(c, id), mains = (name, key = null) => placedOf(library, { component: name, key });
  if (id === 'root' || (part && part.ring)) return selectorOf(c, n, 'root');
  if (entry && (id === entry.value || id === entry.placeholder)) return selectorOf(c, n, entry.input, mains, library);
  if (!first) return selectorOf(c, n, id, mains, library);
  const s = selectorOf(c, n, first, mains, library), seg = n.part(partSeg(c, first)), i = s.lastIndexOf(seg) + seg.length;
  return `${s.slice(0, i)}:nth-child(${Number(/_(\d+)$/.exec(id)[1])} of ${seg})${s.slice(i)}`;
}

/* The parity mapping (tools/parity/REFERENCE.md, The mapping format), keyed by Figma's own names: every axis and its every
   option, so the run measures the whole set (code-standard rule 33), each by the args its story takes; every layer by
   the selector the sheet styles it by (to-code's). */
export function toParity(c, folder, { naming, library = {}, platform = null, framework = 'react', settings = HOUSE } = {}) {
  const n = namer(folder, naming);
  // each variant's args by the names its markup takes: a snippet's variables, where those differ
  const props = propsOf(c, library, framework === 'kirby' ? PHP : JS, settings);
  const byKey = new Map(props.map((x) => [x.key, x]));
  const entry = entryOf(c);
  // the mapping's `pseudo` is the class without its colon (tools/parity/REFERENCE.md, The mapping format)
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
  const parts = partsOf(c, settings);
  const root = selectorOf(c, n, 'root');
  // a layer as the store spells its path (tools/parity layers.mjs): a repeat by its number, Item#2
  const nameOf = (id) => { const e = (parts.get(id) || {}).e || {}; const m = /_(\d+)$/.exec(id); return (e.name || partName(id)) + (m ? `#${m[1]}` : ''); };
  const pathOf = (id) => { const names = []; for (let up = id; up && up !== 'root'; up = (parts.get(up) || {}).e?.parent) names.unshift(nameOf(up)); return names.join(' > '); };
  const layers = {}, byId = {};
  const mains = (name, key = null) => placedOf(library, { component: name, key });
  // what this component puts in a placed component's slot, at any depth there: that slot's selector, then each box's own
  // hook down to it; inside an instance it puts there, that instance's own (not read here)
  const fillSelector = (id) => {
    const chainUp = [];
    for (let up = id; up; up = (parts.get(up) || {}).e?.parent) {
      const e = (parts.get(up) || {}).e || {}, p = (parts.get(e.parent) || {}).e || {};
      chainUp.unshift(up);
      if (p.kind === 'slot') { const s = nestedSelector(c, n, e.parent, mains, library); if (!s) return null; if (chainUp.slice(0, -1).some((k) => ((parts.get(k) || {}).e || {}).kind === 'instance')) return null; return [s, ...chainUp.map((k) => n.part(partSeg(c, copyOf(c, k) || k)))].join(' > '); }
    }
    return null;
  };
  for (const x of parts.values()) {
    if (x.id === 'root') continue;
    // a part the contract keeps inside a placed component is an override there: read where the sheet writes it
    // and what it puts in a placed component's slot (a menu's items), by its own hook under that slot
    const nested = (x.inside && x.slotted && fillSelector(x.id)) || (x.inside && nestedSelector(c, n, x.id, mains, library));
    const at = nested ? nested : x.inside ? { skip: `drawn by ${((parts.get(x.inside) || {}).e || {}).component}, compared in its own mapping` }
      : x.slotted ? { skip: 'a sample of what a caller puts in the slot' }
      : x.pointerOnly && !x.ring ? { skip: 'drawn only at a pointer state: frontend-build adds it' }
      : partSelector(c, n, x.id, x, library);
    layers[pathOf(x.id)] = at;
    // each part's selector by its id too (not in the mapping written): a stored path may be two parts never drawn
    // together, where the self leg needs each one's own (from-code swapPartsOf)
    if (typeof at === 'string') byId[x.id] = at;
  }
  return Object.defineProperty({ storyId: storyIdOf(titleOf(c, platform), 'Default'), root, state: root, axes, layers, waivers: {} }, 'byId', { value: byId });
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

if (process.argv[1] && (() => { try { return fs.realpathSync(process.argv[1]); } catch { return null; } })() === fileURLToPath(import.meta.url)) {
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
  for (const f of stored) { const x = of(JSON.parse(fs.readFileSync(path.join(dir, f, 'contract.json'), 'utf8'))); x.folder ||= f; library[x.component] = x; folderOf[f] = x; }
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
