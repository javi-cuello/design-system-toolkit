#!/usr/bin/env node
// node tools/shared/test-cdp.mjs — from the toolkit root. Launches headless Chrome
// ($CHROME, else the macOS default install) and skips, saying so, without one.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { launch, pageTarget, newPage, attach, navigate, viewport, media, screenshot, call, waitFor, pool, paintReady, findChrome } from './cdp.mjs';

const CHROME = findChrome();
if (!existsSync(CHROME)) {
  console.log(`SKIPPED: no Chrome at ${CHROME} — set CHROME to run tools/shared/test-cdp.mjs`);
  process.exit(0);
}

let n = 0;
const ok = (name, cond) => { n++; assert.ok(cond, name); console.log('ok', name); };
// A broken driver hangs rather than failing, so every wait here is bounded.
const within = (ms, p, what) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error(`${what}: no answer in ${ms}ms`)), ms))]);
const failure = (p) => p.then(() => null, (e) => e);

// No browser where it looks: the failure says the fix, never a bare ENOENT.
const lost = await failure(launch({ chrome: join(tmpdir(), 'no-such-chrome'), timeout: 2000 }));
ok('a browser that is not there is said with its fix: install Chrome, or set CHROME', !!lost && /CHROME=/.test(lost.message));

// Pages that take their time: /slow answers after 700ms; /hang starts an
// image and never finishes it.
const PAGES = {
  '/img': '<img src="/slow"><p>x</p>',
  '/late': '<script>addEventListener("load", () => fetch("/slow").then(() => { window.done = true; }))</script>',
  '/shot': '<body style="margin:0;background:rgb(255,0,0)"><div style="height:3000px"></div>',
  '/paint': '<body style="margin:0"><img src="/slow?a" width="10" height="10"><div style="height:3000px"></div><img src="/hang" width="10" height="10">',
  '/hang-in-shot': '<body style="margin:0"><img src="/hang" width="10" height="10">',
  '/focus': '<div style="height:3000px"></div><h2 tabindex="-1" autofocus>x</h2>',
};
const PNG1 = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
const server = createServer((req, res) => {
  const path = req.url.split('?')[0];
  if (path === '/hang') { res.writeHead(200, { 'content-type': 'image/png' }); res.write(PNG1.subarray(0, 20)); return; }
  if (path === '/slow') { res.writeHead(200, { 'content-type': 'image/png' }); setTimeout(() => res.end(PNG1), 700); return; }
  res.writeHead(PAGES[path] ? 200 : 404, { 'content-type': 'text/html' });
  res.end(`<!doctype html>${PAGES[path] || ''}`);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const SITE = `http://127.0.0.1:${server.address().port}`;
const pngSize = (b64) => { const b = Buffer.from(b64, 'base64'); return b.toString('ascii', 1, 4) === 'PNG' && [b.readUInt32BE(16), b.readUInt32BE(20)]; };

const browser = await within(30_000, launch({ chrome: CHROME }), 'launch');
const CDP = browser.endpoint;
// the profile launch made: the one whose DevToolsActivePort names this browser
const PROFILE = readdirSync(tmpdir()).map((d) => join(tmpdir(), d)).find((d) => {
  try { return readFileSync(join(d, 'DevToolsActivePort'), 'utf8').split('\n')[0] === new URL(CDP).port; } catch { return false; }
});
try {
  ok('launch returns the endpoint of a browser that answers', /^http:\/\/127\.0\.0\.1:\d+$/.test(CDP)
    && (await fetch(`${CDP}/json/version`)).ok);
  ok('launch keeps the browser in a profile of its own', !!PROFILE);
  const nothing = await within(2000, failure(launch({ chrome: '/no/such/browser', timeout: 5000 })), 'launch of nothing');
  ok('launch of a browser that cannot start rejects at once, naming it', nothing instanceof Error && /\/no\/such\/browser/.test(nothing.message));
  const muteDir = mkdtempSync(join(tmpdir(), 'test-cdp-'));
  const mute = join(muteDir, 'mute');
  writeFileSync(mute, '#!/bin/sh\nexec sleep 30\n', { mode: 0o755 });
  const t = Date.now();
  const silent = await within(5000, failure(launch({ chrome: mute, timeout: 1000 })), 'launch of a silent browser');
  rmSync(muteDir, { recursive: true, force: true });
  ok('launch of a browser that never opens DevTools gives up at its timeout', silent instanceof Error && /did not open in 1s/.test(silent.message) && Date.now() - t < 3000);
  const orphan = spawnSync(process.execPath, ['--input-type=module', '-e',
    `import { launch } from ${JSON.stringify(new URL('./cdp.mjs', import.meta.url).href)}; const b = await launch({ chrome: ${JSON.stringify(CHROME)} }); console.log(b.endpoint); process.exit(0);`], { encoding: 'utf8', timeout: 30_000 });
  const left = orphan.stdout.trim();
  ok('a process that exits without close takes its browser with it', /^http/.test(left) && await fetch(`${left}/json/version`).then(() => false, () => true));

  const page = await within(15_000, pageTarget(CDP), 'pageTarget');
  const tab = await within(10_000, attach(page), 'attach');
  ok('attach opens a session on a settled page target', typeof tab.send === 'function' && tab.dead === null && tab.id === page.id);

  ok('evaluate returns the value, promises awaited', await within(5000, tab.evaluate('Promise.resolve(40 + 2)'), 'evaluate') === 42);

  const thrown = await within(5000, tab.evaluate('[].pop().x'), 'evaluate a throw').then(() => null, (e) => e);
  ok('an exception in the page rejects evaluate with what the page threw', thrown instanceof Error && /TypeError/.test(thrown.message));

  ok('call runs a function in the page with JSON arguments', await within(5000, call(tab, (a, b) => a.x + b.length, { x: 40 }, 'ab'), 'call') === 42);

  const heard = [];
  const off = tab.on('Page.lifecycleEvent', (p) => heard.push(p.name));
  await within(10_000, navigate(tab, `${SITE}/shot`), 'navigate for on');
  off();
  const count = heard.length;
  await within(10_000, navigate(tab, `${SITE}/shot`), 'navigate after off');
  ok('on hears an event, and the call it returns stops it', heard.includes('load') && heard.length === count);

  await within(10_000, navigate(tab, `${SITE}/img`, { until: 'DOMContentLoaded' }), 'navigate DOMContentLoaded');
  const early = await tab.evaluate('document.readyState !== "complete" && !!document.querySelector("p")');
  await within(10_000, navigate(tab, `${SITE}/img`), 'navigate load');
  ok('navigate waits for DOMContentLoaded or, by default, load', early && await tab.evaluate('document.readyState') === 'complete');

  await within(10_000, navigate(tab, `${SITE}/late`), 'navigate load, late fetch');
  const atLoad = await tab.evaluate('window.done === true');
  await within(10_000, navigate(tab, `${SITE}/late`, { until: 'networkIdle' }), 'navigate networkIdle');
  ok('navigate to networkIdle waits for what the page fetches after load', !atLoad && await tab.evaluate('window.done === true'));

  tab.trouble.push('left over');
  const refused = await within(10_000, failure(navigate(tab, 'http://127.0.0.1:1/')), 'navigate refused');
  ok('navigate rejects a page that cannot load, and clears trouble first', refused instanceof Error && /ERR_/.test(refused.message) && !tab.trouble.includes('left over'));

  await viewport(tab, 375, 500);
  ok('viewport sets the page size in CSS pixels', JSON.stringify(await tab.evaluate('[innerWidth, innerHeight, devicePixelRatio]')) === '[375,500,1]');

  await media(tab, { 'prefers-color-scheme': 'dark' });
  const dark = await tab.evaluate('matchMedia("(prefers-color-scheme: dark)").matches');
  await media(tab, { 'prefers-color-scheme': 'light' });
  ok('media sets what a media query answers', dark && await tab.evaluate('matchMedia("(prefers-color-scheme: light)").matches'));

  await within(10_000, navigate(tab, `${SITE}/shot`), 'navigate shot');
  ok('screenshot without a clip is the viewport', JSON.stringify(pngSize(await screenshot(tab))) === '[375,500]');
  ok('screenshot of a clip is the clip, rounded, beyond the viewport too',
    JSON.stringify(pngSize(await screenshot(tab, { x: 0.4, y: 2000, width: 9.8, height: 7 }))) === '[10,7]');

  await tab.evaluate('setTimeout(() => { window.ready = "yes"; }, 300); 1');
  ok('waitFor returns the expression once it is truthy', await within(5000, waitFor(tab, 'window.ready'), 'waitFor') === 'yes');
  const late = await within(5000, failure(waitFor(tab, 'window.never', { timeout: 300 })), 'waitFor timeout');
  ok('waitFor gives up at its timeout, naming what it waited for', late instanceof Error && /window\.never/.test(late.message));

  const win = await within(10_000, newPage(CDP), 'newPage');
  const other = await within(10_000, attach(win), 'attach a window');
  ok('newPage opens a window of its own, attachable', win.id !== page.id && await other.evaluate('1') === 1);
  other.close();

  const tabs = pool(CDP);
  const a = await within(10_000, tabs.acquire(), 'acquire');
  const b = await within(10_000, tabs.acquire(), 'acquire a second');
  ok('acquire opens a new window when none is free', a.id !== b.id && !a.reused && !b.reused);
  // code-standard 35: the time zone and the locale are the check's, never the machine's
  const pinned = pool(CDP, { timezone: 'Pacific/Auckland', locale: 'fr-FR' });
  const p = await within(10_000, pinned.acquire(), 'acquire a pinned window');
  const opts = JSON.parse(await p.evaluate('JSON.stringify(Intl.DateTimeFormat().resolvedOptions())'));
  ok('a pool pins the time zone and the locale on every window it opens', opts.timeZone === 'Pacific/Auckland' && /^fr/.test(opts.locale));
  await pinned.discard(p);
  // a window, not a background tab: a background tab never runs a rendering
  // update, so autofocus never happens there and a page measures unfocused
  await within(10_000, navigate(a, `${SITE}/focus`), 'navigate focus');
  ok('an acquired window renders: autofocus has run', await within(5000, waitFor(a, 'document.activeElement.tagName === "H2"', { timeout: 2000 }).catch(() => false), 'autofocus') === true);
  tabs.release(a);
  const again = await within(10_000, tabs.acquire(), 'acquire again');
  ok('a released window is handed out again, marked reused', again === a && again.reused);
  await within(10_000, tabs.discard(b), 'discard');
  // the browser closes a target after it answers (seen on Linux CI), so the list is read until it catches up
  let listed = [];
  for (let t = 0; t < 30; t++) { listed = await (await fetch(`${CDP}/json/list`)).json(); if (!listed.some((x) => x.id === b.id)) break; await new Promise((r) => setTimeout(r, 100)); }
  ok('discard closes the window', !listed.some((t) => t.id === b.id));
  const c = await within(10_000, tabs.acquire(), 'acquire a third');
  tabs.release(c);
  c.close();
  await within(5000, (async () => { while (!c.dead) await new Promise((r) => setTimeout(r, 20)); })(), 'the window to die');
  const fresh = await within(10_000, tabs.acquire(), 'acquire after a death');
  ok('a window that died in the pool is never handed out again', fresh !== c && !fresh.reused);

  await viewport(fresh, 200, 100);
  await within(10_000, navigate(fresh, `${SITE}/paint`, { until: 'DOMContentLoaded' }), 'navigate paint');
  await within(5000, waitFor(fresh, '[...document.images].every((i) => i.currentSrc)'), 'the images to start');
  const t0 = Date.now();
  await within(10_000, paintReady(fresh, 0, 100), 'paintReady');
  ok('paintReady waits for the images inside the clip and not those below it',
    await fresh.evaluate('document.images[0].complete') && Date.now() - t0 < 4000);
  await within(10_000, navigate(fresh, `${SITE}/hang-in-shot`, { until: 'DOMContentLoaded' }), 'navigate hang');
  await within(5000, waitFor(fresh, 'document.images[0].currentSrc'), 'the hanging image to start');
  const t1 = Date.now();
  await within(10_000, paintReady(fresh, 0, 100), 'paintReady on a hanging image');
  ok('paintReady gives up on an image that never arrives, at its cap', Date.now() - t1 >= 4500);

  const pending = tab.evaluate('new Promise(() => {})');
  tab.close();
  const why = await within(5000, pending, 'a pending call after close').then(() => null, (e) => e);
  ok('close rejects a call still waiting, and the session says it is dead',
    why instanceof Error && /closed the DevTools connection/.test(why.message) && tab.dead === why);
  const after = await within(2000, tab.send('Runtime.evaluate', { expression: '1' }), 'a call after close').then(() => null, (e) => e);
  ok('a call made after close rejects at once', after === why);
} finally {
  await browser.close();
  server.close();
}
const gone = await fetch(`${CDP}/json/version`).then(() => false, () => true);
ok('close stops the browser and removes its profile', gone && !existsSync(PROFILE));
console.log(`\n${n} passed`);
process.exit(0);
