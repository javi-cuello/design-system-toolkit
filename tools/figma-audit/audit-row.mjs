// The component an audit row is filed against: its `where` up to the first
// em dash (a panel) or chevron (a path), so "Button — properties panel" is
// Button. One definition, for the row writer (node) and the dashboard
// (browser): two copies had to agree by comment, and the separators are the
// whole of the rule (toolkit-standard §D 1).
export const componentOf = (where) =>
  String(where || "").split(" — ")[0].split(" › ")[0].replace(/\s+/g, " ").trim();

// Is an audit row still in the queue? One definition, for the row writer
// (node) and the dashboard (browser) alike: a row is settled when a pass has
// read the file and said so — `verified === true`. Not `!done`: a row the
// maintainer ticked and nothing has verified is still drawn in the open list,
// and counting it closed made one project's site say 49 where its dashboard
// said 56. Two copies of this line drifted into "189 vs 190 open" once
// already (toolkit-standard §D 1).
export const isOpen = (r) => !!r && r.verified !== true;
