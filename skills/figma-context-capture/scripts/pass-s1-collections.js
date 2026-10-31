// pass-s1-collections.js - discovery pass S1 (references/discovery-passes.md):
// a source file's own variable collections, read from inside, where publish
// visibility is visible. Read-only. Send this file's body as the code of one
// figma_execute call with an explicit fileKey, in the source file itself.
//
// Per collection: key, name, mode names in order, variable count, and where
// hiding lives — `hidden: "collection"` (the collection is hiddenFromPublishing),
// "every variable", "some variables" (with the count) or "none". What the mode
// names mean (theming, brands, plain values) and whether a hidden collection is
// a semantic-only consumption rule are the agent's reading of this, never the
// script's: the second needs pass C's view from a consumer file beside it.
var out = { fileKey: figma.fileKey, collections: [] };
var cols = await figma.variables.getLocalVariableCollectionsAsync();
for (var i = 0; i < cols.length; i++) {
  var c = cols[i], ids = c.variableIds || [], hiddenVars = 0, unread = 0;
  for (var j = 0; j < ids.length; j++) {
    var v = await figma.variables.getVariableByIdAsync(ids[j]);
    if (!v) { unread++; continue; }          // counted, so a short read never passes for a full one
    if (v.hiddenFromPublishing) hiddenVars++;
  }
  var read = ids.length - unread;
  out.collections.push({
    key: c.key, name: c.name,
    modes: c.modes.map(function (m) { return m.name; }),
    count: ids.length,
    unread: unread,
    hidden: c.hiddenFromPublishing ? 'collection'
      : hiddenVars === 0 ? 'none'
      : hiddenVars === read ? 'every variable' : 'some variables',
    hiddenVariables: hiddenVars
  });
}
return out;
