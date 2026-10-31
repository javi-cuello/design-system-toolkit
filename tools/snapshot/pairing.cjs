#!/usr/bin/env node
// The snapshot router's pairing code: one per machine, kept where only this
// user can read it, and asked for once by the Figma plugin.
//
//   node tools/snapshot/pairing.cjs        prints the code (making it the first time)
//
// Why a code at all: the router listens on localhost, and `localhost` is
// reachable from every page the user has open. A sandboxed iframe on any page
// sends `Origin: null`, exactly as the plugin does, so no header the router can
// see tells the two apart. Before this, such a page could post a library, which
// overwrote a project's snapshot and ran its after-snapshot steps, or fill the
// unclaimed folder (toolkit review, 2026-10-31). A page cannot read this file;
// the plugin is given its contents by the person who can.
//
// TOOLKIT_PAIRING moves the file, for a test.
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const FILE = process.env.TOOLKIT_PAIRING || path.join(os.homedir(), '.toolkit', 'pairing-code');
// the home folder as ~: the router says this to whoever asks, and a page may be asking
const HERE = path.join(__dirname, 'pairing.cjs');
const COMMAND = `node ${HERE.startsWith(os.homedir() + path.sep) ? '~' + HERE.slice(os.homedir().length) : HERE}`;

/* The code, made the first time it is asked for. Written with `wx` so two
   processes starting together cannot each write their own; the loser reads
   the winner's. A file others may read is narrowed to this user, never used
   as it is. */
function code() {
  fs.mkdirSync(path.dirname(FILE), { recursive: true, mode: 0o700 });
  try {
    fs.writeFileSync(FILE, crypto.randomBytes(12).toString('base64url') + '\n', { mode: 0o600, flag: 'wx' });
  } catch (e) { if (e.code !== 'EEXIST') throw e; }
  const st = fs.statSync(FILE);
  if (st.uid !== process.getuid()) throw new Error(`${FILE} belongs to another user, so it is not used`);
  if (st.mode & 0o077) fs.chmodSync(FILE, 0o600);
  // another process may have made the file and not yet written it: read again for a moment
  let c = '';
  for (let i = 0; i < 50 && (c = fs.readFileSync(FILE, 'utf8').trim()).length < 12; i++) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 10);
  if (c.length < 12) throw new Error(`${FILE} holds no code: delete it, and the next request makes a new one`);
  return c;
}

/* Whether `given` is the code, compared in constant time. */
function matches(given) {
  const want = Buffer.from(code());
  const got = Buffer.from(String(given || ''));
  return got.length === want.length && crypto.timingSafeEqual(got, want);
}

module.exports = { code, matches, FILE, COMMAND };

if (require.main === module) console.log(code());
