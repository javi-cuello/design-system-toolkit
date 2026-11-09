#!/usr/bin/env node
/*
 * tools/skill-evals/run.mjs — an agent eval for a project: can Claude, with the
 * toolkit's skills, build a component from its design? The answer is graded
 * by the same gates that hold the project's own code.
 *
 *   node tools/skill-evals/run.mjs --repo <dir> [task id] [--rules on|off] [--brief snapshot|contract] [--context on|off] [--no-agent] [--keep-files] [--keep]
 *
 * For each task in `evals.tasks` of the project's snapshot.config.json:
 *   1. a throwaway copy of HEAD's tree, or the commit the task is pinned to (`commit`,
 *      `evals.commit`), with no history (git archive), its dependencies
 *      linked (`evals.link`), the task's files removed (`remove`);
 *   2. Claude Code, headless, in that copy, given the task's prompt — editing
 *      allowed, node only for the two gates (eval.mjs agentTools), pushing refused;
 *   3. the grade: the project's build step (`evals.build`), a server for the
 *      copy when the project serves its components (`evals.serve`, its port
 *      handed to parity as PARITY_HOST_BASE), the parity run scoped to the
 *      task's target, and the stylesheet gates;
 *   4. one line appended to `evals.results` (in the project repo, so a trend
 *      is in its history): score, green, turns, cost, time.
 * `--no-agent` grades the copy as prepared — removed files and all, which must
 * score low, or the grade measures nothing; with `--keep-files` (nothing
 * removed) it must score as the project does. `--keep` leaves the copy. A run
 * whose transcript shows a read of the original repo, or git, scores 0, and so
 * does one that changed what the grade reads (the design, a mapping, a story,
 * the config): parity can be made to agree by editing either side. Those
 * inputs are read-only in the copy while the agent works, and a void run is
 * never graded: no build, server or gate runs over it.
 *
 * A screen task (`"grade": "validate"`) builds something new from a product
 * prompt that names no component: it has no parity target and may remove
 * nothing. Its grade is tools/system-mcp/validate.mjs, the push gate's own
 * checker, over the code files the agent created or changed (inside
 * `check.validate.code`, outside `check.validate.system`) against the built
 * docs site's api; the prompt never names it. `--context on` gives the agent
 * the system MCP over that site, served read-only; `off` gives it no MCP
 * server at all, its user's own included, so the two differ by the context alone.
 * A parity task takes `--context` only when it is named; unnamed, its agent
 * keeps the user's own servers, as every parity line before it did.
 *
 * Written 2026-10-03, after a comparison with practitioners named this the
 * toolkit's largest gap: the gates hold the code, but nothing measured whether
 * a skill change made the agent that writes the code better or worse.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { spawn, spawnSync, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { taskProblems, parseParity, score, styleCount, compare, contamination, inputs, changed, comparable, gradingPaths, gradingOutputs, inside, opened, agentTools, DATA_RULE, lock, unlock, voided, codeFiles, validateScore, chromeFinding, SYSTEM, pinOf, COMMIT, sameCommit, baselineOf, configDrift, summarise, compareSummary } from './eval.mjs';
import { CODE, unwaived } from '../system-mcp/validate.mjs';
import { serveFolder } from '../system-mcp/serve-folder.mjs';
import { realPath } from '../shared/real-path.mjs';
import { createRequire } from 'node:module';
import { officials, homeIn } from '../component-contract/official.mjs';

const TOOLKIT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const argv = process.argv.slice(2);
const opt = (k) => { const i = argv.indexOf(k); return i >= 0 ? argv.splice(i, 2)[1] : null; };
const flag = (k) => { const i = argv.indexOf(k); if (i >= 0) argv.splice(i, 1); return i >= 0; };
const REPO = path.resolve((opt('--repo') || '.').replace(/^~/, os.homedir()));
const NO_AGENT = flag('--no-agent'), KEEP = flag('--keep'), KEEP_FILES = flag('--keep-files');
// the rules hook (tools/claude-hooks/hooks.mjs edit) on or off for the agent, so a run can say whether it helps
const RULES = opt('--rules') || 'on';
if (!['on', 'off'].includes(RULES)) { console.log('evals: --rules is on or off'); process.exit(2); }
// which file the agent is told holds the design: the measured snapshot or the
// component's contract (tools/component-contract); unset, the prompt names neither
const BRIEF = opt('--brief');
if (BRIEF && !['snapshot', 'contract'].includes(BRIEF)) { console.log('evals: --brief is snapshot or contract'); process.exit(2); }
// the agent with the system MCP or with no MCP server at all: a screen task's always (on by
// default), a parity task's only when asked, so its runs keep the setting they were compared under
const CONTEXT_ASKED = opt('--context');
const CONTEXT = CONTEXT_ASKED || 'on';
if (!['on', 'off'].includes(CONTEXT)) { console.log('evals: --context is on or off'); process.exit(2); }
// several trials of each task, and a line that summarises them: one run of a non-deterministic agent is a sample of one
const TRIALS = Number(opt('--trials') || 1);
if (!Number.isInteger(TRIALS) || TRIALS < 1) { console.log('evals: --trials is a whole number, 1 or more'); process.exit(2); }
if (TRIALS > 1 && NO_AGENT) { console.log('evals: --trials repeats the agent; --no-agent grades the copy once'); process.exit(2); }
const only = argv[0] || null;
const config = createRequire(import.meta.url)('../shared/repo-config.cjs').repoConfig(REPO, 'evals');
const E = config.evals;
if (!E || !Array.isArray(E.tasks) || !E.tasks.length) { console.log('evals: no `evals.tasks` in snapshot.config.json — nothing to run, and that is not a pass'); process.exit(1); }
for (const t of E.tasks) { const p = taskProblems(t); if (p.length) { console.log(`evals: task ${t.id || '?'}: ${p.join('; ')}`); process.exit(1); } }
const tasks = E.tasks.filter((t) => !only || t.id === only);
if (!tasks.length) { console.log(`evals: no task "${only}" — the tasks are ${E.tasks.map((t) => t.id).join(', ')}`); process.exit(1); }
// a pinned copy: refused before any copy is made when the pin is not a hash, or not a commit this repo has
if (E.commit != null && !COMMIT.test(E.commit)) { console.log('evals: `evals.commit` is the commit the copies are made from, as a hash'); process.exit(1); }
for (const t of tasks) {
  const pin = pinOf(E, t);
  if (pin === 'HEAD') continue;
  if (spawnSync('git', ['-C', REPO, 'rev-parse', '--verify', '--quiet', `${pin}^{commit}`], { stdio: 'ignore' }).status !== 0) { console.log(`evals: task ${t.id}: commit ${pin} is not one commit in ${REPO} (missing, or too short to be only one)`); process.exit(1); }
  const shown = spawnSync('git', ['-C', REPO, 'show', `${pin}:./snapshot.config.json`], { encoding: 'utf8' });
  let then = null; try { then = JSON.parse(shown.stdout); } catch { /* none at the pin */ }
  if (!then) { console.log(`evals: task ${t.id}: ${pin} has no readable snapshot.config.json here: pin a later commit`); process.exit(1); }
  const drift = configDrift(config, then);
  if (drift.length) { console.log(`evals: task ${t.id}: at ${pin} the config's ${drift.join(', ')} differ from today's, and the grade reads today's: pin a later commit`); process.exit(1); }
}
// a screen task is graded against the system, and an agent given the context reads the site: refused before any copy is made or money spent when there is none to read
const V = (config.check && config.check.validate) || {};
const PROJECTS = createRequire(import.meta.url)('../snapshot/projects.cjs');
const label = (PROJECTS.projects().list.find((p) => p.repo && realPath(p.repo) === realPath(REPO)) || {}).name;
const SITE = label ? PROJECTS.layout(null, label).site : null;
const contextOf = (t) => (t.grade === 'validate' ? CONTEXT : CONTEXT_ASKED || null);
if (tasks.some((t) => t.grade === 'validate' || (contextOf(t) === 'on' && !NO_AGENT))) {
  const why = tasks.some((t) => t.grade === 'validate') && !V.system ? 'no `check.validate.system` in snapshot.config.json: the design system\'s own code, which a screen is graded against'
    : !SITE || !fs.existsSync(path.join(SITE, 'api/index.json')) ? 'no built docs site with its api for this project (the docs service builds it after a snapshot)' : null;
  if (why) { console.log(`evals: cannot run — ${why}`); process.exit(1); }
}

// linked dependencies sit outside the copy, and pnpm 11 then reinstalls before
// every script and refuses to (ERR_PNPM_UNSAFE_MODULES_DIR): its pre-check is
// off for the agent and the grade alike
if ((E.link || []).includes('node_modules')) process.env.pnpm_config_verify_deps_before_run = 'false';

const freePort = () => new Promise((done) => { const s = net.createServer(); s.listen(0, () => { const { port } = s.address(); s.close(() => done(port)); }); });
const up = (port) => new Promise((done) => { const s = net.connect(port, 'localhost', () => { s.end(); done(true); }); s.on('error', () => done(false)); });
const TOOLKIT_COMMIT = execFileSync('git', ['-C', TOOLKIT, 'rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim();
// the agent run without blocking this process: with the context on, the site the agent's MCP asks is served from here
const spawnAsync = (cmd, args, { timeout, ...o }) => new Promise((done) => {
  // its own process group, so a server the agent left running goes with it
  const c = spawn(cmd, args, { ...o, stdio: ['ignore', 'pipe', 'pipe'], detached: true });
  const kill = (sig) => { try { process.kill(-c.pid, sig); } catch { /* gone */ } };
  c.stdout.setEncoding('utf8'); c.stderr.setEncoding('utf8');
  let stdout = '', stderr = '', error = null, timedOut = false, hard = null;
  c.stdout.on('data', (d) => { stdout += d; }); c.stderr.on('data', (d) => { stderr += d; });
  // its own group no longer hears the terminal's Ctrl-C: an interrupted eval takes the agent with it, never leaves it spending
  const stop = () => { kill('SIGTERM'); process.exit(130); };
  process.once('SIGINT', stop); process.once('SIGTERM', stop);
  // a process that ignores SIGTERM is killed a minute later: a hung agent never holds the eval, or the site it serves
  const timer = setTimeout(() => { timedOut = true; kill('SIGTERM'); hard = setTimeout(() => kill('SIGKILL'), 60_000); hard.unref(); }, timeout);
  c.on('error', (e) => { error = e; });
  c.on('close', (status, signal) => { clearTimeout(timer); clearTimeout(hard); process.off('SIGINT', stop); process.off('SIGTERM', stop); kill('SIGTERM'); done({ stdout, stderr, status, signal, error, timedOut }); });
});
const sh = (cmd, cwd, env = {}) => spawnSync(cmd, { cwd, shell: true, encoding: 'utf8', maxBuffer: 1 << 28, env: { ...process.env, ...env } });

// the summary of a task's trials: written when they end, and when one throws, so paid runs are never left without one
function summaryOf(t, runs) {
  if (TRIALS < 2 || !runs.length) return;
  const r0 = runs[0];
  const sum = { at: new Date().toISOString(), task: t.id, agent: true, summary: true, ...(r0.grade ? { grade: r0.grade } : {}), commit: r0.commit, pinned: r0.pinned, toolkit: TOOLKIT_COMMIT,
    rules: r0.rules, rulesFired: runs.every((r) => r.rulesFired !== false), context: r0.context, brief: r0.brief ?? null, ...summarise(runs, TRIALS), costUsd: Math.round(runs.reduce((a, r) => a + (r.costUsd || 0), 0) * 100) / 100 };
  const file = path.join(REPO, E.results || 'tests/evals/results.jsonl');
  const lines = fs.existsSync(file) ? fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)) : [];
  const last = baselineOf(lines, sum);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.appendFileSync(file, JSON.stringify(sum) + '\n');
  console.log(`${t.id}: ${sum.ran} of ${TRIALS} trials${sum.ran < TRIALS ? ' (cut short)' : ''} — mean ${sum.mean ?? '-'}, green in ${sum.green} of ${sum.scored} scored${sum.void ? `, ${sum.void} void` : ''}, pass^${TRIALS} ${sum.passAll ? 'yes' : 'no'}; ${sum.costUsd} USD; ${compareSummary(last, sum)}`);
}

for (const t of tasks) {
  const runs = [];
  try {
  for (let trial = 1; trial <= TRIALS; trial++) {
  // the copy is the pinned commit's tree (HEAD unpinned) with no history: an agent that can run git show
  // has the answer one command away (the first run tried exactly that)
  const pin = pinOf(E, t);
  const commit = execFileSync('git', ['-C', REPO, 'rev-parse', '--short', `${pin}^{commit}`], { encoding: 'utf8' }).trim();
  const copy = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), `eval-${t.id}-`)));
  execFileSync('sh', ['-c', `git -C "${REPO}" archive ${commit} | tar -x -C "${copy}"`]);
  const t0 = Date.now();
  let server = null, record, site = null;
  const screen = t.grade === 'validate';
  // the MCP flags for a context: on serves the built site read-only for this run and gives the agent the
  // system MCP over it; off gives it no server; null (a parity task not asked) leaves the agent's own as they were
  const contextArgs = async (c) => {
    if (c === 'on') site = await serveFolder(SITE);
    return { flags: c ? ['--strict-mcp-config', ...(c === 'on' ? ['--mcp-config', JSON.stringify({ mcpServers: { system: { command: process.execPath, args: [path.join(TOOLKIT, 'tools/system-mcp/server.mjs')], env: { DOCS_URL: site.url } } } })] : [])] : [],
      tools: c === 'on' ? ['mcp__system'] : [] };
  };
  try {
    // what the copy needs but git does not carry: a folder linked rather than
    // installed, a file copied — Kirby loads no config that resolves outside
    // its root, so a linked config file was silently ignored (2026-10-03)
    for (const l of E.link || []) {
      const from = path.join(REPO, l), to = path.join(copy, l);
      if (!fs.existsSync(from) || fs.existsSync(to)) continue;
      if (fs.statSync(from).isDirectory()) fs.symlinkSync(from, to); else fs.copyFileSync(from, to);
    }
    // a path that is not there removes nothing, and one outside the copy is not the copy's
    for (const f of t.remove || []) {
      const p = path.resolve(copy, f);
      if (!inside(copy, f)) throw new Error(`task ${t.id}: remove "${f}" is not a file in the project`);
      if (!KEEP_FILES) fs.rmSync(p, { recursive: true, force: true });
    }
    const before = inputs(copy, gradingPaths(config), gradingOutputs(config));
    // read-only for the agent: the gates it may run mid-work import some of these (eval.mjs, agentTools)
    const modes = NO_AGENT ? new Map() : lock(copy, Object.keys(before));
    const codeBefore = screen ? codeFiles(copy, V, CODE) : null;

    let agent = { turns: 0, costUsd: 0, durationMs: 0, result: '(no agent: graded as prepared)' };
    if (!NO_AGENT && screen) {
      // a headless agent that stops to ask writes nothing (the first context-on baseline run did, 2026-11-04): it decides and says so
      const prompt = `${t.prompt}\n\nYou are in a throwaway copy of this project. Work only from what is in this folder; reading the original repository or using git voids the run. ${DATA_RULE} No one will answer a question during this run: where the request leaves something open, decide, build it, and say what you decided. Do not commit or push.`;
      // on: the system MCP over the built site, served read-only for this run; off: no server. Strict either way, so the user's own never load
      const ctx = await contextArgs(contextOf(t));
      const r = await spawnAsync('claude', ['-p', prompt, '--output-format', 'json', '--max-turns', String(E.maxTurns || 60),
        '--permission-mode', 'acceptEdits', ...ctx.flags, '--allowedTools', ...agentTools(TOOLKIT, E.agentCommands || []), ...ctx.tools,
        '--disallowedTools', 'Bash(git push:*)', 'Bash(git commit:*)',
        ...(RULES === 'on' ? ['--settings', JSON.stringify({ hooks: { PreToolUse: [{ matcher: 'Edit|Write|MultiEdit|NotebookEdit|Bash', hooks: [{ type: 'command', command: `node "${TOOLKIT}/tools/claude-hooks/hooks.mjs" edit`, timeout: 15 }] }] } })] : [])],
        { cwd: copy, timeout: (E.minutes || 30) * 60_000,
          env: { ...process.env, TOOLKIT_EVAL_COPY: copy, ...(RULES === 'off' ? { TOOLKIT_RULES: 'off' } : {}) } });
      let j = {};
      try { j = JSON.parse(r.stdout); } catch { j = { result: (r.stdout || r.stderr || '').slice(-400) }; }
      // a run stopped by its turn limit, or one Claude reports as an error, exits 0 with half a screen: not a clean exit
      const stopped = j.subtype && j.subtype !== 'success' ? j.subtype : j.is_error ? 'error' : null;
      agent = { exit: r.error ? r.error.code || 'error' : r.timedOut ? 'timeout' : r.signal || (r.status === 0 && stopped) || r.status, turns: j.num_turns ?? null, costUsd: j.total_cost_usd == null ? null : Math.round(j.total_cost_usd * 100) / 100, durationMs: j.duration_ms ?? null, result: String(j.result || '').slice(0, 300), session: j.session_id || null };
      const projects = path.join(os.homedir(), '.claude', 'projects'); // projects-path: Claude's own transcripts, not ours
      const tr = agent.session && fs.existsSync(projects) ? fs.readdirSync(projects).map((d) => path.join(projects, d, `${agent.session}.jsonl`)).find((f) => fs.existsSync(f)) : null;
      const transcript = tr ? fs.readFileSync(tr, 'utf8') : '';
      agent.contaminated = tr ? contamination(transcript.split('\n'), REPO, os.homedir(), { copy, gitReachable: spawnSync('git', ['-C', copy, 'rev-parse', '--git-dir'], { stdio: 'ignore' }).status === 0 }) : ['no transcript found to check'];
      agent.rulesFired = RULES === 'on' ? transcript.includes('First change in this area') : null;
      // a context-on run where the agent never asked the system is still its result, and is said so
      agent.askedSystem = contextOf(t) === 'on' ? transcript.includes('"name":"mcp__system__') : null;
      // only what was there before: a story or spec the agent adds for its new screen is not the parity grade's, and this grade reads none of them
      agent.tampered = changed(before, inputs(copy, gradingPaths(config), gradingOutputs(config))).filter((f) => before[f]);
    } else if (!NO_AGENT) {
      const specDir = path.relative(copy, path.join(createRequire(import.meta.url)('../snapshot/store.cjs').paths(copy, config.paths || {}).components, t.target));
      // the official contract (component-contract's official.mjs): Figma's reading beside the spec, or the copy's own file
      const officialOf = () => {
        const read = JSON.parse(fs.readFileSync(path.join(copy, specDir, 'contract.json'), 'utf8'));
        const o = officials(homeIn(copy)), own = o.fileOf(read.figma && read.figma.key);
        return o.source === 'contract' && own && fs.existsSync(own) ? path.relative(copy, own) : path.join(specDir, 'contract.json');
      };
      const official = BRIEF === 'contract' ? officialOf() : path.join(specDir, 'contract.json');
      const briefFiles = { contract: official, snapshot: path.join(specDir, 'figma.json') };
      const brief = !BRIEF ? '' : BRIEF === 'contract'
        ? `\n\nThe component's design is in \`${briefFiles.contract}\`: its contract, what the design means (props, anatomy, what each prop value changes), every value a token. Build from it.`
        : `\n\nThe component's design is in \`${briefFiles.snapshot}\`: the snapshot, every variant as Figma drew it, measured. Build from it.`;
      const prompt = `${t.prompt}${brief}\n\nYou are in a throwaway copy of this project. Work only from what is in this folder and the toolkit; reading the original repository or using git voids the run. ${DATA_RULE} When you are done, \`node ${TOOLKIT}/tools/parity/run.mjs --repo . ${t.target}\` must report no differences and \`node ${TOOLKIT}/tools/css-lint/check.mjs --repo .\` must be green${E.build ? `, after \`${E.build}\`` : ''}. Do not commit or push.`;
      const ctx = await contextArgs(contextOf(t));
      // run without blocking: with the context on, the site the agent's MCP asks is served from this process
      const r = await spawnAsync('claude', ['-p', prompt, '--output-format', 'json', '--max-turns', String(E.maxTurns || 60),
        '--permission-mode', 'acceptEdits', ...ctx.flags, '--allowedTools', ...agentTools(TOOLKIT, E.agentCommands || []), ...ctx.tools,
        '--disallowedTools', 'Bash(git push:*)', 'Bash(git commit:*)',
        ...(RULES === 'on' ? ['--settings', JSON.stringify({ hooks: { PreToolUse: [{ matcher: 'Edit|Write|MultiEdit|NotebookEdit|Bash', hooks: [{ type: 'command', command: `node "${TOOLKIT}/tools/claude-hooks/hooks.mjs" edit`, timeout: 15 }] }] } })] : [])],
        { cwd: copy, timeout: (E.minutes || 30) * 60_000,
          // the copy counts as a project for the rules hook; off turns the hook off even where the user's own settings register it
          env: { ...process.env, TOOLKIT_EVAL_COPY: copy, ...(RULES === 'off' ? { TOOLKIT_RULES: 'off' } : {}) } });
      let j = {};
      try { j = JSON.parse(r.stdout); } catch { j = { result: (r.stdout || r.stderr || '').slice(-400) }; }
      // a turn limit or an error result is not a clean exit, as in the screen branch
      const stopped = j.subtype && j.subtype !== 'success' ? j.subtype : j.is_error ? 'error' : null;
      agent = { exit: r.error ? r.error.code || 'error' : r.timedOut ? 'timeout' : r.signal || (r.status === 0 && stopped) || r.status, turns: j.num_turns ?? null, costUsd: j.total_cost_usd == null ? null : Math.round(j.total_cost_usd * 100) / 100, durationMs: j.duration_ms ?? null, result: String(j.result || '').slice(0, 300), session: j.session_id || null };
      // the agent's own transcript, read for a look at the answer
      const projects = path.join(os.homedir(), '.claude', 'projects'); // projects-path: Claude's own transcripts, not ours
      const tr = agent.session && fs.existsSync(projects) ? fs.readdirSync(projects).map((d) => path.join(projects, d, `${agent.session}.jsonl`)).find((f) => fs.existsSync(f)) : null;
      const transcript = tr ? fs.readFileSync(tr, 'utf8') : '';
      agent.contaminated = tr ? contamination(transcript.split('\n'), REPO, os.homedir(), { copy, gitReachable: spawnSync('git', ['-C', copy, 'rev-parse', '--git-dir'], { stdio: 'ignore' }).status === 0 }) : ['no transcript found to check'];
      // a rules run where the hook never spoke measured nothing about the rules (the first two did exactly that)
      agent.rulesFired = RULES === 'on' ? transcript.includes('First change in this area') : null;
      agent.askedSystem = contextOf(t) === 'on' ? transcript.includes('"name":"mcp__system__') : null;
      agent.opened = opened(transcript.split('\n'), briefFiles);
      const after = inputs(copy, gradingPaths(config), gradingOutputs(config));
      agent.tampered = changed(before, after);
    }
    // writable again once the agent is done and its changes are read: the build and serve below may rewrite them
    unlock(copy, modes);

    // the grade, by the project's own gates, over the copy — never over a void
    // one: a gate run over a changed mapping would run the changed code
    // a build that fails leaves the copy's old compiled output in place, which
    // would grade the original's styles: a failed build scores nothing
    const vo = voided(agent);
    const none = { status: null, stdout: '' };
    if (screen) {
      // what the agent wrote: created or changed, never a file it deleted
      const after = codeFiles(copy, V, CODE);
      // what git would ignore (a build's output, an install) is not what the agent wrote, as the push gate never sees it
      // (nested ignore files too; NUL-separated, so no path is quoted or split; the caller's GIT_* never point it at another repo)
      const gitEnv = Object.fromEntries(Object.entries(process.env).filter(([k]) => !k.startsWith('GIT_')));
      const ignored = (spawnSync('sh', ['-c', 'git init -q . && git check-ignore -z --stdin'], { cwd: copy, input: Object.keys(after).join('\0'), encoding: 'utf8', env: gitEnv }).stdout || '').split('\0').filter(Boolean);
      const touched = changed(codeBefore, after).filter((f) => after[f] && !ignored.includes(f));
      const written = touched.filter((f) => !after[f].endsWith(SYSTEM)), inSystem = touched.filter((f) => after[f].endsWith(SYSTEM));
      let findings = null, graderSaid = '';
      if (!vo && written.length) {
        const r = spawnSync(process.execPath, [path.join(TOOLKIT, 'tools/system-mcp/validate.mjs'), ...written.map((f) => path.join(copy, f)), '--api', path.join(SITE, 'api'), '--json', ...(V.from || []).flatMap((f) => ['--from', f])], { encoding: 'utf8', maxBuffer: 1 << 28 });
        // the project's own §6 waivers hold here as at the push: an existing file the agent touched is not charged for a ruled finding
        try { findings = unwaived(JSON.parse(r.stdout).map((f) => ({ ...f, file: path.relative(copy, f.file) })), PROJECTS.rulings(PROJECTS.layout(null, label).doc || ''), (f) => f.file); } catch { findings = null; graderSaid = r.error ? r.error.message : `exit ${r.status}: ${(r.stderr || r.stdout || '').trim().split('\n')[0].slice(0, 160)}`; }
      }
      // the screen's shell is graded with its imports: a page built outside it scored 1 on imports alone (feedback-screen, 2026-11-04)
      const chrome = !vo && Array.isArray(findings) ? chromeFinding(written, (f) => fs.readFileSync(path.join(copy, f), 'utf8'), t.chrome) : null;
      if (chrome) findings = [...findings, chrome];
      const s = vo || validateScore(written, findings, { system: inSystem, agentExit: NO_AGENT ? 0 : agent.exit });
      if (graderSaid) s.why = s.why.replace('validate did not report', `validate did not report (${graderSaid})`);
      record = { at: new Date().toISOString(), task: t.id, grade: 'validate', commit, pinned: pin !== 'HEAD', toolkit: TOOLKIT_COMMIT,
        agent: !NO_AGENT, rules: NO_AGENT ? null : RULES, rulesFired: NO_AGENT ? null : agent.rulesFired, context: NO_AGENT ? null : CONTEXT, askedSystem: agent.askedSystem ?? null, ...s,
        // each finding as validate printed it: a count says the agent missed, this says what (the first baseline could not tell)
        written: written.length, inSystem: inSystem.length, findings: findings ? findings.length : null, found: findings ? findings.slice(0, 40).map((f) => `${f.file}:${f.line} ${f.kind}: ${f.found}`) : null, kinds: findings ? Object.fromEntries([...new Set(findings.map((f) => f.kind))].map((k) => [k, findings.filter((f) => f.kind === k).length])) : null,
        turns: agent.turns, costUsd: agent.costUsd, minutes: Math.round((Date.now() - t0) / 6000) / 10, note: agent.result };
    } else {
    const built = vo ? none : E.build ? sh(E.build, copy) : { status: 0 };
    const env = {};
    if (!vo && E.serve) {
      const port = await freePort();
      server = spawn(E.serve.replace('{port}', port), { cwd: copy, shell: true, stdio: 'ignore', detached: true });
      env.PARITY_HOST_BASE = `http://localhost:${port}`;
      let i = 0;
      while (i++ < 60 && !(await up(port))) await new Promise((r) => setTimeout(r, 250));
      if (!(await up(port))) throw new Error(`task ${t.id}: the server (\`${E.serve}\`) never answered on port ${port}`);
    }
    const p = vo ? none : sh(`node ${TOOLKIT}/tools/parity/run.mjs --repo . ${t.target}`, copy, env);
    const st = vo ? none : sh(`node ${TOOLKIT}/tools/css-lint/check.mjs --repo .`, copy);
    // a gate that crashed printed no count: not a clean sheet (styleCount), and an exit no count explains is named (score)
    const findings = vo ? null : styleCount(st.stdout, st.status);
    const parity = parseParity(p.stdout);
    const s = vo || (built.status === 0 ? score({ parity, styleFindings: findings, exits: { ...(NO_AGENT ? {} : { agent: agent.exit }), parity: p.status ?? p.signal, styles: st.status ?? st.signal } }) : { score: 0, green: false, why: `the build failed: ${((built.stderr || built.stdout || '').trim().split('\n').pop() || '').slice(0, 120)}` });
    record = { at: new Date().toISOString(), task: t.id, commit, pinned: pin !== 'HEAD', toolkit: TOOLKIT_COMMIT,
      agent: !NO_AGENT, rules: NO_AGENT ? null : RULES, rulesFired: NO_AGENT ? null : agent.rulesFired, brief: NO_AGENT ? null : BRIEF || null, context: NO_AGENT ? null : contextOf(t), askedSystem: agent.askedSystem ?? null, opened: agent.opened ?? null, ...s, matched: parity?.matched ?? 0, waived: parity?.waived ?? 0, didNot: parity?.didNot ?? 0, styleFindings: findings,
      turns: agent.turns, costUsd: agent.costUsd, minutes: Math.round((Date.now() - t0) / 6000) / 10, note: agent.result };
    }
  } finally {
    if (server) try { process.kill(-server.pid); } catch { /* gone */ }
    if (site) site.close();
    if (!KEEP) fs.rmSync(copy, { recursive: true, force: true });
  }

  if (TRIALS > 1) Object.assign(record, { trial, of: TRIALS });
  runs.push(record);
  const file = path.join(REPO, E.results || 'tests/evals/results.jsonl');
  const lines = fs.existsSync(file) ? fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)) : [];
  const last = baselineOf(lines, record);
  if (record.agent) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.appendFileSync(file, JSON.stringify(record) + '\n'); }
  if (record.grade === 'validate') { console.log(`${t.id}${record.agent ? ` (rules ${record.rules}, context ${record.context}${record.context === 'on' ? `, ${record.askedSystem ? 'asked' : 'never asked'} the system` : ''})` : ''}: score ${record.score}${record.green ? ' (green)' : ''} — ${record.written} file(s) written, ${record.findings ?? '?'} validate finding(s)${record.kinds && record.findings ? ` (${Object.entries(record.kinds).map(([k, n]) => `${n} ${k}`).join(', ')})` : ''}${record.why ? ` — ${record.why}` : ''}; ${record.turns ?? '-'} turns, ${record.costUsd ?? '-'} USD, ${record.minutes} min; ${record.of ? `trial ${record.trial} of ${record.of}` : compare(last, record)}${record.rules === 'on' && !record.rulesFired ? ' — WARNING: the rules hook never fired, so this is not a rules-on run' : ''}${KEEP ? ` — copy kept at ${copy}` : ''}`); continue; }
  console.log(`${t.id}${record.agent ? ` (rules ${record.rules}${record.context ? `, context ${record.context}${record.context === 'on' ? `, ${record.askedSystem ? 'asked' : 'never asked'} the system` : ''}` : ''}${record.brief ? `, brief ${record.brief}, opened ${record.opened.join(' and ') || 'neither'}` : ''})` : ''}: score ${record.score}${record.green ? ' (green)' : ''} — ${record.matched} matched, ${record.didNot} did not, ${record.styleFindings ?? '?'} stylesheet finding(s)${record.why ? ` — ${record.why}` : ''}; ${record.turns ?? '-'} turns, ${record.costUsd ?? '-'} USD, ${record.minutes} min; ${record.of ? `trial ${record.trial} of ${record.of}` : compare(last, record)}${record.rules === 'on' && !record.rulesFired ? ' — WARNING: the rules hook never fired, so this is not a rules-on run' : ''}${KEEP ? ` — copy kept at ${copy}` : ''}`);
  }
  } finally {
    // a summary that fails must not hide the error that ended the trials
    try { summaryOf(t, runs); } catch (e) { console.log(`evals: ${t.id}: the summary could not be written (${e.message})`); }
  }
}
