#!/usr/bin/env node
/*
 * tools/docs-site/build.mjs — the one way a project's site is built, by hand
 * (`pnpm build`) or by the dashboard service. Astro stages every build in one
 * folder of this engine (`.astro/.prerender`), so two builds at once break
 * each other ("Cannot find module …/.prerender/chunks/…"), and a build
 * written straight into the live site leaves it empty when it fails. So a
 * build holds the engine's lock, waiting its turn, builds beside the site and
 * swaps it in with two renames: never two at once, never an empty site.
 *
 *   DOCS_PROJECT=<label> node build.mjs     → the project's site/ (contract.layout)
 *   DOCS_OUT=<dir> …                        → there, as built, no swap
 *
 * exits with Astro's code; stderr is Astro's, for the caller to read.
 */
import { existsSync, renameSync, rmSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { take, hold } from './lock.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const label = process.env.DOCS_PROJECT;
if (!label) { console.error('usage: DOCS_PROJECT=<label> node build.mjs'); process.exit(2); }
const pkg = join(HERE, 'node_modules', 'astro', 'package.json');
if (!existsSync(pkg)) { console.error(`no Astro install in ${HERE} (run pnpm install there)`); process.exit(2); }
const astro = join(HERE, 'node_modules', 'astro', JSON.parse(readFileSync(pkg, 'utf8')).bin.astro);

// where the site goes, read before the lock is taken, so a project that does not resolve never holds it
const SITE = createRequire(import.meta.url)('../snapshot/projects.cjs').layout(null, label).site;
const out = process.env.DOCS_OUT || join(SITE, '..', '.site-next');

// the engine's lock (lock.mjs): kept fresh while this build runs, however long; one left by a build that died is taken after two minutes
const LOCK = join(HERE, '.build.lock');
let waited = 0, token;
while (!(token = take(LOCK))) {
  if (!waited) console.error('docs build: another build holds the engine; waiting');
  await new Promise((r) => setTimeout(r, 1000));
  waited++;
}
const release = hold(LOCK, token);
// a signal to this process alone (a service manager's SIGTERM) reaches the build too, and the lock is
// released only once that build has stopped: released first, the next build ran beside it
let child = null, stopped = false;
// a second signal kills it: an Astro that will not stop would otherwise keep the lock fresh forever
for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP']) process.on(sig, () => { const again = stopped; stopped = true; if (child) child.kill(again ? 'SIGKILL' : sig); else { release(); process.exit(130); } });

let code = 1;
try {
  if (!process.env.DOCS_OUT) rmSync(out, { recursive: true, force: true });
  code = await new Promise((resolve) => {
    child = spawn(process.execPath, [astro, 'build'], { cwd: HERE, env: { ...process.env, DOCS_OUT: out }, stdio: 'inherit' });
    child.on('exit', (c) => resolve(c ?? 1));
    child.on('error', () => resolve(1));
  });
  if (!process.env.DOCS_OUT && code === 0 && !stopped) {
    // the swap: the live site is replaced in two renames, never emptied
    const old = `${SITE}.old`;
    rmSync(old, { recursive: true, force: true });
    if (existsSync(SITE)) renameSync(SITE, old);
    renameSync(out, SITE);
    rmSync(old, { recursive: true, force: true });
  } else if (!process.env.DOCS_OUT) rmSync(out, { recursive: true, force: true });
} finally { release(); }
process.exit(stopped ? 130 : code);
