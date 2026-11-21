/*
 * Reading the audit's one list of stages (skills/figma-project-audit/stages.json)
 * the same way in every runner: which stages a runner runs and in what order,
 * the text that runs a stage's script in Figma, the bucket a finding of it
 * goes in, whether it applies to a file, and the one loop that runs them
 * (runStages). The dashboard page
 * (tools/docs-site/src/dashboard/audit.js) and bin/audit (audit-session.mjs)
 * import it, and Audit lite bundles it (plugins/audit-lite/sync.mjs).
 *
 * Pure, with no import and no node API, so a Figma plugin can carry it.
 * Tested by skills/figma-project-audit/tests/test-stages.mjs.
 */

/** The stages `runner` (dashboard, session, lite) runs, in the registry's order. */
export function stagesFor(registry, runner) {
  return ((registry && registry.stages) || []).filter((s) => (s.runners || []).includes(runner));
}

/**
 * The text that runs a stage's gather script: each `shadow` global declared
 * undefined (a plugin's own `__html__` would otherwise wake the snapshot
 * plugin's UI), then each constant, then the script, then the return of its
 * `call` unless the script already ends in it (the service serves the
 * snapshot plugin with `return __headless();` appended). `values` gives the
 * constants a list-form `set` leaves to the runner, from the settings.
 */
export function gatherCode(stage, script, values = {}) {
  const g = stage.gather || {};
  const set = Array.isArray(g.set) ? Object.fromEntries(g.set.filter((k) => k in values).map((k) => [k, values[k]])) : Object.assign({}, g.set || {}, values);
  const head = (g.shadow || []).map((k) => `const ${k} = undefined;\n`).join("")
    + Object.entries(set).map(([k, v]) => `const ${k} = ${JSON.stringify(v)};\n`).join("");
  const call = g.call && !new RegExp(`return\\s+${g.call}\\(\\)\\s*;?\\s*$`).test(script) ? `\nreturn ${g.call}();\n` : "";
  return head + script + call;
}

/**
 * A finding's bucket (b1, b2, b3) for a stage: `rulesFile` is the parsed
 * file a `from` mapping names (the components scanner's buckets.json), read
 * by the caller since this module reads nothing.
 */
export function bucketFor(stage, rule, { rulesFile = null, own = null } = {}) {
  const b = stage.buckets || {};
  if (b.finding) return own ? "b" + String(own).replace(/^b/, "") : "b3";
  if (b.from) {
    const f = rulesFile || {};
    for (const k of ["b1", "b2", "b3"]) if ((f[k] || []).includes(rule)) return k;
    return f._default || "b3";
  }
  return (b.rules || {})[rule] || b.default || "b3";
}

/**
 * Whether a stage applies to a file, by its `applies`: `facts` says what the
 * file has (`componentSets`, and library.mjs liveApplies' `tokens` and
 * `icons`), `settings` the library's audit settings (codeTarget,
 * sourceLibrary, code). The one applicability rule: runStages asks it for
 * every runner, and Audit lite shows a stage's checkbox only where it is true.
 */
export function appliesTo(stage, facts = {}, settings = {}) {
  const a = stage.applies || {};
  if (a.always) return true;
  if (a.fact) return !!(facts && facts[a.fact]);
  if (a.setting) return settings != null && settings[a.setting] != null && settings[a.setting] !== "";
  return false;
}

/**
 * The audit's one loop, which every runner calls (the dashboard page, bin/audit, Audit lite): the stages the registry
 * gives `runner`, in its order, each decided by `appliesTo` and run by its handler, a stage that throws stopping only
 * itself. `handlers` maps a stage id to `async (stage, ctx) => status`: nothing (it ran), a word of the runner's own
 * ("empty", "skipped"), or `{ status, why }`. `ctx.facts` is the file's facts, or an async function of the stage that
 * gives them (a runner that reads them only when a stage needs them); `ctx.settings` the library's audit settings;
 * `ctx.skip(stage)` a reason the runner leaves an applying stage out (Audit lite: switched off, a run on a selection).
 * Returns one row per stage, in the registry's order: `{ id, label, status, why? }`, status "ran", "n/a" (appliesTo
 * says no), the skip's or the handler's word, "stopped" (it threw; `why` says what, and `skipped` is set where the
 * error said the stage could not start) or "unhandled" (the runner has no handler for a stage the registry gives it).
 */
export async function runStages(registry, runner, handlers, ctx = {}) {
  const rows = [];
  for (const stage of stagesFor(registry, runner)) {
    const row = { id: stage.id, label: stage.label || stage.id };
    try {
      const h = handlers && handlers[stage.id];
      if (typeof h !== "function") { rows.push(Object.assign(row, { status: "unhandled", why: "this runner has no handler for a stage the audit's list gives it" })); continue; }
      const facts = typeof ctx.facts === "function" ? await ctx.facts(stage) : ctx.facts;
      if (!appliesTo(stage, facts || {}, ctx.settings || {})) { rows.push(Object.assign(row, { status: "n/a" })); continue; }
      const skip = ctx.skip ? ctx.skip(stage) : null;
      if (skip) { rows.push(Object.assign(row, { status: skip })); continue; }
      const out = await h(stage, ctx);
      const o = out && typeof out === "object" ? out : { status: out };
      rows.push(Object.assign(row, { status: o.status || "ran" }, o.why ? { why: o.why } : {}));
    } catch (e) { rows.push(Object.assign(row, { status: "stopped", why: String((e && e.message) || e) }, e && e.skipped ? { skipped: true } : {})); }
  }
  return rows;
}

/**
 * The plain lines a runner prints for the stages that did not finish (runStages' "stopped" and "unhandled" rows), one
 * per stage, naming it and why; empty when every stage ran or was left out on purpose. bin/audit prints them and exits 1.
 */
export function stoppedLines(rows) {
  return (rows || []).filter((r) => r.status === "stopped" || r.status === "unhandled")
    .map((r) => `stage stopped: ${r.label || r.id}${r.why ? ` \u2014 ${r.why}` : ""}`);
}
