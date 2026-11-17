# How closely should a Figma library match its code?

Which parts of a Figma library should match its code exactly, which may differ, and how to keep the exceptions from turning into drift.

In a library review, the designer says the Figma Button should match the code. The engineer opens the button's mapping file and reads it aloud: `Style: Danger primary` becomes `kind="danger"`, `Size: Expressive` becomes a boolean, and `State: Skeleton` becomes a different component altogether. Nobody in the room thinks the layer trees should be identical, and nobody thinks the colours may differ. "Should Figma match code?" turns out to be five questions with five different answers.

---

## What this answers

- [The scope of alignment](#the-scope-of-alignment): what "aligned" actually covers
- [The source of truth](#the-source-of-truth): whether it matters
- [Component names](#component-names): whether they should match
- [Property names and values](#property-names-and-values): whether they should match
- [One-sided properties](#one-sided-properties): which may exist on one side only
- [States as variants](#states-as-variants): whether states may be drawn as variants
- [Internal structure](#internal-structure): whether it may differ
- [Which side bends](#which-side-bends): when each side should bend
- [The visual match](#the-visual-match): how exact it should be
- [Alignment and AI](#alignment-and-ai): what alignment changes for AI
- [Recording exceptions](#recording-exceptions): how exceptions stay exceptions

For a lookup, use the [cheat sheet](#cheat-sheet); [the short version](#the-short-version) is the whole guide in four paragraphs. How each rendering property translates (shadows, strokes, radii, auto layout) is a separate guide, [Where Figma and CSS render differently](where-figma-and-css-render-differently.md); what a rename does to the people using a library is [What counts as a breaking change in a Figma library](breaking-changes-in-a-figma-library.md).

---

## The scope of alignment

Alignment covers five separate things, which don't deserve the same rule: names, the property interface and the visual result should match; internal structure may differ; behaviour lives in code.

Go back to the Button in the review. In Figma it is auto layout, variants and instance swaps; in code, markup, CSS and props. The two share a purpose and very little machinery, which is why [Code Connect](https://developers.figma.com/docs/code-connect/react/) exists at all. So "aligned" has to be split before anyone can argue about it:

| Layer | What it means | Who agrees it should match |
|---|---|---|
| Component names | `Button` in Figma is `Button` in code | everyone surveyed |
| Property interface | the same property names and option values (`variant: primary`) | almost everyone as a goal; Figma's own advocate allows different words |
| Visual result | same colours, sizes, spacing and type, from the same tokens | everyone; enforced to different degrees |
| Internal structure | layer tree and nesting against markup and child components | contested; most say it may differ |
| Behaviour | events, focus management, data, async state | lives in code; Figma can only show its outcome |

The first three rows are where the loud disagreements stop: even Greg Sargent, who argues Figma and code should be built differently, insists the naming has to match. The fight is about rows four and five.

The toolkit's component contract draws the same line: the API, structure, tokens per part and states are checked exactly, while behaviour stays in code tests (`knowledge/code/figma-handoff.md#what-a-component-contract-covers`). Spectrum's schemas and Code Connect stop there too.

State your policy per layer, never as one sentence. "As aligned as possible" is right for names, the interface and the visual result. **For structure, the rule to write down is "same named parts, construction free"; for behaviour, "code owns it, Figma shows its states".**

---

## The source of truth

The source of truth matters less than the debate suggests: practitioners disagree about which side changes first and agree about the destination, one written interface that both sides implement.

Ask the room which side is the truth, and four answers come back:

- **Code is the truth.** Brad Frost calls the Figma library a contract, a promise of what is available in code ([Design Systems Q&A](https://bradfrost.com/blog/post/design-systems-qa/)).
- **Figma is the truth.** [Southleft's service page](https://southleft.com/figma-design-systems/) sells exactly that.
- **The truth moves.** TJ Pitre argues it is defaulted into rather than chosen, and with ten engineers to one designer it ends up being code ([The Source of Truth Is a Ping-Pong Ball](https://southleft.substack.com/p/the-source-of-truth-is-a-ping-pong)).
- **A spec sits above both.** Curtis routes everything through a platform-neutral spec: "a definition biased to one party's point-of-view is testimony" ([Component Contracts and Schemas](https://nathanacurtis.substack.com/p/component-contracts-and-schemas)). Murphy Trueman lands nearby ([The bidirectional design system](https://murphytrueman.substack.com/p/the-bidirectional-design-system)).

Shipping systems mostly say code, while maintaining a Figma library that mirrors it. [Primer's Figma repository](https://github.com/primer/figma) states that the source of truth is the code. [Fluent 2](https://fluent2.microsoft.design/get-started/design) names Figma variables as the source for styling decisions. GOV.UK is the counter-example: its Figma kits were community-built until a GDS team began official ones in 2026 ([GOV.UK issue 4437](https://github.com/alphagov/govuk-design-system/issues/4437)).

In practice, changes flow both ways. [MUI's kit](https://github.com/mui/mui-design-kits/releases) renames its variants to follow each React release; Orange's OUDS renamed an iOS section to match Figma ([OUDS iOS releases](https://github.com/Orange-OpenSource/ouds-ios/releases)). And no system keeps the two identical by tooling alone: [MUI's Sync plugin](https://mui.com/material-ui/design-resources/material-ui-sync/) was suspended in 2024, and Sparkbox [found a drifted radio button nine months later](https://sparkbox.com/foundry/finding_and_fixing_design_system_drift) by comparing screenshots.

Don't stall the alignment rule on this debate. **Write the interface down once (names, props, values), and treat a mismatch as a defect on whichever side is behind.** If you build on a code library such as MUI, code will lead most of the time; that is a default, not a doctrine.

---

## Component names

Component names should match, and this is the strongest consensus in the material; the exceptions are parts that exist on one side only, and they are marked rather than renamed to hide it.

Every tool that pairs a Figma component with its code needs a key, and a shared name is the cheapest one. [Primer's contribution guide](https://primer.style/product/contribute/contributing-to-figma/) makes it a rule: `ActionList` in code is `ActionList` in Figma. Matching doesn't mean matching casing: Curtis declares the Figma casing as a convention and transforms between the two, so `Card header` and `CardHeader` are the same name ([What Component Specs Leave Behind](https://nathanacurtis.substack.com/p/what-component-specs-leave-behind)).

The toolkit's inventory comparison does the same and nothing looser: "Autocomplete input" is `AutocompleteInput`, while "Text area input" and `TextArea` are only a suggested pair, for a person to confirm (`skills/design-code-parity/SKILL.md`, "Before measuring").

Shipping systems show three kinds of exception, all narrow:

- **A part only in code.** Carbon's `TabPanel` has no Figma component ([Carbon issue #17607](https://github.com/carbon-design-system/carbon/issues/17607)).
- **A component only in Figma.** Primer's `_Slot` placeholder has no code twin, because code takes children directly.
- **One name on one side, two on the other.** Carbon draws one Menu item that maps to two React components.

Match component names, with a declared casing convention between the sides. **Mark the one-sided parts so nobody looks for a twin, as Primer does with its `_` prefix.** Where one Figma component maps to two code components, keep the Figma name equal to the more general code name and record the split in the mapping.

---

## Property names and values

Both should match, and the values matter more than people expect; this is where the strongest voices agree and shipping systems most often fall short, usually because a rename later felt too expensive.

Jake Albaugh, on Figma's blog, called agreeing on the same prop and variant option names a quick win ([The Shared Language of Props](https://www.figma.com/blog/the-shared-language-of-props/)). Primer's guide says to write properties as they are written in code. The cost of not doing it shows up in mapping files, and Carbon's Button is the clearest case: its [Code Connect file](https://github.com/carbon-design-system/carbon/blob/main/packages/react/code-connect/Button/Button.figma.ts) has to translate almost every property.

| Figma property and value | Code prop and value |
|---|---|
| `Style: Danger primary` | `kind="danger"` |
| `Size: Large / Medium / Small / Extra small` | `size="lg" / "md" / "sm" / "xs"` |
| `Size: Expressive` | `isExpressive` (a size value becomes a boolean) |
| `Type: Icon only` | `hasIconOnly`, and the text moves to `iconDescription` |
| `Swap icon` | `renderIcon` |
| `State: Skeleton` | a different component, `ButtonSkeleton` |

How did it stay that way? A 2023 request to rename `Style` to `kind` was closed as disruptive ([Carbon issue #14836](https://github.com/carbon-design-system/carbon/issues/14836)), and the mapping file became the place the mismatch lives permanently.

Even Figma's Simple Design System isn't perfectly aligned: two booleans and two swaps become children ([SDS Button.figma.ts](https://github.com/figma/sds/blob/main/src/figma/primitives/button/Button.figma.ts)), and Albaugh allows that design and code need not use the exact same language. Curtis's verdict is the honest summary: many revered systems diverge from code unnecessarily ([The Sorry State of States](https://nathanacurtis.substack.com/p/the-sorry-state-of-states-89dd4668737e)). An enumeration is one axis on both sides, which is why Polaris v12's move from seven Button booleans to `variant` and `tone` ([told in When to split or merge a component](../components-and-naming/when-to-split-or-merge-a-component.md#booleans-as-one-axis)) maps straight through to a Figma dropdown.

The toolkit adds a rule from a real escape: declare a translation only for a real collision, such as `Role` to `variant`, because `role` is an ARIA attribute. A code attribute named `tint` for Figma's `Colour` passed in its own story and failed only when a screen held the component (`skills/design-code-parity/SKILL.md`, "Traps").

**Make property names and option values match the code's words, with only the casing translated (`Variant: Outlined` for `variant="outlined"`).** Keep translations to genuine collisions with HTML or ARIA names, and record each in one place your comparison owns. Sizes are the one value the toolkit fixes whatever the code says: `lg`, `md`, `sm` (rule 6, argued in [Naming inside a Figma component](../components-and-naming/naming-inside-figma-components.md#swaps-variants-and-sizes)), with a code target's `small` recorded as a one-word translation. Treat every other translation in a mapping file as a rename waiting to happen.

---

## One-sided properties

Both kinds are legitimate and expected: Figma-only properties are show/hide toggles and drawing helpers, code-only ones are behaviour, accessibility and data, and each is marked rather than removed.

Take a text field. In code, helper text appears when `helperText` is passed; there's no switch for it. In Figma, the designer needs a boolean to show the helper layer. Meanwhile the code's `onChange` and `value` have nothing to draw at all. The two property lists can never fully overlap.

Figma's property types (variant, boolean, instance swap, text and, since June 2026, slot) are biased towards visual outcomes, as Curtis notes ([Code Only Props in Figma](https://nathanacurtis.substack.com/p/code-only-props-in-figma)). Each one-sided property falls into one of five kinds:

- **Figma-only, show/hide toggles.** The helper-text boolean; Primer marks these with a `?` (`title?`).
- **Figma-only, drawing helpers.** Text properties that fill sample copy, and placeholders such as `_Slot`.
- **Code-only, events and handlers.** SDS's Code Connect injects `onPress` with no Figma property behind it.
- **Code-only, accessibility and semantics.** `aria-label`, heading `level`, the polymorphic `as`; Primer's IconButton still exposes `aria-label` as a text property, so designers write the accessible name.
- **Code-only, controlled state and data.** `value`, `onChange`, `minLength`.

Where code-only props get written down is split: a hidden layer that never renders ([Southleft: implementing code-only props](https://southleft.substack.com/p/implementing-code-only-props-in-figma)), or the documentation ([Greg Sargent](https://gregsargent.com/articles/figma-code-library-sharing)).

The other direction matters as much. The toolkit's parity loop treats a value the code offers and Figma never drew as a question, not a pass; asked once of a finished build, it found four values where code was ahead of the design (`skills/design-code-parity/SKILL.md`, gate 4).

Accept one-sided properties, and mark the boundary: one prefix or suffix for Figma-only toggles, one agreed home for code-only props. Never let a code-only prop recorded in Figma reuse the name of a native prop (Curtis's rule). **Check the other direction too: a value only your code offers is a design question.**

---

## States as variants

States can be drawn as variants, and it is the best-documented accepted deviation, as long as the mapping to code is written down per component.

A designer wants to show the Button hovered. In CSS, hover and focus come from `:hover` and `:focus-visible`, and there is no `state` prop to set, so in Figma the hovered button has to be a variant. Disabled and loading are props in code. Shipping systems map it the same way: SDS turns `State: Disabled` into `isDisabled`, and Spectrum's [published button schema](https://github.com/adobe/spectrum-design-data/blob/main/docs/site/public/schemas/components/button.json) keeps `isDisabled` and `isPending` as booleans beside a `state` list of appearances.

Which values go on the `State` axis, which sit beside it, and what each becomes in code is owned by [What the State axis models](../components-and-naming/what-the-state-axis-models.md#state-values-in-code): Rest, Hover, Focus, Press and Loading on the axis, `Disabled` a True/False variant beside it, `Open` one value mapped to `aria-expanded`. Two traps are specific to mapping files: compound values such as `Checked-Hover` match no code, and inverted values (Carbon maps `Show label` to `hideLabel`) work until someone edits one side and forgets.

Accept interaction state as a Figma axis with no code prop. **Keep each state value single-meaning, and write the mapping to code in each component's notes.**

---

## Internal structure

Internal structure may differ: the named parts a consumer sees should match, and so should where each property sits, but how each side builds them is left to what each side does well.

Picture a card header. In Figma, the designer has an outer frame that pads nothing, wrapped around an inner frame that pads 20. In the DOM, the engineer has one element with 20 of padding. Here are the two side by side.

<svg role="img" viewBox="0 0 640 220" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0" font-family="system-ui, sans-serif">
<title>A card header in Figma and in the DOM. Figma: an outer frame with no padding wraps an inner frame with 20 of padding around the title. DOM: one header element with 20 of padding around the title. The outer frame maps to nothing; the inner frame maps to the element.</title>
<rect x="0" y="0" width="640" height="220" fill="#f7f6f2"/>
<text x="20" y="30" font-size="14" font-weight="600" fill="#1a1a1a">In Figma: two frames</text>
<text x="360" y="30" font-size="14" font-weight="600" fill="#1a1a1a">In the DOM: one element</text>
<rect x="20" y="48" width="260" height="120" rx="6" fill="none" stroke="#8a877e" stroke-dasharray="5 4"/>
<text x="30" y="64" font-size="12" fill="#5a5850">Header (padding 0)</text>
<rect x="30" y="72" width="240" height="86" rx="6" fill="#ffffff" stroke="#1f5fbf"/>
<text x="40" y="88" font-size="12" fill="#1f5fbf">Content (padding 20)</text>
<rect x="50" y="98" width="200" height="40" fill="#e3ecf9"/>
<text x="60" y="124" font-size="14" fill="#1a1a1a">Card title</text>
<rect x="360" y="72" width="240" height="86" rx="6" fill="#ffffff" stroke="#1f5fbf"/>
<text x="370" y="88" font-size="12" fill="#1f5fbf">&lt;header&gt; padding 20</text>
<rect x="380" y="98" width="200" height="40" fill="#e3ecf9"/>
<text x="390" y="124" font-size="14" fill="#1a1a1a">Card title</text>
<line x1="272" y1="115" x2="350" y2="115" stroke="#1f5fbf" stroke-width="1.5"/>
<polygon points="350,110 358,115 350,120" fill="#1f5fbf"/>
<text x="20" y="196" font-size="13" fill="#5a5850">Outer frame maps to nothing.</text>
<text x="360" y="196" font-size="13" fill="#1f5fbf">Inner frame maps to the element.</text>
</svg>

Both render the same header, and neither builder did anything wrong. The outer frame is a Figma construction detail with no job in the DOM, so the comparison should pair the inner frame with the element and skip the wrapper.

The toolkit's parity loop turned this case into a mapping rule; on one project it turned 52 of 56 newly surfaced differences into mappings, and the four left were real defects (`skills/design-code-parity/SKILL.md`, "Traps").

The arguments against mirroring are concrete. Curtis calls a fully transformable hierarchy across platforms a fool's errand, and GitLab Pajamas dropped base components from its kit for file bloat ([Pajamas UI kit components](https://design.gitlab.com/get-started/uik-components/)). Design System Diaries argues the other way ([Close the gap](https://designsystemdiaries.substack.com/p/close-the-gap-how-to-boost-parity)); its case is strongest for anatomy and weakest for construction.

Structural differences aren't free, though. Carbon's list of what Code Connect can't map is made of them, such as RadioButton's props sitting on each radio in Figma and on the group in code. Tampere's feasibility review gives the scale: 25 components mapped directly, 4 had structural mismatches ([Tampere issue 37](https://github.com/Tampere/Tampere-design-system/issues/37)).

Match the named parts and where each property sits (on the group or on each item). **Leave construction free: auto layout wrappers and CSS containers need not mirror each other.** Record a property that lives in a different place on each side as a deviation, and record a collapsed wrapper as a mapping, not a waiver.

---

## Which side bends

Either side may bend, and both have precedent; the test is which side carries the real cost of the difference.

The two sides grow costs in different shapes. In Figma every axis multiplies the variants: three types, four states, three sizes and an optional icon make 72. In code a rename fans out as a breaking change for every product using the component.

So the direction depends on where the cost lands. The usual cases look like this.

| Situation | Who carries the cost | Usual direction |
|---|---|---|
| A prop name or value differs | both, through a mapping | rename to the code's word |
| One code component would make a huge Figma set | Figma (variant count) | split in Figma, one in code |
| One Figma component maps to two code components | code (two APIs) | keep, map with variant restrictions |
| A Figma term is clearer than the code's | code consumers | rename code only at a major version |

Shipping examples run both ways: Helios moved LinkCTA into Button as variants behind an `isLink` property ([Helios Figma changelog](https://github.com/hashicorp/design-system/blob/main/packages/components/CHANGELOG-FIGMA-COMPONENTS.md)), and [When to split or merge a component](../components-and-naming/when-to-split-or-merge-a-component.md#four-buttons-become-two) works through a library on MUI where the variant count kept Icon button apart from Button.

**Default to Figma following code for names and values.** Let Figma split a set that would be unmanageable, and let code expose two components where its API needs them, keeping the names traceable and the split recorded. Rename code for Figma only when the Figma term is clearer and the change can ride a major version.

---

## The visual match

The visual match should be exact, as the standard, measured as data from one token source rather than reviewed by eye; pixels point a person at problems but never decide pass or fail.

Nobody argues for visual divergence; what varies is enforcement, from [Chromatic](https://www.chromatic.com/blog/connect-figma-to-storybook/)'s side-by-side review to Southleft's [Figma Console MCP](https://github.com/southleft/figma-console-mcp) scoring. Both depend on shared tokens, and most teams lack them. The [zeroheight Design Systems Report 2026](https://report.zeroheight.com/) found 60% of 147 teams with no token automation.

The toolkit has run this comparison as a gate on two projects, and what it found changes what "measured" should mean (`skills/design-code-parity/SKILL.md`):

- **Render the code and read computed styles.** A tool that scores a typed description of the code measures the typist: a wrong transcription scores 100%.
- **Prove the set, not the sample.** Every declared variant is measured or waived by name; before that gate, ninety-one variants went unchecked.
- **Compare what a frame holds.** A navigation bar lost three links and every measured property still matched.
- **Treat pixels as advisory.** The reference project's four worst escapes each measured identical to their frames and were found by a person holding the two side by side.

**Generate both sides from one token source, then compare rendered geometry, colour, type and children per variant, against a release-pinned snapshot of the design.** Look at the pictures of every state as well. Waive only what engines can't reproduce, each with its size (see [how exceptions stay exceptions](#recording-exceptions)).

---

## Alignment and AI

For code generation, a mapping or the component API in context matters more than names, because it tells the model which component to import; aligned names still pay where no mapping exists, and they are how agents find counterparts when drawing designs or auditing drift.

**Code from Figma.** With a Code Connect mapping, the snippet Figma's MCP server hands an agent [carries the real import and usage](https://developers.figma.com/docs/figma-mcp-server/code-connect-integration/); without it, Figma says, the model is guessing ([Structure your Figma file](https://developers.figma.com/docs/figma-mcp-server/structure-figma-file/)).

Code Connect assumes names differ: `figma.enum('Style', { 'Danger primary': 'danger' })` translates a value. Names make discovery cheap; the mapping makes the result correct.

**Does naming change what Claude writes?** A scripted experiment in October 2026 tested it. Twelve instances from a library built on MUI were described the way Figma's MCP describes an instance, once in the library's current Figma names (`Role`, `Feedback`, `Left icon`, `Label text`) and once aligned to the code's words (`Button role`, `Color`, `Start icon`, `Label`). Claude Sonnet 5 wrote the JSX under five conditions, five runs each, 300 calls scored by script.

| Condition | Props correct | Fully correct | Wrong props written |
|---|---|---|---|
| Aligned names + component API in context | 100% | 100% | 0 |
| Current names + component API in context | 100% | 100% | 0 |
| Current names + API + a Code Connect style mapping | 100% | 100% | 0 |
| Aligned names, no API | 86% | 52% | 21 |
| Current names, no API | 73% | 33% | 45 |

With the API in context, naming made no difference at all. Without it, aligned names lifted fully correct output from 33% to 52%.

The failures say more than the averages. With the current names, Claude turned Figma words into props (`feedback="danger"`, `rightIcon`), and aligned names fixed those. They didn't beat the code's own oddities: the library's Button takes `buttonRole`, and without the API Claude wrote MUI's `variant` every time, its knowledge of MUI outweighing the name.

> **Aside.** One model, twelve instances and near-deterministic outputs make this closer to twelve cases than sixty trials per condition. No published study measures the effect of name parity on AI output.

**Designs from code.** Most AI design generation reads code ([v0](https://v0.app/docs/design-systems) builds on a shadcn-style registry), and since 2026 agents can [draw into Figma files](https://www.figma.com/blog/the-figma-canvas-is-now-open-to-agents/) with the file's own components. To place one, the agent searches by text, so it finds the component directly only when it is called what the code calls it.

**Audits.** An audit compares pairs, and matching names are a key that maintains itself; every mismatch needs a hand-kept table, and a stale table produces findings that are wrong in a believable way. Carbon's tracker shows how literal this is: a property named `Show label ` with a trailing space broke the mapping.

**Put the component API in the model's context first: Code Connect for every published component, plus your system's types or docs reachable from CLAUDE.md or a skill.** Align names anyway, because the context isn't always there, and record code names that depart from their base library's convention. Enforce with checks rather than prose instructions, which Anthropic's guidance calls advisory ([Claude Code best practices](https://code.claude.com/docs/en/best-practices)).

---

## Recording exceptions

Write each deviation down once, with its reason, its owner and, for a measured difference, its size, in the place the check reads, and let a deviation that no longer matches a real difference fail.

Here is how a register goes wrong. A waiver written for two pixels of stroke difference, with no size on it, later absorbed a twenty-two pixel bug without failing.

The systems that handle exceptions well name the exception where it lives (Primer's `?` suffix), encode the translation once (Code Connect files published from CI), and keep a list of what can't be mapped, as Carbon's open issue does. Southleft's [contracts prototype](https://github.com/southleft/ds-contracts-poc) states the principle for tools: missing information is reported, never guessed.

The toolkit's parity loop, run on two projects, sharpened the register into four properties a prose list doesn't have (`skills/design-code-parity/SKILL.md`, part 6):

- **A waiver carries its size.** `within: 2` fails the moment the difference becomes a different one.
- **A waiver has one owner:** fix the Figma file, fix the code, live content, or a ruled translation.
- **A stale waiver fails.** One that no longer matches a real difference is an excuse nobody can check.
- **Reasons come from a closed list, and none means "later".**

One register can serve both people and checks: the reference project's deviations page lists every waiver from the blocks the check reads, as *Accepted* or *To fix*. The accepted kinds are few, which is what keeps them exceptions: they are the exceptions column of the [cheat sheet](#cheat-sheet), and anything outside it is a rename or a fix waiting to happen.

**Keep your register where the check reads it, with a fixed list of kinds and a reason, an owner and a bound for every entry.** Review it when a component changes on either side, and remove an entry whose reason has gone.

---

## Cheat sheet

| Layer | Rule | Accepted exceptions | Evidence strength |
|---|---|---|---|
| Component names | match; casing translated | one-sided parts, marked; one-to-two splits, recorded | strong consensus |
| Property names | match the code's word | translation only for an HTML or ARIA collision (`Role` to `variant`) | consensus as a goal; often missed; toolkit-tested |
| Option values | match the code's word | sizes are `lg`/`md`/`sm` (rule 6), translated in the mapping | stated goal; Carbon shows the cost |
| One-sided props | marked, one home for code-only | code-only values are design questions | split on where; toolkit-tested gate |
| Interaction state | Figma axis, no code prop | none needed | consensus |
| Disabled, loading | `Disabled` a True/False variant, `Loading` a `State` value; code booleans | mapping recorded | consensus for disabled; Spectrum and MUI for loading |
| Visual result | match, from one token source, measured | rendering-engine differences, sized waivers | consensus; toolkit-tested loop |
| Internal structure | same named parts; construction free | property placement, recorded; collapsed wrappers, mapped | majority; one source argues for mirroring |
| Behaviour | code only; Figma shows outcomes | none | consensus |
| Splits and merges | follow code by default | Figma split for variant count; code split for API | precedent both ways |
| AI codegen | API or Code Connect in context; align names to shrink mappings | code names off their library's convention, recorded | Figma guidance; October 2026 experiment |
| Audits | names as join keys; register as the exception list | none | strong mechanism; toolkit-tested |

---

## The short version

"Should Figma match code?" stops being an argument once you split it into layers. Component names, property names, option values and the visual result should match; that is the consensus from Brad Frost, who treats code as the truth, to Nathan Curtis, who treats a spec as the truth. Internal structure may differ: match the named parts and where each property sits, and let each side build them its own way. Behaviour belongs to code.

The exceptions the evidence supports are short: states drawn as variants, one-sided props, splits for manageability, and properties placed differently on group and item. The common failure is an inherited mismatch a mapping file quietly absorbs, as Carbon's `Style` to `kind` has for three years.

For AI, the component API or a Code Connect mapping in context is the largest lever: in an October 2026 experiment it made naming irrelevant, and without it aligned names raised fully correct output from 33% to 52%. For audits, aligned names are the join key that needs no table.

What keeps it workable is measurement and a register. Compare rendered code with a release-pinned snapshot of the design, every variant and what each frame holds, and give every accepted difference a reason, an owner and a size, so a recorded deviation passes, an unrecorded one fails, and a stale one fails too.

---

## What to re-check later

Researched October 2026; re-checked November 2026.

- **How it was checked.** Practitioner positions from their own posts; shipping practice from primary sources, including twelve Code Connect files from Carbon, Primer and Figma's Simple Design System, read raw.
- **AI tooling.** Figma's MCP server and Code Connect changed several times in 2026; behaviour here is as of November 2026 (Code Connect 2.1.0, 26 October 2026; framework-specific parsers unmaintained since 17 August 2026).
- **The October 2026 experiment.** Repeat it with more components, other models and real MCP output before leaning on it.
- **No survey of name parity.** zeroheight's report covers token automation only.
- **Single-source claims.** OUDS's rename and Helios's `isLink` merge each rest on one system's own records.
- **Not reached.** Atlassian, Fluent 2, Polaris, GOV.UK and Salesforce publish no Figma parity policy that could be opened.

---

## Sources

**Primary: shipping systems**

- [Primer: contributing to Figma](https://primer.style/product/contribute/contributing-to-figma/)
- [Primer Figma repository](https://github.com/primer/figma)
- [MUI design kits: releases](https://github.com/mui/mui-design-kits/releases)
- [MUI Sync](https://mui.com/material-ui/design-resources/material-ui-sync/)
- [Carbon issue #14836](https://github.com/carbon-design-system/carbon/issues/14836)
- [Carbon issue #17607](https://github.com/carbon-design-system/carbon/issues/17607)
- [Carbon: Button.figma.ts](https://github.com/carbon-design-system/carbon/blob/main/packages/react/code-connect/Button/Button.figma.ts)
- [Figma Simple Design System: Button.figma.ts](https://github.com/figma/sds/blob/main/src/figma/primitives/button/Button.figma.ts)
- [GitLab Pajamas: UI kit components](https://design.gitlab.com/get-started/uik-components/)
- [HashiCorp Helios: Figma components changelog](https://github.com/hashicorp/design-system/blob/main/packages/components/CHANGELOG-FIGMA-COMPONENTS.md)
- [Orange OUDS iOS releases](https://github.com/Orange-OpenSource/ouds-ios/releases)
- [Adobe Spectrum: button component schema](https://github.com/adobe/spectrum-design-data/blob/main/docs/site/public/schemas/components/button.json)
- [Fluent 2: design get started](https://fluent2.microsoft.design/get-started/design)
- [GOV.UK Design System issue 4437](https://github.com/alphagov/govuk-design-system/issues/4437)
- [Tampere Design System: Code Connect feasibility](https://github.com/Tampere/Tampere-design-system/issues/37)
- [zeroheight Design Systems Report 2026](https://report.zeroheight.com/)

**Primary: Figma and AI tooling**

- [Figma: Code Connect for React](https://developers.figma.com/docs/code-connect/react/)
- [Figma MCP server: Code Connect integration](https://developers.figma.com/docs/figma-mcp-server/code-connect-integration/)
- [Figma MCP server: structure your Figma file](https://developers.figma.com/docs/figma-mcp-server/structure-figma-file/)
- [Figma blog: the canvas is open to agents](https://www.figma.com/blog/the-figma-canvas-is-now-open-to-agents/)
- [Figma blog: The Shared Language of Props](https://www.figma.com/blog/the-shared-language-of-props/)
- Figma's official Claude plugin skills, `figma-design-to-code` and `figma-code-connect` (plugin version 2.2.111)
- [Anthropic: Claude Code best practices](https://code.claude.com/docs/en/best-practices)
- [v0: design systems](https://v0.app/docs/design-systems)
- [Southleft: Figma Console MCP](https://github.com/southleft/figma-console-mcp)
- [Southleft: ds-contracts-poc](https://github.com/southleft/ds-contracts-poc)
- [Chromatic: connect Figma to Storybook](https://www.chromatic.com/blog/connect-figma-to-storybook/)

**The toolkit's own tested rules**

- `skills/design-code-parity/SKILL.md` (waivers, gates, traps; two projects)
- `knowledge/code/figma-handoff.md` (variants to attributes; what a component contract covers)

**Commentary: practitioners**

- [Brad Frost: Design Systems Q&A](https://bradfrost.com/blog/post/design-systems-qa/)
- [Nathan Curtis: The Sorry State of States](https://nathanacurtis.substack.com/p/the-sorry-state-of-states-89dd4668737e)
- [Nathan Curtis: Code Only Props in Figma](https://nathanacurtis.substack.com/p/code-only-props-in-figma)
- [Nathan Curtis: Component Contracts and Schemas](https://nathanacurtis.substack.com/p/component-contracts-and-schemas)
- [Nathan Curtis: What Component Specs Leave Behind](https://nathanacurtis.substack.com/p/what-component-specs-leave-behind)
- [TJ Pitre: The Source of Truth Is a Ping-Pong Ball](https://southleft.substack.com/p/the-source-of-truth-is-a-ping-pong)
- [Southleft: implementing code-only props in Figma](https://southleft.substack.com/p/implementing-code-only-props-in-figma)
- [Murphy Trueman: The bidirectional design system](https://murphytrueman.substack.com/p/the-bidirectional-design-system)
- [Design System Diaries: Close the gap](https://designsystemdiaries.substack.com/p/close-the-gap-how-to-boost-parity)
- [Greg Sargent: Figma and code library sharing](https://gregsargent.com/articles/figma-code-library-sharing)
- [Sparkbox: finding and fixing design system drift](https://sparkbox.com/foundry/finding_and_fixing_design_system_drift)
