// The site's index for agents, at /llms.txt (llmstxt.org): the project's
// name, what the snapshot is and when it was taken, then every component page
// with its first line of guidance and its JSON. The JSON API (api/) is the
// machine-readable copy of each page, read by tools/system-mcp; this file
// only points into it, so there is one copy of the data, not a third
// (knowledge/ui/profiles/documentation.md *Docs for agents*).
import { project } from '../lib/project.js';
import { componentPages, meta } from '../lib/snapshot.js';
import { base } from '../lib/format.js';

// the guidance's first sentence, on one line, without Markdown's link brackets breaking the list
// a title inside a link's brackets
const esc = (s) => String(s).replace(/[\\[\]]/g, '\\$&');
const oneLine = (s) => String(s || '').replace(/\s+/g, ' ').replace(/[[\]]/g, '').trim().split(/(?<!\b(?:e\.g|i\.e|etc|vs|cf))(?<=[.!?])\s+(?=[A-Z"`'])/)[0];

export function GET() {
  const at = meta && meta.snapshotAt ? String(meta.snapshotAt).slice(0, 10) : null;
  const lines = [
    `# ${project.name}`,
    '',
    `> The ${project.name} design system's documentation, generated from its Figma library${at ? `, snapshot of ${at}` : ''}. Each component page has a JSON copy with its properties, contract, guidance, change log and audit findings.`,
    '',
    '## Components',
    '',
    ...(componentPages.length ? componentPages.map((p) => {
      const lead = p.components.find((c) => c.path === p.slug) || p.components[0];
      const g = lead && lead.guidance && !lead.guidance.unknown ? oneLine(lead.guidance.purpose) : '';
      return `- [${esc(p.title)}${p.platform ? ` (${esc(p.platform)})` : ''}](${base}/components/${p.slug}/): ${g ? `${g} ` : ''}[JSON](${base}/api/components/${p.slug}.json)`;
    }) : ['None yet: the library has no component specs in its snapshot.']),
    '',
    '## Data',
    '',
    `- [Index](${base}/api/index.json): every component, its sets, status and score; the token collections`,
    `- [Tokens](${base}/api/tokens.json): every variable per collection and mode, text styles, paints and effects`,
    `- [Changes](${base}/api/changes.json): the change log`,
    '',
  ];
  return new Response(lines.join('\n'), { headers: { 'content-type': 'text/plain; charset=utf-8' } });
}
