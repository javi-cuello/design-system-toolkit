/*
 * tools/project-check/loop.mjs — the parts of toolkit-standard §D 13's loop a
 * script can hold, for any project: where a lesson went, which commits have
 * not said, and whether a push could move a rendered pixel.
 *
 *   where(text, toolkit)                    → null, or why the answer is not one
 *   undeclared(repo, range, exempt, toolkit) → [{ sha, subject, why }]
 *   trailerReport(bad, range)               → the gate's message, or null
 *   pages(text, toolkit)                    → null, or why a Knowledge: value is not one
 *   unread(repo, range, exempt, toolkit)     → [{ sha, subject, why }]: interface commits naming no pages
 *   knowledgeReport(bad, range)             → that gate's message, or null
 *   renderChanged(repo, base, renders)       → the first changed path a render follows, or null
 *
 * Every commit in a project says where what it taught went, as a git trailer:
 *
 *   Toolkit: standards/code-standard.md rule 64
 *   Toolkit: none — the copy of one job posting
 *
 * A path is a file in the toolkit (a standard, a skill, a tool), checked to
 * exist; `none` carries the
 * reason the change teaches nothing another project could use. A commit that
 * touches only the paths a project marks exempt (its content) says nothing.
 * Written 2026-10-03: the closing question asked this once a day and answered
 * "nothing" for a month while four lessons sat in two projects' stylesheets,
 * and the maintainer asked for the loop to be a gate, not a question.
 *
 * A commit that touches an interface file (tools/shared/knowledge.mjs `uiFile`)
 * also says which knowledge pages it was built from (toolkit-standard §D 21):
 *
 *   Knowledge: knowledge/ui/patterns/dialogs.md, knowledge/ui/design/visual.md
 *   Knowledge: none — a colour token renamed, nothing drawn differently
 *
 * Added 2026-10-20, when a session built a whole screen without reading them.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { uiFile } from '../shared/knowledge.mjs';

const git = (repo, args) => execFileSync('git', ['-C', repo, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });

// undefined when the value is not a "none"; else null, or why its reason is too thin
function thinNone(t) {
  const none = t.match(/^none\b\s*[—:-]?\s*(.*)$/i);
  if (!none) return undefined;
  return none[1].split(/\s+/).filter(Boolean).length >= 3 ? null : `"${t}": a "none" says why in three words or more`;
}

export function where(text, toolkit) {
  const t = String(text || '').trim();
  if (!t) return 'empty: name the toolkit file the lesson went to, or "none — <why nothing here helps another project>"';
  const none = thinNone(t);
  if (none !== undefined) return none;
  const file = t.split(/\s+/)[0].replace(/[#:,;].*$/, '');
  const at = path.resolve(toolkit, file), rel = path.relative(toolkit, at);
  // a file, inside the toolkit, and not git's own: `.`, `..`, `tools` and `.git/HEAD` all exist and name nothing
  const isFile = (() => { try { return fs.statSync(at).isFile(); } catch { return false; } })();
  if (!rel || rel.startsWith('..') || path.isAbsolute(rel) || /^\.git(\/|$)/.test(rel) || !isFile) return `"${t}": ${file} is not a file in the toolkit`;
  return null;
}

const SEP = '\u0001';
/* Why a commit has no trailer of this key: a line that names it but sits
   above the message's last paragraph, which git does not read as a trailer
   (a push refused for it, 2026-10-25). */
const missing = (repo, sha, key) => new RegExp(`^${key}:`, 'm').test(git(repo, ['log', '-1', '--format=%B', sha]))
  ? `has a ${key}: line git does not read as a trailer — trailers are the message's last paragraph, so join it to the Co-Authored-By block`
  : null;
export function undeclared(repo, range, exempt = [], toolkit) {
  const out = [];
  let log;
  try { log = git(repo, ['log', '--no-merges', `--format=%H${SEP}%s${SEP}%(trailers:key=Toolkit,valueonly,separator=%x02)${SEP}`, range]); } catch {
    // a push whose remote moved (another machine, a content autocommit) names a base this clone lacks
    const base = range.split('..')[0];
    let unseen = /^[0-9a-f]{40}$/.test(base);
    if (unseen) try { git(repo, ['cat-file', '-e', `${base}^{commit}`]); unseen = false; } catch { /* not here */ }
    return [{ sha: '', subject: '', why: unseen ? `cannot read ${range}: the remote has commits this clone has not seen — fetch and rebase, then push` : `cannot read ${range}` }];
  }
  for (const rec of log.split(`${SEP}\n`).filter((r) => r.trim())) {
    const [sha, subject, trailers] = rec.replace(/^\n/, '').split(SEP);
    const files = git(repo, ['diff-tree', '--no-commit-id', '--name-only', '-r', '--root', sha]).split('\n').filter(Boolean);
    if (files.length && files.every((f) => exempt.some((e) => f.startsWith(e)))) continue;
    const values = (trailers || '').split('\u0002').map((v) => v.trim()).filter(Boolean);
    if (!values.length) { out.push({ sha: sha.slice(0, 10), subject, why: missing(repo, sha, 'Toolkit') || 'no Toolkit: trailer' }); continue; }
    for (const v of values) { const bad = where(v, toolkit); if (bad) out.push({ sha: sha.slice(0, 10), subject, why: bad }); }
  }
  return out;
}

/* What the gate prints: the commits and how to fix them, or, for a range it
   could not read, that alone — a trailer is not what is missing there. */
export function trailerReport(bad, range) {
  if (!bad.length) return null;
  if (!bad[0].sha) return bad[0].why;
  return `${bad.length} commit(s) in ${range}:\n${bad.map((b) => `  ${b.sha} ${b.subject.slice(0, 60)} — ${b.why}`).join('\n')}\n  add a trailer: "Toolkit: <toolkit file>" or "Toolkit: none — <why>" (git commit --amend, or rebase -x for several)`;
}

/* A Knowledge: value: "none — <why>", or knowledge pages, each a file under
   the toolkit's knowledge/, separated by commas or spaces. A section named
   after a page in brackets — "forms.md (Keeping input)" — is a note, not a
   page (a push refused for it, 2026-10-20). */
export function pages(text, toolkit) {
  const t = String(text || '').trim();
  if (!t) return 'empty: name the knowledge pages the work followed, or "none — <why no page bears on it>"';
  const none = thinNone(t);
  if (none !== undefined) return none;
  const kb = path.join(toolkit, 'knowledge');
  for (const p of t.replace(/\([^)]*\)/g, ' ').split(/[\s,;]+/).filter(Boolean)) {
    const at = path.resolve(toolkit, p.replace(/^~\/Projects\/toolkit\//, '').replace(/#.*$/, ''));
    const isFile = (() => { try { return fs.statSync(at).isFile(); } catch { return false; } })();
    if (!at.startsWith(kb + path.sep) || !isFile) return `"${t}": ${p} is not a page in the toolkit's knowledge/`;
  }
  return null;
}

/* Every commit in the range that touches an interface file outside `exempt`
   and does not name the knowledge pages it followed. */
export function unread(repo, range, exempt = [], toolkit) {
  const out = [];
  let log;
  try { log = git(repo, ['log', '--no-merges', `--format=%H${SEP}%s${SEP}%(trailers:key=Knowledge,valueonly,separator=%x02)${SEP}`, range]); } catch { return [{ sha: '', subject: '', why: `cannot read ${range}` }]; }
  for (const rec of log.split(`${SEP}\n`).filter((r) => r.trim())) {
    const [sha, subject, trailers] = rec.replace(/^\n/, '').split(SEP);
    const files = git(repo, ['diff-tree', '--no-commit-id', '--name-only', '-r', '--root', sha]).split('\n').filter(Boolean);
    if (!files.some((f) => uiFile(f) && !exempt.some((e) => f.startsWith(e)))) continue;
    const values = (trailers || '').split('\u0002').map((v) => v.trim()).filter(Boolean);
    if (!values.length) { out.push({ sha: sha.slice(0, 10), subject, why: missing(repo, sha, 'Knowledge') || 'touches interface files and has no Knowledge: trailer' }); continue; }
    for (const v of values) { const bad = pages(v, toolkit); if (bad) out.push({ sha: sha.slice(0, 10), subject, why: bad }); }
  }
  return out;
}

export function knowledgeReport(bad, range) {
  if (!bad.length) return null;
  if (!bad[0].sha) return bad[0].why;
  return `${bad.length} commit(s) in ${range}:\n${bad.map((b) => `  ${b.sha} ${b.subject.slice(0, 60)} — ${b.why}`).join('\n')}\n  add a trailer: "Knowledge: <knowledge page>[, <page>…]" or "Knowledge: none — <why>" (git commit --amend, or rebase -x for several)`;
}

export function renderChanged(repo, base, renders = []) {
  if (!base || !renders.length) return '(no base to compare against)';
  let files;
  try { files = git(repo, ['diff', '--name-only', base, 'HEAD']).split('\n').filter(Boolean); } catch { return `(cannot compare ${base} with HEAD)`; }
  return files.find((f) => renders.some((r) => f.startsWith(r))) || null;
}

/* code-standard 49: a check's verdict is its own. A check piped into a pager
   or a filter exits with the last command's status, so a red run reports
   success to the shell, the hook and CI. Named: a line that runs a check and
   pipes it on, in a script that has no `pipefail` and does not read
   PIPESTATUS. A check captured whole with `$(…)` and its `$?` read is fine. */
const CHECK = /(bin\/(check|parity|test)\b|tools\/[\w/-]+\/(check|run|pages)\.mjs|\b(npm|pnpm|yarn) (run )?test\b|phpunit|pytest)/;
export function pipedVerdicts(source) {
  const lines = source.split('\n').map((l) => l.replace(/(^|\s)#.*$/, ''));
  // read with comments gone: "# never use set -o pipefail" exempts nothing
  if (/set -[a-z]*o pipefail|PIPESTATUS/.test(lines.join('\n'))) return [];
  const out = [];
  lines.forEach((code, i) => {
    // each pipe judged by the command it ends: from the last ; && || $( or ` before it
    for (const m of code.matchAll(/(?<!\|)\|(?!\|)/g)) {
      // `{ check; } 2>&1 | tee` and `( check ) | tail`: a group is one command, so its own
      // separators are not where the piped command starts (a `$( … )` capture still is)
      const before = code.slice(0, m.index).replace(/\{[^{}]*\}|(?<!\$)\([^()]*\)/g, (g) => g.replace(/[;&|]/g, ' '));
      const command = before.split(/;|&&|\|\||\$\(|`/).pop();
      if (CHECK.test(command)) { out.push(`${i + 1}  ${code.trim().slice(0, 80)}`); break; }
    }
  });
  return out;
}
