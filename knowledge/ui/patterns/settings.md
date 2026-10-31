# Settings and preferences: settings pages, saving, language, time zone and theme

How a product lets people set it up for themselves: how a settings area is structured, how a change is saved, and the three preferences nearly every product the toolkit builds offers (language, time zone, appearance). It serves the principles *people in control, mistakes forgiven* (a change is clearly saved or clearly not), *consistent, not uniform* (one save model per form) and *for everyone, in any context* (a language is offered in its own words, a time in the reader's own zone). No design-standard rule is admitted for settings yet. Whether a change saves itself or waits for a button is decided in [interaction: saving, explicit or automatic](../design/interaction.md#saving-explicit-or-automatic); fields and their errors are [forms](forms.md)'s; a switch, radio group and select are [selection](selection.md)'s; the left-hand list of sections is [sidebars: navigation sidebar](sidebars.md#navigation-sidebar); theming as a visual decision is [visual: theming and dark mode](../design/visual.md#theming-and-dark-mode); language and direction in code are [code: language and direction](../../code/i18n.md#language-and-direction).

## Settings pages

**Use when / don't use**
- Use a settings area when a product has preferences that persist past one session: account, notifications, appearance, integrations.
- Use one page of grouped sections while it fits; past about five groups, a side list of sections with a page each.
- Don't scatter a setting across several places, and don't put a setting where only its first use can reach it; a preference a person changes later lives in settings even if it was first asked elsewhere.

**How**
- **Group by what the person is setting,** each group a heading with a one-line description of what it holds; rows that lead to their own page pair a heading with a short subdued description ([Shopify settings template](https://shopify.dev/docs/api/app-home/patterns/templates/settings)).
- **Destructive and reset actions in their own section** at the end, clearly labelled, each confirmed before it runs (Shopify, same page; [Primer saving](https://primer.style/product/ui-patterns/saving/)).
- **Help beside the control,** not on a separate page (Shopify).
- **Sections as a side list** on wide screens, the current section marked; on small screens the list becomes the settings home and each section its own page with a back link.
- **Search in settings** once there are more than a few dozen settings; it finds a setting by its label and its synonyms, and lands on the setting, not the section.
- **Each setting says its current value** in the control itself; a setting the person cannot change (managed by an administrator) shows as read-only and says who manages it ([interaction: disabled, hidden or read-only](../design/interaction.md#disabled-hidden-or-read-only)).

**Cases**
- Forty settings on one long page under no headings → five groups with descriptions, and a side list once it outgrows a screen or two.
- "Delete account" sits between "Display name" and "Email" → move it to a final section, labelled as destructive, behind a confirmation.
- A notification setting appears only in the onboarding wizard → add it to settings; onboarding may ask, settings owns it.
- An administrator-locked setting is hidden → show it read-only with "Managed by your organisation"; hiding it leaves people searching.

**Accessibility**
- 1.3.1 (each group a heading, each set of radios a `fieldset`), 2.4.6 Headings and Labels, 2.4.8 Location (current section marked), 3.2.2 On Input (changing a setting does not move the page or change context), 3.3.4 Error Prevention for destructive settings (confirm or reversible).
- Figma: figma-standard rules 26, 31 and 32 for each control.

**Build**
- *Elements:* `main` with an `h1`, each group a `section` with an `h2` and its description; the section list a labelled `nav` with links; each group's fields in a `form`; destructive actions a `button` opening a confirmation `dialog`.
- *ARIA and keyboard:* native controls carry it; the section list uses `aria-current="page"`; a confirmation follows [APG alert dialog](https://www.w3.org/WAI/ARIA/apg/patterns/alertdialog/).
- *States:* `aria-current` on the current section; read-only settings use the control's `readonly` or `disabled` as interaction.md decides, with the reason as a description.
- *Rules:* code-standard rule 64 (the current section), code-standard rule 1 (one `h1`; the `nav` labelled), code-standard rule 15 (the description and "managed by" text are descriptions), code-standard rule 20 (each form posts without script), code-standard rule 9 and code-standard rule 62.
- *Detail:* [code: navigation markup](../../code/html-semantics.md#navigation-markup), [code: forms markup](../../code/html-semantics.md#forms-markup).

**Check**
- *Script:* could check every settings group has a heading, every radio set a `fieldset` with a `legend`, the side list exactly one `aria-current`, and every destructive button opens a dialog.
- *Judgement:* Would a person looking for this setting look in this group?

**Sources:** Shopify (Polaris) and Primer as linked. Neither sets a count for when a side list replaces one page; the toolkit's five groups is a starting point.

## Saving settings

**Use when / don't use**
- Use the save model [interaction: saving, explicit or automatic](../design/interaction.md#saving-explicit-or-automatic) chooses; this section only applies it to a settings page.
- Use instant saving for controls whose change is the action (a switch, a segmented control); use an explicit Save for text fields, checkbox and radio groups and native selects ([Primer saving](https://primer.style/product/ui-patterns/saving/)).
- Don't mix the two in one form ([Primer saving](https://primer.style/product/ui-patterns/saving/)).

**How**
- **One Save per form,** named for what it saves ("Save notification settings"); several identical "Save" buttons on a page confuse screen-reader and voice users (Primer).
- **Keep Save enabled,** even when nothing changed or a field is invalid; pressing it explains what is wrong (Primer).
- **Instant changes confirm in place,** close to the control, in a way that cannot be mistaken for a validation state (Primer).
- **Unsaved changes are protected:** warn on leaving with the browser's own prompt (Primer); or show a save bar that appears only when the form has changes, with Save and Discard (Shopify settings template, which uses this bar).
- **Failure keeps the input** and says why (Primer).

**Cases**
- A page has a switch that saves at once beside text fields that wait for Save → move the switch to its own instant section, or make the whole form explicit.
- Three sections each end in "Save" → name each ("Save profile", "Save email preferences").
- Save is greyed out until something changes → enable it; a disabled Save does not say why nothing happens.
- Navigating away loses typed changes silently → warn on leave, or show the save bar.

**Accessibility**
- 4.1.3 Status Messages ("Saved" announced), 3.3.1 and 3.3.3 on failure, 2.5.3 Label in Name (distinct visible names for each Save), 3.2.2 (an instant change does not move focus).

**Build**
- *Elements:* explicit sections as `form` with a `button type="submit"`; instant controls are `input type="checkbox"` styled as a switch or a native radio group, each change sent by script with a no-script submit fallback.
- *ARIA and keyboard:* a switch per [APG switch](https://www.w3.org/WAI/ARIA/apg/patterns/switch/) (Space toggles; prefer a native checkbox, which uses `checked` instead of `aria-checked`); a radio group per [APG radio group](https://www.w3.org/WAI/ARIA/apg/patterns/radio/), native radios first.
- *States:* `checked` on the switch, not a class; the confirmation in a persistent polite live region whose contents change.
- *Rules:* code-standard rule 20 (a no-script path for instant controls), code-standard rule 14 (an update keeps focus on the control), code-standard rule 61 (a failed save says why).
- *Detail:* [code: live regions and status messages](../../code/accessibility.md#live-regions-and-status-messages), [code: progressive enhancement](../../code/javascript.md#progressive-enhancement).

**Check**
- *Script:* could check no form mixes instant controls and a submit button, every Save's accessible name is unique on the page, and no Save carries `disabled`.
- *Judgement:* Does each control's change read as an action (instant) or a draft (explicit)?

**Sources:** Primer and Shopify as linked.

## Language selector

**Use when / don't use**
- Use when the product is offered in more than one language; place it in the header, where people look first, and again in the footer ([Smashing, Friedman 2022](https://www.smashingmagazine.com/2022/05/designing-better-language-selector/)).
- Don't use flags for languages: flags stand for countries, and a language crosses borders (Friedman 2022).
- Don't redirect people automatically by location or browser language; suggest, and let them override (Friedman 2022).

**How**
- **Each language in its own name:** "Deutsch", "Français", "日本語", not "German" or "DE"; abbreviations get mangled by automatic translation (Friedman 2022). A globe or translate icon may mark the trigger, with the current language's name beside it.
- **Suggest, don't force:** when the browser language differs from the page, a non-modal prompt offers the other version (Friedman 2022).
- **Remember the choice** and keep a way back to it, a footer link at least (Friedman 2022).
- **Language and region are separate choices** where both matter (English content, delivery to Poland), as separate controls (Friedman 2022).
- **The switch lands on the same page** in the other language where it exists, not on the home page.

**Cases**
- A dropdown of flags → names in their own language; the trigger shows the current one.
- A visitor from Switzerland is redirected to the German site → serve the requested page and offer the alternative in a dismissable prompt.
- Switching language from a deep docs page lands on the home page → link each option to the same page's translation.
- "EN | DE | FR" in the header → full names, at least in the opened list.

**Accessibility**
- 3.1.1 Language of Page (the page's `lang`), 3.1.2 Language of Parts (each option's name marked with its own language so it is pronounced correctly; [MDN lang](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/lang)), 4.1.2 for the trigger, 2.1.1.

**Build**
- *Elements:* a list of links (each option is a different address) inside a disclosure: a `button` with `aria-expanded` revealing a `ul` of `a`, each with `hreflang` and its name in a `bdi lang="…"` ([MDN lang](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/lang); [MDN a: hreflang](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/a)). The current language is marked, not linked.
- *ARIA and keyboard:* the disclosure pattern for a list of links (Enter or Space opens, Tab moves through links, Escape closes and returns focus), not `role="menu"`; with no script, the list shows.
- *States:* `aria-expanded` on the trigger; `aria-current="true"` on the current language; the list `hidden` when closed.
- *Rules:* code-standard rule 19 (Escape and light dismiss added to a `details`-based disclosure), code-standard rule 17 (`hidden` beats the stylesheet), code-standard rule 20, code-standard rule 64.
- *Detail:* [code: language and direction](../../code/i18n.md#language-and-direction), [code: disclosure, dialogs and popovers](../../code/html-semantics.md#disclosure-dialogs-and-popovers).

**Check**
- *Script:* could check every option carries `hreflang` and a `lang` on its name, no option is an image of a flag alone, the current option has `aria-current`, and each option's link points at the same path in its language.
- *Judgement:* Can a person who cannot read the current language find their own?

**Sources:** Friedman and MDN as linked.

## Time zone selection

**Use when / don't use**
- Use when times are entered or scheduled across zones (reports, schedules, notifications); show times in the reader's zone by default and say which zone it is.
- Don't make UTC the main label; most people do not recognise it ([Friedman, time zone selection](https://smart-interface-design-patterns.com/articles/time-zone-selection-ux/)).

**How**
- **Detect and suggest,** above the full list, and let people override, since detection is unreliable (Friedman). The browser reports its zone through `Intl.DateTimeFormat().resolvedOptions().timeZone` ([MDN resolvedOptions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/resolvedOptions)).
- **People pick a city or country, not an offset:** list places, show each one's current local time and offset beside it, and sort alphabetically, not by offset (Friedman).
- **Search as you type** by city, country or offset, with a placeholder that invites typing rather than scrolling (Friedman); this is a combobox ([selection: combobox and autocomplete](selection.md#combobox-and-autocomplete)).
- **GMT reads better than UTC** in labels; local abbreviations (CEST, PST) help where known (Friedman).
- **Keep the zone list current;** zones change (Friedman).

**Cases**
- A select of 400 entries sorted by offset, labelled "(UTC+01:00) Amsterdam, Berlin, Bern…" → a searchable combobox of places, alphabetical, each with its local time.
- A dashboard shows "14:00" with no zone → show the zone, and the reader's own by default.
- Detection puts a traveller in the wrong zone with no override → suggest it, keep the full list a click away.

**Accessibility**
- 1.3.1 and 4.1.2 for the combobox, 2.1.1, 3.3.2 (the field says what it expects), 1.3.5 does not apply (no autocomplete token for a time zone).

**Build**
- *Elements:* an `input` with a `datalist` for a simple list, or a combobox over a native `select` fallback; the zone stored as an IANA name, the display formatted with `Intl.DateTimeFormat` and `timeZone`.
- *ARIA and keyboard:* [APG combobox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/): `role="combobox"`, `aria-expanded`, Down Arrow into the list, Enter accepts, Escape closes; focus stays in the field with `aria-activedescendant`.
- *States:* `aria-expanded`, `aria-activedescendant`, `aria-selected` on the highlighted option.
- *Rules:* code-standard rule 20 (the native `select` works without script), code-standard rule 15 (local time and offset are descriptions), code-standard rule 14.
- *Detail:* [code: selection controls past the native set](../../code/accessibility.md#selection-controls-past-the-native-set), [code: numbers, dates, plurals and lists](../../code/i18n.md#numbers-dates-plurals-and-lists).

**Check**
- *Script:* could check every displayed time near a zone-sensitive value carries its zone, and the stored value is an IANA name.
- *Judgement:* Will the reader recognise their own place in the list?

**Sources:** Friedman and MDN as linked.

## Theme and appearance

**Use when / don't use**
- Use when the product ships a dark theme: follow the system by default, and offer Light, Dark and System as a three-way choice ([MDN prefers-color-scheme](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme) reports the system preference; [visual: theming and dark mode](../design/visual.md#theming-and-dark-mode)).
- Don't offer a two-way toggle that loses "follow the system" once touched.

**How**
- **Three choices, the current one shown:** a segmented control or radio group in settings; a compact menu in the header of a docs site.
- **Apply at once** and remember the choice; a theme change is an instant setting (see *Saving settings*).
- **No flash of the wrong theme** on load: the remembered choice is applied before the first paint.
- **Native controls follow:** scrollbars and form controls change with the theme (code-standard rule 16).

**Cases**
- A sun/moon toggle sets Dark and never returns to System → three choices; System is the default.
- The page flashes light before turning dark → apply the stored theme in the document head before styles render.
- Dark theme leaves native selects white → declare `color-scheme`.

**Accessibility**
- 1.4.3 and 1.4.11 in every theme, 4.1.2 (the choice's state exposed), 1.4.1 (the current theme not by an icon's colour alone).

**Build**
- *Elements:* three native radios in a `fieldset` with a `legend` ("Theme"), or `button`s with `aria-pressed` in a group; the theme set as an attribute on the root element, `color-scheme` declared to match ([MDN prefers-color-scheme](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme)).
- *ARIA and keyboard:* [APG radio group](https://www.w3.org/WAI/ARIA/apg/patterns/radio/) via native radios: arrows move and select.
- *States:* `checked` on the chosen radio; the root's theme attribute; no attribute means System.
- *Rules:* code-standard rule 16 (native controls follow the theme), code-standard rule 53 (themes and modes follow one pattern), code-standard rule 20 (without script the system preference still applies).
- *Detail:* [code: reduced motion and colour scheme in code](../../code/accessibility.md#reduced-motion-and-colour-scheme-in-code), [code: themes and modes](../../code/tokens.md#themes-and-modes).

**Check**
- *Script:* could load with each stored choice and assert the root attribute is set before first paint, `color-scheme` matches, and System follows an emulated `prefers-color-scheme`.
- *Judgement:* Is every screen checked in both themes, not only the home page?

**Sources:** MDN as linked; the three-way choice follows from the media query having a system value the person may want to keep.
