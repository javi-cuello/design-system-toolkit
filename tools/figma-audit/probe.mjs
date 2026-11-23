#!/usr/bin/env node
/*
 * Is the Figma bridge fit to draw in this file? Each check below answers one of the bridge's known failure modes, in
 * the order a fault hides the next, and the first that fails names the mode and what fixes it, so a draw that would
 * fail an hour in is refused in seconds, and a dropped call is never read as evidence about the file.
 *
 *   service    the project's docs service is running (it holds the bridge)
 *   port       nothing else listens on its port (a console MCP holding [::1] there takes the plugin: mode 4)
 *   connected  the file's Desktop Bridge is connected to it (a file switch or another plugin dropped it: mode 1)
 *   answers    a trivial call comes back (a call that hangs with the file connected: mode 1, the plugin stalled)
 *   instances  a layer inside an instance can be read by its id (after hours the plugin degrades and they "do not
 *              exist" on every call: mode 5, restart the plugin; figma_reload_plugin does not fix it)
 *   library    a font loads and a library component imports (both hang in a file whose library API stalled: mode 3,
 *              reopen the plugin in that file)
 *
 * A payload bug (mode 2) is what is left when every check passes and one script still fails. A check with nothing to
 * check on the file's current page (no instance, no library instance) is said as skipped, never as passed.
 *
 *   node tools/figma-audit/probe.mjs --project <label> [--file <fileKey>]    (default: the library's draw.scratch)
 */
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { serviceFor, running, call, figmaExec } from './services.mjs';
import { samePath } from '../shared/real-path.mjs';

const req = createRequire(import.meta.url);

/* A promise given up on after ms, as a timeout error: a stalled bridge never answers, so waiting is the fault. */
const within = (p, ms, what) => { let t; return Promise.race([p, new Promise((_, no) => { t = setTimeout(() => no(Object.assign(new Error(`${what}: no answer in ${ms / 1000} s`), { timeout: true })), ms); })]).finally(() => clearTimeout(t)); };

/* In the file: the first instance with a child, that child read back by id; a font loaded; a remote component
   imported by key. Each says what it found, so a file with no instance or no library says so rather than passing. */
export const IN_FILE = `
const out = {};
const step = async (k, f) => { try { out[k] = await f(); } catch (e) { out[k] = { error: String(e && e.message || e) }; } };
// (the bridge runs with documentAccess "dynamic-page": an instance's main is read with getMainComponentAsync, never
// the mainComponent getter, which throws there)
const insts = figma.currentPage.findAllWithCriteria({ types: ['INSTANCE'] });
await step('instances', async () => {
  const inst = insts.find((n) => n.children && n.children.length);
  if (!inst) return 'none on this page';
  return (await figma.getNodeByIdAsync(inst.children[0].id)) ? 'ok' : 'gone';
});
await step('font', async () => { const t0 = Date.now(); await figma.loadFontAsync({ family: 'Inter', style: 'Regular' }); return Date.now() - t0; });
await step('library', async () => {
  // the library's own file: the drawing takes its components from the file itself, never asked of a library: to-figma's ownFile
  if (typeof OWN !== 'undefined' && OWN) return "not needed: this is the library's own file, whose components the drawing takes from it";
  // the first library component that imports passes: an old library's instance refusing is not the bridge's fault,
  // so up to five are tried, and it fails only when every one did
  let tried = 0, first = null;
  const seen = new Set();
  // (at most 200 instances looked at, so a page of thousands never runs into the timeout read as a stall)
  for (const n of insts.slice(0, 200)) {
    if (tried >= 5) break;
    try {
      const m = await n.getMainComponentAsync();
      if (!m || !m.remote || seen.has(m.key)) continue;
      seen.add(m.key); tried++;
      const t1 = Date.now();
      await figma.importComponentByKeyAsync(m.key); return Date.now() - t1;
    } catch (e) { first = first || String(e && e.message || e); }
  }
  if (first) throw new Error(tried + ' tried, none imported: ' + first);
  return 'no library instance on this page';
});
return out;`;

/* The checks, run in order until one fails; each { check, ok, said }. `io` is the world (the service, the port's
   listeners, the calls), which the test replaces. */
export async function probe(label, fileKey, io) {
  const out = [];
  // `skipped`: passed with nothing to check (no instance, no library instance on the page), said apart
  const say = (check, ok, said, skipped = false) => { out.push({ check, ok, said, ...(skipped && { skipped: true }) }); return ok; };
  const svc = io.service();
  if (!say('service', !!svc, svc ? `port ${svc.port}` : `no docs service running for ${label}: start it (tools/figma-audit/README.md)`)) return out;
  const own = new Set([svc.pid, ...(io.servicePids ? io.servicePids(svc) : [])].map(String));
  const others = io.listeners(svc.port).filter((pid) => !own.has(String(pid)));
  if (!say('port', !others.length, others.length ? `mode 4: another process (${others.join(', ')}) listens on ${svc.port}, and the plugin may dial it: give the project a port no MCP holds, or stop that one with its owner's OK` : 'only the service listens')) return out;
  let status;
  try { status = await within(io.status(svc), 5000, 'status'); } catch (e) { say('connected', false, `the service did not answer /status: ${e.message}`); return out; }
  const files = (status.files || []).map((f) => f.fileKey);
  if (!say('connected', files.includes(fileKey), files.includes(fileKey) ? 'the Desktop Bridge is connected' : `mode 1: ${fileKey} is not connected (connected: ${files.join(', ') || 'none'}): open the file and run the Desktop Bridge plugin in it`)) return out;
  try { await within(io.exec(svc, fileKey, 'return 1', 10000), 12000, 'a trivial call'); say('answers', true, 'a trivial call came back'); } catch (e) { say('answers', false, `mode 1: ${e.message}: the plugin is connected but not answering; close and reopen it in the file`); return out; }
  let r;
  // a timeout here is the stalled library API (mode 3); any other error is the script's or the file's, said as it is
  try { r = await within(io.exec(svc, fileKey, (io.own ? 'const OWN = true;\n' : '') + IN_FILE, 40000), 45000, 'the in-file checks'); } catch (e) { say('library', false, /timed? ?out|no answer|plugin_timeout/i.test(e.message) ? `mode 3: ${e.message}: a font load or a library import hangs; reopen the plugin in this file` : `the in-file checks failed: ${e.message}`); return out; }
  const err = (x) => x && typeof x === 'object' && x.error;
  if (err(r.instances)) { say('instances', false, `mode 5?: reading a layer inside an instance threw (${r.instances.error}): if it says the node does not exist, restart the plugin`); return out; }
  if (!say('instances', r.instances !== 'gone', r.instances === 'gone' ? 'mode 5: a layer inside an instance does not exist by its id: the plugin has degraded; restart it (reloading does not fix it)' : r.instances === 'ok' ? 'a layer inside an instance reads back' : `not checked: ${r.instances}`, r.instances !== 'ok' && r.instances !== 'gone')) return out;
  if (err(r.font) || err(r.library)) { say('library', false, `${err(r.font) ? `the font did not load (${r.font.error})` : `a library component did not import (${r.library.error}): unpublished, or this file cannot reach its library`}`); return out; }
  say('library', true, `font in ${r.font} ms; ${typeof r.library === 'number' ? `a library component imported in ${r.library} ms` : `import not checked: ${r.library}`}`, typeof r.library !== 'number');
  return out;
}

/* The real world for a project: its service, every process of it (a --watch parent and its child alike), the port's
   listeners, its /status, and code run in the file. */
export const world = (where, own = false) => ({
  own,
  service: () => serviceFor(where.audit), listeners,
  servicePids: (svc) => { try { return running().filter((x) => x.data && samePath(x.data, svc.data)).map((x) => x.pid); } catch { return []; } },
  status: (svc) => call(svc, '/status'), exec: (svc, f, code, t) => figmaExec(svc, f, code, t),
});

/* The pids listening on a TCP port, by lsof; none where lsof cannot say. */
export function listeners(port) {
  try { return [...new Set(execFileSync('lsof', ['-nP', `-iTCP:${port}`, '-sTCP:LISTEN', '-t'], { encoding: 'utf8', timeout: 3000, stdio: ['ignore', 'pipe', 'ignore'] }).split('\n').filter(Boolean))]; } catch { return []; }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === (() => { try { return realpathSync(process.argv[1]); } catch { return null; } })()) {
  const argv = process.argv.slice(2);
  const opt = (k) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : null; };
  const label = opt('--project');
  if (!label) { console.error('usage: probe.mjs --project <label> [--file <fileKey>]'); process.exit(2); }
  const projects = req('../snapshot/projects.cjs');
  const where = projects.layout(null, label);
  if (where.error) { console.error(where.error); process.exit(2); }
  const { libraryOf } = await import('../parity/project.mjs');
  const file = opt('--file') || ((libraryOf(label).lib || {}).draw || {}).scratch;
  if (!file) { console.error(`${label}: no --file and no draw.scratch in its library settings`); process.exit(2); }
  const out = await probe(label, file, world(where, libraryOf(label).libKey === file));
  for (const o of out) console.log(`${o.skipped ? 'skip' : o.ok ? 'ok  ' : 'FAIL'} ${o.check.padEnd(10)} ${o.said}`);
  process.exit(out.every((o) => o.ok) ? 0 : 1);
}
