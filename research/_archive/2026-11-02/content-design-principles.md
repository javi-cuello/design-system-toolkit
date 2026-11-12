# Content design principles for a design system

How the major systems say interface text should be written, which of those rules a script can check and which need a person, and what that means for a toolkit that writes its own audit findings, captions and menus.

Researched October 2026. Every URL cited below was opened in this session and the claim attached to it was read on the page; quotations are short and were read through a page-fetching tool, so re-check the exact wording before quoting any of them in published documentation. Several starting sources had moved: Shopify's Polaris content pages now redirect to a developer API index, so Shopify is cited from its app design guidelines on shopify.dev; GOV.UK's writing guidance has moved from gov.uk to guidance.publishing.service.gov.uk. Some claims were dropped because no page confirmed them: the often-repeated "GOV.UK writes for a reading age of 9" (the current GOV.UK clear-language page cites literacy statistics instead and gives no reading age); any published study supporting result counts in filter options (section 7 marks that as house practice); Mailchimp guidance on dates (its translation page has none); and IBM's terminology database itself (Carbon only links to it). Practitioner opinion, including this guide's own, is labelled as commentary.

---

## What this answers

A design system is mostly read, not looked at. Its documentation site, its audit dashboard and its tools all speak to the people using them, and when the toolkit generates that text itself, every rule about writing becomes either a check it runs or a habit it has to be taught. The useful question for each principle is therefore not only "what is right?" but "can a script tell?".

The questions, in order:

- What is the difference between voice and tone, and does a tool need either?
- How plain is plain, and what reading level suits experts?
- How do people actually read a page, and how should it be structured for that?
- How do you keep one name for one thing?
- How should buttons, links, errors, empty states and confirmations be written?
- How should a message about an audit finding be written?
- How should filter and menu labels read?
- Sentence case or title case, and which punctuation?
- How should numbers, dates, times and units appear, given two dialects?
- How should a page say where its data came from and how fresh it is?
- What makes text ready for translation?
- What counts as inclusive language, and what can a linter catch?
- When should abbreviations be expanded?
- How should alt text be written?
- How should AI-generated content be disclosed?

Sections 16 and 17 are the cheat sheet and the short version.

---

## 1. Voice and tone

**The short answer.** Voice is the constant personality; tone is how that voice adjusts to the situation. Every system checked agrees on that split. For a toolkit, voice is a short list of traits written once, and tone is mostly a rule about errors: drop the warmth and say what happened.

Mailchimp's style guide puts the distinction in a sentence: "Our voice doesn't change much from day to day, but our tone changes all the time," and tone "changes depending on the emotional state of the person you're addressing." Its voice traits are short and testable by ear: "We are plainspoken," "We are genuine," "We are translators," "Our humor is dry." ([Mailchimp, Voice and tone](https://styleguide.mailchimp.com/voice-and-tone/))

Atlassian frames voice as "essentially Atlassian's personality" and tone as how that voice is expressed, which "should change depending on the situation the user is in." Its sixth principle is the one most worth copying into a tool: "Delight means little flourishes, not humor or being cheeky." ([Atlassian, Voice and tone](https://atlassian.design/foundations/content/voice-tone))

Apple says the same procedurally: think "about who you're talking to," then "vary your tone based on the situation" ([Apple HIG, Writing](https://developer.apple.com/design/human-interface-guidelines/writing)).

GitHub's Primer is the most useful model for a tool because its traits come in pairs that name the failure on each side: "Clear but not cold," "Conversational but not jargon-y," "Inclusive but not disingenuous," "Helpful but not overly-prescriptive." It adds a tone rule that belongs in any audit tool: humour is not welcome "in errors, when waiting, or when something fails." ([Primer, Content](https://primer.style/product/getting-started/foundations/content))

**Good practice.** Write three or four voice traits as pairs, the way Primer does, so a reviewer can say which side a sentence fell off. Then write tone as situations rather than adjectives: error, waiting, success, empty, destructive confirmation.

**Pros and cons.** A voice document is cheap and aligns writers. It is also the least enforceable artefact in this guide: no script can tell whether a sentence is "genuine". Its value is as the reference a reviewer points to.

**Checkable vs judgement.** Mostly judgement. A few tone rules are checkable as banned terms in specific contexts: no "Oops", "Uh-oh" or exclamation marks in error or failure strings; no "Sorry" in validation messages.

**Recommendation.** Give the toolkit a four-line voice (plain, direct, specific, calm) and one tone rule it enforces: error, failure and finding text carries no apology, interjection or exclamation mark.

---

## 2. Plain language and reading level

**The short answer.** Plain language is the norm for every audience, experts included. For general audiences the systems converge on about US grade 7. For expert audiences the evidence supports a ceiling, not a lower target: NN/g puts experts at grade 10 to 12 and calls anything beyond 12 too much effort even for highly educated readers. A toolkit for designers and engineers should aim near grade 8 to 9 in prose and treat 12 as the hard ceiling.

**General-audience targets.** Primer: "Aim for a seventh-grade or below reading level," with Hemingway suggested for testing ([Primer, Content](https://primer.style/product/getting-started/foundations/content)). Shopify: "aim for a United States grade 7 reading level," because merchants are "located all over the world, have varying levels of literacy, and might not speak English as their first language" ([Shopify, App design guidelines: content](https://shopify.dev/docs/apps/design/content)). Atlassian's accessibility foundation: "Aim for content to be written at a reading level of ages 12 to 14", which lands roughly at US grades 7 to 9 ([Atlassian, Accessibility](https://atlassian.design/foundations/accessibility)).

**The standard.** WCAG 3.1.5 Reading Level is Level AAA. It asks for supplemental content or a simpler version when text needs reading ability "more advanced than the lower secondary education level", which the Understanding document defines as 7 to 9 years of school ([W3C, Understanding SC 3.1.5](https://www.w3.org/WAI/WCAG22/Understanding/reading-level.html)). AAA is not a conformance target for most products, but it is the only standard that names a level, and it agrees with the design systems.

**Experts.** NN/g's article on plain language for experts reports a usability study with domain specialists in science, technology and medicine and concludes that "even highly educated online readers crave succinct information that is easy to scan." It recommends grade 6 to 8 for general audiences, says 10 to 12 is appropriate for experts, and warns that "text beyond the 12th grade reading level requires too much mental effort, even for highly educated people." It also gives sentence guidance of 15 to 20 words. The article reports no sample sizes or percentages for the expert study, so treat the grade bands as NN/g's recommendation rather than a measured result. ([NN/g, Plain language is for everyone, even experts](https://www.nngroup.com/articles/plain-language-experts/))

GOV.UK makes the same point with its own heading, "Write clearly for specialists too": "Even when writing for a specialist audience, you still need to make sure everyone can understand what the content is about," and research shows "people with higher levels of literacy prefer plain English." Its sentence ceiling is looser than NN/g's: "Try to split up sentences that are over 25 words long." It asks for paragraphs of no more than five sentences, and for "buy" over "purchase" and "help" over "assist." ([GOV.UK, Use clear language](https://guidance.publishing.service.gov.uk/writing-to-gov-uk-standards/writing-guidelines/clear-language/))

Digital.gov defines plain language as "content that is clear and easy to understand" but gives no grade or sentence figure ([Digital.gov, Plain language](https://digital.gov/guides/plain-language/)).

**The consensus for an expert audience.** Nobody recommends writing hard for experts. The range is grade 7 (Primer, Shopify) for everyone, up to 10 to 12 (NN/g) as an allowance for experts, with 12 as a ceiling. Technical terms that are the users' own words (a variant, a token, a snapshot) are not jargon for this audience and should not be paraphrased away; jargon is the tool's own internal vocabulary, which section 4 covers.

**Pros and cons.** Readability formulas are cheap, deterministic and good at catching long sentences and long words. Commentary: they are unreliable on short UI strings, where one technical noun swings the score, and they reward chopping sentences regardless of meaning. A score is a signal to look, never proof of clarity.

**Checkable vs judgement.** Checkable: sentence length (flag over 25 words, warn over 20), paragraph length (five sentences), a substitution list of long words ("purchase", "assist", "utilise"), and a readability grade on prose blocks of a paragraph or more. Judgement: whether a technical term is the users' word or the tool's, and whether a short sentence is actually clearer.

**Recommendation.** Lint documentation prose for sentences over 25 words and a grade over 12, report grade 9 to 12 as advisory, and do not run readability formulas on labels, buttons or table cells.

---

## 3. Scannability and content hierarchy

**The short answer.** People scan first and read second. Put the conclusion first, front-load the keyword in every heading and list item, and break text into headed chunks.

NN/g's often-cited finding is that "79 percent of our test users always scanned any new page they came across; only 16 percent read word-by-word." The techniques it recommends are "highlighted keywords," "meaningful sub-headings," "bulleted lists," "one idea per paragraph," "the inverted pyramid style, starting with the conclusion," and "half the word count (or less) than conventional writing." ([NN/g, How users read on the web](https://www.nngroup.com/articles/how-users-read-on-the-web/)) Commentary: the study is old, so cite it as a long-standing observation that every system below repeats, not a fresh measurement.

Microsoft's top ten tips say "Lead with what's most important. Front-load keywords for scanning" ([Microsoft, Top 10 tips](https://learn.microsoft.com/en-us/style-guide/top-10-tips-style-voice)), and its scannable-content section adds the pattern rule: "Place important keywords near the beginning of headings, table entries, and paragraphs," use parallel structure in headings and list items, and keep paragraphs to three to seven lines ([Microsoft, Scannable content](https://learn.microsoft.com/en-us/style-guide/scannable-content/)). Apple: "put the most important information first," and split more than one idea across screens ([Apple HIG, Writing](https://developer.apple.com/design/human-interface-guidelines/writing)). Shopify: "Use headings, bullets, and short sentences" and avoid "large blocks of text" ([Shopify](https://shopify.dev/docs/apps/design/content)).

**Named example.** This guide's own shape (a short answer first, then evidence, then a recommendation) is the inverted pyramid applied per section. A dashboard row works the same way: the change first, the detail second.

**Pros and cons.** Front-loading costs nothing and helps every reader. The cost is that it fights natural prose rhythm; a page written entirely in front-loaded fragments reads as a list of slogans. Headings every few paragraphs help scanning but fragment an argument that needs to be followed.

**Checkable vs judgement.** Checkable: heading levels never skip, no heading ends in a full stop or colon, paragraph length, list items in a list share a grammatical form (all start with a verb, or none do; this is a heuristic). Judgement: whether the first sentence is actually the conclusion.

**Recommendation.** Every generated section, row and caption puts the outcome in its first clause; check heading structure and paragraph length mechanically, and review the first sentence by hand.

---

## 4. Terminology: one name per thing, in the users' words

**The short answer.** Pick one word for each concept, use it everywhere, and pick the word your users already use. Keep a glossary, and make it the thing a check reads.

The guidance is unusually unanimous. Apple: "Create a list of common terms, and reference that list to keep your language consistent," because "Consistency builds familiarity" ([Apple HIG, Writing](https://developer.apple.com/design/human-interface-guidelines/writing)). Shopify: "Use a single noun, verb, or phrase to describe a specific thing, action, or concept" and avoid "multiple synonyms" ([Shopify](https://shopify.dev/docs/apps/design/content)). Mailchimp's translation guide lists synonyms among things to avoid: "Don't use a lot of different words for the same thing in a single piece of writing" ([Mailchimp, Writing for translation](https://styleguide.mailchimp.com/writing-for-translation/)). Microsoft adds the reverse rule, which is the one teams forget: "Use one word for a concept, and use it consistently… And don't use the same word to refer to multiple concepts" ([Microsoft, Global writing tips](https://learn.microsoft.com/en-us/style-guide/global-communications/writing-tips)).

**Named examples of word lists.** Primer embeds its word list in its content page: "sign in" not "log in", "Pull request" never abbreviated, "and" rather than an ampersand or plus sign, and never "here" or "click here" ([Primer, Content](https://primer.style/product/getting-started/foundations/content)). Carbon points to IBM's central terminology resource, described as promoting "the consistent use of standardized terms across IBM," to be used "when introducing a new term" ([Carbon, Terminology](https://carbondesignsystem.com/guidelines/content/terminology/)).

**The users' own words.** GOV.UK's service manual asks for "using the same language as your users," because "If your title reflects your users' language, they'll be able to find your service and understand what it does" ([GOV.UK Service Manual, Writing for user interfaces](https://www.gov.uk/service-manual/design/writing-for-user-interfaces)). NN/g's filter guidance makes it operational: check search logs to find "the exact language your users are familiar with" ([NN/g, Filter categories and values](https://www.nngroup.com/articles/filter-categories-values/)).

**Why it matters more for a toolkit.** A toolkit has two vocabularies: the users' (component, variant, token, library) and its own (rule ids, internal stage names, record keys). The second leaks into output whenever text is assembled from data. Commentary: this is the most common terminology failure in generated UI copy, and section 6's worked example is one.

**Pros and cons.** A glossary is cheap to start and is the single most automatable artefact in content design. It goes stale unless something reads it, and a long banned-synonym list produces false positives where the synonym is legitimately a different concept.

**Checkable vs judgement.** Checkable: a substitution list (preferred term ← variants), internal identifiers appearing in user-facing strings (a regex for kebab-case rule ids or record keys in rendered text), capitalisation of product names. Judgement: which term the users actually use, and when two words really are two concepts.

**Recommendation.** Keep one glossary per toolkit with preferred terms and their rejected variants, lint generated strings against it, and add a check that no internal identifier reaches rendered text.

---

## 5. UI microcopy: buttons, links, errors, empty states, confirmations

**The short answer.** Buttons are verbs that say what happens. Links say where they go. Errors say what happened and how to fix it, near the problem, without blame or apology. Empty states say why the space is empty and what to do next. Confirmations name the consequence on the buttons.

**Buttons.** Apple: "When labeling buttons and links, it's almost always best to use a verb" ([Apple HIG](https://developer.apple.com/design/human-interface-guidelines/writing)). Primer: sentence case, no punctuation, an imperative verb ("Save preferences") or an adjective and noun ("New issue") ([Primer](https://primer.style/product/getting-started/foundations/content)). GOV.UK: "Write button text in sentence case, describing the action it performs," as in "Save and continue" ([GOV.UK Design System, Button](https://design-system.service.gov.uk/components/button/)), and "just say 'apply' rather than 'apply now'" ([GOV.UK Service Manual](https://www.gov.uk/service-manual/design/writing-for-user-interfaces)).

**Links.** Apple: avoid "Click here" in favour of descriptive words ([Apple HIG](https://developer.apple.com/design/human-interface-guidelines/writing)). Primer: "Link text should be clear, unique, and informative… Never say 'here' or 'click here'" ([Primer](https://primer.style/product/getting-started/foundations/content)). Fluent asks for descriptive link text for the same reason ([Fluent 2, Content design](https://fluent2.microsoft.design/content-design)).

**Errors.** GOV.UK's error message component is the most prescriptive source: "explain what went wrong and how to fix it," and avoid "forbidden," "illegal," "you forgot," "please" (it implies a choice), "sorry," "valid" and "invalid," and "oops" ([GOV.UK Design System, Error message](https://design-system.service.gov.uk/components/error-message/)). Its service manual: "do not say 'You have entered the wrong password'. Say 'Wrong password'." ([GOV.UK Service Manual](https://www.gov.uk/service-manual/design/writing-for-user-interfaces)) Atlassian: "Keep messages to 1 to 2 sentences," lead with the most likely cause or simplest fix, "If you don't know the reason for an error, don't make one up," and "Avoid putting technical information in the message" ([Atlassian, Error messages](https://atlassian.design/foundations/content/designing-messages/error-messages)). Apple: show it "as close to the problem as possible, avoid blame" ([Apple HIG](https://developer.apple.com/design/human-interface-guidelines/writing)). Primer: "Enter a credit card number" over "Field required" ([Primer](https://primer.style/product/getting-started/foundations/content)).

There is one real disagreement: Atlassian prefers "we" over "you" to avoid blame, while GOV.UK strips the pronoun entirely ("Wrong password"). Commentary: for a tool whose errors are about files rather than people, GOV.UK's subjectless form is shorter and sidesteps the question.

**Empty states.** Atlassian: "Include the reason for the empty state and where they can go next," in one to two sentences, with a one- or two-word call to action ([Atlassian, Empty state](https://atlassian.design/foundations/content/designing-messages/empty-state)). Carbon asks for positive titles ("Start by adding data assets" rather than "You don't have any data assets"), one action per empty state, and "Don't lead the user into a dead end" ([Carbon, Empty states](https://carbondesignsystem.com/patterns/empty-states-pattern/)). Apple: "don't show crucial information that could then disappear" ([Apple HIG](https://developer.apple.com/design/human-interface-guidelines/writing)).

**Confirmations.** NN/g: confirm "before committing to actions with serious consequences," never "for routine actions," and label buttons with what will happen, "Delete file and Keep file," not Yes and No; overuse trains people to click through ([NN/g, Confirmation dialogs](https://www.nngroup.com/articles/confirmation-dialog/)). Lightweight success confirmations are Atlassian flags, "for confirmations, alerts, and acknowledgments that require minimal user interaction" ([Atlassian, Designing messages](https://atlassian.design/foundations/content/designing-messages)).

**Pros and cons.** These patterns are well evidenced and highly consistent. The cost is that specific error messages need specific data: "Enter a date in the past" requires the code to know which rule failed. Generic messages are what you get when the error object does not carry the reason.

**Checkable vs judgement.** Checkable: button labels start with a verb from an allowed list or match an adjective-noun pattern; no terminal punctuation on buttons; banned link text ("click here", "here", "read more" alone); banned error words (the GOV.UK list); Yes/No/OK as the only options on a confirmation; empty states have a call to action. Judgement: whether the error names the actual cause, and whether a confirmation was warranted at all.

**Recommendation.** Adopt GOV.UK's banned error vocabulary and NN/g's consequence-named confirmation buttons as checks; require every generated empty state to carry a reason and one next step.

---

## 6. A message about a finding says what changed and what it does to people

**The short answer.** A finding's text should state the change and its consequence for the people affected, in their words. The rule that caught it is metadata: put it in a column, a tooltip or a link, never in the sentence.

This is the toolkit's own rule, derived from the sources above rather than quoted from any one of them. The evidence it rests on: Atlassian's error message should state "the reason for the error and the problem, how someone should act and what happens if they don't act," and keep "technical information" out ([Atlassian, Error messages](https://atlassian.design/foundations/content/designing-messages/error-messages)); GOV.UK bans "form post error" style jargon ([GOV.UK, Error message](https://design-system.service.gov.uk/components/error-message/)); and Apple asks to be "clear about what someone can do to fix it" ([Apple HIG](https://developer.apple.com/design/human-interface-guidelines/writing)).

**Worked example.** A toolkit audit row read:

> Snapshot of 2026-10-09 (component-removed): breaking for Figma files and code.

It was rewritten as:

> Removed from the library: placed instances keep rendering and never update again.

The first version leads with provenance, which belongs in a freshness line (section 10); names a rule id from the tool's internal vocabulary (`component-removed`); and gives a verdict, "breaking", without a consequence. The second leads with the change in the users' words and then says what it does to them, which is both why it matters and why it is subtle: nothing visibly breaks. The toolkit's change (commit `107f862c`, `tools/figma-dashboard/breaking.mjs`) then appends who it breaks and when, as a second part, and moved the rule id into the row's key, where tests still read it.

**Good practice.** A template of change, consequence, then audience and timing. Write the consequence for each change type once, by hand, in a table the generator reads. Keep the rule id in data and expose it as a filter or link for the people who need it.

**Pros and cons.** The rewrite is longer and needs a hand-written consequence per change type, which is real effort and can go stale when behaviour changes. In exchange, a reader can triage without knowing the tool's rule names, and the consequence often reveals severity better than a label ("never update again" is worse than "breaking" sounds).

**Checkable vs judgement.** Checkable: no rule id or internal key in the rendered sentence; no date or snapshot reference as the first words; every change type in the generator has a consequence string. Judgement: whether the consequence is accurate and is the one that matters to the reader.

**Recommendation.** Make "change: consequence" the template for every finding, reviewed per change type, and add a check that refuses any rendered finding containing a rule id.

---

## 7. Labels for filters and menus

**The short answer.** A collapsed menu shows only its current option, so that option is the label. Its default option must name what "all" covers ("All areas (508)", not "All" or "Select…"). Filter labels use the users' words, and counts in options tell people where the results are before they choose.

**Evidence.** NN/g: filter labels "must be as concrete and precise as possible," "Unintelligible jargon has no place in filters," avoid vague categories "like Item Type," and take wording from search logs ([NN/g, Filter categories and values](https://www.nngroup.com/articles/filter-categories-values/)). That article does not address an "All" option or result counts. No design system checked in this session documents either, so the two rules below are house practice, labelled as such.

**House practice, commentary.** A select that reads "All" when collapsed answers the question "all of what?" with nothing, and on a dashboard with several menus side by side, three "All"s are indistinguishable. "All areas (508)" names the dimension and the total, and the options below it ("Components (312)", "Variables (196)") show where the work is. The cost is that counts must be recomputed when other filters change, and the faceting question (does the count reflect this filter alone or the combined result?) has to be answered once and kept consistent. Commentary: show counts that reflect the other active filters, because that is the number of results the person will actually get. An option whose count is zero should be disabled rather than hidden, so the menu's shape stays stable; the toolkit's own docs record that choice (commit `053758d4`).

**Checkable vs judgement.** Checkable: no option whose text is exactly "All", "Any" or "Select"; the default option contains the dimension's noun; counts are present and sum consistently. Judgement: whether the dimension's noun is the users' word.

**Recommendation.** Default options read "All <plural noun> (<n>)", every option carries its count under the current filters, and zero-count options are disabled rather than removed.

---

## 8. Capitalisation and punctuation

**The short answer.** Sentence case everywhere on the web, no full stop on headings, labels or buttons, and one consistent list style. Platforms differ: Apple's platforms use title case in places, and Fluent adapts to each.

**Capitalisation.** Microsoft: "When in doubt, don't capitalize. Default to sentence-style capitalization", capitalising the first word of "a sentence, heading, title, UI label (such as the name of a button or checkbox), or standalone phrase," proper nouns, and nothing else; no all caps for emphasis ([Microsoft, Top 10 tips](https://learn.microsoft.com/en-us/style-guide/top-10-tips-style-voice); [Microsoft, Capitalization](https://learn.microsoft.com/en-us/style-guide/capitalization)). GOV.UK: "Always use sentence case, even in page titles and service names" ([GOV.UK, A to Z](https://guidance.publishing.service.gov.uk/writing-to-gov-uk-standards/style-guides/a-to-z-style-guide/)). Primer: "Use sentence case, and when in doubt, don't capitalize" ([Primer](https://primer.style/product/getting-started/foundations/content)).

Apple does not mandate one: "Title case is generally considered formal, while sentence case is more casual"; choose one per element type and apply it consistently ([Apple HIG](https://developer.apple.com/design/human-interface-guidelines/writing)). Fluent 2 states the platform split plainly: sentence case for Windows, Android and web; title case for iOS and macOS; "we adapt to what's natural for that platform" ([Fluent 2, Content design](https://fluent2.microsoft.design/content-design)).

**Punctuation.** Microsoft: no full stop or colon at the end of titles, headings and UI titles; use the serial comma ([Microsoft, Top 10 tips](https://learn.microsoft.com/en-us/style-guide/top-10-tips-style-voice)). Mailchimp also uses the serial comma, uses exclamation points "sparingly" and "never… in failure messages or alerts," and avoids ampersands ([Mailchimp, Grammar and mechanics](https://styleguide.mailchimp.com/grammar-and-mechanics/)). GOV.UK's bullet rules: a lead-in line, no semicolons at the end of bullets, no full stop after the last bullet; and "and" rather than "&" ([GOV.UK, A to Z](https://guidance.publishing.service.gov.uk/writing-to-gov-uk-standards/style-guides/a-to-z-style-guide/)).

**Dialect matters here.** The serial comma is house style in US guides (Microsoft, Mailchimp) and is used in GOV.UK only where it removes ambiguity. Commentary: let the project's declared dialect choose it, and do not lint it in en-GB.

**Pros and cons.** Sentence case is easier to apply consistently (only the first word and proper nouns), reads faster, and makes proper nouns stand out. Its one cost is that proper nouns must be known to the checker, or every product name is flagged.

**Checkable vs judgement.** Checkable: sentence case on headings, buttons, labels and menu options, given a proper-noun list; no terminal full stop on headings, buttons and labels; no ampersands; no exclamation marks in error strings; no all-caps strings beyond known acronyms. Judgement: whether a capitalised word is a proper noun the list is missing.

**Recommendation.** Enforce sentence case and no terminal punctuation on every UI string, with the glossary from section 4 supplying the proper nouns; make the serial comma a per-dialect setting.

---

## 9. Numbers, dates, times and units

**The short answer.** Numerals for numbers, no ordinals or commas in dates, an unambiguous month (spelled or abbreviated, never a number-only short date), and formatting done by locale-aware code rather than by hand. The project's dialect decides the order.

**en-GB, GOV.UK.** Numerals for everything including 2 to 9; dates as "4 June 2017," no ordinals ("2 June and not 2nd June") and no comma; times as "5:30pm," "midday (not 12 noon, noon or 12pm)," "midnight (not 00:00)"; ranges with "to," not hyphens ("10am to 11am"); "%" with a number; no space between numeral and abbreviated unit ("3,500kg"); spell out measurements at first mention ([GOV.UK, A to Z](https://guidance.publishing.service.gov.uk/writing-to-gov-uk-standards/style-guides/a-to-z-style-guide/)).

**en-US, Atlassian and Mailchimp.** Atlassian uses US long dates ("January 12, 2028"), avoids numeric short dates because countries order them differently, and, if one is needed, uses ISO 8601 "YYYY-MM-DD." It says "Time and date strings should never be localized manually by a designer, engineer, or translator," uses "ago" for very recent events, and asks to "always provide a way for people to see the actual timestamp, usually via a tooltip" ([Atlassian, Date and time](https://atlassian.design/foundations/content/date-time)). Atlassian's content index adds "noon," "midday" or "midnight" in place of 12 a.m./p.m. ([Atlassian, llms-content.txt](https://atlassian.design/llms-content.txt)). Mailchimp spells out a number only at the start of a sentence and writes times with "am or pm, with a space in between" ([Mailchimp, Grammar and mechanics](https://styleguide.mailchimp.com/grammar-and-mechanics/)).

The disagreements are dialect, not principle: GOV.UK's unspaced "5:30pm" against Mailchimp's spaced "am"; GOV.UK rules out "noon", which Atlassian allows alongside "midday". Everyone agrees on numerals, no ordinals, unambiguous months and machine formatting.

**Good practice for a toolkit.** Store ISO 8601 in data, render through the platform's locale formatter with the project's dialect (`en-GB` gives "9 Oct 2026", `en-US` gives "Oct 9, 2026"), and never build a date string by concatenation. Relative times ("2 days ago") always carry the absolute date in a tooltip or title attribute.

**Checkable vs judgement.** This is the most checkable topic in the guide. Regexes catch ordinals in dates (`\b\d{1,2}(st|nd|rd|th) [A-Z][a-z]+`), numeric short dates (`\b\d{1,2}/\d{1,2}/\d{2,4}\b`), "12pm/12am/noon" variants, hyphenated time ranges, a space before an abbreviated unit (per dialect), and US-order dates in an en-GB project or vice versa. Judgement: when relative time helps and when the absolute date matters more.

**Recommendation.** One date formatter, keyed by the project's dialect, used by every generated string; lint rendered output with the date regexes above per dialect.

---

## 10. Provenance and freshness copy

**The short answer.** Any page built from stored data should say which data and when, in one plain line: "Updated by the snapshot of 9 Oct 2026." Put it near the content it qualifies, with the exact timestamp available on hover.

**Evidence.** No design system checked has a dedicated provenance pattern. The adjacent guidance is Atlassian's rule that relative time must always expose the actual timestamp, usually in a tooltip ([Atlassian, Date and time](https://atlassian.design/foundations/content/date-time)), and the general front-loading principle in section 3, which says provenance should not lead a message about something else. The rest of this section is commentary.

**Commentary.** For a dashboard or documentation site generated from a snapshot, freshness copy answers the reader's first doubt ("is this current?") and stops the doubt leaking into every row. The worked example in section 6 shows the failure mode: "Snapshot of 2026-10-09" at the start of each finding repeats the same provenance hundreds of times and pushes the change out of the first words. State it once, at page or table level, and keep it out of the rows.

Good provenance copy names the source in the users' terms ("the snapshot", "the library"), uses the dialect's date format, and says what the reader should do if it is stale only when there is something they can do. "Updated" is clearer than "Last synced" or "Generated", which describe the tool's process.

**Pros and cons.** A single line is cheap and removes a large class of confusion. Relative wording ("3 days ago") is friendlier but decays on a cached or exported page; the absolute date survives a PDF.

**Checkable vs judgement.** Checkable: every generated page has a provenance line; its date is in the project's dialect format; no row-level text begins with a snapshot or date reference. Judgement: whether the named source is one the reader recognises.

**Recommendation.** One provenance line per generated page or table, absolute date in the project's dialect, exact timestamp in a title attribute, and no provenance inside row text.

---

## 11. Localisation readiness

**The short answer.** Write short, literal sentences with articles kept in, one word per concept, no idioms, no directional words, and let code format dates, numbers and currencies. Most of this is also just plain language.

Microsoft's global writing tips are the most complete list: "Write short, simple sentences," "Include *that* and *who*," keep articles, add verbs to short labels where needed ("Access is denied" rather than "Access denied"), avoid idioms and "modifier stacks," and use one word per concept ([Microsoft, Global writing tips](https://learn.microsoft.com/en-us/style-guide/global-communications/writing-tips)). It separates translation from localisation, which adapts content to a locale's "language, cultural, and political expectations" ([Microsoft, Global communications](https://learn.microsoft.com/en-us/style-guide/global-communications/)).

Mailchimp's translation page bans "Slang, idioms, and cliches," "Unnecessary abbreviations" ("for example" over "e.g."), shortened words ("application" over "app"), and currency symbols in favour of three-letter codes, and flags ambiguous words such as "right" ([Mailchimp, Writing for translation](https://styleguide.mailchimp.com/writing-for-translation/)).

**Directional words.** Fluent 2: "Using words like 'above', 'below', 'right', and 'left' assume that someone can see what you're referring to" ([Fluent 2, Content design](https://fluent2.microsoft.design/content-design)). They also break when a layout reflows on a phone or mirrors for a right-to-left language. Commentary: "above" survives reflow on a single-column page more often than "left" does, but neither survives a screen reader.

**What was not found.** None of the opened pages give a text-expansion percentage. Commentary: plan for labels to grow substantially in translation, and test with a pseudo-localised build rather than relying on a number.

**Pros and cons.** Localisation-ready writing costs a slightly flatter voice (Microsoft acknowledges "a few exceptions to general Microsoft voice") and longer labels where articles and verbs come back. It pays off even with no translation planned, because the same habits help non-native readers and machine translation in the browser.

**Checkable vs judgement.** Checkable: directional words in instructions ("above", "below", "left", "right", "on the side"), an idiom list, "e.g."/"i.e.", currency symbols, concatenated strings in code (a sentence built from fragments cannot be translated), hard-coded date formats. Judgement: whether a phrase is an idiom the list is missing.

**Recommendation.** Lint for directional words, idioms and Latin abbreviations, and refuse string concatenation for sentences in generated UI; format all locale-sensitive values in code.

---

## 12. Inclusive language

**The short answer.** Gender-neutral terms, people-first disability language, no terms with racial or militaristic connotations where a neutral one exists, and no generalisations about people. A linter catches the vocabulary; a person catches the framing.

Microsoft's bias-free guidance is the most concrete published list: "chair, moderator" rather than "chairman," "workforce, staff, personnel" rather than "manpower," no generic "he" or "she," singular "they" where you cannot write around it, "primary/subordinate" rather than "master/slave," "perimeter network" rather than "demilitarized zone," and "stop responding" rather than "hang." It asks to "Focus on people, not disabilities" and to avoid words implying pity, such as "suffering from" ([Microsoft, Bias-free communication](https://learn.microsoft.com/en-us/style-guide/bias-free-communication)). Primer: "Avoid gendered language" ([Primer](https://primer.style/product/getting-started/foundations/content)). Atlassian's inclusive writing page ties plain language to inclusion: "Simple wording is more inclusive and helps people complete their tasks faster and with higher success rates," and "Don't use metaphors, idioms, or jargon" ([Atlassian, Inclusive writing](https://atlassian.design/foundations/content/inclusive-writing)).

**Tooling.** alex, an open-source linter that aims to "Catch insensitive, inconsiderate writing," is candid about its limits: "alex isn't very smart. People are much better at this," and "No automated tool can replace studying inclusive communication" ([alex on GitHub](https://github.com/get-alex/alex)).

**Pros and cons.** Vocabulary lists are effective and cheap. They miss framing, examples and imagery, and they produce false positives on legitimate technical uses (a "master" branch name in quoted output, a "primary" colour that is not a replacement for anything).

**Checkable vs judgement.** Checkable: a term substitution list (Microsoft's table is a ready start), generic gendered pronouns. Judgement: examples, names and images in documentation, and whether a flagged term is quoted from a system the text is describing.

**Recommendation.** Run a substitution list based on Microsoft's table over all generated and authored text, with an allow-list for quoted identifiers, and review examples and imagery by hand.

---

## 13. Abbreviations

**The short answer.** Expand an abbreviation on first use on each page unless your users know it better in short form, skip full stops, and avoid Latin abbreviations.

WCAG 3.1.4 Abbreviations (AAA) asks for "A mechanism for identifying the expanded form or meaning of abbreviations"; the sufficient techniques include expanding the first occurrence immediately before or after it, or linking to a definition; the HTML `abbr` element is advisory only ([W3C, Understanding SC 3.1.4](https://www.w3.org/WAI/WCAG22/Understanding/abbreviations.html)). GOV.UK: "The first time you use an abbreviation on a page, explain it in full," and "Do not use full stops in abbreviations"; avoid "eg," which screen readers can read as "egg," and "ie," which "is not always well understood" ([GOV.UK, A to Z](https://guidance.publishing.service.gov.uk/writing-to-gov-uk-standards/style-guides/a-to-z-style-guide/)). Mailchimp: spell out on first mention "If there's a chance your reader won't recognize" it, but use well-known ones like API or HTML directly ([Mailchimp, Grammar and mechanics](https://styleguide.mailchimp.com/grammar-and-mechanics/)). Primer: "Use acronyms when they are more widely used than the spelled out term," with exceptions in its word list ([Primer](https://primer.style/product/getting-started/foundations/content)). GOV.UK's service manual adds: "Do not rely on people remembering them across different pages" ([GOV.UK Service Manual](https://www.gov.uk/service-manual/design/writing-for-user-interfaces)).

**For this audience.** CSS, WCAG, DTCG and API are the users' words. Expanding them every time is noise; never expanding the toolkit's own abbreviations is the real failure.

**Checkable vs judgement.** Checkable: an all-caps token not in an allow-list of known acronyms and not expanded earlier on the page; "e.g." and "i.e."; full stops inside acronyms. Judgement: which acronyms the audience knows.

**Recommendation.** Keep an acronym allow-list in the glossary; flag any other abbreviation not expanded on first use per page, and replace "e.g." and "i.e." with words.

---

## 14. Alt text

**The short answer.** Alt text depends on the image's job: empty for decoration or when nearby text says the same thing, the action or destination for an image in a link or button, a brief description of the meaning for an informative image, and the full information elsewhere on the page for a chart.

The W3C's alt decision tree sorts images by function: images of text whose words appear nearby, or that are purely decorative, get an empty `alt`; an image that is the only content of a link or button gets alt text stating "the link's destination or the action taken"; an informative image gets a brief description of its meaning; a graph or complex image gets its information "elsewhere on the page" ([W3C, An alt decision tree](https://www.w3.org/WAI/tutorials/images/decision-tree/)). Atlassian: "Make alt text concise and consistent… so the experience isn't annoying for people using assistive technology" ([Atlassian, Inclusive writing](https://atlassian.design/foundations/content/inclusive-writing)), and write "clear and concise labels and alternative (alt) text" ([Atlassian, Accessibility](https://atlassian.design/foundations/accessibility)).

**For a toolkit.** Generated documentation is full of component previews and screenshots. Commentary: a preview next to a heading that names the component and variant is usually decorative relative to that text and should have empty alt; a preview that is the only place a state is shown needs alt text naming the state. A chart in a dashboard needs its numbers in a table or text, not in alt.

**Checkable vs judgement.** Checkable: every `img` has an `alt` attribute (empty allowed); alt text does not start with "image of" or "picture of"; alt text is not a file name; icon-only buttons have an accessible name. Judgement: whether an image is decorative, and whether the description conveys its meaning.

**Recommendation.** Require an explicit `alt` on every generated image, default previews to empty alt when the caption names them, and give every chart a text or table equivalent.

---

## 15. AI disclosure

**The short answer.** Mark AI-generated content where it appears, with a consistent label that leads to an explanation on request. In the EU this is becoming a legal duty for some systems, not only good practice.

Carbon for AI is the only design system checked with a published pattern: "Mark AI-generated content with an AI label," the label is "the primary indicator to communicate that AI is present," each AI component carries "an embedded AI label and explainability popover," and explanations appear "only when needed or requested by the user." Its rationale: "Transparency of AI presence is key to user trust" ([Carbon for AI](https://carbondesignsystem.com/guidelines/carbon-for-ai/)).

The EU AI Act's Article 50 requires that people be "informed that they are interacting with an AI system" unless it is obvious, and that providers of systems generating synthetic text, images, audio or video ensure outputs "are marked in a machine-readable format and detectable as artificially generated or manipulated"; the reference site gives 2 August 2026 as the date these obligations apply ([EU AI Act, Article 50](https://artificialintelligenceact.eu/article/50/)). Commentary: whether a toolkit's generated audit text falls within Article 50 is a legal question this guide does not answer; the design answer is the same either way.

**For a toolkit.** When the toolkit writes a component description, a finding's consequence or a caption with a model, say so where the text appears ("Drafted by AI, reviewed by <name>" or "Drafted by AI, not yet reviewed"), and keep that state in data so a review can clear it. Deterministic text from templates is not AI-generated and should not carry the label; over-labelling devalues it.

**Pros and cons.** Labelling builds trust and gives reviewers a queue. It adds visual noise, and a label that never changes state becomes wallpaper.

**Checkable vs judgement.** Checkable: every string produced by a model carries a provenance flag in data and a visible label in output; template-generated strings do not. Judgement: whether a human review was substantive.

**Recommendation.** Record generation source per string; label model-drafted text visibly with its review state, and clear the label only through a recorded review.

---

## 16. Cheat sheet

| Topic | Do this | Not this | Script can check |
|---|---|---|---|
| Voice and tone | Four paired traits; calm, plain errors | "Oops", apologies, exclamation marks in failures | Banned words in error strings |
| Reading level | Grade 7 to 9 prose, 12 as ceiling, 25-word sentences | Readability scores on labels | Sentence length, grade on paragraphs |
| Scannability | Conclusion first, keywords front-loaded | Provenance or context as the first words | Heading levels, paragraph length |
| Terminology | One glossary, users' words | Synonyms; rule ids in UI text | Substitution list, identifier regex |
| Buttons | Verb plus object, sentence case | "OK", "Let's do it!", trailing full stop | Verb-first, no punctuation |
| Links | Say where it goes | "Click here", "here" | Banned link text |
| Errors | What happened, how to fix, near the field | "Invalid", "please", "sorry", jargon | GOV.UK banned list |
| Empty states | Reason plus one next step | A dead end | CTA present |
| Confirmations | "Delete file" / "Keep file" | Yes / No; confirming routine actions | Yes/No/OK-only dialogs |
| Findings | "Removed from the library: instances keep rendering and never update again." | "Snapshot of … (component-removed): breaking" | No rule id; not date-first |
| Filters and menus | "All areas (508)", counts, disabled zeros | "All", "Select…", hidden options | Default names its noun |
| Capitalisation | Sentence case on the web; per platform elsewhere | Title Case Labels | Sentence case with proper-noun list |
| Dates | Locale formatter, dialect from project | "2nd June", "03/04/26", "12pm" | Date regexes per dialect |
| Provenance | One line: "Updated by the snapshot of 9 Oct 2026" | Provenance repeated in every row | Present once per page |
| Localisation | Short literal sentences, articles kept | Idioms, "above/left", concatenated strings | Word lists, concatenation in code |
| Inclusive language | Microsoft's substitution table | Generic "he"; "master/slave" | Substitution list |
| Abbreviations | Expand on first use unless users know it | "e.g.", "i.e.", "B.B.C." | Unknown all-caps tokens |
| Alt text | By function; empty for decoration | "Image of…", file names, missing alt | Attribute present, no "image of" |
| AI disclosure | Label plus review state, from data | Unlabelled model text; labels on templates | Flag present on model strings |

---

## 17. The short version

Errors and findings are calm, specific and unapologetic. Write plainly for experts too: the systems converge on grade 7, NN/g allows experts 10 to 12, nobody defends going past 12. Aim near 8 to 9 and keep sentences under 25 words.

Put the outcome first, in the users' words, with one name per thing from a glossary a check reads. The toolkit's characteristic failure is its own vocabulary leaking into output, and that is the easiest one to refuse mechanically. A finding states the change and what it does to people: "Removed from the library: placed instances keep rendering and never update again." The rule that caught it belongs in data.

A collapsed menu's visible option is its label: "All areas (508)", not "All". Dates come from one formatter keyed by the project's dialect. Provenance is one line per page, not a prefix on every row. Write for translation even when nothing will be translated.

**What a script can own, and what it cannot.** Scripts can own banned and preferred terms, sentence case, terminal punctuation, sentence and paragraph length, reading grade on prose, date and time formats per dialect, internal identifiers in rendered text, unexpanded abbreviations, missing alt attributes, default menu options, and AI provenance flags. People still own whether a sentence names the real cause, whether a word is the users' word, whether a consequence is true, and whether an image is decorative. A toolkit that writes its own copy should automate the first list completely, because that is what frees reviewers for the second.

---

## 18. What to re-check later

- **Filter counts and "All" options.** No design system or study confirmed in this session documents them; section 7's rule is house practice. Worth a further search, or a small test with the toolkit's own users.
- **NN/g's evidence.** The expert plain-language article gives grade bands without study figures, and the 79 percent scanning figure is from an old study. Both are directionally supported elsewhere, neither is a recent measurement.
- **EU AI Act Article 50.** The reference site gives 2 August 2026 for the transparency obligations. Check the official text and any amendment before relying on the date or on whether the toolkit is in scope.

---

## Sources

**Primary: standards and regulation**

- [W3C, Understanding SC 3.1.5 Reading Level](https://www.w3.org/WAI/WCAG22/Understanding/reading-level.html). AAA; lower secondary education as 7 to 9 years of school.
- [W3C, Understanding SC 3.1.4 Abbreviations](https://www.w3.org/WAI/WCAG22/Understanding/abbreviations.html). AAA; first-use expansion techniques.
- [W3C, An alt decision tree](https://www.w3.org/WAI/tutorials/images/decision-tree/). Alt text by image function.
- [EU AI Act, Article 50](https://artificialintelligenceact.eu/article/50/). Transparency obligations and their application date.

**Primary: design systems and style guides**

- [Apple Human Interface Guidelines, Writing](https://developer.apple.com/design/human-interface-guidelines/writing). Voice, term lists, buttons, errors, empty states, capitalisation.
- [GitHub Primer, Content](https://primer.style/product/getting-started/foundations/content). Grade 7 target, voice pairs, sentence case, word list, errors, links, abbreviations.
- [Shopify, App design guidelines: content](https://shopify.dev/docs/apps/design/content). Grade 7 target and rationale, single term per concept, scannability, CTAs.
- [Atlassian, Voice and tone](https://atlassian.design/foundations/content/voice-tone). Voice and tone definitions and principles.
- [Atlassian, Designing messages](https://atlassian.design/foundations/content/designing-messages), [Error messages](https://atlassian.design/foundations/content/designing-messages/error-messages) and [Empty state](https://atlassian.design/foundations/content/designing-messages/empty-state). Message types, error structure, empty-state copy.
- [Atlassian, Date and time](https://atlassian.design/foundations/content/date-time) and [llms-content.txt](https://atlassian.design/llms-content.txt). Date formats, no manual localisation, timestamp tooltips, noon and midnight.
- [Atlassian, Accessibility](https://atlassian.design/foundations/accessibility). Reading level of ages 12 to 14; alt text.
- [Atlassian, Inclusive writing](https://atlassian.design/foundations/content/inclusive-writing). Plain language as inclusion; concise alt text.
- [Mailchimp, Voice and tone](https://styleguide.mailchimp.com/voice-and-tone/). Voice versus tone, voice traits.
- [Mailchimp, Writing for translation](https://styleguide.mailchimp.com/writing-for-translation/). Synonyms, idioms, abbreviations, currency codes.
- [Mailchimp, Grammar and mechanics](https://styleguide.mailchimp.com/grammar-and-mechanics/). Numbers, dates, times, percentages, serial comma, exclamation points.
- [Microsoft Style Guide, Top 10 tips](https://learn.microsoft.com/en-us/style-guide/top-10-tips-style-voice). Front-loading, sentence case, end punctuation, serial comma.
- [Microsoft Style Guide, Capitalization](https://learn.microsoft.com/en-us/style-guide/capitalization). Sentence-style capitalisation in detail.
- [Microsoft Style Guide, Scannable content](https://learn.microsoft.com/en-us/style-guide/scannable-content/). Keywords first, parallel structure, paragraph length.
- [Microsoft Style Guide, Global communications](https://learn.microsoft.com/en-us/style-guide/global-communications/) and [Writing tips](https://learn.microsoft.com/en-us/style-guide/global-communications/writing-tips). Translation versus localisation; global writing rules; one word per concept.
- [Microsoft Style Guide, Bias-free communication](https://learn.microsoft.com/en-us/style-guide/bias-free-communication). Substitution tables, pronouns, people-first language.
- [Microsoft Fluent 2, Content design](https://fluent2.microsoft.design/content-design). Capitalisation per platform, directional words, link text.
- [IBM Carbon, Terminology](https://carbondesignsystem.com/guidelines/content/terminology/). Pointer to IBM's terminology management.
- [IBM Carbon, Empty states pattern](https://carbondesignsystem.com/patterns/empty-states-pattern/). Empty-state types and copy.
- [IBM Carbon for AI](https://carbondesignsystem.com/guidelines/carbon-for-ai/). AI label and explainability.
- [GOV.UK, Use clear language](https://guidance.publishing.service.gov.uk/writing-to-gov-uk-standards/writing-guidelines/clear-language/). Plain English for specialists, 25-word sentences.
- [GOV.UK, A to Z style guide](https://guidance.publishing.service.gov.uk/writing-to-gov-uk-standards/style-guides/a-to-z-style-guide/). Capitals, abbreviations, dates, times, numbers, units, bullets.
- [GOV.UK Service Manual, Writing for user interfaces](https://www.gov.uk/service-manual/design/writing-for-user-interfaces). Users' language, error wording, front-loading.
- [GOV.UK Design System, Error message](https://design-system.service.gov.uk/components/error-message/). Error structure and banned words.
- [GOV.UK Design System, Button](https://design-system.service.gov.uk/components/button/). Button text.
- [Digital.gov, Plain language](https://digital.gov/guides/plain-language/). Definition and the Plain Writing Act.

**Research and practitioner sources**

- [NN/g, Plain language is for everyone, even experts](https://www.nngroup.com/articles/plain-language-experts/). Grade bands for general and expert audiences; sentence length.
- [NN/g, How users read on the web](https://www.nngroup.com/articles/how-users-read-on-the-web/). The scanning finding and techniques.
- [NN/g, Filter categories and values](https://www.nngroup.com/articles/filter-categories-values/). Concrete filter labels in users' language.
- [NN/g, Confirmation dialogs](https://www.nngroup.com/articles/confirmation-dialog/). When to confirm; consequence-named buttons.

**Tools**

- [Vale documentation](https://docs.vale.sh/) and [Vale styles](https://docs.vale.sh/topics/styles). Prose linter; check types including existence, substitution, capitalization, readability and consistency.
- [alex](https://github.com/get-alex/alex). Inclusive-language linter and its stated limits.

**Toolkit evidence**

- Toolkit commit `107f862c`, `tools/figma-dashboard/breaking.mjs`. The finding rewrite in section 6.
- Toolkit commit `053758d4`. Audits menus disable an empty option instead of hiding it, cited in section 7.
