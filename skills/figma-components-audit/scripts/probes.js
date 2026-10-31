/* probes.js — figma-components-audit's session probes and fix recipes.
 *
 * Nothing runs this file on its own: it has no `@runs:` header, so no standard's
 * *Checked:* may name it (tools/toolkit-check/check-standards.mjs); a rule its probes
 * serve is *Reviewed:*, prompted by SKILL.md's *Session probes* step.
 *
 * `scanner/audit.js` is THE audit: every check the dashboard and a session
 * both run. This file is the rest of the deterministic work a SESSION does by
 * hand — the checks `scanner/checks.json` still marks `backlog` or `session`,
 * discovery, and the fix recipes. Each used to be a fenced block in
 * `references/scanner-checks.md` that an agent pasted or retyped per run;
 * that file now says why each one exists and what it must not claim, and this
 * file is the one implementation (skill-standard §A clause G).
 *
 * Nothing here feeds the dashboard. A probe's output is a CANDIDATE, routed
 * through judgment-protocol §2 like the scanner's, and the porting backlog
 * closes only by moving a check into scanner/audit.js.
 *
 * Two halves:
 *   - probes over a node (`FCA.schema(set, opts)` …) read only properties, so
 *     tests/test-probes.mjs drives them with plain objects in node;
 *   - live calls (`FCA.locate`, `FCA.discover`, `FCA.nameSpaces`,
 *     `FCA.detachedScan`, `FCA.sweepSchema`, `FCA.fix.*`) need `figma` and are
 *     syntax-checked only.
 *
 * Load once per Figma file, then bootstrap (SKILL.md, "Session probes"):
 *   1. `node skills/figma-components-audit/scripts/probes.js` prints the hash.
 *   2. Paste `globalThis.__FCA_EXPECT = "<hash>";`, this file, then
 *      `return globalThis.__FCA_LOADED;` in one figma_execute call. The source
 *      is cached in figma.root plugin data ONLY if its hash matches — a corrupt
 *      transcription is refused, never stored.
 *   3. Every later call, this session or another, restores it in three lines.
 */
globalThis.__FCA_PROBES_FACTORY = function () {
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
  FCA.parseVariant = (name) => {
    const o = {};
    for (const part of String(name).split(",")) {
      const i = part.indexOf("=");
      if (i > 0) o[part.slice(0, i).trim()] = part.slice(i + 1).trim();
    }
    return o;
  };
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
  // opts.internalPrefix, opts.descriptionPlaceholder (a pattern) and
  // opts.minDescription (characters) come from the settings; each skips when
  // absent. A description that only repeats the name is a placeholder anywhere.
  FCA.metadata = (set, opts) => {
    opts = opts || {};
    const desc = (set.description || "").trim(), findings = [];
    const isPrivate = !!opts.internalPrefix && set.name.startsWith(opts.internalPrefix);
    const placeholder = (opts.descriptionPlaceholder && new RegExp(opts.descriptionPlaceholder, "i").test(desc)) || desc.toLowerCase() === set.name.toLowerCase()
      || (desc && opts.minDescription && desc.length < opts.minDescription);
    if (!desc) findings.push({ what: "description empty", severity: isPrivate ? "hygiene" : "error" });
    else if (placeholder) findings.push({ what: 'description is a placeholder: "' + desc + '"', severity: "error" });
    // Which properties need a description is judgement; this lists them.
    const props = Object.entries(set.componentPropertyDefinitions || {}).map(([k, v]) =>
      ({ name: k.split("#")[0], type: v.type, hasDescription: !!(v.description || "").trim() }));
    return { set: set.name, description: desc, findings, props, docLinks: (set.documentationLinks || []).map((l) => l.uri) };
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

  // ---- §3.7b target size and text size ----------------------------------
  // 24 is WCAG 2.2 SC 2.5.8 (AA). 44 is SC 2.5.5 (AAA, mobile touch) — not
  // this one. Pass the library's own minima when it states them.
  FCA.sizes = (set, opts) => {
    opts = opts || {};
    // Both minima come from the settings; a missing one skips its half.
    const MIN_TARGET = opts.minTarget || null, MIN_TEXT = opts.minText || null;
    const out = { small: [], smallText: [] };
    for (const v of FCA.variantsOf(set)) {
      if (Math.min(v.width, v.height) < MIN_TARGET) out.small.push({ variant: v.name, w: v.width, h: v.height });
      (function walk(n, d) {
        if (d > 6) return;
        if (n.type === "TEXT" && typeof n.fontSize === "number" && n.fontSize < MIN_TEXT)
          out.smallText.push({ variant: v.name, layer: n.name, fontSize: n.fontSize });
        if (n.children) for (const c of n.children) walk(c, d + 1);
      })(v, 0);
    }
    return Object.assign({ set: set.name, minTarget: MIN_TARGET, minText: MIN_TEXT }, out);
  };

  // ---- §3.7c contrast ---------------------------------------------------
  FCA.luminance = ({ r, g, b }) => {
    const f = (c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  FCA.contrastRatio = (a, b) => {
    const [hi, lo] = [FCA.luminance(a), FCA.luminance(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
  };
  // Reads the paint colour CACHED for the mode on screen — one mode per run.
  // A translucent paint on either side is marked `verify`: the nearest-solid
  // model cannot composite it, and a confident wrong ratio is worse than none.
  FCA.contrast = (set) => {
    const out = [];
    for (const v of FCA.variantsOf(set)) (function walk(n, bg, d) {
      if (d > 6) return;
      let next = bg;
      if (isArr(n.fills) && n.type !== "TEXT") {
        const solid = n.fills.find((f) => f.type === "SOLID" && f.visible !== false && (f.opacity === undefined || f.opacity > 0.5));
        if (solid) next = solid;
      }
      if (n.type === "TEXT" && isArr(n.fills) && n.fills[0] && n.fills[0].type === "SOLID" && next) {
        const fg = n.fills[0], r = FCA.contrastRatio(fg.color, next.color);
        const large = typeof n.fontSize === "number" && (n.fontSize >= 24 || (n.fontSize >= 18.66 && /bold|semi/i.test(String(n.fontName && n.fontName.style))));
        const needs = large ? 3 : 4.5;
        const verify = (fg.opacity !== undefined && fg.opacity < 1) || (next.opacity !== undefined && next.opacity < 1);
        if (r < needs || verify) out.push({ variant: v.name, layer: n.name, ratio: +r.toFixed(2), needs, verify });
      }
      if (n.children) for (const c of n.children) walk(c, next, d + 1);
    })(v, null, 0);
    return { set: set.name, belowAA: out.filter((x) => x.ratio < x.needs), verifyByEye: out.filter((x) => x.verify && x.ratio >= x.needs) };
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
  // spaces: [{ space, names }]. Splits are names equal but for case (figma-standard rule 19);
  // minorities are case shapes outnumbered at the same DEPTH (figma-standard rule 18's
  // evidence — pooling depths reports a convention as its own violation).
  FCA.classifyNameSpaces = (spaces) => spaces.filter((sp) => sp.names.length).map((sp) => {
    const seen = new Map(), splits = [];
    for (const n of sp.names) { const k = n.toLowerCase(); if (seen.has(k)) splits.push([seen.get(k), n]); seen.set(k, n); }
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
    return { space: sp.space, total: sp.names.length, splits, minorities };
  }).filter((r) => r.splits.length || Object.keys(r.minorities).length);

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

// In Figma: install, then cache the source ONLY when its hash matches the one
// the caller set from `node scripts/probes.js`. No expectation, no cache —
// the gate refuses the write, it never reports after it.
if (typeof figma !== "undefined") {
  const __fca = globalThis.__FCA_PROBES_FACTORY();
  const __src = globalThis.__FCA_PROBES_FACTORY.toString();
  const __hash = __fca.srcHash(__src);
  const __want = globalThis.__FCA_EXPECT || null;
  const __ok = __want === __hash;
  if (__ok) { figma.root.setPluginData("fca.probes.v1", __src); figma.root.setPluginData("fca.probes.hash", __hash); }
  globalThis.__FCA_LOADED = { hash: __hash, expected: __want, cached: __ok };
}

// In node: export, and print the hash a correct paste must report.
if (typeof module !== "undefined" && module.exports) {
  module.exports = globalThis.__FCA_PROBES_FACTORY();
  if (typeof require !== "undefined" && require.main === module) {
    const src = globalThis.__FCA_PROBES_FACTORY.toString();
    console.log(module.exports.srcHash(src) + "  " + src.length + " bytes  [fca.probes.v1]");
  }
}
