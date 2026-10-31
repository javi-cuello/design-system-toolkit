#!/usr/bin/env node
// tools/component-contract/analyze.mjs: a library's consistency with itself, by form.
import assert from 'node:assert/strict';
import { consistency, RAN } from './analyze.mjs';

let n = 0;
const ok = (name, cond) => { n++; assert.ok(cond, name); console.log('ok', name); };
const C = (name, props, raw = {}) => ({ name, contract: { props }, raw });
const e = (figma, values, d = values[0]) => ({ type: 'enum', figma, values, default: d });
const b = (figma, d = false) => ({ type: 'boolean', figma, default: d });
const rules = (f) => f.map((x) => `${x.rule.replace('consistency-', '')}:${x.where}`).sort();

ok('one prop as a True/False variant on one component and a boolean on two others names the odd one, and the others in its detail',
  (() => { const f = consistency([C('Dropdown', { value: b('Value') }, { Value: ['False', 'True'] }), C('Text input', { value: b('Value') }, { Value: 'BOOLEAN' }), C('Text area', { value: b('Value') }, { Value: 'BOOLEAN' })]);
    return JSON.stringify(rules(f)) === '["form:Dropdown"]' && /boolean on Text input, Text area/.test(f[0].fix[0]); })());

ok('one prop name spelled two ways is raised on the less common spelling',
  JSON.stringify(rules(consistency([C('Item', { a: e('Leading slot content', ['x', 'y']) }), C('Toolbar', { a: e('Leading slot content', ['x', 'y']) }), C('Account', { b: e('Leading content slot', ['x', 'y']) })]))) === '["spelling:Account"]');

ok('one prop numeric on some components and named on others is raised on the fewer side',
  JSON.stringify(rules(consistency([C('Avatar', { size: e('Size', ['24', '32']) }), C('Button', { size: e('Size', ['large', 'small']) }), C('Chip', { size: e('Size', ['large', 'small']) })]))) === '["scale:Avatar"]');

ok('shared words are not shared props: same values under different names, subsets, different defaults and the State axis raise nothing',
  consistency([C('Split button', { menuPos: e('Menu pos.', ['right', 'left']) }), C('Tooltip', { alignment: e('Alignment', ['right', 'left']) }),
    C('Spinner', { size: e('Size', ['small', 'large'], 'large') }), C('Button', { size: e('Size', ['small', 'medium', 'large'], 'large') }),
    C('Button 2', { state: { type: 'enum', role: 'interaction', values: ['rest', 'hover'], default: 'rest', figma: 'State' } })]).length === 0);

ok('a finding names its component in its key, so two components\' rows never collide',
  (() => { const f = consistency([C('A', { v: b('Value') }, { Value: ['False', 'True'] }), C('B', { v: b('Value') }, { Value: ['False', 'True'] }), C('C', { v: b('Value') }, { Value: 'BOOLEAN' }), C('D', { v: b('Value') }, { Value: 'BOOLEAN' })]);
    return f.length === 4 && new Set(f.map((x) => x.key)).size === 4; })());

ok('a run says every check it makes, the withdrawn one too, so the record closes rows only those checks raised',
  ['form', 'spelling', 'scale', 'default'].every((r) => RAN.includes(`consistency-${r}`)));

console.log(`${n}/${n} passed`);
