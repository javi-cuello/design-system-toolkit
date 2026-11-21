# What the script decides

These are the rules `scripts/generate.mjs` applies once every choice is recorded. The code is the authority; this page says how to read its output. The flags are listed in [choices.md](choices.md) only where they are one of the nine choices.

## Contents

- [The list](#the-list)
- [Primitives](#primitives)
- [Styles](#styles)
- [Line height](#line-height)
- [Tracking](#tracking)
- [Content](#content)
- [Phone mode](#phone-mode)
- [Variables](#variables)
- [Warnings](#warnings)

## The list

- A published list (`--list`) is used as it stands.
- Otherwise the list is base × ratioⁿ, rounded to 2px. Use `--round 1` for whole px.
- The formula runs from `--below` steps under the base to `--above` steps over it.
- Rounding adds and merges steps: 16 × 1.125ⁿ gives 26, 32 and 42 beside 28 and 36. So the rounded list is what is published.
- `--drop` leaves a size off the list. `--exception 46=48` replaces a formula size with a chosen one.
- Both are recorded by name in the output, never silent.
- Both are refused beside a published list, which states its sizes directly.

## Primitives

- Sizes are numbered by position. The base is `Font/Size/100`, and each step up adds 100.
- The steps under the base are 75, 50 and 25. The 75 is Polaris's (naming-text-styles); 50 and 25 continue it.
- Weights are `Font/Weight/regular`, `Font/Weight/medium` and `Font/Weight/semibold`.
- Families are named by role: `Font/Family/text`, `Font/Family/display` and `Font/Family/code`. Never by classification, such as `sans`.

## Styles

| Style | Size |
|---|---|
| Labels | The label sizes |
| `Body/sm` | One step under the base |
| `Body/md` | The base |
| `Body/lg` | One step up from the base |
| `Code` | Only when a code family is given. At the base; in content, one step below the reading body |
| Headings | Every list size above `Body/lg`; in content, every size above the base |
| Display | The largest `--display` sizes (default 1). A single one is `Display/lg` |

- Names are role and t-shirt size, centred on md: `Heading/2xs` up to `Heading/xl`.
- Code names flatten them, as in `heading-lg`.
- A style name never states a value or a tag.

## Line height

| Role | Ratio |
|---|---|
| Reading text and code | 1.5 |
| Labels | 1.3 |
| Headings | 1.2 |
| Display | 1.1 |

- With `grid`, each line height steps onto the nearest 4px, and a tie rounds down. So 12 at 1.5 is 18 and becomes 16: the 12/16 the systems use.
- Override per role or style with `--line-heights`.

## Tracking

- Tracking is set per style, in half-percent steps.
- It is interpolated between visual.md's anchors: 12px at 0, 16px at −1% and 22px at −2%. It is never tighter than −2%.
- A display style, or a heading from `--display-cut`, binds the display family at 0. The cut is already spaced tight.
- `--caps` styles take +5%.
- Override with `--tracking`.
- Figma gets percent, and CSS gets em.

## Content

With `--scope content`, long-form content reads in `Body/lg`.

| Heading | Size |
|---|---|
| h4 | The body size, in bold |
| h3 | The list size nearest 1.25× the body |
| h2 | The list size nearest the middle of 1.5–1.7× the body |
| h1 | The largest heading |

The strict stride (every other formula step) is reported beside each pick. Where they differ, the reading-site pick is used.

The script reports a content check when:

- No heading style sits at the body size, so h4 has no style.
- No heading style sits at a picked size.
- A level is not smaller than the level above it.

## Phone mode

- Every size up to the hold stays as it is. With `auto`, the hold is Body/lg in product UI and the reading body in content.
- A heading may land on Body/lg's size, which is not a collision.
- Each heading and display moves down `--phone-steps` list steps (default 1).
- In content, the page title moves to the list size nearest 1.6× the body.
- `--phone-sizes Display/lg=36` sets one size by hand. A size off the list is reported as a named exception.

The phone checks:

| Check | Fails when |
|---|---|
| Collision | Two levels land on one size. In content only h1–h4 are levels, so an unmapped heading on one is not reported |
| Zoom | A size falls under 0.4 of its desktop size |
| Shrink | Body or UI text is smaller on a phone |
| Title band | In content, the page title falls outside 1.6–1.9× the body (reading sites) |

## Variables

- There is one variable per style field, in the responsive collection, with modes Desktop and Mobile.
- `<Style>/Font size` aliases the size primitive. `<Style>/Line height` is in px.
- Never name one `Font size/<Role>/<size>`.
- Letter spacing stays in percent on the style (figma-handoff).

## Warnings

- A size on the list has no style.
- Rounding merges two formula steps into one size.
- Grid line heights are on: a named choice ([choices.md](choices.md)).
- A weight under 400 at 20px or smaller: a light weight at a text size (visual.md, *Weights*).
