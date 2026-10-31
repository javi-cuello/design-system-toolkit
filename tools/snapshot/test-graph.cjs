#!/usr/bin/env node
// node tools/snapshot/test-graph.cjs
'use strict';
const { graphOf, nameOf, parentsByName } = require('./graph.cjs');

let pass = 0, fail = 0;
const expect = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (ok) pass++; else { fail++; console.log('FAIL ' + name + '\n  got  ' + JSON.stringify(got) + '\n  want ' + JSON.stringify(want)); }
};
const inst = (name, o) => Object.assign({ type: 'INSTANCE', name, children: [] }, o);
const v = (name, children) => ({ name, type: 'COMPONENT', children });

// ---- identity beats the name -------------------------------------------
// A project may define one name in two libraries; a component may have a
// " / " in its own name. Neither is answerable from a string, and neither has
// to be once the plugin records what the instance points at.
{
  const g = graphOf({ specs: [
    { name: 'Button', folder: 'web-button', key: 'k-web-button', id: '1:1', variants: [] },
    { name: 'Button', folder: 'mob-button', key: 'k-mob-button', id: '2:1', variants: [] },
    { name: 'Toolbar', folder: 'toolbar', key: 'k-toolbar', id: '1:9', variants: [
      v('Rest', [inst('Button', { instanceOf: 'Button / Size=md', instanceOfKey: 'k-mob-button' })]) ] },
  ] });
  expect('an instance resolves by key, not by a name two components share',
    g.usedBy.get('mob-button').map((u) => u.name), ['Toolbar']);
  expect('and nothing was guessed', g.guessed, 0);
  expect('the colliding name is reported, so a reader knows it is not decidable by name',
    g.ambiguous, ['Button']);
}

// ---- the name fallback, for a store taken before the key existed --------
{
  const g = graphOf({ specs: [
    { name: 'Table - Cell / Fill', folder: 'cell-fill', id: '1:2', variants: [] },
    { name: 'Table - Cell', folder: 'cell', id: '1:3', variants: [] },
    { name: 'Table', folder: 'table', id: '1:4', variants: [
      v('Rest', [inst('Cell', { instanceOf: 'Table - Cell / Fill / Size=md' })]) ] },
  ] });
  expect('the longest stored name wins, so a slash in a component name survives',
    g.uses.get('table').map((u) => u.name), ['Table - Cell / Fill']);
  // Counted, because a resolver that silently degrades is one nobody notices
  // has degraded.
  expect('and the run says how many edges had to guess', g.guessed, 1);
}

// ---- an instance inside an instance is not this component's -------------
{
  const g = graphOf({ specs: [
    { name: 'Icon', folder: 'icon', key: 'k-icon', id: '1:5', variants: [] },
    { name: 'Button', folder: 'button', key: 'k-button', id: '1:6', variants: [
      v('Rest', [inst('Icon', { instanceOf: 'Icon', instanceOfKey: 'k-icon' })]) ] },
    { name: 'Toolbar', folder: 'toolbar', key: 'k-toolbar', id: '1:7', variants: [
      v('Rest', [inst('Button', { instanceOf: 'Button', instanceOfKey: 'k-button',
        children: [inst('Icon', { instanceOf: 'Icon', instanceOfKey: 'k-icon' })] })]) ] },
  ] });
  expect('Toolbar uses Button', g.uses.get('toolbar').map((u) => u.name), ['Button']);
  expect('and not the Icon inside it, which is Button\'s', g.usedBy.get('icon').map((u) => u.name), ['Button']);
}

// ---- an icon is a leaf with no spec of its own --------------------------
{
  const g = graphOf({
    specs: [{ name: 'Icon container', folder: 'icon-container', key: 'k-ic', id: '1:8', variants: [
      v('Rest', [inst('plus', { instanceOf: 'plus' })]) ] }],
    icons: [{ name: 'plus', page: '❖ Icons' }],
  });
  expect('an icon resolves and is named as one',
    g.uses.get('icon-container'), [{ id: 'plus', name: 'plus', kind: 'icon', via: 'name' }]);
}

// ---- what cannot be resolved is named, never dropped --------------------
{
  const g = graphOf({ specs: [
    { name: 'Screen', folder: 'screen', key: 'k-s', id: '1:9', variants: [
      v('Rest', [inst('Status bar', { instanceOf: 'Status bar - iPhone / Type=Default' })]) ] },
  ] });
  expect('an instance of something the store does not hold is reported, not silently lost',
    g.unresolved, [{ from: 'screen', name: 'Screen', instanceOf: 'Status bar - iPhone / Type=Default' }]);
  expect('and it produces no edge', g.uses.has('screen'), false);
}

// ---- nameOf on its own --------------------------------------------------
expect('nameOf takes the longest known name', nameOf('A - B / C / Size=md', ['A - B', 'A - B / C']), 'A - B / C');
expect('and falls back to the first segment when nothing is known', nameOf('Thing / Size=md', []), 'Thing');

// ---- the relation in the shape a skill can take ------------------------
// A skill may not require this file, so it takes the relation as INPUT. Keyed
// by display name, because that is the only handle a skill reading a stored
// snapshot has.
{
  const specs = [
    { name: 'Icon', folder: 'icon', key: 'k-icon', id: '1:1', variants: [] },
    { name: 'Button', folder: 'button', key: 'k-button', id: '1:2', variants: [
      v('Rest', [inst('Icon', { instanceOf: 'Icon', instanceOfKey: 'k-icon' })]) ] },
  ];
  expect('the relation comes out keyed by name, parents listed',
    parentsByName(graphOf({ specs }), specs), { Icon: ['Button'] });
}
{
  // A name two specs both claim identifies neither, and a skill handed the
  // wrong component is worse off than a skill handed nothing.
  const specs = [
    { name: 'Button', folder: 'web-button', key: 'k-w', id: '1:1', variants: [] },
    { name: 'Button', folder: 'mob-button', key: 'k-m', id: '2:1', variants: [] },
    { name: 'Toolbar', folder: 'toolbar', key: 'k-t', id: '1:9', variants: [
      v('Rest', [inst('Button', { instanceOf: 'Button', instanceOfKey: 'k-m' })]) ] },
  ];
  expect('a name two specs share is left out rather than guessed',
    parentsByName(graphOf({ specs }), specs), {});
}

console.log((fail ? 'FAIL' : 'pass') + ' — ' + pass + ' of ' + (pass + fail) + ' assertions');
process.exit(fail ? 1 : 0);
