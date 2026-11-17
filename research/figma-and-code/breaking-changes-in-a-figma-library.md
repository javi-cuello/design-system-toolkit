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

A designer has twenty library buttons in a checkout flow, one with its background turned red. The maintainer renames the component and publishes; the designer accepts, and every button is still there, the red one included. Nothing was matched by name.

The [REST API](https://developers.figma.com/docs/rest-api/component-types/) defines a component's key as its unique identifier, and the same holds for sets, styles and variables. After a rename, the instance still points at the same key and picks up the new name. Overrides work the same way one level down: each is stored against a layer's identity, so the red background belongs to the background layer, not to the word "Bg".

Names come back in three operations:

- **Switching a variant.** Layer names in the current and the target variant must match, and a non-text override carries only where the property started out the same in both.
- **Swapping an instance** for another component. From the Instance menu, an override carries across only where the target has a layer of the same name; a swap dragged from the Assets panel keeps text overrides only ([Figma's help on applying changes to instances](https://help.figma.com/hc/en-us/articles/360039150733-Apply-changes-to-instances); [on swapping](https://help.figma.com/hc/en-us/articles/360039150413-Swap-components-and-instances)).
- **[Swap library](https://help.figma.com/hc/en-us/articles/4404856784663-Swap-libraries).** It matches components, styles and variables by name only.

Two more facts shape everything that follows. Updates are not pinned: the only way to stay on an older version is not to click. And publishing happens only from the main file, never from a [branch](https://help.figma.com/hc/en-us/articles/360063144053-Guide-to-branching), so a breaking change can't be trialled with consumers first. What Figma does offer, on Organization and Enterprise, is [library analytics](https://help.figma.com/hc/en-us/articles/360039238353-Track-library-and-component-usage): the files using each component or variant.

Treat keys as the contract and names as labels. **Before any risky change, open the library's analytics and list the files that use the component, so you can tell the people affected.**

The rest of this guide grades changes as **safe** (consumers see only the intended change), **risky** (something changes they didn't choose) or **breaking** (someone loses work, a build fails, or a page renders wrong).

---

## Renaming things

Renaming is safe inside Figma, provided layer names stay identical across a set's variants; outside Figma, every rename breaks whatever holds the old name as text.

Take a button set with `Size=Large` and `Size=Small`, and an instance on Large with three overrides: a text property set to "PROP", a text layer changed to "OVR", and a red background. In a test, renaming `Large` to `Lg`, or the property `Size` to `Scale`, kept all three.

That works because each variant is its own component with its own key, and `Size=Large` is only metadata on it; a property's generated suffix (`Text#1:0`) survives its rename. Layers held up too: renaming `Bg` to `Background` in both variants kept the red fill, and wrapping every `Note` layer in a new frame kept "OVR".

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

One layer's name in one variant decides whether the designer's text survives. It is the common failure, because variants are usually built by duplicating one and renaming layers in the copy.

Practice is more cautious, for good reason: Helios marks a layer restructure as breaking, and [forum reports](https://forum.figma.com/ask-the-community-7/component-overrides-get-broken-after-library-publish-27231) of overrides resetting are common. The tests ran inside one file, so they show the mechanism, not a guarantee across files.

Outside Figma the picture flips: a rename breaks anything holding the old name, such as a script calling `setProperties({ Size: 'Large' })`, Swap library, or a [Code Connect mapping](#code-connect-checks).

Renaming is safe in Figma and risky outside it. **Keep layer names identical across every variant of a set: when you duplicate a variant, rename nothing in the copy.** Treat every rename as a change to the code's interface (see [why a Figma rename breaks code](#renames-and-token-pipelines)), and never rename in the same release as a library swap. Which names to choose in the first place is [Naming inside a Figma component](../components-and-naming/naming-inside-figma-components.md).

---

## Deleting and retyping

Deleting a component orphans its instances quietly, and deleting or retyping a property wipes the values consumers set.

Back to the button's text property, set to "PROP" on a designer's instance. In a test, the maintainer deleted the property. The label went back to "Label", the component's default, with no warning to anyone.

Retyping does the same by a longer route. Figma's [Plugin API](https://developers.figma.com/docs/plugins/api/ComponentNode/) can't change a property's type, so turning a boolean into a variant is a deletion plus a creation with a new key, and every consumer lands on the new default.

Deleting a whole component is quieter still. Figma's help says it [doesn't remove its instances](https://help.figma.com/hc/en-us/articles/360038663154-Create-components-to-reuse-in-designs); they stay, unlinked, and the file looks fine until the next change fails to arrive.

All of these are breaking. **Deprecate instead of deleting: put "deprecated" in the name, point the description at the replacement, and remove it only when analytics show no remaining use.** For a property, add the new one alongside and remove the old in an announced breaking release.

---

## Defaults, nested instances, slots

A changed default value reaches every untouched instance, a repointed nested instance wipes overrides on it, and a deleted slot takes everything consumers put in it.

**Defaults.** An updated default value [shows wherever the instance has no override](https://help.figma.com/hc/en-us/articles/360039150733-Apply-changes-to-instances): change a label's default from "Button" to "Submit", and every untouched button in every consuming file changes. A new default *variant* only affects new insertions, since each placed instance points at its variant by key.

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

Helios hit this in production: its [February 2024 Figma changelog](https://raw.githubusercontent.com/hashicorp/design-system/main/packages/components/CHANGELOG-FIGMA-COMPONENTS.md) warned that repointing a nested link would revert consumers' text and icon changes.

**Slots.** [Slots](https://help.figma.com/hc/en-us/articles/38231200344599-Use-slots-to-build-flexible-components-in-Figma) hold content each consumer adds. In a test, a `Card` slot's three rectangles survived renaming the slot property and were lost when it was deleted.

Figma's [slot migration guide](https://help.figma.com/hc/en-us/articles/38607529833751-Migrate-a-library-to-using-slots) adds that overrides on the older placeholder pattern don't carry over when a library moves to slots.

Announce a changed default value as a visible change. **Treat a repointed nested instance as breaking, and where consumers are expected to change a nested instance, expose it as an instance swap property, which stores their choice on a stable key.** Remove a slot only in a breaking release, and migrate a library to slots as a new major version of each component.

---

## Moves, variables and styles

A component moves safely only through Figma's move flow; variables and modes survive a rename but not a deletion, a retype or a move; a deleted style detaches everywhere.

Start with a mode. A checkout screen is set explicitly to mode B of a colour collection, with a red card fill. In a test, deleting mode B left the frame silently resolving to the default: the fill went from red to blue, with no warning.

**Variables.** Bindings follow the key, so renaming a variable is safe for consumers. Deleting one is not. Locally, every property using it is disconnected; in consuming files the binding lingers as a ghost holding its last value, which the [REST API](https://developers.figma.com/docs/rest-api/variables/) marks `deletedButReferenced`.

A variable's type is fixed at creation, and moving it to another collection is a copy, so a retype or a move both produce a new key. Renaming a mode is safe, though [the old name can linger](https://forum.figma.com/report-a-problem-6/old-variable-mode-name-persists-after-change-37875) in the interface. And Figma [warns](https://help.figma.com/hc/en-us/articles/36346281624471-Extend-a-variable-collection) that the update introducing extended collections removes previously set variable modes from consumers' designs.

**Moves.** Cut, paste into the destination and publish with "Move to this file", and instances stay linked ([Figma's help on moving components](https://help.figma.com/hc/en-us/articles/4404848314647-Move-published-components)); a copy and paste creates new keys and strands every instance. Variables can't be moved between files at all.

Publish the destination before the source, as Pajamas does. And since Swap library matches by name only, anything renamed beforehand stays on the old library.

**Styles.** Objects using a deleted style keep their look and lose the link, which is why Polaris v12 deprecated its colour styles rather than deleting them when it moved to variables.

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

Why does the name travel at all? Figma's reference exporter, [`figma/variables-github-action-example`](https://github.com/figma/variables-github-action-example), names each file `${collection.name}.${mode.name}.json`, turns each variable name into a token path by splitting on `/`, and writes aliases as references to names. Its `$extensions` don't carry the variable's ID, and syncing back it matches by name, so a renamed token leaves its old variable behind. [Style Dictionary](https://styledictionary.com/reference/hooks/transforms/predefined/) then builds every output name from the path.

So collection, mode, group and variable names all become file names, custom properties or exports. Renaming a mode renames a file: `Theme.Light.json` becomes `Theme.Day.json`, and a `data-theme` selector keyed on the old name loses its theme. Spectrum shipped a major, tokens 15.0.0, for moving tokens between files with every value unchanged.

Code syntax is a separate trap. In a test, a variable with web code syntax `var(--c)` was renamed, and Dev Mode still printed `var(--c)`, so snippets point at the old name while an exporter ships the new one.

A rename that reaches exported names is breaking. **Treat exported names as a public API, and carry each variable's ID in `$extensions` so your pipeline can tell a rename from a deletion.** Keep the old name as a deprecated alias for at least one release, and lint for unknown custom properties, as Primer's [stylelint config](https://github.com/primer/stylelint-config) does. Update code syntax in the same change, and settle collection and mode names before the first export.

---

## Deletions and value changes

A deletion breaks every reference with nothing to migrate to, so the pipeline should throw; a value change breaks no API but is a visual change that needs review.

Delete `color/background/default` outright and the pipeline meets a reference to nothing. Whether it throws or merely logs is a Style Dictionary setting, [`log.errors.brokenReferences`](https://styledictionary.com/reference/logging/), though the [DTCG format](https://www.designtokens.org/tr/drafts/format/) requires tools to report it. A type change behaves like a deletion.

Value changes have shipped at all three levels:

- Primer's 11.10.0, a minor, changed `fgColor.done` in its colour-blind dark themes.
- Atlassian's 13.3.1, a patch, moved `color.border.accent.gray.subtle` from `Neutral300` to `Neutral400`.
- Polaris tokens 8.0.0, a major, updated shadow and type values alongside removing legacy tokens.

Alias retargets belong here too, and only a visual comparison catches them.

Exported numbers have their own noise: Figma stores 32-bit floats, so 0.8 exports as 0.800000011920929 ([forum report](https://forum.figma.com/ask-the-community-7/figma-variable-gets-exported-with-rounding-error-36573)), filling diffs with decimals that hide the real changes. And Figma's documentation gives timing variables' unit as milliseconds in the help centre and seconds in the Plugin API.

**Configure your pipeline to throw on broken references.** Version value changes as minor, list them in the release note, and catch them with visual regression rather than the type checker. Round every number at export, to four to six decimals, in one transform. Confirm the unit of timing variables before mapping them to a DTCG duration.

---

## Code Connect checks

Code Connect fails the publish on a renamed or deleted property, a renamed layer used by `figma.children` and a deleted node, but it doesn't check the values inside an enum mapping.

Take the rename that was safe in Figma: `Size=Large` to `Size=Lg`. The button's Code Connect file still reads:

```ts
figma.enum('Size', { Large: 'large', Small: 'small' })
```

There is no entry for `Lg`, and `figma connect publish` passes. The mapping is now quietly wrong for every large button.

The CLI checks on every publish that the properties, variant restrictions and `figma.children` layers a mapping names exist, and that the node is still a component. It doesn't check an enum's value keys, or `figma.instance` properties.

Silent failures have happened elsewhere too: in February 2026 variant restrictions [stopped matching](https://forum.figma.com/ask-the-community-7/code-connect-variant-matching-stopped-working-50728) while files still published without errors. Scripts keyed on layer names fail the same way ([MUI's Sync plugin](https://mui.com/material-ui/design-resources/material-ui-sync/) required unaltered layer names), and node IDs survive renames but not moves ([code-connect #337](https://github.com/figma/code-connect/issues/337)). A component rename doesn't break a mapping, because Code Connect connects by node URL.

Treat variant value renames as breaking for Code Connect. **Add your own check that every option of every mapped enum has an entry, since the CLI won't.** The fix for the button is one key, `{ Lg: 'large', Small: 'small' }`. Key scripts on component and property keys rather than layer names or node IDs.

---

## Versioning each change

Each change gets two versions, one for Figma files and one for code, because the two audiences disagree on the commonest change of all.

Picture a release whose only change is a variable rename. For designers it is nothing; for engineers it is a failed build. One version number has to call it a patch, which surprises the engineers, or a major, which stops designers for nothing.

[Semantic Versioning](https://semver.org/) gives the frame: major for incompatible changes to the public interface, minor for compatible additions and deprecations, patch for fixes. Design systems agree on the easy cases: Primer, Carbon, Polaris and Fluent call a new optional prop or component minor, and Primer and Carbon state the general form, a type made more generic is minor and one made more specific is major. Adding a variant option broadens the type; removing one narrows it.

Renames are where policy turns strict. [Fluent](https://github.com/microsoft/fluentui/blob/master/docs/react-wiki-archive/Contributing/Change-Files.md) lists API renames as major, [USWDS](https://github.com/uswds/uswds/wiki/Release-process) any renamed `.usa-` class, and [Elastic's EUI](https://github.com/elastic/eui/blob/main/wiki/contributing-to-eui/developing/props.md) a renamed prop. Every one of those policies is about code; for a Figma file, a rename is invisible.

Values split the other way. Code-side policies call them minor, as the [Polaris CDN](https://shopify.dev/changelog/the-polaris-cdn-is-adopting-semantic-versioning) does for visual refinements. [Pajamas](https://design.gitlab.com/get-started/uik-breaking-changes/) defines a breaking change as anything that would require a designer to act after updating, so a component whose size changed is breaking for it, because instances in fixed layouts reflow. Nathan Curtis argues the same from code: a change that alters what an adopter controls, such as text that now wraps, [breaks them whatever the version says](https://nathanacurtis.substack.com/p/visual-breaking-change-in-design-systems-1e9109fac9c4).

So both audiences get their own column. The toolkit grades every snapshot of a library for both audiences and stores the grade with the change (`standards/snapshot-standard.md`, rule 20; `GRADE_RULES` in `tools/snapshot/store.cjs`). The table below is what it runs.

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

Two rows are less obvious than they look. A component or layer rename is minor for code, since Code Connect connects by node. And a changed default variant is a patch for Figma files, since only new instances get it. No policy found names a default *value* change outright; Primer has shipped flipped defaults as minors with an upgrade caution. And print the grade first: on one project a run's first lines said BREAKING and the reader, looking at the last forty, missed it (`skills/design-code-parity/SKILL.md`, "Traps").

**Keep the two levels separate all the way to the release note, and let the higher one set the version number.** A release whose only major is a variable rename should say it is major for code and nothing for Figma files, so your designers don't stop work for it. Promote a value change to major for Figma files when it changes a component's size, and for code when it lowers contrast below the level your system promises.

---

## Retirement in practice

Real systems retire things in Figma by name, description and release note, with the old component kept beside the new; in code, by a deprecated alias, tooling that complains, and removal in a major with a replacement map.

Figma offers no versioning, pinning or deprecation flag, so retirement has to be said where a designer will look. **In Figma.** [GitLab Pajamas](https://design.gitlab.com/get-started/uik-release-notes/) appends "DEPRECATED" to the page, the component and its description, links the replacement, paints the deprecated page red, and keeps a new component version beside the old for at least one milestone when overrides would be lost. At library scale, Helios shipped version 2 as a new library, Carbon froze its "[v10 Deprecated]" kits from 30 September 2024, and Atlassian [froze its legacy library](https://community.developer.atlassian.com/t/atlassian-design-system-library-no-longer-supported/93753).

**In code**, the best systems run three stages and give each token a stable ID:

- **Primer** keeps `src/tokens/removed.json`, mapping every removed token to its replacement or `null`, with a CI script that fails on an undocumented removal, and keeps legacy names as deprecated aliases.
- **Atlassian** runs deprecated, then deleted (tooling errors wherever it is used), then removed in a major, enforced by [ESLint rules](https://atlassian.design/components/eslint-plugin-design-system/usage) with automatic fixes.
- **Spectrum** gives every token a `uuid` and a `renamed` field, so its [diff tool](https://github.com/adobe/spectrum-design-data/blob/main/packages/design-data-spec/spec/diff.md) recognises a rename where a plain diff sees a deletion and an addition.
- **Polaris** ships codemods per major and a stylelint plugin; **Carbon** published a [v11 table](https://raw.githubusercontent.com/carbon-design-system/carbon/main/docs/migration/v11.md) with a status per token.

Splits are the hardest migrations, because a token can't always be renamed one to one. Atlassian 7.0.0 shows every kind: `border.radius.050` became `radius.xsmall` (one to one), `border.width.outline` became `border.width.selected` or `border.width.focused` (one to many), and `border.radius.400` became the literal `16px`. Polaris v12 went [many to one](https://raw.githubusercontent.com/Shopify/polaris/main/polaris-migrator/src/migrations/v12-styles-replace-custom-property-shadow/transform.ts): two inset shadows became `--p-shadow-inset-200`.

The standard is catching up. The DTCG format defines `$deprecated` as `true`, `false` or an explanatory string, and its draft now says tools may treat an alias in the string, such as `{button.activeBorder}`, as a link to the replacement. As for how long a deprecation lasts, semver requires at least one minor before removal, Spectrum two, and Atlassian deprecates in a minor and removes in the next major.

**Deprecate in a minor and remove only in a major.** Keep old names working for at least two minors in code and one release cycle in Figma. Put `$deprecated` on the token with the replacement as an alias in its string, a stable ID in `$extensions`, and a CI check that refuses a removal without a recorded replacement. Ship a codemod for one-to-one renames and a table for the rest.

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

Your library is held together by keys, not names, so most renames are safe for the files that use it; tests confirmed it for variant values, properties, slot properties, variables and layers. What breaks those files is anything that replaces an identity or removes a place their work is stored: deleting or retyping a property, repointing a nested instance, deleting a slot or a mode, copying a component instead of moving it, and deleting a component. Names matter in three places: across a set's variants, on swaps, and in Swap library.

Code breaks on the opposite thing, names. Pipelines turn variable, collection and mode names into token paths and discard Figma's keys, so a rename harmless in Figma removes a custom property, and the CSS fails silently. Code Connect catches renamed properties and layers at publish, and lets a renamed variant value inside an enum mapping through without a word.

So give each release two levels. Removing or narrowing is major for both audiences, adding or deprecating is minor; a variable, property or option rename is a patch for Figma files and major for code; a size change is major for Figma files, because fixed layouts reflow. The toolkit computes both grades for every library snapshot. The systems that cope keep old names as deprecated aliases, remove only in a major with a replacement map, record a stable ID per token, and in Figma deprecate by name and description beside the new component.

---

## What to re-check later

Researched October 2026; re-checked November 2026.

- **Tested in one file.** Eleven behaviours no documentation states were tested on 1 October 2026 with local components in one scratch file; the publish and accept path was not. Layer rename and wrap are the two most worth re-testing across files.
- **Instance swaps.** The swap rule was re-read on Figma's help pages on 17 November 2026: matching layer names from the Instance menu, text only from the Assets panel. An earlier wording here said only text overrides survive any swap.
- **Not tested.** Tightening slot limits, hiding a published component or variable, Swap library after a rename, and what Code Connect renders for an unmapped enum value.
- **Code Connect validation.** Checked against the 2.0.1 source. The 2.1.0 release notes (26 October 2026), re-read in November 2026, list no validation change, but its source was not re-read.
- **DTCG.** Watch whether the alias-in-the-string convention for `$deprecated` (draft of 8 September 2026) becomes a dedicated replacement field.
- **Plans and slots.** Branching is on Organization and Enterprise, and library analytics on those plus Government and K-12 Education (plans and help pages, November 2026); slots, generally available since 10 June 2026, may still change.
- **Single sources.** Carbon's v10 freeze comes from search summaries; Figma's 2022 description of override keys was read only as a search summary, and the tests are consistent with it.
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
- [Help: Create components](https://help.figma.com/hc/en-us/articles/360038663154-Create-components-to-reuse-in-designs)
- [Help: Extend a variable collection](https://help.figma.com/hc/en-us/articles/36346281624471-Extend-a-variable-collection)
- [Help: Track library and component usage](https://help.figma.com/hc/en-us/articles/360039238353-Track-library-and-component-usage)
- [Help: Modes for variables](https://help.figma.com/hc/en-us/articles/15343816063383-Modes-for-variables)
- [Help: Create and manage variables and collections](https://help.figma.com/hc/en-us/articles/15145852043927-Create-and-manage-variables-and-collections)
- [Help: Variables in Dev Mode](https://help.figma.com/hc/en-us/articles/27882809912471-Variables-in-Dev-Mode)
- [Help: Guide to branching](https://help.figma.com/hc/en-us/articles/360063144053-Guide-to-branching)
- [Help: Figma plans and features](https://help.figma.com/hc/en-us/articles/360040328273-Figma-plans-and-features)
- [Plugin API: ComponentNode](https://developers.figma.com/docs/plugins/api/ComponentNode/)
- [Plugin API: InstanceNode](https://developers.figma.com/docs/plugins/api/InstanceNode/)
- [Plugin API: Variable](https://developers.figma.com/docs/plugins/api/Variable/)
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

**Primary: design systems and versioning policies**

- [Primer primitives repository](https://github.com/primer/primitives)
- [Primer stylelint config](https://github.com/primer/stylelint-config)
- [Primer React: versioning](https://github.com/primer/react/blob/main/contributor-docs/versioning.md)
- [Atlassian tokens changelog](https://unpkg.com/@atlaskit/tokens/CHANGELOG.md)
- [Atlassian: ESLint plugin usage](https://atlassian.design/components/eslint-plugin-design-system/usage)
- [Polaris: v12 shadow migration](https://raw.githubusercontent.com/Shopify/polaris/main/polaris-migrator/src/migrations/v12-styles-replace-custom-property-shadow/transform.ts)
- [Polaris CDN adopts semantic versioning](https://shopify.dev/changelog/the-polaris-cdn-is-adopting-semantic-versioning)
- [Carbon: v11 migration](https://raw.githubusercontent.com/carbon-design-system/carbon/main/docs/migration/v11.md)
- [Carbon: versioning guide](https://github.com/carbon-design-system/carbon/blob/main/docs/guides/versioning.md)
- [Spectrum design data](https://github.com/adobe/spectrum-design-data)
- [Spectrum tokens README](https://github.com/adobe/spectrum-design-data/blob/main/packages/tokens/README.md)
- [Spectrum design data: diff](https://github.com/adobe/spectrum-design-data/blob/main/packages/design-data-spec/spec/diff.md)
- [GitLab Pajamas: UI kit breaking changes](https://design.gitlab.com/get-started/uik-breaking-changes/)
- [GitLab Pajamas: UI kit release notes](https://design.gitlab.com/get-started/uik-release-notes/)
- [HashiCorp Helios: Figma components changelog](https://raw.githubusercontent.com/hashicorp/design-system/main/packages/components/CHANGELOG-FIGMA-COMPONENTS.md)
- [MUI Sync](https://mui.com/material-ui/design-resources/material-ui-sync/)
- [Semantic Versioning 2.0.0](https://semver.org/)
- [Fluent UI: change files](https://github.com/microsoft/fluentui/blob/master/docs/react-wiki-archive/Contributing/Change-Files.md)
- [USWDS: release process](https://github.com/uswds/uswds/wiki/Release-process)
- [Elastic EUI: props](https://github.com/elastic/eui/blob/main/wiki/contributing-to-eui/developing/props.md)

**The toolkit's own tested rules**

- `standards/snapshot-standard.md`, rule 20, and `GRADE_RULES` in `tools/snapshot/store.cjs`
- `knowledge/code/figma-handoff.md#what-a-component-contract-covers`
- `skills/design-code-parity/SKILL.md`, "Traps"

**Commentary and community reports**

- [Figma forum: overrides broken after library publish](https://forum.figma.com/ask-the-community-7/component-overrides-get-broken-after-library-publish-27231)
- [Figma forum: old mode name persists](https://forum.figma.com/report-a-problem-6/old-variable-mode-name-persists-after-change-37875)
- [Figma forum: Code Connect variant matching stopped working](https://forum.figma.com/ask-the-community-7/code-connect-variant-matching-stopped-working-50728)
- [Figma forum: variable rounding error on export](https://forum.figma.com/ask-the-community-7/figma-variable-gets-exported-with-rounding-error-36573)
- [Code Connect issue 337](https://github.com/figma/code-connect/issues/337)
- [Nathan Curtis: visual breaking change in design systems](https://nathanacurtis.substack.com/p/visual-breaking-change-in-design-systems-1e9109fac9c4)
- [Atlassian developer community: legacy library no longer supported](https://community.developer.atlassian.com/t/atlassian-design-system-library-no-longer-supported/93753)
