# Table anatomy and swatch binding

The components a mapping table is built from, where each swatch's colour lives, and how the script binds it.

## Contents

- [Component structure](#component-structure)
- [Blank cells: the `Empy` convention](#blank-cells-the-empy-convention)
- [Content variants: where the colour lives](#content-variants-where-the-colour-lives)
- [Binding a swatch](#binding-a-swatch)
- [Finding the swatch layer](#finding-the-swatch-layer)

## Component structure

Discover the components once per file, then reuse their IDs. Read each one's exact shape with `getMainComponentAsync()` on an existing instance.

**Never hardcode a property key such as `#0:8` from a previous project.** Keys are file-specific.

| Component | Cell it draws | Key variant property |
|---|---|---|
| **Level 1** | Role (Accent / Neutral / Feedback) | `Empy`: `"False"` · `"True"` |
| **Level 2** | Type (Primary / Danger / …) | `Empy`: `"False"` · `"True"` |
| **Level 3-4** | Both the Emphasis cell and the State cell | `Empy`: `"False"` · `"True"` |
| **Level token** | Token sample (swatch and dot-notation label) | `Content`: `"Frame"` · `"Shape"` · `"Stroke"` · `"Text"` |

Every one of them has a `Label text#<id>` component property. Always find the key at run time, never hardcode the suffix:

```js
function setLevelLabel(instance, text) {
  const propKey = Object.keys(instance.componentProperties).find(k => k.startsWith('Label text'));
  instance.setProperties({ [propKey]: text });
}
function setEmpty(instance, value) { instance.setProperties({ Empy: value }); } // value: 'True' | 'False'
```

## Blank cells: the `Empy` convention

Some columns do not apply to a row. Neutral has no Type split; Icon, Text and Stroke have no State. Don't omit the cell there. Instantiate the same component with `Empy: "True"`.

This keeps every row's column count the same, so the table reads as a grid. A reader can then tell "this combination does not exist" from "nobody filled this in". Never delete a Level instance to hide a column; switch its variant instead.

## Content variants: where the colour lives

This is the most error-prone part of the skill. Each `Content` variant has a different swatch layer.

**Switching variants keeps overrides on layers with the same name.** So a stale colour from the instance's old variant can survive the switch. Always reset explicitly; never assume a fresh variant starts neutral because the main component does.

| Content variant | Category | Where the token colour lives | What must stay neutral |
|---|---|---|---|
| `Frame` | Background (pill swatches) | `Content > Sample` (FRAME) fill | — |
| `Shape` | Icon | `Content > Sample` (ELLIPSE) fill | — |
| `Text` | Text | `Content > Sample > Aa` (TEXT) fill | `Content > Sample` (FRAME) fill, reset to the neutral paint: a prior `Shape` colour can bleed onto it |
| `Stroke` | Stroke | `Content > Sample`'s **stroke**, not its fill | `Content > Sample` keeps zero `fills` |

The pill is the `Content` frame, one level above `Sample`. Its own background is **always** a flat neutral overlay, never bound to a variable:

```js
const NEUTRAL_PAINT = { type:"SOLID", visible:true, opacity:0.03, blendMode:"NORMAL", color:{r:0,g:0,b:0}, boundVariables:{} };
```

Reset the pill to this exact paint whenever you build a token or switch its variant. For the `Text` variant, reset the `Sample` frame too. Then verify by walking the tree that no fill has a bound colour. Don't rely on a screenshot: a 3% tint is easy to misjudge by eye.

## Binding a swatch

The table above is code in `scripts/tokens-mapping.js` (`swatchPlan`). Do not retype it. Run the file as a `figma_execute` body with this prepended:

```js
const MODE = "token"; const CELLS = [{ id, content, variable, label? }, …];
```

Give one entry per `Level token` instance, a whole section per call. For each cell the script:

1. switches `Content`;
2. resets the pill, and the `Text` variant's `Sample` frame, to `NEUTRAL_PAINT`;
3. empties the `Stroke` variant's `Sample` fills;
4. reads the layers again after the switch;
5. binds the swatch, keeping its paint's opacity and blend mode;
6. sets the label.

The label comes from the variable name unless `label` is given. For example, `Colour/Background/Feedback/Danger/soft-rest` becomes `background.feedback.danger.soft.rest`.

`variable` is an id or a name. A name resolves against the file's local colour variables first. It then tries every colour already bound on the page, because a documentation file usually consumes its library rather than owning it.

The script returns `{ done, issues }`. A non-empty `issues` is the run's finding, not noise. A cell that throws is an issue of its own, `write failed: …`, and the batch goes on. A missing `Content` variant or a paint Figma will not bind are the usual causes.

Paste the file whole as the body on each call, with the constants in front. At about 10 KB, the call itself is the delivery, and one call covers a section. Where a bridge refuses the size, split `CELLS`, never the file. Never hand-write the bind instead: that is how the wrong-layer and bleed mistakes come back.

## Finding the swatch layer

**Check the layer name against the file before trusting it.** The `Text` swatch is `Aa`; this table once named it `A`.

A wrong name does not throw. `findOne` returns null, a guard skips the cell, and a walk reports the other cells as fully bound. That is how a section of 21 cells was once reported clean while all of them were bound to one token. A lookup by name that returns nothing is a finding about the name, never a cell to skip.

**Never** take "the first child node with any fill" as the swatch. The pill almost always has a fill too, the neutral overlay. A generic recursive search reaches it before `Sample`, and binds the wrong layer without a sign. Always name the target layer explicitly.
