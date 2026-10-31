#!/usr/bin/env node
/*
 * tools/claude-hooks/impact.mjs — who reads the files a change touches, across
 * the toolkit and every registered project. The plan gate (gates.mjs) asks for
 * it, because a plan written from what the agent already believes misses the
 * consumer it never opened; the code knows them.
 *
 *   node tools/claude-hooks/impact.mjs <file>...
 *
 * A file is looked for by its path in its repo and by its name. Where another
 * file in the repo shares the name (two gates.mjs), a hit on the bare name
 * counts only in a file in its own folder or one that also names its path or
 * folder (for a root file, only beside it). History
 * (changelogs, case-walk lines) is left out: it records, it does not consume.
 */
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { realPath } from '../shared/real-path.mjs';

const TOOLKIT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const HISTORY = /(^|\/)CHANGELOG\.md$|^standards\/changelog\/|(^|\/)tests\/cases\.md$/;

export function repos() {
  const out = [{ name: 'toolkit', dir: TOOLKIT }];
  try { out.push(...createRequire(import.meta.url)('../snapshot/projects.cjs').repos()); } catch { /* the toolkit alone */ }
  return out.map((r) => ({ ...r, dir: realPath(r.dir) }));
}

const git = (dir, ...args) => spawnSync('git', ['-C', dir, ...args], { encoding: 'utf8' }).stdout || '';
// the files in a repo naming any of these; options after '--' narrow it to a folder
const grep = (dir, ...needles) => {
  const at = needles.indexOf('--');
  const words = at < 0 ? needles : needles.slice(0, at), where = at < 0 ? [] : needles.slice(at);
  return git(dir, 'grep', '-l', '-F', ...words.flatMap((n) => ['-e', n]), ...where).split('\n').filter(Boolean);
};

/* Each file's readers: { file, readers: ['repo: path', ...] }. */
export function impact(files, all = repos()) {
  return files.map((raw) => {
    const f = path.join(realPath(path.dirname(raw)), path.basename(raw));
    const home = all.find((r) => f.startsWith(r.dir + path.sep));
    const rel = home ? path.relative(home.dir, f) : f;
    const base = path.basename(f), folder = path.basename(path.dirname(f));
    const glob = base.replace(/[*?[\]\\]/g, '\\$&');
    const twins = home ? (git(home.dir, 'ls-files', '--cached', '--others', '--exclude-standard', '--', `*/${glob}`, glob).match(/\n/g) || []).length : 1;
    const readers = new Set();
    for (const r of all) {
      // outside every repo a bare name (hosts) is everyone's word: its full path only
      let hits = home ? grep(r.dir, rel, base) : grep(r.dir, f);
      if (twins > 1) {
        // a root file's "folder" is the repo's name, which says nothing
        const keep = new Set(path.dirname(rel) !== '.' ? [...grep(r.dir, rel), ...grep(r.dir, folder)] : []);
        hits = hits.filter((h) => keep.has(h) || (r === home && path.dirname(h) === path.dirname(rel)));
      }
      for (const hit of hits) {
        if (HISTORY.test(hit) || (r === home && hit === rel)) continue;
        readers.add(`${r.name}: ${hit}`);
      }
    }
    return { file: home ? `${home.name}: ${rel}` : f, readers: [...readers].sort() };
  });
}

if (process.argv[1] && realPath(process.argv[1]) === realPath(fileURLToPath(import.meta.url))) {
  const files = process.argv.slice(2);
  if (!files.length) { console.error('usage: impact.mjs <file>...'); process.exit(2); }
  for (const { file, readers } of impact(files)) {
    console.log(`${file} (${readers.length} reader${readers.length === 1 ? '' : 's'})`);
    for (const r of readers) console.log(`  ${r}`);
  }
}
