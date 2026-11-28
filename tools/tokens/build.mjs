#!/usr/bin/env node
/*
 * The token build every repo runs, and the only one.
 *
 *   node <toolkit>/tools/tokens/build.mjs --repo <root>           # write
 *   node <toolkit>/tools/tokens/build.mjs --repo <root> --check   # regenerate beside, diff
 *
 * snapshot → DTCG (from-snapshot.mjs here, over its tested
 * dtcg.js), stored in `dtcg/` beside the snapshot → Style Dictionary (build-tokens.mjs here, with the house
 * conventions) → the repo's `paths.styles`. A repo states where things live
 * and nothing else: code-standard rules 51–55 decide what is written, so two
 * projects cannot drift into two conventions again.
 *
 * The DTCG files are kept, not built in a temp folder and thrown away: they
 * are the tokens in the published standard's format, readable by any tool
 * without knowing Figma's shape, while the snapshot beside them keeps what
 * DTCG has no place for (collection names, mode ids, the release pin).
 * Kept from 2026-10-03, when the maintainer asked why the toolkit's stored
 * output was not the established format it already converted to.
 *
 * Style Dictionary is the repo's own dependency, loaded from the repo, so the
 * toolkit stays dependency-free and every repo pins its own version.
 */
import { readFileSync, readdirSync, existsSync, mkdtempSync, rmSync, statSync, realpathSync, mkdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join, resolve, relative, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const TOOLKIT = resolve(HERE, '..', '..');
const require_ = createRequire(import.meta.url);

/* The command that rebuilds a repo's tokens: its `bin/tokens` where it has one (project-check init writes it), else
   this build by its full path, so the line is one that runs (a scratch library has no bin/). Under the projects root
   the run read (TOOLKIT_PROJECTS_ROOT), as eval's rewriteHint carries it. */
export const rebuildCommand = (repo, root = process.env.TOOLKIT_PROJECTS_ROOT) =>
  `${root ? `TOOLKIT_PROJECTS_ROOT=${root} ` : ''}${existsSync(join(repo, 'bin/tokens')) ? join(repo, 'bin/tokens') : `node ${join(TOOLKIT, 'tools/tokens/build.mjs')} --repo ${repo}`}`;

/* The build, written or (check) regenerated beside and compared: { code, out: [lines], err: [lines] }, nothing printed
   but what Style Dictionary and buildTokens warn of (`quiet` drops those: eval asks only whether the files are current).
   code 0 written or current, 1 out of date or refused, 2 the repo cannot be built (no paths.styles, no
   style-dictionary). A repo with no snapshot is code 1, as the command always said it. */
export async function tokenBuild(repo, { check = false, quiet = false } = {}) {
  const out = [], err = [];
  // (`refused`: the snapshot builds nothing, a collision or no snapshot, which a rebuild would not change)
  const done = (code, refused = false) => ({ code, out, err, refused });
  const { readRepoConfig } = require_('../shared/repo-config.cjs');
  const cfg = readRepoConfig(repo);
  if (cfg.error) { err.push(`tokens build: ${cfg.error}`); return done(2); }
  const { paths } = await import(pathToFileURL(join(TOOLKIT, 'tools/snapshot/store.cjs')).href).then((m) => m.default || m);
  const P = paths(repo, cfg.config.paths);
  if (!P.styles) { err.push(`  ${repo}/snapshot.config.json names no paths.styles — where the token stylesheets go`); return done(2); }
  if (!existsSync(P.tokens)) { err.push(`  no snapshot at ${relative(repo, P.tokens)} — take one in Figma first`); return done(1, true); }

  let SD;
  try {
    const req = createRequire(join(repo, 'package.json'));
    SD = (await import(pathToFileURL(req.resolve('style-dictionary')).href)).default;
  } catch {
    err.push(`  style-dictionary is not installed in ${repo} — add it as a dev dependency`);
    return done(2);
  }

  const { writeDtcg } = await import(pathToFileURL(join(TOOLKIT, 'tools/tokens/from-snapshot.mjs')).href);
  const { buildTokens, sharedNames, discover } = await import(pathToFileURL(join(TOOLKIT, 'tools/tokens/build-tokens.mjs')).href);
  const { collisionNames, stylesUnderVariables } = await import(pathToFileURL(join(TOOLKIT, 'tools/tokens/names.mjs')).href);

  // built beside first, then compared (--check) or written in place: a refused build writes nothing, where it once
  // left new DTCG files over the stylesheets they no longer built
  const STORED = join(dirname(P.tokens), 'dtcg');
  const dtcg = mkdtempSync(join(tmpdir(), 'dtcg-'));
  const tree = (root) => {
    const found = new Map();
    // dist/ beside them is a consumer's build, which writeDtcg leaves alone too
    const walk = (d) => { for (const n of readdirSync(d)) { const f = join(d, n); if (statSync(f).isDirectory()) { if (!(d === root && n === 'dist')) walk(f); } else if (n.endsWith('.json')) found.set(relative(root, f), readFileSync(f, 'utf8')); } };
    if (existsSync(root)) walk(root);
    return found;
  };
  // the project's ruling that a variable wins over a colour style of its name (audit-settings tokens
  // variableOverStyle): each such style dropped before the build and listed with both values; without it, refused
  const ruled = require_('../snapshot/projects.cjs').tokenSettings(cfg.config.project);
  const read = JSON.parse(readFileSync(P.tokens, 'utf8'));
  let snapshot = read, dropped = [];
  let built, files, shared, dtcgBad = [], refused = false;
  const warn = console.warn;
  if (quiet) console.warn = () => {};
  try {
    built = writeDtcg(snapshot, dtcg);
    // (the styles the ruling drops are those meeting a property a variable is written as, so read once the build's own
    // shared names are known: a variable written with its collection meets no style)
    if (ruled.variableOverStyle) {
      ({ snapshot, dropped } = stylesUnderVariables(read, sharedNames(discover(dtcg)).kept));
      if (dropped.length) built = writeDtcg(snapshot, dtcg);
    }
    files = await buildTokens(SD, { tokens: dtcg, out: P.styles, write: false });
    // (the copies the build wrote once, by the build's own reading of the files: listed whole below)
    shared = sharedNames(discover(dtcg));
    if (!check) {
      built = writeDtcg(snapshot, STORED);
      mkdirSync(P.styles, { recursive: true });
      for (const [f, body] of files) writeFileSync(join(P.styles, f), body);
    } else {
      const want = tree(dtcg), have = tree(STORED), at = relative(repo, STORED);
      for (const [f, body] of want) if (have.get(f) !== body) dtcgBad.push(`${at}/${f} differs from what the token build writes`);
      for (const f of have.keys()) if (!want.has(f)) dtcgBad.push(`${at}/${f} is generated and nothing generates it any more`);
    }
  } catch (e) {
    // writeDtcg's refusal (a reference no build resolves, a folder that is not an export) is one line, as
    // from-snapshot.mjs prints it; buildTokens' collision names the Figma names that meet, read from the snapshot
    if (!e?.refused) throw e;
    err.push(e.collisions ? collisionLine(e.collisions, snapshot, collisionNames, ruled) : e.message); refused = true;
  } finally {
    console.warn = warn;
    rmSync(dtcg, { recursive: true, force: true });
  }
  if (refused) return done(1, true);

  // A generated stylesheet the build no longer writes is stale; one it never
  // wrote (another generator's, a hand-written partial) is left alone.
  const ours = (f) => { try { return /Generated from the Figma snapshot by the toolkit token build|GENERATED by bin\/tokens|Generated by bin\/tokens/.test(readFileSync(join(P.styles, f), 'utf8').slice(0, 300)); } catch { return false; } };
  const stale = existsSync(P.styles) ? readdirSync(P.styles).filter((f) => /\.s[ac]ss$/.test(f) && !files.has(f) && ours(f)) : [];

  const rel = relative(repo, P.styles);
  if (check) {
    for (const line of dtcgBad) err.push(`  ${line}`);
    for (const [f, body] of files) {
      const file = join(P.styles, f);
      if (!existsSync(file) || readFileSync(file, 'utf8') !== body) err.push(`  ${rel}/${f} differs from what the token build writes`);
    }
    for (const f of stale) err.push(`  ${rel}/${f} is generated and nothing generates it any more`);
    if (err.length) { err.push(`  tokens: ${err.length} file(s) out of date — run ${rebuildCommand(repo)}`); return done(1); }
    out.push('  tokens: generated files match');
    return done(0);
  }
  for (const f of stale) rmSync(join(P.styles, f));
  out.push(`  tokens: DTCG → ${relative(repo, STORED)}, ${files.size} file(s) → ${rel}${stale.length ? `, ${stale.length} stale removed` : ''}`);
  for (const k of ['skipped', 'warnings', 'aliased']) {
    const list = built.report[k] || [];
    if (list.length) out.push(`  tokens: ${list.length} ${k}: ${list.slice(0, 4).map((x) => `${x.name} (${x.reason})`).join('; ')}${list.length > 4 ? ' …' : ''}`);
  }
  // every copy written once, each said: another library's left out of the export (from-snapshot), and one name two
  // collections hold in the same modes at the same values (build-tokens sharedNames)
  const deduped = [...(built.report.deduped || []), ...[...shared.dropped].map(([k, from]) => ({ name: k.replace('\0', '/'), reason: `written once, from ${from}: the same in every mode` }))];
  if (deduped.length) out.push(`  tokens: ${deduped.length} deduped:`);
  for (const d of deduped) out.push(`    ${d.name} (${d.reason})`);
  // a finding each, whole: what the ruling settled is the library's to fix, so none is folded away
  if (dropped.length) out.push(`  tokens: ${dropped.length} colour style(s) dropped, the variable of their name kept (the project's ruling, variableOverStyle in ${relative(repo, ruled.doc)}):`);
  for (const d of dropped) out.push(`    "${d.name}" = ${d.style}; the variable ${d.variable} = ${d.values}`);
  return done(0);
}

/* buildTokens' collision as one line: the first property's Figma names, then how many more meet. Two paths that
   would share a name fail the build rather than letting one win (code-standard rule 52), so one is renamed in Figma.
   No escape keeps them apart: a slug drops punctuation (kebab-case, the same rule), and a `$` cannot reach the DTCG files,
   whose token and group names must not begin with one (Design Tokens Format Module §5.1.1, Character restrictions). */
function collisionLine(props, snapshot, collisionNames, ruled = {}) {
  const [first, ...rest] = props;
  const who = collisionNames(snapshot, first);
  const named = who.length > 1 ? `${who.map((w) => `"${w.name}" (${w.kind})`).join(' and ')} both become ${first}` : `two tokens become ${first} in one block`;
  // a colour style against a variable has a second answer, the project's ruling, said where it is not made
  const ruling = !ruled.variableOverStyle && who.some((w) => w.kind === 'colour style') && who.some((w) => w.kind.startsWith('variable')) ? ', or rule that the variable wins (audit-settings tokens variableOverStyle)' : '';
  const more = rest.length ? `; ${rest.length} more collide (${rest.slice(0, 3).join(', ')}${rest.length > 3 ? ', …' : ''})` : '';
  return `tokens: ${named}: rename one in Figma${ruling} (code-standard rule 52)${more}`;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === (() => { try { return realpathSync(process.argv[1]); } catch { return null; } })()) {
  const argv = process.argv.slice(2);
  // Without --repo, indexOf is -1 and argv[0] (say --check) became the repo.
  const at = argv.indexOf('--repo');
  const repo = resolve(at >= 0 && argv[at + 1] ? argv[at + 1] : '.');
  const r = await tokenBuild(repo, { check: argv.includes('--check') });
  for (const l of r.out) console.log(l);
  for (const l of r.err) console.error(l);
  process.exit(r.code);
}
