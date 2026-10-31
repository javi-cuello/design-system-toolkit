/*
 * tools/parity/baseline.mjs — gate 12, the measurement baseline, part of the design-to-code parity
 * engine (README.md here; the method is skills/design-code-parity).
 *
 * Gate 12, the regression net: this run's measurements against the last
 * accepted ones, in exact numbers.
 *
 * The Figma nets ask "does the page match the design"; this asks "did anything
 * change when nobody meant it to" — the question that catches breaking one
 * thing while fixing another, and the only net that needs no Figma at all, so
 * it governs what no frame draws. Two consecutive runs measure byte-identical,
 * so a difference here is a change, not noise.
 *
 * The comparison is this; what is volatile is the project's, because only the
 * project knows which of its numbers answer to live data:
 *
 *   baseline({ dir, suites, volatile, contentSized })
 *     dump(suite, entries, scoped)   the runner's measurements for a suite
 *     compare()                      → exit code; prints what moved
 *     accept()                       the current run becomes the accepted one
 *     acceptable()                   false after a scoped run, with the reason
 *
 *   volatile     per suite, the fields never compared (DOM join indices, and
 *                on a screen the text and extent the feed decides)
 *   contentSized per suite, the fields excused on a LEAF whose own words
 *                moved — a width follows the feed where the words do, and a
 *                width that moves while the words stay put is the regression
 *                worth catching
 */
import fs from 'node:fs';
import path from 'node:path';

export function baseline({ dir, suites, volatile: volatileFields = {}, contentSized = {} }) {
  const ACCEPTED = path.join(dir, 'accepted');
  const fileOf = (suite, accepted) => path.join(accepted ? ACCEPTED : dir, `${suite}.json`);

  // the measured parts nobody else descends from, by their DOM join index
  const leaves = (parts) => {
    const inner = new Set();
    for (const rec of Object.values(parts || {})) for (const i of rec?.anc || []) inner.add(i);
    return new Set(Object.entries(parts || {}).filter(([, r]) => r && !inner.has(r.self)).map(([n]) => n));
  };
  const strip = (suite, parts) => {
    const drop = volatileFields[suite] || new Set();
    const out = {};
    for (const [name, rec] of Object.entries(parts || {})) {
      out[name] = rec ? Object.fromEntries(Object.entries(rec).filter(([k]) => !drop.has(k))) : rec;
    }
    return out;
  };

  /*
   * One measurement document per rendered job. A run scoped to one component
   * or screen says so: accepting a scoped run drops every other entry from the
   * accepted set, and the next full run reports them all as new.
   */
  const dump = (suite, entries, scoped) => {
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(fileOf(suite), JSON.stringify(Object.fromEntries(entries), null, 1) + '\n');
    fs.writeFileSync(path.join(dir, `${suite}.scope`), scoped ? String(scoped) : 'all');
  };

  const compare = (log = console.log) => {
    // nothing accepted is a gate that holds nothing: red, not a pass (item 41
    // of the 2026-10-02 review — it returned 0 here and read as green)
    if (!fs.existsSync(ACCEPTED)) { log('no accepted measurements, so nothing holds this run — accept a full run you trust (--accept)'); return 1; }
    const rows = [];
    // a suite with nothing to compare is red, and the suites that have are
    // still compared: returning on the first one hid every move in the rest
    let unheld = 0;
    for (const suite of suites) {
      if (!fs.existsSync(fileOf(suite))) { log(`  ${suite}: no current measurements (run the suite first)`); unheld++; continue; }
      if (!fs.existsSync(fileOf(suite, true))) { log(`  ${suite}: nothing accepted for this suite`); unheld++; continue; }
      const a = JSON.parse(fs.readFileSync(fileOf(suite, true), 'utf8')), b = JSON.parse(fs.readFileSync(fileOf(suite), 'utf8'));
      for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) {
        if (!a[key]) { rows.push([suite, key, '·', 'new — not in the accepted set']); continue; }
        if (!b[key]) { rows.push([suite, key, '·', 'accepted, no longer measured']); continue; }
        const x = strip(suite, a[key]), y = strip(suite, b[key]);
        // a leaf in both runs: an ancestor in either one is not excused
        const leaf = new Set([...leaves(a[key])].filter((n) => leaves(b[key]).has(n)));
        for (const part of new Set([...Object.keys(x), ...Object.keys(y)])) {
          const p = x[part], q = y[part];
          if (JSON.stringify(p) === JSON.stringify(q)) continue;
          if (!p || !q) { rows.push([suite, key, part, p ? 'the selector stopped matching' : 'a part the accepted set does not know']); continue; }
          const wordsMoved = leaf.has(part) && a[key][part]?.text !== b[key][part]?.text;
          for (const f of new Set([...Object.keys(p), ...Object.keys(q)])) {
            if (wordsMoved && contentSized[suite]?.has(f)) continue;
            if (JSON.stringify(p[f]) !== JSON.stringify(q[f])) rows.push([suite, key, part, `${f}: ${JSON.stringify(p[f])} → ${JSON.stringify(q[f])}`]);
          }
        }
      }
    }
    // one line per changed part-field, capped: a broken stylesheet touches
    // everything and the first lines say what happened
    for (const [suite, key, part, what] of rows.slice(0, 40)) log(`  ${suite}  ${key.padEnd(40)} ${part.padEnd(24)} ${what}`);
    if (rows.length > 40) log(`  …+${rows.length - 40} more`);
    log(rows.length
      ? `${rows.length} measurement(s) moved since the accepted run — intended? accept this run; not? the lines above name the layer and the value`
      : 'nothing moved since the accepted run');
    return rows.length || unheld ? 1 : 0;
  };

  /* Refused after a scoped run: the accepted set is the whole board or nothing. */
  const acceptable = (log = console.log) => {
    const partial = suites
      .map((s) => [s, path.join(dir, `${s}.scope`)])
      .filter(([, f]) => fs.existsSync(f) && fs.readFileSync(f, 'utf8').trim() !== 'all')
      .map(([s, f]) => `${s} (${fs.readFileSync(f, 'utf8').trim()})`);
    if (!partial.length) return true;
    log(`refusing to accept: the last run was scoped to ${partial.join(' and ')}.`);
    log('Accepting it would drop every other entry from the baseline, and the next full run');
    log('would report them all as new. Run the whole suite, then accept.');
    return false;
  };

  const accept = (log = console.log) => {
    fs.mkdirSync(ACCEPTED, { recursive: true });
    let n = 0;
    for (const suite of suites) {
      if (!fs.existsSync(fileOf(suite))) { log(`  ${suite}: nothing measured to accept`); continue; }
      fs.copyFileSync(fileOf(suite), fileOf(suite, true));
      n++;
    }
    log(`${n} suite(s) accepted as the measurement baseline`);
  };

  return { dump, compare, accept, acceptable };
}
