#!/usr/bin/env node
// tools/component-contract/to-code.mjs and css.mjs: a contract as the stylesheet that rebuilds every variant.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { toCss, rulesOf, selfCheck, namer, condition, controlOf, HOUSE } from './to-code.mjs';
import { declarations } from './css.mjs';

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
ok('a literal carries its reason (code-standard rule 22)', lit[2] === 'no token in the design');
ok('a radius stays px, a length goes rem (code-standard rule 54)', decl({ radius: 6 })['border-radius'] === '6px' && decl({ width: 8 })['inline-size'] === '0.5rem');
ok('an inside stroke out of layout is an inset ring; in layout, a border per side; outside, an outline taking no room (rule 63)',
  decl({ border: { color: 'C/line', width: 'Stroke/1' } })['box-shadow'] === 'inset 0 0 0 var(--stroke-1) var(--c-line)'
  && decl({ border: { color: 'C/line', width: [0, 0, 'Stroke/1', 0], sides: { top: 0, end: 0, bottom: 1, start: 0 }, inLayout: true } })['border-bottom'] === 'var(--stroke-1) solid var(--c-line)'
  && decl({ border: { color: 'C/line', width: 2, align: 'outside' } }).outline === '2px solid var(--c-line)');
ok('one inside edge is one inset shadow shifted from that edge, beside the effect style', decl({ border: { color: 'C/line', width: [0, 0, 1, 0], sides: { bottom: 1 } }, shadow: 'Elevation/Raised' })['box-shadow'] === 'inset 0 -1px 0 0 var(--c-line), var(--elevation-raised)');
const centred = decl({ position: 'absolute', absolute: { x: 0, y: 0 }, constraints: { horizontal: 'center', vertical: 'center' } });
ok('a part centred out of the flow is pinned at the middle and moved back by half its size', centred['inset-inline-start'] === '50%' && centred.translate === '-50% -50%');
ok('a box holding a part out of the flow is its containing block', decl({}, { anchors: true }).position === 'relative');
const { unread } = declarations({ smoothing: 0.6, background: 'IMAGE:FILL', mystery: 1, parent: 'root', order: 2 }, {}, names);
ok('what CSS cannot say is named, the markup\'s own fields are not', unread.some((f) => /smoothing/.test(f)) && unread.some((f) => /image/.test(f)) && unread.includes('mystery') && !unread.includes('parent') && !unread.includes('order'));

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
// the disabled dim on the root reads the dim knob, so a holder that dims sets it to 1 and its parts dim once (code-standard rule 62)
const dimmed = toCss(chip, 'chip', { naming: { kind: 'class', prefix: 'ds-', part: '__' } });
ok('the disabled dim on the root reads the dim knob first, and sets it on what the root holds', /opacity: var\(--ds-dim, var\(--state-disabled-opacity\)\);/.test(dimmed) && /\) > \* \{ --ds-dim: 1; \}/.test(dimmed));
// a later disabled rule that undoes the dim takes the knob back, so a disabled part inside dims itself again
const undim = toCss({ ...chip, variants: [...chip.variants, { when: { selected: true, disabled: true }, set: { 'root.opacity': null } }] }, 'chip', { naming: { kind: 'class', prefix: 'ds-', part: '__' } });
ok('a disabled rule that undoes the dim sets the knob back to initial', /> \* \{ --ds-dim: initial; \}/.test(undim));
ok('a stroke with no paint draws nothing', !('box-shadow' in decl({ border: { width: 'Stroke/1' } })) && !('border' in decl({ border: { width: 1, inLayout: true } })));

// every contract stored on this machine: each stylesheet rebuilds every variant its contract draws (skipped with none)
const require = createRequire(import.meta.url);
let stored = 0, off = 0;
try {
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
} catch (e) { console.log('  stored contracts not read:', e.message); }
if (stored) ok(`every stored contract's stylesheet rebuilds every variant it draws (${stored} contracts)`, off === 0);
else console.log('skip  no stored contracts on this machine');

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

console.log(`${n} passed`);
