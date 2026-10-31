// The README check (tools/toolkit-check/readmes.mjs), proved in both directions on a
// throwaway tree. Run: node tools/toolkit-check/test-readmes.mjs
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { check, problems, required, hrefs, anchors } from './readmes.mjs';

let failed = 0, passed = 0;
const ok = (name, cond) => { if (cond) passed++; else { failed++; console.log(`FAIL ${name}`); } };

const root = mkdtempSync(join(tmpdir(), 'readmes-'));
const write = (p, s) => { mkdirSync(join(root, p, '..'), { recursive: true }); writeFileSync(join(root, p), s); };
const good = (cmd) => `# Thing\n\nWhat this folder is for.\n\n${cmd ? '```sh\nnode run.mjs\n```\n' : ''}See [the root](../README.md).\n`;

mkdirSync(join(root, 'tools/alpha'), { recursive: true });
mkdirSync(join(root, 'plugins/beta'), { recursive: true });
mkdirSync(join(root, 'skills/gamma'), { recursive: true });
ok('the root, each top-level folder and each tool and plugin need one; a skill does not',
  JSON.stringify(required(root)) === JSON.stringify(['.', 'skills', 'plugins', 'tools', 'tools/alpha', 'plugins/beta']));

let found = check(root);
ok('a missing README is named', found.includes('tools/alpha: no README.md') && found.includes('.: no README.md'));

write('README.md', '# Root\n\nThe repo.\n');
write('skills/README.md', '# skills\n\nWhat is here: [gamma](gamma/SKILL.md).\n');
write('plugins/README.md', '# plugins\n\nWhat is here: [beta](beta/README.md).\n');
write('tools/README.md', '# tools\n\nWhat is here: [alpha](alpha/README.md).\n');
write('skills/gamma/SKILL.md', '# gamma\n');
write('tools/alpha/README.md', good(true).replace('../README.md', '../../README.md'));
write('plugins/beta/README.md', good(false).replace('../README.md', '../../README.md').replace('What this folder is for.', 'What this plugin does. Import it from its manifest.json.'));
ok('a conforming tree passes', check(root).length === 0);

mkdirSync(join(root, 'tools/delta'), { recursive: true }); write('tools/delta/README.md', good(true).replace('../README.md', '../../README.md'));
ok('an index that misses a folder names it', check(root).some((p) => /index does not link delta\//.test(p)));
rmSync(join(root, 'tools/delta'), { recursive: true });

write('knowledge/README.md', '# Knowledge\n\nWhat the toolkit knows.\n\n| Folder | Holds |\n|---|---|\n| `code/` | `tokens.md`, `accessibility.md` |\n| `ui/patterns/` | Data grid |\n| `ui/design/` | `visual.md` |\n');
write('knowledge/code/tokens.md', '# Tokens\n'); write('knowledge/code/accessibility.md', '# A11y\n'); write('knowledge/ui/patterns/data-grid.md', '# Data grid\n'); write('knowledge/ui/design/visual.md', '# Visual\n');
ok('a knowledge index naming each page, by file or by its words, passes', !check(root).some((p) => p.startsWith('knowledge/')));
write('knowledge/ui/patterns/stepper.md', '# Stepper\n');
ok('a knowledge page the index does not name is named', check(root).some((p) => p === 'knowledge/README.md: the index does not name ui/patterns/stepper.md'));
write('knowledge/ui/patterns/data.md', '# Data\n');
ok('a page whose name is only part of another item is not named', check(root).some((p) => p === 'knowledge/README.md: the index does not name ui/patterns/data.md'));
rmSync(join(root, 'knowledge/ui/patterns/data.md'));
write('knowledge/ui/design/accessibility.md', '# A11y\n');
ok('a page named only in another folder\'s row is not named', check(root).some((p) => p === 'knowledge/README.md: the index does not name ui/design/accessibility.md'));
rmSync(join(root, 'knowledge'), { recursive: true });
ok('a title is required', problems('Thing\n\nWhat.\n').some((p) => /title/.test(p)));
ok('a lead paragraph is required, not a list', problems('# Thing\n\n- a list\n').some((p) => /lead paragraph/.test(p)));
ok('a tool needs a command to copy', problems('# Thing\n\nWhat.\n', { runs: true }).some((p) => /nothing to copy/.test(p)));
ok('a plugin needs its import step', problems('# P\n\nWhat.\n', { imports: true }).some((p) => /import step/.test(p)));
ok('an indented command counts', problems('# Thing\n\nWhat.\n\n    node x.mjs\n', { runs: true }).length === 0);
write('tools/alpha/README.md', good(true).replace('../README.md', 'missing.md'));
ok('a broken relative link is named', check(root).some((p) => /does not resolve: missing\.md/.test(p)));
ok('a URL is not checked as a file, and an anchor to a heading on the page resolves', problems('# T\n\nSee [x](https://example.com) and [y](#here).\n\n## Here\n').length === 0);

write('docs/README.md', '# Docs\n\nGuides.\n\n[setup](setup.md)\n'); write('docs/setup.md', '# Setup\n\nHow to set up.\n\nSee [tools](../tools/README.md).\n');
ok('a docs page the index links, with a title, a lead and links that resolve, passes', !check(root).some((p) => p.startsWith('docs/')));
write('docs/fits.md', '# Fits\n\nHow.\n\n[x](../nope.md)\n');
found = check(root);
ok('a docs page the index does not link is named', found.includes('docs/README.md: the index does not link fits.md'));
ok('a docs page\'s broken link is named, read from its own folder', found.includes('docs/fits.md: a link does not resolve: ../nope.md'));
rmSync(join(root, 'docs/fits.md'));
write('docs/README.md', '# Docs\n\nGuides.\n\n[setup](./setup.md#setup) and [x](guides/x.md)\n'); write('docs/guides/x.md', '# X\n\nA nested guide.\n\n[setup](../setup.md)\n');
ok('a nested docs page reads its links from its own folder; ./ and an #anchor still count as the index linking it', !check(root).some((p) => p.startsWith('docs/')));
write('docs/guides/x.md', '# X\n\nA nested guide.\n\n[setup](setup.md)\n');
ok('a nested page\'s link read from docs/ instead of its own folder is named', check(root).includes('docs/guides/x.md: a link does not resolve: setup.md'));
write('docs/README.md', '# Docs\n\nGuides.\n\n[setup](setup.md)\n\n```\n[x](guides/x.md)\n```\n');
ok('a link inside a code block is not the index linking a page', check(root).includes('docs/README.md: the index does not link guides/x.md'));
rmSync(join(root, 'docs'), { recursive: true });
write('CONTRIBUTING.md', '# Contributing\n\nHow to change it.\n\nSee [tools](tools/README.md).\n');
ok('a conforming CONTRIBUTING.md passes, its links read from the root', !check(root).some((p) => p.startsWith('CONTRIBUTING.md')));
write('CONTRIBUTING.md', '# Contributing\n\n- straight into a list, and [x](nope.md)\n');
found = check(root);
ok('CONTRIBUTING.md needs a lead paragraph', found.some((p) => p.startsWith('CONTRIBUTING.md: no lead paragraph')));
ok('CONTRIBUTING.md\'s broken link is named', found.includes('CONTRIBUTING.md: a link does not resolve: nope.md'));

ok('a link in angle brackets or with a title is read as its file', JSON.stringify(hrefs('[a](<my guide.md>) [b](x.md "t") [c](y%20z.md#h)')) === JSON.stringify(['my guide.md', 'x.md', 'y z.md']));
ok('an image, inline code, a ~~~ fence and a comment link nothing', hrefs('![i](a.md) `[b](b.md)` <!-- [c](c.md) -->\n~~~\n[d](d.md)\n~~~\n').length === 0);
ok('anchor-only, URL and mailto links name no file; a %25 in a name is decoded once, not thrown', problems('# T\n\nL.\n\n[a](#t) [b](https://x/y) [c](mailto:a@b)\n', { root }).length === 0 && hrefs('[a](#h)').length === 0 && problems('# T\n\nL.\n\n[d](100%25.md)\n', { root }).some((p) => p.endsWith('100%.md')));

// anchors (the review of 2026-10-31: the #part was dropped, so a link to a renamed heading passed)
ok('an anchor to no heading on the page is named', problems('# T\n\nL.\n\n[a](#gone)\n').includes("a link's anchor is not a heading there: #gone"));
write('docs/a.md', '# A\n\nA page.\n\n## Moving a keys.conf from the old `set-key`\n\n## Notes\n\n## Notes\n\n<a id="kept"></a>\n');
ok('an anchor into another page is held to its headings, as GitHub spells them, repeats numbered, explicit ids kept',
  problems('# T\n\nL.\n\n[a](a.md#moving-a-keysconf-from-the-old-set-key) [b](a.md#notes-1) [c](a.md#kept) [d](a.md#Notes)\n', { dir: 'docs', root }).length === 0);
ok('an anchor into another page that has no such heading is named', problems('# T\n\nL.\n\n[a](a.md#nope)\n', { dir: 'docs', root }).includes("a link's anchor is not a heading there: a.md#nope"));
ok('an anchor into a code file is not read', problems('# T\n\nL.\n\n[a](a.js#L12)\n', { dir: 'docs', root: (write('docs/a.js', ''), root) }).length === 0);
{ const a = anchors('# T\n\n## The _real_ thing\n\n## A &amp; B\n\n## my_var\n\nSetext\n------\n\n<a id="Kept"></a>\n');
  ok('emphasis and entities drop out of a slug, an _ inside a word stays, a setext heading and a capitalised id count',
    ['the-real-thing', 'a--b', 'my_var', 'setext', 'kept'].every((x) => a.has(x))); }
ok('a link to a capitalised explicit id resolves', problems('# T\n\nL.\n\n[a](#Kept)\n\n<a id="Kept"></a>\n').length === 0);
ok('a heading inside a fence is not an anchor', !anchors('# T\n\n````md\n## Inside\n````\n').has('inside'));
rmSync(join(root, 'docs'), { recursive: true });

// fences of any length, and reference-style links
// one inner ``` line, as a page showing how to open a fence has: a ``` closes nothing a ```` opened
ok('a ```` fence holding a ``` line hides everything inside it', hrefs('# T\n\n````md\n```sh\n[gone](gone.md)\n````\n\n[kept](kept.md)\n').join() === 'kept.md');
ok('a fence left open hides the rest of the page', hrefs('# T\n\n```\n[a](a.md)\n').length === 0);
ok('a reference-style link is read from its definition, a footnote is not', hrefs('See [the guide][g] and [^1].\n\n[g]: guide.md#top\n[^1]: a note\n[u]: <my page.md>\n').join() === 'guide.md,my page.md');
ok('a broken reference-style link is named', problems('# T\n\nL, [x][x].\n\n[x]: nope.md\n', { root }).includes('a link does not resolve: nope.md'));
ok('a broken link with a title is still named', problems('# T\n\nLead.\n\n[x](nope.md "t")\n', { root }).some((p) => /does not resolve: nope\.md/.test(p)));

rmSync(root, { recursive: true, force: true });
console.log(`${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
