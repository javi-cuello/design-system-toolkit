# Actions: buttons, links, menus and toolbars

How an interface offers things to do: button or link, how links are worded and when they open a new tab or a download, how buttons rank, how destructive actions are styled and guarded, how labels are written, and how icon-only buttons, groups, Cancel, close and Back, split buttons, overflow menus, toolbars, bulk actions, loading and disabled states and floating action buttons behave. It serves design-standard's principles *clear words, clear hierarchy*, *people in control, mistakes forgiven*, *discoverable* and *consistent, not uniform*. It applies design-standard rule 2 (the layout holds still) to loading and disabled states and design-standard rule 5 (disabled, not hidden) to menu items, and owns button hierarchy and button labels. The fundamentals are in [`../design/interaction.md`](../design/interaction.md) (*Undo or confirmation*, *Disabled, hidden or read-only*, *Hover-only affordances*) and [`../design/content.md`](../design/content.md) (*Button and link labels*).

## Buttons or links

**Use when / don't use**
- A link takes the person somewhere (a page, an address, a file); a button does something here (submits, saves, opens a dialog, toggles, deletes).
- Decide by what happens, never by how the design draws it.
- Don't navigate with a button. Carbon's [button usage](https://carbondesignsystem.com/components/button/usage/): "Do not use buttons as navigational elements."

**How**
- Ask whether the address changes or someone could open it in a new tab. Yes is a link. GOV.UK's [start button](https://design-system.service.gov.uk/components/button/) looks like a button and is built as a link, because start buttons "do not usually submit form data".
- Match the look to the function where the design allows. The W3C [button pattern](https://www.w3.org/WAI/ARIA/apg/patterns/button/): "both the appearance and role of a widget match the function it provides"; restyling is "a better solution" than patching the role.
- A link styled as a button keeps link behaviour (middle-click, new tab); a button styled as a link keeps button behaviour.
- A button that opens a dialog may end with an ellipsis ("Save as…"), a convention the W3C pattern and Apple's [buttons](https://developer.apple.com/design/human-interface-guidelines/buttons) record. Use it everywhere or nowhere.
- A link that opens a new tab says so in its name and with an icon (Carbon's launch icon).

**Cases**
- "Export CSV" → a link when the file exists at an address; a button when the export is generated on request.
- "Sort by date" in a table header → a button, even when the sort is written to the address: the person acts, they do not leave.
- "Cancel" that returns to the previous page → a link beside the submit button, as in GOV.UK's button group.
- Tabs that change the address → links with `aria-current`; tabs that swap a panel → a tab list ([`navigation.md`](navigation.md), *Tabs*).

**Accessibility**
- 4.1.2 Name, Role, Value: the role says what activation does. 2.1.1 Keyboard: links activate on Enter, buttons on Enter and Space.
- The element table is in [HTML semantics: *Links and buttons*](../../code/html-semantics.md#links-and-buttons); modified clicks go to the browser (code-standard rule 21).

**Build**
- `<a href>` for a destination, `<button type="button">` for an action here, `<button type="submit">` in a form; the element table, `type` always and the stretched-link card are [HTML semantics: *Links and buttons*](../../code/html-semantics.md#links-and-buttons).
- One component draws both looks: the native element inside carries the behaviour, the wrapper the variant, `<ds-button variant="primary"><a href="/start">Start now</a></ds-button>` (code-standard rules 8 and 9).
- A link in a set that marks the current place takes `aria-current` (code-standard rule 64); a button that opens a dialog gets its no-script path from `popovertarget` (code-standard rule 20).
- A link that opens a new tab says so in its name, or in a visually hidden span ([accessibility: *Hidden content*](../../code/accessibility.md#hidden-content)).
- A script that takes over a link's click leaves modified clicks to the browser (code-standard rule 21; [accessibility: *Keyboard access and modified clicks*](../../code/accessibility.md#keyboard-access-and-modified-clicks)).

**Check**
- *Script* could: flag `<a>` without `href`, `href="#"` or `javascript:` links, and buttons whose handler changes `location`.
- *Judgement*: for each control drawn as a button, does activating it leave the page?

**Sources.** The W3C, Carbon and GOV.UK agree; none recommends a button for navigation.

## Links: text, new tabs and downloads

**Use when / don't use**
- Every link: its text says where it goes or what it gets, external links, links to files, and the rare link that opens a new tab. The wording convention is [content: button and link labels](../design/content.md#button-and-link-labels); this section adds the behaviour around it.
- Not for actions. Carbon's [link usage](https://carbondesignsystem.com/components/link/usage/): "Do not use links for actions that will change data or manipulate how it is displayed" (see *Buttons or links*).

**How**
- **Text names the destination.** Link the noun phrase, front-loaded; never "click here" (GOV.UK's [writing for user interfaces](https://www.gov.uk/service-manual/design/writing-for-user-interfaces): "‘click here’ is not accessible link text"). Carbon: "Avoid using the same link text for different destinations on the same page".
- **Same tab by default.** NN/g's [new tabs and windows](https://www.nngroup.com/articles/new-browser-windows-and-tabs/): "For the most part, always open links in the same browser tab or window." GOV.UK's [links](https://design-system.service.gov.uk/styles/links/): "Avoid opening links in a new tab or window."
- **A new tab when leaving would lose work.** GOV.UK's case: "to stop the user losing information they’ve entered into a form", such as a help link inside a form; Atlassian's [link](https://atlassian.design/components/link/usage) puts it the same way: "a risk of someone losing their current place or task". Then warn: GOV.UK includes "the words ‘opens in new tab’ as part of the link".
- **External is not a warning.** GOV.UK: "Do not use an external link icon"; a link to another site in the same tab behaves like any link. Carbon and Atlassian draw a launch icon; the toolkit keeps the icon for links that open a new tab, beside the words (Atlassian: "If the icon is not desired, reconsider if the link should open in a new window").
- **Downloads say type and size.** NN/g's [PDF article](https://www.nngroup.com/articles/avoid-pdf-for-on-screen-reading/): "include the page count and the file size in close proximity to the link". Write "Annual report (PDF, 2MB, 40 pages)"; sizes follow the [GOV.UK style guide](https://guidance.publishing.service.gov.uk/writing-to-gov-uk-standards/style-guides/a-to-z-style-guide/) ("Use MB for anything over 1MB") and [content: numbers](../design/content.md#numbers-dates-times-units).

**Cases**
- "To read our privacy notice, click here" → "Read our privacy notice"; the link reads alone in a links list.
- A "Help with this question" link on page 4 of a form → opens in a new tab and says so, since following it in place risks the answers.
- Every link in a footer to another site opens a new tab with an icon → same tab, no icon.
- "Download" beside three files → "Download the 2025 accounts (CSV, 340KB)".

**Accessibility**
- 2.4.4 Link Purpose (In Context): links help people "choose which links to follow" ([W3C Understanding 2.4.4](https://www.w3.org/WAI/WCAG22/Understanding/link-purpose-in-context.html)); 2.4.9 (AAA) wants the text alone to do it.
- 3.2.5 Change on Request (AAA) and the W3C's [G201](https://www.w3.org/WAI/WCAG22/Techniques/general/G201): a new tab gets a warning both spoken and seen, "Check that there is a visual warning/indication that this control opens a new window." An icon alone is not spoken; it needs a name.

**Build**
- `<a href>` with the destination in its text; the element and its siblings are [HTML semantics: *Links and buttons*](../../code/html-semantics.md#links-and-buttons).
- A new-tab link: `target="_blank"` and "(opens in new tab)" in the text or a visually hidden span ([accessibility: *Hidden content*](../../code/accessibility.md#hidden-content)); any icon is `aria-hidden` (code-standard rule 18). `target="_blank"` already implies `rel="noopener"` ([MDN `<a>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/a)); GOV.UK still writes `rel="noreferrer noopener"`, and stating it costs nothing ([security: *Third-party scripts and Subresource Integrity*](../../code/security.md#third-party-scripts-and-subresource-integrity)).
  ```html
  <a href="/help/income" target="_blank" rel="noopener noreferrer">Help with income<span class="visually-hidden"> (opens in new tab)</span></a>
  ```
- A download: `<a href="/files/accounts-2025.csv" download>` with type and size in the text; MDN: `download` "only works for same-origin URLs, or the `blob:` and `data:` schemes". Size is read from the file at render, never typed (code-standard rule 57).
- A script that takes over a link leaves modified clicks to the browser, so the person can choose a new tab themselves (code-standard rule 21).

**Check**
- *Script* could: flag link text in the content page's banned list, `target="_blank"` without "new tab" in the accessible name, `download` or file-extension `href`s without a type in the text, and one text pointing at two URLs.
- *Judgement*: would leaving this page in the same tab lose anything the person did?

**Sources.** On external links GOV.UK says no icon, Carbon and Atlassian draw one. The toolkit follows GOV.UK for same-tab external links (going to another site needs no warning) and Atlassian for new tabs (the icon marks the behaviour that does), with the words always, as MDN, GOV.UK and G201 ask.

## Button hierarchy

**Use when / don't use**
- Every view with buttons ranks them: one primary for the most likely next step, the rest quieter. This section owns button hierarchy; other pages link here.
- Carbon: "Each page should have only one primary button." Apple's [buttons](https://developer.apple.com/design/human-interface-guidelines/buttons): "Keep the number of prominent buttons to one or two per view." GOV.UK: "Avoid using multiple default buttons on a single page."
- Don't force a primary onto a page whose purpose is reading. Carbon: "Not every page needs a primary button."

**How**
- Four roles, mapped once to the project's variants in its context document:
  - **Primary**: the principal action, once per view. Carbon allows a second only in a "temporary flow", such as a side panel over a page with its own primary.
  - **Secondary**: Carbon pairs it with a primary for the negative action ("Cancel", "Back"); [Primer](https://primer.style/product/components/button/guidelines/) makes it the everyday button: "Most of the time, we use the secondary variant."
  - **Tertiary or outline**: independent actions, and Carbon's choice for page headers, because the content below "is probably going to have a primary action".
  - **Ghost or invisible**: supplementary actions in toolbars, cards and rows, and Cancel in a progressive flow.
- A region the person opened (a dialog, a side panel) may have its own primary; ten dashboard cards do not get ten.
- Distinguish the preferred action by style, never size. Apple: "Use style — not size — to visually distinguish the preferred choice."
- When something fails to stand out, quieten its neighbours before adding emphasis.

**Cases**
- A settings page with "Save changes" at the foot and "Invite member" in the header → Save primary, Invite tertiary.
- A table toolbar on a page that already has a primary → its main action is ghost (Carbon: "Use a ghost button instead if there is another button on the page that requires primary styling").
- A dashboard where every card has a filled "View" → ghost buttons or a linked card title.
- An empty state on a page with a primary → a tertiary call to action (Carbon).

**Accessibility**
- 1.4.1 Use of Color: the label carries the meaning; Primer's [button accessibility](https://primer.style/product/components/button/accessibility/): "color alone isn't reliable".
- 1.4.11 Non-text Contrast and 1.4.3: an outline's boundary or a ghost's text identifies the control.
- In a Figma library: figma-standard rule 31 (states differ, focus shows) and figma-standard rule 32 (text contrast in every mode).

**Build**
- One button component; the four roles are one attribute on the wrapper, `variant="primary|secondary|tertiary|ghost"`, mapped once to the project's Figma axis ([figma-handoff: *Variants to attributes*](../../code/figma-handoff.md#variants-to-attributes); code-standard rules 9 and 10).
  ```css
  ds-button[variant="primary"] > :is(button, a) { background: var(--color-action-primary-bg); }
  ds-button[variant="ghost"] > :is(button, a) { background: transparent; }
  ```
- Every colour, border and radius per variant is a token, never a literal (code-standard rule 22; [tokens: *Three tiers*](../../code/tokens.md#three-tiers)).
- Rest, hover, press and focus are `:hover`, `:active` and `:focus-visible` on the native control, never attributes (code-standard rule 9); the ring is [accessibility: *Visible focus*](../../code/accessibility.md#visible-focus).
- A caller that needs a one-off adjustment sets a custom property the component reads, never a rule of its own (code-standard rule 38).

**Check**
- *Script* could: count primary-variant elements per page and per landmark region, flagging more than one outside an open dialog or panel; the same per top-level Figma frame.
- *Judgement*: is the one primary the action most people came to take?

**Sources.** All four agree on one primary (Apple allows two prominent). Carbon reserves secondary for the negative half of a pair; Primer makes it the default. The toolkit uses a neutral button for ordinary actions (Primer) and Carbon's pairing inside dialogs and forms; both keep the primary alone.

## Destructive actions

**Use when / don't use**
- Anything that deletes, removes, revokes, stops or overwrites what the person cares about.
- Make it reversible and say so; confirm only the irreversible and serious ([interaction: undo or confirmation](../design/interaction.md#undo-or-confirmation)).
- Don't put it in the primary position of an ordinary form.

**How**
- **Style by emphasis.** Carbon's danger button has primary, tertiary and ghost styles: primary danger when destruction "is a required or primary step", tertiary or ghost when it is one of several. A row's "Delete" is ghost danger or a menu item; the confirming button in its dialog is primary danger.
- **Never icon-only.** Carbon: "Do not use a danger button in an icon only form for a destructive action."
- **Never colour alone.** GOV.UK's [warning button](https://design-system.service.gov.uk/components/button/): "Do not only rely on the red colour"; the label names action and object ("Delete project").
- **Two steps for the irreversible.** GOV.UK: another style for the first call to action, the warning button "for the final confirmation".
- **Not the default.** Apple: "Don't assign the primary role to a button that performs a destructive action, even if that action is the most likely choice." The confirmation dialog, its focus included, is [dialogs: confirmation dialogs](dialogs.md#confirmation-dialogs).
- **Undo for the common case.** Apple's [alerts](https://developer.apple.com/design/human-interface-guidelines/alerts): "Avoid displaying alerts for common, undoable actions, even when they're destructive." Do it, show what happened, offer Undo in place (toasts with actions: [`feedback.md`](feedback.md)).
- **Apart in space.** Last in a menu after a divider; away from the primary in a group.

**Cases**
- Deleting a comment just written → delete, then "Comment deleted. Undo".
- Deleting a repository with its history → a confirmation naming it and what goes with it, primary danger inside ([Primer confirmation dialog](https://primer.style/product/components/confirmation-dialog/guidelines/)); a quieter danger trigger on the page.
- A red "Delete" beside a blue "Save" → move Delete away (its own section), so a slip does not hit it.
- A bulk "Delete 240 items" → the count in the label and the dialog title.

**Accessibility**
- 3.3.4 Error Prevention (Legal, Financial, Data): deleting user data is reversible, checked or confirmed ([W3C Understanding 3.3.4](https://www.w3.org/WAI/WCAG22/Understanding/error-prevention-legal-financial-data.html)); undo meets "reversible".
- 1.4.1: the danger is in the words. 4.1.3 Status Messages: "deleted, undo" is announced without focus (a [code candidate](../../code/candidates.md)). Focus after a row disappears is code-standard rule 14.

**Build**
- Danger is a variant value on the same component, `variant="danger"` (or a `tone` axis when the design crosses danger with emphasis), drawn from danger tokens (code-standard rules 9 and 22).
- The label names action and object in text; an icon beside it is `aria-hidden` (code-standard rule 18).
- Undo: after the delete, write "Comment deleted" into a `role="status"` region present from load, with the Undo button next to it ([accessibility: *Live regions and status messages*](../../code/accessibility.md#live-regions-and-status-messages)).
- When the deleted row held focus, focus moves to the next row or the list heading, never `body` (code-standard rule 14; [accessibility: *Focus management*](../../code/accessibility.md#focus-management)).
- The irreversible case opens a `dialog` (see [dialogs: confirmation dialogs](dialogs.md#confirmation-dialogs)); the server still checks the request ([security: *Forms and cross-site request forgery*](../../code/security.md#forms-and-cross-site-request-forgery)).

**Check**
- *Script* could: flag a danger button with no visible text or with the primary role in a neutral form; after a scripted delete, assert an undo control or a dialog appeared.
- *Judgement*: could this be undoable instead of confirmed?

**Sources.** Apple does not style the button confirming an action the person deliberately chose (Empty Trash); Carbon's danger modal and GOV.UK's warning button do. On the web the toolkit follows Carbon and GOV.UK: the colour is the last cue before an irreversible step. Apple's point survives as "not the default".

## Button labels

**Use when / don't use**
- Every button with text: a verb, plus the object when the verb alone is ambiguous. The verb-and-object convention for all labels is [content: button and link labels](../design/content.md#button-and-link-labels).
- Don't use "OK", "Yes", "No", "Submit" or "Click here" where a specific verb fits.

**How**
- Carbon: {verb} + {noun}, except common actions like "Done", "Close", "Cancel", "Add", "Delete"; "Do not use only a noun." Apple: start with a verb, "Add to Cart".
- Name the outcome in confirmations. Apple's alerts: "Erase", "Convert", "Clear", "Delete"; "OK" only when purely informational; always "Cancel" for cancel. Carbon's [modal](https://carbondesignsystem.com/components/modal/usage/): "Avoid vague or passive words, such as Done or OK."
- Say whether it saves: GOV.UK separates "Continue" from "Save and continue", and adds words when needed ("Add another address").
- Sentence case, no terminal punctuation.
- A toggle keeps its label and exposes `aria-pressed`, or changes its label ("Mute" to "Unmute") and exposes no pressed state (W3C button pattern).
- A selection button shows the value, or "2 selected" for several (Primer).

**Cases**
- "Submit" on an application → "Send application".
- "Are you sure? Yes / No" → "Delete 3 files?" with "Delete files" and "Cancel".
- A label overflows on a phone in German → shorten the source, then wrap; Carbon: "We do not recommend truncating a button label."
- Six "Learn more" buttons on six cards → names that say about what.

**Accessibility**
- 2.5.3 Label in Name: an `aria-label` contains the visible words, best at the start ([W3C Understanding 2.5.3](https://www.w3.org/WAI/WCAG22/Understanding/label-in-name.html)). 2.4.6 Headings and Labels: labels describe purpose.
- A label that changes on activation ("Star" to "Starred") is announced (Primer's button accessibility). A count beside a button is a description (code-standard rule 15).

**Build**
- The visible text is the accessible name; an `aria-label`, where one is needed, starts with the visible words ([accessibility: *Accessible names and descriptions*](../../code/accessibility.md#accessible-names-and-descriptions)).
- A toggle keeps one label and carries `aria-pressed="true|false"`, styled from `[aria-pressed="true"]`; a label that changes ("Mute" to "Unmute") carries no pressed state ([APG button](https://www.w3.org/WAI/ARIA/apg/patterns/button/)).
- A count or "2 selected" beside the label is a description (`aria-describedby`), not part of the name (code-standard rule 15).
- Labels wrap rather than truncate: no `white-space: nowrap` or fixed `inline-size` on the button text ([i18n: *Text expansion and no fixed widths on text*](../../code/i18n.md#text-expansion-and-no-fixed-widths-on-text)).
- Strings come from the project's message catalogue whole, never assembled from fragments ([i18n: *Strings a translator can work with*](../../code/i18n.md#strings-a-translator-can-work-with)).

**Check**
- *Script* could: flag vague names (OK, Yes, No, Submit, Click here, Learn more alone), an `aria-label` missing the visible text, terminal punctuation.
- *Judgement*: from the label alone, does a person know what happens and whether it saves?

**Sources.** Carbon wraps an overflowing label; Primer says buttons "should never contain line breaks". The toolkit writes labels that fit and wraps when translation or zoom still overflows, because truncation loses words (1.4.12, see [`disclosure.md`](disclosure.md)).

## Icon-only buttons

**Use when / don't use**
- Only for standard, recognisable icons where space is scarce, typically a toolbar of several actions (Carbon's two cases: "standardized and recognizable without label", or "insufficient space and multiple actions").
- Elsewhere label it. NN/g's [icon usability](https://www.nngroup.com/articles/icon-usability/): "a text label must be present alongside an icon", and labels "should be visible at all times".

**How**
- An accessible name that says the action ("Close dialog", "More actions for invoice 1042"), the glyph hidden (code-standard rule 18).
- A tooltip with the same words on hover and focus, always. Carbon: "a tooltip is always required." [Primer](https://primer.style/product/components/tooltip/guidelines/) wires the visible tooltip as the name.
- A hit area of at least 24 by 24 even for a 16-pixel glyph (figma-standard rule 26).
- One content type per group: icons or text, never mixed ([Primer ActionBar](https://primer.style/product/components/action-bar/guidelines/)).
- Touch has no hover: on touch-first layouts show the label or use a labelled menu.

**Cases**
- Five unlabelled icons in a card footer → keep edit and more as icon buttons; move the rest into "More" with text.
- A pencil whose tooltip says "Pencil" → "Edit title".
- Fifty rows each with a "More" button named "More" → include the row: "More actions for invoice 1042".
- A tooltip repeating the visible label → remove it; NN/g's [tooltip guidelines](https://www.nngroup.com/articles/tooltip-guidelines/) call this "repetitive and unnecessary".

**Accessibility**
- 4.1.2 and 1.1.1: the name (code-standard rule 18). 1.4.13: the tooltip is dismissible, hoverable, persistent ([`dialogs.md`](dialogs.md), *Tooltips*). 1.4.11: the glyph at 3:1. 2.5.8: 24 by 24 or spacing.

**Build**
- A `button` with `aria-label`, or `aria-labelledby` pointing at its tooltip; the `svg` is `aria-hidden="true"`; the component requires the label in its API (code-standard rule 18).
  ```html
  <button type="button" aria-label="More actions for invoice 1042">
    <svg aria-hidden="true" focusable="false">…</svg></button>
  ```
- The tooltip's wiring, hover and focus behaviour and Escape are [accessibility: *Tooltips and toggletips*](../../code/accessibility.md#tooltips-and-toggletips).
- The 24 by 24 box comes from padding and `min-inline-size`/`min-block-size` tokens around the glyph, never a larger glyph ([responsive: *Touch targets*](../../code/responsive.md#touch-targets)).
- A name that varies per row (`… for invoice 1042`) is built in the template from the row's own data, one string in the catalogue with a placeholder ([i18n: *Strings a translator can work with*](../../code/i18n.md#strings-a-translator-can-work-with)).

**Check**
- *Script* could: flag nameless buttons (axe covers it), icon buttons with no tooltip on hover or focus, boxes under 24 by 24.
- *Judgement*: would a first-time visitor recognise the icon without hovering?

**Sources.** Carbon and Primer require the tooltip; NN/g argues for visible labels. The toolkit defaults to labels (NN/g) and, when icon-only, requires name and tooltip (Carbon).

## Button groups and order

**Use when / don't use**
- Two or three related actions together: a form's submit and cancel, a dialog footer, a wizard's back and next.
- More than three → a menu button or a toolbar (Carbon: "Any more than three actions should be grouped meaningfully using menu buttons").

**How**
- One high-emphasis button per group (Carbon: "Do not use two high-emphasis buttons in a button group"); one size; Carbon also matches widths to the longest label.
- **Where the primary goes:**
  - Dialog, sheet, or a wizard inside a dialog: trailing side, Cancel leading. Carbon's [dialog pattern](https://carbondesignsystem.com/patterns/dialog-pattern/): "Cancel is always the outmost left button option and the primary action is always the outmost right button." [Primer dialog](https://primer.style/product/components/dialog/guidelines/) and Apple's alerts agree.
  - Foot of a full-page form: leading edge, aligned with the fields. GOV.UK: "Align the primary action button to the left edge of your form." Carbon: "on full-page designs, the primary button is on the left side of the page." A full-page multi-step flow is a form: Continue at the leading edge, Back at the top of the page ([steppers: step navigation](steppers.md#step-navigation-back-continue-save-and-return)).
  - Vertical stack: primary on top (Carbon, Apple).
- Right-to-left languages mirror the group.
- Pick once per product. NN/g's [OK–Cancel](https://www.nngroup.com/articles/ok-cancel-or-cancel-ok/): "Following platform conventions is more important than optimizing an individual dialog box."

**Cases**
- A dialog with "Discard", "Save draft", "Publish" → Publish primary far right, Save draft beside it, Discard ghost far left (Carbon's progress arrangement).
- Five header actions of equal weight → the most used as a button, the rest in a menu labelled for what they share, or "Actions" (Carbon [menu buttons](https://carbondesignsystem.com/components/menu-buttons/usage/)).
- A wizard whose "Next" moves between steps → one position throughout, and the last step's "Next" renamed for the final action (Carbon).

**Accessibility**
- 1.3.2 and 2.4.3: DOM order is reading and tab order; `row-reverse` to put the primary right breaks it (code-standard rule 2). Write buttons in reading order.
- 3.2.4 Consistent Identification: one action, one label, everywhere.

**Build**
- Buttons are written in reading order in the DOM; the layout places them, never `order` or `row-reverse` (code-standard rule 2).
- The group is a layout container with its own element, `<ds-button-group>`, whose gap and alignment are tokens (code-standard rule 11).
  ```css
  ds-button-group { display: flex; flex-wrap: wrap; gap: var(--space-3); }
  dialog ds-button-group { justify-content: flex-end; }
  ```
- Leading and trailing are logical (`justify-content: flex-end`, `margin-inline-start`), so a right-to-left page mirrors with no extra rule ([i18n: *Logical properties and mirroring*](../../code/i18n.md#logical-properties-and-mirroring)).
- Equal widths, where the design asks, come from the grid (`grid-auto-columns: 1fr`), never a typed width (code-standard rule 57).
- A Cancel that returns to a page is a link beside the submit button ([HTML semantics: *Links and buttons*](../../code/html-semantics.md#links-and-buttons)).

**Check**
- *Script* could: assert a dialog's primary is last in DOM order and visually trailing; flag groups of mixed height or of more than three buttons.
- *Judgement*: does every dialog and form put the primary in the same place?

**Sources.** NN/g's 2008 web advice was OK first (following Windows); Apple, Carbon and Primer put it last in dialogs; GOV.UK and Carbon put it first at the foot of a page. The toolkit follows Carbon, which states the split, and NN/g's point that consistency outweighs either.

## Cancel, close and back

**Use when / don't use**
- **Cancel**: abandons a task the person started (a form, a dialog, a wizard) and discards what it changed.
- **Close (X)**: dismisses a surface (a dialog, a panel, a banner). It is always present on a modal dialog ([dialogs: modal dialog anatomy](dialogs.md#modal-dialog-anatomy)); Atlassian's [modal dialog](https://atlassian.design/components/modal-dialog/usage): "A close button in the header should always be used, except in extremely rare circumstances."
- **Back**: returns to the previous step of a linear journey. Elsewhere the browser's Back does the job ([navigation: back behaviour](navigation.md#back-behaviour)).

**How**
- **Say what the X does.** NN/g's [cancel vs close](https://www.nngroup.com/articles/cancel-vs-close/): "The main issue lies with the common lack of a text label for the X icon": people cannot tell close-and-keep from cancel-and-discard. Where work is at stake, add a labelled Cancel, "an emergency exit out of the process".
- **Cancel and X discard in a modal.** Carbon's [modal](https://carbondesignsystem.com/components/modal/usage/): the X will "close the modal without submitting any data"; "Cancel undoes all applied changes." Neither submits.
- **Ask before discarding typed work**, from Cancel, X and Escape alike ([dialogs: Escape, backdrop click and one at a time](dialogs.md#escape-backdrop-click-and-one-at-a-time)); nothing typed means no question.
- **Labels.** "Cancel" for abandoning, never "No" or "Close" on a task; "Close" for a footer button on a dialog that only informs (Atlassian: "decide whether a ‘cancel’ or 'close’ button is needed in the footer"). Placement is *Button groups and order*: Cancel leading in a dialog, beside the submit at a form's foot.
- **A Back link** sits at the top, before `main`; GOV.UK's [back link](https://design-system.service.gov.uk/components/back-link/): "Always place back links at the top of a page, before the `<main>` element", says "Back" or "Go back to [page]", and takes the person "to the previous page they were on, in the state they last saw it". GOV.UK: "Never use the back link component together with the Breadcrumbs component."

**Cases**
- An edit dialog whose X saves and whose Cancel discards → both discard; a save is the primary button's job.
- A filter panel that applies as the person ticks → its X closes and keeps the filters, since nothing is pending (NN/g's close case).
- Cancel on page 3 of an application → leave the journey to its start page, answers kept as a draft where the service saves them ([forms: keeping input](forms.md#keeping-input)).
- A Back link that returns to page 2 with its answers blank → restore them; GOV.UK's "in the state they last saw it".

**Accessibility**
- 4.1.2: the X is a named button, "Close" or "Close dialog" (code-standard rule 18). 2.1.1: Escape does what the X does.
- 3.3.4 Error Prevention: a Cancel that throws away entered data is checked first. 2.4.3: closing returns focus to the trigger (dialogs).

**Build**
- In a dialog, Cancel and X are `<button value="cancel" formnovalidate>` inside `form method="dialog"`, closing with no script; the dirty check listens on `cancel` ([dialogs](dialogs.md#escape-backdrop-click-and-one-at-a-time); [HTML semantics: *Disclosure, dialogs and popovers*](../../code/html-semantics.md#disclosure-dialogs-and-popovers)).
- A Cancel that leaves a page is a link to where the person came from, not `history.back()` ([HTML semantics: *Links and buttons*](../../code/html-semantics.md#links-and-buttons)).
- A Back link is an `<a href>` to the previous step's address, rendered by the server so it works without script (code-standard rule 20); the step restores its answers from the saved draft ([javascript: *State in the address and history*](../../code/javascript.md#state-in-the-address-and-history)).
- The X glyph is `aria-hidden` and the button named (code-standard rule 18; [accessibility: *Accessible names and descriptions*](../../code/accessibility.md#accessible-names-and-descriptions)).

**Check**
- *Script* could: type in each dialog, press X, Cancel and Escape, and assert each asks or keeps nothing submitted; flag a Back link without `href`, one after `main`, or a page with both a back link and breadcrumbs.
- *Judgement*: if the person presses X now, will they get what they expect?

**Sources.** NN/g advises that an ambiguous X should "err on the side of caution and save any intermediate work"; Carbon makes the X discard. The toolkit follows Carbon inside a modal dialog, where a primary button exists to save, and asks before discarding typed work, which meets NN/g's worry; on a surface that applies changes live, close keeps them, as NN/g says.

## Split buttons and overflow menus

**Use when / don't use**
- **Menu button**: equal-weight actions under one trigger, usually in a header.
- **Split button** (Carbon: combo button): one dominant default plus alternatives. NN/g's [split buttons](https://www.nngroup.com/articles/split-buttons/): for related tools "if one option is used most frequently".
- **Overflow menu**: secondary actions on a row or card.
- Don't hide primary actions in any of them. Apple's [pull-down buttons](https://developer.apple.com/design/human-interface-guidelines/pull-down-buttons): "Avoid putting all of a view's actions in one pull-down button."
- Not for one or two items: Apple suggests "a minimum of three items"; Carbon's [data table](https://carbondesignsystem.com/components/data-table/usage/) keeps fewer than three row actions inline as icon buttons.

**How**
- Split button: the arrow visibly separated at rest, never only on hover (NN/g); both parts at target size; the label names the default action, never a category. NN/g advises against split buttons on touch unless both parts are large.
- Fewer than 10 to 12 items, no submenus in a split button, popular first when short, alphabetical when long (NN/g).
- Unavailable items stay, disabled; a menu with nothing enabled is disabled (design-standard rule 5).
- Destructive items last, after a divider, in danger text.
- Icons on all items or none; no form controls inside an action menu ([Primer ActionMenu](https://primer.style/product/components/action-menu/guidelines/)).
- Row "more" buttons persist by default; Carbon keeps them visible on touch even when hover-only is set.
- Avoid the persistent split button whose default becomes the last choice when users are mixed (NN/g).

**Cases**
- "Merge" with "Squash and merge" and "Rebase and merge" → a split button.
- A row with "Edit" and "Delete" → two named icon buttons, no menu.
- A "More" menu whose items change with the row → one fixed order; non-applicable items disabled (design-standard rule 5).

**Accessibility**
- 4.1.2: the trigger exposes `aria-haspopup` and `aria-expanded` (W3C [menu button](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/)); a composite menu role ships with its arrow keys or not at all (a [code candidate](../../code/candidates.md)).
- 2.1.1: Enter, Space (optionally Down Arrow) open and focus the first item; Escape closes and returns focus.
- `details` gives no Escape or click-outside (code-standard rule 19); check the Popover API first (code-standard rule 8).

**Build**
- Menu button: a `button` with `aria-haspopup="menu"` and `aria-expanded`, opening a `popover` list that the script makes `role="menu"`; the APG [menu button](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/) keyboard model, all of it.
- Split button: two buttons, the default action and a named arrow ("More merge options"), inside one group; never one control with two hit areas.
- Unavailable items keep their place with `aria-disabled="true"`; destructive items last, after `role="separator"` (code-standard rule 62).
- Markup, keys and the no-script path are [accessibility: *Menus, menu buttons and toolbars*](../../code/accessibility.md#menus-menu-buttons-and-toolbars); a `details` menu needs Escape and light dismiss added (code-standard rule 19), the Popover API gives both (code-standard rule 8).
- One menu module for the product, included where needed (code-standard rule 36; [javascript: *One implementation per behaviour*](../../code/javascript.md#one-implementation-per-behaviour)).

**Check**
- *Script*: tools/ui-check/check.mjs: design-standard rule 5 (an empty menu is disabled; options disabled, not hidden). Could: flag triggers without `aria-expanded`, menus under three items; assert Escape closes and returns focus.
- *Judgement*: is the most-used action outside the menu?

**Sources.** Carbon, Apple and NN/g agree on the three-item floor. Carbon offers the combo button freely as a primary; NN/g reserves split buttons for repeat-use desktop tools. The toolkit keeps NN/g's restraint.

## Toolbars and bulk actions

**Use when / don't use**
- A toolbar groups three or more controls acting on one region. The W3C [toolbar pattern](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/): "only if the group contains 3 or more controls."
- A bulk bar appears once items are selected and offers what applies to all of them.
- No selection controls in an action bar. Primer: "Buttons are the only controls allowed in an ActionBar." Filters belong to the filter bar (design-standard rule 3).

**How**
- Carbon's table toolbar holds "up to five actions"; the rest overflow. Apple's [toolbars](https://developer.apple.com/design/human-interface-guidelines/toolbars): decide which items overflow as the bar narrows.
- No primary in an action bar (Primer); icon buttons ghost.
- Related actions grouped, divided, in a fixed order; "More" keeps the bar's order.
- Bulk: a bar naming the count ("3 selected"), its actions, and Cancel; per-row actions disabled meanwhile (Carbon). It replaces the toolbar at the same height so the table does not move (design-standard rule 2).
- A header checkbox selects the visible page; "Select all 240" is a separate step.

**Cases**
- A rich-text editor with twelve buttons → one toolbar, one tab stop, arrows between, rarest in "More" when narrow.
- Selecting rows inserts a new bar that pushes the table down → the bar takes the toolbar's place.
- A formatting toolbar with "Bold" on → a toggle with `aria-pressed`; Primer's ActionBar forbids selected states, so an editor toolbar and an action bar are different components.

**Accessibility**
- 2.1.1 and 2.4.3: one tab stop, arrows inside, entry on the first enabled control (W3C). 4.1.2: the toolbar has a name. 4.1.3: "3 selected" is announced.

**Build**
- `role="toolbar"` with a name, a roving tabindex across its buttons, and toggles carrying `aria-pressed`; the [APG toolbar](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/) keys ([accessibility: *Menus, menu buttons and toolbars*](../../code/accessibility.md#menus-menu-buttons-and-toolbars)).
- The bulk bar replaces the toolbar in the same slot: both are rendered, the inactive one `hidden`, and the slot keeps one height (code-standard rule 17; [performance: *Layout stability in code*](../../code/performance.md#layout-stability-in-code)).
- "3 selected" is written into a `role="status"` element present from load, not announced by re-rendering the bar ([accessibility: *Live regions and status messages*](../../code/accessibility.md#live-regions-and-status-messages)).
- Row selection is checkboxes with labels naming the row; the header checkbox's mixed state is `indeterminate` set from script ([HTML semantics: *Forms markup*](../../code/html-semantics.md#forms-markup)).
- Overflow into "More" keeps the bar's order; which items overflow is decided by a container query on the bar, not the viewport ([responsive: *Container queries*](../../code/responsive.md#container-queries)).

**Check**
- *Script* could: assert `role="toolbar"` has three or more controls and a name and takes one Tab; select a row and assert the first row did not move (design-standard rule 2's method).
- *Judgement*: does each toolbar act on one region, and is anything in it a filter?

**Sources.** The W3C, Carbon, Primer and Apple agree on grouping and overflow.

## Loading buttons

**Use when / don't use:** the action decides, not the button. Most presses need no spinner.

| The press | The button shows |
|---|---|
| Navigates: a link, or a form that loads a new page with no script | Nothing; the browser's own loading state runs. Guard the double press only |
| Fast and repeatable, result visible in place (sort, filter, expand) | The pressed state; the result is the feedback. A slow region load is that region's indicator ([feedback: loading](feedback.md#loading)) |
| Flips a reversible state that almost always succeeds (star, like, toggle, reorder) | The new state at once, rolled back with a message on failure: optimistic. A spinner only if confirmation runs past the threshold |
| Commits work the person waits on, result in place (save, send, pay) | A spinner in the button after the threshold; the button stays focusable and ignores presses |
| Irreversible or costly (pay, delete, publish) | Never optimistic; a spinner past the threshold, and a server-side guard |
| Past about ten seconds, or measurable | Determinate progress with Cancel outside the button, as a background task (Primer); the button returns |

The threshold is [interaction: response times](../design/interaction.md#response-times-and-perceived-performance): about a second.

**How**
- **Delay, then hold.** Block the second press at once; show the spinner only past the threshold, and once shown keep it a short minimum so it does not flash. React Spectrum: "After a 1 second delay, an indeterminate spinner will be displayed in place of the button label and icon."
- **Keep the width.** The spinner sits inside the same box; the button neither shrinks nor grows, and its neighbours stay put (design-standard rule 2). Size it from its widest label state.
- **Keep the label, or hide it in place.** Two treatments, both holding the width:
  - *Label kept:* Primer's spinner "replaces only that visual slot, and the button label remains visible"; Apple (iOS) changes the verb: "Checkout" becomes "Checking out…", and a changed label is announced too (Primer). Choose it where the person must still read what is running: a long wait, or several buttons that can each be busy.
  - *Label hidden:* [React Spectrum](https://react-spectrum.adobe.com/react-spectrum/Button.html) shows the spinner "in place of the button label and icon"; [Polaris](https://shopify.dev/docs/api/app-home/polaris-web-components/actions/button)'s `loading` will "replace the button content with a loading indicator". Choose it where the press just happened and the button stands alone, so what is in progress is plain from context, or where a spinner beside the label would not fit the box.
  - *Hide it visually, never from the tree.* Fade the label and icon (opacity 0) and lay the spinner over them: the content still sizes the box, so the width holds without a measured `min-width`, and the label stays the button's accessible name. `visibility: hidden` or `display: none` drops it from the name computation and leaves a nameless button. The name does not change, so the busy state is announced separately (below).
  - The design decides between the two; the code follows the frame (one project's library chose hidden, 14 Oct 2026).
- **Keep focus.** Primer's button accessibility: "don't remove them from the DOM or add `disabled`… Instead, add `aria-disabled="true"` to indicate the loading state." React Aria: "Pending buttons remain focusable, but are otherwise disabled."
- **Announce.** A polite live region present on load, whose message ("Saving profile") renders only while loading (Primer).
- **Guard the double press.** GOV.UK records people double-clicking from habit, slow connections or motor impairments; its `data-prevent-double-click` ignores a second click within one second. Guard on the server too (GOV.UK).
- **Optimistic, and honest.** React's `useOptimistic`: on failure "the UI shows what it showed before the optimistic update. You can catch the error to show a message to the user." Primer saves imperative controls (toggle switches, segmented controls) at once, with no save button.
- **End clearly.** Success shows in place ("Saved", the new row); failure keeps input, says what failed, moves focus to the error heading (Primer).

**Cases**
- "Save" collapses to a spinner and "Cancel" slides left → spinner inside the full-width button.
- The label is hidden with `visibility: hidden` under the spinner → the button reads as "button" with no name; fade it with opacity instead, so the name stays.
- Submit sets `disabled` on the button → `aria-disabled`, so focus is not thrown to the page top.
- A 300 ms save → no spinner; "Saved" after.
- A search form posts and loads the results page → no spinner; the browser shows the load. A double press is ignored.
- A star toggles and waits 600 ms for the server before filling → fill it at once; on failure unfill it and say so.
- "Pay" pressed twice on a slow connection → the second press is ignored in the page and refused by the server's idempotency check; never an optimistic "Paid".
- An export runs 40 s with a spinner in its button → progress in the page with Cancel; the button is free again ([feedback: loading](feedback.md#loading)).
- A spinner appears at 900 ms and the response lands at 1,010 ms → a 110 ms flash; hold it the minimum.

**Accessibility**
- 4.1.3 Status Messages: start and end announced without moving focus (a [code candidate](../../code/candidates.md)). 2.4.3: focus stays; if the button goes, code-standard rule 14.

**Build**
- The button stays focusable: `aria-disabled="true"` from the first press, never `disabled`; the handler returns early while it is set, and a submit handler calls `preventDefault()` itself, since `aria-disabled` does not stop a native submit (code-standard rules 9 and 62).
- One timer reveals the spinner and the status text past the product's `DELAY`; the same code holds it `MIN` once shown. A CSS `animation-delay` can reveal it, but cannot hold a minimum or time the announcement, so the timer owns all three:
  ```js
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (button.getAttribute('aria-disabled') === 'true') return;   // second press ignored
    button.setAttribute('aria-disabled', 'true');
    const start = performance.now();
    const reveal = setTimeout(() => { button.dataset.pending = ''; status.textContent = 'Saving profile'; }, DELAY);
    try { await save(new FormData(form)); status.textContent = 'Profile saved'; }
    catch (error) { status.textContent = ''; showError(error); }        // focus to the error heading
    finally {
      clearTimeout(reveal);
      const shown = performance.now() - start - DELAY;
      if (shown > 0 && shown < MIN) await new Promise((r) => setTimeout(r, MIN - shown));
      delete button.dataset.pending; button.removeAttribute('aria-disabled');
    }
  });
  ```
  A framework's pending flag (React's `useFormStatus`, a store's `isPending`) feeds the same two attributes; the timing stays in one place.
- A form that navigates has no submit script beyond the guard: a flag set on `submit` and checked on the next, cleared on `pageshow` so a back navigation does not leave it stuck.
- An optimistic toggle writes the new state (`aria-pressed`, `aria-checked`) on press, keeps the previous value, and restores it with a message if the request fails (code-standard rule 61).
- The spinner sits inside the same box; the box is sized from its widest label state (a grid stacking both labels in one cell), so nothing moves ([performance: *Layout stability in code*](../../code/performance.md#layout-stability-in-code)).
  ```css
  ds-button > button { display: inline-grid; }
  ds-button > button > * { grid-area: 1 / 1; }   /* label and busy label share one cell */
  ```
- The spinner is decorative (`aria-hidden="true"`); start and end are announced through a `role="status"` region present from load ([accessibility: *Live regions and status messages*](../../code/accessibility.md#live-regions-and-status-messages)).
- Under `prefers-reduced-motion` the spinner keeps a subtle motion or becomes a still indicator; the label and status carry the state ([accessibility: *Reduced motion and colour scheme in code*](../../code/accessibility.md#reduced-motion-and-colour-scheme-in-code)).
- Failure reports why, from the response's own error ([javascript: *Errors and an envelope's success flag*](../../code/javascript.md#errors-and-an-envelopes-success-flag); code-standard rule 61).
- `DELAY` and `MIN` are product constants from the threshold table, never a figure per component (code-standard rule 22).

**Check**
- *Script* could: press submit, compare the button's and siblings' boxes before and during loading (tools/ui-check/check.mjs's design-standard rule 2 method), assert focus remains and a live region updated; with the response stubbed at half the threshold, assert no spinner renders; press twice and assert one request.
- *Judgement*: which row of the table is this press, and is a failure safe to roll back?

**Sources.** On focus the systems split: [Primer](https://primer.style/product/components/button/accessibility/) and [React Aria](https://react-aria.adobe.com/Button) keep the pending button focusable; [MUI](https://mui.com/material-ui/react-button/) (`disabled={disabled || loading}` in its source), Chakra (`disabled={loading || rest.disabled}`) and [Carbon](https://carbondesignsystem.com/components/inline-loading/usage/) ("disabled until the action is complete") set `disabled`; [Base Web](https://github.com/uber/baseweb/blob/main/src/button/button.tsx) stays enabled, ignores the click and sets `aria-busy="true"` on the button. The toolkit follows Primer, since `disabled` drops focus; code-standard rules 9 and 62 allow `aria-disabled` as the control's own attribute. Primer's [loading pattern](https://primer.style/product/ui-patterns/loading/) says "the button that initiates the a loading process may not be semantically disabled using `aria-disabled`", which contradicts its own Button page and component (`loading` "sets `aria-disabled` and preserves focus automatically", [Button](https://primer.style/product/components/button/)); the component and its accessibility page win. The delay: [React Spectrum](https://react-spectrum.adobe.com/v3/Button.html) 1 s; [Adobe Commerce](https://developer.adobe.com/commerce/admin-developer/pattern-library/feedback-to-user/progress-indicator) "Delay 500ms before showing the spinner"; no system read publishes a spinner minimum. Double press: [GOV.UK button](https://design-system.service.gov.uk/components/button/) and its [source](https://github.com/alphagov/govuk-frontend/blob/main/packages/govuk-frontend/src/govuk/components/button/button.mjs) (`DEBOUNCE_TIMEOUT_IN_SECONDS = 1`). Optimistic: [React `useOptimistic`](https://react.dev/reference/react/useOptimistic), [Primer saving](https://primer.style/product/ui-patterns/saving/). Atlassian's [button](https://atlassian.design/components/button/examples) "disables the button and blocks user interaction". The navigating-form row is the toolkit's reasoning, not a published rule: no system read asks for a spinner on a full page load.

## Disabled buttons

**Use when / don't use**
- Only when the action is temporarily impossible and the reason is plain on screen, or to stop a second submit.
- Prefer enabled with an explanation on press. GOV.UK: "Disabled buttons have poor contrast and can confuse some users, so avoid them if possible." Primer: "Do not disable buttons."
- The cause decides disabled, read-only, hidden or absent ([interaction: disabled, hidden or read-only](../design/interaction.md#disabled-hidden-or-read-only)); a control that can never apply is not drawn (design-standard rule 5).

**How**
- Submit stays enabled: on press, validate, show errors, focus the summary ([forms: submit buttons](forms.md#submit-buttons); timing is [interaction](../design/interaction.md#error-prevention-and-validation-timing)).
- If disabled, say why beside it in associated text; Carbon's [disabled states](https://carbondesignsystem.com/patterns/disabled-states/) asks the message to "describe how the user can enable or re-enable" it.
- For an outage, Primer's *inactive* button: muted, focusable, and explains on press.
- It keeps its place (design-standard rule 2). The dim is code-standard rules 9 and 62.

**Cases**
- "Create account" greyed until valid → enabled; the error summary lists what is missing.
- "Merge" while checks run → disabled with "Waiting for 2 checks" beside it.
- "Publish" for someone who can never publish → hidden (Carbon's permission case).

**Accessibility**
- 1.4.3 and 1.4.11 exempt inactive controls, so the reason text carries meaning and meets contrast ([interaction](../design/interaction.md#disabled-hidden-or-read-only)).
- 2.1.1: a `disabled` button cannot take focus, so a reason in its tooltip is unreachable by keyboard; use text, or `aria-disabled`.
- Figma: the Disabled variant differs from Rest (figma-standard rule 31).

**Build**
- `disabled` on the native `button`, never on the wrapper; `aria-disabled="true"` where the button must stay focusable to explain itself (code-standard rule 9).
- The dim is one opacity token on the host, matched with `:has(> :disabled)` ([tokens: *The disabled opacity, once*](../../code/tokens.md#the-disabled-opacity-once); code-standard rule 62).
- The reason is visible text tied with `aria-describedby`, never a tooltip on a `disabled` button, which a keyboard cannot reach (code-standard rule 15).
- A disabled link drops its `href` and says `aria-disabled` ([HTML semantics: *Links and buttons*](../../code/html-semantics.md#links-and-buttons)).
- A submit button is never disabled by validity; errors say what is missing at the form's validation timing ([interaction: error prevention and validation timing](../design/interaction.md#error-prevention-and-validation-timing)).

**Check**
- *Script*: tools/ui-check/check.mjs: design-standard rule 5 for menus. Could: flag disabled buttons with no `aria-describedby` or adjacent text, and a submit disabled on load.
- *Judgement*: would enabled-and-explain be clearer?

**Sources.** GOV.UK and Primer lean against disabling; Carbon and NN/g disable unavailable options rather than hide them. Different questions: menu options keep their shape (design-standard rule 5); a form's action stays enabled and explains.

## Floating action buttons

**Use when / don't use**
- A FAB is fixed over content for a screen's single most important action; Material Web's [FAB documentation](https://github.com/material-components/material-web/blob/main/docs/components/fab.md) says it "represents the most important action on a screen".
- Rarely on the web. Carbon's, Primer's and GOV.UK's catalogues ship none, and none of the Apple pages read here describes one; a primary button in the header does the job.
- Consider it only for a touch-first view whose dominant action is creating something, at narrow widths (the toolkit's judgement).

**How**
- One per screen, positive, never destructive or navigation.
- Extended (icon and text) over icon-only; Material: "wider than FABs to accommodate a text label and larger target area".
- Reserve space at the end of the scroll so the last item clears it.
- In the DOM where its action belongs in reading order. At wide layouts, an ordinary header button.

**Cases**
- A desktop dashboard with a "+" FAB opening five creation types → a "Create" menu button in the header.
- A mobile list app where adding is most of the use → extended FAB "New item", list padded at the bottom.

**Accessibility**
- 2.4.11 Focus Not Obscured (Minimum): fixed content must not entirely hide the focused element ([W3C Understanding 2.4.11](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html)). 2.4.3: DOM position (code-standard rule 2). 4.1.2: a name (code-standard rule 18).

**Build**
- A labelled `button` (or a link, if it navigates) placed in the DOM where its action belongs in reading order; `position: fixed` places it, the DOM does not move (code-standard rule 2).
- The list reserves the space with `padding-block-end` from the same size token, and the scroll container gets `scroll-padding-block-end`, so focus never lands under it ([accessibility: *Visible focus*](../../code/accessibility.md#visible-focus)).
- Inset from the edge clears device notches with `env(safe-area-inset-bottom)` ([responsive: *Safe areas*](../../code/responsive.md#safe-areas)).
- Wide layouts render the same action as an ordinary header button, switched by a container query or breakpoint token, one element restyled rather than two ([responsive: *Breakpoints*](../../code/responsive.md#breakpoints)).
- An icon-only FAB is named (code-standard rule 18).

**Check**
- *Script* could: find fixed interactive elements, tab through, assert none fully covers the focused element.
- *Judgement*: would a header button serve as well?

**Sources.** Only Material documents the FAB among the sources read; its absence from the others is the evidence for "rarely".
