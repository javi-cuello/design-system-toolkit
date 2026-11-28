/*
 * A variable's name as the token build writes it, for every reader that names
 * a token in CSS: the custom property (`Color/Text/Neutral/primary` →
 * `--color-text-neutral-primary`) and the family its name starts
 * (`--color-`). The build's own two steps, composed once: the export's slug
 * per segment (dtcg.js `pathFor`) and the house name over
 * that path (build-tokens.mjs `nameOf`, which drops the
 * collection). The docs site, the system MCP's validator, the parity engine's
 * hints and the stylesheet lint each kept their own (one lowercased before
 * splitting camel case, so `textStrong` became `--textstrong` against the
 * build's `--text-strong`, and `-1` lost its minus).
 */
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import { nameOf, nameIn, FIELD, sharedNames, discover } from './build-tokens.mjs';

const DTCG = createRequire(import.meta.url)('./dtcg.js');

/** The custom property a variable becomes: `--colour-background-ghost`; with its collection in front where `kept`
 *  (prefixedIn) says the build writes it so (`--color-palette-1-tag-border`, code-standard rule 52). */
export const cssName = (collection, name, kept) => '--' + (kept ? nameIn(DTCG.pathFor(collection || '', name), kept) : nameOf(DTCG.pathFor(collection || '', name)));

/** What the build writes with its collection, read from a project's stored DTCG files (the `dtcg/` beside its
 *  snapshot) by the build's own sharedNames: a Set of `<collection slug>\0<path>` keys, empty with no files. */
export const prefixedIn = (dtcgDir) => new Set(dtcgDir && existsSync(dtcgDir) ? sharedNames(discover(dtcgDir)).kept : []);

/** Each collection's slug as the build writes it, from the snapshot (tokens.json): another library's collection that
 *  slugs like one already taken is numbered (`🌮 Palette` beside a local `Palette` is `palette-2`, dtcg.js
 *  collectionSlugs). `renamed` keeps only those, for a library's settings. */
export const slugsOf = (snapshot, renamed = false) => {
  const all = DTCG.slugsOf(Object.entries((snapshot && snapshot.collections) || {}));
  return renamed ? Object.fromEntries(Object.entries(all).filter(([n, s]) => s !== DTCG.slug(n))) : all;
};

/** A binding's custom property, from its name and the collection its spec recorded (contract `collections`), under
 *  what the build prefixed: { css } or { missing }. A name the build writes per collection with no single collection
 *  recorded is missing, never its bare name, which the build no longer writes, nor a guessed collection. The
 *  collection is named by its slug as the build numbered it (`slugs`, slugsOf); one absent there slugs as written. */
export function tokenProperty(name, collection, kept, slugs = null) {
  const rest = DTCG.pathFor('', name).slice(1).join('.');
  const split = kept && [...kept].some((k) => k.slice(k.indexOf('\0') + 1) === rest);
  if (!split) return { css: cssName('', name) };
  if (typeof collection !== 'string') return { missing: Array.isArray(collection) ? `bound from ${collection.join(' and ')}` : 'no collection recorded' };
  return { css: cssName((slugs && slugs[collection]) || collection, name, kept) };
}
/** The prefix every custom property of a variable's family shares: `Spacing/16` → `--spacing-`. */
export const cssFamily = (name) => cssName('', String(name).split('/')[0]) + '-';

/* The Figma names a custom property is written from, from the snapshot (tokens.json): [{ name, kind }], a variable's
   kind naming its collection, a style's its type, in the snapshot's order. What the build's collision refusal says
   (build.mjs, code-standard rule 52): a slug drops what told two names apart (`$overlay` and `overlay`), so only
   Figma's own names show which two met. A text style meets by its fields (`--body-font-size`). */
export function collisionNames(snapshot, prop) {
  const t = snapshot || {}, hit = [];
  for (const [collection, c] of Object.entries(t.collections || {})) {
    const names = new Set(Object.values((c && c.values) || {}).flatMap((m) => Object.keys(m || {})));
    // (as written, or kept with its collection where another collection holds the name at other values)
    for (const n of names) if (cssName(collection, n) === prop || '--' + nameOf(['', ...DTCG.pathFor(collection, n)]) === prop) hit.push({ name: n, kind: `variable in ${collection}` });
  }
  for (const s of t.paintStyles || []) if (cssName('', s.name) === prop) hit.push({ name: s.name, kind: 'colour style' });
  for (const s of t.effects || []) if (cssName('', s.name) === prop) hit.push({ name: s.name, kind: 'effect style' });
  const fields = new Set(Object.values(FIELD).map(([f]) => f));
  for (const s of t.textStyles || []) { const base = cssName('', s.name) + '-'; if (prop.startsWith(base) && fields.has(prop.slice(base.length))) hit.push({ name: s.name, kind: 'text style' }); }
  return hit;
}

/* Under the project's ruling that a variable wins over a colour style of its name (audit-settings `tokens`
   `variableOverStyle`): the snapshot with every colour style that shares a variable's CSS name taken out, and each
   one taken as a finding, { name, style, variable, values }, the style's paint and the variable's values per mode as
   the snapshot holds them, so the disagreement is read. A style bound to that very variable is no clash (dtcg.js
   writes it as the variable) and stays. */
export function stylesUnderVariables(snapshot) {
  const t = snapshot || {}, vars = new Map();
  for (const [collection, c] of Object.entries(t.collections || {})) for (const [mode, m] of Object.entries((c && c.values) || {})) for (const [n, v] of Object.entries(m || {})) {
    const k = cssName(collection, n);
    if (!vars.has(k)) vars.set(k, { name: n, collection, values: {} });
    if (vars.get(k).name === n) vars.get(k).values[mode] = v;
  }
  const paint = (p) => (p.type === 'SOLID' ? String(p.color) : p.type);
  const kept = [], dropped = [];
  for (const s of t.paintStyles || []) {
    const v = vars.get(cssName('', s.name)), paints = s.paints || [];
    const alias = v && paints.length === 1 && paints[0].type === 'SOLID' && paints[0].color === v.name;
    if (!v || alias) { kept.push(s); continue; }
    dropped.push({ name: s.name, style: paints.map(paint).join(' + ') || 'no paint', variable: `${v.name} (${v.collection})`, values: [...new Set(Object.values(v.values).map(String))].join(' | ') });
  }
  return { snapshot: { ...t, paintStyles: kept }, dropped };
}
