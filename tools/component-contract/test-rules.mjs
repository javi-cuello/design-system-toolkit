#!/usr/bin/env node
// tools/component-contract/rules.mjs: the translation table, each row read both ways.
import assert from 'node:assert/strict';
import { declarations } from './css.mjs';
import { alignFromFigma, alignToFigma, alignToCss, alignFromCss, sizeFromFigma, sizeToFigma, sizeFromCss, layoutFromCss, placeFromCss, autoResizeOf, styleFromCss, ALIGN_ROWS } from './rules.mjs';
import { tokenNames } from './to-code.mjs';

let n = 0;
const ok = (name, cond) => { n++; assert.ok(cond, name); console.log('ok', name); };
const names = { token: (t) => `var(--${t})`, textStyle: () => [] };

ok('every alignment Figma has comes back from Figma the same, and every one CSS has from CSS along the flow (across, stretch is the children\'s fill)',
  ALIGN_ROWS.every(([w, f]) => (!f || alignFromFigma(alignToFigma(w)) === w) && alignFromCss(alignToCss(w), true) === w)
  && ALIGN_ROWS.filter(([w]) => w !== 'stretch').every(([w]) => alignFromCss(alignToCss(w), false) === w));
ok('Figma has no stretch alignment: drawn at MIN, said lossy', alignToFigma('stretch') === 'MIN');
ok('CSS\'s normal is start along the flow; across it the children stretch, which each child\'s fill says, so start',
  alignFromCss('normal', true) === 'start' && alignFromCss(undefined, false) === 'start' && alignFromCss('stretch', false) === 'start' && alignFromCss('flex-end', false) === 'end');
ok('hug and fill are Figma\'s HUG and FILL, both ways', sizeFromFigma(sizeToFigma('hug')) === 'hug' && sizeFromFigma(sizeToFigma('fill')) === 'fill' && sizeFromFigma('FIXED') === undefined);

const row = { display: 'flex', 'flex-direction': 'row' }, column = { display: 'flex', 'flex-direction': 'column' };
const size = (axis, own, up, root = false) => sizeFromCss(axis, own, up, { root }).value;
ok('in a row, flex 1 fills along it; a child with no size of its own hugs along it and is stretched across it',
  size('width', { flex: '1 1 0' }, row) === 'fill' && size('width', {}, row) === 'hug' && size('height', {}, row) === 'fill');
ok('across, a self-alignment other than stretch hugs, as does a parent\'s align-items: center', size('height', { 'align-self': 'center' }, row) === 'hug' && size('width', {}, { ...column, 'align-items': 'center' }) === 'hug');
ok('a length is a fixed size, a token\'s var() kept for the caller to name; fit-content hugs',
  size('width', { 'inline-size': '24px' }, row) === '24px' && size('height', { height: 'var(--size-8)' }, row) === 'var(--size-8)' && size('width', { width: 'fit-content' }, row) === 'hug');
ok('along the flow, growth and a basis come before a width; a lone basis grows (css-flexbox-1 §7.1.1, §9.2.3)',
  size('width', { flex: '0 0 24px', width: '100px' }, row) === '24px' && size('width', { flex: '0 24px' }, row) === '24px' && size('width', { flex: '0px' }, row) === 'fill' && size('width', { flex: '1', width: '24px' }, row) === 'fill');
ok('a 100% height in a flex parent with no height of its own is auto, so hugs, along a column and across a row alike; of a parent 40px high it fills',
  size('height', { height: '100%' }, column) === 'hug' && size('height', { height: '100%' }, row) === 'hug' && size('height', { height: '100%' }, { ...row, height: '40px' }) === 'fill'
  && size('height', { height: '100%' }, { display: 'flex', 'flex-direction': 'column' }, true) === 'hug');
ok('a basis written as a token, a calc() or zero: the token or calc() is the size, zero is none',
  size('width', { flex: '0 var(--size-6)' }, row) === 'var(--size-6)' && size('width', { flex: '0 0 calc(8px * 2)' }, row) === 'calc(8px * 2)' && size('width', { flex: '0 0 0px' }, row) === 'hug');
ok('across a flex row with no height, any percentage height is auto and stops the stretch', size('height', { height: '50%' }, row) === 'hug');
ok('the outer box: inline-flex hugs, a block fills across and hugs down, and filling a frame that sets a width is that width',
  size('width', { display: 'inline-flex' }, {}, true) === 'hug' && size('width', { display: 'flex' }, {}, true) === 'fill' && size('height', { display: 'flex' }, {}, true) === 'hug'
  && size('width', { display: 'flex', 'inline-size': '100%' }, { display: 'block', width: '550px' }, true) === '550px');
ok('a percentage height of a parent whose height is its content\'s is auto, so hugs (css2 §10.5)', size('height', { height: '100%' }, { display: 'block' }) === 'hug');
ok('a grid item is stretched both ways where its self-alignment is normal', size('width', {}, { display: 'grid' }) === 'fill' && size('height', { 'align-self': 'normal' }, { display: 'grid' }) === 'fill' && size('height', { 'align-self': 'start' }, { display: 'grid' }) === 'hug');

ok('auto layout from flex: direction, gap along the flow (row-gap column-gap), padding\'s one to four values, alignment',
  JSON.stringify(layoutFromCss({ display: 'flex', 'flex-direction': 'column', gap: '4px 8px', padding: '1px 2px', 'justify-content': 'center' }))
    === '{"direction":"column","gap":"4px","padding":{"top":"1px","end":"2px","bottom":"1px","start":"2px"},"align":"center","crossAlign":"start"}'
  && layoutFromCss({ display: 'block' }) === null);
// the law, on one part: what css.mjs writes for a contract's layout reads back as that layout
{
  const e = { kind: 'container', layout: { direction: 'row', gap: 'Spacing/4', align: 'space-between', crossAlign: 'center', padding: { top: 'Spacing/2', end: 'Spacing/4', bottom: 'Spacing/2', start: 'Spacing/4' } } };
  const own = Object.fromEntries(declarations(e, { root: false, holds: true, row: true }, names).decls.map(([p, v]) => [p, v]));
  const back = layoutFromCss(own);
  ok('a layout written by css.mjs reads back the same, but for its gap: space-between drops it, as CSS would add it to the space',
    back.direction === 'row' && back.align === 'space-between' && back.crossAlign === 'center' && back.padding.end === 'var(--Spacing/4)' && back.gap === undefined);
}

// placement: what css.mjs writes for each constraint reads back as that constraint, its far offsets as written
{
  const back = (constraints, absolute) => placeFromCss(Object.fromEntries(declarations({ kind: 'container', position: 'absolute', constraints, absolute }, { holds: false, row: true }, names).decls.map(([p, v]) => [p, v])));
  const all = ['min', 'max', 'center', 'stretch'];
  ok('every constraint CSS can say comes back from css.mjs\'s CSS: an edge, the far edge, the centre, both edges',
    all.every((h) => all.every((v) => { const b = back({ horizontal: h, vertical: v }, { x: 4, y: 8, end: 2, bottom: 6 }); return b.constraints.horizontal === h && b.constraints.vertical === v; })));
  const s = back({ horizontal: 'stretch', vertical: 'max' }, { x: 0, y: 228, end: 0, bottom: 0 });
  ok('pinned to both side edges and the bottom: those insets as written, the point left to the caller', s.offsets.x === '0' && s.offsets.end === '0' && s.offsets.bottom === '0' && s.offsets.y === undefined);
  ok('in the flow is no placement; fixed is placed as absolute is; the inset shorthand reads as its four edges',
    placeFromCss({ position: 'relative' }) === null && placeFromCss({ position: 'fixed', inset: '0' }).constraints.horizontal === 'stretch' && placeFromCss({ position: 'absolute', inset: 'auto 0 0 auto' }).constraints.vertical === 'max');
  ok('a transform\'s translateX(-50%) or translate3d centres as translate does; both edges beside a size of its own pin the near one (css2 §10.3.7)',
    placeFromCss({ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }).constraints.horizontal === 'center'
    && placeFromCss({ position: 'absolute', top: '50%', transform: 'translate3d(0, -50%, 0)' }).constraints.vertical === 'center'
    && placeFromCss({ position: 'absolute', left: '0', right: '0', width: '24px' }).constraints.horizontal === 'min'
    && placeFromCss({ position: 'absolute', top: '50%', translate: 'none', transform: 'translateY(-50%)' }).constraints.vertical === 'center');
  // Figma's scale has no CSS constraint: its synonym is a share of the parent, written where the parent's size is a number
  const sc = Object.fromEntries(declarations({ kind: 'container', position: 'absolute', constraints: { horizontal: 'scale', vertical: 'min' }, absolute: { x: 25, y: 4 }, width: 50, height: 10 }, { holds: false, row: true, box: { width: 200, height: 40 } }, names).decls.map(([p, v]) => [p, v]));
  ok('scale is written as shares of the parent (25 of 200 at 12.5%, 50 wide at 25%) and reads back as scale', sc['inset-inline-start'] === '12.5%' && sc['inline-size'] === '25%' && placeFromCss(sc).constraints.horizontal === 'scale');
}

// text: how it resizes is its sizes; its style is named by the declarations that say it
ok('a text that hugs its width grows both ways, one that hugs its height wraps at its width, one fixed both ways is none',
  autoResizeOf('hug', 'hug') === 'width_and_height' && autoResizeOf('fill', 'hug') === 'height' && autoResizeOf(120, 'hug') === 'height' && autoResizeOf(120, 40) === 'none' && autoResizeOf('fill', 40) === 'none');
{
  const styles = ['Label/md', 'Label/md-medium', 'Body/md'];
  const own = Object.fromEntries(tokenNames.textStyle('Label/md-medium'));
  ok('a text style is named by its declarations, never by a size two styles share', styleFromCss(own, styles, tokenNames.textStyle) === 'Label/md-medium'
    && styleFromCss({}, styles, tokenNames.textStyle) === null
    // (two styles whose declarations are the same: neither is named)
    && styleFromCss({ 'font-size': '14px' }, ['A', 'B'], () => [['font-size', '14px']]) === null && styleFromCss({ 'font-size': '14px' }, ['A'], () => [['font-size', '14px']]) === 'A');
}

console.log(`${n}/${n} passed`);
