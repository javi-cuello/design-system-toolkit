// node tools/claude-hooks/test-validate-turn.mjs — the Stop check runs the system's checker over the code a turn wrote and left uncommitted.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { validateTurn, uncommittedIn } from './validate-turn.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.join(here, '../system-mcp/fixtures/site');
const V = { system: ['src/design-system/'], code: ['src/'] };

function repo() {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'validate-turn-')));
  const git = (...a) => execFileSync('git', ['-C', dir, '-c', 'user.email=t@t', '-c', 'user.name=t', '-c', 'commit.gpgsign=false', '-c', 'core.hooksPath=/dev/null', ...a], { stdio: 'ignore' });
  made.push(dir);
  git('init', '-q');
  fs.mkdirSync(path.join(dir, 'src/app/x'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'src/design-system/b'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'src/app/x/done.tsx'), 'export const D = () => <button>Old</button>;\n');
  git('add', '.'); git('commit', '-qm', 'init');
  const raw = 'export default function P() {\n  return <button style={{ color: "#ff0000" }}>Go</button>;\n}\n';
  fs.writeFileSync(path.join(dir, 'src/app/x/page.tsx'), raw);
  fs.writeFileSync(path.join(dir, 'src/design-system/b/b.tsx'), raw);
  return dir;
}
const made = [];
process.on('exit', () => { for (const d of made) fs.rmSync(d, { recursive: true, force: true }); });
const projectsAt = (dir) => ({ repos: () => [{ name: 'sample', dir }], layout: () => ({ site: SITE, doc: '' }), rulings: () => [] });

test('code the turn wrote and left uncommitted, in scope, is read and its findings returned', () => {
  const dir = repo();
  const said = validateTurn(new Set([path.join(dir, 'src/app/x/page.tsx')]), { projects: projectsAt(dir), repoConfig: () => ({ check: { validate: V } }) });
  assert.match(said.reason, /sample: \d+ finding\(s\)/);
  assert.match(said.reason, /src\/app\/x\/page\.tsx:2 {2}raw element: <button>/);
  // put once: the same findings, seen, block nothing
  assert.equal(validateTurn(new Set([path.join(dir, 'src/app/x/page.tsx')]), { projects: projectsAt(dir), repoConfig: () => ({ check: { validate: V } }), seen: new Set(said.keys) }), null);
  // a second occurrence of a seen finding is new
  fs.appendFileSync(path.join(dir, 'src/app/x/page.tsx'), 'export const Q = () => <button>Again</button>;\n');
  const again = validateTurn(new Set([path.join(dir, 'src/app/x/page.tsx')]), { projects: projectsAt(dir), repoConfig: () => ({ check: { validate: V } }), seen: new Set(said.keys) });
  assert.match(again.reason, /raw element: <button>/);
  assert.equal(again.keys.length, 1);
  // no time left is no finding
  assert.equal(validateTurn(new Set([path.join(dir, 'src/app/x/page.tsx')]), { projects: projectsAt(dir), repoConfig: () => ({ check: { validate: V } }), budget: 0 }), null);
});

test('the system\'s own code, committed code and a project with no check.validate are not read', () => {
  const dir = repo();
  const opts = { projects: projectsAt(dir), repoConfig: () => ({ check: { validate: V } }) };
  assert.equal(validateTurn(new Set([path.join(dir, 'src/design-system/b/b.tsx')]), opts), null);
  assert.equal(validateTurn(new Set([path.join(dir, 'src/app/x/done.tsx')]), opts), null);
  assert.equal(validateTurn(new Set([path.join(dir, 'src/app/x/page.tsx')]), { ...opts, repoConfig: () => ({}) }), null);
  assert.equal(validateTurn(new Set(), opts), null);
  assert.deepEqual(uncommittedIn(dir, [path.join(dir, 'src/app/x/page.tsx'), path.join(dir, 'src/app/x/done.tsx'), '/elsewhere/a.tsx']), ['src/app/x/page.tsx']);
});

test('a registered project with no snapshot.config.json is skipped, and the process goes on', () => {
  const dir = repo();
  const bare = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'validate-turn-bare-')));
  made.push(bare);
  const projects = { ...projectsAt(dir), repos: () => [{ name: 'bare', dir: bare }, { name: 'sample', dir }] };
  // the default reader: the sample repo has no config file either, so nothing is read and nothing exits
  assert.equal(validateTurn(new Set([path.join(dir, 'src/app/x/page.tsx')]), { projects }), null);
});

test('a path with brackets is matched as written, not as a glob', () => {
  const dir = repo();
  fs.mkdirSync(path.join(dir, 'src/app/[id]'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'src/app/[id]/page.tsx'), 'export default () => <button>Go</button>;\n');
  assert.deepEqual(uncommittedIn(dir, [path.join(dir, 'src/app/[id]/page.tsx')]), ['src/app/[id]/page.tsx']);
});

test('a project with no built site is skipped, not failed', () => {
  const dir = repo();
  const projects = { ...projectsAt(dir), layout: () => ({ site: path.join(dir, 'no-site'), doc: '' }) };
  assert.equal(validateTurn(new Set([path.join(dir, 'src/app/x/page.tsx')]), { projects, repoConfig: () => ({ check: { validate: V } }) }), null);
});
