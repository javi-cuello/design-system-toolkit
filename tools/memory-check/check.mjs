#!/usr/bin/env node
/*
 * tools/memory-check/check.mjs — every Claude Code memory folder held to toolkit-standard §D 25:
 * MEMORY.md an index of one line per file, within what Claude Code loads of it; one memory file per
 * project (the toolkit's own folder may keep topic files); each file's frontmatter, size and dated
 * headings. Prints one line per finding; exit 1 when any is an error. A stale dated section is a
 * warning: it is re-checked, not refused.
 *
 *   node tools/memory-check/check.mjs [--root <dir>] [--today YYYY-MM-DD]
 *
 * --root defaults to ~/.claude/projects (each <folder>/memory/ under it). The Stop hook calls
 * checkWritten() with the files a session wrote.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const LIMITS = JSON.parse(fs.readFileSync(path.join(HERE, 'limits.json'), 'utf8'));
export const ROOT = path.join(os.homedir(), '.claude', 'projects');
const ENTRY = /^- \[[^\]]+\]\(([^)]+)\) — \S/;

/* Claude Code names a project's folder by its path with every character but a letter or digit made "-". */
export const folderName = (dir) => dir.replace(/[^A-Za-z0-9]/g, '-');
/* The toolkit's own folder: its main checkout's, so a worktree of it names the same one. */
function toolkitFolder() {
  try {
    const common = execFileSync('git', ['-C', HERE, 'rev-parse', '--path-format=absolute', '--git-common-dir'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    return folderName(fs.realpathSync(path.dirname(common)));
  } catch { return folderName(path.resolve(HERE, '../..')); }
}

function frontmatter(text) {
  const m = /^---\n([\s\S]*?)\n---\n/.exec(text);
  if (!m) return null;
  const get = (k) => { const r = new RegExp(`^[ \\t]*${k}:[ \\t]*(.*)$`, 'm').exec(m[1]); return r ? r[1].trim() : ''; };
  return { name: get('name'), description: get('description'), type: get('type') };
}

/* One memory folder's findings: { folder, file, rule, level, message }. */
export function checkFolder(dir, { today = new Date(), multi = false } = {}) {
  const folder = path.basename(path.dirname(dir));
  const out = [];
  const add = (file, rule, message, level = 'error') => out.push({ folder, file, rule, level, message });
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md'));
  if (!files.length) return out;
  const topics = files.filter((f) => f !== 'MEMORY.md');
  const index = path.join(dir, 'MEMORY.md');
  if (!fs.existsSync(index)) { add('MEMORY.md', 'index', 'no MEMORY.md: the index Claude Code loads'); return out; }
  const text = fs.readFileSync(index, 'utf8');
  const lines = text.split('\n');
  if (lines.length > LIMITS.indexLines) add('MEMORY.md', 'index', `${lines.length} lines: Claude Code loads the first ${LIMITS.indexLines}`);
  if (Buffer.byteLength(text) > LIMITS.indexBytes) add('MEMORY.md', 'index', `${Buffer.byteLength(text)} bytes: Claude Code loads the first ${LIMITS.indexBytes}`);
  for (const l of lines.filter((l) => /^\s*[-*] /.test(l) && !ENTRY.test(l))) add('MEMORY.md', 'index', `not "- [Title](file.md) — what it holds": ${l.slice(0, 60)}`);
  const linked = lines.map((l) => ENTRY.exec(l)).filter(Boolean).map((m) => m[1]);
  for (const f of linked.filter((f) => !fs.existsSync(path.join(dir, f)))) add('MEMORY.md', 'index', `links ${f}, which does not exist`);
  for (const f of topics.filter((f) => !linked.includes(f))) add(f, 'index', 'not linked from MEMORY.md');
  if (topics.length > 1 && !multi) add('MEMORY.md', 'one-file', `${topics.length} memory files (${topics.join(', ')}): a project keeps one`);
  for (const f of topics) {
    const body = fs.readFileSync(path.join(dir, f), 'utf8');
    const fm = frontmatter(body);
    if (!fm) add(f, 'frontmatter', 'no frontmatter (name, description, metadata.type)');
    else {
      if (fm.name !== f.replace(/\.md$/, '')) add(f, 'frontmatter', `name "${fm.name}" is not the file's name`);
      if (!fm.description) add(f, 'frontmatter', 'no description');
      if (!LIMITS.types.includes(fm.type)) add(f, 'frontmatter', `type "${fm.type}" is not one of ${LIMITS.types.join(', ')}`);
    }
    if (Buffer.byteLength(body) > LIMITS.fileBytes) add(f, 'size', `${Buffer.byteLength(body)} bytes, over ${LIMITS.fileBytes}: move what has another home there`);
    for (const h of body.split('\n').filter((l) => /^#+ /.test(l) && /\bas of\b/i.test(l))) {
      const d = /\(as of (\d{4}-\d{2}-\d{2})\)/.exec(h);
      if (!d) { add(f, 'dated', `"${h.slice(0, 60)}": a date is written "(as of YYYY-MM-DD)"`); continue; }
      const age = Math.floor((today - new Date(`${d[1]}T00:00:00`)) / 864e5);
      if (age > LIMITS.staleDays) add(f, 'stale', `"${h.replace(/^#+ /, '').slice(0, 50)}" is ${age} days old: re-check it`, 'warning');
    }
  }
  return out;
}

const isMulti = (dir, own) => path.basename(path.dirname(dir)) === own;

export function checkAll(root = ROOT, opts = {}) {
  if (!fs.existsSync(root)) return [];
  const own = toolkitFolder();
  return fs.readdirSync(root).map((f) => path.join(root, f, 'memory'))
    .filter((d) => fs.existsSync(d) && fs.statSync(d).isDirectory())
    .flatMap((d) => checkFolder(d, { ...opts, multi: isMulti(d, own) }));
}

/* For the Stop hook: the errors, not yet put to the session, in the memory folders holding a file it wrote; or null. */
export function checkWritten(files, { root = ROOT, seen = new Set() } = {}) {
  const dirs = [...new Set(files.filter((f) => f.startsWith(root + path.sep) && f.endsWith('.md') && path.basename(path.dirname(f)) === 'memory').map((f) => path.dirname(f)))];
  if (!dirs.length) return null;
  const own = toolkitFolder();
  const found = dirs.flatMap((d) => (fs.existsSync(d) ? checkFolder(d, { multi: isMulti(d, own) }) : []))
    .filter((x) => x.level === 'error').map((x) => ({ ...x, key: `memory:${x.folder}:${x.file}:${x.rule}:${x.message}` }))
    .filter((x) => !seen.has(x.key));
  if (!found.length) return null;
  return { reason: `A memory file you wrote breaks toolkit-standard §D 25 (node ${path.join(HERE, 'check.mjs')}):\n${found.map((x) => `  ${x.folder}/memory/${x.file}: ${x.message}`).join('\n')}`, keys: found.map((x) => x.key) };
}

if (process.argv[1] && fs.realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const argv = process.argv.slice(2);
  const arg = (k) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : null; };
  const today = arg('--today') ? new Date(`${arg('--today')}T00:00:00`) : new Date();
  const found = checkAll(arg('--root') || ROOT, { today });
  for (const x of found) console.log(`${x.level === 'error' ? 'RED ' : 'warn'} ${x.folder}/memory/${x.file} [${x.rule}] ${x.message}`);
  const errors = found.filter((x) => x.level === 'error').length;
  console.log(errors ? `memory: ${errors} finding(s)` : `memory: green${found.length ? ` (${found.length} warning(s))` : ''}`);
  process.exit(errors ? 1 : 0);
}
