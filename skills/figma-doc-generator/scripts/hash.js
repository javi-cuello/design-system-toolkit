/* hash.js — print the integrity hashes of the three loadable scripts.
 *
 * Run:  node scripts/hash.js
 *
 * Each number is what a correct paste reports back for that file. Equal means
 * the bytes that reached the Figma file are the bytes on disk; different means
 * the transcription was corrupted and must not be cached — a corrupt cache is
 * reused by every later session, which is the one failure caching introduces.
 *
 * All four sides — these three files and the sandbox — hash the same way, via
 * DOCGEN.srcHash: the factory's toString(), whitespace removed. Reformatting
 * by the engine therefore cannot raise a false alarm, while a truncated or
 * altered line still does.
 */
const DOCGEN = require('./docgen.js');
require('./figma-helpers.js');
require('./recipes.js');

const FACTORIES = [
  ['docgen.js', 'dg.docgen.v1', globalThis.__DOCGEN_FACTORY],
  ['figma-helpers.js', 'dg.helpers.v1', globalThis.__FIGMA_HELPERS_FACTORY],
  ['recipes.js', 'dg.recipes.v1', globalThis.__RECIPES_FACTORY]
];

let bad = 0;
for (const [name, key, fac] of FACTORIES) {
  if (typeof fac !== 'function') {
    console.error(name + ': factory missing — the load protocol is broken.');
    bad++;
    continue;
  }
  const src = fac.toString();
  console.log(name.padEnd(18) + DOCGEN.srcHash(src).padEnd(12) + src.length + ' bytes  [' + key + ']');
}
if (bad) process.exit(1);

console.log('\nPaste all three once per file, docgen.js first — the others call into');
console.log('DOCGEN at runtime. Each returns its hash; all three must match above.');
console.log('Later calls need only the bootstrap in SKILL.md.');
