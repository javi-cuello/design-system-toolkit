// node tests/test-generate.mjs — the type-scale engine, under plain node.
// Each assertion's name is quoted by a case in tests/cases.md (Runs:).
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { generate, questions, gridLineHeight, sizeWords, CHOICES } from '../scripts/generate.mjs';

const SCRIPT = fileURLToPath(new URL('../scripts/generate.mjs', import.meta.url));
let n = 0;
const t = (name, fn) => { fn(); n++; console.log('ok', name); };

// every choice answered, as a context document's rulings would give them
const RULED = {
  scope: 'ui', ratio: 1.125, base: 16, lineHeight: 'grid',
  families: { text: 'Text Face', display: 'Text Face Display' },
  weights: { body: 400, label: 500, heading: 600, display: 500, code: 400 },
  labels: [12, 14, 16], primitives: 'Global primitives', collection: 'Text styles', phone: true,
  display: 1, displayCut: 'none', drop: 'none', exceptions: 'none', phoneHold: 'auto', phoneSizes: 'none',
};
// the knowledge base's worked example (research/foundations/type-on-a-phone.md)
const WORKED = { ...RULED, families: { ...RULED.families, code: 'Code Face' }, scope: 'content', lineHeight: 'role', above: 13, drop: [26, 32, 42, 52, 58, 66], exceptions: { 46: 48, 74: 72 }, displayCut: 28 };
const style = (r, name, mode = 'desktop') => {
  const s = r.styles[mode].find(x => x.name === name);
  assert.ok(s, `no style ${name}`);
  return s;
};

t('no recorded preferences: nine questions, nothing generated', () => {
  const r = generate({});
  assert.equal(r.questions.length, 9);
  assert.equal(r.styles, undefined);
  assert.equal(r.list, undefined);
  assert.deepEqual(r.questions.map(q => q.keys.join('+')), CHOICES.map(c => c.keys.join('+')));
});

t('the CLI exits 2 with the questions when a choice is missing', () => {
  let code = 0, out = '';
  try { execFileSync('node', [SCRIPT, '--scope', 'ui'], { encoding: 'utf8' }); } catch (e) { code = e.status; out = e.stdout; }
  assert.equal(code, 2);
  assert.equal(JSON.parse(out).questions.length, 8);
});

t('every choice recorded: no questions, a scale', () => {
  assert.deepEqual(questions(RULED), []);
  const r = generate(RULED);
  assert.equal(r.questions, undefined);
  assert.ok(r.styles.desktop.length > 0);
});

t('one choice missing: only that question is asked', () => {
  const { weights, ...rest } = RULED;
  const q = questions(rest);
  assert.deepEqual(q.map(x => x.keys), [['weights']]);
});

t('recommended answers come first: grid for product UI, role for content, labels medium', () => {
  const lh = s => questions({ scope: s }).find(q => q.keys[0] === 'lineHeight').recommended;
  assert.equal(lh('ui'), 'grid');
  assert.equal(lh('content'), 'role');
  const w = questions({}).find(q => q.keys[0] === 'weights').recommended;
  assert.deepEqual(w, { body: 400, label: 500, heading: 600, display: 500, code: 400 });
  assert.deepEqual(questions({}).find(q => q.keys[0] === 'labels').recommended, [12, 14, 16]);
});

t("grid line heights match the 2026-11-15 run's ramp", () => {
  // [size, role ratio, expected px]: 40/44, 32/40, 24/28, 20/24, 18/28, 16/24, 14/20, 12/16, labels 16/20, 14/20, 12/16
  const ramp = [[40, 1.1, 44], [32, 1.2, 40], [24, 1.2, 28], [20, 1.2, 24], [18, 1.5, 28], [16, 1.5, 24], [14, 1.5, 20], [12, 1.5, 16], [16, 1.3, 20], [14, 1.3, 20], [12, 1.3, 16]];
  for (const [size, ratio, px] of ramp) assert.equal(gridLineHeight(ratio, size), px, `${size} at ${ratio}`);
});

t('grid mode writes px on 4px and the unitless value the build computes', () => {
  const r = generate(RULED);
  for (const s of r.styles.desktop) assert.equal(s.lineHeight.px % 4, 0, s.name);
  assert.equal(style(r, 'Label/sm').lineHeight.css, 1.3333);
  assert.ok(r.warnings.some(w => w.includes('stepped onto 4px')));
});

t('labels at 12, 14 and 16 as Label/sm, md and lg', () => {
  const r = generate(RULED);
  const labels = r.styles.desktop.filter(s => s.role === 'label').map(s => [s.name, s.size]);
  assert.deepEqual(labels, [['Label/sm', 12], ['Label/md', 14], ['Label/lg', 16]]);
  assert.throws(() => generate({ ...RULED, labels: [12, 13, 16] }), /label size 13 is not on the list/);
});

t('variables mirror style names in the named collection, with Desktop and Mobile', () => {
  const r = generate(RULED);
  const v = r.variables.styles;
  assert.equal(v.collection, 'Text styles');
  assert.deepEqual(v.modes, ['Desktop', 'Mobile']);
  const names = v.variables.map(x => x.name);
  assert.ok(names.includes('Heading/lg/Line height'));
  assert.ok(names.includes('Label/sm/Font size'));
  assert.ok(!names.some(x => x.startsWith('Font size/') || x.startsWith('Line height/')), 'no Font size/<Role>/<size> grouping');
  assert.equal(names.length, r.styles.desktop.length * 2);
});

t('family primitives by role, never by classification; display binds the display family at 0 tracking', () => {
  const r = generate(RULED);
  const fam = r.variables.primitives.families.map(f => f.name);
  assert.ok(fam.includes('Font/Family/text') && fam.includes('Font/Family/display'));
  assert.ok(!fam.some(f => /sans|serif/i.test(f)));
  const d = style(r, 'Display/lg');
  assert.equal(d.family, 'Font/Family/display');
  assert.equal(d.tracking.figma, '0%');
});

t('type primitives go in the shared collection the project names', () => {
  const r = generate(RULED);
  assert.equal(r.variables.primitives.collection, 'Global primitives');
  assert.ok(r.variables.primitives.sizes.some(s => s.name === 'Font/Size/100' && s.value === 16));
  assert.ok(r.variables.primitives.weights.some(w => w.name === 'Font/Weight/medium'));
});

t('rounding to 2px adds 26, 32 and 42 beside 28 and 36', () => {
  const sizes = generate(RULED).list.map(s => s.px);
  for (const px of [26, 28, 32, 36, 42]) assert.ok(sizes.includes(px), `${px}`);
});

t("the worked example's ten sizes, with 48 and 72 as named exceptions", () => {
  const r = generate(WORKED);
  assert.deepEqual(r.list.map(s => s.px), [12, 14, 16, 18, 20, 22, 28, 36, 48, 72]);
  assert.deepEqual(r.exceptions.map(e => [e.rounded, e.published]), [[46, 48], [74, 72]]);
  assert.equal(r.list.find(s => s.px === 16).name, 'Font/Size/100');
});

t('content takes reading-site sizes, not the strict stride: 48, 28, 22, 18', () => {
  const r = generate(WORKED);
  const lv = r.content.levels;
  assert.deepEqual(['h1', 'h2', 'h3', 'h4'].map(x => lv[x].size), [48, 28, 22, 18]);
  const h2 = r.content.checks.find(c => c.level === 'h2' && c.strictStride);
  assert.equal(h2.strictStride.px, 36);
  assert.equal(h2.strictAgrees, false);
});

t('phone: body holds, headings step down the list, title near 1.6x the body, no collision', () => {
  const r = generate(WORKED);
  for (const name of ['Body/lg', 'Body/md', 'Label/sm', 'Code', 'Heading/2xs']) assert.equal(style(r, name, 'phone').size, style(r, name).size, name);
  assert.equal(style(r, 'Heading/xl', 'phone').size, 28);
  assert.equal(style(r, 'Heading/md', 'phone').size, 22);
  assert.equal(style(r, 'Heading/sm', 'phone').size, 20);
  assert.deepEqual(r.phone.checks.collisions, []);
  assert.deepEqual(r.phone.checks.bodyShrunk, []);
  assert.deepEqual(r.phone.checks.zoom, []);
});

t('recommended answers give no phone collision', () => {
  assert.deepEqual(generate(RULED).phone.checks.collisions, []);
});

t('phone collision is reported when two levels land on one size', () => {
  const r = generate({ ...RULED, phoneSizes: { 'Heading/xs': 18 } }); // the lowest heading already steps onto 18
  assert.ok(r.phone.checks.collisions.length > 0);
  const r2 = generate({ ...WORKED, phoneSizes: { 'Heading/md': 20 } });
  assert.ok(r2.phone.checks.collisions.some(c => c.levels.includes('h2') && c.levels.includes('h3')));
});

t('tracking in half-percent steps from the anchors, capped at -2%', () => {
  const r = generate(RULED);
  for (const s of r.styles.desktop) {
    const pct = parseFloat(s.tracking.figma);
    assert.equal(pct * 2, Math.round(pct * 2), s.name);
    assert.ok(pct >= -2, s.name);
  }
  assert.equal(style(r, 'Label/md').tracking.figma, '-0.5%');
  assert.equal(style(r, 'Label/md').tracking.css, '-0.005em');
});

t('refuses a ratio the knowledge base does not give', () => {
  assert.throws(() => generate({ ...RULED, ratio: 1.25 }), /1.125 or 1.2/);
});

t('t-shirt words centre on md', () => {
  assert.deepEqual(sizeWords(6), ['2xs', 'xs', 'sm', 'md', 'lg', 'xl']);
  assert.deepEqual(sizeWords(3), ['sm', 'md', 'lg']);
});

// a real run: Project A's rulings (2026-11-15), a published list, the Figma scale it built
const PROJECT_A = {
  ...RULED, list: [12, 14, 16, 18, 20, 24, 32, 40], ratio: undefined, families: { text: 'Inter', display: 'Inter Display' },
  weights: { body: 400, label: 500, heading: 600, display: 400 }, displayCut: 'none',
};

t("a published list reproduces Project A's scale", () => {
  const r = generate(PROJECT_A);
  assert.equal(r.questions, undefined);
  const got = r.styles.desktop.map(s => `${s.name} ${s.size}`);
  assert.deepEqual(got, ['Label/sm 12', 'Label/md 14', 'Label/lg 16', 'Body/sm 14', 'Body/md 16', 'Body/lg 18',
    'Heading/sm 20', 'Heading/md 24', 'Heading/lg 32', 'Display/lg 40']);
  for (const [name, px] of [['Display/lg', 32], ['Heading/lg', 24], ['Heading/md', 20], ['Heading/sm', 18], ['Body/lg', 18]]) assert.equal(style(r, name, 'phone').size, px, name);
  assert.deepEqual(r.phone.checks.collisions, []);
  assert.throws(() => generate({ ...PROJECT_A, drop: [14] }), /published list/);
});

t('a fully recorded run asks nothing', () => {
  assert.deepEqual(questions(PROJECT_A), []);
  assert.deepEqual(questions(RULED), []);
  const { phoneHold, phoneSizes, ...noPhone } = { ...RULED, phone: false };
  assert.deepEqual(questions(noPhone), []);
});

t('a sentinel where a number belongs is refused, never read as NaN', () => {
  assert.throws(() => generate({ ...PROJECT_A, display: 'none' }), /display none/);
  assert.throws(() => generate({ ...PROJECT_A, phoneHold: 'none' }), /phone-hold none/);
  assert.throws(() => generate({ ...PROJECT_A, ratio: 1.5 }), /not both/);
  assert.throws(() => generate({ ...PROJECT_A, list: [12, 0, 14] }), /above 0/);
  assert.equal(generate({ ...PROJECT_A, phone: 'no' }).styles.phone, undefined);
});

t('the CLI takes every choice with none and auto, and asks nothing', () => {
  const out = execFileSync('node', [SCRIPT, '--scope', 'ui', '--list', '12,14,16,18,20,24,32,40', '--base', '16', '--line-height', 'grid',
    '--families', 'text=Inter,display=Inter Display', '--weights', 'body=400,label=500,heading=600,display=400', '--labels', '12,14,16',
    '--primitives', 'Global', '--collection', 'Text styles', '--phone', 'yes', '--display', '1', '--display-cut', 'none', '--drop', 'none',
    '--exception', 'none', '--phone-hold', 'auto', '--phone-sizes', 'none'], { encoding: 'utf8' });
  const r = JSON.parse(out);
  assert.equal(r.questions, undefined);
  assert.equal(style(r, 'Display/lg', 'phone').size, 32);
});

console.log(`${n} passed`);
