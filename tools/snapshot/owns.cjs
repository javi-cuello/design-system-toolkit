/*
 * What one file's token payload owns, and its tokens in stored order: the one
 * derivation behind the stored view (store.cjs mergeTokens, which writes
 * tokens.json) and the live one (figma-foundations-audit scripts/library.mjs
 * liveView, which the audit's tokens and icons stage reads). Two derivations
 * of one view would let the stored and live audits disagree about one file
 * (toolkit-standard §D 1).
 *
 * Pure, with no require and no node API: Audit lite bundles it into a Figma
 * plugin, where nothing can be imported. Tested through the store
 * (tools/snapshot/test-*.cjs) and the equivalence case in
 * skills/figma-foundations-audit/tests/test-foundations.mjs.
 */
'use strict';

/* The style kinds a file owns by name. */
const OWNED = ['textStyles', 'paintStyles', 'effects'];

// A collection's values and aliases are maps, and Figma returns them in
// whatever order it read them: one snapshot moved 3,000 lines in a file whose
// job is to be diffable, with nothing changed. Sorted by name, so a diff shows
// what moved. The order of the collections and of the styles is the file's own
// and is kept — the docs pages follow it.
const sortMap = (o) => Object.fromEntries(Object.keys(o || {}).sort().map((k) => [k, o[k]]));
const sortCollection = (c) => ({ ...c, values: Object.fromEntries(Object.entries(c.values || {}).map(([m, v]) => [m, sortMap(v)])), ...(c.alias ? { alias: sortMap(c.alias) } : {}) });
const canonical = (t) => ({
  collections: Object.fromEntries(Object.entries(t.collections || {}).map(([n, c]) => [n, sortCollection(c)])),
  textStyles: t.textStyles || [], paintStyles: t.paintStyles || [], effects: t.effects || [],
});

/**
 * `incoming` is the plugin's tokens payload (collectTokens); `iconSets`,
 * `iconPage` and `icons` its icon facts. Returns `owns`, the names this file
 * owns, and `exported`, what only an icon read carries (null without one).
 */
function ownsOf(incoming, { iconSets = [], iconPage = null, icons = [] } = {}) {
  // What the icon library's checks read (figma-foundations-audit): the sizes
  // each set was drawn at, and, from plugin 0.53.0, the variants holding a
  // paint no variable or style binds. Only an export carries them; a run with
  // export off keeps the last export's, as it keeps the files on disk.
  const exported = icons.length ? { iconSizes: icons.reduce((m, i) => ((m[i.name] = [...(m[i.name] || []), i.size].sort((a, b) => a - b)), m), {}),
    ...(icons.every((i) => typeof i.unbound === 'number') && { unboundIcons: icons.filter((i) => i.unbound > 0).map((i) => `${i.name}@${i.size}`) }),
    // the variable each icon's glyph is painted with (plugin 0.63.0): what an instance is drawn in until given a colour
    ...(icons.some((i) => i.fill) && { iconColours: Object.fromEntries(icons.filter((i) => i.fill).map((i) => [i.name, i.fill])) }) } : null;
  const owns = { collections: Object.entries(incoming.collections || {}).filter(([, c]) => !c.remote).map(([n]) => n), icons: iconSets, ...(iconPage ? { iconPage } : {}), ...Object.fromEntries(OWNED.map((k) => [k, (incoming[k] || []).filter((x) => !x.remote).map((x) => x.name)])),
    // the other libraries' text styles it sends, which it does not own: kept while any source still sends one
    ...((incoming.textStyles || []).some((x) => x.remote) && { remoteTextStyles: incoming.textStyles.filter((x) => x.remote).map((x) => x.name) }),
    // and the other libraries' collections its components bind (plugin 0.80.0), the same way
    ...(Object.values(incoming.collections || {}).some((c) => c.remote) && { remoteCollections: Object.keys(incoming.collections).filter((n) => incoming.collections[n].remote) }) };
  return { owns, exported };
}

if (typeof module !== 'undefined') module.exports = { OWNED, sortMap, sortCollection, canonical, ownsOf };
