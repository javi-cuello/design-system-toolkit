#!/usr/bin/env node
// figma-feedback: which threads are open, on comments shaped as Figma's API returns them.
// Run: node --test skills/frontend-build/tests/test-feedback.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { openThreads } from '../scripts/figma-feedback.mjs';

const c = (id, message, at, more = {}) => ({ id, message, created_at: at, user: { handle: 'Javi' }, resolved_at: null, client_meta: { node_id: '74:62150', node_offset: { x: 1, y: 1 } }, ...more });

test('a person\'s comment on a layer is open, with the layer it is pinned to', () => {
  const t = openThreads([c('1', 'The dialog title should say New employee', '2026-11-11T10:00:00Z')]);
  assert.equal(t.length, 1);
  assert.equal(t[0].node, '74:62150');
  assert.deepEqual(t[0].offset, { x: 1, y: 1 });
  assert.equal(t[0].text, 'The dialog title should say New employee');
});

test('a thread whose last message is Claude\'s is handled; a person replying after it opens it again', () => {
  const root = c('1', 'Use a drawer here', '2026-11-11T10:00:00Z');
  const done = c('2', 'From Claude:\nRouted: a ruling in the project\'s context document, §6', '2026-11-11T11:00:00Z', { parent_id: '1', client_meta: null });
  assert.equal(openThreads([root, done]).length, 0);
  const again = c('3', 'Only for read-only records', '2026-11-11T12:00:00Z', { parent_id: '1', client_meta: null });
  const t = openThreads([again, root, done]);
  assert.equal(t.length, 1);
  assert.deepEqual(t[0].thread.map((m) => m.text.slice(0, 5)), ['From ', 'Only ']);
});

test('Claude\'s own question waits for the designer; their answer opens it; a resolved thread never is', () => {
  const ask = c('1', 'From Claude:\nSort in a toolbar menu\n- …', '2026-11-11T10:00:00Z');
  assert.equal(openThreads([ask]).length, 0);
  const answer = c('2', 'Keep the toolbar sort, headers are too small', '2026-11-11T11:00:00Z', { parent_id: '1', client_meta: null });
  assert.equal(openThreads([ask, answer]).length, 1);
  assert.equal(openThreads([{ ...ask, resolved_at: '2026-11-11T12:00:00Z' }, answer]).length, 0);
});

test('a comment pinned to the canvas has no layer', () => {
  const t = openThreads([c('1', 'General: too dense', '2026-11-11T10:00:00Z', { client_meta: { x: 10, y: 20 } })])[0];
  assert.equal(t.node, null);
  assert.equal(t.offset, null);
});

test('the agent\'s own account marks its messages without a prefix; another person\'s reply still opens the thread', () => {
  const root = c('1', 'remove button', '2026-11-11T10:00:00Z');
  const done = c('2', 'Routed: removed from the three screens', '2026-11-11T11:00:00Z', { parent_id: '1', client_meta: null, user: { id: 'agent-1', handle: 'AI agent' } });
  assert.equal(openThreads([root, done], 'agent-1').length, 0);
  assert.equal(openThreads([root, done]).length, 1);
  const again = c('3', 'Keep it on the dialog', '2026-11-11T12:00:00Z', { parent_id: '1', client_meta: null });
  assert.equal(openThreads([root, done, again], 'agent-1').length, 1);
});
