// node tools/contract-editor/test-props.mjs — the props the editor writes, checks and counts.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { plan } from '../component-contract/to-figma.mjs';
import * as L from '../component-contract/layers.mjs';
import { blocks, libraryBlocks, toContract, fromContract, problems, scope, move, camel, kebab, draft, applyKind, kindOf, contractProblems, interactionStates, suggest } from './props.mjs';

let n = 0;
const ok = (name, fn) => { fn(); n++; console.log('ok  ' + name); };

ok('names are spelled as derive.cjs spells a stored spec: the one module both import', () => {
  assert.ok(camel === L.camel && kebab === L.kebab);
  assert.ok(!/^const (camel|kebab) = /m.test(fs.readFileSync(new URL('../component-contract/derive.cjs', import.meta.url), 'utf8')), 'derive.cjs keeps no copy of its own');
  assert.deepEqual(['Leading icon', 'Show  icon', ' Extra large ', '2xl', ''].map(camel), ['leadingIcon', 'showIcon', 'extraLarge', '2xl', 'layer']);
  const mine = toContract('Chip', [draft({ name: 'Leading icon', type: 'boolean' }), draft({ name: 'Size', type: 'enum', values: ['Extra large', 'Small'], default: 'Small' })]);
  assert.deepEqual(Object.keys(mine.props), ['leadingIcon', 'size']);
  assert.deepEqual(mine.props.size.values, ['extra-large', 'small']);
});

ok('a contract round-trips through the editor: order, defaults, axis and side all kept', () => {
  const drafts = [
    draft({ name: 'Size', type: 'enum', values: ['lg', 'md'], default: 'md' }),
    draft({ name: 'Disabled', type: 'boolean', default: false, axis: true }),
    draft({ name: 'Loading', type: 'boolean', default: false, only: 'code' }),
    draft({ name: 'State', type: 'enum', values: ['Rest', 'Hover'], default: 'Rest', only: 'figma', role: 'interaction', pointer: ['Hover', 'Press'] }),
    draft({ name: 'Label', type: 'string', default: 'Label' })];
  const c = toContract(' Button ', drafts);
  assert.equal(c.component, 'Button');
  assert.equal(c.props.loading.figma, undefined, 'a code-only prop has no Figma name');
  assert.equal(c.props.loading.only, 'code');
  assert.equal(c.props.state.only, 'figma');
  assert.deepEqual(c.props.state.pointer, ['hover'], 'a pointer state the axis does not list is dropped');
  assert.equal(c.props.disabled.axis, true);
  assert.deepEqual(c.props.state.figmaValues, ['Rest', 'Hover'], 'Figma keeps its spelling of the options');
  assert.deepEqual(c.props.size.figmaValues, ['lg', 'md'], 'kept in kebab case too: the house\'s sentence case would draw them Lg and Md');
  const again = fromContract(JSON.parse(JSON.stringify(c))).drafts;
  assert.deepEqual(again[3].values, ['Rest', 'Hover']);
  assert.equal(again[3].default, 'Rest');
  assert.deepEqual(toContract('Button', again), c);
  assert.notEqual(draft({ uid: 'p1' }).uid, 'p1', 'a draft always gets its own uid');
});

ok('every problem names its prop and field; a sound contract has none', () => {
  const good = [draft({ name: 'Size', type: 'enum', values: ['lg', 'md'], default: 'md' })];
  assert.deepEqual(problems('Button', good), []);
  const bad = [
    draft({ name: '', type: 'string' }),
    draft({ name: 'Size', type: 'enum', values: ['lg'], default: 'xl' }),
    draft({ name: 'size', type: 'enum', values: ['a', 'A'], default: 'a' })];
  const p = problems('', bad);
  assert.ok(p.some((x) => x.field === 'component'));
  assert.ok(p.some((x) => x.uid === bad[0].uid && x.field === 'name'));
  assert.ok(p.some((x) => x.uid === bad[1].uid && x.field === 'values'));
  assert.ok(!p.some((x) => x.uid === bad[1].uid && x.field === 'default'), 'one option is the problem; a default is not asked for until there are two to choose from');
  const off = draft({ name: 'Tone', type: 'enum', values: ['lg', 'md'], default: 'xl' });
  assert.ok(problems('X', [off]).some((x) => x.field === 'default'), 'with two options, a default that is neither is');
  assert.ok(p.some((x) => x.uid === bad[2].uid && /one prop in code/.test(x.message)), 'two names one key');
  assert.ok(p.some((x) => x.uid === bad[2].uid && /twice/.test(x.message)), 'two values one kebab');
});

ok('scope counts what Figma draws and code takes', () => {
  const s = scope([
    draft({ name: 'Size', type: 'enum', values: ['lg', 'md', 'sm'] }),
    draft({ name: 'State', type: 'enum', values: ['Rest', 'Hover', 'Focus', 'Press'], only: 'figma' }),
    draft({ name: 'Disabled', type: 'boolean', axis: true }),
    draft({ name: 'Show icon', type: 'boolean' }),
    draft({ name: 'Loading', type: 'boolean', only: 'code' }),
    draft({ name: 'Tone', type: 'enum', values: ['a', 'b'], only: 'code' })]);
  assert.equal(s.variants, 3 * 4 * 2, 'a code-only enum draws nothing');
  assert.equal(s.figmaProps, 1);
  assert.equal(s.codeProps, 5);
  assert.deepEqual(s.figmaOnly, ['State']);
  assert.deepEqual(s.codeOnly, ['Loading', 'Tone']);
  assert.equal(scope([]).variants, 1, 'no axes: one component, no set');
});

ok('one move function: up, down, to the ends, and out of range is a no-op', () => {
  const l = ['a', 'b', 'c', 'd'];
  assert.deepEqual(move(l, 2, 1), ['a', 'c', 'b', 'd']);
  assert.deepEqual(move(l, 0, 3), ['b', 'c', 'd', 'a']);
  assert.deepEqual(move(l, 3, -5), ['d', 'a', 'b', 'c']);
  assert.deepEqual(move(l, 9, 0), l);
  assert.deepEqual(l, ['a', 'b', 'c', 'd'], 'the input is not changed');
});

ok('seven kinds, each starting unnamed; a number and an event are code only; interaction states come from the settings', () => {
  assert.deepEqual(blocks().map((x) => [x.id, x.side]), [['enum', 'both'], ['boolean', 'both'], ['string', 'both'], ['number', 'code'], ['event', 'code'], ['instance', 'both'], ['slot', 'both'], ['state', 'figma']]);
  const st0 = blocks({ settings: { stateAxis: 'Interaction', pointerStates: ['Hover'] }, optionOrder: { Interaction: ['Idle', 'Hover', 'Loading'] } }).find((b) => b.id === 'state').make();
  assert.deepEqual([st0.values, st0.default, st0.only, kindOf(st0)], [['Idle', 'Hover'], 'Idle', 'figma', 'state'], 'interaction states, Figma only, from the project\'s own states');
  for (const x of blocks()) {
    const d = x.make();
    assert.equal(d.name, '', `${x.id} starts with no name`);
    assert.deepEqual(problems('X', [d]).map((p) => p.field), ['name'], `${x.id}: a name is the first thing it lacks`);
    if (x.id === 'state') continue;
    if (x.id === 'enum') assert.deepEqual(problems('X', [{ ...d, name: 'Tone' }]).map((p) => p.field), ['values'], 'an Options prop then asks for its options, not a default');
  }
  const ev = toContract('X', [{ ...blocks().find((b) => b.id === 'event').make(), name: 'On change' }]).props.onChange;
  assert.deepEqual(ev, { type: 'event', only: 'code' }, 'an event has no Figma name and no default');
  const num = toContract('X', [{ ...blocks().find((b) => b.id === 'number').make(), name: 'Max length', default: '120' }]).props.maxLength;
  assert.equal(num.default, 120);
  assert.equal(num.only, 'code');
  const st = interactionStates({ settings: { stateAxis: 'Interaction', pointerStates: ['Hover'] }, optionOrder: { Interaction: ['Idle', 'Hover', 'Loading'] } });
  assert.deepEqual(st, { pointer: ['Hover'], states: ['Idle', 'Hover'] }, 'Loading is a code prop, not a state');
  const busy = interactionStates({ settings: { pointerStates: ['Hover'] }, optionOrder: { State: ['Rest', 'Hover', 'Busy'] } });
  assert.deepEqual(busy.states, ['Rest', 'Hover'], 'so is any state the product sets, by whatever name the library gives it');
  assert.notEqual(blocks()[0].make().uid, blocks()[0].make().uid, 'each made block is its own prop');
});

ok('library blocks: a name two contracts share, in its commonest form, in alphabetical order', () => {
  const lib = libraryBlocks([
    { component: 'A', props: { size: { type: 'enum', values: ['md', 'sm'], default: 'md', figma: 'Size' }, label: { type: 'string', figma: 'Label' } } },
    { component: 'B', props: { size: { type: 'enum', values: ['md', 'sm'], default: 'md', figma: 'Size' }, label: { type: 'string', figma: 'Label' } } },
    { component: 'C', props: { size: { type: 'enum', values: ['lg', 'md'], default: 'md', figma: 'Size' }, once: { type: 'boolean', figma: 'Once' } } }]);
  assert.deepEqual(lib.map((x) => x.label), ['Label', 'Size'], 'Once is one component\'s own');
  assert.equal(lib[1].hint, '3 components');
  assert.deepEqual(lib[1].make().values, ['md', 'sm']);
  assert.deepEqual(problems('X', [lib[1].make()]), []);
});

ok('a derived contract opened and written back loses nothing the editor does not own', () => {
  const derived = { contract: 1, component: 'Button', figma: { name: 'Button', key: 'k', id: '1:2' },
    props: { label: { type: 'string', figma: 'Label', sets: ['content/label'] }, showIcon: { type: 'boolean', default: false, figma: 'Show icon', shows: ['content/icon'] },
      disabled: { type: 'boolean', default: false, figma: 'Disabled' }, size: { type: 'enum', values: ['lg', 'md'], default: 'lg', figma: 'Size' } },
    anatomy: { root: { kind: 'container' } }, variants: [{ when: { size: 'md' }, set: { 'root.gap': 'Spacing/4' } }], invalid: [{ size: 'md', disabled: true }] };
  const r = fromContract(derived);
  const out = toContract(r.component, r.drafts, r.base);
  for (const k of ['figma', 'anatomy', 'variants', 'invalid']) assert.deepEqual(out[k], derived[k], k);
  assert.deepEqual(out.props.label.sets, ['content/label']);
  assert.deepEqual(out.props.showIcon.shows, ['content/icon']);
  assert.equal(r.drafts.find((d) => d.name === 'Disabled').axis, true, 'a boolean the left-out combinations name is a variant');
  assert.equal(r.drafts.find((d) => d.name === 'Show icon').axis, false, 'one they do not is a property');
  const fewer = toContract(r.component, r.drafts.filter((d) => d.name !== 'Disabled'), r.base);
  assert.deepEqual(fewer.invalid, [], 'a combination naming a removed prop goes');
  assert.deepEqual(fewer.variants, derived.variants, 'a layer naming only props still here stays');
});

ok('a code-only prop writes no axis, and only an enum carries a role', () => {
  const c = toContract('X', [draft({ name: 'Busy', type: 'boolean', axis: true, only: 'code' }), draft({ name: 'State', type: 'boolean', role: 'interaction', pointer: ['hover'] })]);
  assert.equal(c.props.busy.axis, undefined);
  assert.equal(c.props.state.role, undefined);
});

ok('the Kind menu: a plain kind keeps what fits; a code-only kind is code only, and leaving one is both sides again', () => {
  const all = blocks();
  const by = (id) => all.find((b) => b.id === id);
  const named = { ...by('enum').make(), name: 'Tone', values: ['a', 'b'], default: 'a', role: 'interaction', only: 'figma' };
  const asBool = applyKind(named, by('boolean'));
  assert.equal(asBool.type, 'boolean');
  assert.equal(asBool.role, undefined, 'interaction states are an enum\'s, gone with it');
  assert.equal(asBool.uid, named.uid, 'the same prop, not a new one');
  const asEvent = applyKind({ ...named, only: 'both' }, by('event'));
  assert.equal(asEvent.only, 'code');
  assert.equal(applyKind(asEvent, by('string')).only, 'both');
  const lib = libraryBlocks([{ component: 'A', props: { disabled: { type: 'boolean', figma: 'Disabled', axis: true } } }, { component: 'B', props: { disabled: { type: 'boolean', figma: 'Disabled', axis: true } } }])[0];
  const fromLib = applyKind(by('boolean').make(), lib);
  assert.equal(fromLib.name, 'Disabled', 'a library prop names an unnamed one');
  assert.equal(fromLib.axis, true);
  const st = applyKind({ ...named, role: undefined, only: 'both' }, by('state'));
  assert.deepEqual([st.role, st.only, st.name], ['interaction', 'figma', 'Tone'], 'Interaction states bring their form and keep the name');
});

ok('a contract edited by hand is checked before it is read, each problem saying where', () => {
  const good = toContract('Button', [draft({ name: 'Size', type: 'enum', values: ['lg', 'md'], default: 'md' }), draft({ name: 'Label', type: 'string' })]);
  assert.deepEqual(contractProblems(good), []);
  const bad = { props: { size: { type: 'enum', values: ['lg'], figma: 'Size' }, tone: { type: 'colour' }, label: { type: 'string', figma: 'Title' }, on: { type: 'boolean', default: 'yes' } },
    anatomy: { root: { kind: 'container' }, a: { kind: 'box', parent: 'root' }, b: { kind: 'text', parent: 'nowhere', content: '{missing}' }, c: { kind: 'container', parent: 'd' }, d: { kind: 'container', parent: 'c' } } };
  const where = contractProblems(bad).map((p) => p.where);
  for (const w of ['props.size.values', 'props.tone.type', 'props.label', 'props.on.default', 'anatomy.a.kind', 'anatomy.b.parent', 'anatomy.b.content', 'anatomy.c.parent']) assert.ok(where.includes(w), w);
  assert.deepEqual(contractProblems([]).map((p) => p.where), ['']);
});

ok('a suggestion is a prop most of the library\'s components with one of these also have', () => {
  const c = (component, ...names) => ({ component, props: Object.fromEntries(names.map((x) => [camel(x), { type: 'string', figma: x }])) });
  const lib = [c('A', 'Has value', 'Value', 'Label'), c('B', 'Has value', 'Value'), c('C', 'Has value', 'Label'), c('D', 'Label', 'Icon'), c('E', 'Icon')];
  assert.deepEqual(suggest(lib, ['Has value']), [{ name: 'Value', because: 'Has value', n: 2, of: 3 }, { name: 'Label', because: 'Has value', n: 2, of: 3 }]);
  assert.deepEqual(suggest(lib, ['Has value', 'Value']).map((x) => x.name), ['Label'], 'a prop on the page is never suggested');
  assert.deepEqual(suggest(lib, ['Icon']), [], 'one component in common is chance, not a pattern');
  assert.deepEqual(suggest(lib, []), [], 'nothing on the page, nothing to go on');
});

ok('a contract written here is one to-figma.mjs can plan a drawing of: Push to Figma\'s input', () => {
  const size = draft({ name: 'Size', type: 'enum', values: ['Large', 'Small'], default: 'Large' });
  const show = draft({ name: 'Show icon', type: 'boolean', default: false });
  const label = draft({ name: 'Label', type: 'string', default: 'Tag' });
  const p = plan(toContract('Fresh tag', [size, show, label]));
  assert.equal(p.name, 'Fresh tag');
  assert.deepEqual([p.axes, p.booleans.map((b) => b.figma), p.text, p.variants.length], [['Size'], ['Show icon'], [{ figma: 'Label', default: 'Tag' }], 2]);
  const two = draft({ name: 'State', type: 'enum', values: ['Rest', 'Focus'], default: 'Rest' });
  const withInvalid = { ...toContract('Fresh tag', [size, two]), invalid: [{ size: 'small', state: 'focus' }] };
  assert.equal(plan(withInvalid).variants.length, 3, 'a combination the contract says is not drawn is not drawn');
});

ok('a renamed prop carries its variants, invalid combinations and conditions; a removed one takes them with it', () => {
  const c = { contract: 1, component: 'B', props: { size: { type: 'enum', values: ['lg', 'sm'], default: 'lg', figma: 'Size' }, state: { type: 'enum', values: ['rest', 'focus'], default: 'rest', figma: 'State' } },
    anatomy: {}, variants: [{ when: { size: 'sm' }, set: { 'root.radius': 'R/4' } }], invalid: [{ size: 'sm', state: 'focus' }], when: { ring: { size: ['lg'], state: ['focus'] } } };
  const r = fromContract(c);
  const renamed = r.drafts.map((d) => (d.name === 'Size' ? { ...d, name: 'Scale' } : d));
  const out = toContract('B', renamed, r.base);
  assert.deepEqual([out.variants[0].when, out.invalid[0], out.when.ring], [{ scale: 'sm' }, { scale: 'sm', state: 'focus' }, { scale: ['lg'], state: ['focus'] }]);
  const gone = toContract('B', r.drafts.filter((d) => d.name !== 'Size'), r.base);
  assert.deepEqual([gone.variants.length, gone.invalid.length, gone.when.ring], [0, 0, { state: ['focus'] }]);
});

ok('a malformed variant is refused, said where it is, before it can break the page', () => {
  const base = { contract: 1, component: 'X', props: { size: { type: 'enum', values: ['a', 'b'], default: 'a', figma: 'Size' } }, anatomy: {} };
  const where = (variants) => contractProblems({ ...base, variants }).map((p) => p.where);
  assert.deepEqual(where([{ add: { x: { kind: 'graphic' } } }]), ['variants[0].when']);
  assert.deepEqual(where([{ when: { size: 'b' }, add: { x: null } }]), ['variants[0].add.x']);
  assert.deepEqual(where([null]), ['variants[0]']);
  assert.deepEqual([where([{ when: { size: 'b' }, add: { x: [] } }]), where([{ when: { size: 'b' }, add: { x: { order: 0 } } }])], [['variants[0].add.x'], ['variants[0].add.x']]);
  assert.deepEqual(where([{ when: { size: 'b' }, set: { 'root.radius': 'R' } }]), []);
});

console.log(`${n} passed`);
