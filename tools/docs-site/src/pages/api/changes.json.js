// The change log: one entry per snapshot that moved something, with what
// moved per component and, where the entry was graded, each change's level.
import { changes } from '../../lib/snapshot.js';
import { json } from './_shared.js';

export function GET() { return json(changes); }
