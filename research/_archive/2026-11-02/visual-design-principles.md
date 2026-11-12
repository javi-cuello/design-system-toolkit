# Visual design principles for a design system

What the major systems actually say about colour, emphasis, type, space, depth, shape, icons, motion, brand, charts and AI markers, and which parts of each a script can check and which need a person.

Researched October 2026. Every URL in this guide was opened in this session and every quote and number below comes from the page as fetched. Several starting points did not survive that check and were dropped or narrowed. Adobe Spectrum's button page returned a 404, so this guide does not claim Spectrum has a written "one accent button per view" rule; the attention-hierarchy claim rests on Adobe's own Spectrum 2 announcement instead. Refactoring UI's book is not freely readable and its Medium article returned a 403, so only the chapter and section titles published on refactoringui.com are cited. Material Design 3's documentation renders empty to a fetcher; its shape values come from the material-web token source on GitHub, and nothing else from Material is claimed. Atlassian's new colour page rendered empty; its older colour page and its `llms-tokens.txt` were used. GOV.UK's documentation turned out not to contain an explicit "do not restyle buttons" rule, and its default maximum page width is 1020px, not the 960px often quoted; both corrections are in the text. Practitioner writing is labelled as commentary wherever it appears, and so is anything that is this guide's own opinion.

---

## What this answers

A toolkit that builds and audits documentation sites, dashboards and tools makes visual decisions on every page it generates, and reports on visual decisions in every library it audits. Most of those decisions are already made somewhere in a mature design system. The useful work is knowing which ones, where they are written, and which can be turned into a check.

The sixteen sections run from colour and emphasis through type, space, depth, shape, icons, imagery and motion, to brand, charts and tables, and AI markers. Each section ends with what a check can see and what it cannot. Sections 17 and 18 are the cheat sheet and the short version.

---

## 1. Colour roles and semantics

**The short answer.** Name colours by job, not by hue. A token called `color.text.danger` survives a rebrand and a dark theme; a token called `red-600` survives neither. Reserve the meaning-carrying colours for meaning, and never let colour be the only signal.

Every large system now organises its palette in two layers: a raw palette of hues and steps, and a semantic layer that says what each colour is for. Components consume only the second layer.

**Atlassian is the cleanest example.** Its [colour foundation](https://atlassian.design/foundations/color) says "All color design tokens start with the word 'color', followed by the property that it's applied to", then modifiers. The machine-readable [token reference](https://atlassian.design/llms-tokens.txt) gives the full grammar as `color.<category>.<role>[.<variant>][.<state>]`: categories such as `background`, `text`, `icon` and `border`; roles `brand`, `danger`, `warning`, `success`, `discovery`, `information`, `neutral`, `selected` and `input`; variants `subtle`, `subtlest`, `bold`, `boldest` and `inverse`; states `hovered` and `pressed`. `color.text.danger` is `#CA3521` in light and `#FF9C8F` in dark. Each role has one sentence of purpose; brand is "for primary actions or elements that communicate the Atlassian brand". The page is explicit that teams pick a token rather than a shade, and that "if you are using design tokens, you shouldn't have to map your own values" for dark mode.

**Microsoft Fluent 2 splits by audience.** The [Fluent colour page](https://fluent2.microsoft.design/color) describes neutral colours as "the black, white, and grays that ground an interface", shared colours to be used "sparingly to accent and highlight important areas", brand colours with the warning "Avoid overusing brand colors or using them on large surfaces as they can dilute a hierarchy", and semantic colours that "should always convey important information". It also says plainly: "Don't use color as the only way to communicate."

**IBM Carbon keeps the role fixed and lets the value move.** Its [colour overview](https://carbondesignsystem.com/elements/color/overview/) states: "Color token names and roles are the same across themes, only the assigned value will change with the theme." The [colour usage page](https://carbondesignsystem.com/elements/color/usage/) groups tokens into numbered layer sets.

**GOV.UK takes the narrowest line.** Its [colour page](https://design-system.service.gov.uk/styles/colour/) says "Always use the GOV.UK colour palette", exposes functional colours through the `govuk-functional-colour` Sass function, and adds "Only use the variables in the context they're designed for". The focus colour is the extreme case: "Only use this colour to indicate which element is focused on." It also says "Do not copy the specific hexadecimal (hex) colour values".

**Apple names the failure directly.** The [HIG colour page](https://developer.apple.com/design/human-interface-guidelines/color) says "Avoid using the same color to mean different things".

The floor under all of this is [WCAG 1.4.1 Use of Color](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html), Level A: colour cannot be "the only visual means of conveying information, indicating an action, prompting a response, or distinguishing a visual element."

**Pros.** Theming becomes a value change, and an audit can ask "is this colour used for its job?" rather than "is this the right blue?".

**Cons.** Role names multiply, and every new role costs a value in every theme. Teams also drift into using a role token for its colour rather than its meaning, which no name can prevent.

**What a check can see.** Whether a fill or text colour is bound to a semantic token rather than a raw value or a palette step. Whether a semantic token is used on the property its name says (a `text` token on a fill is a finding). Contrast of each text and icon token against each surface token, in every theme. A status badge with no icon and no text label can be flagged. Whether a role is used for the right meaning needs a person.

**Recommendation.** Two layers, roles named by category and meaning, components bound only to roles. Write one sentence of purpose per role, as Atlassian does, and audit for bindings and contrast in every theme.

---

## 2. Emphasis and the attention budget

**The short answer.** One high-attention element per view. Emphasis is a budget: every bold, coloured or large thing spends some of it, and a page where everything is emphasised has none left for the thing that matters.

**Carbon says it in one sentence each.** From its [colour overview](https://carbondesignsystem.com/elements/color/overview/): "The core blue family serves as the primary action color across all IBM products and experiences", "The neutral gray family is dominant in the default themes", and "Additional colors are used sparingly and purposefully." Blue means action; grey is the ground; anything else has to argue its way in.

**Adobe Spectrum made it a headline of a redesign.** Adobe's [Spectrum 2 announcement](https://blog.adobe.com/en/publish/2023/12/12/adobe-unveils-spectrum-2-design-system-reimagining-user-experience-over-100-adobe-applications) lists "attention hierarchy" as a goal and describes it this way: "We removed extraneous highlight color in common controls, reserving it for the most high-action moments." Spectrum's [button data](https://opensource.adobe.com/spectrum-design-data/components/button/) defines the variant property as "Visual emphasis level".

**Apple gives the number.** The [HIG buttons page](https://developer.apple.com/design/human-interface-guidelines/buttons): "Keep the number of prominent buttons to one or two per view. Presenting too many prominent buttons increases cognitive load." It adds "Use style — not size — to visually distinguish the preferred choice among multiple options."

**GOV.UK says the same about calls to action.** Its [button page](https://design-system.service.gov.uk/components/button/): "Avoid using multiple default buttons on a single page", because more than one main call to action reduces their impact.

**Refactoring UI turns it into technique** (commentary). The book's chapter on hierarchy, as listed on [refactoringui.com](https://www.refactoringui.com/), runs "Hierarchy is Everything", "Not all elements are equal", "Size isn't everything", "De-emphasize to emphasize", "Separate visual hierarchy from document hierarchy" and "Balance weight and contrast". The practical point in "De-emphasize to emphasize" is the one most teams miss: when the primary thing does not stand out, turn the others down rather than turning it up.

**Pros.** A budget is easy to explain and easy to review. It keeps the primary action findable, and it keeps the accent colour meaningful.

**Cons.** "Per view" is fuzzy in a dashboard or a long docs page, where several regions each have a legitimate primary action.

**What a check can see.** The count of primary or accent-filled buttons per frame or per page, against a threshold the project sets. The count of distinct emphasis colours in a view. Whether two prominent buttons sit side by side. Whether the one emphasised element is the right one is judgement.

**Recommendation.** Write "one primary action per view, per region in a multi-region page" into the button guidance, count it in the audit, and when something does not stand out, de-emphasise its neighbours first.

---

## 3. Theming and dark mode: designed, not inverted

**The short answer.** A dark theme is a second design, not a filter. Backgrounds get dimmer and foregrounds brighter, but depth reverses its cue, saturated colours need new steps, and every image and icon needs checking.

**Apple is explicit that inversion is wrong.** The [HIG Dark Mode page](https://developer.apple.com/design/human-interface-guidelines/dark-mode): "The color palette in Dark Mode includes dimmer background colors and brighter foreground colors. It's important to realize that these colors aren't necessarily inversions of their light counterparts: while many colors are inverted, some are not." It sets a contrast floor: "no lower than 4.5:1 ... strive for a contrast ratio of 7:1, especially in small text." Depth is handled by two background sets: "The base colors are dimmer, making background interfaces appear to recede, and the elevated colors are brighter, making foreground interfaces appear to advance."

**Carbon builds the same idea into its layer order.** Per its [colour overview](https://carbondesignsystem.com/elements/color/overview/), the White theme "is layered first with components using Gray 10 backgrounds", while Gray 100 "is layered first with components using Gray 90 backgrounds". In light themes the layer above is darker; in dark themes it is lighter. The [themes page](https://carbondesignsystem.com/elements/themes/overview/) supplies the contract that makes this workable: "Each theme shares the same variables and roles, with only the value changing for each individual theme."

**Atlassian handles depth the same way.** Its [elevation page](https://atlassian.design/foundations/elevation): "Shadows can be harder to see in dark mode, so dark mode elevations also rely on different surface colors."

**Pros of designing it.** Contrast holds. Depth still reads. Status colours stay distinguishable.

**Cons.** Every colour decision is made twice, and every new token needs a dark value before it ships.

**What a check can see.** Contrast of every text, icon and non-text pair in both themes, which is the single most valuable deterministic check in this guide. Whether every colour token has a value in every mode. Whether any colour is hard-coded rather than bound. Whether surface lightness increases with elevation in the dark theme. Whether an illustration "looks good" in both is judgement.

**Recommendation.** One set of role tokens with a value per theme, contrast measured in every theme on every audit, and elevation expressed as lighter surfaces in dark themes.

---

## 4. Typography scale and hierarchy

**The short answer.** A small, named set of text styles, each a fixed combination of size, weight and line height. Hierarchy comes from contrast between a few steps, and from weight and colour as much as size.

**Apple defines the unit.** The [HIG typography page](https://developer.apple.com/design/human-interface-guidelines/typography): "A text style specifies a combination of font weight, point size, and leading values for each text size ... Taken together, the text styles form a typographic hierarchy you can use to express the different levels of importance in your content." It uses all three levers ("Adjust font weight, size, and color as needed to emphasize important information") and warns off thin weights: "avoid Ultralight, Thin, and Light font weights, which can be difficult to see, especially when text is small."

**Carbon separates product type from editorial type.** Its [typography overview](https://carbondesignsystem.com/elements/typography/overview/): "The productive type set is primarily used within product spaces", while the expressive styles "allow for a more dramatic, graphic use of type in editorial and marketing design" and "would be distracting if used in product." Productive styles end in `-01`, expressive in `-02`; "The productive type set uses fixed headings. Expressive headings are responsive." The scale comes from one formula starting at 12px, giving 12, 14, 16, 18, 20, 24, 28, 32, 36, 42, 48, 54, 60 and up.

**Fluent publishes the ramp with line heights paired.** The [Fluent typography page](https://fluent2.microsoft.design/typography) lists, for example, Body 1 at 14/20, Title 3 at 24/32 and Display at 68/92. On case: "Use sentence case when writing, it fits most contexts" and "Don't use all caps to get a user's attention because it's difficult to read."

**Pros.** Named styles make text auditable, keep Figma and code aligned, and stop the slow creep of one-off sizes.

**Cons.** A ramp that is too fine (Carbon's has 17 steps) invites choosing between neighbours that look the same. A ramp that is too coarse forces overrides.

**What a check can see.** Whether every text layer uses a named style. Whether any size, weight or line height sits off the ramp. Whether light weights appear below a size threshold. Whether headings use sentence case (a regex catches Title Case and all caps, with an allowlist for proper nouns). Heading levels in order. Whether the hierarchy reads correctly at a glance is judgement.

**Recommendation.** A productive ramp of a handful of styles for product and docs, each with paired line height, bound everywhere; sentence case; no light weights at body sizes. Add an expressive set only if the toolkit generates marketing pages.

---

## 5. Reading typography: measure and leading

**The short answer.** Keep body lines to roughly 45 to 80 characters, line spacing around 1.4 to 1.5, and more space between paragraphs than between lines. Express the measure in `ch` so it can be checked.

The sources agree closely:

| Source | Line length | Line spacing |
|---|---|---|
| [Butterick, *Practical Typography*, summary of key rules](https://practicaltypography.com/summary-of-key-rules.html) (commentary) | "45–90 characters (including spaces)" | "120–145% of the point size" |
| [WCAG 1.4.8 Visual Presentation](https://www.w3.org/WAI/WCAG22/Understanding/visual-presentation.html), AAA | "no more than 80 characters or glyphs (40 if CJK)" | "at least space-and-a-half within paragraphs", and paragraph spacing "at least 1.5 times larger than the line spacing" |
| [Baymard Institute](https://baymard.com/blog/line-length-readability) | "50–75 characters" | not covered |
| [GOV.UK layout](https://design-system.service.gov.uk/styles/layout/) | "no more than 75 characters per line" | not covered |

WCAG 1.4.8 also requires that text is "not justified". Baymard grounds its range in Emil Ruder's work and its own testing, in which users "immediately go back to a previous page when arriving at a page that includes long lines of text."

**GOV.UK gets the measure from layout, not from a property.** Its default is a two-thirds column, which "stops lines of text getting so long that the page becomes difficult to read on desktop devices."

**A note on units** (commentary). A measure set in `rem` or `px` holds a character count only for one typeface at one size. The toolkit's own docs site sets `--measure: 45rem`, which is 720px at the default root size; how many characters that holds depends on the body face. `max-inline-size: 70ch` states the intent directly and is measurable.

**Pros.** Well-evidenced, cheap to apply, and backed by an external reference in WCAG.

**Cons.** The ranges are for continuous prose. Tables, code and dashboards have different needs and should not inherit a prose measure. Body line spacing looks loose on large headings, which is why Fluent's ramp tightens the ratio as size grows.

**What a check can see.** The rendered character count per line of body paragraphs, at each breakpoint. Unitless line height against a range. Paragraph spacing against line spacing. Justified text. All four are deterministic in a browser. Whether a given block is "prose" needs a rule about which elements count.

**Recommendation.** `max-inline-size` in `ch` on prose elements, around 65 to 75; line height around 1.5 for body; paragraph spacing larger than line spacing; left-aligned. Measure it in the rendered page, not in the stylesheet.

---

## 6. Spacing scale and proximity

**The short answer.** Every gap comes from one scale, and the size of a gap says how related two things are. A heading belongs to what follows it, so the space above it must be clearly larger than the space below.

**Carbon's scale and its rule.** The [spacing overview](https://carbondesignsystem.com/elements/spacing/overview/) lists `$spacing-01` to `$spacing-13`: 2, 4, 8, 12, 16, 24, 32, 40, 48, 64, 80, 96 and 160px, built on "multiples of two, four, and eight." The rule: "There are always exceptions to the rule, but deviating from the spacing scales should be avoided whenever possible." On meaning: "Elements in a design that are near each other are seen as being meaningfully related."

**Atlassian's scale is the same shape.** Its [spacing page](https://atlassian.design/foundations/spacing) is "built around a base unit of 8 pixels", says "The distance between elements creates semantic meaning" and "Group related items close together", and requires that "Each space token should be used in place of the raw pixel or REM values."

**The principle underneath** is Gestalt proximity, summarised by [Laws of UX](https://lawsofux.com/law-of-proximity/) as "Objects that are near, or proximate to each other, tend to be grouped together".

**Worked example: a docs page heading that did not belong to its text.** The toolkit's docs site has an AI readiness report page made of sections, each a heading, a line of explanation and a table. The rule for a report section's children was one gap for all of them: `.report-section > * + * { margin-block-start: var(--space-24); }`. So the heading sat 24px from its line, and the line sat 24px from its table. Nothing in the spacing said the heading introduced the line any more than the line introduced the table; the three read as equal siblings. The site's ordinary `.section` already did this correctly, with 16px after an `h2`. The fix (commit `56a439c7`) was one rule, `.report-section > h2 + * { margin-block-start: var(--space-16); }`, with a comment saying why: "A heading sits with the text it introduces." Every value was on the scale before and after: the bug was relational, so a scale check could not catch it.

**Pros.** A scale removes thousands of small decisions and gives an audit a closed set to check against.

**Cons.** A scale says which values exist, not which to use where. Two spacings both on the scale can still contradict each other, as the example shows.

**What a check can see.** Every gap, padding and margin against the scale, in Figma (auto layout spacing and padding) and in CSS (computed values). The relationship can be checked too: for every heading, space above must exceed space below, and the gap between a heading and its first child must be smaller than the gap between sibling sections. Both are deterministic from computed styles. Whether a group of items is the right group is judgement.

**Recommendation.** One scale on a 4 or 8 base, used through tokens only. Add the relational check to the audit: heading space above strictly greater than space below, and heading-to-content smaller than section-to-section.

---

## 7. Density

**The short answer.** Offer a compact mode for data-heavy views, change spacing rather than type, and let the user choose. Do not ship compact as the only mode.

[Cloudscape](https://cloudscape.design/foundation/visual-foundation/content-density/), AWS's system, documents this most clearly. "Comfortable is the standard density level of the system, active by default." "Compact is an additional density level for data intensive views." In compact, "the spacing scale is reduced in increments of 4." And "Users are in control of choosing their preferred level of density within an application."

**Pros.** Experts on dashboards and tables see more rows without scrolling. Keeping type fixed keeps legibility and the type audit unchanged.

**Cons.** Every component needs both modes designed and tested, and compact spacing pushes interactive targets towards their minimum size. Carbon's [icon usage page](https://carbondesignsystem.com/elements/icons/usage/) sets "All touch targets for interactive icons need to be 44px or larger."

**What a check can see.** That compact values are themselves on the scale. That type tokens are identical across density modes. That target sizes stay at or above the project's minimum in compact. Whether a view needs compact is judgement.

**Recommendation.** Comfortable by default, compact as a mode on dashboards and tables only, implemented as a spacing token swap, with target sizes checked in both.

---

## 8. Layout, grid and responsive behaviour

**The short answer.** A small set of breakpoints treated as a ruler, a column grid with a fixed gutter, single column first, and a content width capped for reading.

**Carbon's 2x grid** "provides the geometric foundation for typography, layouts, icons, and illustrations", built on "the 8-pixel square mini unit", with "a total gutter of 32 pixels" ([2x grid overview](https://carbondesignsystem.com/elements/2x-grid/overview/)). Breakpoints are Small 320px (4 columns), Medium 672px (8), Large 1056px (16), X-Large 1312px (16) and Max 1584px (16).

**GOV.UK** recommends "either a 'two-thirds' or a 'two-thirds and one-third' layout", says "Design for small screens first, starting with a single-column layout" and "Design for different screen sizes rather than specific devices", and sets "The default maximum page width is 1020px" ([layout](https://design-system.service.gov.uk/styles/layout/)).

**Primer** says "Breakpoint sizes should be simply seen as a unit in a ruler" and lists 320, 544, 768, 1012, 1280 and 1400px, with viewport ranges narrow (below 768px, one column), regular (two columns) and wide (1400px and up, a third column only when needed). "Pages should adapt to smaller screens, without loss of functionality" ([layout](https://primer.style/foundations/layout)).

**Pros.** A shared grid aligns Figma frames with code; a capped content width solves the measure at page level.

**Cons.** Rigid 16-column grids suit dashboards better than docs. All three grids are viewport-based, which does not help a component inside a narrow container.

**What a check can see.** Breakpoint values in code against the documented set. Horizontal page scroll at 320px wide (also a WCAG reflow concern). Content width against the cap. Column gutter against the token. Whether the layout is right for the content is judgement.

**Recommendation.** Few breakpoints as a ruler, single column first, a two-thirds or capped content column for prose, and a 320px no-horizontal-scroll check on every generated page.

---

## 9. Elevation and depth

**The short answer.** Few levels, each a named pair of surface and shadow, used only for things that genuinely sit above the page. Most grouping should be done with space or a border, not a shadow.

**Atlassian names four levels.** Its [elevation page](https://atlassian.design/foundations/elevation) lists sunken, default, raised and overlay. "The highest two elevation surfaces, raised and overlay, are paired with shadows to create more depth", with the rule "Always pair `elevation.surface.raised` with `elevation.shadow.raised`." The usage rule worth copying: "Raised elevations can create visual noise, so don't use to group content when a border or white space would suffice." In dark mode, as section 3 noted, surfaces get lighter as they rise.

**Refactoring UI's depth chapter** (commentary) is listed on [refactoringui.com](https://www.refactoringui.com/) as "Emulate a light source", "Use shadows to convey elevation", "Shadows can have two parts", "Even flat designs can have depth" and "Overlap elements to create layers".

**Apple** uses base and elevated background colours for the same purpose in dark mode ([Dark Mode](https://developer.apple.com/design/human-interface-guidelines/dark-mode)).

**Pros.** Named levels give stacking a logic: a menu over a modal over a card.

**Cons.** Shadows are invisible in forced-colors mode and weak in dark mode, so anything that relies on a shadow alone to separate a surface fails for some users.

**What a check can see.** Every shadow bound to an elevation token. Raised and overlay surfaces paired with their own shadow. Surface lightness ordered by level in dark mode. A card that relies on shadow alone with no border or surface contrast. Whether a shadow is needed at all is judgement.

**Recommendation.** Three or four levels as surface-plus-shadow pairs, shadows only on things that float or move, and space or a border for grouping.

---

## 10. Shape and radius

**The short answer.** Tie radius to the size and role of the element: small for details, medium for controls, larger for containers. Keep the set small, and derive the focus ring's radius from the component's.

**Atlassian maps every step to a role.** Its [radius page](https://atlassian.design/foundations/radius): `radius.xsmall` 2px for "badges, checkboxes, avatar labels"; `radius.small` 4px for "labels, lozenges, timestamps, tags"; `radius.medium` 6px for "Interactive elements: buttons, inputs, text areas, selects"; `radius.large` 8px for "Containment elements: cards, in-page containers, floating UI, dropdown menus"; `radius.xlarge` 12px for modals and large containers; `radius.full` for avatars and pills. Each has a paired focus radius that is "always +2px greater", because the ring sits 2px outside.

**Material Web's shape tokens** follow the same idea at larger values. The [material-web token source](https://github.com/material-components/material-web/blob/main/tokens/versions/v0_192/_md-sys-shape.scss) defines `corner-extra-small` 4px, `corner-small` 8px, `corner-medium` 12px, `corner-large` 16px, `corner-extra-large` 28px and `corner-full` 9999px, with top-only, start and end variants. Material's own guidance on which component takes which corner was not readable and is not claimed here.

**Pros.** A role-based mapping makes radius checkable and gives a family resemblance across components. Paired focus radii remove one class of ring bugs.

**Cons.** Nested shapes need the inner radius reduced by the padding to look concentric, and neither page states this rule; it is a common practitioner technique (commentary). Radius is also a brand lever, so it is the token most likely to be overridden per product.

**What a check can see.** Every radius bound to a token. Each component's radius matching the role its category maps to. Focus ring radius equal to component radius plus offset. Inner radius not exceeding outer radius on nested elements. Whether the overall shape language suits the brand is judgement.

**Recommendation.** Four or five radius tokens mapped to element roles, a derived focus radius, and an audit that checks the mapping rather than only the binding.

---

## 11. Iconography

**The short answer.** One icon set, one stroke weight, a few sizes paired with type sizes, icon colour matched to adjacent text, and a text label or accessible name for every icon that carries meaning.

**Apple on consistency.** The [HIG icons page](https://developer.apple.com/design/human-interface-guidelines/icons): "all interface icons in your app need to use a consistent size, level of detail, stroke thickness (or weight), and perspective", and "In general, match the weights of interface icons and adjacent text." It covers optical centring and requires alternative text for custom icons.

**Carbon on sizes and colour.** The [icon usage page](https://carbondesignsystem.com/elements/icons/usage/): components "typically use icons on 16px artboards", with 20, 24 and 32px also allowed; 16 and 20px icons pair with 14 and 16px type. "Icons are always a solid, monochromatic color and need to pass the same color contrast ratio as typography (4.5:1)." "Do match your icon color with your text color when pairing them." And "Carbon v10 icons themselves do not have interaction states, only their backgrounds do." Carbon's 4.5:1 is stricter than WCAG 1.4.11's 3:1 for graphical objects.

**Pros.** Icons look designed rather than collected, and the audit is simple.

**Cons.** Icon-only controls are the most common accessible-name failure in any library. Optical adjustments cannot be checked by a script and drift as icons are added.

**What a check can see.** Icon size against the allowed set. Icons from one library (by component key or import path). Icon colour bound to the same token as adjacent text, or to an icon role. Contrast of icon against surface. An interactive icon without an accessible name. A touch target below the minimum. Recognisability and optical balance are judgement.

**Recommendation.** One set, sizes paired to the type ramp, colour inherited from the text it sits with, and an accessible name on every interactive icon, checked in code.

---

## 12. Imagery and illustration

**The short answer.** Use an image only when it does a job the words cannot. Text must carry all the information. Illustrations simplify, and they need designing for both themes.

**GOV.UK** is the strictest. Its [images page](https://design-system.service.gov.uk/styles/images/): "Avoid using images for unnecessary decoration. Only use images if there's a real user need", "written content must contain all the information the user needs", "All images should include the alt attribute, even if it's left empty", and "Use illustrations to show a simplified image of something complex. Use as few visual elements as possible to communicate your message."

**Carbon separates illustration from interface.** Its [pictogram usage page](https://carbondesignsystem.com/elements/pictograms/usage/): "Treat pictograms as illustrations with sufficient sizing", "Don't use pictograms as a replacement for UI icons, that is not their purpose", a minimum size of 48px, and "Pictograms on backgrounds must always pass color contrast requirements."

**Apple** shows an illustration on a dark background where "many details are lost", and asks for a separate dark asset when one image does not work in both ([Dark Mode](https://developer.apple.com/design/human-interface-guidelines/dark-mode)).

**Pros.** Meaning stays in text, where it can be searched, translated and read aloud.

**Cons.** Docs and onboarding pages can feel bare without any imagery, and an illustration set is expensive to maintain in two themes.

**What a check can see.** Every `img` has an `alt` attribute. Pictograms at or above their minimum size and never inside buttons. Image weight and dimensions. Whether a dark-theme variant exists. Whether an image is needed, and whether its alt text is good, is judgement.

**Recommendation.** No decorative images in product and docs pages; illustrations only to explain, with a dark variant; `alt` present on every image, empty when decorative.

---

## 13. Motion: purpose and duration

**The short answer.** Motion explains a change; it is not decoration. Short durations for small, frequent changes, longer for large ones, named easing for enter, exit and move, and a way to turn it off.

**Carbon gives the numbers.** Its [motion overview](https://carbondesignsystem.com/elements/motion/overview/) defines `duration-fast-01` 70ms, `duration-fast-02` 110ms, `duration-moderate-01` 150ms, `duration-moderate-02` 240ms, `duration-slow-01` 400ms and `duration-slow-02` 700ms. Easing comes in productive and expressive versions of standard, entrance and exit; productive standard is `cubic-bezier(0.2, 0, 0.38, 0.9)`. "Productive motion creates a sense of efficiency and responsiveness, while remaining subtle and out of the way." "Reserve expressive motion for occasional, important moments."

**Apple on purpose.** The [HIG motion page](https://developer.apple.com/design/human-interface-guidelines/motion): "Add motion purposefully, supporting the experience without overshadowing it. Don't add motion for the sake of adding motion." "Make motion optional." "In apps, generally avoid adding motion to UI interactions that occur frequently."

**The accessibility floor** is [WCAG 2.3.3 Animation from Interactions](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html), AAA: "Motion animation triggered by interaction can be disabled, unless the animation is essential", because movement on scroll "can trigger vestibular disorders." In CSS that means respecting `prefers-reduced-motion`.

**Pros.** Named durations and curves keep motion consistent and reviewable.

**Cons.** Motion is hard to specify in Figma and easy to over-produce in code. Expressive motion in a tool used all day becomes friction.

**What a check can see.** Every duration and easing bound to a token. No duration above a ceiling for UI feedback. A `prefers-reduced-motion` rule covering every animation and transition. No motion on scroll without that guard. Whether a motion helps understanding is judgement.

**Recommendation.** Productive tokens only for tools and docs, durations from the scale, reduced motion honoured globally, and no animation on frequent interactions.

---

## 14. Brand expression versus product UI

**The short answer.** In product UI, brand lives in a few deliberate places: the accent colour on the primary action, the typeface, the voice. Familiar components and content come first. A marketing page can be louder; a tool should not be.

**Fluent states both sides in its principles.** The [design principles page](https://fluent2.microsoft.design/design-principles) has "Built for focus" ("Our products shouldn't get in the way." "Less visual clutter and noise keeps people centered, calm, and confident.") next to "Unmistakably Microsoft" ("Your experiences should feel like one Microsoft." "A little personality goes a long way."). Quantity resolves it: a little personality, a lot of focus.

**Apple** says "Ensure branding always defers to content", "Express your brand with familiar components", and "Apply your app's accent color judiciously", suggesting brand colour in the content layer rather than on controls ([branding](https://developer.apple.com/design/human-interface-guidelines/branding)).

**GOV.UK** is often cited as forbidding restyled buttons. Its documentation does not say that in so many words. What its [extending and modifying components page](https://design-system.service.gov.uk/get-started/extending-and-modifying-components/) says is that overriding component CSS "will work in the short term but may break if you install an update", and that modifying components can make a service "less accessible". Its [button page](https://design-system.service.gov.uk/components/button/) records that "using green as the colour of start buttons improved click-through rates." The practical result is the same, a service does not restyle buttons, but the reasons are maintenance, accessibility and evidence, not brand policy.

**Carbon's productive and expressive split**, in both type (section 4) and motion (section 13), is the most usable mechanism: two named registers, with product spaces using the quiet one.

**Pros.** Restraint keeps tools learnable and keeps the accent meaningful. A named expressive register gives brand somewhere to go.

**Cons.** Product teams feel the restraint as blandness and push brand into components, which is where it is most expensive to maintain.

**What a check can see.** Overrides of component styles (any local style on an instance, any CSS targeting a component's internals). Brand-colour usage counted against the attention budget. Expressive tokens used on product pages. Whether the product "feels" on brand is judgement.

**Recommendation.** Brand through accent on the primary action, typeface and voice; components unmodified; an expressive register reserved for marketing and landing pages.

---

## 15. Data visualisation and tables

**The short answer.** Use a categorical palette in its published order, keep a colour tied to one series across a whole dashboard, use grey for context, and put a fixed set of attributes in columns rather than joining them into one cell.

**Carbon's palette order is the design.** Its [data visualisation colour page](https://carbondesignsystem.com/data-visualization/color-palettes/): "The colors of this palette should be applied in sequence strictly as described below. The sequence is carefully curated to maximize contrast between neighboring colors to help with visual differentiation." In light themes, sequential palettes put the darkest colour on the largest value.

**Carbon on dashboards.** The [dashboards page](https://carbondesignsystem.com/data-visualization/dashboards/): "Prioritize data by importance, then create a clear visual hierarchy", "The most important data should have the highest contrast and occupy the largest area", "Always use consistent colors for each data set within a dashboard".

**Datawrapper's practitioner guidance** (commentary, from a charting vendor) on [choosing colours](https://www.datawrapper.de/academy/what-to-consider-when-choosing-colors-for-data-visualization): "Consider the color grey as the most important color in Data Vis", "If you need more than seven colors in a chart, consider using another chart type or to group categories together" and "Don't use a gradient color palette for categories and the other way round."

**The accessibility floor** is [WCAG 1.4.11](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html): "Parts of graphics required to understand the content" need 3:1 against adjacent colours, with the exception that contrast is not required when "A graphic with text embedded or overlaid conveys the same information, such as labels and values on a chart" or the data is in a table. Direct labels are therefore both a readability and a conformance tool.

**Tables.** GOV.UK's [table component](https://design-system.service.gov.uk/components/table/): "Use the table component to let users compare information in rows and columns", "Never use the table component to layout content on a page", "align the numbers to the right in table cells", and use `<caption>` "in the same way you would use a heading."

**Worked example: a comma list that should have been columns.** The toolkit's AI readiness page lists components whose Figma description lacks a guidance section. There are exactly two such sections, "Usage or Don't" and "Code gen notes". The table had two columns, Component and Missing, and the Missing cell joined whichever sections were absent with a comma: "Usage or Don't, Code gen notes" for one row, "Code gen notes" for the next. A reader could not scan, count or sort by section. The fix (commit `56a439c7`) gave each section its own column, with "Missing" in the warning colour where it is absent and a muted dash where it is present. The rule generalises: when the possible values form a fixed, known set, each is a column; a comma list in one cell is right only when the set is open-ended, such as tags.

**Pros.** A fixed palette order makes charts consistent across a product without per-chart decisions. Columns make tables scannable, sortable and countable.

**Cons.** Strict palette order assigns colours by position, so filtering a series can reshuffle colours unless the mapping is pinned to the series.

**What a check can see.** Series colours taken from the categorical palette in its order. A series keeping its colour across every chart on a page. More than a threshold of categories in one chart. Adjacent-segment contrast, or direct labels present. Numeric columns right-aligned. A `caption` on every table. A cell whose text is a comma-joined list of values from a known enumeration. Whether a chart type suits the data is judgement.

**Recommendation.** One categorical palette used in order and pinned to series, grey for context, direct labels where possible, and columns for any fixed set of attributes.

---

## 16. AI-presence markers

**The short answer.** Mark AI-generated content with one consistent label that also opens an explanation. Use the AI visual style only to identify AI, never as decoration.

**Carbon for AI is the reference.** Its [guidelines](https://carbondesignsystem.com/guidelines/carbon-for-ai/) define the AI label as "a component used as an indicator of AI instances in the UI", and say "The AI label is the primary indicator to communicate that AI is present." The label is also the trigger for an explainability popover: "Each AI component is required to have an embedded AI label and explainability popover." Explainability is "a set of processes and methods that make AI decisions more comprehensible to humans." The visual style uses "light-inspired effects like brightness, glow, and gradients" as "a metaphor to 'illuminate' AI-generated content", with the rule "Don't use the Carbon for AI styling as decoration", because it is "strictly intended to identify any instances of AI being used in an experience."

No other system checked in this pass publishes a comparable pattern, so this section rests on one source.

**Pros.** A single marker makes provenance visible and gives users a consistent place to ask why. Reserving the style keeps it meaningful.

**Cons.** Glow and gradients are the kind of decoration the rest of this guide warns against; the cost is justified only while the style is never borrowed.

**What a check can see.** Every AI-generated region carries the label component. The label has an accessible name and opens its explanation. The AI style tokens appear only inside AI-labelled components. Whether content is AI-generated is a data question the page must answer, not something a visual check can infer.

**Recommendation.** One AI label component with an explanation behind it, the AI visual style restricted to labelled regions by an audit rule, and no AI styling on anything else.

---

## 17. Cheat sheet

| Topic | Ship this | Not this | Checkable |
|---|---|---|---|
| Colour | Role tokens by category and meaning | Palette steps in components | Binding, property match, contrast in every theme |
| Emphasis | One primary action per view or region | Several accent buttons | Count of prominent buttons |
| Dark mode | A designed second value per role | An inverted palette | Contrast, every token has a dark value, elevation lightness |
| Type scale | A few named styles with paired line height | One-off sizes | Every text layer on a style; sentence case |
| Reading | `max-inline-size` around 65 to 75ch, line height around 1.5 | A measure in px | Rendered characters per line |
| Spacing | One 4 or 8 based scale through tokens | Values off the scale | Values on scale; heading space above greater than below |
| Density | Compact as an optional spacing swap | Compact as the only mode | Same type tokens in both; targets above minimum |
| Layout | Few breakpoints, single column first, capped prose width | Device-specific layouts | No horizontal scroll at 320px |
| Elevation | Three or four surface-plus-shadow pairs | Shadows for grouping | Shadow bound and paired; dark lightness order |
| Radius | Tokens mapped to element roles | Per-component radius | Role mapping; focus radius derived |
| Icons | One set, sizes paired to type, colour from text | Mixed sets and weights | Size set, colour token, accessible name |
| Imagery | Only to explain; dark variant | Decoration | `alt` present; pictogram minimum size |
| Motion | Productive duration and easing tokens; reduced motion | Animation on frequent actions | Tokens bound; `prefers-reduced-motion` present |
| Brand | Accent on primary action, typeface, voice | Restyled components | Local overrides on instances |
| Charts | Categorical palette in order, pinned to series | Gradient for categories | Palette order; colour per series across charts |
| Tables | Columns for a fixed set of attributes | A comma list in one cell | Joined enumeration values in a cell |
| AI | One label with an explanation | AI glow as decoration | AI style only inside labelled regions |

---

## 18. The short version

Name colours by their job, bind components to those names, and measure contrast in every theme on every audit. That one check catches more real defects than any other in this guide.

Spend emphasis like money: one primary action per view, the accent for action only, grey for the rest. When the important thing does not stand out, turn down its neighbours.

Design dark mode: dimmer backgrounds, brighter foregrounds, lighter surfaces as they rise. Never ship an inversion.

Keep a small, named type ramp with paired line heights, sentence case and no thin weights at body sizes. Set the reading measure in `ch`, around 65 to 75, and check it in the rendered page.

Use one spacing scale, and remember that a scale only says which values exist. Proximity says which to use: a heading sits closer to its text than to the section above. The toolkit's own docs page got this wrong with every value on the scale.

Use shadows for things that float, radius mapped to element role, one icon set matched to its text, images and motion only to explain, with reduced motion honoured. Keep brand to accent, typeface and voice, and leave components alone. In charts, use the palette in its order and keep a series' colour across the dashboard. In tables, a fixed set of attributes is columns. Mark AI with one label and an explanation, and keep its glow for that alone.

**When something looks wrong, this is usually why.** A page where nothing stands out has spent its emphasis budget. A heading that floats between sections has equal space above and below. A dark theme that looks muddy was inverted. A paragraph that tires the eye is over 80 characters wide. A chart where two series look alike skipped the palette order. A table that cannot be scanned has a list in a cell.

---

## 19. What to re-check later

- **Spectrum's button guidance.** The page returned a 404 in this pass. If it is restored, confirm whether it states a per-view limit on accent buttons before citing one.
- **Material Design 3 guidance.** Only shape token values from material-web were verified. Material's density, elevation and motion guidance should be re-checked from a renderable source before being compared.
- **Atlassian's new colour page.** It rendered empty here; the older colour page and the token reference were used. Token names in Atlassian churn; confirm before quoting.
- **Refactoring UI.** Only the chapter titles on refactoringui.com were read. Anything beyond those titles attributed to the book should be checked against the book itself.
- **The relational spacing check and the comma-list check** are proposed here from two fixes on the toolkit's own docs site. Neither has yet run against another project's pages.
- **AI markers** rest on Carbon alone. Watch for other systems publishing a comparable pattern.

---

## Sources

**Primary: specifications and standards**

- [W3C, Understanding SC 1.4.1 Use of Color](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html). Colour never the only means.
- [W3C, Understanding SC 1.4.8 Visual Presentation](https://www.w3.org/WAI/WCAG22/Understanding/visual-presentation.html). 80 characters, space-and-a-half, paragraph spacing, no justification.
- [W3C, Understanding SC 1.4.11 Non-text Contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html). 3:1 for graphical objects and the chart exceptions.
- [W3C, Understanding SC 2.3.3 Animation from Interactions](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html). Motion can be disabled.

**Primary: design systems**

- [Apple HIG: Buttons](https://developer.apple.com/design/human-interface-guidelines/buttons), [Color](https://developer.apple.com/design/human-interface-guidelines/color), [Dark Mode](https://developer.apple.com/design/human-interface-guidelines/dark-mode), [Typography](https://developer.apple.com/design/human-interface-guidelines/typography), [Icons](https://developer.apple.com/design/human-interface-guidelines/icons), [Motion](https://developer.apple.com/design/human-interface-guidelines/motion), [Branding](https://developer.apple.com/design/human-interface-guidelines/branding). Read through the `developer.apple.com/tutorials/data/design/human-interface-guidelines/<page>.json` endpoints.
- [IBM Carbon: Color overview](https://carbondesignsystem.com/elements/color/overview/), [Color usage](https://carbondesignsystem.com/elements/color/usage/), [Themes](https://carbondesignsystem.com/elements/themes/overview/), [Typography](https://carbondesignsystem.com/elements/typography/overview/), [Spacing](https://carbondesignsystem.com/elements/spacing/overview/), [2x Grid](https://carbondesignsystem.com/elements/2x-grid/overview/), [Icons usage](https://carbondesignsystem.com/elements/icons/usage/), [Pictograms usage](https://carbondesignsystem.com/elements/pictograms/usage/), [Motion](https://carbondesignsystem.com/elements/motion/overview/), [Data visualisation colour palettes](https://carbondesignsystem.com/data-visualization/color-palettes/), [Dashboards](https://carbondesignsystem.com/data-visualization/dashboards/), [Carbon for AI](https://carbondesignsystem.com/guidelines/carbon-for-ai/).
- [Atlassian: Color](https://atlassian.design/foundations/color), [Spacing](https://atlassian.design/foundations/spacing), [Elevation](https://atlassian.design/foundations/elevation), [Radius](https://atlassian.design/foundations/radius), [Border](https://atlassian.design/foundations/border), [`llms-tokens.txt`](https://atlassian.design/llms-tokens.txt).
- [Microsoft Fluent 2: Color](https://fluent2.microsoft.design/color), [Typography](https://fluent2.microsoft.design/typography), [Design principles](https://fluent2.microsoft.design/design-principles).
- [GOV.UK Design System: Colour](https://design-system.service.gov.uk/styles/colour/), [Layout](https://design-system.service.gov.uk/styles/layout/), [Images](https://design-system.service.gov.uk/styles/images/), [Button](https://design-system.service.gov.uk/components/button/), [Table](https://design-system.service.gov.uk/components/table/), [Extending and modifying components](https://design-system.service.gov.uk/get-started/extending-and-modifying-components/).
- [GitHub Primer: Layout](https://primer.style/foundations/layout). Breakpoints and viewport ranges.
- [Adobe, Spectrum 2 announcement](https://blog.adobe.com/en/publish/2023/12/12/adobe-unveils-spectrum-2-design-system-reimagining-user-experience-over-100-adobe-applications) and [Spectrum design data, button](https://opensource.adobe.com/spectrum-design-data/components/button/). Attention hierarchy and the emphasis variant.
- [material-web, `_md-sys-shape.scss`](https://github.com/material-components/material-web/blob/main/tokens/versions/v0_192/_md-sys-shape.scss). Corner token values.
- [AWS Cloudscape: Content density](https://cloudscape.design/foundation/visual-foundation/content-density/). Comfortable and compact.

**Research and commentary, labelled as such in the text**

- [Baymard Institute, line length and readability](https://baymard.com/blog/line-length-readability). 50–75 characters and the testing observation.
- [Matthew Butterick, *Practical Typography*, summary of key rules](https://practicaltypography.com/summary-of-key-rules.html). Line length, line spacing, point size.
- [Laws of UX, Law of Proximity](https://lawsofux.com/law-of-proximity/). The Gestalt grouping principle.
- [Refactoring UI](https://www.refactoringui.com/). Chapter and section titles only.
- [Datawrapper Academy, what to consider when choosing colours](https://www.datawrapper.de/academy/what-to-consider-when-choosing-colors-for-data-visualization). Grey, seven colours, consistency, sequential versus categorical.

**Toolkit evidence**

- Commit `56a439c7` in the toolkit repository, `tools/docs/src/pages/overview/ai-readiness.astro` and `tools/docs/src/styles/site.scss`. Both worked examples.

**Not verified, and therefore not claimed**

- Spectrum's written rule on accent buttons per view (button page 404).
- Refactoring UI's body text, and its Medium article "7 practical tips for cheating at design" (403).
- Material Design 3's guidance pages, which render empty; only material-web shape token values are used.
- Any GOV.UK rule worded as "do not restyle buttons"; none was found.
