import assert from 'node:assert/strict';
import { probe } from './probe.mjs';

const world = (o = {}) => ({
  service: () => ('svc' in o ? o.svc : { port: 9300, pid: 7 }),
  listeners: () => o.listeners || ['7'],
  servicePids: () => o.servicePids || [],
  status: async () => ({ files: [{ fileKey: o.file || 'F' }] }),
  exec: async (svc, f, code) => (code === 'return 1' ? (o.hang ? new Promise(() => {}) : 1) : o.inFile instanceof Error ? Promise.reject(o.inFile) : (o.inFile || { instances: 'ok', font: 3, library: 40 })),
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
assert.ok(Date.now() - t0 < 13000);
assert.deepEqual(await run({ inFile: { instances: 'none on this page', font: 2, library: 'no library instance on this page' } }), ['ok service', 'ok port', 'ok connected', 'ok answers', 'skip instances', 'skip library'], 'nothing to check is said as skipped, neither failed nor passed');
console.log('probe: 13 passed');
