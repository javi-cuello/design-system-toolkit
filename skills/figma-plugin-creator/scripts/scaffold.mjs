#!/usr/bin/env node
// Writes a new plugin folder from the seven templates in assets/, every placeholder filled, so two scaffolds of one
// answer are the same files (toolkit-standard §D 23). The answers are the agent's; the files follow from them.
//   node scripts/scaffold.mjs <folder> --name "Layer Counter" --purpose "Counts layers." --storage "Nothing."
// The folder's name is the manifest id; the folder must not exist. --date defaults to today, --standard to
// skill-standard.md's version.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ASSETS = path.join(HERE, "..", "assets");
export const TEMPLATES = ["manifest.json", "code.js", "ui.html", "package.json", "tsconfig.json", "CHANGELOG.md", "README.md"];

export function standardVersion() {
  const file = path.join(HERE, "..", "..", "..", "standards", "skill-standard.md");
  // outside the toolkit repo there is no standard to read
  const text = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
  const m = /\*\*Version (\d+\.\d+\.\d+)\*\*/.exec(text);
  if (!m) throw new Error("standards/skill-standard.md states no version: pass --standard");
  return m[1];
}

/** The files a scaffold writes, by name, from the answers. Refuses a placeholder left unfilled. */
export function files({ slug, name, purpose, storage, date, standard }) {
  const values = { slug, name, purpose, storage, date, standard };
  for (const [k, v] of Object.entries(values)) {
    if (!v) throw new Error(`--${k} is needed`);
    // a line break would end code.js's comment and run the rest as code
    if (/[\r\n\u2028\u2029]/.test(v)) throw new Error(`--${k} is one line`);
  }
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) throw new Error(`the folder name is the plugin's id and npm name: lower case, digits and hyphens, not "${slug}"`);
  return Object.fromEntries(TEMPLATES.map((f) => {
    const text = fs.readFileSync(path.join(ASSETS, f + ".tpl"), "utf8").replace(/\{\{(\w+)\}\}/g, (m, k) => {
      if (!(k in values)) throw new Error(`${f}.tpl has a placeholder no answer fills: ${m}`);
      // inside a JSON file a value is a JSON string's content, so a quote in a name cannot break the manifest
      if (f.endsWith(".json")) return JSON.stringify(values[k]).slice(1, -1);
      if (f.endsWith(".html")) return values[k].replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
      return values[k];
    });
    return [f, text];
  }));
}

function main(argv) {
  const [dir] = argv;
  const flag = (f) => { const i = argv.indexOf(f); const v = i > 0 ? argv[i + 1] : undefined; return v && !v.startsWith("--") ? v : undefined; };
  if (!dir || dir.startsWith("--")) { console.error('usage: scaffold.mjs <folder> --name "…" --purpose "…" --storage "…" [--date YYYY-MM-DD] [--standard x.y.z]'); process.exit(2); }
  if (fs.existsSync(dir)) { console.error(`${dir} exists: a scaffold never writes over a folder`); process.exit(1); }
  const out = files({ slug: path.basename(path.resolve(dir)), name: flag("--name"), purpose: flag("--purpose"), storage: flag("--storage"),
    date: flag("--date") || new Date().toISOString().slice(0, 10), standard: flag("--standard") || standardVersion() });
  fs.mkdirSync(dir, { recursive: true });
  for (const [f, text] of Object.entries(out)) fs.writeFileSync(path.join(dir, f), text);
  console.log(`${dir}: ${Object.keys(out).length} files. Next: the conformance check, then Figma › Plugins › Development › Import plugin from manifest.`);
}

if (process.argv[1] && fs.realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(process.argv.slice(2)); } catch (e) { console.error(e.message); process.exit(1); }
}
