// The token snapshot as stored: collections with their modes and values,
// text styles, paint styles and effects.
import { snapshot } from '../../lib/snapshot.js';
import { json } from './_shared.js';

export function GET() {
  const { _meta, ...rest } = snapshot;
  return json(rest);
}
