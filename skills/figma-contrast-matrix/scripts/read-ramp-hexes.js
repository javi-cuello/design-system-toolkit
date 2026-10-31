// Reads the 12 step hexes of an existing colour ramp — Workflow step 2's
// "Pull existing swatches" — and returns them in the form
// build-matrix-script.py takes for --color-a / --color-b. Run via
// figma_execute with this file's contents as `code`, after filling FRAME_ID
// (or FRAME_NAME, matched on the current page). Read-only.
//
// The shape it relies on (SKILL.md step 2): a top-level frame holding one ramp
// instance; the ramp has 12 step columns, each a `Swatches` frame with two rows
// of fills. The ramp is found as an actual child whose main component is
// RAMP_NAME, never by offsetting the frame's ID: a frame and the instance inside
// it have unrelated IDs, and an assumed offset reads a different node while
// looking like it worked. Anything else — not 12 columns, a row missing, a fill
// that is not one opaque solid — throws rather than returning a list that
// build-matrix-script.py would fill a grid from in the wrong place.
//
// Both rows come back. Which one the matrix compares (which mode) is the
// user's answer, asked before this runs (step 2: always confirm which mode).

const FRAME_ID = "";               // the ramp's top-level frame, or leave empty and set FRAME_NAME
const FRAME_NAME = "";             // matched exactly among the current page's top-level frames
const RAMP_NAME = "_Colour ramp";  // the ramp component's name, per the context document if it differs
const STEPS = 12;

function fail(msg) { throw new Error(`read-ramp-hexes: ${msg}`); }

const hex2 = (c) => Math.round(c * 255).toString(16).padStart(2, "0").toUpperCase();
function paintHex(paint, where) {
  if (!paint) fail(`${where} has no fill`);
  if (paint.type !== "SOLID") fail(`${where} is a ${paint.type} fill, not a solid colour`);
  const alpha = (paint.opacity === undefined ? 1 : paint.opacity) * (paint.color.a === undefined ? 1 : paint.color.a);
  // build-matrix-script.py takes #RRGGBB; a translucent step has no contrast of its own.
  if (Math.abs(alpha - 1) > 1e-3) fail(`${where} is ${Math.round(alpha * 100)}% opaque — its contrast depends on what is behind it`);
  return "#" + hex2(paint.color.r) + hex2(paint.color.g) + hex2(paint.color.b);
}

async function readRamp(frame) {
  let ramp = null;
  for (const c of frame.children || []) {
    if (c.type !== "INSTANCE") continue;
    const main = await c.getMainComponentAsync();
    if (main && main.name === RAMP_NAME) { ramp = c; break; }
  }
  if (!ramp) fail(`frame "${frame.name}" has no direct child instance of "${RAMP_NAME}"`);
  const columns = ramp.findAll((n) => n.name === "Swatches");
  if (columns.length !== STEPS) fail(`"${ramp.name}" has ${columns.length} Swatches columns, expected ${STEPS}`);
  const rows = [[], []];
  columns.forEach((col, i) => {
    const kids = col.children || [];
    if (kids.length < 2) fail(`step ${i + 1}'s Swatches has ${kids.length} rows, expected 2`);
    for (let r = 0; r < 2; r++) {
      const fills = kids[r].fills;
      if (!Array.isArray(fills) || fills.filter((p) => p.visible !== false).length !== 1)
        fail(`step ${i + 1}, row ${r + 1} carries ${Array.isArray(fills) ? fills.length : "mixed"} fills, expected one`);
      rows[r].push(paintHex(fills.find((p) => p.visible !== false), `step ${i + 1}, row ${r + 1}`));
    }
  });
  return { frame: frame.name, instance: ramp.id, row1: rows[0].join(","), row2: rows[1].join(",") };
}

let frame = null;
if (FRAME_ID) frame = await figma.getNodeByIdAsync(FRAME_ID);
else if (FRAME_NAME) frame = (figma.currentPage.children || []).find((n) => n.name === FRAME_NAME) || null;
else fail("FRAME_ID and FRAME_NAME are both empty — fill one with the ramp's frame");
if (!frame) fail(`no frame found for ${FRAME_ID ? `id "${FRAME_ID}"` : `name "${FRAME_NAME}" on the current page`}`);
return await readRamp(frame);
