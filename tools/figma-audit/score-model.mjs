// The on-request 0–100 component score, applied: one definition for the
// dashboard (browser, tools/docs-site/src/dashboard/scores.js) and the score
// report the skill prints (node, scores.mjs). No node and no DOM here, so both
// load it (toolkit-standard §D 1).
//
// The scoring MODEL is figma-components-audit's — scanner/scoring.json, which
// encodes SKILL.md "Scoring — on request only". This applies it and holds no
// weights, penalties, thresholds or dimension names of its own. It held the
// six dimension names until 2026-09-20: a seventh added to scoring.json would
// have moved every total with no column to show where it came from.
import { componentOf, isOpen } from "./audit-row.mjs";

export function computeScores(sets, rows, scoring, catalogue, at = new Date().toISOString()) {
  if (!scoring || !scoring.dimensions) return null;
  const dims = scoring.dimensions, pen = scoring.penalties || {}, gate = scoring.gate || {};

  // "Unscanned is not 100": a dimension no running check feeds is EXCLUDED
  // and its weight redistributed, never scored. Derived from the catalogue,
  // so porting a check closes this gap too with nothing to remember.
  const running = new Set();
  for (const d of (catalogue && catalogue.dimensions) || [])
    for (const c of d.checks) if (c.status === "scanner") running.add(d.dimension);
  const scanned = {};
  for (const [name, def] of Object.entries(dims))
    scanned[name] = !catalogue || running.has(def.catalogue || name);

  const ruleDim = {};
  for (const [name, def] of Object.entries(dims))
    for (const r of def.rules || []) ruleDim[r] = name;

  const byComp = {};
  for (const r of Object.values(rows || {})) {
    // `isOpen`, the one predicate the queue counts by: a row ticked but not yet
    // verified is still open there, so it still costs its points here.
    if (!r || !isOpen(r)) continue;
    // The component, not the component plus where in it the finding sits: a
    // score is per component, and `Button — properties panel` is Button's.
    const comp = componentOf(r.where);
    (byComp[comp] = byComp[comp] || []).push(r);
  }

  const live = Object.keys(dims).filter((n) => scanned[n]);
  const totalWeight = live.reduce((n, k) => n + dims[k].weight, 0) || 1;
  const missing = Object.keys(dims).filter((n) => !scanned[n]);

  const out = [];
  for (const s of sets) {
    const lost = {};
    let gated = false;
    for (const f of byComp[s.set] || []) {
      const dim = ruleDim[f.rule];
      if (!dim || !scanned[dim]) continue;
      lost[dim] = (lost[dim] || 0) + (pen[f.sev] || 0);
      if ((gate.rules || []).indexOf(f.rule) > -1) gated = true;
    }
    let score = 0;
    const d = {};
    for (const name of live) {
      const kept = Math.max(0, 1 - (lost[name] || 0));
      d[name] = Math.round(kept * 100);
      score += (dims[name].weight / totalWeight) * kept * 100;
    }
    score = Math.round(score);
    const notes = [];
    if (gated) { score = Math.min(score, gate.cap); notes.push(gate.reason); }
    if (missing.length) notes.push("partial — " + missing.join(", ") + ": " + (scoring.partialNote || "not scanned"));
    out.push({ name: s.set, score: score, d: d, notes: notes });
  }
  const n = out.map((r) => r.score).sort((a, b) => a - b);
  const median = n.length
    ? (n.length % 2 ? n[(n.length - 1) / 2] : Math.round((n[n.length / 2 - 1] + n[n.length / 2]) / 2))
    : null;
  return { at: at, rows: out, median: median,
           model: "figma-components-audit scanner/scoring.json" };
}
