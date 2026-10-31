# File upload

How a person gives the interface a file: which control to offer, how the file input is labelled and what it says before anyone picks a file, the drop zone and why it is never the only way in, progress and errors for each file, and the list of files once added. It serves the principles *serve a real need* (ask for a file only when nothing else will do), *show state and give feedback* (every file says where it is), *people in control, mistakes forgiven* (a wrong file is removed or replaced in one step) and *for everyone, in any context* (dragging is an extra, never the path). No design-standard rule is admitted for uploads yet. The form around the control is `forms.md`'s; dragging to reorder or move items is [interaction: gestures and drag](../design/interaction.md#gestures-and-drag); spinners and loading states in general are [feedback: loading](feedback.md#loading).

## Choosing the upload control

**Use when / don't use**
- Ask for a file only when the task cannot be done without it: GOV.UK says to ask for an upload only if it is "critical to the delivery of your service" ([GOV.UK file upload](https://design-system.service.gov.uk/components/file-upload/)). A typed answer, a choice or a lookup beats a document where one carries the same fact.
- **A single file input** for one file in a form (an avatar, one CSV to import).
- **A file input with `multiple`** when the task takes several files of one kind at once (screenshots for a report).
- **A drop zone** around the input where people often have the files open beside the browser (importing assets, attaching evidence in a tool); it enlarges the target and accepts a drag, and still contains the button ([Carbon file uploader](https://carbondesignsystem.com/components/file-uploader/usage/) offers both the button and the drag-and-drop variant).
- Don't put a multi-file uploader in a modal; Carbon advises against it, since the list grows past what a dialog holds.

**How**
- Decide the limits before drawing anything: which types, the largest size, how many files, and whether a file can be reused from earlier in the same journey (GOV.UK lets people pick a file they uploaded earlier instead of uploading it again, with care on shared devices).
- Choose single or multiple by the task, not by what the component can do: a single-file field that people fill five times is a multiple field.
- One upload control per thing asked for; two kinds of document are two labelled questions, not one mixed list.

**Cases**
- A sign-up form asks for a scan of an ID "to verify" when an ID number would do → ask for the number; drop the upload unless the service truly needs the image.
- A tool imports one tokens file at a time, and people do it daily from their file manager → a drop zone holding the button.
- A support form needs "screenshots (optional)" → one input with `multiple`, a stated limit, and the list of added files under it.
- A designer places a five-file uploader inside a small dialog → move it to the page; Carbon's advice, and the list would scroll inside the dialog.

**Accessibility**
- 2.1.1 Keyboard (the control is reachable and operable without a pointer), 2.5.7 Dragging Movements (a single-pointer path exists: the button), 3.3.2 Labels or Instructions (limits stated up front), 1.3.1 (the input is labelled as a question).
- Figma: figma-standard rule 26 (the button and the remove controls meet the target size), figma-standard rule 31 (rest, hover, focus, drag-over and error each draw differently).

**Build**
- *Elements:* a native `input type="file"` with a `label`, inside a real `form` with `enctype="multipart/form-data"`; `multiple` when the task allows several files; `accept` listing the types. The drop zone is an enhancement around the input, never a replacement for it.
- *ARIA and keyboard:* no WAI-ARIA APG pattern covers upload ([APG patterns](https://www.w3.org/WAI/ARIA/apg/patterns/)); the native input carries the role, name and keyboard (Space or Enter opens the file dialog).
- *States:* `aria-describedby` on the input pointing to the limits hint and, when there is one, the error; `aria-invalid="true"` on error; `required` per the form's own convention.
- *Rules:* code-standard rule 20 (the form posts and the upload works without script), code-standard rule 15 (the limits are a description, not part of the label), code-standard rule 1 (markup stands on its own).
- *Detail:* [code: forms markup](../../code/html-semantics.md#forms-markup); [code: progressive enhancement](../../code/javascript.md#progressive-enhancement).

**Check**
- *Script:* could check that every `input[type=file]` has a label, sits in a form with `enctype="multipart/form-data"`, has a description naming its limits, and that a drop zone always contains a focusable file input or button.
- *Judgement:* Is the file needed at all, and is single or multiple chosen by what people actually do?

**Sources:** GOV.UK and Carbon as linked. Carbon treats the drag-and-drop variant as one of two equal choices; the toolkit uses the plain input by default and adds the drop zone only where people drag files from their desktop as a matter of course.

## The file input and its label

**Use when / don't use**
- Every upload, as the base the other sections build on.
- Don't hide the input with `display: none` or `visibility: hidden` and rebuild it from a `div`: assistive technology then treats it as not interactive ([MDN input type="file"](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/file)).

**How**
- **Label as the question** ("Upload your bank statement"), with the limits as a hint under it, before anyone picks a file: types, the largest size, how many files. Carbon puts the same facts in the uploader's description so people know the limits before they try ([Carbon](https://carbondesignsystem.com/components/file-uploader/usage/)).
- **`accept` is a hint, not a check.** It steers the file dialog towards the right types, and people can switch it off in most dialogs, so every limit is enforced again on the server ([MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/file)).
- **Name the selection.** After a pick, show the file's name (and the count, for several), not only the browser's own "1 file chosen".
- **Button text short.** GOV.UK keeps the button and "No file chosen" text brief because long text is harder for screen reader users ([GOV.UK file upload](https://design-system.service.gov.uk/components/file-upload/)).
- **Restyling.** Where the native button cannot be themed, MDN's approach keeps the input in place, transparent by `opacity`, with its `label` styled as the button; the input still takes focus and its focus shows on the label.
- **Camera on phones.** `capture` suggests a camera for image or video types; leave it off unless a fresh photo is the only useful answer ([MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/file)).

**Cases**
- The hint "Max 10 MB, PDF or JPG" appears only in the error after a failed upload → move it under the label, before the pick.
- A team relies on `accept=".csv"` and skips server validation → validate on the server; MDN says `accept` can be overridden.
- The custom "Browse" button is a `div` with a click handler and the real input is `display: none` → keep the input focusable (`opacity`, as MDN shows) behind a `label`; the `div` has no role and no keyboard.
- A receipt upload on a phone forces `capture="environment"` → remove it; people often already have the photo in their library.

**Accessibility**
- 1.3.1 and 4.1.2 (the input's name comes from its label), 3.3.2 (limits stated before input), 2.4.7 Focus Visible (focus shows on the visible button, even when the native input is transparent), 3.3.1 Error Identification.

**Build**
- *Elements:* `label for` + `input type="file" id name accept`, a hint element, and an error element per the form's error pattern.
- *ARIA and keyboard:* native; no ARIA role is added to the input or its label.
- *States:* `aria-describedby="hint error"`, `aria-invalid="true"` on error; the visible focus ring drawn on the label with `:focus-visible` on the input (`input:focus-visible + label`).
- *Rules:* code-standard rule 15 (hint and error are descriptions), code-standard rule 18 (an icon in the button is decorative and `aria-hidden`), code-standard rule 20.
- *Detail:* [code: forms markup](../../code/html-semantics.md#forms-markup); [code: form errors and validation](../../code/html-semantics.md#form-errors-and-validation); [code: accessible names and descriptions](../../code/accessibility.md#accessible-names-and-descriptions).

**Check**
- *Script:* could check that no `input[type=file]` computes to `display: none` or `visibility: hidden`, that its label exists and is visible, that a hint is associated, and that tabbing to it shows a focus indicator.
- *Judgement:* Does the hint say every limit the server enforces, in the words the person uses ("10 MB", not "10485760 bytes")?

**Sources:** MDN, GOV.UK and Carbon as linked.

## Drop zones

**Use when / don't use**
- Use around the file input where dragging from the desktop is common and the page has room for a visible target.
- Never the only path: the zone holds the button or a link that opens the file dialog (Carbon's drag-and-drop variant puts a clickable link inside the zone; [Carbon](https://carbondesignsystem.com/components/file-uploader/usage/)).
- Don't make the whole page a hidden drop target with no visible zone; people cannot aim at what they cannot see.
- On touch screens dragging files is rare; the zone shows as the button and its hint.

**How**
- **Always visible.** GOV.UK's improved file upload made the drop zone bigger, visible at all times, and clearer in how it responds ([GOV.UK file upload](https://design-system.service.gov.uk/components/file-upload/)); its earlier version had no visible target, which is why it changed.
- **Draw every state.** Friedman lists the states a drop area passes through, from empty to ready-to-receive to filled and disabled, and asks that each be designed, with a dashed border as the common signal of a drop area ([Friedman, Drag-and-Drop UX](https://smart-interface-design-patterns.com/articles/drag-and-drop-ux/)).
- **Say what happens on drop.** The zone's text names the action and the limits ("Drop a CSV here, or choose a file. Up to 5 MB.").
- **Many files at once.** When someone drops a batch, a summary of how many and which types reads better than a long list appearing at once (Friedman, as linked); the per-file list follows.
- **Single-file zones.** After one file is added, Carbon removes the zone, and the person removes the file to add another ([Carbon](https://carbondesignsystem.com/components/file-uploader/usage/)); the toolkit keeps the zone but labels it "Replace file", so the place the person aimed at stays put (design-standard rule 2 applies the same stillness to controls).

**Cases**
- An import page accepts drops anywhere but shows nothing until a drag starts → draw a visible zone with its button; nobody discovers a target that appears only mid-drag.
- The drop zone has no button; keyboard and voice users have no way in → put the button inside the zone.
- 40 icons dropped at once fill the page with rows before any upload starts → show "40 SVG files added" with the list collapsed under it, then per-file status.
- A drag-over state looks the same as rest → add the ready state Friedman describes: border and fill change, and the text says "Drop to upload".

**Accessibility**
- 2.5.7 Dragging Movements (the button is the single-pointer alternative), 2.1.1, 1.4.11 Non-text Contrast (the zone's border meets 3:1 against its background), 4.1.3 Status Messages (files added by a drop are announced, since a drop moves no focus).
- Figma: figma-standard rule 31 (rest, drag-over, disabled and error draw differently), figma-standard rule 32.

**Build**
- *Elements:* a container around the native `input type="file"` and its `label`; the drop handling (`dragover`, `drop`) assigns the dropped files to the same input or the same upload queue the button feeds, so there is one path after the pick.
- *ARIA and keyboard:* none of its own; the zone is not a button, and adding `role="button"` to it would duplicate the real one. A polite live region announces "3 files added".
- *States:* `data-dragover` (or a class the stylesheet keys on) while a drag is over the zone; `disabled` on the input when the limit is reached.
- *Rules:* code-standard rule 20 (without script the input still works; the zone is decoration), code-standard rule 36 (one upload enhancement, one implementation, shared by every page that uploads), code-standard rule 6 (the script finds the zone by a data attribute).
- *Detail:* [code: progressive enhancement](../../code/javascript.md#progressive-enhancement); [code: live regions and status messages](../../code/accessibility.md#live-regions-and-status-messages).

**Check**
- *Script:* could check that each drop zone contains a focusable file input or a button that opens one, that its border meets 3:1, and that dropping files updates a live region.
- *Judgement:* Do people here drag files often enough to earn the zone, and is every state drawn?

**Sources:** GOV.UK, Carbon and Friedman as linked. Carbon removes a single-file zone once a file is added; the toolkit keeps it as "Replace file", for layout stability.

## Progress, errors and retry

**Use when / don't use**
- Show progress for any upload that takes more than about a second; NN/g's threshold for any action is the same, with a percent-done indicator past about ten seconds ([NN/g progress indicators, Sherwin 2014](https://www.nngroup.com/articles/progress-indicators/)).
- Check what can be checked before uploading: type, size and count are known in the browser the moment a file is picked.
- Don't block the whole form while one file uploads, unless the next step needs it.

**How**
- **Per file.** Each file has its own status: uploading (with a percentage where the transfer reports one), done, or failed. Carbon's uploader moves each file through loading, success and uploaded, with an error state for files that fail validation ([Carbon](https://carbondesignsystem.com/components/file-uploader/usage/)).
- **Cancel.** A file in flight can be cancelled; a long batch can be stopped (NN/g: offer a way to stop a long wait).
- **Errors name the file and the fix.** GOV.UK writes one message per cause: the wrong type, too large, empty, password protected, contains a virus, could not be uploaded (try again), too many files ([GOV.UK file upload](https://design-system.service.gov.uk/components/file-upload/)). The wording follows [content: error messages](../design/content.md#error-messages).
- **Where errors go.** An error about one file sits on that file's row; an error about the whole control (too many files, the service is down) sits on the control, as an inline message (Carbon).
- **Retry** on a failed transfer, in the row, without re-picking the file.
- **Validate early, enforce late.** Type, size and count in the browser on pick; the server checks again and has the final word, and a server-side failure reports its cause (code-standard rule 61), never a bare "Upload failed".

**Cases**
- A 40 MB video starts uploading against a 10 MB limit and fails after a minute → check the size on pick and say so before any transfer.
- Five files upload and one fails; the whole batch shows "Error" → mark only the failed row, with its cause and a Retry button.
- The server rejects a file and the interface says "Something went wrong" → report the cause it returned ("This file contains a virus"); the code knows why.
- A progress bar sits at 0% for the whole transfer because the client cannot read progress → use an indeterminate state with the file's name, not a false 0%.

**Accessibility**
- 3.3.1 Error Identification (the file and the problem in text), 3.3.3 Error Suggestion (what to do), 4.1.3 Status Messages (upload complete and failures announced without moving focus), 1.4.1 (failed is shown by text and icon, not only red), 2.2.1 Timing Adjustable is not triggered by uploads, but a session that expires mid-upload is (see [accessibility: time limits](../design/accessibility.md#time-limits)).

**Build**
- *Elements:* a native `progress` per file, labelled with the file's name (`aria-labelledby` on the name); no `value` while the size is unknown, so it is indeterminate ([MDN progress](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/progress)); Cancel and Retry as `button`s.
- *ARIA and keyboard:* no APG pattern; a polite live region for "photo.jpg uploaded" and an assertive one, used sparingly, for a failure the person must act on.
- *States:* `data-status="uploading|done|error"` on each row for the stylesheet; `aria-describedby` from the row's actions to its error text; `aria-busy="true"` on the list while it is being updated, removed when done (MDN's pattern).
- *Rules:* code-standard rule 61 (a failure reports why), code-standard rule 14 (updating a row keeps focus on the control the person used), code-standard rule 18 (icon-only Cancel and Retry are named with the file: "Cancel photo.jpg"), code-standard rule 12 (Retry renders only on a failed row).
- *Detail:* [code: live regions and status messages](../../code/accessibility.md#live-regions-and-status-messages); [code: errors and an envelope's success flag](../../code/javascript.md#errors-and-an-envelopes-success-flag); [code: form errors and validation](../../code/html-semantics.md#form-errors-and-validation).

**Check**
- *Script:* could pick an oversized and a wrong-type file and assert each is refused before any network request, with an error naming the file; could fail one upload of three and assert only that row shows an error and a Retry button; could assert a live region changes on completion.
- *Judgement:* Does every error say which file and what to do, in the person's words?

**Sources:** NN/g, Carbon, GOV.UK and MDN as linked.

## The list of uploaded files

**Use when / don't use**
- Any upload that keeps files on the page before the form is submitted, or shows files already attached on return.
- Don't show the list of a single-file control as a table; one row under the input is enough.

**How**
- **One row per file:** its name (truncated in the middle so the extension stays visible), its size in units people read ("2.4 MB"), its status, and its actions. Carbon stacks uploaded files vertically under the uploader ([Carbon](https://carbondesignsystem.com/components/file-uploader/usage/)).
- **Remove** on every row; **Replace** where one file stands for one answer. Carbon's remove is an "x" reached by Tab and pressed with Space or Enter.
- **After a remove,** focus moves to the next row's remove button, or to the input when the list is empty.
- **Show the limit as it fills:** "3 of 5 files"; at the limit, the input is disabled and says why.
- **Reuse.** On a later step of the same journey, earlier uploads appear as choices so the person does not upload the same file twice ([GOV.UK file upload](https://design-system.service.gov.uk/components/file-upload/)).
- **Preview** only where seeing the file confirms it is the right one (an image thumbnail); a generic icon by type is enough otherwise.

**Cases**
- Long file names push the remove button off a 320px screen → truncate the name in the middle and keep the button in place.
- Removing a file leaves focus on nothing and the next Tab starts at the top of the page → move focus to the next row, or the input.
- A support form returns with an error and the three attached screenshots are gone → keep them in the list (forms' [keeping input](forms.md#keeping-input)); re-attaching is the worst part of the retry.
- The list reads "IMG_2034.jpg 2034112" → show "2.0 MB"; bytes are the machine's unit, not the reader's.

**Accessibility**
- 1.3.1 (a real list), 2.4.3 Focus Order (focus after remove), 2.5.8 Target Size (remove controls), 4.1.2 (each remove button names its file), 1.4.10 Reflow (rows fit at 320px).
- Figma: figma-standard rule 26 (the remove target), figma-standard rule 32.

**Build**
- *Elements:* a `ul` of files; each `li` holds the name, size (`data` or plain text), the status and `button`s. Remove before submit is a `button type="button"`; remove of a file already stored is a form post that works without script.
- *ARIA and keyboard:* no APG pattern; plain list and buttons, in tab order. Don't make the list a grid.
- *States:* `disabled` on the input at the limit, with the reason in its `aria-describedby`; `hidden` on the empty list's container where an empty list says nothing.
- *Rules:* code-standard rule 18 ("Remove photo.jpg", not a bare ×), code-standard rule 14 (focus after a removal), code-standard rule 9 and code-standard rule 62 (disabled is the input's own attribute), code-standard rule 12 (the list renders only when there are files), code-standard rule 17.
- *Detail:* [code: focus management](../../code/accessibility.md#focus-management); [code: hidden content](../../code/accessibility.md#hidden-content); [code: lists, description lists and figures](../../code/html-semantics.md#lists-description-lists-and-figures).

**Check**
- *Script:* could add two files, remove one, and assert focus lands on the remaining row's remove button; could assert every remove button's name contains its file name and that sizes are shown in KB or MB.
- *Judgement:* Would a person know from the list alone that they attached the right files?

**Sources:** Carbon and GOV.UK as linked.
