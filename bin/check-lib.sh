# Sourced by bin/check: the step helpers and the closing summary.
#
# The summary names every step that failed, last, because the end of the
# output is what gets read: a run whose last line said only "FAILURES above"
# was read from its tail, the one failure visible there was blamed, and a push
# was nearly forced past the hook while the real blocker (a history line over
# its limit) sat at the top. Each failure's detail stays where it was printed.
FAILED=""
step() { CUR="$1"; printf '%-44s' "$1"; T_STEP=$(date +%s); }
took() { echo "($(( $(date +%s) - T_STEP ))s)"; }
ok() { echo "ok $(took)"; }
bad() { echo "FAIL $(took)"; FAIL=1; FAILED="${FAILED}${CUR}
"; [ -n "${1:-}" ] && printf '%s\n' "$1"; }
summary() {
  n=$(printf '%s' "$FAILED" | grep -c .)
  echo "== $n FAILED (detail above each):"
  printf '%s' "$FAILED" | sed 's/^/  - /'
}
