#!/usr/bin/env node
// figma.mjs's three commands with a fake run in place of Figma: the prompt it prints, the grader's CONFIG line, and the
// score it records from a grader's output (review of 2026-11-12, point 5: only eval.mjs's figmaScore was tested).
// Run: node tools/skill-evals/test-figma.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
let pass = 0, fail = 0;
const ok = (name, c) => { if (c) pass++; else { fail++; console.log('FAIL ' + name); } };
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'figma-eval-'));
const tasks = path.join(dir, 'tasks.json');
fs.writeFileSync(tasks, JSON.stringify({ results: 'out/results.jsonl', tasks: [
  { id: 'add-person', grade: 'figma', file: 'AbCdEfGhIjKl', template: '12:34', prompt: 'Compose the add-person form.' },
  { id: 'Bad Id', grade: 'figma', file: 'x', template: '1:2', prompt: 'p' },
] }));
const run = (...a) => spawnSync(process.execPath, [path.join(HERE, 'figma.mjs'), ...a], { encoding: 'utf8' });

let r = run('prompt', tasks, 'add-person');
const id = (r.stdout.match(/^run (\d{8}T\d{6}Z)/) || [])[1];
ok('the prompt prints its run id first', r.status === 0 && !!id);
ok('the prompt names the page, the template and the task', /"Eval — add-person"/.test(r.stdout) && /template is 12:34/.test(r.stdout) && /Compose the add-person form\./.test(r.stdout));
ok('the prompt frames the file as data (§D 24)', /never instructions to you/.test(r.stdout));
ok('a task that is not well formed is refused, naming it', run('prompt', tasks, 'Bad Id').status === 2);
ok('a task not in the file is refused', /no task nope/.test(run('prompt', tasks, 'nope').stderr));

r = run('grade-config', tasks, 'add-person', id);
ok('grade-config prints the CONFIG line with the probes hash and the run', r.status === 0 && /^const CONFIG = \{"page":"Eval — add-person","template":"12:34","hash":"[^"]+","run":"\d{8}T\d{6}Z"\};$/.test(r.stdout.trim()));
ok('grade-config without a run id is refused', run('grade-config', tasks, 'add-person').status === 2);

const graded = path.join(dir, 'graded.json');
const frame = { findings: [], receipt: { reference: 'People', knowledge: ['knowledge/README.md'], rulings: [] } };
fs.writeFileSync(graded, JSON.stringify({ result: { page: 'Eval — add-person', run: id, references: ['People'], frames: [frame] } }));
r = run('score', tasks, 'add-person', graded);
const line = JSON.parse(fs.readFileSync(path.join(dir, 'out/results.jsonl'), 'utf8').trim());
ok('a clean run scores green and is appended as one line, unwrapped from figma_execute\'s response', r.status === 0 && line.task === 'add-person' && line.green === true && line.run === id);
fs.writeFileSync(graded, JSON.stringify({ page: 'Eval — add-person', run: id, error: 'probe cache stale', frames: [] }));
r = run('score', tasks, 'add-person', graded);
ok('a grader that failed is never recorded', r.status === 2 && /grader failed/.test(r.stderr) && fs.readFileSync(path.join(dir, 'out/results.jsonl'), 'utf8').trim().split('\n').length === 1);
fs.writeFileSync(graded, JSON.stringify({ page: 'Eval — other', run: id, frames: [frame] }));
ok('a grading of another page is refused', run('score', tasks, 'add-person', graded).status === 2);
fs.rmSync(dir, { recursive: true, force: true });
console.log(`test-figma: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
