/*
 * tools/parity/session.mjs — a project's pages, up and ready to be put on
 * screen, part of the design-to-code parity engine (README.md here; the
 * method is skills/design-code-parity).
 *
 *   session(project, { page, app, browser, say }) → { PAGE, ROUTES, acquire, release, discard, screen, close }
 *   screen(target, tier) → a tab showing that screen as its frame draws it
 *
 * What the parity run, the proposed map (propose.mjs) and a project's own
 * tools (a pixel diff) all need, so they get it one way: the story tool built (once per
 * change of what the project names as its inputs, `host.build`) and served
 * by this process; the running product started where it is not up
 * (`app.start`), signed in where it wants a session (`app.session`); one
 * browser, its windows pooled. Everything started here stops when the
 * process exits. A screen is opened at the window its frame was drawn in and
 * driven into the state the mapping says (`page`: fill, click, scroll, focus).
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { spawn, execSync } from 'node:child_process';
import * as hosts from './hosts.mjs';
import { launch, pool, forceState, findChrome } from '../shared/cdp.mjs';
import { serve } from './serve.mjs';
import { layerAt } from './layers.mjs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const CHROME = findChrome();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* The story build's cache key: a content hash of every file under the inputs
   the project names (`host.build.inputs`), by path and bytes — never a
   timestamp, so a touched file reuses the build and a changed byte rebuilds
   it. The one cache the engine keeps; test-session.mjs holds it to that. */
/* The lockfiles a build installs from: the repo's root's, and the build
   folder's own where it is a package of its own; each installed where it is. */
export function lockfiles(repo, cwd) {
  const lock = [repo, cwd].flatMap((d) => ['package-lock.json', 'pnpm-lock.yaml', 'yarn.lock', 'bun.lockb'].map((f) => path.join(d, f))).filter((f, i, a) => a.indexOf(f) === i && fs.existsSync(f));
  return { lock, dirs: [...new Set(lock.map((f) => path.dirname(f)))] };
}

export function inputsHash(repo, inputs) {
  const h = crypto.createHash('sha256');
  const walk = (p) => {
    if (!fs.existsSync(p)) return;
    if (fs.statSync(p).isDirectory()) { for (const e of fs.readdirSync(p).sort()) if (e !== 'node_modules' && e !== '.git' && !e.startsWith('.DS_')) walk(path.join(p, e)); return; }
    h.update(path.relative(repo, p)).update(fs.readFileSync(p));
  };
  for (const i of inputs) walk(path.join(repo, i));
  return h.digest('hex').slice(0, 16);
}

/* A screen's window: its whole frame's width, and the height the mapping's
   page state names or the frame's own (a full-page comp is the page at its
   end), at most 16000. A mapping that needs the window (`viewport`) for a
   component takes the variant's box the same way. */
export function screenWindow(t, tree) {
  const box = t.kind === 'screen' ? t.frame.tree : tree;
  return [Math.round(box.w), Math.min(Math.round((t.mapping.page && t.mapping.page.height) || box.h), 16000)];
}

/* Where a page is scrolled to: px, 'end', or a layer of the frame — the page
   scrolled to where the frame draws that layer (a Main drawn at y -331 in a
   window-sized frame is the page scrolled by 331), so the offset is the
   frame's and nobody types it. */
export function scrollFor(t, s) {
  if (typeof s !== 'string' || s === 'end') return s;
  const node = layerAt(t.frame ? t.frame.tree : t.spec.variants[0], s);
  if (!node) throw new Error(`page.scroll names "${s}", which the frame does not draw`);
  return Math.round(-node.y);
}

/* A page driven into the state its mapping names, focus included. */
export async function drivePage(tab, t, { pseudo, on } = {}) {
  const m = t.mapping;
  // scrolled to a layer: the page scrolls that layer's element, or the box that holds it;
  // a mapping may name the box itself (`scroller`), which is how a page whose content
  // scrolls in a panel is scrolled to its 'end' or by a number
  const scroller = (m.page && m.page.scroller) || (typeof (m.page && m.page.scroll) === 'string' && m.page.scroll !== 'end' ? (m.layers || {})[m.page.scroll] : null);
  if (m.page) await hosts.drive(tab, { ...m.page, scroll: scrollFor(t, m.page.scroll), scroller });
  const held = [];
  if (pseudo) {
    if (!on) throw new Error(`the :${pseudo} state needs the element that takes it — the mapping declares no \`state\` selector`);
    held.push({ selector: on, pseudo });
  }
  if (m.page && m.page.focus) held.push({ selector: m.page.focus, pseudo: 'focus-visible' });
  if (held.length) await forceState(tab, held);
}

/* A temp folder of the run's own, keyed by the repo's path as well as its
   label: an eval copy carries its original's label, and shared one build
   folder with it, so each overwrote the other's cached build (2026-10-03). */
export function scratch(label, repo, what) {
  return path.join(os.tmpdir(), `parity-${label}-${crypto.createHash('sha1').update(repo).digest('hex').slice(0, 8)}-${what}`);
}

export function envOf(project) {
  let locale = 'en-GB';
  try {
    const { auditContext, homeOf } = createRequire(import.meta.url)('../snapshot/projects.cjs');
    const doc = project.config.project ? path.join(homeOf(project.config.project), 'design-system-context.md') : '';
    if (fs.existsSync(doc)) locale = auditContext(doc).language || locale;
  } catch { /* the default the toolkit writes when nobody has said otherwise */ }
  return { timezone: 'UTC', locale };
}

export async function session(project, { page = true, app = true, browser = true, say = console.log } = {}) {
  const P = project.parity;
  const REPO = project.repo;
  const label = project.config.project || path.basename(REPO);
  const cleanup = [];
  const close = () => { for (const c of cleanup.splice(0)) try { c(); } catch { /* best effort */ } };
  process.once('SIGINT', () => process.exit(130));
  process.on('exit', close);

  /* The story tool, built once per change: ten full runs in one day once
     rebuilt the same build ten times. A failed build says why; one that
     printed nothing read as a run that measured nothing. */
  async function storyBase() {
    const H = P.host;
    if (H.base) return H.base;
    if (!H.build) throw new Error('parity: the storybook host needs `host.base` or `host.build`');
    // where the build goes: the project's own folder where the loader names one (a library built
    // elsewhere is built where the docs site serves its previews), else the run's scratch
    const out = project.storybookOut || scratch(label, REPO, 'build');
    // run where the project says (`build.dir`, a workspace's own package), else at the repo's root
    const cwd = H.build.dir ? path.join(REPO, H.build.dir) : REPO;
    /* Their packages, installed first where the project says how (`build.install`) and its
       lockfile moved since: a pull that changed it otherwise builds against yesterday's
       packages. The stamp is the run's own, outside their repo and the project's files. */
    if (H.build.install) {
      const { lock, dirs } = lockfiles(REPO, cwd);
      const now = crypto.createHash('sha256').update(lock.map((f) => fs.readFileSync(f)).join('')).digest('hex').slice(0, 16);
      const lockStamp = scratch(label, REPO, 'install-hash');
      if (!fs.existsSync(lockStamp) || fs.readFileSync(lockStamp, 'utf8') !== now) {
        say('their lockfile changed: installing…');
        try { for (const dir of dirs.length ? dirs : [REPO]) execSync(H.build.install, { cwd: dir, stdio: 'pipe', maxBuffer: 256e6 }); }
        catch (e) { throw new Error(`installing their packages failed — nothing was measured:\n${String(e.stderr || e.stdout || e.message).split('\n').slice(-20).join('\n')}`); }
        fs.writeFileSync(lockStamp, now);
      }
    }
    // what the build reads: the project's `build.inputs`, else the folder it builds in, else the whole repo
    const hash = inputsHash(REPO, H.build.inputs || [H.build.dir || '.']);
    const stamp = path.join(out, '.parity-hash');
    if (fs.existsSync(stamp) && fs.readFileSync(stamp, 'utf8') === hash) say('build reused — none of its inputs changed');
    else {
      say('building…');
      fs.rmSync(stamp, { force: true });
      const t = Date.now();
      try { execSync(H.build.run.replace('{out}', out), { cwd, stdio: 'pipe', maxBuffer: 256e6 }); }
      catch (e) { throw new Error(`the build failed — nothing was measured:\n${String(e.stdout || '').split('\n').slice(-30).join('\n')}\n${String(e.stderr || '').split('\n').slice(-30).join('\n')}`); }
      fs.writeFileSync(stamp, hash);
      say(`built in ${Math.round((Date.now() - t) / 1000)}s`);
    }
    const s = await serve(out);
    cleanup.push(() => s.close());
    return s.base;
  }

  /* The running product. Started here when it is not up, the way a test
     suite creates its own database: a gate that skips half of itself when a
     server happens to be down reports green over pages nobody opened. */
  async function appUp() {
    const A = P.app || {};
    // a second checkout runs its own app beside the first: PARITY_APP_PORT moves it
    const port = process.env.PARITY_APP_PORT || A.port;
    const base = A.base ? A.base.replace('{port}', port) : null;
    if (!base) throw new Error('parity: a route needs `parity.app.base`');
    const ready = `${base}${A.ready || A.login || '/'}`;
    const answers = () => fetch(ready, { redirect: 'manual', signal: AbortSignal.timeout(2000) }).then((r) => r.status < 500, () => false);
    if (!await answers()) {
      if (!A.start) throw new Error(`parity: nothing answers at ${ready}, and the project says no way to start it (parity.app.start)`);
      say(`starting the app on ${base}…`);
      const log = scratch(label, REPO, 'app.log');
      const child = spawn(A.start.replace('{port}', port), { cwd: REPO, shell: true, detached: true, stdio: ['ignore', fs.openSync(log, 'w'), fs.openSync(log, 'a')], env: { ...process.env, ...(A.env || {}) } });
      cleanup.push(() => { try { process.kill(-child.pid, 'SIGTERM'); } catch { /* gone */ } });
      let up = false;
      for (let i = 0; i < 120 && !up; i++) { await sleep(500); up = await answers(); }
      if (!up) throw new Error(`the app did not come up at ${ready} — routes cannot be measured, and that is not a pass:\n${fs.readFileSync(log, 'utf8').split('\n').slice(-20).join('\n')}`);
    }
    let cookie = null;
    if (A.session) {
      try { cookie = execSync(A.session, { cwd: REPO, encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] }).trim(); } catch { cookie = ''; }
      if (!cookie) throw new Error('the app is up but its session command gave no cookie — routes cannot be measured, and that is not a pass');
    }
    return { base, cookie };
  }

  const PAGE = page ? (P.host.kind === 'storybook'
    ? hosts.storybook({ base: await storyBase(), themeGlobal: ((project.config.paths || {}).storybook || {}).themeGlobal, frameGlobal: P.host.frameGlobal })
    // a second checkout serves its own components: PARITY_HOST_BASE moves the host, as PARITY_APP_PORT moves the app
    : hosts.host(P.host.kind, process.env.PARITY_HOST_BASE ? { ...P.host, base: process.env.PARITY_HOST_BASE } : P.host)) : null;
  const APP = app ? await appUp() : null;
  const ROUTES = APP ? hosts.app({ ...P.app, base: APP.base }) : null;
  const b = browser ? await launch({ chrome: CHROME }) : null;
  if (b) cleanup.push(() => b.close());
  /* code-standard 35: the time zone and the locale are the check's, never the
     machine's — UTC, and the project's own language from its context document. */
  const tabs = b ? pool(b.endpoint, envOf(project)) : null;

  const acquire = async () => {
    const tab = await tabs.acquire();
    if (APP && APP.cookie && !tab.signedIn) {
      const u = new URL(APP.base);
      await tab.send('Network.setCookie', { name: P.app.cookie, value: APP.cookie, domain: u.hostname, path: '/', httpOnly: true, sameSite: 'Lax' });
      tab.signedIn = true;
    }
    return tab;
  };

  /* A screen on its route, as its frame draws it: the caller releases the tab. */
  async function screen(t, tier) {
    if (!ROUTES || !t.mapping.route) throw new Error(`${t.name}: no route to open`);
    const tab = await acquire();
    try {
      await ROUTES.open(tab, { route: t.mapping.route, tier, viewport: screenWindow(t, t.spec.variants[0]), keepFocus: Boolean(t.mapping.page && t.mapping.page.focus) });
      await drivePage(tab, t);
      return tab;
    } catch (e) { await tabs.discard(tab); throw e; }
  }

  return { PAGE, ROUTES, APP, acquire, release: (t) => tabs.release(t), discard: (t) => tabs.discard(t), screen, close };
}
