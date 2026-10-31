// node tools/shared/test-dialect.mjs — the toolkit's words in a project's dialect, and every copy of the list held to it.
// The doc generator runs in Figma's sandbox and reads nothing outside its skill (skill-standard §A clause H), so it
// keeps a copy of the en-GB→en-US map; the copy drifted (it lacked Organisation and Licence) until this held it.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';

const { say, US } = createRequire(import.meta.url)('./dialect.cjs');
let n = 0;
const ok = (name, cond) => { n++; assert.ok(cond, name); console.log('ok', name); };

ok('en-US respells the toolkit\'s words', say('Colour and behaviour, centre grey', 'en-US') === 'Color and behavior, center gray');
ok('any other dialect, or none, is left alone', say('Colour', 'en-GB') === 'Colour' && say('Colour') === 'Colour');
ok('only whole words: a token named Colourway keeps its spelling', say('Colourway', 'en-US') === 'Colourway');

// the copy: its map literal, read as data, equal to the owner's
const src = fs.readFileSync(new URL('../../skills/figma-doc-generator/scripts/docgen.js', import.meta.url), 'utf8');
const m = /var US_WORDS = (\{[\s\S]*?\});/.exec(src);
ok('the doc generator holds its copy of the map where this reads it', Boolean(m));
const copy = Function(`return ${m[1]};`)();
assert.deepEqual(copy, US, 'skills/figma-doc-generator/scripts/docgen.js US_WORDS differs from tools/shared/dialect.cjs');
ok('and its copy is the owner\'s, word for word', true);
ok('its pattern is built from its map, so the two cannot part', /new RegExp\('\\\\b\(' \+ Object\.keys\(US_WORDS\)/.test(src));

console.log(`${n} passed`);
