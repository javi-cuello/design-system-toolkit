// Per-component scores, what changed since the last audit, and the check
// catalogue the About view lists.
import { ctx } from './context.js';
import { api } from './api.js';
import { state } from './queue.js';
import { store } from './record.js';
import { computeScores } from '../../../figma-audit/score-model.mjs';

// The model is applied in one place, tools/figma-audit/score-model.mjs, which
// the skill's score report (tools/figma-audit/scores.mjs) loads too.
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
