/* figma-token-export — layer 1: pure logic, no `figma` global, fully testable.
 *
 * Turns a plain-data snapshot (see collect.js) into DTCG 2025.10 token files.
 * Nothing here touches a node, so `node tools/tokens/test-dtcg.js` is the gate.
 *
 * Exposes one global: DTCG.
 */
(function () {
  'use strict';

  /* ---------- names ---------- */

  // Token path segments are kebab-case. A '.' in a segment would break the
  // reference syntax ({group.token}), so it is replaced like any other
  // punctuation rather than preserved.
  //
  // A leading minus is the exception, and it is not cosmetic: stripping it
  // turns a variable named `-1` into a token named `1` holding the value -1,
  // and collides outright with a sibling actually named `1`. Found in a real
  // shadow-offset scale, where both exist.
  function slug(name) {
    var s = String(name).trim();
    var negative = /^-\s*(?=[0-9])/.test(s);
    if (negative) s = s.replace(/^-\s*/, '');
    var out = s
      .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return negative ? 'minus-' + out : out;
  }

  function pathFor(collectionName, variableName) {
    var segs = String(variableName).split('/').map(slug).filter(Boolean);
    return [slug(collectionName)].concat(segs);
  }

  function refFor(path) { return '{' + path.join('.') + '}'; }

  /* Naming parity: which renames are lossy, and therefore worth reporting.
   *
   * Every name is lowercased and spaced-to-hyphenated on export, so flagging
   * that would flag everything and be read as noise. What matters is a segment
   * the exporter had to *decide* about — punctuation it dropped, or a sign it
   * had to spell out — because the Figma name and the code name have then
   * diverged in a way a designer cannot predict and will not see.
   *
   * The rule this serves is naming parity between design and code (Frost,
   * Subatomic ch.3). The fix is usually to rename in Figma, not to accept the
   * translation, which is why this is a report and not a silent transform. */
  function isLossy(segment) {
    var s = String(segment).trim();
    if (/^-\s*[0-9]/.test(s)) return true;          // sign spelled out as `minus-`
    // A hyphen maps to itself, so `8-anchor` and `hue-1` are not renames. The
    // first version of this check flagged them and returned 42 hits on a
    // 565-variable library, which is the shape of a broken detector rather
    // than a finding: the real answer was two.
    return /[^A-Za-z0-9 -]/.test(s);                // punctuation dropped or collapsed
  }

  function renamedSegments(figmaName) {
    var segs = String(figmaName).split('/');
    var out = [];
    for (var i = 0; i < segs.length; i++) if (isLossy(segs[i])) out.push(segs[i].trim());
    return out;
  }

  /* ---------- values ---------- */

  function clamp01(n) { return n < 0 ? 0 : n > 1 ? 1 : n; }
  function round(n, dp) { var f = Math.pow(10, dp); return Math.round(n * f) / f; }

  // a line height as a fraction of the font size, to four places: tools/shared/text-units.js's, which
  // tools/shared/test-text-units.mjs holds this copy to (this file also runs in Figma's sandbox, which imports nothing)
  const perFontSize = (o, fontSize) => (!o ? null : o.unit === 'PERCENT' ? +(o.value / 100).toFixed(4) : o.unit === 'PIXELS' && fontSize ? +(o.value / fontSize).toFixed(4) : null);

  function hex2(n) { return ('0' + Math.round(clamp01(n) * 255).toString(16)).slice(-2); }

  // 6-digit hex, per the color module: the `hex` fallback must not carry alpha.
  function hexOf(c) { return '#' + hex2(c.r) + hex2(c.g) + hex2(c.b); }

  // Two shapes, and the choice is a real trade-off — see references/mapping.md.
  //   'object' (default): DTCG 2025.10 compliant — {colorSpace, components, alpha, hex}
  //   'hex':              legacy string form — what Style Dictionary v4 consumes today
  function colorValue(c, format) {
    var a = c.a === undefined ? 1 : c.a;
    if (format === 'hex') return hexOf(c) + (a < 1 ? hex2(a) : '');
    var v = {
      colorSpace: 'srgb',
      components: [round(clamp01(c.r), 6), round(clamp01(c.g), 6), round(clamp01(c.b), 6)],
      alpha: round(clamp01(a), 6),
      hex: hexOf(c)
    };
    return v;
  }

  // DTCG dimension: {value, unit} where unit is 'px' or 'rem'. A bare number is
  // not a dimension in 2025.10, which is the single most common export defect.
  function dimension(n, unit, rootSize) {
    if (unit === 'rem') return { value: round(n / (rootSize || 16), 6), unit: 'rem' };
    return { value: round(n, 6), unit: 'px' };
  }

  // The font-weight names: the DTCG format's own aliases, as the parity engine's one table has them
  // (tools/parity/values.mjs WEIGHTS). This file also runs in Figma's sandbox, which imports nothing, so it keeps
  // a copy that test-dtcg.js holds to that table.
  var WEIGHTS = {
    thin: 100, hairline: 100, extralight: 200, ultralight: 200, light: 300,
    regular: 400, normal: 400, book: 400, medium: 500, semibold: 600, demibold: 600,
    bold: 700, extrabold: 800, ultrabold: 800, black: 900, heavy: 900,
    extrablack: 950, ultrablack: 950
  };

  // Figma stores weight as a display string ("Semi Bold"). DTCG accepts a
  // number in [1,1000] or one of its own keywords — and "Semi Bold" is neither,
  // so a passthrough export is invalid even though it looks fine.
  function fontWeight(str) {
    var s = String(str).trim();
    if (/^\d+$/.test(s)) { var n = parseInt(s, 10); return (n >= 1 && n <= 1000) ? n : null; }
    // "Semi Bold" (variable value) and "SemiBold" (fontName.style) are the same
    // weight spelled two ways by the same file — both must land on 600.
    // Compared with the separators removed: a variable holding "semibold" is the
    // same weight as "Semi Bold" and "SemiBold", and was skipped as unknown.
    var k = s.replace(/[\s_-]+/g, '').toLowerCase();
    return Object.prototype.hasOwnProperty.call(WEIGHTS, k) ? WEIGHTS[k] : null;
  }

  /* ---------- classification ---------- */

  // Which $type a variable becomes, and how its value converts. Group names are
  // a heuristic and heuristics are per-project, so `opts.groups` overrides them.
  // The segment that names the kind can sit anywhere: "Opacity/disabled",
  // "State/Disabled/opacity", "Font/Family/text", "Label/md/family" are all
  // real shapes, and reading only the head skipped the second of each pair.
  function isOpacity(name) { return String(name).split('/').some(function (seg) { return /^opacit/i.test(seg); }); }
  function classify(variable, opts) {
    var groups = (opts && opts.groups) || {};
    var segments = String(variable.name).split('/');
    var hinted = groups[segments[0]];
    if (hinted) return hinted;
    if (variable.type === 'COLOR') return 'color';
    if (variable.type === 'FLOAT') return isOpacity(variable.name) ? 'number' : 'dimension';
    if (variable.type === 'STRING') {
      var kind = function (re) { return segments.some(function (seg) { return re.test(seg); }); };
      if (kind(/^famil/i)) return 'fontFamily';
      if (kind(/^weight/i)) return 'fontWeight';
      return 'unsupported';
    }
    if (variable.type === 'BOOLEAN') return 'unsupported';
    return 'unsupported';
  }

  // Opacity in Figma is authored either 0–1 or 0–100 and nothing declares which.
  // Deciding per group from the observed maximum keeps one collection internally
  // consistent; a per-variable guess would not.
  function opacityScale(values, mode) {
    if (mode === 'unit') return 1;
    if (mode === 'percent') return 100;
    var max = 0;
    for (var i = 0; i < values.length; i++) if (typeof values[i] === 'number' && values[i] > max) max = values[i];
    return max > 1 ? 100 : 1;
  }

  /* ---------- token assembly ---------- */

  /* Returns false instead of overwriting when the path is already taken.
   * Two Figma names can slug to one path — a silent overwrite loses a token
   * and the export still looks complete, which is the worst shape a defect
   * can take here. The caller reports the collision instead. */
  function setDeep(root, path, token) {
    var node = root;
    for (var i = 0; i < path.length - 1; i++) {
      if (node[path[i]] && node[path[i]].$value !== undefined) return false;
      if (!node[path[i]] || typeof node[path[i]] !== 'object') node[path[i]] = {};
      node = node[path[i]];
    }
    var leaf = path[path.length - 1];
    if (node[leaf] !== undefined) return false;
    node[leaf] = token;
    return true;
  }

  function extensions(variable, collectionName, mode, vendor) {
    var ext = {};
    ext[vendor] = {
      collection: collectionName,
      name: variable.name,
      mode: mode,
      hiddenFromPublishing: !!variable.hidden
    };
    return ext;
  }

  /* Build one file's token tree for one collection in one mode.
   * Returns { tokens, skipped:[{name, reason}] }. */
  function buildCollection(collection, mode, opts) {
    var o = opts || {};
    var vendor = o.vendor || 'com.figma.variables';
    var colorFormat = o.colorFormat || 'object';
    var unit = o.unit || 'px';
    var rootSize = o.rootSize || 16;
    var tokens = {};
    var skipped = [];
    var renamed = [];

    var opacityValues = [];
    for (var a = 0; a < collection.variables.length; a++) {
      var ov = collection.variables[a];
      if (ov.type === 'FLOAT' && isOpacity(ov.name)) {
        var raw = ov.values[mode];
        if (typeof raw === 'number') opacityValues.push(raw);
      }
    }
    var opacityDivisor = opacityScale(opacityValues, o.opacity);

    for (var i = 0; i < collection.variables.length; i++) {
      var v = collection.variables[i];
      var type = classify(v, o);
      if (type === 'unsupported') {
        skipped.push({ name: v.name, reason: 'no DTCG type for ' + v.type + ' outside fontFamily/fontWeight' });
        continue;
      }
      var raw = v.values[mode];
      if (raw === undefined) { skipped.push({ name: v.name, reason: 'no value in mode ' + mode }); continue; }

      var value;
      if (raw && raw.alias) {
        value = refFor(pathFor(raw.alias.collection, raw.alias.name));
      } else if (type === 'color') {
        value = colorValue(raw, colorFormat);
      } else if (type === 'dimension') {
        value = dimension(raw, unit, rootSize);
      } else if (type === 'number') {
        value = round(raw / opacityDivisor, 6);
      } else if (type === 'fontWeight') {
        var w = fontWeight(raw);
        if (w === null) { skipped.push({ name: v.name, reason: 'font weight "' + raw + '" is not a DTCG weight' }); continue; }
        value = w;
      } else if (type === 'fontFamily') {
        value = String(raw);
      } else {
        skipped.push({ name: v.name, reason: 'unhandled type ' + type });
        continue;
      }

      var token = { $type: type, $value: value };
      if (v.description) token.$description = v.description;
      if (!o.noExtensions) token.$extensions = extensions(v, collection.name, mode, vendor);
      var at = pathFor(collection.name, v.name);
      if (!setDeep(tokens, at, token))
        skipped.push({ name: v.name, reason: 'name collides with another token at ' + at.join('.') });
      else {
        var lossy = renamedSegments(v.name);
        if (lossy.length) renamed.push({ name: v.name, path: at.join('.'), segments: lossy });
      }
    }
    return { tokens: tokens, skipped: skipped, renamed: renamed };
  }

  /* ---------- text styles → typography ---------- */

  // Figma percent line-height is relative to font size, DTCG lineHeight is a
  // unitless multiplier, and percent letter-spacing has no DTCG equivalent at
  // all — it resolves against the style's own font size, which is known here,
  // so it converts to an absolute dimension rather than being dropped.
  function typographyToken(style, opts) {
    var o = opts || {};
    var unit = o.unit || 'px';
    var rootSize = o.rootSize || 16;
    var warnings = [];
    var value = {};
    var bound = style.bound || {};

    value.fontFamily = bound.fontFamily
      ? refFor(pathFor(bound.fontFamily.collection, bound.fontFamily.name))
      : String(style.fontFamily);

    value.fontSize = bound.fontSize
      ? refFor(pathFor(bound.fontSize.collection, bound.fontSize.name))
      : dimension(style.fontSize, unit, rootSize);

    var w = bound.fontWeight
      ? refFor(pathFor(bound.fontWeight.collection, bound.fontWeight.name))
      : fontWeight(style.fontWeight);
    if (w === null) {
      warnings.push({ name: style.name, reason: 'font weight "' + style.fontWeight + '" is not a DTCG weight' });
      w = 400;
    }
    value.fontWeight = w;

    // AUTO is the font's ascender + descender rounded to whole pixels; the
    // collector measures it on a rendered text node (unit MEASURED). Only an
    // AUTO that could not be measured is omitted — never faked.
    var lh = style.lineHeight;
    if (!lh || lh.unit === 'AUTO') {
      warnings.push({ name: style.name, reason: 'line height is AUTO and could not be measured — omitted' });
    } else {
      // a measured AUTO is the rendered line's pixels (collect.js, unit MEASURED)
      value.lineHeight = perFontSize(lh.unit === 'MEASURED' ? { unit: 'PIXELS', value: lh.value } : lh, style.fontSize);
    }

    var ls = style.letterSpacing;
    if (ls) {
      var px = ls.unit === 'PERCENT' ? (ls.value / 100) * style.fontSize : ls.value;
      value.letterSpacing = dimension(px, unit, rootSize);
    }

    var token = { $type: 'typography', $value: value };
    if (style.description) token.$description = style.description;
    return { token: token, warnings: warnings };
  }

  function buildTextStyles(styles, opts) {
    var o = opts || {};
    var root = o.root || 'text-style';
    var tokens = {};
    var warnings = [];
    for (var i = 0; i < styles.length; i++) {
      var built = typographyToken(styles[i], o);
      warnings = warnings.concat(built.warnings);
      var path = [slug(root)].concat(String(styles[i].name).split('/').map(slug).filter(Boolean));
      if (!setDeep(tokens, path, built.token))
        warnings.push({ name: styles[i].name, reason: 'name collides with another style at ' + path.join('.') });
    }
    return { tokens: tokens, warnings: warnings };
  }

  /* ---------- effect styles → shadow ---------- */

  /* DTCG's shadow object (2025.10) defines color, offsetX, offsetY, blur,
   * spread and an optional `inset`, so an inner shadow is emitted as written.
   * Style Dictionary's `shadow/css/shorthand` renders it, verified against
   * 5.5.1 as `inset 0px 2px 4px 0px rgb(...)`. */
  function shadowLayer(effect, opts) {
    var o = opts || {};
    var unit = o.unit || 'px', rootSize = o.rootSize || 16;
    var b = effect.bound || {};
    var ref = function (bound) { return bound ? refFor(pathFor(bound.collection, bound.name)) : null; };
    var layer = {
      color: ref(b.color) || colorValue(effect.color, o.colorFormat || 'object'),
      offsetX: ref(b.offsetX) || dimension(effect.offset.x, unit, rootSize),
      offsetY: ref(b.offsetY) || dimension(effect.offset.y, unit, rootSize),
      blur: ref(b.radius) || dimension(effect.radius, unit, rootSize),
      spread: ref(b.spread) || dimension(effect.spread || 0, unit, rootSize)
    };
    if (effect.type === 'INNER_SHADOW') layer.inset = true;
    return layer;
  }

  /* Figma's effects array paints its LAST entry on top; a CSS shadow list,
   * which Style Dictionary writes in array order, paints its FIRST on top. So
   * the layers are walked from the end, and the token lists them top first. */
  function shadowToken(style, opts) {
    var layers = [], warnings = [];
    for (var i = style.effects.length - 1; i >= 0; i--) {
      var e = style.effects[i];
      if (e.visible === false) { warnings.push({ name: style.name, reason: 'layer ' + i + ' is hidden — omitted' }); continue; }
      if (e.type !== 'DROP_SHADOW' && e.type !== 'INNER_SHADOW') {
        warnings.push({ name: style.name, reason: 'layer ' + i + ' is ' + e.type + ' — no DTCG shadow equivalent, omitted' });
        continue;
      }
      layers.push(shadowLayer(e, opts));
    }
    if (!layers.length) return { token: null, warnings: warnings };
    var token = { $type: 'shadow', $value: layers.length === 1 ? layers[0] : layers };
    if (style.description) token.$description = style.description;
    return { token: token, warnings: warnings };
  }

  function buildEffectStyles(styles, opts) {
    var o = opts || {}, root = o.effectRoot || 'effect-style', tokens = {}, warnings = [], skipped = [];
    for (var i = 0; i < styles.length; i++) {
      var built = shadowToken(styles[i], o);
      warnings = warnings.concat(built.warnings);
      if (!built.token) { skipped.push({ name: styles[i].name, reason: 'no expressible shadow layers' }); continue; }
      var path = [slug(root)].concat(String(styles[i].name).split('/').map(slug).filter(Boolean));
      if (!setDeep(tokens, path, built.token))
        warnings.push({ name: styles[i].name, reason: 'name collides at ' + path.join('.') });
    }
    return { tokens: tokens, warnings: warnings, skipped: skipped };
  }

  /* ---------- colour styles → color / gradient ---------- */

  /* A solid style is a color token (a reference when bound). A linear gradient
   * is DTCG's gradient: an array of {color, position} stops — the type defines
   * no direction, so the angle goes in $extensions. The angle is read from the
   * gradient handles in the node's unit square, which stretches with the frame
   * as CSS corner keywords do and a degree value does not; the consumer decides
   * which to emit. Radial, angular and image paints have no DTCG type and are
   * reported. */
  function paintToken(style, opts) {
    var o = opts || {};
    var colorFormat = o.colorFormat || 'object';
    var vendor = o.vendor || 'com.figma.variables';
    var ref = function (bound) { return bound ? refFor(pathFor(bound.collection, bound.name)) : null; };
    var paints = (style.paints || []).filter(function (p) { return p.visible !== false; });
    if (!paints.length) return { token: null, reason: 'no visible paint' };
    if (paints.length > 1) return { token: null, reason: paints.length + ' stacked paints — DTCG carries one' };
    var p = paints[0];
    var token;
    if (p.type === 'SOLID') {
      token = { $type: 'color', $value: ref(p.bound && p.bound.color) || colorValue(p.color, colorFormat) };
    } else if (p.type === 'GRADIENT_LINEAR') {
      var stops = [];
      for (var i = 0; i < p.stops.length; i++) {
        var st = p.stops[i];
        stops.push({ color: ref(st.bound && st.bound.color) || colorValue(st.color, colorFormat), position: round(st.position, 4) });
      }
      token = { $type: 'gradient', $value: stops };
      if (!o.noExtensions) { token.$extensions = {}; token.$extensions[vendor] = { angle: p.angle }; }
    } else {
      return { token: null, reason: p.type + ' has no DTCG type' };
    }
    if (style.description) token.$description = style.description;
    return { token: token };
  }

  function buildPaintStyles(styles, opts) {
    var o = opts || {}, root = o.paintRoot || 'color-style', tokens = {}, warnings = [], skipped = [];
    for (var i = 0; i < styles.length; i++) {
      var built = paintToken(styles[i], o);
      if (!built.token) { skipped.push({ name: styles[i].name, reason: built.reason }); continue; }
      var path = [slug(root)].concat(String(styles[i].name).split('/').map(slug).filter(Boolean));
      if (!setDeep(tokens, path, built.token))
        warnings.push({ name: styles[i].name, reason: 'name collides at ' + path.join('.') });
    }
    return { tokens: tokens, warnings: warnings, skipped: skipped };
  }

  /* ---------- files + manifest ---------- */

  /* One folder per collection, one file per mode. The mode is the file and never
   * part of a token path: every mode file declares the same paths with different
   * values, which is what lets a consumer swap one file and change the theme with
   * nothing rewritten. A single-mode collection still gets a folder, so the shape
   * does not change when a second mode is added later. */
  function fileName(collectionName, mode, singleMode) {
    return slug(collectionName) + '/' + (singleMode ? 'value' : slug(mode)) + '.json';
  }

  /* One file per (collection, mode). Single-mode collections drop the suffix.
   * Returns { files:[{name, tokens}], manifest, report }.
   *
   * The manifest is the load-bearing half: per-mode files repeat the same token
   * paths, so feeding all of them to one Style Dictionary build collides. The
   * manifest lists the source sets that are actually valid — one per theme
   * permutation — so nobody has to work that out again by hand. */
  function buildFiles(snapshot, opts) {
    var o = opts || {};
    var files = [];
    var report = { skipped: [], warnings: [], notExported: [], renamed: [] };
    var axes = [];

    for (var i = 0; i < snapshot.collections.length; i++) {
      var c = snapshot.collections[i];
      var single = c.modes.length === 1;
      var variants = [];
      for (var m = 0; m < c.modes.length; m++) {
        var built = buildCollection(c, c.modes[m], o);
        var name = fileName(c.name, c.modes[m], single);
        files.push({ name: name, tokens: built.tokens });
        variants.push({ mode: c.modes[m], file: name });
        for (var s = 0; s < built.skipped.length; s++) {
          built.skipped[s].collection = c.name;
          built.skipped[s].mode = c.modes[m];
          report.skipped.push(built.skipped[s]);
        }
        // renames do not vary by mode — record them once, from the first mode
        if (m === 0) for (var r = 0; r < built.renamed.length; r++) {
          built.renamed[r].collection = c.name;
          report.renamed.push(built.renamed[r]);
        }
      }
      axes.push({ collection: c.name, single: single, variants: variants });
    }

    if (snapshot.textStyles && snapshot.textStyles.length) {
      var ts = buildTextStyles(snapshot.textStyles, o);
      files.push({ name: slug(o.root || 'text-style') + '/value.json', tokens: ts.tokens });
      report.warnings = report.warnings.concat(ts.warnings);
      axes.push({ collection: o.root || 'text-style', single: true, variants: [{ mode: null, file: slug(o.root || 'text-style') + '/value.json' }] });
    }

    if (snapshot.paintStyles && snapshot.paintStyles.length) {
      var ps = buildPaintStyles(snapshot.paintStyles, o);
      var psName = slug(o.paintRoot || 'color-style') + '/value.json';
      files.push({ name: psName, tokens: ps.tokens });
      report.warnings = report.warnings.concat(ps.warnings);
      report.skipped = report.skipped.concat(ps.skipped);
      axes.push({ collection: o.paintRoot || 'color-style', single: true, variants: [{ mode: null, file: psName }] });
    } else if (snapshot.paintStyles || snapshot.paintStyleCount) {
      report.notExported.push({ what: 'colour styles', count: snapshot.paintStyleCount || 0, reason: 'not exported — the caller passed paintStyles: false, or supplied no snapshot' });
    }

    if (snapshot.effectStyles && snapshot.effectStyles.length) {
      var fx = buildEffectStyles(snapshot.effectStyles, o);
      var fxName = slug(o.effectRoot || 'effect-style') + '/value.json';
      files.push({ name: fxName, tokens: fx.tokens });
      report.warnings = report.warnings.concat(fx.warnings);
      report.skipped = report.skipped.concat(fx.skipped);
      axes.push({ collection: o.effectRoot || 'effect-style', single: true, variants: [{ mode: null, file: fxName }] });
    } else if (snapshot.effectStyles || snapshot.effectStyleCount) {
      // Reached when the caller opted out (`effectStyles: false` gives []), which
      // must still be reported: silence here is indistinguishable from a library
      // that has no effect styles, and the whole point of the report is that
      // nothing leaves without saying so.
      report.notExported.push({
        what: 'effect styles',
        count: snapshot.effectStyleCount || 0,
        reason: 'not exported — the caller passed effectStyles: false, or supplied no snapshot'
      });
    }

    return { files: files, manifest: buildManifest(axes), report: report };
  }

  /* Cartesian product over the *distinct* mode axes; single-mode files are in
   * every build.
   *
   * Collections that share a mode-name set share an axis and move together —
   * a primitive tier and a semantic tier both carrying Light/Dark are one
   * theme switch, not two. Multiplying them independently is silent and wrong:
   * it doubles the build count and produces combinations (primitive Light +
   * semantic Dark) that no one would ever ship. Found on the first real
   * library rather than in the fixture, which had only one multi-mode
   * collection and so could not express the bug. */
  function axisKey(axis) {
    return axis.variants.map(function (v) { return slug(v.mode); }).sort().join('|');
  }

  function buildManifest(axes) {
    var fixed = [], order = [], grouped = {};
    for (var i = 0; i < axes.length; i++) {
      if (axes[i].single) { fixed.push(axes[i].variants[0].file); continue; }
      var key = axisKey(axes[i]);
      if (!grouped[key]) { grouped[key] = []; order.push(key); }
      grouped[key].push(axes[i]);
    }

    // One axis per distinct mode-name set; each of its steps carries every
    // file that collection group contributes for that mode.
    var axisList = [];
    for (var k = 0; k < order.length; k++) {
      var group = grouped[order[k]];
      var steps = [];
      for (var m = 0; m < group[0].variants.length; m++) {
        var mode = group[0].variants[m].mode;
        var files = [];
        for (var g = 0; g < group.length; g++) {
          for (var vv = 0; vv < group[g].variants.length; vv++)
            if (slug(group[g].variants[vv].mode) === slug(mode)) files.push(group[g].variants[vv].file);
        }
        steps.push({ mode: mode, files: files });
      }
      axisList.push(steps);
    }

    var combos = [[]];
    for (var a = 0; a < axisList.length; a++) {
      var next = [];
      for (var c = 0; c < combos.length; c++)
        for (var s = 0; s < axisList[a].length; s++)
          next.push(combos[c].concat([axisList[a][s]]));
      combos = next;
    }

    var builds = [];
    for (var b = 0; b < combos.length; b++) {
      var picks = combos[b], names = [], sources = fixed.slice();
      for (var p = 0; p < picks.length; p++) { names.push(slug(picks[p].mode)); sources = sources.concat(picks[p].files); }
      builds.push({ name: names.join('-') || 'default', sources: sources });
    }
    return { builds: builds };
  }

  /* ---------- verification ---------- */

  /* Every reference must resolve inside each manifest build that uses it,
   * not merely somewhere in the export: a build is the set of files one Style
   * Dictionary run reads, and a reference that resolves only in another
   * build's sources is silent in Figma and fatal there. `files` maps a file
   * name to its parsed tokens; a source the map does not hold is skipped.
   * Returns { builds, dangling: [{ build, reference }], ok }. */
  function tokenPaths(node, prefix, into) {
    for (var k in node) {
      if (k.charAt(0) === '$') continue;
      var child = node[k];
      if (!child || typeof child !== 'object') continue;
      var p = prefix ? prefix + '.' + k : k;
      if (child.$value !== undefined) into[p] = true; else tokenPaths(child, p, into);
    }
    return into;
  }
  function tokenRefs(node, into) {
    for (var k in node) {
      var child = node[k];
      if (k === '$value') {
        var stack = [child];
        while (stack.length) {
          var cur = stack.pop();
          if (typeof cur === 'string') { var m = /^\{(.+)\}$/.exec(cur); if (m) into.push(m[1]); }
          else if (cur && typeof cur === 'object') for (var j in cur) stack.push(cur[j]);
        }
      } else if (child && typeof child === 'object' && k.charAt(0) !== '$') tokenRefs(child, into);
    }
    return into;
  }
  function verifyReferences(files, manifest) {
    var bad = [], seen = {};
    for (var b = 0; b < manifest.builds.length; b++) {
      var build = manifest.builds[b];
      var defined = {}, used = [];
      for (var s = 0; s < build.sources.length; s++) {
        var f = files[build.sources[s]];
        if (!f) continue;
        tokenPaths(f, '', defined);
        tokenRefs(f, used);
      }
      for (var u = 0; u < used.length; u++)
        // one line per build and reference, however many tokens use it
        if (!defined[used[u]] && !seen[build.name + '\u0000' + used[u]]) { seen[build.name + '\u0000' + used[u]] = true; bad.push({ build: build.name, reference: used[u] }); }
    }
    return { builds: manifest.builds.length, dangling: bad, ok: bad.length === 0 };
  }

  var DTCG = {
    slug: slug, pathFor: pathFor, refFor: refFor,
    colorValue: colorValue, hexOf: hexOf, dimension: dimension,
    fontWeight: fontWeight, WEIGHTS: WEIGHTS, classify: classify, opacityScale: opacityScale,
    buildCollection: buildCollection, typographyToken: typographyToken,
    shadowLayer: shadowLayer, shadowToken: shadowToken, buildEffectStyles: buildEffectStyles,
    paintToken: paintToken, buildPaintStyles: buildPaintStyles, isOpacity: isOpacity,
    isLossy: isLossy, renamedSegments: renamedSegments,
    buildTextStyles: buildTextStyles, fileName: fileName,
    buildFiles: buildFiles, buildManifest: buildManifest,
    verifyReferences: verifyReferences
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = DTCG;
  if (typeof globalThis !== 'undefined') globalThis.DTCG = DTCG;
})();
