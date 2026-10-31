/*
 * tools/parity/timing.mjs — where a run's time went, part of the design-to-code
 * parity engine (README.md here; the method is skills/design-code-parity).
 *
 * Speed is part of the run's contract (toolkit-standard §D 0's third
 * question; the slowdown that made it one is its evidence). Every phase is
 * timed, per run and per target, saved beside the measurements and compared
 * with the accepted run's: a run more than a quarter slower on the same scope
 * prints a warning naming the slowest phase — a warning, because machine
 * load varies.
 *
 *   const T = timer();
 *   await T.timed('probe', () => measure(...), target);   // accumulates
 *   T.phases → { probe: ms, … }   T.targets → { button: { probe: ms, … } }
 *   summary(T) → lines   slower(accepted, now) → a warning or null
 *
 * Phases a worker runs in parallel add up past the wall clock: `measure` is
 * the loop's wall time, the phases inside it are worker time.
 */
export function timer(now = () => performance.now()) {
  const phases = {}, targets = {};
  const add = (into, k, ms) => { into[k] = +((into[k] || 0) + ms).toFixed(1); };
  const timed = async (phase, fn, target) => {
    const t = now();
    try { return await fn(); } finally {
      const ms = now() - t;
      add(phases, phase, ms);
      if (target) { if (!targets[target]) targets[target] = {}; add(targets[target], phase, ms); }
    }
  };
  const mark = (phase, ms, target) => { add(phases, phase, ms); if (target) { if (!targets[target]) targets[target] = {}; add(targets[target], phase, ms); } };
  const start = now();
  return { phases, targets, timed, mark, total: () => +(now() - start).toFixed(1) };
}

/* The run's time, one line per phase, the slowest targets after. */
export function summary(T, total, { targets = 5 } = {}) {
  // wall-clock phases in order, then the worker-time phases inside `measure`
  const WALL = ['load', 'gates', 'adapt', 'session', 'measure', 'judge', 'baseline', 'report', 'pictures'];
  const WORK = ['fragments', 'open', 'drive', 'state', 'probe', 'extras', 'shots'];
  const seen = new Set([...WALL, ...WORK]);
  const s = (ms) => `${(ms / 1000).toFixed(1)}s`;
  const list = (keys) => keys.filter((k) => k in T.phases).map((k) => `${k} ${s(T.phases[k])}`).join(', ');
  const rest = Object.keys(T.phases).filter((k) => !seen.has(k));
  const lines = [`time: ${s(total)} — ${list(WALL)}${rest.length ? ', ' + list(rest) : ''}`];
  if (WORK.some((k) => k in T.phases)) lines.push(`  inside measure, summed over the windows: ${list(WORK)}`);
  const per = Object.entries(T.targets).map(([name, p]) => [name, Object.values(p).reduce((a, b) => a + b, 0)]).sort((a, b) => b[1] - a[1]).slice(0, targets);
  if (per.length) lines.push(`  slowest targets (pages opened one at a time): ${per.map(([n, ms]) => `${n} ${s(ms)}`).join(', ')}`);
  return lines;
}

/* What a run's time is compared on. A full run names how many targets it
   measured: a library that grew is a new reference, not a slowdown (one project,
   13 Oct — 110 targets became 139 and every run warned against the old 88 s). */
export function scopeOf(wanted, targets) {
  return wanted.length ? wanted.join(' ') : `all ${targets}`;
}

/* What an accepted run keeps as the reference time: the faster of the time
   it already held and its own, on the same scope — an accept made beside a
   build or another check must not raise the bar (one did, 21 s → 74 s). */
export function keep(previous, current) {
  if (!previous || previous.scope !== current.scope || !previous.total) return current;
  return current.total < previous.total ? current : { ...previous, keptOver: current.total };
}

/* The accepted run's time against this one's, on the same scope: more than a
   quarter slower is said, with the phase that grew the most. Null when there
   is nothing to compare, or the run is not slower than that. */
export function slower(accepted, current, { ratio = 1.25 } = {}) {
  if (!accepted || !current || !accepted.total || accepted.scope !== current.scope) return null;
  if (current.total <= accepted.total * ratio) return null;
  const grew = Object.keys(current.phases || {}).map((k) => [k, (current.phases[k] || 0) - ((accepted.phases || {})[k] || 0)]).sort((a, b) => b[1] - a[1])[0];
  const s = (ms) => `${(ms / 1000).toFixed(1)}s`;
  return `slower than the accepted run by ${Math.round((current.total / accepted.total - 1) * 100)}% (${s(current.total)} against ${s(accepted.total)})${grew && grew[1] > 0 ? ` — ${grew[0]} grew the most, by ${s(grew[1])}` : ''}; machine load varies, so this is a warning, and a run that stays slower is a finding (toolkit-standard §D 0)`;
}
