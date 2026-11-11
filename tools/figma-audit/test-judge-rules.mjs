// judge-rules.mjs: what the judge is told about each ruling. Run by bin/check.
import { judgeRulings } from './judge-rules.mjs';
let pass = 0, fail = 0;
const ok = (name, c) => { if (c) { pass++; console.log('ok', name); } else { fail++; console.log('FAIL', name); } };
const [a, b, c] = judgeRulings([
  { text: 'Keep the fill', why: 'Recorded from the audit dashboard, on Button, about: raw fill.' },
  { text: 'Elevation stays one axis', why: 'figma-standard rule 19 wants one case per name space on the elevation axis' },
  { text: 'Plain', why: '' }]);
ok('Audit lite\'s sentence names its component too', /recorded on Chip/.test(judgeRulings([{ text: 't', why: 'Recorded from Audit lite, on Chip, about: c.' }])[0]));
ok('the dashboard\'s sentence names the component and the finding', /recorded on Button about “raw fill”/.test(a));
ok('a hand-written Why with "on" in it names no component', b === 'Elevation stays one axis');
ok('a ruling with no Why is its text', c === 'Plain');
console.log(`${pass}/${pass + fail} passed`);
process.exit(fail ? 1 : 0);
