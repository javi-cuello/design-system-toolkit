# The button loading state

Whether loading is a boolean, a `State` value, or its own component, and why most shipping libraries quietly treat it as disabled even when their own API says otherwise.

Researched August 2026. Every prop name, source file and issue cited below was checked against the system's own repository, package source or current documentation this session, not against its docs alone. Where a claim rests on practitioner commentary rather than a shipping system, it says so.

---

## What this answers

The question usually arrives as a Figma question: should Loading be another value on the `State` dropdown, or a separate property? That question carries an assumption code does not share, so the guide works through the whole thing:

- Why does Figma's `State` dropdown make this feel harder than it is?
- What do shipping component libraries actually put on a button for loading?
- Should loading live in its own component instead of a boolean?
- Does loading actually behave differently from disabled, or only on paper?
- What makes a loading button feel controlled rather than jumpy?
- When has loading outgrown a plain button?
- In Figma, does loading belong on `State`, or as its own property?

Section 8 is the table to hand your engineers. Section 9 is the short version.

---

## 1. Why does Figma's `State` dropdown make this harder than it should be?

**The short answer.** `State` quietly bundles two unrelated mechanisms, browser pseudo-classes and developer-set props, and nothing in the file says which is which.

Open a typical Figma button and the `State` property reads like a list where one value is true at a time: Default, Hover, Pressed, Focused, Disabled. Compare that with what each of those actually is once the component ships.

| Figma `State` value | What it is in code | Who sets it | Can it combine with others? |
|---|---|---|---|
| Default | the absence of the others | nobody | n/a |
| Hover | `:hover` | the browser, from pointer position | yes, with focus |
| Focused | `:focus-visible` | the browser, from focus and input modality | yes, with hover |
| Pressed | `:active` | the browser, while the pointer is down | yes, with hover and focus |
| Disabled | the `disabled` attribute or `aria-disabled` | the developer, from application state | blocks the others |
| Loading | a `loading` prop | the developer, from application state | blocks the others |

The first three are **pseudo-classes**: selectors the browser matches against live conditions it tracks itself. No developer writes them into markup, and no component API can expose them, because there is nothing to expose. The last two are **props**: values passed into a component by the code rendering it, driven by application state a designer cannot see from the canvas.

Design tools do not distinguish those two categories, and that gap is the entire source of the confusion. It is also why "should loading be a state" resists a direct answer: three of the five things sitting beside it on that list are not states a developer can set at all.

The honest version of the question splits into three. What shape does loading take in code? What should the loading condition actually do to the button? And what is the cheapest faithful way to show both of those things in Figma? Sections 2 through 7 answer each in turn.

**What to do.** Keep treating `state` as one axis in the Figma UI if that is what your team is used to, but stop treating it as one *concept* when you write the spec that goes with it. The two mechanisms have different owners and different failure modes, and every decision below depends on knowing which one is in front of you. This distinction is uncontroversial in any codebase and almost universally invisible in a component's Figma file.

---

## 2. What do shipping libraries actually put on a button for loading?

**The short answer.** Every library surveyed makes it a boolean at the prop level. None ships `state="loading"` as an enum value. But the prop-level story and the DOM-level story diverge, which section 4 covers in full.

| System | Prop | Type | Verified against |
|---|---|---|---|
| Shopify Polaris (web components, current) | `loading` | boolean | [Polaris web components Button](https://shopify.dev/docs/api/app-home/polaris-web-components/actions/button) |
| Shopify Polaris (React, archived) | `loading` | boolean | [polaris-react-archive source](https://github.com/Shopify/polaris-react-archive/blob/main/polaris-react/src/components/Button/Button.tsx) |
| MUI | `loading` | `boolean \| null`, default `null` since v6.4.0 | [MUI Button](https://mui.com/material-ui/react-button/), [Button.js source](https://github.com/mui/material-ui/blob/master/packages/mui-material/src/Button/Button.js) |
| Atlassian, legacy `@atlaskit/button` | `isLoading` | boolean, on a separate `LoadingButton` export | package [report.api.md](https://github.com/pioug/atlassian-frontend-mirror/blob/master/design-system/button/report.api.md) |
| Atlassian, redesigned Button/IconButton/LinkButton | `isLoading` | boolean, on the shared `CommonButtonProps` | [new-button variant types](https://github.com/pioug/atlassian-frontend-mirror/blob/master/design-system/button/src/new-button/variants/types.tsx) |
| Adobe React Aria / React Spectrum S2 | `isPending` | boolean | [React Aria Button](https://react-aria.adobe.com/Button), [React Spectrum Button](https://react-spectrum.adobe.com/react-spectrum/Button.html) |
| GitHub Primer | `loading` | boolean, plus `loadingAnnouncement` string | [ButtonBase source](https://github.com/primer/react/blob/main/packages/react/src/Button/ButtonBase.tsx), [types.ts](https://github.com/primer/react/blob/main/packages/react/src/Button/types.ts) |
| GitLab Pajamas | `loading` | boolean | [GlButton docs](https://design.gitlab.com/components/button/) |
| Chakra UI | `loading` | boolean, renamed from `isLoading` in v3 | [Button docs](https://www.chakra-ui.com/docs/components/button), [button.tsx source](https://github.com/chakra-ui/chakra-ui/blob/main/packages/react/src/components/button/button.tsx) |
| Ant Design | `loading` | `boolean \| { delay: number, icon: ReactNode }` | [Ant Design Button](https://ant.design/components/button), [Button.tsx source](https://github.com/ant-design/ant-design/blob/master/components/button/Button.tsx) |
| Radix Themes | `loading` | boolean | [Radix Themes Button](https://www.radix-ui.com/themes/docs/components/button) |
| IBM Carbon | none | deliberate; see section 6 | [Carbon Inline loading](https://carbondesignsystem.com/components/inline-loading/usage/) |

There is no `state="loading"` in any of these, because the enum a Figma `State` dropdown implies does not exist on the code side. That part of the industry consensus is real and total.

**Two things worth naming inside this table.** First, Chakra's rename from `isLoading` to `loading` in v3 is small on its own but costly for a design file: a component built against v2, with a Code Connect snippet emitting `isLoading={true}`, now generates an argument the current library silently drops. The `is`-prefix convention is actively churning across the roster: Chakra dropped it, Adobe kept it (`isPending`), Atlassian kept it on both button generations. Second, Atlassian ships two answers to "is loading part of Button" from a single npm package: the legacy entry point's plain `Button` never had loading; only its sibling `LoadingButton` export does. The redesigned entry point folds `isLoading` directly into the `CommonButtonProps` shared by `Button`, `IconButton` and `LinkButton`. Both live in `@atlaskit/button` today, one generation behind the other.

**What to do.** Whatever ships in Figma will map to a boolean, most likely called `loading`, `isLoading` or `isPending`. Name the Figma value to match the prop your own codebase actually uses today, and re-check it whenever that library majors, since the prefix convention is not settled industry-wide. A prop name matching your library's is necessary but not sufficient: section 4 shows that two libraries can expose an identical-looking `loading: boolean` and do opposite things with it underneath.

---

## 3. Should loading live in its own component?

**The short answer.** No. The clearest trial reversed, in the open, for reasons that do not transfer to a Figma library.

**MUI is the clean case, because its history is fully public.** Loading lived for years in a separate `LoadingButton`, shipped in the `@mui/lab` package. A request to add loading directly to the plain `Button` was opened in June 2017 ([issue #7223](https://github.com/mui/material-ui/issues/7223)). By 2024 the objection had sharpened into something narrower and more measurable: installing an entire lab package to get one loading button was pure dependency overhead ([issue #42684](https://github.com/mui/material-ui/issues/42684)). MUI agreed, added `loading`, `loadingPosition` and a `loadingIndicator` slot to `Button` directly, merged the change in January 2025 ([PR #44637](https://github.com/mui/material-ui/pull/44637)), and marked the old `LoadingButton` for removal.

One implementation detail from that PR carries a lesson worth generalising: when `loading` is typed as a plain boolean, MUI keeps the loading wrapper `<span>` permanently present in the DOM rather than inserting it conditionally, because conditional insertion crashed under Google Translate ([issue #27853](https://github.com/mui/material-ui/issues/27853)). The prop defaults to `null` rather than `false` specifically so existing projects never pay for a wrapper they never opted into. A Figma component will never need to model that constraint, because nothing in Figma runs Google Translate over a rendered page. It is a reminder that some costs a component pays are about the runtime, not the concept, and do not belong in a design file even when they show up in the code.

**Atlassian shows the current state of a similar split**, though the reasoning behind the original separation was not re-confirmed this session and should be treated as unverified rather than restated as fact. What is confirmed directly from source: the legacy `@atlaskit/button` package still keeps `isLoading` off the plain `Button` entirely, on a sibling `LoadingButton` export only. The redesigned generation of the same package, exporting `Button`, `IconButton` and `LinkButton` from a `new` entry point, defines `isLoading` on the `CommonButtonProps` all three share. One npm package, two generations, two different answers, with the newer one folding loading back into the base component.

**The case for separation, stated fairly.** Consumers who never show a loading state pay nothing for it. The loading behaviour can version independently of the base component. And the base component's prop surface stays smaller, which is a real cost: MUI's `Button` prop list is long, and every prop on it is something every consumer reads past even when they never use it.

**Why it tends to lose anyway.** Splitting one concept across two import paths means the answer to showing a button loading depends on which package a given codebase already has installed, before a developer has written a line of the actual feature. It forces a component swap at the call site rather than a prop change, which is a structurally different kind of edit, harder to drive purely from application state. It duplicates the base component's entire prop surface, so both trials produced a wrapper forwarding every appearance, size and icon prop across two files with drift as a permanent tax. And the bundle-size argument that motivated MUI's original split has weakened as modern bundlers tree-shake more aggressively, the very argument MUI's own 2025 PR cited when merging the packages back together.

The only libraries shipping no loading prop at all are the deliberately unopinionated ones. Radix Primitives ships no styled `Button` to attach one to. shadcn/ui expects consumers to compose `disabled` with a spinning icon themselves. That reflects a philosophy about distributing unstyled primitives, not evidence that loading is conceptually separate from a button.

**What to do.** Do not model loading as a separate component set in a Figma library. The clearest public trial (MUI) reversed, and the surviving argument for separation, bundle size, has no analogue at Figma's consumption model, where an unused variant costs nothing to the file that never touches it. This section is well evidenced for MUI specifically; the Atlassian data point is real but its underlying rationale should be re-verified before it is repeated as a second independent reversal.

---

## 4. Does loading actually behave differently from disabled, or only on paper?

**The short answer.** It should. Checked against source code rather than documentation, most shipping libraries do not make it behave differently: of nine libraries whose Button source was read this session, only two decouple loading from the native `disabled` attribute by default, and a third does so only partially.

**Start with what the `disabled` attribute actually does**, because the problem is that it does three things at once: it blocks activation, it removes the element from the tab order, and it typically removes it from the accessibility tree's interactive surface. The first is wanted during loading. The second and third are not, and the HTML attribute gives no way to take only the first.

Losing tab order means the person who just pressed the button loses their place in the page. GitLab's tracker states the symptom directly: focus is lost, and the user has to re-traverse the DOM to find their way back ([issue #2981](https://gitlab.com/gitlab-org/gitlab-services/design.gitlab.com/-/issues/2981)).

**What the guidance says to build instead:**

```html
<!-- Present on page load, empty until needed -->
<div id="save-status" class="visually-hidden" aria-live="polite"></div>

<button aria-disabled="true">
  <span class="spinner" aria-hidden="true"></span>
  Save
</button>
```
```js
button.addEventListener('click', (e) => {
  if (button.getAttribute('aria-disabled') === 'true') {
    e.preventDefault()
    return
  }
  button.setAttribute('aria-disabled', 'true')
  document.getElementById('save-status').textContent = 'Saving profile'
})
```

GitLab's `GlButton` matches this shape as shipped default behaviour, confirmed by reading the button's current documentation rather than an in-progress proposal: "the button _appears_ disabled and in the loading state, but remains focusable," with `aria-disabled` set and the native `disabled` attribute unset ([GlButton docs](https://design.gitlab.com/components/button/)). This was not always the default. GitLab's accessibility epic tracked a three-phase rollout: an opt-in `accessibleLoading` prop, a feature-flagged test period, then a cleanup phase that made focusable loading the default and **removed the prop entirely** ([epic #19676](https://gitlab.com/groups/gitlab-org/-/epics/19676)). Anything citing `accessibleLoading` as a flag consumers still need to set is describing an intermediate state that no longer exists.

**GitHub Primer's source goes further than its own docs page currently documents.** Primer's `Button` accessibility page tells consumers to build their own visually hidden `aria-live="polite"` region ([accessibility docs](https://primer.style/product/components/button/accessibility/)). Reading `ButtonBase.tsx` directly shows the component already ships one: `loading` sets `aria-disabled` (never native `disabled`), keeps the `onClick` handler detached rather than firing and blocking, and renders a hidden `AriaStatus` element, referenced via `aria-describedby`, containing a default announcement of "Loading" that is customisable through a `loadingAnnouncement` prop ([ButtonBase source](https://github.com/primer/react/blob/main/packages/react/src/Button/ButtonBase.tsx)). This gap between the docs page and the shipped component is not a guess: it is the subject of an open Primer issue asking to document the built-in announcement, filed because the current docs page "can encourage consumers to write their own implementation, resulting in double announcements" ([issue #7881](https://github.com/primer/react/issues/7881), opened May 2026, unresolved as of this research). A Figma-shaped detail sits in the same file: the loading wrapper renders whenever `loading` is anything other than `undefined`, even while `false`, specifically because conditionally mounting it later causes the button to lose focus on the next transition. Same underlying rule as GOV.UK's live region needing to exist on page load, applied to a component's own internal markup rather than to the page around it.

**Adobe's React Aria and React Spectrum S2 state the same contract as a one-line guarantee**: "Pending buttons remain focusable, but are otherwise disabled," and pending changes are announced to screen readers ([React Aria Button](https://react-aria.adobe.com/Button)). Delaying the spinner's appearance is done with `opacity: 0` rather than `visibility: hidden` or `display: none`, because the latter two remove the element from the accessibility tree along with the announcement it carries.

**That is the full list of libraries in this roster that decouple loading from native `disabled` by default and also announce it.** Two more get partway there. Ant Design's native `<button disabled={mergedDisabled}>` genuinely excludes `loading` from `mergedDisabled`, so a loading-only button stays in the tab order and click is blocked purely in the JavaScript handler ([Button.tsx source](https://github.com/ant-design/ant-design/blob/master/components/button/Button.tsx)); no `aria-live` or `aria-busy` announcement was found anywhere in the component's source, so the state change is silent to a screen reader even though focus survives it.

**The rest fold loading straight into the native `disabled` attribute**, the exact pattern the guidance above argues against, confirmed by reading each component's render output rather than its marketing copy:

| System | Native `disabled` while loading? | Announced to assistive tech? |
|---|---|---|
| GitLab Pajamas | No | Not documented beyond the focusable/`aria-disabled` contract |
| GitHub Primer | No | Yes, `aria-describedby` + built-in `loadingAnnouncement` |
| Adobe React Aria / Spectrum S2 | No | Yes, stated explicitly in the API contract |
| Ant Design | No | Not found in source |
| Shopify Polaris (web components) | **Yes** — docs state loading "also disables the button component" | Not documented |
| Shopify Polaris (React, archived) | **Yes** — `isDisabled = disabled \|\| loading`, passed through to `tabIndex={isDisabled ? -1 : undefined}` | `aria-busy` set on the button; testing (below) found weak support |
| MUI | **Yes** — `disabled={disabled \|\| loading}` on the native element | No live region; the loading indicator's `aria-labelledby` just re-points at the button's own label |
| Chakra UI | **Yes** — `disabled={loading \|\| rest.disabled}` | No |
| Radix Themes | **Yes**, and documented as intentional | Not applicable; Radix states the button is disabled |

Polaris is the sharpest correction to carry forward here. Its own archived React source computes `isDisabled = disabled || loading` before the button ever renders, which removes a loading-only button from the tab order exactly like a disabled one, and its current web-components documentation states the same thing in prose: loading "also disables the button component." The React implementation additionally sets `aria-busy` on the button, a pattern Adrian Roselli's screen-reader testing found only JAWS 2020 honoured; Narrator, NVDA, TalkBack and VoiceOver all "treat this content as any other" ([More Accessible Skeletons](https://adrianroselli.com/2020/11/more-accessible-skeletons.html)). Polaris's own accessibility tracker catalogued exactly this cluster of problems on its loading button in 2018, with VoiceOver and NVDA users hearing stale labels, no update at all, or "alert unavailable busy save product" ([issue #1212](https://github.com/Shopify/polaris/issues/1212)). That issue closed via an inactivity bot rather than a linked fix, and the button's current shipped markup still sets `aria-busy` with a `role="status"` spinner label rather than the `aria-disabled` and live-region shape GitLab, Primer and Adobe converged on independently. Whatever secondary source repeats "Polaris fixed its loading announcement," verify it against the component source before citing it as settled.

**Five named traps, each with a real system behind it:**

**The `disabled` attribute itself.** The one-line way to block a second click, and the majority pattern in this table's second half: it drops focus and can remove the control from a screen reader's interactive surface, in libraries that expose a conceptually distinct `loading` prop specifically to avoid that outcome.

**The grey fill**, where a Figma Loading variant reuses the Disabled variant's colours because it visually "reads as inactive." This specifies the wrong behaviour to whoever builds it, and disabled colours are frequently exempted from contrast minimums on the (correct, for actually-disabled controls) assumption that nobody needs to read them; a genuinely busy control does need to be read.

**`aria-busy` as the whole announcement strategy.** The attribute name says exactly what a designer wants conveyed, and support does not match the name; Roselli's testing found one screen reader honouring it out of five tested, and Polaris's own 2018 issue documents the resulting confusion first-hand.

**A live region created on demand**, where the status element is inserted into the DOM at the same moment its text is set. It looks tidier than an always-present empty `<div>`, and it is unreliable, because screen readers register live regions at parse time; both Primer's own source (which renders its `AriaStatus` wrapper unconditionally once `loading` is set at all, not only when `true`) and GOV.UK's guidance treat this as load-bearing rather than incidental.

**Duplicate announcements**, the newest trap on this list and the one an open issue is arguing about right now: pairing a component's own built-in announcement with a hand-built `aria-live` region on top of it. Primer's docs page currently recommends building a live region without mentioning the component already renders one via `loadingAnnouncement`, and the resulting risk, screen readers announcing the same status change twice, is the entire subject of the still-open issue cited above. The mechanism generalises past Primer: before adding a live region around any library's loading button, check the component's own source or changelog for one first.

**The honest counter-example, stated as a choice rather than an oversight.** Radix Themes ships `loading` and documents plainly that the button will be disabled while it is true. Given the table above, Radix is not the outlier this argument implied a year ago; it is one voice in a real split, alongside Polaris, MUI and Chakra, none of which are small or under-resourced projects. Radix's own priority is a small, predictable API surface over behavioural nuance, and it leaves the accessible variant to whoever consumes it. Copy that behaviour knowingly if that is the trade a project wants, not by default.

**What to do.** Build the Loading appearance from the *enabled* style, not the disabled one, and write `aria-disabled` rather than `disabled` into the component spec, with a live region that exists in the markup before it is ever needed. What breaks otherwise is concrete: the person who just pressed the button loses their keyboard position at the exact moment they are waiting for a result, and a screen reader announces nothing, a stale label, or an unpredictable status string depending on which of five screen reader and browser combinations it happens to be. GitLab, Primer and Adobe reached this pattern independently, which is real convergence rather than one decision echoed. But it is not the industry default: adopting Polaris, MUI, Chakra or Radix's loading behaviour as shipped means inheriting the same focus loss this section argues against, and the fix has to be built on top of the library, not assumed from it.

---

## 5. What makes a loading button feel controlled rather than jumpy?

**The short answer.** Reserve the resting width, delay the spinner by roughly a second, and treat the spinner as feedback only, never as protection against a second submission.

Three specific behaviours separate a polished loading button from a jumpy one, each preventing one identifiable failure.

**Width stability.** Atlassian's Forge UI Kit documents hiding the button's text and showing a spinner in its place while explicitly maintaining the width the button would have had with the label visible ([Forge UI Kit Button](https://developer.atlassian.com/platform/forge/ui-kit/components/button/)). Chakra takes a different route: its `loadingText` prop keeps a label visible ("Submitting") beside the spinner rather than replacing the button's own text ([Chakra Button docs](https://www.chakra-ui.com/docs/components/button)).

Both approaches are legitimate. What is not: a button that resizes when loading starts, because a button that shrinks or grows mid-interaction moves everything around it at the exact moment the user's pointer is still nearby. Replacing the label holds width naturally but stops naming the action while it runs, which costs the most for screen-magnifier users tracking a small viewport. Keeping the label names the action, widens the button unless space is explicitly reserved for it, and adds a second string for every locale a product ships. Either way, a Figma Loading variant needs to reserve the resting width rather than hugging whatever content it currently holds.

**Spinner delay.** React Spectrum's own documentation states the figure directly: "After a 1 second delay, an indeterminate spinner will be displayed in place of the button label and icon" ([React Spectrum Button](https://react-spectrum.adobe.com/react-spectrum/Button.html)). The reasoning is that operations finishing in a couple hundred milliseconds never show a spinner at all, and a spinner that flashes for a fraction of a second reads as a rendering glitch rather than as feedback. Ant Design exposes the same idea as configuration rather than fixed policy: its `loading` prop accepts `{ delay, icon }` alongside the plain boolean.

The delay carries a documented failure mode worth specifying against in the same breath as the delay itself. Two linked Ant Design issues describe a button stuck permanently in the loading state when the underlying operation resolves faster than the configured delay: the code that clears the `loading` flag runs before the timer that would have shown the spinner in the first place, so the visible state never gets a chance to update ([issue #24669](https://github.com/ant-design/ant-design/issues/24669), a follow-up filed for a remaining multi-render edge case as [issue #24708](https://github.com/ant-design/ant-design/issues/24708)). The simple case was resolved; the more elaborate re-render case had an open follow-up as of its last activity, so treat "spinner never appears again" as a class of bug worth testing for whenever a delay is specified, regardless of library.

React Aria adds an implementation detail that matters to whoever builds this: hide the spinner during the delay window with `opacity: 0`, never `visibility: hidden` or `display: none`, since the latter two also remove it, and any announcement attached to it, from the accessibility tree.

**Double submission, which is not the spinner's job.** GOV.UK and the NHS approach this from a different angle entirely: their guidance ships no spinner requirement at all, but does ship a client-side debounce, born from a specific incident. GOV.UK's own component page states that the GOV.UK Notify team found users receiving invitations twice because senders were double-clicking send ([GOV.UK Button](https://design-system.service.gov.uk/components/button/)).

The follow-up is what makes this worth specifying against rather than trusting by default. A `govuk-frontend` issue documents that the debounce is a hardcoded one-second window, and works out its own limit in the open: if a request takes four seconds to return, the button can be clicked again roughly once per second while the first request is still in flight, since each new click resets its own one-second guard against the *next* click rather than blocking until the *original* request resolves ([issue #2498](https://github.com/alphagov/govuk-frontend/issues/2498)).

| Request duration | What the one-second debounce actually stops |
|---|---|
| 400ms | the accidental rapid double-click, cleanly |
| 1.2s | only the click that lands within 1s of the first |
| 4s | one click per roughly one-second window, for as long as the request is pending |

The NHS service manual states the fix outright: think about the problem server-side, and show a spinner or a modal on slow connections rather than relying on the client-side guard alone ([NHS Buttons](https://service-manual.nhs.uk/design-system/components/buttons)).

**What to do.** Reserve the width, delay the spinner by roughly a second, and specify server-side idempotency as a separate requirement from the spinner rather than assuming one implies the other. The mechanism is that a client-side debounce is a timer racing a network connection, and the network wins on precisely the slow connections that make a user double-click in the first place. A spinner is feedback; an idempotency guarantee is correctness. Conflating the two in a spec is how a well-designed loading button still lets someone submit twice.

---

## 6. When has loading outgrown a plain button?

**The short answer.** The moment a design needs to show success or failure in place, not only "in progress." A boolean carries two values, and that design needs four.

A `loading: boolean` says "something is happening" and nothing more specific. Two systems that considered extending Button to cover more than that reached opposite decisions, and both are informative.

**Carbon built the extension as a separate, named component.** Its `Button` carries no loading prop at all. Loading, and everything past it, belongs to `InlineLoading`: a status enum of `active`, `inactive`, `finished` and `error`, with the finished state displaying for 1.5 seconds before an optional `onSuccess` callback fires; Carbon's own guidance suggests using that callback to refetch data, close a modal, or reset a form, and notes that with no callback supplied the success state simply persists ([Carbon Inline loading](https://carbondesignsystem.com/components/inline-loading/usage/)). That is a small state machine with timing behaviour and a completion hook attached to it, deliberately not folded into Button's own prop list.

**Fluent's tracker shows a team weighing the same extension and choosing not to build it.** A 2023 feature request asked for loading and success states on Button, motivated in part by teams hesitant to reuse the disabled styling because they wanted the foreground to keep meeting contrast while an action was in flight, a variant of exactly the "loading is not disabled" argument in section 4 ([issue #29724](https://github.com/microsoft/fluentui/issues/29724)). The issue closed in March 2024 with a team decision, not a shipped feature: loading and success states would live in the docs as a composition recipe using the existing `Spinner` component in Button's icon slot, rather than as new component behaviour, because building it in "complicates the component without bringing a lot of value" given how much any real implementation would still need customising per consumer.

Read together, these are not a team half-discovering Carbon's answer; they are two different verdicts on the same fork. Carbon judged the sequencing and timing valuable enough to name and own centrally. Fluent judged the same territory too consumer-specific to standardise, and left it as guidance over a primitive instead.

**The case for building a dedicated pattern component.** A status enum expresses which of several terminal outcomes was reached, something a boolean structurally cannot. Timing behaviour gets an owner: Carbon's 1.5-second finished state and completion callback belong to something named, where bolted onto a plain button they would be undocumented, easy-to-miss magic. And the base button's own prop list stays free of a success colour, a success icon, a duration and a callback that most consumers of Button will never touch.

**The case against, and it is Fluent's case as much as an abstract one.** Two components to learn, document and keep visually aligned, with a boundary every consumer will misjudge at least once before they internalise it. The transition between them is not free: swapping a `Button` for an `InlineLoading` in place is a layout change, and reserving space that fits both comfortably is fiddly. Most loading buttons genuinely never need more than in-progress-or-not, so a system that leads with the pattern component by default pushes complexity onto the common path to serve a comparatively rare one, which is exactly the cost Fluent's team weighed against and declined to pay.

Native platforms mostly sidestep the decision rather than resolving it publicly. Neither SwiftUI nor Jetpack Compose ships a loading button of its own; teams compose a progress indicator into a button by hand, and several community packages formalise idle/loading/success/failure as explicit states rather than a flag, but no single canonical, first-party source for that pattern was resolved this session, so treat it as a general observation about the ecosystem rather than a citable claim.

**What to do.** Keep the boolean until a design shows a checkmark inside the button, a timed confirmation, or an in-progress-to-success-to-error sequence in one control. At that point, stop extending the button and either model Carbon's `InlineLoading` shape (a status enum, a timed finished state, a completion callback) or, if the team's judgment matches Fluent's, write the composition down as documentation rather than component API. The underlying reason to switch is the same either way: a boolean has two values, the design in front of you has four, and every attempt to stay inside the button ends up smuggling the missing values into some other prop that was never meant to hold them.

---

## 7. In Figma, does loading belong on `State`, or as its own property?

**The short answer.** A sixth value on the `State` axis, for modelling appearance, even though loading is a prop in code and the other five values on that axis are not. The arithmetic runs opposite to most people's first instinct: the boolean is the expensive option, not the cheap one.

The intuition is usually that adding a value to an existing axis is expensive and a new boolean is cheap. Run the actual multiplication. Take a button with three existing axes, Size (3 values), Emphasis (3 values), Icon (2 values), which is 18 combinations before any state modelling at all. Add the five existing state values, then add loading two different ways.

| Model | Calculation | Total variants | Combinations that cannot occur |
|---|---|---|---|
| Loading as a 6th `State` value | 18 × 6 | 108 | 0 |
| Loading as a separate boolean, `State` staying at 5 | 18 × 5 × 2 | 180 | 72 |

A new value on an existing axis grows the set linearly: one more variant for every existing combination of the other axes. A new boolean doubles the entire set, because every combination that already existed now exists twice, once with loading and once without. Most of that doubled half describes situations that cannot occur in a running interface: loading plus hover, loading plus pressed, loading plus disabled. A designer applying the component can still select those combinations, and nothing in a variant grid stops them.

Practitioner analysis of Figma's boolean properties reaches the same conclusion from a different direction. component-driven.dev walks through four independent boolean props on one component, and the total is not four variations but sixteen, several of them meaningless in combination, with a further complication: hiding a label during loading required inventing an extra negation boolean, because a single boolean cannot express "not" against another one ([Avoid Component's boolean props in Figma](https://www.component-driven.dev/articles/boolean-flags-in-figma)). Nathan Curtis makes the underlying principle explicit from auditing published component kits: "state becomes a glorious catch-all of insufficiently modeled ideas" when teams treat every property as `state`, and separately, "collapsing disabled into state reduces the model's clarity" when a genuinely independent property gets folded into an enum it does not belong on ([The Sorry State of States](https://medium.com/@nathanacurtis/the-sorry-state-of-states-89dd4668737e), December 2024, commentary). Both are describing versions of the same trade this section is making: put a value where its combinatorics are cheap, keep it off an axis it corrupts.

The general shape of the rule is the one type systems already give designers a vocabulary for: use an enumerated axis to make the impossible combinations unrepresentable, rather than leaving them selectable and hoping nobody picks them.

**Five named traps**, each producing a Figma file somebody eventually has to work inside:

A **loading boolean sitting beside a `State` axis** doubles the variant set and admits combinations that cannot occur, so the file fills with entries nobody will ever specify and every contributor has to scroll past.

**Modelling every state as its own boolean** produces 16 combinations from 4 independent flags, per the component-driven.dev example above, with no structural way to express that several of them are mutually exclusive.

A **negation boolean**, added purely so loading can suppress the visible label, is a flag whose entire job is cancelling another flag. Needing one is itself a signal that the axis underneath it was modelled wrong, and adding it doubles the set again on top of the doubling loading already caused.

A **grey Loading variant reusing the Disabled fill** specifies the wrong behaviour to whoever implements it, for the reasons argued in section 4: it visually asserts the control is inert when the correct behaviour is closer to "enabled, temporarily busy."

**Inheriting a community kit's state axis without checking it** is the quiet one. Curtis's own survey of published Figma button components found most shipped kits covering only a partial set of state combinations, with design assets and the underlying code deliberately diverging. That gap is not automatically wrong, since a kit's authors may have made the same "not every combination is worth modelling" judgment this section argues for. Inheriting the gap by accident, without knowing which combinations were dropped and why, is the failure mode worth naming.

**The refinement that makes putting loading on `State` defensible rather than merely convenient.** Because loading genuinely blocks interaction, it is, in appearance terms, mutually exclusive with hover and pressed in exactly the way disabled already is, even though in code it arrives through an entirely different mechanism (a developer-set prop, not a browser pseudo-class). The axis, understood this way, is modelling mutual exclusivity of *appearance*, not mirroring the component's actual API surface. That is a legitimate thing for a Figma variant axis to do, and it is measurably cheaper than the alternative, provided the mapping from each `State` value back to its real code mechanism is written down rather than left implicit. Section 8 is that mapping.

**One structural option worth knowing about, not requiring it.** Figma's interactive components can wire hover, pressed and focus transitions as prototype interactions between variants, triggered automatically as someone moves a pointer over the canvas, rather than as variant values a designer switches by hand ([Create interactive components with variants](https://help.figma.com/hc/en-us/articles/360061175334-Create-interactive-components-with-variants)). A team using this can shrink the `State` axis down to only what a developer actually sets: Default, Disabled, Loading. That is the closest a Figma axis can get to mirroring a component's real prop surface, and it costs more prototype wiring up front and a variant set that is harder to inspect statically once built.

**What to do.** Put Loading on the `State` axis as a sixth value; in the worked example above it costs 18 more variants where the boolean route costs 72 more, and most of those 72 describe situations that cannot occur. This is judgment rather than settled consensus, since published component kits are visibly split on it, but the arithmetic behind the recommendation is not a matter of opinion. Where a team already drives hover, pressed and focus through Figma's interactive-component wiring rather than manual variants, shrink the axis further, to Default, Disabled, Loading, since that maps one-to-one onto the props a developer actually sets.

---

## 8. The tables to hand your engineers

The `State` axis bundles two mechanisms and nothing in the file says so. Say it here instead.

| Figma `State` value | Write this in code | Do not write | Who sets it |
|---|---|---|---|
| Default | nothing | a `state` prop | nobody |
| Hover | `:hover` | `state="hover"` | the browser |
| Focused | `:focus-visible` | `:focus`, `state="focused"` | the browser |
| Pressed | `:active` | `state="pressed"` | the browser |
| Disabled | `aria-disabled="true"` plus prevented activation | native `disabled` where focus must be kept | the developer |
| Loading | `loading` / `isLoading` / `isPending` | native `disabled`, `aria-busy` as the sole announcement, `state="loading"` | the developer |

And the behaviour a variant image cannot carry, which belongs in the component's description or Dev Mode annotation rather than in its layers:

| Behaviour | Specification |
|---|---|
| Focus | remains focusable and in the tab order while loading |
| Activation | prevented in JS (or by leaving the click handler unattached), never by the native `disabled` attribute |
| Announcement | a visually hidden, polite live region, present in the markup on page load, with its contents changing while loading; check whether the component library already ships one before adding a second |
| Not the announcement | `aria-busy` alone, or a bare `role="progressbar"` with no accessible name |
| Spinner timing | appears after roughly 1 second; the fast-resolve path must both clear the loading flag and cancel the pending timer |
| Spinner hiding during the delay | `opacity: 0`, never `display: none` or `visibility: hidden` |
| Width | reserved at the resting width; the button must not resize when loading starts |
| Colour | built from the enabled style, not the disabled style |
| Double submission | a server-side idempotency guarantee; the spinner and any client-side debounce are feedback, not the guarantee itself |

---

## 9. The short version

In code, loading is a boolean everywhere surveyed. No mainstream library ships `state="loading"`, so there is no enum value to map a Figma `State` onto.

In Figma, put it on the `State` axis anyway, as a sixth value. It is mutually exclusive with hover and pressed in appearance, which is what that axis is actually modelling, and the arithmetic is decisive: a sixth value adds 18 variants to an 18-combination button where a separate boolean adds 180, 72 of which describe combinations that cannot happen.

Do not make loading a separate component. MUI's public reversal, merging `LoadingButton` back into `Button` in January 2025 after years of separation, is the clean evidence for this; keep the base button single, and let the loading state live inside it as a prop.

Loading is not disabled, in the specification that most closely-read sources converge on, but check before assuming any given library agrees. Reading source code rather than docs pages this session found that Polaris, MUI, Chakra and Radix all fold `loading` into the native `disabled` attribute by default, the exact pattern GitLab, Primer and Adobe's React Aria/Spectrum independently built `loading`/`isPending` to avoid. If a project's own button is built on any of the first four, the accessible behaviour, focus retained, `aria-disabled` rather than `disabled`, a live region that exists before it is needed, has to be built deliberately on top, not assumed to already be there.

Reserve the width, delay the spinner by about a second, and remember the spinner is feedback rather than protection: a client-side debounce is a timer racing a network connection, and GOV.UK's own tracker worked out that a four-second request can still be resent roughly once per second while it is pending.

Escalate to a dedicated pattern component only once a design needs to show success or failure in place, not only in-progress. Carbon built that as `InlineLoading`, with a status enum and a timed finished state; Fluent's team looked at the same territory and chose to document a composition instead of shipping new component behaviour, judging it too consumer-specific to standardise centrally. Either verdict is defensible; know which one a given team is actually making rather than drifting into it.

Then write two things down, since a variant image cannot carry either: which `State` values are browser pseudo-classes nobody sets and which are props a developer actually passes, and the behaviour spec, focus, announcement, timing, that no static frame shows. Both belong somewhere Dev Mode or the docs site will surface them, not only in a Figma layer name.

**One change-management note worth carrying into any spec.** Nearly every concrete fact in this guide is a system reversing or correcting something it shipped earlier, in public. MUI un-separated a component it had split for years. GitLab replaced an opt-in accessibility flag with a default and then deleted the flag once the rollout was safe. Primer's own team is, as of this research, mid-argument with itself about whether its docs page correctly describes its own component. Chakra renamed a prop out from under every file still referencing the old name. Whatever a team writes down from this guide, write down a way to change it later, and expect the prop name to be the first thing that moves.

---

## 10. What to re-check later

- **The DOM-behaviour table in section 4** is the most volatile claim in this guide, because it was built by reading each library's source directly rather than its docs, and source changes without a docs update in either direction. Re-run it against the actual version pinned in a given project rather than trusting the table indefinitely.
- **Primer's documentation gap** (issue #7881, opened May 2026) is open and unresolved as of this research. Once it closes, the docs page should state the built-in `loadingAnnouncement` behaviour directly, and the "duplicate announcement" trap in section 4 may no longer apply to Primer specifically, even though the general risk it names still applies to any other library.
- **Ant Design's delayed-loading bug.** The simple case (issue #24669) was fixed; the multi-render follow-up (issue #24708) had an open thread at last activity. Confirm current status against the version actually pinned before relying on delayed loading in production.
- **Atlassian's button generations.** The redesigned Button/IconButton/LinkButton folding `isLoading` into shared props is confirmed from source. The historical reasoning for why the legacy generation originally split it out was not re-verified this session and should not be repeated as settled fact without checking Atlassian's own changelog or design-system blog directly.
- **`aria-busy` support.** The claim that only one screen reader honours it rests on Adrian Roselli's 2020 testing; his own January 2026 live region survey revisits adjacent territory and is worth checking directly for any update specific to `aria-busy` itself.
- **Figma's interactive components and Code Connect** change several times a year, and the shrink-the-axis option in section 7 depends on both.
- **React Spectrum S2** is under active development; the exact `isPending` contract quoted here may be restated as the package matures past beta.
- **The native-platform claim in section 6** (SwiftUI and Compose community loading-button packages) was stated as a general observation because no canonical first-party source was resolved this session; treat it as the weakest-evidenced claim in the guide and verify before repeating it as fact.

---

## Sources

### Primary: component APIs, source and documentation

- [MUI Button, loading prop](https://mui.com/material-ui/react-button/)
- [MUI Button.js source](https://github.com/mui/material-ui/blob/master/packages/mui-material/src/Button/Button.js) (`disabled={disabled || loading}`, the loading wrapper, the docstring stating the button is disabled)
- [MUI issue #7223, "[Button] Add loading support"](https://github.com/mui/material-ui/issues/7223) (opened 23 June 2017)
- [MUI issue #42684, dependency-weight argument](https://github.com/mui/material-ui/issues/42684)
- [MUI PR #44637, "[Button] Add `loading` prop"](https://github.com/mui/material-ui/pull/44637) (merged 13 January 2025)
- [MUI issue #27853, Google Translate crash](https://github.com/mui/material-ui/issues/27853)
- [Adobe React Aria Button](https://react-aria.adobe.com/Button) (`isPending`, the focusable-but-disabled contract, the `opacity: 0` note)
- [Adobe React Spectrum Button](https://react-spectrum.adobe.com/react-spectrum/Button.html) (the 1 second spinner delay, quoted exactly)
- [Shopify Polaris web components Button](https://shopify.dev/docs/api/app-home/polaris-web-components/actions/button) (current primary source; states loading "also disables the button component")
- [Shopify Polaris React Button.tsx (archived)](https://github.com/Shopify/polaris-react-archive/blob/main/polaris-react/src/components/Button/Button.tsx) (`isDisabled = disabled || loading`)
- [Shopify Polaris React UnstyledButton.tsx (archived)](https://github.com/Shopify/polaris-react-archive/blob/main/polaris-react/src/components/UnstyledButton/UnstyledButton.tsx) (`aria-busy`, `tabIndex={disabled ? -1 : undefined}`)
- [Shopify Polaris React Spinner.tsx (archived)](https://github.com/Shopify/polaris-react-archive/blob/main/polaris-react/src/components/Spinner/Spinner.tsx) (`role="status"`, not `role="progressbar"`)
- [Chakra UI Button docs](https://www.chakra-ui.com/docs/components/button) (`loading`, `loadingText`, `spinnerPlacement`)
- [Chakra UI button.tsx source](https://github.com/chakra-ui/chakra-ui/blob/main/packages/react/src/components/button/button.tsx) (`disabled={loading || rest.disabled}`)
- [Ant Design Button docs](https://ant.design/components/button) (`loading` typed `boolean | { delay, icon }`)
- [Ant Design Button.tsx source](https://github.com/ant-design/ant-design/blob/master/components/button/Button.tsx) (native `disabled` excludes loading; click blocked in the handler)
- [Radix Themes Button](https://www.radix-ui.com/themes/docs/components/button) (`loading`, and the documented decision to disable while loading)
- [Atlaskit button package report.api.md (legacy generation)](https://github.com/pioug/atlassian-frontend-mirror/blob/master/design-system/button/report.api.md) (`isLoading` only on `LoadingButton`; unofficial mirror, Atlassian's own repo is private)
- [Atlaskit new-button variant types (redesigned generation)](https://github.com/pioug/atlassian-frontend-mirror/blob/master/design-system/button/src/new-button/variants/types.tsx) (`isLoading` on shared `CommonButtonProps`)
- [Atlassian Forge UI Kit Button](https://developer.atlassian.com/platform/forge/ui-kit/components/button/) (`isLoading` hides the text, shows a spinner, maintains width)
- [IBM Carbon Inline loading, usage](https://carbondesignsystem.com/components/inline-loading/usage/) (active/inactive/finished/error, the 1.5 second finished state before the success callback)

### Primary: accessibility guidance and issue trackers

- [GitHub Primer, Button accessibility](https://primer.style/product/components/button/accessibility/) (`aria-disabled`, do not remove from the DOM, the visually hidden live region as consumer guidance)
- [GitHub Primer ButtonBase.tsx source](https://github.com/primer/react/blob/main/packages/react/src/Button/ButtonBase.tsx) (built-in `aria-describedby` announcement, `loadingAnnouncement` default "Loading", the always-mounted wrapper)
- [GitHub Primer Button types.ts](https://github.com/primer/react/blob/main/packages/react/src/Button/types.ts)
- [GitHub Primer issue #7881, docs gap for the built-in announcement](https://github.com/primer/react/issues/7881) (opened May 2026, open as of this research)
- [Shopify Polaris issue #1212](https://github.com/Shopify/polaris/issues/1212) (the 2018 screen-reader results; closed by inactivity, not by a linked fix)
- [GitLab issue #2981, "Keep GlButton accessible when loading"](https://gitlab.com/gitlab-org/gitlab-services/design.gitlab.com/-/issues/2981)
- [GitLab epic #19676, "Make GlButton accessible when loading"](https://gitlab.com/groups/gitlab-org/-/epics/19676) (three phases; the `accessibleLoading` prop shipped, then was removed once focusable loading became default)
- [GitLab Pajamas Button](https://design.gitlab.com/components/button/) (current default behaviour, no `accessibleLoading` prop mentioned)
- [GOV.UK Design System Button](https://design-system.service.gov.uk/components/button/) (the prevent-double-click attribute, the Notify incident, the slow-connection advice)
- [govuk-frontend issue #2498](https://github.com/alphagov/govuk-frontend/issues/2498) (the hardcoded 1 second debounce timeout and its limit, worked out in the thread)
- [NHS digital service manual, Buttons](https://service-manual.nhs.uk/design-system/components/buttons) (server-side protection, spinner before prevent-double-click)
- [Microsoft Fluent UI issue #29724, "Loading state for Button"](https://github.com/microsoft/fluentui/issues/29724) (the contrast objection to disabled styling; closed March 2024 with a decision to document a recipe rather than build the feature)
- [Ant Design issue #24669](https://github.com/ant-design/ant-design/issues/24669) and [issue #24708](https://github.com/ant-design/ant-design/issues/24708) (button stuck loading when the operation resolves inside the delay window; simple case fixed, edge case open at last activity)
- [Figma Help Center, Create interactive components with variants](https://help.figma.com/hc/en-us/articles/360061175334-Create-interactive-components-with-variants)

### Commentary, labelled as such in the text

- [Nathan Curtis, "The Sorry State of States"](https://medium.com/@nathanacurtis/the-sorry-state-of-states-89dd4668737e) (December 2024; the published-kit survey, and the argument that disabled does not belong folded into state)
- [component-driven.dev, "Avoid Component's boolean props in Figma"](https://www.component-driven.dev/articles/boolean-flags-in-figma) (four booleans yielding sixteen variants; the negation-boolean problem)
- [Adrian Roselli, "More Accessible Skeletons"](https://adrianroselli.com/2020/11/more-accessible-skeletons.html) (the `aria-busy` support testing: only JAWS 2020 honoured it)
- [Adrian Roselli, "Live Region Support"](https://adrianroselli.com/2026/01/live-region-support.html) (January 2026 revisit of live region behaviour across screen readers; not `aria-busy`-specific, flagged above for re-checking)

### Cited but not resolved to a URL

- Jetpack Compose and SwiftUI community progress-button packages. The idle/loading/success/failure state pattern recurs across several community libraries, but no single canonical, first-party source was opened for this revision, so the claim in section 6 is stated as a general ecosystem observation rather than an attributed one.
- Atlassian's original rationale for splitting `isLoading` into a separate `LoadingButton` on the legacy button generation. The current API shape is confirmed from source; the historical "why" was not re-resolved this session and is flagged in "What to re-check later" rather than asserted.
