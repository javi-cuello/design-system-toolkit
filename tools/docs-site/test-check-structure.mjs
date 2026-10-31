#!/usr/bin/env node
/*
 * check-structure.mjs, on a site made here: an unnamed <section> is a finding,
 * a section named by its heading is not, a page type the site lacks is listed
 * as absent (not a finding), a redirect page is not probed, and a missing site
 * prints "not run" rather than a pass.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { check } from './check-structure.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const site = fs.mkdtempSync(path.join(os.tmpdir(), 'docs-structure-'));
const page = (dir, body) => { fs.mkdirSync(path.join(site, dir), { recursive: true }); fs.writeFileSync(path.join(site, dir, 'index.html'), `<!doctype html><title>t</title><main><h1>T</h1>${body}</main>`); };
page('', '<section aria-labelledby="a"><h2 id="a">A</h2></section><div><h2>Box</h2></div>');
page('bad/', '<section class="bucket"><h2>B</h2></section>');
fs.mkdirSync(path.join(site, 'moved'), { recursive: true });
fs.writeFileSync(path.join(site, 'moved', 'index.html'), '<!doctype html><meta http-equiv="refresh" content="0; url=/"><title>t</title>');
try {
  const found = await check(site, ['', 'bad/', 'gone/', 'moved/']);
  assert.deepEqual(found, ['/bad/: unnamed <section class="bucket">']);
  assert.deepEqual(check.absent, ['gone/']);
  assert.deepEqual(check.redirects, ['moved/']);
  console.log('ok an unnamed section is found, a named one and a div are not, an absent page type and a redirect are listed, not findings');
  const out = execFileSync('node', [path.join(HERE, 'check-structure.mjs'), path.join(site, 'nothing')], { encoding: 'utf8' });
  assert.match(out, /^not run: no built site/);
  console.log('ok no built site is "not run", never "clean"');
} finally { fs.rmSync(site, { recursive: true, force: true }); }
