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

test('a gate that throws, or will not load, is told to the session, not swallowed', () => {
  for (const gates of ["export const planGate = () => { throw new Error('boom'); };\nexport const stopGate = () => { throw new Error('boom'); };\n", "throw new Error('boom');\n"]) {
    // the copy sits at <toolkit>/tools/claude-hooks, as the real one does, so its toolkit is `dir` on any machine
    const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'hooks-throw-')));
    const hooks = path.join(dir, 'tools/claude-hooks');
    try {
      fs.mkdirSync(hooks, { recursive: true });
      fs.copyFileSync(path.join(HERE, 'hooks.mjs'), path.join(hooks, 'hooks.mjs'));
      fs.writeFileSync(path.join(hooks, 'gates.mjs'), gates);
      const sid = `throw-${process.pid}-${gates.length}`;
      const go = (mode, pl, env = {}) => spawnSync('node', [path.join(hooks, 'hooks.mjs'), mode], { input: JSON.stringify(pl), encoding: 'utf8', env: { ...process.env, TOOLKIT_VALIDATE: 'off', TOOLKIT_RULES: 'off', TOOLKIT_GATES: '', TOOLKIT_EVAL_COPY: '', ...env } });
      // the rule list needs the toolkit's other modules, absent from this copy: off here, read in the tests above
      const write = { session_id: sid, cwd: dir, tool_name: 'Write', tool_input: { file_path: path.join(dir, 'x') } };
      const e = go('edit', write);
      assert.equal(e.status, 0);
      const ctx = JSON.parse(e.stdout).hookSpecificOutput;
      assert.match(ctx.additionalContext, /plan gate .* failed .*boom/);
      assert.equal(ctx.permissionDecision, undefined);
      // said once a session
      assert.equal(go('edit', write).stdout.trim(), '');
      // the stop: blocked inside the gates' reach (the temp copy is its own toolkit), passed after a block
      const s1 = go('stop', { session_id: sid, stop_hook_active: false, cwd: dir });
      assert.equal(JSON.parse(s1.stdout).decision, 'block');
      assert.match(JSON.parse(s1.stdout).reason, /review gate .* failed .*boom/);
      assert.equal(go('stop', { session_id: sid, stop_hook_active: true, cwd: dir }).stdout.trim(), '');
      // switched off: nothing said
      assert.doesNotMatch(go('stop', { session_id: sid, stop_hook_active: false, cwd: dir }, { TOOLKIT_GATES: 'off' }).stdout, /review gate/);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
      for (const f of ['rules', 'stop', 'pending']) fs.rmSync(path.join(os.tmpdir(), `toolkit-${f}-throw-${process.pid}-${gates.length}`), { force: true });
    }
  }
});

/* The loop end to end, through hooks.mjs as Claude Code calls it (tools/toolkit-check/review.md point 21): one
   session's transcript grows turn by turn, and each hook answers as the work reaches it — the plan before the edit
   that makes the work full-size, the review before the turn ends, the close's lines, then the push. */
test('the loop runs end to end: plan, edit, review, close, push', (t) => {
  const tmp = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'test-loop-')));
  t.after(() => fs.rmSync(tmp, { recursive: true, force: true }));
  const env = { ...process.env, TMPDIR: tmp, TOOLKIT_VALIDATE: 'off', TOOLKIT_RULES: 'off' };
  delete env.TOOLKIT_GATES; delete env.TOOLKIT_EVAL_COPY;
  const hook = (m, pl) => spawnSync('node', [path.join(HERE, 'hooks.mjs'), m], { input: JSON.stringify(pl), encoding: 'utf8', env });
  const session_id = `test-loop-${process.pid}-${Date.now()}`;
  const transcript_path = path.join(tmp, `${session_id}.jsonl`);
  const old = (rec) => ({ ...rec, timestamp: '2020-01-01T00:00:00.000Z' });
  const call = (name, input, id) => ({ type: 'assistant', cwd: TOOLKIT, message: { content: [{ type: 'tool_use', id, name, input }] } });
  const result = (id, content = 'x') => ({ type: 'user', message: { content: [{ type: 'tool_result', tool_use_id: id, content }] } });
  const add = (...recs) => fs.appendFileSync(transcript_path, recs.map((r) => JSON.stringify(r)).join('\n') + '\n');
  const big = { file_path: path.join(TOOLKIT, 'loop-e2e.mjs'), old_string: 'a', new_string: Array(200).fill('b').join('\n') };
  const denied = (out) => (JSON.parse(out.stdout || '{}').hookSpecificOutput || {}).permissionDecision === 'deny';
  const blocked = (out) => JSON.parse(out.stdout || '{}').decision === 'block' ? JSON.parse(out.stdout).reason : null;

  // the work opens with the repo's check, run and read, and the user's ask
  add(old(call('Bash', { command: 'bin/check' }, 'c1')), old(result('c1', 'skills ok\ngreen')), { type: 'user', origin: { kind: 'human' }, message: { content: 'build it' } });
  // 1. the edit that makes it full-size, with no plan: refused
  const pre = { session_id, transcript_path, cwd: TOOLKIT, tool_name: 'Edit', tool_input: big, tool_use_id: 'e0' };
  // Claude Code writes the call before its PreToolUse hook runs, and a refused one comes back as an error
  add(call('Edit', big, 'e0'));
  let out = hook('edit', pre);
  assert.ok(denied(out), 'an unplanned full-size edit is refused');
  assert.match(JSON.parse(out.stdout).hookSpecificOutput.permissionDecisionReason, /planned before it is built/);
  add({ type: 'user', message: { content: [{ type: 'tool_result', tool_use_id: 'e0', is_error: true, content: 'refused' }] } });
  // 2. the plan written: the same edit goes through
  fs.writeFileSync(path.join(tmp, `toolkit-plan-${session_id}.md`), '# Plan\n## Before\ngreen\n§D 1 no owner; §D 2 yes; §D 5 stored\n## Goal\nx\n## Impact\ntoolkit: a.mjs (2 readers)\n## Claims\nnone believed\n## Beyond scope\nnone\n## Budget\n1h\n## Review\n2 agents\n');
  add(call('Edit', big, 'e1'));
  out = hook('edit', { ...pre, tool_use_id: 'e1' });
  assert.ok(!denied(out) && !/failed/.test(out.stdout), `a planned edit goes through: ${out.stdout}`);
  add(result('e1'));
  // 3. the turn ends unreviewed: held, and the push too
  assert.match(blocked(hook('stop', { session_id, transcript_path, cwd: TOOLKIT, last_assistant_message: 'Done.' })) || '', /^Not done yet/);
  const push = { session_id, transcript_path, cwd: TOOLKIT, tool_name: 'Bash', tool_input: { command: 'git push' } };
  assert.ok(denied(hook('edit', push)), 'unreviewed full-size work is not pushed');
  // 4. a fresh read-only reviewer reports: the close's lines are owed
  add(call('Agent', { description: 'Review the change', prompt: 'Review this diff', subagent_type: 'Explore' }, 'r1'), result('r1', 'No High findings.'));
  assert.match(blocked(hook('stop', { session_id, transcript_path, cwd: TOOLKIT, last_assistant_message: 'Done.' })) || '', /^Reviewed full-size work ends/);
  // 5. the close said: the turn ends, and the push goes
  const close = 'Done.\nToolkit: nothing; checked the standards.\nOpen: nothing.\nDocs: README.md still right.';
  assert.equal(hook('stop', { session_id, transcript_path, cwd: TOOLKIT, last_assistant_message: close, stop_hook_active: true }).stdout, '');
  // the gate ran and closed the work (a gate that threw would also print nothing): the plan is put aside
  assert.ok(fs.readdirSync(tmp).some((f) => f.startsWith(`toolkit-plan-${session_id}-`) && f.endsWith('.done.md')), 'the closed work\'s plan is put aside');
  out = hook('edit', push);
  assert.ok(!denied(out) && !/failed/.test(out.stdout), 'reviewed work is pushed');
});
