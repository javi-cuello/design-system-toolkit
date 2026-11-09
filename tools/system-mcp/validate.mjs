#!/usr/bin/env node
/*
 * tools/system-mcp/validate.mjs — generated code checked against one project's
 * published tokens and, where named, a component's contract. The system MCP's
 * `validate` tool calls it; as a command it is a hook an agent's output runs
 * through once generation is done:
 *
 *   node tools/system-mcp/validate.mjs <file>… (--docs <docs site URL> | --api <built site's api folder>) [--component <name>] [--from <import prefix>]… [--json]
 *
 * exits 1 when it finds something. What it holds, each a finding with what to
 * use instead where there is one:
 *   - a colour written raw (#c40d22, rgb(…)): the token that holds it, or none
 *   - a token named that the library does not have (Color/Text/…, or a CSS
 *     variable named from one, var(--color-text-…))
 *   - a contract prop given a value the contract does not have
 *   - a raw HTML element where the library has the component for it (<button>
 *     beside a Button): left alone, agents write their own components instead
 *     of the system's (Storybook's MCP trial found this)
 *   - a library component defined in the code (function Button, const Button =):
 *     a copy, which the next library release does not reach
 *   - with `from` given (the specifiers the system's components are imported
 *     from, as prefixes: '@/design-system/'), a library component imported or
 *     re-exported by name from anywhere else: Atlassian's models invented imports
 *     when told not to. `import * as` and `import type` are not read; a framework
 *     part sharing a name (Link from next/link) is listed in `from` to pass
 *   Run on code that uses the system, never on the system's own files.
 *
 *   validate(code, tokens, contract?, components?, { from? }) → [{ kind, found, use?, line }]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseColour as colour } from '../parity/values.mjs';
import { cssName, cssFamily } from '../tokens/names.mjs';

import { realpathSync } from 'node:fs';
// the files it reads: what an agent writes a screen in (the push gate and the evals pick files by it)
export const CODE = /\.(tsx|jsx|ts|js|mjs|vue|svelte|astro|html|php|css|scss)$/;
/* Whether validate reads a project file, by its repo-relative path and the
   project's `check.validate`: code, inside `code` when it names prefixes, and
   never the design system's own (`system`). The push gate and the session's
   Stop check (tools/claude-hooks) read the same files. */
export const inScope = (f, V = {}) => CODE.test(f) && (!V.code || V.code.some((p) => f.startsWith(p))) && !(V.system || []).some((p) => f.startsWith(p));
/* The findings a §6 ruling does not waive. A ruling waives a finding only
   when it is scoped `validate` (in backticks too) and names the very finding:
   its file, relative to the project, and what was found, each as a whole word
   (`#fff` is not `#ffffff`, `src/a.css` is not `lib/src/a.css` or `src/a.css.map`).
   The push gate and the evals both read it. `rel(f)` is the finding's file as the ruling names it. */
export function unwaived(found, rulings, rel) {
  const waivers = rulings.filter((w) => /^validate$/i.test(String(w.scope).replace(/`/g, '').trim()));
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const names = (k, s) => new RegExp(`(^|[\\s\`'"(])${esc(s)}(?=$|[\\s\`'",;:)]|\\.(\\s|$))`).test(k);
  return found.filter((f) => !waivers.some((w) => names(w.key, rel(f)) && names(w.key, f.found)));
}
// two colours the same within a channel step and a hundredth of opacity: a raw value that is a token's
const same = (a, b) => a && b && a.slice(0, 3).every((x, i) => Math.abs(x - b[i]) <= 1) && Math.abs(a[3] - b[3]) <= 0.01;

// the HTML element each kind of library component replaces, by the names libraries give it; the first
// name the library has is the one to use (an input's type picks among them)
const REPLACES = {
  button: ['Button'], select: ['Dropdown input', 'Select', 'Dropdown'], textarea: ['Text area input', 'Text area', 'Textarea'],
  dialog: ['Dialog', 'Modal'], progress: ['Progress bar', 'Progress'], hr: ['Divider'], a: ['Link'], table: ['Table'],
  'input checkbox': ['Checkbox'], 'input radio': ['Radio', 'Radio button'], 'input range': ['Slider'],
  'input number': ['Number input'], 'input password': ['Password input'], 'input search': ['Search input'], 'input date': ['Date input', 'Date picker'],
  input: ['Text input', 'Text field', 'Input'],
};

// a component's title as code names it: Text input → TextInput
const pascal = (t) => String(t).split(/[^A-Za-z0-9]+/).filter(Boolean).map((w) => w[0].toUpperCase() + w.slice(1)).join('');

export function validate(code, tokens, contract = null, components = [], { from = [] } = {}) {
  const have = new Map(components.map((c) => [String(c).toLowerCase(), c]));
  const byCode = new Map(components.map((c) => [pascal(c), c]));
  const componentFor = (tag, type) => [...(type ? REPLACES[`${tag} ${type}`] || [] : []), ...(REPLACES[tag] || [])].map((n) => have.get(n.toLowerCase())).find(Boolean);
  const out = [];
  const values = [];
  for (const c of Object.values(tokens.collections || {})) {
    const mode = (c.modes || [])[0];
    for (const [n, v] of Object.entries((c.values || {})[mode] || {})) values.push([n, v]);
  }
  const names = new Set(values.map(([n]) => n));
  // a token's name as a CSS variable, as the token build writes it (Color/Text/Neutral/primary → color-text-neutral-primary)
  const vars = new Set(values.map(([n]) => cssName('', n).slice(2)));
  // the library's own families, read off its tokens: only a name in one of them is held to them
  const families = [...new Set(values.filter(([n]) => n.includes('/')).map(([n]) => n.split('/')[0]))];
  const esc = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const named = families.length ? new RegExp(`['"\`]((?:${families.map(esc).join('|')})\\/[^'"\`]+)['"\`]`, 'g') : null;
  const prefixes = families.map((f) => cssFamily(f).slice(2));
  const lines = String(code).split('\n');
  lines.forEach((line, i) => {
    // a comment documents code, it is not code (`<button>` in a JSDoc line)
    if (/^\s*(\/\/|\/\*|\*)/.test(line)) return;
    // a colour written raw
    for (const m of line.matchAll(/#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)/g)) {
      const c = colour(m[0]);
      // fully transparent draws nothing: no token is wanted for it
      if (!c || c[3] === 0) continue;
      const hit = values.find(([, v]) => same(colour(v), c));
      out.push({ kind: 'raw colour', found: m[0], ...(hit && { use: hit[0] }), line: i + 1 });
    }
    // a token named that the library does not have
    if (named) for (const m of line.matchAll(named)) if (!names.has(m[1])) out.push({ kind: 'unknown token', found: m[1], line: i + 1 });
    for (const m of line.matchAll(/var\(--([a-z0-9-]+)/g)) {
      const v = m[1];
      // only a variable named like the library's tokens is held to them (a framework's own is not ours)
      if (prefixes.some((f) => v.startsWith(f)) && !vars.has(v)) out.push({ kind: 'unknown token', found: `var(--${v})`, line: i + 1 });
    }
    // a raw element the library has a component for: lower case in JSX or HTML is the element itself
    if (have.size) for (const m of line.matchAll(/<([a-z]+)\b([^>]*)/g)) {
      const type = (m[2].match(/\btype\s*=\s*["'{]\s*["']?([a-z]+)/) || [])[1];
      // a hidden input carries a value for a form, and is no field anyone sees
      const use = m[1] === 'input' && type === 'hidden' ? null : componentFor(m[1], type);
      if (use) out.push({ kind: 'raw element', found: `<${m[1]}${type ? ` type="${type}"` : ''}>`, use, line: i + 1 });
    }
    // a library component written here instead of taken from the system
    for (const m of line.matchAll(/\b(?:function|class)\s+([A-Z]\w*)|\b(?:const|let|var)\s+([A-Z]\w*)\s*=/g)) {
      const c = byCode.get(m[1] || m[2]);
      if (c) out.push({ kind: 'component copied', found: m[1] || m[2], use: c, line: i + 1 });
    }
    // a contract prop given a value it does not have
    if (contract) for (const [k, p] of Object.entries(contract.props || {})) {
      if (p.type !== 'enum') continue;
      for (const m of line.matchAll(new RegExp(`\\b${k}\\s*=\\s*["'{]\\s*["']?([A-Za-z0-9_-]+)`, 'g'))) {
        if (!p.values.map(String).includes(m[1])) out.push({ kind: 'value not in the contract', found: `${k}="${m[1]}"`, use: p.values.join(' | '), line: i + 1 });
      }
    }
  });
  // a library component imported from somewhere that is not the system: read over the whole code, since a
  // formatter wraps an import over lines; `import type` brings no component, `* as` names none
  // a commented-out import is not code either, as for the lines above: blanked, its newlines kept for the line number
  // one pass that steps over strings, so a `/*` in a glob or a `//` in a URL opens no comment
  const live = String(code).replace(/("(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'|`(?:\\.|[^`\\])*`)|\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, (c, str) => (str ? c : c.replace(/[^\n]/g, ' ')))
    // and a whole-line comment always, should a stray backtick have opened a template above it
    .replace(/^[ \t]*\/\/.*$/gm, '');
  if (from.length) for (const m of live.matchAll(/\b(import|export)\s+(?!type\b)(?:(\w+)\s*,?\s*)?(?:\{([^}]*)\})?\s*from\s*['"]([^'"]+)['"]/g)) {
    const spec = m[4];
    if (from.some((f) => spec.startsWith(f) || spec === f.replace(/\/$/, ''))) continue;
    // both sides of an alias: `Button as B` and `Local as Button` each bring a Button in
    const names = [m[2], ...(m[3] || '').split(',').flatMap((x) => x.trim().replace(/^type\s+.*/, '').split(/\s+as\s+/))].filter(Boolean);
    const line = live.slice(0, m.index).split('\n').length;
    for (const n of new Set(names)) if (byCode.has(n)) out.push({ kind: 'component not from the system', found: `${n} from '${spec}'`, use: from.join(' | '), line });
  }
  return out;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === (() => { try { return realpathSync(process.argv[1]); } catch { return null; } })()) {
  const argv = process.argv.slice(2);
  const opt = (k) => { const i = argv.indexOf(k); return i >= 0 ? argv.splice(i, 2)[1] : null; };
  const docs = (opt('--docs') || process.env.DOCS_URL || '').replace(/\/$/, ''), api = opt('--api'), component = opt('--component');
  // --json: the findings as data, each with its file, for a caller that weighs them (project-check's gate)
  const asJson = argv.includes('--json') && argv.splice(argv.indexOf('--json'), 1);
  const from = []; for (let f; (f = opt('--from'));) from.push(f);
  const files = argv;
  if (!files.length || !(docs || api)) { console.error('usage: validate.mjs <file>… (--docs <docs site URL> | --api <built api folder>) [--component <name>] [--from <import prefix>]… [--json]'); process.exit(2); }
  // the built site's own files (a push gate, no service running) or the served site
  const get = api ? async (p) => JSON.parse(fs.readFileSync(path.join(api, p), 'utf8'))
    : async (p) => { const r = await fetch(`${docs}/api/${p}`); if (!r.ok) throw new Error(`${docs}/api/${p} answered ${r.status}`); return r.json(); };
  const tokens = await get('tokens.json');
  const { components: pages } = await get('index.json');
  let contract = null;
  if (component) {
    const page = pages.find((p) => p.slug === component.toLowerCase() || p.title.toLowerCase() === component.toLowerCase());
    if (!page) { console.error(`no component "${component}"`); process.exit(2); }
    contract = Object.values((await get(`components/${page.slug}.json`)).contracts || {})[0] || null;
  }
  let n = 0;
  const all = [];
  for (const file of files) {
    const found = validate(fs.readFileSync(file, 'utf8'), tokens, contract, pages.map((p) => p.title), { from });
    if (asJson) all.push(...found.map((f) => ({ file, ...f })));
    else for (const f of found) console.log(`${file}:${f.line}  ${f.kind}: ${f.found}${f.use ? `  → ${f.use}` : ''}`);
    n += found.length;
  }
  if (asJson) { console.log(JSON.stringify(all)); process.exit(n ? 1 : 0); }
  console.log(n ? `${n} finding(s) in ${files.length} file(s)` : `clean (${files.length} file(s)): every colour a token, every token, value and component the library has`);
  process.exit(n ? 1 : 0);
}
