// node tools/contract-editor/test-anatomy.mjs — the parts the editor writes, their ids, and what the props do to them.
import assert from 'node:assert/strict';
import { part, root, tree, homes, ids, toAnatomy, partProblems, tokenLists, usedGroups, forField, preview, fromAnatomy, place, variantParts } from './anatomy.mjs';
import { draft, toContract } from './props.mjs';
import { createRequire } from 'node:module';

const { valueOf } = createRequire(import.meta.url)('../snapshot/tokens.cjs');

let n = 0;
const ok = (name, fn) => { fn(); n++; console.log('ok  ' + name); };

// a button: a content row holding an icon and a label
const r = root();
const content = part({ name: 'Content', kind: 'container', layout: { direction: 'row', gap: 'Spacing/8', padding: { top: 'Spacing/12', end: 'Spacing/12', bottom: 'Spacing/12', start: 'Spacing/12' } }, background: 'Colour/Action', radius: 'Corner radius/8' });
const icon = part({ name: 'Icon', kind: 'instance', parent: content.uid });
const label = part({ name: 'Label', kind: 'text', parent: content.uid, typography: 'Label/md' });
const parts = [r, content, icon, label];

ok('tree order: each part followed by what sits in it, at its depth', () => {
  assert.deepEqual(tree(parts).map(({ part: p, depth }) => `${depth}:${p.name}`), ['0:root', '1:Content', '2:Icon', '2:Label']);
});

ok('ids are the camel-case path below the root, a repeated name numbered from its second', () => {
  const twin = part({ name: 'Icon', kind: 'instance', parent: content.uid });
  const id = ids([...parts, twin]);
  assert.equal(id[content.uid], 'content');
  assert.equal(id[label.uid], 'content/label');
  assert.equal(id[icon.uid], 'content/icon');
  assert.equal(id[twin.uid], 'content/icon_2');
  assert.equal(ids([r, content, label])[label.uid], 'content/label', 'adding a part elsewhere renames nothing');
});

ok('a part may sit in any container but itself and what sits inside it', () => {
  assert.deepEqual(homes(parts, content.uid).map((p) => p.uid), ['root']);
  assert.deepEqual(homes(parts, label.uid).map((p) => p.uid), ['root', content.uid]);
});

ok('the anatomy is written in the derived contract\'s shape, and the props\' links follow their names', () => {
  const text = draft({ name: 'Label text', type: 'string' });
  const show = draft({ name: 'Show icon', type: 'boolean' });
  const swap = draft({ name: 'Icon', type: 'instance' });
  const linked = [r, content, { ...icon, shownBy: show.uid, swapProp: swap.uid }, { ...label, textProp: text.uid, color: 'Colour/Text' }];
  const { anatomy, links } = toAnatomy(linked, [text, show, swap]);
  assert.deepEqual(anatomy.content.layout, { direction: 'row', gap: 'Spacing/8', padding: { top: 'Spacing/12', end: 'Spacing/12', bottom: 'Spacing/12', start: 'Spacing/12' } });
  assert.equal(anatomy.content.parent, 'root');
  assert.equal(anatomy['content/label'].content, '{labelText}');
  assert.deepEqual([anatomy['content/icon'].order, anatomy['content/label'].order], [0, 1], 'order is the place among siblings');
  assert.deepEqual(links, { showIcon: { shows: ['content/icon'] }, icon: { swaps: ['content/icon'] }, labelText: { sets: ['content/label'] } });
  const renamed = toAnatomy(linked, [{ ...text, name: 'Title' }, show, swap]);
  assert.equal(renamed.anatomy['content/label'].content, '{title}', 'a link follows its prop through a rename');
  assert.ok(!('content' in toAnatomy(linked, [show, swap]).anatomy['content/label']), 'a removed prop leaves no dangling reference');
});

ok('toContract carries the anatomy and writes each prop\'s links', () => {
  const text = draft({ name: 'Label', type: 'string' });
  const c = toContract('Button', [text], {}, [r, { ...label, parent: 'root', textProp: text.uid }]);
  assert.equal(c.anatomy.label.content, '{label}');
  assert.deepEqual(c.props.label.sets, ['label']);
  assert.deepEqual(toContract('Button', [text]).anatomy, {}, 'no parts, no anatomy');
});

ok('every problem names its part and field', () => {
  const p = partProblems([r, part({ name: '', kind: 'container' }), part({ name: 'Label', kind: 'text' })]);
  assert.deepEqual(p.map((x) => x.field), ['name', 'content']);
  assert.deepEqual(partProblems([r, { ...label, text: 'Save' }]), []);
});

ok('token lists: colours and lengths told apart by value, text styles by name', () => {
  const t = tokenLists({ collections: { Semantic: { values: { Light: { 'Colour/Text': '#111111', 'Colour/Fill': 'rgba(0,0,0,0.5)' } } }, Global: { values: { Default: { 'Spacing/8': 8, 'Corner radius/4': 4 } } } }, textStyles: [{ name: 'Label/md' }] });
  assert.deepEqual(t.colours.map((x) => x.name), ['Colour/Text', 'Colour/Fill']);
  assert.equal(t.colours[0].value, '#111111', 'each keeps its value, for a swatch');
  assert.deepEqual(t.lengths.map((x) => [x.group, x.name]), [['Spacing', 'Spacing/8'], ['Corner radius', 'Corner radius/4']]);
  assert.deepEqual(t.textStyles, ['Label/md']);
  assert.deepEqual(tokenLists(), { colours: [], lengths: [], shadows: [], textStyles: [], textStyleOf: {} }, 'no snapshot, no tokens');
  const fam = tokenLists({ collections: { S: { values: { L: { 'I/N/soft': '#1', 'I/D/medium': '#2', 'I/N/medium': '#3', 'I/D/strong': '#4', 'I/N/inverse': '#5' } } } } });
  assert.deepEqual(fam.colours.map((x) => x.name), ['I/N/soft', 'I/N/medium', 'I/N/inverse', 'I/D/medium', 'I/D/strong'], 'a family is listed together, a shade made later beside its own');
  const tree = tokenLists({ collections: { S: { values: { L: { 'Colour/Control/Neutral/rest': '#1', 'Colour/Level/1': '#2', 'Colour/Control/Feedback/Danger/rest': '#3', 'Colour/Level/2': '#4' } } } } });
  assert.deepEqual(tree.colours.map((x) => x.name), ['Colour/Control/Neutral/rest', 'Colour/Control/Feedback/Danger/rest', 'Colour/Level/1', 'Colour/Level/2'], 'families nest: all of Control together before Level, as Control came first');
  const ic = tokenLists({ _meta: { sources: { f: { owns: { iconColours: { house: 'I/N/medium' } } } } }, collections: { S: { values: { L: { 'I/N/medium': '#333333' } } } } });
  assert.deepEqual(ic.iconColours, { house: 'I/N/medium' }, "each icon's own colour, from the file that sent it");
  const drawn = preview([root(), part({ kind: 'instance', component: 'Icon/house', with: { Size: '16' } })], [], ic);
  assert.equal(drawn.children[0].style.color, '#333333', 'an icon given no colour is drawn in its own');
});

ok('a field offers the token groups the library uses for it, and everything where it uses none', () => {
  const uses = usedGroups([{ anatomy: { root: { layout: { gap: 'Spacing/8', padding: { top: 'Spacing/12' } }, radius: 'Corner radius/8', background: 'Colour/Fill/x' }, t: { color: 'Colour/Text/y' } } }]);
  assert.deepEqual(uses, { gap: ['Spacing'], padding: ['Spacing'], radius: ['Corner radius'], background: ['Colour/Fill'], color: ['Colour/Text'], fill: [], stroke: [], strokeWidth: [] }, 'a family is two segments where a name has more');
  const lengths = [{ name: 'Spacing/8' }, { name: 'Corner radius/8' }, { name: 'Effect/Position/0' }];
  assert.deepEqual(forField(lengths, uses.gap).map((t) => t.name), ['Spacing/8']);
  assert.deepEqual(forField(lengths, uses.radius).map((t) => t.name), ['Corner radius/8']);
  assert.equal(forField(lengths, []).length, 3);
  // a border's width per side counts as the library's use of its stroke widths
  assert.deepEqual(usedGroups([{ anatomy: { root: { border: { color: 'Colour/Stroke/x', width: ['Stroke/1', 'Stroke/1', 'Stroke/0', 'Stroke/1'] } } } }]).strokeWidth, ['Stroke']);
  assert.equal(forField(lengths, ['Nothing/here']).length, 3, 'a guess that matches nothing offers everything');
  assert.deepEqual(forField([{ name: 'Palette/Amber/1' }, { name: 'Colour/Text/y' }, { name: 'Colour/Fill/z' }], uses.background).map((t) => t.name), ['Colour/Fill/z'], 'primitives and text colours a fill never uses are left out');
});

ok('with scopes in the snapshot, a field offers the variables Figma scopes to it, or to every field', () => {
  const t = tokenLists({ collections: { Global: { values: { Default: { 'Spacing/8': 8, 'Corner radius/8': 8, 'Any/4': 4 } }, scopes: { 'Spacing/8': ['GAP'], 'Corner radius/8': ['CORNER_RADIUS'], 'Any/4': ['ALL_SCOPES'] } },
    Colour: { values: { Light: { 'Fill/a': '#fff', 'Text/a': '#000' } }, scopes: { 'Fill/a': ['FRAME_FILL'], 'Text/a': ['TEXT_FILL'] } } } });
  assert.deepEqual(t.lengths[0].scopes, ['GAP'], 'each token keeps its scopes');
  assert.deepEqual(forField(t.lengths, ['Corner radius'], 'padding').map((x) => x.name), ['Spacing/8', 'Any/4'], 'GAP covers padding too, and scopes win over the guess');
  assert.deepEqual(forField(t.lengths, [], 'radius').map((x) => x.name), ['Corner radius/8', 'Any/4']);
  assert.deepEqual(forField(t.colours, [], 'background').map((x) => x.name), ['Fill/a']);
  assert.deepEqual(forField(t.colours, [], 'color').map((x) => x.name), ['Text/a']);
  const shape = tokenLists({ collections: { C: { values: { L: { 'Icon/a': '#000', 'Text/b': '#111' } }, scopes: { 'Icon/a': ['SHAPE_FILL'], 'Text/b': ['TEXT_FILL'] } } } });
  assert.deepEqual([forField(shape.colours, [], 'fill').map((x) => x.name), forField(shape.colours, [], 'color').map((x) => x.name)], [['Icon/a'], ['Text/b']], 'a shape\'s fill and a text\'s colour are scopes of their own');
  assert.equal(tokenLists({ collections: { G: { values: { D: { 'Spacing/8': 8 } } } } }).lengths[0].scopes, undefined, 'an older snapshot has none, and the guess stands in');
});

ok('the preview resolves each token to its value, fills the words, and draws the component at its defaults', () => {
  const tokens = { colours: [{ name: 'Colour/Action', value: '#123456' }, { name: 'Colour/Text', value: '#ffffff' }], lengths: [{ name: 'Spacing/8', value: 8 }, { name: 'Spacing/12', value: 12 }, { name: 'Corner radius/8', value: 8 }],
    textStyleOf: { 'Label/md': { family: 'Inter', weight: 'SemiBold', size: 14, lineHeight: 1.4, letterSpacing: 0 } } };
  const text = draft({ name: 'Label', type: 'string', default: 'Save' });
  const show = draft({ name: 'Show icon', type: 'boolean', default: false });
  const pv = preview([r, content, { ...icon, shownBy: show.uid }, { ...label, textProp: text.uid, color: 'Colour/Text' }], [text, show], tokens);
  const c = pv.children[0];
  assert.deepEqual([c.style.gap, c.style.padding, c.style.background, c.style.borderRadius, c.style.flexDirection], ['8px', '12px', '#123456', '8px', 'row']);
  assert.deepEqual(c.children.map((x) => x.off || null), ['Show icon', null], 'the icon, off by default, is drawn marked with the prop that shows it');
  assert.equal(c.children[1].text, 'Save', 'the words are the text prop\'s default');
  assert.deepEqual([c.children[1].style.fontWeight, c.children[1].style.fontSize, c.children[1].style.color], [600, '14px', '#ffffff']);
  assert.deepEqual(preview([r, { ...content, background: 'Colour/Missing' }], [], tokens).children[0].style.background, undefined, 'a token not in the snapshot stays unset');
});

ok('the preview draws a gradient, an image fill, and a slot with what it holds', () => {
  const tokens = { colours: [{ name: 'C/pink', value: '#f0c' }, { name: 'C/blue', value: '#00f' }] };
  const parts = fromAnatomy({ root: { kind: 'container' },
    g: { kind: 'container', parent: 'root', order: 0, background: { type: 'GRADIENT_LINEAR', angle: 45, transform: [[0.5, -0.5, 0.5], [0.5, 0.5, 0]], stops: [{ position: 0, color: 'C/pink' }, { position: 1, color: 'C/blue' }] } },
    img: { kind: 'graphic', parent: 'root', order: 1, background: 'IMAGE:FIT' },
    s: { kind: 'slot', parent: 'root', order: 2, width: 'fill', layout: { direction: 'column' } }, 's/a': { kind: 'text', parent: 's', content: 'A' } }, [], {});
  const [g, img, slot] = preview(parts, [], tokens).children;
  assert.equal(g.style.background, 'linear-gradient(45deg, #f0c 0%, #00f 100%)', 'a gradient from its paint\'s transform, as parity reads it');
  assert.equal(img.image, true, 'an image fill is said, the contract holding no image');
  assert.deepEqual([slot.style.flexDirection, slot.style.flex, slot.children.map((x) => x.text)], ['column', '1 1 0', ['A']], 'a slot lays out what it holds, and fills as it says');
  const pic = fromAnatomy({ root: { kind: 'container' }, g: { kind: 'instance', parent: 'root', component: 'Graphic/ghost', background: 'IMAGE:FIT' } }, [], {});
  const drawnPic = preview(pic, [], tokens, { imageOf: (n, dark) => (n === 'Graphic/ghost' ? `p/${dark ? 'dark' : 'light'}` : null), dark: true }).children[0];
  assert.deepEqual([drawnPic.picture, drawnPic.image], [{ url: 'p/dark', fit: 'contain' }, undefined], 'an image fill is the snapshot\'s preview of that component where it has one, in the page\'s scheme');
});

ok('an anatomy read back from its JSON writes the same anatomy and the same links', () => {
  const text = draft({ name: 'Label text', type: 'string' });
  const show = draft({ name: 'Show icon', type: 'boolean' });
  const swap = draft({ name: 'Icon', type: 'instance' });
  const drafts = [text, show, swap];
  const parts = [{ ...r, background: 'Colour/Fill', stroke: 'Colour/Line', strokeWidth: 'Stroke/1' }, content, { ...icon, shownBy: show.uid, swapProp: swap.uid }, { ...label, textProp: text.uid, color: 'Colour/Text' }];
  const once = toAnatomy(parts, drafts);
  const props = Object.fromEntries(Object.entries(once.links).map(([k, v]) => [k, v]));
  const back = fromAnatomy(once.anatomy, drafts, props);
  assert.deepEqual([toAnatomy(back, drafts).anatomy, toAnatomy(back, drafts).links], [once.anatomy, once.links]);
  assert.deepEqual(back.slice(1).map((p) => p.name), ['Content', 'Icon', 'Label'], 'names come back from the ids');
});

ok('a library contract read and written back keeps what the editor does not set, and an instance\'s own layers', () => {
  const anatomy = {
    root: { kind: 'container', layout: { direction: 'column', gap: 'Spacing/8', align: 'start', crossAlign: 'start', padding: { top: 'Spacing/0', end: 'Spacing/0', bottom: 'Spacing/0', start: 'Spacing/0' } }, width: 320, height: 'hug' },
    field: { kind: 'container', parent: 'root', order: 0, layout: { direction: 'row', gap: 'Spacing/8', crossAlign: 'center', padding: { top: 'Spacing/8', end: 'Spacing/12', bottom: 'Spacing/8', start: 'Spacing/12' } }, width: 'fill', minHeight: 40,
      border: { color: 'Colour/Line', width: ['Stroke/1', 'Stroke/1', 'Stroke/1', 'Stroke/1'], sides: { top: 1, end: 1, bottom: 1, start: 1 } }, overflow: 'hidden' },
    'field/search': { kind: 'instance', parent: 'field', order: 0, component: 'Icon/search', with: { Size: '20' }, width: 20, height: 20 },
    'field/search/icon': { kind: 'graphic', parent: 'field/search', order: 0, background: 'Colour/Icon' },
    'field/placeholder': { kind: 'text', parent: 'field', order: 1, width: 'fill', color: 'Colour/Text' },
  };
  const parts = fromAnatomy(anatomy, [], {});
  assert.deepEqual(parts.map((p) => p.name), ['root', 'Field', 'Search', 'Placeholder'], 'an instance\'s layers are not parts of this component');
  assert.deepEqual(toAnatomy(parts, []).anatomy, anatomy, 'nothing is lost or changed on the way through');
  const edited = parts.map((p) => (p.name === 'Field' ? { ...p, layout: { ...p.layout, padding: { top: 'Spacing/4', end: 'Spacing/4', bottom: 'Spacing/4', start: 'Spacing/4' } }, stroke: null } : p));
  const field = toAnatomy(edited, []).anatomy.field;
  assert.deepEqual(field.layout.padding, { top: 'Spacing/4', end: 'Spacing/4', bottom: 'Spacing/4', start: 'Spacing/4' }, 'a padding changed in the editor is the editor\'s');
  assert.deepEqual([field.layout.crossAlign, field.width, field.border.color], ['center', 'fill', undefined], 'the rest stays; a cleared stroke colour is gone');
  const pv = preview(parts, [], { lengths: [{ name: 'Spacing/8', value: 8 }, { name: 'Spacing/12', value: 12 }] }).children[0];
  assert.deepEqual([pv.style.alignItems, pv.style.flex, pv.style.minHeight, pv.style.padding], ['center', undefined, '40px', '8px 12px'], 'the preview draws the alignment, sizes and each side');
  assert.equal(pv.style.alignSelf, 'stretch', 'fill across a column parent stretches');
});

ok('a vector keeps its fill and size, and the preview takes a colour\'s dark value when the page is dark', () => {
  const t = tokenLists({ collections: { C: { values: { Light: { 'Icon/a': '#111111' }, Dark: { 'Icon/a': '#eeeeee' } } } } });
  assert.equal(t.colours[0].dark, '#eeeeee');
  const anatomy = { root: { kind: 'container', layout: { direction: 'row' } }, glyph: { kind: 'graphic', parent: 'root', order: 0, width: 16, height: 16, background: 'Icon/a' } };
  const parts = fromAnatomy(anatomy, [], {});
  assert.equal(parts[1].kind, 'graphic');
  assert.deepEqual(toAnatomy(parts, []).anatomy, anatomy);
  assert.equal(preview(parts, [], t, { dark: true }).children[0].style.background, '#eeeeee');
  assert.equal(preview(parts, [], t).children[0].style.background, '#111111');
});

ok('the dark value is the mode called Dark, as the snapshot\'s reader picks it, not any mode with dark in its name', () => {
  const t = tokenLists({ collections: { C: { values: { Light: { 'Icon/a': '#111111' }, 'Darker brand': { 'Icon/a': '#222222' }, dark: { 'Icon/a': '#eeeeee' } } } } });
  assert.equal(t.colours[0].dark, '#eeeeee');
});

ok('an icon instance is drawn at the size its set\'s size axis says, by the name the library gives that axis', () => {
  const anatomy = { root: { kind: 'container', layout: { direction: 'row' } }, icon: { kind: 'instance', parent: 'root', order: 0, component: 'Icon/check', with: { Dimension: '24' } } };
  const asked = [];
  preview(fromAnatomy(anatomy, [], {}), [], {}, { iconOf: (n, z) => { asked.push(z); return 'x'; }, sizeAxis: 'Dimension' });
  assert.deepEqual(asked, [24]);
});

ok('an effect style is a shadow the preview draws, beside the stroke', () => {
  const t = tokenLists({ collections: { C: { values: { L: { 'Line/a': '#000000' } } } }, effects: [{ name: 'Elevation/raised', layers: [{ type: 'DROP_SHADOW', x: 0, y: 2, blur: 4, spread: 0, color: 'rgb(0 0 0 / 0.2)' }] }] });
  assert.deepEqual(t.shadows, [{ group: 'Elevation', name: 'Elevation/raised', value: '0px 2px 4px 0px rgb(0 0 0 / 0.2)' }]);
  const anatomy = { root: { kind: 'container', layout: { direction: 'row' }, shadow: 'Elevation/raised', border: { color: 'Line/a' } } };
  const parts = fromAnatomy(anatomy, [], {});
  assert.equal(toAnatomy(parts, []).anatomy.root.shadow, 'Elevation/raised');
  assert.equal(preview(parts, [], t).style.boxShadow, 'inset 0 0 0 1px #000000, 0px 2px 4px 0px rgb(0 0 0 / 0.2)');
});

ok('an instance whose component the library has is drawn from that component\'s own anatomy; one it lacks is named', () => {
  const anatomy = { root: { kind: 'container', layout: { direction: 'column' } }, item: { kind: 'instance', parent: 'root', order: 0, component: 'Menu item' }, other: { kind: 'instance', parent: 'root', order: 1, component: 'Icon/search' } };
  const inner = fromAnatomy({ root: { kind: 'container', layout: { direction: 'row' } }, label: { kind: 'text', parent: 'root', order: 0, content: 'Home' } }, [], {});
  const pv = preview(fromAnatomy(anatomy, [], {}), [], {}, { nested: (n) => (n === 'Menu item' ? { parts: inner, drafts: [] } : null) });
  assert.equal(pv.children[0].inner.children[0].text, 'Home');
  assert.equal(pv.children[1].inner, undefined);
  assert.equal(pv.children[1].text, 'Icon/search');
});

ok('a border on one side is drawn on that side only; an absolute layer sits over the flow', () => {
  const t = tokenLists({ collections: { C: { values: { L: { 'Line/a': '#000000' } } } } });
  const anatomy = { root: { kind: 'container', layout: { direction: 'row' }, border: { color: 'Line/a', width: [null, null, 'Stroke/1', null], sides: { top: 0, end: 0, bottom: 1, start: 0 } } },
    over: { kind: 'container', parent: 'root', order: 0, layout: { direction: 'row' }, position: 'absolute', width: 32, height: 32 } };
  const pv = preview(fromAnatomy(anatomy, [], {}), [], t);
  assert.equal(pv.style.boxShadow, 'inset 0 -1px 0 0 #000000');
  assert.deepEqual([pv.children[0].style.position, pv.style.position], ['absolute', 'relative']);
});

ok('an absolute layer is pinned as its constraints say, at its offset; one filled across and capped sits where its parent aligns it', () => {
  const anatomy = { root: { kind: 'container', layout: { direction: 'column', crossAlign: 'center' }, width: 800 },
    panel: { kind: 'container', parent: 'root', order: 0, layout: { direction: 'column' }, width: 'fill', maxWidth: 556 },
    head: { kind: 'container', parent: 'panel', order: 0, layout: { direction: 'row' }, position: 'absolute', constraints: { horizontal: 'stretch', vertical: 'min' } },
    ring: { kind: 'graphic', parent: 'panel', order: 3, width: 89, height: 44, position: 'absolute', absolute: { x: -4, y: -4 }, constraints: { horizontal: 'stretch', vertical: 'stretch' } },
    foot: { kind: 'container', parent: 'panel', order: 1, layout: { direction: 'row' }, position: 'absolute', constraints: { horizontal: 'center', vertical: 'max' } },
    badge: { kind: 'graphic', parent: 'panel', order: 4, width: 8, height: 8, position: 'absolute', absolute: { x: 71, y: 2, end: 2 }, constraints: { horizontal: 'max', vertical: 'min' } },
    wide: { kind: 'graphic', parent: 'panel', order: 5, position: 'absolute', absolute: { x: -2, y: -6, end: -10, bottom: 0 }, constraints: { horizontal: 'stretch', vertical: 'stretch' } },
    spin: { kind: 'container', parent: 'panel', order: 2, layout: { direction: 'row' }, position: 'absolute' } };
  const [panel] = preview(fromAnatomy(anatomy, [], {}), [], {}).children;
  assert.deepEqual([panel.style.alignSelf, panel.style.width, panel.style.maxWidth], [undefined, '100%', '556px']);
  const [head, foot, spin, ring, badge, wide] = panel.children.map((c) => c.style);
  // its far offsets the contract's, where it gives them: from the end, and stretched unevenly
  assert.deepEqual([badge.right, badge.left, badge.top], ['2px', undefined, '2px']);
  assert.deepEqual([wide.left, wide.right, wide.top, wide.bottom], ['-2px', '-10px', '-6px', '0']);
  assert.deepEqual([ring.left, ring.right, ring.top, ring.bottom, ring.width, ring.height], ['-4px', '-4px', '-4px', '-4px', undefined, undefined]);
  assert.deepEqual([head.left, head.right, head.top, head.bottom, head.translate], ['0', '0', '0', undefined, undefined]);
  assert.deepEqual([foot.left, foot.bottom, foot.top, foot.translate], ['50%', '0', undefined, '-50% 0']);
  assert.deepEqual([spin.left, spin.top, spin.translate], ['50%', '50%', '-50% -50%']);
});

ok('an opacity bound to a token is drawn at its value, a percentage as Figma keeps it', () => {
  const t = tokenLists({ collections: { C: { values: { L: { 'Disabled/opacity': 40, 'Faint/opacity': 0.25 } } } } });
  const at = (o) => preview(fromAnatomy({ root: { kind: 'container', layout: { direction: 'row' }, opacity: o } }, [], {}), [], t).style.opacity;
  assert.deepEqual([at('Disabled/opacity'), at('Faint/opacity'), at(0.5)], ['0.4', '0.25', '0.5']);
});

ok('forms the editor cannot show come back as they went: a gradient, corners apart, no auto layout, a zero gap, ids with digits', () => {
  const anatomy = {
    root: { kind: 'container', background: ['Colour/A', 'IMAGE:FILL'], radius: ['Corner/4', 'Corner/0', 'Corner/4', 'Corner/0'] },
    item1: { kind: 'container', parent: 'root', order: 0, layout: { direction: 'row', gap: 0, padding: { top: null, end: 'Spacing/8', bottom: null, start: 'Spacing/8' } } },
    'item1/00': { kind: 'graphic', parent: 'item1', order: 0, background: 'Colour/B' },
  };
  assert.deepEqual(toAnatomy(fromAnatomy(anatomy, [], {}), []).anatomy, anatomy);
});

ok('a stored link the editor has no say in stays: to a layer a variant adds, and a second swap of one part', () => {
  const swap16 = draft({ name: 'Icon (16)', type: 'instance' });
  const swap24 = draft({ name: 'Icon (24)', type: 'instance' });
  const props = { icon16: { type: 'instance', figma: 'Icon (16)', swaps: ['icon'] }, icon24: { type: 'instance', figma: 'Icon (24)', swaps: ['icon', 'later/icon'] } };
  const parts = fromAnatomy({ root: { kind: 'container', layout: { direction: 'row' } }, icon: { kind: 'instance', parent: 'root', order: 0, component: 'Icon/a' } }, [swap16, swap24], props);
  const c = toContract('Avatar', [{ ...swap16, extra: { swaps: ['icon'] } }, { ...swap24, extra: { swaps: ['icon', 'later/icon'] } }], {}, parts);
  assert.deepEqual([c.props.icon16.swaps, c.props.icon24.swaps], [['icon'], ['icon', 'later/icon']]);
});

ok('an icon instance\'s colour is its glyph\'s fill: shown on the instance, written back into the glyph', () => {
  const anatomy = { root: { kind: 'container', layout: { direction: 'row' } }, icon: { kind: 'instance', parent: 'root', order: 0, component: 'Icon/x' }, 'icon/icon': { kind: 'graphic', parent: 'icon', order: 0, background: 'Colour/Icon/a' } };
  const parts = fromAnatomy(anatomy, [], {});
  assert.equal(parts[1].color, 'Colour/Icon/a');
  assert.deepEqual(toAnatomy(parts, []).anatomy, anatomy, 'unchanged, it stays where it was');
  const out = toAnatomy(parts.map((p) => (p.name === 'Icon' ? { ...p, color: 'Colour/Icon/b' } : p)), []).anatomy;
  assert.deepEqual([out.icon.color, out['icon/icon'].background], [undefined, 'Colour/Icon/b']);
});

ok('a new part beside parts read from a contract is numbered past their ids, never onto one', () => {
  const read = fromAnatomy({ root: { kind: 'container', layout: { direction: 'row' } }, item: { kind: 'text', parent: 'root', order: 0, content: 'a' }, item_2: { kind: 'text', parent: 'root', order: 1, content: 'b' } }, [], {});
  const id = ids([...read, part({ name: 'Item', kind: 'text', parent: 'root', text: 'c' })]);
  assert.deepEqual(Object.values(id).sort(), ['item', 'item_2', 'item_3', 'root']);
});

ok('a stored link to a part read here goes when the part is renamed or removed', () => {
  const show = draft({ name: 'Show caption', type: 'boolean' });
  const props = { showCaption: { type: 'boolean', figma: 'Show caption', shows: ['caption', 'later/layer'] } };
  const parts = fromAnatomy({ root: { kind: 'container', layout: { direction: 'row' } }, caption: { kind: 'text', parent: 'root', order: 0, content: 'x' } }, [show], props);
  const renamed = parts.map((p) => (p.name === 'Caption' ? { ...p, name: 'Note' } : p));
  const c = toContract('X', [{ ...show, extra: { shows: ['caption', 'later/layer'] } }], {}, renamed);
  assert.deepEqual(c.props.showCaption.shows, ['note', 'later/layer'], 'the link follows the rename in its place; a variant\'s layer stays');
  const gone = toContract('X', [{ ...show, extra: { shows: ['caption', 'later/layer'] } }], {}, parts.filter((p) => p.name !== 'Caption'));
  assert.deepEqual(gone.props.showCaption.shows, ['later/layer'], 'a removed part\'s id goes');
});

ok('an instance is drawn from the layers recorded for it, its own swapped icon included', () => {
  const anatomy = { root: { kind: 'container', layout: { direction: 'row' } }, content: { kind: 'container', parent: 'root', order: 0, layout: { direction: 'row' } },
    'content/button': { kind: 'instance', parent: 'content', order: 0, component: 'Icon button', layout: { direction: 'row' } },
    'content/button/content': { kind: 'container', parent: 'content/button', order: 0, layout: { direction: 'row' } },
    'content/button/content/icon': { kind: 'instance', parent: 'content/button/content', order: 0, component: 'Icon/minus' } };
  const pv = preview(fromAnatomy(anatomy, [], {}), [], {}, { iconOf: (n) => (n.startsWith('Icon/') ? n : null) });
  assert.equal(pv.children[0].children[0].inner.children[0].children[0].icon, 'Icon/minus', 'a layer named as its parent\'s parent loops nothing');
});

ok('a read part moved beside one with its id, and new parts of one name, each get an id of their own', () => {
  const read = fromAnatomy({ root: { kind: 'container', layout: { direction: 'row' } }, box: { kind: 'container', parent: 'root', order: 0, layout: { direction: 'row' } },
    label: { kind: 'text', parent: 'root', order: 1, content: 'a' }, 'box/label': { kind: 'text', parent: 'box', order: 0, content: 'b' } }, [], {});
  const inner = read.find((p) => p.at === 'box/label');
  const moved = place(read, inner.uid, read.find((p) => p.at === 'label').uid, 'before');
  const id = ids(moved);
  assert.equal(new Set(Object.values(id)).size, Object.keys(id).length, 'no two parts share an id');
  assert.equal(id[read.find((p) => p.at === 'label').uid], 'label', 'the one that never moved keeps its id');
  const fresh = [root(), part({ name: 'Item', kind: 'text', parent: 'root' }), part({ name: 'Item', kind: 'text', parent: 'root' }), part({ name: 'Item 2', kind: 'text', parent: 'root' })];
  assert.equal(new Set(Object.values(ids(fresh))).size, 4);
});

ok('a part\'s size reads hug, fill or pixels, writes back unchanged, and a vector is drawn at its own', () => {
  const anatomy = { root: { kind: 'container', layout: { direction: 'row' } }, dot: { kind: 'graphic', parent: 'root', order: 0, width: 8, height: 8, background: 'C/a' }, t: { kind: 'text', parent: 'root', order: 1, width: 'fill', content: 'x' } };
  const parts = fromAnatomy(anatomy, [], {});
  assert.deepEqual([parts[1].width, parts[2].width], [8, 'fill']);
  assert.deepEqual(toAnatomy(parts, []).anatomy, anatomy);
  assert.deepEqual(toAnatomy(parts.map((p) => (p.uid === parts[1].uid ? { ...p, width: 12 } : p)), []).anatomy.dot.width, 12);
  assert.deepEqual([preview(parts, [], {}).children[0].style.width, preview(parts, [], {}).children[0].style.height], ['8px', '8px']);
  assert.equal(preview(fromAnatomy({ ...anatomy, dot: { ...anatomy.dot, shape: 'ellipse' } }, [], {}), [], {}).children[0].style.borderRadius, '50%', 'an ellipse is drawn round');
  assert.match(preview(fromAnatomy({ ...anatomy, dot: { ...anatomy.dot, shape: 'ellipse', arc: { start: 270, end: 0, inner: 0.75 } } }, [], {}), [], {}).children[0].style.mask, /^conic-gradient\(from 0deg, #000 90deg, transparent 0\), radial-gradient\(closest-side, transparent 75%/, 'an arc is drawn as Figma draws it: a quarter of a ring, 12 to 3 o\'clock');
  const square = fromAnatomy({ ...anatomy, dot: { ...anatomy.dot, shape: 'rectangle', radius: 'R/4' } }, [], {});
  const round = square.map((p) => (p.uid === square[1].uid ? { ...p, shape: 'ellipse' } : p));
  assert.ok(!('radius' in toAnatomy(round, []).anatomy.dot) && round[1].radius === 'R/4', 'an ellipse writes no corners, and keeps them for a rectangle again');
});

ok('the parts only some variants draw sit under their parent with the condition that draws them; a drawn part with a condition says it too', () => {
  const contract = { anatomy: { root: { kind: 'container' }, label: { kind: 'text', parent: 'root', order: 0 }, ring: { kind: 'graphic', parent: 'root', order: 1 } },
    variants: [{ when: { state: 'focus' }, add: { ring2: { kind: 'graphic', parent: 'root' } } }, { when: { showIcon: true }, add: { icon: { kind: 'instance', parent: 'root' }, 'icon/glyph': { kind: 'graphic', parent: 'icon' } } }],
    when: { ring2: { state: ['focus'] }, ring: { size: ['lg'] } } };
  const parts = fromAnatomy(contract.anatomy, [], {});
  const { byParent, condOf } = variantParts(parts, contract);
  const under = byParent.get('root').map((g) => [g.at, g.exact, JSON.stringify(g.when)]);
  assert.deepEqual(under, [['ring2', true, '{"state":["focus"]}'], ['icon', false, '{"showIcon":true}']], 'an instance\'s own layers are left out');
  assert.deepEqual(condOf.get(parts.find((p) => p.name === 'Ring').uid), { size: ['lg'] });
});

ok('a renamed part carries its condition and the variants that change it; a removed one takes its condition', () => {
  const sel = draft({ name: 'Selected', type: 'boolean', default: false });
  sel.was = 'selected';
  const anatomy = { root: { kind: 'container', layout: { direction: 'row' } }, icon: { kind: 'graphic', parent: 'root', order: 0, background: 'C/a' } };
  const base = { variants: [{ when: { selected: true }, set: { 'icon.background': 'C/b' } }], when: { icon: { selected: [true] } } };
  const parts = fromAnatomy(anatomy, [sel], {});
  const renamed = parts.map((p) => (p.name === 'Icon' ? { ...p, name: 'Mark' } : p));
  const out = toContract('Chip', [sel], base, renamed);
  assert.deepEqual([Object.keys(out.when), Object.keys(out.variants[0].set)], [['mark'], ['mark.background']]);
  assert.equal(toContract('Chip', [sel], base, parts.filter((p) => p.name !== 'Icon')).when, undefined);
});

ok('a part renamed inside a renamed container carries its variants to its own new id', () => {
  const anatomy = { root: { kind: 'container', layout: { direction: 'row' } }, box: { kind: 'container', parent: 'root', order: 0, layout: { direction: 'row' } }, 'box/label': { kind: 'text', parent: 'box', order: 0, content: 'Hi', color: 'C/a' } };
  const size = draft({ name: 'Size', type: 'enum', values: ['sm', 'lg'], default: 'sm' });
  size.was = 'size';
  const base = { variants: [{ when: { size: 'lg' }, set: { 'box/label.color': 'C/b' } }] };
  const parts = fromAnatomy(anatomy, [size], {}).map((p) => (p.name === 'Box' ? { ...p, name: 'Frame' } : p.name === 'Label' ? { ...p, name: 'Title' } : p));
  assert.deepEqual(Object.keys(toContract('Chip', [size], base, parts).variants[0].set), ['frame/title.color']);
});

ok('a drag places a part before, after or inside another, and never inside itself', () => {
  const box2 = part({ name: 'Side', kind: 'container', parent: 'root' });
  const all = [r, content, icon, label, box2];
  const into = place(all, label.uid, box2.uid, 'inside');
  assert.equal(into.find((p) => p.uid === label.uid).parent, box2.uid, 'the text goes into the other container');
  assert.deepEqual(tree(into).map(({ part: p, depth }) => `${depth}:${p.name}`), ['0:root', '1:Content', '2:Icon', '1:Side', '2:Label']);
  const before = place(all, label.uid, icon.uid, 'before');
  assert.deepEqual(tree(before).map(({ part: p }) => p.name), ['root', 'Content', 'Label', 'Icon'].concat(['Side']), 'before its sibling');
  const out = place(all, icon.uid, content.uid, 'after');
  assert.equal(out.find((p) => p.uid === icon.uid).parent, 'root', 'after a container is beside it, not in it');
  assert.equal(place(all, content.uid, icon.uid, 'inside'), all, 'only a container takes a part inside');
  assert.equal(place(all, content.uid, label.uid, 'before'), all, 'a container cannot go below itself');
  assert.equal(place(all, label.uid, 'root', 'before'), all, 'nothing sits beside the outer box');
});

ok('a variable hidden from publishing is kept for drawing but offered to no field', () => {
  const t = tokenLists({ collections: { Primitives: { hidden: ['Palette/Amber/2'], values: { Light: { 'Palette/Amber/2': '#fff8e7', 'Palette/Amber/6': '#f4aa24' } } } } });
  assert.deepEqual(t.colours.map((c) => [c.name, !!c.private]), [['Palette/Amber/2', true], ['Palette/Amber/6', false]], 'marked, not dropped');
  assert.deepEqual(forField(t.colours, [], 'background').map((c) => c.name), ['Palette/Amber/6'], 'no picker offers it');
});

ok('a token\'s value and its dark value are the ones the snapshot\'s reader gives for no mode and for Dark', () => {
  const snapshot = { collections: {
    Theme: { modes: ['Light', 'DARK'], values: { Light: { 'Text/a': '#111111' }, DARK: { 'Text/a': '#eeeeee' } } },
    Brand: { modes: ['Default'], values: { Default: { 'Brand/a': '#336699' } } },
    Night: { modes: ['Dark', 'Light'], values: { Dark: { 'Night/a': '#000000' }, Light: { 'Night/a': '#ffffff' } } },
  } };
  for (const t of tokenLists(snapshot).colours) {
    assert.equal(t.value, valueOf(snapshot, t.name), t.name);
    assert.equal(t.dark || t.value, valueOf(snapshot, t.name, 'dark'), t.name);
  }
});

ok('an effect style\'s layers are written in CSS order, the reverse of Figma\'s: Figma\'s last layer paints on top, CSS\'s first', () => {
  const t = tokenLists({ effects: [{ name: 'Elevation/high', layers: [
    { type: 'DROP_SHADOW', x: 0, y: 8, blur: 16, spread: 0, color: 'rgb(0 0 0 / 0.1)' },
    { type: 'DROP_SHADOW', x: 0, y: 1, blur: 2, spread: 0, color: 'rgb(0 0 0 / 0.3)' },
  ] }] });
  assert.equal(t.shadows[0].value, '0px 1px 2px 0px rgb(0 0 0 / 0.3), 0px 8px 16px 0px rgb(0 0 0 / 0.1)');
});

ok('an opacity set in the editor is written, on a part read from a contract and on a new one', () => {
  const parts = fromAnatomy({ root: { kind: 'container' }, icon: { kind: 'instance', parent: 'root' } }, [], {});
  parts.find((p) => p.at === 'icon').opacity = 'State/Disabled/opacity';
  const fresh = part({ kind: 'text', parent: parts[0].uid, name: 'Label' });
  fresh.opacity = 0.5;
  const { anatomy } = toAnatomy([...parts, fresh], []);
  assert.equal(anatomy.icon.opacity, 'State/Disabled/opacity');
  assert.equal(anatomy.label.opacity, 0.5);
});

console.log(`${n} passed`);
