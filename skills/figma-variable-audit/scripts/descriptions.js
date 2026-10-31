// Description check — do the source library's variable descriptions still name
// the variables they alias?
//
// Run as a figma_execute body in the SOURCE library, with nothing prepended.
// A description that names another variable ("Aliases → Palette/Amber/3") is a
// link written in prose: nothing updates it when the alias is repointed or the
// target renamed, and it reads as true for as long as nobody compares it. Two
// findings, both about what the text claims:
//
//   missing — the description names a path that is not a variable in this file
//             (renamed or deleted since the text was written).
//   target  — the variable aliases something in collection C, and its
//             description names variables of C that are not what it aliases.
//
// A mention is a slash path whose first segment is a top-level group of this
// file's variables, so prose like "Neutral/primary" (a relative name) is never
// read as a claim. Mentions of variables in a collection the variable does not
// alias are left alone: a description may name a sibling or a namesake.
//
// Facts are gathered first and judged by checkDescriptions(), a pure function,
// so the check runs in node against fixture facts: with no `figma` in scope the
// body returns checkDescriptions itself.

function checkDescriptions(vars) {
  const byName = new Map();
  for (const v of vars) {
    if (!byName.has(v.name)) byName.set(v.name, new Set());
    byName.get(v.name).add(v.collection);
  }
  const names = [...byName.keys()];
  const roots = new Set(names.map((n) => n.split("/")[0]));
  const exists = (p) => byName.has(p) || names.some((n) => n.startsWith(p + "/") || n.startsWith(p + " "));
  const PATH = /[A-Za-z][A-Za-z0-9]*(?:\/[A-Za-z0-9-]+)+/g;

  const findings = [];
  let described = 0, mentions = 0;
  for (const v of vars) {
    const text = v.description || "";
    if (!text) continue;
    described++;
    const cited = [...new Set((text.match(PATH) || []).filter((p) => roots.has(p.split("/")[0])))];
    mentions += cited.length;
    for (const p of cited) {
      if (!exists(p)) findings.push({ variable: v.name, kind: "missing",
        text: `description names "${p}", which is not a variable in this file`,
        advice: "rewrite the name to the variable's current path, or drop it" });
    }
    const targets = v.targets || [];
    for (const coll of new Set(targets.map((t) => t.collection))) {
      const real = targets.filter((t) => t.collection === coll).map((t) => t.name);
      const named = cited.filter((p) => byName.has(p) && byName.get(p).has(coll));
      if (!named.length) continue;
      const wrong = named.filter((p) => !real.includes(p));
      const unnamed = real.filter((p) => !named.includes(p));
      if (wrong.length || unnamed.length) findings.push({ variable: v.name, kind: "target",
        text: `description names ${named.join(", ")} but the variable aliases ${[...new Set(real)].join(", ")}`,
        advice: "decide which is right: fix the text if the alias is intended, or repoint the alias" });
    }
  }
  return { findings, measures: { variables: vars.length, described, mentions, broken: findings.length } };
}

if (typeof figma === "undefined") return checkDescriptions;

const collections = new Map((await figma.variables.getLocalVariableCollectionsAsync()).map((c) => [c.id, c.name]));
const local = await figma.variables.getLocalVariablesAsync();
const byId = new Map(local.map((v) => [v.id, v]));
const vars = local.map((v) => {
  const targets = [];
  for (const val of Object.values(v.valuesByMode)) {
    if (!val || val.type !== "VARIABLE_ALIAS") continue;
    const t = byId.get(val.id);
    if (t) targets.push({ name: t.name, collection: collections.get(t.variableCollectionId) });
  }
  return { name: v.name, collection: collections.get(v.variableCollectionId), description: v.description, targets };
});
return Object.assign(checkDescriptions(vars), { fileKey: figma.fileKey || null, fileName: figma.root.name });
