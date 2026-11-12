# What counts as a breaking change in a Figma library

Every change to a published Figma library that can break the files built on it, and every Figma change that can break the code built from it, case by case, with how badly each breaks and what to do instead.

Researched October 2026. Figma mechanics checked against the Plugin API and REST documentation, the help centre and staff answers on Figma's forum. Pipeline behaviour checked against Figma's own variables export example, the Code Connect source, Style Dictionary, Tokens Studio and the DTCG format. Design system practice taken from each system's own changelogs, migration maps and contribution guides: Primer, Atlassian, Polaris, Carbon, Spectrum, GitLab Pajamas and HashiCorp Helios. Eleven Figma behaviours that no documentation states were tested directly on 1 October 2026 and are marked as tested where they appear.

---

## What this answers

A library maintainer makes changes every week, and most are harmless. The hard part is knowing in advance which ones are not, because Figma rarely warns, and the damage lands in someone else's file or someone else's build.

- What actually connects a designer's instance, or an engineer's token, to the library?
- Which renames are safe, and which silently lose people's work?
- What happens to consumers when something is deleted?
- Which Figma changes break a build, and which break it silently at runtime?
- Is a changed value a breaking change?
- Which version number does each change deserve, and how long should a deprecation last?
- How do Primer, Atlassian, Polaris, Carbon, Spectrum and GitLab ship a breaking change without stranding anyone?

Every case is given one of three severities, used consistently:

- **Safe.** Consumers notice nothing, or see exactly the intended change.
- **Risky.** Nothing is lost, but something changes that consumers did not choose: a visual shift in a fixed layout, a value that moves, a name that stops matching a tool.
- **Breaking.** Someone loses work (an override, a slot's contents, a binding), or a build fails, or a page silently renders the wrong thing.

Part one covers changes that **break other people's Figma files**. Part two covers changes that **break code**. Naming rules for components, properties and layers are treated in depth in `component-naming-properties-and-layers.md`, and how rendering differs between Figma and CSS in `figma-and-code-differences.md`. Part three covers **how to version a change**, for both audiences at once. Parts one and two each end with their own cheat sheet and short version; section 25 is the versioning table, and section 27 the short version of the whole guide.

**Index**

**Part one: Changes that break other people's Figma files**

- [1. What connects a consumer's instance to the library?](#1-what-connects-a-consumers-instance-to-the-library)
- [2. Is it safe to rename a component, a variant value or a property?](#2-is-it-safe-to-rename-a-component-a-variant-value-or-a-property)
- [3. Is it safe to rename or restructure the layers inside a component?](#3-is-it-safe-to-rename-or-restructure-the-layers-inside-a-component)
- [4. What happens when a variant or component is deleted?](#4-what-happens-when-a-variant-or-component-is-deleted)
- [5. What happens when a property is deleted or changes type?](#5-what-happens-when-a-property-is-deleted-or-changes-type)
- [6. Do changed defaults reach instances already placed?](#6-do-changed-defaults-reach-instances-already-placed)
- [7. What does changing a nested instance do to consumers?](#7-what-does-changing-a-nested-instance-do-to-consumers)
- [8. What can a slot change destroy?](#8-what-can-a-slot-change-destroy)
- [9. How can a component move to another file without breaking anyone?](#9-how-can-a-component-move-to-another-file-without-breaking-anyone)
- [10. Which variable changes break consumers?](#10-which-variable-changes-break-consumers)
- [11. Which style changes break consumers?](#11-which-style-changes-break-consumers)
- [12. When is a purely visual change breaking?](#12-when-is-a-purely-visual-change-breaking)
- [13. Can consumers stay on an old version of a library?](#13-can-consumers-stay-on-an-old-version-of-a-library)
- [14. How do real systems retire something in a Figma library?](#14-how-do-real-systems-retire-something-in-a-figma-library)
- [Part one in short](#part-one-in-short)

**Part two: Figma changes that break code**

- [15. Why does a Figma rename become a code break?](#15-why-does-a-figma-rename-become-a-code-break)
- [16. What does renaming a variable break in code?](#16-what-does-renaming-a-variable-break-in-code)
- [17. What does renaming a collection or a mode break?](#17-what-does-renaming-a-collection-or-a-mode-break)
- [18. What does deleting a variable, or changing its type, break?](#18-what-does-deleting-a-variable-or-changing-its-type-break)
- [19. Is a changed value a breaking change?](#19-is-a-changed-value-a-breaking-change)
- [20. Which token renames are hardest to migrate?](#20-which-token-renames-are-hardest-to-migrate)
- [21. What does Code Connect catch, and what slips through?](#21-what-does-code-connect-catch-and-what-slips-through)
- [22. What breaks scripts keyed on layer names or node IDs?](#22-what-breaks-scripts-keyed-on-layer-names-or-node-ids)
- [23. Why do exported numbers come out with long decimals?](#23-why-do-exported-numbers-come-out-with-long-decimals)
- [24. How do real systems deprecate and remove a token?](#24-how-do-real-systems-deprecate-and-remove-a-token)
- [Part two in short](#part-two-in-short)

**Part three: Versioning the change**

- [25. Which version does each change deserve: major, minor or patch?](#25-which-version-does-each-change-deserve-major-minor-or-patch)
- [26. How long should a deprecation last before removal?](#26-how-long-should-a-deprecation-last-before-removal)
- [27. The short version](#27-the-short-version)
- [28. What to re-check later](#28-what-to-re-check-later)

---

# Part one: Changes that break other people's Figma files

---

## 1. What connects a consumer's instance to the library?

**The short answer.** An identifier, not a name. Components, component sets, styles and variables are each identified by a key that survives renaming. Layers inside a component are matched to a consumer's overrides by layer identity, also not by name. Names matter in three places only: when a consumer switches variants, when a consumer swaps an instance, and when anyone uses Swap library.

The REST API defines a component's key as its unique identifier, and the same wording covers component sets and styles; a plugin imports a component by that key, never by its name. Variables carry an `id` locally and a `key` for import. When a maintainer renames any of these and publishes, the consumer's instance is still pointing at the same key, so it simply picks up the new name.

Overrides work the same way one level down. Figma described the mechanism in 2022, when a bug corrupted it: each layer in an instance has a key, each override has a key, and an override applies when the two match. A consumer's red background on a button is stored against the background layer's identity, not against the word "Bg".

Names come back into play in three operations. When a consumer **switches a variant**, Figma's help states that the layer names of the current variant and the target must match for overrides to carry across. When a consumer **swaps** one instance for another component, only text overrides are preserved, matched by name. And **Swap library**, used when a team moves to a new library file, matches components, styles and variables by name only.

Two more facts frame everything in Part one. **Updates are not pinned.** A consumer sees an update notice, reviews it side by side, and accepts or ignores it; there is no way to stay on a version deliberately other than not clicking. And **publishing happens only from the main file**, not from a branch, so a breaking change cannot be trialled with consumers before release.

**What to do.** Treat keys as the contract and names as labels, with three exceptions to remember: names must match across variants of one set, text layer names matter for swaps, and every name matters on the day of a library swap. Before any risky change, use library analytics (Organization and Enterprise plans) to see which files use the component, so the people affected can be told.

---

## 2. Is it safe to rename a component, a variant value or a property?

**The short answer.** Inside Figma, yes. Tested directly, renaming a variant value and renaming a variant property kept every consumer instance on its variant with all overrides intact. The danger is outside Figma: anything that refers to the old name as text, from Swap library to plugins to Code Connect, stops matching.

The test used a two-variant button set, `Size=Large` and `Size=Small`, with an instance on Large carrying three overrides: a text property set to "PROP", a plain text layer changed to "OVR", and a background fill changed to red. Renaming the value `Large` to `Lg` moved the instance to `Size=Lg` with all three overrides unchanged. Renaming the property `Size` to `Scale` moved it to `Scale=Lg`, again unchanged. That is the key mechanism of section 1 at work: each variant is its own component with its own key, and `Size=Large` is only metadata on it.

Text, boolean and instance swap properties work the same way. Their internal names carry a generated suffix, such as `Text#1:0`, and a rename changes only the part before the `#`.

What does break is anything holding the old name as a string. A plugin or script that calls `setProperties({ Size: 'Large' })` fails. Swap library will not match `Lg` against `Large`. And Code Connect, covered in section 21, validates some names at publish and not others.

**What to do. Safe in Figma, risky outside it.** Rename freely inside a library, but treat every rename as a change to Part two's interface: search Code Connect files and scripts for the old string, and never rename in one library during the same release as a library swap that depends on the old name.

---

## 3. Is it safe to rename or restructure the layers inside a component?

**The short answer.** For library updates, renaming and wrapping were safe in testing: overrides survived both. For variant switching they are not: an override on a layer whose name differs between two variants is lost when the consumer switches. Layer names must therefore be identical across a set.

The same test instance had its text and fill overrides in place when the maintainer renamed the background layer from `Bg` to `Background` in both variants: the red fill stayed. Then every `Note` text layer was wrapped in a new auto layout frame called `Wrap`; the consumer's "OVR" text stayed, now inside the wrapper. Both results follow from overrides being stored against layer identity.

Switching variants is different. With the `Note` layer renamed to `Hint` in the Small variant only, a fresh instance on Large had its note changed to "KEEP?" and was then switched to Small. The text reverted to the default. Repeating it with matching names kept "KEEP?". This is the rule in Figma's help made concrete, and it is the common failure in practice, because variants are built by duplicating one and renaming layers in the copy.

Practice outside these tests is more cautious, for good reason. HashiCorp's Helios changelog marks a structural change to Advanced Table as breaking because it alters the layer structure, and GitLab's Pajamas counts lost overrides as its highest tier short of a new library. Forum reports of overrides resetting after restructures are common, and the 2022 override-key bug shows the mechanism can fail. The tests here were run inside one file, which applies the same main-component edit a library update applies through publish and accept; they show the mechanism, not a guarantee for every restructure.

**What to do. Risky.** Keep layer names identical across every variant of a set, which is the change that actually loses work. Wrapping and renaming may be done, but announce them, check a consumer file after publishing, and prefer moving a frequently overridden layer's content onto a component property, whose key is stable by design.

---

## 4. What happens when a variant or component is deleted?

**The short answer.** Nothing visible, which is the problem. Consumers' instances keep rendering exactly as before, but they are orphaned: they will never receive another update, and the component disappears from their assets panel.

Figma's help is explicit that deleting a main component does not remove its instances, and that the component can be restored from any instance. After a consumer accepts the update, the library panel lists the instance as removed, and Figma support describes such instances as partially synced. The consumer's file looks fine until the next library change fails to arrive.

**What to do. Breaking, slowly.** Deprecate instead of deleting: rename with a deprecation marker, point the description at the replacement, and remove only after analytics show no remaining use (section 14 has the conventions real systems use).

---

## 5. What happens when a property is deleted or changes type?

**The short answer.** Consumers lose the values they set. Tested directly, deleting a text property reverted every instance's text to the component default. A type change is a deletion followed by a new property, with the same result.

In the test, the button's `Text` property was set to "PROP" on the consumer instance. Deleting the property from the component returned the instance's label to "Label", the default. The consumer's typed content was gone, with no warning.

Figma's API has no way to change a property's type: `editComponentProperty` changes the name and default only, so turning a boolean into a variant means deleting one property and creating another with a new key. Every consumer's boolean value is lost, and instances land on the new property's default. Deleting the only variant property deletes the whole component set.

**What to do. Breaking.** Never delete or retype a property in a minor change. Add the new property alongside the old, mark the old one deprecated in its name, and remove it in an announced breaking release, with a note telling consumers which instances to check.

---

## 6. Do changed defaults reach instances already placed?

**The short answer.** A changed default value does, on every instance that never overrode it. A changed default variant does not: placed instances stay on the variant they point at.

Figma's help states that updating a property's default value reflects on the canvas wherever the instance layer has no override. A label default changed from "Button" to "Submit" changes every untouched button in every consuming file on the next accepted update. Instances whose label was typed in keep their text.

The default variant, the one placed when a consumer drags the set in, only affects new insertions; each placed instance points at a specific variant by key.

**What to do. Risky.** Treat a default value change as a visible change to every untouched instance, and announce it as one. Changing which variant is the default is safe.

---

## 7. What does changing a nested instance do to consumers?

**The short answer.** It wipes consumers' overrides on that nested instance. Tested directly, swapping the nested icon in a component from one variant to another discarded a consumer's colour override on the icon.

The test button contained an `Icon` instance on its `Shape=Circle` variant, and the consumer instance had changed the icon's glyph colour to green. The maintainer then swapped the nested icon in both button variants to `Shape=Square`. The consumer's icon became a square and its glyph went back to black. The glyph layer had the same name in both icon variants, so name matching would not have saved it: replacing a nested instance gives its layers new identities.

Helios hit this in production. Its February 2024 changelog warned that moving a nested link to its secondary variant would revert any changes consumers had made to its text and leading icon, and told teams to annotate their work before updating. A separate, long-standing Figma bug, reported in 2022 and still open in 2023, reset a nested instance set to a non-default variant back to the default on every library update.

**What to do. Breaking.** Treat any change to which component or variant a nested instance points at as breaking. Where consumers are expected to change a nested instance, expose it as an instance swap property: the consumer's choice is then stored on the property, not on layers that a nested swap replaces.

---

## 8. What can a slot change destroy?

**The short answer.** Everything consumers put in it. Tested directly, deleting a slot property removed all of a consumer's slot content. Renaming a slot property was safe.

Slots, generally available since June 2026, hold content each consumer adds. In the test, a `Card` component with a slot received three rectangles in a consumer instance. Renaming the slot property from `Slot` to `Body` kept all three. Deleting the property left the instance with an empty frame where the slot had been. Figma's help calls this a destructive action that resets the instance's slot area. Its migration guide adds that overrides on a placeholder-component pattern do not carry over when the library moves to slots, and that existing swap bindings break.

Tightening a slot's minimum, maximum or preferred instances could not be tested through the plugin API; the API reports breaches through `limitViolations`, which implies that existing content is flagged rather than removed.

**What to do. Breaking for deletions and migrations, safe for renames.** Remove a slot only in an announced breaking release. Migrate a library to slots as a new major version of each component, since consumers' placeholder overrides will not survive it.

---

## 9. How can a component move to another file without breaking anyone?

**The short answer.** Only through Figma's move flow: cut, paste into the destination, and publish with "Move to this file". A copy and paste creates new keys and strands every existing instance.

Figma's move flow keeps instances linked to the moved component and cannot be undone except by moving back. It works for published components and component sets; styles have their own cut, paste and publish move, and variables cannot be moved between files at all. GitLab's Pajamas adds an ordering rule from experience: publish the destination library before the source, or references break in between, and work in the main file rather than a branch.

Splitting or merging libraries usually ends in **Swap library**, which reconnects styles, instances and variables to a new library by name only. Anything renamed before the swap, or recreated under a different name, stays connected to the old library. Unpublishing a library leaves every instance in place but ends updates.

**What to do. Breaking unless done through the move flow.** Use the move flow for components, publish the destination first, and freeze renames for the release that includes a library swap. After a swap, search consumer files for anything still pointing at the old library.

---

## 10. Which variable changes break consumers?

**The short answer.** Renaming is safe in Figma. Deleting leaves ghost bindings. Changing type or moving between collections replaces the variable. Deleting a mode silently drops consumers onto the default mode, tested directly.

**Rename.** Bindings follow the key, so consumers keep their bindings. Tested directly, renaming a variable left its code syntax unchanged: a variable with web code syntax `var(--c)` renamed to `color/renamed` still printed `var(--c)` in Dev Mode. That is safe for Figma consumers and a trap for code (section 16).

**Delete.** Locally, Figma disconnects every property that used it. In consuming files the binding lingers as a ghost holding its last value, which Figma support recommends clearing with the Detach deleted variables action. The REST API marks such variables `deletedButReferenced`.

**Type change and moving collections.** A variable's type is fixed at creation, and moving one to another collection is a copy. Both produce a new variable with a new key; consumers' bindings stay on the old one.

**Mode delete.** In the test, a frame was set explicitly to mode B of a two-mode collection, and mode B was then deleted. The frame kept a reference to the deleted mode and silently resolved to the default mode's values: its fill went from red to blue with no warning. Renaming a mode is safe, though forum reports show the old name can linger in the interface.

**Alias retarget and scopes.** Pointing a semantic variable at a different primitive changes the value everywhere on the next update, with nothing to review but the colour. Changing scopes only affects the picker; existing bindings stay.

**Extended collections.** Enterprise brand collections inherit every variable they do not override. Figma's help warns that accepting the library update that introduces extended collections removes previously set variable modes from consumers' designs.

**What to do.** Rename freely, but treat **delete, retype, move and mode deletion as breaking**: deprecate first, migrate consumers, then remove. Treat an alias retarget as a visible value change and announce it.

---

## 11. Which style changes break consumers?

**The short answer.** Deleting a style detaches it everywhere it was used, keeping the look and losing the link. Moving a style to another folder is a rename. Converting styles to variables is a delete and a create.

Figma's help states that objects using a deleted style keep their properties but are detached. A style's folder is part of its name, so moving it renames it, which is safe by key but breaks Swap library matching. There is no native path from a style to a variable: the old style is deleted and the new variable created, so every consumer must rebind. Polaris did exactly this in v12, replacing its colour styles with variables and deprecating the styles rather than deleting them.

**What to do. Breaking for deletes and conversions.** Keep deprecated styles published, marked as such, through at least one release after their replacement variables ship.

---

## 12. When is a purely visual change breaking?

**The short answer.** When consumers placed the component in a layout that assumed its old size. Nothing is lost, but something now overlaps, clips or wraps, and the consumer has to act.

GitLab's Pajamas defines the line most usefully: a breaking change is anything that would require a designer to take action after updating. Its four tiers make that practical: low for an internal change like auto layout replacing a spacer, medium for size changes needing designer validation, high for lost overrides, which require a new component version kept alongside the old one for at least one milestone, and extreme for a new library file. Pajamas labels release notes the same way, for example "Breaking (medium)" for an alert heading that shrank.

**What to do. Risky.** Classify size and spacing changes as breaking at the medium tier, and say so in the release note, even though Figma raises no warning.

---

## 13. Can consumers stay on an old version of a library?

**The short answer.** Only by not accepting updates, which is not a version policy. Figma has no semantic versioning for libraries, no pinning and no deprecation flag.

Consumers accept or ignore each update; instances stay linked to deleted components until they accept. Publishing happens only from a main file, and branching requires Organization or Enterprise. What Figma does provide is library analytics: inserts, detaches and the files where each component or variant is used, over periods from 30 days to a year, with a REST analytics API on Enterprise.

**What to do.** Run a breaking change as a parallel release: publish the new component alongside the old, mark the old deprecated, use analytics to find the files still on it, and remove it only when usage has gone. For a change too large for that, ship a new library file, which is what Helios, Carbon and Atlassian did.

---

## 14. How do real systems retire something in a Figma library?

**The short answer.** With naming, descriptions, release notes and parallel libraries, because Figma offers nothing else. The systems that do it well agree on four habits: mark it in the name, point to the replacement, tier the impact, and keep the old version published for a while.

- **GitLab Pajamas** appends a warning-sign emoji and "DEPRECATED", in parentheses, to the page, the component and its description, links the replacement, paints the deprecated page a distinct red (`#FDD4CD`), and announces the change in its weekly design meeting. Its four impact tiers are described in section 12.
- **HashiCorp Helios** keeps a Figma changelog with Breaking changes headings, and advises teams per entry to annotate their in-progress work before updating. Its version 2 shipped as a new library, with the warning that replacing version 1 components would be breaking.
- **Carbon** renamed its v10 kits "[v10 Deprecated]" and froze them from 30 September 2024 (from a search summary; Carbon's own page was not reached).
- **Atlassian** froze its legacy library, stating that future improvements would no longer be published through it, and moved work to a separate new library.

**What to do.** Adopt Pajamas's definition (anything that requires a designer to act) and its tiers, mark deprecations in name and description with a link to the replacement, and keep a release note per publish with breaking changes listed first. Ship anything at the extreme tier as a new library.

---

## Part one in short

### Cheat sheet: what breaks other people's Figma files

| # | Change | Severity | What consumers lose | Safer path |
|---|---|---|---|---|
| 2 | Rename component, set, variant value or property | Safe (tested) | Nothing in Figma; Swap library and scripts stop matching | Rename, then check Part two |
| 3 | Rename or wrap a layer | Risky (tested safe on update) | Overrides, if names differ across variants and consumers switch | Identical names across variants |
| 4 | Delete a component or variant | Breaking, slowly | All future updates | Deprecate, then remove |
| 5 | Delete or retype a property | Breaking (tested) | The values consumers set | Add new, deprecate old |
| 6 | Change a default value | Risky | Untouched instances change | Announce |
| 6 | Change the default variant | Safe | Nothing | None needed |
| 7 | Change a nested instance | Breaking (tested) | Overrides on the nested instance | Expose as instance swap |
| 8 | Delete a slot property | Breaking (tested) | All slot content | Major release only |
| 8 | Rename a slot property | Safe (tested) | Nothing | None needed |
| 9 | Copy a component to another file | Breaking | The link | Move flow |
| 9 | Swap library | Risky | Anything renamed | Freeze renames |
| 10 | Rename a variable | Safe (tested) | Nothing in Figma | Update code syntax too |
| 10 | Delete, retype or move a variable | Breaking | The binding | Deprecate first |
| 10 | Delete a mode | Breaking (tested) | Silently falls back to default | Keep the mode, empty it later |
| 10 | Retarget an alias | Risky | Values change | Announce |
| 11 | Delete a style or convert to a variable | Breaking | The link | Keep deprecated styles a release |
| 12 | Change size or spacing | Risky | Layouts clip or overlap | Announce as medium |

### The short version: other people's Figma files

A library is held together by keys, not names. Components, variants, styles and variables each have a key that survives renaming, and consumers' overrides are stored against layer identity, so most renames are safe for the files that use the library: tested for variant values, variant properties, slot properties, variables and layers, including wrapping a layer in a new frame.

What breaks those files is anything that replaces an identity or removes the place a consumer's work is stored. Deleting or retyping a property resets the values consumers set; pointing a nested instance at another component drops overrides on it; deleting a slot deletes its content; deleting a mode drops frames onto the default without a warning; copying a component instead of moving it strands every instance; and deleting a component strands them quietly, still rendering and never updating. Names matter in three places only: layer names must match across a set's variants or overrides vanish when consumers switch, a swap keeps only text overrides matched by name, and Swap library matches everything by name. Figma offers no versioning or deprecation flag, so a breaking change is shipped as a parallel component, marked deprecated by name and description, and removed once analytics show nobody uses it.

---

# Part two: Figma changes that break code

---

## 15. Why does a Figma rename become a code break?

**The short answer.** Because most token pipelines turn Figma names into code names and throw away Figma's stable identifiers on the way. Figma keeps a key on every variable; the usual exporter writes only the name.

Figma's own reference exporter, `figma/variables-github-action-example`, shows the pattern. It names each output file from the collection and mode, as `${collection.name}.${mode.name}.json`. It turns each variable name into a token path by splitting on `/`. It writes aliases as references to the target's name. Its `$extensions` carry `hiddenFromPublishing`, `scopes` and `codeSyntax`, but not the variable's ID. Syncing the other way, its README says it updates variables in place by name, and creates new variables where names do not match. Style Dictionary then builds every output name from the path: `color/background/button/primary/active` becomes `color-background-button-primary-active` with the kebab transform and `colorBackgroundButtonPrimaryActive` with the camel one.

So every name in Figma (collection, mode, group and variable) becomes a file name, a CSS custom property or a code export. Figma's aliases are by ID and survive any rename inside Figma; the code they produce does not.

**What to do.** Treat the Figma variable name as a public API from the moment it is exported. Carry the variable's ID in `$extensions` so a rename can be detected as a rename, which is what Spectrum does (section 24).

---

## 16. What does renaming a variable break in code?

**The short answer.** In TypeScript or JavaScript, the build. In CSS, nothing loudly: a `var()` that names a property that no longer exists falls back silently and the page renders the wrong thing. And Figma's code syntax, tested directly, does not follow a rename.

A rename from `color/bg/default` to `color/background/default` changes `--color-bg-default` to `--color-background-default` and `colorBgDefault` to `colorBackgroundDefault`. The import of the old export fails type checking. The CSS does not fail at all: MDN states that an invalid `var()` substitution falls back to the property's initial or inherited value, so a background becomes transparent and a text colour becomes the parent's, with no error.

Code syntax is a separate trap. It is the name Dev Mode prints in snippets, and in the test it stayed `var(--c)` after the variable was renamed to `color/renamed`. A team that renames a variable without updating its code syntax ships Dev Mode snippets pointing at the old name, while an exporter that reads names ships the new one.

**What to do. Breaking.** Keep the old name as a deprecated alias for at least one release; lint for unknown custom properties, as Primer's stylelint configuration does with `csstools/value-no-unknown-custom-properties` against its own token files; and update code syntax in the same change as the name.

---

## 17. What does renaming a collection or a mode break?

**The short answer.** Whole files. With the reference exporter, a mode name is a file name, so renaming `Light` to `Day` turns `Theme.Light.json` into `Theme.Day.json`, and any theme loader or `data-theme` selector keyed on the old name loses its theme.

Spectrum shows how seriously a careful system takes this. Its tokens package shipped a major version, 15.0.0, for a change that moved tokens between files with every value unchanged byte for byte, because any consumer importing a specific file path would break. The REST API adds limits worth knowing when designing names: modes up to 40 characters, and up to 40 modes per collection.

**What to do. Breaking.** Fix collection and mode names before the first export and treat them as frozen. Where a mode must be renamed, keep the old file or selector as an alias for a release.

---

## 18. What does deleting a variable, or changing its type, break?

**The short answer.** The same as a rename, except there is no new name to migrate to. A type change is a deletion in disguise, since Figma cannot change a variable's type.

Figma's help states that properties using a deleted variable are disconnected; the REST API marks a deleted but still referenced variable `deletedButReferenced`. Downstream, the token disappears. Style Dictionary decides what a reference to a missing token does through `log.errors.brokenReferences`, which can throw or merely log; the DTCG format requires tools to report a reference whose target does not exist. A type change gives the replacement variable a new ID and key, and a type-aware transform may emit a different unit, for example a number that becomes pixels.

**What to do. Breaking.** Configure the pipeline to throw on broken references, so a deletion fails the build instead of shipping. Deprecate before deleting (section 24).

---

## 19. Is a changed value a breaking change?

**The short answer.** The systems disagree. Most ship value changes as minor or patch releases; Polaris once treated them as major; GitLab labels visual changes as breaking in its Figma kit. The defensible line: a value change is not an API break, but it is a visual change that should be reviewed as one.

Primer's 11.10.0, a minor release, changed `fgColor.done` in its protanopia and deuteranopia dark theme to `base.color.neutral.10`. Atlassian's 13.3.1, a patch, moved `color.border.accent.gray.subtle` from `Neutral300` (`#DDDEE1`) to `Neutral400` (`#B7B9BE`), and 13.1.0, a minor, tagged a change to `color.background.disabled` as user-facing. Polaris tokens 8.0.0 is the counter-example: a major release that updated shadow, font size and font weight values alongside removing legacy tokens.

Alias retargets belong here too. Pointing a semantic token at a different primitive changes every use without touching a name, and only a visual comparison catches it.

**What to do. Risky.** Version value changes as minor, list them in the release note, and catch them with visual regression rather than with the type checker. Reserve a major for wholesale value changes such as a new type scale, as Polaris did.

---

## 20. Which token renames are hardest to migrate?

**The short answer.** Splits. A one-to-one rename can be fixed by a codemod; a token that becomes several tokens, or a literal value, needs a person to decide each use.

Atlassian's 7.0.0 deleted its old shape tokens with a mapping that shows every kind: `border.radius.050` became `radius.xsmall` and `border.radius.circle` became `radius.full` (one to one), `border.width.outline` became `border.width.selected` or `border.width.focused` (one to many), and `border.radius.400` became the literal `16px` (no token at all). Carbon's v10 to v11 migration did the same at scale: `ui-01` became `layer-01`, `text-01` became `text-primary`, and `hover-ui` split three ways into `layer-hover-01`, `field-hover-01` and `background-hover`. Polaris's v12 migrator shows the reverse, many to one: `--p-shadow-inset-lg` and `--p-shadow-inset-md` both became `--p-shadow-inset-200`.

**What to do. Breaking.** Classify every renamed token as one to one, one to many, many to one or removed, and ship a codemod for the first and a migration table for the rest. The classification is the migration guide.

---

## 21. What does Code Connect catch, and what slips through?

**The short answer.** It catches renamed or deleted properties, renamed layers used by `figma.children`, and deleted nodes, by failing the publish. It does not check the values inside an enum mapping, so renaming a variant value publishes cleanly and leaves the mapping quietly wrong.

The Code Connect CLI, version 2.0.1 of September 2026, validates on every `figma connect publish` unless `--skip-validation` is passed, and exits with an error on failure. Its source checks that properties used by `figma.string`, `figma.boolean` and `figma.enum` exist, that variant restriction keys and values exist, that layers named in `figma.children` exist, and that the node is still a top-level component or set. It does not check the keys of an enum's value mapping, and it does not check `figma.instance` properties.

So the safe-in-Figma rename of section 2, `Size=Large` to `Size=Lg`, publishes without error and leaves a mapping such as `figma.enum('Size', { Large: 'large', Small: 'small' })` with no entry for `Lg`. Silent failures are documented elsewhere too: in February 2026, variant restrictions stopped matching while files still published without errors, until Figma fixed it.

**What to do.** Treat variant value renames as breaking for Code Connect even though Figma treats them as safe. Add a check of its own that every option of every mapped enum has a mapping entry, since the CLI does not.

---

## 22. What breaks scripts keyed on layer names or node IDs?

**The short answer.** Layer renames break anything that finds layers by name, and deleting and recreating a node breaks anything that stored its ID. A rename keeps the ID; a copy, a recreation or a move to another file does not.

MUI's Sync plugin, which generated a theme from MUI's Figma kit, required that the kit's layer hierarchy and names remain unaltered; development was suspended in 2024. Code Connect's `figma.children` matches by layer name and fails at publish when one is renamed. Node IDs survive renames but not recreation or moves, and a Code Connect issue records a publish that pointed at a node that had moved.

**What to do. Risky.** Key scripts on component keys and property keys, which are stable, rather than on layer names or node IDs. Where a script must use a layer name, list it in the component's description as part of its interface.

---

## 23. Why do exported numbers come out with long decimals?

**The short answer.** Figma stores numbers as 32-bit floats, so 0.8 exports as 0.800000011920929. It breaks nothing by itself, but it produces noisy diffs and occasional subpixel values.

Figma's interface rounds to two decimals, so designers never see it. Primer fixed the effect in its own pipeline with a patch to round pixel values. A diff full of changed decimals also hides the real changes a reviewer needs to see.

**What to do. Safe once handled.** Round every number at export, to four to six decimals, in one transform.

---

## 24. How do real systems deprecate and remove a token?

**The short answer.** In three stages: keep the old name working as a deprecated alias, make tooling complain about it, and remove it only in a major release with a published replacement map. The best of them also record a stable ID per token so a rename is never mistaken for a deletion and an addition.

- **Primer** keeps a file, `src/tokens/removed.json`, mapping every removed token to its replacement or to `null`, and a CI script fails the build when a token is removed without an entry: "token(s) removed but not documented in src/tokens/removed.json". It moved its deprecation marker to the DTCG standard `$deprecated`, and keeps legacy names as deprecated aliases. Its v8 maps show the scale of a rename, for example `color-fg-default` to `fgColor-default` and `color-canvas-default` to `bgColor-default`. Its versioning is looser than its tooling: renames and removals have shipped in minor and even patch releases.
- **Atlassian** runs a lifecycle from deprecated, to deleted (the token still exists but tooling errors wherever it is used), to removed in a major. Two ESLint rules enforce it, `ensure-design-token-usage` and `no-deprecated-design-token-usage`, both with automatic fixes.
- **Spectrum** gives every token a `uuid`, plus `deprecated`, `deprecated_comment` and `renamed` fields; its diff tool recognises a rename by the unchanged `uuid`, where a plain diff would report a deletion and an addition.
- **Polaris** ships a migrator with codemods per major version (`v9-*` through `v14-*`) and a stylelint plugin with allowed and disallowed custom property lists.
- **Carbon** published a v11 migration table with a status per token (unchanged, updated, split, new, deprecated) and kept a `v10` export so old names still resolved during the move.
- **GitLab Pajamas** marks deprecated tokens with `"$deprecated": true` and moves fully deprecated files to `deprecated.*.json`.

The DTCG format, in its October 2025 report and the September 2026 draft, defines `$deprecated` as `true`, `false` or an explanatory string. It has no machine-readable field for the replacement, which is why Spectrum and Primer each added their own.

**What to do.** Adopt three pieces: `$deprecated` on the token with the replacement named in a field a tool can read, a stable ID in `$extensions`, and a CI check that refuses a removal without a recorded replacement. Remove only in a major release, with a codemod for one-to-one renames.

---

## Part two in short

### Cheat sheet: what breaks code

| # | Change | Severity | How it fails | Safer path |
|---|---|---|---|---|
| 16 | Rename a variable | Breaking | TS build error; CSS silent fallback | Deprecated alias, lint unknown properties |
| 16 | Rename without code syntax | Risky (tested) | Dev Mode prints the old name | Update both together |
| 17 | Rename a collection or mode | Breaking | Theme file or selector missing | Freeze names; alias |
| 18 | Delete or retype a variable | Breaking | Broken reference | Throw on broken references |
| 19 | Change a value or retarget an alias | Risky | Visual change only | Minor release, visual regression |
| 20 | Split or merge tokens | Breaking | No mechanical migration | Classify, codemod the one-to-ones |
| 21 | Rename a property or used layer | Breaking | Code Connect publish fails | Update mapping |
| 21 | Rename a variant value | Breaking, silently | Enum mapping misses the value | Own check for mapping coverage |
| 22 | Rename a layer a script uses | Risky | Script finds nothing | Key on component and property keys |
| 23 | Any number | Safe once rounded | Float noise in diffs | Round at export |

### The short version: code

Code breaks on names, the opposite of Figma. Most token pipelines turn variable, collection and mode names into token paths, CSS custom properties and file names, and discard the variable ids Figma keeps, so a rename that is harmless in a Figma file removes a name the code uses. CSS then fails silently: an unknown custom property falls back to its initial value with no error, while TypeScript at least fails the build. Code syntax does not follow a rename, so Dev Mode keeps printing the old name. Code Connect fails the publish on a renamed property or layer, and passes a renamed variant value inside an enum mapping without a word.

The systems that cope treat exported names as a public interface: the old name stays as a deprecated alias, lint rules complain about deprecated use, removal waits for a major release with a published replacement map, and a stable id per token lets a rename be recognised as a rename rather than a deletion and an addition.

---

# Part three: Versioning the change

---

## 25. Which version does each change deserve: major, minor or patch?

**The short answer.** Grade each change twice, once for the designers' files that use the library and once for the code built from it, because the two disagree on the commonest change of all. Removing or narrowing something is major for both. Adding something, or marking it deprecated, is minor for both. A rename is a patch for Figma files and major for code. A moved value is minor. What loses a consumer's work in Figma is major for Figma, however small it looks.

Semantic versioning gives the frame: a major version for incompatible changes to the public interface, a minor for backwards-compatible additions, a patch for backwards-compatible fixes, and a minor whenever something is marked deprecated, with removal waiting for a major. Design systems that publish their policy apply it with unusual agreement on the easy cases. Primer, Carbon, Polaris and Fluent all call a new optional prop a minor, and a new component a minor. Primer and Carbon state the general form: a type made more generic is minor, a type made more specific is major. That one line covers variant options: adding an option broadens the type, removing one narrows it. Fluent alone names a new *required* prop as major, which is the same rule seen from the consumer who now has to supply something.

Renames are where policy turns strict. Fluent lists API renames as major; the USWDS treats renaming any `.usa-` class, documented or not, as major; Elastic's EUI says renaming a prop is breaking; Primer treats renaming a `data-component` value as major. The one outlier is Spectrum, whose token policy lets a typo-fix rename ship as a patch, and whose normal path is a rename with the old name kept as a deprecated alias (a minor), then removed in a later major. Every one of those policies is about code. For a Figma file, section 2 shows a rename is invisible: the instance follows the key. That is why a single level per change is wrong on every rename, in one direction or the other.

Value changes are the real disagreement, and it splits by audience. Code-side policies call them minor: Spectrum lists changing a value intentionally under minor, the Polaris CDN puts visual refinements in minor releases, and Atlassian has shipped token value changes as both patches and minors. Figma-kit policies call some of them breaking: GitLab Pajamas defines a breaking change as anything that would require a designer to act after updating, and names a component whose size changed as the medium tier, because instances in fixed layouts reflow; HashiCorp Helios labelled a spacing fix in its Figma kit as a breaking change. Nathan Curtis argues the line from the code side as well: a change contained inside a component is safe, while a colour, weight or spacing change that alters what an adopter controls (contrast against their background, text that now wraps, space they laid out around) breaks them whatever the version number says.

Defaults are the other open question. No policy found names a default change outright. Primer has shipped flipped defaults as minors with an upgrade caution; Fluent's catch-all, functionality removed in a non-compatible way, would make a behaviour-changing default major. In Figma, section 6 shows a changed default value reaches every instance that never overrode it, so it is a visible change to untouched work.

| Change | Figma files | Code |
|---|---|---|
| Something added: a component, option, property, token, mode | minor | minor |
| Something marked deprecated, old name kept | minor | minor |
| A token, style or component value moved | minor | minor |
| A component's size changed | major | minor |
| A default value changed | minor, announced | minor, with a caution |
| Renamed: component, option, axis, property, variable, mode, collection, layer | patch | major |
| Removed: component, option, property, variable, style, mode, collection | major | major |
| Retyped: a property or a variable | major | major |
| A nested instance pointed at another component or variant | major | minor |
| A slot deleted | major | major |
| A layer deleted | major | minor |
| A description or page changed | patch | patch |

**What to do.** Keep the two levels separate all the way to the release note, and let the higher one set the version number. A release whose only major is a variable rename should say it is major for code and nothing for Figma files, so designers do not stop work for it. Treat a value change as minor by default, and promote it to major for Figma files when it changes a component's size; promote it for code when it lowers contrast below the level the system promises. The levels in this table are consensus where the policies quoted agree, and this guide's judgment on the two splits they do not settle (values and defaults), resting on what each audience has to do after updating.

---

## 26. How long should a deprecation last before removal?

**The short answer.** At least one minor release, and longer where consumers cannot see it. The systems that publish a number range from one milestone to two minors, and all of them remove only in a major.

Semver itself requires the deprecation to ship in at least one minor before the removal. Spectrum's specification requires a deprecated token to remain for at least two minor versions. Atlassian runs three steps: deprecated in a minor, soft-deleted in the next minor (the token still exists, and tooling errors wherever it is used), deleted in the next major. GitLab Pajamas keeps a deprecated Figma component available for at least one milestone. Polaris deprecates in a minor ahead of removal in the next major.

The Figma side has a constraint the code side does not: there is no deprecation flag, so a deprecation is only as visible as its name, description and release note (section 14). A designer who never opens the release note learns about it when the component disappears.

**What to do.** Deprecate in a minor, keep the old name working for at least two minors on the code side and at least one release cycle on the Figma side, make tooling complain about deprecated use in between (Atlassian's lint rules are the model), and remove only in a major whose release note maps every removed name to its replacement.

---

## 27. The short version

A Figma library is held together by keys, not names. Components, variants, styles and variables each have a key that survives renaming, and consumers' overrides are stored against layer identity, so most renames inside Figma are safe. Testing confirmed it for variant values, variant properties, slot properties, variables and layers, including wrapping a layer in a new frame.

What breaks other people's files is anything that replaces an identity or removes a place to store their work. Deleting or retyping a property wipes the values consumers set. Swapping a nested instance wipes overrides on it. Deleting a slot property deletes everything consumers put in it. Deleting a mode silently drops consumers onto the default. Copying a component instead of moving it strands every instance. Deleting a component strands them more quietly, since they keep rendering and stop updating. And names do matter in three places: variants of one set must share layer names, or overrides vanish when consumers switch; swaps keep only text overrides matched by name; and Swap library matches everything by name.

What breaks code is the opposite: names. Most pipelines turn variable, collection and mode names into token paths and file names and discard Figma's keys, so a rename that is harmless in Figma removes a CSS custom property, and CSS fails silently when that happens. Code syntax does not follow a rename. Code Connect catches renamed properties and layers at publish, but not renamed variant values inside an enum mapping.

Versioning follows from the same split. Removing or narrowing something is major, adding or deprecating is minor, and a moved value is minor, for both audiences. A rename is a patch for Figma files and major for code, so a release should carry both levels rather than one; a size change is major for Figma files because fixed layouts reflow. Deprecations ship in a minor and are removed only in a major, after at least two minors on the code side.

The systems that handle this well share a pattern: they treat names as a public interface once exported, keep old names as deprecated aliases, make tooling complain about deprecated use, remove only in a major release with a published replacement map, and record a stable ID per token so a rename is detectable. On the Figma side, with no versioning to lean on, they deprecate by name and description, tier the impact the way GitLab Pajamas does, keep the old component published beside the new one, and ship anything enormous as a new library.

---

## 28. What to re-check later

- **Versioning policy sources.** Section 25 rests on published policies read on 1 October 2026: semver, Primer's and Carbon's versioning guides, Fluent's change-file rules, the Polaris CDN changelog, Spectrum's token README and data specification, Atlassian's design tokens page, the USWDS release process, EUI's props guide, GitLab Pajamas and Helios's Figma changelog. No policy names a default change outright; the default row is judgment from practice.

- **Tested in one file.** Eleven behaviours were tested on 1 October 2026 with local components in a single scratch file: variant value rename, variant property rename, layer rename, layer wrap, text property deletion, nested instance swap, variant switch with matching and mismatched names, variable rename with code syntax, mode deletion, slot property rename and slot property deletion. A library update applies the same main-component edits through publish and accept, so the results are expected to transfer, but the publish and accept path itself was not tested. The two most worth re-testing across files are layer rename and layer wrap, since practitioner reports and Helios both treat restructures as breaking.
- **Not tested.** Tightening slot limits (the plugin API exposed no setter), hiding a published component or variable from publishing, Swap library after a rename, and what Code Connect renders for an unmapped enum value.
- **Slots.** Generally available since 10 June 2026; their API and limits are new and may change. MCP support for slots in Code Connect was described as coming soon.
- **Code Connect validation.** Checked against version 2.0.1 source. A later version may add enum mapping coverage.
- **DTCG.** `$deprecated` has no replacement field in the October 2025 report or the September 2026 draft; re-check whether one is added.
- **Carbon and Twilio Paste.** Their Figma deprecation conventions come from search summaries only.
- **Figma's override mechanism.** Its description as key-matched comes from a 2022 Figma post seen only as a search summary; the tests here are consistent with it.
- **Evidence quality.** Strong for the Figma API, the Code Connect source, the reference exporter, Style Dictionary and the token changelogs of Primer, Atlassian, Polaris, Carbon and Spectrum. Thinner for consumer-side behaviour after library updates, where Figma's documentation is silent and the evidence is forum reports, two design systems' changelogs and the tests above. No published user research on breaking changes in Figma libraries was found.

---

## Sources

### Primary: Figma

- [Help: Review and accept library updates](https://help.figma.com/hc/en-us/articles/360039234193-Review-and-accept-library-updates)
- [Help: Apply changes to instances](https://help.figma.com/hc/en-us/articles/360039150733-Apply-changes-to-instances)
- [Help: Swap components and instances](https://help.figma.com/hc/en-us/articles/360039150413-Swap-components-and-instances)
- [Help: Swap libraries](https://help.figma.com/hc/en-us/articles/4404856784663-Swap-libraries)
- [Help: Move published components](https://help.figma.com/hc/en-us/articles/4404848314647-Move-published-components)
- [Help: Hide styles, components and variables when publishing](https://help.figma.com/hc/en-us/articles/360039238193-Hide-styles-components-and-variables-when-publishing)
- [Help: Publish styles and components](https://help.figma.com/hc/en-us/articles/360025508373-Publish-styles-and-components-to-a-library)
- [Help: Use slots](https://help.figma.com/hc/en-us/articles/38231200344599-Use-slots-to-build-flexible-components-in-Figma)
- [Help: Migrate a library to using slots](https://help.figma.com/hc/en-us/articles/38607529833751-Migrate-a-library-to-using-slots)
- [Help: Create and use variants](https://help.figma.com/hc/en-us/articles/360056440594-Create-and-use-variants)
- [Help: Explore component properties](https://help.figma.com/hc/en-us/articles/5579474826519-Explore-component-properties)
- [Help: Create components](https://help.figma.com/hc/en-us/articles/360038663154-Create-components-to-reuse-in-designs)
- [Help: Extend a variable collection](https://help.figma.com/hc/en-us/articles/36346281624471-Extend-a-variable-collection)
- [Help: Manage and share styles](https://help.figma.com/hc/en-us/articles/360039820134-Manage-and-share-styles)
- [Help: Add or remove a library](https://help.figma.com/hc/en-us/articles/1500008731201-Add-or-remove-a-library-from-a-design-file)
- [Help: Track library and component usage](https://help.figma.com/hc/en-us/articles/360039238353-Track-library-and-component-usage)
- [Help: Modes for variables](https://help.figma.com/hc/en-us/articles/15343816063383-Modes-for-variables)
- [Help: Create and manage variables and collections](https://help.figma.com/hc/en-us/articles/15145852043927-Create-and-manage-variables-and-collections)
- [Help: Apply variables to designs](https://help.figma.com/hc/en-us/articles/15343107263511-Apply-variables-to-designs)
- [Help: Variables in Dev Mode](https://help.figma.com/hc/en-us/articles/27882809912471-Variables-in-Dev-Mode)
- [Help: Guide to branching](https://help.figma.com/hc/en-us/articles/360063144053-Guide-to-branching)
- [Help: Unpublish a library](https://help.figma.com/hc/en-us/articles/360039236853-Unpublish-a-library)
- [Plugin API: ComponentNode](https://developers.figma.com/docs/plugins/api/ComponentNode/)
- [Plugin API: InstanceNode](https://developers.figma.com/docs/plugins/api/InstanceNode/)
- [Plugin API: Variable](https://developers.figma.com/docs/plugins/api/Variable/)
- [Plugin API: working with variables](https://developers.figma.com/docs/plugins/working-with-variables/)
- [Plugin API update, 10 June 2026](https://developers.figma.com/docs/plugins/updates/2026/06/10/update/)
- [REST API: component types](https://developers.figma.com/docs/rest-api/component-types/)
- [REST API: variables](https://developers.figma.com/docs/rest-api/variables/)
- [REST API: variables types](https://developers.figma.com/docs/rest-api/variables-types/)
- [REST API: variables endpoints](https://developers.figma.com/docs/rest-api/variables-endpoints/)
- [Code Connect: React](https://developers.figma.com/docs/code-connect/react/)
- [Code Connect repository (validation source)](https://github.com/figma/code-connect)
- [Figma variables export example](https://github.com/figma/variables-github-action-example)

### Primary: specifications and tools

- [DTCG Format, draft](https://www.designtokens.org/tr/drafts/format/)
- [MDN: using CSS custom properties](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Cascading_variables/Using_custom_properties)
- [Style Dictionary: predefined transforms](https://styledictionary.com/reference/hooks/transforms/predefined/)
- [Style Dictionary: tokens](https://styledictionary.com/info/tokens/)
- [Style Dictionary: logging](https://styledictionary.com/reference/logging/)
- [Tokens Studio: edit token names](https://docs.tokens.studio/manage-tokens/token-names/edit)

### Primary: design systems

- [Primer primitives repository](https://github.com/primer/primitives)
- [Primer stylelint config](https://github.com/primer/stylelint-config)
- [Primer: Figma](https://primer.style/product/getting-started/figma/)
- [Atlassian tokens changelog](https://unpkg.com/@atlaskit/tokens/CHANGELOG.md)
- [Atlassian: ESLint plugin usage](https://atlassian.design/components/eslint-plugin-design-system/usage)
- [Atlassian: all tokens](https://atlassian.design/components/tokens/all-tokens)
- [Atlassian: Figma libraries](https://atlassian.design/get-started/design/figma-libraries/atlassians)
- [Polaris repository](https://github.com/Shopify/polaris)
- [Polaris: v12 shadow migration](https://raw.githubusercontent.com/Shopify/polaris/main/polaris-migrator/src/migrations/v12-styles-replace-custom-property-shadow/transform.ts)
- [Polaris issue 10168](https://github.com/Shopify/polaris/issues/10168)
- [Carbon: v11 migration](https://raw.githubusercontent.com/carbon-design-system/carbon/main/docs/migration/v11.md)
- [Carbon for IBM Products design kit](https://github.com/carbon-design-system/carbon-for-products-design-kit)
- [Spectrum design data](https://github.com/adobe/spectrum-design-data)
- [GitLab Pajamas: UI kit breaking changes](https://design.gitlab.com/get-started/uik-breaking-changes/)
- [GitLab Pajamas: UI kit components](https://design.gitlab.com/get-started/uik-components/)
- [GitLab Pajamas: UI kit release notes](https://design.gitlab.com/get-started/uik-release-notes/)
- [GitLab Pajamas: design tokens authoring](https://design.gitlab.com/product-foundations/design-tokens-authoring/)
- [HashiCorp Helios: Figma components changelog](https://raw.githubusercontent.com/hashicorp/design-system/main/packages/components/CHANGELOG-FIGMA-COMPONENTS.md)
- [MUI Sync](https://mui.com/material-ui/design-resources/material-ui-sync/)

### Primary: versioning policies

- [Semantic Versioning 2.0.0](https://semver.org/)
- [Primer React: versioning](https://github.com/primer/react/blob/main/contributor-docs/versioning.md)
- [Carbon: versioning guide](https://github.com/carbon-design-system/carbon/blob/main/docs/guides/versioning.md)
- [Fluent UI: change files](https://github.com/microsoft/fluentui/blob/master/docs/react-wiki-archive/Contributing/Change-Files.md)
- [Polaris CDN adopts semantic versioning](https://shopify.dev/changelog/the-polaris-cdn-is-adopting-semantic-versioning)
- [Spectrum tokens README](https://github.com/adobe/spectrum-design-data/blob/main/packages/tokens/README.md)
- [Spectrum design data: evolution](https://github.com/adobe/spectrum-design-data/blob/main/packages/design-data-spec/spec/evolution.md)
- [Spectrum design data: diff](https://github.com/adobe/spectrum-design-data/blob/main/packages/design-data-spec/spec/diff.md)
- [Atlassian: design tokens and theming](https://developer.atlassian.com/platform/forge/design-tokens-and-theming/)
- [Atlassian: release phases](https://atlassian.design/release-phases)
- [USWDS: release process](https://github.com/uswds/uswds/wiki/Release-process)
- [Elastic EUI: props](https://github.com/elastic/eui/blob/main/wiki/contributing-to-eui/developing/props.md)
- [GOV.UK Frontend: versioning](https://github.com/alphagov/govuk-frontend/blob/main/docs/contributing/versioning.md)
- [GitLab Pajamas: UI kit release process](https://design.gitlab.com/get-started/uik-release-process/)
- [React Spectrum: versioning](https://react-spectrum.adobe.com/v3/versioning.html)

### Commentary and community reports

- [Figma forum: slot content lost on variant switch](https://forum.figma.com/report-a-problem-6/instance-variants-not-preserving-slot-content-52775)
- [Figma forum: overrides broken after library publish](https://forum.figma.com/ask-the-community-7/component-overrides-get-broken-after-library-publish-27231)
- [Figma forum: nested variants reset after library update](https://forum.figma.com/ask-the-community-7/nested-variant-instances-within-a-component-are-reset-after-the-library-update-35195)
- [Figma forum: component removed from library alert](https://forum.figma.com/report-a-problem-6/the-alert-component-removed-from-library-57094)
- [Figma forum: removing an instance whose main was deleted](https://forum.figma.com/ask-the-community-7/how-do-i-remove-a-shared-component-whose-original-component-is-deleted-27379)
- [Figma forum: old mode name persists](https://forum.figma.com/report-a-problem-6/old-variable-mode-name-persists-after-change-37875)
- [Figma forum: clearing deleted variables](https://forum.figma.com/ask-the-community-7/how-to-clear-used-variables-that-don-t-exist-in-the-file-anymore-18616)
- [Figma forum: Code Connect variant matching stopped working](https://forum.figma.com/ask-the-community-7/code-connect-variant-matching-stopped-working-50728)
- [Code Connect issue 337](https://github.com/figma/code-connect/issues/337)
- [Nathan Curtis: visual breaking change in design systems](https://nathanacurtis.substack.com/p/visual-breaking-change-in-design-systems-1e9109fac9c4)
- [Nathan Curtis: versioning design systems](https://nathanacurtis.substack.com/p/versioning-design-systems-48cceb5ace4d)
- [Atlassian developer community: legacy library no longer supported](https://community.developer.atlassian.com/t/atlassian-design-system-library-no-longer-supported/93753)

### Cited but not resolved to a URL

- Figma's 2022 post recapping the override bug, which describes layer and override keys; the forum page returned an access error and was read only as a search summary.
- Carbon's v10 kit deprecation and freeze date, and Twilio Paste's Figma version-history conventions; search summaries only.
