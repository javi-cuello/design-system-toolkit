#!/usr/bin/env node
/*
 * A script's "am I the one being run" guard, read through the real path.
 *
 *   node tools/toolkit-check/main-guards.mjs
 *
 * `import.meta.url` is the module's real path; `process.argv[1]` is the path as
 * typed. Run from ~/.claude/skills (a symlink into this repo), or from a shell
 * that entered through ~/projects on a case-insensitive disk, the two differ, a
 * guard comparing them as given never fires, and the script prints nothing and
 * exits 0: a `--check` passed every description that way (review, 2026-10-30,
 * twelve scripts). Every comparison of `process.argv[1]` to the module goes
 * through `realpathSync`; one that matches on the file's name alone
 * (`endsWith`) is fine. Lists each other one; exits 1 when there is any.
 * Tested by test-main-guards.mjs.
 */
import { readFileSync, realpathSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

// the guards in one file's text that compare argv[1] unresolved
export function unresolved(text) {
  return text.split('\n').map((line, i) => [line, i + 1])
    .filter(([l]) => /process\.argv\[1\]/.test(l) && /===|==/.test(l) && !/realpath|realPath|endsWith/i.test(l))
    .map(([, n]) => n);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === realpathSync(process.argv[1])) {
  const files = execFileSync('git', ['-C', ROOT, 'ls-files', '*.mjs', '*.js', '*.cjs'], { encoding: 'utf8' })
    .split('\n').filter((f) => f && !/(^|\/)(node_modules|test-[^/]*)$|\/tests?\//.test(f) && !/(^|\/)test-[^/]+$/.test(f));
  const found = [];
  for (const f of files) {
    let text; try { text = readFileSync(join(ROOT, f), 'utf8'); } catch { continue; }
    for (const n of unresolved(text)) found.push(`${f}:${n}`);
  }
  for (const f of found) console.log(`${f}: compares process.argv[1] as typed; compare realpathSync(process.argv[1])`);
  process.exit(found.length ? 1 : 0);
}
