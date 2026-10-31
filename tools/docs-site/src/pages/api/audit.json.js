// The audit: every row with the page it belongs to and whether it is open,
// and every run. The Ask thread is left out; it is a conversation, not data.
import { audit } from '../../lib/tracker.js';
import { json, auditRows, scores } from './_shared.js';

export function GET() {
  return json({
    libraries: (audit && audit.libraries) || {},
    runs: Object.values((audit && audit.runs) || {}).sort((a, b) => (a.at < b.at ? 1 : -1)),
    rows: auditRows(),
    scores: scores(),
  });
}
