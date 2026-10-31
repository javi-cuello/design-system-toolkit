# Consent: cookie banners, permission requests and privacy settings

How a product asks for consent and keeps it revocable: the cookie banner and cookies page, requests for browser permissions (notifications, location, camera), and the settings where people change their mind later. It serves the principles *honest* (a choice is presented as a choice, never steered), *people in control, mistakes forgiven* (consent is withdrawn as easily as given) and *serve a real need* (nothing is asked before it is needed). No design-standard rule is admitted for consent yet. Where privacy settings sit among other settings is [settings](settings.md)'s; notification timing as an interruption is [ux: notifications and interruptions](../design/ux.md#notifications-and-interruptions); third-party scripts in code are [code: third-party scripts and Subresource Integrity](../../code/security.md#third-party-scripts-and-subresource-integrity). This page is design guidance, not legal advice: what a law requires is the organisation's privacy expert's call.

## Cookie consent banners

**Use when / don't use**
- Use a banner when the product sets non-essential cookies or similar storage (analytics, local storage, service workers used for tracking) ([GOV.UK cookie banner](https://design-system.service.gov.uk/components/cookie-banner/)).
- Don't show a banner when only essential cookies are set; list them on a cookies page linked from the footer (GOV.UK, same page).
- Don't block or blur the page; a modal over the content was the most disliked placement in Friedman's research ([Smashing, Friedman 2019](https://www.smashingmagazine.com/2019/04/privacy-ux-better-cookie-consent-experiences/)), and NN/g advises letting people see the site before deciding ([NN/g, Tankala 2023](https://www.nngroup.com/articles/cookie-permissions/)).
- Don't stack it with a newsletter or chat pop-up on arrival (NN/g 2023; Friedman 2019).

**How**
- **Accept and reject on the first layer, with equal weight:** same size, style and prominence, rejection never behind a "Manage" button (Friedman 2019; NN/g 2023). GOV.UK's examples give both the same button style.
- **Plain, specific labels:** "Accept analytics cookies" and "Reject analytics cookies" ([GOV.UK](https://design-system.service.gov.uk/components/cookie-banner/)); options that start with the same word or hide behind "Learn more" are hard to tell apart (NN/g 2023).
- **Off by default:** nothing non-essential is set before an active opt-in, and no category is pre-selected (Friedman 2019).
- **Placement:** after the opening of `body`, before the skip link, in the flow, never fixed or sticky, so it cannot cover focused content (GOV.UK).
- **After the choice:** replace the question with a confirmation that names the choice and links to change it, with a "Hide" button; remember the choice for a year and don't ask again (GOV.UK).
- **A close icon is not consent;** if the banner can be closed, closing must not be treated as accepting (Friedman 2019; NN/g 2023).

**Cases**
- A banner with a large "Accept all" and a text link "Settings" → two equal buttons, Accept and Reject, plus a link to the cookies page.
- Analytics load on page view before any choice → load them only after acceptance.
- The banner is fixed to the bottom and covers the focused field in a form → put it in the flow at the top of the page.
- Closing the banner with × sets every cookie → closing changes nothing; ask again next visit.

**Accessibility**
- 2.4.11 Focus Not Obscured (Minimum): the banner never covers focused content, which is why it is not sticky ([GOV.UK](https://design-system.service.gov.uk/components/cookie-banner/)). 1.3.1 (a labelled region with a heading naming the service), 4.1.3 Status Messages (the confirmation announced), 2.4.3 (focus moves to the confirmation after a choice made without reload), 2.5.8 for the buttons.

**Build**
- *Elements:* a `div role="region"` with `aria-label` ("Cookies on {service}") and an `h2`; where cookies are set on the server, the banner is a `form method="post"` with two `button type="submit"` sharing a name and differing in value, so it works without script; every message is in the HTML, the inactive ones `hidden` (GOV.UK).
- *ARIA and keyboard:* native buttons carry it. The confirmation takes `role="alert"` and `tabindex="-1"` and receives focus when the choice is made by script (GOV.UK).
- *States:* `hidden` on the question and the confirmation as they swap; the choice stored in one first-party cookie read on the server.
- *Rules:* code-standard rule 20 (a real POST form that works without script; a render never writes, so no cookie is set by showing the banner), code-standard rule 17 (`hidden` beats the stylesheet), code-standard rule 14 (focus moved to the confirmation without scrolling away), code-standard rule 2 (DOM order puts the banner before the skip link, as it reads).
- *Detail:* [code: hidden content](../../code/accessibility.md#hidden-content), [code: third-party scripts and Subresource Integrity](../../code/security.md#third-party-scripts-and-subresource-integrity), [code: progressive enhancement](../../code/javascript.md#progressive-enhancement).

**Check**
- *Script:* could load the page with no stored choice and assert no non-essential cookie or third-party request before acceptance; that Accept and Reject compute the same size and style; that the banner is not `position: fixed` or `sticky`; that rejecting sets no non-essential cookie.
- *Judgement:* Would a person who wants to reject find it as quickly as one who wants to accept?

**Sources:** GOV.UK, Friedman and NN/g as linked. GOV.UK shows both buttons alike without stating equal weight as a rule; Friedman and NN/g state it, and the toolkit follows them.

## Cookies page

**Use when / don't use**
- Use on every product that sets cookies, essential or not, linked from the footer and from the banner's "View cookies" and confirmation ([GOV.UK cookies page](https://design-system.service.gov.uk/patterns/cookies-page/)).
- Don't bury it in terms and conditions (GOV.UK, same page).

**How**
- **One section per category** (essential, functional, analytics), each cookie listed with its name, purpose, who sets it and when it expires, in short scannable rows (GOV.UK; [NN/g, Tankala 2023](https://www.nngroup.com/articles/cookie-permissions/)).
- **A Yes/No choice per non-essential category,** "No" selected on a first visit and the saved choice shown on return; a "Save cookie settings" button (GOV.UK).
- **Say what turning a category off changes** for the person (Friedman 2019, as above).
- **After saving,** a success banner confirms and links back to the page the person came from (GOV.UK).
- **Consent can be withdrawn without an account** (Friedman 2019).

**Cases**
- A cookies page lists 80 trackers each needing its own opt-out → one choice per category, with "reject all" in one action.
- The page shows "Yes" selected for analytics on a first visit → "No" until the person chooses.
- After saving, the person is left on the cookies page with no way back → a confirmation with a link to where they were.

**Accessibility**
- 1.3.1 (each category's choice a `fieldset` with a `legend`), 3.3.2, 4.1.3 (the confirmation), 2.4.6.

**Build**
- *Elements:* a `form method="post"`; each category a `fieldset` with a `legend` and two native radios; a `button type="submit"`; cookie tables as `table` with `caption` and header cells.
- *ARIA and keyboard:* native radios carry [APG radio group](https://www.w3.org/WAI/ARIA/apg/patterns/radio/)'s arrow keys.
- *States:* `checked` from the stored choice, rendered on the server; the confirmation is the success banner, shown on the redirect after the POST.
- *Rules:* code-standard rule 20 (the form saves without script), code-standard rule 1, code-standard rule 12 (the confirmation renders only after a save).
- *Detail:* [code: forms markup](../../code/html-semantics.md#forms-markup), [code: tables for data](../../code/html-semantics.md#tables-for-data).

**Check**
- *Script:* could check each non-essential category has a radio set defaulting to No with no stored choice, the footer links to the page, and saving "No" removes the category's cookies.
- *Judgement:* Does each description say what the cookie does in words the reader understands?

**Sources:** GOV.UK, NN/g and Friedman as linked.

## Permission requests

**Use when / don't use**
- Use a browser permission (notifications, location, camera, microphone, clipboard) only when a feature the person has chosen needs it, at the moment they choose it ([NN/g, Rosala 2019](https://www.nngroup.com/articles/permission-requests/); [Smashing, Friedman 2019](https://www.smashingmagazine.com/2019/04/privacy-better-notifications-ux-permission-requests/)).
- Don't prompt on page load: a browser's block is close to permanent, and an early refusal is hard to undo (Friedman 2019).
- Don't disguise a request as information or make declining hard (NN/g 2019).

**How**
- **Explain first, in the page:** a short in-page message says what the permission is for and what the person gets, with a button that triggers the browser's own prompt only when pressed (Friedman's "double request"; NN/g's explanation before the system dialog).
- **Plain purpose:** "Allow location to find the nearest office", not "to improve your experience" (NN/g 2019).
- **Check before asking:** if permission is already granted or denied, don't ask; the Permissions API reports `granted`, `denied` or `prompt` without prompting ([MDN Permissions API](https://developer.mozilla.org/en-US/docs/Web/API/Permissions_API)).
- **After a refusal,** the feature explains why it is unavailable and how to turn the permission on in the browser, rather than showing an error (NN/g 2019; Friedman 2019); a site cannot revoke or re-grant a permission itself (MDN).
- **Value first:** ask for non-essential permissions only after the person has had some use of the product (NN/g 2019).

**Cases**
- A docs site asks to send notifications on first visit → remove it; offer "Notify me of releases" on the changelog page, which explains and then asks.
- A map feature shows "Error" after location was denied → say location is off, how to enable it, and offer a search box instead.
- The product asks again on every visit after a refusal → query the state first; don't ask when it is `denied`.

**Accessibility**
- 3.2.5 Change on Request (AAA, worth meeting: no prompt appears without the person's action), 3.3.2 (the purpose stated before the prompt), 4.1.3 (a refusal's explanation announced if it appears in place).

**Build**
- *Elements:* an in-page explanation with a `button type="button"` that calls the feature's API (`Notification.requestPermission()`, `navigator.geolocation.getCurrentPosition()`), which is what raises the browser prompt ([MDN Permissions API](https://developer.mozilla.org/en-US/docs/Web/API/Permissions_API)).
- *ARIA and keyboard:* native buttons carry it; the explanation is in the flow, not a modal.
- *States:* `navigator.permissions.query()` decides which message renders; a `change` listener on the status updates it if the person changes the setting in the browser.
- *Rules:* code-standard rule 12 (the request renders only when the state is `prompt`), code-standard rule 61 (a denied permission says why the feature is off and what to do), code-standard rule 20 (the feature has a path without the permission where one exists).
- *Detail:* [code: progressive enhancement](../../code/javascript.md#progressive-enhancement), [code: errors and an envelope's success flag](../../code/javascript.md#errors-and-an-envelopes-success-flag).

**Check**
- *Script:* could load each page and assert no permission prompt is raised without a click; could stub each permission state and assert the matching message.
- *Judgement:* Is the moment of asking the moment the person wants the feature?

**Sources:** NN/g, Friedman and MDN as linked. NN/g writes about mobile apps; its timing and explanation advice applies to browser prompts, which Friedman's article addresses directly.

## Privacy and data settings

**Use when / don't use**
- Use a privacy section in settings, or the cookies page for products without accounts, wherever the product collects anything optional; consent given in a banner or prompt must be changeable later in a place people expect ([Smashing, Friedman 2019](https://www.smashingmagazine.com/2019/04/privacy-ux-better-cookie-consent-experiences/): header, footer or the privacy policy).
- Don't make withdrawing harder than giving: one action per choice, as at the start.

**How**
- **One place lists every optional collection** with its current state: cookie categories, notifications, emails, data shared with third parties.
- **Each choice says what changes** if it is turned off (Friedman 2019).
- **Withdrawal takes effect at once** and is confirmed; turning off analytics stops the analytics now, not at the next visit.
- **No penalty for refusing:** a refusal does not degrade the product or block access beyond what the feature needs (Friedman 2019).
- **Export and delete** where the product holds personal data: say what will be exported or deleted and confirm before deleting ([Primer saving](https://primer.style/product/ui-patterns/saving/) on confirming destructive submissions).

**Cases**
- A person who accepted analytics cannot find where to change it → a "Cookie settings" link in the footer and a privacy section in settings.
- Turning notifications off in the product leaves the browser permission granted and messages still arriving → stop sending, and say the browser permission can also be removed in the browser.
- Rejecting tracking hides half the product behind "Enable cookies to continue" → only the features that need the cookie are affected.

**Accessibility**
- 3.3.4 Error Prevention (deletion confirmed or reversible), 4.1.3 (confirmation of a change), 1.3.1 (each choice labelled and grouped).

**Build**
- *Elements:* the same `form` and native controls as [settings](settings.md#saving-settings); deletion a `button` opening a confirmation `dialog`.
- *ARIA and keyboard:* native controls carry it; the confirmation per [APG alert dialog](https://www.w3.org/WAI/ARIA/apg/patterns/alertdialog/).
- *States:* each control's `checked` reflects the stored consent, rendered on the server.
- *Rules:* code-standard rule 20, code-standard rule 14, code-standard rule 61.
- *Detail:* [code: forms markup](../../code/html-semantics.md#forms-markup), [code: disclosure, dialogs and popovers](../../code/html-semantics.md#disclosure-dialogs-and-popovers).

**Check**
- *Script:* could withdraw each consent and assert the related cookies, requests or messages stop in the same session.
- *Judgement:* Is changing your mind as easy as saying yes was?

**Sources:** Friedman and Primer as linked.
