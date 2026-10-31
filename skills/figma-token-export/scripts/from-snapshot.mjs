// Deprecated 2026-10-31: moved to tools/tokens/from-snapshot.mjs (toolkit-standard §D 1:
// projects call it, so it is a tool). This file forwards for one release, then goes;
// call the new path.
import { realpathSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const TARGET = fileURLToPath(new URL('../../../tools/tokens/from-snapshot.mjs', import.meta.url));
export * from '../../../tools/tokens/from-snapshot.mjs';

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.error('figma-token-export/scripts/from-snapshot.mjs moved to tools/tokens/from-snapshot.mjs; forwarding.');
  process.exit(spawnSync(process.execPath, [TARGET, ...process.argv.slice(2)], { stdio: 'inherit' }).status ?? 1);
}
