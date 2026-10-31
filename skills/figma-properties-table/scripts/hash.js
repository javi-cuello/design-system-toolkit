/* hash.js — print the integrity hash of properties-table.js.
 *
 * Run:  node scripts/hash.js
 *
 * The number it prints is what a correct paste reports back as `sourceHash`.
 * Equal means the bytes that reached the Figma file are the bytes on disk;
 * different means the transcription was corrupted and must not be cached.
 *
 * Both sides hash the SAME thing — the factory's `toString()`, whitespace
 * removed — so a difference in indentation or line wrapping cannot raise a
 * false alarm, while a truncated or altered line still can. That matters
 * because the paste is the one step in this skill nothing else can verify.
 */
const { factory, hash } = require('./properties-table.js');

if (typeof factory !== 'function') {
  console.error('properties-table.js did not export a factory — the load protocol is broken.');
  process.exit(1);
}

const src = factory.toString();
console.log(hash(src));
console.log('bytes (raw): ' + src.length);
console.log('\nPaste properties-table.js into figma_execute once per file.');
console.log('It returns sourceHash; it must equal the hash above.');
