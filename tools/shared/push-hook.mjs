/*
 * Whether a repo's pushes run its check (toolkit-standard §D 13): the pre-push
 * hook git will actually run, and that it hands the push to the expected
 * script. One definition for project-check's `hook` gate and the toolkit's own
 * bin/check. Git skips a core.hooksPath that does not exist, without a word:
 * the toolkit's pointed at a deleted worktree's folder and no push ran bin/check
 * (2026-11-11).
 *
 *   pushHookProblem(repo, expects, fixHint) → null when the hook is in place, else what is wrong
 *   node tools/shared/push-hook.mjs         → the toolkit's own: exit 1 and why, when its pushes skip bin/check
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export function pushHookProblem(repo, expects, fixHint) {
  // git's own answer: core.hooksPath when set (an absolute one stays absolute), else the hooks folder of the
  // repo's git dir, which in a linked worktree is no `.git/hooks` under it (there .git is a file)
  let dir = '';
  try { dir = execFileSync('git', ['-C', repo, 'rev-parse', '--path-format=absolute', '--git-path', 'hooks'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch {}
  const hook = path.join(dir || path.join(repo, '.git/hooks'), 'pre-push');
  const rel = path.relative(fs.realpathSync(repo), hook); // git answers through symlinks (/var is /private/var)
  const shown = rel.startsWith('..') ? hook : rel;
  if (!fs.existsSync(hook)) return `no pre-push hook at ${shown}, so a push runs no check: ${fixHint}`;
  return expects.test(fs.readFileSync(hook, 'utf8')) ? null : `${shown} does not hand the push to ${expects.source.replace(/\\/g, '')}: ${fixHint}`;
}

const HERE = fileURLToPath(import.meta.url);
if (process.argv[1] && fs.realpathSync(path.resolve(process.argv[1])) === fs.realpathSync(HERE)) {
  const repo = process.argv[2] ? path.resolve(process.argv[2]) : path.resolve(path.dirname(HERE), '../..');
  const p = pushHookProblem(repo, /bin\/check/, 'git config core.hooksPath .githooks');
  let set = '';
  try { set = execFileSync('git', ['-C', repo, 'config', 'core.hooksPath'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch {}
  // A clone that never installed the hook (CI, a stranger's) is told so; one that set a path git cannot run is red.
  if (p && !set) { console.log(`not installed in this clone: ${p}`); process.exit(0); }
  if (p) { console.error(p); process.exit(1); }
  console.log('a push runs bin/check');
}
