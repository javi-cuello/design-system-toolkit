// @runs: tools/figma-audit/server.mjs (its /library-checks route and its snapshot watch) and tools/figma-audit/audit-session.mjs
// (bin/audit): the audit's tokens and icons stages on the live file (figma-project-audit's list of stages,
// which Audit lite runs too), and the stored snapshot whenever its tokens settle.
// The tokens library and the icon library, checked from the stored snapshot or the live file.
//
// A components library is scanned live, set by set. The file that holds the
// tokens and the file that holds the icons have no component sets worth
// scanning, and what is worth asking about them is in the snapshot already:
// every variable with its description and alias, every style with what it
// binds, every icon set with the sizes it was drawn at. Which file plays which
// part is the routing block's to say (`roles`, snapshot-standard rule 17).
//
// Pure: the dashboard service reads the store and files what these return
// (tools/figma-audit/server.mjs), as a full run, so a finding no longer
// raised closes. A live run hands the snapshot plugin's facts mode to
// `liveView`, which builds the same view the store would (owns.cjs, one
// derivation), so the checks never know which they read.
// `node tests/test-foundations.mjs` runs them on fixtures, and proves the two
// views of one payload give the same findings.

import ownsModule from "../../../tools/snapshot/owns.cjs";
const { canonical, ownsOf } = ownsModule;

export const RAN_TOKENS = ["tokens-description", "tokens-unused", "tokens-style-binding", "tokens-naming", "tokens-structure"];

// What a text style and an effect layer can bind to a variable in Figma and
// carries a design decision. Paragraph spacing and indent are bindable too,
// and left out: no library read so far sets them to anything but 0.
const TEXT_FIELDS = { fontFamily: "font family", fontWeight: "font weight", fontSize: "font size", lineHeight: "line height", letterSpacing: "letter spacing" };
const EFFECT_FIELDS = { color: "colour", x: "x offset", y: "y offset", blur: "blur", spread: "spread" };

const list = (xs, n = 8) => (xs.length > n ? `${xs.slice(0, n).join(", ")} and ${xs.length - n} more` : xs.join(", "));
// `check` says what goes wrong and what it costs (design-standard rule 10);
// the row's `fix` is that sentence with the names it covers, so the row a
// reader sees states the problem before the list, never the list alone.
const finding = (where, rule, subject, sev, bucket, check, names, rec) =>
  ({ where, key: `${rule}|${where}|${subject}`, rule, sev, bucket, check, fix: [`${check}: ${names}.`], rec });

/** Every string a component spec holds: the names of the tokens and styles it binds among them. */
export function namesUsed(specs) {
  const out = new Set();
  const walk = (o) => {
    if (typeof o === "string") out.add(o);
    else if (Array.isArray(o)) o.forEach(walk);
    else if (o && typeof o === "object") Object.values(o).forEach(walk);
  };
  specs.forEach(walk);
  return out;
}

const owned = (tokens, source) => (((tokens._meta || {}).sources || {})[source] || {}).owns || null;
const namesOf = (col) => Object.keys(Object.values(col.values || {})[0] || {});

/**
 * The tokens library: `tokens` is the stored tokens.json, `source` the tokens
 * library's key, `used` every string the components libraries' specs hold
 * (`namesUsed`). Returns `{ findings, ran, scope }`, scope being what it read; nothing ran when the store has
 * nothing from that file.
 */
export function tokenChecks({ tokens, source, used = new Set() }) {
  // `used: null` is "not known": a live read of a file other files use (liveChecks without selfUsed) cannot
  // say what binds its tokens, so the unused check does not run and closes nothing (the snapshot watch reads
  // every components library's specs and runs it there).
  const usedKnown = used !== null;
  const owns = owned(tokens, source);
  if (!owns) return { findings: [], ran: [], scope: [] };
  const findings = [];
  const cols = owns.collections.filter((c) => tokens.collections[c]);

  // Every published token says what it is for (figma-standard rule 41). A
  // token hidden from publishing is reached through an alias, never chosen.
  for (const c of cols) {
    const col = tokens.collections[c], hidden = new Set(col.hidden || []);
    const missing = namesOf(col).filter((n) => !hidden.has(n) && !(col.descriptions || {})[n]);
    if (missing.length) findings.push(finding(c, "tokens-description", "all", "warn", 1,
      `${missing.length} published ${missing.length === 1 ? "token has" : "tokens have"} no description, so people and agents picking a token cannot tell it from its neighbours`,
      list(missing), ["Describe what each token is for and where it goes, in the token's description in Figma."]));
  }

  // Unused (figma-standard rule 42): no component in a components library binds it, no style binds
  // it, and no used token aliases it. Name matched, as specs record names. Any style counts, used by
  // a component or not: a style is published for designers' screens too, and a font size reached
  // only through a heading style no component draws was raised as unused (case F27).
  const reach = new Set();
  for (const s of tokens.textStyles || []) for (const b of Object.values(s.bound || {})) reach.add(b.name);
  for (const s of tokens.effects || []) for (const l of s.layers || []) for (const b of Object.values(l.bound || {})) reach.add(b.name);
  if (usedKnown) for (const c of cols) for (const n of namesOf(tokens.collections[c])) if (used.has(n)) reach.add(n);
  // An icon's glyph colour is a use (any source's owns.iconColours): an instance is drawn in it until given another.
  // The live `used` leaves the icon page out (the snapshot plugin's facts mode), as the stored specs do, so both
  // paths count a glyph's token here, once.
  for (const src of Object.values((tokens._meta || {}).sources || {})) for (const v of Object.values((src.owns || {}).iconColours || {})) reach.add(v);
  for (let grew = true; grew;) {
    grew = false;
    for (const c of cols) for (const m of Object.values(tokens.collections[c].alias || {})) {
      for (const [n, target] of Object.entries(m)) if (reach.has(n) && !reach.has(target)) { reach.add(target); grew = true; }
    }
  }
  if (usedKnown) for (const c of cols) {
    const unused = namesOf(tokens.collections[c]).filter((n) => !reach.has(n));
    if (unused.length) findings.push(finding(c, "tokens-unused", "all", "warn", 3,
      `${unused.length} ${unused.length === 1 ? "token is" : "tokens are"} used by no component, style or other token, so the library offers choices nothing makes`,
      list(unused), ["Remove what nothing needs.", "Meant for code or prototypes only (motion, breakpoints, charts): record it as a ruling, and it stops being raised."]));
  }

  // Styles bind variables wherever Figma lets them (figma-standard rule 43),
  // except letter spacing in percent: Figma binds a variable to it only as px.
  const exempt = (s, f) => f === "letterSpacing" && ((s.authored || {}).letterSpacing || {}).unit === "PERCENT";
  const styleCheck = (where, styles, fields, boundOf) => {
    for (const [f, label] of Object.entries(fields)) {
      const loose = styles.filter((s) => !exempt(s, f) && boundOf(s).some((b) => !b[f])).map((s) => s.name);
      if (loose.length) findings.push(finding(where, "tokens-style-binding", f, "warn", 1,
        `${loose.length} of ${styles.length} leave the ${label} unbound, so a change to that token never reaches them`,
        list(loose), [`Bind each one's ${label} to a variable, so a token change reaches the style.`]));
    }
  };
  const textStyles = (tokens.textStyles || []).filter((s) => (owns.textStyles || []).includes(s.name));
  const effects = (tokens.effects || []).filter((s) => (owns.effects || []).includes(s.name));
  styleCheck("Text styles", textStyles, TEXT_FIELDS, (s) => [s.bound || {}]);
  styleCheck("Effect styles", effects, EFFECT_FIELDS, (s) => (s.layers || []).map((l) => l.bound || {}));

  for (const c of cols) {
    const names = namesOf(tokens.collections[c]);
    // Naming: two names one export would collapse into one (figma-standard rule 19).
    const folded = new Map();
    for (const n of names) { const k = n.toLowerCase().replace(/[\s_-]+/g, "-"); folded.set(k, [...(folded.get(k) || []), n]); }
    for (const same of [...folded.values()].filter((l) => l.length > 1)) findings.push(finding(c, "tokens-naming", same[0].toLowerCase(), "error", 1,
      `${same.join(" and ")} differ only in case or separator, so code exports them as one name and one overwrites the other`, same.join(", "), ["Keep one spelling and repoint what binds the other."]));

    // Structure (figma-standard rule 44): a group holding tokens and groups
    // side by side, and a group missing a leaf most of its sibling groups have.
    const kids = new Map();
    for (const n of names) {
      const p = n.split("/");
      p.forEach((seg, i) => { const par = p.slice(0, i).join("/"); if (!kids.has(par)) kids.set(par, new Map()); kids.get(par).set(seg, i === p.length - 1 ? "leaf" : "group"); });
    }
    const odd = [];
    for (const [par, m] of kids) {
      if (new Set(m.values()).size > 1) odd.push(`${par || "the top level"} holds both tokens (${list([...m].filter(([, k]) => k === "leaf").map(([s]) => s), 3)}) and groups`);
    }
    const leaves = new Map();
    for (const n of names) { const p = n.split("/"); if (p.length < 3) continue; const g = p.slice(0, -1).join("/"); leaves.set(g, new Set([...(leaves.get(g) || []), p.at(-1)])); }
    const byParent = new Map();
    for (const g of leaves.keys()) { const par = g.split("/").slice(0, -1).join("/"); byParent.set(par, [...(byParent.get(par) || []), g]); }
    for (const gs of byParent.values()) {
      if (gs.length < 3) continue;
      const count = new Map();
      for (const g of gs) for (const l of leaves.get(g)) count.set(l, (count.get(l) || 0) + 1);
      for (const g of gs) {
        const miss = [...count].filter(([l, k]) => k > gs.length / 2 && !leaves.get(g).has(l)).map(([l]) => l);
        if (miss.length) odd.push(`${g} has no ${miss.join(", ")}, which most of its siblings have`);
      }
    }
    if (odd.length) findings.push(finding(c, "tokens-structure", "all", "warn", 3,
      `${odd.length} ${odd.length === 1 ? "group differs" : "groups differ"} in shape from ${odd.length === 1 ? "its" : "their"} siblings, so a name that works in one group is missing in the next`,
      list(odd, 6), ["Give parallel groups the same leaves, and keep tokens and groups at separate levels.", "On purpose: record it as a ruling, and it stops being raised."]));
  }
  return { findings, ran: usedKnown ? RAN_TOKENS : RAN_TOKENS.filter((r) => r !== "tokens-unused"), scope: [...cols, "Text styles", "Effect styles"] };
}

/**
 * The icon library (figma-standard rule 45): `source` its key; `names`, when the library follows an
 * icon set (`icons.names` in its settings), that set's names. Sizes and
 * unbound paints come from the snapshot plugin (0.53.0 for the paints); a
 * check with nothing stored to read does not run.
 */
export function iconChecks({ tokens, source, names = null, slug = (s) => s }) {
  const owns = owned(tokens, source);
  if (!owns || !owns.iconSizes) return { findings: [], ran: [], scope: [] };
  const findings = [], ran = [];
  const sets = Object.keys(owns.iconSizes);

  // Every set is drawn at the sizes most sets are.
  const tally = new Map();
  for (const s of sets) for (const z of owns.iconSizes[s]) tally.set(z, (tally.get(z) || 0) + 1);
  const common = [...tally].filter(([, k]) => k > sets.length / 2).map(([z]) => z).sort((a, b) => a - b);
  const short = sets.map((s) => [s, common.filter((z) => !owns.iconSizes[s].includes(z))]).filter(([, m]) => m.length);
  ran.push("icons-sizes");
  if (short.length) findings.push(finding("Icons", "icons-sizes", "all", "warn", 3,
    `${short.length} ${short.length === 1 ? "set lacks" : "sets lack"} a size the library draws (${common.join(", ")}), so a design at that size falls back to a scaled icon`,
    list(short.map(([s, m]) => `${s} (no ${m.join(", ")})`)), ["Draw the missing sizes.", "On purpose: record it as a ruling, and it stops being raised."]));

  if (owns.unboundIcons) {
    ran.push("icons-fill");
    if (owns.unboundIcons.length) findings.push(finding("Icons", "icons-fill", "all", "error", 1,
      `${owns.unboundIcons.length} icon ${owns.unboundIcons.length === 1 ? "variant has" : "variants have"} a paint no variable binds, so instances keep that colour whatever the theme`,
      list(owns.unboundIcons), ["Bind each glyph's fill or stroke to the icon colour token, so instances recolour by token."]));
  }

  if (names) {
    ran.push("icons-name");
    const known = new Set(names);
    const stray = sets.filter((s) => !known.has(slug(s)));
    if (stray.length) findings.push(finding("Icons", "icons-name", "all", "warn", 3,
      `${stray.length} ${stray.length === 1 ? "set is" : "sets are"} not named as the icon set names ${stray.length === 1 ? "it" : "them"}, so code looking ${stray.length === 1 ? "it" : "them"} up by that name finds nothing`,
      list(stray), ["Rename to the icon set's name, so code finds it by the same name.", "Drawn here, not taken from the set: record it as a ruling, and it stops being raised."]));
  }
  return { findings, ran, scope: ["Icons"] };
}

/**
 * The view `tokenChecks` and `iconChecks` read, built from the snapshot plugin's
 * facts mode (`const FACTS = true`: `{ tokens, icons, iconSets, iconPage, used,
 * components }`) for the file `fileKey`, by the store's own derivation
 * (tools/snapshot/owns.cjs): what one file's snapshot would store about itself.
 */
export function liveView(facts, fileKey) {
  const t = (facts && facts.tokens) || {};
  const { owns, exported } = ownsOf(t, { iconSets: facts.iconSets || [], iconPage: facts.iconPage || null, icons: facts.icons || [] });
  return { _meta: { sources: { [fileKey]: { owns: Object.assign(owns, exported || {}) } } }, ...canonical(t) };
}

/**
 * When each live stage applies to the file the facts describe: `tokens`
 * where it owns a variable collection, a text style or an effect style;
 * `icons` where it has an icon page. figma-project-audit's list of stages
 * names these as the stages' `applies`.
 */
export function liveApplies(facts) {
  const t = (facts && facts.tokens) || {};
  const own = (xs) => (xs || []).some((x) => !x.remote);
  return {
    tokens: Object.values(t.collections || {}).some((c) => !c.remote) || own(t.textStyles) || own(t.effects),
    icons: !!(facts && facts.iconPage),
  };
}

/**
 * Whether the file `key` is its own tokens' only user, by the project record (`records`: each library's `key` and
 * `roles`): it holds the tokens and the components that bind them, and no other library holds components that could
 * bind them too. liveChecks' `selfUsed` for the dashboard and bin/audit.
 */
export function selfUsedOf(records, key) {
  const own = (records || []).find((r) => r.key === key);
  const roles = (own && own.roles) || [];
  return roles.includes("tokens") && roles.includes("components")
    && !(records || []).some((r) => r.key !== key && (r.roles || []).includes("components"));
}

/**
 * Which checks the snapshot watch runs on the library `record` (`key`, `roles`) from the stored `tokens`:
 * `tokens` where it has the tokens role or its stored source owns a collection, text style or effect (a
 * components library with local tokens of its own, whose unused tokens no live run checks, selfUsedOf being
 * false for it); `icons` where it has the icons role.
 */
export function watchTargets(record, tokens) {
  const owns = owned(tokens, record.key) || {};
  const roles = record.roles || [];
  const ownsTokens = ["collections", "textStyles", "effects"].some((k) => (owns[k] || []).length);
  return [...(roles.includes("tokens") || ownsTokens ? ["tokens"] : []), ...(roles.includes("icons") ? ["icons"] : [])];
}

/**
 * The tokens and icons stages on the live file: `{ tokens, icons }`, each
 * `{ findings, ran, scope }` or null where the stage does not apply.
 * `selfUsed` says the file is its own tokens' only user: the project record
 * gives it both the tokens and the components role (the dashboard and
 * bin/audit), or the runner audits one file as self-contained (Audit lite,
 * whose report says so). Then what its own components bind (`facts.used`)
 * decides what is unused; otherwise who uses the tokens is not known here,
 * the unused check does not run and closes nothing, and the snapshot watch,
 * which reads every components library, runs it. `names` and `slug` are
 * `iconChecks`'.
 */
export function liveChecks(facts, fileKey, { names = null, slug = (s) => s, selfUsed = false } = {}) {
  const tokens = liveView(facts, fileKey);
  const applies = liveApplies(facts);
  return {
    tokens: applies.tokens ? tokenChecks({ tokens, source: fileKey, used: selfUsed ? new Set(facts.used || []) : null }) : null,
    icons: applies.icons ? iconChecks({ tokens, source: fileKey, names, slug }) : null,
  };
}

/**
 * The names an icon set publishes, for `icons.names` in a library's settings.
 * Lucide at the release the caller names: the release the icons were imported
 * from (the figma-audit service passes the importer plugin's pin), so the
 * check and the import read one version; fetched once and cached in the
 * system's temp folder. Null when the set or the version is unknown or the
 * set cannot be reached: the name check then does not run.
 */
export async function iconSetNames(set, version) {
  if (set !== "lucide" || !version) return null;
  const { readFile, writeFile } = await import("node:fs/promises");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  try {
    const cache = join(tmpdir(), `lucide-static-${version}-tags.json`);
    let tags;
    try { tags = JSON.parse(await readFile(cache, "utf8")); } catch {
      const res = await fetch(`https://cdn.jsdelivr.net/npm/lucide-static@${version}/tags.json`, { signal: AbortSignal.timeout(15000) });
      if (!res.ok) return null;
      tags = await res.json();
      await writeFile(cache, JSON.stringify(tags));
    }
    return Object.keys(tags);
  } catch { return null; }
}
