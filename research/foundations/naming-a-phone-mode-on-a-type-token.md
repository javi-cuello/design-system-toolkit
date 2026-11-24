# Naming a phone mode on a type token

When a type token's value differs on a phone and on a desktop, four shapes ship in real systems, and only one of them puts the device in a Figma mode alone.

A product library's tokens are being named. A page title is 48px on a desktop and 28px on a phone, and the first draft of the token reads `type-3xl-font-size-mobile` beside `type-3xl-font-size-desktop`. A colleague says the device belongs in a Figma mode, not in the name. Another says every shipped system seems to do something different. Which of them is right, and what does each choice write into the build?

---

## What this answers

- [Four shapes](#four-shapes): what shipping systems do with a phone value
- [One name, a set per device](#one-name-a-set-per-device): Spectrum
- [The device in the primitive's name](#the-device-in-the-primitives-name): Deutsche Bahn
- [Fluid and fixed pairs](#fluid-and-fixed-pairs): Pajamas and Carbon
- [What Figma and the formats allow](#what-figma-and-the-formats-allow): modes, DTCG, build tools
- [Which to choose](#which-to-choose): the draft names, judged

For a lookup, use the [cheat sheet](#cheat-sheet). What a phone should change is in [type on a phone](type-on-a-phone.md); this piece only names and structures the result. The rule that a platform keeps one role name is in [naming text styles, part 2](naming-text-styles-part-2.md#a-second-platform).

---

## Four shapes

A phone value is carried by one of four shapes: a set per device under one name, a device word in a primitive's name with an alias that hides it, a fluid and a fixed name side by side, or a mode file of overrides.

The toolkit's own rule is the first: a Mobile, Tablet and Desktop collection becomes Mobile on `:root` and the others from a breakpoint (code-standard rule 53), and a text style with modes is "a responsive type token" (`knowledge/code/figma-handoff.md`, text styles to type tokens). That is one answer, not the only shipping one. Reading four systems' published tokens gives these shapes:

| Shape | System | Phone value lives in | Consumers write |
|---|---|---|---|
| A set per device, one name | Spectrum | `sets: { desktop, mobile }` on `font-size-100` | `--spectrum-font-size-100` |
| Device in the primitive, alias on top | Deutsche Bahn | `--db-typography-regular-mobile-headline-3xl` | `--db-type-headline-3xl` |
| Fluid and fixed names | GitLab Pajamas, Carbon | `--gl-font-size-500` and `--gl-font-size-500-fixed`; `fluid-heading-05` and `heading-05` | whichever name fits the content |
| A mode file of overrides | Wikimedia Codex | `small.json` beside the defaults | the numeric name |

Spectrum's and Deutsche Bahn's rows are about a phone. The third and fourth are not, and the difference matters ([below](#fluid-and-fixed-pairs)).

---

## One name, a set per device

Spectrum names no device in the token and stores both values on it.

In the published source, `font-size-100` is a `scale-set` token whose `sets` hold `desktop` at 14px and `mobile` at 17px. The build writes two class scopes: `.spectrum--medium` sets `--spectrum-font-size-100: 14px` and `.spectrum--large` sets 17px. A component reads `--spectrum-font-size-100` and never learns which scope it is in; the page picks a scope.

The pairing is worth noticing: the source says desktop and mobile, the CSS says medium and large. The input names the device, and the output names the scale, which reads as a scale name rather than a device name (my reading; Adobe's docs were not checked for the reason). This is rule 53's shape with the output scoped by class instead of by media query. The size words `100`, `200` stay stable across both, which is the property [part 1's size words](naming-text-styles.md) ask for.

Use this when one product is built for both and the switch is made once, at the page or app level.

---

## The device in the primitive's name

Deutsche Bahn does put the device in a name, and gets away with it by never letting a component read that name.

Its foundations package ships values as `--db-typography-{density}-{device}-{type}-{size}`: `--db-typography-regular-mobile-headline-3xl` is `bolder 2rem/1.25 …` and the desktop counterpart is `bolder 5rem/1.2 …`. Each value is a whole `font` shorthand. A second layer, `--db-type-headline-3xl`, is re-pointed by a media query: below its `sm` breakpoint (768px) it is `var(--db-typography-regular-mobile-headline-3xl)`, then the tablet name, then the desktop one. Components use `font: var(--db-type-headline-3xl)` only.

Spacing follows the same logic and marks the exception in the name: `--db-spacing-responsive-regular-mobile-md` changes by device, `--db-spacing-fixed-regular-md` never does. Body `md` is `1rem` on both devices, so only the headline sizes and the larger body sizes differ.

So a device suffix is workable as a primitive tier when an alias drops it. What does not follow from this is that it is safe where consumers see it; the alias is what makes it safe. How the library models these in Figma is unchecked: the package ships CSS and Sass, not a Figma file I read.

---

## Fluid and fixed pairs

`-fixed` and `fluid-` mark whether a size responds, and neither marks a phone.

GitLab's Pajamas ships `--gl-font-size-500` as `clamp(1.125rem, 0.9027777778rem + 0.462962963vw, 1.25rem)` ("responsive level 3 headings") and `--gl-font-size-500-fixed` as `1.125rem`. Sizes 100 to 400 are plain `rem` in both. Its type page says the dynamic scale serves UI text and the fixed scale is for Markdown, user-written content, "sizes match the min of the dynamic scale". The suffix says "this content must not move", not "phone".

Carbon does the same by prefix: `$fluid-heading-05` and `$heading-05` are two names, and its fluid helper interpolates between breakpoints ([type on a phone](type-on-a-phone.md#stepped-or-fluid-sizes)).

If your draft's `-desktop` means "the value when there is room", this pair is the closest relative. If it means "pin it", `-fixed` is the shipped word. Either way the suffix marks behaviour, and a phone value still needs its own home.

Wikimedia's Codex is the fourth shape and answers a different question: a font mode there is a user-chosen base size (16px or 14px), kept as override files holding only the tokens that change. Its ADR names sizes with numbers "to avoid confusion across modes", since "small" in one mode may be "large" in another. That is the strongest published reason for numbers, and it applies equally to a phone mode.

---

## What Figma and the formats allow

Figma holds a phone mode, but never switches to it for you; the interchange format has a stable place for it; build tools are what write the shape.

- **Figma modes.** A collection has up to 10 modes on Professional and 20 on Organization; Enterprise is unlimited with extended collections. A mode is set on a frame, section or page, and "Auto" inherits from the parent. The help page describes no switch by width ([modes for variables](https://help.figma.com/hc/en-us/articles/15343816063383-Modes-for-variables)). A phone mode is therefore a design decision applied to a frame, not a behaviour. The preview gotcha for styles is in [part 2](naming-text-styles-part-2.md#figma-in-2026).
- **DTCG.** The 2025.10 Resolver module, a Final Community Group Report that calls itself stable and is not a W3C standard, defines modifiers with `contexts`. Its fourth example is a `size` modifier with small, medium and large contexts that map to mobile, tablet and desktop files. The Format module as far as I read it (to section 9.6) defines no modes; the rest is unchecked. So the format's own answer is one name and a context per device, which is Spectrum's shape.
- **Build tools.** The Style Dictionary transforms page I read says nothing about modes or themes; whether any built-in handles them is unchecked. Tokens Studio's theme documentation returned a 404 at the address tried, so its handling is unchecked. Rule 53's output (Mobile on `:root`, others from a breakpoint) is the toolkit's build, not a tool default.

---

## Which to choose

For a draft that names the device, keep the device out of the name consumers read, and decide where the pair lives before writing it.

The draft's `type-3xl-font-size-mobile` and `type-3xl-font-size-desktop` match Deutsche Bahn's primitive tier, with the size word `3xl` standing where its `headline-3xl` does. What the draft lacks is the alias layer: with only these two names, every component must choose a device, and a third device means touching every component. That is the case the colleague's rule guards against, and the evidence supports the guard more than the rule: a device name works where an alias hides it.

Two cheaper routes follow. One name with a Mobile mode, as in rule 53, writes `--type-3xl-font-size` once and re-points it. Or keep the two names as primitives and add `--type-3xl-font-size` as the one name components use. The first has less to maintain; the second keeps both values visible in the code, which suits a team that reads tokens in the browser more than in Figma.

Prefer one name with a mode, and let a device word appear only in a primitive tier an alias covers. **Components should read a name that carries no device.**

---

## Cheat sheet

| Decision | Write this | Not this | Why |
|---|---|---|---|
| What components read | `type-3xl-font-size` | `type-3xl-font-size-mobile` | One name survives a third device |
| Where a device word may sit | a primitive tier under an alias | a name a component uses | Deutsche Bahn's pattern |
| Marking what never changes | `-fixed` | `-desktop` | Pajamas: fixed names behaviour, not a device |
| Size words across devices | numbers or a stable scale | `small`, `large` | Codex: "small" moves between modes |
| Figma input | a Mobile mode on the collection | a second set of styles | Rule 53; the mode is set by hand on a frame |
| Output | Mobile on `:root`, others from a breakpoint | per-device names in components | Same value, one selector block |

---

## The short version

Four shapes ship. Spectrum stores a set per device under one name; Deutsche Bahn puts the device in a primitive's name and re-points one device-free alias by media query; GitLab Pajamas and Carbon mark fluid against fixed in the name; Codex keeps override files for a user-chosen scale. Only the first two are about a phone.

A device word in a token name is safe where an alias hides it and a cost where components read it. Take one name with a Mobile mode as the default, as the toolkit's build already does, and treat `-fixed` as a behaviour word, not a device word.

---

## What to re-check later

Researched November 2026.

- **Versions read.** `@gitlab/ui` 142.0.0 token CSS, `@db-ux/core-foundations` 6.4.1, `@adobe/spectrum-tokens` 15.9.1, `@spectrum-css/tokens` 16.0.2, `@carbon/type` 11.71.0, DTCG Resolver 2025.10.
- **Unchecked:** how Deutsche Bahn models these in Figma; Polaris, Primer and Atlassian token names for a phone value; Tokens Studio's handling; Style Dictionary's mode support; DTCG Format module after section 9.6.
- **The Codex ADR** is dated 2025-03-04 and describes a user-chosen base size, not a viewport.

---

## Sources

**Primary**

- [Adobe Spectrum tokens, `typography.json`](https://cdn.jsdelivr.net/npm/@adobe/spectrum-tokens@15.9.1/src/typography.json) and [`.spectrum--medium`](https://cdn.jsdelivr.net/npm/@spectrum-css/tokens@16.0.2/dist/css/medium-vars.css) / [`.spectrum--large`](https://cdn.jsdelivr.net/npm/@spectrum-css/tokens@16.0.2/dist/css/large-vars.css).
- [Deutsche Bahn UX, `_typography-placeholder.scss`](https://cdn.jsdelivr.net/npm/@db-ux/core-foundations@6.4.1/build/styles/density/_typography-placeholder.scss), [`default-variables.css`](https://cdn.jsdelivr.net/npm/@db-ux/core-foundations@6.4.1/build/styles/defaults/default-variables.css), [`_screen-sizes.scss`](https://cdn.jsdelivr.net/npm/@db-ux/core-foundations@6.4.1/build/styles/_screen-sizes.scss).
- [GitLab UI, `tokens.css`](https://cdn.jsdelivr.net/npm/@gitlab/ui@latest/dist/tokens/css/tokens.css) and [Pajamas, type fundamentals](https://design.gitlab.com/product-foundations/type-fundamentals).
- [Carbon, `@carbon/type` styles](https://cdn.jsdelivr.net/npm/@carbon/type/scss/_styles.scss).
- [Wikimedia Codex, ADR 13, alternate font modes](https://github.com/wikimedia/design-codex/blob/main/packages/codex-docs/docs/using-codex/adrs/13-adr-font-modes.md).
- [Figma Help Center, modes for variables](https://help.figma.com/hc/en-us/articles/15343816063383-Modes-for-variables) and [plan limits](https://help.figma.com/hc/en-us/articles/360040328273).
- [Design Tokens Community Group, Resolver module 2025.10](https://www.designtokens.org/tr/2025.10/resolver/) and [Format module draft](https://www.designtokens.org/tr/drafts/format/).
- [Style Dictionary, transforms](https://styledictionary.com/reference/hooks/transforms/).

**Toolkit knowledge base and sister pieces**

- `standards/code-standard.md` rule 53; `knowledge/code/figma-handoff.md` (text styles to type tokens); `knowledge/code/responsive.md` (fluid type); `knowledge/code/token-taxonomy.md` (size words across modes).
- [Type on a phone](type-on-a-phone.md), [naming text styles](naming-text-styles.md), [part 2](naming-text-styles-part-2.md).
