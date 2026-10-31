/*
 * A component description, read as guidance.
 *
 * The descriptions skill writes a fixed structure: an unheaded purpose
 * paragraph, then `## Behaviour`, `## Composition`, `## Usage`, `## Don't` and
 * `## Code gen notes`, each a short list and each omitted when empty. Figma
 * keeps it as markdown (`descriptionMarkdown`) and as plain text with the
 * headings as bare lines, and a snapshot may carry either, so both parse here.
 *
 * Every reader of snapshot guidance (the docs site, the tracker) uses this.
 * The descriptions skill and the Figma guidelines plugin keep their own
 * readers because a skill must stand alone and a plugin cannot require a file.
 */
'use strict';

/* Heading spellings seen in real descriptions, to the one name readers use. */
const SECTIONS = {
  usage: 'usage',
  "don't": 'dont', dont: 'dont', 'do not': 'dont', avoid: 'dont',
  behaviour: 'behaviour', behavior: 'behaviour',
  composition: 'composition',
  accessibility: 'accessibility',
  'code gen notes': 'code', 'code generation notes': 'code', code: 'code',
};

const heading = (line) => {
  const m = line.trim().match(/^(?:#{1,6}\s*)?([A-Za-z' ]+?):?\s*$/);
  return m ? SECTIONS[m[1].trim().toLowerCase().replace(/’/g, "'")] || null : null;
};

const item = (line) => line.trim().replace(/^[-•*]\s*/, '').trim();

/**
 * @returns {{ purpose: string, usage: string[], dont: string[], behaviour: string[],
 *   composition: string[], accessibility: string[], code: string[], empty: boolean }}
 */
function parse(text) {
  const out = { purpose: '', usage: [], dont: [], behaviour: [], composition: [], accessibility: [], code: [] };
  const purpose = [];
  let section = null;
  for (const raw of String(text || '').replace(/\r/g, '').split('\n')) {
    if (!raw.trim()) continue;
    const h = heading(raw);
    if (h) { section = h; continue; }
    // A heading this parser does not know still ends the section above it.
    if (/^#{1,6}\s/.test(raw.trim())) { section = 'ignored'; continue; }
    if (!section) purpose.push(raw.trim());
    else if (section !== 'ignored') out[section].push(item(raw));
  }
  out.purpose = purpose.join(' ');
  out.empty = !out.purpose && ['usage', 'dont', 'behaviour', 'composition', 'accessibility', 'code'].every((k) => !out[k].length);
  return out;
}

/**
 * The alternative a Don't item names, when it names one. The structure puts it
 * after a colon ("Use for actions: use a Chip"), so only that part is read: a
 * Don't with no colon names no alternative, even when it mentions a component
 * ("Use more than one Primary button"), and a component is never its own
 * alternative. Returns the matched name or null.
 */
function alternative(dont, names, self) {
  const at = dont.indexOf(':');
  if (at < 0) return null;
  const tail = dont.slice(at + 1).toLowerCase().replace(/`/g, '');
  const esc = (n) => n.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const hits = names.filter((n) => n !== self && new RegExp(`\\b${esc(n)}\\b`).test(tail));
  return hits.sort((a, b) => b.length - a.length)[0] || null;
}

module.exports = { parse, alternative };
