// What the project decided and how it designs, from its folder (toolkit-standard
// §D 12): the product file, the live §6 decisions, the guidance pages
// (tools/shared/project-knowledge.cjs). Each piece is optional: absent, it is
// null or empty. tools/system-mcp serves it as `get_project_knowledge`.
import path from 'node:path';
import { project, toolkitRequire } from '../../lib/project.js';
import { json } from './_shared.js';
const knowledge = toolkitRequire('tools/shared/project-knowledge.cjs');

export function GET() {
  return json(project.doc ? knowledge.read(path.dirname(project.doc), project.doc) : { product: null, decisions: [], guidance: [] });
}
