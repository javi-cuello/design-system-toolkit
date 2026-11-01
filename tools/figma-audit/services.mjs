/*
 * The docs services running on this machine, read from the process list: each
 * one's audit folder (--data), port and start time; a project's service found
 * by its audit folder; and the one client that calls a service and runs code
 * in Figma through it. The stale-service check, to-figma and bin/audit use it.
 */
import { execFileSync } from 'node:child_process';
import os from 'node:os';
import fs from 'node:fs';
import { resolve, sep, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { samePath, realPath } from '../shared/real-path.mjs';

const SERVER = fileURLToPath(new URL('./server.mjs', import.meta.url));

/* A process's working folder, for a path it was given relative to it: /proc on Linux, lsof elsewhere; null when
   neither can say. */
export function cwdOf(pid) {
  try { return fs.readlinkSync(`/proc/${pid}/cwd`); } catch {}
  try { const m = execFileSync('lsof', ['-a', '-b', '-w', '-p', String(pid), '-d', 'cwd', '-Fn'], { encoding: 'utf8', timeout: 3000, stdio: ['ignore', 'pipe', 'ignore'] }).match(/^n(.+)$/m); return m ? m[1] : null; } catch { return null; }
}

/* The services in a `ps -eo pid=,lstart=,args=` listing. A service is a process whose program runs THIS toolkit's
   server.mjs with --data: its script is the first argument past the program that is server.mjs, so a flag and its
   value (`node --watch server.mjs`, `node -r dotenv/config server.mjs`) are passed over,
   and a relative one (`node tools/figma-audit/server.mjs`, as the README starts it) is read against that process's
   own folder; where that cannot be read, a path ending in tools/figma-audit/server.mjs is taken as this one. A
   shell or an editor whose command line merely mentions server.mjs and --data is not one, and read as one it
   failed the dashboards check with a service serving "at" (2026-11-01). One whose --data is under the temp folder,
   where no project's records live, is a test's and says so (`test`): the dashboards check leaves it out, since
   another session's test server turned it red for as long as it ran, while a test still finds its own by its
   folder (serviceFor). Pure but for `cwdOf`, which its test replaces. */
const LINE = /^\s*(\d+)\s+(\w{3} \w{3} [ \d]\d \d\d:\d\d:\d\d \d{4})\s+(.*)$/;
const SUFFIX = /(^|[\\/])tools[\\/]figma-audit[\\/]server\.mjs$/;
export function parse(ps, { server = SERVER, tmp = os.tmpdir(), cwd = cwdOf } = {}) {
  const out = [];
  const temps = [...new Set([resolve(tmp), realPath(tmp)])];
  const under = (p) => temps.some((t) => p === t || p.startsWith(t + sep));
  for (const line of ps.split('\n')) {
    if (!/server\.mjs/.test(line) || !/--data/.test(line)) continue;
    const m = line.match(LINE);
    if (!m) continue;
    const [, pid, lstart, args] = m;
    const started = new Date(lstart);
    const parts = args.trim().split(/\s+/);
    // a shell running a command line (`zsh -c … eval 'node …/server.mjs --data …'`, an agent's tool call) is not the service it starts
    const shell = (x) => /(^|\/)-?(sh|bash|zsh|dash|fish|ksh)$/.test(x || '');
    const sh = shell(parts[0]) ? 0 : /(^|\/)env$/.test(parts[0]) ? parts.findIndex((x, i) => i > 0 && shell(x)) : -1;
    if (sh >= 0 && parts.slice(sh + 1).some((x) => /^-[a-z]*c[a-z]*$/.test(x))) continue; // `-c`, `-lc`, `-ec`; `-zsh`, `env bash`
    let dir = null;
    const from = (p) => (isAbsolute(p) ? p : (dir ??= cwd(pid) || '') ? resolve(dir, p) : null);
    const isServer = (x) => { if (x.startsWith('-') || !/server\.mjs$/.test(x)) return false; const abs = from(x); return abs ? samePath(abs, server) : SUFFIX.test(x); };
    const at = parts.findIndex((x, i) => i > 0 && isServer(x));
    if (at < 0) continue;
    for (let i = at + 1; i < parts.length; i++) {
      if (parts[i] !== '--data' || !parts[i + 1]) continue;
      const data = from(parts[i + 1]) || resolve(parts[i + 1]);
      out.push({ data, test: under(data) || under(realPath(data)), port: parts[parts.indexOf('--port', i)] ? parts[parts.indexOf('--port', i) + 1] : null, started });
    }
  }
  return out;
}

export function running() {
  let ps = '';
  // lstart is the process's start time, "Tue Sep 22 18:52:57 2026"; the pid, for a relative path's folder.
  // a listing that failed is an error, never "none running": that read as a clean check
  // in the C locale: lstart in another language ("dom.  1 nov.") matched no line, and every service was hidden
  try { ps = execFileSync('ps', ['-eo', 'pid=,lstart=,args='], { encoding: 'utf8', env: { ...process.env, LC_ALL: 'C' } }); } catch (e) { throw new Error(`cannot list running processes (ps): ${e.message}`); }
  return parse(ps);
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
