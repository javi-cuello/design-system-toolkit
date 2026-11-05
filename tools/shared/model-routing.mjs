// Which model and effort a piece of work runs on, read from model-routing.json:
// the one table ds-model-routing advises from and a workflow script sets each
// agent() by. A workflow script has no filesystem, so the session passes the
// routes in as the Workflow's `args`: `node tools/shared/model-routing.mjs`
// prints them, keyed by skill, or `skill:mode` where the mode moves the tier
// (such a skill has no plain key: its mode is asked first).
import { readFileSync, realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const ROWS = JSON.parse(readFileSync(new URL('./model-routing.json', import.meta.url), 'utf8'));

// { key: { model, effort? } } — what agent()'s opts take, spread as they are.
export function routes(rows = ROWS) {
  return Object.fromEntries(rows.flatMap((r) => r.keys.map((k) => [k, { ...r.agent }])));
}

// The route for a skill, or a skill in a mode; null when the table has no row.
export function routeFor(skill, mode, rows = ROWS) {
  const key = mode ? `${skill}:${mode}` : skill;
  const row = rows.find((r) => r.keys.includes(key));
  return row ? { ...row.agent } : null;
}

// argv[1] need not be a file (a script on stdin, an -e with arguments): then this is imported, not run
const run = () => { try { return realpathSync(process.argv[1]) === fileURLToPath(import.meta.url); } catch { return false; } };
if (process.argv[1] && run()) {
  process.stdout.write(JSON.stringify(routes(), null, 2) + '\n');
}
