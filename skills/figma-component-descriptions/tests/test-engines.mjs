#!/usr/bin/env node
// node tests/test-engines.mjs — from the skill folder. Runs the workflow's
// figma_execute bodies (scripts/enumerate.js, consumer-usage.js, composition.js,
// apply.js, sync-header.js) against a fake file, the way the bridge runs them:
// as the body of an async function given `figma`; and sweep-diff.mjs in node
// over enumerate.js's result. Each guard the prose names is
// also planted out once, to prove the assertion that covers it can fail.
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const read = (f) => readFileSync(join(HERE, '../scripts', f), 'utf8');
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
const run = (src, figma) => new AsyncFunction('figma', src)(figma);
const config = (src, obj) => {
  const out = src.replace(/^const CONFIG = \{[\s\S]*?^\};/m, 'const CONFIG = ' + JSON.stringify(obj) + ';');
  assert.notEqual(out, src, 'the CONFIG block is still where the test rewrites it');
  return out;
};
const plant = (src, from, to) => { const out = src.replace(from, to); assert.notEqual(out, src, 'plant site still there: ' + from); return out; };

const node = (props, children = []) => {
  const n = { children, ...props };
  for (const c of children) c.parent = n;
  const all = () => n.children.flatMap((c) => [c, ...(c.findAll ? c.findAll(() => true) : [])]);
  n.findAll = (fn) => all().filter(fn);
  n.findOne = (fn) => all().find(fn) || null;
  n.findAllWithCriteria = ({ types }) => all().filter((x) => types.includes(x.type));
  return n;
};
const fakeFigma = (pages) => {
  const root = node({ id: '0:0', type: 'DOCUMENT' }, pages);
  for (const p of pages) p.loadAsync = async () => {};
  const byId = new Map([root, ...root.findAll(() => true)].map((x) => [x.id, x]));
  const mixed = Symbol('mixed');
  const fonts = [];
  return { root, mixed, fonts, loadAllPagesAsync: async () => {}, getNodeByIdAsync: async (id) => byId.get(id) || null, loadFontAsync: async (f) => { fonts.push(f); } };
};
const instanceOf = (id, name, main) => { const i = node({ id, type: 'INSTANCE', name }); i.getMainComponentAsync = async () => main; return i; };

let n = 0;
const ok = (name, cond) => { n++; assert.ok(cond, name); console.log('ok', name); };

// ── enumerate.js ─────────────────────────────────────────────────────────────
{
  const iconMain = node({ id: '9:1', type: 'COMPONENT', name: 'Icon' });
  const v1 = node({ id: '1:2', type: 'COMPONENT', name: 'Size=S' });
  const v2 = node({ id: '1:3', type: 'COMPONENT', name: 'Size=L' });
  const button = node({ id: '1:1', type: 'COMPONENT_SET', name: 'Button', description: 'A button.' }, [v1, v2]);
  const notes = node({ id: '1:4', type: 'TEXT', name: 'Notes' });
  const docPage = node({ id: '0:1', type: 'PAGE', name: 'Button' }, [node({ id: '1:9', type: 'FRAME', name: 'Wrapper' }, [button, notes])]);
  // A component alone inside a wrapper frame, its own leaf content inside it.
  const chrome = node({ id: '2:1', type: 'COMPONENT', name: 'Status bar' }, [node({ id: '2:2', type: 'TEXT', name: '9:41' })]);
  const barePage = node({ id: '0:2', type: 'PAGE', name: 'Status bar' }, [node({ id: '2:9', type: 'FRAME', name: 'Frame' }, [chrome])]);
  const top = ['Default', 'Main'].map((s, i) => node({ id: '3:' + i, type: 'COMPONENT', name: 'Top bar / ' + s }));
  const priv = ['A', 'B'].map((s, i) => node({ id: '4:' + i, type: 'COMPONENT', name: '_Row / ' + s }));
  const solo = node({ id: '5:1', type: 'COMPONENT', name: 'Solo / Only' });
  const barPage = node({ id: '0:3', type: 'PAGE', name: 'Top bar' }, [...top, ...priv, solo, node({ id: '3:9', type: 'TEXT', name: 'Intro' }), instanceOf('3:8', 'Icon', iconMain)]);
  const empty = node({ id: '0:4', type: 'PAGE', name: 'Empty' });
  const figma = fakeFigma([docPage, barePage, barPage, empty]);
  const src = config(read('enumerate.js'), { internalPrefix: '_', separator: '/' });
  const out = await run(src, figma);
  const page = (name) => out.pages.find((p) => p.page === name);
  ok('enumerate: variants are not components; a set wrapped in a frame is found', JSON.stringify(page('Button').items.map((i) => i.name)) === '["Button"]' && page('Button').items[0].descLen === 9);
  ok('enumerate: empty pages are skipped', !page('Empty'));
  ok('enumerate: a page holding loose content is not alone', page('Button').alone === false && page('Top bar').alone === false);
  ok('enumerate: a component alone inside a wrapper frame is alone (step 2e)', page('Status bar').alone === true);
  ok('enumerate: two slash-siblings form a virtual set; private and lone ones do not', JSON.stringify(out.virtualSets.map((v) => [v.stem, v.members.length])) === '[["Top bar",2]]');
  const leaky = plant(src, '&& !inComponent(n)', '');
  ok('enumerate: (planted) without the inComponent guard the bare page reads as documented', (await run(leaky, figma)).pages.find((p) => p.page === 'Status bar').alone === false);
  for (const prefix of ['', null]) {
    const vs = (await run(config(read('enumerate.js'), { internalPrefix: prefix, separator: '/' }), figma)).virtualSets.map((v) => v.stem);
    ok('enumerate: internalPrefix ' + JSON.stringify(prefix) + ' marks nothing private (no throw, groups still form)', JSON.stringify(vs) === '["Top bar","_Row"]');
  }

  // step 8: the same sweep diffed against what the run wrote (sweep-diff.mjs)
  const { against } = await import('../scripts/sweep-diff.mjs');
  const d = against(out, ['1:1', '3:0', '2:1', '1:2'], { internalPrefix: '_' });
  const idsOf = (xs) => JSON.stringify(xs.map((x) => x.id));
  ok('sweep-diff: an untargeted public component is missed, with its page', idsOf(d.missed) === '["3:1","5:1"]' && d.missed[0].page === 'Top bar');
  ok('sweep-diff: untargeted private components are listed apart from the missed', idsOf(d.missedPrivate) === '["4:0","4:1"]');
  ok('sweep-diff: a target that is no component in the sweep (a variant) is out of scope', idsOf(d.outOfScope) === '["1:2"]');
  ok('sweep-diff: a target on an alone page is named for step 2e\'s usage check', idsOf(d.onAlonePages) === '["2:1"]' && d.unsure.length === 0);
  const m = against(out, { '1:1': 'A button.' });
  ok('sweep-diff: the --check descriptions map is a target list; with no prefix, every untargeted one is missed', d.swept === 7 && m.targets === 1 && m.missed.length === 5 && idsOf(m.unsure) === '["2:1"]');
  const dir = mkdtempSync(join(tmpdir(), 'sweep-diff-'));
  writeFileSync(join(dir, 'sweep.json'), JSON.stringify(out));
  writeFileSync(join(dir, 'all.json'), JSON.stringify(out.pages.flatMap((p) => p.items.map((i) => i.id))));
  const cli = (t) => spawnSync(process.execPath, [join(HERE, '../scripts/sweep-diff.mjs'), join(dir, 'sweep.json'), '--against', join(dir, t)]);
  writeFileSync(join(dir, 'some.json'), '["1:1"]');
  ok('sweep-diff: the command exits 1 on a miss and 0 when every component was written', cli('some.json').status === 1 && cli('all.json').status === 0);
  const ex = against(out, ['1:1', '3:0', '2:1'], { internalPrefix: '_', exclude: ['3:1', '1:1'] });
  ok('sweep-diff: an --exclude id (a 2b slot filler) is never missed, and one written anyway is out of scope', idsOf(ex.missed) === '["5:1"]' && idsOf(ex.excluded) === '["3:1"]' && ex.outOfScope.some((o) => o.id === '1:1' && /exclude/.test(o.reason)));
  const sc = against(out, ['1:1', '3:0'], { scope: ['Button'] });
  ok('sweep-diff: a one-page --scope run misses nothing on other pages, and a write there is out of scope', sc.missed.length === 0 && idsOf(sc.outOfScope) === '["3:0"]' && /scope/.test(sc.outOfScope[0].reason));
  const url = against(out, { targets: ['1-1'] }, { scope: ['Button'] });
  ok('sweep-diff: a --scope page the sweep never saw is named', JSON.stringify(against(out, ['1:1'], { scope: ['Button', 'Buton'] }).unknownScope) === '["Buton"]' && !('unknownScope' in d));
  const flag = (...a) => spawnSync(process.execPath, [join(HERE, '../scripts/sweep-diff.mjs'), join(dir, 'sweep.json'), ...a]);
  ok('sweep-diff: a flag with no value, or followed by another flag, is a usage error, exit 2', flag('--against', join(dir, 'all.json'), '--scope').status === 2 && flag('--against', '--scope', 'Button').status === 2 && /needs a value/.test(String(flag('--against', join(dir, 'all.json'), '--exclude').stderr)));
  ok('sweep-diff: a { targets } wrapper is unwrapped and a URL-form id reads as a node id', url.targets === 1 && url.outOfScope.length === 0 && url.missed.length === 0);
  ok('sweep-diff: a target object with no id is refused, naming the entry', (() => { try { against(out, [{ id: '1:1' }, { name: 'Button' }]); return false; } catch (e) { return /entry 1 has no id/.test(e.message); } })());
  writeFileSync(join(dir, 'noid.json'), '[{"name":"Button"}]');
  const bad = cli('noid.json');
  ok('sweep-diff: an input it cannot use exits 2 in one line naming the file, a miss exits 1', bad.status === 2 && String(bad.stderr).trim().split('\n').length === 1 && String(bad.stderr).includes("noid.json") && cli('missing.json').status === 2);
  rmSync(dir, { recursive: true });
}

// ── consumer-usage.js ────────────────────────────────────────────────────────
{
  const variant = node({ id: '1:2', type: 'COMPONENT', name: 'Size=S' });
  node({ id: '1:1', type: 'COMPONENT_SET', name: 'Button' }, [variant]);
  const badge = node({ id: '2:1', type: 'COMPONENT', name: 'Badge' });
  const screen = (id, name, kids) => node({ id, type: 'FRAME', name }, kids);
  const p1 = node({ id: '0:1', type: 'PAGE', name: 'Orders' }, [
    screen('5:1', 'Inbox', [screen('5:2', 'Row', [instanceOf('5:3', 'b', variant), instanceOf('5:4', 'c', badge)])]),
    screen('6:1', 'Detail', [instanceOf('6:2', 'b', variant)])
  ]);
  const gone = instanceOf('7:2', 'x', null);
  gone.getMainComponentAsync = async () => { throw new Error('The node with id "7:2" does not exist'); };
  const p2 = node({ id: '0:2', type: 'PAGE', name: 'Reports' }, [screen('7:1', 'List', [instanceOf('7:3', 'b', variant), gone])]);
  const figma = fakeFigma([p1, p2]);
  const out = await run(read('consumer-usage.js'), figma);
  ok('consumer-usage: a variant counts as its set, most used first, with its screens', JSON.stringify(out.components[0]) === JSON.stringify({ name: 'Button', count: 3, screens: ['Orders › Detail', 'Orders › Inbox', 'Reports › List'] }));
  ok('consumer-usage: the result survives JSON, the bridge\'s only channel', JSON.stringify(JSON.parse(JSON.stringify(out))) === JSON.stringify(out) && out.components[1].screens.length === 1);
  ok('consumer-usage: an instance whose main does not exist is counted, not fatal', out.broken === 1);
  gone.getMainComponentAsync = async () => { throw new TypeError('something else'); };
  ok('consumer-usage: any other error ends the read', await run(read('consumer-usage.js'), figma).then(() => false, (e) => e instanceof TypeError));
}

// ── composition.js ───────────────────────────────────────────────────────────
{
  const label = node({ id: '9:1', type: 'COMPONENT', name: 'Label' });
  const iconV = node({ id: '9:3', type: 'COMPONENT', name: 'Kind=Plus' });
  node({ id: '9:2', type: 'COMPONENT_SET', name: 'Icon' }, [iconV]);
  const on = node({ id: '1:2', type: 'COMPONENT', name: 'Icon=True' }, [instanceOf('1:5', 'Label', label), instanceOf('1:6', 'Icon', iconV)]);
  const off = node({ id: '1:3', type: 'COMPONENT', name: 'Icon=False' }, [instanceOf('1:7', 'Label', label)]);
  const set = node({ id: '1:1', type: 'COMPONENT_SET', name: 'Button' }, [off, on]);
  const figma = fakeFigma([node({ id: '0:1', type: 'PAGE', name: 'Button' }, [set])]);
  const src = config(read('composition.js'), { ids: ['1:1', '8:8'] });
  const [btn, missing] = await run(src, figma);
  ok('composition: a part in every variant is unconditional', btn.variantCount === 2 && btn.parts.find((p) => p.name === 'Label').inEvery === true);
  ok('composition: a part one axis reveals is read from the variant that has it, named by its set', JSON.stringify(btn.parts.find((p) => p.name === 'Icon')) === JSON.stringify({ name: 'Icon', inEvery: false, variants: ['Icon=True'] }));
  ok('composition: an unknown id is reported, not fatal', missing.error === 'not found');
  const firstOnly = plant(src, "n.type === 'COMPONENT_SET' ? n.children : [n]", "n.type === 'COMPONENT_SET' ? [n.children[0]] : [n]");
  ok('composition: (planted) reading children[0] alone loses the Icon', !(await run(firstOnly, figma))[0].parts.some((p) => p.name === 'Icon'));

  // figma-component-pass A5: one instance name resolving to a different main under each variant
  // (a stepper's `Step item`) yields both mains; a dedupe keyed on the name alone keeps the first.
  const horiz = node({ id: '6:3', type: 'COMPONENT', name: 'Step item / Horizontal' });
  const vert = node({ id: '6:4', type: 'COMPONENT', name: 'Step item / Vertical' });
  const h = node({ id: '6:6', type: 'COMPONENT', name: 'Layout=Horizontal' }, [instanceOf('6:8', 'Step item', horiz)]);
  const vv = node({ id: '6:7', type: 'COMPONENT', name: 'Layout=Vertical' }, [instanceOf('6:9', 'Step item', vert)]);
  const stepper = node({ id: '6:5', type: 'COMPONENT_SET', name: 'Stepper' }, [h, vv]);
  const fs = fakeFigma([node({ id: '0:6', type: 'PAGE', name: 'Stepper' }, [stepper])]);
  const srcS = config(read('composition.js'), { ids: ['6:5'] });
  const [st] = await run(srcS, fs);
  ok('composition: an instance name that resolves to a different main per variant keeps every main (component-pass A5)', JSON.stringify(st.parts) === JSON.stringify([{ name: 'Step item / Horizontal', inEvery: false, variants: ['Layout=Horizontal'] }, { name: 'Step item / Vertical', inEvery: false, variants: ['Layout=Vertical'] }]));
  const byName = plant(srcS, "const key = v.name + '::' + i.name;", "const key = i.name;");
  ok('composition: (planted) a dedupe keyed on the instance name alone keeps only the first main', (await run(byName, fs))[0].parts.length === 1);

  // A broken nested instance throws "does not exist": reported per instance, the rest still read.
  const ghost = node({ id: '7:5', type: 'INSTANCE', name: 'Ghost' });
  ghost.getMainComponentAsync = async () => { throw new Error('The node with id "7:9" does not exist'); };
  const card = node({ id: '7:1', type: 'COMPONENT', name: 'Card' }, [instanceOf('7:4', 'Label', label), ghost]);
  const f2 = fakeFigma([node({ id: '0:2', type: 'PAGE', name: 'Card' }, [card])]);
  const src2 = config(read('composition.js'), { ids: ['7:1'] });
  const [c] = await run(src2, f2);
  ok('composition: a broken nested instance is listed as broken and the healthy parts still read',
    JSON.stringify(c.broken) === JSON.stringify([{ variant: 'Card', instance: 'Ghost' }]) && c.parts.some((p) => p.name === 'Label'));
  // A main that resolves to null is just as unreadable: listed, never dropped in silence.
  ghost.getMainComponentAsync = async () => null;
  const [cNull] = await run(src2, f2);
  ok('composition: a nested instance whose main resolves to null is listed as broken, with the reason',
    cNull.broken.length === 1 && cNull.broken[0].instance === 'Ghost' && /did not resolve/.test(cNull.broken[0].reason) && cNull.parts.some((p) => p.name === 'Label'));
  ghost.getMainComponentAsync = async () => { throw new Error('network down'); };
  await assert.rejects(run(src2, f2), /network down/);
  ok('composition: (negative) any other error still rejects', true);

  // What sections.mjs reads: the interface, and the props bound to each part.
  const glyph = node({ id: '9:5', type: 'COMPONENT', name: 'Glyph' });
  const inner = instanceOf('6:7', 'Glyph', glyph);
  inner.componentPropertyReferences = { visible: 'Glyph shown#40:0' };   // the nested component's own prop
  const iconInst = instanceOf('6:6', 'Icon', iconV);
  iconInst.componentPropertyReferences = { mainComponent: 'Icon swap#2:1' };
  iconInst.children = [inner]; inner.parent = iconInst;
  iconInst.findAll = () => [inner];
  const wrap = node({ id: '6:5', type: 'FRAME', name: 'Leading', componentPropertyReferences: { visible: 'Show icon#3:0' } }, [iconInst]);
  const tagV = node({ id: '6:2', type: 'COMPONENT', name: 'Size=S' }, [wrap]);
  const tagV2 = node({ id: '6:3', type: 'COMPONENT', name: 'Size=L' }, [instanceOf('6:8', 'Label', label)]);
  const tag = node({ id: '6:1', type: 'COMPONENT_SET', name: 'Tag' }, [tagV, tagV2]);
  tag.componentPropertyDefinitions = { 'Size': { type: 'VARIANT', variantOptions: ['S', 'L'] }, 'Show icon#3:0': { type: 'BOOLEAN' }, 'Icon swap#2:1': { type: 'INSTANCE_SWAP' } };
  const [t] = await run(config(read('composition.js'), { ids: ['6:1'] }), fakeFigma([node({ id: '0:6', type: 'PAGE', name: 'Tag' }, [tag])]));
  ok('composition: the interface is returned with the #id suffix stripped, variant options kept',
    JSON.stringify(t.properties) === JSON.stringify([{ name: 'Size', type: 'VARIANT', options: ['S', 'L'] }, { name: 'Show icon', type: 'BOOLEAN' }, { name: 'Icon swap', type: 'INSTANCE_SWAP' }]));
  const icon = t.parts.find((p) => p.name === 'Icon');
  ok('composition: a part under a boolean-bound layer carries it as toggledBy, and its swap prop as swappedBy',
    JSON.stringify(icon.toggledBy) === JSON.stringify(['Show icon']) && JSON.stringify(icon.swappedBy) === JSON.stringify(['Icon swap']));
  ok('composition: a prop of a nested component is not read as the subject\'s',
    !JSON.stringify(t.parts).includes('Glyph shown') && JSON.stringify(t.variantNames) === JSON.stringify(['Size=S', 'Size=L']));
}

// ── apply.js ─────────────────────────────────────────────────────────────────
{
  const a = node({ id: '1:1', type: 'COMPONENT', name: 'A', description: 'old', descriptionMarkdown: 'old' });
  const b = node({ id: '1:2', type: 'COMPONENT', name: 'B', description: 'stale plain text', descriptionMarkdown: 'stale' });
  const figma = fakeFigma([node({ id: '0:1', type: 'PAGE', name: 'P' }, [a, b])]);
  const md = 'A does a thing.\n\n## Usage\n- Here';
  const out = await run(config(read('apply.js'), { docs: [['1:1', md], ['1:2', ''], ['1:9', md]] }), figma);
  ok('apply: writes descriptionMarkdown and reports its length', a.descriptionMarkdown === md && out[0].ok && out[0].len === md.length);
  ok('apply: an empty string clears both fields', b.descriptionMarkdown === '' && b.description === '' && out[1].ok);
  ok('apply: a missing id is reported and the batch goes on', out[2].ok === false && out[2].err === 'not found');
}

// ── sync-header.js ───────────────────────────────────────────────────────────
{
  const mkHeader = (id, text) => node({ id, type: 'INSTANCE', name: 'Header' }, [node({ id: id + 'b', type: 'TEXT', name: 'Body', characters: text, fontName: { family: 'Inter', style: 'Regular' } })]);
  // A component holding a layer named like the header: it must never be written.
  const decoy = mkHeader('1:8', 'inner');
  const comp = node({ id: '1:1', type: 'COMPONENT', name: 'Button' }, [decoy]);
  const header = mkHeader('1:9', 'Buttons start actions');
  const p1 = node({ id: '0:1', type: 'PAGE', name: 'Button' }, [comp, node({ id: '1:7', type: 'FRAME', name: 'Docs' }, [header])]);
  const top = ['A', 'B'].map((s, i) => node({ id: '2:' + i, type: 'COMPONENT', name: 'Top bar / ' + s }));
  const topHeader = mkHeader('2:9', 'Something else entirely.');
  const p2 = node({ id: '0:2', type: 'PAGE', name: 'Top bar' }, [...top, topHeader]);
  const lone = node({ id: '3:1', type: 'COMPONENT', name: 'Lone' });
  const p3 = node({ id: '0:3', type: 'PAGE', name: 'Lone' }, [lone]);
  const mixedHeader = mkHeader('4:9', 'x');
  const mixedComp = node({ id: '4:1', type: 'COMPONENT', name: 'Mixed' });
  const p4 = node({ id: '0:4', type: 'PAGE', name: 'Mixed' }, [mixedComp, mixedHeader]);
  const figma = fakeFigma([p1, p2, p3, p4]);
  mixedHeader.children[0].fontName = figma.mixed;
  const shared = 'A top bar sits at the top of a screen. More.\n\n## Usage\n- Here';
  const src = config(read('sync-header.js'), { headerName: 'Header', headerBodyLayer: 'Body', docs: [
    ['1:1', 'Buttons start actions in a `Form`. They are pressed.\n\n## Usage\n- x'],
    ['2:0', shared], ['2:1', shared], ['3:1', 'Lone.'], ['4:1', 'Mixed.']] });
  const out = await run(src, figma);
  const row = (page) => out.find((r) => r.page === page);
  ok('sync-header: the first sentence, backticks stripped, goes into the header outside any component', header.children[0].characters === 'Buttons start actions in a Form.' && row('Button').status === 'written' && !row('Button').drift);
  ok('sync-header: a layer named like the header inside a component is never written', decoy.children[0].characters === 'inner');
  ok('sync-header: a virtual set writes its shared sentence once, and replaced text is reported as drift', out.filter((r) => r.page === 'Top bar').length === 1 && topHeader.children[0].characters === 'A top bar sits at the top of a screen.' && row('Top bar').drift === 'Something else entirely.');
  ok('sync-header: no header and mixed fonts are report lines, not writes', row('Lone').status === 'no header' && row('Mixed').status === 'mixed font' && mixedHeader.children[0].characters === 'x');
  ok('sync-header: the font is loaded before each write', figma.fonts.length === 2);
  const decoy2 = node({ id: '5:1', type: 'COMPONENT', name: 'Two' });
  p1.children.push(decoy2); decoy2.parent = p1;
  const conflict = await run(config(read('sync-header.js'), { headerName: 'Header', headerBodyLayer: 'Body', docs: [['1:1', 'One.'], ['5:1', 'Two.']] }), fakeFigma([p1]));
  ok('sync-header: two components on one page with different sentences write nothing', conflict[0].status === 'not written' && header.children[0].characters === 'Buttons start actions in a Form.');
  decoy.children[0].characters = 'inner';
  const unguarded = plant(src, '.find(h => !inComponent(h))', '.find(() => true)');
  await run(unguarded, fakeFigma([p1]));
  ok('sync-header: (planted) without the inComponent guard the component\'s own layer is written', decoy.children[0].characters !== 'inner');
}

console.log(`${n}/${n} passed`);
