// A file's code without its comments: what a check's string must be found in, so a
// check deleted with only its comment left behind no longer counts. One stripper,
// shared by tools/toolkit-check/check-standards.mjs and tools/toolkit-check/check-runs.mjs.
import { basename } from "node:path";

// Where a value may begin, so a `/` there opens a regex and not a division: what precedes it (the last 40 characters
// are enough) ends in an operator, an opening bracket or a keyword, never in `++`/`--`, a name, a number or a `)`.
const valueMayBegin = (before) => !/(\+\+|--)\s*$/.test(before) && /(^|[(,=:[!&|?{};+\-*%<>~^]|\b(?:return|typeof|case|in|of|delete|void|throw|new|else|do))\s*$/.test(before);

// Comments are prose and may cite anything; strings and regexes are code.
// A small scanner rather than a regex: `//` inside a string is not a comment, and a comment may hold quotes.
export function code(src) {
  let out = "", q = null;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i], two = src.slice(i, i + 2);
    if (q) { out += ch; if (ch === "\\") { out += src[++i] || ""; } else if (ch === q || (ch === "\n" && q !== "`")) q = null; continue; }
    if (two === "/*") { const e = src.indexOf("*/", i + 2); const end = e < 0 ? src.length : e + 2; out += src.slice(i, end).replace(/[^\n]/g, ""); i = end - 1; continue; }
    if (two === "//" && src[i - 1] !== ":") { const e = src.indexOf("\n", i); i = (e < 0 ? src.length : e) - 1; continue; }
    // A regex literal is code, copied whole: a quote inside one (/`([^`]+)`/) opened a string that swallowed
    // the comments after it. A `/` starts one where a value may begin, not after a value (a division).
    if (ch === "/" && valueMayBegin(out.slice(-40))) {
      let j = i + 1, cls = false;
      for (; j < src.length && src[j] !== "\n"; j++) {
        if (src[j] === "\\") { j++; continue; }
        if (src[j] === "[") cls = true; else if (src[j] === "]") cls = false; else if (src[j] === "/" && !cls) break;
      }
      if (src[j] === "/") { out += src.slice(i, j + 1); i = j; continue; }
    }
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

/* The regex literals in code (comments already stripped), read left to right so a slash inside a string never opens
   one: '/checkout'); … new Error('/' read as one regex quoting "Error" (2026-11-24). A quote string ends at its line, and
   a template never closed is no template, so neither hides what follows; a template's ${} is code, read the same way,
   strings in it included (a backtick or a brace in one ends nothing). */
const REGEX_AT = /(?<![\w)\]])\/(?![*/])((?:\\.|\[[^\]\n]*\]|[^/\\\n])+)\/[gimsuy]*/y;
export function regexes(src) {
  const out = [];
  // a quote string's end, or -1 when its line ends first
  const quoted = (i) => { for (let j = i + 1; j < src.length; j++) { if (src[j] === "\\") j++; else if (src[j] === "\n") return -1; else if (src[j] === src[i]) return j + 1; } return -1; };
  // a template's end, or -1 when it never closes; its ${} read as code
  // a template or a ${} read once per place it starts, its finds kept with its end: a minified file with backticks left
  // open re-read the same text for every one of them and never finished (axe.min.js)
  const memo = (fn) => { const seen = new Map(); return (i) => {
    const hit = seen.get(i);
    if (hit) { out.push(...hit.found); return hit.end; }
    const mark = out.length, end = fn(i);
    seen.set(i, { end, found: out.slice(mark) });
    return end;
  }; };
  const template = memo((i) => {
    for (let j = i + 1; j < src.length; j++) {
      if (src[j] === "\\") j++;
      else if (src[j] === "`") return j + 1;
      else if (src[j] === "$" && src[j + 1] === "{") { const e = expr(j + 2); if (e < 0) return -1; j = e - 1; }
    }
    return -1;
  });
  // code from i: in a ${}, up to and past its closing brace (-1 when none); else to the end. What a template's ${}
  // finds is dropped when the template never closes, and its text is read again as code.
  const scan = (i, inExpr) => {
    let depth = 0;
    while (i < src.length) {
      const c = src[i];
      if (c === "'" || c === '"') { const e = quoted(i); i = e < 0 ? i + 1 : e; continue; }
      if (c === "`") { const mark = out.length, e = template(i); if (e < 0) { out.length = mark; i++; } else i = e; continue; }
      // (`N / 2, \`${a}/` read as one regex swallowed a backtick, and every regex after it in test-oklch.js)
      if (c === "/" && valueMayBegin(src.slice(Math.max(0, i - 40), i))) { REGEX_AT.lastIndex = i; const m = REGEX_AT.exec(src); if (m) { out.push(m[1]); i = REGEX_AT.lastIndex; continue; } }
      if (inExpr) { if (c === "{") depth++; else if (c === "}") { if (depth === 0) return i + 1; depth--; } }
      i++;
    }
    return inExpr ? -1 : i;
  };
  const expr = memo((i) => scan(i, true));
  scan(0, false);
  return out;
}
