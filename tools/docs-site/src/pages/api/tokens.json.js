// The token snapshot as stored: collections with their modes and values,
// text styles, paint styles and effects. A collection name two source files
// share shows the last writer's copy; the other copies (`shared`) are the
// store's, not the design's served view, and are left out.
import { snapshot } from '../../lib/snapshot.js';
import { json } from './_shared.js';

export function GET() {
  const { _meta, shared, ...rest } = snapshot;
  return json(rest);
}
