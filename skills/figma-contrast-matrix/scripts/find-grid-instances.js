// Lists every instance of the contrast-matrix grid component on the current
// page — Workflow step 1 of SKILL.md. Run via figma_execute on the page holding
// the matrices; pass the file's contents as `code` (it is short enough that the
// call itself is the delivery, like discover-node-map.js).
//
// The main component is matched BY NAME, never by a remembered ID: component IDs
// are per file, so an ID that worked in one library silently matches nothing in
// another. Each result carries the instance's Title text so the agent can match
// the user's colour name against it without a second read.

// The component's name is the library's setting (`ratiosGrid`), prepended by the session as `const TOKENS = …;`
// (`node tools/snapshot/projects.cjs settings <project>` prints it), the way the audit scanner receives its
// settings; never edited into this file, so no project's name for it lands in the toolkit.
if (typeof TOKENS === "undefined" || !TOKENS || !TOKENS.ratiosGrid) throw new Error("prepend the library's settings, `const TOKENS = …;` with ratiosGrid: node tools/snapshot/projects.cjs settings <project>");
const GRID_NAME = TOKENS.ratiosGrid;

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
