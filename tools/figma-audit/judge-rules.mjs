/*
 * What an audit's judgement pass is told about one library: its conventions, derived from its settings and never
 * written a second time, and its rulings, each with the component it was recorded on. One definition for every judge:
 * the dashboard's (tools/docs-site/src/dashboard/owners.js) and the Audit lite plugin's report, which carries this file
 * as written (plugins/audit-lite/sync.mjs). Plain functions, no imports, so a Figma plugin can hold it.
 */

/**
 * The library's vocabulary, as sentences for the judge.
 * @param {any} t the library's flattened settings  @param {Record<string, string[]>} optionOrder
 * @param {string} [descriptionStructure] the description format, in words
 * @returns {string[]}
 */
export function judgeConventions(t, optionOrder, descriptionStructure) {
  const conventions = [];
  if (t && t.semantic) conventions.push("Colour is bound from the semantic collection" + ([].concat(t.semantic).length > 1 ? "s named " + [].concat(t.semantic).join(" or ") : " named " + t.semantic) + ".");
  if (t && t.textRole) conventions.push("Text fills use tokens under the " + t.textRole + " segment.");
  for (const [axis, order] of Object.entries(optionOrder || {})) conventions.push(axis + " options run " + order.join(" · ") + ".");
  if (descriptionStructure) conventions.push("Descriptions: " + descriptionStructure);
  return conventions;
}

/**
 * The rulings log's rows as the judge reads them: with the component it was recorded on, when the Why column names
 * one, since a ruling without its subject cannot be applied.
 * @param {{ text: string, why?: string }[]} rulings  @returns {string[]}
 */
export function judgeRulings(rulings) {
  return (rulings || []).map((r) => {
    const m = /\bon (.+?)(?:, about: (.+?))?\.?$/.exec(r.why || "");
    if (!m) return r.text;
    return r.text + " (recorded on " + m[1] + (m[2] ? " about “" + m[2] + "”" : "") + "; applies there and to the same finding on any other component)";
  });
}
