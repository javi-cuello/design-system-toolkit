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
import { toDtcgSnapshot } from './from-snapshot.mjs';

const DTCG = createRequire(import.meta.url)('./dtcg.js');

/** The custom property a variable becomes: `--colour-background-ghost`; with its collection in front where `kept`
 *  (prefixedIn) says the build writes it so (`--shades-1-pill-edge`, code-standard rule 52). */
export const cssName = (collection, name, kept) => '--' + (kept ? nameIn(DTCG.pathFor(collection || '', name), kept) : nameOf(DTCG.pathFor(collection || '', name)));

/** What the build writes with its collection, read from a project's stored DTCG files (the `dtcg/` beside its
 *  snapshot) by the build's own sharedNames: a Set of `<collection slug>\0<path>` keys, empty with no files. */
export const prefixedIn = (dtcgDir) => new Set(dtcgDir && existsSync(dtcgDir) ? sharedNames(discover(dtcgDir)).kept : []);

/** Each collection's slug as the build writes it, from the snapshot (tokens.json): another library's collection that
 *  slugs like one already taken is numbered (`🌮 Palette` beside a local `Palette` is `palette-2`, dtcg.js
 *  collectionSlugs). Another library's copy the build left out (from-snapshot `deduped`) is keyed
 *  `<collection>\0<name>` to the slug of the collection that holds it, so a binding recorded to the copy names the
 *  property written. `renamed` keeps only those a reader would not find from the name, for a library's settings. */
export const slugsOf = (snapshot, renamed = false) => {
  const t = snapshot || {}, all = DTCG.slugsOf(Object.entries(t.collections || {}));
  const out = { ...all };
  for (const d of toDtcgSnapshot(t).deduped) out[`${d.collection}\0${d.variable}`] = all[d.holder] || DTCG.slug(d.holder);
  // (renamed: a collection whose slug differs from its name's, and a copy whose holder differs from what its collection
  // gives, the lookup tokenProperty makes)
  return renamed ? Object.fromEntries(Object.entries(out).filter(([n, s]) => s !== (n.includes('\0') ? all[n.split('\0')[0]] : DTCG.slug(n)))) : out;
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
  // (only a collection the build writes it from: one it does not is said, never given the bare name)
  const slug = (slugs && (slugs[`${collection}\0${name}`] || slugs[collection])) || DTCG.slug(collection);
  if (!kept.has(`${slug}\0${rest}`)) return { missing: `${collection}, which the build does not write it from` };
  return { css: cssName(slug, name, kept) };
}
/** The prefix every custom property of a variable's family shares: `Spacing/16` → `--spacing-`. */
export const cssFamily = (name) => cssName('', String(name).split('/')[0]) + '-';

/* The Figma names a custom property is written from, from the snapshot (tokens.json): [{ name, kind }], a variable's
   kind naming its collection, a style's its type, in the snapshot's order. What the build's collision refusal says
   (build.mjs, code-standard rule 52): a slug drops what told two names apart (`$veil` and `veil`), so only
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
   `variableOverStyle`): the snapshot with every colour style that meets a property a variable is written as taken
   out, and each one taken as a finding, { name, style, variable, values }, the style's paint and the variable's values
   per mode as the snapshot holds them, so the disagreement is read. A variable is met as the build writes it: under
   `kept` (build-tokens sharedNames) with its collection, which meets no style, and another library's copy left out
   (from-snapshot `deduped`) not at all. A style bound to that very variable is no clash (dtcg.js sameNamedVariable,
   the one test the export makes) and stays. */
export function stylesUnderVariables(snapshot, kept = null) {
  const t = snapshot || {}, d = toDtcgSnapshot(t), slugs = slugsOf(t), copies = new Set(d.deduped.map((x) => x.name)), vars = new Map();
  for (const [collection, c] of Object.entries(t.collections || {})) for (const [mode, m] of Object.entries((c && c.values) || {})) for (const [n, v] of Object.entries(m || {})) {
    if (copies.has(`${collection}/${n}`)) continue;
    const k = cssName(slugs[collection] || collection, n, kept);
    if (!vars.has(k)) vars.set(k, { name: n, collection, values: {} });
    if (vars.get(k).name === n && vars.get(k).collection === collection) vars.get(k).values[mode] = v;
  }
  const paint = (p) => (p.type === 'SOLID' ? String(p.color) : p.type);
  const stays = [], dropped = [];
  (t.paintStyles || []).forEach((s, i) => {
    const v = vars.get(cssName('', s.name)), paints = s.paints || [];
    if (!v || DTCG.sameNamedVariable(d.paintStyles[i])) { stays.push(s); return; }
    dropped.push({ name: s.name, style: paints.map(paint).join(' + ') || 'no paint', variable: `${v.name} (${v.collection})`, values: [...new Set(Object.values(v.values).map(String))].join(' | ') });
  });
  return { snapshot: { ...t, paintStyles: stays }, dropped };
}
