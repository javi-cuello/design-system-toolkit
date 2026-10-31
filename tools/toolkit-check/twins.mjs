#!/usr/bin/env node
/*
 * A job two projects each wrote, before the toolkit owns it.
 *
 *   node tools/toolkit-check/twins.mjs
 *
 * `owned-check.mjs` guards the jobs the toolkit already owns; it cannot see one
 * nobody has claimed yet, and that is how two parity engines grew — each
 * project wrote its own adapter, schema and differ because the skill described
 * them instead of shipping them. This lists every code file whose name appears
 * in two project repos' own code (git-tracked, vendored and generated trees
 * left out), unless `owned.json`'s `projectOwn` rules that the name is a
 * coincidence of two genuinely project-own jobs, with the reason, or its
 * `scaffoldOwn` names it a sanctioned copy of a scaffold file (toolkit-standard
 * §D 2). A ruling names the key as this prints it, family included: a ruling
 * on the `parity` entry point does not silence a `parity.mjs`. A ruling that
 * matches nothing is listed too, since an exemption for nothing is a finding.
 *
 * A scaffold copy is compared with its source, mixins and their bodies, from
 * the first `@mixin` on: comments, braces, semicolons and whitespace dropped
 * (one copy is SCSS, another indented Sass) and every custom property name
 * read as `--*` (each project names its tokens its own way). Anything else that
 * differs is listed: a default, a declaration, an `inset`. It compared names
 * and parameter names only, and passed a copy whose hairline was planted back
 * to the inset shadow of a 240-row defect, and one whose `$width` defaulted to
 * `2px` (review S10).
 *
 * A tree that carries its own licence file (`LICENSE`, `LICENCE`, `COPYING`,
 * below the repo root) is another author's code checked in, a CMS or a
 * library, and is not read: a project's own code does not license itself
 * folder by folder. It named one CMS's folder instead, which held for one
 * project.
 *
 * By file name, extension and a partial's leading underscore stripped,
 * stylesheets included, except a component's own sheet in a folder of its
 * name (`button/_button.sass`): each project's library draws its own button.
 * It compared whole basenames over scripts only, and so stayed green while
 * one hairline mixin was written in both projects six seconds apart
 * (`_hairline.scss`, `_hairline.sass`): the twin it existed for was in a file
 * it did not read, under the extension it compared. Names are compared
 * within one family (stylesheet, script, PHP, shell, Python, a bin
 * entry point): a component's `button.scss` beside another project's
 * `button.php` is two halves of two components, not one job twice. A file the
 * toolkit's token build wrote (its banner, the test build.mjs uses to know its
 * own output) is the toolkit's job already done, not a twin.
 *
 * A name check over function definitions was tried first
 * and found nothing real: both hits were wrappers over the toolkit's own. A
 * duplicate under two different file names (one project's `lib.js` against
 * another's `cdp.mjs`) is not seen; the two-repo audit (toolkit-standard §D 2) is the backstop
 * for that. Warns: a twin is a decision to make, and toolkit-standard §D 2
 * says where it lands.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync, realpathSync } from 'node:fs';
import { join, basename, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const HERE = dirname(fileURLToPath(import.meta.url));
const contract = createRequire(import.meta.url)('../snapshot/projects.cjs');
const { projectOwn = [], scaffoldOwn = [] } = JSON.parse(readFileSync(join(HERE, 'owned.json'), 'utf8'));
const ruled = new Map([...projectOwn, ...scaffoldOwn].map((r) => [r.file, false]));

const CODE = /\.(m?js|cjs|ts|php|sh|py|s[ac]ss)$|^bin\/[^/.]+$/;
const SKIP = /(^|\/)(node_modules|vendor|dist|build)\/|\.(test|stories|d)\.|\.generated\./;
const LICENCE = /^(.+)\/(LICEN[CS]E|COPYING)(\.(md|txt))?$/;

// A repo's own code: its code files, less vendored and generated trees and any
// folder that carries its own licence.
export const ownCode = (files) => {
  const theirs = files.map((f) => f.match(LICENCE)?.[1]).filter(Boolean).map((d) => `${d}/`);
  return files.filter((f) => CODE.test(f) && !SKIP.test(f) && !theirs.some((d) => f.startsWith(d)));
};

// A stylesheet's mixins and bodies, in a form both syntaxes and any token
// naming reduce to.
export const mixins = (text) => {
  // block and line comments set aside; module lines (@use, @forward, @import)
  // too, because a copy loads its own tokens; everything else from the first
  // of them counts, so a rule placed before the first @mixin is drift as well
  const lines = text.replace(/\/\*[\s\S]*?\*\//g, '').split('\n').map((l) => l.replace(/(^|\s)\/\/.*$/, '')).filter((l) => l.trim() && !/^\s*@(use|forward|import)\b/.test(l));
  if (!lines.some((l) => /^\s*@mixin\s/.test(l))) return '';
  return lines.join(' ')
    .replace(/[{};]/g, ' ').replace(/--[\w-]+/g, '--*')
    .replace(/\s*([(),:])\s*/g, '$1').replace(/\s+/g, ' ').trim();
};

const FAMILY = { scss: 'style', sass: 'style', js: 'script', mjs: 'script', cjs: 'script', ts: 'script' };
const keyOf = (f) => {
  const m = basename(f).match(/^(.*)\.([^.]+)$/);
  if (!m) return `${basename(f)} (bin)`;
  const family = FAMILY[m[2]] || m[2];
  return `${family === 'style' ? m[1].replace(/^_/, '') : m[1]} (${family})`;
};
// The token build's own banner, as tools/tokens/build.mjs reads it to know its output.
const BUILT = /Generated from the Figma snapshot by the toolkit token build|GENERATED by bin\/tokens|Generated by bin\/tokens/;
const built = (path) => { try { return BUILT.test(readFileSync(path, 'utf8').slice(0, 300)); } catch { return false; } };

if ((process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url))) {
  const repos = new Map();
  for (const p of contract.projects().list) if (p.repo) repos.set(p.repo, p.name);

  const where = new Map();
  for (const [repo, name] of repos) {
    let files;
    try { files = execFileSync('git', ['-C', repo, 'ls-files'], { encoding: 'utf8' }).split('\n'); } catch { continue; }
    for (const f of ownCode(files)) {
      if (/\.s[ac]ss$/.test(f) && built(join(repo, f))) continue;
      if (/\.s[ac]ss$/.test(f) && basename(f).replace(/^_|\.s[ac]ss$/g, '') === basename(dirname(f))) continue;
      const b = keyOf(f);
      if (!where.has(b)) where.set(b, new Map());
      where.get(b).set(name, f);
    }
  }

  const twins = [...where].filter(([b, m]) => m.size > 1 && !(ruled.has(b) && ruled.set(b, true)));

  const drift = [];
  for (const { file, source, copies = [] } of scaffoldOwn) {
    const want = mixins(readFileSync(join(HERE, '../..', source), 'utf8'));
    for (const c of copies) {
      const at = [...repos.keys()].map((r) => join(r, c)).filter(existsSync);
      if (!at.length) drift.push(`${file}: copy ${c} is in no project repo`);
      for (const p of at) { const got = mixins(readFileSync(p, 'utf8')); if (got !== want) drift.push(`${file}: ${p} has ${got || 'no mixin'}; the scaffold has ${want}`); }
    }
  }
  const unused = [...ruled].filter(([, used]) => !used).map(([k]) => k);

  if (!twins.length && !drift.length && !unused.length) { console.log(`twins: ${repos.size} project repo(s), no file name written in two of them; scaffold copies match their source, mixin bodies included`); process.exit(0); }
  if (twins.length) console.log(`twins: ${twins.length} file name(s) in two project repos — one job twice, or rule it in owned.json`);
  for (const [b, m] of twins) console.log(`  ${b}: ${[...m].map(([n, f]) => `${n} ${f}`).join(' · ')}`);
  for (const d of drift) console.log(`twins: scaffold copy differs — ${d}`);
  for (const k of unused) console.log(`twins: owned.json rules "${k}", which no two project repos carry`);
  process.exit(1);
}
