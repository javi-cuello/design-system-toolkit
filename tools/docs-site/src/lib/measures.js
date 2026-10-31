// The library's health tiles: the skill's measures.json (what each measure
// counts, how it renders, the threshold that turns it amber) applied to the
// metrics the last full audit stored for each library. Build time only; the
// overview's question cards draw them (pages/index.astro). This file holds no label and no
// threshold: they are the skill's.
import { project } from './project.js';
import { audit } from './tracker.js';
import { isOpen, platformLabel } from '../dashboard/labels.js';
import { dashboardStatic } from '../dashboard/data.js';
import { num, percent } from './format.js';

// The small vocabulary measures.json is written in. Deliberately small: a
// general expression language here would just move the logic back into the
// page wearing a different syntax.
const derived = (m) => Object.assign({}, m, {
  boundTotal: (m.bound || 0) + (m.unbound || 0),
  contrastShort: (m.contrastTotal || 0) - (m.contrastPass || 0)
});
const fillTpl = (tpl, m) => String(tpl || "").replace(/\{(\w+)\}/g, (_, k) => {
  const v = derived(m)[k];
  return v === undefined || v === null ? "" : num(v);
});
// A measure whose inputs this run did not record has no value — and no tile.
function measureValue(def, m) {
  const d = derived(m), v = def.value || {};
  const need = v.of ? [v.of] : v.num ? [v.num, v.den] : (v.sum || []);
  if (need.some((k) => typeof d[k] !== "number")) return null;
  if (v.of) return { n: d[v.of], pct: d[v.of] };
  if (v.sum) { const n = v.sum.reduce((t, k) => t + d[k], 0); return { n: n, pct: n }; }
  return { n: d[v.num], den: d[v.den], pct: d[v.den] ? (d[v.num] / d[v.den]) * 100 : null };
}
function measureState(def, val) {
  if (!def.good || !val) return null;
  if (typeof def.good.gte === "number") return (val.pct !== null && val.pct >= def.good.gte) ? "good" : "warn";
  if (typeof def.good.eq === "number") return val.n === def.good.eq ? "good" : "warn";
  return null;
}
function figure(def, v) {
  if (def.render === "percent") return percent(v.pct);
  if (def.render === "ratio") return num(v.n) + " / " + num(v.den);
  if (def.render === "cleanOrCount") return v.n === 0 ? "Clean" : num(v.n);
  return num(v.n);
}

const defs = (dashboardStatic.scripts.measures || {}).measures || [];
// One entry per library with a measured run: its tiles and when it ran. The
// open and total findings are counted from the record's rows, as the queue
// counts them, not read from the run that is now days old.
export const health = project.auditRecords.map(({ key, platform }) => {
  const lib = audit?.libraries?.[`${key}/${key}`];
  if (!lib || !lib.metrics || !Object.keys(lib.metrics).length) return null;
  const rows = Object.entries(audit.rows || {}).filter(([k]) => k.startsWith(key + '/')).map(([, r]) => r);
  const m = { ...lib.metrics, openFindings: rows.filter(isOpen).length, totalFindings: rows.length };
  const tiles = defs.flatMap((def) => {
    const v = measureValue(def, m);
    if (!v) return [];
    const f = figure(def, v);
    if (f === null || /NaN|undefined/.test(f)) return [];
    let state = measureState(def, v);
    let why = def.why && (def.whyWhen === "zero" ? (v.n === 0 ? fillTpl(def.why, m) : null) : (state === "warn" ? fillTpl(def.why, m) : null));
    // A measure parked by a project ruling is not a fault.
    const parked = lib.deferred && lib.deferred[def.key];
    if (parked) { state = "idle"; why = parked; }
    const detail = fillTpl(def.detailWhenNotGood && measureState(def, v) === "warn" ? def.detailWhenNotGood : def.detail, m);
    return [{ key: def.key, label: def.label, figure: f, detail, state, why }];
  });
  return { key, name: platformLabel(platform), at: lib.lastRunAt, tiles };
}).filter(Boolean);
