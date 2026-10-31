#!/usr/bin/env node
// tools/css-lint/lint.mjs: each gate fed a violation, watched to fire, and fed
// the shape it must allow (code-standard rule 41). Run by bin/check.
import assert from 'node:assert/strict';
import * as L from './lint.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

let n = 0;
const ok = (name, cond) => { n++; assert.ok(cond, name); console.log('ok', name); };
const BEM = { kind: 'class', prefix: 'ds-', part: '__' }, EL = { kind: 'element', prefix: 'ds-' };

ok('code-standard rule 4: a bare rule or a bare @media outside a layer is named; layers, keyframes, faces and @charset pass',
  JSON.stringify(L.unlayered('@layer a { .x { a: b } } .y { c: d } @media (x) { .z { e: f } }')) === '[".y","@media"]'
  && L.unlayered('@charset "UTF-8"; @layer a { .x { a: b } } @keyframes spin { to { a: b } } @font-face { a: b }').length === 0);

ok('code-standard rule 5 (parts named by block): a root, a part and a nested rule of another block are named; own parts are not',
  JSON.stringify(L.reaching('@layer screens { .ds-page { a: b } .ds-page .ds-button { a: b } .ds-page__x .ds-menu__item { a: b } .ds-page:hover .ds-card { a: b } .ds-page__y { a: b } }', BEM))
  === JSON.stringify(['.ds-page .ds-button names ds-button', '.ds-page__x .ds-menu__item names ds-menu', '.ds-page:hover .ds-card names ds-card'])
  && L.reaching('@layer a { @keyframes k { to { a: b } } .ds-a__b { a: b } }', BEM).length === 0);

ok('code-standard rule 5 (parts as attributes): a descendant combinator in the components layer is named; a child combinator, :is() and an attribute value are not',
  JSON.stringify(L.descendantCombinators('@layer components{ds-a>[data-x]{a:b}ds-a [data-label]{a:b}ds-b>:is(a, button){a:b}ds-c[x="a b"]>i{a:b}}@layer layout{main p{a:b}}'))
  === JSON.stringify(['ds-a [data-label]']));

ok('code-standard rule 4: !important is named outside a reduced-motion block, and not in a comment',
  JSON.stringify(L.important('.a { b: c !important }\n@media (prefers-reduced-motion: reduce) {\n  * { d: e !important }\n}\n/* never !important */')) === '[1]');

ok('code-standard rule 40: outline: none is named; outline: 0 is not', JSON.stringify(L.outlineNone('a { outline: none }\nb { outline: 0 }')) === '[1]');

ok('code-standard rule 48: a component that un-underlines is named', JSON.stringify(L.anchorResets('@layer c { .ds-a { color: inherit; text-decoration: none } .ds-a__b { a: b } }')) === '[".ds-a"]');

const brace = ['@layer c {', '  .a {', '    width: 3px; /* here */', '    /* above, and the run under it */', '    height: 4px;', '    margin: 5px;', '', '    padding: 5px;',
  '    /* after, which explains nothing above it */', '  }', '  /* the block */', '  .b {', '    width: 6px;', '  }', '  /* the pair */', '  .c { width: 7px; }', '  .d { width: 8px; }',
  '  .e {', '    /* a note about something else */', '    color: red;', '', '    width: 9px;', '  }', '}'].join('\n');
ok('code-standard rule 22 (brace syntax): a literal is excused on its line, under a note over its run, or under its block head, and nothing else',
  JSON.stringify(L.unexplained(brace)) === JSON.stringify(['8  padding: 5px;', '22  width: 9px;']));

const indented = ['// the block', 'ds-a', '  width: 6px', '', 'ds-b', '  height: 7px // here', '  // the run under it', '  margin: 8px', '  padding: 9px', '',
  '  padding-top: 10px', '', 'ds-c', '  inline-size: 11px', '  color: var(--x)', '  border: 0'].join('\n');
ok('code-standard rule 22 (indented Sass): the same reach, read by indentation',
  JSON.stringify(L.unexplainedIndented(indented)) === JSON.stringify(['11  padding-top: 10px', '14  inline-size: 11px']));

const byValue = L.tokenLengths([':root {\n  --spacing-16: 1rem;\n  --corner-radius-16: 16px;\n  --font-size-24: 24px;\n  --spacing-2: 2px;\n}']);
const families = { pad: new Set(['--spacing-']), radius: new Set(['--corner-radius-']) };
ok('code-standard rule 22 (a token\'s value): a length on a property the design binds, in that token\'s family, is named; a size it never binds, another family, a noted line and 2px are not',
  JSON.stringify(L.literalTokens('a\n  padding: 16px\n  border-radius: 16px\n  inline-size: 16px\n  margin: 24px\n  // the glyph\'s drawn size\n  padding-top: 16px\n  padding: 2px', byValue, families))
  === JSON.stringify(['2  padding: 16px is var(--spacing-16)', '3  border-radius: 16px is var(--corner-radius-16)']));

ok('what the design binds is read off the specs: a binding names its family',
  JSON.stringify(Object.fromEntries(Object.entries(L.boundFamilies([{ variants: [{ bindings: { pad: ['Spacing/16', 'Spacing/8'], radius: 'Corner radius/full' }, children: [{ bindings: { w: 'Viewport/Phone/width' } }] }] }])).map(([k, v]) => [k, [...v]])))
  === JSON.stringify({ pad: ['--spacing-'], radius: ['--corner-radius-'], w: ['--viewport-'] }));

ok('code-standard rule 17: an element a script hides, by class or as a custom element, needs [hidden] to beat its display',
  JSON.stringify(L.hiddenByScript('<div className="ds-x__step" hidden={n !== 1}>\n<input type="hidden" name="a" />\n<p className={`ds-z ${more}`} hidden>', BEM)) === '["ds-x__step","ds-z"]'
  && JSON.stringify(L.unhidden(['ds-x__step', 'ds-z'], L.parse('@layer a { .ds-x__step { display: flex } .ds-x__step[hidden] { display: none } .ds-z { display: grid } }').rules)) === '["ds-z"]'
  && L.unhidden(['ds-z'], L.parse('@layer base { [hidden] { display: none } }').rules).length === 0
  && JSON.stringify(L.hiddenByScript('<ds-error-message hidden>\n<ds-tag>', EL)) === '["ds-error-message"]'
  && L.unhidden(['ds-error-message'], L.parse('@layer c{ds-error-message[hidden]{display:none}}').rules).length === 0);

ok('code-standard rule 18: every spelling of an empty aria-label is named',
  JSON.stringify(L.emptyLabels('aria-label=""\naria-label={\'\'}\n{ ariaLabel = "" }\n"aria-label": \'\'\naria-label="Close"\naria-label={label}')) === '[1,2,3,4]');

ok('code-standard rule 10: a presentational attribute is named on any element, width and height on a custom one; a component\'s props and an image\'s size are not',
  JSON.stringify(L.presentationalAttrs('<ds-container align="center">\n<div bgcolor="red">\n<Container align="center">\n<img width="20" height="20">\n<ds-card width="3">\n<ds-grid data-align="x">')) === JSON.stringify(['1  <ds-container align=…>', '2  <div bgcolor=…>', '5  <ds-card width=…>']));

ok('code-standard rule 16: a sheet with a dark tier and no color-scheme is named; one that declares it, or has no dark tier, is not',
  L.colorSchemeMissing('@media (prefers-color-scheme: dark) { :root { --colour-x: #000 } }') === true
  && L.colorSchemeMissing('[data-theme="dark"] { --c: #000 } :root { color-scheme: light dark }') === false
  && L.colorSchemeMissing(':root { --c: #fff } /* prefers-color-scheme: dark */') === false);

ok('code-standard rule 39: a page rule reaching a component\'s data attribute through a descendant combinator is named; a child combinator and an attribute no component uses are not',
  JSON.stringify(L.hookCollisions('@layer components { ds-field > [data-content] { a: b } } @layer layout { .modal [data-content] { padding: 2rem } .modal > [data-content] { a: b } .page [data-own] { a: b } #contact [data-sheet]>[data-content] { a: b } }'))
  === JSON.stringify(['.modal [data-content] reaches [data-content], which a component uses for a part of its own']));

ok('code-standard rule 21: a click that cancels navigation and reads no modifier is named; one that checks them, or does not navigate, is not',
  L.modifiedClicks("row.addEventListener('click', (e) => { e.preventDefault(); location.href = row.dataset.href })") === true
  && L.modifiedClicks("row.addEventListener('click', (e) => { if (e.metaKey || e.ctrlKey) return; e.preventDefault(); location.href = u })") === false
  && L.modifiedClicks("form.addEventListener('click', (e) => { e.preventDefault(); toggle() })") === false
  && L.modifiedClicks("el.addEventListener('cancel', (e) => { e.preventDefault(); router.push(u) });\n<div onClick={(e) => { if (e.target === x) router.push(u) }} />") === false
  && L.modifiedClicks("<a onClick={(e) => { e.preventDefault(); router.push(href) }}>") === true);

ok('code-standard rule 9: a state spelled as a class or an attribute is named, and an ARIA or HTML name taken for a variant on a custom element; a pseudo-class, a real role and a native disabled are not',
  JSON.stringify(L.stateAsAttribute('.ds-b.is-hover { a: b } .ds-b[data-state="pressed"] { a: b } .ds-b:hover { a: b } .ds-b[data-variant="hover-card"] { a: b }')) === JSON.stringify(['.ds-b.is-hover', '.ds-b[data-state="pressed"]'])
  && JSON.stringify(L.variantCollisions('<ds-button role="primary">\n<ds-tabs role="tablist">\n<ds-field disabled>\n<button disabled>')) === JSON.stringify(['1  <ds-button role="primary">', '3  <ds-field disabled>']));

const script = '<script>document.querySelectorAll("[data-more]").forEach((a) => a.addEventListener("click", load)); history.pushState({}, "", u)</script>';
ok('code-standard rule 36: one inline script in two templates is a fork, named by both files; an external script and a short config are not',
  JSON.stringify(L.inlineScriptForks([['a.php', script], ['b.php', '<p>x</p>\n' + script.replace(/; /, ';\n  ')], ['c.php', '<script src="x.js"></script><script>window.cfg = 1</script>']])) === JSON.stringify(['a.php and b.php']));

ok('code-standard rule 47: a client file with no hook, no browser global and no handler of its own is named; one that defines a handler or holds state, and a server file, are not',
  L.needlessClient("'use client';\nexport const Row = ({ onClick }) => <li onClick={onClick}>x</li>;") === true
  && L.needlessClient("'use client';\nexport const Row = () => <li onClick={() => go()}>x</li>;") === false
  && L.needlessClient("'use client';\nexport function F() { const [o, s] = useState(false); return null }") === false
  && L.needlessClient("export const Row = ({ onClick }) => <li onClick={onClick}>x</li>;") === false
  && L.needlessClient("'use client';\nexport function M() { const { ref } = useRovingFocus<HTMLDivElement>('x'); return null }") === false
  && L.needlessClient("'use client';\nexport const I = ({ onName }) => <input onChange={onName ? (e) => onName(e.currentTarget.value) : undefined} />;") === false);

ok('code-standard rule 11: a page rule restating the container component\'s max width is named; another width, and the container itself, are not',
  JSON.stringify(L.containerWidthRestated('@layer components { .ds-container { max-inline-size: var(--grid) } } @layer screens { .ds-page__body { max-inline-size: var(--grid) } .ds-page__text { max-inline-size: 60ch } }'))
  === JSON.stringify(['.ds-page__body sets var(--grid), the container\'s width']));

ok('code-standard rule 43: an inline function handed to a client component from a server module is named; a value, a server action by name, and a client module are not',
  JSON.stringify(L.functionProps("import { List } from './list';\nimport { create } from './actions';\nexport default function P() { return <List label={(n) => `${n} people`} action={create} count={3} /> }", (s) => s === './list'))
  === JSON.stringify(['3  <List label={…function…}>'])
  && L.functionProps("'use client';\nimport { List } from './list';\nconst X = () => <List label={(n) => n} />", () => true).length === 0);

ok('code-standard rule 42: a height computed as the text size times its line height is named; a line height alone and another calc are not',
  JSON.stringify(L.textBoxHeights('.a {\n  block-size: calc(var(--label-md-medium-size) * var(--label-md-medium-line-height));\n  line-height: var(--label-md-medium-line-height);\n  block-size: calc(var(--spacing-8) * 2);\n}')) === JSON.stringify(['2  block-size: calc(var(--label-md-medium-size) * var(--label-md-medium-line-height));']));

ok('a compiled sheet reads past a protocol-relative url: // is not a CSS comment',
  L.parse('@layer c{ds-z{background:url(//cdn.example.com/a.svg)}ds-y{a:b}}ds-q{a:b}').rules.length === 3
  && JSON.stringify(L.unlayered('@layer c{ds-z{background:url(//cdn.example.com/a.svg)}}ds-q{a:b}')) === '["ds-q"]');

ok('code-standard rule 5 (parts as attributes): placing a nested component by its host is not named; going past it into its parts is',
  JSON.stringify(L.reachesPast('@layer components{ds-bar>ds-item{flex:1}ds-bar>ul>li>ds-item>a>ds-icon{display:none}ds-item>a>ds-icon{color:red}}')) === JSON.stringify(['ds-bar>ul>li>ds-item>a>ds-icon goes past ds-item'])
  && L.reachesPast('@layer components{[data-theme=dark] ds-card>[part=title]{a:b}.is-open ds-menu [part=list]{a:b}}').length === 0);

ok('review, 2026-10-03: a literal beside a var() is read; an !important deep in a reduced-motion block is not named and one after it is; display none !important hides',
  JSON.stringify(L.unexplained('@layer c {\n  .a {\n    margin: 13px var(--s);\n    padding: var(--p, 4px);\n  }\n}')) === JSON.stringify(['3  margin: 13px var(--s);'])
  && JSON.stringify(L.important('@media (prefers-reduced-motion: reduce) {\n' + '  .a { b: c }\n'.repeat(10) + '  * { d: e !important }\n}\n.x { color: red !important }')) === '[14]'
  && L.unhidden(['ds-z'], L.parse('@layer b{[hidden]{display:none !important}}').rules).length === 0);

ok('review, 2026-10-03: code-standard rule 10 reads h1 and a continuation line; code-standard rule 17 reads a PHP snippet given hidden; code-standard rule 21 follows a named handler; code-standard rule 47 keeps a context or a ref callback on the client',
  JSON.stringify(L.presentationalAttrs('<h1 align="center">\n<div\n  bgcolor="red">')) === JSON.stringify(['1  <h1 align=…>', '3  <div bgcolor=…>'])
  && JSON.stringify(L.hiddenByScript("<?php snippet('ds/note', ['text' => $t, 'hidden' => true]) ?>", EL)) === '["ds-note"]'
  && L.modifiedClicks("function go(e) { e.preventDefault(); location.href = u }\nrow.addEventListener('click', go);") === true
  && L.needlessClient("'use client';\nexport const Ctx = createContext(null);") === false
  && L.needlessClient("'use client';\nexport const F = () => <div ref={(el) => el && el.focus()} />;") === false);

ok('review, 2026-10-03: indented Sass keeps its reduced-motion block by indentation; a breakpoint wrapper passes its selector\'s note through; a hidden inside a nested argument is the part\'s',
  JSON.stringify(L.important('@media (prefers-reduced-motion: reduce)\n  *\n    a: b !important\n.x\n  c: d !important', { indented: true })) === '[5]'
  && L.unexplainedIndented('// the frame draws 640\n#more\n  @include bp.from(bp.$md)\n    --cap: min(640px, var(--s))').length === 0
  && L.unexplainedIndented('#more\n  @include bp.from(bp.$md)\n    --cap: min(640px, var(--s))').length === 1
  && L.hiddenByScript("<?php snippet('ds/top', ['toggle' => ['hidden' => true]]) ?>", EL).length === 0
  && L.hiddenByScript("<?php snippet('ds/form', ['hidden' => ['csrf' => $c]]) ?>", EL).length === 0
  && L.hiddenByScript("<?php snippet('ds/note', ['hidden' => false]) ?>", EL).length === 0
  && L.modifiedClicks("function go(e) { e.preventDefault(); location.href = u }\nrow.onclick = go;") === true
  && L.important('@media (prefers-reduced-motion: reduce)\n{\n  * { a: b !important }\n}').length === 0
  && JSON.stringify(L.hiddenByScript('<ds-error-message id="<?= esc($id) ?>-error" hidden>', EL)) === '["ds-error-message"]');

// check.mjs --config: a codebase with no snapshot (the docs site) names its
// sheets in a file of its own; paths read from that file's folder, and a
// finding fails the run exactly as under --repo.
{
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'styles-config-'));
  fs.mkdirSync(path.join(dir, 'css'));
  fs.writeFileSync(path.join(dir, 'css', 'a.css'), '@layer c { .a { color: red !important; } }\n');
  fs.writeFileSync(path.join(dir, 'styles.json'), JSON.stringify({ styles: { sources: ['css'] } }));
  fs.writeFileSync(path.join(dir, 'empty.json'), '{}');
  const check = fileURLToPath(new URL('./check.mjs', import.meta.url));
  const run = (file) => spawnSync(process.execPath, [check, '--config', path.join(dir, file)], { encoding: 'utf8' });
  const red = run('styles.json'), none = run('empty.json');
  fs.writeFileSync(path.join(dir, 'css', 'a.css'), '@layer c { .a { color: red; } }\n');
  const green = run('styles.json');
  fs.rmSync(dir, { recursive: true, force: true });
  ok('check.mjs --config: a sheet the file names is read from its folder, with no snapshot.config.json; a finding fails, a clean sheet passes, a file with no `styles` checks nothing and fails',
    red.status === 1 && /css\/a\.css:1/.test(red.stdout) && green.status === 0 && /green/.test(green.stdout)
    && none.status === 1 && /no `styles` block in empty\.json/.test(none.stdout));
}

console.log(`${n}/${n} passed`);
