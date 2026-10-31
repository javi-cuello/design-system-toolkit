#!/usr/bin/env node
// tools/shared/prop-attr.mjs: a prop's name as its attribute, the one rule to-code styles by and parity reads.
// Run: node tools/shared/test-prop-attr.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { attrWords, propAttr, TAKEN } from './prop-attr.mjs';

let n = 0;
const ok = (name, cond) => { n++; assert.ok(cond, name); console.log('ok', name); };
const read = (p) => fs.readFileSync(new URL(p, import.meta.url), 'utf8');

ok('a Figma name and the contract key camelCased from it give the same words',
  attrWords('Show icon') === 'show-icon' && attrWords('showIcon') === 'show-icon' && attrWords('Icon (16)') === 'icon-16' && attrWords('  Size ') === 'size' && attrWords('DIsabled') === 'disabled');
ok('class naming: every prop a data- attribute', propAttr('Size', { kind: 'class' }) === 'data-size' && propAttr('tone', { kind: 'class', prefix: 'ds-' }) === 'data-tone');
ok('element naming: the prop\'s own attribute, unless an HTML or ARIA attribute already has the name',
  propAttr('tone', { kind: 'element' }) === 'tone' && propAttr('Size', { kind: 'element' }) === 'data-size' && propAttr('role', { kind: 'element' }) === 'data-role' && TAKEN.has('disabled'));
ok('no naming, markup written by hand: the words alone', propAttr('Show icon', null) === 'show-icon' && propAttr('Size') === 'size');
// one owner: neither side spells the rule itself
const toCode = read('../component-contract/to-code.mjs'), adapt = read('../parity/adapt.mjs');
ok('to-code\'s namer and parity\'s -attr both call propAttr; neither holds its own TAKEN or kebab of a prop',
  /attr: \(key\) => propAttr\(key,/.test(toCode) && !/const TAKEN = new Set/.test(toCode)
  && /\(P\.rename \|\| \{\}\)\[key\] \|\| propAttr\(key, ctx\.attrNaming \|\| null\)/.test(adapt) && !/\(P\.rename \|\| \{\}\)\[key\] \|\| kebab\(key\)/.test(adapt));
console.log(`${n}/${n} passed`);
