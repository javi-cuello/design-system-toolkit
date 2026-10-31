/*
 * One walk of a repo, for every shared check that reads its files.
 *
 *   import { walkRepo } from '../shared/walk.mjs';
 *   const files = walkRepo(repo, ['.js', '.mjs', '.cjs', '.ts']);
 *
 * It existed twice — `tools/toolkit-check/owned-check.mjs` and `tools/tokens/check.mjs`,
 * both run over the same repos from the same `bin/check` — with two skip
 * lists that had already diverged: one descended into `build/`, `measured/`,
 * `shots/` and `frame-diffs/` and the other did not. Two answers to "what is
 * this repo's source", in one command.
 */
import { readdirSync } from 'node:fs';
import { join, extname } from 'node:path';

/*
 * Not source: dependencies, build output, vendored code, and the directories
 * a snapshot or a measurement run fills. `kirby`, `content` and `media` are a
 * CMS's own trees — named here rather than read from a config because no
 * config states them, which is the honest position until one does.
 */
const SKIP = new Set([
  'node_modules', '.git', '.next', 'dist', 'build', 'storybook-static', 'coverage',
  'vendor', 'kirby', 'media', 'content', '.snapshot-logs', 'measured', 'shots', 'frame-diffs',
]);

/** Every file under `root` with one of `exts` (every file, for none), skipping
 *  the trees above and anything dot-prefixed. `reject` drops a file by its full
 *  path. */
export function walkRepo(root, exts, { reject = () => false } = {}) {
  const out = [];
  const want = exts && new Set(exts);
  (function walk(dir) {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      if (SKIP.has(e.name) || e.name.startsWith('.')) continue;
      const p = join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if ((!want || want.has(extname(e.name))) && !reject(p, e.name)) out.push(p);
    }
  })(root);
  return out;
}
