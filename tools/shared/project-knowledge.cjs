/*
 * tools/shared/project-knowledge.cjs — what a project decided and how it
 * designs, read from its folder (toolkit-standard §D 12), for the docs site's
 * `api/knowledge.json` and through it the system MCP's `get_project_knowledge`.
 *
 *   read(dir, doc?) → { product, decisions, guidance }
 *     product   the product file's text (`product-context.md`), or null
 *     decisions the live §6 rows of the context document: date, scope,
 *               decision, why, decided by, and the two optional columns
 *               (confirms or overrides, checked by), "" where absent; a struck
 *               row is dead and left out
 *     guidance  [{ topic, text }] from `guidance/*.md`, by topic
 *
 * Every piece but the context document is optional: an absent one is null or
 * empty, never an error. The §6 walk is projects.cjs's own (walkRulings).
 */
const fs = require('node:fs');
const path = require('node:path');
const { walkRulings, rulingKey } = require('../snapshot/projects.cjs');

const text = (f) => { try { return fs.readFileSync(f, 'utf8'); } catch { return null; } };

function decisionsOf(md) {
  const out = [];
  if (!md) return out;
  walkRulings(md.split('\n'), (i, c, header) => {
    const col = (n) => rulingKey(c[header.indexOf(n)] || '');
    const decision = col('ruling');
    if (!decision || /^~~/.test(c[header.indexOf('ruling')] || '')) return;
    out.push({ date: col('date'), scope: col('scope'), decision, why: col('why'), decidedBy: col('decided by'),
      confirmsOrOverrides: col('confirms or overrides'), checkedBy: col('checked by') });
  });
  return out;
}

function read(dir, doc = path.join(dir, 'design-system-context.md')) {
  const gdir = path.join(dir, 'guidance');
  let guidance = [];
  try {
    guidance = fs.readdirSync(gdir).filter((f) => f.endsWith('.md')).sort()
      .map((f) => ({ topic: f.replace(/\.md$/, ''), text: text(path.join(gdir, f)) }));
  } catch {}
  return { product: text(path.join(dir, 'product-context.md')), decisions: decisionsOf(text(doc)), guidance };
}

module.exports = { read, decisionsOf };
