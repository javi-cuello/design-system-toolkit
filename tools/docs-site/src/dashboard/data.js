// What a read-only copy of the dashboard shows: the audit record, the
// project's audit context and the check catalogue, as the service serves them.
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { TOOLKIT, contract, project } from '../lib/project.js';
import { fileName } from '../lib/snapshot.js';

const scanner = join(TOOLKIT, 'skills/figma-components-audit/scanner');
// A file the build cannot parse is null, said out loud at build time, not a
// failed build: one truncated audit record used to take all 131 pages down
// (`JSON.parse` at module load, no try).
const json = (f) => {
  if (!existsSync(f)) return null;
  try { return JSON.parse(readFileSync(f, 'utf8')); }
  catch (e) { console.warn(`docs: ${f} is not readable JSON (${e.message}) — built without it`); return null; }
};
// The libraries in the project's own order with the platform each one is.
// The page used to bake one record for the whole project, so a project with a
// web library and a mobile one showed whichever came first and said nothing
// about the other.
export const dashboardStatic = {
  // Each with its roles: a components library is scanned in Figma, a tokens
  // or icon library is checked from the snapshot and has nothing to run.
  libraries: project.auditRecords.map(({ key, platform, name, roles }) => ({ key, platform: platform || 'web', name: name || fileName(key), roles })),
  // The records are not baked into the page; the build mounts the audit
  // folder at /audit and the page fetches the one it needs.
  context: contract.auditContext(project.doc),
  scripts: { buckets: json(join(scanner, 'buckets.json')), checks: json(join(scanner, 'checks.json')), measures: json(join(scanner, 'measures.json')) },
};
