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

// How a citation of a rule is written, for every reader of citations: the guard
// resolves them (check-standards.mjs) and the Docs gate (tools/claude-hooks/gates.mjs)
// finds the docs that cite a section a change touched.
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const either = (w) => "[" + w[0].toLowerCase() + w[0].toUpperCase() + "]" + esc(w.slice(1));
export const names = Object.keys(STANDARDS);
export const numeric = names.filter((n) => !STANDARDS[n].parts);
export const parted = names.filter((n) => STANDARDS[n].parts);
export const titled = (n) => n.split("-").map((w, i) => (i ? "[ -]" : "") + either(w)).join("");
// `figma-standard rule 9`, `[figma-standard](…) rule 9`, `Figma standard rule 9`, `code-standard 59`, and lists.
export const CITE_NUM = new RegExp("\\b(" + numeric.map(titled).join("|") + ")(?:\\.md)?(?:'s)?(?:\\]\\([^)]*\\))? (?:rules? )?(\\d+)(?!\\d|\\.\\d)((?:(?:, |,? and |,? or |[–-])\\d{1,3}(?!\\d|\\.\\d|-)(?! [a-z]))*)", "g");
// `toolkit-standard §D 13`, `skill-standard §A clause G`, and the bare `§D 13` / `§A clause G`.
export const CITE_PART = new RegExp("(?:\\b(" + parted.map(titled).join("|") + ")(?:'s)? )?§([A-Z])(?: clause)? ?([A-Z]\\b|\\d+)", "g");
export const partOwner = Object.fromEntries(parted.flatMap((n) => Object.keys(STANDARDS[n].parts).map((p) => [p, n])));
export const canon = (raw) => names.find((n) => raw.toLowerCase().replace(" ", "-") === n);

/** Each rule a text cites, as { std, handle, index }; numbered lists and ranges expanded. */
export function citations(text) {
  const out = [];
  for (const m of text.matchAll(CITE_NUM)) {
    const std = canon(m[1]);
    if (!std) continue;
    for (const x of [m[2], ...(m[3] || "").split(/, |,? and |,? or /).filter(Boolean)]) {
      const r = x.match(/^(\d+)[–-](\d+)$/);
      const nums = r ? Array.from({ length: Math.max(0, r[2] - r[1] + 1) }, (_, k) => String(+r[1] + k)) : [x.replace(/\D/g, "")];
      for (const n of nums) out.push({ std, handle: n, index: m.index });
    }
  }
  for (const m of text.matchAll(CITE_PART)) {
    const std = m[1] ? canon(m[1]) : partOwner[m[2]];
    if (std) out.push({ std, handle: m[3], index: m.index });
  }
  return out;
}
