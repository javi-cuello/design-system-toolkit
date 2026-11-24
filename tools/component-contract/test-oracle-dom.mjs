#!/usr/bin/env node
// tools/component-contract/oracle-dom.mjs: phase 2's outside oracle. Its pure parts on contracts written here (the
// combinations, a token in its modes, a text style's bound fields, the comparison on a page reading given by hand), then
// in Chrome on the contract editor's sample library: every sample component measured, and a mutation of the rendered
// sheet (a padding, a fill, a part hidden) each turned into its row, so the oracle is shown to see what it claims to.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { combosOf, resolver, textStyleOf, expected, compareOne, comboOfVariant, measureComponent } from './oracle-dom.mjs';
import { cssName } from '../tokens/names.mjs';
import { findChrome, launch } from '../shared/cdp.mjs';

let n = 0;
const ok = (name, cond, why = '') => { n++; assert.ok(cond, `${name}${why ? `\n${why}` : ''}`); console.log('ok', name); };

/* ── the combinations a contract expands to ── */
{
  const c = { props: { size: { type: 'enum', values: ['lg', 'sm'], default: 'lg' }, on: { type: 'boolean', default: false }, label: { type: 'string', default: 'x' } },
    anatomy: { root: { kind: 'container' } }, variants: [{ when: { size: 'sm' }, set: {} }, { when: { on: true }, set: {} }], invalid: [{ size: 'sm', on: true }] };
  const all = combosOf(c);
  ok('combinations: every prop a layer is chosen by, across its values, less the invalid', all.length === 3 && !all.some((m) => m.size === 'sm' && m.on), JSON.stringify(all));
}

/* ── a token under a part's modes ── */
const TOKENS = { collections: {
  Theme: { modes: ['Light', 'Dark'], values: { Light: { 'bg/base': '#ffffff', 'text/base': '#111111' }, Dark: { 'bg/base': '#000000', 'text/base': '#eeeeee' } } },
  Space: { modes: ['Mode 1'], values: { 'Mode 1': { 'space/2': 8 } } },
  Type: { modes: ['A', 'B'], values: { A: { 'family/body': 'Inter' }, B: { 'family/body': 'Roboto' } } },
}, textStyles: [{ name: 'Body', family: 'Old', weight: 'SemiBold', size: 14, lineHeight: 1.5, letterSpacing: 0, bound: { fontFamily: { collection: 'Type', name: 'family/body' } }, authored: { lineHeight: { unit: 'PIXELS', value: 20 }, letterSpacing: { unit: 'PERCENT', value: 10 } } }] };
{
  const v = resolver(TOKENS);
  ok('a token resolves in its collection\'s first mode, Figma\'s default', v('bg/base') === '#ffffff' && v('space/2') === 8);
  ok('a token resolves in the mode a part sets on its axis', v('bg/base', { theme: 'dark' }) === '#000000');
  ok('a token in each of its modes, for the mode check', JSON.stringify(v.modes('bg/base')) === JSON.stringify({ Light: '#ffffff', Dark: '#000000' }));
  const t = textStyleOf(TOKENS, 'Body', v);
  ok('a text style: authored px line height, % letter spacing in px, weight by name, a bound family by its variable', t.lineHeight === 20 && Math.abs(t.letterSpacing - 1.4) < 1e-9 && t.weight === 600 && t.family === 'Inter', JSON.stringify(t));
  const lit = textStyleOf(TOKENS, 'literal 13/18 500 Arial');
  ok('a literal text style is read from its words', lit.size === 13 && lit.lineHeight === 18 && lit.weight === 500 && lit.family === 'Arial');
}

/* ── the comparison, on a page reading given by hand ── */
{
  const c = { props: { tone: { type: 'enum', values: ['a', 'b'], default: 'a' } },
    anatomy: { root: { kind: 'container', layout: { direction: 'row', gap: 'space/2', padding: { top: 4, end: 4, bottom: 4, start: 4 } }, background: 'bg/base', radius: 6 },
      label: { kind: 'text', parent: 'root', order: 0, color: 'text/base', typography: 'Body' } },
    variants: [{ when: { tone: 'b' }, set: { 'root.background': '#ff0000' } }] };
  const v = resolver(TOKENS);
  const { parts } = expected(c, {}, { value: v, tokens: TOKENS });
  ok('expected: gap and fill resolved from their tokens, no stroke where none is drawn', parts.root.gap === 8 && parts.root.background === '#ffffff' && parts.root.stroke.every((x) => x === 0));
  const box = (o = {}) => ({ box: { x: 0, y: 0, w: 40, h: 20 }, inParent: { x: 0, y: 0 }, shown: true, display: 'flex', direction: 'row', gap: { row: 0, column: 8 }, padding: { top: 4, end: 4, bottom: 4, start: 4 }, radius: [6, 6, 6, 6], background: [1, 1, 1, 1], border: [0, 0, 0, 0], borderColour: [null, null, null, null], shadows: [], outline: null, color: [0, 0, 0, 1], fontSize: 14, lineHeight: 20, fontWeight: 600, fontFamily: 'Inter', letterSpacing: 1.4, opacity: 1, ...o });
  const label = (o = {}) => ({ chain: 'label', own: true, ...box({ display: 'block', background: [0, 0, 0, 0], color: [17 / 255, 17 / 255, 17 / 255, 1], ...o }) });
  const colours = { '#ffffff': [1, 1, 1, 1], '#000000': [0, 0, 0, 1], '#111111': [17 / 255, 17 / 255, 17 / 255, 1], '#eeeeee': [238 / 255, 238 / 255, 238 / 255, 1] };
  const chains = { label: ['label'] };
  const rows = (root, l, more = []) => compareOne(parts, { root, parts: [l, ...more] }, chains, colours, { at: 'x', value: v });
  ok('a page drawn as the contract says has no rows', rows(box(), label()).length === 0, JSON.stringify(rows(box(), label())));
  const pad = rows(box({ padding: { top: 4, end: 5, bottom: 4, start: 4 } }), label());
  ok('a padding one off is a row, at its side', pad.length === 1 && pad[0].at === 'x/root.padding.end' && pad[0].kind === 'padding', JSON.stringify(pad));
  ok('within the tolerance is the same', rows(box({ padding: { top: 4.005, end: 4, bottom: 4, start: 4 } }), label()).length === 0);
  const mode = rows(box({ background: [0, 0, 0, 1] }), label());
  ok('a fill the token takes in another mode is named so', mode.length === 1 && mode[0].kind === 'token in another mode', JSON.stringify(mode));
  const fill = rows(box({ background: [1, 0, 0, 1] }), label());
  ok('any other fill is a fill row', fill.length === 1 && fill[0].kind === 'fill');
  const gone = rows(box(), label({ shown: false }));
  ok('a part the contract draws and the page hides is a row', gone.length === 1 && gone[0].kind === 'part missing' && gone[0].drawn === 'hidden');
  const extra = rows(box(), label(), [{ ...label(), chain: 'icon' }]);
  ok('a part of its own the page draws and the contract does not is a row', extra.some((r) => r.kind === 'part not in contract' && r.at === 'x/[icon]'));
  const ring = rows(box({ outline: { width: 2, offset: 0, colour: [0, 0, 1, 1], auto: true } }), label());
  ok('the browser\'s own focus ring where the contract draws no stroke is named so', ring.length === 1 && ring[0].kind === 'browser focus ring', JSON.stringify(ring));
  const shadowStroke = compareOne({ ...parts, root: { ...parts.root, stroke: [1, 1, 1, 1], strokeColour: '#000000' } }, { root: box({ shadows: [{ inset: true, x: 0, y: 0, blur: 0, spread: 1, colour: [0, 0, 0, 1] }] }), parts: [label()] }, chains, colours, { at: 'x', value: v });
  ok('a stroke drawn as an inset shadow is the stroke', shadowStroke.length === 0, JSON.stringify(shadowStroke));
}

/* ── a point out of the flow, held as its constraint holds it ── */
{
  const c = { props: {}, anatomy: { root: { kind: 'container' },
    end: { kind: 'container', parent: 'root', order: 0, absolute: { x: 92, y: 4, end: 8 }, constraints: { horizontal: 'max', vertical: 'min' } },
    mid: { kind: 'container', parent: 'root', order: 1, absolute: { x: 10, y: 0, end: 6, bottom: 0 }, constraints: { horizontal: 'center', vertical: 'scale' } } } };
  const { parts, unread } = expected(c, {}, { value: resolver(TOKENS), tokens: TOKENS });
  ok('max holds the far edge, not x; center holds the centre\'s offset; scale is left unread', parts.end.end === 8 && parts.end.x === undefined && parts.end.y === 4 && parts.mid.cx === 2 && parts.mid.y === undefined && unread['place that scales'] === 1, JSON.stringify(parts));
}

/* ── a stored variant's name as a combination ── */
{
  const c = { props: { size: { type: 'enum', values: ['large', 'small'], figmaValues: ['Large', 'Small'], figma: 'Size' }, disabled: { type: 'boolean', figma: 'Disabled', figmaValues: ['False', 'True'] } } };
  const m = comboOfVariant(c, 'Size=Small, Disabled=True');
  ok('a variant\'s name is its combination, by each prop\'s Figma name and spelling', m.size === 'small' && m.disabled === true, JSON.stringify(m));
}

/* ── in Chrome, on the sample library ── */
if (!fs.existsSync(findChrome())) console.log('skip: no Chrome for the rendered half');
else {
  const SAMPLE = fileURLToPath(new URL('../contract-editor/sample', import.meta.url));
  const DIR = path.join(SAMPLE, 'components');
  const folders = fs.readdirSync(DIR).filter((f) => fs.existsSync(path.join(DIR, f, 'contract.json'))).sort();
  const library = Object.fromEntries(folders.map((f) => { const c = JSON.parse(fs.readFileSync(path.join(DIR, f, 'contract.json'), 'utf8')); return [c.component, { ...c, folder: f }]; }));
  const tokens = JSON.parse(fs.readFileSync(path.join(SAMPLE, 'tokens.json'), 'utf8'));
  // the sample's tokens as custom properties, as test-to-markup.mjs serves them
  const vars = [];
  for (const col of Object.values(tokens.collections)) for (const [name, v] of Object.entries(col.values[col.modes[0]])) vars.push(`${cssName('', name)}: ${typeof v === 'number' ? (/opacity/i.test(name) ? v : `${v}px`) : v};`);
  for (const t of tokens.textStyles) { const b = cssName('', t.name); vars.push(`${b}-font-family: ${t.family};`, `${b}-font-size: ${t.size}px;`, `${b}-font-weight: ${t.weight};`, `${b}-line-height: ${t.lineHeight}px;`, `${b}-letter-spacing: ${t.letterSpacing}px;`); }
  const tokensCss = `:root { ${vars.join(' ')} }`;
  const browser = await launch({});
  try {
    const run = (folder, extra = '') => measureComponent({ library, folder, tokensCss: tokensCss + extra, settingsOf: () => undefined, tokens, browserEndpoint: browser.endpoint });
    const base = {};
    for (const f of folders) base[f] = await run(f);
    ok(`every sample component is measured, every combination rendered (${folders.length})`, folders.every((f) => !base[f].error && base[f].combinations > 0 && !base[f].rows.some((r) => r.kind === 'render failed')), JSON.stringify(Object.fromEntries(folders.map((f) => [f, base[f].error || base[f].rows.slice(0, 2)]))));
    // the mutations: each a change no generator made, appended to the page's styles, must turn into its own row
    const f = folders.find((x) => { const c = library[Object.keys(library).find((k) => library[k].folder === x)]; return c.anatomy.root.layout && c.anatomy.root.background !== undefined; }) || folders[0];


    const padded = await run(f, `\nds-${f}, ds-${f} > button { padding-inline-start: 41px !important; }`);
    ok(`a padding changed on ${f}'s page is a padding row`, padded.rows.some((r) => r.kind === 'padding' && /root\.padding\.start$/.test(r.at)) && padded.rows.length > base[f].rows.length, JSON.stringify(padded.rows.slice(0, 3)));
    const filled = await run(f, `\nds-${f}, ds-${f} > button { background: rgb(1, 2, 3) !important; }`);
    ok(`a fill changed on ${f}'s page is a fill row`, filled.rows.some((r) => /root\.background$/.test(r.at) && (r.kind === 'fill' || r.kind === 'token in another mode')), JSON.stringify(filled.rows.slice(0, 3)));
    const hidden = await run(f, `\nds-${f} [data-part] { display: none !important; }`);
    ok(`every part hidden on ${f}'s page is a part-missing row`, hidden.rows.some((r) => r.kind === 'part missing' && r.drawn === 'hidden'), JSON.stringify(hidden.rows.slice(0, 3)));
  } finally { await browser.close(); }
}
console.log(`${n} passed`);
