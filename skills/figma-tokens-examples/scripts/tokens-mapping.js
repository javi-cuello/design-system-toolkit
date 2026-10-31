// Tokens-mapping engine — fills and audits the `Level token` cells of a
// "Tokens mapping" table (SKILL.md §2–§4). Run as a figma_execute body; the
// caller prepends one of:
//
//   const MODE = "token"; const CELLS = [{ id, content, variable, label? }, …];
//       For each `Level token` instance id: switch its `Content` variant, reset
//       the layers that must stay neutral, bind the swatch to `variable` (a
//       variable id, or a name), and set the dot-notation label (derived from
//       the variable's name when `label` is omitted). Batch a whole section's
//       cells into one call. Returns { done, issues }.
//
//   const MODE = "audit"; const TABLE_ID = "…";
//       Walk every `Level token` under the table and report what is wrong.
//       Returns { cells, found, issues, measures }.
//
//   const MODE = "rows"; const SAMPLE = ["Colour/Background/Accent/Primary/soft-rest", …];
//       The rows a section shows, from the sample of variable names chosen for
//       it (§1 step 4): each row's Role, Type, Emphasis and State labels, which
//       of them is an `Empy` cell, and the token cell — `Content` variant and
//       label — ready to pass as `token` mode's CELLS once the ids exist. Each
//       name is resolved as `token` mode resolves it; one that resolves to
//       nothing is a `[check-token]` issue (T3). Returns
//       { category, content, rows, tree, cells, issues }.
//
// What stays the agent's: which variables the sample holds, cloning and
// pruning the Role/Type/Emphasis/State chain (§3) to the rows `rows` mode
// returns, and what a finding means — the skill's T1 records a file whose pills are bound to a
// neutral token on purpose, against §2's rule, as a question still open.
//
// With no `figma` in scope the body returns its functions, so the logic runs
// in node against mock nodes: node tests/test-tokens-mapping.mjs

// The pill's own background — always a flat neutral overlay, never bound.
const NEUTRAL_PAINT = { type: "SOLID", visible: true, opacity: 0.03, blendMode: "NORMAL", color: { r: 0, g: 0, b: 0 }, boundVariables: {} };

// Where the colour lives per `Content` variant (§2's table, as data). `path`
// is the swatch below the pill; `neutral` are layers reset to NEUTRAL_PAINT;
// `noFills` are layers whose fills must be empty.
function swatchPlan(variant) {
  switch (variant) {
    case "Frame": return { path: ["Sample"], paint: "fills", neutral: [], noFills: [] };
    case "Shape": return { path: ["Sample"], paint: "fills", neutral: [], noFills: [] };
    // Text: the colour is on `Aa` (not `A`, which this skill named until
    // 1.2.1 — a wrong name returns nothing and the cell drops out of the
    // check). The Sample frame above it can carry a bled Shape colour.
    case "Text": return { path: ["Sample", "Aa"], paint: "fills", neutral: [["Sample"]], noFills: [] };
    case "Stroke": return { path: ["Sample"], paint: "strokes", neutral: [], noFills: [["Sample"]] };
    default: return null;
  }
}

// `Colour/Background/Feedback/Danger/soft-rest` → `background.feedback.danger.soft.rest`.
// The first segment (Colour, Color, …) is the collection's group, not the taxonomy.
function labelFor(variableName) {
  return String(variableName).split("/").slice(1).join(".").replace(/-/g, ".").toLowerCase();
}

// §2's table, by category: the `Content` variant each section's token cells take.
const CONTENT_BY_CATEGORY = { Background: "Frame", Icon: "Shape", Text: "Text", Stroke: "Stroke" };

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// §1 step 4's three shapes, read off each name in the chosen sample:
//   Colour/{Category}/{Role}/{Type}/{emphasis}-{state}   all four columns
//   Colour/{Category}/{Role}/{Type}/{emphasis}           State is an Empy cell
//   Colour/{Category}/{Role}/{emphasis}[-{state}]        Type is an Empy cell
// Each branch is built from its own names, never from a sibling's shape (T5),
// in the order the sample gives them. Labels are the segments with a capital
// first letter, as the tables print them (Soft, Rest).
function rowsFor(names) {
  const issues = [], rows = [], seen = new Set(), categories = new Set();
  for (const name of names) {
    const seg = String(name).split("/");
    if (seen.has(name)) { issues.push({ variable: name, problem: "listed twice in the sample" }); continue; }
    seen.add(name);
    if (seg.length !== 4 && seg.length !== 5) {
      issues.push({ variable: name, problem: `${seg.length} segments — not one of §1's Role/Type/Emphasis(-State) shapes` });
      continue;
    }
    const [, category, role] = seg;
    categories.add(category);
    const type = seg.length === 5 ? seg[3] : null;
    const last = seg[seg.length - 1], dash = last.indexOf("-");
    const emphasis = dash < 0 ? last : last.slice(0, dash), state = dash < 0 ? null : last.slice(dash + 1);
    rows.push({ variable: name, role: cap(role), type: type === null ? null : cap(type), emphasis: cap(emphasis),
      state: state === null ? null : cap(state), content: CONTENT_BY_CATEGORY[category] || null, label: labelFor(name) });
  }
  if (categories.size > 1) issues.push({ problem: `the sample spans ${[...categories].join(", ")} — a section shows one category` });
  const category = categories.size === 1 ? [...categories][0] : null;
  const content = category ? CONTENT_BY_CATEGORY[category] || null : null;
  if (category && !content) issues.push({ problem: `§2's table has no Content variant for "${category}" — decide which, and add it there` });
  // The chain §3 builds: Role → Type (or Empy) → Emphasis → State (or Empy) → token.
  const tree = [];
  const node = (list, label) => {
    let n = list.find((x) => x.label === label);
    if (!n) { n = { label, empty: label === null, children: [] }; list.push(n); }
    return n;
  };
  for (const r of rows) {
    const leaf = node(node(node(node(tree, r.role).children, r.type).children, r.emphasis).children, r.state);
    leaf.cell = { variable: r.variable, content: r.content, label: r.label };
  }
  return { category, content, rows, tree, cells: rows.map((r) => ({ variable: r.variable, content: r.content, label: r.label })), issues };
}

const child = (node, name) => (node && node.children || []).find((c) => c.name === name) || null;
const walkPath = (node, path) => path.reduce((n, name) => child(n, name), node);
const labelKey = (node) => Object.keys(node.componentProperties || {}).find((k) => k.startsWith("Label text"));
const boundId = (paints) => (paints && paints[0] && paints[0].boundVariables && paints[0].boundVariables.color || {}).id || null;

// Fill one cell. `deps.bindPaint(paint, variable)` is figma.variables.setBoundVariableForPaint.
function applyCell(node, cell, variable, deps) {
  const issues = [];
  const say = (problem) => issues.push({ id: cell.id, label: cell.label || labelFor(variable.name), problem });
  const plan = swatchPlan(cell.content);
  if (!plan) { say(`unknown Content variant "${cell.content}"`); return issues; }
  const key = labelKey(node);
  if (!key) { say("no \"Label text\" property"); return issues; }
  node.setProperties({ Content: cell.content, [key]: cell.label || labelFor(variable.name) });
  // Read the layers AFTER the switch: the variant's children replace the old ones.
  const pill = child(node, "Content");
  if (!pill) { say("no layer named \"Content\""); return issues; }
  pill.fills = [Object.assign({}, NEUTRAL_PAINT)];
  for (const p of plan.neutral) { const n = walkPath(pill, p); if (n) n.fills = [Object.assign({}, NEUTRAL_PAINT)]; }
  for (const p of plan.noFills) { const n = walkPath(pill, p); if (n) n.fills = []; }
  const target = walkPath(pill, plan.path);
  // A name that matches nothing is a finding about the name, never a cell to skip.
  if (!target) { say(`no layer at Content > ${plan.path.join(" > ")} — check the name in the file`); return issues; }
  const base = (target[plan.paint] && target[plan.paint][0]) || { type: "SOLID", color: { r: 0, g: 0, b: 0 }, opacity: 1 };
  target[plan.paint] = [deps.bindPaint(Object.assign({}, base), variable)];  // keeps opacity and blend mode
  return issues;
}

// Audit every `Level token` under `table`. `deps.getVariableById(id)` resolves a binding.
async function auditTable(table, deps) {
  const issues = [], found = new Set();
  const measures = { cells: 0, bound: 0 };
  const walk = async (node) => {
    if (node.name === "Level token" && node.type === "INSTANCE") { await auditCell(node); return; }
    for (const c of node.children || []) await walk(c);
  };
  const auditCell = async (node) => {
    measures.cells++;
    const props = node.componentProperties || {};
    const key = labelKey(node);
    const label = key ? props[key].value : null;
    const variant = props.Content ? props.Content.value : null;
    const say = (problem) => issues.push({ id: node.id, label, problem });
    const plan = swatchPlan(variant);
    if (!plan) { say(`unknown Content variant "${variant}"`); return; }
    const pill = child(node, "Content");
    if (!pill) { say("no layer named \"Content\""); return; }
    if (boundId(pill.fills)) say("pill bound to a variable (§2: always the flat neutral overlay)");
    for (const p of plan.neutral) { const n = walkPath(pill, p); if (n && boundId(n.fills)) say(`${p.join(" > ")} bound — must stay neutral`); }
    for (const p of plan.noFills) { const n = walkPath(pill, p); if (n && (n.fills || []).length) say(`${p.join(" > ")} has fills — must have none`); }
    const target = walkPath(pill, plan.path);
    if (!target) { say(`no layer at Content > ${plan.path.join(" > ")} — check the name in the file`); return; }
    const id = boundId(target[plan.paint]);
    if (!id) { say("swatch not bound"); return; }
    const v = await deps.getVariableById(id);
    if (!v) { say(`swatch bound to ${id}, which does not resolve`); return; }
    measures.bound++;
    found.add(v.name);
    if (label !== null && label !== labelFor(v.name)) say(`label reads "${label}" but the swatch is bound to ${v.name}`);
  };
  await walk(table);
  // §3 step 5: a cloned frame keeps its source's name. A frame whose direct
  // Level 1/2/3-4 child is labelled differently is stale. Counted, so a table
  // whose structure this does not recognise reads as 0 checked, not as clean.
  measures.levelFrames = 0;
  const frames = (node) => {
    const lvl = (node.children || []).find((c) => c.type === "INSTANCE" && /^Level (1|2|3-4)$/.test(c.name));
    if (lvl && node.type === "FRAME") {
      const k = labelKey(lvl), props = lvl.componentProperties || {};
      const empty = props.Empy && props.Empy.value === "True";
      if (k && !empty) {
        measures.levelFrames++;
        if (props[k].value !== node.name) issues.push({ id: node.id, label: props[k].value, problem: `frame named "${node.name}" holds a ${lvl.name} labelled "${props[k].value}"` });
      }
    }
    for (const c of node.children || []) frames(c);
  };
  frames(table);
  return { cells: measures.cells, found: [...found].sort(), issues, measures };
}

// The token-mode write loop. Each cell is its own try: a missing Content
// variant or a paint Figma refuses (a gradient swatch) is an issue for that
// cell, and the batch goes on, so a half-written section always says so.
async function writeCells(cells, getNode, resolve, deps) {
  const issues = [];
  let done = 0;
  for (const cell of cells) {
    try {
      const node = await getNode(cell.id);
      if (!node || node.type !== "INSTANCE") { issues.push({ id: cell.id, problem: "not a Level token instance" }); continue; }
      const v = await resolve(cell.variable);
      if (!v) { issues.push({ id: cell.id, problem: `variable "${cell.variable}" not found locally or bound anywhere on this page` }); continue; }
      const got = applyCell(node, cell, v, deps);
      issues.push(...got);
      if (!got.length) done++;
    } catch (e) {
      issues.push({ id: cell.id, problem: "write failed: " + ((e && e.message) || String(e)) });
    }
  }
  return { done, issues };
}

if (typeof figma === "undefined") return { NEUTRAL_PAINT, CONTENT_BY_CATEGORY, swatchPlan, labelFor, rowsFor, applyCell, auditTable, writeCells };

const deps = {
  getVariableById: (id) => figma.variables.getVariableByIdAsync(id).catch(() => null),
  bindPaint: (paint, v) => figma.variables.setBoundVariableForPaint(paint, "color", v),
};

if (MODE === "audit") {
  const table = await figma.getNodeByIdAsync(TABLE_ID);
  if (!table) return { error: `no node ${TABLE_ID}` };
  return await auditTable(table, deps);
}

// A name resolves against the file's local colour variables, then against
// every colour already bound on this page: a documentation file usually
// consumes its library's variables rather than owning them, and
// importVariableByKeyAsync can hang through the bridge with no error.
let byName = null;
const resolve = async (ref) => {
  if (/^VariableID:/.test(ref)) return deps.getVariableById(ref);
  if (!byName) {
    byName = new Map();
    for (const v of await figma.variables.getLocalVariablesAsync("COLOR")) byName.set(v.name, v);
    const ids = new Set();
    for (const n of figma.currentPage.findAll((n) => "fills" in n || "strokes" in n))
      for (const p of [].concat(Array.isArray(n.fills) ? n.fills : [], Array.isArray(n.strokes) ? n.strokes : []))
        if (p.boundVariables && p.boundVariables.color) ids.add(p.boundVariables.color.id);
    for (const id of ids) { const v = await deps.getVariableById(id); if (v && !byName.has(v.name)) byName.set(v.name, v); }
  }
  return byName.get(ref) || null;
};

if (MODE === "token") return await writeCells(CELLS, (id) => figma.getNodeByIdAsync(id), resolve, deps);

if (MODE === "rows") {
  const out = rowsFor(SAMPLE);
  // T3: a name that fits the formula is not evidence the token exists.
  for (const r of out.rows) if (!(await resolve(r.variable))) out.issues.push({ variable: r.variable, problem: "[check-token] no such variable locally or bound on this page" });
  return out;
}

return { error: `unknown MODE ${typeof MODE === "undefined" ? "(none)" : MODE}` };
