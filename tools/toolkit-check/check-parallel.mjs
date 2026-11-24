#!/usr/bin/env node
/*
 * bin/check's scheduler: runs its steps a few at a time, and prints them as a serial run would.
 *
 *   node tools/toolkit-check/check-parallel.mjs [--workers N] [--limit tag=n]… --state <dir> -- <runner…>
 *
 * stdin: one step per line, `<shares>\t<field>\t…`; each runs as `<runner…> <field>…`, with TOOLKIT_CHECK_STATE set to
 * a path of its own: the step writes its failed names to `<path>.failed` and its skipped ones to `<path>.skipped`.
 * <shares> is what the step uses that another step could disturb (bin/check's step list says which): comma-separated
 * tags, `-` for none, and `alone` or nothing for a step nobody declared, which then runs with nothing beside it and
 * nothing listed after it starts before it ends.
 * Two steps holding a tag never overlap; `--limit chrome=2` lets that many hold it at once. A step holding a tag is
 * started first when it fits, while a worker stays for the list's own order: that lane is the run's floor
 * (2026-11-24: the 42 Chrome steps took 358-444 s of an 823 s serial run).
 *
 * Each step's stdout and stderr are kept apart, as a serial run keeps them, and printed whole, in list order, once it
 * and every step before it ended, so the output reads as a serial run's. At the end <dir>/failed and <dir>/skipped
 * hold every step's names in list order; a step that exited non-zero and named nothing is named there, never lost.
 * Exit 2 on a usage error, else 0: the verdict is in <dir>/failed (bin/check's gather, in check-lib.sh, reads it).
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export function parseArgs(argv) {
  const o = { workers: 2, limits: {}, state: null, runner: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--') { o.runner = argv.slice(i + 1); break; }
    if (a === '--workers') o.workers = Number(argv[++i]);
    else if (a === '--limit') { const [t, n] = String(argv[++i]).split('='); o.limits[t] = Number(n); }
    else if (a === '--state') o.state = argv[++i];
    else return { error: `unknown option ${a}` };
  }
  if (!Number.isInteger(o.workers) || o.workers < 1) return { error: 'workers must be a whole number, at least 1' };
  if (Object.values(o.limits).some((n) => !Number.isInteger(n) || n < 1)) return { error: 'a limit is tag=n, n at least 1' };
  if (!o.state || !o.runner.length) return { error: 'usage: check-parallel.mjs [--workers N] [--limit tag=n] --state <dir> -- <runner…>' };
  return o;
}

const tagsOf = (s) => (s === '-' ? [] : !s || s === 'alone' ? ['alone'] : s.split(',').filter(Boolean));

export function schedule({ steps, workers, limits, state, runner, write = (s) => process.stdout.write(s), writeErr = (s) => process.stderr.write(s) }) {
  const held = {}; // tag -> how many running steps hold it
  const running = new Set();
  const pending = steps.map((s, i) => ({ ...s, i, tags: tagsOf(s.shares) }));
  const done = new Array(steps.length);
  let printed = 0;
  const fits = (s) => {
    if (s.tags.includes('alone')) return running.size === 0;
    if ([...running].some((r) => r.tags.includes('alone'))) return false;
    return s.tags.every((t) => (held[t] || 0) < (limits[t] || 1));
  };
  const counted = (s) => s.tags.some((t) => t !== 'alone');
  return new Promise((resolve) => {
    const flush = () => { while (printed < steps.length && done[printed]) { const d = done[printed++]; write(d.out); if (d.err) writeErr(d.err); } };
    const pump = () => {
      while (running.size < workers && pending.length) {
        // the first that fits, a step holding a resource before one holding none; nothing listed after an alone step
        // starts before it ends (a healing step writes what the later ones read), and it starts once the floor clears
        const bar = pending.findIndex((s) => s.tags.includes('alone'));
        const open = bar < 0 ? pending.length : bar === 0 ? 1 : bar;
        // …but one worker is always left to the list's own order: with chrome=2 and two workers, the Chrome steps took
        // both, and nothing else (the first step's output with it) moved until all 34 had run (2026-11-24)
        const busy = [...running].filter(counted).length;
        let k = busy < workers - 1 ? pending.findIndex((s, j) => j < open && counted(s) && fits(s)) : -1;
        if (k < 0) k = pending.findIndex((s, j) => j < open && fits(s));
        if (k < 0) break;
        const s = pending.splice(k, 1)[0];
        running.add(s); for (const t of s.tags) held[t] = (held[t] || 0) + 1;
        const st = path.join(state, String(s.i).padStart(4, '0'));
        let out = '', err = '';
        const c = spawn(runner[0], [...runner.slice(1), ...s.fields], { stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, TOOLKIT_CHECK_STATE: st } });
        c.stdout.setEncoding('utf8'); c.stderr.setEncoding('utf8');
        c.stdout.on('data', (d) => (out += d)); c.stderr.on('data', (d) => (err += d));
        const end = (code) => {
          if (done[s.i]) return;
          running.delete(s); for (const t of s.tags) held[t]--;
          const read = (f) => { try { return fs.readFileSync(st + f, 'utf8'); } catch { return ''; } };
          let failed = read('.failed');
          if (code !== 0 && !failed) failed = `step ${s.i + 1} (${s.fields.join(' ')}) ended with exit ${code} and no result\n`;
          done[s.i] = { out, err, failed, skipped: read('.skipped') };
          flush();
          if (printed === steps.length) resolve(done); else pump();
        };
        c.on('error', () => end(127));
        c.on('close', (code, signal) => end(code ?? (signal ? 128 : 1)));
      }
    };
    if (!steps.length) resolve([]); else pump();
  });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === (() => { try { return fs.realpathSync(process.argv[1]); } catch { return null; } })()) {
  const o = parseArgs(process.argv.slice(2));
  if (o.error) { console.error(`check-parallel: ${o.error}`); process.exit(2); }
  const steps = fs.readFileSync(0, 'utf8').split('\n').filter((l) => l.trim()).map((l) => { const [shares, ...fields] = l.split('\t'); return { shares, fields }; });
  const done = await schedule({ ...o, steps });
  fs.writeFileSync(path.join(o.state, 'failed'), done.map((d) => d.failed).join(''));
  fs.writeFileSync(path.join(o.state, 'skipped'), done.map((d) => d.skipped).join(''));
}
