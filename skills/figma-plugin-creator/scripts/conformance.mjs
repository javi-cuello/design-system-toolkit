#!/usr/bin/env node
// @runs: standards/tests/check.sh, over plugins/ (bin/check runs it), as well as a session.
// The conformance checklist's mechanical half (references/conformance-checklist.md §1–§5a, §5c), over a plugin folder
// or a folder of plugins, so no item a grep can answer is answered by hand (toolkit-standard §D 23). What stays a
// read is named in the reference: settings hygiene (§4b), the ui-base collision check's state rules, the runtime
// traps (§5b) and the retest (§6).
//   node scripts/conformance.mjs <plugin-folder | folder of plugins>...  [--json]
// Each finding is one line: `error|warn  [§] <plugin> — <what>  (<class>)`, class auto-fixable, needs-decision or
// manual (SKILL.md "Conformance check"). An error is a plugin Figma refuses to load, or one that throws or is
// blocked at runtime; a warning is conformance debt. Exits 1 on any error. standards/tests/check.sh runs it over
// plugins/.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.join(HERE, "..", "..", "..");
const BLOCK = /\/\* ui-base v\d+ start[\s\S]*?\/\* ui-base v\d+ end \*\//;
const JS_BLOCK = /\/\* figui3-js generated start[\s\S]*?\/\* figui3-js generated end \*\//;

// §2: each sync API dynamic-page makes throw. `.instances` and `.consumers` are left to the read: a plugin's own
// arrays and maps carry those names as often as Figma's nodes do, so a hit is not a finding without one.
export const BANNED = /getNodeById\(|getStyleById\(|getFileThumbnailNode\(|getLocalTextStyles\(|getLocalPaintStyles\(|getLocalEffectStyles\(|getLocalGridStyles\(|getVariableById\(|getVariableCollectionById\(|getLocalVariables\(|getLocalVariableCollections\(|\.mainComponent\b|figma\.currentPage\s*=[^=]|\.masterComponent\b/;
export const GENERATED = /\/\* [\w-]+ generated start[\s\S]*?\/\* [\w-]+ generated end \*\//g;
// `figma.root.findAll` is sync-safe once every page is loaded, which is the checklist's own fix for it.
export const ROOT_WALK = /figma\.root\.findAll\b/;
// §1: a gated API and the permission it needs; without it every call throws at runtime.
export const GATED = { teamlibrary: /figma\.teamLibrary\b/, payments: /figma\.payments\b/, currentuser: /figma\.currentUser\b/, activeusers: /figma\.activeUsers\b/ };
const NETWORK = /\bfetch\(|XMLHttpRequest|WebSocket/;

const read = (f) => (fs.existsSync(f) ? fs.readFileSync(f, "utf8") : null);
// a line's code, its // comment and any /* … */ on it dropped, so a comment that names an API is not a call
const code = (line) => line.replace(/\/\*.*?\*\//g, "").replace(/(^|[^:"'`\\])\/\/.*$/, "$1");
const hits = (text, re) => (text || "").split("\n").map((l, i) => [i + 1, code(l)]).filter(([, l]) => re.test(l)).map(([n]) => n);

/** The standards' changelog versions, from the toolkit this skill sits in (none outside it). */
function standardVersions(repo) {
  const skill = read(path.join(repo, "standards", "changelog", "skill-standard.md"));
  const toolkit = read(path.join(repo, "standards", "changelog", "toolkit-standard.md"));
  if (skill == null) return null;
  const partB = toolkit ? (toolkit.split(/^### Part B/m)[1] || "").split(/^### /m)[0] : "";
  const versions = (t) => new Set([...t.matchAll(/^- (\d+\.\d+\.\d+) \(/gm)].map((m) => m[1]));
  return { "skill-standard": versions(skill), "plugin-standard": versions(partB) };
}

export function checkPlugin(dir, opts = {}) {
  const p = path.basename(path.resolve(dir));
  const out = [];
  const add = (level, sec, text, kind) => out.push({ plugin: p, level, sec, text, kind });
  const f = (n) => path.join(dir, n);
  const codeJs = read(f("code.js")), ui = read(f("ui.html")), pkgText = read(f("package.json")), readme = read(f("README.md"));

  // ui.html is not required: a plugin with no UI drops it with the manifest's `ui` (checked below)
  for (const n of ["manifest.json", "code.js"]) if (!fs.existsSync(f(n))) add("warn", "1", "missing " + n, "manual");
  if (!fs.existsSync(f("tsconfig.json"))) add("warn", "4", "missing tsconfig.json (skill-standard §B 1)", "auto-fixable");
  if (codeJs != null) {
    const lines = codeJs.split("\n");
    if (lines[1] !== "// @ts-check") add("warn", "4", codeJs.includes("@ts-check") ? "// @ts-check present but not on code.js line 2 (skill-standard §B 1)" : "code.js has no // @ts-check (skill-standard §B 1)", "auto-fixable");
    // Figma evaluates code.js as a script: `node --check` reads CommonJS, where a top-level return is legal.
    try { new vm.Script(codeJs, { filename: f("code.js") }); }
    catch (e) { add("error", "1", "code.js does not parse as a script (a top-level return?): " + e.message, "manual"); }
  }

  // §4 metadata: package.json is the version's one source (skill-standard §B 8)
  let pv = null;
  try { pv = pkgText ? JSON.parse(pkgText).version : null; } catch { add("error", "4", "package.json does not parse", "manual"); }
  if (pkgText != null && !/^\d+\.\d+\.\d+$/.test(pv || "")) add("warn", "4", "package.json carries no SemVer version (skill-standard §B 8)", "manual");
  if (pkgText == null) add("warn", "4", "missing package.json, the version's one source (skill-standard §B 8)", "manual");
  const rv = (/\*\*Version (\d+\.\d+\.\d+)\*\*/.exec(readme || "") || [])[1];
  if (rv && rv !== pv) add("warn", "8", `README says v${rv}, package.json v${pv || "none"} (skill-standard §B 8)`, "auto-fixable");
  const head = codeJs ? codeJs.split("\n")[0] : "";
  const cv = (/v(\d+\.\d+\.\d+)/.exec(head) || [])[1];
  if (cv && cv !== pv) add("warn", "8", `code.js header says v${cv}, package.json v${pv || "none"} (skill-standard §B 8)`, "auto-fixable");
  if (codeJs != null) {
    const stamp = /· ([a-z-]*standard)(?: §B)? v(\d+\.\d+\.\d+)/.exec(head);
    const known = opts.versions === undefined ? standardVersions(REPO) : opts.versions;
    if (!stamp) add("warn", "8", "code.js audit stamp names no standard it was audited against: ` · skill-standard vX.Y.Z` (skill-standard §B 8)", "manual");
    else if (known && known[stamp[1]] && !known[stamp[1]].has(stamp[2])) add("warn", "8", `code.js audit stamp names ${stamp[1]} v${stamp[2]}, a version it never had (skill-standard §B 8)`, "manual");
    else if (known && !known[stamp[1]]) add("warn", "8", `code.js audit stamp names ${stamp[1]}, no standard the toolkit has (skill-standard §B 8)`, "manual");
  }
  if (!fs.existsSync(f("CHANGELOG.md"))) add("warn", "4", "missing CHANGELOG.md (skill-standard §B 8)", "manual");
  if (readme == null) add("warn", "4", "missing README.md", "manual");
  else if (!/Data this plugin stores/.test(readme)) add("warn", "4", "README.md has no \"Data this plugin stores\" section", "manual");

  // §1 manifest
  const mText = read(f("manifest.json"));
  if (mText == null) return out;
  let m;
  try { m = JSON.parse(mText); } catch { add("error", "1", "manifest.json does not parse; Figma cannot load it", "manual"); return out; }
  if (m.documentAccess !== "dynamic-page") add("error", "1", "documentAccess must be \"dynamic-page\"", "needs-decision");
  if ("enableProposedApi" in m) add("error", "1", "ships enableProposedApi, which must never be published", "auto-fixable");
  if (!m.name) add("error", "1", "manifest has no name", "manual");
  if (!m.id) add("warn", "1", "manifest has no id: a development plugin loses its relaunch data and pluginData without one", "needs-decision");
  if (!m.api) add("warn", "1", "manifest does not pin api", "auto-fixable");
  if (!Array.isArray(m.editorType) || !m.editorType.length) add("warn", "1", "editorType is not a list of editors", "auto-fixable");
  if (!m.main || !fs.existsSync(f(m.main))) add("error", "1", `main names ${m.main ? m.main + ", which is not in the folder" : "nothing"}`, "manual");
  if (m.ui && !fs.existsSync(f(typeof m.ui === "string" ? m.ui : ""))) add("error", "1", `ui names ${JSON.stringify(m.ui)}, which is not in the folder`, "manual");
  if (m.relaunchButtons && codeJs != null && !/setRelaunchData\(/.test(codeJs)) add("warn", "1", "relaunchButtons declared, but code.js never calls setRelaunchData", "needs-decision");
  const perms = m.permissions || [];
  for (const [perm, re] of Object.entries(GATED)) {
    const at = hits(codeJs, re);
    if (at.length && !perms.includes(perm)) add("error", "1", `calls ${re.source.replace(/\\[.b]/g, (x) => (x === "\\." ? "." : ""))} (code.js:${at[0]}) without the "${perm}" permission: every call throws at runtime (skill-standard §B 2)`, "needs-decision");
  }

  // §2 banned sync APIs: dynamic-page makes each throw. A generated block (`/* <name> generated start … generated end */`,
  // written by a sync script from code that already runs under dynamic-page elsewhere, as audit-lite's copy of the
  // components scanner runs through the bridge) is that code's, and is read where it is written, not here.
  const own = (codeJs || "").replace(GENERATED, (m) => m.replace(/[^\n]/g, ""));
  const banned = hits(own, BANNED);
  if (codeJs != null && !/loadAllPagesAsync\(/.test(own)) banned.push(...hits(own, ROOT_WALK));
  banned.sort((a, b) => a - b);
  if (banned.length) add(m.documentAccess === "dynamic-page" ? "error" : "warn", "2", `a sync API dynamic-page refuses, at code.js:${banned.join(", ")}: convert each to its …Async form${m.documentAccess === "dynamic-page" ? "" : " BEFORE documentAccess is added"}`, "manual");

  // §3 network truth
  const allowed = (m.networkAccess && m.networkAccess.allowedDomains) || null;
  // the generated FigUI3 block is a library's code, not the plugin's own requests (its fetches load media a plugin hands it)
  const uiOwn = ui == null ? null : ui.replace(GENERATED, (m) => m.replace(/[^\n]/g, ""));
  const fetches = [...hits(codeJs, NETWORK).map((n) => "code.js:" + n), ...hits(uiOwn, NETWORK).map((n) => "ui.html:" + n)];
  if (!allowed) add("warn", "3", "manifest has no networkAccess.allowedDomains", "needs-decision");
  else if (!fetches.length && !(allowed.length === 1 && allowed[0] === "none")) add("warn", "3", `nothing fetches, yet allowedDomains is ${JSON.stringify(allowed)}: it should be ["none"]`, "needs-decision");
  // a plugin that talks only to a local server in development declares it in devAllowedDomains, beside ["none"]
  else if (fetches.length && allowed.length === 1 && allowed[0] === "none" && !((m.networkAccess.devAllowedDomains || []).length)) add("error", "3", `fetches (${fetches.join(", ")}) while allowedDomains is ["none"]: every request is blocked`, "needs-decision");
  const net = (codeJs || "") + "\n" + (uiOwn || "");
  if (/unpkg\.com/.test(net) && !/cdn\.jsdelivr\.net/.test(net)) add("warn", "3", "fetches from unpkg.com with no jsdelivr fallback: unpkg refuses a plugin UI's null origin (references/network-fetch-patterns.md)", "needs-decision");
  if (/(unpkg\.com|cdn\.jsdelivr\.net)\/[^\s"'`]*@latest\b/.test(net)) add("warn", "3", "a CDN fetch targets @latest, not a pinned version", "needs-decision");

  // §5 ui-base drift, against the copy this skill carries (plugins/_shared/sync.mjs keeps it equal to the base)
  if (ui != null) {
    const base = read(opts.base || path.join(HERE, "..", "assets", "ui-base.css"));
    const block = BLOCK.exec(ui);
    if (!block) add("warn", "5", "ui.html has no ui-base block: inline it (mandatory)", "auto-fixable");
    else if (base != null && block[0] !== base.trimEnd()) add("warn", "5", "ui.html's ui-base block differs from the shared base: re-inline it (node plugins/_shared/sync.mjs in the toolkit)", "auto-fixable");
    const js = read(opts.figui3 || path.join(HERE, "..", "assets", "figui3.js"));
    const jsBlock = JS_BLOCK.exec(ui);
    if (!jsBlock) add("warn", "5", "ui.html has no FigUI3 block (a <script type=\"module\"> holding /* figui3-js generated start … end */): add it, then run node plugins/_shared/sync.mjs (mandatory)", "auto-fixable");
    else if (js != null && jsBlock[0] !== js.trimEnd()) add("warn", "5", "ui.html's FigUI3 block differs from the shared copy: re-inline it (node plugins/_shared/sync.mjs in the toolkit)", "auto-fixable");
    for (const r of restyled(ui)) add("warn", "5c", `restyles ${r}: the look is FigUI3's, composed, never restyled (skill-standard §B 4)`, "needs-decision");
    for (const c of misComposed(ui)) add("warn", "5c", `${c.what} at ui.html:${c.line}: ${c.fix} (skill-standard §B 4)`, "auto-fixable");
    for (const c of handBuilt(ui)) add("warn", "5c", `${c.what} at ui.html:${c.line} where FigUI3 has ${c.use}: build it from that element (skill-standard §B 4)`, "needs-decision");
    for (const b of bespokeControls(ui)) add("warn", "5a", `.${b.cls} sizes a control but does not set ${b.missing.join(" or ")}: the shared stylesheet supplies it by accident (references/conformance-checklist.md §5a); set it on the class`, "auto-fixable");
  }
  return out;
}

// §5c The look is FigUI3's. Restyled: a plugin rule, outside the shared block, whose selector reaches a fig-* element
// or FigUI3's switch. Hand-built: a native control in the markup where FigUI3 has an element for it; a hidden file
// input (the picker a fig-button opens) is the shell's. A link-like action is FigUI3's `fig-button variant="link"`:
// a bare <button> takes FigUI3's own button rules, whose hover outranks a class and fills it brand-blue.
const FIG_SELECTOR = /(^|[\s>+~(,])(fig-[a-z-]+)(?=$|[.:#\[),])|(\.switch)(?![\w-])/i;
// the rule's subject: its last compound, so `fig-footer .status` styles the plugin's own content, not the footer;
// what sits inside :not() or :has() is a condition on the subject, not the subject
const subject = (sel) => sel.trim().replace(/:(not|has)\([^()]*\)/gi, "").split(/\s*[>+~]\s*|\s+(?![^()]*\))/).pop();
export function restyled(ui) {
  const css = [...ui.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1]).join("\n").replace(BLOCK, "").replace(/\/\*[\s\S]*?\*\//g, "");
  const out = new Set();
  for (const [, sel] of css.matchAll(/([^{}]+)\{[^{}]*\}/g)) for (const one of sel.split(/,(?![^()]*\))/)) {
    for (const m of (" " + subject(one)).matchAll(new RegExp(FIG_SELECTOR, "gi"))) out.add((m[2] || m[3]).toLowerCase());
  }
  return [...out];
}
// Each tag's attributes are parsed, so a word inside a value (`title="hidden layers"`, `data-role="tab"`) is no attribute.
const attrsOf = (tag) => {
  const a = {};
  for (const m of tag.replace(/^<[\w-]+/, "").matchAll(/([^\s=>\/"']+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) a[m[1].toLowerCase()] = m[2] ?? m[3] ?? m[4] ?? "";
  return a;
};
const BUTTONISH = /^(button|submit|reset)$/i;
function nativeFor(name, a) {
  const type = (a.type || "").toLowerCase();
  const classes = (a.class || "").split(/\s+/);
  if (a.role === "tab") return ["a hand-made tab", "<fig-tabs>"];
  if (name === "button") return ["a <button>", "<fig-button> (variant=\"link\" for a link-like action)"];
  if (name === "select") return ["a <select>", "<fig-dropdown>"];
  if (name === "textarea") return ["a <textarea>", "<fig-input-text multiline>"];
  if (name !== "input" || "hidden" in a || type === "hidden") return null;
  if (type === "checkbox") return ["a checkbox", "<fig-checkbox> or <fig-switch>"];
  if (type === "radio") return ["a radio", "<fig-radio> or <fig-segmented-control>"];
  if (type === "file") return ["a visible file input", "<fig-input-file>, or a hidden one opened by a fig-button"];
  if (type === "range") return ["a range", "<fig-slider>"];
  if (type === "color") return ["a colour input", "<fig-input-color>"];
  if (BUTTONISH.test(type)) return ["an input button", "<fig-button>"];
  return ["a text input", "<fig-input-text>"];
}
export function handBuilt(ui) {
  // markup only: styles, scripts and comments blanked, so line numbers stay true
  const blank = (m) => m.replace(/[^\n]/g, "");
  const html = ui.replace(/<style[\s\S]*?<\/style>/gi, blank).replace(/<script[\s\S]*?<\/script>/gi, blank).replace(/<!--[\s\S]*?-->/g, blank);
  const out = [];
  for (const m of html.matchAll(/<([a-z][\w-]*)\b(?:"[^"]*"|'[^']*'|[^'">])*>/gi)) {
    const hit = nativeFor(m[1].toLowerCase(), attrsOf(m[0]));
    if (hit) out.push({ what: hit[0], use: hit[1], line: html.slice(0, m.index).split("\n").length });
  }
  return out;
}

// Mis-composed: FigUI3 elements put together the way PropsKit does not. A footer's action is a large button; a
// switch or checkbox in a field row holds no text, since the row's label names it and the control column starts a
// third of the way across, so text inside it floats away from the label.
export function misComposed(ui) {
  const blank = (m) => m.replace(/[^\n]/g, "");
  const html = ui.replace(/<style[\s\S]*?<\/style>/gi, blank).replace(/<script[\s\S]*?<\/script>/gi, blank).replace(/<!--[\s\S]*?-->/g, blank);
  const lineAt = (i) => html.slice(0, i).split("\n").length;
  const out = [];
  // a tag's name ends at a space, `>` or `/`, so `fig-footer-x` is not a footer
  for (const f of html.matchAll(/<fig-footer(?=[\s>\/])[\s\S]*?<\/fig-footer>/gi)) for (const b of f[0].matchAll(/<fig-button(?=[\s>\/])(?:"[^"]*"|'[^']*'|[^'">])*>/gi)) {
    const a = attrsOf(b[0]);
    if ("icon" in a && a.icon !== "false") continue; // an icon button keeps its own size
    if ((a.size || "").toLowerCase() !== "large") out.push({ what: "a footer fig-button without size=\"large\"", fix: "a window's action is the large button", line: lineAt(f.index + b.index) });
  }
  // text beside the box: in FigUI3's `label` attribute, or between the tags (child elements' text included)
  for (const f of html.matchAll(/<fig-field(?=[\s>\/])[\s\S]*?<\/fig-field>/gi)) for (const c of f[0].matchAll(/<(fig-switch|fig-checkbox)(?=[\s>\/])((?:"[^"]*"|'[^']*'|[^'">])*)>/gi)) {
    const rest = f[0].slice(c.index + c[0].length);
    const close = c[2].trim().endsWith("/") ? -1 : rest.search(new RegExp(`<\\/${c[1]}\\s*>|<fig-(switch|checkbox)(?=[\\s>\\/])`, "i"));
    const inner = close > 0 && /^<\//.test(rest.slice(close)) ? rest.slice(0, close) : "";
    const text = (attrsOf("<x" + c[2]).label || "").trim() || inner.replace(/<[^>]*>/g, "").replace(/&nbsp;|&#160;/gi, " ").trim();
    if (text) out.push({ what: `text inside a ${c[1].toLowerCase()} in a field row`, fix: "put it in the row's label and leave the control bare", line: lineAt(f.index + c.index) });
  }
  return out;
}

// §5a ui-base collision: a class on a <button>, <input>, <select> or <textarea> in the markup whose own rules size
// the control (padding, a border's width, font or font-size, line-height, a height or block-size) and that does not itself set `height` and
// `box-sizing: border-box`. ui-base sets both on the bare elements, so such a class renders right by accident and
// breaks when the base moves. A control that carries a ui-base class is skipped. State rules (:hover, :disabled, …)
// are the read's: they are not where the box is set. Each control is judged on the rules that reach it, a compound
// (`.big.small`) only when it carries every class in it.
// Only markup is read: a class code assigns at runtime is outside it, and so is a stylesheet ui.html links.
// a border's width moves the box; its colour, style or radius does not
const SIZES = /(^|;)\s*(padding(-[a-z]+)*|border(-(top|right|bottom|left|block|inline)(-(start|end))?)?(-width)?|font|font-size|line-height|(min-|max-)?(height|block-size))\s*:/;
const NOT_A_BOX = /^(checkbox|radio|range|color|file|hidden)$/i;
// a tag rule for a state (`input:focus`, `button[disabled]`) is not where the box is set; `input:not([type=…])` is
const STATE = /:(hover|focus|focus-visible|focus-within|active|disabled|enabled|checked|invalid|valid|placeholder-shown)\b|\[(disabled|aria-[\w-]+)/i;
export function bespokeControls(ui) {
  const html = ui.replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<!--[\s\S]*?-->/g, "");
  // A control carrying a class ui-base defines (.btn, .input, …) takes its box from that class on purpose.
  const block = BLOCK.exec(ui);
  const base = new Set(block ? [...block[0].replace(/\/\* figui3 generated start[\s\S]*?figui3 generated end \*\//, "").replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/\.([a-zA-Z][\w-]*)/g)].map((m) => m[1]) : []);
  const controls = []; // each control's tag and own class list
  for (const [, tag, attrs] of html.matchAll(/<(button|input|select|textarea)\b([^>]*)>/gi)) {
    // `data-type=` and `data-class=` are not the attribute
    const type = (/(?<![\w-])type\s*=\s*["']?([\w-]+)/i.exec(attrs) || [])[1];
    if (tag.toLowerCase() === "input" && type && NOT_A_BOX.test(type)) continue;
    const list = ((/(?<![\w-])class\s*=\s*(?:["']([^"']*)["']|([\w-]+))/i.exec(attrs) || []).slice(1).find((x) => x != null) || "").split(/\s+/).filter(Boolean);
    if (!list.length || list.some((c) => base.has(c))) continue;
    // no type is the element's default: an input is a text input, a button submits
    controls.push({ tag: tag.toLowerCase(), type: (type || { input: "text", button: "submit" }[tag.toLowerCase()] || "").toLowerCase(), list });
  }
  const css = [...ui.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1]).join("\n").replace(BLOCK, "").replace(/\/\*[\s\S]*?\*\//g, "");
  // The plugin's own rules on the tag itself (`#toolbar button`, `input[type=text]`) own the box as much as the class
  // does. Which elements such a rule reaches is not worked out: one scoped rule on `button` counts for every button.
  // A rule with a state or an attribute on the class (`.tab:hover`, `.tab[aria-selected]`) is a state, not the box.
  const rules = [], tagRules = [];
  for (const [, sel, raw] of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const body = raw.toLowerCase(); // property names are case-insensitive
    for (const one of sel.split(/,(?![^()]*\))/)) { // a comma inside :not(.a, .b) does not split the selector
      const NOT = /:not\((?:[^()]|\([^()]*\))*\)/g;
      const last = one.trim().replace(NOT, (m) => m.replace(/\s+/g, "")).split(/[\s>+~]+/).pop() || "";
      // what is inside :not() is the rule's exception, not its condition (`button:not(:disabled)`, `button:not(.a, .b)`)
      const own = last.replace(NOT, "");
      const tag = (/^[a-z]+(?=$|#|\[|:not\()/i.exec(last) || [])[0];
      if (tag && !own.includes(".")) {
        if (STATE.test(own)) continue;
        // a tag rule for one input type (`input[type=checkbox]`) reaches only inputs of that type
        const only = (/\[type\s*=\s*["']?([\w-]+)/i.exec(own) || [])[1]; // `input:not([type=checkbox])` is every other input
        tagRules.push({ tag: tag.toLowerCase(), type: only ? only.toLowerCase() : null, body }); continue;
      }
      if (/[:[]/.test(own)) continue;
      const compound = [...own.matchAll(/\.([\w-]+)/g)].map((m) => m[1]);
      if (compound.length) rules.push({ compound, body });
    }
  }
  // Each control is judged on the rules that reach it: a compound (`.big.small`) only when it carries every class in it.
  const out = [], said = new Set();
  for (const { tag, type, list } of controls) {
    const own = rules.filter((r) => r.compound.every((c) => list.includes(c))).map((r) => ";" + r.body).join("");
    if (!SIZES.test(own)) continue;
    const body = own + tagRules.filter((r) => r.tag === tag && (!r.type || r.type === type)).map((r) => ";" + r.body).join("");
    const missing = [];
    if (!/(^|;)\s*height\s*:/.test(body)) missing.push("height");
    if (!/(^|;)\s*box-sizing\s*:\s*border-box/.test(body)) missing.push("box-sizing: border-box");
    const cls = list.join(".");
    if (missing.length && !said.has(cls)) { said.add(cls); out.push({ cls, missing }); }
  }
  return out;
}

/** The plugin folders under a path: itself when it holds a manifest, else each child that does (not _shared). */
export function pluginsUnder(dir) {
  if (fs.existsSync(path.join(dir, "manifest.json")) || fs.existsSync(path.join(dir, "code.js"))) return [dir];
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith("_") && !d.name.startsWith(".") && d.name !== "node_modules")
    .map((d) => path.join(dir, d.name)).sort();
}

export const line = (x) => `${x.level === "error" ? "error" : "warn "}  [${x.sec}] ${x.plugin} — ${x.text}  (${x.kind})`;

if (process.argv[1] && (() => { try { return fs.realpathSync(process.argv[1]); } catch { return null; } })() === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  if (!args.length) { console.error("usage: node scripts/conformance.mjs <plugin-folder | folder of plugins>... [--json]"); process.exit(2); }
  const found = [];
  let plugins = 0;
  for (const a of args) {
    if (!fs.existsSync(a)) { console.error(`${a}: no such folder`); process.exit(2); }
    for (const d of pluginsUnder(a)) { plugins++; found.push(...checkPlugin(d)); }
  }
  if (!plugins) { console.error(`no plugin folder under ${args.join(", ")}`); process.exit(2); }
  if (process.argv.includes("--json")) console.log(JSON.stringify(found, null, 2));
  else {
    for (const x of found) console.log(line(x));
    const e = found.filter((x) => x.level === "error").length;
    console.log(`${plugins} plugin(s): ${e} error(s), ${found.length - e} warning(s)`);
  }
  process.exit(found.some((x) => x.level === "error") ? 1 : 0);
}
