#!/usr/bin/env node
// tools/component-contract/to-markup.mjs: a contract as markup, React and a web component, its parity mapping and
// stories, held to knowledge/code/react.md and knowledge/code/web-components.md on the contract editor's sample library
// and on contracts written here to break it. The web components are rendered in Chrome with to-code's sheet at every
// combination their contracts draw, pointer states forced: each part is there exactly where the contract draws it,
// and styled as it draws it. The Kirby snippets are linted and rendered by PHP and held to the web components' trees at
// those combinations, so the sweep's proof is theirs too.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { toReact, toElement, toSnippet, toGallery, toParity, toStories, partsOf, propsOf, filesFor, namingFault, partSelector, storyIdOf, storybookOf, BANNER, DOM, unexposed, swapKeysOf, insideOf } from './to-markup.mjs';
import { siteFiles, serveSite } from './site.mjs';
import { combinations, toCss, namer, drawn, entryOf, sampleSelector } from './to-code.mjs';
import { expand, variantDefaults } from './layers.mjs';
import { cssName } from '../tokens/names.mjs';
import { findChrome, launch, newPage, attach, navigate, forceState } from '../shared/cdp.mjs';

let n = 0;
const ok = (name, cond, why = '') => { n++; assert.ok(cond, `${name}${why ? `\n${why}` : ''}`); console.log('ok', name); };
const throws = (fn) => { try { fn(); return ''; } catch (e) { return e.message; } };
const SAMPLE = fileURLToPath(new URL('../contract-editor/sample', import.meta.url));
const DIR = path.join(SAMPLE, 'components');
const folders = fs.readdirSync(DIR).filter((f) => fs.existsSync(path.join(DIR, f, 'contract.json'))).sort();
const library = Object.fromEntries(folders.map((f) => { const c = JSON.parse(fs.readFileSync(path.join(DIR, f, 'contract.json'), 'utf8')); return [c.component, { ...c, folder: f }]; }));
const CLASS = { kind: 'class', prefix: 'ds-', part: '__' }, ELEMENT = { kind: 'element', prefix: 'ds-' }, KIRBY = ELEMENT;

/* ── a part's variable modes ── */
{ // each under the attribute the token build writes it as: a part's own as it stands, one a variant sets chosen by its props
  const card = { contract: 1, component: 'Mode card', props: { breakpoint: { type: 'enum', values: ['md', 'sm'], default: 'md', figma: 'Breakpoint' } },
    anatomy: { root: { kind: 'container', modes: { '5-responsive-type': 'desktop' } }, panel: { kind: 'container', parent: 'root', order: 0, modes: { theme: 'dark' } } },
    variants: [{ when: { breakpoint: 'sm' }, set: { 'root.modes': { '5-responsive-type': 'mobile' } } }] };
  const r = toReact(card, 'mode-card', { naming: CLASS, library: {}, stylesheet: '../styles/mode-card.css' });
  ok('React: a variant\'s mode is chosen by its props, a part\'s own written as it stands',
    /data-5-responsive-type=\{\(breakpoint === "sm"\) \? "mobile" : "desktop"\}/.test(r) && /data-theme="dark"/.test(r), r);
}

/* ── React, as text ── */
const button = toReact(library.Button, 'button', { naming: CLASS, library, stylesheet: '../styles/button.css' });
ok('React: its own props typed, and every other prop the button takes, its ref and its events with them', /export type ButtonProps = Own & Omit<ComponentPropsWithRef<"button">, keyof Own>;/.test(button) && /type = "button", className, onClick, \.\.\.rest \}: ButtonProps/.test(button));
ok('React: the rest reaches the native button first, so what the component sets is not lost to it; busy, a submit button submits nothing', /<button \{\.\.\.rest\} type=\{state === "loading" \? "button" : type\} disabled=\{disabled\}/.test(button));
ok('React: the caller\'s class joins the component\'s, never replaces it', /className=\{cx\("ds-button", className\)\}/.test(button));
ok('React: a value is the attribute the sheet keys on; a yes-or-no "true" or "false", as the sheet reads either default', /data-size=\{size\}/.test(button) && /data-show-icon=\{String\(showIcon\)\}/.test(button));
ok('React: Role is appearance, its hook still the sheet\'s data-role (code-standard rule 9)', /appearance\?: "primary" \| "secondary";/.test(button) && /data-role=\{appearance\}/.test(button) && !/\brole\?:/.test(button));
ok('React: a busy state keeps the button focusable and refuses its action, and is a gap to announce', /aria-disabled=\{state === "loading" \|\| undefined\}/.test(button) && /onClick=\{state === "loading" \? undefined : onClick\}/.test(button) && /frontend-build: state: say it in the page's status region/.test(button) && !/ disabled=\{state/.test(button));
ok('React: a pointer state is the browser\'s, so State offers only what the product sets', /state\?: "rest" \| "loading";/.test(button));
ok('React: a part a later layer takes away is drawn where its own layer adds it and the other does not', /\{showIcon && !\(state === "loading"\) && \(/.test(button) && /\{state === "loading" && \(/.test(button));
ok('React: a placed component is imported and given its values by its own names', /import \{ IconContainer \} from '\.\.\/icon-container\/icon-container';/.test(button) && /<IconContainer className="ds-button__spinner" icon="loader-circle" size="16" \/>/.test(button));
ok('React: a focus ring drawn as a layer is the sheet\'s outline, not markup', !/focus/i.test(button.split('export function')[1]));
ok('React: each prop says its default, for the editor and the docs table', /\/\*\* @default "md" \*\/\n  size\?/.test(button));
const navItem = toReact(library['Nav item'], 'nav-item', { naming: CLASS, library });
ok('React: a swap of a part inside a placed component is passed to that component\'s own prop', /<IconContainer className="ds-nav-item__icon" size="20" icon=\{icon\} \/>/.test(navItem) && /icon = "home"/.test(navItem));
ok('React: a component that holds no box is a span, so it may sit in a button; one that does is a div', /<span \{\.\.\.rest\} className=\{cx\("ds-nav-item"/.test(navItem) && /<div \{\.\.\.rest\} className=\{cx\("ds-contact-card"/.test(toReact(library['Contact card'], 'contact-card', { naming: CLASS, library })));
const panel = toReact(library['Nav panel'], 'nav-panel', { naming: CLASS, library });
ok('React: a list\'s numbered rows take the first row\'s class; a placed yes-or-no is a JSX boolean', (panel.match(/className="ds-nav-panel__item"/g) || []).length === 6 && /label="Home" icon="home" selected \/>/.test(panel) && /selected=\{false\} \/>/.test(panel) && !/=false\b/.test(panel));
ok('a component that is neither a button nor a field has its element and role as a gap', /frontend-build: its element and role: a div until frontend-build says/.test(panel));
ok('a field drawn with a Placeholder and no Value is a gap for its input', /frontend-build: a field drawn with a Placeholder and no Value text/.test(toReact(library['Search input'], 'search-input', { naming: CLASS, library })));
const twice = { component: 'Meter', props: { status: { type: 'enum', values: ['idle', 'busy', 'done'], default: 'idle', figma: 'Status' } }, anatomy: { root: { kind: 'container' } }, variants: [{ when: { status: 'busy' }, add: { bar: { kind: 'graphic', parent: 'root' } } }, { when: { status: 'done' }, add: { bar: { kind: 'graphic', parent: 'root' } } }] };
ok('a part two values draw is drawn at either, the either-or bracketed before the && that draws it', /\{\(\(status === "busy"\) \|\| \(status === "done"\)\) && \(/.test(toReact(twice, 'meter', { naming: CLASS, library: {} })) && /\(\(status === "busy"\) \|\| \(status === "done"\)\) && h\(/.test(toElement(twice, 'meter', { naming: ELEMENT, library: {} })));
const lead = { component: 'Chip', props: { lead: { type: 'boolean', default: false, figma: 'Lead' } }, anatomy: { root: { kind: 'container' }, label: { kind: 'text', parent: 'root', order: 0, content: 'Chip' } }, variants: [{ when: { lead: true }, add: { mark: { kind: 'graphic', parent: 'root', order: 0 } }, set: { 'label.order': 1 } }] };
// a part turned a quarter in some combination is drawn inside a wrapper (to-code turnedParts: the box its turn is laid out
// by), in every combination, so one markup serves both; any other turn is drawn as it stands
{ const upright = { contract: 1, component: 'Upright', props: { orientation: { type: 'enum', values: ['horizontal', 'vertical'], default: 'horizontal', figma: 'Orientation' } },
    anatomy: { root: { kind: 'container', layout: { direction: 'row' } }, track: { kind: 'container', parent: 'root', order: 0, width: 'fill', height: 16 }, end: { kind: 'text', parent: 'root', order: 1, content: 'x' } },
    variants: [{ when: { orientation: 'vertical' }, set: { 'root.layout': { direction: 'column' }, 'track.rotation': -90 } }] };
  const el = toElement(upright, 'upright', { naming: ELEMENT, library: {} }), react = toReact(upright, 'upright', { naming: CLASS, library: {} });
  ok('a part turned a quarter is drawn inside its wrapper, in markup of every kind; a part not turned is not wrapped',
    /"data-turn": "track"/.test(el) && /data-turn="track"/.test(react) && (el.match(/data-turn/g) || []).length === 1
    && el.indexOf('"data-turn": "track"') < el.indexOf('"data-part": "track"')
    && !/data-turn/.test(toElement({ ...upright, variants: [{ when: { orientation: 'vertical' }, set: { 'track.rotation': 30 } }] }, 'upright', { naming: ELEMENT, library: {} }))); }
ok('a part a variant adds before the rest is drawn there, not after them', /"data-part": "mark"[^]*"data-part": "label"/.test(toElement(lead, 'chip', { naming: ELEMENT, library: {} })));
const pill = { component: 'Pill', props: { size: { type: 'enum', values: ['lg', 'xs'], figmaValues: ['lg', 'xs'], default: 'lg', figma: 'Size' }, icon20: { type: 'instance', figma: 'Icon (20)', swaps: ['icon'] }, icon16: { type: 'instance', figma: 'Icon (16)', swaps: ['icon'] } }, anatomy: { root: { kind: 'container' }, icon: { kind: 'instance', parent: 'root', component: 'Icon/plus', swappedBy: 'icon20' } }, variants: [{ when: { size: 'xs' }, set: { 'icon.swappedBy': 'icon16' } }], folder: 'pill' };
const holder = { component: 'Row', props: {}, anatomy: { root: { kind: 'container' }, pill: { kind: 'instance', parent: 'root', component: 'Pill', with: { 'Icon (20)': 'plus', 'Icon (16)': 'x', Size: 'xs' } } }, variants: [], folder: 'row' };
// the web component's module says which design component it draws, by the design's own name, so a reading names it from
// the code (from-code's component) and never from the design it is compared with
ok('a web component\'s module exports the design component it draws, by its exact name', /^export const figma = \{"component":"Pill"\};$/m.test(toElement(pill, 'pill', { naming: ELEMENT, library: { Pill: pill } })));
ok('the module says the design component\'s key too, where the contract holds one', /^export const figma = \{"component":"Pill","key":"k1"\};$/m.test(toElement({ ...pill, figma: { key: 'k1' } }, 'pill', { naming: ELEMENT, library: { Pill: pill } })));
ok('a placed component with a swap per size is given the one its size draws (xs: Icon (16))', /placed\(parts\["[^"]*"\], renderPill, \{ icon: "x"/.test(toElement(holder, 'row', { naming: ELEMENT, library: { Pill: pill, Row: holder } })));
// two swaps each on its own layer (an Icon and an Icon (selected), the shown layer handed to the second when selected):
// each stays its own prop, its default the component on the layer it drives, each layer drawing the one that drives it
const toggled = { component: 'Toggle', props: { icon: { type: 'instance', figma: 'Icon', swaps: ['a', 'b'] }, iconSelected: { type: 'instance', figma: 'Icon (selected)', swaps: ['a', 'b'] }, selected: { type: 'boolean', default: false, figma: 'Selected', axis: true } },
  anatomy: { root: { kind: 'container' }, a: { kind: 'instance', parent: 'root', component: 'Icons/filled', swappedBy: 'iconSelected', opacity: 0, order: 0 }, b: { kind: 'instance', parent: 'root', component: 'Icons/outline', swappedBy: 'icon', order: 1 } },
  variants: [{ when: { selected: true }, set: { 'a.component': 'Icons/outline', 'a.swappedBy': 'icon', 'b.component': 'Icons/filled', 'b.swappedBy': 'iconSelected' } }], folder: 'toggle' };
// a swap per size whose layers both sit in the base anatomy, each removed at the other size: never drawn together, so
// still one icon
const icons = (c) => JSON.stringify(propsOf(c).filter((x) => x.type === 'icon').map((x) => [x.name, x.figmas || null]));
const sized = { component: 'Sized', props: { size: { type: 'enum', values: ['md', 'sm'], figmaValues: ['md', 'sm'], default: 'md', figma: 'Size' }, icon20: { type: 'instance', figma: 'Icon (20)', swaps: ['i20', 'i16'] }, icon16: { type: 'instance', figma: 'Icon (16)', swaps: ['i20', 'i16'] } },
  anatomy: { root: { kind: 'container' }, i20: { kind: 'instance', parent: 'root', component: 'Icon/plus', swappedBy: 'icon20', order: 0 }, i16: { kind: 'instance', parent: 'root', component: 'Icon/plus', swappedBy: 'icon16', order: 1 } },
  variants: [{ when: { size: 'md' }, remove: ['i16'] }, { when: { size: 'sm' }, remove: ['i20'] }], folder: 'sized' };
ok('a swap per size, its layers both in the base and each removed at the other size, is still one icon', icons(sized) === '[["icon",["Icon (20)","Icon (16)"]]]', icons(sized));
// a base layer on one swap and a layer a variant adds on another, drawn together there: two props
const added = { component: 'Added', props: { on: { type: 'boolean', default: false, figma: 'On', axis: true }, icon: { type: 'instance', figma: 'Icon', swaps: ['a', 'b'] }, icon2: { type: 'instance', figma: 'Icon 2', swaps: ['a', 'b'] } },
  anatomy: { root: { kind: 'container' }, a: { kind: 'instance', parent: 'root', component: 'Icon/plus', swappedBy: 'icon', order: 0 } },
  variants: [{ when: { on: true }, add: { b: { kind: 'instance', parent: 'root', component: 'Icon/minus', swappedBy: 'icon2', order: 1 } } }], folder: 'added' };
ok('a base layer on one swap and a variant\'s added layer on another, drawn together, stay two props', icons(added) === '[["icon",null],["icon2",null]]', icons(added));
const toggledEl = toElement(toggled, 'toggle', { naming: ELEMENT });
ok('two swaps each driving its own layer stay two props, each defaulting to its own layer\'s component', JSON.stringify(propsOf(toggled).filter((x) => x.type === 'icon').map((x) => [x.name, x.default])) === '[["icon","Icons/outline"],["iconSelected","Icons/filled"]]', JSON.stringify(propsOf(toggled)));
ok('each layer draws the swap that drives it, handed over where a variant says', /"data-part": "b", "data-icon": selected \? iconSelected : icon/.test(toggledEl) && /"data-part": "a", "data-icon": selected \? icon : iconSelected/.test(toggledEl), toggledEl);
// two swaps over two glyph layers (Material 3's nav item: Icon and Icon (selected), each linked to icon and icon_2), the
// instance stating only the second layer's glyph: it is given the swap whose value that glyph is
{ const item = { component: 'Item', props: { icon: { type: 'instance', figma: 'Icon', swaps: ['icon', 'icon_2'] }, iconSelected: { type: 'instance', figma: 'Icon (selected)', swaps: ['icon', 'icon_2'] } }, anatomy: { root: { kind: 'container' }, icon: { kind: 'instance', parent: 'root', component: 'Icons/stars_filled', order: 0 }, icon_2: { kind: 'instance', parent: 'root', component: 'Icons/stars', order: 1 } }, variants: [], folder: 'item' };
  const rail = { component: 'Rail', props: {}, anatomy: { root: { kind: 'container' }, item: { kind: 'instance', parent: 'root', component: 'Item', with: { Icon: 'stars', 'Icon (selected)': 'stars_filled' } }, 'item/icon_2': { kind: 'instance', parent: 'item', component: 'Icons/stars_filled', order: 1 } }, variants: [], folder: 'rail' };
  ok('of two swaps over the same glyph layers, the one whose value the instance draws on any of them', /placed\(parts\["[^"]*"\], renderItem, \{ icon\w*: "stars_filled"/.test(toElement(rail, 'rail', { naming: ELEMENT, library: { Item: item, Rail: rail } }))); }
// a swap of one of the library's components (Atlassian's button group, its <Button> 1): what the caller passes, else
// the design's own instance at its values, so the code draws what Figma draws at the swap's default; a snippet keeps its slot
{ const btn = { component: 'Btn', props: { label: { type: 'string', figma: 'Label', sets: ['label'], default: 'Go' } }, anatomy: { root: { kind: 'container' }, label: { kind: 'text', parent: 'root', content: '{label}' } }, variants: [], folder: 'btn' };
  const group = { component: 'Group', props: { button1: { type: 'instance', figma: '<Button> 1', swaps: ['button'] } }, anatomy: { root: { kind: 'container' }, button: { kind: 'instance', parent: 'root', component: 'Btn', with: { Label: 'One' } } }, variants: [], folder: 'group' };
  const lib = { Btn: btn, Group: group }, w = toElement(group, 'group', { naming: ELEMENT, library: lib }), r = toReact(group, 'group', { naming: CLASS, library: lib });
  const sw = propsOf(group, lib).find((x) => x.name === 'button1');
  ok('a swap of a library component draws the caller\'s content where given, the design\'s instance where not',
    /\(button1 != null\) && h\("span", \{ "data-part": "button"/.test(w) && /\(button1 == null\) && placed\(parts\["[^"]*"\], renderBtn, \{ label: "One" \}, \{ "data-part": "button"/.test(w) && /\{button1 == null && \(\s*<Btn className="ds-group__button" label="One"/.test(r)
    && sw.type === 'node' && JSON.stringify(sw.placed.parts) === '["button"]' && sw.placed.component === 'Btn', w);
  // a swap layer only a variant adds (its third button at count 3): the same, under that variant's condition
  const three = { ...group, props: { ...group.props, count: { type: 'enum', values: ['2', '3'], figmaValues: ['2', '3'], default: '2', figma: 'count' }, button3: { type: 'instance', figma: '<Button> 3', swaps: ['button_3'] } },
    variants: [{ when: { count: '3' }, add: { button_3: { kind: 'instance', parent: 'root', component: 'Btn', with: { Label: 'Three' }, order: 1 } } }] };
  const w3 = toElement(three, 'group', { naming: ELEMENT, library: { ...lib, Group: three } });
  ok('a swap of a layer only a variant adds draws the design\'s instance there, where that variant holds and nothing is passed',
    /\(\(count === "3"\) && button3 == null\) && placed\(parts\["[^"]*"\], renderBtn, \{ label: "Three" \}/.test(w3) && JSON.stringify(propsOf(three, { ...lib, Group: three }).find((x) => x.name === 'button3').placed.parts) === '["button_3"]', w3);
}
// a swap that drives two layers draws the design's instance in each where nothing is passed; a variant that swaps that
// instance for another of the library's draws the other where it holds, the base's elsewhere (as the instance branch does)
{ const st = (name) => ({ component: name, props: { on: { type: 'boolean', default: false, figma: 'On' } }, anatomy: { root: { kind: 'container' } }, variants: [], folder: name.toLowerCase() });
  const two = { component: 'Two', props: { icon: { type: 'instance', figma: 'Icon', swaps: ['a', 'b'] } }, anatomy: { root: { kind: 'container' }, a: { kind: 'instance', parent: 'root', order: 0, component: 'Pic' }, b: { kind: 'instance', parent: 'root', order: 1, component: 'Pic' } }, variants: [], folder: 'two' };
  const w2 = toElement(two, 'two', { naming: ELEMENT, library: { Pic: st('Pic'), Two: two } });
  ok('a swap that drives two layers draws the design\'s instance in each where nothing is passed', (w2.match(/\(icon == null\) && placed\(parts\["[^"]*"\], renderPic, /g) || []).length === 2, w2);
  const sty = { component: 'Sty', props: { style: { type: 'enum', values: ['outlined', 'elevated'], figmaValues: ['Outlined', 'Elevated'], default: 'outlined', figma: 'Style' }, bgSwap: { type: 'instance', figma: 'Bg', swaps: ['bg'] } },
    anatomy: { root: { kind: 'container' }, bg: { kind: 'instance', parent: 'root', component: 'Outlined' } }, variants: [{ when: { style: 'elevated' }, set: { 'bg.component': 'Elevated' } }], folder: 'sty' };
  const w3 = toElement(sty, 'sty', { naming: ELEMENT, library: { Outlined: st('Outlined'), Elevated: st('Elevated'), Sty: sty } });
  ok('a swap whose instance a variant changes draws the variant\'s component where it holds, the base\'s elsewhere, where nothing is passed',
    /bgSwap == null\) && \(styleOption === "elevated"\)\) && placed\(parts\["[^"]*"\], renderElevated, /.test(w3) && /bgSwap == null\) && !\(styleOption === "elevated"\)\) && placed\(parts\["[^"]*"\], renderOutlined, /.test(w3), w3);
}
// a variant that places another of the library's components (Material 3's card: its Elevated state at Style Elevated, for
// the base's Outlined): each where its variant holds, the base's where none does, in all three languages
{ const st = (name) => ({ component: name, props: {}, anatomy: { root: { kind: 'container' } }, variants: [], folder: name.toLowerCase(), figma: { key: `k-${name}` } });
  const card = { component: 'Card', props: { style: { type: 'enum', values: ['outlined', 'elevated', 'filled'], figmaValues: ['Outlined', 'Elevated', 'Filled'], default: 'outlined', figma: 'Style' }, show: { type: 'boolean', default: true, figma: 'Show', shows: ['bg'] } },
    anatomy: { root: { kind: 'container' }, bg: { kind: 'instance', parent: 'root', component: 'Outlined', key: 'k-Outlined' } },
    variants: [{ when: { show: false }, remove: ['bg'] }, { when: { style: 'elevated' }, set: { 'bg.component': 'Elevated', 'bg.key': 'k-Elevated' } }, { when: { style: 'filled' }, set: { 'bg.component': 'Filled', 'bg.key': 'k-Filled' } }], folder: 'card' };
  const lib = { Card: card, Outlined: st('Outlined'), Elevated: st('Elevated'), Filled: st('Filled') };
  const r = toReact(card, 'card', { naming: CLASS, library: lib }), w = toElement(card, 'card', { naming: ELEMENT, library: lib }), k = toSnippet(card, 'card', { naming: KIRBY, library: lib });
  ok('a variant that swaps a placed component draws the one it swaps in where it holds, the base\'s elsewhere',
    /\{show && \(styleOption === "elevated"\) && \(\s*<Elevated/.test(r) && /\{show && \(styleOption === "filled"\) && \(\s*<Filled/.test(r) && /\{show && \(!\(styleOption === "elevated"\) && !\(styleOption === "filled"\)\) && \(\s*<Outlined/.test(r)
    && /\(show && \(styleOption === "elevated"\)\) && placed\(parts\["[^"]*"\], renderElevated, /.test(w) && /\(show && \(styleOption === "filled"\)\) && placed\(parts\["[^"]*"\], renderFilled, /.test(w) && /\(show && \(!\(styleOption === "elevated"\) && !\(styleOption === "filled"\)\)\) && placed\(parts\["[^"]*"\], renderOutlined, /.test(w)
    && /if \(\$show && \(\$styleOption === 'elevated'\)\): \?>\s*<\?php snippet\('ds\/elevated'/.test(k) && /if \(\$show && \(\$styleOption === 'filled'\)\): \?>\s*<\?php snippet\('ds\/filled'/.test(k) && /'filled'\)\)\): \?>\s*<\?php snippet\('ds\/outlined'/.test(k), r);
  const combos = { ...card, variants: [{ when: { style: 'elevated', show: true }, combination: true, set: { 'bg.component': 'Elevated', 'bg.key': 'k-Elevated' } }, { when: { style: 'elevated' }, combination: true, set: { 'bg.component': 'Filled', 'bg.key': 'k-Filled' } }] };
  const rc = toReact(combos, 'card', { naming: CLASS, library: { ...lib, Card: combos } });
  ok('of two combinations that swap it, the first that holds is drawn, as expand takes it', /\{styleOption === "elevated" && show && \(\s*<Elevated/.test(rc) && /!\(styleOption === "elevated" && show\) && \(\s*<Filled/.test(rc), rc); }
const two = { component: 'Find', props: { placeholderText: { type: 'string', figma: 'Placeholder text', sets: ['label'] }, valueText: { type: 'string', default: 'Value', figma: 'Value text', sets: ['label'] }, value: { type: 'boolean', default: false, figma: 'Value' } }, anatomy: { root: { kind: 'container' }, label: { kind: 'text', parent: 'root', content: 'Search' } }, variants: [{ when: { value: true }, set: { 'label.content': '{valueText}' } }], folder: 'find' };
{ const out = toElement(two, 'find', { naming: ELEMENT, library: {} });
  ok('one text two strings set is the one a variant swaps in where drawn, else the other, which draws its layer\'s words', /value \? valueText : placeholderText/.test(out) && /placeholderText = "Search"/.test(out)); }
const alert = { component: 'Alert', props: { tone: { type: 'enum', values: ['info', 'error'], default: 'info', figma: 'Tone' } }, anatomy: { root: { kind: 'container' }, icon: { kind: 'instance', parent: 'root', component: 'Icon/info' } }, variants: [{ when: { tone: 'error' }, set: { 'icon.component': 'Icon/alert' } }], folder: 'alert' };
{ // a wrapper the library does not hold, its glyph named by its own prop and placed inside it: the glyph is marked
  const banner = { component: 'Banner', props: { tone: { type: 'enum', values: ['info', 'error'], default: 'info', figma: 'Tone' } }, folder: 'banner',
    anatomy: { root: { kind: 'container' }, icon: { kind: 'instance', parent: 'root', component: 'Wrap', with: { '<icon>': 'Info', size: 'm' } }, 'icon/info': { kind: 'instance', parent: 'icon', component: 'Info' } },
    variants: [{ when: { tone: 'error' }, set: { 'icon.with': { '<icon>': 'Error', size: 'm' } }, add: { 'icon/error': { kind: 'instance', parent: 'icon', component: 'Error' } }, remove: ['icon/info'] }] };
  ok('a wrapper the library does not hold marks the glyph its own prop names and places, as its variants change it; the prop is its swap',
    toElement(banner, 'banner', { naming: ELEMENT, library: {} }).includes('"data-icon": (tone === "error") ? "Error" : "Info"') && [...swapKeysOf(banner, 'icon')].join() === '<icon>');
  const added = { ...banner, anatomy: { root: banner.anatomy.root }, variants: [{ when: { tone: 'info' }, add: { icon: banner.anatomy.icon, 'icon/info': banner.anatomy['icon/info'] } }, { when: { tone: 'error' }, add: { icon: { ...banner.anatomy.icon, with: { '<icon>': 'Error' } }, 'icon/error': { kind: 'instance', parent: 'icon', component: 'Error' } } }] };
  ok('a wrapper each variant adds at props of its own marks the glyph that variant gives it', toElement(added, 'banner', { naming: ELEMENT, library: {} }).includes('"data-icon": (tone === "error") ? "Error" : ((tone === "info") ? "Info" : "Info")'), toElement(added, 'banner', { naming: ELEMENT, library: {} })); }
{ // a component the library does not hold, swapped in where no prop swaps it: its look and the limits of its size inline
  const tile = { component: 'Tile', props: {}, anatomy: { root: { kind: 'container' } }, variants: [] };
  const cell = { component: 'Cell', props: {}, anatomy: { root: { kind: 'container' }, slot: { kind: 'instance', parent: 'root', component: 'Tile' } }, variants: [] };
  const mainOf = (n) => ({ Tile: tile, Cell: cell })[n] || null;
  const a = { root: { kind: 'container' }, cell: { kind: 'instance', parent: 'root', component: 'Cell' }, 'cell/slot': { kind: 'instance', parent: 'cell', component: 'Foreign', minWidth: 24, maxWidth: 24, radius: 3 } };
  const r = ((insideOf(a, 'cell', mainOf).slot || {}).render || {}).attrs || {};
  ok('a component swapped in that the library does not hold carries the limits of its size inline, beside its look', /min-inline-size: 1\.5rem/.test(r.style) && /max-inline-size: 1\.5rem/.test(r.style) && /border-radius: 3px/.test(r.style), JSON.stringify(r)); }
ok('a glyph a variant changes is the one its condition draws', /"data-icon": \(tone === "error"\) \? "Icon\/alert" : "Icon\/info"/.test(toElement(alert, 'alert', { naming: ELEMENT, library: {} })));
{ const two = { ...alert, props: { tone: { type: 'enum', values: ['info', 'warning', 'error'], default: 'info', figma: 'Tone' } }, variants: [{ when: { tone: 'warning' }, set: { 'icon.component': 'Icon/warn' } }, ...alert.variants] };
  ok('two glyphs variants change nest bracketed (PHP 8 refuses an unbracketed nested choice)', /: \(\(tone === "warning"\) \? "Icon\/warn" : "Icon\/info"\)/.test(toElement(two, 'alert', { naming: ELEMENT, library: {} }))); }
{ const sw = { component: 'Switcher', props: {}, anatomy: { root: { kind: 'container' } }, variants: [], folder: 'switcher' };
  const org = { component: 'Org', props: {}, anatomy: { root: { kind: 'container' }, sw: { kind: 'instance', parent: 'root', component: 'Switcher' }, 'sw/icon': { kind: 'instance', parent: 'sw', component: 'Icon/case' } }, variants: [], folder: 'org' };
  const sw2 = { ...sw, props: { st: { type: 'enum', values: ['rest', 'hover'], default: 'rest', role: 'interaction', pointer: ['hover'], figma: 'State' } }, anatomy: { root: { kind: 'container' }, box: { kind: 'text', parent: 'root' }, 'box/t': { kind: 'container', parent: 'box' }, 'box/t/x': { kind: 'text', parent: 'box/t', content: 'a' }, icon: { kind: 'instance', parent: 'root', component: 'Icon/dot' } }, variants: [{ when: { st: 'hover' }, set: { 'icon.component': 'Icon/case' } }] };
  const org2 = { ...org, anatomy: { root: { kind: 'container' }, sw: { kind: 'instance', parent: 'root', component: 'Switcher' }, 'sw/box': { kind: 'container', parent: 'sw' }, 'sw/box/t': { kind: 'container', parent: 'sw/box' }, 'sw/box/t/x': { kind: 'text', parent: 'sw/box/t', content: 'b' }, 'sw/icon': { kind: 'instance', parent: 'sw', component: 'Icon/case' } } };
  const out2 = toElement(org2, 'org', { naming: ELEMENT, library: { Switcher: sw2, Org: org2 } });
  ok('an override under one already named is not named again; a glyph only a hover state changes there is passed in parts, no gap', /Box: drawn here/.test(out2) && !/X: drawn here/.test(out2) && !/Icon: drawn here/.test(out2) && /"icon": \{ attrs: \{ "data-icon": "Icon\/case" \} \}/.test(out2), out2);
  { const sw3 = { ...sw, props: { size: { type: 'enum', values: ['s', 'l'], default: 's', figma: 'Size' } }, anatomy: { root: { kind: 'container' }, icon: { kind: 'instance', parent: 'root', component: 'Icon/dot' } }, variants: [{ when: { size: 'l' }, set: { 'icon.content': 'x' } }] };
    const org3 = { ...org, anatomy: { root: { kind: 'container' }, sw: { kind: 'instance', parent: 'root', component: 'Switcher' }, 'sw/icon': { kind: 'instance', parent: 'sw', component: 'Icon/case' } } };
    ok('a variant that sets one field of a part passes that field only: another component there is still an override', unexposed(org3, 'sw/icon', (n) => (n === 'Switcher' ? sw3 : null)) === 'part');
    // in the component's own slot, its sample is drawn: a placed component there is held to its props as anywhere
    const inSlot = { ...org, anatomy: { root: { kind: 'container' }, body: { kind: 'slot', parent: 'root' }, 'body/sw': { kind: 'instance', parent: 'body', component: 'Switcher' }, 'body/sw/icon': { kind: 'instance', parent: 'body/sw', component: 'Icon/case' } } };
    ok('an override inside a placed component in the slot\'s own sample is one the markup cannot pass', unexposed(inSlot, 'body/sw/icon', (n) => (n === 'Switcher' ? sw : null)) === 'part'); }
  // a part the placed component draws only at one of its variants (Carbon's toggle item draws its small switch at Size
  // Small, untoggled): the variant passes the part, but a prop of it no variant gives (the toggle's switch Toggled) is an
  // override all the same; one a variant gives is passed
  { const item = { component: 'Item', props: { size: { type: 'enum', values: ['default', 'small'], default: 'default', figmaValues: ['Default', 'Small'], figma: 'Size' } }, anatomy: { root: { kind: 'container' } },
      variants: [{ when: { size: 'small' }, add: { sw: { kind: 'instance', parent: 'root', component: 'Switch', with: { Toggled: 'False' } } } }] };
    const tog = (w) => ({ component: 'Toggle', props: {}, anatomy: { root: { kind: 'container' }, item: { kind: 'instance', parent: 'root', component: 'Item', with: { Size: 'Small' } }, 'item/sw': { kind: 'instance', parent: 'item', component: 'Switch', with: w } }, variants: [] });
    ok('a prop no variant of the placed component gives a part it draws only at a variant is an override; one it gives is passed',
      unexposed(tog({ Toggled: 'True' }), 'item/sw', (n) => (n === 'Item' ? item : null)) === 'field' && unexposed(tog({ Toggled: 'False' }), 'item/sw', (n) => (n === 'Item' ? item : null)) === false);
    // (and another component there, which no variant adds, is the part itself overridden)
    const other = tog({ Toggled: 'False' }); other.anatomy['item/sw'].component = 'Checkbox';
    ok('another component where the placed one adds its own only at a variant is a part no prop passes', unexposed(other, 'item/sw', (n) => (n === 'Item' ? item : null)) === 'part'); }
  // 2026-11-26: a nested instance the placed component exposes (Figma's exposed instances) hands its props to the caller,
  // so an override of them is the toolkit's to forward ('exposed'), never the library's; its insides stay overrides
  { const main = (exposed) => ({ component: 'Item', props: {}, anatomy: { root: { kind: 'container' }, sw: { kind: 'instance', parent: 'root', component: 'Switch', with: { Toggled: 'False' }, ...(exposed && { exposed: true }) }, 'sw/knob': { kind: 'graphic', parent: 'sw', fill: ['a'] } }, variants: [] });
    const at = (w, fill) => ({ component: 'Toggle', props: {}, anatomy: { root: { kind: 'container' }, item: { kind: 'instance', parent: 'root', component: 'Item' }, 'item/sw': { kind: 'instance', parent: 'item', component: 'Switch', with: w }, 'item/sw/knob': { kind: 'graphic', parent: 'item/sw', fill: [fill] } }, variants: [] });
    const of = (m) => (n) => (n === 'Item' ? m : null);
    ok('an exposed nested instance\'s prop overridden is one to forward; the same on an unexposed one is the library\'s',
      unexposed(at({ Toggled: 'True' }, 'a'), 'item/sw', of(main(true))) === 'exposed-field' && unexposed(at({ Toggled: 'True' }, 'a'), 'item/sw', of(main(false))) === 'field');
    ok('…another component swapped into an exposed instance is one to forward too',
      (() => { const c = at({ Toggled: 'False' }, 'a'); c.anatomy['item/sw'].component = 'Checkbox'; return unexposed(c, 'item/sw', of(main(true))) === 'exposed-part'; })()); }
  // (exposure read where a variant adds the instance, at the props it is placed with; review of 2026-11-26)
  { const item = (exposed) => ({ component: 'Item', props: { size: { type: 'enum', values: ['default', 'small'], default: 'default', figmaValues: ['Default', 'Small'], figma: 'Size' } }, anatomy: { root: { kind: 'container' } },
      variants: [{ when: { size: 'small' }, add: { sw: { kind: 'instance', parent: 'root', component: 'Switch', with: { Toggled: 'False' }, ...(exposed && { exposed: true }) } } }] });
    const tog = { component: 'Toggle', props: {}, anatomy: { root: { kind: 'container' }, item: { kind: 'instance', parent: 'root', component: 'Item', with: { Size: 'Small' } }, 'item/sw': { kind: 'instance', parent: 'item', component: 'Switch', with: { Toggled: 'True' } } }, variants: [] };
    ok('an instance a variant adds exposed is one to forward; added unexposed, the library\'s', unexposed(tog, 'item/sw', (n) => (n === 'Item' ? item(true) : null)) === 'exposed-field' && unexposed(tog, 'item/sw', (n) => (n === 'Item' ? item(false) : null)) === 'field'); }
  // (and the markup's gaps name a component swapped into an exposed instance once, as one to forward, its insides not again)
  { const item = { component: 'Item', folder: 'item', props: {}, anatomy: { root: { kind: 'container' }, sw: { kind: 'instance', parent: 'root', component: 'Switch', exposed: true } }, variants: [] };
    const tog = { component: 'Toggle', folder: 'toggle', props: {}, variants: [], anatomy: { root: { kind: 'container' }, item: { kind: 'instance', parent: 'root', component: 'Item' }, 'item/sw': { kind: 'instance', parent: 'item', component: 'Checkbox' }, 'item/sw/box': { kind: 'container', parent: 'item/sw', width: 16 } } };
    const out = toReact(tog, 'toggle', { naming: CLASS, library: { Item: item, Toggle: tog } });
    ok('a component swapped into an exposed instance is named once as one to forward, its insides not named again', (out.match(/which exposes it in Figma: forward its props/g) || []).length === 1 && !/Box: /.test(out) && !/has no prop for it/.test(out), out.split('\n').filter((l) => /forward|no prop/.test(l))); }
  { const date = { component: 'Date', folder: 'date', props: { value: { type: 'string', default: 'Value', figma: 'Value', sets: ['label'] }, hasValue: { type: 'boolean', default: false, figma: 'Has value' } }, anatomy: { root: { kind: 'container' }, label: { kind: 'text', parent: 'root', content: 'Select a date' } }, variants: [{ when: { hasValue: true }, set: { 'label.content': '{value}' } }] };
    const out = toElement(date, 'date', { naming: ELEMENT, library: { Date: date } });
    ok('a text that holds a literal until a variant swaps a prop in draws the literal there, never the prop on both sides', /hasValue \? value : "Select a date"/.test(out) && !/hasValue \? value : value/.test(out)); }
  { const f = { component: 'F', folder: 'f', props: { state: { type: 'enum', values: ['rest', 'focus'], default: 'rest', role: 'interaction', pointer: ['focus'], figma: 'State' } }, anatomy: { root: { kind: 'container' }, t: { kind: 'text', parent: 'root', content: 'Select' } }, variants: [{ when: { state: 'focus' }, set: { 't.content': 'Search' } }] };
    ok('words a pointer state draws are named as a gap, never dropped without a word', /words change at a pointer state/.test(toElement(f, 'f', { naming: ELEMENT, library: { F: f } })));
    const m = { ...f, variants: [{ when: { state: 'focus' }, set: { 'root.modes': { theme: 'a' } } }] };
    ok('variable modes a pointer state sets are named as a gap, never dropped without a word', /variable modes change at a pointer state/.test(toElement(m, 'f', { naming: ELEMENT, library: { F: m } })) && !/variable modes change/.test(toElement(f, 'f', { naming: ELEMENT, library: { F: f } }))); }
  { const link = { component: 'Link', folder: 'link', props: { state: { type: 'enum', values: ['rest', 'hover'], default: 'rest', figmaValues: ['Rest', 'Hover'], role: 'interaction', pointer: ['hover'], figma: 'State' }, on: { type: 'boolean', default: false, axis: true, figma: 'On' } }, anatomy: { root: { kind: 'container' } }, variants: [] };
    const holder = (variants, w) => ({ component: 'Card', folder: 'card', props: { state: { type: 'enum', values: ['rest', 'hover'], default: 'rest', role: 'interaction', pointer: ['hover'], figma: 'State' } }, anatomy: { root: { kind: 'container' }, link: { kind: 'instance', parent: 'root', component: 'Link', with: w } }, variants });
    const out = (h) => toElement(h, 'card', { naming: ELEMENT, library: { Card: h, Link: link } });
    ok('a placed instance drawn at its own pointer state, or given props only this one\'s pointer state sets, is named as a gap; one at rest is not',
      /Link is given props only a pointer state draws/.test(out(holder([], { State: 'Hover' })))
      && /Link is given props only a pointer state draws/.test(out(holder([{ when: { state: 'hover' }, set: { 'link.with': { On: 'True' } } }], { On: 'False' })))
      && !/given props only a pointer state/.test(out(holder([], { State: 'Rest', On: 'True' })))); }
  { const item = { component: 'Item', folder: 'item', props: {}, anatomy: { root: { kind: 'container' }, label: { kind: 'text', parent: 'root', content: 'A' } }, variants: [] };
    const menu = { component: 'Menu', folder: 'menu', props: {}, anatomy: { root: { kind: 'container' }, items: { kind: 'slot', parent: 'root' } }, variants: [] };
    const bar = { component: 'Bar', folder: 'bar', props: {}, variants: [], anatomy: { root: { kind: 'container' }, menu: { kind: 'instance', parent: 'root', component: 'Menu' }, 'menu/items': { kind: 'slot', parent: 'menu' }, 'menu/items/item': { kind: 'instance', parent: 'menu/items', component: 'Item' }, 'menu/items/item/badge': { kind: 'instance', parent: 'menu/items/item', component: 'Badge' } } };
    ok('in a slot this component fills, an override is named against the item placed there, not the menu', /Badge: drawn here inside Item, which has no prop for it/.test(toElement(bar, 'bar', { naming: ELEMENT, library: { Item: item, Menu: menu, Bar: bar } }))); }
  { const cb = { component: 'Check', folder: 'check', props: {}, anatomy: { root: { kind: 'container' }, mark: { kind: 'instance', parent: 'root', component: 'Icon/check', with: { Size: '16' }, width: 12, height: 12 } }, variants: [] };
    const out = toElement(cb, 'check', { naming: ELEMENT, library: { Check: cb } });
    const even = toElement({ ...cb, anatomy: { ...cb.anatomy, mark: { ...cb.anatomy.mark, width: 16, height: 16 } } }, 'check', { naming: ELEMENT, library: { Check: cb } });
    const smaller = toElement({ ...cb, props: { small: { type: 'boolean', default: false, figma: 'Small' } }, anatomy: { ...cb.anatomy, mark: { ...cb.anatomy.mark, width: 16, height: 16 } }, variants: [{ when: { small: true }, set: { 'mark.width': 12, 'mark.height': 12 } }] }, 'check', { naming: ELEMENT, library: { Check: cb } });
    const swapped = toElement({ ...cb, props: { glyph: { type: 'instance', figma: 'Glyph', swaps: ['mark'] } } }, 'check', { naming: ELEMENT, library: { Check: cb } });
    ok('a glyph drawn at another size than its own, in any combination, says its own (data-icon-size); one drawn at its own, or an icon a prop swaps, does not',
      /"data-icon-size": "16"/.test(out) && !/data-icon-size/.test(even) && /"data-icon-size": "16"/.test(smaller) && !/data-icon-size/.test(swapped)); }
  { const el = toElement(org, 'org', { naming: ELEMENT, library: { Switcher: sw, Org: org } });
    ok('an override a placed component has no prop for is drawn through its parts by a web component, and named as a gap where React cannot pass it, never dropped without a word',
      /Icon: drawn here inside Sw, which has no prop for it/i.test(toReact(org, 'org', { naming: CLASS, library: { Switcher: sw, Org: org } })) && !/drawn here inside/.test(el) && /"": \{ add: \[\{ at: 0, node: h\("span", \{ "data-part": "icon", "data-icon": "Icon\/case"/.test(el), el); } }
/* ── parts: what a holder sets inside a placed component that no prop of it carries (renderX's third argument) ── */
{ // a tiny document, enough for dom.js: the generated modules run here as they run in Chrome
  const el = (tag) => ({ tag, tagName: tag.toUpperCase(), attrs: {}, kids: [], up: null, setAttribute(k, v) { this.attrs[k] = String(v); }, getAttribute(k) { return k in this.attrs ? this.attrs[k] : null; }, get attributes() { return Object.entries(this.attrs).map(([name, value]) => ({ name, value })); }, hasAttribute(k) { return k in this.attrs; }, removeAttribute(k) { delete this.attrs[k]; },
    addEventListener() {}, append(...xs) { for (const x of xs) { if (typeof x === 'object') x.up = this; this.kids.push(x); } }, get children() { return this.kids.filter((x) => typeof x === 'object'); },
    insertBefore(x, r) { x.up = this; const i = r ? this.kids.indexOf(r) : -1; if (i < 0) this.kids.push(x); else this.kids.splice(i, 0, x); },
    remove() { this.up.kids.splice(this.up.kids.indexOf(this), 1); }, replaceWith(x) { x.up = this.up; this.up.kids.splice(this.up.kids.indexOf(this), 1, x); },
    get textContent() { return this.kids.map((x) => (typeof x === 'string' ? x : x.textContent)).join(''); }, set textContent(s) { this.kids = [String(s)]; } });
  globalThis.document = { createElement: el };
  const find = (root, f) => { if (f(root)) return root; for (const k of root.kids || []) if (typeof k !== 'string') { const x = find(k, f); if (x) return x; } return null; };
  const trail = { component: 'Trail', folder: 'trail', props: { tone: { type: 'enum', values: ['plain', 'loud'], figmaValues: ['Plain', 'Loud'], default: 'plain', figma: 'Tone' } }, anatomy: { root: { kind: 'container' }, mark: { kind: 'text', parent: 'root', content: 'T' } }, variants: [] };
  const badge = { component: 'Badge', folder: 'badge', props: { count: { type: 'string', default: '1', figma: 'Count', sets: ['n'] } }, anatomy: { root: { kind: 'container' }, n: { kind: 'text', parent: 'root', content: '{count}' } }, variants: [] };
  const item = { component: 'Item', folder: 'item', props: {}, anatomy: { root: { kind: 'container' }, label: { kind: 'text', parent: 'root', order: 0, content: 'A' }, trail: { kind: 'instance', parent: 'root', order: 1, component: 'Trail', with: { Tone: 'Plain' } } }, variants: [] };
  const row = (inside, props = {}, variants = []) => ({ component: 'Row', folder: 'row', props, variants, anatomy: { root: { kind: 'container' }, item: { kind: 'instance', parent: 'root', component: 'Item', with: {} }, ...inside } });
  const lib = (r) => ({ Trail: trail, Badge: badge, Item: item, Row: r });
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'parts-'));
  let k = 0;
  const run = async (r, args = {}) => {
    const L = lib(r), dir = path.join(tmp, String(k++));
    fs.mkdirSync(dir); fs.writeFileSync(path.join(dir, 'dom.js'), DOM);
    for (const c of Object.values(L)) { fs.mkdirSync(path.join(dir, c.folder)); fs.writeFileSync(path.join(dir, c.folder, `${c.folder}.js`), toElement(c, c.folder, { naming: ELEMENT, library: L })); }
    const mod = await import(path.join(dir, 'row', 'row.js'));
    return mod.renderRow(args);
  };
  const words = row({ 'item/label': { kind: 'text', parent: 'item', order: 0, content: 'B' }, 'item/trail': { kind: 'instance', parent: 'item', order: 1, component: 'Trail', with: { Tone: 'Loud' } } });
  const out = toElement(words, 'row', { naming: ELEMENT, library: lib(words) });
  ok('parts: every render function takes a third argument, what its holder sets inside it, by part name', /export function renderItem\(\{[^}]*\} = \{\}, host = \{\}, parts = \{\}\)/.test(toElement(item, 'item', { naming: ELEMENT, library: lib(words) })));
  ok('parts: words and props a placed component has no prop for are passed to its parts by name, never a gap', /renderItem, [^\n]*"label": \{ content: "B" \}/.test(out) && /"trail": \{ props: \{ tone: "loud" \} \}/.test(out) && !/drawn here inside/.test(out), out);
  { const d = await run(words), label = find(d, (x) => x.attrs['data-part'] === 'label'), t = find(d, (x) => x.tag === 'ds-trail');
    ok('parts: the placed component draws them on its own parts, nested ones through the part placed there', label.textContent === 'B' && t.attrs.tone === 'loud'); }
  const swap = row({ 'item/trail': { kind: 'instance', parent: 'item', order: 1, component: 'Badge', with: { Count: '7' } } });
  { const d = await run(swap), b = find(d, (x) => x.tag === 'ds-badge');
    ok('parts: another component swapped in where no prop swaps it is drawn in the part\'s place, given its own props', !!b && b.attrs['data-part'] === 'trail' && b.textContent === '7' && !find(d, (x) => x.tag === 'ds-trail')); }
  { const d = await run(row({ 'item/trail': { kind: 'instance', parent: 'item', order: 1, component: 'Icons/star', background: 'Fill/accent', radius: 4, modes: { tone: 'bold' } } })), x = find(d, (y) => y.attrs['data-part'] === 'trail');
    ok('parts: a component the library does not hold, in place of one it does, is marked where it goes as an icon is, with the look and modes it draws of its own',
      x && x.tag === 'span' && x.attrs['data-icon'] === 'Icons/star' && !find(d, (y) => y.tag === 'ds-trail') && /(^|; )color: var\(--fill-accent\)/.test(x.attrs.style || '') && !/background/.test(x.attrs.style || '') && /border-radius: 4px/.test(x.attrs.style || '') && Object.values(x.attrs).includes('bold'), JSON.stringify(x && x.attrs)); }
  { const tone = (bg) => ({ 'item/trail': { kind: 'instance', parent: 'item', order: 1, component: 'Icons/star', background: bg } });
    const r = row(tone('Fill/accent'), { big: { type: 'boolean', default: false, figma: 'Big' } }, [{ when: { big: true }, set: { 'item/trail.background': 'Fill/danger' } }]);
    const at = async (args) => ((find(await run(r, args), (y) => y.attrs['data-part'] === 'trail') || {}).attrs || {}).style || '';
    const a = await at({}), b = await at({ big: true });
    ok('parts: a swapped-in mark whose look differs between combinations keeps each combination\'s own look', /fill-accent/.test(a) && /fill-danger/.test(b), `${a} | ${b}`); }
  { const marked = { ...item, anatomy: { root: { kind: 'container' }, mark: { kind: 'instance', parent: 'root', order: 0, component: 'Icons/dot', name: 'Status dot' } } };
    const r = row({ 'item/mark': { kind: 'instance', parent: 'item', order: 0, component: 'Badge', with: { Count: '3' }, modes: { theme: 'dark' } } }), L = { ...lib(r), Item: marked };
    const dir = path.join(tmp, 'mark'); fs.mkdirSync(dir); fs.writeFileSync(path.join(dir, 'dom.js'), DOM);
    for (const c of Object.values(L)) { fs.mkdirSync(path.join(dir, c.folder)); fs.writeFileSync(path.join(dir, c.folder, `${c.folder}.js`), toElement(c, c.folder, { naming: ELEMENT, library: L })); }
    const d = (await import(path.join(dir, 'row', 'row.js'))).renderRow(), b = find(d, (x) => x.tag === 'ds-badge');
    ok('parts: a component drawn in place of a part keeps that part\'s names (data-part, its Figma name), never the old mark\'s icon or aria-hidden, the design\'s own modes on it', !!b && b.attrs['data-part'] === 'mark' && b.attrs['data-figma-name'] === 'Status dot' && !('data-icon' in b.attrs) && !('aria-hidden' in b.attrs) && Object.values(b.attrs).includes('dark'), JSON.stringify(b && b.attrs)); }
  { const two = { ...item, anatomy: { ...item.anatomy, trail_2: { ...item.anatomy.trail, order: 2 } } };
    const r = row({ 'item/trail_2': { kind: 'instance', parent: 'item', order: 2, component: 'Trail', with: { Tone: 'Loud' } } }), L = { ...lib(r), Item: two };
    const dir = path.join(tmp, 'copies'); fs.mkdirSync(dir); fs.writeFileSync(path.join(dir, 'dom.js'), DOM);
    for (const c of Object.values(L)) { fs.mkdirSync(path.join(dir, c.folder)); fs.writeFileSync(path.join(dir, c.folder, `${c.folder}.js`), toElement(c, c.folder, { naming: ELEMENT, library: L })); }
    const d = (await import(path.join(dir, 'row', 'row.js'))).renderRow(), tones = d.kids[0].kids.filter((x) => x.tag === 'ds-trail').map((x) => x.attrs.tone);
    ok('parts: a numbered copy, which shares its first\'s data-part, is set apart by its own name', tones.join() === 'plain,loud', tones.join()); }
  { const r = row({ item_2: { kind: 'instance', parent: 'root', order: 1, component: 'Item', with: {} }, 'item/label': { kind: 'text', parent: 'item', order: 0, content: 'B' }, 'item_2/label': { kind: 'text', parent: 'item_2', order: 0, content: 'C', color: 'Red' } });
    const m = toParity(r, 'row', { naming: ELEMENT, library: lib(r), framework: 'web-components' }).layers, o = toElement(r, 'row', { naming: ELEMENT, library: lib(r) });
    ok('parts: inside placed copies, which share a hook no sheet rule can tell apart, each copy is read under its own count and its look passed inline',
      m['Item > Label'] === 'ds-row > [data-part="item"]:nth-child(1 of [data-part="item"]) > [data-part="label"]' && m['Item#2 > Label'] === 'ds-row > [data-part="item"]:nth-child(2 of [data-part="item"]) > [data-part="label"]'
      && /"label": \{ content: "C", attrs: \{ "style": "[^"]*color: var\(--red\)/.test(o) && toParity(r, 'row', { naming: CLASS, library: lib(r) }).layers['Item#2 > Label'].skip, JSON.stringify(m) + o); }
  { const filled = { ...item, anatomy: { ...item.anatomy, label: { ...item.anatomy.label, background: 'Fill/accent', radius: 4 } } };
    const r = row({ item_2: { kind: 'instance', parent: 'root', order: 1, component: 'Item', with: {} }, 'item_2/label': { kind: 'text', parent: 'item_2', order: 0, content: 'C' } });
    const o = toElement(r, 'row', { naming: ELEMENT, library: { ...lib(r), Item: filled } });
    ok('parts: a paint the placed part draws that the design takes away inside a copy is unset inline, never its radius', /"label": \{[^}]*"style": "[^"]*background[\w-]*: unset/.test(o) && !/radius[\w-]*: unset/.test(o), o); }
  const hid = row({ 'item/label': { kind: 'text', parent: 'item', order: 0, content: 'A' } });
  { const d = await run(hid);
    ok('parts: a part the instance hides (kept whole, the part not drawn) is taken away', !find(d, (x) => x.tag === 'ds-trail') && find(d, (x) => x.attrs['data-part'] === 'label').textContent === 'A'); }
  { const shown = { ...item, props: { showTrail: { type: 'boolean', default: true, figma: 'Show trail', shows: ['trail'] } } };
    const r = row({ 'item/label': { kind: 'text', parent: 'item', order: 0, content: 'A' } }), out = toElement(r, 'row', { naming: ELEMENT, library: { ...lib(r), Item: shown } });
    ok('parts: a part a prop of it shows, which the instance says is shown, is not taken away (a reading would take the prop off)', !/hidden: true/.test(out), out); }
  { const boxed = { component: 'Boxed', folder: 'boxed', props: {}, anatomy: { root: { kind: 'container' }, box: { kind: 'container', parent: 'root', order: 0, layout: { direction: 'row', gap: 4 } }, 'box/label': { kind: 'text', parent: 'box', order: 0, content: 'A' } }, variants: [] };
    const r = { component: 'Row', folder: 'row', props: {}, variants: [], anatomy: { root: { kind: 'container' }, item: { kind: 'instance', parent: 'root', component: 'Boxed', with: {} }, 'item/box': { kind: 'container', parent: 'item', order: 0, layout: { direction: 'row', gap: 4 } }, 'item/box/note': { kind: 'text', parent: 'item/box', order: 1, content: 'N', color: 'Text/strong' } } };
    const L = { Boxed: boxed, Row: r }, dir = path.join(tmp, 'added'); fs.mkdirSync(dir); fs.writeFileSync(path.join(dir, 'dom.js'), DOM);
    for (const c of Object.values(L)) { fs.mkdirSync(path.join(dir, c.folder)); fs.writeFileSync(path.join(dir, c.folder, `${c.folder}.js`), toElement(c, c.folder, { naming: ELEMENT, library: L })); }
    const out = toElement(r, 'row', { naming: ELEMENT, library: L }), d = (await import(path.join(dir, 'row', 'row.js'))).renderRow(), box = find(d, (x) => x.attrs['data-part'] === 'box');
    const note = box && box.kids[1];
    ok('parts: a layer the placed component has no part for is drawn into the part it sits in, at its place, its look said on it', !!note && note.attrs['data-part'] === 'note' && note.textContent === 'N' && /color: var\(--text-strong\)/.test(note.attrs.style || '') && !/Note: drawn here/.test(out), out);
    const ls = toParity(r, 'row', { naming: ELEMENT, library: L, framework: 'web-components' }).layers;
    ok('parts: the mapping reads such a layer under the part it is added to, by the name it is drawn with', ls['Item > Box > Note'] === `${ls['Item > Box']} > [data-part="note"]` && typeof ls['Item > Box'] === 'string', JSON.stringify(ls)); }
  const byProp = row({ 'item/label': { kind: 'text', parent: 'item', order: 0, content: 'B' } }, { big: { type: 'boolean', default: false, figma: 'Big' } }, [{ when: { big: true }, set: { 'item/label.content': 'C' } }]);
  { const a = find(await run(byProp), (x) => x.attrs['data-part'] === 'label').textContent, b = find(await run(byProp, { big: true }), (x) => x.attrs['data-part'] === 'label').textContent;
    ok('parts: what they carry follows this component\'s own props, as each variant draws it', a === 'B' && b === 'C', `${a} ${b}`); }
  { const both = row({ 'item/label': { kind: 'text', parent: 'item', order: 0, content: 'B' } }, { big: { type: 'boolean', default: false, figma: 'Big' }, loud: { type: 'boolean', default: false, figma: 'Loud' } },
      [{ when: { big: true }, set: { 'item/label.content': 'C' } }, { when: { loud: true }, add: { 'item/trail': { kind: 'instance', parent: 'item', order: 1, component: 'Trail', with: { Tone: 'Loud' } } } }]);
    const d = await run(both, { big: true, loud: true }), l = find(d, (x) => x.attrs['data-part'] === 'label').textContent, t = find(d, (x) => x.tag === 'ds-trail').attrs.tone;
    ok('parts: where two variants hold together, the combination draws what each sets, never only the first one\'s', l === 'C' && t === 'loud', `${l} ${t}`); }
  { const d = (await import(path.join(tmp, '0', 'item', 'item.js'))).renderItem();
    ok('parts: a call without them draws the component as it always did', find(d, (x) => x.attrs['data-part'] === 'label').textContent === 'A' && find(d, (x) => x.tag === 'ds-trail').attrs.tone === 'plain'); }
  delete globalThis.document; fs.rmSync(tmp, { recursive: true, force: true });
}
const renamed = { component: 'Tag', props: {}, anatomy: { root: { kind: 'container' }, mark: { kind: 'graphic', parent: 'root', name: 'Icon' } }, variants: [], folder: 'tag' };
ok('a layer whose name its id does not give back carries the design\'s name (data-figma-name)', /"data-part": "mark", "data-figma-name": "Icon"/.test(toElement(renamed, 'tag', { naming: ELEMENT, library: {} })));
{ const flush = { ...renamed, props: { flush: { type: 'boolean', default: false, figma: 'Flush' } }, variants: [{ when: { flush: true }, set: { 'mark.name': null } }] };
  const out = toReact(flush, 'tag', { naming: CLASS, library: {} });
  ok('a name a variant takes away is empty there, the design\'s elsewhere: the reading names the layer as each combination does', /data-figma-name=\{flush \? "" : "Icon"\}/.test(out), out); }
// a part only variants add, under a name of its own in one and none in another (a spacer's "Rectangle " at one size)
{ const sized = { ...renamed, props: { size: { type: 'enum', values: ['s', 'm', 'l'], default: 's', figma: 'Size' } }, anatomy: { root: { kind: 'container' } },
    variants: [{ when: { size: 'm' }, add: { mark: { kind: 'graphic', parent: 'root' } } }, { when: { size: 'l' }, add: { mark: { kind: 'graphic', parent: 'root', name: 'Rectangle ' } } }] };
  const out = toReact(sized, 'tag', { naming: CLASS, library: {} });
  ok('a part variants add under names of their own carries each add\'s name there, none where it has none', out.includes('(size === "l") ? "Rectangle " : ') && out.includes('(size === "m") ? ""'), out); }
// an add after a rename, both at one combination: the later one names the part there, as expand applies them
{ const later = { ...renamed, props: { tone: { type: 'enum', values: ['a', 'b'], default: 'a', figma: 'Tone' }, size: { type: 'enum', values: ['s', 'l'], default: 's', figma: 'Size' } }, anatomy: { root: { kind: 'container' }, mark: { kind: 'graphic', parent: 'root', name: 'Mark' } },
    variants: [{ when: { tone: 'b' }, set: { 'mark.name': 'Bar' } }, { when: { size: 'l' }, add: { mark: { kind: 'graphic', parent: 'root', name: 'Rectangle ' } } }] };
  const out = toReact(later, 'tag', { naming: CLASS, library: {} });
  const back = { ...later, variants: [later.variants[0], { when: { size: 'l' }, add: { mark: { kind: 'graphic', parent: 'root', name: 'Mark' } } }] };
  const outBack = toReact(back, 'tag', { naming: CLASS, library: {} });
  ok('…and an add under the part\'s own name after a rename gives that name back there', /data-figma-name=\{\(size === "l"\) \? "Mark" : \(\(tone === "b"\) \? "Bar" : "Mark"\)\}/.test(outBack), outBack);
  ok('an add after a rename names the part where both hold, as the design applies them', /data-figma-name=\{\(size === "l"\) \? "Rectangle " : \(\(tone === "b"\) \? "Bar" : "Mark"\)\}/.test(out), out); }
// a rename a variant sets where an add gives its own name: the rename is the layer's name there
{ const both = { ...renamed, props: { size: { type: 'enum', values: ['s', 'm', 'l'], default: 's', figma: 'Size' } }, anatomy: { root: { kind: 'container' } },
    variants: [{ when: { size: 'm' }, add: { mark: { kind: 'graphic', parent: 'root' } } }, { when: { size: 'l' }, add: { mark: { kind: 'graphic', parent: 'root', name: 'Rectangle ' } } }, { when: { size: 'l' }, set: { 'mark.name': 'Bar' } }] };
  const out = toReact(both, 'tag', { naming: CLASS, library: {} });
  ok('a rename set where an add names its part wins there', /data-figma-name=\{\(size === "l"\) \? "Bar" : /.test(out), out); }
const quoted = { ...renamed, anatomy: { root: { kind: 'container' }, mark: { kind: 'graphic', parent: 'root', name: 'Say "hi" {x}' }, label: { kind: 'text', parent: 'root', content: 'Tag' } } };
const placedNamed = { component: 'Row', props: {}, anatomy: { root: { kind: 'container' }, lead: { kind: 'instance', parent: 'root', component: 'Pill', name: 'Leading pill' } }, variants: [], folder: 'row' };
ok('the name travels in React too, braced where it holds quotes, on a placed component, and a part with no name has none',
  /data-figma-name=\{"Say \\"hi\\" \{x\}"\}/.test(toReact(quoted, 'tag', { naming: CLASS, library: {} }))
  && /<Pill className="[^"]*" data-figma-name="Leading pill"/.test(toReact(placedNamed, 'row', { naming: CLASS, library: { Pill: pill, Row: placedNamed } }))
  && (toReact(quoted, 'tag', { naming: CLASS, library: {} }).match(/data-figma-name/g) || []).length === 1);
ok('no condition loses its brackets to the not before it', folders.every((f) => !/!\w+ ===/.test(toReact(library[Object.keys(library).find((k) => library[k].folder === f)], f, { naming: CLASS, library }))));

/* ── what a real library taught it: a contract for each shape, as the snapshot writes them ── */
const glyph = (name) => ({ kind: 'instance', component: `Icon/${name}`, with: { Size: '16' } });
const shapes = {
  'Icon button': { component: 'Icon button', props: {
    icon20: { type: 'instance', figma: 'Icon (20)', swaps: ['content/icon'] }, icon16: { type: 'instance', figma: 'Icon (16)', swaps: ['content/icon'] },
    disabled: { type: 'boolean', default: false, figma: 'Disabled', axis: true },
  }, anatomy: { root: { kind: 'container' }, content: { kind: 'container', parent: 'root' }, 'content/icon': { ...glyph('plus'), parent: 'content' } } },
  Field: { component: 'Field', props: {
    placeholder: { type: 'string', default: 'Search', figma: 'Placeholder', sets: ['box/placeholder'] }, value: { type: 'string', figma: 'Value', sets: ['box/value'] },
    hasValue: { type: 'boolean', default: false, figma: 'Has value', axis: true },
  }, anatomy: { root: { kind: 'container' }, box: { kind: 'container', parent: 'root' }, 'box/placeholder': { kind: 'text', parent: 'box', content: 'Search' } },
  variants: [{ when: { hasValue: true }, add: { 'box/value': { kind: 'text', parent: 'box', content: 'Value' } }, remove: ['box/placeholder'] }] },
  Stepper: { component: 'Stepper', props: {
    showNote: { type: 'boolean', default: true, figma: 'Show note', shows: ['note'] },
    showMore: { type: 'boolean', default: false, figma: 'Show more', shows: ['more', 'more/hint'] },
    actionsSlot: { type: 'slot', figma: 'Actions slot' },
    state: { type: 'enum', values: ['rest', 'focus'], default: 'rest', figmaValues: ['Rest', 'Focus'], role: 'interaction', pointer: ['focus'], figma: 'State' },
  }, anatomy: {
    root: { kind: 'container' },
    less: { kind: 'instance', component: 'Icon button', parent: 'root', order: 0, with: { 'Icon (20)': 'plus', 'Icon (16)': 'minus', Disabled: 'True' } },
    'less/content/icon': { ...glyph('minus'), parent: 'less/content' },
    find: { kind: 'instance', component: 'Field', parent: 'root', order: 1, with: { Value: 'Ada', 'Has value': 'False' } },
    note: { kind: 'text', parent: 'root', order: 2, content: 'Note' },
    chevron: { ...glyph('chevron-down'), parent: 'root', order: 3 },
  }, variants: [
    { when: { showMore: true }, add: { more: { kind: 'container', parent: 'root', order: 4 }, 'more/hint': { kind: 'text', parent: 'more', content: 'Hint' }, 'showMoreActionsSlot': { kind: 'slot', parent: 'root', order: 5 } } },
    { when: { showNote: false }, remove: ['note'] },
    { when: { state: 'focus' }, remove: ['chevron'], add: { 'less/inner/actionsSlot': { kind: 'slot', parent: 'less' } } },
  ] },
};
const iconButton = toReact(shapes['Icon button'], 'icon-button', { naming: CLASS, library: shapes });
ok('an icon Figma keeps one swap of for each size is one icon prop in code, named without its size', /icon\?: string;/.test(iconButton) && !/icon16|icon20/.test(iconButton));
ok('a control that draws no words requires its name by its type (code-standard rule 18), and its stories give it one', /& \{ 'aria-label': string \};/.test(iconButton) && /"aria-label":"Icon button"/.test(toStories(shapes['Icon button'], 'icon-button', 'react', { library: shapes })) && /It draws no words: give it its name/.test(toElement(shapes['Icon button'], 'icon-button', { naming: ELEMENT, library: shapes })));
const stepper = toReact(shapes.Stepper, 'stepper', { naming: CLASS, library: shapes });
ok('a placed icon is the one the instance draws, and the placed control is named, a gap saying by what', /<IconButton className="ds-stepper__less" icon="minus" disabled aria-label="minus" \/>/.test(stepper) && /frontend-build: Less: its aria-label is the icon's name/.test(stepper));
ok('a placed field is given its Value only where it is drawn holding one, and then as its first value, never a controlled one', /<Field className="ds-stepper__find" \/>/.test(stepper) && !/ value=/.test(stepper));
ok('a part inside a box drawn under the same condition is not asked it again', /<div className="ds-stepper__more">\n\s*<span className="ds-stepper__hint">/.test(stepper));
ok('a part a "not not" would draw is drawn by the value itself', /\{showNote && \(/.test(stepper) && !/!!/.test(stepper));
ok('a slot a boolean shows is found under its own name, never a placed component\'s slot of the same name', /<div className="ds-stepper__show-more-actions-slot" data-slot="actionsSlot">\{actionsSlot\}<\/div>/.test(stepper));
ok('a part a pointer state takes away stays, a gap saying so', /chevron-down/.test(stepper) && /frontend-build: Chevron is taken away at a pointer state/.test(stepper));
{ const border = { kind: 'graphic', parent: 'root', position: 'absolute', absolute: { x: 0, y: 0, end: 0, bottom: 0 } };
  const tile = { component: 'Tile', props: { kind: { type: 'enum', values: ['plain', 'framed'], default: 'plain' }, state: { type: 'enum', values: ['rest', 'hover'], default: 'rest', role: 'interaction', pointer: ['hover'] } },
    anatomy: { root: { kind: 'container' }, label: { kind: 'text', parent: 'root', content: 'Tile' } }, variants: [{ when: { kind: 'framed' }, add: { border } }, { when: { state: 'hover' }, add: { border } }] };
  const el = toElement(tile, 'tile', { naming: ELEMENT, library: {} });
  ok('a part a pointer state also puts in is held wherever that state draws it, a gap saying the sheet shows it', /\n\s*h\("span", \{ "data-part": "border"/.test(el) && !/kind === "framed"\) && h\("span", \{ "data-part": "border"/.test(el) && /Border is also drawn at a pointer state/.test(el) && Array.isArray(partsOf(tile).get('border').pointerShown));
  // a part only a pointer state draws (a fill at hover): held, at the values that state is drawn with, the sheet's to show
  { const only = { ...tile, variants: [{ when: { state: 'hover', kind: 'framed' }, add: { border } }] };
    const oe = toElement(only, 'tile', { naming: ELEMENT, library: {} });
    ok('a part only a pointer state draws is held where that state draws it, a gap saying the sheet shows it there',
      /kind === "framed"\) && h\("span", \{ "data-part": "border"/.test(oe) && /Border is drawn only at a pointer state: held here/.test(oe) && !/frontend-build: Border, drawn only/.test(oe) && partsOf(only).get('border').pointerHeld); }
  // (a base part the rest take out at a size and a pointer state puts back: held at that size too, as the gap says)
  const icon = { ...tile, anatomy: { ...tile.anatomy, icon: { kind: 'container', parent: 'root' } }, variants: [{ when: { kind: 'framed' }, remove: ['icon'] }, { when: { state: 'hover' }, add: { icon: { kind: 'container', parent: 'root' } } }] };
  const ie = toElement(icon, 'tile', { naming: ELEMENT, library: {} });
  ok('a base part a pointer state puts back over a removal is held past that removal', /\n\s*h\("div", \{ "data-part": "icon"/.test(ie) && !/framed"\)\) && h\("div", \{ "data-part": "icon"/.test(ie) && /Icon is also drawn at a pointer state/.test(ie));
  // (a base part nothing removes, which a pointer state adds again: the sheet hides nothing, so no gap)
  const kept = toElement({ ...icon, variants: [icon.variants[1]] }, 'tile', { naming: ELEMENT, library: {} });
  ok('a base part no variant removes is no pointer-shown gap', !/Icon is also drawn at a pointer state/.test(kept)); }
ok('every placed component the markup draws is imported, and only those', /import \{ IconButton \}/.test(stepper) && /import \{ Field \}/.test(stepper) && (stepper.match(/^import \{/gm) || []).length === 2);
ok('a component with no props of its own has no empty type for them', /export type NoteProps = ComponentPropsWithRef<"span">;/.test(toReact({ component: 'Note', props: {}, anatomy: { root: { kind: 'container' } } }, 'note', { naming: CLASS, library: {} })) && !/type Own = \{\s*\};/.test(toReact({ component: 'Note', props: {}, anatomy: { root: { kind: 'container' } } }, 'note', { naming: CLASS, library: {} })));
ok('a project\'s story types are its Storybook framework\'s, read from its package.json', storybookOf({ devDependencies: { '@storybook/nextjs-vite': '9' } }) === '@storybook/nextjs-vite' && storybookOf({}) === '@storybook/react' && /from '@storybook\/react-vite'/.test(toStories(library.Button, 'button', 'react', { library, storybook: '@storybook/react-vite' })));

/* ── a contract written to break out of a comment, and the shapes a review found ── */
const OUT = '*/ globalThis.q=1; /*';
const hostile = { component: 'Tile', props: {
  label: { type: 'string', default: OUT, figma: 'Label', sets: ['label'] },
  tone: { type: 'enum', values: ['a', OUT], default: 'a', figma: 'Tone' },
  count: { type: 'number', default: '0); globalThis.q=1; (0', figma: 'Count' },
  style: { type: 'enum', values: ['filled', 'outlined'], default: 'filled', figma: 'Style' },
  onClick: { type: 'event' }, changed: { type: 'event' },
  state: { type: 'enum', values: ['rest', 'hover', 'loading'], default: 'rest', role: 'interaction', pointer: ['hover'], figma: 'State' },
}, anatomy: { root: { kind: 'container' }, label: { kind: 'text', parent: 'root', content: 'x' }, mark: { kind: 'instance', component: `Icon/${OUT}`, parent: 'root' } },
variants: [{ when: { state: 'hover' }, add: { label: { kind: 'text', parent: 'root', content: 'y' } } }] };
const bare = (code) => code.replace(/"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`(?:[^`\\]|\\.)*`/g, '""').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
const tileReact = toReact(hostile, 'tile-button', { naming: CLASS, library: {} }), tileEl = toElement(hostile, 'tile-button', { naming: ELEMENT, library: {} });
ok('words from the design never end a comment early: none of them is code in either framework\'s file', !bare(tileReact).includes('globalThis.q') && !bare(tileEl).includes('globalThis.q'), bare(tileEl));
{
  const f = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'to-markup-parse-')), 'tile.mjs');
  fs.writeFileSync(f, tileEl);
  let parsed = true; try { execFileSync(process.execPath, ['--check', f], { stdio: 'pipe' }); } catch { parsed = false; }
  ok('and the web component\'s file parses as a module', parsed);
}
ok('a number is a number in code, whatever the design wrote', /count = 0,/.test(tileReact));
ok('a prop spelt as a name the generated code binds is renamed, never bound twice', /restOption/.test(toReact({ component: 'R', props: { rest: { type: 'string', default: 'x', figma: 'Rest', sets: ['t'] } }, anatomy: { root: { kind: 'container' }, t: { kind: 'text', parent: 'root' } } }, 'r', { naming: CLASS, library: {} })));
ok('a DOM handler is the element\'s own, passed with the rest and named once; another event is taken, never reaching an element', (tileReact.match(/\bonClick\b(?!=)/g) || []).length >= 1 && !/onClick, [^}]*onClick,/.test(tileReact) && /changed: _changed/.test(tileReact) && /frontend-build: changed: when it fires/.test(tileReact));
ok('a prop named as an HTML attribute is never the host\'s own attribute', /"data-style": styleOption/.test(tileEl) && !/[{ ,]style: styleOption/.test(tileEl));
ok('a part a pointer state draws again is read without fault', /ds-tile-button__label|data-part": "label"/.test(tileReact + tileEl));
{
  const sheet = toCss({ ...hostile, anatomy: { ...hostile.anatomy, root: { kind: 'container', opacity: 1 } }, variants: [{ when: { tone: OUT }, set: { 'root.opacity': 0.5 } }] }, 'tile-button', { naming: CLASS });
  const notes = sheet.split('\n').filter((l) => l.startsWith('/*'));
  ok('and the stylesheet\'s comments too: each ends only where it is meant to', notes.some((l) => l.includes('globalThis')) && notes.every((l) => l.indexOf('*/') === l.length - 2), notes.join('\n'));
}
{
  // a Figma boolean New or Default is camel-cased into a word JavaScript keeps; a rename lands on no prop's own name
  const words = { component: 'W', props: { new: { type: 'boolean', default: false, figma: 'New' }, default: { type: 'boolean', default: true, figma: 'Default' }, type: { type: 'string', default: 'a', figma: 'Type', sets: ['t'] }, typeOption: { type: 'string', default: 'b', figma: 'Type option', sets: ['u'] }, onPress: { type: 'event' } },
    anatomy: { root: { kind: 'container' }, t: { kind: 'text', parent: 'root' }, u: { kind: 'text', parent: 'root' } } };
  const f = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'to-markup-words-')), 'w.mjs');
  fs.writeFileSync(f, toElement(words, 'w', { naming: ELEMENT, library: {} }));
  let parsed = true; try { execFileSync(process.execPath, ['--check', f], { stdio: 'pipe' }); } catch { parsed = false; }
  const r = toReact(words, 'w', { naming: CLASS, library: {} });
  ok('a prop named as a word JavaScript keeps, or as another prop\'s renamed name, still parses', parsed && /newOption/.test(r) && /defaultOption/.test(r) && /typeOption2/.test(r));
  ok('an event the DOM does not know (onPress) is the component\'s own, a gap, never a listener', /frontend-build: onPress: when it fires/.test(r));
}

/* ── what to-markup refuses ── */
ok('React markup is refused element naming, a web component class naming: the sheet would style neither', /class/.test(throws(() => filesFor(library.Button, 'button', { framework: 'react', naming: ELEMENT, library }))) && /element/.test(throws(() => filesFor(library.Button, 'button', { framework: 'web-components', naming: CLASS, library }))));
ok('a custom element with no hyphen in its name is refused (HTML: a valid custom element name)', /hyphen/.test(throws(() => filesFor(library.Button, 'button', { framework: 'web-components', naming: { kind: 'element', prefix: '' }, library }))));
ok('a prop whose name code cannot use is refused, never written into code', /not a name code can use/.test(throws(() => propsOf({ component: 'X', props: { 'a}b': { type: 'string' } }, anatomy: { root: { kind: 'container' } } }))));

/* ── a contract written to break it: words that are code, a text entry ── */
const EVIL = '</span>{boom}${x}`<img src=x onerror="window.__xss=1">\'"';
const evil = { component: 'Quote\'s "Field"', props: {
  placeholder: { type: 'string', default: EVIL, figma: 'Placeholder', sets: ['field/placeholder'] },
  value: { type: 'string', default: 'Ada', figma: 'Value', sets: ['field/value'] },
  filled: { type: 'boolean', default: false, figma: 'Filled' },
  disabled: { type: 'boolean', default: false, figma: 'Disabled', axis: true },
  role: { type: 'enum', values: ['plain', 'boxed'], default: 'plain', figma: 'Role', axis: true },
}, anatomy: {
  root: { kind: 'container', layout: { direction: 'column', gap: 4 } },
  field: { kind: 'container', parent: 'root', order: 0, layout: { direction: 'row', gap: 4 }, border: { color: 'Color/Border/default', width: 1 } },
  'field/placeholder': { kind: 'text', parent: 'field', order: 0, content: EVIL, color: 'Color/Text/secondary', typography: 'Body/md' },
  note: { kind: 'text', parent: 'root', order: 1, content: EVIL },
}, variants: [{ when: { filled: true }, add: { 'field/value': { kind: 'text', parent: 'field', order: 0, content: 'Ada', color: 'Color/Text/primary', typography: 'Body/md' } }, remove: ['field/placeholder'] }] };
const field = toReact(evil, 'quotes-field', { naming: CLASS, library: {} });
ok('a text entry is one input that takes the rest of the props and the ref; the root keeps the class and style', /export type QuoteSFieldProps = Own & Omit<ComponentPropsWithRef<"input">, keyof Own>;/.test(field) && /<input \{\.\.\.rest\} className="ds-quotes-field__input" placeholder=\{placeholder\}/.test(field) && /<div className=\{cx\("ds-quotes-field", className\)\} style=\{style\}/.test(field));
ok('its has-a-value is the input\'s own, never a prop; its Value the input\'s value, never a default', !/filled/.test(field.split('export function')[1]) && !/value =/.test(field) && !/value\?:/.test(field));
ok('words from the design reach the code only as string literals, whatever they hold', field.includes(`{${JSON.stringify(EVIL)}}`) && !field.includes('{boom}}') && !/`<img/.test(field.split('\n').filter((l) => !l.includes('@default')).join('\n').replace(/"(?:[^"\\]|\\.)*"/g, '""')));
const fieldStories = toStories(evil, 'quotes-field', 'react', {});
ok('a component name with quotes is a string literal in its story\'s title', fieldStories.includes(`title: ${JSON.stringify('Design system/Quote\'s "Field"')}`));
const fieldParity = toParity(evil, 'quotes-field', { naming: CLASS, framework: 'react' });
ok('its mapping fills the input to draw has-a-value, and maps both texts to the input the sheet styles', JSON.stringify(fieldParity.axes.Filled) === JSON.stringify({ True: { defaultValue: 'Ada' }, False: {} }) && fieldParity.layers['Field > Placeholder'] === '.ds-quotes-field > .ds-quotes-field__field > .ds-quotes-field__input');
const sheet = toCss(evil, 'quotes-field', { naming: CLASS });
ok('and to-code styles that input and its placeholder by the same selectors: the hooks are one', sheet.includes(`${fieldParity.layers['Field > Value']} {`) && sheet.includes(`${fieldParity.layers['Field > Value']}::placeholder {`));

/* ── a variant that places a sibling of its own set (a wide screen holding a narrow one) calls its own function ── */
{
  const screen = { contract: 1, component: 'Screen', props: { size: { type: 'enum', values: ['wide', 'narrow'], default: 'wide', figma: 'Size' } },
    anatomy: { root: { kind: 'container' }, inner: { kind: 'instance', parent: 'root', component: 'Screen', with: { Size: 'narrow' } } },
    variants: [{ when: { size: 'narrow' }, remove: ['inner'] }] };
  const js = toElement(screen, 'screen', { naming: ELEMENT, library: { Screen: { ...screen, folder: 'screen' } } });
  ok('a component placing a sibling of its own set does not import itself', !/import \{ renderScreen \}/.test(js) && /export function renderScreen\(/.test(js) && /placed\(parts\["[^"]*"\], renderScreen, \{ size: "narrow"/.test(js));
}

/* ── what a component puts in a placed component's slot (a menu's items) ── */
{
  const item = { contract: 1, component: 'Item', props: { label: { type: 'string', default: 'Item', figma: 'Label', sets: ['text'] } }, anatomy: { root: { kind: 'container' }, text: { kind: 'text', parent: 'root', content: '{label}' } }, variants: [] };
  const menu = { contract: 1, component: 'Menu', props: { items: { type: 'slot', figma: 'Items' } }, anatomy: { root: { kind: 'container' }, list: { kind: 'slot', parent: 'root', content: '{items}' } }, variants: [] };
  const bar = { contract: 1, component: 'Bar', props: {}, anatomy: { root: { kind: 'container' }, menu: { kind: 'instance', parent: 'root', component: 'Menu', with: {} }, 'menu/list': { kind: 'slot', parent: 'menu', content: '{items}' }, 'menu/list/item': { kind: 'instance', parent: 'menu/list', component: 'Item', with: { Label: 'One' }, order: 0 }, 'menu/list/item_2': { kind: 'instance', parent: 'menu/list', component: 'Item', with: { Label: 'Two' }, order: 1 } }, variants: [] };
  const lib = { Item: { ...item, folder: 'item' }, Menu: { ...menu, folder: 'menu' }, Bar: { ...bar, folder: 'bar' } };
  const el = toElement(bar, 'bar', { naming: ELEMENT, library: lib });
  ok('what a component puts in a placed component\'s slot is that slot\'s content, each its own component', /placed\(parts\["[^"]*"\], renderMenu, \{[^}]*items: \[placed\(parts\["[^"]*"\], renderItem, \{ label: "One" \}[^\]]*placed\(parts\["[^"]*"\], renderItem, \{ label: "Two" \}/.test(el) && /import \{ renderItem \}/.test(el));
  ok('and in React, the slot prop holds them', /<Menu[^>]*items=\{<>[\s\S]*<Item[^>]*label="One"[\s\S]*<\/>\}/.test(toReact(bar, 'bar', { naming: CLASS, library: lib })));
  const grouped = { ...bar, props: { big: { type: 'boolean', default: false, axis: true, figma: 'Big' } }, anatomy: { ...bar.anatomy, 'menu/list/group': { kind: 'container', parent: 'menu/list', order: 2 }, 'menu/list/group/item': { kind: 'instance', parent: 'menu/list/group', component: 'Item', with: { Label: 'Three' } } },
    variants: [{ when: { big: true }, add: {} }] };
  const g = toElement(grouped, 'bar', { naming: ELEMENT, library: lib });
  ok('a box it puts there keeps what it holds', /h\("div", \{ "data-part": "group" \},\s*placed\(parts\["[^"]*"\], renderItem, \{ label: "Three" \}/.test(g) && toParity(grouped, 'bar', { naming: ELEMENT, library: lib, framework: 'web-components' }).layers['Menu > List > Group > Item'] === 'ds-bar > [data-part="menu"] > [data-part="list"] > [data-part="group"] > [data-part="menu-list-group-item"]');
  const titled = { contract: 1, component: 'Panel', props: { title: { type: 'slot', figma: 'Title' } }, anatomy: { root: { kind: 'container' }, head: { kind: 'slot', parent: 'root', content: '{title}' } }, variants: [] };
  ok('a slot is marked by its contract name, whatever its name in code', /"data-slot": "title"/.test(toElement(titled, 'panel', { naming: ELEMENT, library: {} })));
  // what the design holds in a slot is its fallback, drawn while the caller passes nothing (a <slot>'s own content), each
  // part under its own conditions and words, and mapped by its own selector, so the self leg reads it back
  { const held = { ...titled, props: { body: { type: 'slot', figma: 'Body' }, heading: { type: 'string', default: 'Heading', figma: 'Heading', sets: ['head/words'] }, more: { type: 'boolean', default: false, figma: 'More' } },
      anatomy: { ...titled.anatomy, head: { kind: 'slot', parent: 'root', content: '{body}' }, 'head/words': { kind: 'text', parent: 'head', order: 0, content: '{heading}' } },
      variants: [{ when: { more: true }, add: { 'head/extra': { kind: 'text', parent: 'head', order: 1, content: 'Extra' } } }] };
    const el = toElement(held, 'panel', { naming: ELEMENT, library: {} }), re = toReact(held, 'panel', { naming: CLASS, library: {} }), kb = toSnippet(held, 'panel', { naming: KIRBY, library: {} });
    ok('a slot\'s sample is drawn while the caller passes nothing', /body,\s*\(body == null\) && h\("span", \{ "data-part": "words" \},\s*heading\)/.test(el) && /\(body == null && \(more\)\) && h\("span", \{ "data-part": "extra" \}/.test(el), el);
    ok('in React and a snippet too', /\{body == null && \(\s*<span className="ds-panel__words">\{heading\}<\/span>/.test(re) && /<\?php if \(\$slots->body\(\) == null\): \?>/.test(kb), re);
    ok('the sample is mapped by its own selector, never skipped', toParity(held, 'panel', { naming: ELEMENT, library: {}, framework: 'web-components' }).layers['Head > Words'] === 'ds-panel > [data-part="head"] > [data-part="words"]');
    ok('a slot holding a sample says so to its reader', propsOf(held, {}).find((x) => x.key === 'body').sample === true && !propsOf(titled, {}).find((x) => x.key === 'title').sample); }
  // a variant that draws the slot elsewhere (a dialog's content moved to the root when immersive): that part shows the slot too
  { const moved = { ...titled, props: { ...titled.props, wide: { type: 'boolean', default: false, axis: true, figma: 'Wide' } }, anatomy: { ...titled.anatomy, box: { kind: 'container', parent: 'root' }, 'box/head': { kind: 'slot', parent: 'box', content: '{title}' } },
      variants: [{ when: { wide: true }, add: { head: { kind: 'slot', parent: 'root', content: '{title}' } }, remove: ['box/head'] }] };
    delete moved.anatomy.head;
    const m = toElement(moved, 'panel', { naming: ELEMENT, library: {} });
    ok('a slot a variant draws in another place is a slot there too, marked by the same name', (m.match(/"data-slot": "title"/g) || []).length === 2);
    // drawn beside the first, not in its place, it is not the slot a second time
    const beside = { ...moved, variants: [{ when: { wide: true }, add: { head: { kind: 'slot', parent: 'root', content: '{title}' } } }] };
    // a swap of a drawing whose main takes no props: taken by name, as an icon, not as a slot that loses its default
    { const es = { contract: 1, component: 'Empty', props: { graphic: { type: 'instance', figma: 'Graphic', swaps: ['art'] } }, anatomy: { root: { kind: 'container' }, art: { kind: 'instance', parent: 'root', component: 'Graphic/ghost', width: 120, height: 120 } }, variants: [] };
      const lib = { 'Graphic/ghost': { contract: 1, component: 'Graphic/ghost', props: {}, anatomy: { root: { kind: 'container' } }, variants: [] } };
      const out = toElement(es, 'empty', { naming: ELEMENT, library: lib });
      ok('a swap of a drawing with no props of its own is taken by name, its default drawn', /graphic = "Graphic\/ghost"/.test(out) && /"data-icon": graphic/.test(out) && !/data-slot/.test(out));
      const worded = { 'Graphic/ghost': { ...lib['Graphic/ghost'], anatomy: { root: { kind: 'container' }, label: { kind: 'text', parent: 'root' } } } };
      ok('a component with no props but words of its own is no drawing: placed by the caller', !/"data-icon": graphic/.test(toElement(es, 'empty', { naming: ELEMENT, library: worded }))); }
    ok('a second part beside the slot\'s own is not the slot again', (toElement(beside, 'panel', { naming: ELEMENT, library: {} }).match(/"data-slot": "title"/g) || []).length === 1); }
  ok('the mapping reads them under that slot', toParity(bar, 'bar', { naming: ELEMENT, library: lib, framework: 'web-components' }).layers['Menu > List > Item'] === 'ds-bar > [data-part="menu"] > [data-part="list"] > [data-part="item"]');
}

// an instance of a component the library does not hold, though its name says button, is drawn as a mark: the mapping
// reads that mark, never a <button> inside it the markup does not draw; one the library holds is reached through its
// control, as its own sheet draws it
{ const save = { contract: 1, component: 'Save button', props: {}, anatomy: { root: { kind: 'container' } }, variants: [] };
  const card = { contract: 1, component: 'Card', props: {}, anatomy: { root: { kind: 'container' },
    action: { kind: 'instance', parent: 'root', component: 'Reply button', order: 0 }, save: { kind: 'instance', parent: 'root', component: 'Save button', order: 1 } }, variants: [] };
  const lib = { 'Save button': { ...save, folder: 'save-button' }, Card: { ...card, folder: 'card' } };
  const m = toParity(card, 'card', { naming: ELEMENT, library: lib, framework: 'web-components' }), out = toElement(card, 'card', { naming: ELEMENT, library: lib });
  ok('a part placing a component the library does not hold is mapped to the mark the markup draws; one it holds through its control',
    /"data-part": "action"[^)]*"data-icon"/.test(out) && m.layers.Action === 'ds-card > [data-part="action"]' && m.layers.Save === 'ds-card > [data-part="save"] > button');
  // with no library given, the markup draws every placed instance as a mark, so the mapping reaches none through a button
  const bare = toParity(card, 'card', { naming: ELEMENT, framework: 'web-components' }), bareOut = toElement(card, 'card', { naming: ELEMENT, library: {} });
  ok('with no library, every placed instance is a mark, in the markup and the mapping alike',
    /"data-part": "save"[^)]*"data-icon"/.test(bareOut) && bare.layers.Action === 'ds-card > [data-part="action"]' && bare.layers.Save === 'ds-card > [data-part="save"]'); }
// a placed component this one draws in its own slot's sample (a card's avatar), its insides listed: each read under
// that instance by its component's own part names, as one placed outside a slot is; one placed in a placed component's
// slot stays its fill's
{ const avatar = { contract: 1, component: 'Avatar', props: {}, anatomy: { root: { kind: 'container' }, disc: { kind: 'graphic', parent: 'root', order: 0 } }, variants: [] };
  const card = { contract: 1, component: 'Card', props: { content: { type: 'slot', figma: 'Content' } }, anatomy: { root: { kind: 'container' },
    content: { kind: 'slot', parent: 'root', order: 0, content: '{content}' }, 'content/row': { kind: 'container', parent: 'content', order: 0 },
    'content/row/avatar': { kind: 'instance', parent: 'content/row', component: 'Avatar', order: 0 }, 'content/row/avatar/disc': { kind: 'graphic', parent: 'content/row/avatar', order: 0 } }, variants: [] };
  const lib = { Avatar: { ...avatar, folder: 'avatar' }, Card: { ...card, folder: 'card' } };
  const m = toParity(card, 'card', { naming: ELEMENT, library: lib, framework: 'web-components' }).layers;
  ok('a part inside a placed component in a slot\'s sample is mapped under that instance by its own name, never skipped',
    m['Content > Row > Avatar > Disc'] === 'ds-card > [data-part="content"] > [data-part="row"] > [data-part="avatar"] > [data-part="disc"]', JSON.stringify(m));
  // (a slot a placed instance holds is that one's: what sits in it is its fill, never this one's sample)
  const list = { contract: 1, component: 'List', props: { items: { type: 'slot', figma: 'Items' } }, anatomy: { root: { kind: 'container' }, items: { kind: 'slot', parent: 'root', order: 0, content: '{items}' } }, variants: [] };
  const page = { contract: 1, component: 'Page', props: {}, anatomy: { root: { kind: 'container' }, list: { kind: 'instance', parent: 'root', component: 'List', order: 0 },
    'list/items': { kind: 'slot', parent: 'list', order: 0 }, 'list/items/avatar': { kind: 'instance', parent: 'list/items', component: 'Avatar', order: 0 }, 'list/items/avatar/disc': { kind: 'graphic', parent: 'list/items/avatar', order: 0 } }, variants: [] };
  const lib2 = { Avatar: lib.Avatar, List: { ...list, folder: 'list' }, Page: { ...page, folder: 'page' } };
  ok('…never one inside a placed component a placed instance\'s slot holds: that stays its fill\'s',
    sampleSelector(page, namer('page', ELEMENT), 'list/items/avatar/disc', (n) => lib2[n] || null, lib2) === null && sampleSelector(card, namer('card', ELEMENT), 'content/row/avatar/disc', (n) => lib[n] || null, lib) !== null); }
// whether a placed component is held is one question, asked of the library the markup is given, by the markup and the
// sheet alike: never the sheet's own lookup, which is case-blind and holds no name two contracts share. Two contracts of
// one name (the library keeps one) and two names that differ only in case each read the same on both sides
{ const { byComponentName } = (await import('node:module')).createRequire(import.meta.url)('./derive.cjs');
  const close = (name, k) => ({ contract: 1, component: name, figma: { key: k }, props: {}, anatomy: { root: { kind: 'container' } }, variants: [] });
  const card = { contract: 1, component: 'Card', props: {}, anatomy: { root: { kind: 'container', layout: { direction: 'row', gap: 4 } },
    close: { kind: 'instance', parent: 'root', component: 'Close button', order: 0, width: 24 } }, variants: [] };
  const agree = (all) => {
    const library = Object.fromEntries(all.map((x) => [x.component, { ...x, folder: x.component.toLowerCase().replace(/ /g, '-') }]));
    const markup = toElement(card, 'card', { naming: ELEMENT, library }), sheet = toCss(card, 'card', { naming: ELEMENT, mains: byComponentName(all), library });
    const mark = /"data-part": "close"[^)]*"data-icon"/.test(markup), button = /\[data-part="close"\] > button/.test(sheet);
    return /\[data-part="close"\]/.test(sheet) && mark === !button;
  };
  ok('two contracts of one name: the markup and the sheet agree whether it is held', agree([close('Close button', 'a'), close('Close button', 'b'), card]));
  ok('two names one only in case: the markup and the sheet agree whether it is held', agree([close('Close Button', 'a'), close('Close button', 'b'), card])); }
// and every question after it: a part inside a placed component the library holds, overridden there, is styled by the
// selector the mapping names it by, the placed component's own part under the instance, never a holder id of its own
{ const { drawnAll } = await import('./site.mjs');
  const close = (name, k) => ({ contract: 1, component: name, folder: name.toLowerCase().replace(/ /g, '-') + k, figma: { key: k }, props: {},
    anatomy: { root: { kind: 'container', layout: { direction: 'row' } }, label: { kind: 'text', parent: 'root', order: 0, content: 'x', color: 'A' } }, variants: [] });
  const card = { contract: 1, component: 'Card', folder: 'card', props: {}, anatomy: { root: { kind: 'container', layout: { direction: 'row', gap: 4 } },
    close: { kind: 'instance', parent: 'root', component: 'Close button', order: 0 }, 'close/label': { kind: 'text', parent: 'close', order: 0, content: 'x', color: 'B' } }, variants: [] };
  const library = { 'Close Button': close('Close Button', 'a'), 'Close button': close('Close button', 'b'), Card: card };
  const d = drawnAll(library, { dir: null }).card, sel = d.parts['close/label'];
  ok('a part overridden inside a held placed component: the sheet styles it by the selector the mapping names it by',
    !!sel && d.sheet.includes(`${sel} {`), JSON.stringify({ sel, parts: d.parts, sheet: d.sheet })); }

/* ── the mapping and the stories ── */
const parity = toParity(library.Button, 'button', { naming: CLASS, library });
const every = Object.entries(library.Button.props).filter(([, p]) => p.type === 'enum' || p.axis || (p.shows || []).length || p.role === 'interaction');
ok('the mapping names every option of every axis, so the run measures the whole set (code-standard rule 33)', every.every(([, p]) => parity.axes[p.figma] && Object.keys(parity.axes[p.figma]).length === (p.type === 'boolean' ? 2 : p.values.length)));
ok('a pointer state is forced on the element that takes it; a state the product sets is an arg by its name in code', parity.state === '.ds-button' && parity.axes.State.Hover.pseudo === 'hover' && parity.axes.State.Focus.pseudo === 'focus-visible' && parity.axes.State.Loading.state === 'loading' && parity.axes.Role.Secondary.appearance === 'secondary');
ok('its layers are the stored paths, by the sheet\'s own selectors; the ring the root; a part kept inside a placed component by that component\'s own name (Glyph, its Icon renamed in the instance)', parity.layers['Content > Label'] === '.ds-button > .ds-button__content > .ds-button__label' && parity.layers['Focus ring'] === '.ds-button' && parity.layers['Content > Spinner > Glyph'] === '.ds-button > .ds-button__content > .ds-button__spinner > .ds-icon-container__icon');
ok('one whose component the library does not hold is that component\'s, not read here', toParity(library.Button, 'button', { naming: CLASS, library: {} }).layers['Content > Spinner > Glyph'].skip);
// a part of a placed component at the props one variant places it with is that component's, though another variant
// places it at props that draw none (a status icon's Warning--filled at Failed, gone at Warning alt): read, not skipped
{ const status = { contract: 1, component: 'Status', props: { status: { type: 'enum', values: ['failed', 'alt'], figmaValues: ['Failed', 'Alt'], default: 'failed', figma: 'Status' } },
    anatomy: { root: { kind: 'container' }, fill: { kind: 'graphic', parent: 'root', order: 0 }, warn: { kind: 'graphic', parent: 'root', order: 1, background: 'C/red' } },
    variants: [{ when: { status: 'alt' }, remove: ['warn'], add: { alt: { kind: 'graphic', parent: 'root', order: 1, background: 'C/amber' } } }] };
  const field = { contract: 1, component: 'Field', props: { state: { type: 'enum', values: ['plain', 'warning', 'error'], figmaValues: ['Plain', 'Warning', 'Error'], default: 'plain', figma: 'State' } }, anatomy: { root: { kind: 'container' } },
    variants: [{ when: { state: 'warning' }, add: { status: { kind: 'instance', parent: 'root', component: 'Status', with: { Status: 'Alt' }, order: 0 }, 'status/fill': { kind: 'graphic', parent: 'status', order: 0 }, 'status/alt': { kind: 'graphic', parent: 'status', order: 1, background: 'C/amber' } } },
      { when: { state: 'error' }, add: { status: { kind: 'instance', parent: 'root', component: 'Status', with: { Status: 'Failed' }, order: 0 }, 'status/fill': { kind: 'graphic', parent: 'status', order: 0 }, 'status/warn': { kind: 'graphic', parent: 'status', order: 1, background: 'C/red' } } }] };
  const ls = toParity(field, 'field', { naming: ELEMENT, library: { Status: { ...status, folder: 'status' }, Field: { ...field, folder: 'field' } }, framework: 'web-components' }).layers;
  ok('a part a placed component draws at the props one variant places it with is read there, though another places it without', ls['Status > Warn'] === 'ds-field > [data-part="status"] > [data-part="warn"]' && ls['Status > Alt'] === 'ds-field > [data-part="status"] > [data-part="alt"]', JSON.stringify(ls)); }
// two parts at one stored path (a select's two ✏️ {value} texts, never drawn together): the mapping keeps that one path, as
// parity reads it (#2 is the second drawn in one variant), and hands each part's selector by its id beside it, unwritten
{ const sel = { contract: 1, component: 'Pick', props: { search: { type: 'boolean', default: false, figma: 'Search' } },
    anatomy: { root: { kind: 'container' }, box: { kind: 'container', parent: 'root', order: 0 }, 'box/value': { kind: 'text', parent: 'box', name: '✏️ {value}', content: 'A', order: 0 } },
    variants: [{ when: { search: true }, remove: ['box/value'], add: { 'box/searchValue': { kind: 'text', parent: 'box', name: '✏️ {value}', content: 'B', order: 0 } } }] };
  const m = toParity(sel, 'pick', { naming: ELEMENT, library: {}, framework: 'web-components' });
  ok('two parts at one stored path each keep their selector by id', !!m.byId && /search-value/.test(m.byId['box/searchValue']) && !!m.byId['box/value'] && !/search-value/.test(m.byId['box/value']));
  ok('and no path the store does not hold is written for them', Object.keys(m.layers).join(',') === 'Box,Box > ✏️ {value}' && !JSON.stringify(m).includes('byId')); }
const rows = toParity(library['Nav panel'], 'nav-panel', { naming: ELEMENT, library, framework: 'web-components' }).layers;
ok('a repeat is its place among its own, whatever else the box holds', rows['List > Item#2'] === 'ds-nav-panel > [data-part="list"] > [data-part="item"]:nth-child(2 of [data-part="item"])');
ok('the story id is Storybook\'s for the title, a platform\'s library its own', toParity(library.Button, 'button', { naming: CLASS, library, platform: 'web' }).storyId === 'design-system-button-web--default' && storyIdOf('Design system/Nav item', 'Default') === 'design-system-nav-item--default');
const stories = toStories(library.Button, 'button', 'react', { library });
ok('stories: typed by satisfies, the accessibility check failing the run, one for each value and each yes-or-no', /satisfies Meta<typeof Button>;/.test(stories) && /a11y: \{ test: 'error' \}/.test(stories) && ['ShowIcon', 'SizeSm', 'AppearanceSecondary', 'Disabled', 'StateLoading'].every((s) => new RegExp(`export const ${s}: Story = \\{ args`).test(stories)));
const files = filesFor(library.Button, 'button', { framework: 'react', naming: CLASS, library });
ok('a folder gets the component, its mapping and its stories, each with the banner; the stories export no mapping', Object.keys(files).join() === 'button.tsx,parity.mjs,button.stories.tsx' && Object.values(files).every((b) => b.includes(BANNER)) && !/parity/.test(files['button.stories.tsx']));

/* ── the CLI: a repo's components folder, its framework and naming from its config ── */
const cli = (repo) => execFileSync(process.execPath, [fileURLToPath(new URL('./to-markup.mjs', import.meta.url)), '--repo', repo], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
const repoWith = (config) => { const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'to-markup-')); fs.writeFileSync(path.join(repo, 'snapshot.config.json'), JSON.stringify(config)); fs.cpSync(DIR, path.join(repo, 'components'), { recursive: true }); return repo; };
{
  const repo = repoWith({ framework: 'react', paths: { components: 'components', componentStyles: 'styles' }, styles: { naming: CLASS } });
  try {
    fs.writeFileSync(path.join(repo, 'components', 'badge', 'badge.tsx'), '// by hand\n');
    const out = cli(repo);
    ok('the CLI writes every component\'s folder, and keeps a file the project took over', new RegExp(`${folders.length * 3 - 1} file\\(s\\) written, 1 kept, react`).test(out) && fs.readFileSync(path.join(repo, 'components', 'badge', 'badge.tsx'), 'utf8') === '// by hand\n', out);
    ok('a component imports the sheet to-code writes, by its path from the folder', fs.readFileSync(path.join(repo, 'components', 'button', 'button.tsx'), 'utf8').includes('import "../../styles/button.css";'));
  } finally { fs.rmSync(repo, { recursive: true, force: true }); }
  const wc = repoWith({ framework: 'web-components', paths: { components: 'components' }, styles: { naming: ELEMENT } });
  try {
    ok('for web components it writes the one helper every component builds with, beside them', /written, 0 kept, web-components/.test(cli(wc)) && fs.readFileSync(path.join(wc, 'components', 'dom.js'), 'utf8') === DOM);
  } finally { fs.rmSync(wc, { recursive: true, force: true }); }
  const kirby = repoWith({ framework: 'kirby', paths: { components: 'components' }, styles: { naming: KIRBY } });
  try {
    const out = cli(kirby);
    ok('for Kirby it writes each folder\'s snippet, mapping and gallery story file, and no helper of its own', new RegExp(`${folders.length * 3} file\\(s\\) written, 0 kept, kirby`).test(out) && fs.existsSync(path.join(kirby, 'components', 'button', 'button.php')) && fs.existsSync(path.join(kirby, 'components', 'button', 'button.stories.php')) && fs.existsSync(path.join(kirby, 'components', 'button', 'parity.mjs')) && !fs.existsSync(path.join(kirby, 'components', 'dom.js')), out);
  } finally { fs.rmSync(kirby, { recursive: true, force: true }); }
  const wrong = repoWith({ framework: 'react', paths: { components: 'components' }, styles: { naming: ELEMENT } });
  try {
    let said = '';
    try { cli(wrong); } catch (e) { said = String(e.stderr); }
    ok('a repo whose naming its framework\'s markup cannot carry is refused, saying what to set', /naming's kind to "class"/.test(said), said);
  } finally { fs.rmSync(wrong, { recursive: true, force: true }); }
}

/* ── a Kirby snippet: written as text, linted and rendered by PHP, through the scaffold's own helper ── */
const hasPhp = (() => { try { execFileSync('php', ['-v'], { stdio: 'pipe' }); return true; } catch { return false; } })();
// a folder of snippets as the scaffold lays them out, and a renderer standing in for Kirby's snippet(), esc() and
// $slots; ds_attrs() is the scaffold's own, read from its plugin
const PLUGIN = fs.readFileSync(fileURLToPath(new URL('../../skills/frontend-build/assets/design-system-scaffold/plugin/index.php', import.meta.url)), 'utf8');
const ATTRS = /function __PREFIX___attrs[\s\S]*?\n\}\n/.exec(PLUGIN)[0].replaceAll('__PREFIX__', 'ds');
const RENDER = `<?php
// a notice or a warning (a variable read before it is set) fails the render
error_reporting(E_ALL); set_error_handler(function ($n, $s, $f, $l) { throw new ErrorException("$s at $f:$l"); });
function esc($s, $context = 'html') { return htmlspecialchars((string) $s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'); }
${ATTRS}
class NoSlots { public function __call($name, $args) { return null; } }
function snippet($name, $data = []) {
  $__file = $GLOBALS['DIR'] . '/' . substr($name, 3) . '/' . substr($name, 3) . '.php';
  (function () use ($__file, $data) { extract($data); $slots = new NoSlots(); $slot = null; include $__file; })();
}
$DIR = $argv[1];
$out = [];
foreach (json_decode(stream_get_contents(STDIN), true) as [$name, $data]) { ob_start(); snippet('ds/' . $name, $data); $out[] = ob_get_clean(); }
echo json_encode($out);
`;
const snippets = (contracts) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'to-markup-kirby-'));
  for (const [folder, c] of contracts) { fs.mkdirSync(path.join(dir, folder), { recursive: true }); fs.writeFileSync(path.join(dir, folder, `${folder}.php`), toSnippet(c, folder, { naming: KIRBY, library })); }
  fs.writeFileSync(path.join(dir, 'render.php'), RENDER);
  return dir;
};
const render = (dir, jobs) => JSON.parse(execFileSync('php', [path.join(dir, 'render.php'), dir], { input: JSON.stringify(jobs), encoding: 'utf8' }));
// a tree as one string: each element, its attributes in name order, its words; whitespace between elements left out
const CANON = `function canon(n) { return n.nodeType === 3 ? (n.data.trim() ? JSON.stringify(n.data) : '') : n.nodeType !== 1 ? '' : '<' + n.localName + [...n.attributes].map((a) => ' ' + a.name + '=' + JSON.stringify(a.value)).sort().join('') + '>' + [...n.childNodes].map(canon).join('') + '</' + n.localName + '>'; }`;
const lints = (file) => { try { execFileSync('php', ['-l', file], { stdio: 'pipe' }); return true; } catch { return false; } };

const snip = toSnippet(library.Button, 'button', { naming: KIRBY, library });
ok('Kirby: the host carries the variant, the native button inside it the behaviour, as the scaffold\'s worked button does', /<ds-button [^\n]*data-size="<\?= esc\(\$size, 'attr'\) \?>"[^\n]*<\?= \$hostAttrs \?>>\n  <button type=/.test(snip));
ok('Kirby: every value is escaped for where it lands: an attribute\'s for an attribute, the text\'s for text', /<\?= esc\(\$label\) \?>/.test(snip) && [...snip.matchAll(/<\?= (\$\w+) \?>/g)].every((m) => ['$restAttrs', '$hostAttrs'].includes(m[1])));
ok('Kirby: Disabled is the button\'s own, busy its aria-disabled, and the click a busy button refuses a gap for the page\'s script', /<\?= \$disabled \? ' disabled' : '' \?>/.test(snip) && /<\?= \$state === 'loading' \? ' aria-disabled="true"' : '' \?>/.test(snip) && /frontend-build: state: the page's script refuses the click/.test(snip));
ok('Kirby: a placed component is its own snippet, given its values by its names and the part\'s hook as its host', /<\?php snippet\('ds\/icon-container', \['icon' => 'loader-circle', 'size' => '16', 'host' => \['data-part' => 'spinner'\]\]\) \?>/.test(snip));
ok('Kirby: what a caller adds reaches the button through the scaffold\'s helper, and the host through its own', /\$restAttrs = ds_attrs\(\$attrs \?\? \[\]\);/.test(snip) && /\$hostAttrs = ds_attrs\(\$host \?\? \[\]\);/.test(snip));
ok('Kirby: a slot is Kirby\'s own, a named one by its prop', /<\?= \$slots->actionsSlot\(\) \?>/.test(toSnippet(shapes.Stepper, 'stepper', { naming: KIRBY, library: shapes })));
{
  const r = toSnippet({ component: 'Pager', props: { page: { type: 'string', default: '1', figma: 'Page', sets: ['t'] }, site: { type: 'boolean', default: false, figma: 'Site' } }, anatomy: { root: { kind: 'container' }, t: { kind: 'text', parent: 'root' } } }, 'pager', { naming: KIRBY, library: {} });
  ok('Kirby: a prop named as a variable Kirby hands every snippet is renamed, never read as Kirby\'s', /\$pageOption = \$pageOption \?\? '1';/.test(r) && /\$siteOption/.test(r) && !/\$page\b/.test(r));
}
ok('Kirby: its mapping takes the args by the snippet\'s names, and is the web component\'s where the two agree', JSON.stringify(toParity(library.Button, 'button', { naming: KIRBY, library, framework: 'kirby' })) === JSON.stringify(toParity(library.Button, 'button', { naming: KIRBY, library, framework: 'web-components' })));
ok('Kirby: the prefix is one word and a hyphen, the scaffold\'s snippet folder and helper', /one word/.test(namingFault('kirby', { kind: 'element', prefix: 'my-ds-' })) && /element/.test(namingFault('kirby', CLASS)) && namingFault('kirby', KIRBY) === null);
const gallery = toGallery(library.Button, { library });
ok('Kirby: the gallery\'s story file offers a control for each value and each yes-or-no, at its default', /'size' => \['type' => 'select', 'options' => \['sm', 'md'\], 'default' => 'md'\]/.test(gallery) && /'showIcon' => \['type' => 'boolean', 'default' => false\]/.test(gallery) && /'tier'     => 'Native interactive'/.test(gallery));
if (!hasPhp) ok('PHP is here to lint and render the snippets (none found: install PHP)', false);
else {
  const dir = snippets(Object.values(library).map((c) => [c.folder, c]));
  try {
    ok('Kirby: every sample snippet and story file parses', Object.values(library).every((c) => lints(path.join(dir, c.folder, `${c.folder}.php`)) && (fs.writeFileSync(path.join(dir, 'g.php'), toGallery(c, { library })), lints(path.join(dir, 'g.php')))));
    // a PHP string closed early, a tag closed and another opened, a comment ended: run, any would shout
    const RUN = `\\'.strtoupper('pwned').'`, TAG = "?><?php echo strtoupper('pwned'); ?>", END = "*/ echo strtoupper('pwned'); /*";
    const loud = { component: `Loud ${END}`, props: {
      label: { type: 'string', default: `${RUN}${TAG}`, figma: 'Label', sets: ['label'] },
      tone: { type: 'enum', values: ['a', RUN], default: RUN, figma: 'Tone' },
      count: { type: 'number', default: `0; echo strtoupper('pwned');`, figma: `Count ${END}` },
      title: { type: 'string', default: TAG, figma: `Title ${END}`, sets: ['note'] },
    }, anatomy: { root: { kind: 'container' }, label: { kind: 'text', parent: 'root', content: 'x' }, note: { kind: 'text', parent: 'root', content: TAG }, mark: { kind: 'instance', component: `Icon/${TAG}${END}`, parent: 'root' } } };
    fs.mkdirSync(path.join(dir, 'loud'));
    fs.writeFileSync(path.join(dir, 'loud', 'loud.php'), toSnippet(loud, 'loud', { naming: KIRBY, library: {} }));
    fs.writeFileSync(path.join(dir, 'loud', 'loud.stories.php'), toGallery(loud, {}));
    const [said] = render(dir, [['loud', {}]]);
    const story = execFileSync('php', ['-r', `var_export(require ${phpQuote(path.join(dir, 'loud', 'loud.stories.php'))});`], { encoding: 'utf8' });
    ok('Kirby: words from the design never close a string, a tag or a comment: nothing they say runs', lints(path.join(dir, 'loud', 'loud.php')) && !said.includes('PWNED') && !story.includes('PWNED') && said.includes('strtoupper'), said);
    fs.mkdirSync(path.join(dir, 'quotes-field'));
    fs.writeFileSync(path.join(dir, 'quotes-field', 'quotes-field.php'), toSnippet(evil, 'quotes-field', { naming: KIRBY, library: {} }));
    const [empty, filled] = render(dir, [['quotes-field', {}], ['quotes-field', { value: 'Ada', attrs: { autocomplete: 'name' } }]]);
    ok('Kirby: a text entry is one input, its value the snippet\'s own and there only when given, the caller\'s attrs on it', /<input data-part="input" placeholder="[^"]*"( |>)/.test(empty) && !/ value=/.test(empty) && /<input [^>]* value="Ada"[^>]* autocomplete="name">/.test(filled), `${empty}\n${filled}`);
    const [evilSaid] = render(dir, [['button', { label: EVIL }]]);
    ok('Kirby: words given it are text, never markup', !/<img/.test(evilSaid) && evilSaid.includes('&lt;img'));
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
}
function phpQuote(s) { return `'${s.replace(/[\\']/g, (m) => `\\${m}`)}'`; }

/* ── the web components in Chrome ── */
if (!fs.existsSync(findChrome())) ok('Chrome is here to render the web components in (none found: install Chrome, the toolkit\'s one browser)', false);
else {
  // the page: each component's markup, its generated sheet, and the sample's tokens as custom properties
  const tokens = JSON.parse(fs.readFileSync(path.join(SAMPLE, 'tokens.json'), 'utf8'));
  const vars = [];
  for (const col of Object.values(tokens.collections)) for (const [name, v] of Object.entries(col.values[col.modes[0]])) vars.push(`${cssName('', name)}: ${typeof v === 'number' ? (/opacity/i.test(name) ? v : `${v}px`) : v};`);
  for (const t of tokens.textStyles) { const b = cssName('', t.name); vars.push(`${b}-font-family: ${t.family};`, `${b}-font-size: ${t.size}px;`, `${b}-font-weight: ${t.weight};`, `${b}-line-height: ${t.lineHeight}px;`, `${b}-letter-spacing: ${t.letterSpacing}px;`); }
  const files = siteFiles(library, { tokensCss: `:root { ${vars.join(' ')} }` });
  const css = files['all.css'];
  const site = await serveSite(files);
  const browser = await launch({});
  try {
    const tab = await attach(await newPage(browser.endpoint));
    await navigate(tab, `${site.url}index.html`);
    for (let i = 0; i < 50 && !(await tab.evaluate('!!window.ready')); i++) await new Promise((r) => setTimeout(r, 100));
    ok('every generated web component loads as a module, through the one helper', await tab.evaluate('Object.values(window.R).every((f) => typeof f === "function")'), tab.trouble.join('\n'));
    // the probe below reads a token as the sheet does, so a misnamed one would agree with itself: every token the sheets
    // name must be one the token build defines (the component's own knobs, --ds-*, are the caller's to set)
    const named = [...new Set([...css.matchAll(/var\((--[\w-]+)/g)].map((m) => m[1]).filter((v) => !v.startsWith('--ds-')))];
    const undefinedTokens = await tab.evaluate(`${JSON.stringify(named)}.filter((v) => !getComputedStyle(document.documentElement).getPropertyValue(v))`);
    ok(`every token the generated sheets name (${named.length}) is one the token build defines`, named.length > 0 && undefinedTokens.length === 0, undefinedTokens.join(', '));
    // what a part is drawn as and what the sheet does to it, held to what the contract draws there: each declaration
    // to-code writes is set on a probe beside the part, and the part's computed value must be the probe's
    const LAYOUT = /^(width|height|inline-size|block-size|min-|max-|flex|order|align-self|inset|top|left|right|bottom|position|translate|z-index|margin|overflow|aspect-ratio)/;
    const compare = `(sel, decls) => { const el = document.querySelector(sel); if (!el) return ['missing']; const probe = document.createElement('x-probe'); el.parentElement.append(probe); const wrong = [];
      // all of them at once, as the sheet sets them: a unitless line-height reads the font-size beside it
      for (const [p, v] of decls) probe.style.setProperty(p, v);
      const longs = (p, v) => { const s = document.createElement('x-probe').style; s.setProperty(p, v); return [...s]; };
      for (const [p, v] of decls) for (const l of longs(p, v)) { if (${LAYOUT}.test(l)) continue; const a = getComputedStyle(el).getPropertyValue(l), b = getComputedStyle(probe).getPropertyValue(l); if (a !== b) wrong.push(l + ': ' + a + ' where the contract draws ' + b); }
      probe.remove(); return wrong; }`;
    let parts = 0, styled = 0, combos = 0, unshown = 0;
    // each combination's tree as the web component built it, to hold the Kirby snippet to (below)
    const trees = [];
    const wrong = [];
    for (const c of Object.values(library)) {
      const nm = namer(c.folder, ELEMENT), props = propsOf(c, library), byKey = new Map(props.map((x) => [x.key, x]));
      const dflt = variantDefaults(c), all = partsOf(c), entry = entryOf(c);
      for (const m of combinations(c)) {
        const full = { ...dflt, ...m };
        const pointer = Object.entries(full).find(([k, v]) => ((c.props[k] || {}).pointer || []).includes(v));
        const args = {};
        let drawable = true;
        for (const [k, v] of Object.entries(full)) { const x = byKey.get(k); if (entry && k === entry.flag) { if (v === entry.on) args.value = 'Value'; } else if (x) args[x.name] = v; else if (!pointer || k !== pointer[0]) drawable = drawable && v === (c.props[k] || {}).default; }
        if (pointer) args[byKey.get(pointer[0]) ? byKey.get(pointer[0]).name : '_'] = c.props[pointer[0]].default;
        // a disabled control takes neither hover nor focus, in the browser or in the sheet: a combination no page shows
        if (pointer && Object.keys(full).some((k) => /^disabled$/i.test(k) && full[k] === true)) { unshown++; continue; }
        if (!drawable) continue;
        combos++;
        await tab.evaluate(`document.getElementById('stage').replaceChildren(window.R[${JSON.stringify(c.folder)}](${JSON.stringify(args)}))`);
        // (a pointer state with no name in code is handed as `_`, which reaches the host as an attribute: the sweep's own)
        if (!('_' in args)) trees.push([c.folder, args, await tab.evaluate(`(${CANON})(document.getElementById('stage').firstChild)`)]);
        if (pointer) await forceState(tab, [{ selector: partSelector(c, nm, 'root'), pseudo: { hover: 'hover', focus: 'focus-visible', press: 'active' }[pointer[1]] }]);
        const there = new Set(Object.keys(expand(c, full)));
        for (const part of all.values()) {
          // what a pointer state adds or takes away is the stylesheet's or a gap; a field's two texts are its one input
          if (part.id === 'root' || part.inside || part.ring || part.slotted || part.pointerOnly || (pointer && part.pointerGone) || (entry && (part.id === entry.value || part.id === entry.placeholder))) continue;
          const got = await tab.evaluate(`!!document.querySelector(${JSON.stringify(partSelector(c, nm, part.id, part, library))})`);
          parts++;
          if (there.has(part.id) !== got) wrong.push(`${c.component} at ${JSON.stringify(m)}: ${part.id} ${got ? 'drawn where the contract draws none' : 'missing'}`);
        }
        for (const [id, { decls }] of Object.entries(drawn(c, full))) {
          const part = all.get(id.split('::')[0]);
          if (id.includes('/*') || id.includes('::') || (part && (part.inside || part.slotted || part.pointerOnly || part.ring || (pointer && part.pointerGone)))) continue;
          const said = await tab.evaluate(`(${compare})(${JSON.stringify(partSelector(c, nm, id, part, library))}, ${JSON.stringify([...decls].map(([p, d]) => [p, d.v]))})`);
          styled++;
          if (said.length) wrong.push(`${c.component} at ${JSON.stringify(m)}: ${id}: ${said.join('; ')}`);
        }
      }
    }
    ok('the sweep measured something: combinations, parts and declarations', combos > 0 && parts > 0 && styled > 0);
    ok(`each web component draws each part where its contract does (${parts} part-combinations) and styled as it draws it (${styled} parts' declarations), at ${combos} combinations, pointer states forced (${unshown} a disabled control's hover or focus, which no page shows)`, wrong.length === 0, wrong.slice(0, 8).join('\n'));

    // the Kirby snippet, rendered by PHP at the same combinations, is the web component's tree: so what the sweep above
    // proves of one, it proves of the other (the whitespace between elements aside, which a flex box ignores)
    if (hasPhp) {
      const dir = snippets(Object.values(library).map((c) => [c.folder, c]));
      try {
        const html = render(dir, trees.map(([folder, args]) => [folder, args]));
        const off = [];
        for (let i = 0; i < trees.length; i++) {
          const got = await tab.evaluate(`(() => { const s = document.getElementById('stage'); s.innerHTML = ${JSON.stringify(html[i])}; return (${CANON})(s.firstElementChild); })()`);
          if (got !== trees[i][2]) off.push(`${trees[i][0]} at ${JSON.stringify(trees[i][1])}:\n  web component ${trees[i][2]}\n  snippet       ${got}`);
        }
        ok(`each Kirby snippet renders its web component's tree, element for element, attribute for attribute, word for word, at all ${trees.length} combinations`, trees.length > 0 && off.length === 0, off.slice(0, 3).join('\n'));
      } finally { fs.rmSync(dir, { recursive: true, force: true }); }
    }

    // the button as a person and a screen reader meet it
    const ax = async (sel) => { const { root } = await tab.send('DOM.getDocument', { depth: 0 }); const { nodeId } = await tab.send('DOM.querySelector', { nodeId: root.nodeId, selector: sel }); const { nodes } = await tab.send('Accessibility.getPartialAXTree', { nodeId, fetchRelatives: false }); return nodes[0]; };
    const show = (folder, args = {}, host = {}) => tab.evaluate(`(() => { window.clicks = 0; document.getElementById('stage').replaceChildren(window.R[${JSON.stringify(folder)}](Object.assign(${JSON.stringify(args)}, { onClick: () => window.clicks++ }), ${JSON.stringify(host)})); })()`);
    await show('button', { label: 'Save', 'aria-describedby': 'hint' }, { 'data-part': 'action' });
    const node = await ax('ds-button > button');
    ok('the button is a button named by its label, to a screen reader', node.role.value === 'button' && node.name.value === 'Save');
    ok('the first argument\'s other values reach the native button, the second\'s the host', await tab.evaluate(`document.querySelector('ds-button > button').getAttribute('aria-describedby') === 'hint' && document.querySelector('ds-button').dataset.part === 'action'`));
    ok('the native button is the one tab stop: the host has no tabindex and no role', await tab.evaluate(`(() => { const h = document.querySelector('ds-button'); return !h.hasAttribute('tabindex') && !h.hasAttribute('role') && h.tabIndex === -1 && h.querySelector('button').tabIndex === 0; })()`));
    ok('a click on it runs the handler it was given, once', await tab.evaluate(`(() => { document.querySelector('ds-button > button').click(); return window.clicks === 1; })()`));
    await show('button', { state: 'loading' });
    ok('busy, it stays focusable and refuses its action', await tab.evaluate(`(() => { const b = document.querySelector('ds-button > button'); b.focus(); b.click(); return document.activeElement === b && !b.disabled && b.getAttribute('aria-disabled') === 'true' && window.clicks === 0; })()`) && (await ax('ds-button > button')).name.value === 'Label');
    await show('button', { disabled: true });
    ok('disabled, it is the native button\'s own, out of the tab order', await tab.evaluate(`(() => { const b = document.querySelector('ds-button > button'); b.focus(); return b.disabled && document.activeElement !== b; })()`));
    await show('button', {}, { hidden: true });
    ok('a hidden host hides its button, though the host has no box of its own (code-standard rule 17)', await tab.evaluate(`!document.querySelector('ds-button > button').checkVisibility()`));
    await show('button', { label: EVIL });
    ok('words given it are text, never markup: nothing they say is parsed or run', await tab.evaluate(`!document.querySelector('#stage img') && !window.__xss && document.querySelector('ds-button [data-part="label"]').textContent === ${JSON.stringify(EVIL)}`));
    await tab.evaluate(`document.getElementById('stage').replaceChildren(window.R['contact-card']({ nameOption: ${JSON.stringify(EVIL)} }))`);
    ok('and so in a component that places others', await tab.evaluate(`!document.querySelector('#stage img') && document.querySelector('#stage').textContent.includes(${JSON.stringify(EVIL)})`));
  } finally { await browser.close(); await site.close(); }
}

// a value a variant sets on a placed component goes with this component's props: a flag that follows one is that prop,
// any other a choice by them; a variant at a prop code has no name for leaves the base's
{
  const check = { contract: 1, component: 'Check', props: { selected: { type: 'boolean', default: false, figma: 'Selected' }, tone: { type: 'enum', values: ['plain', 'loud'], figmaValues: ['Plain', 'Loud'], default: 'plain', figma: 'Tone' } }, anatomy: { root: { kind: 'container' } }, variants: [{ when: { tone: 'loud' }, set: { 'root.background': 'C/loud' } }] };
  const row = { contract: 1, component: 'Row', props: { on: { type: 'boolean', default: false, figma: 'On' }, size: { type: 'enum', values: ['s', 'l'], figmaValues: ['S', 'L'], default: 's', figma: 'Size' }, state: { type: 'enum', role: 'interaction', values: ['rest', 'hover'], figmaValues: ['Rest', 'Hover'], default: 'rest', figma: 'State', pointer: ['hover'] } },
    anatomy: { root: { kind: 'container' }, check: { kind: 'instance', parent: 'root', component: 'Check', with: { Selected: 'False', Tone: 'Plain' } } },
    variants: [{ when: { size: 'l' }, set: { 'check.with': { Selected: 'False', Tone: 'Loud' } } }, { when: { state: 'hover' }, set: { 'check.with': { Selected: 'False', Tone: 'Loud' } } }, { when: { on: true }, set: { 'check.with': { Selected: 'True', Tone: 'Plain' } } }] };
  const lib = { Check: { ...check, folder: 'check' }, Row: { ...row, folder: 'row' } };
  const r = toReact(lib.Row, 'row', { naming: CLASS, library: lib }), w = toElement(lib.Row, 'row', { naming: ELEMENT, library: lib });
  ok('a flag a variant sets on a placed component follows the prop that sets it', /<Check [^>]*selected=\{on\}/.test(r) && /placed\(parts\["[^"]*"\], renderCheck, \{ selected: on,/.test(w));
  ok('any other value a variant sets is a choice by the props, a later layer first, the base\'s elsewhere, and a pointer state\'s is not the markup\'s', /tone=\{on \? "plain" : \(\(size === "l"\) \? "loud" : "plain"\)\}/.test(r) && !/state ===/.test(r));
  // overlapping variants resolve as the props do: a later one over an earlier, so a pair outranks the one it narrows, and
  // one that gives back the base's value still outranks what it follows
  const pair = { ...lib.Row, variants: [{ when: { size: 'l' }, set: { 'check.with': { Selected: 'False', Tone: 'Loud' } } }, { when: { size: 'l', on: true }, set: { 'check.with': { Selected: 'False', Tone: 'Plain' } } }] };
  const rp = toReact(pair, 'row', { naming: CLASS, library: { ...lib, Row: pair } });
  ok('a later variant outranks an earlier one it overlaps, even one that gives back the base\'s value', /tone=\{\(size === "l" && on\) \? "plain" : \(\(?size === "l"\)? \? "loud" : "plain"\)\}/.test(rp));
  // a combination is drawn alone, the first that holds: one stating nothing here still shadows a later one that does
  const combo = { ...lib.Row, variants: [{ when: { on: true }, set: { 'check.with': { Selected: 'False', Tone: 'Loud' } } }, { when: { size: 'l' }, combination: true, set: { 'root.opacity': 0.5 } }, { when: { size: 'l', on: true }, combination: true, set: { 'check.with': { Selected: 'True', Tone: 'Loud' } } }] };
  const rc = toReact(combo, 'row', { naming: CLASS, library: { ...lib, Row: combo } });
  ok('a combination that holds and states nothing on a placed component shadows a later one that does', /selected=\{\(?size === "l"\)? \? false : \(\(?size === "l" && on\)? \? true : false\)\}/.test(rc));
  // a layer's with replaces the one before it whole: what it leaves out is the placed component's default there
  const cleared = { ...lib.Row, variants: [{ when: { size: 'l' }, set: { 'check.with': { Selected: 'False', Tone: 'Loud' } } }, { when: { on: true }, set: { 'check.with': { Selected: 'True' } } }] };
  ok('a later layer\'s with that leaves a prop out gives that prop back to the placed component\'s default', /tone=\{on \? undefined : \(\(size === "l"\) \? "loud" : "plain"\)\}/.test(toReact(cleared, 'row', { naming: CLASS, library: { ...lib, Row: cleared } })));
  const reset = { ...lib.Row, variants: [{ when: { size: 'l' }, set: { 'check.with': { Selected: 'False', Tone: 'Loud' } } }, { when: { on: true }, set: { 'check.with': null } }] };
  ok('a layer that sets with to null draws the placed component at its own defaults there', /tone=\{on \? undefined : \(\(size === "l"\) \? "loud" : "plain"\)\}/.test(toReact(reset, 'row', { naming: CLASS, library: { ...lib, Row: reset } })));
  // a layer at a prop code has no name for, at its default, always holds in the markup: it ends the choice
  const always = { ...lib.Row, variants: [{ when: { on: true }, set: { 'check.with': { Selected: 'False', Tone: 'Loud' } } }, { when: { state: 'rest' }, set: { 'check.with': { Selected: 'True', Tone: 'Plain' } } }] };
  ok('a layer that always holds in the markup outranks what came before it', /selected=\{true\}/.test(toReact(always, 'row', { naming: CLASS, library: { ...lib, Row: always } })) && !/tone=\{on/.test(toReact(always, 'row', { naming: CLASS, library: { ...lib, Row: always } })));
  // a base part one variant takes away and a later one puts back is drawn there too
  const bar = { contract: 1, component: 'Bar', props: { sm: { type: 'boolean', default: false, figma: 'Sm' }, end: { type: 'boolean', default: false, figma: 'End' } }, anatomy: { root: { kind: 'container' }, menu: { kind: 'container', parent: 'root' } },
    variants: [{ when: { sm: true }, remove: ['menu'] }, { when: { sm: true, end: true }, add: { menu: { kind: 'container', parent: 'root' } } }] };
  ok('a base part a later variant puts back is drawn where it does', /\(?!sm\)? \|\| \(sm && end\)/.test(toReact(bar, 'bar', { naming: CLASS, library: { Bar: { ...bar, folder: 'bar' } } })));
  // its child the later variant does not put back keeps its own removal
  const bar2 = { ...bar, anatomy: { ...bar.anatomy, 'menu/badge': { kind: 'container', parent: 'menu' } }, variants: [{ when: { sm: true }, remove: ['menu', 'menu/badge'] }, bar.variants[1]] };
  ok('a child of a part put back, that is not put back itself, stays taken away', /\{!sm && \(\s*<div className="ds-bar__badge"/.test(toReact(bar2, 'bar', { naming: CLASS, library: { Bar: { ...bar2, folder: 'bar' } } })));
  // a narrower removal stacked on the put-back still takes it away
  const bar3 = { ...bar, props: { ...bar.props, busy: { type: 'boolean', default: false, figma: 'Busy' } }, variants: [...bar.variants, { when: { sm: true, end: true, busy: true }, remove: ['menu'] }] };
  ok('a removal narrower than a put-back still takes the part away', /\(sm && end\) && !\(sm && end && busy\)/.test(toReact(bar3, 'bar', { naming: CLASS, library: { Bar: { ...bar3, folder: 'bar' } } })));
  // a part only variants draw, taken away by one and put back by a narrower one, is drawn there too; a broader add that
  // the removal overrides is no put-back
  const tag = { contract: 1, component: 'Tag', props: { x: { type: 'boolean', default: false, figma: 'X' }, off: { type: 'boolean', default: false, figma: 'Off' }, sm: { type: 'boolean', default: false, figma: 'Sm' } }, anatomy: { root: { kind: 'container' } },
    variants: [{ when: { x: true }, add: { close: { kind: 'container', parent: 'root' } } }, { when: { x: true, off: true }, remove: ['close'] }, { when: { x: true, off: true, sm: true }, add: { close: { kind: 'container', parent: 'root' } } }] };
  { const tr = toReact(tag, 'tag', { naming: CLASS, library: { Tag: { ...tag, folder: 'tag' } } });
    ok('a part only variants draw, put back by a narrower add over a removal, is drawn there', tr.includes('{((((x) || (x && off && sm)) && !(x && off)) || (x && off && sm)) && ('), tr.split('\n').find((l) => /close/.test(l))); }
  // a part a variant puts back with other words says those there, the later variant over the earlier
  { const lab = { contract: 1, component: 'Lab', props: { required: { type: 'boolean', default: true, figma: 'Required' }, compact: { type: 'boolean', default: false, figma: 'Compact' } },
      anatomy: { root: { kind: 'container' }, mark: { kind: 'text', parent: 'root', content: '*' } },
      variants: [{ when: { required: false }, add: { mark: { kind: 'text', parent: 'root', content: 'Optional' } } }, { when: { required: false, compact: true }, add: { mark: { kind: 'text', parent: 'root', content: 'Opt.' } } }] };
    const r = toReact(lab, 'lab', { naming: CLASS, library: { Lab: { ...lab, folder: 'lab' } } }), php = toSnippet(lab, 'lab', { naming: CLASS, library: { Lab: { ...lab, folder: 'lab' } } });
    ok('a part a variant puts back with other words says them there, the later variant first', /\(!required && compact\) \? "Opt\." : \(!required \? "Optional" : "\*"\)/.test(r) && /: \(!\$required \? 'Optional' : '\*'\)/.test(php)); }
  { const lab2 = { contract: 1, component: 'Lab', props: { required: { type: 'boolean', default: true, figma: 'Required' }, small: { type: 'boolean', default: false, figma: 'Small' } },
      anatomy: { root: { kind: 'container' }, mark: { kind: 'text', parent: 'root', content: '*' } },
      variants: [{ when: { required: false }, add: { mark: { kind: 'text', parent: 'root', content: 'Optional' } } }, { when: { required: false, small: true }, add: { mark: { kind: 'text', parent: 'root', content: '*' } } }] };
    ok('a later variant that gives a part its own words back says them over an earlier one\'s', /\(!required && small\) \? "\*" : \(!required \? "Optional" : "\*"\)/.test(toReact(lab2, 'lab', { naming: CLASS, library: { Lab: { ...lab2, folder: 'lab' } } }))); }
  { const lab3 = { contract: 1, component: 'Lab', props: { required: { type: 'boolean', default: true, figma: 'Required' } }, anatomy: { root: { kind: 'container' }, mark: { kind: 'text', parent: 'root', content: '*' } },
      variants: [{ when: { required: false }, set: { 'mark.content': 'Optional' } }] };
    ok('words a variant sets on a base text are said there', /!required \? "Optional" : "\*"/.test(toReact(lab3, 'lab', { naming: CLASS, library: { Lab: { ...lab3, folder: 'lab' } } }))); }
  // a part only variants draw, each with its own words (carbon slider's message: the error text at error, the warning
  // text at warning; its status icon's label: a prop's words at one status, words of its own at another)
  { const msg = { contract: 1, component: 'Msg', props: { state: { type: 'enum', values: ['enabled', 'error', 'warning', 'done'], default: 'enabled', figma: 'State' },
      errorText: { type: 'string', default: 'Error', figma: 'Error text', sets: ['label'] }, warningText: { type: 'string', default: 'Warning', figma: 'Warning text', sets: ['label'] } },
      anatomy: { root: { kind: 'container' } },
      variants: [{ when: { state: 'error' }, add: { label: { kind: 'text', parent: 'root', content: '{errorText}' } } }, { when: { state: 'warning' }, add: { label: { kind: 'text', parent: 'root', content: '{warningText}' } } },
        { when: { state: 'done' }, add: { label: { kind: 'text', parent: 'root', content: 'Done' } } }] };
    const label = (c) => toReact(c, 'msg', { naming: CLASS, library: { Msg: { ...c, folder: 'msg' } } }).split('\n').find((l) => l.includes('ds-msg__label')) || '';
    const r = label(msg);
    ok('a part only variants draw says each one\'s words there: another prop\'s, or words of its own', /\(state === "warning"\) \? warningText/.test(r) && /errorText/.test(r) && /"Done"/.test(r), r);
    ok('which words a part only variants draw shows is the same whatever order the variants come in', r === label({ ...msg, variants: [...msg.variants].reverse() }), `${r}\n${label({ ...msg, variants: [...msg.variants].reverse() })}`);
    const lit = { ...msg, props: { state: msg.props.state }, variants: [{ when: { state: 'error' }, add: { label: { kind: 'text', parent: 'root', content: 'Error' } } }, { when: { state: 'warning' }, add: { label: { kind: 'text', parent: 'root', content: 'Warning' } } }] };
    ok('a part only variants draw, with words of its own in each, says each one\'s', /"Warning"/.test(label(lit)) && /"Error"/.test(label(lit)) && /state === "(warning|error)"/.test(label(lit)), label(lit)); }
  // a variant's words that a prop setting the text gives anyway stay that prop: never written in where the prop was
  { const f = { contract: 1, component: 'Fld', props: { filled: { type: 'boolean', default: false, figma: 'Filled' }, placeholderText: { type: 'string', default: 'Search', figma: 'Placeholder', sets: ['t'] }, valueText: { type: 'string', default: 'Search', figma: 'Value', sets: ['t'] } },
      anatomy: { root: { kind: 'container' }, t: { kind: 'text', parent: 'root', content: '{placeholderText}' } }, variants: [{ when: { filled: true }, set: { 't.content': 'Search' } }] };
    const r = toReact(f, 'fld', { naming: CLASS, library: { Fld: { ...f, folder: 'fld' } } }).split('\n').find((l) => l.includes('ds-fld__t')) || '';
    ok('a variant\'s words that another prop setting the text gives are that prop there, never a literal in its place', r.includes('{filled ? valueText : placeholderText}'), r);
    const one = { ...f, props: { filled: f.props.filled, placeholderText: f.props.placeholderText } };
    const r1 = toReact(one, 'fld', { naming: CLASS, library: { Fld: { ...one, folder: 'fld' } } }).split('\n').find((l) => l.includes('ds-fld__t')) || '';
    ok('a variant\'s words its own prop gives anyway leave the text that prop, with no choice between equals', r1.includes('>{placeholderText}<'), r1);
    // overlapping variants of as many props come in one order whatever order their props are written in
    const ov = { contract: 1, component: 'Ov', props: { a: { type: 'boolean', default: false, figma: 'A' }, b: { type: 'boolean', default: false, figma: 'B' }, z: { type: 'boolean', default: false, figma: 'Z' } }, anatomy: { root: { kind: 'container' } },
      variants: [{ when: { z: true, a: true }, add: { m: { kind: 'text', parent: 'root', content: 'ZA' } } }, { when: { b: true, z: true }, add: { m: { kind: 'text', parent: 'root', content: 'BZ' } } }] };
    const ovl = (c) => toReact(c, 'ov', { naming: CLASS, library: { Ov: { ...c, folder: 'ov' } } }).split('\n').find((l) => l.includes('ds-ov__m')) || '';
    const ov2 = { ...ov, variants: [{ ...ov.variants[0], when: { a: true, z: true } }, { ...ov.variants[1], when: { z: true, b: true } }] };
    // (a condition's terms stay in the order written; which words are the fallback and which the choice is the order)
    const terms = (l) => l.replace(/\(([a-z]+) && ([a-z]+)\)/g, (_, x, y) => `(${[x, y].sort().join(' && ')})`);
    ok('overlapping variants of as many props are ordered by their props, not the order they are written in', terms(ovl(ov)) === terms(ovl(ov2)), `${ovl(ov)}\n${ovl(ov2)}`); }
  // a snippet's nested choice is bracketed (PHP 8 refuses it bare), and no value is the language's null
  const php = toSnippet(lib.Row, 'row', { naming: KIRBY, library: lib });
  const phpFile = path.join(os.tmpdir(), `row-${process.pid}.php`); fs.writeFileSync(phpFile, php);
  let lint = ''; try { lint = execFileSync('php', ['-l', phpFile], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }); } catch (e) { lint = `${e.stdout || ''}${e.stderr || ''}` || 'no php'; }
  ok('a snippet that passes a placed component a value its variants choose is PHP that parses', /No syntax errors/.test(lint) || /no php/.test(lint) && !/undefined/.test(php));
}

// a shape a variant turns into a frame of shapes (a radio's circle that holds a dot once checked): those drawn inside it
{ const radio = { component: 'Dot', props: { checked: { type: 'boolean', default: false, figma: 'Checked' } }, anatomy: { root: { kind: 'container' }, circle: { kind: 'graphic', parent: 'root', shape: 'rectangle' } },
    variants: [{ when: { checked: true }, set: { 'circle.kind': 'container', 'circle.shape': null }, add: { 'circle/dot': { kind: 'graphic', parent: 'circle', shape: 'ellipse' } } }] };
  ok('a shape a variant fills with shapes draws them inside it', /h\("span", \{ "data-part": "circle", "aria-hidden": "true" \},\s*\(checked\) && h\("span", \{ "data-part": "dot"/.test(toElement(radio, 'dot', { naming: ELEMENT, library: {} }))); }

// a variable mode a holder sets on a placed instance overrides that component's own (Figma's instance override): the
// component writes its own mode before the host's attributes, and the holder sets none (null) where it overrides nothing
{ const btn = { component: 'Btn', props: {}, anatomy: { root: { kind: 'container', modes: { tone: 'subtle' } } }, variants: [] };
  const holder = { component: 'Holder', props: { on: { type: 'boolean', default: false, figma: 'On' } }, anatomy: { root: { kind: 'container' }, btn: { kind: 'instance', parent: 'root', component: 'Btn' } },
    variants: [{ when: { on: true }, set: { 'btn.modes': { tone: 'selected' } } }] };
  const own = toElement(btn, 'btn', { naming: ELEMENT, library: {} }), held = toElement(holder, 'holder', { naming: ELEMENT, library: { Btn: { ...btn, folder: 'btn' } } });
  ok('a mode a holder sets on a placed instance overrides its own: own mode before the host, none set where none overrides, its null leaving the own one standing', /h\("ds-btn", \{ "data-tone": "subtle", \.\.\.rest, \.\.\.Object\.fromEntries\(Object\.entries\(host\)\.filter\(\(\[, v\]\) => v != null\)\)/.test(own) && /"data-tone": on \? "selected" : null/.test(held), own + held); }

console.log(`${n} passed`);
