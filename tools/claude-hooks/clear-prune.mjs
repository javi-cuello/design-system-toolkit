/*
 * tools/claude-hooks/clear-prune.mjs — one session per name across /clear.
 *
 * /clear starts a new session file that keeps the old one's name, so a project's
 * one main session (the maintainer's rule) showed up six times in the picker
 * (2026-11-28). The new transcript's `derived-from` record names the session it
 * was cleared from; when that session carries the same name, its folder
 * (subagents, tool results) and then its transcript go to the Trash, so the
 * picker lists one session per name. The project's memory/ folder is never
 * touched: only a uuid's own file and folder move. A session with no name, or
 * another name, is left alone. It runs in every project the hooks are installed
 * for, as the duplicates do.
 *
 * Once a session: a marker in the state folder ends it, so a later prompt never
 * rereads a large transcript, and a session restored from the Trash by hand
 * stays restored. A parent still open in another terminal that writes again
 * leaves an untitled stub behind: not handled. TOOLKIT_TRASH moves the Trash (tests).
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { stateDir } from './state-dir.mjs';

const UUID = /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/;

// the start and the end of a file, enough for its first records and its latest title
function ends(file, size = 256 * 1024) {
  const fd = fs.openSync(file, 'r');
  try {
    const { size: n } = fs.fstatSync(fd);
    const read = (at, len) => { const b = Buffer.alloc(len); fs.readSync(fd, b, 0, len, at); return b.toString('utf8'); };
    return n <= 2 * size ? read(0, n) : read(0, size) + '\n' + read(n - size, size);
  } finally { fs.closeSync(fd); }
}

// the last record of a type in a JSONL text
function last(text, type) {
  let found = null;
  for (const line of text.split('\n')) {
    if (!line.includes(`"type":"${type}"`)) continue;
    try { const r = JSON.parse(line); if (r.type === type) found = r; } catch { /* a torn line */ }
  }
  return found;
}

/* Moves the session this one was cleared from to the Trash; returns where it went, or null. */
export function pruneParent(transcript) {
  if (!transcript) return null;
  const self = path.basename(transcript, '.jsonl');
  const marker = path.join(stateDir(), `toolkit-clear-${self}`);
  if (fs.existsSync(marker)) return null;
  let head;
  try { head = ends(transcript); } catch { return null; }
  const from = last(head, 'derived-from');
  // no record yet: tried again at the next prompt, unless the session is under way, which means it never comes
  if (!from) { if (head.includes('"type":"user"')) fs.writeFileSync(marker, ''); return null; }
  fs.writeFileSync(marker, '');
  const parent = from.sessions?.find((s) => s.via === 'clear')?.id;
  const title = last(head, 'custom-title')?.customTitle;
  if (!parent || !title || !UUID.test(parent) || parent === self) return null;
  const dir = path.dirname(transcript);
  const file = path.join(dir, `${parent}.jsonl`);
  let text;
  try { text = ends(file); } catch { return null; }
  if (last(text, 'custom-title')?.customTitle !== title) return null;
  const label = title.replace(/[^\w .-]/g, '').replace(/^\.+/, '').slice(0, 60);
  let trash = path.join(process.env.TOOLKIT_TRASH || path.join(os.homedir(), '.Trash'), `${label} ${parent}`.trim());
  if (fs.existsSync(trash)) trash += ` ${Date.now()}`; // an earlier copy in the Trash is never overwritten
  fs.mkdirSync(trash, { recursive: true });
  // the folder first: a failed move leaves the transcript, and the session in the picker, whole
  const folder = path.join(dir, parent);
  if (fs.existsSync(folder)) fs.renameSync(folder, path.join(trash, parent));
  fs.renameSync(file, path.join(trash, `${parent}.jsonl`));
  return trash;
}
