// Reads the project's Figma snapshot and shapes it for pages. Nothing here
// knows a token or component name: groups come from the paths in the file.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { layout, project, shows, status, guidance, contract, spec as specModule, codeTargets, frameworks, statesOf, tokens, ours, TOOLKIT, localCollections, pageMarker } from './project.js';
// What code builds differently from the drawing is the component-validator
// skill's to say: the page renders its engine's output, never its own rules.
import { validate, translations, fromSnapshot } from '../../../validator/validate.mjs';
// The store's own reader for what a component is built from.
import graph from '../../../snapshot/graph.cjs';
import storeTool from '../../../snapshot/store.cjs';
import { partName, mainSet } from './format.js';
import { variantValues } from '../../../shared/names.js';
// A component's props come from its contract, read as the properties-table skill reads it.
import { propsOf } from '../../../component-contract/contract-rows.mjs';
// Its interaction states from the contract too, by the rule the contract editor uses (component-contract's layers.mjs).
import { statesOf as contractStates } from '../../../component-contract/layers.mjs';
import { pathToFileURL } from 'node:url';
import { compareNames } from '../../../shared/output.mjs';
// loaded where they are, not bundled: they require their neighbours by relative path, as project.js's tools do
const toolkitModule = (p) => import(/* @vite-ignore */ pathToFileURL(join(TOOLKIT, p)).href);
const { officials, behind, figmaBrief } = await toolkitModule('tools/component-contract/official.mjs');
// whether the project's code is built from the design or compared with it, and where its mappings are: the parity engine's
const { parityMode } = await toolkitModule('tools/parity/project.mjs');

const read = (p) => JSON.parse(readFileSync(p, 'utf8'));
const readOr = (p, fallback) => (p && existsSync(p) ? read(p) : fallback);
const P = project.paths;

// A design-only project has no snapshot until its first run; the site says so
// rather than failing.
export const hasSnapshot = existsSync(P.tokens);
// a component's official contract (tools/component-contract's official.mjs): Figma's reading stored beside its spec, or the
// project's own where it takes the contract as its source; null where none was derived yet
const official = officials(layout);
export const contractOf = (folder) => official.of(readOr(join(P.components, folder, 'contract.json'), null));
// where Figma is behind the official contracts, each with the brief for its designer; empty while Figma is the source
export const figmaBehind = behind(layout).map((d) => ({ kind: d.kind, component: d.component, folder: d.folder, brief: figmaBrief(d) }));
export const snapshot = readOr(P.tokens, { _meta: { file: 'no snapshot yet' }, collections: {}, textStyles: [], paintStyles: [], effects: [] });
export const meta = snapshot._meta;
export const changes = readOr(P.changes, []);
// The parity run's saved verdict, once code exists: per component, whether the
// build matches the design, what does not, and when it last did.
export const parity = shows.parity && P.parity ? readOr(P.parity, null) : null;

// Which Figma file each component came from. A repo takes one library file; a
// design-only project may merge several, and its store records the file per
// component, so a link opens the file that actually holds it. Null when no key
// is known: a link that guesses is worse than none.
const index = readOr(P.index, { components: {} });
const keyOf = (fileId) => {
  const entry = contract.entries(project.files?.library).find((e) => e.id === fileId || e.key === fileId);
  return entry?.key || null;
};
// Figma writes a node id with `-` for `:` in a URL, every colon, not the first.
const url = (key, nodeId) => (key ? `https://www.figma.com/design/${key}/` + (nodeId ? `?node-id=${String(nodeId).replace(/:/g, '-')}` : '') : null);
// The project's own key stands in only where the library is one file: with
// several, a node id from one opened in another is a broken link.
const libraryFiles = contract.entries(project.files?.library);
// A log entry names its file by identity, and what it is CALLED is resolved
// here, so a rename does not split one file's history in two (projects.cjs,
// "ONE FILE, ONE IDENTITY"). The same resolver serves the router's own tools.
export const fileName = (f) => contract.fileLabel({ routes: project.files?.library, sources: (meta && meta.sources) || {} }, f);
const onlyKey = libraryFiles.length <= 1 ? project.figmaKey || meta.fileKey : null;
export const figmaUrl = (nodeId, folder) => url((folder && keyOf(index.components[folder]?.file)) || onlyKey, nodeId);
/** The key of the Figma file a component came from, or null where none is known. */
export const libraryOf = (folder) => keyOf(index.components[folder]?.file) || onlyKey;

// Every variable, per collection, with its value and alias per mode. A name
// can live in two collections (one library's `Semantic - Brand` redefines
// `Colour/Level/base` per brand), so each collection keeps its own.
const byCollection = new Map();
for (const [collection, c] of Object.entries(snapshot.collections)) {
  const vars = new Map();
  for (const mode of c.modes) {
    for (const [name, value] of Object.entries(c.values[mode] || {})) {
      if (!vars.has(name)) vars.set(name, { name, collection, modes: c.modes, values: {}, aliases: {} });
      const v = vars.get(name);
      v.values[mode] = value;
      const alias = c.alias?.[mode]?.[name];
      if (alias) v.aliases[mode] = alias;
    }
  }
  byCollection.set(collection, vars);
}

export const isColour = (v) => typeof v === 'string' && /^(#|rgb|hsl|oklch)/.test(v);

export const leaf = (name) => name.split('/').at(-1);

// Figma marks a component or a variable private by a leading underscore on
// any part of its name (figma-standard rule 8): a part other files are not
// meant to use, so the site does not document it as one.
export const isPrivateName = (name) => /^\s*_|\/\s*_/.test(name);

const collectionVariables = (collection) => [...(byCollection.get(collection) || new Map()).values()];

// Resolve a variable name to its value in a mode, for styles whose stops name
// a variable rather than a colour. The lookup is the store's `valueOf` — the
// owner of "a token's value by name and mode", written after three readers
// had each written their own. This was the fourth, and the one that matched
// the mode by exact name: against a file spelling its mode `Dark`, a caller
// passing `dark` got the FIRST mode's value and no error.
export const resolve = (nameOrValue, mode) => {
  const found = tokens.valueOf(snapshot, nameOrValue, mode);
  return found === undefined ? nameOrValue : found;
};

// Weights and shadows as the token pipeline writes them, never re-derived here.
export { fontWeight as weight } from './project.js';

// A page's own name, without whatever marker leads it (❖, 🚧, a review dot): the settings' pageMarker.
const pageTitle = (page) => (pageMarker ? page.replace(pageMarker, '') : page).trim();
export const slug = specModule.slug;

// Foundations as the Figma library organises them: one page per variable
// collection, in the file's order, named as the file names it. A leading
// "01. " is how a designer sorts collections in Figma and is dropped from the
// label; the order it gave is kept. A collection holding only booleans
// (component switches, not tokens) or private variables (`_Component set`)
// has nothing to document and gets no page; nor does one the project marks
// local (`tokens.local`), which a file keeps for itself.
const STATIC = new Set(['typography', 'effects', 'paints', 'icons']);
export const collectionPages = Object.entries(snapshot.collections || {})
  .filter(([name]) => !localCollections.has(name))
  .map(([name]) => ({ name, label: name.replace(/^\s*\d+[.)]\s*/, ''), vars: collectionVariables(name).filter((v) => !isPrivateName(v.name) && !Object.values(v.values).every((x) => typeof x === 'boolean')) }))
  .filter((c) => c.vars.length)
  // A collection named like a static Foundations page (Typography, Effects,
  // Icons) would share its URL, and one of the two would not be built.
  .map((c) => ({ ...c, slug: STATIC.has(slug(c.label)) ? `${slug(c.label)}-variables` : slug(c.label), extends: snapshot.collections[c.name].extends || null }))
  // An extended collection sits under the one it extends, as Figma lists it,
  // not wherever the file happens to keep it.
  .reduce((out, c, _, all) => {
    if (c.extends && all.some((p) => p.name === c.extends)) return out;
    return out.concat(c, all.filter((x) => x.extends === c.name));
  }, []);


// ---- Components ------------------------------------------------------------

// the store's one reader, as stored (each page resolves what it draws)
const specs = storeTool.readSpecs(P.components, { compact: true }).map(({ folder, spec }) => ({ ...spec, folder }));


/*
 * What each component is built from, and what places it. Computed once, by
 * the store's own reader (`tools/snapshot/graph.cjs`), never
 * here: the relation is a fact about a snapshot, and a third implementation
 * of it in this file is what toolkit-standard §D 1 exists to stop — the
 * component-graph plugin already owns the live half, and the foundations
 * audit takes the same relation as input rather than re-deriving it.
 *
 * Resolved specs, because a delta variant can swap an instance and reading a
 * delta flat is the trap the parity skill documents.
 */
const componentGraph = graph.graphOf({
  // The file each spec came from, so a name two libraries share resolves to
  // the one in the same file rather than being refused as ambiguous.
  specs: specs.map((s) => {
    const file = (index.components[s.folder] || {}).file || null;
    try { return { ...graph.resolved(s), file }; } catch (e) { return { ...s, variants: [], file }; }
  }),
  icons: (meta.icons || []).map((i) => (typeof i === 'string' ? { name: i, page: meta.iconPage } : i)),
});
// Addressed by FOLDER, which is what the store calls this component and is
// unique; a name is not, and keying by one merged two libraries' `Button`.
const isFolder = new Set(specs.map((s) => s.folder));
const related = (folder) => ({
  uses: (componentGraph.uses.get(folder) || []).map((u) => ({ ...u, folder: isFolder.has(u.id) ? u.id : null })),
  usedBy: (componentGraph.usedBy.get(folder) || []).map((u) => ({ ...u, folder: isFolder.has(u.id) ? u.id : null })),
  // Named, never dropped: an instance of something this store does not hold
  // is usually another library's, and a page that hides it reads as complete.
  // One entry per component, not per instance: the graph lists every placement,
  // and a page counting those named one icon three times over.
  unresolved: [...new Set(componentGraph.unresolved.filter((u) => u.from === folder).map((u) => u.instanceOf))],
});

// Stories, by the folder their file sits in. A component's spec and its story
// live side by side, so the folder matches them exactly — no name is guessed.
// A library built elsewhere keeps its stories in its own folders: there the
// code audit's map says which story draws each component, and every story of
// that one's title is its. Where no Storybook exists the design's image shows.
const storyIndex = shows.stories && join(project.storybook.dir, 'index.json');
export const hasStorybook = Boolean(storyIndex && existsSync(storyIndex));
const hidden = new Set(project.storybook?.hide || []);
const storiesByFolder = new Map();
if (hasStorybook) {
  for (const e of Object.values(read(storyIndex).entries)) {
    if (e.type !== 'story' || hidden.has(e.name) || hidden.has(e.exportName)) continue;
    const folder = e.importPath.split('/').at(-2);
    if (!storiesByFolder.has(folder)) storiesByFolder.set(folder, []);
    storiesByFolder.get(folder).push({ id: e.id, name: e.name });
  }
  // a library built elsewhere: its mappings, where its context document's code.parity says (tools/parity/project.mjs loadParity)
  const pm = parityMode(project.id);
  const mapFile = pm.mode === 'compared' ? pm.mappings : null;
  if (mapFile && existsSync(mapFile)) {
    const entries = Object.values(read(storyIndex).entries).filter((e) => e.type === 'story' && !hidden.has(e.name) && !hidden.has(e.exportName));
    for (const [folder, m] of Object.entries(read(mapFile))) {
      const lead = entries.find((e) => e.id === m.storyId);
      if (!lead || storiesByFolder.has(folder)) continue;
      // the mapped story first: it is the one the audit measured
      storiesByFolder.set(folder, [lead, ...entries.filter((e) => e.title === lead.title && e.id !== lead.id)].map((e) => ({ id: e.id, name: e.name })));
    }
  }
}

// A design preview is exported at 2x; shown at the size it was drawn, read
// from the PNG header, so a 66-wide button is not stretched across the page.
// Each render is sized from its own file: a dark one need not match the light.
const shotOf = (name) => {
  const file = join(P.previews, name);
  if (!existsSync(file)) return null;
  const head = readFileSync(file).subarray(16, 24);
  const w = head.length === 8 ? head.readUInt32BE(0) : 0, h = head.length === 8 ? head.readUInt32BE(4) : 0;
  return { src: name, w: Math.round(w / 2) || null, h: Math.round(h / 2) || null };
};
const previewOf = (folder) => {
  const light = shotOf(`${folder}.png`);
  return light && { ...light, dark: shotOf(`${folder}.dark.png`) };
};
// The anatomy: the render with every option on, and its parts measured on it.
const anatomyOf = (folder) => {
  const file = join(P.previews, `${folder}.anatomy.json`);
  if (!existsSync(file) || !existsSync(join(P.previews, `${folder}.anatomy.png`))) return null;
  return { src: `${folder}.anatomy.png`, ...JSON.parse(readFileSync(file, 'utf8')) };
};

// The validator's translations for what this library is BUILT as, then the
// code half of any finding it raises for the designer, as rows of Figma, code
// and why, over every variant. The target comes from the project's audit
// settings — it said `web` for every project until 2026-09-20, so a
// single-library iOS project was shown the web's rules as fact. The engine
// only has web translations so far; any other target gets no rows, and so
// does a library whose project states no target, because a page that cannot
// name the target cannot say what the code does.
const cap = (x) => x.charAt(0).toUpperCase() + x.slice(1);
const targetOf = (spec) => codeTargets.get(keyOf(index.components[spec.folder]?.file) || onlyKey) || null;
// The framework layer travels with the target, or its rules run nowhere.
const frameworkOf = (spec) => frameworks.get(keyOf(index.components[spec.folder]?.file) || onlyKey) || null;
const statesFor = (spec) => statesOf.get(keyOf(index.components[spec.folder]?.file) || onlyKey) || undefined;
/*
 * The validator's words are the TOOLKIT's, so they follow the project's
 * dialect — the same rule the audit record's writer applies to the findings
 * it stores. This page calls `validate()` directly at build time rather than
 * reading the record, so fixing it there missed this second consumer, and an
 * en-US project's component pages went on reading "a centre stroke straddles
 * the edge". `f.layer` and `f.detail` carry the component's own layer names,
 * which is why `ours` is applied to the sentences and not to the whole row.
 */
const codeNotes = (spec) => {
  const target = targetOf(spec);
  if (target !== 'web' || !(spec.default || spec.variants?.length)) return [];
  const comps = fromSnapshot([{ name: spec.name, props: spec.props, variants: specModule.resolve(spec).variants }]);
  // Every stored name, so a nested instance is named as the store resolves it (graph.cjs nameOf).
  const decided = validate(comps, 'web', { ...(frameworkOf(spec) || {}), states: statesFor(spec), known: specs.map((x) => x.name) }).flatMap((f) => {
    const parts = f.align.split(/;\s*(?=in (?:Figma|code):|accept)/);
    const inCode = parts.find((x) => x.startsWith('in code:'));
    const inFigma = parts.find((x) => x.startsWith('in Figma:'));
    return inCode ? [{
      figma: `${f.layer === '$root' ? 'The component' : `**${f.layer}**`}, ${f.detail}`,
      code: ours(cap(inCode.slice(8).trim())),
      why: ours(inFigma ? `Open with the designer, who may instead: ${inFigma.slice(9).trim()}.` : 'The web cannot draw it as Figma does.'),
    }] : [];
  });
  return [...translations(comps, target, { states: statesFor(spec) }).map(({ figma, code, why }) => ({ figma, code, why })), ...decided];
};

const shapeSpec = (spec) => {
  const contract = contractOf(spec.folder);
  return {
    name: spec.name,
    id: spec.id,
    // from the contract the router stores beside the spec; none where it could not be derived
    props: contract ? propsOf(contract, spec) : [],
    states: contract ? contractStates(contract) : [],
    // the component opened in the project's contract editor, where a change to its API is proposed; none without a contract to open
    editor: contract ? `${project.editor}&component=${encodeURIComponent(spec.name)}` : null,
    noContract: !contract && Object.keys(spec.props || {}).length > 0,
    // Figma marks a component private by a leading underscore: a part other
    // components are built from, not one a product uses on its own.
    private: isPrivateName(spec.name),
    stories: storiesByFolder.get(spec.folder) || [],
    // A snapshot from before the plugin sent descriptions has no field at
    // all: that is "not in this snapshot", never "empty in Figma".
    guidance: 'description' in spec ? guidance.parse(spec.description) : { ...guidance.parse(''), unknown: true },
    preview: previewOf(spec.folder),
    anatomy: anatomyOf(spec.folder),
    implementation: codeNotes(spec),
    related: related(spec.folder),
    parity: parity?.components?.[spec.folder] || null,
    figma: figmaUrl(spec.id, spec.folder),
    folder: spec.folder,
  };
};

// One documentation page per Figma page: `❖ Tabs` holds Tabs and its Tab item.
// Keyed by the page itself, not its title: a file can hold two pages with one
// title (a current Sidebar and a deprecated one), and each is its own page.
// The page's marker is the designer's own status for everything on it.
// A component from a platform-routed file (a mobile library beside a web one)
// gets its own page: both draw a Button, and they are not the same component.
/*
 * The project's library of icons, illustrations and other assets: the file
 * its routing gives the `icons` role (snapshot-standard rule 17), unless that
 * file is a components library too. Its components off the icon page are
 * assets, not components: shown in that library's own section with their
 * stored previews, never as component pages. A project that routes no such
 * file keeps its icons under Foundations.
 */
const roles = contract.libraryRoles(project.doc);
const assetFiles = roles.icons.filter((k) => !roles.components.includes(k));
const sourcesOf = () => (meta && meta.sources) || {};
const assetIdents = new Set(assetFiles.map((k) => contract.fileIdent(libraryFiles, k, sourcesOf())));
const isAsset = (s) => assetIdents.has(contract.fileIdent(libraryFiles, index.components[s.folder]?.file, sourcesOf()));
/** The icon library as the file names it ("05. " numbering dropped, as for collections), or null. */
export const iconLibrary = assetFiles.length ? { name: fileName(assetFiles[0]).replace(/^\s*\d+[.)]\s*/, '') } : null;
// One gallery per page of that file, in the file's page order.
const assetPageOrder = Object.entries(sourcesOf()).filter(([f]) => assetIdents.has(contract.fileIdent(libraryFiles, f, sourcesOf()))).flatMap(([, s]) => s.pages || []);
const assetSpecs = specs.filter((s) => isAsset(s) && !isPrivateName(s.name));
const variantShot = (folder, name) => { const light = shotOf(`${folder}.variant-${slug(name)}.png`); return light && { ...light, dark: shotOf(`${folder}.variant-${slug(name)}.dark.png`) }; };
const rank = (page) => { const i = assetPageOrder.indexOf(page); return i < 0 ? Infinity : i; };
export const assetGroups = [...new Set(assetSpecs.map((s) => s.page))].sort((a, b) => rank(a) - rank(b) || compareNames(a, b)).map((page) => ({
  title: pageTitle(page),
  slug: slug(pageTitle(page)),
  // A set whose variants each have a render (plugin 0.54.0, asset libraries)
  // shows each variant, its default included, as an asset of its own, named
  // by its values.
  assets: assetSpecs.filter((s) => s.page === page).flatMap((s) => {
    const own = [s.default, ...(s.variants || [])].filter(Boolean).map((v) => ({ name: Object.values(variantValues(v.name)).join(', '), preview: variantShot(s.folder, v.name) })).filter((v) => v.preview);
    return own.length ? own : [{ name: s.figmaName || leaf(s.name), preview: previewOf(s.folder) }];
  }).sort((a, b) => compareNames(a.name, b.name)),
}));

const pages = new Map();
for (const spec of specs.filter((s) => !isAsset(s))) {
  const title = pageTitle(spec.page);
  const platform = spec.platform || null;
  const key = `${platform || ''}|${spec.page}`;
  if (!pages.has(key)) pages.set(key, { title, platform, slug: platform ? `${slug(platform)}-${slug(title)}` : slug(title), figmaPage: spec.page, status: status(spec.page), components: [] });
  pages.get(key).components.push(shapeSpec(spec));
}
export const componentPages = [...pages.values()].sort((a, b) => compareNames(a.platform || '', b.platform || '') || compareNames(a.title, b.title));

// Categories as the file draws them: a header page opens a category, a
// divider of dashes closes it, and every page between belongs to it. A header
// is a page whose name, after whatever marks it, is in capitals: figma-standard rule 11
// draws `🔷 ACTIONS`, a file may draw `❖ ACTIONS`, and the marker is the
// file's choice while the capitals are what make it a heading. Read from each
// file's page list (plugin 0.21.0), in file order; a snapshot taken before
// that carries none, and the index lists components alphabetically.
// Each list is read against its own file: a web and a mobile file both have a
// `❖ Button` page, and the mobile list must not file the web page.
/*
 * One file answers to two identities: a plugin run from the UI has no fileKey
 * and sends the document id, a headless run sends the key, so a store holds
 * whichever the run that wrote each part carried. One project's web library was
 * recorded as `QcI9…` on its components and as `fmu7ik…` on the page list its
 * categories come from, and a raw comparison filed all 61 of them under
 * "Other" while one page that happened to match kept its category — a page
 * list read and then joined to nothing, which is the shape of a probe that
 * returns nothing. The routing entries record the pair, as `fileName` above
 * already relies on, so both sides resolve through them before comparing.
 */
const identOf = (f) => contract.fileIdent(libraryFiles, f, (meta && meta.sources) || {});
// One list per FILE, not per source: a store can hold one file's list under
// both its identities — one project's web library under its document id from a
// UI run and under its key from a headless re-snapshot, the same 80 pages.
// Read twice, the first files every page and the second files none, which the
// check below rightly reads as a failed join. The newer list stands; on the
// same day, the one stored under the identity itself.
const pageLists = (() => {
  const byFile = new Map();
  for (const [file, s] of Object.entries(meta?.sources || {})) {
    if (!s.pages) continue;
    const ident = identOf(file), had = byFile.get(ident);
    if (!had || (s.at || '') > had.at || ((s.at || '') === had.at && file === ident)) byFile.set(ident, { file, pages: s.pages, at: s.at || '' });
  }
  const lists = [...byFile.values()];
  return lists.length ? lists : meta?.pages ? [{ file: null, pages: meta.pages }] : [];
})();
const inFile = (page, file) => !file || page.components.some((c) => identOf(index.components[c.folder]?.file) === identOf(file)) || !page.components.some((c) => index.components[c.folder]);
export const categories = [];
{
  const seen = new Map();
  for (const [listAt, { file, pages: list }] of pageLists.entries()) {
    let current = null;
    let headers = 0, filed = 0;
    for (const [at, name] of list.entries()) {
      const title = pageTitle(String(name));
      // A page that holds components is never a header, capitals or not:
      // `❖ FAB - AI` is a component named in an acronym.
      const holds = componentPages.some((p) => p.figmaPage === name && inFile(p, file));
      if (!holds && /\p{Lu}/u.test(title) && !/\p{Ll}/u.test(title)) {
        const label = title.toLowerCase().replace(/(^|[\s&/-])\p{L}/gu, (m) => m.toUpperCase());
        if (!seen.has(label)) { seen.set(label, { label, pages: [] }); categories.push(seen.get(label)); }
        current = seen.get(label);
        headers++;
      } else if (/^\s*-{2,}\s*$/.test(name)) current = null;
      else if (current) {
        const page = componentPages.find((p) => p.figmaPage === name && inFile(p, file));
        if (page && !page.category) {
          page.category = current.label; page.order = at; current.pages.push(page); filed++;
          // Where the category sits is where its first page sits, not where
          // its heading was first read. One project's foundations file is read first
          // and names LAYOUT and ASSETS, so both labels existed before the
          // component library's own sections did, and the index opened with a
          // Layout section holding one Divider that Figma draws between Inputs
          // and Messaging. A label two files share belongs where its earliest
          // page is.
          current.at ??= [listAt, at];
        }
      }
    }
    // A list that found its headers and filed nothing, while pages this store
    // holds are named in it, has joined to nothing — the identity it is keyed
    // by and the one its components carry are different names for one file.
    // Left silent it renders as one big "Other", which reads like a file with
    // no sections rather than a reader that could not match: the failure that
    // put 61 of one project's 62 components there. A probe returning nothing is a
    // finding about the probe.
    if (headers && !filed && componentPages.some((p) => list.includes(p.figmaPage)))
      throw new Error(`the page list for ${file} names ${headers} section(s) and pages this store holds, and filed none of them: the list and the components are keyed by different identities of one file`);
  }
  const first = (c) => c.at || [Infinity, Infinity];
  categories.sort((a, b) => first(a)[0] - first(b)[0] || first(a)[1] - first(b)[1]);
  const loose = componentPages.filter((p) => !p.category);
  if (categories.length && loose.length) categories.push({ label: 'Other', pages: loose });
}
// A project that documents more than one platform addresses each page under
// its platform, web included: /components/web/button, /components/mobile/button.
// A single-platform project keeps /components/button. The unlabelled library
// is then named web, so its pages say so wherever the platform shows.
if (componentPages.some((p) => p.platform)) {
  for (const p of componentPages) { p.platform ||= 'web'; p.slug = `${slug(p.platform)}/${slug(p.title)}`; }
}
// Pages that share a title share a slug; the first in the file keeps it, and
// each later one takes its category into its address (`sidebar-deprecated`),
// or a number where it has none.
{
  const taken = new Map();
  for (const p of [...componentPages].sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity))) {
    let next = taken.has(p.slug) && p.category ? `${p.slug}-${slug(p.category)}` : p.slug;
    for (let n = 2; taken.has(next); n++) next = `${p.slug}-${n}`;
    p.slug = next;
    taken.set(next, p);
  }
}
/*
 * A dependency links to the PAGE that holds it, and the slug is not final
 * until here: it is rebuilt with the platform above, and again to break a tie
 * between two pages of one name. Filled in earlier it pointed at
 * `/components/app-header` for a page that lives at `/components/web/app-header`
 * — every link in the graph a 404, because the value was read one rewrite too
 * soon. The graph is computed by FOLDER, which is stable and unique; the slug
 * is attached once, at the end, where it has stopped moving.
 */
{
  // Each set's own address: the page's for the set the page is named for, a
  // sub-page under it for every other (`tabs/tab-item`). Set here, once, and
  // read by the routes, the sidebar and the graph alike.
  for (const p of componentPages) { const main = mainSet(p); for (const c of p.components) c.path = c === main ? p.slug : `${p.slug}/${slug(partName(c.name, p.title))}`; }
  const slugOfFolder = new Map();
  for (const p of componentPages) for (const c of p.components) slugOfFolder.set(c.folder, c.path);
  for (const p of componentPages) for (const c of p.components) {
    for (const u of c.related.uses) u.slug = u.folder ? slugOfFolder.get(u.folder) || null : null;
    for (const u of c.related.usedBy) u.slug = u.folder ? slugOfFolder.get(u.folder) || null : null;
  }
}
// The platforms present, the unlabelled (primary) one first.
const platforms = [...new Set(componentPages.map((p) => p.platform))];
// Components per platform, in the file's categories where it has them and
// alphabetically where it does not: what the index and the sidebar list.
export const componentGroups = platforms.map((platform) => ({
  platform,
  groups: categories.length
    ? categories.map((c) => ({ label: c.label, pages: c.pages.filter((p) => p.platform === platform) })).filter((g) => g.pages.length)
    : [{ label: null, pages: componentPages.filter((p) => p.platform === platform) }],
}));
for (const p of componentPages) {
  // The page's own set first, then its parts, so `Tabs` leads `Tabs - Tab item`.
  p.components.sort((a, b) => (a.name === p.title ? -1 : b.name === p.title ? 1 : compareNames(a.name, b.name)));
}

// When each page last changed, and whether that was a change at all: the
// newest log entry naming any of its sets. A set the log only ever saw added
// was first recorded then, not changed, and says so.
for (const p of componentPages) {
  const touches = (e, kind) => p.components.some((c) => e.components[kind].includes(c.folder));
  const hit = [...changes].reverse().find((e) => touches(e, 'changed') || touches(e, 'added'));
  p.changedAt = hit ? hit.at : null;
  p.changeKind = hit ? (touches(hit, 'changed') ? 'changed' : 'added') : null;
}

// ---- Icons -----------------------------------------------------------------

const iconDir = P.icons;
// The stored SVG already paints in `currentColor` — the store does it once, on
// write (store.cjs `glyph`), so every reader gets the same file. This read did
// it again with its own regex, which agreed until the day one of them widened.
// A trailing `-16` is a size and groups one glyph's sizes together; a file
// without one is a glyph of its own.
const iconFiles = !iconDir || !existsSync(iconDir) ? [] : readdirSync(iconDir).filter((f) => f.endsWith('.svg'));
const glyphs = new Map();
for (const file of iconFiles) {
  const [, name, size] = file.match(/^(.*?)(?:-(\d+))?\.svg$/);
  if (!glyphs.has(name)) glyphs.set(name, []);
  const svg = readFileSync(join(iconDir, file), 'utf8');
  glyphs.get(name).push({ size: size ? Number(size) : null, svg });
}
// Each icon's group, the frame or section the file keeps it in (plugin
// 0.55.0), A to Z as icon libraries list them: the plugin sends them in layer
// order, which is bottom-up and read Z to A. The files are named by slug,
// the groups by the set's own name.
const groupOf = new Map(Object.values(meta.sources || {}).flatMap((x) => Object.entries((x.owns && x.owns.iconGroups) || {})).map(([n, g]) => [slug(n), g]));
// Its keywords, from its description (plugin 0.56.0): words or phrases split
// at commas or lines, as an icon library writes its tags.
const keywordsOf = new Map(Object.values(meta.sources || {}).flatMap((x) => Object.entries((x.owns && x.owns.iconDescriptions) || {})).map(([n, d]) => [slug(n), [...new Set(d.split(/[,\n]+/).map((w) => w.trim()).filter(Boolean))]]));
export const icons = [...glyphs].map(([name, sizes]) => ({ name, group: groupOf.get(name) || null, keywords: keywordsOf.get(name) || [], sizes: sizes.sort((x, y) => x.size - y.size) }));
// The groups with their icons; none until a run records them, and then any
// icon without one goes last, under Other.
export const iconGroups = !groupOf.size ? [] : [...[...new Set(groupOf.values())].sort(compareNames), 'Other']
  .map((title) => ({ title, icons: icons.filter((i) => (i.group || 'Other') === title) })).filter((g) => g.icons.length);

