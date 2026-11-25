#!/usr/bin/env node
// tools/component-contract/rules.mjs: the translation table, each row read both ways.
import assert from 'node:assert/strict';
import { declarations } from './css.mjs';
import { alignFromFigma, alignToFigma, alignToCss, alignFromCss, sizeFromFigma, sizeToFigma, sizeFromCss, layoutFromCss, placeFromCss, autoResizeOf, writtenNowrap, linesFromCss, styleFromCss, ALIGN_ROWS, smoothingToCss, smoothingFromCss, pathsToCss, pathsFromCss, pathsOfBox, blendToCss, blendFromCss, typeValue, typeOfValue, familyToCss, firstFamily, typeFromFigma, spacingToCss, spacingFromCss, spacingFromFigma, CASE_ROWS, DECORATION_ROWS, textToCss, textFromCss } from './rules.mjs';
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

ok('Figma\'s rotation (counter-clockwise) is CSS\'s rotate the other way: 90 → rotate: -90deg',
  declarations({ kind: 'container', rotation: 90 }, { holds: false, row: true }, names).decls.some(([p, v]) => p === 'rotate' && v === '-90deg'));
// placement: what css.mjs writes for each constraint reads back as that constraint, its far offsets as written
{
  const back = (constraints, absolute) => placeFromCss(Object.fromEntries(declarations({ kind: 'container', position: 'absolute', constraints, absolute }, { holds: false, row: true }, names).decls.map(([p, v]) => [p, v])));
  const all = ['min', 'max', 'center', 'stretch'];
  ok('every constraint CSS can say comes back from css.mjs\'s CSS: an edge, the far edge, the centre, both edges',
    all.every((h) => all.every((v) => { const b = back({ horizontal: h, vertical: v }, { x: 4, y: 8, end: 2, bottom: 6 }); return b.constraints.horizontal === h && b.constraints.vertical === v; })));
  {
    const css = declarations({ kind: 'container', position: 'absolute', constraints: { horizontal: 'center', vertical: 'center' }, absolute: { x: -52, y: 4 }, width: 48, height: 44 }, { holds: false, row: true, box: { width: 44, height: 44 } }, names).decls;
    const left = (css.find(([p]) => p === 'inset-inline-start') || [])[1], top = (css.find(([p]) => p === 'inset-block-start') || [])[1];
    const b2 = placeFromCss(Object.fromEntries(css.map(([p, v]) => [p, v])));
    ok('centred off the middle keeps its centre\'s distance from the parent\'s (x -52 on a 44 box at 48 wide: calc(50% - 50px)), and reads back as centred', left === 'calc(50% - 3.125rem)' && top === 'calc(50% + 0.25rem)' && b2.constraints.horizontal === 'center' && b2.constraints.vertical === 'center');
  }
  {
    // its far edges say the centre's distance with no size: an icon in a box that fills (Material's toggleable icon button)
    const css = declarations({ kind: 'instance', position: 'absolute', constraints: { horizontal: 'center', vertical: 'center' }, absolute: { x: 8.3, y: 7.75, end: 7.7, bottom: 8.25 }, width: 'hug', height: 24 }, { holds: false, row: true, box: { width: 'fill', height: 'fill' } }, names).decls;
    const left = (css.find(([p]) => p === 'inset-inline-start') || [])[1], top = (css.find(([p]) => p === 'inset-block-start') || [])[1];
    ok('centred off the middle where neither size is a number: (x - end) / 2 from the middle, as its far edges say it', left === "calc(50% + 0.0187rem)" && top === "calc(50% - 0.0156rem)");
  }
  {
    // an odd room on Figma's pixel grid (a 24 spinner in a button 61 wide: 19 and 18) is centred, by either way of saying it
    const at = (absolute, box) => Object.fromEntries(declarations({ kind: 'instance', position: 'absolute', constraints: { horizontal: 'center', vertical: 'center' }, absolute, width: box ? 24 : 'hug', height: box ? 24 : 'hug' }, { holds: false, row: true, box }, names).decls);
    ok('centred in an odd room, the pixel Figma rounds up to is the middle; rounded the other way, said by sizes alone, a pixel off or no whole edge, it is kept',
      at({ x: 19, y: -4, end: 18, bottom: -5 })['inset-inline-start'] === '50%' && at({ x: 19, y: -4, end: 18, bottom: -5 })['inset-block-start'] === '50%'
      && at({ x: 18, y: 8, end: 19, bottom: 8 })['inset-inline-start'] === 'calc(50% - 0.0313rem)'
      && at({ x: 19, y: 8 }, { width: 61, height: 41 })['inset-inline-start'] === 'calc(50% + 0.0313rem)'
      && at({ x: 20, y: 8, end: 18, bottom: 8 })['inset-inline-start'] === 'calc(50% + 0.0625rem)' && at({ x: 19.5, y: 8, end: 18.5, bottom: 8 })['inset-inline-start'] !== '50%');
  }
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
ok('pre is a text written never to wrap at any width but a filled one (css.mjs writes it at a hugging width, or a set one Figma says grows both ways)', writtenNowrap('pre') && !writtenNowrap('pre', false, true) && !writtenNowrap('pre-wrap') && !writtenNowrap('pre', true) && writtenNowrap('nowrap', false, true));
ok('an ellipsis on one line is a cut under pre as under nowrap, only where the words hold no newline (pre cuts each line and shows them all)', (linesFromCss({ 'text-overflow': 'ellipsis', 'white-space': 'pre', overflow: 'hidden' }, 'a  b') || {}).maxLines === 1 && linesFromCss({ 'text-overflow': 'ellipsis', 'white-space': 'pre', overflow: 'hidden' }, 'a\nb') === null && linesFromCss({ 'text-overflow': 'ellipsis', 'white-space': 'pre-wrap', overflow: 'hidden' }) === null && (linesFromCss({ 'text-overflow': 'ellipsis', 'white-space': 'nowrap', overflow: 'hidden' }, 'a\nb') || {}).maxLines === 1);
ok('nowrap is the text\'s own only where it is written on the text: a loose text\'s parent saying it says nothing', writtenNowrap('nowrap') && !writtenNowrap('nowrap', true) && !writtenNowrap(null) && !writtenNowrap('normal'));
ok('a text written never to wrap grows both ways whatever size it states (a WIDTH_AND_HEIGHT text placed by scale), as css.mjs writes it',
  autoResizeOf(19, 24, true) === 'width_and_height' && Object.fromEntries(declarations({ kind: 'text', width: 19, height: 24, autoResize: 'width_and_height' }, {}, { token: (n) => `var(--${n})`, textStyle: () => [] }).decls)['white-space'] === 'nowrap');
{
  const styles = ['Label/md', 'Label/md-medium', 'Body/md'];
  const own = Object.fromEntries(tokenNames.textStyle('Label/md-medium'));
  ok('a text style is named by its declarations, never by a size two styles share', styleFromCss(own, styles, tokenNames.textStyle) === 'Label/md-medium'
    && styleFromCss({}, styles, tokenNames.textStyle) === null
    // (two styles whose declarations are the same: neither is named)
    && styleFromCss({ 'font-size': '14px' }, ['A', 'B'], () => [['font-size', '14px']]) === null && styleFromCss({ 'font-size': '14px' }, ['A'], () => [['font-size', '14px']]) === 'A');
}

ok('a blend goes to mix-blend-mode in CSS\'s spelling and back in Figma\'s; normal is none', blendToCss('color_dodge') === 'color-dodge' && blendFromCss('color-dodge') === 'color_dodge' && blendFromCss(blendToCss('multiply')) === 'multiply' && blendFromCss('normal') === undefined && blendFromCss('') === undefined);

ok('corner smoothing goes to corner-shape and back the same, 0.1 to 1; none, 0 and the plain circle say no smoothing',
  [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1].every((v) => smoothingFromCss(smoothingToCss(v)) === v)
  && smoothingToCss(0) === null && smoothingToCss(undefined) === null && smoothingFromCss('round') === null && smoothingFromCss('superellipse(1)') === null && smoothingFromCss('squircle') === smoothingFromCss('superellipse(2)') && smoothingFromCss('superellipse(2e0)') === smoothingFromCss('superellipse(2)'));

{ // a vector's own outline (derive's paths) as a clip-path, its fill rule kept, read back as Chrome computes it
  const one = [{ windingRule: 'NONZERO', data: 'M 84 3.12 L 84 28 L 0 28 C 0 12.54 25.77 0 57.56 0 Z' }], odd = [{ windingRule: 'EVENODD', data: 'M 0 0 L 4 0 L 4 4 Z' }];
  ok('a vector\'s one path is a clip-path, even-odd said, and reads back the same', pathsToCss(one) === 'path("M 84 3.12 L 84 28 L 0 28 C 0 12.54 25.77 0 57.56 0 Z")' && pathsToCss(odd) === 'path(evenodd, "M 0 0 L 4 0 L 4 4 Z")'
    && JSON.stringify(pathsFromCss(pathsToCss(one))) === JSON.stringify(one) && JSON.stringify(pathsFromCss(pathsToCss(odd))) === JSON.stringify(odd) && JSON.stringify(pathsFromCss('path(nonzero, "M 0 0 Z")')) === '[{"windingRule":"NONZERO","data":"M 0 0 Z"}]');
  ok('…read only off a vector\'s box as the markup draws one (empty, hidden from readers), never a container a project clips', JSON.stringify(pathsOfBox({ clipPath: pathsToCss(one), ariaHidden: true, children: 0, text: '' })) === JSON.stringify(one)
    && pathsOfBox({ clipPath: pathsToCss(one), ariaHidden: false, children: 0, text: '' }) === null && pathsOfBox({ clipPath: pathsToCss(one), ariaHidden: true, children: 2, text: '' }) === null && pathsOfBox({ clipPath: pathsToCss(one), ariaHidden: true, children: 0, text: 'Hi' }) === null && pathsOfBox(undefined) === null);
  ok('…an open path (no fill rule) or several none: no one clip says them; none and an inset read as no path', pathsToCss([{ windingRule: 'NONE', data: 'M 0 0 L 1 1' }]) === null && pathsToCss([...one, ...odd]) === null && pathsToCss([]) === null && pathsFromCss('none') === null && pathsFromCss('inset(0px)') === null); }

{ // a mirror (the snapshot's flip) is its own property, scale, as rotate is
  const d = (flip) => JSON.stringify(declarations({ kind: 'container', flip }, { holds: false, row: true }).decls);
  ok('a horizontal mirror writes scale: -1 1, a vertical one 1 -1, none nothing', d('x') === '[["scale","-1 1"]]' && d('y') === '[["scale","1 -1"]]' && d(undefined) === '[]'); }

{ // 2026-11-22: a text with no style, its values in one form both ways, and each reading the inverse of its writing
  ok('a text\'s values from Figma are the form code reads them in', typeFromFigma({ fontSize: 12, fontFamily: 'Inter', fontStyle: 'Semi Bold', lineHeight: '16' }) === typeValue({ size: 12, lineHeight: 16, weight: 'semibold', family: 'Inter' })
    && typeFromFigma({ fontSize: 14, fontFamily: 'Inter', fontStyle: 'Bold Italic', lineHeight: '150%' }) === 'literal 14/21 bold italic Inter' && typeFromFigma({ fontSize: 14, fontFamily: 'Inter', fontStyle: 'Regular', lineHeight: 'auto' }) === 'literal 14/0 regular Inter');
  ok('…and its form parses back whole, the family last whatever it holds', JSON.stringify(typeOfValue('literal 14/21 bold italic IBM Plex Sans')) === JSON.stringify({ size: 14, lineHeight: 21, weight: 'bold', cssWeight: 700, italic: true, family: 'IBM Plex Sans' })
    && typeOfValue('literal 12/16 450 Inter') === null && typeOfValue('14/20 regular') === null && firstFamily('"IBM Plex Sans", sans-serif') === 'IBM Plex Sans');
  ok('…none without a size or face recorded, or a weight with no name', typeFromFigma({ lineHeight: '16' }) === null && typeFromFigma({ fontSize: 12, fontFamily: 'Inter', lineHeight: '16' }) === null && typeFromFigma({ fontSize: 12, fontStyle: 'Regular', lineHeight: '16' }) === null && typeFromFigma({ fontSize: 12, fontFamily: 'Inter', fontStyle: 'Wide', lineHeight: '16' }) === null);
  const face = (fontStyle) => typeFromFigma({ fontSize: 12, fontFamily: 'Inter', fontStyle, lineHeight: '16' });
  ok('…a face whose words are joined is read by them, and Roman is the regular one; an unknown face is still none', face('BoldItalic') === 'literal 12/16 bold italic Inter' && face('SemiBoldOblique') === 'literal 12/16 semibold italic Inter'
    && face('Roman') === 'literal 12/16 regular Inter' && face('Roman Italic') === 'literal 12/16 regular italic Inter' && face('Bold Italic') === 'literal 12/16 bold italic Inter' && face('Italic') === 'literal 12/16 regular italic Inter'
    && face('Display Bold') === null && face('BoldWide') === null && face('Bold Roman') === null);
  ok('letter spacing reads as derive says it, the px of it whatever unit code wrote: 0.02em on 14px is the design\'s 2%', spacingFromCss('0.28px') === spacingFromFigma('2%', 14) && spacingFromCss('-0.24px') === spacingFromFigma('-2%', 12) && spacingFromCss('normal') === undefined && spacingToCss('2%') === '0.02em');
  ok('…only a recorded auto is Auto: a line height not recorded (several in one text) is no value of 0',
    typeFromFigma({ fontSize: 12, fontFamily: 'Inter', fontStyle: 'Regular' }) === null && typeFromFigma({ fontSize: 12, fontFamily: 'Inter', fontStyle: 'Regular', lineHeight: 'auto' }) === 'literal 12/0 regular Inter');
  ok('…an underscore joins a face\'s words as a space does', face('Bold_Italic') === 'literal 12/16 bold italic Inter' && face('Semi_Bold') === 'literal 12/16 semibold Inter');
  ok('a family that holds a comma, a bracket or an escape reads back whole from the first a font-family names',
    firstFamily('"Foo, Bar", serif') === 'Foo, Bar' && firstFamily('"Odd (Pro", serif') === 'Odd (Pro' && firstFamily("'Odd) Pro', serif") === 'Odd) Pro'
    && firstFamily(JSON.stringify('Say "Hi"') + ', serif') === 'Say "Hi"' && firstFamily('"A\\\\B"') === 'A\\B' && firstFamily('A\\,B, serif') === 'A,B' && firstFamily('system-ui, serif') === 'system-ui');
  ok('a font called serif or Math, of the seven keywords Chrome quotes back, keeps its quotes, so it is never written as the generic; BlinkMacSystemFont\'s computed "system-ui" is system-ui',
    firstFamily('"serif", sans-serif') === '"serif"' && firstFamily("'Math'") === '"Math"' && firstFamily('serif') === 'serif' && firstFamily('"system-ui"') === 'system-ui');
  ok('a Figma family called as a CSS keyword is a font, quoted, never written as the generic',
    typeFromFigma({ fontSize: 14, lineHeight: '20', fontStyle: 'Regular', fontFamily: 'Fantasy' }) === 'literal 14/20 regular "Fantasy"' && familyToCss('"Fantasy"') === '"Fantasy"');
  ok('case and decoration read back as written', CASE_ROWS.every(([w]) => { const [p, v] = textToCss(CASE_ROWS, w); return textFromCss(CASE_ROWS, { [p]: v, 'text-transform': p === 'text-transform' ? v : 'none' }) === w; })
    && textFromCss(DECORATION_ROWS, { 'text-decoration-line': 'underline line-through' }) === 'underline' && textFromCss(CASE_ROWS, { 'text-transform': 'none', 'font-variant-caps': 'normal' }) === undefined);
}
console.log(`${n}/${n} passed`);
