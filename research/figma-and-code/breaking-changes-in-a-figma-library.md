# What counts as a breaking change in a Figma library

Which library changes break designers' files, which break the code built from them, and what version each change deserves.

A maintainer renames the variable `color/bg/default` to `color/background/default` and publishes. Designers accept the update and notice nothing: every fill is still bound. The next morning the web build fails at an old import, and a page that built fine now has a transparent card background. In the same release, a deleted text property quietly reset every designer's custom label.

A Figma library has two audiences, and they break on opposite things. Designers' files break when an identity is replaced or a place holding their work is removed. Code breaks when a name changes.

---

## What this answers

- [The link to the library](#the-link-to-the-library): what holds a consumer's file to it
- [Renaming things](#renaming-things): whether a rename is safe
- [Deleting and retyping](#deleting-and-retyping): what a deletion or retype breaks
- [Defaults, nested instances, slots](#defaults-nested-instances-slots): what changing them does to consumers
- [Moves, variables and styles](#moves-variables-and-styles): how they break files
- [Renames and token pipelines](#renames-and-token-pipelines): why a Figma rename breaks code
- [Deletions and value changes](#deletions-and-value-changes): what breaks code besides a rename
- [Code Connect checks](#code-connect-checks): what Code Connect lets through
- [Versioning each change](#versioning-each-change): which version each change deserves
- [Retirement in practice](#retirement-in-practice): how real systems retire things

For a lookup, use the [cheat sheet](#cheat-sheet); [the short version](#the-short-version) is the whole guide in three paragraphs.

---

## The link to the library

A consumer's file is held to the library by keys, not names: components, sets, styles and variables each carry a key that survives a rename, and names matter in only three operations.

A designer has a checkout flow with twenty buttons from the library, and has turned one button's background red. The maintainer renames the component and publishes. The designer accepts the update, and every button is still there, the red one included. Nothing was matched by name.

The [REST API](https://developers.figma.com/docs/rest-api/component-types/) defines a component's key as its unique identifier, and the same holds for sets and styles. A plugin imports by key, never by name. Variables carry an `id` locally and a `key` for import. So after a rename, the designer's instance still points at the same key and simply picks up the new name.

Overrides work the same way one level down. Figma described the mechanism in 2022, when a bug corrupted it: each layer in an instance has a key, each override has a key, and an override applies when the two match. The designer's red background is stored against the background layer itself, not against the word "Bg".

Names come back in three operations, and each one returns later in this guide:

- **Switching a variant.** Layer names in the current and the target variant must match for overrides to carry across.
- **Swapping an instance** for another component. Only text overrides survive, matched by layer name.
- **[Swap library](https://help.figma.com/hc/en-us/articles/4404856784663-Swap-libraries).** It matches components, styles and variables by name only.

Two more facts shape everything that follows. Updates are not pinned: a consumer accepts or ignores each one, and the only way to stay on an older version is not to click. And publishing happens only from the main file, never from a [branch](https://help.figma.com/hc/en-us/articles/360063144053-Guide-to-branching) (branching itself needs an Organization or Enterprise plan), so a breaking change can't be trialled with consumers first.

What Figma does offer, on Organization and Enterprise, is [library analytics](https://help.figma.com/hc/en-us/articles/360039238353-Track-library-and-component-usage): inserts, detaches and the files using each component or variant, over periods from 30 days to a year.

Treat keys as the contract and names as labels, with those three operations as the exceptions. **Before any risky change, open the library's analytics and list the files that use the component, so you can tell the people affected.**

The rest of this guide grades every change on three levels. **Safe**: consumers notice nothing, or see exactly the intended change. **Risky**: nothing is lost, but something changes that consumers didn't choose. **Breaking**: someone loses work, a build fails, or a page renders the wrong thing.

---

## Renaming things

Renaming is safe inside Figma, provided layer names stay identical across a set's variants; outside Figma, every rename breaks whatever holds the old name as text.

Take a button set with `Size=Large` and `Size=Small`, and an instance on Large carrying three overrides: a text property set to "PROP", a plain text layer changed to "OVR", and the background fill changed to red. In a test, renaming `Large` to `Lg` moved the instance to `Size=Lg` with all three overrides intact. Renaming the property `Size` to `Scale` did the same.

That works because each variant is its own component with its own key, and `Size=Large` is only metadata on it. Text, boolean and swap properties carry a generated suffix (`Text#1:0`), and a rename changes only the part before the `#`.

Layers held up too. Renaming the background layer from `Bg` to `Background` in both variants kept the red fill. Wrapping every `Note` layer in a new auto layout frame kept "OVR".

Variant switching is where it gives way. Here is the same instance switched from Large to Small, once with matching layer names and once with the note layer renamed in Small only.

<svg role="img" viewBox="0 0 640 230" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0" font-family="system-ui, sans-serif">
<title>Switching an instance from Size=Large to Size=Small. Left: both variants name the layers Bg and Note, and the override KEEP? carries across. Right: the Small variant names the note layer Hint, and the override is lost; the layer shows its default text.</title>
<rect x="0" y="0" width="640" height="230" fill="#f7f6f2"/>
<text x="20" y="30" font-size="14" font-weight="600" fill="#1a1a1a">Names match</text>
<text x="330" y="30" font-size="14" font-weight="600" fill="#1a1a1a">Names differ</text>
<rect x="20" y="46" width="125" height="110" rx="8" fill="#ffffff" stroke="#c9c6bd"/>
<text x="34" y="70" font-size="13" font-weight="600" fill="#1a1a1a">Size=Large</text>
<text x="34" y="98" font-size="13" fill="#5a5850">Bg</text>
<text x="34" y="124" font-size="13" fill="#1a1a1a">Note: KEEP?</text>
<text x="166" y="96" font-size="11" fill="#5a5850" text-anchor="middle">switch</text>
<line x1="150" y1="104" x2="178" y2="104" stroke="#5a5850" stroke-width="1.5"/>
<polygon points="178,99 186,104 178,109" fill="#5a5850"/>
<rect x="188" y="46" width="125" height="110" rx="8" fill="#ffffff" stroke="#c9c6bd"/>
<text x="202" y="70" font-size="13" font-weight="600" fill="#1a1a1a">Size=Small</text>
<text x="202" y="98" font-size="13" fill="#5a5850">Bg</text>
<text x="202" y="124" font-size="13" fill="#1e7a3c">Note: KEEP?</text>
<text x="20" y="190" font-size="13" fill="#1e7a3c">Override carried: the names matched.</text>
<rect x="330" y="46" width="125" height="110" rx="8" fill="#ffffff" stroke="#c9c6bd"/>
<text x="344" y="70" font-size="13" font-weight="600" fill="#1a1a1a">Size=Large</text>
<text x="344" y="98" font-size="13" fill="#5a5850">Bg</text>
<text x="344" y="124" font-size="13" fill="#1a1a1a">Note: KEEP?</text>
<text x="476" y="96" font-size="11" fill="#5a5850" text-anchor="middle">switch</text>
<line x1="460" y1="104" x2="488" y2="104" stroke="#5a5850" stroke-width="1.5"/>
<polygon points="488,99 496,104 488,109" fill="#5a5850"/>
<rect x="498" y="46" width="125" height="110" rx="8" fill="#ffffff" stroke="#b3261e"/>
<text x="512" y="70" font-size="13" font-weight="600" fill="#1a1a1a">Size=Small</text>
<text x="512" y="98" font-size="13" fill="#5a5850">Bg</text>
<text x="512" y="124" font-size="13" fill="#b3261e">Hint: default</text>
<text x="330" y="190" font-size="13" fill="#b3261e">Override lost: no layer called Note.</text>
</svg>

The only difference is one layer's name in one variant, and it decides whether the designer's text survives. This is the common failure in practice, because variants are usually built by duplicating one and renaming layers in the copy.

Practice is more cautious than these results, for good reason. Helios marks a structural change to its Advanced Table as breaking because it alters the layer structure. Pajamas counts lost overrides as its highest tier short of a new library. And [forum reports](https://forum.figma.com/ask-the-community-7/component-overrides-get-broken-after-library-publish-27231) of overrides resetting after restructures are common.

> **Aside.** The tests ran inside one file, which applies the same main-component edit that a library update applies through publish and accept. They show the mechanism, not a guarantee across files.

Outside Figma the picture flips. A rename breaks anything holding the old name: a script calling `setProperties({ Size: 'Large' })`, Swap library looking for `Large` and finding `Lg`, a Code Connect mapping (see [what Code Connect lets through](#code-connect-checks)), and a parity mapping that names a layer.

Renaming is safe in Figma and risky outside it. **Keep layer names identical across every variant of a set: when you duplicate a variant, rename nothing in the copy.** Treat every rename as a change to the code's interface (see [why a Figma rename breaks code](#renames-and-token-pipelines)), and never rename in the same release as a library swap that depends on the old name. The naming rules themselves are in [Naming inside Figma components](../components-and-naming/naming-inside-figma-components.md).

---

## Deleting and retyping

Deleting a component orphans its instances quietly, and deleting or retyping a property wipes the values consumers set.

Back to the button's text property, set to "PROP" on a designer's instance. In a test, the maintainer deleted the property. The label went back to "Label", the component's default, with no warning to anyone.

Retyping does the same by a longer route. Figma's [Plugin API](https://developers.figma.com/docs/plugins/api/ComponentNode/) can't change a property's type: `editComponentProperty` changes only the name and the default. So turning a boolean into a variant is a deletion plus a creation with a new key, and every consumer lands on the new property's default. Deleting the only variant property deletes the whole set.

Deleting a whole component is quieter still. Figma's help says deleting a main component [doesn't remove its instances](https://help.figma.com/hc/en-us/articles/360038663154-Create-components-to-reuse-in-designs), and that the component can be restored from any of them. After the consumer accepts the update, the library panel lists the instance as removed; Figma support calls such instances partially synced. The file looks fine until the next change fails to arrive.

All of these are breaking. **Deprecate instead of deleting: put "deprecated" in the name, point the description at the replacement, and remove it only when analytics show no remaining use.** Never delete or retype a property in a minor release. Add the new property alongside, mark the old one deprecated, and remove it in an announced breaking release.

---

## Defaults, nested instances, slots

A changed default value reaches every untouched instance, a repointed nested instance wipes overrides on it, and a deleted slot takes everything consumers put in it.

**Defaults.** Figma's help says an updated default value [shows wherever the instance has no override](https://help.figma.com/hc/en-us/articles/360039150733-Apply-changes-to-instances). Change a label's default from "Button" to "Submit", and every untouched button in every consuming file changes on the next accepted update. The default *variant* is different: each placed instance points at a specific variant by key, so a new default variant only affects new insertions.

**Nested instances.** In a test, a button held an `Icon` instance on `Shape=Circle`, and the consumer had turned the icon's glyph green. The maintainer then swapped the nested icon, in both button variants, to `Shape=Square`. Here is what the consumer's button looked like before and after accepting.

<svg role="img" viewBox="0 0 640 170" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0" font-family="system-ui, sans-serif">
<title>A consumer's button before and after the maintainer repoints its nested icon. Before: a circle icon with a green glyph, the consumer's override. After: a square icon with a black glyph; the override is gone.</title>
<rect x="0" y="0" width="640" height="170" fill="#f7f6f2"/>
<text x="20" y="30" font-size="14" font-weight="600" fill="#1a1a1a">Before: Icon on Shape=Circle</text>
<text x="340" y="30" font-size="14" font-weight="600" fill="#1a1a1a">After: Icon on Shape=Square</text>
<rect x="20" y="50" width="200" height="56" rx="8" fill="#ffffff" stroke="#c9c6bd"/>
<circle cx="52" cy="78" r="16" fill="#e6e3da"/>
<rect x="45" y="71" width="14" height="14" rx="2" fill="#1e7a3c"/>
<text x="80" y="83" font-size="14" fill="#1a1a1a">Button</text>
<text x="20" y="140" font-size="13" fill="#1e7a3c">Glyph override: green</text>
<line x1="250" y1="78" x2="300" y2="78" stroke="#5a5850" stroke-width="1.5"/>
<polygon points="300,73 308,78 300,83" fill="#5a5850"/>
<rect x="340" y="50" width="200" height="56" rx="8" fill="#ffffff" stroke="#b3261e"/>
<rect x="356" y="62" width="32" height="32" rx="3" fill="#e6e3da"/>
<rect x="365" y="71" width="14" height="14" rx="2" fill="#1a1a1a"/>
<text x="400" y="83" font-size="14" fill="#1a1a1a">Button</text>
<text x="340" y="140" font-size="13" fill="#b3261e">Glyph back to default: black</text>
</svg>

The icon changed shape, as intended, but the green went too, even though the glyph layer had the same name in both icon variants. Replacing a nested instance gives its layers new identities, so the stored override has nothing left to match.

Helios hit this in production. Its [February 2024 Figma changelog](https://raw.githubusercontent.com/hashicorp/design-system/main/packages/components/CHANGELOG-FIGMA-COMPONENTS.md) warned that moving a nested link to its secondary variant would revert consumers' text and icon changes, and told teams to annotate their work before accepting.

**Slots.** [Slots](https://help.figma.com/hc/en-us/articles/38231200344599-Use-slots-to-build-flexible-components-in-Figma), generally available since June 2026, hold content each consumer adds. In a test, a `Card` with three rectangles in a consumer's slot kept all three when the slot property was renamed from `Slot` to `Body`, and lost all three when it was deleted. Figma's help calls deletion a destructive action.

Figma's [slot migration guide](https://help.figma.com/hc/en-us/articles/38607529833751-Migrate-a-library-to-using-slots) adds that overrides on the older placeholder-component pattern don't carry over when a library moves to slots. Tightening a slot's limits couldn't be tested. The API reports breaches through `limitViolations`, which implies content is flagged rather than removed.

Announce a changed default value as a visible change. **Treat a repointed nested instance as breaking, and where consumers are expected to change a nested instance, expose it as an instance swap property, which stores their choice on a stable key.** Remove a slot only in a breaking release, and migrate a library to slots as a new major version of each component.

---

## Moves, variables and styles

A component moves safely only through Figma's move flow; variables and modes survive a rename but not a deletion, a retype or a move; a deleted style detaches everywhere.

Start with a mode. A designer's checkout screen is set explicitly to mode B of a colour collection, with a red card fill. In a test, the maintainer deleted mode B. The frame kept a reference to the missing mode and silently resolved to the default: the fill went from red to blue, with no warning.

**Variables.** Bindings follow the key, so renaming a variable is safe for consumers. Deleting one is not. Locally, every property using it is disconnected; in consuming files the binding lingers as a ghost holding its last value, which the [REST API](https://developers.figma.com/docs/rest-api/variables/) marks `deletedButReferenced`.

A variable's type is fixed at creation, and moving it to another collection is a copy, so a retype or a move both produce a new key. Renaming a mode is safe, though [forum reports](https://forum.figma.com/report-a-problem-6/old-variable-mode-name-persists-after-change-37875) show the old name can linger in the interface.

Two changes look harmless and aren't. Retargeting an alias changes the value everywhere on the next update, with nothing to review but the colour. And Figma [warns](https://help.figma.com/hc/en-us/articles/36346281624471-Extend-a-variable-collection) that accepting the update which introduces extended collections removes previously set variable modes from consumers' designs.

**Moves.** Cut the component, paste it into the destination file and publish with "Move to this file", and instances stay linked ([Figma's help on moving components](https://help.figma.com/hc/en-us/articles/4404848314647-Move-published-components)). A copy and paste creates new keys and strands every instance. Styles have their own move; variables can't be moved between files at all.

Pajamas adds an ordering rule: publish the destination before the source. And since Swap library, the usual end of a split or merge, matches by name only, anything renamed beforehand stays on the old library.

**Styles.** Objects using a deleted style keep their look and lose the link. A style's folder is part of its name. There is no path from a style to a variable, so when Polaris v12 replaced its colour styles with variables, it deprecated the styles rather than deleting them.

Move components through the move flow, publish the destination first, and freeze renames in any release that includes a library swap. **Treat deleting, retyping or moving a variable, deleting a mode and deleting a style as breaking: deprecate first, migrate, then remove.**

---

## Renames and token pipelines

A Figma rename breaks code because most token pipelines turn Figma names into code names and throw away Figma's stable identifiers on the way.

Go back to the opening rename, `color/bg/default` to `color/background/default`. Harmless in Figma. In code, the TypeScript build fails at the old import, which is the good outcome. The CSS doesn't fail at all.

```css
/* after the rename, nothing defines --color-bg-default (illustrative) */
.card { background: var(--color-bg-default); }
```

An invalid `var()` falls back to the property's initial or inherited value ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Cascading_variables/Using_custom_properties)), so the card's background turns transparent with no error anywhere.

Why does the name travel at all? Figma's reference exporter, [`figma/variables-github-action-example`](https://github.com/figma/variables-github-action-example), names each output file `${collection.name}.${mode.name}.json`. It turns each variable name into a token path by splitting on `/`, and writes aliases as references to the target's name. Its `$extensions` carry `hiddenFromPublishing`, `scopes` and `codeSyntax`, but not the variable's ID.

Syncing the other way, the same example "will look for existing collections and variables by name". It creates a variable where no name matches and deletes none, so a renamed token leaves its old variable behind. [Style Dictionary](https://styledictionary.com/reference/hooks/transforms/predefined/) then builds every output name from the path: `color/background/button/primary/active` becomes `color-background-button-primary-active` or `colorBackgroundButtonPrimaryActive`.

So collection, mode, group and variable names all become file names, custom properties or exports. Renaming a mode renames a file: `Theme.Light.json` becomes `Theme.Day.json`, and any loader or `data-theme` selector keyed on the old name loses its theme. Spectrum takes this seriously enough to have shipped a major, tokens 15.0.0, for moving tokens between files with every value unchanged, because consumers importing a specific path would break.

Code syntax is a separate trap. In a test, a variable with web code syntax `var(--c)` was renamed to `color/renamed`, and Dev Mode still printed `var(--c)`. A team that renames without updating code syntax ships snippets pointing at the old name, while an exporter that reads names ships the new one.

The toolkit's projects take the opposite route on purpose. Tokens are generated under Figma's own names, and a component's contract can be stored keyed by its Figma component key, so a rename in Figma keeps its contract (`knowledge/code/figma-handoff.md#what-a-component-contract-covers`).

A rename that reaches exported names is breaking. **Treat exported names as a public API, and carry each variable's ID in `$extensions` so your pipeline can tell a rename from a deletion.** Keep the old name as a deprecated alias for at least one release. Lint for unknown custom properties, as Primer's [stylelint config](https://github.com/primer/stylelint-config) does with `csstools/value-no-unknown-custom-properties` against its own token files. Update code syntax in the same change, and settle collection and mode names before the first export.

---

## Deletions and value changes

A deletion breaks every reference with nothing to migrate to, so the pipeline should throw; a value change breaks no API but is a visual change that needs review.

Delete `color/background/default` outright and the pipeline meets a reference to nothing. What happens next is a setting. Style Dictionary decides through [`log.errors.brokenReferences`](https://styledictionary.com/reference/logging/), which can throw or merely log. The [DTCG format](https://www.designtokens.org/tr/drafts/format/) requires tools to report a reference whose target doesn't exist. A type change behaves like a deletion: the replacement gets a new ID, and a type-aware transform may emit a different unit.

Value changes are where systems disagree. The same kind of change has shipped at all three levels:

- Primer's 11.10.0, a minor, changed `fgColor.done` in its colour-blind dark themes.
- Atlassian's 13.3.1, a patch, moved `color.border.accent.gray.subtle` from `Neutral300` (`#DDDEE1`) to `Neutral400` (`#B7B9BE`).
- Polaris tokens 8.0.0, a major, updated shadow, font size and weight values alongside removing legacy tokens.

Alias retargets belong here too, and only a visual comparison catches them.

Exported numbers have their own noise. Figma stores numbers as 32-bit floats, so 0.8 exports as 0.800000011920929, while the interface rounds to two decimals and nobody sees it ([forum report](https://forum.figma.com/ask-the-community-7/figma-variable-gets-exported-with-rounding-error-36573)). It breaks nothing by itself. It produces subpixel values and diffs full of changed decimals that hide the real changes, which is why Primer patched its pipeline to round pixel values.

Timing variables have a quieter problem: Figma's documentation disagrees with itself on their unit, milliseconds in the help centre and seconds in the Plugin API type.

**Configure your pipeline to throw on broken references.** Version value changes as minor, list them in the release note, and catch them with visual regression rather than the type checker. Round every number at export, to four to six decimals, in one transform. Confirm the unit of timing variables before mapping them to a DTCG duration.

---

## Code Connect checks

Code Connect fails the publish on a renamed or deleted property, a renamed layer used by `figma.children` and a deleted node, but it doesn't check the values inside an enum mapping.

Take the rename that was safe in Figma: `Size=Large` to `Size=Lg`. The button's Code Connect file still reads:

```ts
figma.enum('Size', { Large: 'large', Small: 'small' })
```

There is no entry for `Lg`, and `figma connect publish` passes. The mapping is now quietly wrong for every large button.

The CLI validates on every publish unless `--skip-validation` is passed. It checks that properties used by `figma.string`, `figma.boolean` and `figma.enum` exist, that variant restriction keys and values exist, that layers named in `figma.children` exist, and that the node is still a top-level component or set. It doesn't check an enum's value mapping keys, or `figma.instance` properties.

Silent failures have happened elsewhere too. In February 2026 variant restrictions [stopped matching](https://forum.figma.com/ask-the-community-7/code-connect-variant-matching-stopped-working-50728) while files still published without errors, until Figma fixed it. Since 17 August 2026 the framework-specific parsers are unmaintained, and template files are the supported path.

Scripts keyed on layer names fail the same way. [MUI's Sync plugin](https://mui.com/material-ui/design-resources/material-ui-sync/) required that the kit's layer hierarchy and names stay unaltered, and was suspended in 2024. Node IDs survive renames but not recreation or moves; a [Code Connect issue](https://github.com/figma/code-connect/issues/337) records a publish pointing at a node that had moved.

A component rename, by contrast, doesn't break a mapping, because Code Connect connects by node URL rather than by name.

Treat variant value renames as breaking for Code Connect. **Add your own check that every option of every mapped enum has an entry, since the CLI won't.** The fix for the button is one key, `{ Lg: 'large', Small: 'small' }`. Key scripts on component and property keys rather than layer names or node IDs, and where a script must use a layer name, list it in the component's description as part of its interface.

---

## Versioning each change

Each change gets two versions, one for Figma files and one for code, because the two audiences disagree on the commonest change of all.

Picture a release whose only change is a variable rename. For designers it is nothing: bindings follow the key. For engineers it is a failed build. A single version number has to call it either a patch, which surprises the engineers, or a major, which stops designers for nothing.

[Semantic Versioning](https://semver.org/) gives the frame: major for incompatible changes to the public interface, minor for compatible additions and for marking something deprecated, patch for compatible fixes. Design systems agree on the easy cases. Primer, Carbon, Polaris and Fluent call a new optional prop or a new component minor.

Primer and Carbon state the general form: a type made more generic is minor, and one made more specific is major. That covers variant options, since adding one broadens the type and removing one narrows it. Fluent alone names a new required prop major, the same rule seen from the consumer who must now supply something.

Renames are where policy turns strict. [Fluent](https://github.com/microsoft/fluentui/blob/master/docs/react-wiki-archive/Contributing/Change-Files.md) lists API renames as major. [USWDS](https://github.com/uswds/uswds/wiki/Release-process) treats renaming any `.usa-` class as major. [Elastic's EUI](https://github.com/elastic/eui/blob/main/wiki/contributing-to-eui/developing/props.md) says renaming a prop is breaking, and Primer treats renaming a `data-component` value as major. Spectrum alone lets a typo-fix rename ship as a patch; its normal path is a rename with the old name kept as a deprecated alias, then removed in a major.

Every one of those policies is about code. For a Figma file, a rename is invisible.

Values split the other way. Code-side policies call them minor: Spectrum lists intentional value changes under minor, and the [Polaris CDN](https://shopify.dev/changelog/the-polaris-cdn-is-adopting-semantic-versioning) puts visual refinements in minors. Figma-kit policies call some of them breaking. [Pajamas](https://design.gitlab.com/get-started/uik-breaking-changes/) defines a breaking change as anything that would require a designer to act after updating, and puts a component whose size changed in its medium tier, because instances in fixed layouts reflow. Helios labelled a spacing fix in its kit as breaking.

Nathan Curtis argues the same from code. A change contained inside a component is safe, while one that alters what an adopter controls (contrast against their background, text that now wraps) [breaks them whatever the version says](https://nathanacurtis.substack.com/p/visual-breaking-change-in-design-systems-1e9109fac9c4).

Put as one rule, both audiences get their own column. The toolkit grades every snapshot of a library for both audiences and stores the grade with the change (`standards/snapshot-standard.md`, rule 20; `GRADE_RULES` in `tools/snapshot/store.cjs`). The table below is what it runs.

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

Two rows are less obvious than they look. A component or layer rename is minor for code, not major: Code Connect connects by node, so only what finds the component or layer by name needs the new one. And a changed default variant is a patch for Figma files and minor for code, since only new instances get it and code defaults should follow.

No policy found names a default *value* change outright. Primer has shipped flipped defaults as minors with an upgrade caution, so minor for both, announced, is the reading that matches shipped practice.

The toolkit's one operational lesson about the grade itself is to print it first. On one project a run's first lines said BREAKING, with six renamed tokens, and the reader looked at the last forty lines and missed it (`skills/design-code-parity/SKILL.md`, "Traps").

**Keep the two levels separate all the way to the release note, and let the higher one set the version number.** A release whose only major is a variable rename should say it is major for code and nothing for Figma files, so your designers don't stop work for it. Promote a value change to major for Figma files when it changes a component's size, and for code when it lowers contrast below the level your system promises.

---

## Retirement in practice

Real systems retire things in Figma by name, description and release note, with the old component kept beside the new; in code, by a deprecated alias, tooling that complains, and removal in a major with a replacement map.

Figma offers no versioning, no pinning and no deprecation flag. Whatever a team does to retire a component, it has to say it in places a designer will look.

**In Figma.** [GitLab Pajamas](https://design.gitlab.com/get-started/uik-release-notes/) appends a warning-sign emoji and "DEPRECATED" to the page, the component and its description, links the replacement, paints the deprecated page red (`#FDD4CD`), and announces the change at a weekly design meeting. Its four tiers make "breaking" practical:

- **Low**: an internal change, such as auto layout replacing a spacer.
- **Medium**: size changes that need validation.
- **High**: lost overrides; a new component version is kept beside the old for at least one milestone.
- **Extreme**: a new library file.

Others follow the same pattern at library scale. Helios keeps a Figma changelog with Breaking changes headings and shipped version 2 as a new library. Carbon renamed its v10 kits "[v10 Deprecated]" and froze them from 30 September 2024. Atlassian [froze its legacy library](https://community.developer.atlassian.com/t/atlassian-design-system-library-no-longer-supported/93753) and moved work to a new one.

**In code**, the best systems run three stages and give each token a stable ID:

- **Primer** keeps `src/tokens/removed.json`, mapping every removed token to its replacement or `null`, with a CI script that fails "token(s) removed but not documented". It uses the DTCG `$deprecated` and keeps legacy names as deprecated aliases (`color-fg-default` became `fgColor-default`), though renames and removals have shipped in minors and patches.
- **Atlassian** runs deprecated, then deleted (the token exists but tooling errors wherever it is used), then removed in a major, enforced by two [ESLint rules](https://atlassian.design/components/eslint-plugin-design-system/usage) with automatic fixes.
- **Spectrum** gives every token a `uuid` plus `deprecated`, `deprecated_comment` and `renamed`, so its [diff tool](https://github.com/adobe/spectrum-design-data/blob/main/packages/design-data-spec/spec/diff.md) recognises a rename where a plain diff sees a deletion and an addition.
- **Polaris** ships codemods per major (`v9-*` to `v14-*`) and a stylelint plugin.
- **Carbon** published a [v11 table](https://raw.githubusercontent.com/carbon-design-system/carbon/main/docs/migration/v11.md) with a status per token, and kept a `v10` export.
- **Pajamas** marks `"$deprecated": true` and moves fully deprecated files to `deprecated.*.json`.

Splits are the hardest migrations, because a token can't always be renamed one to one. Atlassian 7.0.0 shows every kind. `border.radius.050` became `radius.xsmall` (one to one). `border.width.outline` became `border.width.selected` or `border.width.focused` (one to many). `border.radius.400` became the literal `16px` (no token at all).

Carbon's `hover-ui` split three ways, into `layer-hover-01`, `field-hover-01` and `background-hover`. Polaris v12 went [many to one](https://raw.githubusercontent.com/Shopify/polaris/main/polaris-migrator/src/migrations/v12-styles-replace-custom-property-shadow/transform.ts): `--p-shadow-inset-lg` and `--p-shadow-inset-md` both became `--p-shadow-inset-200`.

The standard is catching up. The DTCG format defines `$deprecated` as `true`, `false` or an explanatory string, on tokens and groups. It still has no dedicated replacement field, but its draft now says tools may treat an alias in the string, such as `{button.activeBorder}`, as a link to the replacement. That is the first standard hook for a machine-readable replacement.

As for how long a deprecation lasts, semver requires one to ship in at least one minor before removal. Spectrum requires two minors. Atlassian runs deprecated in a minor, soft-deleted in the next, and removed in the next major. Pajamas keeps a deprecated Figma component for at least one milestone. In Figma, a deprecation is only as visible as its name, description and release note.

**Deprecate in a minor and remove only in a major.** Keep old names working for at least two minors in code and one release cycle in Figma, with your tooling complaining in between. Put `$deprecated` on the token with the replacement as an alias in its string, a stable ID in `$extensions`, and a CI check that refuses a removal without a recorded replacement. Classify every renamed token as one to one, one to many, many to one or removed; ship a codemod for the first and a table for the rest.

---

## Cheat sheet

| Change | Figma files | Code | Safer path |
|---|---|---|---|
| Rename component, option, property (tested) | safe | Code Connect enum misses renamed options; scripts stop matching | your own enum coverage check |
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

## The short version

Your library is held together by keys, not names. Components, variants, styles and variables each have a key that survives renaming, and consumers' overrides are stored against layer identity, so most renames are safe for the files that use your library. Tests confirmed it for variant values, variant properties, slot properties, variables and layers, including wrapping a layer in a new frame. What breaks those files is anything that replaces an identity or removes a place their work is stored: deleting or retyping a property, repointing a nested instance, deleting a slot or a mode, copying a component instead of moving it, and deleting a component, which strands its instances quietly. Names matter in three places: across a set's variants, on swaps, and in Swap library.

Code breaks on the opposite thing, names. Pipelines turn variable, collection and mode names into token paths and file names and discard Figma's keys, so a rename that's harmless in Figma removes a custom property, and the CSS fails silently. Code syntax doesn't follow a rename. Code Connect catches renamed properties and layers at publish, and lets a renamed variant value inside an enum mapping through without a word.

So give each release two levels. Removing or narrowing is major for both audiences, adding or deprecating is minor, and a moved value is minor; a variable, property or option rename is a patch for Figma files and major for code; a size change is major for Figma files, because fixed layouts reflow. The toolkit grades every library snapshot this way and stores the grade, which shows the two levels can be computed rather than argued. The systems that cope keep old names as deprecated aliases, make tooling complain, remove only in a major with a replacement map, and record a stable ID per token. In Figma, they deprecate by name and description, keep the old component published beside the new one, and ship anything enormous as a new library.

---

## What to re-check later

Researched October 2026; re-checked November 2026.

- **How it was checked.** Figma mechanics against the Plugin API and REST documentation, the help centre and staff answers on Figma's forum. Pipeline behaviour against Figma's own variables export example, the Code Connect source, Style Dictionary, Tokens Studio and the DTCG format. Practice from each system's changelogs, migration maps and contribution guides (Primer, Atlassian, Polaris, Carbon, Spectrum, GitLab Pajamas and HashiCorp Helios) and from published versioning policies.
- **Tested in one file.** Eleven behaviours no documentation states were tested on 1 October 2026 with local components in one scratch file; the publish and accept path itself was not. Layer rename and wrap are the two most worth re-testing across files, since practitioners and Helios treat restructures as breaking.
- **Not tested.** Tightening slot limits, hiding a published component or variable, Swap library after a rename, and what Code Connect renders for an unmapped enum value.
- **Code Connect validation.** Checked against the 2.0.1 source. The 2.1.0 release notes (26 October 2026), re-read in November 2026, list no validation change, but its source was not re-read.
- **DTCG.** `$deprecated` was re-read in the 2025.10 report and the draft of 8 September 2026 in November 2026. Watch whether the alias-in-the-string convention becomes a dedicated replacement field.
- **Plans.** Branching and library analytics on Organization and Enterprise, per Figma's plans page as re-read in November 2026.
- **Slots.** Generally available since 10 June 2026; their API and limits may still change.
- **The toolkit's grades.** Running the toolkit's two-audience table corrected two rows of this guide's first draft: a component or layer rename is minor for code (not major), and a changed default variant is a patch for Figma files and minor for code.
- **Single sources.** Carbon's v10 freeze and Twilio Paste's Figma conventions come from search summaries; Figma's 2022 description of override keys was read only as a search summary, and the tests are consistent with it.
- **No user research** on breaking changes in Figma libraries was found.

---

## Sources

**Primary: Figma**

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

**Primary: specifications and tools**

- [DTCG Format, draft of 8 September 2026](https://www.designtokens.org/tr/drafts/format/)
- [MDN: using CSS custom properties](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Cascading_variables/Using_custom_properties)
- [Style Dictionary: predefined transforms](https://styledictionary.com/reference/hooks/transforms/predefined/)
- [Style Dictionary: logging](https://styledictionary.com/reference/logging/)
- [Tokens Studio: edit token names](https://docs.tokens.studio/manage-tokens/token-names/edit)

**Primary: design systems and versioning policies**

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

**The toolkit's own tested rules**

- `standards/snapshot-standard.md`, rule 20, and `GRADE_RULES` in `tools/snapshot/store.cjs`
- `knowledge/code/figma-handoff.md#what-a-component-contract-covers`
- `skills/design-code-parity/SKILL.md`, "Traps"

**Commentary and community reports**

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
