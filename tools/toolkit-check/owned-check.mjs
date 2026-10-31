#!/usr/bin/env node
/*
 * A job the toolkit owns is called, never written again here.
 *
 *   node tools/toolkit-check/owned-check.mjs --repo <path>
 *
 * Every repo's own check runs this, so the answer arrives before a push
 * rather than in an audit months later. It reads `owned.json` — the jobs, the
 * module that does each, the files a repo must not have and the names that
 * only exist because someone re-implemented one — and fails naming the job and
 * what to call instead.
 *
 * A definition is a finding; a use is not. A repo that takes a name from the
 * toolkit (`const { parseColour } = require(…toolkit…)`) is doing exactly what
 * this asks, and aliasing it locally is still a use.
 *
 * Written after an audit found about twenty pieces of one loop written twice
 * across two repos, each side carrying fixes the other lacked. The rule that
 * prevents it (code-standard 59) is a habit; this is the half that does not
 * depend on anybody remembering.
 */
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, relative, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { walkRepo } from '../shared/walk.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const TOOLKIT = resolve(HERE, '..', '..');
const arg = (flag, fallback) => { const i = process.argv.indexOf(flag); return i === -1 ? fallback : process.argv[i + 1]; };
const repo = arg('--repo', process.cwd());
const { owned } = JSON.parse(readFileSync(join(HERE, 'owned.json'), 'utf8'));

const files = walkRepo(repo, ['.js', '.mjs', '.cjs', '.ts'], { reject: (_, name) => /\.(test|stories)\./.test(name) });

const findings = [];
for (const entry of owned) {
  for (const f of entry.files || []) {
    if (existsSync(join(repo, f)) && statSync(join(repo, f)).isFile()) {
      findings.push([entry.job, `${f} exists — that job is ${entry.module}`]);
    }
  }
  for (const file of files) {
    const text = readFileSync(file, 'utf8');
    // The names this file takes from the toolkit: used, not re-implemented. A project names the toolkit in the path;
    // a file inside the toolkit takes an owner by a relative path, which counts once it resolves into the toolkit
    // (without it, every module that imported an owner and handed its code on was flagged as defining it)
    const toolkitPath = (spec) => /toolkit|skills\/|\/snapshot\//.test(spec) || (/^['"`]?\.\.?\//.test(spec) && resolve(dirname(file), spec.replace(/^['"`]|['"`]$/g, '')).startsWith(TOOLKIT + '/'));
    const imported = new Set();
    for (const m of text.matchAll(/(?:const|let|var)\s*\{([^}]*)\}\s*=\s*(?:await\s+)?(?:require|import)\s*\(([^)]*)\)/g)) {
      if (!toolkitPath(m[2].trim())) continue;
      for (const part of m[1].split(',')) imported.add(part.split(':')[0].trim());
    }
    for (const m of text.matchAll(/import\s*\{([^}]*)\}\s*from\s*['"]([^'"]*)['"]/g)) {
      if (!toolkitPath(m[2].trim())) continue;
      for (const part of m[1].split(',')) imported.add(part.split(/\s+as\s+/)[0].trim());
    }
    // A whole module taken under one name (`const store = require(…toolkit…)`,
    // `import * as V from …`) is a use too, and what a wrapper calls through.
    for (const m of text.matchAll(/(?:const|let|var)\s+(\w+)\s*=\s*(?:await\s+)?(?:require|import)\s*\(([^)]*)\)/g)) {
      if (toolkitPath(m[2].trim())) imported.add(m[1]);
    }
    for (const m of text.matchAll(/import\s+\*\s+as\s+(\w+)\s+from\s*['"]([^'"]*)['"]/g)) {
      if (toolkitPath(m[2].trim())) imported.add(m[1]);
    }
    // The owner is not a duplicate of itself. Without this the check could
    // never be pointed at the toolkit — where every owner lives — so the one
    // gate for "one job, one owner" ran everywhere except the repo that holds
    // the owners. Run there the first time, it printed 23 findings: 21 owners
    // flagging themselves and 2 real third copies nobody had seen.
    const rel = relative(repo, file);
    if ((entry.owners || []).some((o) => rel.startsWith(o))) continue;
    for (const name of entry.names || []) {
      if (imported.has(name)) continue;
      const defines = new RegExp(`(?:^|\\n)[^\\n]*(?:export\\s+)?(?:async\\s+)?(?:function\\s+${name}\\b|(?:const|let|var)\\s+${name}\\s*=)[^\\n]*`, 'g');
      for (const m of text.matchAll(defines)) {
        // A wrapper over the toolkit's own is a use: a project may name its
        // tolerance or its paths around a shared part, and often should.
        const body = text.slice(m.index, text.indexOf('\n\n', m.index) + 1 || m.index + 400);
        if ([...imported].some((i) => new RegExp(`\\b${i}\\b`).test(body))) continue;
        findings.push([entry.job, `${relative(repo, file)} defines \`${name}\` — call ${entry.module}`]);
      }
    }
  }
}

if (!findings.length) {
  console.log(`shared: ${owned.length} job(s) the toolkit owns, none re-implemented here`);
  process.exit(0);
}
console.log(`shared: ${findings.length} finding(s) — a job the toolkit owns is written again in this repo`);
for (const [job, what] of findings) console.log(`  [${job}] ${what}`);
console.log('  A fix that is not about this project belongs in the toolkit, in the same change (code-standard 59).');
process.exit(1);
