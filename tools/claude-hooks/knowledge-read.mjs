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
 * means every line was shown: Read calls whose ranges together reach from the
 * first line to the last (a long page is cut at the tool's cap and read on by
 * offset; the cut is read from the result), or a `cat` of it: a section read by line range, a grep or a heading list has
 * not walked the page, which is what toolkit-standard §D 21 asks.
 *
 * Written 2026-11-20, after a session built a project's first screens having
 * read three sections of two pages, named both in its trailer, and the push
 * check, which tests only that the trailer is there, let it through.
 *
 * Limits: a message given by -F <file> or typed in an editor is not seen; a
 * subagent's reads are in its own transcript and do not count.
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

const lines = (file) => { try { return fs.readFileSync(file, 'utf8').split('\n').length; } catch { return Infinity; } };

/* The lines one tool call read of the page, as [first, last], or null. A Read shows from its offset (1 when
   absent) for its limit, and to the end without one, unless its result says it stopped short ("PARTIAL view …
   showing lines a-b"): a long page is cut at the tool's size cap, and the rest is read by offset. A cat reads it all. */
function linesRead(call, page, result) {
  const input = call.input || {};
  if (call.name === 'Read' && typeof input.file_path === 'string' && input.file_path.endsWith('/' + page)) {
    const first = input.offset > 1 ? input.offset : 1;
    let last = input.limit > 0 ? first + input.limit - 1 : Infinity;
    const cut = /showing lines (\d+)-(\d+) of \d+/.exec(result || '');
    if (cut) last = Math.min(last, Number(cut[2]));
    return [first, last];
  }
  if (call.name === 'Bash' && typeof input.command === 'string'
    && input.command.split(/[;&|]+/).some((part) => new RegExp(`^\\s*cat\\s+(\\S*/)?${page.replace(/[.]/g, '\\.')}\\s*$`).test(part))) return [1, Infinity];
  return null;
}

/* whether the ranges cover lines 1 to n */
function covers(ranges, n) {
  let upTo = 0;
  for (const [a, b] of [...ranges].sort((x, y) => x[0] - y[0])) { if (a > upTo + 1) break; upTo = Math.max(upTo, b); }
  return upTo >= n;
}

const resultText = (c) => (typeof c.content === 'string' ? c.content : (c.content || []).map((x) => x.text || '').join('\n'));

export function unread(command, transcript, toolkit) {
  const pages = trailerPages(command);
  if (!pages.length) return [];
  let text = '';
  try { text = fs.readFileSync(transcript, 'utf8'); } catch { return pages; }
  const rows = [];
  for (const line of text.split('\n')) {
    // a call naming a page, or a result naming one (a cut Read's notice names its file); nothing else is parsed
    if (!pages.some((p) => line.includes(p)) || !(line.includes('"tool_use"') || line.includes('"tool_result"'))) continue;
    try { rows.push(JSON.parse(line)); } catch { /* a torn line */ }
  }
  const results = new Map();
  for (const row of rows) for (const c of (row.message && row.message.content) || []) if (c.type === 'tool_result') results.set(c.tool_use_id, resultText(c));
  const ranges = new Map(pages.map((p) => [p, []]));
  for (const row of rows) for (const c of (row.message && row.message.content) || []) {
    if (c.type !== 'tool_use') continue;
    for (const p of pages) { const r = linesRead(c, p, results.get(c.id)); if (r) ranges.get(p).push(r); }
  }
  const done = new Set(pages.filter((p) => covers(ranges.get(p), lines(path.join(toolkit, p)))));
  return pages.filter((p) => !done.has(p));
}
