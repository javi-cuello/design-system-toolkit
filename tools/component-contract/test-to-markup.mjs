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
import http from 'node:http';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { toReact, toElement, toSnippet, toGallery, toParity, toStories, partsOf, propsOf, filesFor, namingFault, partSelector, storyIdOf, storybookOf, BANNER, DOM } from './to-markup.mjs';
import { combinations, toCss, namer, drawn, entryOf } from './to-code.mjs';
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

/* ── React, as text ── */
const button = toReact(library.Button, 'button', { naming: CLASS, library, stylesheet: '../styles/button.css' });
ok('React: its own props typed, and every other prop the button takes, its ref and its events with them', /export type ButtonProps = Own & Omit<ComponentPropsWithRef<"button">, keyof Own>;/.test(button) && /type = "button", className, onClick, \.\.\.rest \}: ButtonProps/.test(button));
ok('React: the rest reaches the native button first, so what the component sets is not lost to it; busy, a submit button submits nothing', /<button \{\.\.\.rest\} type=\{state === "loading" \? "button" : type\} disabled=\{disabled\}/.test(button));
ok('React: the caller\'s class joins the component\'s, never replaces it', /className=\{cx\("ds-button", className\)\}/.test(button));
ok('React: a value is the attribute the sheet keys on; a yes-or-no "true" or "false", as the sheet reads either default', /data-size=\{size\}/.test(button) && /data-show-icon=\{String\(showIcon\)\}/.test(button));
ok('React: Role is variant, its hook still the sheet\'s data-role (code-standard rule 9)', /variant\?: "primary" \| "secondary";/.test(button) && /data-role=\{variant\}/.test(button) && !/\brole\?:/.test(button));
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
ok('a slot a boolean shows is found under its own name, never a placed component\'s slot of the same name', /<div className="ds-stepper__show-more-actions-slot">\{actionsSlot\}<\/div>/.test(stepper));
ok('a part a pointer state takes away stays, a gap saying so', /chevron-down/.test(stepper) && /frontend-build: Chevron is taken away at a pointer state/.test(stepper));
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

/* ── the mapping and the stories ── */
const parity = toParity(library.Button, 'button', { naming: CLASS, library });
const every = Object.entries(library.Button.props).filter(([, p]) => p.type === 'enum' || p.axis || (p.shows || []).length || p.role === 'interaction');
ok('the mapping names every option of every axis, so the run measures the whole set (code-standard rule 33)', every.every(([, p]) => parity.axes[p.figma] && Object.keys(parity.axes[p.figma]).length === (p.type === 'boolean' ? 2 : p.values.length)));
ok('a pointer state is forced on the element that takes it; a state the product sets is an arg by its name in code', parity.state === '.ds-button' && parity.axes.State.Hover.pseudo === 'hover' && parity.axes.State.Focus.pseudo === 'focus-visible' && parity.axes.State.Loading.state === 'loading' && parity.axes.Role.Secondary.variant === 'secondary');
ok('its layers are the stored paths, by the sheet\'s own selectors; the ring the root; a placed component\'s insides its own', parity.layers['Content > Label'] === '.ds-button > .ds-button__content > .ds-button__label' && parity.layers['Focus ring'] === '.ds-button' && parity.layers['Content > Spinner > Glyph'].skip);
const rows = toParity(library['Nav panel'], 'nav-panel', { naming: ELEMENT, library, framework: 'web-components' }).layers;
ok('a repeat is its place among its own, whatever else the box holds', rows['List > Item#2'] === 'ds-nav-panel > [data-part="list"] > [data-part="item"]:nth-child(2 of [data-part="item"])');
ok('the story id is Storybook\'s for the title, a platform\'s library its own', toParity(library.Button, 'button', { naming: CLASS, library, platform: 'web' }).storyId === 'design-system-button-web--default' && storyIdOf('Design system/Nav item', 'Default') === 'design-system-nav-item--default');
const stories = toStories(library.Button, 'button', 'react', { library });
ok('stories: typed by satisfies, the accessibility check failing the run, one for each value and each yes-or-no', /satisfies Meta<typeof Button>;/.test(stories) && /a11y: \{ test: 'error' \}/.test(stories) && ['ShowIcon', 'SizeSm', 'VariantSecondary', 'Disabled', 'StateLoading'].every((s) => new RegExp(`export const ${s}: Story = \\{ args`).test(stories)));
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
  const site = fs.mkdtempSync(path.join(os.tmpdir(), 'to-markup-site-'));
  const tokens = JSON.parse(fs.readFileSync(path.join(SAMPLE, 'tokens.json'), 'utf8'));
  const vars = [];
  for (const col of Object.values(tokens.collections)) for (const [name, v] of Object.entries(col.values[col.modes[0]])) vars.push(`${cssName('', name)}: ${typeof v === 'number' ? (/opacity/i.test(name) ? v : `${v}px`) : v};`);
  for (const t of tokens.textStyles) { const b = cssName('', t.name); vars.push(`${b}-font-family: ${t.family};`, `${b}-font-size: ${t.size}px;`, `${b}-font-weight: ${t.weight};`, `${b}-line-height: ${t.lineHeight}px;`, `${b}-letter-spacing: ${t.letterSpacing}px;`); }
  fs.mkdirSync(path.join(site, 'components'));
  fs.writeFileSync(path.join(site, 'components', 'dom.js'), DOM);
  let css = `:root { ${vars.join(' ')} }\n`;
  for (const c of Object.values(library)) {
    fs.mkdirSync(path.join(site, 'components', c.folder));
    fs.writeFileSync(path.join(site, 'components', c.folder, `${c.folder}.js`), toElement(c, c.folder, { naming: ELEMENT, library }));
    css += toCss(c, c.folder, { naming: ELEMENT });
  }
  fs.writeFileSync(path.join(site, 'all.css'), css);
  const fn = (c) => `render${c.component.replace(/(^|[^A-Za-z0-9]+)(.)/g, (_, __, x) => x.toUpperCase())}`;
  fs.writeFileSync(path.join(site, 'index.html'), `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="all.css"></head><body><main id="stage"></main><script type="module">${Object.values(library).map((c) => `import { ${fn(c)} } from './components/${c.folder}/${c.folder}.js';`).join('')} window.R = { ${Object.values(library).map((c) => `${JSON.stringify(c.folder)}: ${fn(c)}`).join(', ')} }; window.ready = true;</script></body></html>`);
  const server = http.createServer((req, res) => {
    const file = path.join(site, decodeURIComponent(new URL(req.url, 'http://x').pathname));
    if (!file.startsWith(site) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'content-type': file.endsWith('.js') ? 'text/javascript' : file.endsWith('.css') ? 'text/css' : 'text/html' });
    res.end(fs.readFileSync(file));
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const browser = await launch({});
  try {
    const tab = await attach(await newPage(browser.endpoint));
    await navigate(tab, `http://127.0.0.1:${server.address().port}/index.html`);
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
          const got = await tab.evaluate(`!!document.querySelector(${JSON.stringify(partSelector(c, nm, part.id, part))})`);
          parts++;
          if (there.has(part.id) !== got) wrong.push(`${c.component} at ${JSON.stringify(m)}: ${part.id} ${got ? 'drawn where the contract draws none' : 'missing'}`);
        }
        for (const [id, { decls }] of Object.entries(drawn(c, full))) {
          const part = all.get(id.split('::')[0]);
          if (id.includes('/*') || id.includes('::') || (part && (part.inside || part.slotted || part.pointerOnly || part.ring || (pointer && part.pointerGone)))) continue;
          const said = await tab.evaluate(`(${compare})(${JSON.stringify(partSelector(c, nm, id, part))}, ${JSON.stringify([...decls].map(([p, d]) => [p, d.v]))})`);
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
  } finally { await browser.close(); server.close(); fs.rmSync(site, { recursive: true, force: true }); }
}

console.log(`${n} passed`);
