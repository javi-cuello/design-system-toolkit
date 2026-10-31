/*
 * tools/css-lint/lint.mjs — the stylesheet rules a parity run cannot see, as
 * functions of their input; the code-standard rules each holds are listed
 * once, in README.md here.
 *
 * Two projects wrote these separately: one as nine gates over its own
 * compiled sheets (a Node test), the other as two PHP scripts — the same
 * code-standard rule 5 written two ways, and code-standard rule 22 as two different halves. Every gate a
 * measurement cannot see is here once; a project names where its sheets are
 * and how its components are named (check.mjs, `styles` in its config).
 *
 * Each gate reads one thing and returns what it found; each has a fixture in
 * test-lint.mjs that feeds it a violation and watches it fire (code-standard rule 41).
 */
import { cssFamily } from '../tokens/names.mjs';

/* Comments blanked, newlines kept, so a reported line still points right.
   A gate that greps raw text also reads the prose that explains the rule.
   CSS has no line comments, so a compiled sheet (`parse`) blanks block
   comments only: one `url(//cdn…)` in a minified sheet otherwise blanked
   the rest of its single line, and every gate read a third of it. Sass's
   `//` is blanked where it can be one — never after `:`, `(` or a quote. */
export const blankComments = (text, { line = true } = {}) => {
  const blocks = text.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
  return line ? blocks.replace(/(^|[^:("'])\/\/[^\n]*/g, (m, p1) => p1 + ' '.repeat(m.length - p1.length)) : blocks;
};

/* A compiled sheet as style rules and its top-level statements. Small on
   purpose: sass output is regular; a rule under @keyframes is not a style rule. */
export function parse(css) {
  const text = blankComments(css, { line: false });
  const rules = [], top = [], stack = [];
  let start = 0;
  const decl = (rule, s) => { const j = s.indexOf(':'); if (j > 0) rule.decls.push({ prop: s.slice(0, j).trim(), value: s.slice(j + 1).trim() }); };
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch !== '{' && ch !== '}' && ch !== ';') continue;
    const prelude = text.slice(start, i).trim();
    start = i + 1;
    if (ch === '{') {
      const at = prelude.startsWith('@') ? prelude.match(/^@[\w-]+/)[0] : null;
      if (stack.length === 0) top.push(at || prelude);
      const inKeyframes = stack.some((s) => s.at === '@keyframes');
      const layer = [...stack].reverse().find((s) => s.at === '@layer');
      const rule = at || inKeyframes ? null : { selector: prelude, decls: [], layer: layer ? layer.name : null };
      if (rule) rules.push(rule);
      stack.push({ at, rule, name: at === '@layer' ? prelude.replace(/^@layer\s*/, '').trim() : null });
      continue;
    }
    if (ch === ';') {
      const here = stack[stack.length - 1];
      if (here && here.rule && prelude) decl(here.rule, prelude);
      else if (stack.length === 0 && prelude.startsWith('@')) top.push(prelude.match(/^@[\w-]+/)[0]);
      continue;
    }
    const here = stack.pop();
    if (here && here.rule && prelude) decl(here.rule, prelude);
  }
  return { rules, top };
}

/* Code-standard rule 4: every top-level statement is a layer, a keyframe set or a face. An
   unlayered declaration beats every layered one, whatever its specificity. */
const ALLOWED_TOP = new Set(['@layer', '@keyframes', '@font-face', '@charset']);
export const unlayered = (css) => parse(css).top.filter((s) => !ALLOWED_TOP.has(s));

/*
 * How a project names its components, so a selector can say which ones it
 * reaches: `{ kind: 'class', prefix: 'ds-', part: '__' }` (BEM classes, the
 * part carries the block's name) or `{ kind: 'element', prefix: 'ds-' }`
 * (custom elements, parts are attributes that carry no block name).
 */
export const blocksIn = (selector, naming) => {
  const re = naming.kind === 'element' ? new RegExp(`(?<![\\w.#-])(${naming.prefix}[\\w-]+)`, 'g') : new RegExp(`\\.(${naming.prefix}[\\w-]+)`, 'g');
  return [...new Set([...selector.matchAll(re)].map((m) => (naming.part ? m[1].split(naming.part)[0] : m[1])))];
};
export const blockOf = (css, naming) => {
  for (const { selector } of parse(css).rules) { const b = blocksIn(selector, naming); if (b.length) return b[0]; }
  return null;
};

/*
 * Code-standard rule 5: a component styles nothing but its own parts. Where parts carry
 * their block's name (BEM), a selector that names another component is the
 * exact violation — banning descendants would have rewritten forty-eight
 * variant rules that reach nothing. Where parts are bare attributes, a
 * descendant combinator is the violation: `ds-dropdown-input [data-label]`
 * styled every menu item's label inside it too.
 */
export const reaching = (css, naming, own = blockOf(css, naming)) => {
  const found = [];
  for (const { selector } of parse(css).rules) {
    const others = blocksIn(selector, naming).filter((b) => b !== own);
    if (others.length) found.push(`${selector} names ${others.join(', ')}`);
  }
  return found;
};
export const descendantCombinators = (css, { layer = 'components' } = {}) => {
  const found = [];
  for (const { selector, layer: l } of parse(css).rules) {
    if (l !== layer) continue;
    // :is(a, b) and attribute values carry commas and spaces of their own:
    // split and judge on a masked copy, report the selector as written
    const masked = selector.replace(/\([^)]*\)|\[[^\]]*\]/g, (m) => 'X'.repeat(m.length));
    let from = 0;
    for (const at of [...[...masked.matchAll(/,/g)].map((m) => m.index), masked.length]) {
      const one = selector.slice(from, at).trim(), test = masked.slice(from, at).trim().replace(/\s*[>+~]\s*/g, '>');
      if (/\S\s+\S/.test(test)) found.push(one);
      from = at + 1;
    }
  }
  return [...new Set(found)];
};

/* Code-standard rule 5, parts as attributes: a component may place a nested component by
   its host — flex, position, display are the parent's layout — but a
   selector that goes past another component's element is inside that
   component, past its edge. `prefix` is the elements' prefix. */
export const reachesPast = (css, { layer = 'components', prefix = 'ds-' } = {}) => {
  const out = [];
  for (const r of parse(css).rules.filter((x) => x.layer === layer)) {
    for (const sel of r.selector.split(',').map((x) => x.trim())) {
      const parts = sel.replace(/\s*([>+~])\s*/g, ' $1 ').split(/\s+/).filter((x) => !/^[>+~]$/.test(x));
      const els = parts.map((p) => (p.match(new RegExp(`^${prefix}[\\w-]+`)) || [])[0] || null);
      // the owner is the first component element; a context before it ([data-theme], .is-open) is not one
      const first = els.findIndex(Boolean);
      els.forEach((el, k) => { if (el && k > first && el !== els[first] && k < parts.length - 1) out.push(`${sel} goes past ${el}`); });
    }
  }
  return [...new Set(out)];
};

/* `!important` outside a reduced-motion block (code-standard rule 4), on the source, comments blanked. */
export const important = (source, { indented = false } = {}) => {
  // inside a reduced-motion block by its structure — braces, or indentation in
  // indented Sass — never by how far above it opened
  const lines = blankComments(source).split('\n'), found = [];
  if (indented) {
    let rm = null;
    lines.forEach((l, i) => {
      if (!l.trim()) return;
      const at = l.match(/^\s*/)[0].length;
      if (rm !== null && at <= rm) rm = null;
      if (rm === null && /prefers-reduced-motion/.test(l)) { rm = at; return; }
      if (l.includes('!important') && rm === null) found.push(i + 1);
    });
    return found;
  }
  const open = [];
  let depth = 0, pending = false; // the query's own { may sit on the next line
  lines.forEach((l, i) => {
    if (l.includes('!important') && !open.length) found.push(i + 1);
    if (/prefers-reduced-motion/.test(l) && !open.length) pending = true;
    for (const ch of l) {
      if (ch === '{') { depth++; if (pending && !open.length) { open.push(depth); pending = false; } }
      else if (ch === '}') { if (open.length && open[open.length - 1] === depth) open.pop(); depth--; }
    }
  });
  return found;
};

/* Code-standard rule 40: `outline: none` leaves the width at the browser's default, so a
   reader of computed styles sees a ring that is not painted. */
export const outlineNone = (source) => blankComments(source).split('\n').flatMap((l, i) => (/outline:\s*none/.test(l) ? [i + 1] : []));

/* Code-standard rule 48: the anchor reset lives once, in the base layer. */
export const anchorResets = (css) => parse(css).rules.filter((r) => r.decls.some((d) => d.prop === 'text-decoration' && d.value === 'none')).map((r) => r.selector);

/*
 * Code-standard rule 22, first half: every literal in a brace-syntax sheet is a token or
 * carries its reason — a comment on its line, over the run of declarations
 * directly under it, or directly above its block (a run of one-line sibling
 * rules is one block). Indented Sass has no braces to read blocks by; it is
 * reported as not read, never as clean.
 */
const LITERAL = /:\s*[^;]*?(?<![\w-])(-?\d+(\.\d+)?(px|rem|em)|#[0-9a-fA-F]{3,8})(?![\w-])/;
const TRIVIAL = /:\s*(0|1px solid|none|inherit)\s*;/;
// a var() is a token, its fallback included; a literal beside one is still a literal
const noVars = (l) => l.replace(/var\((?:[^()]|\([^()]*\))*\)/g, 'var');
export const unexplained = (source) => {
  const lines = source.split('\n'), clean = blankComments(source).split('\n');
  const hasComment = (i) => i >= 0 && i < lines.length && lines[i] !== clean[i];
  const oneLiner = (l) => /^\s*[^{}]*\{[^{}]*\}\s*$/.test(l);
  const base = /^@layer [a-z]+ \{/m.test(source) ? 1 : 0;
  const found = [], blocks = [];
  let depth = 0, start = 0;
  lines.forEach((l, i) => {
    const open = (clean[i].match(/\{/g) || []).length, close = (clean[i].match(/\}/g) || []).length;
    if (depth === base && open > 0) start = i;
    depth += open - close;
    if (depth === base && close > 0) blocks.push([start, i]);
  });
  for (const [a, b] of blocks) {
    let head = a;
    while (head > 0 && oneLiner(lines[head]) && oneLiner(lines[head - 1])) head--;
    const noted = hasComment(head - 1);
    const underANote = (i) => { for (let j = i; j >= a; j--) { if (hasComment(j)) return true; if (j < i && (clean[j].trim() === '' || /[{}]/.test(clean[j]))) return false; } return false; };
    for (let i = a; i <= b; i++) {
      const l = clean[i];
      if (!LITERAL.test(noVars(l)) || TRIVIAL.test(l) || noted || underANote(i)) continue;
      found.push(`${i + 1}  ${lines[i].trim()}`);
    }
  }
  return found;
};

/* The same rule for indented Sass, where a block is its indentation: a
   comment on the literal's line, or above the run of declarations it sits in,
   or directly above the selector that opens its block. */
export const unexplainedIndented = (source) => {
  const lines = source.split('\n'), found = [];
  const ind = (l) => l.match(/^\s*/)[0].length;
  const isComment = (l) => /^\s*\/\//.test(l);
  const code = (l) => l.replace(/(^|\s)\/\/.*$/, '');
  lines.forEach((l, i) => {
    const c = code(l);
    if (!/^\s*[a-z-]+\s*:/.test(c) || !LITERAL.test(noVars(c) + ';') || TRIVIAL.test(c.trim().replace(/$/, ';').replace(/^[a-z-]+\s*/, ':').replace(/^::/, ':'))) return;
    if (/\/\//.test(l)) return;
    const me = ind(l);
    for (let j = i - 1; j >= 0; j--) {
      const above = lines[j];
      if (!above.trim()) break;
      if (isComment(above) && ind(above) === me) return;
      if (ind(above) < me) { // the selector that opens this block
        let head = j;
        for (;;) {
          for (let k = head - 1; k >= 0 && isComment(lines[k]); k--) if (ind(lines[k]) === ind(lines[head])) return;
          // a breakpoint or a mixin wrapper is not a block of its own: its note is the selector's above it
          if (!/^\s*(@include|@media|\+)/.test(lines[head])) break;
          const level = ind(lines[head]);
          let up = head - 1;
          while (up >= 0 && (!lines[up].trim() || ind(lines[up]) >= level)) up--;
          if (up < 0) break;
          head = up;
        }
        break;
      }
    }
    found.push(`${i + 1}  ${l.trim()}`);
  });
  return found;
};

/*
 * Code-standard rule 22, second half (and code-standard rule 46): a length a token already names. Parity
 * compares what the browser computed, and `448px` computes the same as the
 * token it should have been, so the number stops moving when the grid does.
 * Only the properties Figma binds a variable to; 0, 1px and 2px are left out.
 */
/* The CSS properties each spec binding key stands for. */
export const PROPS_OF = {
  pad: /^(padding)(-[a-z-]+)?$/, gap: /^(gap|row-gap|column-gap)$/, radius: /^border(-[a-z-]+)?-radius$/,
  w: /^(inline-size|width|min-inline-size|max-inline-size|min-width|max-width)$/, h: /^(block-size|height|min-block-size|max-block-size|min-height|max-height)$/,
};
/* What the design binds: for each binding key a spec uses, the token families
   its variables come from (`Spacing/16` → `--spacing-`), read off the specs a
   project's snapshot stored. A size the library never binds is a drawn
   number, and a literal that equals a token there is a coincidence: one
   project's 28 "findings" were icon and control sizes no Figma layer binds. */
export const boundFamilies = (specs) => {
  const fam = {};
  const walk = (n) => {
    if (!n || typeof n !== 'object') return;
    for (const [k, v] of Object.entries(n.bindings || {})) for (const name of [].concat(v)) {
      if (typeof name !== 'string' || !name.includes('/')) continue;
      (fam[k] || (fam[k] = new Set())).add(cssFamily(name));
    }
    for (const c of n.children || []) walk(c);
  };
  for (const s of specs) for (const v of s.variants || []) walk(v);
  return fam;
};
const px = (v) => (v.endsWith('rem') ? `${+(parseFloat(v) * 16).toFixed(3)}px` : v);
export const tokenLengths = (tokenSources) => {
  const byValue = new Map();
  for (const text of tokenSources) for (const m of text.matchAll(/^\s*(--[a-z0-9-]+):\s*([0-9.]+(?:px|rem))\s*;?\s*$/gim)) {
    const k = px(m[2]); if (!byValue.has(k)) byValue.set(k, []); byValue.get(k).push(m[1]);
  }
  for (const skip of ['0px', '1px', '2px']) byValue.delete(skip);
  return byValue;
};
/* Code-standard rule 22's second half: a length a token already names, on a property the
   design binds to that token's family. A comment on the line or the line
   above says why it is not the token, as code-standard rule 22's first half allows. */
export const literalTokens = (source, byValue, families) => {
  const found = [], raw = source.split('\n'), clean = blankComments(source).split('\n');
  const noted = (i) => (raw[i] !== clean[i]) || (i > 0 && raw[i - 1] !== clean[i - 1] && clean[i - 1].trim() === '');
  clean.forEach((l, i) => {
    const prop = (l.match(/^\s*([a-z-]+)\s*:/) || [])[1];
    if (!prop || noted(i)) return;
    const keys = Object.keys(PROPS_OF).filter((k) => PROPS_OF[k].test(prop) && families[k]);
    if (!keys.length) return;
    const allowed = new Set(keys.flatMap((k) => [...families[k]]));
    for (const m of l.matchAll(/(?<![\w-])([0-9.]+(?:px|rem))(?![\w-])/gi)) {
      const names = (byValue.get(px(m[1])) || []).filter((n) => [...allowed].some((f) => n.startsWith(f)));
      if (names.length) found.push(`${i + 1}  ${prop}: ${m[1]} is var(${names.join(') or var(')})`);
    }
  });
  return found;
};

/* Code-standard rule 17: `hidden` must beat the stylesheet. An element a script hides by
   the attribute, carrying a component class, needs `[hidden] { display: none }`
   on that class, or once globally. Read off JSX-shaped markup. */
/* A template's PHP blocks masked, newlines kept: `<x id="<?= $id ?>" hidden>`
   ended at the `?>` inside the id, and the attribute after it went unread. */
const phpless = (s) => s.replace(/<\?(=|php)[\s\S]*?\?>/g, (m) => m.replace(/[^\n]/g, 'x'));

export const hiddenByScript = (markup, naming) => {
  const out = [];
  // a PHP project hides through its snippets: snippet('ds/x', [... 'hidden' => …]) renders <ds-x hidden>
  // only the snippet's own arguments: a `hidden` inside a nested array belongs to a part it renders
  if (naming.kind === 'element') for (const m of markup.matchAll(/snippet\(\s*['"]ds\/([\w-]+)['"]\s*,\s*\[/g)) {
    let i = m.index + m[0].length, depth = 1, top = '';
    for (; i < markup.length && depth > 0; i++) { const ch = markup[i]; if (depth === 1) top += ch; if (ch === '[') depth++; else if (ch === ']') depth--; }
    // a flag, not a list: `'hidden' => [...]` is a form's hidden fields
    if (/['"]hidden['"]\s*=>(?!\s*(\[|array\s*\(|false\b|null\b|0\b))/.test(top)) out.push(`${naming.prefix}${m[1]}`);
  }
  for (const m of phpless(markup).matchAll(/<[a-zA-Z][^>]*>/g)) {
    const tag = m[0];
    if (!/[\s\n]hidden(?=[\s\n=>/])/.test(tag) || /type=["']hidden["']/.test(tag)) continue;
    if (naming.kind === 'element') {
      // the component is the element itself
      const el = tag.match(new RegExp(`^<(${naming.prefix}[\\w-]+)`));
      if (el) out.push(el[1]);
      continue;
    }
    const cls = tag.match(/(?:className|class)=(?:"([^"]*)"|'([^']*)'|\{[^}]*?["'`]([^"'`]*)["'`])/);
    const ds = ((cls && (cls[1] || cls[2] || cls[3])) || '').match(new RegExp(`${naming.prefix}[\\w-]+`));
    if (ds) out.push(ds[0]);
  }
  return [...new Set(out)];
};
export const unhidden = (classes, rules) => {
  const hides = (r) => r.decls.some((d) => d.prop === 'display' && d.value.replace(/\s*!important$/, '') === 'none');
  if (rules.some((r) => /^\[hidden\]$/.test(r.selector.trim()) && hides(r))) return [];
  return classes.filter((cls) => !rules.some((r) => (r.selector.includes(`.${cls}[hidden]`) || new RegExp(`(^|[\\s,>])${cls}\\[hidden\\]`).test(r.selector)) && hides(r)));
};

/* Code-standard rule 18: an icon-only control has a name; an `aria-label` defaulted to empty is a silent omission. */
export const emptyLabels = (source) => source.split('\n').flatMap((line, i) => (
  /aria-label\s*=\s*(""|''|\{\s*(""|''|``)\s*\})/.test(line) || /(ariaLabel|['"]aria-label['"])\s*[:=]\s*(""|''|``)/.test(line) ? [i + 1] : []));

/* Code-standard rule 10: a presentational HTML attribute is mapped to CSS by every browser,
   on any element, an unknown custom one included: `align="center"` on a
   container centred the text of everything inside it. `width` and `height`
   are a component's mistake only on a custom element; on img, svg, video,
   canvas and iframe they are the platform's own. Read off the markup, by line. */
const PRESENTATIONAL = ['align', 'valign', 'bgcolor', 'background', 'border', 'nowrap', 'hspace', 'vspace', 'clear', 'cellpadding', 'cellspacing'];
export const presentationalAttrs = (source) => {
  const out = [];
  // whole tags, across lines: an attribute on a continuation line is still on the tag
  const text = phpless(source);
  for (const m of text.matchAll(/<([a-zA-Z][\w-]*)\b([^>]*)/g)) {
    const [, tag, attrs] = m;
    const native = /^[a-z][a-z0-9]*$/.test(tag), custom = tag.includes('-');
    if (!native && !custom) continue; // a JSX component: its props are not attributes until it renders them
    for (const a of attrs.matchAll(/(?:^|\s)([a-zA-Z][\w-]*)\s*=/g)) {
      const n = a[1];
      if (PRESENTATIONAL.includes(n.toLowerCase()) || (custom && /^(width|height)$/i.test(n))) out.push(`${text.slice(0, m.index + m[0].indexOf(a[0].trim())).split('\n').length}  <${tag} ${n}=…>`);
    }
  }
  return out;
};

/* Code-standard rule 16: a sheet that re-points its colours for dark also declares
   `color-scheme`, or the browser paints inputs, scrollbars and default links
   light on a dark page. */
export const colorSchemeMissing = (css) => {
  const text = blankComments(css);
  const dark = /prefers-color-scheme:\s*dark|\[data-theme=["']?dark/i.test(text);
  return dark && !/(^|[;{\s])color-scheme\s*:/.test(text);
};

/* Code-standard rule 39: a data attribute is global. A rule outside the components layer
   that reaches `[data-x]` through a descendant combinator also reaches every
   component that uses `[data-x]` for a part of its own: a modal's
   `[data-content]` padded every text field inside it. */
export const hookCollisions = (css, { layer = 'components' } = {}) => {
  const { rules } = parse(css);
  const attr = (sel) => [...sel.matchAll(/\[(data-[\w-]+)/g)].map((m) => m[1]);
  const owned = new Set(rules.filter((r) => r.layer === layer).flatMap((r) => attr(r.selector)));
  const out = [];
  for (const r of rules.filter((x) => x.layer !== layer)) {
    for (const sel of r.selector.split(',').map((s) => s.trim())) {
      // the compound a descendant combinator reaches: the first of the last
      // space-separated run; what follows it hangs off it by > + or ~ and goes
      // no deeper than the page's own markup put it
      const parts = sel.replace(/\s*([>+~])\s*/g, '$1').split(/\s+/);
      if (parts.length < 2) continue;
      const reached = parts[parts.length - 1].split(/[>+~]/)[0];
      for (const a of attr(reached)) if (owned.has(a)) out.push(`${sel} reaches [${a}], which a component uses for a part of its own`);
    }
  }
  return [...new Set(out)];
};

/* Code-standard rule 21: a click handler that cancels the browser's navigation lets the
   modified clicks through — cmd, ctrl, shift, alt and the middle button open a
   tab, a window, a download. A click handler that calls preventDefault and
   navigates itself, reading none of them, takes those away. Read per handler:
   the body from the click marker to its balanced end, so a key handler's
   preventDefault in the same file is not mistaken for the click's. */
export const modifiedClicks = (source) => {
  const text = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
  for (const m of text.matchAll(/addEventListener\(\s*['"]click['"]|onClick\s*=|\.onclick\s*=/g)) {
    // addEventListener's own paren is already open: the handler ends where it closes
    const open = m[0].startsWith('addEventListener');
    let i = m.index + m[0].length, depth = open ? 1 : 0, started = open;
    for (; i < text.length; i++) {
      const c = text[i];
      if ('({['.includes(c)) { depth++; started = true; } else if (')}]'.includes(c)) { depth--; if (started && depth <= 0) break; }
      else if (!started && (c === ';' || c === '\n') && i > m.index + m[0].length + 1) break;
    }
    let body = text.slice(m.index, i + 1);
    // a named handler: its definition is the body that matters
    const named = body.match(/(?:click['"]\s*,\s*|onClick\s*=\s*\{\s*)([A-Za-z_$][\w$]*)\s*[)}]/) || body.match(/\.onclick\s*=\s*([A-Za-z_$][\w$]*)\s*(;|$)/);
    if (named) { const d = text.search(new RegExp(`(function\\s+${named[1]}\\b|(const|let|var)\\s+${named[1]}\\s*=)`)); if (d >= 0) body += text.slice(d, d + 600); }
    if (/preventDefault\(\)/.test(body) && /location(\.href)?\s*=|location\.assign|router\.push|navigate\(|window\.open/.test(body) && !/metaKey|ctrlKey|shiftKey|altKey|\.button\b/.test(body)) return true;
  }
  return false;
};

/* Code-standard rule 9: a state is a pseudo-class and disabled is the control's own, so a
   template cannot claim a state the control is not in. Named: a selector that
   spells a state as a class or an attribute, and on a custom element an ARIA
   or HTML name taken for a variant (`role="primary"`, `disabled`). */
const ROLES = new Set('alert alertdialog application article banner button cell checkbox columnheader combobox complementary contentinfo definition dialog directory document feed figure form grid gridcell group heading img link list listbox listitem log main marquee math menu menubar menuitem menuitemcheckbox menuitemradio meter navigation none note option presentation progressbar radio radiogroup region row rowgroup rowheader scrollbar search searchbox separator slider spinbutton status switch tab table tablist tabpanel term textbox timer toolbar tooltip tree treegrid treeitem'.split(' '));
export const stateAsAttribute = (css) => [...new Set(parse(css).rules.flatMap((r) => r.selector.split(',').map((s) => s.trim()))
  .filter((s) => /\[(data-)?state=["']?(hover|focus|focused|press|pressed|active)\b|\.is-(hover|focus|focused|active|pressed)\b|--(hover|focused|pressed)\b/.test(s)))];
export const variantCollisions = (source) => {
  const out = [];
  source.split('\n').forEach((line, i) => {
    for (const m of line.matchAll(/<([a-z][\w]*-[\w-]*)\b([^>]*)/g)) {
      const role = m[2].match(/\brole=["']([\w-]+)["']/);
      if (role && !ROLES.has(role[1])) out.push(`${i + 1}  <${m[1]} role="${role[1]}">`);
      if (/(^|\s)disabled(\s|=|$)/.test(m[2])) out.push(`${i + 1}  <${m[1]} disabled>`);
    }
  });
  return out;
};

/* Code-standard rule 36: one enhancement, one implementation. The same inline <script>
   in two templates is a fork nobody sees; by body, whitespace aside. */
export const inlineScriptForks = (files) => {
  const seen = new Map();
  for (const [name, source] of files) {
    for (const m of source.matchAll(/<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)) {
      const body = m[1].replace(/\s+/g, ' ').trim();
      if (body.length < 80) continue; // a one-line config is not an enhancement
      if (!seen.has(body)) seen.set(body, new Set());
      seen.get(body).add(name);
    }
  }
  return [...seen.values()].filter((s) => s.size > 1).map((s) => [...s].sort().join(' and '));
};

/* Code-standard rule 47: a client boundary is paid only for the component's own behaviour.
   A file under the client directive with no hook, no browser global and no
   handler of its own (one it defines, not one its caller hands it). */
export const needlessClient = (source) => {
  if (!/^\s*['"]use client['"]/.test(source)) return false;
  const text = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
  if (/\buse[A-Z]\w*\s*(<[^>()]*>)?\s*\(/.test(text)) return false; // a hook, a type argument allowed
  if (/\b(window|document|localStorage|sessionStorage|navigator|location)\b\s*[.[]/.test(text)) return false;
  if (/\bcreateContext\s*\(|\bref=\{\s*(\([^)]*\)|\w+)\s*=>/.test(text)) return false; // a context and a ref callback live on the client
  for (const m of text.matchAll(/\bon[A-Z]\w*\s*=\s*\{\s*([^}]*)/g)) {
    const v = m[1].trim();
    if (/=>|\bfunction\b/.test(v)) return false; // a handler written here, however it is chosen
    const name = v.match(/^([A-Za-z_$][\w$]*)/);
    if (name && new RegExp(`(const|let|function)\\s+${name[1]}\\b`).test(text)) return false;
  }
  return true;
};

/* Code-standard rule 11: a layout container is a component, and pages never declare its
   values. Named: a rule outside the components layer that sets the max width
   a container component sets — the grid restated, which drifts the moment the
   container's changes. */
export const containerWidthRestated = (css, { layer = 'components' } = {}) => {
  const { rules } = parse(css);
  const width = (r) => r.decls.filter((d) => /^max-(inline-size|width)$/.test(d.prop)).map((d) => d.value.replace(/\s*!important/, ''));
  const grid = new Set(rules.filter((r) => r.layer === layer && /container/i.test(r.selector)).flatMap(width));
  return [...new Set(rules.filter((r) => r.layer !== layer && !/container/i.test(r.selector)).flatMap((r) => width(r).filter((w) => grid.has(w)).map((w) => `${r.selector} sets ${w}, the container's width`)))];
};

/* Code-standard rule 43: a boundary that serialises props takes values, never functions. In
   a module with no client directive, an inline function handed as a prop to a
   component imported from a client module cannot cross the boundary, and the
   page fails at request time. `isClient(specifier)` says whether an import
   resolves to a client module. */
export const functionProps = (source, isClient) => {
  if (/^\s*['"]use client['"]/.test(source)) return [];
  const clients = new Set();
  for (const m of source.matchAll(/import\s*\{([^}]*)\}\s*from\s*['"]([^'"]+)['"]/g)) if (isClient(m[2])) for (const n of m[1].split(',')) clients.add(n.replace(/\btype\b|\s+as\s+\w+/g, '').trim());
  for (const m of source.matchAll(/import\s+(\w+)\s+from\s*['"]([^'"]+)['"]/g)) if (isClient(m[2])) clients.add(m[1]);
  const out = [];
  for (const m of source.matchAll(/<([A-Z]\w*)\b/g)) {
    if (!clients.has(m[1])) continue;
    // the tag runs to the first > outside braces: an arrow's => sits inside them
    let i = m.index + m[0].length, depth = 0;
    for (; i < source.length; i++) { const c = source[i]; if (c === '{') depth++; else if (c === '}') depth--; else if (c === '>' && depth === 0) break; }
    const tag = source.slice(m.index, i);
    for (const p of tag.matchAll(/(\w+)=\{\s*(\([^)]*\)\s*=>|\w+\s*=>|async\s*\(|function\b)/g)) {
      out.push(`${source.slice(0, m.index).split('\n').length}  <${m[1]} ${p[1]}={…function…}>`);
    }
  }
  return out;
};

/* Code-standard rule 42: no declaration exists to make a check agree. The narrow form a
   script can see: a box's height computed as its text's size times its line
   height — the design tool's text box, written so a measurement would match,
   which clips the glyphs a text control paints past it. By line. */
export const textBoxHeights = (source) => blankComments(source).split('\n').flatMap((l, i) => (
  /(^|[\s;{])(block-size|height|min-block-size|min-height)\s*:\s*calc\((?=[^;]*size)(?=[^;]*line-height)[^;]*\*/.test(l) ? [`${i + 1}  ${l.trim()}`] : []));
