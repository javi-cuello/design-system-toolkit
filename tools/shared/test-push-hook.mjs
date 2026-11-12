// pushHookProblem: a hooksPath that does not exist, a hook that runs something else, and one in place.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { pushHookProblem } from './push-hook.mjs';

const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'push-hook-'));
const git = (...a) => execFileSync('git', ['-C', repo, ...a], { encoding: 'utf8' });
git('init', '-q');
let n = 0;
git('config', 'core.hooksPath', path.join(repo, 'gone', '.githooks'));
assert.match(pushHookProblem(repo, /bin\/check/, 'fix it') || '', /no pre-push hook at .*gone\/\.githooks\/pre-push.*fix it/, 'a hooksPath to a deleted folder is named, absolute as set'); n++;
git('config', 'core.hooksPath', '.githooks');
fs.mkdirSync(path.join(repo, '.githooks'));
fs.writeFileSync(path.join(repo, '.githooks/pre-push'), '#!/bin/sh\nexit 0\n');
assert.match(pushHookProblem(repo, /bin\/check/, 'fix it') || '', /^\.githooks\/pre-push does not hand the push to bin\/check: fix it$/, 'a hook that runs something else is named'); n++;
fs.writeFileSync(path.join(repo, '.githooks/pre-push'), '#!/bin/sh\nexec "$REPO/bin/check" --no-fix\n');
assert.equal(pushHookProblem(repo, /bin\/check/, 'fix it'), null, 'a hook that runs the check is in place'); n++;
git('config', '--unset', 'core.hooksPath');
assert.match(pushHookProblem(repo, /bin\/check/, 'fix it') || '', /^no pre-push hook at \.git\/hooks\/pre-push/, 'no hooksPath reads git\'s own folder'); n++;
fs.rmSync(repo, { recursive: true, force: true });
console.log(`test-push-hook: ${n} assertions passed`);
