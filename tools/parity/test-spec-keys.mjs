#!/usr/bin/env node
// node tools/parity/test-spec-keys.mjs — from the toolkit root.
import assert from 'node:assert/strict';
import { keysIn, checkContract, checkDeclarations, staleExcuses } from './spec-keys.mjs';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

let n = 0;
const ok = (name, cond) => { n++; assert.ok(cond, name); console.log('ok', name); };

const tree = { name: 'Size=md', type: 'COMPONENT', fills: [{ stops: [{ color: '#fff', position: 0 }], angle: 90 }], props: { Size: 'md' },
  children: [{ name: 'Label', type: 'TEXT', rotation: 15, bindings: { gap: 'Spacing/4' } }] };
const keys = keysIn([tree]);
ok('a layer\'s variable modes are an opaque map: the collection names under it are no spec keys', keysIn([{ name: 'S', modes: { '5. Responsive type': 'Mobile' } }]).has('modes') && !keysIn([{ name: 'S', modes: { '5. Responsive type': 'Mobile' } }]).has('5. Responsive type'));
ok('nested values count (a gradient\'s stops), opaque maps do not (props, bindings)', ['stops', 'color', 'angle', 'rotation', 'props', 'bindings'].every((k) => keys.has(k)) && !keys.has('Size') && !keys.has('gap'));

const declared = {
  name: { why: { because: 'identity', note: 'how the map addresses it' } }, type: { why: { because: 'identity', note: 'node kind' } },
  fills: { rule: 'background-color' }, stops: { rule: 'gradient stops' }, color: { rule: 'a stop colour' }, position: { rule: 'a stop place' },
  angle: { why: { because: 'unobservable', note: 'the browser reports the painted image' } }, props: { rule: 'attributes' }, children: { rule: 'recursed' },
  bindings: { rule: 'token names' }, maxHeight: { why: { because: 'notDrawn', note: 'no layer caps its height' } }, textCase: { rule: 'text-transform' },
};
const r = checkContract([tree], declared);
ok('a recorded key nobody declared fails, by name', r.undeclared.join() === 'rotation');
ok('an excuse for a key nothing records is stale; an unused rule is not', r.stale.join() === 'maxHeight' && !r.stale.includes('textCase'));

const bad = checkDeclarations({
  a: { rule: 'x', why: { because: 'identity', note: 'n' } }, b: { dormant: 'later' }, c: {}, d: { why: { because: 'later', note: 'n' } },
  e: { why: { because: 'carried', note: ' ' } }, f: { why: { because: 'elsewhere', note: 'read by gone.js' } }, g: { why: { because: 'elsewhere', note: 'read by overrides.js' } },
}, (f) => f === 'overrides.js');
ok('both, dormant without a rule, nothing, an open reason, no specifics, and elsewhere naming nothing real all fail; a real file passes', bad.length === 6 && !bad.some((l) => l.startsWith('g:')));

// The declaration is shared, so one project's snapshot cannot call an excuse
// stale: step E dropped the check because Project D records no
// paragraphSpacing and Project C does. Across every registered project it
// holds again, and a registered repo it cannot read is said, not skipped.
ok('an excuse is stale only when no registered project records its key; a missing repo is named', (() => {
  const root = mkdtempSync(join(tmpdir(), 'spec-keys-'));
  const project = (label, repo, node) => {
    mkdirSync(join(root, 'projects', label), { recursive: true });
    writeFileSync(join(root, 'projects', label, 'design-system-context.md'), '```json snapshot-routing\n' + JSON.stringify({ repo, files: { screens: { key: 'k', id: 'i' } } }) + '\n```\n');
    if (!node) return;
    mkdirSync(join(repo, 's', 'one'), { recursive: true });
    writeFileSync(join(repo, 'snapshot.config.json'), JSON.stringify({ paths: { screens: 's' }, parity: {} }));
    writeFileSync(join(repo, 's', 'one', 'figma.json'), JSON.stringify({ name: 'one', tree: node }));
  };
  project('a', join(root, 'a'), { name: 'A', type: 'FRAME', paragraphSpacing: 8 });
  project('b', join(root, 'b'), { name: 'B', type: 'FRAME' });
  const excuses = { name: declared.name, type: declared.type, paragraphSpacing: { why: { because: 'carried', note: 'p + p' } }, maxHeight: declared.maxHeight };
  const both = staleExcuses(excuses, join(root, 'projects'));
  project('c', join(root, 'gone'));
  const missing = staleExcuses(excuses, join(root, 'projects'));
  return both.stale.join() === 'maxHeight' && both.projects.join() === 'a,b' && both.unreadable.length === 0 && /^c: no repo/.test(missing.unreadable[0]);
})());
console.log(`${n}/${n} passed`);

// a variant's place in its set (snapshot 0.84.0) is declared, so a project's next snapshot does not fail gate 10
{ const { SPEC_KEYS } = await import('./adapt.mjs');
  const r2 = checkContract([{ name: 'Size=md', type: 'COMPONENT', w: 10, h: 10, place: { x: 0, y: 0 } }], SPEC_KEYS);
  if (r2.undeclared.length) { console.error('FAIL a variant\'s place is declared:', r2.undeclared); process.exit(1); }
  console.log('ok a variant\'s place is declared'); }
