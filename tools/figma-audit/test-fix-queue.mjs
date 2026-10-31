#!/usr/bin/env node
// Runs renderQueue() against fixtures/queue-record.json: the fix queue's
// markdown, generated from the audit record, compared whole with the golden
// files beside it, so any changed line shows as a failure.
//   node tools/figma-audit/test-fix-queue.mjs
import { readFileSync, mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { renderQueue, text } from "./fix-queue.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const FIX = (f) => join(HERE, "fixtures", f);
const record = () => JSON.parse(readFileSync(FIX("queue-record.json"), "utf8"));

let failed = 0, passed = 0;
function expect(name, got, want) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (ok) passed++; else { failed++; console.log("FAIL " + name + "\n  got  " + JSON.stringify(got) + "\n  want " + JSON.stringify(want)); }
}
const CHAT = { chat: true, heldBack: "naming hygiene on 3 layers", notScanned: "contrast, focus rendering" };

expect("the mirror equals its golden file", renderQueue(record()).markdown, readFileSync(FIX("queue-mirror.md"), "utf8"));
expect("the chat report equals its golden file", renderQueue(record(), CHAT).markdown, readFileSync(FIX("queue-chat.md"), "utf8"));
const cli = execFileSync("node", [join(HERE, "fix-queue.mjs"), "--data", FIX("queue-record.json"), "--chat",
  "--held-back", CHAT.heldBack, "--not-scanned", CHAT.notScanned], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
expect("the CLI prints what the function returns", cli, readFileSync(FIX("queue-chat.md"), "utf8"));

const mirror = renderQueue(record()).markdown, chat = renderQueue(record(), CHAT).markdown;
expect("a verified row is not in the queue; a ticked one that nothing verified is, ticked",
  [mirror.includes("Switch"), /\| \[x\] \| 1\.4 \| ◽ \| \[`Avatar/.test(mirror)], [false, true]);
expect("a user-visible row leads its bucket, then error before warning before preference",
  (mirror.match(/\| 1\.\d \| \S+ \| \[`[^`]+`/g) || []).map((l) => l.split("`")[1]), ["Badge › Fill", "Button › Container", "Tooltip", "Avatar › Frame 12"]);
expect("the chat report carries no URL; the mirror links every row that has a node, with the node id dashed",
  [/https?:/.test(chat), mirror.includes("(https://www.figma.com/design/LIBKEY/Library?node-id=2-4)")], [false, true]);
expect("a warning in Decide reads as a ruling to make", /\| 3\.3 \| 🔵 \|/.test(chat), true);
expect("no cell carries a pipe: an option list joins with ·", chat.includes("Rest · Hover"), true);
// The template's own check: a row's pipes equal its header's (a stray one un-tables the bucket).
const pipesMatch = (md) => {
  let want = null;
  return md.split("\n").every((l) => {
    if (!l.startsWith("|")) { want = null; return true; }
    const n = l.split("|").length;
    if (want === null) { want = n; return true; }
    return n === want;
  });
};
expect("every table row has as many cells as its header, in both forms", [pipesMatch(chat), pipesMatch(mirror)], [true, true]);
expect("the delta and the metrics come from the latest audit run, never a sweep",
  [chat.includes("**3 new** · **2 fixed**"), chat.includes("Date: 2026-10-20")], [true, true]);

// One owner's rows, as figma-components-audit's own queue (a legacy row with no owner is its).
const own = renderQueue(record(), { chat: true, owner: "figma-components-audit" }).markdown;
expect("--owner keeps that skill's rows and the rows from before owners", [own.includes("`Card`"), own.includes("`Page list`"), own.includes("`Tooltip`")], [false, false, true]);

// The gaps the run fills by hand are named, never filled with a guess.
expect("an over-budget claim and the missing closing words are named as gaps",
  renderQueue(record()).gaps.map((g) => g.split(":")[0]), ["3.2", "the Held back part of the closing line", "the Not scanned part of the closing line"]);
const bare = record(); bare.runs = {};
const noRun = renderQueue(bare, CHAT);
expect("(negative) with no audit run there is no delta and no metrics block, and the gap says so",
  [noRun.markdown.includes("Coverage:"), noRun.markdown.includes("Re-run"), noRun.gaps.some((g) => g.startsWith("the record has no audit run"))], [false, false, true]);
const two = record(); two.libraries.OTHER = { name: "Other" };
let threw = null; try { renderQueue(two); } catch (e) { threw = e.message; }
expect("(negative) a record of two libraries needs --file-key", /--file-key/.test(threw || ""), true);
// a record written before it held its libraries is named for its file: real records read so (2026-10-30)
const older = record(); older.libraries = {}; older.runs = {};
const dir = mkdtempSync(join(tmpdir(), "queue-")), named = join(dir, "ABCDEFGHIJKLMNOPQRSTUV.json");
writeFileSync(named, JSON.stringify(older));
const runCli = (file) => { try { return { out: execFileSync("node", [join(HERE, "fix-queue.mjs"), "--data", file], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }) }; } catch (e) { return { err: String(e.stderr) }; } };
const fromName = runCli(named);
expect("a record with no libraries takes its key from its file name", Boolean(fromName.out && fromName.out.includes("### 1")), true);
const twoNamed = join(dir, "ZZZZZZZZZZZZZZZZZZZZZZ.json"); writeFileSync(twoNamed, JSON.stringify(two));
expect("(negative) a record of two libraries still needs --file-key, whatever its file is named", /--file-key/.test(runCli(twoNamed).err || ""), true);
const oneNamed = join(dir, "YYYYYYYYYYYYYYYYYYYYYY.json"); writeFileSync(oneNamed, JSON.stringify(record()));
expect("a record of one library keeps it though its file is named otherwise", runCli(oneNamed).out, renderQueue(record()).markdown);
rmSync(dir, { recursive: true, force: true });

expect("stored markup becomes markdown and entities are unescaped", text("Bind <code>a&lt;b</code> to <b>x</b> | y"), "Bind `a<b` to **x** · y");
// Reviewed 2026-10-30: a pipe in a layer name split the row (a code span does not protect it in GFM), and an
// escaped tag outside code was unescaped into one, which a renderer swallows as HTML.
const piped = record(); Object.values(piped.rows)[0].where = "Tabs › Left | Right";
const pipedMd = [renderQueue(piped).markdown, renderQueue(piped, CHAT).markdown];
expect("(negative) a pipe in a Where cell does not split the row, in both forms", [pipesMatch(pipedMd[0]), pipesMatch(pipedMd[1]), pipedMd[1].includes("`Tabs › Left · Right`")], [true, true, true]);
expect("(negative) an escaped tag outside code stays text: code-spanned, never raw", text("Fill the &lt;slot&gt; then a &lt; b"), "Fill the `<slot>` then a < b");
expect("an escaped tag inside code is unescaped once", text("<code>&lt;slot&gt;</code>"), "`<slot>`");
const shuffled = record(); shuffled.rows = Object.fromEntries(Object.entries(shuffled.rows).reverse());
expect("the order rows sit in the record does not move a line", renderQueue(shuffled).markdown, mirror);

// A one-off run with no record files its findings into a scratch one and renders from it, the same
// two commands a project with a record runs: rows.mjs makes the record, fix-queue.mjs prints it.
{
  const scratch = mkdtempSync(join(tmpdir(), "oneoff-")), data = join(scratch, "audit", "ABCDEFGHIJKLMNOPQRSTUV.json");
  const payload = JSON.stringify({ owner: "figma-components-audit", fileKey: "ABCDEFGHIJKLMNOPQRSTUV", ran: ["tokens", "states"], scope: ["Button"], findings: [
    { where: "Button › Label", check: "Fill is a raw hex, not a variable", key: "tokens:fill:Label", rule: "tokens", sev: "error", bucket: 1, rec: ["Bind the fill to text/primary"] },
    { where: "Button", check: "State axis has no Disabled value", key: "states:disabled", rule: "states", sev: "ruling", bucket: 3, fix: ["Add Disabled, or record why not"], rec: ["Add it"] }] });
  execFileSync("node", [join(HERE, "rows.mjs"), "--data", data], { input: payload, encoding: "utf8" });
  const chat = execFileSync("node", [join(HERE, "fix-queue.mjs"), "--data", data, "--chat", "--held-back", "none", "--not-scanned", "none"], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  writeFileSync(join(scratch, "sets.json"), JSON.stringify([{ set: "Button" }]));
  const scored = execFileSync("node", [join(HERE, "scores.mjs"), "--data", data, "--sets", join(scratch, "sets.json")], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  rmSync(scratch, { recursive: true, force: true });
  expect("the score report runs over the same scratch record, its deductions those findings'", /\| 92 \| 75 \| 100 \| 90 \| 100 \| 100 \| 100 \| `Button` \|/.test(scored), true);
  expect("a run with no record renders from a scratch one: each finding a numbered row in its bucket",
    [/\| 1\.1 \| 🔴 \| `Button › Label` \| Bind the fill to text\/primary \|/.test(chat), /\| 3\.1 \| 🔵 \| `Button` \| Add Disabled, or record why not \| Add it \|/.test(chat)], [true, true]);
}

console.log(passed + " passed, " + failed + " failed");
process.exit(failed ? 1 : 0);
