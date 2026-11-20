import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { planGate, stopGate, shellWrites, planPath, size, advance, isReview, lineDiff, isPush, citing, openPlans, planDone, methodGaps, methodTerms } from './gates.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const TOOLKIT = fs.realpathSync(path.resolve(HERE, '../..'));
const REPOS = [TOOLKIT];
delete process.env.TOOLKIT_GATES; delete process.env.TOOLKIT_EVAL_COPY;
// state, plans and the carry between sessions live in tmp: the tests keep their own
process.env.TMPDIR = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'test-gates-')));
process.env.TOOLKIT_LOCK_DIR = path.join(process.env.TMPDIR, 'toolkit-measure.lock'); // never the real lock
delete process.env.TOOLKIT_LOCK_HELD; // run under bin/check, which holds it: this test takes its own
process.env.TOOLKIT_TRANSCRIPTS = path.join(process.env.TMPDIR, 'projects'); // never the real sessions' transcripts

let n = 0;
/* A session: a transcript built from turns, and its own id so no state leaks.
   It opens with the repo's check run and read, as §D 0 has every piece of work begin. */
function session(lines, { checked = true } = {}) {
  const id = `test-gates-${process.pid}-${n++}`;
  const file = path.join(os.tmpdir(), `${id}.jsonl`);
  // dated long ago: a shell call's span is read from disk, and a file another session saves now must not fall in it
  const old = (rec) => ({ ...rec, timestamp: '2020-01-01T00:00:00.000Z' });
  const opening = checked ? [old(withId(call('Bash', { command: 'bin/check' }), `check-${id}`)), old(checkResult(`check-${id}`))] : [];
  fs.writeFileSync(file, [...opening, ...lines].map((l) => JSON.stringify(l)).join('\n') + '\n');
  return { id, file, clean: () => { for (const f of [file, planPath(id), path.join(os.tmpdir(), `toolkit-gates-${id}.json`)]) fs.rmSync(f, { force: true }); } };
}
const user = (text) => ({ type: 'user', origin: { kind: 'human' }, message: { content: text } });
const harness = (text) => ({ type: 'user', isMeta: true, origin: null, message: { content: text } });
const PLAN_TEXT = '# Plan\n## Before\ngreen\n§D 1 no owner; §D 2 yes; §D 5 stored\n## Aim\nwhat the person asked\n## Goal\nx\n## Measure\nbefore: node eval.mjs — 3 of 9 differ\n## Impact\ntoolkit: a.mjs (2 readers)\n## Claims\nnone believed\n## Beyond scope\nnone\n## Budget\n1h\n## Review\n2 agents\n';
const DONE = 'Done.\nMeasure: 3 of 9 differ → 0.\nToolkit: nothing; checked the standards.\nOpen: nothing.';
const call = (name, input) => ({ type: 'assistant', cwd: TOOLKIT, message: { content: [{ type: 'tool_use', name, input }] } });
const edit = (rel, lines = 1) => call('Edit', { file_path: path.join(TOOLKIT, rel), old_string: 'a', new_string: Array(lines).fill('b').join('\n') });
const review = (extra = {}) => call('Agent', { description: 'Review the gates', prompt: 'Review this diff', subagent_type: 'Explore', ...extra });
const result = (id, is_error) => ({ type: 'user', message: { content: [{ type: 'tool_result', tool_use_id: id, is_error, content: 'x' }] } });
const withId = (rec, id) => { rec.message.content[0].id = id; return rec; };
const checkResult = (id, out = 'skills ok\ngreen') => ({ type: 'user', message: { content: [{ type: 'tool_result', tool_use_id: id, content: out }] } });

test('a shell command writes only where it redirects, tees or edits in place, never inside quotes', () => {
  assert.deepEqual(shellWrites(`node -e "import('x').then(({a})=>a)"`, TOOLKIT), []);
  assert.deepEqual(shellWrites(`awk '{ if ($2>400) big++ }' f`, TOOLKIT), []);
  assert.deepEqual(shellWrites('ls 2>/dev/null; cmd 2>&1', TOOLKIT), []);
  assert.deepEqual(shellWrites("sed -i '' 's|a|b|' x.md\ngit diff --stat; node t.mjs 2>&1 | tail -1", TOOLKIT), [path.join(TOOLKIT, 'x.md')], "a sed's file ends at its line, not the next command's last word");
  assert.deepEqual(shellWrites("sed -i '' 's|a|b|' y.mjs\nnode y.mjs 2>&1 | tail -1", TOOLKIT), [path.join(TOOLKIT, 'y.mjs')], 'nor is a redirect a file');
  const T = (f) => path.join(TOOLKIT, f);
  for (const [cmd, want, why] of [
    ["sed -i '' 's/a/b/' x.md 2>&1 | tail -1", ['x.md'], 'a redirect after the file leaves the file'],
    ["sed -i '' 's/a/b/' x.md >/dev/null", ['x.md'], 'so does one to /dev/null'],
    ["sed -i '' \\\n  -e 's/a/b/' \\\n  x.md", ['x.md'], 'a backslash continuation joins the lines'],
    ["sed -i '' 's/a/b/' a.md b.md c.md", ['a.md', 'b.md', 'c.md'], 'every file of several'],
    ["sed -E -i 's/a/b/' x.md", ['x.md'], 'a flag before -i'],
    ["sed --in-place -e 's/a/b/' -e 's/c/d/' x.md", ['x.md'], '--in-place, and -e scripts'],
    ["sed -i.bak 's/a/b/' x.md", ['x.md'], 'a GNU suffix'],
    ["sed 's/a/b/' x.md > y.md", ['y.md'], 'a sed without -i writes only its redirect'],
    ["(cd sub && sed -i '' 's/a/b/' x.md)", ['x.md'], 'a subshell\'s paren is not part of the file'],
    ["sed -i -e's/a/b/' x.md", ['x.md'], 'a script stuck to -e'],
    ["sed -i -fscript.sed x.md", ['x.md'], 'or to -f'],
    ["/usr/bin/sed -i 's/a/b/' x.md", ['x.md'], 'sed by its path'],
    ["echo `sed -i 's/a/b/' x.md`", ['x.md'], 'sed in backticks'],
    ["sed -i .bak 's/a/b/' x.md", ['x.md'], 'a BSD dot suffix'],
    ["sed -i 's/a/b/' x.md # tidy", ['x.md'], 'a comment is no file'],
    ["sed -e s/a/b/ -i .env", ['.env'], 'a dot word after the script is a file, not a suffix'],
    ["sed -i .env -e s/a/b/", ['.env'], 'so is one with no file after it'],
    ["sed -i .bak -e s/a/b/ x.md", ['x.md'], 'while one with a file after it is the suffix'],
    ["\\sed -i s/a/b/ x.md", ['x.md'], 'a sed past its alias'],
    ["sed -i -e 's/a/b/' -- -x.md", ['-x.md'], 'every word after -- is a file'],
  ]) assert.deepEqual(shellWrites(cmd, TOOLKIT), want.map(T), why);
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
  // the before half (§D 0): the check run before the work, read, and the three questions asked
  fs.writeFileSync(planPath(s.id), PLAN_TEXT.replace('green\n', 'ran it\n'));
  assert.match(String(planGate(s.id, s.file, REPOS, next, TOOLKIT)), /bin\/check's closing line under Before/, 'a check said as run is not a check read');
  fs.writeFileSync(planPath(s.id), PLAN_TEXT.replace('green\n', '').replace('## Goal\nx', '## Goal\ngreen'));
  assert.match(String(planGate(s.id, s.file, REPOS, next, TOOLKIT)), /closing line under Before/, 'the line counts only under Before');
  fs.writeFileSync(planPath(s.id), PLAN_TEXT.replace('§D 5 stored', ''));
  assert.match(String(planGate(s.id, s.file, REPOS, next, TOOLKIT)), /§D 1, §D 2 and §D 5/, 'all three questions answered');
  fs.writeFileSync(planPath(s.id), PLAN_TEXT.replace('§D 1 no owner; §D 2 yes', '§D 13 applies; §D 21 read'));
  assert.match(String(planGate(s.id, s.file, REPOS, next, TOOLKIT)), /§D 1, §D 2 and §D 5/, '§D 13 and §D 21 are not §D 1 and §D 2');
  fs.writeFileSync(planPath(s.id), PLAN_TEXT.replace('## Before\ngreen\n', '## Before\n### The check\n> `green, 2 skipped (could not run here):`\n### The questions\n'));
  assert.equal(planGate(s.id, s.file, REPOS, next, TOOLKIT), null, 'a subheading inside Before, and a quoted paste, still count');
  fs.writeFileSync(planPath(s.id), PLAN_TEXT.replace('green\n', '== 2 FAILED (detail above each):\n'));
  assert.equal(planGate(s.id, s.file, REPOS, next, TOOLKIT), null, 'a red inherited check is a finding, and the plan may proceed on it');
  // the main goal kept in sight (14 Nov): an Aim, agreed with the person, that every piece's Goal and course answer to
  fs.writeFileSync(planPath(s.id), PLAN_TEXT.replace('## Aim\nwhat the person asked\n', ''));
  assert.match(String(planGate(s.id, s.file, REPOS, next, TOOLKIT)), /the Aim section/, 'a plan without its aim is refused');
  // top-down (14 Nov): the goal measured end to end before a part is built
  fs.writeFileSync(planPath(s.id), PLAN_TEXT.replace('## Measure\nbefore: node eval.mjs — 3 of 9 differ\n', ''));
  assert.match(String(planGate(s.id, s.file, REPOS, next, TOOLKIT)), /the Measure section/, 'a plan without the end-to-end measure is refused');
  fs.writeFileSync(planPath(s.id), PLAN_TEXT.replace('before: node eval.mjs — 3 of 9 differ', 'we will measure later'));
  assert.match(String(planGate(s.id, s.file, REPOS, next, TOOLKIT)), /"before:" line under Measure/, 'a heading without the before line is not a measure');
  fs.writeFileSync(planPath(s.id), PLAN_TEXT.replace('before: node eval.mjs — 3 of 9 differ', 'before:\nTBD'));
  assert.match(String(planGate(s.id, s.file, REPOS, next, TOOLKIT)), /"before:" line under Measure/, 'an empty before line, with words on the next, is not a measure');
  fs.writeFileSync(planPath(s.id), PLAN_TEXT.replace('before: node eval.mjs — 3 of 9 differ', '**Before:** `TBD`'));
  fs.writeFileSync(planPath(s.id), PLAN_TEXT.replace('before: node eval.mjs — 3 of 9 differ', 'before: _TBD_'));
  assert.match(String(planGate(s.id, s.file, REPOS, next, TOOLKIT)), /"before:" line under Measure/, 'or in underscores');
  assert.match(String(planGate(s.id, s.file, REPOS, next, TOOLKIT)), /"before:" line under Measure/, 'a placeholder in bold or code is still a placeholder');
  fs.writeFileSync(planPath(s.id), PLAN_TEXT.replace('## Measure\nbefore: node eval.mjs — 3 of 9 differ\n', '## Measure\n').replace('## Goal\nx', '## Goal\nbefore: x'));
  assert.match(String(planGate(s.id, s.file, REPOS, next, TOOLKIT)), /"before:" line under Measure/, 'the line counts only under Measure');
  // the method made mechanical (2026-11-19): an Aim that lists a Method is ticked by each piece, and zoomed out from
  const METHOD = PLAN_TEXT.replace('what the person asked\n', 'what the person asked\nMethod, agreed:\n- Top-down: from the measure.\n- Agents: in parallel.\n- Never re-ask.\n').replace('## Goal\nx', '## Goal\nPiece 2 (2026-11-20): x');
  fs.writeFileSync(planPath(s.id), METHOD);
  assert.match(String(planGate(s.id, s.file, REPOS, next, TOOLKIT)), /tick line under a Method section[^]*"Piece 2 \(2026-11-20\):"[^]*"Top-down:", "Agents:"/, 'an agreed method unticked is refused before the edit');
  fs.writeFileSync(planPath(s.id), METHOD + `## Method\nPiece 2 (2026-11-20): top-down: eval's top cause; agents: two\n## Course review\n${new Date().toLocaleDateString('sv')}, after 0: kept\n`);
  assert.equal(planGate(s.id, s.file, REPOS, next, TOOLKIT), null, 'ticked and reviewed, the plan proceeds');
  fs.writeFileSync(planPath(s.id), PLAN_TEXT);
  // the run itself, read from the transcript: a pasted line can be written after the fact
  const unrun = session([user('go'), edit('a.mjs', 200)], { checked: false });
  fs.writeFileSync(planPath(unrun.id), PLAN_TEXT);
  assert.match(String(planGate(unrun.id, unrun.file, REPOS, next, TOOLKIT)), /a bin\/check run in \//, 'no run in the transcript: the pasted line is not taken');
  unrun.clean();
  const late = session([user('go'), edit('a.mjs', 200), withId(call('Bash', { command: `cd ${TOOLKIT} && bin/check 2>&1 | tail -3` }), 'late1'), checkResult('late1', '== 1 FAILED (detail above each):')], { checked: false });
  fs.writeFileSync(planPath(late.id), PLAN_TEXT);
  assert.match(String(planGate(late.id, late.file, REPOS, next, TOOLKIT)), /"late:" line under Before/, 'a check after the first edit is said as late');
  fs.writeFileSync(planPath(late.id), PLAN_TEXT.replace('green\n', 'green\nlate: the first edit was a.mjs, before the check\n'));
  assert.equal(planGate(late.id, late.file, REPOS, next, TOOLKIT), null, 'and, said, the work goes on');
  late.clean();
  const dated = (rec) => ({ ...rec, timestamp: '2020-01-01T00:00:00.000Z' }); // see session(): a shell call's span is read from disk
  const bg = session([dated(withId(call('Bash', { command: 'bin/check', run_in_background: true }), 'bg1')), dated(checkResult('bg1', 'Command running in background with ID: b1.')), harness('<task-notification>\n<tool-use-id>bg1</tool-use-id>\n<status>completed</status>\n</task-notification>'), user('go'), edit('a.mjs', 200)], { checked: false });
  fs.writeFileSync(planPath(bg.id), PLAN_TEXT);
  assert.equal(planGate(bg.id, bg.file, REPOS, next, TOOLKIT), null, 'a background run counts once its notification says it ended');
  bg.clean();
  // each repo's own check, in that repo: another repo's run, or reading the check's helper, is not one
  const other = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'gates-other-')));
  const away = session([dated(withId(call('Bash', { command: `cd ${other} && bin/check` }), 'o1')), dated(checkResult('o1', '== all green')), dated(withId(call('Bash', { command: 'sed -n 20,40p bin/check-lib.sh' }), 'o2')), dated(checkResult('o2', 'green() {')), user('go'), edit('a.mjs', 200)], { checked: false });
  fs.writeFileSync(planPath(away.id), PLAN_TEXT);
  assert.match(String(planGate(away.id, away.file, [TOOLKIT, other], next, TOOLKIT)), new RegExp(`a bin/check run in ${TOOLKIT.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`), "another repo's check, and reading check-lib.sh, are not this repo's run");
  away.clean();
  // a repo with no bin/check of its own owes no run (the edit is written in `other` itself: edit() joins
  // onto the toolkit, so the work was never there and the test passed with the gate unfixed)
  const bare = session([user('go'), call('Edit', { file_path: path.join(other, 'doc.md'), old_string: 'a', new_string: Array(200).fill('b').join('\n') })], { checked: false });
  fs.writeFileSync(planPath(bare.id), PLAN_TEXT);
  const bareGaps = String(planGate(bare.id, bare.file, [TOOLKIT, other], next, TOOLKIT));
  assert.match(bareGaps, /a bin\/check run in /, 'the toolkit, which has one, still owes its run');
  assert.ok(!bareGaps.includes(`a bin/check run in ${other}`), 'a repo with no bin/check owes no run');
  bare.clean();
  // work only in a repo with no bin/check owes no check's closing line under Before either
  const only = session([user('go'), { ...call('Edit', { file_path: path.join(other, 'doc.md'), old_string: 'a', new_string: Array(200).fill('b').join('\n') }), cwd: other }], { checked: false });
  fs.writeFileSync(planPath(only.id), PLAN_TEXT.replace('## Before\ngreen\n', '## Before\n'));
  const onlyNext = { name: 'Edit', input: { file_path: path.join(other, 'e.md'), old_string: 'a', new_string: 'b' } };
  const onlyOut = String(planGate(only.id, only.file, [other], onlyNext, other));
  // unfixed, this returned the plan's gaps naming the closing line; fixed, the plan is complete
  assert.ok(!/closing line under Before/.test(onlyOut), 'no repo with a check, no closing line owed: ' + onlyOut);
  only.clean();
  // a check run by its path, or after a `cd` joined by `;` or in `( )`, is that repo's
  for (const cmd of [`${other}/bin/check`, `cd ${other}; bin/check`, `(cd ${other}; bin/check)`]) {
    const p = session([dated(withId(call('Bash', { command: cmd }), 'q1')), dated(checkResult('q1', 'green')), user('go'), edit('a.mjs', 200)], { checked: false });
    fs.writeFileSync(planPath(p.id), PLAN_TEXT);
    assert.match(String(planGate(p.id, p.file, [TOOLKIT, other], next, TOOLKIT)), /a bin\/check run in/, `"${cmd}" is the other repo's check, not this one's`);
    p.clean();
  }
  // reading the check, or one run in a folder the gate cannot read, credits no repo
  for (const cmd of ['cat bin/check bin/check-lib.sh', 'cd "$X" && bin/check', 'cd - && bin/check']) {
    const p = session([dated(withId(call('Bash', { command: cmd }), 'r1')), dated(checkResult('r1', 'green() {\ngreen')), user('go'), edit('a.mjs', 200)], { checked: false });
    fs.writeFileSync(planPath(p.id), PLAN_TEXT);
    assert.match(String(planGate(p.id, p.file, REPOS, next, TOOLKIT)), /a bin\/check run in/, `"${cmd}" is not this repo's run`);
    p.clean();
  }
  // a project's check ends in its own words
  for (const end of ['== all green', '== FAILURES above', 'RED']) {
    const p = session([dated(withId(call('Bash', { command: 'bin/check' }), 'p1')), dated(checkResult('p1', end)), user('go'), edit('a.mjs', 200)], { checked: false });
    fs.writeFileSync(planPath(p.id), PLAN_TEXT.replace('green\n', end + '\n'));
    assert.equal(planGate(p.id, p.file, REPOS, next, TOOLKIT), null, `a project's closing line "${end}" counts`);
    p.clean();
  }
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
  assert.match(stopGate(s.id, s.file, REPOS, 'Done.\n**Toolkit:** nothing'), /^Reviewed full-size work ends with a line starting "Measure:" and a line starting "Open:"/);
  assert.match(stopGate(s.id, s.file, REPOS, 'Done.\nMeasure: 3 → 0\n**Toolkit:** nothing'), /^Reviewed full-size work ends with a line starting "Open:"/, 'the end-to-end measure, run again, closes the work (top-down, 14 Nov)');
  assert.equal(stopGate(s.id, s.file, REPOS, 'Done.\n\nMeasure: 3 of 9 differ → 0.\n**Toolkit:** nothing; checked the standards.\nOpen: nothing.\nDocs: README.md still right.'), null);
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

test('a script over work already there counts only what it adds (a formatter over reviewed work)', async () => {
  const dir = repo();
  const base = path.join(dir, 'base.mjs');
  fs.writeFileSync(base, lines(200));
  const t0 = Date.now();
  // every time is set, none read off the clock: a file system that keeps mtimes to the second (CI's) failed this twice
  // on a write that landed within the call's own second
  fs.utimesSync(base, new Date(t0 - 10000), new Date(t0 - 10000));
  const s = session([at(user('format it'), t0 - 2000)]);
  assert.equal(planGate(s.id, s.file, [dir], { id: 'b2', name: 'Bash', input: { command: 'npx prettier --write .' } }, dir), null);
  fs.writeFileSync(base, lines(202));
  fs.utimesSync(base, new Date(t0 + 1000), new Date(t0 + 1000));
  fs.appendFileSync(s.file, [at({ ...withId(call('Bash', { command: 'npx prettier --write .' }), 'b2'), cwd: dir }, t0 - 1000), at(result('b2', false), t0 + 3000)].map((l) => JSON.stringify(l)).join('\n') + '\n');
  assert.equal(advance(s.id, s.file, [dir]).total.files[path.join(dir, 'base.mjs')], 2);
  // the script's write is kept for the Stop check, which the transcript alone would never show it
  const { ownUncommitted } = await import('./stop-items.mjs');
  assert.deepEqual(await ownUncommitted(s.file, [dir]), { [dir]: ['base.mjs'] }, "a file the session's script wrote is named while uncommitted");
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
  assert.match(String(planGate(s.id, s.file, REPOS, { id: 'w3', name: 'Write', input: { file_path: path.join(TOOLKIT, 'big.mjs'), content: Array(900).fill('b').join('\n') } }, TOOLKIT, true)), /plan/i, 'a subagent outside a worktree is held');
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
  // no opening check: a shell call's span is read from disk, and the file the test just wrote would be counted as its
  const s = session([user('go')], { checked: false });
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

test('a plan outlives its pieces: each close measures again into it, and only a plan marked done is put aside', () => {
  const s = session([user('build it'), edit('a.mjs', 200), review()]);
  const close = DONE + '\nDocs: README.md still right.';
  fs.writeFileSync(planPath(s.id), PLAN_TEXT);
  assert.match(String(stopGate(s.id, s.file, REPOS, close)), /stays open after this piece[\s\S]*"after:" line/, 'a piece closes only once its measure is written back into the plan');
  fs.writeFileSync(planPath(s.id), PLAN_TEXT.replace('3 of 9 differ\n', '3 of 9 differ\nafter: node eval.mjs — 1 of 9 differ\n'));
  assert.match(String(stopGate(s.id, s.file, REPOS, close)), /"course:" line under Goal/, 'a number written back is not enough: the course is re-assessed from it');
  fs.writeFileSync(planPath(s.id), PLAN_TEXT.replace('3 of 9 differ\n', '3 of 9 differ\nafter: node eval.mjs — 1 of 9 differ\n').replace('## Goal\nx', '## Goal\nx\ncourse: kept; the split shows most rows are ours'));
  assert.equal(stopGate(s.id, s.file, REPOS, close), null);
  assert.equal(fs.existsSync(planPath(s.id)), true, 'the plan is kept for the next piece');
  assert.doesNotMatch(String(planGate(s.id, s.file, REPOS, { name: 'Edit', input: { file_path: path.join(TOOLKIT, 'b.mjs'), old_string: 'a', new_string: Array(150).fill('b').join('\n') } }, TOOLKIT)), /Write the plan/, 'the next piece completes the same plan, not a blank one');
  fs.rmSync(planPath(s.id));
  s.clean();
  const d = session([user('build it'), edit('a.mjs', 200), review()]);
  fs.writeFileSync(planPath(d.id), 'Status: done\n' + PLAN_TEXT.replace('3 of 9 differ\n', '3 of 9 differ\nafter: 0 of 9\n'));
  assert.equal(stopGate(d.id, d.file, REPOS, close), null);
  assert.equal(fs.existsSync(planPath(d.id)), false, 'a plan whose whole goal is met is put aside');
  for (const f of fs.readdirSync(os.tmpdir()).filter((f) => f.startsWith(`toolkit-plan-${d.id}-`))) fs.rmSync(path.join(os.tmpdir(), f));
  d.clean();
});

test('a plan is done only by a line saying so, never a sentence about when it will be', () => {
  assert.equal(planDone('# P\nStatus: done\n'), true);
  assert.equal(planDone('# P\n**Status:** done.\n'), true);
  assert.equal(planDone('# P\nStatus: done once eval shows 0 of 9\n'), false);
  assert.equal(planDone('> mark it Status: done only when the whole goal is met'), false);
});

test('the next piece reviews a kept plan before it starts', () => {
  const s = session([user('build it'), edit('a.mjs', 200), review()]);
  const close = DONE + '\nDocs: README.md still right.';
  fs.writeFileSync(planPath(s.id), PLAN_TEXT.replace('3 of 9 differ\n', '3 of 9 differ\nafter: 1 of 9\n').replace('## Goal\nx', '## Goal\nx\ncourse: kept'));
  assert.equal(stopGate(s.id, s.file, REPOS, close), null);
  const old = new Date(Date.now() - 60000); fs.utimesSync(planPath(s.id), old, old);
  const next = { name: 'Edit', input: { file_path: path.join(TOOLKIT, 'b.mjs'), old_string: 'a', new_string: Array(150).fill('b').join('\n') } };
  assert.match(String(planGate(s.id, s.file, REPOS, next, TOOLKIT)), /a review of the kept plan for this piece/);
  fs.rmSync(planPath(s.id));
  s.clean();
});

test('a new session is told of the plans other sessions left open, never its own or a finished one, marking one a session may still hold', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'plans-'));
  fs.writeFileSync(path.join(dir, 'toolkit-plan-other.md'), '# The round trip\n## Aim\nwhat the person asked\n## Goal\nx\n');
  fs.writeFileSync(path.join(dir, 'toolkit-plan-finished.md'), '# Old\nStatus: done\n');
  fs.writeFileSync(path.join(dir, 'toolkit-plan-other-123.done.md'), '# Archived\n');
  fs.writeFileSync(path.join(dir, 'toolkit-plan-me.md'), '# Mine\n');
  const stale = path.join(dir, 'toolkit-plan-stale.md'); fs.writeFileSync(stale, '# Forgotten\n');
  const month = new Date(Date.now() - 30 * 24 * 3600 * 1000); fs.utimesSync(stale, month, month);
  fs.writeFileSync(path.join(dir, 'toolkit-plan-busy.md'), '# In use\n');
  fs.writeFileSync(path.join(dir, 'toolkit-gates-busy.json'), '{}');
  fs.writeFileSync(path.join(dir, 'toolkit-gates-other.json'), '{}');
  const hours = new Date(Date.now() - 2 * 3600 * 1000); fs.utimesSync(path.join(dir, 'toolkit-gates-other.json'), hours, hours);
  const open = openPlans('me', dir);
  assert.deepEqual(open.map((p) => [p.title, p.live]).sort(), [['In use', true], ['The round trip', false]], 'a plan whose session acted within the hour is listed and marked; one whose session went quiet is offered');
  assert.equal(planDone('Status: done\r\n'), true, 'a line ending in CRLF still says done');
  fs.rmSync(dir, { recursive: true, force: true });
});

test('a plan that falls short says what it lacks', () => {
  const s = session([user('go'), edit('a.mjs', 200)]);
  fs.writeFileSync(planPath(s.id), '# Plan\n## Aim\nwhat the person asked\n## Goal\nx\n## Impact\nsummary\n');
  assert.match(planGate(s.id, s.file, REPOS, { name: 'Edit', input: { file_path: path.join(TOOLKIT, 'b.mjs'), old_string: 'a', new_string: 'b' } }, TOOLKIT), /lacks the Before section and the Measure section and the Claims section and the Beyond scope section and the Budget section and the Review section and bin\/check's closing line under Before[\s\S]* and the answers to §D 1, §D 2 and §D 5 under Before and a "before:" line under Measure[\s\S]* and impact\.mjs's output/);
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

test("the last gate's state is carried forward: a long session is never re-read from its start", () => {
  const s = session([user('go'), edit('a.mjs', 5)]);
  const size0 = fs.statSync(s.file).size;
  fs.writeFileSync(path.join(os.tmpdir(), `toolkit-gates-${s.id}.json`), JSON.stringify({ version: 3, offsets: { [s.file]: size0 }, total: { files: {}, wide: [] }, since: { files: {}, wide: [] }, checks: { x: true }, checkedAt: '2026-11-01T00:00:00.000Z', firstEdit: '2026-11-01T00:00:00.000Z' }));
  const st = advance(s.id, s.file, REPOS);
  assert.equal(st.version, 4);
  assert.equal(size(st.total).files, 0, 'what the carried offset already read is not read again');
  assert.deepEqual(st.checkedAt, {}, "the new fields start empty");
  s.clean();
});

test('read afresh, work a closed plan ended is not counted again', () => {
  const s = session([user('go'), { ...edit('a.mjs', 200), timestamp: '2029-12-31T00:00:00.000Z' }, user('next'), { ...edit('b.mjs', 3), timestamp: '2030-01-02T00:00:00.000Z' }]);
  const done = planPath(s.id).replace(/\.md$/, `-${Date.parse('2030-01-01T00:00:00.000Z')}.done.md`);
  fs.writeFileSync(done, PLAN_TEXT);
  const st = advance(s.id, s.file, REPOS);
  assert.deepEqual(Object.keys(st.total.files).map((f) => path.basename(f)), ['b.mjs'], 'only the edit after the close counts');
  fs.rmSync(done); s.clean();
});

test("the work's first edit is the earliest, though a subagent's file is read after the session's", () => {
  const at = (rec, t) => ({ ...rec, timestamp: t });
  const s = session([at(user('go'), '2030-01-01T00:00:00.000Z'), at(withId(call('Bash', { command: 'bin/check' }), 'k1'), '2030-01-01T00:05:00.000Z'), at(checkResult('k1'), '2030-01-01T00:05:01.000Z'), at(edit('a.mjs', 5), '2030-01-01T00:10:00.000Z')], { checked: false });
  const dir = path.join(s.file.replace(/\.jsonl$/, ''), 'subagents');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'agent-x.jsonl'), JSON.stringify(at(edit('b.mjs', 5), '2030-01-01T00:01:00.000Z')) + '\n');
  const st = advance(s.id, s.file, REPOS);
  assert.equal(st.firstEdit[TOOLKIT], '2030-01-01T00:01:00.000Z', "the subagent's earlier edit, so the check after it needs late:");
  fs.rmSync(dir.replace(/\/subagents$/, ''), { recursive: true, force: true }); s.clean();
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

test('the Docs gate names the guides that cite a rule the work changed, and only those', () => {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'citing-')));
  const git = (...a) => spawnSync('git', ['-C', root, '-c', 'user.name=t', '-c', 'user.email=t@t', ...a], { encoding: 'utf8' });
  const std = path.join(root, 'standards/code-standard.md');
  fs.mkdirSync(path.dirname(std)); fs.mkdirSync(path.join(root, 'docs'));
  fs.writeFileSync(std, '# Code\n\n1. **One.** a\n\n2. **Two.** b\n');
  fs.writeFileSync(path.join(root, 'README.md'), 'See code-standard rule 2.\n');
  fs.writeFileSync(path.join(root, 'docs/guide.md'), 'See code-standard rule 1.\n');
  fs.writeFileSync(path.join(root, 'notes.md'), 'See code-standard rule 2.\n');
  git('init', '-q'); git('add', '.'); git('commit', '-qm', 'base');
  fs.writeFileSync(std, '# Code\n\n1. **One.** a\n\n2. **Two.** b, changed\n');
  const st = { firstEdit: { [root]: new Date(Date.now() + 60e3).toISOString() }, docs: [], total: { files: { [std]: 1 } } };
  assert.deepEqual(citing(st, root), [`${path.join(root, 'README.md')} (cites code-standard rule 2)`], 'rule 1 is unchanged and notes.md is no guide');
  assert.deepEqual(citing({ ...st, docs: [path.join(root, 'README.md')] }, root), [], 'a README the work touched is not named');
  assert.deepEqual(citing({ ...st, firstEdit: {} }, root), [], 'no first edit, no base to diff against');
  fs.rmSync(root, { recursive: true, force: true });
});

test.after(() => fs.rmSync(process.env.TMPDIR, { recursive: true, force: true }));

test("impact: a file sharing its name with another lists its own readers, not its twin's", async () => {
  const { impact } = await import('./impact.mjs');
  const [hooks, parity] = impact([path.join(HERE, 'gates.mjs'), path.join(TOOLKIT, 'tools/parity/gates.mjs')], [{ name: 'toolkit', dir: TOOLKIT }]);
  assert.ok(hooks.readers.includes('toolkit: tools/claude-hooks/hooks.mjs'), 'a relative import beside it');
  assert.ok(!hooks.readers.includes('toolkit: tools/parity/run.mjs'), "the twin's reader");
  assert.ok(parity.readers.includes('toolkit: tools/parity/run.mjs'));
});

test("a refused push names what changed since the last review, and a refused compound command says its other parts did not run", () => {
  const s = session([user('build it'), edit('a.mjs', 200)]);
  fs.writeFileSync(planPath(s.id), PLAN_TEXT);
  const plain = planGate(s.id, s.file, REPOS, { id: 'q1', name: 'Bash', input: { command: 'git push' } }, TOOLKIT);
  assert.match(plain, /Changed since the last review, lines: a\.mjs \(200\)/, 'the files the next review must cover, with their lines');
  assert.doesNotMatch(plain, /other parts/, 'a lone push has no other parts');
  assert.doesNotMatch(planGate(s.id, s.file, REPOS, { id: 'q2', name: 'Bash', input: { command: 'git push 2>&1 | tail -3' } }, TOOLKIT), /other parts/, 'a pipe is the push, not another part');
  assert.match(planGate(s.id, s.file, REPOS, { id: 'q3', name: 'Bash', input: { command: "printf 'after: x' >> plan.md && git commit -qm x && git push" } }, TOOLKIT), /None of this command's other parts ran/);
  s.clean();
});

test("a subagent's own bin/check run is credited; one in its worktree is not", () => {
  for (const [cwd, credited] of [[TOOLKIT, true], [path.join(TOOLKIT, '.claude/worktrees/agent-x1'), false]]) {
    const s = session([user('build it'), call('Agent', { description: 'Check it', prompt: 'run bin/check', subagent_type: 'general-purpose' })], { checked: false });
    const dir = path.join(s.file.replace(/\.jsonl$/, ''), 'subagents');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'agent-x1.jsonl'), [{ ...withId(call('Bash', { command: 'bin/check 2>&1 | tail -3' }), `sc-${cwd.length}`), cwd }, checkResult(`sc-${cwd.length}`, 'green')].map((l) => JSON.stringify(l)).join('\n') + '\n');
    fs.writeFileSync(planPath(s.id), PLAN_TEXT); // a plan, so what it still lacks is listed
    const said = String(planGate(s.id, s.file, REPOS, { id: `w-${cwd.length}`, name: 'Write', input: { file_path: path.join(TOOLKIT, 'big.mjs'), content: lines(300) } }, TOOLKIT));
    assert.equal(/a bin\/check run in/.test(said), !credited, credited ? "the subagent's run counts" : 'a run in its worktree checks another tree');
    fs.rmSync(dir.replace(/\/subagents$/, ''), { recursive: true, force: true }); s.clean();
  }
});

test('the plan gate says who holds the measuring lock when it asks for a bin/check run', async () => {
  const { hold, release } = await import('../shared/lock.mjs');
  assert.equal(await hold('eval.mjs --self'), true, 'a real lock, held here');
  const s = session([user('build it')], { checked: false });
  assert.match(String(planGate(s.id, s.file, REPOS, { id: 'lk', name: 'Write', input: { file_path: path.join(TOOLKIT, 'big.mjs'), content: lines(300) } }, TOOLKIT)), /measuring lock, now held by eval\.mjs --self/);
  release(); s.clean();
});

test("the stop gate names the session whose uncommitted work counts in this one's size", () => {
  const dir = repo();
  fs.writeFileSync(path.join(dir, 'base.mjs'), lines(61));
  const editOf = (f, n) => call('Edit', { file_path: path.join(dir, f), old_string: 'x', new_string: lines(n) });
  const a = session([user('fix it'), editOf('base.mjs', 60)]);
  const b = session([user('more'), editOf('next.mjs', 60)]);
  try {
    assert.equal(stopGate(a.id, a.file, [dir], 'Fixed.', dir), null);
    const said = stopGate(b.id, b.file, [dir], 'Done.', dir);
    assert.match(said, new RegExp(`another session's uncommitted work.*session ${a.id.slice(0, 8)} \\(not running\\): base\\.mjs`), 'named, with its file');
    assert.doesNotMatch(said, /next\.mjs\./, "this session's own file is not said to be another's");
  } finally { for (const x of [a, b]) x.clean(); fs.rmSync(dir, { recursive: true, force: true }); }
});

test("the stop check lists this session's own uncommitted paths, never another's, and nothing once committed", async () => {
  const { ownUncommitted } = await import('./stop-items.mjs');
  const dir = repo();
  const git = (...a) => spawnSync('git', ['-C', dir, ...a], { encoding: 'utf8' });
  fs.writeFileSync(path.join(dir, 'mine.mjs'), 'x'); fs.writeFileSync(path.join(dir, 'theirs.mjs'), 'y'); fs.writeFileSync(path.join(dir, '[id].mjs'), 'z'); fs.writeFileSync(path.join(dir, 'i.mjs'), 'w');
  const wrote = (f) => at({ ...call('Write', { file_path: f, content: 'x' }), cwd: dir }, Date.now() - 60000);
  const t = path.join(os.tmpdir(), `own-${process.pid}.jsonl`);
  fs.writeFileSync(t, [wrote(path.join(dir, 'mine.mjs')), wrote(path.join(dir, '[id].mjs')), wrote(path.join(os.tmpdir(), 'plan.md'))].map((l) => JSON.stringify(l)).join('\n') + '\n');
  assert.deepEqual(await ownUncommitted(t, [dir]), { [dir]: ['[id].mjs', 'mine.mjs'] }, 'only its own paths inside the repo; a bracket is a name, not a pattern matching i.mjs');
  git('add', '-A'); git('-c', 'user.email=t@t', '-c', 'user.name=t', 'commit', '-qm', 'all');
  assert.deepEqual(await ownUncommitted(t, [dir]), {}, 'committed: nothing');
  fs.writeFileSync(path.join(dir, 'mine.mjs'), 'changed by another session after the commit');
  assert.deepEqual(await ownUncommitted(t, [dir]), {}, 'a change made after its commit is not this session\'s');
  assert.equal(fs.readFileSync(path.join(dir, 'theirs.mjs'), 'utf8'), 'y', "another session's file is never touched");
  // written by this session, reverted, then written by another session since: the other's
  fs.writeFileSync(path.join(dir, 'later.mjs'), 'mine first'); git('add', 'later.mjs'); git('-c', 'user.email=t@t', '-c', 'user.name=t', 'commit', '-qm', 'base', '--', 'later.mjs');
  fs.appendFileSync(t, JSON.stringify(wrote(path.join(dir, 'later.mjs'))) + '\n');
  fs.writeFileSync(path.join(dir, 'later.mjs'), 'theirs now');
  assert.deepEqual(await ownUncommitted(t, [dir]), {}, 'its commit came after this session\'s write, so no');
  const other = path.join(process.env.TOOLKIT_TRANSCRIPTS, 'p'); fs.mkdirSync(other, { recursive: true });
  fs.appendFileSync(t, JSON.stringify(at({ ...call('Write', { file_path: path.join(dir, 'rev.mjs'), content: 'x' }), cwd: dir }, Date.now() - 30000)) + '\n');
  fs.writeFileSync(path.join(dir, 'rev.mjs'), 'theirs');
  assert.deepEqual(await ownUncommitted(t, [dir]), { [dir]: ['rev.mjs'] }, 'no one else wrote it: this session\'s');
  const failedWrite = withId(at({ ...call('Write', { file_path: path.join(dir, 'rev.mjs'), content: 'theirs' }), cwd: dir }, Date.now() - 2000), 'fw1');
  fs.writeFileSync(path.join(other, 'failed-session.jsonl'), [failedWrite, result('fw1', true)].map((l) => JSON.stringify(l)).join('\n') + '\n');
  assert.deepEqual(await ownUncommitted(t, [dir]), { [dir]: ['rev.mjs'] }, "another session's failed write wrote nothing");
  fs.writeFileSync(path.join(other, 'other-session.jsonl'), JSON.stringify(at({ ...call('Write', { file_path: path.join(dir, 'rev.mjs'), content: 'theirs' }), cwd: dir }, Date.now() - 1000)) + '\n');
  assert.deepEqual(await ownUncommitted(t, [dir]), {}, 'another session wrote it later: theirs');
  fs.rmSync(dir, { recursive: true, force: true }); fs.rmSync(t, { force: true });
});

test('method: the terms an Aim lists, each piece\'s ticks, and the course review every third piece or day', () => {
  const day = new Date(2026, 10, 20);
  assert.deepEqual(methodTerms('Method, agreed with the person:\n- Top-down: a\n* **Direction**-agnostic: b\n- Never re-ask.\n\nApproved: x'), ['Top-down', 'Direction-agnostic']);
  assert.deepEqual(methodTerms('what the person asked'), [], 'no method listed');
  assert.deepEqual(methodTerms('Method:\n\n1. **Top-down:** a\n2. See https://x\n'), ['Top-down'], 'a blank line, a numbered list, bold; a URL is no term');
  assert.deepEqual(methodTerms('Method is not decided yet; options:\n- A: x'), [], 'prose starting with the word is no method');
  assert.deepEqual(methodGaps('## Aim\nkeep it\n## Goal\nx\n', day), [], 'a plan with no method listed is untouched');
  const plan = (goal, method, review) => `## Aim\nMethod:\n- Top-down: a\n- Agents: b\n## Goal\n${goal}\n## Method\n${method}\n## Course review\n${review}\n`;
  const ok = 'P3 (2026-11-20): z\ncourse: kept\nP2: y\ncourse: kept';
  assert.deepEqual(methodGaps(plan(ok, '- P3 (2026-11-20): **Top-down:** eval; Agents: none, one cause\nP2: top-down: a', '2026-11-20, after 2: kept'), day), []);
  assert.match(methodGaps(plan(ok, 'P2: top-down: a; agents: b', '2026-11-20, after 2'), day).join(), /starting "P3 \(2026-11-20\):"/, 'the last piece\'s ticks are not this one\'s');
  assert.match(methodGaps(plan(ok, 'P3 (2026-11-20): top-down: a', '2026-11-20, after 2'), day).join(), /\("Agents:"\)/, 'every term, each named when missing');
  assert.match(methodGaps(plan(ok, 'P3 (2026-11-20): top-down and agents', '2026-11-20, after 2'), day).join(), /"Top-down:", "Agents:"/, 'a term is answered, not mentioned');
  assert.match(methodGaps(plan(ok, 'P3 (2026-11-20): top-down: a; subagents: b', '2026-11-20, after 2'), day).join(), /\("Agents:"\)/, 'a term inside a longer word is not it');
  assert.deepEqual(methodGaps(plan(ok, 'P3 (2026-11-20): top-down: old\nP3 (2026-11-20): top-down: a; agents: b', '2026-11-20, after 2'), day), [], 'a stale line of the same piece does not hide the full one');
  assert.match(methodGaps(plan('P1: z', 'P10: top-down: a; agents: b', '2026-11-20, after 0'), day).join(), /starting "P1:"/, 'P10 is not P1');
  assert.deepEqual(methodGaps(plan('course (2026-11-20, P1): kept\n### P1: z', '### P1: top-down: a; agents: b', '2026-11-20, after 1'), day), [], 'course with a parenthesis is a course line, never the label; headings stripped alike');
  assert.match(methodGaps('## Aim\n### Method\n- Top-down: a\n## Goal\nP1: x\n## Method\nP1: top-down: y\n## Course review\n2026-11-20, after 0\n', day).join(), /^$/, 'a Method heading inside the Aim is not the piece\'s Method');
  assert.match(methodGaps(plan('P1: z', 'P1: top-down: a; agents: b', '2026-11-01, after 20'), day).join(), /after 0/, 'an entry ahead of the count is stale');
  const tick = 'P3 (2026-11-20): top-down: a; agents: b';
  assert.match(methodGaps(plan(ok, tick, ''), day).join(), /Course review entry, "2026-11-20, after 2: …"[^]*none yet/, 'the first piece under a method zooms out');
  assert.deepEqual(methodGaps(plan(ok, tick, '2026-11-19, after 2'), day), [], 'a day old with no piece since: nothing to review');
  assert.match(methodGaps(plan(ok, tick, '2026-11-19, after 1'), day).join(), /the last was 2026-11-19, after 1/, 'a day old with a piece since');
  assert.deepEqual(methodGaps(plan(ok + '\ncourse: a\ncourse: b', tick, '2026-11-20, after 2'), day), [], 'two pieces since, the same day');
  assert.match(methodGaps(plan(ok + '\ncourse: a\ncourse: b\ncourse: c', tick, '2026-11-20, after 2'), day).join(), /after 5/, 'every third course line');
  assert.deepEqual(methodGaps(plan(ok + '\ncourse: a\ncourse: b\ncourse: c', tick, '2026-11-20, after 2\n2026-11-20, after 5: stop the field-by-field fixes'), day), [], 'the latest entry counts');
});
