#!/usr/bin/env node
// timing.mjs: a run's time per phase and per target, and the warning when a
// full run is more than a quarter slower than the accepted one. Run by bin/check.
import assert from 'node:assert/strict';
import { timer, summary, slower, keep, scopeOf } from './timing.mjs';

let clock = 0;
const T = timer(() => clock);
await T.timed('open', async () => { clock += 300; }, 'button');
await T.timed('probe', async () => { clock += 200; }, 'button');
await T.timed('probe', async () => { clock += 100; }, 'chip');
T.mark('judge', 50);
assert.deepEqual(T.phases, { open: 300, probe: 300, judge: 50 }, 'phases accumulate across targets');
assert.deepEqual(T.targets, { button: { open: 300, probe: 200 }, chip: { probe: 100 } }, 'and per target');
assert.equal(T.total(), 600, 'the total is the clock since the timer started');
await assert.rejects(T.timed('open', async () => { clock += 10; throw new Error('x'); }), /x/);
assert.equal(T.phases.open, 310, 'a phase that threw still counts its time');
const lines = summary(T, 650);
assert.match(lines[0], /^time: 0\.7s — judge 0\.1s$/, 'wall-clock phases first');
assert.match(lines[1], /inside measure, summed over the windows: open 0\.3s, probe 0\.3s/, 'worker time said as such');
assert.match(lines[2], /slowest targets \(pages opened one at a time\): button 0\.5s, chip 0\.1s/);

// The warning: a quarter slower on the same scope, naming the phase that grew.
const accepted = { scope: 'all', total: 24000, phases: { measure: 20000, judge: 1000 } };
assert.equal(slower(accepted, { scope: 'all', total: 29000, phases: { measure: 24000, judge: 1500 } }), null, 'a fifth slower is within machine load');
assert.match(slower(accepted, { scope: 'all', total: 40000, phases: { measure: 35000, judge: 1500 } }), /slower than the accepted run by 67% \(40\.0s against 24\.0s\) — measure grew the most, by 15\.0s/);
assert.equal(slower(accepted, { scope: 'button', total: 40000, phases: {} }), null, 'another scope is not compared');
assert.equal(slower(null, { scope: 'all', total: 1 }), null, 'nothing accepted, nothing to say');
// An accept keeps the faster time: one made beside another check must not raise the bar.
const fast = { scope: 'all', total: 21000, phases: { measure: 19000 } }, slow = { scope: 'all', total: 74000, phases: { measure: 72000 } };
assert.equal(keep(fast, slow).total, 21000, 'a slower accept keeps the faster reference');
assert.equal(keep(fast, slow).keptOver, 74000, '…and says what it was kept over');
assert.equal(keep(slow, fast).total, 21000, 'a faster accept replaces it');
assert.equal(keep(null, slow), slow, 'the first accept is the reference');
assert.equal(keep({ scope: 'button', total: 1 }, slow), slow, 'another scope does not hold it');

// A full run's scope counts its targets, so a grown library is a new reference.
assert.equal(scopeOf([], 139), 'all 139', 'a full run names its target count');
assert.equal(scopeOf(['button', 'chip'], 2), 'button chip', 'a partial run names its targets');
assert.equal(slower({ scope: scopeOf([], 110), total: 88000 }, { scope: scopeOf([], 139), total: 111000, phases: {} }), null, 'more targets is not a slowdown');
console.log('test-timing: 19 assertions passed');
