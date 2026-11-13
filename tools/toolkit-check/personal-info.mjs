#!/usr/bin/env node
// node tools/toolkit-check/personal-info.mjs [--stdin] — the personal details the toolkit may never
// carry, in any tracked file (toolkit-standard §D 6): the repo is public. Run by bin/check beside
// the project names. research/ named people and quoted private sessions before this (2026-11-13).
//   - an email address, except noreply@anthropic.com (the commit trailer) and example.com/.org/.net;
//   - a home path /Users/<name>/, except the placeholders fixtures use (u, me, you, user, first.last…);
//   - the maintainer's name: `git config user.name` whole and each word of three letters or more,
//     accents ignored, read at run time and never written into the repo.
// Skipped: LICENSE, a line carrying "©" or "Copyright" (the author's notice), and the owner in the
// repo's own address (`git remote get-url origin`), where the repo is public anyway.
// --stdin scans one text (a commit message). Exit 0 clean, 1 with hits, 2 when it could not run.
import { execFileSync } from 'node:child_process';
import { readFileSync, realpathSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const PLACEHOLDER_MAIL = /@(?:[a-z0-9-]+\.)*example\.(?:com|org|net)$|^noreply@anthropic\.com$|@\d+x\.|^git@/i;
const PLACEHOLDER_HOME = new Set(['u', 'me', 'you', 'user', 'username', 'name', 'first.last', 'example', 'runner']);
const fold = (s) => s.normalize('NFD').replace(/\p{M}/gu, '');
const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const git = (args, cwd) => { try { return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch { return ''; } };

export function patterns(cwd = process.cwd()) {
  const name = fold(git(['config', 'user.name'], cwd));
  if (!name) console.error('personal-info: no git user.name, so the maintainer\'s name is not looked for');
  const words = name.split(/[^\p{L}]+/u).filter((w) => w.length >= 3);
  const nameRe = words.length ? new RegExp(`\\b(?:${[name, ...words].map((w) => escape(w).replace(/\s+/g, '\\s+')).join('|')})\\b`, 'i') : null;
  const remote = git(['remote', 'get-url', 'origin'], cwd);
  const owner = (remote.match(/[:/]([^/:]+)\/[^/]+?(?:\.git)?\/?$/) || [])[1] || '';
  return { nameRe, owner };
}

export function findings(line, { nameRe, owner }) {
  const out = [];
  for (const m of line.matchAll(/[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}\b/g)) {
    if (!PLACEHOLDER_MAIL.test(m[0])) out.push(`an email address (${m[0]})`);
  }
  for (const m of line.matchAll(/(?<![\w.\/])\/users\/([A-Za-z0-9._-]+)\//gi)) {
    if (!PLACEHOLDER_HOME.has(m[1].toLowerCase())) out.push(`a home path (${m[0]})`);
  }
  if (nameRe && !/©|copyright/i.test(line)) { // the author's notice names the author, by design
    let text = fold(line);
    if (owner) text = text.split(owner).join(' ');
    const m = text.match(nameRe);
    if (m) out.push(`the maintainer's name (${m[0]})`);
  }
  return out;
}

function scanText(text, label, p, hits) {
  if (text.includes('\0')) return;
  text.split('\n').forEach((line, i) => { for (const why of findings(line, p)) hits.push(`${label}:${i + 1}: ${why}`); });
}

export function scanRepo(cwd = process.cwd()) {
  const p = patterns(cwd);
  const files = execFileSync('git', ['ls-files', '-z'], { cwd, encoding: 'utf8' }).split('\0').filter(Boolean);
  const hits = [];
  for (const f of files) {
    if (f === 'LICENSE' || f.endsWith('/LICENSE')) continue;
    let buf;
    try { buf = readFileSync(join(cwd, f)); } catch { continue; }
    if (f.endsWith('.gz')) { try { buf = gunzipSync(buf); } catch { continue; } }
    scanText(buf.toString('utf8'), f, p, hits);
  }
  return hits;
}

const isMain = (() => { try { return realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url)); } catch { return false; } })();
if (isMain) {
  try {
    let hits = [];
    if (process.argv.includes('--stdin')) scanText(readFileSync(0, 'utf8'), 'message', patterns(), hits);
    else hits = scanRepo();
    if (hits.length) { console.log(hits.join('\n')); process.exit(1); }
    console.log('no personal detail');
  } catch (e) { console.error(`personal-info: could not run: ${e.message}`); process.exit(2); }
}
