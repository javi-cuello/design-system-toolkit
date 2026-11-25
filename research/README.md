# Design Systems Review

Editorial articles on how design systems are built. Each answers one question with a clear thesis, argued from what shipping systems do. A magazine, not a store.

## What belongs here

- One article per question. Update the article that already asks it.
- The toolkit knowledge base ([`knowledge/`](../knowledge/README.md)) is not repeated here. Narrow an article to a question the knowledge base cannot answer, or add the finding there instead.
- Before writing, read the articles on the same or a neighbouring question. Link to a section another article owns rather than retelling it.
- After writing, correct every article the finding changes, and set its `updated` day. Two articles never say a thing two ways.
- File each article in the topic folder that fits it. A new folder only for a topic none covers.
- research/ is public. Name no customer, private project or private person, and quote nothing from a private session. Use neutral descriptions ("a product library", "Project A"). The rule is toolkit-standard §D 6, and `bin/check` refuses a project's name, an email, a /Users/ path or the maintainer's name.
- No scripts, raw results or experiment data. State their numbers in the prose and keep the files in the toolkit or a scratch folder.
- An article added or edited goes into `index.html` in the same change, with `built` set to the day. Nothing builds the page, and `bin/check` refuses an article missing from it or out of step with it.
- Each entry carries `researched`, the day the research was done. Use a month or a span (`2026-08/2026-10`) only where no record holds the day. It also carries `updated`, set again on every edit, and `subtopic` in a topic that lists `subtopics`.
- The page computes reading time at 238 words a minute (Brysbaert 2019); no one types it.
- An article reads in 20 minutes or less: 4,760 words, not counting figures and comments. `bin/check` refuses a longer article updated after 2026-11-17. Bring a long one under the limit the next time it is worked on.
- What does not fit becomes a second article on its own question, or Part 1 and Part 2 of one question. Each part stays under 20 minutes and links to the other. Evidence can also go to the knowledge base, with the article linking to it.
- Retired pieces go to `_archive/<date>/`, never deleted. [REFERENCE.md](REFERENCE.md#retired-articles) notes some.

The `design-system-research` skill reads this file before writing a deep-mode guide. The knowledge base never links to these articles.

## Foundations

Type, colour, surfaces and the scales everything else is built on.

### Type and prose

- [Line height and letter spacing, from Figma to the browser](foundations/line-height-letter-spacing-figma-to-css.md)
- [Naming text styles](foundations/naming-text-styles.md)
- [Naming text styles: tags, defaults and a second platform](foundations/naming-text-styles-part-2.md) (Part 2)
- [One type scale for an interface and its articles](foundations/one-type-scale-for-ui-and-content.md)
- [Fitting a type scale to a ratio](foundations/fitting-an-existing-type-scale-to-a-ratio.md)
- [Naming a phone mode](foundations/naming-a-phone-mode-on-a-type-token.md)
- [Which text style a component takes](foundations/which-text-style-a-component-takes.md)
- [Space between prose elements](foundations/space-between-prose-elements.md)
- [Spacing with a text style](foundations/spacing-that-travels-with-a-text-style.md)
- [Type on a phone](foundations/type-on-a-phone.md)

### Colour and surfaces

- [Elevation and shadows](foundations/elevation-and-shadows.md)
- [How surfaces stack](foundations/how-surfaces-stack.md)
- [Materials and translucency](foundations/materials-and-translucency.md)
- [Surfaces in dark mode](foundations/surfaces-in-dark-mode.md)
- [Yellow in colour scale generators](foundations/yellow-in-color-scale-generators.md)

### Spacing and shape

- [Spacing tokens by intent](foundations/spacing-tokens-by-intent.md)
- [Spacing tokens by intent: platforms, Figma and migration](foundations/spacing-tokens-by-intent-part-2.md) (Part 2)
- [Corner radius by intent](foundations/corner-radius-by-intent.md)

## Components and naming

How a component is cut, named and given its states.

### Names and states

- [Naming inside a Figma component](components-and-naming/naming-inside-figma-components.md)
- [What the State axis models](components-and-naming/what-the-state-axis-models.md)
- [Token tiers and names](components-and-naming/token-tiers-and-names.md)

### Cutting and mapping

- [Mapping a Figma token system onto MUI's theme](components-and-naming/mapping-figma-tokens-onto-mui-theme.md)
- [When to split or merge a component](components-and-naming/when-to-split-or-merge-a-component.md)

## Figma and code

Where the design file and the browser agree, and where they cannot.

### Matching and rendering

- [How closely should a Figma library match its code?](figma-and-code/how-closely-figma-should-match-code.md)
- [Where responsive behaviour belongs in a Figma library](figma-and-code/responsive-components-in-figma.md)
- [Where Figma and CSS render differently](figma-and-code/where-figma-and-css-render-differently.md)
- [Where Figma and CSS render differently: paint, text and layout](figma-and-code/where-figma-and-css-render-differently-part-2.md) (Part 2)

### Running the library

- [What counts as a breaking change in a Figma library](figma-and-code/breaking-changes-in-a-figma-library.md)
- [Measuring design system adoption](figma-and-code/measuring-design-system-adoption.md)
- [When should a design system split into more than one component library?](figma-and-code/when-to-split-a-component-library.md)

## Accessibility

Focus, direction and the decisions a design file has to carry.

- [Focus indicators in a design system](accessibility/focus-indicators.md)
- [Right-to-left in a Figma design system](accessibility/rtl-design-systems.md)
- [Arabic text in a right-to-left design system](accessibility/rtl-design-systems-part-2.md) (Part 2)

## Principles

What principles are for once everyone agrees on them.

- [When design principles conflict](principles/when-design-principles-conflict.md)

## Auditing

Checking a library against its own rules, for people and for agents.

- [Auditing a design system for people and agents](auditing/auditing-a-design-system.md)

## AI and documentation

Making a system readable to people and to agents. The nine articles form one series, *The agent-ready design system*, read in this order. Each part owns one question and links to the parts before and after it.

1. [What makes a design system agent-ready?](ai-and-docs/what-makes-a-design-system-agent-ready.md)
2. [What a design system's library should carry for an agent](ai-and-docs/what-the-library-carries-for-an-agent.md)
3. [One record, many outputs: documenting a Figma-first design system](ai-and-docs/design-system-docs-as-one-record.md)
4. [How a design system reaches the agent](ai-and-docs/how-the-system-reaches-the-agent.md)
5. [Hooks, gates, evals and the rest: what keeps an agent on a design system](ai-and-docs/what-keeps-an-agent-on-track.md)
6. [Why agent rules need the harness](ai-and-docs/agent-workflow-enforcement.md)
7. [Building whole screens with an agent from the design system](ai-and-docs/building-screens-with-an-agent.md)
8. [Prototyping with a design system's real components](ai-and-docs/prototyping-from-real-components.md)
9. [Measuring and showing agent readiness](ai-and-docs/measuring-agent-readiness.md)
