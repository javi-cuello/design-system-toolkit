#!/usr/bin/env node
/*
 * tools/project-check/check.mjs — every gate the toolkit holds a project to, run
 * the same way in every project (toolkit-standard §D 13). A project's own
 * bin/check calls this once, beside the steps that are genuinely its own:
 *
 *   node tools/project-check/check.mjs --repo <dir> [--no-browser] [--plan]
 *
 * Until 2026-10-03 each project called the toolkit's gates one by one, and
 * the two had drifted: one ran the markup, overflow and pinned-snapshot gates,
 * the other none of them, and nothing said so. A gate added here now reaches
 * every project on its next check.
 *
 * A gate a project cannot feed is a failure, not a silence: either the
 * project supplies the fact it needs, or it rules the gate out with a reason
 * in `check.without` of its snapshot.config.json, where the ruling is read
 * like any other. `--plan` lists what would run and what would not, and runs
 * only the gates that cost nothing — the trailers, the hook, the verdicts
 * (bin/closing reads it).
 *
 * The project's facts, in `check` of snapshot.config.json:
 *   exempt   path prefixes no gate reads (content): a commit touching only
 *            these needs no Toolkit: or Knowledge: trailer, and a push of only these is let
 *            through (pre-push.mjs)
 *   renders  path prefixes a rendered page follows: with a base to compare
 *            against (CHECK_BASE, set by pre-push.mjs), the browser gates
 *            skip a push that changed none of them, and say so
 *   without  { gate: reason } — a gate this project rules out
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync, execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { undeclared, renderChanged, pipedVerdicts, trailerReport, unread, knowledgeReport } from './loop.mjs';
import { realPath } from '../shared/real-path.mjs';

// run from a git hook, git exports where the repo is, and a step that makes a scratch
// repo would write into the project's instead (toolkit's bin/check clears the same)
for (const v of ['GIT_DIR', 'GIT_WORK_TREE', 'GIT_INDEX_FILE', 'GIT_COMMON_DIR', 'GIT_OBJECT_DIRECTORY', 'GIT_PREFIX', 'GIT_NAMESPACE']) delete process.env[v];

const TOOLKIT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const argv = process.argv.slice(2);
const arg = (k) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : null; };
// the on-disk spelling, so a shell that entered through ~/projects still matches the registry
const REPO = realPath(arg('--repo') || '.');
const PLAN = argv.includes('--plan');
const config = JSON.parse(fs.readFileSync(path.join(REPO, 'snapshot.config.json'), 'utf8'));
const C = config.check || {};
const req = createRequire(import.meta.url);
const contract = req('../snapshot/projects.cjs');
const { tokenFor } = req('../snapshot/version.cjs');
const T = (p) => path.join(TOOLKIT, p);
const git = (args) => { try { return execFileSync('git', ['-C', REPO, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch { return ''; } };

const label = (contract.projects().list.find((p) => p.repo && realPath(p.repo) === REPO) || {}).name;
// where the snapshot stored things: the canonical layout where `paths` is silent
const where = req('../snapshot/store.cjs').paths(REPO, config.paths || {});

// the browser gates: run unless asked not to, or unless a push changed nothing a render follows
const BASE = process.env.CHECK_BASE || '';
let noBrowser = argv.includes('--no-browser') ? 'asked for' : null;
if (!noBrowser && BASE && C.renders) {
  const hit = renderChanged(REPO, BASE, C.renders);
  if (hit === null) noBrowser = `nothing a render follows changed since ${BASE.slice(0, 10)}`;
}

const upstream = git(['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}']);
const range = BASE ? `${BASE}..HEAD` : upstream ? `${upstream}..HEAD` : null;

/* Each gate: what it needs (null when fed, else the missing fact) and how it runs. */
const GATES = [
  { id: 'styles', name: 'the stylesheet rules no measurement can see', rule: 'code-standard, as tools/css-lint/README.md lists',
    needs: () => (config.styles ? null : 'no `styles` in snapshot.config.json'), cmd: () => ['node', T('tools/css-lint/check.mjs'), '--repo', REPO] },
  { id: 'tokens', name: 'the front-end standard holds', rule: 'code-standard 51-55',
    needs: () => null, cmd: () => ['node', T('tools/tokens/check.mjs'), '--repo', REPO] },
  { id: 'componentStyles', name: 'each component\'s stylesheet is its contract, generated', rule: 'code-standard 23',
    needs: () => (config.paths && config.paths.componentStyles ? null : 'no `paths.componentStyles`: where tools/component-contract/to-code.mjs writes the component stylesheets'),
    cmd: () => ['node', T('tools/component-contract/to-code.mjs'), '--repo', REPO, '--check'] },
  { id: 'specs', name: 'component specs resolve and compact to themselves', rule: 'snapshot-standard',
    needs: () => (fs.existsSync(where.components) ? null : `no stored components at ${path.relative(REPO, where.components)}`), cmd: () => ['node', T('tools/snapshot/check-specs.cjs'), where.components] },
  { id: 'owned', name: 'no job the toolkit owns is written again here', rule: 'code-standard 59, §D 1',
    needs: () => null, cmd: () => ['node', T('tools/toolkit-check/owned-check.mjs'), '--repo', REPO] },
  { id: 'pinned', name: 'the snapshot is at the published library', rule: 'snapshot-standard',
    needs: () => (!label ? 'not a registered project (no figma-design-system/ context document)' : tokenFor(REPO, config) ? null : 'no Figma token: FIGMA_TOKEN, the project\'s `figmaToken` command, or the machine\'s ~/.config/figma/token (bin/set-key figma)'), cmd: () => ['node', T('tools/snapshot/deliver.cjs'), label, '--pinned'] },
  { id: 'lessons', name: 'every commit says where its lesson went', rule: '§D 8, §D 13',
    needs: () => (range ? null : 'no upstream branch to count commits from'), fn: () => {
      const bad = undeclared(REPO, range, C.exempt || [], TOOLKIT);
      return trailerReport(bad, range);
    } },
  { id: 'knowledge', name: 'every interface commit names the knowledge it followed', rule: '§D 21',
    needs: () => (range ? null : 'no upstream branch to count commits from'), fn: () => knowledgeReport(unread(REPO, range, C.exempt || [], TOOLKIT), range) },
  { id: 'hook', name: 'a push runs this check', rule: '§D 13',
    needs: () => null, fn: () => {
      const dir = git(['config', 'core.hooksPath']) || '.git/hooks';
      const hook = path.resolve(REPO, dir, 'pre-push'); // an absolute hooksPath stays absolute
      if (!fs.existsSync(hook)) return `no pre-push hook at ${path.relative(REPO, hook)}: run tools/project-check/init.mjs --repo <dir>, which writes the shim and sets core.hooksPath`;
      return /tools\/project-check\/pre-push\.mjs/.test(fs.readFileSync(hook, 'utf8')) ? null : `${path.relative(REPO, hook)} does not hand the push to tools/project-check/pre-push.mjs: two projects' hooks had drifted apart (one skipped content-only pushes and cached a green tree, the other did neither)`;
    } },
  { id: 'verdicts', name: 'a check\'s verdict reaches whoever runs it', rule: 'code-standard 49',
    needs: () => null, fn: () => {
      const files = ['bin', '.githooks'].flatMap((d) => { const p = path.join(REPO, d); return fs.existsSync(p) ? fs.readdirSync(p).map((f) => path.join(p, f)).filter((f) => fs.statSync(f).isFile()) : []; })
        .filter((f) => /^#!.*\b(sh|bash|zsh)\b/.test(fs.readFileSync(f, 'utf8').split('\n')[0]));
      const bad = files.flatMap((f) => pipedVerdicts(fs.readFileSync(f, 'utf8')).map((l) => `  ${path.relative(REPO, f)}:${l}`));
      return bad.length ? `${bad.length} check(s) piped on, whose status is then the pipe's:\n${bad.join('\n')}` : null;
    } },
  { id: 'parity', name: 'parity: every gate, components and screens against Figma', rule: 'design-code-parity', browser: true,
    needs: () => (config.parity ? null : 'no `parity`'), cmd: () => ['node', T('tools/parity/run.mjs'), '--repo', REPO],
    show: /assertions matched|^time:|warning: slower/ },
  { id: 'structure', name: 'the markup keeps its structural contract', rule: 'code-standard 1', browser: true,
    needs: () => (config.parity && (config.parity.pages || config.parity.app) ? null : 'no `parity.pages` (where the pages are served) and no `parity.app`'), cmd: () => ['node', T('tools/parity/pages.mjs'), '--repo', REPO, 'structure'] },
  { id: 'axe', name: 'axe: WCAG 2.2 A and AA on the pages', rule: 'design-standard (accessibility)', browser: true,
    needs: () => (config.parity && (config.parity.pages || config.parity.app) ? null : 'no `parity.pages` (where the pages are served) and no `parity.app`'), cmd: () => ['node', T('tools/parity/pages.mjs'), '--repo', REPO, 'axe'] },
  { id: 'overflow', name: 'nothing is drawn outside its box', rule: 'design-code-parity', browser: true,
    needs: () => (config.parity && (config.parity.pages || config.parity.app) ? null : 'no `parity.pages` (where the pages are served) and no `parity.app`'), cmd: () => ['node', T('tools/parity/pages.mjs'), '--repo', REPO, 'overflow'] },
];

const without = C.without || {};
const stale = Object.keys(without).filter((id) => !GATES.some((g) => g.id === id));
let failed = 0;
const line = (name, verdict) => console.log(`${name.padEnd(60)}${verdict}`);
for (const g of GATES) {
  const missing = g.needs();
  if (without[g.id]) {
    if (!missing) { line(g.name, `RED — ruled out in check.without, but its facts are here: run it, and drop the ruling`); failed++; }
    else line(g.name, `not run — ruled out: ${without[g.id]}`);
    continue;
  }
  if (missing) { line(g.name, `RED — not run: ${missing}; supply it, or rule the gate out in check.without with a reason`); failed++; continue; }
  if (g.browser && noBrowser) { line(g.name, `skipped (${noBrowser})`); continue; }
  if (PLAN && !g.fn) { line(g.name, 'runs'); continue; }
  const t0 = Date.now();
  let out = '', ok;
  if (g.fn) { const why = g.fn(); ok = !why; out = why || ''; }
  else { const r = spawnSync(g.cmd()[0], g.cmd().slice(1), { encoding: 'utf8', maxBuffer: 1 << 28 }); out = `${r.stdout || ''}${r.stderr || ''}`; ok = r.status === 0; }
  const s = `(${((Date.now() - t0) / 1000).toFixed(0)}s)`;
  if (g.id === 'pinned' && /^skipped/.test(out)) { line(g.name, `RED — not run: ${out.split('\n')[0]}`); failed++; continue; }
  line(g.name, ok ? `ok ${s}` : `RED ${s}${g.fn ? ` — ${out.split('\n')[0]}` : ''}`);
  if (!ok) { failed++; if (g.fn) out = out.split('\n').slice(1).join('\n'); console.log(out.split('\n').filter((l) => l.trim()).slice(-60).map((l) => `  ${l}`).join('\n')); }
  if (g.show) for (const l of out.split('\n').filter((x) => g.show.test(x))) console.log(`  ${l}`);
}
if (stale.length) { console.log(`check.without names no gate: ${stale.join(', ')} — the gates are ${GATES.map((g) => g.id).join(', ')}`); failed++; }
console.log(`toolkit gates: ${failed ? `${failed} RED` : 'green'}`);
process.exit(failed ? 1 : 0);
