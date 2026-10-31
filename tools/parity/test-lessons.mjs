#!/usr/bin/env node
// lessons.mjs: what a project rules anew is listed when a run is accepted, a
// ruling two projects share is a toolkit candidate, and a stylesheet comment
// that explains a deviation from the design counts as a ruling. Run by bin/check.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { lessons, lessonsIndex, deviations, triage } from './lessons.mjs';

let n = 0;
const ok = (name, cond) => { n++; assert.ok(cond, name); console.log('ok', name); };

const ring = { reason: 'the focus ring sits 2px inside the control where the design draws it 2px outside; the stroke width token is derived', fix: 'figma', within: 4 };
const mine = [
  { target: 'button', key: 'Focus ring.-ring-offset', waiver: ring },
  { target: 'chip', key: 'Label.line-height', waiver: { reason: 'the page leaves it', decision: 'unset' } },
  { target: 'old', key: 'Box.width', waiver: 'old string' },
  // one ruling shared through a base chain: one lesson, on two targets
  { target: 'home', key: 'Title.width', waiver: { reason: 'the count says how many people the pool holds, a sample', content: true, within: 10 } },
  { target: 'home--402', key: 'Title.width', waiver: { reason: 'the count says how many people the pool holds, a sample', content: true, within: 10 } },
];
const previous = lessonsIndex([{ target: 'old', key: 'Box.width', waiver: 'old string' }]);
const theirs = [{ project: 'other', declared: [
  { target: 'input', key: 'Ring.-ring-offset', waiver: { reason: 'the focus ring sits 2px inside the control, where the design draws it 2px outside', fix: 'figma', within: 4 } },
  { target: 'list', key: 'Count.width', waiver: { reason: 'the count holds a sample of the people', content: true, within: 5 } },
] }];
const got = lessons(mine, previous, theirs);
ok('a ruling new since the last accepted run is listed, with its owner; one recorded before is not',
  got.length === 3 && got[0].key === 'Focus ring.-ring-offset' && got[0].owner === 'fix:figma' && got[1].owner === 'unset' && !got.some((l) => l.target === 'old'));
ok('one ruling shared by two targets is one lesson, naming both', got[2].key === 'Title.width' && got[2].on.join() === 'home,home--402');
ok('a ruling another project makes on the same property in the same words is a toolkit candidate; generic words alone are not',
  got[0].candidate === 'other: Ring.-ring-offset' && got[1].candidate === null && got[2].candidate === null
  && lessons(mine, previous, [{ project: 'other', declared: [{ target: 'x', key: 'Ring.-ring-width', waiver: ring }] }])[0].candidate === null);
ok('the index is the sorted set of target and key', JSON.stringify(lessonsIndex([{ target: 'b', key: 'k' }, { target: 'a', key: 'k' }, { target: 'a', key: 'k' }])) === JSON.stringify(['a\u0000k', 'b\u0000k']));

// A stylesheet comment that explains why the code differs from the design is
// the signal §D 8 names; three of the four lessons a review moved were comments.
const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'parity-lessons-'));
fs.mkdirSync(path.join(repo, 'styles/node_modules/x'), { recursive: true });
fs.writeFileSync(path.join(repo, 'styles/_hairline.scss'), '// a rule\n// Figma draws the divider as an OUTSIDE stroke, so it is an outer shadow here\n.a { x: 1 }\n/* the design puts the ring 2px outside the box */\n');
fs.writeFileSync(path.join(repo, 'styles/plain.css'), '/* nothing to see */\n');
fs.writeFileSync(path.join(repo, 'styles/node_modules/x/v.css'), '/* Figma draws nothing here */\n');
const found = deviations(repo, ['styles']);
ok('a comment that says what the design draws is a ruling, by file and line; a vendored tree is not read',
  found.length === 2 && found[0].target === 'styles/_hairline.scss' && found[0].line === 2 && /^comment "/.test(found[0].key) && /outer shadow/.test(found[0].waiver.reason) && found[1].line === 4);

ok('a comment is keyed by what it says: moved down a line it is the same lesson, reworded it is a new one',
  (() => { const k = (t) => lessonsIndex(t.map((d) => ({ target: d.target, key: d.key })));
    const before = k(found);
    const moved = found.map((d) => ({ ...d, line: d.line + 1 }));
    const reworded = [{ ...found[0], key: 'comment "Figma draws something else entirely"' }, found[1]];
    return JSON.stringify(k(moved)) === JSON.stringify(before) && JSON.stringify(k(reworded)) !== JSON.stringify(before); })());
fs.rmSync(repo, { recursive: true, force: true });

const TK = new URL('../..', import.meta.url).pathname;
ok('an accept with lessons waits for where they went: a toolkit file that exists, or a reasoned none; a blank, a vague place or a missing file is refused',
  /--triaged/.test(triage(got, undefined, TK)) && /empty/.test(triage(got, '  ', TK)) && /not a file/.test(triage(got, 'Project C rulings log', TK))
  && triage(got, 'standards/code-standard.md rule 64', TK) === null && triage(got, 'none — a one-off copy edit', TK) === null && triage([], undefined, TK) === null);
console.log(`${n}/${n} passed`);
