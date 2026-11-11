#!/usr/bin/env node
/*
 * check-structure.mjs, on a site made here: an unnamed <section> is a finding,
 * a section named by its heading is not, a page type the site lacks is listed
 * as absent (not a finding), a redirect page is not probed, and a missing site
 * prints "not run" rather than a pass.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { check, serve } from './check-structure.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const site = fs.mkdtempSync(path.join(os.tmpdir(), 'docs-structure-'));
const page = (dir, body) => { fs.mkdirSync(path.join(site, dir), { recursive: true }); fs.writeFileSync(path.join(site, dir, 'index.html'), `<!doctype html><title>t</title><main><h1>T</h1>${body}</main>`); };
page('', '<section aria-labelledby="a"><h2 id="a">A</h2></section><div><h2>Box</h2></div>');
page('bad/', '<section class="bucket"><h2>B</h2></section>');
// the body clips, an inner box scrolls: the document reads clean while the content is cut
page('wide/', '<style>body{margin:0;overflow:hidden}main{overflow:auto;width:100vw;height:100vh}</style><div style="width:600px">wide</div>');
page('blank/', '<p>React documented: undefined</p><p>Set <code>undefined</code> to clear it.</p><p>The order is undefined when two match.</p>');
// an off-canvas menu parked beside a wrapper that clips it: nothing scrolls, so nothing runs sideways
fs.mkdirSync(path.join(site, 'drawer'), { recursive: true });
fs.writeFileSync(path.join(site, 'drawer', 'index.html'), '<!doctype html><title>t</title><style>body{margin:0}.w{overflow-x:hidden;position:relative}.d{position:absolute;top:0;left:100%;width:300px}</style><div class="w"><nav class="d" aria-label="Menu">menu</nav><main><h1>T</h1></main></div>');
page('table/', '<div style="overflow:auto"><div style="width:600px">a table that scrolls in its own region</div></div>');
fs.mkdirSync(path.join(site, 'moved'), { recursive: true });
fs.writeFileSync(path.join(site, 'moved', 'index.html'), '<!doctype html><meta http-equiv="refresh" content="0; url=/"><title>t</title>');
try {
  const found = await check(site, ['', 'bad/', 'gone/', 'moved/', 'wide/', 'table/', 'blank/', 'drawer/']);
  assert.deepEqual(found, ['/bad/: unnamed <section class="bucket">', '/blank/: prints "undefined": "React documented: undefined" in <p>', '/wide/: runs sideways at 320px: main is 600px wide in 320px']);
  assert.deepEqual(check.absent, ['gone/']);
  assert.deepEqual(check.redirects, ['moved/']);
  console.log('ok an unnamed section is found, a named one and a div are not, an absent page type and a redirect are listed, not findings');
  console.log('ok a page that runs sideways at 320px inside a clipping body is found; a box scrolling inside main and a clipped off-canvas menu are not');
  console.log('ok "undefined" printed in text is found, inside code or as a word in prose it is not');
  const out = execFileSync('node', [path.join(HERE, 'check-structure.mjs'), path.join(site, 'nothing')], { encoding: 'utf8' });
  assert.match(out, /^not run: no built site/);
  console.log('ok no built site is "not run", never "clean"');
  // the folder's server reads nothing beside it: a sibling sharing its name's start is outside, and so is another Host
  fs.mkdirSync(path.join(site, 'in')); fs.mkdirSync(path.join(site, 'in-old'));
  fs.writeFileSync(path.join(site, 'in', 'a.txt'), 'in'); fs.writeFileSync(path.join(site, 'in-old', 'b.txt'), 'out');
  const srv = await serve(path.join(site, 'in'));
  const get = (p, host) => new Promise((done) => http.get(srv.base + p, host ? { headers: { host } } : {}, (r) => { r.resume(); done(r.statusCode); }));
  try {
    assert.equal(await get('a.txt'), 200);
    assert.equal(await get('..%2Fin-old%2Fb.txt'), 403);
    assert.equal(await get('a.txt', 'attacker.example'), 421);
  } finally { srv.close(); }
  console.log('ok the site server keeps to its folder (a sibling named like it is outside) and to its own Host');
} finally { fs.rmSync(site, { recursive: true, force: true }); }
