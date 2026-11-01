#!/usr/bin/env node
/*
 * The closing pass, run (toolkit-standard §D 13, CLAUDE.md step 4): what can
 * be computed, computed, and what only a person can answer, asked.
 *
 *   node tools/toolkit-check/closing.mjs [--brief]   (bin/closing; --brief: the open items alone, for the session hooks)
 *   node tools/toolkit-check/closing.mjs --judgement <standard>… [--prompt <file>]   the judgement rules of those
 *     standards, by handle and title; with --prompt, only those whose *Reviewed:* names that file
 *
 * Written on 2026-10-03 after the session that wrote three of the closing
 * items skipped two of them the same day — "check what users see" and
 * "finished means shipped" — because the pass was prose in a file and the
 * session was executing a list of the maintainer's messages. A principle
 * without a trigger does not run (toolkit-standard §D 0); this is the trigger.
 *
 * Over the toolkit and every registered project repo on this machine:
 *   - uncommitted and unpushed work (finished means shipped), and what blocks a push
 *   - the user-facing files changed since the upstream — templates, styles,
 *     fonts, scripts — so the pages they draw are looked at before they ship
 *   - the parity run's time against its accepted time (§D 0's third question)
 *   - the rulings and deviating comments new since the last accepted run (§D 8)
 *   - cases changed since the upstream that were traced, not executed
 *   - the judgement rules (*Reviewed:*) of every standard the change touches,
 *     by handle: a rule no script checks is read here, or nowhere
 * Then the questions of §D 0 and the toolkit question, which no script answers.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { rulesOf } from './rules.mjs';
import { areas } from '../claude-hooks/standards-read.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const TOOLKIT = path.resolve(HERE, '../..');
const gitRaw = (repo, args) => { try { return execFileSync('git', ['-C', repo, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }); } catch { return ''; } };
const git = (repo, args) => { try { return execFileSync('git', ['-C', repo, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch { return ''; } };

/* The files a reader of the product sees drawn: templates, snippets, styles,
   fonts, client scripts — by shape, so a third project's tree fits. */
export const USER_FACING = /\.(php|html|tsx|jsx|vue|svelte|astro|s[ac]ss|css|woff2?|ttf|otf)$|(^|\/)(templates|snippets|components|layouts|pages|public|fonts)\//;
const NOT_FACING = /(^|\/)(tests?|__tests__|stories|node_modules|vendor|kirby|measured|snapshot)\/|\.(test|stories|spec)\.|\/content\//;
export const facing = (files) => files.filter((f) => USER_FACING.test(f) && !NOT_FACING.test(f));

export function repoState(repo) {
  // porcelain lines start with a status column that may be a space: split before trimming
  const dirty = gitRaw(repo, ['status', '--porcelain']).split('\n').filter((l) => l.trim() && !/ content\//.test(l));
  const upstream = git(repo, ['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}']);
  const unpushed = upstream ? git(repo, ['log', '--oneline', `${upstream}..HEAD`]).split('\n').filter(Boolean) : [];
  const changed = upstream ? git(repo, ['diff', '--name-only', `${upstream}...HEAD`]).split('\n').filter(Boolean) : [];
  return { dirty, upstream, unpushed, changed, facing: facing(changed) };
}

/* A project's parity facts, read the way the engine reads them: the time of
   its last run against the accepted one, and the rulings new since. */
async function parity(repo) {
  const cfg = path.join(repo, 'snapshot.config.json');
  if (!fs.existsSync(cfg)) return null;
  const P = JSON.parse(fs.readFileSync(cfg, 'utf8')).parity;
  if (!P || !P.baseline) return null;
  const dir = path.join(repo, P.baseline.dir);
  const read = (f) => (fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : null);
  const out = { time: null, lessons: null };
  const { slower } = await import('../parity/timing.mjs');
  const now = read(path.join(dir, 'timing.json')), kept = read(path.join(dir, 'accepted', 'timing.json'));
  // only a full run is held to the accepted one; a scoped run's time says its scope
  if (now && kept) out.time = { now: now.total, scope: now.scope, kept: now.scope === kept.scope ? kept.total : null, warning: slower(kept, now) };
  else if (now) out.time = { now: now.total, scope: now.scope, kept: null, warning: null };
  const index = read(path.join(dir, 'accepted', 'lessons.json'));
  if (index) {
    try {
      const { loadProject } = await import('../parity/project.mjs');
      const { lessons, deviations } = await import('../parity/lessons.mjs');
      const project = await loadProject(repo);
      const declared = [];
      for (const t of project.targets) for (const table of [t.mapping.waivers, t.mapping.appWaivers, ...[...t.variants.values()].map((r) => r.own)]) for (const [key, waiver] of Object.entries(table || {})) declared.push({ target: t.name, key, waiver });
      out.lessons = lessons([...declared, ...deviations(repo, P.stylesheets || [])], index, []);
    } catch (e) { out.lessons = { error: e.message }; }
  }
  return out;
}

/* Files deleted since the upstream that a tracked file still names — a CI
   workflow, a doc, a comment. Project C's CI ran two PHP gates for a push
   after they moved to the toolkit, and failed (2026-10-03): the docs had been
   searched, the workflow had not. */
export function stillNamed(repo, upstream) {
  if (!upstream) return [];
  const gone = gitRaw(repo, ['diff', '--name-only', '--diff-filter=D', `${upstream}...HEAD`]).split('\n').filter(Boolean);
  /* A file is searched for by its name, unless other tracked files share it
     (every screen folder holds a figma.json): then by its folder, which is
     what a reference names — "design/screens/2-1-list" — and the whole folder
     is reported once. Searching "figma.json" named every deleted screen as
     still referenced everywhere (2026-10-13). */
  const tracked = gitRaw(repo, ['ls-files']).split('\n').filter(Boolean);
  const shared = (name) => tracked.some((t) => path.basename(t) === name);
  const out = [], said = new Set();
  for (const f of gone) {
    // a shared name (README.md) is searched by its folder, unless the folder lives on: then by the file's own path
    // (a folder named everywhere would flag every mention; code joining the folder to the name is not seen)
    const lives = tracked.some((t) => t.startsWith(path.dirname(f) + '/'));
    const needle = shared(path.basename(f)) ? (lives ? f : path.dirname(f)) : path.basename(f);
    if (needle === '.' || said.has(needle)) continue;
    said.add(needle);
    const hits = gitRaw(repo, ['grep', '-l', '-F', needle, '--', '.', ':!content', ':!*.lock', ':!**/CHANGELOG.md']).split('\n').filter(Boolean).filter((h) => !/changes\.json$/.test(h));
    if (hits.length) out.push(`${needle === path.dirname(f) ? needle + '/' : f} is deleted and still named in ${hits.slice(0, 3).join(', ')}${hits.length > 3 ? ' …' : ''}`);
  }
  return out;
}

/* The plugins whose files changed: §B's unscripted rules are checked by hand. */
export const pluginsChanged = (changed) => [...new Set(changed.map((f) => (f.match(/^plugins\/([^/]+)\//) || [])[1]).filter((p) => p && p !== '_shared'))];

/* Cases changed since the upstream that say they were traced or not walked:
   a claim proven only on paper is open until it has met a real project. */
export function tracedCases(repo, changed) {
  const out = [];
  for (const f of changed.filter((x) => /tests\/cases\.md$/.test(x))) {
    const p = path.join(repo, f);
    if (!fs.existsSync(p)) continue;
    const diff = git(repo, ['diff', '@{u}...HEAD', '--', f]);
    for (const l of diff.split('\n')) if (/^\+.*(\*traced\*|NOT walked|not walked|Read by:)/i.test(l)) out.push(`${f}: ${l.slice(1).trim().slice(0, 100)}`);
  }
  return out;
}

/* The closing questions, read from toolkit-standard §D 0, which owns them: one list,
   so the pass and the standard cannot drift apart. */
export function questions(toolkit = TOOLKIT) {
  const md = fs.readFileSync(path.join(toolkit, 'standards', 'toolkit-standard.md'), 'utf8');
  const d0 = md.slice(md.indexOf('### 0 · '), md.indexOf('### 1 · '));
  return [...d0.matchAll(/^\d+\. ([\s\S]*?)(?=^\d+\. |^\S|\n\n)/gm)].map((m) => m[1].replace(/\*\*/g, '').replace(/\s+/g, ' ').trim());
}

/* The judgement rules of the named standards: every rule whose marker is
   *Reviewed:*, by handle. No script checks these, so this list is the moment
   they are read (toolkit-standard §C clause D). */
export function judgement(names, toolkit = TOOLKIT, prompt = null) {
  return names.map((n) => {
    const file = path.join(toolkit, 'standards', n + '.md');
    const rules = fs.existsSync(file) ? rulesOf(n, fs.readFileSync(file, 'utf8')) || [] : [];
    // A standard with parts says which: skill-standard's clause B and its §B 3 are different rules.
    const reviewed = (r) => { const m = r.block.match(/\*Reviewed:\*[^\n]*/g) || []; return m.length && (!prompt || m.some((x) => x.includes('`' + prompt + '`'))); };
    return [n, rules.filter((r) => reviewed(r) && !/Retired/.test(r.title))
      .map((r) => { const p = (r.part.match(/^Part ([A-Z])\b/) || [])[1]; return p ? `§${p} ${r.handle}` : r.handle; })];
  }).filter(([, hs]) => hs.length);
}
/* The standards a change touches: each changed file's area, a changed standard
   itself. A context document records design conventions, so it reads
   figma-standard's (the edit hook's area). */
export function touched(repo, changed, projectRepos = [], toolkit = TOOLKIT) {
  const out = new Set();
  for (const f of changed) {
    const m = f.match(/^standards\/([a-z]+-standard)\.md$/);
    if (repo === toolkit && m) out.add(m[1]);
    for (const a of areas(path.join(repo, f), toolkit, projectRepos)) out.add(a.standard.replace(/\.md$/, ''));
  }
  return [...out].sort();
}

/* The cadence (toolkit-standard §D 11): whether the periodic independent
   review is owed. A review is a commit whose `Review:` trailer names it
   independent and names review.md, the list it read against; nothing else is
   recorded. A change's own review carries a `Review:` trailer too, and once
   closed the owed review in silence; one calling itself independent did so
   again (2026-10-31), so the list's name is what tells them apart. */
export const REVIEW_DAYS = 14;
export function cadence(repo, now = Date.now()) {
  const out = [];
  const last = git(repo, ['log', '-1', '--format=%cI', '-i', '--grep=^Review:.*independent.*review\\.md']);
  const days = last ? (now - Date.parse(last)) / 864e5 : Infinity;
  if (days > REVIEW_DAYS) out.push(`an independent review is owed (last ${last ? last.slice(0, 10) : 'never'}; every ${REVIEW_DAYS} days, §D 11): fresh agents read the toolkit end to end against tools/toolkit-check/review.md; the commit closing it carries a Review: trailer naming it independent and naming review.md`);
  return out;
}

/* The repo's open security alerts (Dependabot), read through gh: nineteen sat unread for a day because nothing
   here said them (2026-11-01). gh absent, signed out or offline is said as not read, never as none. `ask` is the
   gh call, given by the test. */
export function alerts(repo, ask = (args) => execFileSync('gh', args, { cwd: repo, encoding: 'utf8', timeout: 5000, stdio: ['ignore', 'pipe', 'pipe'] })) {
  let rows;
  try { rows = ask(['api', '--paginate', 'repos/{owner}/{repo}/dependabot/alerts?state=open&per_page=100', '--jq', '.[] | .security_advisory.severity']).split('\n').filter(Boolean); }
  catch (e) { return { unread: String((e && (e.stderr || e.message)) || e).trim().split('\n')[0].slice(0, 120) }; }
  const by = {};
  for (const sev of rows) by[sev] = (by[sev] || 0) + 1;
  return { open: rows.length, by };
}

if ((process.argv[1] && fs.realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) && process.argv.includes('--judgement')) {
  const args = process.argv.slice(process.argv.indexOf('--judgement') + 1);
  const pi = args.indexOf('--prompt'), prompt = pi >= 0 ? args[pi + 1] : null;
  const names = args.filter((a, i) => !a.startsWith('--') && !(pi >= 0 && i === pi + 1));
  const found = judgement(names, TOOLKIT, prompt);
  // Nothing listed is never "no rules": a misspelt standard or prompt would read as a clean list.
  if (!found.length) { console.error(`no judgement rules for ${names.join(', ') || '(no standard named)'}${prompt ? ` whose *Reviewed:* names ${prompt}` : ''}; check the names`); process.exit(1); }
  for (const [n] of found) {
    const file = path.join(TOOLKIT, 'standards', n + '.md');
    const rules = rulesOf(n, fs.readFileSync(file, 'utf8')) || [];
    const shown = new Set(judgement([n], TOOLKIT, prompt)[0][1]);
    console.log(`judgement rules — ${n}:`);
    for (const r of rules) { const p = (r.part.match(/^Part ([A-Z])\b/) || [])[1]; const h = p ? `§${p} ${r.handle}` : r.handle;
      if (shown.has(h)) console.log(`  ${h} · ${(r.title.match(/\*\*(.+?)\*\*/) || [, r.title.replace(/^(?:### )?\S+ [·—] /, '')])[1].replace(/`/g, '')}`); }
  }
  process.exit(0);
}
if ((process.argv[1] && fs.realpathSync(process.argv[1]) === fileURLToPath(import.meta.url))) {
  const contract = createRequire(import.meta.url)('../snapshot/projects.cjs');
  const repos = [['toolkit', TOOLKIT]];
  for (const r of contract.repos()) if (fs.existsSync(r.dir)) repos.push([r.name, r.dir]);
  let open = 0;
  const BRIEF = process.argv.includes('--brief');
  let where = '';
  const say = (l) => { if (!BRIEF) console.log(l); else if (/^\n?\S/.test(l) && !/^\nwhat no script/.test(l)) where = l.trim(); };
  const flag = (l) => { open++; console.log(BRIEF ? `${where.split(' — ')[0]}: ${l}` : `  ! ${l}`); };
  for (const [name, repo] of repos) {
    say(`\n${name} — ${repo}`);
    const s = repoState(repo);
    if (s.dirty.length) flag(`${s.dirty.length} uncommitted: ${s.dirty.slice(0, 5).map((l) => l.slice(3)).join(', ')}${s.dirty.length > 5 ? ' …' : ''}`);
    if (!s.upstream) flag('no upstream branch: nothing here is shipped');
    else if (s.unpushed.length) flag(`${s.unpushed.length} unpushed commit(s) — finished means shipped; if a push is blocked, say what unblocks it`);
    if (s.facing.length) flag(`${s.facing.length} user-facing file(s) changed since ${s.upstream || 'nothing'}: look at the pages they draw before they ship — ${s.facing.slice(0, 6).join(', ')}${s.facing.length > 6 ? ' …' : ''}`);
    // a skill changed: did it make the agent better or worse? (§D 13; each task costs real tokens, so asked, not run)
    if (name === 'toolkit' && s.changed.some((f) => /^skills\//.test(f))) flag(`skills changed since ${s.upstream}: run tools/skill-evals over each project (about $0.6 a task) and compare with the last line of its results`);
    // a plugin changed: skill-standard §B 3, 5–7 and 9–13 are its conformance checklist's to check
    for (const pl of pluginsChanged(s.changed)) flag(`plugin ${pl} changed: run figma-plugin-creator's conformance checklist on it (skill-standard §B)`);
    for (const l of stillNamed(repo, s.upstream)) flag(l);
    // The judgement rules of what changed, said by handle: read each against the change.
    // What this repo will ship (changed since the upstream), never another session's uncommitted files.
    for (const [n, hs] of judgement(touched(repo, s.changed, repos.slice(1).map(([, r]) => r)))) flag(`judgement rules to read against this change — ${n}: ${hs.join(', ')}`);
    const traced = tracedCases(repo, s.changed);
    for (const t of traced) flag(`a case proven on paper only: ${t}`);
    // a project with no code repo registered (a library only) has no gates to plan
    if (name !== 'toolkit' && contract.projects().list.some((p) => p.name === name && p.repo)) {
      // a toolkit gate this project cannot run (tools/project-check/check.mjs --plan)
      const plan = spawnSync('node', [path.join(TOOLKIT, 'tools/project-check/check.mjs'), '--repo', repo, '--plan'], { encoding: 'utf8' });
      // a plan that did not finish (a bad config, a crash) is a finding, never a quiet "nothing"
      if (!/^toolkit gates:/m.test(plan.stdout || '')) flag(`toolkit gates could not be planned: ${((plan.stderr || plan.stdout || '').trim().split('\n').pop() || `exit ${plan.status}`).slice(0, 160)}`);
      for (const l of (plan.stdout || '').split('\n').filter((x) => (/RED/.test(x) && !/^toolkit gates:/.test(x)) || /check\.without names/.test(x))) flag(`toolkit gate: ${l.replace(/\s{2,}/g, ' — ')}`);
      const p = await parity(repo);
      if (p && p.time) {
        if (p.time.warning) flag(`parity run: ${p.time.warning}`);
        else say(`  parity run ${(p.time.now / 1000).toFixed(1)}s${p.time.kept ? ` against the accepted ${(p.time.kept / 1000).toFixed(1)}s` : p.time.scope && p.time.scope !== 'all' ? ` (scoped to ${p.time.scope}; the full run is what the accepted time holds)` : ' (nothing accepted yet)'}`);
      }
      if (p && p.lessons && !p.lessons.error) {
        if (p.lessons.length) flag(`${p.lessons.length} ruling(s) or deviating comment(s) new since the last accepted run — project fact or toolkit lesson, decided in that change (§D 8): ${p.lessons.slice(0, 4).map((l) => `${l.target}: ${l.key}`).join('; ')}${p.lessons.length > 4 ? ' …' : ''}`);
        else say('  no ruling new since the last accepted run');
      } else if (p && p.lessons && p.lessons.error) say(`  (the parity facts could not be read: ${p.lessons.error.split('\n')[0]})`);
    }
    if (name === 'toolkit') for (const l of cadence(repo)) flag(l);
    // not on the Stop hook's brief pass, which has 20 s and runs every turn: a network call there can cost 5 of them
    if (name === 'toolkit' && !BRIEF) {
      const a = alerts(repo);
      if (a.unread) say(`  (security alerts not read: ${a.unread})`);
      else if (a.open) flag(`${a.open} open security alert(s) (${Object.entries(a.by).map(([k, n]) => `${n} ${k}`).join(', ')}): update the lockfile that pins each (gh api repos/{owner}/{repo}/dependabot/alerts)`);
    }
    if (!s.dirty.length && s.upstream && !s.unpushed.length && !s.facing.length && !traced.length) say('  clean, shipped');
  }
  say(`\nwhat no script answers (toolkit-standard §D 0):\n${questions().map((q, i) => `  ${i + 1}. ${q}`).join('\n')}`);
  if (BRIEF) { if (!open) console.log('nothing the script can see is open'); process.exit(0); }
  say(`\n${open ? `${open} item(s) to close or name before saying done` : 'nothing the script can see is open'}`);
  process.exit(0);
}
