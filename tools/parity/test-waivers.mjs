#!/usr/bin/env node
// node tools/parity/test-waivers.mjs — from the toolkit root.
import assert from 'node:assert/strict';
import { appWaivers, recordExcused, asWaiver, excuses, stale, staleAcross, checkWaiver, keyParts, looseBounds } from './waivers.mjs';

let n = 0;
const ok = (name, cond) => { n++; assert.ok(cond, name); console.log('ok', name); };

ok('a string waiver is its reason', asWaiver('drawn inset').reason === 'drawn inset' && asWaiver(null) === null);
ok('an open waiver excuses any difference that is not a number, and no number', excuses('because', { expected: 'row', actual: 'column' }).excused
  && !excuses('because', { expected: '44px', actual: '66px', numeric: true }).excused);
ok('a bounded waiver excuses its size and fails past it, saying by how much',
  excuses({ reason: 'stroke', within: 2 }, { expected: '44px', actual: '46px' }).excused
  && excuses({ reason: 'stroke', within: 2 }, { expected: '44px', actual: '66px' }).why === 'waived only within 2, off by 22');
ok('a bound applies to a number, not to a colour the same whole-layer key covers, and holds to float error',
  excuses({ reason: 'live', content: true, within: 2 }, { expected: 'rgb(1, 2, 3)', actual: 'rgb(9, 9, 9)' }).excused
  && excuses({ reason: 'r', fix: 'code', within: 304.59 }, { expected: '2204px', actual: '2508.59px', numeric: true }).excused);
ok('a same-element claim the selectors contradict fails', excuses({ reason: 'one box', sameAs: 'Content' }, { sameElement: false }).why.includes('"Content"')
  && excuses({ reason: 'one box', sameAs: 'Content' }, { sameElement: true }).excused);
ok('a waiver nothing used is stale, unless it is content or a decision',
  stale({ 'A.h': 'x', 'B.w': { reason: 'feed', content: true }, 'C.pad': { reason: 'no element', decision: true }, 'D.gap': 'y' }, new Set(['D.gap'])).join() === 'A.h');
// Round 3, S14: a bound or an 'unset' ruling nothing used was never stale
// because its owner was content or a decision; only live data is exempt.
ok('an unused bound or unset ruling is stale whoever owns it, except against live data',
  stale({ 'A.h': { reason: 'r', content: true, within: 342 }, 'B.h': { reason: 'r', decision: true, within: 573 }, 'C.min-height': { reason: 'r', decision: 'unset' }, 'D.-children': { reason: 'r', decision: true } }, new Set()).join() === 'A.h,B.h,C.min-height'
  && !stale({ 'A.h': { reason: 'r', content: true, within: 342 } }, new Set(), true).length
  && staleAcross([{ name: 'pool', declared: { 'A.h': { reason: 'r', content: true, within: 3 } }, used: new Set(), live: true }]).length === 0);
// Round 3, S14: appWaivers' glob expansion and the per-target excused
// difference lived inline in run.mjs, with no test of their own.
ok('an app waiver with a * covers every layer and layer.prop it matches, under the key it was declared as',
  (() => {
    const docs = [{ layer: 'Grid > Card', assertions: [{ prop: 'height' }] }, { layer: 'Grid > Card#2', assertions: [{ prop: 'height' }, { prop: 'width' }] }, { layer: 'Aside', assertions: [{ prop: 'height' }] }];
    const out = appWaivers({ 'Grid > Card*.height': { reason: 'live', content: true, within: 28 }, Aside: { reason: 'r', content: true } }, docs);
    return out['Grid > Card.height'].key === 'Grid > Card*.height' && out['Grid > Card#2.height'].within === 28 && !out['Grid > Card#2.width'] && !out['Grid > Card'] && out.Aside.key === 'Aside';
  })());
ok('the excused difference per target is the largest, of declared waivers only; an app waiver and an unmeasured row add nothing',
  (() => {
    const declared = { 'Main.height': { reason: 'r', content: true, within: 44 } };
    const ex = new Map();
    recordExcused(ex, 'home', [{ kind: 'waived', waiver: 'Main.height', off: 10 }, { kind: 'waived', waiver: 'Main.height', off: 30 }, { kind: 'waived', waiver: 'Badge.width', off: 70 }, { kind: 'waived', waiver: 'Main.color' }, { kind: 'match' }], (k) => declared[k]);
    recordExcused(ex, 'home', [{ kind: 'waived', waiver: 'Main.height', off: 20 }], (k) => declared[k]);
    return JSON.stringify([...ex.get('home')]) === JSON.stringify([['Main.height', { off: 30, within: 44 }]]);
  })());
ok('a waiver two frames declare is stale only when neither used it, and names every frame that declares it',
  JSON.stringify(staleAcross([
    { name: 'home', declared: { 'A.h': 'shared', 'B.w': 'shared' }, used: new Set(['A.h']) },
    { name: 'search', declared: { 'A.h': 'shared', 'B.w': 'shared' }, used: new Set() },
  ])) === JSON.stringify([{ key: 'B.w', names: ['home', 'search'] }]));
ok('the same key with a different waiver is a different waiver',
  staleAcross([{ name: 'a', declared: { 'A.h': 'one' }, used: new Set(['A.h']) }, { name: 'b', declared: { 'A.h': 'two' }, used: new Set() }]).map((s) => s.names.join()).join() === 'b');
// Review 2026-10-02 item 1: fix and accepted were declared and read by
// nothing, and 47 open waivers cited a pixel figure only in prose.
const shape = (k, w) => checkWaiver(k, w).join(' | ');
ok('a waiver on a number says how far it excuses, unless it is a ruling on a keyword',
  /within/.test(shape('Box.width', { reason: 'r', fix: 'figma' })) && shape('Box.width', { reason: 'r', fix: 'figma', within: 3.5 }) === ''
  && shape('Field > Placeholder.line-height', { reason: 'a pseudo', decision: 'unset' }) === '' && /within/.test(shape('A :: Box.-y', { reason: 'r', content: true })));
ok('every waiver has an owner — figma or code — or says it is live data or a ruling',
  /no owner/.test(shape('Box.color', 'because')) && /no owner/.test(shape('Box.color', { reason: 'r' })) && /fix is/.test(shape('Box.color', { reason: 'r', fix: true }))
  && shape('Box.color', { reason: 'r', fix: 'code' }) === '' && shape('Box.color', { reason: 'r', content: true }) === '' && shape('Box.-present', { reason: 'r', decision: true }) === '');
ok('a field nothing reads is refused, and so is a bound on what is not a number',
  /"accepted" is not a waiver field/.test(shape('Box.color', { reason: 'r', decision: true, accepted: true })) && /within bounds a number/.test(shape('Box.color', { reason: 'r', fix: 'code', within: 2 })));
ok('a key names its layer and prop, scoped or not, and a bare layer has no prop',
  JSON.stringify(keyParts('Size=lg :: Icoshpere 1.rotate')) === '{"layer":"Icoshpere 1","prop":"rotate"}' && keyParts('Main > Action bar*').prop === null && keyParts('$root.-attr:size').prop === '-attr:size');
// Review 2026-10-02 round 2, R10: Infinity passed as a bound; two owners
// passed; a decision on a number passed the load gate and went red on the
// first number measured.
ok('a bound is a finite number: Infinity and NaN bound nothing',
  /finite/.test(shape('Box.width', { reason: 'r', fix: 'code', within: Infinity })) && /finite/.test(shape('Box.width', { reason: 'r', fix: 'code', within: NaN }))
  && shape('Box.width', { reason: 'r', fix: 'code', within: 1e9 }) === '');
ok('one owner a waiver: a decision is not also live data, nor a fix someone will make',
  /one owner/.test(shape('Box.color', { reason: 'r', decision: true, content: true })) && /one owner/.test(shape('Box.color', { reason: 'r', fix: 'figma', decision: true }))
  && /one owner/.test(shape('Box.color', { reason: 'r', fix: 'code', content: true })));
ok('load says plainly that a decision on a number excuses a keyword only, and names the two forms that hold',
  /excuses a keyword only/.test(shape('Main.min-height', { reason: 'r', decision: true })) && shape('Main.min-height', { reason: 'r', decision: true, within: 4 }) === '');
// R6: the page sets nothing, which the gate made people write as a bound equal
// to the whole expected value.
ok("decision 'unset' on a value that is not a number excuses nothing, numeric or not (a shadow's none spread from a bare key)",
  !excuses({ reason: 'r', decision: 'unset' }, { expected: '0 0 4px rgba(0,0,0,.2)', actual: 'none' }).excused
  && !excuses({ reason: 'r', decision: 'unset' }, { expected: 'wrap', actual: 'nowrap' }).excused);
ok("decision 'unset' excuses exactly 0 or a keyword, and refuses a bound or a prop that is not a number",
  excuses({ reason: 'r', decision: 'unset' }, { expected: '1117px', actual: '0px', numeric: true }).excused
  && excuses({ reason: 'r', decision: 'unset' }, { expected: '20px', actual: 'normal', numeric: true }).excused
  && /ruled unset, and the page sets 600px/.test(excuses({ reason: 'r', decision: 'unset' }, { expected: '1117px', actual: '600px', numeric: true }).why)
  && /takes no within/.test(shape('Main.min-height', { reason: 'r', decision: 'unset', within: 1117 })) && /is not one/.test(shape('Box.color', { reason: 'r', decision: 'unset' }))
  && /is not one/.test(shape('Nav.height', { reason: 'r', decision: 'unset' })) && shape('Aside.max-width', { reason: 'r', decision: 'unset' }) === ''
  && /true, 'unset'/.test(shape('Box.color', { reason: 'r', decision: 'yes' })));
// Review 2026-10-02 round 3, S9: a bare-layer 'unset' skipped the prop check,
// and the differ parsed a colour, a shadow or nowrap to NaN and excused it.
ok("decision 'unset' names its prop, excuses only a number, and only 0 or none/normal/auto",
  /names it/.test(shape('Main > Card*', { reason: 'r', decision: 'unset' }))
  && !excuses({ reason: 'r', decision: 'unset' }, { expected: 'rgba(0, 0, 0, 1)', actual: 'rgba(9, 9, 9, 1)' }).excused
  && !excuses({ reason: 'r', decision: 'unset' }, { expected: 'wrap', actual: 'nowrap' }).excused
  && !excuses({ reason: 'r', decision: 'unset' }, { expected: '24px', actual: 'calc(1px)', numeric: true }).excused
  && excuses({ reason: 'r', decision: 'unset' }, { expected: '1117px', actual: 'auto', numeric: true }).excused
  && excuses({ reason: 'r', decision: 'unset' }, { expected: '1117px', actual: '0', numeric: true }).excused);
// R5: border-radius and rotate were not numbers, so their waivers bounded nothing.
ok('a radius and a turn are numbers: a waiver on one says how far it excuses, and is held to the distance it is given',
  /within/.test(shape('Card.border-radius', { reason: 'r', fix: 'figma' })) && /within/.test(shape('Icon.rotate', { reason: 'r', fix: 'figma' }))
  && !excuses({ reason: 'r', fix: 'figma', within: 2 }, { expected: '8px', actual: '999px on 80×44', numeric: true, off: 14 }).excused
  && excuses({ reason: 'r', fix: 'figma', within: 2 }, { expected: '8px', actual: '10px on 80×44', numeric: true, off: 2 }).excused);
// R2: a bound shared through a base was the largest sharer's.
ok('a bound is held per target to the largest difference it excused there, give or take a unit of rounding',
  JSON.stringify(looseBounds(new Map([
    ['home', new Map([['Main.padding-bottom', { off: 76, within: 320 }], ['Box.width', { off: 2.4, within: 3 }], ['$root.opacity', { off: 0.5, within: 0.5 }]])],
    ['companies--402', new Map([['Main.padding-bottom', { off: 320, within: 320 }], ['Bar.opacity', { off: 0.4, within: 0.5 }]])],
  ]))) === JSON.stringify([{ name: 'home', key: 'Main.padding-bottom', within: 320, off: 76, excess: 244 }, { name: 'companies--402', key: 'Bar.opacity', within: 0.5, off: 0.4, excess: 0.1 }]));

// A rule written as a distance (the frame's Main less the window) moved on a dozen screens with each text style.
ok('is excuses exactly the value the page holds, whatever the frame draws, and nothing else',
  excuses({ reason: 'r', decision: true, is: 1117 }, { expected: '2461px', actual: '1117px', numeric: true }).excused
  && !excuses({ reason: 'r', decision: true, is: 1117 }, { expected: '9999px', actual: '1117.4px', numeric: true }).excused
  && excuses({ reason: 'r', decision: true, is: 1117 }, { expected: '9999px', actual: '1117.4px', numeric: true, tolerances: { length: 0.5 } }).excused
  && excuses({ reason: 'r', decision: true, is: 1117 }, { expected: '2461px', actual: '1200px', numeric: true }).why === 'ruled 1117, and the page holds 1200px'
  && !excuses({ reason: 'r', decision: true, is: 1117 }, { expected: '2461px', actual: 'auto', numeric: true }).excused);
ok('is is a number on a numeric prop, alone: never beside within or unset, never on a colour or a bare layer',
  shape('Main.height', { reason: 'r', decision: true, is: 1117 }) === ''
  && /within and is/.test(shape('Main.height', { reason: 'r', decision: true, is: 1117, within: 3 }))
  && /no within or is/.test(shape('Main.min-height', { reason: 'r', decision: 'unset', is: 0 }))
  && /not one/.test(shape('Main.background-color', { reason: 'r', decision: true, is: 1 }))
  && /names it/.test(shape('Main', { reason: 'r', decision: true, is: 1 }))
  && /finite number/.test(shape('Main.height', { reason: 'r', decision: true, is: '1117' })));
ok('is states a length: an opacity, a radius or a turn is bounded instead, its tolerance not being half a pixel',
  /states a length/.test(shape('Box.opacity', { reason: 'r', decision: true, is: 1 })) && /states a length/.test(shape('Box.border-radius', { reason: 'r', decision: true, is: 8 }))
  && /states a length/.test(shape('Icon.rotate', { reason: 'r', decision: true, is: 0 })));
ok('an is row records how far the page is from its ruled value, not from the frame, so a taller frame moves no record',
  JSON.stringify([...recordExcused(new Map(), 't', [{ kind: 'waived', waiver: 'Main.height', off: 1344, actual: '1117px' }], () => ({ reason: 'r', decision: true, is: 1117 })).get('t')]) === JSON.stringify([['Main.height', { off: 0 }]]));
ok('a ruled value no difference uses is stale, as a bound is',
  stale({ 'Main.height': { reason: 'r', decision: true, is: 1117 } }, new Set()).join() === 'Main.height');

console.log(`${n}/${n} passed`);
