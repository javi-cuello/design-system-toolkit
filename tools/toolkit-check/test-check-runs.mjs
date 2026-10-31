// node tools/toolkit-check/test-check-runs.mjs — check-runs against a throwaway tree:
// each shape of Runs: line it reads, each stale name it refuses, and the line
// it cannot read said rather than skipped.
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const here = dirname(fileURLToPath(import.meta.url));
let pass = 0, fail = 0;
const ok = (name, c) => { if (c) pass++; else { fail++; console.log("FAIL " + name); } };
const tree = (cases, files) => {
  const d = mkdtempSync(join(tmpdir(), "runs-"));
  const put = (rel, text) => { mkdirSync(join(d, dirname(rel)), { recursive: true }); writeFileSync(join(d, rel), text); };
  put("skills/s/tests/cases.md", "# Cases\n\n## A1 · A case\n" + cases + "\n");
  for (const [rel, text] of Object.entries(files)) put(rel, text);
  return d;
};
const run = (d) => spawnSync("node", [join(here, "check-runs.mjs")], { env: Object.assign({}, process.env, { CHECK_RUNS_ROOT: d }), encoding: "utf8" });
const T = { "skills/s/tests/test-a.mjs": 'ok("the first assertion holds");\nok(`a name built ${"x"} late`);\n// ok("an old name only in a comment")\n', "tools/t/test-b.mjs": 'ok("the second file asserts this");\n' };

let r = run(tree('Runs: node tests/test-a.mjs — "the first assertion holds"; node tools/t/test-b.mjs — "the second file asserts this"', T));
ok("names on a line running two files are each found in their own file", r.status === 0);
r = run(tree('Runs: node --test tests/test-a.mjs — "a name built…"', T));
ok("a node --test line is read, and a name cut with … matches what comes before the cut", r.status === 0);
r = run(tree('Runs: node tests/test-a.mjs — "an assertion that was renamed away"', T));
ok("a name the test no longer has is refused", r.status === 1 && /is in no assertion of tests\/test-a\.mjs/.test(r.stdout));
r = run(tree('Runs: node tests/test-a.mjs — "an old name only in a comment"', T));
ok("a name left only in a comment is refused", r.status === 1 && /an old name only in a comment/.test(r.stdout));
r = run(tree('Runs: node tests/test-gone.mjs — "the first assertion holds"', T));
ok("a test file that does not exist is refused", r.status === 1 && /does not exist/.test(r.stdout));
r = run(tree('Runs: by hand — "the first assertion holds"', T));
ok("a line quoting names in a shape the check cannot read is said, not skipped", r.status === 1 && /cannot read/.test(r.stdout));

console.log(`${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
