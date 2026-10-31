#!/usr/bin/env node
// The front desk for design snapshots: one port, every project at once.
//
// The Figma plugin posts to a FIXED port on localhost (9317, pinned by its
// manifest's devAllowedDomains — Figma's constraint, not a choice). One port
// means one listener, so before this existed a second project's receiver could
// not even bind while the first was up. Working on two projects meant
// remembering to stop one before snapshotting the other, and forgetting was
// not a small mistake: nothing in the transport says who a payload is for, so
// whichever repo happened to be listening WROTE it.
//
//   node router.mjs [--projects <a folder of project homes, for tests>] [--port 9317]
//
// It holds no list of its own — the projects directory is the registry, and
// each project's context document states which files it owns. Everything is
// read fresh per request, because a router you have to remember to restart is
// one that quietly serves a stale map. Identity, discovery and routing are
// `projects.cjs`: one implementation.
//
// It writes every project the same way, through deliver.cjs: the one store
// writes the snapshot at the paths the project's snapshot.config.json gives,
// then the project's own steps run. Two repos once had a receiver each, and
// the three writers of one format each carried fixes the others lacked.
//
// No dependencies, deliberately: nothing to install, nothing to keep current.

import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { isFigmaOrigin } from '../shared/origin.mjs';

/*
 * The contract, the schema and the store are read FRESH for every snapshot,
 * like the projects directory. A router started before a change to any of
 * them went on writing with the old code: a mobile library was stored without
 * its platform and overwrote nineteen web components, because the router in
 * the terminal predated the fix. A router you have to remember to restart is
 * one that quietly writes with stale rules.
 */
const require = createRequire(import.meta.url);
const HERE_DIR = path.dirname(fileURLToPath(import.meta.url));
// The snapshot code and the component contract it derives (store.cjs requires
// component-contract/derive.cjs): both are read fresh on every snapshot.
const FRESH = [HERE_DIR, path.join(HERE_DIR, '..', 'component-contract')].map((d) => d + path.sep);
function load() {
  for (const k of Object.keys(require.cache)) if (FRESH.some((d) => k.startsWith(d))) delete require.cache[k];
  return { contract: require('./projects.cjs'), schema: require('./payload.cjs'), deliver: require('./deliver.cjs').deliver };
}
let { contract } = load();
// the largest body taken, read once: a snapshot past it is refused before it is held
const { LARGEST } = contract;
let held = 0; // the bytes every post being read holds

const arg = (flag, fallback) => {
  const i = process.argv.indexOf(flag);
  return i === -1 ? fallback : process.argv[i + 1];
};

/* fileURLToPath, not `new URL(...).pathname`: the latter leaves a path with a
   space in it percent-encoded, so a toolkit under "My Projects" would look for
   a projects directory that does not exist. */
const HERE = path.dirname(fileURLToPath(import.meta.url));
// Left out, every project the contract finds (contract.homes()).
const PROJECTS = arg('--projects', null);
const PORT = +arg('--port', 9317);

/*
 * Where a payload is kept, and why at all.
 *
 * A write that fails partway is the one moment you want the exact bytes that
 * caused it, without reopening Figma and without the design having moved
 * underneath. Kept in the system temp directory, not in a repo: they are
 * megabytes of machine output, and a repo is for things a person wrote. The
 * newest three per project and kind survive, and the path is printed only when
 * a snapshot fails — on a good run it is noise, and noise is what buries the
 * one line that matters.
 */
const KEEP = path.join(os.tmpdir(), 'figma-snapshot-router');

function keep(project, kind, payload) {
  fs.mkdirSync(KEEP, { recursive: true });
  const stem = `${project.name}-${kind}-`;
  const file = path.join(KEEP, `${stem}${Date.now()}.json`);
  fs.writeFileSync(file, JSON.stringify(payload));
  for (const old of fs.readdirSync(KEEP).filter((f) => f.startsWith(stem)).sort().slice(0, -3)) {
    fs.rmSync(path.join(KEEP, old), { force: true });
  }
  return file;
}

/*
 * One delivery at a time per project.
 *
 * Two payloads for one project arriving together would write the same files
 * at once — a library and a screens snapshot taken back to back is
 * exactly that — and the loser writes a half-finished tree that looks
 * finished. Serialised per PROJECT rather than globally, so two projects still
 * snapshot in parallel, which is the whole point of the router.
 */
const queues = new Map();

function deliver(project, kind, payload) {
  const file = keep(project, kind, payload);
  const run = async () => {
    console.log(`\n→ ${project.name} (${kind})`);
    try {
      // Every project through the one path (deliver.cjs): the store writes,
      // the project's own steps run after.
      const result = await load().deliver(project, kind, payload);
      /* A refusal already said why. Only a FAILURE needs the payload pointed
         at, because that is the one you re-run. */
      if (result && result.result === 'failed') {
        console.error(`  ${project.name}: a required step failed — the payload is at ${file}`);
        console.error(`  re-run it with: node ${path.join(HERE, 'deliver.cjs')} ${project.name} ${kind} ${file}`);
      }
      return result;
    } catch (e) {
      console.error(`  ${e && e.stack ? e.stack : e}`);
      console.error(`  the payload is at ${file} — re-run it with: node ${path.join(HERE, 'deliver.cjs')} ${project.name} ${kind} ${file}`);
      // the shape deliver answers in, so the plugin is told it failed and why, never "undefined"
      return { result: 'failed', why: String((e && e.message) || e) };
    }
  };
  const next = (queues.get(project.name) || Promise.resolve()).then(run, run);
  queues.set(project.name, next.catch(() => 'failed'));
  return next;
}

/*
 * Who may talk to the router: a Figma plugin's UI (a sandboxed iframe, which
 * sends `Origin: null`) or Figma's own pages, and local tools (no Origin), on a localhost
 * Host. Anything else is a web page the user happens to have open: `localhost`
 * is reachable from any page, a text/plain POST needs no preflight, and an
 * answered one could overwrite a project's snapshot and run its after-snapshot
 * steps. The Host check stops a rebound DNS name. `Origin: null` is also what
 * a sandboxed iframe on any page sends, so nothing a GET answers names a
 * project, and a POST still needs a file id the routing knows.
 */
const LOCAL = new Set(['localhost', '127.0.0.1', '[::1]']);
// Figma itself (figma.com and its subdomains) is admitted too: which Origin the
// plugin's fetch carries is Figma's to choose, and no other page can claim it.
const trusted = (o) => o === undefined || o === 'null' || isFigmaOrigin(o);
const allowed = (req) => LOCAL.has(String(req.headers.host || '').replace(/:\d+$/, '')) && trusted(req.headers.origin);
const cors = (req) => (req.headers.origin !== undefined ? { 'access-control-allow-origin': req.headers.origin } : {});

const server = (req, res) => {
  if (!allowed(req)) {
    console.error(`  refused a request from ${req.headers.origin || 'no origin'} for host ${req.headers.host || '?'}`);
    res.writeHead(403, { 'content-type': 'text/plain' });
    return res.end('only the Figma plugin and local tools may talk to the snapshot router');
  }
  /*
   * Is anybody home?
   *
   * The plugin asks this when it opens, so it can grey out its own button and
   * name the command to run instead of letting somebody collect a whole
   * library and only then be told nothing was listening. A snapshot is half a
   * minute of the designer's file; finding out afterwards is the worst moment
   * to find out.
   */
  if (req.method === 'GET') {
    // Asked with ?file=<id>, it also says which kind the routing records that
    // file as, so the plugin collects the right thing without guessing.
    // a module that fails to load is answered as the post's failure is, never a crash
    let list, contract, kind;
    const ids = new URL(req.url, 'http://localhost').searchParams.getAll('file');
    try { ({ contract } = load()); ({ list } = contract.projects(PROJECTS)); kind = ids.length ? contract.kindOf(list, ids) : null; } catch (e) {
      console.error(`  failed: ${e.message}`);
      res.writeHead(500, { 'content-type': 'application/json', ...cors(req) });
      return res.end(JSON.stringify({ ok: false, error: e.message }));
    }
    res.writeHead(200, { 'content-type': 'application/json', ...cors(req) });
    // a count, never the names: a sandboxed iframe on any page also sends `Origin: null`,
    // and the list of projects is the list of the people this machine works for
    return res.end(JSON.stringify({ ok: true, projects: list.length, kind }));
  }
  if (req.method !== 'POST') { res.writeHead(405); return res.end(); }
  const kind = req.url === '/screens' ? 'screens' : req.url === '/library' ? 'library' : null;
  // Chunks joined as bytes, decoded once: decoding each chunk alone splits a
  // multi-byte character (an emoji page marker, an accented name) that lands
  // on a chunk boundary into two replacement characters.
  // no body past the largest a snapshot is (library or screens), and no more than that held at once across posts, so
  // pages that post cannot make the router hold any more; what is past it is read and dropped, so the answer arrives
  const chunks = [];
  let size = 0, mine = 0, refused = 0;
  const free = () => { held -= mine; mine = 0; };
  req.on('data', (c) => {
    size += c.length;
    if (refused) return;
    if (size > LARGEST || held + c.length > LARGEST) { refused = size > LARGEST ? 413 : 503; chunks.length = 0; free(); return; }
    chunks.push(c); mine += c.length; held += c.length;
  });
  // a post cut off before its end frees what it held; one read whole holds it until its answer is sent
  req.on('close', () => { if (!req.complete) free(); });
  // a store or contract module that fails to load (one being edited) is answered, never an unhandled rejection that
  // takes the router down with every other project's snapshot
  req.on('end', () => ended().catch((e) => {
    console.error(`  failed: ${e.stack || e.message}`);
    if (!res.headersSent) { res.writeHead(500, { 'content-type': 'text/plain', ...cors(req) }); res.end(`the router failed, so the snapshot may not be written: ${e.message}. Snapshot again; if it repeats, the router's output has the trace.`); }
  }));
  const ended = async () => {
    if (refused) {
      res.writeHead(refused, { 'content-type': 'text/plain', connection: 'close', ...cors(req) });
      return res.end(refused === 413 ? `A snapshot is at most ${LARGEST >> 20} MB, so nothing was written.` : 'The router is taking another snapshot: try again in a moment.');
    }
    const body = Buffer.concat(chunks).toString('utf8');
    // held until the answer is sent: the text and what is parsed from it are this post's too
    chunks.length = 0;
    res.on('close', free);
    const answer = (code, text) => {
      res.writeHead(code, { 'content-type': 'text/plain', ...cors(req) });
      res.end(text);
    };
    if (!kind) return answer(404, `the plugin posted to ${req.url}, which the router does not serve. Reload the plugin (Plugins › Development › Reload), then snapshot again.`);
    const { contract, schema } = load();
    const { identify, projects, route } = contract;
    let payload;
    try { payload = JSON.parse(body); } catch (e) {
      console.error(`  payload rejected: ${e.message}`);
      return answer(400, 'the snapshot arrived damaged, so nothing was written. Take it again.');
    }
    /* The shape, before anybody writes it: a payload no consumer can read is
       refused here, once, instead of being half-written and discovered later
       by whichever reader tripped on it. */
    const problems = kind === 'library' ? schema.library(payload) : schema.screens(payload);
    if (problems.length) {
      console.error(`\n  REFUSED — the ${kind} payload does not match payload.cjs (schema v${schema.SCHEMA_VERSION}):\n    ${problems.slice(0, 8).join('\n    ')}\n`);
      return answer(400, `this copy of the plugin sends a snapshot the toolkit cannot read (${problems[0]}), so nothing was written. Reload it (Plugins › Development › Reload), then snapshot again.`);
    }
    /* Read fresh: a project added, or an id pasted in, while this is running
       takes effect on the next snapshot rather than the next restart. */
    const { list: now, errors: why } = projects(PROJECTS);
    for (const e of why) console.error(`  ${e}`);
    const { project, error, detail } = route(now, kind, identify(payload), ((payload.tokens || payload)._meta || {}).fileId);
    if (!project) {
      console.error(`\n  REFUSED — ${error}${detail ? `\n  ${detail}` : ''}\n`);
      // a library no project claims, and no two claim: kept, so the contract editor can make a project of it
      let kept = null, notKept = '';
      try { kept = kind === 'library' && !why.length && !now.some((p) => contract.namesOf(p.files.library).includes(identify(payload))) && contract.keepUnclaimed(payload, now); } catch (e) { notKept = e.message; console.error(`  not kept: ${notKept}`); }
      return answer(409, kept ? `${error} Or make a project for it in the contract editor's Settings, with the code ${kept}: this snapshot is kept for a day.` : notKept ? `${error} It was not kept to make a project of: ${notKept}.` : error);
    }
    /*
     * Answer with the OUTCOME, not with "received".
     *
     * This used to reply 200 the moment the payload arrived. The plugin only
     * checks the status, so Figma said "done" over a write that had refused or
     * crashed, and the only place the truth appeared was a terminal the person
     * pressing the button was not looking at. A snapshot worth half a minute
     * is worth waiting to be told it worked.
     */
    let out;
    try { out = await deliver(project, kind, payload); } catch (e) {
      console.error(e.stack || e);
      return answer(500, `${project.name}: the snapshot failed, so it may be half written: ${e.message}. Snapshot again; if it repeats, the router's output has the trace.`);
    }
    if (out.result === 'written') return answer(200, `${project.name}: written`);
    /* A refusal is the guard working, not a crash. Reporting it as one would
       train everybody to ignore crashes. */
    return answer(out.result === 'refused' ? 409 : 500, `${project.name}: ${out.why}`);
  };
};

/*
 * BOTH loopback stacks, one listener each — never 0.0.0.0 or ::, which would
 * put this on the network.
 *
 * `localhost` is two addresses and macOS resolves it to ::1 first. Binding
 * only 127.0.0.1 leaves the IPv6 half to whoever wants it, and something did
 * take it once: figma-console-mcp held :9227 on ::1 and answered every
 * snapshot with a 404 while the receiver sat on the other half logging
 * nothing. Holding both means a clash is an EADDRINUSE this can report rather
 * than a silence somebody has to guess at.
 */
const { list, errors } = contract.projects(PROJECTS);
for (const e of errors) console.error(`  ${e}`);

await Promise.all(['127.0.0.1', '::1'].map((host) => new Promise((done) => {
  const s = http.createServer(server);
  s.on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
      console.error(`\nPort ${PORT} on ${host} is already held — another router, or something else on it.`);
      console.error(`  lsof -nP -iTCP:${PORT} -sTCP:LISTEN\n`);
    } else console.error(`port ${PORT} on ${host}: ${e.message}`);
    process.exit(1);
  });
  s.listen(PORT, host, () => done(host));
})));

console.log(`figma-snapshot router on http://localhost:${PORT} (both loopback stacks) — ${list.length} project(s)`);
for (const p of list) {
  const show = (kind) => contract.namesOf(p.files[kind]).join(' / ') || '(none)';
  console.log(`  ${p.name.padEnd(14)} library ${show('library')}  screens ${show('screens')}${p.repo ? '' : '  — stored in the toolkit'}`);
}
console.log('In Figma: Plugins › Development › Design system snapshot › Take design snapshot');
