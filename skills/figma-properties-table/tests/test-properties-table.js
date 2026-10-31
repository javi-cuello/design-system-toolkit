/* Tests for the load protocol — run: node tests/test-properties-table.js
 *
 * Only the protocol is testable here. Everything PT does needs a live Figma
 * node, so this covers the one part that does not: getting the script into the
 * file intact. That step used to be unverifiable, which is why it is the part
 * worth testing.
 */
const path = require('path');
const { factory, hash } = require('../scripts/properties-table.js');

let pass = 0, fail = 0; const failures = [];
function eq(actual, expected, label) {
  if (JSON.stringify(actual) === JSON.stringify(expected)) { pass++; return; }
  fail++; failures.push(label + '\n    expected ' + JSON.stringify(expected) + '\n    actual   ' + JSON.stringify(actual));
}
function ok(c, label) { eq(!!c, true, label); }

/* --- the file must load in node without touching Figma ---------------------
   node computing the expected hash is the whole point; if requiring the file
   executed the factory it would throw on `figma` and the check would be
   impossible. */
ok(typeof factory === 'function', 'factory is exported for node');
ok(typeof hash === 'function', 'hash is exported for node');
ok(typeof globalThis.PT === 'undefined',
  'requiring the file must NOT run the factory — it would throw on figma and make the hash uncomputable');

/* --- toString round-trips, which is what lets the script cache itself ------ */
const src = factory.toString();
ok(src.length > 20000, 'factory source is the real body, not a stub');
ok(src.indexOf('PT.profile') !== -1, 'source carries the API it is supposed to define');
const revived = (0, eval)('(' + src + ')');
ok(typeof revived === 'function', 'source round-trips back into a callable factory');

/* --- the variant-name reader is the toolkit's one, written out because Figma imports nothing --- */
ok(src.indexOf('const variantValues = ' + require('../../../tools/shared/names.js').variantValues.toString() + ';') !== -1,
  'the variant-name reader is tools/shared/names.js variantValues, character for character');

/* --- the hash is stable, and blind to formatting but not to content --------
   Whitespace is normalised out so the engine reformatting the source is not a
   false alarm; anything else must still register, or the check is decorative. */
eq(hash(src), hash(src), 'hash is stable across calls');
eq(hash('a b  c'), hash('abc'), 'hash ignores whitespace — reformatting is not corruption');
eq(hash('  a\n\tb c '), hash('abc'), 'hash ignores newlines and tabs too');
ok(hash(src) !== hash(src.replace('PT.profile', 'PT.prof1le')),
  'a single altered character changes the hash — substitution is caught');
ok(hash(src) !== hash(src.slice(0, -200)),
  'a truncated paste changes the hash — the likeliest corruption of a large paste');
ok(hash('') !== hash('x'), 'empty is distinguishable from non-empty');

const STRIP = globalThis.__PT_STRIP, HASH = hash, FAC = factory;

/* --- the hash covers CODE, not prose -------------------------------------
   Comments were 6,667 of the 24,330 characters an agent had to transcribe
   exactly, and none of them execute. Counting them made the gate reject
   functionally correct pastes over a reworded sentence. A state machine, not
   a regex, because a regex cannot tell a comment from "//" inside a string or
   a slash inside a regex literal. */
eq(STRIP('a; // gone'), 'a; ', 'strip: line comment removed');
eq(STRIP('a /* gone */ b'), 'a   b', 'strip: block comment removed');
eq(STRIP("var u='http://x';"), "var u='http://x';", 'strip: // inside a string survives');
eq(STRIP('var u="a/*b*/c";'), 'var u="a/*b*/c";', 'strip: /* */ inside a string survives');
eq(STRIP('s.replace(/\\s+/g,"");'), 's.replace(/\\s+/g,"");', 'strip: regex literal survives');
eq(STRIP('var r=/[/]/;'), 'var r=/[/]/;', 'strip: slash inside a regex char class survives');
eq(STRIP('var t=`a//b`;'), 'var t=`a//b`;', 'strip: // inside a template literal survives');
eq(STRIP('x = a / b; // c'), 'x = a / b; ', 'strip: division is not mistaken for a regex');

const REAL = FAC.toString();
ok(HASH(REAL.replace(/\/\/ [A-Z][^\n]{20,}/, '// completely different wording, much longer than the original was')) === HASH(REAL),
  'rewording a comment does NOT change the hash — the point of the change');
ok(HASH(REAL) !== HASH(REAL.replace('function', 'functi0n')), 'altered code is still caught');
ok(HASH("var a='http://x';") !== HASH("var a='';"), 'content inside strings is still hashed');

/* --- hash.js must agree with the library, or the comparison is meaningless -- */
const { execSync } = require('child_process');
const printed = execSync('node ' + path.join(__dirname, '..', 'scripts', 'hash.js'))
  .toString().split('\n')[0].trim();
eq(printed, hash(src), 'scripts/hash.js prints exactly what the library computes');

/* --- one broken layer does not end an audit --------------------------------
   A layer three instances deep can throw "does not exist" on every read of its
   children, name or parent; Figma's own findAll then throws as a whole. The
   audit must finish, count it, and still see the table and component beside it. */
(async () => {
  const gone = () => { throw new Error('in get_children: The node (instance sublayer or table cell) with id I1:2;3:4 does not exist'); };
  const node = (props, children = []) => {
    const n = Object.assign({ children }, props);
    children.forEach(c => { if (!Object.getOwnPropertyDescriptor(c, 'parent')) c.parent = n; });
    return n;
  };
  const broken = { id: 'I1:2;3:4', type: 'INSTANCE' };
  ['children', 'name', 'parent'].forEach(k => Object.defineProperty(broken, k, { get: gone }));
  const variant = node({ id: '2:1', type: 'COMPONENT', name: 'Size=md' });
  const set = node({ id: '2:0', type: 'COMPONENT_SET', name: 'Badge', componentPropertyDefinitions: { Size: { type: 'VARIANT', variantOptions: ['md'] } } }, [variant]);
  const title = node({ id: '3:1', type: 'INSTANCE', name: 'Title', componentProperties: { 'Text#0:1': { type: 'TEXT', value: 'Badge' } } });
  const table = node({ id: '3:0', type: 'INSTANCE', name: 'Properties table', componentProperties: {} }, [title]);
  const example = node({ id: '4:0', type: 'FRAME', name: 'Example' }, [broken]);
  const page = node({ id: '0:1', type: 'PAGE', name: 'Badge', loadAsync: async () => {} }, [set, table, example]);
  // Figma's traversal throws when it meets the broken layer, as it does live.
  const all = (n) => { const out = []; for (const c of n.children) { out.push(c); out.push(...all(c)); } return out; };
  page.findAll = (fn) => all(page).filter(fn);
  page.findAllWithCriteria = () => all(page).filter(n => n.type === 'INSTANCE');
  table.findAll = (fn) => all(table).filter(fn);
  const cfg = { schema: 4, tableName: 'Properties table', titleNodeName: 'Title', titleTextProp: 'Text', rowsSlotName: null, emptyProp: null, statusMarker: '🚧' };
  // Plugin data by key: the config, and the rows PT.rows() loads from the contract.
  const data = {};
  const pluginData = (c) => ({ getPluginData: (k) => (k === 'pt.config.v2' ? JSON.stringify(c) : data[k] || ''), setPluginData: (k, v) => { data[k] = v; } });
  globalThis.figma = { root: Object.assign({ children: [page] }, pluginData(cfg)) };
  delete globalThis.PT;
  const PT = factory();
  let out, threw = null;
  try { out = await PT.audit(); } catch (e) { threw = e.message; }
  ok(!threw, 'a broken instance layer does not end PT.audit (' + threw + ')');
  ok(out && out.unreadable > 0, 'the skipped layer is counted as unreadable');
  ok(out && out.tables === 1 && !out.problems.some(p => /no title|matches no component/.test(p)), 'the table beside it is still read and its title still matched');
  // Only "does not exist" is a broken layer (review S13): any other error is a
  // fault, and counting it as unreadable would hide it behind a green audit.
  const odd = { id: '4:9', type: 'INSTANCE', children: [] };
  Object.defineProperty(odd, 'name', { get: () => { throw new TypeError('something else'); } });
  example.children.push(odd); odd.parent = example;
  delete globalThis.PT;
  let threwOdd = null;
  try { await factory().audit(); } catch (e) { threwOdd = e; }
  ok(threwOdd instanceof TypeError, 'any other error in a node read ends PT.audit rather than counting as unreadable');
  example.children.pop();
  // Round 4 of the 2026-10-02 review: the containment scan turned every error
  // from getMainComponentAsync into "no main component". A second family on
  // the page makes the scan run; its variant holds an instance whose main
  // cannot be read.
  const inner = node({ id: '5:2', type: 'INSTANCE', name: 'Icon', componentProperties: {} });
  const chipVariant = node({ id: '5:1', type: 'COMPONENT', name: 'Size=md' }, [inner]);
  const chipSet = node({ id: '5:0', type: 'COMPONENT_SET', name: 'Chip', componentPropertyDefinitions: { Size: { type: 'VARIANT', variantOptions: ['md'] } } }, [chipVariant]);
  page.children.push(chipSet); chipSet.parent = page;
  chipVariant.findAll = (fn) => all(chipVariant).filter(fn);
  inner.getMainComponentAsync = async () => { throw new TypeError('something else'); };
  delete globalThis.PT;
  let threwMain = null;
  try { await factory().plan('Badge'); } catch (e) { threwMain = e; }
  ok(threwMain instanceof TypeError, 'a main that cannot be read for any reason but "does not exist" ends PT.plan');
  inner.getMainComponentAsync = async () => { throw new Error('The node with id "I5:2;1:1" does not exist'); };
  delete globalThis.PT;
  let planned = null, threwGone = null;
  try { planned = await factory().plan('Badge'); } catch (e) { threwGone = e.message; }
  ok(!threwGone && planned, 'and a main that does not exist is skipped (' + threwGone + ')');
  page.children.pop();
  // Round 4: the three fallbacks from Figma's own search to the walk catch
  // "does not exist" only; a search failing any other way ends the call.
  const search = page.findAllWithCriteria, tableSearch = table.findAll;
  page.findAllWithCriteria = () => { throw new TypeError('search broke'); };
  delete globalThis.PT; let threwSearch = null;
  try { await factory().audit(); } catch (e) { threwSearch = e; }
  ok(threwSearch instanceof TypeError, "a page search failing any other way than \"does not exist\" ends PT.audit (tablesOn)");
  delete globalThis.PT; threwSearch = null;
  try { await factory().detect(); } catch (e) { threwSearch = e; }
  ok(threwSearch instanceof TypeError, 'and PT.detect (the slot scan)');
  page.findAllWithCriteria = search;
  table.findAll = () => { throw new TypeError('search broke'); };
  delete globalThis.PT; threwSearch = null;
  try { await factory().audit(); } catch (e) { threwSearch = e; }
  ok(threwSearch instanceof TypeError, 'and a node search (descendants)');
  table.findAll = tableSearch;
  // A8: a leading status marker is a status, not part of the name (figma-standard rule 13).
  // A table titled without the marker matches its component; one titled with it
  // is reported, so a table written before the rule shows up in the audit.
  example.children.splice(example.children.indexOf(broken), 1);
  set.name = '🚧 Badge';
  delete globalThis.PT;
  let marked = await factory().audit();
  ok(!marked.problems.some(p => /matches no component|status marker/.test(p)), 'A8: a title without the status marker matches a 🚧 component');
  title.componentProperties['Text#0:1'].value = '🚧 Badge';
  delete globalThis.PT;
  marked = await factory().audit();
  ok(marked.problems.some(p => /carries the status marker/.test(p)), 'A8: a title that keeps the marker is reported');
  set.name = '_🚧 Badge'; title.componentProperties['Text#0:1'].value = '_Badge';
  delete globalThis.PT;
  marked = await factory().audit();
  ok(!marked.problems.some(p => /matches no component|status marker/.test(p)), 'A8: a private part marked after its _ matches a title without the marker');
  set.name = '🚧 Badge'; title.componentProperties['Text#0:1'].value = 'Badge';
  delete cfg.statusMarker; title.componentProperties['Text#0:1'].value = 'Badge';
  delete globalThis.PT;
  marked = await factory().audit();
  ok(marked.problems.some(p => /matches no component/.test(p)), 'A8: without a statusMarker in the config, nothing is stripped, so the unmarked title matches no component');
  cfg.statusMarker = '🚧';
  set.name = '[🚫 DEPRECATED] - Badge'; title.componentProperties['Text#0:1'].value = '[🚫 DEPRECATED] - Badge';
  delete globalThis.PT;
  marked = await factory().audit();
  ok(!marked.problems.length, 'A8: a name that starts with a bracket keeps its marker in the title');
  // A9: a renamed property leaves a well-formed table with a stale row; the
  // audit compares each row's name with the component's properties.
  {
    const tagSet = node({ id: '7:0', type: 'COMPONENT_SET', name: 'Tag', componentPropertyDefinitions: { Size: { type: 'VARIANT', variantOptions: ['md'] }, 'Show icon#1:0': { type: 'BOOLEAN' } } }, [node({ id: '7:1', type: 'COMPONENT', name: 'Size=md' })]);
    const cell = (id, v) => node({ id, type: 'INSTANCE', name: 'Cell', componentProperties: { 'Text#9:0': { type: 'TEXT', value: v } } });
    const row = (id, v) => { const r = node({ id, type: 'INSTANCE', name: 'Row', componentProperties: {} }, [cell(id + 'a', v), cell(id + 'b', 'Variant')]); r.findAll = (fn) => all(r).filter(fn); return r; };
    const rowsSlot = node({ id: '8:2', type: 'SLOT', name: 'Rows' }, [row('8:3', 'Size'), row('8:4', 'Icon')]);
    const tTitle = node({ id: '8:1', type: 'INSTANCE', name: 'Title', componentProperties: { 'Text#0:1': { type: 'TEXT', value: 'Tag' } } });
    const tTable = node({ id: '8:0', type: 'INSTANCE', name: 'Properties table', componentProperties: {} }, [tTitle, rowsSlot]);
    tTable.findAll = (fn) => all(tTable).filter(fn);
    const tPage = node({ id: '0:2', type: 'PAGE', name: 'Tag', loadAsync: async () => {} }, [tagSet, tTable]);
    tPage.findAll = (fn) => all(tPage).filter(fn);
    tPage.findAllWithCriteria = () => all(tPage).filter(n => n.type === 'INSTANCE');
    const tcfg = Object.assign({}, cfg, { rowsSlotName: 'Rows', cellTextProp: 'Text' });
    const PT10 = async () => { delete globalThis.PT; return factory().plan('Tag'); };
    globalThis.figma = { root: Object.assign({ children: [tPage] }, pluginData(tcfg)) };
    delete globalThis.PT;
    let a9 = await factory().audit();
    ok(a9.problems.some(p => /Tag: no rows from a stored contract/.test(p)), 'A10: a table whose component has no rows from a stored contract is reported, not compared with the file');
    const planned10 = await PT10();
    ok(planned10.skipped && /no rows from a stored contract for Tag: take a snapshot/.test(planned10.skipped), 'A10: PT.plan skips a page whose component has no stored contract rows, saying to take a snapshot');
    // the contract's rows: Size and Show icon (the file's definitions are not read)
    tagSet.componentPropertyDefinitions = {};
    factory().rows({ Tag: { name: 'Tag', key: null, rows: [{ values: ['Size', 'Variant', 'md', '-'] }, { values: ['Show icon', 'Boolean', 'False (default)\nTrue', '-'] }] } });
    delete globalThis.PT;
    a9 = await factory().audit();
    ok(a9.problems.some(p => /rows do not match the properties; missing Show icon; stale Icon/.test(p)), 'A9: a row naming a renamed property is reported, with what is missing and what is stale');
    rowsSlot.children[1] = row('8:5', 'Show icon'); rowsSlot.children[1].parent = rowsSlot;
    delete globalThis.PT;
    a9 = await factory().audit();
    ok(!a9.problems.some(p => /rows do not match/.test(p)), 'A9: rows that match the properties raise nothing');
  }
  // A13: audit({ labels: true }) holds each table's subcomponent label to containment, as
  // plan() sets it, so a file documented by hand is checked before apply() rewrites it.
  {
    const chipMain = node({ id: '9:1', type: 'COMPONENT', name: 'Size=md' });
    const chipSet = node({ id: '9:0', type: 'COMPONENT_SET', name: 'Chip', componentPropertyDefinitions: { Size: { type: 'VARIANT', variantOptions: ['md'] } } }, [chipMain]);
    const inner = node({ id: '9:5', type: 'INSTANCE', name: 'Chip', getMainComponentAsync: async () => chipMain });
    const groupVariant = node({ id: '9:3', type: 'COMPONENT', name: 'Size=md' }, [inner]);
    const groupSet = node({ id: '9:2', type: 'COMPONENT_SET', name: 'Chip group', componentPropertyDefinitions: { Size: { type: 'VARIANT', variantOptions: ['md'] } } }, [groupVariant]);
    const titled = (id, name, sub) => node({ id, type: 'INSTANCE', name: 'Title', componentProperties: { 'Text#0:1': { type: 'TEXT', value: name }, 'Subcomponent#0:2': { type: 'BOOLEAN', value: sub } } });
    const table = (id, t) => { const x = node({ id, type: 'INSTANCE', name: 'Properties table', componentProperties: {} }, [t]); x.findAll = (fn) => all(x).filter(fn); return x; };
    const groupTitle = titled('9:11', 'Chip group', false), chipTitle = titled('9:13', 'Chip', false);
    const gPage = node({ id: '0:3', type: 'PAGE', name: 'Chip group', loadAsync: async () => {} }, [groupSet, chipSet, table('9:10', groupTitle), table('9:12', chipTitle)]);
    gPage.findAll = (fn) => all(gPage).filter(fn);
    gPage.findAllWithCriteria = ({ types }) => all(gPage).filter(n => (types || ['INSTANCE']).includes(n.type));
    groupSet.findAll = (fn) => all(groupSet).filter(fn); groupVariant.findAll = (fn) => all(groupVariant).filter(fn); chipMain.findAll = () => []; chipSet.findAll = (fn) => all(chipSet).filter(fn);
    const lcfg = Object.assign({}, cfg, { labelBoolProp: 'Subcomponent' });
    globalThis.figma = { root: Object.assign({ children: [gPage] }, pluginData(lcfg)) };
    delete globalThis.PT;
    const plain = await factory().audit();
    ok(!('labelsUnchecked' in plain) && !plain.problems.some(p => /labelled/.test(p)), 'A13: without opts.labels the audit makes no containment scan and says nothing of labels');
    delete globalThis.PT;
    const l1 = await factory().audit({ labels: true });
    ok(l1.problems.some(p => p === 'Chip group/Chip: labelled a component, but containment makes it a subcomponent') && !l1.problems.some(p => /Chip group\/Chip group: labelled/.test(p)), 'A13: a contained component\'s table not labelled a subcomponent is reported; the container\'s is not');
    chipTitle.componentProperties['Subcomponent#0:2'].value = true;
    delete globalThis.PT;
    const l2 = await factory().audit({ labels: true });
    ok(!l2.problems.some(p => /labelled/.test(p)) && Array.isArray(l2.labelsUnchecked) && !l2.labelsUnchecked.length, 'A13: labels that follow containment raise nothing');
  }
  // A14: detect reads the slot it measured. A table holding an earlier slot of
  // the same name with no cells used to be re-found by name and throw.
  {
    const cell = (id, v) => node({ id, type: 'INSTANCE', name: 'Cell', componentProperties: { 'Text#9:0': { type: 'TEXT', value: v } }, getMainComponentAsync: async () => null });
    const row = (id) => node({ id, type: 'INSTANCE', name: 'Row', componentProperties: {} }, [cell(id + 'a', 'Size'), cell(id + 'b', 'Variant'), cell(id + 'c', 'md')]);
    const bare = (id) => node({ id, type: 'INSTANCE', name: 'Tab', componentProperties: {} });
    const early = node({ id: '10:1', type: 'SLOT', name: 'Rows' }, [bare('10:2'), bare('10:3'), bare('10:7')]);
    const rows = node({ id: '10:4', type: 'SLOT', name: 'Rows' }, [row('10:5'), row('10:6')]);
    const dTable = node({ id: '10:0', type: 'INSTANCE', name: 'Properties table', componentProperties: {}, getMainComponentAsync: async () => null }, [early, rows]);
    const dPage = node({ id: '0:4', type: 'PAGE', name: 'Size', loadAsync: async () => {} }, [dTable]);
    for (const n of [dPage, ...all(dPage)]) n.findAll = (fn) => all(n).filter(fn);
    dPage.findAllWithCriteria = ({ types }) => all(dPage).filter(n => types.includes(n.type));
    globalThis.figma = { root: Object.assign({ children: [dPage] }, pluginData(null)) };
    delete globalThis.PT;
    let found, threw14 = null;
    try { found = await factory().detect(); } catch (e) { threw14 = e.message; }
    ok(!threw14 && found && found.tableName === 'Properties table' && found.columns === 3, 'A14: detect reads the slot it measured, not an earlier one of the same name (' + threw14 + ')');
    globalThis.figma = { root: Object.assign({ children: [dPage] }, pluginData(Object.assign({ schema: 4 }, found))) };
    delete globalThis.PT;
    const counted = await factory().audit();
    eq(counted.rows, 2, 'A14: the audit counts the rows slot with cells, not an earlier one of the same name');
    rows.children.length = 0;
    delete globalThis.PT;
    const emptied = await factory().audit();
    ok(emptied.problems.some(p => /empty table not using the empty variant/.test(p)), 'A14: with its rows gone, the empty rows slot is the one read, not the earlier one of the name');
  }
  // A15: a table seen on one page whose title names no component there is not
  // stored; one titled with a component on its page is.
  {
    const cell = (id, v) => node({ id, type: 'INSTANCE', name: 'Cell', componentProperties: { 'Text#9:0': { type: 'TEXT', value: v } }, getMainComponentAsync: async () => null });
    const row = (id) => node({ id, type: 'INSTANCE', name: 'Row', componentProperties: {} }, [cell(id + 'a', 'Size'), cell(id + 'b', 'Variant'), cell(id + 'c', 'md')]);
    const head = node({ id: '11:1', type: 'INSTANCE', name: 'Heading', componentProperties: { 'Text#0:1': { type: 'TEXT', value: 'Title' } } });
    const pTable = node({ id: '11:0', type: 'INSTANCE', name: 'Side panel', componentProperties: {}, getMainComponentAsync: async () => null }, [head, node({ id: '11:2', type: 'SLOT', name: 'Content' }, [row('11:3'), row('11:4')])]);
    const pSet = node({ id: '11:9', type: 'COMPONENT_SET', name: 'Pill', componentPropertyDefinitions: {} }, [node({ id: '11:10', type: 'COMPONENT', name: 'Size=md' })]);
    const pPage = node({ id: '0:5', type: 'PAGE', name: 'Pill', loadAsync: async () => {} }, [pSet, pTable]);
    for (const n of [pPage, ...all(pPage)]) n.findAll = (fn) => all(n).filter(fn);
    pPage.findAllWithCriteria = ({ types }) => all(pPage).filter(n => types.includes(n.type));
    const stored = {};
    globalThis.figma = { root: { children: [pPage], getPluginData: (k) => stored[k] || '', setPluginData: (k, v) => { stored[k] = v; } } };
    delete globalThis.PT;
    const refused = await factory().profile();
    ok(refused.error && /probably not a properties table/.test(refused.error) && refused.config && !stored['pt.config.v2'], 'A15: a one-page table titled with no component on its page is not stored, and its config is returned');
    head.componentProperties['Text#0:1'].value = 'Pill';
    delete globalThis.PT;
    const kept = await factory().profile();
    ok(!kept.error && kept.config.titleResolvedBy === 'value match' && !!stored['pt.config.v2'], 'A15: a one-page table titled with a component on its page is stored');
    pSet.name = '🚧 Pill';
    delete stored['pt.config.v2']; delete globalThis.PT;
    const marked15 = await factory().profile();
    ok(!marked15.error && !!stored['pt.config.v2'], 'A15: before any status marker is set, a title matches its component past a leading marker');
    head.componentProperties['Text#0:1'].value = 'Title';
    delete globalThis.PT;
    const again = await factory().profile({ force: true });
    ok(again.error && /the stored config is unchanged/.test(again.error), 'A15: a forced re-profile refused says the stored config is unchanged');
  }
  delete globalThis.figma; delete globalThis.PT;
  console.log('\n' + pass + ' passed, ' + fail + ' failed');
  if (failures.length) { console.log(failures.join('\n')); process.exit(1); }
})();
