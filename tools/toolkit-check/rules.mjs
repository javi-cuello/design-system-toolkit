// How each standard writes a rule's handle, and the rules read from a standard's
// text. One source for the guard (check-standards.mjs), the edit hook
// (tools/claude-hooks/standards-read.mjs) and the closing pass (closing.mjs), which
// each read rules; three parsers of one format drift apart.
//
// A standard with parts names which kind of handle each part takes. A new
// standard adds one entry here; the guard refuses a standard with none.
const SECTION = /^### ([A-Z]|\d+) [—·] /gm;
export const STANDARDS = {
  "toolkit-standard": { pattern: SECTION, parts: { C: "letter", D: "number" } },
  "skill-standard": { pattern: SECTION, parts: { A: "letter", B: "number" } },
  // `7. *Retired YYYY-MM-DD: …*` is a numbered standard's tombstone (toolkit-standard §C clause E).
  "figma-standard": { pattern: /^(\d+)\. (?:\*\*|`|\*Retired)/gm },
  "code-standard": { pattern: /^(\d+)\. (?:\*\*|\*Retired)/gm },
  "design-standard": { pattern: /^(\d+)\. (?:\*\*|\*Retired)/gm },
  "snapshot-standard": { pattern: /^\*\*(\d+) · /gm },
};

// Fenced blocks are examples; blanked line for line so offsets and line numbers stay true.
export const unfence = (md) => md.replace(/^```[\s\S]*?^```/gm, (m) => m.replace(/[^\n]/g, ""));

/** Every rule of a standard: its handle, title line, the `## ` part it sits in, and its block of text. */
export function rulesOf(name, md) {
  const conf = STANDARDS[name];
  if (!conf) return null;
  const body = unfence(md);
  const found = [...body.matchAll(conf.pattern)];
  return found.map((m, i) => {
    const from = body.indexOf("\n", m.index) + 1, next = body.slice(from).search(/^## /m);
    const end = Math.min(found[i + 1] ? found[i + 1].index : body.length, next < 0 ? body.length : from + next);
    const head = body.lastIndexOf("\n## ", m.index);
    return {
      handle: m[1],
      index: m.index,
      title: body.slice(m.index, body.indexOf("\n", m.index)).trim(),
      part: head < 0 ? "" : body.slice(head + 4, body.indexOf("\n", head + 4)).trim(),
      block: body.slice(m.index, end),
    };
  });
}
