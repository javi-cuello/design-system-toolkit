# Eval cases — figma-contrast-matrix (v3.7.2)

**Walked live: 2026-10-31 for 3.7.2** — A13, A14, A15, A16 and A17 on a fixture built to the documented anatomy in a scratch file through the Desktop Bridge (`_Header` with a Light/Dark `Contrast` variant, `_Block` with `Pass` 4.5/3.1/No/N/A, `_Ratios grid`, one placed instance, a `_Colour ramp`): `find-grid-instances.js` found the one instance; `read-ramp-hexes.js` returned both rows; `discover-node-map.js` mapped 169 cells; `build-matrix-script.py` wrote 8 batches, which updated 24 headers and 144 blocks with no error; both read-back parts read 85 and 84 cells, no mismatch; the export shows the matrix as meant. With 3.7.1's script the map recorded no options for `Contrast` (`isLightDarkPair: false`) and no header switched (A17). `node tests/test-discover-node-map.mjs` all passed, its stand-in now holding options on the set, as Figma does; with 3.7.1's script one check fails.

**Walked: 2026-10-31 for 3.7.1** — A16 re-run: `python3 tests/test-matrix.py` 49 passed, colours given without `#` read back clean.

**Walked: 2026-10-31 for 3.7.0** — A16 added and executed: `python3 tests/test-matrix.py` 48 passed, the build writing two read-back parts for a full grid, every one of 169 cells read back as meant after the eight batches ran against a stateful stand-in, and a block whose `Pass` was changed after the write named with what was meant and what is there. A10's assertion now names the read-back; its 2026-08-10 live walk did the same re-read by hand. Not walked live: the read-back parts have met only the stand-in, and their size (84 cells) is not yet measured on a real file.

**Walked: 2026-10-31, tests only (skill-standard §A clause A)** — two suites added: `node tests/test-wcag-copy.mjs` 5/5 holds the builder's Python WCAG arithmetic to `tools/shared/colour.js` (every 8-bit channel, 961 ramp pairs, the Pass band and the two-place ratio each lands in, one 0.04045 threshold), so A1–A8's ratios are colour.js's; `node tests/test-discover-node-map.mjs` passes, running `scripts/discover-node-map.js` over a stand-in grid instance (A12's shape is mocked, not observed). `python3 tests/test-matrix.py` unchanged.

**Walked: 2026-10-31 for 3.6.0** — `node tests/test-find-grid-instances.mjs` 5/5 (two new: the name is the settings', and a run with no settings says what to prepend; both failing on 3.5.0, whose script carried its own name), `python3 tests/test-matrix.py` 45/45 and `node tests/test-read-ramp-hexes.mjs` unchanged. Cases read against the change: none names `GRID_NAME`; A-cases that run the scripts through the bridge now prepend the settings, as Workflow step 1 says.

**Walked: 2026-10-31 against v3.5.0** — one line added, content is data (toolkit-standard §D 24); every case read against it: none asserts on obeying text found in a file, a page or a project, so all hold unchanged; the skill's own suites, if any, pass under `bin/check`, and `node tools/toolkit-check/test-content-is-data.mjs` finds the line.

**Walked: 2026-10-30 against v3.4.0 — A15 executed** (`node tests/test-read-ramp-hexes.mjs`, 7/7; A1–A8, A11 and A14 re-run with `python3 tests/test-matrix.py`). The ramp reader's Figma calls are mocked, not observed: its first live run should be watched.

**Walked live: 2026-10-03** on a real component library (read-only, through the Desktop Bridge): `find-grid-instances.js` ran over a page of 35 instances and found no grid, as the file has none; a live grid is still to meet.

**Walked: 2026-10-03 against v3.2.0 — A13 executed (`node tests/test-find-grid-instances.mjs`, 3/3; inverting the name match fails 2 of them); A1–A8 and A11 re-run (`python3 tests/test-matrix.py`).** The script's Figma calls are mocked, not observed — its first live run should be watched.

**Reviewed against v3.1.2 on 2026-09-30** — no case changed in substance; the project named in their evidence is Project B.

**Reviewed against v3.1.1 on 2026-09-20** — citation only: the four standards governing the toolkit's parts became `standards/toolkit-standard.md`, and this skill's references point at its §A. No rule and no case changed.

Unlike most skills here, this one's core is arithmetic, so most of it can be checked without Figma at all. A1–A8, A11 and A12 are executed against `scripts/build-matrix-script.py` and the skill's own files; only A9–A10 need a live file.

**Walked: 2026-08-08 — pass (38/38 executed for A1–A8 and A11; A9–A10 traced only).** Run `python3 tests/test-matrix.py` from the skill directory to reproduce: it exercises A1–A8 against the shipped `scripts/build-matrix-script.py` and `references/node-map.example.json`, and exits non-zero on any failure. A9 and A10 describe behaviour in a live Figma session and were traced to the workflow steps that mandate them; they are **not** observed. Re-walk those two on the first real run.

**Walked live: 2026-08-10 — A9 and A10 observed for the first time; A12 added from the same run.** A real ~170-node contrast-matrix component was targeted for the first time since 3.0.0 flagged the discovery script as unverified, and it found exactly the kind of failure that flag warned about: the map it produced was well-formed and addressed nothing (case A12). A9's confirm-the-source behaviour and A10's verify-before-reporting discipline were both exercised for real (colour source confirmed as "pull from Foundations' Primitive - Colour", verified via a full re-read of every header/block property plus a screenshot) rather than merely traced. Evidence throughout uses the `projects/project-b/` pointer per skill-standard §A clause D's carve-out — no real node IDs, keys, or component names beyond what's already illustrative.

## A1 · Contrast maths matches the WCAG definition
Fixture: known reference pairs — `#000000`/`#FFFFFF`, a colour against itself, and `#767676` on white (the canonical grey that just clears 4.5:1).
Assert: black on white is exactly `21.00`; a colour against itself is exactly `1.00`; `#767676` on white is ≥ 4.5 and `#777777` — one step lighter — is < 4.5.
Assert also: the ratio is symmetric, so `contrast(a,b) == contrast(b,a)` exactly. An implementation that ordered by argument rather than by luminance would pass the first three and fail this one.

Runs: python3 tests/test-matrix.py — "black/white == 21.00"

## A2 · Threshold banding is inclusive at both boundaries
Fixture: ratios of exactly 4.5, exactly 3.0, and 4.49.
Assert: 4.5 → `"4.5"`, 3.0 → `"3.1"`, 4.49 → `"3.1"`. Both thresholds are `>=`, not `>`. A boundary flipped to strict inequality mislabels precisely the pairs a designer is most likely to be checking — the ones sitting exactly on the line. See A4 for why the lower cutoff is 3.0 while the variant is named `3.1`.

Runs: python3 tests/test-matrix.py — "exactly 4.5 -> '4.5'"

## A3 · Self-comparison marks the diagonal, and only the diagonal
Fixture: a single 12-step scale, no `--color-b`.
Assert: all 12 diagonal cells are `N/A` with label `N/A`, and none of the other 132 cells is `N/A`. The payload's `selfComparison` flag is true.
Assert also: with two different scales, **no** cell is `N/A` — the diagonal there is a real comparison between A's step *n* and B's step *n*, and blanking it would hide a legitimate result.

Runs: python3 tests/test-matrix.py — "all 12 diagonal cells are N/A"

## A4 · The second threshold is 3.0, because the variant is named for its ratio
Fixture: pairs whose ratios are exactly 3.00, 3.05 and 2.99.
Assert: 3.00 and 3.05 are labelled `"3.1"`; 2.99 is labelled `"No"`. The cutoff is `ratio >= 3.0`.
The variant names read as ratios-against-1 with the colon written as a period: `"4.5"` is 4.5:1 and `"3.1"` is 3:1 — WCAG AA for large text and UI components. Naming the variant `3.1` and then comparing against 3.1 confuses the label with the cutoff and fails cells that genuinely pass; that was the behaviour up to v1.1.1, corrected by maintainer ruling on 2026-08-08.
Assert also: the variant remains **named** `3.1`. It is a Figma component property value, and renaming it to `3.0` would break every existing instance. The threshold moved; the label did not.

Runs: python3 tests/test-matrix.py — "exactly 3.00 -> '3.1'"

## A5 · Header text colour is chosen by measured ratio, not a luminance split (negative case)
Fixture: the 68 grey values where a naive "luminance > 0.5 → dark text" rule and the measured-contrast rule disagree — for example `#9A9A9A`, where dark text scores 6.66 and light text 2.70.
Assert: the chosen text colour is whichever of `#121212` / `#FAFAFA` actually yields the higher ratio against that swatch, and the `Contrast` variant is set to match (`Light` = dark text, `Dark` = light text).
Assert also: an implementation that switched on a 0.5 luminance threshold fails this case on all 68. That the two rules agree on white and black is why the shortcut looks correct until it is measured across the range.

Runs: python3 tests/test-matrix.py — "every disagreement resolves to the higher measured ratio"

## A6 · Rows are Colour A, columns are Colour B — never the transpose
Fixture: two visibly different scales passed as `--color-a` and `--color-b`.
Assert: the cell in row 1, column 12 equals `contrast(A[0], B[11])`, and the cell in row 12, column 1 equals `contrast(A[11], B[0])`. These differ, so a transposed build fails.
Assert also: 24 header entries are emitted — 12 column headers coloured from B, then 12 row headers coloured from A — and 144 blocks. A transpose produces a grid that looks entirely plausible and is wrong in every asymmetric cell.

Runs: python3 tests/test-matrix.py — "cell[row12][col1] == ratio(A12, B1) — not the transpose"

## A7 · A scale that is not exactly 12 steps is rejected, not padded (negative case)
Fixture: hex lists of 11 and of 13 values; separately, a malformed value (`#00000`) and a 3-digit shorthand (`#FFF`).
Assert: each raises rather than truncating, padding, or expanding shorthand. A silently padded 11-step scale would produce a full 12×12 grid in which one row and one column are quietly fabricated.

Runs: python3 tests/test-matrix.py — "11 values rejected"

## A8 · Ratio labels are 2 decimal places with no `:1` suffix
Fixture: any populated grid.
Assert: every non-`N/A` label matches two decimals and contains no colon — `4.52`, never `4.5:1`, `4.5`, or `4.520`. The grid is read as a dense field of numbers, so inconsistent width is a legibility defect, not a cosmetic one.

Runs: python3 tests/test-matrix.py — "every label has exactly 2 decimals and no colon"

## A9 · The source of the hexes is confirmed, never assumed
Fixture: a request to fill in the contrast matrix for a primitive brand ramp, with the choice between generating fresh vs reading existing values left open.
Assert: the skill asks how many colours are being compared and where the 12-step hex values should come from before building anything. Per *Workflow* step 2: "Always confirm which mode before proceeding — don't assume."
Observed live, 2026-08-10 (`projects/project-b/`): the mode was confirmed as "one ramp, self-comparison" and the source as the project's existing Primitive - Colour collection, both before any hex value was read — not inferred from the request's phrasing.
Assert also: when reading existing swatches, the ramp instance ID is looked up as an actual child rather than derived by offsetting the frame's own ID — a frame and the instance inside it have unrelated IDs, so an assumed offset silently reads a different node while looking like it worked.

Walked live: 2026-08-10 — a real ~170-node contrast-matrix instance, with the mode and the hex source both confirmed before any value was read.

## A10 · A run is not reported as done until it is verified
Fixture: a completed `figma_execute` call returning `{ titleUpdated, headersUpdated, blocksUpdated, errors }`.
Assert: `errors` is checked as empty, and every cell is read back by step 3's `apply_matrix.verify.*.js` (since 3.7.0) with no mismatch and `read` equal to `expected`; the screenshot that follows is for header legibility and clipping only.
Assert also: reporting success on the strength of the return value alone fails this case. The call can succeed against the wrong instance.
Observed live, 2026-08-10 (`projects/project-b/`): verification went beyond the return value alone — a full re-read counted every header's label against its expected step (each 1–12 appearing exactly twice) and every block's `Pass` value against expectation (the self-comparison diagonal reading exactly 12 `N/A`, matching the ramp's 12 steps, with the remaining split — most-fail, some-pass-at-3:1, some-pass-at-4.5:1 — internally consistent with a real ramp's own contrast profile), before the screenshot. The return value alone (all populated, zero errors) would have looked identical whether the underlying map was right or wrong; the independent re-read is what this case actually requires.

Walked live: 2026-08-10 — the same run's full re-read of every header and block property, plus a screenshot.

## A12 · A node map built from the wrong tree fails loud, not silently wrong — and the fix is to never build it that way
Fixture: a contrast-matrix instance placed by copy-paste from its defining library file into a project's target file, discovered per the pre-3.1.0 script (suffixes read from a separately-resolved main-component node rather than the instance itself).
Assert: every populate call against the resulting map returns `error: 'not found'` for all 169 nodes — a broken run, not a silently mis-populated grid. This is the safer of the two failure shapes discover-node-map.js's own comments warn about, but it still fails the workflow outright, and the case exists to fix the cause rather than rely on always landing on the safe side of it.
Observed live, 2026-08-10 (`projects/project-b/`): `getNodeByIdAsync` on the main component (fetched by ID from inside the consuming file) returned children whose own `.id` values did not match the suffixes the placed instance's children actually resolved under — confirmed by reading both trees back to back on the same instance. Fixed in 3.1.0 by deriving every suffix from a live instance's own children (see the script's header comment for the addressing mechanism), never from a separately-fetched main-component node.
Assert the negative introduced by the same fix: a header whose VARIANT property is *not* a `Light`/`Dark` pair (observed live: a boolean marking the blank corner cell) is left untouched by `build-matrix-script.py`, rather than receiving `"Light"`/`"Dark"` written into an unrelated property. `componentPropertyKeys.header.isLightDarkPair` gates this, and `references/node-map.example.json`'s genuine Light/Dark pair keeps existing behaviour for libraries that do have the toggle — `tests/test-matrix.py` re-run clean (38/38) after the change, confirming no regression on the documented shape.
Assert the batching evidence this same run produced: single-node calls succeed immediately; a 24-node header batch (property write plus two fill writes each) timed out twice before splitting to ~12 succeeded; a 24-node block batch (one property write each, no fills) succeeded on the first attempt. The "split into two halves" guidance this replaced was never measured against a real run.

Walked live: 2026-08-10 — a copy-pasted instance whose separately-fetched main-component children did not match the placed instance's own suffixes.

## A11 · No project-specific data is embedded in the skill (negative case, clause D)
Fixture: every `.md`, `.py`, `.js` and `.json` file in the skill.
Assert: none contains a Figma node ID, component property key, or file key lifted from a real file. Illustrative IDs use the `0:` page prefix by convention, so anything with another prefix is a real one that escaped.
Assert also: contrast ratios written in prose — `3:1`, `4.5:1` — are **not** flagged. A guard that cried wolf on the skill's own subject matter would be turned off within a week; node IDs are distinguished by having a multi-digit suffix, and property keys by the `#` that precedes them.
Until v3.0.0 this skill hardcoded one file's node IDs, component IDs, property keys and its **file key** — so its instance lookup matched nothing in any other library, while the addressing silently pointed at whatever nodes happened to share those IDs. Clause D has no mechanical test in `toolkit-standard.md`; this case is the mechanical test for this skill.

Runs: python3 tests/test-matrix.py — "no Figma file key"

## A13 · The instance search matches the main component by name, and is the script, not a paste
Fixture: a mock page holding two `_Ratios grid` instances (one with a `Title` text layer, one without), an unrelated instance, an instance with no resolvable main component, and one whose main component is named `_Ratios grid copy`.
Assert: `scripts/find-grid-instances.js` returns exactly the two `_Ratios grid` instances — exact name match, not a prefix; returns each one's `Title` text, or `null` where there is none; skips the instance with no main component rather than throwing.
Assert: Workflow step 1 points at the script and carries no inline copy of the search (clause G).
Runs: node tests/test-find-grid-instances.mjs — against a mock `figma`; the real `findAllWithCriteria` and `getMainComponentAsync` are not exercised.

## A14 · The apply script comes in batches, and a cell that throws is named while the rest run
Fixture: a two-colour payload, rendered by `render_batches`; one batch run against a mock `figma` whose one block's `setProperties` throws.
Assert: 8 batches (2 of headers, 6 of blocks), none over 12 headers or 24 blocks, every cell in exactly one, the title in the first only, each labelled `k/8`.
Assert: the batch with the throwing block returns, that block in `errors` with its node ID and message, its other 23 blocks written. Before 3.3.0 the whole grid was one call that reliably timed out, and a throw ended the run half-written with no list of what was done.
Runs: python3 tests/test-matrix.py — A14; against a mock `figma`, not yet against a live file.

## A15 · An existing ramp's hexes are read by the script, and only from a ramp of the documented shape
Fixture: a fake frame holding a note instance and a `_Colour ramp` instance whose 12 step columns each wrap a `Swatches` frame of two solid rows; then the same ramp with 11 columns, a half-opaque step, a gradient step, and a frame whose only instance is a lookalike component.
Assert: both rows come back as 12 `#RRGGBB` values in step order, the ramp found as a child by its main component's name whether the frame is given by id or by name, and the list is one `build-matrix-script.py` accepts for `--color-a` (it writes the batches). Assert (negative): 11 columns, a translucent or non-solid step, a lookalike component and an empty or missing frame each throw with the step and row named — never a short or guessed list, which the builder would fill a grid from in the wrong place. Recorded under toolkit-standard §D 23: the hexes were read by an agent-written walk each run.

Runs: node tests/test-read-ramp-hexes.mjs — "reads both rows of all 12 steps, in step order, as #RRGGBB", "a ramp without 12 Swatches columns throws, never returns a short list"

## A16 · The run is verified by reading every cell back, not by a screenshot
Fixture: the two-colour grid from A14, built with `--title`, its eight batches run in order against a stand-in `figma` that keeps what each write set; then the same with one block's `Pass` changed after the write.
Assert: the build writes two read-back parts beside the batches; after the batches, the read-back reads all 169 cells (title, 24 headers, 144 blocks), `read` equal to `expected` and no mismatch; with the block changed, exactly that block is named, field `pass`, with what was meant and what is there.
Recorded under toolkit-standard §D 23: step 5 checked the values by screenshot and spot check, which reads a wrong `Pass` on a cell nobody spot-checked as right.

Runs: python3 tests/test-matrix.py — "after every batch, the read-back finds every cell as meant", "a block whose Pass reads otherwise is named, with what was meant and what is there". Walked live 2026-10-31 (the 3.7.2 line above).

## A17 · A variant's options come from the component set, not the instance — *executed* 2026-10-31
Fixture: the stand-in grid of `tests/test-discover-node-map.mjs`, its instances carrying each property's value only and their component set the definitions, as Figma has them; a block whose `Contrast` variant is `Light`/`Dark`, a header whose `Corner` variant is not.
Assert: the map records the block's options and `isLightDarkPair: true`, and the header's `false`. Production bug: the script read options off the instance, where Figma has none, so every header's Light/Dark toggle went unswitched (seen live on a scratch fixture).
Runs: node tests/test-discover-node-map.mjs — "property keys are read off the instances: a header's variant is not a light/dark pair, a block's is"
