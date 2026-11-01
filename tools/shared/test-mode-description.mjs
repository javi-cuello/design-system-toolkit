// node tools/shared/test-mode-description.mjs — a two-mode variable's description, written
// by one skill and read by another, round-trips. The OKLCH generator writes the block
// (modeDescriptions); the doc generator's pickLine is its only reader, and matches each
// heading against the collection's mode name. Each skill ships alone (skill-standard
// §A clause H), so the pair is held here, where both are present.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const g = require('../../skills/oklch-color-scale-system/scripts/generate.js');
const { pickLine } = require('../../skills/figma-doc-generator/scripts/docgen.js');

let n = 0;
const ok = (name, cond, detail) => { n++; assert.ok(cond, detail ? `${name} — ${detail}` : name); console.log('ok  ' + name); };

// Light anchored, dark free, so the two lines differ at every step.
const light = g.generateScale('#2DAFB8', 'anchored'), dark = g.generateScale('#2DAFB8', 'free', { dark: true });
for (const [a, b] of [['Light', 'Dark'], ['Day', 'Night'], ['Dark (AA)', 'A+'], ['Night', 'Day']]) {
  const blocks = g.modeDescriptions({ [a]: light, [b]: dark });
  const wrong = blocks.findIndex((d, i) => pickLine(d, a, [a, b]) !== light.steps[i].figmaDescriptionLine || pickLine(d, b, [a, b]) !== dark.steps[i].figmaDescriptionLine);
  ok(`pickLine reads "${a}" and "${b}" back as each mode's own line, all twelve steps`, blocks.length === 12 && wrong === -1, `step ${wrong + 1}: ${JSON.stringify(blocks[Math.max(wrong, 0)])}`);
}

// Why the heading must be the mode's name: a hand-written "Day mode:" heading is no
// heading to the reader, so it reads the whole block as preamble.
const hand = `Day mode:\n${light.steps[0].figmaDescriptionLine}\n\nNight mode:\n${dark.steps[0].figmaDescriptionLine}`;
ok('a heading that is not the mode name misreads, so the generator never writes one', pickLine(hand, 'Night', ['Day', 'Night']) !== dark.steps[0].figmaDescriptionLine);

console.log(`\n${n} passed`);
