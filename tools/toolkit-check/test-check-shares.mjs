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
// a write: a call that writes a file, or git changing a repo (its worktrees, branches, refs or config)
const GIT_WRITE = /\b(?:worktree|branch|prune|remove|clone|reset|commit|config|stash|checkout|init|merge|rebase|push|tag|update-ref)\b/;
const WRITES = /\b(?:writeFileSync|appendFileSync|mkdirSync|rmSync|renameSync|symlinkSync|copyFileSync|cpSync|unlinkSync|rmdirSync|createWriteStream|writeFile|appendFile|mkdir|rm|rename|unlink)\s*\(/;
const JS_GIT = /(?:['"`]git['"`]|\bgit\s*\()[^\n]*['"`](?:worktree|branch|prune|remove|clone|reset|commit|config|stash|checkout|init|merge|rebase|push|tag|update-ref)['"`]/;
const SH_WRITES = />>?\s*"?\$|(?:^|[;&|{(]\s*)(?:rm|mkdir|cp|mv|ln|touch)\s/m;
const SH_GIT = /\bgit\s+(?:-[Cc]\s+\S+\s+)*(?:worktree|branch|prune|clone|reset|commit|config|stash|checkout|init|merge|rebase|push|tag|update-ref)\b/;
const TEMP = /mkdtemp|tmpdir\(\)|\$\{?TMPDIR\b|process\.env\.TMPDIR|mktemp/;
const STARTS = /\b(?:spawn|spawnSync|fork|execFile|execFileSync|exec|execSync)\s*\(|new Worker\(|^\s*(?:node|sh|python3)\s/m;
const HOME = /\bhomedir\(\)|process\.env\.HOME\b|\$\{?HOME\b|['"`]~\//;

/* The scripts a file starts by path: a script name in a string on a line that starts a process, or set to a name such
   a line uses (const SERVE = join(HERE, 'serve.mjs') … spawn('node', [SERVE])), resolved from the file's folder (with
   the strings before it, for join(HERE, '..', 'x', 'y.mjs')) or from the repo. A name read as data (a file the test
   reads) or imported is not a process. */
const STARTS_LINE = /\b(?:spawn|spawnSync|fork|execFile|execFileSync|exec|execSync)\s*\(|new Worker\(|^\s*(?:node|sh|python3)\s/;
function launched(file, src, root = REPO) {
  const out = [];
  if (!STARTS.test(src)) return out;
  const lines = src.split('\n').filter((l) => !l.includes('not-shared:'));
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
/* What a started script's environment holds, as text to look a variable up in: the statements that start it (a line
   naming it, or a name set to it, and the three after, for a call spread over lines), the env objects they pass by
   name (`env: base`, `{ ...env, X }`), and what the starter sets for all it starts (process.env.X = at the top level). */
const topEnv = (src) => src.split('\n').filter((l) => /^process\.env\.\w+\s*=(?!=)/.test(l)).join('\n');
function startedBy(src, file) {
  const lines = src.split('\n');
  const keys = [path.basename(file)];
  for (const l of lines) { const m = l.match(/\b(?:const|let|var)\s+(\w+)\s*=[^;]*['"`/]/); if (m && l.includes(keys[0])) keys.push(m[1]); }
  const near = (i) => lines.slice(i, i + 4).join('\n');
  let text = lines.map((l, i) => (keys.some((k) => (k === keys[0] ? l.includes(k) : new RegExp(`\\b${k}\\b`).test(l))) ? near(i) : null)).filter(Boolean).join('\n');
  for (let seen = new Set(), more = true; more;) {
    more = false;
    for (const [, v] of text.matchAll(/\benv:\s*\{?\s*(?:\.\.\.)?(\w+)/g)) {
      if (seen.has(v) || v === 'process') continue;
      seen.add(v); more = true;
      lines.forEach((l, i) => { if (new RegExp(`\\b(?:const|let|var)\\s+${v}\\s*=`).test(l)) text += '\n' + near(i); });
    }
  }
  return text + '\n' + topEnv(src);
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
export function reach(entries, own = '') {
  // a process's environment: for an entry, what the bin/check body sets where it runs it and what the file sets for
  // itself at its top level; for a started script, that and what its start sets
  const env = new Map();
  for (const e of entries.filter((f) => fs.existsSync(f))) env.set(e, startedBy(own, e) + '\n' + topEnv(fs.readFileSync(e, 'utf8')));
  // a started script inherits its starter's environment, and what the start adds
  for (const e of [...env.keys()]) {
    const src = fs.readFileSync(e, 'utf8');
    for (const f of launched(e, src)) if (!imports(e).includes(f) && !env.has(f)) env.set(f, env.get(e) + '\n' + startedBy(src, f));
  }
  const libs = new Set();
  for (const p of env.keys()) for (const f of imports(p)) if (!env.has(f)) libs.add(f);
  return [...[...env].map(([file, sets]) => ({ file, whole: true, sets })), ...[...libs].map((file) => ({ file, whole: false, sets: '' }))];
}
/* What a file's code does that another step could disturb: the tags it needs. Calls, not mentions: a message naming
   launchctl, or a home path only printed, is no use. A write is judged by the path on its line: a name set from a temp
   folder (mkdtemp, tmpdir(), mktemp), followed through the names set from it, is the step's own; one set from the home
   folder needs home:<its first folder there> (~/.toolkit/x: home:toolkit; none readable: home:?, which only alone
   covers); anything else, in the step's own code, is the tree it runs in. A use an environment variable moves reads
   `<tag> unless <VAR>`: it is not needed by a process whose start sets VAR. Shell statements continued with \ are one. */
const segOf = (text, from) => { const m = text.slice(from).match(/['"`]~?\/?\.?([A-Za-z0-9_-]+)|\/\.?([A-Za-z0-9_-]+)/); return m ? (m[1] || m[2]).toLowerCase() : '?'; };
const PATHY = /^\s*(?:(?:path\.)?(?:join|resolve|dirname|normalize)\(|[`'"]|\w+\s*(?:$|\+|\|\||\?\?|\?)|process\.env\.\w+\s*(?:\|\||\?\?))/;
function names(c, shell) {
  const tmp = new Set(), home = new Map();
  // every name a line declares, with what it is set to: `const a = x, b = y` (split at the top level, ended by `;`) and
  // `process.env.X = y`, or a shell's `X=y`; a third field marks a function (`const wt = (n) => …`).
  const sets = (l) => {
    if (shell) { const m = l.match(/^\s*(?:local\s+|export\s+)?(\w+)=(.*)$/); return m ? [[m[1], m[2]]] : []; }
    const out = [];
    for (const d of l.matchAll(/\b(?:const|let|var)\s+(\w+)\s*=(?!=)|^\s*((?:process\.env\.)?\w+)\s*=(?![=>])/g)) {
      let v = d[1] || d[2], from = d.index + d[0].length, depth = 0, q = null;
      for (let i = from; i <= l.length; i++) {
        const ch = l[i];
        if (q) { if (ch === '\\') i++; else if (ch === q) q = null; continue; }
        if (ch === "'" || ch === '"' || ch === '`') q = ch;
        else if ('([{'.includes(ch)) depth++;
        else if (')]}'.includes(ch) && ch) { if (--depth < 0) { out.push([v, l.slice(from, i)]); break; } }
        else if (i === l.length || (depth === 0 && ch === ';')) { out.push([v, l.slice(from, i)]); break; }
        else if (depth === 0 && ch === ',') {
          out.push([v, l.slice(from, i)]);
          const n = l.slice(i + 1).match(/^\s*(\w+)\s*=(?![=>])/); if (!n) break;
          v = n[1]; from = i + 1 + n[0].length; i = from - 1;
        }
      }
    }
    return out.map(([v, rhs]) => [v, rhs, /^\s*(?:async\b|function\b|\([^)]*\)\s*=>|\w+\s*=>)/.test(rhs)]);
  };
  const named = (v, t) => new RegExp(`(?:^|[^\\w.$]|\\$\\{?)${v.replace(/\./g, '\\.')}\\b`).exec(t);
  const homeIn = (t) => {
    const m = t.match(HOME);
    if (m) { const moved = (t.slice(0, m.index).match(/process\.env\.(\w+)\s*\|\|\s*$/) || t.slice(0, m.index).match(/process\.env\.(\w+)\s*\|\|/) || [])[1]; return { seg: m[0].startsWith("'~") || m[0].startsWith('"~') || m[0].startsWith('`~') ? segOf(t, m.index + 1) : segOf(t, m.index + m[0].length), moved: moved || 'HOME' }; }
    for (const [v, h] of home) { const r = named(v, t); if (r) return { seg: h.seg === '?' ? segOf(t, r.index + v.length) : h.seg, moved: h.moved }; }
    return null;
  };
  const tmpIn = (t) => TEMP.test(t) || [...tmp].some((v) => named(v, t));
  // a function declared over several lines (function repo() { … mkdtemp … }) makes a temp folder too
  const decls = shell ? [] : [...c.matchAll(/^(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\([\s\S]*?^\}/gm)];
  for (let changed = true; changed;) {
    changed = false;
    for (const [body, v] of decls) if (!tmp.has(v) && tmpIn(body)) { tmp.add(v); changed = true; }
    // a child's environment key set to a temp folder ({ ...process.env, STEP_DIR: steps }): process.env.STEP_DIR is one
    for (const [, k, rhs] of c.matchAll(/\b([A-Z][A-Z0-9_]+):\s*([^,}\n]+)/g)) if (!tmp.has(`process.env.${k}`) && tmpIn(rhs)) { tmp.add(`process.env.${k}`); changed = true; }
    for (const l of c.split('\n')) {
      // a name set from a temp folder is temp, and so is a function making one (its calls return or work in it);
      // a name set from the home folder is home, and passes it on only as a path (join, a template, a concatenation),
      // never through a call: what a function returns from a home path is data, not the path
      for (const [v, rhs, fn] of sets(l)) {
        if (home.has(v) || tmp.has(v)) continue;
        if (TEMP.test(rhs) || (fn && tmpIn(rhs))) { tmp.add(v); changed = true; continue; }
        if (fn) continue;
        const h = HOME.test(rhs) || PATHY.test(rhs) ? homeIn(rhs) : null;
        if (h) { home.set(v, h); changed = true; continue; }
        if (tmpIn(rhs)) { tmp.add(v); changed = true; }
      }
    }
  }
  return { homeIn, tmpIn };
}
export function uses(name, src, { entry: tree = false, whole = true } = {}) {
  let entry = tree;
  const kept = src.split('\n').filter((l) => !l.includes('not-shared:')).join('\n');
  const shell = /\.sh$/.test(name) || !path.extname(name) || name === 'bin/check';
  const c = shell ? stripComments(name, kept).replace(/\\\n/g, ' ') : stripComments(name, kept);
  const need = [];
  // Chrome: a launch through cdp.mjs (cdp.mjs itself only defines it), or another driver
  if ((/cdp\.mjs['"`]/.test(c) && /\blaunch\s*\(/.test(c)) || /\bpuppeteer\b|\bplaywright\b/.test(c)) need.push('chrome');
  if (/\b(?:spawn|spawnSync|execFile|execFileSync|exec|execSync)\s*\(\s*['"`]launchctl\b/.test(c)) need.push('launchd');
  // a shell's launchctl is the one on PATH: a step that puts a stand-in there drives no service
  if (shell && /^\s*(?:[^'"#]*(?:&&|\|\||;|\{)\s*)?launchctl\s/m.test(c)) need.push('launchd unless PATH');
  if (!whole) return need;
  const { homeIn, tmpIn } = names(c, shell);
  const writes = (l) => (shell ? SH_WRITES.test(l) || SH_GIT.test(l) : WRITES.test(l) || JS_GIT.test(l));
  // a shell that moves into a temp folder (cd "$SP/t", a clone) writes there from then on, not in the tree it was in
  if (shell && [...c.matchAll(/\bcd\s+("?[^\s;&|)]+)/g)].some((m) => tmpIn(m[1]))) entry = false;
  // each statement on its own (a line may hold several): one into a temp folder is the step's own
  for (const l of c.split('\n').flatMap((x) => x.split(/;\s/)).filter(writes)) {
    if (tmpIn(l)) continue;
    const h = homeIn(l);
    if (h) need.push(`home:${h.seg} unless ${h.moved}`);
    else if (entry) need.push('tree');
  }
  // the lock's folder: the measuring lock taken, or the read cache written
  const lockImport = name.startsWith('tools/shared/') ? /['"`]\.\/lock\.mjs['"`]/ : /shared\/lock\.mjs['"`]/;
  if (((lockImport.test(c) && /\bhold\s*\(/.test(c)) || /\b(?:recorder|cacheDir|lockDir)\s*\(/.test(c)) && !/^tools\/shared\/lock\.mjs$|read-cache\.mjs$/.test(name)) need.push('lockdir unless TOOLKIT_LOCK_DIR');
  return [...new Set(need)];
}
// what a step declares covers a need: the same tag, or alone; home:? (a home path the grep cannot read) only alone
const covered = (need, shares) => shares.includes('alone') || (need !== 'home:?' && shares.includes(need));

// The detector on its own: each use it is for is found, a marked line is not read, and a temp folder is not the tree.
assert.deepEqual(uses('x.mjs', "import { attach } from './cdp.mjs';"), [], 'importing cdp.mjs is not a launch'); // not-shared: a fixture
assert.deepEqual(uses('x.mjs', "import { launch } from '../shared/cdp.mjs';\nconst b = await launch({});"), ['chrome'], 'a launch through cdp.mjs is Chrome'); // not-shared: a fixture
assert.deepEqual(uses('x.mjs', "console.log('run launchctl kickstart -k gui/1/x')"), [], 'a message naming launchctl is not a call'); // not-shared: a fixture
assert.deepEqual(uses('x.mjs', "execFileSync('launchctl', ['list'])"), ['launchd'], 'launchctl is launchd'); // not-shared: a fixture
assert.deepEqual(uses('x.sh', 'launchctl bootout "gui/$(id -u)/x"'), ['launchd unless PATH'], "a shell's launchctl is the one on PATH"); // not-shared: a fixture
assert.deepEqual(uses('x.mjs', "fs.writeFileSync(path.join(os.homedir(), '.x'), '')"), ['home:x unless HOME'], 'a write beside the home folder is home:<its folder>'); // not-shared: a fixture
assert.deepEqual(uses('x.mjs', "const d = path.join(os.homedir(), 'Downloads');\nfs.mkdirSync(d);"), ['home:downloads unless HOME'], 'a write to a name set from the home folder is home'); // not-shared: a fixture
assert.deepEqual(uses('x.mjs', "const F = process.env.TOOLKIT_X || path.join(os.homedir(), '.toolkit', 'x');\nfs.mkdirSync(F);"), ['home:toolkit unless TOOLKIT_X'], 'a home folder a variable moves is needed unless the start sets it'); // not-shared: a fixture
assert.deepEqual(uses('x.mjs', "const h = homedir();\nfs.writeFileSync(h, '');"), ['home:? unless HOME'], 'a home path the grep cannot read is home:?'); // not-shared: a fixture
assert.deepEqual(uses('x.mjs', "import { hold } from '../shared/lock.mjs';\nawait hold('x');"), ['lockdir unless TOOLKIT_LOCK_DIR'], 'the measuring lock is the lock folder'); // not-shared: a fixture
assert.deepEqual(uses('x.mjs', "import { hold } from './lock.mjs';\nhold(LOCK);"), [], "another folder's lock.mjs is not the measuring lock"); // not-shared: a fixture
assert.deepEqual(uses('t.mjs', "const page = `<b>${x}</b>`;", { entry: true }), [], 'markup in a string is not a shell redirect'); // not-shared: a fixture
assert.deepEqual(uses('x.mjs', "const h = path.relative(os.homedir(), out);\nconsole.log(h);\nfs.writeFileSync(out, '');"), [], 'a home path only printed is not home'); // not-shared: a fixture
assert.deepEqual(uses('x.mjs', "fs.writeFileSync(path.join(os.homedir(), '.x'), '') // not-shared: a fixture"), [], 'a marked line is not read'); // not-shared: a fixture
assert.deepEqual(uses('x.mjs', "// launchctl in a comment"), [], 'a comment is not code'); // not-shared: a fixture
assert.deepEqual(uses('t.mjs', "fs.writeFileSync('out.json', '')", { entry: true }), ['tree'], 'a step writing with no temp folder writes the tree'); // not-shared: a fixture
assert.deepEqual(uses('t.mjs', "const d = fs.mkdtempSync(path.join(os.tmpdir(), 'x'));\nconst f = path.join(d, 'a');\nfs.writeFileSync(f, '')", { entry: true }), [], 'a temp folder, through the names set from it, is not the tree'); // not-shared: a fixture
assert.deepEqual(uses('t.mjs', "const d = fs.mkdtempSync(path.join(os.tmpdir(), 'x'));\nfs.writeFileSync(d + '/a', '');\nfs.writeFileSync(path.join(REPO, 'x'), '')", { entry: true }), ['tree'], 'one temp folder excuses only the writes into it'); // not-shared: a fixture
assert.deepEqual(uses('t.mjs', "let d = null;\nd = fs.mkdtempSync('x');\nfs.writeFileSync(path.join(d, 'a'), '')", { entry: true }), [], 'a name set later to a temp folder is temp'); // not-shared: a fixture
assert.deepEqual(uses('t.mjs', "function repo() {\n  const d = fs.mkdtempSync('x');\n  return d;\n}\nconst r = repo();\nfs.rmSync(r);", { entry: true }), [], 'a function that makes a temp folder returns one'); // not-shared: a fixture
assert.deepEqual(uses('t.mjs', "const steps = fs.mkdtempSync('x');\nspawn('node', [R], { env: { STEP_DIR: steps } });\nfs.writeFileSync(process.env.STEP_DIR + '/a', '');", { entry: true }), [], "an environment key set to a temp folder is one"); // not-shared: a fixture
assert.deepEqual(uses('t.mjs', "const seen = path.join(os.tmpdir(), `x-rules-${id}`);\nconst rules = path.join(os.homedir(), '.claude');\nfs.writeFileSync(seen, '');", {}), [], 'a temp path whose text holds a home name is temp'); // not-shared: a fixture
assert.deepEqual(uses('t.mjs', "const f = path.join(os.homedir(), '.key');\nconst text = readIf(f);\nfs.writeFileSync(out, text);", {}), [], 'what a call returns from a home path is not the path'); // not-shared: a fixture
assert.deepEqual(uses('t.mjs', "git(repo, ['worktree', 'remove', p]);", { entry: true }), ['tree'], 'git removing a worktree of the repo is a write to it'); // not-shared: a fixture
assert.deepEqual(uses('bin/check', 'SP=$(mktemp -d)\nOUT=$(git clone -q "file://$REPO" "$SP/t" \\\n  && cp "$REPO/x" x)\nrm -rf "$SP"', { entry: true }), [], 'a shell statement working in a temp folder is not the tree'); // not-shared: a fixture
assert.deepEqual(uses('bin/check', 'git -C "$REPO" worktree prune', { entry: true }), ['tree'], "a shell's git prune is a write"); // not-shared: a fixture
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
  const add = (tags, where, sets) => { for (const u of tags) { const [t, v] = u.split(' unless '); if (!need.has(t) && !(v && new RegExp(`\\b${v}\\s*[:=](?!=)`).test(sets))) need.set(t, where); } };
  // the step's own code: its bin/check body, and its entry files, whose writes outside a temp folder are the tree's
  if (own) add(uses('bin/check', own, { entry: true }), `bin/check ${s.fn}()`, '');
  const entrySet = new Set(entries);
  // a body that moves into a temp clone (cd "$SP/t") runs its entries there: their writes land in the clone
  const inClone = own && [...own.matchAll(/\bcd\s+"\$(\w+)/g)].some(([, v]) => new RegExp(`\\b${v}=\\$\\(mktemp`).test(own));
  for (const { file: f, whole, sets } of reach(entries, own || '')) add(uses(rel(f), fs.readFileSync(f, 'utf8'), { whole, entry: entrySet.has(f) && !inClone }), rel(f), sets);
  for (const [t, where] of need) if (!covered(t, s.shares)) misses.push(`${label}: uses ${t} (${where}) but declares ${s.shares.join(',') || '-'}`);
}
assert.deepEqual(misses, [], `every step declares what it uses:\n${misses.join('\n')}`);

// The suites' table names only suites that exist.
const table = src.match(/^SUITE_SHARES='\n([\s\S]*?)^'/m);
assert.ok(table, 'bin/check holds SUITE_SHARES');
const suites = new Set(list.filter((s) => s.fn === 's_suite').map((s) => s.args[0]));
const stale = table[1].trim().split('\n').filter((l) => !l.startsWith('#')).map((l) => l.split(/\s+/)[0]).filter((p) => !suites.has(p));
assert.deepEqual(stale, [], 'no line in SUITE_SHARES names a suite that is gone');

// Declared by hand, past what the grep reads: test-serve starts the editor with the real HOME (only the router and
// the stranger get another), and the editor's project list sweeps the kept snapshots under ~/.toolkit.
assert.ok(list.find((x) => x.args[0] === 'tools/contract-editor/test-serve.mjs').shares.includes('home:toolkit'), 'test-serve declares the home folder it shares');

console.log(`ok check shares: ${list.length} steps, every use declared`);
