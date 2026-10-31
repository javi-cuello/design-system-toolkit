// Who raised a row, in words. Several skills write to one record, and a row
// that does not say whose it is invites closing it from the wrong place.
// Pure data and one function, no page: the dashboard reads it in the browser
// and the site's overview at build, so both name an owner the same way.

// The skill whose scanner this page runs. Rows it files carry it as their
// owner, and it closes no row another skill raised.
export const OWNER = "figma-components-audit";
export const OWNER_LABEL = {
  "figma-components-audit": "Components",
  "figma-foundations-audit": "Library file",
  "component-validator": "Code build",
  "figma-variable-audit": "Broken tokens",
  "design-code-parity": "Code parity",
  // Not a skill: the snapshot store grades each change it records, and the
  // service files the major ones (tools/figma-audit/breaking.mjs).
  "figma-snapshot-router": "Breaking changes"
};
// The validator's label names the library's code target once it is known:
// "Web build" for a web target, "iOS build" for iOS. A row raised by a
// FRAMEWORK layer names the framework instead — MUI's rules are about what
// the library the app is built with already owns, which is a different
// question from what the web can draw, and a reader working one queue is not
// working the other. The row's own `target` carries it ("web+mui"), so the
// chip follows the row rather than the library's setting.
const TARGET_NAME = { web: "Web", ios: "iOS", android: "Android" };
// a framework's name as a reader knows it is its profile's (audit-defaults frameworks `name`), which
// the context document's library carries; filled when the rules load (owners.js), else the key itself
export const FRAMEWORK_NAME = {};
export function ownerLabel(o, codeTarget, target) {
  // the library checked against itself, from its stored contracts (tools/component-contract/analyze.mjs)
  if (o === "figma-components-audit" && target === "consistency") return "Consistency";
  if (o !== "component-validator") return OWNER_LABEL[o] || o;
  const framework = String(target || "").split("+")[1];
  if (framework) return (FRAMEWORK_NAME[framework] || framework) + " build";
  const t = String(target || "").split("+")[0] || codeTarget;
  return t ? (TARGET_NAME[t] || t) + " build" : OWNER_LABEL[o];
}
/** The chip a row belongs to: the owner, and for the validator its target too,
 *  so a web row and an MUI row do not share one queue. */
export const ownerKey = (owner, target) =>
  (owner === "component-validator" || target === "consistency") && target ? owner + "|" + target : owner;

// Where a finding's fix lands, as the check that raised it said. The split a
// maintainer works by: what changes in Figma this afternoon against what gets
// handed to the developers. It lives here, beside the owner vocabulary,
// because the queue paints the rows and the tiles count them, and the two
// disagreeing about which rows are in view is exactly the defect that put
// "Open 0" above a board showing 235.
//
// `both` keeps its own badge rather than being folded into either: the same
// difference genuinely settles from either side. The FILTER groups it with
// Figma, because a Figma action exists.
export const LANDS = {
  figma:  { label: "In Figma",      group: "figma",  why: "The fix is a change to the Figma file." },
  both:   { label: "Figma or code", group: "figma",  why: "The same difference settles from either side \u2014 decide which." },
  accept: { label: "Accept",        group: "accept", why: "Nothing to change either side \u2014 record the decision." },
};
/* There is no filter on this. One existed and was removed: `code` findings
 * leave the queue for the components' Implementation tables, so its group was
 * empty by construction and the chip read "Dev notes 0" permanently, while
 * the two that remained did not earn a control of their own. The badge stays
 * — it answers "is this mine to fix?" on the row where the question is asked. */

/*
 * Is this row still in the queue?
 *
 * ONE predicate, because there were two and they disagreed. `paintAll` splits
 * the board on `verified === true` — a row lands in Cleared when a pass has
 * actually read the file and said so — while both counters asked `!done`. A
 * row the maintainer has ticked but nothing has verified therefore sat in the
 * open list, with its tick showing, and was counted as closed. Nine of them
 * are in the store right now, across three projects, and the only way out of
 * that state is to untick and retick.
 *
 * `verified === true` is the board's own definition of settled, so it is the
 * one both counters use. A row nobody has touched has no `verified` at all
 * and is open, which is right.
 */
export { isOpen } from "../../../figma-audit/audit-row.mjs";

/*
 * The component a row is filed against.
 *
 * A row's `where` names a component, sometimes with a location after it:
 * "Button — properties panel", "Drawer › Header › Title". Three readers wanted
 * the head of it and there were three implementations — `rows.mjs` (which
 * needs it to close a row inside a run's scope), `queue.js` (which needs it to
 * re-scan the right component), and `scores.js`, which did not split at all
 * and so attributed the deduction to a component called "Button — properties
 * panel" that no score row is keyed on. Ten open rows across the four projects
 * carry a location suffix, and every one of them deducted from nothing while
 * closing correctly against `Button`.
 *
 * One definition, in `tools/figma-audit/audit-row.mjs`, which `rows.mjs` imports too:
 * the writer's copy used to live in `rows.mjs`, which this cannot import (it
 * pulls in `node:crypto` and `node:fs`), so the two agreed only by comment.
 */
export { componentOf } from "../../../figma-audit/audit-row.mjs";

// A library's platform as every page names it: "web" reads "Web", and a
// library with no platform is the web one.
export const platformLabel = (p) => (p ? p[0].toUpperCase() + p.slice(1) : "Web");
// An owner chip's address in the queue (`#queue?library-file`): its label,
// lowercased. The overview's area tiles link with the same slug.
export const slugOf = (label) => String(label).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
