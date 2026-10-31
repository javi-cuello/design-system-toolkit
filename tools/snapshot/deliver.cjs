/*
 * Deliver one payload to one project: the only way a snapshot is written.
 *
 *   node deliver.cjs <project> library|screens <payload.json>   # replay one the router kept
 *   node deliver.cjs <project> --pin                            # re-read the release stamps only
 *   node deliver.cjs <project> --pinned                         # is what is stored at the release? (a check's gate)
 *
 * Every project is written by the one store (store.cjs), at the paths its
 * snapshot.config.json gives (a design-only project's are its folder here),
 * pinned to its release when it has a Figma token (version.cjs), and then its
 * own steps run — the only part that is the project's: what it builds from a
 * snapshot. Two repos each had a receiver of their own, and the toolkit a
 * third for design-only projects; they wrote one format three ways and each
 * had fixes the others lacked.
 *
 * snapshot.config.json, for a repo:
 *   paths       where each part lives (store.cjs DEFAULT_PATHS, key by key);
 *               `graphics: false` for a project whose graphics come from elsewhere
 *   after       { library: [step], screens: [step] } — step: { label, run, required? },
 *               run in the repo; its first line is shown, all of it logged; a
 *               required step that fails fails the snapshot
 *   figmaToken  a command that prints the Figma token, when FIGMA_TOKEN is unset; else
 *               the machine's ~/.config/figma/token (bin/set-key figma)
 */
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Read fresh, like the router: a store changed while the router runs takes
// effect on the next snapshot.
const FRESH = [__dirname, path.join(__dirname, '..', 'component-contract')].map((d) => d + path.sep);
function load() {
  for (const k of Object.keys(require.cache)) if (FRESH.some((d) => k.startsWith(d))) delete require.cache[k];
  return { contract: require('./projects.cjs'), store: require('./store.cjs'), version: require('./version.cjs') };
}

// One reader of `snapshot.config.json`, and it is `contract.locate` — which
// refuses a file that names no `toolkit` and no `project`. This parsed the
// same file itself and swallowed every error, so a repo with a malformed
// config had its snapshot WRITTEN at the default layout while every reader
// (docs site, tracker, dashboard) called `locate()` and reported the error:
// files on disk that nothing admitted existed. Returns the config and, when
// the file is unusable, the sentence to say about it.
const configOf = (project, contract) => {
  if (!project.repo) return {};
  const found = contract.locate(project.repo);
  if (found.error) return { error: found.error };
  return { ...(found.raw || {}), paths: found.paths, toolkit: found.toolkit, project: found.project };
};
const pathsOf = (project, store, config) => (project.repo ? store.paths(project.repo, config.paths) : store.paths(project.store));

/** The release of file `key` to pin to: an object, null when none was found, undefined without a token. */
async function pin(project, kind, config, { version }, say, key) {
  const token = version.tokenFor(project.repo, config);
  if (!token) return undefined;
  if (!key) return null;
  try { return await version.released(key, kind === 'library' ? 'published' : 'named', token); } catch (e) { say('pinned', `unavailable: ${e.message}`); return null; }
}

/**
 * Write, pin, run the project's steps. `say(label, text)` and `under(text)`
 * print. Resolves to { result: 'written' | 'refused' | 'failed', why }, where
 * `why` is the one sentence the person in Figma is shown: what went wrong and
 * what to do. "See the router's output" sent them to a terminal they were not
 * looking at, for a cause this already knew.
 */
async function deliver(project, kind, payload, { say, under } = {}) {
  const mods = load();
  const { contract, store } = mods;
  say = say || contract.say; under = under || contract.under;
  const config = configOf(project, contract);
  // A config the readers refuse is a config this must refuse too: writing at
  // the default layout would put files on disk that no reader will admit to.
  if (config.error) { say('refused', config.error); return { result: 'refused', why: `the project's setup is broken: ${config.error}. Fix it, then snapshot again.` }; }
  const P = pathsOf(project, store, config);
  // The file's own routing entry may name a platform (a mobile library beside a web one).
  const id = contract.identify(payload);
  const entry = contract.entries(project.files[kind]).find((e) => e.id === id || e.key === id) || {};
  // Pinned to the release of the file that sent it: the project's first file
  // stamped a components file's snapshot with the tokens file's publish.
  const meta = ((kind === 'library' ? (payload || {}).tokens : payload) || {})._meta || {};
  const version = await pin(project, kind, config, mods, say, entry.key || meta.fileKey || null);
  const r = kind === 'library'
    ? store.writeLibrary(payload, P, { platform: entry.platform || null, version, deriveWith: contract.deriveOptions(contract.auditContext(project.doc), entry.key), ids: [entry.key, entry.id].filter(Boolean), files: Object.values(project.files).flatMap((f) => contract.entries(f)).map((e) => [e.key, e.id].filter(Boolean)) })
    : store.writeScreens(payload, P, { version, states: (config.screens || {}).states || [], ids: [entry.key, entry.id].filter(Boolean) });
  for (const l of r.lines) { say(l.label, l.text); for (const d of l.detail || []) under(d); }
  if (r.refused) { say('refused', r.refused); return { result: 'refused', why: r.refused }; }
  // The project's own steps, in its own repo: a summary on screen, the rest in the log.
  const steps = [...(((config.after || {})[kind]) || []), ...toolkitSteps(kind, project, config)];
  if (!steps.length || !project.repo) return { result: 'written' };
  const kept = [];
  let failed = null;
  for (const step of steps) {
    // Asynchronous: a step runs while other projects' snapshots proceed; a
    // blocking run held the whole router, so one repo's slow build made every
    // other project wait its turn.
    const res = await new Promise((done) => {
      const child = spawn(step.run, { cwd: project.repo, shell: true });
      let text = '';
      child.stdout.on('data', (c) => { text += c; });
      child.stderr.on('data', (c) => { text += c; });
      child.on('close', (status) => done({ status, text }));
      child.on('error', (e) => done({ status: 1, text: e.message }));
    });
    const out = res.text.trimEnd();
    kept.push(`=== ${step.label} (exit ${res.status}) ===\n${out}`);
    // A step leads with its summary; the detail under it is for the log.
    const first = (out.split('\n').map((l) => l.trim()).find(Boolean) || '').replace(new RegExp(`^${step.label}:\\s*`), '');
    say(step.label, res.status === 0 ? first : `failed (exit ${res.status}) — ${first}`);
    if (res.status !== 0 && step.required) { failed = `the snapshot is written, but the required step "${step.label}" failed: ${first || `exit ${res.status}`}.`; process.stdout.write(`${out}\n`); break; }
  }
  if (P.logs) {
    fs.mkdirSync(P.logs, { recursive: true });
    const log = path.join(P.logs, `${kind}-steps-${new Date().toISOString().replace(/[:.]/g, '-')}.log`);
    fs.writeFileSync(log, kept.join('\n\n') + '\n');
    for (const old of fs.readdirSync(P.logs).filter((f) => f.startsWith(`${kind}-steps-`)).sort().slice(0, -5)) fs.rmSync(path.join(P.logs, old));
    say('detail', path.relative(project.repo, log));
    if (failed) failed += ` The full output is in ${path.relative(project.repo, log)}.`;
  }
  return failed ? { result: 'failed', why: failed } : { result: 'written' };
}

/* The toolkit's own checks on what a snapshot stored, run after the project's
   steps for every project with a repo, so no project can leave them out
   (toolkit-standard §D 13): until 2026-10-03 one project listed the parity
   gates and the validator among its own `after` steps and the other listed
   neither. Both are about the stored state, which is what a snapshot is
   (§D 5); neither fails the snapshot — a finding is a decision to make. */
function toolkitSteps(kind, project, config) {
  if (!project.repo) return [];
  const TK = require('node:path').resolve(__dirname, '../..');
  const out = [];
  // the components as stored, at the canonical place when `paths` does not say
  const stored = require('./store.cjs').paths(project.repo, config.paths || {}).components;
  if (kind === 'library' && require('node:fs').existsSync(stored)) out.push({ label: 'validate', run: `node "${TK}/tools/project-check/validate.mjs" --repo .${project.doc ? ` --context "${project.doc}"` : ''}` });
  if (config.parity) out.push({ label: 'parity gates', run: `node "${TK}/tools/parity/run.mjs" --repo . --gates` });
  return out;
}

/*
 * What is stored for one routed file. A project may route several library
 * files (tokens, components, icons): each is pinned to its own release, in its
 * own entry of `_meta.sources`, and checked against it. Only the first file
 * was, so a second file's snapshot carried the first's publish and the check
 * compared the first file's release with whichever file wrote last. A store
 * written before the per-file stamp has it at the top only, and it is the
 * FIRST routed file's, whichever file wrote last: the pin before this always
 * read the first file's release. That file, or the only one, reads it there.
 */
const libraryOf = (tokens, e, single, first) => {
  const m = tokens && tokens._meta;
  if (!m) return null;
  const s = m.sources && (m.sources[e.key] || m.sources[e.id]);
  if (s) return { version: 'version' in s ? s.version : single || first ? m.version : null, snapshotAt: s.at || m.snapshotAt };
  return single && !m.sources ? m : null;
};
const screensOf = (index, e) => [e.key, e.id].filter(Boolean).map((id) => (index.screens || {})[id]).find(Boolean) || null;
const nameOf = (kind, e, list) => (list.length > 1 ? `${kind} "${e.name || e.key}"` : kind);

/** Re-read the release stamps into what is stored, without collecting again. Resolves to 'written', 'skipped' or 'refused'. */
async function repin(project) {
  const mods = load();
  const { store, contract, version } = mods;
  const config = configOf(project, contract);
  if (config.error) { contract.say('refused', config.error); return 'refused'; }
  // No token reads no release, and that is not "no release": writing it would
  // null every stamp the last snapshot pinned.
  if (!version.tokenFor(project.repo, config)) { contract.say('skipped', 'no Figma token — the stored stamps are kept'); return 'skipped'; }
  const P = pathsOf(project, store, config);
  const tokens = JSON.parse(fs.readFileSync(P.tokens, 'utf8'));
  const libs = contract.entries(project.files.library).filter((e) => e.key);
  let top = null;
  for (const [i, e] of libs.entries()) {
    const v = (await pin(project, 'library', config, mods, contract.say, e.key)) || null;
    const s = tokens._meta.sources && (tokens._meta.sources[e.key] || tokens._meta.sources[e.id]);
    if (s) s.version = v;
    if (i === 0) top = v;
    contract.say(nameOf('library', e, libs), v ? `pinned to the publish of ${v.at}` : 'no publish found');
  }
  if (!libs.length) contract.say('library', 'no publish found');
  tokens._meta.version = top;
  fs.writeFileSync(P.tokens, JSON.stringify(tokens, null, 2) + '\n');
  const index = JSON.parse(fs.readFileSync(P.index, 'utf8'));
  const screens = contract.entries(project.files.screens).filter((e) => e.key);
  for (const e of screens) {
    const named = (await pin(project, 'screens', config, mods, contract.say, e.key)) || null;
    const meta = screensOf(index, e);
    if (meta) meta.version = named;
    contract.say(nameOf('screens', e, screens), named ? `pinned to "${named.label}" of ${named.at}` : 'no named version found');
  }
  fs.writeFileSync(P.index, JSON.stringify(index, null, 2) + '\n');
  return 'written';
}

/**
 * Is what is stored at the file's release? Every keystroke touches a Figma
 * file, so the triggers are deliberate ones: the library PUBLISHED, a named
 * version SAVED in the screens file. The snapshot records both; this compares
 * them with Figma. Resolves to { skipped } without a token, else { stale:
 * [lines], notes: [lines] } — an edit after the release is a note, not a
 * failure: Figma's last-modified moves on a canvas nudge nothing can publish.
 */
/* The stored screens entry of the file the project routes, not the first one
   stored: a project that moved to a fresh screens file kept the old file's
   entry first, and the check called the new snapshot stale against a version
   of the retired file. */
function routedScreens(index, project, contract) {
  const ids = contract.entries(project.files.screens).flatMap((e) => [e.id, e.key]).filter(Boolean);
  return ids.map((id) => (index.screens || {})[id]).find(Boolean) || null;
}

async function pinned(project) {
  const mods = load();
  const { store, contract, version } = mods;
  const config = configOf(project, contract);
  const token = version.tokenFor(project.repo, config);
  if (!token) return { skipped: 'no Figma token (FIGMA_TOKEN, `figmaToken` in snapshot.config.json, or ~/.config/figma/token: bin/set-key figma) — scopes library_content:read, file_versions:read' };
  const P = pathsOf(project, store, config);
  const read = (f) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return null; } };
  const tokens = read(P.tokens), index = read(P.index) || {};
  const stale = [], notes = [];
  for (const [kind, mode] of [['library', 'published'], ['screens', 'named']]) {
    const list = contract.entries(project.files[kind]);
    const keyed = list.filter((e) => e.key);
    if (!keyed.length) { if (list.length) stale.push(`${kind}: no fileKey in the context document's snapshot-routing block`); continue; }
    for (const e of keyed) {
      const label = nameOf(kind, e, keyed);
      const meta = kind === 'library' ? libraryOf(tokens, e, list.length === 1, e === list[0]) : screensOf(index, e);
      if (!meta) { stale.push(`${label}: no snapshot stored yet`); continue; }
      let live;
      try { live = await version.released(e.key, mode, token); } catch (err) { stale.push(`${label}: ${err.message}`); continue; }
      const have = meta.version && meta.version.id;
      if (!live) stale.push(mode === 'named' ? `${label}: no named version in Figma yet — File › Save to version history, with a name` : `${label}: never published`);
      else if (live.id !== have) stale.push(`${label}: Figma is at ${live.label === 'published' ? `published ${live.at}` : `version "${live.label}" (${live.at})`}; the snapshot is ${have || 'unpinned'} — snapshot again`);
      const v = meta.version;
      if (v && v.editedSince && v.editedSince < meta.snapshotAt) notes.push(`${label} was edited at ${v.editedSince}, after its release and before the snapshot; if that edit was releasable, release and snapshot again`);
    }
  }
  return { stale, notes };
}

module.exports = { toolkitSteps, deliver, repin, pinned, routedScreens };

if (require.main === module) {
  const [name, kind, file] = process.argv.slice(2);
  const { contract } = load();
  const { list, errors } = contract.projects();
  const project = list.find((p) => p.name === name);
  if (!project) { for (const e of errors) console.error(e); console.error(`usage: deliver.cjs <project> library|screens <payload.json> | <project> --pin | <project> --pinned — no project "${name}"`); process.exit(2); }
  if (kind === '--pin') repin(project).then((r) => process.exit(r === 'refused' ? contract.EXIT.REFUSED : 0), (e) => { console.error(e.stack || e); process.exit(1); });
  else if (kind === '--pinned') pinned(project).then((r) => {
    if (r.skipped) { console.log(`skipped (${r.skipped})`); return; }
    for (const l of r.stale) console.log(l);
    for (const l of r.notes) console.log(`  note: ${l}`);
    process.exit(r.stale.length ? 1 : 0);
  }, (e) => { console.error(e.stack || e); process.exit(1); });
  else {
    if (!['library', 'screens'].includes(kind) || !file) { console.error('usage: deliver.cjs <project> library|screens <payload.json>'); process.exit(2); }
    deliver(project, kind, JSON.parse(fs.readFileSync(file, 'utf8'))).then(({ result: r }) => process.exit(r === 'written' ? 0 : r === 'refused' ? contract.EXIT.REFUSED : 1), (e) => { console.error(e.stack || e); process.exit(1); });
  }
}
