/*
 * How Parity's pages write a value, shared by the pages and their test
 * (tools/docs-site/test-parity-pages.mjs), so what the test holds is what the page
 * renders.
 */
import { displayName } from '../../../shared/names.js';
import { compareNames } from '../../../shared/output.mjs';
export const unitless = new Set(['font-weight']);
// one way to write a colour on both sides, whatever each wrote: hex, and its opacity where it has one
export const colour = (c) => {
  const s = String(c).trim();
  let m = s.match(/^#([0-9a-f]{6})([0-9a-f]{2})?$/i), rgb, a = 1;
  if (m) { rgb = [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16)); if (m[2]) a = parseInt(m[2], 16) / 255; }
  else if ((m = s.match(/^color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\)$/))) { rgb = m.slice(1, 4).map((x) => Math.round(+x * 255)); if (m[4] != null) a = +m[4]; }
  else if ((m = s.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:\s*[,/]\s*([\d.]+))?\s*\)$/))) { rgb = m.slice(1, 4).map((x) => Math.round(+x)); if (m[4] != null) a = +m[4]; }
  else return s;
  const hex = `#${rgb.map((x) => x.toString(16).padStart(2, '0')).join('')}`;
  return a >= 0.9995 ? hex : `${hex} ${+(a * 100).toFixed(1)}%`;
};
// a measured value as a person reads it: a colour in that one way, a length in px; a paint with no colour (a border the
// design does not draw, read as {}) nothing
export const shown = (field, v) => (Array.isArray(v) ? v.map((x) => shown(field, x)).join(' ') : v && typeof v === 'object' && 'color' in v ? colour(v.color) : v && typeof v === 'object' && !Object.keys(v).length ? 'nothing' : typeof v === 'string' && /^(rgba?|color)\(|^#/.test(v) ? colour(v) : typeof v === 'number' ? (unitless.has(field) || v === 0 ? String(v) : `${v}px`) : v == null ? 'nothing' : String(v));

// the props that make a combination: those away from the contract's default (a text prop has none, so never shows)
export const props = (w, defaults = {}) => Object.entries(w).filter(([k, v]) => k in defaults && v !== defaults[k]).map(([k, v]) => (v === true ? k : v === false ? `no ${k}` : `${k} ${v}`)).join(', ') || 'Default';

/** A component as the Parity pages name it: its Figma name, the page path and work-in-progress
 *  mark left out ("Accordion/🚧 Accordion" is Accordion), else its folder ("date-input": Date input). */
// `marker` is the project's work-in-progress marker (figma-standard rule 13), passed in so this stays pure.
export const componentTitle = (name, c, marker = null) => (c && c.figma ? displayName(c.figma).replace(marker ? new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*', 'u') : /$^/, '').trim() : name.replace(/-/g, ' ').replace(/^./, (x) => x.toUpperCase()));

// A report's components a person mapped, by title; one the tool only drafted
// a mapping for is listed apart, never counted: its selectors are a rule's
// guess (MUI's root), and on most components not the element the design draws.
export const mapped = (r, marker) => (r ? Object.entries(r.components).filter(([, c]) => !c.error && !c.draft)
  .sort(([a, x], [b, y]) => compareNames(componentTitle(a, x, marker), componentTitle(b, y, marker))) : []);
export const draftedOf = (r) => (r ? Object.entries(r.components).filter(([, c]) => c.draft || c.error).map(([n]) => n) : []);
// a long list of options (an icon name picker) as its first few and how many more
export const few = (xs) => (xs.length > 8 ? `${xs.slice(0, 8).join(', ')} and ${xs.length - 8} more` : xs.join(', '));
// what the element is, from its contract id: the last part of its path
export const part = (id) => id.split('/').at(-1).replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase().replace(/^./, (c) => c.toUpperCase());

// Each component's three verdicts (properties, tokens, visual), in the words
// the Parity pages use: shared by Parity › Overview and the site's Overview.
// the same words the Properties page uses, worst first
const propsVerdict = (c) => {
  const k = (c.props || []).flatMap((p) => p.findings.map((f) => f.kind));
  const n = (...ks) => k.filter((x) => ks.includes(x)).length;
  if (n('not-in-code', 'missing', 'default')) return { tone: 'error', label: 'Code differs', n: n('not-in-code', 'missing', 'default') };
  if (n('renamed', 'value-renamed')) return { tone: 'warn', label: 'Code renames it', n: n('renamed', 'value-renamed') };
  if (n('code-only-prop', 'only-in-code')) return { tone: 'rule', label: 'Only in code', n: n('code-only-prop', 'only-in-code') };
  return { tone: 'good', label: 'Matches Figma' };
};
// a value the code draws that no library token holds, among the ones that differ
const tokensVerdict = (c) => {
  const n = (c.groups || []).filter((g) => g.verdict === 'differs' && g.gotTokens?.length === 0).length;
  // nothing to say where no value differs: the values that match are the design's own tokens
  return n ? { tone: 'error', label: 'Not a token', n } : {};
};
// the Visual page's words; a suspect mapping says the findings are not to be trusted yet
const visualVerdict = (c) => {
  if ((c.suspect || []).length) return { tone: 'warn', label: 'Mapping suspect', n: c.suspect.length };
  const d = (c.groups || []).filter((g) => g.verdict === 'differs').length;
  return d ? { tone: 'error', label: 'Code differs', n: d } : { tone: 'good', label: 'Matches Figma' };
};
export const parityRows = (components) => components.map(([name, c]) => ({ name, c, cells: [propsVerdict(c), tokensVerdict(c), visualVerdict(c)] }));
// in step: nothing to act on in any of the three
export const inStep = (x) => x.cells.every((v) => !v.tone || v.tone === 'good' || v.tone === 'rule');

// What a developer is asked to change, as one text to copy: the props the code lacks or defaults otherwise, and
// each value it draws differently, where it shows. Renames and values only the code has are left to confirm on the
// pages, never asked to be undone; a mapping the self-check doubts asks nothing. Null where nothing is asked.
export const brief = (title, c) => {
  const lines = [];
  for (const p of c.props || []) for (const f of p.findings) if (['not-in-code', 'missing', 'default'].includes(f.kind)) lines.push(`- ${p.figma || p.prop}: ${f.kind === 'not-in-code' ? 'add a prop that does this; the code has none' : f.detail}`);
  if (!c.suspect) for (const g of (c.groups || []).filter((x) => x.verdict === 'differs')) {
    const s = g.seen[0] || {};
    const shared = Object.entries(g.where.shared).map(([k, v]) => (v === true ? k : v === false ? `not ${k}` : `${k} ${v}`)).join(', ');
    const where = g.where.every ? 'every combination' : `${g.count} of ${g.of} combinations${shared ? ` (${shared})` : ''}`;
    lines.push(`- ${part(g.element)} ${g.field}: ${g.token ? `${g.token} (${shown(g.field, s.want)})` : shown(g.field, s.want)} in Figma, ${shown(g.field, s.got)} in code; ${where}`);
  }
  return lines.length ? `${title}: make the code match Figma\n${lines.join('\n')}` : null;
};

