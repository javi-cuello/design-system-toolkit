// The change log as the Changes page reads it: ONE ROW PER CHANGE, newest
// first, each with its type and its grade for the Figma files and the code
// (snapshot-standard rule 20). The Changes page groups them by day and file;
// the overview shows the first five. One reading, so the two cannot differ.
import { changes, componentPages, fileName } from './snapshot.js';
import { base } from './format.js';
import { displayName } from '../../../shared/names.js';
import store from '../../../snapshot/store.cjs';

const { GRADE_RULES } = store;
const byFolder = new Map(componentPages.flatMap((p) => p.components.map((c) => [c.folder, p])));
// A row names the component itself, not its docs page: a page holds several.
const nameOf = new Map(componentPages.flatMap((p) => p.components.map((c) => [c.folder, c.name])));
// A folder no page holds any more (a removed component) is said as words,
// not as its stored key: "tree-level-1-item" reads "Tree level 1 item".
const words = (key) => cap(String(key).replace(/[-_]+/g, ' ').trim());
export const title = (folder) => (nameOf.has(folder) ? displayName(nameOf.get(folder)) : byFolder.get(folder)?.title || words(folder));
export const link = (folder) => (byFolder.has(folder) ? `${base}/components/${byFolder.get(folder).slug}#changelog` : null);
export const cap = (t) => String(t || '').replace(/^\w/, (c) => c.toUpperCase());
// A change's wording is "what: consequence — detail". The label is what
// changed and which one ("A property removed: Icon swap (16)"); the
// consequence is said apart, for the reader who acts on it. Cut to "what"
// alone, five removed properties read as five identical rows.
const parts = (c) => {
  const [head, ...rest] = c.what.split(' — ');
  const [what, ...why] = head.split(': ');
  return { what: cap(what), detail: rest.join(' — '), consequence: why.length ? cap(why.join(': ')) : '' };
};
const label = (c) => { const p = parts(c); return p.detail ? `${p.what}: ${p.detail}` : p.what; };
// The subject of an UNGRADED entry's fact, a word or two, as before grades.
const subject = (n) => (typeof n === 'string' ? n : n.what).replace(/^Layer .*$/, 'Layers').replace(/ \(\d+ (bindings|layers?)\)$/, '').replace(/^.*: /, '').replace(/^\w/, (c) => c.toUpperCase());
const subjectsOf = (c, f) => {
  const out = [];
  for (const r of c.renamed || []) if (r.folder === f) out.push('Renamed', ...(r.notes || []).map(subject));
  if ((c.added || []).includes(f)) out.push('Added');
  if ((c.removed || []).includes(f)) out.push('Removed');
  if ((c.changed || []).includes(f)) {
    const d = c.detail && c.detail[f];
    const fields = ((c.fields && c.fields[f]) || []).filter((x) => x !== 'identity');
    if (d && d.length) out.push(...d.map(subject));
    else if (c.detail) return [];   // examined line by line, nothing to say: a re-stamp, not a change
    else if (fields.length) out.push(...fields);
    else if (!c.fields) out.push('Changed');
  }
  return [...new Set(out)];
};
export const changeRows = [];
for (const e of [...changes].reverse()) {
  const items = [];
  if (e.grade && (e.grade.changes || []).length) {
    for (const c of e.grade.changes) {
      items.push({ folder: c.subject === 'tokens' ? null : c.subject, type: (GRADE_RULES[c.rule] || [])[2] || c.group || '', label: label(c), consequence: parts(c).consequence, figma: c.figma, code: c.code, values: c.values || null });
    }
  } else {
    const c = e.components;
    const typeOf = (f) => ((c.added || []).includes(f) ? 'Added' : (c.removed || []).includes(f) ? 'Removed' : 'Changed');
    const folders = [...new Set([...(c.renamed || []).map((r) => r.folder), ...c.added, ...c.removed, ...c.changed])];
    for (const f of folders) { const what = subjectsOf(c, f); if (what.length) items.push({ folder: f, type: typeOf(f), label: what.join(', '), figma: '', code: '' }); }
    const t = e.tokens;
    const tokens = [t.added.length && `${t.added.length} added`, t.removed.length && `${t.removed.length} removed`, t.changed.length && `${t.changed.length} changed`, (t.renamed || []).length && `${t.renamed.length} renamed`].filter(Boolean).join(', ');
    if (tokens) items.push({ folder: null, type: 'Changed', label: `Tokens: ${tokens}`, figma: '', code: '' });
  }
  items.forEach((it, i) => { it.key = `${changeRows.length}-${i}`; });
  if (items.length) changeRows.push({ at: e.at, file: fileName(e.file), via: e.via, graded: Boolean(e.grade && (e.grade.changes || []).length), items });
}
