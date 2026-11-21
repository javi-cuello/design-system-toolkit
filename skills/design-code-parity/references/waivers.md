# 6 · Waivers, backlog and translations

What a red row may honestly become, the shape every waiver must have, and the translations a project states once. [SKILL.md](../SKILL.md) links here from part 6 and from gates 6 and 31.

## Contents

- [Three honest answers](#three-honest-answers)
- [Gate 6 · Stale waivers and the waiver's shape](#gate-6--stale-waivers-and-the-waivers-shape)
- [Gate 31 · A conversion rule is a translation, stated once](#gate-31--a-conversion-rule-is-a-translation-stated-once)

## Three honest answers

Red has three honest answers and no fourth.

1. **The code is wrong.** Fix it. This is the common case after a design change.
2. **They cannot agree yet, for a reason.** Write a **waiver** in the story, with the reason **and the size of the difference it excuses**.
3. **Figma has what the code does not.** A component, icon or variant: build it, or name it in a **backlog** file with a reason.

**An open-ended waiver is a hole in the ruler.** One written for two pixels of stroke on a group's height absorbed a twenty-two pixel bug. The run stayed green with the picture visibly wrong. A waiver that says `within: 2` is a fact about the difference, and fails the moment it becomes a different difference.

Waivers keep the difference *in* the report instead of hiding it. A waiver that no longer matches a real difference fails the check, so excuses do not pile up.

There are four kinds, each keyed so it can go stale:

| Key | What it excuses | Keyed by |
|---|---|---|
| `waivers` | A measured difference | Layer and property |
| `unmeasured` | A Figma variant no story renders, such as a placeholder-only variant | The variant |
| `codeOnly` | A control value the code offers and the design never drew | The control value |
| `literals` | A raw value typed in Figma where a token belongs | `Layer.kind` |

A spec folder holding only `figma.json` is a component nobody has built yet. The check says so until someone does, or until the backlog names it with a reason.

## Gate 6 · Stale waivers and the waiver's shape

Stale waivers fail, and so does a waiver of the wrong shape. The policy, `within` and `sameAs` included, is `tools/parity/waivers.mjs`. So a waiver means the same on every project.

Its functions are `checkWaiver()`, `excuses()` and `stale()`.

The `waivers` gate checks the shape and the bound at load, with the waiver's layer drawn somewhere, before anything is measured.

### Every waiver has an owner

| Owner | When |
|---|---|
| `fix: 'figma'` | The design should change |
| `fix: 'code'` | The code should change |
| `fix: 'toolkit'` | The snapshot or the engine records or compares the thing wrong |
| `content` | Live data |
| `decision` | A ruled translation |

A reason that says the toolkit is at fault is refused under any other owner. **One owner**: `fix`, `content` and `decision` exclude each other.

### A waiver on a number has its bound

The bound is `within`: the difference measured when the waiver was written, never a round number. A "3.5px narrower" in prose bounded nothing, and would have excused 30.

A value the page holds by rule, whatever the frame draws, is stated as that value instead: `is: 1117`, for a Main that is the window. A distance from the frame moved on a dozen screens with each text style.

### A bound is the declaring target's own

A waiver shared through a screens file's `base` or a spread was bounded by its widest sharer. One `within: 320` held 76 on seventeen screens, and a 700px regression of a 662px page passed under 1390.

So a full run fails a bound more than a unit of rounding wider than what it excused on its target. The `--accept` flag records each waiver's largest difference per target beside the measurements. Gate 12 then sees a difference move inside its bound.

### A page that sets nothing is its own ruling

State it as `decision: 'unset'`. It excuses exactly 0 or a keyword on a padding, a gap, a min- or max- size, a line height or a letter spacing.

A bare decision on a number excuses a keyword only. The gate says so at load, not at the first number measured.

### A bound is not the content's whole difference

Where a frame draws fewer rows than the page shows, the fixture shows the frame's rows. One project's fixture takes `rows=N` on the route. The bound left is what the rows' grouping explains: three more day markers, 162, where 5,974 had stood.

### What nothing used is stale

In a full run, a bound, an `is` or an `'unset'` ruling that nothing used is stale, whoever owns it. Only live data keeps the exemption.

### Globs and live data

- A `*` in a key is read in `appWaivers` only, and refused elsewhere at load.
- **Live data takes the widest the product can show, never today's**. A per-card bound on a badge showing each person's own age held one day's spread, and went red the next.

### The same checks for every excuse

`unmeasured` excuses and `overrides` reasons are checked the same way: their fields, and staleness.

**Staleness is judged across everything that declares the waiver**, not per frame. A screen file shares one waivers object among its frames, and a shell spreads into each. A per-frame count once flagged 533 where 109 were real.

**Count every path that consults a waiver**, not only the differ. A clip check that read waivers on its own made a live excuse look stale, and deleting it turned the run red.

One project had never checked staleness. Its first run found 109 dead excuses. They were deleted by exact source range, and a green run after proved it.

## Gate 31 · A conversion rule is a translation, stated once

Some differences are no one's to close:

- Figma has no margins, so a heading carries the space under it as padding.
- The scrim is the browser's `::backdrop`, so the dialog is the code's element.
- A text box is rounded to the pixel.

Written as waivers, each is restated on every screen it touches, and reads as a per-case decision. The decision is in the rule. So a project states it once, in `parity.translations`.

### The shape of a translation

- A key, which may glob (`*_h2.padding-bottom`), with its reason and bound.
- `on` and `except`, each a glob or a list of globs over target names.
- Or a list of rules, where the bound differs by breakpoint.

The engine applies each to every target it matches, as a ruled decision. A target's own waiver on the same key wins.

Its shape is a decision's: it takes no owner, and names a layer and a prop. A layer's presence, or clipped text, stays a screen's waiver.

### How a translation is reported and checked

- A row it excuses is reported as translated, apart from waived.
- A translation that excuses nothing in a full run is stale. Each entry of a list is judged apart.
- Two translations that claim one value fail by name.
- One whose bound reaches past the largest difference it excuses anywhere is loose.

On the reference project 104 per-screen waivers became 26 translations. Moving them showed that an unbounded ruling is exempt from staleness, so two had sat excusing nothing.

### A translation is no wider than the waivers it replaces

Stated once, a rule reaches every screen it matches. That includes screens where the old per-screen form had dropped it on purpose. A phone's contact form is a sheet, not a scrim over the page.

So before deleting the old waivers:

1. Scope `on` and `except` to the screens the old waivers covered.
2. Bound each family by its own old maximum.
