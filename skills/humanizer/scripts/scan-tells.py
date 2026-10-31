#!/usr/bin/env python3
"""Report the AI writing tells that are pure pattern-matching.

Covers only what a regex can decide without reading for sense: em and en
dashes, spaced double hyphens used as dashes, curly quotes, and emoji.
Everything else in the humanizer skill needs a reader who can tell a quoted
example from a used phrase.

Hits are split by region. A tell inside a fenced code block, a blockquote or
an inline code span is *shown* but not counted, because the skill's own
false-positive guidance says not to rewrite watched phrases inside
quotations or examples: a guide teaching what an em dash looks like has to
contain one. Only prose hits set the exit code.

    python3 scan-tells.py draft.md
    cat draft.md | python3 scan-tells.py
    python3 scan-tells.py --allow-dashes draft.md   # voice sample uses them
    python3 scan-tells.py --strict draft.md         # count quoted hits too
"""

import argparse
import re
import sys
import unicodedata

EM_DASH = "—"
EN_DASH = "–"
CURLY = {"“": '"', "”": '"', "‘": "'", "’": "'"}

# A spaced double hyphen standing in for a dash. Whitespace both sides, so
# command flags (--strict) and YAML separators are left alone.
DOUBLE_HYPHEN = re.compile(r"(?<=\s)--(?=\s)")
FENCE = re.compile(r"^\s*(```|~~~)")
BLOCKQUOTE = re.compile(r"^\s*>")
INLINE_CODE = re.compile(r"`[^`]*`")


def is_emoji(ch: str) -> bool:
    """True for pictographic characters, false for ordinary punctuation.

    Uses block ranges rather than a name lookup, because characters a writer
    legitimately uses (arrows, box drawing, the section sign) sit in So/Sk
    alongside the pictographs.
    """
    cp = ord(ch)
    return (
        0x1F300 <= cp <= 0x1FAFF          # pictographs, transport, symbols
        or 0x1F000 <= cp <= 0x1F02F        # mahjong, dominoes
        or 0x2600 <= cp <= 0x27BF          # misc symbols and dingbats
        or cp == 0xFE0F                    # variation selector 16
        or 0x1F1E6 <= cp <= 0x1F1FF        # regional indicators (flags)
    )


def code_spans(line: str):
    """Column ranges (1-based, inclusive) covered by inline code."""
    return [(m.start() + 1, m.end()) for m in INLINE_CODE.finditer(line)]


def context(line: str, col: int, width: int = 34) -> str:
    start = max(0, col - width // 2)
    return ("..." if start else "") + line[start:start + width].rstrip("\n")


def scan(text: str, allow_dashes: bool = False):
    """Return (prose_hits, quoted_hits), each a sorted list of tuples."""
    prose, quoted = [], []
    in_fence = False

    for lineno, line in enumerate(text.splitlines(), start=1):
        if FENCE.match(line):
            in_fence = not in_fence
            continue

        line_quoted = in_fence or bool(BLOCKQUOTE.match(line))
        spans = code_spans(line)

        def bucket(col):
            if line_quoted or any(a <= col <= b for a, b in spans):
                return quoted
            return prose

        for col, ch in enumerate(line, start=1):
            if not allow_dashes and ch == EM_DASH:
                bucket(col).append((lineno, col, "em dash", context(line, col)))
            elif not allow_dashes and ch == EN_DASH:
                bucket(col).append((lineno, col, "en dash", context(line, col)))
            elif ch in CURLY:
                bucket(col).append(
                    (lineno, col, f"curly quote (use {CURLY[ch]})", context(line, col))
                )
            elif is_emoji(ch):
                name = unicodedata.name(ch, "emoji")
                bucket(col).append(
                    (lineno, col, f"emoji {name.lower()}", context(line, col))
                )

        if not allow_dashes:
            for m in DOUBLE_HYPHEN.finditer(line):
                c = m.start() + 1
                bucket(c).append((lineno, c, "double hyphen as dash", context(line, c)))

    return sorted(prose), sorted(quoted)


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("file", nargs="?", help="file to scan; omit to read stdin")
    ap.add_argument(
        "--allow-dashes",
        action="store_true",
        help="skip dash checks, for when a voice sample uses them",
    )
    ap.add_argument(
        "--strict",
        action="store_true",
        help="count hits in code, blockquotes and inline code as well",
    )
    args = ap.parse_args()

    if args.file:
        try:
            text = open(args.file, encoding="utf-8").read()
        except OSError as e:
            print(f"cannot read {args.file}: {e}", file=sys.stderr)
            return 2
    else:
        text = sys.stdin.read()

    prose, quoted = scan(text, allow_dashes=args.allow_dashes)
    if args.strict:
        prose, quoted = sorted(prose + quoted), []

    for lineno, col, kind, ctx in prose:
        print(f"{lineno}:{col}\t{kind}\t{ctx}")

    if quoted:
        print(f"\n{len(quoted)} hit(s) in code, quotes or examples, not counted:",
              file=sys.stderr)
        for lineno, col, kind, ctx in quoted:
            print(f"  {lineno}:{col}\t{kind}\t{ctx}", file=sys.stderr)

    if prose:
        print(f"\n{len(prose)} tell(s) in prose", file=sys.stderr)
        return 1
    print("clean", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
