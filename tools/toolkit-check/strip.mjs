// A file's code without its comments: what a check's string must be found in, so a
// check deleted with only its comment left behind no longer counts. One stripper,
// shared by tools/toolkit-check/check-standards.mjs and tools/toolkit-check/check-runs.mjs.
import { basename } from "node:path";

// Comments are prose and may cite anything; strings and regexes are code.
// A small scanner rather than a regex: `//` inside a string is not a comment, and a comment may hold quotes.
export function code(src) {
  let out = "", q = null;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i], two = src.slice(i, i + 2);
    if (q) { out += ch; if (ch === "\\") { out += src[++i] || ""; } else if (ch === q || (ch === "\n" && q !== "`")) q = null; continue; }
    if (two === "/*") { const e = src.indexOf("*/", i + 2); const end = e < 0 ? src.length : e + 2; out += src.slice(i, end).replace(/[^\n]/g, ""); i = end - 1; continue; }
    if (two === "//" && src[i - 1] !== ":") { const e = src.indexOf("\n", i); i = (e < 0 ? src.length : e) - 1; continue; }
    if (ch === '"' || ch === "'" || ch === "`") q = ch;
    out += ch;
  }
  return out;
}

// By file type: JavaScript through `code`, shell and Python line comments, CSS blocks; escaped quotes unescaped.
export function stripComments(rel, src) {
  const un = (x) => x.replace(/\\(['"`])/g, "$1");
  if (/\.(m?js|cjs|astro|ts)$/.test(rel)) return un(code(src));
  // A shell or Python comment: a whole line, or a trailing `#` after a space with no quote after it.
  if (/\.(sh|py)$/.test(rel) || !/\./.test(basename(rel))) return un(src).split("\n").filter((l) => !/^\s*#(?!!)/.test(l)).map((l) => l.replace(/\s#[^'"`]*$/, "")).join("\n");
  if (/\.css$/.test(rel)) return un(src).replace(/\/\*[\s\S]*?\*\//g, "");
  return un(src);
}
