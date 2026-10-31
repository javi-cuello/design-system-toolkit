#!/usr/bin/env node
// node tools/parity/test-schema.mjs — from the toolkit root.
import assert from 'node:assert/strict';
import { KINDS, isProp, NUMERIC } from './schema.mjs';

let n = 0;
const ok = (name, cond) => { n++; assert.ok(cond, name); console.log('ok', name); };
const is = (kind, e, a, t) => KINDS[kind].compare(e, a, {}, t);
// One project's tolerances: a pixel of box rounding on lengths, nothing else.
const T = { length: 1, colour: { channel: 1, alpha: 0.01 }, position: 4 };

ok('a pixel of box rounding is allowed where the project allows it, and nowhere by default',
  is('length', 44, 45, T) && is('length', [4, 8, 4, 8], [4, 8.5, 4, 8], T) && !is('length', '44px', '45px') && is('length', '44px', '44px'));
// The old rule judged every number within ±1; these two passed under it.
ok('an opacity of 0.4 against 1 differs even where lengths are within a pixel', !is('ratio', 0.4, 1, T) && is('ratio', 0.5, 0.5, T));
ok('a font size of 13 against 14 differs even where lengths are within a pixel', !is('fontSize', 13, 14, T) && is('fontSize', '14px', '14px', T));
ok('a length compares its unit: 50% is not 50px', !is('length', '50px', '50%', T) && is('length', '12px', '12.0px'));
ok('a translucent colour survives the 1/255 a browser stores; a channel off is a difference unless allowed',
  is('colour', 'rgb(22 22 22 / 0.116)', 'rgba(22, 22, 22, 0.118)') && !is('colour', 'rgb(22, 22, 22)', 'rgb(23, 22, 22)') && is('colour', 'rgb(22, 22, 22)', 'rgb(23, 22, 22)', T));
ok('an unparseable colour is compared as written, never matched by accident', !is('colour', 'rgb(0, 0, 0)', 'transparent') && !is('colour', null, null));
ok('a position is within the project\'s own tolerance', is('position', 100, 104, T) && !is('position', 100, 105, T) && !is('position', 100, 101));
ok('a box-shadow is the exact list in order, whatever either side\'s spelling',
  is('shadow', '0px 0px 0px 3px rgb(22 22 22 / 0.116)', 'rgba(22, 22, 22, 0.118) 0px 0px 0px 3px')
  && !is('shadow', '0px 1px 0px 0px rgb(0, 0, 0), 0px 4px 8px 0px rgba(0, 0, 0, 0.2)', 'rgba(0, 0, 0, 0.2) 0px 4px 8px 0px, rgb(0, 0, 0) 0px 1px 0px 0px'));
// Review 2026-10-02 item 40: an inset layer never covers an outer one.
ok('an inset and an outer shadow paint the same in either order; within each set the order is drawn',
  is('shadow', 'inset 0px 1px 0px 0px rgb(0, 0, 0), 0px 4px 8px 0px rgba(0, 0, 0, 0.2)', 'rgba(0, 0, 0, 0.2) 0px 4px 8px 0px, inset 0px 1px 0px 0px rgb(0, 0, 0)')
  && !is('shadow', 'inset 0px 1px 0px 0px rgb(0, 0, 0), inset 0px 2px 0px 0px rgb(9, 9, 9)', 'inset 0px 2px 0px 0px rgb(9, 9, 9), inset 0px 1px 0px 0px rgb(0, 0, 0)'));
ok('a gradient\'s stops in order; a transparent stop is transparent whatever its channels',
  is('gradient', { angle: 90, stops: [{ colour: 'rgba(255, 0, 0, 0)', position: 0 }, { colour: 'rgb(0, 0, 255)', position: 100 }] }, 'linear-gradient(90deg, rgba(0, 0, 0, 0) 0%, rgb(0, 0, 255) 100%)', T)
  && !is('gradient', { angle: 90, stops: [{ colour: 'rgb(0, 0, 255)', position: 100 }] }, 'none', T));
// Review 2026-10-02 item 15: Chrome states no positions for `linear-gradient(red, blue)`.
ok('a gradient whose stops state no positions is placed as CSS places them: 0, evenly between, 100',
  is('gradient', { angle: 180, stops: [{ colour: 'rgb(255, 0, 0)', position: 0 }, { colour: 'rgb(0, 255, 0)', position: 50 }, { colour: 'rgb(0, 0, 255)', position: 100 }] }, 'linear-gradient(rgb(255, 0, 0), rgb(0, 255, 0), rgb(0, 0, 255))', T)
  && is('gradient', 'linear-gradient(90deg, rgb(255, 0, 0) 0%, rgb(0, 0, 255) 100%)', 'linear-gradient(90deg, rgb(255, 0, 0), rgb(0, 0, 255))')
  && !is('gradient', { angle: 180, stops: [{ colour: 'rgb(255, 0, 0)', position: 0 }, { colour: 'rgb(0, 0, 255)', position: 60 }] }, 'linear-gradient(rgb(255, 0, 0), rgb(0, 0, 255))', T));
// Review 2026-10-02 item 14: a percentage radius is a radius per axis.
ok('50% on an 80×44 box is a 40×22 ellipse, not the 22 pill Figma\'s 999 draws; on a square it is the circle',
  !KINDS.radius.compare('999px', { r: '50%', w: 80, h: 44 }, {}, {}) && KINDS.radius.compare('999px', { r: '50%', w: 44, h: 44 }, {}, {})
  && KINDS.radius.compare('999px', { r: '22px', w: 80, h: 44 }, {}, {}) && KINDS.radius.compare('40px / 22px', { r: '50%', w: 80, h: 44 }, {}, {}));
// Review 2026-10-02 round 2, R5: a waiver on a radius or a turn bounded nothing.
ok('a radius is a number whose distance is its largest per-corner difference as drawn, and a turn the shorter way round',
  NUMERIC.has('border-radius') && NUMERIC.has('rotate')
  && KINDS.radius.off('999px', { r: '8px', w: 80, h: 44 }) === 14 && KINDS.radius.off('8px 8px 0px 0px', { r: '8px', w: 80, h: 44 }) === 8
  && KINDS.rotation.off(180, 'none') === 180 && KINDS.rotation.off(350, '10deg') === 20);
// Review 2026-10-02 round 3, S7: Chrome reports a 0.5px border as 1px and a
// 1.5px one as 1px, so exact 0.5px was red on correct code.
const sw = (e, a, prop) => KINDS.strokeWidth.compare(e, a, { prop });
ok('a fractional border width is compared as Chrome snaps it; a whole width stays exact; a path stroke is never snapped',
  sw('0.5px', '1px', 'border-top-width') && sw('1.5px', '1px', 'border-left-width')
  && !sw('0.5px', '0px', 'border-top-width') && !sw('1px', '2px', 'border-top-width')
  && !sw('0.5px', '1px', 'stroke-width') && !sw('2px', '1px', 'border-top-width'));
// Round 4 (F6): a ring's width is snapped only where it is drawn as an outline;
// a shadow's spread is reported as written, so 1px written where the design
// draws 1.5 is red, and the old strokeWidth kind (which snapped -ring-width
// whatever drew it) passed it.
ok('a ring\'s width is compared as snapped only where it is drawn as an outline',
  KINDS.ringWidth.compare('0.5px', { value: '1px', drawn: 'an outline' }) && !KINDS.ringWidth.compare('0.5px', { value: '1px', drawn: 'a shadow' })
  && !KINDS.ringWidth.compare('1.5px', { value: '1px', drawn: 'a shadow' }) && KINDS.ringWidth.compare('1.5px', { value: '1.5px', drawn: 'a shadow' })
  && KINDS.innerRingWidth.compare('2px', { value: '2px', drawn: 'a shadow' }) && KINDS.ringWidth.compare('2px', '2px') && !KINDS.ringWidth.compare('0.5px', '1px')
  && KINDS.ringWidth.off('1.5px', { value: '1px', drawn: 'a shadow' }) === 0.5 && KINDS.ringWidth.show({ value: '1px', drawn: 'a shadow' }) === '1px');
// round 4: a link's selected state is aria-current (or aria-selected), not an attribute named selected
const sel = (attrs) => KINDS.attr.read({ record: { attrs }, assertion: { prop: '-attr:selected', expected: { mode: 'flag', want: 'set' } } });
ok('a link marked aria-current or aria-selected reads as selected; aria-current="false" and none do not',
  sel({ 'aria-current': 'page' }) === 'set' && sel({ 'aria-current': 'true' }) === 'set' && sel({ 'aria-selected': 'true' }) === 'set'
  && sel({ 'aria-current': 'false' }) === 'unset' && sel({ href: '/' }) === 'unset' && sel({ selected: '' }) === 'set');
ok('a text whose lines fill its box matches any vertical alignment; one placed at the top does not match center',
  KINDS.alignment.compare('center', 'filled') && KINDS.alignment.compare('flex-start', 'filled') && !KINDS.alignment.compare('center', 'flex-start'));
ok('the prop table is closed', isProp('column-gap') && isProp('-present') && isProp('-attr:variant') && isProp('-swap:icon-swap') && !isProp('colour-gap') && !isProp('pad'));
ok('rings: outlines in a ring\'s colour held at most to the count, another colour not counted', (() => {
  const e = { count: 1, colours: ['rgb(255, 0, 0)'] };
  return KINDS.rings.compare(e, []) && KINDS.rings.compare(e, ['rgb(255, 0, 0)', 'rgb(0, 0, 255)']) && !KINDS.rings.compare(e, ['rgb(255, 0, 0)', 'rgba(255, 0, 0, 1)']) && KINDS.rings.show(['a', 'b']) === 2 && isProp('-rings');
})());

console.log(`\n${n} passed`);
