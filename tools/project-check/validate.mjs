#!/usr/bin/env node
/*
 * tools/project-check/validate.mjs — what the project's code target cannot draw as
 * designed, read off its stored snapshot by component-validator's engine. The
 * router runs it after every library snapshot of a project with a code repo (deliver.cjs);
 * a person runs it by hand:
 *
 *   node tools/project-check/validate.mjs --repo <dir> [--context <design-system-context.md>] [component]
 *
 * The findings are decisions for the designer (Figma, code or accept), never
 * a failure, so it exits 0 unless the engine or the specs are missing. The
 * target is the context document's `codeTarget` (--context), and with none recorded
 * nothing is validated.
 *
 * Lifted from one project's bin/validate on 2026-10-03: the other project ran
 * nothing after a snapshot but its token build, so a component the web could
 * not draw reached its code unannounced. It reads the snapshot, which is right
 * here: the question is whether the stored design can be built (toolkit-standard
 * §D 5), not what is wrong in Figma now — that is the live audit's.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const TOOLKIT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const req = createRequire(import.meta.url);
const { expand } = req('../snapshot/projects.cjs');
const argv = process.argv.slice(2);
const i = argv.indexOf('--repo');
const REPO = path.resolve(expand(i >= 0 ? argv.splice(i, 2)[1] : '.'));
const ci = argv.indexOf('--context');
// The project's context document, for the library's state vocabulary.
const CONTEXT = ci >= 0 ? path.resolve(expand(argv.splice(ci, 2)[1])) : null;
const only = argv[0] || null;
const config = JSON.parse(fs.readFileSync(path.join(REPO, 'snapshot.config.json'), 'utf8'));
// where the snapshot stored them, the canonical layout where `paths` is silent
const where = req('../snapshot/store.cjs').paths(REPO, config.paths || {});
const ENGINE = path.join(TOOLKIT, 'tools/validator/validate.mjs');
const SPECS = where.components, STYLES = where.tokens;
if (!fs.existsSync(ENGINE)) { console.error(`validate: no component-validator at ${ENGINE}`); process.exit(2); }
if (!fs.existsSync(SPECS)) { console.error('validate: no stored component specs (`paths.components`) — nothing to read, and that is not a pass'); process.exit(2); }

const components = [];
for (const { folder: d, spec } of req('../snapshot/store.cjs').readSpecs(SPECS)) {
  if (only && d !== only) continue;
  components.push({ name: spec.name || d, props: spec.props, variants: spec.variants });
}
if (!components.length) { console.error(`validate: no spec read under ${path.relative(REPO, SPECS)}${only ? ` for "${only}"` : ''}`); process.exit(2); }
const input = path.join(os.tmpdir(), `validate-${path.basename(REPO)}.json`);
fs.writeFileSync(input, JSON.stringify(components));
const contract = req('../snapshot/projects.cjs');
const ctx = CONTEXT ? contract.auditContext(CONTEXT) : { libraries: {} };
const states = CONTEXT ? contract.validatorStates(ctx) : null;
// The target is the context document's codeTarget, the one fact the docs site reads too; none recorded, nothing to validate.
const targets = [...new Set(Object.values(ctx.libraries || {}).map((l) => l.codeTarget).filter(Boolean))];
if (targets.length !== 1) { console.log(`validate: ${targets.length ? `the libraries record ${targets.length} code targets (${targets.join(', ')}); run per library` : 'no codeTarget recorded in the context document'} — nothing validated`); process.exit(0); }
const args = [ENGINE, '--target', targets[0], '--snapshot', ...(STYLES && fs.existsSync(STYLES) ? ['--text-styles', STYLES] : []), ...(states ? ['--states', JSON.stringify(states)] : []), input];
const run = spawnSync('node', args, { encoding: 'utf8', maxBuffer: 1 << 26 });
fs.rmSync(input, { force: true });
if (run.status === 2 || !run.stdout) { console.error(run.stderr || 'validate: the engine failed'); process.exit(2); }
const { silent, findings } = JSON.parse(run.stdout);
const note = silent.length ? ` (snapshot path; ${silent.join(', ')} read live only)` : '';
if (!findings.length) { console.log(`validate: nothing the target cannot draw as designed, ${components.length} component(s)${note}`); process.exit(0); }
console.log(`validate: ${findings.length} decision${findings.length > 1 ? 's' : ''} for the designer before these reach code (Figma / code / accept), ${components.length} component(s)${note}`);
for (const f of findings) console.log(`  ${f.class}  ${f.component} › ${f.layer} — ${f.detail}${f.variants.length > 1 ? ` [${f.variants.length} variants]` : ''}\n       → ${f.align}`);
