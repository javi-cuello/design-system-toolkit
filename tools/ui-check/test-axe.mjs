#!/usr/bin/env node
// node tools/ui-check/test-axe.mjs — axe fires on a page that breaks a WCAG rule and
// is quiet on one that keeps it, so the vendored copy is known to load and run.
// Needs Chrome ($CHROME, else the macOS default install); skips, saying so, without one.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { axePages } from './axe.mjs';

const CHROME = (await import('../shared/cdp.mjs')).findChrome();
if (!fs.existsSync(CHROME)) { console.log(`skip: no Chrome at ${CHROME}; nothing ran`); process.exit(0); }
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ui-axe-'));
const write = (name, body) => { const f = path.join(dir, name); fs.writeFileSync(f, `<!doctype html><html lang="en"><title>t</title><main><h1>Page</h1>${body}</main></html>`); return 'file://' + f; };
const bad = write('bad.html', '<img src="x.png"><button></button>');
const good = write('good.html', '<img src="x.png" alt="A chart"><button>Save</button>');
const [b, g, off] = [...await axePages([bad, good]), ...await axePages([bad], { disable: ['image-alt', 'button-name'] })];
let n = 0;
const ok = (name, cond) => { n++; assert.ok(cond, name); console.log('ok', name); };
ok('an image with no alt is a violation', b.violations.some((v) => v.id === 'image-alt'));
ok('a button with no name is a violation', b.violations.some((v) => v.id === 'button-name'));
ok('a page keeping both rules is clean', g.violations.length === 0);
ok('--disable turns a rule off', !off.violations.some((v) => v.id === 'image-alt' || v.id === 'button-name'));
fs.rmSync(dir, { recursive: true, force: true });
console.log(`${n}/${n} passed`);
