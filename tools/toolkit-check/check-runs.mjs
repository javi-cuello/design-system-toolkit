#!/usr/bin/env node
// Every assertion a case's `Runs:` line names still exists in the test it names
// (skill-standard §A clause E). A test renamed or deleted left its cases quoting
// assertions nothing runs, three times in one day of reviews; a green suite says
// nothing about a case whose assertion is gone.
//   node tools/toolkit-check/check-runs.mjs        exit 1 and the stale names, or nothing
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { stripComments } from "./strip.mjs";

// CHECK_RUNS_ROOT points the check at another tree, which is how its test runs it.
const REPO = process.env.CHECK_RUNS_ROOT || join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const bad = [];
for (const skill of readdirSync(join(REPO, "skills"))) {
  const cases = join(REPO, "skills", skill, "tests", "cases.md");
  if (!existsSync(cases)) continue;
  readFileSync(cases, "utf8").split("\n").forEach((line, i) => {
    if (!line.startsWith("Runs: ")) return;
    // one line may run several files: `node a — "x"; node b — "y"`
    // the runner may be `node`, `node --test` or `python3`
    const RUN = /^`?(?:node(?: --test)?|python3) ([^\s`]+)`?\s*—\s*(.*)$/;
    for (const seg of line.slice(6).split(/;\s*(?=`?(?:node|python3) )/)) {
      const m = seg.match(RUN);
      // a segment that quotes names but names no runnable file is read by nothing: said, never skipped
      if (!m) { if (/"[^"]{8,}"/.test(seg)) bad.push(`skills/${skill}/tests/cases.md:${i + 1}: a Runs: line quoting names in a shape the check cannot read; write \`node <file> — "name"\``); continue; }
      // a path is the skill's own (tests/…) or the repo's (tools/…)
      const file = [join(REPO, "skills", skill, m[1]), join(REPO, m[1])].find(existsSync);
      if (!file) { bad.push(`skills/${skill}/tests/cases.md:${i + 1}: runs ${m[1]}, which does not exist`); continue; }
      // the test's code, comments removed: an old name left in a comment is not an assertion
      const src = stripComments(file, readFileSync(file, "utf8"));
      for (const q of m[2].matchAll(/"((?:[^"\\]|\\.)+)"/g)) {
        // a name cut with … is matched on what comes before the cut
        const name = q[1].replace(/\\"/g, '"').split("…")[0].trim();
        if (name.length >= 8 && !src.includes(name)) bad.push(`skills/${skill}/tests/cases.md:${i + 1}: "${name.slice(0, 70)}" is in no assertion of ${m[1]}`);
      }
    }
  });
}
for (const b of bad) console.log(b);
process.exit(bad.length ? 1 : 0);
