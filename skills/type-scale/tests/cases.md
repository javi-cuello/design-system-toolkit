# Eval cases — type-scale (v1.2.0)

**Walked: 2026-11-21 — pass (13/13).** `node tests/test-generate.mjs` 24/24. Rewritten to clause I: the choices are in references/choices.md, the script's rules in references/script-rules.md (A4, A9–A12 read against it). Review findings closed: `none` for a number is refused (it had made every heading a display), `--phone no` asks nothing more. Failing direction checked: a grid tie rounding up gives 12/20 and fails A3; a default label weight of 400 fails A8. A1 is also traced to SKILL.md's *Ask before generating*.

Evidence marked "the 2026-11-15 run" is the maintainer's build of a project's type scale in Figma that day (Project A). The maintainer's feedback from it became recommended answers here, never silent defaults.

## A1 · No recorded preferences: the skill asks before it generates
Fixture: a context document whose §6 records none of the nine choices; the engine called with none.
Assert: nine questions come back, each with its recommended answer, and no list or styles; the CLI exits 2. Negative: nothing is generated from recommendations alone.
Evidence: maintainer instruction, 2026-11-15: the skill asks about preferences rather than applying defaults.
Runs: node tests/test-generate.mjs — "no recorded preferences: nine questions, nothing generated"; node tests/test-generate.mjs — "the CLI exits 2 with the questions when a choice is missing"

## A2 · Every preference recorded: the skill asks nothing
Fixture: a context document whose §6 records all nine choices, passed as options (`none` and `auto` count as answers).
Assert: no questions; a scale is returned. With one choice missing, only that one question is asked.
Runs: node tests/test-generate.mjs — "every choice recorded: no questions, a scale"; node tests/test-generate.mjs — "a fully recorded run asks nothing"; node tests/test-generate.mjs — "the CLI takes every choice with none and auto, and asks nothing"; node tests/test-generate.mjs — "one choice missing: only that question is asked"

## A3 · Product UI line heights: the role ratio rounded to 4px, offered first
Fixture: product UI scope; sizes 40, 32, 24, 20, 18, 16, 14, 12 and labels 16, 14, 12 at their role ratios.
Assert: 40/44, 32/40, 24/28, 20/24, 18/28, 16/24, 14/20, 12/16; labels 16/20, 14/20, 12/16. The line-height question recommends `grid` for product UI and `role` for content, and a grid run warns that it is a named choice.
Evidence: the 2026-11-15 run. Whole-px rounding was offered first, and the maintainer had to ask whether the research said anything about multiples of 4.
Runs: node tests/test-generate.mjs — "grid line heights match the 2026-11-15 run's ramp"; node tests/test-generate.mjs — "recommended answers come first: grid for product UI, role for content, labels medium"

## A4 · Variables mirror the style names
Fixture: any full run with a phone mode.
Assert: variables are named `<Role>/<size>/Font size` and `<Role>/<size>/Line height` (for example `Heading/lg/Line height`), in the collection the project named ("Text styles" recommended), with modes Desktop and Mobile. Negative: no variable starts `Font size/` or `Line height/`.
Evidence: the 2026-11-15 run; the maintainer rejected the `Font size/<Role>/<size>` grouping.
Runs: node tests/test-generate.mjs — "variables mirror style names in the named collection, with Desktop and Mobile"

## A5 · Family primitives by role; display binds the display family
Fixture: families text and display given.
Assert: family primitives are `Font/Family/text` and `Font/Family/display`; none is named by classification (`sans`, `serif`); the Display/lg style binds `Font/Family/display` with 0% tracking.
Evidence: the 2026-11-15 run.
Runs: node tests/test-generate.mjs — "family primitives by role, never by classification; display binds the display family at 0 tracking"

## A6 · Type primitives go in the project's shared primitives collection
Fixture: the primitives collection unanswered, then answered.
Assert: unanswered, the collections question is asked, never filled in; answered, size, weight and family primitives all name that collection. The skill never proposes a type-only primitives collection.
Evidence: the 2026-11-15 run.
Runs: node tests/test-generate.mjs — "type primitives go in the shared collection the project names"

## A7 · Labels at three sizes, 12, 14 and 16
Fixture: the recommended label sizes; then labels 12, 13, 16 on a list without 13.
Assert: `Label/sm` 12, `Label/md` 14, `Label/lg` 16. A label size off the list is refused.
Evidence: the 2026-11-15 run; a ramp with no 16px label was called "weird".
Runs: node tests/test-generate.mjs — "labels at 12, 14 and 16 as Label/sm, md and lg"

## A8 · The label weight is asked, medium offered first
Fixture: the weights question.
Assert: the recommendation is body 400, label 500, heading 600, display 500, code 400.
Evidence: the 2026-11-15 run; the maintainer moved labels from semibold to medium.
Runs: node tests/test-generate.mjs — "recommended answers come first: grid for product UI, role for content, labels medium"

## A9 · The published list is rounded, with named exceptions
Fixture: 16 × 1.125ⁿ rounded to 2px; then the knowledge base's worked example (type-on-a-phone: drop 26, 32, 42, 52, 58, 66; 46 → 48, 74 → 72).
Assert: rounding yields 26, 32 and 42 beside 28 and 36; the worked example publishes 12, 14, 16, 18, 20, 22, 28, 36, 48, 72 with 48 and 72 recorded as exceptions; 16 is `Font/Size/100`.
Runs: node tests/test-generate.mjs — "rounding to 2px adds 26, 32 and 42 beside 28 and 36"; node tests/test-generate.mjs — "the worked example's ten sizes, with 48 and 72 as named exceptions"

## A10 · Content takes reading-site ratios over the strict stride
Fixture: the worked example, content scope, 18px reading body.
Assert: h1 48, h2 28, h3 22, h4 18. The strict stride's h2 (36, twice the body) is reported and not used.
Runs: node tests/test-generate.mjs — "content takes reading-site sizes, not the strict stride: 48, 28, 22, 18"

## A11 · Phone mode: body holds, headings step down, collisions reported
Fixture: the worked example with a phone mode; then h2 forced onto h3's phone size; then product UI on the recommended answers, and with one heading forced onto the lowest's phone size.
Assert: body, labels and code hold; the page title goes to 28, h2 to 22, h3 to 20; no collision, no zoom failure. The recommended answers give no collision; both forced collisions are reported. Negative: body text never shrinks.
Runs: node tests/test-generate.mjs — "phone: body holds, headings step down the list, title near 1.6x the body, no collision"; node tests/test-generate.mjs — "recommended answers give no phone collision"; node tests/test-generate.mjs — "phone collision is reported when two levels land on one size"

## A12 · Tracking in half-percent steps; an unsupported ratio is refused
Fixture: a full run; then ratio 1.25.
Assert: every style's tracking is a multiple of 0.5% and no tighter than −2%; 14px is −0.5% (−0.005em in CSS). Negative: ratio 1.25 is refused, since the knowledge base gives 1.125 or 1.2 for the single step.
Runs: node tests/test-generate.mjs — "tracking in half-percent steps from the anchors, capped at -2%"; node tests/test-generate.mjs — "refuses a ratio the knowledge base does not give"

## A13 · A published list reproduces a real scale
Fixture: Project A's rulings (2026-11-15): list 12, 14, 16, 18, 20, 24, 32, 40 on 16; Inter and Inter Display; one display, no cut; phone hold auto.
Assert: Label/sm–lg 12, 14, 16; Body/sm–lg 14, 16, 18; Heading/sm, md, lg 20, 24, 32; Display/lg 40. On a phone Display/lg 32, Heading/lg 24, Heading/md 20, Heading/sm 18, Body/lg holds at 18; no collision. Negative: a drop or exception beside a list is refused.
Evidence: the 2026-11-15 run; the 1.0.0 engine could not take a published list, so this scale had no way through it.
Runs: node tests/test-generate.mjs — "a published list reproduces Project A's scale"; node tests/test-generate.mjs — "a sentinel where a number belongs is refused, never read as NaN"
