// verify.js - run inside figma_execute to check a completed description run.
//
// Usage:
//   1. Load this fileKey's settings from the project's context document (SKILL.md
//      workflow step 0) and fill CONFIG below from them.
//   2. Paste the body below into a figma_execute call.
//
// This script is portable and ships as part of the skill; CONFIG is the only
// thing that changes per library. Never hardcode a library's values here —
// fill them fresh from the matching rulebook each run, since a rulebook
// is a living document and its settings can change between runs.
//
// It sweeps the whole file rather than a target list, so it independently re-derives
// which components should have been written. That is deliberate: a target list built
// by the same faulty reasoning as the run would not catch a missed subject.

const CONFIG = {
  // Every value is the project's, from its settings (house defaults beneath).
  // null or [] skips the check that needs it; nothing here is a default.
  internalPrefix: null,      // naming.internalPrefix
  separator: null,           // naming.groupSeparator, trimmed: virtual-set siblings
  statusMarker: null,        // pages.statusMarker: stripped before names are compared
  headerName: null,          // documentation header layer; null if the library has none
  headerBodyLayer: null,
  headings: [],              // the project's description headings, in its dialect
  requiredHeadings: [],
  forbiddenChars: [],        // the project's punctuation constraints
  // Slot-only children are DERIVED below from real instances, so this list is only
  // for a component the walk cannot see as one. Leave it empty unless a run has
  // shown the walk wrong.
  compactTierExtra: []
};

const CONTENT = ['TEXT','INSTANCE','VECTOR','RECTANGLE','ELLIPSE','LINE','POLYGON','STAR','BOOLEAN_OPERATION'];

// A broken instance layer can throw "does not exist" on any read of its name or
// parent (one library had a node like that three instances deep), and one throw
// used to end the whole check. Every read below that walks arbitrary nodes goes
// through `safe`; a node it cannot read counts as inside a component, so it is
// never mistaken for loose page content, and the instance walk lists the ones
// it skipped, by id, as `brokenInstances`. Only "does not exist" is caught: any
// other error is a fault in this script or in Figma, and a guard that swallowed
// it would report a healthy instance as broken and check nothing.
const GONE = /does not exist/;
const safe = (fn, fallback) => { try { return fn(); } catch (e) { if (GONE.test(e && e.message)) return fallback; throw e; } };
const brokenInstances = [];

const inComponent = (n) => safe(() => {
  let q = n.parent;
  while (q && q.type !== 'PAGE' && q.type !== 'DOCUMENT') {
    if (q.type === 'COMPONENT' || q.type === 'COMPONENT_SET') return true;
    q = q.parent;
  }
  return false;
}, true);

const firstSentenceOf = (md) => {
  const purpose = (md || "").split("\n")[0].trim();
  return (purpose.match(/^.*?\.(?=\s|$)/) || [purpose])[0].trim();
};

// Filled by the instance walk below, before any subject is checked.
const derivedCompact = new Map();   // component id -> { name, why }
const isCompactTier = (n) =>
  (CONFIG.internalPrefix && n.name.startsWith(CONFIG.internalPrefix)) || CONFIG.compactTierExtra.includes(n.name) || derivedCompact.has(n.id);

const publicsOf = (page) => page.findAllWithCriteria({ types: ['COMPONENT_SET', 'COMPONENT'] })
  .filter(n => !(n.type === 'COMPONENT' && n.parent && n.parent.type === 'COMPONENT_SET'));

// Figma refuses to read the definitions of a set it considers broken ("Component set has
// existing errors") and throws, which used to end the whole sweep on one bad set. That
// error, or a layer that "does not exist", is the set's; any other ends the check.
const defsOf = (n) => { try { return n.componentPropertyDefinitions || {}; } catch (e) { if (/existing errors|does not exist/.test(e && e.message)) return null; throw e; } };

await figma.loadAllPagesAsync();

// Every name the file defines: component names, property names, variant options. A
// description quoting a name outside this set cites something the file no longer has,
// usually a component renamed after the description was written. Each such description
// still matches its own interface, so no per-component check below can see it.
const known = new Set(["True", "False"]);
const unreadable = [];   // sets whose definitions Figma refuses to read
for (const page of figma.root.children) {
  for (const n of publicsOf(page)) {
    known.add(n.name);
    // A status marker (`🚧 Time input`, `_🚧 Time input picker`) is a status, not part of
    // the name, so a description cites the name without it (figma-standard rule 13). It
    // leads the name, or follows the private prefix and any other leading marks.
    if (CONFIG.statusMarker) {
      const at = n.name.indexOf(CONFIG.statusMarker);
      if (at >= 0 && !/[\p{L}\p{N}]/u.test(n.name.slice(0, at))) known.add(n.name.slice(0, at) + n.name.slice(at + CONFIG.statusMarker.length).trimStart());
    }
    const d = defsOf(n);
    if (!d) { unreadable.push({ page: page.name, name: n.name }); continue; }
    for (const k of Object.keys(d)) {
      known.add(k.split("#")[0]);
      (d[k].variantOptions || []).forEach(o => known.add(o));
    }
  }
}
// A virtual set is one component split with the separator for Figma's sake — `Message
// composer - Medium / Default` and `/ Entity` are the same composer in two use cases — so
// its descriptions name the whole (`Message composer - Medium`) and each use case (`Entity`).
// Neither exists as a node; both are real names. Count them only where two or more
// siblings share the stem, since a lone slashed name is not a virtual set (SKILL.md 2c).
// Without this, the composers' own correct descriptions reported 7 stale names.
if (CONFIG.separator) {
  const stems = new Map();
  for (const page of figma.root.children) for (const n of publicsOf(page)) {
    const i = n.name.indexOf(CONFIG.separator);
    if (i < 1) continue;
    const stem = n.name.slice(0, i).trim();
    if (!stems.has(stem)) stems.set(stem, []);
    stems.get(stem).push(n.name.slice(i + CONFIG.separator.length));
  }
  for (const [stem, rests] of stems) {
    if (rests.length < 2) continue;
    known.add(stem);
    for (const r of rests) r.split(CONFIG.separator).map(x => x.trim()).filter(Boolean).forEach(x => known.add(x));
  }
}
// Capitalised or internal-prefixed names only: icon names are lowercase and usually live
// in another library, and a slash with no spaces around it is a token path, not a name.
const unknownNamesIn = (md) => [...new Set([...(md || "").matchAll(/`([^`]+)`/g)]
  .map(m => m[1].trim())
  .filter(t => /^[A-Z_]/.test(t) && !/^[A-Za-z]+\/\S/.test(t))
  .filter(t => !t.split(/\s*[=,]\s*/).every(p => known.has(p))))];

// Compact tier, derived (SKILL.md step 2a's second trigger). A published component that is
// only ever nested inside other components ON ITS OWN PAGE is published so its parent receives
// updates, not for anyone to place: a table's cell, a sidebar's row, a tree's item, whether it
// sits in the parent's slot or directly in its layers. Loose instances on a page are
// documentation examples, never usage.
// The page is the whole test. Until 1.9.0 there were two triggers, and both were wrong once:
// "every use sits in a slot" read Text input, Switch and Dropdown input as parts because their
// only uses sat in slots of components on other pages (an accordion, a list row, a table
// panel), though each has its own documented page; and "one parent family on the same page"
// missed a sidebar row nested in two components of its own sidebar, the section and the
// sidebar itself. A component used anywhere off its page is somebody else's building block
// and keeps its full description; a component used only inside its own page's components is a
// part, however many of them hold it. This was a pasted list until 2026-09-29.
const topOf = (m) => (m.parent && m.parent.type === 'COMPONENT_SET') ? m.parent : m;
const pageOf = (n) => { let q = n; while (q && q.type !== 'PAGE') q = q.parent; return q && q.id; };
const mainCache = new Map();
// The main is read without a catch of its own: a "does not exist" from a
// broken instance lands in the walk's guard below and lists the instance, and
// anything else ends the check. It used to turn every error into "no main",
// which skipped the instance in silence.
const mainOf = async (inst) => {
  if (!mainCache.has(inst.id)) mainCache.set(inst.id, await inst.getMainComponentAsync());
  return mainCache.get(inst.id);
};
const uses = new Map();   // component id -> { slot, direct, parents }
for (const inst of figma.root.findAllWithCriteria({ types: ['INSTANCE'] })) {
  try {
    // Walk to the nearest component root OR enclosing instance, resolving an instance to its
    // main: walking to component roots only skips through instances and names the grandparent.
    let q = inst.parent, inSlot = false, host = null;
    while (q && q.type !== 'PAGE') {
      if (q.type === 'SLOT') inSlot = true;
      if (q.type === 'COMPONENT' || q.type === 'COMPONENT_SET' || q.type === 'INSTANCE') { host = q; break; }
      q = q.parent;
    }
    if (!host) continue;
    const main = await mainOf(inst);
    if (!main || main.remote) continue;
    const hostMain = host.type === 'INSTANCE' ? await mainOf(host) : host;
    if (!hostMain) continue;
    const top = topOf(main);
    const u = uses.get(top.id) || { name: top.name, page: pageOf(top), slot: 0, direct: 0, parents: new Set(), elsewhere: false };
    if (inSlot) u.slot++; else u.direct++;
    u.parents.add(topOf(hostMain).name);
    if (pageOf(topOf(hostMain)) !== u.page) u.elsewhere = true;
    uses.set(top.id, u);
  } catch (e) {
    if (!GONE.test(e && e.message)) throw e;
    brokenInstances.push(safe(() => inst.id, '?'));
  }
}
for (const [id, u] of uses) {
  if (!u.elsewhere) derivedCompact.set(id, { name: u.name, why: (u.slot && !u.direct ? "slot of " : "inside ") + [...u.parents].join(", ") });
}

const issues = [];       // quality problems on full-tier descriptions that exist
const compactIssues = []; // quality problems on compact-tier (private + slot-only) descriptions
const shouldBeEmpty = []; // step 2e violations
const missing = [];      // subjects with no description
const defects = [];      // interface defects worth reporting, not description faults
const unknownNames = []; // names quoted that match nothing in the file
const headerReport = [];
const groups = new Map();
let ok = 0, compactOk = 0, skippedAlone = 0;

for (const page of figma.root.children) {
  if (!page.children.length) continue;

  // Everything published, at set level — compact-tier resolution happens per-subject below,
  // not by filtering names out before checking. A script that drops private/slot-only subjects
  // here never checks them at all, which is a different and worse failure than checking them
  // with the wrong tier's rules.
  const subjects = publicsOf(page);
  if (!subjects.length) continue;

  // Step 2e: a component alone on a page holding nothing outside its components is not
  // documented — unless other components use it. Re-published chrome (a status bar, a
  // keyboard) lands alone and unused; a building block lands alone and used: one library's
  // State layer sits on its own bare page and is inside 56 components on 36 pages, and the
  // rule asked for its description, and five like it, to be cleared. Used, it is checked
  // like any other subject, at the tier the part rule above gives it.
  const outside = page.findAll(n => safe(() => CONTENT.includes(n.type), false) && !inComponent(n));
  const alone = outside.length === 0;

  for (const n of subjects) {
    if (alone && !uses.has(n.id)) {
      skippedAlone++;
      const md = n.descriptionMarkdown || "";
      if (md) shouldBeEmpty.push({ page: page.name, name: n.name, len: md.length });
      continue;
    }
    const md = n.descriptionMarkdown || "";
    const compact = isCompactTier(n);

    const stale = unknownNamesIn(md);
    if (stale.length) unknownNames.push({ page: page.name, name: n.name, names: stale });

    if (compact) {
      if (!md) { missing.push({ page: page.name, name: n.name, tier: "compact" }); continue; }
      const bad = [];
      if (/^## /m.test(md)) bad.push("compact-tier component has full-structure headings");
      if (/^- /m.test(md)) bad.push("compact-tier component has bullet sections");
      const sentences = (md.match(/\./g) || []).length;
      if (sentences > 3) bad.push(`long (${sentences} sentence-ending periods) — possible public-candidate, flag rather than write longer`);
      if (bad.length) compactIssues.push({ page: page.name, name: n.name, bad }); else compactOk++;
      continue; // compact tier is never grouped into virtual sets (guide: "does not apply to private components")
    }

    if (!md) { missing.push({ page: page.name, name: n.name, tier: "full" }); continue; }

    const bad = [];
    for (const c of CONFIG.forbiddenChars) if (md.includes(c)) bad.push("forbidden char " + c);
    if (md.includes("•")) bad.push("manual bullet");
    if (/^\*\*/m.test(md)) bad.push("bold used as heading");

    for (const h of CONFIG.requiredHeadings)
      if (!new RegExp("^## " + String(h).replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$", "m").test(md)) bad.push("missing ## " + h);

    for (const h of (md.match(/^## (.+)$/gm) || []))
      if (CONFIG.headings.length && !CONFIG.headings.includes(h.replace(/^## /, ""))) bad.push("unknown heading: " + h);

    const stops = (md.match(/^- .*\.$/gm) || []).length;
    if (stops) bad.push("list item ends in full stop x" + stops);

    const first = md.split("\n")[0];
    if (first.startsWith("#") || first.startsWith("-")) bad.push("no purpose paragraph");
    if (!/[A-Za-z]/.test(first)) bad.push("purpose paragraph not prose");

    // Axis coverage. A single-option axis cannot be set, so omitting it is correct:
    // record it as an interface defect instead of a description fault.
    const defs = defsOf(n) || {};
    for (const key of Object.keys(defs)) {
      const name = key.split("#")[0];
      const def = defs[key];
      if (def.type !== "VARIANT") continue;
      const opts = def.variantOptions || [];
      if (opts.length < 2) { defects.push({ name: n.name, axis: name, issue: "single-option axis", options: opts }); continue; }
      // Case-sensitive on purpose: the guide requires axis names verbatim, never re-cased. A
      // description that only ever says the axis name in lower case (a natural-language plural,
      // say) has not actually quoted it — that is a real content gap, not a check limitation.
      if (!md.includes(name)) bad.push("axis not mentioned verbatim: " + name);
    }

    if (bad.length) issues.push({ page: page.name, name: n.name, bad }); else ok++;

    if (CONFIG.separator) {
      const key = n.name.split(CONFIG.separator)[0].trim();
      if (!groups.has(key)) groups.set(key, new Map());
      groups.get(key).set(n.name, md);
    }
  }

  // Header body must carry the first sentence of the description it introduces
  // A bare page has no header to compare, and saying so of every one is noise.
  if (CONFIG.headerName && !alone) {
    const header = page.findAll(n => safe(() => n.name === CONFIG.headerName, false)).find(h => !inComponent(h));
    const body = header && header.findOne(n => safe(() => n.type === 'TEXT' && n.name === CONFIG.headerBodyLayer, false));
    // Which component the header introduces is the one the PAGE is named for, not the first
    // full-tier subject: a page whose own component is private (`_Dropdown menu` on
    // "Dropdown menu") was compared against one of its public parts instead. Match the page
    // name, marker stripped, against the name without the internal prefix, in full or followed
    // by the separator. Where several matches disagree (`_Label / Input / …` and
    // `_Label / Control / …` on "Label"), the header is page-level prose that no single
    // description holds, so it is reported as not compared rather than out of sync.
    const bare = (x) => x.replace(/^[^A-Za-z0-9_]+\s*/, "").trim();
    const unprefix = (x) => CONFIG.internalPrefix && x.startsWith(CONFIG.internalPrefix) ? x.slice(CONFIG.internalPrefix.length) : x;
    const pageName = bare(page.name);
    const named = subjects.filter(s => { const nm = unprefix(s.name); return nm === pageName || (CONFIG.separator && nm.startsWith(pageName + " " + CONFIG.separator.trim())); });
    const sentence = (s) => firstSentenceOf(s.descriptionMarkdown || "").replace(/`/g, "");
    const wanted = [...new Set(named.map(sentence).filter(Boolean))];
    const fallback = subjects.find(s => !isCompactTier(s)) || subjects[0];
    if (!header) headerReport.push({ page: page.name, status: "no header" });
    else if (!body) headerReport.push({ page: page.name, status: "no body layer" });
    else if (wanted.length > 1) {
      if (!wanted.includes(body.characters.trim()))
        headerReport.push({ page: page.name, status: "not compared", why: named.length + " components share the page name with different first sentences" });
    }
    else {
      // A header is canvas text and cannot render markdown, so the sentence goes in without its
      // backticks; compared with them, every header citing a name read as out of sync.
      const expected = wanted[0] || (fallback && sentence(fallback)) || "";
      if (expected && body.characters.trim() !== expected)
        headerReport.push({ page: page.name, status: "out of sync", body: body.characters.slice(0, 60) });
    }
  }
}

// Virtual sets: every member must hold byte-identical text. Compact-tier members are excluded
// above (they never group), so a virtual set here is always full-tier by construction.
const virtualSets = [];
for (const [key, members] of groups) {
  if (members.size < 2) continue;
  const distinct = new Set(members.values());
  virtualSets.push({ group: key, members: [...members.keys()], shared: distinct.size === 1 });
}

return {
  ok, compactOk,
  skippedAlone,
  missing,
  shouldBeEmpty,                                  // step 2e violations: clear or confirm
  issues,
  compactIssues,
  unknownNames,                                   // quoted names the file no longer defines
  unreadable,                                     // sets Figma would not read; not checked
  virtualSets: virtualSets.filter(v => !v.shared), // only the broken ones
  virtualSetCount: virtualSets.length,
  defects,
  brokenInstances,                                // ids of instance layers Figma would not read; skipped, not checked
  headerReport: headerReport.filter(h => h.status !== "no header"),
  derivedCompact: [...derivedCompact.values()].filter(d => !(CONFIG.internalPrefix && d.name.startsWith(CONFIG.internalPrefix)))  // unprefixed parts routed to the compact tier, and why
};
