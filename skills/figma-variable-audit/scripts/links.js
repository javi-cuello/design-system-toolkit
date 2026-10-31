// @runs: the audit dashboard's Audit (tools/figma-audit/server.mjs serves it at /scripts), as well as a session.
// Link-validity scanner — do this file's own components still point at
// variables and styles the source library has?
//
// Three modes, one file, run as a figma_execute body. The caller prepends:
//   const MODE = "keys";                       in the SOURCE library
//   const MODE = "sets";                       in the consumer, to enumerate
//   const MODE = "scan"; const KEYS = { … };   in the consumer, with the keys
//                                              mode's answer, plus
//   const TOKENS = { … };                      the library's audit settings, for scope
//   const SCOPE = [ids];                       optional: only these sets
//
// keys: every local variable and style in the source, by stable key — the
//       reference set. Names are carried for the report only; the comparison
//       is by key, never by name (names collide and get reused).
// sets: the component roots in scope, with their variant counts, and what the
//       source library PUBLISHES to this file — both cheap, neither resolving
//       a single binding. It exists so a caller can size its batches and
//       probe publishing once rather than once per batch.
// scan: walk every editable component root in scope (COMPONENT_SET and plain
//       COMPONENT, never instances), resolve each bound variable and style id
//       once, and report the ones whose key the source no longer has. Returns
//       the components scanner's shape, so the same writer files the rows:
//       { audited: [{ set, id, page, candidates }], measures, fileKey, fileName }.
//
// A whole library in one scan is one plugin call with no way to show progress
// and no way to finish late: 121 sets and 1013 variants overran a four-minute
// cap and the stage failed with everything it had already resolved thrown
// away. `SCOPE` is the fix — with it the walk resolves only those sets by id
// and skips the page walk entirely, so a caller runs the enumeration once and
// then as many bounded scans as the library needs. An empty or absent SCOPE
// still means the whole file, which is what a session with one call wants.
//
// Facts are gathered first and judged by checkFacts(), a pure function, so the
// check runs in node against fixture facts: with no `figma` in scope the body
// returns checkFacts itself.

function checkFacts(facts, keys) {
  // Two reference sets, because they answer two questions. `keys` is what the
  // source file HOLDS, read in the source. `keys.published` is what it OFFERS
  // consumers, read in the consumer through teamLibrary. A binding to a
  // variable that exists locally but is not published renders forever and
  // updates never — a defect of its own, and one project's settings already
  // rule a direct binding to its fully hidden primitive collection exactly
  // that. Swapping published FOR local would collapse that case into
  // "deleted", which is the one it is not.
  const vars = new Set((keys && keys.variables || []).map((v) => v.key));
  const styles = new Set((keys && keys.styles || []).map((s) => s.key));
  // Absent or empty means the caller could not read it — not that nothing is
  // published. An empty set used as a reference reports every binding broken,
  // so it is ignored and the run says the check did not run.
  const pub = keys && keys.published;
  const pubVars = pub && pub.variables && pub.variables.length ? new Set(pub.variables) : null;
  const pubStyles = pub && pub.styles && pub.styles.length ? new Set(pub.styles) : null;
  // The NAMES the source carries, for the distinction that decides what a
  // finding means. A binding whose key is absent but whose name the source
  // still publishes is on a SUPERSEDED GENERATION of that token: the layer
  // renders from its last resolved value and looks perfectly correct, and the
  // binding has quietly stopped receiving library updates. A binding whose
  // name the source does not carry at all is a different question — it may
  // come from a second library this check never looked at, and calling that
  // "broken" is how a check invents work.
  //
  // Found on a real run: 118 candidates on one library and 39 on another
  // collapsed to 22 bindings of the first kind, 8 of the second, and a whole
  // class that belonged to a library the project rules out of scope. Without
  // the split they read as 157 equal defects.
  //
  // Names are matched through `spelling`, so a token the source RESPELLED is
  // still the same token: one project moved its library to en-US and recreated
  // `Colour/…/Supportive/Green/*` as `Color/…` under new keys, and a stale
  // binding read as "not in the source library" (a review, which the judge
  // may drop) instead of "published under a different key" (an error). The
  // map keeps the source's own name, so the finding says what to rebind to.
  const spelling = (n) => String(n).toLowerCase().replace(/colour/g, "color").replace(/grey/g, "gray")
    .replace(/behaviour/g, "behavior").replace(/centre/g, "center");
  const byName = (list) => new Map((list || []).filter((x) => x.name).map((x) => [spelling(x.name), x.name]));
  const varNames = byName(keys && keys.variables);
  const styleNames = byName(keys && keys.styles);
  const out = [];
  // `dead` — bindings that resolve to nothing AND paint nothing, so they are
  // not raised: see the note where they are dropped. Counted, and reported,
  // because unstated silence reads as absence.
  const measures = { sets: 0, bindings: 0, styleRefs: 0, distinctVariables: 0, distinctStyles: 0, local: 0, broken: 0, dead: 0, styled: 0 };
  const seenVar = new Set(), seenStyle = new Set();
  for (const set of facts.sets) {
    measures.sets++;
    const broken = {};   // one candidate per missing token per set, listing the layers
    for (const r of set.refs) {
      // A variable bound INSIDE a style the layer applies is the style's, not
      // the component's: Figma copies a focus-ring style's `Palette/Blue/4`
      // onto every layer that uses it. The style is checked as a style
      // reference; its internals are the source's business, and a project's
      // tier rule binds components, not styles. Raised as "not published" on
      // one library, it was five rows naming hidden primitives no designer
      // bound.
      if (r.kind === "variable" && r.styled) { measures.styled++; continue; }
      if (r.kind === "variable") { measures.bindings++; seenVar.add(r.id); } else { measures.styleRefs++; seenStyle.add(r.id); }
      // Two strings, not one. `why` is the STATE, short enough to read at a
      // glance in the question column; `advice` is what to do about it, and
      // belongs in the recommendation column beside it. Packed together they
      // made a question column that ran for fifteen lines while the
      // recommendation column held one boilerplate sentence.
      let why = null, advice = null, sev = "error";
      if (!r.resolved) { why = "no longer resolves at all"; advice = (r.kind === "variable" ? "The variable" : "The style") + " was deleted outright. Rebind the layer, or remove the binding."; }
      else if (!r.remote) { measures.local++; continue; }      // a local token is not a library link
      else if ((r.kind === "variable" ? vars : styles).has(r.key)) {
        // The source holds it. Does it offer it?
        const offered = r.kind === "variable" ? pubVars : pubStyles;
        if (offered && !offered.has(r.key)) {
          why = "is held by the source but not published";
          advice = "The layer renders from its last resolved value and will never receive a library update. Publish it from the source, or rebind to a token the source does publish.";
          sev = "error";
        }
      } else {
        const names = r.kind === "variable" ? varNames : styleNames;
        const current = r.name ? names.get(spelling(r.name)) : null;
        const superseded = !!current;
        why = superseded ? "is published under a different key" + (current !== r.name ? ", as \"" + current + "\"" : "") : "is not in the source library";
        advice = superseded
          ? "The source publishes this NAME, but from a newer generation with a different key, so the binding is stuck on the old one and receives no updates. Rebind to the published \"" + current + "\"."
          : "It may belong to another library rather than being deleted — settle which before rebinding, then relink or record it as an accepted orphan in the context document.";
        sev = superseded ? "error" : "review";
      }
      if (!why) continue;
      const k = r.kind + ":" + (r.key || r.id);
      if (!broken[k]) broken[k] = { r, why, advice, sev, layers: [] };
      broken[k].layers.push({ path: r.path, prop: r.prop, variant: r.variant || null, paints: r.paints !== false,
                              override: !!r.override });
    }
    /*
     * One finding, written as a sentence and a list — never one sentence
     * holding the list.
     *
     * A rounded logo binds the same variable on four corners, in one layer,
     * in one variant. Printed as four full paths that produced: "used on 4
     * layers: Scrolling=False, Content=Avatar › Avatar › Content › Mask ›
     * Logo · topLeftRadius, Scrolling=False, Content=Avatar › Avatar ›
     * Content › Mask › Logo · topRightRadius, …" — one run-on line, the
     * same path four times, and a reader who cannot see it is ONE layer.
     *
     * So: group by layer path, collect the properties, and count the variants
     * rather than repeating each one's name. The variant prefix is dropped
     * from the path for the same reason — it is the same layer whichever
     * variant you open, and the fix is made once on the component.
     */
    const dropped = { n: 0 };
    const line = (layers) => {
      const byPath = new Map();
      for (const { path, prop, variant, paints, override } of layers) {
        const where = path;
        if (!byPath.has(where)) byPath.set(where, { props: [], variants: new Set(), paints: false, override: false });
        const e = byPath.get(where);
        if (!e.props.includes(prop)) e.props.push(prop);
        if (variant) e.variants.add(variant);
        if (paints !== false) e.paints = true;
        if (override) e.override = true;
      }
      // The LEAF and its parent, never the whole chain. "Thumbnail › Domain
       // iconography › Logo › Vector" is four names to read before
       // reaching the one that is bound, and the three above it are the same
       // on every row of the set. A designer selects the component and looks
       // for the layer; two names find it.
      const shorten = (path) => {
        const parts = String(path).split(" › ");
        return parts.length > 2 ? parts.slice(-2).join(" › ") : path;
      };
      // The unreachable ones are dropped HERE too, not only when they are the
      // whole finding. A variable bound on a painted Footer and an unpainted
      // Header is one finding — the Footer genuinely needs rebinding — and
      // the Header lines rode along inside it, naming layers whose binding
      // does not appear in Figma's Stroke panel at all. Seen live on
      // `_Dialog - Modal`: three layer lines, two of them unreachable.
      const reachable = [...byPath.entries()].filter(([, e]) => e.paints);
      const hidden = byPath.size - reachable.length;
      if (hidden) dropped.n += hidden;
      return reachable.map(([where, e]) =>
        (where === "$root" ? "the component frame" : shorten(where)) + " — " + e.props.join(", ") +
        // ONE variant is named, not silently dropped. Printing a count only
        // when it exceeded one meant a finding on a single variant of a
        // three-variant set read as if it covered the whole component: the
        // layer `Main container › Header` exists in `Type=Confirmation,
        // Scrolling=False` alone, and the row said only "Main container ›
        // Header — effects". The maintainer had to open all three to find it.
        ([...e.variants].length === 1 ? " · " + [...e.variants][0]
         : e.variants.size > 1 ? " · " + e.variants.size + " variants" : "") +
        // WHERE THE FIX GOES. An override lives on this copy and nowhere
        // else, so it is fixed here; anything else came from the component
        // this layer is an instance of, and is fixed there. Saying which
        // is the difference between a row someone can act on and a row
        // that sends them to a component with no such binding.
        (e.override ? " \u00b7 an override on this component's own copy, so it is fixed here" : "") +
        (e.paints ? "" : " \u00b7 nothing painted: the layer has no stroke, so this binding is invisible until one is added"));
    };
    const candidates = Object.values(broken).map(({ r, why, advice, sev, layers }) => {
      const lines = line(layers);
      /*
       * A BINDING THAT PAINTS NOTHING IS LATENT, NOT BROKEN.
       *
       * Where every layer this finding names has no stroke, nothing renders
       * differently today and nothing will until someone adds one. That is a
       * dead binding to clean up, not an error to fix now — and the row
       * already said so, in a qualifier hanging off the layer line while
       * `sev` still read `error`, so the queue sorted it and the score
       * weighed it as live. Eleven of one library's link findings were
       * entirely unpainted; all eleven were errors.
       *
       * A PARTLY painted finding is still raised in full: some of it renders.
       *
       * AND IT IS NOT RAISED AT ALL, because there is nowhere to act on it.
       * Figma's Stroke panel lists paints, and a weight with no paint has no
       * row to appear in — so the binding is invisible in the UI and cannot
       * be selected, inspected or removed there. Verified live on one
       * library's `_Dialog - Modal`: `strokeBottomWeight` bound to `Stroke/1`
       * on a Header with zero stroke paints, in all three variants, with an
       * empty Stroke panel. A row that names something a maintainer can
       * neither see nor reach is not a finding, it is noise — and eleven of
       * that library's link rows were this.
       *
       * They are COUNTED and the count is reported, because silence that is
       * not stated is silence a reader takes for absence. Clearing them needs
       * the API (`setBoundVariable(prop, null)`), which is a job for a run
       * that offers it, not for a queue row that cannot be followed.
       */
      const anyPaints = layers.some((l) => l.paints !== false);
      const latent = !anyPaints && layers.length > 0;
      // Counted already: `line()` drops every unreachable layer and counts
      // each one, so a finding whose layers were ALL unreachable has been
      // counted there. Adding here would count it twice.
      if (latent) return null;
      return {
        sev: sev || "error", rule: "link",
        // What the finding is about — the token, by its stable key — so the
        // row writer finds the same row after the wording changes.
        key: "link|" + (r.kind || "style") + "|" + (r.key || r.id),
        advice: advice,
        text: (r.kind === "variable" ? "variable " : r.styleType ? r.styleType.toLowerCase() + " style " : "style ") +
              (r.name ? "\"" + r.name + "\"" : r.id) + " " + why,
        // Eight layers named, then a count. Three and an ellipsis was not
        // enough to act on: a row said a variable was wrong somewhere in
        // twelve layers and named a quarter of them, so the fix began with a
        // hunt.
        layers: lines.slice(0, 8).concat(lines.length > 8 ? ["and " + (lines.length - 8) + " more layers"] : []),
        // every property the token is bound to, past the eight layers named: report.mjs's --scope reads it
        props: Array.from(new Set(layers.map(function (l) { return l.prop; }))).sort(),
      };
    });
    measures.dead += dropped.n;
    const kept = candidates.filter(Boolean);
    measures.broken += kept.length;
    if (kept.length) out.push({ set: set.name, id: set.id, page: set.page, variants: set.variants || 1, axes: [], described: true, candidates: kept });
  }
  measures.distinctVariables = seenVar.size;
  measures.distinctStyles = seenStyle.size;
  // The ids behind those two counts, so a caller that scans in batches can
  // union them rather than add them: a variable used by forty sets is one
  // distinct variable, and summing the batches would call it forty.
  // Said out loud rather than implied by silence: with no published set the
  // hidden-but-present case cannot be seen, and a clean result means less.
  /*
   * TWO PROBES, TWO ANSWERS. `publishedChecked` was one flag over both, so a
   * successful VARIABLE probe declared the STYLE question checked as well —
   * and `probePublished` never fills `styles` at all, because the team-library
   * API it uses enumerates variables only. So the held-but-not-published case
   * could not be raised for a single style, ever, while the run reported the
   * class as clean over 2,802 resolved style references on one real library.
   *
   * Each is now reported for itself, and the style half names its own reason
   * rather than borrowing the variable half's success.
   */
  measures.publishedCheckedVariables = !!pubVars;
  measures.publishedCheckedStyles = !!pubStyles;
  measures.publishedChecked = !!pubVars;        // kept: every caller means variables
  const notChecked = [];
  if (!pubVars) notChecked.push("published-visibility (variables) \u2014 the consumer returned no published list, so a token that exists but is not published reads as fine");
  if (!pubStyles) notChecked.push("published-visibility (styles) \u2014 no published style list was available, so a style the source holds but does not publish cannot be told from one it publishes");
  return { audited: out, measures, seen: { variables: [...seenVar], styles: [...seenStyle] }, notChecked };
}

if (typeof figma === "undefined") { checkFacts.probePublished = probePublished; return checkFacts; }

if (MODE === "keys") {
  const variables = [], styles = [];
  for (const c of await figma.variables.getLocalVariableCollectionsAsync())
    for (const id of c.variableIds) {
      const v = await figma.variables.getVariableByIdAsync(id);
      if (v) variables.push({ key: v.key, name: v.name, type: v.resolvedType, collection: c.name });
    }
  const lists = [["TEXT", await figma.getLocalTextStylesAsync()], ["EFFECT", await figma.getLocalEffectStylesAsync()],
                 ["PAINT", await figma.getLocalPaintStylesAsync()], ["GRID", await figma.getLocalGridStylesAsync()]];
  for (const [type, list] of lists) for (const s of list) styles.push({ key: s.key, name: s.name, type });
  return { variables, styles, fileKey: figma.fileKey || null, fileName: figma.root.name };
}

// ---- sets and scan
// What the source OFFERS this file, asked here rather than in the source,
// because publishing is a fact about the subscription and only the consumer
// can see it. An empty answer is a failed probe, not an empty library:
// checkFacts ignores it and says the visibility check did not run.
//
// A batching caller reads this once in `sets` mode and hands it back in
// KEYS.published, so a library with forty collections is not re-enumerated
// once per batch. A caller that supplies it is believed — including an
// empty list, which is how a failed probe stays a failed probe across the
// batches rather than being quietly re-probed into a different answer.
//
// BOUNDED. Figma's library API can stop answering while everything else in
// the file is healthy: a call that never resolves. Unbounded, one such call
// took the whole 240-second cap with it and the stage failed at "listing the
// sets" on half of one day's runs — the service log showed the plugin
// answering that call in 241 s where a healthy run answers in 1 s. A call
// that has not answered in `wait` ms is given up, and the probe returns what
// it has: empty, which the stage line already reports as "NOT checked for
// publish visibility". Twenty seconds is ten times a healthy answer — and
// ONE deadline for the whole probe, not one per call: bounded per call, six
// hung collections cost 123 s, when the first one that hangs has already
// said the API is not answering today.
async function probePublished(wait = 20000) {
  const out = { variables: [], styles: [] };
  const deadline = Date.now() + wait;
  const bounded = (p) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error("library API gave no answer in " + wait + " ms")), Math.max(0, deadline - Date.now())))]);
  try {
    for (const c of await bounded(figma.teamLibrary.getAvailableLibraryVariableCollectionsAsync())) {
      try { for (const v of await bounded(figma.teamLibrary.getVariablesInLibraryCollectionAsync(c.key))) out.variables.push(v.key); }
      catch (e) { if (Date.now() >= deadline) break; /* out of time: what is read stands; otherwise one collection that will not enumerate must not empty the rest */ }
    }
  } catch (e) { /* no subscription, or no answer in time: left empty on purpose */ }
  return out;
}

await figma.loadAllPagesAsync();
const TOK = (typeof TOKENS !== "undefined" && TOKENS) || {};
const SECTION = TOK.sectionHeader ? new RegExp(TOK.sectionHeader) : null;
const SKIP = new Set(TOK.excludeSections || []);
const PAGES = TOK.componentPages ? new RegExp(TOK.componentPages) : null;
const STYLE_PROPS = { fillStyleId: "PAINT", strokeStyleId: "PAINT", textStyleId: "TEXT", effectStyleId: "EFFECT", gridStyleId: "GRID" };
const STROKE_WEIGHT = /^stroke(Top|Bottom|Left|Right)?Weight$/;
// The style that owns each painted property, when one is applied.
const STYLED_BY = { fills: "fillStyleId", strokes: "strokeStyleId", effects: "effectStyleId" };

const varCache = new Map(), styleCache = new Map();
async function resolveVar(id) {
  if (!varCache.has(id)) {
    const v = await figma.variables.getVariableByIdAsync(id).catch(() => null);
    varCache.set(id, v ? { resolved: true, remote: !!v.remote, key: v.key, name: v.name } : { resolved: false });
  }
  return varCache.get(id);
}
async function resolveStyle(id) {
  if (!styleCache.has(id)) {
    const s = await figma.getStyleByIdAsync(id).catch(() => null);
    styleCache.set(id, s ? { resolved: true, remote: !!s.remote, key: s.key, name: s.name } : { resolved: false });
  }
  return styleCache.get(id);
}

// Every component root the scope admits, as nodes. One walk, used by both
// modes, so `sets` cannot enumerate something `scan` would skip.
async function rootsInScope() {
  const found = [];
  let section = null;
  for (const p of figma.root.children) {
    if (SECTION && SECTION.test(p.name)) section = p.name;
    if ((section && SKIP.has(section)) || (PAGES && !PAGES.test(p.name))) continue;
    await p.loadAsync();
    for (const s of p.findAllWithCriteria({ types: ["COMPONENT_SET", "COMPONENT"] })) {
      if (s.type === "COMPONENT" && s.parent && s.parent.type === "COMPONENT_SET") continue;
      found.push({ node: s, page: p.name });
    }
  }
  return found;
}
// The page a node sits on, for a scope resolved by id rather than walked.
const pageOf = (n) => { let q = n; while (q && q.type !== "PAGE") q = q.parent; return q ? q.name : ""; };
const variantsOf = (n) => (n.type === "COMPONENT_SET" ? n.children.length : 1);

if (MODE === "sets") {
  const found = await rootsInScope();
  return {
    sets: found.map(({ node, page }) => ({ id: node.id, name: node.name, page, variants: variantsOf(node) })),
    // SELF: the library is its own source. Its bindings are local, so what
    // it publishes to others is not this check's question, and the libraries
    // it subscribes to are not its source.
    published: typeof SELF !== "undefined" && SELF ? null : await probePublished(),
    fileKey: figma.fileKey || null, fileName: figma.root.name,
  };
}

// A scope names the sets to walk, by id, and skips the page walk with them:
// the caller has already enumerated, and re-walking every page per batch is
// the cost this split exists to remove. An id that no longer resolves is
// dropped rather than failing the batch — a set deleted between the
// enumeration and the scan is not this check's finding.
const SCOPED = typeof SCOPE !== "undefined" && SCOPE && SCOPE.length ? SCOPE : null;
const targets = [];
if (SCOPED) {
  for (const id of SCOPED) {
    const n = await figma.getNodeByIdAsync(id).catch(() => null);
    if (n && (n.type === "COMPONENT_SET" || n.type === "COMPONENT")) targets.push({ node: n, page: pageOf(n) });
  }
} else {
  targets.push(...await rootsInScope());
}

const sets = [];
{
  for (const { node: s, page } of targets) {
    const refs = [];
    // The variant travels BESIDE the path, never inside it. Prefixed, a
    // binding on the variant's own frame had the variant name as its whole
    // path, so one token bound on four variants of one frame listed four
    // separate "layers" — "Disabled=False, Menu pos.=Right — itemSpacing"
    // and three more — none of which is a layer a designer can select.
    // `inside` is null outside any instance, and otherwise a map from each
    // node id this instance overrode to the fields it overrode — so a binding
    // is reported inside an instance only where the consumer changed it.
    const walk = async (n, path, variant, inside) => {
      const here = path.length ? path.join(" › ") : "$root";
      /*
       * THE OVERRIDE SET MUST BE IN HAND BEFORE THIS NODE'S BINDINGS ARE READ.
       *
       * An instance names its own overrides, and the node they name is very
       * often the instance FRAME ITSELF — `overrides[0].id` equal to the
       * instance's own id. Computing the set after reading, as this did,
       * therefore missed exactly the commonest case. Measured live on one
       * library: 276 overridden bindings under this rule against 18 under the
       * old one, out of 47,651 inherited bindings correctly skipped.
       *
       * Nested instances union rather than replace, so an override recorded
       * on an outer instance is not lost when an inner one is entered.
       */
      /*
       * BY FIELD, NOT BY THE WORD "boundVariables". Re-pointing a fill's
       * variable on an instance is recorded as `overriddenFields: ["fills"]`
       * — the paint was replaced, binding and all — and only sometimes as
       * `boundVariables`. Reading the latter alone skipped one project's
       * `Alert`: its `circle-check` icon fill overridden to a
       * `Colour/…/Supportive/Green` variable the library had since recreated
       * under a new key, on every run, while the stage said 0 candidates. A
       * binding is the consumer's when the override names `boundVariables`
       * or the binding's own property.
       */
      let scope = inside;
      if (n.type === "INSTANCE") {
        scope = new Map(inside || []);
        for (const o of (n.overrides || [])) {
          if (!o || !o.id || !(o.overriddenFields || []).length) continue;
          scope.set(o.id, new Set([...(scope.get(o.id) || []), ...o.overriddenFields]));
        }
      }
      const fields = scope && scope.get(n.id);
      const overrides = (prop) => !!fields && (fields.has("boundVariables") || fields.has(prop));
      const isOverride = !!fields && [...fields].some((f) => f === "boundVariables" || STYLE_PROPS[f] || (n.boundVariables && n.boundVariables[f]));
      /*
       * AN INSTANCE'S OWN FRAME IS INSTANCE-LAND TOO.
       *
       * `inside` alone asked "are we below an instance", which let the
       * instance NODE ITSELF through — and its frame's bindings come from its
       * main component exactly like its children's do. `App header` carried a
       * `Spacing/0` row for `Tabs`, an unoverridden instance of `Tab bar`,
       * while `Tab bar`'s own root carries the identical five bindings: one
       * defect, two rows, and the one naming `App header` cannot be fixed
       * there. Verified live on both components.
       */
      const borrowed = n.type === "INSTANCE" || !!inside;
      if (borrowed && !isOverride) {
        // Not overridden here: it belongs to the component this came from,
        // which is audited in its own right. Its children may still carry
        // overrides, so the walk goes on.
        const kidsOnly = n.children || [];
        for (const c of kidsOnly) await walk(c, path.concat(c.name), variant, scope);
        return;
      }
      const bv = n.boundVariables || {};
      for (const [prop, val] of Object.entries(bv)) {
        const aliases = Array.isArray(val) ? val : [val];
        // Inside an instance, only the properties this copy overrode.
        if (borrowed && !overrides(prop)) continue;
        for (const a of aliases) {
          if (!a || !a.id) continue;
          const v = await resolveVar(a.id);
          // Figma keeps a per-side stroke-weight binding on a layer that has
          // no stroke at all, and a weight with nothing to paint is invisible
          // in the file. Reported plainly it sends a designer hunting: one
          // library's `_Dialog - Modal` named `Header — strokeBottomWeight`
          // on a Header that carries no stroke in any of its six variants.
          // It is still a stale key and still bites the day a stroke is
          // added, so it is kept — and said out loud.
          refs.push(Object.assign({ kind: "variable", id: a.id, prop, path: here, variant,
                                    override: isOverride,
                                    styled: !!(STYLED_BY[prop] && n[STYLED_BY[prop]] && n[STYLED_BY[prop]] !== figma.mixed),
                                    paints: !(STROKE_WEIGHT.test(prop) && !(n.strokes || []).length) }, v));
        }
      }
      for (const [prop, styleType] of Object.entries(STYLE_PROPS)) {
        const sid = n[prop];
        if (!sid || sid === figma.mixed) continue;
        if (borrowed && !overrides(prop)) continue;
        const st = await resolveStyle(sid);
        refs.push(Object.assign({ kind: "style", styleType, id: sid, prop, path: here, variant }, st));
      }
      /*
       * INSIDE AN INSTANCE, ONLY THE OVERRIDES — because only they can be
       * fixed here.
       *
       * A stale binding INHERITED from the main component is one defect with
       * one fix, made once on that component. Reporting it again against
       * every component that places the instance names a layer the consumer
       * cannot edit: `Split button` carried a row for a binding on
       * `_Split button - Leading button`, and that component carried its own
       * row for the same binding. 20 of one library's 111 link rows were
       * those inherited copies — 22% of everything the scan resolved — each
       * sending a designer where the fix is impossible. The owning component
       * is walked in its own right, so nothing is lost.
       *
       * An OVERRIDE is different, and skipping instances wholesale would
       * have lost it: a binding re-pointed on this instance exists only
       * here, the main component does not have it, and this is the only
       * place it can be put right. Figma lists them on the instance —
       * `overrides` is `[{ id, overriddenFields }]` — so the walk descends
       * carrying the set of node ids whose bindings were changed, and inside
       * an instance reports those and nothing else. The row says so, because
       * "your copy changed this" and "the component it came from is wrong"
       * are different jobs.
       */
      for (const c of (n.children || [])) await walk(c, path.concat(c.name), variant, scope);
    };
    const roots = s.type === "COMPONENT_SET" ? s.children : [s];
    for (const v of roots) await walk(v, [], s.type === "COMPONENT_SET" ? v.name : null);
    sets.push({ name: s.name, id: s.id, page, variants: roots.length, refs });
  }
}

// The caller's published list where it supplied one (it read it once, in
// `sets` mode); this file's own probe otherwise, which is the one-call path.
const published = (typeof KEYS !== "undefined" && KEYS && KEYS.published) || await probePublished();
const REF = typeof KEYS !== "undefined" && KEYS ? Object.assign({}, KEYS, { published }) : null;
return Object.assign(checkFacts({ sets }, REF),
                     { fileKey: figma.fileKey || null, fileName: figma.root.name,
                       publishedSeen: published.variables.length });
