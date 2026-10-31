#!/usr/bin/env node
/*
 * A project's stored library as it was at a git revision — `{ tokens, specs,
 * index }` in the shape store.diff() takes — read with `git show`, never from
 * the working tree. `WORKTREE` reads the files on disk instead. For the
 * changes backfill and for proving a differ against real history.
 *
 *   const { atRev } = require('./at-rev.cjs');
 *   atRev(contract.layout(projectsDir, '<label>'), 'd39267b')
 *
 * Takes the project's LAYOUT, because where a snapshot lives is a fact the
 * layout owns and there are two kinds: a design-only project's parts sit
 * under `<project home>/snapshot` in the toolkit, a code project's beside
 * its code, in its own git repo, at the paths its `snapshot.config.json`
 * gives. Assuming the first shape is why a backfill over a repo-hosted
 * project read an empty tree in the toolkit and reported "0 entries from 0
 * commits" — silently, because no path is missing when none was looked for.
 */
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

/*
 * The git repository holding the snapshot, and the three parts the differ
 * reads, relative to it. Previews and the change log itself are left out on
 * purpose: a commit that touched only those cannot move a diff, so naming
 * them as history would pair two identical states.
 */
function parts(where) {
  if (!where || !where.paths) throw new Error('atRev takes a project layout (contract.layout), not a label');
  // a design-only project's own repo: the one its figma-design-system/ sits in
  const root = where.repo ? require('./projects.cjs').expand(where.repo) : path.dirname(where.projectDir);
  const rel = (p) => path.relative(root, p).split(path.sep).join('/');
  return { root, tokens: rel(where.paths.tokens), components: rel(where.paths.components), index: rel(where.paths.index) };
}

/*
 * A project RENAMED in git keeps its history under the old folder: one project
 * moved to a new folder on 30 Sep, and reading every earlier revision
 * at the new path found nothing, so a whole week of its log could not be
 * graded. `git log --follow` on the token file names every path it has had;
 * the folder the snapshot sat in at a revision is the one whose token file
 * exists there, and the components and index moved with it.
 */
const pastPaths = new Map();
function pathsAt(where, rev) {
  const now = parts(where);
  if (rev === 'WORKTREE') return now;
  const key = now.root + '\0' + now.tokens;
  if (!pastPaths.has(key)) {
    let names = [];
    try { names = execFileSync('git', ['log', '--follow', '--name-only', '--format=', '--', now.tokens], { cwd: now.root, encoding: 'utf8' }).split('\n').filter(Boolean); } catch { names = []; }
    pastPaths.set(key, [...new Set([now.tokens, ...names])]);
  }
  const exists = (p) => { try { execFileSync('git', ['cat-file', '-e', `${rev}:${p}`], { cwd: now.root, stdio: 'ignore' }); return true; } catch { return false; } };
  const was = pastPaths.get(key).find(exists);
  if (!was || was === now.tokens) return now;
  // the same tail under another folder: swap the folder for every part
  const a = now.tokens.split('/'), b = was.split('/');
  let k = 0; while (k < Math.min(a.length, b.length) && a[a.length - 1 - k] === b[b.length - 1 - k]) k++;
  const from = a.slice(0, a.length - k).join('/'), to = b.slice(0, b.length - k).join('/');
  const move = (p) => (from && p.startsWith(from + '/') ? to + p.slice(from.length) : p);
  return { root: now.root, tokens: was, components: move(now.components), index: move(now.index) };
}

function atRev(where, rev) {
  const { root, tokens, components, index } = pathsAt(where, rev);
  const read = (p) => {
    if (rev === 'WORKTREE') { const f = path.join(root, p); return fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : null; }
    try { return execFileSync('git', ['show', `${rev}:${p}`], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }); } catch { return null; }
  };
  // A repo keeps its specs beside the code that reads them, so a component's
  // folder holds its markup and styles too: the spec is the file named
  // figma.json, and nothing else in there is one.
  const list = () => {
    if (rev === 'WORKTREE') { const d = path.join(root, components); return fs.existsSync(d) ? fs.readdirSync(d).map((f) => `${components}/${f}/figma.json`) : []; }
    try { return execFileSync('git', ['ls-tree', '-r', '--name-only', rev, components], { cwd: root, encoding: 'utf8' }).split('\n').filter((f) => f.endsWith('/figma.json')); } catch { return []; }
  };
  const json = (p) => { const t = read(p); if (t == null) return null; try { return JSON.parse(t); } catch { return { __unreadable: p }; } };
  const specs = {}, unreadable = [];
  for (const f of list()) { const folder = f.split('/').slice(-2, -1)[0]; const s = json(f); if (!s) continue; if (s.__unreadable) unreadable.push(folder); else specs[folder] = s; }
  return { tokens: json(tokens), specs, index: json(index), unreadable };
}

/** The index alone at a revision, or null: which file each component came from. */
function indexAt(where, rev) {
  const { root, index } = pathsAt(where, rev);
  let t = null;
  if (rev === 'WORKTREE') { const f = path.join(root, index); t = fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : null; }
  else { try { t = execFileSync('git', ['show', `${rev}:${index}`], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }); } catch { t = null; } }
  try { return t == null ? null : JSON.parse(t); } catch { return null; }
}

/** The commits that touched a project's snapshot, oldest first. */
function snapshotCommits(where) {
  const { root, tokens, components, index } = parts(where);
  const lines = (args) => { try { return execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim().split('\n').filter(Boolean); } catch { return []; } };
  // …and the token file's commits under every name it has had (pathsAt).
  const seen = new Map();
  // Git lists newest first; two commits in one second keep git's order, which
  // a sort by time alone would not.
  const all = [...lines(['log', '--format=%h %cI', '--', tokens, components, index]), ...lines(['log', '--follow', '--format=%h %cI', '--', tokens])];
  all.forEach((l, i) => { const [rev, at] = l.split(' '); if (!seen.has(rev)) seen.set(rev, { rev, at, i }); });
  return [...seen.values()].sort((x, y) => new Date(x.at) - new Date(y.at) || y.i - x.i).map(({ rev, at }) => ({ rev, at }));
}

module.exports = { atRev, indexAt, snapshotCommits };
