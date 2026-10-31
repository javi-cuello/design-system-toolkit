// node tools/shared/test-real-path.mjs — paths compare by their on-disk spelling.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { realPath, samePath } from './real-path.mjs';

const box = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'real-path-')));
const dir = path.join(box, 'Projects');
fs.mkdirSync(dir);
const caseInsensitive = fs.existsSync(path.join(box, 'projects'));
let n = 0;
if (caseInsensitive) {
  assert.equal(realPath(path.join(box, 'projects')), dir); n++;
  assert.ok(samePath(path.join(box, 'projects'), dir)); n++;
}
assert.ok(samePath(path.join(dir, '..', 'Projects'), dir)); n++;
assert.equal(realPath('~'), fs.realpathSync.native(os.homedir())); n++;
assert.ok(!samePath(dir, path.join(box, 'Other'))); n++;
assert.equal(realPath(path.join(box, 'missing')), path.join(box, 'missing')); n++;
fs.rmSync(box, { recursive: true });
console.log(`${n} passed${caseInsensitive ? '' : ' (case-sensitive filesystem: the case checks did not run)'}`);
