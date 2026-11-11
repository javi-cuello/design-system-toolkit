#!/usr/bin/env node
/*
 * tools/parity/watch.mjs — the code audit keeps itself current. A project
 * whose library states its code (`code.repo`) and its parity facts
 * (`code.parity`, with its mappings) is re-audited (external.mjs) when the
 * snapshot moves (its contracts), the mappings change, or the code does (the component and Storybook folders the audit
 * builds from). The audit re-measures only components whose inputs changed,
 * so a run with nothing new costs the browser's start. One run at a time; a
 * change during a run queues one more.
 *
 *   watchCodeAudit(label, context, log) → { run, close } | null
 *   node tools/parity/watch.mjs <label>     the same, in a terminal
 *
 * The docs service calls it for each project it serves.
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

import { realpathSync } from 'node:fs';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const contract = require('../snapshot/projects.cjs');
// what the code audit builds from, never its own output, a build or installed packages
export const IGNORED = /(^|\/)(node_modules|storybook-static|dist|\.turbo|\.cache)(\/|$)/;

// `script` is what a run spawns: the audit, or a test's stand-in
export function watchCodeAudit(label, context, log = console.log, { delay = 10000, script = path.join(HERE, 'external.mjs') } = {}) {
  // a library built elsewhere that the project compares: its context document's code.parity (project.mjs loadParity)
  const lib = Object.values((context && context.libraries) || {}).find((l) => l.code && l.code.repo && l.code.parity);
  const P = lib && lib.code.parity;
  const mapFile = P && P.mappings && P.mappings.components && P.mappings.components.json && path.join(contract.homeOf(label), P.mappings.components.json);
  if (!mapFile || !fs.existsSync(mapFile)) return null;
  const repo = contract.expand(lib.code.repo);
  const sb = (P.host && P.host.build) || {};
  const codeDirs = [lib.code.components, ...(sb.inputs || [sb.dir])].filter(Boolean).map((d) => path.join(repo, d)).filter((d) => fs.existsSync(d));
  const where = contract.layout(null, label);
  const index = where && !where.error && where.paths && where.paths.index;
  const tokens = where && !where.error && where.paths && where.paths.tokens;
  let running = false, again = false, t = null, child = null, closed = false;
  const run = () => {
    if (running) { again = true; return; }
    running = true;
    const t0 = Date.now();
    child = spawn(process.execPath, [script, '--project', label], { stdio: ['ignore', 'pipe', 'pipe'] });
    let tail = '';
    child.stdout.on('data', (d) => { tail = (tail + d).slice(-600); });
    child.stderr.on('data', (d) => { tail = (tail + d).slice(-600); });
    child.on('close', (code) => {
      const lastLine = tail.trim().split('\n').pop();
      log(`${code === 0 ? lastLine : `failed (${code}): ${lastLine}`} (${Math.round((Date.now() - t0) / 1000)}s)`);
      running = false; child = null;
      if (again && !closed) { again = false; run(); }
    });
  };
  const soon = () => { clearTimeout(t); t = setTimeout(run, delay); };
  const watchers = [
    ...codeDirs.map((d) => fs.watch(d, { recursive: true }, (_, f) => { if (f && !IGNORED.test(String(f))) soon(); })),
    fs.watch(path.dirname(mapFile), (_, f) => { if (String(f) === path.basename(mapFile)) soon(); }),
    // the snapshot: its index (contracts) and its tokens, each rewritten by a library snapshot
    ...[index, tokens].filter((f) => f && fs.existsSync(path.dirname(f))).map((f) => fs.watch(path.dirname(f), (_, n) => { if (String(n) === path.basename(f)) soon(); })),
    // the official contracts, where the project takes the contract as its source (component-contract's official.mjs)
    // watched from the home, so a folder a switch makes while this runs is seen without a restart
    ...[where && !where.error && where.projectDir].filter((d) => d && fs.existsSync(d)).map((d) => fs.watch(d, { recursive: true }, (_, f) => { if (/^contracts([\\/]|$)/.test(String(f || ''))) soon(); })),
  ];
  // a folder removed under a watcher ends that watcher; said, never thrown into the service
  for (const w of watchers) w.on('error', (e) => log(`stopped watching: ${e.message}`));
  run();
  return { run, close: () => { closed = true; clearTimeout(t); for (const w of watchers) w.close(); if (child) child.kill(); }, watching: codeDirs };
}

/*
 * A project's own Storybook, the one its docs site serves, kept current: a
 * project whose repo states how its stories are built (`parity.host.build` in
 * snapshot.config.json) and where the docs read them (`paths.storybook.dir`)
 * is rebuilt into that folder when a build input changes. One project's docs
 * showed a Storybook seven weeks behind its components, built by hand once
 * (2026-11-11). The build is parity's own (session.mjs buildStories), its
 * stamp in the folder, so unchanged inputs are never built twice into it; it
 * runs in a child so the service is never blocked by it.
 *
 *   watchStories(label, log) → { run, close } | null
 */
export function watchStories(label, log = console.log, { delay = 30000, script = fileURLToPath(import.meta.url) } = {}) {
  const where = contract.layout(null, label);
  if (!where || where.error || !where.repo) return null;
  const out = where.paths && where.paths.storybook && where.paths.storybook.dir;
  const read = require('../shared/repo-config.cjs').readRepoConfig(where.repo);
  const build = read && read.config && read.config.parity && read.config.parity.host && read.config.parity.host.build;
  if (!out || !build || !build.run) return null;
  const dirs = (build.inputs || [build.dir || '.']).map((d) => path.resolve(where.repo, d)).filter((d) => fs.existsSync(d));
  let running = false, again = false, t = null, child = null, closed = false;
  const run = () => {
    if (running) { again = true; return; }
    running = true;
    child = spawn(process.execPath, [script, '--stories', label], { stdio: ['ignore', 'pipe', 'pipe'] });
    let tail = '';
    child.stdout.on('data', (d) => { tail = (tail + d).slice(-600); });
    child.stderr.on('data', (d) => { tail = (tail + d).slice(-600); });
    child.on('close', (code) => {
      log(`${code === 0 ? '' : `failed (${code}): `}${tail.trim().split('\n').pop()}`);
      running = false; child = null;
      if (again && !closed) { again = false; run(); }
    });
  };
  const soon = () => { clearTimeout(t); t = setTimeout(run, delay); };
  // the build's own output (the folder, and its .next and .old beside it) never starts a build
  const outRel = path.relative(where.repo, out);
  const own = (rel) => outRel && !outRel.startsWith('..') && [outRel, `${outRel}.next`, `${outRel}.old`].some((o) => rel === o || rel.startsWith(o + path.sep));
  const watchers = dirs.map((d) => fs.watch(d, { recursive: true }, (_, f) => {
    const rel = path.relative(where.repo, path.join(d, String(f || '')));
    if (f && !IGNORED.test(rel) && !own(rel)) soon();
  }));
  for (const w of watchers) w.on('error', (e) => log(`stopped watching: ${e.message}`));
  run();
  return { run, close: () => { closed = true; clearTimeout(t); for (const w of watchers) w.close(); if (child) child.kill(); }, watching: dirs };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === (() => { try { return realpathSync(process.argv[1]); } catch { return null; } })()) {
  if (process.argv[2] === '--stories') {
    // one build of a project's own Storybook into the folder its docs read, reused while nothing changed
    const where = contract.layout(null, process.argv[3]);
    if (where.error) { console.error(where.error); process.exit(2); }
    const { buildStories } = await import('./session.mjs');
    const read = where.repo ? require('../shared/repo-config.cjs').readRepoConfig(where.repo) : null;
    const build = read?.config?.parity?.host?.build;
    const out = where.paths?.storybook?.dir;
    if (!build || !build.run || !out) { console.error(`${process.argv[3]}: no story build (parity.host.build in snapshot.config.json) or no paths.storybook.dir`); process.exit(2); }
    try { buildStories(where.repo, build, out, (l) => console.log(l), process.argv[3]); }
    catch (e) { console.error(e.message.split('\n').slice(0, 6).join('\n')); process.exit(1); }
    process.exit(0);
  }
  const label = process.argv[2];
  if (!label) { console.error('usage: watch.mjs <label> | --stories <label>'); process.exit(2); }
  const where = contract.layout(null, label);
  if (where.error) { console.error(where.error); process.exit(2); }
  const w = watchCodeAudit(label, contract.auditContext(where.doc), (l) => console.log(`code audit ${label}: ${l}`), { delay: Number(process.env.DELAY || 10000) });
  if (!w) { console.error(`${label}: no library states its code and its parity facts (code.parity), or its mappings file is missing`); process.exit(2); }
  console.log(`watching ${w.watching.join(', ')}`);
}
