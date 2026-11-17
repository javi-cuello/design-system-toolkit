// node tools/toolkit-check/test-research-index.mjs — research-index.mjs finds an article missing
// from the page, one the page lists without a file, one edited after the page was written, a
// missing or malformed researched or updated date, a sub-topic its topic does not list, an
// updated date older than the file's last change in git, and an article updated after the length
// rule came in that runs past 20 minutes.
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { differences } from './research-index.mjs';

const root = mkdtempSync(join(tmpdir(), 'research-index-'));
const D = { researched: '2026-11-12', updated: '2026-11-13' };
const page = (articles, topics) => writeFileSync(join(root, 'index.html'), `<script>\nconst DATA = ${JSON.stringify({ topics, articles: articles.map((a) => ({ ...D, ...a })) })};\n</script>\n`);
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
  page([{ topic: 'foundations', slug: 'a', md: '# A\n', researched: 'November 2026', updated: '' }, { topic: 'foundations', slug: 'b', md: '# B\n', researched: '2026-11-14', updated: '2026-11-13' }]);
  const dates = differences(root).join('\n');
  assert.match(dates, /a: researched is "November 2026"/);
  assert.match(dates, /a: updated is ""/);
  assert.match(dates, /b: updated 2026-11-13 is before researched 2026-11-14/);
  page([{ topic: 'foundations', slug: 'a', md: '# A\n', researched: '2026-13' }, { topic: 'foundations', slug: 'b', md: '# B\n', researched: '2026-10/2026-08' }]);
  const bad = differences(root).join('\n');
  assert.match(bad, /a: researched is "2026-13"/);
  assert.match(bad, /b: researched is "2026-10\/2026-08"/);
  page([{ topic: 'foundations', slug: 'a', md: '# A\n', researched: '2026-08/2026-10' }, { topic: 'foundations', slug: 'b', md: '# B\n', researched: '2026-08' }]);
  assert.deepEqual(differences(root), [], 'a month and a span of months are accepted');
  const topics = [{ id: 'foundations', subtopics: ['Type', 'Colour'] }];
  page([{ topic: 'foundations', slug: 'a', md: '# A\n', subtopic: 'Type' }, { topic: 'foundations', slug: 'b', md: '# B\n' }], topics);
  assert.match(differences(root).join('\n'), /b: subtopic "" is not one of foundations's: Type, Colour/);
  page([{ topic: 'foundations', slug: 'a', md: '# A\n', subtopic: 'Type' }, { topic: 'foundations', slug: 'b', md: '# B\n' }]);
  assert.match(differences(root).join('\n'), /a: has subtopic "Type", but foundations lists none/);
  page([{ topic: 'foundations', slug: 'a', md: '# A\n' }, { topic: 'foundations', slug: 'b', md: '# B\n' }]);
  assert.match(differences(root, (k) => (k === 'foundations/a' ? '2026-11-17' : null)).join('\n'), /a: last changed 2026-11-17, but updated still says 2026-11-13/);
  writeFileSync(join(root, 'foundations', 'a.md'), 'word '.repeat(4761));
  page([{ topic: 'foundations', slug: 'a', md: 'word '.repeat(4761), updated: '2026-11-18' }, { topic: 'foundations', slug: 'b', md: '# B\n' }]);
  assert.match(differences(root).join('\n'), /a: updated 2026-11-18 and 4761 words, over 20 minutes/);
  page([{ topic: 'foundations', slug: 'a', md: 'word '.repeat(4761), updated: '2026-11-17' }, { topic: 'foundations', slug: 'b', md: '# B\n' }]);
  assert.deepEqual(differences(root), [], 'an article last updated before the rule is not held to it');
  console.log('research-index: 12 cases pass');
} finally { rmSync(root, { recursive: true, force: true }); }
