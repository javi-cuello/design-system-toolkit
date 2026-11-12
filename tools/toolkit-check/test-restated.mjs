#!/usr/bin/env node
// restated.mjs: prose that restates an owner's fact is held to it (toolkit-standard §D 22).
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { execFileSync } from 'node:child_process';
import { check } from './restated.mjs';

let pass = 0, fail = 0;
const ok = (name, cond) => { if (cond) pass++; else { fail++; console.log('FAIL ' + name); } };
const tree = (files) => {
  const d = mkdtempSync(join(tmpdir(), 'restated-'));
  for (const [p, c] of Object.entries(files)) { mkdirSync(dirname(join(d, p)), { recursive: true }); writeFileSync(join(d, p), c); }
  execFileSync('git', ['init', '-q'], { cwd: d }); execFileSync('git', ['add', '-A'], { cwd: d });
  return d;
};
const reg = JSON.stringify({ facts: [{ name: 'the Node floor', owner: 'install.sh', ownerRe: 'install Node (\\d+\\.\\d+) or later', proseRe: '\\bNode (\\d+\\.\\d+)\\+' }] });
const out = check(tree({
  'install.sh': 'echo "install Node 22.12 or later"\n',
  'tools/toolkit-check/restated.json': reg,
  'tools/x/run.mjs': "if (argv.includes('--fast')) go();\n",
  'tools/x/helper.mjs': "console.error('usage: node tools/x/helper.mjs [--fast] [--hidden]');\n",
  'tools/x/wrap.mjs': "die('usage: bin/x [--quiet] [--loud]');\n",
  'bin/README.md': '# bin\n\n`bin/x --quiet` runs it.\n',
  'tools/x/test-run.mjs': '',
  'tools/x/README.md': '# X\n\nRuns things.\n\n    node tools/x/run.mjs --fast --slow\n    node tools/gone/y.mjs\n\nrun.mjs does it. Needs Node 22.10+ and Node 22.12+.\n',
  'tools/x/CHANGELOG.md': 'node tools/gone/old.mjs\n',
  'skills/s/tests/cases.md': 'Walked: ran node tools/gone/then.mjs\n',
}));
ok('a flag the script reads passes', !out.some((l) => l.includes('--fast')));
ok('…one no script beside it reads is refused', out.some((l) => /run\.mjs --slow: no script/.test(l)));
ok('a command whose file is gone is refused', out.some((l) => /runs tools\/gone\/y\.mjs, which does not exist/.test(l)));
ok('a tool README that leaves out a script is refused, a test file is not owed', out.some((l) => /does not name helper\.mjs/.test(l)) && !out.some((l) => /test-run\.mjs/.test(l)));
ok('a flag a script\'s usage line offers and its README never names is refused; one it names passes',
  out.some((l) => /tools\/x\/README\.md: does not name --hidden, which tools\/x\/helper\.mjs/.test(l)) && !out.some((l) => /does not name --fast/.test(l)));
ok('a usage line for a bin/ command is held to bin/README.md', out.some((l) => /^bin\/README\.md: does not name --loud/.test(l)) && !out.some((l) => /--quiet/.test(l)));
ok('a registered value that differs from its owner is refused, one that agrees passes', out.some((l) => /says the Node floor is 22\.10; install\.sh says 22\.12/.test(l)) && out.filter((l) => /Node floor/.test(l)).length === 1);
ok('a changelog and a case record are history, not checked', !out.some((l) => /old\.mjs|then\.mjs/.test(l)));
const gone = check(tree({ 'install.sh': 'nothing\n', 'tools/toolkit-check/restated.json': reg }));
ok('an owner that no longer holds the value is refused, never passed', gone.some((l) => /no longer holds/.test(l)));
console.log(`${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
