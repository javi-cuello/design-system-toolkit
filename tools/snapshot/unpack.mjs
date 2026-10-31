#!/usr/bin/env node
/*
 * A snapshot the plugin downloaded → the folder the router writes, with no
 * router, no project and no repo.
 *
 *   node unpack.mjs <downloaded snapshot.json> <out-dir>
 *   node unpack.mjs --zip <out.zip>     # this command and only the files it runs
 *
 * Needs Node 22.12 or later: the contract it writes is derived by a CommonJS
 * module that requires an ES module, which older Nodes refuse.
 *
 * The plugin saves one file when nothing listens on its port (0.59.0). This
 * writes it through the store the router uses (store.cjs), so per-component
 * specs, contracts, icons and previews come out as they do for a project.
 * What a project adds is left out: a release pin, a routing entry, its
 * contract options.
 *
 * `--zip` packages this file and every file it requires, followed from here,
 * so the package is the toolkit's own code on the day it is made and carries
 * nothing else.
 */
import { readFileSync, existsSync, mkdtempSync, mkdirSync, copyFileSync, rmSync, realpathSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';

const require = createRequire(import.meta.url);
const HERE = dirname(fileURLToPath(import.meta.url));

/** Every local file reached from `entry` by require(), a static import, or an import() of a literal path. */
export function closure(entry) {
  const seen = new Set();
  const visit = (file) => {
    if (seen.has(file)) return;
    seen.add(file);
    const src = readFileSync(file, 'utf8');
    for (const m of src.matchAll(/(?:require\(|from\s+|import\()\s*['"](\.{1,2}\/[^'"]+)['"]/g)) {
      const next = resolve(dirname(file), m[1]);
      if (existsSync(next)) visit(next);
    }
  };
  visit(entry);
  return [...seen];
}

export function unpack(json, outDir) {
  const store = require('./store.cjs');
  const { kind, ...payload } = json;
  if (kind !== 'library' && kind !== 'screens') throw new Error('not a downloaded snapshot: it has no "kind" (plugin 0.59.0 or later writes one)');
  const P = store.paths(resolve(outDir));
  return kind === 'library' ? store.writeLibrary(payload, P) : store.writeScreens(payload, P);
}

if ((process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url))) {
  const [major, minor] = process.versions.node.split('.').map(Number);
  if (major < 22 || (major === 22 && minor < 12)) { console.error(`unpack.mjs needs Node 22.12 or later; this is ${process.version}`); process.exit(2); }
  const args = process.argv.slice(2);
  if (args[0] === '--zip' && args[1]) {
    const root = resolve(HERE, '../..');
    const files = closure(fileURLToPath(import.meta.url));
    const stage = mkdtempSync(join(tmpdir(), 'unpack-'));
    const top = join(stage, 'snapshot-unpack');
    for (const f of files) { const to = join(top, relative(root, f)); mkdirSync(dirname(to), { recursive: true }); copyFileSync(f, to); }
    const out = resolve(args[1]);
    rmSync(out, { force: true });
    execFileSync('zip', ['-qr', out, 'snapshot-unpack'], { cwd: stage });
    rmSync(stage, { recursive: true, force: true });
    console.log(`${files.length} files → ${out}\n  run: node snapshot-unpack/${relative(root, fileURLToPath(import.meta.url))} <file>.json <out-dir>`);
  } else if (args.length === 2) {
    const r = unpack(JSON.parse(readFileSync(args[0], 'utf8')), args[1]);
    for (const l of r.lines) console.log(`${l.label}: ${l.text}`);
    if (r.refused) { console.error(`refused: ${r.refused}`); process.exit(1); }
  } else {
    console.error('usage: unpack.mjs <downloaded snapshot.json> <out-dir> | --zip <out.zip>');
    process.exit(2);
  }
}
