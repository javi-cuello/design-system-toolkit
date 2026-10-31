// pass-a-inventory.js - discovery pass A (references/discovery-passes.md): the
// file's identity and its page and component inventory. Read-only. Send this
// file's body as the code of one figma_execute call with an explicit fileKey,
// after figma_list_open_files + figma_navigate({lock:true}) + figma_get_status({probe:true}).
await figma.loadAllPagesAsync();
var pages = [];
for (var i = 0; i < figma.root.children.length; i++) {
  var page = figma.root.children[i];
  // setIds: the component sets' ids, for pass D's CONFIG.ids (sets only, to keep the return small).
  var sets = 0, comps = 0, described = 0, names = [], setIds = [];
  // findAllWithCriteria descends fully: libraries wrap a page in one outer frame,
  // so page.children alone makes a full page look empty.
  var nodes = page.children.length ? page.findAllWithCriteria({ types: ['COMPONENT_SET', 'COMPONENT'] }) : [];
  for (var j = 0; j < nodes.length; j++) {
    var n = nodes[j];
    // A COMPONENT inside a COMPONENT_SET is a variant, not a component.
    if (n.type === 'COMPONENT' && n.parent && n.parent.type === 'COMPONENT_SET') continue;
    if (n.type === 'COMPONENT_SET') { sets++; setIds.push({ name: n.name, id: n.id }); } else comps++;
    if ((n.description || '').length > 0) described++;
    names.push(n.name);
  }
  pages.push({ name: page.name, sets: sets, comps: comps, described: described, names: names, setIds: setIds });
}
return { fileKey: figma.fileKey, fileName: figma.root.name, pages: pages };
