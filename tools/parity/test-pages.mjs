#!/usr/bin/env node
// node tools/parity/test-pages.mjs — from the toolkit root. The structure and
// overflow gates against real Chrome ($CHROME, else the macOS default
// install), over pages served here; skips, saying so, without one.
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { createServer } from 'node:http';
import { launch, pool, findChrome } from '../shared/cdp.mjs';
import { structure, overflow, axe } from './pages.mjs';

const CHROME = findChrome();
if (!existsSync(CHROME)) {
  console.log(`skip: no Chrome at ${CHROME} — set CHROME to run tools/parity/test-pages.mjs`);
  process.exit(77); // a skip: bin/check says "skip", never "ok"
}
let n = 0;
const ok = (name, cond) => { n++; assert.ok(cond, name); console.log('ok', name); };

const PAGES = {
  '/': '<main><h1>Jobs</h1><section aria-label="List"><h2>Today</h2><label><input type=checkbox aria-describedby=c> Design <span id=c aria-hidden=true>354</span></label><a data-job href="/companies/acme/one">one</a></section></main>',
  '/companies/acme/one': '<main><h1>One</h1></main>',
  '/companies/acme': '<main><h1>Acme</h1></main>',
  '/broken': '<h1>Outside</h1><main><h3>Jump</h3><section></section><nav></nav><label><input type=checkbox> Design <span>354</span></label><label><input type=checkbox> Top 10</label><label><input type=checkbox> UX (12)</label><input type=checkbox aria-label="Research 7"><p id="x"></p><p id="x" aria-describedby="nope"></p></main>',
  '/menus': '<style>details div{position:absolute}</style><main><h1>M</h1><details id=bad><summary>Bad</summary><div><a href=#>x</a></div></details><details id=good><summary>Good</summary><div><a href=#>y</a></div></details><details><summary>Plain</summary><p>prose</p></details><script>const g=document.getElementById("good");document.addEventListener("keydown",(e)=>{if(e.key==="Escape")g.open=false});document.addEventListener("click",(e)=>{if(!g.contains(e.target))g.open=false})</script></main>',
  '/swap-lost': '<main><h1>S</h1><form><input type=checkbox name=t value=a></form><div aria-live=polite id=r>0</div><script>document.querySelector("input").addEventListener("change",()=>{const f=document.querySelector("form");f.innerHTML=f.innerHTML;document.getElementById("r").textContent=Date.now()})</script></main>',
  '/swap-kept': '<main><h1>S</h1><form><input type=checkbox name=t value=a></form><div aria-live=polite id=r>0</div><script>document.querySelector("form").addEventListener("change",(e)=>{const f=e.currentTarget,k=e.target.value;f.innerHTML=f.innerHTML;document.getElementById("r").textContent=Date.now();f.querySelector(`input[value="${k}"]`).focus({preventScroll:true})})</script></main>',
  '/no-alt': '<main><h1>A</h1><img src="x.png"></main>',
  '/dark': '<style>.box{width:40px}@media (prefers-color-scheme: dark){.wide{width:200px}}</style><main><h1>D</h1><div class=box><div class=wide>x</div></div></main>',
  '/escape': '<style>.disc{width:120px;height:120px;padding:0}.art{width:260px;height:20px}.logo{display:block;width:60px}.wrap{width:40px}.scroll{width:40px;overflow:auto}.abs{position:absolute;left:3000px;width:10px;height:10px}</style><main><h1>E</h1><div class="disc"><div class="art"></div></div><div class="wrap"><img class="logo" src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" width="60" height="10"></div><div class="scroll"><div class="art"></div></div><div class="abs"></div></main>',
};
const server = createServer((q, r) => { const b = PAGES[new URL(q.url, 'http://x').pathname]; r.writeHead(b ? 200 : 404, { 'Content-Type': 'text/html' }); r.end(`<!doctype html><html><body style="margin:0">${b || ''}</body></html>`); });
await new Promise((r) => server.listen(0, r));
const base = `http://localhost:${server.address().port}`;
const b = await launch({ chrome: CHROME });
const tabs = pool(b.endpoint);

try {
  const good = await structure(tabs, { base, paths: ['/'], find: '[data-job]' });
  ok('a link the content decides adds its page and its parent', good.pages.join(' ') === '/ /companies/acme/one /companies/acme');
  ok('a sound page reports nothing', good.problems.length === 0);

  const bad = (await structure(tabs, { base }, '/broken')).problems.join('\n');
  for (const [what, re] of [['an h1 outside main', /h1> sits outside/], ['a heading jump', /h1 → h3/], ['an unnamed section', /unnamed <section>/], ['a count inside a checkbox\'s name', /a count inside the name of a checkbox: " Design 354"|a count inside the name of a checkbox: "Design 354"/], ['an unnamed nav', /unnamed <nav>/], ['a duplicate id', /duplicate id "x"/], ['an aria reference to nothing', /aria-describedby="nope"/]]) ok(`structure names ${what}`, re.test(bad));
  ok('a phrase that ends in a number is a label, not a count', !/Top 10/.test(bad));
  ok('a count written in parentheses or in an aria-label is a count too', /"UX \(12\)"/.test(bad) && /"Research 7"/.test(bad));

  await assert.rejects(structure(tabs, { base, paths: ['/'], find: '.nothing' }), /matched no link/);
  ok('a find that matches nothing fails rather than checking fewer pages', true);

  const esc = await overflow(tabs, { base, overflow: { widths: [800] } }, '/escape');
  const text = esc.problems.join('\n');
  ok('a child wider than its parent escapes', /escapes div\S* 260x20 in div\S* 120x120/.test(text));
  ok('a scroller holds more than it shows on purpose', esc.problems.filter((p) => /260x20/.test(p)).length === 1);
  ok('an absolute box nothing clips, past the viewport, is named', /nothing clips it/.test(text));
  ok('an unwaived image wider than its box is named', /img/.test(text));
  const waived = await overflow(tabs, { base, overflow: { widths: [800], waivers: [{ child: '^img', parent: '^div', why: 'test' }] } }, '/escape');
  ok('a waiver takes exactly its pair away', waived.problems.length === esc.problems.length - 1 && !/img/.test(waived.problems.join('\n')));

  const dead = await overflow(tabs, { base: 'http://localhost:1', overflow: { widths: [800] } }, '/');
  const inDark = await overflow({ ...tabs, acquire: tabs.acquire, release: tabs.release, discard: tabs.discard, scheme: 'dark' }, { base }, '/dark');
  const inLight = await overflow({ acquire: tabs.acquire, release: tabs.release, discard: tabs.discard, scheme: 'light' }, { base }, '/dark');
  ok('the page renders in the scheme the check gives it, whatever the machine is in', inDark.problems.length === 1 && inLight.problems.length === 0);
  const menus = (await structure(tabs, { base }, '/menus')).problems.join('\n');
  ok('a floating details menu with no Escape and no light dismiss is named twice; one that has both, and an in-flow disclosure, are not',
    /"Bad" stays open on Escape/.test(menus) && /"Bad" stays open on a click outside/.test(menus) && !/Good|Plain/.test(menus));
  const lost = (await structure(tabs, { base }, '/swap-lost')).problems.join('\n');
  const kept = (await structure(tabs, { base }, '/swap-kept')).problems.join('\n');
  ok('a live swap that drops focus is named; one that puts it back is not', /left focus on body \(code-standard 14\)/.test(lost) && !/code-standard 14/.test(kept));
  const noAlt = (await axe(tabs, { base }, '/no-alt')).problems.join('\n');
  const plainAxe = (await axe(tabs, { base }, '/companies/acme')).problems.join('\n');
  const ruledOut = (await axe(tabs, { base, axe: { disable: ['image-alt'] } }, '/no-alt')).problems.join('\n');
  ok('the axe gate names a WCAG violation by rule; a page without it, and a rule the project ruled out, do not raise it',
    /\/no-alt: image-alt \(critical\)/.test(noAlt) && !/image-alt/.test(plainAxe) && !/image-alt/.test(ruledOut) && /html-has-lang/.test(ruledOut));
  ok('a page that did not load is a problem, never a pass', dead.problems.length === 1 && /did not report/.test(dead.problems[0]));
} finally { b.close(); server.close(); }
console.log(`\n${n} passed`);
