/* figma-token-export — layer 2: everything that needs the `figma` global.
 *
 * Prepend the toolkit's `tools/tokens/dtcg.js` before this file; it calls DTCG at runtime.
 * `node --check` is the only gate this layer can have — it needs a live file.
 *
 * Runs in the SOURCE library file: styles have no library API that enumerates
 * them, and local variables are the only ones whose hidden tier is reachable.
 */
(function () {
  'use strict';

  function need() {
    if (typeof DTCG === 'undefined') throw new Error('Prepend tools/tokens/dtcg.js before scripts/collect.js');
  }

  /* ---------- snapshot ---------- */

  async function snapshotVariables(opts) {
    need();
    var o = opts || {};
    var collections = await figma.variables.getLocalVariableCollectionsAsync();
    var nameById = {};
    for (var a = 0; a < collections.length; a++) nameById[collections[a].id] = collections[a].name;

    var out = [];
    for (var i = 0; i < collections.length; i++) {
      var c = collections[i];
      if (o.only && o.only.indexOf(c.name) === -1) continue;
      var vars = [];
      for (var j = 0; j < c.variableIds.length; j++) {
        var v = await figma.variables.getVariableByIdAsync(c.variableIds[j]);
        if (!v) continue;
        var values = {};
        for (var m = 0; m < c.modes.length; m++) {
          var raw = v.valuesByMode[c.modes[m].modeId];
          if (raw && raw.type === 'VARIABLE_ALIAS') {
            var t = await figma.variables.getVariableByIdAsync(raw.id);
            // An unresolvable alias is a finding, not a blank: it means the
            // target left the file. Recorded as such rather than skipped.
            values[c.modes[m].name] = t
              ? { alias: { collection: nameById[t.variableCollectionId] || '(external)', name: t.name } }
              : { unresolved: raw.id };
          } else {
            values[c.modes[m].name] = raw;
          }
        }
        vars.push({
          name: v.name,
          type: v.resolvedType,
          hidden: !!v.hiddenFromPublishing,
          description: v.description || '',
          values: values
        });
      }
      out.push({ name: c.name, modes: c.modes.map(function (m) { return m.name; }), variables: vars });
    }
    return out;
  }

  async function snapshotTextStyles() {
    need();
    var styles = await figma.getLocalTextStylesAsync();
    var colls = await figma.variables.getLocalVariableCollectionsAsync();
    var nameById = {};
    for (var a = 0; a < colls.length; a++) nameById[colls[a].id] = colls[a].name;

    async function boundRef(bv) {
      if (!bv || !bv.id) return null;
      var v = await figma.variables.getVariableByIdAsync(bv.id);
      if (!v) return null;
      return { collection: nameById[v.variableCollectionId] || '(external)', name: v.name };
    }

    /* AUTO line height is the font's ascender + descender rounded to whole
     * pixels, and only a rendered text node knows it. The measure needs a font
     * load, which has hung in degraded sandboxes, so it is raced against a
     * timeout; on failure the AUTO goes through unmeasured and the builder
     * reports it omitted. */
    async function measureAuto(s) {
      var node = null;
      try {
        await Promise.race([figma.loadFontAsync(s.fontName), new Promise(function (_, rej) { setTimeout(function () { rej(new Error('font load timed out')); }, 3000); })]);
        node = figma.createText();
        node.fontName = s.fontName; node.fontSize = s.fontSize; node.lineHeight = { unit: 'AUTO' };
        node.characters = 'Hg';
        var h = node.height;
        return { unit: 'MEASURED', value: Math.round(h) };
      } catch (e) {
        return s.lineHeight;
      } finally {
        if (node) node.remove();
      }
    }

    var out = [];
    for (var i = 0; i < styles.length; i++) {
      var s = styles[i];
      var b = s.boundVariables || {};
      out.push({
        name: s.name,
        description: s.description || '',
        fontFamily: s.fontName.family,
        fontWeight: s.fontName.style,
        fontSize: s.fontSize,
        lineHeight: s.lineHeight && s.lineHeight.unit === 'AUTO' ? await measureAuto(s) : s.lineHeight,
        letterSpacing: s.letterSpacing,
        bound: {
          fontFamily: await boundRef(b.fontFamily),
          fontSize: await boundRef(b.fontSize),
          // Figma binds the weight through `fontStyle`; DTCG calls it fontWeight.
          fontWeight: await boundRef(b.fontStyle)
        }
      });
    }
    return out;
  }

  /* Effect styles. Every layer's colour, offset, blur and spread may be bound to
   * a variable, and those bindings are the whole point — a shadow that carries
   * references stays tied to the tokens it was built from. Ids are file-local,
   * so bindings are recorded by collection and name. */
  async function snapshotEffectStyles() {
    need();
    var styles = await figma.getLocalEffectStylesAsync();
    var colls = await figma.variables.getLocalVariableCollectionsAsync();
    var nameById = {};
    for (var a = 0; a < colls.length; a++) nameById[colls[a].id] = colls[a].name;

    async function boundRef(bv) {
      if (!bv || !bv.id) return null;
      var v = await figma.variables.getVariableByIdAsync(bv.id);
      if (!v) return null;
      return { collection: nameById[v.variableCollectionId] || '(external)', name: v.name };
    }

    var out = [];
    for (var i = 0; i < styles.length; i++) {
      var s = styles[i], effects = [];
      for (var j = 0; j < s.effects.length; j++) {
        var e = s.effects[j], b = e.boundVariables || {};
        effects.push({
          type: e.type, visible: e.visible !== false,
          color: e.color, offset: e.offset || { x: 0, y: 0 },
          radius: e.radius, spread: e.spread || 0,
          bound: {
            color: await boundRef(b.color), offsetX: await boundRef(b.offsetX),
            offsetY: await boundRef(b.offsetY), radius: await boundRef(b.radius),
            spread: await boundRef(b.spread)
          }
        });
      }
      out.push({ name: s.name, description: s.description || '', effects: effects });
    }
    return out;
  }

  /* Colour styles: one paint each in practice. A solid's colour and a gradient
   * stop's colour may be bound to a variable; the angle comes from the inverse
   * of gradientTransform in the node's unit square. */
  async function snapshotPaintStyles() {
    need();
    var styles = await figma.getLocalPaintStylesAsync();
    var colls = await figma.variables.getLocalVariableCollectionsAsync();
    var nameById = {};
    for (var a = 0; a < colls.length; a++) nameById[colls[a].id] = colls[a].name;

    async function boundRef(bv) {
      if (!bv || !bv.id) return null;
      var v = await figma.variables.getVariableByIdAsync(bv.id);
      if (!v) return null;
      return { collection: nameById[v.variableCollectionId] || '(external)', name: v.name };
    }

    var out = [];
    for (var i = 0; i < styles.length; i++) {
      var s = styles[i], paints = [];
      for (var j = 0; j < s.paints.length; j++) {
        var p = s.paints[j];
        if (p.type === 'SOLID') {
          paints.push({ type: 'SOLID', visible: p.visible !== false, color: { r: p.color.r, g: p.color.g, b: p.color.b, a: p.opacity === undefined ? 1 : p.opacity }, bound: { color: await boundRef(p.boundVariables && p.boundVariables.color) } });
        } else if (p.type === 'GRADIENT_LINEAR') {
          var t = p.gradientTransform, a2 = t[0][0], b2 = t[0][1], c2 = t[0][2], d2 = t[1][0], e2 = t[1][1], f2 = t[1][2];
          var det = a2 * e2 - b2 * d2;
          var inv = function (x, y) { return [(e2 * (x - c2) - b2 * (y - f2)) / det, (-d2 * (x - c2) + a2 * (y - f2)) / det]; };
          var p0 = inv(0, 0.5), p1 = inv(1, 0.5);
          var angle = Math.round((Math.atan2(p1[1] - p0[1], p1[0] - p0[0]) * 180 / Math.PI + 90 + 360) % 360);
          var stops = [];
          for (var k = 0; k < p.gradientStops.length; k++) {
            var st = p.gradientStops[k];
            stops.push({ position: st.position, color: { r: st.color.r, g: st.color.g, b: st.color.b, a: st.color.a * (p.opacity === undefined ? 1 : p.opacity) }, bound: { color: await boundRef(st.boundVariables && st.boundVariables.color) } });
          }
          paints.push({ type: 'GRADIENT_LINEAR', visible: p.visible !== false, angle: angle, stops: stops });
        } else {
          paints.push({ type: p.type, visible: p.visible !== false });
        }
      }
      out.push({ name: s.name, description: s.description || '', paints: paints });
    }
    return out;
  }

  /* ---------- export ---------- */

  /* One call does the whole file. The JSON does not cross the bridge here —
   * a full library is hundreds of KB and a single oversized result is the
   * usual reason an export "fails" — so this returns the report and the file
   * sizes, and `takeFile(name)` hands over one file at a time. */
  async function exportTokens(opts) {
    need();
    var o = opts || {};
    var snapshot = {
      collections: await snapshotVariables(o),
      textStyles: o.textStyles === false ? [] : await snapshotTextStyles(),
      paintStyles: o.paintStyles === false ? [] : await snapshotPaintStyles(),
      effectStyles: o.effectStyles === false ? [] : await snapshotEffectStyles()
    };
    var built = DTCG.buildFiles(snapshot, o);
    var index = {};
    var sizes = [];
    for (var i = 0; i < built.files.length; i++) {
      var json = JSON.stringify(built.files[i].tokens, null, 2);
      index[built.files[i].name] = json;
      sizes.push({ name: built.files[i].name, bytes: json.length, tokens: countTokens(built.files[i].tokens) });
    }
    globalThis.__TOKEN_EXPORT__ = { index: index, manifest: built.manifest, report: built.report };
    return {
      files: sizes,
      manifest: built.manifest,
      report: built.report,
      next: 'call takeFile("<name>") for each file'
    };
  }

  function countTokens(node) {
    var n = 0;
    for (var k in node) {
      if (k.charAt(0) === '$') continue;
      var child = node[k];
      if (child && typeof child === 'object') n += (child.$value !== undefined) ? 1 : countTokens(child);
    }
    return n;
  }

  function takeFile(name) {
    var cache = globalThis.__TOKEN_EXPORT__;
    if (!cache) throw new Error('Run exportTokens() first');
    if (cache.index[name] === undefined) throw new Error('No such file: ' + name + ' — have ' + Object.keys(cache.index).join(', '));
    return cache.index[name];
  }

  /* Verification, run against the built files rather than the intent: every
   * reference must resolve inside at least one manifest build. A dangling
   * reference is silent in Figma and fatal in Style Dictionary. */
  function verifyReferences() {
    var cache = globalThis.__TOKEN_EXPORT__;
    if (!cache) throw new Error('Run exportTokens() first');
    var parsed = {};
    for (var name in cache.index) parsed[name] = JSON.parse(cache.index[name]);

    function paths(node, prefix, into) {
      for (var k in node) {
        if (k.charAt(0) === '$') continue;
        var child = node[k];
        if (!child || typeof child !== 'object') continue;
        var p = prefix ? prefix + '.' + k : k;
        if (child.$value !== undefined) into[p] = true; else paths(child, p, into);
      }
      return into;
    }
    function refs(node, into) {
      for (var k in node) {
        var child = node[k];
        if (k === '$value') {
          var stack = [child];
          while (stack.length) {
            var cur = stack.pop();
            if (typeof cur === 'string') { var m = /^\{(.+)\}$/.exec(cur); if (m) into.push(m[1]); }
            else if (cur && typeof cur === 'object') for (var j in cur) stack.push(cur[j]);
          }
        } else if (child && typeof child === 'object' && k.charAt(0) !== '$') refs(child, into);
      }
      return into;
    }

    var bad = [];
    for (var b = 0; b < cache.manifest.builds.length; b++) {
      var build = cache.manifest.builds[b];
      var defined = {}, used = [];
      for (var s = 0; s < build.sources.length; s++) {
        if (!parsed[build.sources[s]]) continue;
        paths(parsed[build.sources[s]], '', defined);
        refs(parsed[build.sources[s]], used);
      }
      for (var u = 0; u < used.length; u++)
        if (!defined[used[u]]) bad.push({ build: build.name, reference: used[u] });
    }
    return { builds: cache.manifest.builds.length, dangling: bad, ok: bad.length === 0 };
  }

  globalThis.snapshotVariables = snapshotVariables;
  globalThis.snapshotTextStyles = snapshotTextStyles;
  globalThis.snapshotEffectStyles = snapshotEffectStyles;
  globalThis.snapshotPaintStyles = snapshotPaintStyles;
  globalThis.exportTokens = exportTokens;
  globalThis.takeFile = takeFile;
  globalThis.verifyReferences = verifyReferences;
})();
