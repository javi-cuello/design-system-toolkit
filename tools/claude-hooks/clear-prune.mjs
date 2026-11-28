/*
 * tools/claude-hooks/clear-prune.mjs — one session per name across /clear.
 *
 * /clear starts a new session file that keeps the old one's name, so a project's
 * one main session (the maintainer's rule) showed up six times in the picker
 * (2026-11-28). The new transcript's `derived-from` record names the session it
 * was cleared from; when that session carries the same name, its transcript and
 * its folder (subagents, tool results) go to the Trash, so the picker lists one
 * session per name and a mistake is still recoverable. A session with no name,
 * or another name, is left alone. TOOLKIT_TRASH moves the Trash (tests).
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

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
  let head;
  try { head = fs.readFileSync(transcript, 'utf8'); } catch { return null; }
  const parent = last(head, 'derived-from')?.sessions?.find((s) => s.via === 'clear')?.id;
  const title = last(head, 'custom-title')?.customTitle;
  if (!parent || !title || !/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/.test(parent)) return null;
  const file = path.join(path.dirname(transcript), `${parent}.jsonl`);
  let text;
  try { text = fs.readFileSync(file, 'utf8'); } catch { return null; }
  if (last(text, 'custom-title')?.customTitle !== title) return null;
  const trash = path.join(process.env.TOOLKIT_TRASH || path.join(os.homedir(), '.Trash'), `${title} ${parent}`);
  fs.mkdirSync(trash, { recursive: true });
  fs.renameSync(file, path.join(trash, `${parent}.jsonl`));
  const folder = path.join(path.dirname(transcript), parent);
  if (fs.existsSync(folder)) fs.renameSync(folder, path.join(trash, parent));
  return trash;
}
