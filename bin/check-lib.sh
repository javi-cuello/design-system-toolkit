# Sourced by bin/check: the step helpers and the closing summary.
#
# The summary names every step that failed, last, because the end of the
# output is what gets read: a run whose last line said only "FAILURES above"
# was read from its tail, the one failure visible there was blamed, and a push
# was nearly forced past the hook while the real blocker (a history line over
# its limit) sat at the top. Each failure's detail stays where it was printed.
#
# A suite that could not run here (no Chrome) exits 77, the automake skip code,
# and its step says "skip": until 2026-10-31 such suites exited 0 and the step
# said "ok" for a run that had tested nothing. A skip is neither: the final
# line names each one, so green-with-skips does not read as all green.
FAILED=""
SKIPPED=""
step() { CUR="$1"; printf '%-44s' "$1"; T_STEP=$(date +%s); }
took() { echo "($(( $(date +%s) - T_STEP ))s)"; }
ok() { echo "ok $(took)"; }
bad() { echo "FAIL $(took)"; FAIL=1; FAILED="${FAILED}${CUR}
"; [ -n "${1:-}" ] && printf '%s\n' "$1"; return 0; }
# In CI (CI set, as GitHub sets it) a skip is a failure: the workflow installs Chrome and names it, so a
# browser suite that could not run there means the runner lost it, not that this machine lacks it.
skip() {
  if [ -n "${CI:-}" ]; then bad "${1:-} (a skip is a failure in CI, where every suite is meant to run)"; return 0; fi
  echo "skip $(took)"; SKIPPED="${SKIPPED}${CUR}
"; [ -n "${1:-}" ] && printf '%s\n' "$1" | sed 's/^/  /'; return 0; }
# The last line of a green run: "green", or "green, N skipped:" and each skip.
green() {
  if [ -z "$SKIPPED" ]; then echo "green${1:-}"; return; fi
  echo "green${1:-}, $(printf '%s' "$SKIPPED" | grep -c .) skipped (could not run here):"
  printf '%s' "$SKIPPED" | sed 's/^/  - /'
}
summary() {
  n=$(printf '%s' "$FAILED" | grep -c .)
  echo "== $n FAILED (detail above each):"
  printf '%s' "$FAILED" | sed 's/^/  - /'
  [ -z "$SKIPPED" ] || { echo "   and $(printf '%s' "$SKIPPED" | grep -c .) skipped (could not run here):"; printf '%s' "$SKIPPED" | sed 's/^/  - /'; }
}
