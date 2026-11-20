#!/usr/bin/env node
// tools/claude-hooks/knowledge-read.mjs: a Knowledge: trailer names only pages the session read whole.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { trailerPages, unread } from './knowledge-read.mjs';

const TK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kb-read-'));
let n = 0;
const ok = (name, cond) => { n++; assert.ok(cond, name); console.log('ok', name); };
const call = (name, input) => JSON.stringify({ type: 'assistant', message: { content: [{ type: 'tool_use', name, input }] } });
const transcript = (...rows) => { const f = path.join(dir, `t${n}.jsonl`); fs.writeFileSync(f, rows.join('\n')); return f; };
const FORMS = 'knowledge/ui/patterns/forms.md', TABLES = 'knowledge/ui/patterns/tables.md';
const commit = `git commit -q -F - <<'EOF2'\nA change\n\nToolkit: none — app code\nKnowledge: ${FORMS}, ${TABLES}\nEOF2`;

ok('a commit\'s trailer names its pages; none — why, no trailer and a non-commit name none',
  trailerPages(commit).join() === [FORMS, TABLES].join()
  && trailerPages('git commit -m "x\n\nKnowledge: none — a token renamed"').length === 0
  && trailerPages('git commit -m "x"').length === 0
  && trailerPages(`echo "Knowledge: ${FORMS}"`).length === 0);
ok('a page read whole by Read, or by cat, counts',
  unread(commit, transcript(call('Read', { file_path: path.join(TK, FORMS) }), call('Bash', { command: `cd ~/Projects/toolkit; cat ${TABLES}` })), TK).length === 0);
ok('a section by line range, a Read with a short limit, or a grep does not',
  unread(commit, transcript(call('Bash', { command: `sed -n 5,47p ${FORMS}` }), call('Read', { file_path: path.join(TK, TABLES), offset: 340, limit: 30 })), TK).join() === [FORMS, TABLES].join()
  && unread(commit, transcript(call('Read', { file_path: path.join(TK, FORMS), limit: 10 }), call('Bash', { command: `grep -n "^#" ${TABLES}` })), TK).length === 2);
ok('a page only named in a write, or in an agent\'s prompt, is unread',
  unread(commit, transcript(call('Write', { file_path: '/x.md', content: FORMS }), call('Agent', { prompt: `read ${TABLES}` })), TK).length === 2);
ok('a transcript that cannot be read leaves every page unread', unread(commit, path.join(dir, 'missing.jsonl'), TK).length === 2);
fs.rmSync(dir, { recursive: true, force: true });
console.log(`${n}/${n} passed`);
