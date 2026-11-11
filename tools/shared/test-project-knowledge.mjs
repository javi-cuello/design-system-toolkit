// tools/shared/project-knowledge.cjs over a throwaway project folder. Run by bin/check.
import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
const { read } = createRequire(import.meta.url)('./project-knowledge.cjs');
let pass = 0, fail = 0;
const ok = (name, c) => { if (c) { pass++; console.log('ok', name); } else { fail++; console.log('FAIL', name); } };

const bare = mkdtempSync(join(tmpdir(), 'pk-'));
writeFileSync(join(bare, 'design-system-context.md'), '# X\n');
const b = read(bare);
ok('a project with only its context document reads: no product, no decisions, no guidance', b.product === null && b.decisions.length === 0 && b.guidance.length === 0);
ok('a folder with no context document reads empty rather than throwing', read(join(bare, 'nope')).decisions.length === 0);

const full = mkdtempSync(join(tmpdir(), 'pk-'));
writeFileSync(join(full, 'design-system-context.md'), ['# X', '', '## 6 · Rulings log', '',
  '| Date | Scope | Ruling | Why | Decided by | Confirms or overrides | Checked by |', '|---|---|---|---|---|---|---|',
  '| 2026-08-04 | Web | Five cells | because | Maintainer |',
  '| 2026-11-10 | Screen | ~~Old header~~ | retired 2026-11-11: gone | Maintainer | | |',
  '| 2026-11-11 | Pattern | Sort in the toolbar | headers too small | Maintainer | overrides `knowledge/ui/patterns/tables.md` | eval add-employee |', '',
  '## 7 · Open items', '', '| Item | Ruling |', '|---|---|', '| not a decision | x |', ''].join('\n'));
writeFileSync(join(full, 'product-context.md'), '# Product — X\n');
mkdirSync(join(full, 'guidance'));
writeFileSync(join(full, 'guidance', 'tables.md'), '# Tables — X\n');
writeFileSync(join(full, 'guidance', 'layout.md'), '# Layout — X\n');
writeFileSync(join(full, 'guidance', 'notes.txt'), 'not a page');
const f = read(full);
ok('the product file is served whole', f.product === '# Product — X\n');
ok('live decisions only: a struck one is dead, a later section\'s table is not §6',
  JSON.stringify(f.decisions.map((d) => d.decision)) === JSON.stringify(['Five cells', 'Sort in the toolbar']));
ok('the two optional columns are read by header, "" on a five-cell row',
  f.decisions[1].confirmsOrOverrides === 'overrides `knowledge/ui/patterns/tables.md`' && f.decisions[1].checkedBy === 'eval add-employee' && f.decisions[0].checkedBy === '' && f.decisions[0].decidedBy === 'Maintainer');
ok('guidance pages by topic, sorted, markdown only', JSON.stringify(f.guidance.map((g) => g.topic)) === JSON.stringify(['layout', 'tables']));
console.log(`${pass}/${pass + fail} passed`);
process.exit(fail ? 1 : 0);
