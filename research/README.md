# Design Systems Review

A curated set of editorial articles on how design systems are built. Each piece answers one focused question with a clear thesis, argued from what shipping systems actually do. This is a magazine, not a store.

## What belongs here

- One article per question. A broad survey of what the toolkit knowledge base ([`knowledge/`](../knowledge/README.md)) already holds is not an article; narrow it to the question the knowledge base cannot answer, or add the finding to the knowledge base instead.
- Update the article that already asks a question rather than writing a second one.
- File each article in the topic folder that fits it. A new folder only for a topic none covers.
- No scripts, raw results or experiment data. State their numbers in the prose and keep the files in the toolkit or a scratch folder.
- Retired pieces go to `_archive/<date>/`, never deleted.

The `design-system-research` skill reads this file before writing a deep-mode guide. The knowledge base never links to these articles.

## Foundations

Type, colour, surfaces and the scales everything else is built on.

- [Elevation and shadows](foundations/elevation-and-shadows.md)
- [How surfaces stack](foundations/how-surfaces-stack.md)
- [Line height and letter spacing, from Figma to the browser](foundations/line-height-letter-spacing-figma-to-css.md)
- [Materials and translucency](foundations/materials-and-translucency.md)
- [Naming text styles](foundations/naming-text-styles.md)
- [One type scale for an interface and its articles](foundations/one-type-scale-for-ui-and-content.md)
- [Space between prose elements](foundations/space-between-prose-elements.md)
- [Surfaces in dark mode](foundations/surfaces-in-dark-mode.md)
- [Type on a phone](foundations/type-on-a-phone.md)
- [Yellow in colour scale generators](foundations/yellow-in-color-scale-generators.md)

## Components and naming

How a component is cut, named and given its states.

- [Mapping a Figma token system onto MUI's theme](components-and-naming/mapping-figma-tokens-onto-mui-theme.md)
- [Naming inside a Figma component](components-and-naming/naming-inside-figma-components.md)
- [What the State axis models](components-and-naming/what-the-state-axis-models.md)
- [When to split or merge a component](components-and-naming/when-to-split-or-merge-a-component.md)

## Figma and code

Where the design file and the browser agree, and where they cannot.

- [What counts as a breaking change in a Figma library](figma-and-code/breaking-changes-in-a-figma-library.md)
- [How closely should a Figma library match its code?](figma-and-code/how-closely-figma-should-match-code.md)
- [Measuring design system adoption](figma-and-code/measuring-design-system-adoption.md)
- [Where responsive behaviour belongs in a Figma library](figma-and-code/responsive-components-in-figma.md)
- [When should a design system split into more than one component library?](figma-and-code/when-to-split-a-component-library.md)
- [Where Figma and CSS render differently](figma-and-code/where-figma-and-css-render-differently.md)

## Accessibility

Focus, direction and the decisions a design file has to carry.

- [Focus indicators in a design system](accessibility/focus-indicators.md)
- [Right-to-left in a Figma design system](accessibility/rtl-design-systems.md)

## Principles

What principles are for once everyone agrees on them.

- [Marking AI-generated content](principles/marking-ai-generated-content.md)
- [When design principles conflict](principles/when-design-principles-conflict.md)

## AI and documentation

Making a system readable to people and to agents. The nine articles form one series, *The agent-ready design system*, read in this order; each part owns one question and links to the parts before and after it.

1. [What makes a design system agent-ready?](ai-and-docs/what-makes-a-design-system-agent-ready.md)
2. [What a design system's library should carry for an agent](ai-and-docs/what-the-library-carries-for-an-agent.md)
3. [One record, many outputs: documenting a Figma-first design system](ai-and-docs/design-system-docs-as-one-record.md)
4. [How a design system reaches the agent](ai-and-docs/how-the-system-reaches-the-agent.md)
5. [Hooks, gates, evals and the rest: what keeps an agent on a design system](ai-and-docs/what-keeps-an-agent-on-track.md)
6. [Why agent rules need the harness](ai-and-docs/agent-workflow-enforcement.md)
7. [Building whole screens with an agent from the design system](ai-and-docs/building-screens-with-an-agent.md)
8. [Prototyping with a design system's real components](ai-and-docs/prototyping-from-real-components.md)
9. [Measuring and showing agent readiness](ai-and-docs/measuring-agent-readiness.md)

*Making a design system usable by AI agents* was split into parts 2, 4 and 9 and retired to `_archive/2026-11-09/`.
