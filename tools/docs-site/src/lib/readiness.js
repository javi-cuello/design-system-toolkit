// AI readiness, design only: what an agent reading the Figma library (through
// Figma's MCP or this site) can learn about intent, measured from the stored
// snapshot alone, with no code to compare against: the facts no audit row
// carries (how current the snapshot is, published tokens described,
// deprecations that name a replacement), for the overview and the Tracker's
// Documentation page. What each component lacks is the audit's. The method
// and why these three: Research/ai-ready-design-systems.md, sections 8 to 10.
import { snapshot, meta, componentPages, collectionPages, isPrivateName } from './snapshot.js';

// How current the reference is. Every other figure describes the library as
// it was when the snapshot was taken; Figma's own last edit, where the plugin
// recorded it, says whether the file has moved on since.
const takenAt = meta.snapshotAt || meta.snapshot || null;
export const freshness = {
  takenAt,
  days: takenAt ? Math.max(0, Math.floor((Date.now() - new Date(takenAt)) / 86400000)) : null,
  editedSince: meta.version ? Boolean(meta.version.editedSince) : null,
};

// Published variables with a description. A variable hidden from publishing
// is internal (the primitives behind the semantic layer) and a private one
// (`_`, figma-standard rule 8) is not for use, so neither is owed one; the
// ones a consumer, and so an agent, picks from are. The Foundations pages'
// own list, so the two agree on which variables exist.
export const tokenCollections = collectionPages.map((c) => {
  const col = snapshot.collections[c.name] || {};
  const hidden = new Set(col.hidden || []);
  const published = c.vars.filter((v) => !hidden.has(v.name) && !isPrivateName(v.name));
  const missing = published.filter((v) => !(col.descriptions || {})[v.name]);
  return { name: c.name, label: c.label, slug: c.slug, published: published.length, missing: missing.map((v) => v.name) };
}).filter((c) => c.published);
export const tokensPublished = tokenCollections.reduce((n, c) => n + c.published, 0);
export const tokensDescribed = tokensPublished - tokenCollections.reduce((n, c) => n + c.missing.length, 0);

// Deprecated components whose description names what replaces them
// (figma-standard rule 14: "Deprecated: use List instead." first). Without
// the replacement an agent that meets the old name has nowhere to go.
const names = componentPages.flatMap((p) => p.components.map((c) => c.name.replace(/^_?\[🚫 DEPRECATED\]\s*-\s*/, '')));
const isDeprecated = (p, c) => /deprecat/i.test(p.category || '') || /🚫|DEPRECATED/.test(c.name);
const replacement = (c) => {
  const text = c.guidance.purpose || '';
  if (!/\b(use|replaced by)\b/i.test(text)) return null;
  const self = c.name.replace(/^_?\[🚫 DEPRECATED\]\s*-\s*/, '');
  return names.filter((n) => n !== self && !isPrivateName(n) && new RegExp(`\\b${n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(text)).sort((a, b) => b.length - a.length)[0] || null;
};
export const deprecated = componentPages.flatMap((p) => p.components.filter((c) => isDeprecated(p, c)).map((c) => ({ page: p, name: c.name, unknown: Boolean(c.guidance.unknown), replacement: replacement(c) })));
export const deprecatedClear = deprecated.filter((d) => d.replacement).length;
