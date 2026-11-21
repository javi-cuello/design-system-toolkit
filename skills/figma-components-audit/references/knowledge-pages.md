# Reading a component's knowledge page

This is step 4b of [SKILL.md](../SKILL.md) in full. It covers how each scoped set is read against its page in the toolkit's `knowledge/`, and how what it finds is filed. The step is optional, and the audit stands without it.

## Finding the page

Where the toolkit's `knowledge/` is present, `componentPage(name, aliases)` in `tools/shared/knowledge.mjs` finds the page for each scoped set. Pass the project's own names for it, from its context document, as `aliases`. Where the pages are present but node is not (Project knowledge), match by the same rule by hand. Try the whole name, then its words from the last.

Where `knowledge/` is absent, skip the step. The Scope line then says "component knowledge: not available". A set no page names is listed there as "no page", never as a finding.

## What to read

- Read the page's *In Figma* section against the set across every variant, never the default one alone.
- Read only for what the scan and step 4 do not already raise: the component's own parts, names, axes and values.
- Skip the page's *Tokens* part, and any item that only applies a figma-standard rule to the component.
- The set's own name is the project's, and never a finding.
- A set that is one part of what the page covers (a `Tab bar item` on the tabs page) is read against that part's items.
- *Alignment with code* needs code, so it belongs to component-validator and the parity loop, not to this step.

## Filing what it finds

**The project's rulings come first**. A ruling that departs from an item is a **disagreement**. File it in Decide (sev `warning`, bucket 3) as a question carrying both sides and the item's evidence, never as a defect.

Otherwise the item's weight sets the row's severity (toolkit-standard §D 21):

| Weight | Severity |
|---|---|
| `required` | `error` |
| `strong` | `warning` |
| `moderate` | `preference` |
| `weak` or `contested` | None: it raises nothing |

Nothing is raised either for a clause an item marks `contested`. Nor is anything raised for a part the item offers only where the code or the design has one, when the set simply lacks it. An `Actions slot` and a `Read-only` state are examples.

**Every knowledge row goes in bucket 3, Decide, with the fix in the question**. Each renames or reshapes the component's parts or API. So it states its blast radius ([judgment-protocol.md](judgment-protocol.md) §5) rather than being applied on approval.

The row's `rule` is `knowledge:<page>#<part>`, as in `knowledge:text-input#properties`. That handle survives the page being edited, so a re-audit matches it.
