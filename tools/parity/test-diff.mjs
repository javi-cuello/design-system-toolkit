#!/usr/bin/env node
// node tools/parity/test-diff.mjs — from the toolkit root.
import assert from 'node:assert/strict';
import { diff, BAD } from './diff.mjs';

let n = 0;
const ok = (name, cond) => { n++; assert.ok(cond, name); console.log('ok', name); };
const doc = (layer, assertions, extra) => ({ layer, selector: `.${layer.toLowerCase()}`, status: 'measure', assertions, ...extra });
const kinds = (rows) => rows.map((r) => r.kind).join(' ');

ok('one row per assertion, keyed by layer and prop',
  kinds(diff([doc('Box', [{ kind: 'length', prop: 'padding-top', expected: '12px' }, { kind: 'length', prop: 'width', expected: '40px' }])],
    { Box: { 'padding-top': '12px', width: '41px' } })) === 'match differs');
ok('the project\'s tolerance is the only slack',
  kinds(diff([doc('Box', [{ kind: 'length', prop: 'width', expected: 40 }])], { Box: { width: 41 } }, { tolerances: { length: 1 } })) === 'match');
ok('a layer this variant does not draw: agreement when the code draws none, a difference when it does',
  kinds(diff([doc('Check', [], { status: 'absent' })], {})) === 'absent'
  && kinds(diff([doc('Check', [], { status: 'absent' })], { Check: { w: 16, h: 16 } })) === 'present' && BAD.includes('present'));
ok('a drawn absence is waived under Layer.-present like any other difference',
  diff([doc('Check', [], { status: 'absent' })], { Check: { w: 16, h: 16 } }, { waivers: { 'Check.-present': 'drawn hidden' } })[0].kind === 'waived');
ok('a selector that matched nothing, and a measured layer nothing was asked of, are named, never agreement',
  kinds(diff([doc('Gone', [{ kind: 'text', prop: 'color', expected: 'x' }]), doc('Quiet', [])], { Gone: null, Quiet: {} })) === 'nomatch vacuous');
ok('a waiver excuses its difference and names the key as declared',
  (([r]) => r.kind === 'waived' && r.waiver === 'Size=lg :: Box.width')(diff([doc('Box', [{ kind: 'length', prop: 'width', expected: '40px' }])],
    { Box: { width: '44px' } }, { waivers: { 'Box.width': { reason: 'r', fix: 'code', within: 4, key: 'Size=lg :: Box.width' } } })));
// Review 2026-10-02 item 1: "3.5px narrower" in prose bounded nothing.
ok('an open waiver on a number excuses nothing, and a keyword measured for a number is excused only by a decision',
  (([r]) => r.kind === 'differs' && /within/.test(r.why))(diff([doc('Box', [{ kind: 'length', prop: 'width', expected: '40px' }])], { Box: { width: '70px' } }, { waivers: { 'Box.width': { reason: 'r', fix: 'figma' } } }))
  && diff([doc('Box', [{ kind: 'length', prop: 'line-height', expected: '16px' }])], { Box: { 'line-height': 'normal' } }, { waivers: { 'Box.line-height': { reason: 'a pseudo', decision: true } } })[0].kind === 'waived'
  && diff([doc('Box', [{ kind: 'length', prop: 'line-height', expected: '16px' }])], { Box: { 'line-height': 'normal' } }, { waivers: { 'Box.line-height': { reason: 'r', fix: 'figma', within: 4 } } })[0].kind === 'differs'
  && diff([doc('Box', [{ kind: 'text', prop: '-stacking', expected: 'row' }])], { Box: { '-stacking': 'column' } }, { waivers: { 'Box.-stacking': { reason: 'r', decision: true } } })[0].kind === 'waived');
// Review 2026-10-02 item 2: 44 and 77 rows passed on the slack alone, unseen.
ok('a hug the text slack excuses by a pixel or more is reported waived, with the slack it used; under a pixel it matches',
  (([r]) => r.kind === 'waived' && r.slack === 3 && r.within === 4 && !r.waiver)(diff([doc('Box', [{ kind: 'hugLength', prop: 'height', expected: '40px', within: 4 }])], { Box: { height: '43px' } }))
  && diff([doc('Box', [{ kind: 'hugLength', prop: 'height', expected: '40px', within: 4 }])], { Box: { height: '40.6px' } })[0].kind === 'match'
  && diff([doc('Box', [{ kind: 'hugLength', prop: 'height', expected: '40px', within: 4 }])], { Box: { height: '45px' } })[0].kind === 'differs');
ok('a bounded waiver fails past its bound and says why',
  (([r]) => r.kind === 'differs' && r.why === 'waived only within 2, off by 4')(diff([doc('Box', [{ kind: 'length', prop: 'width', expected: '40px' }])],
    { Box: { width: '44px' } }, { waivers: { 'Box.width': { reason: 'r', within: 2 } } })));
ok('a same-element claim is checked against the mapping\'s selectors',
  diff([doc('Label', [{ kind: 'length', prop: 'width', expected: 1 }], { selector: '.a' }), doc('Content', [], { selector: '.b', status: 'structural' })],
    { Label: { width: 2 } }, { waivers: { 'Label.width': { reason: 'one box', sameAs: 'Content' } } })[0].kind === 'differs');
ok('a layer the variant does not draw is present only where the probe says it renders, not where a record merely has a box',
  diff([doc('Check', [], { status: 'absent' })], { Check: { w: 12, h: 12, '-rendered': 'no' } })[0].kind === 'absent'
  && diff([doc('Check', [], { status: 'absent' })], { Check: { w: 12, h: 12, '-rendered': 'yes' } })[0].kind === 'present');
// Review 2026-10-02 round 2, R5 and R2: a radius waiver is held to its corners, and a waived number says how far it was.
ok('a waiver on a radius is held to the largest corner difference, and a waived number carries the distance it excused',
  diff([doc('Card', [{ kind: 'radius', prop: 'border-radius', expected: '999px' }])], { Card: { 'border-radius': '8px', width: '80px', height: '44px' } },
    { waivers: { 'Card.border-radius': { reason: 'r', fix: 'figma', within: 2 } } })[0].kind === 'differs'
  && diff([doc('Card', [{ kind: 'radius', prop: 'border-radius', expected: '999px' }])], { Card: { 'border-radius': '8px', width: '80px', height: '44px' } },
    { waivers: { 'Card.border-radius': { reason: 'r', fix: 'figma', within: 14 } } })[0].off === 14
  && diff([doc('Box', [{ kind: 'length', prop: 'width', expected: '44px' }])], { Box: { width: '46.5px' } },
    { waivers: { 'Box.width': { reason: 'r', fix: 'code', within: 3 } } })[0].off === 2.5);
ok('a kind or a prop outside the schema is refused, never skipped',
  assert.throws(() => diff([doc('Box', [{ kind: 'nearly', prop: 'width', expected: 1 }])], { Box: {} })) === undefined
  && assert.throws(() => diff([doc('Box', [{ kind: 'length', prop: 'widht', expected: 1 }])], { Box: {} })) === undefined);

console.log(`\n${n} passed`);
