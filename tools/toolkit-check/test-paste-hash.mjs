// node tools/toolkit-check/test-paste-hash.mjs — the three pasted scripts strip comments and hash alike.
//
// figma-doc-generator's docgen.js, figma-properties-table's properties-table.js and figma-components-audit's
// probes.js each carry the integrity hash a paste into Figma reports back, because the sandbox they run in imports
// nothing. Two of them were one copy and the third its own, and they differed: after `return` the copies read a
// regex as division and dropped what followed its `//` as a comment, and a template inside a template ended early.
// Each side of one skill agrees with itself whatever it does, so only a test across the three sees them drift.
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const at = (p) => fileURLToPath(new URL('../../' + p, import.meta.url));
const DOCGEN = require(at('skills/figma-doc-generator/scripts/docgen.js'));
require(at('skills/figma-properties-table/scripts/properties-table.js'));
const FCA = require(at('skills/figma-components-audit/scripts/probes.js'));

const sides = {
  'figma-doc-generator': [DOCGEN.stripComments, DOCGEN.srcHash],
  'figma-properties-table': [globalThis.__PT_STRIP, globalThis.__PT_HASH],
  'figma-components-audit': [FCA.stripComments, FCA.srcHash],
};
const samples = [
  'const a = "http://x"; // gone\nconst r = /a\\/\\/b[/*]/g; /* gone */ const t = `u//${ {b:1}.b }/*k*/`; x = 4 / 2 / 1;',
  'function f(s) { return /\\/\\//.test(s); } // a regex after return',
  'const t = `a${ `b//c` }d`; /* a template inside a template */',
  "var u = 'it\\'s // kept'; x = typeof /re/g",
  'x = a / b; // division',
  // a hash with a leading zero, which one side wrote with seven digits
  'x2',
  ...['skills/figma-doc-generator/scripts/docgen.js', 'skills/figma-properties-table/scripts/properties-table.js', 'skills/figma-components-audit/scripts/probes.js']
    .map((p) => readFileSync(at(p), 'utf8')),
];

let failed = 0;
samples.forEach((s, i) => {
  const [[first, [strip0, hash0]], ...rest] = Object.entries(sides);
  for (const [name, [strip, hash]] of rest) {
    if (strip(s) !== strip0(s) || hash(s) !== hash0(s)) { failed++; console.log(`FAIL sample ${i}: ${name} strips or hashes it unlike ${first}`); }
  }
  if (!/^[0-9a-f]{8}$/.test(hash0(s))) { failed++; console.log(`FAIL sample ${i}: the hash is not eight hex digits (${hash0(s)})`); }
});
if (failed) process.exit(1);
console.log(`${samples.length}/${samples.length} samples stripped and hashed alike by the three pasted scripts`);
