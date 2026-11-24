#!/usr/bin/env node
// tools/project-check/check.mjs: a project on the canonical layout, saying nothing
// in `paths`, is held by the gates that read its stored specs, not skipped
// for want of a setting (2026-10-05: the gate asked for `paths.components`).
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'plan-'));
fs.mkdirSync(path.join(repo, 'components/tag'), { recursive: true });
fs.writeFileSync(path.join(repo, 'snapshot.config.json'), '{}');
spawnSync('git', ['-C', repo, 'init', '-q']);
const plan = spawnSync(process.execPath, [path.join(HERE, 'check.mjs'), '--repo', repo, '--plan'], { encoding: 'utf8' }).stdout;
fs.rmSync(repo, { recursive: true, force: true });
assert.match(plan, /component specs resolve and compact to themselves\s+runs/, plan);
console.log('ok a default-layout project\'s stored specs are checked');
// the validate gate cannot know which code is the system's own: it asks, rather than reading the system as a copy of itself
assert.match(plan, /changed code uses the system's components and tokens\s+RED — not run: no `check.validate.system`/, plan);
console.log('ok the validate gate asks where the system\'s own code is');

// the validate gate run: a finding is RED, a §6 ruling naming its file and value waives it, and a base
// git cannot read is RED, never an empty push read as green (59ba678e)
{
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'validate-')));
  const code = path.join(dir, 'code'), home = path.join(dir, 'projects', 'acme', 'figma-design-system');
  fs.mkdirSync(code); fs.mkdirSync(home, { recursive: true });
  fs.cpSync(path.join(HERE, '../system-mcp/fixtures/site'), path.join(home, 'site'), { recursive: true });
  const context = (ruling) => fs.writeFileSync(path.join(home, 'design-system-context.md'), '# acme\n\n```json snapshot-routing\n'
    + JSON.stringify({ repo: code, files: { library: [{ key: 'KEYA', id: 'IDA', roles: ['components', 'tokens'] }] } })
    + '\n```\n\n## 6. Rulings log\n\n| Date | Scope | Ruling | Why |\n|---|---|---|---|\n' + (ruling ? `| 2026-11-05 | \`validate\` | ${ruling} | test |\n` : ''));
  const git = (...a) => spawnSync('git', ['-C', code, ...a], { encoding: 'utf8' }).stdout.trim();
  git('init', '-q'); git('config', 'user.email', 'check@localhost'); git('config', 'user.name', 'check');
  fs.writeFileSync(path.join(code, 'snapshot.config.json'), JSON.stringify({ check: { validate: { system: ['lib/'] } } }));
  git('add', '.'); git('commit', '-qm', 'base');
  const base = git('rev-parse', 'HEAD');
  fs.mkdirSync(path.join(code, 'src')); fs.writeFileSync(path.join(code, 'src/a.css'), '.a { color: #ff0000; }\n');
  git('add', '.'); git('commit', '-qm', 'change');
  const gate = (CHECK_BASE) => spawnSync(process.execPath, [path.join(HERE, 'check.mjs'), '--repo', code, '--plan'], { encoding: 'utf8', env: { ...process.env, TOOLKIT_PROJECTS_ROOT: path.join(dir, 'projects'), CHECK_BASE } })
    .stdout.split('\n').find((l) => l.startsWith('changed code uses')) || '';
  try {
    context('');
    assert.match(gate(base), /RED .*1 finding/, 'a raw colour is a finding');
    context('`src/a.css` keeps `#ff00` for print');
    assert.match(gate(base), /RED .*1 finding/, 'a ruling naming part of the value waives nothing');
    context('`src/a.css` keeps `#ff0000` for print');
    assert.match(gate(base), /\bok\b/, 'a ruling naming the file and the value waives it');
    assert.match(gate('f'.repeat(40)), /RED .*git could not read/, 'an unreadable base is RED');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
  console.log('ok the validate gate: a finding is RED, a ruling naming it waives it, an unreadable base is RED');
}
// a code-only project ("design": "none"): every gate that reads a snapshot or Figma says not applicable,
// neither ok nor RED; the code gates still run; the same project with a design is held as before
{
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'nodesign-')));
  const code = path.join(dir, 'code'), home = path.join(dir, 'projects', 'tracker', 'figma-design-system');
  fs.mkdirSync(code); fs.mkdirSync(home, { recursive: true });
  spawnSync('git', ['-C', code, 'init', '-q']);
  fs.writeFileSync(path.join(code, 'snapshot.config.json'), JSON.stringify({ toolkit: path.join(HERE, '../..'), project: 'tracker' }));
  const context = (block) => fs.writeFileSync(path.join(home, 'design-system-context.md'), `# tracker\n\n\`\`\`json project\n${JSON.stringify(block)}\n\`\`\`\n\n\`\`\`json snapshot-routing\n${JSON.stringify({ repo: code, files: {} })}\n\`\`\`\n`);
  const plan = () => spawnSync(process.execPath, [path.join(HERE, 'check.mjs'), '--repo', code, '--plan'], { encoding: 'utf8', env: { ...process.env, TOOLKIT_PROJECTS_ROOT: path.join(dir, 'projects') } }).stdout;
  const FIGMA = [/the front-end standard holds/, /each component's stylesheet is its contract/, /a component read back from code or Figma/, /component specs resolve/, /the snapshot is at the published library/, /changed code uses the system's components/, /parity: every gate/];
  try {
    context({ name: 'Tracker', phase: 'build', design: 'none' });
    let out = plan();
    for (const g of FIGMA) assert.match(out.split('\n').find((l) => g.test(l)) || '', /not applicable: no design/, out);
    assert.match(out, /no job the toolkit owns is written again here\s+runs/, out);
    assert.doesNotMatch(out.split('\n').filter((l) => /not applicable/.test(l)).join('\n'), /RED|\bok\b/, out);
    fs.mkdirSync(path.join(code, 'bin')); fs.writeFileSync(path.join(code, 'bin/tokens'), '#!/bin/sh\n');
    assert.match(plan(), /the front-end standard holds\s+runs/, 'with a bin/tokens the tokens gate runs');
    context({ name: 'Tracker', phase: 'build' });
    out = plan();
    assert.ok(!/not applicable/.test(out), out);
    assert.match(out, /component specs resolve and compact to themselves\s+RED — not run: no stored components/, out);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
  console.log('ok a code-only project: the snapshot and Figma gates are not applicable, the code gates run; with a design, unchanged');
}
// a git worktree of a project is that project, measured in the worktree: its home, its repo and its
// commits, never the main checkout's (22 Nov: a project's worktrees read "not a registered project")
{
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'worktree-')));
  const code = path.join(dir, 'projects', 'acme'), home = path.join(code, 'figma-design-system');
  const remote = path.join(dir, 'origin.git'), wt = path.join(code, '.claude', 'worktrees', 'w');
  const git = (cwd, ...a) => spawnSync('git', ['-C', cwd, ...a], { encoding: 'utf8' });
  fs.mkdirSync(path.join(home, 'round-trip'), { recursive: true });
  fs.writeFileSync(path.join(home, 'design-system-context.md'), '# acme\n\n```json snapshot-routing\n'
    + JSON.stringify({ repo: code, files: { library: [{ key: 'KEYA', id: 'IDA', roles: ['components', 'tokens'] }] } }) + '\n```\n');
  fs.writeFileSync(path.join(home, 'round-trip', 'accepted.json'), '{}');
  fs.writeFileSync(path.join(code, 'snapshot.config.json'), JSON.stringify({ toolkit: path.join(HERE, '../..'), project: 'acme', check: { validate: { system: ['lib/'] } }, parity: { baseline: { dir: 'measured' } }, paths: { tokens: 'tokens.json' } }));
  fs.writeFileSync(path.join(code, '.gitignore'), '.claude/\nmeasured/\n');
  fs.mkdirSync(path.join(code, 'measured', 'accepted'), { recursive: true }); fs.writeFileSync(path.join(code, 'measured', 'accepted', 'components.json'), '{"a":1}');
  git(dir, 'init', '-q', '--bare', remote);
  git(code, 'init', '-q', '-b', 'main'); git(code, 'config', 'user.email', 'check@localhost'); git(code, 'config', 'user.name', 'check');
  git(code, 'add', '.'); git(code, 'commit', '-qm', 'base'); git(code, 'remote', 'add', 'origin', remote); git(code, 'push', '-q', '-u', 'origin', 'main');
  git(code, 'worktree', 'add', '-q', '--no-track', '-b', 'work', wt, 'origin/main');
  // the worktree differs from the main checkout in one thing a gate reads
  fs.rmSync(path.join(wt, 'figma-design-system', 'round-trip', 'accepted.json'));
  const env = { ...process.env, TOOLKIT_PROJECTS_ROOT: path.join(dir, 'projects') };
  const plan = (repo) => spawnSync(process.execPath, [path.join(HERE, 'check.mjs'), '--repo', repo, '--plan'], { encoding: 'utf8', env }).stdout;
  const line = (out, g) => out.split('\n').find((l) => g.test(l)) || '';
  try {
    const main = plan(code), work = plan(wt);
    assert.ok(!fs.existsSync(path.join(wt, 'measured', 'accepted')), '--plan copies nothing');
    spawnSync(process.execPath, [path.join(HERE, 'check.mjs'), '--repo', wt, '--no-browser'], { encoding: 'utf8', env, timeout: 120000 });
    assert.match(line(main, /a component read back/), /runs/, main);
    assert.doesNotMatch(work, /not a registered project/, work);
    assert.match(line(work, /a component read back/), /no accepted round-trip counts/, 'the worktree is measured, not the main checkout\n' + work);
    assert.equal(fs.readFileSync(path.join(wt, 'measured', 'accepted', 'components.json'), 'utf8'), '{"a":1}', 'a worktree starts from the main checkout\'s accepted measurements');
    assert.equal(git(wt, 'rev-parse', '--abbrev-ref', '@{u}').status !== 0, true, 'the worktree\'s branch has no upstream');
    assert.doesNotMatch(work, /no upstream branch/, 'a branch with no upstream counts from origin\'s default branch\n' + work);
    // a main checkout keeps its old verdict, even with a worktree value inherited from a parent process
    git(code, 'checkout', '-q', '-b', 'local');
    const inherited = spawnSync(process.execPath, [path.join(HERE, 'check.mjs'), '--repo', code, '--plan'], { encoding: 'utf8', env: { ...env, TOOLKIT_WORKTREE: `acme=${wt}` } }).stdout;
    assert.match(inherited, /no upstream branch/, 'a main checkout on a branch with no upstream does not fall back\n' + inherited);
    assert.match(line(inherited, /a component read back/), /runs/, 'an inherited value does not point a main checkout at the worktree');
    git(code, 'checkout', '-q', 'main'); git(code, 'branch', '-qD', 'local');
    // the built docs site exists in the main checkout only: a worktree reads it while its project folder matches
    fs.mkdirSync(path.join(home, 'site', 'api'), { recursive: true }); fs.writeFileSync(path.join(home, 'site', 'api', 'index.json'), '{}');
    fs.writeFileSync(path.join(code, '.gitignore'), '.claude/\nfigma-design-system/site/\n'); git(code, 'commit', '-qam', 'ignore the site'); git(code, 'push', '-q', 'origin', 'main');
    git(wt, 'checkout', '-q', 'figma-design-system'); git(wt, 'merge', '-q', '--ff-only', 'origin/main');
    assert.match(line(plan(code), /changed code uses/), /\bok\b|runs/, 'the main checkout reads its build');
    assert.match(line(plan(wt), /changed code uses/), /\bok\b|runs/, 'a worktree whose folder matches reads the main checkout\'s build');
    fs.writeFileSync(path.join(wt, 'figma-design-system', 'design-system-context.md'), fs.readFileSync(path.join(home, 'design-system-context.md'), 'utf8') + '\nchanged\n');
    assert.match(line(plan(wt), /changed code uses/), /no built docs site/, 'a worktree that changed its folder does not');
    git(wt, 'checkout', '-q', 'figma-design-system');
    assert.match(line(plan(wt), /changed code uses/), /\bok\b|runs/, 'restored, it reads the build again');
    fs.writeFileSync(path.join(wt, 'tokens.json'), '{}'); git(wt, 'add', 'tokens.json'); git(wt, 'commit', '-qm', 'tokens');
    assert.match(line(plan(wt), /changed code uses/), /no built docs site/, 'a worktree that changed the snapshot\'s store does not');
    const seen = spawnSync(process.execPath, ['-e', `const c=require(${JSON.stringify(path.join(HERE, '../snapshot/projects.cjs'))});const l=c.layout(null,'acme');console.log(l.projectDir+'|'+l.repo)`], // not-shared: calls layout() only, which writes nothing
      { encoding: 'utf8', env: { ...env, TOOLKIT_WORKTREE: `acme=${wt}` } }).stdout.trim();
    assert.equal(seen, `${path.join(wt, 'figma-design-system')}|${wt}`, 'under TOOLKIT_WORKTREE a tool resolves the project to the worktree');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
  console.log('ok a worktree of a project runs its gates, measured in the worktree');
}
console.log('5/5 passed');
