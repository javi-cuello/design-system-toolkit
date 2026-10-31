/* Shared discovery: a tokens directory's shape, read off the filesystem.
 *
 * Layout is one folder per collection, one file per mode:
 *
 *   <tokens>/<collection>/<mode>.json      multi-mode collection
 *   <tokens>/<collection>/value.json       single-mode collection
 *   <tokens>/manifest.json                 build metadata, not a collection
 *
 * The mode is the FILE and never part of a token path. Every mode file of a
 * collection declares the same paths with different values, which is what lets a
 * consumer swap one file — or one built stylesheet — and change the theme with
 * no reference rewritten. Folding modes into one document would put the mode in
 * every path and every alias, and that property would be gone.
 *
 * Imported by the verify/generate scripts.
 */
import fs from 'fs';
import path from 'path';

export function discover(dir) {
  const collections = new Map();   // slug → { modes: Map<mode, relative path>, single }
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const modes = new Map();
    for (const f of fs.readdirSync(path.join(dir, entry.name)).sort())
      if (f.endsWith('.json')) modes.set(f.replace(/\.json$/, ''), path.join(entry.name, f));
    if (!modes.size) continue;
    collections.set(entry.name, { modes, single: modes.size === 1 && modes.has('value') });
  }
  return collections;
}

export const camel = s => s.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
