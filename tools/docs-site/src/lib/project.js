// Which project this build documents, found the one way every reader finds a
// project: the toolkit's snapshot contract. The engine names none; DOCS_PROJECT
// is a project's label (the repo under ~/Projects/ holding its figma-design-system/), and where
// that project keeps its snapshot, its name and its phase all come from there.
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { resolve, join, dirname } from 'node:path';

const require = createRequire(import.meta.url);

const label = process.env.DOCS_PROJECT;
if (!label) throw new Error('Set DOCS_PROJECT to a project\'s label (its repo under ~/Projects/, holding figma-design-system/), e.g. DOCS_PROJECT=<label> pnpm dev');
// The engine lives in the toolkit (tools/docs-site): found by walking up from where
// it runs to the folder that holds the snapshot router. Not from this file's
// own address, which in a build is a bundled chunk somewhere else.
const findToolkit = (from) => {
  for (let d = resolve(from); ; d = dirname(d)) {
    if (existsSync(join(d, 'tools', 'snapshot', 'projects.cjs'))) return d;
    if (dirname(d) === d) throw new Error(`no toolkit above ${from}: run the docs from inside the toolkit (tools/docs-site)`);
  }
};
export const TOOLKIT = findToolkit(process.cwd());

const tool = (name) => require(join(TOOLKIT, 'tools/snapshot', name));
export const contract = tool('projects.cjs');
export const guidance = tool('guidance.cjs');
export const spec = tool('spec.cjs');
// A token's value by name and mode, matched without case: the one reader.
export const tokens = tool('tokens.cjs');

// Token names as the token build writes them (code-standard rules 52 and 54):
// the export's slug per segment, the build's house name over the path. Read
// from the two scripts that do it, so the docs cannot name a property the
// build does not write.
const DTCG = require(join(TOOLKIT, 'tools/tokens/dtcg.js'));
const build = await import(pathToFileURL(join(TOOLKIT, 'tools/tokens/build-tokens.mjs')).href);
const fromSnapshot = await import(pathToFileURL(join(TOOLKIT, 'tools/tokens/from-snapshot.mjs')).href);
// What the code has and how a name meets it: the toolkit's one reading, which
// the audit's Code parity stage uses too (tools/shared/code-inventory.mjs).
export const inventory = await import(pathToFileURL(join(TOOLKIT, 'tools/shared/code-inventory.mjs')).href);
const pathOf = (collection, name) => DTCG.pathFor(collection, name);
/** The custom property a variable becomes: `--colour-background-ghost`. */
export const { cssName } = await import(pathToFileURL(join(TOOLKIT, 'tools/tokens/names.mjs')).href);
/** The Sass variable a breakpoint becomes (`$md`), or null for any other variable. */
export const sassName = (collection, name) => { const b = build.breakpointName(pathOf(collection, name)); return b ? '$' + b : null; };
/** The mixin a text style becomes: its path, slugged the same way. */
export const mixinName = (style) => build.nameOf(pathOf('text-style', style));
/** A Figma weight name as the CSS number the export writes ("Heavy" is 900). */
export const fontWeight = (w) => DTCG.fontWeight(w) ?? 400;
/** The CSS angle a Figma gradient angle becomes, from the token build — the
    docs drew the same paint styles with plain degrees, so a swatch and the
    shipped CSS disagreed at every diagonal. */
export const gradientAngle = build.gradientAngle;
/** Each effect style's shadow as the token build writes it: snapshot → DTCG
    (the export) → box-shadow (the build), keyed by style name. Drawn from the
    resolved values: a binding is a reference only the build resolves. */
export const shadowsOf = (snapshot) => new Map(fromSnapshot.toDtcgSnapshot(snapshot).effectStyles
  .map((s) => [s.name, DTCG.shadowToken({ ...s, effects: s.effects.map((e) => ({ ...e, bound: {} })) }).token])
  .filter(([, t]) => t).map(([n, t]) => [n, build.shadowCss(t.$value)]));

const where = contract.layout(null, label);
if (!where.paths) throw new Error(`${label}: ${where.error}`);

const P = where.paths;
const dir = (x) => (x && existsSync(x) ? x : null);

// the project's layout, for the toolkit's readers that take it (component-contract's official contracts)
export const layout = where;
export const project = {
  id: label,
  name: where.name,
  phase: where.phase,
  markers: where.markers,
  done: where.done,
  doc: where.doc,
  audit: where.audit,                       // the folder
  parity: where.parity,
  site: where.site,
  // where the contract editor serves this project's library (its project block's `editorPort`), for each component's Propose a change
  // the project named too: every project's editor defaults to one port, so the editor there may serve another
  editor: `http://localhost:${where.editorPort}/?project=${encodeURIComponent(label)}`,
  // One record per library, in the order the project states them: a library
  // is a Figma file, and two files have two runs (toolkit-standard §D 12 —
  // the project says which libraries it has, and here they each get a record).
  auditRecords: contract.auditRecords(where),
  repo: where.repo,
  files: where.files,
  figmaKey: where.figmaKey,
  paths: P,
  root: where.repo || where.projectDir,
  public: dir(typeof P.public === 'string' ? P.public : null),
  stylesheets: (P.stylesheets || []).filter(existsSync),
  // the project's own Storybook, else the one the code audit builds of a library made elsewhere
  storybook: P.storybook && dir(P.storybook.dir) ? P.storybook : dir(where.storybook) ? { dir: where.storybook } : null,
};

// What this phase shows. Design: a handoff spec and the design progress the
// page markers carry. Build: stories and parity as well. Maintenance: progress
// goes (a library in production is finished by definition), the rest stays.
export const shows = {
  // what the code renders, wherever a Storybook exists; the design's image stands in where none does
  stories: Boolean(project.storybook),
  // Parity once code exists, whatever renders it: Storybook or a project's own gallery.
  parity: project.phase !== 'design',
  progress: project.phase === 'design',
  handoff: project.phase === 'design',
};

export const status = (page) => contract.status(page, project.markers);

// The code audit's last report (tools/parity/external.mjs): a library someone
// else built, measured against the design's component contracts. Absent
// until the project maps its code and runs it.
export const codeAudit = (() => {
  const f = join(project.parity, 'report.json');
  return f && existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : null;
})();

// What each library is built AS, per the project's own audit settings — the
// project states it, the toolkit reads it (toolkit-standard §D 7, §D 12).
// Keyed by Figma file key; `null` where the project states none, which the
// caller must treat as "say nothing about code" rather than as a default.
// The Implementation table read `web` for every project before this: a
// single-library iOS or Android project was told, as fact, what the web does.
/*
 * The project's dialect, and the helper that applies it to words THIS SITE
 * writes — a section heading, a column label. Never to the project's own
 * words: its token names, component names and descriptions are its to spell.
 *
 * Set in the project's context document and nowhere else; en-GB when absent.
 */
const dialect = require(join(TOOLKIT, 'tools/shared/dialect.cjs'));
export const language = contract.auditContext(project.doc).language;
// The work-in-progress marker, from the project's settings over the house default (figma-standard rule 13):
// per library, since each library's settings may name its own; `statusMarker` is the first library's,
// for pages that are about the project as a whole.
const libraryTokens = (key) => ((contract.auditContext(project.doc).libraries || {})[key] || {}).tokens || {};
export const statusMarkerOf = (key) => libraryTokens(key).statusMarker || null;
// Collections a library keeps for itself (`tokens.local`): outside the system,
// so the Foundations pages leave them out.
export const localCollections = new Set(Object.keys(contract.auditContext(project.doc).libraries || {}).flatMap((k) => [].concat(libraryTokens(k).local || [])));
export const statusMarker = statusMarkerOf(Object.keys(contract.auditContext(project.doc).libraries || {})[0]);
// For format.js, which cannot import this module (see there).
globalThis.__docsLanguage = language;
/** `ours('Behaviour')` → `'Behavior'` on an en-US project. */
export const ours = (text) => dialect.say(text, language);

export const codeTargets = (() => {
  const ctx = contract.auditContext(project.doc);
  const m = new Map();
  for (const [key, lib] of Object.entries(ctx.libraries || {})) m.set(key, lib.codeTarget || null);
  return m;
})();
/*
 * The component library the project BUILDS with, per Figma file, with the map
 * from a Figma component name to its counterpart. The validator's framework
 * layer needs both or it runs none of its rules.
 *
 * Without this the docs build validated for the platform alone while the audit
 * validated for the platform AND the framework, so the framework's findings
 * existed in neither place once the queue stopped filing the code-only ones:
 * 13 MU4 rows left the board for the Implementation tables and were not in
 * them, because the build that writes those tables had never been told the
 * project uses MUI.
 */
export const frameworks = (() => {
  const ctx = contract.auditContext(project.doc);
  const m = new Map();
  for (const [key, lib] of Object.entries(ctx.libraries || {}))
    m.set(key, lib.framework ? { framework: lib.framework, frameworkMap: lib.frameworkComponents || {} } : null);
  return m;
})();
// The validator's state vocabulary per library, from its settings.
export const statesOf = (() => {
  const ctx = contract.auditContext(project.doc);
  return new Map(Object.keys(ctx.libraries || {}).map((key) => [key, contract.validatorStates(ctx, key)]));
})();
// The code each library is compared with on the site's Parity pages, as the
// project states it: `code: { repo, components }` on the library, the folder
// its components live in given from the repo's root. Only the libraries that
// state one: a library with no code named is compared with nothing.
export const codeOf = (() => {
  const ctx = contract.auditContext(project.doc);
  const m = new Map();
  for (const [key, lib] of Object.entries(ctx.libraries || {}))
    if (lib.code && lib.code.repo) m.set(key, { name: lib.name || null, stated: lib.code.repo, repo: contract.expand(lib.code.repo), components: lib.code.components || '' });
  return m;
})();
