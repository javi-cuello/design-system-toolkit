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
 * (`endsWith`) is fine. And realpathSync is called inside a try: argv[1] need
 * not be a file (`node -e '…' arg`, a script on stdin), and an unguarded call
 * throws on import (audit, 2026-11-05: 39 guards). The try is written on the
 * guard's line, `(() => { try { return realpathSync(…); } catch { return null; } })()`. Lists each other one;
 * exits 1 when there is any.
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
// the guards that resolve argv[1] outside a try, so importing the module from a process whose argv[1] is no file throws
export function throwing(text) {
  return text.split('\n').map((line, i) => [line, i + 1])
    .filter(([l]) => /realpathSync(?:\.native)?\(\s*process\.argv\[1\]/.test(l) && !/\btry\s*\{\s*return\b[^}]*realpathSync/.test(l) && !/console\./.test(l))
    .map(([, n]) => n);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === (() => { try { return realpathSync(process.argv[1]); } catch { return null; } })()) {
  const files = execFileSync('git', ['-C', ROOT, 'ls-files', '*.mjs', '*.js', '*.cjs'], { encoding: 'utf8' })
    .split('\n').filter((f) => f && !/(^|\/)(node_modules|test-[^/]*)$|\/tests?\//.test(f) && !/(^|\/)test-[^/]+$/.test(f));
  const found = [];
  for (const f of files) {
    let text; try { text = readFileSync(join(ROOT, f), 'utf8'); } catch { continue; }
    for (const n of unresolved(text)) found.push(`${f}:${n}: compares process.argv[1] as typed; resolve it with realpathSync`);
    for (const n of throwing(text)) found.push(`${f}:${n}: resolves process.argv[1] outside a try; an import from a process whose argv[1] is no file throws`);
  }
  for (const f of found) console.log(f);
  process.exit(found.length ? 1 : 0);
}
