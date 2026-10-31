// Extension check — does each brand extension really carry its own brand?
//
// Run as a figma_execute body in the SOURCE library, with one line prepended:
// `const BRAND_GROUP = <the library's tokens.brandGroup, as JSON>;` (or null).
// Figma's extended collections (Enterprise, Nov 2025) make a brand a
// collection rather than a mode: the parent holds the tokens, an extension
// overrides the values that differ. Two things then go wrong quietly.
//
//   inherits — the parent's value for this token aliases a brand ramp, and the
//              extension does not override it, so that brand renders the
//              PARENT's brand colour. Nothing is broken, nothing is empty, and
//              the swatch looks plausible. Measured when this was written: a
//              parent sitting on one brand's ramps means every other brand
//              must override all 29 of its tokens, and a token added to the
//              parent later arrives wearing the parent's colour in every one.
//   foreign  — an override points at a ramp belonging to a different brand
//              than the rest of this extension's overrides: a copy-paste from
//              the collection next to it.
//   partial  — an override sets some of the collection's modes and not others.
//              The unset ones fall back to the parent without a word.
//
// Facts are gathered first and judged by checkExtensions(), a pure function,
// so the check runs in node against fixture facts: with no `figma` in scope
// the body returns checkExtensions itself.
//
// facts = { brandGroup,
//   parent: { name, modes: [string], tokens: [{ name, perMode: { mode: target|null } }] },
//   extensions: [{ name, overrides: { token: { mode: target|null } } }],
// }
// A `target` is the full name of the variable an alias points at, or null for
// a raw value. `brandGroup` is the path group whose child names the brand
// (`<brandGroup>/<brand>/<ramp>/<step>`), from the library's settings; a
// project that records none gets no brand findings rather than invented ones.

function checkExtensions(facts) {
  const findings = [];
  const parent = facts.parent || { tokens: [], modes: [] };
  const modes = parent.modes || [];
  const group = facts.brandGroup ? new RegExp("(?:^|/)" + String(facts.brandGroup).replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "/([^/]+)/") : null;
  const brandOf = (target) => {
    if (!target || !group) return null;
    const m = group.exec(target);
    return m ? m[1] : null;
  };
  const parentBrands = new Set();
  const brandTokens = [];
  for (const t of parent.tokens || []) {
    const brands = modes.map((m) => brandOf(t.perMode ? t.perMode[m] : null)).filter(Boolean);
    brands.forEach((b) => parentBrands.add(b));
    if (brands.length) brandTokens.push(t.name);
  }

  for (const ext of facts.extensions || []) {
    const ov = ext.overrides || {};
    // Which brand IS this extension? The one most of its overrides point at —
    // read from the values, never from the collection's display name, which is
    // free text and need not match the ramp group at all.
    const counts = {};
    for (const token of Object.keys(ov)) {
      for (const m of modes) {
        const b = brandOf(ov[token] ? ov[token][m] : null);
        if (b) counts[b] = (counts[b] || 0) + 1;
      }
    }
    const own = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0] || null;

    for (const token of brandTokens) {
      const o = ov[token];
      if (!o) {
        findings.push({ kind: "inherits", extension: ext.name, token, brand: own,
          text: "“" + token + "” is not overridden, so " + (ext.name) + " renders the parent's brand" +
            ([...parentBrands][0] ? " (" + [...parentBrands][0] + ")" : "") });
        continue;
      }
      const set = modes.filter((m) => o[m] !== undefined);
      if (set.length && set.length < modes.length) {
        findings.push({ kind: "partial", extension: ext.name, token, brand: own,
          text: "“" + token + "” is overridden in " + set.join(", ") + " but not in " +
            modes.filter((m) => !set.includes(m)).join(", ") + ", which falls back to the parent" });
      }
    }
    if (own) {
      for (const token of Object.keys(ov)) {
        for (const m of modes) {
          const b = brandOf(ov[token][m]);
          if (b && b !== own) {
            findings.push({ kind: "foreign", extension: ext.name, token, brand: own,
              text: "“" + token + "” [" + m + "] points at " + b + "'s ramp, while the rest of " +
                ext.name + " points at " + own + "'s" });
          }
        }
      }
    }
  }
  return { findings, parentBrands: [...parentBrands], brandTokens: brandTokens.length,
           extensions: (facts.extensions || []).map((e) => e.name) };
}

if (typeof figma === "undefined") return checkExtensions;

const cols = await figma.variables.getLocalVariableCollectionsAsync();
const nameOf = async (id) => { const v = await figma.variables.getVariableByIdAsync(id); return v ? v.name : null; };
const out = [];
for (const parentCol of cols.filter((c) => !c.isExtension)) {
  // The parent is named by its LOCAL id inside its own file and by a
  // key-based id in a file that consumes it; a run in the source library sees
  // the first. Matching only the key returned nothing at all here, which is a
  // finding about the probe rather than a clean library.
  const exts = cols.filter((c) => c.isExtension && c.parentVariableCollectionId &&
    (c.parentVariableCollectionId === parentCol.id ||
     (parentCol.key && c.parentVariableCollectionId.indexOf(parentCol.key) !== -1)));
  if (!exts.length) continue;
  const modes = parentCol.modes.map((m) => m.name);
  const modeId = Object.fromEntries(parentCol.modes.map((m) => [m.name, m.modeId]));
  const tokens = [];
  const idOfName = {};
  for (const id of parentCol.variableIds) {
    const v = await figma.variables.getVariableByIdAsync(id);
    if (!v) continue;
    idOfName[id] = v.name;
    const perMode = {};
    for (const m of modes) {
      const val = v.valuesByMode[modeId[m]];
      perMode[m] = val && val.type === "VARIABLE_ALIAS" ? await nameOf(val.id) : null;
    }
    tokens.push({ name: v.name, perMode });
  }
  const extensions = [];
  for (const ext of exts) {
    const extModeId = Object.fromEntries(ext.modes.map((m) => [m.name, m.modeId]));
    const overrides = {};
    for (const [varId, perModeRaw] of Object.entries(ext.variableOverrides || {})) {
      const token = idOfName[varId] || (await nameOf(varId));
      if (!token) continue;
      const perMode = {};
      for (const m of modes) {
        // An override is keyed by the extension's own mode id, which carries
        // the collection id as a prefix; match on the mode's name instead.
        const key = Object.keys(perModeRaw).find((k) => k.endsWith("/" + String(extModeId[m]).split("/").pop()));
        const val = key ? perModeRaw[key] : undefined;
        if (val === undefined) continue;
        perMode[m] = val && val.type === "VARIABLE_ALIAS" ? await nameOf(val.id) : null;
      }
      overrides[token] = perMode;
    }
    extensions.push({ name: ext.name, overrides });
  }
  out.push(Object.assign(checkExtensions({ parent: { name: parentCol.name, modes, tokens }, extensions, brandGroup: typeof BRAND_GROUP === "string" ? BRAND_GROUP : null }),
    { parent: parentCol.name }));
}
return { checked: out, fileName: figma.root.name, fileKey: figma.fileKey || null };
