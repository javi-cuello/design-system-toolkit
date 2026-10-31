// A description read as guidance, in both forms Figma keeps it. Run: node --test test-guidance.cjs
const test = require('node:test');
const assert = require('node:assert');
const { parse, alternative } = require('./guidance.cjs');

test('markdown form: purpose, then each section as a list', () => {
  const g = parse("Primary action for one decision.\n\n## Usage\n- Use for the main action\n- Choose Role first\n\n## Don't\n- Use two in one view: use Secondary for the second\n\n## Code gen notes\n- Size maps to size");
  assert.equal(g.purpose, 'Primary action for one decision.');
  assert.deepEqual(g.usage, ['Use for the main action', 'Choose Role first']);
  assert.deepEqual(g.dont, ['Use two in one view: use Secondary for the second']);
  assert.deepEqual(g.code, ['Size maps to size']);
  assert.equal(g.empty, false);
});

test('plain-text form: headings as bare lines', () => {
  const g = parse("Status label.\nUsage\nUse for short status\nDon't\n• Use for actions: use a Chip");
  assert.deepEqual(g.usage, ['Use for short status']);
  assert.deepEqual(g.dont, ['Use for actions: use a Chip']);
});

test('an unknown heading ends the section above it instead of joining it', () => {
  const g = parse('## Usage\n- a\n## Notes for the team\n- not usage');
  assert.deepEqual(g.usage, ['a']);
});

test('empty and missing descriptions say so', () => {
  assert.equal(parse('').empty, true);
  assert.equal(parse(undefined).empty, true);
});

test("a Don't item's alternative is matched to a known component", () => {
  const names = ['Button', 'Chip', 'Compact button', 'Link'];
  assert.equal(alternative('Use for actions: use a Chip', names), 'Chip');
  assert.equal(alternative('Use to navigate: use a link', names), 'Link');
  assert.equal(alternative('Use in toolbars: use a Compact button', names), 'Compact button');
  assert.equal(alternative('Disable without saying why', names), null);
  // Found on a real library: a Don't mentioning a component with no colon names no alternative,
  // a component is never its own, and a code-span name still matches.
  assert.equal(alternative('Use more than one Primary button in the same context', names, 'Button'), null);
  assert.equal(alternative('Use to open a menu: use a Button', names, 'Button'), null);
  assert.equal(alternative('Use for an icon-only control: use `Compact button`', names, 'Button'), 'Compact button');
});
