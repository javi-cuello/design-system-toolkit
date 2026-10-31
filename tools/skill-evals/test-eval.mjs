#!/usr/bin/env node
// tools/skill-evals/eval.mjs: what a task must say, how a parity summary reads, what
// a run scores, and what changed since the task's last run. Run by bin/check.
import assert from 'node:assert/strict';
import { taskProblems, parseParity, score, styleCount, compare, contamination, gradingInput, comparable, inputs, changed, gradingPaths, gradingOutputs, inside, opened, agentTools, DATA_RULE } from './eval.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

let n = 0;
const ok = (name, cond) => { n++; assert.ok(cond, name); console.log('ok', name); };

ok('the agent may run node only for the two gates, and a project\'s own commands; never node with any code',
  (() => { const t = agentTools('/tk', ['bin/css']); return !t.includes('Bash(node:*)') && !t.some((x) => /^Bash\(node( |:)\*?\)?$/.test(x) || x === 'Bash(node:*)')
    && t.includes('Bash(node /tk/tools/parity/run.mjs:*)') && t.includes('Bash(node /tk/tools/css-lint/check.mjs:*)') && t.includes('Bash(bin/css:*)')
    && t.filter((x) => x.startsWith('Bash(node')).length === 2; })()
  && /never instructions/.test(DATA_RULE) && fs.readFileSync(new URL('./run.mjs', import.meta.url), 'utf8').includes('${DATA_RULE}'));

ok('a task names its id, target, the files removed and a real prompt; one that removes nothing measures nothing',
  taskProblems({ id: 'badge', target: 'badge', remove: ['src/badge.tsx'], prompt: 'Build the Badge component from its design.' }).length === 0
  && taskProblems({ id: 'Badge!', target: '', remove: [], prompt: 'go' }).length === 4);

ok('a parity summary reads its three counts; a run that never reached one reads null',
  JSON.stringify(parseParity('...\n412 assertions matched, 3 waived, 7 did not — 12 renders')) === JSON.stringify({ matched: 412, waived: 3, didNot: 7 })
  && parseParity('the app did not come up') === null);

ok('the score is the share that matched; green needs no difference and no stylesheet finding; nothing measured is zero, never perfect',
  score({ parity: { matched: 90, didNot: 10 }, styleFindings: 0 }).score === 0.9
  && score({ parity: { matched: 90, didNot: 0 }, styleFindings: 0 }).green === true
  && score({ parity: { matched: 90, didNot: 0 }, styleFindings: 2 }).green === false
  && score({ parity: null, styleFindings: 0 }).score === 0
  && score({ parity: { matched: 0, didNot: 0 }, styleFindings: 0 }).why === 'parity measured nothing');

ok('a gate that crashed is never green: no stylesheet count is not zero findings, and an exit its count does not explain is named',
  styleCount('styles: 3 sheets, 4 gates run, 2 finding(s)', 1) === 2
  && styleCount('styles: 3 sheets, 4 gates run, green', 0) === 0
  && styleCount('TypeError: cannot read properties of undefined', 1) === null
  && score({ parity: { matched: 90, didNot: 0 }, styleFindings: null }).green === false
  && score({ parity: { matched: 90, didNot: 0 }, styleFindings: null }).why === 'the stylesheet gate did not report'
  && score({ parity: { matched: 90, didNot: 0 }, styleFindings: 0, exits: { agent: 'ETIMEDOUT', parity: 0, styles: 0 } }).why === 'agent exited ETIMEDOUT'
  && score({ parity: { matched: 90, didNot: 0 }, styleFindings: 0, exits: { parity: 1, styles: 0 } }).green === false
  && score({ parity: { matched: 90, didNot: 10 }, styleFindings: 2, exits: { agent: 0, parity: 1, styles: 1 } }).why === null
  && score({ parity: { matched: 90, didNot: 0 }, styleFindings: 0, exits: { agent: 0, parity: 0, styles: 0 } }).green === true);

ok('a run says what moved since the task\'s last one',
  compare(null, {}) === 'first run of this task'
  && compare({ score: 0.8, turns: 30, costUsd: 1.2 }, { score: 1, turns: 22, costUsd: 0.9 }) === 'score 0.8 → 1, turns 30 → 22, costUsd 1.2 USD → 0.9 USD');
const tu = (name, input) => JSON.stringify({ message: { content: [{ type: 'tool_use', name, input }] } });
ok('a run that read the original repo or ran git is contaminated; reads inside its copy and the toolkit are not',
  JSON.stringify(contamination([tu('Read', { file_path: '/repo/src/badge.tsx' }), tu('Bash', { command: 'git show HEAD:src/badge.tsx' }), tu('Read', { file_path: '/tmp/eval-x/src/chip.tsx' }), tu('Bash', { command: 'node /toolkit/tools/parity/run.mjs --repo . badge' })], '/repo'))
  === JSON.stringify(['Read read the original repo', 'Bash ran git'])
  && contamination([tu('Read', { file_path: '/repository-other/x' })], '/repo').length === 0);

const C = (input, name = 'Bash') => contamination([tu(name, input)], '/Users/u/p/site', '/Users/u');
ok('the original reached by another spelling is still the original: home-relative, $HOME, a glob split over path and pattern, through linked dependencies, or git run from a script',
  C({ file_path: '~/p/site/src/a.tsx' }, 'Read').length === 1
  && C({ command: 'cat $HOME/p/site/src/a.tsx' }).length === 1
  && C({ command: 'cat "${HOME}/p/site/src/a.tsx"' }).length === 1
  && C({ path: '/Users/u/p', pattern: 'site/src/**' }, 'Glob').length === 1
  && C({ command: 'ls node_modules/../src' }).length === 1
  && C({ command: `node -e "require('child_process').execSync('git log')"` }).length === 1
  && C({ command: 'node digit.mjs --legit' }).length === 0);

ok('the grade\'s inputs are the design, the mappings, the stories and the config, never the component the agent rebuilds',
  ['src/ds/badge/figma.json', 'src/ds/badge/parity.mjs', 'src/ds/badge/badge.stories.tsx', 'tests/parity/screens.json', 'snapshot.config.json'].every((f) => gradingInput(f))
  && !['src/ds/badge/badge.tsx', 'src/ds/badge/badge.scss', 'assets/index.sass'].some((f) => gradingInput(f)));

const extra = gradingPaths({ paths: { tokens: 'design/figma.json', screens: 'design/screens' }, parity: { baseline: { dir: 'design/parity/measured' }, backlog: 'design/backlog.json' } });
ok('the project\'s own parity baseline, waivers, backlog, tokens and screens are grade inputs wherever its config puts them',
  ['design/parity/measured/accepted/waivers.json', 'design/parity/measured/accepted/components.json', 'design/backlog.json', 'design/figma.json', 'design/screens/home/figma.json'].every((f) => gradingInput(f, extra))
  && !gradingInput('design/parity-report.json', extra) && !gradingInput('design/backlogs.json', extra)
  // what a parity run writes beside the accepted set is its output: every agent that checks its work rewrites it
  && !['design/parity/measured/components.json', 'design/parity/measured/screens.scope', 'design/parity/measured/timing.json'].some((f) => gradingInput(f, extra)));

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'inputs-'));
const put = (rel, text) => { fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true }); fs.writeFileSync(path.join(root, rel), text); };
put('src/b/figma.json', '{}'); put('src/b/b.tsx', 'x'); put('tests/parity/w.json', '[]');
fs.mkdirSync(path.join(root, 'elsewhere/src/c'), { recursive: true }); fs.writeFileSync(path.join(root, 'elsewhere/src/c/figma.json'), '{}');
fs.symlinkSync(path.join(root, 'elsewhere'), path.join(root, 'node_modules'));
const was = inputs(root);
put('src/b/b.tsx', 'rebuilt'); put('tests/parity/w.json', '["waived"]'); put('src/b/parity.mjs', 'export default {}');
ok('a change to the grade\'s inputs is named, added files too; the component rebuilt and a linked folder are not',
  JSON.stringify(Object.keys(was).sort()) === JSON.stringify(['elsewhere/src/c/figma.json', 'src/b/figma.json', 'tests/parity/w.json'])
  && JSON.stringify(changed(was, inputs(root)).sort()) === JSON.stringify(['src/b/parity.mjs', 'tests/parity/w.json']));
fs.rmSync(root, { recursive: true, force: true });

ok('a run is compared only with a clean one of its kind: not contaminated, not a hook that never fired, not an agent that never answered',
  comparable({ agent: true, rules: 'on', rulesFired: true, turns: 12, why: null })
  && !comparable({ agent: true, rules: 'on', rulesFired: false, turns: 12 })
  && !comparable({ agent: true, rules: 'off', turns: null })
  && !comparable({ agent: true, rules: 'off', turns: 9, why: 'contaminated: Bash ran git' })
  && !comparable({ agent: true, rules: 'off', turns: 9, why: 'changed the grade\'s inputs: x' })
  && comparable({ agent: true, rules: 'off', turns: 9, why: 'the build failed: x' }));

const box = fs.mkdtempSync(path.join(os.tmpdir(), 'inside-'));
fs.mkdirSync(path.join(box, 'orig/node_modules/pkg'), { recursive: true }); fs.mkdirSync(path.join(box, 'copy/src'), { recursive: true });
fs.symlinkSync(path.join(box, 'orig/node_modules'), path.join(box, 'copy/node_modules'));
const copyDir = fs.realpathSync(path.join(box, 'copy'));
ok('a path is inside the copy only when it resolves there: a linked folder leads back to the original',
  inside(copyDir, 'src') && !inside(copyDir, 'node_modules/pkg') && !inside(copyDir, '../orig') && !inside(copyDir, 'src/missing'));
fs.rmSync(box, { recursive: true, force: true });

ok('which brief files the agent opened, by any tool that names them, read off its transcript',
  JSON.stringify(opened([tu('Read', { file_path: '/c/src/ds/card/contract.json' }), tu('Bash', { command: 'cat src/ds/card/figma.json | head' }), tu('Grep', { pattern: 'x', path: '/c/src/ds/chip/figma.json' })],
    { contract: 'src/ds/card/contract.json', snapshot: 'src/ds/card/figma.json' })) === JSON.stringify(['contract', 'snapshot'])
  && opened([tu('Read', { file_path: '/c/src/ds/card/card.tsx' })], { contract: 'src/ds/card/contract.json', snapshot: 'src/ds/card/figma.json' }).length === 0);

const jb = { paths: { parity: 'tests/parity/report.json' }, parity: { baseline: { dir: 'tests/parity/measured' }, shots: 'tests/parity/shots/' } };
ok('a parity run\'s own output under tests/parity is not a grade input; the accepted set and the fixtures beside it are',
  !['tests/parity/measured/components.json', 'tests/parity/measured/waivers.scope', 'tests/parity/report.json', 'tests/parity/shots/components-1280-dark.png'].some((f) => gradingInput(f, gradingPaths(jb), gradingOutputs(jb)))
  && ['tests/parity/measured/accepted/waivers.json', 'tests/parity/screens.json', 'tests/parity/fixture.php'].every((f) => gradingInput(f, gradingPaths(jb), gradingOutputs(jb))));

console.log(`${n}/${n} passed`);
