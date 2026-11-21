# Running the scripts

The detail behind SKILL.md's workflow steps 2 and 4–7, and the contrast maths the builder implements.

## Contents

1. When importing the component times out
2. Reading an existing ramp's hexes
3. The build command
4. Running the batches
5. Reading the values back
6. Contrast maths

## 1. When importing the component times out

Don't fight it. `importComponentByKeyAsync` pulling a real grid of about 170 nodes across files can exceed the call budget again and again. Four attempts in a row failed at a fixed ceiling, whatever timeout was asked for.

Figma's own copy-paste between two open tabs is instant and avoids the API path entirely. Ask the user to copy one instance from the library file and paste it into the target page. Then continue from step 2, *Find the target instance*, against the pasted instance.

## 2. Reading an existing ramp's hexes

The page and frame naming are a per-project convention: take them from the context document. The shape to expect:

- A page of explorations whose top-level frames each hold one `_Colour ramp` instance.
- Each ramp has 12 step columns.
- Each column is a `Swatches` sub-frame with two rows of fills.

Run `scripts/read-ramp-hexes.js` through `figma_execute`. Fill `FRAME_ID` (or `FRAME_NAME`) with the ramp's frame. Set `RAMP_NAME` if the context document names the component differently.

- It finds the ramp as an actual child of that frame, by its main component's name.
- It **never** finds it by offsetting the frame's own ID. A frame and the instance inside it have unrelated IDs, and an assumed offset reads a different node while looking like it worked.
- It returns `{ frame, instance, row1, row2 }`. Each row is the comma-separated list that `--color-a` and `--color-b` take.
- It throws on any other shape: not 12 columns, a missing row, or a fill that is not one opaque solid. A short or guessed list would fill the grid in the wrong place.

Which row the matrix compares is part of step 4's mode question.

## 3. The build command

```bash
python3 scripts/build-matrix-script.py \
  --node-map <PATH TO THE MAP FROM STEP 3> \
  --instance <INSTANCE_NODE_ID> \
  --color-a "<12 comma-separated hex values, step 1..12>" \
  --color-a-name "<name>" \
  [--color-b "<12 comma-separated hex values>" --color-b-name "<name>"] \
  --title "<optional label for the grid's Title layer, e.g. the colour name>" \
  --out ./apply_matrix.js
```

- `--node-map` is required and has no default. Node IDs and property keys belong to one file, so a built-in map would address the wrong nodes everywhere else while reporting success.
- `--out` is required. The script writes the numbered batches and the read-back parts beside it.
- Omit `--color-b` and `--color-b-name` for a self-comparison; the diagonal cells are set to `N/A` automatically.
- Omit `--title` to leave the `Title` layer untouched, for example when it is already labelled.

## 4. Running the batches

The script writes numbered batches: `apply_matrix.1.js`, `.2.js` and so on, 8 for a full grid.

| Batches | What each holds |
|---|---|
| First 2 | The title (first batch only) and the headers, 12 at a time |
| Next 6 | The blocks, 24 at a time |

These are the sizes a real run measured as safe. All 168 cells in one call reliably time out.

- Read each file in order and pass its full contents as `code` to `figma_execute`, timeout 30000.
- Each returns `{ batch, titleUpdated, headersUpdated, blocksUpdated, errors }`. Check `errors` is empty before the next.
- A cell that throws is listed in `errors` with its node and message, while the rest of its batch still runs. So a half-filled grid is never silent.
- A batch that times out is the one to run again. Its writes are the same values, so a rerun is safe. Never fall back to one call for the whole grid.
- If the same batch times out twice, bring Figma to the front and retry it. Figma behind other windows answers in slow ticks.

## 5. Reading the values back

Step 5's build also wrote the read-back: `apply_matrix.verify.1.js` and `.2.js`. Once every batch has run, pass each to `figma_execute` in turn.

Each part re-reads its cells:

- the title's text;
- each header's label, its Light/Dark variant, and its `Content` and `Label` fills;
- each block's ratio label and `Pass`.

Each returns `{ part, read, expected, mismatches }`. Every mismatch names the node, the field, what was meant and what is there. A `read` below `expected`, or any mismatch, is the finding: rerun the batch that holds the cell, never patch it by hand.

A screenshot is then for what no value shows: the header text legible against its swatch, nothing clipped. It is not for the values.

## 6. Contrast maths

The builder already implements this; it is here for reference.

- **Relative luminance**, per WCAG: linearize each sRGB channel (`c/12.92` if `c ≤ 0.04045`, else `((c+0.055)/1.055)^2.4`). Then `L = 0.2126R + 0.7152G + 0.0722B`.
- **Ratio:** `(Lighter + 0.05) / (Darker + 0.05)`.
- **Ratio label:** two decimal places, no `:1` suffix, such as `4.52`.

| Ratio | `Pass` variant | Reads as |
|---|---|---|
| ≥ 4.5 | `"4.5"` | 4.5:1, WCAG AA normal text |
| ≥ 3.0 | `"3.1"` | 3:1, WCAG AA large text and UI components |
| below 3.0 | `"No"` | Fails both |

The variant names read as ratios against 1, the colon written as a period. The second **threshold is 3.0**: the variant is named for the ratio it stands for, not for its cutoff.

- Do not "correct" the comparison to `3.1` to match the label.
- A matrix filled against a `3.1` cutoff reports the 3.00–3.09 band as failing; regenerate it.
