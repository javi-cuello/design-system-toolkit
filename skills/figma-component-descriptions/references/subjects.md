# Choosing the subjects

This is step 0's discovery and step 2 of [SKILL.md](../SKILL.md) in full. It covers how a library's settings are found when no document holds them, and which components get a description, in which form.

## Contents

- [Discovery](#discovery)
- [2a. Two subject lists](#2a-two-subject-lists)
- [2b. Slot fillers](#2b-slot-fillers)
- [Slot-only children](#slot-only-children)
- [2c. Virtual sets](#2c-virtual-sets)
- [2d. Layout decides nothing](#2d-layout-decides-nothing)
- [2e. A component alone on its page](#2e-a-component-alone-on-its-page)
- [2f. The consumer file](#2f-the-consumer-file)

## Discovery

Run it only for what the context document marks `[TBD]`, or for everything when there is no document. Run it too when a local `systems/` cache is in use and holds no entry for this `fileKey`.

- **Dialect and headings**. Read one documented component's `descriptionMarkdown`, never `description`, which strips the markdown. It shows the dialect and the section headings' spelling from real text. This is the fallback, not the source: `language` in the document's `audit-settings` wins where it is stated (`"en-US"`; absent means en-GB). Sampled text only says what the library *was* written in, which is wrong once a project switches.
- **Plain-only descriptions**. Sample one whose markdown is not empty: a description set as plain text only leaves it empty. Where every one is plain-only, the headings cannot be read from the file: ask.
- **Header**. Check one component's page for a documentation header instance, to find the header component and its body layer. Say plainly that one page was checked, not all, since a header convention can be page-specific.
- **Prefix and separator**. Infer the internal prefix and the virtual-set separator from existing component names.
- **Unclear evidence**. Where evidence is ambiguous or contradictory, gather it and ask the maintainer rather than guessing. An example is the same child prefixed on one page and not on another. Record the ruling in the rulebook once given.

Record what discovery found in the context document. Update it in place where it is a writable file; otherwise emit the sections for the maintainer to paste back. Confirm the summary with the user before writing.

Where a local `systems/` cache is in use, match it by `fileKey` too. Never assume the only file there is the right one: a skill used across projects holds several.

## 2a. Two subject lists

Two independent triggers put a component in the **compact** list. Either is enough.

1. It **carries the rulebook's internal prefix**.
2. It is **a subcomponent published only because a parent uses it**. Every use sits inside other components on the component's own page, in a slot or directly in their layers. Examples are a tree row inside its level, a sidebar row inside its section, or a cell inside its table.

Documentation example instances placed loose on a page are not usage. The second trigger is structural: a trailing "item" in a name is not evidence (a maintainer ruling).

**`scripts/verify.js` derives the second trigger from real instances**, as `derivedCompact`. Run it before writing, and take the list from it rather than resolving by eye.

A component used anywhere off its own page is not a subcomponent, and stays full, however it is used there. Examples are a tooltip inside an icon button, or a text input that only appears in another component's slot.

A compact subject skips the full workflow: step 3's composition scan, step 5's generated sections and step 6's structured write. It takes the compact pass instead (the guide's *Compact structure*). Its inspection is limited to the parent relationship, from one of two sources:

- which public component's Composition names this one
- which page or frame groups it with its siblings Everything else is a full subject and follows step 3 onward as written.

Skip variants either way: a `COMPONENT` inside a `COMPONENT_SET` is not a separate subject.

## 2b. Slot fillers

A published component used inside another published component's slot on the same page is not a subject there. Document the parent, name the child in the parent's Composition, and move on. The child may still be a subject on its own page.

The library's own privacy convention outranks this heuristic. If private components carry a prefix and this one has none, it was published deliberately. Where convention and heuristic disagree, gather evidence and ask rather than choosing (*Resolving a disagreement*, below).

## Slot-only children

Some components are published yet only meant to be composed into a parent on the same page. A Tab item inside a Tab bar is the usual case: a real published component set, but no consumer places one directly.

**A slot-only child takes the compact description, not the full one**. That is one or two sentences, no headings, saying what it is and which component composes it. Private components take the same form for the same reason: the parent carries the usage guidance. Repeating axis-by-axis behaviour on the child puts it in a second place that will drift.

**Name the child in the parent's Composition too**, so code generation imports it rather than rebuilding it.

An earlier rule said to write nothing for a slot-only child; it was withdrawn because it loses information. A consumer who opens such a child finds blank metadata and no pointer to its parent. The compact form says the same in two sentences and keeps the pointer.

**The trigger is structural, never the name**. A child called `Tab item` and one called `Menu` are decided the same way: by where the component is actually used, resolved from real instances. A naming pattern like a trailing "item" is not evidence, and must not be used as a shortcut (a maintainer ruling).

### Signals, most reliable first

1. **Project grouping**. The project may keep slot-only parts apart, in a dedicated section or frame, such as a "Parts" frame beside a "Component" frame. Check the rulebook's building-block grouping setting. Treat anything under it as slot-only: it gets the compact form.
2. **Explicit list**. If grouping is not reliable, check the rulebook for a list of slot-only names. Or check for a ruling on how far the privacy convention extends beyond its prefix.
3. **Structural evidence**. The component appears only as a nested instance or instance swap inside one parent on the same page, and is never placed directly. Treat it as slot-only.

Signal 1 is a convention the project declared, which is why it may refer to a frame. It does not license inferring subjects from layout in general. Step 2d still applies, and where no such convention is recorded, canvas position decides nothing.

### Resolving the parent

To find what composes a child, walk up from each instance to the nearest ancestor that is a component root **or** an instance of one. Resolve that instance to its main.

Walking only to the nearest component root skips through any instance in between. It then credits the child to its grandparent. A menu option inside a menu inside a combobox reads as "used by Combobox". The child then seems to have several parents on several pages, and the slot-only test fails on a textbook slot-only part. Such a walk once gave a child with one parent a full description.

- **A virtual set counts as one parent**. A child composed into both members of a `Foo / A` and `Foo / B` pair has one parent: compare the parents' name stems.
- **Loose documentation examples are not usage**. Counting them as direct placement disqualifies almost every real slot-only child, since these pages exist to show the component in use.

### Resolving a disagreement

Before applying the slot-only heuristic, check whether the library states its own privacy convention, most often a naming prefix. That convention comes first:

| The child | Then |
|---|---|
| Carries the internal prefix | Private. Give it the compact form, and name it in the parent's Composition. |
| Has no prefix, and the library uses the prefix consistently elsewhere | Published deliberately. Treat it as consumer-facing unless the user says otherwise. |
| Sits in a file with no privacy convention | Fall back to the slot-only heuristic. |

When the convention and the heuristic disagree, ask rather than choosing. Gather this evidence first, because it usually decides the answer:

- **Siblings' descriptions**. Existing descriptions on sibling children are a precedent that the project documents them. One undocumented sibling among documented ones is more likely an oversight than a policy.
- **The same child, prefixed and not**. A child prefixed on one page and unprefixed on another is a deliberate contrast: the unprefixed one is public.

Present the evidence with the question, so the user confirms a reading rather than starting from scratch. Never treat a missing description alone as a signal, since consumer components can be undocumented too.

## 2c. Virtual sets

Two or more surviving subjects may share the name part before the separator. Treat them as **virtual variants of one component**. `Top bar / Default`, `Top bar / Main` and `Top bar / Modal` are an example. Figma has no parent set joining them, but consumers read them as one thing with a subpart axis.

`enumerate.js` returns them as `virtualSets` (stem and members). It groups every unprefixed component by the name part before the separator, the same grouping `verify.js` checks. It cannot see steps 2a and 2b: drop any member those steps removed. A group left with one member is an ordinary subject.

Every member is equally main. Write **one** description for the set, from the union of the members' interfaces, and apply the identical text to each. Never write per-subpart descriptions, and never nominate a primary. Where interfaces differ, attribute the difference to the subpart that has it. How to write it: the guide's *Writing for a virtual set*.

A lone component with a separator in its name is not a virtual set: the rule needs two or more siblings.

## 2d. Layout decides nothing

Containing frames, page structure and canvas position never decide which component a page documents. Scaffolding may bury the real subject several frames deep. Examples beside it are instances, not subjects.

## 2e. A component alone on its page

A component is not documented when its page holds nothing but the component, and no other component contains it. Re-published system or platform chrome usually lands here: status bars, home indicators, keyboards, system menus. Skip it entirely, and write no description.

A component alone on its page that other components *do* use is a building block: a state layer, a scroll bar, a label. It is a subject like any other, at the tier step 2a gives it.

The test is whether the page holds any content **outside** its components. Never use the presence of a documentation header for this. The header is one library's furniture, other libraries use other furniture, and a component can contain a layer of that name itself.

`enumerate.js` computes the test per page as `alone`. It is true when the page holds no leaf content (text, instances, vectors, shapes) outside its components. On an `alone` page, skip each component nothing uses. `verify.js` applies the same test with its usage walk, and lists any described one as `shouldBeEmpty`.

Counting only leaf content, and only outside components, is what makes the test robust:

- It ignores bare wrapper frames, so a component alone inside a frame still counts as alone.
- It ignores everything the component contains, so a richly built component cannot fake a documented page.
- Documented pages show dozens of outside nodes, and undocumented ones exactly zero. If a file gives borderline counts, report them rather than guessing a threshold.

Step 2e is about the page, not the component's quality. A skipped component may be well built: the library simply has not adopted it into its documented surface. Report what was skipped and why, rather than treating it as a gap to fill.

## 2f. The consumer file

**Before writing anything, find where these components are actually used**. A library file shows a component's interface, and nothing about its job. A `Badge` with a `Feedback` axis could be a status chip, a notification count or a filter pill. Guessing gives descriptions that are fluent, plausible and wrong about the one thing a reader needs.

On the bridge, check `figma_list_open_files` for a second connected file; and the rulebook's file registry for a consumer, screens or product file. **If neither names one, ask**: a maintainer usually has one and will not think to mention it. Where there is truly none, say so in the report. Then write from the interface alone, labelled as such.

Read it with `scripts/consumer-usage.js` ([scripts.md](scripts.md)). What its result is for, most valuable first:

1. **Screen names** give the product's domain in its own words. A purpose sentence can then name the surface a component lives on, rather than a generic noun.
2. **Usage counts** separate load-bearing components from ones built ahead of need.
3. **Zero uses** is worth naming in the report, rather than describing the component as if its role were settled.

**Two traps:**

- Passing `fileKey` can leave the consumer file active. Re-pin the library with `figma_navigate({ lock: true })` before writing. A write aimed at a stale id fails loudly, but one landing in the wrong file does not.
- Instances in a consumer file are evidence of *use*, never of subject selection. Step 2's triggers still decide who gets a description.
