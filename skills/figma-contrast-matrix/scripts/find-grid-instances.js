// Lists every instance of the contrast-matrix grid component on the current
// page — Workflow step 1 of SKILL.md. Run via figma_execute on the page holding
// the matrices; pass the file's contents as `code` (it is short enough that the
// call itself is the delivery, like discover-node-map.js).
//
// The main component is matched BY NAME, never by a remembered ID: component IDs
// are per file, so an ID that worked in one library silently matches nothing in
// another. Each result carries the instance's Title text so the agent can match
// the user's colour name against it without a second read.

const GRID_NAME = "_Ratios grid";  // per the context document, if it differs

async function findGridInstances(page, gridName) {
  const found = [];
  for (const node of page.findAllWithCriteria({ types: ["INSTANCE"] })) {
    const main = await node.getMainComponentAsync();
    if (!main || main.name !== gridName) continue;
    const title = (node.children || []).find((c) => c.name === "Title" && c.type === "TEXT");
    found.push({ id: node.id, name: node.name, title: title ? title.characters : null });
  }
  return found;
}

return await findGridInstances(figma.currentPage, GRID_NAME);
