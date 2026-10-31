/*
 * What a snapshot CONTAINS — the half of the chain projects.cjs does not cover.
 *
 * projects.cjs settles whose payload this is. Nothing said what was in one:
 * each repo's receiver decided, two receivers disagreed on the shape of the
 * same file, and every consumer (a docs site, the validator, the doc
 * generator) either coupled itself to one repo's layout or read Figma live
 * instead. This is the one statement of the shape, checked by the same code
 * wherever a payload or a stored file is read.
 *
 * Validators return a list of problems, empty when the value is valid. They
 * check what consumers rely on and nothing more: an extra key is never an
 * error, so a plugin may send ahead of a store that reads it. It carried five
 * convenience keys on that allowance until plugin 0.32.0 removed them — the
 * receivers they were for had been gone since snapshot-standard 2.0.0, which
 * is the cost of a tolerance nobody revisits.
 */
'use strict';

const SCHEMA_VERSION = 1;

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isStr = (v) => typeof v === 'string';
const isNum = (v) => typeof v === 'number' && Number.isFinite(v);

/** Collect problems under a path prefix. */
function checker() {
  const errors = [];
  const need = (ok, where, what) => { if (!ok) errors.push(`${where}: ${what}`); return ok; };
  return { errors, need };
}

// Figma's non-variant property types; a variant property arrives as its values.
const PROP_TYPES = new Set(['BOOLEAN', 'TEXT', 'INSTANCE_SWAP', 'SLOT']);

/** The tokens half of a library payload, and the tokens file a store keeps. */
function tokens(t, where = 'tokens') {
  const { errors, need } = checker();
  if (!need(isObj(t), where, 'must be an object')) return errors;
  if (need(isObj(t._meta), `${where}._meta`, 'must be an object')) {
    need(isStr(t._meta.file), `${where}._meta.file`, 'must name the file');
    need(isStr(t._meta.fileKey) || isStr(t._meta.fileId), `${where}._meta`, 'must carry fileKey or fileId');
    need(t._meta.pages === undefined || (Array.isArray(t._meta.pages) && t._meta.pages.every(isStr)), `${where}._meta.pages`, 'must list page names when present');
  }
  if (need(isObj(t.collections), `${where}.collections`, 'must be an object of collections')) {
    for (const [name, c] of Object.entries(t.collections)) {
      const at = `${where}.collections[${JSON.stringify(name)}]`;
      if (!need(isObj(c), at, 'must be an object')) continue;
      if (!need(Array.isArray(c.modes) && c.modes.length > 0 && c.modes.every(isStr), `${at}.modes`, 'must list at least one mode name')) continue;
      need(isObj(c.values) && c.modes.every((m) => isObj(c.values[m])), `${at}.values`, 'must hold an object per mode');
      need(c.alias === undefined || isObj(c.alias), `${at}.alias`, 'must be an object when present');
      need(c.descriptions === undefined || (isObj(c.descriptions) && Object.values(c.descriptions).every(isStr)), `${at}.descriptions`, 'must map names to text when present');
    }
  }
  if (need(Array.isArray(t.textStyles), `${where}.textStyles`, 'must be an array')) {
    t.textStyles.forEach((s, i) => need(isObj(s) && isStr(s.name) && isStr(s.family) && isNum(s.size) && isNum(s.lineHeight),
      `${where}.textStyles[${i}]`, 'needs name, family, size and lineHeight'));
  }
  if (need(Array.isArray(t.paintStyles), `${where}.paintStyles`, 'must be an array')) {
    t.paintStyles.forEach((s, i) => need(isObj(s) && isStr(s.name) && Array.isArray(s.paints), `${where}.paintStyles[${i}]`, 'needs name and paints'));
  }
  if (need(Array.isArray(t.effects), `${where}.effects`, 'must be an array')) {
    t.effects.forEach((s, i) => need(isObj(s) && isStr(s.name) && Array.isArray(s.layers), `${where}.effects[${i}]`, 'needs name and layers'));
  }
  return errors;
}

/** A node tree: every node names itself and its type. */
function tree(n, where) {
  const { errors, need } = checker();
  if (!need(isObj(n) && isStr(n.name) && isStr(n.type), where, 'must be a node with name and type')) return errors;
  (n.children || []).forEach((c, i) => errors.push(...tree(c, `${where}.children[${i}]`)));
  return errors;
}

/**
 * One component, as the plugin sends it (`variants` in full) or as a store
 * keeps it (compacted: one `default`, the rest as deltas, see spec.js).
 */
function component(c, where = 'component') {
  const { errors, need } = checker();
  if (!need(isObj(c), where, 'must be an object')) return errors;
  need(isStr(c.name) && c.name.length > 0, `${where}.name`, 'must be a non-empty string');
  need(isStr(c.id), `${where}.id`, 'must be the node id');
  need(isStr(c.page), `${where}.page`, 'must name the page, marker included');
  need(c.description === undefined || isStr(c.description), `${where}.description`, 'must be text when present');
  if (need(isObj(c.props), `${where}.props`, 'must be an object')) {
    for (const [k, v] of Object.entries(c.props)) {
      need((Array.isArray(v) && v.every(isStr)) || PROP_TYPES.has(v), `${where}.props[${JSON.stringify(k)}]`,
        `must be a list of variant values or one of ${[...PROP_TYPES].join(', ')}`);
    }
  }
  if (!need(Array.isArray(c.variants), `${where}.variants`, 'must be an array')) return errors;
  if (c.default !== undefined) {
    errors.push(...tree(c.default, `${where}.default`));
    c.variants.forEach((v, i) => need(isObj(v) && isStr(v.name), `${where}.variants[${i}]`, 'must name its variant'));
  } else {
    need(c.variants.length > 0, `${where}.variants`, 'must hold at least one variant');
    c.variants.forEach((v, i) => errors.push(...tree(v, `${where}.variants[${i}]`)));
  }
  return errors;
}

/** POST /library */
function library(p) {
  const { errors, need } = checker();
  if (!need(isObj(p), 'library', 'must be an object')) return errors;
  errors.push(...tokens(p.tokens));
  if (need(Array.isArray(p.components), 'components', 'must be an array')) {
    p.components.forEach((c, i) => errors.push(...component(c, `components[${i}]`)));
  }
  if (need(Array.isArray(p.icons), 'icons', 'must be an array')) {
    p.icons.forEach((x, i) => need(isObj(x) && isStr(x.name) && isNum(x.size) && isStr(x.svg) && (x.unbound === undefined || isNum(x.unbound)) && (x.fill === undefined || isStr(x.fill)), `icons[${i}]`, 'needs name, size and svg, unbound is a count and fill a variable name when present'));
  }
  need(p.iconSets === undefined || (Array.isArray(p.iconSets) && p.iconSets.every(isStr)), 'iconSets', 'must list names when present');
  need(p.iconDescriptions === undefined || (isObj(p.iconDescriptions) && Object.values(p.iconDescriptions).every(isStr)), 'iconDescriptions', 'must map icon names to descriptions when present');
  need(p.iconGroups === undefined || (isObj(p.iconGroups) && Object.values(p.iconGroups).every(isStr)), 'iconGroups', 'must map icon names to group names when present');
  for (const key of ['graphics', 'previews']) {
    if (p[key] === undefined) continue;
    if (need(Array.isArray(p[key]), key, 'must be an array when present')) {
      p[key].forEach((x, i) => need(isObj(x) && isStr(x.name) && isNum(x.w) && isNum(x.h) && isStr(x.png) && (x.dark === undefined || isStr(x.dark))
        && (x.anatomy === undefined || (isObj(x.anatomy) && isStr(x.anatomy.png) && Array.isArray(x.anatomy.parts)))
        && (x.variants === undefined || (Array.isArray(x.variants) && x.variants.every((v) => isObj(v) && isStr(v.name) && isStr(v.png) && (v.dark === undefined || isStr(v.dark))))), `${key}[${i}]`, 'needs name, w, h and png; dark only as a png; anatomy only with a png and parts; variants only as named pngs, each dark only as a png'));
    }
  }
  return errors;
}

/** POST /screens */
function screens(p) {
  const { errors, need } = checker();
  if (!need(isObj(p), 'screens payload', 'must be an object')) return errors;
  if (need(isObj(p._meta), '_meta', 'must be an object')) {
    need(isStr(p._meta.fileKey) || isStr(p._meta.fileId), '_meta', 'must carry fileKey or fileId');
  }
  if (need(Array.isArray(p.screens), 'screens', 'must be an array')) {
    p.screens.forEach((s, i) => {
      const at = `screens[${i}]`;
      if (!need(isObj(s) && isStr(s.page) && isStr(s.frame) && isStr(s.id), at, 'needs page, frame and id')) return;
      need(s.section === undefined || s.section === null || isStr(s.section), `${at}.section`, 'must be the section page\'s name, or null');
      // An unmarked frame is a draft and travels as its name alone.
      if (s.devStatus) errors.push(...tree(s.tree, `${at}.tree`));
    });
  }
  return errors;
}

module.exports = { SCHEMA_VERSION, tokens, component, library, screens };
