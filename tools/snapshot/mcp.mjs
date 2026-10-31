#!/usr/bin/env node
/*
 * A library snapshot taken through the official Figma MCP (`use_figma`), with no Figma app open.
 *
 *   node mcp.mjs script                          # the code an agent passes to use_figma, on stdout
 *   node mcp.mjs collect <project> <holder id>   # read what that run left, and deliver it (deliver.cjs)
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
   expression is touched; indentation dropped. */
export function stripped(source) {
  const out = [];
  let block = false;
  for (const line of source.split('\n')) {
    const t = line.trim();
    if (block) { if (t.includes('*/')) block = false; continue; }
    if (t.startsWith('/*')) { if (!t.includes('*/')) block = true; else if (!t.endsWith('*/')) out.push(t); continue; }
    if (!t || t.startsWith('//')) continue;
    out.push(t);
  }
  return out.join('\n');
}

/* After the plugin's file: collect as its own run does, then leave the payload as ASCII (so a character is a byte)
   in entries of CHUNK, PER_NODE to a frame, under one holder that says how many there are. */
const EPILOGUE = `
figma.skipInvisibleInstanceChildren = true;
const __t0 = Date.now();
const __payload = await collectLibrary(true);
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
return { holder: __holder.id, chunks: __n, bytes: __text.length, components: __payload.components.length, seconds: Math.round((Date.now() - __t0) / 1000) };
`;

export function script() {
  const body = stripped(fs.readFileSync(PLUGIN, 'utf8')).replace(/^const HEADLESS = .*$/m, 'const HEADLESS = true;');
  const code = body + '\n' + EPILOGUE;
  if (code.length > CAP) throw new Error(`the snapshot code is ${code.length} characters, over use_figma's ${CAP}`);
  return code;
}

// The plugin's own name for its temporary page, read from it, so a rename reaches the cleanup too.
const SCRATCH = /^const SCRATCH = '([^']+)';$/m.exec(fs.readFileSync(PLUGIN, 'utf8'))[1];
export const CLEANUP = `const p = figma.root.children.find((x) => x.name === ${JSON.stringify(SCRATCH)});
if (!p) return { removed: 0 };
// a page cannot be removed while it is the current one
if (figma.currentPage === p) await figma.setCurrentPageAsync(figma.root.children.find((x) => x !== p));
const id = p.id;
p.remove();
return { removedNodeIds: [id] };`;

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

export async function read(fileKey, id, token) {
  const r = await fetch(`https://api.figma.com/v1/files/${fileKey}/nodes?ids=${encodeURIComponent(id)}&plugin_data=shared`, { headers: { 'X-Figma-Token': token }, signal: AbortSignal.timeout(120000) });
  if (!r.ok) throw new Error(`Figma answered ${r.status} reading ${id}: ${(await r.text()).slice(0, 200)}`);
  const answer = await r.json();
  const node = (answer.nodes || {})[id];
  if (!node || !node.document) throw new Error(`${id} is not in the file: run the script again`);
  const payload = named(joined(node.document), answer.name);
  // the file read is the one the payload names, whether or not the cloud gave the run its key
  if (payload.tokens && payload.tokens._meta) payload.tokens._meta.fileKey ||= fileKey;
  return payload;
}

async function main(argv) {
  const [cmd, name, id] = argv;
  const flag = (f) => { const i = argv.indexOf(f); return i > 0 ? argv[i + 1] : null; };
  if (cmd === 'script') return process.stdout.write(script());
  if (cmd === 'cleanup') return process.stdout.write(CLEANUP + '\n');
  if (cmd !== 'collect' || !name || !id) { console.error('usage: mcp.mjs script | collect <project> <holder id> [--file <key>] [--repo <dir>] [--save <file>] | cleanup'); process.exit(2); }
  const contract = require('./projects.cjs');
  const { deliver } = require('./deliver.cjs');
  const { tokenFor } = require('./version.cjs');
  const project = contract.projects().list.find((p) => p.name === name);
  if (!project) { console.error(`no project called ${name}`); process.exit(2); }
  const { key: fileKey, error } = libraryKey(contract.entries(project.files.library), flag('--file'));
  if (error) { console.error(`${name}: ${error}`); process.exit(2); }
  const token = tokenFor(project.repo, {});
  if (!token) { console.error('no Figma token: bin/set-key figma'); process.exit(2); }
  const payload = await read(fileKey, id, token);
  if (flag('--save')) fs.writeFileSync(flag('--save'), JSON.stringify(payload));
  const r = await deliver(flag('--repo') ? { ...project, repo: path.resolve(flag('--repo')) } : project, 'library', payload);
  console.log(`${name}: ${r.result}${r.why ? ` — ${r.why}` : ''}`);
  console.log('Then remove the temporary page: pass `node mcp.mjs cleanup` to use_figma.');
  process.exit(r.result === 'written' ? 0 : 1);
}

if (process.argv[1] && fs.realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) main(process.argv.slice(2)).catch((e) => { console.error(e.message); process.exit(1); });
