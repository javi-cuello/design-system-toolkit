// node tools/contract-editor/test-variants.mjs — a combination's anatomy, and an edit written to its layer.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { expand, choosers, offDefault, layerFor, setField, unset, changed, removeAt, restoreAt, moveAt, keyDiff } from './variants.mjs';

let n = 0;
const ok = (name, cond) => { n++; assert.ok(cond, name); console.log('ok  ' + name); };
const { expand: derived } = createRequire(import.meta.url)('../component-contract/derive.cjs');

// a chip: a label, a check its Selected shows, a focus ring its Focus adds, and one combination listed whole
const chip = {
  contract: 1, component: 'Chip',
  props: { selected: { type: 'boolean', default: true, figma: 'Selected' }, state: { type: 'enum', values: ['rest', 'hover', 'focus'], figmaValues: ['Rest', 'Hover', 'Focus'], default: 'rest', figma: 'State' }, label: { type: 'string', default: 'Label' } },
  anatomy: { root: { kind: 'container', background: 'C/rest' }, check: { kind: 'graphic', parent: 'root', order: 0 }, label: { kind: 'text', parent: 'root', order: 1, color: 'T/inverse' } },
  variants: [
    { when: { state: 'hover' }, set: { 'root.background': 'C/hover' } },
    { when: { state: 'focus' }, add: { ring: { kind: 'graphic', parent: 'root', order: 2, border: { color: 'S/focus' } } } },
    { when: { selected: false }, remove: ['check'], set: { 'label.color': 'T/medium' } },
    { when: { selected: false, state: 'hover' }, set: { 'root.background': 'C/soft-hover' } },
  ],
};

ok('the defaults draw the anatomy as it is', JSON.stringify(expand(chip, {})) === JSON.stringify(chip.anatomy));
ok('a combination draws its layers in order: one prop\'s, then the pair\'s', expand(chip, { selected: false, state: 'hover' }).root.background === 'C/soft-hover' && !expand(chip, { selected: false, state: 'hover' }).check);
ok('a layer that adds a part draws it there only', !!expand(chip, { state: 'focus' }).ring && !expand(chip, {}).ring);
ok('the same as derive.cjs draws, combination by combination', ['rest', 'hover', 'focus'].every((s) => [true, false].every((sel) => JSON.stringify(expand(chip, { state: s, selected: sel })) === JSON.stringify(derived(chip, { state: s, selected: sel })))));
ok('every option and on/off is offered to view, in Figma\'s words, text props not', JSON.stringify(choosers(chip).map((c) => [c.key, c.labels])) === '[["selected",["Off","On"]],["state",["Rest","Hover","Focus"]]]');
ok('only the values off their defaults make a variant', JSON.stringify(offDefault(chip, { selected: true, state: 'hover' })) === '{"state":"hover"}' && layerFor(chip, { selected: true }) === null);
ok('an edit is written to the layer holding exactly those values', layerFor(chip, { state: 'hover' }) === chip.variants[0] && layerFor(chip, { state: 'hover', selected: false }) === chip.variants[3]);

// written where a layer holds it
let vs = setField(chip, { state: 'hover' }, 'root', 'radius', 'R/full');
ok('a field set in a variant joins its layer', vs[0].set['root.radius'] === 'R/full' && vs.length === 4 && !chip.variants[0].set['root.radius']);
// a combination with no layer gets one, after the layers of fewer props
vs = setField(chip, { state: 'focus', selected: false }, 'label', 'color', 'T/strong');
const made = vs.find((v) => v.when.state === 'focus' && v.when.selected === false);
ok('a combination with no layer of its own gets one, placed after the single props\' layers', !!made && made.set['label.color'] === 'T/strong' && vs.indexOf(made) > vs.indexOf(vs.find((v) => JSON.stringify(v.when) === '{"selected":false}')));
ok('and draws there', expand({ ...chip, variants: vs }, { state: 'focus', selected: false }).label.color === 'T/strong' && expand({ ...chip, variants: vs }, { selected: false }).label.color === 'T/medium');
// a value the layers under it already draw is taken out, and an empty layer goes
vs = setField(chip, { state: 'hover' }, 'root', 'background', 'C/rest');
ok('a value set back to what the layers under draw is taken out, an empty layer with it', !vs.some((v) => JSON.stringify(v.when) === '{"state":"hover"}'));
vs = setField({ ...chip, variants: setField(chip, { state: 'focus', selected: false }, 'label', 'color', 'T/strong') }, { state: 'focus', selected: false }, 'label', 'color', 'T/medium');
ok('the same for a layer made for one edit', !vs.some((v) => v.when.state === 'focus' && v.when.selected === false));
// a part a layer adds takes edits in that layer too
vs = setField(chip, { state: 'focus' }, 'ring', 'radius', 'R/full');
ok('a part only a variant adds takes its edits there', expand({ ...chip, variants: vs }, { state: 'focus' }).ring.radius === 'R/full');
// the contract passed in is never changed
ok('the contract passed in is left as it was', !chip.variants[1].set && chip.variants[0].set['root.background'] === 'C/hover');

ok('a field a variant changes is said changed, and its own layer\'s to reset', JSON.stringify(changed(chip, { state: 'hover' }, 'root', 'background')) === '{"own":true,"by":{"state":"hover"}}');
ok('one changed by a layer of fewer props is said changed, by that layer', JSON.stringify(changed(chip, { state: 'focus', selected: false }, 'label', 'color')) === '{"own":false,"by":{"selected":false}}');
vs = unset(chip, { state: 'hover', selected: false }, 'root', 'background');
ok('a field put back draws what the layers under it draw, the layer it emptied gone', expand({ ...chip, variants: vs }, { state: 'hover', selected: false }).root.background === 'C/hover' && vs.length === 3);
ok('one the variant leaves alone is not', changed(chip, { state: 'hover' }, 'label', 'color') === null);

// a contract that lists whole combinations writes to the combination's own
const combos = { ...chip, variants: [...chip.variants, { combination: true, when: { selected: true, state: 'focus' }, set: { 'label.color': 'T/x' } }] };
ok('a whole combination listed takes the edits made at it', setField(combos, { state: 'focus' }, 'root', 'radius', 'R/4').find((v) => v.combination).set['root.radius'] === 'R/4');

// a layer naming a prop at its default draws after the one exactly at these values: an edit made here goes to it, so it shows
const sel = { ...chip, variants: [{ when: { state: 'hover' }, set: { 'root.background': 'C/hover' } }, { when: { state: 'hover', selected: true }, set: { 'root.background': 'C/sel-hover' } }] };
vs = setField(sel, { state: 'hover' }, 'root', 'background', 'C/new');
ok('an edit goes to the layer that would draw over it at these values, so it shows', expand({ ...sel, variants: vs }, { state: 'hover' }).root.background === 'C/new' && changed({ ...sel, variants: vs }, { state: 'hover' }, 'root', 'background').own);
// an object put back as it was, its keys in another order, is no change
const laid = { ...chip, anatomy: { ...chip.anatomy, root: { ...chip.anatomy.root, layout: { direction: 'row', gap: 'S/2', align: 'center' } } }, variants: [] };
vs = setField(laid, { state: 'hover' }, 'root', 'layout', { direction: 'row', align: 'center', gap: 'S/2' });
ok('an object set back as it was, its keys in another order, is taken out', vs.length === 0);
// an option with no default: any value chosen is a variant
const bare = { ...chip, props: { ...chip.props, size: { type: 'enum', values: ['sm', 'lg'] } } };
ok('an option with no default is off it at any value chosen', JSON.stringify(offDefault(bare, { size: 'lg' })) === '{"size":"lg"}');

// a layer of fewer props drawn after the combination's own holds at other values too: an edit here never goes to it
const late = { ...chip, variants: [{ when: { selected: false, state: 'hover' }, set: { 'root.background': 'C/pair' } }, { when: { selected: false }, set: { 'root.background': 'C/one' } }] };
vs = setField(late, { selected: false, state: 'hover' }, 'root', 'background', 'C/new');
ok('an edit is never written to a layer of fewer props drawn after its own: it goes in a layer of its own after that one, so it shows', vs.find((v) => JSON.stringify(v.when) === '{"selected":false}').set['root.background'] === 'C/one' && expand({ ...late, variants: vs }, { selected: false }).root.background === 'C/one' && expand({ ...late, variants: vs }, { selected: false, state: 'hover' }).root.background === 'C/new');

// its other fields stay drawn as they were: where the layer passed sets one of them too, the edit goes in a layer of its own
const both = { ...chip, variants: [{ when: { selected: false, state: 'hover' }, set: { 'root.background': 'C/pair', 'label.color': 'T/pair' } }, { when: { selected: false }, set: { 'root.background': 'C/one', 'label.color': 'T/one' } }] };
vs = setField(both, { selected: false, state: 'hover' }, 'root', 'background', 'C/new');
const drawn = expand({ ...both, variants: vs }, { selected: false, state: 'hover' });
ok('an edit that must draw after a broader layer leaves the combination\'s other fields as they were', drawn.root.background === 'C/new' && drawn.label.color === 'T/one' && expand({ ...both, variants: vs }, { selected: false }).root.background === 'C/one');

// a layer it would pass that holds at other values both hold at counts too: there the move would change what wins
const three = { ...chip, props: { ...chip.props, size: { type: 'enum', values: ['sm', 'lg'], default: 'sm' } },
  variants: [{ when: { selected: false, state: 'hover' }, set: { 'root.background': 'C/pair', 'root.radius': 'R/pair' } }, { when: { state: 'hover', size: 'lg' }, set: { 'root.radius': 'R/lg' } }, { when: { state: 'hover' }, set: { 'root.background': 'C/one' } }] };
const before3 = expand(three, { selected: false, state: 'hover', size: 'lg' }).root.radius;
vs = setField(three, { selected: false, state: 'hover' }, 'root', 'background', 'C/new');
ok('an edit changes no field it was not made to, at any combination', expand({ ...three, variants: vs }, { selected: false, state: 'hover', size: 'lg' }).root.radius === before3 && expand({ ...three, variants: vs }, { selected: false, state: 'hover' }).root.background === 'C/new');

// a layer drawn after it that adds the part whole would draw over a value set before it: the edit goes where it shows
const readd = { ...chip, variants: [{ when: { selected: false, state: 'hover' }, set: { 'label.color': 'T/pair' } }, { when: { selected: false }, add: { label: { kind: 'text', parent: 'root', order: 1, color: 'T/added' } } }] };
vs = setField(readd, { selected: false, state: 'hover' }, 'label', 'color', 'T/new');
ok('an edit shows where a later layer adds its part whole, and nothing else changes', expand({ ...readd, variants: vs }, { selected: false, state: 'hover' }).label.color === 'T/new' && expand({ ...readd, variants: vs }, { selected: false }).label.color === 'T/added');
const reset = { ...readd, variants: [readd.variants[0], { ...readd.variants[1], set: { 'label.color': 'T/x' } }] };
vs = setField(reset, { selected: false }, 'label', 'color', 'T/added');
ok('a value set back to what the layer adds its part with is taken out, the part kept', JSON.stringify(vs) === JSON.stringify(readd.variants));
ok('and put back the same way', JSON.stringify(unset(reset, { selected: false }, 'label', 'color')) === JSON.stringify(readd.variants));

// a part deleted or moved at one variant: there alone, and put back or moved back to nothing
vs = removeAt(chip, { state: 'hover' }, 'label');
ok('a part deleted at a variant goes there alone, in its own layer', !expand({ ...chip, variants: vs }, { state: 'hover' }).label && !!expand({ ...chip, variants: vs }, {}).label && !!expand({ ...chip, variants: vs }, { state: 'focus' }).label
  && vs.find((v) => JSON.stringify(v.when) === '{"state":"hover"}' && v.remove).set['root.background'] === 'C/hover');
ok('put back, the layer is as it was', JSON.stringify(restoreAt({ ...chip, variants: vs }, { state: 'hover' }, 'label')) === JSON.stringify(chip.variants));
ok('a part another layer removes is not put back here', restoreAt(chip, { selected: false, state: 'hover' }, 'check') === null);
vs = removeAt(chip, { state: 'focus' }, 'ring');
ok('a part its own layer adds is no longer added, not added and removed', !expand({ ...chip, variants: vs }, { state: 'focus' }).ring && !vs.some((v) => (v.remove || []).includes('ring')));
vs = moveAt(chip, { state: 'hover' }, 'label', 0);
const sorted = (a) => Object.keys(a).filter((k) => a[k].parent === 'root').sort((x, y) => a[x].order - a[y].order);
ok('a part moved at a variant moves there alone', sorted(expand({ ...chip, variants: vs }, { state: 'hover' })).join() === 'label,check' && sorted(expand({ ...chip, variants: vs }, {})).join() === 'check,label');
ok('moved back, nothing is left behind', JSON.stringify(moveAt({ ...chip, variants: vs }, { state: 'hover' }, 'label', 1)) === JSON.stringify(chip.variants));
vs = removeAt(chip, {}, 'label');
ok('a part deleted at the defaults goes from the default combination alone, a whole combination drawn last', !expand({ ...chip, variants: vs }, {}).label && !!expand({ ...chip, variants: vs }, { state: 'hover' }).label && !!expand({ ...chip, variants: vs }, { selected: false }).label
  && vs[vs.length - 1].combination && JSON.stringify(vs[vs.length - 1].when) === JSON.stringify({ selected: true, state: 'rest' }));
ok('and put back there, the combination made for it gone', JSON.stringify(restoreAt({ ...chip, variants: vs }, {}, 'label')) === JSON.stringify(chip.variants));
const iconed = { ...chip, props: { ...chip.props, icon: { type: 'instance', default: 'Icon/Star' }, max: { type: 'number', default: null } } };
vs = removeAt(iconed, {}, 'label');
ok('deleted at the defaults of a component with instance and code-only props, it is gone there and put back', !expand({ ...iconed, variants: vs }, {}).label && JSON.stringify(restoreAt({ ...iconed, variants: vs }, {}, 'label')) === JSON.stringify(chip.variants));
const flagged = { ...chip, props: { ...chip.props, showIcon: { type: 'boolean', default: false, figma: 'Show icon' } } };
vs = removeAt(flagged, {}, 'label');
ok('deleted at the defaults, an on/off that is no variant is left out: gone with it on too', !expand({ ...flagged, variants: vs }, { showIcon: true }).label && !('showIcon' in vs[vs.length - 1].when));
const nested = { ...chip, variants: [{ when: { state: 'focus' }, add: { badge: { kind: 'container', parent: 'root', order: 3 } } }, { when: { state: 'focus', selected: false }, add: { 'badge/dot': { kind: 'graphic', parent: 'badge', order: 0 } } }] };
vs = removeAt(nested, { state: 'focus', selected: false }, 'badge');
ok('a part deleted where its layer adds only what is inside it is itself gone', !expand({ ...nested, variants: vs }, { state: 'focus', selected: false }).badge && !!expand({ ...nested, variants: vs }, { state: 'focus' }).badge);
const loose = { ...chip, props: { ...chip.props, state: { ...chip.props.state, default: undefined } } };
delete loose.props.state.default;
vs = removeAt(loose, {}, 'label');
ok('deleted at the defaults where an option has no default: gone there', !expand({ ...loose, variants: vs }, {}).label);
vs = removeAt(flagged, {}, 'label');
const later = [...vs, { when: { showIcon: true }, set: { 'root.background': 'C/icon' } }];
ok('a prop made a variant after a delete at the defaults: Put back still finds it', JSON.stringify(restoreAt({ ...flagged, variants: later }, {}, 'label')) === JSON.stringify(later.filter((v) => !v.combination)));
const inner = { ...chip, variants: [{ when: { state: 'focus' }, add: { 'label/dot': { kind: 'graphic', parent: 'label', order: 0 } } }] };
vs = removeAt(inner, { state: 'focus' }, 'label');
ok('deleted and put back at a variant, what that variant adds inside it comes back too', !expand({ ...inner, variants: vs }, { state: 'focus' }).label && !!expand({ ...inner, variants: restoreAt({ ...inner, variants: vs }, { state: 'focus' }, 'label') }, { state: 'focus' })['label/dot']);
ok('a move to nowhere is none', moveAt(chip, { state: 'hover' }, 'check', -1) === null && moveAt(chip, { state: 'hover' }, 'label', 1) === null);
const kd = keyDiff({ a: 1, b: { x: 1, y: 2 }, c: 3 }, { b: { y: 2, x: 1 }, c: 4, d: 5 });
ok('a change by key: added, removed, and changed by value whatever its keys\' order', JSON.stringify(kd) === '{"added":["d"],"removed":["a"],"changed":["c"]}');
ok('and nothing on either side is nothing changed', JSON.stringify(keyDiff(undefined, null)) === '{"added":[],"removed":[],"changed":[]}');

console.log(`\n${n} ok`);
