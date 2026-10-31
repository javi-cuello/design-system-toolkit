// The site's read-only JSON API: the same data the pages render, written as
// files at build time, so a local service and a deployed copy serve the same
// thing. tools/docs-mcp reads it. One site is one project; nothing here names
// another.
import { project } from '../../lib/project.js';
import { changes } from '../../lib/snapshot.js';
import { audit, pageOf, scoreRows } from '../../lib/tracker.js';
import { isOpen } from '../../dashboard/labels.js';

export const json = (data) => new Response(JSON.stringify(data, null, 1), { headers: { 'content-type': 'application/json' } });

// A component's change-log entries: every entry naming one of its folders,
// with what moved (each fact, both values) and, where the entry was graded,
// each change's type and its level for Figma files and for code.
export const changesFor = (folders) => changes
  .map((e) => {
    const c = e.components || {};
    const hit = folders.filter((f) => ['added', 'removed', 'changed'].some((k) => (c[k] || []).includes(f)) || (c.renamed || []).some((r) => r.folder === f));
    if (!hit.length) return null;
    const lines = hit.flatMap((f) => ((c.detail && c.detail[f]) || []).map((n) => (n.before || n.after ? `${n.what}: ${n.before || 'none'} \u2192 ${n.after || 'none'}` : n.what)));
    const graded = ((e.grade && e.grade.changes) || []).filter((x) => hit.includes(x.subject)).map((x) => ({ type: x.group, figma: x.figma, code: x.code, what: x.what }));
    return { at: e.at, file: e.file, folders: hit, lines, changes: graded };
  })
  .filter(Boolean);

// Audit rows with the page they belong to, keyed as the tracker keys them.
// The audit's 0–100 component scores, each with the page it belongs to, as
// the component pages show them (the lowest set on a page is the page's).
export const scores = () => scoreRows.map((r) => {
  const page = pageOf(r.name, null, r.fileKey);
  return { page: page ? page.slug : null, name: r.name, score: r.score, dimensions: r.d || {}, notes: r.notes || [] };
});
export const pageScore = (slug) => {
  const n = scores().filter((s) => s.page === slug && typeof s.score === 'number').map((s) => s.score);
  return n.length ? Math.min(...n) : null;
};

export const auditRows = () => Object.entries((audit && audit.rows) || {}).map(([key, r]) => {
  const page = pageOf(r.where, r.node, r.fileKey);
  return { key, open: isOpen(r), page: page ? page.slug : null, ...r };
});

