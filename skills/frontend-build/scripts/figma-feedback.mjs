#!/usr/bin/env node
// figma-feedback: the open feedback threads in a Figma file, read at the start
// of a prototype run (SKILL.md, *A Figma prototype*, step 0).
//
//   node skills/frontend-build/scripts/figma-feedback.mjs <fileKey>
//
// Prints JSON: [{ id, node, by, at, text, thread: [{ by, at, text }] }], one
// per open thread. A thread is open while it is unresolved and its last
// message is a person's. Claude posts under the token owner's account, so its
// messages are told apart by their first line, `From Claude:`; a Claude reply
// is what marks a thread handled, since the API cannot resolve one, and a
// person replying after it, while unresolved, opens the thread again. `node` is the layer the
// thread is pinned to (client_meta.node_id), null for one pinned to the canvas.
// The token: tools/snapshot/version.cjs `tokenFor` (bin/set-key figma).
import { realpathSync } from 'node:fs';
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
    out.push({ id: root.id, node: (root.client_meta && root.client_meta.node_id) || null, ...msg(root), thread: replies.map(msg) });
  }
  return out.sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
}

if (process.argv[1] && (() => { try { return realpathSync(process.argv[1]); } catch { return null; } })() === fileURLToPath(import.meta.url)) {
  const key = process.argv[2];
  if (!/^[A-Za-z0-9]{10,}$/.test(key || '')) { console.error('usage: figma-feedback.mjs <fileKey>'); process.exit(2); }
  const { tokenFor } = createRequire(import.meta.url)('../../../tools/snapshot/version.cjs');
  const token = tokenFor();
  if (!token) { console.error('figma-feedback: no Figma token (bin/set-key figma)'); process.exit(2); }
  const r = await fetch(`https://api.figma.com/v1/files/${key}/comments`, { headers: { 'X-Figma-Token': token }, signal: AbortSignal.timeout(30000) });
  if (!r.ok) { console.error(`figma-feedback: ${r.status} ${(await r.text()).slice(0, 200)} (a 403 is a token without file_comments:read)`); process.exit(1); }
  console.log(JSON.stringify(openThreads((await r.json()).comments), null, 2));
}
