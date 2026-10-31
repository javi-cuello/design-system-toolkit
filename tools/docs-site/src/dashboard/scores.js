// Per-component scores, what changed since the last audit, and the check
// catalogue the About view lists.
import { ctx } from './context.js';
import { api } from './api.js';
import { state } from './queue.js';
import { store } from './record.js';
import { componentOf, isOpen } from './labels.js';

// The scoring MODEL is the skill's — scanner/scoring.json, which encodes
// SKILL.md "Scoring — on request only". This applies it and holds no weights,
// penalties, thresholds or dimension names of its own. It held the six
// dimension names until 2026-09-20, two lines above that sentence: a seventh
// added to scoring.json would have moved every total with no column to show
// where it came from.
function computeScores(sets, rows, scoring, catalogue) {
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
    if (missing.length) notes.push("partial \u2014 " + missing.join(", ") + ": " + (scoring.partialNote || "not scanned"));
    out.push({ name: s.set, score: score, d: d, notes: notes });
  }
  const n = out.map((r) => r.score).sort((a, b) => a - b);
  const median = n.length
    ? (n.length % 2 ? n[(n.length - 1) / 2] : Math.round((n[n.length / 2 - 1] + n[n.length / 2]) / 2))
    : null;
  return { at: new Date().toISOString(), rows: out, median: median,
           model: "figma-components-audit scanner/scoring.json" };
}
// Filing and closing rows happen in the service (POST /rows, rows.mjs), not
// here: see fileRows. This page assembles the findings and reads the result.

export async function recordScores(scan) {
  if (!scan || !scan.measures || !ctx.libKey) return;   // full scans only, like the measures
  const sc = await api.scripts();
  const doc = computeScores(scan.audited, state, sc.scoring, sc.checks);
  if (doc) await store.doc("scores/" + ctx.libKey).set(doc);
}
export function renderChanged(doc) {
  const host = document.getElementById("changed");
  const section = document.getElementById("changedSection");
  host.textContent = "";
  // Nothing moved is the normal state, and a heading over an explanation of
  // why it is empty is worse than no heading. The section appears only when
  // there is something in it, and it leads the tab when it does.
  const d = doc && !doc.baseline && doc.diff;
  const moved = d ? (d.changed || []).length + (d.added || []).length + (d.removed || []).length : 0;
  section.hidden = !moved;
  if (!moved) return;
  const groups = [
    ["changed", "Changed — worth re-checking", "changed"],
    ["added", "New since the last run", "added"],
    ["removed", "Gone since the last run", "gone"]
  ];
  let any = false;
  for (const [key, label, kind] of groups) {
    const names = doc.diff[key] || [];
    if (!names.length) continue;
    any = true;
    const g = document.createElement("div");
    g.className = "changed-group";
    g.dataset.kind = kind;
    const h = document.createElement("h3");
    const c = document.createElement("span"); c.className = "changed-count"; c.textContent = names.length;
    h.append(c, document.createTextNode(label));
    const ul = document.createElement("ul"); ul.className = "name-list";
    for (const n of names) { const li = document.createElement("li"); li.textContent = n; ul.appendChild(li); }
    g.append(h, ul);
    host.appendChild(g);
  }
  if (!any) {
    const p = document.createElement("p");
    p.className = "baseline-note";
    p.textContent = "Nothing changed since the last run — every fingerprint matches.";
    host.appendChild(p);
  }
}
export function renderChecks(cat) {
  const host = document.getElementById("checkCatalogue");
  if (!host || !cat || !cat.dimensions) return;
  const LABEL = { scanner: "runs", session: "session only", backlog: "not yet built" };
  host.textContent = "";
  for (const dim of cat.dimensions) {
    const wrap = document.createElement("div");
    wrap.className = "dim";
    const head = document.createElement("div");
    head.className = "dim-head";
    const h3 = document.createElement("h3");
    h3.textContent = dim.dimension;
    head.appendChild(h3);
    if (dim.weight != null) {
      const w = document.createElement("span");
      w.className = "weight"; w.textContent = "weight " + dim.weight;
      head.appendChild(w);
    }
    // What actually runs, per dimension — the number a reader needs most.
    const real = dim.checks.filter((c) => c.status !== "rule");
    if (real.length) {
      const cov = document.createElement("span");
      cov.className = "weight";
      cov.textContent = real.filter((c) => c.status === "scanner").length + " of " + real.length + " automated";
      head.appendChild(cov);
    }
    wrap.appendChild(head);
    if (dim.why) {
      const p = document.createElement("p");
      p.className = "dim-why"; p.innerHTML = dim.why;
      wrap.appendChild(p);
    }
    const ul = document.createElement("ul");
    ul.className = "checks";
    for (const c of dim.checks) {
      const li = document.createElement("li");
      if (c.status !== "scanner" && c.status !== "rule") li.dataset.off = "1";
      const t = document.createElement("span");
      // The queue's severity badge, so Error reads red here as it does there.
      t.className = "sev " + ({ error: "error", warning: "warn", review: "rule", preference: "pref" }[c.tier] || "hygiene");
      t.textContent = c.tier[0].toUpperCase() + c.tier.slice(1);
      const w = document.createElement("span");
      w.className = "who"; w.textContent = c.who;
      const s = document.createElement("span");
      // innerHTML: this text is authored in the skill and carries <b>/<code>.
      s.innerHTML = c.text;
      if (LABEL[c.status] && c.status !== "scanner") {
        const tag = document.createElement("span");
        tag.className = "runs-tag";
        tag.textContent = LABEL[c.status];
        if (c.note) tag.title = c.note;
        s.appendChild(document.createTextNode(" "));
        s.appendChild(tag);
      }
      li.append(t, w, s);
      ul.appendChild(li);
    }
    wrap.appendChild(ul);
    host.appendChild(wrap);
  }
}
