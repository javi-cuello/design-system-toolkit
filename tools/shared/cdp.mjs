/*
 * tools/shared/cdp.mjs — the Chrome DevTools client, part of the design-to-code parity
 * engine (README.md here; the method is skills/design-code-parity).
 *
 * The Chrome DevTools Protocol, as a parity loop needs it and no more.
 *
 * A project's parity run, its screenshotter and its interaction gate drive the
 * same headless browser, and one project had carried a copy of this in each:
 * find a page, open a socket, number a request and match its reply. Two of
 * the three copies were the naive one, and the naive one is what cost a week
 * of "RED with no verdict": nothing listened for the socket closing, so a
 * browser that went away mid-run left every reply pending, node found an
 * empty event loop and printed "Detected unsettled top-level await". There is
 * one implementation now, and it is the hardened one.
 *
 * Every function takes the DevTools HTTP endpoint it should talk to, because
 * each script holds its own port and a second worktree moves them again.
 * Plain node 22+ (global fetch and WebSocket), no dependency.
 */
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/*
 * What a headless browser needs to measure the same thing every time: no
 * scrollbar taking 15px out of the layout, colours in sRGB rather than the
 * display's profile, and no timer or renderer throttled for being in the
 * background. These are the rendering half of what puppeteer passed by
 * default, kept so that a project moving off it measured the same: one did,
 * screens byte-identical, 2026-10-01.
 */
const FLAGS = ['--headless=new', '--disable-gpu', '--no-first-run', '--hide-scrollbars', '--mute-audio',
  '--force-color-profile=srgb', '--disable-background-timer-throttling',
  '--disable-backgrounding-occluded-windows', '--disable-renderer-backgrounding'];

/*
 * Start a headless browser and return its DevTools `endpoint` and `close`.
 *
 * The port is the one the browser itself wrote into its own profile
 * (`DevToolsActivePort`), never "whatever answers on the port": a browser a
 * previous run left behind answered that question once and was measured as a
 * stale page. Port 0, the default, lets the system pick, so two runs cannot
 * collide. The profile is a temporary directory this process removes, and the
 * browser is killed when the process exits however it exits — a profile left
 * to the browser lands in $TMPDIR and a killed one never cleans it. The wait
 * is bounded: a browser that never opens DevTools fails the call, by name.
 */
/**
 * Where Chrome is: `$CHROME` when set, else the first of the usual places on
 * macOS and Linux that exists. The one answer, so no caller spells a path.
 */
export function findChrome() {
  if (process.env.CHROME) return process.env.CHROME;
  const home = process.env.HOME || '';
  const known = [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    `${home}/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`,
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser',
  ];
  return known.find((c) => existsSync(c)) || known[0];
}

export async function launch({ chrome = findChrome(), port = 0, profile, args = [], timeout = 30_000 }) {
  const dir = profile || mkdtempSync(join(tmpdir(), 'parity-chrome-'));
  const file = join(dir, 'DevToolsActivePort');
  rmSync(file, { force: true });
  const child = spawn(chrome, [...FLAGS, `--remote-debugging-port=${port}`, `--user-data-dir=${dir}`, ...args, 'about:blank'], { stdio: 'ignore' });
  let failed = null;
  child.once('error', (e) => { failed = e.message; });
  const gone = new Promise((r) => child.once('exit', () => { failed ||= 'it exited before it opened DevTools'; r(); }));
  // an exit handler must be synchronous, so the kill and the removal are too
  const tidy = () => {
    try { child.kill('SIGKILL'); } catch { /* already gone */ }
    // at exit nothing can wait for Chrome's helpers, so a temp folder they still write is left for the OS
    if (!profile) try { rmSync(dir, { recursive: true, force: true, maxRetries: 5 }); } catch { /* the OS clears tmp */ }
  };
  process.on('exit', tidy);
  const close = async () => {
    process.off('exit', tidy);
    if (child.exitCode === null && child.signalCode === null) { child.kill(); await Promise.race([gone, sleep(5000)]); }
    try { child.kill('SIGKILL'); } catch { /* already gone */ }
    // its helpers can outlive it by a moment and write the profile meanwhile (seen on Linux CI), so the removal is tried again
    if (!profile) for (let i = 0; i < 30; i++) { try { rmSync(dir, { recursive: true, force: true }); break; } catch { await sleep(100); } }
  };
  for (const end = Date.now() + timeout; Date.now() < end; await sleep(100)) {
    if (failed) break;
    const at = existsSync(file) && readFileSync(file, 'utf8').split('\n')[0];
    if (!at) continue;
    const endpoint = `http://127.0.0.1:${at}`;
    if (await fetch(`${endpoint}/json/version`).then((r) => r.ok, () => false)) return { endpoint, close };
  }
  const why = failed || `DevTools did not open in ${timeout / 1000}s`;
  await close();
  throw new Error(`no browser from ${chrome}: ${why}`);
}

/*
 * A page target that is still there a moment later.
 *
 * `/json/version` answers as soon as the DevTools HTTP endpoint is up, which is
 * before the browser has settled: the `about:blank` target it lists at that
 * moment can be replaced a few hundred milliseconds later. Attaching to one
 * that is about to go is how a run died at its first measurement, and it is
 * intermittent because it is a race — the same run passed on a retry, which is
 * what kept it looking like flakiness rather than a bug.
 */
export async function pageTarget(cdp, tries = 30) {
  let last = null;
  for (let i = 0; i < tries; i++) {
    /* The whole fetch, not only the parse: a browser that is not up yet
       rejects the fetch, and a catch on `.json()` alone let that reject the
       run with a stack instead of the message below. */
    const list = await fetch(`${cdp}/json/list`).then((r) => r.json()).catch(() => []);
    const page = list.find((t) => t.type === 'page');
    if (page && last && page.id === last) return page;
    last = page ? page.id : null;
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(`no page target settled on ${cdp} — is the browser up?`);
}

/*
 * A fresh WINDOW of the one browser, for a worker of its own.
 *
 * Not a tab: headless Chrome backgrounds every tab but a window's active one,
 * and a backgrounded tab never runs requestAnimationFrame — so a settle step
 * waits on a frame that never comes, four workers each answer "got no reply
 * in 90s", and the run sits still for a quarter of an hour. A window of its
 * own is active, so it paints. Opened through the browser-level DevTools
 * socket, which is the only place Target.createTarget takes `newWindow`; the
 * target it returns is attached to directly, so the settling race
 * `pageTarget` guards against does not apply.
 */
export async function newPage(cdp) {
  const { webSocketDebuggerUrl } = await (await fetch(`${cdp}/json/version`)).json();
  const ws = new WebSocket(webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.addEventListener('open', res); ws.addEventListener('error', rej); });
  const reply = new Promise((res, rej) => {
    ws.addEventListener('message', (e) => {
      const m = JSON.parse(e.data);
      if (m.id !== 1) return;
      if (m.error) rej(new Error(JSON.stringify(m.error))); else res(m.result);
    });
  });
  ws.send(JSON.stringify({ id: 1, method: 'Target.createTarget', params: { url: 'about:blank', newWindow: true } }));
  const { targetId } = await reply;
  ws.close();
  for (let i = 0; i < 50; i++) {
    const list = await fetch(`${cdp}/json/list`).then((r) => r.json()).catch(() => []);
    const page = list.find((t) => t.id === targetId);
    if (page) return page;
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error(`the window ${targetId} never appeared on ${cdp}`);
}

/**
 * Attach to a page target and return the handful of things a gate does with
 * it: `send`, `evaluate`, `force`, `on` for an event, the browser's own
 * complaints in `trouble`, `close`, and `dead` once the connection has gone.
 */
export async function attach(page) {
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 0; const waiting = new Map();
  /*
   * A closed socket must FAIL the run, not end it.
   *
   * Nothing used to listen for `close` or `error`, so a browser that went away
   * mid-run left every pending reply pending: node found an empty event loop,
   * printed "Detected unsettled top-level await" and exited — a RED that named
   * no component, no variant and no property, three times in one afternoon.
   * Rejecting what is waiting turns the same event into one line that says
   * which browser died and when.
   */
  let dead = null;
  const bury = (why) => {
    if (dead) return;
    dead = new Error(why);
    for (const [, w] of waiting) w.rej(dead);
    waiting.clear();
  };
  ws.addEventListener('close', () => bury('the browser closed the DevTools connection mid-run'));
  ws.addEventListener('error', () => bury('the DevTools connection failed mid-run'));
  /* What the browser said went wrong since the last navigation — a request
     that failed, an exception, a console error — so a page that never rendered
     can say why instead of leaving it to be guessed. */
  const trouble = [];
  /* Who else wants an event: `on(method, fn)` returns the call that stops it. */
  const listeners = new Set();
  const on = (method, fn) => {
    const l = { method, fn };
    listeners.add(l);
    return () => listeners.delete(l);
  };
  ws.addEventListener('message', (e) => {
    const m = JSON.parse(e.data);
    if (m.method) for (const l of listeners) if (l.method === m.method) l.fn(m.params);
    if (m.id && waiting.has(m.id)) {
      const w = waiting.get(m.id);
      waiting.delete(m.id);
      if (m.error) w.rej(new Error(JSON.stringify(m.error))); else w.res(m.result);
    }
    if (m.method === 'Network.loadingFailed') trouble.push(`request failed: ${m.params.errorText} ${m.params.type} ${m.params.blockedReason || ''}`.trim());
    if (m.method === 'Runtime.exceptionThrown') trouble.push(`exception: ${(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text || '').split('\n')[0].slice(0, 200)}`);
    if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') trouble.push(`console.error: ${m.params.args.map((a) => a.value ?? a.description ?? '').join(' ').slice(0, 200)}`);
  });
  await new Promise((res, rej) => {
    ws.addEventListener('open', res);
    ws.addEventListener('close', () => rej(new Error('the browser closed the DevTools connection before it opened')));
  });
  /* And a reply that never comes is the same silence by another route. Ninety
     seconds is longer than any single render here and shorter than a person's
     patience with a run that has already stopped doing anything. */
  const send = (method, params = {}) => new Promise((res, rej) => {
    if (dead) { rej(dead); return; }
    const n = ++id;
    const timer = setTimeout(() => {
      if (!waiting.has(n)) return;
      waiting.delete(n);
      rej(new Error(`${method} got no reply in 90s — the browser has stopped answering`));
    }, 90_000);
    waiting.set(n, { res: (v) => { clearTimeout(timer); res(v); }, rej: (e) => { clearTimeout(timer); rej(e); } });
    ws.send(JSON.stringify({ id: n, method, params }));
  });
  await send('Page.enable'); await send('Runtime.enable'); await send('DOM.enable'); await send('CSS.enable');
  /*
   * The cache stays ON. It used to be disabled — a rebuilt stylesheet behind a
   * cached one once reported the PREVIOUS build's values against the current
   * spec — but a gate gives the browser a fresh profile every run, so nothing
   * from an earlier build can be in it, and with it off every one of the
   * thousand-odd navigations re-fetched the whole preview bundle: the run
   * spent more time downloading than measuring, and the load is what made
   * the first static server reset connections.
   */
  await send('Network.enable');
  /* An exception in the page is the caller's failure, not an undefined to read
     around: the carousel step clicked `.pop()` of an empty list for a day after
     a redraw moved the pager, and the TypeError went unnoticed. */
  const evaluate = async (expression) => {
    const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + ' ' + (r.exceptionDetails.exception?.description || ''));
    return r.result.value;
  };
  /*
   * Hold a pseudo-class on an element for the measurement.
   *
   * Figma draws State as an axis — Rest, Hover, Focus, Press — and those are
   * pseudo-classes the browser owns. Driving a real pointer is flaky and
   * cannot hold `:active` while a measurement runs; forcing the class is what
   * DevTools' own "toggle element state" does. Until this existed the mapping
   * carried a `state` selector nothing read, and every Hover, Focus and Press
   * variant in the library was unmeasured.
   */
  const force = async (selector, classes) => {
    const { root } = await send('DOM.getDocument', { depth: 1 });
    const { nodeId } = await send('DOM.querySelector', { nodeId: root.nodeId, selector });
    if (!nodeId) throw new Error(`state selector matched no element: ${selector}`);
    await send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: classes });
  };
  return { id: page.id, send, evaluate, force, on, trouble, close: () => ws.close(), get dead() { return dead; } };
}

/*
 * Go to a URL and wait until the page reaches `until`, one of Chrome's own
 * lifecycle names: 'load' (the default), 'DOMContentLoaded', or 'networkIdle'
 * — no request in flight for half a second, which is what a page that fills
 * itself in after load needs. Matched on the navigation's own loader, so an
 * event left over from the previous page cannot answer for this one. What the
 * browser complained of is cleared first: `trouble` is about this page.
 */
export async function navigate(tab, url, { until = 'load', timeout = 30_000, html } = {}) {
  await tab.send('Page.setLifecycleEventsEnabled', { enabled: true });
  tab.trouble.length = 0;
  /* `html` answers the request for `url` itself, so a composed document is
     loaded at a real site's own address: its stylesheets, fonts and images
     resolve over http exactly as the site's pages do. One project wrote its
     page to a file and rewrote every font URL to file:// instead. */
  let serving = null;
  if (html !== undefined) {
    await tab.send('Fetch.enable', { patterns: [{ urlPattern: url.replace(/[*?\\]/g, '\\$&'), requestStage: 'Request' }] });
    serving = tab.on('Fetch.requestPaused', (p) => {
      tab.send('Fetch.fulfillRequest', { requestId: p.requestId, responseCode: 200, responseHeaders: [{ name: 'Content-Type', value: 'text/html; charset=utf-8' }], body: Buffer.from(html).toString('base64') }).catch(() => {});
    });
  }
  const reached = new Set();
  let want = null, done;
  const there = new Promise((r) => { done = r; });
  const off = tab.on('Page.lifecycleEvent', (p) => {
    if (p.name !== until) return;
    reached.add(p.loaderId);
    if (p.loaderId === want) done();
  });
  try {
    const r = await tab.send('Page.navigate', { url });
    if (r.errorText) throw new Error(`${url}: ${r.errorText}`);
    if (!r.loaderId || reached.has(r.loaderId)) return;
    want = r.loaderId;
    let timer;
    await Promise.race([there, new Promise((_, rej) => { timer = setTimeout(() => rej(new Error(`${url} did not reach ${until} in ${timeout / 1000}s`)), timeout); })])
      .finally(() => clearTimeout(timer));
  } finally {
    off();
    if (serving) { serving(); await tab.send('Fetch.disable').catch(() => {}); }
  }
}

/*
 * Hold pseudo-classes for a measurement, the way Selectors 4 says a pointer or
 * focus holds them: `hover` and `active` match the element AND its ancestors,
 * so a `.card:hover .title` rule fires; `focus` (or `focus-visible`) puts
 * `:focus` and `:focus-visible` on the element and `:focus-within` on its
 * ancestors. `targets` is `[{ selector, pseudo, within? }]`: every element
 * `selector` matches inside `within` (the document by default), and its
 * ancestors up to `within`, so one section of a batched page never hovers its
 * neighbours. Forcing the one node, which is what a DevTools toggle does,
 * left every rule keyed on an ancestor unfired.
 *
 * All targets in one call: the document is fetched once, and fetching it again
 * resets the node ids the browser holds a forced state against, which dropped
 * every state but the last on a page of many sections.
 */
export async function forceState(tab, targets) {
  await tab.send('DOM.getDocument', { depth: 0 });
  const nodes = async (objectId) => {
    const { result } = await tab.send('Runtime.getProperties', { objectId, ownProperties: true });
    return Promise.all(result.filter((x) => /^\d+$/.test(x.name)).map(async (x) => (await tab.send('DOM.requestNode', { objectId: x.value.objectId })).nodeId));
  };
  const held = new Map();
  const hold = (nodeId, classes) => held.set(nodeId, [...new Set([...(held.get(nodeId) || []), ...classes])]);
  for (const { selector, pseudo, within = null } of targets) {
    const focus = /^focus/.test(pseudo);
    const { result } = await tab.send('Runtime.evaluate', {
      expression: `(() => {
        const scope = ${within ? `document.querySelector(${JSON.stringify(within)})` : 'document'};
        const hit = scope ? [...scope.querySelectorAll(${JSON.stringify(selector)})] : [];
        const stop = ${within ? 'scope' : 'null'};
        const above = new Set();
        for (const el of hit) for (let n = el.parentElement; n && n !== stop; n = n.parentElement) above.add(n);
        return [hit, [...above]];
      })()`,
    });
    const { result: pair } = await tab.send('Runtime.getProperties', { objectId: result.objectId, ownProperties: true });
    const [hit, above] = await Promise.all(['0', '1'].map((i) => nodes(pair.find((x) => x.name === i).value.objectId)));
    if (!hit.length) throw new Error(`state selector matched no element: ${selector}${within ? ` in ${within}` : ''}`);
    for (const n of above) hold(n, [focus ? 'focus-within' : pseudo]);
    for (const n of hit) hold(n, focus ? ['focus', 'focus-visible'] : [pseudo]);
    await tab.send('Runtime.releaseObject', { objectId: result.objectId }).catch(() => {});
  }
  for (const [nodeId, forcedPseudoClasses] of held) await tab.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses });
}

/* The page's size in CSS pixels, at scale 1 — as narrow as a phone frame,
   which a real window here would not open. */
export async function viewport(tab, width, height) {
  await tab.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
}

/* Media features as the page should see them: `{ 'prefers-color-scheme': 'dark' }`. */
export async function media(tab, features) {
  await tab.send('Emulation.setEmulatedMedia', { features: Object.entries(features).map(([name, value]) => ({ name, value })) });
}

/*
 * A PNG, base64. With a clip, the clip in page coordinates, rounded to whole
 * pixels and taken beyond the viewport if it reaches past it; without one, the
 * viewport as it stands.
 */
export async function screenshot(tab, clip) {
  const round = clip && { x: Math.round(clip.x), y: Math.round(clip.y) };
  const { data } = await tab.send('Page.captureScreenshot', clip
    ? { format: 'png', clip: { ...round, width: Math.round(clip.width + clip.x - round.x), height: Math.round(clip.height + clip.y - round.y), scale: 1 }, captureBeyondViewport: true }
    : { format: 'png', captureBeyondViewport: false });
  return data;
}

/* Run a function in the page with JSON arguments and return what it returns:
   the function travels as its source, so it can use nothing from the caller
   but the arguments. */
export async function call(tab, fn, ...args) {
  return tab.evaluate(`(${fn})(...${JSON.stringify(args)})`);
}

/* Evaluate `expression` every `every` ms until it is truthy, and return it.
   Bounded: a page that never gets there rejects, saying what it waited for. */
export async function waitFor(tab, expression, { timeout = 30_000, every = 100 } = {}) {
  for (const end = Date.now() + timeout; ; await sleep(every)) {
    const v = await tab.evaluate(expression);
    if (v) return v;
    if (Date.now() >= end) throw new Error(`waited ${timeout / 1000}s for ${expression}`);
  }
}

/*
 * Windows, opened once and reused: opening one costs about 300ms and reusing
 * it nothing, and a navigation replaces the document outright, so a released
 * window carries nothing forward but the font cache. A window is only fit to
 * reuse if its last render finished: one that timed out or threw is still
 * running whatever hung it, so the caller `discard`s it rather than `release`s
 * it, and pooling it would carry that into somebody else's measurement.
 * `acquire` marks what it hands out with `reused`.
 */
/* `env` pins what the host would otherwise decide for the machine
   (code-standard 35): the time zone and the locale every window renders in,
   set once on each new window. A colour scheme is a tier and is set per
   render by whoever opens the page. */
export function pool(endpoint, env = {}) {
  const free = [];
  return {
    async acquire() {
      while (free.length) {
        const tab = free.pop();
        if (!tab.dead) return Object.assign(tab, { reused: true });
      }
      const tab = await attach(await newPage(endpoint));
      if (env.timezone) await tab.send('Emulation.setTimezoneOverride', { timezoneId: env.timezone });
      if (env.locale) await tab.send('Emulation.setLocaleOverride', { locale: env.locale });
      return Object.assign(tab, { reused: false });
    },
    release(tab) { if (tab && !tab.dead) free.push(tab); },
    async discard(tab) {
      if (!tab) return;
      tab.close();
      await fetch(`${endpoint}/json/close/${tab.id}`).catch(() => {});
    },
  };
}

/*
 * Wait until what a screenshot of rows `top` to `top + height` will contain
 * has painted. A measurement is settled on window load, which is enough for
 * geometry and not for pixels, so a loaded machine photographs a half-painted
 * page and a pixel comparison reports a race as a difference. Two traps, both
 * hit: requestAnimationFrame never fires in a background tab (an 8s step
 * became 184s), and decode() on a loading="lazy" image that never entered the
 * viewport never settles at all. So no rAF; only the images inside the clip,
 * and only those that began loading (waiting on all of them cost 40s of a 16s
 * step and moved nothing the camera sees); and a cap on fonts and on images,
 * so this can never be what hangs a run. A shot that cannot settle is still
 * worth taking, so this never throws.
 */
export async function paintReady(tab, top, height) {
  const settle = async (top, h) => {
    const cap = (p, ms) => Promise.race([p, new Promise((r) => setTimeout(r, ms))]);
    await cap(document.fonts.ready, 2000);
    const inShot = [...document.images].filter((i) => {
      const r = i.getBoundingClientRect();
      const y = r.top + window.scrollY;
      return r.width > 0 && y < top + h && y + r.height > top;
    });
    await cap(Promise.all(inShot.map(async (i) => {
      if (!i.currentSrc) return;
      if (!i.complete) await new Promise((r) => { i.addEventListener('load', r, { once: true }); i.addEventListener('error', r, { once: true }); });
      if (i.decode) await i.decode().catch(() => {});
    })), 5000);
  };
  await call(tab, settle, top, height).catch(() => {});
}
