#!/usr/bin/env node
// node bin/test-set-key.mjs — bin/set-key reads keys.conf and writes a key only once it is tested.
// Every run is in a temp HOME with fake keys, and pbpaste, pbcopy, curl, launchctl and sleep are stubs
// on PATH: no real key is read or written, and nothing reaches the network.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT = fileURLToPath(new URL('./set-key', import.meta.url));
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'set-key-'));
// removed however the run ends, a failed check included
process.on('exit', () => fs.rmSync(tmp, { recursive: true, force: true }));
const stub = path.join(tmp, 'stub');
fs.mkdirSync(stub);
const put = (name, body) => { fs.writeFileSync(path.join(stub, name), `#!/bin/sh\n${body}\n`); fs.chmodSync(path.join(stub, name), 0o755); };
// the clipboard is a file; curl logs its arguments and answers Figma with $FIGMA_CODE, everything else with $CURL_RC
put('pbpaste', 'cat "$CLIP" 2>/dev/null');
put('pbcopy', 'cat > "$CLIP"');
// it reads stdin only for -H @-, as curl does: read always, it would eat the listing loop's lines
put('curl', 'echo "$*" >> "$CURL_LOG"; case "$*" in *"-H @-"*) cat > /dev/null ;; esac; case "$*" in *api.figma.com/v1/me*) printf "%s" "${FIGMA_CODE:-401}" ;; esac; exit ${CURL_RC:-0}');
put('launchctl', 'exit 1');
put('sleep', 'exit 0');

let n = 0;
const ok = (name, cond) => { n++; assert.ok(cond, name); console.log('ok', name); };

let home;
const fresh = (conf) => {
  home = fs.mkdtempSync(path.join(tmp, 'home-'));
  if (conf != null) { fs.mkdirSync(path.join(home, '.config', 'keys'), { recursive: true }); fs.writeFileSync(path.join(home, '.config', 'keys', 'keys.conf'), conf); }
};
const keys = () => path.join(home, '.config', 'keys');
const run = (args, { clip, env = {} } = {}) => {
  const CLIP = path.join(home, 'clip');
  if (clip != null) fs.writeFileSync(CLIP, clip);
  const r = spawnSync('sh', [SCRIPT, ...args], { encoding: 'utf8', env: { PATH: `${stub}:/usr/bin:/bin`, HOME: home, CLIP, CURL_LOG: path.join(home, 'curl.log'), ...env } });
  return { code: r.status, out: r.stdout + r.stderr };
};
const saved = (name) => { const f = path.join(keys(), name); return fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : null; };

// no keys.conf: the example is copied, and the listing names its two keys
fresh(null);
let r = run([]);
ok('with no keys.conf, the example is copied in', r.code === 0 && fs.readFileSync(path.join(keys(), 'keys.conf'), 'utf8') === fs.readFileSync(new URL('./keys.conf.example', import.meta.url), 'utf8'));
ok('the copied keys.conf is private', (fs.statSync(path.join(keys(), 'keys.conf')).mode & 0o077) === 0 && (fs.statSync(keys()).mode & 0o077) === 0);
ok('the listing reads its key lines, never its comments', /figma: missing/.test(r.out) && /audit: missing/.test(r.out) && !/link: missing|test: missing/.test(r.out));

// a key of one's own, with a test line
const CONF = `# comment
zz  zz_  link ~/.zz-key
  # an indented comment
qq  qq_
test zz_  grep -q good
`;
fresh(CONF);
r = run(['zz'], { clip: 'zz_bad' });
ok('a key its test rejects is not saved', r.code === 1 && saved('zz') === null && /rejected the key/.test(r.out) && /nothing written/.test(r.out));
ok('a rejected key makes no link', !fs.existsSync(path.join(home, '.zz-key')));

r = run(['zz'], { clip: ' zz_good\n' });
ok('a key its test passes is saved, the clipboard\'s whitespace stripped', r.code === 0 && saved('zz') === 'zz_good' && /tested; clipboard cleared/.test(r.out));
ok('the saved key is 600', (fs.statSync(path.join(keys(), 'zz')).mode & 0o777) === 0o600);
ok('the clipboard is cleared', fs.readFileSync(path.join(home, 'clip'), 'utf8') === '');
ok('the link step links its path to the key', fs.readlinkSync(path.join(home, '.zz-key')) === path.join(keys(), 'zz'));

r = run([]);
ok('the listing says the saved key works, by its test line', /zz: works/.test(r.out) && /qq: missing/.test(r.out));

r = run(['zz'], { clip: 'zz_good' });
ok('the old key still on the clipboard is never written again', r.code === 1 && /no new key on the clipboard; nothing written/.test(r.out));
r = run(['zz'], { clip: 'run bin/set-key zz' });
ok('a clipboard without the prefix is never written', r.code === 1 && saved('zz') === 'zz_good');

r = run(['zz'], { clip: 'zz_good2', env: { CURL_RC: '7' } });
ok('with no network a key is not saved (no answer is never a pass)', r.code === 1 && saved('zz') === 'zz_good' && /no network/.test(r.out));

r = run(['qq'], { clip: 'qq_anything' });
ok('a prefix with no test is saved and said untested, never working', r.code === 0 && saved('qq') === 'qq_anything' && /UNTESTED/.test(r.out));
r = run([]);
ok('the listing says it is untested', /qq: saved, untested/.test(r.out));

// refusals before anything is asked for
fresh('zz zz_\ntest zz_\n');
r = run(['zz'], { clip: 'zz_x' });
ok('a test line with no command rejects, never passes every key', r.code === 1 && saved('zz') === null && /names no command/.test(r.out));
fresh('zz zz_ frobnicate\n');
r = run(['zz'], { clip: 'zz_x' });
ok('an unknown step stops before a key is asked for', r.code === 2 && saved('zz') === null && /unknown step 'frobnicate'/.test(r.out) && !/Copy the key/.test(r.out));
fresh('zz zz_ link\n');
r = run(['zz'], { clip: 'zz_x' });
ok('a link with no path stops before a key is asked for', r.code === 2 && /names no path/.test(r.out));
fresh('zz zz_ ssh host /etc/x.php\n');
r = run(['zz'], { clip: 'zz_x' });
ok('the retired ssh step is refused with the line that replaces it', r.code === 2 && /run ~\/.config\/keys\/hooks\/ssh-php-config host \/etc\/x.php/.test(r.out) && saved('zz') === null);
fresh('zz zz_\n');
ok('a name not in keys.conf is refused', run(['nope']).code === 2);
ok('"test" is not a key', /names a test line/.test(run(['test']).out));

// the toolkit's own Figma test: 401 rejected, 403 a working token; the key on stdin, never on curl's command line
fresh('figma figd_\n');
r = run(['figma'], { clip: 'figd_FAKE401', env: { FIGMA_CODE: '401' } });
ok('a Figma token Figma rejects (401) is not saved', r.code === 1 && saved('figma') === null && /Figma rejected/.test(r.out));
r = run(['figma'], { clip: 'figd_FAKE403', env: { FIGMA_CODE: '403' } });
ok('a Figma token answered 403 (no scope for /v1/me) is saved as tested', r.code === 0 && saved('figma') === 'figd_FAKE403');
ok('the key never appears in curl\'s arguments', !/figd_FAKE/.test(fs.readFileSync(path.join(home, 'curl.log'), 'utf8')));

// a run step gets the key on stdin, with its name and prefix, quoting kept
fresh(`zz zz_ run printf '%s|%s|' "$KEY_NAME" "$KEY_PREFIX" > "$HOME/handed"; cat >> "$HOME/handed"\ntest zz_ true\n`);
r = run(['zz'], { clip: 'zz_handme' });
ok('a run step gets the key on stdin, with KEY_NAME and KEY_PREFIX', r.code === 0 && fs.readFileSync(path.join(home, 'handed'), 'utf8') === 'zz|zz_|zz_handme');
fs.rmSync(path.join(home, 'handed'));
r = run(['zz', '--again']);
ok('--again hands the saved key on without asking for one', r.code === 0 && !/Copy the key/.test(r.out) && fs.readFileSync(path.join(home, 'handed'), 'utf8').endsWith('zz_handme'));

// a file already where a link goes is left alone and named, and the run says it failed
fresh('zz zz_ link ~/.zz-key\ntest zz_ true\n');
fs.writeFileSync(path.join(home, '.zz-key'), 'hand-written');
r = run(['zz'], { clip: 'zz_new' });
ok('a file where a link goes is left alone, named, and the run fails', r.code === 1 && fs.readFileSync(path.join(home, '.zz-key'), 'utf8') === 'hand-written' && /is not a link/.test(r.out));

console.log(`${n}/${n} passed`);
