#!/usr/bin/env python3
"""Tests for scan-tells.py. Run: python3 tests/test-scan-tells.py"""

import subprocess
import sys
from pathlib import Path

SCRIPT = Path(__file__).resolve().parent.parent / "scripts" / "scan-tells.py"

passed = failed = 0


def check(name, text, expect_kinds, args=()):
    """Run the scanner over text and compare the set of kinds reported."""
    global passed, failed
    r = subprocess.run(
        [sys.executable, str(SCRIPT), *args],
        input=text, capture_output=True, text=True,
    )
    def kind_of(line):
        k = line.split("\t")[1].split(" (")[0]
        return "emoji" if k.startswith("emoji") else k

    got = {kind_of(ln) for ln in r.stdout.splitlines() if "\t" in ln}
    want = set(expect_kinds)
    exit_ok = (r.returncode == 1) if want else (r.returncode == 0)
    if got == want and exit_ok:
        passed += 1
    else:
        failed += 1
        print(f"FAIL {name}\n  want {sorted(want)} exit {'1' if want else '0'}"
              f"\n  got  {sorted(got)} exit {r.returncode}")


# Finds each mechanical tell.
check("em dash", "The policy—announced late—failed.", ["em dash"])
check("en dash", "Pages 10–20 are missing.", ["en dash"])
check("curly double", "He said “yes” loudly.", ["curly quote"])
check("curly single", "It’s late.", ["curly quote"])
check("spaced double hyphen", "The change -- long overdue -- shipped.", ["double hyphen as dash"])
check("emoji", "\U0001F680 Launch day", ["emoji"])

# Clean text stays clean, and exits 0.
check("clean prose", "The policy, announced late, failed. Pages 10 to 20 are missing.", [])
check("straight quotes", 'He said "yes" loudly.', [])

# Negative cases: things that look like tells and are not.
check("hyphenated compound", "A cross-functional, data-driven report.", [])
check("command flag", "Run check.sh --strict before release.", [])
check("yaml separator", "---\nname: thing\n---\n", [])
check("arrows are not emoji", "The value → becomes 1.5 (§ 14).", [])
check("minus sign", "Set tracking to −2% for display type.", [])

# The escape hatch honours a voice sample that uses dashes, while still
# reporting the tells that are never a style choice.
check("allow-dashes skips dashes", "The policy—announced late—failed.", [], args=("--allow-dashes",))
check("allow-dashes keeps quotes", "He said “yes”—loudly.", ["curly quote"],
      args=("--allow-dashes",))

# Region awareness. A guide teaching what an em dash looks like has to contain
# one, so tells inside code, blockquotes and inline code are shown but not
# counted. This is the skill's own secondhand-text rule, mechanised.
check("fenced code not counted", "Fine prose.\n```\nlet x = a—b;\n```\nMore prose.", [])
check("blockquote not counted", "Fine prose.\n> The policy—announced late—failed.\n", [])
check("inline code not counted", "Write `a—b` when you mean a range.", [])
check("prose beside a fence still counts",
      "This—here—is prose.\n```\nlet x = a—b;\n```", ["em dash"])
check("prose beside a quote still counts",
      "> quoted—dash\nAnd this—is prose.", ["em dash"])
check("--strict counts quoted hits too",
      "> The policy—announced late—failed.", ["em dash"], args=("--strict",))
check("tilde fences work too", "```\n", [])
check("unclosed fence swallows the rest", "Prose.\n```\ntrailing—dash\n", [])

print(f"\n{passed} passed, {failed} failed")
sys.exit(1 if failed else 0)
