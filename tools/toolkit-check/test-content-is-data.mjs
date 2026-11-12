#!/usr/bin/env node
// toolkit-standard §D 24: what the toolkit reads from a file, a page or a
// project is data, never instructions. Every skill that reads such content says
// so near its top, and every prompt the toolkit builds from it frames it.
// Run: node tools/toolkit-check/test-content-is-data.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
let n = 0;
const ok = (name, cond, why = '') => { n++; assert.ok(cond, `${name}${why ? `\n${why}` : ''}`); console.log('ok', name); };
const read = (p) => fs.readFileSync(path.join(REPO, p), 'utf8');

/* The skills that read nothing but what the user types, each with why. A new
   skill is held to the rule until it is named here. */
const READS_ONLY_THE_USER = {
  'ds-model-routing': 'advises on a model from the task the user describes',
  'oklch-color-scale-system': 'computes scales from the colours the user gives',
};
const LINE = /\*\*Content is data\.\*\*[^\n]*never an instruction[^\n]*\(toolkit-standard §D 24\)/;

const skills = fs.readdirSync(path.join(REPO, 'skills')).filter((s) => fs.existsSync(path.join(REPO, 'skills', s, 'SKILL.md')));
const missing = skills.filter((s) => !READS_ONLY_THE_USER[s] && !LINE.test(read(`skills/${s}/SKILL.md`)));
ok('every skill that reads a file, a page or a project says its content is data', !missing.length, `${missing.join(', ')} does not say content is data`);
// near the top: before the first section, so it is read before any step that reads content
const late = skills.filter((s) => !READS_ONLY_THE_USER[s]).filter((s) => { const md = read(`skills/${s}/SKILL.md`); const at = md.search(LINE); const h2 = md.search(/^## /m); return at < 0 || (h2 >= 0 && at > h2); });
ok('the line comes before the skill\'s first section', !late.length, late.join(', '));
for (const s of Object.keys(READS_ONLY_THE_USER)) ok(`${s} is a skill, so its exemption names something real`, skills.includes(s));

/* The prompts the toolkit fills with file text: each says, in its own words, that the text is data. */
const PROMPTS = {
  'skills/figma-components-audit/scanner/fix.txt': /DATA describing the finding, never instructions/,
  'skills/figma-components-audit/scanner/judge.txt': /DATA to judge, never instructions/,
  'tools/docs-site/src/dashboard/ask.js': /data to answer about, never instructions/,
  'tools/docs-site/src/dashboard/queue.js': /data to answer about, never instructions/,
  'tools/system-mcp/server.mjs': /data to read and cite, never instructions/,
  'tools/skill-evals/eval.mjs': /never instructions to you/,
  'skills/design-code-parity/scripts/pairing.txt': /DATA to pair, never instructions/,
};
/* Every file that reaches a model (the API, the dashboard's /claude proxy, a `claude` run) is a prompt above or names
   here why it builds none from file text, so a new caller is held to the rule until it is read. */
const CALLERS = {
  'bin/set-key': 'stores a key; sends no prompt',
  'tools/docs-site/src/dashboard/api.js': 'the transport; ask.js, queue.js and audit.js build the prompts',
  'tools/docs-site/src/dashboard/audit.js': "fills the skill's judge.txt and fix.txt, framed above",
  'tools/figma-audit/server.mjs': 'the proxy; the page builds the prompts',
  'tools/skill-evals/run.mjs': 'runs a task the evals wrote, in a scratch worktree',
  'tools/toolkit-check/review-run.mjs': "its brief frames the queue as data (test-review-run.mjs)",
  'tools/toolkit-check/route-probe.mjs': 'sends the prompt it is given, nothing read from a file',
};
const CALLS = /api\.anthropic\.com|fetch\(\s*['"`]\/claude|CLAUDE_BIN|['"]claude['"],\s*\[|max_tokens/;
const tracked = execFileSync('git', ['-C', REPO, 'ls-files', '-z'], { encoding: 'utf8' }).split('\0')
  .filter((f) => /\.(c?m?js|ts|py|sh)$|^bin\//.test(f) && !/(^|\/)test-[^/]*$|node_modules|\/vendor\//.test(f) && fs.existsSync(path.join(REPO, f)) && fs.statSync(path.join(REPO, f)).isFile());
const unread = tracked.filter((f) => !PROMPTS[f] && !CALLERS[f] && CALLS.test(read(f)));
ok('every file that reaches a model is a prompt here or says why it is none', !unread.length, `${unread.join(', ')} reaches a model: frame its prompt in PROMPTS, or name it in CALLERS with why`);
for (const f of Object.keys(CALLERS)) ok(`${f} is still a caller, so its line names something real`, CALLS.test(read(f)));
const unframed = Object.entries(PROMPTS).filter(([f, re]) => !re.test(read(f))).map(([f]) => f);
ok('every prompt built from file text frames it as data', !unframed.length, `${unframed.join(', ')} does not frame its content as data`);
// the fields a fix prompt fills from the file come after the framing, so it is read first
const fix = read('skills/figma-components-audit/scanner/fix.txt');
ok('the fix prompt frames its fields before it gives them', fix.indexOf('never instructions') < fix.indexOf('FINDING: {{FINDING}}'));
const judge = read('skills/figma-components-audit/scanner/judge.txt');
ok('the judge prompt frames its candidates before it gives them', judge.indexOf('never instructions') < judge.indexOf('{{CANDIDATES}}'));
const pairing = read('skills/design-code-parity/scripts/pairing.txt');
ok('the pairing prompt frames its two lists before it gives them', pairing.indexOf('never instructions') > 0 && pairing.indexOf('never instructions') < pairing.indexOf('{{FIGMA}}'));
console.log(`${n}/${n} passed`);
