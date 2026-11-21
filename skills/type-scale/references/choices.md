# The nine choices

The script asks these nine choices before it generates anything. Each row gives the flag, the answer offered first, and where that answer comes from. "Project A's build" is the maintainer's build of a real project's type scale in Figma; the cases in `tests/cases.md` record its feedback. That feedback became recommended answers, never silent defaults.

Each choice takes `none` (or `auto` for the phone hold) as a recorded answer. So a run whose every choice is recorded asks nothing.

| Choice | Option | Recommended | Source |
|---|---|---|---|
| Scope | `--scope ui` or `content` | Product UI only. | one-type-scale |
| Sizes | `--list 12,14,…`, or `--ratio 1.125` or `1.2` with `--base 16` | Product UI: a published list, 12, 14, 16, 18, 20, 24, 28, 32 on 16. With labels and body that makes ten styles, over visual.md's five to seven for a tool screen; a screen draws a subset. Content: ratio 1.125 on 16. | visual.md, *Typography*: a productive ramp in Carbon's shape for product UI, a geometric scale for content |
| Display, cut, drop, exceptions | `--display 1`, `--display-cut none`, `--drop none`, `--exception none` | One display, no display cut, nothing dropped. | visual.md; type-on-a-phone |
| Line height | `--line-height grid` or `role` | Product UI: the role ratio rounded to the nearest 4px. Content: the role ratio, in whole px. | Project A's build; visual.md, *when Figma needs the line height in px* |
| Families | `--families "text=…,display=…"` | Asked: the project's text face and its display cut. A face with no display cut is given twice. | Project A's build |
| Weights | `--weights body=…,label=…,heading=…,display=…,code=…` | Body 400, label 500, heading 600, display 500. | Project A's build; one-type-scale, *weight by role* |
| Labels | `--labels 12,14,16` | Label/sm, md and lg at 12, 14 and 16. | Project A's build |
| Collections | `--primitives "<name>"` and `--collection "<name>"` | Primitives go in the project's shared global collection, which also holds spacing and more. It is asked, and never a type-only collection. Responsive variables go in "Text styles". | Project A's build |
| Phone mode | `--phone yes`, `--phone-hold auto`, `--phone-sizes none` | Yes. `auto` holds up to Body/lg (product UI) or the reading body (content). With `--phone no`, the hold and sizes are not asked. | type-on-a-phone |

## Why grid rounding is a named choice

Grid rounding departs from a [required] rule in visual.md: no line height is derived to sit on a grid. So it is a named choice, and the script warns whenever it is on. The ratio drifts per size: 18 at 1.5 becomes 28, which is 1.556 in CSS.
