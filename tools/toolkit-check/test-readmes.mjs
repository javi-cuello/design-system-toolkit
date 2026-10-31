// The README check (tools/toolkit-check/readmes.mjs), proved in both directions on a
// throwaway tree. Run: node tools/toolkit-check/test-readmes.mjs
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { check, problems, required } from './readmes.mjs';

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
ok('a URL and an anchor are not checked as files', problems('# T\n\nSee [x](https://example.com) and [y](#here).\n').length === 0);

rmSync(root, { recursive: true, force: true });
console.log(`${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
