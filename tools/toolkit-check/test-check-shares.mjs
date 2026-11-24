// bin/check's step list says what each step shares (Chrome, launchd, the home folder, the repo's tree, the lock's
// folder), and the scheduler keeps steps that share a thing apart. A step that uses one without saying so would run
// beside another that uses it: this reads every step's code, the files it imports and the scripts it starts by path,
// and fails each use its declaration lacks, and each declaration naming no step. Grep-level: a use found where none
// happens is marked on its line with `not-shared: <why>`, and the line is not read.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { stripComments } from './strip.mjs';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const rel = (f) => path.relative(REPO, f);
const SCRIPT = /\.(?:mjs|cjs|js|sh|py)$/;
const WRITES = /\b(?:writeFileSync|appendFileSync|mkdirSync|rmSync|renameSync|symlinkSync|copyFileSync|cpSync|unlinkSync|rmdirSync|createWriteStream|writeFile|appendFile|mkdir|rm|rename|unlink)\s*\(|['"`]git['"`][^\n]*['"`](?:commit|config|stash|checkout)['"`]/;
const SH_WRITES = />>?\s*"?\$|(?:^|[;&|{]\s*)(?:rm|mkdir|cp|mv|ln|touch)\s|\bgit\s+(?:commit|config|stash|checkout)\b/m;
const TEMP = /mkdtemp|tmpdir\(\)|\$TMPDIR|process\.env\.TMPDIR|mktemp/;
const STARTS = /\b(?:spawn|spawnSync|fork|execFile|execFileSync|exec|execSync)\s*\(|new Worker\(|^\s*(?:node|sh|python3)\s/m;
const HOME = /\bos\.homedir\(\)|\bhomedir\(\)|process\.env\.HOME\b|\$\{?HOME\}?\b|['"`]~\//;

/* The scripts a file starts by path: a script name in a string on a line that starts a process, or set to a name such
   a line uses (const SERVE = join(HERE, 'serve.mjs') … spawn('node', [SERVE])), resolved from the file's folder (with
   the strings before it, for join(HERE, '..', 'x', 'y.mjs')) or from the repo. A name read as data (a file the test
   reads) or imported is not a process. */
const STARTS_LINE = /\b(?:spawn|spawnSync|fork|execFile|execFileSync|exec|execSync)\s*\(|new Worker\(|^\s*(?:node|sh|python3)\s/;
function launched(file, src, root = REPO) {
  const out = [];
  if (!STARTS.test(src)) return out;
  const lines = src.split('\n');
  const starting = lines.filter((l) => STARTS_LINE.test(l)).join('\n');
  for (const line of lines) {
    const name = line.match(/^\s*(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=/);
    if (!STARTS_LINE.test(line) && !(name && new RegExp(`\\b${name[1]}\\b`).test(starting))) continue;
    const lits = [...line.matchAll(/(['"`])([^'"`$\s]+?)\1/g)].map((m) => m[2]);
    lits.forEach((l, i) => {
      if (!SCRIPT.test(l)) return;
      for (let k = 0; k <= i; k++) for (const base of [path.dirname(file), root]) {
        const f = path.resolve(base, ...lits.slice(k, i + 1));
        if (f.startsWith(root + path.sep) && !f.includes('node_modules') && fs.existsSync(f) && fs.statSync(f).isFile()) out.push(f);
      }
    });
  }
  return [...new Set(out)];
}
/* What a step's code is: its entry files and the scripts they start by path (its processes, one level), each read
   whole, and the modules each imports directly, read for a Chrome launch and a launchctl call only. Deeper imports,
   and a library's writes, are not read: which of a library's functions runs, with which folder, is past what a grep
   can see (a library writing under the home folder takes a folder from its caller or an environment variable). */
const direct = new Map();
function imports(f) {
  if (!direct.has(f)) {
    const src = fs.readFileSync(f, 'utf8');
    const out = [];
    for (const m of src.matchAll(/(?:\bfrom\s*|\bimport\s*\(?\s*|\b(?:require|req)\s*\(\s*|\bcreateRequire\([^)]*\)\s*\(\s*)(['"`])(\.{1,2}\/[^'"`$]+)\1/g)) {
      const to = path.resolve(path.dirname(f), m[2]);
      const hit = ['', '.js', '.cjs', '.mjs'].map((x) => to + x).find((x) => fs.existsSync(x) && fs.statSync(x).isFile());
      if (hit && !hit.includes('node_modules')) out.push(hit);
    }
    direct.set(f, out);
  }
  return direct.get(f);
}
export function reach(entries) {
  const procs = new Set(entries.filter((f) => fs.existsSync(f)));
  for (const e of [...procs]) for (const f of launched(e, fs.readFileSync(e, 'utf8'))) if (!imports(e).includes(f)) procs.add(f);
  const libs = new Set();
  for (const p of procs) for (const f of imports(p)) if (!procs.has(f)) libs.add(f);
  return [...[...procs].map((file) => ({ file, whole: true })), ...[...libs].map((file) => ({ file, whole: false }))];
}
/* What a file's code does that another step could disturb: the tags it needs. Calls, not mentions: a message naming
   launchctl, or a home path only printed, is no use. A use an environment variable moves elsewhere reads
   `<tag> unless <VAR>`: a step that sets VAR for what it runs (a temp HOME, TOOLKIT_LOCK_DIR) does not need it.
   `entry`: the step's own file, whose writes outside a temp folder land in the tree it runs in. */
export function uses(name, src, { entry = false, whole = true } = {}) {
  const kept = src.split('\n').filter((l) => !l.includes('not-shared:')).join('\n');
  const c = stripComments(name, kept);
  const shell = /\.sh$/.test(name) || !path.extname(name);
  const need = [];
  // Chrome: a launch through cdp.mjs (cdp.mjs itself only defines it), or another driver
  if ((/cdp\.mjs['"`]/.test(c) && /\blaunch\s*\(/.test(c)) || /\bpuppeteer\b|\bplaywright\b/.test(c)) need.push('chrome');
  if (/\b(?:spawn|spawnSync|execFile|execFileSync|exec|execSync)\s*\(\s*['"`]launchctl\b/.test(c)) need.push('launchd');
  // a shell's launchctl is the one on PATH: a step that puts a stand-in there drives no service
  if (shell && /^\s*(?:[^'"#]*(?:&&|\|\||;|\{)\s*)?launchctl\s/m.test(c)) need.push('launchd unless PATH');
  if (!whole) return need;
  // home: a write whose line names the home folder, or a name set from it; os.homedir() is $HOME
  const writes = shell ? SH_WRITES : WRITES;
  const fromHome = [...c.matchAll(/(?:const|let|var)\s+(\w+)\s*=([^;\n]*(?:homedir\(\)|process\.env\.HOME\b)[^;\n]*)/g)];
  for (const l of c.split('\n').filter((x) => writes.test(x))) {
    if (HOME.test(l)) need.push('home unless HOME');
    for (const [, v, rhs] of fromHome) if (new RegExp(`\\b${v}\\b`).test(l)) {
      const moved = rhs.match(/process\.env\.(\w+)\s*\|\|/);
      need.push(moved ? `home unless ${moved[1]}` : 'home unless HOME');
    }
  }
  // the lock's folder: the measuring lock taken, or the read cache written
  const lockImport = name.startsWith('tools/shared/') ? /['"`]\.\/lock\.mjs['"`]/ : /shared\/lock\.mjs['"`]/;
  if (((lockImport.test(c) && /\bhold\s*\(/.test(c)) || /\b(?:recorder|cacheDir|lockDir)\s*\(/.test(c)) && !/^tools\/shared\/lock\.mjs$|read-cache\.mjs$/.test(name)) need.push('lockdir unless TOOLKIT_LOCK_DIR');
  if (entry && c.split('\n').some((l) => writes.test(l)) && !TEMP.test(c)) need.push('tree');
  return [...new Set(need)];
}
const covered = (need, shares) => shares.includes('alone') || (need === 'home' ? shares.some((s) => s.startsWith('home:')) : shares.includes(need));

// The detector on its own: each use it is for is found, a marked line is not read, and a temp folder is not the tree.
assert.deepEqual(uses('x.mjs', "import { attach } from './cdp.mjs';"), [], 'importing cdp.mjs is not a launch'); // not-shared: a fixture
assert.deepEqual(uses('x.mjs', "import { launch } from '../shared/cdp.mjs';\nconst b = await launch({});"), ['chrome'], 'a launch through cdp.mjs is Chrome'); // not-shared: a fixture
assert.deepEqual(uses('x.mjs', "console.log('run launchctl kickstart -k gui/1/x')"), [], 'a message naming launchctl is not a call'); // not-shared: a fixture
assert.deepEqual(uses('x.mjs', "execFileSync('launchctl', ['list'])"), ['launchd'], 'launchctl is launchd'); // not-shared: a fixture
assert.deepEqual(uses('x.sh', 'launchctl bootout "gui/$(id -u)/x"'), ['launchd unless PATH'], "a shell's launchctl is the one on PATH"); // not-shared: a fixture
assert.deepEqual(uses('x.mjs', "fs.writeFileSync(path.join(os.homedir(), '.x'), '')"), ['home unless HOME'], 'a write beside the home folder is home'); // not-shared: a fixture
assert.deepEqual(uses('x.mjs', "const d = path.join(os.homedir(), '.x');\nfs.mkdirSync(d);"), ['home unless HOME'], 'a write to a name set from the home folder is home'); // not-shared: a fixture
assert.deepEqual(uses('x.mjs', "const F = process.env.TOOLKIT_X || path.join(os.homedir(), '.x');\nfs.mkdirSync(F);"), ['home unless TOOLKIT_X'], 'a home folder a variable moves is needed unless the step sets it'); // not-shared: a fixture
assert.deepEqual(uses('x.mjs', "import { hold } from '../shared/lock.mjs';\nawait hold('x');"), ['lockdir unless TOOLKIT_LOCK_DIR'], 'the measuring lock is the lock folder'); // not-shared: a fixture
assert.deepEqual(uses('x.mjs', "import { hold } from './lock.mjs';\nhold(LOCK);"), [], "another folder's lock.mjs is not the measuring lock"); // not-shared: a fixture
assert.deepEqual(uses('t.mjs', "const page = `<b>${x}</b>`;", { entry: true }), [], 'markup in a string is not a shell redirect'); // not-shared: a fixture
assert.deepEqual(uses('x.mjs', "const h = path.relative(os.homedir(), out);\nconsole.log(h);\nfs.writeFileSync(out, '');"), [], 'a home path only printed is not home'); // not-shared: a fixture
assert.deepEqual(uses('x.mjs', "fs.writeFileSync(path.join(os.homedir(), '.x'), '') // not-shared: a fixture"), [], 'a marked line is not read'); // not-shared: a fixture
assert.deepEqual(uses('x.mjs', "// launchctl in a comment"), [], 'a comment is not code'); // not-shared: a fixture
assert.deepEqual(uses('t.mjs', "fs.writeFileSync('out.json', '')", { entry: true }), ['tree'], 'a step writing with no temp folder writes the tree'); // not-shared: a fixture
assert.deepEqual(uses('t.mjs', "const d = fs.mkdtempSync(path.join(os.tmpdir(), 'x')); fs.writeFileSync(d + '/a', '')", { entry: true }), [], 'a temp folder is not the tree'); // not-shared: a fixture
const fx = fs.mkdtempSync(path.join(os.tmpdir(), 'shares-'));
fs.writeFileSync(path.join(fx, 'a.mjs'), "const B = join(HERE, 'b.mjs');\nspawn('node', [join(HERE, 'sub', 'c.mjs')]);\nspawnSync('node', [B]);\nconst data = readFileSync(join(HERE, 'sub', 'c.mjs'));\n");
fs.writeFileSync(path.join(fx, 'b.mjs'), '');
fs.mkdirSync(path.join(fx, 'sub')); fs.writeFileSync(path.join(fx, 'sub', 'c.mjs'), '');
const fxa = fs.readFileSync(path.join(fx, 'a.mjs'), 'utf8');
assert.deepEqual(launched(path.join(fx, 'a.mjs'), fxa, fx).map((f) => path.relative(fx, f)).sort(), ['b.mjs', path.join('sub', 'c.mjs')], 'a script started by a joined path, or by a name set to one, is found');
assert.deepEqual(launched(path.join(fx, 'a.mjs'), "const data = readFileSync(join(HERE, 'b.mjs'));\nspawn('ls');", fx), [], 'a script read as data is not started');
assert.deepEqual(launched(path.join(fx, 'a.mjs'), fxa), [], 'a path outside the repo is not followed');
fs.rmSync(fx, { recursive: true, force: true });

// The real list: every step's uses are declared.
const src = fs.readFileSync(path.join(REPO, 'bin/check'), 'utf8');
const body = (fn) => { const m = src.match(new RegExp(`^${fn}\\(\\) \\{\\n([\\s\\S]*?)^\\}`, 'm')); assert.ok(m, `bin/check defines ${fn}`); return m[1]; };
const list = execFileSync(path.join(REPO, 'bin/check'), ['--list'], { cwd: REPO, encoding: 'utf8', env: { ...process.env, TOOLKIT_LOCK_HELD: '1' } })
  .trim().split('\n').map((l) => { const [shares, fn, ...args] = l.split('\t'); return { shares: shares === '-' ? [] : shares.split(','), fn, args }; });
assert.ok(list.length > 100, `bin/check --list lists its steps (${list.length})`);
const misses = [];
for (const s of list) {
  const label = s.fn === 's_suite' ? s.args[0] : `${s.fn}${s.args[0] ? ' ' + s.args[0] : ''}`;
  let entries, own;
  if (s.fn === 's_suite') { entries = [path.join(REPO, s.args[0])]; own = null; }
  else {
    own = body(s.fn);
    entries = [...own.matchAll(/(?:node|python3|sh|\.\/|cp "\$REPO\/)\s*((?:tools|standards|bin|skills|plugins)\/[\w./-]+|install\.sh)/g)].map((m) => path.join(REPO, m[1])).filter((f) => fs.existsSync(f));
  }
  const need = new Map();
  // what the step sets for what it runs: an env key in its own code, or VAR= in its bin/check body
  const sets = (v) => (own && new RegExp(`\\b${v}=`).test(own)) || entries.some((f) => SCRIPT.test(f) && new RegExp(`\\b${v}\\s*[:=](?!=)`).test(stripComments(rel(f), fs.readFileSync(f, 'utf8'))));
  const add = (tags, where) => { for (const u of tags) { const [t, v] = u.split(' unless '); if (!need.has(t) && !(v && sets(v))) need.set(t, where); } };
  if (own) add(uses('bin/check', own, { entry: false }), `bin/check ${s.fn}()`);
  const entrySet = new Set(entries);
  for (const { file: f, whole } of reach(entries)) add(uses(rel(f), fs.readFileSync(f, 'utf8'), { whole, entry: entrySet.has(f) && s.fn === 's_suite' }), rel(f));
  for (const [t, where] of need) if (!covered(t, s.shares)) misses.push(`${label}: uses ${t} (${where}) but declares ${s.shares.join(',') || '-'}`);
}
assert.deepEqual(misses, [], `every step declares what it uses:\n${misses.join('\n')}`);

// The suites' table names only suites that exist.
const table = src.match(/^SUITE_SHARES='\n([\s\S]*?)^'/m);
assert.ok(table, 'bin/check holds SUITE_SHARES');
const suites = new Set(list.filter((s) => s.fn === 's_suite').map((s) => s.args[0]));
const stale = table[1].trim().split('\n').map((l) => l.split(/\s+/)[0]).filter((p) => !suites.has(p));
assert.deepEqual(stale, [], 'no line in SUITE_SHARES names a suite that is gone');

console.log(`ok check shares: ${list.length} steps, every use declared`);
