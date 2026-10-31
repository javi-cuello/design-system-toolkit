# Web components

How to build an autonomous custom element that holds up in production: naming and registration, the constructor and lifecycle, attributes and properties, light or shadow DOM, rendering once and updating in place, children and slots, wrapping a native control or being one, disabled and focus, events, the element before it is defined, server rendering, typings and the manifest, and stories.

**Implements:** the web-component build of [actions](../ui/patterns/actions.md) and [forms](../ui/patterns/forms.md) controls, and of any component the contract generates.

Which components get a script at all is code-standard rule 8; this page is for the ones that do. The name, autonomy and "no role of its own" are [html-semantics: custom elements](html-semantics.md#custom-elements); when a registered element is earned, light DOM by default and the guarded define are [javascript: web components when they earn them](javascript.md#web-components-when-they-earn-them); escaping is [javascript: escaping and templating safely](javascript.md#escaping-and-templating-safely); restoring focus after a swap is [javascript: re-rendering without losing focus or scroll](javascript.md#re-rendering-without-losing-focus-or-scroll). This page does not repeat them.

## Naming and registration

**What good looks like**
- One prefix for the whole library, followed by a name that says what the element is.
- The element is defined once, by one module, and defining it twice does nothing.
- The class name and the tag name are derived from each other by one rule.

**How**
- **Prefix.** The Gold Standard asks for a name with "a project, collection, organization, or other meaningful prefix" ([Gold Standard: Prefixed Name](https://github.com/webcomponents/gold-standard/wiki/Prefixed-Name)). Shipped systems do: `wa-`, `sp-`, `cds-`, `fluent-`.
- **Class name.** Catalyst names the class like a built-in, `ThemePickerElement` for `theme-picker`, and keeps it to two words ([Catalyst conventions](https://github.github.io/catalyst/guide/conventions/)).
- **Guarded define.** `customElements.define` throws a `NotSupportedError` if the name is taken ([MDN `define()`](https://developer.mozilla.org/en-US/docs/Web/API/CustomElementRegistry/define)); the guard is in [javascript.md](javascript.md#web-components-when-they-earn-them). The module that defines the element is imported once, by code-standard rule 36.
- **Waiting for a definition.** Code that needs the upgraded element awaits `customElements.whenDefined('ds-tabs')` rather than polling ([MDN `whenDefined()`](https://developer.mozilla.org/en-US/docs/Web/API/CustomElementRegistry/whenDefined)).

**Cases**
- Two bundles each import the tabs module and the second throws → guard the define, and fix the duplicate import.
- A method called `hidden()` or `focus()` on the class → it shadows `HTMLElement`'s own; Catalyst lists this as an anti-pattern ([Catalyst anti-patterns](https://github.github.io/catalyst/guide/anti-patterns/)). Rename it for what it does.

**Accessibility**
- The tag name is never announced; nothing here reaches a reader except through the semantics inside.

**Check**
- *Script:* static scan: every `customElements.define` is preceded by a `customElements.get` guard and its tag starts with the library prefix; in Chrome, import the module twice and assert no error.
- *Judgement:* Does the name say what the element is, not how it looks?

**Sources:** as linked.

## The constructor and the lifecycle

**What good looks like**
- The constructor does almost nothing: `super()`, private state, perhaps a shadow root or `attachInternals()`.
- Setup that reads attributes or children happens in `connectedCallback`, and survives being run twice.
- Everything the element added to the outside world (listeners on `document` or `window`, observers, timers) is removed in `disconnectedCallback`.

**How**
- **The spec's constructor rules.** `super()` first with no arguments; no `return`; no `document.write()`; "The element's attributes and children must not be inspected"; "The element must not gain any attributes or children"; "work should be deferred to `connectedCallback` as much as possible" ([HTML: custom element conformance](https://html.spec.whatwg.org/multipage/custom-elements.html#custom-element-conformance)). MDN says the same: in the constructor "you should not inspect the element's attributes or children, or add new attributes or children" ([MDN: implementing a custom element](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements#implementing_a_custom_element)). The reason: `document.createElement('ds-x')` runs the constructor and must return an element with no attributes; a constructor that adds one throws there.
- **`connectedCallback` runs more than once.** The spec warns of it, and of a queued `connectedCallback` that runs after the element was removed again; check `this.isConnected` ([HTML: custom element conformance](https://html.spec.whatwg.org/multipage/custom-elements.html#custom-element-conformance)). LWC: "If you want code to run one time, write code to prevent it from running twice" ([LWC lifecycle](https://lwc.dev/guide/lifecycle)).
- **Moving.** Moving an element fires `disconnectedCallback` then `connectedCallback`; an element that defines `connectedMoveCallback` and is moved with `moveBefore()` keeps its state instead ([MDN: state-preserving moves](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements#lifecycle_callbacks_and_state-preserving_moves)).
- **One `AbortController` per connection.** Pass its `signal` to every `addEventListener` made in `connectedCallback`, abort it in `disconnectedCallback` ([MDN `addEventListener` `signal`](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#signal)). One call removes them all, and a reconnect makes a new one.
  ```js
  connectedCallback() {
    this.#ac = new AbortController();
    document.addEventListener('keydown', this.#onKey, { signal: this.#ac.signal });
  }
  disconnectedCallback() { this.#ac.abort(); }
  ```
- Listeners on the element itself or its own children die with it; the leak is listeners on things that outlive it. LWC: "relying on garbage collection can lead to memory leaks" ([LWC lifecycle](https://lwc.dev/guide/lifecycle)); Carbon releases host and `document` listeners when the element leaves ([Carbon coding conventions](https://raw.githubusercontent.com/carbon-design-system/carbon-custom-elements/HEAD/src/coding-conventions.md)).

**Cases**
- The constructor sets `this.setAttribute('role', 'tablist')` → `document.createElement` throws "The result must not have attributes"; set the default role through `ElementInternals.role` or in `connectedCallback` only if the author has not set one.
- `connectedCallback` builds the inner markup and the element is moved in a sortable list → the markup is built twice; guard first-time setup with a private flag.
- A popover closes on `document` click and the listener stays after the element is removed → abort the connection's controller in `disconnectedCallback`.

**Accessibility**
- A listener left behind keeps acting on a dead element: a stray `keydown` handler can swallow keys the page needs (2.1.1 Keyboard).

**Check**
- *Script:* in Chrome, `document.createElement(tag)` must not throw and must return an element with `attributes.length === 0`; connect, disconnect and reconnect it and assert the inner markup is not duplicated; count `document` listeners through `getEventListeners(document)` (DevTools protocol) before connect and after disconnect.
- *Judgement:* What does this element attach to anything outside itself, and where is it detached?

**Sources:** as linked.

## Attributes, properties and reflection

**What good looks like**
- Every primitive setting (variant, size, a boolean) is both an attribute and a property, and they agree.
- Rich data (an array, an object) is a property only.
- A boolean is true when the attribute is present and false when it is absent, and defaults to false.
- A property set before the element was defined is not lost.

**How**
- **Both ways for primitives.** web.dev: "Always accept primitive data (strings, numbers, booleans) as either attributes or properties", "Aim to keep primitive data attributes and properties in sync", "Aim to only accept rich data (objects, arrays) as properties", "Do not reflect rich data properties to attributes" ([web.dev: custom element best practices](https://web.dev/articles/custom-elements-best-practices)).
- **The attribute is the source of truth for anything CSS keys on.** A variant axis is an attribute because the stylesheet selects on it (code-standard rule 9), so the getter reads the attribute and the setter writes it; `attributeChangedCallback` then does the side effects. This is web.dev's pattern for avoiding re-entrant loops ([web.dev](https://web.dev/articles/custom-elements-best-practices)).
  ```js
  static observedAttributes = ['variant'];
  get variant() { return this.getAttribute('variant') ?? 'primary'; }
  set variant(v) { this.setAttribute('variant', v); }
  ```
- **Booleans.** Present means true: `disabled="false"` is still true ([open-wc: attributes and properties](https://open-wc.org/guides/knowledge/attributes-and-properties/)). Lit: "For a boolean property to be configurable from an attribute, it must default to false" ([Lit: boolean attributes](https://lit.dev/docs/components/properties/#boolean-attributes)); Web Awesome: "Boolean props should *always* default to `false`" ([Web Awesome contributing](https://webawesome.com/docs/resources/contributing)). A default-on option is named for its opposite (`without-icon`, `hide-label`). Use `toggleAttribute(name, force)` to set one.
- **`observedAttributes` lists only what the element reacts to** ([MDN: responding to attribute changes](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements#responding_to_attribute_changes)). `attributeChangedCallback` runs once per observed attribute present at upgrade, before `connectedCallback` ([HTML: upgrade an element](https://html.spec.whatwg.org/multipage/custom-elements.html#concept-upgrade-an-element)), so it must not assume the inner nodes exist yet.
- **Lazy properties.** A framework or script may set `el.items = [...]` before the definition loads; the value then sits on the instance and shadows the class's setter. Capture and re-set it on upgrade: the `_upgradeProperty` pattern "captures the value from the unupgraded instance and deletes the property" ([web.dev](https://web.dev/articles/custom-elements-best-practices)). Lit does it for its declared properties ([Lit: reactive properties](https://lit.dev/docs/components/properties/)).
  ```js
  #upgrade(prop) {
    if (Object.hasOwn(this, prop)) { const v = this[prop]; delete this[prop]; this[prop] = v; }
  }
  connectedCallback() { ['items', 'variant'].forEach((p) => this.#upgrade(p)); }
  ```
- **Never self-apply `class`.** "Do not self-apply classes"; `class` belongs to the author ([web.dev](https://web.dev/articles/custom-elements-best-practices)). State the element owns is an attribute or a custom state (`ElementInternals.states`, styled with `:state()`) ([MDN: custom states](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements#custom_states_and_custom_state_pseudo-class_css_selectors)).

**Cases**
- `el.variant = 'danger'` changes the property and the button stays primary → the setter does not write the attribute the stylesheet keys on; make the attribute the source of truth.
- A getter treats `open="false"` as false → it breaks HTML's rule and every framework that renders `open="false"` disagrees with the browser's own elements; presence is true.
- A React wrapper sets `el.options` before the module loads and the list renders empty → upgrade the property in `connectedCallback`.
- An element adds `class="is-open"` to itself and the author's `class` binding wipes it on the next render → use an attribute or a custom state.

**Accessibility**
- A boolean that reads "false" as false and an ARIA state that reads the string do not agree; one source of truth keeps `aria-expanded` and the visual state together (4.1.2 Name, Role, Value).

**Check**
- *Script:* in Chrome, for each primitive property: set the property and read the attribute, set the attribute and read the property, and assert they agree (Gold Standard *Member Stability*: [wiki](https://github.com/webcomponents/gold-standard/wiki/Member-Stability)); set each boolean attribute to `"false"` and assert the property is `true`; create the element before its module loads, set every property, load the module and assert the values took effect. Static scan: every boolean property's default is `false`.
- *Judgement:* Which properties are rich data, and are any of them reflected?

**Sources:** as linked. web.dev says keep primitives in sync both ways; open-wc says reflect attribute to property but "avoid reflecting from properties to attributes" for performance ([open-wc](https://open-wc.org/guides/knowledge/attributes-and-properties/)); Lit says reflect "sparingly" ([Lit](https://lit.dev/docs/components/properties/#best-practices-when-reflecting-attributes)); FAST reflects by default ([FAST `AttributeMode`](https://fast.design/docs/3.x/api/fast-element.attributemode/)). The toolkit goes with web.dev for the attributes CSS selects on, because code-standard rule 9 makes the attribute the styling hook and a property that does not reach it styles nothing. Values that change often (a slider's live value, a scroll position) and rich data are properties only.

## Light DOM or shadow DOM

**What good looks like**
- The choice is made per element, for a reason the element states.
- In light DOM, the library's layered stylesheet reaches every part and the author's children stay where they wrote them.
- In shadow DOM, the styling interface is custom properties (and `::part` where needed), named and documented.

**How**
- The toolkit's default is light DOM; the reasons are in [javascript.md](javascript.md#web-components-when-they-earn-them) and code-standard rules 4 and 38.
- **What light DOM keeps.** A `<label for>` and `aria-labelledby` reach a control in light DOM; they cannot reach into a shadow root, and the platform fix (Reference Target) is approved to ship in Chromium (Chrome 151), not in Firefox or Safari ([Chromium: Intent to Ship Reference Target](https://groups.google.com/a/chromium.org/g/blink-dev/c/eBx3sXIfJnw)). A native `<form>` sees a light-DOM `<input>`; it does not see one inside a shadow root ([Shoelace: form controls](https://shoelace.style/getting-started/form-controls)). A native `change` event leaves a light-DOM wrapper by itself; inside a shadow root it stops at the root, because the spec fires `change` with bubbles but not composed, unlike `input` ([HTML: the input element](https://html.spec.whatwg.org/multipage/input.html), [MDN `composed`](https://developer.mozilla.org/en-US/docs/Web/API/Event/composed)).
- **What shadow DOM buys.** Style encapsulation, native `<slot>` projection, `delegatesFocus`, and children the element creates kept private ([web.dev](https://web.dev/articles/custom-elements-best-practices)). Choose it when the element is dropped into pages whose CSS the library does not control.
- **Either way:** set `display` on the host, and keep `hidden` working (code-standard rule 17); in shadow DOM that is `:host([hidden]) { display: none }` ([web.dev](https://web.dev/articles/custom-elements-best-practices)).

**Cases**
- A text field in shadow DOM and a `<label for="email">` on the page → the label points at nothing; move the input to light DOM, or label it from inside.
- A component sets `display: flex` on its host and a page writes `<ds-card hidden>` → it stays visible (code-standard rule 17).

**Accessibility**
- 1.3.1 Info and Relationships and 4.1.2: a label and its control must be related in the accessibility tree, which a shadow boundary breaks today.

**Check**
- *Script:* static scan: `attachShadow` appears only in elements whose source carries a comment naming why; in Chrome, set `hidden` on every element and assert `getComputedStyle(el).display === 'none'`; for each wrapped control, assert its accessible name through the accessibility tree (Puppeteer `page.accessibility.snapshot()`).
- *Judgement:* What would this element lose if its parts were styled by the page?

**Sources:** as linked. web.dev ("Create a shadow root to encapsulate styles"), Lit, Spectrum ("The shadow DOM is the heart of a web component", [Spectrum: adding a component](https://opensource.adobe.com/spectrum-web-components/guides/adding-component/)), Web Awesome, FAST and Carbon all default to shadow DOM. GitHub's Catalyst renders server HTML and enhances it, using shadow DOM only from a server-sent `template[data-shadowroot]`, and calls client rendering of what the server could render "an anti-pattern" ([Catalyst: rendering](https://github.github.io/catalyst/guide/rendering/)). The libraries that chose shadow DOM then needed form participation through `ElementInternals` or the `formdata` event, re-dispatched `change`, and cross-root ARIA workarounds. The toolkit goes with light DOM, because a generated component is styled by the library's own stylesheet and wraps a real control that must stay labellable and submittable.

## Rendering once, updating in place

**What good looks like**
- The element builds its inner markup once, on first connection.
- An attribute change updates the one node or attribute it affects; nothing else is replaced.
- Focus, text selection, an open state and the author's children all survive any attribute change.
- No value from an attribute or property is ever parsed as HTML.

**How**
- **Why not `this.innerHTML = \`…${this.label}…\``.** Two faults in one line. A value interpolated into a string is parsed as markup, so `label='<img src=x onerror=…>'` runs script; the sink and its fix are [javascript: escaping and templating safely](javascript.md#escaping-and-templating-safely). And assigning `innerHTML` destroys every descendant and makes new ones: the focused button is gone, so focus drops to `body`; a selection in an input is gone; and the children the author wrote inside the element are deleted ([MDN `innerHTML`](https://developer.mozilla.org/en-US/docs/Web/API/Element/innerHTML)). Restoring focus afterwards (code-standard rule 14) is the repair for a region swap; inside a component the fix is not to swap.
- **Render once.** On first `connectedCallback`, clone a `<template>` (or adopt the server's markup), keep references to the nodes that change, and leave a flag so a reconnect does not rebuild.
- **Update in place.** `attributeChangedCallback` maps each attribute to one write: `this.#label.textContent = v`, `this.#button.toggleAttribute('disabled', v !== null)`, `this.#icon.dataset.icon = v`. If the nodes do not exist yet (the callback runs before connection at upgrade), store the value and apply it at render.
  ```js
  attributeChangedCallback(name, _old, value) {
    if (!this.#rendered) return;            // render() reads attributes itself
    if (name === 'label') this.#label.textContent = value ?? '';
  }
  ```
- **This is what the libraries do.** Lit: "Lit parses and creates static HTML once, and then only updates changed values in expressions after that" ([Lit: rendering](https://lit.dev/docs/components/rendering/)); FAST binds template expressions to nodes the same way. A generated element without a library writes the same thing by hand: one update function per attribute.
- **Conditional parts.** Hide a part with `hidden` rather than removing and re-creating it; Web Awesome never conditionally renders a `<slot>`, so `slotchange` still fires ([Web Awesome contributing](https://webawesome.com/docs/resources/contributing)).
- **Custom elements in an HTML string are never self-closed.** `<ds-icon />` parses as an open tag in HTML and swallows what follows; write `<ds-icon></ds-icon>` ([HTML: non-void element start tag with trailing solidus](https://html.spec.whatwg.org/multipage/parsing.html#parse-error-non-void-html-element-start-tag-with-trailing-solidus): the slash is ignored and the tag stays open).

**Cases**
- A size change re-renders the element while the inner button has focus → focus drops to `body`; update the `data-size` attribute on the existing node.
- `<ds-card><p>Body</p></ds-card>` and the card's first render sets `innerHTML` → the paragraph is deleted; render around the existing children, or keep them in a light-DOM slot point (next section).
- An icon name from a CMS lands in `innerHTML` → set `dataset.icon` on the node; no escaping is needed.

**Accessibility**
- 2.4.3 Focus Order and 2.4.7 Focus Visible: a re-created control loses focus without the reader acting. 4.1.2: a screen reader re-reads a replaced subtree as new content.

**Check**
- *Script:* static scan: no `innerHTML`, `outerHTML` or `insertAdjacentHTML` with a template literal that interpolates, anywhere in an element class; no self-closing custom tag in a markup string. In Chrome: render, focus the inner control, change every observed attribute in turn and assert `document.activeElement` is unchanged and the inner control is the same node (`===` a reference taken before); set each string attribute to `<img src=x onerror="window.__xss=1">` and assert `window.__xss` is undefined and no `img` was created.
- *Judgement:* Which attribute change, if any, needs a structural change, and could `hidden` do it instead?

**Sources:** as linked.

## Children and slots

**What good looks like**
- The author's children appear without any extra attribute, method or style (Gold Standard *Children Visible*).
- The element works whatever its parent and whatever children it is given, and reacts when they change.
- In light DOM, the element never moves or deletes a child it did not create.

**How**
- **In the template language,** content is a slot of the server template (code-standard rule 13). The custom element then receives finished markup and has nothing to place.
- **A native `<slot>` works only inside a shadow root.** In light DOM, `<slot>` is an ordinary unknown element and assigns nothing ([MDN: using templates and slots](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_templates_and_slots)). A light-DOM element that must add its own parts around the author's content builds them around the existing children, or the server renders the whole structure and the element only enhances it, as Catalyst does ([Catalyst: rendering](https://github.github.io/catalyst/guide/rendering/)). Never invent placeholder tags such as `<slot-label>` in light DOM; they render as inline boxes and carry nothing.
- **Children may arrive late.** When the parser upgrades an element whose definition is already loaded, `connectedCallback` can run before its children are parsed: "at that point its children have not been added yet" ([MDN: customised built-in example](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements#customized_built-in_elements)). Load definitions with `type="module"` (deferred), or observe children with a `MutationObserver` (light DOM) or `slotchange` (shadow DOM, [MDN `slotchange`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLSlotElement/slotchange_event)).
- **Content changes.** The Gold Standard asks the element to respond to "runtime changes in its content" ([Gold Standard: Content Changes](https://github.com/webcomponents/gold-standard/wiki/Content-Changes)).

**Cases**
- A tabs element reads its panels in `connectedCallback` and finds none on a page that inlines the script → the children were not parsed yet; defer the module or observe.
- A list element sorts its children into a new order → Carbon: "the primary means for user to determine order in list item is ordering them in DOM" ([Carbon coding conventions](https://raw.githubusercontent.com/carbon-design-system/carbon-custom-elements/HEAD/src/coding-conventions.md)); leave the order to the author.

**Accessibility**
- 1.3.2 Meaningful Sequence: the reading order is the DOM order, so an element that moves children visually but not in the DOM, or the reverse, misleads a screen reader.

**Check**
- *Script:* in Chrome, mount each element with arbitrary children (text, a link, a nested component) and assert every child is still a descendant after upgrade and after each attribute change; static scan for unknown `<slot-*>` tags in light-DOM markup.
- *Judgement:* Does the element own its markup, or does the server? Only one of them should.

**Sources:** as linked.

## Wrapping a native control, or being one

**What good looks like**
- Where HTML has the control, the element wraps it, and the control does the work (code-standard rule 8).
- Where HTML has no element for the behaviour, the host takes the role, its states and its keyboard model, and defaults them through `ElementInternals` so the author can still override them.
- A host that is itself a form value participates in the form through `ElementInternals`, not hidden inputs.

**How**
- **Wrap first.** A light-DOM `<ds-button><button>…</button></ds-button>` gets focus, Enter and Space, `disabled`, form submission and its accessible name from the browser. No `role`, no `tabindex`, no key handler on the host.
- **Host semantics, only for a widget HTML lacks** (a tablist, a listbox with custom options). Default the role and states through `ElementInternals` (`this.#internals.role = 'tablist'`, `ariaSelected`); MDN: these "may be overwritten by author-defined attributes, but ensure that default semantics are retained should the author delete those attributes" ([MDN `ElementInternals`](https://developer.mozilla.org/en-US/docs/Web/API/ElementInternals)). WebKit's reason: setting a `role` attribute yourself "prevents users of this custom element to override ARIA role" ([WebKit: ElementInternals and form-associated custom elements](https://webkit.org/blog/13711/elementinternals-and-form-associated-custom-elements/)). If you must set an attribute, web.dev: "Do not override author-set, global attributes" such as `tabindex` and `role` ([web.dev](https://web.dev/articles/custom-elements-best-practices)). The keyboard model is the APG pattern's ([ARIA APG patterns](https://www.w3.org/WAI/ARIA/apg/patterns/)).
- **Form-associated custom elements.** `static formAssociated = true`, `this.#internals = this.attachInternals()` in the constructor, then `setFormValue()` for the value, `setValidity(flags, message, anchor)` for constraint validation, and the callbacks `formResetCallback`, `formDisabledCallback`, `formStateRestoreCallback` ([MDN `ElementInternals`](https://developer.mozilla.org/en-US/docs/Web/API/ElementInternals), [WebKit](https://webkit.org/blog/13711/elementinternals-and-form-associated-custom-elements/)). The element then gets `:invalid`, `form.elements` membership, `<fieldset disabled>` and form reset like a native control.
- **When each fits.** A light-DOM wrapper round a native `<input>`, `<select>` or `<button>` needs no form association: the native control is already in the form. Form association is for a host that is the control, with no native element holding the value (a rating made of stars, a colour well), or for any control in shadow DOM. Shoelace used the `formdata` event because "native `<form>` elements do not recognize form controls located inside a shadow root" ([Shoelace: form controls](https://shoelace.style/getting-started/form-controls)); Web Awesome's form controls extend a form-associated base and "must be tested to work with the standard `<form>` element" ([Web Awesome contributing](https://webawesome.com/docs/resources/contributing)).

**Cases**
- `<ds-checkbox role="checkbox" tabindex="0">` with a click handler → no Space key, no form value, no `disabled`; wrap `<input type="checkbox">`.
- A star rating built from five buttons and a hidden `<input>` → the hidden input is not validated or labelled; make the host form-associated and set its value and validity.
- A host defaults `role="tab"` as an attribute and an author changes it to `role="link"` for navigation tabs → the next render resets it; default through `ElementInternals.role`.

**Accessibility**
- 4.1.2 Name, Role, Value; 2.1.1 Keyboard; 3.3.1 Error Identification for validity a form-associated host reports.
- code-standard rules 8 and 9.

**Check**
- *Script:* in Chrome, for a wrapper: the inner native control is the only focusable descendant and the host has no `tabindex` or `role`; for a form-associated host: put it in a `<form>`, set a value, and assert `new FormData(form)` holds it, `form.reset()` restores the default, and `<fieldset disabled>` disables it (`el.matches(':disabled')`).
- *Judgement:* Which native element was tried, and what did it lack?

**Sources:** as linked.

## Disabled, ARIA states and focus delegation

**What good looks like**
- Disabled is the control's own `disabled` or `aria-disabled`, never an attribute on a wrapper box (code-standard rule 9).
- ARIA states (`aria-expanded`, `aria-selected`, `aria-pressed`) sit on the element that has the role, and change with the state they describe.
- Focus lands on the control, once; a wrapper is never its own tab stop.

**How**
- **Disabled.** For a wrapper, set `disabled` on the inner control; the [html-semantics cases](html-semantics.md#custom-elements) cover the wrapper mistake. For a form-associated host, `formDisabledCallback(disabled)` reports `disabled` from the host or an ancestor `<fieldset>`, and `:disabled` matches the host ([WebKit](https://webkit.org/blog/13711/elementinternals-and-form-associated-custom-elements/)). In a keyboard-navigable set, Web Awesome's rule is that a disabled item "should not receive focus via keyboard, click, or tap" ([Web Awesome contributing](https://webawesome.com/docs/resources/contributing)); the APG allows focusable disabled items in some composites, so follow the pattern in use.
- **`aria-disabled` versus `disabled`.** `aria-disabled` keeps the control focusable and discoverable but the script must block its action; `disabled` removes it from the tab order and from submission.
- **Focus delegation.** In shadow DOM, `attachShadow({ mode: 'open', delegatesFocus: true })` sends `host.focus()` and clicks on non-focusable parts to "the first focusable part inside the host's shadow DOM" and gives the host `:focus` ([MDN `delegatesFocus`](https://developer.mozilla.org/en-US/docs/Web/API/ShadowRoot/delegatesFocus)). MDN warns the first focusable may be the wrong one; check it. In light DOM there is nothing to delegate: the inner control is focusable on its own, and the host takes no `tabindex`.
- **Roving focus** in a composite (tabs, toolbar, listbox): one `tabindex="0"` in the set, the rest `-1`, arrows move it ([APG: keyboard interface](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/)). Spectrum ships it as a shared controller ([Spectrum: roving tab index](https://opensource.adobe.com/spectrum-web-components/tools/roving-tab-index/)).

**Cases**
- A wrapper with `tabindex="0"` round a `<button>` → two tab stops for one control; remove the host's.
- `aria-expanded` set on the wrapper while the `<button>` toggles the panel → the state is on an element with no role; move it to the button.
- A shadow-DOM dialog with `delegatesFocus` focuses its close button first → put `autofocus` on the field that should take focus, as MDN suggests.

**Accessibility**
- 2.1.1 Keyboard, 2.4.3 Focus Order, 2.4.7 Focus Visible, 4.1.2 Name, Role, Value.

**Check**
- *Script:* `tools/css-lint` already flags `disabled` or a non-ARIA `role` on a custom element (code-standard rule 9). In Chrome, Tab through a story and assert one stop per control and that `document.activeElement` is the native control, never the host; toggle each state and assert the ARIA attribute on the role-bearing element changes with it.
- *Judgement:* Should this disabled item be discoverable (`aria-disabled`) or gone from the tab order (`disabled`)?

**Sources:** as linked.

## Events

**What good looks like**
- Native events from the native control reach the page unchanged; the element adds nothing for them.
- The element fires its own event only for something it alone knows (a tab selected, a panel opened), named in the library's namespace.
- The element never fires an event because the page set one of its properties.

**How**
- **Let native events through.** In light DOM, `click`, `input` and `change` from the inner control bubble through the host to the page with no help. Re-dispatching them doubles them.
- **Its own events.** `this.dispatchEvent(new CustomEvent('ds-tab-select', { bubbles: true, composed: true, detail: { index } }))` ([MDN `CustomEvent()`](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/CustomEvent)). Names are lower case and kebab-style: Web Awesome requires a prefix and lower-case kebab names "for compatibility with frameworks that utilize DOM templates" ([Web Awesome contributing](https://webawesome.com/docs/resources/contributing)). `bubbles: true` so delegation works ([javascript: events and delegation](javascript.md#events-and-delegation)); `composed: true` only matters if the event starts inside a shadow root and must leave it ([MDN `composed`](https://developer.mozilla.org/en-US/docs/Web/API/Event/composed)). `detail` holds data, never DOM nodes the page should not touch.
- **A cancelable event before an action** (`ds-before-close` with `cancelable: true`, act only if `dispatchEvent` returns `true`) lets the page veto; Carbon does this for its modal ([Carbon coding conventions](https://raw.githubusercontent.com/carbon-design-system/carbon-custom-elements/HEAD/src/coding-conventions.md)).
- **Not on the host's own changes.** "Do not dispatch events in response to the host setting a property" ([web.dev](https://web.dev/articles/custom-elements-best-practices)); the Gold Standard says change events are raised "only when internal activity changes a property" ([Gold Standard: Property Change Events](https://github.com/webcomponents/gold-standard/wiki/Property-Change-Events)).
- Catalyst: talk to parents through events, not by reaching up the tree ([Catalyst anti-patterns](https://github.github.io/catalyst/guide/anti-patterns/)).

**Cases**
- A wrapper listens for `click` on its button and dispatches `ds-click` → the page gets two events for one click; delete the re-dispatch.
- Setting `el.open = true` fires `ds-open` and a framework binding sets `open` in response → a loop; fire only when the user opened it.
- An event named `tabSelect` → an HTML-template framework cannot bind it (attributes are lower-cased); `ds-tab-select`.

**Accessibility**
- No direct criterion; an event that fires twice or never can leave an announced state out of step (4.1.3 Status Messages).

**Check**
- *Script:* static scan: every `new CustomEvent(` name matches `^ds-[a-z]+(-[a-z]+)*$`, and no element dispatches an event whose name, unprefixed, is a native one; in Chrome, count `click` and `change` events on `document` for one user action and assert one each; set every property and assert no custom event fired.
- *Judgement:* What does this event tell the page that a native event does not?

**Sources:** as linked. Shoelace fired prefixed copies of native events (`sl-input`, `sl-change`) and told authors to "almost always listen for custom events instead" ([Shoelace: usage](https://shoelace.style/getting-started/usage)); its successor Web Awesome dropped them for the native names on the host ([Web Awesome migration checklist](https://webawesome.com/docs/resources/migration-checklist)). The copies existed because the real control sat in shadow DOM, where `change` does not leave the root. The toolkit goes with native events and no copies: in light DOM they already arrive.

## Before definition: `:defined` and progressive enhancement

**What good looks like**
- Before the script loads, or if it fails, the server's markup is readable and every native control in it works.
- Nothing is hidden waiting for a definition.
- The upgrade changes behaviour and adds polish; it does not move the layout.

**How**
- `:defined` matches built-in elements and custom elements once defined; `:not(:defined)` matches the rest ([MDN `:defined`](https://developer.mozilla.org/en-US/docs/Web/CSS/:defined)). The toolkit's use, "usable, not hidden", is [javascript.md](javascript.md#web-components-when-they-earn-them); its principle is [javascript: progressive enhancement](javascript.md#progressive-enhancement).
- The Gold Standard's *Children Visible* asks that initial children show "without extra attributes, methods, handlers, or styles" ([Gold Standard](https://github.com/webcomponents/gold-standard/wiki)); Catalyst: "make your JavaScript progressively enhanced, where possible", and client rendering "can also impact the CLS Web Vital" ([Catalyst: rendering](https://github.github.io/catalyst/guide/rendering/)).
- A wrapped native control is usable before definition by construction: the `<button>` is there. A behaviour-heavy element serves its fallback (all tab panels shown, each with its heading) and the upgrade collapses it.
- The Gold Standard also asks for a "Static Initial Render": no animated transition on first render ([Gold Standard](https://github.com/webcomponents/gold-standard/wiki)).

**Cases**
- `ds-tabs:not(:defined) { display: none }` and the script fails on one network → the whole section is gone; show the panels in sequence instead.
- The upgraded element is 40px taller than the server's markup → layout shift on load; size the fallback the same.

**Accessibility**
- 1.3.1 and 2.1.1 hold before the script runs, because native elements carry them.

**Check**
- *Script:* in Chrome with JavaScript disabled (or the module blocked), load each story and assert no element is `display: none` or `visibility: hidden` that is visible after upgrade, and every native control can be focused; measure layout shift across the upgrade with a `PerformanceObserver` for `layout-shift`. Static scan: no `:not(:defined)` rule sets `display: none`, `visibility: hidden` or `opacity: 0`.
- *Judgement:* What does a reader get if the script never arrives?

**Sources:** as linked. MDN's `:defined` example greys out the undefined element and overlays "Loading..." to avoid "flashes of ugly unstyled elements" ([MDN `:defined`](https://developer.mozilla.org/en-US/docs/Web/CSS/:defined)); Shoelace recommends `:not(:defined) { visibility: hidden }` against a "Flash of Undefined Custom Elements", noting elements "can potentially appear one by one" ([Shoelace: usage](https://shoelace.style/getting-started/usage)). The toolkit goes with usable markup: hiding turns a slow or failed script into missing content.

## Server rendering and declarative shadow DOM

**What good looks like**
- The server sends the element's full markup; the client enhances it rather than building it.
- An element with shadow DOM can be server rendered with a declarative shadow root and hydrates it rather than replacing it.

**How**
- **Light DOM:** the server template is the markup (code-standard rule 13); the element finds its parts on connection. This is the simplest server-rendered component there is.
- **Declarative shadow DOM:** "A Declarative Shadow Root is a `<template>` element with a `shadowrootmode` attribute"; in the constructor, "check `ElementInternals.shadowRoot` for any existing shadow root" and only call `attachShadow()` if there is none ([web.dev: declarative shadow DOM](https://web.dev/articles/declarative-shadow-dom)). It is not created by `innerHTML`; use `setHTMLUnsafe()` ([MDN `setHTMLUnsafe()`](https://developer.mozilla.org/en-US/docs/Web/API/Element/setHTMLUnsafe)). `shadowrootdelegatesfocus` is its `delegatesFocus` ([MDN `delegatesFocus`](https://developer.mozilla.org/en-US/docs/Web/API/ShadowRoot/delegatesFocus)).
- **Server-safe code.** Lit's server renderer runs the constructor (with its property setters, `willUpdate` and `render`) and not `connectedCallback` ([Lit: authoring for SSR](https://lit.dev/docs/ssr/authoring/)), so a browser-only API in the constructor needs a guard; Web Awesome's guide says `connectedCallback` runs too and guards with `isServer` ([Web Awesome contributing: SSR](https://webawesome.com/docs/resources/contributing)). Keeping the constructor empty (above) keeps it server-safe either way.

**Cases**
- A server sends `<ds-dialog>` empty and the client fills it → nothing to read without JavaScript and a shift on load; render it on the server.
- A component calls `attachShadow` unconditionally on a server-rendered element → it throws, because the declarative root is already attached; reuse it.

**Accessibility**
- Server markup is read by assistive technology before any script; it carries the semantics (code-standard rule 1).

**Check**
- *Script:* in Chrome, load the server HTML with scripts blocked and assert the element's text is present; for shadow-DOM elements, load with a declarative root and assert `attachShadow` was not called twice (no error in the console, Gold Standard *Clean Console*).
- *Judgement:* Which parts of this element exist only because a script made them?

**Sources:** as linked.

## Typings and the Custom Elements Manifest

**What good looks like**
- `document.querySelector('ds-tabs')` is typed as the element's class.
- One machine-readable file lists every element's attributes, properties, events, slots, parts and custom properties, and the docs, the IDE and the stories read it.

**How**
- **Tag map.** Lit: "We recommend adding an `HTMLElementTagNameMap` entry for all elements authored in TypeScript" ([Lit: defining a component](https://lit.dev/docs/components/defining/)):
  ```ts
  declare global { interface HTMLElementTagNameMap { 'ds-tabs': DsTabsElement } }
  ```
  For JavaScript sources, ship the same in a `.d.ts`.
- **Custom Elements Manifest.** `custom-elements.json`, "a file format that describes custom elements", generated by `cem analyze`; it infers fields, attributes and dispatched events, and takes JSDoc for the rest: `@attr`, `@fires`, `@slot`, `@csspart`, `@cssprop`, `@cssState` ([CEM analyzer](https://custom-elements-manifest.open-wc.org/analyzer/getting-started/)). Spectrum builds its API tables from the source the same way ([Spectrum: adding a component](https://opensource.adobe.com/spectrum-web-components/guides/adding-component/)).
- **For a generated library,** the contract already knows every attribute and event, so the generator writes the manifest and the tag map from it, rather than analysing its own output (code-standard rule 36: one source).
- Hide internals: Gold Standard *Hide Internal Members* ([wiki](https://github.com/webcomponents/gold-standard/wiki/Hide-Internal-Members)); use `#private` fields, which the manifest leaves out.

**Cases**
- `querySelector('ds-tabs').selectedIndex` is a type error → add the tag map entry.
- The docs list an attribute the element no longer reads → the docs were hand-written; generate them from the manifest.

**Accessibility**
- None directly; a documented `aria-*` contract (which attribute the author may set) belongs in the manifest's descriptions.

**Check**
- *Script:* static scan: every defined tag has a `HTMLElementTagNameMap` entry and a manifest entry; for each element, the manifest's attributes equal `observedAttributes` (read in Chrome from the class) and its events equal the `CustomEvent` names in the source.
- *Judgement:* Is anything public that only the element should use?

**Sources:** as linked.

## Stories for web components

**What good looks like**
- One story per variant and state the contract names, rendering the element as an author would write it.
- Story arguments become attributes for primitives and properties for rich data, through a template that escapes them.
- Controls come from the manifest, not from a hand-kept list.

**How**
- **CSF3 with lit-html.** A story is an object with `args` and, for web components, a `render` that returns a lit-html template; CSF3 also gives a default render from the meta's `component` ([Storybook: writing stories](https://storybook.js.org/docs/writing-stories?renderer=web-components), [Storybook: CSF](https://storybook.js.org/docs/api/csf?renderer=web-components)).
  ```js
  import { html } from 'lit';
  export default { component: 'ds-button', args: { variant: 'primary', label: 'Save' } };
  export const Primary = {
    render: ({ variant, label, disabled }) =>
      html`<ds-button variant=${variant}><button ?disabled=${disabled}>${label}</button></ds-button>`,
  };
  ```
- **Why lit-html and not a string.** Lit parses the template before any value is interpolated, so a value is text or an attribute value, never markup; `?attr=` adds or removes a boolean and `.prop=` sets a property ([Lit: expressions](https://lit.dev/docs/templates/expressions/)). A story that builds `\`<ds-button variant="${args.variant}">\`` has the same fault as the element that does it. Without lit-html, build the node with `document.createElement` and `setAttribute`.
- **Controls from the manifest.** Storybook infers web-component `argTypes` from `custom-elements.json` ([Storybook: ArgTypes](https://storybook.js.org/docs/api/arg-types?renderer=web-components)), through `setCustomElementsManifest` in `.storybook/preview`.
- **Story ids are parity's input.** The parity loop maps each variant and layer to a story and selector; see the `design-code-parity` skill.

**Cases**
- A story's `label` control set to `<b>bold</b>` renders bold → the story concatenates a string; use lit-html.
- A boolean control turned off renders `disabled="false"` → still disabled; bind with `?disabled=`.

**Accessibility**
- A story with the real native control inside is what an accessibility scan (axe in the test runner) can judge; a story of a bare host cannot.

**Check**
- *Script:* static scan: no story `render` returns a template literal that is not tagged with `html`; set every string arg to `<img src=x onerror="window.__xss=1">` in the test runner and assert nothing ran; every manifest attribute has a story arg.
- *Judgement:* Does every story render the element the way a page author would write it?

**Sources:** as linked.
