#!/usr/bin/env node
// figma-feedback: the open feedback threads in a Figma file, read at the start
// of a prototype run (SKILL.md, *A Figma prototype*, step 0).
//
//   node skills/frontend-build/scripts/figma-feedback.mjs <fileKey>
//   node skills/frontend-build/scripts/figma-feedback.mjs <fileKey> --reply <commentId> <message>
//   node skills/frontend-build/scripts/figma-feedback.mjs <fileKey> --on <nodeId> <message>
//
// Prints JSON: [{ id, node, offset, by, at, text, thread: [{ by, at, text }] }], one
// per open thread. A thread is open while it is unresolved and its last
// message is a person's. Claude's messages are those by the agent's own Figma
// account (its key at ~/.config/keys/figma-claude, `bin/set-key figma-claude`,
// with file_comments:read and :write and current_user:read),
// and those whose first line is `From Claude:`, the mark it uses when it posts
// under the maintainer's token for want of that account. A Claude reply is
// what marks a thread handled, since the API cannot resolve one; a person
// replying after it, while unresolved, opens the thread again. `node` is the
// layer the thread is pinned to (client_meta.node_id), null for one pinned to
// the canvas; `offset` is where in that node the pin sits
// (client_meta.node_offset): a pin on a whole frame names its layer only
// through it. `--reply` answers a thread and `--on` comments on a layer, as the
// agent's account, so the file's people are notified and see who wrote it;
// without one, with the token below and `From Claude:` put first. Never a
// bridge's own comment tool (one held a revoked token, 2026-11-11).
// The token: tools/snapshot/version.cjs `tokenFor` (bin/set-key figma).
import { readFileSync, realpathSync } from 'node:fs';
import { homedir } from 'node:os';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

export const CLAUDE = /^From Claude:/;

export function openThreads(comments, agent = null) {
  const claudes = (c) => (agent && c.user && c.user.id === agent) || CLAUDE.test(String(c.message || '').trim());
  const byRoot = new Map();
  for (const c of comments || []) if (!c.parent_id) byRoot.set(c.id, { root: c, replies: [] });
  for (const c of comments || []) if (c.parent_id && byRoot.has(c.parent_id)) byRoot.get(c.parent_id).replies.push(c);
  const out = [];
  for (const { root, replies } of byRoot.values()) {
    if (root.resolved_at) continue;
    const all = [root, ...replies.sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at))];
    const last = all[all.length - 1];
    if (claudes(last)) continue;
    const msg = (c) => ({ by: (c.user && c.user.handle) || null, at: c.created_at, text: c.message });
    const meta = root.client_meta || {};
    out.push({ id: root.id, node: meta.node_id || null, offset: meta.node_offset || null, ...msg(root), thread: replies.map(msg) });
  }
  return out.sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
}

if (process.argv[1] && (() => { try { return realpathSync(process.argv[1]); } catch { return null; } })() === fileURLToPath(import.meta.url)) {
  const [key, flag, target, text, ...extra] = process.argv.slice(2);
  const usage = 'usage: figma-feedback.mjs <fileKey> [--reply <commentId> | --on <nodeId>] <message>';
  const post = flag === '--reply' ? /^\d+$/ : flag === '--on' ? /^I?\d+:\d+(;\d+:\d+)*$/ : null;
  if (!/^[A-Za-z0-9]{10,}$/.test(key || '') || extra.length || (flag && (!post || !post.test(target || '') || !String(text || '').trim()))) { console.error(usage); process.exit(2); }
  const { tokenFor } = createRequire(import.meta.url)('../../../tools/snapshot/version.cjs');
  const own = (() => { try { return readFileSync(`${homedir()}/.config/keys/figma-claude`, 'utf8').trim(); } catch { return ''; } })();
  const token = tokenFor();
  if (!token && !own) { console.error('figma-feedback: no Figma token (bin/set-key figma)'); process.exit(2); }
  const call = async (path, as, init = {}, soft = false) => {
    const r = await fetch(`https://api.figma.com/v1/${path}`, { ...init, headers: { 'X-Figma-Token': as, 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(30000) }).catch((e) => { if (soft) return null; throw e; });
    if (!r || (!r.ok && soft)) return null;
    if (!r.ok) {
      const hint = as === own ? 'a 403 or 404 is the figma-claude account without access to the file, or its key without file_comments scopes' : 'a 403 is a token without file_comments scopes';
      console.error(`figma-feedback: ${r.status} ${(await r.text()).slice(0, 200)} (${hint})`); process.exit(1);
    }
    return r.json();
  };
  if (flag) {
    const message = own || CLAUDE.test(text.trim()) ? text : `From Claude:\n${text}`;
    const body = flag === '--reply' ? { message, comment_id: target } : { message, client_meta: { node_id: target, node_offset: { x: 0, y: 0 } } };
    const made = await call(`files/${key}/comments`, own || token, { method: 'POST', body: JSON.stringify(body) });
    console.log(`posted ${made.id}`);
  } else {
    // the agent's id needs current_user:read on its key; without it, its unmarked replies read as open, never as handled
    const me = own ? await call('me', own, {}, true) : null;
    if (own && !me) console.error('figma-feedback: the figma-claude key lacks current_user:read, so the agent\'s replies are not recognised; make its token with that scope');
    const agent = me ? me.id : null;
    console.log(JSON.stringify(openThreads((await call(`files/${key}/comments`, token || own)).comments, agent), null, 2));
  }
}
