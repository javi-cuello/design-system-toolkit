#!/usr/bin/env node
// tools/component-contract/to-code.mjs and css.mjs: a contract as the stylesheet that rebuilds every variant.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { toCss, rulesOf, selfCheck, namer, condition, controlOf, HOUSE } from './to-code.mjs';
import { declarations } from './css.mjs';
import { fillCss, fillsFromCss, smoothingToCss } from './rules.mjs';

let n = 0;
const ok = (name, cond) => { n++; assert.ok(cond, name); console.log('ok', name); };

/* A button by its name, however written; never a radio, a group of buttons, or one that holds a button. */
const buttons = ['Button', 'Icon button', 'IconButton', 'Button_Primary', 'Close button', 'Compact button'];
const boxes = ['Radio Button/Item', 'Radio button', 'Button Groups', 'Button group', 'Button bar', 'Button Toolbar', 'Segmented button', 'Split button', 'Nav item'];
ok('a button is read from its name in any spelling, and a radio, a group or a bar of buttons is not one', buttons.every((x) => controlOf(x) === 'button') && boxes.every((x) => controlOf(x) === null) && controlOf('Card button', ['Button']) === null);
ok('element naming refuses a prefix with no hyphen: with none, every button on the page would be the host', /hyphen/.test((() => { try { namer('button', { kind: 'element', prefix: '' }); return ''; } catch (e) { return e.message; } })()) && namer('chip', { kind: 'element', prefix: 'my-ds-' }).root === 'my-ds-chip');
const names = { token: (t) => `var(--${t.toLowerCase().replace(/[^a-z0-9]+/g, '-')})`, textStyle: (t) => [['font-size', `var(--${t.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-font-size)`]] };
const decl = (e, at) => Object.fromEntries(declarations(e, at, names).decls.map(([p, v]) => [p, v]));

// the translation, field by field (figma-handoff: auto layout to flex; code-standard rules 54 and 63)
const box = decl({ layout: { direction: 'column', gap: 'Spacing/8', padding: { top: 'S/4', end: 'S/8', bottom: 'S/4', start: 'S/8' }, align: 'center', crossAlign: 'stretch' }, width: 'hug', minHeight: 24 }, { holds: true, root: false });
ok('auto layout is flex: direction, gap, padding (shortest form), alignment, each a token; hug writes nothing; a number is rem',
  box.display === 'flex' && box['flex-direction'] === 'column' && box.gap === 'var(--spacing-8)' && box.padding === 'var(--s-4) var(--s-8)'
  && box['justify-content'] === 'center' && box['align-items'] === 'stretch' && !('inline-size' in box) && box['min-block-size'] === '1.5rem');
ok('a hugging outer box is inline-flex, as it sits in a line of text', decl({ layout: {}, width: 'hug' }, { holds: true, root: true }).display === 'inline-flex');
ok('fill grows along the parent\'s row and stretches across its column', decl({ width: 'fill' }, { row: true }).flex === '1 1 0' && decl({ width: 'fill' }, { row: false })['align-self'] === 'stretch');
const lit = declarations({ minHeight: 24 }, {}, names).decls[0];
ok('a text that hugs its width never wraps (Figma\'s WIDTH_AND_HEIGHT), one that fills or is cut keeps its own',
  decl({ kind: 'text', width: 'hug', height: 'hug' }, {})['white-space'] === 'nowrap' && decl({ kind: 'text', width: 'fill', height: 'hug' }, {})['white-space'] === undefined
  && decl({ kind: 'container', width: 'hug', height: 'hug' }, {})['white-space'] === undefined
  && decl({ kind: 'text', width: 'hug', height: 'hug', maxLines: 2, truncate: true }, {})['-webkit-line-clamp'] === '2');
ok('a literal carries its reason (code-standard rule 22)', lit[2] === 'no token in the design');
ok('a radius stays px, a length goes rem (code-standard rule 54)', decl({ radius: 6 })['border-radius'] === '6px' && decl({ width: 8 })['inline-size'] === '0.5rem');
ok('an inside stroke out of layout is an inset ring; in layout, a border per side; outside, an outline taking no room (rule 63)',
  decl({ border: { color: 'C/line', width: 'Stroke/1' } })['box-shadow'] === 'inset 0 0 0 var(--stroke-1) var(--c-line)'
  && decl({ border: { color: 'C/line', width: [0, 0, 'Stroke/1', 0], sides: { top: 0, end: 0, bottom: 1, start: 0 }, inLayout: true } })['border-bottom'] === 'var(--stroke-1) solid var(--c-line)'
  && decl({ border: { color: 'C/line', width: 2, align: 'outside' } }).outline === '2px solid var(--c-line)');
ok('one inside edge is one inset shadow shifted from that edge, beside the effect style', decl({ border: { color: 'C/line', width: [0, 0, 1, 0], sides: { bottom: 1 } }, shadow: 'Elevation/Raised' })['box-shadow'] === 'inset 0 -1px 0 0 var(--c-line), var(--elevation-raised)');
const centred = decl({ position: 'absolute', absolute: { x: 0, y: 0 }, constraints: { horizontal: 'center', vertical: 'center' } });
ok('a part centred out of the flow is pinned at the middle and moved back by half its size', centred['inset-inline-start'] === '50%' && centred.translate === '-50% -50%');
ok('smoothing is corner-shape on any corner (a square or mixed one keeps the value), none at 0', decl({ radius: 8, smoothing: 0.6 })['corner-shape'] === smoothingToCss(0.6) && decl({ smoothing: 0.6 })['corner-shape'] === smoothingToCss(0.6) && decl({ radius: [0, 8, 8, 0], smoothing: 0.6 })['corner-shape'] === smoothingToCss(0.6) && !('corner-shape' in decl({ radius: 8, smoothing: 0 })));
ok('smoothing CSS cannot say is named, not dropped', declarations({ smoothing: 2 }, {}, names).unread.some((f) => /smoothing/.test(f)));
ok('a box holding a part out of the flow is its containing block', decl({}, { anchors: true }).position === 'relative');
const { unread } = declarations({ smoothing: 0.6, background: 'GRADIENT_RADIAL', mystery: 1, parent: 'root', order: 2 }, {}, names);
ok('what CSS cannot say is named, the markup\'s own fields are not', unread.some((f) => /radial/.test(f)) && unread.includes('mystery') && !unread.includes('parent') && !unread.includes('order'));
ok('an image fill is the project\'s --image, sized as Figma fits it, over its colour; a clear pixel until it is given',
  /^var\(--image, url\("data:image\/gif;base64,[^"]+"\)\) center \/ contain no-repeat$/.test(decl({ background: 'IMAGE:FIT' }).background)
  && /cover no-repeat, var\(--c-soft\)$/.test(decl({ background: ['C/soft', 'IMAGE:FILL'] }).background) && / repeat$/.test(decl({ background: 'IMAGE:TILE' }).background));

// the rules: one per layer, saying only what it changes, the cascade rebuilding every combination
const chip = { contract: 1, component: 'Chip',
  props: { size: { type: 'enum', values: ['md', 'sm'], default: 'md' }, selected: { type: 'boolean', default: false, axis: true },
    state: { type: 'enum', values: ['rest', 'hover'], default: 'rest', role: 'interaction', pointer: ['hover'] }, disabled: { type: 'boolean', default: false, axis: true } },
  anatomy: { root: { kind: 'container', layout: { direction: 'row', gap: 'S/4' }, background: 'C/rest' }, label: { kind: 'text', parent: 'root', order: 0, typography: 'Label/md', color: 'T/base' } },
  variants: [{ when: { size: 'sm' }, set: { 'label.typography': 'Label/sm' } }, { when: { selected: true }, set: { 'root.background': 'C/on' } },
    { when: { state: 'hover' }, set: { 'root.background': 'C/hover' } }, { when: { disabled: true }, set: { 'root.opacity': 'State/Disabled/opacity' } },
    { when: { selected: true, state: 'hover' }, set: { 'root.background': 'C/on-hover' } }],
  invalid: [{ disabled: true, state: 'hover' }] };
const css = toCss(chip, 'chip', { naming: { kind: 'class', prefix: 'ds-', part: '__' } });
ok('every combination the grid draws is rebuilt by the cascade', selfCheck(chip).length === 0);
ok('a value is an attribute, a state its pseudo-class, disabled the control\'s own or the attribute where there is none (code-standard rule 9)',
  css.includes('.ds-chip:where([data-size="sm"]) > .ds-chip__label') && css.includes('.ds-chip:where(:hover:not(:is([data-disabled]:not([data-disabled="false"]), :disabled, :has(> :disabled)))) {') && css.includes('.ds-chip:where(:is([data-disabled]:not([data-disabled="false"]), :disabled, :has(> :disabled)))') && !/data-state/.test(css));
ok('a pair is one rule over its two conditions, after the singles, each condition weighing nothing so order decides', css.indexOf('.ds-chip:where(:is([data-selected]:not([data-selected="false"]), :has(> :checked))):where(:hover') > css.indexOf('.ds-chip:where(:hover:not('));
ok('a layer says only what it changes: the label\'s colour is written once', (css.match(/var\(--t-base\)/g) || []).length === 1);
ok('parts are reached by child combinators only (code-standard rule 5)', !/\.ds-chip(\[[^\]]*\]|:[a-z-]+(\([^)]*\))?)* \.ds-chip__/.test(css));
ok('the file says it is generated and how it is chosen', /Do not edit/.test(css) && /Chosen by: size: data-size="md\|sm"/.test(css));
ok('element naming: the element, its parts by data-part, a prop that is an HTML attribute kept off it',
  namer('chip', { kind: 'element', prefix: 'ds-' }).root === 'ds-chip' && namer('chip', { kind: 'element', prefix: 'ds-' }).part('label') === '[data-part="label"]'
  && namer('chip', { kind: 'element', prefix: 'ds-' }).attr('size') === 'data-size' && namer('chip', { kind: 'element', prefix: 'ds-' }).attr('tone') === 'tone');
// a layer before a pair in contract order that CSS would rank under it: a combination rule settles it
const order = { ...chip, variants: [{ when: { selected: true, size: 'sm' }, set: { 'root.background': 'C/a' } }, { when: { selected: true }, set: { 'root.background': 'C/b' } }] };
ok('where specificity and the contract\'s order disagree, a rule for that combination makes the cascade exact', selfCheck(order, rulesOf(order).rules).length === 0);

// a text entry: the placeholder and the value Figma draws are one input and its ::placeholder, chosen by the input's own state
const field = { contract: 1, component: 'Search',
  props: { placeholder: { type: 'string', default: 'Search', sets: ['field/placeholder'] }, value: { type: 'string', sets: ['field/value'] }, hasValue: { type: 'boolean', default: false, axis: true },
    state: { type: 'enum', values: ['rest', 'focus'], default: 'rest', role: 'interaction', pointer: ['focus'] }, disabled: { type: 'boolean', default: false, axis: true } },
  anatomy: { root: { kind: 'container', layout: {} }, field: { kind: 'container', parent: 'root', layout: { direction: 'row' }, background: 'C/field' },
    'field/placeholder': { kind: 'text', parent: 'field', order: 0, color: 'T/soft', typography: 'Label/md', content: '{placeholder}' } },
  variants: [{ when: { hasValue: true }, add: { 'field/value': { kind: 'text', parent: 'field', order: 0, width: 'fill', color: 'T/strong', typography: 'Label/md', content: '{value}' } }, remove: ['field/placeholder'] },
    { when: { state: 'focus' }, set: { 'field.background': 'C/focus' } }, { when: { disabled: true }, set: { 'root.opacity': 'State/Disabled/opacity' } }] };
const fcss = toCss(field, 'search', { naming: { kind: 'class', prefix: 'ds-', part: '__' } });
ok('a text entry is one input with its ::placeholder, focus and disabled reached down to it, no attribute for holding a value',
  fcss.includes('.ds-search > .ds-search__field > .ds-search__input {') && fcss.includes('.ds-search__input::placeholder {') && fcss.includes(':has(> .ds-search__field > .ds-search__input:focus-visible)')
  && fcss.includes(':has(> .ds-search__field > .ds-search__input:disabled)') && !/data-has-value/.test(fcss) && selfCheck(field).length === 0);
// a boolean whose default is on is on with no attribute; Selected is a native control's :checked as well
const req = { ...chip, props: { ...chip.props, required: { type: 'boolean', default: true, axis: true } }, variants: [...chip.variants, { when: { required: false }, set: { 'label.color': 'T/soft' } }] };
const qcss = toCss(req, 'chip', { naming: { kind: 'class', prefix: 'ds-', part: '__' } });
ok('a boolean on by default is off only when the attribute says false', qcss.includes('.ds-chip:where([data-required="false"]) > .ds-chip__label') && selfCheck(req).length === 0);
ok('Selected is the attribute or a checked control in the box; a box naming no control is focused when what it holds is', css.includes(':has(> :checked)') && toCss({ ...chip, props: { ...chip.props, state: { ...chip.props.state, values: ['rest', 'focus'], pointer: ['focus'] } }, variants: [{ when: { state: 'focus' }, set: { 'root.background': 'C/f' } }] }, 'chip').includes(':is(:focus-visible, :has(:focus-visible))'));
// an outer box that hugs keeps its own width where a parent would stretch it; an instance a parent fills across drops its own
ok('a hugging outer box is fit-content, and a placed instance filled across is auto', /inline-size: fit-content/.test(toCss({ ...chip, anatomy: { ...chip.anatomy, root: { ...chip.anatomy.root, width: 'hug' } } }, 'chip'))
  && decl({ kind: 'instance', width: 'fill' }, { row: false })['inline-size'] === 'auto');
ok('an outside ring beside an effect style is the first box-shadow layer', decl({ border: { color: 'C/line', width: 1, align: 'outside' }, shadow: 'Elevation/Raised' })['box-shadow'] === '0 0 0 1px var(--c-line), var(--elevation-raised)');
ok('a line no wide is a border on its leading edge, no outline', (() => { const d = decl({ kind: 'graphic', width: 0, height: 'fill', border: { color: 'C/line', width: [1, 1, 1, 1], sides: { top: 1, end: 1, bottom: 1, start: 1 }, align: 'center' } }); return d['border-left'] === '1px solid var(--c-line)' && !('outline' in d) && !('box-shadow' in d); })()
  && decl({ kind: 'graphic', width: 'fill', height: 0, border: { color: 'C/line', width: 1 } })['border-top'] === '1px solid var(--c-line)');
ok('a fill with no variable is written as its colour, never a made-up token', decl({ background: 'rgb(0 0 0 / 0.5)' }).background === 'rgb(0 0 0 / 0.5)');
ok('spaced between, the gap Figma sets aside is not written', !('gap' in decl({ layout: { direction: 'row', gap: 'S/16', align: 'space-between' } }, { holds: true })));
const placed = toCss({ ...chip, anatomy: { ...chip.anatomy, badge: { kind: 'instance', parent: 'root', order: 1, component: 'Badge', width: 'fill', background: 'C/x', radius: 4, shadow: 'E/1' } } }, 'chip');
ok('a placed component is given its place and size, never its look', /__badge \{\s*flex: 1 1 0;\s*\}/.test(placed) && !/var\(--c-x\)|var\(--e-1\)/.test(placed));
// a variant that puts a box's children in another order: each child says its place, in the defaults and the variant
const rev = { ...chip, props: { ...chip.props, reversed: { type: 'boolean', default: false, axis: true } }, anatomy: { ...chip.anatomy, texts: { kind: 'container', parent: 'root', order: 1, layout: { direction: 'column' } }, 'texts/a': { kind: 'text', parent: 'texts', order: 0 }, 'texts/b': { kind: 'text', parent: 'texts', order: 1 } },
  variants: [...chip.variants, { when: { reversed: true }, set: { 'texts/a.order': 1, 'texts/b.order': 0 } }] };
const rcss2 = toCss(rev, 'chip', { naming: { kind: 'class', prefix: 'ds-', part: '__' } });
ok('a reordering variant writes each child\'s order', /__texts > \.ds-chip__a \{[^}]*order: 0;/.test(rcss2) && /:where\(\[data-reversed\]:not\(\[data-reversed="false"\]\)\) > \.ds-chip__texts > \.ds-chip__a \{\s*order: 1;/.test(rcss2) && selfCheck(rev).length === 0);
// a placed control the Selected layer names is the one the state reaches, at its depth; another control is not
const card = { ...chip, anatomy: { ...chip.anatomy, top: { kind: 'container', parent: 'root', order: 1, layout: { direction: 'row' } }, 'top/check': { kind: 'instance', parent: 'top', order: 0, component: 'Checkbox', with: { Selected: 'False' } }, foot: { kind: 'instance', parent: 'root', order: 2, component: 'Button' } },
  variants: [...chip.variants, { when: { selected: true }, set: { 'top/check.with': { Selected: 'True' } } }] };
const ccss = toCss(card, 'chip', { naming: { kind: 'class', prefix: 'ds-', part: '__' } });
ok('a placed control the contract names drives the state, and no other', ccss.includes(':has(> .ds-chip__top > .ds-chip__check :checked)') && ccss.includes(':has(> .ds-chip__top > .ds-chip__check :disabled)') && !ccss.includes('__foot :') && !/:has\(:/.test(ccss) && !ccss.includes(':has(> :disabled)') && !ccss.includes(':has(> :checked)') && selfCheck(card).length === 0);
// where Figma draws no disabled hover, a disabled box under the pointer is drawn at rest: rest admits it
const restDis = toCss({ ...chip, props: { ...chip.props, state: { ...chip.props.state, values: ['rest', 'hover', 'press'], pointer: ['hover', 'press'] } }, variants: [...chip.variants, { when: { state: 'press' }, set: { 'root.background': 'C/p' } }, { when: { state: 'rest', disabled: true }, set: { 'root.background': 'C/r' } }] }, 'chip', { naming: { kind: 'class', prefix: 'ds-', part: '__' } });
ok('rest is also a disabled box hovered, where disabled hover is not drawn', condition(chip, namer('chip'), 'state', 'rest').includes(':not(:hover:not(:is([data-disabled]') && !restDis.includes('undefined'));
// rest, where the product sets states of its own (disabled, read-only, active), is none of them: a rule naming rest never
// reaches a disabled box (carbon slider: a rest rule's display: none hid its handle at disabled and active)
{ const sl = { contract: 1, component: 'Slide', props: { state: { type: 'enum', values: ['rest', 'hover', 'disabled'], default: 'rest', role: 'interaction', pointer: ['hover'] } }, anatomy: { root: { kind: 'container' } }, variants: [] };
  const r = condition(sl, namer('slide'), 'state', 'rest');
  ok('rest, beside states the product sets, excludes them by its attribute', r.includes(':not(:hover)') && /:is\(\[data-state="rest"\], :not\(\[data-state\]\)\)/.test(r) && !/data-state/.test(condition(chip, namer('chip'), 'state', 'rest'))); }
// numbered copies of a placed component in one box are rows of one kind: the first's class and rule, no numbered parts
const rows = toCss({ ...chip, anatomy: { ...chip.anatomy, nav: { kind: 'container', parent: 'root', order: 1, layout: { direction: 'column' } }, 'nav/item': { kind: 'instance', parent: 'nav', order: 0, component: 'Row', width: 'fill' }, 'nav/item_2': { kind: 'instance', parent: 'nav', order: 1, component: 'Row', width: 'fill' } } }, 'chip', { naming: { kind: 'class', prefix: 'ds-', part: '__' } });
const odd = toCss({ ...chip, anatomy: { ...chip.anatomy, nav: { kind: 'container', parent: 'root', order: 1, layout: { direction: 'column' } }, 'nav/day': { kind: 'instance', parent: 'nav', order: 0, component: 'Day', opacity: 'O/dim' }, 'nav/day_2': { kind: 'instance', parent: 'nav', order: 1, component: 'Day', width: 'fill' } } }, 'chip', { naming: { kind: 'class', prefix: 'ds-', part: '__' } });
ok('a copy drawn otherwise than its first stays a part of its own', /__day-2 \{[^}]*align-self: stretch/.test(odd) && /__day \{[^}]*opacity/.test(odd));
const texts = toCss({ ...chip, anatomy: { ...chip.anatomy, title: { kind: 'text', parent: 'root', order: 1, color: 'C/a' }, title_2: { kind: 'text', parent: 'root', order: 2, color: 'C/b' } } }, 'chip', { naming: { kind: 'class', prefix: 'ds-', part: '__' } });
ok('numbered copies of a placed component take their first\'s class; two texts stay two parts', rows.includes('.ds-chip__nav > .ds-chip__item {') && !/item-2/.test(rows) && texts.includes('__title-2 {') && texts.includes('var(--c-b)'));
// a slot's children are samples: one rule places any child, and none of their insides is written
const slotted = toCss({ ...chip, anatomy: { ...chip.anatomy, slot: { kind: 'slot', parent: 'root', order: 1, layout: { direction: 'column' } }, 'slot/item': { kind: 'container', parent: 'slot', order: 0, width: 'fill', background: 'C/x', layout: { direction: 'row' } }, 'slot/item/label': { kind: 'text', parent: 'slot/item', order: 0, color: 'C/y' }, 'slot/item_2': { kind: 'instance', parent: 'slot', order: 1, component: 'Badge', width: 'fill' } } }, 'chip', { naming: { kind: 'class', prefix: 'ds-', part: '__' } });
ok('a slot\'s samples are one rule for any child, placed and no more', /\.ds-chip__slot > \* \{\s*align-self: stretch;/.test(slotted) && !/__item|var\(--c-x\)|var\(--c-y\)/.test(slotted));
// a focus ring drawn as a layer of its own is the parent's outline, offset by its clear less its width
const ringed = { ...chip, variants: [...chip.variants, { when: { state: 'hover' }, add: {} }], props: { ...chip.props, state: { ...chip.props.state, values: ['rest', 'hover', 'focus'], pointer: ['hover', 'focus'] } } };
ringed.variants.push({ when: { state: 'focus' }, add: { ring: { kind: 'graphic', parent: 'root', position: 'absolute', absolute: { x: -4, y: -4, end: -4, bottom: -4 }, constraints: { horizontal: 'stretch', vertical: 'stretch' }, border: { color: 'Focus/colour', width: [2, 2, 2, 2] } } } });
const rcss = toCss(ringed, 'chip', { naming: { kind: 'class', prefix: 'ds-', part: '__' } });
ok('a ring layer is an outline on what it rings, offset 4 less 2, read through the ring knob, and no element of its own', /\.ds-chip:where\(:is\(:focus-visible, :has\(:focus-visible\)\)\) \{\s*outline: var\(--ds-ring, 2px solid var\(--focus-colour\)\);\s*outline-offset: 2px;/.test(rcss) && !rcss.includes('__ring'));
// the ring's corners: a box that paints nothing takes them less the clearance while focused; one that paints keeps its own
const cornered = (root, painted = false) => { const r = JSON.parse(JSON.stringify(ringed)); for (const v of r.variants) if (v.set) for (const k of Object.keys(v.set)) if (/^root\.(background|border|shadow|overflow|shape|mask)$/.test(k)) delete v.set[k]; if (painted) r.variants.unshift({ when: { size: 'sm' }, set: { 'root.background': 'C/x' } }); r.anatomy.root = { ...r.anatomy.root, ...root }; delete r.anatomy.root.background; Object.assign(r.anatomy.root, root); r.variants.at(-1).add.ring.radius = 'Corner/16'; return toCss(r, 'chip', { naming: { kind: 'class', prefix: 'ds-', part: '__' } }); };
// a painted one keeps its own, and the ring is a box of its own over it (::after) with the ring's corners; one that
// clips, with the ring outside it, would cut that box off: it keeps the outline and says so
const painted = cornered({ background: 'C/x' }), clipped = cornered({ overflow: 'hidden' });
ok('a bare box takes the ring\'s corners less its clearance while focused; a painted one keeps its own, ringed by a box of its own; a clipping one, the ring outside, says so', /outline-offset: 2px;[^}]*border-radius: calc\(var\(--corner-16\) - 4px\)/.test(cornered({})) && /\)\)\) \{\s*position: relative;/.test(painted) && /::after \{\s*content: "";\s*position: absolute;\s*inset: 0;\s*border-radius: calc\(var\(--corner-16\) - 4px\);\s*pointer-events: none;\s*outline: var\(--ds-ring/.test(painted) && !/focus ring's corners/.test(painted) && /focus ring's corners/.test(clipped) && !/::after \{[^}]*outline/.test(clipped) && /::after \{\s*content: none;/.test(clipped));
// a box with a border in the layout: its own box covers the border box, out past the border
const bordered = cornered({ border: { color: 'C/x', width: [1, 1, 2, 1], inLayout: true } });
ok('a ring\'s own box stands over a border in the layout, its border box', /::after \{[^}]*inset: -1px -1px -2px -1px;/.test(bordered));
// a box that clips at rest and not while focused is bare where its ring is drawn: it takes the ring's corners
const unclipped = (() => { const r = JSON.parse(JSON.stringify(ringed)); for (const v of r.variants) if (v.set) for (const k of Object.keys(v.set)) if (/^root\.(background|border|shadow|overflow|shape|mask)$/.test(k)) delete v.set[k]; delete r.anatomy.root.background; r.anatomy.root.overflow = 'hidden'; r.variants.at(-1).add.ring.radius = 'Corner/16'; r.variants.push({ when: { state: 'focus' }, set: { 'root.overflow': null } }); return toCss(r, 'chip', { naming: { kind: 'class', prefix: 'ds-', part: '__' } }); })();
ok('a box that stops clipping when focused takes the ring\'s corners there, no box of its own', /border-radius: calc\(var\(--corner-16\) - 4px\)/.test(unclipped) && !/::after \{[^}]*outline/.test(unclipped));
// a box bare at one size and painted at another: its own box at the second, its outline at the first and no box beside
// it there, which the ::after rule would otherwise double; the ring knob kept in every rule
const once = cornered({}, true);
ok('a box painted in one combination is ringed by a box of its own there, and draws none where its outline rings it', /::after \{[^}]*outline: var\(--ds-ring/.test(once) && /::after \{\s*content: none;/.test(once) && !/outline: 2px solid/.test(once));
ok('a bare box that clips what it holds keeps its corners at focus', !/calc\(var\(--corner-16\)/.test(cornered({ overflow: 'hidden' })));
const outside = JSON.parse(JSON.stringify(ringed)); outside.variants.at(-1).add.ring.border.align = 'outside';
ok('a ring stroked outside its layer starts at the layer\'s edge: offset 4, not 6', /outline-offset: 4px;/.test(toCss(outside, 'chip', { naming: { kind: 'class', prefix: 'ds-', part: '__' } })));
// a ring layer another combination draws as a box (Carbon's focusBorder, shown open and drawn at focus): where its outline
// rings, the box draws nothing, or a rule of that combination reaches there and the layer is drawn twice
const boxed = JSON.parse(JSON.stringify(ringed)); boxed.variants.push({ when: { selected: true }, add: { ring: boxed.variants.at(-1).add.ring } });
const bcss = toCss(boxed, 'chip', { naming: { kind: 'class', prefix: 'ds-', part: '__' } });
ok('a ring layer drawn as a box at another combination draws nothing where its outline rings it, and the cascade replays it',
  /:focus-visible[^{]*> \.ds-chip__ring \{\s*display: none;/.test(bcss) && /outline: var\(--ds-ring/.test(bcss) && selfCheck(boxed).length === 0 && !/__ring \{\s*display: none/.test(rcss));
// the disabled dim on the root reads the dim knob, so a holder that dims sets it to 1 and its parts dim once (code-standard rule 62)
const dimmed = toCss(chip, 'chip', { naming: { kind: 'class', prefix: 'ds-', part: '__' } });
ok('the disabled dim on the root reads the dim knob first, and sets it on what the root holds', /opacity: var\(--ds-dim, var\(--state-disabled-opacity\)\);/.test(dimmed) && /\) > \* \{ --ds-dim: 1; \}/.test(dimmed));
// a later disabled rule that undoes the dim takes the knob back, so a disabled part inside dims itself again
const undim = toCss({ ...chip, variants: [...chip.variants, { when: { selected: true, disabled: true }, set: { 'root.opacity': null } }] }, 'chip', { naming: { kind: 'class', prefix: 'ds-', part: '__' } });
ok('a disabled rule that undoes the dim sets the knob back to initial', /> \* \{ --ds-dim: initial; \}/.test(undim));
ok('a stroke with no paint draws nothing', !('box-shadow' in decl({ border: { width: 'Stroke/1' } })) && !('border' in decl({ border: { width: 1, inLayout: true } })));

// every contract stored on this machine: each stylesheet rebuilds every variant its contract draws (skipped with none)
const require = createRequire(import.meta.url);
// No catch: a contract that crashes the rebuild is a failure, never "not read" and then a skip (review, 2026-10-31).
let stored = 0, off = 0;
const projects = require('../snapshot/projects.cjs');
for (const { name: label } of projects.projects().list) {
  const w = projects.layout(null, label);
  const dir = w && w.paths && w.paths.components;
  if (!dir || !fs.existsSync(dir)) continue;
  for (const f of fs.readdirSync(dir)) {
    const file = path.join(dir, f, 'contract.json');
    if (!fs.existsSync(file)) continue;
    const c = JSON.parse(fs.readFileSync(file, 'utf8'));
    stored++;
    if (selfCheck(c, rulesOf(c).rules).length) { off++; console.log('  not rebuilt:', label, f); }
  }
}
if (stored) ok(`every stored contract's stylesheet rebuilds every variant it draws (${stored} contracts)`, off === 0);
else console.log('skip: no stored contracts on this machine');

// a contract not stored yet (the contract editor's Push to code): its own stylesheet, under the folder name the store
// would give it, in the repo's styles folder by its naming, and nothing else there touched
{
  const { execFileSync } = await import('node:child_process');
  const os = await import('node:os');
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'to-code-draft-'));
  try {
    fs.writeFileSync(path.join(repo, 'snapshot.config.json'), JSON.stringify({ paths: { componentStyles: 'styles' }, styles: { naming: { kind: 'class', prefix: 'ds-', part: '__' } } }));
    fs.mkdirSync(path.join(repo, 'styles'));
    fs.writeFileSync(path.join(repo, 'styles', 'kept.css'), '/* by hand */\n');
    const draft = { component: 'Fresh tag', props: {}, anatomy: { root: { kind: 'container', order: 0, layout: { direction: 'row', gap: 4 } } }, variants: [] };
    fs.writeFileSync(path.join(repo, 'draft.json'), JSON.stringify(draft));
    execFileSync(process.execPath, [new URL('./to-code.mjs', import.meta.url).pathname, '--repo', repo, '--contract', path.join(repo, 'draft.json')], { stdio: 'pipe' });
    const css = fs.readFileSync(path.join(repo, 'styles', 'fresh-tag.css'), 'utf8');
    ok('a contract not stored yet is generated on its own, named as the store would name its folder', /\.ds-fresh-tag/.test(css) && fs.existsSync(path.join(repo, 'styles', 'kept.css')));
    const run = (...a) => { try { execFileSync(process.execPath, [new URL('./to-code.mjs', import.meta.url).pathname, '--repo', repo, ...a], { stdio: 'pipe' }); return 0; } catch (e) { return e.status; } };
    ok('its sheet says it is a draft\'s, so no check holds it as generated', !css.includes("Do not edit") && /from a draft contract/.test(css));
    run('--contract', path.join(repo, 'draft.json'), '--platform', 'web');
    ok('a library routed with a platform names it as the store does', fs.existsSync(path.join(repo, 'styles', 'web-fresh-tag.css')));
    fs.writeFileSync(path.join(repo, 'styles', 'kept.css'), '/* by hand */\n');
    fs.writeFileSync(path.join(repo, 'draft.json'), JSON.stringify({ ...draft, component: 'Kept' }));
    ok('a draft never replaces a sheet it did not write', run('--contract', path.join(repo, 'draft.json')) === 1 && fs.readFileSync(path.join(repo, 'styles', 'kept.css'), 'utf8') === '/* by hand */\n');
  } finally { fs.rmSync(repo, { recursive: true, force: true }); }
}

/* The states and the disabled axis are read through the settings (§C F), never by the house's words. */
{
  const own = { ...HOUSE, pseudoClasses: { Hovered: ':hover', Pressed: ':active' }, disabledAxis: 'Inactive' };
  const lib = { ...chip, props: { state: { type: 'enum', values: ['idle', 'hovered', 'pressed'], default: 'idle', role: 'interaction', pointer: ['hovered', 'pressed'] }, inactive: { type: 'boolean', default: false, axis: true } },
    variants: [{ when: {}, set: { 'root.background': 'C/rest' } }, { when: { state: 'pressed' }, set: { 'root.background': 'C/press' } }, { when: { inactive: true }, set: { 'root.opacity': 'State/Disabled/opacity' } }] };
  ok('a library that names its states its own way is drawn by the pseudo-classes its settings give them', /:active/.test(condition(lib, namer('chip'), 'state', 'pressed', own)) && /:hover/.test(condition(lib, namer('chip'), 'state', 'idle', own)));
  ok('and its disabled axis, by the name its settings give it, is the control\'s disabled', /:disabled/.test(condition(lib, namer('chip'), 'inactive', true, own)) && !/:disabled/.test(condition(lib, namer('chip'), 'inactive', true, HOUSE)));
  ok('a state the settings give no pseudo-class is none: no house word stands in', !/:hover/.test(condition(lib, namer('chip'), 'state', 'hovered', { ...own, pseudoClasses: {} })));
}

// a gap below 0 (rules.mjs): CSS has none, so every child after the first pulls back, the first in the flow and a
// placed part set back to 0; a variant whose gap is not below 0 says 0 for the pull, never keeps the base's
{
  const box = { kind: 'container', layout: { direction: 'row', gap: -8, align: 'start', crossAlign: 'start' } };
  const c = { contract: 1, component: 'Stack', props: { loose: { type: 'boolean', default: false } }, anatomy: { root: box, dot: { kind: 'container', parent: 'root', order: 0, position: 'absolute', absolute: { x: 0, y: 0 }, width: 4, height: 4 }, a: { kind: 'container', parent: 'root', order: 1, width: 8, height: 8 }, b: { kind: 'container', parent: 'root', order: 2, width: 8, height: 8 } }, variants: [{ when: { loose: true }, set: { 'root.layout': { ...box.layout, gap: 8 } } }] };
  const sheet = toCss(c, 'stack');
  ok('a gap below 0 is no gap: every child after the first in the flow pulls back by it, on its own rule', !/gap: -/.test(sheet) && /\.stack > \.stack__b \{[^}]*margin-inline-start: -0\.5rem/.test(sheet));
  ok('the first in the flow and a placed part say 0', /\.stack > \.stack__a \{[^}]*margin-inline-start: 0;/.test(sheet) && /\.stack > \.stack__dot \{[^}]*margin-inline-start: 0;/.test(sheet));
  ok('a variant back to a gap of 0 or more says 0 for the pull, never unset, and replays the same', /data-loose[^{]*> \.stack__b \{\s*margin-inline-start: 0;/.test(sheet) && !/unset/.test(sheet) && selfCheck(c).length === 0);
}

// a placed icon whose insides are its component's (derive drops them) takes its glyph's colour from that component
// at the instance's props, per variant, as an opened one's recorded glyph gives it
{
  const spin = { contract: 1, component: 'Spinner', props: { inverse: { type: 'boolean', default: false, axis: true, figma: 'Inverse' } },
    anatomy: { root: { kind: 'container' }, spinner: { kind: 'graphic', parent: 'root', background: 'C/medium' } },
    variants: [{ when: { inverse: true }, set: { 'spinner.background': 'C/inverse' } }] };
  const btn = { contract: 1, component: 'Button', props: { loud: { type: 'boolean', default: false, axis: true, figma: 'Loud' } },
    anatomy: { root: { kind: 'container', background: 'C/bg' }, spinner: { kind: 'instance', parent: 'root', component: 'Spinner', with: { Inverse: 'False' } } },
    variants: [{ when: { loud: true }, set: { 'spinner.with': { Inverse: 'True' } } }] };
  const mains = (n) => (n === 'Spinner' ? spin : null);
  const sheet = toCss(btn, 'button', { naming: { kind: 'class', prefix: 'ds-', part: '__' }, mains });
  ok('an instance with no recorded glyph draws in its component\'s glyph colour at its props, each variant its own',
    /> \.ds-button__spinner \{[^}]*color: var\(--c-medium\)/.test(sheet) && /data-loud[^{]*> \.ds-button__spinner \{[^}]*color: var\(--c-inverse\)/.test(sheet) && selfCheck(btn, undefined, mains).length === 0);
  ok('without the library, no colour is guessed', !/color:/.test(toCss(btn, 'button', { naming: { kind: 'class', prefix: 'ds-', part: '__' } })));
}

// an instance of a component the store does not hold (an icon of another library: Carbon's checkbox draws its Checkbox
// icon with a focus stroke): no sheet of its own draws its box, so its stroke and corners are written here, placed
// directly or inside a placed component the store holds; with no store given, nothing is taken to be missing
{
  const note = { contract: 1, component: 'Note', props: {}, anatomy: { root: { kind: 'container' }, warn: { kind: 'instance', parent: 'root', component: 'Warn', key: 'aa11', width: 16, height: 16 } }, variants: [] };
  const box = { contract: 1, component: 'Box', props: { state: { type: 'enum', values: ['rest', 'focus'], default: 'rest', figma: 'State', role: 'interaction', pointer: ['focus'] } },
    anatomy: { root: { kind: 'container' }, check: { kind: 'instance', parent: 'root', component: 'Check', key: 'bb22', width: 20, height: 20 }, note: { kind: 'instance', parent: 'root', component: 'Note', key: 'cc33' } },
    variants: [{ when: { state: 'focus' }, set: { 'check.border': { color: 'Focus/focus', align: 'center', width: 2 }, 'check.radius': 4 }, add: { 'note/warn': { kind: 'instance', parent: 'note', component: 'Warn', key: 'aa11', width: 16, height: 16, border: { color: 'C/clear', width: 1 } } } }] };
  const mains = (n) => (n === 'Note' ? note : null);
  const sheet = toCss(box, 'box', { naming: { kind: 'class', prefix: 'ds-', part: '__' }, mains });
  ok('an instance the store does not hold draws its own stroke and corners, placed directly or inside a held one',
    /focus-visible[^{]*> \.ds-box__check \{[^}]*border-radius: 4px;[^}]*outline: 2px solid var\(--focus-focus\);/.test(sheet) && /focus-visible[^{]*> \.ds-box__note > \.ds-note__warn \{[^}]*box-shadow: inset 0 0 0 1px var\(--c-clear\);/.test(sheet)
    && selfCheck(box, rulesOf(box, mains).rules, mains).length === 0 && !/key on/.test(sheet));
  ok('with no store given, a placed instance is given only its place', !/outline|box-shadow|border-radius/.test(toCss(box, 'box', { naming: { kind: 'class', prefix: 'ds-', part: '__' } })));
}

// an icon placed inside a placed component, which a variant recolours there (Carbon's disabled Toggletip icon): the
// instance differs from the component's part only in its glyph's colour, and that colour is written on the part
{
  const tip = { contract: 1, component: 'Tip', props: {}, anatomy: { root: { kind: 'container' }, info: { kind: 'instance', parent: 'root', component: 'Info', width: 16, height: 16 }, 'info/vector': { kind: 'graphic', parent: 'info', background: 'C/secondary' } }, variants: [] };
  const field = { contract: 1, component: 'Field', props: { off: { type: 'boolean', default: false, axis: true, figma: 'Disabled' } },
    anatomy: { root: { kind: 'container' }, tip: { kind: 'instance', parent: 'root', component: 'Tip' } },
    variants: [{ when: { off: true }, add: { 'tip/info': { kind: 'instance', parent: 'tip', component: 'Info', width: 16, height: 16 }, 'tip/info/vector': { kind: 'graphic', parent: 'tip/info', background: 'C/disabled' } } }] };
  const mains = (n) => (n === 'Tip' ? tip : null);
  const sheet = toCss(field, 'field', { naming: { kind: 'class', prefix: 'ds-', part: '__' }, mains });
  ok('a placed icon recoloured inside a placed component takes the colour on that component\'s part',
    /data-off[^{]*> \.ds-field__tip > \.ds-tip__info \{\s*color: var\(--c-disabled\);\s*\}/.test(sheet) && selfCheck(field, rulesOf(field, mains).rules, mains).length === 0);
  // an inner icon recorded with none of its glyph (it differs in size only) draws in the colour the placed component
  // gives it, never its own component's (Info's C/primary, where Tip recolours it C/secondary)
  const info = { contract: 1, component: 'Info', props: {}, anatomy: { root: { kind: 'container' }, vector: { kind: 'graphic', parent: 'root', background: 'C/primary' } }, variants: [] };
  const mains2 = (n) => (n === 'Tip' ? tip : n === 'Info' ? info : null);
  const sized = { ...field, variants: [{ when: { off: true }, add: { 'tip/info': { kind: 'instance', parent: 'tip', component: 'Info', width: 20, height: 20 } } }] };
  const ss = toCss(sized, 'field', { naming: { kind: 'class', prefix: 'ds-', part: '__' }, mains: mains2 });
  ok('an inner icon recorded without its glyph takes no colour of its own component\'s over the placed one\'s', !/c-primary/.test(ss) && selfCheck(sized, rulesOf(sized, mains2).rules, mains2).length === 0);
  // recoloured at the defaults: elsewhere it goes back to the placed component's own colour, never unset (inherited)
  const atBase = { ...field, props: { on: { type: 'boolean', default: true, axis: true, figma: 'Enabled' } }, variants: [{ when: { on: true }, add: field.variants[0].add }] };
  const bs = toCss(atBase, 'field', { naming: { kind: 'class', prefix: 'ds-', part: '__' }, mains });
  ok('an inner recolour at the defaults goes back to the placed component\'s colour elsewhere, not unset',
    /> \.ds-tip__info \{\s*color: var\(--c-disabled\);/.test(bs) && /data-on="false"[^{]*> \.ds-tip__info \{\s*color: var\(--c-secondary\);/.test(bs) && !/unset/.test(bs) && selfCheck(atBase, rulesOf(atBase, mains).rules, mains).length === 0);
  // and back to the colour the placed component gives at this combination's own props (Tip's Danger tone), not its defaults' (review)
  const toned = { ...tip, props: { tone: { type: 'enum', values: ['Neutral', 'Danger'], default: 'Neutral', axis: true, figma: 'Tone' } }, variants: [{ when: { tone: 'Danger' }, set: { 'info/vector.background': 'C/danger' } }] };
  const mainsT = (n) => (n === 'Tip' ? toned : null);
  const loud = { ...atBase, props: { ...atBase.props, loud: { type: 'boolean', default: false, axis: true, figma: 'Loud' } }, variants: [...atBase.variants, { when: { loud: true }, set: { 'tip.with': { Tone: 'Danger' } } }] };
  const ls = toCss(loud, 'field', { naming: { kind: 'class', prefix: 'ds-', part: '__' }, mains: mainsT });
  ok('a recolour that stops holding goes back to the placed component\'s colour at the combination\'s own props',
    /data-on="false"\]\):where\(\[data-loud\]:not\(\[data-loud="false"\]\)\) > \.ds-field__tip > \.ds-tip__info \{\s*color: var\(--c-danger\);/.test(ls));
  // recorded in the placed component's own colour: nothing to write
  const same = { ...field, variants: [{ when: { off: true }, add: { 'tip/info': field.variants[0].add['tip/info'], 'tip/info/vector': { kind: 'graphic', parent: 'tip/info', background: 'C/secondary' } } }] };
  ok('an inner icon in the placed component\'s own colour gets no rule', !/ds-tip__info/.test(toCss(same, 'field', { naming: { kind: 'class', prefix: 'ds-', part: '__' }, mains }).split('@layer')[1]));
}

// an override inside a placed component is written on that component's own part, through the instance, and only what
// differs from the component at the instance's props; a layer it has under no such name is said, not guessed
{
  const tag = { contract: 1, component: 'Tag', props: {}, anatomy: { root: { kind: 'container' }, text: { kind: 'text', parent: 'root', color: 'C/strong', typography: 'Label/sm' } }, variants: [] };
  const card = { contract: 1, component: 'Card', props: {}, anatomy: { root: { kind: 'container' }, tag: { kind: 'instance', parent: 'root', component: 'Tag', with: {} }, 'tag/text': { kind: 'text', parent: 'tag', color: 'C/danger', typography: 'Label/sm' }, 'tag/gone': { kind: 'text', parent: 'tag', color: 'C/x', order: 1 } }, variants: [] };
  const mains = (n) => (n === 'Tag' ? tag : null);
  const sheet = toCss(card, 'card', { naming: { kind: 'class', prefix: 'ds-', part: '__' }, mains });
  ok('an override inside a placed component is its own part\'s, through the instance, only what differs',
    /\.ds-card > \.ds-card__tag > \.ds-tag__text \{\s*color: var\(--c-danger\);\s*\}/.test(sheet) && selfCheck(card, rulesOf(card, mains).rules, mains).length === 0);
  ok('a layer the placed component has under no such name is said', /an override on gone, a layer Tag has under no such name/.test(sheet));
  // a variant where the override is gone says the component's own value, not the base's override
  const loud = { ...card, props: { loud: { type: 'boolean', default: false, axis: true, figma: 'Loud' } }, anatomy: { ...card.anatomy }, variants: [{ when: { loud: true }, set: { 'tag/text.color': 'C/strong' } }] };
  delete loud.anatomy['tag/gone'];
  const ls = toCss(loud, 'card', { naming: { kind: 'class', prefix: 'ds-', part: '__' }, mains });
  ok('an override a variant drops gives the property back to the component\'s value there', /data-loud[^{]*> \.ds-tag__text \{\s*color: var\(--c-strong\);/.test(ls) && selfCheck(loud, rulesOf(loud, mains).rules, mains).length === 0);
  const gone = { ...loud, variants: [{ when: { loud: true }, remove: ['tag/text'] }] };
  ok('an override on a layer a variant drops (drawn as its component) gives the property back there', /data-loud[^{]*> \.ds-tag__text \{\s*color: var\(--c-strong\);/.test(toCss(gone, 'card', { naming: { kind: 'class', prefix: 'ds-', part: '__' }, mains })) && selfCheck(gone, rulesOf(gone, mains).rules, mains).length === 0);
  const two2 = { ...loud, props: { ...loud.props, big: { type: 'boolean', default: false, axis: true, figma: 'Big' } }, variants: [{ when: { loud: true }, set: { 'tag/text.color': 'C/x' } }, { when: { loud: true, big: true }, remove: ['tag/text'] }] };
  const t2 = toCss(two2, 'card', { naming: { kind: 'class', prefix: 'ds-', part: '__' }, mains });
  ok('what a variant rule gave a layer a later combination drops goes back to the component\'s own; nowhere else is it restated', selfCheck(two2, rulesOf(two2, mains).rules, mains).length === 0 && /data-big[^{]*> \.ds-tag__text \{\s*color: var\(--c-strong\);\s*\}/.test(t2) && (t2.match(/\.ds-tag__text \{/g) || []).length === 3);
  // what the component declares that the instance does not is unset
  const bare = { ...card, anatomy: { root: card.anatomy.root, tag: card.anatomy.tag, 'tag/text': { kind: 'text', parent: 'tag', color: 'C/strong' } } };
  ok('a declaration the instance takes away is unset', /\.ds-tag__text \{[^}]*font[\w-]*: unset;/.test(toCss(bare, 'card', { naming: { kind: 'class', prefix: 'ds-', part: '__' }, mains })));
  // an override inside one of several copies is said, never written on every copy
  const two = { ...card, anatomy: { root: card.anatomy.root, tag: card.anatomy.tag, 'tag/text': card.anatomy['tag/text'], tag_2: { ...card.anatomy.tag, order: 1 } } };
  const ts = toCss(two, 'card', { naming: { kind: 'class', prefix: 'ds-', part: '__' }, mains });
  ok('an override inside one of several copies is said, not written on all', !/\.ds-tag__text/.test(ts.split('@layer')[1]) && /inside one of several copies of Tag/.test(ts));
}

// fills as CSS's background layers (rules.mjs fillCss): Figma's bottom-up list top first, a colour above another layer a
// gradient of itself, an image the project's --image; a linear gradient by its transform (parity's formula)
{
  const tk = (x) => `var(--${x.toLowerCase().replace(/\W+/g, '-')})`;
  ok('stacked fills are background layers, top first, the bottom one a bare colour, an image the project\'s --image between',
    /^linear-gradient\(rgb\(0 0 0 \/ 0\.5\), rgb\(0 0 0 \/ 0\.5\)\), var\(--image, url\([^)]+\)\) center \/ cover no-repeat, var\(--c-soft\)$/.test(fillCss(['C/soft', 'IMAGE:FILL', 'rgb(0 0 0 / 0.5)'], {}, (f) => (f.startsWith('rgb') ? f : tk(f))).value));
  ok('and back: an image layer is Figma\'s image fill by how it is sized', JSON.stringify(fillsFromCss('rgb(1, 2, 3)', 'url("a"), url("b")', {}, undefined, { size: 'contain, cover', repeat: 'no-repeat' }).fills) === '["rgb(1, 2, 3)","IMAGE:FILL","IMAGE:FIT"]');
  const g = (t) => ({ type: 'GRADIENT_LINEAR', transform: t, stops: [{ position: 0, color: 'A' }, { position: 1, color: 'B' }] });
  ok('a top-to-bottom gradient is 180deg on any box', fillCss([g([[0, 1, 0], [-1, 0, 1]])], {}, tk).value === 'linear-gradient(180deg, var(--a) 0%, var(--b) 100%)');
  ok('a corner-to-corner one is a corner keyword, the same on any box', fillCss([g([[0.5, -0.5, 0.5], [0.5, 0.5, 0]])], {}, tk).value === 'linear-gradient(to top right, var(--a) 0%, var(--b) 100%)');
  ok('another diagonal takes its angle on the box drawn', /^linear-gradient\(\d/.test(fillCss([g([[1, 0.5, 0], [0, 1, 0]])], { w: 200, h: 100 }, tk).value || ''));
  const hug = fillCss([g([[1, 0.5, 0], [0, 1, 0]])], { w: 'hug', h: 40 }, tk);
  ok('and on a box its content sizes it is not said, and says why', hug.value === undefined && /not a fixed number/.test(hug.unread[0]) && fillCss(['GRADIENT_RADIAL'], {}, tk).value === undefined);
}

// and back (rules.mjs fillsFromCss, from-code's reader): what fillCss wrote comes back as the fills it was written from
{
  const id = (x) => x;
  const G = (t, st) => ({ type: 'GRADIENT_LINEAR', angle: Math.round(((Math.atan2(t[0][1], t[0][0]) * 180) / Math.PI + 90 + 360) % 360), transform: t, stops: st });
  const two = [{ position: 0, color: 'rgb(1, 2, 3)' }, { position: 1, color: 'rgb(4, 5, 6)' }];
  for (const [label, f, box] of [['a corner-to-corner gradient', [G([[0.5, -0.5, 0.5], [0.5, 0.5, 0]], two)], { w: 'hug', h: 186 }],
    ['a top-to-bottom one with a middle stop', [G([[0, 1, 0], [-1, 0, 1]], [two[0], { position: 0.5, color: 'rgb(9, 9, 9)' }, two[1]])], {}]]) {
    const css = fillCss(f, box, id).value;
    ok(`${label} comes back from its CSS as Figma recorded it`, JSON.stringify(fillsFromCss('', css, box).fills) === JSON.stringify(f));
  }
  ok('a stop the browser gives no position sits where CSS puts it; a hint, a turn, stripes, a stop past the ends and one placed by a length are left unread, never drawn wrong',
    JSON.stringify(fillsFromCss('', 'linear-gradient(rgb(255, 0, 0), rgb(255, 255, 255), rgb(0, 0, 255))', {}).fills[0].stops.map((st) => st.position)) === '[0,0.5,1]'
    && ['linear-gradient(rgb(255, 0, 0), 30%, rgb(0, 0, 255))', 'linear-gradient(0.25turn, rgb(1, 1, 1), rgb(2, 2, 2))', 'repeating-linear-gradient(rgb(1, 1, 1) 0px, rgb(2, 2, 2) 4px)', 'linear-gradient(rgb(1, 1, 1) -20%, rgb(2, 2, 2) 120%)', 'linear-gradient(rgb(1, 1, 1) 0px, rgb(2, 2, 2) 40px)']
      .every((x) => fillsFromCss('', x, {}).fills.length === 0 && fillsFromCss('', x, {}).unread.length === 1));
  const diag = [G([[0.6, 0.4, 0], [-0.4, 0.6, 0.4]], two)];
  const back = fillsFromCss('', fillCss(diag, { w: 200, h: 100 }, id).value, { w: 200, h: 100 }).fills[0];
  ok('another diagonal comes back on the box it was written for, its first row the same within the angle\'s rounding',
    !!back && back.transform[0].every((v, i) => Math.abs(v - [0.6, 0.4, 0][i]) < 2e-3) && JSON.stringify(back.stops) === JSON.stringify(two));
  const stack = fillCss(['rgb(7, 7, 7)', 'rgba(0, 0, 0, 0.5)'], {}, id).value;
  ok('a colour laid over another comes back as two fills, bottom up', JSON.stringify(fillsFromCss('rgb(7, 7, 7)', stack.replace(/, rgb\(7, 7, 7\)$/, ''), {}).fills) === JSON.stringify(['rgb(7, 7, 7)', 'rgba(0, 0, 0, 0.5)']));
}

// a text field draws none of the browser's own face: the contract states its border, padding and background
{ const { BASE } = await import('./to-code.mjs');
  const rule = (BASE.match(/input:not\(\[type=checkbox\], \[type=radio\]\), textarea \{[^}]*\}/) || [''])[0];
  ok('the base sheet takes a text field\'s own border, padding and background away, leaves a checkbox or radio its mark, and keeps the focus outline', /border: 0/.test(rule) && /padding: 0/.test(rule) && /background: none/.test(rule) && !/outline/.test(rule)); }
{ const { placeFromCss } = await import('./rules.mjs');
  const p = placeFromCss({ position: 'absolute', 'inset-block-start': 'unset', 'inset-block-end': '0px', 'inset-inline-start': '0px' });
  ok('an inset a variant sets to unset is no pin: the part is pinned by the other edge', p && p.constraints && p.constraints.vertical === 'max'); }
ok('a root with no auto layout is a box: a custom element is inline and 0 wide', decl({ kind: 'container', width: 40, height: 40 }, { root: true }).display === 'block');
ok('a placed component that hugs keeps its own size against its main\'s sheet', decl({ kind: 'instance', width: 'hug' }, { row: true })['inline-size'] === 'fit-content' && decl({ kind: 'instance', width: 'hug' }, { row: true }).flex === 'none');
// (a list's item that hugs down, its main fixed at 56 at those props: Figma's instance hugs what it holds, so the main's
// own block size gives way, as its width does)
ok('a placed component that hugs down keeps its own height against its main\'s sheet', decl({ kind: 'instance', height: 'hug' }, { row: false })['block-size'] === 'fit-content' && decl({ kind: 'instance', height: 'hug' }, { row: false }).flex === 'none' && !('flex' in decl({ kind: 'instance', height: 'hug' }, { row: true })));
ok('a placed component stretched by its insets takes no size from its main', decl({ kind: 'instance', width: 200, absolute: { x: 0, y: 0, end: 0 }, constraints: { horizontal: 'stretch', vertical: 'min' } }, {})['inline-size'] === 'auto');
// an arc (Figma's ArcData: 0 at the x axis, clockwise) as a mask: a conic sweep 90° on from CSS's top, a hollow one cut by a radial
{ const ring = declarations({ kind: 'graphic', shape: 'ellipse', arc: { start: 270, end: 0, inner: 0.75 } }, {}, names), pie = decl({ kind: 'graphic', shape: 'ellipse', arc: { start: 270, end: 90, inner: 0 } });
  const R = Object.fromEntries(ring.decls.map(([p, v]) => [p, v]));
  ok('an arc is a conic mask from Figma\'s start, a ring cut at its inner ratio, and nothing left unread',
    R.mask === 'conic-gradient(from 0deg, #000 90deg, #0000 0), radial-gradient(closest-side, #0000 75%, #000 75%)' && R['mask-composite'] === 'intersect'
    && !ring.unread.some((f) => /arc/.test(f)) && pie.mask === 'conic-gradient(from 0deg, #000 180deg, #0000 0)' && !('mask-composite' in pie)); }
// a dashed stroke all round: an outline dashed, pulled in by an inside stroke's width; on some sides, named, not dropped
{ const d = declarations({ kind: 'container', border: { color: 'C/s', width: 1, dash: [2, 2] } }, {}, names), D = Object.fromEntries(d.decls.map(([p, v]) => [p, v]));
  const side = declarations({ kind: 'container', border: { color: 'C/s', width: [1, 0, 0, 0], dash: [2, 2] } }, {}, names);
  ok('a dashed stroke all round is a dashed outline where the stroke stands; on some sides it is named as unread',
    /dashed/.test(D.outline) && /^calc\(-1 \* /.test(D['outline-offset']) && !('box-shadow' in D) && side.unread.some((f) => /dash/.test(f))
    && /dashed/.test(Object.fromEntries(declarations({ kind: 'container', border: { color: 'C/s', width: 1, dash: 'dashed' } }, {}, names).decls).outline)
    // (one that takes room in the layout is a dashed border: it keeps its room, and nothing is unread)
    && (() => { const L = declarations({ kind: 'container', border: { color: 'C/s', width: 1, dash: [2, 2], inLayout: true } }, {}, names); const M = Object.fromEntries(L.decls);
      return /1px dashed/.test(M['border-top']) && !('outline' in M) && !L.unread.some((f) => /dash/.test(f)); })()); }
// a focus ring on a box whose own stroke is a dashed outline: drawn by a box of its own, so the dash stays at focus
{ const dc = { contract: 1, component: 'Drop', props: { state: { type: 'enum', values: ['rest', 'focus'], default: 'rest', role: 'interaction', pointer: ['focus'] } },
    anatomy: { root: { kind: 'container', radius: 8, border: { color: 'C/s', width: 1, dash: [2, 2] } } },
    variants: [{ when: { state: 'focus' }, add: { focusRing: { kind: 'graphic', shape: 'rectangle', parent: 'root', position: 'absolute', absolute: { x: -2, y: -2, end: -2, bottom: -2 }, constraints: { horizontal: 'stretch', vertical: 'stretch' }, border: { color: 'C/f', width: 2, align: 'inside' }, radius: 8 } } }] };
  const css = toCss(dc, 'drop', { naming: { kind: 'class', prefix: 'ds-', part: '__' } });
  ok('a ring on a box with a dashed stroke is drawn by a box of its own; the box keeps its dash and its own outline', /::after \{[^}]*border-radius: inherit;[^}]*outline: /.test(css) && !/:focus-visible[^{]*\{[^}]*outline: none/.test(css) && /outline: 1px dashed/.test(css)); }
{ const c = { contract: 1, component: 'Pick', props: { state: { type: 'enum', values: ['rest', 'focus'], default: 'rest', role: 'interaction', pointer: ['focus'] } },
    anatomy: { root: { kind: 'container', layout: { direction: 'row' } }, down: { kind: 'container', parent: 'root', width: 20, height: 20, order: 0 }, 'down/dot': { kind: 'container', parent: 'down', width: 4, height: 4 } },
    variants: [{ when: { state: 'focus' }, remove: ['down', 'down/dot'], add: { up: { kind: 'container', parent: 'root', width: 20, height: 20, order: 0 } } }] };
  const css = toCss(c, 'pick');
  const lg = { ...c, props: { ...c.props, size: { type: 'enum', values: ['md', 'lg'], default: 'md' } }, variants: [...c.variants, { when: { size: 'lg' }, set: { 'down.layout': { direction: 'row' } } }] };
  ok('and stays hidden where a rule of the same weight gives the part a display of its own (a layout at a size)', selfCheck(lg, rulesOf(lg).rules).length === 0);
  ok('a part a pointer state takes away is hidden by the sheet at that state, its insides with it, once',
    /:focus-visible[^{]*> \.pick__down \{[^}]*display: none/.test(css) && !/pick__dot \{[^}]*display: none/.test(css) && (css.match(/display: none/g) || []).length === 1); }
// a part the rest of the grid draws that a pointer state also puts in (a tile's border, framed or hovered): the markup
// holds it, so the sheet hides it where the contract draws none and shows it at the pointer state (carbon tile, 2026-11-21)
{ const border = { kind: 'graphic', shape: 'rectangle', parent: 'root', position: 'absolute', absolute: { x: 0, y: 0, end: 0, bottom: 0 }, constraints: { horizontal: 'stretch', vertical: 'stretch' }, border: { color: 'C/s', width: 1 } };
  const c = { contract: 1, component: 'Tile', props: { kind: { type: 'enum', values: ['plain', 'framed'], default: 'plain' }, state: { type: 'enum', values: ['rest', 'hover'], default: 'rest', role: 'interaction', pointer: ['hover'] } },
    anatomy: { root: { kind: 'container', layout: { direction: 'row' } }, label: { kind: 'text', parent: 'root', content: 'Tile' } },
    variants: [{ when: { kind: 'framed' }, add: { border } }, { when: { state: 'hover' }, add: { border } }] };
  const css = toCss(c, 'tile', { naming: { kind: 'class', prefix: 'ds-', part: '__' } });
  ok('a part a pointer state also puts in is hidden by the sheet where the contract draws none, shown at that state',
    /\.ds-tile:where\(:is\(\[data-kind="plain"\], :not\(\[data-kind\]\)\)\):where\([^{]*:not\(:hover\)[^{]*\) > \.ds-tile__border \{\s*display: none;\s*\}/.test(css)
    // (hidden by a rule naming its whole combination alone, so no rule shows it again: nothing to undo a display with)
    && (css.match(/display: /g) || []).length === 2 && selfCheck(c, rulesOf(c).rules).length === 0);
  // (a placed component is hidden the same way, and never shown again by a display of this sheet's: its own sheet's holds,
  // whatever its props make it; carbon dropdown's read-only tag, whose content read as filling under display: unset)
  const tag = { contract: 1, component: 'Tag', props: {}, anatomy: { root: { kind: 'container', layout: { direction: 'row' } } }, variants: [] };
  const held = { ...c, variants: [{ when: { kind: 'framed' }, add: { tag: { kind: 'instance', parent: 'root', component: 'Tag' } } }, { when: { state: 'hover' }, add: { tag: { kind: 'instance', parent: 'root', component: 'Tag' } } }] };
  const hm = (n) => (n === 'Tag' ? tag : null), hc = toCss(held, 'tile', { naming: { kind: 'class', prefix: 'ds-', part: '__' }, mains: hm });
  ok('a placed component a pointer state also puts in is hidden where the contract draws none and its own display left alone', /__tag \{\s*display: none;\s*\}/.test(hc) && !/__tag \{[^}]*display: (?!none)/.test(hc) && selfCheck(held, rulesOf(held, hm).rules, hm).length === 0);
  // (a pseudo part, `::`, is no element the markup holds: never hidden this way)
  const ps = { ...c, variants: [{ when: { kind: 'framed' }, add: { 'label::after': { kind: 'graphic', parent: 'label' } } }, { when: { state: 'hover' }, add: { 'label::after': { kind: 'graphic', parent: 'label' } } }] };
  ok('a pseudo part a pointer state also puts in is not hidden by display', !/::after \{\s*display: none/.test(toCss(ps, 'tile', { naming: { kind: 'class', prefix: 'ds-', part: '__' } }))); }
  // (one a pointer state draws as a ring, focus's outline on the box it rings, stays that outline: no element held for it
  // there, none hidden; carbon dropdown, whose focus border came back as a second ring)
  const ringAdd = { contract: 1, component: 'Pick', props: { open: { type: 'boolean', default: false }, state: { type: 'enum', values: ['rest', 'focus'], default: 'rest', role: 'interaction', pointer: ['focus'] } },
    anatomy: { root: { kind: 'container', radius: 8 } },
    variants: ['open', 'state'].map((k) => { const fb = { kind: 'graphic', shape: 'rectangle', parent: 'root', position: 'absolute', absolute: { x: -2, y: -2, end: -2, bottom: -2 }, constraints: { horizontal: 'stretch', vertical: 'stretch' }, border: { color: 'C/f', width: 2, align: 'inside' }, radius: 8 }; return { when: { [k]: k === 'open' ? true : 'focus' }, add: { focusBorder: fb } }; }) };
  const rc = toCss(ringAdd, 'pick', { naming: { kind: 'class', prefix: 'ds-', part: '__' } });
  ok('a part a pointer state draws as a ring stays the ring there, never held and hidden', !/\.ds-pick > \.ds-pick__focus-border \{\s*display: none/.test(rc) && /:focus-visible[^{]*\) \{\s*outline: /.test(rc));
{
  const c = { component: 'Sheet', props: {}, anatomy: { root: { kind: 'container', layout: { direction: 'column' } },
    body: { kind: 'slot', parent: 'root', layout: { direction: 'column' }, width: 'fill', height: 'hug', minHeight: 172, whileEmpty: ['minHeight'] } }, variants: [] };
  const css = toCss(c, 'sheet');
  ok('a size kept only while empty is written for the empty box alone, never as the filled box\'s minimum',
    /sheet__body:not\(:has\(\*\)\) \{[^}]*min-block-size: 10\.75rem/.test(css) && !/sheet__body \{[^}]*min-block-size/.test(css));
}
{
  const c = { component: 'Sheet', props: { size: { type: 'enum', values: ['md', 'lg'], default: 'md', figma: 'Size' } }, anatomy: { root: { kind: 'container', layout: { direction: 'column' } },
    body: { kind: 'slot', parent: 'root', layout: { direction: 'column' }, width: 'fill', height: 'hug', minHeight: 172, whileEmpty: ['minHeight'] },
    'body/sample': { kind: 'container', parent: 'body', layout: { direction: 'column' }, width: 'fill', height: 'hug', minHeight: 200, whileEmpty: ['minHeight'] } },
    variants: [{ when: { size: 'lg' }, set: { 'body.whileEmpty': null, 'body.minHeight': 100, 'body/sample.whileEmpty': null } }] };
  const css = toCss(c, 'sheet');
  ok('a slot\'s sample frame gives its empty size to nothing a caller places', !/> \*:not\(:has\(\*\)\)/.test(css) && !/10\.5rem|12\.5rem/.test(css));
  ok('a combination that sets its own minimum keeps it when empty, never unset', /lg[^{]*sheet__body:not\(:has\(\*\)\) \{[^}]*min-block-size: 6\.25rem/.test(css) && !/min-block-size: unset/.test(css));
}
// an override two placed components deep is the innermost one's part, named level by level; a graphic directly under a
// placed component is its part too (a slider's stop dot, a track's line)
{
  const dot = { contract: 1, component: 'Dot', props: {}, anatomy: { root: { kind: 'container' }, mark: { kind: 'graphic', parent: 'root', background: 'C/soft', width: 4, height: 4 } }, variants: [] };
  const row = { contract: 1, component: 'Row', props: {}, anatomy: { root: { kind: 'container' }, dot: { kind: 'instance', parent: 'root', component: 'Dot', with: {} }, line: { kind: 'graphic', parent: 'root', background: 'C/soft', width: 10, height: 2 } }, variants: [] };
  const bar = { contract: 1, component: 'Bar', props: {}, anatomy: { root: { kind: 'container' }, row: { kind: 'instance', parent: 'root', component: 'Row', with: {} },
    'row/dot': { kind: 'instance', parent: 'row', component: 'Dot', with: {} }, 'row/dot/mark': { kind: 'graphic', parent: 'row/dot', background: 'C/strong', width: 4, height: 4 },
    'row/line': { kind: 'graphic', parent: 'row', background: 'C/strong', width: 10, height: 2 } }, variants: [] };
  const mains = (x) => ({ Dot: dot, Row: row })[x] || null;
  const sheet = toCss(bar, 'bar', { naming: { kind: 'class', prefix: 'ds-', part: '__' }, mains });
  ok('an override two placed components deep is written on the innermost one\'s part, level by level',
    /\.ds-bar > \.ds-bar__row > \.ds-row__dot > \.ds-dot__mark \{[^}]*background: var\(--c-strong\)/.test(sheet));
  // the middle component's own override is the base two deep: set back to the inner's value, it is written (figma-fact:override-back-kept)
  const row2 = { ...row, anatomy: { ...row.anatomy, 'dot/mark': { kind: 'graphic', parent: 'dot', background: 'C/strong', width: 4, height: 4 } } };
  const bar2 = { ...bar, anatomy: { ...bar.anatomy, 'row/dot/mark': { ...bar.anatomy['row/dot/mark'], background: 'C/soft' } } };
  const sheet2 = toCss(bar2, 'bar', { naming: { kind: 'class', prefix: 'ds-', part: '__' }, mains: (x) => ({ Dot: dot, Row: row2 })[x] || null });
  ok('two deep, what the middle component draws there is the base: set back to the inner\'s value, it is written',
    /\.ds-bar > \.ds-bar__row > \.ds-row__dot > \.ds-dot__mark \{[^}]*background: var\(--c-soft\)/.test(sheet2));
  // where a layer sits inside a placed component is the component's: a record that leaves its place out never unsets it
  const pin = { contract: 1, component: 'Pin', props: {}, anatomy: { root: { kind: 'container', width: 16, height: 16 }, mark: { kind: 'graphic', parent: 'root', background: 'C/soft', width: 8, height: 10, constraints: { horizontal: 'scale', vertical: 'scale' }, absolute: { x: 4, y: 3 } } }, variants: [] };
  const note = { contract: 1, component: 'Note', props: {}, anatomy: { root: { kind: 'container' }, pin: { kind: 'instance', parent: 'root', component: 'Pin', with: {} },
    'pin/mark': { kind: 'graphic', parent: 'pin', background: 'C/strong', width: 8, height: 10, constraints: { horizontal: 'scale', vertical: 'scale' } } }, variants: [] };
  const ns = toCss(note, 'note', { naming: { kind: 'class', prefix: 'ds-', part: '__' }, mains: (x) => (x === 'Pin' ? pin : null) });
  const markRule = (ns.match(/\.ds-pin__mark \{[^}]*\}/) || [''])[0];
  ok('a layer\'s place inside a placed component is never unset by a record that leaves it out', /background: var\(--c-strong\)/.test(markRule) && !/position|inset/.test(markRule));
  ok('a graphic directly under a placed component takes its override', /\.ds-bar > \.ds-bar__row > \.ds-row__line \{[^}]*background: var\(--c-strong\)/.test(sheet));
}
// an override set on a placed instance itself (a fill on Carbon's toggle item, per state) is written on the instance,
// against its component's root at its props; where a variant drops it, the component's own value there; a nested
// instance's own override likewise, through its holder
{
  const knob = { contract: 1, component: 'Knob', props: { state: { type: 'enum', values: ['enabled', 'read-only'], default: 'enabled', figmaValues: ['Enabled', 'Read-only'], figma: 'State' } },
    anatomy: { root: { kind: 'container', layout: { direction: 'row', gap: 0, align: 'start', crossAlign: 'start' }, background: 'C/soft', width: 48 } }, variants: [{ when: { state: 'read-only' }, set: { 'root.background': null } }] };
  const sw = { contract: 1, component: 'Switch', props: { on: { type: 'boolean', default: true, axis: true, figma: 'On' }, state: { type: 'enum', values: ['enabled', 'read-only'], default: 'enabled', figmaValues: ['Enabled', 'Read-only'], figma: 'State' } },
    anatomy: { root: { kind: 'container' }, knob: { kind: 'instance', parent: 'root', component: 'Knob', with: { State: 'Enabled' }, width: 48, background: 'C/success', layout: { direction: 'row', gap: 0, align: 'end', crossAlign: 'start' } } },
    variants: [{ when: { on: false }, set: { 'knob.background': 'C/off', 'knob.layout': null } }, { when: { state: 'read-only' }, set: { 'knob.with': { State: 'Read-only' }, 'knob.background': null } }] };
  const mains = (x) => (x === 'Knob' ? knob : null);
  const sheet = toCss(sw, 'switch', { naming: { kind: 'class', prefix: 'ds-', part: '__' }, mains });
  ok('an override on a placed instance itself is written on it: its fill and its layout, only what differs from its component',
    /\.ds-switch > \.ds-switch__knob \{[^}]*justify-content: flex-end;[^}]*background: var\(--c-success\)/.test(sheet) && !/\.ds-switch > \.ds-switch__knob \{[^}]*(gap|flex-direction)/.test(sheet)
    && /data-on="false"[^{]*> \.ds-switch__knob \{[^}]*background: var\(--c-off\)/.test(sheet) && selfCheck(sw, rulesOf(sw, mains).rules, mains).length === 0);
  ok('where a variant drops the instance\'s override, the component\'s own value there (none: unset)', /read-only[^{]*> \.ds-switch__knob \{[^}]*background: unset/.test(sheet));
  // one a variant adds (a small toggle's), where a further combination drops its override: the component's own value, never unset
  const small = { ...sw, props: { ...sw.props, small: { type: 'boolean', default: false, axis: true, figma: 'Small' } }, anatomy: { root: sw.anatomy.root },
    variants: [{ when: { small: true }, add: { knob: sw.anatomy.knob } }, { when: { small: true, on: false }, set: { 'knob.background': 'C/off', 'knob.layout': null } }] };
  const ss = toCss(small, 'switch', { naming: { kind: 'class', prefix: 'ds-', part: '__' }, mains });
  ok('an instance a variant adds, its override dropped further on, goes back to its component\'s own value, never unset',
    /data-on="false"[^{]*> \.ds-switch__knob \{[^}]*justify-content: flex-start/.test(ss) && !/justify-content: unset/.test(ss) && selfCheck(small, rulesOf(small, mains).rules, mains).length === 0);
  // the component's own value where no rule before sets the property otherwise is not written: its own sheet, its
  // pointer states included, holds there (an override only a variant makes leaves the defaults' rule without it)
  const late = { ...sw, anatomy: { root: sw.anatomy.root, knob: { kind: 'instance', parent: 'root', component: 'Knob', with: { State: 'Enabled' }, width: 48 } }, variants: [{ when: { on: false }, set: { 'knob.background': 'C/off' } }] };
  const lt = toCss(late, 'switch', { naming: { kind: 'class', prefix: 'ds-', part: '__' }, mains });
  ok('an override only a variant makes is written there alone: the defaults\' rule restates nothing, so the component\'s own states hold',
    !/\.ds-switch > \.ds-switch__knob \{[^}]*background/.test(lt) && /data-on="false"[^{]*> \.ds-switch__knob \{[^}]*background: var\(--c-off\)/.test(lt) && selfCheck(late, rulesOf(late, mains).rules, mains).length === 0);
  // (a guard, not a fix's case: the old sheet wrote no styling on an instance at all; this holds that the new path needs the library)
  ok('without the library, an instance is placed only', !/background/.test(toCss(sw, 'switch', { naming: { kind: 'class', prefix: 'ds-', part: '__' } }).split('@layer')[1]));
  const rail = { contract: 1, component: 'Rail', props: {}, anatomy: { root: { kind: 'container' }, knob: { kind: 'instance', parent: 'root', component: 'Knob', with: { State: 'Enabled' } } }, variants: [] };
  const slider = { contract: 1, component: 'Slider', props: {}, anatomy: { root: { kind: 'container' }, rail: { kind: 'instance', parent: 'root', component: 'Rail', with: {} }, 'rail/knob': { kind: 'instance', parent: 'rail', component: 'Knob', with: { State: 'Enabled' }, background: 'C/strong' } }, variants: [] };
  const m2 = (x) => ({ Knob: knob, Rail: rail })[x] || null;
  // (a guard against the first version of this fix, which held a nested instance to its holder's record's props)
  const other = { ...slider, anatomy: { ...slider.anatomy, 'rail/knob': { kind: 'instance', parent: 'rail', component: 'Knob', with: { State: 'Read-only' } } } };
  ok('a nested instance at other props, with no styling of its own, is left to its own sheet', !/\.ds-rail__knob \{[^}]*background/.test(toCss(other, 'slider', { naming: { kind: 'class', prefix: 'ds-', part: '__' }, mains: m2 })));
  const quiet = { ...slider, anatomy: { ...slider.anatomy, 'rail/knob': { ...slider.anatomy['rail/knob'], with: { State: 'Read-only' } } }, props: { quiet: { type: 'boolean', default: false, axis: true, figma: 'Quiet' } }, variants: [{ when: { quiet: true }, set: { 'rail/knob.background': null } }] };
  const qs = toCss(quiet, 'slider', { naming: { kind: 'class', prefix: 'ds-', part: '__' }, mains: m2 });
  ok('a nested override a variant takes away, where neither the instance nor its component draws one there, is unset',
    /data-quiet[^{]*> \.ds-rail__knob \{[^}]*background: unset/.test(qs) && selfCheck(quiet, rulesOf(quiet, m2).rules, m2).length === 0);
  ok('a nested instance\'s own override is written through its holder', /\.ds-slider > \.ds-slider__rail > \.ds-rail__knob \{[^}]*background: var\(--c-strong\)/.test(toCss(slider, 'slider', { naming: { kind: 'class', prefix: 'ds-', part: '__' }, mains: m2 })));
}
// a part scaled with a parent that is stretched between its own parent's edges takes its share of that parent's size, the
// grandparent's less both offsets (Carbon's skeleton shimmer, scaled inside a fill stretched over the box)
{
  const sk = { contract: 1, component: 'Skel', props: {}, anatomy: { root: { kind: 'container', width: 160, height: 16, overflow: 'hidden' },
    fill: { kind: 'container', parent: 'root', background: 'C/soft', position: 'absolute', absolute: { x: 0, y: 0, end: 0, bottom: 0 }, constraints: { horizontal: 'stretch', vertical: 'stretch' } },
    'fill/shine': { kind: 'graphic', parent: 'fill', background: 'C/strong', width: 160, height: 16, position: 'absolute', absolute: { x: -160, y: 0 }, constraints: { horizontal: 'scale', vertical: 'scale' } } }, variants: [] };
  const css = toCss(sk, 'skel', { naming: { kind: 'class', prefix: 'ds-', part: '__' } });
  const rule = (css.match(/\.ds-skel__shine \{[^}]*\}/) || [''])[0];
  ok('a part scaled in a stretched parent is a share of that parent\'s size: the grandparent\'s less both offsets',
    /inset-inline-start: -100%/.test(rule) && /inline-size: 100%/.test(rule) && /inset-block-start: 0%/.test(rule) && /block-size: 100%/.test(rule) && !/is no number/.test(css));
}
// and a part centred in such a parent keeps its centre's distance from that parent's, as with a parent of a number's size
{
  const ct = { contract: 1, component: 'Ctr', props: {}, anatomy: { root: { kind: 'container', width: 160, height: 16 },
    fill: { kind: 'container', parent: 'root', position: 'absolute', absolute: { x: 0, y: 0, end: 0, bottom: 0 }, constraints: { horizontal: 'stretch', vertical: 'stretch' } },
    'fill/dot': { kind: 'graphic', parent: 'fill', background: 'C/strong', width: 8, height: 8, position: 'absolute', absolute: { x: 12, y: 4 }, constraints: { horizontal: 'center', vertical: 'center' } } }, variants: [] };
  const rule = (toCss(ct, 'ctr', { naming: { kind: 'class', prefix: 'ds-', part: '__' } }).match(/\.ds-ctr__dot \{[^}]*\}/) || [''])[0];
  ok('a part centred in a stretched parent keeps its centre\'s distance from that parent\'s (its size the grandparent\'s less both offsets)',
    /inset-inline-start: calc\(50% - 4rem\)/.test(rule) && /inset-block-start: 50%;/.test(rule));
}
console.log(`${n} passed`);
