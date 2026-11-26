// projects.cjs's §6 reader and writer over the context template and a filled log. Run by bin/check.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const { appendRuling, removeRuling, rulingsOf, textKey } = createRequire(import.meta.url)('./projects.cjs');
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
{
  let full = template, msg = '';
  for (let i = 0; i < 26; i++) full = appendRuling(full, 'r' + i, 'C' + i, '2026-12-01');
  try { appendRuling(full, 'one more', 'C', '2026-12-01'); } catch (e) { msg = e.message; }
  ok('a day takes 26 rulings, 2026-12-01 to 2026-12-01z; the 27th is refused by name, never dated undefined', /26 date cells already taken or held on 2026-12-01/.test(msg) && full.includes('2026-12-01z') && !full.includes('undefined'));
}
{
  const two = appendRuling(appendRuling(template, 'Keep the fill', 'Button', '2026-11-11'), 'a | b', 'Chip', '2026-11-11');
  const back = removeRuling(two, 'a | b');
  ok('a ruling taken back leaves the others and the table, and reads as before it', back !== null && rulingsOf(back).map((x) => x.text).join() === 'Keep the fill' && back === appendRuling(template, 'Keep the fill', 'Button', '2026-11-11'));
  ok('taking back a ruling the log does not hold changes nothing', removeRuling(two, 'not there') === null);
  const byHand = two.replace(/\| 2026-11-11 \|([^|]*)\| Keep the fill \|[^|]*\|/, '| 2026-11-11 |$1| Keep the fill | Decided in review |');
  ok('a ruling written by hand is never taken back', byHand !== two && removeRuling(byHand, 'Keep the fill') === null);
}
{
  // the same ruling recorded on two components: taking it back on one leaves the other's, which still closes its row
  const two = appendRuling(appendRuling(template, 'Keep the fill', 'Button', '2026-11-11'), 'Keep the fill', 'Chip, about: raw fill', '2026-11-11');
  const back = removeRuling(two, 'Keep the fill', 'Button');
  ok('taken back on one component, the same ruling on another stays', back !== null && rulingsOf(back).map((x) => x.why).join() === 'Recorded from the audit dashboard, on Chip, about: raw fill.');
  ok('…and its `about` does not hide the component it was recorded on', removeRuling(two, 'Keep the fill', 'Chip') === appendRuling(template, 'Keep the fill', 'Button', '2026-11-11'));
  ok('a component that is a prefix of another is not it', removeRuling(appendRuling(template, 'Keep the fill', 'Button group', '2026-11-11'), 'Keep the fill', 'Button') === null);
  ok('with no component named, every row the dashboard wrote with that ruling goes, as before', rulingsOf(removeRuling(two, 'Keep the fill') || '').length === 0);
  const one = appendRuling(template, 'Keep the fill', 'Button', '2026-11-11'), struck = one.replace('| Keep the fill |', '| ~~Keep the fill~~ |');
  ok('a struck row the dashboard wrote is never taken back', struck !== one && removeRuling(struck, '~~Keep the fill~~', 'Button') === null && removeRuling(struck, 'Keep the fill', 'Button') === null && removeRuling(struck, 'Keep the fill') === null);
  const mixed = appendRuling(template, 'Keep the fill', 'Button', '2026-11-11').replace(/(\| Recorded from the audit dashboard, on Button\. \|.*)$/m, '$1\n| 2026-11-10 | Audit | Keep the fill | Decided in review | Maintainer |  |  |');
  const left = removeRuling(mixed, 'Keep the fill', 'Button');
  ok('the same ruling by hand and by the dashboard: only the dashboard\'s goes', left !== null && rulingsOf(left).map((x) => x.why).join() === 'Decided in review');
}
for (const text of ['use `foo for x', 'a \\| b', 'a \\ b `c` | d']) {
  // a backtick, a backslash and a pipe in what was typed: the row splits where it was written, and reads back as typed
  const md = appendRuling(template, text, 'Button `x', '2026-11-11');
  const r = rulingsOf(md);
  ok(`${JSON.stringify(text)} reads back as typed, its Why whole`, r.length === 1 && r[0].key === textKey(text) && r[0].text === text && r[0].why === 'Recorded from the audit dashboard, on Button `x.');
  ok(`${JSON.stringify(text)} recorded then taken back leaves the document as before`, removeRuling(md, text, 'Button `x') === template);
}
{
  // a date a row still holds (its take-back removed the line, its reopen failed) is not given to the next ruling that day
  const one = appendRuling(template, 'First', 'Button', '2026-11-11');
  const held = appendRuling(template, 'Second', 'Chip', '2026-11-11', ['2026-11-11']);
  ok('a held date cell is skipped: the next ruling that day takes the next letter', rulingsOf(one)[0].date === '2026-11-11' && rulingsOf(held)[0].date === '2026-11-11b', rulingsOf(held).map((r) => r.date).join());
}
console.log(`${pass}/${pass + fail} passed`);
process.exit(fail ? 1 : 0);
