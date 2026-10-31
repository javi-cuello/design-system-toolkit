#!/usr/bin/env node
/*
 * tools/parity/run.mjs — the parity run, part of the design-to-code parity
 * engine (README.md here; the method is skills/design-code-parity).
 *
 *   node tools/parity/run.mjs --repo <dir> [target …] [--accept [--triaged "<where>"]] [--shots[=<dir>]]
 *   node tools/parity/run.mjs --repo <dir> --gates
 *
 * Every gate, then every variant the project's mappings render, in every
 * tier, measured and judged against its Figma spec; the verdict saved where
 * `paths.parity` says, the measurements held to the last accepted run where
 * `parity.baseline` says, with each waiver's largest excused difference per
 * target. Exit 0 is green. A target named on the command line scopes the run
 * to it (a component folder or story, or a frame, or a family of them); a scoped
 * run judges no backlog, no stale waiver it did not reach and no baseline,
 * and is never accepted. `--accept` makes this full run's measurements the
 * accepted ones. `--gates` runs only the gates no browser answers.
 *
 * `--shots` leaves a picture of each target in each tier in `parity.shots`
 * (or the dir given), compares each with the set the last accepted run kept,
 * and puts each screen beside its frame's own picture, region by region, as a
 * contact sheet in `<dir>/frames` (shots.mjs). All of it is advisory: pixels
 * point eyes, they never fail a run. With `--accept`, the pictures are kept.
 *
 * What is the project's comes from its `snapshot.config.json` (project.mjs):
 * the pages are put on screen by the host its `parity.host` names, built and
 * served first where it says how (`host.build`), and the running product is
 * started where `parity.app.start` says and is not already up. Nothing here
 * names a project.
 */
import fs from 'node:fs';
import path from 'node:path';
import { loadProject, scopeTargets } from './project.mjs';
import { adapt, plan as planFor, carriers } from './adapt.mjs';
import { diff, BAD } from './diff.mjs';
import { measure } from './probe.mjs';
import { asWaiver, staleAcross, looseBounds, appWaivers, recordExcused } from './waivers.mjs';
import { lessons, lessonsIndex, deviations, triage } from './lessons.mjs';
import { forceState } from '../shared/cdp.mjs';
import * as shots from './shots.mjs';
import { baseline } from './baseline.mjs';
import { saveReport } from './parity-report.mjs';
import { compareNames } from '../shared/output.mjs';
import { session, screenWindow, drivePage } from './session.mjs';
import { timer, summary, slower, keep, scopeOf } from './timing.mjs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
import * as gates from './gates.mjs';
import { samePath } from '../shared/real-path.mjs';
import { variantValues } from '../shared/names.js';

/* The command line, closed: a flag nobody reads is refused, because
   `--acept` ran an unscoped full run and accepted nothing, in silence. */
const argv = process.argv.slice(2);
const opt = (name) => { const i = argv.indexOf(name); return i < 0 ? undefined : argv.splice(i, 2)[1]; };
const flag = (name) => { const i = argv.indexOf(name); if (i >= 0) argv.splice(i, 1); return i >= 0; };
const REPO = opt('--repo') || process.cwd();
const shotsAt = argv.findIndex((a) => a === '--shots' || a.startsWith('--shots='));
const SHOTS_ASKED = shotsAt >= 0 ? (argv.splice(shotsAt, 1)[0].split('=')[1] ?? true) : null;
const ACCEPT = flag('--accept');
const TRIAGED = opt('--triaged');
const GATES = flag('--gates');
const stray = argv.filter((a) => a.startsWith('-'));
if (stray.length) { console.log(`no such option: ${stray.join(', ')} — the options are --repo <dir>, --accept [--triaged "<where>"], --shots[=<dir>], --gates`); process.exit(2); }
const wanted = argv;

const TIME = timer();
const T_LOAD = performance.now();
// a fact the project lacks is said, never a stack (project.mjs `said`)
const project = await loadProject(REPO).catch((e) => { if (!e.usage) throw e; console.error(e.message); process.exit(2); });
const P = project.parity;
const fullRun = wanted.length === 0;
/* toolkit-standard §D 8: an accept with untriaged lessons is refused before a
   browser opens, so the refusal costs nothing (lessons.mjs triage). */
const LESSONS_AT = () => path.join(REPO, P.baseline.dir, 'accepted', 'lessons.json');
let FOUND = [];
if (ACCEPT && P && P.baseline && fs.existsSync(LESSONS_AT())) {
  FOUND = lessons([...declaredWaivers(project), ...deviations(REPO, P.stylesheets || [])], JSON.parse(fs.readFileSync(LESSONS_AT(), 'utf8')), await othersDeclared(project));
  const refused = triage(FOUND, TRIAGED, path.resolve(HERE, '../..'));
  if (refused) {
    for (const l of FOUND.slice(0, 40)) console.log(`  ${l.target}${l.on.length > 1 ? ` (+${l.on.length - 1} more)` : ''}: ${l.key} [${l.owner}] — ${String(l.reason).slice(0, 110)}${l.candidate ? ` — toolkit candidate: ${l.candidate} rules the same` : ''}`);
    console.log(`
not accepted: ${refused}`);
    process.exit(2);
  }
}
let failed = 0;
const say = (l) => console.log(l);
const SHOTS = SHOTS_ASKED === true ? (P.shots ? path.join(REPO, P.shots) : null) : SHOTS_ASKED && path.resolve(SHOTS_ASKED);
if (SHOTS_ASKED === true && !SHOTS) { say('--shots needs a folder: parity.shots in snapshot.config.json, or --shots=<dir>'); process.exit(2); }

/* A scope that names nothing measured nothing and said green: refused. */
const { targets, unknown } = fullRun ? { targets: project.targets, unknown: [] } : scopeTargets(project.targets, wanted);
if (unknown.length) { say(`no such target: ${unknown.join(', ')} — a target is a mapped component (its folder or story) or a mapped frame, or a family of them (a mapping file's folder, a screen key before --)`); process.exit(1); }

/* ── the gates no render answers ───────────────────────────────────────── */
if (fullRun || GATES) {
  say('gates');
  failed += await TIME.timed('gates', async () => gates.printGates(gates.staticGates(project), (l) => say(`  ${l}`)));
}
if (GATES) { say(`\n${failed ? 'RED' : 'green'}`); process.exit(failed ? 1 : 0); }
if (!targets.length) { say('nothing to measure: the project maps no component and no screen'); process.exit(1); }

/* ── the facts, per variant ────────────────────────────────────────────── */
TIME.mark('load', performance.now() - T_LOAD);
const T_ADAPT = performance.now();
const TIERS = P.tiers;   // required (project.mjs checkFacts); the first is the tier the frames are drawn in
const WINDOW = P.window || null;
/* A desktop window, for a project that names none and a variant whose design
   carries no width of its own: the interface settings' page width, and a component's window height (taller than a
   page's, so a tall component is measured whole), the project's own over the house's. */
const DEFAULT_WINDOW = [project.limits.viewportWidth, project.limits.componentWindowHeight];
/* The window a variant is drawn in: a Breakpoint variant's own frame width,
   bounded by what the project says each breakpoint's window is. */
const windowFor = (t, tree) => {
  if (t.kind === 'screen' || t.mapping.viewport) return screenWindow(t, tree);
  const B = P.breakpoints;
  const at = B && (new RegExp(`(?:^|, )${B.axis}=([^,]+)`).exec(tree.name) || [])[1];
  const rule = at && B.windows && B.windows[at];
  if (!rule) return WINDOW;
  const own = Math.round(tree.w);
  const w = rule.atLeast !== undefined ? Math.max(own, rule.atLeast) : rule.atMost !== undefined ? Math.min(own, rule.atMost) : own;
  return [w, (WINDOW || DEFAULT_WINDOW)[1]];
};
/* The type tier a window lands in, where the project's type scale has them. */
const typeTierFor = (win) => {
  if (!P.typeTiers) return undefined;
  const w = win ? win[0] : (WINDOW || DEFAULT_WINDOW)[0];
  return (P.typeTiers.find((x) => x.below === undefined || w < x.below) || {}).mode;
};
/* The box the design fixed: FIXED and FILL are the width the file records,
   HUG takes the canvas. A screen, or a mapping that needs the window, is
   drawn in the window instead. */
const frameFor = (t, tree) => {
  if (t.kind === 'screen' || t.mapping.viewport) return null;
  const [hx, vy] = String(tree.sizing || '/').split('/');
  return hx === 'HUG' && vy === 'HUG' ? null : { w: hx === 'HUG' ? undefined : tree.w, h: vy === 'HUG' ? undefined : tree.h };
};
const scopedWaivers = (declared, variantName) => {
  const out = {};
  const pairs = (n) => Object.entries(variantValues(n)).map(([a, b]) => `${a}=${b}`);
  const have = new Set(pairs(variantName));
  for (const [k, v] of Object.entries(declared || {})) {
    const i = k.indexOf(' :: ');
    if (i < 0) { out[k] = { ...asWaiver(v), key: k }; continue; }
    if (pairs(k.slice(0, i)).every((w) => have.has(w))) out[k.slice(i + 4)] = { ...asWaiver(v), key: k };
  }
  return out;
};

/* How a prop's attribute is spelt: by the naming to-code writes the sheets under, where it writes them
   (`paths.componentStyles`); markup written by hand is read by the prop's words (tools/shared/prop-attr.mjs). */
const ATTR_NAMING = project.paths && project.paths.componentStyles ? (project.config.styles && project.config.styles.naming) || { kind: 'class' } : null;
/* Every (target, variant, tier) a run measures, with what it asks. */
const jobs = [];
const mapped = new Set(), drawn = new Set();
/* Each library component's property types, by name: what a prop IS, read
   rather than guessed from its name (adapt.mjs, propType). */
const propTypes = new Map([...project.library].map(([name, spec]) => [name, spec.props || {}]));
for (const t of targets) {
  const m = t.mapping;
  // `$root` included: a root a sibling variant draws an edge on owes a none too
  const allLayers = [...new Set([...t.variants.values()].flatMap((r) => Object.keys(r.layers)).concat(m.root ? ['$root'] : []))];
  const carried = carriers(t.spec.variants, allLayers);
  const host = m.storyId || P.host.kind === 'fragments' && t.kind === 'component' ? 'page' : m.route ? 'app' : 'page';
  for (const tier of TIERS) {
    for (const [name, r] of t.variants) {
      if ((m.unmeasured || {})[name]) continue;
      const tree = t.spec.variants.find((v) => v.name === name);
      const layers = gates.variantLayers(project, t, name, r);
      for (const l of Object.keys(layers)) mapped.add(`${t.name}:${l}`);
      if (m.root) mapped.add(`${t.name}:$root`);
      const win = windowFor(t, tree);
      const docs = adapt(tree, { root: m.root, layers }, {
        snapshot: project.snapshot, tier, typeTier: typeTierFor(win), parity: P, carried, state: r.pseudo || null,
        children: m.children !== undefined ? m.children : t.kind === 'component' ? P.children : undefined,
        copy: m.copy, runtime: m.runtime, propTypes, attrNaming: ATTR_NAMING,
      });
      jobs.push({ t, name, r, tier, tree, docs, win, frame: frameFor(t, tree), on: r.on || m.state, host, key: `${t.name}/${jobs.length}` });
    }
  }
}

TIME.mark('adapt', performance.now() - T_ADAPT);

/* ── putting pages on screen ───────────────────────────────────────────── */
const needsPage = jobs.some((j) => j.host === 'page');
const needsApp = jobs.some((j) => j.host === 'app' || (j.t.kind === 'screen' && j.t.mapping.route && j.t.mapping.storyId));
let S;
try { S = await TIME.timed('session', () => session(project, { page: needsPage, app: needsApp, browser: jobs.length > 0, say })); }
catch (e) { say(e.message); process.exit(1); }
const { PAGE, ROUTES } = S;
const tabs = S;
const acquire = () => S.acquire();
/* The fixed record the baseline compares is read only where a baseline will
   compare it: the running product behind a story is not dumped, and its
   framework rewrites attributes after load (a server action's id), which two
   readings of the record then disagree on. */
const PROBE = { core: Boolean(P.baseline) || jobs.some((j) => planFor(j.docs).core), instance: P.instance };
const BESIDE = { core: false, instance: P.instance };

/* What one page is asked: each job's layers, the clip question on every
   measured element (once per element), under the host's scope for it. */
const sectionOf = (j, scope) => {
  const { layers } = planFor(j.docs);
  const asked = new Set(j.docs.filter((d) => d.assertions.some((a) => a.prop === '-clipped')).map((d) => d.selector));
  for (const d of j.docs) {
    if (d.status !== 'measure' || !layers[d.layer] || asked.has(d.selector)) continue;
    asked.add(d.selector);
    layers[d.layer].props.push('-clipped');
  }
  return { scope, layers };
};

/* What a component measured in its own right renders as: its mapping's root,
   and the project's instance element (`parity.instance`) where it names one. */
const ownComponents = project.targets.filter((t) => t.kind === 'component');
const instanceOf = (t) => [typeof t.mapping.root === 'string' ? t.mapping.root : null, P.instance ? P.instance.replace('{slug}', t.folder) : null].filter(Boolean);
const instanceSelectors = [...new Set(ownComponents.flatMap(instanceOf))];
const domSections = new Map();
const pageText = new Map();
/* A full run's pictures replace the last run's, so a picture of a target
   that has gone is not compared as if it were current. */
if (SHOTS && fullRun) for (const dir of [SHOTS, path.join(SHOTS, 'frames')]) if (fs.existsSync(dir)) for (const f of fs.readdirSync(dir)) if (f.endsWith('.png')) fs.rmSync(path.join(dir, f));
const framed = [];
/* One picture at a time. The windows measure in parallel, but four of them
   painting and capturing at once gave pictures that moved between two runs of
   the same build (the project check this replaced found it so), so a
   capture waits for the one before it; the measuring does not. */
let capturing = Promise.resolve();
const shoot = (...a) => (capturing = capturing.then(() => shootOne(...a), () => shootOne(...a)));
const shootOne = async (tab, name, win, t, tier) => {
  if (!SHOTS) return;
  const file = path.join(SHOTS, `${name.replace(/[^a-z0-9-]+/gi, '-')}.png`);
  const shot = await shots.take(tab, file, win || DEFAULT_WINDOW);
  // a screen beside its frame's own picture, in the tier the frames are drawn in
  const ref = t && t.kind === 'screen' && t.frame && t.frame.reference;
  if (!ref || tier !== TIERS[0]) return;
  try {
    const r = shots.frameCells({ reference: ref.file, scale: ref.scale, shot, cell: project.limits.frameCell, threshold: project.limits.frameCellThreshold });
    fs.mkdirSync(path.join(SHOTS, 'frames'), { recursive: true });
    fs.writeFileSync(path.join(SHOTS, 'frames', `${t.name}.png`), r.sheet);
    framed.push({ name: t.name, pct: Math.round((r.differ / (r.cols * r.rows)) * 100), differ: r.differ, total: r.cols * r.rows });
  } catch (e) { framed.push({ name: t.name, error: e.message }); }
};

/* Read after the page is up: the copy (once per screen) and the DOM
   coverage (once per component, on the first variant measured). */
async function extras(tab, j, scope, via) {
  /* The copy is asked of a page whose content was written to match the frame
     (a story); the running product holds real data, which is why its route
     takes `appWaivers` — so a page reached only by its route is held to the
     words its mapping names (`copy`), not to every word of the frame. */
  if (j.t.kind === 'screen' && via === 'page' && !pageText.has(j.t.name)) pageText.set(j.t.name, await tab.evaluate(gates.PAGE_TEXT).catch(() => []));
  if (j.t.kind === 'component' && !domSections.has(j.t.name)) {
    // what any variant's mapping measures: an element one variant names is measured
    const all = [...j.t.variants.values()].map((r) => r.layers);
    const selectors = [...new Set([j.t.mapping.root, ...all.flatMap((l) => Object.values(l))].filter((s) => typeof s === 'string'))];
    const slots = [...new Set(all.flatMap((l) => Object.entries(l).filter(([n, s]) => /slot/i.test(n) && typeof s === 'string').map(([, s]) => s)))];
    const mine = new Set(instanceOf(j.t));
    /* The component's own subtree: its root where the mapping names one (a
       story's decorators wrap it in boxes of their own), else the section. */
    const rooted = typeof j.t.mapping.root === 'string';
    const within = rooted ? `${scope || ''} ${j.t.mapping.root}`.trim() : scope || 'body';
    const res = await tab.evaluate(`(${gates.DOM_COVERAGE})(${JSON.stringify([{ key: j.t.name, scope: within, section: !rooted, selectors, slots, own: instanceSelectors.filter((s) => !mine.has(s)) }])}, ${JSON.stringify((P.dom && P.dom.opaque) || null)})`);
    domSections.set(j.t.name, res[0]);
  }
}

/* One job on its own page: the story, or the route. */
async function measureOne(tab, j, via, secondary) {
  const m = j.t.mapping;
  const keepFocus = /focus/.test(j.r.pseudo || '') || Boolean(m.page && m.page.focus);
  const win = j.win || (via === 'app' ? null : WINDOW);
  /* A window a previous job sized stays sized: a job with no window of its
     own gets the browser's, every time, whichever tab it lands on. */
  if (!win) await tab.send('Emulation.clearDeviceMetricsOverride').catch(() => {});
  const name = j.t.name;
  await TIME.timed('open', () => via === 'app'
    ? ROUTES.open(tab, { route: m.route, tier: j.tier, viewport: win, keepFocus })
    : PAGE.open(tab, { storyId: m.storyId, args: j.r.args, tier: j.tier.toLowerCase(), frame: j.frame ? `${j.frame.w ?? ''}x${j.frame.h ?? ''}` : undefined, viewport: win, keepFocus }), name);
  await TIME.timed('drive', () => drivePage(tab, j.t, { pseudo: j.r.pseudo, on: j.on }), name);
  const { read, moved } = await TIME.timed('probe', () => measure(tab, { v: sectionOf(j, null) }, secondary && !planFor(j.docs).core ? BESIDE : PROBE), name);
  if (moved.length) throw new Error(`a measurement did not repeat within one render — ${moved.slice(0, 4).join('; ')}`);
  if (via === j.host) await TIME.timed('extras', () => extras(tab, j, null, via), name);
  if (via === j.host && jobs.find((x) => x.t === j.t && x.tier === j.tier) === j) await TIME.timed('shots', () => shoot(tab, `${j.t.name}${j.tier === TIERS[0] ? '' : '-' + j.tier}`, win, j.t, j.tier), name);
  return read.v;
}

/* Many jobs on one page: the fragments host, one page per tier and window. */
async function measureMany(tab, group, tier, win) {
  const sections = [];
  await TIME.timed('fragments', async () => { for (const j of group) sections.push({ key: j.key, html: await PAGE.fragment(j.t.name, j.r.args), width: j.frame && j.frame.w }); });
  await TIME.timed('open', () => PAGE.open(tab, sections, { tier: tier.toLowerCase(), viewport: win })); // one page for many targets: not attributed
  const held = group.filter((j) => j.r.pseudo).map((j) => {
    if (!j.on) throw new Error(`${j.t.name} ${j.name}: the :${j.r.pseudo} state needs the element that takes it — the mapping declares no \`state\` selector`);
    return { selector: j.on, pseudo: j.r.pseudo, within: PAGE.scope(j.key) };
  });
  if (held.length) await TIME.timed('state', () => forceState(tab, held));
  const { read, moved } = await TIME.timed('probe', () => measure(tab, Object.fromEntries(group.map((j) => [j.key, sectionOf(j, PAGE.scope(j.key))])), PROBE));
  if (moved.length) throw new Error(`a measurement did not repeat within one render — ${moved.slice(0, 4).join('; ')}`);
  for (const j of group) await TIME.timed('extras', () => extras(tab, j, PAGE.scope(j.key), 'page'), j.t.name);
  await TIME.timed('shots', () => shoot(tab, `components-${win[0]}${tier === TIERS[0] ? '' : '-' + tier}`, win, null, tier));
  return read;
}

/* Every waiver a project declares, by target: the mapping's, its variants' own
   tables and its app waivers (lessons.mjs). */
function declaredWaivers(p) {
  const out = [];
  for (const t of p.targets) {
    for (const table of [t.mapping.waivers, t.mapping.appWaivers, ...[...t.variants.values()].map((r) => r.own)]) for (const [key, waiver] of Object.entries(table || {})) out.push({ target: t.name, key, waiver });
  }
  return out;
}
/* The other registered projects' declared waivers, read for a ruling written
   twice; a project this machine does not hold, or cannot load, is left out. */
async function othersDeclared(p) {
  const { projects: registry } = createRequire(import.meta.url)('../snapshot/projects.cjs');
  const out = [];
  for (const o of registry().list) {
    if (!o.repo || samePath(o.repo, p.repo) || !fs.existsSync(o.repo)) continue;
    try { out.push({ project: o.name, declared: declaredWaivers(await loadProject(o.repo)) }); } catch { /* its facts are its own problem */ }
  }
  return out;
}

/* ── measure ───────────────────────────────────────────────────────────── */
const measured = new Map();   // job → records
const appMeasured = new Map();
const errors = new Map();
/* Eight windows by default: the probe idles 200 ms between its two readings
   and a page host's open is mostly waiting, so eight overlap where four left
   the machine half idle — Project C's full run 40 s → 21 s and
   one project's 167 s → 89 s, verdicts identical (2026-10-03). A project with
   less memory sets `parity.workers`. */
const WORKERS = Math.max(1, Number(process.env.PARITY_WORKERS || P.workers || 8));
const T_MEASURE = performance.now();
const queue = [];
if (P.host.kind === 'fragments') {
  const groups = new Map();
  for (const j of jobs.filter((x) => x.host === 'page')) {
    const win = j.win || WINDOW || DEFAULT_WINDOW;
    const k = `${j.tier}|${win[0]}`;
    if (!groups.has(k)) groups.set(k, { tier: j.tier, win, jobs: [] });
    groups.get(k).jobs.push(j);
  }
  for (const g of groups.values()) queue.push({ many: g });
} else for (const j of jobs.filter((x) => x.host === 'page')) queue.push({ one: j, via: 'page' });
for (const j of jobs.filter((x) => x.host === 'app')) queue.push({ one: j, via: 'app' });
// the route beside the story: same spec, layers and waivers, once per tier
const both = new Set();
for (const j of jobs) {
  if (j.t.kind !== 'screen' || j.host !== 'page' || !j.t.mapping.route || both.has(`${j.t.name}|${j.tier}`)) continue;
  both.add(`${j.t.name}|${j.tier}`);
  queue.push({ one: j, via: 'app', secondary: true });
}
let dead = null;
await Promise.all(Array.from({ length: Math.min(WORKERS, queue.length) }, async () => {
  for (let item = queue.shift(); item && !dead; item = queue.shift()) {
    const tab = await acquire();
    try {
      if (item.many) {
        const read = await measureMany(tab, item.many.jobs, item.many.tier, item.many.win);
        for (const j of item.many.jobs) measured.set(j, read[j.key]);
      } else {
        const read = await measureOne(tab, item.one, item.via, item.secondary);
        (item.secondary ? appMeasured : measured).set(item.one, read);
      }
      tabs.release(tab);
    } catch (e) {
      for (const j of item.many ? item.many.jobs : [item.one]) errors.set(item.secondary ? `${j.key}:app` : j.key, e.message);
      if (tab.dead) dead = tab.dead;
      await tabs.discard(tab);
    }
  }
}));
TIME.mark('measure', performance.now() - T_MEASURE);
if (dead) { say(`\nthe run stopped: ${dead.message || dead}. What was not measured is not a pass.`); process.exit(1); }

/* ── judge ─────────────────────────────────────────────────────────────── */
const T_JUDGE = performance.now();
const report = {};
const declarers = [];
const contentDeclarers = [];
let matched = 0, waived = 0, appMatched = 0, appWaived = 0;
/* The largest difference each waiver excused on each target (R2 of the
   2026-10-02 review's second round): a bound shared through a base or a
   spread was the largest sharer's, so on the rest it passed regressions of
   hundreds of pixels. Held here per target, recorded with the accepted run. */
const excusedOff = new Map();   // target name → Map(waiver key → { off, within, table })
const byTarget = new Map();
for (const j of jobs) { if (!byTarget.has(j.t)) byTarget.set(j.t, []); byTarget.get(j.t).push(j); }
const reportKey = (t) => (t.kind === 'component' ? t.folder : t.name);
for (const [t, list] of byTarget) {
  const m = t.mapping;
  const lines = [];
  const mine = report[reportKey(t)] ||= { kind: t.kind, matched: 0, failed: 0, diffs: [] };
  const fail = (n, detail) => { failed += n; mine.failed += n; if (detail && mine.diffs.length < 12) mine.diffs.push(detail); };
  const decl = { name: t.name, declared: { ...m.waivers }, used: new Set() };
  const perVariant = new Map();
  declarers.push(decl);
  if (m.appWaivers) declarers.push({ name: t.name, declared: m.appWaivers, used: decl.used, live: true });
  const show = (r) => `    ${r.kind.padEnd(10)} ${r.layer}${r.prop ? '.' + r.prop : ''}  ${r.detail || `expected ${typeof r.expected === 'string' ? r.expected : JSON.stringify(r.expected)}, measured ${typeof r.actual === 'string' ? r.actual : JSON.stringify(r.actual)}${r.from ? `  (${r.from})` : ''}`}`;
  const judge = (j, read, { app } = {}) => {
    const own = j.r.own || {};
    if (Object.keys(own).length && !perVariant.has(own)) { const d = { name: t.name, declared: own, used: new Set() }; perVariant.set(own, d); declarers.push(d); }
    const ownDecl = perVariant.get(own);
    const scoped = { ...scopedWaivers(m.waivers, j.name), ...scopedWaivers(own, j.name) };
    const extra = app || (j.host === 'app') ? appWaivers(m.appWaivers, j.docs) : {};
    const rows = diff(j.docs, read || {}, { waivers: { ...scoped, ...extra }, tolerances: P.tolerances || {} });
    const note = (key) => { if (!key) return; if (key in (own || {})) ownDecl.used.add(key); else decl.used.add(key); };
    for (const r of rows) note(r.waiver);
    const judgedClip = new Set(j.docs.filter((d) => d.assertions.some((a) => a.prop === '-clipped')).map((d) => d.layer));
    for (const [layer, rec] of Object.entries(read || {})) {
      if (judgedClip.has(layer)) continue;
      const cut = rec && rec['-clipped'];
      if (!cut || cut === 'no') continue;
      const w = scoped[`${layer}.-clipped`] || extra[`${layer}.-clipped`];
      if (w) { note(w.key); continue; }
      rows.push({ kind: 'clipped', layer, prop: '-clipped', detail: `text is cut ${cut}` });
    }
    // Against the product a layer named under appWaivers may be absent: a
    // board with nobody on it draws no cards. Never against a story.
    return rows.filter((r) => { const w = r.kind === 'nomatch' && extra[r.layer]; if (w) note(w.key); return !w; });
  };
  for (const j of list) {
    const err = errors.get(j.key);
    if (err) { lines.push(`  ${t.name} [${j.tier}] ${j.name}: ${err}`); fail(1, `${j.name}: ${err}`); continue; }
    const rows = judge(j, measured.get(j));
    for (const r of rows) if (r.kind !== 'absent') drawn.add(`${t.name}:${r.layer}`);
    const own = j.r.own || {};
    recordExcused(excusedOff, t.name, rows, (key) => (key in own ? own[key] : (m.waivers || {})[key]));
    const bad = rows.filter((r) => BAD.includes(r.kind));
    const ok = rows.filter((r) => r.kind === 'match').length;
    matched += ok; mine.matched += ok;
    waived += rows.filter((r) => r.kind === 'waived').length;
    if (bad.length) {
      fail(bad.length);
      for (const r of bad) if (mine.diffs.length < 12) mine.diffs.push(`${j.name} · ${r.layer}${r.prop ? '.' + r.prop : ''}: ${r.detail || `expected ${r.expected}, measured ${r.actual}`}`);
      lines.push(`\n  ${t.name} [${j.tier}] ${j.name}${j.host === 'app' ? ` — ${m.route}` : ''}`);
      for (const r of bad) lines.push(show(r));
    }
    if (process.env.PARITY_ROWS) fs.appendFileSync(process.env.PARITY_ROWS, JSON.stringify({ target: t.name, kind: t.kind, variant: j.name, tier: j.tier, rows, measured: measured.get(j) }) + '\n');
  }
  // the same spec against the running product, where a story is the primary
  for (const j of list) {
    if (!appMeasured.has(j) && !errors.has(`${j.key}:app`)) continue;
    const err = errors.get(`${j.key}:app`);
    if (err) { lines.push(`\n  ${t.name} [${j.tier}] ${m.route} — the running app: ${err}`); fail(1, `the running app: ${err}`); continue; }
    const rows = judge(j, appMeasured.get(j), { app: true });
    const bad = rows.filter((r) => BAD.includes(r.kind));
    appMatched += rows.filter((r) => r.kind === 'match').length;
    appWaived += rows.filter((r) => r.kind === 'waived').length;
    if (process.env.PARITY_ROWS) fs.appendFileSync(process.env.PARITY_ROWS, JSON.stringify({ target: t.name, kind: t.kind, variant: j.name, tier: j.tier, app: true, rows, measured: appMeasured.get(j) }) + '\n');
    if (bad.length) { failed += bad.length; lines.push(`\n  ${t.name} [${j.tier}] ${m.route} — the running app`); for (const r of bad) lines.push(show(r)); }
  }
  // What it says: every word the frame draws, on the page.
  if (t.kind === 'screen' && pageText.has(t.name)) {
    const { missing, used } = gates.copyMissing(t.spec.variants[0], pageText.get(t.name), { content: m.content, excluded: m.excluded });
    for (const w of missing) { lines.push(`\n  ${t.name}\n    unsaid     the frame says ${JSON.stringify(w)} and the page does not — say it, or say why under \`content\``); fail(1, `the frame says ${JSON.stringify(w)} and the page does not`); }
    if (m.content) contentDeclarers.push({ name: t.name, declared: Object.fromEntries(Object.keys(m.content).map((k) => [k, m.content[k]])), used });
  }
  // What it renders: every element measured, or credited.
  const dom = domSections.get(t.name);
  if (dom && dom.missed.length) {
    lines.push(`\n  ${t.name}\n    unmeasured ${dom.missed.length} of ${dom.total} rendered elements no mapped layer measures: ${[...new Set(dom.missed)].slice(0, 8).join(' ')}${dom.missed.length > 8 ? ' …' : ''}`);
    fail(dom.missed.length, `${dom.missed.length} rendered elements no mapped layer measures`);
  }
  for (const l of lines) say(l);
}

/* ── what only a whole run can judge ───────────────────────────────────── */
TIME.mark('judge', performance.now() - T_JUDGE);
say(`\n${matched} assertions matched, ${waived} waived, ${failed} did not — ${jobs.length} renders of ${targets.length} targets, ${TIERS.join(' + ')}, in ${Math.round(TIME.phases.measure / 1000)}s`);
/* The same specs judged again on the running app beside their stories are
   counted apart, so the line above is one row per assertion per render: a
   join of every judged row (PARITY_ROWS) counts both, which is why one
   project's rows once summed 10,744 above its summary. Their reds are in the
   "did not" above. */
if (appMatched || appWaived) say(`and on the running app beside their stories: ${appMatched} matched, ${appWaived} waived`);
const staleMap = gates.staleMappings(mapped, drawn).filter((l) => !errors.size || ![...errors.keys()].some((k) => k.startsWith(l.split(':')[0] + '/')));
if (staleMap.length) { say(`\nstale mapping — no variant draws: ${staleMap.join(', ')}`); failed += staleMap.length; }
// A waiver is stale only when nothing that declares it used it (gate 6).
const staleW = staleAcross(declarers.filter((d) => targets.includes(project.targets.find((t) => t.name === d.name))));
if (staleW.length) {
  say(`\n${staleW.length} waiver(s) excuse a difference nothing that declares them shows any more — delete them:`);
  for (const { key, names } of staleW) say(`  ${key}   (${names.join(', ')})`);
  failed += staleW.length;
}

/* A bound is the difference it excuses on the target that declares it: one
   that reaches past every difference it excused there by more than a unit
   of rounding (opacity: a hundredth) bounds a regression it was never
   measured against. Judged on a full run, which saw every variant. */
if (fullRun) {
  const loose = looseBounds(excusedOff).map(({ name, key, within, off, excess }) => `  ${name}: ${key} — within ${within} exceeds what it excused by ${excess} (largest difference ${off}); bound it here at ${off} if that difference is the design's, and declare a wider one only on the target that needs it; a waiver this target never used before is a new difference first (gate 12 names it as a part the accepted set does not know)`);
  if (loose.length) {
    say(`\n${loose.length} waiver bound(s) wider than the difference they excuse on the target:`);
    for (const l of loose) say(l);
    failed += loose.length;
  }
}

// A `content` excuse is stale only when no frame that declares it still needs it.
const staleC = gates.staleContent(contentDeclarers);
if (staleC.length) {
  say(`\n${staleC.length} \`content\` excuse(s) for words no frame that declares them is missing any more — delete them:`);
  for (const { key, names } of staleC) say(`  ${JSON.stringify(key)}   (${names.join(', ')})`);
  failed += staleC.length;
}

/* The verdict, through the one writer; a scoped run updates what it measured. */
if (project.paths.parity && typeof project.paths.parity === 'string') {
  if (fullRun) {
    const mappedFolders = new Set(project.targets.filter((t) => t.kind === 'component').flatMap((t) => [t.folder, t.covers].filter(Boolean)));
    const reason = (k) => { const e = project.backlog[k]; return (e && (e.reason || (typeof e === 'string' ? e : null))) || null; };
    for (const f of project.specs.keys()) if (!mappedFolders.has(f) && !report[f]) report[f] = { kind: 'component', matched: 0, failed: 0, unmeasured: true, reason: reason(f) };
    for (const f of project.frames.keys()) if (!project.targets.some((t) => t.kind === 'screen' && t.folder === f) && !report[f]) report[f] = { kind: 'screen', matched: 0, failed: 0, unmeasured: true, reason: reason(f) };
  }
  await TIME.timed('report', async () => saveReport(project.paths.parity, report, { fullRun }));
}

/* Gate 12: nothing moved unmeant. */
const T_BASELINE = performance.now();
if (P.baseline) {
  const B = P.baseline;
  const set = (o) => Object.fromEntries(Object.entries(o || {}).map(([k, v]) => [k, new Set(v)]));
  const net = baseline({ dir: path.join(REPO, B.dir), suites: ['components', 'screens', 'waivers'], volatile: set(B.volatile), contentSized: set(B.contentSized) });
  for (const suite of ['components', 'screens']) {
    const kind = suite === 'components' ? 'component' : 'screen';
    net.dump(suite, jobs.filter((j) => j.t.kind === kind && measured.has(j)).map((j) => [`${j.t.name} › ${j.name} › ${j.tier}`, measured.get(j)]), fullRun ? null : wanted.join(' '));
  }
  // each waiver's largest excused difference per target, held like a measurement
  net.dump('waivers', [...excusedOff].sort(([a], [b]) => compareNames(a, b)).map(([name, at]) => [name, Object.fromEntries([...at].sort(([a], [b]) => compareNames(a, b)).map(([k, { off }]) => [k, { off }]))]), fullRun ? null : wanted.join(' '));
  if (ACCEPT) {
    // a measurement net, not a design verdict: what the run measured is accepted
    // whatever the differ said, and only a whole run can be (baseline.mjs)
    if (net.acceptable() === false) process.exit(1);
    net.accept();
    say('\nthis run is now the accepted measurement');
    /* toolkit-standard §D 8: what this project now rules that the last accepted
       run did not, listed for triage — a project fact or a toolkit lesson —
       with the other registered projects read for the same ruling. */
    const index = path.join(REPO, B.dir, 'accepted', 'lessons.json');
    const mine = [...declaredWaivers(project), ...deviations(REPO, P.stylesheets || [])];
    const first = !fs.existsSync(index);
    const found = first ? [] : FOUND;
    if (first) say(`\n${lessonsIndex(mine).length} rulings recorded as this project's; the next accepted run lists what is new since (toolkit-standard §D 8)`);
    if (found.length) {
      say(`\n${found.length} lesson(s) new since the last accepted run; each is the project's fact (its context document) or the toolkit's (a rule, a scaffold file, an engine rule), decided in this change (toolkit-standard §D 8):`);
      for (const l of found.slice(0, 40)) say(`  ${l.target}${l.on.length > 1 ? ` (+${l.on.length - 1} more)` : ''}: ${l.key} [${l.owner}] — ${String(l.reason).slice(0, 110)}${l.candidate ? ` — toolkit candidate: ${l.candidate} rules the same` : ''}`);
      if (found.length > 40) say(`  … and ${found.length - 40} more`);
      say(`  triaged: ${TRIAGED}`);
    }
    fs.writeFileSync(index, JSON.stringify(lessonsIndex(mine), null, 1) + '\n');
  } else if (fullRun) {
    say('\nthe measurement baseline (gate 12)');
    const code = net.compare();
    if (code) failed += 1;
  }
}

TIME.mark('baseline', performance.now() - T_BASELINE);

/* What the pictures say: never a failure (Pixels are for eyes, never for gates). */
const T_PICTURES = performance.now();
if (SHOTS) {
  const k = shots.compareKept(SHOTS);
  say(`\npictures (advisory) — ${path.relative(REPO, SHOTS) || SHOTS}`);
  if (k.none) say('  nothing kept yet: a full run with --accept --shots keeps this set');
  else {
    for (const [f, note] of k.rows) say(`  ${f.padEnd(40)} ${note}`);
    say(k.rows.length ? `  ${k.rows.length} of ${k.total} pictures changed since the kept set — look before you accept` : `  ${k.total} pictures unchanged since the kept set`);
  }
  for (const f of framed.sort((a, b) => a.name.localeCompare(b.name))) say(f.error ? `  ${f.name}: the frame comparison failed: ${f.error}` : `  ${String(f.pct).padStart(3)}%  ${f.name.padEnd(40)} ${f.differ} of ${f.total} regions differ from the frame`);
  if (framed.length) say(`  contact sheets (design | page | heat): ${path.relative(REPO, path.join(SHOTS, 'frames'))}`);
  if (ACCEPT && fullRun) say(`  ${shots.keep(SHOTS)} pictures kept`);
}

if (SHOTS) TIME.mark('pictures', performance.now() - T_PICTURES);

/* ── where the time went ───────────────────────────────────────────────── */
/* Printed every run and saved beside the measurements (not in the verdict
   report, whose dates mean "verdict last changed"); the accepted run's time is
   the one a full run is held to (timing.mjs). */
const timing = { at: new Date().toISOString(), scope: scopeOf(wanted, targets.length), total: TIME.total(), phases: TIME.phases, targets: TIME.targets };
for (const l of summary(TIME, timing.total)) say(l);
if (P.baseline) {
  const dir = path.join(REPO, P.baseline.dir);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'timing.json'), JSON.stringify(timing, null, 1) + '\n');
  const kept = path.join(dir, 'accepted', 'timing.json');
  if (ACCEPT && fullRun) {
    const held = keep(fs.existsSync(kept) ? JSON.parse(fs.readFileSync(kept, 'utf8')) : null, timing);
    if (held !== timing) say(`  the accepted time stays ${(held.total / 1000).toFixed(1)}s: this run was slower (${(timing.total / 1000).toFixed(1)}s), which an accept must not make the bar`);
    fs.mkdirSync(path.dirname(kept), { recursive: true }); fs.writeFileSync(kept, JSON.stringify(held, null, 1) + '\n');
  }
  else if (fullRun && fs.existsSync(kept)) { const w = slower(JSON.parse(fs.readFileSync(kept, 'utf8')), timing); if (w) say(`  warning: ${w}`); }
}

say(`\n${failed ? 'RED' : 'green'} in ${Math.round(timing.total / 1000)}s`);
process.exit(failed ? 1 : 0);
