#!/usr/bin/env node
// tools/component-contract/to-code.mjs and css.mjs: a contract as the stylesheet that rebuilds every variant.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { toCss, rulesOf, rulesAt, combinations, selfCheck, namer, condition, controlOf, HOUSE, nestedSelector, drawn, paintsAny, partsOf, childrenOf, markupOrder } from './to-code.mjs';
import { declarations } from './css.mjs';
import { toElement } from './to-markup.mjs';
import { ELEMENT } from './site.mjs';
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
// Figma's fill takes its share of the parent and no more, what it holds overflowing (a state layer 40 tall with 10 padding
// about a 24 icon): along a flex row CSS's automatic minimum (min-width: auto, css-flexbox-1 §4.5) would keep it its
// content's, so it is set to 0; a minimum of the part's own stays
ok('a part that fills along its parent may shrink below what it holds, as in Figma; a minimum of its own is kept',
  decl({ width: 'fill' }, { row: true })['min-inline-size'] === '0' && decl({ height: 'fill' }, { row: false })['min-block-size'] === '0'
  && decl({ height: 'fill' }, { row: true })['min-block-size'] === undefined && decl({ width: 'fill', minWidth: 24 }, { row: true })['min-inline-size'] === '1.5rem'
  && declarations({ width: 'fill', minWidth: 24 }, { row: true }, names).decls.filter(([p]) => p === 'min-inline-size').length === 1);
// (in a parent that wraps, the content size is what decides where a row breaks: each item keeps it, or every chip counts
// as 0 wide and none ever wraps)
ok('a part that fills a parent that wraps keeps its content\'s minimum, so the row still breaks', decl({ width: 'fill' }, { row: true, wrap: true })['min-inline-size'] === undefined
  && /__chip \{[^}]*flex: 1 1 0;(?![^}]*min-inline-size)[^}]*\}/.test(toCss({ component: 'Chips', props: {}, anatomy: { root: { kind: 'container', layout: { direction: 'row', wrap: true } }, chip: { kind: 'container', parent: 'root', order: 0, width: 'fill' } }, variants: [] }, 'chips')));
const lit = declarations({ minHeight: 24 }, {}, names).decls[0];
ok('a text that hugs its width never wraps (Figma\'s WIDTH_AND_HEIGHT), one that fills or is cut keeps its own',
  decl({ kind: 'text', width: 'hug', height: 'hug' }, {})['white-space'] === 'nowrap' && decl({ kind: 'text', width: 'fill', height: 'hug' }, {})['white-space'] === undefined
  && decl({ kind: 'container', width: 'hug', height: 'hug' }, {})['white-space'] === undefined
  && decl({ kind: 'text', width: 'hug', height: 'hug', maxLines: 2, truncate: true }, {})['-webkit-line-clamp'] === '2');
// a text's white space is drawn as typed in Figma (a code block's newlines and indents); CSS collapses it unless told,
// so a text whose words hold a newline, a tab or a run of spaces keeps them: pre where it hugs, pre-wrap where it wraps
ok('a text whose words hold a newline or a run of spaces keeps them: pre where it hugs its width, pre-wrap where it wraps',
  decl({ kind: 'text', width: 'hug', height: 'hug', content: 'a\nb' }, {})['white-space'] === 'pre'
  && decl({ kind: 'text', width: 'fill', height: 'hug', content: 'a  b' }, {})['white-space'] === 'pre-wrap'
  && decl({ kind: 'text', width: 'hug', height: 'hug', content: 'a b' }, {})['white-space'] === 'nowrap'
  && decl({ kind: 'text', width: 'fill', height: 'hug', content: 'a b' }, {})['white-space'] === undefined);
ok('a cut text whose words hold a newline: pre-wrap beside a clamp of several lines; one cut to a single line stays nowrap (its ellipsis needs it)',
  decl({ kind: 'text', width: 'fill', height: 'hug', maxLines: 3, truncate: true, content: 'a\nb' }, {})['white-space'] === 'pre-wrap'
  && decl({ kind: 'text', width: 'fill', height: 'hug', maxLines: 3, truncate: true, content: 'a\nb' }, {})['-webkit-line-clamp'] === '3'
  && decl({ kind: 'text', width: 'fill', height: 'hug', maxLines: 1, truncate: true, content: 'a\nb' }, {})['white-space'] === 'nowrap');
{ const snippet = { component: 'Snippet', props: { code: { type: 'string', default: 'a\n  b', sets: ['code'] } }, anatomy: { root: { kind: 'container', layout: { direction: 'column' } }, code: { kind: 'text', parent: 'root', order: 0, width: 'hug', height: 'hug', content: '{code}' } }, variants: [] };
  const sheet = toCss(snippet, 'snippet', { naming: { kind: 'class', prefix: 'ds-', part: '__' } });
  ok('a text bound to a text property keeps the white space its default holds: pre where it hugs', /white-space: pre;/.test(sheet) && !/nowrap/.test(sheet)); }
ok('a text at a set width Figma says grows both ways, whose white space is kept, is pre (rules.mjs reads it back as never wrapping)',
  decl({ kind: 'text', width: 19, autoResize: 'width_and_height', content: 'a  b' }, {})['white-space'] === 'pre');
{ const snippet = { contract: 1, component: 'Snippet', props: { code: { type: 'string', default: 'a\n  b', sets: ['code'] } }, anatomy: { root: { kind: 'container', layout: { direction: 'column' } }, code: { kind: 'text', parent: 'root', order: 0, width: 'hug', height: 'hug', content: '{code}' } }, variants: [] };
  const panel = { contract: 1, component: 'Panel', props: {}, anatomy: { root: { kind: 'container', layout: { direction: 'column' } }, snip: { kind: 'instance', parent: 'root', order: 0, component: 'Snippet', key: 's1' }, 'snip/code': { kind: 'text', parent: 'snip', order: 0, width: 'fill', height: 'hug', content: '{code}' } }, variants: [] };
  const sheet = toCss(panel, 'panel', { naming: { kind: 'class', prefix: 'ds-', part: '__' }, mains: (n) => (n === 'Snippet' ? { ...snippet, folder: 'snippet' } : null) });
  ok('a placed component\'s bound text keeps its default\'s white space against an override: its hug-to-fill override says pre-wrap, never unsets it',
    /white-space: pre-wrap/.test(sheet) && !/white-space: (unset|normal|initial)/.test(sheet)); }
{ const tag = { contract: 1, component: 'Tag', props: { label: { type: 'string', default: 'Label', sets: ['label'] } }, anatomy: { root: { kind: 'container', layout: { direction: 'row' } }, label: { kind: 'text', parent: 'root', order: 0, width: 'hug', height: 'hug', content: '{label}' } }, variants: [] };
  const card = { contract: 1, component: 'Card', props: { code: { type: 'string', default: 'a\n  b', sets: ['inst/label'] } }, anatomy: { root: { kind: 'container', layout: { direction: 'column' } }, inst: { kind: 'instance', parent: 'root', order: 0, component: 'Tag', key: 't1' }, 'inst/label': { kind: 'text', parent: 'inst', order: 0, width: 'hug', height: 'hug', content: '{code}' } }, variants: [] };
  const sheet = toCss(card, 'card', { naming: { kind: 'class', prefix: 'ds-', part: '__' }, mains: (n) => (n === 'Tag' ? { ...tag, folder: 'tag' } : null) });
  ok('a placed part bound to the host\'s own property says its white space from the host\'s default, not the placed component\'s',
    /white-space: pre;/.test(sheet)); }
ok('a vertical alignment is written only where the text has a height of its own, never said unread: one that grows to its words loses nothing',
  (() => { const d = (autoResize) => declarations({ kind: 'text', autoResize, verticalAlign: 'center' }, {}, { token: (n) => `var(--${n})` });
    const u = (a) => d(a).unread.filter((x) => /verticalAlign/.test(x)).length, w = (a) => d(a).decls.some(([p, v]) => p === 'align-content' && v === 'center');
    return [u('height'), u('width_and_height'), u('none'), u(undefined)].every((x) => x === 0) && !w('height') && !w('width_and_height') && w('none') && w(undefined); })());
ok('a text with no style writes no style\'s fields (no token defines --literal-*): it is said as unread, as an unstyled effect is',
  (() => { const r = declarations({ kind: 'text', typography: 'literal' }, {}, { token: (n) => `var(--${n})`, textStyle: (n) => [['font-size', `var(--${n}-font-size)`]] }); return !r.decls.length && r.unread.some((u) => /^typography \(a text with no style/.test(u)); })());
// 2026-11-22: a library names a style by its size (`14/20 Regular`): read as a text's own values it lost its var()
{ const style = (n) => [['font-size', `var(--${n})`]];
  for (const name of ['14/20 Regular', '14/20 regular', '14/20 medium Inter', '12/16 450'])
    ok(`a style named like a value (${name}) is that style, written with its var()`,
      (() => { const r = declarations({ kind: 'text', typography: name }, {}, { token: (n) => `var(--${n})`, textStyle: style }); return r.decls.length === 1 && r.decls[0][1] === `var(--${name})` && !r.unread.length; })());
  const px = declarations({ kind: 'text', letterSpacing: '0.16' }, {}, { token: (n) => `var(--${n})`, textStyle: style }).decls;
  ok('a letter spacing kept as the snapshot spells it (0.16, a text with no style said) is px, never a token of that name', px[0][1] === '0.16px'); }
ok('a literal carries its reason (code-standard rule 22)', lit[2] === 'no token in the design');
// a text's colour and a stroke's with no variable (a raw #ae2a19) are written as themselves, as a fill's is: never as a
// token of that name, which no token build defines (a required asterisk drew black)
{ const r = declarations({ kind: 'text', color: '#ae2a19', typography: 'T' }, {}, { token: (n) => `var(--${n})`, textStyle: () => [] }).decls, b = declarations({ kind: 'container', border: { color: 'rgb(1 2 3 / 1)', width: 1 } }, {}, { token: (n) => `var(--${n})` }).decls;
  ok('a raw text colour or stroke colour is written as itself, with its reason', r.find((x) => x[0] === 'color')[1] === '#ae2a19' && r.find((x) => x[0] === 'color')[2] === 'no token in the design' && b.some((x) => /rgb\(1 2 3 \/ 1\)/.test(x[1])) && !b.some((x) => /var\(--rgb/.test(x[1]))
    && declarations({ kind: 'text', color: 'Text/strong' }, {}, { token: (n) => `var(--${n})`, textStyle: () => [] }).decls.find((x) => x[0] === 'color')[1] === 'var(--Text/strong)'); }
// 2026-11-22: a text with no style, its values known (snapshot 0.82.0 on), is written as values, never a var() no token
// defines; its spacing, case and decoration too, which css.mjs left unread
{ const r = declarations({ kind: 'text', typography: 'literal 12/18 semibold italic IBM Plex Sans', letterSpacing: 0.16, textCase: 'upper', textDecoration: 'underline' }, {}, { token: (n) => `var(--${n})`, textStyle: () => [] });
  const d = Object.fromEntries(r.decls.map((x) => [x[0], x[1]]));
  ok('a text with no style writes its own size, line height and weight, spacing, case and decoration, as values with their reason',
    d['font-family'] === '"IBM Plex Sans"' && d['font-style'] === 'italic' && d['font-size'] === '0.75rem' && d['line-height'] === '1.125rem' && d['font-weight'] === '600' && d['letter-spacing'] === '0.16px' && d['text-transform'] === 'uppercase' && d['text-decoration-line'] === 'underline'
    && !r.decls.some((x) => /var\(/.test(x[1])) && r.decls.find((x) => x[0] === 'font-size')[2] === 'no text style in the design' && !r.unread.length);
  ok('…their reason is the true one: the snapshot records no binding of theirs, so none says there is no token', !r.decls.some((x) => x[2] === 'no token in the design'));
  const a = Object.fromEntries(declarations({ kind: 'text', typography: 'literal 14/0 regular', letterSpacing: '2%', textCase: 'small_caps' }, {}, { token: (n) => `var(--${n})`, textStyle: () => [] }).decls.map((x) => [x[0], x[1]]));
  const family = (f) => Object.fromEntries(declarations({ kind: 'text', typography: `literal 14/20 regular ${f}` }, {}, { token: (n) => `var(--${n})`, textStyle: () => [] }).decls.map((x) => [x[0], x[1]]))['font-family'];
  ok('…a generic or system family is a keyword, written bare (quoted, it names another font); a family called as a CSS-wide word stays quoted',
    ['serif', 'sans-serif', 'monospace', 'cursive', 'fantasy', 'math', 'system-ui', 'ui-serif', 'ui-sans-serif', 'ui-monospace', 'ui-rounded', '-apple-system', 'BlinkMacSystemFont'].every((f) => family(f) === f)
    && family('"serif"') === '"serif"' && family('generic(fangsong)') === '"generic(fangsong)"' && family('generic(foo)') === '"generic(foo)"' && family('Inter') === '"Inter"' && family('inherit') === '"inherit"' && family('Noto Sans-serif') === '"Noto Sans-serif"' && family('Foo, Bar') === '"Foo, Bar"');
  const upright = (x) => Object.fromEntries(declarations({ kind: 'text', typography: 'literal 14/20 regular Inter', ...x }, {}, { token: (n) => `var(--${n})`, textStyle: () => [] }).decls.map((y) => [y[0], y[1]]));
  const plain = upright({}), small = upright({ textCase: 'small_caps' }), big = upright({ textCase: 'upper', letterSpacing: 0.5 });
  ok('…one that says no slant, spacing or case writes none of them, or it takes its host\'s',
    plain['font-style'] === 'normal' && plain['letter-spacing'] === 'normal' && plain['text-transform'] === 'none' && plain['font-variant-caps'] === 'normal'
    && small['font-variant-caps'] === 'small-caps' && small['text-transform'] === 'none' && big['text-transform'] === 'uppercase' && big['font-variant-caps'] === 'normal' && big['letter-spacing'] === '0.5px'
    && !declarations({ kind: 'text', typography: 'literal' }, {}, { token: (n) => n, textStyle: () => [] }).decls.length && declarations({ kind: 'text', typography: 'Body' }, {}, { token: (n) => n, textStyle: () => [['font-size', 'var(--body)']] }).decls.length === 1);
  const spaced = (letterSpacing) => declarations({ kind: 'text', letterSpacing }, {}, { token: (n) => `var(--${n})`, textStyle: () => [] }).decls[0];
  ok('…a letter spacing that is a token, or 0, carries no reason', spaced('Type/tracking').length === 2 && spaced(0).length === 2 && spaced('0').length === 2 && spaced(0.2).length === 3 && spaced('2%').length === 3);
  ok('…the font\'s own line height is normal, a share of the size em, small caps a variant', a['line-height'] === 'normal' && a['letter-spacing'] === '0.02em' && a['font-variant-caps'] === 'small-caps');
  const odd = declarations({ kind: 'text', typography: 'literal 12/16 450 Inter' }, {}, { token: (n) => `var(--${n})`, textStyle: (n) => [['font-size', `var(--${n}-font-size)`]] });
  ok('…a value no form parses (a weight with no name) is said unread, never written as a style no token defines', !odd.decls.length && odd.unread.some((u) => /^typography \(literal 12\/16 450/.test(u))); }
ok('a radius stays px, a length goes rem (code-standard rule 54)', decl({ radius: 6 })['border-radius'] === '6px' && decl({ width: 8 })['inline-size'] === '0.5rem');
ok('an inside stroke out of layout is an inset ring; in layout, a border per side; outside, an outline taking no room (rule 63)',
  decl({ border: { color: 'C/line', width: 'Stroke/1' } })['box-shadow'] === 'inset 0 0 0 var(--stroke-1) var(--c-line)'
  && decl({ border: { color: 'C/line', width: [0, 0, 'Stroke/1', 0], sides: { top: 0, end: 0, bottom: 1, start: 0 }, inLayout: true } })['border-bottom'] === 'var(--stroke-1) solid var(--c-line)'
  && decl({ border: { color: 'C/line', width: 2, align: 'outside' } }).outline === '2px solid var(--c-line)');
ok('a side\'s weight with no one width stated is the weight its side records, never 1', decl({ border: { color: 'C/line', sides: { top: 0, end: 0, bottom: 3, start: 0 } } })['box-shadow'] === 'inset 0 -3px 0 0 var(--c-line)');
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
// a part turned a quarter (a slider's track stood upright): Figma lays out its turned box and keeps its own width and
// height, so code wraps it in a box that takes its place in the parent's flow, sized on the parent's axes, and draws the
// part inside at its own size, centred and turned (a transform lays out nothing); unturned, the wrapper is no box at all
const upright = { contract: 1, component: 'Upright', props: { orientation: { type: 'enum', values: ['horizontal', 'vertical'], default: 'horizontal', figma: 'Orientation' } },
  anatomy: { root: { kind: 'container', layout: { direction: 'row' }, width: 200, height: 16 }, track: { kind: 'container', parent: 'root', order: 0, width: 'fill', height: 16, background: 'C/x' } },
  variants: [{ when: { orientation: 'vertical' }, set: { 'root.layout': { direction: 'column' }, 'root.width': 16, 'root.height': 200, 'track.rotation': 90 } }] };
{ const t = toCss(upright, 'upright', { naming: { kind: 'class', prefix: 'ds-', part: '__' } });
  const rule = (sel) => { const i = t.indexOf(`${sel} {`); return i < 0 ? '' : t.slice(i, t.indexOf('}', i)); };
  const base = rule('.ds-upright > [data-turn="track"]'), wrap = rule('.ds-upright:where([data-orientation="vertical"]) > [data-turn="track"]'), part = rule('.ds-upright:where([data-orientation="vertical"]) > [data-turn="track"] > .ds-upright__track');
  ok('a part turned a quarter is drawn in a wrapper that takes its place, sized on the parent\'s axes (its own width down a column), the part inside at its own size, centred and turned; unturned the wrapper is no box',
    /display: contents/.test(base) && /display: block/.test(wrap) && /container-type: size/.test(wrap) && /flex: 1 1 0/.test(wrap) && /inline-size: 1rem/.test(wrap)
    && /position: absolute/.test(part) && /inline-size: 100cqh/.test(part) && /rotate: -90deg/.test(part) && /translate: -50% -50%/.test(part)
    && selfCheck(upright).length === 0);
  // its own minimum goes to the wrapper on the swapped axis (its own width, down the column), where the zero minimum a fill
  // takes (bc39d74c) does not overwrite it; and a pointer state that takes the part away takes its wrapper too
  { const least = toCss({ ...upright, anatomy: { ...upright.anatomy, track: { ...upright.anatomy.track, minWidth: 100 } } }, 'upright', { naming: { kind: 'class', prefix: 'ds-', part: '__' } });
    const i = least.indexOf('.ds-upright:where([data-orientation="vertical"]) > [data-turn="track"] {'), w = least.slice(i, least.indexOf('}', i));
    ok('a turned part\'s own minimum is its wrapper\'s on the swapped axis, never written over by the zero minimum',
      /min-block-size: 6.25rem/.test(w) && !/min-block-size: 0;/.test(w) && selfCheck({ ...upright, anatomy: { ...upright.anatomy, track: { ...upright.anatomy.track, minWidth: 100 } } }).length === 0); }
  { const hover = { ...upright, props: { ...upright.props, state: { type: 'enum', values: ['rest', 'hover'], default: 'rest', role: 'interaction', pointer: ['hover'] } },
      variants: [...upright.variants, { when: { state: 'hover' }, remove: ['track'] }] };
    const t2 = toCss(hover, 'upright', { naming: { kind: 'class', prefix: 'ds-', part: '__' } });
    ok('a pointer state that takes a turned part away hides its wrapper too, so no box keeps its room',
      /:hover[^{]*> \[data-turn="track"\] \{\s*display: none;/.test(t2) && selfCheck(hover).length === 0); }
  const slant = { ...upright, variants: [{ when: { orientation: 'vertical' }, set: { 'track.rotation': 45 } }] };
  ok('any other turn is turned in place, as before: no wrapper', !/data-turn/.test(toCss(slant, 'upright'))); }
// an overlapping group (a gap below 0) the design stacks first on top: each child says its place by z-index, the first
// highest, the box isolated; the same group stacked last on top, or not overlapping, writes none
{ const pile = (gap, top) => ({ contract: 1, component: 'Pile', props: {}, anatomy: { root: { kind: 'container', layout: { direction: 'row', gap, ...(top && { firstOnTop: true }) } },
    a: { kind: 'graphic', parent: 'root', order: 0, width: 8, height: 8 }, b: { kind: 'graphic', parent: 'root', order: 1, width: 8, height: 8 }, c: { kind: 'graphic', parent: 'root', order: 2, width: 8, height: 8 } } });
  const css = (g, top) => toCss(pile(g, top), 'pile', { naming: { kind: 'class', prefix: 'ds-', part: '__' } });
  const rule = (x, sel) => { const i = x.indexOf(`${sel} {`); return i < 0 ? '' : x.slice(i, x.indexOf('}', i)); };
  const top = css(-4, true);
  ok('an overlapping group stacked first on top says it by z-index, the first highest; last on top, or apart, says none',
    /z-index: 3;/.test(rule(top, '.ds-pile > .ds-pile__a')) && /z-index: 1;/.test(rule(top, '.ds-pile > .ds-pile__c')) && /isolation: isolate/.test(rule(top, '.ds-pile')) && !/firstOnTop/.test(top)
    && !/z-index/.test(css(-4, false)) && !/z-index/.test(css(4, true)));
  // (a variant that sets only the gap, by a dotted path, makes the group overlap there: said so too)
  const tight = { ...pile(4, true), props: { tight: { type: 'boolean', default: false, figma: 'Tight' } }, variants: [{ when: { tight: true }, set: { 'root.layout.gap': -4 } }] };
  ok('a gap a variant sets below 0 by a dotted path restacks the group as a whole layout would', /z-index: 3;/.test(toCss(tight, 'pile', { naming: { kind: 'class', prefix: 'ds-', part: '__' } })));
  // (and each child says its place in the design by order too, a part out of the flow as well: the one reference a
  // reading has for which way the z-index counts where the flow holds a single child)
  const lone = { ...pile(0, true), anatomy: { ...pile(0, true).anatomy, b: { ...pile(0, true).anatomy.b, position: 'absolute' }, c: { ...pile(0, true).anatomy.c, position: 'absolute' } } };
  const lcss = toCss(lone, 'pile', { naming: { kind: 'class', prefix: 'ds-', part: '__' } });
  ok('a restacked box\'s children say their place in the design by order as well, those out of the flow too',
    /order: 1;/.test(rule(lcss, '.ds-pile > .ds-pile__a')) && /order: 3;/.test(rule(lcss, '.ds-pile > .ds-pile__c')) && /z-index: 1;/.test(rule(lcss, '.ds-pile > .ds-pile__c')), lcss);
  const g = (parent, o, abs) => ({ kind: 'graphic', parent, order: o, width: 8, height: 8, ...(abs && { position: 'absolute', absolute: { x: 0, y: 0 } }) });
  // (one child left in the flow only where two variants combine is lone there too: judged by combination, as drawn)
  const both = { contract: 1, component: 'Both', props: { x: { type: 'boolean', default: false, figma: 'X' }, y: { type: 'boolean', default: false, figma: 'Y' } },
    anatomy: { root: { kind: 'container', layout: { direction: 'row', gap: 4, firstOnTop: true } }, a: g('root', 0), b: g('root', 1), c: g('root', 2), bg: g('root', 3, true) },
    variants: [{ when: { x: true }, remove: ['a'] }, { when: { y: true }, remove: ['b'] }] };
  ok('a box two variants together leave one child in the flow says each child\'s place by order', /order: 4;/.test(rule(toCss(both, 'both', { naming: { kind: 'class', prefix: 'ds-', part: '__' } }), '.ds-both > .ds-both__bg')));
  // (a box stacked first on top whose children can overlap says it by z-index though the browser would paint them so
  // already: the only way a reading tells which way the design numbers them)
  const over = { contract: 1, component: 'Over', props: {}, anatomy: { root: { kind: 'container', layout: { direction: 'row', firstOnTop: true } }, icon: { kind: 'graphic', parent: 'root', order: 0, width: 8, height: 8, position: 'absolute', absolute: { x: 0, y: 0 } }, text: { kind: 'graphic', parent: 'root', order: 1, width: 8, height: 8 } } };
  const ocss = toCss(over, 'over', { naming: { kind: 'class', prefix: 'ds-', part: '__' } });
  ok('a box stacked first on top whose children can overlap says so by z-index where the browser already paints them so', /z-index: 2;/.test(rule(ocss, '.ds-over > .ds-over__icon')) && /z-index: 1;/.test(rule(ocss, '.ds-over > .ds-over__text')), ocss);
  // (so does a holder where it takes a part out of a box a placed component restacks, leaving one child in its flow: a
  // field that hides its icons at open, between its text and its background)
  const lay = { direction: 'row', gap: 4, firstOnTop: true };
  const held = { contract: 1, component: 'Held', folder: 'held', props: {}, anatomy: { root: { kind: 'container', layout: { direction: 'row' } }, box: { kind: 'container', parent: 'root', layout: lay }, 'box/a': g('box', 0), 'box/i': g('box', 1), 'box/bg': g('box', 2, true) } };
  const field = { contract: 1, component: 'Field', props: { open: { type: 'boolean', default: false, figma: 'Open' } },
    anatomy: { root: { kind: 'container', layout: { direction: 'column' } }, p: { kind: 'instance', parent: 'root', order: 0, component: 'Held', key: 'k' }, 'p/box': { kind: 'container', parent: 'p', order: 0, layout: lay }, 'p/box/a': g('p/box', 0), 'p/box/i': g('p/box', 1), 'p/box/bg': g('p/box', 2, true) },
    variants: [{ when: { open: true }, remove: ['p/box/i'] }] };
  const fcss = toCss(field, 'field', { naming: { kind: 'class', prefix: 'ds-', part: '__' }, mains: (n) => (n === 'Held' ? held : null) });
  // (and a copy the holder draws itself where a variant opens the instance into a container of its own: stacked as the
  // holder's own box, by the same z-index and order, never left to a sheet that no longer reaches it)
  const opened = { ...field, props: { ...field.props, ro: { type: 'boolean', default: false, figma: 'Read only' } }, variants: [...field.variants, { when: { ro: true }, set: { 'p.kind': 'container', 'p.component': null, 'p.key': null } }] };
  const rcss = toCss(opened, 'field', { naming: { kind: 'class', prefix: 'ds-', part: '__' }, mains: (n) => (n === 'Held' ? held : null) });
  const roRule = (part) => rule(rcss, `.ds-field:where([data-ro]:not([data-ro="false"])) > .ds-field__p > .ds-held__box > .ds-held__${part}`);
  ok('a copy the holder draws itself stacks its first-on-top box by z-index as its own', /z-index: 3;/.test(roRule('a')) && /z-index: 1;/.test(roRule('bg')) && /isolation: isolate/.test(rule(rcss, '.ds-field:where([data-ro]:not([data-ro="false"])) > .ds-field__p > .ds-held__box')), rcss);
  // (one a variant adds, its parts too, and a later variant opens: the copy read whole at that combination)
  const late = { ...opened, props: { ...opened.props, inl: { type: 'boolean', default: false, figma: 'Inline' } }, anatomy: { root: opened.anatomy.root },
    variants: [{ when: { inl: true }, add: Object.fromEntries(Object.entries(opened.anatomy).filter(([k]) => k !== 'root')) }, { when: { inl: true, ro: true }, set: { 'p.kind': 'container', 'p.component': null, 'p.key': null } }] };
  const lcss2 = toCss(late, 'field', { naming: { kind: 'class', prefix: 'ds-', part: '__' }, mains: (n) => (n === 'Held' ? held : null) });
  // (and a variant that does not open the instance itself, but draws where another does: the copy is read whole there
  // too, its background set out of the flow only there)
  const plain = { contract: 1, component: 'Held', folder: 'held', props: {}, anatomy: { root: { kind: 'container', layout: { direction: 'row' } }, box: { kind: 'container', parent: 'root', layout: { direction: 'row', gap: 4 } }, 'box/bg': g('box', 0), 'box/a': g('box', 1) } };
  const shut = { contract: 1, component: 'Field', props: { ro: { type: 'boolean', default: false, figma: 'Read only' }, x: { type: 'boolean', default: false, figma: 'X' } },
    anatomy: { root: { kind: 'container', layout: { direction: 'column' } }, p: { kind: 'instance', parent: 'root', order: 0, component: 'Held', key: 'k' }, 'p/box': { kind: 'container', parent: 'p', order: 0, layout: { direction: 'row', gap: 4 } }, 'p/box/bg': g('p/box', 0), 'p/box/a': g('p/box', 1) },
    variants: [{ when: { ro: true }, set: { 'p.kind': 'container', 'p.component': null, 'p.key': null } }, { when: { ro: true, x: true }, set: { 'p/box/bg.position': 'absolute', 'p/box/bg.absolute': { x: 0, y: 0 } } }] };
  const scss = toCss(shut, 'field', { naming: { kind: 'class', prefix: 'ds-', part: '__' }, mains: (n) => (n === 'Held' ? plain : null) });
  ok('a copy another variant opens is restacked where a variant of its own sets a part out of the flow there', /isolation: isolate/.test(scss) && /z-index: 1;/.test(scss), scss);
  // (a part set out of the flow under one prop, in a copy another prop opens: read at the combination of the two)
  const pair = { ...shut, variants: [shut.variants[0], { when: { x: true }, set: { 'p/box/bg.position': 'absolute', 'p/box/bg.absolute': { x: 0, y: 0 } } }] };
  const pcss = toCss(pair, 'field', { naming: { kind: 'class', prefix: 'ds-', part: '__' }, mains: (n) => (n === 'Held' ? plain : null) });
  ok('a copy one prop opens is restacked where another prop sets a part of it out of the flow, at the two together', /isolation: isolate/.test(pcss) && /z-index/.test(pcss), pcss);
  // (a child of the copy positioned to anchor a part another layer adds there paints with the positioned ones: read off
  // the copy as drawn, so a background already under it is not restacked)
  const anchor = { ...shut, anatomy: { ...shut.anatomy, 'p/box/bg': g('p/box', 0, true) }, variants: [shut.variants[0], { when: { ro: true }, add: { 'p/box/a/dot': g('p/box/a', 0, true) } }] };
  const acss = toCss(anchor, 'field', { naming: { kind: 'class', prefix: 'ds-', part: '__' }, mains: (n) => (n === 'Held' ? { ...plain, anatomy: { ...plain.anatomy, 'box/bg': g('box', 0, true) } } : null) });
  ok('a copy\'s child that anchors a part another layer adds there is positioned, so nothing is restacked', !/data-ro[^{]*\{[^}]*z-index/.test(acss), acss);
  ok('a copy a later variant opens of an instance another variant adds stacks by z-index as its own', /\.ds-held__a \{[^}]*z-index: 3;/.test(lcss2.split('[data-ro]').slice(1).join('')), lcss2);
  ok('a holder that leaves one child in the flow of a box a placed component restacks says each one\'s place by order, at every combination',
    /order: 1;/.test(rule(fcss, '.ds-field > .ds-field__p > .ds-held__box > .ds-held__a')) && /order: 2;/.test(rule(fcss, '.ds-field > .ds-field__p > .ds-held__box > .ds-held__i')) && /order: 2;/.test(rule(fcss, '.ds-field:where([data-open]:not([data-open="false"])) > .ds-field__p > .ds-held__box > .ds-held__bg')), fcss); }
// a turned part in a restacked box: its wrapper is what the box lays out and stacks (a size container, its own stacking
// context: css-contain-3 §3), so its place by z-index is said on the wrapper, beside its order, and not on the part inside
{ const row = { contract: 1, component: 'Row', props: {}, anatomy: { root: { kind: 'container', layout: { direction: 'row' } },
    badge: { kind: 'graphic', parent: 'root', order: 0, position: 'absolute', absolute: { x: 0, y: 0 }, width: 4, height: 4 },
    icon: { kind: 'graphic', parent: 'root', order: 1, rotation: 90, width: 16, height: 8 },
    label: { kind: 'graphic', parent: 'root', order: 2, width: 8, height: 8 } } };
  const css = toCss(row, 'row', { naming: { kind: 'class', prefix: 'ds-', part: '__' } });
  const rule = (sel) => { const i = css.indexOf(`${sel} {`); return i < 0 ? '' : css.slice(i, css.indexOf('}', i)); };
  ok('a turned part in a restacked box says its z-index on its wrapper, not on the part it turns',
    /z-index: 2;/.test(rule('.ds-row > [data-turn="icon"]')) && !/z-index/.test(rule('.ds-row > [data-turn="icon"] > .ds-row__icon')) && /z-index: 3;/.test(rule('.ds-row__label')) && selfCheck(row).length === 0); }
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
ok('a placed component is given its place and size, never its look', /__badge \{\s*flex: 1 1 0;\s*min-inline-size: 0;\s*\}/.test(placed) && !/var\(--c-x\)|var\(--e-1\)/.test(placed));
// a variant that puts a box's children in another order: each child says its place, in the defaults and the variant
const rev = { ...chip, props: { ...chip.props, reversed: { type: 'boolean', default: false, axis: true } }, anatomy: { ...chip.anatomy, texts: { kind: 'container', parent: 'root', order: 1, layout: { direction: 'column' } }, 'texts/a': { kind: 'text', parent: 'texts', order: 0 }, 'texts/b': { kind: 'text', parent: 'texts', order: 1 } },
  variants: [...chip.variants, { when: { reversed: true }, set: { 'texts/a.order': 1, 'texts/b.order': 0 } }] };
const rcss2 = toCss(rev, 'chip', { naming: { kind: 'class', prefix: 'ds-', part: '__' } });
ok('a reordering variant writes each child\'s order', /__texts > \.ds-chip__a \{[^}]*order: 0;/.test(rcss2) && /:where\(\[data-reversed\]:not\(\[data-reversed="false"\]\)\) > \.ds-chip__texts > \.ds-chip__a \{\s*order: 1;/.test(rcss2) && selfCheck(rev).length === 0);
// two variants that each add a box's children, in different orders (a caret before the words, then after them): each
// child says its place there too, so the order follows the props, not the one the markup writes them in
{ const CLS = { kind: 'class', prefix: 'ds-', part: '__' };
  // what the browser draws in a box at one condition: its children in markup order, then by the CSS order the sheet gives
  // each, the defaults' rule and then the condition's (the later winning), as a flex box lays them out
  const drawn = (markup, css, kids, cond) => {
    const orderOf = (k) => { let o = 0; for (const m of css.matchAll(/([^{}]+)\{([^}]*)\}/g)) { const sel = m[1].trim(), v = /(?:^|\s)order: (-?\d+);/.exec(m[2]);
      if (!v || !sel.endsWith(`[data-part="${k}"]`) || (sel.includes(':where(') && !(cond && sel.includes(cond)))) continue; o = +v[1]; } return o; };
    const at = (k) => markup.indexOf(`"data-part": "${k}"`);
    return kids.filter((k) => at(k) >= 0).sort((x, y) => orderOf(x) - orderOf(y) || at(x) - at(y));
  };
  const box = { kind: 'container', parent: 'root', order: 0, layout: { direction: 'row' } };
  const at = (kind, n) => ({ kind, parent: 'box', order: n, ...(kind === 'text' ? { content: 'Find' } : { width: 1, height: 16 }) });
  const typed = { ...chip, props: { ...chip.props, mode: { type: 'enum', values: ['idle', 'armed', 'typed'], default: 'idle' } }, anatomy: { ...chip.anatomy, box, 'box/lead': at('graphic', 0) },
    variants: [...chip.variants, { when: { mode: 'armed' }, add: { 'box/caret': at('graphic', 1), 'box/words': at('text', 2) } }, { when: { mode: 'typed' }, add: { 'box/words': at('text', 1), 'box/caret': at('graphic', 2) } }] };
  const tcss = toCss(typed, 'chip', { naming: CLS }), tmk = toElement(typed, 'chip', { naming: ELEMENT, library: {} }), tel = toCss(typed, 'chip', { naming: ELEMENT });
  ok('two variants adding a box\'s children in other orders write each child\'s order, the defaults\' children theirs',
    /\.ds-chip > \.ds-chip__box > \.ds-chip__lead \{[^}]*order: 0;/.test(tcss)
    && /:where\(\[data-mode="armed"\]\) > \.ds-chip__box > \.ds-chip__caret \{[^}]*order: 1;/.test(tcss) && /:where\(\[data-mode="typed"\]\) > \.ds-chip__box > \.ds-chip__caret \{[^}]*order: 2;/.test(tcss)
    && /:where\(\[data-mode="typed"\]\) > \.ds-chip__box > \.ds-chip__words \{[^}]*order: 1;/.test(tcss) && selfCheck(typed).length === 0);
  ok('and the browser draws each in the design\'s order, whatever order the markup writes them in',
    drawn(tmk, tel, ['lead', 'caret', 'words'], '[mode="armed"]').join() === 'lead,caret,words' && drawn(tmk, tel, ['lead', 'caret', 'words'], '[mode="typed"]').join() === 'lead,words,caret');
  // a part two variants add under different boxes is in another order in neither: neither box says orders
  const tip = (parent, n) => ({ kind: 'graphic', parent, order: n, width: 1, height: 1 });
  const moved = { ...chip, props: typed.props, anatomy: { ...chip.anatomy, box, other: { ...box, order: 1 }, 'box/a': tip('box', 0), 'other/b': tip('other', 0), 'other/c': tip('other', 1) },
    variants: [...chip.variants, { when: { mode: 'armed' }, add: { tip: tip('box', 1) } }, { when: { mode: 'typed' }, add: { tip: tip('other', 2) } }] };
  ok('places are compared within one box: a part two variants add under different boxes at one place there reorders neither', !/order:/.test(toCss(moved, 'chip', { naming: CLS })));
  // a part whose place only shifts as others come and go (a tail after the lead, then after an extra too) is never
  // before what it was after: the box keeps the markup's order, no child says one
  const shifted = { ...chip, props: typed.props, anatomy: { ...chip.anatomy, box, 'box/lead': at('graphic', 0) },
    variants: [...chip.variants, { when: { mode: 'armed' }, add: { 'box/tail': at('graphic', 1) } }, { when: { mode: 'typed' }, add: { 'box/extra': at('graphic', 1), 'box/tail': at('graphic', 2) } }] };
  ok('a place that only shifts as parts come and go writes no order', !/order:/.test(toCss(shifted, 'chip', { naming: CLS })) && selfCheck(shifted).length === 0);
  // three children no two of which any variant puts oppositely, yet no one order keeps every variant's (a before b,
  // b before c in one, c before a in another): the markup cannot write it, so each child says its place
  const cycle = { ...chip, props: typed.props, anatomy: { ...chip.anatomy, box, 'box/a': at('graphic', 1), 'box/b': at('graphic', 2) },
    variants: [...chip.variants, { when: { mode: 'armed' }, remove: ['box/a'], add: { 'box/c': at('graphic', 3) } }, { when: { mode: 'typed' }, remove: ['box/b'], add: { 'box/c': at('graphic', 0) } }] };
  const cmk = toElement(cycle, 'chip', { naming: ELEMENT, library: {} }), ccss = toCss(cycle, 'chip', { naming: ELEMENT });
  ok('children no one markup order keeps are each given their place: the browser draws every variant\'s',
    drawn(cmk, ccss, ['a', 'c'], '[mode="typed"]').join() === 'c,a' && drawn(cmk, ccss, ['b', 'c'], '[mode="armed"]').join() === 'b,c' && drawn(cmk, ccss, ['a', 'b'], null).join() === 'a,b' && selfCheck(cycle).length === 0);
  // a ring only a pointer state draws, among the children a variant reorders: the markup holds no element for it, and
  // the box the sheet orders is the one the markup orders, both from the same parts
  const ringed = { ...typed, variants: [...typed.variants, { when: { state: 'hover' }, add: { 'box/ring': { kind: 'graphic', parent: 'box', order: 3, position: 'absolute', absolute: { x: -2, y: -2, end: -2, bottom: -2 }, constraints: { horizontal: 'stretch', vertical: 'stretch' }, border: { color: 'C/focus', width: 2 } } } }] };
  const gmk = toElement(ringed, 'chip', { naming: ELEMENT, library: {} }), gcss = toCss(ringed, 'chip', { naming: ELEMENT });
  ok('a ring only a pointer state draws leaves the reordered box\'s order as the browser draws it',
    drawn(gmk, gcss, ['lead', 'caret', 'words'], '[mode="typed"]').join() === 'lead,words,caret' && drawn(gmk, gcss, ['lead', 'caret', 'words'], '[mode="armed"]').join() === 'lead,caret,words' && selfCheck(ringed).length === 0);
  // a part of the defaults a variant puts in another box is not in its own box there, at the other box's place
  const away = { ...chip, props: typed.props, anatomy: { ...chip.anatomy, box, other: { ...box, order: 1 }, 'box/x': at('graphic', 0), 'box/y': at('graphic', 1), 'other/z': { ...at('graphic', 0), parent: 'other' } },
    variants: [...chip.variants, { when: { mode: 'armed' }, add: { 'box/x': { ...at('graphic', 5), parent: 'other' } } }] };
  ok('a part of the defaults a variant moves to another box reorders neither box', !/order:/.test(toCss(away, 'chip', { naming: CLS })));
  // a box no auto layout lays out takes no order: CSS order moves nothing there
  const flat = { ...typed, anatomy: { ...typed.anatomy, box: { kind: 'container', parent: 'root', order: 0 } } };
  ok('order is written only where an auto layout lays the child out', !/order:/.test(toCss(flat, 'chip', { naming: CLS })));
  // numbered copies of one placed component in a reordered box, a sibling between them: each says its own place
  const tagAt = (n) => ({ kind: 'instance', parent: 'box', order: n, component: 'Tag', key: 't1' });
  const list = { ...chip, props: typed.props, anatomy: { ...chip.anatomy, box, 'box/item': tagAt(0), 'box/sep': at('graphic', 1), 'box/item_2': tagAt(2) },
    variants: [...chip.variants, { when: { mode: 'armed' }, add: { 'box/badge': at('graphic', 3), 'box/note': at('graphic', 4) } }, { when: { mode: 'typed' }, add: { 'box/note': at('graphic', 3), 'box/badge': at('graphic', 4) } }] };
  const lmk = toElement(list, 'chip', { naming: ELEMENT, library: {} }), lcss = toCss(list, 'chip', { naming: ELEMENT });
  ok('copies in a reordered box each keep their own place between the siblings that part them',
    drawn(lmk, lcss, ['item', 'sep', 'item-2', 'badge', 'note'], '[mode="typed"]').join() === 'item,sep,item-2,note,badge' && selfCheck(list).length === 0);
  // side by side they stay one part, a list of any length: tied at the first's place, in the order they are written
  const rows = { ...list, anatomy: { ...list.anatomy, 'box/sep': at('graphic', 2), 'box/item_2': tagAt(1) } };
  const rmk = toElement(rows, 'chip', { naming: ELEMENT, library: {} });
  ok('copies side by side in a reordered box keep the first\'s one rule', !rmk.includes('"data-part": "item-2"') && (rmk.match(/"data-part": "item"/g) || []).length === 2 && selfCheck(rows).length === 0);
  // a text entry in a reordered box: the input stands where its value text does, not at 0 before the parts ahead of it
  const entry = { ...field, props: { ...field.props, mode: typed.props.mode },
    anatomy: { ...field.anatomy, 'field/lead': { kind: 'graphic', parent: 'field', order: 0, width: 1, height: 1 }, 'field/prefix': { kind: 'text', parent: 'field', order: 1, content: '$' },
      'field/placeholder': { ...field.anatomy['field/placeholder'], order: 2 }, 'field/clear': { kind: 'graphic', parent: 'field', order: 3, width: 1, height: 1 } },
    variants: [{ ...field.variants[0], add: { 'field/value': { ...field.variants[0].add['field/value'], order: 2 } } }, ...field.variants.slice(1),
      { when: { mode: 'armed' }, add: { 'field/hint': { kind: 'graphic', parent: 'field', order: 4, width: 1, height: 1 }, 'field/err': { kind: 'graphic', parent: 'field', order: 5, width: 1, height: 1 } } },
      { when: { mode: 'typed' }, add: { 'field/err': { kind: 'graphic', parent: 'field', order: 4, width: 1, height: 1 }, 'field/hint': { kind: 'graphic', parent: 'field', order: 5, width: 1, height: 1 } } }] };
  const ecss = toCss(entry, 'search', { naming: CLS });
  ok('a text entry\'s input in a reordered box takes its value text\'s place', /\.ds-search__field > \.ds-search__input \{[^}]*order: 2;/.test(ecss) && /__prefix \{[^}]*order: 1;/.test(ecss) && selfCheck(entry).length === 0); }
// a part out of the flow paints where the browser stacks it, never where a CSS order would put it (CSS Flexbox 4.1): the
// markup writes it in the design's order, and where that is not over every child in the flow, or variants put two such
// parts in other orders, each child of the box says its place by z-index, the box isolated so nothing outside it interleaves
{ const { siblingOrder } = await import('./rules.mjs');
  // what the browser paints in a box at one condition: each part's markup place, and the position, order and z-index the
  // sheet gives it there (the defaults' rule, then the condition's), stacked as rules.mjs reads them
  const paints = (markup, css, kids, cond) => {
    const last = (k, prop) => { let o = null; for (const m of css.matchAll(/([^{}]+)\{([^}]*)\}/g)) { const sel = m[1].trim(), v = new RegExp(`(?:^|\\s)${prop}: ([^;]+);`).exec(m[2]);
      if (!v || !sel.endsWith(`[data-part="${k}"]`) || (sel.includes(':where(') && !(cond && sel.includes(cond)))) continue; o = v[1]; } return o; };
    const at = (k) => markup.indexOf(`"data-part": "${k}"`);
    const xs = kids.filter((k) => at(k) >= 0).sort((x, y) => at(x) - at(y)).map((k) => { const pos = last(k, 'position'), out = pos === 'absolute', z = last(k, 'z-index');
      return { id: k, cssOrder: out ? 0 : +(last(k, 'order') || 0), stack: { ...(out && { out: true }), ...(pos === 'relative' && { lifted: true }), ...(z != null && { z: +z }) } }; });
    return siblingOrder(xs).map((e) => e.id).join();
  };
  const flowAt = (n) => ({ kind: 'graphic', parent: 'root', order: n, width: 8, height: 8 });
  const absAt = (n) => ({ kind: 'graphic', parent: 'root', order: n, position: 'absolute', absolute: { x: 0, y: 0 }, width: 4, height: 4 });
  const pin = { contract: 1, component: 'Pin', props: { swapped: { type: 'boolean', default: false, axis: true } }, anatomy: { root: { kind: 'container', layout: { direction: 'row' } }, a: flowAt(0), x: absAt(1), y: absAt(2), b: flowAt(3) },
    variants: [{ when: { swapped: true }, set: { 'x.order': 2, 'y.order': 1 } }] };
  const css = toCss(pin, 'pin', { naming: ELEMENT }), mk = toElement(pin, 'pin', { naming: ELEMENT, library: {} });
  ok('a part out of the flow says no CSS order: it moves nothing there', !/\[data-part="[xy]"\] \{[^}]*order:/.test(css));
  ok('two parts out of the flow between two in it, which a variant swaps: the browser paints each variant in the design\'s order',
    paints(mk, css, ['a', 'x', 'y', 'b'], null) === 'a,x,y,b' && paints(mk, css, ['a', 'x', 'y', 'b'], '[swapped]') === 'a,y,x,b' && selfCheck(pin).length === 0);
  ok('the box whose children say a z-index is isolated, so they stack within it', /ds-pin \{[^}]*isolation: isolate;/.test(css));
  // over every child in the flow, in the markup's order: the browser paints it so with nothing said
  const over = { ...pin, anatomy: { ...pin.anatomy, x: absAt(2), y: absAt(3), b: flowAt(1) }, variants: [] };
  const ocss = toCss(over, 'pin', { naming: ELEMENT });
  ok('parts out of the flow already over the flow, in markup order, say no z-index', !/z-index|isolation/.test(ocss) && paints(toElement(over, 'pin', { naming: ELEMENT, library: {} }), ocss, ['a', 'x', 'y', 'b'], null) === 'a,b,x,y');
  // a child in the flow that holds a part of its own out of it is positioned (its containing block), so it paints over
  // a part out of the flow written before it: under it in the design, that is said too
  const held = { ...over, anatomy: { ...over.anatomy, 'b/dot': { kind: 'graphic', parent: 'b', order: 0, position: 'absolute', absolute: { x: 0, y: 0 }, width: 2, height: 2 }, x: absAt(0), a: flowAt(1), b: { ...flowAt(2), kind: 'container' } } };
  const hcss = toCss(held, 'pin', { naming: ELEMENT });
  ok('a part under a positioned child in the flow is drawn under it', paints(toElement(held, 'pin', { naming: ELEMENT, library: {} }), hcss, ['a', 'x', 'y', 'b'], null) === 'x,a,b,y' && selfCheck(held).length === 0);
  // copies of one placed component with a part out of the flow between them: the copy is a part of its own, or it
  // would take its first's z-index and paint beside it, under the part between
  const tagAt = (n) => ({ kind: 'instance', parent: 'root', order: n, component: 'Tag', key: 't1' });
  const copies = { ...pin, props: {}, anatomy: { root: pin.anatomy.root, item: tagAt(0), x: absAt(1), item_2: tagAt(2) }, variants: [] };
  const kmk = toElement(copies, 'pin', { naming: ELEMENT, library: {} }), kcss = toCss(copies, 'pin', { naming: ELEMENT });
  ok('a copy with a part out of the flow between it and its first is a part of its own, painted over that part',
    kmk.includes('"data-part": "item-2"') && paints(kmk, kcss, ['item', 'x', 'item-2'], null) === 'item,x,item-2' && selfCheck(copies).length === 0);
  // a child in the flow that the browser paints with the positioned (see-through, or a placed component whose own root
  // holds a part out of the flow, so is positioned) already paints over a part written before it: nothing to say
  const seen = { ...pin, props: {}, anatomy: { root: pin.anatomy.root, b: flowAt(0), x: absAt(1), a: { ...flowAt(2), opacity: 0.5 } }, variants: [] };
  ok('a see-through child after a part out of the flow already paints over it: no z-index', !/z-index|isolation/.test(toCss(seen, 'pin', { naming: ELEMENT })));
  const badge = { contract: 1, component: 'Badge', props: {}, anatomy: { root: { kind: 'container', layout: { direction: 'row' } }, dot: { ...absAt(0), parent: 'root' } }, variants: [] };
  const placed = { ...seen, anatomy: { ...seen.anatomy, a: { kind: 'instance', parent: 'root', order: 2, component: 'Badge', key: 'b1' } } };
  ok('so does a placed component whose own root holds a part out of the flow', !/z-index|isolation/.test(toCss(placed, 'pin', { naming: ELEMENT, mains: (n) => (n === 'Badge' ? { ...badge, folder: 'badge' } : null) })));
  // (at the props it is placed at: a disabled one see-through there, though not at its defaults)
  const dim = { contract: 1, component: 'Dim', props: { state: { type: 'enum', values: ['rest', 'disabled'], figmaValues: ['Rest', 'Disabled'], default: 'rest', figma: 'State' } }, anatomy: { root: { kind: 'container', layout: { direction: 'row' } } },
    variants: [{ when: { state: 'disabled' }, set: { 'root.opacity': 0.4 } }] };
  const dimmed = { ...seen, anatomy: { ...seen.anatomy, a: { kind: 'instance', parent: 'root', order: 2, component: 'Dim', key: 'd1', with: { State: 'Disabled' } } } };
  ok('a placed component see-through at the props it is placed at paints over it too', !/z-index|isolation/.test(toCss(dimmed, 'pin', { naming: ELEMENT, mains: (n) => (n === 'Dim' ? { ...dim, folder: 'dim' } : null) })));
  // (an opacity said by a token, whose value the sheet does not know: drawn either way, z-index where either needs it)
  const tokened = { ...pin, props: {}, anatomy: { root: pin.anatomy.root, x: absAt(0), a: { ...flowAt(1), opacity: 'Opacity/soft' } }, variants: [] };
  ok('an opacity by a token the sheet cannot resolve is drawn right whichever value it holds', /z-index/.test(toCss(tokened, 'pin', { naming: ELEMENT })));
  // a variant that takes a part between two copies out of the flow: the copy is a part of its own there too
  const moved = { ...copies, props: { loose: { type: 'boolean', default: false, axis: true } }, anatomy: { ...copies.anatomy, x: flowAt(1) }, variants: [{ when: { loose: true }, set: { 'x.position': 'absolute', 'x.absolute': { x: 0, y: 0 } } }] };
  const mmk = toElement(moved, 'pin', { naming: ELEMENT, library: {} }), mcss = toCss(moved, 'pin', { naming: ELEMENT });
  ok('a copy whose sibling between a variant takes out of the flow is a part of its own',
    mmk.includes('"data-part": "item-2"') && paints(mmk, mcss, ['item', 'x', 'item-2'], '[loose]') === 'item,x,item-2' && selfCheck(moved).length === 0);
}
// a placed control the Selected layer names is the one the state reaches, at its depth; another control is not
const card = { ...chip, anatomy: { ...chip.anatomy, top: { kind: 'container', parent: 'root', order: 1, layout: { direction: 'row' } }, 'top/check': { kind: 'instance', parent: 'top', order: 0, component: 'Checkbox', with: { Selected: 'False' } }, foot: { kind: 'instance', parent: 'root', order: 2, component: 'Button' } },
  variants: [...chip.variants, { when: { selected: true }, set: { 'top/check.with': { Selected: 'True' } } }] };
const ccss = toCss(card, 'chip', { naming: { kind: 'class', prefix: 'ds-', part: '__' } });
ok('a placed control the contract names drives the state, and no other', ccss.includes(':has(> .ds-chip__top > .ds-chip__check :checked)') && ccss.includes(':has(> .ds-chip__top > .ds-chip__check :disabled)') && !ccss.includes('__foot :') && !/:has\(:/.test(ccss) && !ccss.includes(':has(> :disabled)') && !ccss.includes(':has(> :checked)') && selfCheck(card).length === 0);
// where Figma draws no disabled hover, a disabled box under the pointer is drawn at rest: rest admits it
const restDis = toCss({ ...chip, props: { ...chip.props, state: { ...chip.props.state, values: ['rest', 'hover', 'press'], pointer: ['hover', 'press'] } }, variants: [...chip.variants, { when: { state: 'press' }, set: { 'root.background': 'C/p' } }, { when: { state: 'rest', disabled: true }, set: { 'root.background': 'C/r' } }] }, 'chip', { naming: { kind: 'class', prefix: 'ds-', part: '__' } });
ok('rest is also a disabled box hovered, where disabled hover is not drawn', condition(chip, namer('chip'), 'state', 'rest').includes(':not(:hover:not(:is([data-disabled]') && !restDis.includes('undefined'));
// rest, where the product sets states of its own (disabled, read-only, active), is none of them: a rule naming rest never
// reaches a disabled box (a library's slider: a rest rule's display: none hid its handle at disabled and active)
{ const sl = { contract: 1, component: 'Slide', props: { state: { type: 'enum', values: ['rest', 'hover', 'disabled'], default: 'rest', role: 'interaction', pointer: ['hover'] } }, anatomy: { root: { kind: 'container' } }, variants: [] };
  const r = condition(sl, namer('slide'), 'state', 'rest');
  ok('rest, beside states the product sets, excludes them by its attribute', r.includes(':not(:hover)') && /:is\(\[data-state="rest"\], :not\(\[data-state\]\)\)/.test(r) && !/data-state/.test(condition(chip, namer('chip'), 'state', 'rest'))); }
// numbered copies of a placed component in one box are rows of one kind: the first's class and rule, no numbered parts
const rows = toCss({ ...chip, anatomy: { ...chip.anatomy, nav: { kind: 'container', parent: 'root', order: 1, layout: { direction: 'column' } }, 'nav/item': { kind: 'instance', parent: 'nav', order: 0, component: 'Row', width: 'fill' }, 'nav/item_2': { kind: 'instance', parent: 'nav', order: 1, component: 'Row', width: 'fill' } } }, 'chip', { naming: { kind: 'class', prefix: 'ds-', part: '__' } });
const odd = toCss({ ...chip, anatomy: { ...chip.anatomy, nav: { kind: 'container', parent: 'root', order: 1, layout: { direction: 'column' } }, 'nav/day': { kind: 'instance', parent: 'nav', order: 0, component: 'Day', opacity: 'O/dim' }, 'nav/day_2': { kind: 'instance', parent: 'nav', order: 1, component: 'Day', width: 'fill' } } }, 'chip', { naming: { kind: 'class', prefix: 'ds-', part: '__' } });
ok('a copy drawn otherwise than its first stays a part of its own', /__day-2 \{[^}]*align-self: stretch/.test(odd) && /__day \{[^}]*opacity/.test(odd));
const texts = toCss({ ...chip, anatomy: { ...chip.anatomy, title: { kind: 'text', parent: 'root', order: 1, color: 'C/a' }, title_2: { kind: 'text', parent: 'root', order: 2, color: 'C/b' } } }, 'chip', { naming: { kind: 'class', prefix: 'ds-', part: '__' } });
ok('numbered copies of a placed component take their first\'s class; two texts stay two parts', rows.includes('.ds-chip__nav > .ds-chip__item {') && !/item-2/.test(rows) && texts.includes('__title-2 {') && texts.includes('var(--c-b)'));
// a slot's children are its sample, drawn while the caller passes nothing: one rule places any child a caller puts there,
// placed and no more, and each part of the sample is written by its own class, as the design draws it (what the
// rule for any child says that a sample's child does not, unset on it)
const slotted = toCss({ ...chip, anatomy: { ...chip.anatomy, slot: { kind: 'slot', parent: 'root', order: 1, layout: { direction: 'column' } }, 'slot/item': { kind: 'container', parent: 'slot', order: 0, width: 'fill', background: 'C/x', layout: { direction: 'row' } }, 'slot/item/label': { kind: 'text', parent: 'slot/item', order: 0, color: 'C/y' }, 'slot/item_2': { kind: 'instance', parent: 'slot', order: 1, component: 'Badge', width: 'fill' } } }, 'chip', { naming: { kind: 'class', prefix: 'ds-', part: '__' } });
ok('a slot\'s rule for any child places it and no more', /\.ds-chip__slot > \* \{\s*align-self: stretch;\s*\}/.test(slotted));
ok('a slot\'s sample is written part by part, as the design draws it', /\.ds-chip__slot > \.ds-chip__item \{[^}]*background: var\(--c-x\)/.test(slotted) && /\.ds-chip__item > \.ds-chip__slot-item-label \{[^}]*color: var\(--c-y\)/.test(slotted));
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
// a ring layer another combination draws as a box (a library's focusBorder, shown open and drawn at focus): where its outline
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

// many axes, a pointer state, a pair, a combination's own and a combination left out: the rules that hold, found by the
// index, are those a one-by-one scan finds, in order; and the check that checks each case once (selfCheck) finds what
// checking every combination on its own finds, a seeded wrong value at every combination it reaches
// (seeded by hand, this cannot find a gap in what the check groups combinations by: the sample of stored contracts
// below compares the two on real contracts)
{ const many = { contract: 1, component: 'Many',
    props: { a: { type: 'boolean', default: false, axis: true }, b: { type: 'boolean', default: false, axis: true }, d: { type: 'boolean', default: true, axis: true },
      size: { type: 'enum', values: ['md', 'sm', 'lg'], default: 'md' }, state: { type: 'enum', values: ['rest', 'hover'], default: 'rest', role: 'interaction', pointer: ['hover'] } },
    anatomy: { root: { kind: 'container', layout: { direction: 'row', gap: 'S/4' }, background: 'C/rest' }, icon: { kind: 'container', parent: 'root', order: 0, width: 16, height: 16, background: 'C/icon' },
      label: { kind: 'text', parent: 'root', order: 1, typography: 'Label/md', color: 'T/base' } },
    variants: [{ when: { a: true }, remove: ['icon'] }, { when: { b: true }, set: { 'icon.background': 'C/b' } }, { when: { d: false }, set: { 'label.color': 'T/off' } },
      { when: { size: 'sm' }, set: { 'label.typography': 'Label/sm' } }, { when: { size: 'lg' }, set: { 'label.typography': 'Label/lg' } }, { when: { state: 'hover' }, set: { 'root.background': 'C/hover' } },
      { when: { b: true, state: 'hover' }, set: { 'icon.background': 'C/b-hover' } },
      { combination: true, when: { a: false, b: true, d: true, size: 'lg', state: 'hover' }, set: { 'root.background': 'C/lg-hover' } }],
    invalid: [{ d: false, state: 'hover' }] };
  const { rules } = rulesOf(many), dflt = { a: false, b: false, d: true, size: 'md', state: 'rest' };
  const scan = (full) => rules.filter((r) => Object.entries(r.when).every(([k, v]) => full[k] === v));
  ok('the rules that hold at a combination, found by the index, are those a one-by-one scan finds, in order',
    combinations(many).every((m) => { const full = { ...dflt, ...m }; const x = rulesAt(rules, full), y = scan(full); return x.length === y.length && x.every((r, i) => r === y[i]); }) && rules.length > 5);
  const k = rules.findIndex((r) => Object.keys(r.when).length === 1 && r.parts.label);
  // (and a rule of a prop whose layer changes nothing drawn where the icon is gone: the same anatomy, other rules)
  const seeded = [...rules.map((r, i) => (i === k ? { ...r, parts: { ...r.parts, label: new Map([...r.parts.label].map(([p, d]) => [p, { ...d, v: 'var(--wrong)' }])) } } : r)),
    { when: { b: true }, weight: 1, parts: { label: new Map([['letter-spacing', { v: '1px' }]]) } }];
  const said = (list) => new Set(list.map((o) => JSON.stringify([o.when, o.part, o.property, o.want, o.got])));
  const once = said(selfCheck(many, seeded)), each = said(selfCheck(many, seeded, undefined, HOUSE, null, { each: true }));
  ok('the check that checks each case once finds what checking every combination on its own finds: a seeded wrong value, wherever it reaches',
    selfCheck(many, rules).length === 0 && each.size > 1 && once.size === each.size && [...each].every((x) => once.has(x)) && [...each].some((x) => x.includes('letter-spacing') && x.includes('"a":true'))); }

// every contract stored on this machine: each stylesheet rebuilds every variant its contract draws (skipped with none)
const require = createRequire(import.meta.url);
// No catch: a contract that crashes the rebuild is a failure, never "not read" and then a skip (review, 2026-10-31).
let stored = 0, off = 0, sampled = 0, apart = 0;
const EACH_MAX = 256, said = (list) => new Set(list.map((o) => JSON.stringify([o.when, o.part, o.property, o.want, o.got, o.except || null])));
const projects = require('../snapshot/projects.cjs');
for (const { name: label } of projects.projects().list) {
  const w = projects.layout(null, label);
  const dir = w && w.paths && w.paths.components;
  if (!dir || !fs.existsSync(dir)) continue;
  // (with the project's own components as the mains it places: an override inside one is checked as the sheet writes it)
  const all = fs.readdirSync(dir).map((f) => [f, path.join(dir, f, 'contract.json')]).filter(([, file]) => fs.existsSync(file)).map(([f, file]) => [f, JSON.parse(fs.readFileSync(file, 'utf8'))]);
  const mains = require('./derive.cjs').byComponentName(all.map(([, c]) => c));
  // and on a fixed sample, the check that checks each case once against every combination checked on its own, each
  // given the contract's rules less one (so both have something to find): the twenty with the most variants whose
  // combinations stay few enough to check one by one, and every twentieth of the rest by name
  const few = all.filter(([, c]) => combinations(c).length <= EACH_MAX).sort((x, y) => (y[1].variants || []).length - (x[1].variants || []).length || (x[0] < y[0] ? -1 : 1));
  const sample = new Set([...few.slice(0, 20), ...few.slice(20).sort((x, y) => (x[0] < y[0] ? -1 : 1)).filter((_, i) => i % 20 === 0)].map(([f]) => f));
  for (const [f, c] of all) {
    stored++;
    const { rules } = rulesOf(c, mains);
    if (selfCheck(c, rules, mains).length) { off++; console.log('  not rebuilt:', label, f); }
    if (!sample.has(f)) continue;
    sampled++;
    const less = rules.filter((_, i) => i !== Math.floor(rules.length / 2));
    const once = said(selfCheck(c, less, mains)), each = said(selfCheck(c, less, mains, HOUSE, null, { each: true }));
    if (once.size !== each.size || [...each].some((x) => !once.has(x))) { apart++; console.log('  checked once differs from each:', label, f); }
  }
}
if (stored) ok(`every stored contract's stylesheet rebuilds every variant it draws (${stored} contracts)`, off === 0);
if (sampled) ok(`on real contracts, the check that checks each case once finds what checking every combination finds (${sampled} sampled)`, apart === 0);
else console.log('skip: no stored contracts on this machine');

// a part inside a placed component a pointer state and a selection put in (a row's cell padding at hover and selected):
// at rest the component draws it in its own values, so the sheet never hides it there; nor is a hide flagged as a display
// the combination lacks where it is hidden (a glyph in it)
{ const pad = { kind: 'container', layout: { direction: 'column', gap: 0, padding: { top: 16, end: 16, bottom: 16, start: 16 } } };
  const cell = { contract: 1, component: 'Cell', props: {}, anatomy: { root: { kind: 'container', layout: { direction: 'row' } }, pad: { ...pad, parent: 'root' }, 'pad/label': { kind: 'text', parent: 'pad', content: 'x', color: 'T/base' } }, variants: [] };
  const inside = { 'col/pad': { ...pad, parent: 'col' }, 'col/pad/icon': { kind: 'instance', parent: 'col/pad', component: 'Icon', with: { '<icon>': 'Chevron' } } };
  const row = { contract: 1, component: 'Row', props: { state: { type: 'enum', values: ['rest', 'hover'], default: 'rest', role: 'interaction', pointer: ['hover'] }, selected: { type: 'boolean', default: false, axis: true } },
    anatomy: { root: { kind: 'container', layout: { direction: 'row' }, background: 'C/rest' }, col: { kind: 'instance', parent: 'root', component: 'Cell' } },
    variants: [{ when: { state: 'hover' }, set: { 'root.background': 'C/hover' }, add: inside }, { when: { selected: true }, set: { 'root.background': 'C/on' }, add: inside }] };
  ok('a placed component\'s own part a pointer state puts in is never hidden where the component draws it, and the cascade rebuilds the row', selfCheck(row, null, require('./derive.cjs').byComponentName([cell, row])).length === 0); }

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

// an instance of a component the store does not hold (an icon of another library: one library's checkbox draws its Checkbox
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
  // a host each variant adds at its own props (a library's text input adds Status notification per state): a part inside it
  // is named by the variant that draws it there, whichever variant comes first (the first reading lists error's first)
  const stat = { contract: 1, component: 'Stat', props: { status: { type: 'enum', values: ['alt', 'failed'], default: 'alt', figma: 'Status' } }, anatomy: { root: { kind: 'container' } },
    variants: [{ when: { status: 'alt' }, add: { warnAlt: { kind: 'instance', parent: 'root', component: 'WarnAlt', key: 'a1', order: 0 } } }, { when: { status: 'failed' }, add: { warn: { kind: 'instance', parent: 'root', component: 'Warn', key: 'a2', order: 0 } } }] };
  const field = { contract: 1, component: 'Field', props: { state: { type: 'enum', values: ['rest', 'warning', 'error'], default: 'rest', figma: 'State' } }, anatomy: { root: { kind: 'container' } },
    variants: [{ when: { state: 'error' }, add: { stat: { kind: 'instance', parent: 'root', component: 'Stat', key: 's1', with: { Status: 'Failed' }, order: 0 } } },
      { when: { state: 'warning' }, add: { stat: { kind: 'instance', parent: 'root', component: 'Stat', key: 's1', with: { Status: 'Alt' }, order: 0 }, 'stat/warnAlt': { kind: 'instance', parent: 'stat', component: 'WarnAlt', key: 'a1', order: 0, border: { color: 'C/clear', width: 1 } } } }] };
  const fsheet = toCss(field, 'field', { naming: { kind: 'class', prefix: 'ds-', part: '__' }, mains: (n) => (n === 'Stat' ? { ...stat, folder: 'stat' } : null) });
  ok('a part inside a host each variant adds is named by the variant that draws it, not the first to add the host',
    /data-state="warning"[^{]*> \.ds-field__stat > \.ds-stat__warn-alt \{[^}]*box-shadow: inset 0 0 0 1px var\(--c-clear\)/.test(fsheet));
  ok('with no store given, a placed instance is given only its place', !/outline|box-shadow|border-radius/.test(toCss(box, 'box', { naming: { kind: 'class', prefix: 'ds-', part: '__' } })));
}

// a placed component the store holds that sets its component's blend back (rules.mjs UNBLENDED, `normal`: a library's
// number input over its action item's darkened divider) is written so over the component's mode, directly and as a
// nested instance inside a held one; a layer kept inside it too
{
  const item = { contract: 1, component: 'Item', props: {}, anatomy: { root: { kind: 'container', blend: 'darken' }, divider: { kind: 'container', parent: 'root', order: 0, width: 1, height: 20, background: 'C/line', blend: 'darken' } }, variants: [] };
  const pair = { contract: 1, component: 'Pair', props: {}, anatomy: { root: { kind: 'container' }, item: { kind: 'instance', parent: 'root', order: 0, component: 'Item', key: 'i1' } }, variants: [] };
  const input = { contract: 1, component: 'Input', props: {}, anatomy: { root: { kind: 'container' },
    item: { kind: 'instance', parent: 'root', order: 0, component: 'Item', key: 'i1', blend: 'normal' },
    'item/divider': { kind: 'container', parent: 'item', order: 0, width: 1, height: 20, background: 'C/line', blend: 'normal' },
    pair: { kind: 'instance', parent: 'root', order: 1, component: 'Pair', key: 'p1' },
    'pair/item': { kind: 'instance', parent: 'pair', order: 0, component: 'Item', key: 'i1', blend: 'normal' } }, variants: [] };
  const mains = (n) => (n === 'Item' ? { ...item, folder: 'item' } : n === 'Pair' ? { ...pair, folder: 'pair' } : null);
  const sheet = toCss(input, 'input', { naming: { kind: 'class', prefix: 'ds-', part: '__' }, mains });
  ok('a held instance said unblended is mix-blend-mode normal over its component\'s mode, placed directly, nested in a held one, and a layer kept inside it',
    /\.ds-input__item \{[^}]*mix-blend-mode: normal;/.test(sheet) && /> \.ds-input__pair > \.ds-pair__item \{[^}]*mix-blend-mode: normal;/.test(sheet)
    && /> \.ds-input__item > \.ds-item__divider \{[^}]*mix-blend-mode: normal;/.test(sheet) && selfCheck(input, rulesOf(input, mains).rules, mains).length === 0);
}

// a part a placed component draws only at the props a variant places it with (Icon button's focus ring at state focus,
// overridden inside a library's split button): the mapping reads it where the sheet writes it, the host placed at those
// props, never at its base ones, where the part is not, nor matched by place to another part there (its tooltip)
{
  const ib = { contract: 1, component: 'IB', props: { state: { type: 'enum', values: ['default', 'focus'], default: 'default' } }, anatomy: { root: { kind: 'container' } },
    variants: [{ when: { state: 'focus' }, add: { ring: { kind: 'container', parent: 'root', order: 1, name: 'Ring', radius: 'R/F' } } }] };
  const split = { contract: 1, component: 'Split', props: { state: { type: 'enum', values: ['default', 'focus'], default: 'default' } }, anatomy: { root: { kind: 'container' }, btn: { kind: 'instance', parent: 'root', component: 'IB', with: { state: 'default' } } },
    variants: [{ when: { state: 'focus' }, set: { 'btn.with': { state: 'focus' } }, add: { 'btn/ring': { kind: 'container', parent: 'btn', order: 1, name: 'Ring', radius: [0, 'R/F', 'R/F', 0] } } }] };
  const mains = (n) => (n === 'IB' ? { ...ib, folder: 'ib' } : null);
  ok('a part a placed component draws only at a variant\'s props is mapped through the host placed at those props',
    nestedSelector(split, namer('split'), 'btn/ring', mains) === '.split > .split__btn > .ib__ring');
}

// a placed instance this component puts in a placed component's slot (a list item's content) is placed as its own: its
// own styling over its component's root (an alignment) written on it, reached through the slot by this component's hook
{
  const content = { contract: 1, component: 'Content', folder: 'content', props: {}, anatomy: { root: { kind: 'container', layout: { direction: 'column', align: 'center' } } }, variants: [] };
  const item = { contract: 1, component: 'Item', folder: 'item', props: {}, anatomy: { root: { kind: 'container', layout: { direction: 'row' } }, body: { kind: 'slot', parent: 'root', layout: { direction: 'column' } } }, variants: [] };
  const swipe = { contract: 1, component: 'Swipe', props: {}, anatomy: { root: { kind: 'container', layout: { direction: 'row' } }, item: { kind: 'instance', parent: 'root', component: 'Item' }, 'item/body': { kind: 'slot', parent: 'item', layout: { direction: 'column' } },
    'item/body/text': { kind: 'instance', parent: 'item/body', component: 'Content', layout: { direction: 'column', align: 'start' } } }, variants: [] };
  const mains = (n) => ({ Content: content, Item: item })[n] || null;
  const sheet = toCss(swipe, 'swipe', { naming: { kind: 'class', prefix: 'ds-', part: '__' }, mains });
  ok('a placed instance put in a placed component\'s slot writes its own override on itself, under the slot',
    /\.ds-swipe > \.ds-swipe__item > \.ds-item__body > \.ds-swipe__text \{\s*justify-content: flex-start;/.test(sheet), sheet);
}

// a part the placed component draws turned a quarter in its turn's wrapper (turnedParts: a min-height line upright in a
// column): reached through that wrapper, as the placed component's markup and sheet draw it, never as a child it is not
{
  const spacer = { contract: 1, component: 'Spacer', props: {}, anatomy: { root: { kind: 'container', layout: { direction: 'column' }, width: 0, height: 102 }, line: { kind: 'graphic', parent: 'root', order: 0, width: 102, height: 0, rotation: -90 } }, variants: [] };
  const area = { contract: 1, component: 'Area', props: {}, anatomy: { root: { kind: 'container', layout: { direction: 'row' } }, sizer: { kind: 'instance', parent: 'root', component: 'Spacer' }, 'sizer/line': { kind: 'graphic', parent: 'sizer', order: 0, width: 102, height: 0, rotation: -90 } }, variants: [] };
  const mains = (n) => (n === 'Spacer' ? { ...spacer, folder: 'spacer' } : null);
  ok('a part a placed component draws in its turn\'s wrapper is reached through that wrapper',
    nestedSelector(area, namer('area'), 'sizer/line', mains) === '.area > .area__sizer > [data-turn="line"] > .spacer__line', nestedSelector(area, namer('area'), 'sizer/line', mains));
}

// a part inside a numbered copy the placed component draws, which shares its first's hook (copyOf): named by that hook,
// counted among the copies, as the placed component's markup draws it, never by a number no markup writes
{
  const day = { contract: 1, component: 'Day', props: {}, anatomy: { root: { kind: 'container' }, label: { kind: 'text', parent: 'root', content: '1' } }, variants: [] };
  const week = { contract: 1, component: 'Week', props: {}, anatomy: { root: { kind: 'container' }, day: { kind: 'instance', parent: 'root', order: 0, component: 'Day' }, day_2: { kind: 'instance', parent: 'root', order: 1, component: 'Day' } }, variants: [] };
  const cal = { contract: 1, component: 'Cal', props: {}, anatomy: { root: { kind: 'container' }, week: { kind: 'instance', parent: 'root', component: 'Week' }, 'week/day_2': { kind: 'instance', parent: 'week', order: 1, component: 'Day' }, 'week/day_2/label': { kind: 'text', parent: 'week/day_2', content: '9' } }, variants: [] };
  const mains = (n) => ({ Day: { ...day, folder: 'day' }, Week: { ...week, folder: 'week' } })[n] || null;
  ok('a part inside a placed component\'s numbered copy is named by the hook the copies share, counted among them',
    nestedSelector(cal, namer('cal'), 'week/day_2', mains) === '.cal > .cal__week > .week__day:nth-child(2 of .week__day)', nestedSelector(cal, namer('cal'), 'week/day_2', mains));
}

// a placed icon whose lone glyph a variant fades (a library's disabled chip: 0.38 on the glyph, the instance faded too where
// it is elevated): code colours the instance, so the glyph's opacity is written there, times the instance's own
{
  const chip = { contract: 1, component: 'Chip', props: { off: { type: 'boolean', default: false, axis: true, figma: 'Disabled' }, raised: { type: 'boolean', default: false, axis: true, figma: 'Raised' } },
    anatomy: { root: { kind: 'container' }, icon: { kind: 'instance', parent: 'root', component: 'Check', width: 18, height: 18 }, 'icon/vector': { kind: 'graphic', parent: 'icon', background: 'C/on' } },
    variants: [{ when: { off: true }, set: { 'icon/vector.opacity': 0.38 } }, { when: { off: true, raised: true }, set: { 'icon.opacity': 0.38 } }] };
  const sheet = toCss(chip, 'chip', { naming: { kind: 'class', prefix: 'ds-', part: '__' } });
  ok('a lone glyph\'s opacity is written on its instance, times the instance\'s own',
    /data-off[^{]*> \.ds-chip__icon \{[^}]*opacity: 0\.38;/.test(sheet) && /opacity: 0\.144;/.test(sheet) && selfCheck(chip, rulesOf(chip).rules).length === 0);
  // (only a glyph the comparison folds up: one that also overrides its size keeps its opacity to itself, said as it is)
  const sized = { ...chip, anatomy: { ...chip.anatomy, 'icon/vector': { ...chip.anatomy['icon/vector'], width: 12 } } };
  ok('a glyph that overrides more than its colour and opacity gives the instance no opacity', !/opacity: 0\.144;/.test(toCss(sized, 'chip', { naming: { kind: 'class', prefix: 'ds-', part: '__' } })));
  // a lone glyph painted with nothing (its fills emptied) in an icon the library does not hold: the icon transparent,
  // where it would take the colour around it; one a variant paints takes that colour there
  const bare = { ...chip, variants: [{ when: { off: true }, set: { 'icon/vector.background': 'C/on' } }], anatomy: { ...chip.anatomy, 'icon/vector': { kind: 'graphic', parent: 'icon' } } };
  const bareSheet = toCss(bare, 'chip', { naming: { kind: 'class', prefix: 'ds-', part: '__' } });
  ok('a lone glyph painted with nothing makes its icon transparent; a variant that paints it colours it there',
    /\.ds-chip__icon \{[^}]*color: transparent;/.test(bareSheet) && /data-off[^{]*> \.ds-chip__icon \{[^}]*color: var\(/.test(bareSheet), bareSheet);
}

// an icon placed inside a placed component, which a variant recolours there (a library's disabled Toggletip icon): the
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
  // a variant that places another component there and drops the override (drawn as that component draws it): nothing of
  // the base's override reaches it, as nothing does where it keeps the layer (a selected menu item's trailing element)
  const tagSel = { ...tag, component: 'Tag selected' };
  const mains2 = (n) => (n === 'Tag' ? tag : n === 'Tag selected' ? tagSel : null);
  const swapped = { ...loud, variants: [{ when: { loud: true }, set: { 'tag.component': 'Tag selected' }, remove: ['tag/text'] }] };
  const kept = { ...loud, variants: [{ when: { loud: true }, set: { 'tag.component': 'Tag selected' } }] };
  const at = (x) => toCss(x, 'card', { naming: { kind: 'class', prefix: 'ds-', part: '__' }, mains: mains2 }).split('@layer').slice(1).join('').match(/data-loud[^{]*> \.ds-tag__text \{[^}]*\}/g) || [];
  ok('an override a variant drops where it places another component goes back there, as where it keeps the layer',
    at(swapped).length === 1 && /color: unset;/.test(at(swapped)[0]) && JSON.stringify(at(swapped)) === JSON.stringify(at(kept)) && selfCheck(swapped, rulesOf(swapped, mains2).rules, mains2).length === 0);
  // an override a variant adds where the defaults have none, which a combination sets back to the component's own value:
  // that value is written there, never unset, which would undo the component's own (a library's slider, disabled and
  // large, its active track's corners 0, 2026-11-24)
  const added = { ...loud, props: { ...loud.props, big: { type: 'boolean', default: false, axis: true, figma: 'Big' } }, anatomy: { root: card.anatomy.root, tag: card.anatomy.tag },
    variants: [{ when: { loud: true }, add: { 'tag/text': { kind: 'text', parent: 'tag', color: 'C/x', typography: 'Label/sm' } } }, { when: { loud: true, big: true }, set: { 'tag/text.color': 'C/strong' } }] };
  const ad = toCss(added, 'card', { naming: { kind: 'class', prefix: 'ds-', part: '__' }, mains });
  ok('a combination that sets an added override back to the component\'s value writes that value, never unset',
    /data-big[^{]*> \.ds-tag__text \{\s*color: var\(--c-strong\);\s*\}/.test(ad) && !/color: unset/.test(ad) && selfCheck(added, rulesOf(added, mains).rules, mains).length === 0);
  // the component's own value is given only where some combination overrides that property otherwise: a part that
  // matches its component at the defaults, which a variant recolours, says its colour there as given and nothing else
  const plain = { ...loud, anatomy: { root: card.anatomy.root, tag: card.anatomy.tag, 'tag/text': { kind: 'text', parent: 'tag', color: 'C/strong', typography: 'Label/sm' } },
    props: { loud: loud.props.loud, state: { type: 'enum', values: ['rest', 'hover'], default: 'rest', role: 'interaction', pointer: ['hover'] } },
    variants: [{ when: { loud: true }, set: { 'tag/text.color': 'C/x' } }, { when: { state: 'hover' }, remove: ['tag/text'] }] };
  const at0 = drawn(plain, { loud: false, state: 'rest' }, mains)['tag/text'];
  ok('a part as its component draws it gives only what a combination overrides otherwise, as given', !!at0 && [...at0.decls].length === 1 && at0.decls.get('color').given === true, JSON.stringify(at0 && [...at0.decls]));
  // a pointer state that drops such a part draws it as its component: never hidden
  const ps = toCss(plain, 'card', { naming: { kind: 'class', prefix: 'ds-', part: '__' }, mains });
  ok('a part a pointer state drops that matched its component at rest is drawn as the component there, never hidden',
    !(ps.match(/[^\n]*:hover[^{]*> \.ds-tag__text \{[^}]*\}/g) || []).some((r) => !/data-loud/.test(r) && /display: none/.test(r)) && selfCheck(plain, rulesOf(plain, mains).rules, mains).length === 0);
  // a part a pointer state takes away (an override at rest) stays hidden in every combination that drops it, whatever a
  // later rule resets, and shows where a combination draws it again (a danger press puts it back): a glyph of another
  // library placed in a holder this one keeps, recoloured
  const holder = { contract: 1, component: 'Holder', props: { size: { type: 'enum', values: ['12', '20'], default: '12', figma: 'Size', figmaValues: ['12', '20'] } },
    anatomy: { root: { kind: 'container', layout: { direction: 'row' } }, glyph: { kind: 'instance', parent: 'root', component: 'Glyph', width: 12, height: 12, order: 0 } },
    variants: [{ when: { size: '20' }, set: { 'glyph.width': 20, 'glyph.height': 20 } }] };
  const held = (n) => (n === 'Holder' ? holder : null);
  const glyph = { kind: 'instance', parent: 'holder', component: 'Glyph', width: 20, height: 20, order: 0 }, shape = { kind: 'graphic', parent: 'holder/glyph', width: 13, height: 13, background: 'C/icon', order: 0 };
  const fb = { contract: 1, component: 'Row', props: { feedback: { type: 'enum', values: ['neutral', 'danger'], default: 'neutral' }, disabled: { type: 'boolean', default: false, axis: true },
    state: { type: 'enum', values: ['rest', 'press'], default: 'rest', role: 'interaction', pointer: ['press'] } },
    anatomy: { root: { kind: 'container', layout: { direction: 'row' } }, holder: { kind: 'instance', parent: 'root', component: 'Holder', with: { Size: '20' }, order: 0 }, 'holder/glyph': glyph, 'holder/glyph/shape': shape },
    variants: [{ when: { disabled: true }, set: { 'root.opacity': 0.5 } }, { when: { state: 'press' }, remove: ['holder/glyph', 'holder/glyph/shape'] }, { when: { feedback: 'danger', state: 'press' }, add: { 'holder/glyph': glyph, 'holder/glyph/shape': shape } }] };
  const fs2 = toCss(fb, 'row', { naming: { kind: 'class', prefix: 'ds-', part: '__' }, mains: held });
  const pressed = (fs2.match(/[^\n]*active[^{]*> \.ds-holder__glyph \{[^}]*\}/g) || []);  ok('a part a pointer state takes away keeps its hide against a later reset, and shows where a combination draws it again',
    selfCheck(fb, rulesOf(fb, held).rules, held).length === 0 && pressed.some((r) => /display: none/.test(r) && !/danger/.test(r)) && pressed.some((r) => /danger/.test(r) && /display: unset/.test(r)) && !pressed.some((r) => !/danger/.test(r) && /display: unset/.test(r)), pressed.join('\n'));
  // what the component declares that the instance does not is unset
  const bare ={ ...card, anatomy: { root: card.anatomy.root, tag: card.anatomy.tag, 'tag/text': { kind: 'text', parent: 'tag', color: 'C/strong' } } };
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
ok('an instance that sets its component\'s blend back is mix-blend-mode normal, and a blend is its mode',
  decl({ kind: 'instance', blend: 'normal' }, { row: true })['mix-blend-mode'] === 'normal' && decl({ kind: 'container', blend: 'color_burn' }, { row: true })['mix-blend-mode'] === 'color-burn'
  && !('mix-blend-mode' in decl({ kind: 'container' }, { row: true })));
ok('an instance that stops its component\'s clip is overflow visible, a clip is hidden, and neither paints a box of its own',
  decl({ kind: 'instance', overflow: 'visible' }, { row: true }).overflow === 'visible' && decl({ kind: 'container', overflow: 'hidden' }, { row: true }).overflow === 'hidden'
  && !('overflow' in decl({ kind: 'container' }, { row: true }))
  && !paintsAny({ anatomy: { root: { kind: 'container' }, a: { kind: 'instance', parent: 'root', overflow: 'visible' } }, variants: [] }, 'a')
  && paintsAny({ anatomy: { root: { kind: 'container' }, a: { kind: 'container', parent: 'root', overflow: 'hidden' } }, variants: [] }, 'a'));
ok('a shadow an instance clears is box-shadow none; a ring it draws stays, and none is never a token', decl({ kind: 'instance', shadow: 'none' }, { row: true })['box-shadow'] === 'none'
  && !/var\(--none/.test(JSON.stringify(decl({ kind: 'instance', shadow: 'none', border: { color: 'Line', width: 1, align: 'outside' } }, { row: true }))));
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
// a vector's own outline (derive's paths) as a clip of its filled box, its fill rule said; an open path stays unread
{ const v = declarations({ kind: 'graphic', background: 'C/s', paths: [{ windingRule: 'EVENODD', data: 'M 0 0 L 4 0 L 4 4 Z' }] }, {}, names), open = declarations({ kind: 'graphic', paths: [{ windingRule: 'NONE', data: 'M 0 0 L 4 4' }] }, {}, names);
  ok('a vector\'s one path is its box\'s clip-path, nothing unread; an open one is unread, never dropped', Object.fromEntries(v.decls)['clip-path'] === 'path(evenodd, "M 0 0 L 4 0 L 4 4 Z")' && !v.unread.length
    && !open.decls.some(([p]) => p === 'clip-path') && open.unread.some((f) => /^paths/.test(f))); }
// (a clip is fixed pixels: a vector that scales, stretches, fills or hugs, or one with a stroke or a shadow the clip
// would cut, keeps its box and says its paths unread)
{ const P = [{ windingRule: 'NONZERO', data: 'M 0 0 L 4 0 L 4 4 Z' }], none = (e) => { const d = declarations({ kind: 'graphic', background: 'C/s', width: 4, height: 4, paths: P, ...e }, {}, names); return !d.decls.some(([p]) => p === 'clip-path') && d.unread.some((f) => /^paths/.test(f)); };
  const masked = (e) => { const d = declarations({ kind: 'graphic', background: 'C/s', width: 4, height: 4, paths: P, ...e }, {}, names); return !d.decls.some(([p]) => p === 'clip-path') && d.decls.some(([p, v]) => p === 'mask' && /^url\("data:image\/svg\+xml,/.test(v)) && !d.unread.some((f) => /^paths/.test(f)); };
  ok('a vector drawn at another size than its paths\' is never clipped to them: one that scales or stretches is masked by them at its own size (rules.mjs pathsToMask), one that fills or hugs, of no set size, unread',
    masked({ constraints: { horizontal: 'scale', vertical: 'min' }, absolute: { x: 0, y: 0 } }) && masked({ constraints: { horizontal: 'min', vertical: 'stretch' }, absolute: { x: 0, y: 0 } }) && none({ width: 'fill' }) && none({ height: 'hug' }));
  ok('…nor one whose stroke or shadow the clip would cut', none({ border: { color: 'C/s', width: 1, align: 'outside' } }) && none({ border: { color: 'C/s', width: 1, align: 'center' } }) && none({ shadow: 'Elevation/1' })); }
// a dashed line (a divider no tall): its one edge dashed, nothing unread
{ const l = declarations({ kind: 'graphic', width: 160, height: 0, border: { color: 'C/s', align: 'center', dash: [2, 2], width: 1 } }, {}, names);
  ok('a dashed line draws its one edge dashed, and leaves nothing unread', Object.fromEntries(l.decls)['border-top'] === '1px dashed var(--c-s)' && !l.unread.length); }
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
    /:focus-visible[^{]*> \.pick__down \{[^}]*display: none/.test(css) && !/pick__dot \{[^}]*display: none/.test(css) && (css.match(/__down \{\s*display: none/g) || []).length === 1);
  // a part only a pointer state draws (the up arrow at focus): the markup holds it, so the sheet hides it at rest and
  // draws it at that state's pseudo-class, where a page forced to the state reads it
  ok('a part only a pointer state draws is hidden by the sheet at rest and drawn at that state alone',
    /\.pick > \.pick__up \{\s*display: none;\s*\}/.test(css) && /:where\(:is\(:focus-visible[^{]*\) > \.pick__up \{\s*display: unset/.test(css) && /:where\(:is\(:focus-visible[^{]*\) > \.pick__up \{\s*inline-size/.test(css) && selfCheck(c, rulesOf(c).rules).length === 0); }
// a part only a pointer state draws takes its place among the parts another variant places at that state's combination:
// a grip a variant puts after the icons a hover adds stands after them in the markup, though that variant adds none
{ const c = { contract: 1, component: 'Btn', props: { grip: { type: 'boolean', default: false }, state: { type: 'enum', values: ['rest', 'hover'], default: 'rest', role: 'interaction', pointer: ['hover'] } },
    anatomy: { root: { kind: 'container', layout: { direction: 'row' } }, label: { kind: 'text', parent: 'root', content: 'Go', order: 0 } },
    variants: [{ when: { grip: true }, add: { grip: { kind: 'container', parent: 'root', order: 1 } } }, { when: { state: 'hover' }, add: { icon: { kind: 'container', parent: 'root', order: 1 } } }, { when: { grip: true, state: 'hover' }, set: { 'grip.order': 2 } }] };
  const ids = markupOrder(c, childrenOf(partsOf(c)).get('root')).order.map((p) => p.id);
  ok('a part only a pointer state draws is placed among the parts its combination places', JSON.stringify(ids) === JSON.stringify(['label', 'icon', 'grip']));
  // (and stacked by that place: out of the flow, it would paint over the grip the design puts above it)
  const out = { ...c, variants: c.variants.map((v) => (v.add && v.add.icon ? { ...v, add: { icon: { ...v.add.icon, position: 'absolute', absolute: { x: 2, y: 2 } } } } : v)) };
  const css = toCss(out, 'btn');
  ok('and is stacked by that place where it stands out of the flow', /isolation: isolate/.test(css) && /:where\(:hover\) > \.btn__grip \{[^}]*z-index: 3/.test(css)); }
// two parts a combination numbers alike (each placed by a variant of its own) stack as they are listed, as the compare
// ranks them, never both at one z-index left to the markup's order
{ const c = { contract: 1, component: 'Btn', props: { grip: { type: 'boolean', default: false }, big: { type: 'boolean', default: false }, state: { type: 'enum', values: ['rest', 'hover'], default: 'rest', role: 'interaction', pointer: ['hover'] } },
    anatomy: { root: { kind: 'container', layout: { direction: 'row' } }, label: { kind: 'text', parent: 'root', content: 'Go', order: 0 } },
    variants: [{ when: { grip: true }, add: { grip: { kind: 'container', parent: 'root', order: 1, width: 4, height: 4 } } }, { when: { state: 'hover' }, add: { icon: { kind: 'container', parent: 'root', order: 1, width: 4, height: 4, position: 'absolute', absolute: { x: 0, y: 0 } } } },
      { when: { grip: true, big: true, state: 'hover' }, set: { 'grip.order': 3 }, combination: true }] };
  const css = toCss(c, 'btn');
  ok('two parts a combination numbers alike stack in the order they are listed', /isolation: isolate/.test(css) && /\[data-grip\][^{]*:hover[^{]*> \.btn__icon \{[^}]*z-index: 3/.test(css) && selfCheck(c, rulesOf(c).rules).length === 0); }
// a part the rest of the grid draws that a pointer state also puts in (a tile's border, framed or hovered): the markup
// holds it, so the sheet hides it where the contract draws none and shows it at the pointer state (a library's tile, 2026-11-21)
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
  // whatever its props make it; a library's dropdown's read-only tag, whose content read as filling under display: unset)
  const tag = { contract: 1, component: 'Tag', props: {}, anatomy: { root: { kind: 'container', layout: { direction: 'row' } } }, variants: [] };
  const held = { ...c, variants: [{ when: { kind: 'framed' }, add: { tag: { kind: 'instance', parent: 'root', component: 'Tag' } } }, { when: { state: 'hover' }, add: { tag: { kind: 'instance', parent: 'root', component: 'Tag' } } }] };
  const hm = (n) => (n === 'Tag' ? tag : null), hc = toCss(held, 'tile', { naming: { kind: 'class', prefix: 'ds-', part: '__' }, mains: hm });
  ok('a placed component a pointer state also puts in is hidden where the contract draws none and its own display left alone', /__tag \{\s*display: none;\s*\}/.test(hc) && !/__tag \{[^}]*display: (?!none)/.test(hc) && selfCheck(held, rulesOf(held, hm).rules, hm).length === 0);
  // (a pseudo part, `::`, is no element the markup holds: never hidden this way)
  const ps = { ...c, variants: [{ when: { kind: 'framed' }, add: { 'label::after': { kind: 'graphic', parent: 'label' } } }, { when: { state: 'hover' }, add: { 'label::after': { kind: 'graphic', parent: 'label' } } }] };
  ok('a pseudo part a pointer state also puts in is not hidden by display', !/::after \{\s*display: none/.test(toCss(ps, 'tile', { naming: { kind: 'class', prefix: 'ds-', part: '__' } }))); }
  // (one a pointer state draws as a ring, focus's outline on the box it rings, stays that outline: no element held for it
  // there, none hidden; a library's dropdown, whose focus border came back as a second ring)
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
  ok('a slot\'s sample frame gives its empty size to nothing a caller places, only to itself', !/> \*(:not\(:has\(\*\)\))? \{[^}]*min-block-size/.test(css) && /sheet__sample:not\(:has\(\*\)\) \{[^}]*min-block-size: 12\.5rem/.test(css));
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
// an override set on a placed instance itself (a fill on a library's toggle item, per state) is written on the instance,
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
// a placed component is reached as its own sheet draws it: one whose name says button but which places a Button is a
// box, no host wrapping a <button>, though its holder's record keeps none of its insides (a library's code snippet ghost button)
{
  const EL = { kind: 'element', prefix: 'ds-' };
  const ghost = { contract: 1, component: 'Ghost button', props: {}, anatomy: { root: { kind: 'container' }, button: { kind: 'instance', parent: 'root', component: 'Button', with: {} } }, variants: [] };
  const holder = { contract: 1, component: 'Snippet', props: { copy: { type: 'boolean', default: true, axis: true, figma: 'Copy' } },
    anatomy: { root: { kind: 'container', layout: { direction: 'row', gap: 0, align: 'start', crossAlign: 'start' } }, spacer: { kind: 'container', parent: 'root', order: 0, width: 8 }, ghost: { kind: 'instance', parent: 'root', component: 'Ghost button', with: {}, order: 1 } },
    variants: [{ when: { copy: false }, set: { 'ghost.order': 0, 'spacer.order': 1 } }] };
  const own = toCss(ghost, 'ghost-button', { naming: EL }), held = toCss(holder, 'snippet', { naming: EL, mains: (x) => (x === 'Ghost button' ? ghost : null) });
  ok('a placed component is reached through its control only where its own sheet makes its host draw no box',
    !/display: contents/.test(own) && /\[data-part="ghost"\] \{[^}]*order: 1/.test(held) && !/\[data-part="ghost"\] > button/.test(held));
}
// a state chosen by a placed control (a tile's Selected sets its pick's props) reaches that control as the part rules
// do: through its <button> only where the library holds it, never through one a mark of a component it does not hold
// lacks
{
  const EL = { kind: 'element', prefix: 'ds-' };
  const tile = { contract: 1, component: 'Tile', props: { selected: { type: 'boolean', default: false, axis: true, figma: 'Selected' } },
    anatomy: { root: { kind: 'container', background: 'C/off' }, pick: { kind: 'instance', parent: 'root', component: 'Pick button', with: { On: false }, order: 0 } },
    variants: [{ when: { selected: true }, set: { 'pick.with': { On: true }, 'root.background': 'C/on' } }] };
  const pick = { contract: 1, component: 'Pick button', props: {}, anatomy: { root: { kind: 'container' } }, variants: [] };
  const foreign = toCss(tile, 'tile', { naming: EL, mains: () => null }), held = toCss(tile, 'tile', { naming: EL, mains: (x) => (x === 'Pick button' ? pick : null), library: { 'Pick button': pick } });
  ok('a state a placed control chooses reaches it as its part rules do: through its button only where the library holds it',
    /:has\(> \[data-part="pick"\]:checked\)/.test(foreign) && !/\[data-part="pick"\] > button/.test(foreign) && /:has\(> \[data-part="pick"\] > button:checked\)/.test(held));
  // with no library given, the sheet holds no placed component, as the markup draws each as a mark then
  ok('with no library given, no placed control is reached through a button', !/> button/.test(toCss(tile, 'tile', { naming: EL })));
}
// a part scaled with a parent that is stretched between its own parent's edges takes its share of that parent's size, the
// grandparent's less both offsets (a library's skeleton shimmer, scaled inside a fill stretched over the box)
{
  const sk = { contract: 1, component: 'Skel', props: {}, anatomy: { root: { kind: 'container', width: 160, height: 16, overflow: 'hidden' },
    fill: { kind: 'container', parent: 'root', background: 'C/soft', position: 'absolute', absolute: { x: 0, y: 0, end: 0, bottom: 0 }, constraints: { horizontal: 'stretch', vertical: 'stretch' } },
    'fill/shine': { kind: 'graphic', parent: 'fill', background: 'C/strong', width: 160, height: 16, position: 'absolute', absolute: { x: -160, y: 0 }, constraints: { horizontal: 'scale', vertical: 'scale' } } }, variants: [] };
  const css = toCss(sk, 'skel', { naming: { kind: 'class', prefix: 'ds-', part: '__' } });
  const rule = (css.match(/\.ds-skel__shine \{[^}]*\}/) || [''])[0];
  ok('a part scaled in a stretched parent is a share of that parent\'s size: the grandparent\'s less both offsets',
    /inset-inline-start: -100%/.test(rule) && /inline-size: 100%/.test(rule) && /inset-block-start: 0%/.test(rule) && /block-size: 100%/.test(rule) && !/is no number/.test(css));
}
// a part scaled in a parent that hugs: a share of the size a part placed by both its edges gives that parent, else of
// the size its auto layout's padding and parts in the flow give it
{
  const hug = (dot) => ({ contract: 1, component: 'Hug', props: {}, anatomy: { root: { kind: 'container', layout: { direction: 'row', gap: 0, align: 'center', crossAlign: 'center', padding: { top: 11, end: 11, bottom: 11, start: 11 } }, width: 'hug', height: 'hug' },
    box: { kind: 'graphic', parent: 'root', width: 18, height: 18, order: 0 },
    ...(dot && { dot: { kind: 'graphic', parent: 'root', width: 24, height: 24, position: 'absolute', absolute: { x: 8, y: 8, end: 8, bottom: 8 }, constraints: { horizontal: 'center', vertical: 'center' }, order: 1 } }),
    ripple: { kind: 'graphic', parent: 'root', background: 'C/strong', width: 50, height: 35, position: 'absolute', absolute: { x: -10, y: 5 }, constraints: { horizontal: 'scale', vertical: 'scale' }, order: 2 } }, variants: [] });
  const rule = (c) => { const css = toCss(c, 'hug', { naming: { kind: 'class', prefix: 'ds-', part: '__' } }); return [(css.match(/\.ds-hug__ripple \{[^}]*\}/) || [''])[0], css]; };
  const [a, ca] = rule(hug(true)), [b, cb] = rule(hug(false));
  ok('a part scaled in a parent that hugs is a share of the size a part placed by both edges, or its padding and parts in the flow, give it',
    [a, b].every((r) => /inset-inline-start: -25%/.test(r) && /inline-size: 125%/.test(r) && /inset-block-start: 12.5%/.test(r) && /block-size: 87.5%/.test(r)) && ![ca, cb].some((c) => /is no number/.test(c)));
  const wrapped = hug(false); wrapped.anatomy.root.layout.wrap = true;
  const [w] = rule(wrapped);
  ok('…never in one that wraps, whose lines, not one, set its size', !/block-size: 87.5%/.test(w) && !/inset-block-start: 12.5%/.test(w), w);
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
{
  // 2026-11-23: a colour style is the colour beside it, which the sheet already writes: nothing more, nothing unread
  const r = declarations({ kind: 'container', background: 'C/error', fillStyle: 'Sys/error' }, {}, { token: (n) => `var(--${n})`, textStyle: () => [] });
  ok('a colour style writes its colour alone and is never said unread', r.decls.length === 1 && r.decls[0][1] === 'var(--C/error)' && !r.unread.length);
}
{
  // a placed component whose stroke or colour style the contract clears (`none`, rules.mjs CLEARED): its stroke's
  // channel written back to none, its component's shadow kept; a cleared colour style writes nothing
  const box = (align, shadow) => ({ contract: 1, component: 'Box', props: {}, anatomy: { root: { kind: 'container', width: 10, height: 10, fillStyle: 'Clear/Clear', border: { color: 'Line/strong', width: 1, align }, ...(shadow && { shadow }) } }, variants: [] });
  const card = { contract: 1, component: 'Card', props: {}, anatomy: { root: { kind: 'container', layout: { direction: 'row', gap: 0, align: 'start', crossAlign: 'start', padding: { top: 0, end: 0, bottom: 0, start: 0 } } }, box: { kind: 'instance', parent: 'root', order: 0, component: 'Box', border: 'none', fillStyle: 'none' } }, variants: [] };
  const sheet = (align, shadow) => { const B = box(align, shadow), mains = (n) => (n === 'Box' ? B : null); return { css: toCss(card, 'card', { naming: { kind: 'class', prefix: 'ds-', part: '__' }, mains }), ok: selfCheck(card, rulesOf(card, mains).rules, mains).length === 0 }; };
  const rule = (css) => (css.match(/> \.ds-card__box \{[^}]*\}/) || [''])[0];
  const inside = sheet('inside', 'Effect/sm'), outside = sheet('outside');
  ok('a cleared stroke takes its channel back to none: an inside ring off the shadow, the component\'s effect kept; an outline unset',
    inside.ok && outside.ok && /box-shadow: var\(--effect-sm\);/.test(rule(inside.css)) && !/inset/.test(rule(inside.css))
    && /outline: unset;/.test(rule(outside.css)) && !/none;|Clear/.test(rule(inside.css) + rule(outside.css)));
}
{
  const c = { anatomy: { a: { kind: 'instance', border: 'none', fillStyle: 'none' }, b: { kind: 'instance', border: { color: 'x' } } }, variants: [{ set: { 'c.border': 'none' } }] };
  ok('a stroke cleared (`none`) paints nothing; a stroke paints', !paintsAny(c, 'a') && paintsAny(c, 'b') && !paintsAny(c, 'c'));
}
// the rest state rules out only the pointer states the component has: hovering one with no Hover value draws it at rest
{
  const c = { contract: 1, component: 'Pin', props: { state: { type: 'enum', values: ['rest', 'focus'], default: 'rest', role: 'interaction', pointer: ['focus'] } }, anatomy: { root: { kind: 'container' } }, variants: [] };
  const r = condition(c, namer('pin'), 'state', 'rest');
  ok('the rest state rules out only the component\'s own pointer states, never a hover it has no value for', /:not\(:is\(:focus-visible/.test(r) && !/:hover/.test(r), r);
}
// a part only focus draws stays shown while the box is also hovered: hidden by the base, shown by focus, never hidden at hover
{
  const c = { contract: 1, component: 'Pik', props: { state: { type: 'enum', values: ['rest', 'hover', 'focus'], default: 'rest', role: 'interaction', pointer: ['hover', 'focus'] } },
    anatomy: { root: { kind: 'container', layout: { direction: 'row' } } }, variants: [{ when: { state: 'focus' }, add: { menu: { kind: 'container', parent: 'root', layout: { direction: 'column' } } } }] };
  const css = toCss(c, 'pik', { naming: { kind: 'class', prefix: 'ds-', part: '__' } });
  ok('a part only focus draws is hidden by the base and shown at focus, never hidden at hover (CSS holds both at once)', /\.ds-pik > \.ds-pik__menu \{\s*display: none/.test(css) && /:focus-visible[^{]*> \.ds-pik__menu \{\s*display: flex/.test(css) && !/:hover[^{]*> \.ds-pik__menu/.test(css), css);
  const odd = { ...c, props: { state: { ...c.props.state, values: ['rest', 'hovered'], pointer: ['hovered'] } }, variants: [{ when: { state: 'hovered' }, add: { hint: { kind: 'text', parent: 'root', content: 'Hi' } } }] };
  ok('…and a state with no pseudo-class leaves such a part a gap, never hidden for good', !partsOf(odd).get('hint').pointerHeld);
  // (drawn also at hover at one size: the hover combination that does not draw it hides it only while focus does not hold)
  const both = { ...c, props: { ...c.props, size: { type: 'enum', values: ['md', 'sm'], default: 'md' } }, variants: [...c.variants, { when: { state: 'hover', size: 'md' }, add: { menu: c.variants[0].add.menu } }] };
  const bc = toCss(both, 'pik', { naming: { kind: 'class', prefix: 'ds-', part: '__' } });
  ok('…and hidden at a combination of another pointer state that does not draw it only while its own state does not hold', /:where\(:hover\):where\(\[data-size="sm"\]\):where\(:not\(:is\(:focus-visible[^{]*> \.ds-pik__menu \{\s*display: none/.test(bc) && selfCheck(both, rulesOf(both).rules).length === 0, bc);
}
{ // a focus ring placed as a component, given a stroke at one focus variant: drawn as that component, never the box's
  // outline (an outline in its place lost which component the design draws there); a frame drawn so stays an outline
  const { ringOf } = await import('./to-code.mjs');
  const state = { type: 'enum', values: ['default', 'focus'], default: 'default', role: 'interaction', pointer: ['focus'], figma: 'State' };
  const ringed = (kind) => ({ kind, parent: 'root', position: 'absolute', absolute: { x: -2, y: -2, end: -2, bottom: -2 }, constraints: { horizontal: 'stretch', vertical: 'stretch' }, border: { color: 'Focus', width: 2 }, ...(kind === 'instance' && { component: 'Ring' }) });
  const c = (kind) => ({ component: 'B', props: { state }, anatomy: { root: { kind: 'container' } }, variants: [{ when: { state: 'focus' }, add: { ring: ringed(kind) } }] });
  ok('a placed component is never drawn as a ring; a stroke-only frame is', !ringOf(c('instance'), { state: 'focus' }, 'ring', ringed('instance'), {}) && !!ringOf(c('container'), { state: 'focus' }, 'ring', ringed('container'), {})); }
console.log(`${n} passed`);
