# Authentication: signing in, passwords, second factors, recovery, sessions and switching accounts

How a person proves who they are and keeps the session they opened: the sign-in form, creating a password, second factors and passkeys, getting back in when a credential is lost, what happens when a session runs out, and moving between accounts. It serves the principles *for everyone, in any context* (a sign-in is where a memory test locks people out), *people in control, mistakes forgiven* (nothing typed is lost to a timeout) and *honest* (the form says what it needs before it refuses). No design-standard rule is admitted for authentication yet. Field structure, labels and errors are [forms](forms.md)'s; authentication as an accessibility decision is [accessibility: accessible authentication](../design/accessibility.md#accessible-authentication) and time limits are [accessibility: time limits](../design/accessibility.md#time-limits); the server side of a form (tokens, request forgery) is [code: forms and cross-site request forgery](../../code/security.md#forms-and-cross-site-request-forgery).

## Sign-in form

**Use when / don't use**
- Use one page with the identifier and the password together, for every product that signs people in with a password. Friedman's critique of the two-page login is that it exists to route single sign-on users and costs everyone else: people forget which address they used, and splitting the fields breaks autofill and password managers ([Smashing, Friedman 2024](https://www.smashingmagazine.com/2024/06/2-page-login-pattern-how-fix-it/)).
- Use the email address as the identifier where possible; it is memorable, unique and usually collected anyway ([GOV.UK create a username](https://design-system.service.gov.uk/patterns/create-a-username/)).
- Don't ask for an account at all before checking that people need one (GOV.UK, same page).
- Don't use a magic link as the everyday way in; Friedman keeps it for recovery, since it sends the person to their inbox and fails when the email does not arrive ([Smashing, Friedman 2024](https://www.smashingmagazine.com/2024/06/2-page-login-pattern-how-fix-it/)).

**How**
- **Single sign-on without a second page.** Show both fields; when the address entered belongs to a single sign-on domain, reveal the single sign-on button and make it the default; if the password cannot be used for that account, disable the password field rather than removing it ([Smashing, Friedman 2024](https://www.smashingmagazine.com/2024/06/2-page-login-pattern-how-fix-it/)).
- **Paste and autofill always work.** Never block paste in either field ([GOV.UK passwords](https://design-system.service.gov.uk/patterns/passwords/); [Smashing, Friedman 2022](https://www.smashingmagazine.com/2022/08/authentication-ux-design-guidelines/)).
- **Show password.** Offer a toggle beside the field; masking makes people err more and pick simpler passwords, for little security in most settings ([NN/g, Nielsen 2009](https://www.nngroup.com/articles/stop-password-masking/)).
- **A failed attempt** says the address or password is wrong without saying which, and does not keep the password typed ([GOV.UK passwords](https://design-system.service.gov.uk/patterns/passwords/)); the address stays.
- **Lockout** after five to ten attempts, not three (GOV.UK, same page), with the way back named in the message.
- **"Keep me signed in"** as an opt-in on low-risk products, so people are not signed out more often than the risk needs ([Smashing, Friedman 2022](https://www.smashingmagazine.com/2022/08/authentication-ux-design-guidelines/)).
- The "Forgot your password?" link sits by the password field, before the submit button in reading order.

**Cases**
- An enterprise tool asks for the email on one page and the password on the next, so password managers fill nothing → one page; reveal the single sign-on option when the domain calls for it.
- A form blocks paste "for security" → remove the block; it fails people who paste from a password manager and buys no security.
- The error reads "No account with that email" → "Email address or password is incorrect"; naming which half is wrong tells an attacker the account exists.
- After a failed attempt both fields are cleared → keep the address, clear only the password.
- The password field's eye icon has no name → name it ("Show password") and expose its state.

**Accessibility**
- 3.3.8 Accessible Authentication (Minimum): no memory or transcription test without a way round it; paste and autofill are the way round for a password ([W3C Understanding 3.3.8](https://www.w3.org/WAI/WCAG22/Understanding/accessible-authentication-minimum.html)). 1.3.5 Identify Input Purpose, 3.3.1 Error Identification, 3.3.2 Labels or Instructions, 4.1.2 for the show-password toggle.
- Figma: figma-standard rule 26 (the toggle's target), figma-standard rule 31 (error and focus states draw differently), figma-standard rule 32.

**Build**
- *Elements:* a real `form method="post"`; `input type="email"` (or `text`) with `autocomplete="username"`, adding `webauthn` as the last token where passkeys are offered; `input type="password"` with `autocomplete="current-password"` ([MDN autocomplete](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/autocomplete)); a `button type="submit"`; the show-password control a `button type="button"`.
- *ARIA and keyboard:* native controls carry it. The show-password button is a toggle: `aria-pressed` with a fixed name, or a name that changes with the state, never both. Enter in either field submits.
- *States:* the toggle's `aria-pressed`; the password input's `type` switches between `password` and `text`; a field in error carries `aria-invalid="true"` and `aria-describedby` to its message; the disabled password field for a single sign-on account keeps the native `disabled`.
- *Rules:* code-standard rule 20 (a real POST form that signs in without script), code-standard rule 18 (the icon-only toggle has a name), code-standard rule 15 (the hint and the error are descriptions, not the label), code-standard rule 9 and code-standard rule 62 (disabled is the control's own attribute), code-standard rule 61 (a failure reports the reason it knows, within what security allows).
- *Detail:* [code: forms markup](../../code/html-semantics.md#forms-markup), [code: form errors and validation](../../code/html-semantics.md#form-errors-and-validation), [code: forms and cross-site request forgery](../../code/security.md#forms-and-cross-site-request-forgery).

**Check**
- *Script:* could check that the sign-in page has both fields in one form, with `autocomplete` tokens `username` and `current-password`; that no `paste` listener calls `preventDefault`; that the toggle has a name and a state; that the error text names neither field alone.
- *Judgement:* Does the product need accounts, and is single sign-on routed without costing everyone else a page?

**Sources:** Friedman, GOV.UK, NN/g, MDN and W3C as linked. NN/g's 2009 article argues for showing passwords by default; the toolkit masks by default with a visible toggle, which is what WCAG's understanding document and GOV.UK practice assume.

## Passwords and creating an account

**Use when / don't use**
- Use when a product sets its own passwords. Where a stronger product is needed, add a second factor rather than stricter password rules ([GOV.UK passwords](https://design-system.service.gov.uk/patterns/passwords/)).
- Don't force periodic password changes; require one only when an account may be compromised (GOV.UK, same page).
- Don't use security questions; answers are easy to find and hard to remember ([Smashing, Friedman 2022](https://www.smashingmagazine.com/2022/08/authentication-ux-design-guidelines/)).

**How**
- **Rules up front.** State the requirements before the person types, and keep them visible while the field has focus; hidden rules make creating a password a guessing game ([NN/g, Sherwin 2015](https://www.nngroup.com/articles/password-creation/)).
- **Length over composition.** At least eight characters, no maximum, and refuse commonly used passwords ([GOV.UK passwords](https://design-system.service.gov.uk/patterns/passwords/)); Friedman's advice is the same in spirit: friendly rules, because strict ones get bent and then forgotten ([Smashing, Friedman 2022](https://www.smashingmagazine.com/2022/08/authentication-ux-design-guidelines/)).
- **One set of rules everywhere** a password is created or entered (GOV.UK).
- **Let the browser generate one:** `autocomplete="new-password"` invites the browser or password manager to suggest a strong password (Friedman 2022; MDN).
- **Strength meter** as encouragement beside the rules, not instead of them ([NN/g, Sherwin 2015](https://www.nngroup.com/articles/password-creation/)).
- **Show password** here too; with it, a second "confirm password" field is not needed.
- **Confirm the email address** by a link or code that expires, with a resend and a way to correct the address ([GOV.UK confirm an email address](https://design-system.service.gov.uk/patterns/confirm-an-email-address/)).

**Cases**
- The rules appear only after a failed submit → show them under the label from the start.
- A form demands an upper-case letter, a digit and a symbol, with a 16-character maximum → minimum eight, no maximum, refuse common passwords; the composition rules produce "Password1!".
- A sign-up asks for the password twice → one field with a show toggle.
- A confirmation link has no expiry and cannot be resent → expire it after one use or a set time, and offer resend to the same or a corrected address.

**Accessibility**
- 3.3.2 Labels or Instructions (the rules are instructions, given before input), 1.3.5 (`new-password`), 3.3.1 and 3.3.3 Error Suggestion (an error names the rule unmet), 1.4.1 (the strength meter is not colour alone), 4.1.3 Status Messages (a live rule list is announced politely, not on every keystroke). 3.3.8 covers signing in, not creating an account, but a toggle helps people type a new password ([W3C Understanding 3.3.8](https://www.w3.org/WAI/WCAG22/Understanding/accessible-authentication-minimum.html)).

**Build**
- *Elements:* `input type="password" autocomplete="new-password"`; the rules in a `p` or `ul` referenced by `aria-describedby`; the meter a `meter` element or text, with its level in words.
- *ARIA and keyboard:* native controls carry it. A rule list updated as the person types sits in a polite live region that changes its contents, never the element.
- *States:* `aria-invalid="true"` on submit failure only; met rules marked in text ("met"), not only by a tick's colour.
- *Rules:* code-standard rule 15 (the rules are a description), code-standard rule 20, code-standard rule 14 (a live update keeps focus in the field).
- *Detail:* [code: forms markup](../../code/html-semantics.md#forms-markup), [code: live regions and status messages](../../code/accessibility.md#live-regions-and-status-messages).

**Check**
- *Script:* could check that a creation field carries `new-password`, has a description holding the rules, sets no `maxlength` below 64, and that no second password field exists beside a show toggle.
- *Judgement:* Is every rule there for a threat this product faces, or is a second factor the better answer?

**Sources:** GOV.UK, NN/g, Friedman and MDN as linked; they agree on length over composition and on rules shown up front.

## Two-factor, one-time codes and passkeys

**Use when / don't use**
- Use a second factor on any product holding data people would mind losing; any second factor beats a password alone, and Friedman suggests encouraging it rather than forcing it on low-risk products ([Smashing, Friedman 2022](https://www.smashingmagazine.com/2022/08/authentication-ux-design-guidelines/)).
- Use passkeys where the platform supports them: credentials bound to the site's origin cannot be used on a look-alike site ([MDN Web Authentication API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API)), and they ask nothing of memory.
- Prefer an authenticator app to SMS where the risk is high; SMS codes are exposed to SIM-swap fraud (Friedman 2022).
- Don't use a puzzle, a calculation or a personal-knowledge question as a factor without a way round it ([W3C Understanding 3.3.8](https://www.w3.org/WAI/WCAG22/Understanding/accessible-authentication-minimum.html)).

**How**
- **Offer a choice of second factors** (app, security key, SMS, backup codes); a choice lets each person pick one they can use (W3C, same page).
- **One code field, not one box per digit.** A split field that refuses a pasted code fails 3.3.8 (W3C, same page). Mark it `autocomplete="one-time-code"` so the platform can fill a code from SMS or email ([MDN autocomplete](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/autocomplete)); `inputmode="numeric"` for a numeric code.
- **Say where the code went** ("sent to the phone ending 42"), how long it lasts, and offer resend after a short wait.
- **Passkeys in the username field:** with `autocomplete="username webauthn"` and a conditional request, the browser offers a passkey beside saved passwords as the person focuses the field, with no extra "sign in with passkey" step ([MDN Web Authentication API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API)).
- **Backup codes** at set-up, with a way to download or copy them, so losing the device is not losing the account.

**Cases**
- A code entry is six one-digit boxes that ignore paste → one field accepting paste and autofill.
- The only second factor is SMS → add an authenticator app and backup codes; keep SMS as one choice.
- The passkey button sits on its own page after the email page → offer passkeys through the username field's autofill on the sign-in page.
- A code expires in 60 seconds with no resend → give a few minutes and a resend link; say the expiry in the message.

**Accessibility**
- 3.3.8 Accessible Authentication (Minimum) for every step: a code can be pasted, a passkey asks for no recall ([W3C Understanding 3.3.8](https://www.w3.org/WAI/WCAG22/Understanding/accessible-authentication-minimum.html)). 2.2.1 Timing Adjustable for a code's lifetime where it is a time limit set by the content. 1.3.5, 3.3.1.

**Build**
- *Elements:* `input autocomplete="one-time-code" inputmode="numeric"` (type `text`, so leading zeros survive); the username field `autocomplete="username webauthn"`, `webauthn` last; the passkey request through `navigator.credentials.get()` with `mediation: "conditional"` after checking `PublicKeyCredential.isConditionalMediationAvailable()` ([MDN Web Authentication API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API)).
- *ARIA and keyboard:* native controls carry it; the choice of factor is a radio group in a `fieldset` (native radios carry [APG radio group](https://www.w3.org/WAI/ARIA/apg/patterns/radio/)'s arrow keys).
- *States:* `aria-invalid` and a described error on a wrong code; the resend button keeps the native `disabled` during its wait, with the wait in text beside it.
- *Rules:* code-standard rule 20 (the code form posts without script; passkeys are an enhancement over it), code-standard rule 15, code-standard rule 61 (an expired code and a wrong code say different things).
- *Detail:* [code: forms markup](../../code/html-semantics.md#forms-markup), [code: progressive enhancement](../../code/javascript.md#progressive-enhancement).

**Check**
- *Script:* could check that a code field is one `input` with `one-time-code`, that no `paste` handler prevents default, and that the username field's `autocomplete` ends in `webauthn` where passkeys are offered.
- *Judgement:* Can a person who loses their phone still get in, and how?

**Sources:** Friedman, MDN and W3C as linked. Friedman's 2022 article predates passkeys and does not cover them; their guidance here rests on MDN and W3C.

## Password reset and account recovery

**Use when / don't use**
- Use on every product with a password: people forget, and the recovery path is part of signing in.
- Plan a recovery stack of several routes (a link to the primary or secondary email, an app prompt, backup codes, support), since getting back in fast is what people want ([Smashing, Friedman 2022](https://www.smashingmagazine.com/2022/08/authentication-ux-design-guidelines/)).
- Don't email a password, temporary or otherwise, and don't use reset questions or reminders ([GOV.UK passwords](https://design-system.service.gov.uk/patterns/passwords/)).

**How**
- **Ask for the address, then say the same thing whatever happens:** "If an account exists for that address, we have sent a link". A different message for an unknown address tells anyone which addresses have accounts.
- **Send a time-limited link or code** to the registered address or phone ([GOV.UK passwords](https://design-system.service.gov.uk/patterns/passwords/)); it works once and is replaced by a newer one ([GOV.UK confirm an email address](https://design-system.service.gov.uk/patterns/confirm-an-email-address/)).
- **An expired link explains itself** and offers a new one in place.
- **Tell the account holder** by email whenever a password is reset, in case it was not them (GOV.UK passwords).
- **After a reset,** sign the person in or send them to sign in with the address filled; don't make them type it again.

**Cases**
- "No account found for jo@example.com" → the neutral message, whether or not it exists.
- The reset email holds a new password in plain text → send a link that expires.
- An expired link lands on a bare error page → say it has expired, why, and offer to send another.
- The only recovery route is the email the person no longer has → add backup codes or an alternate address at set-up.

**Accessibility**
- 3.3.8 for the recovery path as much as sign-in: a link or a pasted code, never a recall test. 3.3.1, 4.1.3 (the "sent" message announced as status), 2.4.2 Page Titled (each step titled).

**Build**
- *Elements:* a POST form with `input type="email" autocomplete="username"`; the new-password page uses `autocomplete="new-password"` (MDN as above).
- *ARIA and keyboard:* native controls carry it; the confirmation is a page or a status message, never a toast that vanishes.
- *States:* `aria-invalid` only for a malformed address; an unknown address is not an error state.
- *Rules:* code-standard rule 20, code-standard rule 61 (the expired-link page says why it failed), code-standard rule 15.
- *Detail:* [code: forms and cross-site request forgery](../../code/security.md#forms-and-cross-site-request-forgery), [code: form errors and validation](../../code/html-semantics.md#form-errors-and-validation).

**Check**
- *Script:* could submit a known and an unknown address and assert the responses read the same; could check reset links expire after use.
- *Judgement:* How does someone who has lost every factor get back in, and is that route safe?

**Sources:** Friedman and GOV.UK as linked. The neutral wording follows GOV.UK's rule not to reveal whether the username or password was wrong, applied to the reset step.

## Session timeouts and signing out

**Use when / don't use**
- Use a timeout only as long as the risk needs; Friedman warns against aggressive sign-outs on simple products ([Smashing, Friedman 2022](https://www.smashingmagazine.com/2022/08/authentication-ux-design-guidelines/)).
- Any time limit the content sets must be switchable off, adjustable, or extendable with a warning of at least 20 seconds, unless it is essential, real-time or longer than 20 hours ([W3C Understanding 2.2.1](https://www.w3.org/WAI/WCAG22/Understanding/timing-adjustable.html)).
- Signing out is an account action, never a navigation destination.

**How**
- **Warn before expiry** in a modal dialog that says how long is left and offers "Stay signed in" as the default action; extending is one action (W3C 2.2.1).
- **Keep what was typed.** A form whose session lapsed keeps its data, signs the person back in and resubmits or restores it ([design: accessibility: time limits](../design/accessibility.md#time-limits)).
- **After expiry,** say the session ended and why, with sign-in on the same page and a return to where the person was.
- **Sign out** sits in the account menu or the header's end, labelled "Sign out"; GOV.UK's service navigation puts account links in its end slot ([GOV.UK service navigation](https://design-system.service.gov.uk/components/service-navigation/)). After signing out, a page confirms it.

**Cases**
- A 15-minute timeout discards a half-written report → warn at two minutes, extend on one click, keep the draft if it lapses.
- The warning is a banner at the top the person cannot see while typing lower down → a modal dialog that takes focus.
- After a timeout the person lands on the home page → sign them in and return them to the page and state they left.
- "Log off" in the nav between "Reports" and "Settings" → move it to the account menu.

**Accessibility**
- 2.2.1 Timing Adjustable ([W3C](https://www.w3.org/WAI/WCAG22/Understanding/timing-adjustable.html)), 2.2.5 Re-authenticating (AAA, worth meeting: data survives re-authentication), 2.2.6 Timeouts (AAA: say how long inactivity lasts before data is lost), 2.4.3 (focus into the warning and back).

**Build**
- *Elements:* the warning a `dialog` opened with `showModal()`; the remaining time as text, updated each minute rather than each second.
- *ARIA and keyboard:* [APG alert dialog](https://www.w3.org/WAI/ARIA/apg/patterns/alertdialog/): `role="alertdialog"`, named by its heading and described by the message; focus moves to "Stay signed in", Tab stays inside, and on close focus returns to where it was ([APG dialog (modal)](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)). Escape counts as "stay", never as "sign out".
- *States:* the dialog's `open`; the form's draft held in storage the page writes on input, not on render.
- *Rules:* code-standard rule 14 (focus restored after the dialog), code-standard rule 20 (a render never writes; saving the draft is an action), code-standard rule 61 (the expiry page says why the session ended).
- *Detail:* [code: disclosure, dialogs and popovers](../../code/html-semantics.md#disclosure-dialogs-and-popovers), [code: focus management](../../code/accessibility.md#focus-management).

**Check**
- *Script:* could shorten the timeout in a test build and assert a dialog appears at least 20 seconds before expiry, takes focus, extends on one action, and that a form's input survives expiry.
- *Judgement:* Does this product's risk justify the timeout's length?

**Sources:** W3C, Friedman and GOV.UK as linked.

## Switching accounts

**Use when / don't use**
- Use when people hold separate identities in one product: personal and work, or a personal and a service account; GitHub supports switching for exactly these ([GitHub switching between accounts](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/switching-between-accounts)).
- Don't use it where workspaces would do: one person in several teams needs one account and a [workspace switcher](sidebars.md#workspace-switcher). Linear recommends separate accounts only for separate emails ([Linear workspaces](https://linear.app/docs/workspaces)).

**How**
- **From the account menu:** "Switch account" lists the signed-in accounts and "Add account" ([menus: account menu](menus.md#account-menu)); Google ([Google](https://support.google.com/accounts/answer/1721977)) and GitHub do this.
- **Tell accounts apart by avatar, name and email,** with the active one marked; the email is what differs when two accounts share a name.
- **Know where an account applies.** Google falls back to a default account, "usually the one you signed in with first", which leaves people acting as the wrong one; AWS opens each identity "in a new tab" with the account in the address ([AWS multi-session](https://docs.aws.amazon.com/en_us/awsconsolehelpdocs/latest/gsg/multisession.html)). An account in the address is the safer of the two.
- **Sign-out says its scope:** "Sign out" of this account and "Sign out of all accounts" as two labelled actions, as Google and GitHub offer. Products differ on which is the default (Figma's log out "signs out only the currently selected account", [Figma](https://help.figma.com/hc/en-us/articles/360041064554-Log-in-or-add-accounts)); the label settles it.
- **An expired account stays in the list,** marked as signed out, with sign-in one click away; GitHub hides "Switch account" when sessions expire, which strands people.

**Cases**
- Two accounts show the same initial avatar → name and email on each row.
- A purchase goes through on the default account, not the one the person was looking at → the account in the address, or a confirmation naming the account.
- "Sign out" quietly signs out of every account → two labelled actions.
- "Add account" opens a new tab without saying so → say so in the label.

**Accessibility**
- 1.1.1 (avatars are named), 3.2.2 (a new tab is announced in the label, [W3C Understanding 3.2.2](https://www.w3.org/WAI/WCAG22/Understanding/on-input.html)), 4.1.2, 2.4.7.

**Build**
- *Elements:* each account a row with avatar, name and email; "Add account", "Sign out" and "Sign out of all accounts" after a separator.
- *ARIA and keyboard:* inside the account menu ([APG menu button](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/)), accounts are `menuitemradio` with the active one `aria-checked="true"`.
- *States:* `aria-checked` on the active account; a signed-out account marked in text, not only greyed.
- *Rules:* code-standard rule 18, code-standard rule 20 (the active account is read from the address or session, never written during render).
- *Detail:* [code: state in the address and history](../../code/javascript.md#state-in-the-address-and-history).

**Check**
- *Script:* could sign in two test accounts and assert both are listed with distinct email text, the active one is checked, and each sign-out action ends only what its label says.
- *Judgement:* Could someone act as the wrong account without noticing?

**Sources:** GitHub, Google, AWS, Figma and Linear as linked. Products disagree on per-tab versus global accounts and on the default sign-out scope; the toolkit asks for the account to be visible and the scope to be labelled.
