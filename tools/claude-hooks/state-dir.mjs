import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/* Where plans, the gates' state and the carry live: never $TMPDIR, which a reboot empties (probed 2026-11-20: nothing
   in it older than the boot), while a plan holds days of agreed work. TOOLKIT_STATE_DIR moves it (the tests'). */
const made = new Set();
export const stateDir = () => {
  const d = process.env.TOOLKIT_STATE_DIR || path.join(os.homedir(), '.claude', 'toolkit-state');
  if (!made.has(d)) { try { fs.mkdirSync(d, { recursive: true }); } catch { /* read-only: each write says so */ } made.add(d); }
  return d;
};
