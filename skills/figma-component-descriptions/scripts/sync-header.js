// sync-header.js - SKILL.md step 7: write the first sentence of each applied
// description into the documentation header on its component's page. Fill
// CONFIG from the rulebook and with the [componentId, markdown] pairs just
// applied, and send this file's body as the code of one figma_execute call.
// Never creates a header: a page without one, or a header without its body
// layer, is a report line.
const CONFIG = {
  headerName: null,        // the header component's name, from the rulebook
  headerBodyLayer: null,   // its body text layer's name
  docs: [
    // ["0:2345", "Purpose paragraph.\n\n## Usage\n- Item"]
  ]
};

const GONE = /does not exist/;
const safe = (fn, fallback) => { try { return fn(); } catch (e) { if (GONE.test(e && e.message)) return fallback; throw e; } };
// Not optional: a component can contain a layer named like the header, and a plain
// lookup by name writes the purpose sentence into that component's internals.
const inComponent = (n) => safe(() => {
  let q = n.parent;
  while (q && q.type !== 'PAGE' && q.type !== 'DOCUMENT') {
    if (q.type === 'COMPONENT' || q.type === 'COMPONENT_SET') return true;
    q = q.parent;
  }
  return false;
}, true);
const pageOf = (n) => { let q = n; while (q && q.type !== 'PAGE') q = q.parent; return q; };
// Canvas text renders no markdown: backticks are stripped, or the header shows them.
const firstSentence = (md) => {
  const purpose = (md || '').split('\n')[0].trim();
  return (purpose.match(/^.*?\.(?=\s|$)/) || [purpose])[0].trim().replace(/`/g, '');
};

// One header per page: members of a virtual set share a sentence and write once.
const byPage = new Map();
const report = [];
for (const [id, md] of CONFIG.docs) {
  const n = await figma.getNodeByIdAsync(id);
  const page = n && pageOf(n);
  if (!page) { report.push({ id, status: 'not found' }); continue; }
  if (!byPage.has(page.id)) byPage.set(page.id, { page, sentences: new Set() });
  byPage.get(page.id).sentences.add(firstSentence(md));
}
for (const { page, sentences } of byPage.values()) {
  if (sentences.size > 1) { report.push({ page: page.name, status: 'not written', why: 'components on this page have different first sentences' }); continue; }
  const sentence = [...sentences][0];
  const header = page.findAll(n => safe(() => n.name === CONFIG.headerName, false)).find(h => !inComponent(h));
  const body = header && header.findOne(n => safe(() => n.type === 'TEXT' && n.name === CONFIG.headerBodyLayer, false));
  if (!header) { report.push({ page: page.name, status: 'no header' }); continue; }
  if (!body) { report.push({ page: page.name, status: 'no body layer' }); continue; }
  // Mixed-font text throws on write: skip it and say so rather than end the batch.
  if (body.fontName === figma.mixed) { report.push({ page: page.name, status: 'mixed font' }); continue; }
  const before = body.characters.trim();
  await figma.loadFontAsync(body.fontName);   // required before setting characters
  body.characters = sentence;
  const row = { page: page.name, status: 'written', sentence };
  // Old text that is not a prefix of the new sentence was drift between canvas and panel.
  if (before && !sentence.startsWith(before)) row.drift = before.slice(0, 60);
  report.push(row);
}
return report;
