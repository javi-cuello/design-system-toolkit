// Derives the node map for a contrast-matrix grid component from a LIVE INSTANCE
// of it, per the shape documented in references/node-map.example.json.
//
// Run via figma_execute. Save the result per project (context document or a
// local cache) and pass its path to build-matrix-script.py with --node-map.
//
// Nothing here is hardcoded to a particular file: the component's local name and
// the target instance are both supplied per run, and every suffix is read off
// that instance's own live children.
//
// Structure this relies on, per the component's definition:
//   instance.children          = [Title, Content]
//   Content.children            = [Spacer, 12 column headers, 12 x (row header + 12 blocks)]
//                                = 1 + 12 + 156 = 169 children
// If a library restructures the component, this throws rather than emitting a
// map that is subtly wrong — a silently shifted map would populate every cell
// in the wrong place while reporting success.
//
// WHY THIS READS AN INSTANCE, NEVER THE MAIN COMPONENT NODE (v3.1.0):
// Figma addresses an instance's children as `I<instanceId>;<suffix>`, and that
// suffix is the main component's OWN node numbering, in the FILE THAT DEFINES
// the component — not whatever ID a separately-resolved main-component node
// reports when fetched from inside the consuming file. Those two can disagree.
// Observed live: an instance placed by copy-paste from another file addressed
// its children with the origin file's numbering (`0:5094`, ...), while
// `getNodeByIdAsync(mainComponentId)` inside the consuming file returned a
// proxy node whose own children carried a completely different, consuming-file
// -local numbering (`0:8194`, ...). A map built from the proxy's tree looked
// well-formed and addressed nothing — every populate call returned "not found"
// for all 169 nodes. Reading suffixes from an actual placed instance's live
// children sidesteps the question entirely, because that is the address space
// the instance is really keyed under, by construction.

// Both are prepended by the session, never edited in: `const TOKENS = …;` (the library's settings, whose ratiosGrid
// names the component; node tools/snapshot/projects.cjs settings <project>) and `const TARGET_INSTANCE_ID = "…";`
// (an instance find-grid-instances.js returned, Workflow step 1).
if (typeof TOKENS === "undefined" || !TOKENS || !TOKENS.ratiosGrid) throw new Error("prepend the library's settings, `const TOKENS = …;` with ratiosGrid: node tools/snapshot/projects.cjs settings <project>");
if (typeof TARGET_INSTANCE_ID === "undefined" || !TARGET_INSTANCE_ID) throw new Error('prepend `const TARGET_INSTANCE_ID = "…";`, an instance find-grid-instances.js returned');
const GRID_NAME = TOKENS.ratiosGrid;
const STEPS = 12;

await figma.loadAllPagesAsync();

function expect(cond, msg) {
  if (!cond) throw new Error(`${GRID_NAME} structure unexpected: ${msg}`);
}

expect(TARGET_INSTANCE_ID, "TARGET_INSTANCE_ID is empty — fill it with an instance ID from step 1's search, found ON THE PAGE you are targeting, not guessed or reused from a different file");

const instance = await figma.getNodeByIdAsync(TARGET_INSTANCE_ID);
expect(instance, `no node found for TARGET_INSTANCE_ID "${TARGET_INSTANCE_ID}"`);
expect(instance.type === "INSTANCE", `node ${TARGET_INSTANCE_ID} is a ${instance.type}, expected INSTANCE`);

const main = await instance.getMainComponentAsync();
expect(main, `instance ${TARGET_INSTANCE_ID} has no resolvable main component (source library not connected?)`);
expect(main.name === GRID_NAME, `instance's main component is named "${main.name}", expected "${GRID_NAME}" — set ratiosGrid in the library's settings or prepend another TARGET_INSTANCE_ID`);

expect(instance.children.length === 2, `top level has ${instance.children.length} children, expected 2 [Title, Content]`);
const [title, content] = instance.children;

const EXPECTED = 1 + STEPS + STEPS * (1 + STEPS);
expect(
  content.children.length === EXPECTED,
  `Content has ${content.children.length} children, expected ${EXPECTED} ` +
  `(1 spacer + ${STEPS} column headers + ${STEPS} rows of 1 header + ${STEPS} blocks)`
);

// An instance child's own .id already comes back as the full "I<instanceId>;<suffix>"
// address. The suffix — everything after the first ";" — is what's portable across
// OTHER instances of the same component; store that, not the full address, so the
// map stays reusable via build-matrix-script.py's own "I<instanceId>;<suffix>" templating.
function suffixOf(node) {
  const full = node.id;
  const i = full.indexOf(";");
  expect(i !== -1, `child id "${full}" has no ";" — expected instance-child addressing`);
  return full.slice(i + 1);
}

const kids = content.children;
const columnHeaderSuffixes = kids.slice(1, 1 + STEPS).map(suffixOf);

const rows = [];
for (let r = 0; r < STEPS; r++) {
  const base = 1 + STEPS + r * (1 + STEPS);
  rows.push({
    headerSuffix: suffixOf(kids[base]),
    blockSuffixes: kids.slice(base + 1, base + 1 + STEPS).map(suffixOf),
  });
}

// Property keys are read off real instances rather than assumed. The "#0:0"
// style suffix in a key is generated per component and differs between files.
// The header's readability toggle is OPTIONAL: some libraries switch a Light/Dark
// "Contrast" variant, others (observed live) carry an unrelated VARIANT property
// (e.g. a boolean marking the blank corner cell) and rely entirely on the direct
// Content/Label fill overrides this script's build step always applies regardless.
// Recording it without requiring it means build-matrix-script.py can tell the two
// apart instead of guessing — see its headerIsLightDarkPair handling.
function propertyKeys(instance, label, { requireVariant }) {
  expect(instance && instance.type === "INSTANCE", `${label} is ${instance && instance.type}, expected INSTANCE`);
  const props = instance.componentProperties || {};
  const names = Object.keys(props);
  const labelText = names.find((k) => k.startsWith("Label text#"));
  const variant = names.find((k) => props[k].type === "VARIANT");
  expect(labelText, `${label} has no "Label text#…" property (saw: ${names.join(", ") || "none"})`);
  if (requireVariant) expect(variant, `${label} has no VARIANT property (saw: ${names.join(", ") || "none"})`);
  const variantOptions = variant ? (props[variant].variantOptions || props[variant].preferredValues || []) : [];
  const isLightDarkPair = variant && variantOptions.length === 2 &&
    variantOptions.includes("Light") && variantOptions.includes("Dark");
  return { labelText, variant: variant || null, variantOptions, isLightDarkPair: !!isLightDarkPair };
}

const map = {
  _note:
    "Generated by scripts/discover-node-map.js from a live instance. Suffixes are " +
    "portable across other instances of the same component; regenerate after the " +
    "component is restructured, or if a suffix stops resolving under a new instance.",
  mainComponentName: GRID_NAME,
  discoveredFromInstanceId: TARGET_INSTANCE_ID,
  titleSuffix: suffixOf(title),
  contentWrapperSuffix: suffixOf(content),
  spacerSuffix: suffixOf(kids[0]),
  columnHeaderSuffixes,
  rows,
  componentPropertyKeys: {
    header: propertyKeys(kids[1], "first column header", { requireVariant: false }),
    block: propertyKeys(kids[1 + STEPS + 1], "first block", { requireVariant: true }),
  },
};

return map;
