#!/usr/bin/env node
/*
 * tools/snapshot/recipes.cjs — what a project's stored screens repeat, as a
 * recipe an agent can build a screen from (knowledge/code/agent-prototyping.md).
 *
 *   node tools/snapshot/recipes.cjs --repo <dir>
 *
 * Prints JSON, derived from design/screens and never hand-written (§D 23), so
 * the next snapshot changes it; tools/snapshot/README.md, *Screen recipes*,
 * says what each key holds. A shell is keyed by its top level's node types
 * (`{component}`, `{frame}`, …); a region is a frame; an instance is
 * entered only at its slots, whose content each screen composes; an
 * `absolute` child is an overlay; components and frames are tallied apart;
 * what varies is counted, never chosen; a name the taxonomy does not read is listed.
 *
 * Written 2026-11-04, after a trial by hand over one project's 114 stored
 * screens found two shells and two kinds of content, all bound to tokens.
 */
const path = require('node:path');
const { readScreens, paths, FRAME_NAME } = require('./store.cjs');
const { nameOf } = require('./graph.cjs');

// an instance by its component's name (before the variant), a frame by its own; the two are
// tallied apart, since a frame named like a component is not that component (a frame
// "Empty state" wrapping the Empty state component, 2026-11-04)
// through graph.cjs's one resolver: the set's name is the longest start holding no Property=value
const label = (n) => (n.instanceOf ? nameOf(n.instanceOf, (x) => !x.includes('=')) : n.name);
const isInstance = (n) => !!n.instanceOf || n.type === 'INSTANCE';
const isFrame = (n) => n.type === 'FRAME' && !isInstance(n);
const tally = (m, k) => { if (k != null) m[k] = (m[k] || 0) + 1; };
const kinds = () => ({ components: {}, frames: {} });
// a component or a frame into its own tally; shapes, vectors and text are neither
const count = (t, n) => { if (isInstance(n)) tally(t.components, label(n)); else if (isFrame(n)) tally(t.frames, label(n)); };
const sorted = (m) => Object.fromEntries(Object.entries(m).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])));

function derive(screens) {
  const shells = new Map(), regions = new Map(), types = new Map(), unnamed = [], spelled = {};
  for (const s of screens) {
    const t = s.tree || {};
    const kids = t.children || [];
    const laid = kids.filter((c) => !c.absolute), over = kids.filter((c) => c.absolute);
    const m = FRAME_NAME.exec(s.name || '');
    // a section as the taxonomy reads it: case-blind, spelled as first seen
    const section = m ? (spelled[m[1].toLowerCase()] ??= m[1]) : null;

    const named = laid.map((c) => (isInstance(c) ? { component: label(c) } : { [String(c.type || 'node').toLowerCase()]: label(c) }));
    const key = JSON.stringify(named);
    const sh = shells.get(key) || { regions: named, screens: 0, overlays: kinds(), sections: new Set() };
    sh.screens++; for (const o of over) count(sh.overlays, o); if (section) sh.sections.add(section);
    shells.set(key, sh);

    // each frame path once per screen for the screen count, every occurrence for the values
    const seen = new Set();
    const region = (c, p) => {
      const r = regions.get(p) || { path: p, screens: 0, occurrences: 0, children: kinds(), overlays: kinds(), gap: {}, pad: {} };
      if (!seen.has(p)) { r.screens++; seen.add(p); }
      r.occurrences++;
      for (const k of c.children || []) count(k.absolute ? r.overlays : r.children, k);
      // a side with no token is its raw number, marked: an unbound value is itself what to fix
      const b = c.bindings || {};
      const raw = (v) => (v == null ? null : `${v} (unbound)`);
      // a space-between row has no gap (Figma ignores the number the plugin records), and a grid's
      // row and column gaps are not that number either: neither is a value to bind
      tally(r.gap, /SPACE_BETWEEN/.test(c.align || '') ? 'auto (space between)' : c.layout === 'GRID' ? null : b.gap || raw(c.gap));
      const pads = [0, 1, 2, 3].map((i) => (Array.isArray(b.pad) && b.pad[i]) || raw(Array.isArray(c.pad) ? c.pad[i] : null));
      if (pads.some((v) => v != null)) tally(r.pad, pads.map((v) => v ?? '?').join(' '));
      regions.set(p, r);
    };
    // the slots inside an instance, through any instance nested in it, never inside a slot
    // each with the instances between, so a slot of a Tabs inside a Page header reads Page header/Tabs/Content slot
    const slots = (n, chain = [], out = []) => { for (const k of n.children || []) { if (k.type === 'SLOT') out.push([k, chain]); else slots(k, isInstance(k) ? [...chain, label(k)] : chain, out); } return out; };
    const walk = (n, trail) => {
      for (const c of n.children || []) {
        // an instance's insides are its component's, except its slots, which each screen fills
        if (isInstance(c)) { for (const [sl, chain] of slots(c)) { const t2 = [...trail, label(c), ...chain, sl.name]; region(sl, t2.join('/')); walk(sl, t2); } continue; }
        // only a frame is a region, and an absolute one is an overlay
        if (!isFrame(c) || c.absolute) continue;
        const t2 = [...trail, label(c)];
        region(c, t2.join('/'));
        walk(c, t2);
      }
    };
    walk(t, []);

    if (!m) unnamed.push(s.name || s.id);
    else {
      const [screen, state] = m[4].split(' - ');
      const k = `${section} / ${screen}`;
      const ty = types.get(k) || { section, screen, states: new Set() };
      ty.states.add(state ? state.replace(/ \d+$/, '') : 'Default');
      types.set(k, ty);
    }
  }
  const repeated = [...regions.values()].filter((r) => r.screens >= 2).sort((a, b) => b.screens - a.screens || a.path.localeCompare(b.path))
    .map((r) => ({ ...r, children: { components: sorted(r.children.components), frames: sorted(r.children.frames) }, overlays: { components: sorted(r.overlays.components), frames: sorted(r.overlays.frames) }, gap: sorted(r.gap), pad: sorted(r.pad) }));
  return {
    screens: screens.length,
    shells: [...shells.values()].sort((a, b) => b.screens - a.screens).map((s) => ({ ...s, overlays: { components: sorted(s.overlays.components), frames: sorted(s.overlays.frames) }, sections: [...s.sections].sort() })),
    regions: repeated,
    varies: repeated.flatMap((r) => ['gap', 'pad'].filter((k) => Object.keys(r[k]).length > 1).map((k) => ({ path: r.path, what: k, values: r[k] }))),
    // a name rule 24's taxonomy does not read is listed, never dropped quietly
    unnamed,
    screenTypes: [...types.values()].sort((a, b) => a.section.localeCompare(b.section) || a.screen.localeCompare(b.screen)).map((t) => ({ ...t, states: [...t.states].sort() })),
  };
}

module.exports = { derive };

if (require.main === module) {
  const argv = process.argv.slice(2);
  const i = argv.indexOf('--repo');
  if (i < 0 || !argv[i + 1]) { console.error('usage: recipes.cjs --repo <project repo>'); process.exit(2); }
  const repo = path.resolve(argv[i + 1]);
  const config = require('../shared/repo-config.cjs').repoConfig(repo, 'recipes');
  const dir = paths(repo, config.paths || {}).screens;
  const screens = readScreens(dir);
  if (!screens.length) { console.error(`recipes: no stored screens in ${dir} — nothing to derive, and that is not a recipe`); process.exit(1); }
  console.log(JSON.stringify(derive(screens), null, 2));
}
