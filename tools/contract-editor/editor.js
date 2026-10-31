import { blocks, libraryBlocks, suggest, toContract, fromContract, problems, move, kebab, camel, draft, applyKind, kindOf, contractProblems, CODE_ONLY, SIDES } from './props.mjs';
import { icon } from './icons.mjs';
import { part, root, tree, homes, holds, ids, partProblems, forField, preview, fromAnatomy, place, variantParts, partName, KINDS as PART_KINDS } from './anatomy.mjs';
import { expand, choosers, variantKeys, defaults, offDefault, setField, unset, changed, same, keyDiff, removeAt, restoreAt, moveAt, crossings } from './variants.mjs';

const $ = (sel, root = document) => root.querySelector(sel);
const el = (tag, attrs = {}, ...kids) => {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (k === 'text') e.textContent = v;
    else e.setAttribute(k, v === true ? '' : v);
  }
  e.append(...kids.flat().filter((k) => k != null));
  return e;
};
const withSvg = (e, paths) => { e.insertAdjacentHTML('afterbegin', `<svg viewBox="0 0 24 24" class="ce-glyph" aria-hidden="true">${paths}</svg>`); return e; };
const withIcon = (e, id) => { e.insertAdjacentHTML('afterbegin', icon(id)); return e; };
const KEY = 'contract-editor:draft';

let state = { component: '', drafts: [], base: {}, parts: [root()] };
let view = 'props';
// the combination the Variants tables show, by prop: the defaults to begin with
let filterAt = null;
// the Variants grid crosses the on/off properties too, those that only show and hide parts (Propstar's table does)
let withBooleans = false;
const flags = (c) => choosers(c).filter((x) => c.props[x.key].type === 'boolean' && !variantKeys(c).includes(x.key)).map((x) => x.key);
// what is drawn, an on/off property's parts gone where it is off, and what is inside them
// (a copy: at the defaults expand hands back the contract's own anatomy)
const shownAt = (c, values, from) => {
  const drawn = { ...from };
  for (const k of flags(c)) {
    const p = c.props[k];
    if ((k in values ? values[k] : p.default) !== false) continue;
    for (const id of p.shows || []) for (const x of Object.keys(drawn)) if (x === id || x.startsWith(id + '/')) delete drawn[x];
  }
  return drawn;
};
const filterStart = (c) => { const d = defaults(c); return Object.fromEntries(variantKeys(c).filter((k) => k in d).map((k) => [k, d[k]])); };
let tokens = { colours: [], lengths: [], shadows: [], textStyles: [], uses: {} };
const tokensFor = (kind, field) => forField(tokens[kind], (tokens.uses || {})[field], field);
let palette = [];
let library = [];
// the project's docs site and each component's page there (serve.mjs docsOf); null where it has none built
let docs = null;
const allBlocks = () => [...palette, ...library];
const kinds = () => allBlocks().filter((b) => b.group === 'Kinds');
const kindLabel = (id) => (kinds().find((b) => b.id === id) || {}).label || id;

// a run the server is doing, in sight at the foot of the page with how long it has taken, until it ends: shown only
// past a second and then held half a second, so a quick run does not flash (knowledge actions.md, Delay, then hold).
// One at a time: while one runs, the sync menus offer no other
let running = null, hideBusy = 0;
function busy(text) {
  const box = $('[data-busy]'), t0 = Date.now();
  let shown = 0;
  running = text;
  clearTimeout(hideBusy);
  const say = () => { $('[data-busy-text]').textContent = `${text} ${Math.round((Date.now() - t0) / 1000)} s`; };
  const show = setTimeout(() => { say(); box.hidden = false; shown = Date.now(); }, 1000);
  const tick = setInterval(say, 1000);
  return () => { running = null; clearTimeout(show); clearInterval(tick); hideBusy = setTimeout(() => { box.hidden = true; }, shown ? Math.max(0, 500 - (Date.now() - shown)) : 0); };
}
const status = (msg) => { $('[data-status]').textContent = ''; requestAnimationFrame(() => { $('[data-status]').textContent = msg; }); };
// the drafts themselves, not the contract they write, so a reload loses nothing the contract drops (a code name's spelling, a pointer state not listed yet)
// this browser's storage, which may be off: the page works without it
// true when kept: a full or switched-off store says no, and a caller that cannot do without it says so
const store = (k, v) => { try { localStorage.setItem(k, v); return true; } catch { return false; } };
// a search finds a name holding every word typed, in any order: "bac wa" finds Background/warning
const holdsWords = (name, q) => q.split(/\s+/).every((w) => name.toLowerCase().includes(w));
const recall = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
// the page is the tab's own, so a reload goes on with this tab's work, never another's; a new tab begins from the last kept
const keepPage = (k, v) => { try { sessionStorage.setItem(k, v); } catch { /* the tab's own store off: the browser's still has it */ } return store(k, v); };
const recallPage = (k) => { try { const v = sessionStorage.getItem(k); if (v !== null) return v; } catch { /* as below */ } return recall(k); };
// the draft first, so the page kept carries its draft's id and a reload goes on with the same draft
const save = () => { autoDraft(); keepPage(KEY, JSON.stringify(state)); };
const find = (uid) => state.drafts.findIndex((d) => d.uid === uid);

/*
 * The page in two halves (design-standard rule 13): the props are read-only
 * rows, each set up in a dialog, opened by dropping a block, clicking a row,
 * or Edit in its menu. The parts are drawn: the component large on a stage,
 * a part chosen on it or in the tree, and its look listed beside, at any
 * combination of the props' values.
 */

/* ── the output: the JSON, the counts, and which rows still have a problem ── */
/*
 * The page's history, for Ctrl+Z (⌘Z) and Shift+Ctrl+Z: the page as it was before each change, a step each, what is
 * typed into one field one step, begun again for each component opened. A text field keeps its own undo of what is
 * typed in it.
 */
const typing = () => { const f = document.activeElement; return f && f.matches('textarea, input:not([type=radio], [type=checkbox], [type=button])') ? f : null; };
let past = [], future = [], kept = null, keptIn = null, historyOf = null;
const snapshot = () => JSON.stringify({ component: state.component, drafts: state.drafts, base: state.base, parts: state.parts });
function remember() {
  const now = snapshot();
  if (historyOf !== state) { historyOf = state; past = []; future = []; kept = now; keptIn = null; return; }
  if (now === kept) return;
  const field = typing();
  if (!field || field !== keptIn) past.push(kept);
  kept = now; keptIn = field; future = [];
}
function travel(from, to, word) {
  if (readOnly()) return;
  if (!from.length) { status(`Nothing to ${word}.`); return; }
  to.push(kept);
  kept = from.pop(); keptIn = null;
  Object.assign(state, JSON.parse(kept));
  if (partOpen()) renderParts(); else renderView();
  status(`${word[0].toUpperCase()}${word.slice(1)}ne.`);
}
addEventListener('keydown', (e) => {
  if (!(e.metaKey || e.ctrlKey) || e.altKey || !['z', 'y'].includes(e.key.toLowerCase())) return;
  if (e.target === typing()) return;
  e.preventDefault();
  if (e.key.toLowerCase() === 'y' || e.shiftKey) travel(future, past, 'redo'); else travel(past, future, 'undo');
});

function refresh() {
  const all = problems(state.component, state.drafts);
  // the name follows the page whichever tab redrew it; while it is typed it already matches
  if ($('[data-component]').value !== state.component) $('[data-component]').value = state.component;
  // "true", which a screen reader reads; an empty value reads as false
  if (state.drafts.length > 0 && all.some((p) => p.field === 'component')) $('[data-component]').setAttribute('aria-invalid', 'true'); else $('[data-component]').removeAttribute('aria-invalid');
  // a library component opens to be read, as Dev Mode shows it; Edit as draft makes a draft linked to it, which can
  // update it in the library
  const ro = readOnly();
  $('[data-edit-draft]').hidden = !ro;
  $('[data-save-official]').hidden = !(source === 'contract' && linkedTo() && !fromCode());
  renderBehind();
  // being read, a library component links to where the team reads it: its page in the docs site
  const page = ro && docs && docs.pages[state.component];
  $('[data-docs]').hidden = !page;
  if (page) $('[data-docs]').href = docs.url + page;
  const linked = linkedTo();
  // a component only the code has says so, being read and as a draft: there is no library component to update
  const said = linked ? (fromCode() ? `Drafted from ${linked.component} in code` : `Linked to ${linked.component} in the library`) : ro && fromCode() ? 'Only in code: read from its story' : '';
  $('[data-linked]').hidden = !said;
  $('[data-linked]').textContent = said;
  document.querySelector('.ce').toggleAttribute('data-read-only', ro);
  $('[data-empty] h3').textContent = ro ? 'No props' : 'Add the first prop';
  $('[data-empty] p').textContent = ro ? 'It takes no properties: it is drawn one way.' : 'Drag a block here, or click one in the panel.';
  $('[data-component]').readOnly = ro;
  $('[data-component]').tabIndex = ro ? -1 : 0;
  $('[data-json]').readOnly = ro;
  // the JSON follows the page unless it is being edited by hand: then it waits for Apply or Undo edits
  if (!jsonEdited) $('[data-json]').value = JSON.stringify(toContract(state.component, state.drafts, state.base, state.parts), null, 2);
  $('[data-count]').textContent = state.drafts.length ? `(${state.drafts.length})` : '';
  $('[data-part-count]').textContent = state.parts.length > 1 ? `(${state.parts.length - 1})` : '';
  // what the page holds now: the variants left after a prop deleted, named as renamed
  const vn = (contractNow().variants || []).length;
  $('[data-variant-count]').textContent = vn ? `(${vn})` : '';
  // a row with a problem says which, in place of its summary, until it is fixed
  const flag = (list, found) => {
    for (const row of list.querySelectorAll('[data-uid]')) {
      const p = found.find((x) => x.uid === row.dataset.uid);
      const cell = row.querySelector('.ce-row__summary');
      row.toggleAttribute('data-invalid', !!p);
      if (!cell) continue;
      if (!('summary' in cell.dataset)) cell.dataset.summary = cell.textContent;
      cell.textContent = p ? p.message : cell.dataset.summary;
      cell.title = cell.textContent;
    }
  };
  remember();
  // kept first: nothing drawn after can cost the work
  save();
  renderPreview();
  if (partOpen()) renderStage();
  flag($('[data-list]'), all);
  flag($('[data-parts]'), partProblems(state.parts));
}

/* ── the preview: the anatomy drawn with the project's own token values, at the props' defaults ── */
// a component placed in this one, read from its own contract when the library has one
// read once per library, as every redraw of the preview asks again
const nestedCache = new Map();
let icons = new Set();
// the page's scheme: the theme chosen in the bar (theme.js), else the reader's setting
const isDark = () => document.documentElement.dataset.theme ? document.documentElement.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
// the icon set's size axis, as the library names it (its settings' sizeAxis); none named, an icon is sized by its width alone
let sizeAxis = null;
function nestedContract(name, values = {}) {
  if (!nestedCache.has(name)) {
    const c = libraryContracts.find((x) => x.component === name);
    nestedCache.set(name, c ? { c, drafts: fromContract(c).drafts } : null);
  }
  const n = nestedCache.get(name);
  if (!n) return null;
  // the instance's own values in place of the defaults: its words, its swap, its on/off and option
  const drafts = n.drafts.map((d) => (d.name in values ? { ...d, default: d.type === 'boolean' ? values[d.name] === 'True' || values[d.name] === true : values[d.name] } : d));
  // drawn as its variant at those values, the parts an on/off shows and an option's look with it
  return { parts: fromAnatomy(drawnAt(n.c, values), drafts, n.c.props || {}), drafts };
}
// a placed component's anatomy at its instance's values, written as Figma names them (Show icon: True, Size: lg)
function drawnAt(c, values = {}) {
  const at = {};
  for (const [k, p] of Object.entries(c.props || {})) {
    const v = values[p.figma || k];
    if (v == null) continue;
    if (p.type === 'boolean') at[k] = v === true || String(v).toLowerCase() === 'true';
    else if (p.type === 'enum') at[k] = p.figmaValues && p.values ? p.values[p.figmaValues.indexOf(v)] ?? v : v;
  }
  return expand(c, at);
}
// a component's preview the snapshot drew (serve.mjs previews), in the page's scheme where it drew a dark one too
let previews = {};
const imageOf = (name, dark) => { const p = name && previews[name]; return p ? `preview.png?label=${encodeURIComponent(connected)}&file=${encodeURIComponent(p.file)}${dark && p.dark ? '&dark=1' : ''}` : null; };
// an icon the project keeps: its name's last segment, at the size asked for or the nearest it has
function iconOf(name, size) {
  const base = name.split('/').pop();
  const at = [size, ...iconSizes(name)].find((z) => z && icons.has(`${base}-${z}`));
  const file = at ? `${base}-${at}` : icons.has(base) ? base : null;
  return file ? `icon.svg?label=${encodeURIComponent(connected)}&file=${encodeURIComponent(file)}` : null;
}
/*
 * One part of a preview tree as its kind is drawn; one its on/off prop hides
 * by default is drawn as any part, its title saying the prop that shows it. `key` names a part for the page to find it by;
 * the layers of a placed component are that component's, and name none.
 */
function drawPart(n, key = (x) => x.uid) {
  const pv = key && key(n);
  const shape = () => {
    // an empty box is drawn at a size to see, unless it has one: its own, or its container's as a layer laid over it (an avatar's image)
    if (n.kind === 'container') return el('div', { class: 'ce-pv' + (n.children.length || n.style.width || n.style.height || n.style.position === 'absolute' ? '' : ' ce-pv--empty'), style: css(n.style), title: n.name, 'data-pv': pv }, ...n.children.map((x) => drawPart(x, key)));
    if (n.kind === 'text') return el('span', { class: 'ce-pv' + (n.style.width ? ' ce-pv--clip' : ''), style: css(n.style), title: n.name, text: n.text, 'data-pv': pv });
    // an icon the project keeps as an SVG, drawn in its colour through a mask
    // the mask on a layer of its own: a masked box masks its outline too, and the part chosen could not be seen
    if (n.kind === 'instance' && n.icon) return el('span', { class: 'ce-pv ce-pv--icon', style: css({ width: '20px', height: '20px', ...n.style }), title: n.text, 'data-pv': pv },
      el('span', { class: 'ce-pv--glyph', style: css({ width: '100%', height: '100%', maskImage: `url("${n.icon}")` }) }));
    if (n.kind === 'instance') return n.inner ? el('div', { class: 'ce-pv', style: css({ ...n.inner.style, ...n.style }), title: n.text, 'data-pv': pv }, ...n.inner.children.map((x) => drawPart(x, null)))
      : el('span', { class: 'ce-pv ce-pv--instance', style: css(n.style), title: n.text, 'data-pv': pv, text: n.text.split('/').pop() });
    if (n.kind === 'graphic') return el('span', { class: 'ce-pv ce-pv--vector', style: css(n.style), title: n.name, 'data-pv': pv });
    // a slot drawn with what it holds by default, outlined; an empty one says what fills it
    if (n.children.length) return el('div', { class: 'ce-pv ce-pv--slotted', style: css(n.style), title: n.text, 'data-pv': pv }, ...n.children.map((x) => drawPart(x, key)));
    const { padding, ...own } = n.style;
    return el('span', { class: 'ce-pv ce-pv--slot', style: css({ ...own, display: 'inline-grid' }), title: n.name, text: n.text, 'data-pv': pv });
  };
  const e = shape();
  if (n.image) e.classList.add('ce-pv--image');
  if (n.picture) Object.assign(e.style, { backgroundImage: `url("${n.picture.url}")`, backgroundSize: n.picture.fit, backgroundPosition: 'center', backgroundRepeat: 'no-repeat' });
  // a part hidden by default says the prop that shows it
  if (n.off) { e.setAttribute('data-off', ''); e.title = `${n.name}: shown when ${n.off} is on`; }
  return e;
}
function renderPreview() {
  // the default variant: a part only other variants draw is listed in the tree, not drawn here, in a flow it is not in
  const tree = preview(state.parts, state.drafts, tokens, { dark: isDark(), nested: nestedContract, iconOf, imageOf, sizeAxis, name: state.component.trim() });
  const draw = (n) => drawPart(n);
  // nothing drawn yet: the stage says so, centred, an icon over the words
  const r = state.parts.find((p) => p.uid === 'root') || {};
  const styled = r.background || r.radius || (r.layout && (r.layout.gap || r.layout.padding));
  if (state.parts.length < 2 && !styled) {
    $('[data-out="preview"]').replaceChildren(el('div', { class: 'ce-preview__stage ce-preview__stage--empty' },
      withIcon(el('p', { class: 'ce-preview__empty' }, el('span', { text: 'Add parts in Anatomy to draw the component here, with the project\'s tokens.' })), 'container')));
    return;
  }
  $('[data-out="preview"]').replaceChildren(el('figure', { class: 'ce-preview__sketch' },
    el('div', { class: 'ce-preview__stage' }, tree ? draw(tree) : null),
    el('figcaption', { text: 'Sketched from the contract: its structure and tokens, not its look' })));
}
const css = (style) => Object.entries(style).map(([k, v]) => `${k.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase())}: ${v}`).join('; ');

/* ── the form controls a dialog is built from ───────────────────────────── */
const field = (label, control, cls = '') => el('label', { class: 'ce-field ' + cls }, el('span', { text: label }), control);
/* A box holding one control: the box's title is its label, said once (the label stays for screen readers). */
const only = (title, control) => el('fieldset', { class: 'ce-box' }, el('legend', { text: title }), el('label', { class: 'ce-field' }, el('span', { class: 'visually-hidden', text: title }), control));
/* A kind chosen as the panel's tiles are drawn: an icon over its name, radios underneath. */
const tileOf = (name, value, set) => ([v, text, ic]) => el('label', { class: 'ce-tile' },
  el('input', { type: 'radio', name, value: v, checked: v === value, 'data-tile': v, onchange: () => set(v) }),
  withIcon(el('span', {}, el('span', { text })), ic));
/*
 * Every kind in sight in one grid of equal tiles (knowledge: selection,
 * *Option tiles*), in the palette's order: Figma and code, code only, Figma
 * only. Exists in, under the form, says which side the one chosen is on.
 */
function kindTiles(name, value, set) {
  const order = SIDES.map(([side]) => side);
  return el('fieldset', { class: 'ce-box ce-tiles' }, el('legend', { text: 'Kind' }),
    el('div', { class: 'ce-tiles__grid', role: 'radiogroup', 'aria-label': 'Kind' },
      ...[...kinds()].sort((x, y) => order.indexOf(x.side) - order.indexOf(y.side)).map((b) => tileOf(name, value, set)([b.id, b.label, b.id]))));
}

/* One idea of a form, boxed: its title, then its fields, stacked. */
// a box's one field whose label is the box's title keeps that label for screen readers only, so it is not shown twice
const box = (title, ...kids) => {
  const fields = kids.flat().filter(Boolean);
  const label = fields.length === 1 && fields[0].matches('.ce-field') && fields[0].firstElementChild;
  if (label && label.textContent === title) label.classList.add('visually-hidden');
  // a box whose fields were all left out (no prop of their kind to link) is left out too
  if (!fields.length) return null;
  return el('fieldset', { class: 'ce-box' }, el('legend', { text: title }), ...fields);
};

/*
 * A choice of two to four, all in sight in one row: the docs site's segmented control, its native radios kept
 * for the keys and for screen readers. A long list stays a column of radios.
 */
function choice(label, name, options, value, set, cls = '', { list = false } = {}) {
  return el('fieldset', { class: 'ce-choice ' + cls },
    el('legend', { text: label }),
    el('div', { class: list ? 'ce-choice__options' : 'segmented ce-segmented' }, ...options.map(([v, text]) => el('label', { class: list ? 'ce-pill' : 'seg' },
      el('input', { type: 'radio', name, value: v, checked: v === value, 'data-choice': name.split('-')[0] + '-' + v, onchange: () => set(v), class: list ? null : 'visually-hidden' }),
      el('span', { text })))));
}

/*
 * The dialog. One for the page: a title, the form, its problems, and Cancel
 * beside the action. The action checks the form first, and a problem keeps
 * the dialog open with focus on the field it names.
 */
let dialogSave = null;
// where focus goes once the dialog has closed: closing hands focus back to whatever opened it, so a move made before it is undone
let refocus = null;
let jsonEdited = false;
let dialogChanged = () => false;
let dialogWarned = false;
const keepEdits = (e) => e.preventDefault();
// the JSON edited by hand, or not: Apply and Undo edits show only while it is
function edited(on) {
  jsonEdited = on;
  (on ? addEventListener : removeEventListener)('beforeunload', keepEdits);
  $('[data-json-apply]').hidden = !on;
  $('[data-json-revert]').hidden = !on;
  if (!on) { $('[data-json-errors]').replaceChildren(); $('[data-json]').removeAttribute('aria-invalid'); }
}
let dialogDelete = null;
// tall: a form whose content changes as it is filled, given its largest height so it never moves (dialogs: Centred without jumping)
// work: what the form edits, so a stray click or Escape can tell a changed form from one only looked at
// view: a dialog only to read, with Close and no action
function openDialog(title, action, body, onSave, { onDelete = null, deleteWord = 'Delete', tall = false, work = null, view = false } = {}) {
  const d = $('[data-dialog]');
  d.toggleAttribute('data-tall', tall);
  const was = work && JSON.stringify(work);
  dialogChanged = () => (work ? JSON.stringify(work) !== was : false);
  dialogWarned = false;
  dialogDelete = onDelete;
  $('[data-dialog-delete]', d).hidden = !onDelete;
  $('[data-dialog-delete]', d).textContent = deleteWord;
  $('[data-dialog-title]', d).textContent = title;
  $('[data-dialog-save]', d).textContent = action;
  $('[data-dialog-save]', d).hidden = view;
  $('[data-dialog-cancel]', d).textContent = view ? 'Close' : 'Cancel';
  $('[data-dialog-body]', d).replaceChildren(body);
  $('[data-dialog-errors]', d).replaceChildren();
  // a problem is gone once its field is changed; the check runs again at the action
  body.addEventListener('input', (e) => { const f = e.target.closest('[data-field]'); if (f && f.hasAttribute('aria-invalid')) clearProblems(); });
  dialogSave = onSave;
  if (!d.open) d.showModal();
  // the first field, or, in a dialog with none, its action: never Delete or Discard, which come first in the footer
  const first = $('[data-dialog-body] input:not([type=radio]):not(:disabled), [data-dialog-body] select', d) || $(view ? '[data-dialog-cancel]' : '[data-dialog-save]', d);
  if (first) first.focus();
}
// a field's error, right under its control: an icon and the words, "Error:" said first to a screen reader (forms: error
// messages); written again in place as the field is fixed, and empty once it is
function sayError(p, message) {
  p.replaceChildren(...(message ? [el('span', { class: 'visually-hidden', text: 'Error: ' }), el('span', { text: message })] : []));
  if (message) withIcon(p, 'alert');
  return p;
}
const fieldError = (message, attrs = {}) => sayError(el('p', { class: 'ce-error', ...attrs }), message);
// each problem said under the field it is about, where the eye is; one with no field, at the foot
function dialogProblems(found) {
  clearProblems();
  const body = $('[data-dialog-body]');
  const loose = [];
  found.forEach((p, i) => {
    const f = p.field && $(`[data-field="${p.field}"]`, body);
    if (!f) { loose.push(fieldError(p.message)); return; }
    const id = `field-error-${i}`;
    // right under the control, the options' whole field for one typed into it, before any hint or suggestion below it
    (f.closest('.ce-chips') || f).after(fieldError(p.message, { id, 'data-field-error': true }));
    f.setAttribute('aria-invalid', 'true');
    f.setAttribute('aria-describedby', id);
  });
  $('[data-dialog-errors]').replaceChildren(...loose);
  const first = found[0] && $(`[data-field="${found[0].field}"]`, body);
  if (first) first.focus();
}
function clearProblems() {
  for (const e of document.querySelectorAll('[data-dialog] [data-field-error]')) e.remove();
  for (const f of document.querySelectorAll('[data-dialog] [aria-invalid][data-field]')) { f.removeAttribute('aria-invalid'); f.removeAttribute('aria-describedby'); }
  $('[data-dialog-errors]').replaceChildren();
}

/* ── a prop's form ──────────────────────────────────────────────────────── */
// one choice of where the prop exists; a kind on one side only shows its side, not to change, and says why
function sides(d, redraw) {
  const fixed = CODE_ONLY.has(d.type) ? `Figma has no property for a${d.type === 'event' ? 'n event' : ' number'}.`
    : d.role === 'interaction' ? 'Figma draws each state; code uses :hover, :focus and :active.' : null;
  const now = fixed ? (d.role === 'interaction' ? 'figma' : 'code') : d.only || 'both';
  const box = choice('Exists in', `only-${d.uid}`, [['both', 'Figma and code'], ['figma', 'Figma only'], ['code', 'Code only']], now,
    (v) => { d.only = v; redraw(`[data-choice="only-${v}"]`); }, 'ce-box');
  if (fixed) {
    for (const i of box.querySelectorAll('input')) i.disabled = true;
    box.append(el('p', { class: 'ce-hint', text: fixed }));
  }
  return box;
}

/*
 * An enum's options as input chips (knowledge: chips, *Input chips and tag
 * entry*): Enter or a comma adds one, a duplicate is refused with a word why,
 * each chip has its own remove button, Shift with Left or Right moves the
 * focused chip, and a chip double-clicked (or Enter on it) is renamed in place.
 */
function optionsField(d, redraw) {
  const at = (k) => `[data-chip="${k}"]`;
  const add = (input) => {
    const v = input.value.replace(/,$/, '').trim();
    if (!v) return;
    if (d.values.some((x) => kebab(x) === kebab(v))) { status(`${v} is already an option.`); input.setAttribute('aria-invalid', 'true'); return; }
    d.values = [...d.values, v];
    if (d.default == null) d.default = v;
    redraw('[data-chip-input]');
    status(`Added ${v}.`);
  };
  const removeAt = (k) => {
    const [v] = d.values.splice(k, 1);
    if (kebab(v) === kebab(d.default ?? '')) d.default = d.values[0] ?? null;
    redraw(d.values.length ? at(Math.min(k, d.values.length - 1)) : '[data-chip-input]');
    status(`Removed ${v}.`);
  };
  // an option renamed in place: what named it (the default, the pointer states) follows now, and the variants and the
  // combinations not drawn when the prop is saved (renamed, old value to new as the contract spells them)
  const rename = (k, input) => {
    const was = d.values[k], v = input.value.trim();
    if (!v || v === was) { redraw(at(k)); return; }
    if (d.values.some((x, i) => i !== k && kebab(x) === kebab(v))) { status(`${v} is already an option.`); input.setAttribute('aria-invalid', 'true'); input.focus(); return false; }
    d.values = d.values.map((x, i) => (i === k ? v : x));
    if (kebab(d.default ?? '') === kebab(was)) d.default = v;
    if (d.pointer) d.pointer = d.pointer.map((x) => (kebab(x) === kebab(was) ? v : x));
    const first = Object.keys(d.renamed || {}).find((o) => d.renamed[o] === kebab(was)) ?? kebab(was);
    d.renamed = { ...(d.renamed || {}), [first]: kebab(v) };
    redraw(at(k));
    status(`Renamed ${was} to ${v}.`);
  };
  // a chip turned into a field to type its new name in: Enter or leaving keeps it, Escape keeps the old one
  const edit = (k, li) => {
    let done = false;
    const input = el('input', { class: 'ce-chip__edit', value: d.values[k], 'data-chip-edit': k, 'aria-label': `Rename ${d.values[k]}: Enter keeps it, Escape keeps the old name`,
      onkeydown: (e) => {
        if (e.key === 'Enter') { e.preventDefault(); done = rename(k, e.target) !== false; }
        else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); done = true; redraw(at(k)); }
      },
      oninput: (e) => e.target.removeAttribute('aria-invalid'),
      onblur: (e) => { if (!done) { done = true; if (rename(k, e.target) === false) redraw(at(k)); } } });
    // the name alone becomes the field: the chip keeps its size and its ×
    li.querySelector('.ce-chip__value').replaceWith(input);
    input.focus();
    input.select();
  };
  const shift = (k, to) => {
    if (to < 0 || to >= d.values.length) return;
    d.values = move(d.values, k, to);
    redraw(at(to));
    status(`Moved ${d.values[to]} to position ${to + 1} of ${d.values.length}.`);
  };
  // the options the library's props of this name have, not yet among these, one click each
  const offers = el('div', { class: 'ce-suggest', 'data-option-suggestions': true });
  offers.refresh = () => {
    const name = d.name.trim().toLowerCase();
    const seen = new Set(d.values.map(kebab));
    const found = [];
    for (const c of libraryContracts) for (const [k, p] of Object.entries(c.props || {})) {
      if (!name || (p.figma || k).toLowerCase() !== name) continue;
      for (const v of p.figmaValues || p.values || []) if (!seen.has(kebab(v))) { seen.add(kebab(v)); found.push(v); }
    }
    fillChips(offers, 'In the library', found.slice(0, 8).map((v) => ({ text: `+ ${v}`, attrs: { 'data-option-suggestion': v },
      pick: () => { d.values = [...d.values, v]; if (d.default == null) d.default = v; redraw('[data-chip-input]'); status(`Added ${v}.`); } })));
  };
  offers.refresh();
  return el('fieldset', { class: 'ce-box' },
    el('legend', { text: 'Options' }),
    el('ul', { class: 'ce-chips' },
      ...d.values.map((v, k) => el('li', { class: 'ce-chip' },
        el('button', { type: 'button', class: 'ce-chip__value', 'data-chip': k, 'aria-label': `${v}: Enter renames it, Shift and an arrow key move it, Delete removes it`, title: 'Double-click to rename',
          ondblclick: (e) => edit(k, e.currentTarget.closest('li')),
          onkeydown: (e) => {
            if (e.key === 'Enter' || e.key === 'F2') { e.preventDefault(); edit(k, e.currentTarget.closest('li')); }
            else if (e.shiftKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) { e.preventDefault(); shift(k, k + (e.key === 'ArrowLeft' ? -1 : 1)); }
            else if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); removeAt(k); }
          }, text: v }),
        el('button', { type: 'button', class: 'ce-chip__remove', 'aria-label': `Remove ${v}`, onclick: () => removeAt(k), text: '×' }))),
      el('li', { class: 'ce-chips__add' },
        // the field says how it works where it is empty; with options in, only that more can be added
        el('input', { class: 'ce-chips__input', 'data-chip-input': true, 'data-field': 'values', 'aria-label': 'Add an option: type it, then Enter', placeholder: d.values.length ? 'Add another' : 'Type an option, then press Enter',
          onkeydown: (e) => {
            if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(e.target); }
            else if (e.key === 'Backspace' && !e.target.value && d.values.length) { e.preventDefault(); $(at(d.values.length - 1), e.target.closest('.ce-chips')).focus(); }
          },
          oninput: (e) => e.target.removeAttribute('aria-invalid'),
          onblur: (e) => add(e.target) }))),
    offers);
}

/* An enum's default: its options as pills up to four, a menu past four (design-standard rule 4). */
function enumDefault(d, redraw) {
  if (!d.values.length) return null;
  const now = d.values.find((v) => kebab(v) === kebab(d.default ?? '')) ?? d.values[0];
  if (d.values.length <= 4) return choice('Default', `default-${d.uid}`, d.values.map((v) => [v, v]), now, (v) => { d.default = v; }, 'ce-box');
  return box('Default', picker('Default', d.values.map((v) => ({ name: v })), now, (v) => { d.default = v; }, { none: d.values[0], noun: 'option', clearable: false, field: 'default' }));
}

// the on/off a prop is seen behind: its parts' Shown by, set here as in Anatomy. A part only a Figma variant adds
// (an icon Show icon adds) is shown by that variant, so it is said, and changed in Figma
const LINK = { string: 'textProp', instance: 'swapProp', slot: 'slotProp' };
function gateBox(d) {
  const parts = state.parts.filter((p) => p[LINK[d.type]] === d.uid);
  const w = !parts.length && onlyWhen(d);
  if (w) {
    return box('Shown only when', el('p', { class: 'ce-hint', text: `${conditionText(w).replace(/^./, (c) => c.toUpperCase())}: Figma adds its part in that variant, so it changes there.` }));
  }
  // a saved prop no part takes from has nothing to show or hide: no choice that would change nothing
  if (!parts.length && state.drafts.some((x) => x.uid === d.uid)) return null;
  // a new prop's part is made as it is added, and takes the choice then
  const now = 'gate' in d ? d.gate : !parts.length ? null : parts.every((p) => p.shownBy === parts[0].shownBy) ? parts[0].shownBy || null : null;
  return box('Shown only when', propSelect('Shown only when', 'boolean', now, (v) => { d.gate = v || null; }, 'Always shown', 'gate'));
}
function propForm(d, redraw) {
  const typed = {
    enum: () => [optionsField(d, redraw), enumDefault(d, redraw)],
    number: () => [only('Default', el('input', { class: 'filter', inputmode: 'decimal', value: d.default ?? '', 'data-field': 'default', oninput: (e) => { d.default = e.target.value === '' ? null : e.target.value; } }))],
    event: () => [el('p', { class: 'ce-hint', text: 'Something the component tells its caller, such as a click or a change.' })],
    boolean: () => [
      choice('Default', `default-${d.uid}`, [['false', 'False'], ['true', 'True']], d.default ? 'true' : 'false', (v) => { d.default = v === 'true'; }, 'ce-box'),
      d.only === 'code' ? null : choice('In Figma', `axis-${d.uid}`, [['property', 'A boolean property'], ['variant', 'A False/True variant']],
        d.axis ? 'variant' : 'property', (v) => { d.axis = v === 'variant'; }, 'ce-box'),
    ],
    string: () => [only('Default text', el('input', { class: 'filter', value: d.default ?? '', oninput: (e) => { d.default = e.target.value; } })), gateBox(d)],
    instance: () => [box('Default component', componentPicker('Default component', d.default, (v) => { d.default = v; }, drawnBy(d))), gateBox(d)],
    slot: () => [el('p', { class: 'ce-hint', text: 'Content the caller supplies: nothing more to set.' }), gateBox(d)],
  };
  return el('div', { class: 'ce-form' },
    kindTiles(`kind-${d.uid}`, kindOf(d), (v) => {
      // replaced, not merged: what the new kind drops (an interaction role, an axis) must go with the old kind
      const next = applyKind(d, kinds().find((b) => b.id === v));
      for (const k of Object.keys(d)) if (!(k in next)) delete d[k];
      Object.assign(d, next);
      redraw(`[data-tile="${v}"]`);
    }),
    nameField(d),
    ...typed[d.type](),
    sides(d, redraw));
}

/* A prop set up in the dialog: a new one goes in at `at` only when it is added; an edit is a copy until it is saved. */
// the name, with the names the library gives props of this kind offered under it as chips, narrowed as it is typed
function nameField(d) {
  const known = library.filter((b) => kindOf(b.make()) === kindOf(d)).map((b) => b.label);
  const chips = el('div', { class: 'ce-suggest', 'data-name-suggestions': true });
  // once typing, the first library name it begins is completed in the field, the rest selected, so typing on replaces it
  const input = el('input', { class: 'filter', value: d.name, 'data-name': true, 'data-field': 'name', autocomplete: 'off', 'aria-autocomplete': 'inline', oninput: (e) => {
    const typed = input.value;
    const hit = e.inputType === 'insertText' && input.selectionStart === typed.length && typed && known.find((n) => n.length > typed.length && n.toLowerCase().startsWith(typed.toLowerCase()));
    if (hit) { input.value = typed + hit.slice(typed.length); input.setSelectionRange(typed.length, hit.length); }
    d.name = input.value;
    offer();
    const opts = $('[data-option-suggestions]');
    if (opts) opts.refresh();
  } });
  // with nothing typed, the library's names show as chips
  const offer = () => {
    const shown = d.name.trim() ? [] : known.slice(0, 6);
    fillChips(chips, 'In the library', shown.map((n) => ({ text: n, attrs: { 'data-name-suggestion': n }, pick: () => { d.name = input.value = n; offer(); input.focus(); } })));
  };
  offer();
  const box = only(d.only === 'code' ? 'Name in code' : 'Name', input);
  box.append(chips);
  return box;
}

/* A prop of a component being read: what it is, a label and its value a row, as a part's look reads (Dev Mode). */
function viewProp(d) {
  const where = d.only === 'both' ? 'Figma and code' : d.only === 'figma' ? 'Figma only' : 'Code only';
  const when = onlyWhen(d);
  const parts = state.parts.filter((p) => [p.textProp, p.swapProp, p.slotProp, p.shownBy].includes(d.uid)).map((p) => p.name || partLabel(p.kind));
  const rows = [
    ['Kind', kindLabel(kindOf(d))],
    ['Exists in', where],
    ['Options', d.type === 'enum' ? d.values.join(', ') : ''],
    ['Default', d.type === 'boolean' ? (d.default ? 'True' : 'False') : d.default ?? ''],
    ['In Figma', d.type === 'boolean' && d.only !== 'code' ? (d.axis ? 'A False/True variant' : 'A boolean property') : ''],
    ['Shown only when', when ? conditionText(when) : ''],
    ['Parts', parts.join(', ')],
  ].filter(([, v]) => v !== '' && v != null);
  openDialog(d.name || 'Prop', '', el('dl', { class: 'ce-inspect' }, ...rows.flatMap(([k, v]) => [el('dt', { text: k }), el('dd', { text: String(v) })])), null, { view: true });
}

function openProp(d, { isNew = false, at = state.drafts.length } = {}) {
  const work = { ...d, values: [...d.values], pointer: d.pointer && [...d.pointer], extra: { ...(d.extra || {}) } };
  const body = el('div');
  const redraw = (focus) => {
    body.replaceChildren(propForm(work, redraw));
    const t = focus && $(focus, body);
    if (t) t.focus();
  };
  redraw();
  openDialog(isNew ? 'New prop' : `Edit ${d.name || 'prop'}`, isNew ? 'Add prop' : 'Save', body, () => {
    const others = state.drafts.filter((x) => x.uid !== work.uid);
    const mine = problems('component', [...others, work]).filter((p) => p.uid === work.uid);
    if (mine.length) return mine;
    // a part that takes its words, its visibility, its swap or its content from this prop needs it to stay that kind
    const NEEDS = [['textProp', 'string', 'words'], ['shownBy', 'boolean', 'visibility'], ['swapProp', 'instance', 'swap'], ['slotProp', 'slot', 'content']];
    const held = state.parts.flatMap((p) => NEEDS.filter(([k, type]) => p[k] === work.uid && work.type !== type).map(([, , what]) => `${p.name || 'A part'} takes its ${what} from it`));
    if (held.length) return [{ field: 'kind', message: `${held.join('; ')}. Unlink it in Anatomy first, or keep its kind.` }];
    const gate = 'gate' in work ? work.gate : undefined;
    delete work.gate;
    /* options renamed: the variants, the combinations not drawn and the parts' conditions name them by the prop's key
       as the page keeps it; the preview and the Variants grid by the contract's */
    if (work.renamed) {
      const key = d.was || camel(d.name), now = camel(d.name), to = (x) => (typeof x === 'string' && x in work.renamed ? work.renamed[x] : x);
      const named = (w) => (w && key in w ? { ...w, [key]: Array.isArray(w[key]) ? w[key].map(to) : to(w[key]) } : w);
      state.base.variants = (state.base.variants || []).map((v) => ({ ...v, when: named(v.when) }));
      if (state.base.invalid) state.base.invalid = state.base.invalid.map(named);
      if (state.base.when) state.base.when = Object.fromEntries(Object.entries(state.base.when).map(([id, c]) => [id, named(c)]));
      for (const w of [viewing, filterAt]) if (w && now in w) w[now] = to(w[now]);
      delete work.renamed;
    }
    // a part named for the prop it takes from is renamed with it; one named otherwise, or a name another part has, stays
    if (!isNew && work.name !== d.name) for (const p of state.parts) if (p[LINK[work.type]] === work.uid && p.name === d.name && !state.parts.some((x) => x.name === work.name)) p.name = work.name;
    if (isNew) state.drafts.splice(at, 0, work);
    else state.drafts[find(work.uid)] = work;
    const brought = isNew && partFor(work);
    // the on/off chosen shows the parts this prop drives, the one just made for it too
    if (gate !== undefined) for (const p of state.parts) if (p[LINK[work.type]] === work.uid) p.shownBy = gate;
    render({ uid: work.uid });
    refocus = `[data-list] [data-uid="${work.uid}"] [data-edit]`;
    status(isNew ? `Added ${work.name} at position ${at + 1} of ${state.drafts.length}${brought ? `, and a ${partLabel(brought.kind).toLowerCase()} part for it in Anatomy` : ''}.` : `Saved ${work.name}.`);
    return [];
  }, { onDelete: isNew ? null : () => remove(find(d.uid)), tall: true, work });
}

/* ── the props list: a read-only row each, dragged or moved by its handle ── */
// a prop seen only in some variants says so: its parts are all inside one an on/off shows, or one a variant adds,
// as an icon's swap is seen only when Show icon is on
function onlyWhen(d) {
  const c = contractNow();
  const key = Object.keys(c.props || {}).find((k) => k === camel(d.name));
  const prop = key && c.props[key];
  if (!prop) return '';
  const added = (id) => (c.variants || []).filter((v) => !v.combination && v.add && id in v.add);
  const entryOf = (id) => (c.anatomy || {})[id] || (added(id)[0] || { add: {} }).add[id];
  // what holds wherever this part is drawn: each container up to the outer box, shown by an on/off or added by a layer
  const holds = (id, self) => {
    const out = {};
    for (let x = id; x && x !== 'root'; x = (entryOf(x) || {}).parent) {
      for (const [k, q] of Object.entries(c.props)) if (k !== self && q.type === 'boolean' && (q.shows || []).includes(x)) out[k] = true;
      if (!(c.anatomy || {})[x]) { const ls = added(x); if (ls.length) for (const [k, v] of Object.entries(ls[0].when)) if (ls.every((l) => l.when[k] === v)) out[k] = v; }
    }
    return out;
  };
  const ids = [...(prop.shows || []), ...(prop.swaps || []), ...(prop.sets || []), ...(prop.fills || [])];
  if (!ids.length) return '';
  const each = ids.map((id) => holds(id, key));
  const common = Object.fromEntries(Object.entries(each[0]).filter(([k, v]) => k !== key && each.every((h) => h[k] === v)));
  return Object.keys(common).length ? common : null;
}
// what a row says beside the kind: only what the kind does not, as Anatomy's rows do. Options and states their values
// and which is the default; an On / off only what departs from the usual (on by default, a variant in Figma); a text,
// number or swap its default; an event nothing. Required first, where the code says a prop is
function summary(d) {
  const own = said(d);
  return d.extra && d.extra.required ? ['Required', own].filter(Boolean).join(', ') : own;
}
function said(d) {
  if (d.type === 'enum') return d.values.map((v) => (kebab(v) === kebab(d.default ?? '') ? `${v} (default)` : v)).join(', ');
  if (d.type === 'boolean') return [d.default ? 'On by default' : '', d.only !== 'code' && d.axis ? 'A variant in Figma' : ''].filter(Boolean).join(', ');
  if (d.type === 'string') return d.default != null && d.default !== '' ? `“${d.default}”` : '';
  if (d.type === 'instance' || d.type === 'number') return d.default != null && d.default !== '' ? String(d.default).split('/').pop() : '';
  return '';
}

// a popover placed against its button: anything scrolling behind it closes it rather than leave it adrift.
// From the next frame, so opening it does not count as a scroll behind it
// a field whose label is said by what is around it: kept for screen readers, not shown
const quiet = (f) => { f.firstElementChild.classList.add('visually-hidden'); return f; };

function closeOnScroll(pop) {
  const onScroll = (ev) => { if (!pop.contains(ev.target)) pop.hidePopover(); };
  requestAnimationFrame(() => { if (pop.matches(':popover-open')) addEventListener('scroll', onScroll, { capture: true, passive: true }); });
  pop.addEventListener('toggle', (t) => { if (t.newState === 'closed') removeEventListener('scroll', onScroll, { capture: true }); }, { once: true });
}

/*
 * A menu of actions under its button, or above it where the window has no
 * room below; the platform gives it light dismiss and Escape. Its items are
 * [text, action, off], or a function giving them, read as it opens so
 * they fit the page as it is then; off is false, or why the item is off,
 * said under it. Aligned to its button's end, or start.
 */
function menu(button, id, items, { align = 'end' } = {}) {
  const pop = el('div', { id, popover: 'auto', class: 'ce-menu',
    onbeforetoggle: (e) => { if (e.newState === 'open') pop.replaceChildren(...(typeof items === 'function' ? items() : items).map(([text, fn, off]) => el('button', { type: 'button', disabled: !!off, 'data-destructive': text === 'Delete' || null, onclick: () => { pop.hidePopover(); fn(); } }, text, typeof off === 'string' ? el('span', { class: 'ce-menu__why', text: off }) : null))); },
    ontoggle: (e) => {
      if (e.newState !== 'open') { delete pop.dataset.placed; return; }
      const r = button.getBoundingClientRect();
      pop.style.top = (innerHeight - r.bottom - 12 >= pop.offsetHeight ? r.bottom + 4 : r.top - 4 - pop.offsetHeight) + 'px';
      // in the window whichever edge it aligns to: a menu off a button at the right edge opens leftward
      pop.style.left = Math.max(8, Math.min(innerWidth - 8 - pop.offsetWidth, align === 'end' ? r.right - pop.offsetWidth : r.left)) + 'px';
      pop.dataset.placed = '';
      const first = pop.querySelector('button:not(:disabled)');
      if (first) first.focus();
      closeOnScroll(pop);
    } });
  button.setAttribute('popovertarget', id);
  return [button, pop];
}
const rowMenu = (id, label, items) => menu(withIcon(el('button', { type: 'button', class: 'ce-more', 'data-more': true, 'aria-label': label }), 'more'), id, items);

// the props a prop is seen behind, a chip on its row, said in full on hover and to screen readers
function condChip(d) {
  const when = onlyWhen(d);
  if (!when) return null;
  const said = `Only when ${conditionText(when)}`;
  return withSvg(el('span', { class: 'ce-cond', title: said }, el('span', { 'aria-hidden': 'true', text: Object.keys(when).map((k) => when[k] === true ? (state.drafts.find((x) => camel(x.name) === k) || {}).name || k : conditionText({ [k]: when[k] })).join(', ') }),
    el('span', { class: 'visually-hidden', text: `${said}. ` })), '<path d="m15 10 5 5-5 5"/><path d="M4 4v7a4 4 0 0 0 4 4h12"/>');
}
function propRow(d, i, n) {
  const where = d.only === 'both' ? 'Figma and code' : d.only === 'figma' ? 'Figma only' : 'Code only';
  // a library component read, not edited: a row says the prop, with nothing to drag, open or act on
  const ro = readOnly();
  return el('li', { class: 'ce-row', 'data-uid': d.uid },
    ro ? null : withIcon(el('button', { type: 'button', class: 'ce-handle', 'data-handle': true, 'aria-label': `Reorder ${d.name || 'prop'}: drag, or use the arrow keys` }), 'grip'),
    withIcon(el('button', { type: 'button', class: 'ce-row__main', 'data-edit': true, 'aria-haspopup': 'dialog', onclick: () => (ro ? viewProp(d) : openProp(d)) },
      el('span', { class: 'ce-row__name', text: d.name || 'Unnamed' }),
      el('span', { class: 'ce-row__kind', text: kindLabel(kindOf(d)) }),
      // the chip first, kept whole, the summary cut where the row runs out
      el('span', { class: 'ce-row__about' }, condChip(d), el('span', { class: 'ce-row__summary', text: summary(d) })),
      el('span', { class: 'visually-hidden', text: `, ${where}. ${ro ? 'View' : 'Edit'}` })), kindOf(d)),
    el('span', { class: 'ce-row__sides', 'aria-hidden': 'true', title: where },
      ...[d.only !== 'code' && 'figma', d.only !== 'figma' && 'code'].filter(Boolean).map((s) => withIcon(el('span', { class: 'ce-mark' }), s))),
    ...(ro ? [] : rowMenu(`menu-${d.uid}`, `Actions for ${d.name || 'prop'}`, [
      ['Edit', () => openProp(d)],
      ['Move up', () => moveTo(i, i - 1, '[data-more]'), i === 0],
      ['Move down', () => moveTo(i, i + 1, '[data-more]'), i === n - 1],
      ['Duplicate', () => openProp(draft({ ...d, name: `${d.name} copy`, values: [...d.values], pointer: d.pointer && [...d.pointer], extra: {}, was: null }), { isNew: true, at: i + 1 })],
      ['Delete', () => remove(i)],
    ])));
}

function render({ uid, focus } = {}) {
  const list = $('[data-list]');
  // a prop seen only behind an on/off is listed under it, indented, which says it without the chip; shown in that
  // order, kept in the contract's
  const gateOf = (d) => { const w = onlyWhen(d); const k = w && Object.keys(w).find((x) => w[x] === true); return k ? state.drafts.find((x) => x !== d && x.type === 'boolean' && camel(x.name) === k) : null; };
  const under = new Map(state.drafts.map((d) => [d, gateOf(d)]).filter(([, g]) => g));
  const rows = [];
  state.drafts.forEach((d, i, a) => {
    if (under.has(d)) return;
    rows.push(propRow(d, i, a.length));
    a.forEach((x, j) => { if (under.get(x) === d) { const r = propRow(x, j, a.length); r.classList.add('ce-row--under'); r.querySelector('.ce-cond')?.remove(); rows.push(r); } });
  });
  list.replaceChildren(...rows);
  renderSuggestions();
  if (uid) { const li = list.querySelector(`[data-uid="${uid}"]`); const t = li && li.querySelector(focus || '[data-edit]'); if (t) t.focus(); }
  refresh();
}

// one click adds a prop the library's components often have beside these, in the library's own form
function renderSuggestions() {
  const found = suggest(libraryContracts, state.drafts.map((d) => d.name)).filter((s) => library.some((b) => b.label === s.name));
  fillChips($('[data-suggest]'), 'Often added', found.map((s) => ({ text: `+ ${s.name}`, attrs: { 'data-suggestion': s.name, title: `${s.n} of the ${s.of} components with ${s.because} have it` },
    pick: () => {
      const d = library.find((b) => b.label === s.name).make();
      state.drafts.push(d);
      partFor(d);
      render({ uid: d.uid });
      status(`Added ${d.name}, which ${s.n} of the ${s.of} components with ${s.because} have.`);
    } })));
}

// a row of one-click chips under its title, hidden while it offers nothing
function fillChips(box, title, chips) {
  box.hidden = !chips.length;
  box.replaceChildren(el('span', { class: 'ce-suggest__title', text: title }),
    ...chips.map((c) => el('button', { type: 'button', class: 'ce-filter-chip', ...c.attrs, onclick: c.pick }, c.text)));
}

/*
 * A deletion said in a bar at the foot of the page, Undo and a close beside
 * it (feedback: undo over confirm; a message with an action keeps no timer);
 * said aloud too, and replaced by the next.
 */
// an undo belongs to the page it was offered on: another component opened, or a new one, takes it away
function offerUndo(message, restore, { page = true } = {}) {
  const bar = $('[data-undo]');
  const owner = state;
  // where the person was, for the close to return to
  const back = document.activeElement;
  $('[data-undo-close]').onclick = () => { hideUndo(); ((back && back.isConnected && back !== document.body) ? back : $('[data-component]')).focus(); };
  $('[data-undo-text]').textContent = message;
  bar.hidden = false;
  status(`${message} Undo is at the foot of the page.`);
  $('[data-undo-button]').onclick = () => {
    hideUndo();
    if (page && state !== owner) { status('Nothing undone: another component is on the page now.'); return; }
    restore();
    status('Undone.');
  };
}
function hideUndo() { $('[data-undo]').hidden = true; }

function remove(i) {
  // a prop a part takes its words, visibility, swap or content from stays until the part lets it go
  const uid = state.drafts[i].uid;
  const held = state.parts.filter((p) => ['textProp', 'shownBy', 'swapProp', 'slotProp'].some((k) => p[k] === uid)).map((p) => p.name || 'A part');
  if (held.length) { told(`${state.drafts[i].name} is still in use`, `${held.join(', ')} ${held.length > 1 ? 'take' : 'takes'} something from it. Unlink ${held.length > 1 ? 'them' : 'it'} in Anatomy first, then delete it.`); return; }
  // what goes with it: the variants, combinations and conditions that name it (said, and back on Undo)
  // as the contract names it: the key it was read with, before any rename
  const k = state.drafts[i].was || camel(state.drafts[i].name);
  const named = (state.base.variants || []).filter((v) => k in (v.when || {})).length + (state.base.invalid || []).filter((w) => k in (w || {})).length;
  const base = state.base;
  const [d] = state.drafts.splice(i, 1);
  if (!state.drafts.length) state.base = {}; // an emptied list is a new contract, not the opened one
  const next = state.drafts[Math.min(i, state.drafts.length - 1)];
  render(next ? { uid: next.uid, focus: '[data-edit]' } : {});
  if (!next) $('[data-component]').focus();
  offerUndo(`Deleted ${d.name || 'the prop'}${named ? `, and the ${named} variants and combinations that name it` : ''}.`,
    () => { state.drafts.splice(Math.min(i, state.drafts.length), 0, d); if (!Object.keys(state.base).length) state.base = base; render({ uid: d.uid }); });
}
function moveTo(from, to, focus = '[data-handle]') {
  if (to < 0 || to >= state.drafts.length || to === from) return;
  const d = state.drafts[from];
  state.drafts = move(state.drafts, from, to);
  render({ uid: d.uid, focus });
  status(`Moved ${d.name} to position ${to + 1} of ${state.drafts.length}.`);
}

/* ── the anatomy: the parts, nested under the component's outer box ─────── */
const propsOf = (type) => state.drafts.filter((d) => d.type === type && d.name.trim());
const findPart = (uid) => state.parts.find((p) => p.uid === uid);
const partLabel = (kind) => PART_KINDS.find(([k]) => k === kind)[1];
const PART_ICON = { container: 'container', text: 'text', instance: 'part', slot: 'slot', graphic: 'shape' };

/*
 * A token picker: a button showing the chosen token (a swatch for a colour,
 * the value for a length), opening a list to search and choose from, in the
 * library's own groups. The list is the APG combobox over a listbox: the
 * search keeps focus, Up and Down move the active option, Enter chooses it,
 * Escape closes. A native select cannot draw a swatch beside an option.
 */
let pickers = 0;
/*
 * Every menu in a dialog is this picker: tokens, props, containers. An item
 * is { name (what is stored), label (what is read), group, value (a colour
 * draws a swatch, a number shows itself) }. A clearable one has a × once
 * something is chosen; one that must always hold a value (where a part sits)
 * has none.
 */
// a trigger of the caller's own (a value drawn on the stage) opens the list in place of the picker's button; the list alone is returned
function picker(label, list, value, set, { none = 'Choose a token', noun = 'token', clearable = true, field: fieldName = null, trigger = null, searched = list.length > 15 } = {}) {
  const id = `picker-${++pickers}`;
  // the value in use is shown and offered even where the list leaves it out (a token outside the families guessed for the field)
  if (value && !list.some((t) => t.name === value)) list = [{ name: value, group: 'In use' }, ...list];
  // a value set but not offered (a library's own variable, hidden from publishing) is still said, and flagged
  const known = [...tokens.colours, ...tokens.lengths].find((t) => t.name === value);
  const chosen = list.find((t) => t.name === value) || (known && known.private ? known : undefined);
  const text = (t) => t.label ?? t.name;
  // under its group's heading an option drops the group's name: "full" under Corner radius, not "Corner radius/full"
  const short = (t) => (t.group && !t.label && t.name.startsWith(t.group + '/') ? t.name.slice(t.group.length + 1) : text(t));
  const face = (t, under = false) => [
    // in the page's scheme, as the preview draws it: its dark mode's value where the page is dark
    t && /^#|^rgb/.test(String(t.value)) ? el('span', { class: 'ce-swatch', style: `background: ${(isDark() && t.dark) || t.value}`, 'aria-hidden': 'true' }) : null,
    // an icon the project keeps, drawn beside its name
    t && t.icon ? el('span', { class: 'ce-pv--glyph ce-picker__icon', style: `mask-image: url("${t.icon}")`, 'aria-hidden': 'true' }) : null,
    el('span', { class: 'ce-picker__name' + (t ? (t.private ? ' ce-picker__name--private' : '') : ' ce-picker__name--none'), title: t && t.private ? 'Private to the library (hidden from publishing): Figma cannot bind it outside the library, so it draws its raw value. Choose a published token.' : null, text: t ? (under ? short(t) : text(t)) : none }),
    t && typeof t.value === 'number' ? el('span', { class: 'ce-picker__value', text: `${t.value}` }) : null,
  ];
  // named by its label, then what it shows: "Fill, Colour/Action"
  const button = trigger || el('button', { type: 'button', id: `${id}-button`, class: 'filter ce-picker', popovertarget: id, 'aria-haspopup': 'listbox', 'aria-labelledby': `${id}-label ${id}-button`, 'data-picker': label, 'data-field': fieldName }, ...face(chosen).filter(Boolean));
  if (trigger) for (const [k, v] of [['popovertarget', id], ['aria-haspopup', 'listbox'], ['data-picker', label]]) trigger.setAttribute(k, v);
  // a chosen value clears with its own button; nothing chosen, nothing to clear
  const clear = el('button', { type: 'button', class: 'ce-picker__clear', 'aria-label': `Clear ${label.toLowerCase()}`, hidden: !chosen || !clearable, onclick: () => choose(null), text: '×' });
  const search = el('input', { type: 'search', class: 'filter', role: 'combobox', 'aria-expanded': 'true', 'aria-controls': `${id}-list`, 'aria-autocomplete': 'list', 'aria-label': `Search ${label.toLowerCase()}` });
  const listbox = el('ul', { id: `${id}-list`, role: 'listbox', class: 'ce-picker__list', 'aria-label': label, tabindex: searched ? null : '-1' });
  // a list short enough to scan (fifteen or fewer, selection.md) is chosen, not searched: the list takes the keys
  search.hidden = !searched;
  const keyed = searched ? search : listbox;
  let active = -1;
  const options = () => [...listbox.querySelectorAll('[role=option]')];
  const activate = (k) => {
    const all = options();
    if (!all.length) return;
    active = (k + all.length) % all.length;
    all.forEach((o, i) => o.toggleAttribute('data-active', i === active));
    keyed.setAttribute('aria-activedescendant', all[active].id);
    // scrolled within the list only: scrolling the dialog behind would close the picker
    const o = all[active], top = o.offsetTop - listbox.offsetTop;
    if (top < listbox.scrollTop) listbox.scrollTop = top;
    else if (top + o.offsetHeight > listbox.scrollTop + listbox.clientHeight) listbox.scrollTop = top + o.offsetHeight - listbox.clientHeight;
  };
  const choose = (name) => {
    value = name || null;
    set(value);
    if (!trigger) button.replaceChildren(...face(list.find((t) => t.name === name)).filter(Boolean));
    clear.hidden = !name || !clearable;
    if (pop.matches(':popover-open')) pop.hidePopover();
    button.focus();
  };
  const fill = () => {
    const q = search.value.trim().toLowerCase();
    const groups = new Map();
    for (const t of list) if (!q || holdsWords(text(t), q)) groups.set(t.group || '', [...(groups.get(t.group || '') || []), t]);
    let n = 0;
    // a long name ends in an ellipsis: hovered, it is said whole
    const option = (t) => el('li', { role: 'option', id: `${id}-o${n++}`, 'data-value': t ? t.name : '', title: t ? text(t) : null, 'aria-selected': String((t ? t.name : null) === (value || null)), onclick: () => choose(t && t.name) }, ...face(t, true));
    listbox.replaceChildren(
      ...[...groups].map(([g, ts]) => (g ? el('li', { role: 'presentation' },
        el('span', { class: 'ce-picker__group', id: `${id}-g${n}`, text: g }),
        el('ul', { role: 'group', 'aria-labelledby': `${id}-g${n}` }, ...ts.map(option))) : ts.map(option))).flat());
    if (!options().length) {
      const none = q ? `No ${noun} matches "${search.value.trim()}".` : `No ${noun} to choose.`;
      listbox.append(el('li', { role: 'presentation', class: 'ce-hint', text: none }));
      status(none);
    }
    active = -1;
    keyed.removeAttribute('aria-activedescendant');
  };
  search.addEventListener('input', fill);
  // a long list's search takes the keys
  const keys = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); activate(active + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); activate(active - 1); }
    else if (e.key === 'Enter') { e.preventDefault(); const o = options()[active]; if (o) o.click(); }
  };
  keyed.addEventListener('keydown', keys);
  // filled as it opens, before it shows (toggle comes a task later, when a quick choice would find it empty)
  const pop = el('div', { id, popover: 'auto', class: 'ce-picker__pop', onbeforetoggle: (e) => { if (e.newState === 'open') { search.value = ''; fill(); } }, ontoggle: (e) => {
    if (e.newState !== 'open') { delete pop.dataset.placed; return; }
    // under the button, or above it when the window has more room there; never taller than that room
    const r = button.getBoundingClientRect();
    const below = innerHeight - r.bottom - 12, above = r.top - 12;
    // no taller than the stylesheet allows (its max-block-size), nor than the room there is
    pop.style.maxBlockSize = '';
    const room = Math.min(parseFloat(getComputedStyle(pop).maxBlockSize) || Infinity, Math.max(below, above));
    pop.style.maxBlockSize = room + 'px';
    pop.style.top = (below >= Math.min(room, pop.scrollHeight) || below >= above ? r.bottom + 4 : r.top - 4 - Math.min(room, pop.scrollHeight)) + 'px';
    pop.style.inlineSize = Math.max(r.width, 240) + 'px';
    pop.style.left = Math.max(8, Math.min(innerWidth - 8 - Math.max(r.width, 240), r.left)) + 'px';
    pop.dataset.placed = '';
    const chosenAt = options().findIndex((o) => o.getAttribute('aria-selected') === 'true');
    keyed.focus({ preventScroll: true });
    if (chosenAt >= 0) activate(chosenAt);
    closeOnScroll(pop);
  } }, search, listbox);
  // a chevron says it opens a menu, as a select's does; the × sits before it
  const chevron = withIcon(el('span', { class: 'ce-picker__chevron', 'aria-hidden': 'true' }), 'chevron');
  if (trigger) return pop;
  return el('div', { class: 'ce-field' }, el('span', { id: `${id}-label`, text: label }), el('div', { class: 'ce-picker__wrap' }, button, clear, chevron), pop);
}
// with no prop of its kind to link, the field is left out rather than said to be empty
const linkable = (type) => propsOf(type).filter((d) => type !== 'boolean' || !d.axis);
const propSelect = (label, type, value, set, none, fieldName = null) => !linkable(type).length
  ? null
  : picker(label, linkable(type).map((d) => ({ name: d.uid, label: d.name })), value, set, { none, noun: 'prop', field: fieldName });

// the components a part or a swap may name: the library's, and every one its components place, grouped by their first segment
// the component a swap's part is drawn with, where the contract names no default: Figma's own default, which the
// snapshot does not record
function drawnBy(d) {
  const c = contractNow();
  const prop = (c.props || {})[camel(d.name)];
  for (const id of (prop && prop.swaps) || []) {
    const e = (c.anatomy || {})[id] || ((c.variants || []).find((v) => v.add && id in v.add) || { add: {} }).add[id];
    if (e && typeof e.component === 'string') return e.component;
  }
  return null;
}
function componentPicker(label, value, set, drawn = null) {
  const names = new Set(libraryContracts.map((c) => c.component));
  for (const c of libraryContracts) for (const e of Object.values(c.anatomy || {})) if (e.kind === 'instance' && typeof e.component === 'string') names.add(e.component);
  if (value) names.add(value);
  // an icon drawn beside the icons only: one the project exports and no component of the library's own, so a graphic
  // named as an icon is (Graphic/lock, with its own contract) is not that icon, whatever the icons' folder is called
  const own = new Set(libraryContracts.map((c) => c.component));
  const list = [...names].sort((a, b) => a.localeCompare(b)).map((n) => ({ name: n, group: n.includes('/') ? n.split('/')[0] : 'Components', icon: own.has(n) ? null : iconOf(n, 16) }));
  return picker(label, list, value, set, { none: drawn ? `${drawn}, as Figma draws it` : 'Choose a component', noun: 'component' });
}

/*
 * The placed component's own props, where the library has its contract: this
 * instance's value for each, in Figma's spelling as the contract's `with`
 * keeps it. One left at its default is not written. Interaction states are
 * Figma's to draw, not the instance's to set.
 */
function instanceProps(p) {
  const c = libraryContracts.find((x) => x.component === p.component);
  if (!c) return [];
  // a swap is offered where the part it swaps is drawn at the instance's values: Icon (20) at one size, Icon (16) at another
  const drawn = drawnAt(c, p.with || {});
  const swaps = (d) => Object.entries(drawn).some(([id, e]) => (c.props[d.was]?.swaps || []).includes(id) && (!e.swappedBy || e.swappedBy === d.was));
  const own = fromContract(c).drafts.filter((d) => d.role !== 'interaction' && d.only !== 'code' && !CODE_ONLY.has(d.type) && d.type !== 'slot' && (d.type !== 'instance' || swaps(d)));
  if (!own.length) return [];
  const w = p.with || (p.with = {});
  // an on/off or an option may draw another variant, and with it other swaps to offer: the rows are drawn again
  const put = (name, v, dflt, into) => { if (v == null || v === '' || v === dflt) delete w[name]; else w[name] = v; if (into) renderParts({ into }); else refresh(); };
  const fieldOf = (d) => {
    const now = w[d.name];
    if (d.type === 'boolean') {
      const dflt = d.default ? 'True' : 'False';
      // stored as true or "True" alike
      const was = now == null ? dflt : String(now).toLowerCase() === 'true' ? 'True' : 'False';
      return seg(d.name, `with-${kebab(d.name)}`, [['False', 'Off'], ['True', 'On']], was, (v) => put(d.name, v, dflt, `[data-choice="with-${kebab(d.name)}-${v}"]`));
    }
    if (d.type === 'enum') return picker(d.name, d.values.map((v) => ({ name: v })), now ?? d.default, (v) => put(d.name, v, d.default, `[data-picker=${JSON.stringify(d.name)}]`), { none: `${d.default} (default)`, noun: 'option' });
    if (d.type === 'instance') return componentPicker(d.name, now ?? d.default, (v) => put(d.name, v, d.default));
    return field(d.name, el('input', { class: 'filter', value: now ?? '', placeholder: d.default ?? '', oninput: (e) => put(d.name, e.target.value, d.default) }));
  };
  return own.map(fieldOf);
}

// a part Figma has drawn: read, with its kind unchanged, from a contract Figma drew (it names its Figma
// component), whatever the page's name field now says
// the library's drawing this page was opened from: its Figma component, matched whatever the key order
const drawnFrom = () => state.base && state.base.figma && libraryContracts.find((c) => same(c.figma, state.base.figma));
// a draft is the user's copy to change, linked or made before drafts were: nothing in it is locked
const fromFigma = (p) => { const d = !currentDraft && drawnFrom(); return !!d && !!p.raw && p.raw.kind === p.kind && (p.uid === 'root' || (!!p.at && p.at in (d.anatomy || {}))); };

// an icon's size is one it is drawn at, its Size variant: never hugged or stretched
const iconSizes = (name) => { const base = name && name.split('/').pop(); return base ? [...icons].map((f) => f.startsWith(base + '-') && /^\d+$/.test(f.slice(base.length + 1)) ? Number(f.slice(base.length + 1)) : null).filter(Boolean).sort((a, b) => a - b) : []; };

/*
 * The anatomy as it is worked: the component drawn large on a stage, at the
 * props' values chosen above it, the part chosen outlined, its padding and
 * gap shown on it as numbers to click; beside it, that part's look, one row
 * a property. At the props' defaults an edit is the component's; at any
 * other values it is that variant's, written to its layer (variants.mjs),
 * and a dot marks each row the variant changes.
 */
// the part chosen: a part's uid, or `at:<id>` for one only some variants draw
let selected = 'root';
// the props' values the stage draws, by their keys in the contract; none chosen is each prop's default
let viewing = {};
let zoomAt = 'fit';
let stageOf = null;
// the values shown; a variant prop with no default always names the one shown (its first), or an edit there would
// be written as if at no value of it, and reach them all
const variantValues = (c) => { const d = defaults(c), first = Object.fromEntries(choosers(c).map((x) => [x.key, x.default]));
  return Object.fromEntries(variantKeys(c).filter((k) => k in viewing || !(k in d)).map((k) => [k, k in viewing ? viewing[k] : first[k]])); };
const idOf = (key, id = ids(state.parts)) => (key.startsWith('at:') ? key.slice(3) : id[key]);
// another component opened starts at its defaults, its outer box chosen; a part gone, the outer box
function syncSelection() {
  if (stageOf !== state) { stageOf = state; selected = 'root'; viewing = {}; }
  if (!selected.startsWith('at:') && !findPart(selected)) selected = 'root';
}

/* The variants as the page keeps them: by the ids and prop keys the contract was opened with, which toContract renames on the way out. */
function toBase(c, variants) {
  const id = ids(state.parts);
  const back = state.parts.filter((p) => p.at && id[p.uid] !== p.at).map((p) => [id[p.uid], p.at]);
  const part = (t) => {
    const hit = back.find(([to]) => t === to) || back.filter(([to]) => t.startsWith(to + '/')).sort((a, b) => b[0].length - a[0].length)[0];
    return hit ? hit[1] + t.slice(hit[0].length) : t;
  };
  const field = (k) => { const i = k.lastIndexOf('.'); return part(k.slice(0, i)) + k.slice(i); };
  const was = new Map(state.drafts.filter((d) => d.was && d.was !== camel(d.name)).map((d) => [camel(d.name), d.was]));
  const now = new Map([...was].map(([k, v]) => [v, k]));
  const when = (w) => Object.fromEntries(Object.entries(w || {}).map(([k, v]) => [was.get(k) || k, v]));
  const out = variants.map((v) => ({ ...v, when: when(v.when),
    ...(v.set ? { set: Object.fromEntries(Object.entries(v.set).map(([k, x]) => [field(k), x])) } : {}),
    ...(v.add ? { add: Object.fromEntries(Object.entries(v.add).map(([k, e]) => [part(k), e && e.parent ? { ...e, parent: part(e.parent) } : e])) } : {}),
    ...(v.remove ? { remove: v.remove.map(part) } : {}) }));
  // the layers naming a prop deleted are not in the contract written, and stay for its Undo, each where it stood among
  // the rest: layers draw in order, so one put back at the end would draw over the pairs it stood before
  const base = state.base.variants || [];
  const gone = (v) => !Object.keys(v.when || {}).every((k) => (now.get(k) || k) in c.props);
  // (after the layer it followed, found by its values, as a layer emptied since may have left the list)
  // (two layers of the same values matched in turn: the second in the list is the second in the output)
  const at = (x) => {
    if (gone(x)) return out.indexOf(x);
    const k = base.slice(0, base.indexOf(x)).filter((y) => !gone(y) && same(y.when, x.when)).length;
    return out.map((o, i) => (same(o.when, when(x.when)) ? i : -1)).filter((i) => i >= 0)[k] ?? -1;
  };
  base.forEach((v, i) => { if (!gone(v)) return; const before = base.slice(0, i).reverse().find((x) => at(x) >= 0); out.splice(before ? at(before) + 1 : 0, 0, v); });
  return out;
}

// a field of a part on the page, in the contract's form, set on the part's own fields
const graphics = (inner) => Object.entries(inner || {}).filter(([, x]) => x.kind === 'graphic');
function patchPart(p, field, v) {
  const set = (k, x) => { if (x == null || x === '') delete p[k]; else p[k] = x; };
  if (field === 'layout') { const { direction = 'row', gap, padding, align, crossAlign } = v || {}; p.layout = Object.fromEntries(Object.entries({ direction, gap, padding, align, crossAlign }).filter(([, x]) => x != null)); return; }
  if (field === 'border') { set('stroke', v && v.color); set('strokeWidth', v && v.width); return; }
  // an icon of the project's with no layers recorded yet gets its glyph, as a snapshot records one, to hold the colour
  if (field === 'color' && p.kind === 'instance' && !graphics(p.inner).length && iconSizes(p.component).length) p.inner = { ...(p.inner || {}), icon: { kind: 'graphic' } };
  set(field, v);
}

/*
 * An edit of the part chosen: each [id, field, value] in the contract's form.
 * At the defaults it is the part's own; at other values, that variant's.
 */
function write(changes, into = null, stage = null) {
  const c = contractNow();
  const at = variantValues(c);
  const off = offDefault(c, at);
  if (Object.keys(off).length) {
    // the page keeps variants by the names they were opened with: a name another part or prop had before it was renamed
    // would be read back as that one's, so an edit there waits until the page is saved and opened again
    const id = ids(state.parts);
    const oldPart = new Set(state.parts.filter((p) => p.at && p.at !== id[p.uid]).map((p) => p.at));
    const oldProp = new Set(state.drafts.filter((d) => d.was && d.was !== camel(d.name)).map((d) => d.was));
    const clash = changes.map(([i]) => i).find((i) => oldPart.has(i)) || Object.keys(off).find((k) => oldProp.has(k));
    if (clash) { told('Not changed in this variant', `"${clash}" was the name of another part or prop before it was renamed here. Save the work, open it again, then make this change.`); return; }
    let next = c;
    for (const [i, f, v] of changes) next = { ...next, variants: setField(next, at, i, f, v) };
    if (!Object.keys(state.base).length) state.base = { variants: [], invalid: [] };
    state.base.variants = toBase(c, next.variants);
  } else {
    const uidOf = new Map(Object.entries(ids(state.parts)).map(([u, a]) => [a, u]));
    for (const [i, f, v] of changes) { const p = findPart(uidOf.get(i)); if (p) patchPart(p, f, v); }
  }
  renderParts({ into, stage });
}

// Material Symbols 0.23.0's layout icons (Apache 2.0, https://fonts.google.com/icons), filled shapes, one per direction:
// a column's own, not a row's turned
const GLYPHS = {
  'row': 'M686-450H160v-60h526L438-758l42-42 320 320-320 320-42-42 248-248Z', // arrow_forward
  'column': 'M450-800v526L202-522l-42 42 320 320 320-320-42-42-248 248v-526h-60Z', // arrow_downward
  'cross-start': 'M290-80v-640h100v640H290Zm280-240v-400h100v400H570ZM80-820v-60h800v60H80Z', // align_vertical_top
  'cross-start-col': 'M80-80v-800h60v800H80Zm160-210v-100h400v100H240Zm0-280v-100h640v100H240Z', // align_horizontal_left
  'cross-center': 'M290-120v-330H80v-60h210v-330h100v330h180v-210h100v210h210v60H670v210H570v-210H390v330H290Z', // align_vertical_center
  'cross-center-col': 'M450-80v-210H240v-100h210v-180H120v-100h330v-210h60v210h330v100H510v180h210v100H510v210h-60Z', // align_horizontal_center
  'cross-end': 'M80-80v-60h800v60H80Zm210-160v-640h100v640H290Zm280 0v-400h100v400H570Z', // align_vertical_bottom
  'cross-end-col': 'M820-80v-800h60v800h-60ZM320-290v-100h400v100H320ZM80-570v-100h640v100H80Z', // align_horizontal_right
  'along-start': 'M80-80v-800h60v800H80Zm450-210v-380h100v380H530Zm-240 0v-380h100v380H290Z', // align_justify_flex_start
  'along-center': 'M450-80v-800h60v800h-60Zm120-210v-380h100v380H570Zm-280 0v-380h100v380H290Z', // align_justify_center
  'along-end': 'M820-80v-800h60v800h-60ZM570-290v-380h100v380H570Zm-240 0v-380h100v380H330Z', // align_justify_flex_end
  'along-space-between': 'M820-80v-210H720v-380h100v-210h60v800h-60ZM80-80v-800h60v210h100v380H140v210H80Z', // align_justify_space_between
  'along-start-col': 'M80-820v-60h800v60H80Zm210 250v-100h380v100H290Zm0 240v-100h380v100H290Z', // align_start
  'along-center-col': 'M80-450v-60h800v60H80Zm210-120v-100h380v100H290Zm0 280v-100h380v100H290Z', // align_center
  'along-end-col': 'M80-80v-60h800v60H80Zm210-450v-100h380v100H290Zm0 240v-100h380v100H290Z', // align_end
  // the words' alignment in their box, drawn after format_align_left, _center and _right
  'text-start': 'M120-120v-60h720v60H120Zm0-165v-60h480v60H120Zm0-165v-60h720v60H120Zm0-165v-60h480v60H120Zm0-165v-60h720v60H120Z',
  'text-center': 'M120-120v-60h720v60H120Zm120-165v-60h480v60H240Zm-120-165v-60h720v60H120Zm120-165v-60h480v60H240Zm-120-165v-60h720v60H120Z',
  'text-end': 'M120-120v-60h720v60H120Zm240-165v-60h480v60H360Zm-240-165v-60h720v60H120Zm240-165v-60h480v60H360Zm-240-165v-60h720v60H120Z',
  'along-space-between-col': 'M290-720v-100H80v-60h800v60H670v100H290ZM80-80v-60h210v-100h380v100h210v60H80Z', // align_space_between
};
const glyph = (k) => `<svg viewBox="0 -960 960 960" class="ce-glyph ce-glyph--fill"><path d="${GLYPHS[k]}"/></svg>`;

/* A choice of two to four in one row, a word or a drawing each, the drawing named for screen readers and in its tooltip. */
function seg(label, name, options, value, set) {
  const id = `seg-${++pickers}`;
  return el('div', { class: 'ce-field' }, el('span', { id, text: label }),
    el('div', { class: 'segmented ce-segmented', role: 'radiogroup', 'aria-labelledby': id }, ...options.map(([v, text, svg]) => {
      const s = el('span', { 'aria-hidden': svg ? 'true' : null, text: svg ? null : text });
      if (svg) s.innerHTML = svg;
      return el('label', { class: 'seg', title: svg ? text : null },
        el('input', { type: 'radio', name: id, value: v, checked: v === value, 'aria-label': svg ? text : null, 'data-choice': `${name}-${v}`, class: 'visually-hidden', onchange: () => set(v) }), s);
    })));
}

/* ── the stage ── */
// A part being dragged on the stage is the stage's own node: drawn again under
// the pointer, the drag would carry a node no longer on the page. A draw asked
// for meanwhile waits for the drag's end.
let stageHeld = false, stageOwed = false;
function renderStage() {
  if (stageHeld) { stageOwed = true; return; }
  const host = $('[data-stage]');
  syncSelection();
  const c = contractNow();
  const id = ids(state.parts);
  const uidOf = new Map(Object.entries(id).map(([u, a]) => [a, u]));
  const all = choosers(c);
  for (const k of Object.keys(viewing)) if (!all.some((x) => x.key === k)) delete viewing[k];
  const anatomy = expand(c, viewing);
  if (selected.startsWith('at:') && !(idOf(selected) in anatomy)) selected = 'root';
  // the values chosen stand in for the defaults: an on/off part shown or hidden as its prop is
  const drafts = state.drafts.map((d) => (d.type === 'boolean' && camel(d.name) in viewing ? { ...d, default: viewing[camel(d.name)] } : d));
  const parts = fromAnatomy(anatomy, drafts, c.props);
  const keyOf = (n) => { const p = parts.find((x) => x.uid === n.uid); return !p || p.uid === 'root' ? 'root' : uidOf.get(p.at) || `at:${p.at}`; };
  const tree = preview(parts, drafts, tokens, { dark: isDark(), nested: nestedContract, iconOf, imageOf, sizeAxis, name: state.component.trim() });
  // where the part chosen sits, its containers to choose on the way
  const trail = [];
  for (let at = idOf(selected); at; at = at === 'root' ? null : (anatomy[at] || {}).parent || 'root') {
    const key = at === 'root' ? 'root' : uidOf.get(at) || `at:${at}`;
    trail.unshift([key, at === 'root' ? state.component.trim() || 'Component' : (findPart(key) || {}).name || partName(at)]);
  }
  // inside the modal's heading, which holds phrasing only: the trail its name is read from, each step a way back to it
  const crumbs = el('span', { class: 'ce-crumbs' }, ...trail.flatMap(([key, name], i) => [
    i ? el('span', { 'aria-hidden': 'true', text: '›' }) : null,
    el('button', { type: 'button', 'data-crumb': key, 'aria-current': i === trail.length - 1 ? 'true' : null, onclick: () => select(key), text: name })]));
  // the variant to draw it at, as Figma's instance panel lists it: a row per prop that makes one, an option a menu and an
  // on/off a switch, and the way back to the defaults beside the heading
  const keys = variantKeys(c);
  const shows = (x) => c.props[x.key].type === 'boolean' && (c.props[x.key].shows || []).length > 0;
  const set1 = (x, val) => { if (val === x.default) delete viewing[x.key]; else viewing[x.key] = val; };
  // only combinations Figma draws are offered: a value that would leave one undrawn (Disabled on at Focus) moves the other
  // props, one at a time, to their default or else their first value that draws, as Figma snaps an instance to a variant it has
  const at = () => Object.fromEntries(all.map((x) => [x.key, x.key in viewing ? viewing[x.key] : x.default]));
  const drawn = (m) => !(c.invalid || []).some((w) => Object.entries(w).every(([k, v]) => [].concat(v).includes(m[k])));
  const put = (x, val) => {
    set1(x, val);
    for (const y of all) {
      if (y === x || drawn(at())) continue;
      const to = [y.default, ...y.values].find((v) => drawn({ ...at(), [y.key]: v }));
      if (to !== undefined) set1(y, to);
    }
  };
  const views = el('section', { class: 'ce-views-at', 'aria-labelledby': 'views-at-title' },
    el('header', { class: 'ce-views-at__head' }, el('h3', { id: 'views-at-title', text: 'Properties' }),
      Object.keys(viewing).length || Object.keys(offDefault(c, variantValues(c))).length ? withSvg(el('button', { type: 'button', class: 'button button--ghost ce-views-at__reset', 'data-view-default': true, 'aria-label': 'Back to default', title: 'Back to default',
        onclick: () => { viewing = {}; renderParts({ stage: '[data-picker], [data-switch]' }); } }), '<path d="M4 12a8 8 0 1 0 2.3-5.6"/><path d="M4 4v4.5h4.5"/>') : null),
    // and an on/off that shows a part, as Figma's panel lists it; it only draws, so an edit stays the variant's (variantValues)
    // an on/off that only shows a part starts On, as the part is drawn; Off takes it away
    ...all.filter((x) => keys.includes(x.key) || shows(x)).map((x) => (shows(x) && !keys.includes(x.key) && !x.default ? { ...x, default: true } : x)).map((x) => {
      const now = x.key in viewing ? viewing[x.key] : x.default;
      if (c.props[x.key].type === 'boolean') {
        return el('label', { class: 'ce-field' }, el('span', { text: x.name }),
          el('input', { type: 'checkbox', role: 'switch', class: 'ce-switch', checked: now === true, 'data-switch': x.name,
            onchange: (ev) => { put(x, ev.target.checked); renderParts({ stage: `[data-switch="${x.name}"]` }); } }));
      }
      const to = (v) => { const val = x.values.find((y) => String(y) === v); put(x, val === undefined ? x.default : val); renderParts({ stage: `[data-picker="${x.name}"]` }); };
      return picker(x.name, x.values.map((v, i) => ({ name: String(v), label: x.labels[i], v })).filter((o) => drawn({ ...at(), [x.key]: o.v })).map(({ name, label }) => ({ name, label })), String(now), to, { clearable: false, noun: 'value' });
    }));
  // the component's name above its outer box, as Figma labels a frame: pointed at or clicked, it is the outer box
  // a part an on/off shows is drawn as any part until that switch is turned Off
  const hide = (n) => ({ ...n, children: n.children.filter((x) => !(x.off && viewing[camel(x.off)] === false)).map(hide) });
  const zoom = el('div', { class: 'ce-stage__zoom' }, tree ? drawPart(hide(tree), keyOf) : null,
    tree ? el('span', { class: 'ce-stage__name', 'data-stage-name': true, 'aria-hidden': 'true', text: state.component || 'Component' }) : null);
  const canvas = el('div', { class: 'ce-stage__canvas', 'data-zoom-at': zoomAt }, zoom);
  // the part as large as the stage allows, or at its own size
  const zooms = el('div', { class: 'segmented ce-segmented ce-stage__zooms', role: 'radiogroup', 'aria-label': 'Zoom' }, ...[['fit', 'Fit'], ['100', '100%']].map(([v, t]) =>
    el('label', { class: 'seg' }, el('input', { type: 'radio', name: 'zoom', value: v, checked: v === zoomAt, 'data-zoom': v, class: 'visually-hidden', onchange: () => { zoomAt = v; renderParts({ stage: `[data-zoom="${v}"]` }); } }), el('span', { text: t }))));
  $('[data-part-title]').replaceChildren(crumbs);
  // a component with no variant has no props to view it at, and no column for them
  const listed = keys.length || all.some(shows);
  $('[data-views]').replaceChildren(listed ? views : '');
  $('[data-views]').hidden = !listed;
  host.replaceChildren(zooms, canvas);
  // drawn as large as the stage allows, up to four times, so its spacing can be read and clicked
  const r = zoom.firstElementChild;
  const z = zoomAt === '100' ? 1 : r && r.offsetWidth ? Math.min(4, (canvas.clientWidth - 96) / r.offsetWidth, (canvas.clientHeight - 96) / r.offsetHeight) : 1;
  zoom.style.setProperty('--z', String(z));
  zoom.style.transform = `scale(${z})`;
  const chosen = host.querySelector(`[data-pv="${CSS.escape(selected)}"]`);
  if (chosen) { chosen.setAttribute('data-selected', ''); ring(chosen); if (chosen.matches('div.ce-pv') && holds((anatomy[idOf(selected)] || {}).kind)) spacing(chosen, anatomy[idOf(selected)]); }
}

// the chosen part's outline on the stage's layer, over the box, as its numbers are: a part filling a round box that clips it
// (an avatar's image) would lose an outline of its own
// the part pointed at, the one a click would choose, has a thinner one
function ring(box, hover = false) {
  const layer = box.closest('.ce-stage__zoom');
  const z = Number(layer.style.getPropertyValue('--z')) || 1;
  const [bx, by] = [box.getBoundingClientRect(), layer.getBoundingClientRect()];
  layer.append(el('span', { class: hover ? 'ce-ring ce-ring--hover' : 'ce-ring', 'aria-hidden': 'true', [hover ? 'data-hover' : 'data-ring']: true,
    style: css({ left: `${(bx.left - by.left) / z}px`, top: `${(bx.top - by.top) / z}px`, width: `${bx.width / z}px`, height: `${bx.height / z}px` }) }));
}

/*
 * Full version: a part dragged on the stage, as in Figma. The part itself
 * follows the pointer; over another part's middle along its container's flow
 * it takes that place, and the parts around slide aside to make room, live;
 * over a container's middle it goes inside it. Let go, it settles into its
 * place; Escape slides it back (knowledge: interaction, gestures and drag).
 * At a variant it moves among the parts beside it, there alone, as the
 * footer's arrows do.
 */
function stageDrag(e, key) {
  const c = contractNow(), values = variantValues(c), varied = Object.keys(offDefault(c, values)).length > 0;
  const zoom = $('[data-stage] .ce-stage__zoom');
  const source = zoom.querySelector(`[data-pv="${CSS.escape(key)}"]`);
  const z = Number(zoom.style.getPropertyValue('--z')) || 1;
  const start = { x: e.clientX, y: e.clientY }, id = e.pointerId;
  const home = { box: source.parentElement, next: source.nextElementSibling };
  const sb = source.getBoundingClientRect();
  const grab = { x: start.x - sb.left, y: start.y - sb.top };
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // snappier than a list's: the parts on a stage make room as Figma's do, at once
  const SNAP = { duration: 100, easing: 'cubic-bezier(0.2, 0, 0, 1)' };
  const pvOf = (n) => n && n.closest('[data-pv]');
  const upOf = (n) => pvOf(n.parentElement);
  const kids = (box) => [...box.children].filter((x) => x.matches('[data-pv]') && x !== source);
  const flow = (box) => (getComputedStyle(box).flexDirection.startsWith('column') ? 'y' : 'x');
  const kindOf = (k) => (k.startsWith('at:') ? (contractNow().anatomy[k.slice(3)] || {}).kind : (findPart(k) || {}).kind);
  // where among a container's parts the pointer is: before the first whose middle it has not passed, else last
  const among = (box, x, y) => {
    const ks = kids(box), ax = flow(box);
    const k = ks.findIndex((n) => { const b = settled(n, z); return ax === 'x' ? x < b.left + b.width / 2 : y < b.top + b.height / 2; });
    return k < 0 ? { box, before: null } : { box, before: ks[k] };
  };
  const aim = (x, y) => {
    let hit = pvOf(document.elementFromPoint(x, y));
    // never onto itself or into what it holds: the part it sits in takes the drop
    while (hit && source.contains(hit)) hit = upOf(hit);
    if (!hit || !zoom.contains(hit)) return null;
    const up = upOf(hit), holder = hit.dataset.pv === 'root' || holds(kindOf(hit.dataset.pv));
    if (up) {
      const b = settled(hit, z), ax = flow(up);
      const t = ax === 'x' ? (x - b.left) / b.width : (y - b.top) / b.height;
      if (!holder || t < 0.25 || t > 0.75) return { box: up, before: (holder ? t < 0.25 : t < 0.5) ? hit : kids(up)[kids(up).indexOf(hit) + 1] || null };
    }
    return among(hit, x, y);
  };
  // the part under the pointer, where it was taken
  const follow = (x, y) => { source.style.translate = '0 0'; const b = source.getBoundingClientRect(); source.style.translate = `${(x - grab.x - b.left) / z}px ${(y - grab.y - b.top) / z}px`; };
  // the parts around slide from where they were to where the move put them
  const slide = (change) => {
    const all = [...zoom.querySelectorAll('[data-pv]')].filter((n) => n !== source && !source.contains(n));
    const was = new Map(all.map((n) => [n, n.getBoundingClientRect()]));
    for (const n of all) for (const a of n.getAnimations()) a.cancel();
    change();
    if (still) return;
    const d = new Map(all.map((n) => { const r = n.getBoundingClientRect(), w = was.get(n); return [n, [(w.left - r.left) / z, (w.top - r.top) / z]]; }));
    for (const [n, [dx, dy]] of d) {
      const up = upOf(n), [px, py] = (up && d.get(up)) || [0, 0];
      if (Math.abs(dx - px) > 0.5 || Math.abs(dy - py) > 0.5) n.animate([{ transform: `translate(${dx - px}px, ${dy - py}px)` }, { transform: 'none' }], SNAP);
    }
  };
  // at a variant only among the parts beside it, in its own container
  const allowed = (d) => d && (!varied || d.box === home.box) && !(d.box === source.parentElement && (d.before === source.nextElementSibling || d.before === source));
  let moving = false;
  const onMove = (m) => {
    if (m.pointerId !== id) return;
    if (!moving) {
      if (Math.hypot(m.clientX - start.x, m.clientY - start.y) < 3) return;
      moving = true;
      for (const x of zoom.querySelectorAll('[data-ring], .ce-tag, .ce-bands')) x.remove();
      source.setAttribute('data-carried', '');
      document.documentElement.setAttribute('data-dragging', '');
    }
    const d = aim(m.clientX, m.clientY);
    if (allowed(d)) slide(() => d.box.insertBefore(source, d.before));
    follow(m.clientX, m.clientY);
  };
  // it settles from under the pointer into its place, then the page takes the move
  const land = (then) => {
    const from = source.style.translate;
    source.style.translate = '';
    const finish = () => { landing = false; source.removeAttribute('data-carried'); then(); };
    if (still) { finish(); return; }
    landing = true;
    source.animate([{ translate: from }, { translate: '0 0' }], SNAP).finished.then(finish, finish);
  };
  const end = (commit) => {
    if (dragging === end) dragging = null;
    off();
    document.documentElement.removeAttribute('data-dragging');
    const owed = stageOwed;
    stageHeld = stageOwed = false;
    if (!moving) { if (owed) renderStage(); return; }
    const moved = source.parentElement !== home.box || source.nextElementSibling !== home.next;
    if (!commit || !moved) { slide(() => home.box.insertBefore(source, home.next)); land(() => renderParts()); return; }
    const box = source.parentElement, after = kids(box).filter((n) => n.compareDocumentPosition(source) & Node.DOCUMENT_POSITION_FOLLOWING).pop() || null;
    const before = source.nextElementSibling && source.nextElementSibling.matches('[data-pv]') ? source.nextElementSibling : null;
    land(() => {
      const p = findPart(key), name = (p && p.name) || 'the part';
      if (varied) {
        const to = kids(box).indexOf(after) + 1;
        const next2 = moveAt(c, values, idOf(key), to), was = state.base.variants;
        if (next2) state.base.variants = toBase(c, next2);
        renderParts();
        // as the footer's arrows do: an Undo bar left from an earlier move would put back the variants from before this one
        if (next2) offerUndo(`Moved ${name} ${whereSaid(c, values)}.`, () => { state.base.variants = was; renderParts(); });
        return;
      }
      const placed = after ? place(state.parts, key, after.dataset.pv, 'after') : before ? place(state.parts, key, before.dataset.pv, 'before') : place(state.parts, key, box.dataset.pv, 'inside');
      if (placed !== state.parts) state.parts = placed;
      renderParts();
      const t = findPart(box.dataset.pv);
      status(`Moved ${name} ${after ? `after ${findPart(after.dataset.pv)?.name || 'a part'}` : before ? `before ${findPart(before.dataset.pv)?.name || 'a part'}` : `into ${t && t.uid !== 'root' ? t.name : 'Outer box'}`}.`);
    });
  };
  const onUp = (u) => { if (u.pointerId === id) end(true); };
  const onCancel = (c2) => { if (c2.type === 'blur' || c2.pointerId === id) end(false); };
  const onKey = (k) => { if (k.key === 'Escape' && moving) { k.preventDefault(); k.stopPropagation(); end(false); status('Drag cancelled.'); } };
  dragging?.(false);
  dragging = end;
  stageHeld = true;
  const off = listen({ pointermove: onMove, pointerup: onUp, pointercancel: onCancel, keydown: onKey, blur: onCancel });
}

/*
 * The chosen container's padding and gap, on it as a browser's dev tools show
 * them: tinted bands, and on each its number. They are set in the rows, the
 * one place each is set.
 */
function spacing(box, e) {
  const cs = getComputedStyle(box);
  const pad = { top: parseFloat(cs.paddingTop), end: parseFloat(cs.paddingRight), bottom: parseFloat(cs.paddingBottom), start: parseFloat(cs.paddingLeft) };
  const L = e.layout || {};
  const col = L.direction === 'column';
  const w = box.clientWidth, h = box.clientHeight;
  // the numbers go on the stage's layer, over the box, so a box that clips what it holds, or one it sits in, leaves them whole
  const layer = box.closest('.ce-stage__zoom');
  const z = Number(layer.style.getPropertyValue('--z')) || 1;
  const [bx, by] = [box.getBoundingClientRect(), layer.getBoundingClientRect()];
  const dx = (bx.left - by.left) / z + box.clientLeft, dy = (bx.top - by.top) / z + box.clientTop;
  const band = (style, gap) => el('span', { class: 'ce-band' + (gap ? ' ce-band--gap' : ''), style: css(style) });
  const bands = el('span', { class: 'ce-bands', 'aria-hidden': 'true' },
    band({ left: 0, right: 0, top: 0, height: `${pad.top}px` }), band({ left: 0, right: 0, bottom: 0, height: `${pad.bottom}px` }),
    band({ left: 0, top: `${pad.top}px`, bottom: `${pad.bottom}px`, width: `${pad.start}px` }), band({ right: 0, top: `${pad.top}px`, bottom: `${pad.bottom}px`, width: `${pad.end}px` }));
  // shown, not set: the padding rows set them, so the numbers are left out of the tab order and the reading
  const tag = (label, v, x, y, gap = false) => el('span', { class: 'ce-tag' + (gap ? ' ce-tag--gap' : ''), style: css({ left: `${x + dx}px`, top: `${y + dy}px` }), 'aria-hidden': 'true', 'data-tag': label, text: lengthSaid(v) });
  const P = L.padding || {};
  box.append(bands);
  // a side with no padding has no number: a 0 sat on the box's edge, read as a value somewhere outside it
  layer.append(...[
    pad.top && tag('Top padding', P.top, w / 2, pad.top / 2), pad.bottom && tag('Bottom padding', P.bottom, w / 2, h - pad.bottom / 2),
    pad.start && tag('Left padding', P.start, pad.start / 2, h / 2), pad.end && tag('Right padding', P.end, w - pad.end / 2, h / 2)].filter(Boolean));
  // the gap between each two parts in the flow; its number once, on the first
  const kids = [...box.children].filter((k) => k.matches('.ce-pv') && getComputedStyle(k).position !== 'absolute');
  kids.slice(1).forEach((b, i) => {
    const a = kids[i];
    const s = col ? { left: `${pad.start}px`, right: `${pad.end}px`, top: `${a.offsetTop + a.offsetHeight}px`, height: `${Math.max(0, b.offsetTop - a.offsetTop - a.offsetHeight)}px` }
      : { top: `${pad.top}px`, bottom: `${pad.bottom}px`, left: `${a.offsetLeft + a.offsetWidth}px`, width: `${Math.max(0, b.offsetLeft - a.offsetLeft - a.offsetWidth)}px` };
    bands.append(band(s, true));
    if (i || !parseFloat(s.height ?? s.width)) return;
    const mid = col ? [w / 2, (a.offsetTop + a.offsetHeight + b.offsetTop) / 2] : [(a.offsetLeft + a.offsetWidth + b.offsetLeft) / 2, h / 2];
    layer.append(tag('Gap', L.gap, ...mid, true));
  });
}

/* A part opened from the tree, or chosen on the stage once open: the modal shows it; `into` takes the focus. */
const partOpen = () => $('[data-part-dialog]').open;
function select(key, into = null) {
  // a part being added is kept once another part is chosen, unless that part sits in it
  const inside = (k, uid) => { for (let x = findPart(k); x; x = findPart(x.parent)) if (x.uid === uid) return true; return false; };
  while (adding.length && !inside(key, adding[adding.length - 1].uid)) adding.pop();
  selected = key;
  $('[data-stage]').removeAttribute('data-bare');
  const d = $('[data-part-dialog]');
  if (!d.open) d.showModal();
  renderParts({ into });
  // showModal focused a field this draw replaced: the part's first field takes the focus, never the page behind; with
  // none to change (a part Figma draws, read at a variant), the dialog's close
  if (!d.contains(document.activeElement)) ($('[data-inspector] :is(input, button):not(:disabled)') || $('[data-part-close]', d)).focus();
}
// a part Figma has drawn: its look is Figma's, shown here and changed there (a part only a variant adds, too)
const lockedNow = () => { const p = findPart(selected); return p ? fromFigma(p) : !currentDraft && !!drawnFrom(); };

// a length as its token's size, a number as itself, else its name's last segment; none is 0
const lengthSaid = (v) => { const t = tokens.lengths.find((x) => x.name === v); return t ? String(t.value) : typeof v === 'number' ? String(v) : typeof v === 'string' ? v.split('/').pop() : '0'; };
/*
 * Four lengths, as Figma's panel sets them: in pairs (padding left and right, top and bottom; a radius all four
 * corners), or each alone once the toggle beside them is on, as it is where the pair's values differ. Each is its
 * token's size on a button that opens the token to set.
 */
const eachOpen = new Map();
function fours(label, at, list, now, put, { pairs, each, word }) {
  const key = `${at}:${label}`;
  const mixed = pairs.some(([ks]) => ks.some((k) => (now[k] ?? null) !== (now[ks[0]] ?? null)));
  const one = eachOpen.get(key) ?? mixed;
  const button = ([ks, name, mark]) => {
    const v = now[ks[0]];
    const alike = ks.every((k) => (now[k] ?? null) === (v ?? null));
    const b = el('button', { type: 'button', class: 'ce-pad', 'data-pad': ks.join(','), title: name, 'aria-label': `${name}: ${!alike ? 'mixed' : typeof v === 'string' ? v : 'none'}` },
      el('span', { class: 'ce-pad__side', 'aria-hidden': 'true', text: mark }), el('span', { text: alike ? lengthSaid(v) : 'Mixed' }));
    const set = (x) => { const n = { ...now }; for (const k of ks) { if (x) n[k] = x; else delete n[k]; } put(n); $(`[data-pad="${ks.join(',')}"]`)?.focus(); };
    return [b, picker(name, list, alike && typeof v === 'string' ? v : null, set, { none: 'None', trigger: b })];
  };
  const toggle = el('button', { type: 'button', class: 'ce-pad ce-pad--each', 'data-each': label, 'aria-pressed': String(one), title: `Each ${word}`, 'aria-label': `Each ${word}`,
    text: '⛶', onclick: () => { eachOpen.set(key, !one); renderParts({ into: `[data-each="${label}"]` }); } });
  return el('div', { class: 'ce-field', 'data-fours': label }, el('span', { text: label }),
    el('div', { class: 'ce-pads', style: `--n: ${(one ? each : pairs).length}` }, ...(one ? each.map(([k, name, mark]) => [[k], name, mark]) : pairs).flatMap(button), toggle));
}
// a container's padding, a side each: left and right, then top and bottom
const pads = (at, L, put) => fours('Padding', at, tokensFor('lengths', 'padding'), L.padding || {}, put, { word: 'side',
  pairs: [[['start', 'end'], 'Left and right padding', '↔'], [['top', 'bottom'], 'Top and bottom padding', '↕']],
  each: [['start', 'Left padding', '←'], ['end', 'Right padding', '→'], ['top', 'Top padding', '↑'], ['bottom', 'Bottom padding', '↓']] });
// a radius: one for all four corners, or each its own, the contract's four in Figma's order (top left, top right,
// bottom right, bottom left), listed here as they are read
const CORNERS = ['tl', 'tr', 'br', 'bl'];
const corners = (at, r, put) => fours('Corners', at, tokensFor('lengths', 'radius'),
  Array.isArray(r) ? Object.fromEntries(CORNERS.map((k, i) => [k, r[i] || null])) : Object.fromEntries(CORNERS.map((k) => [k, r ?? null])),
  (n) => { const v = CORNERS.map((k) => n[k] ?? null); put(v.every((x) => x === v[0]) ? v[0] : v.map((x) => x ?? 0)); },
  { word: 'corner', pairs: [[CORNERS, 'All corners', '▢']],
    each: [['tl', 'Top left corner', '⌜'], ['tr', 'Top right corner', '⌝'], ['bl', 'Bottom left corner', '⌞'], ['br', 'Bottom right corner', '⌟']] });

/* ── the part chosen: its links to props, then its look, a row each ── */
function renderInspector() {
  const host = $('[data-inspector]');
  const c = contractNow();
  const at = idOf(selected);
  const p = selected.startsWith('at:') ? null : findPart(selected);
  const values = variantValues(c);
  const varied = Object.keys(offDefault(c, values)).length > 0;
  const anatomy = expand(c, viewing);
  const isRoot = selected === 'root';
  // a component with no parts yet still has its outer box to set and add into
  const e = anatomy[at] || (isRoot ? { kind: 'container' } : undefined);
  const kind = (e || p || {}).kind;
  const ro = readOnly();
  const locked = ro || lockedNow();
  const done = (into) => renderParts({ into });
  const tok = (v) => (typeof v === 'string' ? v : null);
  const none = (v) => (v != null && typeof v !== 'string' ? 'Mixed' : 'Add');
  // at a variant, a dot on each row it changes: filled where this variant's own layer does, and a click puts it back
  const mark = (f, field, i = at, sub = null) => {
    if (!f || !varied || !p) return f;
    const ch = changed(c, values, i, field);
    const base = (expand(c, {})[i] || {})[field];
    if (!ch || (sub && JSON.stringify((base || {})[sub] ?? null) === JSON.stringify(((anatomy[i] || {})[field] || {})[sub] ?? null))) return f;
    // the focus back on the row's control once it is drawn again
    const ctl = f.querySelector('[data-picker], [data-choice], input');
    const back = ctl && (ctl.dataset.picker ? `[data-picker="${ctl.dataset.picker}"]` : ctl.dataset.choice ? `[data-choice^="${ctl.dataset.choice.split('-')[0]}-"]` : null);
    const reset = () => (sub ? write([[i, field, { ...((anatomy[i] || {})[field] || {}), [sub]: (base || {})[sub] }]], back) : (state.base.variants = toBase(c, unset(c, values, i, field)), renderParts({ into: back })));
    // a change this variant can put back is a button; one it cannot (another layer's, or Figma's) is a mark, said in
    // words a screen reader reaches, never on a disabled button no one can focus
    const what = ch.own ? 'Changed for this variant' : `Changed when ${conditionText(ch.by)}`;
    f.append(ch.own && !locked
      ? el('button', { type: 'button', class: 'ce-dot', 'data-dot': sub || field, 'aria-label': `${what}: put back`, title: `${what}: click to put it back`, onclick: reset })
      : el('span', { class: 'ce-dot' + (ch.own ? '' : ' ce-dot--under'), 'data-dot': sub || field, role: 'img', 'aria-label': what, title: what }));
    return f;
  };
  const pick = (label, list, field, opts = {}) => mark(picker(label, list, tok((e || {})[field]), (v) => write([[at, field, v]], `[data-picker="${label}"]`), { none: none((e || {})[field]), ...opts }), field);

  // what the contract owns: the part's name, kind and place, and its links to props; the component's, at its defaults
  const api = !p || isRoot || varied ? [] : [
    el('label', { class: 'ce-field' }, el('span', { text: 'Name' }), el('input', { class: 'filter', value: p.name, 'data-name': true, 'data-field': 'name', 'aria-invalid': p.name.trim() ? null : 'true',
      oninput: (ev) => { p.name = ev.target.value; renderParts({ inspector: false }); said(ev.target); } })),
    picker('Kind', PART_KINDS.map(([v, t]) => ({ name: v, label: t })), p.kind, (v) => { if (v === 'graphic' && p.kind !== 'graphic' && !p.shape) p.shape = 'rectangle'; p.kind = v; if (holds(v) && !p.layout) p.layout = { direction: 'row' }; if (v === 'text' && !p.text && !p.textProp) p.text = 'Text'; done('[data-picker="Kind"]'); }, { clearable: false, noun: 'kind' }),
    picker('Inside', homes(state.parts, p.uid).map((x) => ({ name: x.uid, label: x.uid === 'root' ? 'Outer box' : (x.name || 'Unnamed container') })), p.parent, (v) => { p.parent = v || 'root'; unfold(p.parent); done('[data-picker="Inside"]'); }, { none: 'Outer box', noun: 'container', clearable: false }),
    propSelect('Shown by', 'boolean', p.shownBy, (v) => { p.shownBy = v; done('[data-picker="Shown by"]'); }, 'Always shown'),
    ...(p.kind === 'text' ? [
      propSelect('Text property', 'string', p.textProp, (v) => { p.textProp = v; done('[data-picker="Text property"]'); }, 'Fixed text', 'content'),
      p.textProp ? null : el('label', { class: 'ce-field' }, el('span', { text: 'Fixed text' }), el('input', { class: 'filter', value: p.text || '', 'data-fixed-text': true, 'data-field': 'content', oninput: (ev) => { p.text = ev.target.value; renderParts({ inspector: false }); said(ev.target); } })),
    ] : []),
    ...(p.kind === 'instance' ? [
      // another component, other props: its values start again from its defaults, and its layers were the old one's
      componentPicker('Component', p.component, (v) => { p.component = v; p.with = {}; p.inner = {}; const sw = p.swapProp != null && state.drafts[find(p.swapProp)]; if (sw && v) sw.default = v; const z = iconSizes(v)[0]; if (z) { p.with[sizeAxis] = String(z); p.width = p.height = z; } done('[data-picker="Component"]'); }),
      propSelect('Swapped by', 'instance', p.swapProp, (v) => { p.swapProp = v; done('[data-picker="Swapped by"]'); }, 'Nothing'),
    ] : []),
    p.kind === 'slot' ? propSelect('Filled by', 'slot', p.slotProp, (v) => { p.slotProp = v; done('[data-picker="Filled by"]'); }, 'Nothing') : null,
  ].filter(Boolean);
  const problem = p && partProblems([root(), p]).find((x) => x.uid === p.uid);
  // a problem said under the rows as the field is typed, the field it is about marked, and gone once fixed
  const said = (input) => {
    const now = partProblems([root(), p]).find((x) => x.uid === p.uid);
    for (const f of host.querySelectorAll('[data-field]')) if (now && f.dataset.field === now.field) f.setAttribute('aria-invalid', 'true'); else f.removeAttribute('aria-invalid');
    const box = host.querySelector('[data-field-error]');
    if (box) { sayError(box, now ? now.message : ''); const f = now && host.querySelector(`[data-field="${now.field}"]`); if (f) (f.closest('.ce-field') || f).after(box); }
    if (now) input.setAttribute('aria-describedby', 'part-problem'); else input.removeAttribute('aria-describedby');
  };

  // a width or a height: its content's, its container's, or a number of pixels; the number beside is the pixels, or else the least it may be
  const size = (label, k) => {
    // stretched with its box (a focus ring): no size of its own, its Horizontal or Vertical row says it
    if ((e.position === 'absolute' || e.absolute) && (e.constraints || {})[k === 'width' ? 'horizontal' : 'vertical'] === 'stretch') return null;
    const v = e[k];
    const min = k === 'width' ? 'minWidth' : 'minHeight';
    // a token bound to it is a fixed size too, as a card's width to three of the grid's columns: named, its last word shown
    const mode = v === 'fill' ? 'fill' : v == null || v === 'hug' ? 'hug' : 'fixed';
    const f = seg(label, k, [['hug', 'Fit'], ['fill', 'Fill'], ['fixed', 'Fixed']], mode,
      (m) => write(m === 'fixed' ? [[at, k, mode === 'fixed' ? v : 24], [at, min, null]] : [[at, k, m]], `[data-choice="${k}-${m}"]`));
    const n = mode === 'fixed' ? v : e[min];
    f.append(el('input', { class: 'filter ce-num', inputmode: 'decimal', value: n == null ? '' : String(n).split('/').pop(), title: typeof n === 'string' ? n : null, placeholder: mode === 'fixed' ? '' : 'min',
      'aria-label': mode === 'fixed' ? `${label} in pixels` : `Least ${label.toLowerCase()} in pixels`, 'data-size': mode === 'fixed' ? k : null, 'data-min': mode === 'fixed' ? null : k,
      onchange: (ev) => { const x = Number(ev.target.value); const back = `[data-size="${k}"], [data-min="${k}"]`; if (!ev.target.value.trim() && mode !== 'fixed') write([[at, min, null]], back); else if (Number.isFinite(x) && x > 0) write([[at, mode === 'fixed' ? k : min, x]], back); } }));
    return mark(mark(f, k), min);
  };
  // a box's border: its colour, then, once it has one, its width
  const strokeFields = () => {
    const border = e.border || {};
    return [
      mark(picker('Border', tokensFor('colours', 'stroke'), tok(border.color), (v) => write([[at, 'border', v ? { ...border, color: v } : null]], '[data-picker="Border"]'), { none: none(border.color) }), 'border', at, 'color'),
      border.color ? mark(picker('Border width', tokensFor('lengths', 'strokeWidth'), tok(border.width), (v) => write([[at, 'border', { ...border, width: v || undefined }]], '[data-picker="Border width"]'), { none: none(border.width) }), 'border', at, 'width') : null,
    ];
  };
  const look = [];
  // where it sits, as Figma's position panel says it: in its parent's flow or out of it, and then, each way, the edge
  // it is pinned to (Left, Right, both, the centre) and how far from it; out of the flow is a part's in a box no auto
  // layout places, always
  const place = () => {
    if (!e || isRoot) return [];
    const up = anatomy[e.parent];
    const flows = !!(up && up.layout);
    const out = e.position === 'absolute' || !flows;
    const rows = [];
    if (flows) rows.push(mark(seg('Position', 'position', [['flow', 'In the flow'], ['absolute', 'Absolute']], out ? 'absolute' : 'flow',
      (v) => write(v === 'absolute' ? [[at, 'position', 'absolute'], [at, 'absolute', { x: 0, y: 0 }], [at, 'constraints', { horizontal: 'min', vertical: 'min' }]] : [[at, 'position', null], [at, 'absolute', null], [at, 'constraints', null]], `[data-choice="position-${v}"]`)), 'position'));
    if (!out) return rows;
    const cons = e.constraints || { horizontal: 'min', vertical: 'min' }, a = e.absolute || { x: 0, y: 0 };
    // the size it is drawn at, for a part no longer stretched, which needs one of its own
    const drawn = (k) => { const n = document.querySelector(`[data-stage] [data-pv="${p ? p.uid : at}"]`); return n ? Math.round(k === 'width' ? n.offsetWidth : n.offsetHeight) || 24 : 24; };
    // its box drawn with the part inside, an offset on each side: a side with a number is pinned to its box's edge,
    // one with none is free ("auto", as CSS says it); both pinned, it stretches with its box; neither, it is centred
    const AXES = { horizontal: ['x', 'end', 'width'], vertical: ['y', 'bottom', 'height'] };
    const pinned = (axis, far) => { const c = cons[axis] || 'min'; return c === 'stretch' || c === (far ? 'max' : 'min'); };
    const side = (axis, far, word, area) => {
      const [nk, fk, sk] = AXES[axis], key = far ? fk : nk, on = pinned(axis, far);
      // a far offset an older contract never recorded: the near one, as the preview takes it
      const shown = on ? (a[key] ?? (far ? a[nk] : null)) : null;
      const said = shown == null ? 'auto' : String(shown).replace('-', '−');
      // read only, the number as text: nothing to type into
      if (locked) return el('span', { class: 'ce-inset__side', style: `grid-area: ${area}`, 'data-offset': key, 'aria-label': `${word}: ${shown == null ? 'free' : `${said} from its box`}` }, el('span', { class: shown == null ? 'ce-inset__auto' : null, text: said, 'aria-hidden': 'true' }));
      return el('label', { class: 'ce-inset__side', style: `grid-area: ${area}`, title: on ? `Pinned ${a[key]} from its box's ${word.toLowerCase()}` : `Free at the ${word.toLowerCase()}` },
        el('span', { class: 'visually-hidden', text: word }),
        el('input', { class: 'filter ce-num', inputmode: 'decimal', placeholder: 'auto', value: shown == null ? '' : said, 'aria-label': `${word}, in pixels from its box; empty is free`, 'data-offset': key,
          onchange: (ev) => {
            const raw = ev.target.value.trim(), x = Number(raw.replace('−', '-'));
            if (raw && !Number.isFinite(x)) return;
            const other = pinned(axis, !far), was = cons[axis] || 'min';
            const now = raw ? (other ? 'stretch' : far ? 'max' : 'min') : other ? (far ? 'min' : 'max') : 'center';
            // the other side's offset as shown, written down where the contract left it to be taken
            const next = { ...a, ...(other && a[far ? nk : fk] == null ? { [far ? nk : fk]: a[far ? fk : nk] } : {}), ...(raw ? { [key]: x } : {}) };
            if (now !== 'stretch' && now !== 'max') delete next[fk];
            write([[at, 'constraints', { ...cons, [axis]: now }], [at, 'absolute', next], ...(now === 'stretch' ? [[at, sk, null]] : was === 'stretch' ? [[at, sk, drawn(sk)]] : [])], `[data-offset="${key}"]`);
          } }));
    };
    rows.push(mark(mark(el('div', { class: 'ce-field' }, el('span', { text: 'Offsets' }),
      el('div', { class: 'ce-inset', role: 'group', 'aria-label': 'Offsets from its box' },
        side('vertical', false, 'Top', 'top'), side('horizontal', false, 'Left', 'left'),
        el('span', { class: 'ce-inset__part', 'aria-hidden': 'true' }),
        side('horizontal', true, 'Right', 'right'), side('vertical', true, 'Bottom', 'bottom'))), 'constraints'), 'absolute'));
    return rows;
  };
  look.push(...place());
  if (e && holds(kind)) {
    const L = e.layout || {};
    const col = L.direction === 'column';
    const putL = (k, v) => { const n = { ...L }; if (v == null || (v === 'start' && k !== 'direction')) delete n[k]; else n[k] = v; return [[at, 'layout', n]]; };
    const named = col ? { cross: ['Left', 'Centre', 'Right'], along: ['Top', 'Middle', 'Bottom'] } : { cross: ['Top', 'Middle', 'Bottom'], along: ['Left', 'Centre', 'Right'] };
    look.push(
      mark(seg('Direction', 'dir', [['row', 'Side by side', glyph('row')], ['column', 'Stacked', glyph('column')]], L.direction || 'row', (v) => write(putL('direction', v), `[data-choice="dir-${v}"]`)), 'layout', at, 'direction'),
      mark(seg('Align', 'cross', ['start', 'center', 'end'].map((v, i) => [v, named.cross[i], glyph(`cross-${v}${col ? '-col' : ''}`)]), L.crossAlign || 'start', (v) => write(putL('crossAlign', v), `[data-choice="cross-${v}"]`)), 'layout', at, 'crossAlign'),
      mark(seg('Justify', 'along', [...['start', 'center', 'end'].map((v, i) => [v, named.along[i]]), ['space-between', 'Space between']].map(([v, t]) => [v, t, glyph(`along-${v}${col ? '-col' : ''}`)]), L.align || 'start', (v) => write(putL('align', v), `[data-choice="along-${v}"]`)), 'layout', at, 'align'),
      mark(picker('Gap', tokensFor('lengths', 'gap'), tok(L.gap), (v) => write(putL('gap', v), '[data-picker="Gap"]'), { none: none(L.gap) }), 'layout', at, 'gap'),
      mark(pads(at, L, (pad) => write(putL('padding', Object.keys(pad).length ? pad : null), null)), 'layout', at, 'padding'),
      size('Width', 'width'), size('Height', 'height'),
      pick('Background', tokensFor('colours', 'background'), 'background'),
      mark(corners(at, e.radius, (v) => write([[at, 'radius', v]], null)), 'radius'),
      pick('Shadow', tokens.shadows || [], 'shadow'),
      ...strokeFields());
  }
  if (e && kind === 'text') look.push(
    pick('Text style', tokens.textStyles.map((n) => ({ group: n.split('/')[0], name: n })), 'typography'),
    pick('Colour', tokensFor('colours', 'color'), 'color'),
    mark(seg('Align', 'text', [['start', 'Left'], ['center', 'Centre'], ['end', 'Right']].map(([v, t]) => [v, t, glyph(`text-${v}`)]), e.textAlign || 'start', (v) => write([[at, 'textAlign', v === 'start' ? null : v]], `[data-choice="text-${v}"]`)), 'textAlign', at),
    size('Width', 'width'), size('Height', 'height'));
  if (e && kind === 'instance') {
    // an icon's colour is its glyph's fill, inside it; an icon's size, one it is drawn at, never hugged or stretched
    const glyphs = Object.keys(anatomy).filter((k) => k.startsWith(at + '/') && anatomy[k].kind === 'graphic');
    const g = glyphs.length === 1 ? glyphs[0] : null;
    const component = (p && p.component) || e.component;
    const sizes = iconSizes(component);
    // given none, an icon is drawn in its own colour (the snapshot's), shown as its value until another is chosen
    const colour = (g ? anatomy[g].background : e.color) ?? (component && (tokens.iconColours || {})[component.split('/').pop()]);
    look.push(...(p && !varied ? instanceProps(p) : []),
      g || sizes.length ? mark(picker('Colour', tokensFor('colours', 'fill'), tok(colour), (v) => write([g && varied ? [g, 'background', v] : [at, 'color', v]], '[data-picker="Colour"]'), { none: none(colour) }), g && varied ? 'background' : 'color', g && varied ? g : at) : null);
    if (sizes.length) {
      const now = sizeAxis && e.with && e.with[sizeAxis] ? String(e.with[sizeAxis]) : typeof e.width === 'number' ? String(e.width) : '';
      look.push(mark(seg('Size', 'icon-size', sizes.map((z) => [String(z), `${z}`]), now, (v) => write([[at, 'with', { ...(e.with || {}), ...(sizeAxis ? { [sizeAxis]: v } : {}) }], [at, 'width', Number(v)], [at, 'height', Number(v)]], `[data-choice="icon-size-${v}"]`)), 'with'));
    } else look.push(size('Width', 'width'), size('Height', 'height'));
  }
  // a shape: a rectangle or an ellipse, its fill, border and corners (a rectangle's); a library's drawn vector, its fill
  if (e && kind === 'graphic') {
    const drawn = e.shape === 'rectangle' || e.shape === 'ellipse';
    look.push(
      drawn ? mark(seg('Shape', 'shape', [['rectangle', 'Rectangle'], ['ellipse', 'Ellipse']], e.shape, (v) => write([[at, 'shape', v]], `[data-choice="shape-${v}"]`)), 'shape') : null,
      pick('Fill', tokensFor('colours', 'fill'), 'background'),
      ...(drawn ? strokeFields() : []),
      e.shape === 'rectangle' ? mark(corners(at, e.radius, (v) => write([[at, 'radius', v]], null)), 'radius') : null,
      size('Width', 'width'), size('Height', 'height'));
  }
  // how see-through a part is, any kind: a state's dim (Disabled, Loading) by its token, the value beside it; read, only where set
  // a literal (a value no token binds) said as it is, not as Mixed
  if (e && (!locked || e.opacity !== undefined)) look.push(pick('Opacity', tokensFor('lengths', 'opacity'), 'opacity', typeof e.opacity === 'number' ? { none: String(e.opacity) } : {}));

  // read, not edited: the part's name, kind and place are said as its look is, none to change here
  host.replaceChildren(
    ...(ro ? [] : api), p && !isRoot && !varied && !ro ? fieldError(problem ? problem.message : '', { id: 'part-problem', role: 'status', 'data-field-error': true }) : '',
    !e ? el('div', { class: 'ce-gone' }, el('p', { class: 'ce-hint', text: 'Not drawn at these values.' }),
      // deleted at this variant, by its own layer: put back here; deleted by another, its row's Not in chip says where
      p && !ro && restoreAt(c, values, at) ? el('button', { type: 'button', class: 'button', 'data-put-back': true, text: 'Put back',
        onclick: () => { state.base.variants = toBase(c, restoreAt(c, values, at)); renderParts({ into: '[data-delete-part]' }); status(`Put ${p.name || 'the part'} back ${whereSaid(c, values)}.`); } }) : null)
      : locked ? el('fieldset', { class: 'ce-look', disabled: true, 'data-from-figma': true }, withSvg(el('legend', { class: 'ce-look__note' }, el('span', { text: ro ? 'Drawn in Figma: it changes there.' : 'Drawn in Figma: its look changes there.' })), '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'), ...(ro ? api : []), ...look.filter(Boolean))
        : el('div', { class: 'ce-look' }, ...look.filter(Boolean)));
  // in the modal's footer, kept in view as the rows scroll
  // parts added here go inside the container chosen, as the panel's blocks do, which the modal covers
  // the parts are the component's: at other values they stay in sight, off, and the footer says how to change them,
  // in words each describes (a disabled button takes no focus, so a tooltip on it is never read)
  const off = varied ? { disabled: true } : {};
  // nothing added, moved or deleted while the component is read, not edited
  $('[data-part-add]').replaceChildren(...(holds(kind) && !selected.startsWith('at:') && !ro ? [el('span', { class: 'ce-part-modal__add-label', text: 'Add inside' }),
    ...PART_KINDS.map(([k, label]) => withIcon(el('button', { type: 'button', class: 'button button--ghost ce-part-modal__add', 'data-add-inside': k, ...off, title: label, 'aria-label': `Add ${label.toLowerCase()} inside`, onclick: () => addPart(k, { target: selected, where: 'inside' }, { fromModal: true }) }), PART_ICON[k]))] : []));
  // moved among the parts beside it without leaving the modal, the arrows the way its container lays them out; at a
  // variant, among the parts beside it there, and there alone (variants.mjs)
  const sibs = !p ? [] : varied ? Object.keys(anatomy).filter((x) => e && anatomy[x].parent === e.parent).sort((a, b) => (anatomy[a].order ?? 0) - (anatomy[b].order ?? 0)) : state.parts.filter((x) => x.parent === p.parent);
  const k = sibs.indexOf(varied ? at : p);
  const across = ((anatomy[varied ? (e || {}).parent : idOf((p && p.parent) || 'root')] || {}).layout || {}).direction !== 'column';
  const moved = (to) => { if (!varied) return shiftPart(p, to); const was = state.base.variants; state.base.variants = toBase(c, moveAt(c, values, at, to)); renderParts({ into: '[data-move]' });
    offerUndo(`Moved ${p.name || 'the part'} ${whereSaid(c, values)}.`, () => { state.base.variants = was; renderParts(); }); };
  const move = (to, dir) => el('button', { type: 'button', class: 'button button--ghost ce-part-modal__add', 'data-move': dir, disabled: !sibs[to], title: dir === 'earlier' ? 'Move earlier' : 'Move later',
    'aria-label': dir === 'earlier' ? 'Move earlier' : 'Move later', text: dir === 'earlier' ? (across ? '←' : '↑') : (across ? '→' : '↓'), onclick: () => { moved(to); ($(`[data-move="${dir}"]:not(:disabled)`) || $('[data-move]:not(:disabled)'))?.focus(); } });
  // the footer of a part being added while it is the one shown; any other part shown keeps its own
  const pending = addingNow() && addingNow().uid === selected;
  $('[data-part-cancel]').hidden = !pending;
  $('[data-part-done]').textContent = pending ? 'Add part' : 'Close';
  $('[data-part-done]').classList.toggle('button--primary', !!pending);
  // at a variant, deleted there alone (variants.mjs); not drawn there, there is nothing to delete
  const manyVariants = variantKeys(c).length > 0;
  $('[data-part-delete]').replaceChildren(...(p && !isRoot && !ro && e ? [pending ? '' : el('button', { type: 'button', class: 'button ce-delete', 'data-delete-part': true,
    // from the variant shown, the defaults too, as a Figma variant is its own frame; from them all is the tree's row menu.
    // A component with no variants has one, so its delete is the part's
    onclick: () => (manyVariants ? deleteAt(p, c, values, at) : removePart(p)), text: manyVariants ? 'Delete from this variant' : 'Delete part', title: manyVariants ? `Delete ${whereSaid(c, values)}, there alone; Delete in the part's row menu deletes it from every variant` : null }),
      sibs.length > 1 ? move(k - 1, 'earlier') : '', sibs.length > 1 ? move(k + 1, 'later') : ''] : []));
}

// a part deleted at a variant: there alone, the modal showing the part it sat in, as a deletion everywhere does
function deleteAt(p, c, values, at) {
  const was = state.base.variants;
  const parent = (expand(c, values)[at] || {}).parent;
  state.base.variants = toBase(c, removeAt(c, values, at));
  selected = state.parts.find((x) => idOf(x.uid) === parent)?.uid || 'root';
  select(selected);
  offerUndo(`Deleted ${p.name || 'the part'} ${whereSaid(c, values)}.`, () => { state.base.variants = was; selected = p.uid; select(p.uid); });
}
// the variant these values are, in words: "when Size is lg", or "at the defaults"
const whereSaid = (c, values) => { const off = offDefault(c, values); return Object.keys(off).length ? `when ${conditionText(off)}` : 'at the defaults'; };

// a part some variants take out: a chip of their values (Not in Info), the whole condition on hover and read out
function gone(uid) {
  const at = variantInfo.removedOf.get(uid);
  if (!at) return null;
  const c = contractNow();
  const offs = at.map((w) => offDefault(c, w));
  // in words, not an eye: the part is not in those variants at all, which a hidden one would be
  return valuesChip(`Not in ${offs.map(valuesShort).join(' · ')}`, `Not in the component ${at.map((w) => whereSaid(c, w)).join(', or ')}`, { 'data-gone': true });
}
// values said short: a value by itself (Info), an on/off with its prop (Disabled on), a choice of values with a slash;
// every prop at its default, Default
function valuesShort(w) {
  return !Object.keys(w).length ? 'Default' : Object.entries(w).map(([k, v]) => [].concat(v).map((x) => (typeof x === 'boolean' ? `${propName(k)} ${valueText(k, x)}` : valueText(k, x))).join('/')).join(', ');
}
// a row's chip of the values it holds at, the whole condition on hover and read out
function valuesChip(short, said, attrs = {}) {
  return el('span', { class: 'ce-cond ce-cond--gone', title: said, ...attrs }, el('span', { 'aria-hidden': 'true', text: short }), el('span', { class: 'visually-hidden', text: `. ${said}` }));
}

function removePart(p) {
  const at = state.parts.indexOf(p);
  const kids = state.parts.filter((x) => x.parent === p.uid).map((x) => x.uid);
  // what sat inside goes up to the removed part's own container
  for (const x of state.parts) if (x.parent === p.uid) x.parent = p.parent;
  state.parts = state.parts.filter((x) => x.uid !== p.uid);
  selected = p.parent || 'root';
  // deleted from its modal, the modal shows the part it sat in
  if (partOpen()) select(selected); else renderParts({ uid: p.parent || 'root' });
  // Undo puts back this part and what sat in it, leaving every other edit since as it is
  offerUndo(`Deleted ${p.name || 'the part'}.`, () => {
    state.parts.splice(Math.min(at, state.parts.length), 0, p);
    // its parts come back into it, unless they were moved elsewhere since
    for (const x of state.parts) if (kids.includes(x.uid) && x.parent === p.parent) x.parent = p.uid;
    selected = p.uid;
    renderParts({ uid: p.uid });
  });
}

/*
 * A part duplicated, or copied and pasted, with what is inside it: new parts
 * at the defaults (adding is the defaults'), the same links to props, the
 * copy named "… copy". Paste goes into the chosen container, or after the
 * chosen part; the copy is this component's only.
 */
let clip = null;
const atDefaultsNow = () => !Object.keys(offDefault(contractNow(), variantValues(contractNow()))).length;
const within = (p) => { const out = [p]; for (let i = 0; i < out.length; i++) out.push(...state.parts.filter((x) => x.parent === out[i].uid)); return out; };
function pasteParts(list, target, where) {
  // a part still being added is kept: its modal's Close would otherwise take it, and what was pasted into it, away
  adding = [];
  const top = list[0];
  const parent = where === 'inside' ? target.uid : target.parent;
  const names = new Set(state.parts.filter((x) => x.parent === parent).map((x) => x.name));
  const said = `${top.name || partLabel(top.kind)} copy`;
  let name = said;
  for (let n = 2; names.has(name); n++) name = `${said} ${n}`;
  const uids = new Map();
  // each a new part, its own place in the contract to be written whole; read and at name the part it was copied from
  const made = list.map((x) => { const { uid, read, at, ...rest } = structuredClone(x); const c = part({ ...rest, ...(x === top ? { name } : {}) }); uids.set(uid, c.uid); return c; });
  for (const [k, c] of made.entries()) c.parent = k ? uids.get(list[k].parent) : parent;
  state.parts = [...place([...state.parts, made[0]], made[0].uid, target.uid, where), ...made.slice(1)];
  if (where === 'inside') unfold(target.uid);
  return made[0];
}
// at a variant, the tree still shows the defaults: said, never a key that does nothing
const notHere = (what) => status(`${what} works at the defaults. Choose Back to default first.`);
function duplicatePart(p) {
  if (readOnly() || p.uid === 'root') return;
  if (!atDefaultsNow()) return notHere('Duplicate');
  const c = pasteParts(within(p), p, 'after');
  selected = c.uid;
  if (partOpen()) select(c.uid); else renderParts({ uid: c.uid, focus: '[data-edit]' });
  status(`Duplicated ${p.name || 'the part'} as ${c.name}.`);
}
function copyPart(p) {
  if (!p || p.uid === 'root') return;
  clip = { of: state, parts: structuredClone(within(p)) };
  status(`Copied ${p.name || 'the part'}.`);
}
function pastePart(at) {
  if (readOnly() || !at || !clip || clip.of !== state) return;
  if (!atDefaultsNow()) return notHere('Paste');
  const c = pasteParts(clip.parts, at, holds(at.kind) ? 'inside' : 'after');
  selected = c.uid;
  if (partOpen()) select(c.uid); else renderParts({ uid: c.uid, focus: '[data-edit]' });
  status(`Pasted ${c.name} ${holds(at.kind) ? `into ${at.uid === 'root' ? 'Outer box' : at.name}` : `after ${at.name}`}.`);
}
// ⌘ or Ctrl with D, C or V on a part: the part chosen in its modal, or the row focused in the tree; never in a field
addEventListener('keydown', (e) => {
  if (!(e.metaKey || e.ctrlKey) || e.altKey || e.shiftKey || !['d', 'c', 'v'].includes(e.key.toLowerCase())) return;
  if (e.target.closest('input, textarea, select, [contenteditable]') || getSelection().toString()) return;
  const row = e.target.closest('[data-parts] [data-uid]');
  const p = partOpen() && !selected.startsWith('at:') ? findPart(selected) : row ? findPart(row.dataset.uid) : null;
  if (!p) return;
  e.preventDefault();
  ({ d: duplicatePart, c: copyPart, v: pastePart })[e.key.toLowerCase()](p);
});

/*
 * The parts as a tree: each part's row, then what sits in it, one level in,
 * a line running down from under its icon to each of them. A part moves by
 * its handle (before or after another, or into a container), or by its menu
 * and the Inside field of its dialog, which do the same without a drag.
 */
// a part moved to another place among its siblings, from its menu or its handle's keys
function shiftPart(p, to, focus) {
  const siblings = state.parts.filter((x) => x.parent === p.parent);
  const k = siblings.indexOf(p);
  if (!siblings[to] || to === k) return;
  state.parts = place(state.parts, p.uid, siblings[to].uid, to < k ? 'before' : 'after');
  renderParts({ uid: p.uid, focus });
  status(`Moved ${p.name} to position ${to + 1} of ${siblings.length}.`);
}

// the tree opens one level deep: the outer box open, every container in it shut; a container in here is one
// turned the other way, for this visit. The parts are unchanged
const turned = new Set();
const isOpen = (uid) => (uid === 'root') !== turned.has(uid);
// a container opened, and the ones it sits in, so a part put deep inside stays in sight
const unfold = (uid) => {
  for (let p = state.parts.find((x) => x.uid === uid); p; p = state.parts.find((x) => x.uid === p.parent)) {
    if (!isOpen(p.uid)) { if (p.uid === 'root') turned.delete(p.uid); else turned.add(p.uid); }
    if (p.uid === 'root') break;
  }
};
// another component opened starts at one level again
let treeOf = null;
const containers = () => state.parts.filter((p) => state.parts.some((x) => x.parent === p.uid));
// one button for the whole tree: Expand all while any container is shut, Collapse all back to one level once none is
function foldAll() {
  const b = $('[data-fold-all]');
  const all = containers();
  const shut = all.some((p) => !isOpen(p.uid));
  b.parentElement.hidden = all.length < 2;
  b.textContent = shut ? 'Expand all' : 'Collapse all';
  b.onclick = () => { turned.clear(); if (shut) all.forEach((p) => p.uid !== 'root' && turned.add(p.uid)); renderParts({ focus: '[data-fold-all]' }); };
}
// the parts only some variants draw, under the part they sit in, rows as the others are, a chip of the values that draw
// them where another's says where it is not drawn; chosen, the stage draws the component at those values
const valuesOf = (when) => Object.fromEntries(Object.entries(when || {}).map(([k, v]) => [k, [].concat(v)[0]]));
function ghosts(p) {
  return (variantInfo.byParent.get(p.uid) || []).map((g) => el('li', { class: 'ce-node' },
    el('div', { class: 'ce-row ce-row--part ce-row--ghost', 'data-ghost': g.at, 'data-selected': (partOpen() && selected === `at:${g.at}`) || null },
      withIcon(el('button', { type: 'button', class: 'ce-row__main', 'data-edit': true, onclick: () => { viewing = { ...viewing, ...valuesOf(g.when) }; select(`at:${g.at}`); } },
        el('span', { class: 'ce-row__name', text: g.name }),
        el('span', { class: 'ce-row__kind', text: partLabel(KIND_OF(g.kind)) }),
        valuesChip(`Only in ${valuesShort(g.when)}`, `${g.exact ? 'Drawn when' : 'Added when'} ${conditionText(g.when)}`)), PART_ICON[KIND_OF(g.kind)]))));
}
const KIND_OF = (k) => (PART_KINDS.some(([x]) => x === k) ? k : 'container');

function partNode(p) {
  const isRoot = p.uid === 'root';
  const siblings = state.parts.filter((x) => x.parent === p.parent);
  const k = siblings.indexOf(p);
  const kids = state.parts.filter((x) => x.parent === p.uid);
  const shut = !isOpen(p.uid) && kids.length > 0;
  // a container with parts in it folds them away; shut, it says how many it holds
  const fold = kids.length ? el('button', { type: 'button', class: 'ce-fold', 'data-fold': true, 'aria-expanded': String(!shut), 'aria-label': `${p.uid === 'root' ? 'Outer box' : p.name || 'Part'}: ${kids.length} inside`,
    onclick: () => { if (turned.has(p.uid)) turned.delete(p.uid); else turned.add(p.uid); renderParts({ uid: p.uid, focus: '[data-fold]' }); } }, shut ? el('span', { text: String(kids.length) }) : null) : null;
  // the count, then the chevron
  if (fold) fold.insertAdjacentHTML('beforeend', icon('chevron'));
  return el('li', { class: 'ce-node', 'data-holds': kids.length > 0 || null },
    el('div', { class: 'ce-row ce-row--part', 'data-uid': p.uid, 'data-kind': p.kind, 'data-selected': (partOpen() && selected === p.uid) || null },
      isRoot || readOnly() ? null : withIcon(el('button', { type: 'button', class: 'ce-handle', 'data-part-handle': true, 'aria-label': `Move ${p.name || 'part'}: drag it before, after or into another part, or use the arrow keys` }), 'grip'),
      withIcon(el('button', { type: 'button', class: 'ce-row__main', 'data-edit': true, 'aria-haspopup': 'dialog', onclick: () => select(p.uid) },
        el('span', { class: 'ce-row__name', text: isRoot ? 'Outer box' : (p.name || 'Unnamed') }),
        el('span', { class: 'ce-row__kind', text: partLabel(p.kind) }),
        gone(p.uid),
        el('span', { class: 'visually-hidden', text: '. Choose' })), PART_ICON[p.kind]),
      fold,
      isRoot || readOnly() ? null : rowMenu(`menu-${p.uid}`, `Actions for ${p.name || 'part'}`, [
        ['Move up', () => shiftPart(p, k - 1, '[data-more]'), k === 0],
        ['Move down', () => shiftPart(p, k + 1, '[data-more]'), k === siblings.length - 1],
        ['Duplicate', () => duplicatePart(p), !atDefaultsNow()],
        [variantKeys(contractNow()).length ? 'Delete from all variants' : 'Delete', () => removePart(p)],
      ])),
    kids.length && !shut ? el('ol', { class: 'ce-subtree' }, ...kids.map(partNode), ...ghosts(p)) : ghosts(p).length && !shut ? el('ol', { class: 'ce-subtree' }, ...ghosts(p)) : null);
}

// a condition in words: "Size is Large, State is Focus", with the props' own names and Figma's spelling of their options
const propName = (k) => { const d = state.drafts.find((x) => camel(x.name) === k); return d ? d.name : k; };
const valueText = (k, vs) => {
  const d = state.drafts.find((x) => camel(x.name) === k);
  const say = (v) => (typeof v === 'boolean' ? (v ? 'on' : 'off') : d && d.values ? (d.values.find((o) => kebab(o) === v) ?? v) : v);
  return [].concat(vs).map(say).join(' or ');
};
function conditionText(when) {
  return Object.entries(when || {}).map(([k, vs]) => `${propName(k)} is ${valueText(k, vs)}`).join(', ');
}

let variantInfo = { byParent: new Map(), condOf: new Map(), removedOf: new Map() };
// the tree, the stage, and the part chosen; `into` is the inspector's control to keep the focus, `stage` the stage's
function renderParts({ uid, focus, inspector = true, into = null, stage = null } = {}) {
  syncSelection();
  variantInfo = variantParts(state.parts, contractNow());
  if (treeOf !== state) { turned.clear(); treeOf = state; }
  if (uid) unfold(state.parts.find((p) => p.uid === uid)?.parent);
  const r = state.parts.find((p) => p.uid === 'root');
  $('[data-parts]').replaceChildren(r ? partNode(r) : '');
  foldAll();
  if (focus === '[data-fold-all]') $('[data-fold-all]').focus();
  if (uid) { const row = $(`[data-parts] [data-uid="${uid}"]`); const t = row && row.querySelector(focus || '[data-edit]'); if (t) t.focus(); }
  refresh();
  if (inspector && partOpen()) renderInspector();
  const t = (into && $(`[data-inspector] :is(${into})`)) || (stage && $(`[data-stage] :is(${stage})`));
  if (t) t.focus();
}

/*
 * A part dragged by its handle: over a row's top quarter it goes before that
 * part, its bottom quarter after, and over the middle of a container, inside
 * it. A copy of the row follows the pointer; where it will land, the row
 * itself shows dashed, at that depth, and the rows around ease aside to make
 * room. Escape puts it back.
 */
// near the window's top or bottom edge the page scrolls, so a long list or tree can be crossed in one drag
function edgeScroll(y) {
  const edge = 48;
  if (y < edge) scrollBy(0, -(edge - y));
  else if (y > innerHeight - edge) scrollBy(0, y - (innerHeight - edge));
}

// a row's copy, lifted under the pointer where it was taken: what is carried is the row itself (knowledge: interaction,
// gestures and drag)
function lift(row, e, width = 0, left = null, like = row.isConnected ? row : null) {
  // a row not on the page (a new part's) is as wide as the rows it joins, taken near its start; carried up and down
  // its list only, on the list's own left edge, as a list reorders: one drifting sideways reads as torn off the list
  const at = row.isConnected ? row.getBoundingClientRect() : { left: left ?? e.clientX - 24, top: e.clientY - 24, width };
  const b = { ...(row.isConnected ? { left: at.left, top: at.top, width: at.width } : at), left: left ?? at.left };
  const g = row.cloneNode(true);
  for (const x of [g, ...g.querySelectorAll('*')]) { x.removeAttribute('id'); x.removeAttribute('data-uid'); }
  g.classList.add('ce-lift');
  // its columns as a row in the list draws them, which the list's width decides and the copy, outside it, cannot see
  const main = like && like.querySelector('.ce-row__main');
  if (main) {
    g.querySelector('.ce-row__main').style.gridTemplateColumns = getComputedStyle(main).gridTemplateColumns;
    for (const c of ['__kind', '__about', '__summary']) { const a = main.querySelector(`.ce-row${c}`), b = g.querySelector(`.ce-row${c}`); if (a && b) b.style.display = getComputedStyle(a).display; }
  }
  g.inert = true;
  g.setAttribute('aria-hidden', 'true');
  g.style.inlineSize = b.width + 'px';
  const grip = { x: e.clientX - b.left, y: e.clientY - b.top };
  // over its list, on the list's edge; a new row still on its way there (free) under the pointer, taken near its start
  g.follow = (x, y, free = false) => { g.style.left = (free ? x - 24 : b.left) + 'px'; g.style.top = y - grip.y + 'px'; };
  return g;
}
// where a carried row will land: the row again, dashed, its controls off
function slotOf(row) {
  const s = row.cloneNode(true);
  for (const x of [s, ...s.querySelectorAll('*')]) { x.removeAttribute('id'); x.removeAttribute('data-uid'); x.removeAttribute('data-selected'); }
  s.classList.add('ce-row--slot');
  // not inert: the pointer over the slot must find it, or the drop resets under a still pointer
  for (const b of s.querySelectorAll('button')) b.disabled = true;
  s.setAttribute('aria-hidden', 'true');
  return s;
}
// the drag under way, ended before another starts: two at once left one's copy on the page; a stage part still
// settling into place, which no new drag takes until the page has its move
let dragging = null, landing = false;
const EASE = { duration: 200, easing: 'cubic-bezier(0.2, 0, 0, 1)' };
/* A drag's listeners, on the window, not the source, which leaves the page while it is carried; the keys caught first,
   so Escape ends the drag and nothing else. Returns what takes them off. */
function listen(on) {
  const all = Object.entries(on);
  for (const [t, f] of all) addEventListener(t, f, t === 'keydown');
  return () => { for (const [t, f] of all) removeEventListener(t, f, t === 'keydown'); };
}
// a box as laid out, not where an easing has it for the moment: read mid-move, the drop chased it (z, the stage's zoom)
function settled(n, z = 1) {
  const r = n.getBoundingClientRect(), m = new DOMMatrix(getComputedStyle(n).transform);
  return { left: r.left - m.m41 * z, top: r.top - m.m42 * z, width: r.width, height: r.height };
}
// rows pushed aside, not jumped: each eases from where it was to where the change put it. A nested row moves with
// the row it sits in, so it is eased only by what it moved beyond that
function flip(items, change) {
  const was = new Map(items().map((n) => [n, n.getBoundingClientRect().top]));
  for (const n of was.keys()) for (const a of n.getAnimations()) a.cancel();
  change();
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const now = items();
  const dy = new Map(now.filter((n) => was.has(n)).map((n) => [n, was.get(n) - n.getBoundingClientRect().top]));
  for (const [n, d] of dy) {
    const up = n.parentElement.closest('.ce-node, [data-list] > li');
    const own = d - (dy.get(up) || 0);
    if (Math.abs(own) > 0.5) n.animate([{ transform: `translateY(${own}px)` }, { transform: 'none' }], EASE);
  }
}

// a part dragged among the others, or a new one from the panel, which opens its dialog where it is dropped
function dragPart(e, p, { isNew = false, label = 'Part' } = {}) {
  if (e.button !== 0) return;
  const parts = () => (isNew ? [...state.parts, p] : state.parts);
  const id = e.pointerId;
  const start = { x: e.clientX, y: e.clientY };
  const tree = $('[data-parts]');
  // the rows that ease aside: the slot itself appears where it lands, it does not travel there
  const nodes = () => [...tree.querySelectorAll('.ce-node')].filter((n) => n !== slot);
  // the row carried: the part's own, or for a new part a row as the tree will draw it
  const source = isNew ? null : tree.querySelector(`.ce-row[data-uid="${CSS.escape(p.uid)}"]`);
  const row = source || el('div', { class: 'ce-row ce-row--part' }, withIcon(el('span', { class: 'ce-row__main' },
    el('span', { class: 'ce-row__name', text: label }), el('span', { class: 'ce-row__kind', text: partLabel(p.kind) })), PART_ICON[p.kind]));
  const slot = el('li', { class: 'ce-node', 'aria-hidden': 'true' }, slotOf(row));
  let ghost = null;
  let drop = null;
  let made = null;
  // the slot moved to where the drop would land; a container with nothing showing in it opens a list for it alone
  const show = () => {
    const at = drop && tree.querySelector(`.ce-row[data-uid="${CSS.escape(drop.target)}"]`)?.closest('.ce-node');
    flip(nodes, () => {
      made?.remove(); made = null;
      // aimed at nothing, it shows back where it was taken from, where a release leaves it
      if (!at) { if (source) source.closest('.ce-node').before(slot); else slot.remove(); return; }
      if (drop.where === 'before') at.before(slot);
      else if (drop.where === 'after') at.after(slot);
      else {
        let sub = at.querySelector(':scope > .ce-subtree');
        if (!sub || at.querySelector(':scope > .ce-row [data-fold][aria-expanded=false]')) { made = el('ol', { class: 'ce-subtree' }); at.append(made); sub = made; }
        sub.insertBefore(slot, [...sub.children].find((n) => n.querySelector(':scope > [data-ghost]')) || null);
      }
    });
  };
  const aim = (x, y) => {
    const hit = document.elementFromPoint(x, y);
    // over the slot itself, the drop stays where the slot is
    if (hit && slot.contains(hit)) return;
    const over = hit?.closest('[data-parts] .ce-row[data-uid]');
    // below the last row, across the tree: the part goes last in the outer box, as a list takes a drop under its end
    const rows = [...tree.querySelectorAll('.ce-row[data-uid]')].filter((r) => r.checkVisibility());
    const end = rows.at(-1)?.getBoundingClientRect(), across = tree.getBoundingClientRect();
    if (!over && end && y > end.bottom && x > across.left - 48 && x < across.right + 48) {
      const next = place(parts(), p.uid, 'root', 'inside') !== parts() ? { target: 'root', where: 'inside' } : null;
      if (JSON.stringify(next) !== JSON.stringify(drop)) { drop = next; show(); }
      return;
    }
    // between rows, or over one still easing aside, the drop stays; it is lost only off the tree
    if (!over && hit && tree.contains(hit)) return;
    let next = null;
    if (over && over.dataset.uid !== p.uid) {
      const b = over.getBoundingClientRect();
      const t = (y - b.top) / b.height;
      const container = holds(over.dataset.kind);
      // an open container with parts showing: its bottom edge is the top of its own list, so a drop there goes inside
      const open = container && isOpen(over.dataset.uid) && state.parts.some((q) => q.parent === over.dataset.uid && q.uid !== p.uid);
      const where = over.dataset.uid === 'root' ? (container ? 'inside' : null)
        : t < 0.25 ? 'before' : t > 0.75 ? (open ? 'inside' : 'after') : container ? 'inside' : t < 0.5 ? 'before' : 'after';
      if (where && place(parts(), p.uid, over.dataset.uid, where) !== parts()) {
        // at an open container's bottom edge the part goes first in it, before what shows just below
        const first = open && t > 0.75 && state.parts.find((q) => q.parent === over.dataset.uid && q.uid !== p.uid);
        next = first ? { target: first.uid, where: 'before' } : { target: over.dataset.uid, where };
      }
    }
    if (JSON.stringify(next) === JSON.stringify(drop)) return;
    drop = next;
    show();
  };
  const end = (commit) => {
    if (dragging === end) dragging = null;
    off();
    document.documentElement.removeAttribute('data-dragging');
    ghost && ghost.remove();
    slot.remove(); made?.remove();
    if (source) source.closest('.ce-node').hidden = false;
    // hidden while carried, its handle lost focus: a drag that moved nothing gives it back
    if (source && document.activeElement === document.body) $('[data-part-handle]', source)?.focus();
    if (commit && ghost && drop && isNew) addPart(p.kind, drop);
    else if (commit && ghost && drop) {
      state.parts = place(state.parts, p.uid, drop.target, drop.where);
      if (drop.where === 'inside') unfold(drop.target);
      const t = findPart(drop.target);
      renderParts({ uid: p.uid, focus: '[data-part-handle]' });
      status(`Moved ${p.name} ${drop.where === 'inside' ? 'into' : drop.where} ${t.uid === 'root' ? 'Outer box' : t.name}.`);
    }
  };
  const onMove = (m) => {
    if (m.pointerId !== id) return;
    if (!ghost) {
      if (Math.hypot(m.clientX - start.x, m.clientY - start.y) < 6) return;
      ghost = lift(row, source ? { clientX: start.x, clientY: start.y } : { clientX: m.clientX, clientY: m.clientY }, tree.querySelector('.ce-row').offsetWidth, source ? null : tree.querySelector('.ce-row').getBoundingClientRect().left, source || tree.querySelector('.ce-row--part'));
      document.body.append(ghost);
      document.documentElement.setAttribute('data-dragging', '');
      // the part leaves the tree while it is carried, what it holds with it; its row shows dashed in its place
      if (source) flip(nodes, () => { const n = source.closest('.ce-node'); n.before(slot); n.hidden = true; });
    }
    const t = tree.getBoundingClientRect();
    ghost.follow(m.clientX, m.clientY, !source && (m.clientX < t.left || m.clientX > t.right));
    edgeScroll(m.clientY);
    aim(m.clientX, m.clientY);
  };
  const onUp = (u) => { if (u.pointerId === id) end(true); };
  // the pointer's own cancel, or the window losing focus with the button still down: its release never comes
  const onCancel = (c) => { if (c.type === 'blur' || c.pointerId === id) end(false); };
  // Escape abandons the drag, and only the drag: a modal it is in stays open
  const onKey = (k) => { if (k.key === 'Escape' && ghost) { k.preventDefault(); end(false); status('Drag cancelled.'); } };
  dragging?.(false);
  dragging = end;
  const off = listen({ pointermove: onMove, pointerup: onUp, pointercancel: onCancel, keydown: onKey, blur: onCancel });
}

// a row of tabs moved by the keys (APG tabs): left and right wrap, Home and End go to the ends; one handler for every tab row
function rovingTabs(order, current, go) {
  return (e) => {
    const k = order.indexOf(current());
    const to = { ArrowLeft: k - 1, ArrowRight: k + 1, Home: 0, End: order.length - 1 }[e.key];
    if (to == null) return;
    e.preventDefault();
    go(order[(to + order.length) % order.length]);
  };
}

// the pane's two tabs: the JSON with its actions, and the preview
let pane = 'json';
function showOut(which) {
  pane = which;
  for (const t of document.querySelectorAll('[data-out-tab]')) { const on = t.dataset.outTab === which; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; }
  for (const p of document.querySelectorAll('[data-out]')) p.hidden = p.dataset.out !== which;
  syncUrl();
}

// where the page is, in its address, so a reload or a shared link opens the same view: the library, the component, the tabs
// push: a component opened is a step Back returns from; a tab or a name being typed replaces the address in place
function syncUrl({ push = false } = {}) {
  const q = new URLSearchParams();
  if (state.component.trim()) q.set('component', state.component.trim());
  if (view !== 'props') q.set('tab', view);
  if (pane !== 'json') q.set('pane', pane);
  const next = q.size ? `?${q}` : '';
  if (next !== location.search) (push ? history.pushState : history.replaceState).call(history, null, '', next || location.pathname);
}

// whichever list is showing, drawn again
const renderView = () => (view === 'anatomy' ? renderParts() : view === 'variants' ? renderVariants() : render());

/*
 * Every combination in a grid, and beside it what the one chosen draws
 * differently from the defaults, read-only: one list however many layers say
 * it. They are Figma's until the contract is the source.
 */
// an empty state as feedback.md has it: a heading, a sentence, at most one action, centred in the region it stands for
const empty = (title, text, action) => el('div', { class: 'ce-empty' }, el('h3', { text: title }), el('p', { text }), action || null);

function renderVariants() {
  const now = contractNow();
  const vs = now.variants || [];
  const invalid = now.invalid || [];
  const dark = isDark();
  // a value: a colour token by its last name beside its swatch, a length or style by its last name, its full name on hover
  // a token by its last name, or as much of its path as tells it from the one beside it (Neutral/inverse-rest, Danger/inverse-rest)
  const tail = (x, other) => {
    if (typeof x !== 'string' || !x.includes('/')) return `${x}`;
    const a = x.split('/'), b = typeof other === 'string' ? other.split('/') : [];
    // with nothing to tell it from, the group over it too: State/Disabled/opacity is "Disabled/opacity", not "opacity"
    if (!b.length) return a.slice(-Math.max(1, Math.min(2, a.length - 1))).join('/');
    let n = 1;
    while (x !== other && n < a.length && a.slice(-n).join('/') === b.slice(-n).join('/')) n++;
    return a.slice(-n).join('/');
  };
  // a list or an object of one value repeated is that value (sides 1); a plain object said in a line, its tokens by their last names
  const short = (v) => (Array.isArray(v) ? (v.every((y) => JSON.stringify(y) === JSON.stringify(v[0])) ? short(v[0]) : v.map(short).join(' '))
    : v && typeof v === 'object' ? (Object.values(v).every((y) => JSON.stringify(y) === JSON.stringify(Object.values(v)[0])) ? short(Object.values(v)[0])
      : Object.entries(v).map(([k, y]) => `${k} ${short(y)}`).join(', ')) : tail(v));
  // a token's path free to break after each slash, so a narrow column wraps it there and not mid-word
  const slashes = (t) => t.split('/').flatMap((p, i) => (i ? [el('wbr'), p] : [p])).map((p, i, all) => (typeof p === 'string' && i < all.length - 1 ? `${p}/` : p));
  // unset is a dash, null is none
  const one = (x, other) => {
    if (x === undefined) return [el('span', { class: 'ce-vtable__soft', text: '—' })];
    if (x === null) return [el('span', { text: 'none' })];
    if (Array.isArray(x)) return [el('span', { text: short(x) })];
    if (typeof x === 'object') return said(x, Object.keys(x), other && typeof other === 'object' ? other : undefined);
    const t = tokens.colours.find((c) => c.name === x);
    // a number token's value beside its name: Loading/opacity 0, Disabled/opacity 50
    const n = !t && tokens.lengths.find((c) => c.name === x);
    return [t ? el('span', { class: 'ce-swatch', style: `background: ${(dark && t.dark) || t.value}`, 'aria-hidden': 'true' }) : null, el('span', { title: typeof x === 'string' ? x : null }, ...slashes(tail(x, other))),
      n ? el('span', { class: 'ce-vtable__soft', text: ` ${n.value}` }) : null].filter(Boolean);
  };
  // an object said by what in it changes: "gap 8, padding 12", the default the same keys
  const differs = (to, from) => Object.keys(to || {}).filter((k) => JSON.stringify(to[k]) !== JSON.stringify((from || {})[k]));
  // a line each, named as the part's rows name them (Align across, Justify along), a colour with its swatch
  const NAMED = { align: 'Justify', crossAlign: 'Align', direction: 'Direction', gap: 'Gap', padding: 'Padding', color: 'Colour', width: 'Width', sides: 'Sides' };
  const said = (o, keys, other) => (o == null ? one(o) : keys.map((k) => el('span', { class: 'ce-vtable__line' }, el('span', { class: 'ce-vtable__key', text: `${NAMED[k] || k} ` }),
    ...(o[k] && typeof o[k] === 'object' ? [el('span', { text: short(o[k]) })] : one(o[k], other == null ? undefined : other[k])))));
  // a part by the name it is drawn with: its own where its id cannot say it (a layer a variant adds included)
  const nameAt = (id) => ((now.anatomy || {})[id] || (now.variants || []).map((v) => (v.add || {})[id]).find(Boolean) || {}).name;
  const at = (id) => (id === 'root' ? 'Outer box' : nameAt(id) ?? partName(id));
  // a part added or removed with the parts inside it is one row, named alone; what it holds is said on hover
  const tops = (ids) => ids.filter((k) => !ids.some((o) => k.startsWith(o + '/'))).map((k) => [k, ids.filter((o) => o.startsWith(k + '/')).length]);
  const part = (k, n) => el('td', { title: n ? `With the ${n} part${n === 1 ? '' : 's'} inside it` : null }, el('span', { text: at(k) }));
  // what changes: the part and its property in one cell, the property quieter
  const FIELD = { background: 'fill', with: 'properties', order: 'position', typography: 'text style', color: 'colour', radius: 'corners', textAlign: 'alignment' };
  const what = (id, field) => el('td', {}, el('span', { text: at(id) }), el('span', { class: 'ce-vtable__soft', text: ` ${FIELD[field] || field}` }));
  // a fact a row, as Carbon's style tables and Figma's Compare changes give them: the part and property, its default faded, what it becomes
  // (a part added or removed: Absent or Present, as a value is; not hidden, which a part there would be);
  // what in the layer says it on the row (data-keys), to tell the changes its values make only together
  const rows = (v, from) => [
    ...tops(Object.keys(v.add || {})).map(([k, n]) => el('tr', { class: 'ce-vtable__added', 'data-change': true, 'data-keys': `add:${k}` }, part(k, n), el('td', { class: 'ce-vtable__was', text: 'Absent' }), el('td', {}, el('span', { class: 'ce-vtable__tag', text: 'Present' })))),
    ...tops(v.remove || []).map(([k, n]) => el('tr', { class: 'ce-vtable__removed', 'data-change': true, 'data-keys': `remove:${k}` }, part(k, n), el('td', { class: 'ce-vtable__was', text: 'Present' }), el('td', {}, el('span', { class: 'ce-vtable__tag', text: 'Absent' })))),
    ...Object.entries(v.set || {}).flatMap(([k, x]) => {
      const i = k.lastIndexOf('.'); const id = k.slice(0, i); const field = k.slice(i + 1);
      const was = (from[id] || {})[field];
      const set = v.set || {}, base = from[id] || {};
      // a width and a height set together are one size, "16 × 16"; an instance's Size that only says that size again is not said twice
      if (field === 'height' && `${id}.width` in set) return [];
      const sizeOnly = (y) => y && typeof y === 'object' && differs(y, base.with).every((f) => f === sizeAxis && String(y[sizeAxis]) === String(set[`${id}.width`]));
      if (field === 'with' && sizeOnly(x)) return [];
      if (field === 'width' && `${id}.height` in set) {
        const size = (w, h) => (w === undefined && h === undefined ? undefined : `${tail(w ?? '—')} × ${tail(h ?? '—')}`);
        // its keys: the width, the height, and the Size not said twice, taken out together
        const keys = [`set:${id}.width`, `set:${id}.height`, ...(sizeOnly(set[`${id}.with`]) ? [`set:${id}.with`] : [])].join(' ');
        return el('tr', { 'data-change': true, 'data-keys': keys }, what(id, 'size'), el('td', { class: 'ce-vtable__was' }, ...one(size(base.width, base.height))), el('td', {}, ...one(size(x, set[`${id}.height`]))));
      }
      const keys = x && typeof x === 'object' && !Array.isArray(x) ? differs(x, was) : null;
      // one setting of it changed: named with the field (border colour), its values plain, not a key in each cell
      if (keys && keys.length === 1) {
        const [f] = keys;
        return el('tr', { 'data-change': true, 'data-keys': `set:${k}` }, what(id, `${FIELD[field] || field} ${(NAMED[f] || f).toLowerCase()}`),
          el('td', { class: 'ce-vtable__was' }, ...one((was || {})[f], x[f])), el('td', {}, ...one(x[f], (was || {})[f])));
      }
      return el('tr', { 'data-change': true, 'data-keys': `set:${k}` }, what(id, field),
        el('td', { class: 'ce-vtable__was' }, ...(keys ? said(was, keys, x) : one(was, x))), el('td', {}, ...(keys ? said(x, keys, was) : one(x, was))));
    })];
  // what the combination chosen draws, against what the defaults draw: one list, the whole of it, whichever layers say it
  if (!filterAt) filterAt = filterStart(now);
  const base = shownAt(now, {}, expand(now)), here = shownAt(now, filterAt, expand(now, filterAt));
  const set = {};
  for (const id of Object.keys(here)) if (base[id]) for (const f of new Set([...Object.keys(base[id]), ...Object.keys(here[id])])) if (JSON.stringify(base[id][f]) !== JSON.stringify(here[id][f])) set[`${id}.${f}`] = here[id][f];
  const diff = rows({ add: Object.fromEntries(Object.keys(here).filter((id) => !base[id]).map((id) => [id, here[id]])), remove: Object.keys(base).filter((id) => !here[id]), set }, base);
  const off = offDefault(now, filterAt);
  const atDefaults = !Object.keys(off).length;
  // the changes its values make only together, after those each makes alone, as the grid's marks say them
  const crossed = crossings(now)(filterAt);
  const together = diff.filter((r) => r.dataset.keys.split(' ').some((k) => crossed.has(k)));
  const alone = diff.filter((r) => !together.includes(r));
  const group = (text) => el('tr', { class: 'ce-vtable__group' }, el('th', { scope: 'colgroup', colspan: 3, text }));
  const panel = el('section', { class: 'ce-vcard ce-vchanges' },
    el('h3', { text: atDefaults ? 'The defaults' : conditionText(off) }),
    diff.length ? el('div', { class: 'ce-vtable__scroll' }, el('table', { class: 'ce-vtable' },
      el('thead', {}, el('tr', {}, ...['Part', 'Default', 'Here'].map((t) => el('th', { scope: 'col', text: t })))),
      el('tbody', {}, ...(together.length ? [alone.length ? group('Its values each') : null, ...alone, group('Only these values together'), ...together].filter(Boolean) : diff))))
      : vs.length ? empty(atDefaults ? 'Pick a combination' : 'Same as the defaults', atDefaults ? 'Choose a cell in the grid to see what it changes from the defaults.' : 'Nothing changes from the defaults at these values.')
        : empty('Not drawn yet', 'Figma draws the variants; what each one changes shows here once it has and the library is snapshotted.'));
  // drawn anew, the control that had focus keeps it: a redraw that lands later (the library read again) must not drop it
  const had = document.activeElement;
  const back = had && $('[data-variants]').contains(had) ? ['data-with-booleans', 'data-combo', 'data-alone'].filter((a) => had.hasAttribute(a)).map((a) => `[${a}="${CSS.escape(had.getAttribute(a))}"]`)[0] : null;
  // no variant property: one look, said in place of the grid and the panel both, with the way to add one in a draft
  const grid = variantGrid(now, invalid);
  if (grid) $('[data-variants]').replaceChildren(grid, panel);
  else $('[data-variants]').replaceChildren(empty('One look', readOnly() ? 'It has no variant properties, so Figma draws it once.' : 'Add a variant property in Props to draw it more than one way.',
    readOnly() ? null : el('button', { type: 'button', class: 'button', text: 'Go to Props', onclick: () => { showView('props'); $('[data-view="props"]').focus(); } })));
  if (back) $(`[data-variants] ${back}`)?.focus();
  // the headers frozen as the grid scrolls (tables: both headers sticky), each where its column or row of headers starts:
  // measured, as the columns before it are as wide as their words
  const table = $('.ce-vgrid__table');
  if (table) {
    // every measure read before any is written: a write between reads lays the page out again for each header
    const t = table.getBoundingClientRect();
    const rows = [...table.querySelectorAll('tbody th')].map((th) => [th, th.getBoundingClientRect().left - t.left]);
    const heads = [...table.querySelectorAll('thead th')].map((th) => [th, th.getBoundingClientRect().top - t.top]);
    // the combinations' columns one width, the widest value's and never under 3rem, so cells are alike from grid to grid
    const cols = [...table.querySelectorAll('thead th[data-col]')];
    const w = Math.max(3 * parseFloat(getComputedStyle(document.documentElement).fontSize), ...cols.map((th) => th.getBoundingClientRect().width));
    for (const [th, x] of rows) th.style.insetInlineStart = `${x}px`;
    for (const [th, y] of heads) th.style.insetBlockStart = `${y}px`;
    for (const th of cols) th.style.inlineSize = `${w}px`;
  }
  refresh();
}

/*
 * Every combination of the props Figma draws variants of, as a reference
 * sheet lays them out (Propstar), schematic: half the props down, half across,
 * each nesting the next; a cell each, a dot where Figma draws it, a cross
 * where it does not. A cell clicked is the combination the panel beside the
 * grid says the changes of; the one chosen is ringed. A header chosen is its
 * value alone, at the defaults, and a diamond marks a cell whose values change
 * each other (`crossings` in variants.mjs).
 */
function variantGrid(c, invalid) {
  const all = choosers(c);
  const keys = [...new Set([...variantKeys(c), ...invalid.flatMap((w) => Object.keys(w)), ...(withBooleans ? flags(c) : [])])].filter((k) => all.some((x) => x.key === k));
  if (!keys.length) return '';
  // shown only where there is an on/off property to cross
  const toggle = flags(c).length ? el('label', { class: 'ce-vgrid__toggle' }, el('span', { text: 'Include booleans' }),
    el('input', { type: 'checkbox', role: 'switch', class: 'ce-switch', checked: withBooleans, 'data-with-booleans': true, title: 'Cross the on/off properties that only show and hide parts, as well as the variants',
      onchange: (ev) => { withBooleans = ev.target.checked; if (!withBooleans) for (const k of flags(c)) delete filterAt[k]; renderVariants(); $('[data-with-booleans]')?.focus(); } })) : null;
  const of = (k) => all.find((x) => x.key === k);
  // a value by its label; an on/off says its prop too, as "Disabled on" alone tells which
  const said = (k, v) => { const x = of(k); const l = x.labels[x.values.indexOf(v)] ?? String(v); return typeof v === 'boolean' ? `${x.name} ${l.toLowerCase()}` : l; };
  // across, the last props while their columns fit a dozen (a button's State and Disabled); the rest down, as the page scrolls down
  const count = (ks) => ks.reduce((t, k) => t * of(k).values.length, 1);
  let cut = keys.length - 1;
  while (cut > 0 && count(keys.slice(cut - 1)) <= 12) cut--;
  const down = keys.slice(0, cut), across = keys.slice(cut);
  const product = (ks) => ks.reduce((acc, k) => acc.flatMap((m) => of(k).values.map((v) => ({ ...m, [k]: v }))), [{}]);
  const span = (ks, i) => count(ks.slice(i + 1));
  const cols = product(across), rows = product(down);
  const start = filterStart(c);
  const chosen = Object.fromEntries(keys.map((k) => [k, k in filterAt ? filterAt[k] : k in start ? start[k] : of(k).default]));
  // a combination not drawn: one each of whose values a not-drawn entry names (a value it leaves out is any)
  const not = (m) => invalid.some((w) => Object.entries(w).every(([k, v]) => [].concat(v).includes(m[k])));
  const name = (m) => keys.map((k) => said(k, m[k])).join(', ');
  const crossed = crossings(c);
  let crossing = 0;
  // the panel is drawn anew, so what it says is told by the page's status line, which stays; focus back on what chose it
  const choose = (m, back) => { filterAt = { ...m }; renderVariants(); status(`${$('.ce-vchanges h3')?.textContent}: ${document.querySelectorAll('.ce-vchanges [data-change]').length || 'nothing'} changed from the defaults.`); $(`[data-variants] ${back}`)?.focus(); };
  const cell = (m, col) => {
    if (not(m)) return el('td', { class: 'ce-vgrid__not', 'data-combo': JSON.stringify(m), 'data-col': col }, el('span', { 'aria-hidden': 'true', text: '✕' }), el('span', { class: 'visually-hidden', text: `${name(m)}: not drawn` }));
    const on = keys.every((k) => m[k] === chosen[k]);
    const ex = crossed(m).size > 0;
    if (ex) crossing++;
    return el('td', { 'data-col': col }, el('button', { type: 'button', class: `ce-vgrid__cell${ex ? ' ce-vgrid--crossed' : ''}`, 'data-combo': JSON.stringify(m), 'aria-pressed': String(on),
      'aria-label': `${name(m)}${ex ? ': its values change each other' : ''}`, onclick: () => choose(m, `[data-combo='${JSON.stringify(m)}']`) }, el('span', { class: 'ce-vgrid__dot', 'aria-hidden': 'true' })));
  };
  // a header: its value's name, a button choosing that value alone
  const header = (k, v, attrs, text = said(k, v)) => el('th', attrs, el('button', { type: 'button', class: 'ce-vgrid__value', 'data-alone': `${k}=${v}`,
    title: `What ${said(k, v)} changes on its own`, onclick: () => choose({ [k]: v }, `[data-alone="${CSS.escape(`${k}=${v}`)}"]`) }, text));
  // the headers across: a row per prop, its values spanning the columns of the props after it
  // an on/off across the last row is its prop's name over Off and On, so its columns are as narrow as any other's
  const last = across[across.length - 1];
  const flag = typeof of(last).values[0] === 'boolean';
  const repeat = (k, i) => Array.from({ length: cols.length / (span(across, i) * of(k).values.length) }, () => of(k).values).flat();
  const head = across.map((k, i) => el('tr', {}, ...repeat(k, i).map((v, j) => header(k, v, { scope: 'colgroup', colspan: span(across, i), 'data-col': i === across.length - 1 ? j : null },
      flag && k === last ? of(k).labels[of(k).values.indexOf(v)] : undefined))));
  if (flag) head.splice(-1, 0, el('tr', {}, ...Array.from({ length: cols.length / 2 }, () => el('th', { scope: 'colgroup', colspan: 2, text: of(last).name }))));
  // the corner over the headers down, beside every row of the headers across
  if (down.length) head[0].prepend(el('td', { colspan: down.length, rowspan: head.length }));
  // the headers down: a column per prop, each value spanning the rows of the props after it
  const body = rows.map((r, n) => el('tr', {}, ...down.map((k, i) => (n % span(down, i) ? null : header(k, r[k], { scope: 'rowgroup', rowspan: span(down, i) }))).filter(Boolean),
    ...cols.map((m, j) => cell({ ...r, ...m }, j))));
  const missing = rows.reduce((n, r) => n + cols.filter((m) => not({ ...r, ...m })).length, 0);
  return el('section', { class: 'ce-vcard ce-vgrid' }, el('header', { class: 'ce-vgrid__head' }, el('h3', { text: `${rows.length * cols.length} combinations${missing ? ` (${missing} not drawn)` : ''}` }), toggle),
    crossing ? el('p', { class: 'ce-vgrid__key' }, el('span', { class: 'ce-vgrid__dot ce-vgrid__dot--crossed', 'aria-hidden': 'true' }), ` ${crossing} where values change each other`) : null,
    el('div', { class: 'ce-vgrid__scroll' }, el('table', { class: 'ce-vgrid__table', onpointerover: crosshair, onpointerleave: crosshair }, el('thead', {}, ...head), el('tbody', {}, ...body))));
}
// the cell under the pointer tinted, and the headers of its row and column, so its place is read off them; the row's by CSS, the column's here
function crosshair(e) {
  const t = e.currentTarget;
  const col = e.type === 'pointerover' ? e.target.closest('[data-col]')?.dataset.col : undefined;
  for (const x of t.querySelectorAll('.ce-vgrid--col')) if (x.dataset.col !== col) x.classList.remove('ce-vgrid--col');
  if (col !== undefined) t.querySelector(`th[data-col="${col}"]`)?.classList.add('ce-vgrid--col');
}

function showView(v) {
  view = v;
  if (partOpen()) $('[data-part-dialog]').close();
  syncUrl();
  for (const t of document.querySelectorAll('[data-view]')) { const on = t.dataset.view === v; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; }
  for (const panel of document.querySelectorAll('[data-panel]')) panel.hidden = panel.dataset.panel !== v;
  // on Variants the panel holds the tables' filter, not blocks
  renderPalette();
  renderView();
}

/* ── the palette: the kinds and the library's own, or the parts ──────────── */
const TABS = [['kinds', 'Kinds'], ['library', 'Library']];
let tab = 'kinds';
let libKind = '';
let libQuery = '';

const tile = (b) => el('li', {}, withIcon(el('button', { type: 'button', class: 'ce-block', 'data-block': b.id, title: b.hint, onclick: () => openProp(b.make(), { isNew: true }) }, el('span', { text: b.label })), kindOf(b.make())));
// a new prop that fills a part (words, a swap, a slot's content) brings that part, in the outer box, linked; one already linked is left
const PART_OF = { string: ['text', 'textProp'], instance: ['instance', 'swapProp'], slot: ['slot', 'slotProp'] };
function partFor(d) {
  const [kind, link] = PART_OF[d.type] || [];
  if (!kind || d.only === 'code' || state.parts.some((p) => p[link] === d.uid)) return null;
  const p = newPart(kind);
  Object.assign(p, { name: d.name, [link]: d.uid }, kind === 'instance' && d.default ? { component: d.default } : {});
  state.parts = [...state.parts, p];
  return p;
}
const newPart = (kind) => part({ kind, parent: 'root', ...(holds(kind) ? { layout: { direction: 'row' } } : {}), ...(kind === 'graphic' ? { shape: 'rectangle', width: 16, height: 16 } : {}) });
/*
 * A part added at once, named for its kind, into the outer box or where it was dropped, then opened, its name
 * ready to type over.
 */
// the parts being added, the last innermost, each with the parts as they stood before it and where it was added from:
// its modal adds it or cancels, as a new prop's does, then goes back to the part it was added from (Add inside), or closes
let adding = [];
const addingNow = () => adding.length && adding[adding.length - 1].state === state ? adding[adding.length - 1] : null;
function addPart(kind, drop = null, { fromModal = false } = {}) {
  adding.push({ state, parts: structuredClone(state.parts), base: structuredClone(state.base), selected, open: fromModal, uid: null });
  const p = newPart(kind);
  const to = drop || { target: 'root', where: 'inside' };
  const label = partLabel(kind);
  const names = new Set(state.parts.map((x) => x.name));
  p.name = label;
  for (let n = 2; names.has(p.name); n++) p.name = `${label} ${n}`;
  if (kind === 'text') p.text = 'Text';
  const placed = place([...state.parts, p], p.uid, to.target, to.where);
  state.parts = placed.some((x) => x.uid === p.uid) && placed.length > state.parts.length ? placed : [...state.parts, p];
  const home = findPart(findPart(p.uid).parent);
  unfold(home.uid);
  adding[adding.length - 1].uid = p.uid;
  select(p.uid, '[data-name]');
  const name = $('[data-inspector] [data-name]');
  if (name) name.select();
  status(`Added ${p.name} to ${home.uid === 'root' ? 'Outer box' : home.name}.`);
}
const partTile = ([kind, label]) => el('li', {}, withIcon(el('button', { type: 'button', class: 'ce-block', 'data-part-block': kind,
  onclick: () => addPart(kind),
  // dragged into the tree instead, it lands there; the click still comes when it is not dragged
  onpointerdown: (e) => { e.preventDefault(); dragPart(e, newPart(kind), { isNew: true, label }); } }, el('span', { text: label })), PART_ICON[kind]));

/*
 * The library's props, narrowed (design-standard rules 3, 4, 11 and 12): one
 * bar, the kind first as a menu (eight kinds is past four), each with how many
 * props it holds, then the search; only the tiles redraw as it narrows, so
 * the field keeps its cursor.
 */
function libraryTiles() {
  if (!library.length) return el('div', { class: 'ce-preview__empty ce-library-empty', 'data-library-tiles': true },
    el('span', { text: connected ? 'This library\'s components share no props yet.' : 'No library: the editor is serving the house settings. Start it on a project (serve.mjs --project <label>) and the props its components share show here.' }));
  const q = libQuery.trim().toLowerCase();
  const shown = library.filter((b) => (!libKind || kindOf(b.make()) === libKind) && (!q || holdsWords(b.label, q)));
  return shown.length
    ? el('ul', { class: 'ce-blocks', 'data-library-tiles': true }, ...shown.map(tile))
    : el('p', { class: 'ce-hint', 'data-library-tiles': true, text: q ? `No props in the library match "${libQuery.trim()}".` : 'No props of this kind in the library.' });
}
function libraryPanel() {
  const count = (id) => library.filter((b) => !id || kindOf(b.make()) === id).length;
  if (!library.length) return [libraryTiles()];
  return [
    el('div', { class: 'ce-filters' },
      // the same picker as every other menu, its label for screen readers only as the bar has one field of each
      quiet(picker('Kind', kinds().filter((k) => count(k.id)).map((k) => ({ name: k.id, label: `${k.label} (${count(k.id)})` })), libKind || null,
        (v) => { libKind = v || ''; $('[data-library-tiles]').replaceWith(libraryTiles()); }, { none: `All kinds (${count('')})`, noun: 'kind', field: 'lib-kind' })),
      el('label', { class: 'visually-hidden', for: 'lib-search', text: 'Search the library' }),
      el('input', { id: 'lib-search', type: 'search', class: 'filter', 'data-lib-search': true, value: libQuery, placeholder: 'Search', oninput: (e) => { libQuery = e.target.value; $('[data-library-tiles]').replaceWith(libraryTiles()); } })),
    libraryTiles(),
  ];
}

function renderPalette() {
  // Variants chooses its combination in its grid, and takes the palette's and the preview's room for it: the preview's
  // toggle stays in its place, off, and the choice it holds is kept for the other tabs
  document.querySelector('.ce').toggleAttribute('data-wide', view === 'variants');
  if (view === 'variants') { $('[data-tabs]').hidden = true; $('[data-palette]').replaceChildren(); return; }
  if (view === 'anatomy') {
    $('[data-tabs]').hidden = true;
    $('[data-palette]').replaceChildren(el('h3', { text: 'Add a part' }), el('ul', { class: 'ce-blocks' }, ...PART_KINDS.map(partTile)));
    return;
  }
  $('[data-tabs]').hidden = false;
  // a switch inside the Props tab is a segmented control, never a second row of tabs (navigation.md: one tab set per region)
  $('[data-tabs]').replaceChildren(...TABS.map(([id, label]) => el('button', {
    type: 'button', class: 'seg', id: `tab-${id}`, 'aria-pressed': String(id === tab),
    onclick: () => { tab = id; renderPalette(); $(`#tab-${id}`).focus(); },
  }, label)));
  $('[data-palette]').replaceChildren(el('div', { id: 'blocks-panel' },
    tab === 'library' ? libraryPanel() : SIDES.map(([side, heading]) => [el('h3', { text: heading }), el('ul', { class: 'ce-blocks' }, ...kinds().filter((b) => b.side === side).map(tile))]).flat()));
}

/*
 * Drag: an enhancement over the menu and the keys, on the same insert and
 * move. As on a board, the carried row leaves the list and a dashed slot of
 * its own height opens where it will land; a block from the palette carries the
 * row it will make, as a new part does in the tree, and dropping it opens its dialog.
 */
function dragFrom(e, { lifted }, drop) {
  if (e.button !== 0) return;
  const source = e.currentTarget;
  const id = e.pointerId;
  const start = { x: e.clientX, y: e.clientY };
  const list = $('[data-list]');
  // the whole centre column takes a drop, top to bottom, not only the rows already in it (an empty list has no height)
  const zone = $('.ce-props');
  // the row carried shows itself, dashed, where it will land
  const slot = slotOf(lifted);
  slot.dataset.slot = '';
  const rows = () => [...list.children].filter((li) => !li.hidden);
  let ghost = null;
  let at = null;
  let over = null;
  // a pointer this far outside the column still drops in it, so crossing its edge does not make the slot blink
  const SLACK = 48;
  const unblock = () => source.removeEventListener('click', block, true);
  const block = (c) => { unblock(); if (ghost) { c.preventDefault(); c.stopImmediatePropagation(); } };
  const place = (x, y) => {
    const r = zone.getBoundingClientRect();
    if (x < r.left - SLACK || x > r.right + SLACK) { if (slot.isConnected) flip(rows, () => slot.remove()); at = null; return; }
    const items = [...list.querySelectorAll(':scope > [data-uid]')].filter((li) => li !== lifted);
    // measured where the rows stand, the slot among them: a row moves the slot past it once the pointer passes its
    // middle, and then stands a row away, so a still pointer never moves it back
    const k = items.findIndex((li) => { const b = settled(li); return y < b.top + b.height / 2; });
    const next = k < 0 ? items.length : k;
    // the slot moves only when its place changes: moving it again where it already is restarts its fade, and it flickers
    if (next === at && slot.isConnected) return;
    at = next;
    flip(rows, () => { if (k < 0) list.append(slot); else items[k].before(slot); });
  };
  const end = (commit) => {
    if (dragging === end) dragging = null;
    off();
    document.documentElement.removeAttribute('data-dragging');
    ghost && ghost.remove();
    slot.remove();
    lifted.hidden = false;
    if (commit && ghost && at != null) drop(at);
    // hidden while carried, the handle lost focus: a drag that moved nothing gives it back
    if (lifted.isConnected && document.activeElement === document.body && source.isConnected) source.focus();
    // a click follows the release only when it lands back on the button; anywhere else, nothing is coming to block
    if (!(over && source.contains(over))) unblock();
  };
  const onMove = (m) => {
    if (m.pointerId !== id) return;
    if (!ghost) {
      if (Math.hypot(m.clientX - start.x, m.clientY - start.y) < 6) return;
      // a new row, not on the page, is taken where the pointer is, as wide as the list it joins
      ghost = lift(lifted, lifted.isConnected ? { clientX: start.x, clientY: start.y } : { clientX: m.clientX, clientY: m.clientY }, list.offsetWidth, lifted.isConnected ? null : list.getBoundingClientRect().left, lifted.isConnected ? lifted : list.querySelector(':scope > .ce-row'));
      document.body.append(ghost);
      document.documentElement.setAttribute('data-dragging', '');
      // its slot takes its place at once, so nothing closes up under it and the slot moves only when the pointer does
      if (lifted.isConnected) {
        at = [...list.querySelectorAll(':scope > [data-uid]')].filter((li) => li !== lifted).findIndex((li) => lifted.compareDocumentPosition(li) & Node.DOCUMENT_POSITION_FOLLOWING);
        if (at < 0) at = list.querySelectorAll(':scope > [data-uid]').length - 1;
        lifted.before(slot);
        lifted.hidden = true;
      }
    }
    const z = zone.getBoundingClientRect();
    ghost.follow(m.clientX, m.clientY, !lifted.isConnected && (m.clientX < z.left || m.clientX > z.right));
    edgeScroll(m.clientY);
    place(m.clientX, m.clientY);
  };
  const onUp = (u) => { if (u.pointerId !== id) return; over = u.target; if (ghost) u.preventDefault(); end(true); };
  // the pointer's own cancel, or the window losing focus with the button still down: its release never comes
  const onCancel = (c) => { if (c.type === 'blur' || c.pointerId === id) end(false); };
  // Escape abandons the drag, and only the drag: a modal it is in stays open
  const onKey = (k) => { if (k.key === 'Escape' && ghost) { k.preventDefault(); end(false); status('Drag cancelled.'); } };
  dragging?.(false);
  dragging = end;
  const off = listen({ pointermove: onMove, pointerup: onUp, pointercancel: onCancel, keydown: onKey, blur: onCancel });
  // a drag that ends on the button must not also click it; a drag released elsewhere must not leave the guard
  // armed, or it swallows the next real click on this button
  source.addEventListener('click', block, true);
}

function wireDrag() {
  $('[data-palette]').addEventListener('pointerdown', (e) => {
    const btn = e.target.closest('[data-block]');
    if (!btn || e.pointerType === 'touch' || view !== 'props') return;
    const b = allBlocks().find((x) => x.id === btn.dataset.block);
    e.preventDefault(); // no text selection starting under the pointer; the click still comes
    dragFrom({ button: e.button, pointerId: e.pointerId, clientX: e.clientX, clientY: e.clientY, currentTarget: btn },
      // the row it will make, named by the block until the dialog names it
      { lifted: propRow({ ...b.make(), name: b.label }, state.drafts.length, state.drafts.length + 1) }, (at) => openProp(b.make(), { isNew: true, at }));
  });
  $('[data-list]').addEventListener('pointerdown', (e) => {
    const h = e.target.closest('[data-handle]');
    if (!h) return;
    const li = h.closest('li');
    const from = find(li.dataset.uid);
    e.preventDefault();
    h.focus();
    dragFrom({ button: e.button, pointerId: e.pointerId, clientX: e.clientX, clientY: e.clientY, currentTarget: h },
      { lifted: li }, (at) => moveTo(from, at));
  });
  // a part pointed at or focused in the tree is outlined on the stage and in the preview
  const inspect = (e) => {
    for (const x of document.querySelectorAll('[data-pv][data-inspect]')) x.removeAttribute('data-inspect');
    const row = e.type === 'pointerleave' || e.type === 'focusout' ? null : e.target.closest('[data-parts] .ce-row');
    const key = row && (row.dataset.uid || (row.dataset.ghost && `at:${row.dataset.ghost}`));
    if (key) for (const pv of document.querySelectorAll(`[data-pv="${CSS.escape(key)}"]`)) pv.setAttribute('data-inspect', '');
  };
  // the part's modal closes by its ×, Escape or its backdrop, the focus back on the part's row in the tree
  const pd = $('[data-part-dialog]');
  // a part being added and closed any way but Add part is not added (unless another component was opened since);
  // taken back at once, as the close event comes a task later, when another part may be open
  // closed outright (×, the backdrop), every part still being added is taken back
  const back = () => {
    const first = adding[0];
    if (first && first.state === state) { state.parts = first.parts; state.base = first.base; selected = first.selected; }
    adding = [];
  };
  const shut = () => { back(); pd.close(); };
  // one step out, after Add part or Cancel: back to the part it was added from, or closed where it was added from outside
  const out = (cancel) => {
    const a = adding.pop();
    if (a && a.state === state && cancel) { state.parts = a.parts; state.base = a.base; selected = a.selected; }
    if (a && a.state === state && a.open) select(a.selected); else { adding = []; pd.close(); }
  };
  withIcon($('[data-part-close]'), 'close').addEventListener('click', shut);
  $('[data-part-cancel]').addEventListener('click', () => out(true));
  $('[data-part-done]').addEventListener('click', () => { if (addingNow() && addingNow().uid === selected) out(false); else shut(); });
  // Escape is Cancel while a part is being added, else it closes, as ×
  pd.addEventListener('cancel', (e) => { if (addingNow() && addingNow().uid === selected) { e.preventDefault(); out(true); } else back(); });
  pd.addEventListener('click', (e) => { if (e.target === pd) shut(); });
  // Backspace or Delete, while no field takes the keys, takes the part shown away, as Cancel or Delete part do
  pd.addEventListener('keydown', (e) => {
    if ((e.key !== 'Backspace' && e.key !== 'Delete') || e.target.closest('input, textarea, select, [contenteditable], .ce-picker__pop')) return;
    const b = $('[data-part-dialog] :is([data-part-cancel]:not([hidden]), [data-delete-part]:not(:disabled))');
    if (b) { e.preventDefault(); b.click(); }
  });
  // the event arrives a task after close(): a part opened again by then keeps its modal, its rows and their focus
  pd.addEventListener('close', () => {
    if (pd.open) return;
    back();
    renderParts(); const r = $(`[data-parts] [data-uid="${CSS.escape(selected)}"] [data-edit]`) || $('[data-parts] [data-edit]'); if (r) r.focus(); });
  // a part clicked on the stage is chosen; the empty stage around the component hides the outline and the numbers, for a
  // clean look at it, until a part is chosen again; a press that moved before it let go is a drag, not a click
  let pressed = null;
  /* What a click on the stage chooses, as Figma's does: the outermost part under the pointer at the levels open (the
     part chosen and every part it sits in), so a second click goes one level in; with ⌘ or Ctrl, the innermost.
     The component's name above it is its outer box. */
  // a part that paints only its outline (a focus ring over its box): pointed at inside it, the part under it is meant,
  // as Figma chooses a shape with no fill by its stroke alone
  const hollowAt = (n, e) => {
    if (n.children.length || n.textContent.trim()) return false;
    const st = getComputedStyle(n);
    if (st.borderTopWidth === '0px' && st.boxShadow === 'none' && st.outlineStyle === 'none') return false;
    if (!/^(rgba\(0, 0, 0, 0\)|transparent)$/.test(st.backgroundColor) || st.backgroundImage !== 'none') return false;
    const r = n.getBoundingClientRect(), edge = 8;
    return e.clientX > r.left + edge && e.clientX < r.right - edge && e.clientY > r.top + edge && e.clientY < r.bottom - edge;
  };
  const aimed = (e) => {
    if (e.target.closest('[data-stage-name]')) return $('[data-stage] .ce-stage__zoom > [data-pv]');
    let n = e.target.closest('.ce-stage__zoom [data-pv]');
    if (n && hollowAt(n, e)) n = document.elementsFromPoint(e.clientX, e.clientY).map((x) => x.closest('.ce-stage__zoom [data-pv]')).find((x) => x && x !== n && !n.contains(x)) || n;
    if (!n || e.metaKey || e.ctrlKey) return n;
    const open = new Set();
    for (let o = $(`[data-stage] [data-pv="${CSS.escape(selected)}"]`); o; o = o.parentElement.closest('[data-pv]')) open.add(o);
    for (let up = n.parentElement.closest('[data-pv]'); up && !open.has(up); up = n.parentElement.closest('[data-pv]')) n = up;
    return n;
  };
  // the part a click would choose, outlined thinly while pointed at
  const hover = (e) => {
    const was = $('[data-stage] [data-hover]');
    const n = e.type === 'pointerleave' || document.documentElement.hasAttribute('data-dragging') ? null : aimed(e);
    if (was && n && was.dataset.of === n.dataset.pv) return;
    was?.remove();
    if (n && !(n.hasAttribute('data-selected') && !$('[data-stage]').hasAttribute('data-bare'))) { ring(n, true); $('[data-stage] [data-hover]').dataset.of = n.dataset.pv; }
  };
  $('[data-stage]').addEventListener('pointermove', hover);
  $('[data-stage]').addEventListener('pointerleave', hover);
  $('[data-stage]').addEventListener('pointerdown', (e) => {
    pressed = { x: e.clientX, y: e.clientY };
    // a part pressed on the stage can be dragged to another place; a press that does not move still chooses it
    const pv = aimed(e);
    if (pv && e.button === 0 && !landing && !readOnly() && pv.dataset.pv !== 'root' && !pv.dataset.pv.startsWith('at:')) { $('[data-stage] [data-hover]')?.remove(); stageDrag(e, pv.dataset.pv); }
  });
  $('[data-stage]').addEventListener('click', (e) => {
    const at = pressed; pressed = null;
    if (!e.target.closest('.ce-stage__canvas')) return;
    if (at && e.detail && Math.hypot(e.clientX - at.x, e.clientY - at.y) >= 3) return;
    const hit = aimed(e);
    if (hit) select(hit.dataset.pv); else $('[data-stage]').toggleAttribute('data-bare', true);
  });
  for (const t of ['pointerover', 'pointerleave', 'focusin', 'focusout']) $('[data-parts]').addEventListener(t, inspect);
  $('[data-parts]').addEventListener('pointerdown', (e) => {
    const h = e.target.closest('[data-part-handle]');
    if (!h) return;
    e.preventDefault();
    h.focus();
    dragPart({ button: e.button, pointerId: e.pointerId, clientX: e.clientX, clientY: e.clientY }, findPart(h.closest('[data-uid]').dataset.uid));
  });
  // the keyboard path on the handle: the same move the menu makes
  $('[data-list]').addEventListener('keydown', (e) => {
    const h = e.target.closest('[data-handle]');
    if (!h) return;
    const i = find(h.closest('li').dataset.uid);
    const to = { ArrowUp: i - 1, ArrowDown: i + 1, Home: 0, End: state.drafts.length - 1 }[e.key];
    if (to == null) return;
    e.preventDefault();
    moveTo(i, to, '[data-handle]');
  });
  $('[data-parts]').addEventListener('keydown', (e) => {
    const h = e.target.closest('[data-part-handle]');
    if (!h) return;
    const p = findPart(h.closest('[data-uid]').dataset.uid);
    const n = state.parts.filter((x) => x.parent === p.parent).length;
    const k = state.parts.filter((x) => x.parent === p.parent).indexOf(p);
    const to = { ArrowUp: k - 1, ArrowDown: k + 1, Home: 0, End: n - 1 }[e.key];
    if (to == null) return;
    e.preventDefault();
    shiftPart(p, to, '[data-part-handle]');
  });
}

/* ── loading and leaving ────────────────────────────────────────────────── */
function wireTools() {
  for (const t of document.querySelectorAll('[data-view]')) {
    t.addEventListener('click', () => showView(t.dataset.view));
    t.addEventListener('keydown', rovingTabs(['props', 'anatomy', 'variants'], () => view, (v) => { showView(v); $(`[data-view="${v}"]`).focus(); }));
  }
  // the address follows a name as it is typed, in place; opening a component is the step Back returns from
  $('[data-component]').addEventListener('input', (e) => { state.component = e.target.value; refresh(); markCurrent(); syncUrl(); });
  $('[data-copy]').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText($('[data-json]').value); status('Copied the JSON.'); } catch { status('The browser refused the clipboard; select the JSON and copy it.'); }
  });
  $('[data-download]').addEventListener('click', () => {
    const blob = new Blob([$('[data-json]').value + '\n'], { type: 'application/json' });
    const a = el('a', { href: URL.createObjectURL(blob), download: `${kebab(state.component) || 'component'}.contract.json` });
    a.click();
    URL.revokeObjectURL(a.href);
    status(`Downloaded ${a.download}.`);
  });
  // the preview and JSON pane, docked beside the work, shown or hidden; the choice is remembered on this browser only
  const pane = $('#json-pane');
  const toggle = $('[data-json-toggle]');
  const showJson = (on) => {
    pane.hidden = !on;
    document.querySelector('.ce').toggleAttribute('data-no-json', !on);
    toggle.setAttribute('aria-expanded', String(on));
    store(KEY + ':json', on ? '1' : '0');
  };
  showJson(recall(KEY + ':json') !== '0');
  toggle.addEventListener('click', () => showJson(pane.hidden));
  // the JSON by hand: once edited, Apply reads it back into the props and the anatomy, or says why it cannot
  const text = $('[data-json]');
  text.addEventListener('input', () => edited(true));
  // Apply and Undo edits hide themselves once used, so the focus goes back to the JSON
  $('[data-json-revert]').addEventListener('click', () => { edited(false); refresh(); text.focus(); status('Edits to the JSON undone.'); });
  $('[data-json-apply]').addEventListener('click', () => {
    let c;
    try { c = JSON.parse(text.value); } catch (e) { $('[data-json-errors]').textContent = `Not valid JSON: ${e.message}`; text.setAttribute('aria-invalid', 'true'); text.focus(); return; }
    const found = contractProblems(c);
    // the look of a part Figma has drawn is Figma's: an edit to it here would be lost at the next snapshot
    if (state.base && state.base.figma) {
      // held to the library's own drawing, not to the page: a part made here is the contract's
      const now = (drawnFrom() || {}).anatomy || {};
      const LINKS = new Set(['parent', 'order', 'content']);
      // compared as values, so a reordered object is the same object
      const look = (x) => Object.fromEntries(Object.entries(x).filter(([k]) => !LINKS.has(k)));
      // a part whose kind changed, here or on the page, is no longer the drawing's: its look is the contract's
      const lockedOnPage = (id) => state.parts.some((p) => p.at === id && fromFigma(p));
      for (const [id, e] of Object.entries(c.anatomy || {})) if (now[id] && e && e.kind === now[id].kind && lockedOnPage(id) && !same(look(e), look(now[id]))) found.push({ where: `anatomy.${id}`, message: 'is a part Figma has drawn: its look is changed in Figma, then snapshotted again.' });
      // its parts and their names are structure, the contract's to propose, as in Anatomy; the Figma component it names stays
      if (!same(c.figma, state.base.figma)) found.push({ where: 'figma', message: 'names the Figma component this contract was drawn from, and stays as it is.' });
    }
    if (found.length) {
      $('[data-json-errors]').replaceChildren(...found.slice(0, 8).map((p) => el('span', { class: 'ce-json-problem', text: `${p.where ? p.where + ' ' : ''}${p.message}` })),
        ...(found.length > 8 ? [el('span', { class: 'ce-json-problem', text: `and ${found.length - 8} more` })] : []));
      text.setAttribute('aria-invalid', 'true');
      text.focus();
      status(`The JSON was not applied: ${found.length} problem${found.length > 1 ? 's' : ''}.`);
      return;
    }
    // no longer edited first, so the JSON shown is the page's own once more
    edited(false);
    // the JSON applied is this page's: a draft stays the same draft, renamed with it
    load(c, state.from, currentDraft && state.draft);
    text.focus();
    status(`Applied: ${state.drafts.length} props and ${state.parts.length - 1} parts.`);
  });
  // the pane's two tabs: the preview, and the JSON with its two actions
  const outTabs = [...document.querySelectorAll('[data-out-tab]')];
  for (const t of outTabs) {
    t.addEventListener('click', () => showOut(t.dataset.outTab));
    t.addEventListener('keydown', rovingTabs(['json', 'preview'], () => pane, (o) => { showOut(o); $(`[data-out-tab="${o}"]`).focus(); }));
  }
  // the dialog's action: checked first; a problem keeps it open, saying which field, or it saves and closes
  const dialog = $('[data-dialog]');
  $('[data-dialog-save]').addEventListener('click', (e) => {
    e.preventDefault();
    const found = dialogSave ? dialogSave() : [];
    if (found.length) { dialogProblems(found); return; }
    dialogSave = null;
    dialog.close();
    const t = refocus && $(refocus);
    refocus = null;
    if (t) t.focus();
  });
  // Cancel is a deliberate discard; only the accidental closes (a stray click, Escape) ask first (dialogs: Escape, backdrop click)
  $('[data-dialog-cancel]').addEventListener('click', () => dialog.close());
  withIcon($('[data-undo-close]'), 'close');
  // the header's close does what Cancel does (dialogs: anatomy)
  withIcon($('[data-dialog-close]'), 'close').addEventListener('click', () => dialog.close());
  $('[data-dialog-delete]').addEventListener('click', () => { const del = dialogDelete; dialogSave = null; dialogDelete = null; dialog.close(); if (del) del(); });
  // the form never submits by itself: Enter in a field (an option being added) is that field's own key, and Save is the button
  $('[data-dialog-form]').addEventListener('submit', (e) => e.preventDefault());
  // a click on the backdrop lands on the dialog itself, and closes it as Cancel does, unless the form was changed
  dialog.addEventListener('click', (e) => { if (e.target === dialog && !dialogChanged()) dialog.close(); });
  // Escape over changes asks once, in the dialog; a second Escape, or Cancel, discards them
  dialog.addEventListener('cancel', (e) => {
    if (!dialogChanged() || dialogWarned) return;
    e.preventDefault();
    dialogWarned = true;
    $('[data-dialog-errors]').replaceChildren(fieldError('Your changes are not saved. Press Escape again, or Cancel, to discard them.'));
  });
  // no 'close' listener clears the action: that event arrives a task after close(), by when the next dialog may be open.
  // It only puts the address back to the page, as a Back whose leave was cancelled left it on the component not opened
  dialog.addEventListener('close', () => syncUrl());
}

// a whole contract read into the page, its props and its anatomy, from the JSON or the library
// `from`, a library component opened, is set before the page draws, so it is never taken for a new one's first edit;
// `draft`, the page's draft when JSON is applied over it, so the draw that follows keeps that draft and starts no other
function load(c, from = undefined, draft = null) {
  const r = fromContract(c);
  const { anatomy, ...base } = r.base;
  state = { component: r.component, drafts: r.drafts, base, parts: fromAnatomy(anatomy || {}, r.drafts, c.props), ...(from ? { from } : {}), ...(draft ? { draft } : {}) };
  currentDraft = draft;
  $('[data-stale]').hidden = true;
  hideUndo();
  pageReplaced();
  renderView();
  markCurrent();
}
// another component on the page: the Variants filter starts again at its defaults, and the panel shows its props
// JSON edited by hand over the page before is not this page's
function pageReplaced() { filterAt = null; edited(false); renderPalette(); }

/*
 * The components to open: the drafts kept on this browser first, then the
 * library's. A draft is the page as it was left, saved when another
 * component was opened over it; opening it takes it off the list, as it is
 * the page again.
 */
let libraryContracts = [];
let hasCode = false;
// the components a library built elsewhere has and Figma does not (serve.mjs codeOnlyOf), opened from their code
let codeOnly = [];
// whether the library has a project to draw a new component into: a bare snapshot folder has none
let toFigma = false;
// the library's source of truth (component-contract's official.mjs): 'contract' keeps its official contracts apart from
// Figma's reading, and `behind` lists where Figma differs, each with its brief for the designer
let source = 'figma', behindList = [];
// the scratch file a new component is drawn into, from the library's settings in its context document (draw.scratch)
// where the library's settings live: its context document, else (no document, or no library in it) this browser
let scratch = null, settingsDoc = false;
// the project's code repo, and where Push to code writes a new component's stylesheet (its snapshot.config.json)
let code = null;
const DRAFTS = KEY + 's';
const keptDrafts = () => { try { return JSON.parse(recall(DRAFTS) || '[]'); } catch { status('The drafts kept in this browser could not be read.'); return []; } };
const keepDrafts = (list) => store(DRAFTS, JSON.stringify(list));
const draftName = (s) => s.component.trim() || 'Untitled';
// a draft is known by its id, so two of one name (two Untitled) are two drafts; one kept before drafts had ids, by its name
const draftKey = (s) => s.draft || draftName(s);
function renderNav() {
  const kept = keptDrafts();
  const item = (name, current, onclick, attrs, extra = null) => el('li', { class: extra ? 'ce-nav__draft' : null }, el('button', { type: 'button', title: name, text: name, 'aria-current': current ? 'true' : null, onclick, ...attrs }), extra);
  // a draft deleted, with Undo
  const drop = (d) => withIcon(el('button', { type: 'button', class: 'ce-nav__delete', 'aria-label': `Delete the draft of ${draftName(d)}`, 'data-delete-draft': draftName(d),
    onclick: () => {
      const all = keptDrafts();
      const at = all.findIndex((x) => draftKey(x) === draftKey(d));
      // what Undo brings back: the draft as it is now, the page itself where it is open, never the list's older copy
      const wasOpen = currentDraft === draftKey(d);
      const gone = wasOpen ? structuredClone(state) : all[at] || d;
      keepDrafts(all.filter((x) => draftKey(x) !== draftKey(d)));
      // the draft on the page goes with it: the page starts a new component
      if (wasOpen) { state = { component: '', drafts: [], base: {}, parts: [root()] }; currentDraft = null; filterAt = null; $('[data-stale]').hidden = true; showView('props'); render(); settle(); }
      renderNav();
      // the focus to the next draft (the one now in its place, or the last), or the list's first item
      const left = [...document.querySelectorAll('[data-nav-list] [data-draft]')];
      (left[Math.min(at, left.length - 1)] || $('[data-nav-list] button') || $('[data-nav-toggle]')).focus();
      // only this draft comes back, among the drafts kept since; drafts are not the page's, so any page may undo it
      offerUndo(`Deleted the draft of ${draftName(d)}.`, () => {
        const now = keptDrafts().filter((x) => draftKey(x) !== draftKey(d));
        now.splice(Math.min(at, now.length), 0, gone);
        keepDrafts(now);
        if (wasOpen) { openDraft(draftKey(d)); return; }
        renderNav();
        const again = [...document.querySelectorAll('[data-nav-list] [data-draft]')][Math.min(at, now.length - 1)];
        if (again) again.focus();
      }, { page: false });
    } }), 'close');
  const group = (title, items) => (items.length ? [el('h3', { class: 'sidenav__heading', text: title }), el('ul', { class: 'ce-nav__list' }, ...items)] : []);
  $('[data-nav-list]').replaceChildren(
    // by name: saving the page as a draft first reorders the list
    // the draft on the page is the current one, as a library component is
    ...group('Drafts', kept.map((d) => item(draftName(d), currentDraft === draftKey(d), () => leave(() => openDraft(draftKey(d)), draftName(d)), { 'data-draft': draftName(d) }, drop(d)))),
    ...group('Library', libraryContracts.map((c) => item(c.component, !currentDraft && c.component === state.component, () => leave(() => openContract(c), c.component), { 'data-open': c.component }))),
    ...group('Only in code', codeOnly.map((name) => item(name, !currentDraft && name === state.component, () => leave(() => openFromCode(name), name), { 'data-open': name }))),
    ...(kept.length || libraryContracts.length ? [] : [el('p', { class: 'ce-hint', text: 'No drafts yet. Start the editor on a project (serve.mjs --project <label>) and its components show here.' })]));
  showNav(navOn);
}
// what was on the page when it was opened or last kept: unchanged since, it leaves without asking
let opened = '';
const pageNow = () => JSON.stringify(toContract(state.component, state.drafts, state.base, state.parts));
// what the page was when opened, kept beside the page so a reload still knows what changed since
// arriving by Back or Forward is not a new step: the address is replaced, so Forward still goes forward
let travelling = false;
const settle = () => { opened = pageNow(); keepPage(KEY + ':opened', opened); renderNav(); syncUrl({ push: !travelling }); travelling = false; };
// after a person opens a component, the list drawn again under the focus: it goes to the component now open, never to the page
const refocusOpened = () => { if (!document.activeElement || document.activeElement === document.body) ($('[data-nav]:not([hidden]) [aria-current]') || $(readOnly() ? '.ce-views [aria-selected=true]' : '[data-component]')).focus(); };
// the page's work into the drafts, over its own draft if it has one, beside every other
// (and over the one it was opened from, kept before drafts had ids, which it now replaces under its id)
const keepAsDraft = () => { state.draft = state.draft || crypto.randomUUID(); keptAs = JSON.stringify(state); return keepDrafts([JSON.parse(keptAs), ...keptDrafts().filter((d) => draftKey(d) !== state.draft && draftKey(d) !== currentDraft)]); };
// the open draft as this tab last kept or opened it: kept otherwise since, another tab has changed it
let keptAs = '';
function openContract(c) { load(c, structuredClone(c)); settle(); refocusOpened(); status(`Opened ${c.component}: ${state.drafts.length} props and ${state.parts.length - 1} parts.`); }
// a component only the code has, read from its story (its last reading where there is one; Pull from code reads it again),
// opened to be read as a library component is: Edit as draft makes a draft of it, to push to Figma
async function openFromCode(name, { again = false } = {}) {
  const page = state;
  status(`Reading ${name} from code…`);
  const done = busy(`Reading ${name} from code…`);
  const r = await ask('pull-code', { component: name, cached: !again }).finally(done);
  // another component opened while it ran: the reading is not put over it
  if (state !== page) { status(`${name} was read from code after another component was opened; open ${name} again to see it.`); return; }
  if (!r.ok || !r.contract) { told(`${name} not read from code`, r.output); return; }
  openContract({ ...r.contract, component: name });
}
// the page is a component only the code has, or a draft made from one
const fromCode = () => !!(state.from && state.from.code && state.from.code.from === 'code');
// a draft stays in the list until it is saved over or discarded: opening it is not losing it
let currentDraft = null;
// a library component opened, and not yet a draft, is read: Figma's, as Dev Mode shows it
const readOnly = () => !!state.from && !currentDraft;
// Edit as draft: kept in this browser's drafts at once, and the page the draft's to change
function editAsDraft() {
  if (!keepAsDraft()) { status('This browser would not keep the draft (its storage is full or switched off).'); return; }
  draftKept = true;
  currentDraft = state.draft;
  renderNav();
  pageReplaced();
  renderView();
  $('[data-component]').focus();
  status(`Editing a draft of ${draftName(state)}. ${fromCode() ? 'The code' : "Figma's version"} stays as it is.`);
}
// whether this browser took the page's last edit: one it refused (storage full or off) is asked about on leaving
let draftKept = false, storeRefused = false;
// a new component is a draft from its first edit, kept under its name as it changes; one opened from the library is
// kept when it is left, as before
function autoDraft() {
  // a library component is kept when it is left, and as it is edited once it is a draft
  if ((state.from && !currentDraft) || (!currentDraft && pageNow() === opened) || (!state.drafts.length && state.parts.length < 2 && !state.component.trim())) return;
  const was = currentDraft;
  draftKept = keepAsDraft();
  // said once when the browser starts refusing, not over every key typed after
  if (!draftKept) { if (!storeRefused) status('This browser would not keep the draft (its storage is full or switched off). Download the JSON to keep the work.'); storeRefused = true; return; }
  storeRefused = false;
  currentDraft = state.draft;
  // the list follows the name as it is typed
  if (was !== currentDraft || $('[data-nav-list] [aria-current]')?.textContent !== draftName(state)) renderNav();
}
// the open draft as another tab kept it: drawn here in its place, or, discarded there, left on the page as unkept work
function followDraft() {
  if (!currentDraft) return;
  const d = keptDrafts().find((x) => draftKey(x) === currentDraft);
  // its work stays on the page, editable: a new draft of it from the next edit, not a library component to read
  if (!d) { currentDraft = null; draftKept = false; delete state.from; renderNav(); renderView(); status(`The draft of ${draftName(state)} was discarded in another tab. Its work stays on this page.`); return; }
  if (JSON.stringify(d) === keptAs) return;
  state = restore(d);
  keptAs = JSON.stringify(d);
  hideUndo();
  pageReplaced();
  renderView();
  travelling = true;
  settle();
  status(`The draft of ${draftName(d)} was changed in another tab: this page shows it now.`);
}
function openDraft(key) {
  const d = keptDrafts().find((x) => draftKey(x) === key);
  // deleted since the list was drawn (in another tab): said, and the list drawn again
  if (!d) { renderNav(); status('That draft is no longer kept in this browser.'); return; }
  state = restore(d);
  keptAs = JSON.stringify(d);
  currentDraft = key;
  draftKept = true;
  hideUndo();
  pageReplaced();
  renderView();
  settle();
  refocusOpened();
  status(`Opened the draft of ${draftName(d)}.`);
  stale();
}
/*
 * A draft begun from a library component remembers that component as it was.
 * Opened again after a snapshot changed it, the page says what Figma changed
 * since, and offers Figma's version (the draft stays in the list): a proposal
 * made from the draft would otherwise be made against a contract that is gone.
 */
function stale() {
  const box = $('[data-stale]');
  const was = state.from;
  const now = was && libraryContracts.find((c) => c.component === was.component);
  box.hidden = !now || same(now, was);
  if (box.hidden) return;
  const props = keyDiff(was.props, now.props);
  const parts = keyDiff(was.anatomy, now.anatomy);
  const n = (list, what) => (list.length ? `${list.length} ${what}${list.length > 1 ? 's' : ''}` : null);
  const said = [
    props.added.length ? `props added: ${props.added.join(', ')}` : null,
    props.removed.length ? `props removed: ${props.removed.join(', ')}` : null,
    props.changed.length ? `props changed: ${props.changed.join(', ')}` : null,
    [n(parts.added, 'part added'), n(parts.removed, 'part removed'), n(parts.changed, 'part changed')].filter(Boolean).join(', ') || null,
    same(was.variants, now.variants) && same(was.invalid, now.invalid) ? null : 'its variants changed',
  ].filter(Boolean);
  box.replaceChildren(
    el('p', {}, el('strong', { text: source === 'contract' ? `${now.component}'s official contract has changed since this draft began. ` : `Figma has changed ${now.component} since this draft began. ` }), el('span', { text: said.length ? `${said.join('; ')}.` : 'Its metadata changed.' })),
    el('button', { type: 'button', class: 'button', 'data-stale-open': true, text: source === 'contract' ? 'Open the official contract' : 'Open Figma\'s version', onclick: () => leave(() => openContract(now), now.component) }));
}

/* Where the library takes the contract as its source, what Figma is behind on for the component on the page, with
   the brief that tells the designer what to change, and the one-click answers: take Figma's version as official, or,
   for a component Figma no longer has, drop its official contract. A field at a time is a draft: Edit as draft, change
   it, Save as official. */
function renderBehind() {
  const box = $('[data-behind]');
  // by its Figma key: a component redrawn under its old name is two, one new and one gone
  const key = state.from && state.from.figma && state.from.figma.key;
  const d = source === 'contract' && !fromCode() && key && behindList.find((x) => x.key === key);
  box.hidden = !d;
  if (!d) return;
  const said = { changed: `Figma is behind the official contract of ${d.component}.`, new: `${d.component} is in Figma and has no official contract yet.`, gone: `${d.component} is no longer in Figma; its official contract stays.` }[d.kind];
  const act = (action, word, done) => el('button', { type: 'button', class: 'button', text: word, onclick: () => {
    const run = async () => { const r = await ask(action, { component: d.component, key: d.key }).finally(busy(`${word}…`)); if (!r.ok) { told(`${d.component} not changed`, r.output); return; } await reopen(d.key, d.component); status(done); };
    openDialog(word, word, el('p', { text: action === 'drop-official' ? `${d.component}'s official contract is deleted. Undo is not possible here; its file is in the project's history.` : `${d.component}'s official contract becomes what Figma has now, every difference taken. To take some only, use Edit as draft instead.` }), () => { run(); return []; });
  } });
  box.replaceChildren(el('p', {}, el('strong', { text: `${said} ` })),
    el('button', { type: 'button', class: 'button', text: 'Copy brief for Figma', onclick: async () => { try { await navigator.clipboard.writeText(d.brief); status('Copied the brief for Figma.'); } catch { told('The brief for Figma', d.brief); } } }),
    d.kind === 'gone' ? act('drop-official', 'Drop the official contract', `Dropped ${d.component}'s official contract.`) : act('take-figma', d.kind === 'new' ? 'Take as official' : 'Take Figma\'s version', `${d.component}'s official contract is Figma's now.`));
}
// the library read again and a component opened by its Figma key, which a rename in either place keeps; gone, a new page
async function reopen(key, name) {
  await connect(connected);
  const c = libraryContracts.find((x) => x.figma && x.figma.key === key) || libraryContracts.find((x) => x.component === name);
  if (c) openContract(c); else newComponent();
  return c;
}
// a linked draft that is now its component's official contract: the draft is done with, and the official one opens
async function officialNow(was) {
  const done = currentDraft;
  keepDrafts(keptDrafts().filter((x) => draftKey(x) !== done));
  currentDraft = null;
  return reopen(was.figma && was.figma.key, was.component);
}
async function saveOfficial() {
  const was = linkedTo();
  if (running) { status(`Wait: ${running}`); return; }
  const r = await ask('save-official', { contract: contractNow(), base: was }).finally(busy(`Saving ${was.component}'s official contract…`));
  if (!r.ok) { told(`${was.component} not saved`, r.output); return; }
  const c = await officialNow(was);
  status(`Saved ${c ? c.component : was.component}'s official contract.`);
}

function newComponent() {
  state = { component: '', drafts: [], base: {}, parts: [root()] };
  currentDraft = null;
  edited(false);
  $('[data-stale]').hidden = true;
  hideUndo();
  filterAt = null;
  showView('props');
  render();
  settle();
  $('[data-component]').focus();
  status('A new component: name it, then add its props.');
}
// leaving the page's work: kept as a draft, or discarded; work unchanged since it was opened goes without a question
function leave(next, to = null) {
  // a new component is kept as it is edited, and a read-only one holds no work: either leaves without asking
  if (readOnly() || (!state.drafts.length && state.parts.length < 2) || pageNow() === opened || (currentDraft && draftKept)) { next(); return; }
  const name = draftName(state);
  openDialog(`Keep ${name} as a draft?`, 'Save as draft',
    el('p', { class: 'ce-hint', text: `${to ? `Opening ${to}` : 'A new component'} replaces it on the page. A draft stays in Components on this browser.` }),
    // kept, or the page stays as it is and says why
    () => (keepAsDraft() ? (next(), refocus = '[data-nav]:not([hidden]) [aria-current], [data-component]', []) : [{ field: null, message: 'This browser would not keep the draft (its storage is full or switched off). Download the JSON to keep the work.' }]),
    { onDelete: () => next(), deleteWord: 'Discard' });
}
// one item is current: the draft on the page, or else the library component of its name
const markCurrent = () => { for (const b of document.querySelectorAll('[data-open]')) if (!currentDraft && b.dataset.open === state.component) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current'); };
let navOn = false;
function showNav(on) {
  $('[data-nav]').hidden = !on;
  document.querySelector('.ce').toggleAttribute('data-nav-open', on);
  $('[data-nav-toggle]').setAttribute('aria-expanded', String(on));
}

/* The library the page is connected to: its settings, its components' props, its tokens; none, the house's alone. */
let connected = '';
async function connect(label) {
  let facts = { project: null, settings: {}, optionOrder: {}, contracts: [], tokens: { colours: [], lengths: [], textStyles: [], uses: {} } };
  try {
    const r = await fetch(`project.json${label ? `?label=${encodeURIComponent(label)}` : ''}`);
    if (!r.ok) throw new Error((await r.json()).error || r.statusText);
    facts = await r.json();
  } catch (e) { told(`Not connected to ${label}`, `${e.message}\n\nThe page uses the house settings until a library connects.`); label = ''; }
  palette = blocks(facts);
  library = libraryBlocks(facts.contracts);
  tokens = facts.tokens || tokens;
  hasCode = !!facts.hasCode;
  codeOnly = facts.codeOnly || [];
  toFigma = !!facts.toFigma;
  source = facts.source || 'figma';
  settingsDoc = !!facts.settingsDoc;
  scratch = facts.scratch || (settingsDoc ? null : recall(KEY + ':scratch:' + (label || '')) || null);
  behindList = facts.behind || [];
  code = facts.code || null;
  docs = facts.docs || null;
  nestedCache.clear();
  icons = new Set(facts.icons || []);
  previews = facts.previews || {};
  sizeAxis = (facts.settings && facts.settings.sizeAxis) || null;
  libraryContracts = [...(facts.contracts || [])].filter((c) => c && c.component).sort((a, b) => a.component.localeCompare(b.component));
  renderNav();
  connected = label || '';
  syncUrl();
  renderPalette();
  renderView();
  return facts;
}

// a page's state read back from storage: a restored prop or part gets a fresh uid, so every link to one is carried over to its new uid
function restore(saved) {
  const ref = new Map([['root', 'root']]);
  const drafts = saved.drafts.map((d) => { const n = draft(d); ref.set(d.uid, n.uid); return n; });
  const parts = (saved.parts || [root()]).map((p) => { const n = p.uid === 'root' ? { ...p } : part(p); ref.set(p.uid, n.uid); return n; });
  for (const p of parts) for (const k of ['parent', 'textProp', 'swapProp', 'slotProp', 'shownBy']) if (p[k]) p[k] = ref.get(p[k]) ?? null;
  return { component: saved.component || '', drafts, base: saved.base || {}, parts, from: saved.from || null, ...(saved.draft ? { draft: saved.draft } : {}) };
}

/*
 * Sync with the project's Figma and code. Each side is read or written by
 * the toolkit tool that owns it (the snapshot, to-figma.mjs, from-code.mjs,
 * the frontend-build skill); the page only asks. A component the library
 * already has is changed through review: pushing it, to either side, saves
 * a proposal of what changed, and neither side updates the other.
 */
const inLibrary = () => libraryContracts.find((c) => c.component === state.component.trim());
const contractNow = () => toContract(state.component, state.drafts, state.base, state.parts);
const slug = () => kebab(state.component) || 'component';
function download(name, text, type = 'application/json') {
  const a = el('a', { href: URL.createObjectURL(new Blob([text], { type })), download: name });
  a.click();
  URL.revokeObjectURL(a.href);
  status(`Downloaded ${name}.`);
}
async function ask(action, body = {}) {
  try {
    const r = await fetch('sync', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action, label: connected, ...body }) });
    return await r.json();
  } catch (e) { return { ok: false, output: e.message }; }
}
// what a person reads after a run that did not do what was asked, in the tool's own words; never over a dialog in use
function told(title, text) {
  if ($('[data-dialog]').open) { status(`${title}: ${(text || '').split('\n')[0]}`); return; }
  openDialog(title, 'Done', el('pre', { class: 'ce-output', 'data-sync-output': true, text: text || 'Nothing was said.' }), () => []);
}
// a proposal: the contract as the library has it, as the page has it, and what differs, for review
function propose(side) {
  const from = inLibrary();
  const to = contractNow();
  download(`${slug()}.proposal.json`, JSON.stringify({ proposal: 1, component: state.component.trim(), project: connected, for: side, at: new Date().toISOString(),
    changes: { props: keyDiff(from.props, to.props), anatomy: keyDiff(from.anatomy, to.anatomy), when: keyDiff(from.when, to.when),
      variants: same(from.variants, to.variants) ? 'same' : 'changed', invalid: same(from.invalid, to.invalid) ? 'same' : 'changed' }, from, to }, null, 2) + '\n');
}
async function pullFigma() {
  status('Reading the snapshot again…');
  const done = busy('Reading the snapshot again…');
  const r = await ask('pull-figma').finally(done);
  if (!r.ok) { told('Not read from Figma', r.output); return; }
  await connect(connected);
  const c = inLibrary();
  if (c) leave(() => openContract(c), c.component);
  status(`Read the snapshot again: ${libraryContracts.length} components.`);
}
// a draft made from a library component, the component it was made from (as it was then)
const linkedTo = () => (currentDraft && state.from) || null;
function pushFigma({ asNew = false } = {}) {
  if (inLibrary() && !asNew) { propose('figma'); return; }
  // Figma draws parts: with none, there is nothing to draw
  if (state.parts.length < 2) { told('Nothing to draw yet', `${state.component.trim()} has no parts. Add them in Anatomy, then push it to Figma.`); return; }
  // drawn into the library's scratch file; none set yet, Settings asks for it first
  if (!scratch) { openSettings({ then: () => pushFigma({ asNew }) }); return; }
  const name = state.component.trim();
  const done = busy(`Drawing ${name} in Figma…`);
  status(`Drawing ${name} in Figma…`);
  ask('push-figma', { contract: contractNow(), into: scratch }).finally(done).then((r) => (r.ok ? status(`Drawn in Figma: ${r.output.split('\n').pop()}`) : told('Not drawn in Figma', r.output)));
}
/* The library's settings, kept in its context document, not in this browser: the scratch file a new component is drawn
   into, never the library, and the source of truth (serve.mjs's settings action, official.mjs's switch). */
function openSettings({ then = null } = {}) {
  if (!connected) { openCreate(); return; }
  const w = { scratch: scratch || '', source, repo: (code && code.repo) || '', styles: (code && code.styles) || '', prefix: (code && code.prefix) || '', framework: (code && code.framework) || '' };
  const text = (title, key, placeholder) => only(title, el('input', { class: 'filter', value: w[key], 'data-field': key, autocomplete: 'off', placeholder, oninput: (e) => { w[key] = e.target.value.trim(); } }));
  const body = el('div', { class: 'ce-form' },
    el('p', { class: 'ce-hint', text: settingsDoc ? `Saved in ${connected}'s context document, for everyone who works on the library.` : 'No context document holds this library\'s settings, so they are kept in this browser.' }),
    // a link is read down to its key: the address is what anyone copies
    only('Scratch file', el('input', { class: 'filter', value: w.scratch, 'data-scratch': true, 'data-field': 'scratch', autocomplete: 'off', placeholder: 'figma.com/design/<key>/…', oninput: (e) => { const v = e.target.value.trim(); w.scratch = (v.match(/figma\.com\/(?:design|file|board)\/([A-Za-z0-9]+)/) || [, v])[1]; } })),
    el('p', { class: 'ce-hint', text: 'A new component is drawn into the scratch file, on a page of its own, never into the library.' }),
    // the source is the context document's to say: with none, Figma's reading is the only contract there is
    ...(settingsDoc ? [choice('Source of truth', 'source', [['figma', 'Figma'], ['contract', 'Contract']], w.source, (v) => { w.source = v; }),
      el('p', { class: 'ce-hint', text: 'Figma: the official contract is the snapshot\'s reading of the library. Contract: the official contracts are the project\'s own files, and Figma is compared with them.' })] : []),
    // a code repo is connected once, by init.mjs; moving it is the context document's to change by hand
    ...(!settingsDoc ? [] : code ? [only('Code repo', el('input', { class: 'filter', value: w.repo, readonly: true })), text('Styles folder', 'styles', 'src/styles/components'), text('Class prefix', 'prefix', 'ds-'),
      choice('Framework', 'framework', [['', 'None'], ['react', 'React'], ['web-components', 'Web components'], ['kirby', 'Kirby snippets']], w.framework, (v) => { w.framework = v; }),
      el('p', { class: 'ce-hint', text: 'Push to code writes a new component\'s stylesheet into the styles folder, its classes under the prefix; with a framework, also its component, parity mapping and story.' })]
      : [text('Code repo', 'repo', '~/code/acme'), el('p', { class: 'ce-hint', text: 'A git repo on this machine. What connecting it writes is shown before anything is written.' })]));
  openDialog('Settings', 'Save', body, () => {
    if (w.scratch && !/^[A-Za-z0-9]{10,64}$/.test(w.scratch)) return [{ field: 'scratch', message: 'That is not a Figma file link or key: copy the scratch file\'s address.' }];
    if (then && !w.scratch) return [{ field: 'scratch', message: 'Name the scratch file to draw into.' }];
    const asked = { ...(w.scratch !== (scratch || '') ? { scratch: w.scratch } : {}), ...(w.source !== source ? { source: w.source } : {}),
      ...(code && w.styles !== (code.styles || '') ? { styles: w.styles } : {}), ...(code && w.prefix !== code.prefix ? { prefix: w.prefix } : {}), ...(code && w.framework !== (code.framework || '') ? { framework: w.framework } : {}) };
    const joining = !code && w.repo;
    if (!Object.keys(asked).length && !joining) { if (then) then(); return []; }
    (async () => { if (Object.keys(asked).length && !(await save(asked))) return; if (joining) connectRepo(w.repo); })();
    return [];
  }, { work: w });
  const save = async (asked) => {
    if (!settingsDoc) { store(KEY + ':scratch:' + connected, w.scratch); scratch = w.scratch || null; status(scratch ? `Scratch file set to ${scratch}.` : 'Scratch file cleared.'); if (then) then(); return true; }
    const r = await ask('settings', asked).finally(busy('Saving the settings…'));
    // back to Figma while Figma is behind: what is dropped is said, and switched only when confirmed
    if (r.refused) { openDialog('Switch back to Figma?', 'Switch anyway', el('pre', { class: 'ce-output', text: r.output }), () => { save({ ...asked, confirm: true }); return []; }); return; }
    if (!r.ok) { told('Settings not saved', r.output); return; }
    await connect(connected);
    renderBehind();
    status(r.output);
    if (then) then();
    return true;
  };
}
/* A local git repo connected as the project's code repo by init.mjs (serve.mjs's connect-repo): what it would write is
   shown first, and written only when confirmed. */
async function connectRepo(repo) {
  const dry = await ask('connect-repo', { repo }).finally(busy('Reading the repo…'));
  if (!dry.ok) { told('Repo not connected', dry.output); return; }
  openDialog('Connect this repo?', 'Connect', el('pre', { class: 'ce-output', text: dry.output }), () => {
    (async () => {
      const r = await ask('connect-repo', { repo, confirm: true }).finally(busy('Connecting the repo…'));
      if (!r.ok) { told('Repo not connected', r.output); return; }
      await connect(connected);
      told('Repo connected', r.output);
    })();
    return [];
  });
}
/* An editor started on no project makes one: by a name, the library's address, and the code the snapshot plugin showed
   when it ran in a library no project claims (the router kept that snapshot, so the project has it at once); without a
   code, the id the plugin prints. Its settings are then kept in its context document, as any project's are (serve.mjs's
   create action, projects.create). */
// what was typed, kept for a second try after a refusal
const creating = { project: '', library: '', code: '', id: '' };
async function openCreate() {
  const w = creating;
  let kept = false;
  try { kept = !!(await (await fetch('projects.json')).json()).kept; } catch { /* none to offer */ }
  // a code typed before is no use once nothing is kept, and its field is not shown to clear
  if (!kept) w.code = '';
  const field = (title, key, placeholder, read = (v) => v) => only(title, el('input', { class: 'filter', 'data-field': key, autocomplete: 'off', placeholder, value: w[key], oninput: (e) => { w[key] = read(e.target.value.trim()); } }));
  const body = el('div', { class: 'ce-form' },
    el('p', { class: 'ce-hint', text: 'No project is open, so there is nowhere to keep settings yet. Make one for your library: its settings are then kept in its context document.' }),
    field('Project name', 'project', 'acme'),
    field('Library file', 'library', 'figma.com/design/<key>/…', (v) => (v.match(/figma\.com\/(?:design|file)\/([A-Za-z0-9]+)/) || [, v])[1]),
    ...(kept ? [field('Code', 'code', 'K7M2QX', (v) => v.toUpperCase()), el('p', { class: 'ce-hint', text: 'The code the snapshot plugin showed: its snapshot goes into the project.' })] : []),
    field('Library file id', 'id', 'f…'),
    el('p', { class: 'ce-hint', text: kept ? 'Only without a code: the id the plugin prints.' : 'The id: run the snapshot plugin in the library once. It shows a code to make the project with, and the id.' }));
  // what makes a label, a key and an id is the registry's to say (projects.create): its refusal is shown as it says it
  openDialog('Create a project', 'Create', body, () => {
    (async () => {
      const asked = w.code ? { project: w.project, library: w.library, code: w.code } : { project: w.project, library: w.library, id: w.id };
      const r = await ask('create', asked).finally(busy('Making the project…'));
      if (!r.ok) { told('Project not made', r.output); return; }
      Object.assign(creating, { project: '', library: '', code: '', id: '' });
      await connect(r.project);
      status(r.output);
    })();
    return [];
  }, { work: w });
}
/* Full version, a linked draft: the library component it was made from updated in place, in the library file. Offered,
   not recommended: it changes what every file using the component gets when the library publishes, so it is asked
   first, and refused where the library changed since the draft was made (serve.mjs, to-figma.mjs --patch). */
function patchFigma() {
  const was = linkedTo(), name = was.component;
  const body = el('div', { class: 'ce-form' },
    el('p', { text: `This changes ${name} in the library file itself. Each variant that stays keeps its instances, in every file, and they take the change when the library is published; a variant this draft no longer draws is removed. A version is saved in the file's history first.` }),
    el('p', { class: 'ce-hint', text: 'Not the usual way: Push as new component draws it beside the library, to review first. The library file must be open in Figma with the Desktop Bridge. Refused, with nothing changed, if anyone has changed it in the library since this draft was made.' }),
    // the contract is the source: what goes into Figma is the official contract, so the draft becomes it first
    source === 'contract' ? el('p', { class: 'ce-hint', text: `The draft is saved as ${name}'s official contract first, whether or not Figma takes it.` }) : null);
  openDialog(`Update ${name} in the library`, 'Update the library', body, () => {
    status(`Updating ${name} in the library…`);
    const done = busy(`Updating ${name} in the library…`);
    ask('patch-figma', { contract: contractNow(), base: was }).finally(done).then(async (r) => {
      // saved as official before Figma was asked, so the draft is done with either way
      if (r.saved) await officialNow(was);
      if (r.ok) status(`Updated in the library: ${r.output.split('\n').filter(Boolean).slice(-2).join(' ')}`); else told(`${name} not updated`, r.output);
    });
    return [];
  });
}
async function pullCode() {
  const name = state.component.trim(), page = state;
  // one only the code has is read again where it is read: opened from its code, as before
  if (!inLibrary()) { leave(() => openFromCode(name, { again: true }), name); return; }
  status(`Reading ${name} from code…`);
  const done = busy(`Reading ${name} from code…`);
  const r = await ask('pull-code', { component: name }).finally(done);
  // another component opened while it ran: the reply is not put over it
  if (state !== page) { status(`${name} was read from code after another component was opened; open ${name} and pull it again.`); return; }
  if (!r.ok || !r.contract) { told('Not read from code', r.output); return; }
  // the code's contract on the page under the component's own name: where it differs from Figma's, Propose says so
  const c = { ...r.contract, component: name };
  leave(() => { load(c); status(`Opened ${name} as its code has it; Propose sends what differs from Figma for review.`); }, name);
}
async function pushCode() {
  if (inLibrary()) { propose('code'); return; }
  // its stylesheet written where the repo keeps them (to-code.mjs); building the rest is the frontend-build skill's job,
  // so the brief that hands it the contract follows
  if (code && code.styles) {
    const r = await ask('push-code', { contract: contractNow() }).finally(busy(code.framework ? 'Writing the component…' : 'Writing the stylesheet…'));
    if (!r.ok) { told('Not written to code', r.output); return; }
    status(`${r.output.split('\n').filter((l) => /^to-(code|markup)/.test(l)).join('; ') || r.output.split('\n').pop()}. The build brief is downloaded for the rest.`);
  } else status('Set a code repo and its styles folder in Settings to write the stylesheet too.');
  download(`${slug()}.build.md`, `# Build ${state.component.trim()}\n\nBuild this component with the toolkit's frontend-build skill, from the contract below, in the project's own conventions.\n\n\`\`\`json\n${JSON.stringify(contractNow(), null, 2)}\n\`\`\`\n`, 'text/markdown');
}

async function main() {
  let list = { start: null, projects: [] };
  try { list = await (await fetch('projects.json')).json(); } catch { /* no list: the house settings only */ }
  withIcon($('[data-nav-toggle]'), 'panel-left');
  withIcon($('[data-json-toggle]'), 'panel-right');
  withIcon($('[data-new]'), 'plus');
  withIcon($('[data-settings]'), 'settings');
  $('[data-new]').addEventListener('click', () => leave(newComponent));
  $('[data-edit-draft]').addEventListener('click', editAsDraft);
  $('[data-save-official]').addEventListener('click', saveOfficial);
  $('[data-settings]').addEventListener('click', () => openSettings());
  // the sync menus: what each side can do for the component on the page
  const hasName = () => !!state.component.trim();
  // the first requirement an item lacks, said under it; none, the item is on
  const unmet = (...pairs) => pairs.find(([lacks]) => lacks)?.[1] || false;
  const noLibrary = () => [!connected, 'The editor serves no library: start it on a project'];
  const notIn = () => [!inLibrary(), 'Not one of the library\'s components'];
  const idle = () => [!!running, `Wait: ${running}`];
  for (const [sel, id, items] of [
    ['[data-figma-menu]', 'figma-menu', () => [
      ['Pull from Figma', pullFigma, unmet(idle(), noLibrary(), notIn())],
      // a component being read is Figma's own: nothing to propose to it until it is a draft
      readOnly() || linkedTo() ? null : [inLibrary() ? 'Propose to Figma' : 'Push to Figma', pushFigma, unmet(idle(), noLibrary(), [!hasName(), 'Name the component first'], [!inLibrary() && !toFigma, 'A snapshot folder has no project to draw into'])],
      // a linked draft: drawn as a new component to review, or, not recommended, the library's own updated
      linkedTo() ? ['Push as new component', () => pushFigma({ asNew: true }), unmet(idle(), noLibrary(), [!toFigma, 'A snapshot folder has no project to draw into'])] : null,
      linkedTo() && !fromCode() ? ['Update the library component…', patchFigma, unmet(idle(), noLibrary(), [!toFigma, 'A snapshot folder has no project to draw into'], [state.parts.length < 2, 'Nothing to draw: add its parts in Anatomy'])] : null].filter(Boolean)],
    ['[data-code-menu]', 'code-menu', () => [
      ['Pull from code', pullCode, unmet(idle(), noLibrary(), [!inLibrary() && !codeOnly.includes(state.component.trim()), 'Not one of the library\'s components'], [!hasCode, 'The library maps no code to read'])],
      // a component being read is the library's as coded: nothing to propose to its code until it is a draft
      // a draft of a component only the code has is the code's already: nothing to push to it
      readOnly() || fromCode() ? null : [inLibrary() ? 'Propose to code' : 'Push to code', pushCode, unmet([!hasName(), 'Name the component first'])]].filter(Boolean)],
  ]) { const [b, pop] = menu($(sel), id, items, { align: 'start' }); b.after(pop); }
  // the library is the one this server serves (serve.mjs --project), as a docs site serves its project's
  const chosen = list.start || '';
  const asked = new URLSearchParams(location.search);
  // shown unless this browser hid it (sidebars: expanded is the default)
  // on a narrow screen the list covers the page, so it opens only when asked
  navOn = recall(KEY + ':nav') !== '0' && !matchMedia('(width < 64rem)').matches;
  $('[data-nav-toggle]').addEventListener('click', () => {
    navOn = $('[data-nav]').hidden;
    showNav(navOn);
    store(KEY + ':nav', navOn ? '1' : '0');
  });
  // Back and Forward: the component and the tab the address names, the page's work asked about first as anywhere
  addEventListener('popstate', () => {
    const q = new URLSearchParams(location.search);
    const c = libraryContracts.find((x) => x.component === q.get('component'));
    if (c && c.component !== state.component) leave(() => { travelling = true; openContract(c); }, c.component);
    else if (!c && codeOnly.includes(q.get('component')) && q.get('component') !== state.component) leave(() => { travelling = true; openFromCode(q.get('component')); }, q.get('component'));
    // a draft by its name; a page that is neither (a new one, since renamed) cannot be reopened from its address: the address says the page
    else if (!c && q.get('component') !== state.component.trim()) {
      const d = keptDrafts().find((x) => draftName(x) === q.get('component'));
      if (d) leave(() => { travelling = true; openDraft(draftKey(d)); }, draftName(d)); else syncUrl();
    }
    const t = q.get('tab') || 'props';
    if (['props', 'anatomy', 'variants'].includes(t) && t !== view) showView(t);
  });
  // the preview follows the page's scheme as it changes
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', renderPreview);
  for (const b of document.querySelectorAll('[data-theme-choice]')) b.addEventListener('click', renderPreview);
  wireDrag();
  wireTools();
  let saved = null;
  try { saved = JSON.parse(recallPage(KEY) || 'null'); } catch { /* a draft that does not parse is no draft */ }
  if (saved && saved.props) {
    // a draft saved as a contract, before drafts were kept
    const r = fromContract(saved);
    state = { component: r.component, drafts: r.drafts, base: r.base, parts: [root()] };
  } else if (saved && Array.isArray(saved.drafts)) state = restore(saved);
  // the page's own draft, kept before the reload, is the one it goes on with
  const own = state.draft && keptDrafts().find((d) => draftKey(d) === state.draft);
  if (own) { currentDraft = state.draft; draftKept = true; keptAs = JSON.stringify(own); }
  // its draft discarded in another tab while this one was closed: the work stays on the page, editable, as followDraft leaves it
  else if (state.draft) { delete state.draft; delete state.from; }
  // the open draft changed in another tab is shown as it is now, so an edit here never writes over that tab's
  addEventListener('storage', (e) => { if (e.key === DRAFTS) followDraft(); });
  // a tab closed on work it never kept, which another tab's page has since replaced in the browser's store, keeps it as a draft
  addEventListener('pagehide', () => {
    if (currentDraft || pageNow() === opened || recall(KEY) === JSON.stringify(state)) return;
    if (keepAsDraft()) try { sessionStorage.setItem(KEY, JSON.stringify(state)); } catch { /* the draft has it */ }
  });
  await connect(chosen);
  // a library component open to be read holds no work, so it reopens as the library has it now
  const reading = state.from && !state.draft && libraryContracts.find((x) => x.component === state.from.component);
  if (reading && !same(reading, state.from)) { load(reading, structuredClone(reading)); settle(); }
  // the work on the page, begun from a library component a snapshot has changed since, says so
  stale();
  // a component the address names, from the library, unless it is the work already on the page; that work is kept as a draft
  // a link from another project's docs (every project's editor defaults to one port) opens nothing here, and says so
  const elsewhere = asked.get('project') && chosen && asked.get('project') !== chosen;
  const named = !elsewhere && asked.get('component');
  const c = named && named !== state.component && libraryContracts.find((x) => x.component === named);
  // a first visit opened what is on the page now; a later one knows what was opened before it
  const was = recallPage(KEY + ':opened');
  if (was === null) settle(); else opened = was;
  if (c) {
    // the work kept first; where the browser will not keep it, it stays on the page and the address is not followed
    if (pageNow() !== opened && !keepAsDraft()) { status(`${named} was not opened: this browser would not keep the work on the page as a draft. Download the JSON to keep it.`); renderNav(); }
    else { load(c, structuredClone(c)); settle(); }
  } else if (named && named !== state.component && codeOnly.includes(named)) { renderNav(); leave(() => openFromCode(named), named); }
  else renderNav();
  if (['props', 'anatomy', 'variants'].includes(asked.get('tab'))) showView(asked.get('tab'));
  if (asked.get('pane') === 'preview') showOut('preview');
  if (elsewhere) status(`This editor serves ${chosen}; the link was for ${asked.get('project')}. Start the editor with --project ${asked.get('project')} to open it.`);
  else if (state.drafts.length) status(`Restored ${state.drafts.length} props from your last session.`);
}

main();
