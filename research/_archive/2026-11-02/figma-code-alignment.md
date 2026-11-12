# Figma and code alignment: what must match, and which exceptions are legitimate

How closely a design system's Figma library should match its code, layer by layer (component names, property names and values, visual result, internal structure, behaviour), which deviations shipping systems accept and why, and what each choice does to AI code generation, AI design generation and agents that audit drift. Written for a team on Material UI whose working position is "as aligned as possible, with recorded exceptions".

Researched October 2026. Practitioner positions were read from their own posts and transcripts (Brad Frost, Nathan Curtis, TJ Pitre and Southleft, Jake Albaugh at Figma, Murphy Trueman and others). Shipping practice was read from primary sources: Primer's Figma contribution guide, MUI's design-kit release notes, Carbon's GitHub issues, GitLab Pajamas' UI-kit docs, HashiCorp Helios' Figma changelog, Orange OUDS releases, Adobe Spectrum's component schemas, and twelve Code Connect files from Carbon, Primer and Figma's Simple Design System, each read in raw form. AI claims were read from Figma's MCP and Code Connect documentation and from tool vendors. Where a claim rests on one source or on commentary, the text says so.

---

## What this answers

The argument usually starts as "should Figma match code?" and turns out to be several questions:

- What does "aligned" actually cover, and which parts can differ?
- Where does the source of truth live, and does it matter for this decision?
- Should component names match?
- Should property names and their values match?
- Which properties may exist only in Figma, or only in code?
- Is interaction state, or loading, an acceptable exception?
- Can the internal structure differ?
- When should code bend for Figma, or Figma bend for code?
- Should the visual result match exactly?
- What does alignment change for AI that generates code from Figma?
- What does it change for AI that generates designs from code?
- What does it change for agents that audit drift between the two?
- Is any of this different for Claude, and does naming change what it writes?
- How should a team run its exceptions so they stay exceptions?

Section 15 is the lookup table. Section 16 is the short version for someone who reads nothing else.

---

## 1. What does "aligned" actually cover?

**The short answer.** Five separate things, and they do not deserve the same rule. Names, the property interface and the visual result should match. Internal structure may differ. Behaviour lives in code and is only described in Figma.

A Figma component and a coded component share a purpose and very little machinery. Figma draws with auto layout, variants and instance swaps; code renders with markup, CSS and props. Figma's own developer documentation puts it in one line: design and code props usually do not match one to one, which is why Code Connect, the file that maps a Figma component to its code, exists at all. So "aligned" has to be split before anyone can argue about it:

| Layer | What it means | Who agrees it should match |
|---|---|---|
| Component names | `Button` in Figma is `Button` in code | everyone surveyed |
| Property interface | the same property names and the same option values (`variant: primary`) | almost everyone as a goal; Figma's own advocate allows different words |
| Visual result | same colours, sizes, spacing, type, from the same tokens | everyone; enforced to different degrees |
| Internal structure | layer tree and nesting versus markup and child components | contested; most say it may differ |
| Behaviour | events, focus management, data, async state | lives in code; Figma can only show its outcome |

The practitioners who disagree most loudly about where truth lives still converge on the first three rows. Nathan Curtis, who has written about component API alignment for years, says his belief in it has only hardened. Greg Sargent, who argues that Figma and code should be built differently, still insists the naming has to match. The fight is almost entirely about rows four and five.

**What to do.** State the policy per layer, not as one sentence. A rule of "as aligned as possible" is right for names, the interface and the visual result, and it is the consensus position. For structure, the defensible rule is "same named parts, construction free". For behaviour, the rule is "code owns it, Figma shows its states".

---

## 2. Where does the source of truth live, and does it matter here?

**The short answer.** Practitioners disagree, and the disagreement matters less than it appears. Whichever side is called the source, both sides must agree on one interface, and that shared interface is what alignment protects.

Four positions turn up, from people who have each thought about this longer than most:

- **Code is the truth.** Brad Frost has said this consistently since at least 2023. In a 2024 Q&A he calls the Figma library a contract or a promise of what is available in code ([Design Systems Q&A](https://bradfrost.com/blog/post/design-systems-qa/)). His ecosystem model adds that each Storybook recipe should mirror its Figma recipe library.
- **Figma is the truth.** Southleft's service page for Figma design systems sells exactly that, with tokens mapping one to one to the codebase ([Southleft](https://southleft.com/figma-design-systems/)).
- **The truth moves.** TJ Pitre, who ran Southleft and now works on AI and design systems at Figma, wrote in September 2026 that the source of truth gets defaulted into rather than chosen, and that it moves between the two like a ball in play ([The Source of Truth Is a Ping-Pong Ball](https://southleft.substack.com/p/the-source-of-truth-is-a-ping-pong)). With ten engineers to one designer, he notes, the canonical source ends up being code.
- **A spec sits above both.** Nathan Curtis now routes everything through a platform-neutral component spec, warns against contracts sold as a single source of truth, and calls Figma's model an approximation of web, iOS and Android code ([Component Contracts and Schemas](https://nathanacurtis.substack.com/p/component-contracts-and-schemas)). Murphy Trueman lands nearby: the truth is the conversation between design and code ([The bidirectional design system](https://murphytrueman.substack.com/p/the-bidirectional-design-system)).

The positions disagree about direction (which side changes first) and agree about the destination: one interface, written down, that both sides implement. Even Frost's "promise" framing only works if the promise uses the code's words, and Curtis's spec only works if both libraries implement the same props.

A useful consequence for this decision: alignment does not require picking a winner. Shipping systems show both directions. MUI's Figma kit follows each React release and renames its variants to match ([MUI design kits releases](https://github.com/mui/mui-design-kits/releases)). Orange's OUDS goes the other way at least once: its iOS documentation renamed a section from `inputs` to `controls` to match Figma's definitions ([OUDS iOS releases](https://github.com/Orange-OpenSource/ouds-ios/releases)).

**What to do.** Do not stall the alignment rule on the source-of-truth debate. Write the interface down once (names, props, values) and treat a mismatch as a defect on whichever side is behind. For a team building on MUI, code will lead most of the time, as it does for MUI's own kit; that is a default, not a doctrine, and the cases where Figma should lead are covered in section 8.

---

## 3. Should component names match?

**The short answer.** Yes, and this is the strongest consensus in the material. The exceptions are parts that exist on only one side, and they should be marked as such rather than renamed to hide it.

The case for matching names is simple: a designer and an engineer who say "Button" should mean the same thing, and every tool that pairs a Figma component with its code needs a key. Primer's Figma contribution guide makes it a rule: component names use PascalCase, and `ActionList` in code is `ActionList` in Figma, with parts named after their code subcomponents, such as `ActionList.Divider` ([Primer: contributing to Figma](https://primer.style/product/contribute/contributing-to-figma/)). MUI's kit uses the React export name inside its Figma paths (`Card/Elements/CardHeader`). Design System Diaries' parity checklist puts identical names first ([Close the gap](https://designsystemdiaries.substack.com/p/close-the-gap-how-to-boost-parity)).

Matching does not mean matching casing. Figma names are read by people in a panel; code names are read by compilers. Curtis's 2026 spec work declares the Figma casing as a convention (none, sentence or title) and transforms between them, so `Card header` in Figma and `CardHeader` in code are the same name ([What Component Specs Leave Behind](https://nathanacurtis.substack.com/p/what-component-specs-leave-behind)). Pajamas writes Figma property keys with a capital and values in lowercase on purpose.

Three kinds of exception appear in shipping systems, all real and all narrow:

- **A part that exists only in code.** Carbon's Code Connect issue notes that `TabPanel` has no Figma component at all ([Carbon issue #17607](https://github.com/carbon-design-system/carbon/issues/17607)). Nothing in Figma needs it drawn.
- **A component that exists only in Figma.** Primer's library carries a local `_Slot` placeholder for custom content; it has no code twin because code takes children directly.
- **One name on one side, two on the other.** Carbon's Figma has one Menu item that maps to two React components depending on context. Figma's Simple Design System maps one Figma input to `Input` or `InputField` depending on whether it has a label.

**What to do.** Match component names, allowing a declared casing convention between the two sides. Mark the one-sided parts so nobody looks for a twin; Primer marks its Figma-only `_Slot` with a `_` prefix. Where one Figma component maps to two code components, keep the Figma name equal to the more general code name and record the split in the mapping.

---

## 4. Should property names and their values match?

**The short answer.** Yes for both, and the values matter more than people expect. This is the point where the strongest practitioner voices agree and shipping systems most often fall short, usually because renaming later felt too expensive.

The interface is what a designer sets in the properties panel and what an engineer passes as props. When the two use the same words, a designer's file reads as a specification. Jake Albaugh, writing on Figma's blog in 2023, called agreeing on the same prop and variant option names a quick win ([The Shared Language of Props](https://www.figma.com/blog/the-shared-language-of-props/)). Primer's guide is stricter: write properties as they are written in code. MUI's kit release 5.9.0 matched variant names to the React components.

The cost of not doing it shows up in mapping files. Carbon's Button is the clearest worked case, because its Code Connect file has to translate almost every property ([Carbon Button.figma.ts](https://github.com/carbon-design-system/carbon/blob/main/packages/react/code-connect/Button/Button.figma.ts)):

| Figma property and value | Code prop and value |
|---|---|
| `Style: Danger primary` | `kind="danger"` |
| `Size: Large / Medium / Small / Extra small` | `size="lg" / "md" / "sm" / "xs"` |
| `Size: Expressive` | `isExpressive` (a size value becomes a separate boolean) |
| `Type: Icon only` | `hasIconOnly`, and the button text moves to `iconDescription` |
| `Swap icon` | `renderIcon` |
| `State: Skeleton` | a different component, `ButtonSkeleton` |

A contributor asked in 2023 for Figma's `Style` to be renamed `kind` to match React. The issue was closed as a duplicate, and its author conceded that perfect alignment between the naming systems is impossible and could force unnecessary changes to how the Figma components are built ([Carbon issue #14836](https://github.com/carbon-design-system/carbon/issues/14836)). Three years later the mapping still reads `Style` to `kind`. That is the pattern worth recognising: a rename was proposed and declined as too disruptive, and the mapping file became the place the mismatch lives permanently.

Figma's Simple Design System, which Figma built to show best practice, is not perfectly aligned either: `State: Disabled` becomes `isDisabled`, two booleans and two swaps become children, and the default size is simply omitted ([SDS Button.figma.ts](https://github.com/figma/sds/blob/main/src/figma/primitives/button/Button.figma.ts)). Albaugh's own advice allows for this: design and code, he wrote, do not need to use the exact same language. That is the counterpoint in the evidence, and it comes from the tool vendor.

The honest summary is that alignment of property names is the stated goal everywhere and the achieved state almost nowhere. Curtis's 2024 review of states puts it plainly: many revered systems diverge from code unnecessarily ([The Sorry State of States](https://nathanacurtis.substack.com/p/the-sorry-state-of-states-89dd4668737e)).

**What to do.** Make property names and option values match the code's words, with only the casing translated (`Size: Small` for `size="small"`). This is consensus as a goal. Treat every translation in a mapping file as either a recorded exception (section 13) or a rename waiting to happen; do not let the mapping file become the place mismatches go to live. For a library on MUI, MUI's prop names and values are the default vocabulary.

---

## 5. Which properties may exist only in Figma, or only in code?

**The short answer.** Both kinds are legitimate and expected. Figma-only properties are usually show/hide toggles and drawing helpers; code-only properties are behaviour, accessibility and data. The rule is that each is marked, not that each is removed.

Figma's property types bias toward what can be seen. Curtis's phrase is that they are nowhere near comprehensive and lean heavily towards visual outcomes ([Code Only Props in Figma](https://nathanacurtis.substack.com/p/code-only-props-in-figma)). So the two lists never fully overlap, and shipping systems show the same shapes:

**Figma-only properties, and why they exist.**
- **Show/hide toggles.** Code shows a helper text when `helperText` is passed; Figma needs a boolean to show the layer. Primer marks these with a `?` (`title?`, `leadingVisual?`). Carbon's fluid inputs have a "Show tooltip" toggle with no code counterpart, logged in Carbon's own issue as a gap. Figma's SDS uses `Has Icon Start` beside an `Icon Start` swap; in code both become children.
- **Drawing helpers and preview content.** Text properties that fill sample copy, and placeholders such as Primer's `_Slot`.

Albaugh suggested a `:state` prefix on Figma-only properties so nobody reads them as code props. Curtis prefers the opposite direction, carrying code-only props into Figma, which section 6 and the next list cover.

**Code-only properties, and why they exist.**
- **Events and handlers.** SDS's Code Connect injects `onPress` with no Figma property behind it.
- **Accessibility and semantics.** `aria-label`, heading `level`, the polymorphic `as`. Primer's guide says a parameter that cannot be expressed in Figma, such as `alt` or `href`, need not be included.
- **Controlled state and data.** `value`, `onChange`, `minLength`.

Where those code-only props should be written down is a live disagreement. Curtis and Pitre put them in a hidden "code only props" layer inside the Figma component, treated as metadata that never renders ([Southleft: implementing code-only props](https://southleft.substack.com/p/implementing-code-only-props-in-figma)). Sargent says they belong in written documentation, not the Figma file ([Figma and code library sharing](https://gregsargent.com/articles/figma-code-library-sharing)). Primer interestingly goes further than either for one prop: its IconButton exposes `aria-label` as a Figma text property, so designers write the accessible name.

**What to do.** Accept one-sided properties as a normal part of the interface, and mark them so the boundary is visible: a consistent prefix or suffix for Figma-only toggles, and one agreed home for code-only props. Which home is a judgment call on split evidence; a hidden layer helps tools that read Figma, documentation is simpler to maintain. Pick one and apply it everywhere. One rule from Curtis is worth adopting regardless: a code-only prop recorded in Figma should never reuse the name of a native prop.

---

## 6. Is interaction state, or loading, an acceptable exception?

**The short answer.** Yes, and it is the best-documented accepted deviation in the material. Figma has to draw hover, focus and pressed as variants; code produces them with pseudo-classes. Disabled and loading are props in code and often states in Figma. The deviation is accepted as long as the mapping is explicit.

The mechanism is unavoidable. CSS gives hover and focus for free through `:hover` and `:focus-visible`; there is no `state` prop to pass. Figma has no pseudo-classes, so a designer who wants to show a hovered button needs a variant for it. Nearly every kit draws a `State` axis; Albaugh used exactly this case, disabled as a Figma state variant but a boolean in code, as his example of a reasonable exception.

Shipping systems map it the same way. SDS turns `State: Disabled` into `isDisabled`. Primer's Button turns its `state` axis into `disabled` and `inactive`. Carbon's Checkbox turns one `State` axis into four booleans: `invalid`, `warn`, `disabled` and `readOnly`. Adobe Spectrum's published component schema shows the cleanest split: `isDisabled` and `isPending` are booleans, and a separate `state` lists `default`, `hover`, `down` and `keyboard focus` ([Spectrum button schema](https://github.com/adobe/spectrum-design-data/blob/main/docs/site/public/schemas/components/button.json)).

Loading is the case the starting position names, and the evidence supports treating it as a Figma state with a code prop behind it. The worked case:

| | Figma | Code (MUI) |
|---|---|---|
| Rest, hover, focus, press | `State: Rest / Hover / Focus / Press` | pseudo-classes; no prop |
| Disabled | `Disabled: True` (or a `State` value) | `disabled` |
| Loading | `State: Loading` | `loading` (MUI Button and IconButton, v6.4 and later) |

Skeletons are the same pattern one step further. Carbon draws `State: Skeleton` on Button, Checkbox and Tabs items, and code renders a separate component (`ButtonSkeleton`, `TabsSkeleton`). Carbon lists the cases its mapping cannot express, such as an Accordion skeleton that is a whole component in code but a state on one item in Figma.

Two traps sit here. **Compound state axes**: Curtis's review faults state values that combine conditions (`Checked-Hover`), because they do not match code and do not scale. **Values that mean the opposite**: Carbon's Toggle maps Figma's `Show label` to code's `hideLabel` by inverting it, which works until someone edits one side and forgets the inversion.

**What to do.** Accept interaction state as a Figma axis with no code prop, and disabled as a Figma state that maps to a code boolean; both are consensus. Loading as a Figma state mapped to a code boolean is supported by Spectrum's schema and MUI's `loading` prop, with no wider practitioner evidence. Keep each state value single-meaning (no `Checked-Hover`), name the boolean values after the code prop where one exists (`Disabled`, `Loading`), and record the mapping once, in Code Connect or the deviation register. A team that already uses `Rest | Focus | Hover | Press` has no reason to rename those values: no code identifier depends on them.

---

## 7. Can the internal structure differ?

**The short answer.** Yes. The named parts a consumer sees should match; how each side builds them should be left to what each side does well. Mirroring code's construction in Figma, or Figma's in code, is where most practitioners say alignment goes too far.

The arguments against mirroring are concrete. Curtis calls a fully transformable hierarchy across platforms a fool's errand, because all code platforms diverge. Sargent calls a React button whose layers mirror Figma's an anti-pattern. GitLab Pajamas dropped base components from its UI kit because components built on them carried many hidden layers and properties, which caused file bloat and prototype performance problems; where one component needs a simplified version of another, Pajamas builds a copy inside the parent and keeps it in step through a hidden variable collection ([Pajamas UI kit components](https://design.gitlab.com/get-started/uik-components/)).

The argument for mirroring comes from Design System Diaries, which includes subcomponents and layer structure in its parity checklist. The case for it is strongest for anatomy (the named parts: header, body, footer, icon) and weakest for construction (wrapper frames, auto-layout nesting, CSS containers).

Carbon's issue tracker shows what structural differences look like in practice, and why they are not free:

- **Group props drawn on items.** RadioButton's props sit on each radio in Figma and on the group in code.
- **Children versus swaps.** A TreeView node's icon is a child in code and was not built as a swap in Figma.
- **Nesting built differently.** Nested lists are constructed differently on each side.

Each of those became a line in Carbon's list of things Code Connect cannot map. Structural difference is acceptable; unrecorded structural difference turns into an unmappable component later.

**What to do.** Match the named parts and where each property sits (on the group or on the item), because a consumer sees those. Leave construction free: auto-layout frames, helper layers and CSS containers need not mirror each other. When a property has to live in a different place on each side, as Carbon's RadioButton does, record it as a deviation. This is the majority view; the minority that mirrors structure is optimising for handoff clarity, which matched part names already provide.

---

## 8. When should code bend for Figma, or Figma bend for code?

**The short answer.** Either side may bend, and both directions have shipping precedent. The test is which side carries the real cost of the difference, and the bend is recorded as a deviation rather than presented as the standard.

Most discussion assumes code is fixed and Figma adapts. The evidence shows both directions:

- **Figma bends for code.** MUI's kit renames variants to match React each release. Pajamas removed a Figma property from Modal because the header is not optional in GitLab UI. Helios moved its LinkCTA component into Button as variants behind an `isLink` property ([Helios Figma changelog](https://github.com/hashicorp/design-system/blob/main/packages/components/CHANGELOG-FIGMA-COMPONENTS.md)).
- **Code bends for Figma.** OUDS renamed a documentation section to match Figma's terms.
- **The split itself.** Carbon draws one Menu item and ships two React components. SDS draws one input and ships two. In the other direction, a team can split one coded component into two Figma components because one Figma set would be too large to manage, while the code keeps one component.

The cost test decides which way to go. Figma components multiply: every axis multiplies variants, and a component that is cheap in code (one more prop) can double a Figma set. Code components fan out to consumers: a rename in code is a breaking change for every product using it. So:

| Situation | Who carries the cost | Usual direction |
|---|---|---|
| A prop name or value differs | both, through a mapping | rename to the code's word |
| One code component would make a huge Figma set | Figma (variant count) | split in Figma, one in code (no shipping example found; a project-level judgment) |
| One Figma component maps to two code components | code (two APIs) | keep, map with variant restrictions |
| A Figma term is clearer than the code's | code consumers (breaking change) | rename code only at a major version |

A worked case from Project A's own library makes the split concrete. Merging Icon button into Button would grow Button from 108 to 153 variants. Project A's code builds its `IconButton` as a styled `Button`, and MUI ships `Button` and `IconButton` as separate components, so keeping two Figma components follows the code's public API rather than bending away from it; the variant count is the reason not to merge.

**What to do.** Default to Figma following code for names and values, because code renames are breaking changes. Let Figma split a component when one set would be unmanageable, and let code expose two components where its API needs them; in both cases keep the names traceable (the Figma part names the code component it maps to) and record the split. Code should rename for Figma only when the Figma term is genuinely clearer and the change can ride a major version.

---

## 9. Should the visual result match exactly?

**The short answer.** Yes, as the standard, measured with the same tokens on both sides. The exceptions are rendering differences no one can control (font rasterisation, sub-pixel layout), not design differences.

Visual alignment is the layer where nobody argues for divergence. What varies is how it is enforced. Chromatic's position since 2022 is that implementation and design naturally diverge over time, and its answer is to link each story to its Figma variant for side-by-side review ([Chromatic: connect Figma to Storybook](https://www.chromatic.com/blog/connect-figma-to-storybook/)). Southleft's Figma Console MCP goes further: a deterministic comparison of visual output, spacing, type, tokens, component API and accessibility, producing a scored diff ([Figma Console MCP](https://github.com/southleft/figma-console-mcp)). Design System Diaries adds a proportionate note: not every component needs pixel-perfect parity.

The precondition is shared tokens. zeroheight's 2026 survey of 147 teams found that 60% have no token automation at all; 29% of all teams automate from design to code, 6% from code to design and 5% both ways ([zeroheight Design Systems Report 2026](https://report.zeroheight.com/)). A team syncing tokens by hand will see visual drift regardless of naming discipline.

**What to do.** Treat visual match as the standard and measure it, rather than reviewing by eye. Generate both sides from one token source, then compare rendered geometry, colour and type per variant. Waive only what rendering engines cannot reproduce, and write each waiver down with its size so a later run can tell whether it still holds.

---

## 10. What does alignment change for AI that generates code from Figma?

**The short answer.** A mapping (Code Connect) matters more than matching names, because with a mapping the model is told which component to import. Matching names still pays: it makes mappings cheap to create, and it is what the model falls back on wherever no mapping exists.

The mechanism is specific. When an AI agent reads a Figma selection through Figma's MCP server, Code Connect mappings arrive in its context as snippets carrying the real import and usage, taken from the mapping's `imports` and `source` fields rather than from the Figma name ([Code Connect integration](https://developers.figma.com/docs/figma-mcp-server/code-connect-integration/)). Figma's guidance calls Code Connect the main way to get consistent component reuse, and says that without it the model is guessing ([Structure your Figma file](https://developers.figma.com/docs/figma-mcp-server/structure-figma-file/)). Variables carry a separate code syntax field per platform for the same reason.

That design assumes names differ, and handles it: `figma.enum('Style', { 'Danger primary': 'danger' })` translates a value, and variant restrictions send one Figma component to several code components ([Code Connect React docs](https://developers.figma.com/docs/code-connect/react/)). So exact parity is not required for AI codegen to work. Vendors make the same point from outside Figma: Builder.io's Visual Copilot uses semantic matching to find which code component corresponds to a Figma one ([Builder.io Visual Copilot](https://www.builder.io/blog/visual-copilot)), and Anima's model has mapped designs built with one library onto another.

Names still carry weight in three places:

- **Unmapped components.** Figma's AI best-practices page says its agent reads the names of layers and components. A component with no mapping is interpreted from its name and properties, and `Style: Filled` has to be guessed into `variant="contained"`.
- **Creating mappings.** Figma's Code Connect suggestions propose mappings between Figma components and code components ([Figma MCP tools and prompts](https://developers.figma.com/docs/figma-mcp-server/tools-and-prompts/)). A proposal starts from what the two sides have in common, and a shared name is the most direct signal; mismatched names fall back to hand-written mapping files.
- **Mapping upkeep.** Every translation in a mapping is a line that can go stale when either side changes.

The strongest public claim, that names must match exactly or the agent guesses, comes from a practitioner post in March 2026 and is overstated: it is true of automatic matching and false of hand-written mappings. Equally, no primary source has measured how much name parity improves AI output. monday.com's engineering team reported that unguided generation did not use its design-system components and hard-coded colours, and fixed it with a design-system MCP rather than renaming anything ([monday.com engineering](https://engineering.monday.com/)).

**What to do.** Map every published component with Code Connect first; that is the largest single lever and Figma's own recommendation. Align names and values second, because aligned names make the mappings short, mostly auto-suggested and less likely to rot. Treat any mapping line that only translates a word (`Style` to `kind`) as debt, and any line that encodes a real structural difference as a recorded exception.

---

## 11. What does it change for AI that generates designs from code?

**The short answer.** Most AI design generation reads code, not the Figma library, so code is what it reproduces. Alignment decides whether that output looks like the Figma library designers maintain, and whether an agent drawing in Figma can find the right component.

The code-first tools are explicit about where they read from. Figma Make's design-system kits take an npm package plus guidelines, with instructions such as using the design system's components over raw HTML. Vercel's v0 builds on a shadcn-style registry, which its documentation describes as a way to pass design-system context to AI models ([v0 design systems](https://v0.app/docs/design-systems)). Storybook's MCP experiment found that without it, agents tend to generate their own components instead of using the system's ([Storybook MCP discussion](https://github.com/storybookjs/ds-mcp-experiment-reshaped/discussions/1)).

The Figma-side path appeared in 2026: agents can now write into Figma files using the file's own components and variables ([Figma blog: the canvas is open to agents](https://www.figma.com/blog/the-figma-canvas-is-now-open-to-agents/)). To place a component, an agent searches the design system by text. When the Figma component is called what the code calls it, the agent's code-derived vocabulary finds it directly; when it is not, the agent needs a mapping or guesses.

**What to do.** Assume generated designs will follow the code's vocabulary and structure. Aligned names and values let those designs land on the real Figma components rather than look-alikes, which is the main reason alignment matters in this direction.

---

## 12. What does it change for agents that audit drift?

**The short answer.** An audit compares pairs, and pairing needs a key. Matching names are a key that maintains itself; every mismatch has to be bridged by a mapping table, and that table is one more thing that can drift.

Any automated comparison between Figma and code starts by deciding which Figma component goes with which coded one, and which Figma property goes with which prop. With aligned names, that join is mechanical. Without them, the audit needs a hand-kept table, and a stale table produces findings that are wrong in a believable way.

The tools reflect this. Southleft's parity check compares specs against implementations across visuals, tokens, API and accessibility without depending on Code Connect; to pair each spec with its implementation it needs a component identity, presumably from names or a supplied mapping. Figma's built-in Check designs works inside Figma only, does not use language models, and flags hard-coded values and components from the wrong library ([Figma: Check designs](https://help.figma.com/hc/en-us/articles/39592284074263)). Chromatic links stories to variants by hand, and a person compares them.

One trap from Carbon's own tracker shows how literal this is: a Figma property named `Show label ` with a trailing space broke the Code Connect mapping until someone found the extra character. Names are join keys, and join keys fail on whitespace.

**What to do.** Treat name and value alignment as what makes automated auditing possible at all, and keep the exceptions in one machine-readable place the audit reads (a mapping file or deviation register), so a recorded deviation is not reported as drift and an unrecorded one is. Run a check that rejects names with stray whitespace or casing drift; it is cheap and catches failures no reviewer sees.

---

## 13. Is any of this different for Claude, and does naming change what it writes?

**The short answer.** Neither Anthropic nor Figma says Figma names must equal code names for Claude. A small test on Project A's components found that once Claude had the component API in its context, naming made no difference at all; without that context, aligned names raised fully correct output from 33% to 52%, and the failures that remained were where the code's own names departed from convention.

**What the guidance says.** Anthropic's Claude Code guidance is generic but specific about where things go: the project's CLAUDE.md file holds conventions Claude cannot work out by reading the code, knowledge needed only sometimes belongs in a skill, and rules written in CLAUDE.md are advisory while hooks are deterministic ([Claude Code best practices](https://code.claude.com/docs/en/best-practices)). Anthropic's own design path reads the code rather than mapping names: Claude Design's design-sync reads tokens and components directly ([Set up your design system in Claude Design](https://support.claude.com/en/articles/14604397)). Figma's MCP documentation names Claude Code and tells teams to put rules in CLAUDE.md, such as always using components from the design-system path ([Figma MCP: custom rules](https://developers.figma.com/docs/figma-mcp-server/add-custom-rules/)).

The most Claude-specific evidence is Figma's official skills for Claude, read from the installed plugin (version 2.2.111). The design-to-code skill ranks its hints with Code Connect first and raw colour values last, and tells Claude to search the project for code components that match the design. The Code Connect skill searches the codebase for a component matching the Figma component's name, then compares props, accepting that properties do not always line up one to one and translating values with an enum map. So Claude's own tooling finds components by name and gets them right through a mapping: names make discovery cheap, the mapping makes the result correct. The one measured result involving Claude that turned up is a practitioner's self-report of cutting 418 hard-coded CSS values to zero with spec files, an audit script and a CLAUDE.md section ([Hardik Pandya](https://hvpandya.com/llm-design-systems)); it measures token discipline, not naming.

**The test.** Twelve instances of Project A components (Button, Icon button, Text input, Alert, Checkbox, Switch, Chip) were each described the way Figma's MCP describes an instance, in two namings: Project A's current Figma names (`Role`, `Feedback`, `Left icon`, `Label text`, `Text input`) and the same component aligned to the code's words (`Button role`, `Color`, `Start icon`, `Label`, `Text field`). Claude (`claude-sonnet-5`) wrote the JSX for each instance under five conditions, five runs each, 300 calls in all, and a script scored every output against the expected component and props. The harness and raw results are kept outside the published articles; the numbers below are the record.

| Condition | Props correct | Fully correct | Wrong props written |
|---|---|---|---|
| Aligned names + component API in context | 100% | 100% | 0 |
| Current names + component API in context | 100% | 100% | 0 |
| Current names + API + a Code Connect style mapping | 100% | 100% | 0 |
| Aligned names, no API | 86% | 52% | 21 |
| Current names, no API | 73% | 33% | 45 |

Three things in the failures say more than the averages:

- **Aligned names fixed the vocabulary.** With today's names Claude turned the Figma words into props: `feedback="danger"`, `rightIcon`, `validation="error"`, `errorText`, and `<TextInput>` for the component. With aligned names those cases came out right: `<TextField>`, `helperText`, `color="success"`.
- **Aligned names did not beat the code's own oddities.** Project A's Button takes `buttonRole`, not MUI's `variant`. Even with a Figma property called `Button role`, Claude wrote `variant="secondary"` or `role="primary"` in every Button case without the API, because its knowledge of MUI outweighed the name. Alignment helps most when the code's names are conventional.
- **A property is not a child component.** Aligned naming gave Alert a `Title` text property, and Claude wrote `title="Session expiring"`; the code wants an `<AlertTitle>` child. Project A's current names, with a `Title` toggle beside `Title text`, happened to produce the child correctly. Matching words cannot express a structural difference; that is what a mapping or the API is for.

The limits are real: one model, twelve instances, and outputs that barely varied between runs (most instances produced one distinct output across five runs), so this is closer to twelve cases than sixty trials per condition. It answers a narrow question clearly: with the component API in context, naming did not matter; without it, naming mattered a lot.

**What to do.** For Claude, put the code's component API in context first: Code Connect for every published component, plus the design system's types or docs reachable from CLAUDE.md or a skill. That made naming irrelevant in the test. Align Figma names anyway, because Claude does not always have that context (a quick prompt, an unmapped component, an agent working from Figma alone), and in that case aligned names cut wrong props by more than half. Where the code itself departs from its base library's conventions (`buttonRole` instead of `variant`), record it in the mapping and the skill, because neither aligned names nor the model's priors will recover it. Enforce with a check rather than a CLAUDE.md sentence, since Anthropic describes those as advisory.

---

## 14. How should a team run its exceptions so they stay exceptions?

**The short answer.** Write each deviation down once, with its reason and its mapping, in a place both humans and tools read. A deviation without a record is drift; a deviation with one is a decision.

The systems that handle exceptions well share three habits. They name the exception where it lives: Primer's `?` suffix and Albaugh's `:state` prefix mark Figma-only properties in the property name itself. They encode the translation once: Code Connect files hold each mapping, and Carbon and Primer both keep a Code Connect publish workflow in their repositories. They keep a list of what cannot be mapped: Carbon's open issue is, in effect, a deviation register with one line per component. Southleft's contracts proof of concept states the principle for tools: missing information is reported, never guessed ([ds-contracts-poc](https://github.com/southleft/ds-contracts-poc)).

A minimal register entry carries:

| Field | Example |
|---|---|
| Component and property | Button, `State` |
| Side | Figma-only axis |
| Kind | interaction state as variant (section 6) |
| Reason | Figma cannot draw pseudo-classes |
| Mapping | `State: Loading` to `loading`; hover, focus, press to none |
| Owner and date | design-system team, 2026-10 |

The accepted kinds are short, which is what keeps them exceptions: interaction state drawn as variants; disabled and loading as states mapped to booleans; Figma-only show/hide toggles and drawing helpers; code-only behaviour, accessibility and data props; a component split or merged on one side for manageability; a property placed on the group in code and on items in Figma. Anything outside that list is a rename waiting to happen.

**What to do.** Keep a deviation register with a fixed list of accepted kinds, and require a reason and a mapping for every entry. Let the audit read the register, so recorded deviations pass and unrecorded differences fail. Review the register when a component changes on either side; an entry whose reason has gone (code gained the prop, Figma gained the capability) should be removed and the names aligned.

---

## 15. Cheat sheet

| Layer | Rule | Accepted exceptions | Evidence strength |
|---|---|---|---|
| Component names | match; casing may be translated | one-sided parts, marked (`_Slot`, `TabPanel`); one-to-two splits, recorded | strong consensus |
| Property names | match the code's word | Figma-only toggles marked (`title?`); code-only props in one agreed home | consensus as a goal; often missed in practice |
| Option values | match the code's word | none beyond casing | stated goal (MUI kit, Primer's guide); Primer's Button still maps `secondary` to `default`, Carbon shows the cost |
| Interaction state | Figma axis, no code prop | none needed | consensus |
| Disabled, loading | Figma state or boolean, code boolean | mapping recorded | consensus for disabled; loading supported by Spectrum and MUI only |
| Visual result | match, from one token source | rendering-engine differences, sized waivers | consensus; enforcement varies |
| Internal structure | same named parts; construction free | property placement (group versus item), recorded | majority; one source argues for mirroring |
| Behaviour | code only; Figma shows outcomes | none | consensus |
| Splits and merges | follow code by default | Figma split for variant count; code split for API | precedent both ways |
| AI codegen | Code Connect every component; align names to shrink mappings | none | Figma's guidance; a small Claude test: naming irrelevant with the API in context, aligned names 52% against 33% fully correct without |
| Claude specifically | API in context (Code Connect, types reachable from CLAUDE.md or a skill); enforce with checks | code names that break library convention, recorded in the mapping | Anthropic and Figma guidance; the test in section 13 |
| Audits | names as join keys; register as the exception list | none | strong mechanism; little published measurement |

---

## 16. The short version

The position that Figma and code should be as aligned as possible, with recorded exceptions, matches what the strongest practitioners say and what the better shipping systems aim for, once "aligned" is split into layers. Component names, property names, option values and the visual result should match; that is the consensus goal, with Figma's own advocate allowing different wording, from Brad Frost, who treats code as the truth, to Nathan Curtis, who treats a spec as the truth, to TJ Pitre, who says the truth moves. Internal structure is different: most practitioners and shipping systems let construction differ and match only the named parts, because mirroring Figma's layer tree in code, or code's markup in Figma, produces compromises that serve neither. Behaviour belongs to code.

The exceptions the evidence supports are a short, recognisable list: interaction states drawn as Figma variants with no code prop; disabled and loading as Figma states mapped to code booleans; Figma-only show/hide toggles and drawing helpers; code-only events, accessibility and data props; a component split in Figma because one set would be unmanageable, or split in code because its API needs two; and properties that sit on the group in one place and on items in the other. Shipping systems bend in both directions: MUI's kit renames to match React, OUDS renamed code to match Figma.

The common failure is not a principled exception but an inherited mismatch that a mapping file quietly absorbs, as Carbon's `Style` to `kind` has for three years. For AI, a Code Connect mapping is the largest lever for code generation, and aligned names make those mappings short, auto-suggested and less likely to rot; for design generation and for drift audits, aligned names are what let an agent find the counterpart and pair the two sides without a hand-kept table. No published study measures how much name parity improves AI output; a small test with Claude on Project A's components found that with the component API in context naming made no difference, and without it aligned names raised fully correct output from 33% to 52%.

For a library on MUI, write the rule per layer, adopt MUI's prop names and values as the default vocabulary, keep a deviation register with a fixed list of accepted kinds and a reason and mapping for each entry, and let audits read that register so recorded deviations pass and everything else is reported.

---

## 17. What to re-check later

- **AI tooling.** Figma's MCP server, Code Connect suggestions and agent writing to the canvas changed several times during 2026. The behaviour described in sections 10 to 12 is as of October 2026.
- **Little measurement of parity's effect on AI.** No published source compares AI output quality with and without name or prop parity; this guide's own test (section 13) is one model, twelve instances and near-deterministic outputs, and should be repeated with more components, other models and real MCP output before being leaned on. Southleft's Open Design System Bench measures how agents consume code, not Figma parity. A widely repeated figure of "above 80% component reuse with Code Connect" was traced and dropped: the cited source does not contain it.
- **No survey of name parity.** zeroheight's 2026 report covers token automation; no survey found measures how many teams keep component or prop names in sync.
- **Single-source claims.** OUDS's code-follows-Figma renames, Helios's `isLink` merge and Pajamas' integrated components each rest on one system's own records.
- **Not reached.** Atlassian, Fluent 2, Polaris, GOV.UK and Salesforce publish no Figma parity policy that could be opened; Dan Mall, Jina Anne and Josh Clark have no located primary position on this question; Romina Kavcic's post on detecting drift is behind a paywall and was read only in part. Curtis's 2021 post on crafting a shared component API could not be fetched and is not cited.
- **Quotes.** Practitioner quotes were string-matched against the raw page text; AI-tool quotes were read through a fetch tool that can lightly reword, and are paraphrased here rather than quoted where that mattered.

---

## Sources

### Primary: shipping systems

- [Primer: contributing to Figma](https://primer.style/product/contribute/contributing-to-figma/)
- [MUI design kits: releases](https://github.com/mui/mui-design-kits/releases)
- [Carbon issue #14836: align Figma attribute names to React prop names](https://github.com/carbon-design-system/carbon/issues/14836)
- [Carbon issue #17607: Figma Code Connect upstream bugs](https://github.com/carbon-design-system/carbon/issues/17607)
- [Carbon: Button.figma.ts](https://github.com/carbon-design-system/carbon/blob/main/packages/react/code-connect/Button/Button.figma.ts)
- [Primer: Button.figma.tsx](https://github.com/primer/react/blob/main/packages/react/src/Button/Button.figma.tsx)
- [Figma Simple Design System: Button.figma.ts](https://github.com/figma/sds/blob/main/src/figma/primitives/button/Button.figma.ts)
- [Figma Simple Design System repository](https://github.com/figma/sds)
- [GitLab Pajamas: UI kit components](https://design.gitlab.com/get-started/uik-components/)
- [HashiCorp Helios: Figma components changelog](https://github.com/hashicorp/design-system/blob/main/packages/components/CHANGELOG-FIGMA-COMPONENTS.md)
- [Orange OUDS iOS releases](https://github.com/Orange-OpenSource/ouds-ios/releases)
- [Adobe Spectrum: button component schema](https://github.com/adobe/spectrum-design-data/blob/main/docs/site/public/schemas/components/button.json)
- [zeroheight Design Systems Report 2026](https://report.zeroheight.com/)

### Primary: Figma and AI tooling

- [Anthropic: Claude Code best practices](https://code.claude.com/docs/en/best-practices)
- [Anthropic: set up your design system in Claude Design](https://support.claude.com/en/articles/14604397)
- [Figma MCP server: custom rules](https://developers.figma.com/docs/figma-mcp-server/add-custom-rules/)
- Figma's official Claude plugin skills, `figma-design-to-code` and `figma-code-connect` (plugin version 2.2.111, read from the local install)
- This guide's experiment: its harness and raw results, kept outside the published articles; the numbers in section 13 are the record

- [Figma: Code Connect for React](https://developers.figma.com/docs/code-connect/react/)
- [Figma MCP server: Code Connect integration](https://developers.figma.com/docs/figma-mcp-server/code-connect-integration/)
- [Figma MCP server: tools and prompts](https://developers.figma.com/docs/figma-mcp-server/tools-and-prompts/)
- [Figma MCP server: structure your Figma file](https://developers.figma.com/docs/figma-mcp-server/structure-figma-file/)
- [Figma blog: the canvas is open to agents](https://www.figma.com/blog/the-figma-canvas-is-now-open-to-agents/)
- [Figma help: Check designs](https://help.figma.com/hc/en-us/articles/39592284074263)
- [Figma blog: The Shared Language of Props (Jake Albaugh, 2023)](https://www.figma.com/blog/the-shared-language-of-props/)
- [Builder.io: Visual Copilot](https://www.builder.io/blog/visual-copilot)
- [v0: design systems](https://v0.app/docs/design-systems)
- [Storybook MCP experiment discussion](https://github.com/storybookjs/ds-mcp-experiment-reshaped/discussions/1)
- [Southleft: Figma Console MCP](https://github.com/southleft/figma-console-mcp)
- [Southleft: ds-contracts-poc](https://github.com/southleft/ds-contracts-poc)
- [Chromatic: connect Figma to Storybook](https://www.chromatic.com/blog/connect-figma-to-storybook/)
- [monday.com engineering blog](https://engineering.monday.com/)

### Commentary: practitioners

- [Brad Frost: Design Systems Q&A (2024)](https://bradfrost.com/blog/post/design-systems-qa/)
- [Brad Frost: The Design System Ecosystem (2023)](https://bradfrost.com/blog/post/the-design-system-ecosystem/)
- [Nathan Curtis: The Sorry State of States (2024)](https://nathanacurtis.substack.com/p/the-sorry-state-of-states-89dd4668737e)
- [Nathan Curtis: Code Only Props in Figma (2026)](https://nathanacurtis.substack.com/p/code-only-props-in-figma)
- [Nathan Curtis: Component Contracts and Schemas (2026)](https://nathanacurtis.substack.com/p/component-contracts-and-schemas)
- [Nathan Curtis: What Component Specs Leave Behind (2026)](https://nathanacurtis.substack.com/p/what-component-specs-leave-behind)
- [TJ Pitre: Code to Design Isn't the Point. System Parity Is. (2026)](https://southleft.com/insights/design-systems/code-to-design-isnt-the-point-system-parity-is/)
- [TJ Pitre: The Source of Truth Is a Ping-Pong Ball (2026)](https://southleft.substack.com/p/the-source-of-truth-is-a-ping-pong)
- [Southleft: implementing code-only props in Figma (2026)](https://southleft.substack.com/p/implementing-code-only-props-in-figma)
- [Southleft: Figma design systems](https://southleft.com/figma-design-systems/)
- [Murphy Trueman: The bidirectional design system (2025)](https://murphytrueman.substack.com/p/the-bidirectional-design-system)
- [Design System Diaries: Close the gap (2025)](https://designsystemdiaries.substack.com/p/close-the-gap-how-to-boost-parity)
- [Greg Sargent: Figma and code library sharing (2026)](https://gregsargent.com/articles/figma-code-library-sharing)
- [Hardik Pandya: LLM design systems](https://hvpandya.com/llm-design-systems)

### Cited but not resolved

- Nathan Curtis, "Crafting Component API, Together" (Medium, 2021): blocked from fetching; summarised from search results only and not relied on.
- Christine Vallaure's March 2026 post arguing names must match exactly: read, characterised in section 10, URL not retained in the notes.
