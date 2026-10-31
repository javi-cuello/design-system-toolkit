/*
 * The point a Figma file was last deliberately released, so a snapshot can be
 * pinned to it:
 *
 *   published — a library: its last publish. A publish stamps updated_at on
 *               every published component and style, and the newest is it.
 *   named     — a design file: its latest named version ("Save to version
 *               history" with a label; autosaves have none).
 *
 * Every keystroke touches a file, so neither reads last_touched_at. Answers
 * { id, label, at, editedSince } or null — editedSince is the newest autosave
 * after the release, null when the file has not moved since. Needs a token
 * with library_content:read and file_versions:read.
 *
 * Lifted from one project's ops/figma/version.js: nothing in it was that
 * project's, and the other project recorded `version: null` for want of it.
 */
const { execSync } = require('child_process');

/* Every read is bounded: with none, a Figma that took the connection and never
   answered held the snapshot, and every delivery queued behind it, for as long
   as the socket lived. `fetch` is read at call time, so a test stands in for Figma. */
const API = 'https://api.figma.com';
const TIMEOUT = 30000;
async function get(p, token, timeout = TIMEOUT) {
  const r = await globalThis.fetch(p.startsWith(`${API}/`) ? p : API + p, { headers: { 'X-Figma-Token': token }, signal: AbortSignal.timeout(timeout) })
    .catch((e) => { throw late(e, timeout); });
  // the body is read under the same limit, and running out there is not "not JSON"
  try { return await r.json(); } catch (e) { throw ['TimeoutError', 'AbortError'].includes(e.name) ? late(e, timeout) : new Error('not JSON'); }
}
function late(e, timeout) {
  return new Error(['TimeoutError', 'AbortError'].includes(e.name) ? `Figma did not answer within ${timeout / 1000}s` : e.message);
}

/* A named version can sit behind any number of autosaves: reading the first
   page alone (30 versions) called a file with a named version 31 saves back
   unreleased. Pages are followed until one is found, to a bound. */
const PAGES = 20;
async function released(fileKey, mode, token, { timeout = TIMEOUT } = {}) {
  let versions = await get(`/v1/files/${fileKey}/versions?page_size=50`, token, timeout);
  // Figma reports an error as `err`, not `message`: a rate limit read as "no
  // versions" and sent a reader looking for the wrong thing.
  // A 404 is also what Figma answers a token whose account cannot open the file:
  // a project's libraries read "Not found" while they plainly existed (2026-10-30).
  if (versions.status === 404) throw new Error("Not found — a wrong key, or the token's Figma account cannot open the file (bin/set-key figma, or `figmaToken` in snapshot.config.json)");
  if (!versions.versions) throw new Error(versions.err || versions.message || 'no versions');
  const latest = versions.versions[0] ? versions.versions[0].created_at : null;
  const editedSince = (at) => (latest && at && latest > at ? latest : null);
  if (mode === 'named') {
    for (let page = 1; ; page++) {
      const v = versions.versions.find((x) => x.label && x.label.trim() !== '');
      if (v) return { id: v.id, label: v.label, at: v.created_at, editedSince: editedSince(v.created_at) };
      const next = versions.pagination && versions.pagination.next_page;
      // the token goes to Figma only
      if (!next || page >= PAGES || !String(next).startsWith(`${API}/`)) return null;
      versions = await get(String(next), token, timeout);
      if (!versions.versions) throw new Error(versions.err || versions.message || 'no versions');
    }
  }
  const [c, s] = await Promise.all([get(`/v1/files/${fileKey}/components`, token, timeout), get(`/v1/files/${fileKey}/styles`, token, timeout)]);
  if (!c.meta || !s.meta) throw new Error(c.message || s.message || 'no published content');
  const at = [...c.meta.components, ...s.meta.styles].map((x) => x.updated_at).sort().pop();
  return at ? { id: at, label: 'published', at, editedSince: editedSince(at) } : null;
}

/**
 * A project's Figma token: FIGMA_TOKEN, else the command its
 * snapshot.config.json names as `figmaToken` (run in the repo; a project
 * keeps its secret wherever its stack keeps secrets), else the machine's one
 * token file (FIGMA_TOKEN_FILE, default ~/.config/figma/token), else none.
 * The file is the default every project reaches without a step of its own:
 * one of two registered projects had no command, so its snapshot was never
 * held to the published library (2026-10-03). The token is a person's, not a
 * project's; one file per machine is where it belongs.
 */
const TOKEN_FILE = () => process.env.FIGMA_TOKEN_FILE || require('node:path').join(require('node:os').homedir(), '.config/figma/token');
function tokenFor(repo, config) {
  if (process.env.FIGMA_TOKEN) return process.env.FIGMA_TOKEN;
  if (repo && config && config.figmaToken) {
    try { const t = execSync(config.figmaToken, { cwd: repo, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); if (t) return t; } catch { /* the file below */ }
  }
  try { return require('node:fs').readFileSync(TOKEN_FILE(), 'utf8').trim() || null; } catch { return null; }
}

module.exports = { released, tokenFor };

/* `node version.cjs <fileKey> published|named` — for a check that wants the
   live answer (FIGMA_TOKEN in the environment). */
if (require.main === module) {
  const [key, mode] = process.argv.slice(2);
  if (!key || !['published', 'named'].includes(mode) || !process.env.FIGMA_TOKEN) { console.error('usage: FIGMA_TOKEN=… version.cjs <fileKey> published|named'); process.exit(2); }
  released(key, mode, process.env.FIGMA_TOKEN).then((v) => console.log(JSON.stringify(v)), (e) => { console.error(`figma: ${e.message}`); process.exit(1); });
}
