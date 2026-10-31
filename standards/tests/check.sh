#!/bin/bash
# One checker for the repo: skills, standards, plugins.
#
# Replaced three scripts on 2026-08-08. They had grown to 509 lines between them
# and, apart from ~50 lines in the skills half, had never caught anything real —
# every genuine defect that day was found by reading a file. What survives here
# is the checks that fired on real content, plus the one that holds ui-base's
# copies, which a single-document plugin UI cannot do without, to the sync.
#
# Severity: only what breaks at load time errors. Folded frontmatter stops a
# skill firing; an unparseable manifest or a wrong documentAccess stops a plugin
# running; a ui-base copy that differs (plugins/_shared/sync.mjs) renders differently from the
# baseline it claims to inline. Everything else is debt and warns, because
# refusing to install over debt leaves you with no toolkit rather than an
# imperfect one. --strict promotes warnings, for a release gate.
#
# KNOWN BLIND SPOT: every structural check here reads unfenced content, so that a
# standard can quote the shapes it mandates without tripping its own rules. The
# cost is that anything inside a fence is invisible to all of them — three real
# changelog entries once sat in an example block while the file declared a
# version its changelog had never reached, and this script reported clean. Do not
# fix that by peering into fences; telling an illustration from real content is a
# judgement. Assert an invariant a fence cannot hide instead, the way the
# version-in-changelog check does.
#
# Usage: standards/tests/check.sh [--strict]

set -u

strict=0
[ "${1:-}" = "--strict" ] && strict=1

here=$(cd "$(dirname "$0")" && pwd)
repo=$(cd "$here/../.." && pwd)
cd "$repo" || exit 2

in_git=0
git rev-parse --verify HEAD >/dev/null 2>&1 && in_git=1

errors=0
warns=0
# Clause E's per-case walk markers, counted rather than warned per skill.
# One coverage line at the end, because 22 warnings on the day a check ships
# is the check teaching people to scroll — the failure the clause names.
CASES_TOTAL=0
CASES_MARKED=0
CASES_BEHIND=""
warn() { echo "warn   $*"; warns=$((warns + 1)); }
err()  { echo "ERROR  $*"; errors=$((errors + 1)); }

unfenced() { awk '/^```/ { f = !f; next } !f' "$1"; }

# ─── skills ────────────────────────────────────────────────────────────────
if [ -d skills ]; then
    fm=$("$here/check-frontmatter.sh" skills/*/SKILL.md 2>&1)
    if [ $? -ne 0 ]; then
        echo "$fm" | grep '^FAIL' | sed 's/^FAIL/ERROR  [F]/'
        errors=$((errors + $(echo "$fm" | grep -c '^FAIL')))
    fi

    # skill-standard §A clause H: the toolkit paths a skill names, read by the one reader bin/get
    # takes them with, so what is warned here is what a skill taken alone would lack. Outside git
    # (a copy with no history) there is nothing for it to read.
    named_missing=""
    if [ "$in_git" = 1 ] && [ -x bin/get ]; then
        # the skills HEAD holds: one not yet committed would stop bin/get for all of them
        named_missing=$(node bin/get --list $(git ls-tree -d --name-only HEAD skills/) 2>&1 >/dev/null) || warn "[H] the paths skills name were not read: $(printf '%s' "$named_missing" | tail -1)"
        named_missing=$(printf '%s\n' "$named_missing" | grep 'which the toolkit does not have')
    fi

    for d in skills/*/; do
        s=$(basename "$d"); f="${d}SKILL.md"
        [ -f "$f" ] || { warn "[A] $s — no SKILL.md"; continue; }
        # skill-standard §A clause H: a skill may run toolkit tools by repo path, and never reads
        # another skill's files (`../../<skill>/…`, `../../../skills/<skill>/…`, any file in it);
        # its own `../scripts/` from tests/ is its own.
        esc=$(grep -rEno '(\.\./)+(skills/)?[a-z0-9-]+/' "$d" 2>/dev/null | awk -F: -v s="$s" -v all=" $(ls skills | tr '\n' ' ') " \
            '{ n = $3; sub(/^(\.\.\/)+/, "", n); sub(/^skills\//, "", n); sub(/\/$/, "", n) } n != s && index(all, " " n " ")' | head -3)
        [ -n "$esc" ] && warn "[H] $s reads another skill's files: $(printf '%s' "$esc" | sed "s|^$d||" | cut -d: -f1,2 | paste -sd' ' -)"
        nm=$(printf '%s\n' "$named_missing" | grep "^skills/$s/" | head -3)
        [ -n "$nm" ] && warn "[H] $s names what the toolkit does not have: $(printf '%s' "$nm" | sed "s|^$d||; s|, which the toolkit does not have||" | paste -sd';' -)"

        sv=$(grep -m1 -oE '\*\*Version [0-9]+\.[0-9]+\.[0-9]+\*\*' "$f" | grep -oE '[0-9]+\.[0-9]+\.[0-9]+')
        [ -n "$sv" ] || warn "[A] $s — no '**Version X.Y.Z**' line"
        # History lives in CHANGELOG.md beside SKILL.md, one line per version
        # (skill-standard §A clause A): the skill file carries rules only, and a
        # reason written into history stops governing anything.
        h="${d}CHANGELOG.md"
        unfenced "$f" | grep -q '^## Changelog' && warn "[A] $s — SKILL.md carries a ## Changelog; history lives in CHANGELOG.md"
        if [ ! -f "$h" ]; then
            warn "[A] $s — no CHANGELOG.md"
        else
            [ -n "$sv" ] && ! grep -q "^- $sv " "$h" && warn "[A] $s — declares v$sv with no matching changelog entry"
            # Entry length and order are the guard's (tools/toolkit-check/check-standards.mjs).
        fi

        # Bare 'client' only; clientStorage is a Figma API name.
        n=$(grep -oiE 'client[a-z]*' "$f" | grep -ciE '^clients?$')
        [ "$n" -eq 0 ] || warn "[C] $s — $n bare 'client'; the vocabulary is 'project'"

        c="${d}tests/cases.md"
        if [ ! -f "$c" ]; then
            warn "[E] $s — no tests/cases.md"
        else
            n=$(grep -c '^## ' "$c"); [ "$n" -ge 3 ] || warn "[E] $s — $n case(s), the floor is 3"
            grep -q 'Walked:' "$c" || warn "[E] $s — no 'Walked:' line"
            # Per-case walk markers. A file-level "Walked:" line averages its
            # cases: a suite can be green while one case is reached by nothing.
            # Counted per case, so what a checker reports is how much of a
            # cases file is claim and how much is record.
            #
            # Counted per case, not per file: a case with two markers once hid
            # a case with none. Every case is marked, so a new one without a
            # marker warns.
            unmarked=$(awk '/^## /{if(h&&!m)print h; h=$2; m=0} /^(Runs:|Walked live:|Traced:|Read by:|Not walked\.)/{m=1} END{if(h&&!m)print h}' "$c" | tr '\n' ' ')
            CASES_TOTAL=$((CASES_TOTAL + n))
            CASES_MARKED=$((CASES_MARKED + n - $(printf '%s' "$unmarked" | wc -w)))
            [ -z "$unmarked" ] || { CASES_BEHIND="$CASES_BEHIND $s"; warn "[E] $s — case(s) $unmarked say not how they were walked (skill-standard §A clause E)"; }
            # The header names the SKILL.md revision the cases were last reviewed
            # against. Drift is a prompt to decide, not a defect — six of thirteen
            # disagreed when this was written.
            cv=$(head -1 "$c" | grep -oE 'v[0-9]+\.[0-9]+\.[0-9]+' | head -1 | tr -d 'v')
            [ -n "$cv" ] && [ -n "$sv" ] && [ "$cv" != "$sv" ] &&
                warn "[A] $s — cases reviewed against v$cv, skill is at v$sv"
        fi

        # Clause G — executable code lives in scripts/ (tests in tests/), named
        # kebab-case, with no install step. Five skills carried code when this
        # was written and they disagreed three ways: two put it at the skill
        # root, three used snake_case, tests landed in three different places.
        # Debt, never blocking: moving a documented entry point breaks every
        # invocation in that skill's SKILL.md, so migration is a decision.
        stray=$(find "$d" -maxdepth 1 -type f \( -name '*.js' -o -name '*.py' \) 2>/dev/null | wc -l | tr -d ' ')
        [ "$stray" -eq 0 ] || warn "[G] $s — $stray executable file(s) at the skill root; clause G says scripts/"
        for x in $(find "$d" -type f \( -name '*.js' -o -name '*.py' \) 2>/dev/null); do
            b=$(basename "$x")
            case "$b" in *_*) warn "[G] $s — $b is snake_case; clause G says kebab-case";; esac
        done
        [ -f "${d}package.json" ] && warn "[G] $s — package.json; clause G says no install step"
        # The prose tell (clause G, 1.8.0): a fenced code block of eight lines
        # or more in SKILL.md or a reference (indented fences too) asks an
        # agent to paste an engine each run. Exempt: a block every one of whose
        # `function`/`const` names is defined in the skill's scripts/ (an
        # account of shipped code; one shared name is not, which exempted a
        # 27-line paste-and-run engine). One line per skill, with the count;
        # the blocks are the debt.
        blocks=$(cat "${d}SKILL.md" $(find "${d}references" -name '*.md' 2>/dev/null) 2>/dev/null | awk -v scripts="$(cat $(find "${d}scripts" -type f \( -name '*.js' -o -name '*.mjs' -o -name '*.cjs' -o -name '*.py' \) 2>/dev/null) /dev/null 2>/dev/null | grep -oE '(function|const|def) +[A-Za-z_][A-Za-z0-9_]*' | sed -E 's/^(function|const|def) +//' | sort -u | tr '\n' ' ')" '
            /^[ \t]*```(js|javascript|mjs|python)([^a-z]|$)/ { inb = 1; n = 0; defined = 0; shipped = 0; next }
            /^[ \t]*```/ { if (inb && n >= 8 && !(defined > 0 && defined == shipped)) k++; inb = 0; next }
            inb { n++; line = $0; while (match(line, /(function|const|def) +[A-Za-z_][A-Za-z0-9_]*/)) { name = substr(line, RSTART, RLENGTH); sub(/^(function|const|def) +/, "", name); defined++; if (index(" " scripts " ", " " name " ")) shipped++; line = substr(line, RSTART + RLENGTH) } }
            END { print k + 0 }')
        [ "${blocks:-0}" -eq 0 ] || warn "[G] $s — $blocks fenced code block(s) of 8+ lines in its prose; clause G says an engine in scripts/"

        # Changed without a bump. Changes confined to tests/ are exempt, or this
        # chases the header check above forever (skill-standard §A clause A).
        if [ "$in_git" -eq 1 ] && [ -n "$(git diff --name-only HEAD -- "$d" 2>/dev/null | grep -v '/tests/' | head -1)" ]; then
            old=$(git show "HEAD:${d%/}/SKILL.md" 2>/dev/null | grep -m1 -oE '\*\*Version [0-9]+\.[0-9]+\.[0-9]+\*\*' | grep -oE '[0-9]+\.[0-9]+\.[0-9]+')
            [ -n "$old" ] && [ "$old" = "$sv" ] &&
                warn "[A] $s — changed since HEAD but still v$sv; bump it in the same commit"
        fi
    done

    echo
    echo "[B] no context block (correct only if these read no per-project config):"
    echo "    $(for d in skills/*/; do grep -q '^## Project context first' "${d}SKILL.md" 2>/dev/null || basename "$d"; done | tr '\n' ' ')"
fi

# ─── standards ─────────────────────────────────────────────────────────────
# Versions, history files, rule markers and citations are check-standards.mjs's
# (toolkit-standard §C); this keeps only the scope line, which is shape.
if [ -d standards ]; then
    for f in standards/*-standard.md; do
        s=$(basename "$f" .md)
        unfenced "$f" | grep -qE '^# .+ — .+' || warn "[B] $s — H1 states no scope after an em dash"
    done
fi

# ─── plugins ───────────────────────────────────────────────────────────────
# Only what stops a plugin running, plus the ui-base duplication that cannot be
# removed. Field-by-field manifest checking was dropped: skill-standard §B is a
# read, and it never fired.
if [ -d plugins ]; then

    for d in plugins/*/; do
        p=$(basename "$d"); [ "$p" = "_shared" ] && continue
        for f in manifest.json code.js ui.html; do
            [ -f "$d$f" ] || warn "[1] $p — missing $f"
        done
        # §1 also mandates the no-build type-check pair. Warns rather than errors:
        # a missing pragma is conformance debt, not a plugin Figma refuses to load.
        [ -f "${d}tsconfig.json" ] || warn "[1] $p — missing tsconfig.json (skill-standard §B 1)"
        if [ -f "${d}code.js" ] && [ "$(sed -n 2p "${d}code.js")" != "// @ts-check" ]; then
            if grep -q '@ts-check' "${d}code.js"; then
                warn "[1] $p — // @ts-check present but not on code.js line 2 (skill-standard §B 1)"
            else
                warn "[1] $p — code.js has no // @ts-check (skill-standard §B 1)"
            fi
        fi
        # Figma evaluates code.js as a script; `node --check` reads it as
        # CommonJS, where a top-level `return` is legal, so it missed the one
        # that killed the snapshot plugin for a day.
        if [ -f "${d}code.js" ] && ! node -e 'new (require("vm").Script)(require("fs").readFileSync(process.argv[1], "utf8"), { filename: process.argv[1] })' "${d}code.js" 2>/dev/null; then
            err "[1] $p — code.js does not parse as a script (a top-level return?): $(node -e 'try { new (require("vm").Script)(require("fs").readFileSync(process.argv[1], "utf8")) } catch (e) { console.log(e.message) }' "${d}code.js")"
        fi
        # §B 8: package.json is the version's one source. A README stating its
        # own drifted on two plugins (2.0.0 against 2.0.3, 1.0.0 against 1.11.0).
        rv=$(grep -m1 -oE '\*\*Version [0-9]+\.[0-9]+\.[0-9]+\*\*' "${d}README.md" 2>/dev/null | grep -oE '[0-9.]+[0-9]')
        pv=$(grep -m1 -oE '"version": *"[^"]+"' "${d}package.json" 2>/dev/null | grep -oE '[0-9]+\.[0-9]+\.[0-9]+')
        [ -n "$rv" ] && [ "$rv" != "$pv" ] && warn "[8] $p — README says v$rv, package.json v${pv:-none} (skill-standard §B 8)"
        # and code.js's header line, which drifted the same way (1.11.0 against 1.11.2, 2026-10-03)
        cv=$(sed -n 1p "${d}code.js" 2>/dev/null | grep -m1 -oE 'v[0-9]+\.[0-9]+\.[0-9]+' | head -1 | tr -d v)
        [ -n "$cv" ] && [ "$cv" != "$pv" ] && warn "[8] $p — code.js header says v$cv, package.json v${pv:-none} (skill-standard §B 8)"
        m="${d}manifest.json"; [ -f "$m" ] || continue

        if ! python3 -c "import json,sys; json.load(open(sys.argv[1]))" "$m" 2>/dev/null; then
            err "[2] $p — manifest.json does not parse; Figma cannot load it"
            continue
        fi
        python3 - "$m" <<'PY' || err "[2] $p — documentAccess must be \"dynamic-page\""
import json, sys
sys.exit(0 if json.load(open(sys.argv[1])).get("documentAccess") == "dynamic-page" else 1)
PY
        python3 - "$m" <<'PY' || err "[2] $p — ships enableProposedApi, which must never be published"
import json, sys
sys.exit(1 if "enableProposedApi" in json.load(open(sys.argv[1])) else 0)
PY
        # A gated API without its permission throws on every call, at runtime,
        # in the file — and a plugin that guards those calls turns the throw
        # into an empty list and reports nothing. theme-switcher shipped three
        # versions and passed two live tests that way. §B 2.
        if [ -f "${d}code.js" ] && grep -q 'figma\.teamLibrary' "${d}code.js"; then
            python3 - "$m" <<'PY' || err "[2] $p — calls figma.teamLibrary without the \"teamlibrary\" permission in manifest.json (skill-standard §B 2)"
import json, sys
sys.exit(0 if "teamlibrary" in (json.load(open(sys.argv[1])).get("permissions") or []) else 1)
PY
        fi

    done

    # Every copy of ui-base (each plugin's block, the plugin creator's template
    # and asset) is written by plugins/_shared/sync.mjs, never pasted
    # (toolkit-standard §D 23); a copy that differs is stale until it runs.
    out=$(node plugins/_shared/sync.mjs --check 2>&1) || err "[4] ui-base: $out"
fi

# ─── markdown structure ────────────────────────────────────────────────────
# Both of these fired on real content the day they were written, which is the
# only reason they exist. A bulk edit to markdown produces text that parses,
# passes every other check here, and means something slightly wrong — the two
# observed shapes are a table flattened onto one line and a code fence left
# open. Neither is visible in a diff stat, and both survive a careful read of
# the *diff* because what broke is the structure around the change.
#
# Deliberately narrow: these two shapes only. A general markdown linter would
# report style, and style is not what went wrong.
while IFS= read -r f; do
    # 1. Fence balance. An odd count means everything after the last fence
    #    renders as code. Observed after deleting fenced blocks by line range:
    #    the closing fence went, the opening one stayed.
    #    grep -c exits 1 on zero matches, so do NOT chain `|| echo 0` — that
    #    prints a second zero and the arithmetic below dies. (Caught by this
    #    very check failing to run on the tree it was written for.)
    n=$(grep -c '^```' "$f")
    [ $((n % 2)) -eq 0 ] || warn "[MD] $f — $n code fences, unbalanced (a block left open)"

    # 2. Table separator embedded mid-line. A well-formed separator row is the
    #    whole line; finding one inside a longer line means the table's rows
    #    were joined. Observed as a 5-row table on one 674-char line, rendering
    #    as a paragraph of pipes with every checker green.
    hits=$(awk '
      /^```/ { fence = !fence; next }
      fence  { next }
      /\|[[:space:]]*:?-{3,}/ {
        if ($0 ~ /^[[:space:]]*\|?([[:space:]]*:?-{3,}:?[[:space:]]*\|)+[[:space:]]*$/) next
        print FNR
      }
    ' "$f")
    for ln in $hits; do
        warn "[MD] $f line $ln — table separator inside a longer line (rows joined onto one?)"
    done

    # 3. A table row whose cell count disagrees with its own header. A pipe
    #    inside a cell splits the row there, so the row silently stops being a
    #    row: the author sees a table in their own source and the reader gets
    #    key-value prose. Escaping it as \| does NOT help — terminal renderers
    #    do not honour the escape — which is why an escaped pipe is reported
    #    too, and why the fix is always · or a reword, never a backslash.
    #    Compared against each table's OWN header rather than a fixed number,
    #    because one file here carries 3-, 4- and 5-column tables and any fixed
    #    expectation flags most rows while hiding the broken ones.
    #    Added 2026-09-01 after it would have caught two live defects in one
    #    project document: a row written that day with two literal pipes in a
    #    cell, and a pre-existing row using \| that had rendered wrongly for
    #    weeks. Both passed checks 1 and 2.
    hits=$(awk '
      /^```/ { fence = !fence; next }
      fence  { next }
      {
        line = $0
        if (line !~ /^[[:space:]]*\|/) { hdr = 0; next }
        if (line ~ /^[[:space:]]*\|?([[:space:]]*:?-{3,}:?[[:space:]]*\|)+[[:space:]]*$/) next
        esc = (index(line, "\\|") > 0)
        stripped = line
        gsub(/\\\|/, "", stripped)
        n = gsub(/\|/, "|", stripped)
        if (hdr == 0) { hdr = n; if (esc) print FNR "\tescaped pipe in a cell"; next }
        if (n != hdr) print FNR "\t" n " cells vs header " hdr
        else if (esc) print FNR "\tescaped pipe in a cell"
      }
    ' "$f")
    # NOT `printf … | while`: a pipeline runs in a subshell, so `warn`
    # incremented a copy of the counter and the increment died with the
    # subshell — this check printed its warnings and never raised the count,
    # which meant `--strict`, the release gate, reported "pass … clean" on a
    # run where this was the only finding. `printf '%s'` also writes no
    # trailing newline, so `read` dropped the LAST hit as well. The rule is
    # stated in the comment eight lines below, and this was the violation of
    # it. Proven both ways before the change: piped, two hits counted 0 and
    # read 1; as a heredoc, 2 and 2.
    while IFS=$(printf '\t') read -r ln msg; do
        [ -n "$ln" ] && warn "[MD] $f line $ln — $msg (a pipe inside a cell un-tables the row; use ·)"
    done <<INNER
$hits
INNER
done <<EOF
$(find . -name '*.md' -not -path './.git/*' -not -path '*/node_modules/*' | sort)
EOF

# ─── a skill that tells a project to write the code the toolkit should ship ─
# toolkit-standard §D 2: method a project follows is prose; code each project
# would write the same way is the toolkit's. The parity skill said "A second
# project writes its own scripts to this contract" for a month, and two
# projects did (one adapter, schema and differ each). The sentence is the
# tell. A warning: prose can quote the old wording as history.
while IFS=: read -r f n line; do
    [ -n "$f" ] || continue
    warn "[D2] $f:$n — tells a project to write its own code (§D 2 ships it instead): $(printf '%s' "$line" | sed 's/^ *//' | cut -c1-80)"
done <<EOF
$(grep -n -i -E '\b(project|repo) (writes|builds|implements) its own (scripts?|adapter|differ|schema|runner|engine|gate|parser|reader|writer|comparison|loop)\b' skills/*/SKILL.md 2>/dev/null | grep -v -i -E 'until 1\.[0-9]|for a month|the sentence')
EOF

# ─── CLAUDE.md stays a pointer file ────────────────────────────────────────
# It is read in full by every session, so its size is paid every time. It grew
# to 23 KB restating rules the standards own, while an always-loaded context
# file is the costliest place for a rule (2026-10-03). The rules live in the
# standards; this file points at them.
if [ -f CLAUDE.md ]; then
    cl=$(wc -c < CLAUDE.md | tr -d ' ')
    [ "$cl" -le 8000 ] || warn "[CL] CLAUDE.md is $cl bytes, over its 8000 budget: move what a standard owns into it and point there"
fi

# ─── commands a doc tells you to run ───────────────────────────────────────
# `node <path>` into the toolkit's own folders, and `./bin/<x>`, must exist.
# A bare `bin/<x>` is not checked: docs name a project repo's bin/ (tokens,
# parity, validate) as often as this one's. A path holding a placeholder
# (<name>, *, $) is skipped whole: it was once cut at the placeholder instead,
# so `node tools/parity/test-*.mjs` was checked as `tools/parity/test-`.
# Fired on a case citing tools/figma-audit/check.mjs, which had moved to
# tools/docs-site/src/dashboard/check.mjs. A warning: prose can quote an old path.
while IFS=: read -r f c; do
    case "$c" in *[\<\>\*\$]*) continue ;; esac
    [ -e "${c#./}" ] || warn "[CMD] $f — runs $c, which does not exist"
done <<EOF
$(grep -oE "(node (tools|skills|standards|plugins)/|\./bin/)[^][:space:]\`'\")]+" README.md CLAUDE.md standards/*.md skills/*/tests/cases.md 2>/dev/null |
  sed -E 's/:node /:/; s/[.,;:]+$//' | sort -u)
EOF

# A case's `Runs:` line names assertions that still exist in the test it names:
# a renamed or deleted test left cases quoting what nothing runs.
if ! out=$(node tools/toolkit-check/check-runs.mjs 2>&1); then
    printf '%s\n' "$out" | while IFS= read -r l; do echo "ERROR  [E] $l"; done
    errors=$((errors + $(printf '%s\n' "$out" | grep -c .)))
fi

# How much of the repo's cases are a record rather than a claim. A figure
# that moves, not a wall of warnings: the same reason the root standard computes
# a rule's coverage with a command instead of printing it every run.
if [ "$CASES_TOTAL" -gt 0 ]; then
    behind=$(printf '%s' "$CASES_BEHIND" | wc -w | tr -d ' ')
    echo
    if [ "$CASES_MARKED" -ge "$CASES_TOTAL" ]; then
        echo "clause E: all $CASES_TOTAL cases say how they were walked"
    else
        echo "clause E: $CASES_MARKED of $CASES_TOTAL cases say how they were walked — $behind skill(s) to migrate"
        echo "          Runs: / Walked live: / Traced: / Read by: / Not walked.  (skill-standard §A clause E)"
    fi
fi

# ─── tools: the dashboard is one long script in one scope ───────────────────
# No `| while` here: a pipeline runs in a subshell, so err()'s count would be
# incremented in a shell that exits before the summary reads it.
# It lives with the page it checks, in the docs engine (tools/docs-site/src/dashboard).
if [ -f tools/docs-site/src/dashboard/check.mjs ] && [ ! -d tools/docs-site/node_modules ]; then
    # a fresh clone: the docs engine's packages are not installed yet
    echo "ERROR  [TOOLS] the docs site's packages are not installed: run (cd tools/docs-site && pnpm install), then check again"
    errors=$((errors + 1))
elif [ -f tools/docs-site/src/dashboard/check.mjs ]; then
    if ! out=$(node tools/docs-site/src/dashboard/check.mjs 2>&1); then
        printf '%s\n' "$out" | sed 's/^FAIL  /ERROR  [TOOLS] dashboard page — /'
        errors=$((errors + 1))
    fi
fi

# ─── summary ───────────────────────────────────────────────────────────────
echo
if [ "$strict" -eq 1 ] && [ "$warns" -gt 0 ]; then errors=$((errors + warns)); warns=0; fi
if [ "$errors" -gt 0 ]; then
    echo "FAIL — $errors error(s)$([ "$warns" -gt 0 ] && echo ", $warns warning(s)")"; exit 1
fi
[ "$warns" -gt 0 ] && { echo "pass with debt — $warns warning(s)"; exit 0; }
echo "pass — skills, standards and plugins clean"
