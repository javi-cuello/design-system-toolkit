# Judgment protocol — the agent layer

Everything the scanner cannot decide. Scanner output is hypotheses: nothing reaches the user without passing this layer. [SKILL.md](../SKILL.md) steps 2, 5 and 7 point here.

## Contents

- [1. Discovery](#1-discovery-only-for-what-the-rulebook-does-not-already-record)
- [2. Verification](#2-verification-every-candidate-no-exceptions)
- [3. Mechanism recognition](#3-mechanism-recognition)
- [4. Judgment-only checks](#4-judgment-only-checks)
- [5. Classification into the fix queue](#5-classification-into-the-fix-queue)
- [6. After the user rules](#6-after-the-user-rules)
- [7. Applying fixes](#7-applying-fixes)

## 1. Discovery (only for what the rulebook does not already record)

Discovery fills a library's rulebook in the project's context document the first time this skill audits it. Where a local cache is in use, the rulebook is copied into `systems/<library-name>.md`.

**Never derive scales or role vocabularies from imported variables.** `getLocalVariablesAsync` returns only what the file happens to use, so gaps are guaranteed. Enumerate the source libraries themselves:

```js
await figma.teamLibrary.getAvailableLibraryVariableCollectionsAsync()          // -> name, key, libraryName
await figma.teamLibrary.getVariablesInLibraryCollectionAsync(collectionKey)    // -> complete variable list
```

Record these:

- collection **keys**: names collide across libraries, so the key is the identity;
- full numeric scales, the colour role vocabulary and the token spelling;
- the state vocabulary per archetype, from a sample of interactive sets;
- the sparse-grid pattern: how `Disabled=True` pairs with states;
- the axis grammar and the naming suffixes;
- local collections, which are legitimate unless default-named;
- stated accessibility minima, or a note that the WCAG fallback applies.

Summarise all of it to the user and get confirmation **before** the first audit. A wrong discovery bakes errors into every finding.

## 2. Verification (every candidate, no exceptions)

1. **Fresh re-read.** Call `getNodeByIdAsync` on the specific node and reproduce the defect in raw data. Not reproducible: drop it silently. Never report with a hedge.
2. **Universality test.** A candidate firing on every instance of something means the check misread the API or found a house pattern. Investigate the check first. Sparse grids, space-between gaps and per-side stroke weights became exemptions this way.
3. **Sibling test.** A near-identical sibling with the correct binding names the intended token and confirms the defect. All siblings agreeing indicts the check.
4. **Exception match.** Suppress candidates that match an accepted exception in the active library's rulebook.
5. **Assumption audit.** A check may depend on *where* Figma stores a value: shorthand or per-side, authored or resolved and cached. Validate it against one known-good component before its findings count.

## 3. Mechanism recognition

Raw values serving a mechanism are questions, not defects. Examples are negative gaps creating overlaps (tooltip beaks) and large off-scale paddings driving fills (progress bars, sliders). Transparent hit-area frames enlarging touch targets and 1px hairline grids are others.

The signals: the value carries geometry rather than rhythm, siblings use the same "wrong" value, or no token could express it (negative, computed). Route these to **Decide**, never to auto-fix.

## 4. Judgment-only checks

Run these after scanning, on the components in scope.

| Check | What the agent does |
|---|---|
| State renders | Diff non-rest subtrees against rest. Identical is a product bug and leads the report. Detail below the table. |
| Coverage intent | Compare missing-state candidates with the archetype baseline. Library-wide absence is conformance. Absence on a single component is a Decide item that spells out the keyboard and touch implications. |
| Descriptions | Beyond non-empty (the scanner's), check the description against the heading set the project's context document records ([conventions-universal.md](conventions-universal.md) §6). Check it is not stale against the current axes and properties. Draft replacements, and never write without approval. |
| Contrast | Resolve WCAG ratios on text and surface pairs in **every mode the collection defines**, not just the displayed one ([scanner-checks.md](scanner-checks.md) §3.7c). Report failing token *pairs* with the ratio and the mode. The fix belongs to tokens, so it is always Decide. |
| Content resilience and composition fit | Fixed-size text bound to a property without truncation, boolean-hidden parts that leave holes, and unclear spacing ownership. Ask a question per element. |
| Detached-instance confirmation | For each scanner candidate ([conventions-universal.md](conventions-universal.md) §8), confirm there is no `mainComponent` reference. Check for drift (stale tokens, outdated naming) before treating it as a real duplicate. A frame that merely wraps a legitimate instance is not a finding. |
| Annotation gaps | For each state-bearing variant, judge whether it carries spec detail that belongs in a Dev Mode annotation rather than prose. Such detail is cursor and opacity rules, timing, conditional visibility or an ARIA role. |

**The state-render signature includes the variant root's visual properties**: `opacity`, fills, strokes and effects. Only the root's name is excluded, since it is `Axis=Value` by construction ([scanner-checks.md](scanner-checks.md) §3.10e). Dimming the root is the commonest Disabled treatment: a root-blind diff flagged 6 of 9 correct Disabled variants.

A state fill on the root or a `Content` frame is the commonest Hover and Press treatment. A diff with root opacity but not root fills still reported 14 false states, and the full signature left the 2 real ones. Detail: [scanner-checks.md](scanner-checks.md) §3.5a.

**Descriptions: this skill asserts no structure of its own.** The shape is per project, and the quality spec belongs to `figma-component-descriptions`. The one universal content check is **Composition**. A composite component whose description omits the line naming its sub-components is incomplete, whatever the project calls its headings. That line is what stops the component being reimplemented rather than imported.

**Contrast: name the mode.** A pairing that passes in light and fails in dark is the finding. Naming only the pairing sends the maintainer to a component that looks correct on screen.

**Annotations: never invent the values.** Draft an annotation only from what the file confirms or the maintainer states. Never invent a timing number or a cursor keyword.

## 5. Classification into the fix queue

| Bucket | What goes in it |
|---|---|
| Approve & I fix | Programmatic, unambiguous, non-breaking, and matching a discovered token or naming rule exactly. Examples: rebinding on-scale raw values, a layer rename applied identically to every variant of the set, and approved descriptions. |
| Quick manual fixes | Correct by inspection but impossible through the API: axis order and variant option order, which only a drag in the Figma UI changes. Give exact steps and a deep link. |
| Decide | Mechanisms, coverage intent, and system-rule questions (a repeated "violation" may mean the rule should change). Anything with two legitimate outcomes. Present options and a recommendation; a decision yields a fix or a rulebook entry. |
| Breaking — schedule | Two kinds, below. The blast radius names which. Never batch either kind with safe fixes. |

**Descriptions in Approve & I fix.** A public description follows the full structure and a private one the compact one-to-two-sentence form. Both follow the `figma-component-descriptions` skill's format where it is available. Otherwise draft inline by the same principle: for a private component, state what it is and its role, nothing more.

**Breaking, kind 1: loses consumers' work** (tested in Figma):

- deleting or retyping a component property: instances fall back to the default, so typed text is gone;
- pointing a nested instance at another component or variant: overrides on it are dropped;
- deleting a slot property: slot content is deleted;
- a layer rename that leaves one layer named differently across variants: overrides are dropped when a consumer switches variant;
- deleting a hidden layer: an instance that turned it on loses it and its text (tested on local instances);
- making an axis a boolean by deleting one side's variants: their instances lose their main component unseen (tested on local instances).

**Breaking, kind 2: changes the API, keeps the file.** Renaming a variant property or option keeps every instance and override. It still breaks Code Connect enum mappings silently, since the CLI does not check mapping keys. It also breaks scripts that set properties by name, and Swap library, which matches by name. Structural rework belongs to whichever kind it does.

Product-visible defects (non-rendering states, missing focus indication) lead the queue whatever their bucket.

## 6. After the user rules

Act in the same session:

- **Accepted**: add it to the active library's rulebook, under Accepted exceptions, with the reason.
- **Rejected**: add the fix to the queue and apply it per its bucket.
- **System rule changed** (a new scale step, say): update the rulebook entry and note the date. Mention that previously suppressed candidates may resurface on the next run.

## 7. Applying fixes

Batch approved safe fixes per component. Then **re-run the relevant scanner check on the touched components** to confirm clearance: a fix that does not clear its finding is a new finding.

Variant property renames go: warn (breaking), approval, rename, verify. Never silently restructure layer trees or change visual values.
