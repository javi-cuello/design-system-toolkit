#!/usr/bin/env node
/*
 * tools/project-check/pre-push.mjs — the push hook every project hands its pushes
 * to (toolkit-standard §D 13). A project's .githooks/pre-push is a shim that
 * init.mjs writes, with `core.hooksPath .githooks`, once per clone.
 *
 * For each ref pushed: a push that changes only the paths `check.exempt`
 * names (content, pushed by a server on a schedule) is let through; one whose
 * tree, exempt paths aside, already passed bin/check on this clone is not
 * re-run (a rebase that brought only content); anything else runs bin/check
 * with CHECK_BASE set to what the push lands on, so the browser gates can
 * tell whether a render could have moved. Lifted from one project's hook on
 * 2026-10-03, where the other project's ran the whole check on every push.
 * A gate that cannot compare two commits says the push carries code.
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync, execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';

const REPO = path.resolve(process.argv[2] || '.');
const git = (args) => execFileSync('git', ['-C', REPO, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
const config = createRequire(import.meta.url)('../shared/repo-config.cjs').repoConfig(REPO, 'pre-push');
const exempt = (config.check && config.check.exempt) || [];
const ZERO = /^0+$/;
const GREEN = path.join(REPO, git(['rev-parse', '--git-dir']).trim(), 'last-check-green');
const fingerprint = (sha) => git(['ls-tree', sha]).split('\n').filter((l) => l && !exempt.some((e) => l.endsWith(`\t${e.replace(/\/$/, '')}`))).join('\n');

const input = fs.readFileSync(0, 'utf8').split('\n').filter(Boolean);
let fallback = '';
try { fallback = git(['rev-parse', '--verify', '-q', 'origin/main']).trim(); } catch { /* a first push */ }
for (const l of input) {
  const [, localSha, , remoteSha] = l.split(/\s+/);
  if (ZERO.test(localSha)) continue;
  const base = ZERO.test(remoteSha) ? fallback : remoteSha;
  let code;
  try { code = git(['diff', '--name-only', base || `${localSha}~1`, localSha]).split('\n').filter((f) => f && !exempt.some((e) => f.startsWith(e))); } catch { code = [`(cannot compare ${base} with ${localSha})`]; }
  if (!code.length) continue;
  const fp = fingerprint(localSha);
  if (fs.existsSync(GREEN) && fs.readFileSync(GREEN, 'utf8') === fp) { console.log('pre-push: this code already passed bin/check — not re-running'); continue; }
  /* bin/check reads the working tree, so it can vouch only for the commit
     checked out with nothing beside it: pushing another ref, or a tree with
     changes or untracked files the commit lacks, would check one thing and
     cache another as green (found by review, 2026-10-03). Refused, saying
     what to do, rather than checked wrongly. */
  const head = git(['rev-parse', 'HEAD']).trim();
  const loose = git(['status', '--porcelain']).split('\n').filter((x) => x.trim() && !exempt.some((e) => x.slice(3).startsWith(e)));
  // an annotated tag's sha is the tag object: compare the commit it points at
  const pushed = git(['rev-parse', `${localSha}^{commit}`]).trim();
  if (head !== pushed || loose.length) {
    console.log(`pre-push: bin/check reads the working tree, so it checks only the commit checked out with nothing uncommitted — ${head !== pushed ? `this push sends ${pushed.slice(0, 10)}, HEAD is ${head.slice(0, 10)}` : `${loose.length} uncommitted or untracked path(s): ${loose.slice(0, 3).map((x) => x.slice(3)).join(', ')}`}. Check out what you push, commit or remove the rest, and push again.`);
    process.exit(1);
  }
  console.log('pre-push: code is in this push — running bin/check');
  const r = spawnSync(path.join(REPO, 'bin/check'), [], { stdio: 'inherit', env: { ...process.env, GIT_PUSHING: '1', CHECK_BASE: base || '' } });
  if (r.status !== 0) { console.log('pre-push: bin/check failed; push refused'); process.exit(1); }
  fs.writeFileSync(GREEN, fp);
}
process.exit(0);
