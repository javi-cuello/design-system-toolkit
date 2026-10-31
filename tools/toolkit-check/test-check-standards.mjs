// node tools/toolkit-check/test-check-standards.mjs — runs check-standards.mjs against a
// throwaway tree and proves each refusal fires, each heal does what it says and
// nothing more, and a report run writes nothing.
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, appendFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync, spawnSync } from "node:child_process";
const here = dirname(fileURLToPath(import.meta.url));
let pass = 0, fail = 0;
const ok = (name, c) => { if (c) pass++; else { fail++; console.log("FAIL " + name); } };

const fence = (n, o) => "```json " + n + "\n" + JSON.stringify(o, null, 2) + "\n```\n";
const SETTINGS = {
  "audit-defaults": { optionOrder: { State: ["Rest", "Hover"], Open: ["False", "True"] }, tokens: { stateAxis: "State", pinnedLast: ["A"] } },
  "audit-keys": { project: { libraries: "x", language: "x" }, optionOrder: { "<axis name>": "authored order (figma-standard rule 1)" }, tokens: { stateAxis: "x", semantic: "x", pinnedLast: "categories kept last (figma-standard rule 1)" }, library: { name: "x", tokens: "x", optionOrder: "x", code: "x" } },
};
const FIGMA = (rules) => "# Figma standard — a test\n\n**Version 1.0.0**\n\n## Rules\n\n" +
  (rules || "1. **One.** Text.\n\n   *Why:* a reason.\n\n   *Checked:* `s/rule.js` \"check|one\".\n\n2. **Two.** Text.\n\n   *Why:* a reason.\n\n   *Reviewed:* `s/rule.js` \"check|one\" — when read.\n");
const TOOLKIT = "# Toolkit standard — a test\n\n**Version 1.0.0**\n\n## Part C\n\n### A — Clause\n\nText.\n\n*Why:* a reason.\n\n*Reviewed:* `s/rule.js` \"check|one\" — when read.\n\n## Part D\n\n### 1 · Rule\n\nText.\n\n*Why:* a reason.\n\n*Reviewed:* `s/rule.js` \"check|one\" — when read.\n\n### 2 · Retired — merged into §D 1 (2026-01-01)\n";
const HISTORY = (name, v = "1.0.0", extra = "") => `# History — ${name}\n\n` + extra + "- " + v + " (2026-01-01): first.\n";
// A tree is a committed git repo: the check finds files with `git ls-files`, and a heal skips uncommitted files.
const tree = (o = {}) => {
  const d = mkdtempSync(join(tmpdir(), "standards-"));
  const put = (rel, text) => { mkdirSync(join(d, dirname(rel)), { recursive: true }); writeFileSync(join(d, rel), text); };
  put("standards/audit-settings.json", JSON.stringify(o.settings || SETTINGS, null, 2));
  put("standards/naming-preferences.json", JSON.stringify(o.naming || { preferences: {}, keys: {} }, null, 2));
  put("standards/figma-standard.md", o.figma || FIGMA());
  put("standards/changelog/figma-standard.md", o.history || HISTORY("figma-standard"));
  put("standards/toolkit-standard.md", TOOLKIT);
  put("standards/changelog/toolkit-standard.md", HISTORY("toolkit-standard"));
  put("projects/p/design-system-context.md", o.project || fence("audit-settings", { libraries: { K: { name: "Lib", tokens: { semantic: "S" } } } }));
  put("s/rule.js", o.rule || "key:'check|one'");
  put("s/scan.js", o.scanner || "const a = TOK.stateAxis;");
  put("s/reader.js", o.reader || "read(settings.stateAxis, settings.semantic, settings.pinnedLast)");
  for (const [rel, text] of Object.entries(o.files || {})) put(rel, text);
  const g = (...a) => execFileSync("git", ["-C", d, ...a], { encoding: "utf8" });
  g("init", "-q"); g("add", "-A"); g("-c", "user.name=t", "-c", "user.email=t@t", "commit", "-qm", "init");
  return d;
};
const run = (d, fix, env = {}) => spawnSync("node", [join(here, "check-standards.mjs")].concat(fix ? ["--fix"] : []),
  { env: Object.assign({}, process.env, { STANDARDS_ROOT: d, STANDARDS_SCANNERS: "s/scan.js", STANDARDS_READERS: "s/reader.js" }, env), encoding: "utf8" });
const MAP = "| Was | Now |\n|---|---|\n| old rule 5 | figma-standard rule 2 |\n\n";

let d = tree(), r = run(d);
ok("a clean tree passes", r.status === 0 && /standards clean/.test(r.stdout));

// rules
d = tree({ figma: FIGMA("1. **One.** Text with no marker.\n") });
ok("a rule with no enforcement marker is refused", /figma-standard 1: has no enforcement marker/.test(run(d).stdout));
d = tree({ rule: "something else" });
ok("a *Checked:* pair whose file no longer holds its string is refused", /holds "check\|one" in no code/.test(run(d).stdout));
d = tree({ rule: "// TODO key:'check|one'\n" });
ok("a *Checked:* string found only in a comment is refused", /holds "check\|one" in no code/.test(run(d).stdout));
for (const [f, body] of [["s/a.sh", "run x # GONE\n"], ["s/a.css", "a { color: red } /* GONE */\n"]]) {
  d = tree({ figma: FIGMA("1. **One.** Text.\n\n   *Why:* a reason.\n\n   *Checked:* `" + f + "` \"GONE\".\n"), files: { [f]: body } });
  ok(`a string only in a trailing comment of ${f} is refused`, /holds "GONE" in no code/.test(run(d).stdout));
}
d = tree({ figma: FIGMA("1. **One.** Text.\n\n   *Why:* a reason.\n\n   *Checked:* by eye in review.\n\n   *Evidence:* `s/rule.js` \"check|one\".\n") });
ok("a *Checked:* ends with its paragraph: a pair in the next line's evidence does not count", /opens with no pair/.test(run(d).stdout));
d = tree({ figma: FIGMA("1. **One.** Text about `*Why:*`.\n\n   *Reviewed:* `s/rule.js` \"check|one\" — when read.\n") });
d = tree({ figma: FIGMA("1. **One.** Text.\n\n   *Why:* a reason.\n\n   *Checked:* `s/rule.js` \"check|one\" and \"gone *Why:* x\".\n") });
d = tree({ figma: FIGMA("1. **One.** Text.\n\n   *Why:* a reason.\n\n   *Checked:* `s/rule.js` \"check|one\";\n   `s/scan.js` \"GONE\" — then prose.\n") });
ok("every pair joined by ; is checked, across a wrapped line", /s\/scan\.js holds "GONE" in no code/.test(run(d).stdout));
// 2026-10-30: a ";" promised a pair the loop never checked, so these passed in silence.
const pairOf = (tail) => run(tree({ figma: FIGMA("1. **One.** Text.\n\n   *Why:* a reason.\n\n   *Checked:* `s/rule.js` \"check|one\"; " + tail + "\n") })).stdout;
ok("a second pair with no test name is refused, not passed", /after ";" comes "`s\/gone\.js`, its one case\.", not a `path` "string" pair/.test(pairOf("`s/gone.js`, its one case.")));
ok("a second pair whose name breaks across a line is refused", /after ";" comes "`s\/scan\.js` "TOK/.test(pairOf("`s/scan.js` \"TOK\n   more\".")));
ok("a dangling ; before the next marker is refused", /after ";" comes "", not a `path` "string" pair/.test(pairOf("*Checked:* `s/rule.js` \"check|one\".")));
ok("a name holding a double quote is refused, not checked as its first part", /the string "check\|one " from s\/rule\.js is followed by "x"/.test(run(tree({ figma: FIGMA("1. **One.** Text.\n\n   *Why:* a reason.\n\n   *Checked:* `s/rule.js` \"check|one \"x\" here\".\n") })).stdout));
// 2026-10-30: §D 1 and §D 13 pointed at README.md sections that had moved; no rule handle showed it.
const sect = (cite, files) => run(tree({ figma: FIGMA("1. **One.** See " + cite + ".\n\n   *Why:* a reason.\n\n   *Checked:* `s/rule.js` \"check|one\".\n"), files })).stdout;
ok("a standard citing a heading its file lacks is refused", /cites the section "Session hooks" of s\/README\.md, a heading that file does not have/.test(sect("`s/README.md` (*Session hooks*)", { "s/README.md": "# S\n\n## Install\n" })));
ok("…and one in a file that does not exist", /cites the section "Install" of s\/GONE\.md, a file that does not exist/.test(sect("`s/GONE.md`'s *Install*", {})));
ok("…and a marker after a path is not a heading", !/cites the section/.test(sect("`s/README.md` *Checked:* x", { "s/README.md": "# S\n" })));
ok("…and a heading the file has passes",!/cites the section/.test(sect("`s/README.md` (*Install*)", { "s/README.md": "# S\n\n## Install\n" })));
d = tree({ figma: FIGMA("1. **One.** Text.\n\n   *Why:* a reason.\n\n   *Checked:* `s/rule.js` “GONE”; `s/scan.js` \"TOK\".\n") });
ok("a first pair that is not a pair ends the checks before they start: refused, not hidden behind the next", /opens with no pair/.test(run(d).stdout));
d = tree({ figma: FIGMA("1. **One.** Text.\n\n   *Checked:* a 5\" screen, by eye. *Why:* see `s/rule.js` \"check|one\" here.\n") });
ok("a stray quote does not let a section borrow the next marker's pair", /opens with no pair/.test(run(d).stdout));
d = tree({ figma: FIGMA("1. **One.** Text about `*Why:*`.\n\n   *Reviewed:* `s/rule.js` \"check|one\" — when read.\n") });
ok("a *Why:* quoted in inline code is not the rule's own", /has no \*Why:\*/.test(run(d).stdout));
d = tree({ history: HISTORY("figma-standard", "1.0.0", "| Was | Now |\n|---|---|\n| figma rule1 | figma-standard rule 1 |\n\n") });
ok("a move-map row with no space before its number does not crash the check", !/TypeError/.test(run(d).stderr));
d = tree({ figma: FIGMA("1. **One.** Text.\n\n   *Checked:* `s/gone.js` \"x\".\n") });
ok("a *Checked:* path that does not exist is refused", /names s\/gone\.js, which does not exist/.test(run(d).stdout));
d = tree({ figma: FIGMA("1. **One.** Text.\n\n   *Checked:* the golden replay, and the same case.\n") });
ok("a *Checked:* that opens with no pair is refused", /opens with no pair/.test(run(d).stdout));
d = tree({ figma: FIGMA("1. **One.** Text.\n\n   *Checked:* `sx/rule.js` \"check|one\".\n") });
ok("a typo in a *Checked:* path's first folder is refused, not skipped as a project's", /names sx\/rule\.js, which is not in this repo/.test(run(d).stdout));
d = tree({ figma: FIGMA("1. **One.** Text.\n\n   *Why:* a reason.\n\n   *Checked:* `s/rule.js` \"check|one\", and a project's `tests/bypass.php`.\n") });
ok("a project's own path, said so, is an example beside a real check", run(d).status === 0);
d = tree({ files: { "standards/odd-standard.md": "# Odd — x\n\n**Version 1.0.0**\n", "standards/changelog/odd-standard.md": "- 1.0.0 (2026-01-01): x.\n" } });
ok("a standard the check has no entry for is refused, not skipped", /odd-standard\.md: no entry/.test(run(d).stdout));
d = tree({ figma: FIGMA("1. **One.** Text.\n\n   *Checked:* `s/sub` \"x\".\n"), files: { "s/sub/x.js": "x" } });
r = run(d);
ok("a *Checked:* naming a folder is refused, and never crashes", /names the folder s\/sub;/.test(r.stdout) && !/EISDIR/.test(r.stderr));
const SK = (body) => FIGMA("1. **One.** Text.\n\n   *Why:* a reason.\n\n   *Checked:* " + body + "\n");
d = tree({ figma: SK("`skills/x/scripts/p.js` \"probe\"."), files: { "skills/x/scripts/p.js": "probe();\n" } });
ok("a *Checked:* into a skill's script nothing runs on its own is refused", /a skill's script nothing runs on its own/.test(run(d).stdout));
d = tree({ figma: SK("`skills/x/scripts/p.js` \"probe\"; `skills/x/tests/test-p.mjs` \"asserts it\"."), files: { "skills/x/scripts/p.js": "// @runs: s/runner.js\nprobe();\n", "s/runner.js": "load('p.js');\n", "skills/x/tests/test-p.mjs": "ok('asserts it');\n" } });
ok("and one whose @runs header names a file that loads it, or a test bin/check runs, passes", !/nothing runs on its own/.test(run(d).stdout));
d = tree({ figma: SK("`skills/x/scripts/p.js` \"probe\"."), files: { "skills/x/scripts/p.js": "// @runs: a session, by hand\nprobe();\n" } });
ok("an @runs header that names no file loading it is refused", /nothing runs on its own/.test(run(d).stdout));
d = tree({ figma: FIGMA("1. **One.** Text.\n\n   *Checked:* `s/rule.js`.\n") });
ok("a *Checked:* naming a file but no string from it is refused", /opens with no pair/.test(run(d).stdout));
d = tree({ figma: FIGMA("1. **Retired components stay hidden.** Text with no marker.\n\n2. *Retired 2026-01-01: superseded by rule 1.*\n\nSee rule 9, and rule 1.\n") });
r = run(d);
ok("a rule that only mentions \"Retired\" is a rule; a real tombstone needs no marker; a bare rule N in a standard resolves against it",
  /figma-standard 1: has no enforcement marker/.test(r.stdout) && !/figma-standard 2:/.test(r.stdout) && /cites rule 9, which figma-standard does not have/.test(r.stdout) && !/cites rule 1,/.test(r.stdout));
d = tree({ figma: FIGMA("1. **One.** Text.\n\n   *Reviewed:* `s/rule.js` \"check|one\" — when read.\n") });
ok("a rule with no *Why:* is refused", /figma-standard 1: has no \*Why:\*/.test(run(d).stdout));
d = tree({ figma: FIGMA("1. **One.** Text.\n\n   *Why:* a reason.\n\n   *No check yet.*\n") });
r = run(d);
ok("a rule marked *No check yet.* is refused: a rule with no check is a rule nobody sees", /says it has no check yet/.test(r.stdout) && r.status === 1);
d = tree({ figma: FIGMA("1. **One.** Text.\n\n   *Why:* a reason.\n\n   *Reviewed:* by the audit's reader.\n") });
ok("a *Reviewed:* that names no file prompting the reading is refused", /\*Reviewed:\* opens with no pair/.test(run(d).stdout));
d = tree({ figma: FIGMA("1. **One.** Text.\n\n   *Why:* a reason.\n\n   *Checked:* `s/rule.js` \"check|one\" — the other half has no check yet.\n") });
ok("a rule whose prose leaves a half with no check is refused", /says it has no check yet/.test(run(d).stdout));

// history
d = tree({ history: HISTORY("figma-standard", "0.9.0") });
ok("a version with no history line is refused", /no line for v1\.0\.0/.test(run(d).stdout));
d = tree({ history: HISTORY("figma-standard", "1.0.0", "- 0.9.0 (2025-12-01): " + "a reason buried in history ".repeat(15) + "\n") });
ok("a history entry longer than one line of reference is refused", /one line of reference/.test(run(d).stdout));
d = tree({ history: "# History — figma-standard\n\n- 0.9.0 (2025-12-01): older.\n- 1.0.0 (2026-01-01): newer, below it.\n" });
ok("history out of order is refused", /1\.0\.0 sits below 0\.9\.0/.test(run(d).stdout));
d = tree({ history: "# History — figma-standard\n\n- 1.0.0+1 (2026-01-02): relabelled.\n- 1.0.0 (2026-01-01): first.\n" });
ok("a duplicate version relabelled with a suffix is still refused", /1\.0\.0 sits below 1\.0\.0/.test(run(d).stdout));
d = tree({ figma: FIGMA() + "\n## Changelog\n- 1.0.0 (2026-01-01): x.\n" });
ok("a standard carrying its own changelog is refused", /carries a ## Changelog/.test(run(d).stdout));

// citations
d = tree({ files: { "docs/a.md": "See figma-standard rule 9 for this.\n" } });
ok("a citation of a rule its standard does not have is refused", /docs\/a\.md:1: cites figma-standard rule 9, a rule its standard does not have/.test(run(d).stdout));
d = tree({ files: { "docs/a.md": "See [figma-standard](x.md) rule 7, and Figma standard rule 8.\n" } });
r = run(d);
ok("linked and capitalised forms are citations too", /cites figma-standard rule 7/.test(r.stdout) && /cites figma-standard rule 8/.test(r.stdout));
d = tree({ files: { "docs/a.md": "See figma-standard rules 1 and 2, figma-standard rule 1, 2026-10-08, and figma-standard rule 2 and 300 files.\n```\nfigma-standard rule 99 in an example\n```\n" } });
ok("real lists pass; a date or a count after a citation is not a rule; a fenced example is not a citation", run(d).status === 0);
d = tree({ files: { "docs/a.md": "Bare §D 99 and toolkit-standard §C 1 and §D clause A.\n" } });
r = run(d);
ok("a bare part citation resolves to its standard, and a handle of the wrong kind for its part is refused",
  /cites toolkit-standard §D 99/.test(r.stdout) && /cites toolkit-standard §C 1/.test(r.stdout) && /cites toolkit-standard §D A/.test(r.stdout));
d = tree({ files: { "docs/a.md": "As rule 2 says.\n" } });
ok("outside standards/, a rule number that names no standard is refused", /docs\/a\.md:1: "rule 2" names no standard/.test(run(d).stdout));
d = tree({ files: { "docs/a.md": "Toolkit: standards/figma-standard.md rule 2\n", "standards/notes.md": "As rule 2 above says.\n" } });
ok("a path-form citation passes, and a standard may say rule N of itself", !/names no standard/.test(run(d).stdout));
d = tree({ files: { "docs/a.md": "As §D 2 said.\n" } });
ok("a citation of a retired rule is refused", /§D 2, which is retired/.test(run(d).stdout));
d = tree({ history: HISTORY("figma-standard", "1.0.0", MAP), files: { "docs/a.md": "Per Old rule 5, and old rule 50.\n```\nold rule 5 in an example\n```\n**Walked: 2026-01-01** — old rule 5 then.\n## Changelog\n- old rule 5 in history stays.\n" } });
ok("a citation a history map retires is refused", /names a retired form \("Old rule 5/.test(run(d).stdout));
r = run(d, true);
const healed = readFileSync(join(d, "docs/a.md"), "utf8");
ok("--fix rewrites only live text: the example, the walk record and the history stay as written; an unmapped old number is left for a person",
  /names a retired form \("old rule 50\.…"\); cite the standard/.test(r.stdout) && healed.startsWith("Per figma-standard rule 2, and old rule 50.") && /old rule 5 in an example/.test(healed) && /— old rule 5 then/.test(healed) && /old rule 5 in history stays/.test(healed));
d = tree({ history: HISTORY("figma-standard", "1.0.0", MAP), files: { "docs/a.md": "Per old rule 5.\n" } });
appendFileSync(join(d, "docs/a.md"), "Someone else's unsaved line.\n");
r = run(d, true);
ok("--fix leaves a file with uncommitted changes alone and says so", /skipped docs\/a\.md/.test(r.stdout) && /Per old rule 5/.test(readFileSync(join(d, "docs/a.md"), "utf8")));
d = tree({ files: { "docs/a.md": "As old-standard says, per old rules 5 and 6, and old standards.\n", "standards/changelog/old-standard.md": "# History — old-standard\n\nRetired 2026-01-01.\n\n" + MAP } });
r = run(d);
ok("a retired standard's name in any spelling, and a list in its old form, are refused",
  /retired standard \("old-standard"/.test(r.stdout) && /retired form \("old rules 5/.test(r.stdout) && /retired standard \("old standards"/.test(r.stdout));
d = tree({ files: { "docs/a.md": "```\nold-standard.md   the old file\n```\n", "standards/changelog/old-standard.md": "# History — old-standard\n\nRetired 2026-01-01.\n" } });
ok("a retired standard's name in a fenced file tree is refused too", /docs\/a\.md:2: names a retired standard/.test(run(d).stdout));

// settings
d = tree({ project: fence("audit-settings", { libraries: { K: { name: "Lib", optionOrder: {} } } }) });
const before = readFileSync(join(d, "projects/p/design-system-context.md"), "utf8");
r = run(d);
ok("a report run writes nothing, even where --fix would heal", readFileSync(join(d, "projects/p/design-system-context.md"), "utf8") === before && /an empty optionOrder \(run with --fix\)/.test(r.stdout));
d = tree({ settings: { ...SETTINGS, "audit-defaults": { ...SETTINGS["audit-defaults"], tokens: { ...SETTINGS["audit-defaults"].tokens, mystery: 1 } } } });
ok("a house default missing from the registry is refused", /tokens\.mystery is not in audit-keys/.test(run(d).stdout));
d = tree({ settings: { ...SETTINGS, "audit-defaults": { ...SETTINGS["audit-defaults"], frameworks: { kit: { instance: "Kit{Name}", mystery: 1 } } }, "audit-keys": { ...SETTINGS["audit-keys"], frameworks: { instance: "the root class" } } } });
r = run(d);
ok("a framework's profile is a section the merge reads, and each of its fields is registered", /frameworks\.kit\.mystery is not in audit-keys/.test(r.stdout) && !/frameworks\.kit\.instance/.test(r.stdout) && !/frameworks is not a section/.test(r.stdout));
d = tree({ project: fence("audit-settings", { tokns: 1, libraries: { K: { name: "Lib", tokens: { typo: 1 }, color: 1 } } }) });
r = run(d);
ok("a project key missing from the registry is refused, top-level, library and token", /top-level key tokns/.test(r.stdout) && /tokens\.typo is not in audit-keys/.test(r.stdout) && /library key color is not in audit-keys/.test(r.stdout));
d = tree({ project: fence("audit-settings", { libraries: { K: { name: "Lib", pages: { mystery: 1 } } } }), scanner: "const a = TOK.stateAxis; const b = TOK.derivedOne;", settings: { ...SETTINGS, "audit-keys": { ...SETTINGS["audit-keys"], pages: {}, derived: { derivedOne: "from stateAxis" } } } });
r = run(d);
ok("a key in any section is checked against that section's registry; a derived key a scanner reads is registered", /pages\.mystery is not in audit-keys/.test(r.stdout) && !/reads settings key derivedOne/.test(r.stdout));
d = tree({ project: "```json  audit-settings\r\n" + JSON.stringify({ libraries: { K: { name: "Lib", tokens: { typo: 1 } } } }) + "\r\n```\n" });
ok("an oddly spaced or CRLF fence is read, never skipped", /tokens\.typo is not in audit-keys/.test(run(d).stdout));
d = tree({ project: fence("audit-settings", { libraries: { K: { name: "Lib", tokens: { semantic: "S", stateAxis: "State" }, optionOrder: { Open: ["False", "True"] }, code: { repo: "r", components: "c" } } } }).replace('"code": {\n        "repo": "r",\n        "components": "c"\n      }', '"code": { "repo": "r", "components": "c" }') });
ok("restating a house value is refused, an axis's order included", /tokens\.stateAxis restates/.test(run(d).stdout) && /optionOrder\.Open restates/.test(run(d).stdout));
r = run(d, true);
const proj = readFileSync(join(d, "projects/p/design-system-context.md"), "utf8");
ok("--fix removes only the restated lines and keeps the author's layout", r.status === 0 && !/stateAxis|optionOrder/.test(proj) && proj.includes('"code": { "repo": "r", "components": "c" }'));
d = tree({ project: fence("audit-settings", { libraries: { K: { name: "Lib", tokens: { pinnedLast: ["B"] } } } }) });
ok("a value that differs from a house default owes an Overrides line for the rule its key serves", /declares "\*\*Overrides:\*\* figma-standard rule 1/.test(run(d).stdout));
d = tree({ project: fence("audit-settings", { libraries: { K: { name: "Lib", optionOrder: { State: ["Hover", "Rest"] } } } }) });
ok("an option order that differs from the house owes an Overrides line through the registry's axis entry", /optionOrder\.State differs.*figma-standard rule 1/.test(run(d).stdout));
d = tree({ project: fence("audit-settings", { libraries: { K: { name: "Lib", optionOrder: { Open: ["True", "False"] } } } }) });
ok("an axis whose order differs from the house's owes an Overrides line", /optionOrder\.Open differs/.test(run(d).stdout));
d = tree({ project: "**Overrides:** figma-standard rule 1 — this project pins B.\n\n" + fence("audit-settings", { libraries: { K: { name: "Lib", tokens: { pinnedLast: ["B"] } } } }) });
ok("and the declared override passes", run(d).status === 0);
d = tree({ scanner: "const x = TOK.notAKey; const y = TOK['other'];" });
r = run(d);
ok("a scanner reading an unregistered key is refused, dotted or bracketed", /reads settings key notAKey/.test(r.stdout) && /reads settings key other/.test(r.stdout));
d = tree({ scanner: "const marker = '🚧'; // 🚧 in a comment, with 'quotes', is fine\nconst u = 'http://x'; const s = TOK.stateAxis;" });
r = run(d);
ok("an emoji in scanner code is refused; a comment holding quotes is still a comment", /literal 🚧 in code/.test(r.stdout) && (r.stdout.match(/literal/g) || []).length === 1);
d = tree({ scanner: "if (props['State'] || /^State$/.test(n) || n.startsWith('State=')) go(); const t = 'State of the art';" });
ok("a house value quoted, in a regex or as variant syntax is refused", /quotes the house values? "State"/.test(run(d).stdout));
d = tree({ scanner: "const t = 'State of the art'; const a = TOK.stateAxis;" });
ok("a house word inside ordinary English is not a finding", run(d).status === 0);
d = tree({ scanner: "push('see figma-standard rule 9');" });
ok("a scanner writing a standard's rule number into its output is refused", /writes "figma-standard rule 9"/.test(run(d).stdout));
d = tree({ reader: "read(settings.stateAxis, settings.pinnedLast) // semantic is mentioned only here" });
ok("a registered key read only in a comment counts as unread", /tokens\.semantic is registered but nothing reads it/.test(run(d).stdout));
d = tree({ scanner: "f(opts.stateAxis, opts.states, opts.bogusKey);" });
r = run(d, false, { STANDARDS_OPTS: JSON.stringify({ "s/scan.js": ["states"] }) });
ok("an opts file reading an unregistered key is refused; a key and a derived argument pass", /reads opts\.bogusKey/.test(r.stdout) && !/opts\.stateAxis|opts\.states,/.test(r.stdout));
d = tree({ scanner: "if (props['State']) go();", files: { "tools/toolkit-check/settings-allowlist.json": JSON.stringify({ "s/scan.js": [{ literal: "props['State']", reason: "a test" }] }) } });
ok("an allowlisted literal passes", run(d).status === 0);
d = tree({ files: { "tools/toolkit-check/settings-allowlist.json": JSON.stringify({ "s/scan.js": [{ literal: "gone()", reason: "stale" }], "s/missing.js": [] }) } });
r = run(d);
ok("a stale allowlist entry is refused", /no longer contains "gone\(\)"/.test(r.stdout) && /s\/missing\.js does not exist/.test(r.stdout));
d = tree({ files: { "tools/toolkit-check/settings-allowlist.json": "{bad" } });
ok("an unreadable allowlist fails the run, never passes it", run(d).status === 1);

// 2026-10-11: a project's top-level interface limits are held to the registry, the house value and its Overrides line.
const UI = { ...SETTINGS, "audit-defaults": { ...SETTINGS["audit-defaults"], interface: { maxSegments: 4 } }, "audit-keys": { ...SETTINGS["audit-keys"], project: { ...SETTINGS["audit-keys"].project, interface: "x" }, interface: { maxSegments: "the most segmented buttons (figma-standard rule 1)" } } };
d = tree({ settings: UI, scanner: "const a = L.maxSegments;", project: fence("audit-settings", { interface: { maxSegments: 4, typo: 1 }, libraries: { K: { name: "Lib", tokens: { semantic: "S" } } } }) });
const uiOut = run(d).stdout;
ok("a project restating an interface default is refused", /interface\.maxSegments restates the house default/.test(uiOut));
ok("…and an unregistered interface key", /interface\.typo is not in audit-keys/.test(uiOut));
d = tree({ settings: UI, scanner: "const a = L.maxSegments;", project: fence("audit-settings", { interface: { maxSegments: 6 }, libraries: { K: { name: "Lib", tokens: { semantic: "S" } } } }) });
ok("…and one that differs owes its Overrides line", /interface\.maxSegments differs from the house default/.test(run(d).stdout));
// 2026-10-11: a knowledge page links only public URLs and paths that resolve in the repo (toolkit-standard §D 21).
d = tree({ files: { "knowledge/ui/a.md": "# A\n\nSee [b](b.md#the-x), [bad anchor](b.md#nope), [c](../../standards/missing.md), [mine](/Users/me/notes.md) and [web](https://example.com).\n", "knowledge/ui/b.md": "# B\n\n## The X\n" } });
const kOut = run(d).stdout;
ok("a knowledge link that resolves passes", !/links b\.md, which/.test(kOut) && !/b\.md#the-x/.test(kOut));
ok("…one that does not is refused", /knowledge\/ui\/a\.md: a knowledge page links \.\.\/\.\.\/standards\/missing\.md/.test(kOut));
d = tree({ files: { "knowledge/ui/patterns/p.md": "# P\n\n## With\n\n**How.** x\n\n**Build.** y\n\n## Without\n\n**How.** x\n" } });
const bOut = run(d).stdout;
ok("a pattern section with no Build part is refused, one with it passes", /pattern "Without" has no Build part/.test(bOut) && !/pattern "With" has/.test(bOut));
ok("…and an anchor the page has no heading for", /links b\.md#nope, a heading/.test(kOut) && !/b\.md#the-x/.test(kOut));
ok("…and a path on someone's machine", /links a path outside the repo \(\/Users\/me\/notes\.md\)/.test(kOut));
// 2026-10-26: naming preferences are their own standards file and a project's own block, never an audit setting.
{
  const naming = { preferences: { booleanPrefix: "Show " }, keys: { booleanPrefix: "prefix every boolean property starts with (figma-standard rule 1)" } };
  const libNaming = run(tree({ naming, project: fence("audit-settings", { libraries: { K: { name: "Lib", naming: { booleanPrefix: "Has " } } } }) })).stdout;
  ok("a library's naming section in audit-settings is refused, pointing at the naming-preferences block", /a naming section in audit-settings; a project's naming preferences go in its naming-preferences block/.test(libNaming));
  const block = (o) => run(tree({ naming, project: fence("audit-settings", { libraries: { K: { name: "Lib" } } }) + fence("naming-preferences", o) })).stdout;
  ok("a naming-preferences key the standards file does not register is refused", /naming-preferences nope is not in standards\/naming-preferences\.json/.test(block({ nope: 1 })));
  ok("…one restating the house preference is refused", /naming-preferences booleanPrefix restates the house preference/.test(block({ booleanPrefix: "Show " })));
  ok("…and one that differs owes its Overrides line", /naming-preferences booleanPrefix differs from the house default/.test(block({ booleanPrefix: "Has " })));
  const inAudit = run(tree({ naming, settings: { ...SETTINGS, "audit-defaults": { ...SETTINGS["audit-defaults"], naming: { booleanPrefix: "Show " } } } })).stdout;
  ok("a naming section back in the audit settings is refused", /a naming section; naming preferences live in standards\/naming-preferences\.json/.test(inAudit));
}
console.log(pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
