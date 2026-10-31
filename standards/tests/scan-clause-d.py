#!/usr/bin/env python3
"""Candidate scanner for skill-standard §A clause D — no project data in skills/.

Clause D has no mechanical test in the strict sense: whether a literal is one
project's data or a generic illustration is a judgement. What CAN be mechanised
is the shape. This finds the shapes and puts them in front of you.

Illustrative node IDs and property keys in this repo use the `0:` page prefix
by convention (clause D). Anything with another prefix is either real data that
escaped, or a placeholder that should be renumbered — both worth a look.

Clause D's walk-record carve-out (skill-standard §A (then v1.7.0)) does not loosen what
this scans for. A walked case may identify its project by a stand-in and state the
counts and shapes that make its result falsifiable; it still may not carry a
file key, node ID or URL, which is exactly the set below. The carve-out
permits the pointer, never the identifier.

    standards/tests/scan-clause-d.py            # report; exit 1 if any candidate
    standards/tests/scan-clause-d.py --quiet    # only the actionable list

Deliberately NOT wired into install.sh. Judgement calls do not belong in a gate
that blocks a maintainer from installing their own toolkit.
"""
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SKILLS = os.path.join(ROOT, "skills")
EXTS = (".md", ".py", ".js", ".json", ".css", ".html")

# A node ID has a multi-digit suffix (12:345); a contrast ratio in prose does
# not (3:1, 4.5:1). Property keys embed an ID after '#' and are caught whatever
# the suffix length. The `0:` prefix marks a value as illustrative.
#
# A CLOCK is not a node id. `14:32`, `07:41` and the rest matched the same
# shape, and on 2026-09-20 six of this scanner's twelve candidates were times
# inside quoted UI strings — unactionable rows, every run, in a report whose
# whole value is that a person reads each one. A scanner half noise teaches
# its reader to skim, which is the failure the skill it guards records for a
# page filter. The guard is the 24-hour clock's own range, not a tuned number:
# 0-23 hours, 00-59 minutes, in exactly two digits each.
CLOCK = re.compile(r"^(?:[01]\d|2[0-3]):[0-5]\d$")
PATTERNS = [
    ("node-id", re.compile(r"\b(?!0:)\d+:\d{2,}\b")),
    ("prop-key", re.compile(r"#(?!0:)\d+:\d+\b")),
    ("figma-url", re.compile(r"figma\.com/(?:file|design|board)/[A-Za-z0-9]+")),
    ("file-key", re.compile(r"\b(?:fileKey|sourceFileKey)\W{1,4}[\"'][A-Za-z0-9]{15,}")),
    ("long-key", re.compile(r"\b(?=[A-Za-z]*[0-9])(?=[0-9]*[A-Za-z])[A-Za-z0-9]{22}\b")),
]

# Terms that may be one project's own naming rather than a generic word. Never
# actionable on their own — a "Foundations-style file" is a genre, a collection
# literally named "Foundations :: Semantic" is project data.
SOFT = re.compile(r"\b(Foundations|Explorations)\b")



# A skill may write a per-library cache to systems/ beside itself. It legitimately
# holds project data — real file keys, real collection names — is gitignored, and is
# and must not travel with a skill folder. Scanning it would report a hit on
# every run for a file that is behaving correctly, and a scanner that cries wolf
# takes the real finding down with it (the pre-1.2.0 clause C lesson).
SKIP_DIRS = ("systems",)


def scan(root=None):
    hard, soft = [], []
    for dirpath, _dirs, files in os.walk(root or SKILLS):
        if os.path.basename(dirpath) in SKIP_DIRS:
            _dirs[:] = []
            continue
        for fn in sorted(files):
            if not fn.endswith(EXTS):
                continue
            path = os.path.join(dirpath, fn)
            rel = os.path.relpath(path, ROOT)
            try:
                body = open(path).read()
            except (OSError, UnicodeDecodeError):
                continue
            for lineno, line in enumerate(body.split("\n"), 1):
                for label, rx in PATTERNS:
                    for m in rx.finditer(line):
                        if label == "node-id" and CLOCK.match(m.group(0)):
                            continue
                        hard.append((label, rel, lineno, m.group(0), line.strip()[:110]))
                for m in SOFT.finditer(line):
                    soft.append((rel, lineno, m.group(0), line.strip()[:110]))
    return hard, soft


def main():
    quiet = "--quiet" in sys.argv
    # Optional path argument scopes the scan to one skill — useful before
    # handing that folder to a project, so a stray cache elsewhere in skills/
    # does not obscure whether THIS one is clean.
    paths = [a for a in sys.argv[1:] if not a.startswith("--")]
    target = paths[0] if paths else None
    if target and not os.path.isdir(target):
        print(f"no such directory: {target}", file=sys.stderr)
        return 2
    if not os.path.isdir(SKILLS):
        print("no skills/ directory — run from the toolkit repo", file=sys.stderr)
        return 2

    hard, soft = scan(target)

    if hard:
        print(f"{len(hard)} candidate(s) — each needs a read, not a bulk fix:\n")
        for label, rel, lineno, tok, ctx in hard:
            print(f"  [{label}] {tok}")
            print(f"      {rel}:{lineno}")
            print(f"      {ctx}")
    else:
        print("no ID-shaped candidates — illustrative values all use the 0: prefix")

    if soft and not quiet:
        print(f"\n{len(soft)} soft match(es) — usually fine, listed for judgement only:")
        for rel, lineno, tok, ctx in soft:
            print(f"  {tok}  {rel}:{lineno}")
            print(f"      {ctx}")

    if hard:
        print(
            "\nA hit is a violation only if the value came from a real file. An obviously\n"
            "fabricated placeholder is fine by clause D — renumber it to a 0: prefix so it\n"
            "stops showing up here, and the next real one stands out."
        )

    return 1 if hard else 0


if __name__ == "__main__":
    sys.exit(main())
