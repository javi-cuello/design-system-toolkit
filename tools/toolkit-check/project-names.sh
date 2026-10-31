#!/bin/sh
# The project names the toolkit may never carry, as one extended regex: every
# label, and each project repo's own name, organisation and host (projects.cjs
# names). Words match with or without a separator, so "acme-web", "acme web"
# and a domain like "acmeweb.example" are one name. Prints nothing where this
# machine has no projects (a fresh clone); exits 1, saying why, where the names
# could not be read: a crash must never read as no projects. Read by bin/check
# (the files) and .githooks/pre-push (the commit messages).
ERR=$(mktemp)
RAW=$(node "$(dirname "$0")/../snapshot/projects.cjs" names 2>"$ERR") || { echo "the project names could not be read: $(head -5 "$ERR")" >&2; rm -f "$ERR"; exit 1; }
rm -f "$ERR"
printf '%s\n' "$RAW" | grep -v '^[-_.[:space:]]*$' | sed -E 's/[][\\^$*+?(){}|/]/\\&/g; s/[-_.[:space:]]+/[-_. ]?/g' | sed '/^$/d' | paste -sd'|' -
