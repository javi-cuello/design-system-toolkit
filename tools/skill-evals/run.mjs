#!/usr/bin/env node
/*
 * tools/skill-evals/run.mjs — an agent eval for a project: can Claude, with the
 * toolkit's skills, build a component from its design? The answer is graded
 * by the same gates that hold the project's own code.
 *
 *   node tools/skill-evals/run.mjs --repo <dir> [task id] [--rules on|off] [--brief snapshot|contract] [--no-agent] [--keep-files] [--keep]
 *
 * For each task in `evals.tasks` of the project's snapshot.config.json:
 *   1. a throwaway copy of HEAD's tree with no history (git archive), its dependencies
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
 * the config): parity can be made to agree by editing either side.
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
import { taskProblems, parseParity, score, styleCount, compare, contamination, inputs, changed, comparable, gradingPaths, gradingOutputs, inside, opened, agentTools, DATA_RULE } from './eval.mjs';
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
const only = argv[0] || null;
const config = createRequire(import.meta.url)('../shared/repo-config.cjs').repoConfig(REPO, 'evals');
const E = config.evals;
if (!E || !Array.isArray(E.tasks) || !E.tasks.length) { console.log('evals: no `evals.tasks` in snapshot.config.json — nothing to run, and that is not a pass'); process.exit(1); }
for (const t of E.tasks) { const p = taskProblems(t); if (p.length) { console.log(`evals: task ${t.id || '?'}: ${p.join('; ')}`); process.exit(1); } }
const tasks = E.tasks.filter((t) => !only || t.id === only);
if (!tasks.length) { console.log(`evals: no task "${only}" — the tasks are ${E.tasks.map((t) => t.id).join(', ')}`); process.exit(1); }

// linked dependencies sit outside the copy, and pnpm 11 then reinstalls before
// every script and refuses to (ERR_PNPM_UNSAFE_MODULES_DIR): its pre-check is
// off for the agent and the grade alike
if ((E.link || []).includes('node_modules')) process.env.pnpm_config_verify_deps_before_run = 'false';

const freePort = () => new Promise((done) => { const s = net.createServer(); s.listen(0, () => { const { port } = s.address(); s.close(() => done(port)); }); });
const up = (port) => new Promise((done) => { const s = net.connect(port, 'localhost', () => { s.end(); done(true); }); s.on('error', () => done(false)); });
const TOOLKIT_COMMIT = execFileSync('git', ['-C', TOOLKIT, 'rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim();
const sh = (cmd, cwd, env = {}) => spawnSync(cmd, { cwd, shell: true, encoding: 'utf8', maxBuffer: 1 << 28, env: { ...process.env, ...env } });

for (const t of tasks) {
  // the copy is HEAD's tree with no history: an agent that can run git show
  // has the answer one command away (the first run tried exactly that)
  const copy = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), `eval-${t.id}-`)));
  execFileSync('sh', ['-c', `git -C "${REPO}" archive HEAD | tar -x -C "${copy}"`]);
  const t0 = Date.now();
  let server = null, record;
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
    for (const f of t.remove) {
      const p = path.resolve(copy, f);
      if (!inside(copy, f)) throw new Error(`task ${t.id}: remove "${f}" is not a file in the project`);
      if (!KEEP_FILES) fs.rmSync(p, { recursive: true, force: true });
    }
    const before = inputs(copy, gradingPaths(config), gradingOutputs(config));

    let agent = { turns: 0, costUsd: 0, durationMs: 0, result: '(no agent: graded as prepared)' };
    if (!NO_AGENT) {
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
      const r = spawnSync('claude', ['-p', prompt, '--output-format', 'json', '--max-turns', String(E.maxTurns || 60),
        '--permission-mode', 'acceptEdits', '--allowedTools', ...agentTools(TOOLKIT, E.agentCommands || []),
        '--disallowedTools', 'Bash(git push:*)', 'Bash(git commit:*)',
        ...(RULES === 'on' ? ['--settings', JSON.stringify({ hooks: { PreToolUse: [{ matcher: 'Edit|Write|MultiEdit|NotebookEdit|Bash', hooks: [{ type: 'command', command: `node "${TOOLKIT}/tools/claude-hooks/hooks.mjs" edit`, timeout: 15 }] }] } })] : [])],
        { cwd: copy, encoding: 'utf8', maxBuffer: 1 << 28, timeout: (E.minutes || 30) * 60_000,
          // the copy counts as a project for the rules hook; off turns the hook off even where the user's own settings register it
          env: { ...process.env, TOOLKIT_EVAL_COPY: copy, ...(RULES === 'off' ? { TOOLKIT_RULES: 'off' } : {}) } });
      let j = {};
      try { j = JSON.parse(r.stdout); } catch { j = { result: (r.stdout || r.stderr || '').slice(-400) }; }
      agent = { exit: r.error ? r.error.code || 'error' : r.signal || r.status, turns: j.num_turns ?? null, costUsd: j.total_cost_usd == null ? null : Math.round(j.total_cost_usd * 100) / 100, durationMs: j.duration_ms ?? null, result: String(j.result || '').slice(0, 300), session: j.session_id || null };
      // the agent's own transcript, read for a look at the answer
      const projects = path.join(os.homedir(), '.claude', 'projects'); // projects-path: Claude's own transcripts, not ours
      const tr = agent.session && fs.existsSync(projects) ? fs.readdirSync(projects).map((d) => path.join(projects, d, `${agent.session}.jsonl`)).find((f) => fs.existsSync(f)) : null;
      const transcript = tr ? fs.readFileSync(tr, 'utf8') : '';
      agent.contaminated = tr ? contamination(transcript.split('\n'), REPO, os.homedir()) : ['no transcript found to check'];
      // a rules run where the hook never spoke measured nothing about the rules (the first two did exactly that)
      agent.rulesFired = RULES === 'on' ? transcript.includes('First change in this area') : null;
      agent.opened = opened(transcript.split('\n'), briefFiles);
      const after = inputs(copy, gradingPaths(config), gradingOutputs(config));
      agent.tampered = changed(before, after);
    }

    // the grade, by the project's own gates, over the copy
    // a build that fails leaves the copy's old compiled output in place, which
    // would grade the original's styles: a failed build scores nothing
    const built = E.build ? sh(E.build, copy) : { status: 0 };
    const env = {};
    if (E.serve) {
      const port = await freePort();
      server = spawn(E.serve.replace('{port}', port), { cwd: copy, shell: true, stdio: 'ignore', detached: true });
      env.PARITY_HOST_BASE = `http://localhost:${port}`;
      let i = 0;
      while (i++ < 60 && !(await up(port))) await new Promise((r) => setTimeout(r, 250));
      if (!(await up(port))) throw new Error(`task ${t.id}: the server (\`${E.serve}\`) never answered on port ${port}`);
    }
    const p = sh(`node ${TOOLKIT}/tools/parity/run.mjs --repo . ${t.target}`, copy, env);
    const st = sh(`node ${TOOLKIT}/tools/css-lint/check.mjs --repo .`, copy);
    // a gate that crashed printed no count: not a clean sheet (styleCount), and an exit no count explains is named (score)
    const findings = styleCount(st.stdout, st.status);
    const parity = parseParity(p.stdout);
    const s = agent.contaminated && agent.contaminated.length ? { score: 0, green: false, why: `contaminated: ${agent.contaminated.join('; ')}` }
      : agent.tampered && agent.tampered.length ? { score: 0, green: false, why: `changed the grade's inputs: ${agent.tampered.join(', ')}` }
      : built.status === 0 ? score({ parity, styleFindings: findings, exits: { ...(NO_AGENT ? {} : { agent: agent.exit }), parity: p.status ?? p.signal, styles: st.status ?? st.signal } }) : { score: 0, green: false, why: `the build failed: ${((built.stderr || built.stdout || '').trim().split('\n').pop() || '').slice(0, 120)}` };
    record = { at: new Date().toISOString(), task: t.id, commit: execFileSync('git', ['-C', REPO, 'rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim(), toolkit: TOOLKIT_COMMIT,
      agent: !NO_AGENT, rules: NO_AGENT ? null : RULES, rulesFired: NO_AGENT ? null : agent.rulesFired, brief: NO_AGENT ? null : BRIEF || null, opened: agent.opened ?? null, ...s, matched: parity?.matched ?? 0, waived: parity?.waived ?? 0, didNot: parity?.didNot ?? 0, styleFindings: findings,
      turns: agent.turns, costUsd: agent.costUsd, minutes: Math.round((Date.now() - t0) / 6000) / 10, note: agent.result };
  } finally {
    if (server) try { process.kill(-server.pid); } catch { /* gone */ }
    if (!KEEP) fs.rmSync(copy, { recursive: true, force: true });
  }

  const file = path.join(REPO, E.results || 'tests/evals/results.jsonl');
  const lines = fs.existsSync(file) ? fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)) : [];
  const last = [...lines].reverse().find((l) => l.task === t.id && l.agent === record.agent && (!record.agent || comparable(l)) && (l.rules || 'off') === (record.rules || 'off') && (l.brief || null) === record.brief);
  if (record.agent) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.appendFileSync(file, JSON.stringify(record) + '\n'); }
  console.log(`${t.id}${record.agent ? ` (rules ${record.rules}${record.brief ? `, brief ${record.brief}, opened ${record.opened.join(' and ') || 'neither'}` : ''})` : ''}: score ${record.score}${record.green ? ' (green)' : ''} — ${record.matched} matched, ${record.didNot} did not, ${record.styleFindings ?? '?'} stylesheet finding(s)${record.why ? ` — ${record.why}` : ''}; ${record.turns ?? '-'} turns, ${record.costUsd ?? '-'} USD, ${record.minutes} min; ${compare(last, record)}${record.rules === 'on' && !record.rulesFired ? ' — WARNING: the rules hook never fired, so this is not a rules-on run' : ''}${KEEP ? ` — copy kept at ${copy}` : ''}`);
}
