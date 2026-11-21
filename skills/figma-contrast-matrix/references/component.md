# The `_Ratios grid` component

How the grid is built, how its cells are addressed, and the two traps in its parts.

## 1. What the component looks like

Each instance is `[Title, Content]`. `Title` is a plain text layer holding a short label, such as "Grey", "Purple" or "Green". Set it to match the colour or scale you are filling in.

`Content` wraps a grid 13 wide and 13 tall:

| Part | Count | What it holds |
|---|---|---|
| `Spacer` | 1 | The top-left corner slot; needs no styling |
| Column header | 12 | Steps 1–12 of Colour B |
| Row header | 12 | Steps 1–12 of Colour A, one at the start of each row |
| Result block | 144 | One per row and column |

- **Rows are Colour A**, **columns are Colour B**, or the same scale for a self-comparison.
- Each header's `Content` layer is filled with that step's swatch colour. Its label text colour is set for readability (§3).
- Each block gets a `Pass` variant (`N/A` / `4.5` / `3.1` / `No`) and a ratio label with two decimals.

A page can hold several instances at once, one per scale being audited. They are told apart by their `Title` text and instance name. Which page holds them is a per-project convention: take it from the context document.

## 2. Node structure reference

The node map holds the ordered local node-ID suffixes for one grid instance. Their order is `Title`, the `Content` wrapper, `Spacer`, 12 column headers, then 12 rows of a header and 12 blocks. It also holds the component property keys for headers and blocks. Every value is specific to the file it was read from. Generate it with `scripts/discover-node-map.js`; never copy one between files.

**Suffixes must be read from a live placed instance, never from a separately resolved main-component node.** Figma addresses an instance's children as `I<instanceId>;<suffix>`. That suffix is the main component's own numbering *in the file that defines it*. A proxy node, fetched by ID from inside the consuming file, may number them differently.

- The two agree when the component was imported into the consuming file through the API.
- They can disagree when an instance was placed by Figma's own copy-paste, the path used when API import times out.
- A map built from the wrong tree looks well-formed while addressing nothing. The script's header comment explains the mechanism.

Once read, a suffix is portable. Any other instance of the same main component shares it, so prefix it with `I<otherInstanceId>;` to address that instance's cell. Plain-frame nesting, such as the `Content` wrapper, does not affect the addressing, so a new wrapper frame needs no path changes. Only restructuring the component breaks it, and that is when to regenerate.

## 3. Header readability logic

The script always overrides the header's `Label` fill directly. It picks `#121212` (dark text) or `#FAFAFA` (light text), whichever gives the higher measured contrast ratio against that step's swatch. This override is unconditional, and it is what guarantees legibility.

A header may **also** carry a `Contrast` (or similarly named) `Light`/`Dark` VARIANT property. Where it does, it is switched alongside the fill. The component's own styling then stays right if it is ever fixed to not need the override. Its `Light` value goes with dark text, and `Dark` with light text.

- `discover-node-map.js` records this per project rather than assuming it exists.
- `componentPropertyKeys.header.isLightDarkPair` is true only for a VARIANT property with exactly the two options `Light` and `Dark`.
- `build-matrix-script.py` writes to it **only** in that case.

Where the header has no such property, the script leaves it alone. It does the same for a VARIANT property that means something else, such as a boolean marking the blank corner cell. The fill override already does the whole job. Writing `"Light"` or `"Dark"` into an unrelated property corrupts it silently rather than throwing.

## 4. Block label binding

A `_Block` component set can carry a binding bug worth checking once. Sometimes only the `Pass=N/A` variant's `Label` is bound to the label-text component property, while the other variants hardcode a literal. Then setting the text property silently does nothing once the variant switches.

Confirm every variant's `Label` is bound to the same property before trusting a run. The symptom is a grid whose variants are right and whose numbers are all stale. Where the binding is right, the variant and the label text can be set in one `setProperties` call.
