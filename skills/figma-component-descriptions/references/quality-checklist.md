# Quality checklist

Walk it before step 9's report in [SKILL.md](../SKILL.md). Each line is a check a description run must pass.

## Subject selection

- [ ] Published and consumer-facing: not internal-prefixed, not a slot filler for a parent on the same page
- [ ] Internal-prefixed **and slot-only** components routed to the compact pass, neither skipped nor given the full structure
- [ ] Slot-only children also named in their parent's Composition, so code generation still imports them
- [ ] Slash-siblings grouped, with one shared description from the union of their interfaces, identical on every member
- [ ] Selection decided by name and publication status, not by canvas position
- [ ] Pages holding nothing but the component skipped, judged by content outside components, not by documentation furniture

## Content

- [ ] Opens with a purpose sentence: the component name as subject, the user benefit, not the implementation
- [ ] Prop, axis and value names quoted verbatim, `#nodeId` suffixes stripped, never paraphrased or translated
- [ ] Composition names nested parts, notes slots and swappable props, and marks axis-revealed parts as conditional
- [ ] No false fixity: a claim of "fixed" or "not customisable" only on an interface with no slots and no props
- [ ] Interactive states listed in axis order, only those present, noted as set by code
- [ ] Disambiguation present where sibling components exist
- [ ] Variant selection order stated for multi-axis components
- [ ] Don't items each name the correct alternative
- [ ] No interface defect documented as a feature

## Format

- [ ] `##` headings and `-` bullets, no manual `•`, no full stops ending list items
- [ ] Every heading and sentence this run wrote follows `language` from `audit-settings`, none in the project's old dialect
- [ ] Where the library's existing descriptions use the other dialect, the count reported as a finding, not matched
- [ ] Sections with nothing meaningful to say omitted, not padded
- [ ] Tone prescriptive and concise

## Propagation

- [ ] Where a documentation header exists, its body carries the first sentence of the applied description
- [ ] Written text re-read after applying, not trusted from the write result alone

## Compact tier (private components)

- [ ] One to two sentences, no headings, no bullet sections
- [ ] States what it is and its parent relationship, not a restatement of the name
- [ ] Nothing from Behaviour, Composition, Usage, Don't or Code gen notes leaked in
- [ ] A description wanting to grow past two sentences flagged as a possible public candidate, not written long

## Right to left

- [ ] Where the settings name `rtlLanguages`: a component with parts to reorder, pin, pad unevenly or round on one side has a measured `## Right to left` section
- [ ] Where they name it, every directional icon has a `Right to left: mirrors` or `stays` line
- [ ] Without the key, neither appears
