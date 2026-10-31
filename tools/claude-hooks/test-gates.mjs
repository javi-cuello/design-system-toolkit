import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { planGate, stopGate, shellWrites, planPath, size, advance, isReview, lineDiff, isPush } from './gates.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const TOOLKIT = fs.realpathSync(path.resolve(HERE, '../..'));
const REPOS = [TOOLKIT];
delete process.env.TOOLKIT_GATES; delete process.env.TOOLKIT_EVAL_COPY;
// state, plans and the carry between sessions live in tmp: the tests keep their own
process.env.TMPDIR = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'test-gates-')));

let n = 0;
/* A session: a transcript built from turns, and its own id so no state leaks. */
function session(lines) {
  const id = `test-gates-${process.pid}-${n++}`;
  const file = path.join(os.tmpdir(), `${id}.jsonl`);
  fs.writeFileSync(file, lines.map((l) => JSON.stringify(l)).join('\n') + '\n');
  return { id, file, clean: () => { for (const f of [file, planPath(id), path.join(os.tmpdir(), `toolkit-gates-${id}.json`)]) fs.rmSync(f, { force: true }); } };
}
const user = (text) => ({ type: 'user', origin: { kind: 'human' }, message: { content: text } });
const harness = (text) => ({ type: 'user', isMeta: true, origin: null, message: { content: text } });
const PLAN_TEXT = '# Plan\n## Goal\nx\n## Impact\ntoolkit: a.mjs (2 readers)\n## Claims\nnone believed\n## Beyond scope\nnone\n## Budget\n1h\n## Review\n2 agents\n';
const DONE = 'Done.\nToolkit: nothing; checked the standards.\nOpen: nothing.';
const call = (name, input) => ({ type: 'assistant', cwd: TOOLKIT, message: { content: [{ type: 'tool_use', name, input }] } });
const edit = (rel, lines = 1) => call('Edit', { file_path: path.join(TOOLKIT, rel), old_string: 'a', new_string: Array(lines).fill('b').join('\n') });
const review = (extra = {}) => call('Agent', { description: 'Review the gates', prompt: 'Review this diff', subagent_type: 'Explore', ...extra });
const result = (id, is_error) => ({ type: 'user', message: { content: [{ type: 'tool_result', tool_use_id: id, is_error, content: 'x' }] } });
const withId = (rec, id) => { rec.message.content[0].id = id; return rec; };

test('a shell command writes only where it redirects, tees or edits in place, never inside quotes', () => {
  assert.deepEqual(shellWrites(`node -e "import('x').then(({a})=>a)"`, TOOLKIT), []);
  assert.deepEqual(shellWrites(`awk '{ if ($2>400) big++ }' f`, TOOLKIT), []);
  assert.deepEqual(shellWrites('ls 2>/dev/null; cmd 2>&1', TOOLKIT), []);
  assert.deepEqual(shellWrites('echo hi > notes/a.md', TOOLKIT), [path.join(TOOLKIT, 'notes/a.md')]);
  assert.deepEqual(shellWrites("cd /tmp && sed -i '' 's/a/b/' x.txt", TOOLKIT), ['/tmp/x.txt']);
  assert.deepEqual(shellWrites('python3 - <<EOF\nopen("a.md","w") > 1\nEOF', TOOLKIT), []);
});

test('a shell write into another repo is seen when its path is quoted or it is a cp or mv', () => {
  const other = path.resolve(TOOLKIT, '../other');
  assert.deepEqual(shellWrites(`echo hi > "${other}/a b.md"`, TOOLKIT), [path.join(other, 'a b.md')]);
  assert.deepEqual(shellWrites(`echo hi | tee '${other}/c.md'`, TOOLKIT), [path.join(other, 'c.md')]);
  assert.deepEqual(shellWrites(`cp -R notes/x.md "${other}/y.md"`, TOOLKIT), [path.join(other, 'y.md')]);
  assert.deepEqual(shellWrites(`mv a.md b.md ${TOOLKIT}/tools`, TOOLKIT), [path.join(TOOLKIT, 'tools/a.md'), path.join(TOOLKIT, 'tools/b.md'), path.join(TOOLKIT, 'a.md'), path.join(TOOLKIT, 'b.md')], 'into a folder: each source by name, and each source is taken away');
  assert.deepEqual(shellWrites('echo hi > "$OUT"', TOOLKIT), [], 'a variable cannot be resolved');
  assert.deepEqual(shellWrites('cp a.md ../other/x.md\nnpm test', TOOLKIT), [path.join(other, 'x.md')], 'a newline ends the command');
  assert.deepEqual(shellWrites('cp a.md b.md 2>/dev/null', TOOLKIT), [path.join(TOOLKIT, 'b.md')], 'a redirect is not an operand');
  assert.deepEqual(shellWrites('cp a b # copy into place', TOOLKIT), [path.join(TOOLKIT, 'b')], 'a comment is not an operand');
  assert.deepEqual(shellWrites('mv ../other/a.md .', TOOLKIT), [path.join(TOOLKIT, 'a.md'), path.join(other, 'a.md')], "mv also changes its source's repo");
  assert.deepEqual(shellWrites('mv a.md x.md && mv b.md y.md', TOOLKIT), [path.join(TOOLKIT, 'x.md'), path.join(TOOLKIT, 'y.md')], 'two renames in place are two files, not four');
  assert.deepEqual(shellWrites('grep -rn cp tools/ skills/', TOOLKIT), [], 'cp as a word, not a command, writes nothing');
  assert.deepEqual(shellWrites('npm test # then cp a b', TOOLKIT), [], 'nor in a comment');
  assert.deepEqual(shellWrites('git mv a.md docs/b.md', TOOLKIT), [path.join(TOOLKIT, 'docs/b.md'), path.join(TOOLKIT, 'a.md')], 'git mv is a move');
  assert.deepEqual(shellWrites('mv standards/code.md archive/code.md', TOOLKIT), [path.join(TOOLKIT, 'archive/code.md'), path.join(TOOLKIT, 'standards/code.md')], 'a move out of a folder takes its source away (a standard, a README), even inside the folder the command runs in');
  assert.deepEqual(shellWrites('mv toolkit/a.md other/a.md', path.dirname(TOOLKIT)), [path.join(path.dirname(TOOLKIT), 'other/a.md'), path.join(path.dirname(TOOLKIT), 'toolkit/a.md')], 'from a parent folder, both repos');
  for (const c of ['sudo cp a ../other/x.md', 'if true; then cp a ../other/x.md; fi', 'for f in a; do cp "$f" ../other/x.md; done', 'env X=1 cp a ../other/x.md', 'time cp a ../other/x.md', 'command cp a ../other/x.md'])
    assert.deepEqual(shellWrites(c, TOOLKIT), [path.join(other, 'x.md')], `after a word that runs the next: ${c}`);
  assert.deepEqual(shellWrites('ls | xargs mv -t ../other', TOOLKIT), [other], 'xargs mv -t: the target folder');
  assert.deepEqual(shellWrites('for f in *.md; do mv "$f" ../other/; done', TOOLKIT), [other], 'a loop variable into a folder: the folder');
  assert.deepEqual(shellWrites('ls | xargs -I{} mv {} ../other/', TOOLKIT), [other], "xargs's {} into a folder: the folder");
  assert.deepEqual(shellWrites('cp --target-directory ../other a.md', TOOLKIT), [path.join(other, 'a.md')], '--target-directory with a space');
});

test('size: a few small edits are small; more files, more lines, a standard or bookkeeping decide it', () => {
  const s = session([edit('tools/a.mjs'), edit('tools/b.mjs'), edit('skills/x/CHANGELOG.md', 500), edit('skills/x/tests/cases.md', 500), edit('standards/code-standard.md', 3)]);
  assert.equal(size(advance(s.id, s.file, REPOS).total).full, false);
  s.clean();
  for (const [lines, why] of [
    [[edit('a.mjs'), edit('b.mjs'), edit('c.mjs'), edit('d.mjs')], /4 files/],
    [[edit('a.mjs', 101)], /101 lines/],
    [[edit('standards/code-standard.md', 11)], /a standard or shared tool/],
  ]) {
    const t = session(lines);
    const z = size(advance(t.id, t.file, REPOS).total);
    assert.equal(z.full, true); assert.match(z.why.join(), why);
    t.clean();
  }
  const outside = session([edit('../../elsewhere/a.mjs', 900)]);
  assert.equal(size(advance(outside.id, outside.file, REPOS).total).full, false, 'a file outside every repo does not count');
  outside.clean();
});

test('plan gate: the call that makes the work full is refused until a plan with an Impact section exists', () => {
  const s = session([edit('a.mjs'), edit('b.mjs'), edit('c.mjs')]);
  const next = { name: 'Edit', input: { file_path: path.join(TOOLKIT, 'd.mjs'), old_string: 'a', new_string: 'b' } };
  assert.match(planGate(s.id, s.file, REPOS, next, TOOLKIT), /full-size \(4 files\)[\s\S]*impact\.mjs/);
  assert.equal(planGate(s.id, s.file, REPOS, { name: 'Read', input: { file_path: path.join(TOOLKIT, 'd.mjs') } }, TOOLKIT), null, 'a call that writes nothing passes');
  assert.equal(planGate(s.id, s.file, REPOS, { name: 'Write', input: { file_path: planPath(s.id), content: '# plan' } }, TOOLKIT), null, 'writing the plan itself passes');
  fs.writeFileSync(planPath(s.id), '# Plan\n## Impact\nx\n');
  assert.notEqual(planGate(s.id, s.file, REPOS, next, TOOLKIT), null, 'a heading alone is not a plan: every section, and impact.mjs output');
  fs.writeFileSync(planPath(s.id), PLAN_TEXT);
  assert.equal(planGate(s.id, s.file, REPOS, next, TOOLKIT), null);
  s.clean();
});

test('plan gate: a small session passes, and skill-evals copies are never gated', () => {
  const s = session([edit('a.mjs')]);
  assert.equal(planGate(s.id, s.file, REPOS, { name: 'Edit', input: { file_path: path.join(TOOLKIT, 'b.mjs'), old_string: 'a', new_string: 'b' } }, TOOLKIT), null);
  s.clean();
  const big = session([edit('a.mjs', 500)]);
  process.env.TOOLKIT_EVAL_COPY = '/tmp/copy';
  assert.equal(planGate(big.id, big.file, REPOS, { name: 'Edit', input: { file_path: path.join(TOOLKIT, 'b.mjs'), old_string: 'a', new_string: 'b' } }, TOOLKIT), null);
  delete process.env.TOOLKIT_EVAL_COPY;
  big.clean();
});

test('review gate: a turn with full-size edits since the last review is blocked; a fresh review after them clears it', () => {
  const s = session([user('build it'), edit('a.mjs', 200)]);
  assert.match(stopGate(s.id, s.file, REPOS, 'Done.'), /^Not done yet: 200 lines[\s\S]*Explore, never a fork/);
  s.clean();
  const forked = session([user('build it'), edit('a.mjs', 200), review({ subagent_type: 'fork' })]);
  assert.match(stopGate(forked.id, forked.file, REPOS, 'Done.'), /^Not done yet/, 'a fork shares the reasoning, so it is not a review');
  forked.clean();
  const fixed = session([user('build it'), edit('a.mjs', 200), review(), edit('a.mjs', 3)]);
  assert.equal(stopGate(fixed.id, fixed.file, REPOS, DONE + '\nDocs: README.md still right.'), null, 'a small fix after the review needs no second one');
  fixed.clean();
});

test('feedback gate: a turn that ran a review ends with the toolkit question answered', () => {
  const s = session([user('build it'), edit('a.mjs', 200), review()]);
  assert.match(stopGate(s.id, s.file, REPOS, 'Done.'), /"Toolkit:" and a line starting "Open:"/);
  assert.match(stopGate(s.id, s.file, REPOS, 'Done.\n**Toolkit:** nothing'), /^Reviewed full-size work ends with a line starting "Open:"/);
  assert.equal(stopGate(s.id, s.file, REPOS, 'Done.\n\n**Toolkit:** nothing; checked the standards.\nOpen: nothing.\nDocs: README.md still right.'), null);
  s.clean();
});

/* A scratch repo with one commit, for the gates that read git. */
function repo() {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'repo-')));
  const git = (...a) => spawnSync('git', ['-C', dir, ...a], { encoding: 'utf8' });
  fs.writeFileSync(path.join(dir, 'base.mjs'), 'x\n');
  git('init', '-q'); git('add', '.'); git('-c', 'user.email=t@t', '-c', 'user.name=t', 'commit', '-qm', 'base');
  return dir;
}
const at = (rec, ms) => ({ ...rec, timestamp: new Date(ms).toISOString() });
const lines = (n) => Array(n).fill('line').join('\n');

test('feedback gate: a background review is waited on until its notification comes back', () => {
  const launched = { type: 'user', message: { content: [{ type: 'tool_result', tool_use_id: 'r1', content: [{ type: 'text', text: 'Async agent launched successfully.' }] }] } };
  const lines = [user('build it'), edit('a.mjs', 200), withId(review(), 'r1'), launched];
  const s = session(lines);
  assert.equal(stopGate(s.id, s.file, REPOS, 'Reviewers are running.'), null, 'a review still running has not closed the work');
  fs.appendFileSync(s.file, JSON.stringify({ type: 'user', origin: { kind: 'task-notification' }, message: { content: '<task-notification>\n<tool-use-id>r1</tool-use-id>\n<status>completed</status>' } }) + '\n');
  assert.match(stopGate(s.id, s.file, REPOS, 'Done.'), /^Reviewed full-size work ends/, 'once it reports, the close is owed');
  s.clean();
  // one that reports mid-turn is recorded as a queued attachment, not a user message
  const m = session([user('build it'), edit('a.mjs', 200), withId(review(), 'r2'), { ...launched, message: { content: [{ ...launched.message.content[0], tool_use_id: 'r2' }] } },
    { type: 'attachment', attachment: { type: 'queued_command', prompt: '<task-notification>\n<tool-use-id>r2</tool-use-id>\n<status>completed</status>' } }]);
  assert.match(stopGate(m.id, m.file, REPOS, 'Done.'), /^Reviewed full-size work ends/);
  m.clean();
});

test('push gate: unreviewed full-size work is not pushed; reviewed or small work is', () => {
  assert.equal(isPush('git push'), true);
  assert.equal(isPush('cd x && git -C ~/a push origin main'), true);
  assert.equal(isPush('git -c core.x=1 --no-pager push'), true);
  assert.equal(isPush('echo "git push"; git status'), false);
  const small = session([user('fix it'), edit('a.mjs', 5)]);
  assert.equal(planGate(small.id, small.file, REPOS, { id: 'p0', name: 'Bash', input: { command: 'git push' } }, TOOLKIT), null);
  small.clean();
  const s = session([user('build it'), edit('a.mjs', 200)]);
  fs.writeFileSync(planPath(s.id), PLAN_TEXT);
  assert.match(planGate(s.id, s.file, REPOS, { id: 'p1', name: 'Bash', input: { command: 'git push' } }, TOOLKIT), /^Not pushed/);
  s.clean();
  assert.equal(isPush('git push --dry-run'), false);
  const elsewhere = repo();
  const o = session([user('build it'), edit('a.mjs', 200)]);
  assert.equal(planGate(o.id, o.file, [TOOLKIT, elsewhere], { id: 'p3', name: 'Bash', input: { command: `git -C ${elsewhere} push` } }, TOOLKIT), null, "another repo's push is not held back");
  o.clean(); fs.rmSync(elsewhere, { recursive: true, force: true });
  const launched = { type: 'user', message: { content: [{ type: 'tool_result', tool_use_id: 'r9', content: 'Async agent launched successfully.' }] } };
  const r = session([user('build it'), edit('a.mjs', 200), withId(review(), 'r9'), launched]);
  assert.match(planGate(r.id, r.file, REPOS, { id: 'p2', name: 'Bash', input: { command: 'git push' } }, TOOLKIT), /a review is still running/);
  fs.appendFileSync(r.file, JSON.stringify({ type: 'user', origin: { kind: 'task-notification' }, message: { content: '<task-notification>\n<tool-use-id>r9</tool-use-id>' } }) + '\n');
  assert.equal(planGate(r.id, r.file, REPOS, { id: 'p4', name: 'Bash', input: { command: 'git push' } }, TOOLKIT), null, 'reviewed and reported: pushed');
  r.clean();
});

test("a script's own writes are found on disk inside the call's span, and nothing outside it", () => {
  const dir = repo();
  const t0 = Date.now() - 5000;
  fs.writeFileSync(path.join(dir, 'old.mjs'), lines(300));
  fs.utimesSync(path.join(dir, 'old.mjs'), new Date(t0 - 60000), new Date(t0 - 60000)); // before the call: not its write
  fs.writeFileSync(path.join(dir, 'gen.mjs'), lines(150));
  const bash = { ...withId(call('Bash', { command: 'python3 gen.py' }), 'b1'), cwd: dir };
  const s = session([at(user('generate it'), t0 - 1000), at(bash, t0), at(result('b1', false), Date.now() + 1000)]);
  const st = advance(s.id, s.file, [dir]);
  assert.deepEqual(Object.keys(st.total.files), [path.join(dir, 'gen.mjs')]);
  assert.equal(st.total.files[path.join(dir, 'gen.mjs')], 150);
  assert.match(stopGate(s.id, s.file, [dir], 'Done.'), /^Not done yet: 150 lines/);
  s.clean(); fs.rmSync(dir, { recursive: true, force: true });
});

test("a script's writes followed by a review are that review's: the turn ends", () => {
  const dir = repo();
  try {
    const t0 = Date.now() - 5000;
    fs.writeFileSync(path.join(dir, 'gen.mjs'), lines(200));
    const s = session([at(user('generate it'), t0 - 1000), at({ ...withId(call('Bash', { command: 'node gen.js' }), 'b5'), cwd: dir }, t0), at(result('b5', false), Date.now() + 1000), at(review(), Date.now() + 2000)]);
    assert.match(stopGate(s.id, s.file, [dir], 'Done.', dir), /^Reviewed full-size work ends/);
    s.clean();
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('a file written just before a shell call is not that call\'s, and a subagent\'s script before the review is the review\'s', () => {
  const dir = repo();
  try {
    const t0 = Date.now() - 3000;
    fs.writeFileSync(path.join(dir, 'new.mjs'), lines(60)); // the Write in the same message, landed before the Bash began
    const w = { ...withId(call('Write', { file_path: path.join(dir, 'new.mjs'), content: lines(60) }), 'w9'), cwd: dir };
    const s = session([at(user('go'), t0 - 1000), at(w, t0)]);
    const bash = { ...withId(call('Bash', { command: 'node test.mjs' }), 'b9'), cwd: dir };
    fs.appendFileSync(s.file, JSON.stringify(at(bash, t0 + 10)) + '\n');
    assert.equal(planGate(s.id, s.file, [dir], { id: 'b9', name: 'Bash', input: { command: 'node test.mjs' } }, dir), null);
    fs.appendFileSync(s.file, JSON.stringify(at(result('b9', false), Date.now() + 1000)) + '\n');
    assert.equal(advance(s.id, s.file, [dir]).total.files[path.join(dir, 'new.mjs')], 60, 'counted once, by the Write');
    s.clean();
    const r = session([at(user('go'), t0 - 1000), at(review(), Date.now() + 5000)]);
    const subs = path.join(r.file.replace(/\.jsonl$/, ''), 'subagents');
    fs.mkdirSync(subs, { recursive: true });
    fs.writeFileSync(path.join(dir, 'gen.mjs'), lines(150));
    fs.writeFileSync(path.join(subs, 'agent-x.jsonl'), [at({ ...withId(call('Bash', { command: 'node gen.js' }), 'b8'), cwd: dir }, t0), at(result('b8', false), Date.now() + 1000)].map((l) => JSON.stringify(l)).join('\n') + '\n');
    assert.equal(size(advance(r.id, r.file, [dir]).since).lines, 0);
    fs.rmSync(subs.replace(/\/subagents$/, ''), { recursive: true, force: true }); r.clean();
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('a script over work already there counts only what it adds (a formatter over reviewed work)', () => {
  const dir = repo();
  fs.writeFileSync(path.join(dir, 'base.mjs'), lines(200));
  const t0 = Date.now();
  const s = session([at(user('format it'), t0 - 1000)]);
  assert.equal(planGate(s.id, s.file, [dir], { id: 'b2', name: 'Bash', input: { command: 'npx prettier --write .' } }, dir), null);
  fs.writeFileSync(path.join(dir, 'base.mjs'), lines(202));
  fs.appendFileSync(s.file, [at({ ...withId(call('Bash', { command: 'npx prettier --write .' }), 'b2'), cwd: dir }, t0), at(result('b2', false), Date.now() + 1000)].map((l) => JSON.stringify(l)).join('\n') + '\n');
  assert.equal(advance(s.id, s.file, [dir]).total.files[path.join(dir, 'base.mjs')], 2);
  s.clean(); fs.rmSync(dir, { recursive: true, force: true });
});

test('small work one session leaves uncommitted is carried into the next session', () => {
  const dir = repo();
  const git = (...a) => spawnSync('git', ['-C', dir, ...a], { encoding: 'utf8' });
  fs.writeFileSync(path.join(dir, 'base.mjs'), lines(61));
  const editOf = (f, n) => call('Edit', { file_path: path.join(dir, f), old_string: 'x', new_string: lines(n) });
  const a = session([user('fix it'), editOf('base.mjs', 60)]);
  const b = session([user('more'), editOf('next.mjs', 60)]);
  const c = session([user('again'), editOf('other.mjs', 30)]);
  try {
    assert.equal(stopGate(a.id, a.file, [dir], 'Fixed.', dir), null, 'small on its own');
    assert.match(stopGate(b.id, b.file, [dir], 'Done.', dir), /^Not done yet: 120 lines/, 'the halves add up');
    assert.equal(stopGate(b.id, b.file, [dir], 'Done.', path.join(os.tmpdir())), null, 'only in the repo the session works in');
    git('add', '.'); git('-c', 'user.email=t@t', '-c', 'user.name=t', 'commit', '-qm', 'a');
    fs.appendFileSync(c.file, JSON.stringify(user('go on')) + '\n' + JSON.stringify(editOf('other.mjs', 20)) + '\n');
    assert.equal(stopGate(c.id, c.file, [dir], 'Done.', dir), null, "committed by its session: no longer anyone else's to review");
    assert.deepEqual(JSON.parse(fs.readFileSync(path.join(os.tmpdir(), 'toolkit-gates-carry.json'), 'utf8')), {}, 'the carry file empties');
  } finally { for (const x of [a, b, c]) x.clean(); fs.rmSync(dir, { recursive: true, force: true }); }
});

test('a carry file of the wrong shape is ignored, never crashes a gate', () => {
  fs.writeFileSync(path.join(os.tmpdir(), 'toolkit-gates-carry.json'), JSON.stringify({ x: { at: Date.now(), files: null, wide: [] }, y: 3 }));
  const s = session([user('go'), edit('a.mjs', 5)]);
  assert.equal(stopGate(s.id, s.file, REPOS, 'Done.', TOOLKIT), null);
  s.clean();
});

test('stop gates stay quiet on small work, and on a turn that only answered', () => {
  const small = session([user('fix it'), edit('a.mjs', 5)]);
  assert.equal(stopGate(small.id, small.file, REPOS, 'Fixed.'), null);
  small.clean();
  const answered = session([user('build it'), edit('a.mjs', 200), user('what did you change?')]);
  assert.equal(stopGate(answered.id, answered.file, REPOS, 'This.'), null);
  answered.clean();
});

test('the transcript is read from where the last call stopped, and a line still being written waits', () => {
  const s = session([user('go'), edit('a.mjs', 10)]);
  assert.equal(size(advance(s.id, s.file, REPOS).total).lines, 10);
  fs.appendFileSync(s.file, JSON.stringify(edit('b.mjs', 20)) + '\n' + JSON.stringify(edit('c.mjs', 30)).slice(0, 40));
  assert.equal(size(advance(s.id, s.file, REPOS).total).lines, 30, 'the half-written line is not read');
  fs.appendFileSync(s.file, JSON.stringify(edit('c.mjs', 30)).slice(40) + '\n');
  assert.equal(size(advance(s.id, s.file, REPOS).total).lines, 60);
  s.clean();
});

test('hooks.mjs speaks the gates in the harness forms: a deny before the tool, a block at Stop', () => {
  const s = session([user('build it'), edit('a.mjs', 200)]);
  const run = (mode, payload) => spawnSync('node', [path.join(HERE, 'hooks.mjs'), mode], { input: JSON.stringify(payload), encoding: 'utf8', env: { ...process.env, TOOLKIT_RULES: 'off' } });
  const pre = JSON.parse(run('edit', { session_id: s.id, transcript_path: s.file, cwd: TOOLKIT, tool_name: 'Edit', tool_input: { file_path: path.join(TOOLKIT, 'b.mjs'), old_string: 'a', new_string: 'b' } }).stdout).hookSpecificOutput;
  assert.equal(pre.permissionDecision, 'deny');
  const stop = JSON.parse(run('stop', { session_id: s.id, transcript_path: s.file, cwd: TOOLKIT, last_assistant_message: 'Done.' }).stdout);
  assert.equal(stop.decision, 'block');
  s.clean();
});

test("the harness's own records are not a person speaking: a Stop block's feedback does not let the next stop through", () => {
  const s = session([user('build it'), edit('a.mjs', 200), harness('Stop hook feedback:\nNot done yet'), harness('Base directory for this skill: x'), { type: 'user', message: { content: '<task-notification>\n<task-id>x</task-id>' } }]);
  assert.match(stopGate(s.id, s.file, REPOS, 'Done.'), /^Not done yet/);
  s.clean();
});

test('a review is a read-only reviewer: an implementer applying review fixes, or a fork, is not one', () => {
  assert.equal(isReview({ name: 'Agent', input: { description: 'Review gate logic', subagent_type: 'Explore' } }), true);
  assert.equal(isReview({ name: 'Agent', input: { description: 'Apply review fixes', subagent_type: 'general-purpose' } }), false);
  assert.equal(isReview({ name: 'Agent', input: { description: 'Review it', subagent_type: 'fork' } }), false);
  assert.equal(isReview({ name: 'Agent', input: { description: 'Build it', prompt: 'then review', subagent_type: 'Explore' } }), false);
  assert.equal(isReview({ name: 'Agent', input: { description: 'Review the plan', subagent_type: 'Plan' } }), false, 'only Explore, as the Stop gate says');
  assert.equal(isReview({ name: 'Agent', input: { description: 'Review it', subagent_type: 'code-reviewer' } }), false, 'a custom type may write');
  assert.equal(isReview({ name: 'Skill', input: { skill: 'code-review' } }), true);
});

test("a subagent's edits are the session's work; its own reviews are not", () => {
  const s = session([user('build it'), call('Agent', { description: 'Build it', prompt: 'x', subagent_type: 'general-purpose' })]);
  const dir = path.join(s.file.replace(/\.jsonl$/, ''), 'subagents');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'agent-1.jsonl'), [edit('a.mjs', 150), review()].map((l) => JSON.stringify(l)).join('\n') + '\n');
  // a subagent's edits mark the turn too: they are written while it runs
  assert.match(stopGate(s.id, s.file, REPOS, 'Done.'), /^Not done yet: 150 lines/);
  fs.rmSync(path.dirname(dir), { recursive: true, force: true });
  s.clean();
});

test("a background agent's edits in its own worktree are not the session's; the session's own there are", () => {
  const s = session([user('build it'), call('Agent', { description: 'Build it', prompt: 'x', subagent_type: 'general-purpose' })]);
  const dir = path.join(s.file.replace(/\.jsonl$/, ''), 'subagents');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'agent-1.jsonl'), JSON.stringify(edit('.claude/worktrees/agent-x/a.mjs', 150)) + '\n');
  assert.equal(size(advance(s.id, s.file, REPOS).total).lines, 0);
  fs.rmSync(path.dirname(dir), { recursive: true, force: true });
  s.clean();
  const own = session([user('build it'), edit('.claude/worktrees/agent-x/a.mjs', 150)]);
  assert.equal(size(advance(own.id, own.file, REPOS).total).lines, 150);
  own.clean();
});

test("the plan gate lets a subagent write its own worktree, and holds the session there", () => {
  const big = (id) => ({ id, name: 'Write', input: { file_path: path.join(TOOLKIT, '.claude/worktrees/agent-x/big.mjs'), content: Array(900).fill('b').join('\n') } });
  const s = session([user('build it')]);
  assert.equal(planGate(s.id, s.file, REPOS, big('w1'), TOOLKIT, true), null);
  assert.match(String(planGate(s.id, s.file, REPOS, big('w2'), TOOLKIT)), /plan/i);
  s.clean();
});

test('a call that failed or was refused counts nothing, and the pending call is never counted twice', () => {
  const s = session([user('go'), withId(edit('a.mjs', 60), 'e1'), result('e1', true)]);
  assert.equal(size(advance(s.id, s.file, REPOS).total).lines, 0);
  s.clean();
  const t = session([user('go'), withId(edit('a.mjs', 60), 'e2')]);
  assert.equal(planGate(t.id, t.file, REPOS, { id: 'e2', name: 'Edit', input: { file_path: path.join(TOOLKIT, 'a.mjs'), old_string: 'a', new_string: Array(60).fill('b').join('\n') } }, TOOLKIT), null, '60 lines are 60, not 120');
  t.clean();
});

test('a rewrite counts the lines it changes, not the file it writes', () => {
  assert.equal(lineDiff('a\nb\nc\nd', 'a\nb\nX\nd'), 1);
  const dir = fs.mkdtempSync(path.join(TOOLKIT, '.gates-test-'));
  const f = path.join(dir, 'big.md');
  fs.writeFileSync(f, Array.from({ length: 300 }, (_, i) => `line ${i}`).join('\n'));
  const s = session([user('go')]);
  try { // inside the repo, so a failed run must not leave it behind
    const content = fs.readFileSync(f, 'utf8').replace('line 7', 'line seven');
    assert.equal(planGate(s.id, s.file, REPOS, { id: 'w1', name: 'Write', input: { file_path: f, content } }, TOOLKIT), null);
    fs.appendFileSync(s.file, JSON.stringify(withId(call('Write', { file_path: f, content }), 'w1')) + '\n');
    assert.equal(size(advance(s.id, s.file, REPOS).total).lines, 1);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); s.clean(); }
});

test('reviewed work names the READMEs that describe it and were left alone', () => {
  const s = session([user('build it'), edit('tools/claude-hooks/x.mjs', 200), review()]);
  assert.match(stopGate(s.id, s.file, REPOS, DONE), /"Docs:"[\s\S]*tools\/claude-hooks\/README\.md/);
  assert.equal(stopGate(s.id, s.file, REPOS, DONE + '\nDocs: tools/claude-hooks/README.md still right.'), null);
  s.clean();
  const t = session([user('build it'), edit('tools/claude-hooks/x.mjs', 200), edit('tools/claude-hooks/README.md', 3), review()]);
  assert.equal(stopGate(t.id, t.file, REPOS, DONE), null, 'a README updated with the work asks nothing');
  t.clean();
});

test('a typo fixed inside a long anchor is one line, even in a standard', () => {
  const anchor = Array.from({ length: 20 }, (_, i) => `rule ${i}`).join('\n');
  const s = session([user('fix'), call('Edit', { file_path: path.join(TOOLKIT, 'standards/code-standard.md'), old_string: anchor, new_string: anchor.replace('rule 3', 'rule three') })]);
  assert.equal(size(advance(s.id, s.file, REPOS).total).full, false);
  s.clean();
});

test('closing reviewed work puts its plan aside, so the next full-size work plans afresh', () => {
  const s = session([user('build it'), edit('a.mjs', 200), review()]);
  fs.writeFileSync(planPath(s.id), PLAN_TEXT);
  assert.equal(stopGate(s.id, s.file, REPOS, DONE + '\nDocs: README.md still right.'), null);
  assert.equal(fs.existsSync(planPath(s.id)), false);
  assert.match(planGate(s.id, s.file, REPOS, { name: 'Edit', input: { file_path: path.join(TOOLKIT, 'b.mjs'), old_string: 'a', new_string: Array(150).fill('b').join('\n') } }, TOOLKIT), /Write the plan/);
  for (const f of fs.readdirSync(os.tmpdir()).filter((f) => f.startsWith(`toolkit-plan-${s.id}-`))) fs.rmSync(path.join(os.tmpdir(), f));
  s.clean();
});

test('a plan that falls short says what it lacks', () => {
  const s = session([user('go'), edit('a.mjs', 200)]);
  fs.writeFileSync(planPath(s.id), '# Plan\n## Goal\nx\n## Impact\nsummary\n');
  assert.match(planGate(s.id, s.file, REPOS, { name: 'Edit', input: { file_path: path.join(TOOLKIT, 'b.mjs'), old_string: 'a', new_string: 'b' } }, TOOLKIT), /lacks the Claims section and the Beyond scope section and the Budget section and the Review section and impact\.mjs's output/);
  s.clean();
});

test('a call already in the transcript when its hook runs is still judged, and refused if it makes the work full', () => {
  const s = session([user('go'), edit('a.mjs'), edit('b.mjs'), edit('c.mjs'), withId(edit('d.mjs'), 'p4')]);
  assert.match(planGate(s.id, s.file, REPOS, { id: 'p4', name: 'Edit', input: { file_path: path.join(TOOLKIT, 'd.mjs'), old_string: 'a', new_string: 'b' } }, TOOLKIT), /full-size \(4 files\)/);
  assert.equal(size(advance(s.id, s.file, REPOS).total).files, 3, 'the refused call is taken back');
  s.clean();
});

test("a state written by an older gate is read afresh, never crashes the hook", () => {
  const s = session([user('go'), edit('a.mjs', 5)]);
  fs.writeFileSync(path.join(os.tmpdir(), `toolkit-gates-${s.id}.json`), JSON.stringify({ version: 2, offsets: {}, total: { files: {}, wide: [] }, since: { files: {}, wide: [] }, owed: true }));
  assert.equal(stopGate(s.id, s.file, REPOS, 'Done.'), null);
  s.clean();
});

test("a background subagent's edits from before the person spoke do not mark the new turn", () => {
  const s = session([{ ...user('build it'), timestamp: '2026-10-28T10:00:00.000Z' }, call('Agent', { description: 'Build', prompt: 'x', subagent_type: 'general-purpose', run_in_background: true }), { ...user('what is 2+2?'), timestamp: '2026-10-28T10:05:00.000Z' }]);
  const dir = path.join(s.file.replace(/\.jsonl$/, ''), 'subagents');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'agent-1.jsonl'), JSON.stringify({ ...edit('a.mjs', 150), timestamp: '2026-10-28T10:02:00.000Z' }) + '\n');
  assert.equal(stopGate(s.id, s.file, REPOS, '4.'), null);
  fs.rmSync(path.dirname(dir), { recursive: true, force: true });
  s.clean();
});

test.after(() => fs.rmSync(process.env.TMPDIR, { recursive: true, force: true }));

test("impact: a file sharing its name with another lists its own readers, not its twin's", async () => {
  const { impact } = await import('./impact.mjs');
  const [hooks, parity] = impact([path.join(HERE, 'gates.mjs'), path.join(TOOLKIT, 'tools/parity/gates.mjs')], [{ name: 'toolkit', dir: TOOLKIT }]);
  assert.ok(hooks.readers.includes('toolkit: tools/claude-hooks/hooks.mjs'), 'a relative import beside it');
  assert.ok(!hooks.readers.includes('toolkit: tools/parity/run.mjs'), "the twin's reader");
  assert.ok(parity.readers.includes('toolkit: tools/parity/run.mjs'));
});
