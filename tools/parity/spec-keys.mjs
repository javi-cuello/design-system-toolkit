/*
 * tools/parity/spec-keys.mjs — gate 10, the spec-key contract, part of the design-to-code parity
 * engine (README.md here; the method is skills/design-code-parity).
 *
 * Gate 10: every property the snapshot records is compared, or says why not.
 *
 * A project declares, beside its adapter, every key a spec node can carry:
 *
 *   { rule: '<the adapter rule that reads it>', dormant?: '<why nothing fires it yet>' }
 *   { why: { because: <one of REASONS>, note: '<the specifics>' } }
 *
 * The declaration is the project's, because the rules are its adapter's. The
 * gate is this one, so every project holds its declaration to the same
 * standard. Two projects wrote it separately and each caught what the other
 * missed: one closed the reasons to a list and made "elsewhere" name a file
 * that exists; the other walked screens and the values inside a fill (a
 * gradient's stops), and flagged an excuse for a key nothing records any more.
 */
import { createRequire } from 'node:module';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/*
 * Why an excuse must name its reason. Free text let three keys say "not yet
 * translated", which reads as a plan and works as a permanent exemption:
 * `align` was one of them, and a header drawn as a centred column and built
 * as a row passed every run. So the reasons are closed, and none means later:
 *
 *   identity     — a name or a type; there is nothing to measure
 *   elsewhere    — measured by another part of the loop, which the note names
 *   carried      — consumed by another key's rule, not on its own
 *   notDrawn     — the design does not render it
 *   unobservable — no property a browser reports corresponds to it
 *
 * A rule may be `dormant`: written, correct, and conditional on something the
 * library does not do yet. That is capability, not debt, but it is also what
 * an untested rule looks like, so the project owes a fixture that fires it.
 */
export const REASONS = ['identity', 'elsewhere', 'carried', 'notDrawn', 'unobservable'];

const require = createRequire(import.meta.url);

// Maps whose keys are Figma's own names (a component's props, a variable's
// name), not properties of the node; the rules that read them read the map.
const OPAQUE = new Set(['props', 'bindings', 'overrides']);

/** Every key under the given trees, nested values included. */
export function keysIn(trees) {
  const keys = new Set();
  const walk = (n) => {
    if (!n || typeof n !== 'object') return;
    if (Array.isArray(n)) return n.forEach(walk);
    for (const [k, v] of Object.entries(n)) { keys.add(k); if (!OPAQUE.has(k)) walk(v); }
  };
  trees.forEach(walk);
  return keys;
}

/**
 * The contract against the corpus: keys recorded and not declared, and
 * excuses (declared with a reason) for keys nothing records any more. A rule
 * no spec exercises yet is capability, not staleness.
 */
export function checkContract(trees, declared) {
  const keys = keysIn(trees);
  return {
    keys,
    undeclared: [...keys].filter((k) => !(k in declared)).sort(),
    stale: Object.entries(declared).filter(([k, d]) => d.why && !keys.has(k)).map(([k]) => k).sort(),
  };
}

/**
 * Each declaration is a rule or a reason from the closed list, with its
 * specifics; `elsewhere` names a file that exists (`exists(name)` answers),
 * because three keys once said "the children comparison" for a week after
 * nothing of that name ran.
 */
export function checkDeclarations(declared, exists) {
  const bad = [];
  for (const [key, d] of Object.entries(declared)) {
    if (d.rule && d.why) bad.push(`${key}: declared both a rule and a reason not to have one`);
    else if (d.dormant && !d.rule) bad.push(`${key}: dormant, but there is no rule to be dormant`);
    else if (d.rule) { if (!String(d.rule).trim()) bad.push(`${key}: an empty rule`); }
    else if (!d.why) bad.push(`${key}: declared nothing`);
    else if (!REASONS.includes(d.why.because)) bad.push(`${key}: "${d.why.because}" is not one of ${REASONS.join(', ')}`);
    else if (!String(d.why.note || '').trim()) bad.push(`${key}: a reason with no specifics`);
    else if (d.why.because === 'elsewhere') {
      const files = String(d.why.note).match(/[\w./-]+\.(?:m?js|cjs|php)/g) || [];
      if (!files.some(exists)) bad.push(`${key}: "elsewhere" names no file that exists — the note says "${d.why.note}"`);
    }
  }
  return bad;
}

/**
 * Every spec tree a project's snapshot holds — its components' variants and
 * its screens — at the paths its snapshot.config.json names; null for a repo
 * with no parity block (nothing there is held to the declaration).
 */
export function corpusOf(repo) {
  const file = join(repo, 'snapshot.config.json');
  if (!existsSync(file)) return null;
  const config = JSON.parse(readFileSync(file, 'utf8'));
  if (!config.parity) return null;
  const store = require('../snapshot/store.cjs');
  const paths = config.paths || {};
  const trees = [];
  const at = store.paths(repo, paths);
  for (const { spec } of store.readSpecs(paths.components && at.components)) trees.push(...spec.variants);
  for (const s of paths.screens ? store.readScreens(at.screens) : []) trees.push(s.tree);
  return trees;
}

/**
 * Excuses for keys no project's snapshot records any more. The declaration is
 * the toolkit's (adapt.mjs SPEC_KEYS) and holds every project, so one
 * project's snapshot cannot say an excuse is stale: `paragraphSpacing` is
 * recorded by one and not the other. Judged across every registered project
 * (<project home>) whose repo has a parity block, as a waiver is judged
 * across every target that declares it. A registered repo that cannot be read
 * is named in `unreadable`, because judging without it could call an excuse
 * stale that only it still needs.
 */
export function staleExcuses(declared, projectsDir) {
  const { projects } = require('../snapshot/projects.cjs');
  const trees = [], read = [], unreadable = [];
  for (const p of projects(projectsDir).list) {
    if (!p.repo) continue;
    if (!existsSync(p.repo)) { unreadable.push(`${p.name}: no repo at ${p.repo}`); continue; }
    const corpus = corpusOf(p.repo);
    if (corpus) { trees.push(...corpus); read.push(p.name); }
  }
  return { stale: checkContract(trees, declared).stale, projects: read, unreadable };
}
