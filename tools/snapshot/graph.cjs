/*
 * The component dependency graph, from a stored snapshot and nothing else.
 *
 *   const { graphOf } = require('./graph.cjs');
 *   const g = graphOf({ specs, icons });
 *   g.uses.get('Button')    // what Button is built from
 *   g.usedBy.get('Icon')    // what places Icon
 *
 * WHY IT LIVES HERE. Reading a stored snapshot is this module's job
 * (`owned.json`), and it already owns `resolve()` and the store's index. Two
 * other places had grown their own half of this relation — the component-graph
 * plugin computes it live from Figma, correctly, by node identity, for
 * questions only a live read can answer (is this external component still
 * published, is this main deleted); and `figma-foundations-audit` re-derived a
 * parents-only version by matching display names, for figma-standard rule 9. A third
 * copy in the docs site would have been the worst of the three, which is what
 * toolkit-standard §D 1 exists to prevent.
 *
 * A skill cannot require this file — a skill is self-contained and reads
 * nothing outside its own folder — so a skill takes the relation as INPUT,
 * exactly as `from-snapshot.mjs` already takes resolved trees. The docs site
 * may require it, as it already requires the store's other readers.
 *
 * IDENTITY, NOT NAMES. An instance is resolved by the key the plugin recorded
 * for its main component, falling back to the node id within one file, and to
 * the display name only where the store predates both. The name path is kept
 * because a snapshot taken before plugin 0.36.0 has nothing else — and it is
 * reported, per run, as the number of edges that had to guess, because a
 * resolver that silently degrades is one nobody notices has.
 *
 * Names are why the fallback is a last resort: one project defines `Button`,
 * `Avatar`, `Badge` and twelve more in BOTH its web and its mobile library,
 * and `instanceOf` carries no file, so a name cannot say which was placed.
 * And a component may genuinely be named `Table - Cell / Fill`, so cutting at
 * the first " / " takes half its name — 42 components across two projects are
 * named that way, and one library lost 447 of 4,873 edges to that cut.
 */
'use strict';
const spec = require('./spec.cjs');
const { compareNames } = require('../shared/output.mjs');

/** The set a variant belongs to, as the plugin writes it: `Set / Variant`.
    `known` is the stored names, or a test a name passes when the caller has it
    (a library map); every reader of `instanceOf` resolves it here, never by
    cutting at the first " / ". */
function nameOf(instanceOf, known = []) {
  const s = String(instanceOf || '').trim();
  if (!s) return '';
  const parts = s.split(' / ');
  const has = typeof known === 'function' ? known : ((set) => (n) => set.has(n))(new Set(known));
  // Longest name the string starts with, on a " / " boundary.
  for (let k = parts.length; k > 0; k--) { const n = parts.slice(0, k).join(' / ').trim(); if (has(n)) return n; }
  return parts[0].trim();
}

/**
 * `{ specs, icons }` in, the graph out. `specs` are RESOLVED specs — the
 * caller resolves, because a delta variant can swap an instance and reading a
 * delta flat is a trap the parity skill already documents.
 *
 * Returns `{ uses, usedBy, unresolved, byName, guessed }`:
 *   uses    Map<component, [{ name, kind, via }]>   what it is built from
 *   usedBy  Map<component, [component]>              what places it
 *   unresolved  [{ from, instanceOf }]               edges to nothing stored
 *   guessed     number                               edges resolved by NAME
 */
function graphOf({ specs = [], icons = [] } = {}) {
  /*
   * Keyed by the caller's own id — a folder — never by the name.
   *
   * Two components may share a name; keying the OUTPUT by it merged them, so
   * One project's web Button and its mobile Button accumulated into one entry
   * and the page listed "Icon container, Icon container, State layer, State
   * layer". The name is what an instance is recorded against, and it is
   * ambiguous; the folder is what the store calls this component, and it is
   * not. The name stays as the label.
   */
  const idOf = (s) => s.folder || s.key || s.id || s.name;
  const byKey = new Map(), byId = new Map(), byName = new Map(), ambiguous = new Set();
  const kindOf = new Map();
  // A name, resolved WITHIN one file. A project may snapshot several Figma
  // files into one store and define `Button`, `Avatar`, `State layer` and a
  // dozen more in two of them; a name cannot say which was placed, but a
  // component placing another almost always places the one from its own
  // file. So the same-file answer is tried before the ambiguity is refused —
  // which is the difference between a graph and an empty page, since the
  // colliding names are exactly the shared parts everything is built from.
  const byFileName = new Map();
  const labelOf = new Map();   // id -> the name a reader sees
  for (const s of specs) {
    if (s.key) byKey.set(s.key, idOf(s));
    if (s.id) byId.set(s.id, idOf(s));
    // A name two specs both claim identifies neither. Figma-standard rule 9 already exempts
    // a part with more than one parent, so refusing to guess costs a finding
    // nobody trusted; guessing costs a wrong one against a real component.
    if (byName.has(s.name)) ambiguous.add(s.name); else byName.set(s.name, idOf(s));
    if (s.file) byFileName.set(s.file + '\u0000' + s.name, idOf(s));
    kindOf.set(idOf(s), 'component');
    labelOf.set(idOf(s), s.name);
  }
  for (const i of icons) {
    if (!byName.has(i.name)) byName.set(i.name, i.name);
    kindOf.set(i.name, 'icon');
    labelOf.set(i.name, i.name);
    // An icon page's components are stored under a bare name; a consumer may
    // record it namespaced by its page.
    const ns = String(i.page || '').replace(/^\W+\s*/, '').trim();
    if (ns && !String(i.name).startsWith(ns)) byName.set(ns + '/' + i.name, i.name);
  }

  const uses = new Map(), usedBy = new Map(), unresolved = [];
  let guessed = 0;
  const known = [...byName.keys()];

  for (const s of specs) {
    const seen = new Set();
    for (const v of s.variants || []) {
      // Directly inside the variant only. An instance nested inside another
      // instance belongs to THAT component, not to this one — crediting a
      // child of a child to its grandparent is a defect both the plugin and
      // the foundations walk carry a guard against, each having had it.
      const go = (n, insideInstance) => {
        for (const k of n.children || []) {
          if (k.type === 'INSTANCE') {
            if (!insideInstance) {
              let to = null, via = null;
              if (k.instanceOfKey && byKey.has(k.instanceOfKey)) { to = byKey.get(k.instanceOfKey); via = 'key'; }
              else if (k.instanceOfId && byId.has(k.instanceOfId)) { to = byId.get(k.instanceOfId); via = 'id'; }
              else {
                const guess = nameOf(k.instanceOf, known);
                if (guess && s.file && byFileName.has(s.file + '\u0000' + guess)) { to = byFileName.get(s.file + '\u0000' + guess); via = 'same-file'; guessed++; }
                else if (guess && !ambiguous.has(guess) && byName.has(guess)) { to = byName.get(guess); via = 'name'; guessed++; }
                else if (k.instanceOf) unresolved.push({ from: idOf(s), name: s.name, instanceOf: k.instanceOf });
              }
              if (to && to !== idOf(s) && !seen.has(to)) {
                seen.add(to);
                if (!uses.has(idOf(s))) uses.set(idOf(s), []);
                uses.get(idOf(s)).push({ id: to, name: labelOf.get(to) || to, kind: kindOf.get(to) || 'component', via });
                if (!usedBy.has(to)) usedBy.set(to, []);
                if (!usedBy.get(to).some((x) => x.id === idOf(s))) usedBy.get(to).push({ id: idOf(s), name: s.name });
              }
            }
            go(k, true);
          } else {
            go(k, insideInstance);
          }
        }
      };
      go(v, false);
    }
  }
  /*
   * What each direct dependency BRINGS with it, one level further.
   *
   * The edges are deliberately one level: an instance inside an instance
   * belongs to the component it is in, and flattening would credit a
   * grandchild to its grandparent — the defect every walk of this kind has
   * had. But a reader asking what a button is built from is not helped by
   * being told only "Icon container" when the loading spinner they can see is
   * inside it. So each dependency names its own, without either claiming them
   * as the parent's or hiding them.
   */
  for (const [id, list] of uses) {
    for (const u of list) {
      const theirs = uses.get(u.id) || [];
      if (theirs.length) u.brings = theirs.map((t) => t.name);
    }
  }
  for (const list of uses.values()) list.sort((a, b) => compareNames(a.name, b.name));
  for (const list of usedBy.values()) list.sort((a, b) => compareNames(a.name, b.name));
  return { uses, usedBy, unresolved, guessed, ambiguous: [...ambiguous] };
}

/** Resolve a stored spec, the way every reader of this store must. */
const resolved = (s) => ({ ...s, variants: spec.resolve(s).variants });

/*
 * The relation in the shape a SKILL can take: `{ "<component>": ["<parent>"] }`.
 *
 * A skill is self-contained and may not require this file, so it takes the
 * relation as input — `figma-foundations-audit`'s `factsFromSnapshot` has a
 * `parents` option for exactly this, and its CLI a `--parents` flag. Keyed by
 * display NAME rather than by folder, because that is the only handle a skill
 * reading a stored snapshot has; a name two specs share is dropped, since
 * handing a skill an answer that names the wrong component is worse than
 * handing it none, and figma-standard rule 9 exempts a multi-parent part anyway.
 */
function parentsByName(graph, specs = []) {
  const nameOfId = new Map(specs.map((s) => [s.folder || s.key || s.id || s.name, s.name]));
  const shared = new Set();
  const seen = new Set();
  for (const s of specs) { if (seen.has(s.name)) shared.add(s.name); else seen.add(s.name); }
  const out = {};
  for (const [id, list] of graph.usedBy || new Map()) {
    const child = nameOfId.get(id);
    if (!child || shared.has(child)) continue;
    const parents = [...new Set(list.map((u) => u.name).filter((n) => n && n !== child && !shared.has(n)))];
    if (parents.length) out[child] = parents;
  }
  return out;
}

module.exports = { graphOf, resolved, nameOf, parentsByName };

/*
 * CLI — the producer for `figma-foundations-audit --parents`.
 *
 *   node tools/snapshot/graph.cjs --project <label> > parents.json
 *
 * Without this the skill's `--parents` option was documented and unbuildable:
 * a flag with no way to make its input, which is the "documented but not
 * executable" gap this repo's rules name — it gets re-derived by hand every
 * time, and the hand-written version is where the defects come from. The
 * relation has one owner, so the owner ships the way to get it out.
 */
if (require.main === module) {
  const fs = require('fs');
  const arg = (f) => { const i = process.argv.indexOf(f); return i > -1 ? process.argv[i + 1] : null; };
  const label = arg('--project');
  if (!label) { console.error('usage: graph.cjs --project <label>'); process.exit(2); }
  const dir = require('./projects.cjs').layout(null, label).paths.components;
  if (!dir || !fs.existsSync(dir)) { console.error('no stored components at ' + dir); process.exit(2); }
  // the store's one reader, resolved; each spec keyed by its folder
  const specs = require('./store.cjs').readSpecs(dir).map(({ folder, spec: s }) => Object.assign(s, { folder }));
  const g = graphOf({ specs });
  // To stdout, so it pipes; the counts to stderr, so they do not.
  const out = parentsByName(g, specs);
  console.error(specs.length + ' specs, ' + Object.keys(out).length + ' components with a parent, ' +
                g.guessed + ' edge(s) resolved by name' + (g.ambiguous.length ? ', ' + g.ambiguous.length + ' name(s) two specs share and dropped' : ''));
  console.log(JSON.stringify(out, null, 2));
}
