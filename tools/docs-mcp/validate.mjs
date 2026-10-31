#!/usr/bin/env node
/*
 * tools/docs-mcp/validate.mjs — generated code checked against one project's
 * published tokens and, where named, a component's contract. The docs MCP's
 * `validate` tool calls it; as a command it is a hook an agent's output runs
 * through once generation is done:
 *
 *   node tools/docs-mcp/validate.mjs <file> --docs <docs site URL> [--component <name>]
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
 *
 *   validate(code, tokens, contract?, components?) → [{ kind, found, use?, line }]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseColour as colour } from '../parity/values.mjs';
import { cssName, cssFamily } from '../tokens/names.mjs';

import { realpathSync } from 'node:fs';
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

export function validate(code, tokens, contract = null, components = []) {
  const have = new Map(components.map((c) => [String(c).toLowerCase(), c]));
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
      const use = componentFor(m[1], type);
      if (use) out.push({ kind: 'raw element', found: `<${m[1]}${type ? ` type="${type}"` : ''}>`, use, line: i + 1 });
    }
    // a contract prop given a value it does not have
    if (contract) for (const [k, p] of Object.entries(contract.props || {})) {
      if (p.type !== 'enum') continue;
      for (const m of line.matchAll(new RegExp(`\\b${k}\\s*=\\s*["'{]\\s*["']?([A-Za-z0-9_-]+)`, 'g'))) {
        if (!p.values.map(String).includes(m[1])) out.push({ kind: 'value not in the contract', found: `${k}="${m[1]}"`, use: p.values.join(' | '), line: i + 1 });
      }
    }
  });
  return out;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === realpathSync(process.argv[1])) {
  const argv = process.argv.slice(2);
  const opt = (k) => { const i = argv.indexOf(k); return i >= 0 ? argv.splice(i, 2)[1] : null; };
  const docs = (opt('--docs') || process.env.DOCS_URL || '').replace(/\/$/, ''), component = opt('--component');
  const [file] = argv;
  if (!file || !docs) { console.error('usage: validate.mjs <file> --docs <docs site URL> [--component <name>]'); process.exit(2); }
  const get = async (p) => { const r = await fetch(`${docs}/api/${p}`); if (!r.ok) throw new Error(`${docs}/api/${p} answered ${r.status}`); return r.json(); };
  const tokens = await get('tokens.json');
  const { components: pages } = await get('index.json');
  let contract = null;
  if (component) {
    const page = pages.find((p) => p.slug === component.toLowerCase() || p.title.toLowerCase() === component.toLowerCase());
    if (!page) { console.error(`no component "${component}"`); process.exit(2); }
    contract = Object.values((await get(`components/${page.slug}.json`)).contracts || {})[0] || null;
  }
  const found = validate(fs.readFileSync(file, 'utf8'), tokens, contract, pages.map((p) => p.title));
  for (const f of found) console.log(`${file}:${f.line}  ${f.kind}: ${f.found}${f.use ? `  → ${f.use}` : ''}`);
  console.log(found.length ? `${found.length} finding(s)` : 'clean: every colour a token, every token, value and component the library has');
  process.exit(found.length ? 1 : 0);
}
