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
  const git = (...a) => execFileSync('git', ['-C', dir, '-c', 'user.email=t@t', '-c', 'user.name=t', ...a], { stdio: 'ignore' });
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
const projectsAt = (dir) => ({ repos: () => [{ name: 'sample', dir }], layout: () => ({ site: SITE, doc: '' }), rulings: () => [] });

test('code the turn wrote and left uncommitted, in scope, is read and its findings returned', () => {
  const dir = repo();
  const said = validateTurn(new Set([path.join(dir, 'src/app/x/page.tsx')]), { projects: projectsAt(dir), repoConfig: () => ({ check: { validate: V } }) });
  assert.match(said, /sample: \d+ finding\(s\)/);
  assert.match(said, /src\/app\/x\/page\.tsx:2 {2}raw element: <button>/);
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
  const projects = { ...projectsAt(dir), repos: () => [{ name: 'bare', dir: bare }, { name: 'sample', dir }] };
  // the default reader: the sample repo has no config file either, so nothing is read and nothing exits
  assert.equal(validateTurn(new Set([path.join(dir, 'src/app/x/page.tsx')]), { projects }), null);
});

test('a project with no built site is skipped, not failed', () => {
  const dir = repo();
  const projects = { ...projectsAt(dir), layout: () => ({ site: path.join(dir, 'no-site'), doc: '' }) };
  assert.equal(validateTurn(new Set([path.join(dir, 'src/app/x/page.tsx')]), { projects, repoConfig: () => ({ check: { validate: V } }) }), null);
});
