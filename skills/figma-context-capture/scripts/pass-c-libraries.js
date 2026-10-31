// pass-c-libraries.js - discovery pass C (references/discovery-passes.md): every
// variable collection the file can consume, read from the source libraries, and
// the file's own local collections. Read-only; a network call through the team
// library, so it can exceed the timeout on a large file (the reference says what
// to do then). Send this file's body as the code of one figma_execute call.
var NAME_CAP = 400;   // names returned per collection; `truncated` says when it bit
var out = { collections: [], localCollections: [] };
var libs = await figma.teamLibrary.getAvailableLibraryVariableCollectionsAsync();
for (var i = 0; i < libs.length; i++) {
  var c = libs[i];
  var vars = await figma.teamLibrary.getVariablesInLibraryCollectionAsync(c.key);
  out.collections.push({
    key: c.key, name: c.name, library: c.libraryName,
    count: vars.length,
    // A scale derived from a capped list silently loses its top end.
    truncated: vars.length > NAME_CAP,
    names: vars.slice(0, NAME_CAP).map(function (v) { return v.name; })
  });
}
var locals = await figma.variables.getLocalVariableCollectionsAsync();
for (var k = 0; k < locals.length; k++) {
  out.localCollections.push({ id: locals[k].id, name: locals[k].name, modes: locals[k].modes.length });
}
return out;
