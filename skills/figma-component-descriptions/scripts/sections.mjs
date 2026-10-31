#!/usr/bin/env node
// sections.mjs - SKILL.md step 5: the Behaviour and Composition lists of a
// full-tier description, generated from what the component's interface and
// scripts/composition.js determine (toolkit-standard §D 23). The agent writes
// the purpose paragraph, Usage, Don't and Code gen notes, plus only the lines
// this script names in `gaps`; it never rewords a generated line.
//
//   node scripts/sections.mjs --composition <composition.js result>.json
//        [--settings <settings>.json] [--file-key <key>] [--language en-GB|en-US]
//   node scripts/sections.mjs ... --check <descriptions>.json
//
// --composition  composition.js's return value: an array of subjects, each with
//                `name`, `variantCount`, `variantNames`, `parts`, `broken` and `properties`
// --settings     what `node tools/snapshot/projects.cjs settings <project> <fileKey>`
//                prints: `stateAxis` and `disabledAxis` from its TOKENS, and the
//                resting state as the first option of SCALES[stateAxis]. Absent,
//                no state line is generated and `gaps` says so.
// --language     `language` from the context document's audit-settings; absent
//                means en-GB. Only the heading differs between the two.
// --check        { "<id>": "<descriptionMarkdown>" }: exits 1 naming every
//                generated line a written description lacks or reworded, and
//                every subject the file has no description for.
//
// Prints JSON: [{ id, name, behaviour[], composition[], markdown, gaps[] }].
// Plain node; its one import is the toolkit's variant-name reader (tools/shared/names.js,
// skill-standard §A clause H), which bin/get takes with it. tests/test-sections.mjs runs it on a fixture.
import { readFileSync, realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { variantValues } from '../../../tools/shared/names.js';

export const GENERATED_BY = 'skills/figma-component-descriptions/scripts/sections.mjs';
const HEADINGS = { 'en-GB': 'Behaviour', 'en-US': 'Behavior' };

const q = (s) => '`' + s + '`';
// "`A`", "`A` or `B`", "`A`, `B` or `C`" — the joiner is the caller's
const list = (xs, last = 'and') => xs.length < 2 ? xs.map(q).join('') : xs.slice(0, -1).map(q).join(', ') + ' ' + last + ' ' + q(xs[xs.length - 1]);
const byName = (a, b) => a.name.localeCompare(b.name, 'en');

// "Size=Small, State=Rest" -> { Size: "Small", State: "Rest" }
// a variant's name as its values: the toolkit's one reader
const axesOf = variantValues;

/*
 * The variants a part appears in, said as a condition on the axes when one
 * says it exactly: every axis whose values among those variants are fewer than
 * the set offers is restricted, and the restriction stands only if the
 * variants it selects are the part's variants and no others. Otherwise the
 * count stands and the run says which.
 */
function conditionOf(part, variantNames) {
  const all = variantNames.map(axesOf);
  const has = new Set(part.variants);
  const mine = variantNames.filter((v) => has.has(v)).map(axesOf);
  const axes = [...new Set(all.flatMap(Object.keys))];
  const restricted = [];
  for (const a of axes) {
    const offered = [...new Set(all.map((v) => v[a]))];
    const held = offered.filter((x) => mine.some((v) => v[a] === x));
    if (held.length < offered.length) restricted.push([a, held]);
  }
  const selects = (v) => restricted.every(([a, held]) => held.includes(v[a]));
  const exact = restricted.length && variantNames.every((name, i) => selects(all[i]) === has.has(name));
  return exact ? 'where ' + restricted.map(([a, held]) => q(a) + ' is ' + list(held, 'or')).join(' and ') : null;
}

export function sections(subject, { stateAxis = null, disabledAxis = null, restState = null, language = 'en-GB' } = {}) {
  if (!HEADINGS[language]) throw new Error('generated lists are English (en-GB or en-US); for ' + language + ' they are written by hand');
  const gaps = [];
  if (subject.error) return { id: subject.id, name: subject.name || null, behaviour: [], composition: [], markdown: '', gaps: [subject.error] };
  if (!Array.isArray(subject.properties)) gaps.push('the interface could not be read (Figma refused the set\'s definitions): both lists are written by hand');
  const props = subject.properties || [];
  const parts = (subject.parts || []).slice();

  // ── Behaviour ──
  const behaviour = [];
  for (const p of props.filter((p) => p.type === 'VARIANT' && p.name !== stateAxis && p.name !== disabledAxis)) {
    if (p.options.length < 2) { gaps.push('the ' + q(p.name) + ' axis has one option: an interface defect, reported rather than documented'); continue; }
    behaviour.push('The ' + q(p.name) + ' axis offers ' + list(p.options));
  }
  for (const p of props.filter((p) => p.type === 'BOOLEAN' && p.name !== disabledAxis)) {
    const shown = parts.filter((x) => (x.toggledBy || []).includes(p.name)).map((x) => x.name).sort((a, b) => a.localeCompare(b, 'en'));
    if (shown.length) behaviour.push('The ' + q(p.name) + ' boolean shows or hides ' + list(shown));
    else gaps.push('Behaviour: what the ' + q(p.name) + ' boolean shows or hides (no nested component carries it)');
  }
  const state = stateAxis && props.find((p) => p.type === 'VARIANT' && p.name === stateAxis);
  const disabled = disabledAxis && props.find((p) => (p.type === 'VARIANT' || p.type === 'BOOLEAN') && p.name === disabledAxis);
  if (props.some((p) => p.type === 'VARIANT') && !stateAxis) gaps.push('no stateAxis setting: the interactive-states line is not generated');
  let states = null;
  if (state) {
    if (restState && state.options.includes(restState)) states = state.options.filter((o) => o !== restState);
    else gaps.push('the resting state of ' + q(stateAxis) + ' is not known (SCALES.' + stateAxis + '[0]): the interactive-states line is not generated');
  }
  const CODE = 'managed by code and not applied in static designs';
  if (states && states.length) behaviour.push('Interactive states on the ' + q(stateAxis) + ' axis (' + states.map(q).join(', ') + ')' + (disabled ? ' and ' + q(disabledAxis) : '') + ' are ' + CODE);
  else if (disabled) behaviour.push('The ' + q(disabledAxis) + ' state is ' + CODE);
  gaps.push('Behaviour: runtime behaviour the code owns (opening, animation, focus, sorting), if any');

  // ── Composition ──
  const composition = [];
  const names = subject.variantNames || null;
  const ordered = parts.filter((x) => x.inEvery).sort(byName).concat(parts.filter((x) => !x.inEvery).sort(byName));
  for (const x of ordered) {
    let line = 'Contains ' + q(x.name);
    if (!x.inEvery) {
      const cond = names ? conditionOf(x, names) : null;
      if (cond) line += ' ' + cond;
      else {
        line += ' in ' + x.variants.length + ' of ' + subject.variantCount + ' variants';
        gaps.push('Composition: which variants show ' + q(x.name) + ' (no axis condition selects exactly its ' + x.variants.length + ')');
      }
    }
    if ((x.toggledBy || []).length) line += ', revealed by the ' + list(x.toggledBy) + ' prop';
    if ((x.swappedBy || []).length) line += ', swapped through the ' + list(x.swappedBy) + (x.swappedBy.length > 1 ? ' props' : ' prop');
    composition.push(line);
  }
  for (const p of props.filter((p) => p.type === 'INSTANCE_SWAP'))
    if (!parts.some((x) => (x.swappedBy || []).includes(p.name))) {
      composition.push('The ' + q(p.name) + ' prop swaps a nested instance');
      gaps.push('Composition: what the ' + q(p.name) + ' prop swaps (no nested component is bound to it)');
    }
  for (const p of props.filter((p) => p.type === 'SLOT'))
    composition.push('The ' + q(p.name) + ' slot takes any custom content, passed in rather than hardcoded');
  for (const b of subject.broken || [])
    gaps.push('a broken nested instance ' + q(b.instance) + ' in ' + q(b.variant) + ': reported, never documented');

  const md = [];
  if (behaviour.length) md.push('## ' + HEADINGS[language], ...behaviour.map((l) => '- ' + l), '');
  if (composition.length) md.push('## Composition', ...composition.map((l) => '- ' + l), '');
  return { id: subject.id, name: subject.name, behaviour, composition, markdown: md.join('\n').trim(), gaps };
}

// Every generated line a written description lacks under its heading, verbatim.
export function check(markdown, generated, language = 'en-GB') {
  const section = (h) => {
    const m = String(markdown || '').split(/\n(?=## )/).find((s) => s.replace(/^\n+/, '').startsWith('## ' + h + '\n') || s.trim() === '## ' + h);
    return m ? m.split('\n').filter((l) => l.startsWith('- ')).map((l) => l.slice(2).trim()) : [];
  };
  const missing = [];
  for (const [h, lines] of [[HEADINGS[language], generated.behaviour], ['Composition', generated.composition]]) {
    const have = section(h);
    for (const l of lines) if (!have.includes(l)) missing.push(h + ': ' + l);
  }
  return missing;
}

// What a settings file printed by projects.cjs gives this script.
export function settingsFrom(printed, fileKey) {
  const keys = Object.keys(printed || {});
  const k = fileKey || (keys.length === 1 ? keys[0] : null);
  if (!k || !printed[k]) throw new Error('name the library with --file-key: ' + keys.join(', '));
  const t = printed[k].TOKENS || {}, scales = printed[k].SCALES || {};
  return { stateAxis: t.stateAxis || null, disabledAxis: t.disabledAxis || null,
           restState: t.stateAxis && Array.isArray(scales[t.stateAxis]) ? scales[t.stateAxis][0] : null };
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const arg = (n) => { const i = args.indexOf(n); return i > -1 ? args[i + 1] : null; };
  const json = (f) => JSON.parse(readFileSync(f, 'utf8'));
  if (!arg('--composition')) { console.error('usage: sections.mjs --composition <file> [--settings <file>] [--file-key <key>] [--language en-GB|en-US] [--check <file>]'); process.exit(2); }
  const opts = Object.assign(arg('--settings') ? settingsFrom(json(arg('--settings')), arg('--file-key')) : {}, { language: arg('--language') || 'en-GB' });
  const subjects = [].concat(json(arg('--composition')));
  const out = subjects.map((s) => Object.assign({ generatedBy: GENERATED_BY }, sections(s, opts)));
  if (arg('--check')) {
    const written = json(arg('--check'));
    const absent = out.filter((g) => !(g.id in written));
    const bad = out.flatMap((g) => g.id in written ? check(written[g.id], g, opts.language).map((m) => g.name + ' — ' + m) : []);
    for (const g of absent) console.log('missing: ' + (g.name || g.id) + ' (' + g.id + ') has no description in ' + arg('--check'));
    for (const b of bad) console.log('missing or reworded: ' + b);
    if (absent.length) console.log(absent.length + ' subject(s) with no description');
    console.log(bad.length ? bad.length + ' generated line(s) not in the written descriptions' : 'every generated line is in its description');
    process.exit(bad.length || absent.length ? 1 : 0);
  }
  console.log(JSON.stringify(out, null, 2));
}
