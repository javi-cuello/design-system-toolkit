#!/bin/bash
# Link skills from this repo into ~/.claude/skills (repo = single source of truth).
# Re-run any time; safe. If a real folder exists there, it is backed up first.
set -e

# the path as the disk spells it: a shell entered through ~/projects would write that case into the services
# (bash's pwd -P keeps the typed case on a case-insensitive disk; realpath(3) returns the stored one)
repo="$(cd "$(dirname "$0")" && { realpath . 2>/dev/null || pwd -P; })"

node_bin="$(command -v node || true)"
[ -n "$node_bin" ] || { echo "no node on PATH: install Node 22.12 or later, then re-run" >&2; exit 1; }
# 22.12 is the first 22 that loads an ES module through require() unflagged, as derive.cjs loads layers.mjs
"$node_bin" -e 'const [a, b] = process.versions.node.split(".").map(Number); process.exit(a > 22 || (a === 22 && b >= 12) ? 0 : 1)' \
  || { echo "node $("$node_bin" --version) is too old: install Node 22.12 or later, then re-run" >&2; exit 1; }

# Standard guard. Runs the mechanically checkable clauses of skill-standard.md
# before anything goes live. Its errors block (a skill with folded frontmatter
# loads with no description and silently stops triggering); its warnings are
# conformance debt that leaves the skill working, so they print and link.
# A sparse checkout (bin/get, for some skills) holds only part of what the
# guard reads; what it holds passed the guard in the repo before it was pushed.
# There the guard, the push hook and the services are left out, and only whole
# skills are linked; a full checkout runs everything below as it always has.
sparse=$(git -C "$repo" config --bool core.sparseCheckout 2>/dev/null || echo false)
if [ "${SKIP_CHECKS:-0}" != 1 ] && [ "$sparse" != true ]; then
  if ! "$repo/standards/tests/check.sh"; then
    echo
    echo "Refusing to link: fix the errors above first," >&2
    echo "or re-run as SKIP_CHECKS=1 $0 to bypass this guard." >&2
    exit 1
  fi
  echo
fi

# The toolkit's own push hook (.githooks/pre-push): a push runs bin/check.
[ "$sparse" = true ] || git -C "$repo" config core.hooksPath .githooks

mkdir -p ~/.claude/skills
for s in "$repo"/skills/*/; do
  # a skill bin/get took only part of (its scripts, for a tool) is not in the checkout's list as a whole folder
  [ "$sparse" != true ] || git -C "$repo" sparse-checkout list | grep -qx "skills/$(basename "$s")" || continue
  name=$(basename "$s")
  target=~/.claude/skills/$name
  if [ -e "$target" ] && [ ! -L "$target" ]; then mv "$target" "$target.backup-$(date +%s)"; fi
  ln -sfn "${s%/}" "$target"
  echo "linked: $name"
done
# The services, installed or refreshed here so a new machine gets them with
# the skills: the snapshot router and the figma-audit service (every project
# with a `port`). macOS only; elsewhere, run `node tools/snapshot/router.mjs`
# and `node tools/figma-audit/server.mjs --all` yourself.
# SKIP_SERVICES=1 leaves them alone.
if [ "$(uname)" = "Darwin" ] && [ "${SKIP_SERVICES:-0}" != 1 ] && [ "$sparse" != true ]; then
  # the services run node through a link named for them, so Login Items says what each is
  ln -sfn "$node_bin" "$repo/tools/figma-audit/figma-audit"
  ln -sfn "$node_bin" "$repo/tools/snapshot/figma-snapshot"
  # their output names projects, files and keys, so it goes where only this user reads it, never /tmp
  logs="$HOME/Library/Logs/toolkit"
  mkdir -p "$logs" && chmod 700 "$logs"
  install_agent() {
    label="$1"; template="$2"; plist="$HOME/Library/LaunchAgents/$label.plist"
    mkdir -p "$HOME/Library/LaunchAgents"
    sed -e "s|TOOLKIT|$repo|g" -e "s|NODE_DIR|$(dirname "$node_bin")|g" -e "s|LOGS|$logs|g" "$template" > "$plist.new"
    if ! cmp -s "$plist.new" "$plist" 2>/dev/null; then
      mv "$plist.new" "$plist"
      launchctl bootout "gui/$(id -u)/$label" 2>/dev/null || true  # not loaded yet is fine; set -e would stop here
      # bootout returns before the service is gone: wait, or the check below sees it and never loads the new one
      for _ in 1 2 3 4 5 6 7 8 9 10; do launchctl print "gui/$(id -u)/$label" >/dev/null 2>&1 || break; sleep 0.5; done
    else rm -f "$plist.new"; fi
    # loaded whenever it is not, so a failed first load does not stick
    launchctl print "gui/$(id -u)/$label" >/dev/null 2>&1 ||
      { launchctl bootstrap "gui/$(id -u)" "$plist" && echo "service: $label" || echo "warn: could not load $label (launchctl bootstrap failed)"; }
  }
  install_agent com.toolkit.figma-snapshot "$repo/tools/snapshot/com.toolkit.figma-snapshot.plist"
  install_agent com.toolkit.figma-audit "$repo/tools/figma-audit/com.toolkit.figma-audit.plist"
  echo "logs: $logs"
  # the snapshot plugin asks once for this machine's pairing code; made here so it is there to print
  "$node_bin" "$repo/tools/snapshot/pairing.cjs" >/dev/null && echo "pairing: the snapshot plugin asks once for this machine's code; node $repo/tools/snapshot/pairing.cjs prints it"
  # retired 2026-10-26: the daily pass repeated what every session's bin/check runs
  launchctl bootout "gui/$(id -u)/com.toolkit.maintain" 2>/dev/null || true
  rm -f "$HOME/Library/LaunchAgents/com.toolkit.maintain.plist"
fi
# a sparse checkout says what it left out, and how to start each by hand once its folder is taken
if [ "$sparse" = true ]; then
  echo "Skipped, since this checkout holds only part of the toolkit (whole skills alone are linked):"
  echo "  the standards guard:     standards/tests/check.sh"
  echo "  the snapshot router:     node tools/snapshot/router.mjs"
  echo "  the figma-audit service: node tools/figma-audit/server.mjs --all"
  echo "  the push hook:           only in a full clone (it runs bin/check, which needs the whole toolkit)"
  echo "The first three run from a folder bin/get must hold: name it there beside the skills you took."
fi

echo "Done. Claude Code now reads skills directly from this repo — edits here are live."
