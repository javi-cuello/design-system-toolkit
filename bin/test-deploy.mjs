#!/usr/bin/env node
// node bin/test-deploy.mjs — bin/deploy's arguments, its project and site lookup, its refusals, and the
// wrangler call it would make. npx is a stub on PATH that records what it was asked and deploys nothing;
// the projects are a temp folder (TOOLKIT_PROJECTS_ROOT). Nothing is published and the network is never reached.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT = fileURLToPath(new URL('./deploy', import.meta.url));
const REPO = path.dirname(path.dirname(SCRIPT));
const tmp = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'deploy-')));
// removed however the run ends, a failed check included
process.on('exit', () => fs.rmSync(tmp, { recursive: true, force: true }));
const stub = path.join(tmp, 'stub');
const root = path.join(tmp, 'projects'); // projects-path: a fixture tree, no real project
fs.mkdirSync(stub);
fs.mkdirSync(root);
const log = path.join(tmp, 'npx.log');
// the stub: its arguments, and the config it was pointed at, written down; nothing deployed
fs.writeFileSync(path.join(stub, 'npx'), `#!/bin/sh
echo "ARGS $*" >> "${log}"
echo "CWD $(pwd)" >> "${log}"
prev=; for a in "$@"; do [ "$prev" = --config ] && { echo "CONF"; cat "$a"; } >> "${log}"; prev=$a; done
exit 0
`);
fs.chmodSync(path.join(stub, 'npx'), 0o755);
for (const t of ['wrangler', 'curl']) { fs.writeFileSync(path.join(stub, t), '#!/bin/sh\necho "unexpected call" >&2; exit 99\n'); fs.chmodSync(path.join(stub, t), 0o755); }

let n = 0;
const ok = (name, cond) => { n++; assert.ok(cond, name); console.log('ok', name); };
const run = (...args) => {
  if (fs.existsSync(log)) fs.rmSync(log);
  const r = spawnSync('sh', [SCRIPT, ...args], { encoding: 'utf8', env: { PATH: `${stub}:${path.dirname(process.execPath)}:/usr/bin:/bin`, HOME: tmp, TOOLKIT_PROJECTS_ROOT: root } });
  return { code: r.status, out: r.stdout + r.stderr, npx: fs.existsSync(log) ? fs.readFileSync(log, 'utf8') : '' };
};
const home = path.join(root, 'demo', 'figma-design-system');
const site = path.join(home, 'site');

let r = run();
ok('no project: usage, exit 2, nothing run', r.code === 2 && /usage: bin\/deploy/.test(r.out) && r.npx === '');
r = run('demo');
ok('no --public or --password: refused, exit 2, nothing run', r.code === 2 && /refused: say who may read demo-docs/.test(r.out) && r.npx === '');
r = run('demo', '--publik');
ok('a misspelt flag is refused, never read as one', r.code === 2 && r.npx === '');
r = run('demo', '--public', '--password');
ok('both flags: a usage error, exit 2, nothing run', r.code === 2 && /not both/.test(r.out) && r.npx === '');
ok('…in either order', run('demo', '--password', '--public').code === 2);
r = run('demo', '--public', '--pasword');
ok('an unknown flag beside a valid one is refused, exit 2, nothing run', r.code === 2 && /unknown option --pasword/.test(r.out) && r.npx === '');
r = run('demo', '--public');
ok('a project with no context document: exit 1, nothing run', r.code === 1 && /no project demo/.test(r.out) && r.npx === '');

fs.mkdirSync(home, { recursive: true });
fs.writeFileSync(path.join(home, 'design-system-context.md'), '# Demo\n');
r = run('demo', '--public');
ok('no built site: exit 1, nothing run', r.code === 1 && /no built site at .*demo\/figma-design-system\/site/.test(r.out) && r.npx === '');
fs.mkdirSync(path.join(site, 'api'), { recursive: true });
fs.writeFileSync(path.join(site, 'index.html'), '<!doctype html>');
r = run('demo', '--public');
ok('a site with no API files (mid-build): exit 1, nothing run', r.code === 1 && /mid-build/.test(r.out) && r.npx === '');

fs.writeFileSync(path.join(site, 'api', 'index.json'), '{}');
r = run('demo', '--public');
ok('--public deploys the site as <project>-docs at the pinned wrangler', r.code === 0
  && new RegExp(`^ARGS --yes wrangler@\\d+\\.\\d+\\.\\d+ deploy --assets ${site} --name demo-docs --compatibility-date \\d{4}-\\d\\d-\\d\\d$`, 'm').test(r.npx));
ok('wrangler runs in a scratch folder, never the repo', !r.npx.includes(`CWD ${REPO}`) && /^CWD \//m.test(r.npx));

r = run('demo', '--password');
const conf = JSON.parse(r.npx.split('CONF\n')[1] || 'null');
ok('--password deploys through a config', r.code === 0 && /^ARGS --yes wrangler@\S+ deploy --config \S+wrangler\.json$/m.test(r.npx));
ok('the password worker runs before any file is served', conf && conf.name === 'demo-docs' && conf.main === path.join(REPO, 'tools/docs-site/deploy/password.js')
  && conf.assets.directory === site && conf.assets.binding === 'ASSETS' && conf.assets.run_worker_first === true);
ok('it says how to set the password', /secret put PASSWORD --name demo-docs/.test(r.out));
ok('the password worker it names is there', fs.existsSync(conf.main));

console.log(`${n}/${n} passed`);
