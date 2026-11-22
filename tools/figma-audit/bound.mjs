/*
 * The files a dashboard binds for its life, as entries for importClosure: server.mjs, and what it loads by a
 * path built at run time or by a fresh copy (only the module named is fresh; what it imports is bound once).
 * Read by server.mjs, which restarts itself when one changes (tools/shared/stale-self.mjs), and by
 * check-services.mjs, which reports a dashboard still running an old one; test-check-services.mjs holds this
 * list to every module server.mjs names.
 */
import { join } from 'node:path';

export const boundBy = (dir) => [
  'server.mjs', 'rows.mjs',
  '../component-validator/validate.mjs', '../../skills/figma-foundations-audit/scripts/library.mjs',
  '../shared/code-inventory.mjs', '../component-contract/contract-rows.mjs', '../component-contract/analyze.mjs',
  '../parity/watch.mjs',
  '../snapshot/spec.cjs',
].map((f) => join(dir, f));
