#!/usr/bin/env node
// tools/component-contract/read-cache.mjs: the self reading's page answers, kept by what the page and the question are.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { recorder, pageKey, pageCodeFiles, cacheOff } from './read-cache.mjs';
import { authoredWidth } from '../parity/external.mjs';

let n = 0;
const ok = (name, cond) => { n++; assert.ok(cond, name); console.log('ok', name); };
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'read-cache-'));

// a fake page: evaluate answers by the expression, counting each launch and each question asked of it
const page = () => {
  const p = { launched: 0, asked: [], rendered: [] };
  p.live = async () => { p.launched++; return { evaluate: async (expr) => { p.asked.push(expr); return { echo: expr.length, at: p.rendered.at(-1) } } }; };
  return p;
};
const walker = (sel) => document.querySelector(sel);
const exprOf = (fn, ...args) => `(${fn})(...${JSON.stringify(args)})`;
// one combination: rendered, then walked, then a question that follows the walk
const run = async (p, key, fn = walker, { args = ['#a'] } = {}) => {
  const rec = recorder({ key, dir, live: p.live });
  await rec.reset('combo-1', async () => { p.rendered.push('combo-1'); });
  const raw = await rec.step('eval', exprOf(fn, ...args), (t) => t.evaluate(exprOf(fn, ...args)));
  const after = await rec.step('eval', exprOf(() => 1), (t) => t.evaluate(exprOf(() => 1)));
  await rec.close();
  return { raw, after, stats: rec.stats };
};

{
  const first = page(), cold = await run(first, 'k1');
  ok('a cold cache asks the page: Chrome launched once, the render replayed before the first question', first.launched === 1 && first.rendered.length === 1 && first.asked.length === 2 && cold.stats.misses === 1);
  const again = page(), warm = await run(again, 'k1');
  ok('the same page and the same questions are answered from the cache: no Chrome, no render, the same answers', again.launched === 0 && again.rendered.length === 0 && JSON.stringify(warm) .includes('"hits":2') && JSON.stringify(warm.raw) === JSON.stringify(cold.raw) && JSON.stringify(warm.after) === JSON.stringify(cold.after));
  const walked = page(); await run(walked, 'k1', (sel) => document.querySelectorAll(sel));
  ok('a change to the walker\'s source misses: the page is launched and rendered again', walked.launched === 1 && walked.rendered.length === 1);
  const otherArgs = page(); await run(otherArgs, 'k1', walker, { args: ['#b'] });
  ok('a change to the walk\'s arguments misses', otherArgs.launched === 1);
  const otherPage = page(); await run(otherPage, 'k2');
  ok('another page (its key) misses', otherPage.launched === 1);
  // a question after a changed one misses too: the chain carries every question before it since the render
  const chain = page(); await run(chain, 'k1', (sel) => document.getElementById(sel));
  ok('a question after a changed one is asked of the page too (the chain), though its own text is unchanged', chain.asked.length === 2);
  const kept = page(); await run(kept, 'k1', (sel) => document.getElementById(sel));
  ok('and both are kept after', kept.launched === 0);
}

// an answer the cache handed out is a copy: the reader's edits to it never reach the cache
{
  const p = page(), rec = recorder({ key: 'k3', dir, live: p.live });
  await rec.reset('c', async () => {});
  const got = await rec.step('eval', 'x', async () => ({ list: [1] }));
  got.list.push(2);
  await rec.close();
  const q = page(), rec2 = recorder({ key: 'k3', dir, live: q.live });
  await rec2.reset('c', async () => {});
  ok('an answer is kept as the page gave it, not as the reader edited it', JSON.stringify(await rec2.step('eval', 'x', async () => null)) === '{"list":[1]}' && q.launched === 0);
}

// a replay that disagrees with the cache stops the reading (a stale answer is a wrong measure), and drops the scope
{
  const seed = recorder({ key: 'k4', dir, live: page().live });
  await seed.reset('c', async () => {});
  await seed.step('eval', 'one', async () => 1);
  await seed.close();
  const rec = recorder({ key: 'k4', dir, live: page().live });
  await rec.reset('c', async () => {});
  await rec.step('eval', 'one', async () => 2);
  let threw = null; try { await rec.step('eval', 'two', async () => 3); } catch (e) { threw = e.message; }
  ok('a cached answer the page no longer gives, found on a replay, stops the reading', /disagrees/.test(threw || ''));
  let launched = 0;
  const after = recorder({ key: 'k4', dir, live: async () => { launched++; return { evaluate: async () => 1 }; } });
  await after.reset('c', async () => {}); await after.step('eval', 'one', (t) => t.evaluate('one'));
  ok('and the scope it was found in is dropped, so the next reading asks the page', launched === 1);
}

// a send the cache cannot key (node ids) takes the scope live and keeps nothing after it
{
  const p = page(), live = p.live;
  p.live = async () => { const t = await live(); t.send = async () => ({}); return t; };
  const rec = recorder({ key: 'k5', dir, live: p.live });
  await rec.reset('c', async () => { p.rendered.push('c'); });
  await rec.send('DOM.getDocument', {});
  await rec.step('eval', 'q', (t) => t.evaluate('q'));
  await rec.close();
  const q = page(); const rec2 = recorder({ key: 'k5', dir, live: q.live });
  await rec2.reset('c', async () => {});
  await rec2.step('eval', 'q', (t) => t.evaluate('q'));
  ok('a send goes to the page and nothing after it is kept', p.rendered.length === 1 && q.launched === 1);
}

// the page's key: its served files, Chrome, the fonts, the system and the node code that drives the page; never the
// reader's interpretation (derive.cjs), so a change to how a reading is interpreted keeps every answer
{
  const base = { files: { 'index.html': 'a' }, chrome: 'Chrome 140.0.1', fonts: 'f', system: 'darwin 1', code: 'c' };
  ok('the page key moves with each of its inputs', ['files', 'chrome', 'fonts', 'system', 'code'].every((k) => pageKey({ ...base, [k]: k === 'files' ? { 'index.html': 'b' } : 'x' }) !== pageKey(base)) && pageKey(base) === pageKey({ ...base }));
  const files = pageCodeFiles().map((f) => path.basename(f));
  ok('the node code in the page key is the code that drives Chrome (cdp.mjs), not the reader\'s interpretation (derive.cjs, from-code.mjs)', files.includes('cdp.mjs') && !files.includes('derive.cjs') && !files.includes('from-code.mjs'));
}

// the matched styles a read asks of an element come through the cache where one is given, never from the tab
{
  const tab = { send: async () => { throw new Error('asked Chrome'); } };
  const levels = [[{ cssProperties: [{ name: 'width', value: '12px' }] }]];
  const cache = Object.assign(new Map(), { through: async () => ({ levels }) });
  ok('a cache with `through` answers the matched styles, and Chrome is not asked', (await authoredWidth(tab, '#x', 'width', { cache })) === 12);
}

ok('TOOLKIT_READ_CACHE=off turns it off', (process.env.TOOLKIT_READ_CACHE = 'off', cacheOff()) && (delete process.env.TOOLKIT_READ_CACHE, !cacheOff()));

fs.rmSync(dir, { recursive: true, force: true });
console.log(`${n} passed`);
