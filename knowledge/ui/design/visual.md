# Visual fundamentals

How an interface looks: layout, space, type, colour, theme, surface levels, emphasis, density, a dense tool's chrome, depth and shape, icons, imagery, motion, charts and tables, the states of controls, and reuse of the system. Each section is what an agent applies when it builds a page or a frame, and what it asks when it audits one. It serves design-standard's Visual area and two of its rules: design-standard rule 7 (a heading sits with what it introduces) and design-standard rule 9 (a control's own marks keep its inset). The principles it answers to most often are *Consistent, not uniform*, *As little as possible, and no simpler* and *For everyone, in any context*. Every claim links its public source. What is not a cited rule here is guidance, raised as a recommendation, never cited as a rule. How the code implements each decision is code-standard's; how a Figma component is built is figma-standard's.

---

## Layout and grid

**What good looks like**
- One page grid: a capped content width, a gutter either side, one element that centres it.
- A few breakpoints used as a ruler, chosen where the layout changes, never per device.
- Prose sits in a narrower column than tables and dashboards.
- At 320 CSS pixels wide the page scrolls in one direction only.

**How**
- Start with one column and add columns only when the content earns them. [GOV.UK layout](https://design-system.service.gov.uk/styles/layout/): "Design for small screens first, starting with a single-column layout", and for different screen sizes "rather than specific devices". Its default maximum page width is 1020px; its default reading column is two-thirds.
- Breakpoints: [Primer](https://primer.style/foundations/layout) lists 320, 544, 768, 1012, 1280 and 1400px and calls them "a unit in a ruler"; [Carbon's 2x grid](https://carbondesignsystem.com/elements/2x-grid/overview/) uses 320, 672, 1056, 1312 and 1584px on an 8px unit with a 32px gutter. Take the project's set; with none, intrinsic sizing first and a breakpoint only where something breaks ([responsive layout in code](../../code/responsive.md)).
- Align to one left edge per column. Every block that starts at a different x needs a reason a reader would see.
- Draw responsive frames at the narrowest supported width and one wide width at least; a design drawn at 1440px only has not decided anything about small screens.
- Content that appears and disappears keeps its space, so the layout holds still (design-standard rule 2).

**Cases**
- A docs page sets prose at the full 1280px container → cap the prose column (two-thirds, or a `ch` measure); tables and code may run wider. Long lines are the reading problem in *Typography*.
- A dashboard drawn only at 1440px → ask for or draw the 320px frame before building; the order of panels on one column is a design decision, and code keeps it (code-standard rule 2).
- A sidebar and content are positioned with different max widths per section → one container owns the width (code-standard rules 3, 11 and 46).
- A table is wider than the phone → it may scroll inside its own box; the page may not (WCAG 1.4.10 excepts data tables that need two dimensions).
- A designer adds a breakpoint at 834px "for iPad" → reject it unless the layout changes there; use the project's ruler.

**Accessibility**
- [1.4.10 Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html) (AA): no two-dimensional scrolling at 320 CSS pixels wide.
- [1.4.4 Resize Text](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html) (AA): text to 200% without loss, so fixed heights around text fail.
- Implementation: code-standard rules 2, 3, 11, 46 and 54.

**Build**
- The page grid is stated once, as a container component that owns max width and gutters (code-standard rules 11 and 46); each band is a landmark holding one container (code-standard rule 3).
- Breakpoints are Sass variables in rem with `@mixin from($bp)` (code-standard rule 54); a visual reorder never changes DOM order (code-standard rule 2).
- Detail: [responsive: intrinsic layout first](../../code/responsive.md#intrinsic-layout-first), [one page grid and one container element](../../code/responsive.md#one-page-grid-and-one-container-element) and [breakpoints](../../code/responsive.md#breakpoints).

**Check**
- *Script:* could measure horizontal page scroll at 320px, the content width against the project's cap, and breakpoint values in the stylesheet against the documented set.
- *Judgement:* does each column hold content that belongs side by side, and does the one-column order still tell the story?

**Sources:** GOV.UK, Primer and Carbon above. They disagree on breakpoint values; the toolkit takes the project's set and otherwise none until the layout needs one, because a breakpoint is a cost ([responsive layout in code](../../code/responsive.md)).

---

## Spacing scale and proximity

**What good looks like**
- Every gap, padding and margin comes from one scale, through tokens.
- Gap size says relatedness: the tighter the gap, the closer the relationship.
- A heading sits closer to its own content than to the section above it (design-standard rule 7).
- Siblings of one kind share one gap, so the page has a rhythm.

**How**
- One scale on a 4 or 8 base. [Carbon](https://carbondesignsystem.com/elements/spacing/overview/): 2, 4, 8, 12, 16, 24, 32, 40, 48, 64, 80, 96, 160px, and "deviating from the spacing scales should be avoided whenever possible". [Atlassian](https://atlassian.design/foundations/spacing) builds on 8px and says "Group related items close together".
- Order the gaps by level before choosing values: inside a control < between items in a group < heading to its content < between groups < between sections. Each step up is a visibly larger value on the scale.
- Space above a heading is strictly greater than space below it. A heading as far from its text as from the next block belongs to neither.
- A scale guarantees only that values exist. The bug in design-standard rule 7's evidence had every value on the scale: one shared 24px gap for heading, line and table. Check the relation as well as the value.

**Cases**
- A report section uses one `* + *` gap for heading, intro and table → give heading-to-intro the smaller step (design-standard rule 7); the intro then reads as the heading's and the table as the next block.
- A card has 16px padding and 16px between cards → the cards read as one surface; widen the gap between cards or narrow the padding so containment wins.
- A form puts the same gap between a label and its field as between fields → the label floats; label-to-field is the tightest gap in the form.
- A designer types 18px because 16 looked tight and 24 loose → use a scale value and adjust the neighbouring gaps instead; an off-scale value is a finding (code-standard rule 22; figma-standard rule 29 in a component).
- A list of filter chips sits 24px under its heading and 8px above the results → the chips read as part of the results; move them closer to the heading or set the gap to the results larger.

**Accessibility**
- [1.4.12 Text Spacing](https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html) (AA): content survives line height 1.5, paragraph spacing 2, letter spacing 0.12 and word spacing 0.16 times the font size. Boxes around text grow with it.
- Proximity is also how screen magnifier users, who see a small part at a time, tell what belongs together.

**Build**
- Every gap, padding and margin is a spacing token, or a literal with its reason (code-standard rule 22); `gap` on the flex or grid parent, not margins on children.
- The heading-to-content gap is a smaller step than the gap between sections, set by the parent, never per instance. Detail: [tokens: three tiers](../../code/tokens.md#three-tiers) and [figma handoff: auto layout to flex and grid](../../code/figma-handoff.md#auto-layout-to-flex-and-grid).

**Check**
- *Script:* could compare computed gaps with the scale, and for each heading assert space above > space below and heading-to-first-child < gap between sibling sections (a relational check proven so far on one docs site only). On Figma, auto-layout gaps and padding against the spacing variables.
- *Judgement:* does each gap say the right relationship; would a reader group these things the way the content does?

**Sources:** Carbon, Atlassian, and [Laws of UX, proximity](https://lawsofux.com/law-of-proximity/) (commentary). They agree; Carbon allows exceptions, and the toolkit treats an off-scale value as a question that needs a written reason.

---

## Typography

**What good looks like**
- A handful of named text styles, each a fixed size, weight and line height.
- Hierarchy from a few clearly different steps, using weight and colour as well as size.
- Body text 45 to 80 characters a line, line height around 1.5, paragraphs spaced more than lines, left-aligned.
- Sentence case; no light weights at body sizes.

**How**
- Ramp: take the project's styles. With none, a productive ramp in the shape of [Carbon's](https://carbondesignsystem.com/elements/typography/overview/) (12, 14, 16, 18, 20, 24, 28, 32…) or [Fluent's](https://fluent2.microsoft.design/typography) (Body 14/20, Title 3 24/32), keeping five to seven styles for a tool or docs site. Line height tightens as size grows.
- Hierarchy: adjacent levels should differ by more than one step, or by weight. [Apple](https://developer.apple.com/design/human-interface-guidelines/typography): "Adjust font weight, size, and color as needed", and avoid Ultralight, Thin and Light weights at small sizes.
- Measure: set prose with a `ch` maximum around 65 to 75, never above 80. Tables, code and dashboards do not inherit the prose measure.
- Leading: about 1.5 for body; paragraph spacing larger than line spacing; no justified text.
- Case: [Fluent](https://fluent2.microsoft.design/typography): "Use sentence case" and do not use all caps for attention. Small all-caps labels are a one-off unless the system defines them.
- Visual hierarchy may differ from document hierarchy: a card title can be an `h3` and look small. The heading level is code's (code-standard rule 1); the look is the style.
- **Line height by size.** It falls as size rises: body about 1.5 (Better Web Type: "usually between `1.3` and `1.7`", [5 keys](https://betterwebtype.com/5-keys-to-accessible-web-typography/); Pimp my Type: "around 1.5 to 1.6" on desktop, [line length and line height](https://pimpmytype.com/line-length-line-height/)); headings "between 110 and 120%" ([8 tips](https://betterwebtype.com/8-tips-for-remarkably-better-typography/)); small UI text and components "1.2 to 1.3", a one-line button sometimes 1 (Pimp my Type). In a tool, a line height on the 4px grid: 12/16, 13/20 or 14/20, 16/24, as Radix's ([Radix typography](https://www.radix-ui.com/themes/docs/theme/typography)) and Material's tokens do. Longer lines need more leading (the size, leading and measure "triangle", [Better Web Type](https://betterwebtype.com/triangle/)).
- **Space round headings from the line height.** Better Web Type uses "the line height as a base unit for every size, margin and padding" ([rhythm](https://betterwebtype.com/rhythm-in-web-typography/)) and wants the margin above a heading "at least 2x of the one below" ([8 more tips](https://betterwebtype.com/8-more-tips-for-remarkably-better-typography/)), which is design-standard rule 7 with a ratio.
- **Tracking.** All caps and small caps are always spaced out: Better Web Type "5 to 10%" (and "Always, ALWAYS letter-space uppercase", 8 tips); Pimp my Type starts at `letter-spacing: 0.1em` and never tightens caps ([spacing all caps](https://pimpmytype.com/spacing-all-caps/)). Large headings tighten "by 1 to 2% maximum" (8 more tips); Radix's ramp runs from +0.0025em at 12px to −0.025em at 60px. Tracking in `em`, so it follows the size.
- **Weights.** Avoid light weights at text sizes: "At font size sizes between 14 to 20 px or smaller, it soon looks too delicate" ([Pimp my Type, light fonts](https://pimpmytype.com/light-fonts/)). At small UI sizes "avoid too bold and too compressed styles" ([Pimp my Type](https://pimpmytype.com/fifa-2026-font/)): a dense tool uses regular and semibold (400 and 600, or 500), two weights, no third.
- **Figures.** Numbers that line up in columns or change in place take tabular figures: "the preferred spacing for columns of numbers, such as tables, price lists and listings", and anywhere "you don't want things to jump and bounce around"; proportional figures "blend in better with running text" ([Pimp my Type, iOS clock](https://pimpmytype.com/ios-clock/)).
- **One family.** "ask yourself the question if you really need another typeface… You can achieve a lot with only one typeface by using a different style" ([Pimp my Type, pairing](https://pimpmytype.com/pairing-fonts/)); "You simply can't go wrong by using the styles of one super family" ([Better Web Type, combining fonts](https://betterwebtype.com/guide-to-combining-fonts/)). A tool needs a UI sans and, at most, a mono for code and token names.

**Cases**
- A dashboard uses 13, 14 and 15px for three label levels → nobody can see the difference; collapse to two styles and separate them by weight or colour.
- A docs paragraph runs 110 characters at 1440px → cap the measure in `ch` and count the characters it renders: neither unit holds a fixed count across typefaces. A `ch` is the width of the zero, wider than an average letter in most sans faces; in Inter, `65ch` measured about 80 characters and `55ch` about 71–79.
- Title Case headings throughout → sentence case, keeping proper nouns.
- A light 300 weight is used for 14px body copy → regular weight; light weights fail legibility first at small sizes.
- Content pages render rich text flattened by the component reset → restore a prose scale (code-standard rule 7).
- Section labels in 11px uppercase with no tracking → sentence case at the label size; if the system keeps caps, track them 0.05 to 0.1em.
- A count column in a table jitters as values update → `font-variant-numeric: tabular-nums` on the column.
- A 32px page title keeps the body's 1.5 line height and its two lines drift apart → 1.1 to 1.2 for headings.

**Accessibility**
- [1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) (AA) contrast for text; figma-standard rule 32 in a component. Text at least 12px in a component: figma-standard rule 26.
- [1.4.8 Visual Presentation](https://www.w3.org/WAI/WCAG22/Understanding/visual-presentation.html) (AAA, adopted here as the target): at most 80 characters, space-and-a-half leading, paragraph spacing 1.5 times line spacing, not justified.
- [1.4.4](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html) and [1.4.12](https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html): sizes in rem (code-standard rule 54), no fixed heights around text.

**Build**
- A text style is its fields as tokens, applied whole with `@include text-style(name)`, sizes in rem (code-standard rule 54); prose gets a prose scale, not a reset (code-standard rule 7).
- Measure is a `max-inline-size` in `ch` on the prose column; heading level is markup, independent of the style (code-standard rule 1).
- Detail: [figma handoff: text styles to type tokens](../../code/figma-handoff.md#text-styles-to-type-tokens) and [responsive: fluid type](../../code/responsive.md#fluid-type).

**Check**
- *Script:* could measure rendered characters per line of body paragraphs at each breakpoint, unitless line height, paragraph spacing against line spacing, justified text, sizes off the ramp, and Title Case or all-caps headings. On Figma, every text layer on a named style (figma-standard rule 29).
- *Judgement:* at a glance, does the most important text read first and the rest in order?

**Sources:** line length disagrees: [Butterick](https://practicaltypography.com/summary-of-key-rules.html) 45–90 (commentary), [Baymard](https://baymard.com/blog/line-length-readability) 50–75, GOV.UK 75, WCAG 80. The toolkit aims at 65–75 and caps at 80, because 80 is the one external reference and the others sit under it. [Better Web Type](https://betterwebtype.com/5-keys-to-accessible-web-typography/) (55–65) and [Pimp my Type](https://pimpmytype.com/line-length-line-height/) (60–80) sit in the same band. Better Web Type gives caps tracking as both "5 to 10%" and "up to 5%"; the toolkit starts at 0.05em and judges by eye. Neither author sets a scale ratio for dense UI or a count of sizes; [one size scale per screen](#one-size-scale-per-screen) and [quiet chrome in a dense tool](#quiet-chrome-in-a-dense-tool) do.

---

## Colour roles and semantics

**What good looks like**
- Components use role tokens (text, background, border, icon by meaning), never palette steps.
- Each status colour means one thing and appears only for that meaning.
- Nothing is told apart by colour alone: a status has a word or an icon too.
- The accent marks action; neutral greys carry the rest.

**How**
- Two layers: a raw palette, and roles named by category and meaning, the grammar [Atlassian](https://atlassian.design/foundations/color) uses (`color.<category>.<role>[.<variant>][.<state>]`). Components bind only to roles. Token tiers and generation: [tokens and theming in code](../../code/tokens.md).
- Status roles: danger, warning, success, information, plus neutral. [Apple](https://developer.apple.com/design/human-interface-guidelines/color): "Avoid using the same color to mean different things." A red used for a brand flourish and for errors breaks both.
- Pair every status colour with a second cue: an icon of its own shape, a word ("Error", "Missing"), a pattern or a position.
- Links in running text carry an underline; colour alone needs a measured 3:1 against surrounding text ([G183](https://www.w3.org/WAI/WCAG22/Techniques/general/G183)), and an underline needs nothing.
- The use of colour in emphasis is a budget (see *Emphasis*); the use of colour in charts has its own palette ([data visualisation: colour by job](../patterns/data-visualisation.md#colour-by-job)).

**Cases**
- A status column shows coloured dots only → add the word, or an icon per status; colour can stay as the faster cue.
- A component's fill is `blue-600` → bind it to the role it serves; a palette step survives neither a rebrand nor a dark theme (figma-standard rule 28 for which role a fill takes).
- Success green is used for a "New" badge → a different role (information or neutral); green now means success everywhere.
- A text token is applied to a background → a finding on Figma (figma-standard rule 28) and in CSS; use the background role.
- An error message is red text only → add an icon and the word "Error" or a sentence that says it is one.

**Accessibility**
- [1.4.1 Use of Color](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html) (A): colour is never the only visual means.
- [1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) (AA): text 4.5:1, large text 3:1, unrounded; [1.4.11](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html) (AA): 3:1 for borders, icons and state indicators that identify a component. Component text: figma-standard rule 32.

**Build**
- Components read semantic role tokens only, never primitives ([tokens: three tiers](../../code/tokens.md#three-tiers)); tokens are generated, never hand-written (toolkit-standard §D 23; code-standard rule 23).
- A status carries its word or an icon in markup; links in running text keep `text-decoration: underline`. Colour functions: [CSS architecture: modern colour](../../code/css-architecture.md#modern-colour).

**Check**
- *Script:* could flag fills and text bound to raw values or palette steps, role tokens on the wrong property, contrast of each text and icon role against each surface in every theme, and a status element with no text or icon. figma-components-audit already checks text contrast in a component (figma-standard rule 32).
- *Judgement:* is each role used for its meaning, and is the second cue understandable on its own?

**Sources:** Atlassian, Fluent, Carbon, GOV.UK and Apple agree on roles. Carbon asks 4.5:1 for icons, stricter than WCAG's 3:1; the toolkit takes WCAG's 3:1 as the floor and 4.5:1 for an icon that stands in for text.

---

## Theming and dark mode

**What good looks like**
- One set of role tokens, with a designed value per theme.
- Dark surfaces get lighter as they rise; shadows are not relied on in dark.
- Contrast is measured in every theme, not inferred from the light one.
- Images and illustrations are checked, and given a dark asset where they fail.

**How**
- Theme by value, never by name: [Carbon](https://carbondesignsystem.com/elements/themes/overview/), "Each theme shares the same variables and roles, with only the value changing".
- Design the dark values. [Apple](https://developer.apple.com/design/human-interface-guidelines/dark-mode): dark colours "aren't necessarily inversions of their light counterparts"; contrast "no lower than 4.5:1", striving for 7:1 in small text.
- Elevation in dark: base surfaces dimmer, elevated surfaces brighter. [Atlassian](https://atlassian.design/foundations/elevation): "dark mode elevations also rely on different surface colors." Which surface takes which level is [surfaces and elevation levels](#surfaces-and-elevation-levels).
- Saturated status and accent colours usually need a lighter step in dark to keep contrast; check each, since a hue that passes on white can fail on near-black.
- In a Figma file, draw at least one screen in each mode before handoff; a pair that passes in Light can fail in Dark and nobody sees it (figma-standard rule 32).
- Code side: how themes are written is code-standard rule 53; native controls follow through code-standard rule 16.

**Cases**
- A dark theme made by inverting the palette → muddy surfaces and reversed depth; redesign the surface steps so raised layers are lighter.
- A card separated only by a shadow → invisible in dark and in forced colours; give it a surface step or a border.
- The brand blue primary button is unreadable on dark → a dark-mode value for the accent role with measured contrast for its label.
- A logo PNG with dark text on a transparent background → a dark asset, or a version that works on both.
- A token has a light value and no dark one → a finding before it ships; every role has every mode.
- A light brand hue (yellow, amber, lime) as the primary solid → its label takes the ramp's dark end, not white: white on a vivid yellow measures under 2:1 (1.4.3). The pairing is measured per mode, never copied from a darker brand (figma-standard rule 47).
- The same yellow solid in dark mode → keep it bright, at the ramp's light end (rest, hover and press on three adjacent light steps), with the label on the canvas step. The light-mode step number lands on a dark brown in the dark ramp and loses the button against the canvas (1.31:1 in one run).
- A yellow fill as a progress bar or a track indicator on white → a darker step of the hue in light mode: 1.4.11 asks 3:1 of a graphic that conveys state, and the brand step `#F7D84A` gives 1.4:1 on white. The brand step is fine in dark, where it is the light end.
- A yellow selection bar on a selected menu item → decorative when the item also changes weight or carries `aria-current`; the second cue meets 1.4.1, so the bar may stay at brand brightness instead of being darkened for 3:1.

**Accessibility**
- [1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) and [1.4.11](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html) in each theme.

**Build**
- Light on `:root`, Dark under `[data-theme="dark"]` and `prefers-color-scheme: dark`, semantic tokens as `var()` references to primitives (code-standard rule 53).
- `color-scheme: light dark` so native controls follow (code-standard rule 16); an image that fails in dark gets its own asset, swapped by the same theme switch.
- Detail: [tokens: themes and modes](../../code/tokens.md#themes-and-modes) and [accessibility: reduced motion and colour scheme in code](../../code/accessibility.md#reduced-motion-and-colour-scheme-in-code).

**Check**
- *Script:* could measure contrast of every text, icon and boundary pair per theme, that every colour token has a value per mode, and that surface lightness rises with elevation in dark. figma-standard rule 32 is checked by figma-components-audit for text in the mode each variant resolves to.
- *Judgement:* does the dark theme look designed: depth readable, status colours distinct, imagery intact?

**Sources:** Apple, Carbon and Atlassian agree. Apple's 7:1 for small text is a goal; the toolkit holds AA as the floor and treats 7:1 as worth reaching on dense dark screens.

---

## Surfaces and elevation levels

Which fill each surface takes (the page, a sidebar, a card, a menu or popover, a toast, a dialog, an input) and how that changes between light and dark: four named levels and a scrim. In dark a layer further forward is lighter; in light a forward layer stays white and its shadow and border carry the depth. It extends [theming and dark mode](#theming-and-dark-mode) and [elevation, borders, radius and shape](#elevation-borders-radius-and-shape) and restates neither; choosing between a dialog, drawer, popover or toast is [dialogs](../patterns/dialogs.md)'s job, the token mechanism [tokens: themes and modes](../../code/tokens.md).

**What good looks like**
- Four surface levels and one scrim, each a named role token with a value per theme: `surface-sunken`, `surface-page`, `surface-raised`, `surface-overlay`, and `scrim`. Each level also has a `-hover` and a `-pressed` value.
- Every surface takes its level from what it is (table below), never from what happens to look right on one screen.
- In dark, the lightness rises one step per level: sunken < page < raised < overlay. In light, raised and overlay are both white. Only the shadow and the border tell them apart.
- A floating surface never shares a fill with anything it can open over.

| Level | What goes on it | Dark | Light | Edge |
|---|---|---|---|---|
| `surface-sunken` | Wells under the page: code blocks, a preview stage, kanban columns, an inset table area, text inputs and selects | page − 1 step | page − 1 step (a light grey) | inputs: a control border at 3:1 |
| `surface-page` | The page canvas and the chrome docked to it: masthead, a docked sidebar, a toolbar | the darkest working level, never `#000` | white, or a near-white | a hairline between chrome and work |
| `surface-raised` | Cards, panels and table containers in the flow of the page; a sticky header over scrolled content | page + 1 step | white | a hairline, or a resting shadow |
| `surface-overlay` | Everything that floats over other UI: menus, popovers, rich tooltips, toasts, dialogs, a drawer laid over the page, a dragged item | page + 2 steps | white | a floating shadow **and** a border |
| `scrim` | The backdrop behind a modal dialog or modal drawer | black at 50–60% | ink at 30–50% | none |

**How**
- **One step in dark is about 0.03–0.04 OKLCH lightness.** The sources cluster there. Material 3's dark containers sit at HCT tones 6 → 10 → 12 → 17 → 22, which is OKLCH L ≈ 0.19 → 0.22 → 0.24 → 0.29 → 0.33. Atlassian's sunken → default → raised → overlay is `#161A1D` → `#1D2125` → `#22272B` → `#282E33`, or L ≈ 0.215 → 0.245 → 0.269 → 0.297, steps of about 0.025–0.03. Primer goes inset `#010409` → default `#0d1117` → overlay `#151b23`, L ≈ 0.10 → 0.18 → 0.22. Material 2's white overlay runs from 0% at 0dp to 16% at 24dp, `#121212` → about `#383838`, L 0.18 → 0.34 across ten levels. A step under 0.02 is lost on a dim screen. A step over 0.06 makes cards look like holes in reverse. Keep the whole climb from page to overlay to about 0.06, as Primer's 0.04 does. A toolkit dialog set 0.083 above its page (`#1f2229` on `#0e0f13`) was judged too light: it glowed against the page, and the sunken fields inside it, 0.12 below the dialog, read as black holes. The toolkit's sites now climb 0.058, with fields 0.077 below the dialog.
- **Derive the levels from the neutral ramp, don't pick them.** Take the project's neutral ramp (the [oklch-color-scale-system](../../../skills/oklch-color-scale-system/) skill's grey mode, or Radix's 12 steps). In dark, `surface-page` is step 1, `surface-raised` step 2, `surface-overlay` step 3, and each `-hover` is the next step up. Radix assigns steps 1–2 to "app background" and "subtle background", step 3 to a component's background, 4 to hover and 5 to pressed. `surface-sunken` sits one step below page. When a ramp has no room below step 1, it takes the page's L − 0.03 at the same hue and chroma.
- **A worked neutral** (hue 265, chroma 0.008), for scale only. Take the project's ramp, not these values:

  | Level | Dark OKLCH | ≈ hex | Light OKLCH | ≈ hex |
  |---|---|---|---|---|
  | sunken | `oklch(0.15 0.008 265)` | `#090b0f` | `oklch(0.965 0.005 265)` | `#f2f3f6` |
  | page | `oklch(0.18 0.008 265)` | `#101215` | `oklch(0.985 0.003 265)` | `#f8f9fa` |
  | raised | `oklch(0.21 0.008 265)` | `#16181c` | `oklch(1 0 0)` | `#ffffff` |
  | overlay | `oklch(0.24 0.008 265)` | `#1d1f23` | `oklch(1 0 0)` | `#ffffff` |
  | overlay-hover | `oklch(0.28 0.008 265)` | `#27292d` | `oklch(0.955 0.005 265)` | `#eef0f3` |

- **Never pure black for the page, with one exception.** Material 2: dark grey "instead of black, which increases visibility for shadows and also reduces eye strain for light text". Its baseline is `#121212`. The exception is Apple, whose iOS base `systemBackground` is black. There, elevation comes only from the "elevated" set (`#1C1C1E`, `#2C2C2E`, `#3A3A3C`). The system switches a popover or sheet "from base to elevated" when it comes forward. The toolkit follows Material and Atlassian on the web: page L ≥ 0.15, so a shadow and a sunken well still have somewhere darker to go.
- **Light mode carries depth with shadow and border, not lightness.** Atlassian's light `surface`, `surface-raised` and `surface-overlay` are all `#FFFFFF`, and only `surface-sunken` differs (`#F7F8F9`). shadcn's light `--background`, `--card` and `--popover` are all `oklch(1 0 0)`, while dark gives card and popover `oklch(0.205 0 0)` on a `oklch(0.145 0 0)` page. If the light page is a near-white grey, raised can be one step lighter (white). Overlay cannot go lighter than white, so its shadow does the work.
- **Shadows are kept in dark, only made darker and bordered.** Atlassian: "Shadows can be harder to see in dark mode, so dark mode elevations also rely on different surface colors". Raised and overlay still pair with their shadow tokens. Primer's dark resting shadow is `0 3px 6px #010409cc` (80% near-black), against 12% in light. Its dark floating shadow opens with a `0 0 0 1px #3d444d` ring, which is a border. Atlassian's dark overlay shadow does the same with a `0 0 0 1px #39424a` ring. A shadow at 15–25% black, the usual light value, does not show on an L 0.18 page. Use 50–80% in dark, or drop it and rely on the step plus the border.
- **A border on every overlay, in both themes.** In dark the border can be a light alpha: shadcn uses `oklch(1 0 0 / 10%)` for borders and `/ 15%` for inputs, and Primer's overlay border is `#3d444db3`. Forced colours drop shadows and fills but keep borders, so the border is what still outlines a menu there.
- **The scrim darkens. The dialog's lift does the separating.** Material 3's scrim is black at 0.32. Atlassian's `blanket` is `#091E427D` (49%) in light and `#10121499` (60%) in dark. Primer's backdrop is `#c8d1da66` in light and `#21283066` in dark, a translucent grey rather than black. A black scrim over a near-black page changes little. In dark, the dialog has to be at overlay level, lighter than anything behind it, and the scrim only quiets the page. Take 50–60% in dark so a raised card behind it does not compete with the dialog.
- **A sidebar is chrome, not a card.** A docked sidebar sits at `surface-page` with a hairline against the work. Material 3's standard (docked) navigation drawer is `surface`, the page colour. Its modal drawer, which lies over content, is `surface-container-low` at elevation level 1 with a scrim. Radix: sidebars and cards take steps 1–2 with a step-6 border. shadcn's `--sidebar` sits between page and card in both themes: `oklch(0.985 0 0)` on a white page in light, and the card value `oklch(0.205 0 0)` in dark. A dense tool may put its chrome one step off the work, lighter or darker ([visual: quiet chrome](#quiet-chrome-in-a-dense-tool)). Whatever the sidebar takes, a card or a menu inside it must be a level above it. A drawer that slides over the page is an overlay, with a scrim if it is modal.
- **Inputs go one level down, not up.** Primer and GitHub sink fields: a dark input is `bgColor-default` (`#0d1117`) inside an overlay (`#151b23`). Material 3's filled text field instead takes `surface-container-highest` (tone 22), lighter than the dialog it sits in. The toolkit sinks inputs, because a well reads as a place to put something and keeps the input's text at the highest contrast. Either way the field's border, not its fill, has to meet 3:1.
- **Toasts are overlays, with one exception.** A neutral toast is `surface-overlay` with the floating shadow and border. Material's snackbar and plain tooltip instead take `inverse-surface`: a light toast on a dark page and a dark one on a light page. That is a different role, not a fifth level. Use it only for the one short message that must outshout everything.

**Cases**
- A dark menu, popover or toast has the same fill as the card or sidebar it opens from, and a 15% black shadow → it reads as a hole in the card. Move it to `surface-overlay` with a dark-strength shadow and a border.
- A dialog at the card colour over a page full of cards → in dark the dialog is the same grey as the cards behind the scrim. Use `surface-overlay` for the dialog and 50–60% for the scrim.
- A mobile nav dropdown painted with the page colour, the lowest working level, while it hangs over content → `surface-overlay`.
- Cards inside a sidebar that has the card colour → the cards disappear in dark and keep only their hairline. Either the sidebar goes to `surface-page` or the cards go one level above it.
- A dark theme made by inverting the light ramp → raised layers end up darker than the page and depth reverses. Re-derive the levels from the dark ramp ([visual](#theming-and-dark-mode)).
- Material 3 light containers get *darker* as they rise (`surface-container-lowest` 100 → `highest` 90, so a dialog at `high` is tone 92 on a tone-98 page) → M3 couples container roles to emphasis, not elevation, and gives light-mode depth to shadow. Don't copy the light container tones as an elevation ladder.
- A secondary-text colour that passes on the page fails on a hovered menu item → measure the softest text on the highest level's hover state (below).

**Accessibility**
- **Text on every level, in every state.** [1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) is measured against the lightest dark ground a text role can sit on, which is `surface-overlay-hover`, not the page. Raising the levels in dark lowers text contrast on each. In the worked neutral, a muted text at OKLCH L ≈ 0.62 gets 5.2:1 on the page but 4.0:1 on overlay-hover, a fail. The softest text role needs L ≥ about 0.66 in dark. Material 2 sets the bar for body text at 15.8:1 on its highest (24dp) surface, for white at 87%.
- **Boundaries.** [1.4.11](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html) asks 3:1 of the edge that identifies a control: an input's border against the level it sits on. A surface step of 0.03 L is about 1.06:1, so it never carries a control's edge alone.
- **Halation and pure white.** Light text on near-black can appear to bleed for some readers, astigmatism especially, and Material and Apple both soften the extremes. Material 2's dark grey page and 87% white body text (60% medium, 38% disabled) do this. Apple: "Soften the color of white backgrounds" in content images, and "consider making content fully bright only when the rest of the visual context is also bright". Keep body text off pure `#fff` on a dark page (L 0.92–0.95 is enough) and keep the page off `#000`.
- **Forced colours.** Fills and shadows are replaced. Only a border survives to outline a menu, popover, toast or dialog, which is why every overlay keeps one.
- **Increase Contrast.** Apple and Material 3 both widen the steps under a contrast setting: M3's dark `surface-container-high` goes from tone 17 to 25, and `surface-bright` from 24 to 34. A `prefers-contrast: more` branch widens the level steps and strengthens borders. It never flattens them.

**Build**
- The levels are semantic tokens (`--surface-sunken`, `--surface-page`, `--surface-raised`, `--surface-overlay`, each with `-hover` and `-pressed`, plus `--scrim`), re-pointed per theme as code-standard rule 53 sets out ([tokens](../../code/tokens.md)). A component names the level, never a ramp step.
- Shadows pair with levels as tokens: `--shadow-raised` and `--shadow-overlay`, each with its own dark value at dark strength. The border goes in the token, as Primer's `0 0 0 1px` ring does, or as a separate `--border-overlay`. Shadow offsets stay px (code-standard rule 54).
- `dialog::backdrop { background: var(--scrim); }`, and the dialog box itself is `var(--surface-overlay)`.
- A popover or menu sets its fill from `--surface-overlay` wherever it is opened. It never inherits the container's.

**Check**
- *Script:* in each theme, every overlay selector (`[popover]`, `dialog`, `[role=menu]`, `[role=listbox]` pop-ups, toasts) resolves to the overlay level. Overlay L > raised L > page L > sunken L in dark. Every overlay has a border as well as a shadow. Every text role measures 4.5:1 (secondary 4.5:1, disabled exempt) on every level and its hover. The dark shadow's alpha is ≥ 0.4.
- *Judgement:* open a menu from a card inside a sidebar in dark mode. Can you see its edge without the shadow?

**Sources:** [Material 3 color roles](https://m3.material.io/styles/color/roles) (the page is script-rendered; tones are from [material-color-utilities `color_spec_2021.ts`](https://github.com/material-foundation/material-color-utilities/blob/main/typescript/dynamiccolor/color_spec_2021.ts), and component roles from [material-web tokens v0_192](https://github.com/material-components/material-web/tree/main/tokens/versions/v0_192): dialog `surface-container-high`, menu and rich tooltip `surface-container`, elevated card `surface-container-low`, filled card and filled text field `surface-container-highest`, standard drawer `surface`, modal drawer `surface-container-low`, snackbar and plain tooltip `inverse-surface`, scrim at 0.32). [Material 2 dark theme](https://m2.material.io/design/color/dark-theme) (`#121212`, the 0–16% overlay table, 87/60/38% text, 15.8:1). The overlay formula is `(4.5·ln(1+dp)+2)%` in [ElevationOverlayProvider](https://github.com/material-components/material-components-android/blob/master/lib/java/com/google/android/material/elevation/ElevationOverlayProvider.java), and grey-not-black is in [Android Dark.md](https://github.com/material-components/material-components-android/blob/master/docs/theming/Dark.md). [Apple HIG dark mode](https://developer.apple.com/design/human-interface-guidelines/dark-mode) (base and elevated) and [Apple HIG color](https://developer.apple.com/design/human-interface-guidelines/color) (primary, secondary and tertiary backgrounds, grouped). [Atlassian elevation](https://atlassian.design/foundations/elevation), with values from `@atlaskit/tokens` 4.5.0. [Primer primitives](https://primer.style/foundations/primitives/color), with values from `@primer/primitives` 9.1.1 `dark.css` and `light.css`. [Radix: understanding the scale](https://www.radix-ui.com/colors/docs/palette-composition/understanding-the-scale). [shadcn/ui theming](https://ui.shadcn.com/docs/theming). [Vercel Geist materials](https://vercel.com/geist/materials) names base, small, medium and large on the page and tooltip, menu, modal and fullscreen floating, but gives no values. [Linear's redesign](https://linear.app/now/how-we-redesigned-the-linear-ui) generates "background, foreground, panels, dialogs, and modals" elevations from base, accent and contrast in LCH, also without values. The sources disagree in three places, and the toolkit chooses each time. On pure black, Apple uses `#000` as its base and the others never do; the toolkit avoids it on the web. On inputs, Material raises them and Primer sinks them; the toolkit sinks them. On light-mode containers, Material darkens them as emphasis rises; the toolkit keeps light raised and overlay white and lifts them by shadow, as Atlassian and shadcn do.

---

## Emphasis and the attention budget

**What good looks like**
- One primary action per view; a region the person opened (a dialog, a side panel) may have its own ([actions: button hierarchy](../patterns/actions.md#button-hierarchy)).
- The accent colour appears where action is, and rarely elsewhere.
- Button roles are visibly ranked, as [actions: button hierarchy](../patterns/actions.md#button-hierarchy) maps them.
- When the important thing does not stand out, its neighbours are turned down.

**How**
- How many primaries and which button roles is [actions: button hierarchy](../patterns/actions.md#button-hierarchy); this section is the budget the buttons spend from.
- Order of levers, cheapest first: position, weight, colour, size. Colour spends the most budget.
- [Carbon](https://carbondesignsystem.com/elements/color/overview/): grey is dominant, blue is action, "Additional colors are used sparingly and purposefully."
- Refactoring UI's "De-emphasize to emphasize" (commentary, title only): mute secondary text and actions before enlarging the primary.

**Cases**
- A toolbar with Save, Publish and Export all filled → Publish primary, Save secondary, Export tertiary or in a menu.
- A dashboard with a primary button in each of four panels → one primary for the view; the panels' actions take a quieter role ([actions: button hierarchy](../patterns/actions.md#button-hierarchy)).
- Every table row has a filled "Edit" button → a text button or an icon button with a name; forty filled buttons spend the budget forty times.
- The primary action is lost among bold headings and coloured badges → turn down the badges and heading weight first.
- A destructive "Delete" styled as primary on a settings page → secondary or destructive variant, separated from the safe action.

**Accessibility**
- Hierarchy carried by colour alone fails [1.4.1](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html) for a reader who cannot see the hue; a secondary button needs a visible boundary at 3:1 ([1.4.11](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)) or a label that makes it a button.

**Build**
- Button rank is a variant attribute on the button component (`variant="primary"`), never a class or a page override (code-standard rules 9 and 38; [figma handoff: variants to attributes](../../code/figma-handoff.md#variants-to-attributes)).
- Accent colour comes only from the action role tokens ([tokens: three tiers](../../code/tokens.md#three-tiers)).

**Check**
- *Script:* could count primary or accent-filled buttons per page or frame against a project threshold, and flag two prominent buttons side by side.
- *Judgement:* is the one emphasised thing the right one, and can a first-time reader find it in a second?

**Sources:** Carbon and Refactoring UI as above; the one-primary sources and their disagreement are in [actions: button hierarchy](../patterns/actions.md#button-hierarchy).

---

## Density modes

**What good looks like**
- Comfortable by default; compact as an option for data-heavy views.
- Density changes spacing; type stays the same.
- Targets stay at or above the minimum in compact.

**How**
- [Cloudscape](https://cloudscape.design/foundation/visual-foundation/content-density/): comfortable is "active by default"; compact is "for data intensive views"; in compact "the spacing scale is reduced in increments of 4"; users choose.
- Implement compact as a swap of spacing tokens, one step down the scale; leave the type ramp untouched.
- Table row heights: [tables: density and row height](../patterns/tables.md#density-and-row-height).
- Compact never becomes the only mode of a product people read at length.

**Cases**
- A findings table needs more rows on screen → offer compact on that table, with a visible toggle that persists.
- A designer shrinks body text to 12px for compact → keep the type, reduce padding and gaps.
- Compact icon buttons become 20px → keep a 24px hit area (figma-standard rule 26).
- A docs site asks for compact → no; density is for scanning data, and prose suffers.

**Accessibility**
- [2.5.8 Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) (AA): 24 by 24 CSS pixels or enough spacing; figma-standard rule 26 holds 24px for components.

**Build**
- Compact is a mode, `[data-density="compact"]`, that re-points spacing tokens only; type tokens are untouched (code-standard rule 53).
- The target stays 24px in compact via padding or a pseudo-element hit area. Detail: [tokens: density](../../code/tokens.md#density) and [responsive: touch targets](../../code/responsive.md#touch-targets).

**Check**
- *Script:* could verify compact values are on the scale, type tokens identical across modes, and target sizes in both.
- *Judgement:* does this view need compact, or does it need less on it?

**Sources:** Cloudscape is the clearest; Carbon sets 44px for interactive icons on touch ([icons](https://carbondesignsystem.com/elements/icons/usage/)). The toolkit holds 24px as the floor (WCAG AA, figma-standard rule 26) and 44px for touch-first products.

---

## One size scale per screen

**What good looks like**
- A tool picks one size step (control height, text style, icon size, row height) and every region of a screen uses it: inspector, work area, matrix, header bar.
- Tiles, swatches and thumbnails are sized from that step, so a preview tile is never twice the height of the controls around it while their labels sit at caption size.
- A larger size is a deliberate emphasis on one thing (the primary action, the object's name), never the result of each region being drawn on its own.

**How**
- **Pair control height and text style once.** Carbon pairs them by name: a small button is for "32px small sized input fields", a medium one for "40px medium sized input fields", and "We do not recommend mixing different button sizes in button groups" ([Carbon button](https://carbondesignsystem.com/components/button/usage/)); "Be sure to use a consistent field height when pairing form components on the same page" ([Carbon text input](https://carbondesignsystem.com/components/text-input/usage/)). Apple: "As much as possible, use identical button heights for visual consistency" ([Apple buttons](https://developer.apple.com/design/human-interface-guidelines/buttons)).
- **Rows and bars follow the same step.** Carbon: a table's "column header row should always match the row size of the table", and pagination height "should always match the row height" ([Carbon data table style](https://carbondesignsystem.com/components/data-table/style/)). An inspect list's row, an editor's row and a matrix cell share one height ([property editors: read-only inspect list](../patterns/property-editors.md#read-only-inspect-list)).
- **Tiles pair with a text style.** Windows: "For multi-line lists, use Body and Caption from the type ramp, and 32epx icons", and grid items with icons take "Caption text that is center-aligned" ([Windows content basics](https://learn.microsoft.com/en-us/windows/apps/design/basics/content-basics)). Write the pairing down: a tile of N px takes text style X; a tile that grows takes the next style, or holds a smaller preview.
- **A product type set for tools.** Carbon's productive set is for "product spaces, where users benefit from a more condensed treatment", expressive styles "would be distracting if used in product" ([Carbon typography](https://carbondesignsystem.com/elements/typography/overview/)). A tool screen draws from five to seven styles ([typography](#typography)).
- **Density is one switch for the whole product.** Cloudscape: modes "are applied to the entire application, and in all regions… Don't apply compact mode to individual pages or standalone components" ([Cloudscape content density](https://cloudscape.design/foundation/visual-foundation/content-density/)); Spectrum's scale is "the overall size of all of the components on the page" ([Adobe, Spectrum workshop](https://developer.adobe.com/express/add-ons/docs/guides/learn/how_to/tutorials/spectrum-workshop/part3)). Material's density is set per component and "Applying density mixin on parent component does not automatically apply density to its children" ([Material density](https://github.com/material-components/material-components-web/blob/master/packages/mdc-density/README.md)), so a wrapper must pass the step down itself. A dense region inside a comfortable tool is [density modes](#density-modes)' compact, applied whole, not a per-region size.

**Cases**
- A variants matrix draws 160px preview tiles labelled in 11px caption, next to an inspector of 32px controls and 14px text → size the tiles from the tool's step (a cell a fixed multiple of the row height) and label them in the body or small style the inspector uses.
- A header bar uses 40px buttons over panels of 32px controls → one step: 32px in a dense tool, the object's name the only larger element.
- One panel was set compact and its neighbour comfortable → one density for the product, switched in one place.

**Accessibility**
- [2.5.8 Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html): the smallest step still gives 24 by 24 CSS pixels. [1.4.4 Resize Text](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html): heights grow with text, so a step is a minimum height, never a fixed one.

**Build**
- The step is a mode on the root (`[data-size="sm|md"]`, or the density mode) that sets control height, row height, icon size and the paired text styles as tokens; components read the tokens, never their own size prop per region (code-standard rule 53, code-standard rule 38).
- Tile and cell sizes are calculations from the row token (`calc(var(--row-height) * 4)`), not literals (code-standard rule 22). Detail: [tokens: density](../../code/tokens.md#density).

**Check**
- *Script:* could collect every interactive element's rendered height and every text node's font size on one screen and flag more than two control heights, or a text size off the paired styles; on Figma, the same over a frame's instances.
- *Judgement:* is each larger size an emphasis someone chose, or a region drawn on its own?

**Sources:** Carbon, Apple, Windows, Cloudscape, Spectrum and Material as linked. They agree on matched heights within a group and one density across an application; Material alone sets density per component. No source states the rule across regions or for tiles beside text; the toolkit extends Carbon's and Apple's same-height rule to the whole screen, with the Windows pairing as the one source for tiles.

---

## Quiet chrome in a dense tool

**What good looks like**
- The work is the brightest, most contrasted thing on screen; bars, panels and controls are neutral greys a step or two off the background. Figma's UI3 brief: "Center your ideas, not Figma's UI" ([Figma, behind the UI3 redesign](https://www.figma.com/blog/behind-our-redesign-ui3/)).
- One accent colour, spent on selection, focus and the one primary action; hover is a neutral step, never the accent.
- Groups made by space and one quiet fill or hairline, never boxes inside boxes.
- Every region draws from the same few values: one control height, two text sizes, one icon size, one control radius ([one size scale per screen](#one-size-scale-per-screen)).
- Emphasis by weight and text colour before size; a panel's headings are its body size, heavier.

**How**
- **Neutral steps with fixed jobs.** Radix Colors gives each step of a 12-step scale one job: "Step 3 is for normal states", "Step 4 is for hover states", "Step 5 is for pressed or selected states"; step 6 for "subtle borders on components which are not interactive", 7 for interactive ones, 8 for "stronger borders… and focus rings"; 11 "for low-contrast text", 12 "for high-contrast text" ([Radix, understanding the scale](https://www.radix-ui.com/colors/docs/palette-composition/understanding-the-scale)). Framer's editor exposes three text levels (`text`, `text-secondary`, `text-tertiary`), three backgrounds and one tint ([Framer plugin interface](https://www.framer.com/developers/interface)). Take the project's roles; keep three text levels and one accent.
- **The accent marks where the person is.** Apple's accent colour colours "buttons, selection highlighting, and sidebar icons" ([Apple colour](https://developer.apple.com/design/human-interface-guidelines/color)); Figma's plugin tokens keep blue for `border-selected` ("focused or selected inputs") and `bg-brand` ("blue primary button") beside separate neutral `bg-hover` and `bg-selected` families ([Figma plugin CSS variables](https://developers.figma.com/docs/plugins/css-variables)); Sketch's Big Sur redesign used one accent, "now orange, to match our brand colors" ([Sketch, Yes Sur](https://www.sketch.com/blog/yes-sur-behind-the-scenes-of-sketchs-macos-makeover/)). A selected row is an accent-tinted fill (Radix accent step 3 to 5) or a neutral fill with an accent mark, never both a fill, a border and bold text.
- **Controls show they are controls, quietly.** Figma moved away from "sharp edges, abstract icons, subtle affordances" because complex controls became "harder to parse", and gave UI3 "backgrounds on inputs, borders around dropdowns, rounded corners" (behind the UI3 redesign). A field is a filled neutral surface; its border strengthens on hover and turns accent on focus. A widely used community clone of Figma's UI draws a 24px text box with no visible border at rest, a border on hover and the selected colour on focus ([create-figma-plugin, commentary](https://github.com/yuanqing/create-figma-plugin)).
- **Group by space, then fill, then line.** Apple: group related items with "negative space, container shapes, or separator lines", and "adding nested boxes… can make your interface feel busy" ([Apple layout](https://developer.apple.com/design/human-interface-guidelines/layout); [Apple boxes](https://developer.apple.com/design/human-interface-guidelines/boxes)). Figma's `bg-secondary` is "a light grey fill for creating sections on top of a background" (plugin CSS variables). Inside a panel: one hairline (or 8px more space) between sections, no card around a section, no border around a row. A border identifies a control's edge or separates two regions; it does not decorate ([elevation, borders, radius and shape](#elevation-borders-radius-and-shape)).
- **Fewer chrome surfaces.** Apple: "Reduce the use of toolbar backgrounds and tinted controls", and "Minimize the number of groups… aim for a maximum of three" in a toolbar ([Apple toolbars](https://developer.apple.com/design/human-interface-guidelines/toolbars)). Bars and panels share one background, separated from the work by a hairline; the work area may sit one step lighter or darker.
- **A dense tool's sizes.** Sources give one ladder of small sizes. Controls: Radix's sizes 1, 2 and 3 are 24, 32 and 40px tall in every control (button, text field, segmented control; [Radix Themes source](https://github.com/radix-ui/themes/tree/main/packages/radix-ui-themes/src/components)); shadcn's small button and sidebar row are 32px (`h-8`) and its default 36px ([shadcn button source](https://github.com/shadcn-ui/ui/blob/main/apps/v4/registry/new-york-v4/ui/button.tsx)). Text: macOS sets body at 13pt with Callout 12 and Subheadline 11, and Headline is 13pt bold, the body's size at a heavier weight ([Apple typography](https://developer.apple.com/design/human-interface-guidelines/typography)); Material's Label small is 11/16, Label medium and Body small 12/16, Body medium 14/20 ([material-web type tokens](https://github.com/material-components/material-web/blob/main/tokens/versions/v0_192/_md-sys-typescale.scss)); Radix's size 1 is 12/16 and size 2 14/20 ([Radix typography](https://www.radix-ui.com/themes/docs/theme/typography)); the Figma clone uses Inter at 11 and 12px, 400 and 600, line height 16px (create-figma-plugin, commentary). The toolkit's default for a dense web tool: controls and rows 32px (24px in compact), labels and secondary text 12/16, values and body 13/20 or 14/20, panel and section headings the body size at 600; icons 16px in a 24 or 32px control ([iconography](#iconography)).
- **Spacing on a 4px base, few values.** Radix's space scale is 4, 8, 12, 16, 24, 32, 40, 48, 64 ([Radix spacing](https://www.radix-ui.com/themes/docs/theme/spacing)); its card pads 12 or 16px at sizes 1 and 2 (source). A panel uses 12 or 16px side padding (one value for every panel), 4 or 8px between rows, 16 or 24px between sections.
- **Radius from one small scale.** Radix's radius steps are 3, 4, 6, 8, 12, 16px, multiplied by one product-wide factor (Radix Themes radius source); Material's run 4, 8, 12, 16, 28 ([material-web shape tokens](https://github.com/material-components/material-web/blob/main/tokens/versions/v0_192/_md-sys-shape.scss)). In a dense tool: 4 to 6px on controls, 8px on popovers and panels that float, 12px on dialogs; fixed panels are square.
- **Panels fixed, resizable, never floating over the work.** Figma reverted floating panels because they "hindered people who spend many hours a day in Figma" and "cramped the canvas"; "panels are fixed, but still resizable" ([Figma, our approach to UI3](https://www.figma.com/blog/our-approach-to-designing-ui3/)); Sketch kept "fixed sidebars that felt less distracting in the context of a canvas-based design tool" ([Sketch, a tour of Copenhagen](https://www.sketch.com/blog/a-tour-of-copenhagen/)). Widths: [sidebars: showing and hiding panels in a tool layout](../patterns/sidebars.md#showing-and-hiding-panels-in-a-tool-layout).
- **Refine by removing.** Figma "started with extreme changes, stripping away features until they were missed… then dial back as needed", and rejected a hover-only "super-minimal UI" (behind the UI3 redesign). Before adding a border, a colour or a size, take one away and see whether anything was lost.

**Cases**
- A sidebar's selected item has an accent fill, an accent border and bold text, and hovered items turn accent too → selected: one accent-tinted fill; hover: a neutral step.
- An inspector wraps each section in a bordered, shadowed card inside a bordered panel → drop the cards; one hairline or 8px more space between sections.
- A tool uses 11, 12, 13, 14 and 16px across its panels → two sizes, 12 and 13 (or 12 and 14); headings by weight.
- Panel headings in 11px uppercase with wide tracking above 14px values → sentence case at the body size, weight 600, secondary colour if the panel has many.
- Every field has a 1px mid-grey border at rest, so the inspector reads as a grid of boxes → filled fields with no resting border, or the faintest border step; the border strengthens on hover and focus, keeping 3:1 for the control's identifying boundary where the fill does not give it.
- The top bar is a different grey from the sidebar, which differs from the inspector → one chrome background; the work area alone differs.

**Accessibility**
- [1.4.11 Non-text Contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html) (AA): quiet does not mean invisible; whatever identifies a field (its fill against the panel, or its border) and the focus indicator meet 3:1. A borderless field whose fill is 1.1:1 against the panel fails.
- [1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html): secondary and tertiary text still meet 4.5:1 at 12px; Radix guarantees its step 11 only to APCA Lc 60 on step 2, so measure it in WCAG terms.
- [1.4.1](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html): a selected row that differs only by a faint tint needs a second cue (weight, a check, an accent bar).

**Build**
- The neutral steps and the accent are role tokens (`--color-bg-hover`, `--color-bg-selected`, `--color-border-control`, three text roles), never palette steps in components (code-standard rule 22; [tokens: three tiers](../../code/tokens.md#three-tiers)).
- Hover and selected are styled from state attributes (`:hover`, `[aria-selected="true"]`, `[aria-current]`), one rule per role (code-standard rule 9).
- Panel padding, row gap and section gap are three tokens shared by every panel; a fixed panel has no radius token of its own.

**Check**
- *Script:* could count distinct font sizes, control heights, radii, border colours and background colours on one screen, flag the accent colour on any hover style, a border inside a bordered container inside a panel, and measure field-to-panel and focus-ring contrast against 3:1.
- *Judgement:* squint at the screen: is the work the loudest thing, and is there exactly one place the accent says "you are here"?

**Sources:** Figma, Sketch, Framer, Radix, shadcn/ui, Material, Apple and WCAG as linked. They agree on neutral chrome, one accent and fixed panels. No primary source publishes Figma UI3's own sizes, panel padding or heading style; the clone's values are commentary and the toolkit's defaults come from Radix, Material and Apple, which agree on 12px secondary text and 24/32px controls. Figma's UI3 added visible affordances back after a minimal phase; the toolkit reads "quiet" as low contrast at rest, not as hidden.

---

## Elevation, borders, radius and shape

**What good looks like**
- Three or four elevation levels, each a named surface and shadow pair.
- Shadows only on things that float or move; grouping by space or a border.
- A few radius tokens mapped to element roles: small details, controls, containers.
- Nested shapes look concentric; the focus ring follows the component's radius.

**How**
- Elevation: [Atlassian](https://atlassian.design/foundations/elevation) names sunken, default, raised and overlay, pairs raised and overlay with their shadows, and says "don't use to group content when a border or white space would suffice."
- Borders separate where space cannot, and identify a control's edge. A control's boundary that identifies it needs 3:1 against its surroundings; a decorative divider does not.
- Radius by role: [Atlassian](https://atlassian.design/foundations/radius) maps 2px to badges and checkboxes, 4px to tags, 6px to buttons and inputs, 8px to cards and menus, 12px to modals, full to avatars and pills, with a focus radius "always +2px greater". Take the project's tokens; keep the role mapping.
- Nested radius: inner radius = outer radius − padding, so a 12px card with 8px padding holds 4px children (practitioner technique, commentary).
- Pick one shape language: pills and squares mixed in one toolbar look collected.
- In code, radii and strokes stay px (code-standard rule 54); a Figma stroke becomes CSS by code-standard rule 63.

**Cases**
- Cards with a border, a shadow and a tinted background → one separator is enough; drop the shadow unless the card lifts on interaction.
- A dropdown menu has no shadow and the same surface as the page → overlay level: surface plus shadow, and a border for forced colours.
- Buttons at 6px, inputs at 4px, selects at 8px → one control radius for all three.
- A 16px-radius container holds 16px-radius cards with 12px padding → reduce the inner radius to 4px.
- A focus ring with square corners around a rounded button → radius plus offset.

**Accessibility**
- [1.4.11](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html): the boundary that identifies a control needs 3:1 unless the label alone identifies it. Shadows vanish in forced colours; a surface needs a border or contrast step as well.

**Build**
- Shadows and radii are tokens; radii, strokes and shadow offsets stay px (code-standard rule 54); a Figma stroke becomes the CSS that takes the same room (code-standard rule 63).
- A floating surface keeps a border as well as its shadow, since forced colours drop shadows ([figma handoff: states the design lacks](../../code/figma-handoff.md#states-the-design-lacks)); strokes: [figma handoff: strokes: borders, outlines and shadows](../../code/figma-handoff.md#strokes-borders-outlines-and-shadows).

**Check**
- *Script:* could flag shadows and radii not bound to tokens, raised surfaces without their paired shadow, a component's radius against its role mapping, inner radius larger than outer, and shadow-only separation. figma-standard rule 29 already requires radius and stroke bound in a component.
- *Judgement:* does each lifted surface actually sit above the page?

**Sources:** Atlassian's values are 2–12px; [material-web](https://github.com/material-components/material-web/blob/main/tokens/versions/v0_192/_md-sys-shape.scss) runs 4–28px. Values are brand; the toolkit fixes the role mapping and takes values from the project.

---

## Iconography

**What good looks like**
- One icon set, one stroke weight, one perspective.
- A few sizes paired to the type ramp; icon colour matches its text.
- An icon that carries meaning has a text label or an accessible name.
- An icon inside a control keeps the control's inset (design-standard rule 9).

**How**
- [Apple](https://developer.apple.com/design/human-interface-guidelines/icons): icons share "a consistent size, level of detail, stroke thickness (or weight), and perspective", and "match the weights of interface icons and adjacent text."
- Sizes: [Carbon](https://carbondesignsystem.com/elements/icons/usage/) uses 16px with 14px text and 20px with 16px text, plus 24 and 32. Pick two or three sizes and pair each with a text style.
- Colour: the same token as the adjacent text, or an icon role; icons have no states of their own, their container does (Carbon).
- With text: icon before the label for a recognised action, gap from the spacing scale, vertically centred on the text's cap height (optical, judged by eye).
- Icon-only: only for universally known actions (close, search, more) or where space forces it, always with an accessible name and a tooltip where the meaning is not obvious.
- Marks in a control: a chevron, icon or count sits as far from its edge as the text does from the other (design-standard rule 9), drawn by the system rather than the browser's native arrow.

**Cases**
- A select uses the browser's arrow, tight to the right border → a drawn chevron at the field's text inset (design-standard rule 9; the docs-site case behind it, owned here).
- Icons from two libraries in one toolbar, 1.5px and 2px strokes → one set.
- An icon-only "filter" button with a funnel → keep the icon, add the accessible name (code-standard rule 18) and a visible label where space allows.
- A 24px icon beside 14px text → 16px; size the icon to its text style.
- A count badge in a tab sits 4px from the edge while the label sits 12px from the other → the count takes the 12px inset.

**Accessibility**
- [1.1.1 Non-text Content](https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html) (A): a meaningful icon has a text alternative; a decorative one is hidden. Code: code-standard rule 18.
- [1.4.11](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html): 3:1 for an icon needed to understand or operate.
- [2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html): an icon button's target, not its glyph, is at least 24px (figma-standard rule 26).

**Build**
- A decorative glyph is `aria-hidden="true"`; an icon-only control carries `aria-label`, and a component with an icon-only shape requires it (code-standard rule 18).
- Icon size and colour are tokens paired to the text style (`currentColor` for the text's colour); the trailing mark's inset matches the leading text inset (design-standard rule 9).
- Detail: [accessibility: accessible names and descriptions](../../code/accessibility.md#accessible-names-and-descriptions).

**Check**
- *Script:* could flag icon sizes outside the set, mixed libraries (by component key or import path), icon colour not bound to text or icon roles, icon-only controls without a name, and the inset of a control's trailing mark against its leading text inset (design-standard rule 9; tools/ui-check/check.mjs does not measure it yet).
- *Judgement:* is each icon recognisable without its label, and optically centred?

**Sources:** Apple and Carbon agree; Carbon's 4.5:1 for icons is stricter than WCAG (see *Colour roles*).

---

## Imagery and illustration

**What good looks like**
- An image appears only when it does a job words cannot.
- The text carries all the information; the image supports it.
- Illustrations are simple and work in both themes.
- Every image has an `alt`, empty when decorative.

**How**
- [GOV.UK images](https://design-system.service.gov.uk/styles/images/): "Only use images if there's a real user need", "written content must contain all the information the user needs", and illustrations "show a simplified image of something complex."
- Pictograms are illustrations, not interface icons: [Carbon](https://carbondesignsystem.com/elements/pictograms/usage/) sets a 48px minimum and keeps them out of controls.
- Check each image on the dark theme; provide a dark asset where detail is lost ([Apple](https://developer.apple.com/design/human-interface-guidelines/dark-mode)).
- Give images an aspect ratio so they reserve space while loading (design-standard rule 2's intent applied to load).
- Screenshots in docs: crop to the part being explained; text in a screenshot is repeated in the body.

**Cases**
- A hero illustration on a tool's landing screen → remove it unless it explains something; a tool is used, not admired.
- An empty state with a large illustration and no action → keep it small, and put the reason and the action first.
- A diagram whose labels exist only in the image → put the explanation in text; the image becomes a supplement with a short alt.
- A pictogram used as a button icon → an interface icon from the set.
- A white-background PNG on the dark theme → a transparent or dark asset.

**Accessibility**
- [1.1.1](https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html) (A): alternatives; code-standard rule 18 for empty alt on decoration.
- [1.4.11](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html): parts of a graphic needed to understand it, 3:1.

**Build**
- Every `img` has `alt`, empty when decorative (code-standard rule 18), and `width`/`height` or `aspect-ratio` so it reserves space.
- Detail: [HTML semantics: images and alt](../../code/html-semantics.md#images-and-alt) and [performance: images](../../code/performance.md#images).

**Check**
- *Script:* could flag `img` without `alt`, images without dimensions or aspect ratio, pictograms under 48px or inside buttons, and missing dark variants where the project defines them.
- *Judgement:* does this image earn its place, and does its alt say what it shows for this purpose?

**Sources:** GOV.UK, Carbon and Apple agree. Docs and onboarding pages can feel bare without imagery; the toolkit still requires a job for every image.

---

## Motion

**What good looks like**
- Motion explains a change: where something came from, where it went, what changed.
- Short durations for small, frequent changes; longer only for large ones.
- No animation on actions people repeat all day.
- Every animation has a reduced-motion form.

**How**
- Durations: [Carbon](https://carbondesignsystem.com/elements/motion/overview/) defines 70, 110, 150, 240, 400 and 700ms. Use 70–150ms for hover, press and small reveals; 240ms for panels and menus; 400ms or more only for large, rare transitions.
- Easing: named curves for standard, entrance and exit; productive for tools and docs. Carbon: "Reserve expressive motion for occasional, important moments."
- [Apple](https://developer.apple.com/design/human-interface-guidelines/motion): "Don't add motion for the sake of adding motion", "Make motion optional", and avoid motion on frequent interactions.
- Reduced motion: replace movement with a fade or an instant change; do not just shorten it. The base layer holds the `prefers-reduced-motion` block once (see [accessibility in code](../../code/accessibility.md)).
- Nothing flashes more than three times a second; anything moving on its own for more than five seconds can be paused.

**Cases**
- A filter change slides the whole result list in → no motion, or a short fade; the reader is reading, and the layout holds still (design-standard rule 2).
- A disclosure opens over 600ms → 150–240ms.
- A parallax hero on scroll → remove, or disable under reduced motion; scroll-linked motion is the vestibular trigger.
- An auto-advancing carousel → a pause control, or no auto-advance.

**Accessibility**
- [2.3.3 Animation from Interactions](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html) (AAA, adopted here): interaction-triggered motion can be disabled.
- [2.2.2 Pause, Stop, Hide](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html) (A) and [2.3.1 Three Flashes](https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html) (A).

**Build**
- Durations and easings are motion tokens; the base layer holds the `prefers-reduced-motion` block once and swaps movement for a fade or none.
- Detail: [tokens: motion tokens](../../code/tokens.md#motion-tokens) and [accessibility: reduced motion and colour scheme in code](../../code/accessibility.md#reduced-motion-and-colour-scheme-in-code).

**Check**
- *Script:* could flag durations and easings not from tokens, durations above a ceiling for interface feedback, and animations or transitions with no `prefers-reduced-motion` rule covering them.
- *Judgement:* does each motion help the reader follow a change, or is it decoration?

**Sources:** Carbon and Apple agree. WCAG makes reduced motion AAA; the toolkit requires it everywhere, because it is cheap and the harm is physical.

---

## Data visualisation basics

**What good looks like**
- Charts and tables are drawn from the same visual system as the rest of the page: palette roles, type styles, spacing and grey for context.
- Choosing and drawing a chart is [data visualisation: choosing a chart by its job](../patterns/data-visualisation.md#choosing-a-chart-by-its-job) and [data visualisation: colour by job](../patterns/data-visualisation.md#colour-by-job); a fixed set of attributes in a table is columns ([tables](../patterns/tables.md#a-fixed-set-of-attributes-as-columns), design-standard rule 8).

**How**
- Chart colours are their own palette, kept apart from status roles (*Colour roles*) and redefined per theme (*Theming*); light grey gridlines, at most about ten; units in the axis title, not in every tick.
- The construction rules (chart type, palette order, series limits, legends, axes) live in data, which owns them.

**Cases**
- A heatmap uses the categorical palette for magnitudes → a sequential palette ([data visualisation: colour by job](../patterns/data-visualisation.md#colour-by-job)).

**Accessibility**
- As in [data visualisation: colour by job](../patterns/data-visualisation.md#colour-by-job) (1.4.11, 1.4.1) and [data visualisation: long descriptions and data tables](../patterns/data-visualisation.md#long-descriptions-and-data-tables) (1.1.1).

**Build**
- A chart is a `figure` with a `figcaption` and its data in a table beside it; chart colours are their own tokens per theme. Detail: [HTML semantics: charts in markup](../../code/html-semantics.md#charts-in-markup).

**Check**
- *Script:* as in the data sections. *Judgement:* does the chart look like part of the page's system?

**Sources:** as linked from data.

---

## Visual states of controls

**What good looks like**
- Every interactive control draws rest, hover, focus, pressed and disabled, plus selected where it holds a value.
- Each state differs visibly from rest (figma-standard rule 31); pressed is stronger than hover.
- Focus is a ring a keyboard user can see on every surface, separate from hover.
- Selected is shown by more than colour.

**How**
- *Hover:* a hint. A translucent state layer over the control in its content colour, with opacity as a token: [Material](https://github.com/material-components/material-web/blob/main/tokens/versions/latest/sass/_md-sys-state.scss) uses 0.08, [eBay](https://playbook.ebay.com/design-system/tokens/opacity) 4%. Visible on every surface it sits on; never the only signifier, since touch and keyboard have no hover.
- *Focus:* its own ring, outside the state layer. A 2px ring outside the edge with an offset, or 3px when drawn inside, at 3:1 against what it sits on; an offset 2px ring is the passing example of [2.4.13](https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html), and an inside ring encloses less area. On a saturated primary button or a second theme, a two-colour ring (two bands of at least 2px). On a text input, the border is the indicator: thicken it or recolour it with a measured change, and show it on click as well as on tab. A focused errored field keeps the normal focus treatment; make the error border quieter instead.
- *Pressed:* a stronger state layer (Material 0.10, eBay 8%) or a darker step; immediate, even if the result is slow.
- *Disabled:* reduced emphasis, dimmed once by the host (code-standard rule 62), no hover response. When to disable at all is [interaction: disabled, hidden or read-only](interaction.md#disabled-hidden-or-read-only).
- *Selected:* a persistent change with a second cue: a check, a fill plus a weight change, an underline on a tab. Selected and focused can coincide and must both remain visible.
- *Read-only:* readable at full contrast, visibly not editable; a separate state from disabled ([Carbon](https://carbondesignsystem.com/patterns/disabled-states/)).
- Variant mapping in code: code-standard rule 9; a style switched off must compute off (code-standard rule 40).

**Cases**
- Hover and pressed variants identical to rest in the Figma set → a product bug that leads the queue (figma-standard rule 31).
- A blue ring on a blue primary button → near 1:1 and invisible; a two-colour ring or a white inner band.
- An input focused only under `:focus-visible` → mouse users get nothing; inputs use `:focus`.
- A selected segment shown only by a lighter background → add weight, a check or a stronger fill at 3:1 against the unselected segments.
- A disabled submit button on an incomplete form → [actions: disabled buttons](../patterns/actions.md#disabled-buttons).
- A grey-to-blue border recolour as the only focus cue on an input → often near 1.4:1; thicken the border as well.

**Accessibility**
- [2.4.7 Focus Visible](https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html) (AA); [1.4.11](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html) (AA): 3:1 for focus and selected indicators, hover supplementary, inactive components exempt; [2.4.11 Focus Not Obscured](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html) (AA); [2.4.13 Focus Appearance](https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html) (AAA, met by an offset 2px ring).
- Figma components: figma-standard rules 26 and 31. Code: code-standard rules 9, 40 and 62, and [accessibility in code: *Visible focus*](../../code/accessibility.md#visible-focus).

**Build**
- States are pseudo-classes and native attributes: `:hover` inside `@media (hover: hover)`, `:active`, `:focus-visible` (`:focus` on text inputs), `:disabled` or `[aria-disabled="true"]`, selected as `[aria-selected]`, `[aria-pressed]`, `[aria-current]` or `:checked` (code-standard rule 9).
- The disabled dim is the host's, once (code-standard rule 62); a removed outline is `outline: 0`, not `none` (code-standard rule 40).
- Detail: [CSS architecture: interaction states](../../code/css-architecture.md#interaction-states) and [accessibility: visible focus](../../code/accessibility.md#visible-focus).

**Check**
- *Script:* figma-components-audit checks every non-rest state against its Rest sibling (figma-standard rule 31). On a page, could force `:hover`, `:active`, `:focus-visible` and `[disabled]` in a headless browser and assert each computes differently from rest, measure focus-ring contrast against the surface and the component, and flag `outline: none` without a replacement.
- *Judgement:* is each state noticeable on every surface and in every theme, and does every disabled control say why?

**Sources:** WCAG does not require hover to be visible; the toolkit requires it visible but not at 3:1, because it is a hint. Thickness: AA sets none; the toolkit takes 2px outside, 3px inside, so the AAA area test passes for free. Disabling is settled in [interaction: disabled, hidden or read-only](interaction.md#disabled-hidden-or-read-only).

---

## Consistency and reuse of the system

**What good looks like**
- Every element on a page is a system component or built only from system tokens.
- The same problem gets the same solution everywhere; a divergence states its reason.
- No one-off sizes, colours, radii or spacings.
- Brand lives in the accent on the primary action, the typeface and the voice.

**How**
- Before drawing or coding something new, search the library; extend a component through its properties or a caller's custom property (code-standard rule 38) before forking it.
- An instance stays an instance (figma-standard rule 27); every value a component draws is bound (figma-standard rule 29); a page does not restyle a component's root (code-standard rule 4); every literal in component CSS is a token or carries its reason (code-standard rule 22).
- A real new need becomes a component or a variant in the system, then the page uses it. A second copy of a pattern is the moment to promote it.
- Brand: [Apple branding](https://developer.apple.com/design/human-interface-guidelines/branding), "Ensure branding always defers to content"; [Fluent](https://fluent2.microsoft.design/design-principles) pairs "Built for focus" with "A little personality goes a long way." Keep expressive type and motion for marketing pages.
- Consistent, not uniform: two filters that look alike behave alike; a screen that needs a different solution says why in the design notes.

**Cases**
- A page draws its own button with a 10px radius because the system's "looked heavy" → use the system button; if it really is heavy, change the system.
- A detached instance in a Figma screen with a tweaked fill → reattach and use a variant (figma-standard rule 27).
- Three cards on three pages with slightly different padding → one card component.
- A one-off purple for a "beta" badge → a role token in the system or an existing role.
- A team restyles the primary button in brand gradient → the accent role on the system button; GOV.UK's reason is maintenance and accessibility ([extending and modifying](https://design-system.service.gov.uk/get-started/extending-and-modifying-components/)).

**Accessibility**
- [3.2.4 Consistent Identification](https://www.w3.org/WAI/WCAG22/Understanding/consistent-identification.html) (AA): components with the same function are identified consistently. A one-off control also skips the states and focus ring the system component already carries.

**Build**
- One coded component per system component; a caller adjusts it through a custom property, never a rule of its own (code-standard rule 38), and a page never restyles a component's root (code-standard rule 4).
- Every literal is a token or carries its reason (code-standard rule 22). Detail: [figma handoff: the component inventory](../../code/figma-handoff.md#the-component-inventory) and [CSS architecture: custom properties](../../code/css-architecture.md#custom-properties).

**Check**
- *Script:* could flag detached instances and local overrides in Figma, CSS that targets a component's internals from a page, values off the token set, and near-duplicate components. figma-components-audit already checks bindings (figma-standard rule 29) and detached copies (figma-standard rule 27).
- *Judgement:* is this one-off a real new need, and if so, has it gone back into the system?

**Sources:** Apple, Fluent, GOV.UK and the principles agree. GOV.UK has no written "do not restyle buttons" rule; the reasons the toolkit gives are maintenance, accessibility and evidence, as GOV.UK's pages do.
