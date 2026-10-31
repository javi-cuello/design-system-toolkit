#!/bin/sh
# Clause F structural check: every SKILL.md frontmatter carries exactly
# `name` and `description`, each on its own line, within the Agent Skills
# specification's limits — name 1-64 chars of [a-z0-9-] with no leading,
# trailing or doubled hyphen and matching its parent directory; description
# 1-1024 chars once folded.
#
# Exists because a reflow once folded the two onto one line across five
# skills, and the whitespace-insensitive diff verifying that reflow could not
# see it — collapsing a newline is itself a whitespace change. See
# standards/toolkit-standard.md clause F.
#
# Usage: standards/tests/check-frontmatter.sh [file ...]
#        defaults to skills/*/SKILL.md, run from the repo root.

set -u

files=$*
[ -n "$files" ] || files=$(ls skills/*/SKILL.md 2>/dev/null)
[ -n "$files" ] || { echo "no SKILL.md found — run from the repo root"; exit 2; }

rc=0
for f in $files; do
    # Keys are read only from the frontmatter block, and only at line start,
    # so a `: ` inside a description value is never mistaken for a key.
    keys=$(awk '/^---$/{c++; next} c==1 && /^[a-z_-]+:/{printf "%s ", $1} c==2{exit}' "$f")
    case "$keys" in
        "name: description: ")
            dir=$(basename "$(dirname "$f")")
            nm=$(awk '/^---$/{c++; next} c==1 && /^name:/{sub(/^name:[ \t]*/,""); print; exit}' "$f")
            # Fold the description the way YAML folds a plain multi-line
            # scalar — join continuation lines with a single space — then
            # measure. Counting raw bytes would over-count by the indent.
            # `wc -m`, not awk's length(): awk here counts bytes, and an em
            # dash is three of them, so a byte count over-reports a description
            # written in this repo's prose by tens of characters near the cap.
            dlen=$(awk '/^---$/{c++; next}
                        c==1 && /^description:/{sub(/^description:[ \t]*/,""); v=$0; d=1; next}
                        c==1 && d && /^[a-zA-Z_-]+:/{d=0}
                        c==1 && d{sub(/^[ \t]+/,""); if ($0 != "") v=v" "$0}
                        c==2{exit}
                        END{printf "%s", v}' "$f" | wc -m | tr -d ' ')
            # A plain (unquoted) scalar may not hold `: ` or ` #`: YAML reads
            # the first as a mapping and the second as a comment, and the
            # loader drops the description. Four skills shipped that way.
            plain=$(awk '/^---$/{c++; next} c==1 && /^description:/{sub(/^description:[ \t]*/,""); print; exit}' "$f")
            case "$plain" in
                \"*|\'*|\>*|\|*) ;;
                *": "*|*" #"*)
                    echo "FAIL $f — description: holds ': ' or ' #' unquoted; quote it"
                    rc=1 ;;
            esac
            if [ "$nm" != "$dir" ]; then
                echo "FAIL $f — name: '$nm' does not match directory '$dir'"
                rc=1
            elif ! printf '%s' "$nm" | grep -qE '^[a-z0-9]+(-[a-z0-9]+)*$'; then
                echo "FAIL $f — name: '$nm' is not lowercase [a-z0-9] with single hyphens"
                rc=1
            elif [ ${#nm} -gt 64 ]; then
                echo "FAIL $f — name: is ${#nm} chars, over the 64-char limit"
                rc=1
            fi
            if [ "$dlen" -gt 1024 ]; then
                echo "FAIL $f — description: is $dlen chars, over the 1024-char limit"
                rc=1
            elif [ "$dlen" -eq 0 ]; then
                echo "FAIL $f — description: is empty"
                rc=1
            fi
            ;;
        "name: ")
            echo "FAIL $f — description: folded into name:, or missing"
            rc=1
            ;;
        *)
            echo "FAIL $f — unexpected frontmatter keys: [$keys]"
            rc=1
            ;;
    esac
done

[ $rc -eq 0 ] && echo "pass — $(echo "$files" | wc -w | tr -d ' ') file(s), frontmatter intact"
exit $rc
