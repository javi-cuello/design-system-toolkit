// The on-disk spelling of a path. macOS paths are case-insensitive, so a shell
// that entered through ~/projects reports a path that no stored ~/Projects
// path string-matches; compare paths through this, never as typed.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// A leading ~ as the home folder, and nothing else: `~user` and a ~ inside a path stay as written. The CommonJS
// side (tools/snapshot/projects.cjs `expand`) keeps its own, because a script with no build step requires it.
export const expandHome = (p) => String(p).replace(/^~(?=$|\/)/, os.homedir());

export const realPath = (p) => {
  const abs = path.resolve(expandHome(p));
  try { return fs.realpathSync.native(abs); } catch { return abs; }
};

export const samePath = (a, b) => realPath(a) === realPath(b);
