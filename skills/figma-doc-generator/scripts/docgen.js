/* docgen.js — the deterministic core of figma-doc-generator.
 *
 * PURE FUNCTIONS ONLY. Nothing here touches the `figma` global, a node, or the
 * network. That is the whole boundary: anything that needs a node is in
 * scripts/figma-helpers.js, which `node --check` can parse but no test can
 * exercise without a live file.
 *
 * Two consumers, one source:
 *   - node  — `require('./docgen.js')` for tests/test-docgen.js
 *   - Figma — paste the file into a figma_execute call; it defines DOCGEN and
 *             nothing else, so it is safe to prepend to any generating call.
 *
 * Written in ES5. NOT because the sandbox requires it — that was tested on
 * 2026-08-08 and it accepts modern syntax — but because this file already is,
 * and a file mixing two styles is worse than either. New scripts may differ.
 *
 * WHAT IS NOT HERE, DELIBERATELY:
 *   - intent checks. A detector hit is not a defect; deciding that is the
 *     agent's job (SKILL.md, governing lesson 3). A correctly hidden
 *     `_Title` whose child text still reports visible:true would be "fixed"
 *     by any script confident enough to try.
 *   - the questions (colour format, units, root size).
 *   - ruled deviations. A standing exception like "Value carries ranges, not
 *     literals" is re-applied AFTER fill, and the ruling itself lives in the
 *     project's context document, never here.
 */
globalThis.__DOCGEN_FACTORY = function () {
  'use strict';

  /* ---------------------------------------------------------------- sorting */

  // Leniency is load-bearing. parseFloat reads the leading number and discards
  // the rest, which is what sorts annotated ramp steps ("7 - anchor") into
  // position instead of flushing them past the end. A strict /^\d+$/ looks like
  // a cleanup and silently reorders every annotated scale.
  function parseNum(s) {
    if (s === 'Full') return Infinity;
    if (/^A\d+$/.test(s)) return parseInt(s.slice(1), 10);
    var n = parseFloat(String(s).replace(/_/g, '.'));
    return isNaN(n) ? null : n;
  }

  // Case-3 tiebreak. The base is EVERYTHING before the trailing number, not the
  // first "-" segment: splitting on "-" compares "blue-grey-3%" on "blue" and
  // misorders hyphenated bases. Bare bases sort before their steps.
  function baseCmp(a, b) {
    function split(s) {
      var m = String(s).match(/^(.*?)[\s\-_]*([0-9]+(?:\.[0-9]+)?)\s*%?$/);
      return m ? { b: m[1], t: parseFloat(m[2]) } : { b: String(s), t: null };
    }
    var A = split(a), B = split(b);
    if (A.b !== B.b) return A.b < B.b ? -1 : 1;
    if (A.t === null && B.t === null) return a < b ? -1 : (a > b ? 1 : 0);
    if (A.t === null) return -1;
    if (B.t === null) return 1;
    return A.t - B.t;
  }

  // Three cases, all required. Case 2 is the one that gets dropped, and its
  // absence zips solid and alpha ramps into one plausible-looking table.
  function smartSort(rows) {
    if (!rows.length) return rows;
    var rns = rows.map(function (r) { return r.rn; });

    if (rns.every(function (s) { return parseNum(s) !== null; }))
      return rows.slice().sort(function (a, b) { return parseNum(a.rn) - parseNum(b.rn); });

    if (rns.some(function (s) {
      var p = s.split('/');
      return p.length >= 2 && parseNum(p[p.length - 1]) !== null;
    })) {
      return rows.slice().sort(function (a, b) {
        var aN = parseNum(a.rn), bN = parseNum(b.rn);
        var aP = aN !== null, bP = bN !== null;
        if (aP && !bP) return -1;
        if (!aP && bP) return 1;
        if (aP && bP) return aN - bN;
        var ap = a.rn.split('/'), bp = b.rn.split('/');
        var apx = ap.slice(0, -1).join('/'), bpx = bp.slice(0, -1).join('/');
        if (apx !== bpx) return apx < bpx ? -1 : 1;
        return parseNum(ap[ap.length - 1]) - parseNum(bp[bp.length - 1]);
      });
    }

    return rows.slice().sort(function (a, b) {
      var aN = parseNum(a.rn.split('/').pop()), bN = parseNum(b.rn.split('/').pop());
      var aB = (aN === null), bB = (bN === null);
      if (aB && !bB) return -1;
      if (!aB && bB) return 1;
      if (aB && bB) return baseCmp(a.rn, b.rn);
      return aN - bN;
    });
  }

  // The font-weight names, as the parity engine's one table has them (tools/parity/values.mjs WEIGHTS, the DTCG
  // format's aliases): this file runs in Figma's sandbox, which imports nothing, so it keeps a copy that
  // tests/test-docgen.js holds to that table. Compared without spaces, hyphens or case, as the table is.
  var WEIGHT_RANK = {
    thin: 100, hairline: 100, extralight: 200, ultralight: 200, light: 300,
    regular: 400, normal: 400, book: 400, medium: 500, semibold: 600, demibold: 600,
    bold: 700, extrabold: 800, ultrabold: 800, black: 900, heavy: 900,
    extrablack: 950, ultrablack: 950
  };
  function weightRank(s) {
    var k = String(s).replace(/[\s_-]+/g, '').toLowerCase();
    return Object.prototype.hasOwnProperty.call(WEIGHT_RANK, k) ? WEIGHT_RANK[k] : undefined;
  }

  // Test order matters: numeric NAMES beat numeric VALUES (Spacing 0..18 must
  // sort by name or "0_5" lands wrong), and case2 is checked before the value
  // cases so alpha ramps do not interleave.
  function orderRows(rows) {
    if (!rows.length) return rows;
    var i, allNames = true, allNums = true, allW = true, case2 = false;
    for (i = 0; i < rows.length; i++) {
      if (parseNum(rows[i].rn) === null) allNames = false;
      if (typeof rows[i].val !== 'number') allNums = false;
      if (weightRank(rows[i].val) === undefined) allW = false;
      var p = rows[i].rn.split('/');
      if (p.length >= 2 && parseNum(p[p.length - 1]) !== null) case2 = true;
    }
    if (allNames) return rows.slice().sort(function (a, b) { return parseNum(a.rn) - parseNum(b.rn); });
    if (case2) return smartSort(rows);
    if (allNums) return rows.slice().sort(function (a, b) { return a.val - b.val; });
    if (allW) return rows.slice().sort(function (a, b) { return weightRank(a.val) - weightRank(b.val); });
    return smartSort(rows);
  }

  /* ------------------------------------------------- structure: names → pages */

  // A namespace can be MORE THAN ONE segment deep ("Colour/Palette/..."), so a
  // single-pass strip leaves the page as collapsed as no strip at all. Strip
  // repeatedly; stop when >1 distinct first segment remains (real grouping), or
  // when stripping would drop any name below one remaining segment. Defect 13.
  function stripNamespace(names) {
    var effs = names.slice(), strippedLast = null, stripped = [];
    for (;;) {
      var firsts = {}, minSeg = Infinity;
      effs.forEach(function (n) {
        var p = n.split('/');
        firsts[p[0]] = true;
        if (p.length < minSeg) minSeg = p.length;
      });
      var fk = Object.keys(firsts);
      if (fk.length !== 1 || minSeg < 2) break;
      strippedLast = fk[0];
      stripped.push(fk[0]);
      effs = effs.map(function (n) { return n.split('/').slice(1).join('/'); });
    }
    return { effs: effs, strippedLast: strippedLast, stripped: stripped };
  }

  // Depth rule. Run against the EFFECTIVE name (post stripNamespace), never the
  // raw one — it changes the depth of every name, which is the point.
  // The 1-segment case is real ("Colour/white" alongside "Colour/Grey/1" strips
  // to "white" alongside "Grey/1"); leaving it unhandled writes undefined into
  // the Name cell.
  function depthMap(eff, groupFallback) {
    var p = String(eff).split('/');
    if (p.length === 1) return { frameGroup: groupFallback, table: groupFallback, row: p[0] };
    if (p.length === 2) return { frameGroup: p[0], table: p[0], row: p[1] };
    return { frameGroup: p[0], table: p[1], row: p.slice(2).join('/') };
  }

  // Hide the _Title only when the table heading restates the frame group.
  function titleIsRedundant(tableName, frameGroupName) {
    return String(tableName).toLowerCase() === String(frameGroupName).toLowerCase();
  }

  // Frame numbering: one frame keeps the bare group name; several are
  // "{n} - {Group}", 1-based, alphabetical.
  function frameNames(groups) {
    var g = groups.slice().sort(function (a, b) {
      return String(a).toLowerCase() < String(b).toLowerCase() ? -1 : 1;
    });
    if (g.length === 1) return [{ group: g[0], name: g[0], index: 1 }];
    return g.map(function (name, i) {
      return { group: name, name: (i + 1) + ' - ' + name, index: i + 1 };
    });
  }

  // Step 3's parent-tier test for text styles. Depth QUALIFIES a segment as a
  // parent candidate; it does not confirm it. "Heading/Display/lg" throughout a
  // library clears the depth bar with Heading/Body on top, and those are
  // ordinary groups. Split unasked only when every candidate reads as a
  // platform; otherwise return 'ask'.
  function parentTierPlan(names) {
    if (!names.length) return { mode: 'flat', pages: ['Text styles'], strip: 0 };
    var depths = names.map(function (n) { return n.split('/').length; });
    var allDeep = depths.every(function (d) { return d >= 3; });
    var anyDeep = depths.some(function (d) { return d >= 3; });

    if (!allDeep) {
      return {
        mode: anyDeep ? 'mixed' : 'flat',
        pages: ['Text styles'],
        strip: 0,
        reason: anyDeep
          ? 'some styles sit under parents and some do not — one page, report the mixed structure'
          : 'a style at one or two segments means the top segments are ordinary groups'
      };
    }

    // Strip shared parents repeatedly, but only WHILE every remaining name keeps
    // >=3 segments. Two different reasons end the loop and they mean opposite
    // things: siblings appearing means apply the sibling test to what remains;
    // depth running out means the segments beneath are ordinary groups and the
    // stripped parents are the whole answer.
    var eff = names.slice(), parts = [], strip = 0, stoppedOnSiblings = false;
    for (;;) {
      var firsts = {};
      eff.forEach(function (n) { firsts[n.split('/')[0]] = true; });
      var fk = Object.keys(firsts);
      if (fk.length !== 1) { stoppedOnSiblings = true; break; }
      eff = eff.map(function (n) { return n.split('/').slice(1).join('/'); });
      parts.push(fk[0]); strip++;
      if (!eff.every(function (n) { return n.split('/').length >= 3; })) break;
    }

    var prefix = parts.length ? parts.join(' - ') + ' - ' : '';

    if (!stoppedOnSiblings) {
      // One shared parent (or a nest of them), promoted into the page name.
      // What remains are ordinary groups WITHIN that page, however many.
      return { mode: 'single-parent', pages: ['Text styles - ' + parts.join(' - ')], strip: strip };
    }

    var f2 = {};
    eff.forEach(function (n) { f2[n.split('/')[0]] = true; });
    var cands = Object.keys(f2).sort();
    var allPlatform = cands.every(function (c) { return platformish(c); });
    return {
      mode: allPlatform ? 'split' : 'ask',
      pages: cands.map(function (c) { return 'Text styles - ' + prefix + c; }),
      candidates: cands,
      strip: strip + 1
    };
  }

  /* ------------------------------------------- property keys and library order */

  // Property keys carry #id suffixes ("Label#0:1", "Label text#0:2"). Match on the
  // # BOUNDARY, never on a bare prefix: "Label" prefix-matches "Label text#0:2"
  // and hands a boolean to a TEXT property, which kills the whole call. Defect 17.
  // Extracted from keyFor so the rule itself is testable without a node.
  function matchesPropKey(k, name) {
    return k === name || String(k).indexOf(name + '#') === 0;
  }

  // Unique, in first-seen order. Effect and text styles come back in style-panel
  // order, which is the meaningful order the designer maintains (Raised, Floating,
  // Overlay, Modal). Alphabetising it destroys real information, so frame-group
  // order is derived from the array rather than sorted.
  function firstSeenOrder(values) {
    var seen = {}, out = [];
    for (var i = 0; i < values.length; i++) {
      if (seen[values[i]]) continue;
      seen[values[i]] = true;
      out.push(values[i]);
    }
    return out;
  }

  // Effect-style name -> frame group, table and whether the header takes a
  // subtitle. At most two group segments; the component renders the " / "
  // separator itself, so never include the slash in either half.
  // "Shadow/Base/Drop/very soft" -> group "Base / Drop", table "very soft".
  function splitEffectName(styleName) {
    var parts = String(styleName).split('/');
    var tableName = parts[parts.length - 1];
    var groupParts = parts.slice(0, -1).slice(-2);
    return {
      tableName: tableName,
      frameGroup: groupParts.join(' / '),
      hasSubtitle: groupParts.length === 2
    };
  }

  // Figma stores many numbers as float32, so read-back values carry noise
  // (lineHeight 110% comes back 110.00000238418579). Never use strict equality
  // on them in verification.
  function near(a, b) { return Math.abs(a - b) < 1e-4; }

  /* ------------------------------------------------------- label / prefix rules */

  // Drop a leading segment the enclosing frame already states. Strip ONLY when
  // every label shares it AND it equals the frame group, so the rule stays
  // derived rather than a hardcoded blocklist. Deliberately does not fire on
  // the Shadows page, where "Colour/Shadow/Cast/soft" sits in a frame called
  // "Elevation" and nothing else states the category.
  function redundantPrefix(labels, frameGroup) {
    if (!labels.length || !frameGroup) return null;
    var head = String(labels[0]).split('/')[0];
    if (head.toLowerCase() !== String(frameGroup).toLowerCase()) return null;
    for (var i = 0; i < labels.length; i++) {
      var p = String(labels[i]).split('/');
      if (p.length < 2 || p[0].toLowerCase() !== head.toLowerCase()) return null;
    }
    return head;
  }
  function stripPrefix(label, prefix) {
    if (!prefix) return label;
    var p = String(label).split('/');
    if (p.length > 1 && p[0].toLowerCase() === String(prefix).toLowerCase()) return p.slice(1).join('/');
    return label;
  }

  // As a STRING. Do not parseFloat — negative offsets like "-1" must survive.
  function lastSegment(path) { return String(path).split('/').pop(); }

  /* ------------------------------------------------------------ column mapping */

  var FIELD_BY_LABEL = {
    name: 'name', family: 'fontFamily', size: 'fontSize', weight: 'fontStyle',
    letterspacing: 'letterSpacing', tracking: 'letterSpacing', lineheight: 'lineHeight',
    // Qualified forms, listed EXPLICITLY rather than prefix-matched: a prefix
    // rule maps a future "Sizing" column onto fontSize and reports nothing.
    lineheightunitless: 'lineHeight', lineheightratio: 'lineHeight', lineheightcss: 'lineHeight',
    letterspacingem: 'letterSpacing', trackingem: 'letterSpacing', letterspacingcss: 'letterSpacing'
  };
  function norm(s) { return String(s).toLowerCase().replace(/[^a-z0-9]/g, ''); }

  // Returns the field per column plus the labels it did not recognise. Report
  // `unknown` rather than guessing what a new column means.
  function fieldsForLabels(labels) {
    var fieldFor = [], unknown = [];
    for (var i = 0; i < labels.length; i++) {
      var fld = FIELD_BY_LABEL[norm(labels[i])];
      fieldFor.push(fld || null);
      if (!fld) unknown.push(labels[i]);
    }
    return { fieldFor: fieldFor, unknown: unknown };
  }

  /* ------------------------------------------------------------- colour format */

  function round2(v) { return Math.round(v * 100) / 100; }

  // 2dp PERCENT, never whole. Rounding float32 alpha to whole percent moves 17
  // of the 24 steps of a two-mode 12-step ramp by 1/255 when composited — the
  // seam the colour system exists to prevent. Always padded ("3.00%").
  function alphaLabel(a) {
    var n = (typeof a === 'number') ? a : parseFloat(a);
    if (isNaN(n)) return null;
    return (Math.round(n * 1e4) / 100).toFixed(2) + '%';
  }

  function toHex(c, authoredAlpha) {
    function h(n) {
      var s = Math.round(n * 255).toString(16).toUpperCase();
      return s.length === 1 ? '0' + s : s;
    }
    var base = '#' + h(c.r) + h(c.g) + h(c.b);
    if (authoredAlpha) {
      var al = alphaLabel(authoredAlpha);
      if (al) return base + ' / ' + al;   // unparseable must not render "/ null"
    }
    return (c.a !== undefined && c.a < 0.99) ? base + ' / ' + alphaLabel(c.a) : base;
  }

  function canonOklch(s) {
    return s.replace(/\s+/g, ' ').replace(/\(\s/, '(').replace(/\s\)/, ')').toLowerCase();
  }

  // SINGLE-MODE ONLY: returns the FIRST match. Use oklchForMode on any
  // collection with more than one mode, or the Dark column fills with Light's
  // value — every cell populated, well-formed, silently wrong. Defect 14.
  function oklchFrom(desc) {
    if (!desc) return null;
    var m = String(desc).match(/oklch\(\s*[^()]*\)/i);
    return m ? canonOklch(m[0]) : null;
  }

  // Mode names are USER DATA. "Dark (AA)" builds a capture group and never
  // matches its own tag; "A+" over-matches. Either miss falls back to the first
  // untagged line — defect 14 rebuilt inside the reader. Escape in both readers.
  function escRe(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  function tagRe(nm) { return new RegExp('\\u00b7\\s*' + escRe(nm) + '(?![A-Za-z0-9])', 'i'); }
  function modeHeadingRe(nm) { return new RegExp('^\\s*' + escRe(nm) + '\\s*:?\\s*$', 'i'); }

  // Two description shapes occur and a reader handling only one silently falls
  // back to hex on the other. A: mode name alone on a line, heading a section.
  // B: inline "· dark" tags with the first mode left untagged.
  function pickLine(desc, modeName, allModes) {
    if (!desc) return null;
    var lines = String(desc).split('\n'), i, j;
    allModes = allModes || [modeName];

    var anyHeading = false, firstHeading = -1;
    for (i = 0; i < lines.length && !anyHeading; i++)
      for (j = 0; j < allModes.length; j++)
        if (modeHeadingRe(allModes[j]).test(lines[i])) { anyHeading = true; firstHeading = i; break; }

    if (anyHeading) {
      var capturing = false, buf = [];
      for (i = 0; i < lines.length; i++) {
        if (modeHeadingRe(modeName).test(lines[i])) { capturing = true; continue; }
        var other = false;
        for (j = 0; j < allModes.length; j++)
          if (modeHeadingRe(allModes[j]).test(lines[i])) { other = true; break; }
        if (other) { if (capturing) break; continue; }
        if (capturing && lines[i].trim()) buf.push(lines[i].trim());
      }
      if (buf.length) return buf.join(' ');
      // No section for this mode. Text above the FIRST heading is unlabelled
      // preamble and the only honest candidate — returning null here would fall
      // back to hex silently, which is what this reader exists to prevent.
      var pre = lines.slice(0, firstHeading).filter(function (l) { return l.trim(); });
      return pre.length ? pre.join(' ') : null;
    }

    for (i = 0; i < lines.length; i++) if (tagRe(modeName).test(lines[i])) return lines[i];
    for (i = 0; i < lines.length; i++) {
      var tagged = false;
      for (j = 0; j < allModes.length; j++) if (tagRe(allModes[j]).test(lines[i])) { tagged = true; break; }
      if (!tagged) return lines[i];
    }
    return null;
  }

  function oklchForMode(desc, modeName, allModes) {
    var ln = pickLine(desc, modeName, allModes);
    if (!ln) return null;
    var m = ln.match(/oklch\(\s*[^()]*\)/i);
    return m ? canonOklch(m[0]) : null;
  }

  // Alpha tokens use their own schema. Read values from the FIELDS, never off
  // the CSS head — the head carries a 2dp percent, the field full precision.
  function alphaSpecForMode(desc, modeName, allModes) {
    var ln = pickLine(desc, modeName, allModes);
    if (!ln) return null;
    var b = ln.match(/\bbase\s+(#[0-9A-Fa-f]{6})/);
    var a = ln.match(/\balpha\s+([\d.]+)/);
    if (!b || !a) return null;
    var to = ln.match(/\bcomposites to\s+([^\s\u00b7]+)/);
    return { base: b[1].toUpperCase(), alpha: a[1], compositesTo: to ? to[1] : null };
  }

  // Schema test only — never read a value off this.
  function isAlphaSchema(desc) {
    return !!(desc && /\bbase\s+#[0-9A-Fa-f]{6}/.test(String(desc)) && /\balpha\s+[\d.]+/.test(String(desc)));
  }

  // Buckets are exposed rather than module-private so a run can report them and
  // a test can assert them. resetBuckets() before each page.
  var buckets = { oklchMisses: [], alphaSchemaVars: [] };
  function resetBuckets() { buckets.oklchMisses = []; buckets.alphaSchemaVars = []; }

  // The ONE formatter for every raw COLOR literal. fmt is "hex" or "oklch",
  // fixed for the whole run.
  /*
   * A word THIS GENERATOR writes, in the project's dialect.
   *
   * Only the generator's own words — a column header, a caption. Never the
   * file's: token names, component names and descriptions are the project's
   * to spell, and respelling them would rewrite the library rather than
   * document it. A library whose convention is en-US had "Colour" written
   * into it by its own documentation run, which is what this is for.
   *
   * **NEVER AROUND A NAME THIS SKILL LOOKS UP.** The doc components are a
   * contract shared across projects, and one library that has otherwise moved
   * to en-US keeps `Table - Colour`, `Row - Colour` and `Colour matrix`
   * British for exactly that reason — its context document records the
   * exception. `ours("Table - Colour")` would ask an en-US project for a
   * component that does not exist, and the failure is a lookup returning
   * nothing rather than an error. It is applied in one place, the shadow
   * table's Colour column header, and that is the shape of every correct use:
   * a word drawn for a reader, not a handle.
   *
   * The dialect is set in the project's context document and nowhere else,
   * and reaches here as a prepended `LANGUAGE` constant, the way the audit
   * scanner receives `TOKENS`. Absent means en-GB.
   *
   * The map is this skill's own copy — a skill reads nothing outside its own
   * folder — of `tools/shared/dialect.cjs`, which owns the vocabulary. Short
   * on purpose: the words this generator actually writes, added when one is
   * found. A general dictionary would respell the project's own words the
   * first time one slipped through.
   */
  // held word for word to dialect.cjs's by tools/shared/test-dialect.mjs; the pattern is built from the map, so the two never part
  var US_WORDS = { Colour: 'Color', colour: 'color', Colours: 'Colors', colours: 'colors',
                   Behaviour: 'Behavior', behaviour: 'behavior', Grey: 'Gray', grey: 'gray',
                   Centre: 'Center', centre: 'center', Organisation: 'Organization', organisation: 'organization',
                   Licence: 'License', licence: 'license' };
  var US_RE = new RegExp('\\b(' + Object.keys(US_WORDS).join('|') + ')\\b', 'g');
  function ours(text) {
    var lang = (typeof LANGUAGE === 'string' && LANGUAGE) || 'en-GB';
    if (!text || String(lang).toLowerCase() !== 'en-us') return text;
    return String(text).replace(US_RE, function (w) { return US_WORDS[w] || w; });
  }

  // A literal that is not a colour. String(val) was the whole rule, and Figma's
  // motion types broke it: an EASING value is an object (the cell read
  // "[object Object]") and a TIMING value is stored in SECONDS, so `Duration/70`
  // read "0.07". Both are rendered in the form CSS takes: a duration in ms, an
  // easing as cubic-bezier() or its keyword.
  var EASING_KEYWORDS = { LINEAR: 'linear', EASE_IN: 'ease-in', EASE_OUT: 'ease-out', EASE_IN_AND_OUT: 'ease-in-out' };
  function literalLabel(val, type) {
    if (type === 'TIMING' && typeof val === 'number') return trimTo(val * 1000, 2) + 'ms';
    if (val && typeof val === 'object') {
      var b = val.easingFunctionCubicBezier;
      if (b) return 'cubic-bezier(' + [b.x1, b.y1, b.x2, b.y2].map(function (n) { return trimTo(n, 2); }).join(', ') + ')';
      if (val.type && EASING_KEYWORDS[val.type]) return EASING_KEYWORDS[val.type];
      if (val.type) return String(val.type).toLowerCase().replace(/_/g, '-');
      return JSON.stringify(val);                           // never "[object Object]"
    }
    return String(val);
  }

  function colourLabel(c, v, fmt, modeName, allModes) {
    var desc = v && v.description;
    var spec = modeName ? alphaSpecForMode(desc, modeName, allModes) : null;
    var authoredAlpha = spec ? spec.alpha : null;
    if (fmt !== 'oklch') return toHex(c, authoredAlpha);
    var o = modeName ? oklchForMode(desc, modeName, allModes) : oklchFrom(desc);
    if (!o) {
      // Chromatic alpha is AUTHORED as rgb(...) deliberately: its base is solved
      // per step in 8-bit sRGB and its hue drifts up to 23.8° from the scale's
      // own hue, so no nominal OKLCH exists and the generator refuses to assert
      // one. Render the authored rgb() verbatim. Authored beats derived.
      var rl = modeName ? pickLine(desc, modeName, allModes)
                        : (desc ? String(desc).split('\n')[0] : null);
      var rm = rl ? String(rl).match(/rgb\(\s*[^()]*\)/i) : null;
      if (rm) {
        if (v && v.name && buckets.alphaSchemaVars.indexOf(v.name) === -1)
          buckets.alphaSchemaVars.push(v.name);
        return canonOklch(rm[0]);
      }
      if (v && v.name) {
        var bucket = isAlphaSchema(desc) ? buckets.alphaSchemaVars : buckets.oklchMisses;
        if (bucket.indexOf(v.name) === -1) bucket.push(v.name);
      }
      return toHex(c, authoredAlpha);
    }
    if (o.indexOf('/') === -1 && c && c.a !== undefined && c.a < 0.99)
      o = o + ' / ' + alphaLabel(authoredAlpha || c.a);
    return o;
  }

  // Report have/total, then alphaOnly and missing SEPARATELY. Never call
  // alphaOnly missing — those descriptions are filled in and the user can see
  // it, so saying otherwise costs trust in the rest of the report.
  function oklchCoverage(colls) {
    var total = 0, have = 0, alphaOnly = [], missing = [];
    for (var i = 0; i < colls.length; i++)
      for (var j = 0; j < colls[i].vars.length; j++) {
        var v = colls[i].vars[j];
        if (v.resolvedType !== 'COLOR') continue;
        total++;
        if (oklchFrom(v.description)) have++;
        else if (isAlphaSchema(v.description)) alphaOnly.push(v.name);
        else missing.push(v.name);
      }
    return { total: total, have: have, alphaOnly: alphaOnly, missing: missing };
  }

  /* --------------------------------------------------------------- type units */

  function num(v) { return (v === undefined || v === null) ? '-' : String(Math.round(v * 100) / 100); }

  function unitText(o) {
    if (!o || o.unit === 'AUTO') return 'Auto';
    if (o.unit === 'PERCENT') return round2(o.value) + '%';
    if (o.unit === 'PIXELS') return round2(o.value) + 'px';
    return 'Auto';
  }

  var WEB_GROUPS = {
    web: 1, webapp: 1, appweb: 1, www: 1, website: 1,
    desktopweb: 1, webdesktop: 1, responsiveweb: 1, webplatform: 1, platformweb: 1
  };
  var PLATFORM_GROUPS = {
    mobile: 1, mobileapp: 1, app: 1, apps: 1, ios: 1, iphone: 1, ipad: 1, android: 1,
    desktop: 1, desktopapp: 1, native: 1, nativeapp: 1, print: 1, email: 1,
    watch: 1, watchos: 1, tv: 1, tvos: 1, tablet: 1, kiosk: 1, embedded: 1, terminal: 1, cli: 1
  };
  function platformish(segment) {
    var n = norm(segment);
    return !!(WEB_GROUPS[n] || PLATFORM_GROUPS[n]);
  }

  // true = convert, false = leave as authored, null = AMBIGUOUS, ask.
  // The null case exists so "Webinar" cannot quietly match "web".
  function webGroupState(segment) {
    if (!segment) return null;
    var n = norm(segment);
    if (WEB_GROUPS[n]) return true;
    if (n.indexOf('web') !== -1) return null;
    return false;
  }

  // Round AFTER dividing — pre-rounding 0.125% to 0.13 then dividing loses a
  // digit the 4dp form would have kept.
  function trimTo(v, dp) {
    var f = Math.pow(10, dp);
    return String(Math.round(v * f) / f);
  }

  function cssLineHeight(o, fontSize) {
    if (!o || o.unit === 'AUTO') return 'Auto';
    if (o.unit === 'PERCENT') return trimTo(o.value / 100, 3);
    if (o.unit === 'PIXELS') return fontSize ? trimTo(o.value / fontSize, 3) : round2(o.value) + 'px';
    return 'Auto';
  }

  function cssLetterSpacing(o, fontSize) {
    if (!o) return '0em';
    if (o.unit === 'PERCENT') return trimTo(o.value / 100, 4) + 'em';
    if (o.unit === 'PIXELS') return fontSize ? trimTo(o.value / fontSize, 4) + 'em' : round2(o.value) + 'px';
    return '0em';
  }

  // UNLIKE em, rem is NOT scale-invariant: Figma's percent is relative to the
  // FONT size, rem to the ROOT, so one authored -1% is a different rem at every
  // size it is used at. Callers key rows by (value, size), never by value alone,
  // and must never pass fontSize = root "to keep the list short".
  function cssLetterSpacingRem(o, fontSize, rootSize) {
    if (!o || !fontSize || !rootSize) return null;
    if (o.unit === 'PERCENT') return trimTo((o.value / 100) * fontSize / rootSize, 6) + 'rem';
    if (o.unit === 'PIXELS') return trimTo(o.value / rootSize, 6) + 'rem';
    return null;
  }

  function unitTextFor(field, o, fontSize, web) {
    if (field === 'letterSpacing' && !o) return web ? '0em' : '0%';
    if (!web) return unitText(o);
    if (field === 'lineHeight') return cssLineHeight(o, fontSize);
    if (field === 'letterSpacing') return cssLetterSpacing(o, fontSize);
    return unitText(o);
  }

  // Distinct authored metrics, taking ONLY unbound fields — a bound field has a
  // token and belongs to the alias rule. scaleDependent = true (rem) keys by
  // value AND size; false (em/unitless/as-authored) by value alone. Getting
  // this backwards is defect 19.
  function metricRows(styles, field, scaleDependent) {
    var seen = {}, rows = [];
    for (var i = 0; i < styles.length; i++) {
      var s = styles[i];
      // Two shapes: a live style carries boundVariables, a snapshot style
      // (stylesFromSnapshot, the recipes' input since 1.16.0) carries `bound`.
      // Reading only the first let every bound field of a snapshot style through
      // as a "not a variable" row.
      if ((s.boundVariables && s.boundVariables[field]) || (s.bound && s.bound[field])) continue;
      var o = s[field];
      if (!o || o.value === undefined) continue;
      var v = round2(o.value);
      if (v === 0) {
        if (!seen['0']) { seen['0'] = true; rows.push({ value: v, unit: o.unit, size: null }); }
        continue;
      }
      // the unit is in the key: 24% and 24px are different rows, and folding the
      // PIXELS one into the PERCENT one hides it from the pixels guard.
      var k = o.unit + ':' + v + (scaleDependent ? '@' + s.fontSize : '');
      if (seen[k]) continue;
      seen[k] = true;
      rows.push({ value: v, unit: o.unit, size: scaleDependent ? s.fontSize : null });
    }
    return rows;
  }

  // Size-keyed rows must SHOW the size, or two rows read as duplicates.
  function metricRowName(row) {
    var head = round2(row.value) + (row.unit === 'PERCENT' ? '%' : 'px');
    if (row.value === 0) return head + ' @ any size';
    return row.size ? head + ' @ ' + row.size + 'px' : head;
  }

  // Row label for a Step 2.2 metric table. These took their unit from an
  // enclosing closure when they lived in recipes.md, which is exactly why they
  // could not be tested — the unit is now a parameter.
  // A value-keyed PIXELS row has no font size, so unitless and em cannot convert
  // it (24px read as 24% renders 0.24): null, and the caller refuses the table.
  function lineHeightLabel(row, unit) {
    if (unit === 'unitless' && row.unit === 'PIXELS' && row.value !== 0) return null;
    return (unit === 'unitless') ? trimTo(row.value / 100, 3)
                                 : unitText({ unit: row.unit, value: row.value });
  }
  function letterSpacingLabel(row, unit, rootSize) {
    if (unit === 'em' && row.unit === 'PIXELS' && row.value !== 0) return null;
    if (unit === 'em') return cssLetterSpacing({ unit: row.unit, value: row.value });
    if (unit === 'rem') return row.value === 0 ? '0rem'
      : cssLetterSpacingRem({ unit: row.unit, value: row.value }, row.size, rootSize);
    return unitText({ unit: row.unit, value: row.value });
  }

  /* ------------------------------------------------- verification (failures.md) */

  // Defect 16's detector. `cells` are ONE frame group's literal cells for one
  // field, as {text, alias}. Within a group every literal takes one form; across
  // groups they may differ, which is the feature. Authored forms end in % or px
  // (a px line-height is as-authored too, so it must not count as converted);
  // converted forms are a bare number (line-height) or em/rem (letter-spacing).
  // Auto has no CSS equivalent and is neither; an alias cell is a token name.
  function unitFormMix(cells, field) {
    var out = { authored: 0, converted: 0, other: 0, mixed: false };
    var conv = field === 'letterSpacing' ? /^-?\d+(\.\d+)?r?em$/ : /^-?\d+(\.\d+)?$/;
    for (var i = 0; i < cells.length; i++) {
      var c = cells[i], t = String(c.text == null ? '' : c.text).trim();
      if (c.alias || t === 'Auto') continue;
      if (/^-?\d+(\.\d+)?(%|px)$/.test(t)) out.authored++;
      else if (conv.test(t)) out.converted++;
      else out.other++;
    }
    out.mixed = out.authored > 0 && out.converted > 0;
    return out;
  }

  // Defect 19's detector. Under rem a Step 2.2 letter-spacing table has one row
  // per (value, size) pair; one row per authored value means it was collapsed
  // as though every style sat at the root size. Counts come from metricRows, so
  // the zero row (size-independent) is counted the same way it is rendered.
  function remRowVerdict(styles, renderedRows) {
    var byPair = metricRows(styles, 'letterSpacing', true).length;
    var byValue = metricRows(styles, 'letterSpacing', false).length;
    var verdict = renderedRows === byPair ? 'ok'
                : renderedRows === byValue ? 'collapsed' : 'mismatch';
    return { expected: byPair, byValue: byValue, rendered: renderedRows, verdict: verdict };
  }

  function shadowType(t) {
    return t === 'DROP_SHADOW' ? 'Drop shadow'
      : t === 'INNER_SHADOW' ? 'Inner shadow'
        : 'Background blur';
  }

  /* --------------------------------------------------------------- width ladder */

  // Rungs are per COMPONENT, not per library, and came from the doc library's
  // own table sizes. 1024 has never been observed in use — last resort, not a
  // working rung. Confirm against the doc library rather than assuming.
  var RUNGS = [860, 996, 1024];

  // Estimation only. The MEASUREMENT that feeds this must come from a different
  // call than the resize it judges — resize() does not reflow synchronously, so
  // a same-call reading looks exactly like a real defect.
  function nextRung(current) {
    for (var i = 0; i < RUNGS.length; i++) if (RUNGS[i] > current) return RUNGS[i];
    return null;
  }

  // After the ladder settles, every table in a frame takes the widest one's
  // width. Never down (re-clips what the ladder just fixed), never across
  // frames (a Values frame at 996 beside a Samples frame at 720 is correct).
  function normaliseWidths(widths) {
    if (widths.length < 2) return widths.slice();
    var max = 0;
    widths.forEach(function (w) { if (Math.round(w) > max) max = Math.round(w); });
    return widths.map(function () { return max; });
  }

  // A text box that runs past its cell, in px (0 when it fits). The pill
  // detector: an alias pill hugs its label and is clipped by the cell, so its
  // text node is exactly its intrinsic width and wrapsOrClips never sees it.
  function boxOverflow(textBox, cellBox) {
    if (!textBox || !cellBox) return 0;
    var o = (textBox.x + textBox.width) - (cellBox.x + cellBox.width);
    return o > 0.5 ? o : 0;
  }

  // The mode of a collection whose name matches a column's mode, else its
  // first: a Light column pins every collection in the chain to Light.
  function modeIdByName(modes, name) {
    for (var i = 0; i < modes.length; i++) if (modes[i].name === name) return modes[i].modeId;
    return modes.length ? modes[0].modeId : null;
  }

  // The collection to pin for a variable of collection `collId` on a page that
  // documents `docColl`: an extension stands in for its parent, so the brand's
  // overrides are the values the swatch shows.
  function pinTarget(collId, docColl) {
    return docColl && docColl.isExtension && docColl.parentVariableCollectionId === collId ? docColl.id : collId;
  }

  // Integrity hash for the load protocol, whitespace removed so the engine
  // reformatting a cached source is not a false alarm while truncation and
  // substitution still are. FNV-1a: short, dependency-free, guards a
  // transcription rather than an adversary.
  // Shared implementation, pasted into three skills (figma-doc-generator's docgen.js, figma-properties-table's
  // properties-table.js and figma-components-audit's probes.js), which run in Figma's sandbox, where nothing is
  // imported; tools/toolkit-check/test-paste-hash.mjs holds the three to one answer.
  // Hash the CODE, not the prose. Comments are 6,667 of the 24,330 characters
  // an agent must transcribe exactly, and none of them execute; counting them
  // made the gate reject functionally correct pastes over a reworded sentence.
  // A state machine rather than a regex, because a regex cannot tell a comment
  // from "//" inside a string or a slash inside a regex literal.
  function stripComments(src) {
    var s = String(src), out = '', i = 0, n = s.length, j;
    var tpl = [], depth = 0; // the brace depth at each open `${`, innermost last
    var regexAfter = /[(,=:[!&|?{};+\-*%<>~^]$/;
    var kw = /(^|[^\w$])(return|typeof|case|in|of|delete|void|throw|new|else|do)$/;
    while (i < n) {
      var c = s.charAt(i), d = s.charAt(i + 1);
      if (c === '/' && d === '/') { while (i < n && s.charAt(i) !== '\n') i++; continue; }
      if (c === '/' && d === '*') { j = s.indexOf('*/', i + 2); i = j < 0 ? n : j + 2; out += ' '; continue; }
      if (c === '"' || c === "'") {
        j = i + 1; while (j < n && s.charAt(j) !== c) { if (s.charAt(j) === '\\') j++; j++; }
        out += s.slice(i, j + 1); i = j + 1; continue;
      }
      // a template literal, and its text again after each `${…}` closes, so a `//` in either is kept
      if (c === '`' || (c === '}' && tpl.length && tpl[tpl.length - 1] === depth)) {
        if (c === '}') tpl.pop();
        j = i + 1;
        while (j < n && s.charAt(j) !== '`') {
          if (s.charAt(j) === '\\') { j += 2; continue; }
          if (s.charAt(j) === '$' && s.charAt(j + 1) === '{') { tpl.push(depth); j += 2; break; }
          j++;
        }
        var closed = s.charAt(j) === '`';
        out += s.slice(i, closed ? j + 1 : j); i = closed ? j + 1 : j;
        continue;
      }
      // a slash opens a regex after an operator or a keyword (`return /x/`), and is division after a value
      if (c === '/') {
        var before = out.replace(/\s+$/, '');
        if (before === '' || regexAfter.test(before) || kw.test(before)) {
          j = i + 1; var cls = false;
          while (j < n) {
            var r = s.charAt(j);
            if (r === '\\') { j += 2; continue; }
            if (r === '[') cls = true; else if (r === ']') cls = false;
            else if (r === '/' && !cls) break;
            j++;
          }
          j++; while (j < n && /[a-z]/i.test(s.charAt(j))) j++;
          out += s.slice(i, j); i = j; continue;
        }
      }
      if (c === '{') depth++;
      if (c === '}') depth--;
      out += c; i++;
    }
    return out;
  }

  function srcHash(s) {
    var h = 0x811c9dc5, t = stripComments(s).replace(/\s+/g, '');
    for (var i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    return ('0000000' + h.toString(16)).slice(-8);
  }

  /* ------------------------------------------------ styles from the snapshot */
  // The Shadows and Text styles pages read the project's stored snapshot, the
  // one reader of the file every output shares; until 1.16.0 the source file
  // was read a second time, live, by snapshotEffectStyles/snapshotTextStyles.
  // This returns exactly the shape those returned, so the recipes did not move.

  // `#rrggbb`, `#rrggbbaa`, `rgb(r g b / a)`, `rgba(r, g, b, a)` -> Figma's
  // {r,g,b,a} 0-1. Named for its output: design-code-parity's parseColour
  // reads the same spellings and returns [r,g,b,a] with r in 0-255. A skill
  // may not call another skill's scripts, so figma-token-export carries the
  // same converter; the duplicate is structural, the shared name was not.
  function figmaRgba(s) {
    var str = String(s).trim(), m = str.match(/^#([0-9a-f]{6})([0-9a-f]{2})?$/i);
    if (m) {
      var n = parseInt(m[1], 16);
      return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255, a: m[2] ? parseInt(m[2], 16) / 255 : 1 };
    }
    m = str.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:\s*[\/,]\s*([\d.]+%?))?\s*\)$/i);
    if (!m) return null;
    var a = m[4] === undefined ? 1 : /%$/.test(m[4]) ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
    return { r: +m[1] / 255, g: +m[2] / 255, b: +m[3] / 255, a: a };
  }

  function stylesFromSnapshot(tokens) {
    var ts = tokens.textStyles || [], fx = tokens.effects || [];
    // A snapshot from before plugin 0.27.0 has no authored units and no style
    // keys: documenting from it would show converted units and apply no style.
    var old = ts.filter(function (s) { return !s.authored || !s.key; }).concat(fx.filter(function (e) { return !e.key; }));
    if (old.length) throw new Error('the snapshot predates plugin 0.27.0 (' + old.length + ' styles without authored units or a key, e.g. ' + old[0].name + '): take a new snapshot first');
    var name = function (b) { return b && b.name ? b.name : undefined; };
    var names = function (pairs, bound) {
      var out = {};
      for (var i = 0; i < pairs.length; i++) { var v = name((bound || {})[pairs[i][1]]); if (v) out[pairs[i][0]] = v; }
      return out;
    };
    return {
      textStyles: ts.map(function (s) {
        return { name: s.name, key: s.key, fontSize: s.size, family: s.family, style: s.weight,
          lineHeight: s.authored.lineHeight, letterSpacing: s.authored.letterSpacing,
          bound: names([['fontFamily', 'fontFamily'], ['fontSize', 'fontSize'], ['fontStyle', 'fontWeight'], ['lineHeight', 'lineHeight'], ['letterSpacing', 'letterSpacing']], s.bound) };
      }),
      effectStyles: fx.map(function (e) {
        return { name: e.name, key: e.key, effects: (e.layers || []).map(function (l) {
          return { type: l.type, x: l.x, y: l.y, radius: l.blur, spread: l.spread,
            color: l.color ? figmaRgba(l.color) : null,
            bound: names([['offsetX', 'x'], ['offsetY', 'y'], ['radius', 'blur'], ['spread', 'spread'], ['color', 'color']], l.bound) };
        }) };
      })
    };
  }

  /* -------------------------------------------------------------- verification */
  // Step 5's queries (references/failures.md, *Verification queries*) as one
  // pass over a page read back by scripts/verify.js — plain data, so tested here.
  // `expect` is what the recipe meant to build: every recipe stores it on the
  // page it builds (plugin data `dg.expect`). A check that needs it and has none
  // is listed in `notRun`, never reported clean (*Verify over every row*).
  // Whether a hit is a defect stays the agent's (governing lesson 3): this finds
  // and counts, it fixes nothing.
  var VERIFY_CHROME = { cornerRadius: 40, cornerSmoothing: 0.6, padding: 160, itemSpacing: 64 };
  var VERIFY_WORDS = ['Label', 'Title', 'Subcomponent', 'Heading', 'Subheading'];

  function frameGroupOf(name) { return String(name).replace(/^\d+ - /, ''); }

  function verifyDoc(snap, expect) {
    var issues = [], notRun = [], fallbacks = [];
    var counts = { frames: 0, tables: 0, badged: 0, rows: 0, cells: 0, aliasCells: 0, boundSwatches: 0 };
    function say(check, where, problem) { issues.push({ check: check, where: where, problem: problem }); }
    function close(a, b, tol) { return typeof a === 'number' && Math.abs(a - b) <= tol; }

    // Structure: strays, chrome (F6: float32, never ===), numbering, layer order.
    var frames = [];
    (snap.children || []).forEach(function (c) {
      if (c.type === 'FRAME') frames.push(c);
      else say('structure', c.name, 'a ' + c.type + ' on the page, not a frame (defect 7: a leaked probe)');
    });
    frames.reverse();                              // the layers panel lists bottom-up: frame 1 is last
    counts.frames = frames.length;
    frames.forEach(function (f, i) {
      var C = VERIFY_CHROME;
      if (!close(f.cornerRadius, C.cornerRadius, 1e-3)) say('structure', f.name, 'cornerRadius ' + f.cornerRadius + ', not ' + C.cornerRadius);
      if (!close(f.cornerSmoothing, C.cornerSmoothing, 1e-3)) say('structure', f.name, 'cornerSmoothing ' + f.cornerSmoothing + ', not ' + C.cornerSmoothing);
      (f.padding || []).forEach(function (p) { if (!close(p, C.padding, 1e-3)) say('structure', f.name, 'padding ' + p + ', not ' + C.padding); });
      if (!close(f.itemSpacing, C.itemSpacing, 1e-3)) say('structure', f.name, 'itemSpacing ' + f.itemSpacing + ', not ' + C.itemSpacing);
      var m = /^(\d+) - /.exec(f.name);
      if (m && Number(m[1]) !== i + 1) say('structure', f.name, 'numbered ' + m[1] + ' but is frame ' + (i + 1) + ' in the layers panel');
    });

    var exFrames = expect && expect.frames;
    if (!exFrames) notRun.push('coverage', 'row order', 'library order', 'header labels', 'alias coverage', 'headings');
    else {
      var gotF = frames.map(function (f) { return f.name; }), wantF = exFrames.map(function (f) { return f.name; });
      if (gotF.join('\n') !== wantF.join('\n')) say('structure', snap.page, 'frames read ' + JSON.stringify(gotF) + ', expected ' + JSON.stringify(wantF));
    }
    if (!expect || expect.fmt === undefined) notRun.push('colour format');   // null: a page with no colour

    // F5, F10: a placeholder word that is the intended text is not a placeholder.
    var excused = {};
    (exFrames || []).forEach(function (f) {
      excused[f.group] = true;
      (f.tables || []).forEach(function (t) {
        excused[t.heading] = true;
        (t.rows || []).forEach(function (r) { excused[r.name] = true; });
        (t.samples || []).forEach(function (s) { excused[s] = true; });
      });
    });
    frames.forEach(function (f) { excused[frameGroupOf(f.name)] = true; });

    frames.forEach(function (f) {
      var ef = null;
      (exFrames || []).forEach(function (x) { if (x.name === f.name) ef = x; });
      var group = ef ? ef.group : frameGroupOf(f.name);

      (f.placeholders || []).forEach(function (p) {
        if (!excused[p.text]) say('placeholders', f.name, 'renders "' + p.text + '" (' + p.id + ')');
      });

      // F11: badged tables (Step 2.2) map to no variable — counted apart, never covered.
      var tables = [];
      (f.tables || []).forEach(function (t) { if (t.badge) counts.badged++; else tables.push(t); });
      counts.tables += tables.length;

      // Widths: one per frame after the ladder (F1: sample tables excluded).
      var widths = [];
      tables.forEach(function (t) {
        if (t.samples) return;
        var seen = false;
        widths.forEach(function (w) { if (close(t.width, w, 0.5)) seen = true; });
        if (!seen) widths.push(t.width);
      });
      if (widths.length > 1) say('widths', f.name, widths.length + ' table widths in one frame: ' + widths.join(', '));

      var exTables = ef ? (ef.tables || []) : null;
      if (exTables && exTables.length !== tables.length) say('coverage', f.name, tables.length + ' tables, expected ' + exTables.length);

      tables.forEach(function (t, ti) {
        var et = exTables ? exTables[ti] : null;
        var where = f.name + ' / ' + (t.titleVisible ? t.heading : (et ? et.heading : '#' + (ti + 1)));

        if (et) {
          // Headings by position (defect 11); a hidden _Title only where it restates the group.
          if (t.titleVisible && t.heading !== et.heading) say('library order', where, 'heading reads "' + t.heading + '", expected "' + et.heading + '"');
          if (!t.titleVisible && !titleIsRedundant(et.heading, group)) say('headings', where, '_Title hidden but "' + et.heading + '" is not the frame group');
          if (et.headers && (t.headers || []).join('\n') !== et.headers.join('\n'))
            say('header labels', where, 'header reads ' + JSON.stringify(t.headers) + ', expected ' + JSON.stringify(et.headers));
        }

        if (t.samples) {
          if (et && et.samples && t.samples.join('\n') !== et.samples.join('\n'))
            say('coverage', where, 'samples read ' + JSON.stringify(t.samples) + ', expected ' + JSON.stringify(et.samples));
          return;
        }

        var bound = [], aliasPerRow = [];
        (t.rows || []).forEach(function (row, ri) {
          counts.rows++;
          var aliasN = 0;
          (row.cells || []).forEach(function (c, ci) {
            counts.cells++;
            var at = where + ' row ' + (ri + 1) + ' col ' + (ci + 1);
            if (c.content === 'Alias') {
              counts.aliasCells++; aliasN++;
              if (c.pill !== c.label) say('alias integrity', at, 'pill reads "' + c.pill + '", cell "' + c.label + '" (defect 2)');
              if (c.swatchOn && c.swatchVar && c.swatchVar !== c.label) say('swatch bindings', at, 'swatch bound to ' + c.swatchVar + ', label names ' + c.label);
            }
            if (c.rendered === '') say('placeholders', at, 'renders nothing');
            else if (VERIFY_WORDS.indexOf(c.rendered) !== -1 && !excused[c.rendered]) say('placeholders', at, 'renders "' + c.rendered + '"');
            if (c.swatchOn && c.swatchVar) { bound.push(c.swatchVar); counts.boundSwatches++; }
            if (expect && expect.fmt && c.content !== 'Alias' && c.swatchOn) {
              var isHex = /^#[0-9A-F]{6}([0-9A-F]{2})?( \/ \d+(\.\d+)?%)?$/i.test(c.label), isOk = /^oklch\(/i.test(c.label), isRgb = /^rgba?\(/i.test(c.label);
              // isHex takes toHex's translucent form too ("#RRGGBB / 50.00%"): the generator's own label is never a format defect
              if (expect.fmt === 'oklch' && isHex) fallbacks.push(at + ': ' + c.label);   // name it in the report (defect 8)
              else if (expect.fmt === 'hex' && !isHex) say('colour format', at, '"' + c.label + '" in a hex run');
              else if (expect.fmt === 'oklch' && !isOk && !isRgb) say('colour format', at, '"' + c.label + '" in an oklch run');
            }
          });
          aliasPerRow.push(aliasN);
        });
        // Defect 1: every swatch still on the component's placeholder (F2: swatch-off cells skipped).
        var distinct = {};
        bound.forEach(function (b) { distinct[b] = true; });
        if (bound.length > 1 && Object.keys(distinct).length === 1) say('swatch bindings', where, 'all ' + bound.length + ' swatches bound to ' + bound[0] + ' (defect 1)');

        if (!et || !et.rows) return;
        var names = (t.rows || []).map(function (r) { return r.cells && r.cells[0] ? r.cells[0].rendered : ''; });
        var want = et.rows.map(function (r) { return r.name; });
        var tally = {};
        names.forEach(function (n) { tally[n] = (tally[n] || 0) + 1; });
        want.forEach(function (n) { tally[n] = (tally[n] || 0) - 1; });
        var off = Object.keys(tally).filter(function (n) { return tally[n] !== 0; });
        if (off.length) { say('coverage', where, off.map(function (n) { return '"' + n + '" ' + (tally[n] > 0 ? '+' : '') + tally[n]; }).join(', ') + ' (rendered minus expected)'); return; }
        var dev = 0;
        names.forEach(function (n, i) { if (n !== want[i]) dev++; });
        if (dev) say('row order', where, dev + ' of ' + want.length + ' rows out of place (defects 3, 11)');
        et.rows.forEach(function (r, i) {
          if (typeof r.alias === 'number' && names[i] === r.name && aliasPerRow[i] !== r.alias)
            say('alias coverage', where + ' row ' + (i + 1), aliasPerRow[i] + ' alias cells, ' + r.alias + ' bound fields (defect 4)');
        });
      });
    });

    var verdict = issues.length ? 'issues' : (notRun.length ? 'partial' : 'clean');
    return { verdict: verdict, issues: issues, notRun: notRun, fallbacks: fallbacks, counts: counts };
  }

  /* -------------------------------------------------------------------- export */

  var api = {
    parseNum: parseNum, baseCmp: baseCmp, smartSort: smartSort,
    weightRank: weightRank, orderRows: orderRows, WEIGHT_RANK: WEIGHT_RANK,
    stripNamespace: stripNamespace, depthMap: depthMap,
    matchesPropKey: matchesPropKey, firstSeenOrder: firstSeenOrder,
    splitEffectName: splitEffectName, near: near,
    titleIsRedundant: titleIsRedundant, frameNames: frameNames,
    parentTierPlan: parentTierPlan,
    redundantPrefix: redundantPrefix, stripPrefix: stripPrefix, lastSegment: lastSegment,
    FIELD_BY_LABEL: FIELD_BY_LABEL, norm: norm, fieldsForLabels: fieldsForLabels,
    round2: round2, alphaLabel: alphaLabel, toHex: toHex, canonOklch: canonOklch,
    oklchFrom: oklchFrom, escRe: escRe, tagRe: tagRe, modeHeadingRe: modeHeadingRe,
    pickLine: pickLine, oklchForMode: oklchForMode, alphaSpecForMode: alphaSpecForMode,
    isAlphaSchema: isAlphaSchema, colourLabel: colourLabel, oklchCoverage: oklchCoverage,
    ours: ours,
    buckets: buckets, resetBuckets: resetBuckets,
    num: num, unitText: unitText, platformish: platformish, webGroupState: webGroupState,
    WEB_GROUPS: WEB_GROUPS, PLATFORM_GROUPS: PLATFORM_GROUPS,
    trimTo: trimTo, cssLineHeight: cssLineHeight, cssLetterSpacing: cssLetterSpacing,
    cssLetterSpacingRem: cssLetterSpacingRem, unitTextFor: unitTextFor,
    metricRows: metricRows, metricRowName: metricRowName, shadowType: shadowType,
    lineHeightLabel: lineHeightLabel, letterSpacingLabel: letterSpacingLabel,
    unitFormMix: unitFormMix, remRowVerdict: remRowVerdict,
    RUNGS: RUNGS, nextRung: nextRung, normaliseWidths: normaliseWidths,
    boxOverflow: boxOverflow, modeIdByName: modeIdByName, pinTarget: pinTarget,
    srcHash: srcHash, stripComments: stripComments, literalLabel: literalLabel,
    stylesFromSnapshot: stylesFromSnapshot,
    verifyDoc: verifyDoc, VERIFY_CHROME: VERIFY_CHROME, VERIFY_WORDS: VERIFY_WORDS
  };
  globalThis.DOCGEN = api;
  return api;
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = globalThis.__DOCGEN_FACTORY();
  // node scripts/docgen.js --styles <snapshot tokens.json>
  // prints the styles the Shadows and Text styles recipes take, as JSON to
  // hand to the target file's call.
  if (require.main === module && process.argv[2] === '--styles') {
    var styles = module.exports.stylesFromSnapshot(JSON.parse(require('fs').readFileSync(process.argv[3], 'utf8')));
    process.stdout.write(JSON.stringify(styles) + '\n');
  }
}

// Self-cache: store this factory's own source so later calls bootstrap from
// plugin data instead of the agent re-sending the pure core. Only Figma runs this;
// node loads the file to compute the expected hash.
if (typeof figma !== 'undefined') {
  globalThis.__DOCGEN_FACTORY();
  var __s = globalThis.__DOCGEN_FACTORY.toString();
  // The hash GATES the write. Reporting it afterwards would be too late: a
  // corrupt transcription would already be cached and reused by every later
  // session. Set globalThis.__DG_EXPECT to the matching line from
  // `node scripts/hash.js` and a bad paste is refused instead of persisted.
  var __e = globalThis.__DG_EXPECT && globalThis.__DG_EXPECT['dg.docgen.v1'];
  var __ok = !__e || (typeof DOCGEN !== 'undefined' && DOCGEN.srcHash(__s) === __e);
  if (__ok) figma.root.setPluginData('dg.docgen.v1', __s);
  globalThis.__DG_CACHED = Object.assign(globalThis.__DG_CACHED || {}, { 'dg.docgen.v1': __ok });
}
