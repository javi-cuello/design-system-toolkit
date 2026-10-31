# Forms

How a form is structured, labelled, marked, validated, corrected and submitted, from one question to a long application. It serves the principles *serve a real need* (ask only what is needed), *people in control, mistakes forgiven* (errors are explained and nothing typed is lost) and *for everyone, in any context* (a form is where accessibility failures cost people the most). No design-standard rule is admitted for forms yet; validation timing is owned by [interaction: validation timing](../design/interaction.md#error-prevention-and-validation-timing). Wording of labels, hints and errors is `../design/content.md`'s (*Labels, hints and placeholder text in forms*, *Error messages*, *Button and link labels*); recovering from an error as an accessibility decision is `../design/accessibility.md` *Error recovery*. Choosing a field's control is `selection.md`'s; editing a selected item's properties in a tool's inspector is [`property-editors.md`](property-editors.md)'s.

## Form structure

**Use when / don't use**
- Use **one thing per page** to start with, for any public or occasional form: "Start by splitting the form across multiple pages with each page containing just one thing" ([GOV.UK form structure](https://www.gov.uk/service-manual/design/form-structure)).
- Use **one page of grouped fields** for short forms people fill often (a sign-in, a settings page, a tool's filter or edit form), with the reason stated in the design.
- Don't add a field before it has a reason: list every question, why it is needed and what happens to the answer (GOV.UK's "question protocol").
- Don't lay fields out in columns.

**How**
- **Order.** Questions that decide eligibility first; branching so people only see what applies to them ([GOV.UK](https://www.gov.uk/service-manual/design/form-structure)).
- **One column.** "Multiple columns interrupt the vertical momentum of moving down the form" ([NN/g, Whitenton 2016](https://www.nngroup.com/articles/web-form-design/)). Fields that are one answer in parts (day, month, year) may sit on one line.
- **Grouping.** Related fields under a `fieldset` and `legend` (an address, a contact method); on a page of several groups, a heading per group. Spacing inside a group is smaller than between groups (design-standard rule 7 applies the same proximity to headings).
- **A question page** has a Back link at the top, the question as its heading (the `label` or `legend` doubles as the `h1`), and a Continue button aligned left ([GOV.UK question pages](https://design-system.service.gov.uk/patterns/question-pages/)). Several related questions on one page take a statement as the heading.
- **No reset or clear button**: "The risk of accidental deletion outweighs the unlikely need to 'start over'" ([NN/g](https://www.nngroup.com/articles/web-form-design/)).
- **Small screens.** The single column is already the mobile layout; the Continue button stays in the flow under the last field, not fixed over it.

**Cases**
- A public application asks name, address, income and dependants on one long page → split to a page per thing, eligibility first; each page is easier to answer and to recover from an error on.
- An internal tool's "Edit component" form has six short fields → one page, grouped, with the reason written in the design notes; GOV.UK allows grouping where research supports it, and expert users switching tasks are the case it names.
- A designer sets first and last name side by side and email and phone side by side → one column; two columns break the downward path NN/g describes, and the right-hand field is easy to miss.
- A form asks for a fax number "in case" → remove it; it has no answer in the question protocol.

**Accessibility**
- 1.3.1 Info and Relationships: groups are `fieldset` and `legend`; the heading structure follows the groups. 1.3.2 Meaningful Sequence and 2.4.3 Focus Order: the tab order runs down the single column. 2.4.6 Headings and Labels: headings and labels describe their purpose.
- Implementation: code-standard rule 1 (one `h1` in `main`; the question is that heading), code-standard rule 2 (DOM order is reading order), code-standard rule 20 (a real form that submits without script). In Figma: figma-standard rules 26, 31 and 32 for each field component.

**Build**
- A real `form` with `action` and `method`: GET for a query, POST with a token for a change ([security: forms and cross-site request forgery](../../code/security.md#forms-and-cross-site-request-forgery)); it submits with scripts off (code-standard rule 20).
- Groups are `fieldset` and `legend`. On a question page the heading sits inside the `legend`, or the `label` sits inside the `h1`, so the question is said once:
  ```html
  <fieldset><legend><h1>Where do you live?</h1></legend> …</fieldset>
  ```
- The single column is source order: DOM order is reading and tab order (code-standard rule 2), with no positive `tabindex` and no CSS `order` reshuffling fields.
- The gaps inside and between groups come from the layout container's variants, set once (code-standard rule 11), never from margins a page adds.
- No `type="reset"` button.
- Labels, groups and types in detail: [HTML semantics: *Forms markup*](../../code/html-semantics.md#forms-markup).

**Check**
- *Script:* could check that a form's fields share one left edge at each width (no columns), that every group of radios, checkboxes or multi-part fields sits in a `fieldset` with a `legend`, that no `type="reset"` button exists, and that a question page has one `h1` that is the field's label or legend.
- *Judgement:* Does every field have a reason, and is the one-page or one-thing choice stated?

**Sources:** GOV.UK and NN/g as linked; [Adam Silver](https://adamsilver.io/blog/form-design-from-zero-to-hero-all-in-one-blog-post/) (practitioner commentary) takes the same line. GOV.UK presents one thing per page as a starting point, and so does the toolkit.

## Labels

**What good looks like**
- Every field has a visible label, above the field, that stays while the person types.
- The label names the answer or asks the question, in sentence case, with no colon ([GOV.UK text input](https://design-system.service.gov.uk/components/text-input/)).
- A placeholder never stands in for a label.

**How**
- **Above the field**, left-aligned with it: "immediately above the field for mobile and shorter desktop forms" ([NN/g](https://www.nngroup.com/articles/web-form-design/)).
- **Persistent.** No placeholder as label: "it vanishes when the user starts typing" and "not all screen readers read it out" ([GOV.UK](https://design-system.service.gov.uk/components/text-input/)). Floating labels shrink the label into the field and are avoided for the same reasons ([Adam Silver](https://adamsilver.io/blog/form-design-from-zero-to-hero-all-in-one-blog-post/): "float labels suck too", commentary).
- **Checkboxes and radios** take the label to the right of the control (`selection.md`).
- **Wording** is [content: labels, hints and placeholder text in forms](../design/content.md#labels-hints-and-placeholder-text-in-forms).

**Cases**
- A sign-in form with "Email" and "Password" only as placeholders → visible labels above; once typed, nobody can tell which field is which.
- A search field in a bar with no visible label and a magnifier icon → the icon and an accessible name are enough there; a search box is the one field whose purpose is clear from its place (`search.md`).
- Labels on the left in a two-column grid on desktop → above; left labels break at small widths and lengthen the eye's path.

**Accessibility**
- 3.3.2 Labels or Instructions (A). 1.3.1: the label is programmatically tied to the field. 2.5.3 Label in Name: the visible label is inside the accessible name. 2.4.6: labels describe purpose.
- Implementation: code-standard rule 15 (a hint is a description, not part of the name). In Figma: figma-standard rule 26 (label text at least 12px), figma-standard rule 32 (label contrast).

**Build**
- A visible `label` tied by `for` and `id`, or wrapping the control; it comes before a text field in the DOM and after a checkbox or radio.
- The name comes from the `label`, never from `aria-label`, `title` or `placeholder` on a field that shows a label ([accessibility: accessible names and descriptions](../../code/accessibility.md#accessible-names-and-descriptions)).
- The search box exception: an `input type="search"` in a `search` element may take a visually hidden `label` or an `aria-label`, since its place says what it is.
- Nothing but the label's words inside it: a hint, count or error is a description (code-standard rule 15).
- Markup and its cases: [HTML semantics: *Forms markup*](../../code/html-semantics.md#forms-markup).

**Check**
- *Script:* could flag any input, select or textarea without an associated visible label, a `placeholder` on a field with no label, and a label ending in a colon. tools/ui-check/check.mjs reads a `select` without a visible label as a filter menu, so an unlabelled form select is also reported there under design-standard rule 12 if its first option is "All".
- *Judgement:* Would the label alone tell a stranger what to enter?

**Sources:** GOV.UK, NN/g and Silver agree.

## Required and optional fields

**What good looks like**
- Optional fields are few, and each is marked in words.
- The convention is decided once per form, from its layout, and held on every field.
- Nothing relies on colour alone, and a symbol is always explained.

**How**
1. **Remove optional fields first.** "Limit the form to only 1 or 2 optional fields, and clearly label them as optional" ([NN/g](https://www.nngroup.com/articles/web-form-design/)); "Better yet, avoid optional fields" ([Adam Silver](https://adamsilver.io/blog/form-design-from-zero-to-hero-all-in-one-blog-post/), commentary).
2. **Mark optional in words**, "(optional)" after the label, or after the legend for radios and checkboxes ([GOV.UK question pages](https://design-system.service.gov.uk/patterns/question-pages/)). Every source agrees on this half.
3. **Decide the required mark by layout** (this section owns the decision):
   - **One question per page:** mark optional only. The page asks one thing, so an unmarked field is plainly required. GOV.UK: "Never mark mandatory fields with asterisks."
   - **Several fields on one page:** mark both. [Baymard](https://baymard.com/blog/required-optional-form-fields) concludes "both required and optional fields should be explicitly marked"; only 14% of sites it benchmarked on desktop did so. An asterisk is enough for required "when optional fields are marked" in words (Baymard), and [NN/g, Budiu 2019](https://www.nngroup.com/articles/required-fields/) calls it familiar.
4. **An asterisk is explained** at the top of the form, before the first field ("Fields marked * are required"), and sits inside the label: "It is important that the asterisk meaning is defined at the start of the form" ([W3C technique H90](https://www.w3.org/WAI/WCAG22/Techniques/html/H90)).
5. **Never colour alone.** A red label or a red asterisk with no text fails for people who cannot see the colour (WCAG 1.4.1). If the asterisk is coloured, keep it at contrast ([NN/g](https://www.nngroup.com/articles/required-fields/): "avoid pale grays or low-contrast colors for the asterisk").
6. **The markup agrees with the marks**: a required field carries `required` (or `aria-required="true"` on a custom control); an optional one does not.

**Cases**
- A multi-field contact form marks only optional fields → add asterisks to required ones with a line explaining them at the top; Baymard's testing found people did not infer that unmarked fields were required on a page of many fields.
- A one-question page "What is your email address? *" → remove the asterisk; on a page that asks one thing, the mark adds nothing (GOV.UK).
- Required fields shown by a red label and nothing else → add the asterisk or the word, and the legend; colour alone fails 1.4.1.
- A profile form where 9 of 10 fields are optional → first question why they are asked; if they stay, mark both as the layout rule says, so the one required field is unmistakable.
- An asterisk with no explanation anywhere on the page → add the legend at the start of the form; H90 requires the meaning to be defined.

**Accessibility**
- 3.3.2 Labels or Instructions: required input is indicated (technique H90, in the label or legend). 1.4.1 Use of Color. 1.3.1: the required state is programmatic (`required`, or ARIA2's `aria-required`).
- Implementation: code-standard rule 8 (the native control carries `required`). In Figma: figma-standard rule 32 (the asterisk and "(optional)" meet contrast).

**Build**
- `required` on the native control; `aria-required="true"` only on a custom control such as a `role="combobox"` input (code-standard rule 8).
- The asterisk sits inside the `label` and is `aria-hidden="true"`, because `required` already announces it; "(optional)" is plain label text.
  ```html
  <label for="name">Full name <span aria-hidden="true">*</span></label>
  <input id="name" name="name" autocomplete="name" required>
  ```
- The mark and the attribute are rendered from the same field definition in the model, so they cannot disagree (code-standard rule 29).
- The line explaining the asterisk is a `p` before the first field, inside the `form`.
- Style the mark from the markup (`label:has(+ :required)` or the field data), never a class beside it (code-standard rule 9).

**Check**
- *Script:* could check that every field marked with "*" carries `required` and the reverse, that a page using "*" explains it before the first field, that a page with one field uses no asterisk, and that every label ending "(optional)" is on a field without `required`.
- *Judgement:* Has every optional field earned its place?

**Sources:** GOV.UK and Silver mark optional only; Baymard and NN/g mark required, and Baymard both. The common advice to "mark whichever is the minority" is practitioner commentary that no tested source here supports. The toolkit goes by layout: GOV.UK's one-question pages make optionality obvious from the page, and Baymard's evidence comes from pages of many fields.

## Help and hint text

**What good looks like**
- A hint answers the question people get stuck on: a format, an example, where to find the answer, or why it is asked.
- It sits between the label and the field, and stays visible.
- Long explanations go in the page, before the question.

**How**
- **Where.** Under the label, above the field; it is read before the person types and stays while they do. Never in a placeholder ([GOV.UK](https://design-system.service.gov.uk/components/text-input/): no placeholder "for hints or examples").
- **Length.** "Keep hint text to a single short sentence, without any full stops" ([GOV.UK](https://design-system.service.gov.uk/components/text-input/)). More than that is body text above the label ([GOV.UK question pages](https://design-system.service.gov.uk/patterns/question-pages/)).
- **When.** Add a hint for a format ("For example, QQ 12 34 56 C"), a constraint ("Must be 12 characters or more"), or a reason ("We'll only use this to send your receipt") ([Silver](https://adamsilver.io/blog/form-design-from-zero-to-hero-all-in-one-blog-post/): explain "why you're asking"). Leave it out when the label is enough.
- **Rules up front.** State every rule a value must meet before the person types, not first in an error ([NN/g](https://www.nngroup.com/articles/web-form-design/): "state the exact instructions").
- **Toggletips** (an "i" button) only for detail most people skip; never for the format, which everyone needs.

**Cases**
- A password field lists its rules only after a failed submit → put them in the hint, or as a live checklist (`../design/interaction.md`).
- A reference-number field with no clue where the number is → a hint naming the letter or screen it appears on.
- A paragraph of eligibility text in a hint → move it into the page above the question.

**Accessibility**
- 3.3.2: instructions are provided. 1.3.1: the hint is associated with the field.
- Implementation: code-standard rule 15 (`aria-describedby`, never inside the label). In Figma: figma-standard rules 26 and 32 for hint text size and contrast.

**Build**
- The hint is an element with an `id` between the `label` and the control, listed first in the control's `aria-describedby` (the error's `id` follows it); never inside the `label`, a `title` or a `placeholder` (code-standard rule 15).
- On a group, `aria-describedby` goes on the `fieldset`.
- A toggletip is a `button` that shows its text on click, built as [accessibility: tooltips and toggletips](../../code/accessibility.md#tooltips-and-toggletips) says.
- The hint's markup sits with the rest in [HTML semantics: *Forms markup*](../../code/html-semantics.md#forms-markup); the message after it in [*Form errors and validation*](../../code/html-semantics.md#form-errors-and-validation).

**Check**
- *Script:* could check that every hint is referenced by its field's `aria-describedby`, and flag a hint over one sentence.
- *Judgement:* Does the hint answer the question people actually get stuck on here?

**Sources:** GOV.UK, NN/g and Silver agree.

## Field widths

**What good looks like**
- A field's width says how long the answer is: a postcode field is postcode-sized ([GOV.UK text input](https://design-system.service.gov.uk/components/text-input/)).
- The whole expected answer is visible without scrolling inside the field.
- Free-text fields fill the column; fixed-length answers do not.

**How**
- "Use fixed width inputs for content that has a specific, known length" ([GOV.UK](https://design-system.service.gov.uk/components/text-input/)); "Text fields should be about the same size as the expected input" ([NN/g](https://www.nngroup.com/articles/web-form-design/)).
- Size a fixed field from the character count it holds, with a small margin, through a width token or a value derived from that count, never a number that fits today's example (code-standard rule 22, code-standard rule 57). GOV.UK's date input uses two-character fields for day and month and four for year.
- Free-text fields (name, address line, email) take the column's width, capped at a readable measure on wide screens.
- On a small screen a fixed field never exceeds the column; it shrinks to fit (WCAG 1.4.10).

**Cases**
- Every field is full-width, including a 4-digit year → size the year for four characters; uniform widths "for aesthetic purposes" hide the expected length ([Silver](https://adamsilver.io/blog/form-design-from-zero-to-hero-all-in-one-blog-post/)).
- A full name cut off in a narrow field → widen to the column; NN/g calls it "extremely error prone when users can't see their full entry".
- A phone field sized for a local number used internationally → size for the longest format the product accepts.

**Accessibility**
- 1.4.10 Reflow: no field forces horizontal scrolling at 320 CSS pixels. 1.4.4 Resize Text: widths follow the text size, so a field sized in rem or characters still holds its answer at 200%.
- Implementation: code-standard rule 54 (lengths in rem), code-standard rule 57 (derived, not fitted).

**Build**
- A fixed width is a variant attribute on the field's wrapper, named for the count it holds (`chars="4"`), never `width` or `size`, which the platform already uses (code-standard rule 10).
- It maps to a maximum in characters plus the field's own padding, and the field still shrinks with the column, so it never overflows at 320px:
  ```css
  ds-text-input[chars="4"] input { max-inline-size: calc(4ch + 2 * var(--field-padding-inline)); }
  ds-text-input input { inline-size: 100%; }
  ```
- Lengths in `ch`, `em` or `rem` follow the text size at 200% (code-standard rule 54); the count comes from the answer's real length, never from today's example (code-standard rule 57).
- Logical properties (`inline-size`, not `width`) so the field holds in right-to-left ([i18n: logical properties and mirroring](../../code/i18n.md#logical-properties-and-mirroring)); zoom and reflow in [responsive: zoom and reflow](../../code/responsive.md#zoom-and-reflow).

**Check**
- *Script:* could compare a fixed field's width with its `maxlength` or `pattern` length, and check that no field overflows the viewport at 320px.
- *Judgement:* Does each width match the answer it expects?

**Sources:** GOV.UK, NN/g and Silver agree.

## Input types and autocomplete attributes

**What good looks like**
- Each field brings up the right keyboard and lets the browser fill what it knows.
- No field type makes entry harder than a plain text field would.

**How**
- **Types.** `type="email"`, `"tel"`, `"url"`, `"search"` and `"password"` where they fit; each changes the on-screen keyboard.
- **Numbers.** For a whole number, a text input with `inputmode="numeric"`; for decimals, `inputmode="decimal"`. "Do not use `<input type="number">` unless your user research shows that there's a need for it", because of the risk of accidentally incrementing ([GOV.UK](https://design-system.service.gov.uk/components/text-input/)). Card numbers, account numbers and codes are text: they are identifiers, not quantities.
- **Autocomplete.** Every field about the person carries its `autocomplete` token: `name`, `given-name`, `email`, `tel`, `street-address`, `postal-code`, `bday-day` and the rest ([GOV.UK](https://design-system.service.gov.uk/components/text-input/): "to help users complete forms more quickly"). A new password takes `new-password`; a sign-in one `current-password`.
- **Spellcheck off** for references, codes and email addresses ([GOV.UK](https://design-system.service.gov.uk/components/text-input/)).
- **Forgiving formats.** Accept spaces, dashes and mixed case in references, postcodes and phone numbers, and normalise them on the server.

**Cases**
- A postcode field with `type="number"` → text with `autocomplete="postal-code"`; postcodes contain letters and spaces.
- A quantity field with spinner arrows changes when the person scrolls the page → text with `inputmode="numeric"`, per GOV.UK.
- A checkout's name and address fields have no `autocomplete` → add the tokens; WCAG 1.3.5 requires them for fields about the user.
- A sort code rejects "12-34-56" → accept it and strip the dashes.

**Accessibility**
- 1.3.5 Identify Input Purpose (AA): "The purpose of each input field collecting information about the user can be programmatically determined" ([W3C Understanding](https://www.w3.org/WAI/WCAG22/Understanding/identify-input-purpose.html)); in HTML the `autocomplete` attribute meets it. Fields not about the user do not need a token. 3.3.8 Accessible Authentication: password fields allow paste and password managers (`../design/accessibility.md` *Accessible authentication*).
- Implementation: code-standard rule 8 (the native input carries type, `inputmode` and `autocomplete`).

**Build**
- `type`, `inputmode`, `autocomplete` and `spellcheck` on the native `input` (code-standard rule 8):
  ```html
  <input id="postcode" name="postcode" autocomplete="postal-code" spellcheck="false">
  <input id="qty" name="qty" inputmode="numeric">
  <input id="email" name="email" type="email" autocomplete="email" spellcheck="false">
  ```
- No `type="number"` for identifiers or quantities without research; no `pattern` stricter than what the server accepts after normalising spaces and dashes.
- Never cancel `paste`, and sign-in fields keep `current-password` or `one-time-code`, so password managers work.
- Tokens, types and the paste rule in detail: [HTML semantics: *Forms markup*](../../code/html-semantics.md#forms-markup).

**Check**
- *Script:* could flag `type="number"`, a field whose label names personal data (name, email, phone, address, postcode, birth) with no `autocomplete`, a password field that blocks paste, and spellcheck left on for code-like fields.
- *Judgement:* Is any value here a quantity, or is it an identifier written in digits?

**Sources:** GOV.UK and W3C as linked.

## Validation timing

**What good looks like**
- No error appears while a field is first being typed.
- One timing per form, decided from its audience and length.
- An error clears the moment the value is fixed.

**How:** the timing is [interaction: validation timing](../design/interaction.md#error-prevention-and-validation-timing) (on leaving a changed field by default, submit-only acceptable for short forms). This file adds the form-level decisions:
- **Always validate on the server**, whatever the client does ([GOV.UK validation](https://design-system.service.gov.uk/patterns/validation/): "You'll always need to carry out server side validation").
- **Never disable the submit button** until the form is valid (*Submit buttons*).
- **Prevent first.** The right type, a hint, forgiving formats and a sensible control cut errors before any message (`selection.md`).

**Cases**
- A long public form validated on blur turns errors up as people tab past → keep on blur only for changed fields, as the timing section says, and back it with the error summary on submit.
- Client-side checks only, and a crafted request saves an empty name → add the server check; the client is a convenience.

**Accessibility**
- 3.3.1 Error Identification and 3.3.3 Error Suggestion (*Error messages and the error summary*). 3.3.4 Error Prevention (Legal, Financial, Data) for consequential submissions (see *Check answers*).
- Implementation: code-standard rule 15 (a message is described-by its field), code-standard rule 20 (server validation is the no-script path).

**Build**
- The constraints are in the markup (`required`, `type`, `pattern`, `min`, `max`) and the server checks them again; that is the no-script path (code-standard rule 20).
- The script adds `novalidate` and its own messages ([javascript: the platform before a library](../../code/javascript.md#the-platform-before-a-library)).
- "On leaving a changed field" is the `change` event, which fires on commit only when the value changed; `blur` fires on tabbing past, `input` on every key. Once a field is in error, re-check it on `input` so the error clears as soon as it is fixed.
- Style the client's error from `:user-invalid`, which waits for interaction, never `:invalid`, which matches on load ([HTML semantics: *Form errors and validation*](../../code/html-semantics.md#form-errors-and-validation)).
- The submit button is never `disabled` as a validity signal (code-standard rule 9).

**Check**
- *Script:* the checks in `../design/interaction.md`; also flag a submit button that is `disabled` on load.
- *Judgement:* Does the chosen timing fit this form's audience and length?

**Sources:** GOV.UK as linked; the timing disagreement is settled in [interaction](../design/interaction.md#error-prevention-and-validation-timing).

## Error messages and the error summary

**What good looks like**
- On a failed submit, a summary at the top lists every error, each linking to its field, and focus moves to it. This section owns the error summary; other pages link here.
- Each field in error carries its own message, worded the same as in the summary.
- The page title starts "Error:".

**How**
- **Summary** at the top of `main`, below a Back link or breadcrumbs and above the `h1`, headed "There is a problem" ([GOV.UK error summary](https://design-system.service.gov.uk/components/error-summary/)).
- **Focus moves to the summary** on load, so a screen reader reads it and a keyboard user starts there ([GOV.UK validation](https://design-system.service.gov.uk/patterns/validation/)).
- **Links.** Each error links to its field: the first part of a date in error, the first radio or checkbox in a group ([GOV.UK](https://design-system.service.gov.uk/components/error-summary/)). Order them as the fields appear.
- **Title.** Add "Error: " to the start of the page `title` ([GOV.UK](https://design-system.service.gov.uk/components/error-summary/)).
- **Field message** after the label and hint, above the field, in text, with a visually hidden "Error:" before it ([GOV.UK error message](https://design-system.service.gov.uk/components/error-message/)). The field takes an error style beyond colour (a thicker border, the message itself).
- **Above or below: systems differ.** GOV.UK puts the message above the field, under its label and hint (its [Form Builder](https://govuk-form-builder.netlify.com/introduction/error-handling/): "immediately above the offending field"); Material's first spec puts it below, in place of the helper text until fixed ([Material errors, 2014](https://m1.material.io/patterns/errors.html)); the CMS design system allows either, by theme ([CMS error validation](https://design.cms.gov/patterns/Forms/error-validation/)). What holds across them: next to its field, never only at the top or bottom of the form, and tied to it by `aria-describedby`. Pick one place for a product and keep it on every field; a tool's dense panel, where a field's label sits beside it, reads better with the message right below the field (the contract editor's choice).
- **Wording** says what happened and how to fix it ("Enter your name"); the guidance is [content: error messages](../design/content.md#error-messages).
- **Same words** in the summary and beside the field ([GOV.UK](https://design-system.service.gov.uk/components/error-summary/)).
- **Inline-only forms** (validation on leaving a field, no submit yet) show the field message without a summary; the summary belongs to the submit.

**Cases**
- A submit fails and only red borders appear → add a message to each field and a summary at the top with links; a border alone fails 3.3.1 and 1.4.1.
- The summary appears but focus stays on the button at the bottom → move focus to the summary; otherwise a screen-reader user hears nothing and a keyboard user scrolls to find it.
- "This field is required" on every empty field → "Enter your email address", "Select your country"; an instruction says how to fix it ([GOV.UK](https://design-system.service.gov.uk/components/error-message/)).
- A date with only the year wrong → one message, "Date of birth must include a year", and only the year field marked ([GOV.UK date input](https://design-system.service.gov.uk/components/date-input/)).
- A single-page app re-renders the form after a failed submit and the title never changes → set the "Error:" prefix on the document title as well; it is what a screen reader announces first.

**Accessibility**
- 3.3.1 Error Identification (A): described in text. 3.3.3 Error Suggestion (AA): the fix is given. 1.4.1: not colour alone. 2.4.2 Page Titled: the title says there is an error. 2.4.3 Focus Order: focus lands on the summary, and each link moves focus to its field.
- Implementation: code-standard rule 15 (the message is described-by the field), code-standard rule 14 (a scripted re-render keeps or sets focus deliberately), code-standard rule 17 (a hidden summary stays hidden). In Figma: the field's error variant draws differently from rest (figma-standard rule 31) and its message meets contrast (figma-standard rule 32).

**Build**
- The summary: a headed `div` with `tabindex="-1"` at the top of `main`, a list of links to each control's `id`, focused on load or after a scripted submit; the `title` gains "Error: ".
  ```html
  <div tabindex="-1" data-error-summary><h2>There is a problem</h2>
    <ul><li><a href="#dob-day">Date of birth must include a day</a></li></ul></div>
  ```
- Each field message has an `id` in the control's `aria-describedby` after the hint, starts with a visually hidden "Error:", and the control takes `aria-invalid="true"` (code-standard rule 15).
- Messages are descriptions, not live regions; the summary's focus is what announces them.
- An empty summary is `hidden` and stays hidden (code-standard rule 17); a scripted re-render sets focus deliberately (code-standard rule 14).
- Markup, styling and cases: [HTML semantics: *Form errors and validation*](../../code/html-semantics.md#form-errors-and-validation).

**Check**
- *Script:* could submit an empty form and assert the summary exists, is headed, receives focus, and links to each field in error; that the title starts "Error:"; that each field message matches its summary entry and is referenced by `aria-describedby`; and flag the banned words of [content: error messages](../design/content.md#error-messages).
- *Judgement:* Does each message name the actual cause and the fix?

**Sources:** GOV.UK as linked; [Silver](https://adamsilver.io/blog/form-design-from-zero-to-hero-all-in-one-blog-post/) also puts errors above the input.

## Keeping input

**What good looks like**
- Nothing the person typed is lost: not on an error, not on Back, not on a timeout warning.
- Both passing and failing answers come back as entered.

**How**
- On a failed submit, redisplay "the form fields as the user filled them in" ([GOV.UK validation](https://design-system.service.gov.uk/patterns/validation/)); "Do not clear any form fields when showing the Error message component. Keep both passing and failing answers" ([GOV.UK error message](https://design-system.service.gov.uk/components/error-message/)).
- Passwords are the exception the platform makes: a password may be cleared, and the message says so.
- On a multi-page form, answers are saved as the person goes, so Back and Continue never lose them ([GOV.UK form structure](https://www.gov.uk/service-manual/design/form-structure): one thing per page lets you "save a user's answers automatically as they go").
- A page that would lose unsaved changes on leaving warns first (`../design/interaction.md` *Saving*).

**Cases**
- A card error clears the whole checkout form → keep every field, card number included; WCAG's own 3.3.7 example says submitted card details are "not cleared from the form".
- Back from page 3 shows page 2 empty → restore its answers from what was saved.
- A session expires and the form reloads empty → warn before expiry with a way to extend (`../design/accessibility.md` *Time limits*), and keep the answers.

**Accessibility**
- 3.3.7 Redundant Entry (A): information entered earlier in the same process is not asked for again ([W3C Understanding](https://www.w3.org/WAI/WCAG22/Understanding/redundant-entry.html)). 2.2.1 Timing Adjustable for session timeouts.
- Implementation: code-standard rule 14 (a scripted swap keeps values and focus), code-standard rule 20 (the server re-renders the form with its values).

**Build**
- The server re-renders every field from the submitted data: `value`, `checked` and `selected` set, passwords excepted (code-standard rule 20).
- A scripted submit updates the form in place rather than replacing it, and restores focus when it must re-render ([javascript: re-rendering without losing focus or scroll](../../code/javascript.md#re-rendering-without-losing-focus-or-scroll), code-standard rule 14).
- Each page of a multi-page form posts and saves; Back is a link to the previous page, which renders the saved answers, not `history.back()`.
- An unsaved-changes warning adds a `beforeunload` listener only while the form is dirty and removes it after saving; the handler calls `preventDefault()`, and the browser shows its own generic message ([MDN `beforeunload`](https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeunload_event)).

**Check**
- *Script:* could fill every field, submit with one error, and assert every other value comes back unchanged; and go Back a page and assert its values are restored.
- *Judgement:* Is there any path where typed work is lost?

**Sources:** GOV.UK and W3C agree.

## Submit buttons

**What good looks like**
- One primary button per form, labelled with what happens.
- Always enabled; a second click while sending does nothing.
- Aligned with the form's left edge, under the last field.

**How**
- **One primary.** "Avoid using multiple default buttons on a single page" ([GOV.UK button](https://design-system.service.gov.uk/components/button/)). Secondary actions (Save as draft, Cancel) take the secondary style, or a link.
- **Label with the outcome**, a verb in sentence case: "Send application", "Save changes", "Pay £40". On a question page, "Continue", not "Next" ([GOV.UK question pages](https://design-system.service.gov.uk/patterns/question-pages/)). The final submit names what is sent ([GOV.UK check answers](https://design-system.service.gov.uk/patterns/check-answers/): "Send your claim form", "Accept and send"). Wording guidance is `../design/content.md` *Button and link labels*.
- **Never disabled** as a validation signal ([GOV.UK button](https://design-system.service.gov.uk/components/button/): disabled buttons "have poor contrast and can confuse some users"; [Silver](https://adamsilver.io/blog/form-design-from-zero-to-hero-all-in-one-blog-post/)).
- **Double submit.** Ignore a second click while the request runs, and show that it is sending if it takes longer than a moment ([GOV.UK button](https://design-system.service.gov.uk/components/button/)).
- **Placement.** "Align the primary action button to the left edge of your form" ([GOV.UK](https://design-system.service.gov.uk/components/button/)), in the flow after the last field.
- **Destructive submits** (delete, cancel a subscription) take the warning style and a confirmation only when the action cannot be undone (`../design/interaction.md` *Undo or confirmation*).

**Cases**
- A form ends with "Submit" and "Reset" side by side in the same style → "Send message" as primary, no reset; reset loses everything for no gain ([NN/g](https://www.nngroup.com/articles/web-form-design/)).
- A modal form has "OK" and "Cancel" → "Save changes" and "Cancel"; "OK" does not say what happens.
- The Pay button is double-clicked and charges twice → ignore the second click and show progress; this is GOV.UK's prevent-double-click case.
- A settings page has three primary "Save" buttons, one per section → one Save for the form, or split it into separate forms each with its own; three primaries tell the person nothing about which saves what.

**Accessibility**
- 2.4.6 and 2.5.3: the button's visible text is its name. 3.3.4 Error Prevention for a legal or financial submit (see *Check answers*). 2.5.8: target size.
- Implementation: code-standard rule 8 (a native `button type="submit"`), code-standard rule 9 and code-standard rule 62 (disabled, where truly needed, is the control's own). In Figma: figma-standard rules 26, 31 and 32.

**Build**
- A native `<button type="submit">` whose text is the outcome (code-standard rule 8); a secondary submit is another button with `name="action" value="draft"`, and Cancel is a link.
- Enter in a field presses the form's first submit button in tree order, so the primary comes first in the DOM.
- Never `disabled` on load; disabled, where truly needed, is the control's own (code-standard rule 9, code-standard rule 62).
- A second click while the request runs is ignored by a flag on the form, and the button shows progress ([actions: loading buttons](actions.md#loading-buttons); [HTML semantics: *Form errors and validation*](../../code/html-semantics.md#form-errors-and-validation)).
- The warning style is a variant attribute on the wrapper (`variant="danger"`), never a class (code-standard rule 9).

**Check**
- *Script:* could check that each form has exactly one primary submit, that no submit is `disabled` on load, that its text is not "Submit", "OK" or "Next" on a question page, and that a second click within the request sends one request.
- *Judgement:* Does the label say what will happen?

**Sources:** GOV.UK, NN/g and Silver agree.

## Check answers before submitting

**Use when / don't use**
- Use before the final submit of any form of more than a few questions, and always where the submission is legal, financial or changes the person's data (WCAG 3.3.4).
- Use for small and medium transactions: "Show a single check answers page immediately before the confirmation screen" ([GOV.UK check answers](https://design-system.service.gov.uk/patterns/check-answers/)).
- Don't use for a one-page form whose fields are all in view, or for a reversible setting.

**How**
- A summary of every answer, grouped as the form was, each row with a "Change" link carrying hidden text that says what it changes ("Change date of birth") ([GOV.UK](https://design-system.service.gov.uk/patterns/check-answers/)).
- A skipped optional answer shows as "Not provided".
- After a change, Continue returns to the check answers page, asking any new questions the change raised first.
- The submit button names the outcome, and any declaration sits above it.

**Cases**
- A ten-page application goes straight from the last question to "Application sent" → add a check answers page; a mistake on page 2 is otherwise found only after sending.
- "Change" links all read "Change" to a screen reader → add the hidden text naming each answer.
- Changing the country on check answers requires a new region question → ask it, then return to check answers.

**Accessibility**
- 3.3.4 Error Prevention (Legal, Financial, Data) (AA): a review step is one of its three ways to comply. 2.4.4 Link Purpose: each Change link's purpose is clear from its text.
- Implementation: the hidden text is part of each link's name, in a `visually-hidden` span (one of the two classes code-standard rule 6 keeps).

**Build**
- A description list: `dt` the question, `dd` the answer, a second `dd` the Change link, each row grouped in a `div` ([HTML semantics: *Lists, description lists and figures*](../../code/html-semantics.md#lists-description-lists-and-figures)):
  ```html
  <div><dt>Date of birth</dt><dd>5 January 1990</dd>
    <dd><a href="/date-of-birth?return=check">Change<span class="visually-hidden"> date of birth</span></a></dd></div>
  ```
- The Change link carries the return in its address, so the question page's Continue comes back here.
- A skipped answer renders "Not provided", never an empty `dd`.
- The final submit is a POST form with its token; the hidden text is the `visually-hidden` utility (code-standard rule 6), and names follow [accessibility: accessible names and descriptions](../../code/accessibility.md#accessible-names-and-descriptions).

**Check**
- *Script:* could check that every Change link's accessible name is unique and names its answer, and that a form posting payment or personal data has a review page before it.
- *Judgement:* Is this submission consequential enough to need a review?

**Sources:** GOV.UK and W3C as linked; Silver agrees ("Let users check their answers").

## Long forms: saving and resuming

**Use when / don't use**
- Use a **task list** when a service is long and people need more than one sitting, or choose their own order ([GOV.UK task list](https://design-system.service.gov.uk/components/task-list/)).
- Use **save and resume** for any form that takes longer than one sitting: "consider allowing users to save their progress, and then to continue where they left off" ([GOV.UK task list](https://design-system.service.gov.uk/components/task-list/)).
- Don't use a task list for a fixed-order service, or before trying to shorten the service: "Try to simplify the service before you use a task list" ([GOV.UK](https://design-system.service.gov.uk/components/task-list/)).
- Don't use a task list to show answers; that is check answers.

**How**
- **Task list.** Each task with a status; people move on only when every task reads "Completed" ([GOV.UK](https://design-system.service.gov.uk/components/task-list/)). Statuses carry text, not colour alone.
- **Saving.** Save each page's answers on Continue; offer a "Save and come back later" link on every page of a long form, and say how to return (a sign-in, or a link sent by email).
- **Progress.** On a fixed-order form, a step count ("Question 3 of 8") only when the count is stable; branching makes a count lie.
- **Timeouts.** Warn before a session ends and let the person extend it; never discard saved answers on expiry.

**Cases**
- A 40-question grant application with no way to stop → a task list by section, answers saved on each Continue, a "Save and come back later" link.
- A five-page fixed-order form considering a task list → no; it has an order, so keep it linear with Back links.
- A progress bar reads "Step 4 of 6" and then becomes "Step 4 of 9" after a branch → drop the count, or count sections, which do not change.

**Accessibility**
- 2.2.1 Timing Adjustable (A): the person can extend a time limit. 1.4.1: status not by colour alone. 3.3.7: resumed forms show what was entered.
- Implementation: code-standard rule 20 (saving works as a form post). In Figma: status tags meet figma-standard rule 32.

**Build**
- A task list is a `ul` of links, one per task; each task's status is text in an element the link's `aria-describedby` names, so the name stays the task (code-standard rule 15).
- "Save and come back later" is a submit button on the same form (`name="action" value="save"`), so saving is a form post (code-standard rule 20).
- A step count is plain text above the `h1`, rendered only where the form's order is fixed.
- A timeout warning is a modal `dialog` opened with `showModal()`, with an Extend button that posts ([dialogs: choosing the surface](dialogs.md#choosing-the-surface); [accessibility: focus management](../../code/accessibility.md#focus-management)).

**Check**
- *Script:* could check that task statuses carry text, and that answers persist across a reload mid-form.
- *Judgement:* Does this form need more than one sitting, and is its order fixed?

**Sources:** GOV.UK as linked. GOV.UK has no published save-and-return pattern; the advice above is its task-list guidance plus the toolkit's commentary.

## Autofill and redundant entry

**What good looks like**
- Nothing the person has given in this process is asked for again.
- The browser can fill everything it already knows.

**How**
- **Offer, don't re-ask.** Where a later step needs an earlier answer (billing address after delivery address), offer "Same as delivery address" or prefill it, editable ([W3C 3.3.7 Understanding](https://www.w3.org/WAI/WCAG22/Understanding/redundant-entry.html)).
- **Carry answers forward.** A search term shows in the search box on the results page; an ID entered on step one appears prefilled on step three.
- **Autocomplete tokens** on every personal field (*Input types and autocomplete attributes*) so the browser fills across forms.
- **Exceptions** the criterion allows: re-entry that is essential, a password confirmation for security, or information no longer valid ([W3C](https://www.w3.org/WAI/WCAG22/Understanding/redundant-entry.html)).
- **Ask once across the journey**: [ux: recognition over recall, and asking once](../design/ux.md#recognition-over-recall-and-asking-once).

**Cases**
- Checkout asks for the billing address with no shortcut after the delivery address → add a "Billing address is the same" checkbox; this is W3C's own example.
- A results page clears the search term → keep it in the box, prefilled.
- A sign-up asks for the email twice "to confirm" → ask once; a mistyped email is better caught by showing it on check answers. Confirming a new password is the exception W3C allows.

**Accessibility**
- 3.3.7 Redundant Entry (A); 1.3.5 Identify Input Purpose (AA); 3.3.8 Accessible Authentication (AA) for sign-in fields that must accept autofill and paste.
- Implementation: code-standard rule 8 (native fields carry the tokens).

**Build**
- Address groups take the `shipping` and `billing` section tokens, so the browser fills each set: `autocomplete="shipping street-address"`, `autocomplete="billing street-address"` ([MDN `autocomplete`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/autocomplete)).
- "Same as delivery address" is a checkbox; the script sets `hidden` and `disabled` on the billing `fieldset` while it is checked, so the hidden fields neither show nor submit, and without script the server copies the address (code-standard rule 17, code-standard rule 20).
- Carried answers are the server rendering `value` from what was saved: the results page's search box from `q`, a later step's ID from step one.
- A new-password confirmation takes `new-password` on both fields; nothing else is asked twice.
- Token list and markup: [HTML semantics: *Forms markup*](../../code/html-semantics.md#forms-markup).

**Check**
- *Script:* could flag two fields in one process with the same `autocomplete` token and no prefill or "same as" control, and a "confirm email" field.
- *Judgement:* What does this process ask for twice, and is either time essential?

**Sources:** W3C as linked.
