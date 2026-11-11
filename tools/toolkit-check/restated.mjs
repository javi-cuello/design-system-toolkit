#!/usr/bin/env node
/*
 * Prose that restates what another file owns agrees with its owner (toolkit-standard §D 22).
 *
 *   node tools/toolkit-check/restated.mjs [--root <dir>]
 *
 * A README or guide that copies a fact goes stale when the owner changes and
 * nothing fails: knowledge/README.md said nothing of §D 21's weights, a tool's
 * README left out three of its scripts, CONTRIBUTING.md listed four of a plan's
 * seven sections (2026-11-11). What a script can hold to its owner, it does:
 *   - every `node <toolkit path> --flag` in a markdown file names a file that
 *     exists, and each flag is read by that file or a script beside it;
 *   - a tool's README names every script at the top of its folder;
 *   - each value in restated.json (a version floor, a port) reads the same in
 *     prose as in the file that owns it.
 * Whether a paraphrase still means what its owner says is a read: the Docs
 * gate names the READMEs and guides that cite a standard section the work changed.
 */
import { existsSync, readdirSync, readFileSync, statSync, realpathSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// history and cases record what was true then; a case's Runs: line is check-runs.mjs's
const SKIP = /(^|\/)(CHANGELOG\.md|changelog\/|_archive\/|fixtures?\/|node_modules\/|tests\/cases\.md$)/;
const scripts = (d) => readdirSync(d).filter((n) => /\.(mjs|cjs|js)$/.test(n) && !/\.config\./.test(n) && statSync(join(d, n)).isFile());

export function check(root) {
  const found = [];
  let md;
  try { md = execFileSync('git', ['ls-files', '*.md'], { cwd: root, encoding: 'utf8' }).split('\n').filter((f) => f && !SKIP.test(f)); }
  catch { md = []; }
  const read = (f) => readFileSync(join(root, f), 'utf8');

  // commands and their flags
  for (const f of md) read(f).split('\n').forEach((line, i) => {
    for (const m of line.matchAll(/\bnode ((?:tools|skills|standards|plugins|bin)\/[^\s`'")\]]+)([^`\n|;&)]*)/g)) {
      const path = m[1].replace(/[.,:;]+$/, '');
      if (/[<>*$]/.test(path)) continue;
      if (!existsSync(join(root, path))) { found.push(`${f}:${i + 1}: runs ${path}, which does not exist`); continue; }
      if (!statSync(join(root, path)).isFile()) continue;
      const dir = dirname(join(root, path));
      const src = (/\.(mjs|cjs|js)$/.test(path) ? scripts(dir).map((n) => join(dir, n)) : [join(root, path)]).map((x) => readFileSync(x, 'utf8')).join('\n');
      for (const [flag] of m[2].matchAll(/--[a-z][\w-]*/g))
        // the whole flag, so `--check` is not passed by a script reading only `--check-all`
        if (!new RegExp(flag + '(?![\\w-])').test(src)) found.push(`${f}:${i + 1}: ${path} ${flag}: no script in ${dirname(path)}/ reads that flag`);
    }
  });

  // a tool's README names each script at the top of its folder
  const tools = join(root, 'tools');
  if (existsSync(tools)) for (const t of readdirSync(tools)) {
    const readme = join(tools, t, 'README.md');
    if (!existsSync(readme)) continue;
    const text = readFileSync(readme, 'utf8');
    for (const n of scripts(join(tools, t))) if (!/^test-/.test(n) && !text.includes(n)) found.push(`tools/${t}/README.md: does not name ${n}`);
  }

  // values a file owns, restated in prose
  const reg = join(root, 'tools/toolkit-check/restated.json');
  const facts = existsSync(reg) ? JSON.parse(readFileSync(reg, 'utf8')).facts : [];
  for (const x of facts) {
    const om = existsSync(join(root, x.owner)) && read(x.owner).match(new RegExp(x.ownerRe));
    if (!om) { found.push(`restated.json ${x.name}: ${x.owner} no longer holds /${x.ownerRe}/`); continue; }
    const want = om.slice(1).join('–');
    for (const f of md) read(f).split('\n').forEach((line, i) => {
      for (const pm of line.matchAll(new RegExp(x.proseRe, 'g'))) {
        const got = pm.slice(1).join('–');
        if (got !== want) found.push(`${f}:${i + 1}: says ${x.name} is ${got}; ${x.owner} says ${want}`);
      }
    });
  }
  return found;
}

if ((process.argv[1] && (() => { try { return realpathSync(process.argv[1]); } catch { return null; } })() === fileURLToPath(import.meta.url))) {
  const i = process.argv.indexOf('--root');
  const root = i > -1 ? resolve(process.argv[i + 1]) : resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
  const found = check(root);
  if (found.length) { console.log(found.join('\n')); process.exit(1); }
  console.log('restated prose agrees with its owners');
}
