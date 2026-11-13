// node tools/toolkit-check/test-research-index.mjs — research-index.mjs finds an article missing
// from the page, one the page lists without a file, and one edited after the page was written.
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { differences } from './research-index.mjs';

const root = mkdtempSync(join(tmpdir(), 'research-index-'));
const page = (articles) => writeFileSync(join(root, 'index.html'), `<script>\nconst DATA = ${JSON.stringify({ articles })};\n</script>\n`);
try {
  mkdirSync(join(root, 'foundations'));
  mkdirSync(join(root, '_archive', 'old'), { recursive: true });
  writeFileSync(join(root, 'foundations', 'a.md'), '# A\n');
  writeFileSync(join(root, 'foundations', 'README.md'), 'not an article');
  writeFileSync(join(root, '_archive', 'old', 'x.md'), 'archived');
  page([{ topic: 'foundations', slug: 'a', md: '# A\n' }]);
  assert.deepEqual(differences(root), [], 'in step: README and _archive are not articles');

  writeFileSync(join(root, 'foundations', 'b.md'), '# B\n');
  assert.match(differences(root).join('\n'), /foundations\/b\.md is missing/);

  page([{ topic: 'foundations', slug: 'a', md: '# old A\n' }, { topic: 'foundations', slug: 'b', md: '# B\n' }, { topic: 'foundations', slug: 'gone', md: '' }]);
  const out = differences(root).join('\n');
  assert.match(out, /a\.md was edited/);
  assert.match(out, /lists foundations\/gone/);
  page([{ topic: 'foundations', slug: 'a', md: '# A\n' }, { topic: 'other', slug: 'a', md: '' }, { topic: 'foundations', slug: 'b', md: '# B\n' }]);
  assert.match(differences(root).join('\n'), /slug a twice/);
  console.log('research-index: 4 cases pass');
} finally { rmSync(root, { recursive: true, force: true }); }
