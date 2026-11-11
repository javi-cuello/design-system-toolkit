#!/usr/bin/env node
// figma-feedback: the open feedback threads in a Figma file, read at the start
// of a prototype run (SKILL.md, *A Figma prototype*, step 0).
//
//   node skills/frontend-build/scripts/figma-feedback.mjs <fileKey>
//   node skills/frontend-build/scripts/figma-feedback.mjs <fileKey> --reply <commentId> <message>
//
// Prints JSON: [{ id, node, offset, by, at, text, thread: [{ by, at, text }] }], one
// per open thread. A thread is open while it is unresolved and its last
// message is a person's. Claude posts under the token owner's account, so its
// messages are told apart by their first line, `From Claude:`; a Claude reply
// is what marks a thread handled, since the API cannot resolve one, and a
// person replying after it, while unresolved, opens the thread again. `node` is the layer the
// thread is pinned to (client_meta.node_id), null for one pinned to the canvas;
// `offset` is where in that node the pin sits (client_meta.node_offset): a pin
// on a whole frame names its layer only through it. `--reply` posts a reply,
// which must open with `From Claude:`, as the agent's own Figma account where
// one is set up (its key at ~/.config/keys/figma-claude, `bin/set-key
// figma-claude`), so the file's people are notified and see who wrote it; else
// with the token below, never a bridge's own (one held a revoked token,
// 2026-11-11). Figma's API cannot resolve a thread: a person does.
// The token: tools/snapshot/version.cjs `tokenFor` (bin/set-key figma).
import { readFileSync, realpathSync } from 'node:fs';
import { homedir } from 'node:os';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

export const CLAUDE = /^From Claude:/;

export function openThreads(comments) {
  const byRoot = new Map();
  for (const c of comments || []) if (!c.parent_id) byRoot.set(c.id, { root: c, replies: [] });
  for (const c of comments || []) if (c.parent_id && byRoot.has(c.parent_id)) byRoot.get(c.parent_id).replies.push(c);
  const out = [];
  for (const { root, replies } of byRoot.values()) {
    if (root.resolved_at) continue;
    const all = [root, ...replies.sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at))];
    const last = all[all.length - 1];
    if (CLAUDE.test(String(last.message || '').trim())) continue;
    const msg = (c) => ({ by: (c.user && c.user.handle) || null, at: c.created_at, text: c.message });
    const meta = root.client_meta || {};
    out.push({ id: root.id, node: meta.node_id || null, offset: meta.node_offset || null, ...msg(root), thread: replies.map(msg) });
  }
  return out.sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
}

if (process.argv[1] && (() => { try { return realpathSync(process.argv[1]); } catch { return null; } })() === fileURLToPath(import.meta.url)) {
  const [key, flag, parent, message, ...extra] = process.argv.slice(2);
  const usage = 'usage: figma-feedback.mjs <fileKey> [--reply <commentId> <message>]';
  if (!/^[A-Za-z0-9]{10,}$/.test(key || '')) { console.error(usage); process.exit(2); }
  if (extra.length || (flag && (flag !== '--reply' || !/^\d+$/.test(parent || '') || !CLAUDE.test(String(message || '').trim())))) { console.error(usage + '; a reply opens with "From Claude:"'); process.exit(2); }
  const { tokenFor } = createRequire(import.meta.url)('../../../tools/snapshot/version.cjs');
  const own = (() => { try { return readFileSync(`${homedir()}/.config/keys/figma-claude`, 'utf8').trim(); } catch { return ''; } })();
  const token = (flag && own) || tokenFor();
  if (!token) { console.error('figma-feedback: no Figma token (bin/set-key figma)'); process.exit(2); }
  const url = `https://api.figma.com/v1/files/${key}/comments`;
  const r = flag
    ? await fetch(url, { method: 'POST', headers: { 'X-Figma-Token': token, 'Content-Type': 'application/json' }, body: JSON.stringify({ message, comment_id: parent }), signal: AbortSignal.timeout(30000) })
    : await fetch(url, { headers: { 'X-Figma-Token': token }, signal: AbortSignal.timeout(30000) });
  if (!r.ok) { console.error(`figma-feedback: ${r.status} ${(await r.text()).slice(0, 200)} (${flag && own ? 'a 403 or 404 is the figma-claude account without access to the file, or its key without file_comments:write' : `a 403 is a token without file_comments:${flag ? 'write' : 'read'}`})`); process.exit(1); }
  const body = await r.json();
  console.log(flag ? `replied ${body.id}` : JSON.stringify(openThreads(body.comments), null, 2));
}
