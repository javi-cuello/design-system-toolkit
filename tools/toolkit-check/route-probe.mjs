#!/usr/bin/env node
/*
 * Which skill a request reaches (tools/toolkit-check/review.md, point 22): one headless turn with the user's
 * installed skills, nothing run but the choice, and the skill it called, or none.
 *
 *   node tools/toolkit-check/route-probe.mjs "<a request a user would type>" [...more]
 *
 * One line per request: `<skill or none>\t$<cost>\t<request>`. About $0.17 and 5 s each (measured 2026-11-11).
 * The one way the review's agent reaches `claude`: its own flags are fixed here, so a probe can never widen
 * what a run may do (the agent is denied `claude` itself).
 */
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export function skillCalled(streamJson) {
  for (const line of streamJson.split('\n')) {
    let j;
    try { j = JSON.parse(line); } catch { continue; }
    for (const c of j?.message?.content || []) if (c?.type === 'tool_use' && c.name === 'Skill' && c.input?.skill) return c.input.skill;
  }
  return 'none';
}
export const cost = (streamJson) => Number((streamJson.match(/"total_cost_usd":([0-9.]+)/g) || []).pop()?.split(':')[1] || 0);

const asked = process.argv.slice(2);
if (process.argv[1] && fs.realpathSync(process.argv[1]) === fileURLToPath(import.meta.url) && asked.length) {
  for (const prompt of asked.slice(0, 30)) {
    const r = spawnSync(process.env.CLAUDE_BIN || 'claude', ['-p', prompt, '--max-turns', '1', '--output-format', 'stream-json', '--verbose',
      '--permission-mode', 'default', '--allowedTools', 'Skill', '--disallowedTools', 'Bash', 'Edit', 'Write', 'WebFetch', 'WebSearch'],
      { encoding: 'utf8', timeout: 120_000, maxBuffer: 16 * 1024 * 1024 });
    console.log(`${skillCalled(r.stdout || '')}\t$${cost(r.stdout || '').toFixed(2)}\t${prompt}`);
  }
}
