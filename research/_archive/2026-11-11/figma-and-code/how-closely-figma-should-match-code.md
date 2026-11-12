# How closely should a Figma library match its code?

The argument that Figma "should match code" is really five arguments, and the useful answer is a different rule for each: match the names, the interface and the look; let the construction differ; leave behaviour to code; and write down every exception where a check can read it.

Researched October 2026; re-checked November 2026. Practitioner positions were read from their own posts and transcripts (Brad Frost, Nathan Curtis, TJ Pitre and Southleft, Jake Albaugh at Figma, Murphy Trueman, Greg Sargent). Shipping practice was read from primary sources: Primer's Figma contribution guide, MUI's design-kit release notes, Carbon's GitHub issues, GitLab Pajamas' UI-kit docs, HashiCorp Helios' Figma changelog, Orange OUDS releases, Adobe Spectrum's component schemas, Polaris' v12 migration, and twelve Code Connect files from Carbon, Primer and Figma's Simple Design System, each read in raw form. AI claims were read from Figma's MCP and Code Connect documentation. In November 2026 the Code Connect release notes were re-read (2.1.0, 26 October 2026: the setup wizard removed in favour of a skill, no change to what is validated; framework-specific parsers unmaintained since 17 August 2026), and the toolkit's own parity loop, run on two projects, was read for what it has tested; its findings are marked as the toolkit's. Where a claim rests on one source or on commentary, the text says so.

---

## What this answers

- What does "aligned" actually cover, and which parts can differ?
- Does it matter which side is the source of truth?
- Should component names, property names and option values match?
- Which properties may exist on one side only, and is drawing states as variants an acceptable exception?
- Can the internal structure differ, and which side should bend when the two disagree?
- How exact should the visual match be, and how is it measured?
- What does alignment change for AI that writes code from Figma, draws designs from code, or audits drift?
- How does a team keep its exceptions from turning into drift?

Section 12 is the lookup table and section 13 the short version. How each rendering property translates (shadows, strokes, radii, auto layout) is a separate piece, [where-figma-and-css-render-differently.md](where-figma-and-css-render-differently.md); what a rename does to consumers is [breaking-changes-in-a-figma-library.md](breaking-changes-in-a-figma-library.md).

---

## 1. What does "aligned" actually cover?

**The short answer.** Five separate things, and they do not deserve the same rule. Names, the property interface and the visual result should match. Internal structure may differ. Behaviour lives in code and is only described in Figma.

A Figma component and a coded component share a purpose and very little machinery. Figma draws with auto layout, variants and instance swaps; code renders with markup, CSS and props. Figma's own developer documentation says design and code props usually do not match one to one, which is why Code Connect exists at all. So "aligned" has to be split before anyone can argue about it:

| Layer | What it means | Who agrees it should match |
|---|---|---|
| Component names | `Button` in Figma is `Button` in code | everyone surveyed |
| Property interface | the same property names and option values (`variant: primary`) | almost everyone as a goal; Figma's own advocate allows different words |
| Visual result | same colours, sizes, spacing and type, from the same tokens | everyone; enforced to different degrees |
| Internal structure | layer tree and nesting against markup and child components | contested; most say it may differ |
| Behaviour | events, focus management, data, async state | lives in code; Figma can only show its outcome |

The practitioners who disagree most loudly about where truth lives still converge on the first three rows. Nathan Curtis says his belief in component API alignment has only hardened. Greg Sargent, who argues Figma and code should be built differently, still insists the naming has to match. The fight is almost entirely about rows four and five.

The toolkit's component contract draws the same line from the other direction, by asking which layers a check can hold exactly: the API, the structure, the token bound to each part per variant, layout as intent, and states as props with the token changes they cause. Behaviour, keyboard and focus stay in code tests; usage guidance stays on the docs page (`~/Projects/toolkit/knowledge/code/figma-handoff.md#what-a-component-contract-covers`). Every published system that ships component data (Spectrum's JSON schemas, Primer's `docs.json`, the custom elements manifest, Code Connect) stops at the API and structure too.

**What to do.** State the policy per layer, not as one sentence. "As aligned as possible" is right for names, the interface and the visual result. For structure the defensible rule is "same named parts, construction free". For behaviour it is "code owns it, Figma shows its states".

---

## 2. Does it matter which side is the source of truth?

**The short answer.** Less than the debate suggests. Practitioners disagree about which side changes first and agree about the destination: one interface, written down, that both sides implement.

Four positions turn up:

- **Code is the truth.** Brad Frost calls the Figma library a contract, a promise of what is available in code ([Design Systems Q&A](https://bradfrost.com/blog/post/design-systems-qa/)).
- **Figma is the truth.** Southleft's service page sells exactly that ([Southleft](https://southleft.com/figma-design-systems/)).
- **The truth moves.** TJ Pitre wrote in September 2026 that the source of truth is defaulted into rather than chosen, and moves like a ball in play; with ten engineers to one designer, it ends up being code ([The Source of Truth Is a Ping-Pong Ball](https://southleft.substack.com/p/the-source-of-truth-is-a-ping-pong)).
- **A spec sits above both.** Curtis routes everything through a platform-neutral spec and calls Figma's model an approximation of web, iOS and Android code; "a definition biased to one party's point-of-view is testimony, not a contract" ([Component Contracts and Schemas](https://nathanacurtis.substack.com/p/component-contracts-and-schemas)). Murphy Trueman lands nearby: the truth is the conversation between the two ([The bidirectional design system](https://murphytrueman.substack.com/p/the-bidirectional-design-system)).

Shipping systems mostly say code while maintaining a Figma library that mirrors it. Primer's Figma repository states that the source of truth is the code; its site calls Figma the source of truth for design exploration. Fluent 2 maps kit properties to code per platform and names Figma variables as the source for styling decisions. Carbon publishes Figma specs for v12 only after the code is reviewed and merged. GOV.UK is the counter-example: its guidance covers only coded prototypes, its Figma kits were community-built until a GDS team began official styles and components in 2026. Both directions have shipped: MUI's kit renames its variants to follow each React release ([MUI design kits releases](https://github.com/mui/mui-design-kits/releases)); Orange's OUDS renamed an iOS documentation section from `inputs` to `controls` to match Figma ([OUDS iOS releases](https://github.com/Orange-OpenSource/ouds-ios/releases)).

No system keeps the two identical by tooling alone. MUI's Sync plugin, which generated a theme from Figma, was suspended in 2024; its component sync had covered only Button, Switch and Typography and broke if a layer was renamed. Sparkbox's account of drift is typical: a radio button changed in production without design review was found nine months later by comparing screenshots against Figma.

The toolkit runs the loop with Figma canonical for the look and for the API while the design is drawn first, and offers a project the option of making a component contract, keyed by Figma component key rather than name, the source of the API instead. In both cases neither side updates the other directly: a change is a proposal, made on both sides and derived again (`~/Projects/toolkit/knowledge/code/figma-handoff.md#what-a-component-contract-covers`).

**What to do.** Do not stall the alignment rule on this debate. Write the interface down once (names, props, values) and treat a mismatch as a defect on whichever side is behind. For a team building on a code library such as MUI, code will lead most of the time; that is a default, not a doctrine.

---

## 3. Should component names match?

**The short answer.** Yes, and this is the strongest consensus in the material. The exceptions are parts that exist on one side only, and they are marked rather than renamed to hide it.

A designer and an engineer who say "Button" should mean the same thing, and every tool that pairs a Figma component with its code needs a key. Primer's contribution guide makes it a rule: `ActionList` in code is `ActionList` in Figma, with parts named after their subcomponents, such as `ActionList.Divider` ([Primer: contributing to Figma](https://primer.style/product/contribute/contributing-to-figma/)). MUI's kit uses the React export name in its paths (`Card/Elements/CardHeader`).

Matching does not mean matching casing. Curtis's 2026 spec work declares the Figma casing as a convention and transforms between them, so `Card header` and `CardHeader` are the same name ([What Component Specs Leave Behind](https://nathanacurtis.substack.com/p/what-component-specs-leave-behind)). The toolkit's inventory comparison does the same and nothing looser: a Figma component is in code when the code has a component of its name written any way ("Autocomplete input" is `AutocompleteInput`). Resemblance is only a suggestion: "Text area input" and `TextArea` are probably one component, and nothing in the two names proves it, so a proposed pair goes to a person to confirm (`~/Projects/toolkit/skills/design-code-parity/SKILL.md`, "Before measuring").

Three kinds of exception appear in shipping systems, all narrow:

- **A part only in code.** Carbon's `TabPanel` has no Figma component ([Carbon issue #17607](https://github.com/carbon-design-system/carbon/issues/17607)).
- **A component only in Figma.** Primer's `_Slot` placeholder has no code twin because code takes children directly.
- **One name on one side, two on the other.** Carbon draws one Menu item that maps to two React components; Figma's Simple Design System maps one input to `Input` or `InputField` depending on whether it has a label.

**What to do.** Match component names, with a declared casing convention between the sides. Mark the one-sided parts so nobody looks for a twin (Primer's `_` prefix). Where one Figma component maps to two code components, keep the Figma name equal to the more general code name and record the split in the mapping.

---

## 4. Should property names and option values match?

**The short answer.** Yes for both, and the values matter more than people expect. This is where the strongest voices agree and shipping systems most often fall short, usually because a rename later felt too expensive.

Jake Albaugh, on Figma's blog, called agreeing on the same prop and variant option names a quick win ([The Shared Language of Props](https://www.figma.com/blog/the-shared-language-of-props/)); Primer's guide says to write properties as they are written in code. The cost of not doing it shows up in mapping files. Carbon's Button has to translate almost every property ([Carbon Button.figma.ts](https://github.com/carbon-design-system/carbon/blob/main/packages/react/code-connect/Button/Button.figma.ts)):

| Figma property and value | Code prop and value |
|---|---|
| `Style: Danger primary` | `kind="danger"` |
| `Size: Large / Medium / Small / Extra small` | `size="lg" / "md" / "sm" / "xs"` |
| `Size: Expressive` | `isExpressive` (a size value becomes a boolean) |
| `Type: Icon only` | `hasIconOnly`, and the text moves to `iconDescription` |
| `Swap icon` | `renderIcon` |
| `State: Skeleton` | a different component, `ButtonSkeleton` |

A contributor asked in 2023 for `Style` to be renamed `kind`. The issue was closed, its author conceding that perfect alignment is impossible and could force unnecessary changes to how the Figma components are built ([Carbon issue #14836](https://github.com/carbon-design-system/carbon/issues/14836)). Three years later the mapping still reads `Style` to `kind`: a rename declined as disruptive, and the mapping file became the place the mismatch lives permanently.

Even Figma's Simple Design System is not perfectly aligned: `State: Disabled` becomes `isDisabled`, two booleans and two swaps become children ([SDS Button.figma.ts](https://github.com/figma/sds/blob/main/src/figma/primitives/button/Button.figma.ts)). Albaugh's own advice allows that design and code need not use the exact same language. Curtis's verdict on states is the honest summary: many revered systems diverge from code unnecessarily ([The Sorry State of States](https://nathanacurtis.substack.com/p/the-sorry-state-of-states-89dd4668737e)).

Names also beat structure in one migration worth knowing. Polaris v12 collapsed seven Button booleans (`connectedDisclosure`, `outline`, `destructive`, `primary`, `primarySuccess`, `plain`, `monochrome`) into two enumerations, `variant` and `tone`: `destructive` became `variant="primary" tone="critical"`. A Figma axis that mirrored the old booleans would have needed a mapping table; one that mirrors the enums maps straight through. Model an enumeration as one axis on both sides.

The toolkit adds a rule from a real escape: name code attributes as Figma names the prop, and declare a translation only for a real collision, such as `Role` to `variant`, because `role` is an ARIA attribute. On the reference project a code attribute named `tint` for Figma's `Colour` measured fine inside its own story and surfaced only when a screen held the component, because instance props compare under Figma's names (`~/Projects/toolkit/skills/design-code-parity/SKILL.md`, "Traps").

**What to do.** Make property names and option values match the code's words, with only the casing translated (`Size: Small` for `size="small"`). Keep translations to genuine collisions with HTML or ARIA names, and record each in one place the comparison owns. Treat every other translation in a mapping file as a rename waiting to happen.

---

## 5. Which properties may exist on one side only?

**The short answer.** Both kinds are legitimate and expected. Figma-only properties are show/hide toggles and drawing helpers; code-only properties are behaviour, accessibility and data. The rule is that each is marked, not removed.

Figma's property types are variant, boolean, instance swap, text and, since June 2026, slot; Curtis's phrase is that they are nowhere near comprehensive and bias heavily towards visual outcomes ([Code Only Props in Figma](https://nathanacurtis.substack.com/p/code-only-props-in-figma)). So the two lists never fully overlap:

- **Figma-only, show/hide toggles.** Code shows helper text when `helperText` is passed; Figma needs a boolean to show the layer. Primer marks these with a `?` (`title?`, `leadingVisual?`); Albaugh suggested a `:state` prefix.
- **Figma-only, drawing helpers.** Text properties that fill sample copy, and placeholders such as `_Slot`.
- **Code-only, events and handlers.** SDS's Code Connect injects `onPress` with no Figma property behind it.
- **Code-only, accessibility and semantics.** `aria-label`, heading `level`, the polymorphic `as`. Primer says a parameter that cannot be expressed in Figma, such as `alt` or `href`, need not be included; yet its IconButton exposes `aria-label` as a text property so designers write the accessible name.
- **Code-only, controlled state and data.** `value`, `onChange`, `minLength`.

Where code-only props are written down is split. Curtis and Pitre put them in a hidden "code only props" layer that never renders ([Southleft: implementing code-only props](https://southleft.substack.com/p/implementing-code-only-props-in-figma)); Sargent says they belong in documentation ([Figma and code library sharing](https://gregsargent.com/articles/figma-code-library-sharing)). The toolkit's parity loop treats a value the code offers and Figma never drew as a question rather than a pass: a `codeOnly` entry needs a reason, and asking "is every value your controls offer mapped to a Figma variant?" once on a finished build found four that were code ahead of the design (`~/Projects/toolkit/skills/design-code-parity/SKILL.md`, gate 4).

**What to do.** Accept one-sided properties, and mark the boundary: one prefix or suffix for Figma-only toggles, one agreed home for code-only props. Never let a code-only prop recorded in Figma reuse the name of a native prop (Curtis's rule). Check the other direction too: a value only code offers is a design question.

---

## 6. Is drawing states as variants an acceptable exception?

**The short answer.** Yes, and it is the best-documented accepted deviation. Figma has to draw hover, focus and pressed as variants; code produces them with pseudo-classes. Disabled and loading are props in code and often states in Figma. The deviation holds as long as the mapping is explicit and each state value means one thing.

CSS gives hover and focus through `:hover` and `:focus-visible`; there is no `state` prop. Figma has no pseudo-classes and its prototypes have no focus trigger, so a designer who wants to show a hovered button needs a variant. In CSS the states are independent and can apply together; a single axis shows one at a time. Drawing every combination multiplies the set for pictures nobody specifies differently: a focused button under the pointer shows its hover fill and its focus ring, both already defined.

Shipping systems map it the same way. SDS turns `State: Disabled` into `isDisabled`; Primer turns its `state` axis into `disabled` and `inactive`; Carbon's Checkbox turns one `State` axis into four booleans (`invalid`, `warn`, `disabled`, `readOnly`). Spectrum's published schema shows the cleanest split: `isDisabled` and `isPending` are booleans, and a separate `state` lists `default`, `hover`, `down` and `keyboard focus` ([Spectrum button schema](https://github.com/adobe/spectrum-design-data/blob/main/docs/site/public/schemas/components/button.json)).

| | Figma | Code (MUI) |
|---|---|---|
| Rest, hover, focus, press | `State: Rest / Focus / Hover / Press` | pseudo-classes; no prop |
| Disabled | `Disabled: True` or a `State` value | `disabled` (native, or `aria-disabled` where it must stay focusable) |
| Loading | `State: Loading` | `loading` (MUI Button and IconButton, v6.4 and later) |

Carbon carries the pattern one step further: `State: Skeleton` in Figma renders a separate component in code (`ButtonSkeleton`). Two traps sit here. **Compound values** such as `Checked-Hover` match no code and do not scale. **Inverted values**: Carbon maps `Show label` to `hideLabel` by inverting it, which works until someone edits one side and forgets.

The toolkit's rule matches: a state axis is pseudo-classes, disabled is the control's own, and a boolean that is really a state (`Selected`, `Checked`, `Expanded`) is the platform's state (`:checked`, `aria-selected`), never an invented attribute (`~/Projects/toolkit/knowledge/code/figma-handoff.md#variants-to-attributes`). Keep Focus on the axis, drawn as an outside stroke so it maps to `outline` and never shifts layout.

**What to do.** Accept interaction state as a Figma axis with no code prop, and disabled and loading as Figma states mapped to code booleans. Keep each value single-meaning, name boolean values after the code prop, and say in the spec which properties each state changes, so combinations are predictable without being drawn.

---

## 7. Can the internal structure differ?

**The short answer.** Yes. The named parts a consumer sees should match, and where each property sits; how each side builds them is left to what each side does well.

The arguments against mirroring are concrete. Curtis calls a fully transformable hierarchy across platforms a fool's errand. Sargent calls a React button whose layers mirror Figma's an anti-pattern. GitLab Pajamas dropped base components from its kit because they carried many hidden layers and properties, causing file bloat and slow prototypes; where one component needs a simplified version of another, Pajamas builds a copy inside the parent ([Pajamas UI kit components](https://design.gitlab.com/get-started/uik-components/)). Design System Diaries argues the other way, including layer structure in its parity checklist ([Close the gap](https://designsystemdiaries.substack.com/p/close-the-gap-how-to-boost-parity)); its case is strongest for anatomy and weakest for construction.

Structural differences are not free, though. Carbon's list of what Code Connect cannot map is made of them: RadioButton's props sit on each radio in Figma and on the group in code; a TreeView node's icon is a child in code and not a swap in Figma; nested lists are built differently. The Tampere Design System's feasibility review counted 25 components that mapped directly, 3 needing static snippets, 4 with structural mismatches and 2 with no Figma counterpart ([Tampere issue 37](https://github.com/Tampere/Tampere-design-system/issues/37)).

The toolkit's parity loop met the commonest benign case and turned it into a mapping rule: when the design draws a pair of frames the DOM collapses into one element (an outer frame that pads nothing around an inner one that pads 20), map the wrapper to nothing and the inner frame to the element. On one project that turned 52 of 56 newly surfaced differences into mappings, and the four left were real defects (`~/Projects/toolkit/skills/design-code-parity/SKILL.md`, "Traps").

**What to do.** Match the named parts and where each property sits (group or item). Leave construction free: auto-layout wrappers and CSS containers need not mirror each other. Record a property that lives in a different place on each side as a deviation, and record a collapsed wrapper as a mapping, not a waiver.

---

## 8. When should code bend for Figma, and Figma for code?

**The short answer.** Either may bend, and both have precedent. The test is which side carries the real cost of the difference.

Figma components multiply: every axis multiplies variants, and a prop that is cheap in code can double a Figma set (three types, four states, three sizes and an optional icon are 72 variants). Code components fan out: a code rename is a breaking change for every product using it.

| Situation | Who carries the cost | Usual direction |
|---|---|---|
| A prop name or value differs | both, through a mapping | rename to the code's word |
| One code component would make a huge Figma set | Figma (variant count) | split in Figma, one in code |
| One Figma component maps to two code components | code (two APIs) | keep, map with variant restrictions |
| A Figma term is clearer than the code's | code consumers | rename code only at a major version |

Shipping examples run both ways. Pajamas removed a Figma property from Modal because the header is not optional in GitLab UI. Helios moved LinkCTA into Button as variants behind an `isLink` property ([Helios Figma changelog](https://github.com/hashicorp/design-system/blob/main/packages/components/CHANGELOG-FIGMA-COMPONENTS.md)). A worked case from a library on MUI: merging Icon button into Button would have grown Button from 108 to 153 variants, and MUI ships `Button` and `IconButton` separately, so keeping two Figma components follows the code's API rather than bending away from it.

**What to do.** Default to Figma following code for names and values. Let Figma split a set that would be unmanageable and let code expose two components where its API needs them, keeping the names traceable and the split recorded. Rename code for Figma only when the Figma term is clearer and the change can ride a major version.

---

## 9. How exact should the visual match be, and how is it measured?

**The short answer.** Exact, as the standard, measured as data from one token source rather than reviewed by eye. Pixels point a person at problems; they never decide pass or fail.

Nobody argues for visual divergence; what varies is enforcement. Chromatic's answer is to link each story to its Figma variant for side-by-side review ([Chromatic](https://www.chromatic.com/blog/connect-figma-to-storybook/)). Southleft's Figma Console MCP scores a comparison of visuals, spacing, type, tokens, API and accessibility ([Figma Console MCP](https://github.com/southleft/figma-console-mcp)). The precondition is shared tokens, and most teams lack it: zeroheight's 2026 survey of 147 teams found 60% with no token automation; 29% automate design to code, 6% code to design and 5% both ([zeroheight Design Systems Report 2026](https://report.zeroheight.com/)).

The toolkit has run this as a gate on two projects, and its findings change what "measured" should mean (`~/Projects/toolkit/skills/design-code-parity/SKILL.md`):

- **Render and read computed styles.** A tool that scores a typed description of the code against a Figma node measures the typist; a wrong transcription scores 100%. The Figma Console MCP's spec comparison is of that kind.
- **Prove the set, not the sample.** Every variant the library declares is measured or waived by name; until that gate was written, the run had no opinion about the ninety-one variants nobody mentioned.
- **Compare what a frame holds, not only how it measures.** A navigation bar lost three links and gained a theme toggle in the library; every measured property still matched, and the check stayed green until the designer pointed at the screen.
- **Pixels are advisory.** A region comparison of design against page points eyes at composition problems; the reference project's four worst escapes each measured identical to their frames and were found by a person holding the two side by side. Frontier vision models, by the field's own evidence, detect under half of real single-property changes, which is why pictures never gate.

**What to do.** Generate both sides from one token source, then compare rendered geometry, colour, type and children per variant, from a release-pinned snapshot of the design. Look at the pictures of every state as well. Waive only what engines cannot reproduce, each with its size (section 11).

---

## 10. What does alignment change for AI?

**The short answer.** For code generation, a mapping (Code Connect) or the component API in context matters more than names, because it tells the model which component to import. Aligned names still pay where no mapping exists, make mappings cheap, and are what lets agents find counterparts when drawing designs or auditing drift.

**Code from Figma.** When an agent reads a selection through Figma's MCP server, Code Connect mappings arrive as snippets carrying the real import and usage ([Code Connect integration](https://developers.figma.com/docs/figma-mcp-server/code-connect-integration/)). Figma calls Code Connect the main way to get consistent component reuse, and says that without it the model is guessing ([Structure your Figma file](https://developers.figma.com/docs/figma-mcp-server/structure-figma-file/)). The design assumes names differ: `figma.enum('Style', { 'Danger primary': 'danger' })` translates a value, and variant restrictions send one Figma component to several code components ([Code Connect React](https://developers.figma.com/docs/code-connect/react/)). Since August 2026 the maintained path is template files; the framework-specific parsers receive no updates, and Code Connect 2.1.0 (October 2026) replaced its setup wizard with a `figma-code-connect` skill. Figma's official design-to-code skill for Claude ranks Code Connect first among its hints, and its Code Connect skill finds the code component by name, then compares props and translates values with an enum map: names make discovery cheap, the mapping makes the result correct.

**Does naming change what Claude writes?** A scripted experiment run in October 2026 tested it directly. Twelve instances of components from a library built on MUI (Button, Icon button, Text input, Alert, Checkbox, Switch, Chip) were each described the way Figma's MCP describes an instance, in two namings: the library's current Figma names (`Role`, `Feedback`, `Left icon`, `Label text`, `Text input`) and the same components aligned to the code's words (`Button role`, `Color`, `Start icon`, `Label`, `Text field`). Claude Sonnet 5 wrote the JSX for each under five conditions, five runs each, 300 calls, scored by script against the expected component and props.

| Condition | Props correct | Fully correct | Wrong props written |
|---|---|---|---|
| Aligned names + component API in context | 100% | 100% | 0 |
| Current names + component API in context | 100% | 100% | 0 |
| Current names + API + a Code Connect style mapping | 100% | 100% | 0 |
| Aligned names, no API | 86% | 52% | 21 |
| Current names, no API | 73% | 33% | 45 |

The failures say more than the averages. With the current names, Claude turned Figma words into props (`feedback="danger"`, `rightIcon`, `validation="error"`, `<TextInput>`); aligned names fixed those. Aligned names did not beat the code's own oddities: the library's Button takes `buttonRole`, not MUI's `variant`, and even with a Figma property called `Button role` Claude wrote `variant` or `role` in every Button case without the API, because its knowledge of MUI outweighed the name. And a property is not a child component: an aligned `Title` text property produced `title="…"` where the code wants an `<AlertTitle>` child. The limits are real: one model, twelve instances and near-deterministic outputs, so it is closer to twelve cases than sixty trials per condition. No published study measures the effect of name parity on AI output; a widely repeated "above 80% component reuse with Code Connect" figure was traced and dropped, because the cited source does not contain it.

**Designs from code.** Most AI design generation reads code: Figma Make's design-system kits take an npm package plus guidelines; v0 builds on a shadcn-style registry ([v0 design systems](https://v0.app/docs/design-systems)); Storybook's MCP experiment found agents otherwise generate their own components ([Storybook MCP discussion](https://github.com/storybookjs/ds-mcp-experiment-reshaped/discussions/1)). Since 2026 agents can also draw into Figma files with the file's own components ([Figma blog](https://www.figma.com/blog/the-figma-canvas-is-now-open-to-agents/)); to place one, the agent searches by text, and a code-derived vocabulary finds the component directly only when it is called what the code calls it.

**Audits.** An audit compares pairs, and pairing needs a key. Matching names are a key that maintains itself; every mismatch needs a hand-kept table, and a stale table produces findings that are wrong in a believable way. Carbon's tracker shows how literal this is: a Figma property named `Show label ` with a trailing space broke the mapping until someone found the character.

**What to do.** Put the component API in the model's context first: Code Connect for every published component, plus the system's types or docs reachable from CLAUDE.md or a skill. Align names anyway, because the context is not always there, and record code names that depart from their base library's convention in the mapping and the skill. Enforce with checks rather than prose instructions, which Anthropic's own guidance describes as advisory ([Claude Code best practices](https://code.claude.com/docs/en/best-practices)). Reject names with stray whitespace.

---

## 11. How do exceptions stay exceptions?

**The short answer.** Write each deviation down once, with its reason, its owner and, for a measured difference, its size, in the place the check reads, and let a deviation that no longer matches a real difference fail.

The systems that handle exceptions well name the exception where it lives (Primer's `?` suffix), encode the translation once (Code Connect files, published from CI in Carbon and Primer), and keep a list of what cannot be mapped (Carbon's open issue is in effect a deviation register). Southleft's contracts prototype states the principle for tools: missing information is reported, never guessed ([ds-contracts-poc](https://github.com/southleft/ds-contracts-poc)).

The toolkit's parity loop, run on two projects, sharpened the register into four properties a prose list does not have (`~/Projects/toolkit/skills/design-code-parity/SKILL.md`, part 6):

- **A waiver carries its size.** An open-ended waiver written for two pixels of stroke silently absorbed a twenty-two pixel bug, a label the code still rendered after being told to hide it. `within: 2` fails the moment it becomes a different difference.
- **A waiver has one owner:** fix the Figma file, fix the code, live content, or a ruled translation.
- **A stale waiver fails.** One that no longer matches a real difference is an excuse nobody can check.
- **Reasons come from a closed list, and none means "later".** A free-text "not yet translated" let a header built as a row pass every run against a design that draws a centred column.

One register can serve both people and checks. The reference project's deviations page lists every waiver from the same story blocks the check reads, as *Accepted* (the honest translation between tools) or *To fix* (one side could close it), and each waiver is put to the designer as a choice before it is written.

The accepted kinds are short, which is what keeps them exceptions: interaction state drawn as variants; disabled and loading as states mapped to booleans; Figma-only toggles and drawing helpers; code-only behaviour, accessibility and data props; a component split or merged on one side for manageability; a property placed on the group in code and on items in Figma; and rendering differences engines cannot remove. Anything outside the list is a rename or a fix waiting to happen.

**What to do.** Keep the register where the check reads it, with a fixed list of kinds and a reason, owner and bound for every entry. Review it when a component changes on either side, and remove an entry whose reason has gone.

---

## 12. Cheat sheet

| Layer | Rule | Accepted exceptions | Evidence strength |
|---|---|---|---|
| Component names | match; casing translated | one-sided parts, marked; one-to-two splits, recorded | strong consensus |
| Property names | match the code's word | translation only for an HTML or ARIA collision (`Role` to `variant`) | consensus as a goal; often missed; toolkit-tested |
| Option values | match the code's word | none beyond casing | stated goal; Carbon shows the cost |
| One-sided props | marked, one home for code-only | code-only values are design questions | split on where; toolkit-tested gate |
| Interaction state | Figma axis, no code prop | none needed | consensus |
| Disabled, loading | Figma state, code boolean | mapping recorded | consensus for disabled; Spectrum and MUI for loading |
| Visual result | match, from one token source, measured | rendering-engine differences, sized waivers | consensus; toolkit-tested loop |
| Internal structure | same named parts; construction free | property placement, recorded; collapsed wrappers, mapped | majority; one source argues for mirroring |
| Behaviour | code only; Figma shows outcomes | none | consensus |
| Splits and merges | follow code by default | Figma split for variant count; code split for API | precedent both ways |
| AI codegen | API or Code Connect in context; align names to shrink mappings | code names off their library's convention, recorded | Figma guidance; October 2026 experiment |
| Audits | names as join keys; register as the exception list | none | strong mechanism; toolkit-tested |

---

## 13. The short version

"Should Figma match code?" stops being an argument once it is split into layers. Component names, property names, option values and the visual result should match; that is the consensus from Brad Frost, who treats code as the truth, to Nathan Curtis, who treats a spec as the truth. Internal structure may differ: match the named parts and where each property sits, and let each side build them its own way. Behaviour belongs to code.

The exceptions the evidence supports are a short list: states drawn as variants, disabled and loading mapped to booleans, one-sided toggles and props, splits for manageability, and properties placed differently on group and item. The common failure is not a principled exception but an inherited mismatch a mapping file quietly absorbs, as Carbon's `Style` to `kind` has for three years.

For AI, the component API or a Code Connect mapping in context is the largest lever: in an October 2026 experiment it made naming irrelevant, and without it aligned names raised fully correct output from 33% to 52%. For audits, aligned names are the join key that needs no table.

What keeps it workable is measurement and a register: compare rendered code with a release-pinned snapshot of the design, every variant and what each frame holds, and let every accepted difference carry its reason, owner and size, so a recorded deviation passes, an unrecorded one fails, and a stale one fails too.

---

## 14. What to re-check later

- **AI tooling.** Figma's MCP server, Code Connect and agent writing to the canvas changed several times in 2026; behaviour here is as of November 2026 (Code Connect 2.1.0).
- **The October 2026 experiment.** One model, twelve instances, near-deterministic outputs; repeat with more components, other models and real MCP output before leaning on it.
- **No survey of name parity.** zeroheight's report covers token automation only.
- **Single-source claims.** OUDS's code-follows-Figma rename, Helios's `isLink` merge and Pajamas' integrated components each rest on one system's own records.
- **Not reached.** Atlassian, Fluent 2, Polaris, GOV.UK and Salesforce publish no Figma parity policy that could be opened; Curtis's 2021 post on crafting a shared component API could not be fetched; Christine Vallaure's March 2026 post arguing names must match exactly was read, but its URL was not kept.

---

## Sources

### Primary: shipping systems

- [Primer: contributing to Figma](https://primer.style/product/contribute/contributing-to-figma/)
- [Primer: Button.figma.tsx](https://github.com/primer/react/blob/main/packages/react/src/Button/Button.figma.tsx)
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
- [Polaris: migrating from v11 to v12](https://github.com/Shopify/polaris/blob/main/polaris.shopify.com/content/version-guides/migrating-from-v11-to-v12.mdx)
- [Fluent 2: design get started](https://fluent2.microsoft.design/get-started/design)
- [GOV.UK Design System issue 4437](https://github.com/alphagov/govuk-design-system/issues/4437)
- [Tampere Design System: Code Connect feasibility](https://github.com/Tampere/Tampere-design-system/issues/37)
- [zeroheight Design Systems Report 2026](https://report.zeroheight.com/)

### Primary: Figma and AI tooling

- [Figma: Code Connect for React](https://developers.figma.com/docs/code-connect/react/)
- [Code Connect releases](https://github.com/figma/code-connect/releases)
- [Figma MCP server: Code Connect integration](https://developers.figma.com/docs/figma-mcp-server/code-connect-integration/)
- [Figma MCP server: tools and prompts](https://developers.figma.com/docs/figma-mcp-server/tools-and-prompts/)
- [Figma MCP server: structure your Figma file](https://developers.figma.com/docs/figma-mcp-server/structure-figma-file/)
- [Figma MCP server: custom rules](https://developers.figma.com/docs/figma-mcp-server/add-custom-rules/)
- [Figma blog: the canvas is open to agents](https://www.figma.com/blog/the-figma-canvas-is-now-open-to-agents/)
- [Figma help: Check designs](https://help.figma.com/hc/en-us/articles/39592284074263)
- [Figma blog: The Shared Language of Props](https://www.figma.com/blog/the-shared-language-of-props/)
- Figma's official Claude plugin skills, `figma-design-to-code` and `figma-code-connect` (plugin version 2.2.111)
- [Anthropic: Claude Code best practices](https://code.claude.com/docs/en/best-practices)
- [Anthropic: set up your design system in Claude Design](https://support.claude.com/en/articles/14604397)
- [Builder.io: Visual Copilot](https://www.builder.io/blog/visual-copilot)
- [v0: design systems](https://v0.app/docs/design-systems)
- [Storybook MCP experiment discussion](https://github.com/storybookjs/ds-mcp-experiment-reshaped/discussions/1)
- [Southleft: Figma Console MCP](https://github.com/southleft/figma-console-mcp)
- [Southleft: ds-contracts-poc](https://github.com/southleft/ds-contracts-poc)
- [Chromatic: connect Figma to Storybook](https://www.chromatic.com/blog/connect-figma-to-storybook/)

### The toolkit's own tested rules

- `~/Projects/toolkit/skills/design-code-parity/SKILL.md` (waivers, gates, traps; two projects)
- `~/Projects/toolkit/knowledge/code/figma-handoff.md` (variants to attributes; what a component contract covers)

### Commentary: practitioners

- [Brad Frost: Design Systems Q&A](https://bradfrost.com/blog/post/design-systems-qa/)
- [Nathan Curtis: The Sorry State of States](https://nathanacurtis.substack.com/p/the-sorry-state-of-states-89dd4668737e)
- [Nathan Curtis: Code Only Props in Figma](https://nathanacurtis.substack.com/p/code-only-props-in-figma)
- [Nathan Curtis: Component Contracts and Schemas](https://nathanacurtis.substack.com/p/component-contracts-and-schemas)
- [Nathan Curtis: What Component Specs Leave Behind](https://nathanacurtis.substack.com/p/what-component-specs-leave-behind)
- [TJ Pitre: The Source of Truth Is a Ping-Pong Ball](https://southleft.substack.com/p/the-source-of-truth-is-a-ping-pong)
- [TJ Pitre: Code to Design Isn't the Point. System Parity Is.](https://southleft.com/insights/design-systems/code-to-design-isnt-the-point-system-parity-is/)
- [Southleft: implementing code-only props in Figma](https://southleft.substack.com/p/implementing-code-only-props-in-figma)
- [Murphy Trueman: The bidirectional design system](https://murphytrueman.substack.com/p/the-bidirectional-design-system)
- [Design System Diaries: Close the gap](https://designsystemdiaries.substack.com/p/close-the-gap-how-to-boost-parity)
- [Greg Sargent: Figma and code library sharing](https://gregsargent.com/articles/figma-code-library-sharing)
- [Sparkbox: finding and fixing design system drift](https://sparkbox.com/foundry/finding_and_fixing_design_system_drift)
- [Hardik Pandya: LLM design systems](https://hvpandya.com/llm-design-systems)
