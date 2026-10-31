// pass-s3-styles.js - discovery pass S3 (references/discovery-passes.md): the
// non-variable half of a source file — its local text, effect, paint and grid
// styles. Read-only. Send this file's body as the code of one figma_execute call
// with an explicit fileKey, in the source file itself.
//
// Text and effect styles come back as their names in library order, plus the
// distinct first segments in first-seen order: for text styles those are the
// platform groups, recorded verbatim (they drive figma-doc-generator's per-group
// unit rule). Paint and grid styles come back as counts. The role/size grammar
// and the shadow taxonomy are the agent's reading of these names, never the
// script's.
var NAME_CAP = 400;   // names returned per kind; `truncated` says when it bit
function kind(styles) {
  var groups = [], seen = {};
  for (var i = 0; i < styles.length; i++) {
    var g = String(styles[i].name).split('/')[0];
    if (!seen[g]) { seen[g] = true; groups.push(g); }
  }
  return { count: styles.length, groups: groups, truncated: styles.length > NAME_CAP,
           names: styles.slice(0, NAME_CAP).map(function (s) { return s.name; }) };
}
return {
  fileKey: figma.fileKey,
  text: kind(await figma.getLocalTextStylesAsync()),
  effect: kind(await figma.getLocalEffectStylesAsync()),
  paint: (await figma.getLocalPaintStylesAsync()).length,
  grid: (await figma.getLocalGridStylesAsync()).length
};
