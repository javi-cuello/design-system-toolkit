# Colour format and type units

The value rules of Steps 0.2, 2.1 and 2.2. They cover how colour literals are written, how text-style metrics become CSS units, and the opt-in tables for metrics that are not variables. [SKILL.md](../SKILL.md) gives each step's action; this file gives its rules.

## Contents

- [Step 0.2: colour value format](#step-02-colour-value-format)
- [OKLCH and alpha come from the description](#oklch-and-alpha-come-from-the-description)
- [The coverage report](#the-coverage-report)
- [Step 2.1: text-style units](#step-21-text-style-units)
- [Detection](#detection)
- [The question, when detection is ambiguous](#the-question-when-detection-is-ambiguous)
- [Scope: three things this must not touch](#scope-three-things-this-must-not-touch)
- [Step 2.2: type metrics that are not variables](#step-22-type-metrics-that-are-not-variables)
- [The unit questions](#the-unit-questions)
- [rem letter-spacing depends on size](#rem-letter-spacing-depends-on-size)

## Step 0.2: colour value format

One format for the whole run. **Do not ask upfront: default to hex**. Hex comes from the fill and is always available; OKLCH is not, which is why hex is the default.

- After Step 2, if any `COLOR` variable's description parses as `oklch(...)`, the coverage report doubles as the offer to switch to OKLCH. The run waits for the answer.
- If none does, generate in hex and say so. There is nothing to ask.

The format applies to every cell that renders a **raw COLOR literal**. That is above all the primitive colour tables, plus the literal fallback on semantic and shadow tables. It does **not** touch alias cells, which show a token name rather than a value.

Two effects to expect rather than diagnose:

- OKLCH labels run about three times the width of hex, so the width rule will push most colour tables to 860. That is the rule working, not a defect.
- A colour literal with **no backing variable** (an unbound shadow colour, say) has no description to read. It stays hex under either setting; mention it in the report.

## OKLCH and alpha come from the description

**OKLCH is read from the variable's `description`, never computed from the fill**. The stored fill is 8-bit-rounded sRGB, so a computed OKLCH disagrees with the authored one in the second or third decimal. A value nearly but not quite the source's reads as token drift: the very bug this documentation exists to expose. If the description has no parseable `oklch(...)`, fall back to hex for that cell and **collect the name**. Never invent the value.

**Count the values in a description before choosing a reader**. Scale-generator tooling often writes one `oklch(...)` per mode, each on its own line tagged `· light` or `· dark`. But `oklchFrom` returns the *first* match, so on a two-mode collection it fills the Dark column with the Light value. Every cell is filled and well-formed, and silently wrong (defect 14). Use `oklchForMode` wherever the collection has more than one mode.

**Alpha tokens use a different schema, and the alpha itself is never derived again**. Recent generator output leads with a ready CSS value, then the fields:

| Kind | Description |
|---|---|
| Neutral alpha | `oklch(0.20 0.00 0 / 0.86%) · base #161616 · alpha 0.008584 · composites to Grey/1` |
| Chromatic alpha | `rgb(0 85 255 / 1.18%)` followed by the same base, alpha and composite fields |
| Older output | `base … · alpha …` only |

The CSS head carries the alpha as a **2dp percent**; the `alpha` field carries full precision. Read the alpha from the description with `alphaSpecForMode`, **per mode**, and render it at full precision. Rounding a float32 alpha to a whole percent moves 7 of a 12-step ramp's 11 inner steps by 1/255 when composited. That is the seam the colour system exists to prevent (defect 15). Why each kind lands in its bucket is in [helpers.md](helpers.md) § *Formatting*.

## The coverage report

**Report coverage before generating, not after: this report is also where the format is decided**. Once Step 2 has found the source variables, count the `COLOR` variables whose description holds a parseable `oklch(...)`. Tell the user, and wait:

> 142 of 156 colour variables have an OKLCH description. I can render values as OKLCH (the 14 without will show hex), or keep the whole run in hex. Which?

- With zero coverage, skip the question, generate in hex and note it.
- A run that silently mixes the two formats looks like a deliberate exception per row, and is very hard to spot in review.
- Report alpha-schema descriptions as a **separate bucket, never as missing**. They are filled in, and the user can check that at once.

`DOCGEN.oklchCoverage` makes the count ([helpers.md](helpers.md) § *OKLCH coverage*).

## Step 2.1: text-style units

Figma stores line-height and letter-spacing as percentages. The web wants neither as a percentage:

| Field | CSS wants | Why |
|---|---|---|
| Line-height | **unitless** (`1.5`) | A unitless value inherits the *ratio*. Every other unit, `%` and `em` alike, inherits the **computed length**. So `line-height: 150%` on `body` hands a child `h1` a literal 24px. The split is unitless against everything else |
| Letter-spacing | **`em`** (`0.02em`) | It resolves against the element's own font size, so tracking stays in proportion at 48px and through a fluid `clamp()`. A px value tuned at 16px is far too loose at 48px |

Both Figma percentages are *already* relative to font size. So both conversions are an exact division by 100; nothing is estimated.

**Which styles convert is decided per group, not per file**. A library with `Web app/…` and `Mobile app/…` converts the first and leaves the second as authored. Decide by the first path segment of each style name.

Step 3 treats the same segment as the parent tier (a page each) or the platform frame. When Step 3 splits pages, that is one unit decision per page. The decision always keys off the **original** first segment, taken before any parent is stripped.

## Detection

Run `webGroupState` ([helpers.md](helpers.md) § *Formatting*) over each distinct first segment. It has three outcomes, and the third keeps it honest:

| Segment | State | Action |
|---|---|---|
| `Web`, `Web app`, `Desktop web`, `www` | **web** | Convert. No question |
| `Mobile app`, `iOS`, `Print`, `Email` | **not web** | Leave as authored. No question |
| `Webinar`, anything web-like not on the list, or **no platform segment** (`Headline/lg-normal`) | **ambiguous** | **Ask** |

**Never infer web from the file name, the collection name, or a sense that the system is "obviously for the web"**. The group name is the only signal that is the user's own. A wrong guess rewrites every value in two columns and reports nothing.

## The question, when detection is ambiguous

Ask once, before generating, naming only the groups still unresolved:

> Two columns on the text-style tables depend on whether these are web styles, and the naming doesn't tell me:
>
> - **For web** I'll document line-height unitless (`150%` → `1.5`) and letter-spacing in `em` (`2%` → `0.02em`). Those are the two forms CSS needs, and both are exact conversions from Figma's percentages.
> - **Otherwise** I'll document them exactly as Figma stores them (`150%`, `2%`).
>
> Which for **{group names}**?

With more than one ambiguous group, take the answer per group. A library with `Web app` and `Marketing site` may want both converted; one with `Product` and `Print` will not. If the user answers for the whole run, apply it so and **say so in the report**, naming the groups it covered.

## Scope: three things this must not touch

1. **Alias cells**. A `lineHeight` or `letterSpacing` bound to a variable is a `Content=Alias` cell showing the token name. There is no value to convert: the alias rule wins, and conversion rewrites literals only.
2. **Variables pages**. A `FLOAT` variable holding `150` carries no unit: a ratio, a percentage or a pixel size look the same. Converting it is guessing. Leave every globals table alone, whatever the answer here.
3. **The samples table**. It renders specimen text through `setTextStyleIdAsync`, so it holds no unit string.

**Record the decision**. Persist the per-group map beside the colour format. In the final report, state which groups were converted, and whether by name or by answer. Name any value that could not convert faithfully. `Auto` and px-derived values are listed in [recipes.md](recipes.md) § *Units on the two type-metric columns*. A page that silently switched convention between runs is close to impossible to spot in review.

## Step 2.2: type metrics that are not variables

Text styles often **hard-code** line-height and letter-spacing: no `boundVariables` entry, no token, nothing on the variables page. The type scale then looks fully tokenised, with `Font/Size`, `Font/Weight` and `Font/Family` present. Yet two values a developer needs exist only inside the styles. This step documents them as extra tables on the **variables** page.

**Run it only when the user asks, or when the context document records it**. It adds tables that mirror no variable, so it is opt-in by nature. Never infer it from the source.

**Collect from the text styles, not the variables**. For each of `lineHeight` and `letterSpacing`, take only the styles where the field is **unbound**. A bound field already has a token and belongs to the alias rule. Reduce to the **distinct authored values**, as a variables table lists each value once.

**Place them in the frame group that holds the type tokens** (the one whose tables are `Family`, `Size` and `Weight`). Tables in a frame stay alphabetical, so they interleave: `Family · Letter spacing · Line height · Size · Weight`. That is intended; the badge tells them apart, not their position.

**Badge every such table**. The `_Title` instance has a `Label` BOOLEAN and a `Label text` TEXT, which `setupTable` otherwise forces off.

Set `Label=true`, and set `Label text` to a short phrase agreed with the user; `Not a variable` is the default. Without the badge, the table looks like a real token table. A reader would then look for `Font/Line height/*` in the collection and not find it. Prefer wording that is *true*: the values are in Figma, they are simply not variables.

## The unit questions

Two separate questions, and neither has a safe default:

| Field | Preferred | Other forms | Conversion |
|---|---|---|---|
| Line height | **unitless** (`146%` → `1.46`) | as authored (`146%`) | exact ÷100; the same at every size |
| Letter spacing | **`em`** (`-1%` → `-0.01em`) | `rem`, or as authored (`-1%`) | `em` exact ÷100; `rem` **not** exact (below) |

Ask both even when the answer seems obvious, and never carry over Step 2.1's decision for the text-style pages. Record the answers in the context document. A project may want the CSS form for one and the authored form for the other.

## rem letter-spacing depends on size

This trap is silent. Figma stores letter-spacing as a percentage **of the font size**:

- `em` is the same relationship, so `%` to `em` is an exact division, and one authored value stays one row.
- `rem` resolves against the **root** font size. The conversion is `pct/100 × fontSize / root`, so one authored `-1%` is a *different* rem at every size it is used at. It runs from -0.025rem at 40px down to -0.01rem at 16px.

Under `rem`, the distinct-value reduction is **per (value, font size) pair**, not per value. Two consequences to honour rather than smooth over:

1. **Never convert as though every style sat at the root size**. That gives one tidy row, right only at that size and wrong at every other, with nothing on the page to show it. If the user wants the short list anyway, say which sizes it misstates, and badge the table to match.
2. **Key the rows by value *and* size**, as in `-1% @ 40px`. Size alone collides: one size often carries two tracking values from two groups. A 16px title at `-1%` beside a 16px body at `0%` would lose a row.

**Ask for the root size whenever `rem` is chosen**. 16px is the near-universal default, but it is an assumption, not a fact. State it in the badge, the report and the context document. A zero value does not depend on size; render it once as `0rem`, not once per size.

Report the unit answers, the root size, and the row-count effect of `rem` in the final report.
