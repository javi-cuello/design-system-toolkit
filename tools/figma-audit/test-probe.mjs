import assert from 'node:assert/strict';
import { probe } from './probe.mjs';

const world = (o = {}) => ({
  service: () => ('svc' in o ? o.svc : { port: 9300, pid: 7 }),
  listeners: () => o.listeners || ['7'],
  servicePids: () => o.servicePids || [],
  status: async () => ({ files: [{ fileKey: o.file || 'F' }] }),
  own: o.own || false,
  exec: async (svc, f, code) => o.own && code.startsWith('const OWN = true;') ? { instances: 'ok', font: 1, library: "not needed: this is the library's own file, whose components the drawing takes from it" } : (code === 'return 1' ? (o.hang ? new Promise(() => {}) : 1) : o.inFile instanceof Error ? Promise.reject(o.inFile) : (o.inFile || { instances: 'ok', font: 3, library: 40 })),
});
const run = async (o) => (await probe('lib', 'F', world(o))).map((x) => `${x.skipped ? 'skip' : x.ok ? 'ok' : 'FAIL'} ${x.check}${x.ok ? '' : `: ${x.said}`}`);
const last = async (o) => (await run(o)).at(-1);

assert.deepEqual(await run({}), ['ok service', 'ok port', 'ok connected', 'ok answers', 'ok instances', 'ok library'], 'a healthy bridge passes every check');
assert.match(await last({ svc: null }), /FAIL service: no docs service running for lib/);
assert.match(await last({ listeners: ['7', '99'] }), /FAIL port: mode 4: another process \(99\)/, 'a second listener on the port is the clash');
assert.match(await last({ file: 'G' }), /FAIL connected: mode 1: F is not connected \(connected: G\)/);
assert.match(await last({ inFile: { instances: 'gone', font: 1, library: 1 } }), /FAIL instances: mode 5/, 'a layer inside an instance gone by id is the degraded plugin');
assert.match(await last({ inFile: new Error('Execution timed out after 40000ms') }), /FAIL library: mode 3/, 'the in-file checks timing out is the stalled library API');
assert.match(await last({ inFile: new Error('wrong_file_not_open') }), /FAIL library: the in-file checks failed: wrong_file_not_open/, 'any other error is said as it is, never as mode 3');
assert.match(await last({ inFile: { instances: 'ok', font: 1, library: { error: 'component not published' } } }), /FAIL library: a library component did not import \(component not published\)/, 'an import refused is not a stall');
assert.match(await last({ inFile: { instances: { error: 'node does not exist' }, font: 1, library: 1 } }), /FAIL instances: mode 5\?/, 'reading inside an instance throwing points at the degraded plugin');
assert.deepEqual(await run({ listeners: ['7', '8'], servicePids: [8] }), ['ok service', 'ok port', 'ok connected', 'ok answers', 'ok instances', 'ok library'], 'the service\'s own --watch child listening is the service');
const t0 = Date.now();
assert.match(await last({ hang: true }), /FAIL answers: mode 1: a trivial call: no answer in 12 s/, 'a call that never answers is given up on, never waited for');
// (it gives up at its 12 s bound, never waits on: under a loaded land the rest of the run adds seconds, so the margin is wide)
assert.ok(Date.now() - t0 < 30000);
assert.deepEqual(await run({ inFile: { instances: 'none on this page', font: 2, library: 'no library instance on this page' } }), ['ok service', 'ok port', 'ok connected', 'ok answers', 'skip instances', 'skip library'], 'nothing to check is said as skipped, neither failed nor passed');
// the library's own file: the bridge is told so, and the import is not asked (a stray other-library instance on the
// page would otherwise fail a drawing that never imports)
assert.deepEqual(await run({ own: true, inFile: { instances: 'ok', font: 1, library: { error: 'not published' } } }), ['ok service', 'ok port', 'ok connected', 'ok answers', 'ok instances', 'skip library'], 'in the library\'s own file the import is not asked');
// Figma's plugin parser refuses the text "import (" anywhere in the code, a comment too ("possible import expression
// rejected"), so the code sent to the file never holds it
{ const { IN_FILE } = await import('./probe.mjs'); assert.ok(!/\bimport\s*\(/.test(IN_FILE), 'the in-file code holds no text Figma reads as an import'); }
// the instance read: in the library's own file only its own components' instances, and the first of three that reads
// back passes (one whose insides are another library's can fail alone), run as Figma runs it
{
  const { IN_FILE } = await import('./probe.mjs');
  const inst = (remote, reads) => ({ children: [{ id: reads }], getMainComponentAsync: async () => ({ remote }) });
  const runIn = async (own, insts) => {
    const figma = { currentPage: { findAllWithCriteria: () => insts }, getNodeByIdAsync: async (id) => { if (id === 'throws') throw new Error('Unable to establish connection to Figma'); return id === 'ok' ? {} : null; }, loadFontAsync: async () => {}, importComponentByKeyAsync: async () => {} };
    return (await new (async () => {}).constructor('figma', (own ? 'const OWN = true;\n' : '') + IN_FILE)(figma)).instances;
  };
  assert.equal(await runIn(true, [inst(true, 'throws'), inst(false, 'throws'), inst(false, 'ok')]), 'ok', 'a later own instance that reads back passes');
  assert.equal(await runIn(true, [inst(true, 'ok')]), "none of this file's own on this page", 'another library\'s instance is not read in the own file');
  assert.deepEqual(await runIn(false, [inst(false, 'throws'), inst(false, 'throws'), inst(false, 'throws'), inst(false, 'ok')]), { error: 'Unable to establish connection to Figma' }, 'three that fail are a failure, the fourth not tried');
  assert.equal(await runIn(false, [inst(false, 'gone')]), 'gone', 'an instance whose insides are gone by id is still mode 5');
}
// the code sent to the file parses as Figma reads it, an async function body (it is a template, so a quote escaped
// in the source arrives unescaped)
{ const { IN_FILE } = await import('./probe.mjs'); const AsyncFunction = (async () => {}).constructor; assert.doesNotThrow(() => new AsyncFunction('const OWN = true;\n' + IN_FILE), 'the in-file code parses'); }
// bin/audit probes through the trivial call only: it draws nothing and imports nothing, so the in-file checks are not run
assert.deepEqual((await probe('lib', 'F', world({ inFile: new Error('never asked') }), { through: 'answers' })).map((x) => x.check), ['service', 'port', 'connected', 'answers'], 'through answers stops after the trivial call');
console.log('probe: 22 passed');
