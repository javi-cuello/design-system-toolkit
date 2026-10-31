// The design-phase tracker's data: how far along each component is and what
// is holding it, read from what the workflow already produces. Page markers
// are the status, the audit record holds scores and open findings, the
// changes log holds movement. Nothing here is
// typed by hand, so nothing here goes stale.
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { project, contract } from './project.js';
import { componentPages, fileName } from './snapshot.js';
import { isOpen } from '../dashboard/labels.js';
import { displayName } from '../../../shared/names.js';
import { compareNames } from '../../../shared/output.mjs';

// One record per library, merged for everything the overview and the tracker
// say about the project as a whole: a project's open findings are its open
// findings, whichever of its libraries raised them. The Audits page reads them
// one at a time — that is what its library switch is for — and this does not,
// because "12 open" on the overview must not mean "12 open in whichever
// library happened to be first".
// A record that will not parse is left out and said so at build time, rather
// than failing every page (see data.js for the same reason).
const readRecord = (p) => { if (!existsSync(p)) return null; try { return JSON.parse(readFileSync(p, 'utf8')); } catch (e) { console.warn(`docs: ${p} is not readable JSON (${e.message}) — the overview counts it as unaudited`); return null; } };
const records = project.auditRecords
  .map((r) => ({ key: r.key, doc: readRecord(r.path) }))
  .filter((r) => r.doc);
export const hasAudit = records.length > 0;
// Keys are namespaced by library when merging, because they are not unique
// across files: a row's key is minted from the component and the finding, so
// two libraries that both draw a Button with the same defect mint the same
// key, and a plain merge would count one of them and lose the other.
const merge = (key) => Object.fromEntries(records.flatMap(({ key: lib, doc }) =>
  Object.entries(doc[key] || {}).map(([k, v]) => [`${lib}/${k}`, v])));
export const audit = hasAudit ? { rows: merge('rows'), scores: merge('scores'), libraries: merge('libraries'), runs: merge('runs') } : null;

// Which component page an audit row belongs to. A finding carries the node
// it was raised on, and a component set's node id is the snapshot's id for
// it: that is exact. A score row carries only a name, and audits write names
// their own way: `Cell / Default` for the snapshot's `Table - Cell / Default`,
// `_Thumbnail` for `Empty state/_Thumbnail`, `Button — properties panel` for a
// finding about Button. So names compare as segments (split on `/` and ` - `,
// private `_` dropped, anything after ` — ` or ` › ` dropped): equal, or one a
// tail of the other when the audit's name is specific enough to trust a tail
// (two segments, or a private part) — and only where one page answers.
const segments = (s) => String(s).split(/\s[—›]\s/)[0].split(/\s*\/\s*|\s+-\s+/)
  .map((t) => t.toLowerCase().replace(/^_+/, '').replace(/[^a-z0-9]+/g, ' ').trim()).filter(Boolean);
const tail = (a, b) => a.length < b.length && a.every((t, i) => t === b[b.length - a.length + i]);
const byId = new Map(componentPages.flatMap((p) => p.components.map((c) => [c.id, p])));
/*
 * A name that carries its own page: `_File item (❖ File input)`.
 *
 * Some audits write a private part with the page it lives on in brackets.
 * `segments` dropped the brackets' punctuation and folded the two into one
 * string — `_Thumbnail (❖ Thumbnail)` became `thumbnail thumbnail` — which
 * matched no page at all, so five of one project's rows landed nowhere and one page
 * read "–" in the Audit column while carrying an open finding. That is "we
 * have no data" rendered as "no problems".
 *
 * The bracket is only a page when it NAMES one. `Sidebar (Primary)` has no
 * page called Primary, so it is left exactly as it was — which is why this
 * compares against the file's real page names rather than looking for the
 * project's page marker, a thing this file is not entitled to know.
 */
const pageByName = new Map();
for (const p of componentPages) {
  for (const n of [p.figmaPage, p.title]) {
    if (!n) continue;
    const k = segments(n).join('/');
    if (k) pageByName.set(k, pageByName.has(k) && pageByName.get(k) !== p ? null : p);
  }
}
const bracketPage = (name) => {
  const m = /^(.*?)\s*\(([^()]+)\)\s*$/.exec(String(name || ''));
  if (!m || !m[1].trim()) return null;
  const page = pageByName.get(segments(m[2]).join('/'));
  return page ? { page, head: m[1].trim() } : null;
};
/*
 * Which FILE each component came from, so a name two libraries share can
 * still be resolved.
 *
 * A score row carries only a name, and `pageOf` refuses any name that more
 * than one page answers to — rightly, since guessing puts one library's score
 * on another's component. But the audit record keys its scores BY FILE KEY,
 * so the thing that disambiguates was in hand and thrown away by the merge.
 * One project defines 15 names in two of its files, and 17 of 120 scored
 * components lost their score to that, including Button and Dropdown input at
 * 25 — two of the eight lowest in the library. The component page that most
 * needs a score showed none, and an absent score reads as "never scored".
 *
 * The store's index maps a component's folder to its file id; the routing
 * block pairs that id with the file KEY the record uses.
 */
const indexFile = project.paths.index;
const fileOfFolder = (() => {
  const out = new Map();
  try {
    const idx = JSON.parse(readFileSync(indexFile, 'utf8'));
    for (const [folder, v] of Object.entries(idx.components || {})) if (v && v.file) out.set(folder, v.file);
  } catch (e) { /* no index: every name stays as ambiguous as it was */ }
  return out;
})();
// A record's key against the file id the index records. Both are accepted, so
// a store that predates one of them still resolves.
const idsForKey = (key) => {
  try {
    const where = contract.layout(null, project.id);
    const entry = contract.entries(where.files && where.files.library).find((e) => e.key === key || e.id === key);
    return entry ? new Set([entry.id, entry.key].filter(Boolean)) : new Set([key]);
  } catch (e) { return new Set([key]); }
};
// A name is also matched as a page shows it (displayName): the plugin writes a
// row's `where` as `🚧 Slider` for the set `Slider/🚧 Slider`, and segments
// alone read the folder as a first segment, so the row landed unplaced.
const own = (n) => segments(displayName(n)).join('/');
const named = componentPages.flatMap((p) => p.components.map((c) => ({ page: p, seg: segments(c.name), own: own(c.name), file: fileOfFolder.get(c.folder) || null })));
export function pageOf(name, node, fileKey) {
  if (node && byId.has(node)) return byId.get(node);
  // The name says which page it is on, and that page exists.
  const bracketed = bracketPage(name);
  if (bracketed) return bracketed.page;
  const w = segments(name);
  if (!w.length) return null;
  const one = (list) => { const pages = [...new Set(list.map((x) => x.page))]; return pages.length === 1 ? pages[0] : null; };
  const answer = (pool) => {
    // The full name first; the displayed name only when nothing matches in full,
    // since three folders can each hold a `_Field`.
    const exact = pool.filter((x) => x.seg.join('/') === w.join('/'));
    if (exact.length) return one(exact);
    const bare = own(name);
    const same = bare ? pool.filter((x) => x.own === bare) : [];
    if (same.length) return one(same);
    const specific = w.length > 1 || /^\s*_/.test(name);
    return specific ? one(pool.filter((x) => tail(w, x.seg))) : null;
  };
  /*
   * The library that raised it is a PREFERENCE, not a restriction.
   *
   * Narrowing to that library is what lets a name two libraries share be
   * settled — 17 of one project's 120 scores resolve only this way. But a
   * record's rows are not confined to its own library: the web record
   * carries foundations rows naming `Nav bar`, `Screen header` and `Section
   * block`, which live in the mobile file. Restricting to the key lost 7 of
   * those, trading one fix for a different break.
   *
   * So: ask the row's own library first, and fall back to every page when it
   * has no answer. Strictly better than either alone.
   */
  const ids = fileKey ? idsForKey(fileKey) : null;
  if (ids) {
    const mine = named.filter((x) => x.file && ids.has(x.file));
    if (mine.length) { const hit = answer(mine); if (hit) return hit; }
  }
  return answer(named);
}

// `isOpen`, not `!done`, and imported rather than restated: a row ticked but
// not yet verified is drawn in the dashboard's open list and was counted here
// as closed. One project's site said 49 open where its dashboard said 56, and
// another 11 against 12, with nothing to reconcile them. The comment on
// `isOpen` claimed to be the one predicate while two others survived — this
// was one of them.
// Each row keeps the library it came from, exactly as the score rows below
// do — `merge` namespaces every key as `<fileKey>/<id>`, and that key is the
// only thing that can tell two same-named components apart. The scores were
// given it and the rows were not, in the same change: 22 open rows across
// One project's two libraries carry no node id and resolve by name alone,
// against 15 names that library defines in both files. Those landed in
// `unplaced` as "a mapping failure" while the fix sat one function away.
const openRows = audit
  ? Object.entries(audit.rows || {}).map(([k, r]) => ({ ...r, id: k, fileKey: String(k).split('/')[0] })).filter(isOpen)
  : [];
// The per-component score the audit's score report writes (0–100, lowest set
// on the page counts), shown on each component page.
// Each score row keeps the library it came from — `merge` namespaces the key
// as `<fileKey>/<id>`, and that key is the only thing that can tell two
// same-named components apart.
export const scoreRows = audit ? Object.entries(audit.scores || {}).flatMap(([k, s]) =>
  (s.rows || []).map((r) => ({ ...r, fileKey: String(k).split('/')[0] }))) : [];
export const openFindings = openRows.length;
export const openErrors = openRows.filter((r) => r.sev === 'error').length;
// Breaking changes the service filed from the change log (figma-audit/
// breaking.mjs) that nobody has decided yet.
export const openBreaking = openRows.filter((r) => r.rule === 'breaking-change').length;
// When the audit last ran: the newest run of any kind, in any library.
const libraries = audit ? Object.values(audit.libraries || {}).filter((l) => l && l.metrics) : [];
const stamps = [...libraries.map((l) => l.lastRunAt), ...Object.values(audit?.runs || {}).map((r) => r?.at)].filter(Boolean).sort();
export const auditedAt = stamps.at(-1) || null;
// Every audit run, oldest first; the overview's Moving card reads the last whole one.
const auditRuns = audit ? Object.values(audit.runs || {}).filter((r) => r && r.at).sort((a, b) => (a.at < b.at ? -1 : 1)) : [];
// Only whole-library runs draw a trend: a re-check of one component records
// one set and its own few findings, and read as a line it looks like a
// collapse. A run is partial when its kind says so (a re-check), its scope
// says so ("Button only", "the 4 sets the sweep flagged", "the 3 rows"), or
// it covered under 90% of the most sets any run had covered by then. By
// then, not ever: a library grows, and its first whole audit was smaller.
const countOf = (r) => (typeof r.sets === 'number' ? r.sets : +(String(r.scope || '').match(/audit of (\d+) component/)?.[1] ?? NaN));
// Per library: one library's 51 sets is not a partial run of another's 121.
const most = {};
export const wholeRuns = auditRuns.filter((r) => {
  const n = countOf(r), k = r.fileKey || '';
  if (!(n <= most[k])) most[k] = n;
  if (/re-?check/i.test(r.kind || '')) return false;
  if (/\bonly\b|flagged|\brows?\b|verified/i.test(r.scope || '')) return false;
  return Number.isFinite(n) && n >= 0.9 * most[k];
});

// A ladder may end in more than one finished state ("no comments", "input
// addressed"); completion counts them all.
const finished = new Set(project.done);
const isDone = (marker) => finished.has(marker);
// One reading of a status for everything that counts or colours it: the
// Tracker's bar and filter, which must agree on every page.
export function statusGroup(status) {
  if (!status) return 'unmarked';
  if (isDone(status.marker)) return 'finished';
  // retired, not on its way anywhere: never counted as work in progress
  if (/deprecat/i.test(status.label)) return 'deprecated';
  if (/block/i.test(status.label)) return 'blocked';
  if (/await|approv|in review|feedback/i.test(status.label)) return 'waiting';
  return 'working';
}
export const GROUP_LABEL = { finished: 'Finished', blocked: 'Blocked', waiting: 'Waiting on input', working: 'In progress', deprecated: 'Deprecated', unmarked: 'No marker' };

/*
 * Open findings that belong to no component page — and why.
 *
 * The Audit column sums to less than the Open findings KPI (47 against 49,
 * 200 against 208, 11 against 12), and nothing on the page said so. Some of
 * the gap is legitimate: a page-order finding is filed on "Page list", an
 * icon name on the icon, a text-style row on a style — none of them a
 * component, none with a page to sit on. The rest is a mapping failure. A
 * reader could not tell the two apart, so both read as "everything is
 * accounted for".
 *
 * Named here, counted by where they were filed, so the page can say which.
 */
// A tokens or icon library's rows are about the file, never a component
// page, and are counted on their own (`fileFindings`).
const scanned = new Set(project.auditRecords.filter((r) => r.roles.includes('components')).map((r) => r.key));
const unplaced = openRows.filter((r) => scanned.has(r.fileKey) && !pageOf(r.where, r.node, r.fileKey));
// The tokens and icon libraries (snapshot-standard rule 17's roles), each
// with its open findings: checked from the snapshot, so `checked` is false
// until a snapshot of the file has been read and something filed.
export const fileFindings = project.auditRecords.filter((r) => !scanned.has(r.key)).map((r) => ({
  key: r.key, roles: r.roles, name: fileName(r.key),
  checked: records.some((x) => x.key === r.key),
  open: openRows.filter((x) => x.fileKey === r.key).length,
}));
export const unplacedBy = Object.entries(unplaced.reduce((m, r) => {
  const k = displayName(String(r.where || 'unnamed').split(/\s[—›]\s/)[0]);
  m[k] = (m[k] || 0) + 1; return m;
}, {})).sort((a, b) => b[1] - a[1]);

/*
 * Whether this page's library was audited at all.
 *
 * `hasAudit` is true when ANY record exists, so the Audit column drew for
 * every page — including pages from a library the project's `audit-settings`
 * does not name, which therefore has no record and never could have a
 * finding. Those read "–", exactly like a component that was audited and came
 * back clean. One project has one such page, another five.
 *
 * The store says which file a component came from, and the records say which
 * files were audited; a page whose file is in neither is "not audited", which
 * is a different answer from "nothing found".
 */
const auditedIds = new Set(records.flatMap(({ key }) => {
  try {
    const where = contract.layout(null, project.id);
    const entry = contract.entries(where.files && where.files.library).find((e) => e.key === key || e.id === key);
    return [entry && entry.id, entry && entry.key, key].filter(Boolean);
  } catch (e) { return [key]; }
}));
const auditedPage = (p) => {
  // Unknowable without the index; assume audited rather than marking every
  // page unaudited on a store that cannot say.
  if (!fileOfFolder.size) return true;
  const files = p.components.map((c) => fileOfFolder.get(c.folder)).filter(Boolean);
  return files.length ? files.some((f) => auditedIds.has(f)) : true;
};

export const rows = componentPages.map((p) => {
  const open = openRows.filter((r) => pageOf(r.where, r.node, r.fileKey) === p);
  return {
    page: p,
    status: p.status,
    open: open.length,
    // `<fileKey>/<row id>`: what the audit queue filters on for this page.
    keys: open.map((r) => r.id),
    // false only where the library this page comes from has no record at all.
    audited: auditedPage(p),
    errors: open.filter((r) => r.sev === 'error').length,
    // The open rows themselves, for the ladder (lib/ladder.js): which checks
    // stand between this page and its next level.
    findings: open,
    // null when the snapshot carries no descriptions: unknown, not missing.
    guided: p.components.every((c) => c.guidance.unknown) ? null : p.components.some((c) => !c.guidance.empty),
    group: statusGroup(p.status),
  };
});

// What needs attention: a component blocked on a decision, or with an error
// open in the audit, the most errors first. Warnings alone do not put a
// component here: nearly every component has one, and a list of all of them
// singles nothing out. The overview's Correct card lists the first five.
export const attention = rows.filter((r) => r.errors > 0 || r.group === 'blocked').sort((a, b) => (b.group === 'blocked') - (a.group === 'blocked') || b.errors - a.errors || b.open - a.open || compareNames(a.page.title, b.page.title));
export const done = rows.filter((r) => isDone(r.status?.marker)).length;
// The finished markers by name only: the marker glyph is an emoji the page
// would print as decoration, and the name says the same thing in words.
export const doneLabel = project.done.map((m) => project.markers[m] || m).join(' or ');



