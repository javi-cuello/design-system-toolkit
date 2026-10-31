import test from 'node:test';
import assert from 'node:assert/strict';
import { itemKeys, unseen } from './stop-items.mjs';

const A = 'toolkit: 1 uncommitted: projects/x/audit.json';
const AB = 'toolkit: 2 uncommitted: projects/x/audit.json, tools/parity/external.mjs';
const PUSH = 'toolkit: 1 unpushed commit(s) — finished means shipped; if a push is blocked, say what unblocks it';
const FACE = 'toolkit: 1 user-facing file(s) changed since origin/main: look at the pages they draw before they ship — tools/docs-site/a.astro';

test('each uncommitted file is its own item', () => {
  assert.deepEqual(itemKeys(AB).map((k) => k.key), ['toolkit|uncommitted|projects/x/audit.json', 'toolkit|uncommitted|tools/parity/external.mjs']);
});

test('each user-facing file is its own item, and other lines are whole', () => {
  assert.deepEqual(itemKeys(`${PUSH}\n${FACE}`).map((k) => k.key), [PUSH, 'toolkit|user-facing|tools/docs-site/a.astro']);
});

test('an item already shown does not block again', () => {
  const first = unseen(A, []);
  assert.deepEqual(first.lines, ['toolkit: uncommitted: projects/x/audit.json']);
  assert.deepEqual(unseen(A, first.keys).lines, []);
});

test('a new file blocks once, without bringing back the one already answered', () => {
  const seen = unseen(A, []).keys;
  const next = unseen(AB, seen);
  assert.deepEqual(next.keys, ['toolkit|uncommitted|tools/parity/external.mjs']);
  assert.deepEqual(next.lines, ['toolkit: uncommitted: tools/parity/external.mjs']);
  assert.deepEqual(unseen(AB, [...seen, ...next.keys]).lines, []);
});

test('a line whose wording changes is a new item', () => {
  const seen = unseen(PUSH, []).keys;
  assert.deepEqual(unseen(PUSH.replace('1 unpushed', '2 unpushed'), seen).lines.length, 1);
});

test("another session's uncommitted file does not block; this session's does", () => {
  const own = new Set(['/repo/tools/parity/external.mjs']);
  assert.deepEqual(unseen(AB, [], own).lines, ['toolkit: uncommitted: tools/parity/external.mjs']);
  assert.deepEqual(unseen(`${AB}\n${PUSH}`, [], new Set()).lines, [PUSH]);
});

test('without a transcript every file still blocks', () => {
  assert.equal(unseen(AB, [], null).keys.length, 2);
});

test('a repo the session never wrote in blocks nothing', () => {
  const RULE = 'acme: 2 ruling(s) new since the last accepted run — x';
  const dirs = { toolkit: '/tk', acme: '/bb' };
  assert.deepEqual(unseen(`${RULE}\n${PUSH}`, [], new Set(['/tk/a.md']), dirs).lines, [PUSH]);
  assert.deepEqual(unseen(RULE, [], new Set(['/bb/src/x.ts']), dirs).lines, [RULE]);
});

test('a turn that only read writes nothing; an edit does', async () => {
  const { turnWrote } = await import('./stop-items.mjs');
  const fs = await import('node:fs');
  const t = (lines) => { const f = `${process.env.TMPDIR || '/tmp'}/turn-${Math.random()}.jsonl`; fs.writeFileSync(f, lines.map((l) => JSON.stringify(l)).join('\n')); return f; };
  const ask = { type: 'user', message: { content: 'a question' } };
  assert.equal(await turnWrote(t([ask, { type: 'assistant', message: { content: [{ type: 'tool_use', name: 'Bash', input: { command: 'git status' } }] } }])), false);
  assert.equal(await turnWrote(t([ask, { type: 'assistant', message: { content: [{ type: 'tool_use', name: 'Edit', input: { file_path: '/x/a.md' } }] } }])), true);
  // read a block at a time (a 555 MB transcript crashed it, 20 Oct): an edit before the question is the last turn's,
  // and lines that straddle a block still parse
  const big = { type: 'assistant', message: { content: [{ type: 'text', text: 'x'.repeat(5e6) }] } };
  const edit = { type: 'assistant', message: { content: [{ type: 'tool_use', name: 'Edit', input: { file_path: '/x/a.md' } }] } };
  assert.equal(await turnWrote(t([edit, big, big, ask, big, big])), false);
  assert.equal(await turnWrote(t([ask, big, big, big, edit])), true);
});
