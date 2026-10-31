import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const TOOLKIT = path.resolve(HERE, '../..');
const run = (mode, payload) => spawnSync('node', [path.join(HERE, 'hooks.mjs'), mode], { input: JSON.stringify(payload), encoding: 'utf8' });

test('prompt hands over what stop kept, once, as context the user does not see', () => {
  const session_id = `test-${process.pid}-${Date.now()}`;
  const pending = path.join(os.tmpdir(), `toolkit-pending-${session_id}`);
  fs.writeFileSync(pending, 'toolkit: 1 uncommitted: a.md\ntoolkit: 1 uncommitted: a.md\n');
  const out = JSON.parse(run('prompt', { session_id }).stdout);
  assert.equal(out.hookSpecificOutput.hookEventName, 'UserPromptSubmit');
  assert.match(out.hookSpecificOutput.additionalContext, /toolkit: 1 uncommitted: a\.md\n\n/);
  assert.equal(out.decision, undefined);
  assert.equal(fs.existsSync(pending), false);
  assert.equal(run('prompt', { session_id }).stdout, '');
});

test('the first change in an area goes through with its rules beside it, once', () => {
  const session_id = `test-${process.pid}-${Date.now()}`;
  const payload = { session_id, cwd: TOOLKIT, tool_name: 'Edit', tool_input: { file_path: path.join(TOOLKIT, 'standards/code-standard.md') } };
  // the plan gate measures size; this test is about the rule list, so it is off here (test-gates.mjs has it)
  const quiet = (m, pl) => spawnSync('node', [path.join(HERE, 'hooks.mjs'), m], { input: JSON.stringify(pl), encoding: 'utf8', env: { ...process.env, TOOLKIT_GATES: 'off' } });
  const first = JSON.parse(quiet('edit', payload).stdout).hookSpecificOutput;
  assert.equal(first.permissionDecision, undefined);
  assert.match(first.additionalContext, /^First change in this area/);
  assert.equal(quiet('edit', payload).stdout, '');
  fs.rmSync(path.join(os.tmpdir(), `toolkit-rules-${session_id}`), { force: true });
});

test('an interface file names the knowledge pages to read before the first line, each once a session', () => {
  const session_id = `test-${process.pid}-${Date.now()}-kb`;
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'kb-'));
  const edit = (f) => spawnSync('node', [path.join(HERE, 'hooks.mjs'), 'edit'], { input: JSON.stringify({ session_id, cwd: repo, tool_name: 'Write', tool_input: { file_path: path.join(repo, f) } }), encoding: 'utf8', env: { ...process.env, TOOLKIT_EVAL_COPY: repo } });
  const first = JSON.parse(edit('src/people/delete-dialog.tsx').stdout).hookSpecificOutput.additionalContext;
  assert.match(first, /^First change in this area/);
  assert.match(first, /read these knowledge pages before the first line[\s\S]*knowledge\/ui\/patterns\/dialogs\.md[\s\S]*knowledge\/ui\/design\/visual\.md/);
  assert.match(first, /"Knowledge:" trailer/);
  // a second interface file: the areas are seen, only its new pattern is named
  const second = JSON.parse(edit('src/people/upload-field.tsx').stdout).hookSpecificOutput.additionalContext;
  assert.doesNotMatch(second, /First change|dialogs\.md|visual\.md/);
  assert.match(second, /upload\.md/);
  assert.match(second, /forms\.md/);
  assert.equal(edit('src/people/delete-dialog.tsx').stdout, '');
  // a script that draws nothing names no page
  assert.doesNotMatch(edit('src/lib/rules.ts').stdout, /knowledge/);
  fs.rmSync(repo, { recursive: true, force: true });
  fs.rmSync(path.join(os.tmpdir(), `toolkit-rules-${session_id}`), { force: true });
});
