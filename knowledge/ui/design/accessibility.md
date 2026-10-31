# Accessibility as design decisions

This file covers the design half of accessibility: the decisions about a whole screen that are settled in the design file, before any markup exists, and that code can build faithfully and still ship as a failure. The code half is in two pages: choosing the element, landmarks and forms markup in [HTML semantics](../../code/html-semantics.md), and focus management, the reduced-motion block and the manual checking pass in [accessibility in code](../../code/accessibility.md); read them for how a decision here is built. Both serve design-standard's principle *for everyone, in any context*, and with it *people in control, mistakes forgiven*, *discoverable* and *clear words, clear hierarchy*. design-standard's Accessibility area admits no rule yet; what is below is guidance, and nothing here may be cited as a rule. Criteria are cited to the W3C's Understanding documents for WCAG 2.2, and each system's practice to its own page.

## The baseline and who owns what

**What good looks like**
- One versioned target, stated once in the project's context document: WCAG 2.2 AA.
- An AAA criterion a team meets is named by number, never claimed as "AAA".
- Each criterion has one owner, and design review checks the design half.
- A failure found in a frame is reported as a design bug, never reproduced.

**How:** [WCAG 2.2](https://www.w3.org/TR/WCAG22/) became a Recommendation on 12 December 2024 and is what UK public-sector sites [must meet](https://www.gov.uk/guidance/accessibility-requirements-for-public-sector-websites-and-apps). [WCAG 3](https://www.w3.org/TR/wcag-3.0/) is a draft that says its final requirements "will be different"; read it for direction only. WCAG advises against requiring AAA "as a general policy for entire sites".

Who owns what is design-standard's *Accessibility* section, which this page does not restate: a component in Figma is figma-standard's, code is code-standard's, and this page covers what a screen decides that neither can. The code practices not yet proven are [code candidates](../../code/candidates.md).

The split follows the W3C's [Accessibility Roles and Responsibilities Mapping](https://www.w3.org/WAI/planning/arrm/). A row with entries in both columns is a handover, and the handover is an annotation.

| Criterion | Level | Designed (this file) | Built (code-standard) |
|---|---|---|---|
| 1.1.1 Non-text Content | A | Informative or decorative, and the text | `alt`, names (code-standard rule 18) |
| 1.2.2 Captions (Prerecorded) | A | A captions control, room for captions | The caption track |
| 1.3.1 Info and Relationships | A | Heading levels, groups, visible labels | Semantic markup (code-standard rule 1) |
| 1.3.2 Meaningful Sequence | A | Reading order | DOM order (code-standard rule 2) |
| 1.4.1 Use of Color | A | A second cue beside every colour signal | Nothing, if the design is right |
| 1.4.3 Contrast (Minimum) | AA | Text and surface token pairs | Not overriding them |
| 1.4.4 Resize Text | AA | Layouts that take 200% text | Relative units (code-standard rule 54) |
| 1.4.10 Reflow | AA | A 320px layout | Responsive CSS |
| 1.4.11 Non-text Contrast | AA | Borders, icons, state marks at 3:1 | Not overriding them |
| 1.4.12 Text Spacing | AA | No text in fixed-height boxes | Containers that grow |
| 2.2.1 Timing Adjustable | A | Whether there is a limit, and the warning | The timer |
| 2.2.2 Pause, Stop, Hide | A | A pause control on what moves | Its behaviour |
| 2.3.1 Three Flashes | A | No flashing content | Not shipping it |
| 2.4.3 Focus Order | A | Intended order, focus on open and close | Focus management (code-standard rules 2, 14) |
| 2.4.7 Focus Visible | AA | The indicator | The selector that carries it |
| 2.4.11 Focus Not Obscured (Minimum) | AA | Height and behaviour of sticky regions | Scroll padding |
| 2.5.7 Dragging Movements | AA | A drawn non-drag alternative | Wiring it |
| 2.5.8 Target Size (Minimum) | AA | Target size and spacing | Not shrinking them |
| 3.2.6 Consistent Help | A | Help placed in the template | Nothing |
| 3.3.1 Error Identification | A | Error text, not only a red border | Associating it (code-standard rule 15) |
| 3.3.3 Error Suggestion | AA | The words of the fix | Showing it |
| 3.3.4 Error Prevention | AA | A review, undo or confirm step | Implementing it |
| 3.3.7 Redundant Entry | A | Flows that never ask twice | Auto-fill |
| 3.3.8 Accessible Authentication | AA | Sign-in with no memory or transcription test | Not blocking paste |
| 4.1.2 Name, Role, Value | A | The name of each icon-only control | `aria-label`, roles, states (code-standard rule 18) |

**Cases:**
- A project owner asks for "AAA" → write "WCAG 2.2 AA" and list any AAA criteria met by number.
- A built page scrolls sideways at 320px though the design has a 320px frame → a build finding; with no 320px frame it is a design finding first.
- A checklist cites "2.4.11 Focus Appearance, AA" → a draft numbering; 2.4.11 shipped as Focus Not Obscured, and appearance is [2.4.13](https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html), AAA.

**Accessibility:** the map; each criterion is worked through below.

**Build:**
- No code of its own: the target version is a line in the project's context document, and the built column of the table above is code-standard's, row by row. The code half is indexed at [accessibility: testing with a keyboard and a screen reader](../../code/accessibility.md#testing-with-a-keyboard-and-a-screen-reader).

**Check:** *Script* — could: refuse an audit report whose project context names no target version. *Judgement* — does every finding say which half it is in, so it reaches whoever can fix it?

**Sources:** WCAG 2.2; [ARRM](https://www.w3.org/WAI/planning/arrm/) (an in-progress draft). Some rows are genuinely shared (a correct 320px frame built in a fixed-width container); the table says who decides, not who can break it.

## Annotations as a design deliverable

**What good looks like**
- Every interactive screen that ships carries an annotation layer.
- It covers what changes per placement and leaves out what the component already decides.
- Review checks the built page against it.

**How:** a frame shows how a screen looks and almost nothing of how it behaves for someone who cannot see it. [Microsoft Learn](https://learn.microsoft.com/en-us/training/modules/accessibility-design-specs-with-annotations) defines annotations as "labels or comments included in designs for digital products to outline how elements should be made accessible". Annotate per screen:
- **Focus order** where the layout does not make it obvious, and focus on a dialog's open and close (next section).
- **Headings:** each level, chosen for the outline, never for the size.
- **Landmarks:** header, navigation (each named when there are two), main, complementary, footer.
- **Names:** every icon-only control; link or button where a component could be either.
- **Images:** informative with its text, or decorative.
- **Live regions:** what is announced when part of the screen updates in place (a result count, "Saved"), and whether it waits or interrupts.
- **Document title and language**, and any passage in another language.

Use Figma's native annotations, which the API can read, or the [GitHub Annotation Toolkit](https://primer.style/accessibility/tools-and-resources/annotation-toolkit), whose categories match this list. Keep them in a layer beside the frame, never inside instances.

**Cases:**
- An accordion is a top-level section on one screen and sits inside a card on another → annotate its heading level on each; "Component usage is contextual" ([GitHub, part 1](https://github.blog/?p=87647)).
- A card has a title link and an icon "Save" → annotate the button's name ("Save *card title*") and that the title is the link.
- A filter updates a list in place → annotate the announcement ("12 results") and that focus stays on the control; code-standard rule 14 builds it.
- A screen of accessible components with no annotations → still a finding; accessible parts do not make a heading outline.
- A text button with a visible label → no annotation; its name is its text.

**Accessibility:** 1.3.1, 1.1.1 and 4.1.2 (structure, text and names decided here); 2.4.3 (order); 4.1.3 Status Messages (what is announced without moving focus). Built by code-standard rules 1, 14, 15, 18 and 64.

**Build:**
- Each annotation category has its markup: heading levels and landmarks (code-standard rules 1 and 3), names (code-standard rule 18), descriptions (code-standard rule 15), the current page (code-standard rule 64), live regions (code-standard rule 14).
- Title and language are `title` and `lang` ([HTML semantics: document metadata](../../code/html-semantics.md#document-metadata), [i18n: language and direction](../../code/i18n.md#language-and-direction)); landmarks: [HTML semantics: landmarks](../../code/html-semantics.md#landmarks).

**Check:** *Script* — could: on a Figma file, frames with interactive instances and no annotations, and icon-only instances with no name annotation (presence, not correctness); on a built page, the heading outline, landmarks, names and tab sequence against the annotations. *Judgement* — are the names, levels and order right for this content?

**Sources:** [GitHub](https://github.blog/enterprise-software/collaboration/level-up-design-to-code-collaboration-with-githubs-open-source-annotation-toolkit/) reports that "nearly half of accessibility audit issues (48%) could have been prevented if design intent had been better documented upfront"; that is its own audits, not an independent study. [Fluent 2](https://fluent2.microsoft.design/accessibility) asks for the same in the spec. Annotations drift when nobody updates them; annotating only what is contextual limits that.

## Focus order and reading order

**What good looks like**
- The default order needs no annotation; every layout where visual and logical order could differ has one.
- A dialog says where focus lands on open and returns on close.
- Sticky regions never entirely cover a focused control.

**How:** [Carbon](https://carbondesignsystem.com/guidelines/accessibility/keyboard/) gives the default: header, main navigation, content "(from left to right, top to bottom)", footer. Annotate the exceptions:
- **Multi-column forms:** by row or by column ([Carbon checkbox](https://carbondesignsystem.com/components/checkbox/accessibility)).
- **Cards with more than one action:** which comes first.
- **Dialogs:** the first stop on open and the return on close, chosen as [dialogs: focus](../patterns/dialogs.md#focus-in-trapped-returned) sets out ([2.4.3](https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html)).
- **Layouts reordered between breakpoints:** reading order holds at every width (code-standard rule 2).
- **Sticky headers, footers and banners:** their height at 320px as well as desktop, and whether a banner overlays content or pushes it down.

Give each library component a "needs a focus-order annotation: yes or no" line, so the call is made once.

**Cases:**
- A two-column settings form reads left then right → annotate row order; otherwise focus runs down one column and up the other.
- A dialog deletes the row that opened it → annotate the return to the next row, or the list heading if it was the last; the trigger is gone.
- A mobile layout lifts the summary above the form with grid areas → change the design's order too, or annotate that reading order stays form first.
- A 120px sticky header on a phone frame → shorten it or let it scroll away; at 400% zoom it covers most of the viewport, and an overlay that hides the focused control fails 2.4.11.
- A one-column link list → nothing to annotate ([Carbon link](https://carbondesignsystem.com/components/link/accessibility/)).

**Accessibility:** [1.3.2](https://www.w3.org/WAI/WCAG22/Understanding/meaningful-sequence.html) (a correct reading sequence where order affects meaning); 2.4.3 (order preserves meaning; outside an open dialog is inert); [2.4.11](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum) (not entirely hidden by author content). Built by code-standard rules 2 and 14; dialog mechanics are [accessibility in code: *Focus management*](../../code/accessibility.md#focus-management)'s.

**Build:**
- DOM order is reading order; a visual reorder never changes it (code-standard rule 2), and no positive `tabindex`.
- A modal is `dialog` opened with `showModal()`, which makes the rest inert; focus on open and return on close are scripted ([accessibility: focus management](../../code/accessibility.md#focus-management)).
- Sticky regions are matched by `scroll-padding` so a focused control is not covered.

**Check:** *Script* — could: on a Figma file, dialogs, menus and multi-column frames with no order annotation, and sticky regions over a set share of a 320px frame's height; on a built page, tab sequence against each stop's position, and focused elements fully under a sticky region. *Judgement* — does this order preserve meaning?

**Sources:** WCAG Understanding 1.3.2, 2.4.3, 2.4.11; Carbon; Fluent 2 (the same default as a "z"). Annotating only exceptions risks "obvious to the designer, not the engineer"; the per-component line settles it.

## Focus visibility

**What good looks like**
- Every interactive element has a focus state, drawn in the component (figma-standard rule 31).
- On every surface a screen places it, the ring reaches 3:1 against what is around it.
- No overlay, clipping or sticky region hides it.

**How:** the ring itself is a library decision. In short: at AA there is no thickness rule, only an indicator ([2.4.7](https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html)) at 3:1 against adjacent colours ([1.4.11](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)). The rule with numbers is [2.4.13](https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html), AAA (an area of at least a 2px perimeter, 3:1 change contrast): an offset 2px ring passes, a ring inside the component needs about 3px, which is why [Red Hat](https://ux.redhat.com/foundations/interactions/focus-indicators/) uses 3px everywhere. A one-colour ring fails on some surface; a two-colour ring built to technique [C40](https://www.w3.org/WAI/WCAG22/Techniques/css/C40) (two bands of at least 2px, 9:1 or more against each other) closes that. On inputs the border can be the indicator, thickened or recoloured with a measured 3:1 change. A field in error keeps its normal ring and the error border thins ([GOV.UK Frontend #1870](https://github.com/alphagov/govuk-frontend/pull/1870) measured red to black at 2.75:1 and fixed the error, not the ring). Controls that take you somewhere may show focus to keyboard users only ([`:focus-visible`](https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-visible)); controls you work inside, text inputs above all, show it to everyone.

What the screen decides is where the ring lands: on a dark band, over an image, inside a scroll container that clips it, under a sticky header. Draw each control's focused state at least once on each surface it appears on.

**Cases:**
- A primary button on a band of the brand colour → draw its focus there; a same-hue ring is near 1:1. Use the two-colour ring or a ring mode for that surface.
- Cards in a horizontal scroll row clip their rings → give the row inner padding at least the ring's width plus offset.
- A focused field in error drawn with a red ring → keep the normal ring; red makes colour the only difference between two focused states.
- A focused link in a dark footer → measure against the footer, not the page.
- One ring colour per mode, offset from the component → it is measured against the surface, never the component, so a near-black ring on light surfaces and near-white on dark ones passes everywhere a mode has only surfaces of its own lightness. A two-colour ring is needed once one mode mixes light and dark surfaces, or a ring lands on an image: two colours at least 9:1 apart guarantee one reaches 3:1 on any solid background ([C40](https://www.w3.org/WAI/WCAG21/Techniques/css/C40)), the reasoning behind Chrome's dark ring with a thin white edge ([Chromium blog](https://blog.chromium.org/2020/03/updates-to-form-controls-and-focus.html)).

**Accessibility:** 2.4.7; 1.4.11; 2.4.11; 2.4.13 (AAA, named because it is cheap). The component is figma-standard rule 31; the selector and mixin are [accessibility in code](../../code/accessibility.md)'s.

**Build:**
- The ring is one mixin under `:focus-visible` (`:focus` for text inputs), outside the edge with an offset, from a focus token; a removed outline is `outline: 0` (code-standard rule 40).
- A scroll container keeps inner padding for the ring. Detail: [accessibility: visible focus](../../code/accessibility.md#visible-focus) and [figma handoff: focus rings: reading their geometry](../../code/figma-handoff.md#focus-rings-reading-their-geometry).

**Check:** *Script* — could: on a built page, focus each control and measure the ring against its backdrop and component; on a Figma file, the focus token against every surface token, every mode. *Judgement* — can a keyboard user find focus at a glance on every surface?

**Sources:** the above, and [GOV.UK focus states](https://design-system.service.gov.uk/get-started/focus-states). Checklists written before WCAG 2.2's final numbering call a 2px, 3:1 ring an AA requirement under 2.4.11; the toolkit follows the published criteria, where it is 2.4.13 and AAA.

## Colour independence and contrast

**What good looks like**
- Colour is never the only signal for information, an action, a prompt or a difference.
- Text meets 4.5:1, large text 3:1, unrounded, against its real surface, in every mode.
- What identifies a control or its state meets 3:1 against what is next to it.
- A disabled control is dimmed and, where it matters, explained.

**How:**
- **Second cue.** Every status colour gets an icon or word; inline links are underlined ([G183](https://www.w3.org/WAI/WCAG22/Techniques/general/G183) accepts 3:1 against surrounding text instead, but underlining needs no measurement); chart series get labels or direct labelling; a selected state changes shape or weight as well.
- **Text** ([1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)): 4.5:1, or 3:1 from 18pt or 14pt bold (about 24 and 18.5 CSS px). Not rounded: `#767676` on white is 4.54:1 and passes, `#777777` is 4.48:1 and fails, and a one-decimal plugin shows 4.5 for both. Audit pairs, never swatches.
- **Non-text** ([1.4.11](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)): 3:1 for input borders, meaningful icons, check and radio marks, selected and focused indicators, and chart parts needed to read it. Hover is exempt if it lowers nothing else. Chart lines need 3:1 against the background, not each other; a chart whose values are also in text is exempt.
- **Composited colour.** Text over images, gradients or translucent fills is measured where it lands. `opacity` on a container lowers everything in it while the tokens still pass (a [code candidate](../../code/candidates.md) records 1.98:1 from tokens measuring 8.5:1).
- **Disabled.** Inactive components are exempt from 1.4.3 and 1.4.11, which makes disabled a design problem, worked out in [interaction: disabled, hidden or read-only](interaction.md#disabled-hidden-or-read-only). Dimming by opacity is for disabled only (code-standard rule 62).

**Cases:**
- Green, amber and red status dots → add the word or a distinct icon; a red-blind reader cannot tell them apart.
- Completed rows dimmed with opacity → use a token pair that still reaches 4.5:1, or mark completion with an icon; a completed row is not inactive, so not exempt.
- A selected segment shown only by a lighter fill at 1.3:1 → add a 3:1 border, a weight change or a check.
- A disabled "Publish" with no reason → draw the reason beside it ("Add a title to publish"), or keep it enabled and show the error on press.
- White text on a photograph → add a scrim token and measure against the lightest area it can cover.

**Accessibility:** [1.4.1](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html) (A); 1.4.3; 1.4.11. Component text contrast is figma-standard rule 32; code-standard rule 16 makes native controls follow the theme.

**Build:**
- Text and surface come from paired role tokens, never overridden ([tokens: three tiers](../../code/tokens.md#three-tiers)); no `opacity` on a container except for disabled (code-standard rule 62).
- Inline links keep their underline; a status carries its word or icon in markup; native controls follow the theme (code-standard rule 16).

**Check:** *Script* — could: on a Figma file, every text variable against every surface it is used on, per mode, unrounded, and border and icon tokens at 3:1; on a built page, each text node against its composited backdrop, underlined inline links, status cells with no text or icon. *Judgement* — does a colour carry meaning here, and is the second cue understood without it?

**Sources:** WCAG Understanding 1.4.1, 1.4.3, 1.4.11; [Apple HIG](https://developer.apple.com/design/human-interface-guidelines/accessibility) ("Convey information with more than color alone"; it also names APCA, but conformance is judged by WCAG 2's formula, which the toolkit uses); [GOV.UK button](https://design-system.service.gov.uk/components/button/) ("avoid them if possible") on disabled buttons.

## Zoom, reflow and text spacing

**What good looks like**
- Every template has a 320px frame designed alongside the widest.
- Every text container grows with its content; truncated text can be shown whole.
- Only maps, diagrams and genuinely two-dimensional tables scroll sideways, inside a page that does not.

**How:** [1.4.10](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html): no two-dimensional scrolling at 320 CSS px wide (256 high for horizontal content), a 1280px window at 400% zoom. [1.4.4](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html): text to 200% without loss. [1.4.12](https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html): nothing lost at line height 1.5, paragraph spacing 2, letter spacing 0.12 and word spacing 0.16 times the font size; truncation passes only with a way to see the rest ("if there is no mechanism to show the truncated text, it fails"). In the design: hug every text frame vertically; draw the 320px frame with the longest real string; decide what each multi-column region becomes (stacked, a disclosure, its own scroll region); let buttons and chips wrap to two lines. Breakpoints are code-standard rule 54's.

**Cases:**
- Six navigation links at 320px → wrap them or move them behind a menu button.
- Fixed-height cards with three-line descriptions → let cards grow, or truncate with a "more"; extra spacing otherwise clips the third line.
- An eight-column table at 320px → it scrolls on its own axis with a sticky first column, and the page around it reflows.
- A fixed-height button → hug height with padding; 1.5 line height pushes the label out.
- A side panel beside content → at 320px stack it in reading order, and annotate which comes first.

**Accessibility:** 1.4.4; 1.4.10 (a [code candidate](../../code/candidates.md) after one run); 1.4.12. Code keeps it with rem (code-standard rule 54); fixed heights around text are a component finding for `figma-components-audit`.

**Build:**
- Lengths in rem (code-standard rule 54); no fixed `height` on a box that holds text, `min-block-size` if anything.
- A wide table scrolls in its own focusable region; truncation has a way to show the rest. Detail: [responsive: zoom and reflow](../../code/responsive.md#zoom-and-reflow), [tables on small screens](../../code/responsive.md#tables-on-small-screens) and [truncation and line clamps](../../code/responsive.md#truncation-and-line-clamps).

**Check:** *Script* — could: on a Figma file, templates with no frame of 320px or narrower, text inside fixed-height frames; on a built page, horizontal scroll at 320px, clipping after injecting the four spacing values, loss at 200% text. *Judgement* — does a table truly need two dimensions, and does the reflowed order read?

**Sources:** WCAG Understanding 1.4.4, 1.4.10, 1.4.12; [Fluent 2](https://fluent2.microsoft.design/accessibility) (design down to 320px). Figma cannot apply user text spacing, so the built page is the proof.

## Target size

**What good looks like**
- Every target is at least 24 by 24 CSS px; touch and important targets are 44pt (Apple) or 48dp (Android).
- Visible size and target size are drawn apart: a small icon in a larger frame.
- Every drag has a drawn single-pointer alternative.

**How:** [2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) sets 24 by 24, with exceptions for spacing (a 24px circle on each small target touches no other), an equivalent control, inline targets, browser-drawn controls and essential presentation; its Understanding text suggests 44px ([2.5.5](https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html), AAA) for important controls. [Apple](https://developer.apple.com/design/human-interface-guidelines/accessibility) defaults to 44pt on iOS, with about 12pt around bezelled controls and 24pt around unbezelled ones; [Android](https://developer.android.com/guide/topics/ui/accessibility/apps) recommends 48dp. The component floor is figma-standard rule 26; the screen adds spacing, density and drag alternatives. [2.5.7](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html): a sortable list also moves items with up and down controls; a map also pans with buttons.

**Cases:**
- Three 16px row actions 4px apart → put each in a 24px frame or move them into a row menu.
- A list reorders by drag only → draw "Move up" and "Move down" in the row menu.
- A dense desktop tool wants 20px controls → keep 24px; the spacing exception invites tiny spread-out controls.
- A link inside a paragraph → exempt.

**Accessibility:** 2.5.8; 2.5.7; 2.5.5 (AAA) for important controls. Component floor figma-standard rule 26; on a page a [code candidate](../../code/candidates.md).

**Build:**
- The hit area is at least 24px by padding or a pseudo-element, independent of the glyph ([responsive: touch targets](../../code/responsive.md#touch-targets)).
- Every drag has a button alternative wired to the same action ([JavaScript: dragging and its single-pointer alternative](../../code/javascript.md#dragging-and-its-single-pointer-alternative)).

**Check:** *Script* — could: on a Figma file, each interactive instance's bounding box and gap to neighbours; on a built page, hit areas with the 24px circle test. *Judgement* — is a small target truly inline or essential, and is an "equivalent" control equivalent?

**Sources:** WCAG Understanding 2.5.5, 2.5.7, 2.5.8; Apple; Android. They differ on the number; the toolkit takes 24px as the floor and the platform default as the touch target.

## Motion and vestibular safety

**What good looks like**
- Nothing flashes more than three times a second.
- Nothing moves on its own for over five seconds without pause, stop or hide.
- Every non-essential animation has a designed reduced form.

**How:** [2.3.1](https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html): no more than three flashes in a second, or below the thresholds. [2.2.2](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html): automatic moving, blinking or scrolling content lasting over five seconds beside other content needs a way to pause, stop or hide it; auto-updating content needs control of its frequency. [2.3.3](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html) is AAA, but its Understanding text names the harm ("distraction or nausea", dizziness from scroll-triggered motion, parallax as the example); the toolkit treats it as required. Specify the reduced form beside each transition: a slide becomes a cross-fade, a zoom an instant change, parallax static, a loop its first frame. Reduce rather than remove where motion carries meaning. Apple's Reduce Motion cuts "automatic and repetitive animations, including zooming, scaling, and peripheral motion". The code's global reduced-motion block is a backstop, not the design.

**Cases:**
- An auto-advancing carousel → avoid it, and never in documentation or dashboards; if kept, a visible pause, stopping on hover and focus.
- A dashboard that refreshes every ten seconds → a pause or refresh-rate control, and a polite announcement (annotations).
- A full-viewport slide transition → a cross-fade as its reduced form.
- A badge that pulses rapidly → slow it below three a second or make it one change.

**Accessibility:** 2.3.1 (A); 2.2.2 (A); 2.3.3 (AAA, required here). The `prefers-reduced-motion` build is the code half.

**Build:**
- The base layer holds one `prefers-reduced-motion: reduce` block as the backstop; each transition's designed reduced form is its own rule, durations from motion tokens ([tokens: motion tokens](../../code/tokens.md#motion-tokens)).
- Auto-updating content has a pause control; polling stops while paused ([accessibility: reduced motion and colour scheme in code](../../code/accessibility.md#reduced-motion-and-colour-scheme-in-code), [JavaScript: polling and live data](../../code/javascript.md#polling-and-live-data)).

**Check:** *Script* — could: on a Figma file, prototype transitions with movement, zoom or parallax and no reduced form noted, auto-advancing components with no pause variant; on a built page, animation under emulated reduced motion, and flash rate from a recording with a tool such as PEAT. *Judgement* — is this motion essential, and does the reduced form still say what changed?

**Sources:** WCAG Understanding 2.2.2, 2.3.1, 2.3.3; Apple HIG. Conformance and safety part here: 2.3.3 is AAA, so skipping it still conforms. The toolkit follows safety.

## Cognitive accessibility

**What good looks like**
- One main task and one primary action per screen.
- Icons that act carry visible labels.
- No step relies on remembering an earlier one; nothing is asked twice in a process.
- Help sits in the same place on every page that has it.

**How:** the W3C note [*Making Content Usable for People with Cognitive and Learning Disabilities*](https://www.w3.org/TR/coga-usable/) (COGA) covers barriers WCAG 2.x does not, and is "not required for conformance". Ask its eight objectives at review of a new template or flow: understand what things are and how to use them; find what they need; clear content; avoid and correct mistakes; help users focus; processes that do not rely on memory; help and support; adaptation and personalisation. In design terms:
- **Memory:** show what was chosen earlier (a summary panel, steps with their answers).
- **Focus:** one primary action per view ([actions: button hierarchy](../patterns/actions.md#button-hierarchy)); progressive disclosure for the rest.
- **Plain language:** [content: plain language and reading level](content.md#plain-language-and-reading-level); instructions before the field, never only in the error.
- **Consistent help** ([3.2.6](https://www.w3.org/WAI/WCAG22/Understanding/consistent-help.html)): contact details, a contact form, self-help or chat that repeat across pages keep the same order relative to other content. Help is not required; moving it fails. Put it in the template.
- **Redundant entry** ([3.3.7](https://www.w3.org/WAI/WCAG22/Understanding/redundant-entry.html)): what was given earlier in the same process is filled in or selectable, unless re-entry is essential, for security, or no longer valid.

**Cases:**
- A toolbar of eight unlabelled icons → label the common ones, move the rest into a labelled menu.
- A form asks for the email on step 1 and again on step 3 → pre-fill step 3 or drop the field.
- Help sits in the header on one template and the footer on another → one place, in the shared template.
- "Save", "Apply" and "Publish" at equal weight → make one primary and say what the others do.

**Accessibility:** 3.2.6 (A); 3.3.7 (A); the rest is COGA guidance with no criterion.

**Build:**
- Help is a link in the shared template, so its order cannot drift across pages (code-standard rule 3); earlier answers are pre-filled or carry `autocomplete`.
- Icon actions carry visible text, not only `aria-label`. Detail: [HTML semantics: forms markup](../../code/html-semantics.md#forms-markup).

**Check:** *Script* — could: on built pages, help's position relative to other content across templates; on a Figma file, icon-only actions with no visible label, screens with more than one primary button. *Judgement* — nearly all of it: can someone tired, distracted or in a second language finish this flow?

**Sources:** COGA (W3C Working Group Note, 29 April 2021); WCAG Understanding 3.2.6, 3.3.7. COGA pushes against dense expert dashboards; for a specialist audience density can be a legitimate trade, recorded in the project's context document.

## Accessible authentication

**What good looks like**
- No sign-in step needs the user to remember, manipulate or transcribe without an alternative or an aid.
- Password managers and paste work in every credential and code field.

**How:** [3.3.8](https://www.w3.org/WAI/WCAG22/Understanding/accessible-authentication-minimum.html) (AA) forbids a cognitive function test ("A task that requires the user to remember, manipulate, or transcribe information") in authentication unless there is an alternative, an assisting mechanism, object recognition, or the user's own content. Password managers and copy and paste count as mechanisms. Design one code field, or split boxes only if one paste fills them all; a "Show password" control; magic links or passkeys as alternatives.

**Cases:**
- A six-box one-time code → one field, or boxes that take a pasted code across all six, tested with a password manager.
- "Characters 2, 5 and 7 of your memorable word" → offer another route; selecting characters is a manipulation test.
- Security wants paste blocked on the password → the criterion settles it for paste; record a finding.

**Accessibility:** 3.3.8 (AA); 3.3.9 (AAA) also drops the object-recognition and personal-content exceptions. Paste and `autocomplete` in code are [HTML semantics: *Forms markup*](../../code/html-semantics.md#forms-markup)'s.

**Build:**
- `autocomplete="current-password"`, `"new-password"` or `"one-time-code"` on the field, and no script that blocks paste.
- One code `input` with `inputmode="numeric"`; "Show password" is a `button` with `aria-pressed`. Detail: [HTML semantics: forms markup](../../code/html-semantics.md#forms-markup).

**Check:** *Script* — could: on a built page, paste into password and code fields and confirm it lands; on a Figma file, split code inputs on sign-in screens. *Judgement* — does any step ask for recall or transcription without an aid?

**Sources:** WCAG Understanding 3.3.8.

## Error recovery

**What good looks like**
- Every error is text that names the field and the fix; every input has an error variant with a text slot.
- Anything that commits money or a legal agreement, or changes or deletes data, can be undone, checked or reviewed first.

**How:** [3.3.1](https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html): an error is described in text; a red border alone fails it and 1.4.1. [3.3.3](https://www.w3.org/WAI/WCAG22/Understanding/error-suggestion.html): give a known correction unless it compromises security or purpose. [3.3.4](https://www.w3.org/WAI/WCAG22/Understanding/error-prevention-legal-financial-data.html): reversible, checked with a chance to correct, or reviewed and confirmed. The words are [content: error messages](content.md#error-messages); the summary is [forms: error messages and the error summary](../patterns/forms.md#error-messages-and-the-error-summary); when to validate is [interaction: validation timing](interaction.md#error-prevention-and-validation-timing); undo or confirm is [interaction: undo or confirmation](interaction.md#undo-or-confirmation). What this file adds is the design deliverable: every input drawn with an error variant and a text slot.

**Cases:**
- A form submits with three errors → a linked summary, each message by its field, focus to the summary (annotated).
- Dismissing a row in a dashboard → undo in a persistent message; it changes user data, so 3.3.4 applies.
- Deleting a project and its history → a confirmation naming what is lost; undo is impractical here.
- A weak password is rejected → say the rule that failed ("Use at least 12 characters").

**Accessibility:** 3.3.1 (A); 3.3.3 (AA); 3.3.4 (AA); 1.4.1. Tying the message to the field is code-standard rule 15 and [HTML semantics: *Forms markup*](../../code/html-semantics.md#forms-markup).

**Build:**
- The field gets `aria-invalid="true"` and its message by `aria-describedby` (code-standard rule 15); styled from `:user-invalid` and `[aria-invalid="true"]`, never a class (code-standard rule 9).
- Undo restores through the same handler, and a confirm step is a real form. Detail: [HTML semantics: form errors and validation](../../code/html-semantics.md#form-errors-and-validation).

**Check:** *Script* — could: on a Figma file, inputs with no error variant or no text slot; on a built page, invalid input producing text tied to the field. *Judgement* — does the message say how to fix it, and is every data-changing action recoverable?

**Sources:** WCAG Understanding 3.3.1, 3.3.3, 3.3.4. Undo costs engineering, which is why confirmations persist; the toolkit asks for undo on routine actions and confirmation for the rare irreversible one ([interaction](interaction.md#undo-or-confirmation)).

## Time limits

**What good looks like**
- No time limit unless it is essential.
- A session that can expire has a designed warning and a one-action extend.
- Nothing the user must read or act on disappears by itself.

**How:** [2.2.1](https://www.w3.org/WAI/WCAG22/Understanding/timing-adjustable.html): each limit can be turned off, adjusted to at least ten times the default, or warned of with at least 20 seconds to extend by a simple action, at least ten times. Real-time events, limits whose extension "would invalidate the activity" and limits over 20 hours are exempt. A toast that vanishes after five seconds is a time limit on reading it ([feedback: toasts](../patterns/feedback.md#toasts)).

**Cases:**
- "Row dismissed. Undo" auto-hides after five seconds → keep it until dismissed; it carries an action.
- A session times out after 15 minutes → a "Stay signed in" warning at least 20 seconds ahead, and entered data kept after signing in again.
- A plain "Saved" confirmation → may fade; nothing needs doing.

**Accessibility:** 2.2.1 (A); 2.2.2 for moving content.

**Build:**
- A message with an action has no dismiss timer; a session warning is a `dialog` with one extend `button`, and entered data is kept server-side across a re-sign-in.

**Check:** *Script* — could: on a Figma file, toasts with no persistent variant or dismiss control; on a built page, the real time-out and its warning. *Judgement* — is this limit essential?

**Sources:** WCAG Understanding 2.2.1.

## Alternatives for images, media and charts

**What good looks like**
- Every image instance on a screen is annotated informative (with its text) or decorative.
- Every video has a captions control, and captions do not cover essential content.
- Every chart has its key values or takeaway in text beside it.

**How:** [1.1.1](https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html): non-text content has a text alternative serving the same purpose, and decoration can be ignored. Only whoever knows why the image is there can decide, and the same image may need different text in different places, so it is a per-screen annotation, never an asset property. Write the purpose: "Findings fell from 120 to 40 after the audit", not "bar chart". [1.2.2](https://www.w3.org/WAI/WCAG22/Understanding/captions-prerecorded.html): captions for prerecorded audio in synchronised media. Text values beside a chart serve 1.1.1 and exempt its marks from 1.4.11; chart colour is the `dataviz` skill's.

**Cases:**
- A thumbnail beside the product's name → decorative; the name says it.
- The same photo on the detail page showing the feature described → informative, naming what it shows.
- An icon alone in a status column → informative; its text is the status.
- A dashboard line chart → a sentence with the latest value and trend, and the data as a table on request.

**Accessibility:** 1.1.1 (A); 1.2.2 (A). `alt` and names are code-standard rule 18.

**Build:**
- `alt` is written per placement, empty when decorative (code-standard rule 18); a chart is a `figure` with its takeaway in the `figcaption` and the data as a table.
- Detail: [HTML semantics: images and alt](../../code/html-semantics.md#images-and-alt) and [charts in markup](../../code/html-semantics.md#charts-in-markup); captions and transcripts are [video, audio and captions](../../code/html-semantics.md#video-audio-and-captions).

**Check:** *Script* — could: on a Figma file, images with no informative or decorative annotation, videos with no captions control; on a built page, `img` with no `alt`, video with no caption track. *Judgement* — does the text say what the image is for, here?

**Sources:** WCAG Understanding 1.1.1, 1.2.2; GitHub's annotation post (text varies by placement). Design-file text drifts from shipped copy, so the content author still reviews it.

## Inclusive design

**What good looks like**
- A new template is reviewed for who it excludes, not only whether it passes.
- Permanent, temporary, situational and changing needs are treated as one range.
- The same component, label and placement do the same job across screens.

**How:** the [Inclusive Design Principles](https://inclusivedesignprinciples.info/) (Swan, Pouncey, Pickering and Watson) open by calling inclusive design "designing for the needs of people with permanent, temporary, situational, or changing disabilities". Their seven are review questions for a screen: provide comparable experience, consider situation, be consistent, give control, offer choice, prioritise content, add value. *Consider situation* names users "on the move" and "under pressure", with examples this file uses: contrast against bright sunshine, captions for video watched in public. [Microsoft Inclusive Design](https://inclusive.microsoft.design/) gives "Recognize exclusion", "Learn from diversity" and "Solve for one, extend to many". Commentary: the seven read as a checklist for a screen and Microsoft's three as a stance for a team. Ask them, and "who does this exclude?", whenever a pattern is chosen for efficiency; keep them out of an audit's findings, where they cannot be measured.

**Cases:**
- A dashboard designed for a desk monitor is used on a phone in a corridor → check the 320px frame, targets and contrast in bright light; situational and permanent needs ask for the same fixes.
- A slider needs a precise drag to an exact value → add a text field; it serves a broken wrist and a tremor alike.
- A video autoplays with sound → muted, captions on (the principles' "captions on the go").
- A new pattern does a job an existing component already does → use the existing one; a divergence states its reason.

**Accessibility:** no criterion of its own; it frames the sections above.

**Build:**
- No code counterpart of its own; in code its consistency question is one component per job ([figma handoff: the component inventory](../../code/figma-handoff.md#the-component-inventory)).

**Check:** *Script* — only consistency: the same component and label for the same job across screens. *Judgement* — who does this screen exclude, and in what situation?

**Sources:** Inclusive Design Principles (commentary); Microsoft Inclusive Design. Microsoft's front page does not frame a permanent, temporary and situational spectrum, so the toolkit takes the spectrum from the Inclusive Design Principles.
