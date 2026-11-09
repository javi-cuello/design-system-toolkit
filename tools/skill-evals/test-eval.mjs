#!/usr/bin/env node
// tools/skill-evals/eval.mjs: what a task must say, how a parity summary reads, what
// a run scores, and what changed since the task's last run. Run by bin/check.
import assert from 'node:assert/strict';
import { taskProblems, parseParity, score, styleCount, compare, contamination, gradingInput, comparable, inputs, changed, gradingPaths, gradingOutputs, inside, opened, agentTools, DATA_RULE, lock, unlock, voided, codeFiles, validateScore, chromeFinding, SYSTEM, pinOf, COMMIT } from './eval.mjs';
import { CODE } from '../system-mcp/validate.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

let n = 0;
const ok = (name, cond) => { n++; assert.ok(cond, name); console.log('ok', name); };

ok('a task is pinned by its own commit, else the config\'s, else HEAD; only a hash is accepted',
  pinOf({ commit: 'abc1234' }, { commit: 'def5678' }) === 'def5678'
  && pinOf({ commit: 'abc1234' }, {}) === 'abc1234'
  && pinOf({}, {}) === 'HEAD'
  && taskProblems({ id: 'notes', grade: 'validate', commit: 'abc1234', prompt: 'Add a notes page for a signed-in person.' }).length === 0
  && taskProblems({ id: 'notes', grade: 'validate', commit: 'main; rm -rf /', prompt: 'Add a notes page for a signed-in person.' }).length === 1
  && COMMIT.test('0123456789abcdef0123456789abcdef01234567') && !COMMIT.test('HEAD~1'));

ok('a screen task may name its chrome; a page built outside it is a finding, one that imports it (alias or relative) is not',
  taskProblems({ id: 'notes', grade: 'validate', chrome: ['screens/shell/app-shell'], prompt: 'Add a notes page for a signed-in person.' }).length === 0
  && taskProblems({ id: 'notes', grade: 'validate', chrome: [], prompt: 'Add a notes page for a signed-in person.' }).length === 1
  && taskProblems({ id: 'badge', target: 'badge', remove: ['a.tsx'], chrome: ['x'], prompt: 'Build the Badge component from its design.' }).length === 1
  && chromeFinding(['src/app/p/page.tsx'], () => "import { AppShell } from '@/screens/shell/app-shell';", ['screens/shell/app-shell']) === null
  && chromeFinding(['src/screens/n/n.tsx'], () => "import { AppShell } from '../shell/app-shell';", ['screens/shell/app-shell.tsx']) === null
  && chromeFinding(['src/app/p/page.tsx', 'src/screens/n/n.tsx'], (f) => f.endsWith('n.tsx') ? "import { AppPage } from '../templates/app-page'" : "import { N } from '@/screens/n/n'", ['screens/templates/app-page']) === null
  && chromeFinding(['src/app/p/page.tsx'], () => "import { Button } from '@/design-system/button/button';\nimport { MyShell } from './shell';", ['screens/shell/app-shell']).kind === 'chrome'
  && chromeFinding(['src/app/p/page.tsx'], () => "import { AppShellish } from '@/screens/shell/app-shell-old';", ['screens/shell/app-shell']) !== null
  && chromeFinding(['src/a.tsx'], () => '', undefined) === null
  && validateScore(['src/app/p/page.tsx', 'src/lib/a.ts', 'src/lib/b.ts'], [chromeFinding(['src/app/p/page.tsx'], () => '', ['screens/shell/app-shell'])]).score === 0
  && /outside the shell/.test(validateScore(['src/app/p/page.tsx'], [chromeFinding(['src/app/p/page.tsx'], () => '', ['x'])]).why)
  && chromeFinding(['src/screens/n/n.tsx'], () => "import { AppShell } from '../shell/app-shell';", ['@/screens/shell/app-shell']) === null
  && chromeFinding(['src/app/p/page.tsx'], () => "import { X } from '@/screens/shell';", ['src/screens/shell/index.tsx']) === null
  && chromeFinding(['src/app/p/page.tsx'], () => "import type { NavItem } from '@/screens/shell/app-shell';", ['screens/shell/app-shell']) !== null
  && chromeFinding(['src/app/p/page.tsx'], () => "export type P = { a: number }\nimport { AppShell } from '../../screens/shell/app-shell'", ['screens/shell/app-shell']) === null
  && chromeFinding(['src/app/p/page.tsx'], () => "import type {\n  NavItem,\n} from '@/screens/shell/app-shell'", ['screens/shell/app-shell']) !== null
  && chromeFinding(['src/app/p/page.tsx'], () => "// like '@/screens/shell/app-shell'\n/* from '@/screens/shell/app-shell' */", ['screens/shell/app-shell']) !== null
  && chromeFinding(['src/app/p/page.tsx'], () => { throw new Error('gone'); }, ['screens/shell/app-shell']).file === 'src/app/p/page.tsx'
  && chromeFinding(['src/screens/n/n.stories.tsx', 'src/app/x/page.tsx'], () => '', ['a']).file === 'src/app/x/page.tsx');

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

const G = (command, gitReachable = false) => contamination([tu('Bash', { command })], '/repo', '', { copy: '/tmp/eval-x', gitReachable });
ok('git where no repository is reachable does not void a run; git pointed elsewhere, or with a repository above the copy, does',
  G('tail -9 j.json; git -C . status 2>&1 | head -1').length === 0
  && G('cd /tmp/eval-x; git diff --no-index /dev/null /dev/null').length === 0
  && G('cd /tmp/eval-x/ && git log').length === 0
  && G('cd -P /tmp/eval-x && git log').length === 0
  && G('git status', true).length === 1
  && G('cd /elsewhere && git show HEAD:a.tsx').length === 1
  && G('git -C /elsewhere show HEAD:a.tsx').length === 1
  && G('git --git-dir=/x/.git log').length === 1
  && G('GIT_DIR=/x/.git git log').length === 1
  && G('cd; git log').length === 1 && G('cd && git log').length === 1 && G('pushd .. && git log').length === 1
  && contamination([tu('Bash', { command: 'git status' })], '/repo').length === 1);

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

const lk = fs.mkdtempSync(path.join(os.tmpdir(), 'lock-'));
for (const [rel, text] of [['src/b/figma.json', '{}'], ['src/b/parity.mjs', 'export const b = { layers: {} };'], ['src/b/b.tsx', 'x']]) { fs.mkdirSync(path.dirname(path.join(lk, rel)), { recursive: true }); fs.writeFileSync(path.join(lk, rel), text); }
const locked = lock(lk, Object.keys(inputs(lk)));
const refused = (rel) => { try { fs.writeFileSync(path.join(lk, rel), 'export const b = { layers: { evil: 1 } };'); return false; } catch (e) { return e.code === 'EACCES' || e.code === 'EPERM'; } };
ok('the grade\'s inputs are read-only in the copy before the agent starts: a mapping module the gates import cannot be rewritten; the component can',
  locked.size === 2 && (process.getuid && process.getuid() === 0 || (refused('src/b/parity.mjs') && refused('src/b/figma.json')))
  && (() => { fs.writeFileSync(path.join(lk, 'src/b/b.tsx'), 'rebuilt'); return true; })());
unlock(lk, locked);
ok('…and writable again, at their old modes, for the build and serve after the agent, a screen task\'s grade included',
  (fs.statSync(path.join(lk, 'src/b/parity.mjs')).mode & 0o777) === (locked.get('src/b/parity.mjs') & 0o777) && (() => { fs.writeFileSync(path.join(lk, 'src/b/parity.mjs'), 'rebuilt'); return true; })()
  && /unlock\(copy, modes\);[\s\S]*?if \(screen\) \{[\s\S]*?validateScore\([\s\S]*?\} else \{\s*const built = vo/.test(fs.readFileSync(new URL('./run.mjs', import.meta.url), 'utf8')));
fs.rmSync(lk, { recursive: true, force: true });

const runSrc = fs.readFileSync(new URL('./run.mjs', import.meta.url), 'utf8');
ok('a run that changed the grade\'s inputs, or read the answer, scores 0 and is never graded: no build, server or gate runs over it',
  voided({ tampered: ['src/b/parity.mjs'] }).score === 0 && /changed the grade's inputs: src\/b\/parity\.mjs/.test(voided({ tampered: ['src/b/parity.mjs'] }).why)
  && /^contaminated/.test(voided({ contaminated: ['Bash ran git'], tampered: ['x'] }).why) && voided({ contaminated: [], tampered: [] }) === null && voided({}) === null
  && /const built = vo \? none/.test(runSrc) && /if \(!vo && E\.serve\)/.test(runSrc)
  && /const p = vo \? none : sh\(`node \$\{TOOLKIT\}\/tools\/parity\/run\.mjs/.test(runSrc) && /const st = vo \? none : sh\(/.test(runSrc)
  && /const modes = NO_AGENT \? new Map\(\) : lock\(copy, Object\.keys\(before\)\)/.test(runSrc));

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

ok('a screen task (grade validate) needs no target and may remove nothing; any other grade is refused',
  taskProblems({ id: 'settings', grade: 'validate', prompt: 'Add a settings page where people choose notifications.' }).length === 0
  && taskProblems({ id: 'settings', grade: 'looks', prompt: 'Add a settings page where people choose notifications.' }).length === 3
  && taskProblems({ id: 'settings', grade: 'validate', remove: 'src/a.tsx', prompt: 'Add a settings page where people choose notifications.' }).length === 1);

ok('a screen task\'s written code is what changed under the code prefixes, outside the system and node_modules, with a code extension',
  (() => { const d = fs.mkdtempSync(path.join(os.tmpdir(), 'codefiles-'));
    const put = (f, t) => { fs.mkdirSync(path.dirname(path.join(d, f)), { recursive: true }); fs.writeFileSync(path.join(d, f), t); };
    put('src/design-system/button.tsx', 'a'); put('src/app/page.tsx', 'a'); put('src/app/notes.md', 'a'); put('src/node_modules/x/index.js', 'a'); put('scripts/x.js', 'a');
    const scope = { code: ['src/'], system: ['src/design-system/'] };
    const before = codeFiles(d, scope, CODE);
    put('src/app/page.tsx', 'b'); put('src/app/settings/page.tsx', 'b'); put('src/design-system/button.tsx', 'b'); put('scripts/x.js', 'b');
    const after = codeFiles(d, scope, CODE);
    fs.rmSync(d, { recursive: true, force: true });
    const touched = changed(before, after).filter((f) => after[f]).sort();
    return JSON.stringify(touched.filter((f) => !after[f].endsWith(SYSTEM))) === JSON.stringify(['src/app/page.tsx', 'src/app/settings/page.tsx'])
      && JSON.stringify(touched.filter((f) => after[f].endsWith(SYSTEM))) === JSON.stringify(['src/design-system/button.tsx']); })());

ok('a screen task scores the share of written files validate found nothing in; nothing written or no report is zero, never a pass',
  validateScore(['a.tsx', 'b.tsx'], [{ file: 'a.tsx', kind: 'raw colour' }]).score === 0.5
  && validateScore(['a.tsx'], []).green === true && validateScore(['a.tsx'], [{ file: 'a.tsx' }]).green === false
  && validateScore([], []).score === 0 && /wrote no code/.test(validateScore([], []).why)
  && validateScore(['a.tsx'], null).score === 0 && /did not report/.test(validateScore(['a.tsx'], null).why)
  && !comparable({ agent: true, rules: 'off', turns: 3, why: 'validate did not report' }));

ok('a screen task reads the system wherever it is, and an empty code list as the push gate does: nothing outside the system',
  (() => { const d = fs.mkdtempSync(path.join(os.tmpdir(), 'codefiles-'));
    const put = (f) => { fs.mkdirSync(path.dirname(path.join(d, f)), { recursive: true }); fs.writeFileSync(path.join(d, f), 'a'); };
    put('src/app/page.tsx'); put('lib/ds/button.tsx'); put('other/x.tsx');
    const a = codeFiles(d, { code: ['src/app/'], system: ['lib/ds/'] }, CODE), b = codeFiles(d, { code: [], system: ['lib/ds/'] }, CODE), c = codeFiles(d, {}, CODE);
    fs.rmSync(d, { recursive: true, force: true });
    return JSON.stringify(Object.keys(a).sort()) === JSON.stringify(['lib/ds/button.tsx', 'src/app/page.tsx']) && a['lib/ds/button.tsx'].endsWith(SYSTEM)
      && JSON.stringify(Object.keys(b)) === JSON.stringify(['lib/ds/button.tsx']) && Object.keys(c).length === 3; })());

ok('a screen agent that wrote into the system, or did not exit cleanly, is never green, and is named',
  (() => { const a = validateScore(['a.tsx'], [], { system: ['src/design-system/x.tsx'] }); return a.score === 0.5 && !a.green && /system's own code: src\/design-system\/x\.tsx/.test(a.why); })()
  && (() => { const b = validateScore(['a.tsx'], [], { agentExit: 'SIGTERM' }); return b.score === 1 && !b.green && /agent exited SIGTERM/.test(b.why); })()
  && validateScore([], null, { system: ['src/design-system/x.tsx'] }).score === 0
  && /^wrote no code; agent exited error_max_turns$/.test(validateScore([], null, { agentExit: 'error_max_turns' }).why));

console.log(`${n}/${n} passed`);
