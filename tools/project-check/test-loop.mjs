#!/usr/bin/env node
// tools/project-check/loop.mjs over a throwaway repo: each rule fed what it must
// refuse and what it must allow. Run by bin/check.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { where, undeclared, renderChanged, pipedVerdicts, trailerReport, pages, unread, knowledgeReport } from './loop.mjs';

const TOOLKIT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
let n = 0;
const ok = (name, cond) => { n++; assert.ok(cond, name); console.log('ok', name); };

ok('a toolkit file is an answer, with words after it; a "none" needs its reason in three words',
  where('standards/code-standard.md rule 64', TOOLKIT) === null
  && where('none — the copy of one posting', TOOLKIT) === null
  && /three words/.test(where('none — content', TOOLKIT))
  && /not a file/.test(where('standards/no-such.md', TOOLKIT))
  && /empty/.test(where('  ', TOOLKIT)));

const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'loop-'));
const g = (...a) => execFileSync('git', ['-C', repo, ...a], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
const commit = (file, msg) => { fs.mkdirSync(path.dirname(path.join(repo, file)), { recursive: true }); fs.writeFileSync(path.join(repo, file), String(Math.random())); g('add', file); g('-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-q', '-m', msg); return g('rev-parse', 'HEAD'); };
g('init', '-q');
const base = commit('README', 'start');
commit('content/jobs/a.txt', 'content only');
commit('site/a.php', 'a fix that says where\n\nToolkit: standards/code-standard.md rule 64');
commit('site/b.php', 'a fix that says nothing');
commit('site/c.php', 'a fix with a thin none\n\nToolkit: none — local');
commit('assets/x.css', 'a fix naming a file that is not there\n\nToolkit: skills/nope/SKILL.md');
const bad = undeclared(repo, `${base}..HEAD`, ['content/'], TOOLKIT);
ok('a commit with no trailer, a thin "none" and a missing file are named; a content-only commit and a good trailer are not',
  JSON.stringify(bad.map((b) => b.subject)) === JSON.stringify(['a fix naming a file that is not there', 'a fix with a thin none', 'a fix that says nothing']));

const unseen = undeclared(repo, `${'1'.repeat(40)}..HEAD`, [], TOOLKIT);
ok('a range whose base this clone has never seen says to fetch, and only that; a bad range of another kind does not say fetch',
  /fetch/.test(unseen[0].why) && !/trailer|commit\(s\)/.test(trailerReport(unseen, 'x..HEAD'))
  && !/fetch/.test(undeclared(repo, 'HEAD..nonsense..', [], TOOLKIT)[0].why)
  && /1 commit\(s\)[\s\S]*add a trailer/.test(trailerReport([{ sha: 'abc', subject: 's', why: 'no Toolkit: trailer' }], 'a..b'))
  && trailerReport([], 'a..b') === null);

ok('a render is followed only where a path it reads changed; without a base, nothing can be said',
  renderChanged(repo, base, ['assets/']) === 'assets/x.css'
  && renderChanged(repo, base, ['templates/']) === null
  && /no base/.test(renderChanged(repo, '', ['assets/'])));

ok('code-standard 49: a check piped on is named; one captured whole, a script with pipefail, and a pipe of plain output are not',
  JSON.stringify(pipedVerdicts('#!/bin/sh\nbin/check | tail -5\nnode tools/parity/run.mjs --repo . | grep RED\nOUT=$(node tools/project-check/check.mjs --repo .); ST=$?\nprintf "%s" "$OUT" | sed s/^/x/\nbin/check || FAIL=1')) === JSON.stringify(['2  bin/check | tail -5', '3  node tools/parity/run.mjs --repo . | grep RED'])
  && pipedVerdicts('set -o pipefail\nbin/check | tail').length === 0
  && pipedVerdicts('OUT=$(bin/check 2>&1 | tail -5); ST=$?').length === 1
  && pipedVerdicts('# never use set -o pipefail\nbin/check | tail').length === 1
  && pipedVerdicts('{ bin/check; } 2>&1 | tee log').length === 1);

ok('a lesson is a toolkit file: a directory, a path outside the toolkit and git\'s own files are not',
  ['.', '..', 'tools', '.git/HEAD', '/etc/hosts'].every((p) => /not a file/.test(where(p, TOOLKIT))) && where('README.md', TOOLKIT) === null);

ok('a Knowledge: value names pages under knowledge/, or "none" with its reason; anything else is refused',
  pages('knowledge/ui/patterns/dialogs.md, knowledge/ui/design/visual.md', TOOLKIT) === null
  && pages('~/Projects/toolkit/knowledge/code/tokens.md', TOOLKIT) === null
  && pages('knowledge/ui/patterns/forms.md (Keeping input), knowledge/ui/patterns/settings.md', TOOLKIT) === null
  && pages('none — a token renamed, nothing drawn', TOOLKIT) === null
  && /three words/.test(pages('none — tiny', TOOLKIT))
  && /not a page/.test(pages('knowledge/ui/patterns/dialogs.md standards/code-standard.md', TOOLKIT))
  && /not a page/.test(pages('knowledge/ui/patterns/nope.md', TOOLKIT))
  && /empty/.test(pages(' ', TOOLKIT)));

const kbBase = g('rev-parse', 'HEAD');
const T = '\n\nToolkit: none — a test fixture only';
commit('src/lib/rules.ts', `logic only${T}`);
commit('src/a-dialog.tsx', `a dialog that names its pages${T}\nKnowledge: knowledge/ui/patterns/dialogs.md`);
commit('src/b.scss', `a stylesheet that names none${T}`);
commit('src/c.tsx', `a component with a thin none${T}\nKnowledge: none — tiny`);
commit('src/d.tsx', `a component naming a standard${T}\nKnowledge: standards/code-standard.md`);
commit('content/e.html', `content only${T}`);
commit('src/f.tsx', 'a component whose trailers are split\n\nToolkit: none — a test fixture only\nKnowledge: knowledge/ui/patterns/dialogs.md\n\nCo-Authored-By: A <a@b.c>');
const kb = unread(repo, `${kbBase}..HEAD`, ['content/'], TOOLKIT);
ok('an interface commit with no Knowledge: trailer (one written above the last paragraph says so), a thin none or a page outside knowledge/ is named; logic, content and a good trailer are not',
  JSON.stringify(kb.map((b) => b.subject)) === JSON.stringify(['a component whose trailers are split', 'a component naming a standard', 'a component with a thin none', 'a stylesheet that names none'])
  && /last paragraph/.test(kb[0].why)
  && /4 commit\(s\)[\s\S]*add a trailer: "Knowledge: <knowledge page>/.test(knowledgeReport(kb, 'a..b'))
  && knowledgeReport([], 'a..b') === null);

fs.rmSync(repo, { recursive: true, force: true });
console.log(`${n}/${n} passed`);
