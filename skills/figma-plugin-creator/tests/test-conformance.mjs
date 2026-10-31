// Executes scripts/conformance.mjs: a fresh scaffold is clean, P2's and P3's planted plugins raise what the cases
// say, and every plugin in the toolkit passes with no error.
// Run: node tests/test-conformance.mjs   (exits non-zero on failure)
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import { files, standardVersion } from "../scripts/scaffold.mjs";
import { checkPlugin, pluginsUnder } from "../scripts/conformance.mjs";

const SCRIPT = fileURLToPath(new URL("../scripts/conformance.mjs", import.meta.url));
const PLUGINS = fileURLToPath(new URL("../../../plugins", import.meta.url));
let n = 0;
const ok = (name, fn) => { fn(); n++; console.log(`ok   ${name}`); };
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "conformance-"));
const plant = (slug, edit = (f) => f) => {
  const out = edit(files({ slug, name: "Planted", purpose: "A planted plugin.", storage: "Nothing.", date: "2026-10-31", standard: standardVersion() }));
  const dir = path.join(tmp, slug);
  fs.mkdirSync(dir);
  for (const [f, t] of Object.entries(out)) if (t != null) fs.writeFileSync(path.join(dir, f), t);
  return dir;
};
const said = (found, re) => found.filter((x) => re.test(x.text));
const manifest = (out, fn) => { const m = JSON.parse(out["manifest.json"]); fn(m); out["manifest.json"] = JSON.stringify(m, null, 2); return out; };

try {
  ok("a fresh scaffold is conformant: nothing raised", () => assert.deepEqual(checkPlugin(plant("clean")), []));

  ok("P2: sync node calls are found by line, never fixed, and gate documentAccess (warned while it is absent)", () => {
    const dir = plant("selection-tools", (out) => {
      out["code.js"] = out["code.js"].replace("// @ts-check\n", "// @ts-check\nconst a = figma.getNodeById('1:2');\nconst s = figma.getStyleById('S:1');\nconst m = node.mainComponent;\n// figma.getNodeById( in a comment is not a call\n");
      return manifest(out, (m) => { delete m.documentAccess; });
    });
    const found = checkPlugin(dir);
    const sync = said(found, /sync API/);
    assert.equal(sync.length, 1); assert.match(sync[0].text, /code\.js:3, 4, 5:/); assert.match(sync[0].text, /BEFORE documentAccess/);
    assert.equal(sync[0].kind, "manual");
    assert.ok(said(found, /documentAccess must be/).length, "the missing documentAccess is raised as its own finding");
  });
  ok("P2, after: with dynamic-page, the same call is an error (it throws)", () => {
    const dir = plant("dirty-dynamic", (out) => { out["code.js"] = out["code.js"].replace("// @ts-check\n", "// @ts-check\nfigma.currentPage = page;\n"); return out; });
    const sync = said(checkPlugin(dir), /sync API/);
    assert.equal(sync.length, 1); assert.equal(sync[0].level, "error");
  });

  ok("P2, reviewed: a root walk is sync-unsafe only where the pages are not loaded first; a local named currentPage is no write", () => {
    const unloaded = plant("walk-unloaded", (out) => { out["code.js"] = out["code.js"].replace("// @ts-check\n", "// @ts-check\nconst all = figma.root.findAll(() => true);\n"); return out; });
    assert.equal(said(checkPlugin(unloaded), /sync API/)[0].level, "error");
    const loaded = plant("walk-loaded", (out) => { out["code.js"] = out["code.js"].replace("// @ts-check\n", "// @ts-check\nawait figma.loadAllPagesAsync();\nconst all = figma.root.findAll(() => true);\nconst currentPage = figma.currentPage;\n"); return out; });
    assert.deepEqual(said(checkPlugin(loaded), /sync API/), []);
  });

  ok("P3: a fetch under [\"none\"] is blocked, unpkg with no fallback and @latest are needs-decision", () => {
    const dir = plant("data-puller", (out) => {
      out["ui.html"] = out["ui.html"].replace("</script>", "fetch('https://api.example.com/x'); fetch('https://unpkg.com/lucide-static@latest/icons/a.svg');\n</script>");
      return out;
    });
    const found = checkPlugin(dir);
    assert.equal(said(found, /while allowedDomains is \["none"\]/)[0].level, "error");
    assert.equal(said(found, /unpkg\.com with no jsdelivr/)[0].kind, "needs-decision");
    assert.ok(said(found, /@latest/).length);
  });
  ok("a local server in development, declared in devAllowedDomains, is not a blocked fetch", () => {
    const dir = plant("dev-server", (out) => {
      out["code.js"] = out["code.js"].replace("// @ts-check\n", "// @ts-check\nfetch('http://localhost:9000');\n");
      return manifest(out, (m) => { m.networkAccess.devAllowedDomains = ["http://localhost:9000"]; });
    });
    assert.deepEqual(said(checkPlugin(dir), /allowedDomains/), []);
  });
  ok("a gated API without its permission is an error, with its line; with it, nothing", () => {
    const edit = (out) => { out["code.js"] = out["code.js"].replace("// @ts-check\n", "// @ts-check\nconst me = figma.currentUser;\n"); return out; };
    const found = said(checkPlugin(plant("who-am-i", edit)), /permission/);
    assert.equal(found.length, 1); assert.match(found[0].text, /figma\.currentUser \(code\.js:3\) without the "currentuser"/); assert.equal(found[0].level, "error");
    assert.deepEqual(said(checkPlugin(plant("who-am-i-ok", (o) => manifest(edit(o), (m) => { m.permissions = ["currentuser"]; }))), /permission/), []);
  });
  ok("metadata: the header, the README and package.json agree, @ts-check is line 2, the stamp names a real version", () => {
    const dir = plant("drifted", (out) => {
      out["code.js"] = out["code.js"].replace(/v0\.1\.0 · skill-standard v[\d.]+/, "v0.2.0 · skill-standard v0.0.1").replace("// @ts-check\n", "\n// @ts-check\n");
      out["README.md"] = out["README.md"].replace("Data this plugin stores", "Storage") + "\n**Version 0.3.0**\n";
      return out;
    });
    const found = checkPlugin(dir).map((x) => x.text).join("\n");
    for (const re of [/code\.js header says v0\.2\.0, package\.json v0\.1\.0/, /README says v0\.3\.0/, /not on code\.js line 2/, /skill-standard v0\.0\.1, a version it never had/, /no "Data this plugin stores"/]) assert.match(found, re);
  });
  ok("a manifest that does not parse, or a ui.html it names and the folder lacks, is an error", () => {
    const bad = plant("bad-json", (out) => { out["manifest.json"] = "{ nope"; return out; });
    assert.match(checkPlugin(bad).find((x) => x.level === "error").text, /does not parse/);
    const noUi = plant("no-ui-file", (out) => { out["ui.html"] = null; return out; });
    assert.match(said(checkPlugin(noUi), /^ui names/)[0].text, /not in the folder/);
  });
  ok("a plugin with no UI (no ui.html, no `ui`) is not told it lacks one", () => {
    const dir = plant("headless", (out) => { out["ui.html"] = null; return manifest(out, (m) => { delete m.ui; }); });
    assert.deepEqual(checkPlugin(dir), []);
  });
  ok("a drifted ui-base block is named; an absent one is to be inlined", () => {
    const drift = plant("drift", (out) => { out["ui.html"] = out["ui.html"].replace(/(\/\* ui-base v\d+ start[^\n]*\n)/, "$1body { color: red; }\n"); return out; });
    assert.ok(said(checkPlugin(drift), /differs from the shared base/).length);
    const none = plant("no-base", (out) => { out["ui.html"] = out["ui.html"].replace(/\/\* ui-base v\d+ start[\s\S]*?\/\* ui-base v\d+ end \*\//, ""); return out; });
    assert.ok(said(checkPlugin(none), /no ui-base block/).length);
  });

  ok("every plugin in the toolkit: found, and none with an error", () => {
    const dirs = pluginsUnder(PLUGINS);
    assert.ok(dirs.length >= 6 && !dirs.some((d) => d.endsWith("_shared")), dirs.join());
    const errors = dirs.flatMap((d) => checkPlugin(d)).filter((x) => x.level === "error");
    assert.deepEqual(errors, []);
  });
  ok("the command exits 1 on an error and names it; 0 over a clean folder", () => {
    const run = (dir) => { try { return { code: 0, out: execFileSync(process.execPath, [SCRIPT, dir], { encoding: "utf8" }) }; } catch (e) { return { code: e.status, out: e.stdout }; } };
    const bad = run(path.join(tmp, "data-puller"));
    assert.equal(bad.code, 1); assert.match(bad.out, /^error  \[3\] data-puller — fetches/m);
    const good = run(path.join(tmp, "clean"));
    assert.equal(good.code, 0); assert.match(good.out, /1 plugin\(s\): 0 error\(s\), 0 warning\(s\)/);
  });
} finally { fs.rmSync(tmp, { recursive: true, force: true }); }
console.log(`${n} passed`);
