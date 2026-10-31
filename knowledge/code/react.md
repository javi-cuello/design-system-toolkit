# React components

How a design-system component is written in React 19 and TypeScript so that it behaves like the element it stands for: props named for meaning, the native props passed through, `ref` as a prop, events, children and slots, controlled and uncontrolled state, the native element first and the ARIA a system adds, polymorphism, styling hooks and stylesheets, server components, TypeScript strictness, stories in CSF3 and tests. It is how to apply code-standard rule 8 (the native element carries the behaviour), code-standard rule 9 (a variant axis is an attribute, a state a pseudo-class, disabled the control's own), code-standard rule 13 (slots, not render props), code-standard rule 36 (one implementation) and code-standard rules 43 and 47 (client boundaries) to React. Where the server and client split goes is [javascript: client and server boundaries, and islands](javascript.md#client-and-server-boundaries-and-islands); names, ARIA and live regions are [accessibility.md](accessibility.md)'s; levels of test and axe's limits are [testing.md](testing.md)'s.

**Implements:** the React build of [actions](../ui/patterns/actions.md) and [forms](../ui/patterns/forms.md) controls, and of any component the contract generates.

## Props named for meaning

**What good looks like**
- Each prop says what it means to the reader of the call site (`variant="danger"`, `size="sm"`), never how it is drawn (`red`, `bigPadding`).
- No prop reuses the name of an HTML or ARIA attribute for something else; a design axis called Role is `variant`.
- A choice of a few values is a string union; a yes-or-no is a boolean that defaults to `false`; every optional prop has a default in the signature.

**How**
- **One name per meaning across the library.** Shipped systems differ on the word but each uses one: Primer `variant` (`default`, `primary`, `danger`, `invisible`, `link`) ([Primer Button](https://primer.style/product/components/button/)), Fluent `appearance` ([Fluent Button types](https://github.com/microsoft/fluentui/blob/master/packages/react-components/react-button/library/src/components/Button/Button.types.ts)), Atlassian `appearance` ([Atlassian Button](https://atlassian.design/components/button/code)), Carbon `kind` ([Carbon Button source](https://github.com/carbon-design-system/carbon/blob/main/packages/react/src/components/Button/Button.tsx)). Take the word from the design contract and keep it.
- **Never shadow a native attribute.** A component's props are spread onto a native element (see the next section), so a prop named `role`, `type`, `size`, `title`, `hidden` or `disabled` that means something else either reaches the DOM or blocks the real one. Atlassian's Button drops `style`, `disabled` and `role` from its native props for this reason and adds `isDisabled` instead ([Atlassian Button](https://atlassian.design/components/button/code)). code-standard rule 9 renames a colliding axis.
- **Booleans.** Name them as the state that is true (`loading`, `selected`, `fullWidth`), default `false`, so `<Button loading>` reads as English and an absent prop is the common case. React Aria and Atlassian prefix with `is` (`isDisabled`, `isPending`, `isLoading`) ([React Aria Button](https://react-aria.adobe.com/Button)); Primer, Fluent and MUI do not. Where the native attribute exists (`disabled`, `required`, `checked`), use the native name and pass it through: that is code-standard rule 9's "disabled is the control's own".
- **Enums as string unions.** `variant?: 'primary' | 'secondary' | 'danger'`. The TypeScript handbook: literal unions express "functions that only accept a certain set of known values" ([Everyday types, literal types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#literal-types)), and "you may not need an enum when an object with `as const` could suffice" ([Enums, objects vs enums](https://www.typescriptlang.org/docs/handbook/enums.html#objects-vs-enums)). A union needs no import at the call site and reads the same in a story's args.
- **Defaults in the destructuring**, `{ variant = 'primary', size = 'md' }`, matching the contract's defaults, so the type, the docs table and the render agree.
- **Two booleans that cannot both be true are one union.** `primary` and `danger` as booleans allow `<Button primary danger>`; `variant` cannot.

**Cases**
- The contract has an axis `Role` with values Primary, Secondary → `variant: 'primary' | 'secondary'` (code-standard rule 9).
- A prop `size` on a text field means the drawn height, and `<input size>` already means a width in characters → name it for the contract's meaning (`density`, or `size` kept off the native element) and never spread it onto the `input`.
- `color="#d00"` on a button → a `variant` or `tone` from the contract; a raw colour is a token's job.
- `isPrimary`, `isSecondary`, `isDanger` → one `variant` union.

**Accessibility**
- A prop that shadows `role`, `disabled` or an `aria-*` name can remove what assistive technology reads; keeping native names native keeps 4.1.2 Name, Role, Value intact.
- code-standard rule 9, code-standard rule 10 (no presentational attribute name).

**Check**
- *Script:* a static scan of each `*Props` type for keys in the HTML and ARIA attribute set that are not passed straight to the native element; `tsc --strict` fails a value outside a union.
- *Judgement:* Could a reader guess every prop's effect from its name at the call site?

**Sources:** Primer, Fluent, Atlassian, Carbon, React Aria and the TypeScript handbook as linked. They disagree on the `is` prefix for booleans; the toolkit uses the native name where one exists and an unprefixed state word otherwise, so a prop and the attribute it becomes share a name.

## The native props, passed through

**What good looks like**
- The component accepts every prop its root element accepts, and passes the ones it does not use to that element.
- `className` and `style` from the caller are merged with the component's own, never replaced.
- `ref` reaches the native element, as a plain prop.

**How**
- **Type from the element.** `type ButtonProps = ComponentPropsWithRef<'button'> & { variant?: … }`. `@types/react` says of `ComponentProps`: "It's usually better to use `ComponentPropsWithRef` or `ComponentPropsWithoutRef` instead of this type, as they let you be explicit about whether or not to include the `ref` prop" ([@types/react](https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/react/index.d.ts)). In React 19 the ref is a prop, so take the `WithRef` form; `WithoutRef` is the forwardRef-era type. Use `Omit<…, 'x'>` for any native prop the component replaces.
- **Spread the rest last but merge.** Destructure what the component reads, spread the rest on the root, and put the merged values after the spread so they cannot be lost:
  ```tsx
  export function Button({ variant = 'primary', className, type = 'button', ref, ...rest }: ButtonProps) {
    return <button {...rest} ref={ref} type={type} data-variant={variant} className={cx('ds-button', className)} />;
  }
  ```
- **`ref` as a prop.** "Starting in React 19, you can now access `ref` as a prop for function components … New function components will no longer need `forwardRef` … In future versions we will deprecate and remove `forwardRef`" ([React 19, ref as a prop](https://react.dev/blog/2024/12/05/react-19#ref-as-a-prop)); "`forwardRef` will be deprecated in a future release" ([forwardRef](https://react.dev/reference/react/forwardRef)). A ref callback may return a cleanup, and "returning anything else from a `ref` callback will now be rejected by TypeScript" ([React 19, cleanup functions for refs](https://react.dev/blog/2024/12/05/react-19#cleanup-functions-for-refs)).
- **`style` is the caller's, not the variant's.** React: "We recommend using `style` only for dynamic styles where you don't know the style values ahead of time. In other cases, applying plain CSS classes with `className` is more efficient" ([Common components, style](https://react.dev/reference/react-dom/components/common)). Pass the caller's `style` through; never compute a variant into it.
- **`type="button"` by default** on a `button`: the native default is `submit`, so a design-system button inside a form would submit it.

**Cases**
- A Button that takes `onClick` and `children` and nothing else → a caller cannot add `aria-describedby`, `form`, `name` or `data-*`; type from `ComponentPropsWithRef<'button'>` and spread the rest.
- `className={'ds-button'}` after `{...rest}` → the caller's class is dropped; merge them.
- `{...rest}` after `className={cx(…)}` → the caller's `className` replaces the component's; destructure it and merge.
- A new component wrapped in `forwardRef` → take `ref` from the props; keep `forwardRef` only where the library still supports React 18.

**Accessibility**
- Passing the rest through is what lets a caller add `aria-describedby`, `aria-controls` or `aria-expanded` to the real control (1.3.1, 4.1.2), and lets a parent move focus with the ref ([accessibility: focus management](accessibility.md#focus-management)).

**Check**
- *Script:* render with `react-dom/server` `renderToString(<Button data-x="1" aria-describedby="h" className="c" style={{ margin: 1 }} />)` and assert all four on the `button` with the component's own class kept; with React Testing Library, pass a `createRef()` and assert `ref.current instanceof HTMLButtonElement`; a static scan for `forwardRef` in a React-19-only library.
- *Judgement:* Is there any native attribute a caller would reasonably set that this component swallows?

**Sources:** react.dev and @types/react as linked. Radix's composition guide still asks a child to "wrap the component in `React.forwardRef`" ([Radix composition](https://www.radix-ui.com/primitives/docs/guides/composition)) and MUI's composition guide the same ([MUI composition](https://mui.com/material-ui/guides/composition/)), because both still support React 18. The toolkit goes with React 19: `ref` as a prop, typed with `ComponentPropsWithRef`.

## Events, passed through

**What good looks like**
- A component that renders a native element takes that element's events by their native names and types (`onClick`, `onChange`, `onKeyDown`), passed straight to it.
- It adds an event only for something the element cannot say (`onValueChange` with the parsed value, `onOpenChange`).
- It never swallows a caller's handler by defining its own of the same name.

**How**
- **Inherit them.** `ComponentPropsWithRef<'button'>` already types `onClick: MouseEventHandler<HTMLButtonElement>`; the spread delivers it. React's TypeScript guide types handlers with `React.ChangeEvent<HTMLInputElement>` and the `*EventHandler` aliases ([Using TypeScript, typing DOM events](https://react.dev/learn/typescript#typing-dom-events)).
- **Compose when the component also listens.** Call the caller's handler, then do the component's work unless the caller prevented it:
  ```tsx
  onKeyDown={(e) => { props.onKeyDown?.(e); if (!e.defaultPrevented) handle(e); }}
  ```
- **A value event is named for the value**, `onValueChange(value)` beside the native `onChange(event)`, as Radix does with `onPressedChange` ([Radix Toggle](https://www.radix-ui.com/primitives/docs/components/toggle)).
- **Notify the parent in the handler, not an effect.** "Delete the Effect and instead update the state of *both* components within the same event handler" ([You might not need an effect](https://react.dev/learn/you-might-not-need-an-effect)).

**Cases**
- A Button exposes `onPress` and ignores `onClick` → a caller's `onClick` does nothing; pass `onClick` through.
- A generated prop typed `onClick?: () => void` → the caller loses the event; inherit the native type.
- A Checkbox calls `onChange` from a `useEffect` watching `checked` → it fires on mount and after every parent render; call it from the change handler.

**Accessibility**
- A native `button`'s `click` fires for Enter and Space; passing `onClick` to the `button` keeps 2.1.1 Keyboard without a key handler. A handler on a `div` does not.

**Check**
- *Script:* `tsc --strict` on a fixture that passes `onClick={(e: React.MouseEvent<HTMLButtonElement>) => e.currentTarget}`; a Testing Library test that clicks by role and asserts the spy ran, and presses Enter on the focused button and asserts it again.
- *Judgement:* Does every event this component invents carry something the native one does not?

**Sources:** react.dev and Radix as linked. React Aria disagrees: its Button marks `onClick` "Not recommended – use `onPress` instead", because press events unify mouse, touch and keyboard ([React Aria Button](https://react-aria.adobe.com/Button)). That earns its cost in a library that renders non-native elements; for a component whose root is a native `button` the browser already unifies them. The toolkit passes the native events through.

## Children, label props and slots

**What good looks like**
- The component's main content is `children`.
- A second region with its own place in the anatomy (an icon before, a description, actions) is a named prop that takes a `ReactNode`: a slot.
- A plain-string prop is used only where the value is text with a job no markup could do (an accessible name, a placeholder).

**How**
- **`children` for the label.** `<Button>Save</Button>` reads as HTML and accepts markup. Type it `ReactNode`, which React calls "a union of all the possible types that can be passed as children in JSX" ([Using TypeScript, typing children](https://react.dev/learn/typescript#typing-children)).
- **Named slots for the other regions**: `icon`, `description`, `actions`, each `ReactNode`, each rendered in its own part. Fluent v9 makes this its API, `icon?: Slot<'span'>` ([Fluent Button types](https://github.com/microsoft/fluentui/blob/master/packages/react-components/react-button/library/src/components/Button/Button.types.ts)); MUI's `slots` and `slotProps` "allow for more granular control over the structure of a component" ([MUI overriding component structure](https://mui.com/material-ui/customization/overriding-component-structure/)). This is code-standard rule 13 in React.
- **Not `Children` or `cloneElement`.** React: "Using `Children` is uncommon and can lead to fragile code" ([Children](https://react.dev/reference/react/Children)), and the same of `cloneElement` ([cloneElement](https://react.dev/reference/react/cloneElement)). For a list of items, React's own alternatives are to export a part component (`<Tabs.Tab>`) or take an array of objects as a prop.
- **A string prop where text is the point**: `aria-label` on an icon-only button, `label` on a field whose `label` element the component owns and ties with `useId` ([useId](https://react.dev/reference/react/useId)).

**Cases**
- `<Card title="…" body="…" footer="…">` with plain strings → `title` and `footer` as `ReactNode` slots and `children` for the body, so a caller can put a link in the footer.
- A Tabs component that walks `children` with `Children.map` to inject an index → a `Tab` part and context; it survives a caller wrapping tabs in their own component.
- `renderIcon={() => <Icon/>}` → `icon={<Icon/>}` (code-standard rule 13).

**Accessibility**
- `children` text is the button's accessible name from content, the APG's first preference ([accessibility: accessible names](accessibility.md#accessible-names-and-descriptions)).

**Check**
- *Script:* a static scan for `React.Children`, `cloneElement` and props named `render*` in component files; for each slot prop, render it with a `<strong>` and assert the element lands in the slot's part.
- *Judgement:* Is each string prop really text, or a region a caller will one day need to put markup in?

**Sources:** react.dev, Fluent and MUI as linked. React's alternatives include render props ("there is nothing special about it: it is a regular prop which happens to be a function", [Children, alternatives](https://react.dev/reference/react/Children#alternatives)), and React Aria takes functions for `className`, `style` and `children` to style by state ([React Aria styling](https://react-aria.adobe.com/styling)); Carbon takes `renderIcon` as a component type ([Carbon Button source](https://github.com/carbon-design-system/carbon/blob/main/packages/react/src/components/Button/Button.tsx)). The toolkit goes with slots (code-standard rule 13): a slot is markup at the call site, renders on the server, and crosses a client boundary, which a function does not (code-standard rule 43).

## Controlled and uncontrolled state

**What good looks like**
- A component with a value works both ways: uncontrolled with `defaultValue`, controlled with `value` and a change handler, with the native names.
- It never switches between the two in its lifetime.
- State it can compute from props is computed during render, not stored.

**How**
- **The definitions.** A component is "controlled" "when the important information in it is driven by props rather than its own local state"; one with local state is "uncontrolled" ([Sharing state, controlled and uncontrolled](https://react.dev/learn/sharing-state-between-components#controlled-and-uncontrolled-components)).
- **Native names.** `value`/`defaultValue`/`onChange` for text, `checked`/`defaultChecked` for a checkbox: "To render a *controlled* input, pass the `value` prop to it (or `checked` for checkboxes and radios)" ([input](https://react.dev/reference/react-dom/components/input#controlling-an-input-with-a-state-variable)). For a state with no native name, the Radix triple: `pressed`, `defaultPressed`, `onPressedChange` ([Radix Toggle](https://www.radix-ui.com/primitives/docs/components/toggle)).
- **Prefer leaving it to the native element.** A text field that renders an `input` and passes `value`, `defaultValue` and `onChange` through holds no state of its own; the `input` is controlled or not by what the caller passes.
- **When the component must hold it** (a disclosure, a toggle with no native control), one hook decides: `const isControlled = value !== undefined`; read `value` when controlled, local state when not; call the change handler in both cases. Write it once and import it (code-standard rule 36).
- **Never switch.** "An input cannot switch between being controlled or uncontrolled over its lifetime" ([input, caveats](https://react.dev/reference/react-dom/components/input#caveats)); `value={v ?? ''}` keeps it controlled.
- **Derive, don't sync.** "When something can be calculated from the existing props or state, don't put it in state. Instead, calculate it during rendering"; to reset a component's state, give it a `key` ([You might not need an effect](https://react.dev/learn/you-might-not-need-an-effect)). "Figure out the absolute minimal representation of the state" ([Thinking in React](https://react.dev/learn/thinking-in-react)).

**Cases**
- A TextField copies `value` into `useState` and syncs it in an effect → the field lags a render and loses the caller's edits; pass `value` through to the `input`.
- A Switch takes `checked` but no `onChange` → it is read-only and React warns; take both, or `defaultChecked`.
- Each disclosure component writes its own controlled/uncontrolled logic → one shared hook (code-standard rule 36).

**Accessibility**
- The state the control shows must be the state it exposes (`checked`, `aria-expanded`, `aria-pressed`); a lagging copy can show one and announce the other (4.1.2).

**Check**
- *Script:* render once with `defaultValue`, type, and assert the value changed; render with `value` and no state update, type, and assert it did not and the handler was called; a static scan for `useEffect` whose body only calls `setState` from props.
- *Judgement:* Which state here could be computed instead of stored?

**Sources:** react.dev and Radix as linked; they agree.

## The native element first, and the ARIA a system adds

**What good looks like**
- The component's root is the native element that has the behaviour: `button`, `a`, `input`, `select`, `textarea`, `dialog`, `details`.
- ARIA appears only for what the element cannot say: a busy or pending state, an icon to hide, a name for an icon-only control, a disabled control that must stay focusable.
- An icon-only shape cannot be rendered without a name.

**How**
- **The element carries the behaviour** (code-standard rule 8, and [accessibility: the first rule of ARIA](accessibility.md#aria-the-first-rule-and-when-it-is-needed)). In React the native element is the root: no wrapper box between the caller's props and the control.
- **Loading or pending.** What a loading button does (when it shows, a second press, what is said) is [actions: loading buttons](../ui/patterns/actions.md#loading-buttons); in React: `aria-disabled` while busy, `onClick` dropped and `type` not `submit`, so it stays focusable and does nothing. Announce through a polite status region ([accessibility: live regions](accessibility.md#live-regions-and-status-messages)). `aria-busy` is for a region being updated: it "is commonly used in ARIA live regions to delay announcements until updates are complete" ([MDN aria-busy](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-busy)); put it on the region that is loading, not on the button.
- **Decorative icons** are `aria-hidden="true"` inside a named control; the icon component defaults to hidden and takes a `label` only when it stands alone (code-standard rule 18).
- **Icon-only needs a name, by type.** Make the label required in the icon-only shape, so a missing name fails `tsc`, not an audit: `type IconButtonProps = ComponentPropsWithRef<'button'> & { icon: ReactNode; 'aria-label': string }`. Carbon pairs `hasIconOnly` with `iconDescription` "read by screen readers" ([Carbon Button source](https://github.com/carbon-design-system/carbon/blob/main/packages/react/src/components/Button/Button.tsx)); Primer's IconButton uses `aria-label` and a tooltip from `description` ([Primer IconButton](https://primer.style/product/components/icon-button/)).
- **Disabled versus aria-disabled.** Native `disabled` removes the control from the tab order and from form submission; `aria-disabled="true"` "only semantically exposes" the state, does "not change the focusability", and the component must block the action itself ([MDN aria-disabled](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-disabled)). The APG: "screen reader users are far less likely to discover disabled elements that are not focusable", and asks for one consistent convention ([APG, focusability of disabled controls](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/#focusabilityofdisabledcontrols)). Expose both through one prop each: `disabled` (native) and a focusable variant (Fluent's `disabledFocusable`, "to keep a consistent tab order for screen reader and keyboard users", [Fluent Button types](https://github.com/microsoft/fluentui/blob/master/packages/react-components/react-button/library/src/components/Button/Button.types.ts); Base UI's `focusableWhenDisabled`, [Base UI Button](https://base-ui.com/react/components/button)). The focusable form renders `aria-disabled="true"`, drops `onClick` and prevents form submission. Both are code-standard rule 9's "the control's own".
- **IDs for relationships** come from `useId`, which "generate[s] unique IDs that can be passed to accessibility attributes" and matches between server and client when the trees match ([useId](https://react.dev/reference/react/useId)).

**Cases**
- `<div role="button" onClick>` → `<button type="button">`; the `div` had no Enter, Space or focus.
- `<Button loading>` sets `disabled` → focus falls to `body` mid-action and a keyboard user is lost; `aria-disabled`, focus kept, a status message.
- `<IconButton icon={<Trash/>} />` compiles → make `aria-label` required in the type; `<IconButton aria-label="">` is rejected by the lint code-standard rule 18 names.
- A Save button disabled until the form is valid, and nobody can find out why → the focusable disabled form with a description of what is missing, or leave it enabled and validate on submit. Primer: "Avoid disabling buttons because it will make them inaccessible to users who rely on keyboard navigation" ([Primer Button](https://primer.style/product/components/button/)).

**Accessibility**
- 4.1.2 Name, Role, Value; 2.1.1 Keyboard; 2.4.3 Focus Order (focus kept while loading); 4.1.3 Status Messages (the announcement); 1.1.1 (decorative icons hidden).
- code-standard rules 8, 9, 15 and 18.

**Check**
- *Script:* `tsc --strict` fails `<IconButton icon={…} />` without `aria-label`; render each state in Chrome and run axe-core ([testing: automated checks](testing.md#automated-accessibility-checks-and-their-limits)); assert the loading button is still `document.activeElement` after `loading` turns on; a static scan for `role="button"` and `onClick` on a non-interactive element.
- *Judgement:* For each ARIA attribute the component writes, which native element or attribute was ruled out first?

**Sources:** MDN, APG, Primer, React Aria, Fluent, Base UI and Carbon as linked. On loading, Base Web puts `aria-busy` on the button ([actions: loading buttons](../ui/patterns/actions.md#loading-buttons)), MDN places it on the region being updated, and Primer and React Aria use a focusable button that refuses the action plus an announcement; the toolkit goes with Primer and React Aria. On disabled, Primer advises against it altogether; the toolkit offers both forms, native by default, focusable where the control must be discoverable.

## Polymorphism: `as`, `asChild`, and when to avoid them

**What good looks like**
- A component renders one element, the one its behaviour needs.
- Where a design needs the same look on a different element (a link styled as a button), there are two components, or one documented composition, not a free `as` prop.
- Whatever is rendered keeps its own semantics and keyboard behaviour.

**How**
- **The forms on offer.** MUI's `component` prop "allows you to change the root element" ([MUI composition](https://mui.com/material-ui/guides/composition/)); Chakra's `as` changes "the underlying HTML element" and `asChild` composes "a component's functionality onto its child element" ([Chakra composition](https://chakra-ui.com/docs/components/concepts/composition)); Radix's `asChild` clones the child and passes it "the props and behavior needed to function" ([Radix composition](https://www.radix-ui.com/primitives/docs/guides/composition)); Base UI's `render` with `nativeButton={false}` when "the rendered element is not a button" ([Base UI Button](https://base-ui.com/react/components/button)); Carbon's `as` with "Make sure to apply all props to the root node" ([Carbon Button source](https://github.com/carbon-design-system/carbon/blob/main/packages/react/src/components/Button/Button.tsx)).
- **The cost.** Every form makes the component's semantics the caller's job: Radix says that if you change the element "you are responsible for keeping it accessible and functional". `asChild` is built on cloning, which React calls "uncommon and can lead to fragile code" ([cloneElement](https://react.dev/reference/react/cloneElement)). A polymorphic type is a generic over every element, which slows `tsc` and makes errors hard to read; Chakra notes the passed component's props "aren't inferred from `as`".
- **Prefer separate components.** `Button` renders `button`; `LinkButton` renders `a` with the same classes and data attributes, and a `href` that is required. Primer's changelog lists a `LinkButton` beside `Button` ([@primer/react changelog](https://unpkg.com/@primer/react@38.24.0/CHANGELOG.md)).
- **Where composition is needed** (a router's `Link` with a button's look), take the element as a slot or style it with the component's exported class, rather than letting any element through.

**Cases**
- `<Button as="a" href="/x">` → the `a` gets `type="button"` and `disabled`, neither of which an `a` has; `LinkButton`.
- `<Button as="div">` → no focus, no Enter or Space; do not allow `div`.
- `<Tooltip.Trigger asChild><Icon/></Tooltip.Trigger>` → the icon is not focusable, so the tooltip never opens by keyboard; put a `button` in the trigger.

**Accessibility**
- A changed element must still meet 2.1.1 and 4.1.2; `as` makes that a property of every call site rather than of the component.

**Check**
- *Script:* a static scan for `as`, `asChild`, `component` and `render` props on design-system components, each needing a waiver naming the elements allowed.
- *Judgement:* Is this two components with one look?

**Sources:** MUI, Chakra, Radix, Base UI, Carbon, Primer and react.dev as linked. Chakra and Radix favour `asChild` for flexibility; React's own docs call the cloning beneath it fragile. The toolkit goes with one element per component and a sibling component for the other element.

## Styling hooks and the stylesheet

**What good looks like**
- A variant is an attribute on the root (`data-variant="danger"`) and a state is a pseudo-class or the native attribute; the stylesheet selects on those.
- The component's own class names are stable and documented; the caller's class is added, never required.
- No variant is drawn with inline `style`; `style` stays the caller's.
- The stylesheet arrives in a way the bundler cannot drop and the server can order.

**How**
- **Data attributes for variants and states.** Radix: "Stateful components expose their state in a `data-state` attribute" ([Radix styling](https://www.radix-ui.com/primitives/docs/guides/styling)); React Aria exposes "UI states such as pressed, hovered, and selected using data attributes" and gives each component a default class `react-aria-ComponentName` ([React Aria styling](https://react-aria.adobe.com/styling)). For a native state (`:disabled`, `:checked`, `:focus-visible`, `[aria-pressed]`, `[aria-expanded]`) select the real one, never a copy in a data attribute (code-standard rule 9). The generated stylesheet's hooks are `to-code`'s (`tools/component-contract/README.md`).
- **Class merge.** The root gets the component's class and the caller's: `cx('ds-button', className)`. A React root is the native element with no custom-element host, so the generated sheet selects on the component's classes, root and parts, and every variant and state stays an attribute or pseudo-class (code-standard rule 6).
- **No inline variant styles.** React recommends `className` over `style` except for values known only at runtime ([Common components, style](https://react.dev/reference/react-dom/components/common)). A runtime value the stylesheet must read (a progress percentage) goes in as one custom property, `style={{ '--progress': p }}`, and the sheet uses it.
- **CSS import side effects.** `import './button.css'` in a component is a side effect: webpack warns that "A CSS file imported for its side effect alone needs to be added to the side effect list so it will not be unintentionally dropped in production mode", fixed with `"sideEffects": ["**/*.css"]` in `package.json` ([webpack tree shaking](https://webpack.js.org/guides/tree-shaking/)). The alternative is one library stylesheet the application links once.
- **React 19 stylesheets.** A `<link rel="stylesheet" precedence="…">` rendered in a component is hoisted into `head`, de-duplicated by `href`, and the component suspends while it loads ([link](https://react.dev/reference/react-dom/components/link)). It suits a component used on few routes; a layered design-system sheet (code-standard rule 4) is simpler linked once.

**Cases**
- `style={{ background: variant === 'danger' ? 'var(--red)' : … }}` → `data-variant` and a rule in the sheet; the caller can no longer override it through a custom property (code-standard rule 38).
- `className={variant}` → a class like `danger` collides with the application's; `data-variant`.
- A library with `"sideEffects": false` ships, and buttons render unstyled in production only → list the CSS files in `sideEffects`.
- A `data-disabled` mirrored from `disabled` and styled → style `:disabled`; the mirror can disagree with the control.

**Accessibility**
- Styling off `aria-pressed`, `aria-expanded` and `:disabled` means the look cannot drift from what is announced (4.1.2).
- code-standard rules 4, 9, 38 and 62.

**Check**
- *Script:* a static scan for `style=` in component files whose value is not the caller's prop or a single custom property; render each variant with `react-dom/server` and assert the attribute the sheet selects on; `to-code --check` for the generated sheet.
- *Judgement:* Could a caller restyle this variant through a custom property, without fighting specificity?

**Sources:** Radix, React Aria, react.dev and webpack as linked. React Spectrum disagrees on caller classes: it names them `UNSAFE_className` and `UNSAFE_style`, "a last resort", because a future design update "may cause unintended breaking changes" ([React Spectrum styling](https://react-spectrum.adobe.com/react-spectrum/styling.html)), and Atlassian's Button drops `style` ([Atlassian Button](https://atlassian.design/components/button/code)). The toolkit passes `className` and `style` through, because a component is a native element first, and points callers at custom properties for anything the design governs.

## Server components and `"use client"`

**What good looks like**
- A component that holds no state, runs no effect and touches no browser API has no directive and renders on the server.
- `"use client"` sits on the smallest module that needs it.
- A server-safe component takes only serialisable props.

**How**
- The split itself, and where the directive goes, is [javascript: client and server boundaries, and islands](javascript.md#client-and-server-boundaries-and-islands) and code-standard rules 43 and 47. What React 19 adds:
- **What forces the client.** React lists `createContext`, hooks "excluding `use` and `useId`", "`forwardRef`, `memo`, `startTransition`", and client APIs ([`'use client'`](https://react.dev/reference/rsc/use-client)). A Button with `ref` as a prop and `useId` needs no directive; the same Button wrapped in `forwardRef` does. One more reason to drop `forwardRef`.
- **The directive is contagious downwards.** It marks "the module and its transitive dependencies as client code" ([`'use client'`](https://react.dev/reference/rsc/use-client)): a client file that imports the Icon module ships it. Keep shared parts free of client imports.
- **An event handler passed in does not make the leaf a client component.** A server page cannot pass one; a client caller can. The Button stays without a directive and runs wherever its caller runs (code-standard rule 47).
- **Library packaging.** "If these libraries have been updated to be compatible with React Server Components, then they will already include `'use client'` markers of their own" ([`'use client'`](https://react.dev/reference/rsc/use-client)); keep the directive in the built file, at the very top, above imports.

**Cases**
- `"use client"` at the top of the library's `index.ts` → every component ships to the client; put it on each stateful component's own module.
- A Disclosure that uses `useState` with no directive, imported from a server page → it errors; add `"use client"` to that file.
- A Tooltip uses context for its open state → its provider and trigger are client; the text inside can be server content passed as `children`.

**Accessibility**
- Server-rendered HTML is there for assistive technology before hydration (code-standard rule 20).

**Check**
- *Script:* render every component without a directive with `react-dom/server` `renderToString` in a Node process with no DOM; it must not throw. A static scan: a file with `useState`, `useEffect`, `useContext`, `createContext`, `forwardRef` or `window`/`document` and no `"use client"` first line is an error, and the reverse is a cost to justify (`tools/css-lint/check.mjs` already gates code-standard rules 43 and 47).
- *Judgement:* Does this component itself hold state, run an effect or touch a browser API?

**Sources:** react.dev as linked. React allows Server Functions to cross the boundary; code-standard rule 43 allows no function at all, and the toolkit keeps it, so a shared component renders the same in an application and in a story.

## TypeScript strictness and prop documentation

**What good looks like**
- The library compiles under `"strict": true` with no `any`, explicit or implied.
- Every component exports its props type by name, `ButtonProps`, beside the component.
- Each prop the component adds has a one-line JSDoc comment; native props inherit theirs.

**How**
- **`strict`** "enables a wide range of type checking behavior", including `noImplicitAny` and `strictNullChecks` ([tsconfig strict](https://www.typescriptlang.org/tsconfig/#strict)). "Using `any` disables all further type checking" ([Everyday types, any](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#any)); where a type is truly open, `unknown`.
- **Export the props type** so callers can extend it (`ComponentProps<typeof Button>` also works, but a name is clearer in docs and errors).
- **JSDoc on each prop.** React's TypeScript guide documents props in the type: `/** The text to display inside the button */` ([Using TypeScript](https://react.dev/learn/typescript#typescript-with-react-components)); editors show it, and Storybook's docgen reads it into the props table ([Storybook argTypes](https://storybook.js.org/docs/api/arg-types)). Add `@default` where there is one, as Fluent does ([Fluent Button types](https://github.com/microsoft/fluentui/blob/master/packages/react-components/react-button/library/src/components/Button/Button.types.ts)).
- **Make impossible states unrepresentable** with a union of shapes: an icon-only shape requires `aria-label`; a `LinkButton` requires `href`.

**Cases**
- `props: any` in a generated file → the contract's prop types; nothing in the contract is untyped.
- A JSDoc that says "Figma `Role`" → say what the prop does to the reader; the Figma name is a mapping fact, kept in the parity mapping.
- `ButtonProps` not exported → a caller re-derives it; export it.

**Accessibility**
- Required names in the type (icon-only, a field's label) move 4.1.2 failures from an audit to the compiler.

**Check**
- *Script:* `tsc --noEmit --strict` over the components and their stories; a static scan for `: any`, `as any` and `@ts-ignore`; a scan that every exported component has an exported `<Name>Props` and every own prop a JSDoc line.
- *Judgement:* Does each JSDoc line tell a caller something the name does not?

**Sources:** the TypeScript handbook and tsconfig reference, react.dev, Storybook and Fluent as linked; they agree.

## Stories in CSF3

**What good looks like**
- One `.stories.tsx` per component, with a typed default export and one named story per meaningful state: each variant, each size where it changes layout, disabled, loading, icon-only, long text, and any state the contract draws.
- Args come from the props, so the controls are the API; event props are spies.
- Accessibility checks run on every story and fail the build.

**How**
- **Typed meta with `satisfies`.** "Now you will receive type errors for missing required args, not just invalid ones" ([Storybook TypeScript](https://storybook.js.org/docs/writing-stories/typescript)):
  ```tsx
  import type { Meta, StoryObj } from '@storybook/react-vite';
  import { fn } from 'storybook/test';
  import { Button } from './button';

  const meta = {
    component: Button,
    args: { children: 'Save', onClick: fn() },
    parameters: { a11y: { test: 'error' } },
  } satisfies Meta<typeof Button>;
  export default meta;
  type Story = StoryObj<typeof meta>;

  export const Primary = { args: { variant: 'primary' } } satisfies Story;
  export const Disabled = { args: { disabled: true } } satisfies Story;
  ```
- **Types from the framework's package.** `Meta` and `StoryObj` are imported from the Storybook framework the project installs (`@storybook/react-vite`, `@storybook/nextjs-vite`), not the renderer's `@storybook/react`, which a project on a framework package does not depend on: `tsc` cannot resolve it (found generating 63 components into a Next.js project, 2026-10-30; [Storybook TypeScript](https://storybook.js.org/docs/writing-stories/typescript)).
- **What a story is.** "A story captures the rendered state of a UI component"; the default export "controls how Storybook lists your stories", and "every named export in the file represents a story object" ([Writing stories](https://storybook.js.org/docs/writing-stories), [CSF](https://storybook.js.org/docs/api/csf)). CSF3 renders the component with its args when `render` is omitted.
- **argTypes from the component.** Storybook infers them "using react-docgen (default) or react-docgen-typescript"; state only what inference cannot (`options` for a union, `table: { disable: true }` to hide a row) ([argTypes](https://storybook.js.org/docs/api/arg-types)).
- **Handlers as spies.** "The recommended way is to assign `fn()` to an arg", imported from `storybook/test`; `argTypesRegex` "is not the recommended way" ([Actions](https://storybook.js.org/docs/essentials/actions)).
- **Accessibility addon.** Built on axe-core; `parameters.a11y.test` is `'off'`, `'todo'` (warn) or `'error'` (fail in CI) ([Storybook accessibility testing](https://storybook.js.org/docs/writing-tests/accessibility-testing)). Set `'error'` in the meta.
- **Interaction states with `play`.** A story's `play` function runs after render ([CSF](https://storybook.js.org/docs/api/csf)): open a menu, focus a field, then let the a11y check run on the opened state.
- The parity mapping names stories by id, so story names are stable (the `design-code-parity` skill).

**Cases**
- One `Default` story with every prop as a control → a reviewer and a test runner see one state; a story per state.
- `export default { component: Button }` untyped → a required arg missing from a story compiles; `satisfies Meta<typeof Button>`.
- `onClick: () => {}` in args → nothing is recorded; `fn()`.
- An icon-only story without `aria-label` → `tsc` fails it if the type requires it, and axe fails it if not.

**Accessibility**
- axe on each story covers part of 1.1.1, 1.3.1, 1.4.3 and 4.1.2 per state; what it cannot judge is [testing.md](testing.md#automated-accessibility-checks-and-their-limits)'s.

**Check**
- *Script:* `tsc --strict` over the stories; a static scan that the meta uses `satisfies Meta<typeof …>`, sets `a11y.test: 'error'`, and has a named export for each value of each union prop and each boolean the contract draws; the Storybook test runner or Vitest addon in CI.
- *Judgement:* Is there a state a person meets that no story shows?

**Sources:** Storybook as linked. Storybook's docs show one story per variant but do not say "a story per state"; the toolkit requires it, because parity proves the set (code-standard rule 33).

## Tests: render, role queries, axe

**What good looks like**
- Each component renders on the server without a DOM and in a browser with one.
- Tests find elements by role and accessible name, and act as a person does.
- axe-core runs on each rendered state in a real browser engine.

**How**
- **Server render.** `renderToString` produces "the initial non-interactive HTML output" ([renderToString](https://react.dev/reference/react-dom/server/renderToString)); asserting on it proves a component without a directive is server-safe and its markup carries the hooks the sheet needs.
- **Role queries.** Testing Library: "The more your tests resemble the way your software is used, the more confidence they can give you", and tests "deal with DOM nodes rather than component instances" ([Guiding principles](https://testing-library.com/docs/guiding-principles/)); `getByRole` "should be your top preference for just about everything", `getByTestId` only "where you can't match by role or text" ([Queries, priority](https://testing-library.com/docs/queries/about/#priority)). The levels and why are [testing: what to test at which level](testing.md#what-to-test-at-which-level).
- **axe in a real browser.** axe-core "can find on average 57% of WCAG issues automatically" and reports "incomplete" where unsure; its `color-contrast` rule does not work in jsdom ([axe-core](https://github.com/dequelabs/axe-core)). Run it in Chrome, per theme, after opening anything that opens ([testing: automated checks](testing.md#automated-accessibility-checks-and-their-limits)).
- **What to assert per component**: the role and name; that the native attributes and `ref` pass through; each event fires from mouse and keyboard; controlled and uncontrolled both work; the disabled forms (focusable or not) behave as named; the loading state keeps focus and announces.

**Cases**
- A test finds the button by `.ds-button` → `getByRole('button', { name: 'Save' })`; the test then fails when the name breaks, which is what a person notices.
- axe runs in jsdom and passes contrast → it never checked it; run it in a browser.
- A component imports `window` at module scope and its unit tests pass in jsdom → `renderToString` in plain Node catches it.

**Accessibility**
- Role-and-name queries exercise 4.1.2 on every run; keyboard steps exercise 2.1.1.

**Check**
- *Script:* the three runs above (`renderToString` in Node, Testing Library by role, axe-core in Chrome); fail the run if a component has no test file or a story set to `a11y.test: 'off'` without a reason (code-standard rule 41).
- *Judgement:* For this component's riskiest behaviour, which test would fail if it broke?

**Sources:** react.dev, Testing Library and axe-core as linked; they agree with [testing.md](testing.md).

---

**Note on sources.** react.dev has no current accessibility page; its old one is on the legacy site, which "is no longer updated" ([legacy Accessibility](https://legacy.reactjs.org/docs/accessibility.html)), so this page cites MDN, the APG and the toolkit's [accessibility.md](accessibility.md) for accessibility. Shopify's Polaris React is deprecated and archived in favour of Polaris Web Components ([polaris-react](https://github.com/Shopify/polaris-react)); it is not used as evidence here.
