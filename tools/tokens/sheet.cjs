/*
 * A built token sheet read back as declarations: the one scanner of custom properties (customProperties, which the
 * self reading's page cuts its tokens with, site.mjs reachedTokens) and the declarations each mode's attribute carries
 * (blocksOf, which a component sheet re-declares where a pointer state sets a mode, to-code pointerModesOf).
 */

/* The custom property declarations in a sheet, in order: { name, start, end, value }, `start`..`end` the whole
   declaration (its `;` included where it has one). Read by a scanner, never by line: a token build may put several on
   one line, and a value may hold a string, a comment, a `;` or a block inside brackets. Tested by test-from-code.mjs. */
function customProperties(css) {
  const out = [], n = css.length;
  // past a comment or a string starting at j
  const past = (j) => {
    if (css[j] === '/' && css[j + 1] === '*') { const e = css.indexOf('*/', j + 2); return e < 0 ? n : e + 2; }
    const q = css[j];
    // (a string ends at its quote, or unclosed at the line's end, as CSS ends a bad string)
    for (j++; j < n; j++) { if (css[j] === '\\') j++; else if (css[j] === q) return j + 1; else if (css[j] === '\n') return j; }
    return n;
  };
  const opens = (ch) => ch === '"' || ch === "'";
  let fresh = true;
  for (let i = 0; i < n;) {
    const ch = css[i];
    if (opens(ch) || (ch === '/' && css[i + 1] === '*')) { const comment = ch === '/'; i = past(i); if (!comment) fresh = false; continue; }
    if (ch === '{' || ch === '}' || ch === ';') { fresh = true; i++; continue; }
    if (/\s/.test(ch)) { i++; continue; }
    // (a name of any characters CSS takes in one: escaped, or past ASCII)
    const name = fresh && ch === '-' && css[i + 1] === '-' && /^--(?:[\w-]|\\[\s\S]|[^\x00-\x7f])*/.exec(css.slice(i, i + 256))[0];
    fresh = false;
    if (!name) { i++; continue; }
    let j = i + name.length;
    while (j < n && (/\s/.test(css[j]) || (css[j] === '/' && css[j + 1] === '*'))) j = /\s/.test(css[j]) ? j + 1 : past(j);
    if (css[j] !== ':') { i = j; continue; }
    // the value: up to a `;` or the block's `}`, outside strings, comments and brackets
    const from = ++j;
    for (let depth = 0; j < n;) {
      const c = css[j];
      if (opens(c) || (c === '/' && css[j + 1] === '*')) { j = past(j); continue; }
      if (c === '(' || c === '[' || c === '{') depth++;
      else if (c === ')' || c === ']' || (c === '}' && depth > 0)) depth--;
      else if (depth === 0 && (c === ';' || c === '}')) break;
      j++;
    }
    out.push({ name, start: i, end: css[j] === ';' ? j + 1 : j, value: css.slice(from, j).trim() });
    i = j;
  }
  return out;
}

/** The custom properties the token build declares under each mode's attribute: { key: { value: [[name, value, at]] } },
 *  `at` the at-rules the block sits in (`@media screen` for a theme's), null where none. Only a rule whose selector is
 *  that attribute alone; each block's declarations read by customProperties. Tested by tools/tokens/test-from-snapshot.mjs. */
function blocksOf(css) {
  const text = String(css || ''), out = {}, stack = [];
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    // (past a comment or a string, whose braces are no block's)
    if (ch === '/' && text[i + 1] === '*') { const e = text.indexOf('*/', i + 2); i = e < 0 ? text.length : e + 1; continue; }
    if (ch === '"' || ch === "'") { for (i++; i < text.length && text[i] !== ch && text[i] !== '\n'; i++) if (text[i] === '\\') i++; continue; }
    if (ch === ';' && !stack.length) { start = i + 1; continue; }
    if (ch === '{') { stack.push({ prelude: text.slice(start, i).replace(/\/\*[\s\S]*?\*\//g, '').trim(), from: i + 1 }); start = i + 1; continue; }
    if (ch === ';') { start = i + 1; continue; }
    if (ch !== '}') continue;
    const b = stack.pop();
    start = i + 1;
    if (!b) continue;
    const m = /^\[data-([a-z0-9-]+)="([^"]*)"\]$/.exec(b.prelude);
    if (!m) continue;
    const at = stack.filter((x) => x.prelude.startsWith('@') && !x.prelude.startsWith('@layer')).map((x) => x.prelude).join(' ') || null;
    const decls = customProperties(text.slice(b.from, i)).map((d) => [d.name, d.value, at]);
    if (decls.length) ((out[m[1]] ||= {})[m[2]] ||= []).push(...decls);
  }
  return out;
}

module.exports = { customProperties, blocksOf };
