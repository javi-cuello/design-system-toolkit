#!/usr/bin/env node
// node tools/snapshot/test-mcp.mjs — the code mcp.mjs serves to use_figma, and how it reads a payload back
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { script, stripped, joined, named, libraryKey, PLUGIN, CAP, CHUNK, PER_NODE, NS } from './mcp.mjs';

let n = 0;
const ok = (name, cond) => { n++; assert.ok(cond, name); console.log('ok', name); };

const code = script();
ok(`the code fits use_figma's ${CAP} characters`, code.length <= CAP);
let parses = true; try { new vm.Script(`(async () => {\n${code}\n})`); } catch { parses = false; }
ok('and parses as the body use_figma runs', parses);
ok('it runs headless, and collects as the plugin does', /^const HEADLESS = true;$/m.test(code) && /await collectLibrary\(true\)/.test(code));
ok('every page is loaded through the fallback, never loadAllPagesAsync alone', (code.match(/loadAllPagesAsync/g) || []).length === 1 && /const loadPages/.test(code));
ok('no \\u or \\\\ escape in it, since the tool call that carries it decodes them (probed 2026-10-30: a \\u2028 in a regex arrived as a line break)', !/\\u|\\\\/.test(code));
ok('the epilogue escapes as the payload reader expects', code.includes("replace(/[^ -~]/g, (c) => String.fromCharCode(92) + 'u'"));
ok('the plugin holds no multi-line string, whose lines the stripping would trim', stripped(readFileSync(PLUGIN, 'utf8')).split('\n').every((l) => (l.replace(/\\./g, '').match(/`/g) || []).length % 2 === 0));
ok('a comment is dropped, and a // inside a string kept', stripped("// note\nconst a = 'http://x';\n/* one\n two */\nb();") === "const a = 'http://x';\nb();");

// the payload as the epilogue leaves it, read back as REST gives it
const payload = { tokens: { _meta: { fileKey: 'K' } }, components: [{ name: 'Chip ✓', page: '❖ Chip' }], blob: 'x'.repeat(CHUNK * (PER_NODE + 2)) };
const text = JSON.stringify(payload).replace(/[^ -~]/g, (c) => String.fromCharCode(92) + 'u' + c.charCodeAt(0).toString(16).padStart(4, '0'));
const entries = []; for (let i = 0; i < text.length; i += CHUNK) entries.push(text.slice(i, i + CHUNK));
const boxes = []; entries.forEach((e, i) => { if (i % PER_NODE === 0) boxes.push({ id: `b${boxes.length}`, sharedPluginData: { [NS]: {} } }); boxes.at(-1).sharedPluginData[NS][`c${i}`] = e; });
const holder = { id: '1:1', sharedPluginData: { [NS]: { n: String(entries.length) } }, children: boxes };
ok('every entry is under 100 kB, as Figma allows', text.length > CHUNK * PER_NODE && /^[\x00-\x7f]*$/.test(text) && entries.every((e) => e.length <= CHUNK));
ok('the payload reads back whole, across frames, its characters as they were', JSON.stringify(joined(holder)) === JSON.stringify(payload));
delete boxes[1].sharedPluginData[NS][`c${PER_NODE}`];
assert.throws(() => joined(holder), /part 40 is missing/); n++; console.log('ok a missing part is refused, never joined short');
assert.throws(() => joined({ id: '2:2' }), /holds no snapshot/); n++; console.log('ok a node with no payload says so');

ok("the file's name is Figma's own, since use_figma calls every file Document", named({ tokens: { _meta: { file: 'Document' } } }, 'UI library').tokens._meta.file === 'UI library');
const routed = [{ key: 'KT', name: 'Tokens' }, { key: 'KC', name: 'Components' }, { id: 'only-an-id' }];
ok('one keyed library file is the one read', libraryKey([{ key: 'KT' }, { id: 'x' }]).key === 'KT');
ok('with several, --file names the one read, never the first by default', libraryKey(routed, 'KC').key === 'KC' && /--file/.test(libraryKey(routed).error));
ok('a --file the project does not route is refused', /no library file with the key KX/.test(libraryKey(routed, 'KX').error));
console.log(`${n} passed`);
