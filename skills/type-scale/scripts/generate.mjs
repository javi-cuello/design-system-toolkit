#!/usr/bin/env node
// type-scale: the deterministic half of the skill (skill-standard §A clause G).
// It generates nothing until every choice below is given: a missing one comes back
// as a question, its recommended answer first, for the agent to ask and record as a
// ruling. Given every choice, it returns the published size list, the named
// exceptions, the text styles per mode, the variables that mirror them, and the checks.
//
//   node scripts/generate.mjs [options]           JSON (exit 2 with the questions owed)
//   node scripts/generate.mjs [options] --table   a readable table
//
// The choices (each asked when the context document does not record it):
//   --scope ui|content          product UI only, or UI plus long-form content
//   --list 12,14,16,…  or  --ratio 1.125|1.2, with --base 16   the published sizes, or the ratio that makes them
//   --line-height grid|role     role ratio stepped onto 4px, or the role ratio in whole px
//   --families "text=Inter,display=Inter Display"   (code=… optional)
//   --weights body=400,label=500,heading=600,display=500,code=400
//   --labels 12,14,16           label sizes, each on the list
//   --primitives "<name>" --collection "Text styles"   shared primitives; the responsive one
//   --phone yes|no              a Mobile mode: body holds, headings step down the list
//   --display 1  --display-cut none|28  --drop none|26,42  --exception none|46=48
//   --phone-hold auto|18  --phone-sizes none|Display/lg=36   recorded like the rest, so a recorded run asks nothing
// Tuning (defaults are the knowledge base's):
//   --root 16  --round 2|1  --below 2  --above 9
//   --content-body lg|md        which body style long-form content reads in (default lg)
//   --line-heights label=1.2,Heading/xl=1.1   ratio per role or per style
//   --tracking Heading/lg=0     per role or per style, in percent
//   --caps Label/sm             styles set in capitals (tracked +5%)
//   --phone-steps 1

import { fileURLToPath } from 'node:url';
import { realpathSync } from 'node:fs';

// ---------------------------------------------------------------- defaults
// Each value is the knowledge base's; the source is named beside it.
export const DEFAULTS = {
  root: 16,
  round: 2, // visual.md: "16 × 1.125ⁿ to 2px gives 26, 32 and 42 as well as 28 and 36"
  below: 2,
  above: { 1.125: 9, 1.2: 6 }, // the formula's top step under about 48px
  display: 1,
  contentBody: 'lg', // one-type-scale: Atlassian's Body L, content one step higher
  // visual.md "Reading sizes and leading": reading 1.5, labels 1.3, headings 1.2, display 1.1
  roleLineHeights: { body: 1.5, code: 1.5, label: 1.3, heading: 1.2, display: 1.1 },
  gridStep: 4, // visual.md "When Figma needs the line height in px": the 4px grid, a named choice
  // visual.md "Tracking": "12px 0, 16px −1%, 22px −2%"; large headings tighten 1 to 2% at most
  trackingAnchors: [[12, 0], [16, -1], [22, -2]],
  trackingStep: 0.5, // "rounded to half a percent"
  capsTracking: 5, // visual.md: caps "always spaced", starting at 0.05em
  // visual.md "Content heading sizes": h2 about 1.5–1.7× the body, h3 about 1.25×, h4 at the body
  contentRatios: { h2: [1.5, 1.7], h3: [1.25, 1.25] },
  // type-on-a-phone: reading sites set the phone title at 1.6–1.9× the body; the project took 1.6
  phoneTitleRatio: 1.6,
  phoneTitleBand: [1.6, 1.9],
  zoomFloor: 0.4, // type-on-a-phone "Zoom and shrinking type": no size below 0.4 of its largest
  lightWeightMax: 20, // visual.md "Weights": light faces too delicate at 14–20px or smaller
  modes: ['Desktop', 'Mobile'], // figma-handoff: a text style with modes (Desktop, Mobile)
};

// The choices asked before generating, each with its recommended answer first.
// "run" marks a recommendation from the maintainer's run of 2026-11-15 (tests/cases.md).
export const CHOICES = [
  { keys: ['scope'], question: 'Product UI only, or UI plus long-form content?',
    recommended: () => 'ui',
    why: 'one-type-scale: one list; content walks every other step, checked against reading sites' },
  { keys: ['sizes'], question: 'Which sizes: a published list, or a ratio and base?',
    recommended: a => (a.scope === 'content' ? { ratio: 1.125, base: 16 } : { list: PRODUCTIVE, base: 16 }),
    why: "visual.md, Typography: product UI takes a productive ramp in Carbon's shape (12, 14, 16, 18, 20, 24, 28, 32…); a site with long-form content takes a geometric scale, 1.125 or 1.2" },
  { keys: ['display', 'displayCut', 'drop', 'exceptions'], question: 'How many display sizes at the top, from what size headings use the display cut (none for no cut), and any sizes to drop or name as exceptions?',
    recommended: () => ({ display: 1, displayCut: 'none', drop: 'none', exceptions: 'none' }),
    why: 'one-type-scale: publish the rounded list and name every off-formula size; the display cut switches at a named size' },
  { keys: ['lineHeight'], question: 'Line height: the role ratio rounded to 4px, or the role ratio in whole px?',
    recommended: a => (a.scope === 'content' ? 'role' : 'grid'),
    why: 'run: product UI on 4px (12/16, 14/20, 16/24), a choice visual.md says to name; content keeps the ratio' },
  { keys: ['families'], question: 'Text and display families (the same family twice if there is no display cut)?',
    recommended: () => ({ text: '?', display: '?' }),
    why: 'run: family primitives by role, Font/Family/text and Font/Family/display; display binds the display cut with little or no tracking' },
  { keys: ['weights'], question: 'Weights per role?',
    recommended: () => ({ body: 400, label: 500, heading: 600, display: 500, code: 400 }),
    why: "run: labels medium, body regular, headings semibold; display a step lighter (one-type-scale); no light weight at text sizes" },
  { keys: ['labels'], question: 'Label sizes?',
    recommended: () => [12, 14, 16],
    why: 'run: Label/sm, md and lg at 12, 14 and 16; a ramp with no 16 read as wrong' },
  { keys: ['primitives', 'collection'], question: 'Which shared primitives collection holds the type primitives, and what is the responsive collection called?',
    recommended: () => ({ primitives: '?', collection: 'Text styles' }),
    why: 'run: primitives (family, weight, size) go in the global collection that also holds spacing, never a type-only one; the responsive collection is named for what it holds' },
  { keys: ['phone', 'phoneHold', 'phoneSizes'], question: 'A phone mode (body holds, headings step down the same list), what holds, and any phone size set by hand?',
    recommended: () => ({ phone: true, phoneHold: 'auto', phoneSizes: 'none' }),
    why: 'type-on-a-phone: protect the bottom of the scale, compress the top, check collisions' },
];

/** The questions still owed for these answers, each with its recommended answer. */
export function questions(answers = {}) {
  const noPhone = answers.phone === false || answers.phone === 'no';
  const has = k => (k === 'sizes' ? answers.base != null && (answers.list != null || answers.ratio != null)
    : (noPhone && (k === 'phoneHold' || k === 'phoneSizes')) || answers[k] !== undefined);
  return CHOICES.filter(c => c.keys.some(k => !has(k)))
    .map(c => ({ keys: c.keys, question: c.question, recommended: c.recommended(answers), why: c.why }));
}

const RATIOS = [1.125, 1.2];
// visual.md, Typography: the productive ramp in Carbon's shape, the recommended product-UI list
const PRODUCTIVE = [12, 14, 16, 18, 20, 24, 28, 32];
const ROLES = ['body', 'code', 'label', 'heading', 'display'];
// a family primitive is named by role, never by classification (run: never Font/Family/sans)
const FAMILY = { text: 'Font/Family/text', display: 'Font/Family/display', code: 'Font/Family/code' };
// weight primitives named by word, numbers at the primitive layer only (naming-text-styles)
const WEIGHT_WORD = { 100: 'thin', 200: 'extralight', 300: 'light', 400: 'regular', 500: 'medium', 600: 'semibold', 700: 'bold', 800: 'extrabold', 900: 'black' };

// t-shirt words centred on md: … 2xs xs sm md lg xl 2xl … (naming-text-styles)
export function sizeWords(n) {
  const md = Math.ceil((n - 1) / 2);
  return Array.from({ length: n }, (_, i) => {
    const d = i - md;
    if (d === 0) return 'md';
    const k = Math.abs(d);
    if (k === 1) return d < 0 ? 'sm' : 'lg';
    const far = d < 0 ? 'xs' : 'xl';
    return k === 2 ? far : `${k - 1}${far}`;
  });
}

const round4 = x => Math.round(x * 10000) / 10000;
const roundTo = (x, step) => Math.round(x / step) * step;
const fail = msg => { throw new Error(msg); };

// The role ratio stepped onto the grid: the nearest multiple of 4, a tie rounding down
// (run of 2026-11-15: 12px at 1.5 is 18, set 12/16, the 12/16 Carbon, Material and Fluent use).
export function gridLineHeight(ratio, size, step = DEFAULTS.gridStep) {
  return Math.ceil(ratio * size / step - 0.5) * step;
}

// ---------------------------------------------------------------- the list
function buildList(o) {
  const formula = [];
  if (o.list) {
    const l = [...new Set(o.list)].sort((a, b) => a - b);
    const bi = l.indexOf(o.base);
    if (bi < 0) fail(`base ${o.base} is not on the list (${l.join(', ')})`);
    l.forEach((px, i) => formula.push({ n: i - bi, exact: px, rounded: px }));
  } else for (let n = -o.below; n <= o.above; n++) {
    const exact = o.base * Math.pow(o.ratio, n);
    formula.push({ n, exact: Math.round(exact * 100) / 100, rounded: roundTo(exact, o.round) });
  }
  if (formula.find(f => f.n === 0).rounded !== o.base) fail(`base ${o.base} does not survive rounding to ${o.round}px`);

  const merged = [];
  for (let i = 1; i < formula.length; i++) {
    if (formula[i].rounded === formula[i - 1].rounded) merged.push({ steps: [formula[i - 1].n, formula[i].n], size: formula[i].rounded });
  }
  const roundedSizes = [...new Set(formula.map(x => x.rounded))];
  const exceptions = [];
  for (const [from, to] of Object.entries(o.exceptions)) {
    const f = formula.find(x => x.rounded === Number(from));
    if (!f) fail(`exception ${from}=${to}: ${from} is not a rounded formula size (${roundedSizes.join(', ')})`);
    if (f.n === 0) fail('the base size cannot be an exception');
    exceptions.push({ step: f.n, formula: f.exact, rounded: f.rounded, published: Number(to) });
  }
  for (const d of o.drop) {
    if (!roundedSizes.includes(d)) fail(`drop ${d}: not a rounded formula size (${roundedSizes.join(', ')})`);
    if (d === o.base) fail('the base size cannot be dropped');
  }

  const seen = new Map();
  for (const f of formula) {
    const ex = exceptions.find(e => e.step === f.n);
    const px = ex ? ex.published : f.rounded;
    if (!ex && o.drop.includes(f.rounded)) continue;
    if (!seen.has(px)) seen.set(px, { px, step: f.n, formula: f.exact, exception: !!ex });
  }
  const list = [...seen.values()].sort((a, b) => a.px - b.px);
  for (let i = 1; i < list.length; i++) list[i].ratioToPrevious = round4(list[i].px / list[i - 1].px);

  // primitives: plain numbers, base = 100; 75 below it is Polaris's (naming-text-styles), 50 and 25 the toolkit's extension
  const bi = list.findIndex(s => s.px === o.base);
  const belowNames = [75, 50, 25];
  if (bi > belowNames.length) fail(`${bi} sizes under the base: primitives number at most ${belowNames.length} below it (75, 50, 25)`);
  list.forEach((s, i) => {
    const num = i >= bi ? 100 * (i - bi + 1) : belowNames[bi - i - 1];
    s.name = `Font/Size/${num}`;
    s.codeName = `font-size-${num}`;
    s.rem = round4(s.px / o.root);
  });
  return { formula, list, exceptions, merged, dropped: [...o.drop].sort((a, b) => a - b) };
}

// ---------------------------------------------------------------- styles
function trackingFor(size, o) {
  const a = o.trackingAnchors;
  let t;
  if (size <= a[0][0]) t = a[0][1];
  else if (size >= a[a.length - 1][0]) t = a[a.length - 1][1];
  else {
    const i = a.findIndex(([s]) => s > size);
    const [s0, t0] = a[i - 1], [s1, t1] = a[i];
    t = t0 + (t1 - t0) * (size - s0) / (s1 - s0);
  }
  const r = roundTo(t, o.trackingStep);
  return r === 0 ? 0 : r; // no -0
}

function lineHeightFor(role, name, size, o) {
  const ratio = o.lineHeights[name] ?? o.lineHeights[role] ?? o.roleLineHeights[role];
  if (o.lineHeight === 'grid') {
    const px = gridLineHeight(ratio, size, o.gridStep);
    return { css: round4(px / size), figma: `${round4(px / size * 100)}%`, px, fromRatio: ratio };
  }
  return { css: ratio, figma: `${round4(ratio * 100)}%`, px: Math.round(ratio * size) };
}

function styleAt(role, name, size, o) {
  const weight = o.weights[name] ?? o.weights[role];
  const caps = o.caps.includes(name);
  const cut = role === 'code' ? 'code'
    : role === 'display' || (role === 'heading' && o.displayCut != null && size >= o.displayCut) ? 'display' : 'text';
  let tracking;
  if (o.tracking[name] != null) tracking = o.tracking[name];
  else if (o.tracking[role] != null) tracking = o.tracking[role];
  else if (caps) tracking = o.capsTracking;
  else if (cut !== 'text') tracking = 0; // a display cut is already spaced tight; code is monospaced
  else tracking = trackingFor(size, o);
  return {
    name, codeName: name.toLowerCase().replace('/', '-'), role, size,
    lineHeight: lineHeightFor(role, name, size, o),
    weight, tracking: { figma: `${tracking}%`, css: `${round4(tracking / 100)}em` },
    family: FAMILY[cut], caps,
  };
}

function buildStyles(o, list) {
  const sizes = list.map(s => s.px);
  const bi = sizes.indexOf(o.base);
  const at = i => { if (i < 0 || i >= sizes.length) fail(`the list has no size ${i - bi} steps from the base: widen --below or --above`); return sizes[i]; };

  const plan = [];
  for (const l of o.labels) if (!sizes.includes(l)) fail(`label size ${l} is not on the list (${sizes.join(', ')})`);
  sizeWords(o.labels.length).forEach((w, i) => plan.push(['label', `Label/${w}`, o.labels[i]]));
  if (bi > 0) plan.push(['body', 'Body/sm', at(bi - 1)]);
  plan.push(['body', 'Body/md', o.base]);
  plan.push(['body', 'Body/lg', at(bi + 1)]);

  const content = o.scope === 'content';
  const contentBodySize = o.contentBody === 'lg' ? at(bi + 1) : o.base;
  if (o.families.code) plan.push(['code', 'Code', content ? at(sizes.indexOf(contentBodySize) - 1) : o.base]);

  // in content, h4 is a heading at the reading body; in product UI headings start above Body/lg
  const upper = sizes.slice(content ? bi + 1 : bi + 2);
  if (upper.length <= o.display) fail(`${upper.length} sizes above the base leave no headings beside ${o.display} display`);
  const headings = upper.slice(0, upper.length - o.display);
  const displays = upper.slice(upper.length - o.display);
  sizeWords(headings.length).forEach((w, i) => plan.push(['heading', `Heading/${w}`, headings[i]]));
  const dw = displays.length === 1 ? ['/lg'] : sizeWords(displays.length).map(w => `/${w}`);
  displays.forEach((s, i) => plan.push(['display', `Display${dw[i]}`, s]));

  for (const key of [...Object.keys(o.lineHeights), ...Object.keys(o.weights), ...Object.keys(o.tracking), ...o.caps, ...Object.keys(o.phoneSizes)]) {
    if (!ROLES.includes(key) && !plan.some(p => p[1] === key)) fail(`"${key}" is neither a role nor a style (${plan.map(p => p[1]).join(', ')})`);
  }
  for (const r of ROLES) if (o.weights[r] == null && plan.some(p => p[0] === r)) fail(`weights: none given for the ${r} role`);
  return { plan, contentBodySize };
}

// ---------------------------------------------------------------- content
function contentMap(o, built, plan, contentBodySize) {
  const sizes = built.list.map(s => s.px);
  const headingAt = px => plan.find(p => p[0] === 'heading' && p[2] === px)?.[1] ?? null;
  const nearest = target => sizes.reduce((a, b) => (Math.abs(b - target) < Math.abs(a - target) ? b : a));
  const bodyStep = built.list.find(s => s.px === contentBodySize).step;
  // the strict stride: every other formula step above the body (one-type-scale; type-on-a-phone's
  // first draft from 18 gave h4 22, h3 28, h2 36)
  const strictAt = k => {
    const f = built.formula.find(x => x.n === bodyStep + k);
    if (!f) return null;
    const ex = built.exceptions.find(e => e.step === f.n);
    const px = ex ? ex.published : f.rounded;
    return { px, ratio: round4(px / contentBodySize), onList: sizes.includes(px) };
  };
  const levels = {};
  const checks = [];
  levels.h4 = { style: headingAt(contentBodySize), size: contentBodySize, ratio: 1 };
  if (!levels.h4.style) checks.push({ level: 'h4', problem: `no heading style at the body size ${contentBodySize}px: h4 is the body size in bold` });
  const pick = (tag, [lo, hi], k) => {
    const px = nearest(contentBodySize * (lo + hi) / 2);
    const ratio = round4(px / contentBodySize);
    const strict = strictAt(k);
    levels[tag] = { style: headingAt(px), size: px, ratio };
    checks.push({ level: tag, readingSite: lo === hi ? `about ${lo}×` : `${lo}–${hi}×`, pick: px, pickRatio: ratio, strictStride: strict, strictAgrees: !!strict && strict.px === px });
    if (!levels[tag].style) checks.push({ level: tag, problem: `no heading style at ${px}px: the headings are ${plan.filter(p => p[0] === 'heading').map(p => p[2]).join(', ')}` });
  };
  pick('h3', o.contentRatios.h3, 4);
  pick('h2', o.contentRatios.h2, 6);
  const top = plan.filter(p => p[0] === 'heading').at(-1);
  levels.h1 = { style: top[1], size: top[2], ratio: round4(top[2] / contentBodySize) };
  levels.p = { style: plan.find(p => p[0] === 'body' && p[2] === contentBodySize)[1], size: contentBodySize };
  const tags = ['h1', 'h2', 'h3', 'h4'];
  for (let i = 1; i < tags.length; i++) {
    if (levels[tags[i]].size >= levels[tags[i - 1]].size) checks.push({ level: tags[i], problem: `${tags[i]} (${levels[tags[i]].size}) is not smaller than ${tags[i - 1]} (${levels[tags[i - 1]].size})` });
  }
  return { body: contentBodySize, levels, checks };
}

// ---------------------------------------------------------------- phone
function phoneMode(o, list, plan, content) {
  const sizes = list.map(s => s.px);
  // auto: hold up to the reading body (content) or Body/lg (UI), below the lowest heading, so no heading holds beside one that steps onto it
  const hold = o.phoneHold !== 'auto' && o.phoneHold != null ? o.phoneHold : (content ? content.body : sizes[sizes.indexOf(o.base) + 1]);
  const rows = plan.map(([role, name, size]) => {
    let px = size;
    if ((role === 'heading' || role === 'display') && size > hold) px = sizes[Math.max(0, sizes.indexOf(size) - o.phoneSteps)];
    return { role, name, desktop: size, phone: px };
  });
  const row = name => rows.find(r => r.name === name);
  // the page title, in content mode, to about 1.6× the body (reading sites at 375px)
  if (content && o.phoneSizes[content.levels.h1.style] == null) {
    const t = content.body * o.phoneTitleRatio;
    const px = sizes.reduce((a, b) => (Math.abs(b - t) < Math.abs(a - t) ? b : a));
    const r = row(content.levels.h1.style);
    if (px < r.phone) r.phone = px;
  }
  const exceptions = [];
  for (const [name, px] of Object.entries(o.phoneSizes)) {
    row(name).phone = px;
    if (!sizes.includes(px)) exceptions.push({ style: name, phone: px, note: 'a Mobile-only size, off the published list' });
  }
  // two levels on one size (GOV.UK's 27 and 24 both become 21)
  const levels = content
    ? ['h1', 'h2', 'h3', 'h4'].map(t => [t, content.levels[t].style]).filter(([, s]) => s)
    : rows.filter(r => r.role === 'heading').map(r => [r.name, r.name]);
  const collisions = [];
  for (let i = 0; i < levels.length; i++) for (let j = i + 1; j < levels.length; j++) {
    const a = row(levels[i][1]).phone, b = row(levels[j][1]).phone;
    if (a === b && levels[i][1] !== levels[j][1]) collisions.push({ levels: [levels[i][0], levels[j][0]], size: a });
  }
  const zoom = rows.filter(r => r.phone / r.desktop < o.zoomFloor).map(r => ({ style: r.name, desktop: r.desktop, phone: r.phone, ratio: round4(r.phone / r.desktop) }));
  const bodyShrunk = rows.filter(r => r.phone < r.desktop && ['body', 'label', 'code'].includes(r.role)).map(r => r.name);
  let title = null;
  if (content) {
    const px = row(content.levels.h1.style).phone;
    const r = round4(px / content.body);
    title = { style: content.levels.h1.style, phone: px, ratio: r, band: o.phoneTitleBand, inBand: r >= o.phoneTitleBand[0] && r <= o.phoneTitleBand[1] };
  }
  return { hold, rows, exceptions, checks: { collisions, zoom, title, bodyShrunk } };
}

// ---------------------------------------------------------------- variables
// Variables mirror the style names, <Role>/<size>/Font size and /Line height, in one
// collection named for what it holds, modes Desktop and Mobile (run of 2026-11-15; never
// Font size/<Role>/<size>). Primitives go in the project's shared global primitives collection.
function variables(o, list, desktop, phone) {
  const modes = phone ? o.modes : [o.modes[0]];
  const items = [];
  desktop.forEach((s, i) => {
    const p = phone?.[i];
    const size = { name: `${s.name}/Font size`, values: { [modes[0]]: { px: s.size, alias: s.primitive } } };
    const lh = { name: `${s.name}/Line height`, values: { [modes[0]]: { px: s.lineHeight.px } } };
    if (p) { size.values[modes[1]] = { px: p.size, alias: p.primitive }; lh.values[modes[1]] = { px: p.lineHeight.px }; }
    items.push(size, lh);
  });
  const weights = [...new Set(desktop.map(s => s.weight))].sort((a, b) => a - b).map(w => ({ name: `Font/Weight/${WEIGHT_WORD[w] ?? w}`, value: w }));
  const used = [...new Set(desktop.concat(phone ?? []).map(s => s.family))];
  const familyValue = { [FAMILY.text]: o.families.text, [FAMILY.display]: o.families.display ?? o.families.text, [FAMILY.code]: o.families.code ?? null };
  return {
    styles: { collection: o.collection, modes, variables: items },
    primitives: {
      collection: o.primitives,
      sizes: list.map(s => ({ name: s.name, value: s.px })),
      weights,
      families: used.map(name => ({ name, value: familyValue[name] })),
    },
  };
}

// ---------------------------------------------------------------- main
export function generate(input = {}) {
  const owed = questions(input);
  if (owed.length) return { questions: owed };
  const o = {
    ...DEFAULTS,
    exceptions: {}, drop: [], caps: [], lineHeights: {}, tracking: {},
    displayCut: null, phoneHold: 'auto', phoneSteps: 1, phoneSizes: {},
    ...input,
  };
  const none = v => v === 'none' || v == null;
  if (none(o.displayCut)) o.displayCut = null;
  if (none(o.drop)) o.drop = [];
  if (none(o.exceptions)) o.exceptions = {};
  if (none(o.phoneSizes)) o.phoneSizes = {};
  if (o.phone === 'yes' || o.phone === 'no') o.phone = o.phone === 'yes';
  if (typeof o.phone !== 'boolean') fail(`phone ${o.phone}: yes or no`);
  if (!Number.isInteger(o.display) || o.display < 0) fail(`display ${o.display}: a whole number of display sizes, 0 or more`);
  if (o.phoneHold != null && o.phoneHold !== 'auto' && !(Number.isFinite(o.phoneHold) && o.phoneHold > 0)) fail(`phone-hold ${o.phoneHold}: auto or a px size`);
  if (o.list && o.ratio != null) fail('give a published list or a ratio, not both');
  if (o.list && !(o.list.length && o.list.every(px => Number.isFinite(px) && px > 0))) fail(`list ${o.list}: px sizes above 0`);
  if (o.list && (o.drop.length || Object.keys(o.exceptions).length)) fail('drop and exception apply to a ratio; a published list states its sizes directly');
  if (!['ui', 'content'].includes(o.scope)) fail(`scope ${o.scope}: ui or content`);
  if (!o.list && !RATIOS.includes(o.ratio)) fail(`ratio ${o.ratio}: the knowledge base gives 1.125 or 1.2 for the single step (visual.md, type for UI and long-form content)`);
  if (![1, 2].includes(o.round)) fail(`round ${o.round}: 1 or 2 (px)`);
  if (!Number.isInteger(o.base) || o.base < 12) fail(`base ${o.base}: a whole px size of at least 12`);
  if (!['role', 'grid'].includes(o.lineHeight)) fail(`line-height ${o.lineHeight}: grid or role`);
  if (!['lg', 'md'].includes(o.contentBody)) fail(`content-body ${o.contentBody}: lg or md`);
  if (!o.families.text) fail('families: a text family is needed');
  if (typeof o.above === 'object') o.above = o.above[o.ratio];
  const content = o.scope === 'content';

  const built = buildList(o);
  const { plan, contentBodySize } = buildStyles(o, built.list);
  const map = content ? contentMap(o, built, plan, contentBodySize) : null;
  const primitiveOf = px => built.list.find(s => s.px === px)?.name ?? null;
  const desktop = plan.map(([role, name, size]) => ({ ...styleAt(role, name, size, o), primitive: primitiveOf(size) }));

  const warnings = [];
  const used = new Set(plan.map(p => p[2]));
  const unused = built.list.filter(s => !used.has(s.px)).map(s => s.px);
  if (unused.length) warnings.push(`on the list with no style: ${unused.join(', ')}`);
  for (const m of built.merged) warnings.push(`rounding merges formula steps ${m.steps.join(' and ')} at ${m.size}px`);
  for (const s of desktop) if (s.weight < 400 && s.size <= o.lightWeightMax) warnings.push(`${s.name}: weight ${s.weight} at ${s.size}px, a light weight at a text size`);
  if (o.lineHeight === 'grid') warnings.push('line heights are stepped onto 4px: a named choice, and the ratio drifts per size and mode (visual.md, when Figma needs the line height in px)');

  const out = {
    options: { scope: o.scope, list: o.list, ratio: o.list ? undefined : o.ratio, base: o.base, root: o.root, round: o.round, below: o.below, above: o.above, labels: o.labels, display: o.display, contentBody: content ? o.contentBody : undefined, lineHeight: o.lineHeight, displayCut: o.displayCut, phone: o.phone },
    formula: built.formula,
    list: built.list,
    exceptions: built.exceptions,
    dropped: built.dropped,
    styles: { desktop },
    content: map,
    warnings,
  };
  if (o.phone) {
    const ph = phoneMode(o, built.list, plan, map);
    out.styles.phone = ph.rows.map(r => ({ ...styleAt(r.role, r.name, r.phone, o), primitive: primitiveOf(r.phone) }));
    out.phone = { hold: ph.hold, exceptions: ph.exceptions, checks: ph.checks };
  }
  out.variables = variables(o, built.list, desktop, out.styles.phone);
  return out;
}

// ---------------------------------------------------------------- table
export function table(r) {
  if (r.questions) {
    return ['Ask before generating (recommended answer first):', ...r.questions.map((q, i) => `${i + 1}. ${q.question} Recommended: ${JSON.stringify(q.recommended)} (${q.why})`)].join('\n');
  }
  const L = [];
  const o = r.options;
  L.push(`Type scale: ${o.list ? `the published list ${o.list.join(', ')}` : `${o.base}px × ${o.ratio}ⁿ, rounded to ${o.round}px`}, ${o.scope === 'content' ? 'UI plus long-form content' : 'product UI only'}, line height ${o.lineHeight === 'grid' ? 'by role, stepped onto 4px' : 'by role, whole px'}`);
  L.push('', '| Primitive | px | rem | Formula | Ratio to previous |', '|---|---|---|---|---|');
  for (const s of r.list) L.push(`| ${s.name} | ${s.px} | ${s.rem} | ${s.exception ? `${s.formula} (exception)` : s.formula} | ${s.ratioToPrevious ?? ''} |`);
  if (r.exceptions.length) L.push('', 'Named exceptions: ' + r.exceptions.map(e => `${e.published} where the formula gives ${e.formula} (rounded ${e.rounded})`).join('; '));
  if (r.dropped.length) L.push('', `Dropped from the list: ${r.dropped.join(', ')}`);
  const ph = r.styles.phone;
  L.push('', `| Style | Size / line height | CSS line height | Weight | Tracking (Figma / CSS) | Family${ph ? ' | Mobile' : ''} |`, `|---|---|---|---|---|---${ph ? '|---' : ''}|`);
  r.styles.desktop.forEach((s, i) => {
    const p = ph?.[i];
    const mobile = p ? ` | ${p.size === s.size ? 'holds' : `${p.size}/${p.lineHeight.px}`}` : '';
    L.push(`| ${s.name} | ${s.size}/${s.lineHeight.px} | ${s.lineHeight.css} | ${s.weight} | ${s.tracking.figma} / ${s.tracking.css}${s.caps ? ' (caps)' : ''} | ${s.family}${mobile} |`);
  });
  if (r.content) {
    const lv = r.content.levels;
    L.push('', `Content map (body ${r.content.body}px): ` + ['h1', 'h2', 'h3', 'h4', 'p'].map(t => `${t} → ${lv[t].style ?? 'none'} ${lv[t].size}`).join(', '));
    for (const c of r.content.checks) {
      if (c.problem) L.push(`- ${c.level}: ${c.problem}`);
      else L.push(`- ${c.level}: reading sites ${c.readingSite} → ${c.pick} (${c.pickRatio}×); the strict stride gives ${c.strictStride ? `${c.strictStride.px} (${c.strictStride.ratio}×)${c.strictStride.onList ? '' : ', not on the list'}` : 'nothing'}${c.strictAgrees ? ', agrees' : ', differs: the reading-site pick is used'}`);
    }
  }
  if (r.phone) {
    const c = r.phone.checks;
    L.push('', `Mobile: sizes up to ${r.phone.hold}px hold; headings step down the list.`);
    L.push(`- Collisions: ${c.collisions.length ? c.collisions.map(x => `${x.levels.join(' and ')} both ${x.size}`).join('; ') : 'none'}`);
    L.push(`- Zoom (no size under ${DEFAULTS.zoomFloor} of its desktop size): ${c.zoom.length ? c.zoom.map(z => `${z.style} ${z.ratio}`).join('; ') : 'passes'}`);
    if (c.title) L.push(`- Page title ${c.title.phone}px, ${c.title.ratio}× the body (reading sites ${c.title.band.join('–')}×)`);
    if (c.bodyShrunk.length) L.push(`- Body or UI text smaller on a phone: ${c.bodyShrunk.join(', ')}`);
    for (const e of r.phone.exceptions) L.push(`- Named exception: ${e.style} at ${e.phone}px, ${e.note}`);
  }
  const v = r.variables;
  L.push('', `Variables: collection "${v.styles.collection}", modes ${v.styles.modes.join(', ')}, ${v.styles.variables.length} variables named <Style>/Font size and <Style>/Line height.`);
  L.push(`Primitives in "${v.primitives.collection}": ${v.primitives.sizes.map(s => s.name).join(', ')}; ${v.primitives.weights.map(w => w.name).join(', ')}; ${v.primitives.families.map(f => `${f.name} = ${f.value}`).join(', ')}.`);
  if (r.warnings.length) L.push('', ...r.warnings.map(w => `Warning: ${w}`));
  return L.join('\n');
}

// ---------------------------------------------------------------- CLI
function pairs(s, num = true) {
  const o = {};
  for (const p of s.split(',').filter(Boolean)) {
    const i = p.indexOf('=');
    if (i < 0) fail(`"${p}": expected key=value`);
    o[p.slice(0, i).trim()] = num ? Number(p.slice(i + 1)) : p.slice(i + 1).trim();
  }
  return o;
}

export function parseArgs(argv) {
  const o = {};
  let asTable = false;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const v = () => { const x = argv[++i]; if (x === undefined) fail(`${a} needs a value`); return x; };
    const list = () => v().split(',').map(Number);
    switch (a) {
      case '--scope': o.scope = v(); break;
      case '--ratio': o.ratio = Number(v()); break;
      case '--list': o.list = list(); break;
      case '--base': o.base = Number(v()); break;
      case '--line-height': o.lineHeight = v(); break;
      case '--families': o.families = pairs(v(), false); break;
      case '--weights': o.weights = pairs(v()); break;
      case '--labels': o.labels = list(); break;
      case '--primitives': o.primitives = v(); break;
      case '--collection': o.collection = v(); break;
      case '--phone': { const x = v(); if (!['yes', 'no'].includes(x)) fail('--phone yes or no'); o.phone = x === 'yes'; break; }
      case '--root': o.root = Number(v()); break;
      case '--round': o.round = Number(v()); break;
      case '--below': o.below = Number(v()); break;
      case '--above': o.above = Number(v()); break;
      case '--exception': { const x = v(); o.exceptions = x === 'none' ? 'none' : pairs(x); break; }
      case '--drop': { const x = v(); o.drop = x === 'none' ? 'none' : x.split(',').map(Number); break; }
      case '--display': o.display = Number(v()); break;
      case '--content-body': o.contentBody = v(); break;
      case '--line-heights': o.lineHeights = pairs(v()); break;
      case '--tracking': o.tracking = pairs(v()); break;
      case '--caps': o.caps = v().split(','); break;
      case '--display-cut': { const x = v(); o.displayCut = x === 'none' ? 'none' : Number(x); break; }
      case '--phone-hold': { const x = v(); o.phoneHold = x === 'auto' ? 'auto' : Number(x); break; }
      case '--phone-steps': o.phoneSteps = Number(v()); break;
      case '--phone-sizes': { const x = v(); o.phoneSizes = x === 'none' ? 'none' : pairs(x); break; }
      case '--table': asTable = true; break;
      default: fail(`unknown option ${a}`);
    }
  }
  return { options: o, asTable };
}

if (process.argv[1] && (() => { try { return realpathSync(process.argv[1]); } catch { return null; } })() === realpathSync(fileURLToPath(import.meta.url))) {
  try {
    const { options, asTable } = parseArgs(process.argv.slice(2));
    const r = generate(options);
    console.log(asTable ? table(r) : JSON.stringify(r, null, 2));
    if (r.questions) process.exit(2);
  } catch (e) {
    console.error(`type-scale: ${e.message}`);
    process.exit(1);
  }
}
