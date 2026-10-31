#!/usr/bin/env node
/*
 * Rebuild a project's changes log from git: one entry per pair of commits
 * that touched its snapshot, per library file, with the differ the store
 * uses on every write — fields moved and renames paired — so history says
 * what the log would have said had the differ always been this one.
 *
 *   node tools/snapshot/backfill-changes.cjs <label> [--out <file>] [--write] [--grades-only [--regrade]] [--projects <dir>]
 *
 * Without --write it prints the entries (or writes them to --out) and
 * touches nothing. With --write it merges them into the project's
 * changes.json through the store's own writer: the live entries stay as they
 * were, backfilled ones carry `via: "backfill"` and the two revisions they
 * span, and the list is ordered by time. The last pair ends at the working
 * tree, so the most recent entry is what a snapshot taken now would diff
 * against the last commit. A pair the store cannot attribute to a file (a
 * snapshot from before the index recorded one) belongs to the one library the
 * routing names, or, where it names several, is logged under "all files" and
 * says so; a spec that will not parse is named rather than dropped.
 *
 * It reads the repository the project's layout names — a code project's own,
 * at the paths its snapshot.config.json gives, as readily as the toolkit's
 * folder for a project with none. test-changes.cjs covers both.
 */
const fs = require('node:fs');
const path = require('node:path');
const { atRev, snapshotCommits } = require('./at-rev.cjs');
const store = require('./store.cjs');
const contract = require('./projects.cjs');

const args = process.argv.slice(2);
const label = args[0];
if (!label || label.startsWith('--')) { console.error('usage: backfill-changes.cjs <label> [--out <file>] [--write] [--grades-only [--regrade]] [--projects <dir>]'); process.exit(2); }
const arg = (n) => { const i = args.indexOf(n); return i > -1 ? args[i + 1] : null; };
const TOOLKIT = path.join(__dirname, '..', '..');
// `--projects` is how a test drives this over a scratch folder, and how a
// router serving another folder is backfilled.
const where = contract.layout(arg('--projects') || null, label);
if (!where || where.error) { console.error(`no such project: ${label}`); process.exit(2); }
// A file has two ids (snapshot-standard 2) and the index has recorded it
// under either, depending on how the plugin was run; both fold to the routing
// entry, and the entry's audit name is what the log shows.
const routes = contract.entries(where.files && where.files.library);
let audit = {};
try { audit = contract.auditContext(where.doc).libraries || {}; } catch { audit = {}; }
// …and failing those, the name the snapshot itself recorded for the file
// (tokens.json `_meta.sources`, by either id): the icon file has no audit
// record and no route name, and its log entries said `XR8W63…` where the
// router's said "Icons & Assets" — two names for one file, never twins.
let sources = {};
try { sources = (JSON.parse(fs.readFileSync(where.paths.tokens, 'utf8'))._meta || {}).sources || {}; } catch { sources = {}; }
// An entry is written by IDENTITY and named when it is read, so a rename does
// not split one file's log in two (projects.cjs, "ONE FILE, ONE IDENTITY").
// `label` is for this script's own printing, and for matching an older entry
// that was written under a name.
/*
 * A FILE RE-KEYED KEEPS ITS HISTORY. One project's two files moved to new keys
 * on 29 September, and the index at every earlier revision names the old
 * ones, which the routing no longer carries: paired by file, every component
 * left the old key and arrived under the new one, and the regrade said "new
 * component" 116 times on 29 September and 114 on 23 September (review of
 * 2 October 2026, round 3, S3). A former key is read from the history
 * itself: an identity the routing does not know, whose components the next
 * revision's index files under one it does, is that file under its old key.
 */
const { indexAt } = require('./at-rev.cjs');
const known = (f) => routes.some((r) => r.key === f || r.id === f);
const former = new Map();
const formerKeys = (revs) => {
  const votes = new Map();
  let prev = null;
  for (const rev of revs) {
    const now = ((indexAt(where, rev) || {}).components) || {};
    if (prev) for (const [folder, x] of Object.entries(now)) {
      const y = prev[folder];
      if (!x || !y || !x.file || !y.file) continue;
      const a = contract.fileIdent(routes, y.file, sources), b = contract.fileIdent(routes, x.file, sources);
      if (a === b || known(a) || !known(b)) continue;
      const v = votes.get(a) || votes.set(a, new Map()).get(a);
      v.set(b, (v.get(b) || 0) + 1);
    }
    prev = now;
  }
  for (const [a, v] of votes) former.set(a, [...v].sort((x, y) => y[1] - x[1])[0][0]);
};
const fileOf = (id) => { const f = contract.fileIdent(routes, id, sources); return former.get(f) || f; };
const label_ = (f) => contract.fileLabel({ routes, sources, audit }, f);
// The worktree pair's second point is "now"; with no live write to date it
// by, the day the store last took that file (`sources[].at`) stands in, so
// the entry's date is the change's and does not move on every re-run. Read by
// identity: the store records a source under whichever id wrote it, and the
// entry now carries the same one.
const lastTaken = (f) => {
  const s = sources[f] || Object.entries(sources).find(([id, x]) => contract.fileIdent(routes, id) === f || x.file === f);
  const src = Array.isArray(s) ? s[1] : s;
  return src && src.at ? `${src.at}T00:00:00.000Z` : null;
};

// A revision from before the index recorded which file a spec came from is
// ambiguous only where the project HAS more than one library. With one named
// in the routing a spec can have come from nowhere else, and answering "all
// files" there buried a project's whole pre-index history under a note: 71
// entries carrying no fact but that sentence, and one false pair — 40 specs
// removed from "all files" and added to the library — on the day the index
// arrived.
const only = routes.length === 1 ? fileOf(routes[0].id) : null;

const byFile = (state) => {
  const groups = {};
  for (const [folder, spec] of Object.entries(state.specs)) {
    const entry = state.index && state.index.components && state.index.components[folder];
    const file = entry && entry.file ? fileOf(entry.file) : (only || 'all files');
    (groups[file] ||= {})[folder] = spec;
  }
  return groups;
};

const commits = snapshotCommits(where);
const points = commits.concat([{ rev: 'WORKTREE', at: new Date().toISOString() }]);
formerKeys(points.map((p) => p.rev));
/*
 * TOKENS ARE LOGGED ONCE PER WINDOW. A pair logs them with its first file
 * group, which before the index attributed tokens is a components file;
 * the router logs them under the file that owns the variables. Both stood,
 * and one project's 22 September token majors were said twice, once under the
 * Web pair and once under Foundations (round 3, S14). Where a live entry in
 * the window logged a token change, the pair does not.
 */
const ms = (t) => new Date(t).getTime();   // git stamps carry an offset, the router's are Zulu: compare instants
const tokenMoved = (e) => ['added', 'removed', 'changed', 'renamed'].some((k) => ((e.tokens || {})[k] || []).length);
const stored = fs.existsSync(where.paths.changes) ? store.readChanges(where.paths.changes) : [];
const liveTokensIn = (start, end) => stored.some((e) => e.via !== 'backfill' && tokenMoved(e) && ms(e.at) > ms(start) && ms(e.at) <= (end == null ? Infinity : ms(end)));
const entries = [];
let prev = null, prevPoint = null;
for (const point of points) {
  const state = atRev(where, point.rev);
  if (!state.tokens) { prev = null; prevPoint = null; continue; }
  if (prev) {
    const ga = byFile(prev), gb = byFile(state);
    for (const file of new Set([...Object.keys(ga), ...Object.keys(gb)])) {
      // Tokens are one file per project, so they are logged with the first group only.
      const withTokens = (file === Object.keys(gb)[0] || file === Object.keys(ga)[0]) && !liveTokensIn(prevPoint.at, point.rev === 'WORKTREE' ? null : point.at);
      const d = store.diff({ tokens: prev.tokens, specs: ga[file] || {} }, { tokens: state.tokens, specs: gb[file] || {} });
      if (!withTokens) d.tokens = { added: [], removed: [], changed: [] };
      // …and graded the way a live write is, so history carries its levels too.
      const g = store.storedGrade(store.grade({ tokens: withTokens ? prev.tokens : state.tokens, specs: ga[file] || {} }, { tokens: state.tokens, specs: gb[file] || {} }));
      if (g) d.grade = g;
      const note = [file === 'all files' && 'not attributable to a file: no index at that revision', state.unreadable.length && `${state.unreadable.length} spec(s) unreadable at ${point.rev}: ${state.unreadable.join(', ')}`].filter(Boolean).join('; ');
      if (store.emptyChange(d) && !note) continue;
      entries.push({ at: point.at, file, via: 'backfill', from: prevPoint.rev, to: point.rev, since: prevPoint.at, ...(note && { note }), ...d });
    }
  }
  prev = state; prevPoint = point;
}

const out = arg('--out');
/*
 * --grades-only: grade the history already in the log, and change nothing
 * else in it. Each backfilled entry takes the grade of the pair it spans
 * (the same two revisions, the same file), and each live entry the grade of
 * the snapshot commits around it, cut to what it recorded; their dates are
 * left exactly as they are. A full --write re-merges the log, which drops
 * live writes inside a backfilled window, and a grade is not worth that.
 *
 * With --regrade the lists and notes are taken from the same replay as the
 * grade: an entry's added, removed, changed and renamed components, the
 * fields and notes of each, and its token lists. They used to stay as they
 * were written, by whichever differ ran that day, and the notes were stamped
 * with rules by their wording: 1,468 of 3,345 stored notes were notes the
 * detector no longer gives, and a page showed one rename three ways beside a
 * grade that said a fourth (review of 2 October 2026, round 3, S2 and S12).
 * A note whose rule its entry's grade does not carry on its subject loses the
 * stamp, so a reader never joins it to a change nothing graded.
 */
if (args.includes('--grades-only')) {
  const log = store.readChanges(where.paths.changes);
  const regrade = args.includes('--regrade');
  let graded = 0;
  // Each entry graded from its own two revisions, which the log recorded:
  // the pairs a re-run would draw today can differ from the ones it drew.
  // Tokens count only where the entry logged a token change, as the store's
  // first file group does.
  const at = new Map(), state = (rev) => (at.has(rev) ? at.get(rev) : at.set(rev, atRev(where, rev)).get(rev));
  /*
   * A pair that ended at the WORKTREE ended at whatever the worktree held
   * when it was drawn, and that was committed next: once a snapshot commit
   * follows its start, the pair ends there, and says so (`to`). Read as
   * today's worktree it took every change made since — one project's 22
   * September pair, regraded on 1 October, listed ten components added that
   * week and none it recorded (review of 2 October 2026, round 2); regraded
   * to its next commit it still said `to: "WORKTREE"` (round 3). Revisions
   * in the log are short; either may be the longer.
   */
  const same = (x, y) => x.startsWith(y) || y.startsWith(x);
  const commitOf = (rev) => commits.find((c) => same(c.rev, rev));
  const endOf = (from, to) => {
    if (to !== 'WORKTREE') return to;
    const i = commits.findIndex((c) => same(c.rev, from));
    return i > -1 && commits[i + 1] ? commits[i + 1].rev : 'WORKTREE';
  };
  const NONE = () => ({ added: [], removed: [], changed: [], renamed: [] });
  // What an entry recorded, read before anything is rewritten, so one entry's
  // regenerated lists never move what another entry's window is cut to.
  const touchedOf = (e) => { const c = e.components || {}; return [...(c.added || []), ...(c.removed || []), ...(c.changed || []), ...(c.renamed || []).map((r) => r.folder), ...(tokenMoved(e) ? ['tokens'] : [])]; };
  const touched = new Map(log.map((e) => [e, touchedOf(e)]));
  for (const o of log) {
    if (o.via !== 'backfill' || !o.from || !o.to) continue;
    const end = endOf(o.from, o.to);
    const a = state(o.from), b = state(end);
    if (!a.tokens || !b.tokens) continue;
    if (end !== o.to) o.to = end;
    const file = fileOf(o.file), ga = byFile(a)[file] || {}, gb = byFile(b)[file] || {};
    const c0 = commitOf(o.from), c1 = end === 'WORKTREE' ? null : commitOf(end);
    const withTokens = tokenMoved(o) && !(c0 && liveTokensIn(c0.at, c1 ? c1.at : null));
    const sa = { tokens: withTokens ? a.tokens : b.tokens, specs: ga }, sb = { tokens: b.tokens, specs: gb };
    const g = store.storedGrade(store.grade(sa, sb));
    if (g) { o.grade = g; graded++; } else delete o.grade;
    if (regrade) { const d = store.diff(sa, sb); o.tokens = withTokens ? d.tokens : NONE(); o.components = d.components; }
  }
  /*
   * A LIVE entry carries no revisions: the router wrote it at the moment of a
   * snapshot, and the commit that kept the snapshot came after. So it is
   * graded across the last snapshot commit before it and the first one after
   * (the working tree when none has been made yet), and keeps only the
   * changes it recorded itself: other writes between those commits are other
   * entries' changes, not this one's.
   *
   * Taken: an ungraded entry; one graded against the worktree, again, so a
   * commit made since is where it ends; and with --regrade every graded live
   * entry, so a fix to the grader reaches history. Without that, one project's
   * 1 October entry kept five false layer removals the audit record had
   * already closed as a rename (round 2, R3). A grade the router made keeps
   * no `from`: it is still the router's entry, filed as one, and says it was
   * regraded and across what (`regraded`). A grade made after the fact is
   * stamped again with the revisions it was taken across.
   */
  const points = commits.concat([{ rev: 'WORKTREE', at: new Date(8.64e15).toISOString() }]);
  let liveGraded = 0, liveTotal = 0;
  for (const o of log) {
    if (o.via === 'backfill') continue;
    const g0 = o.grade && o.grade.changes ? o.grade : null;
    if (g0 && !regrade && g0.to !== 'WORKTREE') continue;
    liveTotal++;
    const prior = commits.filter((c) => ms(c.at) < ms(o.at)).pop();
    const next = points.find((c) => ms(c.at) >= ms(o.at));
    if (!prior || !next) continue;
    const a = state(prior.rev), b = state(next.rev);
    if (!a.tokens || !b.tokens) continue;
    const file = fileOf(o.file), ga = byFile(a)[file] || {}, gb = byFile(b)[file] || {};
    const mine = new Set(touched.get(o));
    const withTokens = mine.has('tokens');
    const sa = { tokens: withTokens ? a.tokens : b.tokens, specs: ga }, sb = { tokens: b.tokens, specs: gb };
    const all = store.grade(sa, sb);
    // A subject is named by its folder after the window; the entry may name
    // it by the folder it had before, when a later write renamed it.
    const idOf = (x) => x && (x.id || x.key);
    const before = (subject) => { const id = idOf(gb[subject]); return (id && Object.keys(ga).find((f) => idOf(ga[f]) === id)) || subject; };
    const ours = (subject) => mine.has(subject) || mine.has(before(subject));
    /*
     * Another live write of this file between the same two commits is in the
     * window too, and a subject both touched cannot be told apart: one project's
     * 30 September and 1 October writes both changed the sidebar before one
     * commit, and the regrade gave each the other's changes — a removal of
     * 30 September's filed under 1 October as a fresh major. Such a subject
     * keeps the changes its stored grade gave it, and the lists and notes it
     * recorded; only the rest is regraded.
     */
    const others = new Set(log.filter((e) => e !== o && e.via !== 'backfill' && fileOf(e.file) === file && ms(e.at) > ms(prior.at) && ms(e.at) <= ms(next.at)).flatMap((e) => touched.get(e)));
    const alias = new Map((all.changes || []).map((x) => [x.subject, before(x.subject)]));
    const both = (subject) => [...others].some((f) => f === subject || alias.get(f) === subject || alias.get(subject) === f);
    const shared = (subject) => !!g0 && both(subject);
    const kept = (all.changes || []).filter((x) => ours(x.subject) && !shared(x.subject)).concat(g0 ? g0.changes.filter((x) => shared(x.subject)) : []);
    if (regrade) {
      // the lists and notes from the same replay, cut the same way
      const d = store.diff(sa, sb), c = o.components || {}, dc = d.components;
      const take = (f) => ours(f) && !both(f), keep = (f) => both(f);
      const pick = (k) => [...(dc[k] || []).filter(take), ...(c[k] || []).filter(keep)].sort();
      const nc = { added: pick('added'), removed: pick('removed'), changed: pick('changed'),
        renamed: [...(dc.renamed || []).filter((r) => take(r.folder)), ...(c.renamed || []).filter((r) => keep(r.folder))], fields: {}, detail: {}, total: dc.total };
      for (const f of nc.changed) { const src = take(f) ? dc : c; if (src.fields && src.fields[f]) nc.fields[f] = src.fields[f]; if (src.detail && src.detail[f]) nc.detail[f] = src.detail[f]; }
      o.components = nc;
      if (withTokens && !both('tokens')) o.tokens = d.tokens;
    }
    if (!kept.length) { if (g0) { delete o.grade; liveGraded++; } continue; }
    const r = store.gradeOf(kept), top = (r.figma === 'major' || r.code === 'major') ? 'BREAKING' : (r.figma === 'minor' || r.code === 'minor') ? 'minor' : 'patch';
    // `from` and `to` are also the stamp: a grade that names the revisions it
    // was taken across was made after the fact, and the dashboard files
    // nothing from it (breaking.mjs). The router's own grades never carry them.
    const byRouter = g0 && !g0.from;
    // the revisions as the log already spelled them, where it did: git's
    // short hashes grow with the repository
    const from = g0 && g0.from && same(g0.from, prior.rev) ? g0.from : prior.rev, to = g0 && g0.to && same(g0.to, next.rev) ? g0.to : next.rev;
    o.grade = { level: top, figma: r.figma, code: r.code, changes: kept,
      ...(byRouter ? { regraded: { on: new Date().toISOString().slice(0, 10), from, to } } : { from, to }) };
    liveGraded++;
  }
  let unstamped = 0, dropped = 0;
  if (regrade) {
    for (const o of log) {
      const has = new Set(((o.grade && o.grade.changes) || []).map((x) => `${x.rule}\u0000${x.subject}`));
      const check = (subject, n) => { if (n && n.rule && !has.has(`${n.rule}\u0000${subject}`)) { delete n.rule; unstamped++; } };
      const c = o.components || {};
      for (const [f, ns] of Object.entries(c.detail || {})) for (const n of ns || []) check(f, n);
      for (const r of c.renamed || []) for (const n of r.notes || []) check(r.folder, n);
    }
    // a backfilled pair the replay finds nothing in is no entry: the token
    // change it carried is the live entry's, or there was none
    for (let i = log.length - 1; i >= 0; i--) if (log[i].via === 'backfill' && !log[i].note && store.emptyChange(log[i])) { log.splice(i, 1); dropped++; }
  }
  if (args.includes('--write')) store.writeChanges(where.paths.changes, log);
  console.log(`${label}: ${graded} of ${log.filter((o) => o.via === 'backfill').length} backfilled entries graded, ${liveGraded} of ${liveTotal} live ones${regrade ? ` (graded ones included; lists and notes from the same replay, ${unstamped} stamps no grade carries removed, ${dropped} empty pairs dropped)` : ''}${args.includes('--write') ? '' : ' (dry run; --write to keep)'}`);
} else if (args.includes('--write')) {
  const before = store.readChanges(where.paths.changes);
  const live = before.filter((e) => e.via !== 'backfill');
  // A live write that falls inside a backfilled pair's window — after the
  // pair's first commit, up to its second — is the same change said twice,
  // once by the router and once from git. The backfilled one stands: it
  // carries the current differ's facts, where a live entry from before the
  // differ recorded values says only "changed". The worktree pair, whose
  // second point is "now", takes the time of the last live write it covers,
  // so its date is the change's and stays put from one re-run to the next.
  const covers = (e, l) => fileOf(e.file) === fileOf(l.file) && ms(l.at) > ms(e.since) && ms(l.at) <= ms(e.at);
  const kept = live.filter((l) => !entries.some((e) => covers(e, l)));
  for (const e of entries) {
    if (e.to === 'WORKTREE') { const last = live.filter((l) => covers(e, l)).map((l) => l.at).sort((a, b) => ms(a) - ms(b)).pop() || lastTaken(e.file); if (last) e.at = last; }
    delete e.since;
  }
  const fresh = entries;
  const merged = kept.concat(fresh).sort((a, b) => a.at.localeCompare(b.at));
  store.writeChanges(where.paths.changes, merged);
  console.log(`${label}: ${fresh.length} backfilled entries merged with ${kept.length} live ones (${live.length - kept.length} live writes inside a backfilled pair's window dropped) into ${path.relative(TOOLKIT, where.paths.changes)}`);
} else if (out) {
  fs.writeFileSync(out, JSON.stringify(entries.map(({ since, ...e }) => e), null, 2) + '\n');   // the window is the merge's, not the log's
  console.log(`${label}: ${entries.length} entries from ${commits.length} commits written to ${out}`);
} else {
  for (const e of entries) console.log(`${e.at.slice(0, 16)} ${e.from}→${e.to} ${label_(e.file)}: +${e.components.added.length} −${e.components.removed.length} ~${e.components.changed.length} renamed ${e.components.renamed.length}${e.note ? ' · ' + e.note : ''}`);
}
