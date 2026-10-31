#!/usr/bin/env node
// The payload schema, walked in both directions: a well-formed payload passes,
// and each way a consumer could be handed something it cannot read fails with
// a message naming where. Run: node test-payload.mjs
import assert from 'node:assert';
import test from 'node:test';
import payload from './payload.cjs';

const tokens = () => ({
  _meta: { file: 'UI library', fileId: 'abc' },
  collections: { Semantic: { modes: ['Light', 'Dark'], values: { Light: { 'Colour/Text/strong': '#161616' }, Dark: { 'Colour/Text/strong': '#f5f5f5' } }, alias: {}, descriptions: { 'Colour/Text/strong': 'Body text' } } },
  textStyles: [{ name: 'Body/md', family: 'Inter', weight: 'Regular', size: 16, lineHeight: 1.5 }],
  paintStyles: [],
  effects: [{ name: 'Elevation/base', layers: [] }],
  // a legacy key an older receiver still reads: never an error
  semantic: { light: {}, dark: {} },
});
const node = (name) => ({ name, type: 'COMPONENT', w: 10, h: 10, children: [{ name: 'Label', type: 'TEXT' }] });
const component = () => ({ name: 'Button', id: '1:2', page: '❖ Button', description: '## Usage\n- Use it', props: { Size: ['sm', 'md'], Icon: 'BOOLEAN' }, variants: [node('Size=sm'), node('Size=md')] });
const library = () => ({ tokens: tokens(), components: [component()], icons: [{ name: 'check', size: 16, svg: '<svg/>' }], iconSets: ['check'], graphics: [], previews: [{ name: 'Button', w: 66, h: 44, png: 'iVBOR' }] });

test('a well-formed library passes, legacy keys included', () => {
  assert.deepStrictEqual(payload.library(library()), []);
});

test('a stored, compacted spec passes', () => {
  const c = component();
  const stored = { ...c, default: c.variants[0], variants: [{ name: 'Size=md', delta: {} }] };
  assert.deepStrictEqual(payload.component(stored), []);
});

test('each broken field is named', () => {
  const cases = [
    [(p) => { delete p.tokens._meta.fileId; }, 'tokens._meta: must carry fileKey or fileId'],
    [(p) => { p.tokens.collections.Semantic.values = { Light: {} }; }, 'tokens.collections["Semantic"].values: must hold an object per mode'],
    [(p) => { p.tokens.textStyles[0].size = '16'; }, 'tokens.textStyles[0]: needs name, family, size and lineHeight'],
    [(p) => { p.components[0].props.Icon = 'BOOL'; }, 'components[0].props["Icon"]'],
    [(p) => { p.components[0].description = 42; }, 'components[0].description: must be text when present'],
    [(p) => { p.components[0].variants = []; }, 'components[0].variants: must hold at least one variant'],
    [(p) => { delete p.components[0].variants[0].children[0].type; }, 'components[0].variants[0].children[0]'],
    [(p) => { p.previews[0].png = null; }, 'previews[0]: needs name, w, h and png'],
    [(p) => { p.previews[0].dark = 3; }, 'previews[0]: needs name, w, h and png; dark only as a png'],
    [(p) => { p.previews[0].anatomy = { parts: [] }; }, 'previews[0]: needs name, w, h and png; dark only as a png; anatomy only with a png and parts'],
    [(p) => { p.tokens._meta.pages = ['Cover', 3]; }, 'tokens._meta.pages: must list page names when present'],
    [(p) => { p.icons[0].size = undefined; }, 'icons[0]: needs name, size and svg'],
  ];
  for (const [breakIt, expected] of cases) {
    const p = library();
    breakIt(p);
    const errors = payload.library(p);
    assert.ok(errors.some((e) => e.startsWith(expected)), `expected "${expected}", got ${JSON.stringify(errors)}`);
  }
});

test('screens: a draft travels as its name, a ready frame needs its tree', () => {
  const ok = { _meta: { fileId: 'x' }, screens: [{ page: 'P', frame: 'Draft', id: '1:1', devStatus: null }, { page: 'P', frame: 'Ready', id: '1:2', devStatus: 'READY_FOR_DEV', tree: node('Ready') }] };
  assert.deepStrictEqual(payload.screens(ok), []);
  ok.screens[1].tree = null;
  assert.ok(payload.screens(ok).some((e) => e.startsWith('screens[1].tree')));
});
