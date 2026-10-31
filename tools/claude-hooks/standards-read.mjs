/*
 * tools/claude-hooks/standards-read.mjs — the rules that govern what a session is
 * about to change, retrieved at that moment. The `edit` hook (hooks.mjs) stops
 * the first change a session makes in an area once, hands it that area's rule
 * list (titles and section numbers), and lets the next attempt through.
 *
 * Written 2026-10-03, when CLAUDE.md stopped restating the standards and
 * pointed at them: the maintainer agreed on condition that the standards be
 * read, not remembered. Retrieval at the moment of need, not a whole document
 * loaded every session — a cited study found always-loaded rule files cost
 * more without helping more — and `tools/skill-evals` measures whether it helps.
 */
import fs from 'node:fs';
import path from 'node:path';
import { rulesOf } from '../toolkit-check/rules.mjs';
import os from 'node:os';
import { UI, uiFile, pagesFor } from '../shared/knowledge.mjs';
import { expandHome } from '../shared/real-path.mjs';

/* The area a file sits in: which standard governs it and which part of it.
   null when no standard does (a scratch folder, a project's content). */
/* A path as the filesystem resolves it, for a file that may not exist yet:
   macOS's /var is /private/var, so an eval copy registered by one spelling and
   edited by the other matched nothing, and the first runs with the hook on
   ran without it (2026-10-03). */
export function real(p) {
  let head = path.resolve(p), tail = '';
  while (!fs.existsSync(head) && path.dirname(head) !== head) { tail = path.join(path.basename(head), tail); head = path.dirname(head); }
  try { return path.join(fs.realpathSync(head), tail); } catch { return path.resolve(p); }
}

export function area(file, toolkit, projectRepos) {
  // an isolated agent's worktree is the main repo's path under another name
  const f = real(file).replace(/\/\.claude\/worktrees\/[^/]+(?=\/|$)/, '');
  toolkit = real(toolkit);
  projectRepos = projectRepos.map(real);
  // a context document records a project's design and naming conventions, wherever its home is
  if (/(^|\/)figma-design-system\/design-system-context\.md$/.test(f)) return { standard: 'figma-standard.md', part: '*' };
  if (f === toolkit || f.startsWith(toolkit + path.sep)) {
    const rel = path.relative(toolkit, f);
    if (/^(\.claude|node_modules)(\/|$)/.test(rel)) return null;
    if (/^(tools\/snapshot|plugins\/design-system-snapshot)(\/|$)/.test(rel)) return { standard: 'snapshot-standard.md', part: '*' };
    // a context document records a project's design and naming conventions
    if (/^projects\/[^/]+\/design-system-context\.md$/.test(rel)) return { standard: 'figma-standard.md', part: '*' };
    if (/^skills\//.test(rel)) return { standard: 'skill-standard.md', part: 'Part A' };
    if (/^plugins\//.test(rel)) return { standard: 'skill-standard.md', part: 'Part B' };
    if (/^standards\//.test(rel)) return { standard: 'toolkit-standard.md', part: 'Part C' };
    return { standard: 'toolkit-standard.md', part: 'Part D' };
  }
  for (const repo of projectRepos) {
    if (f !== repo && !f.startsWith(repo + path.sep)) continue;
    const rel = path.relative(repo, f);
    if (/^(content|node_modules|\.claude)(\/|$)/.test(rel)) return null;
    if (/(^|\/)(parity\.mjs|[^/]+\.stories\.\w+)$|^tests\/parity\//.test(rel)) return { standard: 'code-standard.md', part: ['Design-to-code'] };
    if (/\.(s[ac]ss|css)$/.test(rel)) return { standard: 'code-standard.md', part: ['Components', 'Tokens and literals'] };
    if (/\.(php|html|[jt]sx?|mjs|vue|svelte|astro)$/.test(rel)) return { standard: 'code-standard.md', part: ['Structure', 'Accessibility', 'Progressive enhancement'] };
    return { standard: 'code-standard.md', part: ['Cleanliness and simplicity'] };
  }
  return null;
}
/* Every area a file sits in. An interface file answers to design-standard as
   well as to the standard that governs its code (added 2026-10-11, when the
   docs site's design rulings had no standard to land in); the docs site's own
   interface files answer to code-standard too, as any project's do. */
// A project's plain .js may or may not draw; it is left to code-standard alone,
// a gap accepted rather than guessed. The docs site's .js all draw the site.
export function areas(file, toolkit, projectRepos) {
  const a = area(file, toolkit, projectRepos);
  if (!a) return [];
  const rel = path.relative(real(toolkit), real(file).replace(/\/\.claude\/worktrees\/[^/]+(?=\/|$)/, ''));
  const docs = /^tools\/docs-site\/src\//.test(rel) && (UI.test(rel) || /\.m?js$/.test(rel));
  const plugin = /^plugins\/[^/]+\/ui\.html$/.test(rel);
  const ui = docs || plugin || (a.standard === 'code-standard.md' && uiFile(file));
  const out = [a];
  if (docs) out.push({ standard: 'code-standard.md', part: /\.(s[ac]ss|css)$/.test(rel) ? ['Components', 'Tokens and literals'] : ['Structure', 'Accessibility', 'Progressive enhancement'] });
  if (ui) out.push({ standard: 'design-standard.md', part: '*' });
  return out;
}
/* The knowledge pages an interface file is built from (§D 21): none for a file
   design-standard does not govern. */
export function knowledge(file, toolkit, projectRepos) {
  if (!areas(file, toolkit, projectRepos).some((a) => a.standard === 'design-standard.md')) return [];
  const f = real(file).replace(/\/\.claude\/worktrees\/[^/]+(?=\/|$)/, '');
  const root = [toolkit, ...projectRepos].map(real).find((r) => f.startsWith(r + path.sep));
  return root ? pagesFor(path.relative(root, f)) : [];
}
export const areaKey = (a) => `${a.standard}:${[].concat(a.part).join('+')}`;

/* The files a tool call would change: an edit's own file, or, for a shell
   command that writes, every path it names — absolute, or relative to its
   folder or the one it cds into — or that folder when it names none. A command
   that only reads changes nothing. A relative word counts as a path when it
   exists, has an extension, or starts ./ or ../ (a sed expression is none). */
// read off the command with its quoted strings emptied: a `>` in a commit message is not a redirect
const WRITES = /(^|[\s;&|])(bin\/check\b(?![^;&|]*--no-fix)|check-standards\.mjs\s+--fix|rsync\b|prettier\b[^;&|]*--write|git\s+(restore|reset)\b|sed\s+-i|perl\s+-pi|python3?\b|node\s+-e|tee\b|cp\b|mv\b|rm\b|touch\b|mkdir\b|ln\b|unzip\b|curl\b[^|;&]*\s(-\w*o|--output)\b|npm\s+run\b|pnpm\b|yarn\b|git\s+(rm|mv|apply|checkout)\b)|(^|[^&>])\d?>>?\s*(?!\/dev\/null)[^&\s]|&>>?\s*(?!\/dev\/null)\S/;
export function targets(tool, input, cwd) {
  if (['Edit', 'Write', 'MultiEdit', 'NotebookEdit'].includes(tool)) return input.file_path || input.notebook_path ? [input.file_path || input.notebook_path] : [];
  if (tool !== 'Bash') return [];
  const cmd = String(input.command || '');
  const home = expandHome;
  const cd = cmd.match(/^\s*cd\s+([^\s;&|]+)\s*&&/);
  const base = cd ? path.resolve(cwd, home(cd[1])) : cwd;
  const rest = cmd.slice(cd ? cd[0].length : 0);
  // a commit message names files it does not write, heredoc and all
  if (/^\s*git\s+commit\b/.test(rest)) return [];
  // a shell run with -c keeps its command in quotes, which the test below empties
  const inner = [...rest.matchAll(/\b(?:ba|z)?sh\s+-c\s+(['"])([\s\S]*?)\1/g)].map((m) => m[2]).join('\n');
  if (!WRITES.test(rest.replace(/'[^']*'|"[^"]*"/g, "''")) && !WRITES.test(inner) && !/<<-?\s*['"]?\w+/.test(rest)) return [];
  // unzip writes where -d says, or here; ln writes only its last operand
  const unzip = rest.match(/^\s*unzip\b.*?\s-d\s+([^\s;&|]+)/);
  if (/^\s*unzip\b/.test(rest)) return [unzip ? path.resolve(base, home(unzip[1])) : path.join(base, '.')];
  const named = [];
  for (const [, w] of rest.matchAll(/(?:^|[\s'"=(<>])([^\s'";|&()<>]+)/g)) {
    if (/^[~/]/.test(w)) { named.push(home(w)); continue; }
    if (w.startsWith('-') || w.includes('://') || !w.includes('/') && !/^\.\.?$/.test(w)) continue;
    const p = path.resolve(base, w);
    if (/^\.\.?\//.test(w) || /\/[^/]+\.\w+$/.test(w) || fs.existsSync(p)) named.push(p);
  }
  if (/^\s*ln\b/.test(rest)) named.splice(0, named.length - 1);
  return named.length ? [...new Set(named)] : [path.join(base, '.')];
}

/* The area's rule list, read from the standard as it stands now: the titles
   and their numbers, nothing else. */
export function ruleIndex(toolkit, a) {
  // history lives in standards/changelog/, so the file is all rules
  const name = a.standard.replace(/\.md$/, '');
  const rules = rulesOf(name, fs.readFileSync(path.join(toolkit, 'standards', a.standard), 'utf8')) || [];
  const parts = [].concat(a.part);
  // a part is `*` (all), a `## ` heading, or `Part X` for a standard with parts
  return rules.filter((r) => parts.includes('*') || parts.some((p) => r.part === p || r.part.startsWith(p + ' ')))
    .map((r) => { const h = r.title.match(/^(?:### |\*\*)?([A-Z]|\d+)(?:\.| [—·])\s*/); const bold = r.title.match(/\*\*(.+?)\*\*/); return `${r.handle} · ${(bold ? bold[1] : r.title.slice(h ? h[0].length : 0)).replace(/`/g, '').replace(/^\d+ · /, '')}`; });
}

/* The hooks' per-session files (toolkit-rules-*, toolkit-stop-*) older than
   a week, for the session start to sweep: nothing else ever removed them. */
export function stale(dir = os.tmpdir(), days = 7) {
  const cut = Date.now() - days * 864e5;
  return fs.readdirSync(dir).filter((n) => /^toolkit-(rules|stop)-/.test(n)).map((n) => path.join(dir, n))
    .filter((f) => { try { return fs.statSync(f).mtimeMs < cut; } catch { return false; } });
}
