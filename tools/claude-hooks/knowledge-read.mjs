/*
 * tools/claude-hooks/knowledge-read.mjs — a commit's Knowledge: trailer names
 * pages the session has read, not pages it meant to read.
 *
 *   unread(command, transcript, toolkit) → the pages a `git commit` command's
 *                                          Knowledge: trailer names that the
 *                                          session never read whole; [] when
 *                                          the command is no such commit
 *
 * The `edit` hook (hooks.mjs) refuses the commit until each is read. Whole
 * means every line was shown: Read calls whose recorded ranges (each result
 * row's startLine and numLines) together reach from the first line to the
 * last, a long page being cut at the tool's cap and read on by offset; or a
 * `cat` of it, unpiped: a section read by line range, a grep or a heading list has
 * not walked the page, which is what toolkit-standard §D 21 asks.
 *
 * Written 2026-11-20, after a session built a project's first screens having
 * read three sections of two pages, named both in its trailer, and the push
 * check, which tests only that the trailer is there, let it through.
 *
 * Limits: a message given by -F <file> or typed in an editor is not seen; a
 * subagent's reads are in its own transcript and do not count; a cat whose
 * output the shell tool cut to a preview still counts as whole.
 */
import fs from 'node:fs';
import path from 'node:path';

const PAGE = /knowledge\/[\w./-]+?\.md/g;

/* the pages a commit command's Knowledge: trailer names; [] for "none — why" or no trailer */
export function trailerPages(command) {
  if (!/\bgit\b[^|;&]*\bcommit\b/.test(command || '')) return [];
  const pages = new Set();
  for (const m of command.matchAll(/^\s*Knowledge:(.*)$/gm)) for (const p of m[1].match(PAGE) || []) pages.add(p);
  return [...pages];
}

const lines = (file) => { try { const t = fs.readFileSync(file, 'utf8'); return t.split('\n').length - (t.endsWith('\n') ? 1 : 0); } catch { return Infinity; } };

/* A Read's lines are what its result row records it showed (toolUseResult.file: startLine, numLines, totalLines),
   not what it asked for: a long page is cut at the tool's size cap with no limit asked, and the rest is read by
   offset. A Read with no such record counts for nothing. A cat counts as the whole page when it is a command of
   its own, not piped into a head or a grep. */
const catOf = (command, page) => command.split(/;|&&|\|\|/).some((part) =>
  new RegExp(`^\\s*cat\\s+(\\S*/)?${page.replace(/[.]/g, '\\.')}\\s*$`).test(part));

/* whether the ranges cover lines 1 to n */
function covers(ranges, n) {
  let upTo = 0;
  for (const [a, b] of [...ranges].sort((x, y) => x[0] - y[0])) { if (a > upTo + 1) break; upTo = Math.max(upTo, b); }
  return upTo >= n;
}

export function unread(command, transcript, toolkit) {
  const pages = trailerPages(command);
  if (!pages.length) return [];
  let text = '';
  try { text = fs.readFileSync(transcript, 'utf8'); } catch { return pages; }
  const rows = [];
  for (const line of text.split('\n')) {
    // only rows naming a page are parsed: a Read's call and its result both carry the path, a cat's call too
    if (!pages.some((p) => line.includes(p))) continue;
    try { rows.push(JSON.parse(line)); } catch { /* a torn line */ }
  }
  const reads = new Map(); // tool_use id → the page it was a Read of
  const ranges = new Map(pages.map((p) => [p, []]));
  const total = new Map();
  for (const row of rows) for (const c of (row.message && Array.isArray(row.message.content) && row.message.content) || []) {
    if (c.type !== 'tool_use' || !c.input) continue;
    for (const p of pages) {
      if (c.name === 'Read' && typeof c.input.file_path === 'string' && c.input.file_path.endsWith('/' + p)) reads.set(c.id, p);
      if (c.name === 'Bash' && typeof c.input.command === 'string' && catOf(c.input.command, p)) ranges.get(p).push([1, Infinity]);
    }
  }
  for (const row of rows) {
    const f = row.toolUseResult && row.toolUseResult.file;
    const id = ((row.message && Array.isArray(row.message.content) && row.message.content) || []).find((c) => c.type === 'tool_result')?.tool_use_id;
    const p = id && reads.get(id);
    if (!p || !f || !(f.numLines > 0)) continue;
    ranges.get(p).push([f.startLine || 1, (f.startLine || 1) + f.numLines - 1]);
    if (f.totalLines > 0) total.set(p, f.totalLines);
  }
  const done = new Set(pages.filter((p) => covers(ranges.get(p), total.get(p) ?? lines(path.join(toolkit, p)))));
  return pages.filter((p) => !done.has(p));
}
