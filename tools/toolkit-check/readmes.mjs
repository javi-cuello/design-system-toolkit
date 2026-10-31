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
 * link resolving. The `skills/`, `plugins/` and `tools/` READMEs are indexes,
 * and an index links every folder beside it, so a new one cannot go unlisted;
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

/** Problems with one README's text; `runs` asks for a command in a code block, `imports` for a plugin's import step. */
// every link's target in a text's prose (no fenced or inline code, no comments, no images): `<a b.md>` and
// `x.md "title"` forms read, the #anchor dropped, %20 decoded; an anchor-only link gives nothing
export function hrefs(text) {
  const prose = text.replace(/(```|~~~)[\s\S]*?\1/g, '').replace(/<!--[\s\S]*?-->/g, '').replace(/`[^`\n]*`/g, '');
  return [...prose.matchAll(/(!?)\[[^\]]*\]\((?:<([^>]+)>|([^)\s]+))/g)].filter((m) => !m[1])
    .map((m) => { const h = (m[2] || m[3]).replace(/#.*$/, ''); try { return decodeURI(h); } catch { return h; } }).filter(Boolean);
}

export function problems(text, { runs = false, imports = false, dir = '.', root = '.' } = {}) {
  const out = [];
  const lines = text.split('\n');
  if (!/^# \S/.test(lines[0] || '')) out.push('the first line is not a `# ` title');
  const lead = lines.slice(1).find((l) => l.trim() !== '');
  if (!lead || /^(#|```|\||- |\* |\d+\. )/.test(lead.trim())) out.push('no lead paragraph under the title saying what this is for');
  if (runs && !/```[a-z]*\n[\s\S]*?\n```|^ {4}\S/m.test(text)) out.push('nothing to copy: no command in a code block');
  if (imports && !/manifest\.json/.test(text)) out.push('no import step: say how to import it from its manifest.json');
  for (const href of hrefs(text)) {
    if (/^[a-z]+:/i.test(href) || href.startsWith('/')) continue;
    if (!existsSync(resolve(root, dir, decodeURI(href)))) out.push(`a link does not resolve: ${href}`);
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
