// pass-c-libraries.js - discovery pass C (references/discovery-passes.md): every
// variable collection the file can consume, read from the source libraries, and
// the file's own local collections. Read-only; a network call through the team
// library, so it can exceed the timeout on a large file (the reference says what
// to do then). Send this file's body as the code of one figma_execute call.
var NAME_CAP = 400;   // names returned per collection; `truncated` says when it bit
// `file` and each local collection's names: a library that is its own source has
// no library collections, and its own scales are in its local ones.
var out = { file: figma.root.name, collections: [], localCollections: [] };
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
var localVars = await figma.variables.getLocalVariablesAsync();
for (var k = 0; k < locals.length; k++) {
  var mine = localVars.filter(function (v) { return v.variableCollectionId === locals[k].id; });
  out.localCollections.push({ id: locals[k].id, name: locals[k].name, modes: locals[k].modes.length,
    count: mine.length, truncated: mine.length > NAME_CAP, names: mine.slice(0, NAME_CAP).map(function (v) { return v.name; }) });
}
return out;
