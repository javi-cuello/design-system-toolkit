/*
 * The change log's history: that a backfill reads the repository a project
 * actually keeps its snapshot in, that it names the file where the routing
 * can only mean one, and that it follows a project folder renamed in git.
 *
 * Each case fixes a defect found on 2026-09-23 against 130 commits of a real
 * repo-hosted project, where the backfill had been answering "0 entries from
 * 0 commits" and writing nothing.
 *
 *   node --test test-changes.cjs
 */
'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const store = require('./store.cjs');
const contract = require('./projects.cjs');
const { atRev, snapshotCommits } = require('./at-rev.cjs');

/*
 * A project whose snapshot lives in its OWN git repo, at paths its
 * snapshot.config.json gives — the shape the reader used to be blind to.
 * Returns the layout every caller takes, plus the revisions committed.
 */
function repoProject({ files, states }) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'changes-'));
  const repo = path.join(root, 'site');
  const projects = path.join(root, 'projects', 'demo');
  fs.mkdirSync(path.join(repo, 'design'), { recursive: true });
  fs.mkdirSync(projects, { recursive: true });
  fs.writeFileSync(path.join(repo, 'snapshot.config.json'), JSON.stringify({
    toolkit: root, project: 'demo',
    paths: { tokens: 'design/figma.json', components: 'src/ds', index: 'design/index.json', changes: 'design/changes.json' },
  }));
  fs.writeFileSync(path.join(projects, 'design-system-context.md'),
    '```json snapshot-routing\n' + JSON.stringify({ repo, files }) + '\n```\n');
  const git = (...a) => execFileSync('git', a, { cwd: repo, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  git('init', '-q');
  git('config', 'user.email', 'test@example.com');
  git('config', 'user.name', 'test');
  const revs = [];
  for (const state of states) {
    for (const [folder, spec] of Object.entries(state.specs || {})) {
      fs.mkdirSync(path.join(repo, 'src', 'ds', folder), { recursive: true });
      fs.writeFileSync(path.join(repo, 'src', 'ds', folder, 'figma.json'), JSON.stringify(spec));
      // A code repo keeps a component's markup beside its spec; only the spec is one.
      fs.writeFileSync(path.join(repo, 'src', 'ds', folder, `${folder}.css`), '/* not a spec */');
    }
    fs.writeFileSync(path.join(repo, 'design', 'figma.json'), JSON.stringify(state.tokens));
    if (state.index) fs.writeFileSync(path.join(repo, 'design', 'index.json'), JSON.stringify(state.index));
    git('add', '-A');
    // A state may say when it was committed: a live entry is graded across
    // the commits around its time, so a test of that needs the times fixed.
    if (state.date) execFileSync('git', ['commit', '-q', '-m', state.message || 'snapshot'], { cwd: repo, stdio: 'ignore', env: { ...process.env, GIT_AUTHOR_DATE: state.date, GIT_COMMITTER_DATE: state.date } });
    else git('commit', '-q', '-m', state.message || 'snapshot');
    revs.push(git('rev-parse', '--short', 'HEAD').trim());
  }
  return { root, repo, where: contract.layout(path.join(root, 'projects'), 'demo'), revs };
}

const TOKENS = { _meta: { file: 'UI library', fileKey: 'LIBKEY', snapshot: '2026-09-01' }, collections: {}, textStyles: [], paintStyles: [], effects: [] };
const spec = (name, extra = {}) => ({ name, default: { name, type: 'COMPONENT', ...extra } });

test('the snapshot is read from the repository the project keeps it in', () => {
  const { where, revs } = repoProject({
    files: { library: { key: 'LIBKEY', id: 'libid' } },
    states: [
      { specs: { button: spec('Button') }, tokens: TOKENS },
      { specs: { button: spec('Button', { width: 40 }), tag: spec('Tag') }, tokens: TOKENS },
    ],
  });
  // The reader used to join `projects/<label>/snapshot` onto the toolkit, find
  // nothing, and say so to nobody: no commits, no specs, and an empty log
  // written over a real history.
  const commits = snapshotCommits(where);
  assert.equal(commits.length, 2, 'both commits touched the snapshot');
  assert.deepEqual(commits.map((c) => c.rev), revs);

  const first = atRev(where, revs[0]);
  assert.deepEqual(Object.keys(first.specs), ['button'], 'the spec at the first revision');
  assert.ok(first.tokens, 'and its tokens');
  const second = atRev(where, revs[1]);
  assert.deepEqual(Object.keys(second.specs).sort(), ['button', 'tag'], 'the second revision adds one');
  assert.equal(second.specs.button.default.width, 40, 'read at that revision, not from disk');

  const live = atRev(where, 'WORKTREE');
  assert.deepEqual(Object.keys(live.specs).sort(), ['button', 'tag'], 'and the working tree reads the same folders');
  assert.equal(store.diff({ tokens: second.tokens, specs: second.specs }, { tokens: live.tokens, specs: live.specs }).components.changed.length, 0,
    'a clean tree differs from its own HEAD in nothing');
});

test('one library in the routing names the specs a revision predating the index left unattributed', () => {
  const { root, where, revs } = repoProject({
    files: { library: { key: 'LIBKEY', id: 'libid' } },
    states: [
      { specs: { button: spec('Button') }, tokens: TOKENS },                      // no index yet
      { specs: { button: spec('Button', { width: 40 }) }, tokens: TOKENS },        // still none
      { specs: { button: spec('Button', { width: 48 }) }, tokens: TOKENS, index: { components: { button: { file: 'LIBKEY' } } } },
    ],
  });
  const out = path.join(root, 'preview.json');
  execFileSync(process.execPath, [path.join(__dirname, 'backfill-changes.cjs'), 'demo', '--out', out, '--projects', path.join(root, 'projects')],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  const entries = JSON.parse(fs.readFileSync(out, 'utf8'));

  assert.ok(entries.length >= 2, `history was read: ${entries.length} entries from ${revs.length} commits`);
  assert.deepEqual([...new Set(entries.map((e) => e.file))], ['LIBKEY'],
    'every entry names the one library the routing knows, none says "all files"');
  assert.equal(entries.filter((e) => e.note).length, 0, 'so no entry carries the unattributable note');
  // The false pair the note used to hide: on the day the index arrived, every
  // spec left "all files" and joined the library, which the differ reads as a
  // removal and an addition of the whole system.
  assert.equal(entries.filter((e) => e.components.removed.length).length, 0, 'and nothing is reported as removed');
});



test('a project renamed in git is still read at revisions from before the rename', () => {
  // Project B sat in a folder under its organisation's name until 30 Sep 2026; reading its
  // earlier revisions at the new path found nothing, and a week of its log
  // could not be graded.
  const { repo, where } = repoProject({ files: { library: { key: 'LIBKEY', id: 'libid' } }, states: [] });
  const git = (...a) => execFileSync('git', a, { cwd: repo, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  fs.mkdirSync(path.join(repo, 'olddesign'), { recursive: true });
  fs.writeFileSync(path.join(repo, 'olddesign', 'figma.json'), JSON.stringify(TOKENS));
  fs.writeFileSync(path.join(repo, 'olddesign', 'index.json'), JSON.stringify({ components: {} }));
  git('add', '-A'); git('commit', '-q', '-m', 'before the rename');
  const before = git('rev-parse', '--short', 'HEAD').trim();
  fs.rmSync(path.join(repo, 'design'), { recursive: true, force: true });   // the fixture's empty folder would take the move inside it
  git('mv', 'olddesign', 'design'); git('commit', '-q', '-m', 'renamed');
  assert.ok(atRev(where, before).tokens, 'the token file is found under the folder it had then');
  assert.ok(snapshotCommits(where).some((c) => c.rev === before), 'the commit before the rename is in the history');
});

test('a snapshot appends to the change log without cutting the backfilled history', () => {
  const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'changes-')), 'changes.json');
  const entry = (i) => ({ at: `2026-01-01T00:00:${String(i).padStart(2, '0')}Z`, tokens: { added: [`t${i}`], removed: [], changed: [] }, components: { added: [], removed: [], changed: [] } });
  store.writeChanges(file, Array.from({ length: 60 }, (_, i) => entry(i)));
  assert.ok(store.recordChanges(file, entry(60)));
  const log = store.readChanges(file);
  assert.equal(log.length, 61, 'the oldest backfilled entries are kept');
  assert.deepEqual(log[0].tokens.added, ['t0']);
});

/*
 * --grades-only and --regrade over a log whose entries span commits made
 * since they were written. Review of 2 October 2026, round 2: a worktree pair
 * was graded against the worktree of the day it was regraded (R4), and a live
 * entry the router had graded could not be regraded at all (R3).
 */
const C = (h) => require('./spec.cjs').compact({ name: 'Chip', id: '1:1', props: {}, variants: [{ name: 'Default', type: 'COMPONENT', w: 40, h }] });
function graded() {
  const { root, repo, where, revs } = repoProject({
    files: { library: { key: 'LIBKEY', id: 'libid' } },
    states: [
      { specs: { chip: C(20) }, tokens: TOKENS, index: { components: { chip: { file: 'LIBKEY' } } }, date: '2026-09-01T10:00:00Z' },
      { specs: { chip: C(24) }, tokens: TOKENS, index: { components: { chip: { file: 'LIBKEY' } } }, date: '2026-09-02T10:00:00Z' },
      { specs: { chip: C(24), tag: spec('Tag') }, tokens: TOKENS, index: { components: { chip: { file: 'LIBKEY' }, tag: { file: 'LIBKEY' } } }, date: '2026-09-03T10:00:00Z' },
    ],
  });
  // …and the worktree has moved on again since the last commit
  fs.mkdirSync(path.join(repo, 'src', 'ds', 'pill'), { recursive: true });
  fs.writeFileSync(path.join(repo, 'src', 'ds', 'pill', 'figma.json'), JSON.stringify(spec('Pill')));
  const none = { added: [], removed: [], changed: [] };
  const log = [
    // a backfilled worktree pair, written on 1 Sep when the worktree held what revs[1] committed
    { at: '2026-09-01T12:00:00Z', file: 'LIBKEY', via: 'backfill', from: revs[0], to: 'WORKTREE', tokens: none, components: { ...none, changed: ['chip'] } },
    // a live entry the router graded at the moment, with a grade a later fix of the grader no longer gives
    { at: '2026-09-01T13:00:00Z', file: 'LIBKEY', tokens: none, components: { ...none, changed: ['chip'] },
      grade: { level: 'BREAKING', figma: 'major', code: 'major', changes: [{ rule: 'layer-removed', subject: 'chip', figma: 'major', code: 'minor', what: 'a layer removed — Icon' }] } },
    // a live entry the backfill graded against the worktree before any later commit existed
    { at: '2026-09-02T12:00:00Z', file: 'LIBKEY', tokens: none, components: { ...none, added: ['tag'] },
      grade: { level: 'BREAKING', figma: 'major', code: 'major', from: revs[1], to: 'WORKTREE', changes: [{ rule: 'component-removed', subject: 'tag', figma: 'major', code: 'major', what: 'stale' }] } },
    // a live entry nobody has graded, after the last commit
    { at: '2026-09-03T13:00:00Z', file: 'LIBKEY', tokens: none, components: { ...none, added: ['pill'] } },
  ];
  store.writeChanges(where.paths.changes, log);
  const run = (...flags) => execFileSync(process.execPath, [path.join(__dirname, 'backfill-changes.cjs'), 'demo', '--grades-only', '--write', ...flags, '--projects', path.join(root, 'projects')], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  return { where, revs, run, read: () => store.readChanges(where.paths.changes) };
}
const rules = (o) => (o.grade ? o.grade.changes.map((c) => `${c.rule}:${c.subject}`).sort() : []);

test('a worktree pair is graded to the first snapshot commit after its start, not to today\'s worktree', () => {
  const { run, read } = graded();
  run();
  const [wt] = read();
  assert.deepEqual(rules(wt), ['size-changed:chip'], 'the pair it drew, not the Tag and Pill added since');
});

test('a grade taken against the worktree is taken again once a later commit exists', () => {
  const { run, read, revs } = graded();
  run();
  const third = read()[2];
  assert.deepEqual(rules(third), ['component-added:tag']);
  assert.deepEqual([third.grade.from, third.grade.to], [revs[1], revs[2]], 'stamped with the commit it now ends at');
});

test('the producer stamps an after-the-fact grade with the revisions it was taken across', () => {
  const { run, read, revs } = graded();
  run();
  const fourth = read()[3];
  assert.deepEqual(rules(fourth), ['component-added:pill']);
  assert.deepEqual([fourth.grade.from, fourth.grade.to], [revs[2], 'WORKTREE'],
    'the stamp the dashboard reads to file nothing from it (breaking.mjs)');
});

test('--regrade takes a grade the router made again, and leaves it a live grade', () => {
  const { run, read } = graded();
  run();
  assert.deepEqual(rules(read()[1]), ['layer-removed:chip'], 'without --regrade the router\'s grade stands');
  run('--regrade');
  const second = read()[1];
  assert.deepEqual(rules(second), ['size-changed:chip'], 'the grade the grader gives now');
  assert.equal(second.grade.from, undefined, 'still the router\'s entry: what it raises is filed as before');
  assert.ok(second.grade.regraded, 'and says it was regraded, and across what');
});

test('a subject two live writes touched between the same two commits keeps the grade it was given', () => {
  // The commits around Project B's 1 October entry also hold the 30 September
  // write, and both touched the sidebar: across that window the two cannot be
  // told apart, and a regrade gave each the other's changes (a removal of
  // 30 September's filed under 1 October as a fresh major).
  const { run, read, where } = graded();
  const log = read();
  const none = { added: [], removed: [], changed: [] };
  log.splice(2, 0, { at: '2026-09-01T14:00:00Z', file: 'LIBKEY', tokens: none, components: { ...none, changed: ['chip'] },
    grade: { level: 'minor', figma: 'minor', code: 'minor', changes: [{ rule: 'values-changed', subject: 'chip', figma: 'minor', code: 'minor', what: 'its values moved' }] } });
  store.writeChanges(where.paths.changes, log);
  run('--regrade');
  const [, first, second] = read();
  assert.deepEqual(rules(first), ['layer-removed:chip'], 'the router\'s grade of a shared subject stands');
  assert.deepEqual(rules(second), ['values-changed:chip'], 'on both entries');
});

test('a worktree pair regraded to its next commit says it ends there', () => {
  const { run, read, revs } = graded();
  run();
  assert.equal(read()[0].to, revs[1], 'not "WORKTREE": the grade was taken across this commit (review of 2 October 2026, round 3)');
});

test('--regrade takes the lists and notes from the replay that grades them, and no note keeps a rule its grade does not carry', () => {
  // Round 3, S2 and S12: lists from one differ and a grade from another, and
  // notes stamped by their wording. The router's entry here says a layer was
  // removed and added, the detector says the layer was renamed.
  const { run, read, where } = graded();
  const log = read();
  log[1].components.detail = { chip: [{ what: 'Layer Icon', before: 'present', after: 'removed', rule: 'layer-removed' }] };
  log[1].components.added = ['ghost'];
  store.writeChanges(where.paths.changes, log);
  run('--regrade');
  const e = read()[1];
  assert.deepEqual([e.components.added, e.components.changed], [[], ['chip']], 'the lists the replay gives');
  assert.ok(!e.components.detail.chip.some((n) => n.rule === 'layer-removed'), 'the note the replay does not give is gone');
  for (const o of read()) {
    const has = new Set(((o.grade && o.grade.changes) || []).map((x) => `${x.rule}:${x.subject}`));
    for (const [f, ns] of Object.entries((o.components && o.components.detail) || {})) for (const n of ns) if (n.rule) assert.ok(has.has(`${n.rule}:${f}`), `${o.at} ${f}: ${n.what} stamped ${n.rule}, and the grade has no such change`);
  }
});

test('a re-keyed file\'s revisions pair across its former keys', () => {
  // Project A's files moved to new keys on 29 September 2026; the index at
  // every earlier revision names the old ones, which the routing no longer
  // carries. Paired by file, every component left one key and arrived under
  // the other: 116 "new component" on 29 September (round 3, S3).
  const { root, where, revs } = repoProject({
    files: { library: { key: 'NEWKEY', id: 'libid' } },
    states: [
      { specs: { chip: C(20), tag: spec('Tag') }, tokens: TOKENS, index: { components: { chip: { file: 'OLDKEY' }, tag: { file: 'OLDKEY' } } }, date: '2026-09-01T10:00:00Z' },
      { specs: { chip: C(24), tag: spec('Tag') }, tokens: TOKENS, index: { components: { chip: { file: 'NEWKEY' }, tag: { file: 'NEWKEY' } } }, date: '2026-09-02T10:00:00Z' },
    ],
  });
  const none = { added: [], removed: [], changed: [] };
  store.writeChanges(where.paths.changes, [
    { at: '2026-09-01T12:00:00Z', file: 'libid', tokens: none, components: { ...none, changed: ['chip'] } },
  ]);
  const bin = path.join(__dirname, 'backfill-changes.cjs'), P = ['--projects', path.join(root, 'projects')];
  execFileSync(process.execPath, [bin, 'demo', '--grades-only', '--write', ...P], { stdio: 'ignore' });
  assert.deepEqual(rules(store.readChanges(where.paths.changes)[0]), ['size-changed:chip'], 'the live entry: a resize, not two components added');
  const out = path.join(root, 'pairs.json');
  execFileSync(process.execPath, [bin, 'demo', '--out', out, ...P], { stdio: 'ignore' });
  const pair = JSON.parse(fs.readFileSync(out, 'utf8')).find((e) => e.from === revs[0]);
  assert.deepEqual([pair.file, pair.components.added, pair.components.removed, pair.components.changed], ['NEWKEY', [], [], ['chip']], 'the backfilled pair: one file, one change');
});

test('tokens a live entry logged in a window are not logged again by the backfilled pair', () => {
  // Project B's 22 September token majors were said twice: under the Web
  // components pair, which carries the tokens with its first file group, and
  // under Foundations, where the router logged them (round 3, S14).
  const tok = (v) => ({ ...TOKENS, collections: { Base: { modes: ['M'], values: { M: { 'Space/4': v } } } } });
  const { root, where, revs } = repoProject({
    files: { library: [{ key: 'LIBKEY', id: 'libid' }, { key: 'VARKEY', id: 'varid' }] },
    states: [
      { specs: { chip: C(20) }, tokens: tok(4), index: { components: { chip: { file: 'LIBKEY' } } }, date: '2026-09-01T10:00:00Z' },
      { specs: { chip: C(24) }, tokens: tok(8), index: { components: { chip: { file: 'LIBKEY' } } }, date: '2026-09-02T10:00:00Z' },
    ],
  });
  const none = { added: [], removed: [], changed: [] };
  store.writeChanges(where.paths.changes, [
    { at: '2026-09-01T12:00:00Z', file: 'VARKEY', tokens: { ...none, changed: ['Space/4'] }, components: none },
    { at: '2026-09-02T10:00:00+00:00', file: 'LIBKEY', via: 'backfill', from: revs[0], to: revs[1], tokens: { ...none, changed: ['Space/4'] }, components: { ...none, changed: ['chip'] } },
  ]);
  execFileSync(process.execPath, [path.join(__dirname, 'backfill-changes.cjs'), 'demo', '--grades-only', '--regrade', '--write', '--projects', path.join(root, 'projects')], { stdio: 'ignore' });
  const [live, pair] = store.readChanges(where.paths.changes);
  assert.deepEqual(rules(live), ['token-value:tokens'], 'the live entry keeps the token change');
  assert.deepEqual([rules(pair), pair.tokens.changed], [['size-changed:chip'], []], 'the pair says it once, not again');
});

/*
 * The stored logs themselves: every note stamped with a rule has a graded
 * change of that rule on its subject in the same entry. The stamps were
 * first made from the notes' wording, and 1,468 of them named a change the
 * detector does not give (round 3, S2). Read across every project.
 */
test('every stamped note in every project\'s change log has a graded change of its rule on its subject', (t) => {
  // no project at all (a fresh clone, CI): nothing to read, said as a skip, never a pass
  if (!contract.projects().list.length) { console.log('skip: no project is registered, so no change log was read'); return t.skip('no project is registered'); }
  const bad = [];
  let logs = 0, stamped = 0;
  for (const p of contract.projects().list) {
    const w = contract.layout(null, p.name);
    if (!w || w.error || !w.paths || !fs.existsSync(w.paths.changes)) continue;
    logs++;
    for (const o of store.readChanges(w.paths.changes)) {
      const has = new Set(((o.grade && o.grade.changes) || []).map((x) => `${x.rule}\u0000${x.subject}`));
      const c = o.components || {};
      const notes = [...Object.entries(c.detail || {}).flatMap(([f, ns]) => (ns || []).map((n) => [f, n])), ...(c.renamed || []).flatMap((r) => (r.notes || []).map((n) => [r.folder, n]))];
      for (const [f, n] of notes) { if (!n || !n.rule) continue; stamped++; if (!has.has(`${n.rule}\u0000${f}`)) bad.push(`${p.name} ${o.at} ${f}: "${n.what}" stamped ${n.rule}`); }
    }
  }
  assert.ok(logs >= 4 && stamped > 0, `read ${logs} logs and ${stamped} stamped notes`);
  assert.deepEqual(bad.slice(0, 10), [], `${bad.length} stamped notes with no graded change of their rule`);
});
