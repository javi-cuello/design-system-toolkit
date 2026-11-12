# What counts as a breaking change in a Figma library

A Figma library has two audiences, the designers' files built on it and the code generated from it, and they break on opposite things: files break when an identity is replaced or a place holding someone's work is removed, code breaks when a name changes. This piece goes through every common library change for both, says how badly each breaks, and argues that each release needs two version levels, not one.

Researched October 2026; re-checked November 2026. Figma mechanics were checked against the Plugin API and REST documentation, the help centre and staff answers on Figma's forum. Pipeline behaviour was checked against Figma's own variables export example, the Code Connect source, Style Dictionary, Tokens Studio and the DTCG format. Practice comes from each system's changelogs, migration maps and contribution guides: Primer, Atlassian, Polaris, Carbon, Spectrum, GitLab Pajamas and HashiCorp Helios, and from published versioning policies. Eleven Figma behaviours no documentation states were tested directly on 1 October 2026 and are marked as tested. In November 2026 the Code Connect release notes were re-read through 2.1.0 (no change to validation since 2.0.1), the DTCG draft of 8 September 2026 was re-read for `$deprecated`, and Figma's plans page for branching and modes. The toolkit grades every snapshot of its projects' libraries with a two-audience table built from this research; where its grades differ from this piece's first draft, the text says which holds and why.

---

## What this answers

- What connects a designer's instance, or an engineer's token, to the library?
- Which renames are safe, and which silently lose people's work?
- What happens to consumers when something is deleted, retyped or moved?
- Which Figma changes break a build, and which break a page silently?
- Is a changed value a breaking change?
- Which version does each change deserve, and how long should a deprecation last?
- How do real systems retire a component or a token without stranding anyone?

Every case gets one of three severities: **safe** (consumers notice nothing, or see exactly the intended change), **risky** (nothing is lost, but something changes that consumers did not choose), **breaking** (someone loses work, a build fails, or a page renders the wrong thing). Naming rules themselves are in [naming-inside-figma-components.md](../components-and-naming/naming-inside-figma-components.md).

---

## 1. What holds a consumer's file to the library?

**The short answer.** Keys, not names. Components, sets, styles and variables each have a key that survives renaming, and a consumer's overrides are stored against layer identity. Names matter in three places only: switching variants, swapping instances, and Swap library.

The REST API defines a component's key as its unique identifier, and the same holds for sets and styles; a plugin imports by key, never by name. Variables carry an `id` locally and a `key` for import. When a maintainer renames and publishes, the consumer's instance still points at the same key and picks up the new name. Overrides work the same way one level down: Figma described the mechanism in 2022, when a bug corrupted it (each layer in an instance has a key, each override has a key, and an override applies when they match). A consumer's red background is stored against the background layer, not the word "Bg".

Names come back in three operations. When a consumer **switches a variant**, layer names in the current and target variant must match for overrides to carry. When a consumer **swaps** an instance for another component, only text overrides survive, matched by name. And **Swap library** matches components, styles and variables by name only.

Two more facts frame the rest. **Updates are not pinned**: a consumer accepts or ignores each update, and there is no way to stay on a version other than not clicking. And **publishing happens only from the main file**, not a branch (branching itself needs Organization or Enterprise), so a breaking change cannot be trialled with consumers first. What Figma does provide is library analytics on Organization and Enterprise: inserts, detaches and the files using each component or variant, over 30 days to a year.

**What to do.** Treat keys as the contract and names as labels, with the three exceptions in mind. Before any risky change, use analytics to see which files use the component, so the people affected can be told.

---

## 2. Is it safe to rename a component, a variant value, a property or a layer?

**The short answer.** Inside Figma, yes, tested directly, with one exception: layer names must stay identical across a set's variants. Outside Figma, every rename breaks anything holding the old name as text.

The test used a set with `Size=Large` and `Size=Small` and an instance on Large carrying three overrides: a text property set to "PROP", a plain text layer changed to "OVR", and a background fill changed to red. Renaming `Large` to `Lg` moved the instance to `Size=Lg` with all three intact; renaming the property `Size` to `Scale` did the same. Each variant is its own component with its own key, and `Size=Large` is metadata on it. Text, boolean and swap properties carry a generated suffix (`Text#1:0`), and a rename changes only the part before the `#`.

Layers behaved the same on update: renaming the background layer from `Bg` to `Background` in both variants kept the red fill, and wrapping every `Note` layer in a new auto layout frame kept "OVR". Variant switching did not: with `Note` renamed to `Hint` in the Small variant only, an instance on Large with its note changed to "KEEP?" reverted to the default when switched to Small; with matching names it kept "KEEP?". This is the common failure in practice, because variants are built by duplicating one and renaming layers in the copy.

Practice is more cautious than the tests, for good reason. Helios marks a structural change to Advanced Table as breaking because it alters the layer structure; Pajamas counts lost overrides as its highest tier short of a new library; forum reports of overrides resetting after restructures are common. The tests ran inside one file, which applies the same main-component edit a library update applies through publish and accept; they show the mechanism, not a guarantee.

What breaks is anything holding the old name: a script calling `setProperties({ Size: 'Large' })`, Swap library matching `Lg` against `Large`, Code Connect (section 8), and a parity mapping that names a layer.

**What to do. Safe in Figma, risky outside it.** Keep layer names identical across every variant of a set. Treat every rename as a change to the code's interface (sections 6 to 9), and never rename in the same release as a library swap that depends on the old name.

---

## 3. What happens when a component, variant or property is deleted, or a property changes type?

**The short answer.** Deleting a component orphans its instances quietly: they keep rendering and never update again. Deleting or retyping a property wipes the values consumers set, tested directly.

Figma's help says deleting a main component does not remove its instances and that the component can be restored from any of them. After the consumer accepts the update, the library panel lists the instance as removed; Figma support calls such instances partially synced. The file looks fine until the next change fails to arrive.

In the test, the `Text` property was set to "PROP" on the instance; deleting the property returned the label to "Label", the default, with no warning. Figma's API cannot change a property's type (`editComponentProperty` changes the name and default only), so a boolean that becomes a variant is a deletion plus a creation with a new key, and every consumer lands on the new property's default. Deleting the only variant property deletes the whole set.

**What to do. Breaking.** Deprecate instead of deleting: mark it in the name, point the description at the replacement, and remove only after analytics show no remaining use. Never delete or retype a property in a minor release; add the new one alongside, mark the old deprecated, and remove it in an announced breaking release.

---

## 4. What do changed defaults, nested instances and slots do to consumers?

**The short answer.** A changed default value reaches every instance that never overrode it; a changed default variant reaches only new insertions. Repointing a nested instance wipes consumers' overrides on it, tested directly. Deleting a slot deletes everything consumers put in it, also tested; renaming one is safe.

**Defaults.** Figma's help says an updated default value shows wherever the instance has no override: a label default changed from "Button" to "Submit" changes every untouched button in every consuming file on the next accepted update. Each placed instance points at a specific variant by key, so the default variant matters only for new insertions.

**Nested instances.** The test button held an `Icon` instance on `Shape=Circle`, and the consumer had changed the icon's glyph to green. The maintainer swapped the nested icon in both button variants to `Shape=Square`; the consumer's icon became a square and its glyph went back to black, although the glyph layer had the same name in both icon variants. Replacing a nested instance gives its layers new identities. Helios hit this in production: its February 2024 changelog warned that moving a nested link to its secondary variant would revert consumers' text and icon changes, and told teams to annotate their work first.

**Slots.** Generally available since June 2026, slots hold content each consumer adds. A `Card` with three rectangles in a consumer's slot kept all three when the property was renamed from `Slot` to `Body`, and lost them all when it was deleted; Figma's help calls this a destructive action. Its migration guide adds that overrides on a placeholder-component pattern do not carry over when a library moves to slots. Tightening a slot's limits could not be tested; the API reports breaches through `limitViolations`, which implies content is flagged rather than removed.

**What to do.** Announce a changed default value as a visible change. Treat a repointed nested instance as breaking, and where consumers are expected to change a nested instance, expose it as an instance swap property, which stores their choice on a stable key. Remove a slot only in a breaking release, and migrate a library to slots as a new major version of each component.

---

## 5. How do moves, variables and styles break consumers' files?

**The short answer.** A component moves safely only through Figma's move flow. Renaming a variable or mode is safe; deleting a variable leaves ghost bindings, retyping or moving one replaces it, and deleting a mode silently drops frames onto the default, tested directly. Deleting a style detaches it everywhere.

**Moves.** Cut, paste into the destination and publish with "Move to this file" keeps instances linked; a copy and paste creates new keys and strands every instance. Styles have their own move; variables cannot be moved between files. Pajamas adds an ordering rule: publish the destination before the source. Swap library, the usual end of a split or merge, matches by name only, so anything renamed beforehand stays on the old library.

**Variables.** Bindings follow the key, so renames are safe for consumers. Locally, deleting a variable disconnects every property using it; in consuming files the binding lingers as a ghost holding its last value, which the REST API marks `deletedButReferenced`. A variable's type is fixed at creation and moving collections is a copy, so both produce a new key. In the mode test, a frame set explicitly to mode B kept a reference to the deleted mode and silently resolved to the default: its fill went from red to blue. Renaming a mode is safe, though forum reports show the old name can linger in the interface. Retargeting an alias changes the value everywhere on the next update with nothing to review but the colour. Figma warns that accepting the update that introduces extended collections removes previously set variable modes from consumers' designs.

**Styles.** Objects using a deleted style keep their look and lose the link. A style's folder is part of its name. There is no path from a style to a variable: Polaris v12 replaced its colour styles with variables and deprecated the styles rather than deleting them.

**What to do.** Move components through the move flow, publish the destination first, and freeze renames in a release with a library swap. Treat deleting, retyping or moving a variable, deleting a mode and deleting a style as breaking; deprecate first, migrate, then remove.

---

## 6. Why does a Figma rename become a code break?

**The short answer.** Because most token pipelines turn Figma names into code names and throw away Figma's stable identifiers on the way.

Figma's reference exporter, `figma/variables-github-action-example`, names each output file `${collection.name}.${mode.name}.json`, turns each variable name into a token path by splitting on `/`, and writes aliases as references to the target's name. Its `$extensions` carry `hiddenFromPublishing`, `scopes` and `codeSyntax`, not the variable's ID. Syncing the other way, it "will look for existing collections and variables by name", creates one where no name matches, and deletes none, so a renamed token leaves its old variable behind. Style Dictionary then builds every output name from the path: `color/background/button/primary/active` becomes `color-background-button-primary-active` or `colorBackgroundButtonPrimaryActive`.

So collection, mode, group and variable names all become file names, custom properties or exports. A rename from `color/bg/default` to `color/background/default` fails the TypeScript build at the old import. The CSS does not fail at all: an invalid `var()` falls back to the property's initial or inherited value, so a background turns transparent with no error. Renaming a mode renames a file: `Theme.Light.json` becomes `Theme.Day.json`, and any loader or `data-theme` selector keyed on the old name loses its theme. Spectrum takes this seriously enough to have shipped a major, tokens 15.0.0, for moving tokens between files with every value unchanged, because consumers importing a specific path would break.

Code syntax is a separate trap, tested directly: a variable with web code syntax `var(--c)` renamed to `color/renamed` still printed `var(--c)` in Dev Mode. A team that renames without updating code syntax ships snippets pointing at the old name while an exporter that reads names ships the new one.

The toolkit's projects take the opposite route on purpose: tokens are generated under Figma's own names, and a component's contract can be stored keyed by its Figma component key, so a rename in Figma keeps its contract (`knowledge/code/figma-handoff.md#what-a-component-contract-covers`).

**What to do. Breaking.** Treat exported names as a public API. Carry the variable's ID in `$extensions` so a rename is detectable as a rename. Keep the old name as a deprecated alias for at least one release, lint for unknown custom properties (Primer's stylelint uses `csstools/value-no-unknown-custom-properties` against its own token files), update code syntax in the same change, and fix collection and mode names before the first export.

---

## 7. What do deletions, retypes and value changes break in code?

**The short answer.** A deletion breaks every reference with no name to migrate to, so the pipeline should throw. A value change is not an API break, but it is a visual change that needs review.

Style Dictionary decides what a reference to a missing token does through `log.errors.brokenReferences`, which can throw or merely log; the DTCG format requires tools to report a reference whose target does not exist. A type change gives the replacement a new ID, and a type-aware transform may emit a different unit.

Value changes are where systems disagree. Primer's 11.10.0, a minor, changed `fgColor.done` in its colour-blind dark themes. Atlassian's 13.3.1, a patch, moved `color.border.accent.gray.subtle` from `Neutral300` (`#DDDEE1`) to `Neutral400` (`#B7B9BE`). Polaris tokens 8.0.0 is the counter-example, a major that updated shadow, font size and weight values alongside removing legacy tokens. Alias retargets belong here too: only a visual comparison catches them.

Exported numbers have their own noise. Figma stores numbers as 32-bit floats, so 0.8 exports as 0.800000011920929; the interface rounds to two decimals and nobody sees it. It breaks nothing by itself, but it produces subpixel values and diffs full of changed decimals that hide the real changes; Primer patched its pipeline to round pixel values. Figma's documentation also disagrees with itself on timing variables (milliseconds in the help centre, seconds in the Plugin API type), so confirm before mapping them to a DTCG duration.

**What to do.** Configure the pipeline to throw on broken references. Version value changes as minor, list them, and catch them with visual regression rather than the type checker. Round every number at export, to four to six decimals, in one transform.

---

## 8. What does Code Connect catch, and what slips through?

**The short answer.** It fails the publish on a renamed or deleted property, a renamed layer used by `figma.children`, and a deleted node. It does not check the values inside an enum mapping, so renaming a variant value publishes cleanly and leaves the mapping quietly wrong.

The CLI validates on every `figma connect publish` unless `--skip-validation` is passed. Its 2.0.1 source checks that properties used by `figma.string`, `figma.boolean` and `figma.enum` exist, that variant restriction keys and values exist, that layers named in `figma.children` exist, and that the node is still a top-level component or set. It does not check an enum's value mapping keys or `figma.instance` properties. The 2.1.0 release notes (26 October 2026) list no validation change. So the safe-in-Figma rename `Size=Large` to `Size=Lg` leaves `figma.enum('Size', { Large: 'large', Small: 'small' })` with no entry for `Lg`. Silent failures are documented elsewhere too: in February 2026 variant restrictions stopped matching while files still published without errors, until Figma fixed it. Since 17 August 2026 the framework-specific parsers are unmaintained, and template files are the supported path.

Scripts keyed on layer names fail the same way. MUI's Sync plugin required that the kit's layer hierarchy and names stay unaltered, and was suspended in 2024. Node IDs survive renames but not recreation or moves; a Code Connect issue records a publish pointing at a node that had moved. A component rename, by contrast, does not break a mapping, because Code Connect connects by node URL rather than by name.

**What to do.** Treat variant value renames as breaking for Code Connect, and add a check that every option of every mapped enum has an entry. Key scripts on component and property keys rather than layer names or node IDs; where a script must use a layer name, list it in the component's description as part of its interface.

---

## 9. Which version does each change deserve?

**The short answer.** Grade each change twice, once for Figma files and once for code, because the two disagree on the commonest change of all. Removing or narrowing is major for both; adding or deprecating is minor for both; a moved value is minor; a variable, property or option rename is a patch for Figma files and major for code; and anything that loses a consumer's work in Figma is major for Figma, however small it looks in code.

Semver gives the frame: major for incompatible changes to the public interface, minor for compatible additions and for marking something deprecated, patch for compatible fixes. Design systems agree on the easy cases: Primer, Carbon, Polaris and Fluent call a new optional prop or a new component minor; Primer and Carbon state the general form, that a type made more generic is minor and one made more specific is major, which covers variant options (adding broadens, removing narrows). Fluent alone names a new required prop major, the same rule seen from the consumer who must now supply something.

Renames are where policy turns strict. Fluent lists API renames as major; USWDS treats renaming any `.usa-` class as major; Elastic's EUI says renaming a prop is breaking; Primer treats renaming a `data-component` value as major. Spectrum alone lets a typo-fix rename ship as a patch, its normal path being a rename with the old name kept as a deprecated alias, then removed in a major. Every one of those policies is about code; for a Figma file, a rename is invisible.

Values split by audience. Code-side policies call them minor (Spectrum lists intentional value changes under minor; the Polaris CDN puts visual refinements in minors). Figma-kit policies call some breaking: Pajamas defines a breaking change as anything that would require a designer to act after updating, and names a component whose size changed as its medium tier, because instances in fixed layouts reflow; Helios labelled a spacing fix in its kit as breaking. Nathan Curtis argues the same from code: a change contained inside a component is safe, while one that alters what an adopter controls (contrast against their background, text that now wraps) breaks them whatever the version says.

The toolkit implemented this as a table that grades every snapshot of a library for both audiences and stores the grade with the change (`standards/snapshot-standard.md`, rule 20; `GRADE_RULES` in `tools/snapshot/store.cjs`). Running it corrected two rows of this piece's first draft. A **component** or **layer** rename is minor for code, not major: Code Connect connects by node, so only what finds the component or layer by name needs the new one. And a changed **default variant** is a patch for Figma files and minor for code, since only new instances get it and code defaults should follow. The table as the toolkit runs it:

| Change | Figma files | Code |
|---|---|---|
| Added: component, option, property, variable, style, mode, collection | minor | minor |
| Marked deprecated, old name kept | minor | minor |
| A token or style value moved | minor | minor |
| A component's size changed | major | minor |
| The default variant changed | patch | minor |
| Renamed: variable, style, mode, collection, property, option, variant axis | patch | major |
| Renamed: component or layer | patch | minor |
| Removed: component, option, property, slot, variable, style, mode, collection | major | major |
| Retyped: a property or a variable | major | major |
| A nested instance pointed at another component or variant | major | minor |
| A layer removed | major | minor |
| A description or page changed | patch | patch |

No policy found names a default value change outright; Primer has shipped flipped defaults as minors with an upgrade caution, and this piece treats them as minor for both, announced. The toolkit's one operational lesson about the grade itself: print it first. On one project the run's first lines said BREAKING with six renamed tokens, and the reader looked at the last forty lines and missed it (`skills/design-code-parity/SKILL.md`, "Traps").

**What to do.** Keep the two levels separate all the way to the release note, and let the higher set the version number. A release whose only major is a variable rename should say it is major for code and nothing for Figma files, so designers do not stop work for it. Promote a value change to major for Figma files when it changes a component's size, and for code when it lowers contrast below the level the system promises.

---

## 10. How do real systems deprecate and retire things?

**The short answer.** Figma offers no versioning, pinning or deprecation flag, so libraries deprecate by name, description and release note, keep the old component beside the new, and ship anything enormous as a new library. On the code side the best systems run three stages: deprecated alias, tooling that complains, removal in a major with a replacement map, plus a stable ID per token.

**In Figma.** GitLab Pajamas appends a warning-sign emoji and "DEPRECATED" to the page, component and description, links the replacement, paints the deprecated page red (`#FDD4CD`) and announces it at a weekly design meeting. Its four tiers make "breaking" practical: low for an internal change such as auto layout replacing a spacer, medium for size changes needing validation, high for lost overrides (a new component version kept beside the old for at least one milestone), extreme for a new library file. Helios keeps a Figma changelog with Breaking changes headings and shipped version 2 as a new library. Carbon renamed its v10 kits "[v10 Deprecated]" and froze them from 30 September 2024 (from a search summary). Atlassian froze its legacy library and moved work to a new one.

**In code.** Primer keeps `src/tokens/removed.json`, mapping every removed token to its replacement or `null`, with a CI script that fails "token(s) removed but not documented"; it uses the DTCG `$deprecated` and keeps legacy names as deprecated aliases (`color-fg-default` became `fgColor-default`), though renames and removals have shipped in minors and patches. Atlassian runs deprecated, then deleted (the token exists but tooling errors wherever it is used), then removed in a major, enforced by two ESLint rules with automatic fixes. Spectrum gives every token a `uuid` plus `deprecated`, `deprecated_comment` and `renamed`, so its diff tool recognises a rename where a plain diff sees a deletion and an addition. Polaris ships codemods per major (`v9-*` to `v14-*`) and a stylelint plugin; Carbon published a v11 table with a status per token and kept a `v10` export; Pajamas marks `"$deprecated": true` and moves fully deprecated files to `deprecated.*.json`.

Splits are the hardest migrations. Atlassian 7.0.0 shows every kind: `border.radius.050` became `radius.xsmall` (one to one), `border.width.outline` became `border.width.selected` or `border.width.focused` (one to many), `border.radius.400` became the literal `16px` (no token). Carbon's `hover-ui` split three ways into `layer-hover-01`, `field-hover-01` and `background-hover`; Polaris v12 went many to one, `--p-shadow-inset-lg` and `--p-shadow-inset-md` both becoming `--p-shadow-inset-200`.

The DTCG format, in the 2025.10 report and the draft of 8 September 2026, defines `$deprecated` as `true`, `false` or an explanatory string, on tokens and groups. It still has no dedicated replacement field, but the draft now says tools may treat an alias in the string, such as `{button.activeBorder}`, as a link to the replacement, which is the first standard hook for a machine-readable replacement.

How long: semver requires a deprecation to ship in at least one minor before removal; Spectrum requires two minors; Atlassian runs deprecated in a minor, soft-deleted in the next, removed in the next major; Pajamas keeps a deprecated Figma component at least one milestone. In Figma, a deprecation is only as visible as its name, description and release note.

**What to do.** Deprecate in a minor and remove only in a major. Keep old names working for at least two minors in code and one release cycle in Figma, with tooling complaining in between. Put `$deprecated` on the token with the replacement as an alias in its string, a stable ID in `$extensions`, and a CI check that refuses a removal without a recorded replacement. Classify every renamed token as one to one, one to many, many to one or removed, ship a codemod for the first and a table for the rest.

---

## 11. Cheat sheet

| Change | Figma files | Code | Safer path |
|---|---|---|---|
| Rename component, option, property (tested) | safe | Code Connect enum misses renamed options; scripts stop matching | own enum coverage check |
| Rename or wrap a layer (tested) | safe on update; lost on variant switch if names differ | `figma.children` and parity mappings fail | identical names across variants |
| Delete a component | instances orphaned | export removed | deprecate, then remove |
| Delete or retype a property (tested) | consumers' values lost | Code Connect publish fails | add new, deprecate old |
| Change a default value | untouched instances change | caution | announce |
| Repoint a nested instance (tested) | overrides on it lost | minor | expose as instance swap |
| Delete a slot (tested) | all slot content lost | removed | major release only |
| Copy instead of move | link lost | none | move flow |
| Rename a variable (tested) | safe | build error or silent CSS fallback; code syntax stays old | deprecated alias; update code syntax |
| Rename a mode or collection | safe | theme file or selector missing | freeze names |
| Delete a mode (tested) | silently falls back to default | theme removed | keep the mode, empty it later |
| Delete, retype or move a variable | ghost binding or new key | broken reference | throw on broken references |
| Change a value or retarget an alias | values move | visual change only | minor; visual regression |
| Delete a style or convert to a variable | detached | token removed | keep deprecated styles a release |
| Change a component's size | layouts reflow | minor | announce as major for Figma |
| Any exported number | none | float noise | round at export |

---

## 12. The short version

A Figma library is held together by keys, not names. Components, variants, styles and variables each have a key that survives renaming, and consumers' overrides are stored against layer identity, so most renames are safe for the files that use the library; tests confirmed it for variant values, variant properties, slot properties, variables and layers, including wrapping a layer in a new frame. What breaks those files is anything that replaces an identity or removes a place their work is stored: deleting or retyping a property, repointing a nested instance, deleting a slot, deleting a mode, copying a component instead of moving it, and deleting a component, which strands its instances quietly. Names matter in three places: across a set's variants, on swaps, and in Swap library.

Code breaks on the opposite: names. Pipelines turn variable, collection and mode names into token paths and file names and discard Figma's keys, so a rename harmless in Figma removes a custom property, and CSS fails silently. Code syntax does not follow a rename. Code Connect catches renamed properties and layers at publish, and passes a renamed variant value inside an enum mapping without a word.

So a release carries two levels. Removing or narrowing is major for both audiences, adding or deprecating minor, a moved value minor; a variable, property or option rename is a patch for Figma and major for code; a size change is major for Figma files because fixed layouts reflow. The toolkit grades every library snapshot this way and stores the grade, which is the evidence that two levels can be computed rather than argued. The systems that cope keep old names as deprecated aliases, make tooling complain, remove only in a major with a replacement map, record a stable ID per token, and, in Figma, deprecate by name and description, keep the old component published beside the new, and ship anything enormous as a new library.

---

## 13. What to re-check later

- **Tested in one file.** Eleven behaviours were tested on 1 October 2026 with local components in one scratch file; the publish and accept path itself was not. Layer rename and wrap are the two most worth re-testing across files, since practitioners and Helios treat restructures as breaking.
- **Not tested.** Tightening slot limits, hiding a published component or variable, Swap library after a rename, what Code Connect renders for an unmapped enum value.
- **Code Connect validation.** Checked against the 2.0.1 source; 2.1.0's notes list no validation change, but its source was not re-read.
- **DTCG.** Whether the alias-in-the-string convention for `$deprecated` becomes a dedicated replacement field.
- **Slots.** GA since 10 June 2026; their API and limits may still change.
- **Single sources.** Carbon's v10 freeze and Twilio Paste's Figma conventions come from search summaries; Figma's 2022 override-key description was read only as a search summary, and the tests are consistent with it.
- **No user research** on breaking changes in Figma libraries was found.

---

## Sources

### Primary: Figma

- [Help: Review and accept library updates](https://help.figma.com/hc/en-us/articles/360039234193-Review-and-accept-library-updates)
- [Help: Apply changes to instances](https://help.figma.com/hc/en-us/articles/360039150733-Apply-changes-to-instances)
- [Help: Swap components and instances](https://help.figma.com/hc/en-us/articles/360039150413-Swap-components-and-instances)
- [Help: Swap libraries](https://help.figma.com/hc/en-us/articles/4404856784663-Swap-libraries)
- [Help: Move published components](https://help.figma.com/hc/en-us/articles/4404848314647-Move-published-components)
- [Help: Use slots](https://help.figma.com/hc/en-us/articles/38231200344599-Use-slots-to-build-flexible-components-in-Figma)
- [Help: Migrate a library to using slots](https://help.figma.com/hc/en-us/articles/38607529833751-Migrate-a-library-to-using-slots)
- [Help: Create and use variants](https://help.figma.com/hc/en-us/articles/360056440594-Create-and-use-variants)
- [Help: Explore component properties](https://help.figma.com/hc/en-us/articles/5579474826519-Explore-component-properties)
- [Help: Create components](https://help.figma.com/hc/en-us/articles/360038663154-Create-components-to-reuse-in-designs)
- [Help: Extend a variable collection](https://help.figma.com/hc/en-us/articles/36346281624471-Extend-a-variable-collection)
- [Help: Manage and share styles](https://help.figma.com/hc/en-us/articles/360039820134-Manage-and-share-styles)
- [Help: Track library and component usage](https://help.figma.com/hc/en-us/articles/360039238353-Track-library-and-component-usage)
- [Help: Modes for variables](https://help.figma.com/hc/en-us/articles/15343816063383-Modes-for-variables)
- [Help: Create and manage variables and collections](https://help.figma.com/hc/en-us/articles/15145852043927-Create-and-manage-variables-and-collections)
- [Help: Variables in Dev Mode](https://help.figma.com/hc/en-us/articles/27882809912471-Variables-in-Dev-Mode)
- [Help: Guide to branching](https://help.figma.com/hc/en-us/articles/360063144053-Guide-to-branching)
- [Help: Figma plans and features](https://help.figma.com/hc/en-us/articles/360040328273-Figma-plans-and-features)
- [Help: Unpublish a library](https://help.figma.com/hc/en-us/articles/360039236853-Unpublish-a-library)
- [Plugin API: ComponentNode](https://developers.figma.com/docs/plugins/api/ComponentNode/)
- [Plugin API: InstanceNode](https://developers.figma.com/docs/plugins/api/InstanceNode/)
- [Plugin API: Variable](https://developers.figma.com/docs/plugins/api/Variable/)
- [Plugin API update, 10 June 2026](https://developers.figma.com/docs/plugins/updates/2026/06/10/update/)
- [REST API: component types](https://developers.figma.com/docs/rest-api/component-types/)
- [REST API: variables](https://developers.figma.com/docs/rest-api/variables/)
- [Code Connect: React](https://developers.figma.com/docs/code-connect/react/)
- [Code Connect repository and releases](https://github.com/figma/code-connect/releases)
- [Figma variables export example](https://github.com/figma/variables-github-action-example)

### Primary: specifications and tools

- [DTCG Format, draft of 8 September 2026](https://www.designtokens.org/tr/drafts/format/)
- [MDN: using CSS custom properties](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Cascading_variables/Using_custom_properties)
- [Style Dictionary: predefined transforms](https://styledictionary.com/reference/hooks/transforms/predefined/)
- [Style Dictionary: logging](https://styledictionary.com/reference/logging/)
- [Tokens Studio: edit token names](https://docs.tokens.studio/manage-tokens/token-names/edit)

### Primary: design systems and versioning policies

- [Primer primitives repository](https://github.com/primer/primitives)
- [Primer stylelint config](https://github.com/primer/stylelint-config)
- [Primer React: versioning](https://github.com/primer/react/blob/main/contributor-docs/versioning.md)
- [Atlassian tokens changelog](https://unpkg.com/@atlaskit/tokens/CHANGELOG.md)
- [Atlassian: ESLint plugin usage](https://atlassian.design/components/eslint-plugin-design-system/usage)
- [Atlassian: Figma libraries](https://atlassian.design/get-started/design/figma-libraries/atlassians)
- [Atlassian: design tokens and theming](https://developer.atlassian.com/platform/forge/design-tokens-and-theming/)
- [Polaris: v12 shadow migration](https://raw.githubusercontent.com/Shopify/polaris/main/polaris-migrator/src/migrations/v12-styles-replace-custom-property-shadow/transform.ts)
- [Polaris CDN adopts semantic versioning](https://shopify.dev/changelog/the-polaris-cdn-is-adopting-semantic-versioning)
- [Carbon: v11 migration](https://raw.githubusercontent.com/carbon-design-system/carbon/main/docs/migration/v11.md)
- [Carbon: versioning guide](https://github.com/carbon-design-system/carbon/blob/main/docs/guides/versioning.md)
- [Spectrum design data](https://github.com/adobe/spectrum-design-data)
- [Spectrum tokens README](https://github.com/adobe/spectrum-design-data/blob/main/packages/tokens/README.md)
- [Spectrum design data: evolution](https://github.com/adobe/spectrum-design-data/blob/main/packages/design-data-spec/spec/evolution.md)
- [Spectrum design data: diff](https://github.com/adobe/spectrum-design-data/blob/main/packages/design-data-spec/spec/diff.md)
- [GitLab Pajamas: UI kit breaking changes](https://design.gitlab.com/get-started/uik-breaking-changes/)
- [GitLab Pajamas: UI kit release notes](https://design.gitlab.com/get-started/uik-release-notes/)
- [GitLab Pajamas: design tokens authoring](https://design.gitlab.com/product-foundations/design-tokens-authoring/)
- [HashiCorp Helios: Figma components changelog](https://raw.githubusercontent.com/hashicorp/design-system/main/packages/components/CHANGELOG-FIGMA-COMPONENTS.md)
- [MUI Sync](https://mui.com/material-ui/design-resources/material-ui-sync/)
- [Semantic Versioning 2.0.0](https://semver.org/)
- [Fluent UI: change files](https://github.com/microsoft/fluentui/blob/master/docs/react-wiki-archive/Contributing/Change-Files.md)
- [USWDS: release process](https://github.com/uswds/uswds/wiki/Release-process)
- [Elastic EUI: props](https://github.com/elastic/eui/blob/main/wiki/contributing-to-eui/developing/props.md)
- [GOV.UK Frontend: versioning](https://github.com/alphagov/govuk-frontend/blob/main/docs/contributing/versioning.md)

### The toolkit's own tested rules

- `standards/snapshot-standard.md`, rule 20, and `GRADE_RULES` in `tools/snapshot/store.cjs`
- `knowledge/code/figma-handoff.md#what-a-component-contract-covers`

### Commentary and community reports

- [Figma forum: overrides broken after library publish](https://forum.figma.com/ask-the-community-7/component-overrides-get-broken-after-library-publish-27231)
- [Figma forum: nested variants reset after library update](https://forum.figma.com/ask-the-community-7/nested-variant-instances-within-a-component-are-reset-after-the-library-update-35195)
- [Figma forum: old mode name persists](https://forum.figma.com/report-a-problem-6/old-variable-mode-name-persists-after-change-37875)
- [Figma forum: clearing deleted variables](https://forum.figma.com/ask-the-community-7/how-to-clear-used-variables-that-don-t-exist-in-the-file-anymore-18616)
- [Figma forum: Code Connect variant matching stopped working](https://forum.figma.com/ask-the-community-7/code-connect-variant-matching-stopped-working-50728)
- [Figma forum: variable rounding error on export](https://forum.figma.com/ask-the-community-7/figma-variable-gets-exported-with-rounding-error-36573)
- [Code Connect issue 337](https://github.com/figma/code-connect/issues/337)
- [Nathan Curtis: visual breaking change in design systems](https://nathanacurtis.substack.com/p/visual-breaking-change-in-design-systems-1e9109fac9c4)
- [Nathan Curtis: versioning design systems](https://nathanacurtis.substack.com/p/versioning-design-systems-48cceb5ace4d)
- [Atlassian developer community: legacy library no longer supported](https://community.developer.atlassian.com/t/atlassian-design-system-library-no-longer-supported/93753)
