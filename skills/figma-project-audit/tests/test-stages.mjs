#!/usr/bin/env node
// The audit's one list of stages (../scripts/stages.json) and the runners that read it:
// every runner handles exactly the stages the list gives it, every stage names
// a skill, scripts that exist and a bucket rule, and the reader every runner
// shares (tools/figma-audit/stages.mjs) builds the same Figma call each time.
//   node skills/figma-project-audit/tests/test-stages.mjs
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { appliesTo, bucketFor, gatherCode, gatherTimeout, runStages, stageById, stagesFor, stoppedLines } from "../../../tools/figma-audit/stages.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..", "..");
const registry = JSON.parse(readFileSync(join(HERE, "..", "scripts", "stages.json"), "utf8"));
let n = 0;
const ok = (name, cond, why = "") => { n++; assert.ok(cond, `${name}${why ? `\n${why}` : ""}`); console.log("ok", name); };

// ---- the list itself
const ids = registry.stages.map((s) => s.id);
ok("each stage has an id of its own", new Set(ids).size === ids.length && ids.every(Boolean));
ok("the stages run in figma-project-audit's order: foundations, components, tokens and icons, validator, links, parity",
  JSON.stringify(ids) === JSON.stringify(["foundations", "components", "tokens", "icons", "validator", "links", "parity"]), ids.join(", "));
const RUNNERS = ["dashboard", "session", "lite"];
for (const s of registry.stages) {
  ok(`${s.id}: its owner is a skill of this toolkit`, existsSync(join(ROOT, "skills", s.owner, "SKILL.md")), s.owner);
  ok(`${s.id}: it names runners, and only known ones`, s.runners.length > 0 && s.runners.every((r) => RUNNERS.includes(r)));
  const paths = [s.gather && s.gather.script, s.checks && s.checks.script, s.buckets && s.buckets.from].filter(Boolean);
  ok(`${s.id}: every script it names exists`, paths.every((p) => existsSync(join(ROOT, p))), paths.filter((p) => !existsSync(join(ROOT, p))).join(", "));
  const b = s.buckets || {};
  ok(`${s.id}: it says which bucket a finding goes in`, !!(b.finding || b.from || b.default));
  // the only copy of the words a person reads about the stage: Audit lite's checkbox and its description
  ok(`${s.id}: it has a label and a one-line description, a sentence for a designer`, typeof s.label === "string" && s.label.length > 0 && s.label.length <= 24
    && typeof s.description === "string" && /^[A-Z].{10,70}\.$/.test(s.description) && !/\n/.test(s.description), `${s.label} — ${s.description}`);
  const a = s.applies || {};
  ok(`${s.id}: it says when it applies, in the list's vocabulary`, a.always === true || ["componentSets", "tokens", "icons"].includes(a.fact) || typeof a.setting === "string");
}

const skill = readFileSync(join(HERE, "..", "SKILL.md"), "utf8");
const owners = [...new Set(registry.stages.map((s) => s.owner))];
ok("SKILL.md says to run every owner the list names, so bin/get takes each with it", owners.every((o) => skill.includes("run `" + o + "`")), owners.filter((o) => !skill.includes("run `" + o + "`")).join(", "));

// ---- every runner handles what the list gives it, and nothing else
// A runner's handlers are the keys of its `const HANDLERS = {` block, one per line at the block's first indent.
const handlersIn = (src) => {
  const lines = src.split("\n");
  const at = lines.findIndex((l) => /const HANDLERS = \{\s*$/.test(l));
  if (at < 0) return null;
  const base = /^\s*/.exec(lines[at])[0], inner = /^\s*/.exec(lines.slice(at + 1).find((l) => /^\s*\w+:/.test(l)) || "")[0];
  const keys = [];
  for (const l of lines.slice(at + 1)) {
    if (l === base + "};") break;
    const m = new RegExp(`^${inner}(\\w+):`).exec(l);
    if (m) keys.push(m[1]);
  }
  return keys;
};
const sameSet = (a, b) => JSON.stringify([...new Set(a)].sort()) === JSON.stringify([...new Set(b)].sort());
const disagree = (runner, handled) => {
  const given = stagesFor(registry, runner).map((s) => s.id);
  return { extra: handled.filter((h) => !given.includes(h)), missing: given.filter((g) => !handled.includes(g)) };
};
const RUNNER_FILES = {
  dashboard: "tools/docs-site/src/dashboard/audit.js",
  session: "tools/figma-audit/audit-session.mjs",
  lite: "plugins/audit-lite/code.js",
};
// A runner's handlers, run through the one loop as stubs that record each call: every stage the list gives it gets a
// row, in the list's order, and none is left unhandled. `problems` names what is wrong with such a run.
const stubs = (keys, calls) => Object.fromEntries(keys.map((k) => [k, async () => { calls.push(k); }]));
const always = { componentSets: true, tokens: true, icons: true }, set = { codeTarget: "web", sourceLibrary: "S", code: "repo" };
const problems = (runner, rows, calls) => {
  const given = stagesFor(registry, runner).map((s) => s.id);
  return [
    ...given.filter((id) => !rows.some((r) => r.id === id)).map((id) => `${id}: no row`),
    ...(JSON.stringify(rows.map((r) => r.id)) !== JSON.stringify(given.filter((id) => rows.some((r) => r.id === id))) ? ["rows out of the list's order"] : []),
    ...(JSON.stringify(calls) !== JSON.stringify(given.filter((id) => calls.includes(id))) ? ["handlers called out of the list's order"] : []),
    ...rows.filter((r) => r.status !== "ran").map((r) => `${r.id}: ${r.status}`),
  ];
};
for (const [runner, file] of Object.entries(RUNNER_FILES)) {
  const src = readFileSync(join(ROOT, file), "utf8");
  const keys = handlersIn(src);
  ok(`${runner}: ${file} keys its handlers by stage id`, Array.isArray(keys) && keys.length > 0);
  const d = disagree(runner, keys);
  ok(`${runner}: it handles no stage the list does not give it`, d.extra.length === 0, d.extra.join(", "));
  ok(`${runner}: the list gives it no stage it has no handler for`, d.missing.length === 0, d.missing.join(", "));
  // the one loop, never one of its own: a call to runStages with this runner's name and its HANDLERS, and no loop over stagesFor
  ok(`${runner}: it runs its stages through runStages, with its handlers`, new RegExp(`runStages\\([^;]*["']${runner}["'],\\s*HANDLERS\\b`).test(src));
  // (Audit lite carries stages.mjs itself in its generated block, the loop's own home; its own code is what is read)
  ok(`${runner}: it keeps no stage loop of its own`, !/for \(const \w+ of stagesFor\(/.test(src.replace(/\/\* [\w-]+ generated start[\s\S]*?generated end \*\//g, "")));
  const calls = [];
  const rows = await runStages(registry, runner, stubs(keys, calls), { facts: always, settings: set });
  ok(`${runner}: its handlers, run through runStages, give every stage the list gives it a row, in order, each run`, problems(runner, rows, calls).length === 0, problems(runner, rows, calls).join("; "));
}

// ---- the loop itself, with planted failures it must catch
{
  const all = stagesFor(registry, "dashboard").map((s) => s.id);
  // (planted) a missing handler: the stage gets an "unhandled" row, never a silent skip
  const calls1 = [];
  const rows1 = await runStages(registry, "dashboard", stubs(all.filter((id) => id !== "links"), calls1), { facts: always, settings: set });
  ok("(planted) a missing handler is a row that says unhandled, and the check names it", rows1.find((r) => r.id === "links").status === "unhandled" && problems("dashboard", rows1, calls1).includes("links: unhandled"));
  // (planted) handlers listed in another order still run in the registry's
  const calls2 = [];
  const rows2 = await runStages(registry, "dashboard", stubs([...all].reverse(), calls2), { facts: always, settings: set });
  ok("(planted) handlers written in reverse still run in the registry's order", JSON.stringify(calls2) === JSON.stringify(all) && problems("dashboard", rows2, calls2).length === 0, calls2.join(", "));
  // (planted) a loop that skips an id, or runs them reordered, is what `problems` exists to catch
  const skipped = rows2.filter((r) => r.id !== "icons");
  ok("(planted) a run that skips a stage's id is caught", problems("dashboard", skipped, calls2.filter((c) => c !== "icons")).includes("icons: no row"));
  const swapped = [rows2[1], rows2[0], ...rows2.slice(2)];
  ok("(planted) a run in another order is caught", problems("dashboard", swapped, calls2).includes("rows out of the list's order"));
  // a stage that throws stops only itself; one that does not apply is never called; a skip is the runner's word
  const calls3 = [];
  const h3 = stubs(all, calls3);
  h3.foundations = async () => { throw Object.assign(new Error("the scanner threw"), { skipped: true }); };
  const rows3 = await runStages(registry, "dashboard", h3, { facts: { componentSets: true, tokens: false, icons: true }, settings: { codeTarget: "web" }, skip: (s) => (s.id === "icons" ? "off" : null) });
  const by = Object.fromEntries(rows3.map((r) => [r.id, r]));
  ok("runStages: a stage that throws is stopped with its reason, and the stages after it still run", by.foundations.status === "stopped" && by.foundations.why === "the scanner threw" && by.foundations.skipped === true && by.components.status === "ran" && by.validator.status === "ran");
  ok("runStages: a stage appliesTo rules out is n/a and its handler is never called (a fact, a setting)", by.tokens.status === "n/a" && by.links.status === "n/a" && by.parity.status === "n/a" && !calls3.includes("tokens") && !calls3.includes("links"));
  ok("runStages: a skip is the runner's word, and the handler is not called", by.icons.status === "off" && !calls3.includes("icons"));
  ok("runStages: each row carries the registry's label", rows3.every((r) => r.label === registry.stages.find((s) => s.id === r.id).label));
  // facts read when a stage asks: a read that fails stops the stages that need it, and only those
  const rows4 = await runStages(registry, "session", stubs(stagesFor(registry, "session").map((s) => s.id), []),
    { facts: async (stage) => { if ((stage.applies || {}).fact === "tokens" || (stage.applies || {}).fact === "icons") throw new Error("the facts read timed out"); return { componentSets: true }; } });
  ok("runStages: a facts read that fails stops the stages that need it, and only those", JSON.stringify(rows4.map((r) => r.status)) === JSON.stringify(["ran", "ran", "stopped", "stopped"]), JSON.stringify(rows4));
  // a handler's own word, and an object answer
  const rows5 = await runStages(registry, "lite", { foundations: async () => "empty", components: async () => ({ status: "skipped", why: "no judge" }), tokens: async () => {}, icons: async () => {} }, { facts: always });
  ok("runStages: a handler's word and an object answer are its row's status", rows5[0].status === "empty" && rows5[1].status === "skipped" && rows5[1].why === "no judge" && rows5[2].status === "ran");
  // bin/audit: a stopped stage is a plain line naming it, and a non-zero exit, the partial payload still written
  ok("stoppedLines: one plain line per stopped or unhandled stage, naming it and why; none for ran, n/a, empty or a skip",
    JSON.stringify(stoppedLines(rows4)) === JSON.stringify(rows4.slice(2).map((r) => `stage stopped: ${r.label} \u2014 the facts read timed out`))
    && stoppedLines(rows3).length === 1 && stoppedLines(rows1).length === 1 && stoppedLines(rows5).length === 0 && stoppedLines(rows2).length === 0, JSON.stringify(stoppedLines(rows4)));
  // the dashboard's run lines name a stage as its queue chip does (ownerChipLabel), not by the registry's checkbox label
  const pageSrc = readFileSync(join(ROOT, RUNNER_FILES.dashboard), "utf8");
  ok("dashboard: its run lines name each stage by its queue chip, the registry it runs relabelled through ownerChipLabel",
    /const runLabel = [\s\S]{0,300}ownerChipLabel\(s\.owner/.test(pageSrc) && /label: runLabel\(s\)/.test(pageSrc) && /runStages\(registry, "dashboard", HANDLERS/.test(pageSrc));
  const sessionSrc = readFileSync(join(ROOT, RUNNER_FILES.session), "utf8");
  ok("bin/audit prints stoppedLines for its run and exits 1 when there are any, after writing the payload",
    /const stopped = stoppedLines\(ran\);\s*if \(stopped\.length\) \{[^}]*console\.error[^}]*process\.exitCode = 1;/.test(sessionSrc)
    && sessionSrc.indexOf("fs.writeFileSync(out") < sessionSrc.indexOf("stoppedLines(ran)")); // not-shared: a search for that text in a source, not a write
}

// (planted) the check fails both ways
{
  const page = readFileSync(join(ROOT, RUNNER_FILES.dashboard), "utf8");
  const planted = page.replace(/^(\s*)tokens: libraryStage,$/m, "$1tokens: libraryStage,\n$1extra: libraryStage,").replace(/^\s*links: async \(stage\) => \{$/m, "    linkz: async (stage) => {");
  const d = disagree("dashboard", handlersIn(planted));
  ok("(planted) a handler for a stage the list does not name, and a stage left without one, are both caught", d.extra.includes("extra") && d.missing.includes("links"), JSON.stringify(d));
}

// ---- the shared reader
const tokens = registry.stages.find((s) => s.id === "tokens");
const code = gatherCode(tokens, "/* plugin */");
ok("gatherCode: the facts read shadows a plugin's own __html__ first, then sets FACTS, then returns the call",
  code === "const __html__ = undefined;\nconst FACTS = true;\n/* plugin */\nreturn __headless();\n", JSON.stringify(code));
ok("gatherCode: a script the service already ends with the return is not given a second",
  !/return __headless\(\);\n\s*return/.test(gatherCode(tokens, "x\nreturn __headless();\n")));
const comps = registry.stages.find((s) => s.id === "components");
ok("gatherCode: a list-form set takes the runner's values in the list's order, and only those",
  gatherCode(comps, "S", { TOKENS: { a: 1 }, TARGETS: [], SCALES: {}, OTHER: 1 }) === 'const TARGETS = [];\nconst SCALES = {};\nconst TOKENS = {"a":1};\nS');
const fnd = registry.stages.find((s) => s.id === "foundations");
ok("bucketFor: the file stage files page order first and the rest third", bucketFor(fnd, "page-order") === "b1" && bucketFor(fnd, "naming") === "b3");
const rulesFile = JSON.parse(readFileSync(join(ROOT, comps.buckets.from), "utf8"));
const one = (rulesFile.b1 || [])[0];
ok("bucketFor: the components stage takes its scanner's buckets.json", !one || bucketFor(comps, one, { rulesFile }) === "b1");
ok("bucketFor: a rule buckets.json does not name takes its default", bucketFor(comps, "no-such-rule", { rulesFile }) === (rulesFile._default || "b3"));
ok("bucketFor: checks that set their own bucket keep it", bucketFor(tokens, "tokens-naming", { own: 1 }) === "b1" && bucketFor(tokens, "tokens-unused", { own: 3 }) === "b3");

ok("appliesTo: always, a fact the file has, a setting that is set; nothing else",
  appliesTo(fnd, {}) && appliesTo(comps, { componentSets: true }) && !appliesTo(comps, { componentSets: false })
  && appliesTo(tokens, { tokens: true }) && !appliesTo(tokens, { icons: true })
  && appliesTo(registry.stages.find((s) => s.id === "validator"), {}, { codeTarget: "web" }) && !appliesTo(registry.stages.find((s) => s.id === "validator"), {}, {}));

// ---- how long a runner waits: said once, in the list, for every stage a runner sends to Figma
const sent = registry.stages.filter((s) => s.gather);
ok("gatherTimeout: every stage that runs in Figma says how long to wait for each call",
  sent.every((s) => Number.isInteger(s.gather.timeout) && s.gather.timeout > 0), sent.filter((s) => !(s.gather.timeout > 0)).map((s) => s.id).join(", "));
ok("gatherTimeout: the whole-library scan waits at least four minutes, the most the session runner's 240s let it have",
  gatherTimeout(comps) > 240000);
let threw = false; try { gatherTimeout({ id: "x", gather: {} }); } catch { threw = true; }
ok("gatherTimeout: a stage with no timeout is refused, never given a default", threw);
let named = ""; try { stageById({}, "components"); } catch (e) { named = e.message; }
ok("stageById: finds a stage by id, and an old service's missing list is said, not a crash", stageById(registry, "components") === comps && /restart/.test(named));
// Every call a runner sends to Figma for a stage waits by the list: its arguments name gatherTimeout (or `wait`, read
// from it). One that drops the argument falls back to the bridge's 30s and times out on a large library unseen.
const callsIn = (src, head) => { const out = []; let i = 0;
  while ((i = src.indexOf(head, i)) !== -1) { let d = 0, j = i + head.indexOf("(");
    for (; j < src.length; j++) { if (src[j] === "(") d++; else if (src[j] === ")" && --d === 0) break; }
    out.push(src.slice(i, j + 1)); i = j; }
  return out; };
// queue.js's fix plan writes a few layers, not a walk: the bridge's default holds it
const FIX = /^bridge\.exec\(plan\.code\)$/;
for (const [f, heads] of [["tools/figma-audit/audit-session.mjs", ["exec(port, fileKey,"]], ["tools/docs-site/src/dashboard/audit.js", ["bridge.exec(", "api.exec("]], ["tools/docs-site/src/dashboard/queue.js", ["bridge.exec(", "api.exec("]]]) {
  // strings blanked first, so a paren inside one neither ends a call early nor runs it on into the next
  const raw = readFileSync(join(ROOT, f), "utf8");
  const src = raw.replace(/"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'|`(?:\\.|[^`\\])*`/g, '""');
  const bare = heads.flatMap((h) => callsIn(src, h)).filter((c) => !FIX.test(c) && !/gatherTimeout\(|, wait[,)]/.test(c));
  ok(`${f}: every call to Figma waits as its stage says`, !bare.length, bare.map((c) => c.slice(0, 80)).join("\n"));
  ok(`${f}: a \`wait\` it passes is read from the list`, !/, wait[,)]/.test(src) || /const wait = gatherTimeout\(/.test(src));
}

// O8: the dashboard has ONE Audit, over the files ticked in its list
{
  // the Audit button and the file list sit in the page's hero (audits.astro), the dialog in the dashboard: each read
  // from its own file, so no pattern matches across the two
  const dash = readFileSync(join(ROOT, "tools/docs-site/src/dashboard/Dashboard.astro"), "utf8");
  const hero = readFileSync(join(ROOT, "tools/docs-site/src/pages/audits.astro"), "utf8");
  const page = dash + hero;
  const from = dash.indexOf('<Modal id="auditDialog"'), to = from < 0 ? -1 : dash.indexOf("</Modal>", from);
  const dialog = from < 0 || to < 0 ? "" : dash.slice(from, to);
  const audit = readFileSync(join(ROOT, "tools/docs-site/src/dashboard/audit.js"), "utf8");
  const files = readFileSync(join(ROOT, "tools/docs-site/src/dashboard/measures.js"), "utf8");
  const css = readFileSync(join(ROOT, "tools/docs-site/src/dashboard/dashboard.css"), "utf8");
  ok("dashboard: one Audit button, no menu that comes and goes", /id="auditBtn"/.test(page) && !/auditMenu|auditAllBtn|auditChangedBtn/.test(page + audit));
  ok("dashboard: Whole and Changed are two radios", (dialog.match(/type="radio" name="auditScope"/g) || []).length === 2);
  ok("dashboard: no tab hides the Audit button", !/data-scanned="no"\] \.head-actions/.test(css));
  ok("dashboard: Audit is the primary button and opens a dialog holding a checkbox per file and the two radios; Start audit runs the ticked files", /button--primary" id="auditBtn"/.test(hero) && /^<Modal id="auditDialog" title="Audit">[\s\S]*id="auditFiles"[\s\S]*name="auditScope"[\s\S]*value="run"[\s\S]*Start audit/.test(dialog) && /auditDialog\.showModal\(\)/.test(audit) && /type = "checkbox"/.test(files) && /returnValue !== "run"/.test(audit) && /runFiles\(pickedFiles\(\), scope\)/.test(audit));
  // the hero from its actions to the dashboard it holds: a marker that moved fails here rather than leave an empty slice that passes
  const at = hero.indexOf('<div class="head-actions"'), end = hero.indexOf("<Dashboard");
  const head = at >= 0 && end > at ? hero.slice(at, end) : null;
  ok("dashboard: the header holds no file checkbox and no scope radio; its file list is status only", head !== null && /id="fileList"/.test(head) && !/name="auditScope"|type="checkbox"/.test(head) && !/file-pick|li\.append\(dot, pick/.test(files));
  const run = audit.slice(audit.indexOf("async function runFiles"), audit.indexOf("auditBtn.addEventListener"));
  ok("runFiles: a closed components file is skipped and said, a closed tokens or icons file is checked from its snapshot",
     /kind === "components" && !f\.open\) \{ done\.push\(name \+ ": skipped/.test(run) && /api\.auditStored\(f\.key\)/.test(run));
  ok("runFiles: an open file is switched to, then audited live", /await ctx\.switchLib\(f\.key\)/.test(run) && /await runAudit\(targets\)/.test(run) && /await runOtherStages\(/.test(run));
  const sess = readFileSync(join(ROOT, "tools/figma-audit/audit-session.mjs"), "utf8");
  ok("bin/audit takes every routed library file, a tokens or icons file with no settings of its own", /contract\.auditRecords\(where\)\.filter\(\(r\) => !ctx\.libraries\[r\.key\]\)/.test(sess) && /ctx\.libraries\[fileKey\] \|\| /.test(sess));
  const proj = readFileSync(join(ROOT, "tools/snapshot/projects.cjs"), "utf8"), own = readFileSync(join(ROOT, "tools/docs-site/src/dashboard/owners.js"), "utf8");
  ok("a tokens or icons file is audited with the house defaults, never with no settings", /const files = Object\.fromEntries\(routed\.all\.filter/.test(proj) && /tokens: flatSettings\(house, lib, naming\) \}\]/.test(proj) && /\(c\.files \|\| \{\}\)\[ctx\.libKey\]/.test(own) && /others\[r\.key\]/.test(sess));
  ok("runFiles: the lock is held for the whole run and released once, in finally", /batching = true; lock\(\)/.test(run) && /finally \{[\s\S]*unlock\(\)/.test(run) && /if \(!batching\) unlock\(\)/.test(audit));
}

console.log(n + "/" + n + " passed");
