// Adoption score — v0.3.0 · skill-standard v1.9.0
// @ts-check
// A widget that scores how closely a file's screens use its design system: system components, detaches, colour,
// spacing and text styles. The scan is figma-components-audit's composed-frame check, copied in below by sync.mjs.
// Data stored: the token in clientStorage (this machine); the system libraries and the last run in synced state.

/* adoption-score generated start — written by plugins/adoption-score/sync.mjs from skills/figma-components-audit/scripts/probes.js; never edit by hand */
const FCA_FACTORY = function () {
  const FCA = {};
  const isArr = Array.isArray;

  // ---- integrity hash ---------------------------------------------------
  // Comment-stripped and whitespace-insensitive: a reworded comment or a
  // reflowed paste cannot reject identical code, and a paste may drop its
  // comments to shrink. A changed token anywhere still changes the hash.
  FCA.stripComments = function (src) {
    let out = "", i = 0, prev = "";
    const tpl = []; // brace depth at each open `${`, innermost last
    let depth = 0;
    const regexAfter = /[(,=:[!&|?{};+\-*%<>~^]$/;
    const kw = /(^|[^\w$])(return|typeof|case|in|of|delete|void|throw|new|else|do)$/;
    while (i < src.length) {
      const c = src[i], d = src[i + 1];
      if (c === "/" && d === "/") { while (i < src.length && src[i] !== "\n") i++; continue; }
      if (c === "/" && d === "*") { const e = src.indexOf("*/", i + 2); i = e < 0 ? src.length : e + 2; out += " "; continue; }
      if (c === "'" || c === '"') {
        let j = i + 1; while (j < src.length && src[j] !== c) { if (src[j] === "\\") j++; j++; }
        out += src.slice(i, j + 1); i = j + 1; prev = c; continue;
      }
      if (c === "`" || (c === "}" && tpl.length && tpl[tpl.length - 1] === depth)) {
        if (c === "}") tpl.pop();
        let j = i + 1;
        while (j < src.length && src[j] !== "`") {
          if (src[j] === "\\") { j += 2; continue; }
          if (src[j] === "$" && src[j + 1] === "{") { tpl.push(depth); j += 2; break; }
          j++;
        }
        const closed = src[j] === "`";
        out += src.slice(i, closed ? j + 1 : j); i = closed ? j + 1 : j; prev = "`";
        continue;
      }
      if (c === "/") {
        const before = out.replace(/\s+$/, "");
        if (before === "" || regexAfter.test(before) || kw.test(before)) {
          let j = i + 1, cls = false;
          while (j < src.length) {
            const ch = src[j];
            if (ch === "\\") { j += 2; continue; }
            if (ch === "[") cls = true; else if (ch === "]") cls = false;
            else if (ch === "/" && !cls) break;
            j++;
          }
          j++; while (j < src.length && /[a-z]/i.test(src[j])) j++;
          out += src.slice(i, j); i = j; prev = "/"; continue;
        }
      }
      if (c === "{") depth++;
      if (c === "}") depth--;
      out += c; i++; if (!/\s/.test(c)) prev = c;
    }
    return out;
  };
  FCA.srcHash = function (src) {
    const s = FCA.stripComments(src).replace(/\s+/g, "");
    let h = 0x811c9dc5;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    return ("0000000" + h.toString(16)).slice(-8);
  };

  // ---- shared -----------------------------------------------------------
  // A plain COMPONENT's `children` are its LAYERS, not its variants. Iterating
  // them as a variant list mis-walks the tree and mislabels every finding —
  // the bug the old §3.8 carried, and §3.7a–c carried it too.
  FCA.variantsOf = (set) => (set.type === "COMPONENT_SET" ? set.children : [set]);
  // A variant's name as its prop values: the toolkit's one reader (tools/shared/names.js), a copy
  // because Figma imports nothing, held to it character for character by tools/shared/test-names.mjs.
  const variantValues = (name) => Object.fromEntries(String(name ?? '').split(/,\s*/).filter((p) => p.includes('=')).map((p) => { const i = p.indexOf('='); return [p.slice(0, i).trim(), p.slice(i + 1).trim()]; }));
  FCA.parseVariant = variantValues;
  const axesOf = (defs) => Object.entries(defs || {}).filter(([, v]) => v.type === "VARIANT")
    .map(([k, v]) => ({ name: k, options: v.variantOptions || [] }));

  // ---- §0.5 discovery: pure halves --------------------------------------
  FCA.numericScales = (names) => {
    const groups = {};
    for (const n of names) { const top = n.split("/")[0]; (groups[top] = groups[top] || []).push(n); }
    return Object.fromEntries(Object.entries(groups).filter(([g]) => /spacing|radius|stroke|opacity|size|font/i.test(g)));
  };
  FCA.colourRoles = (names) => {
    const roles = new Set();
    for (const n of names) if (/colou?r|state/i.test(n)) roles.add(n.split("/").slice(0, 2).join("/"));
    return [...roles].sort();
  };
  // A local collection is legitimate; only a DEFAULT NAME is a finding. Mode
  // names are not (invisible at one mode).
  FCA.isDefaultCollectionName = (name) => /^Collection \d+$/.test(name);

  // ---- §1 variant schema ------------------------------------------------
  // Axis names and the state vocabulary are the project's, from its settings:
  // opts.stateAxis, opts.states (the recorded order), opts.disabledAxis,
  // opts.firstAxis. A missing one SKIPS its check — the prose this replaced
  // hard-coded one library's State/Rest/Focus/Hover/Press/Loading, which a
  // touch-first library (no Hover) would have failed wholesale.
  FCA.schemaFindings = (defs, opts) => {
    opts = opts || {};
    const axes = axesOf(defs), findings = [], S = opts.stateAxis;
    // Axis order and a True/False axis's default-first order are the scanner's
    // (audit.js "schema|axis-order|", "schema|bool-default|"), which runs from the
    // dashboard as well as a session; a second copy here drifted from it.
    for (const a of axes) if (a.options.length === 1)
      findings.push('axis "' + a.name + '" has a single option ("' + a.options[0] + '") — no choice offered; leftover or deliberately staged?');
    const st = S && axes.find((a) => a.name === S);
    if (st && isArr(opts.states) && opts.states.length) {
      const bad = st.options.filter((o) => !opts.states.includes(o));
      if (bad.length) findings.push(S + " has non-standard options: " + bad.join(","));
      // Order among the KNOWN options only: an unknown one is reported above,
      // and ranking it -1 made a correct order read as out of order.
      const idx = st.options.map((o) => opts.states.indexOf(o)).filter((n) => n > -1);
      if (idx.some((n, i) => i > 0 && n < idx[i - 1])) findings.push(S + " options out of canonical order");
    }
    return findings;
  };
  FCA.schema = (set, opts) => ({ set: set.name, axes: axesOf(set.componentPropertyDefinitions).map((a) => a.name),
    findings: FCA.schemaFindings(set.componentPropertyDefinitions || {}, opts) });

  // ---- §2 property naming -----------------------------------------------
  // A property name's case, prefix and suffix are the scanner's (audit.js
  // "naming|prop-case|", "naming|prop-text|"); this keeps only what the scanner
  // does not read: an instance swap still carrying Figma's default name.
  FCA.propertyNamingFindings = (defs, opts) => {
    opts = opts || {};
    const findings = [];
    for (const [rawKey, v] of Object.entries(defs || {})) {
      const name = rawKey.split("#")[0];
      // Several swaps need unique names, so "Icon (Danger)" is fine: only Figma's defaults are flagged.
      if (v.type === "INSTANCE_SWAP" && /^(Instance|Component)\b/i.test(name.trim()))
        findings.push('SWAP prop "' + name + '" has a default name — give it a descriptive name');
    }
    return findings;
  };
  FCA.propertyNaming = (set, opts) => ({ set: set.name, findings: FCA.propertyNamingFindings(set.componentPropertyDefinitions, opts) });

  // ---- §3.4 the wrap row gap the scanner does not read ------------------
  // audit.js checks itemSpacing and, on GRID, gridRowGap/gridColumnGap. A
  // WRAP frame's cross-axis gap is counterAxisSpacing, and nothing checks it
  // there. Never read on GRID, where it is an inert leftover.
  FCA.wrapRowGaps = (set) => {
    const out = [];
    for (const v of FCA.variantsOf(set)) (function walk(n, path) {
      if (n.type === "INSTANCE" || n.type === "SLOT") return;
      const b = n.boundVariables || {};
      if (n.layoutMode && n.layoutMode !== "NONE" && n.layoutMode !== "GRID" && n.layoutWrap === "WRAP" &&
          typeof n.counterAxisSpacing === "number" && n.counterAxisSpacing !== 0 && !b.counterAxisSpacing)
        out.push({ variant: v.name, layer: path || "/", id: n.id, value: n.counterAxisSpacing });
      if (n.children) for (const c of n.children) walk(c, path ? path + " > " + c.name : c.name);
    })(v, "");
    return { set: set.name, findings: out };
  };

  // ---- §3.5b slot and overlay anatomy -----------------------------------
  // The anatomy is the library's: opts.slotName ("Content slot") and
  // opts.parts (["Header", "Footer"]) come from a sibling that gets it right.
  FCA.anatomy = (set, opts) => {
    opts = opts || {};
    const out = [];
    for (const v of FCA.variantsOf(set)) {
      const kids = (v.children || []).map((c) => ({ name: c.name, type: c.type })), findings = [];
      const slots = kids.filter((k) => k.type === "SLOT");
      if (!slots.length) findings.push("no native SLOT — open content area should be a SLOT, not a plain frame");
      if (opts.slotName) for (const sl of slots) if (sl.name !== opts.slotName) findings.push('SLOT named "' + sl.name + '" (expected "' + opts.slotName + '")');
      const names = kids.map((k) => k.name);
      for (const p of opts.parts || []) if (!names.includes(p)) findings.push("no " + p + " frame");
      if (findings.length) out.push({ set: set.name, variant: v.name, children: names, findings });
    }
    return out;
  };

  // ---- §3.5d state coverage ---------------------------------------------
  // `expected` is the baseline for this component's archetype, discovered from
  // the library's own components — never a fixed table.
  FCA.stateCoverage = (set, expected, opts) => {
    opts = opts || {};
    const defs = set.componentPropertyDefinitions || {};
    const st = opts.stateAxis && defs[opts.stateAxis];
    const present = st ? st.variantOptions : [];
    return { set: set.name, present, missing: (expected || []).filter((s) => !present.includes(s)),
      hasDisabledAxis: !!(opts.disabledAxis && opts.disabledAxis in defs) };
  };

  // ---- §3.6 metadata ----------------------------------------------------
  // The description's findings (empty, a placeholder) are scanner/audit.js's
  // metadata|description and metadata|placeholder. This lists what a reader
  // judges: which properties carry a description, and the documentation links.
  FCA.metadata = (set) => {
    const props = Object.entries(set.componentPropertyDefinitions || {}).map(([k, v]) =>
      ({ name: k.split("#")[0], type: v.type, hasDescription: !!(v.description || "").trim() }));
    return { set: set.name, description: (set.description || "").trim(), props, docLinks: (set.documentationLinks || []).map((l) => l.uri) };
  };

  // ---- §3.7a focus renders ----------------------------------------------
  // opts.stateAxis, opts.focus, opts.rest are the project's words; any missing
  // skips the probe. Each Focus variant is matched to the Rest sibling equal
  // on every other axis, and their stroke signatures (paints and per-side
  // weights, depth 4) must differ.
  FCA.focusRings = (set, opts) => {
    opts = opts || {};
    const S = opts.stateAxis, F = opts.focus, R = opts.rest;
    if (!S || !F || !R) return { set: set.name, skip: "stateAxis, focus and rest are required" };
    const vs = FCA.variantsOf(set).map((v) => ({ v, p: FCA.parseVariant(v.name) }));
    const focus = vs.filter((x) => x.p[S] === F);
    if (!focus.length) return { set: set.name, skip: "no " + F + " state (coverage is §3.5d's)" };
    const sig = (n) => { const s = []; (function walk(x, d) {
      if (d > 4) return;
      if (isArr(x.strokes) && x.strokes.length)
        s.push(JSON.stringify({ p: x.strokes, w: [x.strokeTopWeight, x.strokeRightWeight, x.strokeBottomWeight, x.strokeLeftWeight] }));
      if (x.children) for (const c of x.children) walk(c, d + 1);
    })(n, 0); return s.join("|"); };
    const same = (a, b) => Object.keys(a).concat(Object.keys(b)).every((k) => k === S || a[k] === b[k]);
    const findings = [];
    for (const f of focus) {
      const rest = vs.find((x) => x.p[S] === R && same(x.p, f.p));
      if (rest && sig(f.v) === sig(rest.v)) findings.push({ variant: f.v.name, finding: F + " has no visible ring/stroke difference from " + R });
    }
    return { set: set.name, findings };
  };

  // ---- §3.7b text size ---------------------------------------------------
  // Target size and contrast are scanner/audit.js's (accessibility|target,
  // accessibility|contrast). Text below opts.minText, from the settings (a
  // missing minimum skips the probe), is listed for the reader, who drops
  // disabled text (figma-standard rule 26).
  FCA.textSizes = (set, opts) => {
    opts = opts || {};
    const MIN_TEXT = opts.minText || null, smallText = [];
    if (MIN_TEXT) for (const v of FCA.variantsOf(set)) (function walk(n, d) {
      if (d > 6) return;
      if (n.type === "TEXT" && typeof n.fontSize === "number" && n.fontSize < MIN_TEXT)
        smallText.push({ variant: v.name, layer: n.name, fontSize: n.fontSize });
      if (n.children) for (const c of n.children) walk(c, d + 1);
    })(v, 0);
    return { set: set.name, minText: MIN_TEXT, smallText };
  };

  // One bound variable in one mode, following aliases BY MODE NAME — into
  // modes[0] returns a real colour that is simply the wrong one. `api` is
  // { variable(id), collection(id) }, async; it defaults to figma.variables.
  // The value is rgba: never drop `a`.
  FCA.resolveInMode = async (varId, modeName, api, hops) => {
    hops = hops || 0;
    api = api || { variable: (id) => figma.variables.getVariableByIdAsync(id),
                   collection: (id) => figma.variables.getVariableCollectionByIdAsync(id) };
    const v = await api.variable(varId);
    if (!v) return undefined;
    const c = await api.collection(v.variableCollectionId);
    if (!c) return undefined;
    const m = c.modes.find((x) => x.name === modeName) || c.modes[0];
    const val = v.valuesByMode[m.modeId];
    if (val && val.type === "VARIABLE_ALIAS") return hops < 6 ? FCA.resolveInMode(val.id, modeName, api, hops + 1) : undefined;
    return val;
  };

  // ---- §3.8 text property coverage and overflow -------------------------
  // One walk, both questions: `missing` (no text property) and `overflow`
  // (has one, cannot grow). Slot content needs no property (ruling
  // 2026-08-13); nested instance text is that component's concern.
  FCA.textCoverage = (set) => {
    const missing = [], overflow = [];
    const variants = FCA.variantsOf(set);
    for (const v of variants) (function walk(n, d, inSlot) {
      if (n.type === "INSTANCE" || d > 7) return;
      if (n.type === "SLOT") inSlot = true;
      if (n.type === "TEXT" && !inSlot) {
        const hasProp = !!(n.componentPropertyReferences && n.componentPropertyReferences.characters);
        const row = { variant: v.name, layer: n.name, id: n.id, chars: (n.characters || "").length, sample: (n.characters || "").slice(0, 40) };
        if (!hasProp) missing.push(row);
        else if (n.textAutoResize === "NONE" && n.textTruncation !== "ENDING")
          overflow.push(Object.assign({}, row, { autoResize: n.textAutoResize, truncation: n.textTruncation, maxLines: n.maxLines }));
      }
      if (n.children) for (const c of n.children) walk(c, d + 1, inSlot);
    })(v, 0, false);
    return { set: set.name, variants: variants.length, missing, overflow };
  };

  // ---- §3.8c naming case: classify, never judge -------------------------
  // A segment not starting with a letter carries no case and is excluded.
  FCA.caseShape = (s) =>
    !/^\p{L}/u.test(s) ? null
    : /^[a-z][^A-Z]*$/.test(s) ? "lower"
    : /^[A-Z][^A-Z]*$/.test(s) ? "initial-cap"
    // upper BEFORE camel-inner: "WCAG" also matches the camel pattern, and
    // in the prose order "upper" was unreachable for every acronym.
    : /^[\p{Lu}\s]+$/u.test(s) ? "upper"
    : /^[A-Z][a-z]*[A-Z]/.test(s) ? "camel-inner"
    : "mixed";
  // spaces: [{ space, names }]. Minorities are case shapes outnumbered at the same DEPTH
  // (figma-standard rule 18's evidence — pooling depths reports a convention as its own
  // violation). Two names equal but for case (figma-standard rule 19) are figma-foundations-audit's,
  // never reported here: that skill owns the collision.
  FCA.classifyNameSpaces = (spaces) => spaces.filter((sp) => sp.names.length).map((sp) => {
    const tally = {}, members = {};
    for (const n of sp.names) {
      const segs = n.split("/");
      segs.forEach((seg, i) => {
        const slot = i === segs.length - 1 ? "leaf" : "d" + i;
        const sh = FCA.caseShape(seg.trim());
        if (!sh) return;
        tally[slot] = tally[slot] || {}; members[slot] = members[slot] || {};
        tally[slot][sh] = (tally[slot][sh] || 0) + 1;
        (members[slot][sh] = members[slot][sh] || []).push(n);
      });
    }
    const minorities = {};
    for (const slot of Object.keys(tally)) {
      const counts = Object.entries(tally[slot]);
      if (counts.length < 2) continue;
      const top = counts.slice().sort((a, b) => b[1] - a[1])[0][0];
      for (const [sh, n] of counts) if (sh !== top)
        minorities[slot + ":" + sh] = { count: n, majority: top + " x" + tally[slot][top], examples: [...new Set(members[slot][sh])].slice(0, 8) };
    }
    return { space: sp.space, total: sp.names.length, minorities };
  }).filter((r) => Object.keys(r.minorities).length);

  // ---- §3.9 detached-frame candidates: the decision half ----------------
  // A page's prefix is its first whitespace-free run. A page sharing a
  // component page's prefix IS a component page, whatever the prefix is.
  FCA.pagePrefix = (name) => { const m = String(name).match(/^\S+/); return m ? m[0] : null; };
  FCA.isCandidatePage = (name, prefixes, exemptPages) => {
    // Pages exempt from the scan come from the settings; none by default.
    if ((exemptPages || []).includes(name)) return false;
    const p = FCA.pagePrefix(name);
    return !(p && prefixes.has(p));
  };
  FCA.detachedSuspects = (pageName, frames, componentNames) =>
    frames.filter((n) => componentNames.has(n.name)).map((n) => ({ page: pageName, name: n.name, id: n.id, type: n.type }));

  // ---- §3.10a disabled paints, strokes and effects ----------------------
  // Array.isArray first: `fills` is figma.mixed on per-character text, and
  // indexing it throws mid-walk and loses every finding already collected.
  FCA.disabledPaints = (set) => {
    const findings = [];
    for (const v of FCA.variantsOf(set)) (function walk(n, d) {
      if (n.type === "INSTANCE" || d > 7) return;
      for (const prop of ["fills", "strokes", "effects"]) {
        const arr = n[prop];
        if (!isArr(arr)) continue;
        arr.forEach((e, i) => { if (e && e.visible === false) findings.push({ variant: v.name, layer: n.name, id: n.id, prop, index: i }); });
      }
      if (n.children) for (const c of n.children) walk(c, d + 1);
    })(v, 0);
    return { set: set.name, findings };
  };

  // ---- §3.10d instances whose main component is gone --------------------
  // `!main.parent` is trustworthy only with no publish key: a healthy remote
  // main reads the same whenever its file is not connected. With a key, a
  // null parent means "verify" — importByKey, once per key. A failure is not
  // proof either: retry it once, isolated, before reporting.
  FCA.orphans = async (set, importByKey) => {
    importByKey = importByKey || ((k) => figma.importComponentByKeyAsync(k));
    const orphans = [], keyCache = new Map();
    const stack = set.type === "COMPONENT_SET" ? [...set.children] : [set];
    while (stack.length) {
      const n = stack.pop();
      if (n.type === "INSTANCE") {
        const main = await n.getMainComponentAsync(); // never n.mainComponent — throws under dynamic-page
        if (!main) { orphans.push({ layer: n.name, id: n.id, reason: "main not resolvable" }); continue; }
        if (main.parent) continue;
        if (!main.key) { orphans.push({ layer: n.name, id: n.id, reason: "main detached from the document (local, unpublished)" }); continue; }
        if (!keyCache.has(main.key)) {
          let res = true;
          try { await importByKey(main.key); }
          catch (e) {
            try { await importByKey(main.key); } // the one retry
            catch (e2) { res = (e2 && e2.message) || String(e2); }
          }
          keyCache.set(main.key, res);
        }
        const r = keyCache.get(main.key);
        if (r !== true) orphans.push({ layer: n.name, id: n.id, reason: "remote key " + main.key + " failed to resolve: " + r });
        continue; // never descend into an instance
      }
      if (n.children) stack.push(...n.children);
    }
    return { set: set.name, orphans };
  };

  // ---- §3.13 a composed frame: library instances and bound values only --
  // A screen an agent or a designer composes from the library, not a library
  // component. What the composer authored is the root (unless it is an
  // instance) and whatever they put in a slot of an instance they placed, at
  // any depth; the rest — an instance's own drawing, and a slot's default
  // content — is the library's, checked where it is drawn. A slot child is a
  // default when its id, taken relative to the placed instance, is a node of
  // that instance's main component (seen live: inserted content's is not).
  // In what was authored: a node that is not a frame, component, section or
  // instance is `raw` (a group is raw too, and its children are still read);
  // a frame's non-zero gap, wrap gap, grid gaps, padding and corner radius,
  // and each visible solid fill and stroke without a style, are `unbound`;
  // a placed instance whose main does not resolve, or is a local main gone
  // from the document, is `orphan`; a frame named like a component it uses,
  // or one in `componentNames`, or any frame Figma marks as detached
  // (`detachedInfo`), is `detached`, saying `by` which (`figma` or `name`) and
  // `root` when the root itself is the detached copy; a raw text says whether it has a text
  // style (`styled`). `checked` counts what was judged, bound or not (values,
  // solid paints, texts), so a caller can turn findings into a share, and
  // `keys` counts placed instances by their main component's key. Hidden
  // layers are skipped.
  const FRAME_NUMS = ["paddingLeft", "paddingRight", "paddingTop", "paddingBottom", "topLeftRadius", "topRightRadius", "bottomLeftRadius", "bottomRightRadius"];
  FCA.composedFindings = async (root, mainOf, componentNames, opts) => {
    const findings = [], seen = new Set(componentNames || []), frames = [], detached = new Set();
    const checked = { values: 0, paints: 0, texts: 0 }, keys = {};
    let instances = 0;
    const at = (trail) => trail.join(" / ");
    const num = (n, k, t) => {
      if (typeof n[k] !== "number" || n[k] === 0) return;
      checked.values++;
      if (!(n.boundVariables || {})[k]) findings.push({ kind: "unbound", path: at(t), id: n.id, prop: k, value: n[k] });
    };
    const paints = (n, prop, styleKey, t) => {
      const arr = n[prop];
      if (!isArr(arr)) return;
      const styled = typeof n[styleKey] === "string" && !!n[styleKey];
      arr.forEach((pt, i) => {
        if (!pt || pt.visible === false || pt.opacity === 0 || pt.type !== "SOLID") return;
        checked.paints++;
        if (!styled && !(pt.boundVariables && pt.boundVariables.color)) findings.push({ kind: "unbound", path: at(t), id: n.id, prop: prop + "[" + i + "]" });
      });
    };
    const authored = async (n, trail, isRoot) => {
      if (n.visible === false) return;
      const t = [...trail, n.name];
      if (n.type === "INSTANCE") return instance(n, t);
      if (n.type === "FRAME" || n.type === "COMPONENT") {
        if (!isRoot) frames.push({ n, t });
        if (n.detachedInfo) { detached.add(n.id); findings.push({ kind: "detached", path: at(t), id: n.id, by: "figma", ...(isRoot ? { root: true } : {}) }); }
        const lm = n.layoutMode;
        if ((lm === "HORIZONTAL" || lm === "VERTICAL") && n.primaryAxisAlignItems !== "SPACE_BETWEEN") num(n, "itemSpacing", t);
        if ((lm === "HORIZONTAL" || lm === "VERTICAL") && n.layoutWrap === "WRAP" && n.counterAxisAlignContent !== "SPACE_BETWEEN") num(n, "counterAxisSpacing", t);
        if (lm === "GRID") { num(n, "gridRowGap", t); num(n, "gridColumnGap", t); }
        for (const k of FRAME_NUMS) if (!k.startsWith("padding") || (lm && lm !== "NONE")) num(n, k, t);
        paints(n, "fills", "fillStyleId", t);
        paints(n, "strokes", "strokeStyleId", t);
      } else if (n.type === "TEXT") {
        // a text style id is a string ("" when none) or figma.mixed, read as styled: some range carries one
        checked.texts++;
        findings.push({ kind: "raw", path: at(t), id: n.id, type: n.type, styled: typeof n.textStyleId !== "string" || !!n.textStyleId });
      } else if (n.type !== "SECTION") findings.push({ kind: "raw", path: at(t), id: n.id, type: n.type });
      for (const c of n.children || []) await authored(c, t, false);
    };
    // a placed instance: checked itself, then only what was put in its slots
    const instance = async (n, t) => {
      instances++;
      const main = await mainOf(n);
      if (!main || (!main.parent && !main.key)) findings.push({ kind: "orphan", path: at(t), id: n.id });
      if (main && main.key) keys[main.key] = (keys[main.key] || 0) + 1;
      if (main) { seen.add(main.name); if (main.parent && main.parent.type === "COMPONENT_SET") seen.add(main.parent.name); }
      const own = new Set(main && main.findAll ? main.findAll(() => true).map((x) => x.id) : []);
      const pre = (String(n.id).startsWith("I") ? n.id : "I" + n.id) + ";"; // an instance inside another is already I-prefixed
      const isDefault = (c) => { if (!String(c.id).startsWith(pre)) return false; const rel = c.id.slice(pre.length); return own.has(rel.includes(";") ? "I" + rel : rel); };
      const stack = [...(n.children || [])];
      while (stack.length) {
        const c = stack.pop();
        if (c.visible === false) continue;
        if (c.type === "SLOT") { for (const k of c.children || []) { if (isDefault(k)) stack.push(k); else await authored(k, [...t, c.name], false); } }
        else if (c.children) stack.push(...c.children);
      }
    };
    if (root.type === "INSTANCE") await instance(root, [root.name]); else await authored(root, [], true);
    for (const { n, t } of frames) if (seen.has(n.name) && !detached.has(n.id)) findings.push({ kind: "detached", path: at(t), id: n.id, by: "name" });
    // an agent's frame carries its receipt (shared plugin data `fca` /
    // `receipt`, JSON, so any plugin or bridge reads it): with
    // `receipt: true` a frame with none, or one naming no reference screen,
    // is a finding — the composer started from the bare template
    if (opts && opts.receipt) {
      let r = null;
      try { r = JSON.parse(root.getSharedPluginData("fca", "receipt") || "null"); } catch (e) { r = null; }
      if (!r) findings.push({ kind: "no-receipt", path: root.name, id: root.id });
      else if (!r.reference) findings.push({ kind: "no-reference", path: root.name, id: root.id });
    }
    return { frame: root.name, instances, checked, keys, findings };
  };
  FCA.composedFrame = (frame, componentNames, opts) => FCA.composedFindings(frame, (n) => n.getMainComponentAsync(), componentNames, opts);

  // ---- the reference screens built on a template ------------------------
  // Before composing, list every screen in the file that places the
  // template (a component or a set, local or from a library; a variant is
  // read as its whole set): the composer starts from the closest one, never
  // from the bare template. An instance inside a component, or inside
  // another instance's own drawing, is the library's; one in another
  // instance's slot counts (a slot's default content too: telling it apart
  // needs the main's ids, and no template ships as a default). Hidden ones,
  // or ones in a hidden section, are skipped. One row per instance: the instance, its variant, its screen (the frame just under the
  // page or a section) and page, and `composed` when that screen carries a
  // receipt, so a past prototype is told from a designer's screen.
  FCA.referenceList = async (template, instancesOf) => {
    if (template.type === "COMPONENT" && template.parent && template.parent.type === "COMPONENT_SET") template = template.parent;
    const variants = template.type === "COMPONENT_SET" ? template.children : [template];
    const rows = [];
    for (const v of variants) for (const i of await instancesOf(v)) {
      let top = i, inside = false, hidden = i.visible === false, viaSlot = false;
      for (let p = i.parent; p && p.type !== "PAGE" && p.type !== "DOCUMENT" && p.type !== "SECTION"; p = p.parent) {
        if (p.visible === false) hidden = true;
        if (p.type === "SLOT") viaSlot = true;
        else if (p.type === "COMPONENT" || p.type === "COMPONENT_SET") inside = true;
        else if (p.type === "INSTANCE") { if (!viaSlot) inside = true; viaSlot = false; }
        top = p;
      }
      if (inside || hidden) continue;
      let page = top.parent;
      while (page && page.type !== "PAGE") { if (page.visible === false) hidden = true; page = page.parent; }
      if (hidden) continue;
      const composed = !!(top.getSharedPluginData && top.getSharedPluginData("fca", "receipt"));
      rows.push({ id: i.id, variant: v.name, frame: top.name, frameId: top.id, page: page ? page.name : null, composed });
    }
    return rows.sort((a, b) => (a.composed - b.composed) || (a.page || "").localeCompare(b.page || "") || a.frame.localeCompare(b.frame));
  };
  FCA.references = (template) => FCA.referenceList(template, (v) => v.getInstancesAsync());

  // ---- §3.10f text with a fixed height ----------------------------------
  // textAutoResize alone decides "fixed". layoutSizingVertical is reported,
  // never used to decide — it can read FIXED under a real auto-layout parent
  // while the text hugs (33 false hits on one layer). FILL overrides.
  FCA.fixedText = (set) => {
    const findings = [];
    for (const v of FCA.variantsOf(set)) (function walk(n, d) {
      if (n.type === "INSTANCE" || d > 7) return;
      if (n.type === "TEXT") {
        const autoResize = n.textAutoResize, vertical = n.layoutSizingVertical;
        const hasAL = !!(n.parent && n.parent.layoutMode && n.parent.layoutMode !== "NONE");
        const truncating = n.textTruncation === "ENDING" || (typeof n.maxLines === "number" && n.maxLines > 0);
        if (autoResize === "NONE" && vertical !== "FILL" && !truncating)
          findings.push({ variant: v.name, layer: n.name, id: n.id, textAutoResize: autoResize, layoutSizingVertical: vertical,
            hasAutoLayoutParent: hasAL, height: Math.round(n.height), chars: (n.characters || "").length });
      }
      if (n.children) for (const c of n.children) walk(c, d + 1);
    })(v, 0);
    return { set: set.name, findings };
  };

  // ---- §3.10e axes that only toggle visibility --------------------------
  // The signature skips the variant root (its name IS "Axis=Value", so
  // including it disqualified every pair and the check could never fire) and
  // excludes fills, sizes and text. An axis is reported only when EVERY pair
  // differing on it alone differs only in visibility — one pair proves
  // nothing. The prose said so; its code reported any one pair.
  FCA.visibilityAxes = (set) => {
    if (set.type !== "COMPONENT_SET") return { set: set.name, suspects: {} };
    const sig = (v) => { const out = []; (function walk(n, d, path) {
      if (n.type === "INSTANCE" || d > 6) return;
      if (d > 0) out.push(path + "|" + n.name + "|" + n.type + "|" + (n.visible !== false));
      if (n.children) n.children.forEach((c, i) => walk(c, d + 1, path + "/" + i));
    })(v, 0, ""); return out; };
    const vs = set.children.map((v) => ({ name: v.name, props: FCA.parseVariant(v.name), sig: sig(v) }));
    const tally = {};
    for (let i = 0; i < vs.length; i++) for (let j = i + 1; j < vs.length; j++) {
      const a = vs[i], b = vs[j];
      const keys = [...new Set(Object.keys(a.props).concat(Object.keys(b.props)))];
      const diffAxes = keys.filter((k) => a.props[k] !== b.props[k]);
      if (diffAxes.length !== 1) continue;
      const t = (tally[diffAxes[0]] = tally[diffAxes[0]] || { pairs: 0, hits: [] });
      t.pairs++;
      if (a.sig.length !== b.sig.length) continue;
      const diffs = a.sig.map((s, k) => [s, b.sig[k]]).filter(([x, y]) => x !== y);
      const onlyVisibility = diffs.length > 0 && diffs.every(([x, y]) => x.slice(0, x.lastIndexOf("|")) === y.slice(0, y.lastIndexOf("|")));
      if (onlyVisibility) t.hits.push([a.name, b.name]);
    }
    const suspects = {};
    for (const [axis, t] of Object.entries(tally)) if (t.hits.length && t.hits.length === t.pairs) suspects[axis] = t.hits;
    return { set: set.name, suspects };
  };

  // ---- §4b-2 property wiring: pure halves -------------------------------
  FCA.refKind = (type) => ({ TEXT: "characters", BOOLEAN: "visible", INSTANCE_SWAP: "mainComponent" })[type] || null;
  // Spread, never replace: a layer can carry visible, characters and
  // mainComponent at once, and a fresh object drops the rest silently.
  FCA.mergeRefs = (existing, kind, key) => Object.assign({}, existing || {}, { [kind]: key });

  // ======================================================================
  // Live calls — need `figma`. Syntax-checked only.
  // ======================================================================

  // §0 locate a component set by page name, inside the project's page filter.
  FCA.locate = async (target, componentPages) => {
    const PAGES = componentPages ? new RegExp(componentPages) : null;
    const page = figma.root.children.find((p) => p.name.toLowerCase().includes(String(target).toLowerCase()) && (!PAGES || PAGES.test(p.name)));
    if (!page) return { error: "no page" };
    await page.loadAsync();
    const sets = page.findAllWithCriteria({ types: ["COMPONENT_SET"] });
    return { page: page.name, sets: sets.map((s) => ({ name: s.name, id: s.id, variants: s.children.length })) };
  };

  // §0.5 discovery, from the COMPLETE library (teamLibrary), plus local
  // collections. Collection identity is the KEY.
  FCA.discover = async () => {
    const libs = await figma.teamLibrary.getAvailableLibraryVariableCollectionsAsync();
    const out = { collections: [], scales: {}, colourRoles: {}, allowedKeys: {}, localCollections: [] };
    for (const l of libs) {
      const label = l.libraryName + " :: " + l.name;
      out.collections.push({ name: l.name, key: l.key, library: l.libraryName });
      out.allowedKeys[l.key] = label;
      let vars = [];
      try { vars = await figma.teamLibrary.getVariablesInLibraryCollectionAsync(l.key); } catch (e) { continue; }
      const names = vars.map((v) => v.name);
      out.scales[label] = FCA.numericScales(names);
      const roles = FCA.colourRoles(names);
      if (roles.length) out.colourRoles[label] = roles;
    }
    for (const c of await figma.variables.getLocalVariableCollectionsAsync()) {
      if (c.remote === true) continue;   // a library's collection: never relabelled local
      const names = [];
      for (const id of c.variableIds) { const v = await figma.variables.getVariableByIdAsync(id); if (v) names.push(v.name); }
      const defaultName = FCA.isDefaultCollectionName(c.name);
      out.localCollections.push({ name: c.name, key: c.key, variables: names, defaultName });
      // A library binds its own local variables: their keys are allowed too,
      // or every such binding reads as off-library. A default-named stray is
      // a finding (defaultName), not an allowed source.
      if (!defaultName) out.allowedKeys[c.key] = "local :: " + c.name;
    }
    return out;
  };

  // §3.8c gather: one name space per variable collection, style type, and
  // the components. Then FCA.classifyNameSpaces.
  FCA.nameSpaces = async () => {
    await figma.loadAllPagesAsync();
    const spaces = [];
    for (const c of await figma.variables.getLocalVariableCollectionsAsync()) {
      const names = [];
      for (const id of c.variableIds) { const v = await figma.variables.getVariableByIdAsync(id); if (v) names.push(v.name); }
      spaces.push({ space: "variables: " + c.name, names });
    }
    spaces.push({ space: "text styles", names: (await figma.getLocalTextStylesAsync()).map((s) => s.name) });
    spaces.push({ space: "effect styles", names: (await figma.getLocalEffectStylesAsync()).map((s) => s.name) });
    spaces.push({ space: "components", names: figma.root.findAllWithCriteria({ types: ["COMPONENT_SET", "COMPONENT"] })
      .filter((n) => !(n.type === "COMPONENT" && n.parent && n.parent.type === "COMPONENT_SET")).map((n) => n.name) });
    return FCA.classifyNameSpaces(spaces);
  };

  // §3.9 scan. Each page is LOADED before it is read — the prose version
  // queried a page's children before loadAsync, which under dynamic-page
  // access sees an unloaded page as empty and skips it.
  FCA.detachedScan = async (exemptPages) => {
    const componentNames = new Set(), prefixes = new Set();
    const top = (s) => s.parent && s.parent.type !== "COMPONENT_SET" && ["PAGE", "SECTION", "FRAME"].includes(s.parent.type);
    for (const page of figma.root.children) {
      await page.loadAsync();
      const comps = page.findAllWithCriteria({ types: ["COMPONENT_SET", "COMPONENT"] }).filter(top);
      if (!comps.length) continue;
      for (const s of comps) componentNames.add(s.name);
      const p = FCA.pagePrefix(page.name); if (p) prefixes.add(p);
    }
    const suspects = [];
    for (const page of figma.root.children) {
      if (!FCA.isCandidatePage(page.name, prefixes, exemptPages)) continue;
      await page.loadAsync();
      if (!page.children.length) continue;
      suspects.push(...FCA.detachedSuspects(page.name, page.findAllWithCriteria({ types: ["FRAME", "GROUP"] }), componentNames));
    }
    return suspects;
  };

  // §5 whole-library sweep: schema and property naming, no token walk.
  FCA.sweepSchema = async (componentPages, opts) => {
    const PAGES = componentPages ? new RegExp(componentPages) : null;
    const out = [];
    for (const page of figma.root.children.filter((p) => !PAGES || PAGES.test(p.name))) {
      await page.loadAsync();
      for (const set of page.findAllWithCriteria({ types: ["COMPONENT_SET"] })) {
        const defs = set.componentPropertyDefinitions;
        const findings = FCA.schemaFindings(defs, opts).concat(FCA.propertyNamingFindings(defs, opts));
        if (findings.length) out.push({ page: page.name, set: set.name, findings });
      }
    }
    return out;
  };

  // §4 fixes — only after approval. Each re-reads the node FRESH and reports
  // what is now bound, rather than trusting the write call's return.
  const readBinding = async (nodeId, field) => {
    const n = await figma.getNodeByIdAsync(nodeId);
    const b = n && n.boundVariables && n.boundVariables[field];
    const ids = (isArr(b) ? b : b ? [b] : []).map((x) => x.id);
    const names = [];
    for (const id of ids) { const v = await figma.variables.getVariableByIdAsync(id); names.push(v ? v.name : null); }
    return names;
  };
  // A variable id, or { sibling: nodeId } to copy the binding a correctly
  // bound sibling carries — the reliable path for remote tokens.
  const sourceVariable = async (source, field) => {
    let id = source;
    if (source && source.sibling) {
      const s = await figma.getNodeByIdAsync(source.sibling);
      const b = s && s.boundVariables && s.boundVariables[field];
      id = isArr(b) ? b[0] && b[0].id : b && b.id;
    }
    const v = id && (await figma.variables.getVariableByIdAsync(id));
    if (!v) throw new Error("no variable for " + JSON.stringify(source) + " on " + field);
    return v;
  };
  FCA.fix = {
    // §4a — a float field: itemSpacing, padding*, *Radius, stroke*Weight.
    // A uniform stroke binds on all four sides: binding one side of a 1px border
    // made Figma read it as per-side and drop the other three to 0, so the
    // border lost three edges (one library's time picker, 2026-10-08).
    bindVariable: async (nodeId, field, source) => {
      const node = await figma.getNodeByIdAsync(nodeId);
      const v = await sourceVariable(source, field);
      const SIDES = ["strokeTopWeight", "strokeBottomWeight", "strokeLeftWeight", "strokeRightWeight"];
      const fields = SIDES.includes(field) && SIDES.every((s) => node[s] === node[field]) ? SIDES : [field];
      for (const f of fields) node.setBoundVariable(f, v);
      return { node: node.name, field, fields, bound: await readBinding(nodeId, field) };
    },
    // §4a-2 — fills/strokes bind on the PAINT, and the array must be
    // reassigned. Only the paint at `index` changes; the prose replaced the
    // whole array with one paint and dropped any others.
    bindPaint: async (nodeId, prop, source, index) => {
      index = index || 0;
      const node = await figma.getNodeByIdAsync(nodeId);
      const arr = node[prop];
      if (!isArr(arr) || !arr[index]) throw new Error(node.name + ": no " + prop + "[" + index + "] to bind");
      const v = await sourceVariable(source, prop);
      const next = arr.slice();
      next[index] = figma.variables.setBoundVariableForPaint(arr[index], "color", v);
      node[prop] = next;
      return { node: node.name, prop, bound: await readBinding(nodeId, prop) };
    },
    // §4b-2 — declare a property and point every listed layer at its KEY.
    // An INSTANCE_SWAP default is the main's NODE id, never its key.
    addProperty: async (setId, name, type, layerIds, defaultValue) => {
      const kind = FCA.refKind(type);
      if (!kind) throw new Error("addProperty: " + type + " binds no layer");
      const set = await figma.getNodeByIdAsync(setId);
      const layers = [];
      for (const id of layerIds) { const n = await figma.getNodeByIdAsync(id); if (!n) throw new Error("no node " + id); layers.push(n); }
      if (type === "INSTANCE_SWAP" && defaultValue === undefined) defaultValue = (await layers[0].getMainComponentAsync()).id;
      const key = set.addComponentProperty(name, type, defaultValue);
      for (const n of layers) n.componentPropertyReferences = FCA.mergeRefs(n.componentPropertyReferences, kind, key);
      const unbound = [];
      for (const id of layerIds) {
        const n = await figma.getNodeByIdAsync(id);
        if (!(n.componentPropertyReferences && n.componentPropertyReferences[kind] === key)) unbound.push(id);
      }
      return { key, bound: layerIds.length - unbound.length, of: layerIds.length, unbound };
    },
  };

  globalThis.FCA = FCA;
  return FCA;
};
/* adoption-score generated end */

const { widget } = figma;
const { AutoLayout, Text, Rectangle, useSyncedState, usePropertyMenu, h } = widget;

// The look is the plugins' (skill-standard §B 4): FigUI3's light-theme values, read from plugins/_shared/figui3/fig.css.
// A widget draws on the canvas and cannot read CSS, so the values are copied here; widget font weights take hundreds,
// so FigUI3's 450 and 550 are 400 and 500.
const UI = {
  bg: '#FFFFFF', border: '#E6E6E6',
  text: '#000000E5', textSecondary: '#00000099', textTertiary: '#0000004D', textDanger: '#DC3412',
  brand: '#0D99FF', brandHover: '#007BE5', onBrand: '#FFFFFF',
  radiusWindow: 13, radiusControl: 5, s1: 4, s2: 8, s25: 12, s3: 16,
  body: { fontSize: 11, lineHeight: 16, fontWeight: 400, letterSpacing: 0.055 },
  heading: { fontSize: 13, lineHeight: 22, fontWeight: 500 },
};

// Each check is a share: what passed over what was judged. A check with nothing to judge is left out of the total.
/** @type {{ key: string, label: (t: any) => string, share: (t: any) => [number, number] }[]} */
const CHECKS = [
  { key: 'library', label: (t) => (t.system ? 'System components' : 'Library components'), share: (t) => [t.system ? t.systemInstances : t.instances - t.orphans, t.instances + t.raw] },
  { key: 'detach', label: () => 'Not detached', share: (t) => [t.instances, t.instances + t.detached] },
  { key: 'colour', label: () => 'Colour bound', share: (t) => [t.paints - t.unboundPaints, t.paints] },
  { key: 'spacing', label: () => 'Spacing and radius bound', share: (t) => [t.values - t.unboundValues, t.values] },
  { key: 'text', label: () => 'Text styles', share: (t) => [t.styledTexts, t.texts] },
];
// Bands are a house choice, not a researched threshold (README). Each carries a word, so colour is never the only cue;
// the fills are FigUI3's success, warning and danger.
const BANDS = [
  { min: 90, word: 'Good', fill: '#14AE5C', ink: '#FFFFFF' },
  { min: 75, word: 'Fair', fill: '#FFCD29', ink: '#000000E5' },
  { min: 0, word: 'Poor', fill: '#F24822', ink: '#FFFFFF' },
];
const bandOf = (/** @type {number} */ pct) => BANDS.find((b) => pct >= b.min) || BANDS[BANDS.length - 1];
// What a page holds that is a screen: a frame or a placed instance at the page's top level, or inside a section
// there (a section only groups screens). A component, a widget, a sticky or a loose layer is not one.
const SCREEN = ['FRAME', 'INSTANCE'];
/** @returns {SceneNode[]} */
const screensIn = (/** @type {readonly SceneNode[]} */ nodes) => nodes.flatMap((n) =>
  n.visible === false ? [] : n.type === 'SECTION' ? screensIn(n.children) : SCREEN.includes(n.type) ? [n] : []);
// The scope: every page, or only the page the widget sits on (a click or a menu choice happens on that page).
const SCOPES = [{ option: 'file', label: 'All pages' }, { option: 'page', label: 'This page' }];

// A library is named by a link to its file; the key is the part after /design/ or /file/ (a branch link's main file,
// since only a main file publishes).
/** @returns {{ fileKey: string, name: string } | null} */
function parseLink(/** @type {string} */ link) {
  const m = /figma\.com\/(?:design|file)\/([A-Za-z0-9]+)(?:\/branch\/[A-Za-z0-9]+)?(?:\/([^/?#]+))?/.exec(link.trim());
  if (!m) return null;
  let name = m[1];
  try { if (m[2]) name = decodeURIComponent(m[2]).replace(/-/g, ' '); } catch (e) { name = m[2] || m[1]; }
  return { fileKey: m[1], name };
}

// Every published component's key in a library, from Figma's REST API (one call per library, Tier 3).
async function libraryKeys(/** @type {{ fileKey: string, name: string }} */ lib, /** @type {string} */ token) {
  let res;
  try { res = await fetch(`https://api.figma.com/v1/files/${lib.fileKey}/components`, { headers: { 'X-Figma-Token': token } }); }
  catch (e) { throw new Error(`${lib.name}: could not reach Figma (${String((e && /** @type {any} */ (e).message) || e)})`); }
  if (!res.ok) throw new Error(`${lib.name}: Figma answered ${res.status}${res.status === 403 ? ' (the token cannot read this library, or lacks the library_content:read scope)' : res.status === 404 ? ' (no published library at this link)' : ''}`);
  const body = await res.json();
  return ((body.meta && body.meta.components) || []).map((/** @type {any} */ c) => String(c.key));
}

async function scan(/** @type {string} */ scope, /** @type {{ fileKey: string, name: string }[]} */ libraries) {
  figma.skipInvisibleInstanceChildren = true;
  /** @type {Set<string> | null} */
  let system = null;
  if (libraries.length) {
    const token = await figma.clientStorage.getAsync('token');
    if (!token) throw new Error('System libraries are set, but this computer has no token: open System libraries… in the widget’s menu.');
    system = new Set();
    for (const lib of libraries) for (const k of await libraryKeys(lib, token)) system.add(k);
  }
  const FCA = FCA_FACTORY();
  const t = { pages: 0, screens: 0, instances: 0, systemInstances: 0, orphans: 0, raw: 0, detached: 0, paints: 0, unboundPaints: 0, values: 0, unboundValues: 0, texts: 0, styledTexts: 0, system: !!system };
  const pages = scope === 'page' ? [figma.currentPage] : figma.root.children;
  for (const page of pages) {
    await page.loadAsync();
    const roots = screensIn(page.children);
    if (roots.length) t.pages++;
    for (const root of roots) {
      const r = await FCA.composedFrame(root);
      t.screens++;
      t.instances += r.instances;
      t.paints += r.checked.paints;
      t.values += r.checked.values;
      t.texts += r.checked.texts;
      if (system) for (const [k, n] of Object.entries(r.keys)) if (system.has(k)) t.systemInstances += Number(n);
      for (const f of r.findings) {
        if (f.kind === 'orphan') t.orphans++;
        // a detach is one Figma marks, inside a screen: a whole screen detached from a template was meant to be,
        // and a frame merely named like a component may be the designer's own (README)
        else if (f.kind === 'detached') { if (f.by === 'figma' && !f.root) t.detached++; }
        else if (f.kind === 'raw' && f.type === 'TEXT') { if (f.styled) t.styledTexts++; }
        else if (f.kind === 'raw') t.raw++;
        else if (f.kind === 'unbound') { if (/^(fills|strokes)\[/.test(f.prop)) t.unboundPaints++; else t.unboundValues++; }
      }
    }
  }
  return t;
}

function score(/** @type {any} */ t) {
  const rows = CHECKS.map((c) => {
    const [pass, total] = c.share(t);
    return { key: c.key, label: c.label(t), pass, total, pct: total ? Math.round((100 * pass) / total) : null };
  });
  const live = rows.filter((r) => r.pct !== null);
  const total = live.length ? Math.round(live.reduce((n, r) => n + /** @type {number} */ (r.pct), 0) / live.length) : null;
  return { total, rows };
}

// The settings window (ui.html, FigUI3): the token stays on this machine, the libraries are the file's choice.
// The returned promise keeps the widget's code alive until the window closes.
function openLibraries(/** @type {any[]} */ libraries, /** @type {(libs: any[]) => void} */ setLibraries, /** @type {() => void} */ clearResult) {
  return new Promise((resolve) => {
    figma.showUI(__html__, { themeColors: true, width: 360, height: 400, title: 'System libraries' });
    figma.on('close', () => resolve(null));
    figma.clientStorage.getAsync('token').then((token) => figma.ui.postMessage({ type: 'init', hasToken: !!token, links: libraries.map((l) => l.link).join('\n') }));
    figma.ui.onmessage = async (msg) => {
      try {
        if (msg.type === 'save') {
          const parsed = String(msg.links || '').split(/\s+/).filter(Boolean).map((link) => ({ link, lib: parseLink(link) }));
          const bad = parsed.filter((p) => !p.lib).map((p) => p.link);
          if (bad.length) { figma.ui.postMessage({ type: 'error', message: 'Not a Figma file link: ' + bad.join(', ') }); return; }
          const token = String(msg.token || '').trim();
          if (parsed.length && !token && !(await figma.clientStorage.getAsync('token'))) { figma.ui.postMessage({ type: 'error', message: 'A token is needed to read the libraries.' }); return; }
          if (token) await figma.clientStorage.setAsync('token', token);
          // one entry per library file, however many links name it
          const seen = new Set();
          const next = parsed.filter((p) => { const k = /** @type {any} */ (p.lib).fileKey; return seen.has(k) ? false : (seen.add(k), true); }).map((p) => ({ link: p.link, .../** @type {any} */ (p.lib) }));
          // the last run was counted against the old libraries, so it no longer describes them; a token alone changes nothing counted
          if (next.map((l) => l.fileKey).join() !== libraries.map((l) => l.fileKey).join()) { setLibraries(next); clearResult(); }
          figma.closePlugin();
        } else if (msg.type === 'forget') {
          await figma.clientStorage.deleteAsync('token');
          figma.ui.postMessage({ type: 'init', hasToken: false, links: msg.links });
        } else if (msg.type === 'cancel') figma.closePlugin();
      } catch (e) {
        figma.ui.postMessage({ type: 'error', message: String((e && /** @type {any} */ (e).message) || e) });
      }
    };
  });
}

const txt = (/** @type {string} */ s, /** @type {any} */ type, /** @type {any} */ extra) => h(Text, { fontFamily: 'Inter', ...type, fill: UI.text, ...extra }, s);

const chip = (/** @type {number} */ pct) => {
  const b = bandOf(pct);
  return h(AutoLayout, { fill: b.fill, cornerRadius: UI.radiusControl, height: 20, padding: { horizontal: 6 }, verticalAlignItems: 'center' },
    txt(b.word, UI.body, { fontWeight: 500, fill: b.ink }));
};

const divider = (/** @type {string} */ key) => h(Rectangle, { key, width: 'fill-parent', height: 1, fill: UI.border });

const row = (/** @type {any} */ r) => h(AutoLayout, { key: r.key, width: 'fill-parent', padding: { vertical: UI.s2 }, spacing: UI.s2, verticalAlignItems: 'center' },
  h(AutoLayout, { direction: 'vertical', width: 'fill-parent' },
    txt(r.label, UI.body),
    txt(r.total ? `${r.pass.toLocaleString()} of ${r.total.toLocaleString()}` : 'nothing to check', UI.body, { fill: UI.textSecondary })),
  r.pct === null
    ? txt('—', UI.body, { fill: UI.textTertiary })
    : h(AutoLayout, { spacing: UI.s2, verticalAlignItems: 'center' }, txt(r.pct + '%', UI.body, { fontWeight: 500 }), chip(r.pct)));

function AdoptionScore() {
  const [result, setResult] = useSyncedState('result', /** @type {any} */ (null));
  const [error, setError] = useSyncedState('error', '');
  const [scope, setScope] = useSyncedState('scope', 'file');
  const [libraries, setLibraries] = useSyncedState('libraries', /** @type {any[]} */ ([]));

  usePropertyMenu([
    { itemType: 'dropdown', propertyName: 'scope', tooltip: 'Scope', selectedOption: scope, options: SCOPES },
    { itemType: 'action', propertyName: 'libraries', tooltip: 'System libraries…' },
  ], ({ propertyName, propertyValue }) => {
    if (propertyName === 'scope' && propertyValue) setScope(propertyValue);
    if (propertyName === 'libraries') return openLibraries(libraries, setLibraries, () => { setResult(null); setError(''); });
  });

  const run = async () => {
    try {
      const t = await scan(scope, libraries);
      setResult({ ...t, scope, at: new Date().toISOString() });
      setError('');
    } catch (e) {
      const msg = String((e && /** @type {any} */ (e).message) || e);
      setError(msg);
      figma.notify('Adoption score: ' + msg, { error: true });
    }
  };

  const s = result ? score(result) : null;
  // the run's time in UTC, as the ISO string stores it: the widget sandbox's Intl support is not relied on
  const when = result ? String(result.at).slice(0, 16).replace('T', ' ') + ' UTC' : '';
  const source = libraries.length ? 'System: ' + libraries.map((/** @type {any} */ l) => l.name).join(', ') : 'System: every library. Set yours in the widget’s menu.';
  const where = result ? `${result.screens} screens on ${result.scope === 'page' ? 'this page' : result.pages + ' pages'} · ${when}` : (scope === 'page' ? 'Scope: this page' : 'Scope: all pages');

  return h(AutoLayout, { direction: 'vertical', width: 360, fill: UI.bg, cornerRadius: UI.radiusWindow, stroke: UI.border, effect: { type: 'drop-shadow', color: { r: 0, g: 0, b: 0, a: 0.15 }, offset: { x: 0, y: 2 }, blur: 6 } },
    h(AutoLayout, { direction: 'vertical', width: 'fill-parent', padding: { horizontal: UI.s3, top: UI.s25, bottom: UI.s2 }, spacing: UI.s2 },
      txt('Adoption score', UI.heading),
      s && s.total !== null
        ? h(AutoLayout, { spacing: UI.s25, verticalAlignItems: 'center' },
            txt(String(s.total), { fontSize: 40, lineHeight: 48, fontWeight: 600 }),
            h(AutoLayout, { direction: 'vertical', spacing: UI.s1 }, chip(s.total), txt('out of 100', UI.body, { fill: UI.textSecondary })))
        : txt(result ? 'Nothing to score: no screens found.' : 'Scans the screens for system components, detaches, bound colour and spacing, and text styles.', UI.body, { fill: UI.textSecondary, width: 'fill-parent' }),
      txt(source, UI.body, { fill: UI.textSecondary, width: 'fill-parent' })),
    s ? h(AutoLayout, { direction: 'vertical', width: 'fill-parent', padding: { horizontal: UI.s3 } }, ...s.rows.flatMap((r) => [divider('line-' + r.key), row(r)])) : null,
    error ? h(AutoLayout, { width: 'fill-parent', padding: { horizontal: UI.s3, vertical: UI.s2 } }, txt('Error: ' + error, UI.body, { fill: UI.textDanger, width: 'fill-parent' })) : null,
    divider('footer-line'),
    h(AutoLayout, { width: 'fill-parent', padding: UI.s25, spacing: UI.s2, verticalAlignItems: 'center' },
      txt(where, UI.body, { fill: UI.textSecondary, width: 'fill-parent' }),
      h(AutoLayout, { fill: UI.brand, cornerRadius: UI.radiusControl, height: 32, padding: { horizontal: UI.s3 }, verticalAlignItems: 'center', onClick: run, hoverStyle: { fill: UI.brandHover } },
        txt(result ? 'Run again' : 'Run scan', UI.body, { fontWeight: 500, fill: UI.onBrand }))));
}

widget.register(AdoptionScore);
