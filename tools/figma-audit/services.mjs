/*
 * The docs services running on this machine, read from the process list: each
 * one's audit folder (--data), port and start time; a project's service found
 * by its audit folder; and the one client that calls a service and runs code
 * in Figma through it. The stale-service check, to-figma and bin/audit use it.
 */
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { samePath } from '../shared/real-path.mjs';

export function running() {
  let ps = '';
  // lstart is the process's start time, fixed-width: "Tue Sep 22 18:52:57 2026".
  // a listing that failed is an error, never "none running": that read as a clean check
  try { ps = execFileSync('ps', ['-eo', 'lstart,args'], { encoding: 'utf8' }); } catch (e) { throw new Error(`cannot list running processes (ps): ${e.message}`); }
  const out = [];
  for (const line of ps.split('\n')) {
    if (!/server\.mjs/.test(line) || !/--data/.test(line)) continue;
    const started = new Date(line.slice(0, 24).trim());
    // The supervisor process carries every child's pair; the children carry one
    // each. Reading them all is right — a stale pair in the supervisor is the
    // same defect, and it is the one that survives a kickstart.
    const parts = line.slice(24).trim().split(/\s+/);
    for (let i = 0; i < parts.length; i++) {
      if (parts[i] === '--data' && parts[i + 1]) out.push({ data: resolve(parts[i + 1]), port: parts[parts.indexOf('--port', i)] ? parts[parts.indexOf('--port', i) + 1] : null, started });
    }
  }
  return out;
}

/* A project's running service: the one whose audit folder is this one on disk. Compared through samePath, never as
   typed: a shell that entered through ~/projects reports a path no stored ~/Projects one string-matches, and bin/audit
   compared them as typed and found no service while one ran. */
export const serviceFor = (auditDir) => running().find((x) => x.data && x.port && samePath(x.data, auditDir)) || null;

/* A route of a service called with JSON (GET without a body): its answer, or the `error` it carries thrown, with the
   `hint` beside it on the same line (a file to reopen), since a caller prints the message and nothing else. */
export async function call(svc, route, body) {
  const res = await fetch(`http://localhost:${svc.port}${route}`, { method: body ? 'POST' : 'GET', headers: { Origin: `http://localhost:${svc.port}`, 'Content-Type': 'application/json' }, ...(body && { body: JSON.stringify(body) }) });
  const j = await res.json();
  if (j && j.error) throw new Error([j.error, j.hint].filter(Boolean).join(': '));
  return j;
}

/* Code run in a file open in Figma, through the service's Desktop Bridge: what the code returns, or the plugin's error
   thrown. The one client: to-figma and bin/audit each kept their own, which unwrapped the answer two ways. */
export async function figmaExec(svc, fileKey, code, timeout = 30000) {
  const j = await call(svc, '/exec', { code, fileKey, timeout });
  if (j.ok === false) throw new Error('the bridge refused the code');
  const r = j.result;
  if (r && r.success === false) throw new Error(r.error);
  return r && typeof r === 'object' && 'result' in r ? r.result : r;
}
