#!/usr/bin/env node
// tools/claude-hooks/standards-read.mjs: which area a change falls in, which files
// a tool call changes, and the area's rule list read from the standard itself.
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import os from 'node:os';
import { area, areas, areaKey, targets, ruleIndex, stale } from './standards-read.mjs';

const TK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
let n = 0;
const ok = (name, cond) => { n++; assert.ok(cond, name); console.log('ok', name); };
const P = '/p/site';
const k = (f) => { const a = area(f, TK, [P]); return a && areaKey(a); };

ok('a file\'s area follows where it sits; content, a scratch folder and dependencies have none',
  k(`${TK}/skills/x/SKILL.md`) === 'skill-standard.md:Part A' && k(`${TK}/plugins/x/code.js`) === 'skill-standard.md:Part B'
  && k(`${TK}/standards/code-standard.md`) === 'toolkit-standard.md:Part C' && k(`${TK}/tools/parity/run.mjs`) === 'toolkit-standard.md:Part D'
  && k(`${TK}/tools/snapshot/store.cjs`) === 'snapshot-standard.md:*'
  && k(`${P}/src/a.scss`) === 'code-standard.md:Components+Tokens and literals' && k(`${P}/src/a.tsx`) === 'code-standard.md:Structure+Accessibility+Progressive enhancement'
  && k(`${P}/src/a/parity.mjs`) === 'code-standard.md:Design-to-code' && k(`${P}/README.md`) === 'code-standard.md:Cleanliness and simplicity'
  && k(`${P}/content/jobs/a.txt`) === null && k('/tmp/scratch/x.js') === null && k(`${TK}/node_modules/x/y.js`) === null);

ok('an edit changes its file; a shell command changes the paths it names when it writes, its folder when it names none, nothing when it only reads',
  JSON.stringify(targets('Edit', { file_path: '/a/b.js' }, '/c')) === '["/a/b.js"]'
  && JSON.stringify(targets('Bash', { command: "sed -i '' 's/a/b/' /p/site/x.scss" }, '/c')) === '["/p/site/x.scss"]'
  && JSON.stringify(targets('Bash', { command: 'python3 - <<EOF\nprint(1)\nEOF' }, '/c')) === '["/c"]'
  && targets('Bash', { command: 'grep -n x /p/site/x.scss' }, '/c').length === 0
  && targets('Read', { file_path: '/a' }, '/c').length === 0);

const list = (a) => ruleIndex(TK, a);
ok('an area\'s rule list is read from the standard as it stands: titles with their numbers, small enough to hand over',
  list({ standard: 'code-standard.md', part: ['Components', 'Tokens and literals'] }).some((t) => /^9 · /.test(t))
  && list({ standard: 'skill-standard.md', part: 'Part A' }).some((t) => /^G · /.test(t))
  && list({ standard: 'toolkit-standard.md', part: 'Part D' }).some((t) => /^13 · /.test(t))
  && list({ standard: 'snapshot-standard.md', part: '*' }).length >= 10
  && list({ standard: 'code-standard.md', part: ['Components', 'Tokens and literals'] }).join('\n').length < 1600);
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rules-'));
const link = dir + '-link';
fs.symlinkSync(dir, link);
ok('a repo and a file spelled through different paths to one folder are one place, the file needing not exist yet',
  areaKey(area(path.join(fs.realpathSync(dir), 'src/new.scss'), TK, [link])) === 'code-standard.md:Components+Tokens and literals');
fs.rmSync(link); fs.rmSync(dir, { recursive: true, force: true });

ok('a shell command naming relative paths changes those paths, from its folder or the folder it cds into',
  JSON.stringify(targets('Bash', { command: "sed -i '' 's/a/b/' ../../standards/code-standard.md" }, `${TK}/skills/humanizer`)) === JSON.stringify([`${TK}/standards/code-standard.md`])
  && JSON.stringify(targets('Bash', { command: "cd /p/site && cat > src/a.scss <<'EOF'\nx\nEOF" }, '/c')) === '["/p/site/src/a.scss"]'
  && JSON.stringify(targets('Bash', { command: 'git mv skills/humanizer skills/humanizer2' }, TK)) === JSON.stringify([`${TK}/skills/humanizer`]));

const B = (command) => targets('Bash', { command }, '/p/site');
ok('touch, mkdir, ln, a numbered redirect, curl -o, unzip and a package script write; a redirect to /dev/null or one quoted in a message does not',
  JSON.stringify(B('touch /p/site/src/a.scss')) === '["/p/site/src/a.scss"]'
  && B('mkdir -p /p/site/src/x').length === 1 && JSON.stringify(B('ln -s /tk/standards/a.md /p/site/b')) === '["/p/site/b"]'
  && JSON.stringify(B('unzip /tmp/a.zip -d src/icons')) === '["/p/site/src/icons"]' && JSON.stringify(B('unzip -o /tmp/a.zip')) === '["/p/site"]'
  && B('curl -sSLo /p/site/a.svg https://x.test/a.svg').length === 1 && B('make x &> /p/site/log.txt').length === 1
  && B('pnpm tokens').length === 1 && B('bash -c "echo hi > /p/site/a.css"').length === 1
  && B("git commit -q -F - <<'EOF'\nfix /p/site/src/a.scss\nEOF").length === 0
  && B('echo x 1>/p/site/a.css').length === 1 && B('curl -o /p/site/a.svg https://x.test/a.svg').length === 1
  && JSON.stringify(B('pnpm run build')) === '["/p/site"]' && B('npm run tokens').length === 1
  && B('grep x /p/site/a.scss > /dev/null').length === 0 && B('rg x /p/site 2>/dev/null').length === 0
  && B("echo 'a > b' | wc -l").length === 0);

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'stale-'));
for (const [name, days] of [['toolkit-rules-old', 9], ['toolkit-stop-old', 9], ['toolkit-rules-new', 1], ['other-old', 9]]) {
  const f = path.join(tmp, name); fs.writeFileSync(f, ''); const t = (Date.now() - days * 864e5) / 1000; fs.utimesSync(f, t, t);
}
ok('the hooks\' per-session files older than a week are swept; newer ones and anything else are not',
  JSON.stringify(stale(tmp).map((f) => path.basename(f)).sort()) === '["toolkit-rules-old","toolkit-stop-old"]');
fs.rmSync(tmp, { recursive: true, force: true });

ok('a worktree under .claude/worktrees has the area of the same path in the main repo',
  k(`${TK}/.claude/worktrees/a/skills/x/SKILL.md`) === 'skill-standard.md:Part A' && k(`${P}/.claude/worktrees/b/src/a.scss`) === 'code-standard.md:Components+Tokens and literals');

ok('a context document hands over figma-standard, every rule of it', (() => { const a = area(`${TK}/projects/p/design-system-context.md`, TK, []); return a && a.standard === 'figma-standard.md' && ruleIndex(TK, a).some((t) => /^1 · /.test(t)) && ruleIndex(TK, a).length >= 10; })());
ok('a command that heals or restores writes, and a read-only check does not', targets('Bash', { command: 'bin/check' }, TK).length === 1 && targets('Bash', { command: 'git restore x.md' }, TK).length === 1 && targets('Bash', { command: 'bin/check --no-fix' }, TK).length === 0);
// 2026-10-11: an interface file answers to design-standard as well; the docs site's to code-standard too.
const std = (f, repos) => areas(f, TK, repos).map((a) => a.standard).join(' ');
ok('a project page answers to code-standard and design-standard', std(`${P}/src/pages/home.astro`, [P]) === 'code-standard.md design-standard.md');
ok('…a project script that draws nothing, to code-standard alone', std(`${P}/src/lib/data.mjs`, [P]) === 'code-standard.md');
ok('the docs site\'s stylesheet answers to the root, code-standard and design-standard', std(`${TK}/tools/docs-site/src/styles/site.scss`, []) === 'toolkit-standard.md code-standard.md design-standard.md');
ok('the docs site\'s dashboard script and a plugin\'s panel answer to design-standard too', std(`${TK}/tools/docs-site/src/dashboard/views.js`, []).includes('design-standard.md') && std(`${TK}/plugins/x/ui.html`, []) === 'skill-standard.md design-standard.md');
ok('…from an isolated worktree too', std(`${TK}/.claude/worktrees/w/tools/docs-site/src/components/Modal.astro`, []).includes('design-standard.md'));
ok('a project\'s parity fixture is not an interface', !std(`${P}/tests/parity/frame.html`, [P]).includes('design-standard.md'));
ok('…and design-standard hands over every rule', ruleIndex(TK, { standard: 'design-standard.md', part: '*' }).length >= 12);
console.log(`${n}/${n} passed`);
