// The component ladder: Draft, Ready, Stable, each a set of checks that must
// all pass (Carbon's component checklist, Primer's lifecycle), computed from
// what the audit has open on the page and the designers' status marker, never
// set by hand. With a codebase, two code checks join (mapped to code, matches
// the design). The library's headline is how many reach each level and what
// blocks the rest, so the figure is a to-do list, not a score.
import { rows, hasAudit, audit } from './tracker.js';
import { shows } from './project.js';

// What a row is, by the scanner key it carries.
const keyOf = (f) => String(f.key || '');
// The record keeps three severities: error, warn, and pref for a naming
// preference, which holds nothing back. A scanner warning, a review
// question and hygiene all land as warn. Questions and hygiene are
// told apart by their key, so only real warnings hold a component back.
const QUESTION = /^(structure\|no-autolayout\||accessibility\|(target|name)$|metadata\|guidance-code$)/;
const isQuestion = (f) => QUESTION.test(keyOf(f));
const READY = [
  ['Errors open', (f) => f.sev === 'error'],
  ['No description', (f) => keyOf(f) === 'metadata|description' && f.sev === 'error'],
  ["Usage or Don't missing", (f) => keyOf(f) === 'metadata|guidance'],
  ['Automatic layer names', (f) => keyOf(f).startsWith('naming|default|')],
];
const STABLE = [
  ['Warnings open', (f) => f.sev !== 'error' && f.sev !== 'pref' && !isQuestion(f)],
  ['Code gen notes missing', (f) => keyOf(f) === 'metadata|guidance-code'],
  // A question (an overlay may be absolute by design) does not block Ready;
  // a frame left without auto layout still keeps a component off Stable.
  ['Frames without auto layout', (f) => keyOf(f).startsWith('structure|no-autolayout|')],
];
// A check the last full audit did not run yet (its measure is absent from
// every library's metrics) is unknown, not passed: it shows as such and does
// not block, until a run records it.
const metrics = Object.values(audit?.libraries || {}).map((l) => l && l.metrics).filter(Boolean);
const ran = (field) => metrics.some((m) => field in m);
const RAN = { "Usage or Don't missing": ran('guidable'), 'Frames without auto layout': ran('frames'), 'Code gen notes missing': ran('guidable') };
// What each check means, keyed by the name checksOf gives it: the levels
// dialog lists them under their level, and the Components page's tiles link
// to it. One sentence each, in the reader's words.
const CHECK_MEANS = {
  'Has a status marker': "The component's page in Figma carries a status marker, so its design progress is known.",
  Audited: 'The audit has read the component; until it has, nothing below is known.',
  'No errors open': 'Nothing the audit raised as an error is still open: unbound values, unused properties, states that render like Rest, low contrast.',
  'Has a description': "The component's description in Figma is not empty.",
  "Usage and Don't written": 'The description says when to use the component, and when not to and what to use instead.',
  'Every layer named': 'No layer keeps a name Figma gave it, like Frame 12.',
  'In code': 'A code component is mapped to it.',
  'No warnings open': 'Nothing the audit raised as a warning is still open; its questions, hygiene notes and naming preferences do not count.',
  'Code gen notes written': 'The description says how to build the component in code.',
  'Auto layout throughout': 'Every frame that holds layers uses auto layout.',
  'Finished in Figma': "Its page in Figma carries a marker the project counts as finished.",
  'Matches the design': 'The code renders as the Figma component does, by the parity check.',
};
// What each level asks, for the dialog beside the ladder: its sense, then its
// checks in the order checksOf runs them, each with its meaning.
const named = (labels) => labels.map((label) => ({ label, means: CHECK_MEANS[label] }));
export const LEVEL_GUIDE = [
  { level: 'draft', means: 'On a component page and being worked on. A component is Draft until every Ready check passes.', checks: [] },
  { level: 'ready', means: 'Fit to share for review: every Ready check passes.', checks: named([
    ...(shows.progress ? ['Has a status marker'] : []),
    'Audited', 'No errors open', 'Has a description', "Usage and Don't written", 'Every layer named',
    ...(shows.parity ? ['In code'] : []),
  ]) },
  { level: 'stable', means: 'Safe for product teams to use: every Ready check passes, and every Stable one.', checks: named([
    'No warnings open', 'Code gen notes written', 'Auto layout throughout',
    ...(shows.progress ? ['Finished in Figma'] : []),
    ...(shows.parity ? ['Matches the design'] : []),
  ]) },
  { level: 'deprecated', means: 'Leaving the library, so left out of the count. Its description should name what replaces it.', checks: [] },
];
export const LEVEL_LABEL = { draft: 'Draft', ready: 'Ready', stable: 'Stable', deprecated: 'Deprecated' };

// The code side, only where the project has code: a page is mapped when one
// of its sets has a code counterpart, and matches when none differs.
const code = (page) => {
  if (!shows.parity) return null;
  const sets = page.components.map((c) => c.parity).filter(Boolean);
  return { mapped: sets.length > 0 || page.components.some((c) => c.stories.length), matches: sets.length > 0 && sets.every((r) => r.status === 'match') };
};

// Every check of the ladder for one page, in order, each passed or not: the
// component page lists them, and the level is the first one failing.
const checksOf = (r) => {
  const has = (test) => r.findings.some(test);
  const c = code(r.page);
  return [
    ...(shows.progress ? [{ level: 'ready', label: 'Has a status marker', pass: Boolean(r.status) }] : []),
    ...(hasAudit ? [{ level: 'ready', label: 'Audited', pass: r.audited }] : []),
    ...READY.map(([label, test]) => ({ level: 'ready', label: label.replace('Errors open', 'No errors open').replace('No description', 'Has a description').replace("Usage or Don't missing", "Usage and Don't written").replace('Automatic layer names', 'Every layer named'), pass: RAN[label] === false ? null : !has(test), blocker: label })),
    ...(c ? [{ level: 'ready', label: 'In code', pass: c.mapped, blocker: 'Not in code' }] : []),
    ...STABLE.map(([label, test]) => ({ level: 'stable', label: label.replace('Warnings open', 'No warnings open').replace('Code gen notes missing', 'Code gen notes written').replace('Frames without auto layout', 'Auto layout throughout'), pass: RAN[label] === false ? null : !has(test), blocker: label })),
    // The designers' marker counts while the library is in design; in
    // production it is no longer kept, and a component is not held by it.
    ...(shows.progress ? [{ level: 'stable', label: 'Finished in Figma', pass: r.group === 'finished', blocker: 'Not finished in Figma' }] : []),
    ...(c ? [{ level: 'stable', label: 'Matches the design', pass: c.matches, blocker: 'Differs from the design' }] : []),
  ];
};
const BLOCKER = { 'Has a status marker': 'No status marker', Audited: 'Not audited' };
// `blocks` is what holds a component at its level, the next level's failing
// checks; `todo` is every failing check of every level, in ladder order.
// `warnings` counts the open warnings that hold a component off Stable (the
// Warnings open check's own test), for the Components table's count column.
const isWarning = STABLE[0][1];
export const ladder = rows.map((row) => {
  const r = { ...row, warnings: row.findings.filter(isWarning).length };
  if (r.group === 'deprecated') return { ...r, level: 'deprecated', blocks: [], todo: [], checks: [] };
  const checks = checksOf(r);
  const failing = (level) => checks.filter((x) => x.level === level && x.pass === false).map((x) => x.blocker || BLOCKER[x.label] || x.label);
  const ready = failing('ready');
  const stable = failing('stable');
  const todo = [...ready, ...stable];
  if (ready.length) return { ...r, level: 'draft', blocks: ready, todo, checks };
  return stable.length ? { ...r, level: 'ready', blocks: stable, todo, checks } : { ...r, level: 'stable', blocks: [], todo, checks };
});

// The headline: how many at each level, and the checks holding the rest,
// most common first. Counted over `todo`, so a check is counted on every
// component that fails it, the population the AI readiness page lists: counted
// over `blocks`, a Draft component held by an error never counted its missing
// Code gen notes, and the tile read 1 where that page listed 7.
export const levelCount = (level) => ladder.filter((r) => r.level === level).length;
export const blockers = Object.entries(ladder.flatMap((r) => r.todo).reduce((m, b) => ((m[b] = (m[b] || 0) + 1), m), {})).sort((a, b) => b[1] - a[1]);
