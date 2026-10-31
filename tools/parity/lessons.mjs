/*
 * tools/parity/lessons.mjs — toolkit-standard §D 8's trigger, part of the
 * design-to-code parity engine (README.md here; the method is
 * skills/design-code-parity).
 *
 * What a project rules anew is listed the moment a run is accepted, so the
 * question "project fact or toolkit lesson" is asked then and not at a
 * session's close: every waiver, decision and 'unset' ruling new since the
 * last accepted run, and every stylesheet comment that explains why the code
 * differs from the design ("Figma draws X, so…") new since then. Where
 * another registered project rules the same property with a reason in the
 * same words, the ruling is named a toolkit candidate: the same ruling
 * written twice is the toolkit's by §D 2. A warning, never a failure. Four
 * such lessons — a font release, a ring's geometry, the hairline, the
 * disabled dim — sat in two projects' stylesheets until a review found them,
 * and three of the four were comments, not waivers, which is why the
 * stylesheets are read too.
 *
 *   lessons(declared, previous, others) → [{ target, key, owner, reason, candidate, on }]
 *   deviations(repo, roots)             → [{ target: file, key: 'comment "<its words>"', line, waiver: { reason, decision: true } }]
 *   lessonsIndex(declared)              → the sorted keys an accepted run records
 *   triage(found, answer, toolkit)      → null, or why an accept is refused
 */
import fs from 'node:fs';
import path from 'node:path';
import { asWaiver, keyParts } from './waivers.mjs';
import { where } from '../project-check/loop.mjs';
import { walkRepo } from '../shared/walk.mjs';

const SEP = '\u0000';
/* The words a reason is compared on: five letters or more, less the ones every
   reason uses. Three shared is a twin; "count", "holds" and "sample" alone
   named a toolkit candidate between two unrelated content waivers. */
const STOP = new Set(['where', 'which', 'there', 'their', 'figma', 'draws', 'frame', 'design', 'content', 'measured', 'bound', 'within', 'count', 'holds', 'sample', 'every', 'about', 'these', 'those', 'other', 'under', 'after', 'before', 'while', 'through', 'because', 'frames', 'draw', 'drawn']);
const words = (reason) => new Set((String(reason || '').toLowerCase().match(/[a-z][a-z-]{4,}/g) || []).filter((w) => !STOP.has(w)));
const ownerOf = (w) => (w.decision === 'unset' ? 'unset' : w.decision ? 'decision' : w.content ? 'content' : w.fix ? `fix:${w.fix}` : 'unowned');

/* An accept that lists lessons and records them in the same breath forgets
   them: the index moves on, and nothing after it — bin/closing included — can
   see they were ever new. So an accept with lessons waits for `--triaged
   "<where they went>"`: the context document's rulings log, a standard's rule,
   a skill's case. Written 2026-10-03, when fourteen lessons from one ruling
   were listed at an accept and would have been absorbed had the session not
   stopped to file them; the maintainer asked for the loop enforced, not asked. */
export function triage(found, answer, toolkit) {
  if (!found.length) return null;
  if (answer === undefined || answer === null) return `${found.length} lesson(s) new since the last accepted run, and nothing says where they went: file each as the project's fact (its context document's rulings log) or the toolkit's (a standard, a skill, an engine rule), then accept again with --triaged "<toolkit file>" or --triaged "none — <why>" (toolkit-standard §D 8)`;
  const bad = where(answer, toolkit);
  return bad ? `--triaged ${bad}` : null;
}

export const lessonsIndex = (declared) => [...new Set(declared.map((d) => `${d.target}${SEP}${d.key}`))].sort();

export function lessons(declared, previous = [], others = []) {
  const seen = new Set(previous);
  const out = new Map();
  for (const d of declared) {
    const w = asWaiver(d.waiver);
    if (!w || seen.has(`${d.target}${SEP}${d.key}`)) continue;
    // one ruling shared through a base chain or a spread is one lesson, on N targets
    const id = `${d.key}${SEP}${ownerOf(w)}${SEP}${w.reason}`;
    if (out.has(id)) { out.get(id).on.push(d.target); continue; }
    const { prop } = keyParts(d.key);
    const mine = words(w.reason);
    let candidate = null;
    for (const o of others) for (const x of o.declared) {
      const v = asWaiver(x.waiver);
      if (!v || keyParts(x.key).prop !== prop || ownerOf(v) !== ownerOf(w)) continue;
      if ([...words(v.reason)].filter((t) => mine.has(t)).length >= 3) { candidate = `${o.project}: ${x.key}`; break; }
    }
    out.set(id, { target: d.target, key: d.key, owner: ownerOf(w), reason: w.reason, candidate, on: [d.target] });
  }
  return [...out.values()];
}

/* The comments in a project's stylesheets that say the code differs from the
   design, as rulings: `{ target: file, key: 'comment "<its words>"', waiver }`, so they index
   and list like the mapping's. Read under the roots given (a project's
   stylesheet folders), skipping vendored and generated trees. */
const SIGNAL = /\b(figma|the design|the frame|the designer)\b[^.\n]{0,80}\b(draws|puts|sets|wants|has|gives|leaves|fixes|places|pads|rounds|measures|says)\b/i;
const SKIP = /(^|\/)(node_modules|vendor|kirby|dist|build|\.generated|measured|snapshots?)(\/|$)|\/_tokens\.|tokens\/_|\.min\./;
export function deviations(repo, roots = []) {
  const out = [];
  for (const r of roots) {
    const dir = path.join(repo, r);
    if (!fs.existsSync(dir)) continue;
    // the repo walk skips what is never source (tools/shared/walk.mjs); SKIP adds what a stylesheet root holds generated
    for (const p of walkRepo(dir, ['.scss', '.sass', '.css'], { reject: (f) => SKIP.test(path.relative(repo, f)) })) {
      const rel = path.relative(repo, p);
      const lines = fs.readFileSync(p, 'utf8').split('\n');
      lines.forEach((l, i) => {
        const c = l.match(/(\/\/|\/\*)\s*(.*)$/);
        if (!c || !SIGNAL.test(c[2])) return;
        const reason = c[2].replace(/\s*\*\/\s*$/, '').trim();
        // keyed by what it says, not where: a line number re-listed every old
        // comment below an insertion and missed a new one on an old line
        out.push({ target: rel, key: `comment "${reason.replace(/\s+/g, ' ')}"`, line: i + 1, waiver: { reason, decision: true } });
      });
    }
  }
  return out;
}
