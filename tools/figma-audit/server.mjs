#!/usr/bin/env node
// The local service a project's design-system work runs through: it serves
// the audit dashboard, drives Figma through the Desktop Bridge plugin,
// records each run into the project's audit file, and builds and serves that
// project's docs site beside it. One service per project, no dependencies.
// (It said "local dashboard service for figma-components-audit" while doing
// all four; the first line is what a reader of the wrong file gets.)
//
// Why this exists at all: a Claude artifact is sandboxed — it cannot reach
// localhost, so it can only touch Figma through a cloud relay whose pairing
// code is single-use, while Figma terminates the plugin runtime every one to
// three minutes. That combination means constant re-pairing and it cannot be
// fixed from the client. Served from localhost instead, the same page has no
// sandbox: the plugin dials in on its own and reconnects itself forever.
//
// No dependencies, deliberately: nothing to install, nothing to keep current,
// and it can run as a login agent with no terminal. (The docs site it builds
// has packages of its own: pnpm install in tools/docs-site.)
//
//   node server.mjs --all                                   every project whose context document states a port
//   node server.mjs --data <project home>/audit [--port 9231]
//   node server.mjs --data <a>/audit --port 9231 --data <b>/audit --port 9232
//
// Also: --context <doc> (default: beside the audit folder), --key-file <path>
// (default ~/.figma-dashboard-key; ANTHROPIC_API_KEY wins), and --scanner,
// --foundations, --validator, --links, --pairing for a skill installed outside
// this repo (README, Reference).
//
// One record per library inside that folder, named for its Figma file key.
//
// Each serves that project's docs site (<project home>/site, built here by
// tools/docs-site) with the dashboard as its Audits page.
//
// The second form runs several projects from one process — one login item in
// System Settings instead of one per project — by forking one copy of this
// file per --data/--port pair and restarting any that exits. Each child is the
// single-project service exactly as before, on its own port, so the plugin's
// one-port-per-project protocol does not change.
//
// The port must sit in 9223–9232, which is the range the Desktop Bridge plugin
// scans and the only range its manifest permits. 9231 is near the top so it
// does not collide with the MCP servers Claude Code spawns from 9223 up.

import { createServer } from "node:http";
import { createHash } from "node:crypto";
import { readFile, writeFile, mkdir, rename, rm, copyFile } from "node:fs/promises";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, dirname, join, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
/* The context document's readers (its fenced JSON blocks, its rulings log)
   are the snapshot contract's, shared with the docs site and the tracker, so
   there is one parser of the log and not one per reader. */
import contract from "../snapshot/projects.cjs";
import { isFigmaOrigin } from "../shared/origin.mjs";
import { decoder, MAX_MESSAGE } from "./frames.mjs";
// The store's own resolver, so a stored spec becomes a tree here exactly as
// it does in the docs build. Two resolvers would be two answers.
import specTool from "../snapshot/spec.cjs";
import store from "../snapshot/store.cjs";
const { walkRulings, rulingsOf, rulingKey } = contract;

const HERE = dirname(fileURLToPath(import.meta.url));

/*
 * THE ROW WRITER IS RE-READ FROM DISK, like the scanners `/scripts` serves.
 *
 * A static import binds the module once, for the life of the process — and
 * these services run for days. Every change to `rows.mjs` was therefore on
 * disk and not in the running process: a service started at 00:21 was still
 * closing rows with a writer that had never heard of `exhaustive`, hours
 * after it shipped, while the page it served carried the flag. The run
 * reported "0 candidates, nothing filed" and the maintainer reasonably read
 * that as the rename being the problem. Nothing anywhere said the writer was
 * stale, and the same payload replayed against the file on disk closed the
 * row immediately.
 *
 * Re-imported when the file's mtime moves, with the mtime in the URL so the
 * module cache misses. The scanners already work this way; this was the one
 * live-editable file the service pinned.
 */
const ROWS = join(HERE, "rows.mjs");
let rowsMod = null, rowsAt = 0;
async function applyRows(record, payload) {
  let m = 0;
  try { m = statSync(ROWS).mtimeMs; } catch { m = 0; }
  if (!rowsMod || m !== rowsAt) {
    rowsMod = await import(pathToFileURL(ROWS).href + "?m=" + m);
    rowsAt = m;
  }
  return rowsMod.applyRows(record, payload);
}
const args = process.argv.slice(2);
const arg = (n, d) => { const i = args.indexOf(n); return i > -1 ? args[i + 1] : d; };

// Several --data flags: supervise, do not serve. Pairs are read in order, a
// --port belonging to the --data before it; a missing port takes the next one
// after the last given, so `--data a --port 9231 --data b` puts b on 9232.
const pairs = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--data") pairs.push({ data: args[i + 1], port: null });
  else if (args[i] === "--port" && pairs.length) pairs[pairs.length - 1].port = Number(args[i + 1]);
}
/*
 * `--all`: every project that states a `port` in its project block, found the
 * way every tool finds a project (contract.homes), so a new project is served
 * by adding its folder and its port — nothing here or in the launch agent
 * names one. Two projects on one port is a refusal for the second, by name.
 * The list is read again every minute, so a project added later is picked up
 * without a restart.
 */
const ALL = args.includes("--all");
const discover = () => {
  const found = [], taken = new Map();
  for (const h of contract.homes()) {
    const w = contract.layout(null, h.name);
    if (w.error || !w.port) { if (w.error) console.error(`figma audit    ${h.name}: ${w.error}`); continue; }
    if (taken.has(w.port)) { console.error(`figma audit    ${h.name}: port ${w.port} is already ${taken.get(w.port)}'s; give it another in its project block`); continue; }
    taken.set(w.port, h.name);
    found.push({ data: w.audit, port: w.port, label: h.name });
  }
  return found;
};
if (ALL) pairs.push(...discover());
if (pairs.length > 1 || ALL) {
  const { fork } = await import("node:child_process");
  let next = 9231;
  for (const p of pairs) { if (!p.port) p.port = next; next = p.port + 1; }
  // Everything that is not a --data/--port pair applies to every child. Only
  // --key-file used to be passed on, so a --scanner given in multi-project
  // mode was silently dropped and every child fell back to the default.
  const perChild = new Set(["--data", "--port"]);
  const passthrough = args.filter((a, i) => a !== "--all" && !(perChild.has(a) || perChild.has(args[i - 1])));
  const run = (p) => {
    const child = fork(fileURLToPath(import.meta.url), ["--data", p.data, "--port", String(p.port), ...passthrough], { stdio: "inherit" });
    // a child that dies — a port clash it reports itself, a crash — comes back
    // after a pause, the way the launch agent would bring the whole service back
    child.on("exit", (code) => { console.error(`dashboard on ${p.port} exited (${code}); restarting in 5s`); setTimeout(() => run(p), 5000); });
  };
  for (const p of pairs) run(p);
  if (ALL) {
    const serving = new Set(pairs.map((p) => p.data));
    if (!pairs.length) console.error("figma audit    no project states a port in its project block: nothing to serve yet");
    setInterval(() => { for (const p of discover()) if (!serving.has(p.data)) { serving.add(p.data); console.log(`figma audit    ${p.label}: new project, serving on ${p.port}`); run(p); } }, 60_000);
  }
  await new Promise(() => {});
}

const PORT = Number(arg("--port", 9231));
/*
 * `--data` is the project's audit folder, and there is one record in it per
 * library, named for its Figma file key. A project's libraries are different
 * files with different runs, and a single record could not say that web had
 * been audited and mobile had not; the page's library switch chooses which
 * record every route reads and writes, through `?lib=` on a GET and `lib` in
 * a POST body.
 *
 * A path ending in `.json` is still accepted: that is the old one-record
 * layout, and one project's record was still being written by another session
 * when the rest were renamed. The folder is then its parent, and the file
 * stands as the only library's record.
 */
const DATA_ARG = resolve(arg("--data", join(HERE, "audit.json")));
const LEGACY = DATA_ARG.endsWith(".json") && basename(DATA_ARG) === "audit.json";
const AUDIT_DIR = LEGACY || DATA_ARG.endsWith(".json") ? dirname(DATA_ARG) : DATA_ARG;
/** The record file for a library key, or the legacy single record. */
const recordFor = (lib) => {
  if (LEGACY) return DATA_ARG;
  const here = () => (existsSync(AUDIT_DIR) ? readdirSync(AUDIT_DIR).filter((f) => f.endsWith(".json") && !f.endsWith(".tmp")) : []);
  if (lib) {
    const named = join(AUDIT_DIR, `${basename(String(lib))}.json`);
    if (existsSync(named)) return named;
    /*
     * The migration shim `contract.auditRecords` carries: a project whose
     * record has not been renamed yet is still addressed by its library key
     * by the page, and answering "no record" would empty a live dashboard.
     *
     * ONLY a record still called `audit.json`, though. This used to accept
     * the one record in the folder WHATEVER it was called, which is a
     * different rule from the one `contract.auditRecords` applies — and it
     * meant that a project with one library, say `A.json`, that gains a
     * second library B answered `recordFor("B")` with A's record. B's first
     * audit would then have written its rows over A's queue: both are
     * plausible files, nothing errors, and the comment on `writeData` calls
     * exactly that outcome unrecoverable by inspection.
     *
     * `audit.json` is what the un-migrated name IS, so naming it is both the
     * whole of the shim and the end of the hole. A folder holding one
     * key-named record has already been migrated; that record belongs to its
     * own key and to nothing else.
     */
    const only = here();
    return only.length === 1 && only[0] === "audit.json" ? join(AUDIT_DIR, only[0]) : named;
  }
  // No library named: the only one there, or say so. Guessing between two
  // records is how a run against mobile files into web's queue.
  const found = here();
  if (found.length === 1) return join(AUDIT_DIR, found[0]);
  if (!found.length) return join(AUDIT_DIR, "unaudited.json");
  // Several records and no library named: the caller's question has no single
  // answer. Guessing is how a mobile run files into web's queue, so the first
  // record answers a READ and nothing is written — the page always names its
  // library, and a caller that does not is told which to pick.
  return join(AUDIT_DIR, found[0]);
};
// The key comes from the environment, or from a file. The file is what lets a
// launch agent run this with no secret in its plist — a plist is world-readable
// and gets committed by accident; a 600 file in the home directory does not.
function readKey() {
  if (process.env.ANTHROPIC_API_KEY) return process.env.ANTHROPIC_API_KEY.trim();
  const f = arg("--key-file", join(process.env.HOME || "", ".figma-dashboard-key"));
  try { return existsSync(f) ? readFileSync(f, "utf8").trim() : ""; } catch { return ""; }
}
// A placeholder or truncated key is worse than none: /status reports Claude as
// available, the page offers the judgement pass, and the run fails at the end
// with an API error the reader can do nothing about. Shape-check it up front so
// the page takes its honest scanner-only branch instead.
const RAW_KEY = readKey();
const KEY_LOOKS_REAL = /^sk-ant-\S{20,}$/.test(RAW_KEY);
if (RAW_KEY && !KEY_LOOKS_REAL)
  console.error("ignoring the API key: it does not look like one (expected sk-ant- followed by a long token).");
const ANTHROPIC_KEY = KEY_LOOKS_REAL ? RAW_KEY : "";
// Fix this and Ask. The audit's judgement takes its model and effort from the
// skill (scanner/judge.json), read per call so an edit there needs no restart.
const MODEL = "claude-sonnet-5";
// USD per million tokens, input and output, from Anthropic's price list.
// A model missing here still runs; its calls are recorded without a price.
const PRICE = { "claude-sonnet-5": [2, 10], "claude-opus-5-5": [4, 20], "claude-opus-5": [5, 25] };

// Where the skill's scanner lives. Default resolves to the skill in this repo;
// --scanner points elsewhere when the skill is installed somewhere else.
const SCANNER = arg("--scanner", join(HERE, "..", "..", "skills", "figma-components-audit", "scanner"));
if (!existsSync(join(SCANNER, "audit.js"))) {
  console.error("no scanner at " + SCANNER + " — pass --scanner <dir> pointing at the skill's scanner/.");
  process.exit(1);
}
// The other stages the page's Audit runs, each read from its own skill the
// same way: the foundations audit's scanner (file-level checks) and the
// component validator's live reader. Either may be absent — an install
// without that skill — and the page then says the stage did not run. The
// validator's engine is a tool (tools/validator), always beside this one, so
// its absence is a broken install and an error, never a stage that did not run.
const FOUNDATIONS = arg("--foundations", join(HERE, "..", "..", "skills", "figma-foundations-audit", "scripts", "foundations.js"));
const VALIDATOR = arg("--validator", join(HERE, "..", "..", "skills", "component-validator", "scripts"));
const VALIDATE = join(HERE, "..", "validator", "validate.mjs");
if (!existsSync(VALIDATE)) { console.error(`validator      no engine at ${VALIDATE}: the toolkit checkout is incomplete`); process.exit(1); }
const LINKS = arg("--links", join(HERE, "..", "..", "skills", "figma-variable-audit", "scripts", "links.js"));
// The instruction that asks which unpaired Figma and code components are one
// component under two names: design-code-parity's, as the judge's is the
// components audit's. And the one reading of "what the code has" (shared with
// the docs site's Parity page, which draws the same comparison).
const PAIRING = arg("--pairing", join(HERE, "..", "..", "skills", "design-code-parity", "scripts", "pairing.txt"));
const INVENTORY = join(HERE, "..", "shared", "code-inventory.mjs");
// The Lucide release the icon importer pins, so the icon-name check reads the
// names of the set the library's icons were imported from (figma-foundations-audit).
const lucideVersion = () => {
  try { return (/LUCIDE_STATIC_VERSION = '([\d.]+)'/.exec(readFileSync(join(HERE, "..", "..", "plugins", "lucide-icon-importer", "ui.html"), "utf8")) || [])[1] || null; }
  catch { return null; }
};
// The snapshot plugin's own file, served as a bridge body: run with no UI it
// walks the live library into the very shape the store records, and that is
// what the validator stage reads (toolkit-standard §D 5 — an audit reads the
// file, never a snapshot of it).
const SNAPSHOT = join(HERE, "..", "..", "plugins", "design-system-snapshot", "code.js");
const readIf = (f) => existsSync(f) ? readFile(f, "utf8") : Promise.resolve(null);

// ------------------------------------------------------------------ context
// A project's preferences live in its design-system context document and
// nowhere else. The record beside it holds results; it used to hold a copy of
// the settings and rulings too, and the copy drifted: on one project only
// 8 of 25 copied rulings still matched the document's wording, and rulings
// recorded from this page reached the copy and never the document.
//
// The document carries one fenced `json audit-settings` block (per library,
// keyed by file key) and a rulings log in §6. `standards/audit-settings.json`
// carries the `audit-defaults` beneath them; a project key overrides a house
// key per axis. Both are read on every request, so an edit reaches the next
// run with nothing to sync.
const CONTEXT = resolve(arg("--context", join(AUDIT_DIR, "..", "design-system-context.md")));
/*
 * The project's docs site, served beside the API on this same origin. The
 * dashboard lives only in that site, as its Audits page, with the live API
 * behind it. The site is built by the toolkit's docs engine (tools/docs-site) into
 * the project's own folder (<home>/site), the project named by the home its
 * audit records sit in (contract.homeOf, contract.labelOf).
 */
const LABEL = contract.labelOf(dirname(AUDIT_DIR));
const SITE = join(dirname(AUDIT_DIR), "site");
/*
 * The project's stored component specs, resolved into the trees the validator
 * takes. This is the SAME reading the docs build does for each component's
 * Implementation table (tools/docs-site/src/lib/snapshot.js), through the same two
 * functions — the store's own resolver and the engine's `fromSnapshot` — so
 * the queue and the page cannot disagree about what a component contains.
 *
 * A spec that will not resolve is skipped rather than failing the stage: one
 * malformed folder must not take a whole audit down, and the count returned
 * to the page says how many were read, so a short read is visible instead of
 * looking like a clean library.
 */
// Where this project's specs and index live, from the contract — a repo
// project keeps its specs beside its code (`snapshot.config.json` `paths`),
// and two lines here that spelled out the canonical layout read the wrong
// folder for one (snapshot-standard 16).
const LAYOUT = (() => {
  try {
    const w = contract.layout(null, LABEL);
    // said, not swallowed: the fallback below is the canonical layout, which is the wrong folder for a repo project
    if (w.error) console.error(`specs          ${LABEL}: ${w.error}; reading the canonical layout instead`);
    return w;
  } catch (e) { console.error(`specs          ${LABEL}: ${e.message}`); return null; }
})();
// the canonical layout, as the store states it (store.cjs DEFAULT_PATHS)
const CANONICAL = store.paths(join(dirname(AUDIT_DIR), "snapshot"));
const SPECS = (LAYOUT && LAYOUT.paths && LAYOUT.paths.components) || CANONICAL.components;
const INDEX = (LAYOUT && LAYOUT.paths && LAYOUT.paths.index) || CANONICAL.index;
/*
 * ONE library's components, not the project's.
 *
 * A project may snapshot several Figma files into one store — one project
 * merges a web library, a mobile library and an assets file into 197 specs —
 * and the store records which file each component came from. Reading the
 * folder whole validated all 197 against the WEB target and filed the result
 * in the web queue, so rows titled `Mobile app/Label/sm` arrived on the Web
 * build board. An audit is per library; so is this.
 *
 * The index records a file ID; the caller has a file KEY. The routing block
 * in the project's context document is what pairs them, and it is the same
 * pairing the router itself uses.
 */
/*
 * ONE reading of a spec, whether it came from the store or from the live
 * file. A stored spec is `compact` (default plus deltas) and was written as
 * JSON; a live one arrives whole from the plugin's walk. Both go through the
 * same compact → text → resolve, so the two describe a component in one
 * shape — measured: without the compact step the live tree carried four
 * empty `children` arrays the stored one had dropped, the kind of key that
 * turns a rule silent on one source and not the other.
 */
const resolveSpec = (spec) => {
  const c = JSON.parse(JSON.stringify(specTool.compact(spec)));
  return { name: c.name, props: c.props, slots: c.slots, variants: specTool.resolve(c).variants };
};
/** `{ components, scoped }` — `scoped` false when this could not be narrowed
    to the one library, which is a fact the caller has to act on. */
function storedComponents(fileKey) {
  if (!existsSync(SPECS)) throw new Error("no snapshot at " + SPECS);
  let keep = null, scoped = !fileKey;
  if (fileKey) {
    try {
      const where = contract.layout(null, LABEL);
      const entries = contract.entries(where.files && where.files.library);
      const entry = entries.find((e) => e.key === fileKey || e.id === fileKey);
      const index = existsSync(INDEX) ? JSON.parse(readFileSync(INDEX, "utf8")) : null;
      /*
       * ONE library needs no filtering — reading the store whole IS reading
       * that library, so the read is scoped by construction.
       *
       * Without this, a single-library project whose snapshot predates the
       * index (or never had one) reported `scoped: false`, and the page then
       * refused the stage outright: a setup that worked yesterday failing on
       * a guard written for a hazard it does not have. The hazard is a store
       * holding SEVERAL libraries and a key that resolves to none of them.
       */
      if (entries.length === 1) scoped = true;
      // Only filter where BOTH halves are known. A store with no index, or a
      // file this project's routing does not name, is read whole rather than
      // silently emptied — a validator that returns nothing looks like a clean
      // library.
      if (entry && index && index.components) {
        keep = new Set(Object.entries(index.components)
          .filter(([, v]) => v.file === entry.id || v.file === entry.key)
          .map(([folder]) => folder));
        /*
         * An EMPTY match is not a reason to read everything.
         *
         * `keep = null` here meant a key the routing names but the store has
         * not snapshotted yet — or a key that is simply wrong — read all 197
         * specs of every library in the project. Measured: an unknown key and
         * a real-but-unsnapshotted one both returned 197 components and 62
         * findings, which the caller then filed with `full: true`, raising
         * AND closing component-validator rows for every component in the
         * store. That is the defect the comment above records as fixed,
         * reintroduced by the guard written to prevent an empty result.
         *
         * Failing open was meant to stop "nothing found" reading as a clean
         * library. The answer to that is to fail LOUD, not wide: the scope is
         * reported alongside the components, and a caller that could not be
         * scoped must not make a claim about a whole library.
         */
        scoped = keep.size > 0;
        if (!keep.size) keep = new Set();
      }
    } catch (e) { keep = null; scoped = false; }
  }
  const out = [];
  const unreadable = [];
  for (const folder of readdirSync(SPECS)) {
    if (keep && !keep.has(folder)) continue;
    try {
      // the store's one reader, as stored: resolveSpec below resolves it
      const spec = store.readSpec(SPECS, folder, { compact: true });
      if (!spec) continue;
      // `slots` too, and it is not optional: W12's slot half is
      // `if (!c.slots) return`, so leaving it off turned 29 real slot
      // findings into 4 — and worse than silence, because with no slot
      // names the node pass stopped recognising a declared slot's
      // container and filed "… and is not a slot" about a node that is
      // one. The comment above promised both consumers read alike; only
      // the docs build did.
      out.push(resolveSpec(spec));
    } catch (e) {
      // One bad folder is not the library — but it is not nothing either.
      // A half-written spec made `/validate` answer `components: 2` of 3,
      // `ok: true`, no error and no count, so nothing downstream could tell
      // "Chip is clean" from "Chip was never read". A half-written snapshot
      // is most likely in exactly this stage.
      unreadable.push(folder);
    }
  }
  return { components: out, scoped, unreadable };
}
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".woff2": "font/woff2", ".woff": "font/woff", ".ico": "image/x-icon" };

function appendRuling(md, text, where) {
  const lines = md.split("\n"); let at = -1, header = null;
  walkRulings(lines, (i, c, h) => { at = i; header = h; });
  if (at < 0) return null;
  const esc = (s) => String(s).replace(/\|/g, "\\|");
  const row = header.map((h) => h === "date" ? new Date().toISOString().slice(0, 10)
    : h === "scope" ? "Audit" : h === "ruling" ? esc(text)
    : h === "why" ? esc("Recorded from the audit dashboard, on " + where + ".")
    : /decided/.test(h) ? "Maintainer" : "");
  lines.splice(at + 1, 0, "| " + row.join(" | ") + " |");
  return lines.join("\n");
}
// The project's audit settings merged over the house defaults, and its
// rulings: the contract's reader, shared with the docs site's read-only copy.
const readContext = async () => contract.auditContext(CONTEXT);

// A `--data` that can never hold a record is a misconfiguration, and it must
// fail here rather than serve an empty page forever. The launch agents kept
// pointing at `audit/audit.json` after the records were renamed one-per-
// library: the file was simply absent, `readData` returned a blank record as
// it does for a library nobody has audited, and the dashboard showed a
// project with two audited libraries as never audited — with a green "Figma
// connected" beside it. Nothing in the page could tell the two apart, because
// from the page they are the same answer.
if (LEGACY && !existsSync(DATA_ARG)) {
  const others = existsSync(AUDIT_DIR) ? readdirSync(AUDIT_DIR).filter((f) => f.endsWith(".json")) : [];
  if (others.length) {
    console.error(`--data names ${DATA_ARG}, which does not exist, while ${AUDIT_DIR} holds ${others.join(", ")}.`);
    console.error("Records are one per library now. Point --data at the folder; the page chooses the library.");
    process.exit(2);
  }
}

// Number.isInteger first: NaN passes BOTH of the range comparisons, so a
// `--port` with nothing after it sailed through this guard and reached
// listen() as NaN, where the error names the wrong problem.
if (!Number.isInteger(PORT) || PORT < 9223 || PORT > 9232) {
  console.error("--port must be a whole number in 9223–9232 (the range the Desktop Bridge plugin scans).");
  // Echo only what identifies the mistake. A mistyped command line can carry a
  // pasted API key into the wrong argument, and an error that prints the value
  // back puts the secret on screen and into scrollback.
  const got = String(arg("--port", "(not given)"));
  console.error("Got: " + (got.length > 12 ? got.slice(0, 6) + "… (" + got.length + " chars — did an API key run into it?)" : got));
  process.exit(1);
}
if (!arg("--data")) {
  console.error("--data <project home>/audit is required (the folder holding one record per library).");
  process.exit(1);
}

// ---------------------------------------------------------------- websocket
// Hand-rolled RFC6455, because a dependency here would defeat the point.
const GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
// One socket PER FIGMA FILE. The plugin runs per file, so two open libraries
// means two instances dialling in — and keeping only the newest made /exec hit
// whichever file connected last. That is a wrong-file write waiting to happen,
// and a guard downstream is a safety net, not a design.
const plugins = new Map();         // fileKey -> { socket, fileName, at }
let nextId = 1;
const pending = new Map();         // id -> {res, rej, timer, socket}: the socket the call went down

const liveFor = (fileKey) => {
  if (fileKey) {
    const e = plugins.get(fileKey);
    if (e && !e.socket.destroyed) return e.socket;
    return null;                   // asked for a file that is not open: never fall back
  }
  // no file named: only when exactly one file is open, and never a socket that
  // has not said which file it is — a page posing as the bridge could be that one
  const live = [...plugins.values()].filter((e) => !e.socket.destroyed);
  return live.length === 1 ? live[0].socket : null;
};

function frame(str) {
  const p = Buffer.from(str, "utf8"), len = p.length;
  let head;
  if (len < 126) head = Buffer.from([0x81, len]);
  else if (len < 65536) { head = Buffer.alloc(4); head[0] = 0x81; head[1] = 126; head.writeUInt16BE(len, 2); }
  else { head = Buffer.alloc(10); head[0] = 0x81; head[1] = 127; head.writeBigUInt64BE(BigInt(len), 2); }
  return Buffer.concat([head, p]);
}

function exec(code, timeout = 30000, fileKey = null) {
  return new Promise((res, rej) => {
    const plugin = liveFor(fileKey);
    if (!plugin) return rej(new Error(fileKey ? "wrong_file_not_open" : [...plugins.values()].some((e) => !e.socket.destroyed) ? "several_files_open_name_one" : "plugin_not_connected"));
    const id = nextId++;
    // Every command is logged as it leaves and as it comes back, with the
    // connection it went down: a "listing the sets" call sat 240 s in silence
    // on half of one day's runs, and nothing said whether the plugin ever saw
    // it. `plugins` is keyed by file, so the socket is named by its file.
    const conn = [...plugins.entries()].find(([, e]) => e.socket === plugin);
    const who = conn ? `${conn[1].fileName || conn[0]} (since ${conn[1].at.slice(11, 19)})` : "unnamed socket";
    const t0 = Date.now();
    const head = String(code).match(/const MODE = "([a-z]+)"/) ? `MODE ${String(code).match(/const MODE = "([a-z]+)"/)[1]}` : `${String(code).length} chars`;
    console.log(`plugin → #${id} ${head} to ${who}, ${Math.round(timeout / 1000)}s allowed`);
    const timer = setTimeout(() => { pending.delete(id); console.log(`plugin ✗ #${id} no answer from ${who} after ${Math.round((Date.now() - t0) / 1000)}s`); rej(new Error("plugin_timeout")); }, timeout + 5000);
    pending.set(id, { res: (v) => { console.log(`plugin ← #${id} answered by ${who} in ${Math.round((Date.now() - t0) / 1000)}s`); res(v); }, rej, timer, socket: plugin });
    plugin.write(frame(JSON.stringify({ id, method: "EXECUTE_CODE", params: { code, timeout } })));
  });
}

/*
 * Is a file's socket still there? Asked when another socket claims the file.
 *
 * The bridge cannot carry a token (it is the third-party Desktop Bridge,
 * which sends `Origin: null` and nothing else), so a page that opens a socket
 * and says FILE_INFO for an open file looks exactly like the plugin
 * reconnecting. Taking the slot on the claim alone let such a page replace
 * the real plugin and answer `/exec` for that file (toolkit review,
 * 2026-10-31). A live socket answers a ping on loopback within milliseconds;
 * a runtime Figma tore down does not, or is already closed. So the claim wins
 * only over a socket that is gone or silent.
 */
const ALIVE_MS = 3000;
function alive(socket) {
  if (socket.destroyed) return Promise.resolve(false);
  return new Promise((done) => {
    const timer = setTimeout(() => { socket.off("pong", onPong); done(false); }, ALIVE_MS);
    const onPong = () => { clearTimeout(timer); done(true); };
    socket.once("pong", onPong);
    try { socket.write(Buffer.from([0x89, 0])); } catch { clearTimeout(timer); done(false); }
  });
}

function attach(socket) {
  socket.setNoDelay(true);
  const feed = decoder();

  socket.on("data", (d) => {
    for (const ev of feed(d)) {
      if (ev.type === "close") { socket.end(); return; }
      if (ev.type === "too_large") { console.error(`refused a socket message over ${MAX_MESSAGE} bytes — the socket is closed`); socket.destroy(); return; }
      if (ev.type === "ping") { socket.write(Buffer.concat([Buffer.from([0x8a, ev.data.length]), ev.data])); continue; }
      if (ev.type === "pong") { socket.emit("pong"); continue; }

      let msg; try { msg = JSON.parse(ev.data.toString("utf8")); } catch { continue; }
      if (msg.id && pending.has(msg.id)) {
        // an answer counts only from the socket the call was sent down: ids are
        // sequential, so any other socket could guess one and answer for Figma
        if (pending.get(msg.id).socket !== socket) { console.error(`refused an answer to #${msg.id} from a socket it was not sent to`); continue; }
        const { res, rej, timer } = pending.get(msg.id);
        pending.delete(msg.id); clearTimeout(timer);
        msg.error ? rej(new Error(String(msg.error))) : res(msg.result);
        continue;
      }
      if (msg.type === "FILE_INFO" && msg.data && msg.data.fileKey) {
        const key = msg.data.fileKey, fileName = msg.data.fileName || null;
        const take = () => {
          if (socket.destroyed) return;
          plugins.set(key, { socket, fileName, at: new Date().toISOString() });
        };
        // A reconnect from the same file replaces that file's socket only when
        // the old one is gone: Figma restarts plugin runtimes constantly, and
        // a dead one is closed or silent. One that still answers keeps the file.
        // Asked again of whoever holds the file once the ping is settled: two
        // claims racing must not let the second take the first's new slot unasked.
        const claim = () => {
          const prev = plugins.get(key);
          if (!prev || prev.socket === socket) return take();
          alive(prev.socket).then((up) => {
            if (plugins.get(key) !== prev) return claim();   // settled meanwhile: ask the new holder
            if (up) { console.error(`refused a second socket for ${fileName || key}: the one it has still answers`); return socket.destroy(); }
            prev.socket.destroy();
            take();
          });
        };
        claim();
      }
    }
  });
  const gone = () => {
    for (const [k, e] of plugins) if (e.socket === socket) plugins.delete(k);
    // Figma tears the plugin runtime down mid-call routinely. Fail the calls
    // sent down this socket now rather than making the page sit out a
    // 35-second timeout for an answer that can no longer arrive: no other
    // socket may answer them.
    for (const [id, e] of pending) if (e.socket === socket) { clearTimeout(e.timer); e.rej(new Error("plugin_not_connected")); pending.delete(id); }
  };
  socket.on("close", gone);
  socket.on("error", gone);
  // The HTTP server keeps an upgraded socket half-open when its peer goes
  // (allowHalfOpen), so a runtime torn down without a close frame never
  // reached `close`: its file stayed held and its calls waited out their timeout.
  socket.on("end", () => socket.destroy());
}

// ------------------------------------------------------------------- record
// Written atomically: the file is the record, and a half-written record is
// worse than a stale one.
async function readData(lib) {
  const file = recordFor(lib);
  if (!existsSync(file)) return { rows: {}, libraries: {}, runs: {}, meta: {} };
  try { return JSON.parse(await readFile(file, "utf8")); }
  catch (e) { throw new Error(basename(file) + " is not valid JSON: " + e.message); }
}
async function writeData(obj, lib) {
  // A read may fall back to the first record; a write may not. Filing a mobile
  // run into web's queue is unrecoverable by inspection — both are plausible.
  if (!LEGACY && !lib) {
    const found = existsSync(AUDIT_DIR) ? readdirSync(AUDIT_DIR).filter((f) => f.endsWith(".json") && !f.endsWith(".tmp")) : [];
    if (found.length > 1) throw new Error(`this project has ${found.length} library records; name the one to write with ?lib=<file key>`);
  }
  const file = recordFor(lib);
  await mkdir(dirname(file), { recursive: true });
  /*
   * A tmp name only this write uses.
   *
   * `file + ".tmp"` is the same path for every writer, and there are several:
   * this route, `POST /patch`, and `rows.mjs`'s CLI, which the README offers
   * as interchangeable with the route and four skills tell sessions to use.
   * Two overlapping writes then share one tmp file — one renames it away
   * under the other, which fails with ENOENT, and the file left on disk is
   * whatever the interleaving produced. Eleven of thirty concurrent trials
   * left the record UNPARSEABLE, and an unparseable record is a dead
   * dashboard for that library and a committed one, since records are in git.
   *
   * A unique name makes each write atomic against the others: every writer
   * renames its own complete file over the record, so the loser of a race
   * loses its update — which is recoverable by re-running — rather than
   * leaving a broken file, which is not.
   */
  const tmp = file + "." + process.pid + "." + (writeData.n = (writeData.n || 0) + 1) + ".tmp";
  try {
    await writeFile(tmp, JSON.stringify(obj, null, 2) + "\n", "utf8");
    // The record as it was, kept beside it as `<key>.json.prev`: one file,
    // overwritten on every write, outside the `.json` glob every reader of
    // records uses. Git holds the record at run boundaries — about four
    // commits a day, with up to twelve hours and a hundred rows between
    // them — and this covers the one class git cannot: a write that was
    // wrong the moment it landed.
    // Copied, not renamed: a rename leaves a moment with no record at all.
    try { await copyFile(file, file + ".prev"); } catch (e) { if (e.code !== "ENOENT") throw e; }
    await rename(tmp, file);
  } catch (e) {
    // Never leave the scratch file behind to be served or globbed as a record.
    try { await rm(tmp, { force: true }); } catch {}
    throw e;
  }
}

/*
 * ONE WRITER AT A TIME, PER RECORD.
 *
 * `/patch` and `/rows` both read the whole record, change it in memory and
 * write the whole record back. `readData` awaits an 870KB `readFile`, and
 * that await is the window: four concurrent patches on four DIFFERENT rows
 * lost three of them, and all four answered `{"ok":true}`. Nothing errors,
 * nothing re-reads, and the next GET shows the row untouched — which reads,
 * to the person it happens to, as "I must not have clicked it".
 *
 * A promise chain per record file serialises the read-modify-write so each
 * one sees the previous one's result. This covers every writer INSIDE this
 * process, which is where the reproduced loss was: the page's own ticks, and
 * a page ticking while a run files rows. It does NOT cover a separate
 * process — a session running `rows.mjs --data` directly — and nothing here
 * pretends it does; that needs a lock file, and is called out as such.
 */
const writeChain = new Map();
function inOrder(lib, fn) {
  const key = recordFor(lib);
  const prev = writeChain.get(key) || Promise.resolve();
  const next = prev.then(fn, fn);
  // Keep the chain alive but never let it reject: a failed write must not
  // poison every later one.
  writeChain.set(key, next.then(() => {}, () => {}));
  return next;
}

// The last docs-site build failure, or null. Surfaced on /status because a
// site that has silently stopped rebuilding looks exactly like a site with
// nothing to say — one real log held 127 build failures that nothing reported.
let lastBuildError = null;

// --------------------------------------------------------------------- http
// Buffers, not string concatenation: a multi-byte character split across two
// TCP chunks decodes to U+FFFD when each chunk is stringified on its own, so a
// note with an accent or an em dash arrived silently corrupted.
const body = (req) => new Promise((resolve, reject) => {
  const chunks = []; let size = 0;
  req.on("data", (c) => {
    size += c.length;
    if (size > 8e6) { reject(new Error("too_large")); req.destroy(); return; }
    chunks.push(c);
  });
  req.on("error", reject);
  req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
});
const json = (res, code, obj) => {
  res.writeHead(code, { "Content-Type": "application/json", "Cache-Control": "no-store" });
  res.end(JSON.stringify(obj));
};

// Only this page may drive the service. A cross-site POST with a text/plain
// body is a CORS *simple* request: no preflight, no consent, and the attacker
// never needs to read the reply because running the code is the whole attack.
// Same-origin fetches send no Origin on GET and send this origin on POST.
const ALLOWED = new Set([`http://localhost:${PORT}`, `http://127.0.0.1:${PORT}`]);
// The names this machine is addressed by, with this port: the HTTP routes and the socket both take only these.
const LOCAL_HOST = (h) => [`localhost:${PORT}`, `127.0.0.1:${PORT}`, `[::1]:${PORT}`].includes(String(h || ""));
const sameOrigin = (req) => {
  const o = req.headers.origin;
  if (o === undefined) return req.method === "GET";   // a form post always sends one
  return ALLOWED.has(o);
};

const server = createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  try {
    // Only requests addressed to this machine: a page on another site that
    // rebinds its own name to 127.0.0.1 sends its own Host, and without this
    // could read the record, since a same-origin GET carries no Origin.
    if (!LOCAL_HOST(req.headers.host)) return json(res, 421, { error: "wrong_host" });
    if (!sameOrigin(req)) {
      // /health is the exception: the Figma plugin probes it from its own
      // sandbox origin before opening the socket.
      if (url.pathname !== "/health") return json(res, 403, { error: "cross_origin" });
    }
    // The plugin's discovery loop probes /health before opening a socket.
    if (url.pathname === "/health")
      return json(res, 200, { status: "ok", service: "figma-console-mcp", serverVersion: "dashboard-1", port: PORT, pid: process.pid });

    if (url.pathname === "/status") {
      const files = [...plugins.entries()]
        .filter(([, e]) => !e.socket.destroyed)
        .map(([fileKey, e]) => ({ fileKey, fileName: e.fileName, at: e.at }));
      return json(res, 200, {
        plugin: files.length > 0,
        files,                                   // every library currently open
        file: files[0] || null,                  // kept for the page's simple case
        data: AUDIT_DIR, claude: !!ANTHROPIC_KEY, buildError: lastBuildError
      });
    }

    // The scanner belongs to the SKILL, and this serves that same file.
    //
    // This is the whole point. An audit must produce the same result whether a
    // session runs it or someone presses Audit here — so there is exactly one
    // implementation of the deterministic layer, and the skill owns it. When
    // this directory had its own copy, the page's audit checked seven rule
    // families while the skill defined about twenty-five: two different tools
    // wearing the same button, and no error anywhere to say which one you got.
    if (url.pathname === "/scripts") {
      const [sweep, audit, judge, fix, buckets, checks, scoring, measures, foundations, walker, links, snapshot, pairing] = await Promise.all([
        readFile(join(SCANNER, "sweep.js"), "utf8"),
        readFile(join(SCANNER, "audit.js"), "utf8"),
        readFile(join(SCANNER, "judge.txt"), "utf8"),
        readFile(join(SCANNER, "fix.txt"), "utf8"),
        readFile(join(SCANNER, "buckets.json"), "utf8"),
        readFile(join(SCANNER, "checks.json"), "utf8"),
        readFile(join(SCANNER, "scoring.json"), "utf8"),
        readFile(join(SCANNER, "measures.json"), "utf8"),
        readIf(FOUNDATIONS),
        readIf(join(VALIDATOR, "walk-figma.js")),
        readIf(LINKS),
        // Served for headless use, where the bridge evaluates it as a function body: the return the plugin file itself cannot carry (see its tail).
        readIf(SNAPSHOT).then((t) => (t ? t + "\nreturn __headless();\n" : t)),
        readIf(PAIRING)
      ]);
      // Everything the audit DECIDES ships from the skill: what to check
      // (audit), what survives (judge), how a fix is written (fix), and which
      // bucket a finding lands in (buckets). The page decides only how to draw
      // the result.
      return json(res, 200, { sweep, audit, judge, fix, buckets: JSON.parse(buckets), checks: JSON.parse(checks), scoring: JSON.parse(scoring), measures: JSON.parse(measures),
                              foundations, walker, validator: true, links, snapshot, pairing });
    }

    // The validator's engine, run here because it is node code and the page
    // is not: the page walks the trees through the plugin and hands them over.
    // The engine is the skill's file, imported at call time so an edit to it
    // reaches the next run with no restart.
    if (url.pathname === "/validate" && req.method === "POST") {
      // `framework` and its component map come from the project's audit
      // settings and are passed straight through: the engine decides what a
      // framework layer means, this only carries it. Without them the MUI
      // rules existed and only a session could run them, which is the shape
      // of a check that is documented and not executable.
      const payload = JSON.parse(await body(req));
      const { target, framework, frameworkMap } = payload;
      // THREE sources, one shape. `specs` are the plugin's own records of the
      // LIVE file — the dashboard's audit reads the library this way, because
      // an audit is about the present and a snapshot is about a stored state
      // (toolkit-standard §D 5): a loose shadow removed from a dialog stayed
      // in the Web build queue all afternoon while the Broken tokens tab,
      // which reads Figma, had cleared. `components` are trees a caller has
      // already read and normalised, left alone. Neither given, the STORED
      // snapshot is read — the docs build's input, which the Implementation
      // tables must stay reproducible from. Specs and stored specs pass
      // through the same `resolveSpec`, so the live audit and the stored
      // docs describe a component in one shape.
      let components = payload.components;
      // Given trees are the caller's own reading, and are scoped by
      // construction; a snapshot read has to say whether it could be narrowed.
      let scoped = true, unreadable = [];
      let read = payload.components ? "given" : Array.isArray(payload.specs) ? "figma" : "snapshot";
      if (Array.isArray(payload.specs)) components = payload.specs.map(resolveSpec);
      if (!Array.isArray(components)) {
        let read;
        try { read = storedComponents(payload.fileKey || null); }
        catch (e) { return json(res, 200, { ok: false, error: "no stored components to validate: " + e.message }); }
        components = read.components; scoped = read.scoped; unreadable = read.unreadable || [];
        if (!components.length) return json(res, 200, { ok: false, scoped,
          error: payload.fileKey && !scoped
            ? "no stored components for " + payload.fileKey + " \u2014 this project's routing does not name that file, or it has never been snapshotted"
            : "the snapshot holds no component specs \u2014 take a snapshot first" });
      }
      if (!target || !Array.isArray(components)) return json(res, 400, { ok: false, error: "target and components required" });
      const engine = VALIDATE;
      try {
        const m = await import(pathToFileURL(engine).href + "?t=" + Date.now());
        const opts = framework ? { framework, frameworkMap } : {};
        // The state axis and its options are the library's own vocabulary,
        // from its settings; without them the state checks stay silent.
        const states = contract.validatorStates(await readContext(), payload.fileKey || null);
        if (states) opts.states = states;
        // `fromSnapshot` is the engine's own normalisation of a stored spec —
        // it is what the docs build applies (lib/snapshot.js) and what the
        // header above says BOTH consumers go through. This one did not, so
        // the two readers of one file disagreed: a rule reading a field
        // `fromSnapshot` adds fires on the page and not in the queue. Given
        // trees are already the caller's own reading and are left alone.
        if (!payload.components && m.fromSnapshot) components = m.fromSnapshot(components);
        // Run first, then ask what stayed silent: a class that raised a
        // finding ran, and saying otherwise beside its own rows is the one
        // answer a trust question must never get.
        const found = m.validate(components, target, opts);
        return json(res, 200, { ok: true, target, framework: framework || null,
          read, components: components.length,
          // Whether this IS one library's components or everything the store
          // holds. A caller filing `full: true` on an unscoped read closes
          // rows for libraries it never looked at.
          scoped,
          // Component names AND the shared causes a finding may be filed
          // against instead — a text style is not a component, and a row
          // filed on one could never be closed by a full run that listed
          // only components.
          scope: [...new Set(components.map((c) => c.name).concat(found.filter((f) => f.shared).map((f) => f.component)))],
          // Specs the store holds but this run could not parse. A half-written
          // one used to vanish from the count with `ok: true` and nothing
          // said, so "clean" and "never read" looked the same.
          unreadable,
          silent: m.silentClasses(components, target, found),
          unmapped: framework && m.unmappedFor ? m.unmappedFor(components, frameworkMap || {}) : [],
          findings: found });
      } catch (e) { return json(res, 200, { ok: false, error: e.message }); }
    }

    // A library's components against its code's, by name: which are in both,
    // which only one side has. The page hands over the names it read from the
    // LIVE file; the code is the folder the library's settings name. The same
    // comparison the docs site's Parity page draws from the stored snapshot,
    // through the same module, so the two cannot disagree about what a name
    // match is. Reads only: nothing is written here.
    if (url.pathname === "/parity" && req.method === "POST") {
      const { lib, figma } = JSON.parse(await body(req));
      const c = await readContext();
      const settings = (c.libraries || {})[lib];
      if (!settings) return json(res, 200, { ok: false, error: "the context document has no audit-settings entry for this library" });
      // No code named is a fact about the project, not a failure of the run.
      if (!settings.code || !settings.code.repo) return json(res, 200, { ok: true, stated: null });
      try {
        const m = await import(pathToFileURL(INVENTORY).href + "?t=" + Date.now());
        const found = m.codeComponents(join(contract.expand(settings.code.repo), settings.code.components || ""));
        if (!found) return json(res, 200, { ok: false, error: "the code is stated as " + (settings.code.components || ".") + " in " + settings.code.repo + ", and that folder is not there" });
        const built = settings.framework ? settings.frameworkComponents || {} : {};
        const r = m.compare((figma || []).map((title) => ({ title })), found, (name) => built[name]);
        return json(res, 200, { ok: true, stated: settings.code.repo, components: found.length,
          both: r.both.map((b) => ({ figma: b.page.title, code: b.code.name, sameName: b.sameName })),
          figmaOnly: r.figmaOnly.map((p) => p.title),
          codeOnly: r.codeOnly.map((k) => ({ name: k.name, path: k.path })) });
      } catch (e) { return json(res, 200, { ok: false, error: e.message }); }
    }

    // The project's preferences, read from its context document on every call.
    if (url.pathname === "/context" && req.method === "GET") return json(res, 200, await readContext());

    // A ruling goes to the document's rulings log, the one place it lives.
    if (url.pathname === "/ruling" && req.method === "POST") {
      const { text, where, about, dryRun } = JSON.parse(await body(req));
      const clean = String(text || "").replace(/\s+/g, " ").trim();
      if (!clean) return json(res, 400, { error: "text required" });
      if (!existsSync(CONTEXT)) return json(res, 200, { ok: false, error: "no context document at " + CONTEXT });
      const md = await readFile(CONTEXT, "utf8");
      // Said as a fact the page can act on: a ruling already recorded still closes the row it is written under.
      if (rulingsOf(md).some((r) => r.key === rulingKey(clean))) return json(res, 200, { ok: false, already: true, error: "that ruling is already in the document" });
      // The Why column names the component the ruling was made on and the
      // finding it answered: that is what lets the judge apply it to that
      // component and to the same finding on any other.
      const on = String(where || "the queue") + (about ? ", about: " + String(about).replace(/\s+/g, " ").trim().slice(0, 140) : "");
      const next = appendRuling(md, clean, on);
      if (!next) return json(res, 200, { ok: false, error: "the context document has no rulings table in §6" });
      // A dry run answers every check above and writes nothing — the way to
      // probe a live service, after a probe appended a row to a real document.
      if (dryRun) return json(res, 200, { ok: true, dryRun: true, file: CONTEXT, wouldAppend: next.split("\n").find((l, i) => l !== md.split("\n")[i]) || "" });
      // A tmp name only this write uses — `CONTEXT + ".tmp"` is one path for
      // every writer, which is the defect `writeData` carries a long comment
      // about. Six concurrent rulings: three failed with ENOENT renaming a
      // tmp another had already moved, and of the three that answered ok only
      // two reached the document. This file is the project's source of truth
      // and was the least protected writer in the service.
      const tmp = CONTEXT + "." + process.pid + "." + (globalThis.__rulingN = (globalThis.__rulingN || 0) + 1) + ".tmp";
      try {
        await writeFile(tmp, next, "utf8");
        await rename(tmp, CONTEXT);
      } catch (e) {
        try { await rm(tmp, { force: true }); } catch {}
        throw e;
      }
      return json(res, 200, { ok: true, file: CONTEXT });
    }

    // Rows are filed here, by every writer — the page and every skill that owns
    // rows — so there is one row key, one match, one owner rule and one close.
    // The payload and the result are described at the top of rows.mjs.
    if (url.pathname === "/rows" && req.method === "POST") {
      const payload = JSON.parse(await body(req));
      /*
       * A key this project does not own is a mistake, not a new library.
       * `recordFor` just joins the key onto the audit folder, so posting a
       * finding with a foreign key created a whole new record answering
       * `{"ok":true}` — and since the plugin dials into whichever service
       * answers first, a run driven at the wrong port filed a real audit into
       * a foreign project's folder, indistinguishable from a second library.
       *
       * Checked against the records that exist AND the project's routing, so
       * a genuinely new library is still accepted the first time it is
       * snapshotted; only a key nothing knows about is refused.
       */
      if (payload.fileKey && !LEGACY) {
        const known = new Set((existsSync(AUDIT_DIR) ? readdirSync(AUDIT_DIR) : [])
          .filter((f) => f.endsWith(".json") && !f.endsWith(".tmp")).map((f) => f.replace(/\.json$/, "")));
        const routed = contract.layout(null, LABEL).files || {};
        for (const list of Object.values(routed)) for (const f of (Array.isArray(list) ? list : [])) if (f && f.key) known.add(f.key);
        if (known.size && !known.has(payload.fileKey))
          return json(res, 400, { ok: false, error: "this project does not know the file key " + payload.fileKey +
            " \u2014 name it in the project's context document, or file against the service for the project that owns it" });
      }
      // A payload already names the library it audited: that is the record it
      // belongs in, so a run against mobile cannot file into web's queue.
      let out, failed = null;
      await inOrder(payload.fileKey, async () => {
        const data = await readData(payload.fileKey);
        // AWAITED: the writer is loaded from disk now, so this is async. Without
        // the await `out` is a Promise, which serialises to `{}` — every stage
        // would then read `added`/`closed` as undefined and report "nothing
        // filed" however much it had just done.
        try { out = await applyRows(data, payload); }
        catch (e) { failed = e.message; return; }
        if (!payload.dryRun) await writeData(data, payload.fileKey);   // applyRows worked on a copy
      });
      if (failed) return json(res, 400, { ok: false, error: failed });
      return json(res, 200, out);
    }

    if (url.pathname === "/data" && req.method === "GET") return json(res, 200, await readData(url.searchParams.get("lib")));

    if (url.pathname === "/data" && req.method === "PUT") {
      const next = JSON.parse(await body(req));
      /*
       * A record is a shape, and this route took anything. `{"oops":1}`
       * replaced an 870KB, 706-row record with sixteen bytes and answered
       * `{"ok":true}`; there is no backup, so git is the only floor and every
       * tick since the last commit is gone. The page does not use this route,
       * which made it a loaded gun rather than a daily one.
       *
       * The guard is the minimum that distinguishes a record from a mistake:
       * an object with a `rows` object. It does NOT validate the rows — that
       * is `applyRows`'s job, and a stricter check here would reject the
       * migrations this route exists to allow.
       */
      if (!next || typeof next !== "object" || Array.isArray(next) || !next.rows || typeof next.rows !== "object" || Array.isArray(next.rows))
        return json(res, 400, { ok: false, error: "that is not a record: a record is an object with a `rows` object" });
      await writeData(next, url.searchParams.get("lib"));
      return json(res, 200, { ok: true });
    }

    // Merge one path — how a tick or a note is saved without racing the rest
    // of the record. { path: "rows.n22-661", value: {...} }
    if (url.pathname === "/patch" && req.method === "POST") {
      const { path, value, lib } = JSON.parse(await body(req));
      if (!path) return json(res, 400, { error: "path required" });
      const keys = String(path).split(".");
      // `__proto__.x` would write onto Object.prototype for the life of the
      // process and then be serialised into the record.
      if (keys.some((k) => k === "__proto__" || k === "constructor" || k === "prototype" || k === ""))
        return json(res, 400, { error: "bad_path" });
      await inOrder(lib, async () => {
        const data = await readData(lib);
        let node = data;
        for (const k of keys.slice(0, -1)) node = (node[k] = node[k] || {});
        const last = keys[keys.length - 1];
        node[last] = (value && typeof value === "object" && !Array.isArray(value) && node[last] && typeof node[last] === "object")
          ? Object.assign({}, node[last], value) : value;
        await writeData(data, lib);
      });
      return json(res, 200, { ok: true });
    }

    if (url.pathname === "/exec" && req.method === "POST") {
      const { code, timeout, fileKey } = JSON.parse(await body(req));
      if (!code) return json(res, 400, { error: "code required" });
      // fileKey is how the page says WHICH library it means. Without it any
      // open file will do, which is only safe when exactly one is open.
      // A timeout is the bridge giving up, not Figma stopping: the code runs
      // on inside the plugin and its writes still land. A rebind reported
      // "Execution timed out" twice and was taken for a failure, then found
      // applied; a retry would have started a second run beside the first.
      const STILL = " The code may still be running in Figma and its writes may still land: read what it changed before running it again.";
      try {
        const result = await exec(code, timeout || 30000, fileKey || null);
        if (result && result.success === false && /timed out/i.test(result.error || "")) result.error += STILL;
        return json(res, 200, { ok: true, result });
      }
      catch (e) { return json(res, 200, { ok: false, error: e.message === "plugin_timeout" ? "plugin_timeout:" + STILL : e.message }); }
    }

    // Claude, proxied so the key never reaches the page.
    if (url.pathname === "/claude" && req.method === "POST") {
      if (!ANTHROPIC_KEY) return json(res, 200, { ok: false, error: "no_api_key" });
      const { prompt, system, max_tokens, use } = JSON.parse(await body(req));
      const judge = use === "judge" ? JSON.parse(await readFile(join(SCANNER, "judge.json"), "utf8")) : null;
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "content-type": "application/json", "x-api-key": ANTHROPIC_KEY, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({
          model: (judge && judge.model) || MODEL, max_tokens: max_tokens || 2000,
          ...(judge && judge.effort && { output_config: { effort: judge.effort } }),
          // NO SAMPLING PARAMETERS. `temperature: 0` was added here on
          // 2026-09-22 to make the judge repeatable — the same 12 candidates
          // survived as 12, 9, 11, 12, 12, 8, 12, 8, 12, 11 over ten runs of
          // one unchanged file — and it was never exercised against the
          // running service. Sonnet 5, like every current model except
          // Haiku 4.5, rejects `temperature`, `top_p` and `top_k` with a 400
          // ("`temperature` is deprecated for this model"), so from the
          // moment the service restarted every judgement call failed and
          // every audit ended at "Audit did not run". Found by pressing the
          // page's Audit button rather than reading this route. Repeatability
          // has to come from the prompt and the rulings, not the sampler.
          system: system || undefined,
          messages: [{ role: "user", content: prompt }]
        })
      });
      const out = await r.json();
      // A rejected key is the one failure the reader can act on, so it gets a
      // stable code rather than whatever prose the API happened to return.
      if (!r.ok) {
        const code = (r.status === 401 || r.status === 403) ? "bad_api_key"
                   : r.status === 429 ? "rate_limited" : null;
        return json(res, 200, { ok: false,
          error: code || ((out.error && out.error.message) || ("http " + r.status)) });
      }
      const text = (out.content || []).filter((c) => c.type === "text").map((c) => c.text).join("");
      // `stop_reason` is the only reliable way to know the answer was cut off.
      // Inferring it from a failed parse cannot distinguish "ran out of budget"
      // from "answered in prose", and those need different responses.
      // What the call cost, so a run can say what it cost. Output includes
      // thinking tokens, which the API bills as output.
      const u = out.usage || {}, p = PRICE[out.model] || PRICE[MODEL];
      const spend = { model: out.model || MODEL, input: u.input_tokens || 0, output: u.output_tokens || 0,
                      usd: p ? ((u.input_tokens || 0) * p[0] + (u.output_tokens || 0) * p[1]) / 1e6 : null };
      return json(res, 200, { ok: true, text, truncated: out.stop_reason === "max_tokens", spend });
    }

    if (req.method === "GET" || req.method === "HEAD") {
      // Before the site's first build there is nothing to serve; say so rather
      // than a bare 404 (the build starts with the service).
      if (!existsSync(join(SITE, "index.html"))) {
        res.writeHead(503, { "Content-Type": "text/plain; charset=utf-8", "Retry-After": "30" });
        return res.end(`The docs site for this project is being built (${SITE}); reload in a minute.`);
      }
      // Never outside the site folder, whatever the path says.
      let file = resolve(SITE, "." + decodeURIComponent(url.pathname));
      if (file === SITE || file.startsWith(SITE + sep)) {
        if (existsSync(file) && !/\.[a-z0-9]+$/i.test(file)) file = join(file, "index.html");
        if (existsSync(file)) {
          const ext = (file.match(/\.[a-z0-9]+$/i) || [""])[0].toLowerCase();
          res.writeHead(200, { "Content-Type": TYPES[ext] || "application/octet-stream", "Cache-Control": "no-store" });
          return res.end(await readFile(file));
        }
      }
      // A page that is not there gets the site's own 404 page, in its shell.
      const missing = join(SITE, "404.html");
      if (req.headers.accept?.includes("text/html") && existsSync(missing)) {
        res.writeHead(404, { "Content-Type": TYPES[".html"], "Cache-Control": "no-store" });
        return res.end(await readFile(missing));
      }
    }
    res.writeHead(404); res.end("not found");
  } catch (e) {
    json(res, 500, { error: e.message });
  }
});

// The socket needs the same Origin discipline as the HTTP routes, and did not
// have it. A WebSocket is exempt from the same-origin policy but still SENDS an
// Origin, so any page the user visits could open one here, be handed a plugin
// slot, and answer `/exec` with results of its own choosing — which the record
// then stores as if Figma had said them. Binding to 127.0.0.1 does not help:
// the attacker's code runs in the victim's browser.
//
// The plugin is not same-origin — it dials in from Figma's sandbox — so this
// cannot simply require our own origin. It admits the sandbox (absent or the
// literal "null") and figma.com, and refuses ordinary web origins, which is
// exactly the drive-by case. A refusal is LOGGED rather than silent, because
// the one way this can be wrong is by turning the real plugin away.
const socketOriginOk = (o) => {
  if (o === undefined || o === "null") return true;      // Figma's sandboxed iframe
  if (ALLOWED.has(o)) return true;                       // this page
  return isFigmaOrigin(o);
};

server.on("upgrade", (req, socket) => {
  const key = req.headers["sec-websocket-key"];
  if (!key) return socket.destroy();
  // the HTTP routes' Host rule: a name rebound to 127.0.0.1 sends its own Host
  if (!LOCAL_HOST(req.headers.host)) {
    console.error("refused a socket for host " + req.headers.host);
    return socket.destroy();
  }
  if (!socketOriginOk(req.headers.origin)) {
    console.error("refused a socket from origin " + req.headers.origin +
                  " — if this was the Desktop Bridge plugin, add its origin to socketOriginOk.");
    return socket.destroy();
  }
  socket.write("HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\n" +
    "Sec-WebSocket-Accept: " + createHash("sha1").update(key + GUID).digest("base64") + "\r\n\r\n");
  attach(socket);
});

// Bind to loopback only. This speaks to a design file and writes a repo file;
// it has no business being reachable from the network.
// A port clash here almost always means an older copy of this service is still
// running — say that, rather than emitting an unhandled 'error' and a stack.
server.on("error", (e) => {
  if (e.code === "EADDRINUSE") {
    console.error("Port " + PORT + " is already in use — most likely an earlier copy of this service.");
    // a login agent killed by hand is started again by launchd at once: it is stopped through launchctl
    console.error("What holds it:  lsof -nP -iTCP:" + PORT + " -sTCP:LISTEN");
    console.error("The login agent (install.sh):  launchctl bootout gui/$(id -u)/com.toolkit.figma-audit    (./install.sh loads it again)");
    console.error("A copy started by hand:  pkill -f 'figma-audit/server.mjs'    (then run this again)");
  } else console.error(e.message);
  process.exit(1);
});

// A plugin call may run for ten minutes (the live read of a 120-set library
// is allowed 600 s) and Node closes any request after 300 s by default, so
// the page saw "Failed to fetch" with nothing in this log. No request limit:
// every route that waits on the plugin carries its own timeout.
server.requestTimeout = 0;
server.headersTimeout = 60000;
server.listen(PORT, "127.0.0.1", () => {
  console.log("figma audit      http://localhost:" + PORT);
  console.log("records          " + AUDIT_DIR + (LEGACY ? " (single record: audit.json)" : "/<library>.json"));
  console.log("claude           " + (ANTHROPIC_KEY ? "enabled"
    : RAW_KEY ? "disabled — the key in ~/.figma-dashboard-key is not a valid key"
    : "disabled — put a key in ~/.figma-dashboard-key or set ANTHROPIC_API_KEY"));
});

/*
 * Breaking changes, from the change log into the audit queue (breaking.mjs).
 *
 * The store grades every snapshot it records; a change that is major for the
 * designers' files or for the code is filed here as a row to decide, once,
 * into the record of the library it came from. Here because this service is
 * the record's one writer: the router filing from its own process would be
 * the cross-process write `inOrder` says it does not cover. Run when the
 * service starts and a moment after the change log settles.
 */
{
  const { watch } = await import("node:fs");
  const breaking = await import("./breaking.mjs");
  const where = contract.layout(null, LABEL);
  const P = (where && !where.error && where.paths) || {};
  const fileBreaking = async () => {
    try {
      if (!P.changes || !existsSync(P.changes)) return;
      const log = JSON.parse(await readFile(P.changes, "utf8"));
      const records = contract.auditRecords(where);
      const routes = contract.entries(where.files && where.files.library);
      // An entry names its file by key or id (snapshot-standard 19); the
      // record is named by the library's key, and only a library the
      // project audits has one.
      const libOf = breaking.libOfFor(routes, records);
      let index = {};
      try { index = JSON.parse(await readFile(P.index, "utf8")).components || {}; } catch { index = {}; }
      const nameOf = (folder) => (index[folder] && index[folder].name) || folder;
      // First the upkeep (breaking.mjs `upkeep`): rows filed under an old key
      // take the key's present form, and rows no live grade raises are
      // closed saying why, so the filing below finds what is already there.
      for (const r of records) {
        if (!existsSync(r.path)) continue;
        await inOrder(r.key, async () => {
          const data = await readData(r.key);
          const { rekey, close } = breaking.upkeep(log, data, { libOf, lib: r.key });
          if (!rekey.length && !close.length) return;
          const out = await applyRows(data, { owner: breaking.OWNER, fileKey: r.key, origin: "snapshot", rekey, close });
          await writeData(data, r.key);
          console.log(`breaking       ${LABEL}: ${out.rekeyed || 0} re-keyed, ${out.closed} closed for ${r.key}`);
        });
      }
      const filed = new Set();
      for (const r of records) {
        try { for (const k of breaking.filedKeys(JSON.parse(await readFile(r.path, "utf8")))) filed.add(k); } catch { /* no record yet */ }
      }
      for (const [lib, findings] of breaking.breakingFindings(log, { libOf, nameOf, filed })) {
        await inOrder(lib, async () => {
          const data = await readData(lib);
          const out = await applyRows(data, { owner: breaking.OWNER, fileKey: lib, origin: "snapshot", findings });
          await writeData(data, lib);
          console.log(`breaking       ${LABEL}: ${out.added} filed from the change log for ${lib}`);
        });
      }
    } catch (e) { console.error(`breaking       ${LABEL}: ${e.message}`); }
  };
  if (P.changes) {
    let t = null;
    const soon = () => { clearTimeout(t); t = setTimeout(fileBreaking, 2000); };
    if (existsSync(dirname(P.changes))) watch(dirname(P.changes), (_, name) => { if (String(name) === basename(P.changes)) soon(); });
    fileBreaking();
  }
}

/*
 * Consistency, from the stored contracts into the audit queue
 * (tools/component-contract/analyze.mjs): is each library consistent with itself — one
 * prop in two forms, two spellings, two scales. The audit's
 * scanner checks one component set at a time, live; these compare components
 * with each other, which needs the whole library at once, so they read what
 * the snapshot stored. Filed as figma-components-audit's rows under the
 * target `consistency`, so a scanner run and these never close each other's
 * rows, as a full run over the library's public components: a finding no
 * longer raised closes. Run when the service starts and a moment after the
 * snapshot index settles, which every library snapshot rewrites.
 */
{
  const { watch } = await import("node:fs");
  const where = contract.layout(null, LABEL);
  const P = (where && !where.error && where.paths) || {};
  const fileConsistency = async () => {
    try {
      if (!P.index || !existsSync(P.index)) return;
      const { consistency, RAN } = await import(pathToFileURL(join(HERE, "..", "component-contract", "analyze.mjs")).href + "?m=" + statSync(join(HERE, "..", "component-contract", "analyze.mjs")).mtimeMs);
      const index = JSON.parse(await readFile(P.index, "utf8")).components || {};
      for (const r of contract.auditRecords(where)) {
        if (!existsSync(r.path)) continue;
        // a library's public components: a part (`_Name`) is its parent's business
        const mine = Object.entries(index).filter(([, e]) => e.file === r.key && !/^\s*_|\/\s*_/.test(e.name));
        const components = [];
        for (const [folder, e] of mine) {
          try {
            components.push({ name: e.name,
              contract: JSON.parse(await readFile(join(P.components, folder, "contract.json"), "utf8")),
              raw: JSON.parse(await readFile(join(P.components, folder, "figma.json"), "utf8")).props });
          } catch { /* a component with no contract yet is not compared */ }
        }
        if (!components.length) continue;
        const findings = consistency(components);
        await inOrder(r.key, async () => {
          const data = await readData(r.key);
          const out = await applyRows(data, { owner: "figma-components-audit", target: "consistency", fileKey: r.key, origin: "snapshot",
            full: true, scope: components.map((c) => c.name), ran: RAN, findings });
          await writeData(data, r.key);
          console.log(`consistency    ${LABEL}: ${findings.length} raised, ${out.added} new, ${out.closed} closed for ${r.key}`);
        });
      }
    } catch (e) { console.error(`consistency    ${LABEL}: ${e.message}`); }
  };
  if (P.index) {
    let t = null;
    const soon = () => { clearTimeout(t); t = setTimeout(fileConsistency, 3000); };
    if (existsSync(dirname(P.index))) watch(dirname(P.index), (_, name) => { if (String(name) === basename(P.index)) soon(); });
    fileConsistency();
  }
}

/*
 * The tokens library and the icon library, from the stored snapshot
 * (figma-foundations-audit, scripts/library.mjs): descriptions, unused
 * tokens, styles' bindings, names and shape; icon sizes, bound paints and
 * names. Their files have nothing for the live scan to read, and the store
 * holds every fact these need. Filed into each library's own record, under
 * the target `tokens` or `icons`, as a full run: a finding no longer raised
 * closes. Run when the service starts and a moment after the tokens settle.
 */
{
  const { watch } = await import("node:fs");
  const where = contract.layout(null, LABEL);
  const P = (where && !where.error && where.paths) || {};
  const LIB = join(HERE, "..", "..", "skills", "figma-foundations-audit", "scripts", "library.mjs");
  const fileLibrary = async () => {
    try {
      if (!P.tokens || !existsSync(P.tokens)) return;
      const L = await import(pathToFileURL(LIB).href + "?m=" + statSync(LIB).mtimeMs);
      const { slug } = await import(pathToFileURL(join(HERE, "..", "snapshot", "spec.cjs")).href);
      const tokens = JSON.parse(await readFile(P.tokens, "utf8"));
      const records = contract.auditRecords(where);
      const ctx = contract.auditContext(where.doc);
      // What the components libraries bind: every string their specs hold.
      const index = existsSync(P.index) ? JSON.parse(await readFile(P.index, "utf8")).components || {} : {};
      const scanned = new Set(records.filter((r) => r.roles.includes("components")).map((r) => r.key));
      const specs = [];
      for (const [folder, e] of Object.entries(index)) {
        if (!scanned.has(e.file)) continue;
        const spec = store.readSpec(P.components, folder, { compact: true });
        if (spec) specs.push(spec);
      }
      const used = L.namesUsed(specs);
      for (const r of records) {
        const runs = [];
        if (r.roles.includes("tokens")) runs.push(["tokens", L.tokenChecks({ tokens, source: r.key, used })]);
        if (r.roles.includes("icons")) {
          const set = ((ctx.icons || {})[r.key] || {}).names;
          runs.push(["icons", L.iconChecks({ tokens, source: r.key, names: set ? await L.iconSetNames(set, lucideVersion()) : null, slug })]);
        }
        for (const [target, { findings, ran, scope }] of runs) {
          if (!ran.length) { console.log(`${target.padEnd(15)}${LABEL}: nothing stored from ${r.key} yet`); continue; }
          await inOrder(r.key, async () => {
            const data = await readData(r.key);
            const out = await applyRows(data, { owner: "figma-foundations-audit", target, fileKey: r.key, origin: "snapshot",
              full: true, exhaustive: true, scope, ran, findings });
            await writeData(data, r.key);
            console.log(`${target.padEnd(15)}${LABEL}: ${findings.length} raised, ${out.added} new, ${out.closed} closed for ${r.key}`);
          });
        }
      }
    } catch (e) { console.error(`library        ${LABEL}: ${e.message}`); }
  };
  if (P.tokens) {
    let t = null;
    const soon = () => { clearTimeout(t); t = setTimeout(fileLibrary, 3000); };
    if (existsSync(dirname(P.tokens))) watch(dirname(P.tokens), (_, name) => { if (String(name) === basename(P.tokens)) soon(); });
    fileLibrary();
  }
}

/*
 * The code audit keeps itself current: re-run when the snapshot, the parity
 * map or the code it builds from changes (tools/parity/watch.mjs).
 */
{
  const { watchCodeAudit } = await import(pathToFileURL(join(HERE, "..", "parity", "watch.mjs")).href);
  try { watchCodeAudit(LABEL, await readContext(), (line) => console.log(`code audit     ${LABEL}: ${line}`)); }
  catch (e) { console.error(`code audit     ${LABEL}: ${e.message}`); }
}

/*
 * The docs site keeps itself current.
 *
 * Its pages are static, and "rebuild after every snapshot" is a step nobody
 * should have to remember. This builds the site when the service starts, and
 * again a few seconds after anything it is built from settles: the project's
 * snapshot (wherever its layout puts it), this audit record, the context
 * document, the parity report, the built Storybook's index, and the engine
 * itself (tools/docs-site/src, the dashboard page, the shared stylesheet).
 *
 * Three things a naive rebuild got wrong, each seen in the logs:
 *  - Astro empties its output folder first, so the site vanished for the
 *    length of every build: it now builds beside the site and swaps it in.
 *  - Every project's service builds in the one engine folder, and two at once
 *    trampled each other's working files: a lock (a directory, which mkdir
 *    creates atomically) lets one build run at a time across processes.
 *  - A failed build was never retried: it is, once, after a pause.
 */
{
  const { watch } = await import("node:fs");
  const { spawn } = await import("node:child_process");
  const label = LABEL;
  const docs = join(HERE, "..", "docs-site");
  // Astro's own command-line entry, read from its package, not guessed.
  const astroPkg = join(docs, "node_modules", "astro", "package.json");
  const astro = existsSync(astroPkg) ? join(docs, "node_modules", "astro", JSON.parse(readFileSync(astroPkg, "utf8")).bin.astro) : null;
  const where = contract.layout(null, label);
  if (where.error) console.error(`docs site      ${label}: ${where.error}; only the record and the context document are watched`);
  const P = where.paths || {};
  // AUDIT_DIR is a DIRECTORY, and `files` watches each entry's PARENT while
  // filtering on its basename — so this watched `projects/<label>/` for a
  // change named `audit`, and a write to `audit/<fileKey>.json` is a
  // grandchild that a non-recursive fs.watch on macOS never reports.
  // Confirmed by replicating the exact setup: the record write produced no
  // event at all. An audit alone therefore never rebuilt the site, so the
  // Tracker page and the baked offline copy refreshed only when something
  // else on the list happened to change.
  const files = [CONTEXT, P.tokens, P.changes, P.index, P.parity, P.storybook && join(P.storybook.dir, "index.json")].filter((f) => typeof f === "string");
  // The engine's source holds the dashboard too (src/dashboard), so one tree covers both.
  // the project's parity folder: the code audit's report, which the Parity pages read
  const trees = [AUDIT_DIR, where.parity, P.components, P.previews, P.icons, join(docs, "src")].filter((d) => typeof d === "string");

  // The engine's own build (tools/docs-site/build.mjs) holds the lock that keeps two builds of any project
  // apart, hand builds included, and swaps the finished site in; this only says when to build.
  let timer = null, building = false, again = false, retried = 0;
  const build = () => {
    if (building) { again = true; return; }
    // The build reads this same layout: a project that does not resolve crashed every build, retried
    // forever (test-routes, 2026-10-31). Said on /status, and tried again on the next change.
    let now; try { now = contract.layout(null, label); } catch (e) { now = { error: e.message }; }
    if (now.error) { lastBuildError = `not built: ${now.error}`; return; }
    building = true;
    const started = Date.now();
    const env = { ...process.env, DOCS_PROJECT: label };
    delete env.DOCS_OUT;
    const child = spawn(process.execPath, [join(docs, "build.mjs")], { cwd: docs, env, stdio: ["ignore", "ignore", "pipe"] });
    let err = "";
    child.stderr.on("data", (d) => { err += d; });
    let finished = false;
    const done = (ok, why) => {
      // BOTH `exit` and `error` can fire for one child. The second call used
      // to release the lock a DIFFERENT project's build already held, so two
      // Astro builds ran at once in the one shared engine folder — which is
      // what the lock exists to prevent, and what a missing `.prerender`
      // chunk in the logs actually was.
      if (finished) return;
      finished = true;
      building = false;
      if (ok) {
        retried = 0; lastBuildError = null;
        console.log(`docs site      ${label} built in ${((Date.now() - started) / 1000).toFixed(1)}s`);
        deploy();
      } else {
        // Backoff, not surrender. `retried` was set on the first failure and
        // cleared only on success, so after two failures every later one was
        // logged and never retried — 127 failures and 57 silent give-ups in
        // one real log. A build that cannot succeed now may well succeed in a
        // minute, and the alternative is a site frozen until someone notices.
        retried = Math.min((retried || 0) + 1, 6);
        const wait = 10000 * Math.pow(2, retried - 1);
        lastBuildError = why;
        console.error(`docs site      ${label} build failed (${retried}); retrying in ${wait / 1000}s: ${why}`);
        clearTimeout(timer); timer = setTimeout(build, wait);
      }
      if (again) { again = false; build(); }
    };
    child.on("exit", (code) => done(code === 0, `exit ${code}\n${err.split("\n").slice(-12).join("\n")}`));
    child.on("error", (e) => done(false, e.message));
  };
  const soon = () => { clearTimeout(timer); timer = setTimeout(build, 3000); };

  // A project whose block says `publish` gets the site it just built
  // published (bin/deploy), one upload at a time; a build that lands during an
  // upload is published after it. Read per build, so editing the block takes
  // effect without a restart.
  let deploying = false, redeploy = false;
  const deploy = () => {
    const mode = contract.layout(null, label).publish;
    if (!mode) return;
    if (deploying) { redeploy = true; return; }
    deploying = true;
    // launchd's PATH may not hold node, and bin/deploy runs npx.
    const env = { ...process.env, PATH: `${dirname(process.execPath)}:${process.env.PATH || ""}` };
    const child = spawn("sh", [join(HERE, "..", "..", "bin", "deploy"), label, `--${mode}`], { env, stdio: ["ignore", "ignore", "pipe"] });
    let err = "";
    child.stderr.on("data", (d) => { err += d; });
    let over = false;
    const end = (ok, why) => {
      if (over) return;
      over = true; deploying = false;
      if (ok) console.log(`docs site      ${label} published (${mode})`);
      else console.error(`docs site      ${label} publish failed; the published site keeps the last good upload: ${why}`);
      if (redeploy) { redeploy = false; deploy(); }
    };
    child.on("exit", (code) => end(code === 0, `exit ${code}\n${err.split("\n").slice(-8).join("\n")}`));
    child.on("error", (e) => end(false, e.message));
  };

  if (!astro) console.error(`docs site      no Astro install in ${docs} (run pnpm install there); the site will not build`);
  else {
    // Files are watched through their folders: a file replaced by a rename
    // (this service writes the record that way) would drop a watch on the file.
    const byDir = new Map();
    for (const f of files) {
      const d = dirname(f);
      if (!byDir.has(d)) byDir.set(d, new Set());
      byDir.get(d).add(basename(f));
    }
    for (const [d, names] of byDir) {
      if (!existsSync(d)) continue;
      watch(d, (_, name) => { if (name && names.has(String(name))) soon(); });
    }
    for (const d of trees) if (existsSync(d)) watch(d, { recursive: true }, soon);
    // its official contracts, where it takes the contract as its source (component-contract's official.mjs): watched
    // from the home, so a folder a switch makes while the service runs is seen without a restart
    if (where.projectDir && existsSync(where.projectDir)) watch(where.projectDir, { recursive: true }, (_, name) => { if (/^contracts([\\/]|$)/.test(String(name || ""))) soon(); });
    console.log(`docs site      ${label}: built now, and again on change to ${files.length} files and ${trees.length} folders`);
    build();
  }
}
