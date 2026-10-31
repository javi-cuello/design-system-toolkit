/**
 * properties-table.js — Figma Properties table generator.
 *
 * PASTE THIS ONCE PER FILE, EVER. It caches its own source into the document's
 * plugin data, so every later call — this session or any future one — loads it
 * with the two-line bootstrap below instead of another 33KB paste:
 *
 *   if (typeof PT === 'undefined') { var s = figma.root.getPluginData('pt.src.v1');
 *     if (s) (0, eval)('(' + s + ')')(); }
 *
 * Then drive it with:
 *
 *   PT.rows({...})          load the rows, printed by `node tools/component-contract/contract-rows.mjs`
 *                           from the components' contracts in the stored snapshot
 *   PT.profile()            learn this file's scaffolding (once per file, persisted)
 *   PT.pages()              pages that have a Properties table
 *   PT.plan('page name')    dry run, returns proposed rows, writes nothing
 *   PT.apply()              generate, resumable, returns {done, remaining}
 *   PT.audit()              verify output + report component-hygiene findings
 *
 * Why a named factory rather than a bare IIFE: a function can hand back its own
 * source via toString(), which is what lets the script cache itself. An IIFE
 * cannot, so the agent would have to re-transmit the whole file every session —
 * expensive, and unverifiable, since nothing downstream can tell a faithful
 * 33KB transcription from a subtly corrupted one.
 *
 * The load returns `sourceHash`. Compare it against `node scripts/hash.js`
 * before trusting a first paste: equal means the bytes that reached the file
 * are the bytes on disk. Whitespace is normalised out, so reformatting by the
 * engine is not a false alarm, while truncation and substitution still are.
 *
 * Nothing about a specific file is hardcoded. The scaffolding is discovered by
 * profile(); every row's content comes from the component's contract, loaded
 * with PT.rows(). This script only draws.
 */
globalThis.__PT_FACTORY = function () {
  const PT = {};
  const CFG_KEY = 'pt.config.v2';
  const SCHEMA = 4; // bump when the config shape changes; forces a re-profile
  const QUEUE_KEY = 'pt.queue.v2';

  // A variant's name as its prop values, as the toolkit's one reader has it (tools/shared/names.js variantValues;
  // this runs in Figma, which imports nothing, so tests/test-properties-table.js holds this copy to that one).
  const variantValues = (name) => Object.fromEntries(String(name ?? '').split(/,\s*/).filter((p) => p.includes('=')).map((p) => { const i = p.indexOf('='); return [p.slice(0, i).trim(), p.slice(i + 1).trim()]; }));
  PT.variantValues = variantValues;

  // Resolve a component property id from its human-readable name. Ids carry a
  // "#0:7" suffix that changes whenever the library is republished; the prefix
  // does not. Never store or compare full ids.
  const pid = (node, name) => {
    const src = node.componentProperties || node.componentPropertyDefinitions || {};
    return Object.keys(src).find(k => k.split('#')[0].toLowerCase() === String(name).toLowerCase());
  };
  const nameOf = key => String(key).split('#')[0];
  // A title shows a component's name without its leading status marker, when the
  // config records one (`statusMarker`, set from the project's settings with
  // setConfig): the marker is a status, not part of the name. Without one,
  // names are shown as they stand.
  // The marker leads the name or follows the private prefix (`_🚧 Picker`, figma-standard rule 13).
  const shown = name => { const m = ((PT.config && PT.config()) || {}).statusMarker; const n = String(name); const at = m ? n.indexOf(m) : -1; return at >= 0 && !/[\p{L}\p{N}]/u.test(n.slice(0, at)) ? n.slice(0, at) + n.slice(at + m.length).trimStart() : n; };

  // A broken instance layer can throw "does not exist" on any read of its
  // children, name or parent, and one throw used to end a whole audit. Every
  // read of an arbitrary node goes through `safe`; what it cannot read it
  // skips and counts, and the public calls return the count as `unreadable`.
  // Only "does not exist" is caught: any other error is a fault in this script
  // or in Figma, and swallowing it would count a healthy node as unreadable.
  let unreadable = 0;
  const GONE = /does not exist/;
  const gone = e => GONE.test(String(e && e.message || e));
  const safe = (fn, fallback) => { try { return fn(); } catch (e) { if (!gone(e)) throw e; unreadable++; return fallback; } };
  const kids = n => safe(() => ('children' in n ? n.children : []), []);
  // Figma's own findAll throws as a whole when its traversal meets such a
  // layer, so the fallback is a walk that skips it.
  const walkAll = (node, test) => {
    const out = [];
    const step = (n) => { for (const c of kids(n)) { if (safe(() => test(c), false)) out.push(c); step(c); } };
    step(node);
    return out;
  };
  const descendants = (node, test) => {
    if (typeof node.findAll !== 'function') return [];
    try { return node.findAll(n => safe(() => test(n), false)); }
    catch (e) { if (!gone(e)) throw e; return walkAll(node, test); }
  };
  const firstSlot = (node, slotName) =>
    descendants(node, n => n.type === 'SLOT').find(n => !slotName || n.name === slotName);
  // The table's rows slot: of the slots with its name, the first whose rows
  // carry cells. A table can hold another slot of that name with none, and
  // writing or counting rows there is wrong. With no rows anywhere, an empty
  // slot of the name is the rows slot before one holding something else.
  const rowsSlot = (table, cfg) => {
    const named = descendants(table, n => n.type === 'SLOT' && n.name === cfg.rowsSlotName);
    return named.find(sl => kids(sl).some(r => safe(() => r.type, null) === 'INSTANCE' && cellsOf(r, cfg.cellTextProp).length))
      || named.find(sl => !kids(sl).length) || named[0];
  };

  // ---------------------------------------------------------------- discovery

  const componentsOn = (page) => {
    const out = [];
    const walk = (n) => {
      const type = safe(() => n.type, null);
      if (type === 'COMPONENT_SET') { out.push(n); return; }
      if (type === 'COMPONENT' && safe(() => !n.parent || n.parent.type !== 'COMPONENT_SET', false)) { out.push(n); return; }
      kids(n).forEach(walk);
    };
    walk(page);
    return out;
  };


  // A row is an instance holding several cell instances, each exposing exactly
  // one TEXT property. That shape is what we look for, rather than any name.
  //
  // Only the outermost matches count. A cell can itself contain an instance
  // that fits the same description, a badge or an icon with a label, and
  // counting that as a fifth column silently shifts every value one place to
  // the left. Depth is the difference between a column and a column's contents.
  const cellsOf = (row, textPropName) => {
    const hits = descendants(row, n => n.type === 'INSTANCE' && (
      textPropName ? pid(n, textPropName)
                   : Object.values(n.componentProperties || {}).filter(p => p.type === 'TEXT').length === 1
    ));
    const inside = (node, ancestor) => safe(() => {
      for (let p = node.parent; p; p = p.parent) if (p === ancestor) return true;
      return false;
    }, false);
    return hits.filter(h => !hits.some(other => other !== h && inside(h, other)));
  };


  // Candidates are found by shape, then scored. A documentation table recurs on
  // nearly every page and has a handful of columns; a data-table example on one
  // page can look identical structurally, so frequency and column count settle it.
  PT.detect = async (opts = {}) => {
    const budget = opts.budgetMs || 14000, started = Date.now();
    const candidates = new Map();
    let scanned = 0, truncated = false;

    for (const page of figma.root.children) {
      if (Date.now() - started > budget) { truncated = true; break; }
      await page.loadAsync();
      scanned++;
      let slots;
      try { slots = page.findAllWithCriteria({ types: ['SLOT'] }); }
      catch (e) { if (!gone(e)) throw e; slots = descendants(page, n => n.type === 'SLOT'); }

      const seenHere = new Set();
      for (const slot of slots) {
        if (!slot.children.length) continue;
        let node = slot, outer = null;
        while (node.parent) { if (node.parent.type === 'INSTANCE') outer = node.parent; node = node.parent; }
        if (!outer || seenHere.has(outer.name)) continue;
        const rows = slot.children.filter(r => r.type === 'INSTANCE');
        if (rows.length < 2) continue;
        const cells = cellsOf(rows[0]);
        if (cells.length < 3) continue;
        seenHere.add(outer.name);
        const rec = candidates.get(outer.name)
          || { name: outer.name, pages: new Set(), sample: outer, sampleSlot: slot, slotName: slot.name, cells: cells.length };
        rec.pages.add(page.name);
        candidates.set(outer.name, rec);
      }
    }

    const scored = [...candidates.values()].map(c => ({
      rec: c,
      pageCount: c.pages.size,
      score: c.pages.size * 10 + (c.cells >= 3 && c.cells <= 8 ? 20 : 0)
    })).sort((a, b) => b.score - a.score);
    if (!scored.length) return null;

    const best = scored[0].rec;
    const inst = best.sample;
    // The slot the scan measured, not the first of its name: a table can hold
    // another slot of that name with no cells in it.
    const slot = best.sampleSlot;
    const rows = slot.children.filter(r => r.type === 'INSTANCE');
    const cells = cellsOf(rows[0]);
    const textProp = Object.entries(cells[0].componentProperties).find(([, v]) => v.type === 'TEXT');
    if (!textProp) return null;

    const main = await inst.getMainComponentAsync();
    const set = main && main.parent && main.parent.type === 'COMPONENT_SET' ? main.parent : null;

    // A cell may carry more than its text: a display variant, a swatch toggle.
    // Rows are grown by cloning an existing row, so anything a person set by
    // hand on the donor propagates. Record the cell component's own defaults
    // and restore them on write, so a property row always renders as plain text.
    let cellResetProps = [];
    const cellMain = await cells[0].getMainComponentAsync();
    const cellOwner = cellMain && cellMain.parent && cellMain.parent.type === 'COMPONENT_SET' ? cellMain.parent : cellMain;
    if (cellOwner) {
      cellResetProps = Object.entries(cellOwner.componentPropertyDefinitions || {})
        .filter(([, d]) => d.type === 'VARIANT' || d.type === 'BOOLEAN')
        .map(([k, d]) => ({ name: nameOf(k), type: d.type, value: d.defaultValue }));
    }

    let titleNode = null;
    for (const child of inst.children) {
      if (child.type !== 'INSTANCE') continue;
      if (Object.values(child.componentProperties || {}).some(p => p.type === 'TEXT')) { titleNode = child; break; }
    }

    // The empty state: a variant axis on the table whose other variant has no slot.
    let emptyProp = null, emptyValue = null, filledValue = null;
    if (set) {
      const axis = Object.entries(inst.componentProperties).find(([, v]) => v.type === 'VARIANT');
      if (axis) {
        const key = axis[0];
        for (const variant of set.children) {
          const has = !!firstSlot(variant);
          const val = variantValues(variant.name)[key];
          if (val === undefined) continue;
          if (has) filledValue = filledValue || val; else emptyValue = emptyValue || val;
        }
        if (emptyValue && filledValue) emptyProp = key;
      }
    }

    const cfg = {
      tableName: inst.name,
      rowsSlotName: slot.name,
      columns: cells.length,
      cellTextProp: nameOf(textProp[0]),
      cellResetProps,
      titleNodeName: titleNode ? titleNode.name : null,
      titleTextProp: null,
      labelTextProp: null,
      labelBoolProp: null,
      emptyProp: emptyProp ? nameOf(emptyProp) : null,
      emptyValue, filledValue,
      learnedFrom: [...best.pages][0],
      seenOnPages: best.pages.size,
      scannedPages: scanned,
      scanTruncated: truncated,
      rejected: scored.slice(1, 4).map(s => s.rec.name + ' (' + s.pageCount + 'pp, ' + s.rec.cells + ' cells)')
    };

    if (titleNode) {
      const props = titleNode.componentProperties;
      const boolKey = Object.entries(props).find(([, v]) => v.type === 'BOOLEAN');
      cfg.labelBoolProp = boolKey ? nameOf(boolKey[0]) : null;

      // The title and the subcomponent label are both TEXT, so type alone cannot
      // separate them. The title holds the documented component's name: resolve
      // by value against the components on the page it was learned from.
      const texts = Object.entries(props).filter(([, v]) => v.type === 'TEXT');
      const page = figma.root.children.find(p => p.name === cfg.learnedFrom);
      await page.loadAsync();
      // Before a first profile no status marker is set, so a leading one (an
      // emoji, a symbol) is also read past here: `Time input` titles `🚧 Time input`.
      const names = componentsOn(page).flatMap(c => [c.name, shown(c.name), c.name.replace(/^[^\p{L}\p{N}_\[]+/u, '')]);
      const boolName = cfg.labelBoolProp ? cfg.labelBoolProp.toLowerCase() : null;
      let chosen = texts.find(([, v]) => names.includes(String(v.value)));
      if (!chosen && boolName) chosen = texts.find(([k]) => !nameOf(k).toLowerCase().startsWith(boolName));
      if (!chosen) chosen = texts[0];
      if (chosen) {
        cfg.titleTextProp = nameOf(chosen[0]);
        cfg.titleResolvedBy = names.includes(String(chosen[1].value)) ? 'value match' : 'name heuristic';
        const other = texts.find(([k]) => k !== chosen[0]);
        cfg.labelTextProp = other ? nameOf(other[0]) : null;
      }
    }
    return cfg;
  };

  PT.config = () => {
    const raw = figma.root.getPluginData(CFG_KEY);
    if (!raw) return null;
    const cfg = JSON.parse(raw);
    // A config written by an older script may not mean what this one expects.
    // Discard it rather than acting on stale assumptions.
    return cfg.schema === SCHEMA ? cfg : null;
  };

  PT.profile = async (opts = {}) => {
    if (!opts.force) {
      const existing = PT.config();
      if (existing) return { cached: true, config: existing };
    }
    const cfg = await PT.detect();
    if (!cfg) return { error: 'No properties table found. Detection needs one table whose rows slot holds at least two row instances, each with at least three cells. Build one by hand, then re-profile.' };
    cfg.schema = SCHEMA;
    // Seen on one page, its title naming no component there: what was found is
    // a component's own instance, not a documentation table. A file with no
    // properties table produced exactly this. Nothing is stored; PT.setConfig
    // stores it when a person has read it and says it is the table.
    if (cfg.seenOnPages === 1 && cfg.titleResolvedBy !== 'value match') {
      const kept = PT.config() ? 'the stored config is unchanged' : 'nothing was stored';
      return { error: 'What was found on ' + cfg.learnedFrom + ' (' + cfg.tableName + ') is on one page and its title names no component there (a placeholder title, or none, reads the same), so it is probably not a properties table; ' + kept + '. Build one by hand and re-profile, or, if it is the table, PT.setConfig(config).', config: cfg };
    }
    // A re-profile re-detects the scaffolding and keeps what the project set:
    // the status marker is a project setting, not something detection finds.
    const prev = (() => { try { return JSON.parse(figma.root.getPluginData(CFG_KEY) || '{}'); } catch (e) { return {}; } })();
    if (prev.statusMarker) cfg.statusMarker = prev.statusMarker;
    figma.root.setPluginData(CFG_KEY, JSON.stringify(cfg));
    return { cached: false, config: cfg };
  };

  PT.setConfig = (patch) => {
    const cfg = Object.assign({}, PT.config() || {}, patch);
    figma.root.setPluginData(CFG_KEY, JSON.stringify(cfg));
    return cfg;
  };

  // ------------------------------------------------------------- page reading

  const tablesOn = (page, cfg) => {
    let found;
    try { found = page.findAllWithCriteria({ types: ['INSTANCE'] }).filter(n => safe(() => n.name === cfg.tableName, false)); }
    catch (e) { if (!gone(e)) throw e; found = descendants(page, n => n.type === 'INSTANCE' && n.name === cfg.tableName); }
    // No shape-based fallback here on purpose. If the named table is absent the
    // page is skipped. Matching "anything table-shaped" would sooner or later
    // find a data-table example and overwrite its cells with property rows.
    return found;
  };

  // Which component a page is about is a judgement, so it is made from signals
  // that belong to Figma rather than to any one file's naming habits:
  //
  //   1. the page name, matched against the component name in full or against
  //      it followed by a separator, since files namespace differently
  //   2. containment: a component instantiated inside a sibling on the same
  //      page is a part of that sibling, whatever either of them is called
  //
  // Tree order breaks what remains, and among parts it is the author's own
  // arrangement, which is better evidence than anything inferable here. A file
  // that follows neither convention still gets a stable answer, and says so
  // through primaryGuessed.
  const norm = s => String(s).replace(/^[^\p{L}\p{N}]+/u, '').trim().toLowerCase();

  // A namespace is the page name followed by a separator, whatever that
  // separator happens to be: "Top bar / Modal", "Dropdown menu - Multiple
  // selection", "Sidebar (Primary)". Naming the separators a file may use would
  // be guessing, so any non-alphanumeric character counts, and the page name
  // must match in full to rule out a component that merely starts similarly.
  const owns = (page, comp) => {
    const target = norm(page.name);
    if (!target) return false;
    const name = norm(comp.name);
    if (name === target) return true;
    return name.startsWith(target) && /[^\p{L}\p{N}]/u.test(name.charAt(target.length));
  };

  // Every variant is scanned, not just one. A part is often swapped in by a
  // single variant and absent from the rest: an open state, a vertical layout,
  // a hug-width cell. Reading only the first variant silently demotes exactly
  // those parts, and they are the ones most worth documenting. The cost of
  // reading them all is small, because the budget is spent on resolving
  // instances rather than on walking the tree.
  //
  // The cap is divided across a set's variants rather than spent on the first,
  // so a component with many variants samples all of them instead of exhausting
  // its budget before it reaches the interesting ones. A scan that runs out of
  // time returns null: unknown, rather than a wrong answer dressed as a known one.
  const containedComponents = async (comps, opts = {}) => {
    const budgetMs = opts.budgetMs || 6000;
    const cap = opts.cap || 800;
    const started = Date.now();
    const own = new Set(comps.map(c => c.id));
    const used = new Set();
    for (const c of comps) {
      if (Date.now() - started > budgetMs) return null;
      const variants = c.type === 'COMPONENT_SET' ? c.children : [c];
      const per = Math.max(20, Math.floor(cap / Math.max(1, variants.length)));
      const insts = [];
      for (const v of variants) insts.push(...descendants(v, n => n.type === 'INSTANCE').slice(0, per));
      // a main that "does not exist" is a broken instance, counted; any
      // other error ends the audit (it used to read as "no main component")
      const mains = await Promise.all(insts.map(i => i.getMainComponentAsync().catch(e => { if (!gone(e)) throw e; unreadable++; return null; })));
      for (const m of mains) {
        if (!m) continue;
        const holder = m.parent && m.parent.type === 'COMPONENT_SET' ? m.parent : m;
        if (holder.id !== c.id && own.has(holder.id)) used.add(holder.id);
      }
    }
    return used;
  };

  const orderComponents = async (page, comps, opts = {}) => {
    const used = comps.length > 1 ? await containedComponents(comps, opts) : new Set();
    // Two signals, not three. An earlier version also demoted components Figma
    // hides from the assets panel, which sounded reasonable and turned out to
    // do nothing except reorder parts against the arrangement their author
    // chose. Containment already decides what leads; among parts, the file's
    // own order is better evidence than a naming convention.
    const rank = c => (owns(page, c) ? 0 : 2) + (used && used.has(c.id) ? 1 : 0);
    const ordered = comps
      .map((c, i) => ({ c, i, r: rank(c) }))
      .sort((a, b) => a.r - b.r || a.i - b.i)
      .map(x => x.c);
    // A miss means nothing on the page carries the page's name, so the primary
    // rests on the weaker signals alone. Usually right, but it also catches a
    // page name and a component name that have drifted apart, which is worth
    // fixing at source.
    return {
      ordered,
      contained: used,
      primaryGuessed: !comps.some(c => owns(page, c)),
      containmentScanned: used !== null
    };
  };

  // ------------------------------------------------------------- row content

  // The rows come from the component's contract in the project's stored
  // snapshot (tools/component-contract/contract-rows.mjs, run in node), never from the file: the
  // snapshot is the one reader of a Figma file. PT.rows() keeps them in the
  // document's plugin data, one entry per component, keyed by its key and
  // name, so a resumable apply() finds them on every later call.
  const ROWS_KEY = 'pt.rows.v1:';
  PT.rows = (map) => {
    let n = 0;
    for (const [id, e] of Object.entries(map || {})) {
      const text = JSON.stringify({ name: e.name, key: e.key || null, rows: e.rows });
      if (e.key) figma.root.setPluginData(ROWS_KEY + e.key, text);
      figma.root.setPluginData(ROWS_KEY + (e.name || id), text);
      n++;
    }
    return { loaded: n };
  };
  const rowsFor = (comp) => {
    for (const k of [comp.key, comp.name]) {
      if (!k) continue;
      const s = figma.root.getPluginData(ROWS_KEY + k);
      if (s) return JSON.parse(s).rows;
    }
    return null;
  };
  const noRows = (comps) => comps.filter(c => !rowsFor(c)).map(c => c.name);

  // ------------------------------------------------------------------ writing

  const loadFonts = async (node) => {
    const seen = new Set();
    for (const t of descendants(node, n => n.type === 'TEXT')) {
      const key = JSON.stringify(t.fontName);
      if (t.fontName && t.fontName.family && !seen.has(key)) { seen.add(key); await figma.loadFontAsync(t.fontName); }
    }
  };

  // Write only what differs. Setting a VARIANT property rebuilds the instance
  // subtree even when the value is unchanged, which on a page with several
  // tables costs more than everything else combined. Skipping unchanged values
  // also makes a re-run over an already-correct file effectively free, so the
  // script is safe to run repeatedly.
  const setIfChanged = (node, key, value) => {
    if (!key) return 0;
    const current = node.componentProperties[key];
    if (current && String(current.value) === String(value)) return 0;
    node.setProperties({ [key]: value });
    return 1;
  };

  const writeTable = async (table, comp, isSub, rows, cfg, donor) => {
    let writes = 0;
    let fontsLoaded = false;
    const ensureFonts = async () => { if (!fontsLoaded) { await loadFonts(table); fontsLoaded = true; } };

    if (cfg.emptyProp) {
      // Empty state before any row work: trimming rows to zero would otherwise
      // leave exactly the blank table the empty variant exists to prevent.
      writes += setIfChanged(table, pid(table, cfg.emptyProp), rows.length ? cfg.filledValue : cfg.emptyValue);
    }

    if (cfg.titleNodeName && cfg.titleTextProp) {
      const titleNode = table.children.find(c => c.name === cfg.titleNodeName)
        || descendants(table, n => n.type === 'INSTANCE' && n.name === cfg.titleNodeName)[0];
      if (titleNode) {
        const tk = pid(titleNode, cfg.titleTextProp);
        if (tk && String(titleNode.componentProperties[tk].value) !== shown(comp.name)) await ensureFonts();
        writes += setIfChanged(titleNode, tk, shown(comp.name));
        if (cfg.labelBoolProp) writes += setIfChanged(titleNode, pid(titleNode, cfg.labelBoolProp), isSub);
      }
    }

    if (!rows.length) return writes;
    // Named only. A table's header row can itself be built on a slot, and the
    // header sits above the rows, so an unnamed fallback finds the wrong one
    // and writes property rows over the column headings.
    const slot = rowsSlot(table, cfg);
    if (!slot) return writes;

    if (slot.children.length !== rows.length) {
      await ensureFonts();
      while (slot.children.length < rows.length) {
        const source = slot.children[0] || donor;
        if (!source) break;
        slot.appendChild(source.clone());
        writes++;
      }
      while (slot.children.length > rows.length) { slot.children[slot.children.length - 1].remove(); writes++; }
    }

    const plan = rows.map((row, i) => {
      const target = slot.children[i];
      if (!target) return null;
      const cells = cellsOf(target, cfg.cellTextProp);
      return row.values.map((val, j) => {
        const cell = cells[j];
        if (!cell) return null;
        const key = pid(cell, cfg.cellTextProp);
        if (!key) return null;
        const changed = String(cell.componentProperties[key].value) !== String(val);
        const resets = (cfg.cellResetProps || []).map(r => {
          const k = pid(cell, r.name);
          if (!k) return null;
          const cv = cell.componentProperties[k];
          return cv && String(cv.value) !== String(r.value) ? { k, v: r.value } : null;
        }).filter(Boolean);
        return { cell, key, val, changed, resets };
      });
    });
    if (plan.some(r => r && r.some(c => c && c.changed))) await ensureFonts();
    for (const row of plan) {
      if (!row) continue;
      for (const c of row) {
        if (!c) continue;
        if (c.changed) { c.cell.setProperties({ [c.key]: c.val }); writes++; }
        for (const r of c.resets) { c.cell.setProperties({ [r.k]: r.v }); writes++; }
      }
    }
    return writes;
  };

  // ------------------------------------------------------------- entry points

  const preparePage = async (pageName, cfg) => {
    const page = figma.root.children.find(p => p.name === pageName);
    if (!page) return { page: pageName, skipped: 'no such page' };
    await page.loadAsync();
    const tables = tablesOn(page, cfg);
    if (!tables.length) return { page: pageName, skipped: 'no properties table' };
    const comps = componentsOn(page);
    if (!comps.length) return { page: pageName, skipped: 'no components' };
    const ord = await orderComponents(page, comps);
    // A table is labelled a subcomponent because something on the page contains
    // it, not because it is second in a list. Sibling families sit side by side
    // as peers and none of them is a part of another. Position is only the
    // fallback for when the containment scan could not finish.
    const isSub = ord.contained
      ? (comp => ord.contained.has(comp.id))
      : ((comp, i) => i > 0);
    return {
      page, tables, comps: ord.ordered, isSub,
      primaryGuessed: ord.primaryGuessed,
      containmentScanned: ord.containmentScanned
    };
  };

  PT.pages = async () => {
    const cfg = PT.config();
    if (!cfg) return { error: 'Run PT.profile() first.' };
    const out = [];
    for (const page of figma.root.children) {
      await page.loadAsync();
      if (tablesOn(page, cfg).length) out.push(page.name);
    }
    return out;
  };

  PT.plan = async (pageName) => {
    const cfg = PT.config();
    if (!cfg) return { error: 'Run PT.profile() first.' };
    const prep = await preparePage(pageName, cfg);
    if (prep.skipped) return prep;
    // A component with no rows from its contract is not drawn from the file
    // instead: the page waits for a snapshot (tools/component-contract/contract-rows.mjs, then PT.rows).
    const missing = noRows(prep.comps);
    if (missing.length) return { page: pageName, skipped: 'no rows from a stored contract for ' + missing.join(', ') + ': take a snapshot, then load its rows with PT.rows()' };
    return {
      page: pageName,
      primaryGuessed: prep.primaryGuessed,
      containmentScanned: prep.containmentScanned,
      tables: prep.comps.map((comp, i) => ({
        component: comp.name,
        subcomponent: prep.isSub(comp, i),
        rows: rowsFor(comp)
      }))
    };
  };

  PT.applyPage = async (pageName) => {
    const cfg = PT.config();
    if (!cfg) return { error: 'Run PT.profile() first.' };
    unreadable = 0;
    const prep = await preparePage(pageName, cfg);
    if (prep.skipped) return prep;
    // A component with no rows from its contract is not drawn from the file
    // instead: the page waits for a snapshot (tools/component-contract/contract-rows.mjs, then PT.rows).
    const missing = noRows(prep.comps);
    if (missing.length) return { page: pageName, skipped: 'no rows from a stored contract for ' + missing.join(', ') + ': take a snapshot, then load its rows with PT.rows()' };
    const { page, comps } = prep;
    let tables = prep.tables;
    const section = tables[0].parent;

    while (tables.length < comps.length) {
      const clone = tables[0].clone();
      section.appendChild(clone);
      tables.push(clone);
    }
    while (tables.length > comps.length) tables.pop().remove();

    // A row is grown by cloning one that already exists. A page whose table is
    // currently in its empty state has none to clone, and switching it to the
    // filled state produces an empty slot rather than a template row, so
    // without a donor from elsewhere the page would silently gain a filled
    // table with no rows in it.
    let donor = tables
      .map(t => rowsSlot(t, cfg))
      .filter(s => s && s.children.length)
      .map(s => s.children[0])[0];

    if (!donor) {
      for (const other of figma.root.children) {
        if (other.id === page.id) continue;
        await other.loadAsync();
        donor = tablesOn(other, cfg)
          .map(t => rowsSlot(t, cfg))
          .filter(s => s && s.children.length)
          .map(s => s.children[0])[0];
        if (donor) break;
      }
    }

    const report = [];
    for (let i = 0; i < comps.length; i++) {
      const rows = rowsFor(comps[i]);
      const sub = prep.isSub(comps[i], i);
      const writes = await writeTable(tables[i], comps[i], sub, rows, cfg, donor);
      report.push({
        component: comps[i].name,
        subcomponent: sub,
        rows: rows.length,
        writes,
        notes: rows.filter(r => r.values[3] !== '-').map(r => r.values[0] + ': ' + r.values[3])
      });
    }
    return { page: pageName, primaryGuessed: prep.primaryGuessed, containmentScanned: prep.containmentScanned, tables: report, unreadable };
  };

  // Resumable so a long file can't be lost to an execution timeout.
  PT.apply = async (opts = {}) => {
    const cfg = PT.config();
    if (!cfg) return { error: 'Run PT.profile() first.' };
    const budget = opts.budgetMs || 9000;
    const started = Date.now();

    let queue;
    if (opts.pages) queue = opts.pages.slice();
    else {
      const saved = figma.root.getPluginData(QUEUE_KEY);
      queue = (saved && !opts.restart) ? JSON.parse(saved) : await PT.pages();
    }

    const done = [];
    while (queue.length && Date.now() - started < budget) {
      const name = queue.shift();
      try { done.push(await PT.applyPage(name)); }
      catch (e) { done.push({ page: name, error: String(e && e.message || e) }); }
    }
    // Only a full-file run owns the saved queue. An ad-hoc page list is a
    // one-off and must not overwrite a resumable run that is half finished.
    if (!opts.pages) figma.root.setPluginData(QUEUE_KEY, JSON.stringify(queue));
    return {
      done: queue.length === 0,
      processed: done.length,
      remaining: queue.length,
      results: done.map(r => ({
        page: r.page,
        skipped: r.skipped,
        error: r.error,
        tables: r.tables && r.tables.map(t => t.component + ' (' + t.rows + ')'),
        notes: r.tables ? [].concat(...r.tables.map(t => t.notes || [])) : undefined
      }))
    };
  };

  // opts.labels: also hold each table's subcomponent label to containment, as plan() would
  // set it (a containment scan per page, so off by default: the check before a first apply()
  // over a file documented by hand asks for it).
  PT.audit = async (opts = {}) => {
    const cfg = PT.config();
    if (!cfg) return { error: 'Run PT.profile() first.' };
    unreadable = 0;
    const problems = [], orderDisagreements = [], labelsUnchecked = [];
    let pages = 0, tables = 0, rows = 0;

    for (const page of figma.root.children) {
      await page.loadAsync();
      const found = tablesOn(page, cfg);
      const comps = componentsOn(page);

      for (const comp of comps) {
        if (comp.type !== 'COMPONENT_SET') continue;
        const defs = comp.componentPropertyDefinitions || {};
        const vmap = comp.children.map(v => variantValues(v.name));
        for (const [k, d] of Object.entries(defs)) {
          if (d.type !== 'VARIANT') continue;
          const api = d.variantOptions || [];
          const canvas = [];
          for (const m of vmap) { const v = m[k]; if (v && !canvas.includes(v)) canvas.push(v); }
          if (canvas.join() !== api.join()) {
            orderDisagreements.push({ component: comp.name, axis: k, stored: api.join('/'), grid: canvas.join('/') });
          }
        }
      }

      if (!found.length) continue;
      pages++;
      tables += found.length;
      const ord = opts.labels && cfg.labelBoolProp ? await orderComponents(page, comps) : null;
      if (ord && !ord.containmentScanned) labelsUnchecked.push(page.name);
      if (found.length !== comps.length) {
        problems.push(page.name + ': ' + found.length + ' tables vs ' + comps.length + ' components');
      }
      for (const t of found) {
        const titleNode = kids(t).find(c => safe(() => c.name === cfg.titleNodeName, false));
        const tk = titleNode && pid(titleNode, cfg.titleTextProp);
        const title = tk ? titleNode.componentProperties[tk].value : null;
        if (!title) problems.push(page.name + ': table with no title');
        else if (comps.some(c => c.name === title && shown(c.name) !== title)) problems.push(page.name + ': title "' + title + '" carries the status marker');
        else if (!comps.some(c => shown(c.name) === title)) problems.push(page.name + ': title "' + title + '" matches no component');

        if (ord && ord.contained && titleNode) {
          const lk = pid(titleNode, cfg.labelBoolProp);
          const labelled = comps.find(c => shown(c.name) === title);
          if (lk && labelled) {
            const has = titleNode.componentProperties[lk].value === true, want = ord.contained.has(labelled.id);
            if (has !== want) problems.push(page.name + '/' + title + ': labelled ' + (has ? 'a subcomponent' : 'a component') + ', but containment makes it ' + (want ? 'a subcomponent' : 'a component'));
          }
        }

        const ek = cfg.emptyProp && pid(t, cfg.emptyProp);
        const isEmpty = ek ? t.componentProperties[ek].value === cfg.emptyValue : false;
        const slot = rowsSlot(t, cfg);
        const n = isEmpty ? 0 : (slot ? kids(slot).length : -1);
        rows += Math.max(0, n);
        if (!isEmpty && n === 0) problems.push(page.name + '/' + title + ': empty table not using the empty variant');
        // The rows must name the properties the component's contract holds: a
        // renamed property leaves a well-formed table that no other check sees.
        const comp = title && comps.find(c => shown(c.name) === title);
        const stored = comp && rowsFor(comp);
        if (comp && slot && !isEmpty && !stored) problems.push(page.name + '/' + title + ': no rows from a stored contract to compare with; take a snapshot and load them with PT.rows()');
        if (stored && slot && !isEmpty) {
          const want = stored.map(r => r.values[0]);
          const have = kids(slot).map(r => { const c = cellsOf(r, cfg.cellTextProp)[0]; const k = c && pid(c, cfg.cellTextProp); return k ? String(c.componentProperties[k].value) : null; }).filter(Boolean);
          const missing = want.filter(x => !have.includes(x)), extra = have.filter(x => !want.includes(x));
          if (missing.length || extra.length) problems.push(page.name + '/' + title + ': rows do not match the properties' + (missing.length ? '; missing ' + missing.join(', ') : '') + (extra.length ? '; stale ' + extra.join(', ') : ''));
        }
      }
    }
    return opts.labels ? { pages, tables, rows, problems, orderDisagreements, labelsUnchecked, unreadable } : { pages, tables, rows, problems, orderDisagreements, unreadable };
  };

  globalThis.PT = PT;
  return PT;
};

// Integrity hash over the factory's own source, whitespace removed. Both this
// and `node scripts/hash.js` compute it the same way, so the two can be
// compared across the paste. FNV-1a: short, dependency-free, and enough to
// catch truncation or a mangled line — this guards a transcription, not an
// adversary.
globalThis.__PT_HASH = (function () {
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
  globalThis.__PT_STRIP = stripComments;
  return function (s) {
    var h = 0x811c9dc5;
    var t = stripComments(s).replace(/\s+/g, '');
    for (var i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    return ('0000000' + h.toString(16)).slice(-8);
  };
})();

// node loads this file to compute the expected hash; only Figma runs it.
if (typeof figma !== 'undefined') {
  globalThis.__PT_FACTORY();
  var __src = globalThis.__PT_FACTORY.toString();
  var __h = globalThis.__PT_HASH(__src);
  // Caching is what removes the repeat paste. It also introduces the one
  // failure it must not have — a corrupt source cached and reused forever.
  // So the gate is here, BEFORE the write: set globalThis.__PT_EXPECT to the
  // hash from `node scripts/hash.js` at the top of the paste and a mismatched
  // transcription is refused rather than persisted. Returning the hash for the
  // caller to eyeball is not enough; by then it would already be cached.
  globalThis.__PT_CACHED = (!globalThis.__PT_EXPECT || globalThis.__PT_EXPECT === __h);
  if (globalThis.__PT_CACHED) figma.root.setPluginData('pt.src.v1', __src);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { factory: globalThis.__PT_FACTORY, hash: globalThis.__PT_HASH };
}

if (typeof figma !== 'undefined') {
  return {
    ready: true,
    cachedSource: globalThis.__PT_CACHED,
    expected: globalThis.__PT_EXPECT || '(none given — set __PT_EXPECT to gate the cache)',
    sourceHash: globalThis.__PT_HASH(globalThis.__PT_FACTORY.toString()),
    sourceBytes: globalThis.__PT_FACTORY.toString().length,
    // Same schema check PT.config() applies, so this never reports a config the
    // script has already decided to discard.
    config: PT.config(),
    next: globalThis.__PT_CACHED ? 'Cached. PT.profile() if config is null, PT.plan(page) to review.' : 'REFUSED — sourceHash does not match __PT_EXPECT; the paste is corrupt. Re-paste, do not proceed.'
      + ' Full sequence: Then PT.profile() if config is null, PT.plan(page) to review, PT.apply() until done.'
  };
}
