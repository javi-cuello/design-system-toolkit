# JavaScript: progressive enhancement and behaviour

How a page's scripts are written so that the page works first and is enhanced second: the no-script path, the platform features that replace a library, one implementation per behaviour, events, state in the address, re-rendering without losing the reader, live data, saving automatically, dragging and its single-pointer alternative, drop targets, positions and trees, client and server boundaries, web components, errors, safe templating and input timing. It is how to apply code-standard rule 20 (a working no-script path), code-standard rule 8 (the kind of component decides the implementation), code-standard rule 14 (a live swap keeps the reader's place), code-standard rules 21, 28 and 36 (modified clicks, the one rule the feature is, one implementation), code-standard rules 43 and 47 (client boundaries) and code-standard rule 61 (a failure reports why). It serves the design-standard principles *for everyone, in any context*, *show state and give feedback* and *people in control, mistakes forgiven*. The markup each enhancement starts from (`details`, `dialog`, `popover`, custom elements) is [html-semantics.md](html-semantics.md)'s; the keyboard models of scripted widgets and where focus goes are [accessibility.md](accessibility.md#composite-widgets-and-roving-tabindex)'s; escaping by context and the rest of security are [security.md](security.md)'s; which features a project may rely on is [browser-support.md](browser-support.md).

**Implements:** the behaviour behind [forms](../ui/patterns/forms.md), [filtering](../ui/patterns/filtering.md), [search](../ui/patterns/search.md), [pagination](../ui/patterns/pagination.md), [feedback](../ui/patterns/feedback.md) and [settings](../ui/patterns/settings.md), and [interaction](../ui/design/interaction.md)'s saving, dragging and validation timing.

## Progressive enhancement

**What good looks like**
- The page does its job as HTML: links navigate, forms submit, content is readable, before any script runs.
- The script adds speed and comfort to a page that already works, and when it fails the page falls back to that working state, never to a broken half.
- What the script hides, it hides itself; the server never ships content hidden in the hope a script will reveal it.

**How**
- **HTML first.** GOV.UK: "make your page work with HTML first", because "the JavaScript layer is not fault-tolerant": one unsupported call stops every line after it ([GOV.UK progressive enhancement](https://www.gov.uk/service-manual/technology/using-progressive-enhancement)). code-standard rule 20 lists the no-script path for forms, modals and disclosures; build each that way and then enhance.
- **Enhance from a known starting state.** The script finds its hook (a data attribute, code-standard rule 6), checks that what it needs exists, and only then changes the page: `if (!('showPopover' in HTMLElement.prototype)) return;`.
- **Hide on enhance, not in the markup.** Tab panels, a collapsed filter list, a "show more" region: render them visible and let the script add `hidden` when it takes over. Then no stylesheet rule can strand them (code-standard rule 17 covers the reverse case, where a script's `hidden` must win).
- **Mark enhancement on the root** when CSS must differ: the script sets `document.documentElement.dataset.js = ''` as its first line, and styles that assume the script read `[data-js] …`. `<noscript>` is for a submit button or a note, not for undoing styles.
- **Fail safe.** Wrap each enhancement so its failure leaves the HTML path in place: register handlers last, after the setup that might throw, so a half-initialised widget never intercepts clicks.

**Cases**
- Tab panels ship with `hidden` and a `<noscript>` style to show them, but the reset says `[hidden] { display: none !important }` in a layer → the important declaration in an earlier layer beats any later or unlayered one ([CSS Cascade 5](https://www.w3.org/TR/css-cascade-5/#layering) reverses layer order for `!important`), so the panels are unreachable without script. Ship the panels visible and let the script hide them.
- A filter modal opens only from a click handler → the no-script modal in [html-semantics: disclosure, dialogs and popovers](html-semantics.md#disclosure-dialogs-and-popovers), enhanced to `showModal()` (code-standard rule 20).
- A "load more" button fetches the next batch → make it a link to `?page=2` that the script intercepts; without script it is pagination ([pagination: load more](../ui/patterns/pagination.md#load-more)).
- A search box filters a list as you type → keep it a GET form that submits; the script filters in place and the form still works on Enter with scripts off.
- One bundle throws on an older browser's syntax → every enhancement in that bundle dies with it; load each enhancement as its own module (`type="module"`), so one failure costs one enhancement and the rest of the page keeps its HTML path.

**Accessibility**
- 2.1.1 Keyboard and 4.1.2 Name, Role, Value hold on the no-script path too: a native link, button or form has them for free.
- code-standard rule 20 (no-script path), code-standard rule 17 (`hidden` beats the sheet), code-standard rule 1 (markup stands on its own).

**Check**
- *Script:* `tools/css-lint/check.mjs` "hidden beats the sheet" (code-standard rule 17). Could load each page with JavaScript disabled and assert every tab panel, menu and modal's content is reachable, and that no element carries `hidden` in the server HTML that a script later removes.
- *Judgement:* With scripts off, can a reader do every task the page exists for?

**Sources:** [GOV.UK](https://www.gov.uk/service-manual/technology/using-progressive-enhancement) as quoted; [MDN `<noscript>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/noscript); [MDN `hidden`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/hidden). GOV.UK makes progressive enhancement mandatory for its services; the toolkit holds every project to it through code-standard rule 20.

## The platform before a library

**What good looks like**
- A behaviour HTML or the browser already provides is used, not rebuilt: modal, popover, disclosure, accordion, form validation, lazy loading.
- A library or a custom component is chosen only after the platform feature is ruled out, with the reason written down.
- A newer feature is an enhancement over a working baseline, not a requirement.

**How**
- **Modal, popover, disclosure and accordion:** `dialog`, `popover` and `details` replace a library each; what each gives and what it leaves to the script is [html-semantics: disclosure, dialogs and popovers](html-semantics.md#disclosure-dialogs-and-popovers). The script's part is `showModal()` over the no-script path, and Escape and click-outside for a `details` used as a menu (code-standard rule 19); `closedby` sets which dismissals a `dialog` accepts ([`showModal()`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLDialogElement/showModal)).
- **Form validation:** `required`, `type`, `min`, `max`, `pattern`, then `setCustomValidity()` and the `invalid` event for your own messages ([MDN form validation](https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms/Form_validation)). When the design shows its own error summary, add `novalidate` from the script, so the no-script path keeps the browser's checks. Timing is [forms: validation timing](../ui/patterns/forms.md#validation-timing).
- **View transitions:** `if (document.startViewTransition) document.startViewTransition(update); else update();` keeps the change working where the API is absent ([MDN View Transition API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API)); honour `prefers-reduced-motion` ([accessibility.md](accessibility.md)).
- **Visibility:** `IntersectionObserver` instead of a scroll listener for reveal, sticky state and infinite loading ([MDN Intersection Observer API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)); `loading="lazy"` instead of either for images ([performance.md](performance.md#images)).
- **Read-only and inert regions:** `inert`, not `pointer-events: none`, which stops only the pointer; the choices are [accessibility: hidden content](accessibility.md#hidden-content).

**Cases**
- A team adds a modal library for one confirmation → `<dialog>` with `showModal()`; focus moves in, the page goes inert, Escape closes it, and nothing is downloaded.
- A script checks every field on submit, and with scripts off the form posts unchecked → `required`, `type` and `pattern` in the markup first; the script adds `novalidate` and its own summary on top.
- A scroll listener toggles a sticky header's attribute on every scroll event → an `IntersectionObserver` on a sentinel element above the header; the callback runs only when the state changes.
- A dropdown menu built on `details` claims in a comment that the platform closes it on Escape → it does not; add the Escape and click-outside handler and fix the comment (code-standard rule 19), or use a popover, which has light dismiss.

**Accessibility**
- 2.1.2 No Keyboard Trap and 2.4.3 Focus Order: `showModal()` contains focus and returns it on close. 4.1.2 Name, Role, Value: native elements expose state without ARIA.
- code-standard rule 8 (check `details`, `dialog` and `popover` before a web component), code-standard rule 19, code-standard rule 9 (disabled is the control's own).

**Check**
- *Script:* `tools/parity/pages.mjs` "stays open on Escape (code-standard 19)" over floating `details`. Could grep scripts for `role="dialog"` on a non-`dialog` element, a scroll listener that only toggles a class, and `pointer-events: none` used as the only guard on a form.
- *Judgement:* Which platform feature was ruled out before this script was written, and why?

**Sources:** MDN as linked; [W3C *Using ARIA*](https://www.w3.org/TR/using-aria/) first rule; Baseline status at [web.dev/baseline](https://web.dev/baseline). Sources agree; the toolkit adds that a newer feature ships behind a feature test with the old path intact.

## One implementation per behaviour

**What good looks like**
- Filter, tabs, view toggle, modal opening, live swap: each is written once and called from every page that needs it.
- A page passes what differs (the selector, the endpoint, the label) as data; it never copies the code.
- A fix to the behaviour lands everywhere at once.

**How**
- One module per behaviour, initialised from data attributes: `for (const el of document.querySelectorAll('[data-tabs]')) tabs(el);`. The template carries the markup and the hook; the script carries the behaviour (code-standard rule 36).
- Configuration lives on the element (`data-endpoint`, `data-poll="30"`) rather than in a per-page script block.
- Before writing a handler, search for one: the roving-focus code a tab set has is the code a toolbar or menu needs.

**Cases**
- Two list pages each carry an inline script that filters and updates the address; one gained `replaceState`, the other kept `pushState` → this is code-standard rule 36's own evidence: lift both into one module.
- Tabs, a view toggle and a segmented filter each implement arrow-key focus their own way → one roving-focus helper; the three widgets differ only in what activating an item does.
- Three pages open their modal three ways (a click handler, a `popovertarget`, a hash) → one way, the no-script one, enhanced once.

**Accessibility**
- 3.2.3 Consistent Navigation and 3.2.4 Consistent Identification: the same control behaves the same on every page, which a shared module guarantees.
- code-standard rule 36; design-standard principle *consistent, not uniform*.

**Check**
- *Script:* `tools/css-lint/check.mjs` "one enhancement, one implementation" (code-standard rule 36), by inline script body across the templates. Could also flag two modules registering handlers on the same hook attribute.
- *Judgement:* Is there a second copy of this behaviour anywhere, perhaps under another name?

**Sources:** code-standard rule 36's evidence is the source; no external source is needed for "write it once".

## Events and delegation

**What good looks like**
- One listener on a persistent container handles every item inside it, including items rendered later.
- Handlers find their target by a data-attribute hook, not by a class or a position.
- A click the page intercepts still lets the browser open new tabs and windows.

**How**
- **Delegate:** listen on the container and resolve the item with `closest()` ([MDN event bubbling](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/Event_bubbling), [`closest()`](https://developer.mozilla.org/en-US/docs/Web/API/Element/closest)):
  `list.addEventListener('click', e => { const b = e.target.closest('[data-remove]'); if (b) remove(b.dataset.remove); });`
- **Hooks** are data attributes (code-standard rule 6), checked for collisions first (code-standard rule 39).
- **Modified clicks** go to the browser (code-standard rule 21); the early return is in [accessibility: keyboard access and modified clicks](accessibility.md#keyboard-access-and-modified-clicks). Better still, a stretched link needs no handler (code-standard rule 21's evidence).
- **Clean-up:** pass `{ signal }` from an `AbortController` and call `abort()` to remove every listener a widget added at once ([MDN AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)).
- **Listen to `submit`, not the button's `click`**, so Enter in a field and assistive technology both trigger it.

**Cases**
- Rows re-rendered by a poll lose their click handlers → delegate from the table, which persists; the rows can be replaced freely.
- A card's click handler navigates with `location.href` → cmd-click opens nothing new; make the card's title a link stretched over the card, and delete the handler.
- A widget is removed and its `resize` listener keeps firing → register with a signal and abort it on teardown.

**Accessibility**
- 2.1.1 Keyboard: a `click` handler on a native button fires for Enter and Space; on a `div` it does not, which is why handlers belong on real controls (code-standard rule 8).
- code-standard rule 21, code-standard rule 6.

**Check**
- *Script:* `tools/css-lint/check.mjs` "modified clicks go to the browser" (code-standard rule 21), per click handler. Could flag `click` listeners on non-interactive elements and `keydown` listeners that only replay `click`.
- *Judgement:* Does the listener sit on something that outlives what it handles?

**Sources:** MDN as linked.

## State in the address and history

**What good looks like**
- Whatever a reader expects Back, reload and a shared link to keep (tab, filters, search, sort, page) is in the address.
- A change the reader sees as a new view adds a history entry; a refinement replaces the current one.
- Loading an address sets every control from it, and Back restores the view without a reload.

**How**
- Which changes push and which replace is [ux: state persistence and restore](../ui/design/ux.md#state-persistence-and-restore)'s decision; this is how to code it.
- **Push** for a new view: `history.pushState(null, '', url)`. **Replace** for a refinement such as each keystroke: `history.replaceState(null, '', url)` ([MDN `pushState`](https://developer.mozilla.org/en-US/docs/Web/API/History/pushState), [`replaceState`](https://developer.mozilla.org/en-US/docs/Web/API/History/replaceState)).
- **Restore on `popstate`:** read `location.search`, set the controls, re-render. `pushState` itself fires no `popstate`; only the reader's navigation does ([MDN `popstate`](https://developer.mozilla.org/en-US/docs/Web/API/Window/popstate_event)).
- **One source of truth:** build the URL from the form with `new URLSearchParams(new FormData(form))`, so the GET form's no-script address and the script's address are the same string.
- Defaults are omitted from the address; the clean URL is the default view ([filtering: filters in the address](../ui/patterns/filtering.md#filters-in-the-address)).

**Cases**
- Typing "button" pushes six entries and Back replays the keystrokes → replace while typing, push when the search settles or is submitted ([search: the query in the address](../ui/patterns/search.md#the-query-in-the-address)).
- Back changes the address but the list stays filtered → handle `popstate` and re-render from the address.
- The script's address uses `?q=` while the form's field is `name="query"` → the no-script path and the scripted path produce different links; derive both from the form.

**Accessibility**
- 3.2.5 Change on Request (AAA): the view changes only on the reader's action. 2.4.3 Focus Order: after a restore, focus stays where the reader was (code-standard rule 14).
- code-standard rule 20 (a GET form puts state in the address without script), code-standard rule 36 (its evidence is this choice drifting between two copies).

**Check**
- *Script:* could set each control, reload and assert the same state; press Back after a filter change and assert the previous state; type five characters and assert the history length grew by at most one.
- *Judgement:* Which changes count as a new view here?

**Sources:** MDN as linked; [MDN History API](https://developer.mozilla.org/en-US/docs/Web/API/History_API). The [Navigation API](https://developer.mozilla.org/en-US/docs/Web/API/Navigation_API) is a newer interface for the same job; check [browser-support.md](browser-support.md) before relying on it.

## Re-rendering without losing focus or scroll

**What good looks like**
- A list replaced by a filter, a sort or a poll keeps the reader's focus and scroll position.
- The region that changes persists; only its contents change.
- An unchanged item is left alone rather than re-created.

**How**
- code-standard rule 14 states the restore; apply it as: record the focused control's identity, swap, find the replacement, `el.focus({ preventScroll: true })` ([MDN `focus()`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/focus)).
- **Key items by a stable id** (`data-id`) and update in place: change the text and attributes of an item that exists, insert the new, remove the gone. Untouched nodes keep focus and selection by themselves.
- **Scroll:** replacing the contents of a scroll container resets nothing if the container persists; if the page height shrinks, read `scrollY` before and restore it after.
- If the focused item was removed, move focus to the nearest remaining item or the list's heading, never to `body`.

**Cases**
- A poll replaces a table's `innerHTML` every 30 seconds and a keyboard user's focus drops to `body` → update rows by id instead, and restore focus by identity for any row that was replaced.
- Toggling a filter checkbox re-renders the filter form too → swap only the results; if the form must re-render, restore focus to the checkbox by name and value (code-standard rule 14).
- Deleting a row removes the focused button → focus the next row's equivalent button, or the previous one if it was the last.

**Accessibility**
- 2.4.3 Focus Order and 2.4.7 Focus Visible; 4.1.3 Status Messages for the new count.
- code-standard rule 14, code-standard rule 12 (an empty state appears only when the list is empty).

**Check**
- *Script:* `tools/parity/pages.mjs` "(code-standard 14)" toggles a checkbox in a form with a live region and asserts focus returns to it after the swap. Could do the same across a poll by focusing a row control and waiting one interval.
- *Judgement:* What happens to focus when the focused item itself is removed?

**Sources:** MDN as linked; [ux: state persistence and restore](../ui/design/ux.md#state-persistence-and-restore) for why the reader's place matters.

## Polling and live data

**What good looks like**
- The page updates at a rate the data needs, pauses when nobody is looking, and stops hammering a server that is failing.
- An update changes only what changed and leaves the reader where they were.
- The reader can tell how fresh the data is and can pause updates that move content.

**How**
- **Schedule the next poll after the last one finishes** (`setTimeout` in a chain), never `setInterval`, so a slow response never overlaps the next.
- **Pause when hidden:** listen for `visibilitychange` and skip polls while `document.hidden` ([MDN Page Visibility API](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API)); poll once on return.
- **Abort the stale request** with an `AbortController` when a new one starts ([MDN AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)).
- **Back off on failure** (double the delay up to a cap) and say so in the interface; reset on success.
- **Push instead of poll** where the server can: `EventSource` reconnects by itself ([MDN server-sent events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)).
- **Patch, then announce sparingly:** update by id (previous section); announce a summary ("3 new findings") in a persistent `aria-live="polite"` region, not every row.
- **Freshness:** show "Updated 14:02" next to the data ([data: provenance and freshness](../ui/patterns/data.md#provenance-and-freshness)).

**Cases**
- A dashboard polls every 5 seconds in a background tab all day → pause on `visibilitychange`, refresh once when the tab returns.
- The server is down and the poll retries every 5 seconds with an error toast each time → back off, show one persistent "Can't reach the server, retrying" message, clear it on success.
- A feed inserts new items at the top while the reader is reading → hold them behind a "Show 3 new items" button; content that moves on its own needs a way to pause (2.2.2).
- A poll response is empty because the request failed → an envelope's `ok: false` is not "no new data" (next-but-one section).

**Accessibility**
- 2.2.2 Pause, Stop, Hide: auto-updating information shown beside other content can be paused, stopped or hidden. 4.1.3 Status Messages: the summary is announced without moving focus.
- code-standard rule 14; candidates.md lists `aria-live` on an element that mounts with its content as announcing nothing ([candidates](candidates.md)).

**Check**
- *Script:* could hide the page (emulated visibility) and assert no requests for two intervals; fail the endpoint and assert the delay grows; assert the live region exists before the first update.
- *Judgement:* Does this data change often enough to poll at all, or would a refresh button do?

**Sources:** MDN as linked. The rates and the back-off cap are the project's to choose; no source sets them.

## Saving automatically

**What good looks like**
- A control that saves itself (a switch, a segmented control, a notes field) sends its change at once or after a pause, and says "Saving…", "Saved" or "Couldn't save. Retry" beside itself.
- The value the reader entered stays on screen when the save fails.
- An explicit form warns before the reader leaves with unsaved changes, and only then.
- It implements [interaction: saving: explicit or automatic](../ui/design/interaction.md#saving-explicit-or-automatic).

**How**
- **The no-script path is a form.** Each auto-saving control sits in a small `form` with a submit button the script hides; the script then sends the same request on `change`, or on `input` debounced ([debouncing input](#debouncing-input)) for a text field (code-standard rule 20).
- **One status element per saving area**, in the page from the start, written in the same handler that sends the request: `<p role="status" data-save-status></p>` ([accessibility: live regions](accessibility.md#live-regions-and-status-messages)).
- **On failure** keep the control's value, write the reason from the response (code-standard rule 61) and offer Retry; never revert silently. An envelope's `ok: false` is a failure ([errors and an envelope's success flag](#errors-and-an-envelopes-success-flag)).
- **Unsaved explicit forms:** add a `beforeunload` listener on the first edit and remove it after a successful save; MDN asks to "listen for `beforeunload` only when users have unsaved changes", and notes Firefox keeps a page with the listener out of the back/forward cache ([MDN `beforeunload`](https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeunload_event)).
  ```js
  const warn = (e) => { e.preventDefault(); e.returnValue = true; };
  form.addEventListener('input', () => addEventListener('beforeunload', warn));   // same function: added once
  form.addEventListener('saved', () => removeEventListener('beforeunload', warn));
  ```
- A save never moves focus or navigates (3.2.2); a later save aborts the earlier request so the last value wins ([polling and live data](#polling-and-live-data) has `AbortController`).
- **Flush a pending save when the page is hidden,** not on unload: Chrome's lifecycle guide says to "treat the hidden state as the likely end to the user's session", because `beforeunload`, `pagehide` and `unload` are not fired when a mobile tab is closed ([Chrome Page Lifecycle API](https://developer.chrome.com/docs/web-platform/page-lifecycle-api)); listen for `visibilitychange` and send what the debounce is holding.
- **A draft in browser storage is not saved.** Storage is "best-effort" by default: it lasts while the origin stays under quota and nobody clears it ([MDN storage quotas and eviction](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)); `navigator.storage.persist()` asks for more ([MDN `persist()`](https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/persist)). Call it a draft, and say where the durable copy is.
- **Two tabs on one storage key overwrite each other.** The `storage` event fires "when another document that shares the same storage area… updates that storage area" ([MDN `storage` event](https://developer.mozilla.org/en-US/docs/Web/API/Window/storage_event)); listen for it on the draft's key and say the draft changed elsewhere, rather than writing over it.

**Cases**
- A switch flips, the request fails and the switch flips back with no message → keep the reader's choice visible, say it did not save, offer Retry.
- A notes field saves on every keystroke → debounce, and abort the previous request.
- `beforeunload` is registered on every page load → register on the first edit, remove on save.
- An editor saves every change to `localStorage` but holds a hand-edited text pane until Apply → the pane is the one unsaved edit; register `beforeunload` while it differs and remove it on Apply or Revert.
- A tool labels its `localStorage` draft "Saved" and a second tab silently replaces it → call it a draft, and warn on the `storage` event.
- A settings page mixes auto-saving switches with a Save button → one model per form ([interaction](../ui/design/interaction.md#saving-explicit-or-automatic)); the code follows the design's choice, it does not mix them.

**Accessibility**
- WCAG 2.2 4.1.3 Status Messages (the save status), 3.2.2 On Input (no change of context), 3.3.4 Error Prevention for consequential data.
- code-standard rule 14 (the status region persists), code-standard rule 20, code-standard rule 61.

**Check**
- *Script:* could toggle each auto-saving control in a headless browser and assert one request and a status change without submit; fail the endpoint and assert the value stays and the status names the failure; assert no `beforeunload` listener on a clean page.
- *Judgement:* Does every save say whether it worked, where the reader is looking?

**Sources:** MDN and Chrome as linked; the save statuses are [Primer saving](https://primer.style/ui-patterns/saving)'s.

## Dragging and its single-pointer alternative

**What good looks like**
- Every drag (reorder, move between columns, resize, crop) has a visible control that does the same job with a click or a key.
- A drag completes on release and is cancelled by Escape or a drop outside a target.
- The new position is announced.
- It implements [interaction: gestures and drag](../ui/design/interaction.md#gestures-and-drag).

**How**
- **Build the alternative first:** "Move up", "Move down" or a "Move to…" menu per item, as plain `button`s that post a form without script (code-standard rule 20); the drag is the enhancement layered on the same move function (code-standard rule 36).
- **Pointer events, not mouse or touch events,** so one handler serves mouse, pen and touch; `setPointerCapture()` keeps "subsequent events for the pointer" on the dragged element until `pointerup` ([MDN `setPointerCapture()`](https://developer.mozilla.org/en-US/docs/Web/API/Element/setPointerCapture)). Commit on `pointerup` inside a target; `pointercancel` and Escape restore the start.
- **`touch-action: none` on the handle only**, never the whole list or page: MDN warns it can stop people operating the browser's zoom ([MDN `touch-action`](https://developer.mozilla.org/en-US/docs/Web/CSS/touch-action)).
- **The keyboard path** is the move buttons, or arrow keys on a focused handle that call the same move; focus stays on the moved item afterwards (code-standard rule 14).
- **Announce** "Moved to position 3 of 8" in a persistent `role="status"` element ([accessibility: live regions](accessibility.md#live-regions-and-status-messages)).
- **Items easing aside** are FLIP: read each item's top, make the change, then animate each from its old offset to none with `element.animate()` (a nested item by what it moved beyond its parent); cancel the running ones first, and skip it under `prefers-reduced-motion: reduce`. The slot appears where it lands, it does not travel.
- **Hit-testing under a moving slot:** the slot must be hittable (an `inert` slot lets `elementFromPoint` fall through it and the drop resets); a pointer between items keeps the drop; read positions as laid out (`getBoundingClientRect().top` minus the computed transform's `m42`), never mid-ease.
- The lifted and drop-target states are data attributes (`[data-dragging]`, `[data-drop-target]`; ARIA's `aria-grabbed` and `aria-dropeffect` are deprecated), styled like any other state ([css architecture: interaction states](css-architecture.md#interaction-states)).

**Cases**
- A kanban board moves cards only by drag → a "Move to column" menu per card that calls the same function.
- A sortable list sets `touch-action: none` on the `ul` → the page cannot be scrolled or zoomed over it; move it to the grip.
- A drag library is added for one reorderable list → buttons plus forty lines of pointer events; the library is the second implementation (code-standard rule 36).
- After a keyboard move focus falls to the body → refocus the moved item.

**Accessibility**
- WCAG 2.2 2.5.7 Dragging Movements ([Understanding 2.5.7](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html)), 2.5.1 Pointer Gestures, 2.5.2 Pointer Cancellation, 2.1.1 Keyboard, 4.1.3 for the announcement.
- code-standard rules 14, 20 and 36.

**Check**
- *Script:* could flag an element with `draggable` or a `pointermove` handler whose item has no sibling button, and `touch-action: none` on an element wider than its handle.
- *Judgement:* Can every drag on the page be done with one click per step and with the keyboard?

**Sources:** WCAG and MDN as linked; the move-button alternative is WCAG 2.5.7's own example.

## Drop targets, positions and trees

**What good looks like**
- While dragging, the person can always see what a drop would do: a line for "between two items", a highlighted container for "into this", and nothing where a drop would do nothing.
- The indicator holds still: it moves when the pointer crosses into a different outcome, never because the page moved under the pointer.
- In a tree, before, after and into are three outcomes with three signals, and the moved item is visible when the drop ends.
- A palette item dropped into a list or tree is a copy: the palette keeps it, the target gains a new item where the indicator showed.
- Every outcome, "add from palette" and "move into folder" included, has a non-drag route ([dragging and its single-pointer alternative](#dragging-and-its-single-pointer-alternative) is the floor), and a screen reader hears where the item was picked up, where it is and where it ended.

**How**
- **Three signals, one meaning each.** Atlassian uses a drop indicator line "to communicate relative placement (for example, before or after an item in a list)" and a background colour change "to communicate that an item will be placed within a particular droppable area" ([Atlassian drag and drop design guidelines](https://atlassian.design/components/pragmatic-drag-and-drop/design-guidelines)). React Aria names the same split as drop positions: `"before"` and `"after"` (an indicator between items), `"on"` (the item gets `data-drop-target`) and `"root"` (the whole collection does) ([React Aria drag and drop](https://react-aria.adobe.com/dnd)).
- **The line.** Atlassian: a 2px stroke in the selected border colour with an 8px terminal at the start edge, and "for stacked items, the line should appear in the middle of the gap between the items"; no line where "no relative placement is possible", such as an empty list, which highlights instead (design guidelines). React Aria's example draws it as a 2px element with `margin: -1px 0`, so it takes no layout room ([useDroppableCollection](https://react-aria.adobe.com/useDroppableCollection)).
- **A line or an opening gap.** The alternative is moving the other items aside, as WCAG's technique describes ("other elements move dynamically to open a gap", [G219](https://www.w3.org/WAI/WCAG22/Techniques/general/G219)) and dnd-kit's sortable preset does with transforms ([dnd-kit sortable](https://dndkit.com/legacy/presets/sortable/overview/)). The gap previews the final layout and suits a flat list of similar rows; the line keeps every row still, so it is the one for trees (where "into" needs a third signal) and for long lists where shifting rows move the targets under the pointer (practice, no source states it).
- **Highlight only where a drop will land.** Atlassian: "Only the subset that allows dropping should have a background color change… We don't want to have a situation where a background color changes, but when the user drops, nothing happens"; within one reorderable list, no container highlight at all (design guidelines). A target that exists but is refused now is shown blocked: Atlassian's hitbox has a `"blocked"` value drawn as an indicator "with a warning color" ([Atlassian hitbox](https://atlassian.design/components/pragmatic-drag-and-drop/optional-packages/hitbox/about)).
- **The source stays put.** "The original item should stay in place and dim to 40% opacity" while the preview moves; on drop, update the interface at once and flash the moved item's background for 700ms (design guidelines).
- **Split each target's box into bands.** Atlassian's list-item hitbox, with before, into and after allowed: the first quarter is `reorder-before`, the middle half `combine`, the last quarter `reorder-after`; with only before and after, two halves; past either edge counts as the nearest band (hitbox). React Aria is stricter: when "on" is allowed, before and after are only the outer 5px of the item ([`ListDropTargetDelegate.ts`](https://github.com/adobe/react-spectrum/blob/main/packages/react-aria/src/dnd/ListDropTargetDelegate.ts)). Quarters where nesting is common, thin edges where "into" is the main job.
- **Hit-test the pointer, not the dragged box.** dnd-kit's default rectangle intersection "can be unforgiving"; it recommends closest centre for sortable lists and closest corners for stacked containers such as a kanban, and says `pointerWithin` needs a fallback for keyboard input ([dnd-kit collision detection](https://dndkit.com/legacy/api-documentation/context-provider/collision-detection-algorithms/)).
- **Measure once, at lift, and leave the DOM alone until the drop.** dnd-kit measures droppables "right after dragging has begun" ([dnd-kit DndContext](https://dndkit.com/legacy/api-documentation/context-provider/dnd-context/)), and its sortable items move by `transform` "without needing to update the DOM order", the array changing on drag end (sortable). Rects taken after a gap opens describe a layout the person never aimed at, the usual cause of an indicator hopping back and forth (practice).
- **One slot, one indicator.** "After item 2" and "before item 3" are one slot, drawn in the middle of the gap; Atlassian's `getReorderDestinationIndex` turns the closest edge into the final index, allowing for the item's own start index (hitbox). Before or after the dragged item itself is no move and shows no line. No source reviewed names hysteresis; if a band edge still flickers, keep the current target until the pointer is a few pixels past it (practice).
- **Trees: each level is a list.** Atlassian: "You can treat each level of the tree as a separate list", and "for expanded tree items, do not allow `reorder-after`", because after an open parent visually means its first child (hitbox). The signals are a line above, a line below and a border around the item for into, plus an outline round "the innermost group of tree items being dragged over" (design guidelines). Dropping below a group's last child can join any ancestor level; Atlassian's tree hitbox returns a `reparent` with a `desiredLevel`, and the usual reading is that the pointer's horizontal offset, in indent steps, picks the level.
- **Trees: collapse on lift, spring open on hover.** A dragged item with children collapses at lift; a collapsed item held under "combine" for 500ms expands and stays expanded; on drop the dragged item's own expanded state returns and any parent needed to show it opens (design guidelines). React Aria's `onDropActivate` is the same hold. A node's own subtree is blocked from lift, never silently ignored. React Aria separates `onReorder` ("only allows reordering within the same level") from `onMove` (between levels, on and between items); decide which the tree offers before drawing indicators ([React Aria drag and drop](https://react-aria.adobe.com/dnd)).
- **Palettes.** A palette drop is an insert with the `copy` operation: React Aria's drop operations are `move`, `copy`, `link` and `cancel`, and tell the source whether to remove its item; `onInsert`, `onItemDrop` and `onRootDrop` take drops between items, on an item and on an empty collection (React Aria). In an empty target the insertion point sits in the centre, otherwise "before or after components, to indicate where a new component will be placed" ([SLDS drop zone](https://github.com/salesforce-ux/design-system/blob/main/ui/components/drop-zone/docs.mdx)). The non-drag route is a button per palette item that adds after the focused or selected row, else at the end, then focuses the new item (G219's "drop-down menu… to select the drop position", applied to adding).
- **Auto-scroll the scroll container**, not only the window: Atlassian scrolls "as a user drags close to the edges of the element", faster the longer the pointer stays and the closer it is to the edge, so a lift inside a scroller does not race away ([Atlassian auto-scroll](https://atlassian.design/components/pragmatic-drag-and-drop/optional-packages/auto-scroll/about)). Re-measure after a scroll. dnd-kit turns pointer auto-scroll off for its keyboard sensor, which "manages scrolling internally" (DndContext): a keyboard move brings the item into view itself.
- **Native drag only for files and other windows.** Atlassian and React Aria build on the HTML Drag and Drop API because it is "the only way to support integration with the operating system" ([React Aria, Taming the dragon](https://react-aria.adobe.com/blog/drag-and-drop)). The cost: `dropEffect` controls the cursor, and on Windows a native preview over 280px wide or tall is heavily dimmed ([Atlassian web platform constraints](https://atlassian.design/components/pragmatic-drag-and-drop/web-platform-design-constraints)). Inside one page, pointer events as above ([MDN HTML Drag and Drop API](https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API)).
- **Starting a drag.** dnd-kit's pointer sensor starts after a move `distance`, or after a hold `delay` with a `tolerance`, "particularly useful for touch input"; `touch-action` set after `pointerdown` is ignored for that pointer, so it is in the stylesheet from the start ([dnd-kit pointer sensor](https://dndkit.com/legacy/api-documentation/sensors/pointer/)). A small distance stops a click on the handle starting a drag; a delay lets a finger scroll a list of draggable rows. The whole item drags when it has no other controls, only the handle when it has, and a menu attached to the item closes when its drag starts (design guidelines).
- **Cancel** is Escape for every input, not only the keyboard ([dnd-kit accessibility](https://dndkit.com/legacy/guides/accessibility/)); it restores the start, a tree item's expanded state included, and says nothing moved.

**Cases**
- The indicator flickers between two rows while the pointer is still → rects were measured after the gap opened; measure at lift, or draw a line.
- Rows are re-inserted into the DOM on every `pointermove` → focus and scroll jump and the target moves under the pointer; move by `transform` or draw a line, and change the DOM on drop.
- A tree shows a line both under an open folder and above its first child → no `reorder-after` on an expanded item.
- A folder highlights and then refuses the drop → highlight only targets that accept; show the rest as blocked.
- A dragged folder is dropped into its own child → its subtree is blocked from lift.
- Dropping into a collapsed folder hides the item → expand the parent on drop.
- A palette item vanishes from the palette after a drop → the palette offers `copy`, never `move`.
- An empty list cannot receive a drop → the container itself is a target, with the insertion point centred.
- Dragging to the bottom of a long scrolling list stalls at the fold → register the scroll container for auto-scroll.
- A large card preview is near-invisible on Windows → keep a native preview within 280 by 280px, or draw the preview with pointer events.
- A drag handle is a focusable button labelled "Drag to reorder" that does nothing on Enter → give it the keyboard path, or name it for what it does.

**Accessibility**
- **Choose the keyboard model.** Three are in use, and the move buttons of [the section above](#dragging-and-its-single-pointer-alternative) are the floor under each (WCAG 2.5.7); a pick-up mode adds to them, never replaces them.
  - *Menus and buttons:* Atlassian puts move actions in the item's "more" menu or a drag-handle menu button (never both), simple outcomes as items ("move to top"), and for trees a "Move" item opening a form with every outcome; it advises against arrow keys, which make JAWS users switch mode and can need many keystrokes ([Atlassian drag and drop accessibility](https://atlassian.design/components/pragmatic-drag-and-drop/accessibility-guidelines)). G219 adds a typed position number.
  - *Pick up, arrows, drop:* dnd-kit's Space or Enter picks up, arrows move, Space or Enter drops, Escape cancels; its sortable preset moves to the next item rather than by pixels ([dnd-kit accessibility](https://dndkit.com/legacy/guides/accessibility/), [keyboard sensor](https://dndkit.com/legacy/api-documentation/sensors/keyboard/)). Salesforce's dueling picklist toggles a drag mode with Space ([SLDS dueling picklist](https://github.com/salesforce-ux/design-system/blob/main/ui/components/dueling-picklist/docs.mdx)).
  - *Pick up, Tab between targets, drop:* React Aria's Enter starts a page-wide drag mode, Tab moves only between targets that accept the data, Up and Down choose before, on or after, Enter drops; everything but valid targets is hidden from screen readers meanwhile (React Aria, Taming the dragon).
  - A tree's menu route needs "Move into…" and a destination picker, not only up and down.
- **Instructions on focus.** dnd-kit gives each draggable `aria-describedby` pointing at hidden instructions, a button role and an `aria-roledescription` to be customised and translated (dnd-kit accessibility).
- **Announce at pick-up, at each change of target, at drop and at cancel**, naming the item and its position counted from 1: "Item was moved to position 2 of 5" (dnd-kit); Salesforce says "current position 1 of 2." while held and "final position 1 of 2." on drop ([SLDS dueling picklist source](https://github.com/salesforce-ux/design-system/blob/main/ui/components/dueling-picklist/index.jsx)). In a tree, name the parent: "Moved into Reports, position 1 of 3". React Aria names each drop indicator, "Insert between item A and item B" (Taming the dragon). Move controls carry the item's name: "Move task 'clean dishes' to top of backlog" (Atlassian accessibility).
- **Focus** returns to the control that started the move, or to the best replacement if it is gone (Atlassian accessibility).
- WCAG 2.2 2.5.7 Dragging Movements, 2.5.8 Target Size (Minimum) for a handle of its own ([Understanding 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)), 2.1.1 Keyboard, 4.1.3 Status Messages; code-standard rules 14 and 20.

**Check**
- *Script:* could drag a row slowly across the next one in a browser test and record the indicator per frame (at most one change per band edge, no back-and-forth); assert the list's child order is unchanged until `pointerup`; in a tree fixture assert a node offers no target in its own subtree and an expanded node no "after"; assert the status text after pick-up, a move and a drop says "position N of M", counted from 1.
- *Judgement:* Before letting go, can you tell exactly what the drop will do, "into" included? Can a palette item be added, and a tree item moved into a folder, without dragging?

**Sources:** Atlassian Pragmatic drag and drop, dnd-kit, React Aria, Salesforce Lightning Design System, WCAG and MDN as linked; the ARIA Authoring Practices Guide has no drag and drop pattern. On politeness the sources split without arguing it: Atlassian's [live region](https://atlassian.design/components/pragmatic-drag-and-drop/optional-packages/live-region/about) uses `role="alert"` and Salesforce `aria-live="assertive"`, where the toolkit's floor is a polite `role="status"`. The toolkit keeps it polite after a button move, and uses one assertive region only while a keyboard drag is held, so each step is heard before the next. The bands, measuring at lift and the line-or-gap choice are the sources'; the hysteresis margin, the depth-by-offset reading and the palette button's insertion point are practice no source states.

## Client and server boundaries, and islands

**What good looks like**
- The server renders the page as HTML; the client takes over only the components that hold state or behaviour.
- A component crosses to the client because of its own behaviour, not a caller's.
- Only serialisable values cross the boundary.

**How**
- A React component's own shape (its props, `ref`, events, slots, stories) is [react.md](react.md); this section is where its boundary goes.
- **Islands:** render the page on the server and hydrate small, independent interactive regions; the rest stays static HTML (Jason Miller, [Islands Architecture](https://jasonformat.com/islands-architecture/), commentary). web.dev's [Rendering on the web](https://web.dev/articles/rendering-on-the-web) compares server, static and client rendering.
- **Mark the leaf that owns the behaviour**, not its parents (code-standard rule 47); a component that only forwards a handler stays on the server.
- **Values, not functions,** cross: a label template with a placeholder, a link as a field on the item (code-standard rule 43).
- **A client component receives words, not the dictionary:** pass the three labels it needs, not the translation table (a [candidate](candidates.md)).
- Without a framework, the same split holds: server templates render everything, and each enhancement script is an island bound to its own hook.

**Cases**
- A list component is marked client because one button inside it opens a menu → move the directive to the menu; the list renders on the server.
- A server page passes `label={(n) => n + ' selected'}` to a client component and the page errors → pass `labelTemplate="{n} selected"` and substitute on the client (code-standard rule 43).
- A client file imports the whole translation module to read three strings → pass the strings as props.

**Accessibility**
- Content rendered on the server is there for assistive technology and for the no-script path before hydration (code-standard rule 20).
- code-standard rules 43, 47 and 20.

**Check**
- *Script:* `tools/css-lint/check.mjs` "a client boundary pays for its own behaviour" (code-standard rule 47) and "a function never crosses to the client" (code-standard rule 43). Could measure the client bundle per route ([performance.md](performance.md#javascript-delivery)).
- *Judgement:* Does this component hold state, run an effect or touch a browser API itself?

**Sources:** Miller and web.dev as linked. The toolkit goes the islands way: server-rendered by default, client only where a component's own behaviour needs it.

## Web components when they earn them

**What good looks like**
- A custom element is registered only for behaviour HTML has no element for, after `details`, `dialog` and `popover` are ruled out.
- The custom element wraps the real control; the control keeps the behaviour and semantics.
- The page reads correctly before the element is defined.

**How**
- code-standard rule 8 sets the three kinds; most components are visual (a custom element with CSS and no script) or native interactive (a wrapper round the real control).
- **Autonomous elements only,** named and wrapping the native control as [html-semantics: custom elements](html-semantics.md#custom-elements) sets out.
- **Light DOM by default,** so the layered stylesheet and its tokens reach the parts (code-standard rule 4); shadow DOM only where encapsulation is the point, with custom properties as the styling interface (code-standard rule 38).
- **Before definition:** style `:not(:defined)` so the unenhanced markup is usable, not hidden.
- Register once, guarded: `if (!customElements.get('ds-tabs')) customElements.define('ds-tabs', Tabs);`.
- How a registered element is then built (its constructor, attributes and properties, rendering once, events, typings and stories) is [web-components.md](web-components.md).

**Cases**
- A web component is proposed for a disclosure → `details` covers it; no registration.
- A tabs component with shadow DOM ignores the theme's tokens on its parts → light DOM, or expose the values as custom properties.

**Accessibility**
- 4.1.2 Name, Role, Value comes from the native control inside; ARIA on the wrapper is a sign the control is in the wrong place.
- code-standard rules 8, 9, 13.

**Check**
- *Script:* `tools/css-lint/check.mjs` "a state is a pseudo-class, disabled the control's own" (code-standard rule 9) flags `disabled` or a non-ARIA `role` on a custom element. Could list every `customElements.define` and require a comment naming what HTML lacked.
- *Judgement:* Which native element was tried first, and what did it lack?

**Sources:** [MDN Web Components](https://developer.mozilla.org/en-US/docs/Web/API/Web_components) and as linked.

## Errors and an envelope's success flag

**What good looks like**
- Every request's failure is distinguished from an empty answer.
- The reader sees what failed and what they can do, and work in progress is kept.
- A failure that knows its cause carries the cause to the surface.

**How**
- **Check the response before the body:** `fetch` resolves on a 404 or 500; read `response.ok` (status 200 to 299) first ([MDN `Response.ok`](https://developer.mozilla.org/en-US/docs/Web/API/Response/ok)).
- **Assert an envelope's flag:** for `{ ok, result }`, throw when `ok` is not `true`; never read `result` as "nothing" (a [candidate](candidates.md), from a run where a dead target read as three clean findings).
- **Name the cause:** no `catch (e) { data = null }`; keep the error's code and show a message per cause (code-standard rule 61).
- **Keep input:** a failed save leaves the form filled ([forms: keeping input](../ui/patterns/forms.md#keeping-input)).
- **Separate states in the markup:** loading, empty, error and result are four states; an empty state renders only for a successful empty answer (code-standard rule 12). Wording is [feedback](../ui/patterns/feedback.md).

**Cases**
- A list shows "No results" when the API returned 500 → check `ok`, show "Couldn't load results" with a retry, keep the old rows if there were any.
- A helper returns `[]` on any error → callers cannot tell failure from emptiness; throw, or return a result with the error kind.
- A save fails offline and the form clears → keep the values and say "Not saved. Check your connection and try again."

**Accessibility**
- 3.3.1 Error Identification and 4.1.3 Status Messages: the error is in text and announced. 3.3.3 Error Suggestion: it says what to do.
- code-standard rules 61 and 12.

**Check**
- *Script:* could grep for `.json()` not preceded by an `ok` check, and for empty `catch` blocks; could stub the endpoint to fail and assert an error message, not an empty state.
- *Judgement:* Can a reader tell "nothing here" from "couldn't check"?

**Sources:** MDN as linked; [feedback](../ui/patterns/feedback.md) for presentation.

## Escaping and templating safely

**What good looks like**
- Text from data is inserted as text, never parsed as HTML.
- Markup built in script comes from a `<template>` or element APIs, not string concatenation.
- Where a string must become HTML, it is encoded for its exact context: element text, a quoted attribute, a URL.

**How**
- **Text:** `el.textContent = value` "creates a text node without parsing HTML" ([OWASP XSS prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html), [MDN `textContent`](https://developer.mozilla.org/en-US/docs/Web/API/Node/textContent)). **Attributes:** `el.setAttribute('title', value)`.
- **Structure:** clone a `<template>` and fill its parts with `textContent` and `setAttribute` ([MDN `<template>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/template)).
- **A string helper, a data-supplied URL, or anything else that lands in an attribute, a URL or a script** is escaped for that context: the contexts, the helper that encodes both quotes and the scheme check are [security: escaping by context](security.md#escaping-by-context-xss). `innerHTML` with data is the XSS sink.

**Cases**
- A template literal builds each row with `innerHTML` → clone a `<template>` row and fill it; faster to read and safe by construction.
- A row needs a `data-label` from the data → `row.dataset.label = name` on the cloned node, not `data-label="${esc(name)}"` in a string; the DOM API needs no escape at all.

**Accessibility**
- Building from a `<template>` keeps the same semantic markup as the server's (code-standard rule 1), instead of a second, looser copy in a string.

**Check**
- *Script:* could flag `innerHTML`, `outerHTML` and `insertAdjacentHTML` taking a template literal with interpolation; the escape-helper checks are [security](security.md#escaping-by-context-xss)'s.
- *Judgement:* Where can a value in this template come from someone other than the author?

**Sources:** OWASP and MDN as linked; [security](security.md#escaping-by-context-xss) follows OWASP's context list.

## Debouncing input

**What good looks like**
- Typing in a search or filter updates results after the reader pauses, not on every key.
- Each keystroke still feels instant: the field never lags.
- A slow, older response never overwrites a newer one.

**How**
- **Debounce** waits for invocations to stop, then runs once; **throttle** limits a continuous stream ([MDN debounce](https://developer.mozilla.org/en-US/docs/Glossary/Debounce)). Debounce the fetch and the history write, not the field's own echo.
- One constant for the delay, shared by every field: `const settle = debounce(run, DELAY);`. A few hundred milliseconds is common practice (commentary); no source fixes it.
- **Abort the previous request** when a new one starts (`AbortController`), so responses cannot land out of order.
- **Keep handlers short** and yield long work so the next paint is not delayed ([web.dev optimize INP](https://web.dev/articles/optimize-inp); INP is [performance.md](performance.md#core-web-vitals)).
- `replaceState` per keystroke, push on settle (state section above).

**Cases**
- Every keystroke fires a request and results flicker as old responses arrive late → debounce and abort the previous request.
- A filter over 50 local rows is debounced 500 ms and feels sluggish → filter locally on every key; debounce only work that costs a request.
- A debounced handler announces each result count → announce once, after the update settles (4.1.3).

**Accessibility**
- 3.2.2 On Input: typing does not move focus or change context. 4.1.3 Status Messages for the result count.
- code-standard rule 28 (handle the case the feature is; the browser keeps the rest).

**Check**
- *Script:* could type five characters quickly and assert one request and at most one history entry.
- *Judgement:* Is the work being debounced expensive enough to need it?

**Sources:** MDN and web.dev as linked.
