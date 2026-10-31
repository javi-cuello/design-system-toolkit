// One component page: its sets with properties and contracts, guidance, implementation
// notes and related parts, its change log and its audit rows.
import { componentPages, contractOf } from '../../../lib/snapshot.js';
import { json, changesFor, auditRows, scores } from '../_shared.js';

export function getStaticPaths() {
  return componentPages.map((page) => ({ params: { slug: page.slug }, props: { page } }));
}
export function GET({ props }) {
  const { page } = props;
  return json({
    ...page,
    // each set's contract: props, anatomy and variants in tokens, what an agent writes markup from
    contracts: Object.fromEntries(page.components.map((c) => [c.folder, contractOf(c.folder)]).filter(([, x]) => x)),
    changes: changesFor(page.components.map((c) => c.folder)),
    findings: auditRows().filter((r) => r.page === page.slug),
    scores: scores().filter((s) => s.page === page.slug),
  });
}
