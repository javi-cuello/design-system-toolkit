// Executes scripts/scaffold.mjs: the seven files from the templates, every placeholder filled, P1's assertions.
// Run: node tests/test-scaffold.mjs   (exits non-zero on failure)
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import { files, TEMPLATES, standardVersion } from "../scripts/scaffold.mjs";

let n = 0;
const ok = (name, fn) => { fn(); n++; console.log(`ok   ${name}`); };
const answers = { slug: "layer-counter", name: 'Layer "Counter" <b>', purpose: "Counts the layers in the selection.", storage: "Nothing.", date: "2026-10-30", standard: standardVersion() };
const out = files(answers);

ok("all seven templates, each written, none left with a placeholder", () => {
  assert.deepEqual(Object.keys(out).sort(), [...TEMPLATES].sort());
  for (const [f, t] of Object.entries(out)) assert.ok(!/\{\{\w+\}\}/.test(t), f);
});
ok("the manifest is the standard's: id the folder, dynamic-page, no network, an editor type, no proposed API, and a quote in the name kept valid", () => {
  const m = JSON.parse(out["manifest.json"]);
  assert.equal(m.id, "layer-counter"); assert.equal(m.name, 'Layer "Counter" <b>');
  assert.equal(JSON.parse(out["package.json"]).name, "layer-counter");
  assert.equal(m.documentAccess, "dynamic-page"); assert.deepEqual(m.networkAccess.allowedDomains, ["none"]);
  assert.ok(m.editorType.length); assert.ok(!("enableProposedApi" in m));
});
ok("version 0.1.0, @ts-check on line 2, the standard it was made against, the README's data section", () => {
  assert.equal(JSON.parse(out["package.json"]).version, "0.1.0");
  assert.equal(out["code.js"].split("\n")[1], "// @ts-check");
  assert.ok(out["code.js"].includes(`standard v${answers.standard}`));
  assert.ok(/Data this plugin stores/.test(out["README.md"]) && out["README.md"].includes("Nothing."));
  assert.ok(out["CHANGELOG.md"].includes("## [0.1.0] - 2026-10-30"));
});
ok("the ui-base block is inlined as the shared baseline holds it", () => {
  const base = fs.readFileSync(fileURLToPath(new URL("../assets/ui-base.css", import.meta.url)), "utf8").trim();
  assert.ok(out["ui.html"].includes(base.split("\n")[0]) && out["ui.html"].includes("CAUTION"));
});
ok("a name is text in the window, never markup", () => assert.ok(out["ui.html"].includes("Layer &quot;Counter&quot; &lt;b&gt;") && !out["ui.html"].includes("<b>")));
ok("an answer of two lines, or a folder that is no id, is refused", () => {
  assert.throws(() => files({ ...answers, purpose: "Counts.\nfigma.closePlugin()" }), /one line/);
  assert.throws(() => files({ ...answers, slug: "Layer Counter" }), /lower case/);
});
ok("the same answers give the same files", () => assert.deepEqual(files(answers), out));
ok("a missing answer is refused, never left as a placeholder", () => assert.throws(() => files({ ...answers, storage: "" }), /--storage is needed/));
ok("the command writes the folder and never over one", () => {
  const dir = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "scaffold-")), "layer-counter");
  const run = () => execFileSync(process.execPath, [fileURLToPath(new URL("../scripts/scaffold.mjs", import.meta.url)), dir, "--name", "Layer Counter", "--purpose", "Counts.", "--storage", "Nothing."], { encoding: "utf8", stdio: "pipe" });
  run();
  assert.deepEqual(fs.readdirSync(dir).sort(), [...TEMPLATES].sort());
  assert.throws(run, /exists/);
  fs.rmSync(path.dirname(dir), { recursive: true, force: true });
});
console.log(`${n} passed`);
