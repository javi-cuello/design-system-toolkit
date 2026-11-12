# Accessibility in design

Which accessibility decisions are made in the design file, what a designer has to annotate, where the work hands over to code, and what a check can see on a Figma file and on a rendered page.

Researched October 2026. Every success criterion was re-read in the W3C's Understanding documents for WCAG 2.2, and every system claim was checked against the system's own page: Apple's Human Interface Guidelines (read from its documentation data, since the page renders in script), Android's accessibility guide, Carbon's keyboard, disabled-state and component pages, GOV.UK's button guidance and public-sector requirements, Microsoft's Fluent 2 accessibility page and Learn module, and GitHub's Annotation Toolkit posts and Primer page. Several claims from earlier notes did not survive and are not used: that Fluent publishes a deliverable titled "design accessibility specs" (its page asks for accessibility detail in the spec, under no such title); that Carbon's disabled-states page discusses the contrast exemption (it does not; WCAG does); that Microsoft's inclusive design site frames a permanent, temporary and situational persona spectrum (its front page names three principles and nothing more); and a Carbon menu-focus claim and a v10 data-table claim seen only in search results. Focus-ring appearance is left to `focus-indicators.md`. Practitioner writing is labelled as commentary.

---

## What this answers

Most accessibility failures that reach an audit were decided before anyone wrote code. Contrast is a token choice, target size is a component dimension, reading order is the layout, and whether an error names the field is copy. Engineering can build each faithfully and still ship a failure, because the failure was in the drawing. The reverse also holds: a Figma file cannot show what a screen reader announces, where focus goes after a dialog closes, or whether a hidden element is really hidden. A design system needs to know which half each rule sits in, so design review looks for one half and code checks look for the other.

The questions, in order:

- What is the baseline?
- Which success criteria are design decisions and which are code decisions?
- What should a designer annotate?
- What does design decide about focus order and reading order?
- How should colour and contrast be specified?
- What do zoom, reflow and text spacing ask of a layout?
- How big does a target have to be?
- What does design owe people with vestibular and photosensitive conditions?
- What is cognitive accessibility, beyond the criteria?
- Who owns alternatives and captions?
- How should errors, time limits, help, re-entry and sign-in be designed?
- Should controls ever be disabled?
- Where do inclusive design principles fit?

Sections 16 and 17 are the cheat sheet and the short version. Each topic section ends with what a check can see on a Figma file, on a rendered page, and what needs judgement.

---

## 1. The baseline

**The short answer.** WCAG 2.2 at Level AA. It is the current W3C Recommendation and what UK public-sector sites must meet. WCAG 3 is a draft that says it will change.

[WCAG 2.2](https://www.w3.org/TR/WCAG22/) became a W3C Recommendation on 12 December 2024. It added nine success criteria: 2.4.11 Focus Not Obscured (Minimum, AA), 2.4.12 Focus Not Obscured (Enhanced, AAA), 2.4.13 Focus Appearance (AAA), 2.5.7 Dragging Movements (AA), 2.5.8 Target Size (Minimum, AA), 3.2.6 Consistent Help (A), 3.3.7 Redundant Entry (A), 3.3.8 Accessible Authentication (Minimum, AA) and 3.3.9 Accessible Authentication (Enhanced, AAA), and removed 4.1.1 Parsing as obsolete. Most of the six new A and AA criteria are settled by layout, component size or flow before any code exists.

The UK government's [accessibility requirements for public sector websites and apps](https://www.gov.uk/guidance/accessibility-requirements-for-public-sector-websites-and-apps) say sites must "meet the Web Content Accessibility Guidelines (WCAG) 2.2 AA accessibility standard"; the page was updated for 2.2 on 5 October 2023, and the regulations have applied since 23 September 2018.

[WCAG 3](https://www.w3.org/TR/wcag-3.0/) published a Working Draft on 10 September 2026. Its status section is blunt: "The final set of requirements in WCAG 3 will be different from what is in this draft", and "WCAG 3 does not replace WCAG 2."

**Good practice.** State the target once, in the project's context document, as "WCAG 2.2 AA". Where a team meets an AAA criterion, name it rather than claiming AAA: WCAG itself says "It is not recommended that Level AAA conformance be required as a general policy for entire sites", because some content cannot meet every AAA criterion.

**Pros and cons.** A single versioned target makes every later argument short: a reviewer points at a number. But WCAG measures conformance, not usability, and a design can pass every AA criterion and still be hard to use. Sections 9 and 15 address that gap.

**Recommendation.** Target WCAG 2.2 AA, name AAA criteria individually, and read WCAG 3 for direction without designing to it.

---

## 2. Design decisions and code decisions

**The short answer.** Roughly half the A and AA criteria are settled in the design file, a few are shared, the rest belong to code. Write the split down so each review checks its own half.

The W3C's [Accessibility Roles and Responsibilities Mapping](https://www.w3.org/WAI/planning/arrm/) (ARRM, an in-progress draft last updated 24 July 2025) does this formally, giving each task a primary owner ("accountable for an accessibility task"), a secondary owner and contributors across roles such as UX designer, visual designer, content author and front-end developer. Its own example is headings: designers define how they look, writers own the text and levels, developers own the markup. The table below is a narrower cut for a design system.

| Criterion | Level | Design decides | Code decides |
|---|---|---|---|
| 1.1.1 Non-text Content | A | Informative or decorative, and the text (annotated) | `alt`, accessible names |
| 1.2.2 Captions (Prerecorded) | A | A captions control and room for captions | The caption track |
| 1.3.1 Info and Relationships | A | Heading levels, groups, visible labels (annotated) | Semantic markup |
| 1.3.2 Meaningful Sequence | A | Reading order (annotated where ambiguous) | DOM order |
| 1.4.1 Use of Color | A | A second cue beside every colour signal | Nothing, if the design is right |
| 1.4.3 Contrast (Minimum) | AA | Text and surface token pairs | Not overriding them |
| 1.4.4 Resize Text | AA | Layouts that tolerate 200% text | Relative units |
| 1.4.10 Reflow | AA | A 320px layout | Responsive CSS |
| 1.4.11 Non-text Contrast | AA | Borders, icons, state indicators at 3:1 | Not overriding them |
| 1.4.12 Text Spacing | AA | No text in fixed-height boxes | Containers that grow |
| 2.2.1 Timing Adjustable | A | Whether there is a limit, and the warning | The timer |
| 2.2.2 Pause, Stop, Hide | A | A pause control on anything that moves | Its behaviour |
| 2.3.1 Three Flashes | A | No flashing content | Not shipping it |
| 2.4.3 Focus Order | A | Intended order (annotated) | DOM order, focus management |
| 2.4.7 Focus Visible | AA | The indicator (`focus-indicators.md`) | The selector that carries it |
| 2.4.11 Focus Not Obscured | AA | Size and behaviour of sticky regions | Scroll padding |
| 2.5.7 Dragging Movements | AA | A non-drag alternative | Wiring it |
| 2.5.8 Target Size (Minimum) | AA | Target dimensions and spacing | Not shrinking them |
| 3.2.6 Consistent Help | A | Help placement in the template | Nothing |
| 3.3.1 Error Identification | A | Error text, not only a red border | Associating it with the field |
| 3.3.3 Error Suggestion | AA | The words of the fix | Showing it |
| 3.3.4 Error Prevention | AA | A review, undo or confirm step | Implementing it |
| 3.3.7 Redundant Entry | A | Flows that never ask twice | Auto-fill |
| 3.3.8 Accessible Authentication | AA | Sign-in without a memory or transcription test | Not blocking paste or password managers |
| 4.1.2 Name, Role, Value | A | The name of each icon-only control (annotated) | `aria-label`, roles, states |

In this toolkit the right-hand column belongs to the code standard (`standards/code-standard.md`), and a design guide should not restate it. The rules on this boundary are rule 2 (DOM order is reading order), 14 (a live swap keeps the reader's place), 15 (a description is not part of a name), 16 (native controls follow the theme through `color-scheme`), 17 (`hidden` must beat the stylesheet), 18 (icon-only controls have names; decorative images have empty alt), 62 (disabled is the control's attribute, and how it dims) and 64 (navigation marks the current page with `aria-current`). Each starts from something the design must state: the order, the name, the theme, the current item.

**Good practice.** Use the left column as the design-review checklist and the right as the code-review checklist. A row with content in both is a handover, and the handover is an annotation (section 3).

**Pros and cons.** The split makes ownership explicit. Its weakness is that some rows are genuinely shared: a perfect 320px frame can still be built with a fixed-width container. The table names who decides, not who can break it.

**Recommendation.** Keep this table, or the project's own cut of it, in the library documentation, and review each half where it is made.

---

## 3. Annotations are a design deliverable

**The short answer.** A frame shows what a page looks like and almost nothing about how it behaves for someone who cannot see it. The annotation layer carries that, and GitHub's audit data says it would have prevented about half their issues.

Microsoft's Learn module on [accessibility design specs with annotations](https://learn.microsoft.com/en-us/training/modules/accessibility-design-specs-with-annotations) defines the practice: "Accessibility annotations are labels or comments included in designs for digital products to outline how elements should be made accessible." It teaches them with the A11y Focus Order plugin and the Fluent Accessibility Design Toolkit, covering keyboard navigation, screen readers, contrast, high contrast and reflow. The [Fluent 2 accessibility page](https://fluent2.microsoft.design/accessibility) asks for focus order, screen-reader annotations and semantic structure in the design spec alongside the visual detail.

GitHub's post on its [open-source Annotation Toolkit](https://github.blog/enterprise-software/collaboration/level-up-design-to-code-collaboration-with-githubs-open-source-annotation-toolkit/) (Andrea Griffiths, 18 November 2025) reports that "nearly half of accessibility audit issues (48%) could have been prevented if design intent had been better documented upfront". That is GitHub's analysis of its own audits, not an independent study, but it is the best number available. The [Primer page](https://primer.style/accessibility/tools-and-resources/annotation-toolkit) lists what the toolkit annotates: page structure and landmarks, focus and reading order, informative and decorative images, buttons and links, form elements, lists and tables, user interactions, document title and language, and system feedback including live-region announcements.

The companion post, [*Design system annotations, part 1*](https://github.blog/?p=87647) (Jan Maarten, May 2025), calls it a misconception that "accessible components will result in accessible designs": a page of accessible parts can still lack a sensible heading hierarchy, and a component often hides whether it is really a link, what its label is, or whether it submits data. Its rule for what to annotate keeps the cost down: "Component usage is contextual", so annotate what changes per instance, such as an accordion's heading level or an image's description in this placement, and leave built-in behaviour alone.

**What a check can see.** *Figma:* whether annotations exist on a frame (native annotations are readable through the API), and whether every icon-only instance has a name annotation; presence, not correctness. *Rendered page:* the heading outline, landmarks, accessible names and tab sequence, compared against the annotations. *Judgement:* whether the annotated names, headings and order are right for the content.

**Good practice.** Annotate per screen, and only what the component does not already decide: heading levels, landmarks, order where the layout is ambiguous, icon-only names, alt text or "decorative", link versus button, and what is announced on update.

**Pros and cons.** Annotations move decisions to the cheapest point and give code review something to check against. They cost designer time on every screen, drift when nobody updates them, and can become box-ticking; annotating only the contextual details limits all three.

**Recommendation.** Make an annotation layer part of done for any screen that ships, limited to what changes per instance, and check the rendered page against it.

---

## 4. Focus order and reading order

**The short answer.** Design decides the order and code makes the DOM match it. Annotate the order wherever the layout does not make it obvious, and size sticky elements so they cannot cover the focused control.

[1.3.2 Meaningful Sequence](https://www.w3.org/WAI/WCAG22/Understanding/meaningful-sequence.html) (A) asks that "when the sequence in which content is presented affects its meaning", "a correct reading sequence can be programmatically determined." [2.4.3 Focus Order](https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html) (A) asks that "focusable components receive focus in an order that preserves meaning and operability." Its modal example states the decision most often missed: while a dialog is open, everything outside it is inert, and on dismissal "focus returns to the button or the element following the button." Only the designer knows where focus should land on open and on close.

[2.4.11 Focus Not Obscured (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum) (AA) asks that a focused component "is not entirely hidden due to author-created content", naming sticky headers, sticky footers and non-modal dialogs as the usual culprits; a cookie banner that entirely covers the focused component fails. How tall the header is, and whether the banner overlays or pushes content, are layout decisions.

Carbon's [keyboard guidance](https://carbondesignsystem.com/guidelines/accessibility/keyboard/) states the default: "The order in which interactive elements receive focus should be logical and predictable", typically header, main navigation, content "(from left to right, top to bottom)", then footer. Fluent 2 gives the same default as a "z" pattern. Carbon's component pages then say where the default is not enough. For a [transactional modal](https://carbondesignsystem.com/components/modal/accessibility/), "designers should annotate that the first input field should receive focus." For [checkboxes](https://carbondesignsystem.com/components/checkbox/accessibility) in columns with a meaningful sequence, "annotate whether the tab order is by row or by column." And the [link](https://carbondesignsystem.com/components/link/accessibility/) page says the opposite, usefully: "No annotations for keyboard interactions are needed."

The code side is code-standard rule 2 (DOM order is reading order) and rule 14 (focus stays put after a script swaps a region).

**What a check can see.** *Figma:* order annotations present on multi-column layouts, dialogs and menus; sticky-region height relative to the viewport frame, at 320px as well as desktop. *Rendered page:* the actual tab sequence against each stop's visual position; whether a focused element ends up fully under a sticky header; where focus lands as a dialog opens and closes. *Judgement:* whether an order "preserves meaning".

**Good practice.** Leave the obvious order unannotated and annotate multi-column forms, cards with more than one action, dialogs (open and close), and any layout where visual and logical order could differ.

**Pros and cons.** Annotating only exceptions keeps the work proportionate. The risk is that "obvious" is obvious to the designer and not the engineer; Carbon's per-component "annotation needed or not" is the way to make that call once, in the library.

**Recommendation.** Give each component's documentation a "needs focus-order annotation: yes or no" line, annotate every screen that uses a "yes" component, and test the rendered tab order against it.

---

## 5. Colour independence and contrast

**The short answer.** Colour is never the only signal; text meets 4.5:1, or 3:1 when large; whatever identifies a control or its state meets 3:1. All three are token decisions, checkable on the Figma file before anything is built.

[1.4.1 Use of Color](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html) (A): "Color is not used as the only visual means of conveying information, indicating an action", prompting a response or distinguishing an element. For inline links, technique [G183](https://www.w3.org/WAI/WCAG22/Techniques/general/G183) accepts 3:1 between link and surrounding text, while noting authors "may still consider using an alternative or additional way to indicate links, such as an underline or bold text." Underlining needs no measurement.

[1.4.3 Contrast (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) (AA) asks 4.5:1 for text and 3:1 for large text, at least 18 point or 14 point bold, which the document puts at about 24 and 18.5 CSS pixels. Two details matter for a token review. The thresholds are not rounded: "4.499:1 would not meet the 4.5:1 threshold." So `#767676` on white, at 4.54:1, passes, and `#777777`, at 4.48:1, fails, though a plugin showing one decimal reports both as 4.5. And text in an inactive component, pure decoration or a logo has no requirement (section 14).

[1.4.11 Non-text Contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html) (AA) asks 3:1 "against adjacent color(s)" for what is "required to identify user interface components and states, except for inactive components", and for "parts of graphics required to understand the content". Selected and focused indicators must reach 3:1; an author's hover effect is supplementary and need not, provided it lowers nothing else. Chart lines need 3:1 against the background but not against each other, and a chart whose values also appear as text is exempt.

Apple's [HIG accessibility page](https://developer.apple.com/design/human-interface-guidelines/accessibility) says "Convey information with more than color alone", naming red-green and blue-orange as hard pairings. Its Accessibility Inspector uses the WCAG AA values (4.5:1 up to 17 points, 3:1 from 18), and Apple asks apps that miss them by default to provide a higher-contrast scheme under Increase Contrast, checked in light and dark. Apple also names APCA alongside WCAG as one of "two popular standards"; conformance is still judged by WCAG 2's formula.

**What a check can see.** *Figma:* every text variable against every surface it is used on, in every mode, unrounded; border and icon tokens against their surfaces at 3:1; status variants carrying an icon or word as well as colour. *Rendered page:* computed contrast of each text node against its real backdrop, including opacity and images; 3:1 on borders and state indicators; underlined inline links. *Judgement:* whether a colour carries meaning, and whether the second cue is understandable.

**Good practice.** Audit pairs, not swatches: a palette is neither accessible nor inaccessible, only a foreground on a background is. Pair every status colour with an icon or word.

**Pros and cons.** Token-pair auditing is mechanical and catches most failures before they exist. Its blind spots are text over images, gradients and anything dimmed with `opacity`, where the declared colour is right and the composited one is not. Colour independence costs some minimalism: an icon beside every error is more ink.

**Recommendation.** Make an unrounded, every-mode token-pair contrast audit a release gate for the library, and keep a rendered-page check for what tokens cannot see.

---

## 6. Zoom, reflow and text spacing

**The short answer.** Draw a 320px frame, never put text in a fixed-height box, and assume text will be twice the size and more widely spaced than in the mockup.

[1.4.4 Resize Text](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html) (AA): "Except for captions and images of text, text can be resized without assistive technology up to 200 percent" "without loss of content or functionality."

[1.4.10 Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html) (AA): no two-dimensional scrolling "at a width equivalent to 320 CSS pixels" (or a height of 256 for horizontal content). That is a 1280-pixel window at 400% zoom. Maps, diagrams and data tables are excepted where they need two dimensions, though table cells must still reflow.

[1.4.12 Text Spacing](https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html) (AA): nothing is lost when a user sets line height to 1.5 times the font size, paragraph spacing to 2 times, letter spacing to 0.12 and word spacing to 0.16. "Content is not required to use these text spacing values"; it has to survive them. Where a container cannot grow, truncation is acceptable only if the full text is available another way: "if there is no mechanism to show the truncated text, it fails."

Fluent 2 tells designers to design down to a 320-pixel breakpoint, and Microsoft's Learn module treats reflow as part of the annotated spec.

**What a check can see.** *Figma:* a 320-wide frame for each template; text layers inside frames of fixed height; truncated text with a documented reveal. *Rendered page:* horizontal scroll at 320 CSS pixels; clipped or overlapping text after injecting the four spacing values; loss at 200% text zoom. *Judgement:* whether a table genuinely needs two dimensions, and whether the reflowed order still reads.

**Good practice.** Design the narrowest layout alongside the widest. Let every text container hug its content vertically. Where a dashboard table must stay two-dimensional, let it scroll on its own axis inside a page that does not.

**Pros and cons.** These rules make designs honest about content length, which also helps translation and real data. They constrain dense dashboards, where fixed-height cards are tempting, and Figma cannot apply user text spacing, so only the rendered page proves the result.

**Recommendation.** Require a 320px frame per template, forbid fixed-height text containers in the component audit, and run reflow and text-spacing checks on the rendered page.

---

## 7. Target size and dragging

**The short answer.** 24 by 24 CSS pixels is the AA floor, Apple's default is 44 points and Android's is 48dp, and every drag needs a single-pointer alternative. Design to the platform default; treat 24 as the exception.

[2.5.8 Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) (AA): "The size of the target for pointer inputs is at least 24 by 24 CSS pixels", except where a smaller target is spaced so a 24-pixel circle centred on it touches no other target or small target's circle, where an equivalent control meets the size, where the target is inline in a sentence, where the browser draws it unmodified, or where the presentation is essential, such as dense map pins. The document calls it "a minimum size and, if this can't be met, a minimum spacing", and suggests aiming for the stricter [2.5.5 Target Size (Enhanced)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html), AAA at 44 by 44, for important controls.

Apple's [HIG](https://developer.apple.com/design/human-interface-guidelines/accessibility) tabulates default and minimum control sizes: 44 by 44 points default and 28 by 28 minimum on iOS and iPadOS, 28 and 20 on macOS, 60 by 60 default on visionOS. It adds "Consider spacing between controls as important as size": about 12 points of padding around bezelled elements, about 24 around unbezelled ones. Android's [accessibility guide](https://developer.android.com/guide/topics/ui/accessibility/apps) recommends targets "of at least 48dpx48dp. Larger is even better", allows smaller ones for mouse and trackpad, and notes that Compose's Material buttons enforce the minimum while custom elements do not.

[2.5.7 Dragging Movements](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html) (AA): anything done by dragging "can be achieved by a single pointer without dragging". The Understanding examples are the patterns to draw: a sortable list where an item is selected and moved with up and down controls, and a map that also pans with directional buttons.

**What a check can see.** *Figma:* the bounding box of every interactive component in every size variant against 24 or the platform default; spacing between adjacent small targets; a drawn alternative for every draggable component. *Rendered page:* measured hit areas including padding, and the 24-pixel circle test between neighbours. *Judgement:* whether a small target is truly inline or essential, and whether an "equivalent" control really is.

**Good practice.** Separate visible size from target size: a 16-pixel icon can sit in a 44-pixel target. Make the target the component's frame in Figma, so measuring the frame measures the target. Draw the non-drag alternative as a variant.

**Pros and cons.** Larger targets help anyone with an imprecise pointer, including anyone on a moving train. They cost density, which data tables feel most, and the spacing exception tempts teams to meet the letter with tiny, spread-out controls.

**Recommendation.** Make 24 CSS pixels a hard floor in the component audit, design touch layouts to 44 points or 48dp, and require a drawn single-pointer alternative for every drag.

---

## 8. Motion, flashing and vestibular safety

**The short answer.** Never flash more than three times a second, give anything that moves on its own for more than five seconds a pause control, and design a reduced-motion version of every non-essential animation.

[2.3.1 Three Flashes or Below Threshold](https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html) (A): nothing "flashes more than three times in any one second period", or the flash stays below the general and red thresholds. At 1024 by 768, a flash confined to a 341 by 256 pixel rectangle is within the area threshold. The document names the Trace Center's Photosensitive Epilepsy Analysis Tool (PEAT) for video, and notes no tool is needed if nothing flashes more than three times a second.

[2.2.2 Pause, Stop, Hide](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html) (A): moving, blinking or scrolling content that starts automatically, lasts more than five seconds and sits beside other content needs "a mechanism for the user to pause, stop, or hide it"; auto-updating content needs a way "to control the frequency of the update." Carousels, tickers and live dashboards fall under it.

[2.3.3 Animation from Interactions](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html) is AAA, but its Understanding document is the clearest account of why motion matters: "Some users experience distraction or nausea from animated content", and scroll-triggered movement can cause dizziness and headaches. Its named example is parallax; its technique is the `prefers-reduced-motion` query; essential motion is exempt. Apple's HIG asks the same: under Reduce Motion, reduce "automatic and repetitive animations, including zooming, scaling, and peripheral motion."

**What a check can see.** *Figma:* prototype transitions using large movement, zoom or parallax, and whether each has a reduced counterpart specified; a pause control in the variants of any auto-advancing component. *Rendered page:* flash rate from a recording, with a tool such as PEAT; animation under emulated `prefers-reduced-motion: reduce`; a visible pause on autoplay. *Judgement:* whether a motion is essential, and whether the reduced version still communicates the change.

**Good practice.** Specify the reduced version rather than leaving code to delete the animation: a cross-fade for a slide, an instant change for a zoom. Reduce rather than remove, since some motion carries meaning. Avoid auto-advancing content in documentation and dashboards altogether.

**Pros and cons.** A reduced-motion line per animation is cheap protection against real physical harm. It is a second design per transition, and because 2.3.3 is AAA a team can skip it and still conform. This is one place where conforming is not the same as safe.

**Recommendation.** Treat 2.3.3 as required in practice, and never design flashing or auto-advancing content.

---

## 9. Cognitive accessibility

**The short answer.** WCAG covers a small part of it. The W3C's *Making Content Usable* note covers the rest as eight objectives, mostly decisions about copy, layout and flow.

[*Making Content Usable for People with Cognitive and Learning Disabilities*](https://www.w3.org/TR/coga-usable/) is a W3C Working Group Note (29 April 2021). It says its patterns "address accessibility barriers that were not included in the current normative WCAG 2.x", and "Following this guidance is not required for conformance to WCAG." Its objectives: help users understand what things are and how to use them; help users find what they need; use clear and understandable content; help users avoid mistakes and know how to correct them; help users focus; ensure processes do not rely on memory; provide help and support; support adaptation and personalisation.

Several of WCAG 2.2's new criteria are these patterns promoted into the standard: 3.2.6 Consistent Help serves "provide help and support", and 3.3.7 Redundant Entry and 3.3.8 Accessible Authentication serve "do not rely on memory". The rest stays advisory, and almost all of it is design: familiar icons with text labels, one main task per screen, plain words, headings that say what follows.

**What a check can see.** *Figma:* icon-only controls without a visible label; screens with more than one primary action; drawn help and error states. *Rendered page:* consistent placement of navigation and help across templates; reading level of body copy as an indicator only. *Judgement:* nearly everything; clarity and focus are not measurable by a script.

**Good practice.** Ask the eight objectives as review questions on a new template or flow. Prefer visible labels to icons alone, keep one primary action per view, and put instructions before the field rather than in the error.

**Pros and cons.** Designing to the objectives helps anyone tired, distracted or working in a second language. It is unenforceable by tooling, so it is dropped under deadline, and it pushes against dense expert dashboards, which is sometimes a legitimate trade for a specialist audience.

**Recommendation.** Use the eight objectives as design-review questions, not audit rows, and enforce the criteria they produced.

---

## 10. Alternatives and captions

**The short answer.** The designer decides what each image means, the content author writes the words, and code puts them in place. Captions are Level A for prerecorded video.

[1.1.1 Non-text Content](https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html) (A): "All non-text content that is presented to the user has a text alternative that serves the equivalent purpose", and decoration "is implemented in a way that it can be ignored by assistive technology." Informative or decorative can only be decided by whoever knows why the image is there, and GitHub's annotation post adds that the same image may need different text in different placements, so this is a per-screen annotation, not an asset property. The code side is code-standard rule 18.

[1.2.2 Captions (Prerecorded)](https://www.w3.org/WAI/WCAG22/Understanding/captions-prerecorded.html) (A): "Captions are provided for all prerecorded audio content in synchronized media." For a documentation site that means tutorial videos; the design decision is a captions control and captions that do not cover essential content.

**What a check can see.** *Figma:* an alt or "decorative" annotation on every image instance; a captions control in the video component. *Rendered page:* missing `alt`, unnamed icon-only controls, video without a caption track. *Judgement:* whether the text conveys the image's purpose in context, and caption accuracy.

**Good practice.** For charts, put the key values in text beside the chart, which also exempts its marks from 1.4.11.

**Pros and cons.** Annotating at design time captures meaning while its owner is in the room. Design-file text drifts from shipped copy, so the content author's review is still needed.

**Recommendation.** Require "informative or decorative, and the text" on every image, and a captions control in every video component.

---

## 11. Error recovery

**The short answer.** Say what went wrong in words, say how to fix it when you know, and let people check or undo anything with consequences.

[3.3.1 Error Identification](https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html) (A): a detected error "is described to the user in text." A red border alone fails it, and 1.4.1 too. [3.3.3 Error Suggestion](https://www.w3.org/WAI/WCAG22/Understanding/error-suggestion.html) (AA): where "suggestions for correction are known", they "are provided to the user", "unless it would jeopardize the security or purpose of the content." [3.3.4 Error Prevention (Legal, Financial, Data)](https://www.w3.org/WAI/WCAG22/Understanding/error-prevention-legal-financial-data.html) (AA) covers pages that create a legal commitment or payment, change or delete user data, or submit test answers, and asks for at least one of: "Submissions are reversible"; input is "checked for input errors and the user is provided an opportunity to correct them"; or "A mechanism is available for reviewing, confirming, and correcting information before finalizing the submission."

For a toolkit that builds audit dashboards, the user-data clause is the one that bites: a control that accepts, dismisses or deletes audit rows is in scope. The focused error field's appearance is in `focus-indicators.md` section 8.

**What a check can see.** *Figma:* an error variant with a text slot on every input; a confirm, review or undo state drawn for destructive actions. *Rendered page:* invalid input producing text associated with the field; destructive actions undoable or confirmed. *Judgement:* whether the message is understood and the fix helps.

**Good practice.** Name the field and the fix ("Enter a date after 1 January 2026"), not the fault ("Invalid input"). Prefer undo to confirmation for routine destructive actions; confirmations get clicked through.

**Pros and cons.** Text errors and undo help everyone. Undo needs real engineering, which is why confirmation dialogs persist, and a confirmation on every action trains people to ignore them.

**Recommendation.** Require a text error variant on every input, a written fix where known, and undo or review on every action that changes or deletes data.

---

## 12. Time limits

**The short answer.** Avoid them. Where one is unavoidable, design the warning and the "more time" action.

[2.2.1 Timing Adjustable](https://www.w3.org/WAI/WCAG22/Understanding/timing-adjustable.html) (A): for each time limit, the user can turn it off, adjust it "over a wide range that is at least ten times the length of the default setting", or be "warned before time expires and given at least 20 seconds" to extend it with a simple action, at least ten times. Real-time events, limits where extension "would invalidate the activity", and limits "longer than 20 hours" are exempt.

The limits a design system meets are session time-outs, auto-dismissing toasts and auto-advancing content. A toast that disappears after five seconds is a time limit on reading it.

**What a check can see.** *Figma:* a session-expiry warning with an extend action; a dismiss control and a persistent variant on toasts. *Rendered page:* the real time-out and a warning at least 20 seconds before it. *Judgement:* whether a limit is essential.

**Good practice.** Never auto-dismiss anything the user must read or act on.

**Pros and cons.** Removing limits is usually free. Security-driven session limits cost a dialog and a timer, a modest price for a Level A criterion.

**Recommendation.** No auto-dismiss on actionable messages, and a designed warn-and-extend dialog wherever a session can expire.

---

## 13. Consistent help, redundant entry, accessible authentication

**The short answer.** Three new criteria from the cognitive work in section 9, all decided by templates and flows: help stays put, nothing is asked twice, and sign-in is never a memory or transcription test.

[3.2.6 Consistent Help](https://www.w3.org/WAI/WCAG22/Understanding/consistent-help.html) (A): human contact details, a contact mechanism, a self-help option or an automated contact mechanism that repeat across pages "occur in the same order relative to other page content." It "does not require authors to provide help"; only that help does not move.

[3.3.7 Redundant Entry](https://www.w3.org/WAI/WCAG22/Understanding/redundant-entry.html) (A): "Information previously entered by or provided to the user that is required to be entered again in the same process" is auto-populated or selectable, except where re-entry is essential, needed for security, or the earlier information is no longer valid. A process is one activity, not a return visit.

[3.3.8 Accessible Authentication (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/accessible-authentication-minimum.html) (AA): no sign-in step relies on a cognitive function test, "A task that requires the user to remember, manipulate, or transcribe information", unless an alternative, an assisting mechanism, object recognition or the user's own content is offered. The document counts password managers and copy and paste as mechanisms, and a page that blocks them fails unless it offers an alternative.

**What a check can see.** *Figma:* help position across page templates; "same as" options in repeated flows; split one-time-code boxes on sign-in screens. *Rendered page:* help order across pages; `autocomplete` on fields; paste working in password and code fields. *Judgement:* what counts as the same process, and whether re-entry is truly for security.

**Good practice.** Put help in the template so it cannot move. Avoid split code inputs unless tested with paste and password managers.

**Pros and cons.** All three are cheap in templates and expensive to retrofit. Accessible authentication can clash with security instincts, and the criterion settles that argument in favour of paste.

**Recommendation.** Fix help in the template, design out repeated fields, and require paste and password-manager support on every sign-in screen.

---

## 14. Disabled controls

**The short answer.** WCAG exempts disabled controls from contrast, which is why they are a design problem: a faint control that does not explain itself is hard to see and harder to understand. Prefer an enabled control that says what is missing.

The exemption is real. [1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) excludes text "that are part of an inactive user interface component", and [1.4.11](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html) excludes "inactive components", with the example of a submit button unusable until required fields are filled. Code-standard rule 62 relies on it: dimming by opacity is acceptable for disabled, and only for disabled.

The systems that discuss the trade lean against disabling. GOV.UK's [button guidance](https://design-system.service.gov.uk/components/button/): "Disabled buttons have poor contrast and can confuse some users, so avoid them if possible", and "Only use disabled buttons if research shows it makes the user interface easier to understand." Carbon's [disabled states](https://carbondesignsystem.com/patterns/disabled-states/) separates three cases: default disabled for a temporary block, which "should never fully disappear from the user's view"; read-only, where content still matters and "should always be accessible to a screen reader"; and hidden, for missing permission, where "The user does not know the option is there." When a disabled item affects the primary action, the notification "should describe how the user can enable or re-enable the disabled component."

Commentary: Vitaly Friedman's [*Usability Pitfalls of Disabled Buttons*](https://www.smashingmagazine.com/2021/08/frustrating-design-patterns-disabled-buttons/) (Smashing Magazine, 2021) puts it bluntly: "Disabled buttons don't explain what's wrong." They are usually not focusable, so keyboard users cannot reach them to learn anything. He recommends validating on submit, explaining what is missing near the button, or using `aria-disabled` to keep the control focusable, and keeps disabled states for unavailable items and preventing double submission.

**What a check can see.** *Figma:* which components have a disabled variant; an explanation drawn beside any disabled primary action; read-only as a separate state. *Rendered page:* `aria-disabled` where a control must stay reachable, and an explanation associated with it. *Judgement:* whether a disabled state teaches (a feature exists) or blocks (no reason given), which is GOV.UK's "if research shows" test.

**Good practice.** Keep disabled (temporary, visible, explained), read-only (readable, not editable) and hidden (no permission) apart in the library. Do not disable a submit button to signal incomplete input; let it submit and show errors.

**Pros and cons.** Disabled states prevent invalid actions and double submission, and show that a feature exists. They cost discoverability. The contrast exemption makes the conformance question easy and the usability question harder.

**Recommendation.** Avoid disabled submit buttons, separate the three states in the library, and require an explanation wherever a primary action is disabled.

---

## 15. Inclusive design principles

**The short answer.** WCAG says what fails; inclusive design principles say what to aim for. Use them as review questions, not conformance claims.

The [Inclusive Design Principles](https://inclusivedesignprinciples.info/), by Henny Swan, Ian Pouncey, Heydon Pickering and Léonie Watson, are seven: provide comparable experience, consider situation, be consistent, give control, offer choice, prioritise content, and add value, each a sentence such as "Use familiar conventions and apply them consistently." Microsoft's [Inclusive Design](https://inclusive.microsoft.design/) gives three: "Recognize exclusion", "Learn from diversity" and "Solve for one, extend to many", with the claim that designing for people with permanent disabilities "creates results that benefit everyone."

Commentary: the seven read as a checklist for a screen, Microsoft's three as a stance for a team, and both overlap heavily with the COGA objectives in section 9.

**What a check can see.** *Figma and rendered page:* only consistency, meaning the same component, label and placement for the same job across screens. *Judgement:* everything else.

**Good practice.** Ask the seven at review of a new template, and ask "who does this exclude?" whenever a pattern is chosen for efficiency.

**Pros and cons.** The principles widen the frame beyond pass and fail, where most real usability gains are. They are not testable, so they lose to deadlines unless someone owns them.

**Recommendation.** Put the seven on the design-review template beside the COGA objectives, and keep them out of the audit, where they would only make noise.

---

## 16. Cheat sheet

| Topic | Design does this | Check on Figma | Check on the page |
|---|---|---|---|
| Baseline | WCAG 2.2 AA; AAA named one by one | — | — |
| Annotations | Headings, landmarks, order, names, alt, announcements, per screen | Present; icon-only names | Outline, names, tab order match |
| Order | Annotate ambiguous layouts and dialogs; short sticky headers | Annotations on "yes" components | Tab sequence; nothing hidden under sticky regions |
| Colour | Second cue on every colour signal; underlined links | Status variants carry icon or word | Links underlined |
| Contrast | 4.5:1 text, 3:1 large text and UI, unrounded | Every token pair, every mode | Composited contrast on real backdrops |
| Reflow and spacing | 320px frame; no fixed-height text boxes | Frame exists; no fixed height around text | No sideways scroll at 320; spacing survives; 200% text |
| Targets | 24px floor; 44pt or 48dp for touch; non-drag alternative | Component bounding boxes; alternative variant | Hit areas; 24px circle test |
| Motion | Reduced version of each animation; no flashing; pause on autoplay | Reduced spec; pause variant | Reduced-motion emulation; flash analysis |
| Cognitive | Eight COGA objectives at review | Visible labels; one primary action | Consistent placement |
| Alternatives | Informative or decorative, and the text | Annotation on every image | Missing alt or names |
| Errors | Text naming the fix; undo or review on data changes | Error variant with text slot | Message tied to field |
| Time limits | No auto-dismiss on actionable messages; warn-and-extend | Warning dialog drawn | Warning 20 s ahead |
| Help, re-entry, sign-in | Help in template; never ask twice; paste allowed | Help placement; "same as" options | Order across pages; paste works |
| Disabled | No disabled submit; explain any disabled primary action | Explanation drawn; read-only separate | `aria-disabled` where reachable |

---

## 17. The short version

Target WCAG 2.2 AA: the current Recommendation and the version UK public-sector law names. WCAG 3 is a draft that says it will change.

Most accessibility is decided in the design file. Contrast is a token pair, target size is a frame, reading order is the layout, an error message is copy. The code standard owns what a frame cannot show: DOM order, focus after a swap, accessible names, `hidden`, `color-scheme` and `aria-current`. Keep the section 2 table and review each half where it is made.

Annotate only what the component does not decide: heading levels, landmarks, ambiguous order, icon-only names, alt text, announcements. GitHub found 48% of its audit issues preventable that way.

Audit contrast as token pairs, unrounded, in every mode, and keep a rendered check for opacity and images. Never let colour signal alone. Draw a 320px frame, keep text out of fixed-height boxes, make targets at least 24 pixels and preferably 44 points or 48dp, and draw a single-pointer alternative to every drag. Specify reduced motion even though the criterion is AAA.

Write errors that name the fix, offer undo or review on anything that changes data, avoid time limits, keep help in the template, never ask twice, never block paste at sign-in, and prefer an enabled button that explains itself to a disabled one that does not. Ask the COGA objectives and inclusive principles at review; they will never fail an audit, which is why someone has to ask them.

**When something looks wrong, this is usually why.** A failure nobody can fix in code was decided in the design and not annotated. A plugin showing 4.5 on a failing pair is rounding. A layout that breaks at 400% zoom had no 320px frame. A card that clips text under increased spacing has a fixed height. A user lost after a dialog closed means nobody said where focus goes.

---

## Sources

**Primary: standards and specifications**

- [W3C, Web Content Accessibility Guidelines 2.2](https://www.w3.org/TR/WCAG22/). Recommendation of 12 December 2024; the new criteria, the removal of 4.1.1, and the note on AAA as a general policy.
- [W3C, WCAG 3.0 Working Draft](https://www.w3.org/TR/wcag-3.0/). The 10 September 2026 draft and its status statements.
- [W3C, Accessibility Roles and Responsibilities Mapping](https://www.w3.org/WAI/planning/arrm/). Ownership by role.
- W3C Understanding documents for WCAG 2.2: [1.1.1](https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html), [1.2.2](https://www.w3.org/WAI/WCAG22/Understanding/captions-prerecorded.html), [1.3.2](https://www.w3.org/WAI/WCAG22/Understanding/meaningful-sequence.html), [1.4.1](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html), [1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html), [1.4.4](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html), [1.4.10](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html), [1.4.11](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html), [1.4.12](https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html), [2.2.1](https://www.w3.org/WAI/WCAG22/Understanding/timing-adjustable.html), [2.2.2](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html), [2.3.1](https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html), [2.3.3](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html), [2.4.3](https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html), [2.4.11](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum), [2.5.5](https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html), [2.5.7](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html), [2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html), [3.2.6](https://www.w3.org/WAI/WCAG22/Understanding/consistent-help.html), [3.3.1](https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html), [3.3.3](https://www.w3.org/WAI/WCAG22/Understanding/error-suggestion.html), [3.3.4](https://www.w3.org/WAI/WCAG22/Understanding/error-prevention-legal-financial-data.html), [3.3.7](https://www.w3.org/WAI/WCAG22/Understanding/redundant-entry.html), [3.3.8](https://www.w3.org/WAI/WCAG22/Understanding/accessible-authentication-minimum.html).
- [W3C, Technique G183](https://www.w3.org/WAI/WCAG22/Techniques/general/G183). 3:1 between inline links and surrounding text.
- [W3C, Making Content Usable for People with Cognitive and Learning Disabilities](https://www.w3.org/TR/coga-usable/). Working Group Note, 29 April 2021; the eight objectives.
- [GOV.UK, Accessibility requirements for public sector websites and apps](https://www.gov.uk/guidance/accessibility-requirements-for-public-sector-websites-and-apps). The WCAG 2.2 AA requirement.

**Primary: design systems and platforms**

- [Apple, Human Interface Guidelines: Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility). Control sizes, spacing, contrast table, colour independence, Reduce Motion.
- [Android Developers, Make apps more accessible](https://developer.android.com/guide/topics/ui/accessibility/apps). The 48dp target.
- [IBM Carbon, Keyboard accessibility](https://carbondesignsystem.com/guidelines/accessibility/keyboard/); component pages for [modal](https://carbondesignsystem.com/components/modal/accessibility/), [checkbox](https://carbondesignsystem.com/components/checkbox/accessibility) and [link](https://carbondesignsystem.com/components/link/accessibility/). Default focus order and which components need annotation.
- [IBM Carbon, Disabled states](https://carbondesignsystem.com/patterns/disabled-states/). Disabled, read-only and hidden.
- [GOV.UK Design System, Button](https://design-system.service.gov.uk/components/button/). Disabled buttons.
- [Microsoft Fluent 2, Accessibility](https://fluent2.microsoft.design/accessibility). Focus order, screen-reader annotation and contrast in the spec; designing to 320px.
- [Microsoft Learn, Accessibility design specs with annotations](https://learn.microsoft.com/en-us/training/modules/accessibility-design-specs-with-annotations). The definition and the Figma tools.
- [GitHub Blog, Level up design-to-code collaboration with GitHub's open source Annotation Toolkit](https://github.blog/enterprise-software/collaboration/level-up-design-to-code-collaboration-with-githubs-open-source-annotation-toolkit/). The 48% figure.
- [GitHub Blog, Design system annotations, part 1](https://github.blog/?p=87647). Why accessible components do not make accessible pages.
- [Primer, Annotation Toolkit](https://primer.style/accessibility/tools-and-resources/annotation-toolkit). The annotation categories.
- [Microsoft, Inclusive Design](https://inclusive.microsoft.design/). The three principles.

**Commentary, labelled as such in the text**

- [Inclusive Design Principles](https://inclusivedesignprinciples.info/), Swan, Pouncey, Pickering and Watson.
- [Vitaly Friedman, *Usability Pitfalls of Disabled Buttons, and How To Avoid Them*](https://www.smashingmagazine.com/2021/08/frustrating-design-patterns-disabled-buttons/), Smashing Magazine, 5 August 2021.

**Toolkit**

- `standards/code-standard.md` in the toolkit repository, rules 2, 14, 15, 16, 17, 18, 62 and 64, for the code side of section 2.
- `focus-indicators.md` in this folder, for focus-ring appearance and the focused error field.
