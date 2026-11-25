#!/usr/bin/env node
/*
 * A library snapshot taken through the official Figma MCP (`use_figma`), with no Figma app open.
 *
 *   node mcp.mjs script                          # the code an agent passes to use_figma, on stdout
 *   node mcp.mjs parts                           # a large library: the read-only code that plans its parts
 *   node mcp.mjs parts <plan.json>               #   the calls to make, given what the plan returned, as JSON
 *   node mcp.mjs collect <project> <holder id>…  # read what the run (or every call of the parts) left, and deliver it
 *       [--file <key>]                           #   the library file it ran in, when the project routes several
 *       [--repo <dir>]                           #   into a copy of the project's repo instead: the equality proof
 *       [--save <file>]                          #   and keep the payload as a file
 *   node mcp.mjs cleanup                         # the code that removes the temporary page afterwards
 *
 * The payload is the plugin's own: this serves plugins/design-system-snapshot/code.js, which falls back where
 * use_figma differs (loading pages, placing a node in a font the cloud lacks, measuring a line in one), never a copy
 * of its walk. What differs here (probed on a library, 2026-10-30):
 *   - the code is capped at 50 kB, so the file is served without its whole-line comments;
 *   - there is no network, and the only answer goes to the agent, never this machine: the payload is written as shared
 *     plugin data on frames on the plugin's temporary page, in entries under Figma's 100 kB, and read back here
 *     through the REST API with the machine's Figma token;
 *   - plugin data is refused, so the file's own snapshot id is not read: the payload names the file by its key, which
 *     every project's routing records;
 *   - the tool call decodes \u escapes in the code it carries, so the code holds none (test-mcp says so);
 *   - every file is called "Document", so the name is taken from the REST answer.
 * Proved equal to the plugin's on one library version (snapshot-standard rule 26).
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const HERE = path.dirname(fileURLToPath(import.meta.url));
export const PLUGIN = path.join(HERE, '..', '..', 'plugins', 'design-system-snapshot', 'code.js');
export const NS = 'toolkit.snapshot';
export const CHUNK = 95000;
export const PER_NODE = 40;
export const CAP = 50000;

/* Whole-line comments only (a line that starts a // or a /* … *‍/ block), so nothing inside a string or a regular
   expression is touched; indentation dropped. And the type checker's inline notes (`/** @type {…} *‍/` before a cast),
   which no string or expression of the plugin holds: they are a twentieth of what is sent. */
export function stripped(source) {
  const out = [];
  let block = false;
  for (const line of source.split('\n')) {
    const t = line.trim();
    if (block) { if (t.includes('*/')) block = false; continue; }
    if (t.startsWith('/*')) { if (!t.includes('*/')) block = true; else if (!t.endsWith('*/')) out.push(t); continue; }
    if (!t || t.startsWith('//')) continue;
    // a trailing comment too, where nothing before it can hold a // (no string, template, regex or URL)
    const at = t.indexOf(' // ');
    let kept = at > 0 && !/['"`/]/.test(t.slice(0, at)) ? t.slice(0, at).trimEnd() : t;
    // and a /* … */ inside the line, on the same guard: nothing before it a string or a regex
    for (let i = kept.search(/\/\*.*?\*\//); i > 0 && !/['"`/]/.test(kept.slice(0, i)); i = kept.search(/\/\*.*?\*\//)) kept = kept.replace(/ ?\/\*.*?\*\/ ?/, ' ');
    out.push(kept.trimEnd());
  }
  return out.join('\n').replace(/\/\*\* @[^*]*\*\/ ?/g, '');
}

/* The payload, left as ASCII (so a character is a byte) in entries of CHUNK, PER_NODE to a frame, under one holder
   that says how many there are. `expr` is the payload's expression; `extra` adds to what the call returns. */
const written = (expr, extra = '') => `
const __payload = ${expr};
const __text = JSON.stringify(__payload).replace(/[^ -~]/g, (c) => String.fromCharCode(92) + 'u' + c.charCodeAt(0).toString(16).padStart(4, '0'));
const __holder = figma.createFrame();
__holder.name = 'Snapshot payload';
scratch().appendChild(__holder);
let __n = 0, __box = null;
for (let i = 0; i < __text.length; i += ${CHUNK}) {
  if (__n % ${PER_NODE} === 0) { __box = figma.createFrame(); __box.name = 'part ' + (__n / ${PER_NODE}); __holder.appendChild(__box); }
  __box.setSharedPluginData('${NS}', 'c' + __n++, __text.slice(i, i + ${CHUNK}));
}
__holder.setSharedPluginData('${NS}', 'n', String(__n));
return { holder: __holder.id, chunks: __n, bytes: __text.length${extra}, seconds: Math.round((Date.now() - __t0) / 1000) };
`;

/* After the plugin's file: collect as its own run does, then leave the payload. */
const EPILOGUE = `
figma.skipInvisibleInstanceChildren = true;
const __t0 = Date.now();${written('await collectLibrary(true)', ', components: __payload.components.length')}`;

/* Where the plugin's window and headless entry begin: dead code here (HEADLESS is true and the epilogue calls
   collectLibrary), cut so the run stays under the cap. The plugin's own comment marks it. */
export const CUT = '// ---- the window and the headless entry:';
const plugin = () => {
  const source = fs.readFileSync(PLUGIN, 'utf8');
  if (!source.includes(CUT)) throw new Error(`the snapshot plugin no longer marks where its window code starts ("${CUT}")`);
  return source.slice(0, source.indexOf(CUT));
};
const headless = (source) => stripped(source).replace(/^const HEADLESS = .*$/m, 'const HEADLESS = true;');
const capped = (code, what) => {
  if (code.length > CAP) throw new Error(`the ${what} is ${code.length} characters, over use_figma's ${CAP}`);
  return code;
};
export function script() { return capped(headless(plugin()) + '\n' + EPILOGUE, 'snapshot code'); }

// The plugin's own name for its temporary page, read from it, so a rename reaches the cleanup too.
const SCRATCH = /^const SCRATCH = '([^']+)';$/m.exec(fs.readFileSync(PLUGIN, 'utf8'))[1];
export const CLEANUP = `const p = figma.root.children.find((x) => x.name === ${JSON.stringify(SCRATCH)});
if (!p) return { removed: 0 };
// a page cannot be removed while it is the current one
if (figma.currentPage === p) await figma.setCurrentPageAsync(figma.root.children.find((x) => x !== p));
const id = p.id;
p.remove();
return { removedNodeIds: [id] };`;

/* ---- A large library, in parts. One run outlasts use_figma's time limit on a large library (64 pages, 2026-11-25:
   a generic Figma error), while parts of up to about 2 000 variant walks each took 17–132 s. So: a read-only plan;
   a tokens call; a store call that keeps the walk on the temporary page as a function and runs the first part; and
   part calls of a few lines that run what is stored. Each leaves a holder, and collect joins them. */
export const LIMIT = 1500;

/* A top-level declaration of the plugin, from the line that opens it at column 0 to the line that closes it there
   (a `{` block to its `}`, anything else to the first line that ends with `;`). */
function span(lines, name) {
  const start = lines.findIndex((l) => l.startsWith(`async function ${name}(`) || l.startsWith(`function ${name}(`) || l.startsWith(`const ${name} = `) || l.startsWith(`let ${name} = `));
  if (start < 0) throw new Error(`the snapshot plugin no longer declares ${name} at the top level`);
  const end = lines[start].endsWith('{') ? lines.findIndex((l, i) => i > start && l.startsWith('}')) : lines.findIndex((l, i) => i >= start && l.endsWith(';'));
  return [start, end];
}
export const picked = (source, names) => { const lines = source.split('\n'); return names.map((n) => { const [a, b] = span(lines, n); return lines.slice(a, b + 1).join('\n'); }).join('\n'); };
/* The plugin without what a run with no icons never reaches: the declarations named, and every `if (withIcons) {`
   block (the previews and their dark renders), cut to its closing brace at the same indent. */
export function cut(source, names) {
  let lines = source.split('\n');
  for (const n of names) { const [a, b] = span(lines, n); lines.splice(a, b - a + 1); }
  for (let a; (a = lines.findIndex((l) => /^\s+if \(withIcons\) \{$/.test(l))) >= 0;) {
    const indent = lines[a].match(/^\s+/)[0];
    const b = lines.findIndex((l, i) => i > a && l === `${indent}}`);
    if (b < 0) throw new Error('an `if (withIcons) {` block of the snapshot plugin does not close at its own indent');
    lines.splice(a, b - a + 1);
  }
  return lines.join('\n');
}
/* The names a part of the plugin declares at the top level, in order: from the line declaring `from` to the one
   closing `to`. */
export function declared(source, from, to) {
  const lines = source.split('\n');
  const [a] = span(lines, from);
  const [, b] = span(lines, to);
  return lines.slice(a, b + 1).map((l) => /^(?:async function|function|const|let) ([A-Za-z_$][\w$]*)/.exec(l)).filter(Boolean).map((m) => m[1]);
}
// never reached by a part; the parts also never read the tokens
const UNUSED = ['collectLibrary', 'collectScreens', 'iconFacts', 'glyphFill', 'anatomyOf'];
/* The tokens call reads no component: the walk and everything after it up to collectComponents goes, but the page
   tests and componentSets that say which sets the parts must walk (proved on a 64-page library, 2026-11-25). */
const KEPT = ['isIconPage', 'isScratchPage', 'componentSets'];
export const DEAD = {
  tokens: () => ['anatomyOf', ...declared(plugin(), 'slotPaths', 'collectComponents').filter((n) => !KEPT.includes(n))],
  parts: () => [...UNUSED, 'collectTokens'],
};

/* The sets the walk takes, page by page in the file's order, each page by its index: collectComponents' own pages
   (no icon page, no scratch page) and its own componentSets. One expression for the plan, the tokens call (which
   says what collect must find) and each part (which says what it walked). */
const PLANNED = `figma.root.children.map((p, index) => ({ p, index })).filter(({ p }) => !isIconPage(p) && !isScratchPage(p)).map(({ p, index }) => ({ index, name: p.name, sets: componentSets(p) }))`;

/* The plan: read-only, per page each set's id and its walks, variants × (1 + booleans), which is what a part costs. */
export function planCode() {
  return capped(`${stripped(picked(plugin(), ['isIconPage', 'isScratchPage', 'componentSets']))}
for (const p of figma.root.children) await p.loadAsync();
const walks = (s) => { let b = 0; try { b = Object.values(s.componentPropertyDefinitions).filter((d) => d.type === 'BOOLEAN').length; } catch (e) { b = 0; } return (s.type === 'COMPONENT_SET' ? s.children.length : 1) * (1 + b); };
return ${PLANNED}.filter((pg) => pg.sets.length).map((pg) => ({ index: pg.index, name: pg.name, sets: pg.sets.map((s) => ({ id: s.id, walks: walks(s) })) }));`, 'plan code');
}

/* Parts of at most `limit` walks, the plan's order kept; a set over the limit goes alone. A part names its pages,
   and its sets only where it takes part of a page (null: its pages whole). */
export function sized(plan, limit = LIMIT) {
  const parts = [];
  let cur = null;
  for (const pg of plan) for (const s of pg.sets) {
    if (!cur || (cur.walks + s.walks > limit && cur.sets.length)) parts.push(cur = { walks: 0, sets: [], pages: [] });
    cur.walks += s.walks;
    cur.sets.push(s.id);
    if (!cur.pages.includes(pg.index)) cur.pages.push(pg.index);
  }
  return parts.map((p) => {
    const whole = p.pages.every((i) => plan.find((pg) => pg.index === i).sets.every((s) => p.sets.includes(s.id)));
    return { pages: p.pages, scope: whole ? null : p.sets, walks: p.walks };
  });
}

const TOKENS = `
{
figma.skipInvisibleInstanceChildren = true;
const __t0 = Date.now();
await loadPages(true);
const tokens = await collectTokens();
scratch().setSharedPluginData('${NS}', 'unanswered', String(unanswered));
%ICONS%
${written(`{ tokens, unanswered, sets: ${PLANNED}.flatMap((pg) => pg.sets.map((s) => s.id)), iconSets: iconSets.map((s) => s.name), iconPage: iconPage ? iconPage.name : null, ...(Object.keys(iconGroups).length && { iconGroups }), ...(Object.keys(iconDescriptions).length && { iconDescriptions }) }`, ', sets: __payload.sets.length')}}`;
const PART = `
figma.skipInvisibleInstanceChildren = true;
const __t0 = Date.now();
await loadPages(true);
unanswered = Number(scratch().getSharedPluginData('${NS}', 'unanswered')) || 0;
const __names = new Set(__PAGES.map((i) => figma.root.children[i].name));
const __sets = ${PLANNED}.filter((pg) => __PAGES.includes(pg.index)).flatMap((pg) => pg.sets.filter((s) => !__SCOPE || __SCOPE.includes(s.id)).map((s) => s.id));
const __components = await collectComponents({ withIcons: false, previews: [], darkModes: async () => [], pages: { test: (n) => __names.has(n) }, scope: new Set(__sets) });
scratch().setSharedPluginData('${NS}', 'unanswered', String(unanswered));
${written('{ components: __components, sets: __sets, unrecorded: unrecordedSeen, unreadable, unanswered }', ', components: __components.length')}`;

/* The tokens call: the plugin's collectTokens, the icon names by collectLibrary's own expressions, and the sets the
   parts must cover. */
export function tokensCode() {
  const source = plugin();
  const lines = source.split('\n');
  const [a, b] = span(lines, 'collectLibrary');
  const own = lines.slice(a, b + 1);
  const icons = ['iconPage', 'iconSets', 'groupOf', 'iconGroups', 'iconDescriptions'].map((n) => {
    const line = own.find((l) => l.startsWith(`  const ${n} = `));
    if (!line) throw new Error(`collectLibrary no longer reads ${n} on one line`);
    return line.trim();
  });
  return capped(headless(cut(source, DEAD.tokens())) + '\n' + TOKENS.replace('%ICONS%', icons.join('\n')), 'tokens call');
}

const args = (part) => `${JSON.stringify(part.pages)}, ${JSON.stringify(part.scope)}`;
/* The store call: the walk as one function, kept as shared plugin data on the temporary page, and its first part. */
export function storeCode(first) {
  const fn = `async function __snap(__PAGES, __SCOPE) {\n${headless(cut(plugin(), DEAD.parts()))}\n${PART}}`;
  return capped(`${fn}
const __page = figma.root.children.find((p) => p.name === ${JSON.stringify(SCRATCH)}) || Object.assign(figma.createPage(), { name: ${JSON.stringify(SCRATCH)} });
__page.setSharedPluginData('${NS}', 'code', __snap.toString());
return await __snap(${args(first)});`, 'store call');
}
export const partCode = (part) => capped(`const __page = figma.root.children.find((p) => p.name === ${JSON.stringify(SCRATCH)});
const __src = __page ? __page.getSharedPluginData('${NS}', 'code') : '';
if (!__src) throw new Error('no stored walk on the temporary page: make the store call first');
return await (new Function('return ' + __src)())(${args(part)});`, 'part call');

/* Every call to make, in order, given what the plan returned. */
export function calls(plan) {
  const parts = sized(plan);
  if (!parts.length) throw new Error('the plan holds no component set');
  const say = (p, i) => `part ${i + 1} of ${parts.length}: ${p.walks} walks on page${p.pages.length > 1 ? 's' : ''} ${p.pages.join(', ')}`;
  return [
    { call: 'tokens', code: tokensCode() },
    { call: `${say(parts[0], 0)}, storing the walk`, code: storeCode(parts[0]) },
    ...parts.slice(1).map((p, i) => ({ call: say(p, i + 1), code: partCode(p) })),
  ];
}

/* The holders of one run in parts, joined into the payload one whole run gives (with no icon files, graphics or
   previews: the parts name icons, as a run with icons off does). Refused unless the parts walked every set the
   tokens call found, each once, in its order. */
export function join(found) {
  const heads = found.filter((p) => p.tokens);
  if (heads.length !== 1) throw new Error(`${heads.length} of the holders hold the tokens: collect the tokens call's holder, once, with every part's`);
  const head = heads[0];
  const at = new Map(head.sets.map((id, i) => [id, i]));
  const parts = found.filter((p) => !p.tokens).sort((x, y) => (at.get(x.sets[0]) ?? Infinity) - (at.get(y.sets[0]) ?? Infinity));
  const walked = parts.flatMap((p) => p.sets);
  const seen = new Set(walked);
  const list = (ids) => ids.slice(0, 5).join(', ') + (ids.length > 5 ? ` and ${ids.length - 5} more` : '');
  const missing = head.sets.filter((id) => !seen.has(id));
  if (missing.length) throw new Error(`no part walked ${missing.length} planned set${missing.length > 1 ? 's' : ''} (${list(missing)}): run those parts, then collect every holder`);
  const twice = [...new Set(walked.filter((id, i) => walked.indexOf(id) !== i))];
  if (twice.length) throw new Error(`${list(twice)} walked more than once: collect each part's holder once`);
  const unplanned = walked.filter((id) => !at.has(id));
  if (unplanned.length) throw new Error(`${list(unplanned)} walked but not in the file the tokens call read: run the plan and its calls again`);
  if (walked.some((id, i) => at.get(id) !== i)) throw new Error('the parts do not follow the plan\'s order: make the calls `parts <plan.json>` gives');
  const { tokens } = head;
  // as the whole walk keeps them: what it met, in its order, stopped at 200, then the first 40 kinds
  tokens._meta.unrecorded = [...new Set(parts.flatMap((p) => p.unrecorded).slice(0, 200))].slice(0, 40);
  // one count across the run: each call starts from the last one's, so the last is the run's
  const unanswered = Math.max(head.unanswered, ...parts.map((p) => p.unanswered));
  if (unanswered) tokens._meta.variablesUnanswered = unanswered;
  // a set is listed once, as the walk lists it
  const unreadable = parts.flatMap((p) => p.unreadable).filter((x, i, all) => all.findIndex((y) => y.name === x.name) === i);
  return { tokens, components: parts.flatMap((p) => p.components), icons: [], iconSets: head.iconSets, iconPage: head.iconPage, ...(head.iconGroups && { iconGroups: head.iconGroups }), ...(head.iconDescriptions && { iconDescriptions: head.iconDescriptions }), graphics: [], previews: [], ...(unreadable.length && { unreadable }) };
}

/* One whole run's holder as it is; a run in parts' holders (one alone too) joined, which refuses what is missing. */
export const payloadOf = (found) => (found.length === 1 && !found[0].sets ? found[0] : join(found));

/* The payload from a holder as REST gives it: its count, and each entry wherever under it it sits. */
export function joined(node) {
  const data = {};
  const visit = (n) => { Object.assign(data, ((n.sharedPluginData || {})[NS]) || {}); for (const c of n.children || []) visit(c); };
  visit(node);
  const count = Number(data.n);
  if (!count) throw new Error(`${node.id} holds no snapshot: run the script again, then collect from the holder it returns`);
  const parts = Array.from({ length: count }, (_, i) => data[`c${i}`]);
  const missing = parts.findIndex((p) => typeof p !== 'string');
  if (missing >= 0) throw new Error(`${node.id} holds ${count} parts and part ${missing} is missing: run the script again`);
  return JSON.parse(parts.join(''));
}

/* use_figma's file is called "Document" whatever its name: the name is Figma's own, from the same answer. */
export function named(payload, name) {
  if (name && payload.tokens && payload.tokens._meta) payload.tokens._meta.file = name;
  return payload;
}

/* The library file the holder is in. A project may route several (tokens, components, icons), and reading the
   first one's key for every collect read the holder from the wrong file: with more than one, `--file` names it. */
export function libraryKey(routed, chosen) {
  const keyed = routed.filter((e) => e.key);
  if (chosen) return keyed.some((e) => e.key === chosen) ? { key: chosen } : { error: `routes no library file with the key ${chosen}; its keys: ${keyed.map((e) => e.key).join(', ') || 'none'}` };
  if (keyed.length === 1) return { key: keyed[0].key };
  if (!keyed.length) return { error: 'routes no library file with a key' };
  return { error: `routes ${keyed.length} library files: name the one the script ran in with --file <key> (${keyed.map((e) => `${e.key}${e.name ? ` ${e.name}` : ''}`).join(', ')})` };
}

async function holder(fileKey, id, token) {
  const r = await fetch(`https://api.figma.com/v1/files/${fileKey}/nodes?ids=${encodeURIComponent(id)}&plugin_data=shared`, { headers: { 'X-Figma-Token': token }, signal: AbortSignal.timeout(120000) });
  if (!r.ok) throw new Error(`Figma answered ${r.status} reading ${id}: ${(await r.text()).slice(0, 200)}`);
  const answer = await r.json();
  const node = (answer.nodes || {})[id];
  if (!node || !node.document) throw new Error(`${id} is not in the file: run the script again`);
  return { payload: joined(node.document), name: answer.name };
}

/* One holder is a whole run's; several are the holders of a run in parts, joined. */
export async function read(fileKey, ids, token) {
  const found = [];
  for (const id of [].concat(ids)) found.push(await holder(fileKey, id, token));
  const payload = named(payloadOf(found.map((f) => f.payload)), found[0].name);
  // the file read is the one the payload names, whether or not the cloud gave the run its key
  if (payload.tokens && payload.tokens._meta) payload.tokens._meta.fileKey ||= fileKey;
  return payload;
}

async function main(argv) {
  const flag = (f) => { const i = argv.indexOf(f); return i > 0 ? argv[i + 1] : null; };
  const [cmd, name, ...ids] = argv.filter((a, i) => !a.startsWith('--') && !(i > 0 && argv[i - 1].startsWith('--')));
  if (cmd === 'script') return process.stdout.write(script());
  if (cmd === 'cleanup') return process.stdout.write(CLEANUP + '\n');
  if (cmd === 'parts') return process.stdout.write(name ? JSON.stringify(calls(JSON.parse(fs.readFileSync(name, 'utf8'))), null, 1) + '\n' : planCode() + '\n');
  if (cmd !== 'collect' || !name || !ids.length) { console.error('usage: mcp.mjs script | parts [<plan.json>] | collect <project> <holder id>… [--file <key>] [--repo <dir>] [--save <file>] | cleanup'); process.exit(2); }
  const contract = require('./projects.cjs');
  const { deliver } = require('./deliver.cjs');
  const { tokenFor } = require('./version.cjs');
  const project = contract.projects().list.find((p) => p.name === name);
  if (!project) { console.error(`no project called ${name}`); process.exit(2); }
  const { key: fileKey, error } = libraryKey(contract.entries(project.files.library), flag('--file'));
  if (error) { console.error(`${name}: ${error}`); process.exit(2); }
  const token = tokenFor(project.repo, {});
  if (!token) { console.error('no Figma token: bin/set-key figma'); process.exit(2); }
  const payload = await read(fileKey, ids, token);
  if (flag('--save')) fs.writeFileSync(flag('--save'), JSON.stringify(payload));
  const r = await deliver(flag('--repo') ? { ...project, repo: path.resolve(flag('--repo')) } : project, 'library', payload);
  console.log(`${name}: ${r.result}${r.why ? ` — ${r.why}` : ''}`);
  console.log('Then remove the temporary page: pass `node mcp.mjs cleanup` to use_figma.');
  process.exit(r.result === 'written' ? 0 : 1);
}

if (process.argv[1] && (() => { try { return fs.realpathSync(process.argv[1]); } catch { return null; } })() === fileURLToPath(import.meta.url)) main(process.argv.slice(2)).catch((e) => { console.error(e.message); process.exit(1); });
