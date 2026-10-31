#!/usr/bin/env node
/*
 * Every folder a newcomer opens says what it is (toolkit-standard §D 22).
 *
 *   node tools/toolkit-check/readmes.mjs [--root <dir>]
 *
 * The folders that need a README.md: the repo root, each top-level folder,
 * and each tool and plugin folder. A skill is exempt — its SKILL.md is its
 * README, and a skill folder carries no other docs (skill-standard §A).
 * Each guide in docs/ and the root's CONTRIBUTING.md are held to the same
 * title, lead and links, and docs/README.md links every guide.
 *
 * What is checked is what a script can see of the consensus (GitHub's "About
 * READMEs", Google's documentation guide, makeareadme.com): a `# ` title on
 * the first line, a lead paragraph under it saying what the folder is for,
 * a copyable command for a tool, the import step for a Figma plugin (it is
 * imported from its manifest.json, never run from a shell), and every relative
 * link resolving, inline or reference-style, with its #anchor a heading on the
 * page it names (as GitHub spells it); a fenced block of any length is code.
 * The `skills/`, `plugins/` and `tools/` READMEs are indexes, and an index links every folder beside it, so a new one cannot go unlisted;
 * `knowledge/`'s names every page under it.
 * Whether the words help a newcomer is a read.
 */
import { existsSync, readdirSync, readFileSync, statSync, realpathSync } from 'node:fs';
import { dirname, join, resolve, posix } from 'node:path';
import { fileURLToPath } from 'node:url';

const TOP = ['bin', 'docs', 'standards', 'knowledge', 'skills', 'plugins', 'tools'];
// the markdown pages under a folder, relative to it, its README aside
const pages = (d, at = '') => readdirSync(join(d, at)).flatMap((n) => statSync(join(d, at, n)).isDirectory() ? pages(d, join(at, n)) : n.endsWith('.md') && !(at === '' && n === 'README.md') ? [join(at, n)] : []);
const dirs = (d) => (existsSync(d) ? readdirSync(d).filter((n) => !n.startsWith('.') && statSync(join(d, n)).isDirectory()) : []);

/** The folders that must carry a README, relative to the root. */
export function required(root) {
  const out = ['.'];
  for (const t of TOP) if (existsSync(join(root, t))) out.push(t);
  for (const t of ['tools', 'plugins']) for (const n of dirs(join(root, t))) if (n !== 'node_modules') out.push(`${t}/${n}`);
  return out;
}

// A fenced block of any length, closed by a fence of its own character at least as long (so a ```` block may
// show a ``` one), or by the end of the text; then comments and inline code. What is left is prose.
const FENCE = /^ {0,3}((`|~)\2{2,})[^\n]*\n[\s\S]*?(?:^ {0,3}\1\2*[ \t]*$|(?![\s\S]))/gm;
const prose = (text) => text.replace(FENCE, '').replace(/<!--[\s\S]*?-->/g, '').replace(/`[^`\n]*`/g, '');
const decode = (h) => { try { return decodeURI(h); } catch { return h; } };

// every link in a text's prose (no images): inline `[a](x.md#h)`, in its `<a b.md>` and `x.md "title"` forms,
// and reference-style, its target on a `[label]: x.md` line (a footnote `[^1]:` is not a link); %20 decoded
export function targets(text) {
  const p = prose(text);
  const inline = [...p.matchAll(/(!?)\[[^\]]*\]\((?:<([^>]+)>|([^)\s]+))/g)].filter((m) => !m[1]).map((m) => m[2] || m[3]);
  const refs = [...p.matchAll(/^ {0,3}\[(?!\^)[^\]]+\]:[ \t]*(?:<([^>]+)>|(\S+))/gm)].map((m) => m[1] || m[2]);
  return [...inline, ...refs].map((h) => { const i = h.indexOf('#'); return { path: decode(i < 0 ? h : h.slice(0, i)), anchor: i < 0 ? null : decode(h.slice(i + 1)) }; });
}

// each link's file, the #anchor dropped; an anchor-only link gives nothing
export function hrefs(text) {
  return targets(text).map((t) => t.path).filter(Boolean);
}

/* The anchors a page has, as GitHub makes them: each heading's text without its markup, lowercased, every
   character but letters, digits, spaces, hyphens and underscores dropped, spaces as hyphens, a repeat
   numbered (-1, -2); and every explicit `id` or `name`, lowercased as a link's anchor is. A heading is an ATX
   `## x` or a setext one, its text over a line of = or -. */
export function anchors(text) {
  const out = new Set(), seen = new Map();
  const body = text.replace(FENCE, '');
  for (const m of body.matchAll(/^ {0,3}#{1,6}[ \t]+(.+?)[ \t]*#*[ \t]*$|^ {0,3}([^\s|>-].*?)[ \t]*\n {0,3}(?:=+|-+)[ \t]*$/gm)) {
    // the rendered text: links to their words, tags, entities, code and emphasis marks gone (an _ inside a word stays)
    const words = (m[1] || m[2]).replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/<[^>]+>/g, '').replace(/&(?:[a-z]+|#\d+);/gi, '')
      .replace(/[`*]/g, '').replace(/(^|[^\p{L}\p{N}_])_+(?=[\p{L}\p{N}])/gu, '$1').replace(/([\p{L}\p{N}])_+(?![\p{L}\p{N}_])/gu, '$1');
    const base = words.toLowerCase().replace(/[^\p{L}\p{N} _-]/gu, '').replace(/ /g, '-');
    const n = seen.get(base) || 0; seen.set(base, n + 1);
    out.add(n ? `${base}-${n}` : base);
  }
  for (const m of body.matchAll(/<[a-z][^>]*\s(?:id|name)="([^"]+)"/gi)) out.add(m[1].toLowerCase());
  return out;
}

/** Problems with one README's text; `runs` asks for a command in a code block, `imports` for a plugin's import step. */
export function problems(text, { runs = false, imports = false, dir = '.', root = '.' } = {}) {
  const out = [];
  const lines = text.split('\n');
  if (!/^# \S/.test(lines[0] || '')) out.push('the first line is not a `# ` title');
  const lead = lines.slice(1).find((l) => l.trim() !== '');
  if (!lead || /^(#|```|\||- |\* |\d+\. )/.test(lead.trim())) out.push('no lead paragraph under the title saying what this is for');
  if (runs && !/```[a-z]*\n[\s\S]*?\n```|^ {4}\S/m.test(text)) out.push('nothing to copy: no command in a code block');
  if (imports && !/manifest\.json/.test(text)) out.push('no import step: say how to import it from its manifest.json');
  for (const { path: href, anchor } of targets(text)) {
    if (/^[a-z]+:/i.test(href) || href.startsWith('/')) continue;
    const file = resolve(root, dir, href);
    if (href && !existsSync(file)) { out.push(`a link does not resolve: ${href}`); continue; }
    // an anchor is held to the page it names, this one or another markdown page; one into code (#L12) is not read
    if (!anchor || (href && (!href.endsWith('.md') || !statSync(file).isFile()))) continue;
    if (!anchors(href ? readFileSync(file, 'utf8') : text).has(anchor.toLowerCase())) out.push(`a link's anchor is not a heading there: ${href}#${anchor}`);
  }
  return out;
}

// the docs guides and CONTRIBUTING.md, held to the README rule beside the READMEs
const guides = (root) => (existsSync(join(root, 'docs')) ? pages(join(root, 'docs')).length : 0) + (existsSync(join(root, 'CONTRIBUTING.md')) ? 1 : 0);

// the relative pages a text links, outside code blocks, without ./, an #anchor or a title
const links = (text) => hrefs(text).filter((h) => !/^[a-z]+:/i.test(h)).map((h) => posix.normalize(h));

export function check(root) {
  const found = [];
  for (const dir of required(root)) {
    const f = join(root, dir, 'README.md');
    if (!existsSync(f)) { found.push(`${dir}: no README.md`); continue; }
    const runs = /^tools\/[^/]+$/.test(dir) && dir !== 'tools/shared';
    const imports = /^plugins\/[^_/][^/]*$/.test(dir);
    const text = readFileSync(f, 'utf8');
    for (const p of problems(text, { runs, imports, dir, root })) found.push(`${dir}/README.md: ${p}`);
    if (['skills', 'plugins', 'tools'].includes(dir)) {
      for (const n of dirs(join(root, dir))) if (n !== 'node_modules' && !text.includes(`](${n}/`)) found.push(`${dir}/README.md: the index does not link ${n}/`);
    }
    // knowledge's index names each page in its folder's row, by its file or its words (data-grid.md as "data grid")
    if (dir === 'knowledge') for (const page of pages(join(root, dir))) {
      const at = page.split('/'), name = at.pop().replace(/\.md$/, '');
      if (!at.length) { found.push(`knowledge/README.md: ${page} sits outside the index's folders`); continue; }
      const row = text.split('\n').find((l) => l.startsWith(`| \`${at.join('/')}/\``)) || '';
      // whole items of what the row holds, so "data grid" does not name data.md
      const items = (row.split('|')[2] || '').toLowerCase().split(/[,`:()]|\band\b/).map((x) => x.trim());
      if (!items.includes(`${name}.md`) && !items.includes(name.replace(/-/g, ' '))) found.push(`knowledge/README.md: the index does not name ${page}`);
    }
    // docs' guides: each a page a newcomer reads (title, lead, links that resolve), each linked from the index
    if (dir === 'docs') for (const page of pages(join(root, dir))) {
      for (const p of problems(readFileSync(join(root, dir, page), 'utf8'), { dir: join(dir, page, '..'), root })) found.push(`docs/${page}: ${p}`);
      if (!links(text).includes(page)) found.push(`docs/README.md: the index does not link ${page}`);
    }
  }
  // the root's CONTRIBUTING.md, which GitHub shows a contributor, is held to the same
  if (existsSync(join(root, 'CONTRIBUTING.md'))) for (const p of problems(readFileSync(join(root, 'CONTRIBUTING.md'), 'utf8'), { root })) found.push(`CONTRIBUTING.md: ${p}`);
  return found;
}

if ((process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url))) {
  const i = process.argv.indexOf('--root');
  const root = i > -1 ? resolve(process.argv[i + 1]) : resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
  const found = check(root);
  for (const f of found) console.log(f);
  console.log(found.length ? `${found.length} README problem(s)` : `${required(root).length} READMEs and ${guides(root)} guides, each with a title, a purpose and working links`);
  process.exit(found.length ? 1 : 0);
}
