#!/usr/bin/env node
/*
 * The facts this skill judges, read from a stored snapshot instead of Figma.
 *
 *   node scripts/from-snapshot.mjs --input facts-in.json [--tokens t.json]
 *
 * `scripts/foundations.js` gathers { pages, components } from the live file
 * and hands them to `checkFacts`, which is pure. Every one of those facts is
 * already in the snapshot — `_meta.pages` is the page list in file order, and
 * each component's stored spec carries its name, its id, its page and, on
 * every instance inside its variants, the component that instance is of. So
 * the live read was a second reader of facts the store already held, which is
 * the thing toolkit-standard §D 5 exists to stop; this is the adapter that
 * makes the snapshot the input and leaves the live path for a file with no
 * project.
 *
 * The caller hands in `{ pages, specs, icons }` — the page names in file
 * order, one RESOLVED spec per component (`{ name, id, page, variants:
 * [tree] }`, the shape `component-validator --snapshot` also takes), and the
 * components that live on an icon page as `{ name, page }`. Resolving a
 * stored spec belongs to whoever owns the store, not to a skill: a skill is
 * self-contained and reads no file outside its own folder, so it takes the
 * trees rather than reaching for the toolkit's reader.
 *
 * `icons` is separate because an icon page's components have no stored spec —
 * the page is exported as SVGs, and a spec per glyph would swamp the store
 * and give a docs site a page per icon. Their names are stored; the page they
 * sit on is stored from plugin 0.35.0. Without them this path saw 40 of one
 * library's 69 components and could not say which 29 it was missing.
 *
 * Two facts the snapshot cannot give, and the caller is told rather than left
 * to assume: a page's node id (the store keeps page NAMES, in order — every
 * rule here reads names, and the finding's id is only a link), and a page that
 * holds no component at all (the store writes a folder per component, so a
 * page reaches it only through one). The first costs nothing; the second means
 * an empty page is invisible to the snapshot path, and the run says so.
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));

/*
 * A component's name as the audit knows it, from what the plugin recorded on
 * an instance: `"Set / Variant"` names the set, a bare name names itself.
 *
 * Cutting at the FIRST " / " is wrong, and wrong on real libraries: a
 * component may be called `_File explorer - Section / L1` or `Table - Cell /
 * Fill`, so the cut takes half its name and the instance resolves to nothing.
 * 42 stored components in two projects carry a " / " in their own name, and
 * 447 of one library's 4,873 edges were lost this way.
 *
 * The store knows every component's name, so the answer is not to guess where
 * the name ends: take the LONGEST stored name the string starts with, on a
 * " / " boundary. `Table - Cell / Fill / Size=md` then resolves to `Table -
 * Cell / Fill` where that exists and `Table - Cell` where it does not, which
 * is the fact rather than a rule about slashes.
 */
const setOf = (instanceOf, known) => {
  const s = String(instanceOf || '').trim();
  if (!s) return '';
  if (known) {
    let best = '';
    for (const n of known) {
      if (n.length <= best.length) continue;
      if (s === n || s.startsWith(n + ' / ')) best = n;
    }
    if (best) return best;
  }
  return s.split(' / ')[0].trim();
};

/*
 * What the FILE calls a component, which is not always what the store does.
 * A component whose name does not begin with its page's name is stored
 * namespaced — `cursor` on the `❖ Graphic` page is stored as `Graphic/cursor`
 * — and every rule here reads names, so reading the display name reports the
 * namespace as the designer's slash. It did: six "grouped name uses a bare /"
 * findings against a library that has none, disproved by a live run of the
 * same file.
 *
 * Plugin 0.34.0 records `figmaName` wherever the two differ, which settles it
 * exactly. An older store cannot be settled at all — a prefixed `cursor` and a
 * component genuinely called `Graphic/cursor` are the same string there — so
 * the prefix is stripped (the far commoner case, and the one that does not
 * invent a finding) and the component is named in `unsettled`, for a run to
 * report as unchecked rather than clean.
 */
const bare = (page) => String(page || '').replace(/^\W+\s*/, '').trim();
function fileName(spec) {
  if (spec.figmaName) return { name: spec.figmaName, unsettled: false };
  const prefix = bare(spec.page) + '/';
  if (bare(spec.page) && String(spec.name || '').startsWith(prefix)) {
    return { name: String(spec.name).slice(prefix.length), unsettled: true };
  }
  return { name: spec.name, unsettled: false };
}

/**
 * { pages, components } from a stored snapshot, in `checkFacts`'s own shape.
 * `tokens` is the library's audit settings (the same TOKENS the live body
 * takes); it decides which pages are in scope, exactly as it does live.
 */
export function factsFromSnapshot({ pages: names = [], specs = [], icons = [] }, T = {}, opts = {}) {
  const SECTION = T.sectionHeader ? new RegExp(T.sectionHeader) : null;
  const SKIP = new Set(T.excludeSections || []);
  const PAGES = T.componentPages ? new RegExp(T.componentPages) : null;

  // The page list, in the file's order, with each page's section carried down
  // from the last header — the same walk the live body does over
  // figma.root.children.
  const pages = names.map((name) => ({ name, id: null }));
  const sectionOf = new Map();
  let section = null;
  for (const name of names) {
    if (SECTION && SECTION.test(name)) section = name;
    sectionOf.set(name, section);
  }

  const components = [];
  const byName = new Map();      // by the file's name, for the rules
  const byStored = new Map();    // by the store's name, for instanceOf
  const ambiguous = new Set();   // names two stored specs both claim
  const unsettled = [];
  for (const s of specs) {
    const sec = sectionOf.get(s.page) || null;
    const inScope = !(sec && SKIP.has(sec)) && !(PAGES && !PAGES.test(s.page || ''));
    const f = fileName(s);
    if (f.unsettled) unsettled.push(s.name);
    const c = { name: f.name, id: s.id || null, page: s.page || '', inScope, parents: [] };
    components.push(c);
    byName.set(c.name, c);
    /*
     * A name that two stored specs claim is AMBIGUOUS, not the second one.
     * One project defines `Button`, `Avatar`, `Badge` and twelve more in both
     * its web and its mobile library; `instanceOf` carries no file, so the
     * name alone cannot say which was placed. Keeping the last silently
     * credited every one of those to whichever library was read second —
     * which is how one component's used-by list came to name `Button` twice.
     *
     * Ambiguous names resolve to nothing. Figma-standard rule 9 already exempts a part with
     * more than one parent, so refusing to guess costs a finding it would not
     * have trusted anyway; guessing costs a wrong one, filed against a real
     * component, for a designer to go and not find.
     */
    if (byStored.has(s.name)) ambiguous.add(s.name); else byStored.set(s.name, c);
  }

  // An icon page's components: a name and a page, no tree. They are leaves —
  // an icon holds no instance — so nothing is lost by having no spec, and the
  // consumers' own trees still credit them as children below.
  for (const i of icons) {
    if (byName.has(i.name)) continue;
    const sec = sectionOf.get(i.page) || null;
    const inScope = !(sec && SKIP.has(sec)) && !(PAGES && !PAGES.test(i.page || ''));
    const c = { name: i.name, id: null, page: i.page || '', inScope, parents: [] };
    components.push(c);
    byName.set(c.name, c);
    byStored.set(c.name, c);
    // A consumer names an icon the way the store names any component whose
    // name does not begin with its page's — `plus` on an `Icon` page is
    // `Icon/plus` in a `instanceOf`. The icon itself is stored under its bare
    // name, so both forms address it or eleven icons arrive with no parent
    // that the live file gives them.
    const ns = bare(i.page);
    if (ns && !String(i.name).startsWith(ns)) byStored.set(ns + '/' + i.name, c);
  }

  /*
   * PARENTS — SUPPLIED IF THE CALLER HAS THEM.
   *
   * Which component is placed inside which is one relation with one owner:
   * `tools/snapshot/graph.cjs`, which resolves an instance by
   * the key the plugin recorded, then by node id, then by name within one
   * file. A skill may not require it — a skill is self-contained — so it
   * takes the relation as INPUT, which is what `graph.cjs`'s own header says
   * this file does and, until now, it did not.
   *
   * What it does instead, below, resolves by display name alone. That is
   * strictly weaker: a project defining `Button`, `Icon container` and
   * `State layer` in two of its files cannot be settled by a name, and the
   * two derivations disagree on 40 of 196 components in one real library: the
   * name walk credits 84 with a parent and the supplied relation 94.
   * `_App switcher - Item` gains the parent a name could not reach, and
   * `_Avatar - Colour` loses a credit to `Avatar` that the names invented.
   * (An earlier note here cited `Icon container` losing 20 parents. That was
   * wrong and is the reason this one carries its method: `Icon container` is
   * a name two of that project's files define, so it gets no parents on
   * EITHER path — `parentsByName` drops a shared name rather than guess.)
   * The name walk stays as the
   * fallback because a store may be read with nothing else in hand, and
   * because figma-standard rule 9 is the only consumer and refuses an ambiguous name
   * anyway. `parentsFrom` in the result says which was used, so a reader is
   * never left to assume the stronger one.
   *
   * `opts.parents` is `{ "<component name>": ["<parent name>", …] }`.
   */
  const given = opts.parents && typeof opts.parents === 'object' ? opts.parents : null;
  if (given) {
    for (const c of components) {
      const list = given[c.name];
      if (!Array.isArray(list)) continue;
      for (const parent of list) if (parent && parent !== c.name && !c.parents.includes(parent)) c.parents.push(parent);
    }
  }

  // Parents: every instance sitting DIRECTLY inside one of a set's variants,
  // with no other instance between them — a child of a child credited to its
  // grandparent is a defect this walk has produced before. The stored tree
  // keeps an instance's own children, so the same guard applies.
  for (const s of (given ? [] : specs)) {
    const parent = byStored.get(s.name);
    if (!parent) continue;
    const seen = new Set();
    for (const v of s.variants || []) {
      const go = (n, insideInstance) => {
        for (const k of n.children || []) {
          if (k.type === 'INSTANCE') {
            if (!insideInstance) {
              const key = v.name + '::' + k.name;
              if (!seen.has(key)) {
                seen.add(key);
                const of = setOf(k.instanceOf, byStored.keys());
                const child = ambiguous.has(of) ? null : (byStored.get(of) || byName.get(of));
                if (child && child !== parent && !child.parents.includes(parent.name)) child.parents.push(parent.name);
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

  return {
    facts: { pages, components },
    // Which derivation stood behind `parents`. `names` is the weaker one and
    // says so, rather than letting a reader assume the relation was resolved
    // by identity.
    parentsFrom: given ? 'given' : 'names',
    unread: names.filter((n) => !components.some((c) => c.page === n)),
    // Names the store cannot settle: re-snapshot with plugin >= 0.34.0 and
    // this list empties. Until it does, a name check over these is unchecked,
    // not clean.
    unsettled,
  };
}

if (process.argv[1] && process.argv[1].endsWith('from-snapshot.mjs')) {
  const arg = (f, d) => { const i = process.argv.indexOf(f); return i === -1 ? d : process.argv[i + 1]; };
  const input = arg('--input', null);
  if (!input) { console.error('usage: from-snapshot.mjs --input <{pages, specs}.json> [--tokens t.json] [--parents p.json]'); process.exit(2); }
  const T = arg('--tokens', null) ? JSON.parse(readFileSync(arg('--tokens'), 'utf8')) : {};
  // Which component is placed inside which, from whoever owns that relation
  // — `tools/snapshot/graph.cjs` in this toolkit. Without it
  // this falls back to matching display names, which cannot settle a name two
  // of a project's files both define; the output says which was used.
  const parents = arg('--parents', null) ? JSON.parse(readFileSync(arg('--parents'), 'utf8')) : null;
  // The scanner body returns checkFacts when `figma` is not in scope — the
  // same door the skill's own tests use, and why it is a pure function.
  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
  const checkFacts = await new AsyncFunction(readFileSync(join(HERE, 'foundations.js'), 'utf8'))();
  const { facts, unread, unsettled, parentsFrom } = factsFromSnapshot(JSON.parse(readFileSync(input, 'utf8')), T, parents ? { parents } : {});
  const out = checkFacts(facts, T);
  console.log(JSON.stringify({ audited: out.audited, reach: out.reach, ran: out.ran, notRun: out.notRun,
    pages: facts.pages.length, components: facts.components.length,
    parentsFrom, pagesWithNoComponent: unread, namesNotSettled: unsettled }, null, 2));
}
