// What this project's docs hold, small enough to search: every component page
// with its sets' names and first line of guidance, the token collections, and
// the size of the change log and the audit.
import { project } from '../../lib/project.js';
import { componentPages, snapshot, meta, changes } from '../../lib/snapshot.js';
import { json, auditRows, pageScore } from './_shared.js';

export function GET() {
  const rows = auditRows();
  return json({
    project: { id: project.id, name: project.name, phase: project.phase },
    snapshot: { file: meta && meta.file, at: (meta && meta.snapshotAt) || null },
    components: componentPages.map((p) => ({
      slug: p.slug, title: p.title, platform: p.platform, status: p.status ? p.status.label || p.status.marker || null : null,
      // each set's own page (`path`, under /components/): the contract editor links a component to it
      sets: p.components.map((c) => ({ name: c.name, path: c.path, private: c.private,
        summary: (c.guidance && !c.guidance.unknown && (c.guidance.purpose || c.guidance.summary || '')) || '' })),
      openFindings: rows.filter((r) => r.open && r.page === p.slug).length,
      score: pageScore(p.slug),
    })),
    tokens: Object.entries(snapshot.collections || {}).map(([name, c]) => ({ collection: name, modes: c.modes || [], count: Object.keys(Object.values(c.values || {})[0] || {}).length })),
    textStyles: (snapshot.textStyles || []).length,
    effects: (snapshot.effects || []).length,
    changes: { entries: changes.length, last: changes.length ? changes[changes.length - 1].at : null },
    audit: { rows: rows.length, open: rows.filter((r) => r.open).length },
  });
}
