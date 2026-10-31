#!/usr/bin/env node
// Keeps the standards true to themselves and the toolkit true to the standards,
// and heals what it safely can (toolkit-standard §C).
//
//   node tools/toolkit-check/check-standards.mjs          report; writes nothing
//   node tools/toolkit-check/check-standards.mjs --fix    also heal: remove project
//                                                   settings that restate a house
//                                                   default, and rewrite citations
//                                                   a history file's map retires
//
// It refuses, naming the file:
//   rules     a standard it has no entry for; a rule with no enforcement marker
//             (§C clause D); a *Checked:* that names no check in this repo, a path
//             that does not exist, or a pair whose file no longer holds its string;
//   history   a standard with no history file, a version with no history line, a
//             history line holding more than reference, history out of order (§C A);
//   citations a citation of a rule or part its standard does not have, or of a
//             retired form (§C clause C); a standard citing a heading its file
//             does not have (§C clause B);
//   settings  an unregistered or unread key, a project value restating the house
//             default, and a house value or marker hard-coded in a tool (§C clause F).
// A heal touches only live text (never history, a fenced example or a walk
// record) and only a file with no uncommitted changes, which may be another
// session's work. Exit 1 on anything left.
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, dirname, basename, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";

const REPO = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
// STANDARDS_ROOT points the check at another tree, which is how its tests run it.
const ROOT = process.env.STANDARDS_ROOT || REPO;
const FIX = process.argv.includes("--fix");
const { fenced, homes } = createRequire(import.meta.url)(join(REPO, "tools/snapshot/projects.cjs"));
const problems = [], healed = [], skipped = [];
const read = (rel) => readFileSync(join(ROOT, rel), "utf8");
const has = (rel) => existsSync(join(ROOT, rel));
const git = (args) => execFileSync("git", args, { cwd: ROOT, encoding: "utf8" });
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const either = (w) => "[" + w[0].toLowerCase() + w[0].toUpperCase() + "]" + esc(w.slice(1));
const lineOf = (text, i) => text.slice(0, i).split("\n").length;
// Fenced blocks are examples; blanked line for line so reported line numbers stay true.
const dirty = new Set(git(["status", "--porcelain"]).split("\n").filter(Boolean).map((l) => l.slice(3).replace(/^.* -> /, "")));
// A context document may sit in its project's own repo: asked of that repo.
const isDirty = (file) => {
  const rel = relative(ROOT, file);
  if (!rel.startsWith("..")) return dirty.has(rel);
  try { return execFileSync("git", ["-C", dirname(file), "status", "--porcelain", "--", file], { encoding: "utf8" }).trim() !== ""; } catch { return true; }
};
const TOP = new Set(readdirSync(ROOT));

// ─── the standards ───────────────────────────────────────────────────────────
// The handle table and the rule reader are tools/toolkit-check/rules.mjs's, shared with
// the edit hook and the closing pass. A standard with no entry is refused, never skipped.
import { STANDARDS, rulesOf, unfence } from "./rules.mjs";
import { code, stripComments } from "./strip.mjs";
const MARKER = /\*Checked:\*|\*Reviewed:\*/;
const standards = readdirSync(join(ROOT, "standards")).filter((f) => /-standard\.md$/.test(f)); // a standard is <name>-standard.md; the README is the folder's guide
const handles = {}, retiredHandles = {};
for (const f of standards) {
  const name = basename(f, ".md");
  if (!STANDARDS[name]) { problems.push(`standards/${f}: no entry in tools/toolkit-check/rules.mjs's STANDARDS; add one so its rules are read`); continue; }
  const md = read(`standards/${f}`), body = unfence(md);
  const rules = rulesOf(name, md);
  handles[name] = new Set(rules.map((r) => r.handle));
  // A tombstone keeps its handle so a citation of it is refused, and needs no marker.
  // "Retired" straight after the handle, never a heading that merely mentions it.
  const tombs = rules.filter((r) => /^(?:### \S+ [—·] |\d+\. |\*\*\d+ · )\**Retired(?: \d{4}-| —)/.test(r.title));
  retiredHandles[name] = new Set(tombs.map((r) => r.handle));
  if (rules.length !== handles[name].size) problems.push(`standards/${f}: two rules share a handle`);
  rules.forEach((r) => {
    const m = [null, r.handle];
    // A marker quoted in inline code is prose about markers, not this rule's own.
    const block = r.block.replace(/`[^`\n]*`/g, (q) => (/\*(Checked|Reviewed|No check)/.test(q) ? "" : q));
    const at = `${name} ${m[1]}`;
    if (retiredHandles[name].has(m[1])) return;
    // A rule with no check is a rule nobody sees broken: there is no debt marker to hide behind (§C clause D).
    if (/no check yet/i.test(block)) problems.push(`${at}: says it has no check yet, in whole or in part; a rule ships with its check (*Checked:*) or the file that prompts its reading (*Reviewed:*), and a half with neither is a second rule nobody sees`);
    if (!MARKER.test(block)) { problems.push(`${at}: has no enforcement marker (*Checked:* or *Reviewed:*)`); return; }
    if (!/\*Why:\*/.test(block.replace(/`[^`\n]*`/g, ""))) problems.push(`${at}: has no *Why:* (§C clause C)`);
    // A *Checked:* runs to the end of its paragraph or the next marker.
    // A quoted string is one unit, so a marker quoted inside it ends nothing.
    // *Reviewed:* takes the same grammar: its pairs name the file that prompts the reading,
    // so a moment nothing surfaces is refused like a check that does not exist.
    for (const c of block.matchAll(/\*(?:Checked|Reviewed):\*((?:(?<=[\s(])"[^"\n]*"|[\s\S])*?)(?=\n\s*\n|\*[A-Z][a-z]+(?: [a-z]+)*[:.]\*|$)/g)) {
      // A grammar, not a reading of prose: the marker opens with pairs, `path` "string" or
      // `path` `symbol`, joined by ";". Only those are checks; the first thing that is not a
      // pair ends them, and what follows is prose (§C clause D). Parsing prose lists lost a
      // string in every shape tried (review rounds 4 to 7).
      const PAIR = /^\s*`([\w.-]+\/[\w./-]*[\w-]|[\w-]+\.\w+)`\s+(?:"([^"\n]+)"|`([^`\s/]+)`)/;
      let rest = c[1], pairs = 0;
      for (let m; (m = rest.match(PAIR)); ) {
        const [, rel, str, sym] = m, lit = str || sym;
        pairs++;
        if (!TOP.has(rel.split("/")[0]) && rel.includes("/")) problems.push(`${at}: *Checked:* names ${rel}, which is not in this repo`);
        else if (!has(rel)) problems.push(`${at}: *Checked:* names ${rel}, which does not exist`);
        else if (statSync(join(ROOT, rel)).isDirectory()) problems.push(`${at}: *Checked:* names the folder ${rel}; name the file that checks it, with a string from it`);
        // A skill's script runs when a session pastes it, which checks nothing on its own. A *Checked:*
        // into a skill names a test bin/check runs, or a file whose header names what runs it (`@runs:`).
        else if (/^\*Checked:\*/.test(c[0]) && /^skills\//.test(rel) && !/\/tests\/test-[^/]+$/.test(rel) && !runsOnItsOwn(rel))
          problems.push(`${at}: *Checked:* names ${rel}, a skill's script nothing runs on its own; cite the test that asserts it, give the file an \`@runs:\` header naming the file that loads it, or mark the rule *Reviewed:*`);
        else if (!executable(rel).includes(lit)) problems.push(`${at}: ${rel} holds "${lit}" in no code (a comment does not count)`);
        rest = rest.slice(m[0].length);
        // A word straight after the closing quote means the name held a quote and was cut short there.
        // …or a tail that ends at a stray quote before the next ";" or the line's end ("a " b").
        if (/^\w/.test(rest) || /^\s+[^;\n"]*"\s*(;|\n|$)/.test(rest)) problems.push(`${at}: the string "${lit}" from ${rel} is followed by "${rest.split(/\s/)[0]}"; a name holding a double quote is cut at it, so quote a part without one`);
        const sep = rest.match(/^\s*;/);
        if (!sep) break;
        rest = rest.slice(sep[0].length);
        // A ";" promises another pair; without this, a path with no string, or a string broken across
        // a line, ended the checks in silence and passed.
        if (!PAIR.test(rest)) { problems.push(`${at}: after ";" comes "${rest.trim().slice(0, 40)}", not a \`path\` "string" pair; name the string, keep it on one line, or end the pairs before the prose`); break; }
      }
      if (!pairs) problems.push(`${at}: ${c[0].slice(0, 11)} opens with no pair; start it with \`path\` "string" pairs joined by ";" — for *Reviewed:*, the file that prompts the reading`);
    }
  });
  const v = (md.match(/^\*\*Version (\d+\.\d+\.\d+)\*\*/m) || [])[1];
  if (!v) problems.push(`standards/${f}: no **Version X.Y.Z** line`);
  if (/^## Changelog/m.test(body)) problems.push(`standards/${f}: carries a ## Changelog; history lives in standards/changelog/${f}`);
  if (!has(`standards/changelog/${f}`)) problems.push(`standards/${f}: no history file at standards/changelog/${f}`);
  else if (v && !read(`standards/changelog/${f}`).includes(`- ${v} (`)) problems.push(`standards/changelog/${f}: no line for v${v}`);
}

// ─── history (§C clause A) ───────────────────────────────────────────────────
// A standard's history and a skill's: one line of reference per version, newest first.
const histories = [
  ...(has("standards/changelog") ? readdirSync(join(ROOT, "standards/changelog")).map((f) => `standards/changelog/${f}`) : []),
  ...(has("skills") ? readdirSync(join(ROOT, "skills")).map((s) => `skills/${s}/CHANGELOG.md`).filter(has) : []),
];
const semver = (s) => s.split(".").map(Number);
const newer = (a, b) => { const x = semver(a), y = semver(b); for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] > y[i]; return false; };
for (const h of histories) {
  const lines = read(h).split("\n");
  if (h.startsWith("standards/changelog/") && !standards.includes(basename(h)) && !lines.some((l) => /^Retired /.test(l))) problems.push(`${h}: names no standard and says no "Retired"`);
  let prev = null;
  lines.forEach((l, i) => {
    if (/^#{1,3} /.test(l)) { prev = null; return; }
    if (/^- /.test(l) && l.length > 300) problems.push(`${h}:${i + 1}: a history entry is one line of reference, under 300 characters; its reason belongs in the rule or the skill`);
    // A suffixed number (`1.60.0+1`) counts against its X.Y.Z, so a relabelled duplicate is still out of order.
    const m = l.match(/^- (\d+\.\d+\.\d+)[ (+]/);
    if (m) { if (prev && !newer(prev, m[1])) problems.push(`${h}:${i + 1}: ${m[1]} sits below ${prev}; history runs newest first`); prev = m[1]; }
  });
}

// ─── citations (§C clause C) ─────────────────────────────────────────────────
// Retired handles come from every history file's `| Was | Now |` table, the map that
// lets --fix rewrite a stale citation, so a future move heals itself.
const moves = [];
for (const h of histories.filter((h) => h.startsWith("standards/")))
  for (const m of read(h).matchAll(/^\| ([^|]+?) \| ([^|]+?) \|$/gm)) if (!/^(Was|-+)$/.test(m[1])) moves.push([m[1], m[2]]);
const exact = moves.filter(([w]) => /\d$/.test(w)), prefix = moves.filter(([w]) => !/\d$/.test(w));
// Retired standards are history files with no living standard; their names in any
// spelling, and every rule citation in their old form, are refused.
const retired = histories.filter((h) => h.startsWith("standards/changelog/") && !standards.includes(basename(h))).map((h) => basename(h, ".md"));
// A row whose Was has no space before its number has no stem to refuse; it is skipped, not a crash.
const stems = [...new Set(exact.map(([w]) => (w.match(/^(.*\S) \d+$/) || [])[1]).filter(Boolean))];
const LEGACY = stems.length ? new RegExp(stems.map((st) => "\\b" + either(st) + "s? \\*{0,2}\\d").join("|"), "g") : null;
// A retired standard's name is refused in a fenced block too: a file tree in a README is not an example of it.
const RETIRED = retired.length ? new RegExp(retired.map((n) => "\\b" + either(n.replace(/s$/, "")).split("-").join("[- ]") + "s?\\b(?!-)").join("|"), "g") : null;
const names = Object.keys(STANDARDS);
const numeric = names.filter((n) => !STANDARDS[n].parts);
const parted = names.filter((n) => STANDARDS[n].parts);
const titled = (n) => n.split("-").map((w, i) => (i ? "[ -]" : "") + either(w)).join("");
// `figma-standard rule 9`, `[figma-standard](…) rule 9`, `Figma standard rule 9`, `code-standard 59`, and lists.
const CITE_NUM = new RegExp("\\b(" + numeric.map(titled).join("|") + ")(?:\\.md)?(?:'s)?(?:\\]\\([^)]*\\))? (?:rules? )?(\\d+)(?!\\d|\\.\\d)((?:(?:, |,? and |,? or |[–-])\\d{1,3}(?!\\d|\\.\\d|-)(?! [a-z]))*)", "g");
// `toolkit-standard §D 13`, `skill-standard §A clause G`, and the bare `§D 13` / `§A clause G`.
const CITE_PART = new RegExp("(?:\\b(" + parted.map(titled).join("|") + ")(?:'s)? )?§([A-Z])(?: clause)? ?([A-Z]\\b|\\d+)", "g");
const partOwner = Object.fromEntries(parted.flatMap((n) => Object.keys(STANDARDS[n].parts).map((p) => [p, n])));
const canon = (raw) => names.find((n) => raw.toLowerCase().replace(" ", "-") === n);
const files = git(["ls-files"]).split("\n").filter((f) => f && has(f)
  && /\.(md|mjs|cjs|js|sh|py|astro|html|json|ya?ml)$/.test(f)
  // History is reference; a test quotes wrong forms on purpose; an audit record is tool output, rewritten on its next run.
  && !/(^|\/)CHANGELOG\.md$|^standards\/changelog\/|(^|\/)test-[^/]+$|node_modules|\/snapshot\/|\/dist\/|package(-lock)?\.json$/.test(f));
// The live part of a text: history sections, fenced examples and walk records are blanked line for line.
const live = (f, text, fences = true) => {
  let t = fences && /\.md$/.test(f) ? unfence(text) : text;
  const c = t.search(/^## Changelog/m);
  if (c >= 0) t = t.slice(0, c) + t.slice(c).replace(/[^\n]/g, "");
  return t.replace(/^\*\*(?:Walked|Reviewed against)[^\n]*$/gm, (m) => m.replace(/[^\n]/g, ""));
};
for (const f of files) {
  let text = read(f);
  if (FIX && exact.length + prefix.length) {
    const lt = live(f, text).split("\n"), orig = text.split("\n");
    const out = orig.map((line, i) => {
      if (lt[i] !== line) return line; // a line blanked as history or example is left as written
      let l = line;
      for (const [was, now] of exact) { const [, st, num] = was.match(/^(.*?)(\d+)$/); l = l.replace(new RegExp("\\b" + either(st) + num + "\\b(?!\\d|\\.\\d)", "g"), now); }
      for (const [was, now] of prefix) l = l.replace(new RegExp("\\b" + esc(was) + "\\b", "g"), now);
      return l;
    }).join("\n");
    if (out !== text) {
      if (dirty.has(f)) skipped.push(`${f}: has uncommitted changes, so its moved citations wait for --fix after it is committed`);
      else { writeFileSync(join(ROOT, f), out); healed.push(`${f}: rewrote citations through the history maps`); text = out; }
    }
  }
  const t = live(f, text);
  for (const m of t.matchAll(CITE_NUM)) {
    const std = canon(m[1]);
    if (!handles[std]) continue;
    const nums = [m[2], ...(m[3] || "").split(/, |,? and |,? or /).filter(Boolean)].flatMap((x) => {
      const r = x.match(/^(\d+)[–-](\d+)$/); return r ? Array.from({ length: Math.max(0, r[2] - r[1] + 1) }, (_, k) => String(+r[1] + k)) : [x.replace(/\D/g, "")];
    });
    for (const n of nums) if (!handles[std].has(n)) problems.push(`${f}:${lineOf(t, m.index)}: cites ${std} rule ${n}, a rule its standard does not have`);
      else if (retiredHandles[std].has(n)) problems.push(`${f}:${lineOf(t, m.index)}: cites ${std} rule ${n}, which is retired; cite its successor`);
  }
  for (const m of t.matchAll(CITE_PART)) {
    const std = m[1] ? canon(m[1]) : partOwner[m[2]];
    if (!std || !handles[std]) continue;
    const kind = (STANDARDS[std].parts || {})[m[2]];
    const ok = kind && (kind === "letter" ? /^[A-Z]$/.test(m[3]) : /^\d+$/.test(m[3])) && handles[std].has(m[3]);
    if (!ok) problems.push(`${f}:${lineOf(t, m.index)}: cites ${std} §${m[2]} ${m[3]}, ${kind ? "a rule that part does not have" : "a part it does not have"}`);
    else if (retiredHandles[std].has(m[3])) problems.push(`${f}:${lineOf(t, m.index)}: cites ${std} §${m[2]} ${m[3]}, which is retired; cite its successor`);
  }
  // A standard citing a section of another file by its heading, `path.md` (*Heading*) or `path.md`'s
  // *Heading*, names a heading that file has: a moved or renamed section otherwise leaves a pointer
  // to nothing, which no rule handle shows. Only in a standard, whose paths are from the repo root.
  if (/^standards\/[^/]+\.md$/.test(f)) for (const m of t.matchAll(/`([\w./-]+\.md)`(?:'s)? \(?\*([A-Z][^*\n]*[^*\n:.])\*/g)) { // a marker (*Checked:*, *Why:*) is not a heading
    const heads = has(m[1]) ? read(m[1]).split("\n").filter((l) => /^#{1,6} /.test(l)).map((l) => l.replace(/^#+ /, "").trim()) : null;
    if (!heads) problems.push(`${f}:${lineOf(t, m.index)}: cites the section "${m[2]}" of ${m[1]}, a file that does not exist`);
    else if (!heads.includes(m[2].trim())) problems.push(`${f}:${lineOf(t, m.index)}: cites the section "${m[2]}" of ${m[1]}, a heading that file does not have`);
  }
  // Inside a numbered standard, a bare "rule N" is that standard's own, and resolves against it.
  const own = f.startsWith("standards/") && !f.includes("/", 10) ? basename(f, ".md") : null;
  if (own && numeric.includes(own) && handles[own]) {
    const named = [...t.matchAll(CITE_NUM)].map((m) => [m.index, m.index + m[0].length]);
    for (const m of t.matchAll(/(^|[^-\w§.])[Rr]ules? (\d+)\b(?!\.\d)/g)) {
      const at = m.index + m[1].length;
      if (named.some(([a, z]) => at >= a && at < z)) continue;
      if (!handles[own].has(m[2])) problems.push(`${f}:${lineOf(t, at)}: cites rule ${m[2]}, which ${own} does not have`);
    }
  }
  // Outside a standard, a rule number with no standard named could mean any of them (§C clause C).
  if (!f.startsWith("standards/")) {
    const named = [...t.matchAll(CITE_NUM)].map((m) => [m.index, m.index + m[0].length]);
    for (const m of t.matchAll(/(^|[^-\w§.])([Rr]ules? \d+)\b/g)) {
      const at = m.index + m[1].length;
      if (named.some(([a, z]) => at >= a && at < z)) continue;
      problems.push(`${f}:${lineOf(t, at)}: "${m[2]}" names no standard; write <standard> rule N`);
    }
  }
  if (RETIRED) { const tf = live(f, text, false); for (const m of tf.matchAll(RETIRED))
    problems.push(`${f}:${lineOf(tf, m.index)}: names a retired standard ("${m[0]}"); name the standard that owns the rule now`); }
  if (LEGACY) for (const m of t.matchAll(LEGACY)) {
    const near = t.slice(m.index).match(/^[^\n]*?\d+/);
    const mapped = near && exact.some(([w]) => new RegExp("^" + either(w) + "$").test(near[0]));
    problems.push(`${f}:${lineOf(t, m.index)}: names a retired form ("${t.slice(m.index, m.index + 40).split("\n")[0].trim()}…")${mapped ? " (run with --fix)" : "; cite the standard that owns the rule now"}`);
  }
}

// ─── knowledge (toolkit-standard §D 21) ─────────────────────────────────────────
// A page links only public URLs: a path on someone's machine is a dead link for
// everyone else, and a private folder is not the toolkit's to publish.
// Untracked pages too: a page written and not yet added is still a page someone will read.
const knowledgePages = [...new Set(files.concat(git(["ls-files", "--others", "--exclude-standard", "knowledge"]).split("\n")).filter((x) => x && x.startsWith("knowledge/") && x.endsWith(".md")))];
for (const f of knowledgePages) {
  const hit = read(f).match(/(?:\/Users\/|\/home\/|~\/|file:\/\/)[^\s)`]*/);
  if (hit) problems.push(`${f}: a knowledge page links a path outside the repo (${hit[0]}); cite the public source instead`);
  // A design pattern ships with its code counterpart: every section of a pattern page carries a Build part.
  if (/^knowledge\/ui\/patterns\//.test(f)) for (const sec of read(f).split(/^## /m).slice(1))
    if (!/\*\*Build[.:]?\*\*|\*\*Build:?\*\*/.test(sec)) problems.push(`${f}: pattern "${sec.split("\n")[0].trim()}" has no Build part (its code counterpart, toolkit-standard §D 21)`);
  // Its relative links resolve: two profile pages pointed one level above the repo for a day.
  // And their anchors name a heading the page has (GitHub's slug: lower case, punctuation dropped, spaces to hyphens).
  const slugs = (md) => new Set([...md.matchAll(/^#{1,6} +(.+)$/gm)].map(([, h]) => h.trim().toLowerCase().replace(/[^\p{L}\p{N}_\- ]/gu, "").replace(/ /g, "-")));
  for (const [, target, anchor] of read(f).matchAll(/\]\((?!https?:|mailto:)([^)#\s]*)(?:#([^)\s]+))?\)/g)) {
    const to = target ? join(dirname(f), target) : f;
    if (to.startsWith("..") || !existsSync(join(ROOT, to))) { problems.push(`${f}: a knowledge page links ${target}, which does not resolve in the repo`); continue; }
    if (anchor && to.endsWith(".md") && !slugs(read(to)).has(decodeURIComponent(anchor))) problems.push(`${f}: a knowledge page links ${target}#${anchor}, a heading ${to} does not have`);
  }
}

// ─── settings (§C clause F) ──────────────────────────────────────────────────
const settingsPath = "standards/audit-settings.json";
// The sections a library's settings group its keys into (projects.cjs SECTIONS), plus
// `interface`, a project's own group read by tools/ui-check/check.mjs rather than the merge;
// and the derived keys the merge writes into the flat object tools read.
const SECTIONS = ["variants", "naming", "pages", "tokens", "components", "interface"];
let defaults = {}, keys = { project: {}, library: {}, optionOrder: {}, derived: {} };
for (const sec of SECTIONS) keys[sec] = {};
try { const s = JSON.parse(read(settingsPath)); defaults = s["audit-defaults"] || {}; keys = Object.assign(keys, s["audit-keys"] || {}); }
catch (e) { problems.push(`${settingsPath}: ${e.message}`); }
// The naming preferences are their own standards file, not an audit setting; checked here as one more section.
const namingPath = "standards/naming-preferences.json";
try { const n = JSON.parse(read(namingPath)); if (defaults.naming) problems.push(`${settingsPath}: a naming section; naming preferences live in ${namingPath}`); defaults.naming = n.preferences || {}; keys.naming = n.keys || {}; }
catch (e) { problems.push(`${namingPath}: ${e.message}`); }
// Every key a tool may read from the flat object: each section's, and the derived ones.
const flatKeys = Object.assign({}, ...SECTIONS.map((sec) => keys[sec] || {}), keys.derived || {});
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
// Two-space JSON with short arrays of plain values on one line, the block's own style.
export const format = (v) => JSON.stringify(v, null, 2).replace(/\[\s*\n([^\[\]{}]*?)\n\s*\]/g, (m, body) => { const items = body.split(/,\s*\n/).map((x) => x.trim()); return items.every((x) => x.length <= 60) ? "[" + items.join(", ") + "]" : m; });
for (const sec of SECTIONS) for (const k of Object.keys(defaults[sec] || {})) if (!(k in (keys[sec] || {}))) problems.push(`${settingsPath}: audit-defaults ${sec}.${k} is not in audit-keys`);
for (const k of Object.keys(defaults)) if (!["optionOrder", "codeProps", "frameworks", ...SECTIONS].includes(k)) problems.push(`${settingsPath}: audit-defaults ${k} is not a section the merge reads`);
for (const k of Object.keys(defaults.codeProps || {})) if (!(k in (keys.codeProps || {}))) problems.push(`${settingsPath}: audit-defaults codeProps.${k} is not in audit-keys`);
// a framework's profile (projects.cjs auditContext gives it to the library whose `framework` names it): each field registered
for (const [fw, profile] of Object.entries(defaults.frameworks || {})) for (const k of Object.keys(profile || {})) if (!(k in (keys.frameworks || {}))) problems.push(`${settingsPath}: audit-defaults frameworks.${fw}.${k} is not in audit-keys`);

// Every project the contract finds; a test's fixture root keeps its own projects/.
const projectDocs = ROOT === REPO
  ? homes().map((h) => ({ label: h.name, doc: join(h.home, "design-system-context.md") }))
  : (has("projects") ? readdirSync(join(ROOT, "projects")) : []).map((label) => ({ label, doc: join(ROOT, "projects", label, "design-system-context.md") })); // projects-path: a test fixture tree
for (const { label, doc } of projectDocs) {
  if (!existsSync(doc)) continue;
  const md = readFileSync(doc, "utf8");
  if (/```json\S*\s+audit-settings/.test(md) && !fenced(md, "audit-settings")) { problems.push(`${doc}: an audit-settings fence the parser cannot read`); continue; }
  const raw = fenced(md, "audit-settings");
  if (!raw) continue;
  let settings;
  try { settings = JSON.parse(raw); } catch (e) { problems.push(`${doc}: audit-settings is not valid JSON: ${e.message}`); continue; }
  for (const k of Object.keys(settings)) if (!(k in keys.project)) problems.push(`${label}: top-level key ${k} is not in audit-keys (project)`);
  // A value that differs from a house default overrides the rule its key serves (the
  // key's description names it), so the document declares it: derived, never remembered.
  const declared = new Set([...md.matchAll(/\*\*Overrides:\*\* +([a-z]+-standard rule \d+)/g)].map((m) => m[1]));
  const owed = new Map();
  const ruleOf = (desc) => [...String(desc || "").matchAll(/([a-z]+-standard rule \d+)/g)].map((m) => m[1]);
  // A routed component library with no settings entry is audited by nobody's rules.
  const removed = [], empty = [];
  for (const [fk, lib] of Object.entries(settings.libraries || {})) {
    for (const sec of SECTIONS) for (const [k, v] of Object.entries(lib[sec] || {})) if (defaults[sec] && k in defaults[sec] && !same(v, defaults[sec][k]))
      for (const r of ruleOf((keys[sec] || {})[k])) if (!declared.has(r)) owed.set(r, (owed.get(r) || []).concat(`${sec}.${k}`));
    for (const [k, v] of Object.entries(lib.optionOrder || {})) if (defaults.optionOrder && k in defaults.optionOrder && !same(v, defaults.optionOrder[k]))
      for (const r of ruleOf(keys.optionOrder[k] || keys.optionOrder["<axis name>"])) if (!declared.has(r)) owed.set(r, (owed.get(r) || []).concat(`optionOrder.${k}`));
    const at = label + " " + (lib.name || fk);
    for (const k of Object.keys(lib)) if (!(k in keys.library)) problems.push(`${at}: library key ${k} is not in audit-keys`);
    for (const sec of SECTIONS) for (const k of Object.keys(lib[sec] || {})) {
      if (!(k in (keys[sec] || {}))) problems.push(`${at}: ${sec}.${k} is not in audit-keys`);
      else if (defaults[sec] && k in defaults[sec] && same(lib[sec][k], defaults[sec][k])) removed.push([fk, sec, k, `${at}: ${sec}.${k} restates the house default`]);
    }
    for (const k of Object.keys(lib.optionOrder || {})) {
      const house = (defaults.optionOrder || {})[k];
      if (house && same(lib.optionOrder[k], house)) removed.push([fk, "optionOrder", k, `${at}: optionOrder.${k} restates the house default`]);
    }
    if (lib.optionOrder && !Object.keys(lib.optionOrder).length) empty.push(`${at}: an empty optionOrder`);
  }
  // A project's naming preferences are their own block, one for the project, never a library's section.
  for (const [fk, lib] of Object.entries(settings.libraries || {})) if (lib.naming) problems.push(`${label} ${lib.name || fk}: a naming section in audit-settings; a project's naming preferences go in its naming-preferences block`);
  const rawNaming = fenced(md, "naming-preferences");
  if (rawNaming) {
    let naming = {};
    try { naming = JSON.parse(rawNaming); } catch (e) { problems.push(`${doc}: naming-preferences is not valid JSON: ${e.message}`); }
    for (const [k, v] of Object.entries(naming)) {
      if (!(k in keys.naming)) problems.push(`${label}: naming-preferences ${k} is not in ${namingPath}`);
      else if (same(v, defaults.naming[k])) problems.push(`${label}: naming-preferences ${k} restates the house preference`);
      else for (const r of ruleOf(keys.naming[k])) if (!declared.has(r)) owed.set(r, (owed.get(r) || []).concat(`naming-preferences ${k}`));
    }
  }
  // A project's own interface limits (design-standard) sit at the top level, not under a library.
  for (const [k, v] of Object.entries(settings.interface || {})) {
    if (!(k in (keys.interface || {}))) problems.push(`${label}: interface.${k} is not in audit-keys`);
    else if (same(v, (defaults.interface || {})[k])) problems.push(`${label}: interface.${k} restates the house default`);
    else for (const r of ruleOf(keys.interface[k])) if (!declared.has(r)) owed.set(r, (owed.get(r) || []).concat(`interface.${k}`));
  }
  for (const [r, ks] of owed) problems.push(`${doc}: ${[...new Set(ks)].join(", ")} differ${ks.length > 1 ? "" : "s"} from the house default, so the document declares "**Overrides:** ${r} — <why>"`);
  if (!removed.length && !empty.length) continue;
  if (!FIX) { for (const r of removed) problems.push(r[3] + " (run with --fix)"); for (const e of empty) problems.push(e + " (run with --fix)"); continue; }
  if (isDirty(doc)) { skipped.push(`${doc}: has uncommitted changes, so its restated settings wait for --fix after it is committed`); continue; }
  for (const [fk, section, k] of removed) delete settings.libraries[fk][section][k];
  for (const lib of Object.values(settings.libraries || {})) for (const sec of ["optionOrder", ...SECTIONS]) if (lib[sec] && !Object.keys(lib[sec]).length) delete lib[sec];
  // Remove only the healed lines, so the block keeps its author's layout; reformat whole only if that fails.
  const fence = md.match(/```json[ \t]+audit-settings[ \t]*\r?\n/);
  const start = fence.index + fence[0].length, end = md.indexOf("```", start);
  let body = md.slice(start, end);
  for (const [fk, section, k] of removed) {
    const atKey = body.indexOf(JSON.stringify(fk) + ":");
    const sec = atKey < 0 ? -1 : body.indexOf(JSON.stringify(section) + ":", atKey);
    if (sec < 0) continue;
    const m = new RegExp("\\n[ \\t]*" + esc(JSON.stringify(k)) + ":\\s*").exec(body.slice(sec));
    if (!m) continue;
    // The value runs to its matching bracket when it opens one, else to the line's end.
    let i = sec + m.index + m[0].length, depth = 0, inStr = false;
    for (; i < body.length; i++) {
      const ch = body[i];
      if (inStr) { if (ch === "\\") i++; else if (ch === '"') inStr = false; continue; }
      if (ch === '"') inStr = true;
      else if (ch === "[" || ch === "{") depth++;
      else if (ch === "]" || ch === "}") { if (depth === 0) break; depth--; if (depth === 0) { i++; break; } }
      else if ((ch === "," || ch === "\n") && depth === 0) break;
    }
    body = body.slice(0, sec + m.index) + body.slice(body[i] === "," ? i + 1 : i);
  }
  body = body.replace(/,(\s*\n\s*[}\]])/g, "$1").replace(/\n[ \t]*"(?:optionOrder|variants|naming|pages|tokens|components)": \{\s*\},?/g, "").replace(/,(\s*\n\s*[}\]])/g, "$1");
  let parsed = null;
  try { parsed = JSON.parse(body); } catch {}
  if (!parsed || !same(parsed, settings)) body = format(settings) + "\n";
  writeFileSync(doc, md.slice(0, start) + body + md.slice(end));
  for (const r of removed) healed.push(r[3].replace("restates", "removed, it restated"));
  for (const e of empty) healed.push(e.replace("an empty", "removed an empty"));
}

// Every skill script and scanner reads settings, found from the tree so a new one
// is covered the day it lands; tests are fixtures, not readers.
const SCANNERS = process.env.STANDARDS_SCANNERS ? process.env.STANDARDS_SCANNERS.split(",")
  : git(["ls-files", "skills/*/scripts/*.js", "skills/*/scripts/*.mjs", "skills/*/scripts/*.cjs", "skills/*/scanner/*.js"]).split("\n").filter((f) => f && !/\/test[-.]/.test(f) && has(f));
// Files whose settings arrive as `opts`, with the arguments derived from settings or evidence rather than keys.
const OPTS = process.env.STANDARDS_OPTS ? JSON.parse(process.env.STANDARDS_OPTS) : {
  "skills/figma-components-audit/scripts/probes.js": ["states", "focus", "rest", "slotName", "parts"],
};
let allow = {};
if (has("tools/toolkit-check/settings-allowlist.json")) {
  try { allow = JSON.parse(read("tools/toolkit-check/settings-allowlist.json")); } catch (e) { problems.push(`tools/toolkit-check/settings-allowlist.json: ${e.message}`); }
}
for (const [rel, entries] of Object.entries(allow)) {
  if (!has(rel)) { problems.push(`settings-allowlist: ${rel} does not exist; remove its entries`); continue; }
  for (const a of entries) if (!read(rel).includes(a.literal)) problems.push(`settings-allowlist: ${rel} no longer contains ${JSON.stringify(a.literal)}; remove the entry`);
}
// What a *Checked:* string must be found in: the file with its comments removed, so a
// check deleted with only its comment left behind no longer counts (tools/toolkit-check/strip.mjs).
function executable(rel) { return stripComments(rel, read(rel)); }
// A skill's script runs on its own when its header's `@runs:` names a file in this repo whose
// code loads it: the runner exists and says the script's name. "@runs: a session" names nothing.
function runsOnItsOwn(rel) {
  const m = read(rel).slice(0, 800).match(/@runs:([^\n]*)/);
  if (!m) return false;
  const runners = (m[1].match(/[\w.-]+\/[\w./-]+\.(?:mjs|cjs|js|sh)/g) || []).filter(has);
  return runners.some((r) => stripComments(r, read(r)).includes(basename(rel)));
}
const houseValues = new Set();
// Values under three characters (`md`, `sm`) are skipped: they collide with ordinary code too often to mean anything.
for (const v of SECTIONS.flatMap((sec) => Object.values(defaults[sec] || {}))) for (const x of [].concat(v)) if (typeof x === "string" && x.trim().length >= 3 && !/^[\^\[]/.test(x)) houseValues.add(x);
for (const [k, v] of Object.entries(defaults.optionOrder || {})) { if (!k.startsWith("(")) houseValues.add(k); for (const x of v) if (!/^(True|False)$/.test(x) && x.length >= 3) houseValues.add(x); }
const houseEmoji = [...new Set([...houseValues].flatMap((x) => [...x].filter((ch) => /\p{Extended_Pictographic}/u.test(ch)).map((ch) => ch.codePointAt(0).toString(16))))];
const words = [...houseValues].filter((x) => /^[A-Z][A-Za-z]{2,}$/.test(x));
for (const rel of SCANNERS) {
  if (!has(rel)) { problems.push(`${rel}: listed scanner is missing`); continue; }
  let src = code(read(rel));
  for (const m of src.matchAll(/\b(?:T|TOK|TOKENS)(?:\.([A-Za-z_]\w*)|\[["'`]([^"'`]+)["'`]\])/g))
    if (!((m[1] || m[2]) in flatKeys)) problems.push(`${rel}: reads settings key ${m[1] || m[2]}, which is not in audit-keys`);
  if (OPTS[rel]) for (const m of src.matchAll(/\bopts\.([A-Za-z_]\w*)/g))
    if (!(m[1] in flatKeys) && !OPTS[rel].includes(m[1])) problems.push(`${rel}: reads opts.${m[1]}, which is neither in audit-keys nor a derived argument`);
  for (const a of allow[rel] || []) src = src.split(a.literal).join("");
  const emoji = src.match(/\p{Extended_Pictographic}/gu);
  if (emoji) problems.push(`${rel}: literal ${[...new Set(emoji)].join(" ")} in code; a marker belongs in the settings (or the allowlist, with a reason)`);
  const strings = [...src.matchAll(/(["'`])((?:(?!\1)[^\\]|\\.)*)\1/g)].map((m) => m[2]);
  const quoted = strings.filter((x) => houseValues.has(x));
  const regexes = [...src.matchAll(/(?<![\w)\]])\/(?![*/])((?:\\.|\[[^\]\n]*\]|[^/\\\n])+)\/[gimsuy]*/g)].map((m) => m[1]);
  for (const body of regexes) for (const w of words) if (new RegExp("(^|[^A-Za-z])" + w + "([^A-Za-z]|$)").test(body)) quoted.push(w);
  // In a longer string a house word is ordinary English ("Text styles") unless it is variant syntax ("State=Rest").
  for (const body of strings.filter((x) => !houseValues.has(x))) for (const w of words) if (new RegExp("(^|[^A-Za-z])" + w + "=").test(body)) quoted.push(w);
  for (const e of houseEmoji) if (new RegExp("\\\\u\\{?" + e + "\\b", "i").test(src)) quoted.push("an escaped " + String.fromCodePoint(parseInt(e, 16)));
  if (quoted.length) problems.push(`${rel}: quotes the house value${quoted.length > 1 ? "s" : ""} ${[...new Set(quoted)].map((x) => JSON.stringify(x)).join(", ")} in code; read it from the settings (or allowlist it, with a reason)`);
  const cite = src.match(new RegExp("\\b(?:" + names.join("|") + ") rule \\d+" + (stems.length ? "|" + stems.map(esc).join("|") + " \\d+" : "")));
  if (cite) problems.push(`${rel}: writes "${cite[0]}" into what it outputs; a finding names the setting, not a standard's numbering`);
}
const READERS = SCANNERS.concat(process.env.STANDARDS_READERS ? process.env.STANDARDS_READERS.split(",") : ["tools/figma-audit/server.mjs", "tools/snapshot/projects.cjs", "tools/docs-site/src/lib/project.js", "tools/ui-check/check.mjs"]);
const readSrc = READERS.filter(has).map((r) => code(read(r))).join("\n");
for (const sec of [...SECTIONS, "derived"]) for (const k of Object.keys(keys[sec] || {}))
  if (!new RegExp("\\b" + k + "\\b").test(readSrc)) problems.push(`audit-keys: ${sec}.${k} is registered but nothing reads it; remove it or write the check`);

for (const h of healed) console.log("healed  " + h);
for (const s of skipped) console.log("skipped " + s);
for (const p of problems) console.log("FAIL    " + p);
const tail = (healed.length ? ` (${healed.length} healed)` : "") + (skipped.length ? ` (${skipped.length} heal(s) skipped)` : "");
console.log(problems.length ? `${problems.length} problem(s)${tail}` : `standards clean${tail}`);
process.exit(problems.length ? 1 : 0);
