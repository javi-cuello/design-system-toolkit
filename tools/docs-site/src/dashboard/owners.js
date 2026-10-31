// The rules the context document sets for this library, and owner names that
// follow them.
import { ctx } from './context.js';
import { ownerLabel as labelFor, FRAMEWORK_NAME } from './labels.js';
import { api } from './api.js';
import { paintOwnerFilter } from './queue.js';

// Owner labels live in labels.js, shared with the site's overview; here they
// take the code target from the rules this page loaded.
// The row's `target` passes through: a framework row labels itself ("MUI
// build") and a plain one falls back to the library's code target. This
// wrapper took one argument and silently dropped the third, so both validator
// queues rendered as "Web build" and neither chip said which was which.
/*
 * The label for an owner chip, with the code target filled in from the rules
 * this page loaded — so a caller supplies only what it knows: the owner and
 * the ROW's target.
 *
 * NAMED DIFFERENTLY FROM `labels.js`'s `ownerLabel(o, codeTarget, target)`
 * ON PURPOSE. It used to share that name, and which one a file got depended
 * on which it imported. The signatures differ by one argument in the middle,
 * so a call written for the other renders a label instead of throwing: the
 * owner filter showed "Web build 53 · Web build 11", one name for two
 * queues, and the MUI queue could not be reached because no chip said it was
 * there. Three wrong labels in one day came out of that, twice on the same
 * line. `check.mjs` now refuses two modules exporting one name, and this is
 * the rename that satisfies it.
 */
// A file whose settings name no code target (a tokens library) borrows the
// project's, so one area is "Web build" on every file, never "Code build" on one.
const projectTarget = () => Object.values((window.DASH_CONTEXT || {}).libraries || {}).map((l) => l && l.codeTarget).find(Boolean) || "";
export const ownerChipLabel = (o, target) => labelFor(o, (ctx.lastRules && ctx.lastRules.codeTarget) || projectTarget(), target);
// Project preferences live in the context document, and only there. The
// service reads its audit-settings block, with the house defaults beneath
// it, and its rulings log on every call, so an edit to the document reaches
// the next run with no copy to update. A library with no settings entry
// stops the run rather than scanning without its rules: a missing rule
// skips its check, and a run that skipped everything would read as clean.

export async function contextRules(given) {
  const c = given || await api.context();
  // Every error the service found stops the run, not only a missing library
  // entry: a broken house-defaults block with a valid project entry used to
  // run the audit without the State and Disabled orders and say nothing.
  if (!c || c.ok === false) throw new Error(((c && c.errors) || []).join("; ") || "the service did not return the project's settings");
  const lib = c.libraries && ctx.libKey ? c.libraries[ctx.libKey] : null;
  if (!lib) throw new Error("the context document has no audit-settings entry for this library (" + (ctx.libKey || "unknown key") + ")");
  const t = lib.tokens || {};
  // What the judge is told about the library's vocabulary is derived from
  // the settings, never written a second time.
  const conventions = [];
  if (t.semantic) conventions.push("Colour is bound from the semantic collection" + ([].concat(t.semantic).length > 1 ? "s named " + [].concat(t.semantic).join(" or ") : " named " + t.semantic) + ".");
  if (t.textRole) conventions.push("Text fills use tokens under the " + t.textRole + " segment.");
  for (const [axis, order] of Object.entries(lib.optionOrder || {})) conventions.push(axis + " options run " + order.join(" · ") + ".");
  if (lib.descriptionStructure) conventions.push("Descriptions: " + lib.descriptionStructure);
  if (lib.framework && lib.frameworkProfile && lib.frameworkProfile.name) FRAMEWORK_NAME[lib.framework] = lib.frameworkProfile.name;
  ctx.lastRules = { tokens: t, optionOrder: lib.optionOrder || {}, descriptionStructure: lib.descriptionStructure || "", codeTarget: lib.codeTarget || "", sourceLibrary: lib.sourceLibrary || "",
                // What the app is BUILT with, and which MUI component each
                // Figma component is. Project data both, so they come from
                // the document and nothing here knows a framework's names.
                framework: lib.framework || "", frameworkComponents: lib.frameworkComponents || null,
                frameworkName: (lib.frameworkProfile && lib.frameworkProfile.name) || lib.framework || "",
                // The project's dialect, so the words a check writes are
                // stored in it. Set in the context document and nowhere else;
                // en-GB when absent.
                language: c.language || "en-GB",
                // With the component it was recorded on, when the Why column
                // names one: a ruling without its subject cannot be applied.
                rulings: (c.rulings || []).map((r) => {
                  const m = /\bon (.+?)(?:, about: (.+?))?\.?$/.exec(r.why || "");
                  if (!m) return r.text;
                  return r.text + " (recorded on " + m[1] + (m[2] ? " about \u201c" + m[2] + "\u201d" : "") + "; applies there and to the same finding on any other component)";
                }),
                conventions };
  return ctx.lastRules;
}
// Settings arrive after the first render, and the validator's label reads
// them, so the chips and tags are repainted once they are in.
// The labels only need the document once a visit: every record poll called
// this, and each call fetched /context again. Fetched once and kept; a
// switch of library re-reads the kept answer for that library's entry. A run
// still calls `contextRules()` itself, fresh, so an edit to the document
// reaches the next run without a reload.
let contextOnce = null;
export function loadContext() {
  contextOnce = contextOnce || api.context().catch((e) => { contextOnce = null; throw e; });
  contextOnce.then(contextRules).then(() => { try { paintOwnerFilter(); } catch (e) {} }).catch(() => { ctx.lastRules = null; });
}
