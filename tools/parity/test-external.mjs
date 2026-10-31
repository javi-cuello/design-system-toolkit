#!/usr/bin/env node
// tools/parity/external.mjs: the code audit's pure parts.
import assert from 'node:assert/strict';
import { parseColour as rgba } from './values.mjs';
import { judge, expected, combinations, argsFor, group, where, compareProps, frameworkProps, draftEntry, joinProp, suspectMappings, tokenWords, cssShadows, shadowKey, compareTokens, readApi, elementIn, winning, invisibleBorder, storyKey, componentKey, insideAudited, contractEntry, varChain } from './external.mjs';

import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
// what a library on the framework these fixtures are written in is given (audit-defaults codeProps, then frameworks): no MUI fact lives in the code
const HOUSE = JSON.parse(readFileSync(new URL('../../standards/audit-settings.json', import.meta.url), 'utf8'))['audit-defaults'];
const FW = createRequire(import.meta.url)('../snapshot/projects.cjs').codeProfile(HOUSE, HOUSE.frameworks.mui);
let n = 0;
const ok = (name, cond) => { n++; assert.ok(cond, name); console.log('ok', name); };

ok('a colour reads from hex, rgb() and rgba() in either syntax',
  JSON.stringify(rgba('#c40d22')) === '[196,13,34,1]' && JSON.stringify(rgba('rgb(0 0 0 / 0.1)')) === '[0,0,0,0.1]'
  && JSON.stringify(rgba('rgba(22, 22, 22, 0.075)')) === '[22,22,22,0.075]' && rgba('nonsense') === null);

ok('a colour written differently that draws the same over what is behind it looks the same; one that draws differently differs',
  judge({ color: '#eeeeee' }, 'rgba(22, 22, 22, 0.075)') === 'looks-same'
  && judge({ color: 'rgb(22 22 22 / 0.644)' }, 'rgb(97, 97, 97)', 'rgb(238, 238, 238)') === 'looks-same'
  && judge({ color: 'rgb(22 22 22 / 0.644)' }, 'rgb(97, 97, 97)') === 'differs'
  && judge({ color: '#c40d22' }, 'rgba(0, 0, 0, 0.914)') === 'differs'
  && judge({ color: '#c40d22' }, 'rgb(196, 13, 34)') === 'same'
  // two opaque colours a few levels apart are two tokens, not one drawn twice
  && judge({ color: '#fffcfc' }, 'rgb(253, 253, 253)') === 'differs');

ok('numbers are the same within half a pixel', judge(18.4, 18) === 'same' && judge(18.4, 16) === 'differs');

const value = (t) => ({ 'S/12': 12, 'C/red': '#c40d22', 'Stroke/1': 1, 'C/soft': 'rgb(0 0 0 / 0.1)' }[t] ?? t);
const style = () => ({ size: 16, lineHeight: 1.15, weight: 'Medium', letterSpacing: -0.01 });
const e = expected({ kind: 'container', background: 'C/red', layout: { padding: { top: 'S/12', end: 'S/12', bottom: 'S/12', start: 'S/12' } }, border: { color: 'C/soft', width: ['Stroke/1'] } }, ['background', 'padding', 'border'], value, style);
const t = expected({ kind: 'text', color: 'C/red', typography: 'Label/md' }, ['color', 'typography'], value, style);
ok('what the contract says an element should measure, each value with the token it came from',
  e.background.want.color === '#c40d22' && e.background.token === 'C/red' && e['padding-start'].want === 12 && e['border-width'].want === 1
  && t['line-height'].want === 18.4 && t['font-weight'].want === 500 && t['letter-spacing'].want === -0.16);
ok('no fill drawn is a transparent box; no border drawn is a width of 0',
  expected({ kind: 'container' }, ['background', 'border'], value, style).background.want.color === 'rgb(0 0 0 / 0)'
  && expected({ kind: 'container' }, ['border'], value, style)['border-width'].want === 0);

const contract = { props: { size: { type: 'enum', values: ['l', 's'], default: 'l' }, disabled: { type: 'boolean', default: false }, state: { type: 'enum', values: ['rest', 'hover', 'loading'], default: 'rest' }, icon: { type: 'boolean', default: false } },
  invalid: [{ disabled: true, state: 'hover' }] };
const map = { props: { size: 'size', disabled: 'disabled', state: { pseudo: { hover: 'hover' }, skip: ['loading'] }, icon: { fixed: false } }, fixed: { children: 'Go' } };
const all = combinations(contract, map);
ok('every combination the map varies, without the contract\'s invalid ones or the map\'s skipped values, fixed props held',
  all.length === 6 && !all.some((w) => w.disabled && w.state === 'hover') && !all.some((w) => w.state === 'loading') && all.every((w) => w.icon === false));

ok('a combination becomes the story\'s args and the pointer state to force',
  JSON.stringify(argsFor({ size: 's', disabled: true, state: 'hover', icon: false }, map)) === JSON.stringify({ args: { children: 'Go', size: 's', disabled: true }, pseudo: 'hover' })
  && argsFor({ role: 'tertiary' }, { props: { role: { arg: 'variant', values: { tertiary: 'text' } } } }).args.variant === 'text');

const W = (feedback, state) => ({ feedback, state, icon: false });
const rows = [W('neutral', 'rest'), W('neutral', 'hover'), W('danger', 'rest'), W('danger', 'hover')].flatMap((when) => [
  { verdict: 'differs', element: 'root', field: 'border-width', when, want: 1, got: 0 },
  { verdict: when.feedback === 'danger' ? 'differs' : 'same', element: 'root', field: 'background', when, want: 'red', got: 'black' }]);
const g = group(rows);
ok('differences are grouped by element and field, with every combination they show in, real ones first',
  g.length === 2 && g[0].count === 4 && g[0].of === 4 && g[0].seen.length === 4 && g[1].count === 2);
ok('where a difference shows: every combination, or the prop values its combinations share, never a prop held fixed for all',
  g[0].where.every === true && JSON.stringify(g[1].where.shared) === '{"feedback":"danger"}'
  && JSON.stringify(where([W('danger', 'rest')], [W('danger', 'rest'), W('neutral', 'hover')], { state: 'rest' })) === '{"every":false,"shared":{"feedback":"danger"}}'
  && JSON.stringify(where([W('neutral', 'rest')], [W('neutral', 'rest'), W('danger', 'hover')], { feedback: 'neutral', state: 'rest' })) === '{"every":false,"shared":{"feedback":"neutral","state":"rest"}}');

const pc = { props: {
  size: { type: 'enum', values: ['large', 'small'], default: 'large', figma: 'Size' },
  role: { type: 'enum', values: ['primary', 'tertiary'], default: 'primary', figma: 'Role' },
  feedback: { type: 'enum', values: ['neutral', 'success', 'danger'], default: 'neutral', figma: 'Feedback' },
  state: { type: 'enum', values: ['rest', 'hover', 'loading'], default: 'rest', role: 'interaction', pointer: ['hover'], figma: 'State' },
  leftIcon: { type: 'boolean', default: false, figma: 'Left icon' } } };
const pm = { props: { size: 'size', role: { arg: 'variant', values: { primary: 'contained', tertiary: 'text' } }, feedback: { arg: 'color', values: { neutral: 'primary', success: 'positive' } }, state: { pseudo: { hover: 'hover' } }, leftIcon: { fixed: false } } };
const pm2 = { props: { ...pm.props, leftIcon: { code: 'startIcon', fixed: false } } };
const args = { size: { options: ['small', 'large'], default: 'medium' }, startIcon: { options: null }, variant: { options: ['contained', 'text', 'ai'], default: 'contained' }, color: { options: ['primary', 'danger'], default: 'primary' }, loading: { options: null, default: false } };
const byProp = Object.fromEntries(compareProps(pc, pm, args).map((r) => [r.prop, r.findings.map((f) => `${f.kind}: ${f.detail}`)]));
ok('the design\'s props against the code\'s: a rename, a translated value, a value code lacks, extra code values, another default, an unjoined prop',
  JSON.stringify(byProp.size) === JSON.stringify(['default: large in design, medium in code'])
  && byProp.role.includes('renamed: role in design, variant in code') && byProp.role.includes('value-renamed: primary in design, contained in code') && byProp.role.includes('only-in-code: ai')
  && byProp.feedback.includes('value-renamed: success in design, positive in code') && byProp.feedback.includes('missing: code does not offer success')
  && JSON.stringify(byProp.state) === JSON.stringify(['ok: loading is a prop of its own in code'])
  && byProp.leftIcon[0].startsWith('not-mapped')
  && JSON.stringify(compareProps(pc, pm2, args).find((r) => r.prop === 'leftIcon').findings) === JSON.stringify([{ kind: 'renamed', detail: 'left icon in design, startIcon in code' }])
  && JSON.stringify(argsFor({ leftIcon: false }, pm2)) === JSON.stringify({ args: {}, pseudo: null }));

const dts = `export interface ButtonOwnProps {
  color?: OverridableStringUnion<'inherit' | 'primary' | 'secondary', ButtonPropsColorOverrides> | undefined;
  disabled?: boolean | undefined;
  size?: OverridableStringUnion<'small' | 'medium' | 'large', ButtonPropsSizeOverrides> | undefined;
  startIcon?: React.ReactNode;
  variant?: OverridableStringUnion<'text' | 'outlined' | 'contained', ButtonPropsVariantOverrides> | undefined;
}`;
const mp = frameworkProps(dts, FW);
ok('MUI\'s own props from its type definitions: a string union\'s values, else the type',
  mp.variant.values.join() === 'text,outlined,contained' && mp.color.values.join() === 'inherit,primary,secondary' && mp.disabled.type === 'boolean' && mp.startIcon.type === 'React.ReactNode');
{
  const plain = createRequire(import.meta.url)('../snapshot/projects.cjs').codeProfile(HOUSE, {});
  const only = compareProps({ component: 'X', props: {} }, { props: {} }, { onClick: {}, className: {}, density: { options: ['a'] } }, null, plain).map((r) => r.code.prop);
  ok('a library on no framework still knows a handler and a class are no design prop: the platform\'s facts are the house\'s, not a framework\'s', only.join() === 'density');
}
const withMui = compareProps(pc, pm, args, mp, FW);
ok('each joined prop says what MUI calls it and MUI\'s own values; a prop MUI does not have says so',
  withMui.find((r) => r.prop === 'role').framework.values.join() === 'text,outlined,contained'
  && withMui.find((r) => r.prop === 'feedback').framework.prop === 'color'
  && compareProps(pc, { props: { size: 'buttonSize' } }, { buttonSize: { options: ['l'] } }, mp, FW).find((r) => r.prop === 'size').framework.prop === null);

ok('past a cap, combinations are each prop moved alone from its default',
  combinations(contract, map, 3).length === 4 && combinations(contract, map, 3).every((w) => [w.size !== 'l', w.disabled, w.state !== 'rest'].filter(Boolean).length <= 1));

const dc = { props: { labelText: { type: 'string' }, size: { type: 'enum', values: ['small', 'large'], default: 'large' }, tone: { type: 'enum', values: ['info', 'error'], default: 'info' }, kind: { type: 'enum', values: ['x', 'y'], default: 'x' }, disabled: { type: 'boolean', default: false }, state: { type: 'enum', values: ['rest', 'hover', 'loading'], default: 'rest', role: 'interaction', pointer: ['hover'] } },
  anatomy: { root: { kind: 'container' }, box: { kind: 'container', parent: 'root', background: 'Bg' } } };
const de = draftEntry(dc, { children: {}, size: { options: ['small', 'medium', 'large'] }, severity: { options: ['info', 'error', 'success'] }, disabled: {} }, 'alert--playground');
ok('a drafted entry joins props by name or by options that hold every value, leaves the rest at their default, and leaves its elements to the pairing rule',
  de.draft && de.props.size === 'size' && de.props.tone === 'severity' && de.props.disabled === 'disabled' && de.props.kind.fixed === 'x'
  && de.props.labelText.arg === 'children' && de.props.state.pseudo.hover === 'hover' && de.props.state.skip.join() === 'loading'
  && !de.elements);

ok('a token path is the same words in any separator or case, letters and digits apart',
  tokenWords('Color/Background/AI/hue-1').join() === tokenWords(['color', 'background', 'ai', 'hue1']).join()
  && tokenWords('Color/Background/Neutral/primary-translucent').join() === tokenWords(['color', 'background', 'neutral', 'primaryTranslucent']).join());

ok('a CSS shadow and a Figma effect drawing the same thing have one key; inset is part of it',
  shadowKey(cssShadows('0px 2px 4px 0px rgba(0, 0, 0, 0.1), 0px 2px 4px 0px rgba(255, 255, 255, 0.2) inset'))
    === shadowKey([{ x: 0, y: 2, blur: 4, spread: 0, color: 'rgb(0 0 0 / 0.1)' }, { inset: true, x: 0, y: 2, blur: 4, spread: 0, color: 'rgba(255,255,255,0.2)' }]));

const tg = compareTokens(
  [{ group: 'colour', name: 'a', words: ['a'], value: '#ffffff' }, { group: 'colour', name: 'b', words: ['b'], value: '#c40d22' }, { group: 'colour', name: 'c', words: ['c'], value: '#000000' },
   { group: 'type', name: 'Label/Emphasis/md', sorted: true, words: ['label', 'emphasis', 'md'], value: { fontSize: 16, fontWeight: 600 } }],
  [{ group: 'colour', name: 'a', words: ['a'], value: '#FFFFFF' }, { group: 'colour', name: 'b', words: ['b'], value: '#000000' }, { group: 'colour', name: 'z', words: ['z'], value: '#123456' },
   { group: 'type', name: 'labelMdEmphasis', sorted: true, words: ['label', 'md', 'emphasis'], value: { fontSize: 16, fontWeight: 600 } }]);
ok('tokens matched by their words: the same value is the same in any case, another value differs, one side alone is missing or only in code; a type style\'s words in any order',
  tg.colour.same === 1 && tg.colour.differs === 1 && tg.colour.missing === 1 && tg.colour.onlyInCode === 1 && tg.type.same === 1);

ok('an OKLab colour, as Chrome computes a colour-mix, reads as its sRGB value',
  (() => { const c = rgba('oklab(0.165029 0.0000075144 0.00000330796 / 0.11037)'); return c[0] === c[1] && c[0] === 14 && c[3] === 0.11; })()
  && JSON.stringify(rgba('oklab(1 0 0)')) === '[255,255,255,1]');

ok('MUI values named by a type alias are read; children and HTML attributes are inherited, not missing from MUI',
  frameworkProps("export type AlertColor = 'success' | 'info' | 'warning' | 'error';\nexport interface AlertProps {\n  severity?: OverridableStringUnion<AlertColor, AlertPropsColorOverrides> | undefined;\n}", FW).severity.values.join() === 'success,info,warning,error'
  && compareProps({ props: { t: { type: 'string', figma: 'Title text' } } }, { props: { t: { arg: 'title', fixed: 'T' } } }, { title: {} }, {}, FW).find((r) => r.prop === 't').framework.inherited === true);

const apiX = { error: { type: 'boolean' }, helperText: { type: 'ReactNode' }, label: { type: 'ReactNode' }, initials: { type: 'string' }, startIcon: { type: 'ReactNode' }, variant: { values: ['contained', 'text'] }, size: { values: ['small', 'large'] } };
ok('props join by rule: the same words, the same less "text", the words libraries use, an enum the code accepts; a text prop never joins a flag',
  joinProp('Error text', { type: 'string' }, apiX, FW) === 'helperText' && joinProp('Label text', { type: 'string' }, apiX, FW) === 'label'
  && joinProp('Initial text', { type: 'string' }, apiX, FW) === 'initials' && joinProp('Left icon', { type: 'boolean' }, apiX, FW) === 'startIcon'
  && joinProp('Size', { type: 'enum', values: ['small', 'large'] }, apiX, FW) === 'size' && joinProp('Counter', { type: 'boolean' }, apiX, FW) === null);

const R = (element, field, verdict) => ({ element, field, verdict });
ok('a mapping is suspect when a selector matches nothing or nothing visible, or an element differs on every field everywhere; one real difference is not',
  suspectMappings([], { box: { total: 3, missing: 3, invisible: 0 } })[0].includes('matches nothing in any')
  && suspectMappings([], { box: { total: 3, missing: 0, invisible: 3 } })[0].includes('no size')
  // the checkbox's touch area, as measured: radius and padding never match, the border sometimes does (none on either side)
  && suspectMappings([R('box', 'radius', 'differs'), R('box', 'padding-top', 'differs'), R('box', 'border-width', 'same'), R('box', 'radius', 'differs'), R('box', 'padding-top', 'differs'), R('box', 'border-width', 'differs')], { box: { total: 2, missing: 0, invisible: 0 } })[0].includes('likely the wrong element')
  && suspectMappings([R('box', 'radius', 'differs'), R('box', 'padding-top', 'same'), R('box', 'border-width', 'same')], { box: { total: 1, missing: 0, invisible: 0 } }).length === 0
  && suspectMappings([R('box', 'border-width', 'differs'), R('box', 'radius', 'same')], { box: { total: 1, missing: 0, invisible: 0 } }).length === 0
  && suspectMappings([R('box', 'border-width', 'differs')], { box: { total: 1, missing: 0, invisible: 0 } }).length === 0);

ok('small numbers compare precisely: a line height of 1.15 is not 1.6, an opacity of 0.04 is not 0.4; lengths keep half a pixel',
  judge(1.15, 1.6) === 'differs' && judge(1.6, 2.05) === 'differs' && judge(2.05, 1.6) === 'differs' && judge(2.4, 2) === 'differs' && judge(0.04, 0.4) === 'differs' && judge(-0.01, 0.4) === 'differs' && judge(1.15, 1.152) === 'same' && judge(18.4, 18) === 'same');
ok('a colour Chrome reports as color(srgb …) is read, and one that cannot be read is a difference, never "same on screen"',
  JSON.stringify(rgba('color(srgb 0.9 0.1 0.1)')) === '[230,26,26,1]' && judge({ color: 'rgb(255 255 255 / 0.03)' }, 'nonsense(1 2 3)') === 'differs');

// a library's props type built on MUI's, as Project B's Button and Checkbox are, read from files in memory
const files = {
  '/lib/Button.types': `import type { ButtonProps as MuiButtonProps } from '@mui/material/Button';
import type { Tone } from './tone';
export interface Labels { clearText: string; }
export type ButtonProps<R extends ElementType = 'button'> = Omit<MuiButtonProps<R>, 'color' | 'disableRipple'> & {
  /** own */
  tone?: Tone;
  labels?: Labels;
};`,
  '/lib/tone': `export type Tone = 'brand' | 'danger';`,
  '/node_modules/@mui/material/Button/Button': `export interface ButtonOwnProps { size?: OverridableStringUnion<'small' | 'large', ButtonPropsSizeOverrides>; color?: string; disableRipple?: boolean; }
export type ButtonTypeMap<A = {}, R extends React.ElementType = 'button'> = ExtendButtonBaseTypeMap<{
  props: A & ButtonOwnProps;
  defaultComponent: R;
}>;
export interface ExtendButtonBaseTypeMap<T> {
  props: T['props'] & ButtonBaseOwnProps;
}
export interface ButtonBaseOwnProps { disabled?: boolean; }
export interface ButtonSlotsAndSlotProps { root: string; }
export type ButtonProps<R extends React.ElementType = ButtonTypeMap['defaultComponent'], A = {}> = OverrideProps<ButtonTypeMap<A, R>, R> & ButtonSlotsAndSlotProps & { href?: string; };`,
};
const api = readApi('/lib/Button.types', 'ButtonProps', (f) => files[f] ?? null, (spec) => ({ '@mui/material/Button': '/node_modules/@mui/material/Button/Button' }[spec]), FW);
ok("a component's API is its props type: its own fields, what it is built from through imports and MUI's type maps, less what it omits; never a nested type's fields or a slot's",
  JSON.stringify(api.tone) === '{"values":["brand","danger"],"from":"own"}' && api.labels && !('clearText' in api)
  && JSON.stringify(api.size.values) === '["small","large"]' && api.size.from === 'framework' && api.disabled.type === 'boolean' && api.href
  && !('color' in api) && !('disableRipple' in api) && !('root' in api));

ok('a mapped element is followed when a swap renames its instance; an ambiguous or shallow one is not guessed',
  elementIn({ 'iconContainer/circleX/icon': {} }, 'iconContainer/circleAlert/icon') === 'iconContainer/circleX/icon'
  && elementIn({ 'iconContainer/a/icon': {}, 'iconContainer/b/icon': {} }, 'iconContainer/circleAlert/icon') === null
  && elementIn({ label2: {} }, 'label') === null && elementIn({ label: {} }, 'label') === 'label'
  // Button: the left icon off and loading on is not the left icon
  && elementIn({ 'main/content/iconContainer/loaderCircle/icon': {} }, 'main/content/leftIconIconContainer/icon/icon') === null);

const nested = {
  '/lib/Dialog': `import type { ModalProps, StandardProps } from '../m/Modal';
export type DialogProps = Omit<StandardProps<ModalProps, 'children'>, 'open'> & { tone?: string };`,
  '/m/Modal': `export interface ModalProps { keepMounted?: boolean; open: boolean; children?: string; }
export type StandardProps<C, R extends keyof C = never> = DistributiveOmit<C, 'classes' | R> & { className?: string; style?: object };`,
};
const dialog = readApi('/lib/Dialog', 'DialogProps', (f) => nested[f] ?? null, () => null, FW);
ok('wrappers nest: the type inside Omit<StandardProps<…>> is read, less what each takes away, with what StandardProps adds',
  dialog.keepMounted && dialog.tone && dialog.className && !('open' in dialog) && !('children' in dialog));

const P = (value, important = false) => ({ cssProperties: [{ name: 'border-top-width', value, important }] });
ok("a border's width as the cascade chose it: the last rule Chrome lists, an !important over any later one, a non-length none",
  winning([P('1px'), P('1.5px')], 'border-top-width') === 1.5 && winning([P('1.5px', true), P('1px')], 'border-top-width') === 1.5
  && winning([P('1.5px !important'), P('1px')], 'border-top-width') === 1.5 && winning([P('0.1rem')], 'border-top-width') === null);

const D = (name, value) => ({ cssProperties: [{ name, value }] });
ok('the custom properties a value was written with, followed through the element and what it inherits, outermost first',
  varChain([[D('background-color', 'var(--button-bg)'), D('--button-bg', 'var(--color-primary, red)')], [D('--color-primary', '#00f')]], 'background-color').join() === '--button-bg,--color-primary'
  && varChain([[D('background-color', '#00f')]], 'background-color').length === 0
  && varChain([[D('color', 'var(--a)'), D('--a', 'var(--a)')]], 'color').join() === '--a');

ok('a border drawn in a colour that shows as the fill under it is not seen; one that shows is',
  invisibleBorder({ 'border-color': 'rgba(22, 22, 22, 0.43)', background: 'rgba(0, 0, 0, 0.914)', under: 'rgb(255, 255, 255)' })
  && !invisibleBorder({ 'border-color': 'rgba(22, 22, 22, 0.43)', background: 'rgb(238, 238, 238)', under: 'rgb(255, 255, 255)' })
  && !invisibleBorder({ 'border-color': 'rgba(22, 22, 22, 0.43)', background: 'rgba(0, 0, 0, 0)' }));

const pairC = { props: { value: { type: 'boolean', default: false, figma: 'Value', shows: ['field/value'] }, valueText: { type: 'string', figma: 'Value text', sets: ['field/value/text'] },
  prefix: { type: 'boolean', default: false, figma: 'Prefix', shows: ['field/prefix'] }, prefixText: { type: 'string', figma: 'Prefix text', sets: ['field/prefix'] } } };
const pairRows = compareProps(pairC, { props: { value: 'value', valueText: 'value', prefix: 'startAdornment', prefixText: 'startAdornment' } }, { value: {}, startAdornment: {} });
ok('a boolean that shows what a text prop fills, joined to one code prop, is one row: judged by the name the code shares',
  pairRows.length === 2 && pairRows[0].figma === 'Value + Value text' && !pairRows[0].findings.some((f) => f.kind === 'renamed')
  && pairRows[1].figma === 'Prefix + Prefix text' && pairRows[1].findings.some((f) => f.kind === 'renamed'));

// a prop the map holds fixed, whose other value the story draws beside it (Avatar's initials next to its photo), is varied
{
  const av = { props: { content: { type: 'enum', values: ['photo', 'initials'], default: 'photo' }, logo: { type: 'boolean', default: false } } };
  const held = combinations(av, { props: { content: { code: 'src', fixed: 'photo' }, logo: 'logo' } });
  const drawn = combinations(av, { props: { content: { code: 'src', fixed: 'photo', drawn: ['initials'] }, logo: 'logo' } });
  ok('a fixed prop stays one value; with values the story draws beside it, each is a combination of its own',
    held.length === 2 && held.every((w) => w.content === 'photo') && drawn.length === 4 && drawn.filter((w) => w.content === 'initials').length === 2);
}

// a library's own component is found by its own name, any case, its page path and 🚧 marker left out (20 Project B components were missed)
ok('a component name and its story title meet as one key, whatever their case, spaces or marks',
  storyKey('App header') === storyKey('AppHeader') && storyKey('Table - Toolbar') === storyKey('TableToolbar') && componentKey('Accordion/🚧 Accordion') === storyKey('Accordion'));
ok('a component name keeps every word but its folder: a set whose name holds " / " is not its last segment',
  componentKey('Stepper - Step item / Vertical') === storyKey('StepperStepItemVertical') && componentKey('Stepper/Stepper - Step item / Vertical') === componentKey('Stepper - Step item / Vertical'));

// four corners that differ are compared as four (a split button's halves, 12 4 4 12); four that agree as one
{
  const v = (t) => ({ 'Corner radius/12': 12, 'Corner radius/4': 4 })[t] ?? t;
  const four = expected({ radius: ['Corner radius/12', 'Corner radius/4', 'Corner radius/4', 'Corner radius/12'] }, ['radius'], v, () => null).radius;
  const one = expected({ radius: ['Corner radius/4', 'Corner radius/4', 'Corner radius/4', 'Corner radius/4'] }, ['radius'], v, () => null).radius;
  ok('per-corner radii are compared corner by corner, clockwise from top left',
    JSON.stringify(four.want) === '[12,4,4,12]' && judge(four.want, [12, 4, 4, 12]) === 'same' && judge(four.want, [4, 12, 12, 4]) === 'differs' && judge(four.want, 12) === 'differs' && one.want === 4);
}

// a part of another component is left to that component's audit only where it has one; a private part stays this one's
{
  const at = { section: { kind: 'instance', component: 'Search input' }, 'section/field': { kind: 'container' }, label: { kind: 'instance', component: '_Label' }, 'label/text': { kind: 'text' } };
  ok("parts of an audited component's instance are its own audit's; parts of an unaudited one are compared here",
    insideAudited('section/field', at, new Set(['Search input'])) && !insideAudited('label/text', at, new Set(['Search input'])) && !insideAudited('section', at, new Set(['Search input'])));
}

// the one mapping format, keyed by Figma's names, read into the contract's ids through the component's bridge
{
  const b = {
    props: { role: { figma: 'Role', values: { primary: 'Primary', secondary: 'Secondary' } }, state: { figma: 'State', values: { rest: 'Rest', hover: 'Hover', loading: 'Loading' } }, label: { figma: 'Label' }, selected: { figma: 'Selected' } },
    ids: { '$root': ['root'], 'Main container': ['mainContainer'], 'Main container > Label': ['mainContainer/label'], Twice: ['a', 'b'] },
  };
  const entry = {
    storyId: 'button--playground',
    axes: { Role: { Primary: { variant: 'contained' }, Secondary: { variant: 'outlined' } }, State: { Hover: { pseudo: 'hover' }, Loading: { skip: 'the story cannot draw it' } }, Selected: { True: { checked: true } } },
    props: { Label: { arg: 'children', fixed: 'Label' } },
    state: { layer: 'Main container' },
    layers: { 'Main container > Label': { selector: '.x', fields: ['color'], why: 'w' } },
    page: { click: 'button' },
  };
  ok('a mapping in Figma\'s names reads into the contract\'s ids: an option\'s arg, a forced state, a skipped option, a ruled layer',
    JSON.stringify(contractEntry(entry, b)) === JSON.stringify({ story: 'button--playground', props: { label: { arg: 'children', fixed: 'Label' }, role: { arg: 'variant', values: { primary: 'contained', secondary: 'outlined' } }, state: { pseudo: { hover: 'hover' }, skip: ['loading'] }, selected: { arg: 'checked', values: { true: true } } }, pseudoOn: 'mainContainer', elements: { 'mainContainer/label': { selector: '.x', fields: ['color'], why: 'w' } }, open: { click: 'button' } }));
  const refused = (e) => { try { contractEntry(e, b); return null; } catch (x) { return x.message; } };
  ok('a prop, an option or a layer the design does not have is refused, never dropped', /prop the design does not have: Size/.test(refused({ storyId: 's', props: { Size: { arg: 'size' } } }))
    && /Role has no option Tertiary/.test(refused({ storyId: 's', axes: { Role: { Tertiary: { variant: 'text' } } } }))
    && /no layer of the design/.test(refused({ storyId: 's', layers: { Gone: { skip: 'x' } } })));
  ok('a layer that is several elements of the design is refused: no ruling lands on a guess', /several elements of the design \(a, b\)/.test(refused({ storyId: 's', layers: { Twice: { skip: 'x' } } })));
  {
    const read = contractEntry({ storyId: 's', axes: { Role: { Primary: {}, Secondary: { variant: 'outlined' } } } }, b);
    ok('an option that sets no arg leaves the arg unset, so the story draws its own default and never the design\'s word',
      !('variant' in argsFor({ role: 'primary' }, read).args) && argsFor({ role: 'secondary' }, read).args.variant === 'outlined');
    const row = compareProps({ component: 'X', props: { role: { type: 'enum', values: ['primary', 'secondary'], default: 'primary' } } }, read, { variant: { options: ['contained', 'outlined'], default: 'contained' } }).find((r) => r.prop === 'role');
    ok('…and the property check reads that option as the code\'s own default: nothing missing, nothing only in code, the defaults agree',
      row.code.values.join() === 'contained,outlined' && !row.findings.some((f) => ['missing', 'only-in-code', 'default'].includes(f.kind)));
    const unknown = compareProps({ component: 'X', props: { role: { type: 'enum', values: ['primary', 'secondary'], default: 'primary' } } }, read, { variant: { options: ['contained', 'outlined'] } }).find((r) => r.prop === 'role');
    ok('…and where the code states no default, nothing is said of that option: no "undefined", nothing missing',
      !unknown.findings.some((f) => /undefined/.test(f.detail) || f.kind === 'missing'));
  }
  ok('an axis whose options set different args is refused, since the contract keeps one arg a prop', /sets one arg/.test(refused({ storyId: 's', axes: { Role: { Primary: { variant: 'contained' }, Secondary: { kind: 'outlined' } } } })));
}

console.log(`${n}/${n} passed`);
