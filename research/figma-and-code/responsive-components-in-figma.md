# Where responsive behaviour belongs in a Figma library

Where a component's behaviour across widths should live in Figma, for library teams choosing between auto layout, modes, variants and separate components.

A designer opens the library's Card and finds three variants: Desktop, Tablet, Mobile. The Mobile one has 12px padding instead of 16 and a smaller title, and nothing else differs. Last month someone changed the Desktop card's border colour and forgot the other two, so the product now ships two greys. Meanwhile, on the marketing site, the hero section has no mobile variant at all, and every page carries a detached copy rebuilt by hand.

"Responsive" names two different jobs. In product UI it's reflow, and it belongs in auto layout and token modes, almost never in a breakpoint variant. On a marketing page it's art direction, and there a breakpoint variant is the honest representation. Most published advice is right for the first and wrong for the second.

---

## What this answers

- [Where responsiveness lives](#where-responsiveness-lives): where responsive behaviour can live
- [Reflow versus art direction](#reflow-versus-art-direction): which of the two a component needs
- [Width in product components](#width-in-product-components): how product components handle width
- [Width in marketing sections](#width-in-marketing-sections): how marketing sections handle width
- [Naming breakpoint properties](#naming-breakpoint-properties): how breakpoint properties are named
- [Breakpoints in code](#breakpoints-in-code): how a Figma breakpoint reaches code

For a lookup, use the [cheat sheet](#cheat-sheet); [the short version](#the-short-version) is the whole guide in three paragraphs. Whether a different surface (a native app, a marketing site) should get its own library is a separate question with a different answer, in [When should a design system split into more than one component library?](when-to-split-a-component-library.md)

---

## Where responsiveness lives

Responsive behaviour can live in four places, in rising order of cost (auto layout, token values that change by mode, a variant axis, or a second component with its own name), and most components should stop at the first or second.

Take the three-variant Card. Its padding and title size could have lived in variables that change by mode. Its stacking could have lived in auto layout. Instead it lives in the most expensive place on the list.

Here are the four places, from cheapest to dearest.

<svg role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 880 268" font-family="Inter, 'Helvetica Neue', Arial, sans-serif" style="display:block;width:100%;height:auto;margin:2em 0"><title>Four stepped rows labelled auto layout, variable modes, variant axis and separate component, each further indented, with one to four filled dots on the right showing rising maintenance cost.</title><rect width="880" height="268" fill="#FBFAF8"/><rect x="0.5" y="0.5" width="879" height="267" fill="none" stroke="#E3DFD8"/><text x="32" y="38" font-size="13.5" font-weight="600" fill="#1C1B19">Where responsive behaviour can live</text><line x1="26" y1="62" x2="26" y2="240" stroke="#CFC9BF" stroke-width="1.5"/><path d="M26 246 l-5 -10 h10 z" fill="#CFC9BF"/><rect x="48" y="60" width="800" height="36" rx="3" fill="#FFFFFF" stroke="#DFDAD2"/><rect x="48" y="60" width="3" height="36" fill="#4C7A5A"/><text x="66" y="83" font-size="12.5" fill="#1C1B19">Auto layout</text><circle cx="806" cy="78" r="3.2" fill="#4C7A5A" stroke="#4C7A5A" stroke-width="1"/><circle cx="792" cy="78" r="3.2" fill="none" stroke="#4C7A5A" stroke-width="1"/><circle cx="778" cy="78" r="3.2" fill="none" stroke="#4C7A5A" stroke-width="1"/><circle cx="764" cy="78" r="3.2" fill="none" stroke="#4C7A5A" stroke-width="1"/><rect x="74" y="106" width="774" height="36" rx="3" fill="#FFFFFF" stroke="#DFDAD2"/><rect x="74" y="106" width="3" height="36" fill="#5E7E93"/><text x="92" y="129" font-size="12.5" fill="#1C1B19">Variable modes</text><circle cx="806" cy="124" r="3.2" fill="#5E7E93" stroke="#5E7E93" stroke-width="1"/><circle cx="792" cy="124" r="3.2" fill="#5E7E93" stroke="#5E7E93" stroke-width="1"/><circle cx="778" cy="124" r="3.2" fill="none" stroke="#5E7E93" stroke-width="1"/><circle cx="764" cy="124" r="3.2" fill="none" stroke="#5E7E93" stroke-width="1"/><rect x="100" y="152" width="748" height="36" rx="3" fill="#FFFFFF" stroke="#DFDAD2"/><rect x="100" y="152" width="3" height="36" fill="#B08040"/><text x="118" y="175" font-size="12.5" fill="#1C1B19">Variant axis</text><circle cx="806" cy="170" r="3.2" fill="#B08040" stroke="#B08040" stroke-width="1"/><circle cx="792" cy="170" r="3.2" fill="#B08040" stroke="#B08040" stroke-width="1"/><circle cx="778" cy="170" r="3.2" fill="#B08040" stroke="#B08040" stroke-width="1"/><circle cx="764" cy="170" r="3.2" fill="none" stroke="#B08040" stroke-width="1"/><rect x="126" y="198" width="722" height="36" rx="3" fill="#FFFFFF" stroke="#DFDAD2"/><rect x="126" y="198" width="3" height="36" fill="#A6552F"/><text x="144" y="221" font-size="12.5" fill="#1C1B19">Separate component</text><circle cx="806" cy="216" r="3.2" fill="#A6552F" stroke="#A6552F" stroke-width="1"/><circle cx="792" cy="216" r="3.2" fill="#A6552F" stroke="#A6552F" stroke-width="1"/><circle cx="778" cy="216" r="3.2" fill="#A6552F" stroke="#A6552F" stroke-width="1"/><circle cx="764" cy="216" r="3.2" fill="#A6552F" stroke="#A6552F" stroke-width="1"/></svg>

The dots show relative maintenance cost: each step down duplicates more of the component.

Nobody disputes the list; systems disagree about how far down it they go. The ordering has little to do with how responsiveness works in code, where a media query is free. A Figma variant isn't free. It's duplicated geometry that a person maintains and, in an ordinary design file, has to switch by hand.

Figma does have a mechanic that inserts the right variant for the right breakpoint, by matching breakpoint names against variant values. It lives only in Figma Sites, which is still in open beta. Everywhere else a "Mobile" variant sits in a dropdown waiting to be chosen. That's usually given as a reason to avoid breakpoint variants; it turns out to be more interesting than that, as [the marketing case](#width-in-marketing-sections) shows.

Figma Design itself has no breakpoints. It approximates them with number variable modes named for sizes. Figma Sites has real ones (desktop at 1280, tablet at 800, mobile at 375 by default) as minimum-width ranges, where edits to the primary breakpoint cascade.

Code has a harder job. It has to work at every width from 320 up, and container queries let a component respond to its own width rather than the page's. A card drawn at 375 and 1280 says nothing about 900 inside a sidebar.

Go down the list in order, and stop at the first mechanism that covers the change. **Whatever you draw, write down the rule for the widths between**: a container-query threshold, a `clamp()`, a minimum column width, in the component's description or spec.

---

## Reflow versus art direction

Tell reflow from art direction first, because nearly every answer flips between them: reflow is the same parts rearranged by available width, with nothing decided, and art direction is a different composition a person chose.

The Card and the hero both get called responsive, and they aren't the same kind of thing. The figure puts them side by side.

<svg role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 880 286" font-family="Inter, 'Helvetica Neue', Arial, sans-serif" style="display:block;width:100%;height:auto;margin:2em 0"><title>Left, reflow: three cards in a row when wide, stacked in a column when narrow. Right, art direction: a hero with text beside an image when wide, and with the image above the text and a full-width button when narrow.</title><rect width="880" height="286" fill="#FBFAF8"/><rect x="0.5" y="0.5" width="879" height="285" fill="none" stroke="#E3DFD8"/><text x="32" y="38" font-size="13.5" font-weight="600" fill="#1C1B19">Reflow and art direction</text><line x1="440" y1="58" x2="440" y2="258" stroke="#E3DFD8"/><text x="32" y="76" font-size="12.5" fill="#1C1B19">Reflow</text><text x="466" y="76" font-size="12.5" fill="#1C1B19">Art direction</text><rect x="32" y="92" width="236" height="132" rx="3" fill="#FFFFFF" stroke="#DFDAD2"/><rect x="46" y="106" width="60" height="54" rx="2" fill="#9FB4C2"/><rect x="118" y="106" width="60" height="54" rx="2" fill="#9FB4C2"/><rect x="190" y="106" width="60" height="54" rx="2" fill="#9FB4C2"/><rect x="46" y="172" width="208" height="10" rx="2" fill="#EDEAE4"/><rect x="46" y="190" width="150" height="10" rx="2" fill="#EDEAE4"/><rect x="288" y="92" width="104" height="132" rx="3" fill="#FFFFFF" stroke="#DFDAD2"/><rect x="302" y="106" width="76" height="30" rx="2" fill="#9FB4C2"/><rect x="302" y="144" width="76" height="30" rx="2" fill="#9FB4C2"/><rect x="302" y="182" width="76" height="30" rx="2" fill="#9FB4C2"/><rect x="466" y="92" width="236" height="132" rx="3" fill="#F5EFE8" stroke="#DFDAD2"/><rect x="484" y="122" width="96" height="11" rx="3" fill="#3F3C37"/><rect x="484" y="142" width="70" height="7" rx="3" fill="#BDB7AD"/><rect x="484" y="162" width="50" height="16" rx="8" fill="#A6552F"/><circle cx="646" cy="150" r="36" fill="#D9A97E"/><rect x="722" y="92" width="104" height="132" rx="3" fill="#F5EFE8" stroke="#DFDAD2"/><circle cx="774" cy="128" r="24" fill="#D9A97E"/><rect x="738" y="166" width="72" height="9" rx="3" fill="#3F3C37"/><rect x="738" y="182" width="50" height="7" rx="3" fill="#BDB7AD"/><rect x="738" y="198" width="72" height="15" rx="7.5" fill="#A6552F"/><text x="150" y="244" font-size="11" fill="#9A948B" text-anchor="middle">wide</text><text x="340" y="244" font-size="11" fill="#9A948B" text-anchor="middle">narrow</text><text x="584" y="244" font-size="11" fill="#9A948B" text-anchor="middle">wide</text><text x="774" y="244" font-size="11" fill="#9A948B" text-anchor="middle">narrow</text></svg>

On the left, the same parts rearranged by width. On the right, a different composition someone chose.

In product UI, a container of unknown width holds data of unknown length, and the layout absorbs it. Three cards in a row become a column because the constraints said so. Nobody art-directs a settings page at 768 pixels.

On a marketing page, the desktop hero and the mobile hero are two compositions. The image moved above the headline, the eyebrow was dropped, the button went full width, the crop changed.

Almost every well-known piece of writing on this is about the first case, because almost every well-known design system is a product system. Adobe draws the line explicitly in explaining why Adobe.com needed a second system. Marketing content is fast, fluid and content-heavy, and the patterns that give clarity inside a product are, in Adobe's words, too subtle for the information hierarchies of marketing pages.

Classify each component before choosing a mechanism: if nobody would ever redraw it at a narrower width, it's reflow. [Product components](#width-in-product-components) and [marketing sections](#width-in-marketing-sections) take the two cases in turn. **Ask "did someone compose this?" before asking "how wide is it?"**

---

## Width in product components

Product components should use auto layout first, then a scale or density mode for size changes, then a breakpoint axis only where child order or layer structure changes, then a separately named component where anatomy and semantics differ.

Back to the Card whose Mobile variant only has smaller padding and a smaller title. Nothing about its structure changes between widths; only its numbers do. That's what a mode is for.

Adobe Spectrum is the clearest case for the token-mode approach, partly because it doesn't frame it as breakpoints at all. Spectrum defines two platform scales, one for cursor and one for touch, as a dimension with modes named `desktop` and `mobile` (older names in the data are `medium` and `large`). The same component token resolves differently by scale.

<svg role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 880 214" font-family="Inter, 'Helvetica Neue', Arial, sans-serif" style="display:block;width:100%;height:auto;margin:2em 0"><title>Three Spectrum token names with their desktop and mobile values: component-height-100, 32px and 40px; font-size-200, 16px and 19px; meter-width, 192px and 240px.</title><rect width="880" height="214" fill="#FBFAF8"/><rect x="0.5" y="0.5" width="879" height="213" fill="none" stroke="#E3DFD8"/><text x="32" y="38" font-size="13.5" font-weight="600" fill="#1C1B19">One token, two scales</text><text x="560" y="76" font-size="11" fill="#9A948B">desktop</text><text x="704" y="76" font-size="11" fill="#9A948B">mobile</text><line x1="32" y1="88" x2="848" y2="88" stroke="#DFDAD2"/><text x="44" y="118" font-size="12" font-family="ui-monospace, Menlo, monospace" fill="#3F3C37">component-height-100</text><text x="560" y="118" font-size="12.5" fill="#77726B">32px</text><text x="704" y="118" font-size="12.5" font-weight="600" fill="#A6552F">40px</text><line x1="32" y1="131" x2="848" y2="131" stroke="#EDEAE4"/><text x="44" y="152" font-size="12" font-family="ui-monospace, Menlo, monospace" fill="#3F3C37">font-size-200</text><text x="560" y="152" font-size="12.5" fill="#77726B">16px</text><text x="704" y="152" font-size="12.5" font-weight="600" fill="#A6552F">19px</text><line x1="32" y1="165" x2="848" y2="165" stroke="#EDEAE4"/><text x="44" y="186" font-size="12" font-family="ui-monospace, Menlo, monospace" fill="#3F3C37">meter-width</text><text x="560" y="186" font-size="12.5" fill="#77726B">192px</text><text x="704" y="186" font-size="12.5" font-weight="600" fill="#A6552F">240px</text><line x1="32" y1="184" x2="848" y2="184" stroke="#DFDAD2"/></svg>

The component isn't duplicated; the values it reads are. There is one Button in Spectrum, not two: the touch version is the same Button read under a different scale.

Salesforce arrives nearby from another direction. It treats density as a user preference (`comfy` and `compact`) driven through spacing hooks rather than component copies. Most of what changes between desktop and phone is size, not structure: padding, tap targets and type grow, gutters shrink. In variable modes, one component covers both.

The catch is that modes change values; they don't move layers. A card whose padding grows is well served. A navigation bar that becomes a rail isn't.

> **Aside.** Modes were capped at four per collection on Professional until 28 October 2025, which is why so many systems of that era ended up with variant axes. The limits are now 10 on Professional and 20 on Organization, which changed the economics after most systems had decided.

Where structure genuinely changes, Material 3 shows the far end. It formalises five window size classes (compact below 600dp, medium to 840dp, expanded to 1200dp, then large and extra-large) and swaps components outright.

<svg role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 880 272" font-family="Inter, 'Helvetica Neue', Arial, sans-serif" style="display:block;width:100%;height:auto;margin:2em 0"><title>Three frames: NavigationBar, a bottom bar; NavigationRail, a narrow vertical rail; NavigationDrawer, an expanded drawer with labels.</title><rect width="880" height="272" fill="#FBFAF8"/><rect x="0.5" y="0.5" width="879" height="271" fill="none" stroke="#E3DFD8"/><text x="32" y="38" font-size="13.5" font-weight="600" fill="#1C1B19">Three components, not three variants</text><rect x="32" y="62" width="232" height="154" rx="3" fill="#FFFFFF" stroke="#DFDAD2"/><rect x="76" y="80" width="144" height="98" rx="2" fill="#F2EFE9"/><rect x="76" y="166" width="144" height="26" rx="2" fill="#8FA8B8"/><circle cx="102" cy="179" r="3.4" fill="#FFFFFF"/><circle cx="130" cy="179" r="3.4" fill="#FFFFFF"/><circle cx="158" cy="179" r="3.4" fill="#FFFFFF"/><circle cx="186" cy="179" r="3.4" fill="#FFFFFF"/><rect x="300" y="62" width="256" height="154" rx="3" fill="#FFFFFF" stroke="#DFDAD2"/><rect x="324" y="80" width="28" height="112" rx="2" fill="#8FA8B8"/><circle cx="338" cy="98" r="3.4" fill="#FFFFFF"/><circle cx="338" cy="124" r="3.4" fill="#FFFFFF"/><circle cx="338" cy="150" r="3.4" fill="#FFFFFF"/><circle cx="338" cy="176" r="3.4" fill="#FFFFFF"/><rect x="362" y="80" width="170" height="112" rx="2" fill="#F2EFE9"/><rect x="592" y="62" width="256" height="154" rx="3" fill="#FFFFFF" stroke="#DFDAD2"/><rect x="616" y="80" width="74" height="112" rx="2" fill="#8FA8B8"/><rect x="626" y="94" width="54" height="5" rx="2.5" fill="#FFFFFF"/><rect x="626" y="114" width="44" height="5" rx="2.5" fill="#FFFFFF"/><rect x="626" y="134" width="50" height="5" rx="2.5" fill="#FFFFFF"/><rect x="626" y="154" width="38" height="5" rx="2.5" fill="#FFFFFF"/><rect x="700" y="80" width="124" height="112" rx="2" fill="#F2EFE9"/><text x="148" y="242" font-size="12.5" fill="#1C1B19" text-anchor="middle">NavigationBar</text><text x="428" y="242" font-size="12.5" fill="#1C1B19" text-anchor="middle">NavigationRail</text><text x="720" y="242" font-size="12.5" fill="#1C1B19" text-anchor="middle">NavigationDrawer</text></svg>

Compact gets NavigationBar, medium and expanded get NavigationRail, large gets NavigationDrawer. Three names, because they're three things.

They're three components reconciled in code by a scaffold that picks one, not three variants of a "Navigation" set. When anatomy, affordances and accessibility semantics all differ, calling them one component is a fiction that makes both files and conversations harder.

Between those poles sits the variant axis, and its cost is arithmetic. Before looking, work out what one three-value breakpoint axis does to a button that already has Type, State and Icon properties.

<svg role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 880 268" font-family="Inter, 'Helvetica Neue', Arial, sans-serif" style="display:block;width:100%;height:auto;margin:2em 0"><title>Left, 32 small squares labelled 4 by 4 by 2. Right, 96 small squares labelled 4 by 4 by 2 by 3, at the same scale.</title><rect width="880" height="268" fill="#FBFAF8"/><rect x="0.5" y="0.5" width="879" height="267" fill="none" stroke="#E3DFD8"/><text x="32" y="38" font-size="13.5" font-weight="600" fill="#1C1B19">Adding one three-value axis</text><line x1="440" y1="58" x2="440" y2="240" stroke="#E3DFD8"/><text x="32" y="82" font-size="22" font-weight="600" fill="#5E7E93">32</text><text x="80" y="82" font-size="11" fill="#9A948B">4 &#215; 4 &#215; 2</text><text x="466" y="82" font-size="22" font-weight="600" fill="#A6552F">96</text><text x="522" y="82" font-size="11" fill="#9A948B">4 &#215; 4 &#215; 2 &#215; 3</text><rect x="32" y="100" width="11" height="11" rx="1.5" fill="#9FB4C2" stroke="#7D97A8" stroke-width="0.6"/><rect x="46" y="100" width="11" height="11" rx="1.5" fill="#9FB4C2" stroke="#7D97A8" stroke-width="0.6"/><rect x="60" y="100" width="11" height="11" rx="1.5" fill="#9FB4C2" stroke="#7D97A8" stroke-width="0.6"/><rect x="74" y="100" width="11" height="11" rx="1.5" fill="#9FB4C2" stroke="#7D97A8" stroke-width="0.6"/><rect x="88" y="100" width="11" height="11" rx="1.5" fill="#9FB4C2" stroke="#7D97A8" stroke-width="0.6"/><rect x="102" y="100" width="11" height="11" rx="1.5" fill="#9FB4C2" stroke="#7D97A8" stroke-width="0.6"/><rect x="116" y="100" width="11" height="11" rx="1.5" fill="#9FB4C2" stroke="#7D97A8" stroke-width="0.6"/><rect x="130" y="100" width="11" height="11" rx="1.5" fill="#9FB4C2" stroke="#7D97A8" stroke-width="0.6"/><rect x="32" y="114" width="11" height="11" rx="1.5" fill="#9FB4C2" stroke="#7D97A8" stroke-width="0.6"/><rect x="46" y="114" width="11" height="11" rx="1.5" fill="#9FB4C2" stroke="#7D97A8" stroke-width="0.6"/><rect x="60" y="114" width="11" height="11" rx="1.5" fill="#9FB4C2" stroke="#7D97A8" stroke-width="0.6"/><rect x="74" y="114" width="11" height="11" rx="1.5" fill="#9FB4C2" stroke="#7D97A8" stroke-width="0.6"/><rect x="88" y="114" width="11" height="11" rx="1.5" fill="#9FB4C2" stroke="#7D97A8" stroke-width="0.6"/><rect x="102" y="114" width="11" height="11" rx="1.5" fill="#9FB4C2" stroke="#7D97A8" stroke-width="0.6"/><rect x="116" y="114" width="11" height="11" rx="1.5" fill="#9FB4C2" stroke="#7D97A8" stroke-width="0.6"/><rect x="130" y="114" width="11" height="11" rx="1.5" fill="#9FB4C2" stroke="#7D97A8" stroke-width="0.6"/><rect x="32" y="128" width="11" height="11" rx="1.5" fill="#9FB4C2" stroke="#7D97A8" stroke-width="0.6"/><rect x="46" y="128" width="11" height="11" rx="1.5" fill="#9FB4C2" stroke="#7D97A8" stroke-width="0.6"/><rect x="60" y="128" width="11" height="11" rx="1.5" fill="#9FB4C2" stroke="#7D97A8" stroke-width="0.6"/><rect x="74" y="128" width="11" height="11" rx="1.5" fill="#9FB4C2" stroke="#7D97A8" stroke-width="0.6"/><rect x="88" y="128" width="11" height="11" rx="1.5" fill="#9FB4C2" stroke="#7D97A8" stroke-width="0.6"/><rect x="102" y="128" width="11" height="11" rx="1.5" fill="#9FB4C2" stroke="#7D97A8" stroke-width="0.6"/><rect x="116" y="128" width="11" height="11" rx="1.5" fill="#9FB4C2" stroke="#7D97A8" stroke-width="0.6"/><rect x="130" y="128" width="11" height="11" rx="1.5" fill="#9FB4C2" stroke="#7D97A8" stroke-width="0.6"/><rect x="32" y="142" width="11" height="11" rx="1.5" fill="#9FB4C2" stroke="#7D97A8" stroke-width="0.6"/><rect x="46" y="142" width="11" height="11" rx="1.5" fill="#9FB4C2" stroke="#7D97A8" stroke-width="0.6"/><rect x="60" y="142" width="11" height="11" rx="1.5" fill="#9FB4C2" stroke="#7D97A8" stroke-width="0.6"/><rect x="74" y="142" width="11" height="11" rx="1.5" fill="#9FB4C2" stroke="#7D97A8" stroke-width="0.6"/><rect x="88" y="142" width="11" height="11" rx="1.5" fill="#9FB4C2" stroke="#7D97A8" stroke-width="0.6"/><rect x="102" y="142" width="11" height="11" rx="1.5" fill="#9FB4C2" stroke="#7D97A8" stroke-width="0.6"/><rect x="116" y="142" width="11" height="11" rx="1.5" fill="#9FB4C2" stroke="#7D97A8" stroke-width="0.6"/><rect x="130" y="142" width="11" height="11" rx="1.5" fill="#9FB4C2" stroke="#7D97A8" stroke-width="0.6"/><rect x="466" y="100" width="11" height="11" rx="1.5" fill="#D9A97E" stroke="#B98A5E" stroke-width="0.6"/><rect x="480" y="100" width="11" height="11" rx="1.5" fill="#D9A97E" stroke="#B98A5E" stroke-width="0.6"/><rect x="494" y="100" width="11" height="11" rx="1.5" fill="#D9A97E" stroke="#B98A5E" stroke-width="0.6"/><rect x="508" y="100" width="11" height="11" rx="1.5" fill="#D9A97E" stroke="#B98A5E" stroke-width="0.6"/><rect x="522" y="100" width="11" height="11" rx="1.5" fill="#D9A97E" stroke="#B98A5E" stroke-width="0.6"/><rect x="536" y="100" width="11" height="11" rx="1.5" fill="#D9A97E" stroke="#B98A5E" stroke-width="0.6"/><rect x="550" y="100" width="11" height="11" rx="1.5" fill="#D9A97E" stroke="#B98A5E" stroke-width="0.6"/><rect x="564" y="100" width="11" height="11" rx="1.5" fill="#D9A97E" stroke="#B98A5E" stroke-width="0.6"/><rect x="578" y="100" width="11" height="11" rx="1.5" fill="#D9A97E" stroke="#B98A5E" stroke-width="0.6"/><rect x="592" y="100" width="11" height="11" rx="1.5" fill="#D9A97E" stroke="#B98A5E" stroke-width="0.6"/><rect x="606" y="100" width="11" height="11" rx="1.5" fill="#D9A97E" stroke="#B98A5E" stroke-width="0.6"/><rect x="620" y="100" width="11" height="11" rx="1.5" fill="#D9A97E" stroke="#B98A5E" stroke-width="0.6"/><rect x="634" y="100" width="11" height="11" rx="1.5" fill="#D9A97E" stroke="#B98A5E" stroke-width="0.6"/><rect x="648" y="100" width="11" height="11" rx="1.5" fill="#D9A97E" stroke="#B98A5E" stroke-width="0.6"/><rect x="662" y="100" width="11" height="11" rx="1.5" fill="#D9A97E" stroke="#B98A5E" stroke-width="0.6"/><rect x="676" y="100" width="11" height="11" rx="1.5" fill="#D9A97E" stroke="#B98A5E" stroke-width="0.6"/><rect x="466" y="114" width="11" height="11" rx="1.5" fill="#D9A97E" stroke="#B98A5E" stroke-width="0.6"/><rect x="480" y="114" width="11" height="11" rx="1.5" fill="#D9A97E" stroke="#B98A5E" stroke-width="0.6"/><rect x="494" y="114" width="11" height="11" rx="1.5" fill="#D9A97E" stroke="#B98A5E" stroke-width="0.6"/><rect x="508" y="114" width="11" height="11" rx="1.5" fill="#D9A97E" stroke="#B98A5E" stroke-width="0.6"/><rect x="522" y="114" width="11" height="11" rx="1.5" fill="#D9A97E" stroke="#B98A5E" stroke-width="0.6"/><rect x="536" y="114" width="11" height="11" rx="1.5" fill="#D9A97E" stroke="#B98A5E" stroke-width="0.6"/><rect x="550" y="114" width="11" height="11" rx="1.5" fill="#D9A97E" stroke="#B98A5E" stroke-width="0.6"/><rect x="564" y="114" width="11" height="11" rx="1.5" fill="#D9A97E" stroke="#B98A5E" stroke-width="0.6"/><rect x="578" y="114" width="11" height="11" rx="1.5" fill="#D9A97E" stroke="#B98A5E" stroke-width="0.6"/><rect x="592" y="114" width="11" height="11" rx="1.5" fill="#D9A97E" stroke="#B98A5E" stroke-width="0.6"/><rect x="606" y="114" width="11" height="11" rx="1.5" fill="#D9A97E" stroke="#B98A5E" stroke-width="0.6"/><rect x="620" y="114" width="11" height="11" rx="1.5" fill="#D9A97E" stroke="#B98A5E" stroke-width="0.6"/><rect x="634" y="114" width="11" height="11" rx="1.5" fill="#D9A97E" stroke="#B98A5E" stroke-width="0.6"/><rect x="648" y="114" width="11" height="11" rx="1.5" fill="#D9A97E" stroke="#B98A5E" stroke-width="0.6"/><rect x="662" y="114" width="11" height="11" rx="1.5" fill="#D9A97E" stroke="#B98A5E" stroke-width="0.6"/><rect x="676" y="114" width="11" height="11" rx="1.5" fill="#D9A97E" stroke="#B98A5E" stroke-width="0.6"/><rect x="466" y="128" width="11" height="11" rx="1.5" fill="#D9A97E" stroke="#B98A5E" stroke-width="0.6"/><rect x="480" y="128" width="11" height="11" rx="1.5" fill="#D9A97E" stroke="#B98A5E" stroke-width="0.6"/><rect x="494" y="128" width="11" height="11" rx="1.5" fill="#D9A97E" stroke="#B98A5E" stroke-width="0.6"/><rect x="508" y="128" width="11" height="11" rx="1.5" fill="#D9A97E" stroke="#B98A5E" stroke-width="0.6"/><rect x="522" y="128" width="11" height="11" rx="1.5" fill="#D9A97E" stroke="#B98A5E" stroke-width="0.6"/><rect x="536" y="128" width="11" height="11" rx="1.5" fill="#D9A97E" stroke="#B98A5E" stroke-width="0.6"/><rect x="550" y="128" width="11" height="11" rx="1.5" fill="#D9A97E" stroke="#B98A5E" stroke-width="0.6"/><rect x="564" y="128" width="11" height="11" rx="1.5" fill="#D9A97E" stroke="#B98A5E" stroke-width="0.6"/><rect x="578" y="128" width="11" height="11" rx="1.5" fill="#D9A97E" stroke="#B98A5E" stroke-width="0.6"/><rect x="592" y="128" width="11" height="11" rx="1.5" fill="#D9A97E" stroke="#B98A5E" stroke-width="0.6"/><rect x="606" y="128" width="11" height="11" rx="1.5" fill="#D9A97E" stroke="#B98A5E" stroke-width="0.6"/><rect x="620" y="128" width="11" height="11" rx="1.5" fill="#D9A97E" stroke="#B98A5E" stroke-width="0.6"/><rect x="634" y="128" width="11" height="11" rx="1.5" fill="#D9A97E" stroke="#B98A5E" stroke-width="0.6"/><rect x="648" y="128" width="11" height="11" rx="1.5" fill="#D9A97E" stroke="#B98A5E" stroke-width="0.6"/><rect x="662" y="128" width="11" height="11" rx="1.5" fill="#D9A97E" stroke="#B98A5E" stroke-width="0.6"/><rect x="676" y="128" width="11" height="11" rx="1.5" fill="#D9A97E" stroke="#B98A5E" stroke-width="0.6"/><rect x="466" y="142" width="11" height="11" rx="1.5" fill="#D9A97E" stroke="#B98A5E" stroke-width="0.6"/><rect x="480" y="142" width="11" height="11" rx="1.5" fill="#D9A97E" stroke="#B98A5E" stroke-width="0.6"/><rect x="494" y="142" width="11" height="11" rx="1.5" fill="#D9A97E" stroke="#B98A5E" stroke-width="0.6"/><rect x="508" y="142" width="11" height="11" rx="1.5" fill="#D9A97E" stroke="#B98A5E" stroke-width="0.6"/><rect x="522" y="142" width="11" height="11" rx="1.5" fill="#D9A97E" stroke="#B98A5E" stroke-width="0.6"/><rect x="536" y="142" width="11" height="11" rx="1.5" fill="#D9A97E" stroke="#B98A5E" stroke-width="0.6"/><rect x="550" y="142" width="11" height="11" rx="1.5" fill="#D9A97E" stroke="#B98A5E" stroke-width="0.6"/><rect x="564" y="142" width="11" height="11" rx="1.5" fill="#D9A97E" stroke="#B98A5E" stroke-width="0.6"/><rect x="578" y="142" width="11" height="11" rx="1.5" fill="#D9A97E" stroke="#B98A5E" stroke-width="0.6"/><rect x="592" y="142" width="11" height="11" rx="1.5" fill="#D9A97E" stroke="#B98A5E" stroke-width="0.6"/><rect x="606" y="142" width="11" height="11" rx="1.5" fill="#D9A97E" stroke="#B98A5E" stroke-width="0.6"/><rect x="620" y="142" width="11" height="11" rx="1.5" fill="#D9A97E" stroke="#B98A5E" stroke-width="0.6"/><rect x="634" y="142" width="11" height="11" rx="1.5" fill="#D9A97E" stroke="#B98A5E" stroke-width="0.6"/><rect x="648" y="142" width="11" height="11" rx="1.5" fill="#D9A97E" stroke="#B98A5E" stroke-width="0.6"/><rect x="662" y="142" width="11" height="11" rx="1.5" fill="#D9A97E" stroke="#B98A5E" stroke-width="0.6"/><rect x="676" y="142" width="11" height="11" rx="1.5" fill="#D9A97E" stroke="#B98A5E" stroke-width="0.6"/><rect x="466" y="156" width="11" height="11" rx="1.5" fill="#D9A97E" stroke="#B98A5E" stroke-width="0.6"/><rect x="480" y="156" width="11" height="11" rx="1.5" fill="#D9A97E" stroke="#B98A5E" stroke-width="0.6"/><rect x="494" y="156" width="11" height="11" rx="1.5" fill="#D9A97E" stroke="#B98A5E" stroke-width="0.6"/><rect x="508" y="156" width="11" height="11" rx="1.5" fill="#D9A97E" stroke="#B98A5E" stroke-width="0.6"/><rect x="522" y="156" width="11" height="11" rx="1.5" fill="#D9A97E" stroke="#B98A5E" stroke-width="0.6"/><rect x="536" y="156" width="11" height="11" rx="1.5" fill="#D9A97E" stroke="#B98A5E" stroke-width="0.6"/><rect x="550" y="156" width="11" height="11" rx="1.5" fill="#D9A97E" stroke="#B98A5E" stroke-width="0.6"/><rect x="564" y="156" width="11" height="11" rx="1.5" fill="#D9A97E" stroke="#B98A5E" stroke-width="0.6"/><rect x="578" y="156" width="11" height="11" rx="1.5" fill="#D9A97E" stroke="#B98A5E" stroke-width="0.6"/><rect x="592" y="156" width="11" height="11" rx="1.5" fill="#D9A97E" stroke="#B98A5E" stroke-width="0.6"/><rect x="606" y="156" width="11" height="11" rx="1.5" fill="#D9A97E" stroke="#B98A5E" stroke-width="0.6"/><rect x="620" y="156" width="11" height="11" rx="1.5" fill="#D9A97E" stroke="#B98A5E" stroke-width="0.6"/><rect x="634" y="156" width="11" height="11" rx="1.5" fill="#D9A97E" stroke="#B98A5E" stroke-width="0.6"/><rect x="648" y="156" width="11" height="11" rx="1.5" fill="#D9A97E" stroke="#B98A5E" stroke-width="0.6"/><rect x="662" y="156" width="11" height="11" rx="1.5" fill="#D9A97E" stroke="#B98A5E" stroke-width="0.6"/><rect x="676" y="156" width="11" height="11" rx="1.5" fill="#D9A97E" stroke="#B98A5E" stroke-width="0.6"/><rect x="466" y="170" width="11" height="11" rx="1.5" fill="#D9A97E" stroke="#B98A5E" stroke-width="0.6"/><rect x="480" y="170" width="11" height="11" rx="1.5" fill="#D9A97E" stroke="#B98A5E" stroke-width="0.6"/><rect x="494" y="170" width="11" height="11" rx="1.5" fill="#D9A97E" stroke="#B98A5E" stroke-width="0.6"/><rect x="508" y="170" width="11" height="11" rx="1.5" fill="#D9A97E" stroke="#B98A5E" stroke-width="0.6"/><rect x="522" y="170" width="11" height="11" rx="1.5" fill="#D9A97E" stroke="#B98A5E" stroke-width="0.6"/><rect x="536" y="170" width="11" height="11" rx="1.5" fill="#D9A97E" stroke="#B98A5E" stroke-width="0.6"/><rect x="550" y="170" width="11" height="11" rx="1.5" fill="#D9A97E" stroke="#B98A5E" stroke-width="0.6"/><rect x="564" y="170" width="11" height="11" rx="1.5" fill="#D9A97E" stroke="#B98A5E" stroke-width="0.6"/><rect x="578" y="170" width="11" height="11" rx="1.5" fill="#D9A97E" stroke="#B98A5E" stroke-width="0.6"/><rect x="592" y="170" width="11" height="11" rx="1.5" fill="#D9A97E" stroke="#B98A5E" stroke-width="0.6"/><rect x="606" y="170" width="11" height="11" rx="1.5" fill="#D9A97E" stroke="#B98A5E" stroke-width="0.6"/><rect x="620" y="170" width="11" height="11" rx="1.5" fill="#D9A97E" stroke="#B98A5E" stroke-width="0.6"/><rect x="634" y="170" width="11" height="11" rx="1.5" fill="#D9A97E" stroke="#B98A5E" stroke-width="0.6"/><rect x="648" y="170" width="11" height="11" rx="1.5" fill="#D9A97E" stroke="#B98A5E" stroke-width="0.6"/><rect x="662" y="170" width="11" height="11" rx="1.5" fill="#D9A97E" stroke="#B98A5E" stroke-width="0.6"/><rect x="676" y="170" width="11" height="11" rx="1.5" fill="#D9A97E" stroke="#B98A5E" stroke-width="0.6"/></svg>

The button is already 32 variants; the breakpoint axis makes it 96. For scale, Google cut the Material 3 list component from over 700 variants to roughly 45.

GitLab Pajamas shows how that weight fails. It removed its base components because they accumulated every option, leaving hidden layers and properties that bloated files and slowed prototypes, and because removing them made updates more isolated. Breakpoint variants fail the same way, quietly, with the pain arriving later in everyone else's files.

So a product component earns a breakpoint axis when its child order or layer structure changes, not when its measurements change. The qualifying list is short:

- navigation;
- data tables, which on narrow screens become stacked cards;
- page headers, where actions collapse into overflow;
- some modals, where a centred dialog becomes a full-screen sheet.

Buttons, inputs, badges, chips, avatars and cards change size, not shape. A Desktop and Mobile variant of them produces two near-identical frames that drift apart the first time someone updates one, which is exactly what happened to the Card's grey. Shopify's 2022 Polaris kit shipped a small-screen toggle for exactly the qualifying class, a choice made before Figma variables existed.

Build responsive first: auto layout, fill and hug, min and max width, wrap, and every dimension bound to a token. Push pure scaling into a scale or density collection whose modes match your real device tiers, usually fewer than your CSS breakpoints. Add a breakpoint axis only where child order or structure changes, and split into a named component where anatomy and semantics differ. **If the Mobile variant differs only in numbers, delete it and bind the numbers to a mode.** The first two steps are consensus; where the threshold sits between an axis and a separate component is judgement, drawn from the Material and Polaris cases above.

---

## Width in marketing sections

Marketing sections take an explicit breakpoint axis named after the real breakpoints, with content variety absorbed by slots and instance swaps so the variant budget is spent on breakpoints: the reverse of a product library, and both are right.

Now the hero with no mobile variant and a detached copy on every page. Its desktop and mobile versions are two compositions, and no mode can turn one into the other.

The first thing that changes is the unit of reuse. In a product library it's the control; on a marketing site it's the section. Figma's own marketing team, building the system behind figma.com, componentised fully assembled sections and called them FLEGOs, a contraction of Figma and LEGO.

Adobe's Consonant has marquees and editorial cards; IBM's marketing system has leadspace and content block. None of those words appear in a product system, which is the easiest signal that a library seam has opened.

Here is how such a page is assembled.

<svg role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 880 320" font-family="Inter, 'Helvetica Neue', Arial, sans-serif" style="display:block;width:100%;height:auto;margin:2em 0"><title>A page frame of stacked section blocks: Nav, Hero, Features, Logos, CTA and Footer. The Hero is expanded into three authored compositions, Desktop, Tablet and Mobile, each arranging the headline and image differently.</title><rect width="880" height="320" fill="#FBFAF8"/><rect x="0.5" y="0.5" width="879" height="319" fill="none" stroke="#E3DFD8"/><text x="32" y="38" font-size="13.5" font-weight="600" fill="#1C1B19">A marketing page is a stack of sections</text><rect x="32" y="58" width="300" height="246" rx="3" fill="#FFFFFF" stroke="#DFDAD2"/><rect x="44" y="64" width="276" height="22" rx="2" fill="#F2EFE9" stroke="#E3DFD8"/><text x="56" y="79.0" font-size="10.5" fill="#77726B">Nav</text><rect x="44" y="90" width="276" height="56" rx="2" fill="#F2EFE9" stroke="#E3DFD8"/><text x="56" y="122.0" font-size="10.5" fill="#77726B">Hero</text><rect x="44" y="150" width="276" height="44" rx="2" fill="#F2EFE9" stroke="#E3DFD8"/><text x="56" y="176.0" font-size="10.5" fill="#77726B">Features</text><rect x="44" y="198" width="276" height="26" rx="2" fill="#F2EFE9" stroke="#E3DFD8"/><text x="56" y="215.0" font-size="10.5" fill="#77726B">Logos</text><rect x="44" y="228" width="276" height="34" rx="2" fill="#F2EFE9" stroke="#E3DFD8"/><text x="56" y="249.0" font-size="10.5" fill="#77726B">CTA</text><rect x="44" y="266" width="276" height="30" rx="2" fill="#F2EFE9" stroke="#E3DFD8"/><text x="56" y="285.0" font-size="10.5" fill="#77726B">Footer</text><path d="M336 116 C 372 116, 372 96, 404 96" stroke="#CFC9BF" fill="none" stroke-width="1.2"/><rect x="412" y="70" width="190" height="112" rx="3" fill="#F5EFE8" stroke="#DFDAD2"/><text x="507.0" y="196" font-size="11" fill="#9A948B" text-anchor="middle">Desktop</text><rect x="622" y="70" width="130" height="112" rx="3" fill="#F5EFE8" stroke="#DFDAD2"/><text x="687.0" y="196" font-size="11" fill="#9A948B" text-anchor="middle">Tablet</text><rect x="772" y="70" width="76" height="112" rx="3" fill="#F5EFE8" stroke="#DFDAD2"/><text x="810.0" y="196" font-size="11" fill="#9A948B" text-anchor="middle">Mobile</text><rect x="426" y="88" width="76" height="9" rx="3" fill="#3F3C37"/><rect x="426" y="104" width="54" height="6" rx="3" fill="#BDB7AD"/><circle cx="556" cy="126" r="30" fill="#D9A97E"/><rect x="636" y="88" width="70" height="9" rx="3" fill="#3F3C37"/><rect x="636" y="104" width="48" height="6" rx="3" fill="#BDB7AD"/><circle cx="710" cy="140" r="24" fill="#D9A97E"/><circle cx="810" cy="102" r="20" fill="#D9A97E"/><rect x="784" y="136" width="52" height="8" rx="3" fill="#3F3C37"/><rect x="784" y="150" width="36" height="6" rx="3" fill="#BDB7AD"/><text x="412" y="224" font-size="11" fill="#9A948B">one section, three authored compositions</text></svg>

A page is a stack of sections, and each carries its own authored compositions. Figma Sites builds pages this way.

Sites encodes the model directly: a page is an auto layout stack of section blocks, with a primary breakpoint and secondary ones whose edits affect only themselves. That's per-breakpoint art direction as a first-class mechanic, and it's correct here. Sites also lets text styles carry different sizes per breakpoint without variables. A hero headline at 72px on desktop and 32px on mobile isn't a token scale; it's a decision.

This is where the breakpoint-to-variant matching from [the first section](#where-responsiveness-lives) turns around. Read as product guidance, it's a limitation. Read as marketing guidance, it's the opposite: the one surface where breakpoint variants get real automation is the one where they're the honest representation. Relume, the highest-volume commercial Figma kit for marketing sites, ships over a thousand components, and every one carries the axis.

Two constraints shape marketing libraries that product libraries never face.

**The CMS is the real specification.** Consonant defines three artifacts per pattern, one to one: a UX pattern, a design template and a CMS content block. A designer can mock something up confident that what authors publish will match, because the component vocabulary is dictated by what the CMS can author.

**Flexibility beats variants.** Consonant's editorial card covers merchandising, events and product promotion through optional eyebrows, actions, lockups, media and aspect ratios, rather than a variant per use. Quick action cards are separate because they support different information and intent.

Build sections, not controls. Give each an explicit breakpoint axis with values named after your real breakpoints, as many as there are genuinely different compositions: usually two or three, not the five or six in the CSS. Check what your CMS can author before designing the component. **On a marketing site, the breakpoint variant is the design, so draw it.**

---

## Naming breakpoint properties

Name breakpoint properties for what varies on product components (`Size`, `Layout`), and after the real breakpoints on marketing sections, because a name is now a panel label, a matching key and an API surface at once.

Suppose the Card did keep one axis. The designer has to call it something, and `Device` is the obvious candidate. Then the narrow card turns up on desktop, inside a side panel, and nobody looks for it under Device.

A variant name now does three jobs:

- Figma Sites matches breakpoint frame names to variant values, so those have to be the exact breakpoint names.
- Code Connect maps variant enums to props, and a renamed value fails silently rather than loudly (see [Breaking changes in a Figma library](breaking-changes-in-a-figma-library.md)).
- Slashes still build the folders people navigate.

That's why `Device` loses to `Size` or `Layout` on product components. When a component is split rather than varianted, give it a real name: NavigationRail says something, `Navigation / Mobile` only that somebody ran out of ideas.

Name product axes for what changes, marketing axes with the breakpoint names your site actually uses, and split components for what they are. **A variant value is a key other tools match on, so rename it like an API.**

---

## Breakpoints in code

A Figma breakpoint reaches code as tokens and widths, not attributes: in the toolkit's rule, breakpoints come from the design file's tokens, in rem, with queries running one direction, and a `Breakpoint` variant axis is a width to render at, never an attribute on the component.

Picture the developer receiving a component set with a `Breakpoint=sm|md` axis. The tempting translation is a `breakpoint="sm"` prop. But the component can't know the window's width better than the browser does, and a prop would freeze it at one size inside a sidebar.

Where the design has a breakpoints collection, the toolkit's token build writes the breakpoints as Sass variables in rem with one mixin, and nothing else names a breakpoint. Each is named for its rung (`$sm` to `$xl`), never a device: "tablet" is also a phone in landscape, a split window and a small laptop.

rem in a media query is relative to the browser's initial font size. A reader who raises their default size reaches the narrow layout sooner, which is what they need. Queries are `min-width` only, because mixing directions produces overlapping ranges at the boundary.

A breakpoint is a page-level change: navigation collapsing, a sidebar stacking. A component's own layout is a container query. Touch is its own query, `pointer: coarse`, because width says nothing about input (`~/Projects/toolkit/knowledge/code/responsive.md#breakpoints`).

So the `Breakpoint=sm|md` set is rendered at that window width, or answered by a container query, and the parity mapping maps the axis to widths (`~/Projects/toolkit/knowledge/code/figma-handoff.md#variants-to-attributes`).

Two situations need care. A collection that holds both the canvas width the screens are drawn at and a container width inside it has to be read closely: the container width is the page grid's, and the canvas width is a breakpoint or nothing. And where every screen is drawn at one desktop width, the code doesn't invent the small layouts. It builds intrinsically, asks for the phone frame and the tokens, and records the undecided widths.

Keep breakpoint names and values as variables in Figma, and resizing behaviour in auto layout. State container-query thresholds and `clamp()` rules in the component spec, **because Figma can only sample what code computes continuously.** These are the toolkit's rules, resting on how media and container queries are specified.

---

## Cheat sheet

| Situation | Mechanism | Why |
|---|---|---|
| Padding, type, tap targets grow on touch | scale or density mode | one component, values change (Spectrum, Salesforce) |
| Layout reflows in available width | auto layout, min and max, wrap | nothing is decided; code does it with flex, grid and container queries |
| Child order or structure changes (nav, tables, page headers, some modals) | breakpoint variant axis | structure can't be a value |
| Anatomy and semantics differ | separately named component | Material's NavigationBar, Rail, Drawer |
| Marketing section with authored compositions | breakpoint axis named after real breakpoints | art direction; Sites automates it |
| Marketing content variety | slots and instance swaps | keeps the variant budget for breakpoints |
| Breakpoint in code | rem tokens, `min-width` only, named by rung | toolkit rule |

Warning signs to look for in your library:

- **Designers detach instances to make them fit.** The component isn't responsive, and no variant will fix it.
- **A variant grid runs past one screen.** Some axes belong in properties or modes.
- **A mobile and desktop variant differ only in padding and font size.** Delete one and bind the values to a scale mode.
- **A marketing section has no breakpoint variants and a detached mobile copy on every page.** The axis was needed and skipped.
- **A product library grows components called Hero and Marquee.** That's not a breakpoint problem.

---

## The short version

Responsive behaviour can live in auto layout, token modes, a variant axis or a separate component, in rising order of cost. For product UI, where responsiveness is reflow, build with auto layout, put size changes in a scale or density mode as Spectrum does, add a breakpoint axis only where child order or structure changes, and give a component its own name where its anatomy differs, as Material does with its three navigation components.

For marketing pages, where responsiveness is art direction, the unit is the section, the CMS is the real specification, and a breakpoint axis named after your real breakpoints is the honest representation; Figma Sites automates exactly that. Most advice against breakpoint variants is product advice applied to the wrong case.

In code, a breakpoint is a token in rem, queried `min-width` only and named for its rung, and a `Breakpoint` axis is a width to render at. Much of the older advice was shaped by tooling that has since moved: Polaris chose a toggle in 2022 because variables didn't exist, and four modes per collection couldn't cover seven breakpoints until October 2025. So keep your structure cheap to change.

---

## What to re-check later

Researched August 2026; re-checked November 2026.

- **How the evidence was weighted.** Sources are weighted toward what systems ship and say about themselves: Adobe Spectrum's platform scale and design data, Adobe's account of Consonant, Material 3's window size classes, Google's rebuild of the Material Figma kit, Shopify's 2022 Polaris kit, GitLab Pajamas, Salesforce Lightning Design System 2, Figma's own account of building figma.com, the Figma help centre on variants, variable modes, Sites breakpoints and responsive components, and Relume's published kit. Practitioner essays are commentary, used for framing rather than as evidence. The toolkit's rules for breakpoints in code are the toolkit's own.
- **Figma Sites.** Still open beta in November 2026, with no general-availability date; Sites CMS entered public beta on 20 November 2025. Re-check whether breakpoint-to-variant matching ever reaches ordinary design files.
- **Mode limits.** Figma's plans page, re-read in November 2026: 10 modes per collection on Professional and 20 on Organization since 28 October 2025; Enterprise lists unlimited modes with extended collections.
- **No user research.** No system published evidence that any of these choices affected the people using their products; they are decisions about maintenance cost and design-tool ergonomics.

---

## Sources

**Primary**

- Adobe Spectrum platform scale documentation, Spectrum Design Data dimension spec and spectrum-web-components token documentation.
- Adobe Design's account of building Consonant for Adobe.com.
- Material 3 window size class documentation and Android adaptive navigation guidance.
- Google Design on rebuilding the Material Figma kit.
- Shopify's 2022 Polaris Figma kit release notes.
- GitLab Pajamas UI kit components.
- Salesforce Lightning Design System 2 density documentation.
- Figma's account of building the figma.com design system.
- Figma help centre articles on variants, variable modes, plans and features, responsive components in Sites, [Sites breakpoints](https://help.figma.com/hc/en-us/articles/31242797809815-Add-or-delete-breakpoints-in-a-webpage) and blocks, and Sites CMS.
- Figma's Config 2025, Schema 2025 and Config 2026 announcements.
- Figma forum threads on mode limits and Sites availability.
- Relume's published Figma kit description.
- [MDN: container queries](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_size_and_style_queries).
- [Media Queries 4](https://www.w3.org/TR/mediaqueries-4/).

**The toolkit's own rules**

- `~/Projects/toolkit/knowledge/code/responsive.md#breakpoints`
- `~/Projects/toolkit/knowledge/code/figma-handoff.md#variants-to-attributes`

**Commentary**

- Nathan Curtis (EightShapes) on token naming.
- Practitioner posts on adaptive versus responsive layout in Figma and on breakpoint variables, used for framing rather than as evidence.
