/*
 * tools/claude-hooks/validate-turn.mjs — the system's own checker at the end
 * of a turn, not only at the push. In a registered project that states
 * `check.validate` and has a built docs site, the code files this session
 * wrote and has not committed, in validate's scope (validate.mjs `inScope`),
 * go through tools/system-mcp/validate.mjs; findings the project's §6 rulings
 * do not waive come back as the reason a Stop is blocked, once.
 *
 * Why at Stop: the push gate catches a raw element or a hard-coded value a
 * day later, after the session that wrote it has gone; the MCP's `validate`
 * tool is one the agent may skip ("a guardrail the agent never calls",
 * knowledge/code/agent-prototyping.md). Written 2026-11-09.
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync, execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { inScope, unwaived } from '../system-mcp/validate.mjs';
import { realPath } from '../shared/real-path.mjs';

const TOOLKIT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const req = createRequire(import.meta.url);

/* The written files that sit in a repo and differ from its HEAD, repo-relative:
   committed work is no longer the turn's to fix. */
export function uncommittedIn(dir, files) {
  const rel = files.map((f) => path.relative(dir, f)).filter((f) => f && !f.startsWith('..') && !path.isAbsolute(f));
  if (!rel.length) return [];
  let out = '';
  try { out = execFileSync('git', ['--literal-pathspecs', '-C', dir, 'status', '--porcelain', '-z', '--untracked-files=all', '--', ...rel], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }); } catch { return []; }
  return out.split('\0').filter(Boolean).map((l) => l.slice(3)).filter((f) => rel.includes(f));
}

/* `{ reason, keys }` when the turn's code has findings not yet put to the session, or null. `own` is the
   session's written files (stop-items.mjs ownFiles), absolute. */
// a project with no config, or one that will not parse, is skipped: never repoConfig, which exits 2, and a Stop hook's exit 2 blocks every stop
const readConfig = (repo) => req('../shared/repo-config.cjs').readRepoConfig(repo).config || {};
// `seen`: finding keys already put to this session, so each blocks once, not every turn until it is committed;
// `budget`: milliseconds for every project's run together, inside the Stop hook's 30 s
export function validateTurn(own, { projects = req('../snapshot/projects.cjs'), repoConfig = readConfig, seen = new Set(), budget = 12000 } = {}) {
  if (!own || !own.size) return null;
  const files = [...own].map((f) => realPath(f));
  const said = [], keys = [];
  const until = Date.now() + budget;
  for (const { name, dir } of projects.repos()) {
    const repo = realPath(dir);
    const V = ((repoConfig(repo) || {}).check || {}).validate;
    if (!V || !V.system) continue;
    const mine = uncommittedIn(repo, files.filter((f) => f.startsWith(repo + path.sep))).filter((f) => inScope(f, V) && fs.existsSync(path.join(repo, f)));
    if (!mine.length) continue;
    const where = projects.layout(null, name);
    if (!where.site || !fs.existsSync(path.join(where.site, 'api/index.json'))) continue;
    const left = until - Date.now();
    if (left < 500) break;
    const r = spawnSync(process.execPath, [path.join(TOOLKIT, 'tools/system-mcp/validate.mjs'), ...mine.map((f) => path.join(repo, f)), '--api', path.join(where.site, 'api'), '--json', ...(V.from || []).flatMap((f) => ['--from', f])], { encoding: 'utf8', maxBuffer: 1 << 28, timeout: left });
    // a checker that failed or ran out of time is not a finding: the push gate reads the same files
    let found;
    try { found = JSON.parse(r.stdout); } catch { continue; }
    if (!Array.isArray(found)) continue;
    const rel = (f) => path.relative(repo, f.file);
    const open = unwaived(found, projects.rulings(where.doc || ''), rel).filter((f) => !seen.has(`${name}|${rel(f)}|${f.kind}|${f.found}`));
    for (const f of open) keys.push(`${name}|${rel(f)}|${f.kind}|${f.found}`);
    if (open.length) said.push(`${name}: ${open.length} finding(s) in code this turn wrote\n${open.map((f) => `  ${rel(f)}:${f.line}  ${f.kind}: ${f.found}${f.use ? `  → ${f.use}` : ''}`).join('\n')}`);
  }
  if (!said.length) return null;
  return { keys, reason: `The system's checker (tools/system-mcp/validate.mjs) read the code this turn wrote, as the push will:\n${said.join('\n')}\nFix each in the code; one that must stay is waived by a §6 ruling scoped \`validate\` naming its file and what was found.` };
}
