# Token taxonomy across systems

How shipping design systems name their tokens, slot by slot, and what kept a taxonomy working or broke it: the order of a name's segments, the words for property, role, intensity and state, focus, inverse and on-colour, palette and scale naming, borders, elevation and the non-colour categories, and the renames that show what failed. It is the evidence a project reads before it proposes its own taxonomy; the project's choice goes in its context document. The tiers, how a token reaches CSS and themes in code are [tokens.md](tokens.md)'s, which owns the build, and the toolkit's own component-token grammar is figma-standard rule 49 (worked through in [tokens: component token names](tokens.md#component-token-names-worked-through)). The design side is [visual: colour roles](../ui/design/visual.md#colour-roles-and-semantics), [surfaces and elevation levels](../ui/design/visual.md#surfaces-and-elevation-levels) and [visual states of controls](../ui/design/visual.md#visual-states-of-controls).

Every name below is verbatim from the system's built token file at the version linked, or from the linked document, opened 2026-11-18. Counts are by script over that file and approximate.

## Name grammar and segment order

**What good looks like**
- [strong] A name is built from named slots in a written order, and the order is published. Polaris v11 writes `--p-color-[element]-[role]-[variant]-[state]` with the element closed to `bg`, `text`, `border`, `icon` ([Polaris v11 colour](https://github.com/Shopify/polaris/blob/main/polaris.shopify.com/content/previous-releases/version-11-color.mdx)); Primer's ADR-006 writes `prefix-namespace-pattern-variant-property-variant-scale` ([ADR-006](https://github.com/primer/primitives/blob/main/contributor-docs/adrs/adr-006-naming-design-tokens.md)); Fluent's pipeline writes `Set.name.part.property.state` for alias tokens ([Fluent token pipeline, naming](https://microsoft.github.io/fluentui-token-pipeline/naming.html)); PatternFly writes `--pf-t--[scope]--[component]--[property]--[concept]--[variant]--[state]`, "general to specific", skipping what does not apply ([PatternFly tokens](https://github.com/patternfly/patternfly-org/blob/main/packages/documentation-site/patternfly-docs/content/foundations-and-styles/design-tokens/tokens.md)); Cloudscape documents Category > Type > Item > State ([Cloudscape, design tokens](https://cloudscape.design/foundation/visual-foundation/design-tokens/)); NL Design System fixes `prefix.block.element.modifier.property` ([NL Design System, design tokens](https://github.com/nl-design-system/documentatie/blob/main/docs/handboek/huisstijl-vastleggen/design-tokens.mdx)).
- [strong] At the semantic tier the property comes before the role in 15 or more systems, unrelated ones included: Atlassian `color.background.danger.bold`, Polaris `--p-color-bg-fill-critical`, Primer `bgColor-danger-emphasis`, Paste `color-background-error-strong`, Workday `--cnvs-sys-color-bg-critical-softest`, GitLab `--gl-text-color-subtle`, Equinor `--eds-color-bg-danger-fill-emphasis-hover` ([Atlassian light](https://cdn.jsdelivr.net/npm/@atlaskit/tokens@20.14.0/dist/cjs/artifacts/tokens-raw/atlassian-light.js); [Polaris CSS](https://cdn.jsdelivr.net/npm/@shopify/polaris-tokens@9.4.2/dist/css/styles.css); [Primer light](https://cdn.jsdelivr.net/npm/@primer/primitives@11.10.0/dist/css/functional/themes/light.css); [Paste](https://cdn.jsdelivr.net/npm/@twilio-paste/design-tokens@10.15.0/dist/tokens.custom-properties.css); [Canvas system](https://cdn.jsdelivr.net/npm/@workday/canvas-tokens-web@4.5.1/css/system/_variables.css); [GitLab](https://cdn.jsdelivr.net/npm/@gitlab/ui@141.1.0/src/tokens/build/css/tokens.css); [Equinor](https://cdn.jsdelivr.net/npm/@equinor/eds-tokens@2.3.2/build/css/color/color-scheme/light-semantic-trimmed.css)). HashiCorp Helios 6.0.0 renamed `--token-color-foreground-primary` to `--hds-foreground-color-primary` "to align with the approved nomenclature", putting the property first ([Helios 6.0.0 migration](https://github.com/hashicorp/design-system/blob/main/packages/tokens/MIGRATION-6.0.0.md)).
- [strong] The state goes last in Atlassian, Polaris, Fluent, Codex, PatternFly and GitLab (table below). Exceptions: Gestalt's VR theme puts it first (`--sema-color-hover-background-neutral-default`, [Gestalt VR](https://cdn.jsdelivr.net/npm/gestalt-design-tokens@177.0.12/dist/css/vr-theme/variables.css)); Spectrum lists 185 "state-position" names among 272 it says "cannot be deterministically generated" from its own name model ([naming-exceptions.json](https://cdn.jsdelivr.net/npm/@adobe/spectrum-tokens@15.7.0/naming-exceptions.json)); Material Web puts the state before the part (`--md-filled-button-hover-label-text-color`).
- [moderate] **Role first, for systems that generate their palette from a seed.** Material (`on-primary-container`, [Material Web sys colour](https://cdn.jsdelivr.net/npm/@material/web@2.5.0/tokens/versions/latest/sass/_md-sys-color.scss)), Ant Design (`colorErrorBgFilledHover`, [Ant colour map](https://cdn.jsdelivr.net/npm/antd@6.7.1/es/theme/interface/maps/colors.d.ts)), Fluent (`colorStatusDangerBackground3Hover`, [Fluent light palette](https://cdn.jsdelivr.net/npm/@fluentui/tokens@1.0.0-alpha.24/lib/alias/lightColorPalette.js)) and SAP (`--sapButton_Accept_Selected_Hover_BorderColor`, property last, [SAP Horizon](https://cdn.jsdelivr.net/npm/@sap-theming/theming-base-content@11.36.5/content/Base/baseLib/sap_horizon/css_variables.css)) put the role first; Ant splits within one system, neutrals property-first (`colorTextTertiary`) and intents role-first.
- [weak] **The name as structured data.** Spectrum's taxonomy spec defines a name object of fields (component, anatomy, object, property, size, density, state and more), checks values against registries of terms, makes `property` required and calls serialisation order "cosmetic" ([Spectrum taxonomy](https://opensource.adobe.com/spectrum-design-data/spec/taxonomy/)). It also pins a `legacyKey` so re-keying 123 and about 315 tokens to the model kept the published names ([Spectrum changelog](https://cdn.jsdelivr.net/npm/@adobe/spectrum-tokens@15.7.0/CHANGELOG.md)).
- [weak] **Modifier kinds in a fixed order.** NL Design System orders appearance (`primary`, `subtle`), then component state (`checked`, `disabled`, `invalid`), then user action (`hover`, `focus-visible`, `active`): `large.checked.active` ([NL design tokens](https://github.com/nl-design-system/documentatie/blob/main/docs/handboek/huisstijl-vastleggen/design-tokens.mdx)).
- [moderate] **The property as the literal CSS property, logical ones included.** NL `voorbeeld.button.padding-block-start`; Cloudscape `$border-width-alert-inline-start`; NL's spacing `basis.space.block.md`, `basis.space.inline.lg` ([NL start tokens](https://cdn.jsdelivr.net/npm/@nl-design-system-unstable/start-design-tokens@9.2.1/dist/variables.css); [Cloudscape tokens](https://cdn.jsdelivr.net/npm/@cloudscape-design/design-tokens@3.0.118/index.scss)).

**How**

| System | Grammar | Example |
|---|---|---|
| Atlassian | `color.{property}.{role}.{emphasis}.{state}` | `color.background.discovery.bold.pressed` |
| Polaris | `--p-color-{property}-{surface\|fill}-{role}-{emphasis}-{state}` | `--p-color-bg-fill-inverse-active` |
| Primer | `{property}Color-{role}-{emphasis}`; state only in component tokens | `borderColor-accent-muted`, `button-danger-bgColor-hover` |
| Carbon | `{property}{Modifier}{State}{Step}` | `layerSelectedHover01` |
| Spectrum | `{role}-{emphasis}-{property}-color-{state}` | `negative-border-color-focus-hover` |
| Fluent | `color{Role}{Property}{Step}{State}` | `colorNeutralBackground5Pressed` |
| Material | `md.sys.color.{on-}{role}{-container}` | `on-tertiary-fixed-variant` |
| SLDS 2 | `--slds-g-color-{on-}{role}-{container}-{step}` | `--slds-g-color-on-surface-inverse-2` |
| PatternFly | `--pf-t--global--{property}--color--{status\|nonstatus}--{role}--{state}` | `--pf-t--global--icon--color--status--on-warning--default` |
| GitLab | `--gl-{concept}-{role}-{property}-color-{state}` | `--gl-action-strong-confirm-background-color-hover` |
| Codex | `--{property}-{role}-{emphasis}--{state}` | `--background-color-progressive--hover` |
| SAP | `--sap{Control}_{Variant}_{State}_{Property}` | `--sapButton_Accept_Selected_Hover_BorderColor` |

Sources for the table: the files linked in this section and [Carbon white theme](https://cdn.jsdelivr.net/npm/@carbon/themes@11.86.0/js/generated/themes/white.js), [Spectrum colour aliases](https://cdn.jsdelivr.net/npm/@adobe/spectrum-tokens@15.7.0/src/color-aliases.json), [SLDS 2 hooks](https://cdn.jsdelivr.net/npm/@salesforce-ux/sds-metadata@2.264.1/dist/sldsStylingHooks.json), [PatternFly tokens](https://cdn.jsdelivr.net/npm/@patternfly/patternfly@6.7.0/base/tokens/tokens-default.scss), [Codex](https://cdn.jsdelivr.net/npm/@wikimedia/codex-design-tokens@2.8.0/dist/theme-wikimedia-ui.css).

- [moderate] Separators and case vary and carry no meaning of their own: dots (Atlassian, NL), kebab (most CSS outputs), camelCase (Fluent, Carbon JS, Ant), camelCase segments joined by hyphens (Primer `bgColor-default`), double hyphen between segments (PatternFly), double hyphen before a state (Codex, Siemens iX `--theme-color-primary--hover`), underscores between camelCase (SAP). A prefix namespaces the output: `--ds-` (Atlassian), `--p-`, `--md-sys-`, `--slds-g-`, `--cnvs-sys-`, `--gl-`, `--pf-t--`, `--hds-`; Primer decided against one because "we did not get any issues" and retrofitting github.com would cost too much ([Primer ADR-005](https://github.com/primer/primitives/blob/main/contributor-docs/adrs/adr-005-token-prefix.md)).
- [moderate] A default level is the name with the slot left out: Polaris `--p-color-bg`, Atlassian `color.text`, Paste `color-background`. Primer's ADR-001 lets `default` appear only as an alias to a named step ([Primer ADRs](https://github.com/primer/primitives/tree/main/contributor-docs/adrs)); Atlassian's names map writes it `color.text.[default]`.

**Cases**
- A team proposes `button-primary-bg-hover` and `bg-button-primary-hover` in the same file → publish one order, as Polaris, Primer, Fluent, PatternFly and NL do; Spectrum still carries 272 names that break its own.
- A token reads `--brand-danger` → name the property too (`--color-background-danger`); Primer v8's split is in [tokens: three tiers](tokens.md#three-tiers).

**Accessibility**
- [moderate] NL and Cloudscape name logical properties (`inline`, `block`, `inline-start`), which CSS mirrors for right-to-left; WCAG has no criterion on names.

**Check**
- *Script:* a name parser per project could split every token into its slots and flag one that fails the grammar, as Spectrum's registry does.
- *Judgement:* can a new person derive a token's name from its use without searching?

**Sources:** each system's file as linked; the grammars are the systems' own documents (Polaris, Primer ADR-006, Fluent pipeline, PatternFly, Cloudscape, NL, Spectrum taxonomy). Commentary: Curtis lists namespace, object, base and modifier levels and says "there's no prevailing token level order" ([Naming tokens in design systems](https://nathanacurtis.substack.com/p/naming-tokens-in-design-systems-9e86c7444676)).

## Property words

**What good looks like**
- [moderate] A closed set of property words: background, text (or foreground), border, icon, plus surface. Polaris closes its element slot to four ([Polaris v11 colour](https://github.com/Shopify/polaris/blob/main/polaris.shopify.com/content/previous-releases/version-11-color.mdx)); Atlassian adds `link`, `blanket`, `skeleton`, `interaction`, `chart` ([Atlassian light](https://cdn.jsdelivr.net/npm/@atlaskit/tokens@20.14.0/dist/cjs/artifacts/tokens-raw/atlassian-light.js)).

**How**
- [strong] **Background:** `background` (Atlassian, Spectrum, Fluent, Paste, Gestalt, PatternFly, GitLab, Garden, Base Web, EUI) or `bg` (Primer, Polaris, Canvas, TDesign, Arco, Equinor, Swiss Post).
- [strong] **Foreground:** `text` (Atlassian, Polaris, Carbon, Paste, Canvas, PatternFly, Nord, GitLab, Ant, TDesign), `fg` (Primer, Canvas, Swiss Post), `foreground` (Fluent, Garden, shadcn/ui, Orbit, Helios), `content` (Spectrum, Base Web), `on-X` (Material, SLDS). Telekom fuses text and icon in one role, `--telekom-color-text-and-icon-*` ([Telekom](https://cdn.jsdelivr.net/npm/@telekom/design-tokens@1.0.0-beta.12/dist/telekom/css/telekom-design-tokens.all.css)); Paste fuses them as `color-text-icon-*`.
- [strong] **Border:** `border` in most; `Stroke` (Fluent), `stroke` (Swiss Post), `outline` (Material), `bdr` (Siemens iX `--theme-color-weak-bdr`, [iX classic light](https://cdn.jsdelivr.net/npm/@siemens/ix@5.3.0/dist/siemens-ix/theme/classic-light.css)).
- [moderate] **Icon:** a property of its own in Atlassian, Polaris, Carbon, Canvas, Gestalt, PatternFly, GitLab, Ant; none in Primer, whose removed list maps `icon.primary` → `fg.default` and `icon.secondary` → `fg.muted` ([Primer removed.json](https://cdn.jsdelivr.net/npm/@primer/primitives@11.10.0/dist/removed.json)).
- [moderate] **Surface and fill:** Polaris splits `bg-surface` (areas) from `bg-fill` (solid controls); Ant and Arco use `fill` for low-alpha fills; Carbon uses `layer`, Atlassian `elevation.surface`, Material and SLDS `surface-container`.

**Cases**
- A palette names `color-foreground` and `color-text` for the same use → Canvas ships `fg` and `text` side by side; Polaris v11 cut its property slot to four words.

**Accessibility**
- [moderate] A separate icon property lets icons take a value of their own (icons need 3:1 under WCAG 1.4.11, text 4.5:1): Atlassian's `icon-danger` is `#C9372C` against `text-danger` `#AE2E24`; Polaris's `color-icon` is `#4a4a4a` against `color-text` `#303030`.

**Check**
- *Script:* list every distinct word in the property slot; more than one per concept is the finding.
- *Judgement:* does each property word name what the token paints?

**Sources:** files as linked in [name grammar](#name-grammar-and-segment-order), and [Garden theme](https://cdn.jsdelivr.net/npm/@zendeskgarden/react-theming@9.16.1/dist/esm/elements/theme/index.js), [Base Web semantic colours](https://cdn.jsdelivr.net/npm/baseui@15.0.0/themes/light-theme/color-semantic-tokens.js), [TDesign CSS](https://cdn.jsdelivr.net/npm/tdesign-vue-next@1.20.11/dist/tdesign.css), [Radix Themes tokens](https://cdn.jsdelivr.net/npm/@radix-ui/themes@3.3.0/tokens.css), [Deutsche Bahn foundations](https://cdn.jsdelivr.net/npm/@db-ux/core-foundations@6.4.0/build/styles/bundle.css), [Grafana `createColors.ts`](https://raw.githubusercontent.com/grafana/grafana/a4f48c68/packages/grafana-data/src/themes/createColors.ts), [Open Props](https://cdn.jsdelivr.net/npm/open-props@1.7.23/open-props.min.css), [Swiss Post tokens](https://cdn.jsdelivr.net/npm/@swisspost/design-system-tokens@10.9.0/tokens.json), [Orbit tokens](https://cdn.jsdelivr.net/npm/@kiwicom/orbit-design-tokens@11.0.0/dist/index.d.ts) and [shadcn/ui theming](https://github.com/shadcn-ui/ui/blob/main/apps/v4/content/docs/(root)/theming.mdx); these serve every section below.

## Role and status words

**What good looks like**
- [strong] Status roles are a closed set of four or five (error, warning, success, information, plus neutral) in Atlassian, Primer, Polaris, Material, Carbon, Spectrum, Paste, Canvas and GitLab (linked in How); the words differ.
- [weak] One word per role across tokens and component props: Polaris v12 changed the `color="warning"` prop to `tone="caution"` to match its tokens ([Polaris v11 to v12](https://github.com/Shopify/polaris/blob/main/polaris.shopify.com/content/version-guides/migrating-from-v11-to-v12.mdx)).

**How**
- [strong] **Failure:** `danger` (Atlassian, Primer, GitLab, Garden, Nord, PatternFly, EUI), `critical` (Polaris, Orbit, Canvas, SAP), `error` (Material, Ant, TDesign, SLDS, GOV.UK, USWDS, Carbon, Codex), `negative` (Spectrum, Base Web, SAP, Blade), `destructive` (Paste, shadcn/ui, Codex), `alarm` (Siemens iX).
- [strong] **Warning:** `warning` in most; `caution` (Polaris, Canvas, Red Hat), `attention` (Primer), `notice` (Spectrum, Blade, Codex).
- [strong] **Success:** `success` in most; `positive` (Spectrum, Canvas, Base Web, SAP, Blade), `ok` (HPE).
- [strong] **Information:** `info`, `information` (Atlassian, Blade), `informative` (Spectrum, SAP).
- [moderate] **Beyond four:** `discovery` (Atlassian), `done`, `sponsors`, `upsell` (Primer), `magic` (Polaris, for AI), `new`, `busy`, `offline` (Paste), `risk` between warning and danger (EUI), severity `critical`/`high`/`medium`/`low` (Cloudscape `$color-background-notification-severity-critical`), `unknown` (EUI, HPE), `highlight` and `selected` as purposes (NL).
- [moderate] **AI as a role:** Polaris `magic`, Semi `--semi-color-ai-general-hover` ([Semi](https://cdn.jsdelivr.net/npm/@douyinfe/semi-theme-default@2.105.0/scss/global.scss)), Canvas `--cnvs-sys-color-surface-ai-pressed`, EUI `assistance`, Cloudscape `gen-ai`.
- [moderate] **Brand or primary:** `brand` (Atlassian, Fluent, Polaris, PatternFly, Red Hat), `accent` (Primer, Spectrum, Radix, SLDS), `primary` (Material, Ant, Paste, Garden, USWDS, shadcn/ui), `progressive` (Codex, for the primary action).
- [strong] **No category segment:** the status word fills the role slot directly in Atlassian, Polaris, Primer, Paste and Canvas (tokens and files in [name grammar](#name-grammar-and-segment-order)).
- [weak] **A category segment that splits status from a hue-named non-status set:** PatternFly `--status--` beside `--nonstatus--` (`--pf-t--global--border--color--nonstatus--teal--default`, [PatternFly tokens](https://cdn.jsdelivr.net/npm/@patternfly/patternfly@6.7.0/base/tokens/tokens-default.scss)); Cloudscape has a `status` segment (`$color-text-status-error`) and a separate `$color-charts-*` group, but no source pairs them as status against non-status ([Cloudscape tokens](https://cdn.jsdelivr.net/npm/@cloudscape-design/design-tokens@3.0.118/index.scss)). Fluent is a partial case: `colorStatusDanger…` sits beside `colorPalette…`, but that palette is built from status hues (`red`, `green`, `berry`) as well as persona hues (`teal`, `blue`) ([Fluent light palette](https://cdn.jsdelivr.net/npm/@fluentui/tokens@1.0.0-alpha.24/lib/alias/lightColorPalette.js); [Fluent shared colour names](https://cdn.jsdelivr.net/npm/@fluentui/tokens@1.0.0-alpha.24/lib/sharedColorNames.js)).
- [moderate] **A category segment that names a use, one among several:** GitLab ships `feedback.*` ("the result of an action, event, or opportunity"), `status.*` ("the current state or condition of an element or system"), `highlight.*` and `control.*` (`--gl-feedback-danger-background-color`, `--gl-status-danger-background-color`, [GitLab tokens](https://cdn.jsdelivr.net/npm/@gitlab/ui@141.1.0/src/tokens/build/css/tokens.css), [Pajamas design tokens](https://design.gitlab.com/product-foundations/design-tokens)); Swiss Post puts `signal` beside `body`, `interactive`, `surface` and `badge` under `post.scheme.color` ([Swiss Post tokens](https://cdn.jsdelivr.net/npm/@swisspost/design-system-tokens@10.9.0/tokens.json)).
- [strong] **A non-status colour set ships without the category too, marked on its own side instead:** Atlassian `color.background.accent.blue` and `color.chart.*`, Primer `--display-blue-bgColor-muted` and `--data-blue-color`, Paste `--color-background-decorative-10-weakest`, Canvas `--cnvs-sys-color-static-blue-soft`, Polaris `--p-color-avatar-five-bg-fill` (files in [name grammar](#name-grammar-and-segment-order)).
- [moderate] **Two words for one role ship together** in Canvas (`danger` and `critical`, `warning` and `caution`, `success` and `positive`), Nord (`text-danger` and `text-error`), Paste (`error` and `destructive`) and Carbon (`supportWarning` and `supportCautionMajor`). Canvas's file comments mark the `danger` set "(not tenant themeable)" and map `critical` to brand, the only stated reason found.

**Cases**
- A system names `error` in tokens and `danger` on the Button prop → one word in both; Polaris aligned them in v12.
- A taxonomy has only neutral and four status roles → Atlassian, Polaris, Primer, Paste and Canvas put the role straight in the role slot; PatternFly adds `status` beside `nonstatus`, and Cloudscape has a `status` segment and a separate `charts` group; GitLab and Swiss Post add it as one use group among several; all five no-category systems ship a non-status colour set too, under `accent`, `display`, `decorative`, `static` or `avatar`.
- A team adds `critical` beside `danger` for a stronger severity → Cloudscape and EUI write severity as a ladder (`critical`, `high`, `medium`, `low`; `risk` between warning and danger); Canvas and Nord ship the two words as near-synonyms.

**Accessibility**
- [required] A status colour is never the only cue: WCAG 2.2 1.4.1 ([visual: colour roles](../ui/design/visual.md#colour-roles-and-semantics)).

**Check**
- *Script:* list the role words used across tokens and component props; two words for one role is the finding.
- *Judgement:* does each status role have one meaning and one word?

**Sources:** the files linked above; [Cloudscape tokens](https://cdn.jsdelivr.net/npm/@cloudscape-design/design-tokens@3.0.118/index.scss); [EUI Borealis light](https://cdn.jsdelivr.net/npm/@elastic/eui-theme-borealis@8.2.0/lib/cjs/variables/colors/_colors_light.js); [HPE colour](https://cdn.jsdelivr.net/npm/hpe-design-tokens@2.4.0/dist/css/color.light.css); [Blade theme](https://cdn.jsdelivr.net/npm/@razorpay/blade@12.131.0/build/lib/web/development/tokens/theme/bladeTheme.js).

## Intensity levels per property

**What good looks like**
- [strong] Text has two to four neutral levels plus disabled and inverse; backgrounds, surfaces and borders have more. Two levels: Primer, Polaris, Material, GOV.UK; three: Atlassian, GitLab, Fluent; four: Ant (alphas 0.88, 0.65, 0.45, 0.25 on one base). Backgrounds reach six in Paste and Canvas, surfaces five in Material.
- [moderate] Intensity words differ between the systems below (Atlassian and Blade share `subtle`, few share more). Three families recur: adjectives around an unnamed default, ordinals, and numbers.

**How**
- [strong] **Adjectives around a default:**
  - Atlassian: `subtlest`, `subtler`, `subtle`, (default), `bold`, `bolder`, `boldest`. Text `color.text`, `.subtle`, `.subtlest`; danger backgrounds `color.background.danger`, `.subtler`, `.subtle`, `.bold`; accent backgrounds `subtlest`, `subtler`, `subtle`, `bolder`.
  - Paste: `weakest`, `weaker`, `weak`, (default), `strong`, `stronger`, `strongest` on background, border and text ([Paste](https://cdn.jsdelivr.net/npm/@twilio-paste/design-tokens@10.15.0/dist/tokens.custom-properties.css)).
  - Canvas: `softest`, `softer`, `soft`, `default`, `strong`, `stronger`, `strongest` (`--cnvs-sys-color-bg-info-softest`).
  - Nord: `--n-color-text`, `-weak`, `-weaker`, `-weakest` ([Nord](https://cdn.jsdelivr.net/npm/@nordhealth/tokens@9.0.6/lib/color-nord.custom-properties.css)).
  - Telekom: `faint`, `subtle`, `regular`, `strong`, `extra-strong`.
  - Siemens iX: text `contrast` > `std` > `soft` > `weak`; borders add `hard` and `x-weak`.
  - Helios: `faint`, `primary`, `strong`, `high-contrast` (`--hds-foreground-color-faint`, [Helios](https://cdn.jsdelivr.net/npm/@hashicorp/design-system-tokens@6.0.1/dist/products/css/tokens.css)).
- [strong] **Two-word pairs:** Primer `muted` / `emphasis` (`bgColor-danger-muted`, `bgColor-danger-emphasis`), Garden `primaryEmphasis`, Spectrum `subdued` / `subtle`, Polaris `surface` / `fill`, Equinor `fill-muted` / `fill-emphasis`, Backpack `fill` / `spot`, Blade `subtle` / `intense`.
- [strong] **Ordinals:** Polaris `secondary`, `tertiary`; Ant `Secondary`, `Tertiary`, `Quaternary`; Carbon `textPrimary`, `textSecondary`, `textPlaceholder`, `textHelper`; TDesign `primary`, `secondary`, `placeholder`, `disabled`.
- [strong] **Numbers:** Fluent `colorNeutralForeground1`–`5`, `colorNeutralBackground1`–`8`, `colorNeutralStroke1`–`4`; Carbon `layer01`–`03`, `borderSubtle00`–`03`; SLDS `on-surface-1`–`3`, `border-1`, `-2`; Arco `--color-text-1`–`4`; Semi `--semi-color-text-0`–`3`, 0 the strongest; Deutsche Bahn `--db-adaptive-on-bg-basic-emphasis-50` … `100`.
- [moderate] **Per property, in systems with their own icon tokens.** Icons share text's level names in Atlassian, Gestalt and GitLab; they take lighter values under the same names in Atlassian and Polaris; Carbon gives icons two levels where text has seven (no placeholder or helper); Canvas gives icons three (`icon-soft`, `-default`, `-strong`) where `fg` has more; Orbit gives icons three and text two. Atlassian's 4.4.1 added `icon.color.subtlest` "equal to icon.color.subtle" to align icon with text ([Atlassian changelog](https://cdn.jsdelivr.net/npm/@atlaskit/tokens@20.14.0/CHANGELOG.md)).
- [moderate] **Surfaces by purpose:** Atlassian `elevation.surface`, `.sunken`, `.raised`, `.overlay`; Nord `surface-raised`, `-lowered`, `-canvas`; Garden `background.default`, `.raised`, `.recessed`; Telekom `canvas`, `canvas-subtle`, `surface`, `surface-subtle`; HPE `background-back`, `-front`, `-floating`; Material `surface-container-lowest` … `-highest`; Carbon `layer01`–`03` counting nesting ("Container color on $layer-01", [Carbon colour tokens](https://carbondesignsystem.com/elements/color/tokens/)). The design side is [surfaces and elevation levels](../ui/design/visual.md#surfaces-and-elevation-levels).

**Cases**
- Numbered levels added over time fall out of order: Fluent's `colorNeutralStroke4` is darker than `Stroke3`, `Background7` is transparent and `Foreground5` equals `Foreground3`; SLDS's `on-surface-1` is the weakest text while `surface-1` is the base ([Fluent light](https://cdn.jsdelivr.net/npm/@fluentui/tokens@1.0.0-alpha.24/lib/alias/lightColor.js); [SLDS 2 hooks](https://cdn.jsdelivr.net/npm/@salesforce-ux/sds-metadata@2.264.1/dist/sldsStylingHooks.json)).
- The end of a symmetric ladder can be unusable: Paste's `color-text-weakest` is white, invisible on its own body background.
- A rename that shifts a word's meaning breaks silently: Atlassian 0.7.0 renamed `accent.blue` to `accent.blue.subtler` and `accent.blue.bold` to `accent.blue.subtle`, so `subtle` came to mean a weaker colour than before ([Atlassian changelog](https://unpkg.com/@atlaskit/tokens@1.0.0/CHANGELOG.md)).

**Accessibility**
- [required] Each text level meets WCAG 2.2 1.4.3 on the surfaces it sits on; disabled text is exempt (1.4.3's "inactive user interface component").

**Check**
- *Script:* for each property, list its levels in order and their contrast on the default surface; a level out of order is the finding.
- *Judgement:* does each property's level count match the levels the screens use?

**Sources:** files as linked.

## Palette scales

**What good looks like**
- [strong] Palette steps are named by position on a lightness ramp in every system in this section's How (each linked); Radix also ties each step to a use. The tier split is [tokens: three tiers](tokens.md#three-tiers)'s.
- [moderate] The step numbering leaves room for a step added later: Spectrum's `gray-25`, `50`, `75`, `100` … `1000`; Canvas `25` … `975`; Fluent's grey in steps of 2 from 2 to 98 plus 99.

**How**
- [strong] Step schemes seen: Tailwind `50`–`950` in OKLCH ([Tailwind theme](https://cdn.jsdelivr.net/npm/tailwindcss@4.3.5/theme.css)); Radix `1`–`12` plus alpha `a1`–`a12`, each step tied to a use ([Radix scale](https://github.com/radix-ui/website/blob/main/data/colors/docs/palette-composition/understanding-the-scale.mdx)); Carbon `gray10`–`gray100` plus `{hue}{N}Hover`; Material tones `0`–`100`; Spectrum `gray-25`–`1000` (13 steps), `blue-100`–`1600`; Polaris gray `1`–`16`; SLDS `neutral-base-10`–`100` where 10 is dark; USWDS grades `5`–`90`; Ant `1`–`10`; TDesign `gray-color-1`–`14`; Equinor `--eds-color-accent-1`–`15`; GitLab `neutral-0`, `10`, `50`, `100`–`950`, `1000`; GOV.UK by mix, `tint-25`, `tint-95`, `shade-50`; Orbit by adjective, `light`, `normal`, `dark`, `darker`.
- [moderate] Direction differs: in Tailwind, Spectrum and GitLab a low number is light; in SLDS a low number is dark.
- [weak] **Grades that predict contrast.** USWDS: "a 100-point scale … 0 is pure white and 100 is pure black", and a grade difference of 50 or more meets AA, 70 or more AAA ([USWDS colour](https://github.com/uswds/uswds-site/blob/main/pages/design-tokens/color/overview.md)).
- [strong] **Dark mode, three ways:** the same step names with values flipped per theme (Spectrum `gray-100` is `rgb(233,233,233)` in light and `rgb(44,44,44)` in dark; Radix); a fixed palette where the semantic tier picks other steps (GitLab `background-color-default` is `neutral-0` in light and `neutral-950` in dark; Material, Fluent, TDesign, SLDS `light-dark()` pairs); separate dark palettes (Ant `blueDark`).
- [weak] Palettes named after places or brands: Backpack `$bpk-color-monteverde` ([Backpack](https://cdn.jsdelivr.net/npm/@skyscanner/bpk-foundations-web@24.9.0/tokens/base.default.scss)); NL leaves the brand tier's names free so an organisation keeps its own words.

**Cases**
- A high-contrast theme needs a value between two steps → Primer used "custom hex values between scale levels 5 and 6" when "no single scale step" met 7:1 ([Primer #1346](https://github.com/primer/primitives/issues/1346)); remapping its base scale touched "1,800+" functional tokens ([Primer #1364](https://github.com/primer/primitives/issues/1364)).
- Polaris v11's grey consolidation is in [tokens: three tiers](tokens.md#three-tiers).

**Accessibility**
- [weak] A scale whose grades predict contrast (USWDS) lets a pairing be checked by subtraction; any other scale is checked per pair (WCAG 2.2 1.4.3, 1.4.11).

**Check**
- *Script:* count the distinct values per hue; near-duplicates are the Polaris finding.
- *Judgement:* is there room in the numbering for the next step?

**Sources:** files as linked.

## Scale naming for size, space, radius and the rest

**What good looks like**
- [strong] A primitive tier on a numeric or multiplier scale with gaps, and a small semantic tier named by role or size word above it. Atlassian and Polaris (values in [tokens: spacing tokens](tokens.md#spacing-tokens)), Gestalt (`--sema-space-25` … `1600`) and Codex (`--spacing-100`, `--size-2400`) number by a base; Primer added `--space-xxs` … `xl` over its base scale ([Primer #1370](https://github.com/primer/primitives/pull/1370)).

**How**
- [moderate] **Size words** (`xs`, `sm`, `md`, `lg`, `xl`): Tailwind, Primer text, Carbon `$size-*`, EUI, Cloudscape `$space-scaled-xxxs` … `xxxl`. No room to insert: Ant coined `sizeMS` between `SM` and `MD`. The ends grow: TDesign `--td-comp-size-xxxxxl`, Fluent `borderRadius6XLarge`. Spelling drifts: Primer `space-xxs` beside `text-2xl`; Spectrum mixes `extra-large` and `2x-large`; Canvas ships `--cnvs-sys-font-size-body-large` and `-body-lg` with different values ([Canvas system](https://cdn.jsdelivr.net/npm/@workday/canvas-tokens-web@4.5.1/css/system/_variables.css)).
- [weak] **Size words across modes.** Codex moved font sizes to numbers because "what might be considered 'small' in one mode could be 'large' in another" ([Codex ADR 13](https://github.com/wikimedia/design-codex/blob/main/packages/codex-docs/docs/using-codex/adrs/13-adr-font-modes.md)).
- [moderate] **Index** (`1`–`12`): Radix `--space-1` … `9`, Carbon `$spacing-01` … `13`, Open Props `--size-1` … `15` with `--size-00` and `-000` below 1 ([Open Props](https://open-props.style/)), Blade `spacing[0..11]`.
- [moderate] **Hundreds with gaps:** Spectrum `spacing-85`, `font-size-25`, `corner-radius-75`; Polaris `border-radius-150`; PatternFly `breakpoint--250`; Canvas `font-size-125`. Insertions can still produce odd names: Polaris `--p-border-width-0165`, USWDS `105`, GitLab `GL_SPACING_SCALE_11_5`.
- [moderate] **Value-literal** (the name is the value): Gestalt `--base-font-size-12`, Fluent `shadow2` … `shadow64`, Carbon `$border-radius-02` … `16`, Primer `--base-size-4` … `128`, GitLab `--gl-spacing-scale-8`. Safe at the primitive tier; GOV.UK's type point `24` renders at 21px on small screens ([GOV.UK new type scale](https://design-system.service.gov.uk/get-started/new-type-scale/)).
- [moderate] **Role-named:** `--zIndex-modal`, `--motion-duration-short`, `--control-xsmall-size` (Primer), `zIndexPopup` (Fluent), Cloudscape `$motion-duration-expressive`. They state intent but cannot be ordered, and two can share a value (Carbon `overlay` and `floating` are both 6000).
- [moderate] **Spacing by relationship:** PatternFly `--pf-t--global--spacer--gap--action-to-action--default`; Telekom `baseline-space-*` inside components against `composition-space-*` for layout; Cloudscape `$space-scaled-*` (moves with density) against `$space-static-*` (does not).
- [moderate] **The responsive context in the name:** Deutsche Bahn `--db-spacing-responsive-regular-mobile-2xs`, `…-desktop-3xl`; Pajamas `GL_FONT_SIZE_100_FIXED` against the fluid size. Most systems keep it in a mode instead (see [tokens: themes and modes](tokens.md#themes-and-modes)).

**Cases**
- Tailwind v4 moved its whole shadow, radius and blur scale down one name (`shadow` → `shadow-sm`, `shadow-sm` → `shadow-xs`) so "every utility has a named value"; the same name now means a different value ([Tailwind upgrade guide](https://github.com/tailwindlabs/tailwindcss.com/blob/main/src/docs/upgrade-guide.mdx)).
- Polaris v12's renumbering is in [tokens: spacing tokens](tokens.md#spacing-tokens); its old and new numbers overlapped, so colour and font migrations ran in "4 sequential steps" ([Polaris v11 to v12](https://github.com/Shopify/polaris/blob/main/polaris.shopify.com/content/version-guides/migrating-from-v11-to-v12.mdx)).
- `@kiwicom/orbit-design-tokens` 8.0.0 replaced `spaceXXSmall` … `spaceXXXLarge` with `space50` … `space1600`, and named elevations with `elevationLevel1`–`4BoxShadow` ([Orbit tokens](https://cdn.jsdelivr.net/npm/@kiwicom/orbit-design-tokens@11.0.0/dist/index.d.ts)).
- Atlassian's radius rename (numbers to words) is in [tokens: radius tokens](tokens.md#radius-tokens).

**Accessibility**
- [required] Units are code-standard rule 54's; a scale's name carries no unit in any system above.

**Check**
- *Script:* flag a scale with two spellings of one size word, or a step whose name and value disagree.
- *Judgement:* when the next step is needed, where does its name go?

**Sources:** files as linked; the KB's own sections on [spacing tokens](tokens.md#spacing-tokens) and [radius tokens](tokens.md#radius-tokens) hold the values.

## Interaction states

**What good looks like**
- [moderate] Atlassian, Polaris, Fluent and Primer use one word per state across their files; Swiss Post's `hover` beside `hovered` is the exception found.
- [weak] States are named only where the emphasis is interactive: Atlassian made `color.background.*.subtle` "intentionally non-interactive only — no .hovered or .pressed variants" (20.4.0, [Atlassian changelog](https://cdn.jsdelivr.net/npm/@atlaskit/tokens@20.14.0/CHANGELOG.md)).
- [weak] Selected is its own state, apart from pressed and focus: Atlassian's `color.background.selected` description says selection "is distinct from keyboard focus and hover alone".

**How**
- [strong] **Words for pressed:** `pressed` (Atlassian, Fluent, Gestalt, Canvas, Telekom, Deutsche Bahn), `active` (Polaris, Primer components, Carbon, Ant, TDesign, GitLab, Orbit, GOV.UK `link-active`), `down` (Spectrum), `clicked` (PatternFly), `highlighted` for hover and focus together (Blade).
- [strong] **Words for rest:** `rest` (Primer `control-bgColor-rest`), `default` (Spectrum, PatternFly, GitLab, Canvas, Red Hat), `standard` (Telekom), none (Atlassian, Polaris, Fluent).
- [moderate] **Hover:** `hover` almost everywhere, `hovered` in Atlassian and Telekom; Swiss Post ships both (`post-checkbox-hover-bg`, `post-chip-hovered-bg`, [Swiss Post tokens](https://cdn.jsdelivr.net/npm/@swisspost/design-system-tokens@10.9.0/tokens.json)).
- [strong] **Five mechanisms:**
  - In the semantic name: Atlassian `color.background.brand.bold.hovered`; Polaris `bg-fill-brand-hover`; Fluent `colorBrandBackgroundPressed`; Carbon `layerSelectedHover01`; Spectrum `negative-background-color-down`; GitLab `--gl-action-danger-foreground-color-hover`; Codex `--background-color-progressive--hover`.
  - An overlay on any fill: Material state layers `md.sys.state.hover.state-layer-opacity` and siblings ([Material Web state](https://cdn.jsdelivr.net/npm/@material/web@2.5.0/tokens/versions/latest/sass/_md-sys-state.scss); values in [visual states of controls](../ui/design/visual.md#visual-states-of-controls)); Atlassian `color.interaction.hovered` and `.pressed` for fills "that cannot change, such as avatars"; Carbon `backgroundHover` as alpha grey; Canvas `--cnvs-sys-opacity-accent-hover`.
  - Computed from a seed: Ant `colorPrimaryHover` is palette index 5, `colorPrimaryActive` index 7; Garden calls `getColor` with an offset; Grafana's `hoverFactor`.
  - Palette steps chosen per component: Arco's primary button is `--primary-6`, hover `--primary-5`, active `--primary-7` ([Arco CSS](https://cdn.jsdelivr.net/npm/@arco-design/web-react@2.66.18/dist/css/arco.css)); Orbit puts states into the palette, `paletteBlueNormalHover`.
  - Emphasis steps standing for states: Canvas's comments call `bg-primary-strong` "Brand hover background" and `-stronger` "Brand active background"; SLDS `accent-2` is the active brand.
- [moderate] **Disabled as colours per property:** Carbon v11 split `disabled-02` into `text-disabled`, `icon-disabled`, `button-disabled` and `border-disabled` ([Carbon v11 migration](https://github.com/carbon-design-system/carbon/blob/main/docs/migration/v11.md)); Semi `--semi-color-disabled-text`, `-bg`, `-border`, `-fill`. Disabled as opacity: Material `disabled-label-text-opacity` 0.38; Spectrum `opacity-disabled` 0.3; Atlassian `opacity.disabled` 0.4. The KB's [disabled opacity](tokens.md#the-disabled-opacity-once) owns the code side.

**Cases**
- `active` means pressed in some systems and current in others: Carbon's `layerAccentActive` and Primer's `active` beside a separate `selected`, against Atlassian's and Fluent's `pressed`.
- Polaris v11 changed `-hovered`/`-pressed` to `-hover`/`-active` ([Polaris v11 tokens](https://github.com/Shopify/polaris/blob/main/polaris.shopify.com/content/previous-releases/version-11-tokens.mdx)); a state-word change is a rename of every stateful token.

**Accessibility**
- [required] Every state that changes a fill meets 1.4.11 against its neighbours; contrast is checked per state, not inherited from rest ([visual states of controls](../ui/design/visual.md#visual-states-of-controls)).

**Check**
- *Script:* list every state word in use; more than one per state is the finding.
- *Judgement:* does an overlay state hold contrast on every fill it can land on?

**Sources:** files as linked.

## Focus

**What good looks like**
- [strong] Focus is its own token group, not a borrowed border: colour, width and offset at least, often an inner colour and an inverse variant. Primer `--focus-outline-color`, `--focus-outline-width` (0.125rem, its description citing WCAG 2.4.7), `--focus-outline-offset` (−0.125rem, "creates an inset outline"); SAP `--sapContent_FocusColor`, `_FocusWidth`, `_FocusStyle`; Spectrum `focus-indicator-color`, `focus-indicator-thickness` 2px, `focus-ring-gap`.
- [moderate] Carbon, Canvas, Gestalt, Paste, Spectrum and Telekom ship a focus variant for dark or brand backgrounds: Carbon `focusInverse`, Canvas `--cnvs-sys-color-focus-inverse` ("Focus ring for use on dark backgrounds"), Gestalt `--sema-color-border-focus-outer-inverse`, Paste `--shadow-focus-inverse`, Spectrum `static-white-focus-indicator-color`, Telekom `--telekom-color-functional-focus-on-dark-background`.

**How**
- [moderate] **Single ring:** Atlassian `color.border.focused` with `border.width.focused` 2px; Polaris `--p-color-border-focus`; Radix `outline: 2px solid var(--focus-8)`; USWDS `$theme-focus-color`, `-width`, `-offset`, `-style`.
- [moderate] **Double ring** (a spacer in the surface colour, then the ring): Gestalt `focus-inner` and `focus-outer`; GitLab `--gl-focus-ring-inner-color: var(--gl-background-color-default)` and `--gl-focus-ring-outer-color`; SLDS `--slds-g-shadow-outset-focus-1: 0 0 0 2px #FFFFFF, 0 0 0 4px #0B5CAB`; Paste `--shadow-focus` (three rings); Fluent `colorStrokeFocus1` white and `colorStrokeFocus2` black, swapped in dark; Helios `--hds-focus-color-action-internal` and `-external`.
- [moderate] **Halo:** Ant `controlOutline` (an alpha of the primary background), `colorErrorOutline`, `colorWarningOutline`; TDesign `--td-brand-color-focus`, `--td-error-color-focus`.
- [weak] **Text and fill change:** GOV.UK `--govuk-focus-colour` `#fd0` with `--govuk-focus-text-colour` and `$govuk-focus-width` 3px, plus a transparent outline kept for forced-colours mode ([GOV.UK functional colours](https://cdn.jsdelivr.net/npm/govuk-frontend@6.6.0/dist/govuk/settings/_colours-functional.scss)).
- [weak] **Protected from theming:** NL hard-codes `basis.focus.outline-color` so focus always differs from all other content, and avoids a yellow focus fill on form fields so it is not confused with autofill ([NL basis tokens](https://github.com/nl-design-system/documentatie/blob/main/docs/handboek/huisstijl-vastleggen/basis-tokens/index.mdx)).
- [weak] Fluent ships its focus outline width as a literal `'2px'` with the source comment that `tokens.strokeWidthThick` "causes some weird bugs" ([Fluent focus outline](https://cdn.jsdelivr.net/npm/@fluentui/react-tabster@9.26.19/lib/focus/createFocusOutlineStyle.js)).

**Cases**
- A blue focus ring on a brand-blue button disappears → the double-ring systems above add an inner spacer ring in the surface colour, or an inverse ring for that fill.
- Selected and focused at once → Atlassian: "keep its selected treatment and add a separate focus indicator".

**Accessibility**
- [required] WCAG 2.2 2.4.7 Focus Visible (AA); 2.4.11 Focus Not Obscured (Minimum) (AA) is about overlap, not appearance; 2.4.13 and ring guidance are [visual states of controls](../ui/design/visual.md#visual-states-of-controls)'s. The research on indicators is [focus indicators](../../research/accessibility/focus-indicators.md).

**Check**
- *Script:* measure the focus ring's contrast against every fill a focusable component takes, per mode.
- *Judgement:* is focus one group, or borrowed from a border token?

**Sources:** files as linked; [Primer light](https://cdn.jsdelivr.net/npm/@primer/primitives@11.10.0/dist/css/functional/themes/light.css); [Gestalt VR](https://cdn.jsdelivr.net/npm/gestalt-design-tokens@177.0.12/dist/css/vr-theme/variables.css).

## Inverse, on-colour and fixed colours

**What good looks like**
- [strong] Text on a bold fill is named for that fill, not by one global on-colour: Polaris v12 replaced `--p-color-text-on-color` with per-fill `on-bg-fill` tokens, "tailored to the background color the element is sitting on" ([Polaris v11 to v12](https://github.com/Shopify/polaris/blob/main/polaris.shopify.com/content/version-guides/migrating-from-v11-to-v12.mdx)), because caution fills need dark text (`text-caution-on-bg-fill` is `rgba(51,46,0,1)`). Material (`on-primary`, `on-error-container`), SLDS (`on-success-2` `#181818`), Radix (`--amber-contrast` `#21201c`) and Equinor (`--eds-color-text-info-strong-on-emphasis`) pair each fill with its own foreground.
- [moderate] `inverse` names one thing per system. Two meanings ship: text on a bold fill (Atlassian `color.text.inverse`, "Use for text on bold backgrounds", which flips in dark; GOV.UK `inverse-text`; Canvas `fg-inverse`), and the opposite-mode surface with its content (Primer `bgColor-inverse`, "Inverse background that flips between light and dark modes"; Carbon `backgroundInverse`; Fluent `colorNeutralBackgroundInverted`; Material `inverse-surface`).

**How**
- [weak] Primer moved "on a bold fill" out of `inverse`: its removed list maps `text.inverse` → `fg.onEmphasis` and `bg.canvasInverse` → `neutral.emphasis` ([Primer removed.json](https://cdn.jsdelivr.net/npm/@primer/primitives@11.10.0/dist/removed.json)).
- [moderate] **Inverse as a parallel set:** NL `--basis-color-action-1-inverse-bg-default`, `--basis-color-default-inverse-border-subtle`; Deutsche Bahn `--db-adaptive-bg-inverted-contrast-low`, `-high`, `-max`; TDesign calls it `anti` (`--td-text-color-anti`); Siemens iX prefixes `inv-` (`--theme-color-inv-std-text`) and suffixes `--contrast` for on-colour (`--theme-color-primary--contrast`).
- [moderate] **Fixed colours that never flip:** Spectrum `static-white-text-color`, Primer `fgColor-white`, Fluent `colorNeutralForegroundStaticInverted`, Codex `--color-base-fixed`, Blade `staticWhite`, EUI `textGhost` and `textInk`. The KB's rule on white and black is in [tokens: three tiers](tokens.md#three-tiers).
- [moderate] **Context in the name instead of a mode:** Red Hat ships every token with `-on-light` and `-on-dark` variants (`--rh-color-surface-status-caution-on-light`, [Red Hat tokens](https://cdn.jsdelivr.net/npm/@rhds/tokens@3.2.0/css/default-theme.css)); Backpack ships `-day` and `-night` (`$bpk-text-primary-day`).
- [moderate] **A contrast threshold as a token:** SAP `--sapContent_ContrastTextThreshold`; Grafana `contrastThreshold`; Deutsche Bahn's adaptive tokens resolve to whatever colour family a container sets.

**Cases**
- One `on-primary` white serves every fill, then a yellow warning fill arrives → per-fill on-colour (Polaris v12).
- `on-X` read three ways in one codebase → Material and SLDS mean "foreground on X"; Red Hat's `-on-dark` means "variant for a dark context"; Primer's `onEmphasis` is a modifier.

**Accessibility**
- [required] Each on-colour pair meets WCAG 2.2 1.4.3 for its fill in each mode; a single on-colour across fills of different lightness fails on some.

**Check**
- *Script:* pair every fill with its on-colour and measure contrast per mode.
- *Judgement:* does `inverse` mean one thing in this file?

**Sources:** files as linked.

## Borders

**What good looks like**
- [strong] Form-control borders have their own token at 3:1 against the surface, while decorative borders stay lighter (WCAG 2.2 1.4.11): Atlassian 1.45.0 changed `color.border.input` from `#091E4224` to `#8590A2` "to meet 3:1 color contrast ratio" ([Atlassian changelog](https://cdn.jsdelivr.net/npm/@atlaskit/tokens@20.14.0/CHANGELOG.md)); Polaris `color-input-border` `#8a8a8a` against `color-border` `#e3e3e3`; Carbon `borderStrong01` against `borderSubtle01`; GitLab `control-border-color-default` against `border-color-default`; GOV.UK `input-border` ("Used for form inputs and controls") against `border` ("borders, separators, rules and keylines").

**How**
- [moderate] **Colour levels:** Atlassian `border`, `border-bold`, `border-input`, `border-focused`, `border-selected`, `border-disabled`, `border-inverse`; Primer `borderColor-default`, `-muted`, `-emphasis`, `-translucent`, `-disabled`; Carbon `borderSubtle00`–`03`, `borderStrong01`–`03`, `borderTile01`–`03`, `borderInteractive`; Fluent `colorNeutralStroke1`–`4`, `StrokeAccessible`, `StrokeSubtle`; Material `outline`, `outline-variant`; Radix steps 6, 7, 8 ("subtle borders on components which are not interactive", "on interactive components", "stronger borders … and focus rings"); Equinor `subtle`, `medium`, `strong`; Grafana `weak` (decoration), `medium` (widget), `strong` (active or focused).
- [moderate] **Widths:** words (Primer `--borderWidth-thin`, `-thick`, `-thicker`; Fluent `strokeWidthThin` … `Thickest`; PatternFly `regular`, `strong`, `extra-strong`), numbers (Spectrum `border-width-100`, `200`, `400`; Paste `border-width-10` … `40`), roles (Atlassian `border.width.selected`, `.focused`; Ant `lineWidthFocus`; GOV.UK `$govuk-border-width-form-element`).
- [moderate] **Dividers:** Ant `colorSplit`, Canvas `border-divider`, Material's divider uses `outline-variant`, PatternFly `border-width-divider-default`.
- [moderate] **Borders drawn as shadows:** Paste `--shadow-border-bottom-error-weaker`; Primer's floating shadows and Radix's `shadow-2` begin with a 1px ring.

**Cases**
- An input uses the divider colour → shadcn/ui's light `--input` equals `--border` (`oklch(0.922 0 0)`, about 1.26:1 on white) and Primer's `control-borderColor-rest` is `#d1d9e0` (about 1.43:1), against 1.4.11's 3:1 where the border is a field's only boundary ([shadcn/ui theming](https://github.com/shadcn-ui/ui/blob/main/apps/v4/content/docs/(root)/theming.mdx)). The ratios are computed from the shipped values.

**Accessibility**
- [required] WCAG 2.2 1.4.11: the boundary needed to identify a control meets 3:1 ([visual: elevation, borders, radius and shape](../ui/design/visual.md#elevation-borders-radius-and-shape)).

**Check**
- *Script:* every control's border token at 3:1 on its surface, per mode.
- *Judgement:* is a border decorative or does it identify a control?

**Sources:** files as linked; how Figma strokes reach CSS is [figma-handoff: strokes](figma-handoff.md#strokes-borders-outlines-and-shadows).

## Elevation and shadow names

**What good looks like**
- [moderate] Elevation is named by intent and expressed as a shadow paired with a surface colour; in dark mode the surface carries the depth. Atlassian pairs `elevation.shadow.raised`, `.overlay`, `.overflow` with `elevation.surface.raised`, `.overlay`, `.sunken` (values in [surfaces and elevation levels](../ui/design/visual.md#surfaces-and-elevation-levels)); Spectrum's `drop-shadow-elevated` key is 0.12 alpha in light and 0.36 in dark; Material moved from elevation overlays to tonal `surface-container` levels and says maintenance of the overlay "has been discontinued" ([Material Android colour](https://github.com/material-components/material-components-android/blob/master/docs/theming/Color.md)). The design side is [surfaces and elevation levels](../ui/design/visual.md#surfaces-and-elevation-levels) and [elevation and shadows](../../research/foundations/elevation-and-shadows.md).

**How**
- [moderate] **By intent:** Atlassian `raised`, `overlay`, `overflow`; Primer `--shadow-resting-small`, `--shadow-floating-large`, `--shadow-inset`; Gestalt `--sema-elevation-floating`, `-raised-top`; Spectrum `drop-shadow-emphasized`, `-elevated`, `-dragged`; Telekom `--telekom-shadow-raised-standard`, `-hover`, `-pressed`; Cloudscape `$shadow-card`; Blade `lowRaised`, `midRaised`, `highRaised`; Helios `--hds-elevation-low`, `-mid`, `-high`, `-higher`, `-overlay-box-shadow`.
- [moderate] **By number:** Material `level0`–`level5` (0, 1, 3, 6, 8, 12 dp); Polaris `--p-shadow-0` … `600`; Radix and Open Props `1`–`6`; Canvas `--cnvs-sys-depth-1` … `6`; SLDS `shadow-1` … `4`; SAP `--sapContent_Shadow0` … `3`.
- [weak] **By value:** Fluent `shadow2`, `4`, `8`, `16`, `28`, `64`, the number being the key shadow's blur.
- [moderate] **By size word:** Tailwind `--shadow-2xs` … `2xl`; GitLab `--gl-shadow-sm`; EUI `xs` … `xl`; Deutsche Bahn `--db-elevation-sm`.
- [moderate] **By direction:** Codex `--box-shadow-outset-medium-below`, `--box-shadow-drop-xx-large`; PatternFly `box-shadow-md-top`; TDesign `--td-shadow-inset-top`.

**Cases**
- Polaris v12 moved shadows from size words to numbers (`shadow-xs` → `100` … `2xl` → `600`) and folded its experimental card shadows in; Orbit moved from purpose names to `elevationLevel1`–`4`.
- A dark mode where shadows vanish → pair each level with a surface colour (Atlassian, Spectrum, Material, Gestalt, Canvas); Carbon expresses depth by lighter layers alone in its dark themes (`layer01` `#262626`, `layer02` `#393939`).

**Accessibility**
- [weak] A shadow is not a boundary for 1.4.11; a raised control still needs a border or fill at 3:1 ([Understanding 1.4.11](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)).

**Check**
- *Script:* each elevation level has a surface value per mode, not only a shadow.
- *Judgement:* can a reader tell from the name which surfaces sit above which?

**Sources:** files as linked; the DTCG `shadow` type is an object or an array of `{color, offsetX, offsetY, blur, spread, inset}` ([DTCG Format 2025.10](https://www.designtokens.org/tr/2025.10/format/)).

## Typography, layers, opacity and breakpoints

**What good looks like**
- [moderate] Text is applied through composite style tokens, with atomic size, line-height and weight below them: Atlassian 3.0.0 removed `font.size.X`, `font.lineHeight.X` and `font.letterSpacing.X` because "Typography should be applied via composite tokens, i.e. `font.heading.X` and `font.body.X`" ([Atlassian changelog](https://cdn.jsdelivr.net/npm/@atlaskit/tokens@20.14.0/CHANGELOG.md)); Primer ships `--text-body-shorthand-medium` beside atomic `--text-title-size-large`; Spectrum's `component-xs-regular` holds `{fontFamily, fontSize, fontWeight, letterSpacing, lineHeight}`. Naming the styles themselves is [the naming text styles research](../../research/foundations/naming-text-styles.md); the code side is [figma-handoff: text styles to type tokens](figma-handoff.md#text-styles-to-type-tokens).

**How**
- [moderate] **Type names:** role then size (Polaris `--p-text-heading-2xl-font-size`; Gestalt `--sema-font-size-heading-xs`; TDesign `--td-font-body-medium`); role then index (Carbon `$body-01`, `$heading-compact-02`; Fluent `body1Strong`, `title3`); role then property (Material `md.sys.typescale.body-large.size`). Carbon v11 renamed `body-short-01` → `body-compact-01` and `productive-heading-0N` → `heading-compact-0N`.
- [weak] **Locale-aware type:** Gestalt ships per-script line-height files (`-ja`, `-th`, `-vi`) ([Gestalt `-ja`](https://cdn.jsdelivr.net/npm/gestalt-design-tokens@177.0.12/dist/css/vr-theme/font-lineheight-ja.css)) that redefine `--sema-font-lineheight-body-md`.
- [moderate] **Layers (z-index):** by role (Primer `--zIndex-modal`, `-sticky`, `-skipLink` over a numbered `--base-zIndex-*`; Fluent `zIndexPopup`, `zIndexMessages`; EUI `flyout`, `toast`) or by number (Paste `--z-index-0` … `90`; Polaris `--p-z-index-0` … `12`; Open Props `--layer-1` … `5`). DTCG has no z-index type.
- [moderate] **Opacity:** primitives by value (Gestalt `--sema-opacity-40`; GitLab `GL_OPACITY_0` … `10`), semantics by state (Canvas `--cnvs-sys-opacity-disabled`; Material `state-layer-opacity`; Spectrum `background-opacity-hover`); words in Telekom (`semi-transparent`, `translucent`).
- [moderate] **Breakpoints:** size words (Tailwind, Polaris `--p-breakpoints-xs`), devices (GOV.UK `mobile`, `tablet`, `desktop`; USWDS `tablet-lg`), numbers (PatternFly `--breakpoint--100` … `600`, with `250`, `350` inserted). Canvas ships `breakpoints-l` and `breakpoints-lg`, both 1024px.
- [moderate] **Target size as a token:** NL `basis.pointer-target.min-block-size` (48px in its start theme); Primer `--control-minTarget-coarse`.

**Cases**
- A team ships atomic font tokens only, and screens combine them freely → the composite style is what stays consistent (Atlassian 3.0.0).

**Accessibility**
- [required] Units are code-standard rule 54's; line height is [line height and letter spacing](../../research/foundations/line-height-letter-spacing-figma-to-css.md)'s. A target-size token serves WCAG 2.2 2.5.8.

**Check**
- *Script:* flag a component that sets font size and line height from separate atomic tokens where a composite exists.
- *Judgement:* does each category name its steps the same way as the others?

**Sources:** files as linked; DTCG composite types `typography`, `border`, `transition` and `shadow` ([DTCG Format 2025.10](https://www.designtokens.org/tr/2025.10/format/)).

## What makes a taxonomy last

**What good looks like**
- [moderate] Polaris, Primer, Atlassian and Spectrum each publish a written grammar or decision record, deprecation metadata naming the replacement, and lint rules or codemods (below).

**How**
- [strong] **Written grammar and decisions:** Polaris's formula, Primer's ADRs (`default` in names, prefix, naming, variant words, structure, [Primer ADRs](https://github.com/primer/primitives/tree/main/contributor-docs/adrs)), Codex's ADRs ([Codex ADRs](https://github.com/wikimedia/design-codex/tree/main/packages/codex-docs/docs/using-codex/adrs)), Spectrum's taxonomy spec, Fluent's naming page, NL's design-token handbook.
- [strong] **One word per meaning:** Primer ADR-009: "`muted` is used universally to mean 'secondary'… The term `subtle` is being deprecated" ([ADR-009](https://github.com/primer/primitives/blob/main/contributor-docs/adrs/adr-009-color-token-name-variants.md)); Polaris renamed `subdued` to `secondary` one major after introducing it (`--p-color-text-subdued` → `--p-color-text-secondary`); Atlassian replaced `highEmphasis`, `mediumEmphasis`, `lowEmphasis` with default, `subtle`, `subtlest`; Spectrum aliased `negative-subdued-background-color-*` to `negative-subtle-*`.
- [strong] **Deprecation a machine can read:** Spectrum puts `deprecated_comment` and `renamed` on each deprecated token; Primer's `$deprecated` names the replacement, `null` meaning none, and its build writes `deprecated.json` (62) and `removed.json` (426: 258 with a replacement, 168 without); Atlassian's `replacement-mapping.js` drives ESLint autofix ([Atlassian replacement mapping](https://cdn.jsdelivr.net/npm/@atlaskit/tokens@20.14.0/dist/cjs/artifacts/replacement-mapping.js)); Salesforce ships `deprecatedStylingHooks.json` (558) and maps 1,872 Aura tokens ([SLDS metadata](https://cdn.jsdelivr.net/npm/@salesforce-ux/sds-metadata@2.264.1/dist/)); DTCG `$deprecated` takes true or a reason, and can sit on a group ([DTCG Format 2025.10](https://www.designtokens.org/tr/2025.10/format/)).
- [strong] **Lint and codemods:** Atlassian ESLint `ensure-design-token-usage`, `no-deprecated-design-token-usage`, `no-unsafe-design-token-usage`, and `yarn eslint --fix` for the 1.0.0 migration ([Atlassian, use tokens in code](https://atlassian.design/foundations/tokens/use-tokens-in-code)); Polaris [`@shopify/polaris-migrator`](https://www.npmjs.com/package/@shopify/polaris-migrator) codemods and [`@shopify/stylelint-polaris`](https://www.npmjs.com/package/@shopify/stylelint-polaris); Salesforce [`@salesforce-ux/slds-linter`](https://www.npmjs.com/package/@salesforce-ux/slds-linter); Style Dictionary's v4 migration ([guide](https://github.com/style-dictionary/style-dictionary/blob/main/docs/src/content/docs/versions/v4/migration.md)).
- [moderate] **A staged lifecycle:** Atlassian moves tokens deprecated → deleted → sunset → removed, removing in major versions only; 1.0.0 removed 102 tokens and cut theme files by 62% ([Atlassian 1.0.0 announcement](https://community.developer.atlassian.com/t/upcoming-changes-in-design-tokens-1-0-0-action-required-soon-edit-now-live/66243)). Spectrum: mark deprecated, alias to the replacement, remove at a later major ([Spectrum README](https://cdn.jsdelivr.net/npm/@adobe/spectrum-tokens@15.7.0/README.md)).
- [moderate] **Promotion rules for tiers:** Codex keeps component tokens as "exceptions, meant for single-use cases" and promotes a reused one to a decision token; each tier references only the one below, and only option tokens hold raw values ([Codex ADR 08](https://github.com/wikimedia/design-codex/blob/main/packages/codex-docs/docs/using-codex/adrs/08-adr-color-modes.md)). NL starts broad on purpose: "easier to delete unused tokens than to keep adding", and lets `accent-2` alias `accent-1` until an organisation needs them apart.
- [moderate] **Brand as an input, not new names:** Fluent's `createLightTheme(brand)` over a 16-stop ramp; Ant's seed with composable `darkAlgorithm` and `compactAlgorithm` ([Ant customize theme](https://ant.design/docs/react/customize-theme)); Workday's brand tier, overridden per tenant; NL's shared middle tier, so components move between organisations.
- [weak] **Keep theme axes independent:** the DTCG Resolver Module counts resolutions as the product of each modifier's contexts (three modifiers of 4, 3 and 2 give 24) and warns that modifiers setting the same token are "non-orthogonal" ([DTCG Resolver 2025.10](https://www.designtokens.org/TR/2025.10/resolver/)). Paste multiplies brand and mode into five named theme builds; Atlassian ships 19 theme artifacts.
- [weak] **A shared middle tier across organisations:** NL's basis tokens let components be exchanged between Dutch government bodies, each keeping its own brand-tier words ([NL design tokens](https://github.com/nl-design-system/documentatie/blob/main/docs/handboek/huisstijl-vastleggen/design-tokens.mdx)).

**Cases**
- Volume at the component tier: Spectrum's v11 tokens (now `@adobe/spectrum-tokens-deprecated`) covered "every possible combination of component options" and the package was 435,710,560 bytes; 12.0.0 had 1,064 tokens in 657,313 bytes ([npm 11.8.0](https://registry.npmjs.org/@adobe/spectrum-tokens-deprecated/11.8.0); [npm 12.0.0](https://registry.npmjs.org/@adobe/spectrum-tokens/12.0.0)). The 14.3.0 deprecation is in [tokens: three tiers](tokens.md#three-tiers).
- Low adoption: Polaris found about 8% typography-token coverage in custom components, teams "creating new components or hard coding css values" ([Polaris v10 typography](https://github.com/Shopify/polaris/blob/main/polaris.shopify.com/content/previous-releases/version-10-typography.mdx)); Polaris v10 answered with a `Text` component.
- A value bug inside a deprecation: Atlassian 0.10.12 swapped `color.interaction.hovered` and `.pressed`, "mistakenly mapped inversely in light and dark mode" ([Atlassian changelog](https://unpkg.com/@atlaskit/tokens@1.0.0/CHANGELOG.md)).
- Words that collide in a migration: Polaris's renumbered scales overlapped old names, so migrations ran in four steps (see [scale naming](#scale-naming-for-size-space-radius-and-the-rest)).
- A private palette, softened: Polaris v11 made palette tokens private; v12 allowed them "when no semantic token is a good fit" ([Polaris v12](https://github.com/Shopify/polaris/blob/main/polaris.shopify.com/content/previous-releases/version-12.mdx)). The KB item on hiding the palette is [contested](tokens.md#three-tiers).
- Two architectures side by side: Canvas ships two naming generations (`body-large` and `body-lg`); Swiss Post ships `hover` and `hovered`; EUI keeps legacy role-first keys (`emptyShade`) beside its new grammar.

**Accessibility**
- [weak] Atlassian fixed its input border's contrast as a value change under the same name, `color.border.input` (above).

**Check**
- *Script:* a project's lint flags a deprecated token and offers its replacement; a build fails on a name outside the grammar.
- *Judgement:* when a token is added, which slot word does it reuse, and who approves a new one?

**Sources:** the systems' own changelogs, ADRs and migration guides as linked. Commentary, not evidence: Curtis warns against homonyms, against globalising a decision before about three components need it, and that "Theme ≠ Mode" ([Naming tokens in design systems](https://nathanacurtis.substack.com/p/naming-tokens-in-design-systems-9e86c7444676)); Rupert's team capped CSS variables near 500 and calls every token a feature to maintain ([Every token is a feature](https://daverupert.com/2024/12/every-token-is-a-feature/)). Not opened: Nate Baldwin's essay on component-level tokens (Medium refused the fetch), the zeroheight 2025 report (PDF too large to read). No system published misuse counts before and after a rename.
