/*
 * The snapshot contract — one implementation, used by the router, the store
 * and every reader of a project's snapshot.
 *
 * The chain it governs: the Figma plugin posts a payload to a fixed port; the
 * router decides which project owns the file it came from; the store writes it
 * at that project's paths (deliver.cjs). Places that must agree about identity,
 * and when they
 * each had their own answer they disagreed in ways nobody could see — a
 * receiver that guarded by collection names, another that copied the last
 * snapshot's key onto an unidentified payload, and a router that knew neither.
 * A payload from one project could land in another's repo and overwrite its
 * design source.
 *
 * So there is one answer here and everything reads it.
 *
 * CommonJS on purpose: repo scripts with no build step read it, and ESM can
 * import it as it stands. One file, both worlds, no duplicate.
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

// `~` and `~/…` only, as tools/shared/real-path.mjs expandHome reads it: `~user/…` is someone else's home, left as written
const expand = (p) => (typeof p === 'string' && /^~(?=$|\/)/.test(p) ? path.join(os.homedir(), p.slice(1)) : p);
const readJson = (file) => { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; } };

/*
 * Where a project lives — one rule, no per-project setting.
 *
 * A project is a repo beside the toolkit (`~/Projects/<label>/`) with a
 * `figma-design-system/` folder at its root holding its context document,
 * snapshot, audit records and parity files; the label is the repo's folder
 * name. Discovery is that pattern, so a new project is that folder and nothing
 * else. Named so it is never taken for the coded components.
 *
 * `TOOLKIT_PROJECTS_ROOT` moves the root, for tests.
 */
const TOOLKIT = path.join(__dirname, '..', '..');
const HOME = 'figma-design-system';
// An isolated worktree (`toolkit/.claude/worktrees/<x>`) has the main checkout's root.
const MAIN = TOOLKIT.replace(/[\\/]\.claude[\\/]worktrees[\\/][^\\/]+$/, '');
const root = () => expand(process.env.TOOLKIT_PROJECTS_ROOT) || path.dirname(MAIN);
const CONTEXT = 'design-system-context.md';
/** The folder holding a project's design-system files. */
function homeOf(label) {
  return path.join(root(), label, HOME);
}
/** The label a home folder belongs to: its repo's name. A folder of `<label>/` homes (a test's) names its own. */
const labelOf = (home) => (path.basename(home) === HOME ? path.basename(path.dirname(home)) : path.basename(home));
/** Every project home: each `<root>/<label>/figma-design-system`. */
function homes() {
  let entries = [];
  try { entries = fs.readdirSync(root(), { withFileTypes: true }); } catch { return []; }
  return entries.filter((e) => e.isDirectory())
    .map((e) => ({ name: e.name, home: path.join(root(), e.name, HOME) }))
    .filter((h) => fs.existsSync(path.join(h.home, CONTEXT)));
}
/** Every git repo a project's work lands in: its code repo, else the repo its home sits in. */
function repos() {
  const out = [];
  for (const p of projects().list) {
    const dir = p.repo ? expand(p.repo) : path.basename(p.home) === HOME ? path.dirname(p.home) : null;
    if (dir) out.push({ name: p.name, dir: path.resolve(dir) });
  }
  return out;
}

/*
 * What a repo states about itself: `<repo>/snapshot.config.json`.
 *
 *   { "toolkit": "~/Projects/toolkit", "project": "<label>",
 *     "paths": { "tokens": "design/figma.json", "components": "src/design-system", … } }
 *
 * None of it is a fact about Figma. `paths` says where this repo keeps each
 * part of its snapshot, overriding the canonical layout (store.cjs) key by
 * key, because a repo's specs live beside its code. Which files this project
 * owns, and therefore which payloads it accepts, is in the project's context
 * document, because a fact stated twice is a fact that drifts, and the copy
 * that drifts is the one that lets a stranger in.
 */
function locate(repo) {
  // missing and malformed told apart (tools/shared/repo-config.cjs, the one reader of the file)
  const { config, error, file } = require('../shared/repo-config.cjs').readRepoConfig(repo);
  if (error) return { error };
  if (!config.toolkit || !config.project) {
    return { error: `${file} must name a "toolkit" and a "project"` };
  }
  const toolkit = expand(config.toolkit);
  return {
    toolkit,
    project: config.project,
    paths: config.paths || {},
    // The rest of the file, for the callers that need what this function does
    // not name — the project's `after` steps, its `figmaToken` command. They
    // parsed it themselves until 2026-09-20, and swallowed the errors.
    raw: config,
    contextDoc: path.join(homeOf(config.project), CONTEXT),
  };
}

/*
 * The machine-readable block in a project's context document:
 *
 *   ```json snapshot-routing
 *   { "repo": "~/Projects/<repo>",
 *     "files": { "library": { "key": "<Figma fileKey>", "id": "<stamped id>" },
 *                "screens": { "key": "…", "id": "…" } } }
 *   ```
 *
 * A file has two names and the block states both. `key` is Figma's own
 * fileKey — the one name its REST API accepts, sent by the plugin since 0.67.0. `id` is what the plugin stamps into the document once; a
 * duplicated file carries its original's. A payload with a key is routed by it
 * alone; one from a plugin before 0.67.0, by the id. Only `key` can be handed
 * to Figma.
 *
 * `kinds` is open on purpose: a third kind of payload needs an entry here and
 * nothing else, in any project, at any time.
 */
function routing(contextDoc) {
  let md;
  try { md = fs.readFileSync(contextDoc, 'utf8'); } catch { return { error: `cannot read ${contextDoc}` }; }
  const block = md.match(/```json snapshot-routing\s*\n([\s\S]*?)\n```/);
  if (!block) return { error: `${contextDoc} has no \`snapshot-routing\` block`, missing: true };
  let parsed;
  try { parsed = JSON.parse(block[1]); } catch (e) {
    /* A block that does not parse is a finding about the document, never a
       project that quietly claims nothing. */
    return { error: `the snapshot-routing block in ${contextDoc} is not valid JSON: ${e.message}` };
  }
  if (!parsed || !parsed.files) return { error: `the snapshot-routing block in ${contextDoc} names no files` };
  // No repo is a design-only project: the toolkit stores its snapshot itself.
  return { repo: parsed.repo ? expand(parsed.repo) : null, files: parsed.files, doc: contextDoc };
}

/*
 * The project's own facts, in its context document:
 *
 *   ```json project
 *   { "name": "<Display name>", "phase": "build" }
 *   ```
 *
 * `phase` is one of PHASES and switches outputs on and off: a design-only
 * project gets a handoff spec and a tracker, a project being built gets parity
 * as well, a project in maintenance loses the tracker. Every output reads the
 * same field, so the phase is stated once. Absent, the name is the folder's
 * and the phase is `design`, the one that assumes nothing about code.
 *
 * `markers` is the page-marker legend, in ladder order, when a project's
 * markers say more than figma-standard rule 11's two (a review ladder with a client,
 * say). A component's status is read from its page name through it, so the
 * designer's own marker is the status and nobody maintains a second one.
 * `done` names the marker, or markers, that mean complete, where that is not
 * simply the last rung (a ladder that ends in "blocked", or two finished states
 * such as "no comments" and "input addressed"). Always returned as a list.
 *
 * `publish` is who may read the published docs site: `password` or `public`
 * (bin/deploy's two modes). Set, the dashboard service redeploys the site
 * after every build; absent, nothing is published unless by hand.
 *
 * `port` is where the figma-audit service serves the project's docs site and
 * audit (9223–9232, the range Figma's Desktop Bridge plugin scans). Set, the
 * service started with `--all` serves it; absent, the project is not served.
 * `editorPort` is where the contract editor serves the project's library
 * (tools/contract-editor/serve.mjs --project, which listens there unless given
 * --port); absent, the editor's default, EDITOR_PORT. The docs site links each
 * component to it, and the editor each component back to the docs at `port`.
 */
const PHASES = ['design', 'build', 'maintenance'];
const EDITOR_PORT = 9250;
const PUBLISH = ['password', 'public'];
// The default legend is the settings' (figma-standard rule 11): the in-progress
// and finished markers, never literals here. MARKERS is the house's; a
// project's is built from its own merged settings (`legendOf`), so a library
// whose `pages.statusMarker` differs is read by its own marker.
const legend = (tokens) => {
  const out = {};
  for (const t of tokens) if (t.statusMarker) out[t.statusMarker] = 'In progress';
  for (const t of tokens) if (t.finishedMarker) out[t.finishedMarker] = 'Finished';
  return out;
};
const MARKERS = (() => {
  try { return legend([JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'standards', 'audit-settings.json'), 'utf8'))['audit-defaults'].pages]); } catch { return {}; }
})();
function legendOf(contextDoc) {
  const libs = Object.values(auditContext(contextDoc).libraries || {});
  return libs.length ? legend(libs.map((l) => l.tokens || {})) : MARKERS;
}

function project(contextDoc) {
  let md;
  try { md = fs.readFileSync(contextDoc, 'utf8'); } catch { return { error: `cannot read ${contextDoc}` }; }
  const block = md.match(/```json project\s*\n([\s\S]*?)\n```/);
  const finished = (m) => Object.keys(m).filter((k) => m[k] === 'Finished');
  if (!block) { const markers = legendOf(contextDoc); return { name: null, phase: 'design', markers, done: finished(markers), editorPort: EDITOR_PORT }; }
  let parsed;
  try { parsed = JSON.parse(block[1]); } catch (e) {
    return { error: `the project block in ${contextDoc} is not valid JSON: ${e.message}` };
  }
  if (parsed.phase && !PHASES.includes(parsed.phase)) {
    return { error: `the project block in ${contextDoc} names phase ${JSON.stringify(parsed.phase)}; expected ${PHASES.join(', ')}` };
  }
  if (parsed.port !== undefined && !(Number.isInteger(parsed.port) && parsed.port >= 9223 && parsed.port <= 9232)) {
    return { error: `the project block in ${contextDoc} names port ${JSON.stringify(parsed.port)}; expected a whole number in 9223–9232 (the range the Desktop Bridge plugin scans)` };
  }
  if (parsed.editorPort !== undefined && !(Number.isInteger(parsed.editorPort) && parsed.editorPort >= 1024 && parsed.editorPort <= 65535 && !(parsed.editorPort >= 9223 && parsed.editorPort <= 9232))) {
    return { error: `the project block in ${contextDoc} names editorPort ${JSON.stringify(parsed.editorPort)}; expected a whole number in 1024–65535 outside 9223–9232, where the docs sites and the audit service serve` };
  }
  if (parsed.publish && !PUBLISH.includes(parsed.publish)) {
    return { error: `the project block in ${contextDoc} names publish ${JSON.stringify(parsed.publish)}; expected ${PUBLISH.join(', ')}` };
  }
  const markers = parsed.markers || legendOf(contextDoc);
  const done = [].concat(parsed.done || (parsed.markers ? Object.keys(markers).at(-1) : finished(markers)));
  return { name: parsed.name || null, phase: parsed.phase || 'design', markers, done, publish: parsed.publish || null, port: parsed.port || null, editorPort: parsed.editorPort || EDITOR_PORT };
}

/** Every name a file answers to. */
const names = (entry) => (entry ? [entry.key, entry.id].filter(Boolean) : []);

/*
 * A kind may name one file or several: a design system spread over a Core
 * file and a components file snapshots both as `library`. Every lookup goes
 * through this, so one entry and a list read the same everywhere.
 */
const entries = (value) => (Array.isArray(value) ? value : value ? [value] : []);

/** Every name a kind's files answer to. */
const namesOf = (value) => entries(value).flatMap(names);

/** The Figma fileKey — the one name Figma's own API accepts. */
const figmaKey = (value) => (entries(value).find((e) => e.key) || {}).key || null;

/*
 * ONE FILE, ONE IDENTITY.
 *
 * A file answers to a key and an id — `identify` above takes whichever the run
 * that wrote a payload carried — and to a display name that changes the day
 * someone renames it in Figma. A record keyed by the name splits its own
 * history on that rename: one project's change log held "02. Web library" from its
 * live writes and "03. Web library" from a backfill run minutes earlier,
 * two chips for one file. A record keyed by one identity and the other joins
 * to nothing, which is how 61 of 62 components landed under "Other" on the
 * components index the same afternoon.
 *
 * So anything stored per file is stored by identity and named at the point it
 * is read. `fileIdent` folds a key, an id or a name a route still carries onto
 * one identity; `fileLabel` turns any of them into what the file is called
 * now. A name nothing recognises is returned as it stands — a log written
 * before this and never rebuilt still reads, under whatever the file was
 * called then.
 */
const fileIdent = (list, f, sources = {}) => {
  const e = entries(list).find((x) => x.key === f || x.id === f || (x.name && x.name === f));
  if (e) return e.key || e.id;
  // A record written before this: its `file` is a display name. Where the
  // store still records that name for exactly ONE of its sources, it is that
  // file. Two files may carry one name — a core and a components file both
  // called "UI library" is what the router's own fixtures do — and there a
  // name identifies nothing, so it stands as it is rather than being folded
  // onto whichever source was read first.
  const under = Object.keys(sources).filter((id) => sources[id] && sources[id].file === f);
  return under.length === 1 ? fileIdent(list, under[0]) : f;
};

/**
 * What to call a file: the store's own record of its name (`_meta.sources`),
 * the audit settings' display name, or the route's, and failing all three the
 * identity itself.
 */
const fileLabel = ({ routes, sources = {}, audit = {} } = {}, f) => {
  const e = entries(routes).find((x) => x.key === f || x.id === f || (x.name && x.name === f));
  const src = sources[f] || (e && (sources[e.id] || sources[e.key]));
  return (e && audit[e.key] && audit[e.key].name) || (src && src.file) || (e && (e.name || e.key || e.id)) || f;
};

/**
 * What addresses a payload.
 *
 * `figma.fileKey` was undefined for a plugin run from Development until its
 * manifest asked for it (v0.67.0), so for a long time every payload arrived
 * anonymous and the plugin stamped its own `fileId` (v0.17.0). The key is
 * preferred, because it is Figma's own name for the file, survives the
 * plugin's data being cleared, and differs in a duplicate.
 *
 * A library payload nests its meta under `tokens`; a screens payload does not.
 */
function identify(payload) {
  const meta = ((payload && payload.tokens) || payload || {})._meta || {};
  return meta.fileKey || meta.fileId || null;
}

/**
 * Every project the toolkit knows, read fresh.
 *
 * Discovery is the projects directory: a context document with a routing block
 * IS a project, so adding one is adding its document and there is no registry
 * to remember. A document without a block claims nothing and is skipped rather
 * than treated as a catch-all — a project part-way through setup must never
 * become the place every unrecognised snapshot lands.
 */
// `projectsDir` names one folder of `<label>/` homes (a test's scratch
// folder); left out, every project the rule above finds.
function projects(projectsDir) {
  let found;
  if (projectsDir) {
    const dir = expand(projectsDir);
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch {
      return { list: [], errors: [`no projects directory at ${dir}`] };
    }
    found = entries.filter((e) => e.isDirectory()).map((e) => ({ name: e.name, home: path.join(dir, e.name) }));
  } else found = homes();
  const list = [];
  const errors = [];
  for (const entry of found) {
    const doc = path.join(entry.home, CONTEXT);
    if (!fs.existsSync(doc)) continue;
    const route = routing(doc);
    if (route.error) {
      /* Only complain about a document that TRIES and fails. One with no block
         at all is a project that has not joined yet. */
      if (!/has no `snapshot-routing` block/.test(route.error)) errors.push(route.error);
      continue;
    }
    if (!route.repo) {
      // Design-only: stored in its own folder here, at the canonical layout.
      list.push({ name: entry.name, home: entry.home, repo: null, doc, files: route.files, store: path.join(entry.home, 'snapshot') });
      continue;
    }
    list.push({ name: entry.name, home: entry.home, repo: route.repo, doc, files: route.files });
  }
  return { list, errors };
}

/**
 * Which project a payload belongs to.
 *
 * Two projects claiming one id is a misconfiguration, and choosing either is
 * the wrong answer to it: one repo would be written from the other's file with
 * nothing said. It refuses and names both.
 */
/*
 * Which kind a file is, as its project's routing block records it: library,
 * screens, or null for a file no project claims. The plugin asks before it
 * collects, because its own guess from the file's contents cannot tell a
 * components file from a screens file whose frames are not marked yet.
 */
function kindOf(list, ids) {
  for (const kind of ['library', 'screens']) {
    if (list.some((p) => namesOf(p.files[kind]).some((n) => ids.includes(n)))) return kind;
  }
  return null;
}

/* A copy carries its original's id: an id an entry lists beside ANOTHER key is that file's, never this one's. An entry
   with no key is no evidence: it is this file's own, routed by id before the plugin sent keys. */
const copied = (list, key, id) => Boolean(id && key && list.some((p) => KINDS.some((k) => entries(p.files[k]).some((e) => e.id === id && e.key && e.key !== key))));

function route(list, kind, id, stamped = null) {
  if (!id) return { error: 'this copy of the plugin is too old (before 0.17.0) to say which file it is. Reload it (Plugins › Development › Reload), then snapshot again.' };
  const claims = list.filter((p) => namesOf(p.files[kind]).includes(id));
  if (claims.length === 1) return { project: claims[0] };
  if (claims.length > 1) {
    return { error: `${claims.map((c) => c.name).join(' and ')} both list this file (${id}) as their ${kind}, so nothing was written. Remove it from one of their context documents.` };
  }
  // what identify chose is the key unless the run sent only its stamped id (a plugin before 0.67.0)
  const keyed = id !== stamped;
  if (keyed && copied(list, id, stamped)) stamped = null;
  // an entry routed by id alone cannot tell its file from a duplicate, which sends the same id
  const bare = keyed && stamped && list.some((p) => KINDS.some((k) => entries(p.files[k]).some((e) => e.id === stamped && !e.key)));
  const known = list.filter((p) => namesOf(p.files[kind]).length)
    .map((p) => `${p.name} ${namesOf(p.files[kind]).join(' / ')}`).join(', ');
  // The plugin is shown the cause and the fix; the projects known are for the
  // router's log, not for a sandboxed window on somebody's canvas.
  return {
    error: `no project lists this file as its ${kind}, so nothing was written. If it belongs to one, add ${JSON.stringify(keyed ? { key: id, ...(stamped && { id: stamped }) } : { id })} as the ${kind} entry in that project's snapshot-routing block, then snapshot again.${bare ? ' A project lists that id with no key: add the key there only if this is that file, not a duplicate of it (a duplicate carries the same id).' : ''}`,
    detail: `known: ${known || '(none)'}`,
  };
}

/*
 * What a run says, in one shape, in every project.
 *
 * Two receivers once reported differently and neither read well: one printed
 * `tokens:` twice meaning two different things, the other mixed flush-left
 * lines into an indented block, and in both the labels were prose of varying
 * length so nothing lined up. A snapshot's output is read in two seconds or
 * not at all — a label column you can run your eye down is the difference.
 *
 * The same two-column form `bin/check` uses, for the same reason.
 *
 *   say('grade', 'patch — newsletter-block')
 *   →   grade          patch — newsletter-block
 *
 * A value that is empty prints nothing: a run should not announce what did not
 * happen.
 */
/* Wide enough for the longest label any project uses — `no longer ready` —
   so one run's lines and the next project's line up in the same terminal. */
const LABEL = 15;

const say = (label, value) => {
  if (value === undefined || value === null || value === '') return;
  console.log(`  ${String(label).padEnd(LABEL)} ${value}`);
};

/** The same, indented under a `say` — a list that belongs to the line above. */
const under = (value) => {
  if (value === undefined || value === null || value === '') return;
  console.log(`  ${' '.repeat(LABEL)} ${value}`);
};

/** The kinds a payload can be. Adding one is adding it here and in a block. */
const KINDS = ['library', 'screens'];

/*
 * What a replay's exit code means (deliver.cjs run by hand).
 *
 * It has to mean something, because a snapshot's outcome is what the person in
 * Figma is told. A writer that exited 0 having refused — which one receiver
 * did — makes the plugin say "done" over a write that never happened, and the
 * only truth is in a terminal nobody is looking at.
 *
 * REFUSED is separated from FAILED on purpose: a payload from the wrong file
 * is the guard working, not a crash, and reporting it as a crash would train
 * everyone to ignore crashes.
 */
const EXIT = {
  WRITTEN: 0,
  FAILED: 1,   // an exception, a bad argument, a write that did not finish
  REFUSED: 4,  // handled cleanly and deliberately wrote nothing
};

/*
 * A new project's home, for a library no project claims yet: the smallest context document the tools read, the
 * library routed by both its names (snapshot-standard 2: its Figma key, from its address, and the id it stamps, both
 * of which a first snapshot's refusal prints; a copy's key alone, which then stands for both) and an empty audit-settings entry for
 * it, so a project made from the contract editor runs every tool as any other does. Refuses a label that has a home
 * or names the toolkit's own folder, a file another project claims, and, while a project's routing cannot be read,
 * everything (snapshot-standard rule 9: it may claim the file).
 */
function create(label, { library, id } = {}) {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(label || '')) return { error: 'A project label is lower case, digits and hyphens: acme, design-system.' };
  // by the folder on disk, so a root typed in another case, or through a link, is still the toolkit's
  if (require('../shared/real-path.mjs').samePath(path.join(root(), label), MAIN)) return { error: `${label} is the toolkit's own folder.` };
  if (!/^[A-Za-z0-9]{10,64}$/.test(library || '')) return { error: "That is not a Figma file key: copy the library's address (figma.com/design/<key>/…)." };
  // a copy's refusal prints its key alone, the id it carries being its original's: the key then serves as both
  id = id || library;
  if (!/^[\w:-]{1,80}$/.test(id)) return { error: "That is not a file id: snapshot the library once, and the refusal prints it beside the key." };
  const home = homeOf(label), doc = path.join(home, CONTEXT);
  const all = projects();
  if (all.errors.length) return { error: `A project's routing cannot be read, so whether it claims this file is unknown:\n${all.errors.join('\n')}` };
  const claim = all.list.find((p) => KINDS.some((k) => namesOf(p.files[k]).some((n) => n === library || n === id)));
  if (claim) return { error: `${claim.name} already claims this file` };
  fs.mkdirSync(home, { recursive: true });
  const block = (tag, v) => '```json ' + tag + '\n' + JSON.stringify(v, null, 2) + '\n```\n';
  // never over a document there, though another process made it a moment ago
  try { fs.writeFileSync(doc, `# ${label}\n\nThis project's context document, made by the contract editor: its library and the settings the editor keeps.\n\n`
    + block('snapshot-routing', { files: { library: { key: library, id, roles: ['components', 'tokens'] } } }) + '\n' + block('audit-settings', { libraries: { [library]: {} } }), { flag: 'wx' }); }
  catch (e) { if (e.code === 'EEXIST') return { error: `${label} has a home already, at ${home}` }; throw e; }
  return { home, doc };
}

/* A library snapshot no project claims yet, kept so a project can be made of it (router.mjs keeps it; the contract
   editor's Create a project takes it by its code and has it delivered): one per post, never in a project, the newest
   first. A page that floods the router can push the person's out of the five (they run the plugin again); it cannot
   make a project of its own. */
// TOOLKIT_UNCLAIMED moves it, for a test. Under the home folder, not the temp folder: the login agent's temp folder is
// not the one a terminal has, and a shared /tmp is anyone's
const UNCLAIMED = process.env.TOOLKIT_UNCLAIMED || path.join(os.homedir(), '.toolkit', 'snapshot-unclaimed');
// the five newest, none older than a day, so a page that posts to the router cannot fill the disk; none larger than the
// router takes (LARGEST, well past the largest library snapshot met, about 50 MB)
const KEEP = 5, DAY = 24 * 60 * 60 * 1000, LARGEST = 256 * 1024 * 1024;
// a code without the letters and digits read as one another (0 and O, 1 and I)
const CODE = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
/* A library snapshot no project claims, kept under a one-time code the router answers with and the plugin shows: any
   page can post to the router, so a project is made only of the snapshot whose code the person types, and a page that
   posts learns only its own snapshot's code. */
function keepUnclaimed(payload, list = projects().list) {
  const meta = (payload && payload.tokens && payload.tokens._meta) || {};
  if (!meta.fileId && !meta.fileKey) throw new Error('the snapshot names no file');
  /* An id another project already claims, on a file whose key none does, is a copy's: a duplicated file carries its
     original's id (snapshot-standard 2). It is kept under its key alone, or the project
     made of it would be refused as already claimed. */
  if (copied(list, meta.fileKey, meta.fileId)) meta.fileId = null;
  const text = JSON.stringify(payload);
  if (Buffer.byteLength(text) > LARGEST) throw new Error(`a snapshot over ${LARGEST >> 20} MB is not kept`);
  fs.mkdirSync(UNCLAIMED, { recursive: true, mode: 0o700 });
  if (!owned()) throw new Error(`${UNCLAIMED} is not this user's alone (another owner, or others may read it)`);
  // a code another kept snapshot has is drawn again, never written over it
  for (;;) {
    const code = Array.from({ length: 6 }, () => CODE[require('node:crypto').randomInt(CODE.length)]).join('');
    const file = path.join(UNCLAIMED, `${code}.json`);
    // what the list reads, beside it, so listing never parses a snapshot: written first, so it holds the code, and the
    // snapshot never lies there unlisted (and so unpruned) when its own write fails
    try { fs.writeFileSync(file.replace(/\.json$/, '.meta.json'), JSON.stringify({ id: meta.fileId || meta.fileKey, key: meta.fileKey || null, name: meta.file || null }), { mode: 0o600, flag: 'wx' }); } catch (e) { if (e.code === 'EEXIST') continue; throw e; }
    try { fs.writeFileSync(file, text, { mode: 0o600, flag: 'wx' }); } catch (e) { fs.rmSync(file.replace(/\.json$/, '.meta.json'), { force: true }); if (e.code === 'EEXIST') continue; throw e; }
    // the one just written is never the one pruned, whatever the clock's resolution
    for (const old of unclaimed().filter((u) => u.file !== file).slice(KEEP - 1)) drop(old.file);
    return code;
  }
}
// this user's alone: a folder another made first is neither written into nor read
function owned() {
  const st = fs.lstatSync(UNCLAIMED);
  return st.isDirectory() && !(process.getuid && st.uid !== process.getuid()) && !(st.mode & 0o077);
}
// a kept snapshot and what the list reads of it, gone together
const drop = (file) => { fs.rmSync(file, { force: true }); fs.rmSync(file.replace(/\.json$/, '.meta.json'), { force: true }); };
// newest first; one older than a day is removed as it is met, one without what the list reads is not offered
function unclaimed() {
  let names;
  try { if (!owned()) return []; names = fs.readdirSync(UNCLAIMED); } catch { return []; }
  // what a write that failed left: a sidecar with no snapshot, a minute after it was written
  for (const f of names.filter((x) => /^[A-Z0-9]{6}\.meta\.json$/.test(x) && !names.includes(x.replace('.meta', '')))) {
    const meta = path.join(UNCLAIMED, f);
    try { if (Date.now() - fs.statSync(meta).mtimeMs > 60 * 1000) fs.rmSync(meta, { force: true }); } catch { /* gone */ }
  }
  return names.filter((f) => /^[A-Z0-9]{6}\.json$/.test(f)).map((f) => {
    const file = path.join(UNCLAIMED, f);
    try {
      const at = fs.statSync(file).mtimeMs;
      if (Date.now() - at > DAY) { drop(file); return null; }
      const meta = JSON.parse(fs.readFileSync(file.replace(/\.json$/, '.meta.json'), 'utf8'));
      return { code: f.slice(0, 6), id: meta.id, key: meta.key, name: meta.name, at, file };
    } catch { return null; }
  }).filter(Boolean).sort((a, b) => b.at - a.at);
}

/*
 * The context document's own readers. Moved here from the dashboard service
 * so the service, the docs site and the tracker read the rulings log and the
 * fenced JSON blocks with one parser: the service's, which respects escaped
 * pipes and backtick spans and skips struck rows, and replaced a naive one
 * written for the tracker that did neither.
 */
// Tolerant of spacing and CRLF: a block written ```json  audit-settings must not vanish.
const fenced = (md, tag) => { const m = md.match(new RegExp('```json[ \\t]+' + tag + '[ \\t]*\\r?\\n([\\s\\S]*?)\\r?\\n```')); return m ? m[1] : null; };
/* One library's entry in the context document's audit-settings block changed by `edit` and written back: the one
   writer of a setting the tools set themselves (a source switch, the contract editor's scratch file). */
function setLibrary(doc, libKey, edit) {
  const md = fs.readFileSync(doc, 'utf8');
  const raw = fenced(md, 'audit-settings');
  if (raw == null) throw new Error(`${doc} has no audit-settings block`);
  const settings = JSON.parse(raw);
  settings.libraries = settings.libraries || {};
  edit(settings.libraries[libKey] = settings.libraries[libKey] || {});
  fs.writeFileSync(doc, md.replace(raw, () => JSON.stringify(settings, null, 2)));
}
/* A repo's snapshot.config.json changed by `edit` and written back: the one writer of what the tools set in it after
   init.mjs made it (the contract editor's component styles folder and class naming). */
function setRepoConfig(repo, edit) {
  const file = path.join(expand(repo), 'snapshot.config.json');
  const config = JSON.parse(fs.readFileSync(file, 'utf8'));
  edit(config);
  fs.writeFileSync(file, JSON.stringify(config, null, 2) + '\n');
}
// A table row split on pipes outside backtick spans; an escaped \| stays text.
function cells(line) {
  const s = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  const out = []; let cur = "", tick = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === "`") tick = !tick;
    if (c === "|" && !tick && s[i - 1] !== "\\") { out.push(cur.trim()); cur = ""; continue; }
    cur += c;
  }
  out.push(cur.trim());
  return out;
}
// Walk §6 and hand back every table row under a header with a Ruling column.
// `each(lineIndex, cells, header)` is called per data row; the header maps names.
function walkRulings(lines, each) {
  let inSix = false, header = null;
  lines.forEach((l, i) => {
    if (/^## /.test(l)) { inSix = /^## 6\b/.test(l) || /rulings log/i.test(l); header = null; return; }
    if (!inSix || !/^\s*\|/.test(l)) return;
    const c = cells(l);
    // A row followed by a separator is a table's HEADER, and a new table ends
    // the previous one — with a Ruling column it is the rulings table, without
    // one it is some other table in §6 and none of its rows are rulings. This
    // only tested for a Ruling column, so any later table in §6 inherited the
    // rulings header and every row of it was served to the dashboard and to
    // the audit judge as a project ruling. One project's routing table put
    // three of them in the record, `{date: "Route", scope: "Accepts only"}`
    // among them.
    if (/^[\s|:-]+$/.test(lines[i + 1] || '')) { header = c.some((x) => /^ruling$/i.test(x)) ? c.map((x) => x.toLowerCase()) : null; return; }
    if (!header || /^[\s|:-]+$/.test(l)) return;
    each(i, c, header);
  });
}
// One ruling, one form: bold and the table's escaped pipes stripped, whitespace
// collapsed. The duplicate test compares whole keys — a substring test refused
// any new ruling that happened to sit inside an older one, and a ruling past
// the 400-character display cut could be recorded twice.
const rulingKey = (s) => String(s || "").replace(/\*\*/g, "").replace(/\\\|/g, "|").replace(/\s+/g, " ").trim();
function rulingsOf(md) {
  const out = [];
  walkRulings(md.split("\n"), (i, c, header) => {
    const cell = c[header.indexOf("ruling")] || "";
    if (!cell || /^~~/.test(cell)) return;              // a struck row is superseded, kept as a pointer
    // Unescape the table's \| so a ruling reads, and compares, as it was written:
    // left escaped, a ruling with a pipe never matched itself and was recorded twice.
    const full = rulingKey(cell);
    // The Why column carries where the ruling was made — "Recorded from the
    // audit dashboard, on Progress bar." — which is the component it is
    // about. Dropped here, the judge saw the sentence with no subject and
    // raised the finding the ruling had closed, on the next audit after a
    // reset; the maintainer then could not record it again, being a duplicate.
    out.push({ date: c[header.indexOf("date")] || "", scope: c[header.indexOf("scope")] || "",
               text: full.slice(0, 400), key: full, why: rulingKey(c[header.indexOf("why")] || "") });
  });
  return out;
}

/**
 * What the audit dashboard reads from a project: its `audit-settings` block
 * merged over the house defaults in `standards/audit-settings.json`, and its rulings. Moved
 * here from the dashboard service so its published read-only copy reads the
 * same thing the live service does.
 */
/** The toolkit's settings file: the house defaults and the registry of keys (toolkit-standard §C clause F). */
const SETTINGS = path.join(__dirname, '..', '..', 'standards', 'audit-settings.json');

/*
 * The settings are grouped by the figma-standard section they serve, and each
 * fact is stated once; every tool reads one flat object per library. This is
 * where the two meet: each section merged house-then-library, and the values
 * that repeat a fact derived from it (audit-keys.derived), so a project that
 * changes its category marker changes its header pattern and pinned headers
 * with it.
 */
const SECTIONS = ['variants', 'pages', 'tokens', 'components'];
/*
 * Naming is not an audit setting: the house's naming preferences are their
 * own standards file, which every tool reads and the audit only checks
 * against, and a project overrides them in its `naming-preferences` block
 * (one for the project, read by auditContext). flatSettings folds them in
 * itself, so a caller holding only the house defaults still has them.
 */
const NAMING = path.join(__dirname, '..', '..', 'standards', 'naming-preferences.json');
const housePreferences = () => { try { return JSON.parse(fs.readFileSync(NAMING, 'utf8')).preferences || {}; } catch { return {}; } };
const esc = (x) => String(x).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/*
 * What the code audit knows of a library's code props: the house's
 * (audit-defaults `codeProps`: the platform's, and the words code libraries
 * share), then its framework's own on top. A library on no framework still
 * knows an onClick is not a design prop.
 */
function codeProfile(house, fw) {
  const own = house.codeProps || {};
  const sameJob = { ...(own.sameJob || {}) };
  for (const [words, props] of Object.entries(fw.sameJob || {})) sameJob[words] = [...new Set([...(sameJob[words] || []), ...props])];
  return {
    ...fw,
    inherited: [...new Set([...(own.inherited || []), ...(fw.inherited || [])])],
    sameJob,
    notDesign: [own.notDesign, fw.notDesign].filter(Boolean).join('|') || null,
  };
}

function flatSettings(house, lib, naming = {}) {
  const t = Object.assign({}, housePreferences(), naming);
  for (const sec of SECTIONS) Object.assign(t, house[sec] || {}, lib[sec] || {});
  const header = (c) => (t.categoryMarker ? t.categoryMarker + ' ' : '') + c;
  if (t.categoryMarker) t.sectionHeader = '^' + esc(t.categoryMarker) + ' [A-Z][A-Z &]*$';
  // which pages an audit reads: a project may say (one reads every page but its drafts); else the marked ones
  if (!t.componentPages && (t.finishedMarker || t.statusMarker)) t.componentPages = '^(?:' + [t.finishedMarker, t.statusMarker].filter(Boolean).map(esc).join('|') + ')';
  t.pinnedLast = [...(t.pinnedCategories || []), ...(t.deprecatedCategory ? [t.deprecatedCategory] : [])].map(header);
  // the order a component's axes take (figma-standard rule 1): size, the emphasis axes, disabled, state
  const order = [t.sizeAxis, ...(t.emphasisAxes || []), t.disabledAxis, t.stateAxis].filter(Boolean);
  if (order.length) t.axisOrder = order;
  if (t.excludeCategories) t.excludeSections = t.excludeCategories.map(header);
  if (t.deprecatedMarker) {
    t.deprecatedPagePrefix = t.deprecatedMarker;
    if (t.deprecatedCategory) t.deprecatedNamePrefix = '[' + t.deprecatedMarker + ' ' + t.deprecatedCategory + '] - ';
  }
  return t;
}

/*
 * The roles of a project's library files, from its routing block:
 * `"roles": ["tokens"]`, `["components"]`, `["icons"]`, or two where one file
 * is both (a library that is its own variable source). `icons` is the library
 * of icons, illustrations and other assets: its icon page's glyphs and every
 * component on its other pages, which the docs site shows as that library's
 * own section rather than as components. A file with no roles is
 * routed for the snapshot and audited by nothing. At most one file holds the
 * tokens: it is the source every components library's variables link to.
 */
const ROLES = ['tokens', 'components', 'icons'];
function libraryRoles(contextDoc) {
  const r = routing(contextDoc);
  const out = { errors: [], all: [], components: [], tokens: null, icons: [], names: {}, rolesOf: {} };
  if (r.error) return out;
  const tokens = [];
  for (const e of entries(r.files.library)) {
    const key = e.key || e.id;
    const roles = e.roles === undefined ? [] : e.roles;
    if (!Array.isArray(roles) || roles.some((x) => !ROLES.includes(x))) { out.errors.push(`library ${key}: roles must be a list of ${ROLES.join(', ')}`); continue; }
    if (!roles.length) continue;
    if (e.name) out.names[key] = e.name;
    out.rolesOf[key] = roles;
    out.all.push(key);
    if (roles.includes('components')) out.components.push(key);
    if (roles.includes('icons')) out.icons.push(key);
    if (roles.includes('tokens')) tokens.push(key);
  }
  if (tokens.length > 1) out.errors.push(`${tokens.join(' and ')} both have the role "tokens"; one file holds a project's tokens`);
  out.tokens = tokens[0] || null;
  return out;
}

function auditContext(contextDoc, settingsPath = SETTINGS) {
  const errors = [];
  let house = {};
  try {
    if (!fs.existsSync(settingsPath)) errors.push('no settings file at ' + settingsPath);
    else house = JSON.parse(fs.readFileSync(settingsPath, 'utf8'))['audit-defaults'] || {};
    if (fs.existsSync(settingsPath) && !Object.keys(house).length) errors.push('the settings file carries no audit-defaults');
  } catch (e) { errors.push('the settings file is not valid JSON: ' + e.message); }
  if (!fs.existsSync(contextDoc)) return { ok: false, file: contextDoc, errors: errors.concat('no context document at ' + contextDoc), libraries: {}, rulings: [] };
  const md = fs.readFileSync(contextDoc, 'utf8');
  let settings = null;
  const raw = fenced(md, 'audit-settings');
  if (!raw) errors.push('the context document has no audit-settings block');
  else { try { settings = JSON.parse(raw); } catch (e) { errors.push('the audit-settings block is not valid JSON: ' + e.message); } }
  // the project's naming preferences, over the house's: optional, one block for the project
  let naming = {};
  const rawNaming = fenced(md, 'naming-preferences');
  if (rawNaming) { try { naming = JSON.parse(rawNaming); } catch (e) { errors.push('the naming-preferences block is not valid JSON: ' + e.message); } }
  // Which libraries the audit runs against, and which one holds the tokens,
  // is the routing block's to say (`roles`, snapshot-standard rule 17): the
  // settings only override the house defaults for a library already routed.
  const routed = libraryRoles(contextDoc);
  errors.push(...routed.errors);
  const own = (settings && settings.libraries) || {};
  for (const key of Object.keys(own)) {
    if (!routed.all.includes(key)) errors.push(`audit-settings names ${key}, which the snapshot-routing block routes with no role`);
  }
  const libraries = {};
  for (const key of routed.components) {
    const lib = own[key] || {};
    libraries[key] = Object.assign({}, lib, {
      name: lib.name || routed.names[key] || key,
      sourceLibrary: routed.tokens,
      optionOrder: Object.assign({}, house.optionOrder || {}, lib.optionOrder || {}),
      tokens: flatSettings(house, lib, naming),
      // what the house knows of the framework the library's code is built on (audit-defaults
      // `frameworks`, keyed by `framework`): a fact of the framework, stated once for every project on it
      frameworkProfile: (lib.framework && (house.frameworks || {})[lib.framework]) || {},
    });
    libraries[key].codeProfile = codeProfile(house, libraries[key].frameworkProfile);
  }
  /*
   * The project's dialect, for the words the TOOLKIT writes.
   *
   * A section heading the docs site draws, a table header the doc generator
   * writes into Figma — ours, not the file's, and they were British because
   * this repo is. A library whose own convention is en-US then got "Colour"
   * written into it by its own documentation run.
   *
   * It lives in the project's context document and nowhere else, by the
   * maintainer's instruction: not in the house defaults, because it is a
   * project's own choice and a house default is a place for it to be set
   * from twice. Absent means en-GB, which is what the toolkit writes when
   * nobody has said otherwise.
   *
   * It never touches the file's own words. Token names, component names and
   * descriptions are the project's to spell, and `guidance.cjs` already
   * reads either spelling of a description heading.
   */
  const language = (settings && typeof settings.language === 'string' && settings.language.trim()) || 'en-GB';
  // An icon library's settings: the icon set its names follow, if any.
  const icons = Object.fromEntries(routed.icons.map((key) => [key, (own[key] || {}).icons || {}]));
  return { ok: errors.length === 0, file: contextDoc, errors, libraries, icons, rulings: rulingsOf(md), language };
}

/*
 * A project's interface limits (design-standard; audit-settings `interface`): the house's, under the project's own
 * `interface` in its context document. One reader for every tool that measures a page or a component in a window
 * (tools/ui-check, the parity engine, the docs site's structure check). No project, or none of its own: the house's.
 */
function interfaceLimits(label, settingsPath = SETTINGS) {
  const house = (JSON.parse(fs.readFileSync(settingsPath, 'utf8'))['audit-defaults'] || {}).interface || {};
  if (!label) return { ...house };
  const doc = path.join(homeOf(label), CONTEXT);
  const raw = fs.existsSync(doc) ? fenced(fs.readFileSync(doc, 'utf8'), 'audit-settings') : null;
  let own = {};
  if (raw) { try { own = JSON.parse(raw).interface || {}; } catch (e) { throw Object.assign(new Error(`the audit-settings block in ${doc} is not valid JSON: ${e.message}`), { usage: true }); } }
  return Object.assign({}, house, own);
}

/**
 * The validator's state vocabulary for one library: the axis named by
 * `variants.stateAxis` and that axis's recorded options. With no file key, the
 * one every library agrees on, or null where they differ. Null means the
 * validator's state checks stay silent, which is the rule for a setting that
 * is absent; every caller of the validator reads it here.
 */
function validatorStates(ctx, fileKey) {
  const of = (lib) => lib && lib.tokens && lib.tokens.stateAxis
    ? { axis: lib.tokens.stateAxis, options: (lib.optionOrder || {})[lib.tokens.stateAxis] || null } : null;
  const libs = (ctx && ctx.libraries) || {};
  if (fileKey) return of(libs[fileKey]);
  const all = Object.values(libs).map(of);
  return all.length && all.every((x) => JSON.stringify(x) === JSON.stringify(all[0])) ? all[0] : null;
}

/**
 * What a component's contract is derived under (tools/component-contract/derive.cjs):
 * its library's state axis and the pointer states on it, from the merged
 * settings. `{}` for a library the settings do not name, which derives under
 * the house defaults. Every writer of a contract reads it here: the snapshot
 * router (deliver.cjs), tools/component-contract/write.cjs and check-specs.cjs.
 */
function deriveOptions(ctx, fileKey) {
  const t = ((((ctx && ctx.libraries) || {})[fileKey]) || {}).tokens || {};
  return Object.fromEntries([['stateAxis', t.stateAxis], ['pointerStates', t.pointerStates]].filter(([, v]) => v !== undefined));
}

/**
 * The same for a tool handed only a components folder: the project whose
 * store it is, and each folder's library from the store's index. A folder no
 * project stores derives under the house defaults.
 */
function deriveOptionsFor(componentsDir, projectsDir) {
  const of = storeLibraries(componentsDir, projectsDir);
  return of ? (folder) => deriveOptions(of.ctx, of.fileOf(folder)) : () => ({});
}
/* The project whose store a components folder is, and each folder's library file key from the store's index. */
function storeLibraries(componentsDir, projectsDir) {
  const dir = path.resolve(componentsDir);
  for (const p of projects(projectsDir).list) {
    const w = layout(projectsDir, p.name);
    if (!w || w.error || !w.paths || typeof w.paths.components !== 'string' || path.resolve(w.paths.components) !== dir) continue;
    const ctx = auditContext(w.doc);
    let index = {};
    try { index = JSON.parse(fs.readFileSync(w.paths.index, 'utf8')).components || {}; } catch { /* no index: every folder under the defaults */ }
    return { ctx, fileOf: (folder) => (index[folder] || {}).file };
  }
  return null;
}
/**
 * Each folder's merged settings (the flat object every tool reads), for a tool handed a components folder that
 * writes code from its contracts (to-code, to-markup): its library's, else the house's.
 */
function librarySettingsFor(componentsDir, projectsDir) {
  const house = flatSettings(JSON.parse(fs.readFileSync(SETTINGS, 'utf8'))['audit-defaults'] || {}, {});
  const of = storeLibraries(componentsDir, projectsDir);
  // a folder the index does not hold yet (a draft) takes the project's library where it has only one
  const only = of && Object.keys(of.ctx.libraries || {}).length === 1 ? Object.values(of.ctx.libraries)[0].tokens : null;
  return (folder) => (of && (((of.ctx.libraries || {})[of.fileOf(folder)] || {}).tokens || only)) || house;
}

/** The rulings log of a context document, newest last. */
function rulings(contextDoc) {
  try { return rulingsOf(fs.readFileSync(contextDoc, 'utf8')); } catch { return []; }
}

/**
 * A component's status from its page name: the leftmost marker in the legend
 * found before the name itself. `null` when the page carries no known marker.
 */
function status(pageName, markers = MARKERS) {
  // The marker is looked for in everything before the page's name, not only
  // at its start: `↘︎  ❖ Logos` carries ❖ behind a designer's own arrow.
  const prefix = String(pageName).trim().match(/^[^\p{L}\p{N}_]*/u)[0];
  // The leftmost wins, as it did when only the start was read; at one
  // position, the longest.
  const hit = Object.keys(markers).filter((m) => prefix.includes(m))
    .sort((a, b) => prefix.indexOf(a) - prefix.indexOf(b) || b.length - a.length)[0];
  return hit ? { marker: hit, label: markers[hit], rank: Object.keys(markers).indexOf(hit) } : null;
}

/**
 * Where a project's snapshot is, for anything that reads one.
 *
 * The docs site, the tracker, the dashboard and the validator all ask this and
 * nothing else, so none of them knows how a particular project lays out its
 * files, and a project that moves a folder changes one config line.
 */
// `projectsDir` as for projects(): a scratch folder of `<label>/` homes, or
// left out (null) for the project's own home.
function layout(projectsDir, label) {
  const home = projectsDir ? path.join(expand(projectsDir), label) : homeOf(label);
  const doc = path.join(home, CONTEXT);
  if (!fs.existsSync(doc)) return { error: `no context document for ${label} at ${doc}` };
  const facts = project(doc);
  if (facts.error) return { error: facts.error };
  const route = routing(doc);
  const base = {
    label, name: facts.name || label, phase: facts.phase, markers: facts.markers, done: facts.done, publish: facts.publish, port: facts.port, editorPort: facts.editorPort, doc,
    projectDir: home,
    // Audit records live with the project in the toolkit whatever the
    // project's layout: the dashboard and the audit skills write them there.
    // ONE PER LIBRARY, named for its Figma file key — a project's libraries
    // are different files with different runs, and a single record could not
    // say that web had been audited and mobile had not. `audit` is the folder;
    // `auditRecords()` below names the file for each library.
    audit: path.join(home, 'audit'),
    // The code audit's map and report, and what is built from the project
    // and never committed: its docs site and the code's Storybook.
    parity: path.join(home, 'parity'),
    site: path.join(home, 'site'),
    storybook: path.join(home, 'storybook'),
  };
  const { paths } = require('./store.cjs');
  // No routing yet is a project with no snapshot yet, not a broken one: its
  // audit record and dashboard still stand, where its store would be. A block
  // that is there and malformed stays an error.
  if (route.missing) return { ...base, repo: null, files: {}, figmaKey: null, paths: paths(path.join(home, 'snapshot')) };
  if (route.error) return { ...base, error: route.error };
  if (!route.repo) {
    return { ...base, repo: null, files: route.files, figmaKey: figmaKey(route.files.library), paths: paths(path.join(home, 'snapshot')) };
  }
  const where = locate(route.repo);
  if (where.error) return { ...base, error: where.error };
  return { ...base, repo: route.repo, files: route.files, figmaKey: figmaKey(route.files.library), paths: paths(route.repo, where.paths) };
}

/**
 * One audit record per library: `{ key, platform, path }` for every library
 * the project's routing block names, in its order, whether or not the file
 * exists yet.
 *
 * The record was `audit/audit.json`, one per project, while a project's
 * libraries are different Figma files with different runs — so a two-library
 * project could not say that its web library had been audited and its mobile
 * one had not, and the page showed whichever library the record happened to
 * name first. The record's own shape is unchanged; there is simply one of
 * them per file, named for the key.
 */
function auditRecords(where) {
  if (!where || !where.audit) return [];
  // Every library the routing block gives a role (snapshot-standard rule 17):
  // the components libraries the audit scans in Figma, and the tokens and
  // icon libraries whose checks read the stored snapshot. A file with no role
  // has no record.
  const roles = libraryRoles(where.doc);
  const routed = entries(where.files && where.files.library);
  const entryOf = (key) => routed.find((e) => e.key === key || e.id === key) || {};
  const ctx = auditContext(where.doc);
  const list = roles.all.map((key) => ({ key, roles: roles.rolesOf[key], platform: entryOf(key).platform || null,
    name: ((ctx.libraries || {})[key] || {}).name || roles.names[key] || null }));
  // A project whose record has not been renamed yet reads the old
  // `audit/audit.json`. The shim is for the migration only: one project's
  // record was being written by another session when the rest were renamed,
  // and moving a file out from under a running service is how a day's work
  // disappears. Rename it and delete this — `auditRecords` is the one place
  // that knows both names.
  const legacy = path.join(where.audit, 'audit.json');
  const single = list.length === 1 && !fs.existsSync(path.join(where.audit, `${list[0].key}.json`)) && fs.existsSync(legacy);
  return list.map((l, i) => ({ ...l, path: single && i === 0 ? legacy : path.join(where.audit, `${l.key}.json`) }));
}

module.exports = { EDITOR_PORT, HOME, homeOf, interfaceLimits, librarySettingsFor, create, homes, labelOf, repos, flatSettings, codeProfile, auditRecords, libraryRoles, ROLES, EXIT, KINDS, MARKERS, PHASES, auditContext, deriveOptions, deriveOptionsFor, validatorStates, fenced, setLibrary, setRepoConfig, keepUnclaimed, unclaimed, dropUnclaimed: drop, LARGEST, fileIdent, fileLabel, rulings, rulingKey, rulingsOf, walkRulings, status, entries, expand, figmaKey, identify, kindOf, layout, locate, names, namesOf, project, projects, route, routing, say, under };

// Every project and its home, one per line, for the shell scripts:
//   node tools/snapshot/projects.cjs homes    → <label><TAB><home>
if (require.main === module && process.argv[2] === 'homes') {
  for (const h of homes()) console.log(`${h.name}\t${h.home}`);
}
// Every name that identifies a project, one per line, for the check that no
// toolkit file names one (bin/check): each label, the Figma file keys and ids
// its routing names, and the name, organisation and host of each project
// repo's origin, the toolkit's own organisation aside.
//   node tools/snapshot/projects.cjs names
// A root that is not there is a misspelt TOOLKIT_PROJECTS_ROOT or a moved folder, never a machine with no projects:
// it fails, so the names check never passes by searching for nothing. An empty root (CI's) prints nothing.
if (require.main === module && process.argv[2] === 'names') {
  if (!fs.statSync(root(), { throwIfNoEntry: false })?.isDirectory()) { console.error(`the projects root ${root()} is not a folder (TOOLKIT_PROJECTS_ROOT, else the toolkit's parent)`); process.exit(1); }
  const { execFileSync } = require('child_process');
  const originOf = (dir) => { try { return execFileSync('git', ['-C', dir, 'remote', 'get-url', 'origin'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch { return ''; } };
  const parts = (url) => { const m = /^(?:https?:\/\/|git@)([^/:]+)[/:]([^/]+)\/([^/]+?)(?:\.git)?$/.exec(url); return m ? { host: m[1], org: m[2], repo: m[3] } : null; };
  const own = parts(originOf(TOOLKIT));
  const out = new Set();
  for (const h of homes()) {
    out.add(h.name);
    const route = routing(path.join(h.home, CONTEXT));
    for (const f of Object.values(route.files || {})) for (const e of entries(f)) for (const k of [e.key, e.id]) if (k && k.length >= 10) out.add(k);
    for (const dir of [path.dirname(h.home), h.home]) {
      const p = parts(originOf(dir));
      if (!p) continue;
      out.add(p.repo);
      if (!own || p.org !== own.org) out.add(p.org);
      if (!/^(github|gitlab|bitbucket)\.(com|org)$/.test(p.host)) out.add(p.host.split('.')[0]);
    }
  }
  for (const n of out) console.log(n);
}

// A library's settings as every tool reads them, for a session that pastes them
// into a script (`const TOKENS = …`, `const SCALES = …`):
//   node tools/snapshot/projects.cjs settings <project> [fileKey]
if (require.main === module && process.argv[2] === 'settings') {
  const [label, key] = process.argv.slice(3);
  if (!label) { console.error('usage: projects.cjs settings <project> [fileKey]'); process.exit(2); }
  const where = layout(null, label);
  // a project that is not there, or whose routing is broken, says which, rather than the usage line
  if (where.error || !where.doc) { console.error(`projects.cjs settings: ${where.error || `no context document for ${label}`}`); process.exit(2); }
  const ctx = auditContext(where.doc);
  if (!ctx.ok) { console.error(ctx.errors.join('\n')); process.exit(1); }
  const libs = key ? { [key]: ctx.libraries[key] } : ctx.libraries;
  if (key && !libs[key]) { console.error(`no library ${key} in ${where.doc}`); process.exit(1); }
  console.log(JSON.stringify(Object.fromEntries(Object.entries(libs).map(([k, l]) => [k, { name: l.name, TOKENS: l.tokens, SCALES: l.optionOrder }])), null, 2));
}

// No subcommand, or one this file does not know: the usage, never a silent exit 0.
if (require.main === module && !['homes', 'names', 'settings'].includes(process.argv[2])) {
  console.error('usage: node tools/snapshot/projects.cjs homes | names | settings <project> [fileKey]');
  process.exit(2);
}
