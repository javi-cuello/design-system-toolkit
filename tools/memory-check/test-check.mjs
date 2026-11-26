#!/usr/bin/env node
// tools/memory-check/check.mjs over throwaway memory folders: each rule of toolkit-standard §D 25 it checks
// fires on a folder that breaks it and stays quiet on one that keeps it.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { checkFolder, checkWritten } from './check.mjs';

const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'memory-')));
let n = 0;
const ok = (msg) => { n++; console.log(`ok ${msg}`); };
const folder = (name, files) => {
  const dir = path.join(root, name, 'memory');
  fs.mkdirSync(dir, { recursive: true });
  for (const [f, body] of Object.entries(files)) fs.writeFileSync(path.join(dir, f), body);
  return dir;
};
const fm = (name, type = 'project') => `---\nname: ${name}\ndescription: what it holds\nmetadata:\n  type: ${type}\n---\n\n`;
const rules = (dir, opts) => checkFolder(dir, { today: new Date('2026-11-26T00:00:00'), ...opts }).map((x) => `${x.rule}:${x.level}`);

try {
  const good = folder('good', { 'MEMORY.md': '- [State](state.md) — where it stands\n', 'state.md': `${fm('state')}## Open (as of 2026-11-20)\n\n- one thing\n` });
  assert.deepEqual(rules(good), []);
  ok('a folder in the standard\'s shape has no findings');

  const two = folder('two', { 'MEMORY.md': '- [A](a.md) — a\n- [B](b.md) — b\n', 'a.md': fm('a'), 'b.md': fm('b') });
  assert.deepEqual(rules(two), ['one-file:error']);
  assert.deepEqual(rules(two, { multi: true }), [], 'the toolkit\'s own folder may keep topic files');
  ok('two memory files are one too many, except in the toolkit\'s own folder');

  const index = folder('index', { 'MEMORY.md': '- [A](a.md) — a\n- [Gone](gone.md) — gone\n- loose note\n', 'a.md': fm('a'), 'b.md': fm('b') });
  const got = checkFolder(index, { multi: true }).map((x) => x.message);
  assert.ok(got.some((m) => /links gone\.md/.test(m)), got.join('\n'));
  assert.ok(got.some((m) => /not "- \[Title\]/.test(m)), got.join('\n'));
  assert.ok(got.some((m) => /not linked from MEMORY\.md/.test(m)), got.join('\n'));
  ok('the index links only files that exist, links every file, and holds only index lines');

  const long = folder('long', { 'MEMORY.md': `${'x\n'.repeat(205)}- [A](a.md) — a\n`, 'a.md': fm('a') });
  assert.ok(rules(long).includes('index:error'));
  ok('an index past the 200 lines Claude Code loads is a finding');

  const front = folder('front', { 'MEMORY.md': '- [A](a.md) — a\n', 'a.md': '---\nname: other\ndescription:\nmetadata:\n  type: notes\n---\n' });
  assert.equal(rules(front).filter((r) => r === 'frontmatter:error').length, 3);
  const quoted = folder('quoted', { 'MEMORY.md': '- [A](./a.md) — a\n', 'a.md': '---\nname: "a"\ndescription: "what"\nmetadata:\n  type: project\n---\n' });
  assert.deepEqual(rules(quoted), [], 'a quoted name and a ./ link read as written');
  ok('frontmatter: name is the file\'s, a description, a documented type');

  const big = folder('big', { 'MEMORY.md': '- [A](a.md) — a\n', 'a.md': fm('a') + '## Open (as of 2026-11-20)\n' + 'x'.repeat(26000) });
  assert.deepEqual(rules(big), ['size:error']);
  ok('a memory file over the size cap is a finding');

  const dated = folder('dated', { 'MEMORY.md': '- [A](a.md) — a\n', 'a.md': `${fm('a')}## Old (as of 2026-10-01)\n\n## Loose, as of 2026-11-01\n` });
  assert.deepEqual(rules(dated), ['stale:warning', 'dated:error']);
  ok('a dated heading is "(as of YYYY-MM-DD)", and one past 30 days is a warning, not an error');

  const rule = folder('rule', { 'MEMORY.md': '- [A](a.md) — a\n', 'a.md': `${fm('a', 'feedback')}## Ask first\n\n**Why:** they said so.\n` });
  assert.deepEqual(rules(rule), ['rule:error', 'rule:error']);
  const said = folder('said', { 'MEMORY.md': '- [A](a.md) — a\n', 'a.md': `${fm('a')}## Open (as of 2026-11-20)\n\n- Never push on red.\n- **Always** ask.\n\n\`\`\`\nNever in a fence\n\`\`\`\n` });
  assert.deepEqual(rules(said), ['rule:error', 'rule:error']);
  const cased = folder('cased', { 'MEMORY.md': '- [A](a.md) — a\n', 'a.md': `${fm('a')}## Open (as of 2026-11-20)\n\n- NEVER push.\n- Do NOT push.\n> never\n- [ ] Must ask\n- _Always_ ask\n- Must-fix items: 3 open\n- Always-on sidebar shipped\n~~~\nNever in a tilde fence\n~~~\n` });
  assert.deepEqual(rules(cased), Array(5).fill('rule:error'), 'any case and any list opener; a hyphenated word is state');
  ok('a rule is never memory: the feedback type, a Why line, a line opening Never or Always');

  const loose = folder('loose', { 'MEMORY.md': '- [A](a.md) — a\n', 'a.md': `${fm('a')}## How the build works\n\n## Open (as of 2026-11-20)\n` });
  assert.deepEqual(rules(loose), ['undated:error']);
  const above = folder('above', { 'MEMORY.md': '- [A](a.md) — a\n', 'a.md': `${fm('a')}Always check the build first.\n\n## Open (as of 2026-11-20)\n` });
  assert.ok(rules(above).includes('undated:error'), 'prose above the first section is not dated state');
  const ref = folder('ref', { 'MEMORY.md': '- [A](a.md) — a\n', 'a.md': `${fm('a', 'reference')}## Where the files are\n` });
  assert.deepEqual(rules(ref), [], 'a reference file holds pointers, not dated state');
  ok('every section of a project file is dated state');

  const wrote = checkWritten([path.join(rule, 'a.md')], { root, seen: new Set() });
  assert.ok(wrote && /never to memory/.test(wrote.reason), 'a turn that wrote a rule is blocked');
  const wroteLoose = checkWritten([path.join(loose, 'a.md')], { root, seen: new Set() });
  assert.ok(wroteLoose && /dated state/.test(wroteLoose.reason), 'a turn that wrote an undated section is blocked');
  ok('the Stop hook blocks a turn that wrote a rule or an undated section');

  const seen = new Set();
  const first = checkWritten([path.join(two, 'a.md')], { root, seen });
  assert.ok(first && /one/.test(first.reason), 'a written file in a broken folder blocks');
  fs.appendFileSync(path.join(two, 'MEMORY.md'), '- [Gone](gone.md) — gone\n');
  const later = checkWritten([path.join(two, 'MEMORY.md')], { root, seen: new Set(first.keys) });
  assert.ok(later && /gone\.md/.test(later.reason), 'a new kind of index finding blocks though another has');
  fs.writeFileSync(path.join(two, 'MEMORY.md'), '- [A](a.md) — a\n- [B](b.md) — b\n');
  for (const k of first.keys) seen.add(k);
  assert.equal(checkWritten([path.join(two, 'a.md')], { root, seen }), null, 'once: a finding put to the session does not block again');
  assert.equal(checkWritten([path.join(dated, 'a.md')], { root, seen: new Set(['memory:dated:a.md:dated:"## Loose, as of #-#-#": a date is written "(as of YYYY-MM-DD)"']) }), null, 'a stale warning never blocks');
  assert.equal(checkWritten([path.join(front, 'MEMORY.md')], { root }), null, 'a finding in a file the session did not write is not its stop\'s');
  fs.appendFileSync(path.join(big, 'a.md'), 'more');
  const once = new Set(checkWritten([path.join(big, 'a.md')], { root }).keys);
  fs.appendFileSync(path.join(big, 'a.md'), 'more still');
  assert.equal(checkWritten([path.join(big, 'a.md')], { root, seen: once }), null, 'a file still over its size after another edit does not block again');
  assert.equal(checkWritten([path.join(root, 'elsewhere.md')], { root }), null, 'a file outside a memory folder is not read');
  ok('the Stop hook blocks once on a memory folder the session wrote into, and only on errors');
} finally { fs.rmSync(root, { recursive: true, force: true }); }
console.log(`${n}/${n} passed`);
