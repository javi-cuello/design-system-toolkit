// node tools/shared/test-output.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { compareNames, writeReport } from './output.mjs';

let failed = 0;
const ok = (name, cond) => { console.log(`${cond ? 'ok  ' : 'FAIL'} ${name}`); if (!cond) failed++; };

// a machine set to Swedish sorts ä after z with no locale named; the pinned order does not follow it
const sorted = (locale) => execFileSync(process.execPath, ['--input-type=module', '-e', `import { compareNames } from ${JSON.stringify(new URL('./output.mjs', import.meta.url).href)}; console.log(['z', 'ä', 'a'].sort(compareNames).join(''))`], { env: { ...process.env, LC_ALL: locale }, encoding: 'utf8' }).trim();
ok('names sort in one order, whatever the machine\'s locale', sorted('sv_SE.UTF-8') === 'aäz' && sorted('en_US.UTF-8') === 'aäz');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'output-'));
const file = path.join(dir, 'report.json');
ok('a first report is written', writeReport(file, { at: '2026-01-01', seconds: 3, verdict: 'same' }));
ok('a report changed only in its date and seconds is not', !writeReport(file, { at: '2026-01-02', seconds: 9, verdict: 'same' }) && JSON.parse(fs.readFileSync(file, 'utf8')).at === '2026-01-01');
ok('a changed result is written, with its date', writeReport(file, { at: '2026-01-03', seconds: 4, verdict: 'differs' }) && JSON.parse(fs.readFileSync(file, 'utf8')).at === '2026-01-03');
fs.rmSync(dir, { recursive: true });
process.exit(failed ? 1 : 0);
