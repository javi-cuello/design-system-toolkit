#!/usr/bin/env python3
"""Executable half of tests/cases.md, cases A1-A8, A11, A14 and A16.

The core of this skill is arithmetic, so most of it is testable without Figma.
Run from the skill directory:

    python3 tests/test-matrix.py

A9 and A10 describe behaviour in a live Figma session and are not covered here.
"""
import importlib.util
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
SKILL = os.path.dirname(HERE)

spec = importlib.util.spec_from_file_location(
    "bm", os.path.join(SKILL, "scripts", "build-matrix-script.py"))
bm = importlib.util.module_from_spec(spec)
spec.loader.exec_module(bm)
NODE_MAP = json.load(open(os.path.join(SKILL, "references", "node-map.example.json")))

_ok = _fail = 0
_case = ""


def case(name):
    global _case
    _case = name
    print(f"\n{name}")


def chk(name, cond, detail=""):
    global _ok, _fail
    print(f"  {'PASS' if cond else 'FAIL'}  {name}{('  — ' + detail) if detail else ''}")
    if cond:
        _ok += 1
    else:
        _fail += 1


def raises(fn):
    try:
        fn()
        return False
    except Exception:
        return True


A = ["#FBFDFE", "#F4F9FF", "#E3F0FF", "#D2E7FF", "#C1DEFF", "#92BFF1",
     "#6A9FDB", "#3F80C5", "#0061B0", "#005088", "#003F6E", "#002F55"]
B = ["#F8FFFA", "#EAFEF0", "#DBF7E3", "#CAF0D6", "#B8E9C7", "#8ECBA3",
     "#63AE7F", "#31925C", "#007348", "#005D39", "#004A2D", "#003820"]

# --- A1: maths matches the WCAG definition ---------------------------------
case("A1 · Contrast maths matches the WCAG definition")
r = bm.contrast_ratio("#000000", "#FFFFFF")
chk("black/white == 21.00", abs(r - 21.0) < 0.005, f"got {r:.4f}")
chk("identical colours == 1.00", abs(bm.contrast_ratio("#7F7F7F", "#7F7F7F") - 1.0) < 1e-9)
chk("#767676 on white >= 4.5 (canonical AA grey)",
    bm.contrast_ratio("#767676", "#FFFFFF") >= 4.5,
    f"{bm.contrast_ratio('#767676', '#FFFFFF'):.4f}")
chk("#777777 on white < 4.5 (one step lighter fails)",
    bm.contrast_ratio("#777777", "#FFFFFF") < 4.5,
    f"{bm.contrast_ratio('#777777', '#FFFFFF'):.4f}")
chk("ratio is symmetric",
    bm.contrast_ratio("#123456", "#ABCDEF") == bm.contrast_ratio("#ABCDEF", "#123456"))

# --- A2: banding inclusive at both boundaries ------------------------------
case("A2 · Threshold banding is inclusive at both boundaries")
chk("21.00 -> '4.5'", bm.pass_variant_for_ratio(21.0) == "4.5")
chk("exactly 4.5 -> '4.5'", bm.pass_variant_for_ratio(4.5) == "4.5")
chk("4.49 -> '3.1'", bm.pass_variant_for_ratio(4.49) == "3.1")
chk("exactly 3.0 -> '3.1' (lower boundary inclusive)", bm.pass_variant_for_ratio(3.0) == "3.1")
chk("1.00 -> 'No'", bm.pass_variant_for_ratio(1.0) == "No")

# --- A3: self-comparison diagonal ------------------------------------------
case("A3 · Self-comparison marks the diagonal, and only the diagonal")
p = bm.build_payload(NODE_MAP, "0:99", A, "Blue", None, None, title="Blue")
chk("selfComparison flag set", p["selfComparison"] is True)
chk("24 headers, 144 blocks", len(p["headers"]) == 24 and len(p["blocks"]) == 144)
chk("all 12 diagonal cells are N/A",
    all(p["blocks"][i * 12 + i]["pass"] == "N/A" for i in range(12)))
chk("no off-diagonal cell is N/A",
    all(b["pass"] != "N/A" for i, b in enumerate(p["blocks"]) if i // 12 != i % 12))
p2 = bm.build_payload(NODE_MAP, "0:99", A, "Blue", B, "Green")
chk("two-colour run has no N/A at all",
    all(b["pass"] != "N/A" for b in p2["blocks"]))

# --- A4: second threshold is 3.0, not 3.1 ----------------------------------
case("A4 · The second threshold is 3.0, because the variant is named for its ratio")
chk("exactly 3.00 -> '3.1'", bm.pass_variant_for_ratio(3.0) == "3.1")
chk("3.05 -> '3.1' (WCAG AA large text passes)", bm.pass_variant_for_ratio(3.05) == "3.1")
chk("3.099 -> '3.1' (the old cutoff wrongly failed this)",
    bm.pass_variant_for_ratio(3.099) == "3.1")
chk("2.99 -> 'No'", bm.pass_variant_for_ratio(2.99) == "No")
chk("the variant is still NAMED '3.1' in the node map",
    "3.1" in NODE_MAP["componentPropertyKeys"]["block"]["variantOptions"],
    "renaming it would break every existing instance")

# --- A5: text choice by measured ratio, not a luminance split --------------
case("A5 · Header text colour chosen by measured ratio, not a luminance split")
disagree = []
for v in range(256):
    h = "#%02X%02X%02X" % (v, v, v)
    naive_dark = bm.relative_luminance(h) > 0.5
    measured_dark = bm.best_text_choice(h)[1] == bm.DARK_TEXT
    if naive_dark != measured_dark:
        disagree.append(h)
chk("the two rules genuinely disagree somewhere", len(disagree) > 0,
    f"{len(disagree)} grey values, e.g. {disagree[len(disagree)//2]}")
chk("every disagreement resolves to the higher measured ratio",
    all((bm.best_text_choice(h)[1] == bm.DARK_TEXT) ==
        (bm.contrast_ratio(h, bm.DARK_TEXT) >= bm.contrast_ratio(h, bm.LIGHT_TEXT))
        for h in disagree))
chk("white bg -> dark text", bm.best_text_choice("#FFFFFF") == ("Light", bm.DARK_TEXT))
chk("black bg -> light text", bm.best_text_choice("#000000") == ("Dark", bm.LIGHT_TEXT))

# --- A6: orientation --------------------------------------------------------
case("A6 · Rows are Colour A, columns are Colour B")
chk("cell[row1][col12] == ratio(A1, B12)",
    p2["blocks"][11]["label"] == f"{bm.contrast_ratio(A[0], B[11]):.2f}")
chk("cell[row12][col1] == ratio(A12, B1) — not the transpose",
    p2["blocks"][11 * 12]["label"] == f"{bm.contrast_ratio(A[11], B[0]):.2f}")
chk("those two differ, so a transpose would fail",
    p2["blocks"][11]["label"] != p2["blocks"][11 * 12]["label"])
chk("step 1 vs step 12 is a high-contrast pass",
    bm.pass_variant_for_ratio(bm.contrast_ratio(A[0], A[11])) == "4.5",
    f"{bm.contrast_ratio(A[0], A[11]):.2f}")

# --- A7: input validation ---------------------------------------------------
case("A7 · A scale that is not exactly 12 steps is rejected")
chk("11 values rejected", raises(lambda: bm.parse_hex_list(",".join(["#000000"] * 11), "a")))
chk("13 values rejected", raises(lambda: bm.parse_hex_list(",".join(["#000000"] * 13), "a")))
chk("12 values accepted", len(bm.parse_hex_list(",".join(["#000000"] * 12), "a")) == 12)
chk("malformed hex rejected", raises(lambda: bm.parse_hex_list(",".join(["#00000"] * 12), "a")))
chk("3-digit shorthand rejected", raises(lambda: bm.hex_to_rgb("#FFF")))

# --- A8: label format -------------------------------------------------------
case("A8 · Ratio labels are 2dp with no ':1' suffix")
off = [b for i, b in enumerate(p["blocks"]) if i // 12 != i % 12]
chk("every label has exactly 2 decimals and no colon",
    all("." in b["label"] and len(b["label"].split(".")[1]) == 2 and ":" not in b["label"]
        for b in off), f"{len(off)} labels")
chk("title carried into the payload when given", p["title"] == "Blue")
chk("title stays None when omitted",
    bm.build_payload(NODE_MAP, "0:99", A, "Blue", None, None)["title"] is None)

# --- A11: no project-specific data embedded (clause D) ---------------------
case("A11 · No project-specific data embedded (skill-standard §A clause D)")
import re
# A node ID has a multi-digit suffix (0:668 in this skill's convention); a
# contrast ratio written in the prose does not (3:1, 4.5:1), so suffix length
# separates them. Property keys embed an ID after a '#' and are caught
# regardless of suffix length.
ID_RE = re.compile(r"\b(\d+):(\d{2,})\b")
PROP_RE = re.compile(r"#(\d+):(\d+)\b")
KEY_RE = re.compile(r"\b[A-Za-z0-9]{22}\b")
scanned = []
for root, _dirs, files in os.walk(SKILL):
    for fn in files:
        if fn.endswith((".md", ".py", ".js", ".json")):
            scanned.append(os.path.join(root, fn))

real_ids, file_keys = [], []
for path in scanned:
    body = open(path).read()
    rel = os.path.relpath(path, SKILL)
    # Illustrative IDs in this skill use the "0:" page prefix by convention.
    for m in list(ID_RE.finditer(body)) + list(PROP_RE.finditer(body)):
        if m.group(1) != "0":
            real_ids.append(f"{rel} -> {m.group(0)}")
    for m in KEY_RE.finditer(body):
        file_keys.append(f"{rel}:{m.group(0)}")

chk(f"no real Figma node IDs across {len(scanned)} files", not real_ids,
    "; ".join(real_ids[:4]) if real_ids else "illustrative IDs all use the 0: prefix")
chk("no Figma file key", not file_keys, "; ".join(file_keys[:3]) if file_keys else "")

# --- A14: batches, and a cell that throws is reported, not fatal -----------
case("A14 · The apply script comes in batches, and a cell that throws is named while the rest run")
batches = bm.render_batches(p2)
datas = [json.loads(js.split("const DATA = ", 1)[1].split(";\n\nfunction", 1)[0]) for js in batches]
chk("two-colour grid: 2 header batches + 6 block batches", len(batches) == 8, f"got {len(batches)}")
chk("no batch over the measured sizes (12 headers, 24 blocks)",
    all(len(d["headers"]) <= 12 and len(d["blocks"]) <= 24 for d in datas))
chk("every header and block lands in exactly one batch",
    [h["suffix"] for d in datas for h in d["headers"]] == [h["suffix"] for h in p2["headers"]]
    and [b["suffix"] for d in datas for b in d["blocks"]] == [b["suffix"] for b in p2["blocks"]])
chk("the title is written by the first batch only",
    datas[0]["title"] == p2["title"] and all(d["title"] is None for d in datas[1:]))
chk("each batch says which it is", [d["batch"] for d in datas] == [f"{k}/8" for k in range(1, 9)])

import shutil
import subprocess
import tempfile
MOCK = r"""
const fs = require('fs');
const code = fs.readFileSync(process.argv[1], 'utf8');
const bad = process.argv[2];
const written = [];
const node = (id) => ({ id, fills: [], findOne: () => null, fontName: {},
  setProperties(p) { if (id.endsWith(';' + bad)) throw new Error('in the instance, no such property'); written.push(id); } });
globalThis.figma = { getNodeByIdAsync: async (id) => node(id), loadFontAsync: async () => {} };
(new Function('return (async () => {' + code + '})()'))().then((r) => console.log(JSON.stringify({ r, written: written.length })));
"""
node_bin = shutil.which("node")
if not node_bin:
    chk("node is installed to run the generated batch", False, "node not found")
else:
    with tempfile.TemporaryDirectory() as tmp:
        js_path = os.path.join(tmp, "batch.js")
        open(js_path, "w").write(batches[2])
        bad = datas[2]["blocks"][5]["suffix"]
        out = subprocess.run([node_bin, "-e", MOCK, js_path, bad], capture_output=True, text=True)
        res = json.loads(out.stdout or "{}") if out.returncode == 0 else {}
        r = res.get("r", {})
        chk("a block that throws is in errors with its message, the batch returns",
            len(r.get("errors", [])) == 1 and "no such property" in r["errors"][0]["error"]
            and r["errors"][0]["nodeId"].endswith(bad), out.stderr.strip()[-200:] or str(r.get("errors")))
        chk("the other 23 blocks of that batch are still written",
            r.get("blocksUpdated") == 23 and res.get("written") == 23, str(r))


# --- A16: the read-back, not a screenshot -----------------------------------
case("A16 · Step 5 reads every cell back and names each that differs")
STATEFUL = r"""
const fs = require('fs');
const files = JSON.parse(process.argv[1]);
const corrupt = process.argv[2] || '';
const nodes = new Map();
const node = (id) => {
  if (!nodes.has(id)) {
    const content = { name: 'Content', fills: [] }, label = { name: 'Label', fills: [] };
    nodes.set(id, { id, fills: [], fontName: {}, characters: '', componentProperties: {},
      findOne: (fn) => [content, label].find(fn) || null,
      setProperties(p) { for (const [k, v] of Object.entries(p)) this.componentProperties[k] = { type: 'TEXT', value: v }; } });
  }
  return nodes.get(id);
};
globalThis.figma = { getNodeByIdAsync: async (id) => node(id), loadFontAsync: async () => {} };
const run = (f) => (new Function('return (async () => {' + fs.readFileSync(f, 'utf8') + '})()'))();
(async () => {
  for (const f of files.apply) await run(f);
  if (corrupt) { const [id, key, v] = corrupt.split('|'); node(id).componentProperties[key] = { value: v }; }
  const out = [];
  for (const f of files.verify) out.push(await run(f));
  console.log(JSON.stringify(out));
})();
"""
if node_bin:
    with tempfile.TemporaryDirectory() as tmp:
        stem = os.path.join(tmp, "apply_matrix.js")
        subprocess.run([sys.executable, os.path.join(SKILL, "scripts", "build-matrix-script.py"),
            "--node-map", os.path.join(SKILL, "references", "node-map.example.json"), "--instance", "9:1",
            "--color-a", ",".join(A), "--color-a-name", "Blue", "--color-b", ",".join(B), "--color-b-name", "Green",
            "--title", "Blue vs Green", "--out", stem], capture_output=True, text=True)
        apply = sorted([os.path.join(tmp, f) for f in os.listdir(tmp) if f.startswith("apply_matrix.") and ".verify." not in f], key=lambda f: int(f.split(".")[-2]))
        verify = sorted([os.path.join(tmp, f) for f in os.listdir(tmp) if ".verify." in f])
        chk("the build writes the read-back beside the batches, two parts for a full grid", len(apply) == 8 and len(verify) == 2, str(os.listdir(tmp)))
        files = json.dumps({"apply": apply, "verify": verify})
        clean = json.loads(subprocess.run([node_bin, "-e", STATEFUL, files], capture_output=True, text=True).stdout or "[]")
        chk("after every batch, the read-back finds every cell as meant",
            sum(p["read"] for p in clean) == 1 + 24 + 144 and all(p["read"] == p["expected"] and p["mismatches"] == [] for p in clean), str(clean)[:300])
        p2b = bm.build_payload(NODE_MAP, "9:1", A, "Blue", B, "Green", title="Blue vs Green")
        cell = next(b for b in p2b["blocks"] if b["pass"] == "4.5")
        target = f"I9:1;{cell['suffix']}"
        bad = json.loads(subprocess.run([node_bin, "-e", STATEFUL, files, f"{target}|{p2b['blockVariantKey']}|No"], capture_output=True, text=True).stdout or "[]")
        found = [m for part in bad for m in part["mismatches"]]
        chk("a block whose Pass reads otherwise is named, with what was meant and what is there",
            len(found) == 1 and found[0]["nodeId"] == target and found[0]["field"] == "pass" and found[0]["want"] == cell["pass"] and found[0]["got"] == "No", str(found))

print(f"\n{_ok} passed, {_fail} failed")
sys.exit(1 if _fail else 0)
