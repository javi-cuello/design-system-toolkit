// twins.mjs: a scaffold copy is compared body and all, and a licensed tree is
// not the project's own code. Run by bin/check.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mixins, ownCode } from './twins.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(HERE, '../../skills/frontend-build/assets/design-system-scaffold/design-system/base/_hairline.sass'), 'utf8');
const want = mixins(source);

// A copy in SCSS under its own token names, with its own comments: the same.
const scss = `// a project's own words\n@use 'sass:math';\n@mixin below($width: var(--stroke-1)) {\n  box-shadow: 0 $width 0 0 var(--colour-stroke-neutral-soft); // its token\n}\n`;
assert.equal(mixins(scss), want, 'SCSS copy under other token names reads as the source');
// Indented Sass, the signature split over lines and the mixin indented.
assert.equal(mixins(`  @mixin below(\n    $width: var(--stroke-1)\n  )\n    box-shadow: 0 $width 0 0 var(--stroke-neutral-soft)\n`), want, 'split signature');

// The review's two plants (S10): both passed the names-only comparison.
const inset = scss.replace('0 $width 0 0', 'inset 0 -1px 0 0');
assert.notEqual(mixins(inset), want, 'inset hairline body is listed');
const wide = scss.replace('$width: var(--stroke-1)', '$width: 2px');
assert.notEqual(mixins(wide), want, '$width: 2px default is listed');
assert.equal(mixins('// nothing\n'), '', 'no mixin');
// Round 4: a block comment inside a copy is set aside like a line comment; a
// rule placed before the first @mixin is drift, not invisible.
assert.equal(mixins(scss.replace('box-shadow', '/* why */ box-shadow')), want, 'a block comment is set aside');
assert.notEqual(mixins('.x { color: red }\n' + scss), want, 'a rule before the first @mixin is listed');

// A folder carrying its own licence is someone else's code; a model named
// License.php is not a licence.
const files = ['kirby/LICENSE.md', 'kirby/panel/eslint.config.js', 'kirby/src/Cms/License.php', 'eslint.config.mjs',
  'site/models/License.php', 'assets/fonts/LICENSE-Inter.txt', 'assets/fonts/x.js', 'node_modules/a/b.js'];
assert.deepEqual(ownCode(files), ['eslint.config.mjs', 'site/models/License.php', 'assets/fonts/x.js']);

console.log(`test-twins: ${(readFileSync(new URL(import.meta.url)).toString().match(/^assert\./gm) || []).length} assertions passed`);
