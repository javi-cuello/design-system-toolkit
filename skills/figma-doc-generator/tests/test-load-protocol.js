/* Tests for the load protocol — run: node tests/test-load-protocol.js
 *
 * Covers getting the three scripts into a Figma file intact. That step used to
 * be unverifiable — 51KB re-sent on every call, with nothing able to tell a
 * faithful transcription from a subtly corrupted one — which is why it is the
 * part worth testing now that it can be.
 */
const DOCGEN = require('../scripts/docgen.js');
require('../scripts/figma-helpers.js');
require('../scripts/recipes.js');

let pass = 0, fail = 0; const failures = [];
function eq(a, b, label) {
  if (JSON.stringify(a) === JSON.stringify(b)) { pass++; return; }
  fail++; failures.push(label + '\n    expected ' + JSON.stringify(b) + '\n    actual   ' + JSON.stringify(a));
}
const ok = (c, label) => eq(!!c, true, label);

/* --- every script parses on its own -------------------------------------
   The node-touching layers run here only against a fake (test-recipes.js);
   `node --check` is the gate that needs no fake at all, per file. */
for (const f of ['docgen.js', 'figma-helpers.js', 'recipes.js', 'verify.js', 'hash.js']) {
  const r = require('child_process').spawnSync(process.execPath,
    ['--check', require('path').join(__dirname, '..', 'scripts', f)], { encoding: 'utf8' });
  ok(r.status === 0, f + ': node --check passes' + (r.stderr ? ' — ' + r.stderr.split('\n')[0] : ''));
}

const F = {
  docgen: globalThis.__DOCGEN_FACTORY,
  helpers: globalThis.__FIGMA_HELPERS_FACTORY,
  recipes: globalThis.__RECIPES_FACTORY
};

/* --- all three must be carriers, or there is nothing to cache -------------- */
for (const [name, fac] of Object.entries(F)) {
  ok(typeof fac === 'function', name + ': exposes a named factory (an IIFE could not cache itself)');
  ok(fac && fac.toString().length > 3000, name + ': toString() returns the real body, not a stub');
}

/* --- requiring must NOT run the factories -------------------------------
   The Figma half is skipped in node on purpose: it is what lets node compute
   the expected hash without a live file. So the globals must be absent until
   a factory is called. */
ok(typeof DOCGEN.srcHash === 'function', 'docgen exports srcHash so all sides hash identically');
ok(typeof globalThis.setCellText === 'undefined',
  'requiring does NOT install helpers — the Figma-only block must stay unrun in node');

/* --- calling a factory installs its public surface EXPLICITLY -------------
   Indirect eval does not leak declarations into globals in the Figma sandbox
   (tested 2026-08-08), so every public name is assigned rather than left to
   scope. That is the assertion; the wrapping is worthless without it. */
F.helpers();
F.recipes();
ok(typeof globalThis.setCellText === 'function', 'calling the helpers factory installs setCellText');
ok(typeof globalThis.keyFor === 'function', 'calling the helpers factory installs keyFor');
ok(typeof globalThis.generate === 'function', 'calling the recipes factory installs generate');

/* --- the hash is blind to formatting and nothing else ---------------------- */
const h = DOCGEN.srcHash, src = F.docgen.toString();
eq(h(src), h(src), 'hash is stable across calls');
eq(h('a b  c'), h('abc'), 'whitespace ignored — engine reformatting is not corruption');
ok(h(src) !== h(src.replace('parseNum', 'parseNvm')), 'one altered character is caught');
ok(h(src) !== h(src.slice(0, -300)), 'truncation is caught — the likeliest corruption of a big paste');

const STRIP = DOCGEN.stripComments, HASH = DOCGEN.srcHash, FAC = F.docgen;

/* --- the hash covers CODE, not prose -------------------------------------
   Comments were 6,667 of the 24,330 characters an agent had to transcribe
   exactly, and none of them execute. Counting them made the gate reject
   functionally correct pastes over a reworded sentence. A state machine, not
   a regex, because a regex cannot tell a comment from "//" inside a string or
   a slash inside a regex literal. */
eq(STRIP('a; // gone'), 'a; ', 'strip: line comment removed');
eq(STRIP('a /* gone */ b'), 'a   b', 'strip: block comment removed');
eq(STRIP("var u='http://x';"), "var u='http://x';", 'strip: // inside a string survives');
eq(STRIP('var u="a/*b*/c";'), 'var u="a/*b*/c";', 'strip: /* */ inside a string survives');
eq(STRIP('s.replace(/\\s+/g,"");'), 's.replace(/\\s+/g,"");', 'strip: regex literal survives');
eq(STRIP('var r=/[/]/;'), 'var r=/[/]/;', 'strip: slash inside a regex char class survives');
eq(STRIP('var t=`a//b`;'), 'var t=`a//b`;', 'strip: // inside a template literal survives');
eq(STRIP('x = a / b; // c'), 'x = a / b; ', 'strip: division is not mistaken for a regex');

const REAL = FAC.toString();
ok(HASH(REAL.replace(/\/\/ [A-Z][^\n]{20,}/, '// completely different wording, much longer than the original was')) === HASH(REAL),
  'rewording a comment does NOT change the hash — the point of the change');
ok(HASH(REAL) !== HASH(REAL.replace('function', 'functi0n')), 'altered code is still caught');
ok(HASH("var a='http://x';") !== HASH("var a='';"), 'content inside strings is still hashed');

/* --- distinct files must not collide -------------------------------------- */
const hashes = Object.values(F).map(f => h(f.toString()));
eq(new Set(hashes).size, 3, 'the three files hash differently');

/* --- round trip: source -> eval -> callable factory ------------------------ */
const revived = (0, eval)('(' + F.docgen.toString() + ')');
ok(typeof revived === 'function', 'a cached source revives into a callable factory');
ok(typeof revived().parseNum === 'function', 'the revived factory rebuilds the API');

/* --- hash.js must agree, or comparing its output means nothing ------------- */
const { execSync } = require('child_process');
const out = execSync('node ' + require('path').join(__dirname, '..', 'scripts', 'hash.js')).toString();
ok(out.includes(h(F.docgen.toString())), 'scripts/hash.js prints docgen.js\'s real hash');
ok(out.includes(h(F.helpers.toString())), 'scripts/hash.js prints figma-helpers.js\'s real hash');
ok(out.includes(h(F.recipes.toString())), 'scripts/hash.js prints recipes.js\'s real hash');

console.log('\n' + pass + ' passed, ' + fail + ' failed');
if (fail) { console.log('\nFAILURES:\n'); failures.forEach(f => console.log('  ✗ ' + f + '\n')); process.exit(1); }
process.exit(0);
