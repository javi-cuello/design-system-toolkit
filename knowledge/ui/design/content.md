# Content: what an interface says

The fundamentals of interface text, for building a page or a design and for auditing one: voice, reading level, structure, terminology, the microcopy of buttons, links, errors, empty states and confirmations, form text, filter and menu labels, mechanics (capitalisation, punctuation, numbers and dates), localisation, inclusive language, abbreviations, alt text and AI disclosure. It serves design-standard's principles *clear words, clear hierarchy*, *show state and give feedback*, *people in control, mistakes forgiven* and *for everyone, in any context*, and it applies design-standard rule 10 (a finding says what changed and what it does to people), design-standard rule 11 (a choice says how much it leads to) and design-standard rule 12 (a collapsed menu's first option names what "all" covers), with design-standard rule 1 (where figures come from) where a page title carries a caption. Sources are linked inline; where they disagree, each section says which way the toolkit goes.

**Dialect.** Generated words follow the project's dialect and a name it owns is never respelt: toolkit-standard §D 20. Spelling, the serial comma, date order and time format all key off that one setting.

---

## Voice and tone

**What good looks like**
- Voice is a few fixed traits; tone shifts with the moment ([Mailchimp](https://styleguide.mailchimp.com/voice-and-tone/), [Atlassian](https://atlassian.design/foundations/content/voice-tone)).
- Traits are written as pairs that name the failure on each side: "clear but not cold" ([Primer](https://primer.style/product/getting-started/foundations/content)).
- No humour in errors, waiting or failure (Primer); "delight means little flourishes, not humor or being cheeky" (Atlassian).

**How:** take the voice from the project's context document if it states one; otherwise default to plain, direct, specific, calm. Write tone per situation, never per adjective: error, waiting, success, empty, destructive confirmation. Error, failure and finding text carries no apology, interjection or exclamation mark.

**Cases:**
- A failed save reads "Oops! Something went wrong 😕" → "Changes not saved. Check your connection and try again." Tone drops warmth in failure, and the reader needs the fix.
- A success toast says "Woohoo, you did it!" on a routine save → "Saved". Routine success is quiet; celebration is for rare milestones, if anywhere.
- A docs site mixes "we" and impersonal voice page to page → pick one in the voice notes and apply it everywhere; voice is the constant.

**Accessibility:** no criterion governs voice. Calm, literal text helps people with cognitive disabilities, which [W3C COGA](https://www.w3.org/TR/coga-usable/) supports.

**Build:**
- No code counterpart beyond keeping the strings in one place where they can be reviewed as a set ([i18n: strings a translator can work with](../../code/i18n.md#strings-a-translator-can-work-with)).

**Check:** *Script* could flag "Oops", "Uh-oh", "Whoops" and "!" in error, failure and finding strings. *Judgement:* does each message fit its moment, and which side of a trait pair did it fall off?

**Sources:** all systems agree on the voice/tone split. Atlassian prefers "we" in errors to avoid blame; the toolkit follows GOV.UK's subjectless form (see *Error messages*).

---

## Plain language and reading level

**What good looks like**
- Interface copy at grade 7–8 or lower; documentation for designers and engineers at grade 8–9; grade 12 the ceiling for dense reference. This section owns the toolkit's reading levels; other pages link here.
- Sentences under 25 words, 15–20 as the aim; paragraphs of at most five sentences.
- Technical terms that are the users' own (variant, token, snapshot) are explained where uncommon, not counted against the score.

**How:** run a grade formula only on prose of a paragraph or more. A formula means nothing on a button, label or table cell, where one technical noun swings the score; hold microcopy to sentence length and word choice instead. Prefer short words ("buy" over "purchase", "help" over "assist", "use" over "utilise"). Explain an uncommon technical term at first use, inline or by a glossary link. Never paraphrase away a term the audience uses; jargon is the tool's own vocabulary, which *Terminology* covers.

**Cases:**
- A component page's overview scores grade 14 → split the long sentences and swap the long words until it reaches 8–9; past 12 even experts pay too much effort ([NN/g](https://www.nngroup.com/articles/plain-language-experts/)).
- A table cell "DTCG alias" scores grade 16 → ignore the score; the string is two words the audience knows.
- A reference page on token resolution needs grade 11 to stay precise → acceptable under the ceiling; add a one-line summary at the top at grade 8.

**Accessibility:** WCAG 3.1.5 Reading Level (AAA) asks for a simpler version or supplement when text needs more than lower secondary reading ability ([W3C](https://www.w3.org/WAI/WCAG22/Understanding/reading-level.html)). Not a conformance target, but the only standard that names a level, and it agrees with the systems.

**Build:**
- No code counterpart; strings kept in one place, outside templates, are what a reading-level script can read ([i18n: strings a translator can work with](../../code/i18n.md#strings-a-translator-can-work-with)).

**Check:** *Script* could flag sentences over 25 words (warn over 20), paragraphs over five sentences, a long-word substitution list, and a grade over 12 on prose blocks (9–12 advisory). *Judgement:* is a flagged term the users' word or the tool's, and is the short version actually clearer?

**Sources:** Primer and [Shopify](https://shopify.dev/docs/apps/design/content) say grade 7; [Atlassian](https://atlassian.design/foundations/accessibility) says ages 12–14; NN/g allows experts 10–12 and calls past 12 too much. [GOV.UK](https://guidance.publishing.service.gov.uk/writing-to-gov-uk-standards/writing-guidelines/clear-language/) gives the 25-word sentence and five-sentence paragraph. The often-quoted GOV.UK "reading age of 9" comes from a retired page; the toolkit does not use it.

---

## Scannability and hierarchy

**What good looks like**
- The conclusion comes first: inverted pyramid per page, per section and per row.
- Keywords front-loaded in headings, list items, table entries and paragraphs ([Microsoft](https://learn.microsoft.com/en-us/style-guide/scannable-content/)).
- Headed chunks, one idea per paragraph, parallel structure in lists.

**How:** write the first sentence of every section as its answer. Start each heading and list item with the word a scanner looks for. Keep list items grammatically parallel (all start with a verb, or none do). Paragraphs three to seven lines (Microsoft). Provenance and context never open a message about something else; a page states its source once in a caption under its title (design-standard rule 1).

**Cases:**
- Every row of a findings table starts with its snapshot date → once in the caption, change first ([data: provenance and freshness](../patterns/data.md#provenance-and-freshness); *Messages a tool writes about findings*).
- A section opens with two paragraphs of background before saying what to do → move the instruction up, background below.
- A list mixes "Configure the token build" with "Token naming" and "How breakpoints work" → make them parallel, or split the list.

**Accessibility:** 1.3.1 Info and Relationships wants visual hierarchy expressed in structure; 2.4.6 Headings and Labels (AA) wants headings that describe their content ([WCAG 2.2](https://www.w3.org/TR/WCAG22/)). Heading markup is code-standard rule 1.

**Build:**
- Headings are `h1` to `h6` in order, lists are `ul` or `ol`, key–value data is `dl` (code-standard rule 1).
- Markup: [HTML semantics: headings and the outline](../../code/html-semantics.md#headings-and-the-outline) and [lists, description lists and figures](../../code/html-semantics.md#lists-description-lists-and-figures).

**Check:** *Script* could check heading levels never skip (code-standard rule 1 owns it in code), no heading ends in a full stop or colon, paragraph length, list items parallel by first-word class (heuristic), and no row text starting with a date or snapshot reference. *Judgement:* is the first sentence really the conclusion?

**Sources:** [NN/g](https://www.nngroup.com/articles/how-users-read-on-the-web/) found 79% of test users scanned and 16% read word by word; the study is old, and every system repeats its advice. Commentary: a page written entirely in front-loaded fragments reads as slogans; keep prose where an argument must be followed.

---

## Terminology

**What good looks like**
- One name per thing, and one thing per name ([Microsoft](https://learn.microsoft.com/en-us/style-guide/global-communications/writing-tips)).
- The users' words, taken from what they search for and say ([GOV.UK Service Manual](https://www.gov.uk/service-manual/design/writing-for-user-interfaces)).
- A kept glossary of preferred terms and rejected variants that a check reads ([Apple](https://developer.apple.com/design/human-interface-guidelines/writing)).

**How:** before writing, read the project's context document for its terminology; a stated term (a brand spelling, a user-facing word for a concept the code calls something else) is binding. Keep preferred term, rejected variants and proper nouns in one glossary. A toolkit has two vocabularies, the users' (component, variant, token, library) and its own (rule ids, stage names, record keys); the second must never reach rendered text. When two words are really two concepts, define both.

**Cases:**
- A page says "delete" in the button, "remove" in the toast and "discard" in the dialog for one action → one verb throughout.
- A kebab-case rule id in a row → internal vocabulary; rewrite it (*Messages a tool writes about findings*).
- The code's identifier for a request differs from the word users see → the UI shows the users' word; the identifier stays in code.

**Accessibility:** consistent naming supports 3.2.4 Consistent Identification (AA): components with the same function are identified the same way ([WCAG 2.2](https://www.w3.org/TR/WCAG22/)).

**Build:**
- Rendered words come from one string source the glossary lint reads; rule ids and record keys stay in data attributes or values, never in visible text ([i18n: strings a translator can work with](../../code/i18n.md#strings-a-translator-can-work-with)).

**Check:** *Script* could lint rendered text against the glossary's rejected variants, flag kebab-case or record-key patterns in visible text, and check proper-noun capitalisation. *Judgement:* is this the word users actually use?

**Sources:** unanimous across Apple, Shopify, Mailchimp, Microsoft and [Carbon](https://carbondesignsystem.com/guidelines/content/terminology/). Commentary: a long banned-synonym list false-positives where a synonym is a different concept; allow-list those.

---

## Headings and page titles

**What good looks like**
- A heading says what the section holds, in sentence case, with no terminal full stop or colon.
- The page title names the page's subject and matches the navigation item that leads to it.
- A page built from data carries its source and date in a caption under the title (design-standard rule 1); the lede says what the page means.

**How:** front-load the distinguishing word ("Button: accessibility", not "Accessibility for the button component"). Keep the document `<title>` specific first, site name last. One `h1` per page, matching the visible title (code-standard rule 1). Don't put counts or status in a heading where they will go stale; put them in the caption or the body. Short headings, but long enough to make sense out of context, since screen-reader users list headings alone.

**Cases:**
- Three tabs' pages all have the `<title>` "Dashboard" → "Audits · Dashboard", "Changes · Dashboard"; a tab bar of identical titles is unusable.
- A section heading reads "Overview:" → drop the colon.
- A page lede begins with its source → move it to the caption ([data: provenance and freshness](../patterns/data.md#provenance-and-freshness)).

**Accessibility:** 2.4.2 Page Titled (A) needs a title that describes topic or purpose; 2.4.6 Headings and Labels (AA) needs descriptive headings ([WCAG 2.2](https://www.w3.org/TR/WCAG22/)). Heading structure in markup is code-standard rule 1.

**Build:**
- `<title>` is specific first, site name last; one `h1` inside `main` matches the visible title (code-standard rule 1).
- Markup: [HTML semantics: document metadata](../../code/html-semantics.md#document-metadata) and [headings and the outline](../../code/html-semantics.md#headings-and-the-outline).

**Check:** *Script* could check every page has a non-empty, unique `<title>` whose first part matches its `h1`, no heading ends in punctuation, and headings are sentence case. Caption presence is reviewed under design-standard rule 1. *Judgement:* read only the headings: do they outline the page?

**Sources:** sentence case and no terminal punctuation from [Microsoft](https://learn.microsoft.com/en-us/style-guide/top-10-tips-style-voice) and [GOV.UK](https://guidance.publishing.service.gov.uk/writing-to-gov-uk-standards/style-guides/a-to-z-style-guide/).

---

## Button and link labels

**What good looks like**
- A button is a verb that says what happens, often with its object: "Save preferences", "Export tokens" (Apple, Primer).
- A link says where it goes; never "click here" or "here" alone (Primer).
- Sentence case, no terminal punctuation, no padding ("Apply", not "Apply now"; [GOV.UK](https://www.gov.uk/service-manual/design/writing-for-user-interfaces)).

**How:** name the outcome, not the mechanism ("Delete file", not "Confirm"). An adjective and noun is acceptable for a create action ("New issue"). Two buttons side by side differ in their first word. A link's text makes sense out of context: link the noun phrase that names the destination. "Read more" alone fails; "Read more about tokens" passes, or link "tokens". "Continue" moves through a flow, not "Next" ([GOV.UK question pages](https://design-system.service.gov.uk/patterns/question-pages/)). On a small screen keep the verb and drop the object before truncating.

**Cases:**
- A card list repeats "Learn more" twenty times → link each card's title; twenty identical link names are noise in a links list.
- A form ends with "Submit" → name the outcome: "Send request", "Create account".
- An icon-only download button → give it a name ("Download CSV"); implementation is code-standard rule 18.

**Accessibility:** 2.4.4 Link Purpose (In Context) (A) wants each link's purpose clear from its text or context; 2.5.3 Label in Name (A) wants the visible label inside the accessible name; 4.1.2 Name, Role, Value (A) wants every control named ([WCAG 2.2](https://www.w3.org/TR/WCAG22/)). Icon-only names are code-standard rule 18; a count beside a label is a description, code-standard rule 15.

**Build:**
- An action is a `button`, a destination an `a href`; the visible text is the accessible name ([HTML semantics: links and buttons](../../code/html-semantics.md#links-and-buttons)).
- An icon-only control carries `aria-label` and an `aria-hidden` glyph (code-standard rule 18); a count beside a label is `aria-describedby` (code-standard rule 15).

**Check:** *Script* could flag link text in a banned list ("click here", "here", "read more", "learn more", "more"), identical link text pointing to different URLs, buttons ending in punctuation, and button labels not starting with a verb or matching adjective-noun. *Judgement:* does the label name what actually happens?

**Sources:** Apple, Primer, GOV.UK and [Fluent](https://fluent2.microsoft.design/content-design) agree.

---

## Error messages

**What good looks like**
- Says what happened and how to fix it, in one or two sentences ([GOV.UK error message](https://design-system.service.gov.uk/components/error-message/), [Atlassian](https://atlassian.design/foundations/content/designing-messages/error-messages)).
- Sits next to the problem, names the field, blames nobody, apologises for nothing.
- The person's input is kept, so fixing one field never means retyping the form.

**How:** lead with the fix when it is known: "Enter a date after 1 January 2026", not "Invalid date". Avoid GOV.UK's banned words: "forbidden", "illegal", "you forgot", "please", "sorry", "valid", "invalid", "oops". Write subjectless where you can ("Wrong password", not "You have entered the wrong password"). If the cause is unknown, don't invent one; say what failed and what to try. No stack traces or codes in the sentence; put a reference code after it if support needs one. This section owns error wording; the summary on a form with several errors is [forms: error messages and the error summary](../patterns/forms.md#error-messages-and-the-error-summary), and when to show an error is [interaction: validation timing](interaction.md#error-prevention-and-validation-timing).

**Cases:**
- A required email field shows "Field required" → "Enter an email address" ([Primer](https://primer.style/product/getting-started/foundations/content)).
- A server error returns "Error 500: Internal Server Error" → "Couldn't save your changes. Try again in a few minutes." with the code after, for support.
- A form clears every field after one fails → keep all input; only the failing field is marked.

**Accessibility:** 3.3.1 Error Identification (A) wants the error described in text ([W3C](https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html)); 3.3.3 Error Suggestion (AA) wants the fix given where known; 1.4.1 Use of Color (A) forbids colour as the only signal. The error text is tied to its field as a description (code-standard rule 15); a message that appears in a live swap keeps focus (code-standard rule 14).

**Build:**
- The message sits after the field's label, tied by `aria-describedby`, with `aria-invalid="true"` on the field (code-standard rule 15); the form keeps every submitted `value`.
- A message that arrives in a live swap keeps the reader's place (code-standard rule 14); the cause shown is the one the layer below reported (code-standard rule 61).
- Markup: [HTML semantics: form errors and validation](../../code/html-semantics.md#form-errors-and-validation).

**Check:** *Script* could flag banned words and "!" in error strings, an invalid field with no associated text, and fields emptied after a failed submit. *Judgement:* does the message name the real cause, and does the fix work?

**Sources:** Atlassian prefers "we" over "you" to avoid blame; GOV.UK strips the pronoun. The toolkit follows GOV.UK: shorter, and it sidesteps the question.

---

## Empty-state and success copy

**What good looks like**
- An empty state says why it is empty and gives the one action that fills it; success copy confirms what happened in a few words. Both are owned, kinds and copy, by [feedback: empty states](../patterns/feedback.md#empty-states) and [feedback: success confirmation](../patterns/feedback.md#success-confirmation).

**How:** write them with the rest of this file's mechanics (positive titles, past tense with the object, no exclamation marks, nothing crucial in a message that disappears, [Apple](https://developer.apple.com/design/human-interface-guidelines/writing)); take the kind and structure from feedback.

**Cases:**
- A filtered table shows "No data" → "No findings match these filters" with "Clear filters"; the reader needs to know the filters caused it.

**Accessibility:** 4.1.3 Status Messages; see the feedback sections.

**Build:**
- As in [feedback: empty states](../patterns/feedback.md#empty-states): the empty state renders only when the list is empty (code-standard rule 12), and success is written to a status region ([accessibility: live regions and status messages](../../code/accessibility.md#live-regions-and-status-messages)).

**Check:** *Script* and *Judgement*: as in [feedback: empty states](../patterns/feedback.md#empty-states).

**Sources:** [Atlassian](https://atlassian.design/foundations/content/designing-messages/empty-state), [Carbon](https://carbondesignsystem.com/patterns/empty-states-pattern/) and Apple agree; the detail is in feedback.

---

## Confirmations and destructive wording

**What good looks like**
- Undo first; confirm only the rare, serious or irreversible ([interaction: undo or confirmation](interaction.md#undo-or-confirmation)).
- Destructive words name the object, the consequence and the count; buttons name the outcome, never Yes/No/OK.

**How:** the confirmation dialog's title, body, buttons and focus are [dialogs: confirmation dialogs](../patterns/dialogs.md#confirmation-dialogs); a destructive button's label and style are [actions: destructive actions](../patterns/actions.md#destructive-actions). This file's part is the words: "This can't be undone" only when true, and the same verb in the trigger, the dialog and the result.

**Cases:**
- A page says "Delete" on the trigger and "Remove" in the dialog for one action → one verb throughout (*Terminology*).

**Accessibility:** 3.3.4 Error Prevention (Legal, Financial, Data) (AA), as in the dialogs section.

**Build:**
- The trigger's, the dialog's and the result's verb come from one string, so they cannot drift; the dialog itself is [HTML semantics: disclosure, dialogs and popovers](../../code/html-semantics.md#disclosure-dialogs-and-popovers).

**Check:** *Script* could flag a destructive dialog whose verb differs from its trigger's. *Judgement:* was a confirmation warranted at all, or would undo serve?

**Sources:** NN/g and Apple's [undo guidance](https://developer.apple.com/design/human-interface-guidelines/undo-and-redo) agree: prefer undo.

---

## Labels, hints and placeholder text in forms

**What good looks like**
- Every field has a visible label above it; a placeholder never stands in for one ([NN/g](https://www.nngroup.com/articles/web-form-design/)).
- Hint text, between label and field, explains the format or where to find the answer.
- Required and optional are marked as the layout needs.

**How:** labels are short noun phrases or questions in sentence case, no colon. Hints carry format and examples ("For example, 27 3 2026"); long explanations go in body text above the field, not the hint ([GOV.UK question pages](https://design-system.service.gov.uk/patterns/question-pages/)). Avoid placeholders: they vanish on typing, are often low contrast, and read as pre-filled values. Which fields to mark required or optional is [forms: required and optional fields](../patterns/forms.md#required-and-optional-fields); the words are "(optional)" after the label.

**Cases:**
- A login form with placeholder-only "Email" and "Password" → visible labels above; placeholders removed.
- A date field with no format hint, rejecting "27/3/26" → add a hint with an example, and accept common formats.

**Accessibility:** 3.3.2 Labels or Instructions (A) wants labels or instructions where input is required; 1.3.1 wants the label programmatically tied; 2.5.3 Label in Name wants the visible label inside the name ([WCAG 2.2](https://www.w3.org/TR/WCAG22/)). A hint is a description, never part of the name (code-standard rule 15). Hint and placeholder text meet the contrast floor (figma-standard rule 32 in the library) and the 12px minimum (figma-standard rule 26).

**Build:**
- Every field has a `label for`; the hint is a separate element referenced by `aria-describedby` (code-standard rule 15); no `placeholder` stands in for a label.
- Markup: [HTML semantics: forms markup](../../code/html-semantics.md#forms-markup).

**Check:** *Script* could flag an input with no visible label, a placeholder used as the only label, and a label ending in a colon. *Judgement:* does the hint answer the question people get stuck on?

**Sources:** NN/g says avoid placeholders; the required-and-optional disagreement is settled in [forms](../patterns/forms.md#required-and-optional-fields).

---

## Filter and menu labels and counts

**What good looks like**
- Counts and the "all" option follow design-standard rules 11 and 12; the wording reads "All areas (508)", never "All (508)".
- Filter labels are concrete, in the users' words ([NN/g](https://www.nngroup.com/articles/filter-categories-values/)).

**How:** how counts are computed and which control a facet gets are [filtering: counts](../patterns/filtering.md#counts) and [filtering: facet controls](../patterns/filtering.md#facet-controls); this section owns the words. Plural noun in the default: "All components", "All values". A row of segmented buttons, whose siblings are in sight, may say "All" (design-standard rule 12). Avoid vague dimension names ("Item type", "Category"); name the thing.

**Cases:**
- Two menus side by side both open on "All (513)" → "All areas (513)" and "All components (513)" (design-standard rule 12).
- A filter labelled "Type" with values "Type A, Type B" → name the dimension and values in the users' terms.

**Accessibility:** 1.3.1 and 4.1.2: the option's name is its label, its count a description (code-standard rule 15). A result-count change after filtering is a status message (4.1.3).

**Build:**
- The option's label is its name; the count is a description, in its own element referenced by `aria-describedby` (code-standard rule 15).
- The new result count after a filter is written to a status region (code-standard rule 14). Markup: [HTML semantics: search and filter forms](../../code/html-semantics.md#search-and-filter-forms).

**Check:** *Script:* `tools/ui-check/check.mjs`: design-standard rule 12 (first option names what "all" covers); `tools/ui-check/check.mjs`: design-standard rule 5 and design-standard rule 4 for the shape. Could also check every option carries a count and the counts sum to the default's. *Judgement:* do the counts match the list (design-standard rule 11), and is the noun the users' word?

**Sources:** no design system documents "All" options or counts; both rules rest on maintainer runs, with [Smashing](https://www.smashingmagazine.com/2021/07/frustrating-design-patterns-broken-frozen-filters/) supporting counts.

---

## Messages a tool writes about findings

**What good looks like**
- Leads with what changed and what it does to people, in their words, then who it affects and when (design-standard rule 10).
- The rule's identifier stays out of the sentence; a maintainer's report may give it after, in brackets (design-standard rule 10).
- Provenance is one line for the page, never a prefix on every row ([data: provenance and freshness](../patterns/data.md#provenance-and-freshness)).

**How:** template is change, consequence, then audience and timing. Write the consequence for each change type once, by hand, in a table the generator reads; keep the rule id in data, exposed as a filter or link. A verdict ("breaking", "error") is no substitute for a consequence. Assemble the sentence whole per type; never concatenate fragments, which cannot be translated or respelt by dialect.

**Cases:**
- "Snapshot of 2026-10-09 (component-removed): breaking for Figma files and code." → "Removed from the library: placed instances keep rendering and never update again." then who and when (the worked example behind design-standard rule 10).
- A lint row reads "R-14 fail" → "Focus lands on the page body after a filter changes, so keyboard users lose their place (code-standard 14)".
- A new change type ships with no consequence string → the generator refuses it; a bare category is the failure design-standard rule 10 names.

**Accessibility:** no criterion; the sentence must make sense read alone in a table row, which serves screen-reader users navigating by cell.

**Build:**
- The consequence strings are a table in data the generator reads, one whole sentence per change type; the rule id is a data value exposed as a filter or link, never concatenated into the text ([i18n: strings a translator can work with](../../code/i18n.md#strings-a-translator-can-work-with)).

**Check:** *Script:* `tools/figma-audit/test-breaking.mjs` holds the breaking-change writer to design-standard rule 10. Could also refuse a rendered finding containing a kebab-case rule id or starting with a date. *Judgement:* is the consequence true, and is it the one that matters to the reader?

**Sources:** derived by the toolkit from Atlassian (state the problem, the action and what happens if not), GOV.UK (no jargon) and Apple (say how to fix it).

---

## Capitalisation and punctuation

**What good looks like**
- Sentence case on the web for headings, buttons, labels, menu options and titles ([Microsoft](https://learn.microsoft.com/en-us/style-guide/capitalization), GOV.UK, Primer).
- No full stop or colon at the end of headings, labels or buttons.
- "and" over "&"; no exclamation marks in failures; no all caps for emphasis.

**How:** capitalise the first word and proper nouns only; the glossary supplies the proper nouns. Bullets: a lead-in line, no semicolons at the ends, no full stop after the last when items are fragments (GOV.UK). The serial comma follows the dialect: on in en-US, only where it removes ambiguity in en-GB. Visual uppercase is a style (`text-transform`), never typed capitals, so screen readers don't spell it out.

**Cases:**
- A nav reads "Design Tokens", "Component Library" → "Design tokens", "Component library".
- An en-GB project's generated copy uses serial commas throughout → follow the dialect; don't lint en-GB for it.
- An overline is typed "STATUS" → type "Status", uppercase in CSS.

**Accessibility:** typed all caps can be read letter by letter by some screen readers; that is commentary, no criterion names it.

**Build:**
- Strings are stored in sentence case; visual uppercase is `text-transform: uppercase` in the stylesheet, never typed capitals in the string source ([i18n: strings a translator can work with](../../code/i18n.md#strings-a-translator-can-work-with)).

**Check:** *Script* could check sentence case on headings, buttons, labels and options given a proper-noun list; no terminal punctuation; no "&"; typed all-caps strings beyond known acronyms. *Judgement:* is a flagged capital a proper noun the list is missing?

**Sources:** Microsoft, GOV.UK and Primer say sentence case; Apple leaves it per element type, and Fluent splits by platform. The toolkit uses sentence case on the web and the platform's convention for native screens.

---

## Numbers, dates, times, units

**What good looks like**
- Numerals, an unambiguous month, no ordinals, formatted by locale-aware code in the project's dialect; the full guidance is [data: numbers](../patterns/data.md#numbers) and [data: dates and times](../patterns/data.md#dates-and-times).

**How:** in running copy, follow the data patterns; what is this file's alone is that a unit is spelt out at first mention where readers may not know it, and a cached or exported page prefers the absolute date.

**Cases:**
- An en-US project's caption reads "Updated 9 October 2026" → the formatter keyed by `language` gives "Updated Oct 9, 2026".

**Accessibility:** units spelt out at first mention help 3.1.3 Unusual Words (AAA); the rest is in the data patterns.

**Build:**
- Formatted by `Intl.NumberFormat`, `Intl.DateTimeFormat` and `Intl.PluralRules` keyed by the project's `language`, dates in `time datetime` ([i18n: numbers, dates, plurals and lists](../../code/i18n.md#numbers-dates-plurals-and-lists)).

**Check:** *Script* and *Judgement*: as in [data: dates and times](../patterns/data.md#dates-and-times).

**Sources:** GOV.UK and Mailchimp, as linked from the data patterns; the dialect decides where they differ.

---

## Localisation readiness

**What good looks like**
- Short, literal sentences with articles and "that" kept ([Microsoft](https://learn.microsoft.com/en-us/style-guide/global-communications/writing-tips)).
- No idioms, no directional words, no strings built from fragments.
- Dates, numbers and currencies formatted in code.

**How:** write "Access is denied", not "Access denied", where a verb clarifies. Avoid "above", "below", "left", "right" in instructions: they break on reflow, mirror in right-to-left and mean nothing to a screen reader ([Fluent](https://fluent2.microsoft.design/content-design)); name the thing instead. Never concatenate a sentence ("You have " + n + " items"); use whole messages with placeholders and plural rules. Leave room for labels to grow; test with a pseudo-localised build. Currency as a three-letter code where amounts cross borders ([Mailchimp](https://styleguide.mailchimp.com/writing-for-translation/)).

**Cases:**
- Help text says "use the button on the right" → "use Export"; on a phone the button is below.
- A count reads "1 findings" → plural rules per message, not string concatenation.
- A label "Kick off the build" → "Start the build"; idioms don't translate.

**Accessibility:** 1.3.3 Sensory Characteristics (A) forbids instructions that rely only on shape, size, location or sound ([WCAG 2.2](https://www.w3.org/TR/WCAG22/)); "click the button on the right" fails it. 3.1.1 Language of Page (A) and 3.1.2 Language of Parts (AA) want the language declared, so it matches the project's dialect (`lang="en-GB"` or `lang="en-US"`).

**Build:**
- `lang` on `html` matches the project's `language`, and a passage in another language carries its own `lang` ([i18n: language and direction](../../code/i18n.md#language-and-direction)).
- Whole messages with named placeholders and plural rules, never concatenation ([i18n: strings a translator can work with](../../code/i18n.md#strings-a-translator-can-work-with)); no fixed widths on text ([text expansion and no fixed widths on text](../../code/i18n.md#text-expansion-and-no-fixed-widths-on-text)).

**Check:** *Script* could flag directional words in instructions, an idiom list, "e.g."/"i.e.", currency symbols, `lang` absent or not matching the project's `language`, and sentence concatenation in templates. *Judgement:* is a phrase an idiom the list misses?

**Sources:** Microsoft, Mailchimp and Fluent agree. No opened source gives a text-expansion percentage, so the toolkit gives none; test with pseudo-localisation instead.

---

## Inclusive language

**What good looks like**
- Gender-neutral terms; singular "they" where you can't write around a pronoun.
- People-first disability language, no pity words ("suffering from").
- Neutral terms over racial or militaristic ones: "primary/replica" over "master/slave", "allowlist/blocklist" ([Microsoft](https://learn.microsoft.com/en-us/style-guide/bias-free-communication)).

**How:** run a substitution list over authored and generated text, with an allow-list for quoted identifiers (a branch called `master` in quoted output, a "primary" colour that replaces nothing). Review examples, names and imagery in documentation by hand. Plain language is itself inclusive ([Atlassian](https://atlassian.design/foundations/content/inclusive-writing)).

**Cases:**
- Docs examples all use male names → vary them.
- Copy says "the user, he can…" → "people can…" or "they".
- A CLI's output in a code sample says `master` → leave the quoted output; describe it neutrally in prose.

**Accessibility:** no criterion; serves design-standard's principle *for everyone, in any context*.

**Build:**
- No code counterpart beyond one string source a substitution lint can read, with an allow-list for quoted identifiers.

**Check:** *Script* could run Microsoft's substitution table or [alex](https://github.com/get-alex/alex) with an allow-list. *Judgement:* framing, examples and imagery; alex says itself "people are much better at this".

**Sources:** Microsoft, Primer and Atlassian agree.

---

## Abbreviations and acronyms

**What good looks like**
- Expanded at first use on each page, unless the users know the short form better (CSS, API, WCAG, DTCG).
- No full stops inside acronyms; no "e.g." or "i.e." (screen readers can read "eg" as "egg"; [GOV.UK](https://guidance.publishing.service.gov.uk/writing-to-gov-uk-standards/style-guides/a-to-z-style-guide/)).
- The tool's own abbreviations always expanded.

**How:** keep an acronym allow-list in the glossary. Expand "Design Tokens Community Group (DTCG)" only for audiences that don't know it; always expand an internal one. Don't rely on people remembering across pages ([GOV.UK Service Manual](https://www.gov.uk/service-manual/design/writing-for-user-interfaces)). `abbr` with a title is advisory; the expansion belongs in the text. "For example" and "that is" replace "e.g." and "i.e.".

**Cases:**
- A dashboard column header "CV" means "component validator" → spell it out, or show the full term on hover and in a legend.
- A docs page uses "e.g." throughout → "for example".
- Every mention of "CSS" is expanded → stop; it's the users' word.

**Accessibility:** 3.1.4 Abbreviations (AAA) wants a way to find the expansion; first-use expansion is a sufficient technique ([W3C](https://www.w3.org/WAI/WCAG22/Understanding/abbreviations.html)).

**Build:**
- The expansion is in the text; `abbr title` is advisory only. The acronym allow-list lives with the glossary the lint reads.

**Check:** *Script* could flag an all-caps token not on the allow-list and not expanded earlier on the page, "e.g."/"i.e.", and full stops inside acronyms. *Judgement:* which acronyms this audience knows.

**Sources:** GOV.UK expands every first use; Mailchimp and Primer skip widely known ones. The toolkit follows Mailchimp and Primer for the audience's own terms and GOV.UK for everything else.

---

## Alt text

**What good looks like**
- Chosen by the image's job ([W3C decision tree](https://www.w3.org/WAI/tutorials/images/decision-tree/)): empty for decoration or when nearby text says the same; the action or destination for an image that is a link or button's only content; a brief meaning for an informative image.
- A chart's information is on the page, in a table or text, not in alt.
- Concise and consistent ([Atlassian](https://atlassian.design/foundations/content/inclusive-writing)); never "image of", never a file name.

**How:** decide informative or decorative where the image is placed; only the author knows why it is there. A component preview under a heading naming the component and variant is decorative relative to that text: `alt=""`. A preview that is the only place a state is shown needs alt naming the state. A logo in a link describes the destination ("Home"). In a design, annotate each image as informative or decorative with its text.

**Cases:**
- A gallery of button previews, each captioned "Button, primary, hover" → `alt=""`; the caption already says it.
- A screenshot showing the only example of an error state → "Error state: red border and the message 'Enter an email address' under the field".
- A bar chart of findings per area → a data table beside it, and short alt naming what it shows.

**Accessibility:** 1.1.1 Non-text Content (A) wants a text alternative that serves the equivalent purpose and decoration ignorable ([W3C](https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html)). Implementation (empty alt for decoration, names for icon-only controls) is code-standard rule 18.

**Build:**
- Decorative images are `alt=""`, an icon-only control carries `aria-label` with an `aria-hidden` glyph (code-standard rule 18); an informative image's alt names its meaning.
- Markup: [HTML semantics: images and alt](../../code/html-semantics.md#images-and-alt); a chart's data table is [charts in markup](../../code/html-semantics.md#charts-in-markup).

**Check:** *Script* could check every `img` has an `alt` attribute, alt doesn't start with "image of" or "picture of", isn't a file name, and doesn't repeat adjacent caption text. *Judgement:* is it decorative, and does the description carry the meaning?

**Sources:** W3C and Atlassian agree; the preview rule is commentary.

---

## AI disclosure

**What good looks like**
- Model-drafted text is marked where it appears, with a consistent label that leads to an explanation on request ([Carbon for AI](https://carbondesignsystem.com/guidelines/carbon-for-ai/)).
- The label carries review state: "Drafted by AI, not yet reviewed" or "Drafted by AI, reviewed by <name>".
- Template-generated text carries no label; over-labelling devalues it.

**How:** record each string's source (template, model, person) and review state in data; render the label from that, never by hand. A review clears the "not yet reviewed" state through a recorded action. A model's judgement shown as a figure (a score, a severity) says so beside the figure.

**Cases:**
- Component descriptions written by a model and published unreviewed → label each "Drafted by AI, not yet reviewed" until reviewed.
- A findings table built by a deterministic script → no label; it is not AI-generated.
- A label that never changes state after review → it has become wallpaper; wire it to the review record.

**Accessibility:** the label is text, not an icon alone; an icon-only marker needs a name (code-standard rule 18).

**Build:**
- Each string's source and review state is a field in data; the label renders from it, never by hand (code-standard rule 29 puts that logic in the model).
- The label is text; an icon-only marker carries a name (code-standard rule 18).

**Check:** *Script* could check every model-produced string has a provenance flag in data and a visible label, and template strings have none. *Judgement:* was the review substantive?

**Sources:** Carbon is the only system with a published pattern. [EU AI Act Article 50](https://artificialintelligenceact.eu/article/50/) requires disclosure for some systems from 2 August 2026, per the reference site; whether a toolkit's generated text is in scope is a legal question the toolkit does not answer, and the design answer is the same either way.
