#!/usr/bin/env node
/*
 * tools/project-check/init.mjs — connect a code repo to the toolkit in one
 * command (README "Connect a code repo"):
 *
 *   node tools/project-check/init.mjs --repo <dir> [--project <label>] [--dry-run]
 *
 * The project is the one the repo's snapshot.config.json names, else `--project`, else the repo's folder name: a repo
 * kept apart from its project's home (the contract editor's Settings connects one) names it.
 *
 * Does every step that needs no decision: a snapshot.config.json skeleton,
 * bin/tokens, bin/check calling check.mjs, the .githooks/pre-push shim,
 * core.hooksPath, and the repo named in the context document's
 * snapshot-routing block. Overwrites nothing: a file or setting already there
 * is kept and reported, with what it lacks. Then runs `check.mjs --plan`, so
 * the gates still wanting a fact are on screen, and prints the steps that
 * need a person (the context document, the parity mapping) rather than
 * guessing them. Until 2026-10-22 all of this was a list in the README,
 * followed by hand.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync, execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { realPath } from '../shared/real-path.mjs';

const req = createRequire(import.meta.url);
const contract = req('../snapshot/projects.cjs');
const HERE = path.dirname(fileURLToPath(import.meta.url));
const TOOLKIT = path.resolve(HERE, '../..');
const argv = process.argv.slice(2);
const arg = (k) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : null; };
const REPO = realPath(arg('--repo') || '.');
const DRY = argv.includes('--dry-run');
const tilde = (p) => (p.startsWith(os.homedir() + path.sep) ? `~${p.slice(os.homedir().length)}` : p);
const git = (...a) => { try { return execFileSync('git', ['-C', REPO, ...a], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch { return null; } };

if (git('rev-parse', '--is-inside-work-tree') !== 'true') { console.error(`${REPO} is not a git repo`); process.exit(2); }

const TK = tilde(TOOLKIT);
const configFile = path.join(REPO, 'snapshot.config.json');
const existing = fs.existsSync(configFile) ? JSON.parse(fs.readFileSync(configFile, 'utf8')) : null;
const LABEL = (existing && existing.project) || arg('--project') || path.basename(REPO);
const PAST = { write: 'wrote', set: 'set', route: 'routed' };
const did = (verb, what) => console.log((DRY ? `would ${verb}` : PAST[verb]).padEnd(12) + what);
const kept = (what, note = '') => console.log('kept'.padEnd(12) + what + (note ? ` — ${note}` : ''));
const later = [];

/* A file is written only where none is; one already there is checked for the line that matters. */
function file(rel, content, { mode, holds, why } = {}) {
  // a path git was given whole (core.hooksPath may be absolute) is used as given, as check.mjs's hook gate reads it
  const f = path.resolve(REPO, rel);
  if (fs.existsSync(f)) {
    const ok = !holds || holds.test(fs.readFileSync(f, 'utf8'));
    kept(rel, ok ? '' : why);
    if (!ok) later.push(`${rel}: ${why}`);
    return;
  }
  did('write', rel);
  if (DRY) return;
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, content, mode ? { mode } : undefined);
}

const SKELETON = {
  toolkit: TK,
  project: LABEL,
  paths: {
    tokens: 'figma-design-system/snapshot/tokens.json',
    components: 'figma-design-system/snapshot/components',
    icons: 'figma-design-system/snapshot/icons',
    graphics: 'figma-design-system/snapshot/graphics',
    previews: 'figma-design-system/snapshot/previews',
    screens: 'figma-design-system/snapshot/screens',
    changes: 'figma-design-system/snapshot/changes.json',
    index: 'figma-design-system/snapshot/index.json',
    styles: 'src/styles/tokens',
  },
  after: { library: [{ label: 'tokens', run: 'bin/tokens', required: true }] },
};
file('snapshot.config.json', JSON.stringify(SKELETON, null, 2) + '\n', { holds: /"toolkit"[\s\S]*"project"|"project"[\s\S]*"toolkit"/, why: 'names no "toolkit" and "project": add both' });
if (!existing) later.push('snapshot.config.json: `paths.styles` is a default (src/styles/tokens); move it to where this repo keeps its token stylesheets');
// each script finds the toolkit where snapshot.config.json says, the one place a repo names it
const SHIM = (tool) => `#!/bin/sh\nREPO="$(cd "$(dirname "$0")/.." && pwd)"\nexec node "$(node -e "console.log(require('$REPO/snapshot.config.json').toolkit.replace(/^~/, require('os').homedir()))")/${tool}"`;
file('bin/tokens', `${SHIM('tools/tokens/build.mjs')} --repo "$REPO" "$@"\n`, { mode: 0o755 });
file('bin/check', `${SHIM('tools/project-check/check.mjs')} --repo "$REPO" "$@"\n`, { mode: 0o755,
  holds: /tools\/project-check\/check\.mjs/, why: 'does not run tools/project-check/check.mjs: add the line tools/project-check/README.md step 4 shows beside its own steps' });

const hooks = git('config', 'core.hooksPath');
const hookDir = hooks || '.githooks';
file(path.join(hookDir, 'pre-push'), `${SHIM('tools/project-check/pre-push.mjs')} "$REPO"\n`, {
  mode: 0o755, holds: /tools\/project-check\/pre-push\.mjs/, why: 'does not hand the push to tools/project-check/pre-push.mjs' });
if (hooks) kept(`core.hooksPath ${hooks}`);
else { did('set', 'core.hooksPath .githooks'); if (!DRY) git('config', 'core.hooksPath', '.githooks'); }

/* The context document: written by a person with figma-context-capture; only its repo line is mechanical. */
const doc = path.join(contract.homeOf(LABEL), 'design-system-context.md');
const route = contract.routing(doc);
if (!fs.existsSync(doc)) later.push(`no context document at ${tilde(doc)}: open the library in Figma with the Desktop Bridge and ask Claude to capture its context there (skills/figma-context-capture; docs/setup.md step 3), then run this again`);
else if (route.missing) later.push(`${tilde(doc)} has no snapshot-routing block: add the library's file key (docs/setup.md step 3), then run this again`);
else if (route.error) later.push(route.error);
else if (route.repo && realPath(route.repo) === REPO) kept('snapshot-routing repo');
else if (route.repo) { kept('snapshot-routing repo', `routes to ${route.repo}, not here`); later.push(`${tilde(doc)}: snapshot-routing sends snapshots to ${route.repo}; change its "repo" if this repo is meant to receive them`); }
else {
  did('route', `snapshots here (snapshot-routing "repo" in ${tilde(doc)})`);
  if (!DRY) {
    const md = fs.readFileSync(doc, 'utf8');
    fs.writeFileSync(doc, md.replace(/(```json snapshot-routing\s*\n)([\s\S]*?)(\n```)/, (_, a, body, z) => a + JSON.stringify({ repo: tilde(REPO), ...JSON.parse(body) }, null, 2) + z));
  }
}

const pkg = (() => { try { return JSON.parse(fs.readFileSync(path.join(REPO, 'package.json'), 'utf8')); } catch { return null; } })();
if (!pkg || !{ ...pkg.dependencies, ...pkg.devDependencies }['style-dictionary']) later.push('the token build needs Style Dictionary: `pnpm add -D style-dictionary` (tools/tokens/README.md)');
const config = existing || SKELETON;
if (!config.parity) later.push('parity: choose the mapping of stories to Figma components with the design-code-parity skill, or rule the gate out in check.without');

if (!DRY || existing) {
  console.log(`\n${tilde(path.join(HERE, 'check.mjs'))} --plan:`);
  const r = spawnSync(process.execPath, [path.join(HERE, 'check.mjs'), '--repo', REPO, '--plan'], { encoding: 'utf8' });
  process.stdout.write(`${r.stdout || ''}${r.stderr || ''}`);
} else console.log('\n(the gate plan runs once snapshot.config.json is written)');
console.log('\nA RED gate wants the fact it names; a gate this project cannot feed is ruled out with a reason in snapshot.config.json, `"check": { "without": { "<gate>": "<why>" } }`.');
if (later.length) console.log(`\nStill to do, by hand:\n${later.map((l) => `- ${l}`).join('\n')}`);
