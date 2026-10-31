#!/usr/bin/env node
/*
 * tools/css-lint/check.mjs — a project's stylesheets through the gates in
 * lint.mjs. Each project's check calls it; a project supplies facts alone, in
 * `styles` in its snapshot.config.json:
 *
 *   node tools/css-lint/check.mjs --repo <dir>
 *   node tools/css-lint/check.mjs --config <file>   (a file holding only `styles`,
 *        for a codebase with no snapshot, such as the docs site; paths are
 *        read from the file's folder unless --repo names another)
 *
 *   sources     folders holding the stylesheets, read as written
 *   skip        substrings of paths that are not hand-written sheets (generated, an entry list)
 *   compiled    one compiled stylesheet the selector gates read, or
 *   compile     { loadPaths } — each source compiled on its own with the repo's
 *               own `sass`, so a finding names the file that wrote it
 *   components  the folder of component sheets; pages: the folders of page sheets
 *   base        the sheet that states rules for every component (exempt from
 *               code-standard rule 5 and from the anchor rule, which it is where they live)
 *   naming      { kind: 'class' | 'element', prefix, part? } — see lint.mjs
 *   markup      folders and `markupExt` of the markup the hidden and label gates read
 *   tokens      folders of the generated token sheets the literal-is-token gate reads
 *
 * A gate whose inputs a project does not name is said as not run, never as clean.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import * as L from './lint.mjs';
import { walkRepo } from '../shared/walk.mjs';

const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const req = createRequire(import.meta.url);
const { expand: home } = req('../snapshot/projects.cjs');
const CONFIG = arg('--config') ? path.resolve(home(arg('--config'))) : null;
const REPO = path.resolve(home(arg('--repo') || (CONFIG ? path.dirname(CONFIG) : '.')));
const configFile = CONFIG || path.join(REPO, 'snapshot.config.json');
const config = CONFIG ? JSON.parse(fs.readFileSync(configFile, 'utf8')) : req('../shared/repo-config.cjs').repoConfig(REPO, 'css-lint');
const S = config.styles;
if (!S) { console.log(`styles: no \`styles\` block in ${path.basename(configFile)} — nothing checked`); process.exit(1); }

// the repo's one walk (tools/shared/walk.mjs), over each folder the config names
const walk = (dir) => (fs.existsSync(dir) ? walkRepo(dir) : []);
const rel = (f) => path.relative(REPO, f);
const skipped = (f) => (S.skip || []).some((s) => rel(f).includes(s));
const sources = (S.sources || []).flatMap((d) => walk(path.join(REPO, d))).filter((f) => /\.(s[ac]ss|css)$/.test(f) && !skipped(f));
const read = (f) => fs.readFileSync(f, 'utf8');
const isBase = (f) => S.base && rel(f).endsWith(S.base);

let sassLib = null;
const compiledOf = new Map();
const compile = (f) => {
  if (!compiledOf.has(f)) {
    if (!sassLib) sassLib = createRequire(path.join(REPO, 'package.json'))('sass');
    compiledOf.set(f, sassLib.compile(f, { loadPaths: (S.compile.loadPaths || []).map((p) => path.join(REPO, p)) }).css);
  }
  return compiledOf.get(f);
};

const results = [];
const gate = (name, rule, found, note) => results.push({ name, rule, found, note });

// code-standard rule 4: layers
if (S.compiled) gate('layers', 4, L.unlayered(read(path.join(REPO, S.compiled))).map((s) => `${S.compiled}: ${s}`));
else if (S.compile) gate('layers', 4, sources.flatMap((f) => L.unlayered(compile(f)).map((s) => `${rel(f)}: ${s}`)));
else gate('layers', 4, null, 'no `compiled` or `compile`');

// code-standard rule 5: a component styles its own parts; a page does not reach into one
if (S.naming && S.naming.part && S.compile) {
  const comp = sources.filter((f) => S.components && rel(f).startsWith(S.components) && !isBase(f));
  const pages = sources.filter((f) => (S.pages || []).some((p) => rel(f).startsWith(p)));
  gate('own parts', 5, [...new Set([
    ...comp.flatMap((f) => { const css = compile(f); return L.blockOf(css, S.naming) ? L.reaching(css, S.naming).map((r) => `${rel(f)}: ${r}`) : []; }),
    ...pages.flatMap((f) => L.reaching(compile(f), S.naming).map((r) => `${rel(f)}: ${r}`)),
  ])]);
} else if (S.naming && S.naming.kind === 'element' && S.compiled) {
  const css = read(path.join(REPO, S.compiled)), layer = S.componentsLayer || 'components';
  gate('own parts', 5, [...L.descendantCombinators(css, { layer }), ...L.reachesPast(css, { layer, prefix: S.naming.prefix })].map((s) => `${S.compiled}: ${s}`));
} else if (S.naming && S.compiled) gate('own parts', 5, null, 'class naming with a `compiled` sheet: code-standard rule 5 needs `compile` to read each component on its own');
else gate('own parts', 5, null, 'no `naming`');

// code-standard rule 4: !important; code-standard rule 40: outline none
gate('!important', 4, sources.flatMap((f) => L.important(read(f), { indented: f.endsWith('.sass') }).map((n) => `${rel(f)}:${n}`)));
gate('outline: none', 40, sources.flatMap((f) => L.outlineNone(read(f)).map((n) => `${rel(f)}:${n}`)));

// code-standard rule 48: the anchor reset once
if (S.compile) gate('anchor reset', 48, sources.filter((f) => S.components && rel(f).startsWith(S.components) && !isBase(f)).flatMap((f) => L.anchorResets(compile(f)).map((s) => `${rel(f)}: ${s}`)));
else if (S.compiled) gate('anchor reset', 48, L.parse(read(path.join(REPO, S.compiled))).rules.filter((r) => r.layer === (S.componentsLayer || 'components') && r.decls.some((d) => d.prop === 'text-decoration' && d.value === 'none')).map((r) => `${S.compiled}: ${r.selector}`));
else gate('anchor reset', 48, null, 'no `compiled` or `compile`');

// code-standard rule 22: a literal carries its reason (brace syntax), and a token's value is the token
const braces = sources.filter((f) => /\.(scss|css)$/.test(f)), indented = sources.filter((f) => f.endsWith('.sass'));
gate('literal reason', 22, [...braces.flatMap((f) => L.unexplained(read(f)).map((l) => `${rel(f)}:${l}`)), ...indented.flatMap((f) => L.unexplainedIndented(read(f)).map((l) => `${rel(f)}:${l}`))]);
if (S.tokens) {
  const byValue = L.tokenLengths(S.tokens.flatMap((d) => walk(path.join(REPO, d))).filter((f) => /\.(s[ac]ss|css)$/.test(f)).map(read));
  // what the design binds, off the specs the snapshot stored, through the store's reader
  const store = req('../snapshot/store.cjs');
  const specs = store.readSpecs(store.paths(REPO, req('../snapshot/projects.cjs').locate(REPO).paths).components).map((x) => x.spec);
  const families = L.boundFamilies(specs);
  if (!specs.length) gate('literal is a token', 22, null, 'no component specs to read what the design binds');
  else gate('literal is a token', 22, sources.filter((f) => !S.tokens.some((d) => rel(f).startsWith(d))).flatMap((f) => L.literalTokens(read(f), byValue, families).map((l) => `${rel(f)}:${l}`)), `binds ${Object.keys(families).sort().join(', ')}`);
} else gate('literal is a token', 22, null, 'no `tokens`');

// code-standard rules 17 and 18, off the markup
if (S.markup) {
  const files = S.markup.flatMap((d) => walk(path.join(REPO, d))).filter((f) => f.endsWith(S.markupExt || '.tsx'));
  const rules = S.compile ? sources.flatMap((f) => L.parse(compile(f)).rules) : L.parse(read(path.join(REPO, S.compiled))).rules;
  const hiddenOnes = [...new Set(files.flatMap((f) => L.hiddenByScript(read(f), S.naming)))];
  // nothing found hidden is the reader's silence, not a pass (code-standard 30)
  if (!hiddenOnes.length) gate('hidden beats the sheet', 17, null, `no element the markup hides was found in ${files.length} file(s)`);
  else gate('hidden beats the sheet', 17, L.unhidden(hiddenOnes, rules), `${hiddenOnes.length} hidden by the markup`);
  gate('icon controls are named', 18, files.flatMap((f) => L.emptyLabels(read(f)).map((n) => `${rel(f)}:${n}`)));
} else { gate('hidden beats the sheet', 17, null, 'no `markup`'); gate('icon controls are named', 18, null, 'no `markup`'); }

// code-standard rules 10 and 21, off the markup and the scripts beside it
if (S.markup) {
  const files = S.markup.flatMap((d) => walk(path.join(REPO, d))).filter((f) => f.endsWith(S.markupExt || '.tsx') || /\.(m?js|ts)$/.test(f));
  gate('no presentational attribute as a variant', 10, files.filter((f) => !/\.(m?js|ts)$/.test(f)).flatMap((f) => L.presentationalAttrs(read(f)).map((l) => `${rel(f)}:${l}`)));
  gate('modified clicks go to the browser', 21, files.filter((f) => L.modifiedClicks(read(f))).map(rel));
} else { gate('no presentational attribute as a variant', 10, null, 'no `markup`'); gate('modified clicks go to the browser', 21, null, 'no `markup`'); }

// code-standard rules 9, 36 and 47, off the markup (and code-standard rule 9 off the compiled sheet too)
if (S.markup) {
  const files = S.markup.flatMap((d) => walk(path.join(REPO, d))).filter((f) => f.endsWith(S.markupExt || '.tsx'));
  const css = S.compiled ? read(path.join(REPO, S.compiled)) : S.compile ? sources.map(compile).join('\n') : '';
  gate('a state is a pseudo-class, disabled the control\'s own', 9, [...L.stateAsAttribute(css), ...files.flatMap((f) => L.variantCollisions(read(f)).map((l) => `${rel(f)}:${l}`))]);
  gate('one enhancement, one implementation', 36, L.inlineScriptForks(files.map((f) => [rel(f), read(f)])));
  const jsx = files.filter((f) => /\.[jt]sx$/.test(f));
  if (jsx.length) gate('a client boundary pays for its own behaviour', 47, jsx.filter((f) => L.needlessClient(read(f))).map(rel));
  else gate('a client boundary pays for its own behaviour', 47, null, 'no .jsx/.tsx markup: no client boundary to pay for');
} else { gate('a state is a pseudo-class, disabled the control\'s own', 9, null, 'no `markup`'); gate('one enhancement, one implementation', 36, null, 'no `markup`'); gate('a client boundary pays for its own behaviour', 47, null, 'no `markup`'); }

// code-standard rule 42, over every sheet as written: a box sized to its text's design box
gate('no declaration made to agree with a check', 42, sources.flatMap((f) => L.textBoxHeights(read(f)).map((l) => `${rel(f)}:${l}`)));

// code-standard rule 11, over the compiled sheet: a page restating the container's width
{
  const css = S.compiled ? read(path.join(REPO, S.compiled)) : S.compile ? sources.map(compile).join('\n') : null;
  if (css) gate('a layout container is a component', 11, L.containerWidthRestated(css, { layer: S.componentsLayer || 'components' }));
  else gate('a layout container is a component', 11, null, 'no `compiled` or `compile`');
}

// code-standard rule 43, where a framework splits server from client: a function handed across
if (S.markup) {
  const tsx = S.markup.flatMap((d) => walk(path.join(REPO, d))).filter((f) => /\.[jt]sx$/.test(f));
  if (tsx.some((f) => /^\s*['"]use client['"]/.test(read(f)))) {
    let aliases = {};
    try { aliases = JSON.parse(read(path.join(REPO, 'tsconfig.json')).replace(/\/\*[\s\S]*?\*\/|^\s*\/\/.*$/gm, '')).compilerOptions.paths || {}; } catch { /* relative imports only */ }
    const resolve = (from, spec) => {
      let base = null;
      if (spec.startsWith('.')) base = path.resolve(path.dirname(from), spec);
      else for (const [k, [v]] of Object.entries(aliases)) { const pre = k.replace(/\*$/, ''); if (spec.startsWith(pre)) base = path.join(REPO, v.replace(/\*$/, ''), spec.slice(pre.length)); }
      if (!base) return null;
      return ['', '.tsx', '.ts', '.jsx', '.js', '/index.tsx', '/index.ts'].map((e) => base + e).find((f) => fs.existsSync(f) && fs.statSync(f).isFile()) || null;
    };
    gate('a function never crosses to the client', 43, tsx.flatMap((f) => L.functionProps(read(f), (spec) => { const r = resolve(f, spec); return Boolean(r && /^\s*['"]use client['"]/.test(read(r))); }).map((l) => `${rel(f)}:${l}`)));
  } else gate('a function never crosses to the client', 43, null, 'no client modules: no boundary to cross');
} else gate('a function never crosses to the client', 43, null, 'no `markup`');

// code-standard rule 16, over every sheet as written, the generated tokens included: the
// dark tier is usually there and the declaration usually is not
{
  const all = (S.sources || []).flatMap((d) => walk(path.join(REPO, d))).filter((f) => /\.(s[ac]ss|css)$/.test(f) && !/\/(vendor|gallery)\//.test(f)).map(read).join('\n');
  gate('native controls follow the theme', 16, L.colorSchemeMissing(all) ? ['a dark tier re-points the colours and nothing declares `color-scheme`'] : []);
}

// code-standard rule 39, over the compiled sheet: a page rule reaching a component's hook
{
  const css = S.compiled ? read(path.join(REPO, S.compiled)) : S.compile ? sources.map(compile).join('\n') : null;
  if (css) gate('a hook name reaches only its own', 39, L.hookCollisions(css, { layer: S.componentsLayer || 'components' }));
  else gate('a hook name reaches only its own', 39, null, 'no `compiled` or `compile`');
}

let failed = 0;
for (const { name, rule, found, note } of results) {
  if (found === null) { console.log(`note  ${name} (code-standard rule ${rule}) not run: ${note}`); continue; }
  console.log(`${found.length ? 'RED  ' : 'ok   '} ${name} (code-standard rule ${rule})${found.length ? ` — ${found.length}` : ''}${note ? ` (${note})` : ''}`);
  for (const f of process.env.STYLES_ALL ? found : found.slice(0, 30)) console.log(`        ${f}`);
  failed += found.length;
}
console.log(`styles: ${sources.length} sheets, ${results.filter((r) => r.found).length} gates run, ${failed ? `${failed} finding(s)` : 'green'}`);
process.exit(failed ? 1 : 0);
