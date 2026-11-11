// projects.cjs's §6 reader and writer over the context template and a filled log. Run by bin/check.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const { appendRuling, rulingsOf } = createRequire(import.meta.url)('./projects.cjs');
let pass = 0, fail = 0;
const ok = (name, c) => { if (c) { pass++; console.log('ok', name); } else { fail++; console.log('FAIL', name); } };
const template = readFileSync(new URL('../../skills/figma-context-capture/assets/context-template.md', import.meta.url), 'utf8');
ok('the template\'s placeholder row is no ruling', rulingsOf(template).length === 0);
let md = appendRuling(template, 'Keep the fill', 'Button', '2026-11-11');
ok('a fresh log takes its first ruling under the table', rulingsOf(md).map((r) => r.text).join() === 'Keep the fill');
md = appendRuling(md, 'Second', 'Chip\n## 7 · Injected', '2026-11-11');
const r = rulingsOf(md);
ok('a day\'s second ruling is lettered', r.map((x) => x.date).join() === '2026-11-11,2026-11-11b');
ok('a newline in a cell never splits the row or writes a line of its own', !/^## 7 · Injected/m.test(md) && /on Chip ## 7 · Injected\./.test(r[1].why));
ok('a pipe in a ruling is escaped and reads back whole', rulingsOf(appendRuling(md, 'a | b', 'X', '2026-11-12')).some((x) => x.text === 'a | b'));
ok('a document with no rulings table is refused', appendRuling('# X\n', 'y', 'z', '2026-11-11') === null);
console.log(`${pass}/${pass + fail} passed`);
process.exit(fail ? 1 : 0);
