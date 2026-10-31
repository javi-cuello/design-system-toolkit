#!/usr/bin/env node
// node tools/parity/test-hosts.mjs — from the toolkit root. The three page
// hosts against a local site and real Chrome ($CHROME, else the macOS default
// install); skips, saying so, without one.
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { createServer } from 'node:http';
import { launch, newPage, attach, navigate, viewport as setViewport, findChrome } from '../shared/cdp.mjs';
import { host, settle, declaredValue } from './hosts.mjs';

// no browser needed: a story's declared default, read back from Storybook's summary
assert.ok(declaredValue("'medium'") === 'medium' && declaredValue('true') === true && declaredValue('12') === 12, 'a summary written as code is its value');
assert.ok([null, 'null', 'undefined', '{}', '[]', '() => {}', "'a' | 'b'"].every((s) => declaredValue(s) === undefined), 'a summary that names no comparable value is no default');
console.log('ok a declared default is read as its value, and one that names none is no default');

const CHROME = findChrome();
if (!existsSync(CHROME)) {
  console.log(`skip: no Chrome at ${CHROME} — set CHROME to run tools/parity/test-hosts.mjs`);
  process.exit(77); // a skip: bin/check says "skip", never "ok"
}
let n = 0;
const ok = (name, cond) => { n++; assert.ok(cond, name); console.log('ok', name); };
const refused = (p, re) => p.then(() => false, (e) => re.test(e.message));

/*
 * A site: a stylesheet and component fragments (fragments); a Storybook-shaped
 * iframe.html that stamps the tier from its globals and keeps the args a story
 * declares, dropping `undeclared` as Storybook does (storybook); a signed-in
 * app whose /projects lists one project and whose /private sends a visitor to
 * /login (app).
 */
const STORY = `<!doctype html><html><body><div id="storybook-root"></div><script>
  const p = new URLSearchParams(location.search);
  const globals = Object.fromEntries((p.get('globals') || '').split(';').filter(Boolean).map((g) => g.split(':')));
  if (globals.theme !== 'none') document.documentElement.setAttribute('data-theme', globals.theme);
  const args = Object.fromEntries((p.get('args') || '').split(';').filter(Boolean).map((a) => a.split(':')).filter(([k]) => k !== 'undeclared'));
  window.__STORYBOOK_STORY_STORE__ = { args: { argsByStoryId: { [p.get('id')]: args } } };
  setTimeout(() => { document.getElementById('storybook-root').innerHTML = '<button class="b">' + (args.label || 'x') + '</button>'; document.body.classList.add('sb-show-main'); }, 50);
</script></body></html>`;
const APP = (body) => `<!doctype html><html><head><style>@media (prefers-color-scheme: dark) { main { color: rgb(1, 2, 3) } }</style></head><body><main class="shell">${body}</main></body></html>`;
const server = createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  const send = (type, body, code = 200, extra = {}) => { res.writeHead(code, { 'content-type': type, ...extra }); res.end(body); };
  if (url.pathname === '/main.css') return send('text/css', '.box { width: 77px; display: block } [data-theme=dark] .box { color: rgb(9, 9, 9) }');
  if (url.pathname === '/ds/box') return send('text/html', `<x-box class="box" data-q="${url.searchParams.toString()}">box</x-box>`);
  if (url.pathname === '/iframe.html') return send('text/html', STORY);
  if (url.pathname === '/projects') return send('text/html', APP('<a href="/projects/abc">one</a>'));
  // an app with its tenant in the address: / lands on it, and its links carry it
  if (url.pathname === '/') return send('text/html', '', 302, { location: '/acme/main/projects' });
  if (url.pathname === '/acme/main/projects') return send('text/html', APP('<a href="/acme/main/projects/abc">one</a>'));
  if (url.pathname === '/acme/main/projects/abc') return send('text/html', APP('the placed project'));
  if (url.pathname === '/projects/abc') return send('text/html', APP('the project'));
  if (url.pathname === '/stamped') return send('text/html', APP('a page that themes itself').replace('<html>', '<html data-theme="light">'));
  if (url.pathname === '/private') return send('text/html', '', 302, { location: '/login' });
  // the login page draws its shell a moment after load, as a client render does
  if (url.pathname === '/login') return send('text/html', '<!doctype html><p>sign in</p><script>setTimeout(() => document.body.append(Object.assign(document.createElement(\'main\'), { className: \'shell\' })), 300)</script>');
  // a picture that answers late, and pages that place it eagerly or lazily far below the fold
  if (url.pathname === '/slow.png') return void setTimeout(() => send('image/png', Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64')), 1500);
  if (url.pathname === '/dialog') return send('text/html', '<!doctype html><body><p>top</p><dialog><img loading="lazy" src="/slow.png?dialog" width="10" height="10"></dialog></body>');
  if (url.pathname === '/lazy') return send('text/html', '<!doctype html><body><p>top</p><img loading="lazy" src="/slow.png?lazy" style="display:block;margin-top:6000px;width:10px;height:10px"></body>');
  if (url.pathname === '/eager') return send('text/html', '<!doctype html><body><p>top</p><img src="/slow.png?eager" style="display:block;width:10px;height:10px"></body>');
  send('text/html', 'not here', 404);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}`;
const browser = await launch({ chrome: CHROME });
const tab = await attach(await newPage(browser.endpoint));

try {
  // ---- settle waits for what the browser is loading --------------------
  // A lazy image far below the fold never starts, and the settle waited its
  // whole 5s cap on it, twice a render (Project C's run six times slower).
  await setViewport(tab, 640, 480);
  await navigate(tab, `${BASE}/lazy`);
  let t = Date.now(); await settle(tab); const lazy = Date.now() - t;
  await navigate(tab, `${BASE}/eager`, { until: 'DOMContentLoaded' }); // before the picture answers
  t = Date.now(); await settle(tab); const eager = Date.now() - t;
  ok(`a lazy picture out of reach is not waited on (${lazy}ms), an eager one answering late is (${eager}ms)`, lazy < 1000 && eager >= 1200 && eager < 5000);
  // nor one with no box: a lazy picture in a closed <dialog> reads top 0,
  // inside the reach, and Chrome never starts it (Project C's run, 20 s
  // to 90 s, on a contact sheet's graphic)
  await navigate(tab, `${BASE}/dialog`);
  t = Date.now(); await settle(tab); const hidden = Date.now() - t;
  ok(`a lazy picture in a closed dialog is not waited on (${hidden}ms)`, hidden < 1000);

  // ---- fragments ---------------------------------------------------------
  const F = host('fragments', { base: BASE, url: '/ds/{component}?bare=1', stylesheets: ['/main.css'] });
  const html = await F.fragment('box', { size: 'lg', on: true });
  ok('a fragment is fetched with the story\'s controls as its query', /data-q="bare=1&amp;size=lg&amp;on=1"|data-q="bare=1&size=lg&on=1"/.test(html));
  await F.open(tab, [{ key: 'a', html, width: 300 }, { key: 'b', html }], { tier: 'dark', viewport: [640, 480] });
  ok('the composed page is served at the site\'s own origin', (await tab.evaluate('location.origin')) === BASE);
  ok('so the stylesheet it links loads over http and applies', (await tab.evaluate(`getComputedStyle(document.querySelector('${F.scope('a')} .box')).width`)) === '77px');
  ok('the tier is stamped on <html> and the site\'s rules for it apply', (await tab.evaluate(`getComputedStyle(document.querySelector('${F.scope('b')} .box')).color`)) === 'rgb(9, 9, 9)');
  ok('each section is as wide as asked, or hugs', (await tab.evaluate(`[...document.querySelectorAll('section')].map((s) => getComputedStyle(s).inlineSize).join(' ')`)).startsWith('300px '));
  ok('a fragment the site does not have is refused', await refused(F.fragment('nope'), /404/));

  // ---- storybook ---------------------------------------------------------
  const S = host('storybook', { base: BASE, themeGlobal: 'theme', frameGlobal: 'frame' });
  await S.open(tab, { storyId: 's--rest', args: { label: 'Go' }, tier: 'Dark' });
  ok('a story opens in its tier with its args', (await tab.evaluate(`document.querySelector('.b').textContent`)) === 'Go'
    && (await tab.evaluate(`document.documentElement.dataset.theme`)) === 'dark');
  await S.open(tab, { storyId: 's--rest', args: { label: 'Again' }, tier: 'Light' });
  ok('the next variant of the same story is THIS page, not the last one', (await tab.evaluate(`document.querySelector('.b').textContent`)) === 'Again');
  ok('an arg the story dropped is refused by name', await refused(S.open(tab, { storyId: 's--rest', args: { undeclared: 'x' }, tier: 'Dark' }), /undeclared asked "x", got undefined/));
  ok('a page that did not take the tier is refused', await refused(S.open(tab, { storyId: 's--rest', tier: 'None' }), /tier not applied/));
  {
    const tag = (p) => p.then(() => null, (e) => !!e.refused);
    ok('only a dropped arg is tagged a refusal, which the code audit reports as a suspect mapping; a page that failed otherwise is not',
      (await tag(S.open(tab, { storyId: 's--rest', args: { undeclared: 'x' }, tier: 'Dark' }))) === true && (await tag(S.open(tab, { storyId: 's--rest', tier: 'None' }))) === false);
  }
  ok('a story that never renders is refused, saying what the page was doing', await refused(
    host('storybook', { base: `${BASE}/missing`, themeGlobal: 'theme', frameGlobal: 'frame' }).open(tab, { storyId: 'x', tier: 'Dark' }), /story did not render: .*\n    page state:/));

  // ---- app ---------------------------------------------------------------
  const A = host('app', { base: BASE, shell: 'main.shell', login: '/login', params: { ':project': { page: '/projects', pattern: '^/projects/([a-z]+)$' } } });
  await A.open(tab, { route: '/projects/:project', tier: 'Dark' });
  ok('a route token is resolved from the running app', (await tab.evaluate('location.pathname')) === '/projects/abc');
  const dark = await tab.evaluate(`getComputedStyle(document.querySelector('main')).color`);
  await A.open(tab, { route: '/projects/:project', tier: 'Light' });
  ok('the tier is the colour scheme the browser reports, whichever the machine is in', dark === 'rgb(1, 2, 3)'
    && (await tab.evaluate(`getComputedStyle(document.querySelector('main')).color`)) !== 'rgb(1, 2, 3)');
  // Review 2026-10-02 item 25: the readback was the emulation, never the page
  ok('an app that stamps its own tier is refused when the stamp is not the tier asked',
    await refused(A.open(tab, { route: '/stamped', tier: 'Dark' }), /page stamps data-theme="light"/) && (await A.open(tab, { route: '/stamped', tier: 'Light' }), true));
  await F.open(tab, [{ key: 'c', html }], { tier: 'Dark', viewport: [640, 480] });
  ok('a tier named in capitals is stamped as every host reads it', (await tab.evaluate(`document.documentElement.getAttribute('data-theme')`)) === 'dark');
  ok('a route the app sends to its login page is a refused session, by name', await refused(A.open(tab, { route: '/private', tier: 'Dark' }), /sent \/private to \/login/));
  const placedApp = host('app', { base: BASE, shell: 'main.shell', login: '/login', prefix: { page: '/', pattern: '^(/[^/]+/[^/]+)/projects', except: ['/login'] }, params: { ':project': { page: '/projects', pattern: '^/projects/([a-z]+)$' } } });
  await placedApp.open(tab, { route: '/projects/:project', tier: 'Dark' });
  ok('an app with its tenant in the address opens a route under the tenant / lands on, its token resolved from placed links', (await tab.evaluate('location.pathname')) === '/acme/main/projects/abc');
  await placedApp.open(tab, { route: '/login', tier: 'Dark' });
  ok('a route the prefix excepts is opened as named', (await tab.evaluate('location.pathname')) === '/login');
  await A.open(tab, { route: '/login', tier: 'Dark' });
  ok('the login page asked for by its own route is measured, not taken for a refused session', (await tab.evaluate('!!document.querySelector("main.shell")')) === true);
} finally {
  await browser.close();
  server.close();
}
console.log(`\n${n} passed`);
