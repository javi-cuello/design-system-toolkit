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
 * like any other. A project whose project block says `"design": "none"` (code
 * only) has no snapshot and no Figma file: a gate that reads either says "not
 * applicable: no design", which is neither ok nor RED (snapshot-standard rule 18). `--plan` lists what would run and what would not, and runs
 * only the gates that cost nothing — the trailers, the hook, validate, the
 * verdicts (bin/closing reads it).
 *
 * The project's facts, in `check` of snapshot.config.json:
 *   exempt   path prefixes no gate reads (content): a commit touching only
 *            these needs no Toolkit: or Knowledge: trailer, and a push of only these is let
 *            through (pre-push.mjs)
 *   renders  path prefixes a rendered page follows: with a base to compare
 *            against (CHECK_BASE, set by pre-push.mjs), the browser gates
 *            skip a push that changed none of them, and say so
 *   without  { gate: reason } — a gate this project rules out
 *   validate { system, from?, code? } — what the `validate` gate needs: `system`, the
 *            path prefixes of the design system's own code (left out: it is the
 *            system); `from`, the import prefixes its components come from; `code`,
 *            the path prefixes held (default: every changed code file). A finding
 *            that must stay is waived by a §6 ruling scoped `validate` whose text
 *            names its file and what was found, exactly as the gate printed them,
 *            each as a whole word (`#fff` does not waive `#ffffff`)
 */
import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import { spawnSync, execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { pushHookProblem } from '../shared/push-hook.mjs';
import { fileURLToPath } from 'node:url';
import { undeclared, renderChanged, pipedVerdicts, trailerReport, unread, knowledgeReport } from './loop.mjs';
import { realPath } from '../shared/real-path.mjs';
// code the validate gate reads: what an agent writes a screen in
import { inScope, unwaived } from '../system-mcp/validate.mjs';

// run from a git hook, git exports where the repo is, and a step that makes a scratch
// repo would write into the project's instead (toolkit's bin/check clears the same)
for (const v of ['GIT_DIR', 'GIT_WORK_TREE', 'GIT_INDEX_FILE', 'GIT_COMMON_DIR', 'GIT_OBJECT_DIRECTORY', 'GIT_PREFIX', 'GIT_NAMESPACE']) delete process.env[v];

const TOOLKIT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const argv = process.argv.slice(2);
const arg = (k) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : null; };
// the on-disk spelling, so a shell that entered through ~/projects still matches the registry
const REPO = realPath(arg('--repo') || '.');
const PLAN = argv.includes('--plan');
// --quick: every gate but those that measure (a browser, or the measuring lock), so work can start on a check that takes under a minute; the push runs them all
const QUICK = argv.includes('--quick');
const config = createRequire(import.meta.url)('../shared/repo-config.cjs').repoConfig(REPO, 'check');
const C = config.check || {};
const req = createRequire(import.meta.url);
const contract = req('../snapshot/projects.cjs');
const { tokenFor } = req('../snapshot/version.cjs');
const T = (p) => path.join(TOOLKIT, p);
const git = (args) => { try { return execFileSync('git', ['-C', REPO, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch { return ''; } };

// set only here, for this run and the gates it starts: a value inherited from a parent never redirects a main checkout
delete process.env.TOOLKIT_WORKTREE;
let inWorktree = false;
let label = (contract.projects().list.find((p) => p.repo && realPath(p.repo) === REPO) || {}).name;
// a git worktree of a registered project is that project: found by its main checkout, and every
// tool the gates run is pointed at the worktree (projects.cjs worktreeOf), so none measures the main checkout
if (!label) {
  const common = git(['rev-parse', '--path-format=absolute', '--git-common-dir']);
  const main = common ? realPath(path.dirname(common)) : null;
  const of = main && main !== REPO && contract.projects().list.find((p) => p.repo && realPath(p.repo) === main);
  if (of) {
    label = of.name; inWorktree = true; process.env.TOOLKIT_WORKTREE = `${label}=${REPO}`;
    // parity measures whatever answers on the app's port, the main checkout's server included: a worktree takes a free one
    if (!process.env.PARITY_APP_PORT) {
      const srv = net.createServer();
      await new Promise((ok) => srv.listen(0, '127.0.0.1', ok));
      process.env.PARITY_APP_PORT = String(srv.address().port);
      await new Promise((ok) => srv.close(ok));
    }
    // parity's accepted measurements are gitignored, so a new worktree has none: it starts from the main
    // checkout's last accepted run, copied once and never written back
    const dir = ((config.parity || {}).baseline || {}).dir;
    const from = dir && path.join(main, dir, 'accepted'), to = dir && path.join(REPO, dir, 'accepted');
    if (!PLAN && from && fs.existsSync(from) && !fs.existsSync(to)) fs.cpSync(from, to, { recursive: true });
  }
}
// where the snapshot stored things: the canonical layout where `paths` is silent
const where = req('../snapshot/store.cjs').paths(REPO, config.paths || {});

// the browser gates: run unless asked not to, or unless a push changed nothing a render follows
const BASE = process.env.CHECK_BASE || '';
let noBrowser = argv.includes('--no-browser') ? 'asked for' : QUICK ? '--quick; the push runs it' : null;
if (!noBrowser && BASE && C.renders) {
  const hit = renderChanged(REPO, BASE, C.renders);
  if (hit === null) noBrowser = `nothing a render follows changed since ${BASE.slice(0, 10)}`;
}

// a worktree's branch with no upstream, before its first push, counts from origin's default branch
const origin = inWorktree ? ['origin/HEAD', 'origin/main'].find((r) => git(['rev-parse', '--verify', '-q', `refs/remotes/${r}`])) : null;
const upstream = git(['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}']) || origin || '';
const range = BASE ? `${BASE}..HEAD` : upstream ? `${upstream}..HEAD` : null;

/* Each gate: what it needs (null when fed, else the missing fact) and how it runs. */
const V = C.validate || {};
let site = label ? contract.layout(null, label).site : null;
// the docs site is built in the main checkout only, from the project folder and the snapshot's store: a
// worktree reads that build while those paths match the main checkout's commit and neither tree has changed them
if (site && inWorktree && !fs.existsSync(path.join(site, 'api/index.json'))) {
  const main = realPath(path.dirname(git(['rev-parse', '--path-format=absolute', '--git-common-dir'])));
  const inputs = [contract.layout(null, label).projectDir, path.join(REPO, 'snapshot.config.json'), ...['tokens', 'components', 'icons', 'graphics', 'previews', 'screens', 'changes', 'index'].map((k) => where[k])]
    .filter((p) => typeof p === 'string').map((p) => path.relative(REPO, p)).filter(Boolean);
  // an input outside the repo cannot be compared, so the main checkout's build is not trusted for it
  const inside = inputs.every((p) => !p.startsWith('..') && !path.isAbsolute(p));
  const run = (dir, args) => { try { return { out: execFileSync('git', ['-C', dir, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(), ok: true }; } catch { return { ok: false }; } };
  const head = run(main, ['rev-parse', 'HEAD']).out;
  const same = head && run(REPO, ['diff', '--quiet', head, 'HEAD', '--', ...inputs]).ok;
  const clean = (dir) => { const r = run(dir, ['status', '--porcelain', '--', ...inputs]); return r.ok && !r.out; };
  if (inside && same && clean(REPO) && clean(main)) site = path.join(main, path.relative(REPO, site));
}
// a code-only project: the gates that read a snapshot or a Figma file do not apply to it
const noDesign = () => (label && contract.layout(null, label).design === 'none' ? 'no design' : null);
const changedCode = () => {
  // three dots: what this branch changed since it left its base, not what the base did since;
  // a moved file counts (R), and -z keeps a path as git wrote it
  // read untrimmed, and a range git cannot read is a failure, never an empty push read as green
  let out;
  try { out = execFileSync('git', ['-C', REPO, 'diff', '-z', '--name-only', '--diff-filter=AMR', range.replace('..', '...')], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }); }
  catch (e) { return { error: `git could not read ${range}: ${String(e.stderr || e.message).trim().split('\n')[0]}` }; }
  return out.split('\0').filter((f) => f && inScope(f, V) && fs.existsSync(path.join(REPO, f)));
};

const GATES = [
  { id: 'styles', name: 'the stylesheet rules no measurement can see', rule: 'code-standard, as tools/css-lint/README.md lists',
    needs: () => (config.styles ? null : 'no `styles` in snapshot.config.json'), cmd: () => ['node', T('tools/css-lint/check.mjs'), '--repo', REPO] },
  { id: 'tokens', name: 'the front-end standard holds', rule: 'code-standard 51-55',
    na: () => (noDesign() && !fs.existsSync(path.join(REPO, 'bin/tokens')) ? 'no design and no bin/tokens' : null),
    needs: () => null, cmd: () => ['node', T('tools/tokens/check.mjs'), '--repo', REPO] },
  { id: 'componentStyles', na: noDesign, name: 'each component\'s stylesheet is its contract, generated', rule: 'code-standard 23',
    needs: () => (config.paths && config.paths.componentStyles ? null : 'no `paths.componentStyles`: where tools/component-contract/to-code.mjs writes the component stylesheets'),
    cmd: () => ['node', T('tools/component-contract/to-code.mjs'), '--repo', REPO, '--check'] },
  { id: 'roundTrip', na: noDesign, measures: true, name: 'a component read back from code or Figma is the contract it was, no worse than accepted', rule: '§D 23',
    needs: () => (!label ? 'not a registered project (no figma-design-system/ context document)' : contract.layout(null, label).error ? `its layout: ${contract.layout(null, label).error}` : fs.existsSync(path.join(contract.layout(null, label).projectDir, 'round-trip', 'accepted.json')) ? null : 'no accepted round-trip counts: node tools/component-contract/eval.mjs --project <label> --accept, once'),
    cmd: () => ['node', T('tools/component-contract/eval.mjs'), '--project', label, '--check'] },
  { id: 'specs', na: noDesign, name: 'component specs resolve and compact to themselves', rule: 'snapshot-standard',
    needs: () => (fs.existsSync(where.components) ? null : `no stored components at ${path.relative(REPO, where.components)}`), cmd: () => ['node', T('tools/snapshot/check-specs.cjs'), where.components] },
  { id: 'owned', name: 'no job the toolkit owns is written again here', rule: 'code-standard 59, §D 1',
    needs: () => null, cmd: () => ['node', T('tools/toolkit-check/owned-check.mjs'), '--repo', REPO] },
  { id: 'pinned', na: noDesign, name: 'the snapshot is at the published library', rule: 'snapshot-standard',
    needs: () => (!label ? 'not a registered project (no figma-design-system/ context document)' : tokenFor(REPO, config) ? null : 'no Figma token: FIGMA_TOKEN, the project\'s `figmaToken` command, or the machine\'s ~/.config/figma/token (bin/set-key figma)'), cmd: () => ['node', T('tools/snapshot/deliver.cjs'), label, '--pinned'] },
  { id: 'lessons', name: 'every commit says where its lesson went', rule: '§D 8, §D 13',
    needs: () => (range ? null : 'no upstream branch to count commits from'), fn: () => {
      const bad = undeclared(REPO, range, C.exempt || [], TOOLKIT);
      return trailerReport(bad, range);
    } },
  { id: 'knowledge', name: 'every interface commit names the knowledge it followed', rule: '§D 21',
    needs: () => (range ? null : 'no upstream branch to count commits from'), fn: () => knowledgeReport(unread(REPO, range, C.exempt || [], TOOLKIT), range) },
  { id: 'hook', name: 'a push runs this check', rule: '§D 13',
    needs: () => null, fn: () => pushHookProblem(REPO, /tools\/project-check\/pre-push\.mjs/, 'run tools/project-check/init.mjs --repo <dir>, which writes the shim and sets core.hooksPath (two projects\' own hooks had drifted apart: one skipped content-only pushes and cached a green tree, the other did neither)') },
  { id: 'validate', na: noDesign, name: 'changed code uses the system\'s components and tokens', rule: '§D 15, knowledge/code/agent-prototyping.md',
    needs: () => (!V.system ? 'no `check.validate.system`: the path prefixes of the design system\'s own code'
      : !range ? 'no upstream branch to count commits from'
      : !site || !fs.existsSync(path.join(site, 'api/index.json')) ? 'no built docs site with its api (the docs service builds it after a snapshot)' : null),
    fn: () => {
      const files = changedCode();
      if (files.error) return files.error;
      if (!files.length) return null;
      const r = spawnSync(process.execPath, [T('tools/system-mcp/validate.mjs'), ...files.map((f) => path.join(REPO, f)), '--api', path.join(site, 'api'), '--json', ...(V.from || []).flatMap((f) => ['--from', f])], { encoding: 'utf8', maxBuffer: 1 << 28 });
      if (r.error) return `validate could not run over ${files.length} file(s): ${r.error.message}`;
      let found;
      try { found = JSON.parse(r.stdout); } catch { const t = `${r.stdout}${r.stderr}`.trim().split('\n'); return `validate did not answer: ${t.find((l) => /error/i.test(l)) || t[0]}`; }
      // waived only by a ruling that names the very finding (validate.mjs unwaived)
      const rel = (f) => path.relative(REPO, f.file);
      const open = unwaived(found, contract.rulings(contract.layout(null, label).doc || ''), rel);
      if (!open.length) return null;
      return `${open.length} finding(s)${found.length > open.length ? `, ${found.length - open.length} waived by a ruling` : ''}\n${open.map((f) => `  ${rel(f)}:${f.line}  ${f.kind}: ${f.found}${f.use ? `  → ${f.use}` : ''}`).join('\n')}\n  Fix each in the code: a finding is never judged away. One that must stay is waived by a §6 ruling scoped \`validate\` naming its file and what was found.`;
    } },
  { id: 'verdicts', name: 'a check\'s verdict reaches whoever runs it', rule: 'code-standard 49',
    needs: () => null, fn: () => {
      const files = ['bin', '.githooks'].flatMap((d) => { const p = path.join(REPO, d); return fs.existsSync(p) ? fs.readdirSync(p).map((f) => path.join(p, f)).filter((f) => fs.statSync(f).isFile()) : []; })
        .filter((f) => /^#!.*\b(sh|bash|zsh)\b/.test(fs.readFileSync(f, 'utf8').split('\n')[0]));
      const bad = files.flatMap((f) => pipedVerdicts(fs.readFileSync(f, 'utf8')).map((l) => `  ${path.relative(REPO, f)}:${l}`));
      return bad.length ? `${bad.length} check(s) piped on, whose status is then the pipe's:\n${bad.join('\n')}` : null;
    } },
  { id: 'parity', na: noDesign, name: 'parity: every gate, components and screens against Figma', rule: 'design-code-parity', browser: true,
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
  const na = g.na && g.na();
  if (na) { line(g.name, `not applicable: ${na}`); continue; }
  const missing = g.needs();
  if (without[g.id]) {
    if (!missing) { line(g.name, `RED — ruled out in check.without, but its facts are here: run it, and drop the ruling`); failed++; }
    else line(g.name, `not run — ruled out: ${without[g.id]}`);
    continue;
  }
  if (missing) { line(g.name, `RED — not run: ${missing}; supply it, or rule the gate out in check.without with a reason`); failed++; continue; }
  if (g.browser && noBrowser) { line(g.name, `skipped (${noBrowser})`); continue; }
  if (g.measures && QUICK) { line(g.name, 'skipped (--quick; the push runs it)'); continue; }
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
