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
 * means the Read tool with no offset and no limit short of the page's end, or
 * a `cat` of it: a section read by line range, a grep or a heading list has
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

/* whether one tool call read the page from its first line to its last */
function readWhole(call, page, file) {
  const input = call.input || {};
  if (call.name === 'Read' && typeof input.file_path === 'string' && input.file_path.endsWith('/' + page)) {
    return !(input.offset > 1) && !(input.limit < lines(file));
  }
  if (call.name === 'Bash' && typeof input.command === 'string') {
    return input.command.split(/[;&|]+/).some((part) => new RegExp(`^\\s*cat\\s+(\\S*/)?${page.replace(/[.]/g, '\\.')}\\s*$`).test(part));
  }
  return false;
}

export function unread(command, transcript, toolkit) {
  const pages = trailerPages(command);
  if (!pages.length) return [];
  let text = '';
  try { text = fs.readFileSync(transcript, 'utf8'); } catch { return pages; }
  const done = new Set();
  for (const line of text.split('\n')) {
    if (!line.includes('"tool_use"') || !pages.some((p) => line.includes(p))) continue;
    let row; try { row = JSON.parse(line); } catch { continue; }
    for (const c of (row.message && row.message.content) || []) {
      if (c.type !== 'tool_use') continue;
      for (const p of pages) if (!done.has(p) && readWhole(c, p, path.join(toolkit, p))) done.add(p);
    }
  }
  return pages.filter((p) => !done.has(p));
}
