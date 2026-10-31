#!/usr/bin/env node
/*
 * component-validator engine. Reads component trees (the shape
 * component-validator's scripts/walk-figma.js returns: `{ name, props, variants: [tree] }`) and
 * reports, for one target, the places that target cannot reproduce as
 * drawn. Each finding names the class from references/<target>.md.
 *
 *   node tools/validator/validate.mjs --target web|ios|android [--text-styles tokens.json]
 *     [--states '{"axis":…,"options":[…]}'] [--snapshot] components.json
 *   import { validate } from './validate.mjs'   // validate(components, target)
 *
 * Exit 1 when anything is found. Output: one JSON object, { target, silent,
 * findings }: `findings` an array of { class, component, layer, detail, align,
 * variants }, identical findings collapsed across variants so one decision
 * reads once, and `silent` the classes that could not look, a field they
 * need being absent from the trees (`(partly)` where only half could).
 */
import fs from 'node:fs';

const STATE_WORDS = /^(checked|selected|open|active|expanded|pressed|disabled|hovered?|focused|current|is[A-Z]\w*)$/i;
const CSS_BLENDS = new Set(['MULTIPLY', 'SCREEN', 'OVERLAY', 'DARKEN', 'LIGHTEN', 'COLOR_DODGE', 'COLOR_BURN', 'HARD_LIGHT', 'SOFT_LIGHT', 'DIFFERENCE', 'EXCLUSION', 'HUE', 'SATURATION', 'COLOR', 'LUMINOSITY']);

// ---- helpers over one node -------------------------------------------------
const h = n => (n.sizing || '').split('/')[1] || '';
const w = n => (n.sizing || '').split('/')[0] || '';
const padded = n => (n.pad || []).some(Boolean);
const hasText = n => n.type === 'TEXT' || (n.children || []).some(hasText);
// An icon is a GLYPH. "Icon button" and "Icon container" both contain the
// word and are neither: one is a 44×44 touch target, the other a wrapper.
// Told to become 24 dp, they were 6 of one library's 8 A14 findings and the
// bulk of another's 83 — the single loudest false class on a real board.
const ICON_NOT = /\b(button|container|wrapper|group|slot|box|frame|holder|area)\b/i;
/*
 * What an instance is an instance OF, as a person would say it. Figma records
 * the whole variant path — "_File explorer - Section / L2 / Subfolders=True,
 * Expanded=False" — and a finding that quotes it whole is unreadable: which
 * of those words is the component, and do the property values matter? They do
 * not. The component is the longest KNOWN component name the path starts
 * with, on a " / " boundary, and the rest is which variant happened to be
 * placed: a set's own name may hold " / " (`Table - Cell / Fill / Size=md`
 * is an instance of `Table - Cell / Fill`), so cutting at the first slash
 * named the wrong component. `known` is the component names in hand
 * (validate's `known` option, else the components it was given); with none
 * that match, the part before the first slash.
 */
const mainName = (n, known = []) => {
  const s = String(n.instanceOf || n.name || '').trim();
  let best = '';
  for (const k of known) if (k.length > best.length && (s === k || s.startsWith(k + ' / '))) best = k;
  return best || s.split(' / ')[0].trim();
};
const isIcon = n => n.type === 'INSTANCE' && /\bicons?\b/i.test(n.instanceOf || n.name) && !ICON_NOT.test(n.instanceOf || n.name);
const distinctFills = n => { const s = new Set(); const go = m => { for (const f of m.fills || []) s.add(f); (m.children || []).forEach(go); }; go(n); return s.size; };
const ring = name => /focus|ring|selection/i.test(name);
const stateBoolean = (props) => Object.entries(props).filter(([k, v]) => v === 'BOOLEAN' && STATE_WORDS.test(k)).map(([k]) => k);
const interactive = (props, axis) => (!!axis && Array.isArray(props[axis])) || stateBoolean(props).length > 0;
const rootSize = v => [v.w || 0, v.h || 0];

// ---- shared detectors, parameterised by class id ---------------------------
const shared = {
  strokeNotInside: (id, msg) => ({ node: (n, a, add) => { if (n.strokes && n.strokeAlign && n.strokeAlign !== 'INSIDE' && !(n.strokeAlign === 'OUTSIDE' && ring(n.name) && id === 'W5')) add(id, n.name, `its stroke sits ${n.strokeAlign === 'CENTER' ? 'on the edge, half in and half out' : 'outside the shape'}`, msg); } }),
  lineHeightAuto: (id) => ({ node: (n, a, add) => { if (n.type === 'TEXT' && n.lineHeight === 'auto') add(id, n.name, 'its line height is set to Auto', 'in Figma: set an explicit line height on the text style \u2014 Auto resolves to whatever the font happens to report, so the build and the drawing drift apart as soon as the font changes'); if (n.type === 'TEXT' && n.textStyle === 'literal') add(id, n.name, 'plain text with no text style applied', 'in Figma: apply a text style \u2014 loose text carries no name, so the build has nothing to map it to and it will not follow a change to the type scale'); } }),
  truncationOff: (id, align) => ({ node: (n, a, add) => { const p = a[a.length - 1]; if (n.type === 'TEXT' && n.truncation === 'DISABLED' && p && (w(p) === 'FIXED' || w(p) === 'FILL') && (n.text || '').length > 0 && (n.textAutoResize !== 'WIDTH_AND_HEIGHT')) add(id, n.name, 'truncation is off, inside a parent that limits its width', align); } }),
  fixedText: (id, align) => ({ node: (n, a, add) => { if (n.type === 'TEXT' && n.textAutoResize === 'NONE') add(id, n.name, 'a text box at a fixed size', align); } }),
  fixedHeightWithText: (id, align) => ({ node: (n, a, add) => { if (n.type !== 'TEXT' && h(n) === 'FIXED' && hasText(n) && !/slot|placeholder/i.test(n.name)) add(id, n.name, `a fixed height of ${n.h}px around text`, align); } }),
  // Where a child sits is the PARENT's doing, instance or not.
  absolute: (id, align) => ({ onInstance: true, node: (n, a, add) => { if (n.absolute) { const clip = a.find(x => x.clips); add(id, n.name, clip ? `positioned freely inside "${clip.name}", which clips` : 'positioned freely, outside the layout', align); } } }),
  diamond: (id) => ({ node: (n, a, add) => { if ((n.fills || []).includes('GRADIENT_DIAMOND')) add(id, n.name, 'filled with a diamond gradient', 'accept: the build will draw this as a plain radial gradient, so the corners will differ; in Figma: redraw it as linear or radial if that difference matters'); } }),
  blend: (id, allowed) => ({ node: (n, a, add) => { if (n.blendMode && !(allowed && allowed.has(n.blendMode))) add(id, n.name, `set to blend mode ${n.blendMode}`, allowed ? 'accept: the browser has no matching blend mode, so the build will show the layer flat; in Figma: redraw the effect with a fill or an opacity if the blend is doing real work' : 'in Figma: use a flat fill \u2014 the build sets blending when it draws, so a blend mode on a layer does not travel'); } }),
  // Which blurs are a finding is the TARGET's question, so the caller passes
  // the pattern: each reference's own Detect line decides, and the shared
  // helper no longer holds one answer for three platforms.
  //
  // Web detects only the effects with no CSS primitive — progressive, noise,
  // texture, glass — because `backdrop-filter: blur()` handles a background
  // blur, as web.md's own "The web does" line says. It had been firing on
  // background blur anyway and telling the reader there was no primitive: 8 of
  // one library's 14 W11 rows were that, every one wrong.
  //
  // iOS and Android detect background blur as well, because their Detect lines
  // say so and their mechanisms differ: a background blur is a `Material` on
  // iOS, and on Android there is no background-blur modifier at all. Fixing
  // web inside the shared helper silently took that signal away from both —
  // a fix to a shared detector is a change to every target that calls it.
  blurs: (id, align, re = /PROGRESSIVE|NOISE|TEXTURE|GLASS/) => ({ node: (n, a, add) => { for (const e of n.effects || []) { if (re.test(e)) add(id, n.name, 'carries a ' + e.toLowerCase().replace(/_/g, ' '), align); } } }),
  literalEffect: (id) => ({ node: (n, a, add) => { if (n.effect === 'literal') add(id, n.name, 'an effect applied directly, with no style behind it', 'in Figma: save the effect as a style. A loose effect has no name, so the build cannot map it and this check cannot follow it when it changes'); } }),
  // `spread` is iOS's question, not Android's: ios.md's Detect line lists it
  // because `.shadow` has no spread, and android.md's does not, because
  // `Modifier.dropShadow` takes one. Android was being handed iOS's advice
  // verbatim — "accept, or emulate with a padded shape" — for something
  // Compose can draw. So the caller says whether it wants it.
  innerOrManyShadows: (id, max, spread = true) => ({ node: (n, a, add) => { const sh = (n.effects || []).filter(e => /SHADOW/.test(e)); if (sh.some(e => e.startsWith('INNER_SHADOW'))) add(id, n.name, 'an inner shadow', 'in Figma: draw it as a stroke or a fill instead \u2014 the build has no inner shadow, so this one will simply not appear'); if (sh.length > max) add(id, n.name, `${sh.length} shadows stacked on one layer`, `in Figma: at most ${max} shadow${max === 1 ? '' : 's'} per style \u2014 the build draws one, so the extra layers will not appear`); if (spread && sh.some(e => e.endsWith(':spread'))) add(id, n.name, 'a shadow with spread', 'accept: the build draws the shadow without its spread, so it will look a little tighter than drawn'); } }),
  unboundFill: (id, align) => ({ node: (n, a, add) => { if ((n.fills || []).includes('SOLID') && n.type !== 'TEXT') add(id, n.name, 'a solid fill typed in, not bound to a variable', align); } }),
  stateBooleans: (id, align) => ({ component: (c, add) => { for (const k of stateBoolean(c.props || {})) add(id, k, `a boolean called "${k}", for a state the platform already tracks`, align); } }),
  // An icon has no spec of its own — an icon page is exported as SVGs — so
  // the instance is the only place it can be examined at all.
  multiFillIcon: (id, align) => ({ onInstance: true, node: (n, a, add) => { if (isIcon(n) && distinctFills(n) > 1) add(id, n.name, `${distinctFills(n)} different fills in one icon`, align); } }),
  hitTarget: (id, min, unit) => ({ variant: (c, v, add, ctx) => { const [x, y] = rootSize(v); if (interactive(c.props || {}, ctx.states && ctx.states.axis) && (x < min || y < min)) add(id, '$root', `${x}×${y} under ${min} ${unit}`, `in Figma: make it at least ${min} ${unit} in the direction it is tapped, or give it a named hit-area frame that is \u2014 anything smaller is hard to hit reliably; accept and record it where the size is fixed by something else`); } }),
  // iOS's Detect line says "two or more fill siblings OF WHICH ONE IS TEXT",
  // because the finding is about text that will not split evenly; Android's
  // says only "two or more fill siblings". Without the text test, three equal
  // `Item`s in a segmented control and two `Divider`s were reported to iOS
  // carrying advice that ends "accept that two fill texts of unequal length
  // will not split evenly" — about layers holding no text at all.
  fillSiblings: (id, align, needsText = false) => ({ node: (n, a, add) => { const k = n.children || []; const fills = k.filter(c => w(c) === 'FILL'); if (n.layout === 'HORIZONTAL' && fills.length >= 2 && (!needsText || fills.some(hasText))) add(id, n.name, `${fills.length} children all set to fill: ${fills.map(c => c.name).join(', ')}`, align); } }),
  letterSpacing: (id, test, align) => ({ node: (n, a, add) => { if (n.type === 'TEXT' && test(n)) add(id, n.name, `letter spacing set to ${n.letterSpacingValue}${n.letterSpacing === 'PERCENT' ? '%' : 'px'}`, align); } }),
};

// ---- targets ----------------------------------------------------------------
// ---- frameworks -------------------------------------------------------------
/*
 * A framework layer applies ON TOP of a platform target: the platform says
 * what the medium can draw, the framework says what the library it is built
 * with already owns. MUI is not a fourth target — `web` still decides whether
 * a centre stroke is expressible; this decides whether the component's API has
 * somewhere to put the thing that is drawn.
 *
 * Read against @mui/material v9.4.0 on 2026-09-20, from mui.com's own API and
 * component pages. Two things about that version matter and are dated because
 * they change: `loading` on Button/IconButton arrived in v6.4.0, and most
 * enums grew a `| string` tail across v5→v6, which is what separates a CLOSED
 * enum (a finding) from an OPEN one (a theme variant to write).
 *
 * Every rule here needs to know WHICH MUI component a Figma component is —
 * a "Dropdown input" is `Select`, `Autocomplete` or `TextField select`, and
 * they are three different components with three different APIs. That mapping
 * is a fact about the project, so it arrives from the project's audit settings
 * (`frameworkComponents`) and never from this file. A component with no mapping is
 * not checked, and `unmappedFor()` names those so a run can say so rather than
 * reporting them clean.
 */
const MUI_ENUMS = {
  // component            prop            values                                                            open?
  TextField:  { variant: [['Outlined', 'Filled', 'Standard'], false, 'https://mui.com/material-ui/api/text-field/'],
                size:    [['Small', 'Medium'], true, 'https://mui.com/material-ui/api/text-field/'] },
  Select:     { variant: [['Outlined', 'Filled', 'Standard'], false, 'https://mui.com/material-ui/api/select/'],
                size:    [['Small', 'Medium'], true, 'https://mui.com/material-ui/api/select/'] },
  Autocomplete: { size:  [['Small', 'Medium'], true, 'https://mui.com/material-ui/api/autocomplete/'] },
  Button:     { variant: [['Text', 'Outlined', 'Contained'], true, 'https://mui.com/material-ui/api/button/'],
                size:    [['Small', 'Medium', 'Large'], true, 'https://mui.com/material-ui/api/button/'] },
  IconButton: { size:    [['Small', 'Medium', 'Large'], true, 'https://mui.com/material-ui/api/icon-button/'] },
  Chip:       { variant: [['Filled', 'Outlined'], true, 'https://mui.com/material-ui/api/chip/'],
                size:    [['Small', 'Medium'], true, 'https://mui.com/material-ui/api/chip/'] },
  Checkbox:   { size:    [['Small', 'Medium'], true, 'https://mui.com/material-ui/api/checkbox/'] },
  Switch:     { size:    [['Small', 'Medium'], true, 'https://mui.com/material-ui/api/switch/'] },
  Badge:      { variant: [['Dot', 'Standard'], true, 'https://mui.com/material-ui/api/badge/'] },
  Divider:    { variant: [['FullWidth', 'Inset', 'Middle'], true, 'https://mui.com/material-ui/api/divider/'] },
  Tab:        { iconPosition: [['Top', 'Bottom', 'Start', 'End'], false, 'https://mui.com/material-ui/api/tab/'] },
  Tooltip:    { placement: [['Auto', 'AutoStart', 'AutoEnd', 'Top', 'TopStart', 'TopEnd', 'Bottom', 'BottomStart', 'BottomEnd', 'Left', 'LeftStart', 'LeftEnd', 'Right', 'RightStart', 'RightEnd'], false, 'https://mui.com/material-ui/api/tooltip/'] },
};
/** `loading` is a prop on these two and nothing else (v6.4.0+). */
const MUI_LOADING = new Set(['Button', 'IconButton']);
/** A Figma axis name that means the same as an MUI prop, however it is spelled. */
const MUI_PROP = { variant: /^(variant|type|style|role)$/i, size: /^size$/i, iconPosition: /^icon ?position$/i, placement: /^(placement|position|direction)$/i };
const canon = (s) => String(s).trim().replace(/[\s_-]+/g, '').toLowerCase();
// Figma marks a component private by a leading underscore, on the name or on
// its last segment: a part other components are built from.
const PRIVATE = /^\s*_|\/\s*_/;

const muiRules = (map) => [
  /*
   * MU9 · the component is called something else in the library it is built
   * with. The map already holds the counterpart — it is how every other rule
   * here knows what a component IS — so the difference is free to report, and
   * reporting it turns a hand-written list of renames into something a run
   * regenerates. One project's alignment study listed about forty by hand:
   * Spinner is CircularProgress, Toast is Snackbar, Widget is Card. That list
   * was true on the day it was written and had no way to stay true.
   *
   * A name is the cheapest thing a developer reads and the first thing they
   * search for, which is why this is a rename worth doing and not a pedantry.
   */
  { component: (c, add) => {
      const mui = map[c.name];
      if (!mui || canon(mui) === canon(c.name)) return;
      /*
       * SEVERAL FIGMA COMPONENTS MAY SHARE ONE MUI COMPONENT, and when they
       * do, a rename is the wrong advice: it cannot be followed by more than
       * one of them and should not be followed by any. One project maps
       * `Text input`, `Text area input`, `Search input`, `Password input`,
       * `Number input` and `Date input` to `TextField` — correctly, since
       * they are one MUI component configured six ways by `type`, `multiline`
       * and adornments. Six rows each said "rename it TextField".
       *
       * The pair is still worth recording, so the finding stays; only the
       * instruction changes.
       */
      const shared = Object.keys(map).filter((k) => canon(map[k]) === canon(mui));
      if (shared.length > 1)
        return add('MU9', c.name, `the build calls this ${mui}, along with ${shared.length - 1} other component${shared.length === 2 ? '' : 's'} here`,
          `accept the house name and record the pair: ${shared.join(', ')} are all ${mui} in the build, configured differently, so no rename can carry that (https://mui.com/material-ui/all-components/)`,
          mui);
      add('MU9', c.name, `the build calls this ${mui}`,
        `in Figma: rename it ${mui}, so the name a developer searches for is the name on the component; accept the house name where it means something MUI's does not, and record the pair (https://mui.com/material-ui/all-components/)`,
        mui);
    } },
  /*
   * MU10 · an axis that MEANS an MUI prop but is not named for it. `MUI_PROP`
   * already recognises the synonyms each rule needs — `Role` for `variant`,
   * `Position` for `placement` — and MU1/MU2 use that to judge the axis's
   * VALUES while saying nothing about its name. So the file could carry an
   * axis called `Role` for ever and the check would only ever argue about
   * what was in it.
   */
  { component: (c, add) => {
      const mui = map[c.name];
      const table = mui && MUI_ENUMS[mui];
      if (!table) return;
      for (const prop of Object.keys(table)) {
        const axis = Object.keys(c.props || {}).find((k) => MUI_PROP[prop] && MUI_PROP[prop].test(k.split('#')[0]));
        if (!axis) continue;
        const bare = axis.split('#')[0];
        if (canon(bare) === canon(prop)) continue;
        add('MU10', bare, `${mui} calls this property ${prop}`,
          `in Figma: rename the axis ${prop}, so the property panel and the code use one word for one thing; in code: map ${bare} to ${prop} at the boundary and carry the difference for ever (https://mui.com/material-ui/api/${String(mui).replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()}/)`,
          prop);
      }
    } },
  // A variant axis whose values are not the prop's. Closed enum -> the value
  // cannot exist; open enum -> it can, as a theme variant plus TypeScript
  // module augmentation, which is work to name rather than a defect.
  { component: (c, add) => {
      const mui = map[c.name];
      const table = mui && MUI_ENUMS[mui];
      if (!table) return;
      for (const [prop, [values, open, src]] of Object.entries(table)) {
        const axis = Object.keys(c.props || {}).find((k) => MUI_PROP[prop] && MUI_PROP[prop].test(k.split('#')[0]));
        if (!axis || !Array.isArray(c.props[axis])) continue;
        const allowed = new Set(values.map(canon));
        const strays = c.props[axis].filter((v) => !allowed.has(canon(v)));
        if (!strays.length) continue;
        add(open ? 'MU2' : 'MU1', `${axis} = ${strays.join(', ')}`,
          `${mui}.${prop} ${open ? 'takes' : 'is closed to'} ${values.join(' · ')}`,
          // Written for the person reading it. An open enum is a genuine
          // two-sided choice — keep your names, or adopt MUI's — and framing
          // it as the code fix alone made it read as a developer's ticket
          // filed on a designer's board: "Schedule a theme variant in
          // components.MuiButton.variants, with TypeScript module
          // augmentation" was the whole question column.
          open ? `in Figma: rename the values to ${values.join(', ')} if matching MUI's vocabulary is worth more than your own; in code: keep your names by registering them as theme variants (\`components.Mui${mui}.variants\`, plus a TypeScript module augmentation to type them) — legal either way, so this is a choice, not a defect (${src})`
               : `in Figma: one of ${values.join(', ')}; the prop's type has no \`| string\` tail, so a new value needs a different component (${src})`,
          `${prop} = ${values.join(', ')}`);
      }
    } },
  // A Loading state on a component whose MUI counterpart has no `loading`.
  { component: (c, add) => {
      const mui = map[c.name];
      if (!mui) return;
      const has = Object.entries(c.props || {}).some(([k, v]) =>
        /^loading$/i.test(k.split('#')[0]) || (Array.isArray(v) && v.some((x) => /^loading$/i.test(String(x)))));
      if (!has) return;
      if (MUI_LOADING.has(mui)) return;
      add('MU3', 'Loading', `${mui} has no loading state to switch on — only Button and IconButton do`,
        'accept: this component has no loading state to switch on, so the drawing shows something the build cannot produce \u2014 record it as a deliberate deviation; in code: a bespoke component if it has to exist (https://mui.com/material-ui/api/button/)');
    } },
  // MUI renders its own focus indication on every ButtonBase-derived
  // component, so a drawn ring is additive unless it replaces MUI's.
  { node: (n, a, add, c) => {
      if (!map[c.name]) return;
      if (!/focus/i.test(n.name)) return;
      add('MU4', n.name, 'a focus ring drawn on a component that already draws its own',
        'in code: express the drawn ring as a `&.Mui-focusVisible` override — built as a new layer it renders ON TOP of the one this component already draws for itself, so the result is two rings, not none (https://mui.com/material-ui/customization/how-to-customize/)');
    } },
  // An icon inside a field is an InputAdornment, whose `position` is a
  // REQUIRED two-value enum: start or end. An icon that is neither the first
  // nor the last thing in the field's row has no position to be given, and
  // needs a custom OutlinedInput rather than a prop.
  { node: (n, a, add, c) => {
      const mui = map[c.name];
      if (mui !== 'TextField' && mui !== 'Select' && mui !== 'Autocomplete') return;
      if (!/^field$/i.test(n.name)) return;
      // The field's CONTENT, in reading order. An overlay is not content and
      // must not count toward a position: a focus ring and a state layer are
      // drawn over the whole field and sit wherever the layer order puts them,
      // so counting them made a trailing chevron "position 2 of 3" on three
      // components whose icons are all correctly at the ends. Both were found
      // by running this against a real library rather than by reading it.
      const OVERLAY = /focus|ring|state ?layer|overlay/i;
      const kids = (n.children || []).filter((k) => k.hidden !== true && !OVERLAY.test(k.name));
      kids.forEach((k, i) => {
        const isIconish = /icon/i.test(k.instanceOf || k.name);
        if (!isIconish) return;
        if (i === 0 || i === kids.length - 1) return;
        add('MU5', k.name, `sits at position ${i + 1} of ${kids.length} inside the field`,
          'in Figma: move it to the start or the end; `InputAdornment.position` is required and takes only those two (https://mui.com/material-ui/api/input-adornment/)');
      });
    } },
  // A Chip's trailing icon is the `deleteIcon` slot and renders only when
  // `onDelete` is set. A trailing icon with no boolean behind it maps to
  // nothing; one with a boolean should say which slot it is.
  { component: (c, add) => {
      if (map[c.name] !== 'Chip') return;
      const props = c.props || {};
      const bools = Object.keys(props).filter((k) => props[k] === 'BOOLEAN').map((k) => k.split('#')[0]);
      const v0 = (c.variants || [])[0];
      const kids = (v0 && v0.children) || [];
      const trailing = kids.length > 1 && kids[kids.length - 1];
      if (!trailing || !(trailing.type === 'INSTANCE' || /icon/i.test(trailing.name))) return;
      const named = bools.some((b) => /delete|remove|close|dismiss/i.test(b));
      if (named) return;
      add('MU6', trailing.name, bools.length
        ? `a trailing icon behind "${bools.join(', ')}" — Chip's trailing slot is \`deleteIcon\`, shown only when \`onDelete\` is set`
        : 'a trailing icon with no boolean — Chip renders one only when `onDelete` is set',
        'in Figma: name the property for the slot it maps to (`Deletable` → onDelete); a trailing non-delete icon maps to no slot (https://mui.com/material-ui/api/chip/)');
    } },
  // MU7 — WITHDRAWN before it shipped a finding. The idea was sound: Select
  // takes no typing and Autocomplete does, so one component carrying both is
  // two components fused. The signal was not. A `Value text` property is how a
  // designer sets the value a Select DISPLAYS, not evidence that anyone types
  // it, and the first run against a real library flagged a Dropdown input that
  // sits beside its own separate Autocomplete component — which is the very
  // split the rule wanted. The real tells (chips inside the field, a clear
  // button, an editable placeholder) need the caller to know which is which,
  // which is the mapping's job rather than a rule's. Left here as a withdrawn
  // candidate, because knowing what was tried is worth as much as the rule.
  // An icon whose artboard is not square is stretched by MUI's font-size
  // driven sizing, which scales one number. The size it was placed at is this
  // component's choice, so the rule reads the instance.
  { onInstance: true, node: (n, a, add, c) => {
      if (!map[c.name]) return;
      if (!(n.type === 'INSTANCE' && /icon/i.test(n.instanceOf || n.name))) return;
      if (!n.w || !n.h || n.w === n.h) return;
      add('MU8', n.name, `${n.w}×${n.h} — not square`,
        'in Figma: make the frame square. Icons are sized by a single number in the build, so a non-square one is stretched to fit (https://mui.com/material-ui/api/svg-icon/)');
    } },
  /*
   * MU11 · a component the map does not name. Every rule above asks the map
   * what a component IS and says nothing where it has no answer, and nothing
   * is what a clean result looks like: one library had 18 of its 84 public
   * components in the map, so 66 were checked by no rule here while the stage
   * read as having covered them. `unmappedFor` already named them, in a run's
   * closing line, which is where it went unread.
   *
   * `null` is an answer — this one has no MUI counterpart — and absence is
   * not, so a component added to the library next month raises this until
   * somebody decides. A private part is left to the component it belongs to.
   *
   * One row, filed against the map: the fix is one edit to one block, and
   * a row per component would be that edit asked for sixty times.
   */
  { component: (c, add) => {
      if (c.name in map || PRIVATE.test(c.name)) return;
      add('MU11', 'frameworkComponents', 'names no MUI component for these, so no MUI rule reads them',
        'accept: nothing changes in Figma or in code \u2014 name each one in the project\'s frameworkComponents, or give it null where MUI has no such component, so the rules above know what they are reading (https://mui.com/material-ui/all-components/)',
        null, 'frameworkComponents');
    } },
];

/*
 * Where a finding's fix lands: the designer's file, the developer's code,
 * both (the same difference can be settled either side), or neither because
 * the answer is to accept it. This is the division a maintainer actually
 * works by — "what do I change in Figma this afternoon" against "what do I
 * hand the developers" — and without it a queue of 78 rows reads as 78 jobs
 * when 34 of them are notes.
 *
 * It is read from the rule's own `align`, which is where the answer has
 * always been written, rather than kept as a second table of class ids beside
 * it: a table would drift the first time a rule's advice changed, and nothing
 * would say so. The shape is strict — "in Figma:", "in code:", "accept" —
 * and a rule whose align fits none of them returns null, which the tests
 * assert against every rule of every target, so a new rule written in a
 * different shape fails there rather than rendering as an unlabelled row.
 */
export function landsOf(align) {
  const t = String(align || '');
  const figma = /\bin Figma:/.test(t);
  const code = /\bin code:/.test(t);
  if (figma && code) return 'both';
  if (figma) return 'figma';
  if (code) return 'code';
  if (/\baccept\b/i.test(t)) return 'accept';
  return null;
}

/** Which mapped-eligible components have no MUI counterpart recorded. A rule
 *  that cannot know what a component IS reports nothing, and nothing is what a
 *  clean result looks like, so the caller says this out loud. */
export function unmappedFor(components, map = {}) {
  // Named with `null` is decided — it has no counterpart — and is not listed.
  return components.filter((c) => !(c.name in map)).map((c) => c.name);
}
export const frameworks = { mui: { target: 'web', rules: muiRules } };

/*
 * What a wrapper can be doing OTHER than fill, stroke and padding.
 *
 * W1 asserts the frame "adds nothing of its own" and advises collapsing the
 * two into one. It looked at three properties, so it said that of frames
 * carrying the corner radius and the clip that make the shape: `Avatar ›
 * Content` is `radius: 8, clips: true` around a child whose own radius is 0,
 * and following the advice deletes the rounding that makes the avatar round.
 * Six of ten real sites on one library were this. Two more on another were
 * `absolute: true`, where collapsing moves the layer into flow.
 *
 * A radius of 0 is not carrying anything, so it is read as a number.
 */
const carries = (n) =>
  !!(Number(n.radius) > 0 || (Array.isArray(n.radii) && n.radii.some((r) => Number(r) > 0)) ||
     n.clips || n.mask || n.absolute || n.rotation ||
     (n.effects && n.effects.length) ||
     (n.opacity != null && Number(n.opacity) < 1));

const TARGETS = {
  web: [
    { node: (n, a, add) => { const k = n.children || [], only = k[0]; if (a.length && k.length === 1 && only && only.children && (padded(only) || only.fills) && !n.fills && !n.strokes && !padded(n) && !carries(n) && Math.abs((n.w || 0) - (only.w || 0)) < 1 && Math.abs((n.h || 0) - (only.h || 0)) < 1 && n.type !== 'INSTANCE') add('W1', n.name, `wraps "${only.name}" and adds nothing of its own — no fill, stroke, padding or size`, 'in Figma: collapse the two frames into one, or put the padding on one of them and say which \u2014 as drawn they are indistinguishable and the build will pick one'); } },
    // The FIELD's row, not any row of an input-like component. The mechanism
    // is the `input` element's content model — "Void elements can't have any
    // contents" — which binds the box that becomes the input and nothing
    // else. Run on every layer it fired on a feedback message under the field
    // and on a label above it: ordinary flex rows in HTML, with advice about
    // padding-inline-start that means nothing there. MU5 already reads the
    // field by name for the same reason; this is that reading.
    //
    // The icon must be a real non-text child, not any INSTANCE: a `Label`
    // instance sitting first is a label, and counting it made the same row
    // report itself.
    { node: (n, a, add, c) => {
        const inputLike = /search|text ?(input|field|area)|^input\b/i.test(c.name) && !/dropdown|select/i.test(c.name);
        if (!inputLike || !n.layout) return;
        if (!/^(field|input|search|control)\b/i.test(n.name)) return;
        const k = n.children || [];
        if (k.length <= 1) return;
        const t = k.findIndex(x => x.type === 'TEXT');
        const icon = k.slice(0, Math.max(t, 0)).find(x => isIcon(x) || /\bicons?\b/i.test(x.name) || x.type === 'VECTOR');
        if (t > 0 && icon) add('W2', n.name, `"${icon.name}" sits inside the field, before the text`, 'in code: the icon sits over the field rather than inside it, and the text is pushed across with padding \u2014 so the measured gap will not match the drawn one, and that difference is waived once rather than per component'); } },
    // A GROUP of choice controls, which is two or more: one control under a
    // label is a menu row, not a fieldset, and the legend/margin advice means
    // nothing there. And the words are matched whole — unanchored `option`
    // matched a text layer literally named "Optional", so a label above
    // another label read as a fieldset, twice.
    { node: (n, a, add, c) => { const k = n.children || []; const rest = k.slice(1);
        // A bare "Item" says nothing: it is a row in a select list AND a row
        // in a dropdown menu, and only one of those is a fieldset. So a
        // generic row counts only inside a component that is itself a choice
        // — `Select list` yes, `Dropdown menu` no, which is where three of
        // one library's five W3 findings came from.
        const named = /\b(radio|checkbox|option|choice)\b/i;
        const groupIsChoice = /\b(select|choice|radio|checkbox|option)\b/i.test(c && c.name || '');
        const choice = (x) => named.test(x.name) || named.test(x.instanceOf || '') ||
                              (groupIsChoice && /\b(item|row)\b/i.test(x.name + ' ' + (x.instanceOf || '')));
        if (rest.length >= 2 && k[0].type === 'TEXT' && rest.every(choice)) add('W3', n.name, `"${k[0].name}" sits above a group of choice rows, inside the same frame`, 'in code: the label of a group sits outside the group\u2019s own spacing, so the gap under it comes from a margin and will measure differently from the one drawn here'); } },
    { node: (n, a, add) => { if (/focus/i.test(n.name) && n.strokes && n.strokeAlign && n.strokeAlign !== 'INSIDE' && a.some(x => x.clips)) add('W4', n.name, `a focus ring drawn outside the shape, inside "${a.filter(x => x.clips).map(x => x.name).join(', ')}", which clips it`, 'in Figma: draw the ring inside the frame, or turn off clipping on the parent \u2014 as drawn the ring is cut off, and the build will cut it off too; in code: a negative outline-offset or a box-shadow'); } },
    shared.strokeNotInside('W5', 'in Figma: set the stroke to inside \u2014 a centre stroke straddles the edge and the build cannot place it there, so the component will be a pixel wider or narrower than drawn. Outside is fine for a focus ring; in code: outline or box-shadow, never a border'),
    { node: (n, a, add) => { if (/slot|placeholder/i.test(n.name) && h(n) === 'FIXED') add('W6', n.name, `a slot with its height fixed at ${n.h}px`, 'accept: whatever fills this slot sets its height, so the drawn one is a placeholder rather than a spec'); } },
    shared.stateBooleans('W7', 'in Figma: move it onto the state axis, or drop it \u2014 the browser already tracks hover, focus and press on its own, and a boolean makes a designer set by hand what the build sets for free'),
    // The state axis and its options are the project's vocabulary, read from
    // its settings (`variants.stateAxis`, `optionOrder[stateAxis]`) and passed in
    // as `states`. A value outside the recorded options is a property the build
    // has to be told about. A recorded non-pointer option (a Loading state, say)
    // is an implementation note, which WT1 already writes for the developer, not
    // an audit ticket: raised as one, it came back on every run and the judge
    // ruled it away and back again. No settings, no check.
    { component: (c, add, ctx) => { const st = ctx.states; const p = c.props || {}; if (!st || !st.axis || !Array.isArray(st.options) || !Array.isArray(p[st.axis])) return; const odd = p[st.axis].filter(s => !st.options.includes(s)); if (odd.length) add('W7', st.axis, `the ${st.axis} axis carries ${odd.map(x => '"' + x + '"').join(', ')} alongside ${st.options.join(', ')}`, 'in Figma: give this one its own axis. The browser tracks hover, focus and press by itself; anything else is a property the build has to be told about, so it should not sit among them'); } },
    { node: (n, a, add) => { const p = a[a.length - 1]; const maxW = n.minmax ? n.minmax[1] : n.maxWidth; if (w(n) === 'FILL' && maxW) add('W8', n.name, `set to fill its parent, but capped at ${maxW}px`, 'in Figma: say in the description that the cap belongs to the container, not this layer \u2014 otherwise the build puts the limit in the wrong place and the layer stops stretching; in code: cap the grid track or the container'); } },
    shared.lineHeightAuto('W9'),
    { node: (n, a, add) => { if (n.type === 'TEXT' && n.textAutoResize === 'NONE' && n.truncation !== 'ENDING') add('W10', n.name, 'a fixed-size text box with truncation turned off', 'in Figma: turn truncation on, so the drawing shows what happens when the text is too long; in code: line-clamp'); } },
    /*
     * W17 — a drop shadow whose shape in Figma is not the box's shape in CSS.
     *
     * Figma casts a frame's drop shadow from everything the frame renders,
     * children included, unless the frame clips; CSS `box-shadow` is cast by
     * the element's own rounded box and nothing inside it. Tested on
     * 2026-10-01: a 24px-radius frame with a fill and a square child in its
     * corner cast a square shadow corner with clipping off, a rounded one with
     * it on. Figma also ignores spread unless the frame has a fill and clips,
     * so an unclipped frame shows no spread where the build will draw one.
     * A focus ring is left out: it is meant to sit outside (WT6).
     */
    { node: (n, a, add) => {
        const eff = n.effects || [];
        if (n.clips || !/FRAME|COMPONENT|INSTANCE/.test(n.type) || !eff.some(e => e.startsWith('DROP_SHADOW'))) return;
        const rad = (x, pick) => Array.isArray(x.radius) ? pick(...x.radius) : (typeof x.radius === 'number' ? x.radius : 0);
        const r = rad(n, Math.max), m = r * (1 - Math.SQRT1_2), paints = (x) => (x.fills && x.fills.length) || (x.strokes && x.strokes.length);
        const kids = (n.children || []).filter(c => typeof c.x === 'number' && !isRing(c) && paints(c));
        const why = [];
        const shaped = !(n.fills && n.fills.length) && kids.find(c => rad(c, Math.min) !== r || c.w < n.w || c.h < n.h);
        if (shaped) why.push(`it has no fill, so Figma casts the shadow from "${shaped.name}"`);
        const out = kids.find(c => c.x < 0 || c.y < 0 || c.x + c.w > n.w + 0.5 || c.y + c.h > n.h + 0.5);
        const corner = !out && r > 0 && kids.find(c => rad(c, Math.min) < r && [c.x <= m && c.y <= m, c.x + c.w >= n.w - m && c.y <= m, c.x <= m && c.y + c.h >= n.h - m, c.x + c.w >= n.w - m && c.y + c.h >= n.h - m].some(Boolean));
        if (out) why.push(`"${out.name}" reaches outside it and adds its own outline to the shadow`);
        if (corner) why.push(`"${corner.name}" fills a ${r}px rounded corner square, so the shadow corner is square`);
        if (eff.some(e => /^DROP_SHADOW:spread$/.test(e))) why.push('its spread is ignored, because Figma applies spread only to a frame that has a fill and clips');
        if (why.length) add('W17', n.name, `a drop shadow on a frame that does not clip: ${why.join('; ')}`, 'in Figma: turn on Clip content and give the frame its own fill and radius — then the shadow is the box, which is what the build draws; in code: a shadow that must follow the content is filter: drop-shadow(), which has no spread');
      } },
    shared.diamond('W11'), shared.blend('W11', CSS_BLENDS), shared.blurs('W11', 'accept: the browser cannot make this effect at all, so it will be missing from the build; in Figma: redraw the layer with a fill or a shadow if it has to survive'), shared.literalEffect('W11'),
    /*
     * W12 — a container drawn with several copies of one thing.
     *
     * A SLOT IS EXEMPT, and asked a different question. A slot's contents are
     * sample content by definition: the slot's own property says what may go
     * in it and how many, so counting the copies a designer drew answers
     * something the file has already answered. The maintainer ruled it —
     * "any content inside a slot should abide by [the slot's configuration];
     * most of those tickets shouldn't be there."
     *
     * THE SETTINGS ARE ON THE PROPERTY, NOT THE NODE. A slot is a component
     * property of the set (`props` carries `"Items slot": "SLOT"`), and its
     * description, preferred instances and layer limits live on that
     * definition. The first version of this read the SLOT node, where only
     * the two limits are mirrored, so it could ask about the range and never
     * about the contents. `spec.slots` carries the definition from snapshot
     * plugin 0.40.0.
     *
     * A component whose snapshot predates that field says nothing at all,
     * because absent is not "left open" and asking for a fix this reader
     * cannot check is the worse error.
     */
    { component: (c, add) => {
        const slots = c.slots;
        if (!slots) return;
        for (const [name, cfg] of Object.entries(slots)) {
          /*
           * The limits are inside `settings`, under Figma's own names —
           * `minChildren` and `maxChildren`, not the "Minimum layers" the
           * settings panel shows. Read from the stored object rather than
           * from fields lifted by the plugin, because the object is what the
           * runtime returned and the lifting was three rounds of guessing
           * before it was one round of instrumenting.
           */
          /*
           * An absent settings object is the DEFAULTS, not an absent reading.
           *
           * `fields` records the keys the runtime exposed on this definition,
           * which is what tells the two apart. Where `fields` is there, the
           * definition was read: a missing `slotSettings` means Figma had
           * none to give, which is every setting at its default, which is no
           * limits. Where `fields` is absent the snapshot predates the whole
           * record (plugin 0.40.0) and nothing can be said.
           *
           * Requiring `minChildren` to be present asked the question of 15 of
           * one library's 29 slots and silently skipped 14 — a check running
           * on half its subjects and reporting nothing about the other half,
           * which is the failure this repo's own rule about silence names.
           */
          const st = cfg.settings || {};
          const read = 'settings' in cfg || Array.isArray(cfg.fields);
          const gaps = [];
          if (read && st.minChildren == null && st.maxChildren == null)
            gaps.push('how many layers may go in it (Minimum and Maximum layers are both None)');
          if ('preferred' in cfg && !(cfg.preferred || []).length)
            gaps.push('which components may go in it (no preferred instances)');
          if (!gaps.length) continue;
          /*
           * WHAT THIS SLOT IS DRAWN WITH, because the answer is per slot.
           *
           * Every slot in a library lacking its limits looks like one finding
           * repeated, and it is not: a Dialog's Content slot and a Dropdown's
           * Items slot want different numbers, as the maintainer pointed out.
           * A row that only says "the limits are unset" invites one answer
           * applied to all of them.
           *
           * The file already holds the evidence for each: the sample content
           * a designer drew. One library's slots are drawn with 0, 1, 2, 3,
           * 6, 8 and 10 items, and some vary across their own variants — a
           * Full-screen dialog's Content slot holds 1, 3 and 10. That range
           * is the honest input to choosing this slot's own maximum.
           */
          const drawn = slotCounts(c, name);
          // `plural` here takes (n, one, many) and RETURNS THE WORD, not the
          // count — a different signature from the docs site's `plural(n,
          // word)`, which is how this first read "drawn with undefined today".
          const evidence = drawn.length
            ? ' It is drawn with ' + (drawn.length === 1
                ? (drawn[0] === 0 ? 'nothing in it today' : drawn[0] + ' ' + pluralWord(drawn[0], 'item', 'items') + ' today')
                : drawn.join(', ') + ' items across its variants') + '.'
            : '';
          add('W12', name, 'a slot that does not say ' + gaps.join(', nor '),
              'in Figma: fill these in on this slot\u2019s own settings \u2014 each slot wants its own answer, so a number that suits a menu will not suit a dialog.' + evidence +
              ' The layers drawn in a slot are sample content, so the settings are the only thing that says what belongs there and how much of it; without them a build guesses whether the slot can be empty, where it stops, and what it will be handed');
        }
      } },
    { component: (c, add) => { W12_SLOT_NAMES.set(c, new Set(Object.keys(c.slots || {}))); } },
    { node: (n, a, add, c, ctx) => {
        const k = n.children || [];
        // A SLOT node is the slot's contents; the question about it is asked
        // of the property above, once, rather than once per variant. A layer
        // NAMED after a declared slot is that slot's container — Dropdown
        // menu draws `Items slot` as a frame inside the slot of the same
        // name — and counting its samples repeats the property's own row
        // under a second wording.
        if (n.type === 'SLOT') return;
        const declared = W12_SLOT_NAMES.get(c);
        if (declared && declared.has(n.name)) return;
        if (k.length >= 5 && k.every(x => x.type === 'INSTANCE' && x.instanceOf === k[0].instanceOf))
          add('W12', n.name, `holds ${k.length} copies of "${mainName(k[0], ctx.known)}" as sample content, and is not a slot`, 'accept: real content sets this height, so the drawn one is one sample; in Figma: make it a slot if that is what it is \u2014 a slot carries its own limits and preferred instances \u2014 or draw the extremes as well, an empty list and a long one, so the build knows the range it has to hold'); } },
    { node: (n, a, add) => { if (n.smoothing) add('W13', n.name, `corners smoothed ${Math.round(n.smoothing * 100)}%`, 'accept: the build draws a plain rounded corner, not a squircle, so the curve will differ slightly; in Figma: set smoothing to 0 if you want them identical'); } },
    { node: (n, a, add) => { for (const f of n.fills || []) if (f === 'IMAGE:CROP' || f === 'IMAGE:TILE') add('W14', n.name, `an image fill set to ${f.split(':')[1].toLowerCase()}`, 'in Figma: use Fill or Fit \u2014 crop and tile do not survive into the build, so the image will be framed differently; in code: position + overflow, or a background'); } },
    { node: (n, a, add) => { if (n.mask) add('W15', n.name, 'used as a mask for the layers under it', 'in code: clip-path or mask-image on the layer being masked \u2014 a mask is a shape the build applies, not a layer it draws, so the mask layer itself never appears'); } },
    // W16 — a line height under the font's own box, inside something the web
    // renders as a text control. The canvas paints the glyphs outside the box;
    // a control clips to it.
    { node: (n, a, add, c) => {
        if (n.type !== 'TEXT') return;
        const ratio = typeof n.lineHeightRatio === 'number' ? n.lineHeightRatio : NaN;
        if (!Number.isFinite(ratio) || ratio >= 1.2) return;
        if (!/input|field|select|dropdown|combo|search|textarea|nudger|stepper|picker|editor/i.test(c.name)) return;
        // The style is named because the fix is in the style, not the layer:
        // one 115% label style produced 73 findings on one library, and a
        // reader who cannot see they are one cause will treat them as 73.
        // Filed against the STYLE where there is one: the fix is a number on
        // the style, and one style produced 81 identical rows across 23
        // components. A layer with no style has no shared cause, so it stays
        // the component's own finding.
        const styled = n.textStyle && n.textStyle !== 'literal' ? n.textStyle : null;
        add('W16', styled || n.name, `line height ${Math.round(ratio * 100)}%, used inside text controls`,
            "in Figma: raise the line height to at or above the font's own box — Inter's is about 121%, so 125% clears it; the drawing and the build disagree about the text's box either way, and where the control has no room to spare the glyphs are cut with nothing in CSS to reveal it; accept it where the field's padding already covers the difference, knowing it returns the day that padding is trimmed",
            null, styled);
      } },
  ],
  ios: [
    shared.strokeNotInside('I1', 'in Figma: set the stroke inside — iOS draws a stroke centred on the edge, so only an inside stroke lands where it is drawn, and a centre or outside one makes the component half a stroke bigger than the drawing; accept that difference where the component is not measured'),
    { node: (n, a, add) => { if (n.smoothing && Math.abs(n.smoothing - 0.6) > 0.01) add('I2', n.name, `corner smoothing ${Math.round(n.smoothing * 100)}%`, 'in Figma: use 0 or 60 only \u2014 iOS has exactly two corner shapes, so any other smoothing is rounded to one of them and the curve changes'); } },
    { node: (n, a, add) => { if (n.type === 'TEXT' && (n.lineHeight === 'PIXELS' || n.lineHeight === 'PERCENT')) add('I3', n.name, `${n.lineHeight.toLowerCase()} line height`, 'in Figma: use Auto, or the platform’s own leading — a fixed line height stops the text growing when the reader turns up their font size, so it clips; in code: lineSpacing only above the font’s own'); } },
    shared.letterSpacing('I4', n => n.letterSpacingValue && n.letterSpacingValue !== 'mixed', 'in Figma: leave letter spacing at 0 on system-font styles \u2014 iOS already tunes it per size, and a value here fights that; in code: .tracking'),
    shared.fixedHeightWithText('I5', 'in Figma: let the frame hug its text vertically \u2014 a fixed height clips the text when someone turns up their font size; in code: minHeight, never height'), shared.fixedText('I5', 'in Figma: set the text to auto height \u2014 a fixed text box clips when the reader\u2019s font size grows'),
    shared.truncationOff('I6', 'in Figma: set Max lines, so the drawing shows what happens when the text runs long; in code: lineLimit + truncationMode'),
    shared.fillSiblings('I7', 'in Figma: give one of them a fixed or hugging width, so it is clear which should give way \u2014 two fills split evenly in the drawing but not in the build, where the longer text wins; in code: maxWidth .infinity plus layoutPriority on the one that must not shrink', true),
    shared.absolute('I8', 'in Figma: keep the badge and what it sits on in one frame; as an absolute child it is out of the layout and the build has to re-derive where it goes; in code: .overlay(alignment:) + .offset'),
    shared.innerOrManyShadows('I9', 2), shared.literalEffect('I9'),
    shared.blurs('I10', 'in Figma: use one of the four named materials rather than a tuned blur \u2014 the build can only pick from those four, and the radius and tint you set will not carry; in code: .background(.regularMaterial)', /BACKGROUND_BLUR|PROGRESSIVE|NOISE|TEXTURE|GLASS/),
    shared.unboundFill('I11', 'in Figma: bind the fill to a variable that has light and dark modes \u2014 a raw colour stays the same in dark mode and the build has nothing to switch'),
    shared.stateBooleans('I12', 'in Figma: put them on one state axis \u2014 separate booleans let a designer pick two states at once, which the build cannot represent; in code: ButtonStyle reads isPressed / isEnabled / isFocused'),
    { component: (c, add, ctx) => { const ax = ctx.states && ctx.states.axis; if (ax && Array.isArray((c.props || {})[ax]) && c.props[ax].some(s => /hover/i.test(s))) add('I12', ax, 'a hover state on a touch target', 'accept: this only appears on iPad, so the phone build will never show it; in Figma: drop the variant if that is not intended'); } },
    shared.hitTarget('I13', 44, 'pt'),
    shared.multiFillIcon('I15', 'in Figma: give the icon one fill and name the layer for the symbol and weight \u2014 the build tints an icon as a single colour, so a second one is lost; accept it as a custom vector if the second colour matters'),
  ],
  android: [
    shared.strokeNotInside('A1', 'in Figma: set the stroke inside, where it takes part in layout \u2014 anywhere else the build adds it outside the box and the component grows; accept an outside stroke as a padded parent instead'),
    shared.fillSiblings('A2', 'in code: weight(1f) on each \u2014 filling width alone gives the first child everything and the rest collapse'),
    shared.fixedText('A3', 'in Figma: let the row hug its content \u2014 a fixed height clips the text at large font sizes; in code: IntrinsicSize.Min on the parent'),
    shared.lineHeightAuto('A4'),
    shared.letterSpacing('A5', n => n.letterSpacing === 'PIXELS' && n.letterSpacingValue, 'in Figma: set letter spacing as a percentage \u2014 a pixel value converts inexactly and the text lands slightly differently in the build'),
    shared.truncationOff('A6', 'in Figma: set Truncate and Max lines, so the drawing shows what long text does; in code: maxLines + TextOverflow.Ellipsis'),
    shared.fixedHeightWithText('A7', 'in Figma: let it hug \u2014 readers can scale text to 200% and a fixed row clips it'),
    shared.innerOrManyShadows('A8', 1, false), shared.literalEffect('A8'),
    shared.blurs('A9', 'accept: older Android cannot blur a background at all, so it falls back to a flat translucent fill and the drawing will not match there', /BACKGROUND_BLUR|PROGRESSIVE|NOISE|TEXTURE|GLASS/),
    shared.diamond('A10'), shared.blend('A10', null),
    shared.hitTarget('A11', 48, 'dp'),
    shared.stateBooleans('A12', 'in Figma: one state axis, with the state overlay at the documented opacities \u2014 separate booleans let two states be picked at once, which the build cannot draw'),
    shared.unboundFill('A13', 'in Figma: bind the fill to a Material role variable \u2014 a raw colour does not follow the theme, so it stays put in dark mode'),
    shared.multiFillIcon('A14', 'in Figma: one fill, bound to a content colour \u2014 the build tints an icon as a single colour, so a second one disappears; accept it as an image if the colours matter'),
    // The size an icon is placed at is this component's choice.
    { onInstance: true, node: (n, a, add) => { if (isIcon(n) && ![20, 24, 40, 48].includes(n.w)) add('A14', n.name, `icon ${n.w}×${n.h}`, 'in Figma: size the icon 24, or 20 / 40 / 48 \u2014 other sizes are re-scaled by the build and the strokes shift off the pixel grid'); } },
    shared.absolute('A15', 'in Figma: put the child and the thing it is pinned to in their own frame, so the relationship survives; in code: a Box with align or offset'),
  ],
};

export const targets = Object.keys(TARGETS);

// Input normalisation. The engine's own reader (walk-figma.js) emits paint
// kinds ('VAR', 'SOLID', 'GRADIENT_…', 'IMAGE:…'); a stored tree may instead
// carry variable names, hex or rgba literals, or a style name under `effect`.
// Both are accepted here so no project has to map one onto the other.
const kind = (p) => (typeof p !== 'string' ? p : /^#|^rgba?\(/i.test(p) ? 'SOLID' : /^(VAR|SOLID|GRADIENT_|IMAGE)/.test(p) ? p : 'VAR');
/*
 * A line height arrives in three shapes and the rules only ever understood
 * one of them. The live reader writes the UNIT (`'auto'`, `'PERCENT'`,
 * `'PIXELS'`); the stored snapshot writes the VALUE as a string (`"115%"`,
 * `"24px"`); a text style carries a ratio. So `lineHeight` is normalised to
 * the unit, and the ratio, where it can be known, is kept beside it as
 * `lineHeightRatio`.
 *
 * Until this, two classes were dead against every stored snapshot and neither
 * said so: I3 tests `=== 'PERCENT'` and a snapshot's `"115%"` matched no
 * literal (0 findings over 954 text layers), and W16 tests a number, which no
 * reader has ever emitted — on the very library whose 100% label styles are
 * the documented reason W16 exists.
 */
// Which slot names a component declares, so the node pass can tell a slot's
// own container from an ordinary frame. Set by the component pass above it.
const W12_SLOT_NAMES = new WeakMap();
/** How many children the SLOT node of this name is drawn with, per variant,
    smallest first — the evidence for choosing that slot's own limits. Empty
    where the property's name matches no node in the stored tree (11 of one
    library's 29 slots: the node lives inside a nested instance). */
function slotCounts(c, name) {
  const seen = new Set();
  const go = (n) => { if (n.type === 'SLOT' && n.name === name) seen.add((n.children || []).length); (n.children || []).forEach(go); };
  for (const v of c.variants || []) go(v);
  return [...seen].sort((a, b) => a - b);
}
const RATIO = { unit: (v) => {
  if (typeof v === 'number') return 'PERCENT';
  const t = String(v || '');
  if (/%$/.test(t)) return 'PERCENT';
  if (/px$/i.test(t)) return 'PIXELS';
  return t;                                   // 'auto', 'PERCENT', 'PIXELS'
}, of: (v) => {
  if (typeof v === 'number') return v;
  const m = String(v || '').match(/^([\d.]+)%$/);
  return m ? Number(m[1]) / 100 : NaN;
} };
const normalise = (n, lineHeightOf, ratioOf) => {
  const o = { ...n };
  if (Array.isArray(n.fills)) o.fills = n.fills.map(kind);
  if (Array.isArray(n.strokes)) o.strokes = n.strokes.map(kind);
  if (n.effect && n.effect !== 'literal') o.effect = 'style';
  if (n.type === 'TEXT' && n.lineHeight) {
    const r = RATIO.of(n.lineHeight);
    if (Number.isFinite(r)) o.lineHeightRatio = r;
    o.lineHeight = RATIO.unit(n.lineHeight);
  }
  if (n.type === 'TEXT' && !n.lineHeight && lineHeightOf) { const src = lineHeightOf(n.textStyle); if (src) o.lineHeight = src === 'style' ? 'PERCENT' : 'auto'; } // anything not set on the style (auto, measured, metric) is Auto
  // The style's own ratio, where the node carried none: a text layer takes
  // its line height from its style unless it overrides it.
  if (n.type === 'TEXT' && o.lineHeightRatio === undefined && ratioOf) {
    const r = ratioOf(n.textStyle);
    if (Number.isFinite(r)) o.lineHeightRatio = r;
  }
  if (Array.isArray(n.children)) o.children = n.children.map((k) => normalise(k, lineHeightOf, ratioOf));
  return o;
};

// A tree from the toolkit's snapshot plugin writes a field only where it
// differs from Figma's default, and names truncation `truncate`. So there an
// absent truncation IS "DISABLED". Read raw, W10 fired on text that does
// truncate and I6/A6 were silent. Blend mode needs nothing: both readers
// omit a normal one.
export function fromSnapshot(components) {
  const node = (n) => {
    const o = { ...n };
    if ('truncate' in o) { o.truncation = o.truncate; delete o.truncate; } else if (o.type === 'TEXT') o.truncation = 'DISABLED';
    if (Array.isArray(o.children)) o.children = o.children.map(node);
    return o;
  };
  return components.map((c) => ({ ...c, variants: (c.variants || []).map(node) }));
}

// Which classes the input can show. A field the trees never carry leaves
// its classes silent, and the report must say so rather than read as clean.
/*
 * Every field a class needs to be FULLY checked — all of its detectors, not
 * just one. A class is declared silent when ANY of them is absent, because a
 * class half of which could not run is not a class that was checked, and
 * silence about it means nothing.
 *
 * It used to require ALL of them to be absent, which let several classes read
 * as checked while dead: W10 needs `textAutoResize`, no snapshot carries one,
 * and `fromSnapshot` adds `truncation` to every text node — so the one
 * present field vouched for the missing one. Two entries were also simply
 * short of a detector's field (I9's literal-effect half reads `effect`, I5's
 * fixed-height half reads `sizing`), and W16 was in no entry at all.
 */
const NEEDS = {
  web: { W10: ['truncation', 'textAutoResize'], W13: ['smoothing'], W14: ['fills:IMAGE'], W15: ['mask'],
         W11: ['blendMode', 'effects', 'effect'], W16: ['lineHeight'], W17: ['effects', 'x'] },
  // The MUI layer reads a component's PROPS, which every tree carries, so no
  // class here goes silent for want of a field. What it can lack is the
  // project's component mapping, and `unmappedFor` reports that instead.
  mui: {},
  ios: { I2: ['smoothing'], I3: ['lineHeight'], I4: ['letterSpacingValue'], I5: ['textAutoResize', 'sizing'], I6: ['truncation'], I8: ['absolute'], I9: ['effects', 'effect'], I10: ['effects'] },
  android: { A3: ['textAutoResize'], A4: ['lineHeight'], A5: ['letterSpacingValue'], A6: ['truncation'], A8: ['effects', 'effect'], A9: ['effects'], A10: ['blendMode'], A15: ['absolute'] },
};
const fieldsPresent = (components) => {
  const seen = new Set();
  // STOPS AT AN INSTANCE, because `validate`'s own walker does. Descending
  // counted fields the rules can never reach, so a class whose only subjects
  // live inside instances was called checked: one library's four `blendMode`
  // nodes are all inside instances, and the rule that reads it raised nothing
  // and was left off the silent list.
  const go = (n) => {
    for (const k of Object.keys(n)) seen.add(k);
    if ((n.fills || []).some((f) => String(f).startsWith('IMAGE'))) seen.add('fills:IMAGE');
    if (n.type === 'INSTANCE') return;
    (n.children || []).forEach(go);
  };
  for (const c of components) for (const v of c.variants || []) go(v);
  return seen;
};
/**
 * The classes this input cannot answer for. `findings` is optional and is the
 * run's own result: a class that RAISED something plainly ran, whatever the
 * field census says, and a report that lists a class as unchecked while its
 * rows sit on the board is the worst possible answer to "can I trust this".
 * One library's report said exactly that about I5 beside 44 I5 rows.
 */
export function silentClasses(components, target, findings) {
  const seen = fieldsPresent(components);
  const raised = new Set((findings || []).map((f) => f.class));
  /*
   * A class that raised something ran — but a class with TWO detectors, one
   * of which had no data, is only half checked, and `!raised.has(cls)` threw
   * the whole census away for it. W11 reads a literal effect and a blend
   * mode; on a library with no blend modes at all the effect half raised two
   * rows and the class left the silent list, so a reader was told the blend
   * question had been asked. Same for I5 and A8 elsewhere.
   *
   * So: a class is silent when a field it needs is absent, whether or not its
   * other half found something — and the two are told apart, because "we
   * could not look" and "we looked at half of this" are different answers.
   */
  return Object.entries(NEEDS[target] || {})
    .filter(([, fields]) => fields.some((f) => !seen.has(f)))
    .map(([cls]) => (raised.has(cls) ? cls + " (partly)" : cls));
}

// `known` is every component name an instance may resolve to (a whole store's,
// where the caller holds one); absent, the names of the components given.
export function validate(components, target, { textStyles, framework, frameworkMap, states, known } = {}) {
  const base = TARGETS[target];
  if (!base) throw new Error(`unknown target "${target}"; one of ${targets.join(', ')}`);
  let rules = base;
  if (framework) {
    const f = frameworks[framework];
    if (!f) throw new Error(`unknown framework "${framework}"; one of ${Object.keys(frameworks).join(', ')}`);
    if (f.target !== target) throw new Error(`framework "${framework}" applies on top of ${f.target}, not ${target}`);
    rules = base.concat(f.rules(frameworkMap || {}));
  }
  const lh = textStyles ? (name) => (textStyles.find((s) => s.name === name) || {}).lineHeightSource : null;
  const lhr = textStyles ? (name) => (textStyles.find((s) => s.name === name) || {}).lineHeight : null;
  components = components.map((c) => ({ ...c, variants: (c.variants || []).map((v) => normalise(v, lh, lhr)) }));
  known = known || components.map((c) => c.name).filter(Boolean);
  const out = [];
  for (const c of components) {
    // `expected` is optional and is the OTHER half of a contrast: what the
    // target takes, said in the target's own vocabulary, beside what the file
    // has. A rule that can state it turns its finding from a sentence into a
    // comparison — "Role = Primary, Secondary, Tertiary" against "variant =
    // Text, Outlined, Contained" is the whole finding, and prose was burying
    // it. A rule with no clean counterpart omits it and loses nothing.
    // `shared` names a cause that is NOT this component's — a text style, a
    // thing one fix changes everywhere. A rule that sets it is saying "file
    // this against that, once", and the collapse below does.
    // `key` is what the finding is about — class and layer (or the shared
    // cause) — never its wording, so a re-run finds the same row.
    const add = (variant) => (cls, layer, detail, align, expected, shared) => out.push({ class: cls, component: c.name, variant, layer, detail, align, expected, shared, key: cls + "|" + (shared || layer) });
    for (const r of rules) if (r.component) r.component(c, add(''), { states });
    for (const v of c.variants || []) {
      for (const r of rules) if (r.variant) r.variant(c, v, add(v.name), { states });
      /*
       * The component's OWN layers. An instance is visited — a rule may have
       * something to say about the instance itself, its size, its position in
       * a row — but never entered: what is inside it belongs to the component
       * it is an instance OF, which is audited on its own.
       *
       * Without the guard every finding was filed again against each parent
       * that placed the instance. One library reported "Avatar uses 60%
       * corner smoothing" on `_App header - Accessories`, where a designer
       * opens the header, finds no such layer, and has no way to learn the
       * finding is about a component two levels down and already listed under
       * its own name. It also inflated every count by the number of times a
       * component is composed.
       */
      const walk = (n, ancestors) => {
        if (n.hidden) return;
        const named = { ...n, name: ancestors.length ? n.name : '$root' };
        const instance = n !== v && n.type === 'INSTANCE';
        // An instance is a PLACEMENT of another component. Its drawing
        // properties — smoothing, strokes, fills, effects, masks, line
        // heights — are the main component's, and belong to the audit of that
        // component, under its own name. Only rules that opt in see one, and
        // those are the rules about where and how big the instance was placed,
        // which is genuinely this component's doing.
        //
        // Stopping the descent was not enough: `_App header - Accessories`
        // went on reporting "Avatar uses 60% corner smoothing", because the
        // smoothing sits on the instance NODE, which was still being examined.
        for (const r of rules) if (r.node && (!instance || r.onInstance)) r.node(named, ancestors, add(v.name), c, { states, known });
        if (instance) return;
        for (const k of n.children || []) walk(k, [...ancestors, n]);
      };
      walk(v, []);
    }
  }
  /*
   * Identical findings collapse so one decision reads once — and for a
   * finding whose CAUSE is shared, "once" means once in the library, not once
   * per component that uses it.
   *
   * A rule that sets `shared` is naming the thing to change: a text style, for
   * now. One 115% label style produced 81 rows across 23 components, every one
   * of them the same sentence about the same style, with one fix between them.
   * The judgement pass had already reached that conclusion on its own —
   * "recurs identically across every component set — library-wide state, not a
   * defect in this component" — which is a check telling you its unit is
   * wrong, not a judge being lenient.
   *
   * Such a finding is filed against the style, and carries `usedBy`: the
   * components it was found in, so the reader can see the reach of the one
   * change they are being asked to make.
   */
  const byKey = new Map();
  for (const f of out) {
    f.lands = landsOf(f.align);
    /*
     * ONE DECISION PER LAYER PER ADVICE — the general rule, not a flag each
     * rule remembers to set.
     *
     * The key is the ADVICE, not the particular that triggered it. A dropdown
     * holds a different sub-component in each of three variants, so W12 fired
     * three times on one `Items slot`: three rows, one identical
     * recommendation, and nothing in their titles to tell them apart. Keying
     * on the detail made every particular its own decision.
     *
     * A layer that genuinely raises two questions still gets two rows,
     * because two questions have two answers — a diamond gradient and a
     * plus-lighter blend on one layer are both W11 and are told apart by
     * their advice, which is the thing the reader acts on.
     */
    const k = f.shared
      ? [f.class, 'shared', f.shared, f.detail].join('\0')
      : [f.class, f.component, f.layer, f.align].join('\0');
    const had = byKey.get(k);
    if (had) {
      if (f.variant && !had.variants.includes(f.variant)) had.variants.push(f.variant);
      if (f.shared && !had.usedBy.includes(f.component)) had.usedBy.push(f.component);
      if (!had.details.includes(f.detail)) had.details.push(f.detail);
      continue;
    }
    byKey.set(k, { ...f, variants: f.variant ? [f.variant] : [], usedBy: f.shared ? [f.component] : [], details: [f.detail] });
  }
  return [...byKey.values()]
    .map(({ variant, ...f }) => (f.shared ? { ...f, component: f.shared, layer: f.layer } : f))
    .map(({ usedBy, ...f }) => (f.shared ? { ...f, usedBy } : f))
    // `detail` is the first particular; `details` carries every one the
    // decision collapsed, so a row can name what it covers.
    .map((f) => (f.details.length > 1 ? f : (({ details, ...rest }) => rest)(f)))
    .sort((x, y) => x.class.localeCompare(y.class, undefined, { numeric: true }));
}

// ---- translations -----------------------------------------------------------
// The other direction of the same knowledge: what the target builds another
// way where nothing needs deciding — a focus ring drawn as a layer is an
// outline, an inside stroke is a border inside border-box. validate() asks the
// designer a question; translations() tells the developer an answer, for a
// documentation page. Each id is an entry under "Translations" in
// references/<target>.md. Web only so far; the other targets return none.
const POINTER = { hover: ':hover', hovered: ':hover', focus: ':focus-visible', focused: ':focus-visible', pressed: ':active', press: ':active', active: ':active' };
const REST = /^(rest|default|enabled|idle|normal|none)$/i;
// HTML attributes every element has, or that browsers still map to CSS on any
// element; `disabled` and `role` have entries of their own.
const TAKEN = ['align', 'valign', 'hidden', 'title', 'lang', 'width', 'height', 'border', 'bgcolor', 'color', 'dir'];
const code = (x) => `\`${x}\``;
// `pluralWord`, not `plural`: it returns the WORD, and the docs site's
// `plural(n, word)` returns "3 items". One name for two shapes produced
// "drawn with undefined today" on a live library the first time this engine
// was asked for a count, hours after a review had flagged exactly that pair.
const pluralWord = (n, one, many) => (n > 1 ? many : one);
const isRing = (n) => /focus/i.test(n.name) && (n.absolute || (n.strokes && n.strokeAlign === 'OUTSIDE'));
const stroked = (n) => (n.strokes || []).some(Boolean);

const TRANSLATE = {
  web: {
    // property rules: (key, values) → match; say(name, values, key) → { figma, code, why }
    props: [
      ['WT1', (k, v, axis) => !!axis && k === axis.toLowerCase() && Array.isArray(v) && v.some((x) => POINTER[x.toLowerCase()]), (name, v) => {
        const hit = v.filter((x) => POINTER[x.toLowerCase()]);
        const other = v.filter((x) => !POINTER[x.toLowerCase()] && !REST.test(x));
        return { figma: `${code(name)}: ${hit.map(code).join(', ')}`, code: hit.map((x) => code(POINTER[x.toLowerCase()])).join(', '),
          why: `Pseudo-classes the browser sets, so a template cannot claim a state the control is not in.${other.length ? ` ${other.map(code).join(', ')} ${pluralWord(other.length, 'is', 'are')} not a pointer state and stays a property.` : ''}` };
      }],
      ['WT2', (k) => k === 'disabled', (name) => ({ figma: code(name), code: `${code('disabled')}, or ${code('aria-disabled')} where it must stay focusable`, why: 'The element\'s own state: the browser keeps it out of the tab order and out of form submission.' })],
      ['WT3', (k) => k === 'role', (name, v) => ({ figma: code(name), code: code('variant'), why: `${code('role')} is ARIA's: ${code(`role="${String((Array.isArray(v) && v[0]) || 'primary').toLowerCase()}"`)} would tell a screen reader the element has a role by that name.` })],
      ['WT3', (k) => TAKEN.includes(k), (name, v, k) => ({ figma: code(name), code: 'Another name', why: `${code(k)} is already an HTML attribute, and browsers still apply it to any element.` })],
      ['WT4', (k) => k === 'selected', (name) => ({ figma: code(name), code: `${code('aria-selected')}, ${code('aria-pressed')} or ${code('checked')}`, why: 'The element\'s own selection state, by what the element is, so assistive technology announces it.' })],
      ['WT4', (k) => k === 'indeterminate' || k === 'mixed', (name) => ({ figma: code(name), code: `The checkbox's ${code('indeterminate')} property, set from script`, why: `HTML has no ${code('indeterminate')} attribute; the property alone draws the mixed state and ${code(':indeterminate')} styles it.` })],
      ['WT4', (k) => k === 'expanded' || k === 'open', (name) => ({ figma: code(name), code: `${code('aria-expanded')}, or ${code('open')} on ${code('<details>')} and ${code('<dialog>')}`, why: 'The toggling control\'s own state, so assistive technology announces it.' })],
      ['WT4', (k) => k === 'validation' || k === 'error' || k === 'invalid', (name) => ({ figma: code(name), code: `${code('aria-invalid')}, the message tied by ${code('aria-describedby')}`, why: 'The error is announced, not only drawn.' })],
      ['WT4', (k) => k === 'required', (name) => ({ figma: code(name), code: code('required'), why: 'The browser validates it and announces it.' })],
      ['WT5', (k, v) => k === 'breakpoint' && Array.isArray(v), (name, v) => ({ figma: `${code(name)}: ${v.map(code).join(', ')}`, code: 'Media or container queries', why: 'One component responds to its width; the variants are the widths drawn.' })],
    ],
    // node rules: (n, ancestors) → key or null; say(layers, first, count, key) → { figma, code, why }
    nodes: [
      ['WT6', (n, a) => (isRing(n) && !a.some((x) => x.clips) ? 'ring' : null), (ls, first) => ({ figma: `${ls}, a layer${first.x < 0 ? ` ${-first.x}px outside the box` : ''}`, code: `${code('outline')} on ${code(':focus-visible')}${first.x < 0 ? `, ${code('outline-offset')} ${-first.x}px less the ring's width` : ''}`, why: 'Figma has no focus state, so it draws the ring as a layer; in code it is not an element.' })],
      ['WT7', (n) => (!isRing(n) && stroked(n) && n.strokeAlign === 'INSIDE' && !n.strokesInLayout ? 'inside' : null), (ls) => ({ figma: `${ls}, inside stroke`, code: `${code('border')} with ${code('box-sizing: border-box')} and padding less the stroke, or ${code('box-shadow: inset 0 0 0 <width>')}`, why: `Figma's inside stroke takes no space; a ${code('border')} does.` })],
      ['WT8', (n) => (!isRing(n) && stroked(n) && n.strokeAlign === 'OUTSIDE' && n.effect ? 'ringShadow' : null), (ls) => ({ figma: `${ls}, outside stroke and a shadow`, code: `One ${code('box-shadow')}, the ring listed first`, why: 'Both land on the same property; two declarations overwrite each other.' })],
      ['WT9', (n) => (n.absolute && !isRing(n) ? 'absolute' : null), (ls) => ({ figma: `${ls}, absolute position`, code: `${code('position: absolute')} in a positioned parent`, why: 'Out of the flow: it neither pushes siblings nor sizes the parent.' })],
      ['WT10', (n) => (/^SPACE_BETWEEN/.test(String(n.align || '')) ? 'between' : null), (ls) => ({ figma: `${ls}, Auto gap`, code: code('justify-content: space-between'), why: `Figma's Auto gap is a distribution, not a ${code('gap')}.` })],
      ['WT11', (n) => (n.type === 'TEXT' && n.truncation === 'ENDING' ? (n.maxLines > 1 ? `clamp${n.maxLines}` : 'ellipsis') : null), (ls, first, count, key) => (key === 'ellipsis'
        ? { figma: `${ls}, truncated to one line`, code: `${code('overflow: hidden; text-overflow: ellipsis; white-space: nowrap')}, ${code('min-width: 0')} on the flex item`, why: 'Without the minimum width a flex item never shrinks enough to truncate.' }
        : { figma: `${ls}, ${key.slice(5)} lines at most`, code: `${code(`-webkit-line-clamp: ${key.slice(5)}`)} with ${code('display: -webkit-box')} and ${code('overflow: hidden')}`, why: 'CSS has no max-lines property; line clamp is the one every browser ships.' })],
      ['WT12', (n) => (n.rotation && Math.abs(n.rotation) % 360 ? `rotate${n.rotation}` : null), (ls, first, count, key) => ({ figma: `${ls}, rotated ${key.slice(6)}°`, code: `${code(`transform: rotate(${key.slice(6)}deg)`)}, or the glyph drawn the right way round`, why: 'A flipped icon reads better as its own glyph than as a transform.' })],
      ['WT13', (n) => (n.textCase === 'UPPER' ? 'upper' : null), (ls) => ({ figma: `${ls}, capitals from the text style`, code: `${code('text-transform: uppercase')}, source text in normal case`, why: 'Screen readers read capitals typed in the source as letters, not words.' })],
      ['WT14', (n) => (n.dashed && [].concat(n.dashed).some(Boolean) ? 'dashed' : null), (ls) => ({ figma: `${ls}, dashed stroke`, code: code('border-style: dashed'), why: 'The browser picks the dash length; exact dashes need an SVG.' })],
    ],
  },
};

/**
 * What a developer builds differently from the drawing, where nothing needs
 * deciding: one row per id and key, naming the layers, across every variant.
 * Markdown in each cell.
 * @returns {{ id: string, component: string, figma: string, code: string, why: string, layers: string[] }[]}
 */
export function translations(components, target, { states } = {}) {
  const set = TRANSLATE[target];
  if (!TARGETS[target]) throw new Error(`unknown target "${target}"; one of ${targets.join(', ')}`);
  if (!set) return [];
  const out = [];
  for (const c of components) {
    const found = new Map();
    for (const v of c.variants || []) {
      const walk = (n, ancestors) => {
        if (n.hidden) return;
        const layer = ancestors.length ? n.name : 'The component';
        for (const [id, test, say] of set.nodes) {
          const key = test(n, ancestors);
          if (!key) continue;
          const k = `${id}\0${key}`;
          if (!found.has(k)) found.set(k, { id, key, say, first: n, layers: new Set() });
          found.get(k).layers.add(layer);
        }
        for (const x of n.children || []) walk(x, [...ancestors, n]);
      };
      walk(v, []);
    }
    for (const f of found.values()) {
      const ls = [...f.layers];
      const named = `${ls.slice(0, 3).map((x) => (x === 'The component' ? x : `**${x}**`)).join(', ')}${ls.length > 3 ? ` and ${ls.length - 3} more` : ''}`;
      out.push({ id: f.id, component: c.name, ...f.say(named, f.first, ls.length, f.key), layers: ls });
    }
    for (const [name, v] of Object.entries(c.props || {})) {
      const k = name.split('#')[0].trim().toLowerCase();
      const rule = set.props.find(([, test]) => test(k, v, states && states.axis));
      if (rule) out.push({ id: rule[0], component: c.name, ...rule[2](name.split('#')[0].trim(), v, k), layers: [] });
    }
  }
  return out;
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop())) {
  const args = process.argv.slice(2);
  const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
  const target = opt('--target'), stylesFile = opt('--text-styles'), statesJson = opt('--states');
  // the options that take a value; --snapshot is a flag, and a file after it is the file
  const file = args.find((a, i) => !a.startsWith('--') && !['--target', '--text-styles', '--states'].includes(args[i - 1]));
  if (!target || !file) { console.error(`usage: validate.mjs --target ${targets.join('|')} [--text-styles tokens.json] [--states '{"axis":…,"options":[…]}'] [--snapshot] components.json`); process.exit(2); }
  // a missing or unreadable input is one line naming it, never a stack (as tools/figma-audit/scores.mjs)
  const readJson = (f) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { console.error(`${f}: ${e.code === 'ENOENT' ? 'no such file' : e.code === 'EISDIR' ? 'a folder, not a file' : 'not JSON (' + e.message + ')'}`); process.exit(1); } };
  const data = readJson(file);
  const given = Array.isArray(data) ? data : data.components || [data];
  const components = args.includes('--snapshot') ? fromSnapshot(given) : given;
  const styles = stylesFile ? readJson(stylesFile) : null;
  const textStyles = styles ? (Array.isArray(styles) ? styles : styles.textStyles) : null;
  // The state axis and its options, from the library's settings; absent, the state checks stay silent.
  const states = statesJson ? JSON.parse(statesJson) : undefined;
  const findings = validate(components, target, { textStyles, states });
  console.log(JSON.stringify({ target, silent: silentClasses(components, target), findings }, null, 2));
  // exitCode, not exit(): exit() drops whatever of a piped stdout is still
  // buffered, and a report past 64 KB reached its reader cut in half.
  process.exitCode = findings.length ? 1 : 0;
}
