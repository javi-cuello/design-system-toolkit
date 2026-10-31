#!/usr/bin/env python3
"""
Builds the ready-to-paste JS (for the figma_execute tool) that populates one
instance of the "_Ratios grid" contrast matrix component, as numbered batches
(apply_matrix.1.js, .2.js, ...) small enough that none times out.

Usage:
    python3 build-matrix-script.py \
        --node-map <PATH TO MAP FROM discover-node-map.js> \
        --instance <RATIOS GRID INSTANCE NODE ID> \
        --color-a "#FBFDFE,#F4F9FF,#E3F0FF,#D2E7FF,#C1DEFF,#92BFF1,#6A9FDB,#3F80C5,#0061B0,#005088,#003F6E,#002F55" \
        --color-a-name Blue \
        --color-b "#F8FFFA,#EAFEF0,#DBF7E3,#CAF0D6,#B8E9C7,#8ECBA3,#63AE7F,#31925C,#007348,#005D39,#004A2D,#003820" \
        --color-b-name Green \
        --out ./apply_matrix.js

Omit --color-b / --color-b-name for a single-colour self-comparison matrix
(rows and columns are the same 12 steps; the diagonal is marked N/A).

The node map (component property keys and local node-ID suffixes) is specific
to the Figma file being targeted. Generate it with scripts/discover-node-map.js
and pass the path with --node-map; see references/node-map.example.json for the
shape. Nothing about one file's addressing is baked into this script.
"""

import argparse
import json
import os
import sys

HEX_RE_LEN = 7  # "#RRGGBB"

DARK_TEXT = "#121212"
LIGHT_TEXT = "#FAFAFA"


def hex_to_rgb(hex_str):
    hex_str = hex_str.strip().lstrip("#")
    if len(hex_str) != 6:
        raise ValueError(f"Invalid hex colour: {hex_str!r}")
    r = int(hex_str[0:2], 16)
    g = int(hex_str[2:4], 16)
    b = int(hex_str[4:6], 16)
    return r, g, b


def srgb_channel_to_linear(c_255):
    c = c_255 / 255.0
    if c <= 0.04045:
        return c / 12.92
    return ((c + 0.055) / 1.055) ** 2.4


def relative_luminance(hex_str):
    r, g, b = hex_to_rgb(hex_str)
    R = srgb_channel_to_linear(r)
    G = srgb_channel_to_linear(g)
    B = srgb_channel_to_linear(b)
    return 0.2126 * R + 0.7152 * G + 0.0722 * B


def contrast_ratio(hex_a, hex_b):
    la = relative_luminance(hex_a)
    lb = relative_luminance(hex_b)
    lighter, darker = max(la, lb), min(la, lb)
    return (lighter + 0.05) / (darker + 0.05)


def best_text_choice(bg_hex):
    """Return (variant_name, text_hex) that maximizes readable contrast.

    'Light' variant = light background, so use dark text.
    'Dark' variant = dark background, so use light text.
    Chosen by whichever candidate text colour yields the higher contrast
    ratio against the background -- not merely a 0.5 luminance split.
    """
    ratio_with_dark_text = contrast_ratio(bg_hex, DARK_TEXT)
    ratio_with_light_text = contrast_ratio(bg_hex, LIGHT_TEXT)
    if ratio_with_dark_text >= ratio_with_light_text:
        return "Light", DARK_TEXT
    return "Dark", LIGHT_TEXT


def pass_variant_for_ratio(ratio):
    """Band a ratio onto the _Block component's Pass variant.

    The variant names read as ratios-against-1 with the colon written as a
    period: "4.5" is 4.5:1 (WCAG AA, normal text) and "3.1" is 3:1 (WCAG AA,
    large text and UI components). So the second threshold is 3.0, not 3.1 —
    the variant is named for the ratio, not for the cutoff.
    """
    if ratio >= 4.5:
        return "4.5"
    if ratio >= 3.0:
        return "3.1"
    return "No"


def parse_hex_list(s, label):
    parts = [p.strip() for p in s.split(",") if p.strip()]
    if len(parts) != 12:
        raise ValueError(f"{label} must have exactly 12 hex values, got {len(parts)}")
    for p in parts:
        hex_to_rgb(p)  # validates
    return parts


def build_payload(node_map, instance_id, color_a, color_a_name, color_b, color_b_name, title=None):
    self_comparison = color_b is None
    if self_comparison:
        color_b = color_a
        color_b_name = color_a_name

    keys = node_map["componentPropertyKeys"]
    header_label_key = keys["header"]["labelText"]
    # The header's readability toggle is optional: some libraries switch a Light/Dark
    # "Contrast" variant, others rely entirely on the direct Content/Label fill
    # overrides applied below regardless and carry an unrelated (or no) VARIANT
    # property. Only write it when discover-node-map.js confirmed it's a real
    # Light/Dark pair — writing "Light"/"Dark" into an unrelated property (observed
    # live: a boolean marking the blank corner cell) corrupts it silently.
    header_variant_key = keys["header"]["variant"] if keys["header"].get("isLightDarkPair") else None
    block_label_key = keys["block"]["labelText"]
    block_variant_key = keys["block"]["variant"]

    headers = []

    # Column headers = colour B, steps 1-12
    for j, suffix in enumerate(node_map["columnHeaderSuffixes"]):
        hex_val = color_b[j]
        variant, text_hex = best_text_choice(hex_val)
        headers.append({
            "suffix": suffix,
            "step": j + 1,
            "hex": hex_val,
            "variant": variant,
            "textHex": text_hex,
        })

    blocks = []
    for i, row in enumerate(node_map["rows"]):
        row_hex = color_a[i]
        variant, text_hex = best_text_choice(row_hex)
        headers.append({
            "suffix": row["headerSuffix"],
            "step": i + 1,
            "hex": row_hex,
            "variant": variant,
            "textHex": text_hex,
        })
        for j, block_suffix in enumerate(row["blockSuffixes"]):
            if self_comparison and i == j:
                blocks.append({
                    "suffix": block_suffix,
                    "pass": "N/A",
                    "label": "N/A",
                })
                continue
            ratio = contrast_ratio(color_a[i], color_b[j])
            blocks.append({
                "suffix": block_suffix,
                "pass": pass_variant_for_ratio(ratio),
                "label": f"{ratio:.2f}",
            })

    return {
        "instanceId": instance_id,
        "selfComparison": self_comparison,
        "colorAName": color_a_name,
        "colorBName": color_b_name,
        "headerLabelKey": header_label_key,
        "headerVariantKey": header_variant_key,
        "blockLabelKey": block_label_key,
        "blockVariantKey": block_variant_key,
        "titleSuffix": node_map.get("titleSuffix"),
        "title": title,
        "headers": headers,
        "blocks": blocks,
    }


JS_TEMPLATE = """\
// Auto-generated by build-matrix-script.py -- Contrast matrix populate script
// Colour A ({color_a_name}) = rows, Colour B ({color_b_name}) = columns{self_note}
// Batch {batch}: run every batch, in order, each in its own figma_execute call
const DATA = {data_json};

function hexToFloatRgb(hex) {{
  const h = hex.replace('#', '');
  return {{
    r: parseInt(h.substring(0, 2), 16) / 255,
    g: parseInt(h.substring(2, 4), 16) / 255,
    b: parseInt(h.substring(4, 6), 16) / 255,
  }};
}}

async function applyTitle() {{
  if (!DATA.title || !DATA.titleSuffix) return {{ skipped: true }};
  const nodeId = `I${{DATA.instanceId}};${{DATA.titleSuffix}}`;
  const title = await figma.getNodeByIdAsync(nodeId);
  if (!title) return {{ error: 'Title node not found' }};
  await figma.loadFontAsync(title.fontName);
  title.characters = DATA.title;
  return {{ ok: true }};
}}

async function applyHeader(h) {{
  const nodeId = `I${{DATA.instanceId}};${{h.suffix}}`;
  const inst = await figma.getNodeByIdAsync(nodeId);
  if (!inst) return {{ nodeId, error: 'not found' }};
  const props = {{ [DATA.headerLabelKey]: String(h.step) }};
  if (DATA.headerVariantKey) props[DATA.headerVariantKey] = h.variant;
  inst.setProperties(props);
  const content = inst.findOne(n => n.name === 'Content');
  if (content) content.fills = [{{ type: 'SOLID', color: hexToFloatRgb(h.hex) }}];
  const label = inst.findOne(n => n.name === 'Label');
  if (label) label.fills = [{{ type: 'SOLID', color: hexToFloatRgb(h.textHex) }}];
  return {{ nodeId, ok: true }};
}}

async function applyBlock(b) {{
  const nodeId = `I${{DATA.instanceId}};${{b.suffix}}`;
  const inst = await figma.getNodeByIdAsync(nodeId);
  if (!inst) return {{ nodeId, error: 'not found' }};
  inst.setProperties({{
    [DATA.blockLabelKey]: b.label,
    [DATA.blockVariantKey]: b.pass,
  }});
  return {{ nodeId, ok: true }};
}}

// a cell that throws is recorded and the rest still run: one bad cell never
// leaves the batch half-written with nothing said
async function attempt(nodeId, fn) {{
  try {{ return await fn(); }} catch (e) {{ return {{ nodeId, error: String((e && e.message) || e) }}; }}
}}

const results = {{ headers: [], blocks: [], errors: [] }};
const titleResult = await attempt('Title', applyTitle);
if (titleResult.error) results.errors.push({{ nodeId: 'Title', error: titleResult.error }});
for (const h of DATA.headers) {{
  const r = await attempt(`I${{DATA.instanceId}};${{h.suffix}}`, () => applyHeader(h));
  if (r.error) results.errors.push(r); else results.headers.push(r.nodeId);
}}
for (const b of DATA.blocks) {{
  const r = await attempt(`I${{DATA.instanceId}};${{b.suffix}}`, () => applyBlock(b));
  if (r.error) results.errors.push(r); else results.blocks.push(r.nodeId);
}}

return {{
  batch: DATA.batch,
  titleUpdated: titleResult.ok || false,
  headersUpdated: results.headers.length,
  blocksUpdated: results.blocks.length,
  errors: results.errors,
}};
"""


VERIFY_TEMPLATE = """\
// Auto-generated by build-matrix-script.py -- Contrast matrix read-back, part {part}
// Reads every cell the apply batches wrote and compares it with what they meant to write.
const DATA = {data_json};

function toHex(c) {{
  return '#' + [c.r, c.g, c.b].map((x) => Math.round(x * 255).toString(16).padStart(2, '0')).join('').toUpperCase();
}}
function fillHex(node) {{
  const f = node && Array.isArray(node.fills) && node.fills[0];
  return f && f.type === 'SOLID' ? toHex(f.color) : null;
}}
const prop = (inst, key) => (inst.componentProperties && inst.componentProperties[key] ? inst.componentProperties[key].value : undefined);
const mismatches = [];
const differs = (nodeId, field, want, got) => {{ if (String(want) !== String(got)) mismatches.push({{ nodeId, field, want, got: got === undefined ? null : got }}); }};
let read = 0;
if (DATA.title && DATA.titleSuffix) {{
  const t = await figma.getNodeByIdAsync(`I${{DATA.instanceId}};${{DATA.titleSuffix}}`);
  if (!t) mismatches.push({{ nodeId: 'Title', field: 'node', want: DATA.title, got: 'not found' }});
  else {{ read++; differs('Title', 'characters', DATA.title, t.characters); }}
}}
for (const h of DATA.headers) {{
  const nodeId = `I${{DATA.instanceId}};${{h.suffix}}`;
  const inst = await figma.getNodeByIdAsync(nodeId);
  if (!inst) {{ mismatches.push({{ nodeId, field: 'node', want: 'a header', got: 'not found' }}); continue; }}
  read++;
  differs(nodeId, 'label', String(h.step), prop(inst, DATA.headerLabelKey));
  if (DATA.headerVariantKey) differs(nodeId, 'variant', h.variant, prop(inst, DATA.headerVariantKey));
  differs(nodeId, 'Content fill', h.hex.toUpperCase(), fillHex(inst.findOne((n) => n.name === 'Content')));
  differs(nodeId, 'Label fill', h.textHex.toUpperCase(), fillHex(inst.findOne((n) => n.name === 'Label')));
}}
for (const b of DATA.blocks) {{
  const nodeId = `I${{DATA.instanceId}};${{b.suffix}}`;
  const inst = await figma.getNodeByIdAsync(nodeId);
  if (!inst) {{ mismatches.push({{ nodeId, field: 'node', want: 'a block', got: 'not found' }}); continue; }}
  read++;
  differs(nodeId, 'label', b.label, prop(inst, DATA.blockLabelKey));
  differs(nodeId, 'pass', b.pass, prop(inst, DATA.blockVariantKey));
}}
return {{ part: DATA.part, read, expected: DATA.headers.length + DATA.blocks.length + (DATA.title && DATA.titleSuffix ? 1 : 0), mismatches }};
"""

# Reads are lighter than writes: the read-back takes the headers and blocks 84 at a time,
# two calls for a full grid. Not yet measured on a live file.
VERIFY_BATCH = 84


def render_verify(payload):
    """The read-back of everything the apply batches write, as numbered parts: each
    re-reads its cells and returns every one that differs from what was meant."""
    cells = [("headers", h) for h in payload["headers"]] + [("blocks", b) for b in payload["blocks"]]
    chunks = [cells[i:i + VERIFY_BATCH] for i in range(0, len(cells), VERIFY_BATCH)] or [[]]
    out = []
    for k, chunk in enumerate(chunks, 1):
        data = dict(payload, part=f"{k}/{len(chunks)}",
                    headers=[c for kind, c in chunk if kind == "headers"],
                    blocks=[c for kind, c in chunk if kind == "blocks"],
                    title=payload["title"] if k == 1 else None)
        out.append(VERIFY_TEMPLATE.format(part=data["part"], data_json=json.dumps(data, indent=2)))
    return out


# Measured on a real run (3.1.0): all 168 cells in one call reliably time out;
# headers (a property write and two fills each) are safe 12 at a time, blocks
# (one property write) 24 at a time, two rows.
HEADER_BATCH = 12
BLOCK_BATCH = 24


def render_batches(payload):
    """The apply script as a list of self-contained batches: the title and the
    headers 12 at a time, then the blocks 24 at a time. Each returns its own
    counts and errors, so a batch that times out is the one to run again."""
    hs, bs = payload["headers"], payload["blocks"]
    parts = [("headers", hs[i:i + HEADER_BATCH]) for i in range(0, len(hs), HEADER_BATCH)]
    parts += [("blocks", bs[i:i + BLOCK_BATCH]) for i in range(0, len(bs), BLOCK_BATCH)]
    self_note = " -- SELF-COMPARISON (diagonal = N/A)" if payload["selfComparison"] else ""
    out = []
    for k, (kind, cells) in enumerate(parts, 1):
        label = f"{k}/{len(parts)}"
        data = dict(payload, batch=label, headers=cells if kind == "headers" else [],
                    blocks=cells if kind == "blocks" else [],
                    title=payload["title"] if k == 1 else None)
        out.append(JS_TEMPLATE.format(
            color_a_name=payload["colorAName"],
            color_b_name=payload["colorBName"],
            self_note=self_note,
            batch=label,
            data_json=json.dumps(data, indent=2),
        ))
    return out


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--instance", required=True, help="Node ID of the _Ratios grid instance to populate")
    parser.add_argument("--color-a", required=True, help="12 comma-separated hex values, step 1..12 (rows)")
    parser.add_argument("--color-a-name", default="Colour A")
    parser.add_argument("--color-b", default=None, help="12 comma-separated hex values, step 1..12 (columns). Omit for self-comparison.")
    parser.add_argument("--color-b-name", default=None)
    parser.add_argument("--out", required=True, help="Where the batches go: ./apply_matrix.js writes apply_matrix.1.js, apply_matrix.2.js, ...")
    parser.add_argument("--title", default=None, help="Optional text to set on the grid's 'Title' layer (e.g. the colour/scale name).")
    parser.add_argument(
        "--node-map",
        required=True,
        help=(
            "Path to the node map for the file you are targeting, generated by "
            "scripts/discover-node-map.js. Required and deliberately has no default: "
            "node IDs and property keys are specific to one file, so a baked-in map "
            "would address the wrong nodes everywhere else while reporting success. "
            "references/node-map.example.json documents the shape and is NOT usable."
        ),
    )
    args = parser.parse_args()

    with open(args.node_map) as f:
        node_map = json.load(f)

    color_a = parse_hex_list(args.color_a, "--color-a")
    color_b = parse_hex_list(args.color_b, "--color-b") if args.color_b else None
    color_b_name = args.color_b_name if color_b else args.color_a_name

    payload = build_payload(
        node_map, args.instance, color_a, args.color_a_name, color_b, color_b_name, title=args.title
    )

    stem, ext = os.path.splitext(args.out)
    for k, js in enumerate(render_batches(payload), 1):
        path = f"{stem}.{k}{ext or '.js'}"
        with open(path, "w") as f:
            f.write(js)
        print(f"Wrote {path}", file=sys.stderr)
    for k, js in enumerate(render_verify(payload), 1):
        path = f"{stem}.verify.{k}{ext or '.js'}"
        with open(path, "w") as f:
            f.write(js)
        print(f"Wrote {path} (the read-back, after every batch)", file=sys.stderr)


if __name__ == "__main__":
    main()
