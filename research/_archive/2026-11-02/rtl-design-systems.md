# Right-to-left in a Figma design system

What mirrors and what does not, whether Figma can flip components for you, whether a second library earns its cost, and what to hand developers.

Researched August 2026, re-verified September 2026 against primary sources rather than reformatted from an earlier pass. Figma's capabilities checked against its help centre, its July 2026 auto layout release notes, and two open feature requests. Mirroring rules checked against Wikimedia Codex, Material Design and Microsoft's globalization documentation. Arabic typography re-checked against the same two Arabic-first government design systems as before, plus a 2021 CHI paper surveying 234 bidirectional-language speakers that had not been in the evidence base until then. The September pass re-checked what the mirroring plugins now do, which had changed, and added a measurement method for sizing the work against a real library.

---

## What this answers

You have a design system in Figma and someone has asked for Arabic, or Hebrew, or Farsi, or Urdu. The questions that follow, roughly in the order they arrive:

- What actually flips, and what stays put?
- Can Figma just mirror my components?
- Do I need a whole second library?
- If not, what do I build instead?
- How do I build components now so they do not fight me later?
- Does Arabic need bigger text?
- What do I hand the developers?
- How much of my library does any of this actually affect?

Sections 13 and 14 are the cheat sheet and the short version.

---

## 1. The situation, from a Figma point of view

**The short answer.** Code solved right-to-left years ago. Figma has not, and as of August 2026 is still not close. That gap is what makes this awkward, and most of the confusion in this area comes from advice written for one side being applied to the other.

On the engineering side this is close to a solved problem. A modern stylesheet describes spacing as "start" and "end" rather than "left" and "right", the browser resolves which is which from a single direction setting on the page, and the whole interface flips. One codebase, one build, no duplication.

Figma does none of that for layout. It supports right-to-left **text**, and has since March 2022, covering Arabic, Hebrew, Farsi and Urdu, with automatic direction detection, per-paragraph overrides, mixed-direction paragraphs and font fallback. That coverage has not visibly changed since launch: nothing in Figma's help centre or release notes points at a text-direction update since 2022, which is itself worth stating as a finding rather than an oversight.

It does not support right-to-left **layout**. There is no direction setting on a frame. Auto layout has no notion of start and end, only left-to-right or top-to-bottom. And you cannot work around it with variables, because the things you would need to flip are not the kind of value a variable can hold: Figma variables drive numbers, so padding, gap and width can change by mode, but auto layout *direction*, alignment and sizing behaviour are not numbers, and remain unbound to this day.

A community request asking for exactly this, variable-bindable direction, alignment, hug and fill, has been open since June 16, 2025. As of this pass it is still open: the most recent post is from May 19, 2026, a member noted in June 2025 that "people have been asking for this for more than a year," a September 2025 comment asked Figma directly for a roadmap, and none of the six replies carries a staff response. Fourteen months in, the pattern is not that Figma hasn't gotten to it yet; it is that Figma has not said anything about it at all.

Figma did ship a real auto layout change in the same window, and it is worth naming precisely because it is not this. In July 2026, Figma reworked auto layout to close small handoff gaps with CSS Flexbox: padding now always gets the room it needs, inside strokes now count in layout like a border under `box-sizing: border-box` while centre and outside strokes behave like an outline, and a single child in an auto-gap stack aligns to the start instead of the centre. None of it touches direction. A second, narrower request, opened in August 2025, asks only for RTL-aware wrapping (so a wrapped row reflows from the right instead of the left) and is also open with no staff reply. A third thread appears to ask for auto layout direction as a variable in those words alone, though its contents could not be read directly this pass. Two confirmed open requests on two slices of the same problem, with a probable third, is a stronger signal than one.

So the thing you would want, a Direction mode that flips every component the way a Dark mode flips every colour, cannot be built today, and nothing in Figma's 2026 roadmap communication suggests it is close. That is not a workflow you have failed to discover. It is absent, and everything in this guide is shaped around working without it.

**What to do.** Stop looking for the switch, and plan for a library that stays left-to-right while the built product mirrors. The rest of this guide is about doing that without shipping a bad Arabic experience.

---

## 2. What mirrors, and what does not

**The short answer.** Layout, navigation, directional icons and anything encoding progression all flip. Media controls, clocks, numbers, phone numbers and photographs do not. And "right-to-left" is not one locale, so a few rules change between Arabic and Hebrew, and even the general rules turn out to have measured exceptions.

This is the part that is genuinely a design decision rather than a tooling problem, which is why it comes first.

The clearest published list belongs to Wikimedia Codex, which is a useful source here for a specific reason: Wikipedia runs in several hundred languages, so their rules were forced by real breadth rather than derived from one product.

| Flips | Stays put |
|---|---|
| Layout, containers, navigation | Media controls: play, pause, rewind, fast-forward |
| Text alignment | Clocks and time-related icons and components |
| Directional icons: back, forward, next | Checkmarks and right-hand-use icons |
| Buttons and groups of buttons | Phone numbers, postal codes |
| Sliders, toggles, pagination, ratings | URLs, email addresses, numbers |
| Progress sequences and steppers | Currency symbols |
| Navigation items and in-page elements | Icons without clear directionality |
| Captions and labels for images | The images and illustrations themselves |
|  | Charts and graphs, where mirroring would change the reading |

**Why the exceptions are exceptions**, since the list is easier to remember with the reasoning attached. Media controls map to physical tape transport rather than to reading order, which is why fast-forward points right in Cairo and in Tel Aviv; Microsoft's own globalization guidance calls this out by name, using the same fast-forward and rewind example, which tells you it shipped wrong somewhere first. Clocks run clockwise everywhere. Numbers run left to right inside right-to-left text, so a mirrored phone number is not a phone number. And a mirrored photograph is usually just wrong, sometimes embarrassingly so, which is a good reason to be wary of plugins that flip everything.

**The exception that catches teams out: "RTL" is not one locale.** The rules differ between right-to-left languages, and this is the least documented fact in the area. Search-indexed summaries of Material's bidirectionality guidance consistently describe several per-language splits: icons containing a question mark mirror in Arabic and Farsi but not in Hebrew, because the Hebrew question mark is not itself mirrored; help icons mirror in some right-to-left languages, such as Urdu and Persian, but not universally; and linear progress indicators run right to left in most right-to-left languages but stay left to right in Hebrew, alongside timelines and media controls. That pattern held across every independent search run in this pass. It could not be confirmed by directly reading the current Material page this session; the page renders through client-side JavaScript that repeated fetch attempts could not retrieve as text, so treat the specific Hebrew and Urdu splits as well-corroborated by search rather than independently read from the primary document. See the note in section 15.

**The per-language splits have primary-source corroboration from a second system**, which matters because the Material claims above rest on search summaries rather than a page that could be read. Codex encodes exceptions directly in its icon data: every icon can carry `shouldFlip`, and alongside it `shouldFlipExceptions`, described in Codex's own type documentation as language codes that are exceptions, with the worked example being a help icon that flips in right-to-left mode but not for Hebrew or Yiddish. That is a shipping system holding per-language exceptions as data rather than prose, on the same icon Material is reported to split, from a source that opens and reads. It does not confirm Material's specific list, and it does confirm the shape of the problem is real.

**If your system has one RTL mode, you have already decided to be wrong in at least one language**, on the evidence above. That may be perfectly acceptable. It should be a decision you recorded, not one you discover from a bug report.

**The mirroring rules themselves are more tested against user behaviour than they look, and less tested than the confident tone of most guidance suggests.** A 2021 CHI paper by Goldenberg and Tractinsky surveyed 234 speakers of bidirectional languages against a review of real interfaces, specifically to check whether shipped guidance matches what users actually prefer. Their finding: users' direction preferences were inconsistent with the guidelines in a meaningful share of cases, not confirming the vendor consensus wholesale. That is a genuinely different category of evidence from "Microsoft and Codex and Material all agree," because it measures outcomes for the people using the interface rather than what design teams converged on. It does not overturn the mirror/do-not-mirror table above, which the paper's own review of real sites was consistent with, but it is a reason not to treat that table as settled science, only as the best-supported starting point available.

**A worked example, because the cost is easy to underestimate.** Take an ordinary settings row: a leading icon, a label, and a chevron on the right that says "there is more." Three things have to change and only one of them is visible in a screenshot.

| | Left to right | Mirrored correctly | If nobody thought about it |
|---|---|---|---|
| Order | icon, label, chevron | chevron, label, icon | unchanged, so the chevron is stranded |
| Chevron glyph | points right | points left | still points right, now meaning "back" |
| Padding | 16 leading, 12 trailing | 16 leading, 12 trailing | 16 now on the visual right, so the spacing is subtly wrong |

The chevron is obvious in review. The four-pixel padding inversion is not, and that is the kind of thing that ships for years.

**What to do.** Adopt Codex's list as your default and write down which languages you actually support. The reason to write it down is the Hebrew exceptions: an unstated scope means the first Hebrew user finds a bug nobody chose to accept, whereas "Arabic and Farsi, Hebrew not supported yet" is a product decision someone can revisit. And where you have the budget, test the assumption rather than only shipping it; the CHI paper's whole point is that nobody else has.

---

## 3. Can Figma mirror a component?

**The short answer.** Not on its own. Your realistic options are a direction property on each component, a parallel library, a plugin that flips frames on demand, a plugin that writes the direction property for you, or not mirroring in Figma at all. None of them is free, and it is worth knowing that up front.

| Approach | How it works | What it costs |
|---|---|---|
| A direction property on each component | A `Direction` variant with two values on every set whose children reverse | Doubles the variants on those sets, and every future variant is authored twice |
| A parallel RTL library | A separate file mirroring the main one | Full duplication, and the two drift apart |
| A plugin that flips a frame on demand | Reverses rows, swaps alignment, mirrors free-positioned children, flips directional icons, across a selection | The output is detached from your components, so it is a preview rather than something anyone can maintain |
| A plugin that writes the direction property for you | The same mirroring logic aimed at component sets rather than frames | The same permanent cost as the hand-built variant, minus the hand-building, and the generated result still needs a human pass |
| No mirroring in Figma | Design left to right, specify the rules in writing, review in a browser | Free, but nobody sees RTL until it is built |

Any guide that presents one of these as a clean solution is selling something. The honest position is that the tooling is missing a feature and every option is a workaround.

**The plugin category has two halves, and conflating them is where the reasoning usually goes wrong.** Several community plugins exist (RTL Layout, RTL Hero, RTL Converter, Aura RTL, RTLAuto, Design RTL). Read as frame-flippers they solve the preview case and not the maintained-artefact case, because a flipped frame is detached from the components it came from and goes stale the moment either side moves. That is a real limitation and it is the one most of this category has. It is not the whole category: at least one of them, RTL Layout, documents working on the source components instead. Its stated mechanism turns on the same constraint the rest of this section is about: since an instance's layout cannot be edited, it mirrors the parent component rather than the instance, and it will generate an RTL variant on a component set, so both directions live in the same set behind one property.

That changes which option you are choosing between. The realistic choice is no longer "a hand-built direction variant, which is expensive" against "a plugin preview, which rots". It is a direction property that is generated rather than hand-built, carrying the same permanent maintenance cost as the hand-built version and none of the authoring cost. Treat the generation as a first pass and not a result: a plugin mirrors boxes, and every judgement in section 2 (the chart that must not flip, the photograph, the media control) is still yours to make afterwards. These are the vendors' own descriptions of their tools rather than verified behaviour, so trial one on a duplicate of your file before committing to it, and read the trial as the verification step.

**Two Figma specifics worth knowing before you pick**, because they constrain how well even a hand-built RTL variant works.

Text alignment in Figma is left, centre, right or justified. There is no "start" that resolves by direction, and alignment is not something a variable can drive. So an RTL variant is not just a flipped auto layout, it is also every text layer's alignment changed by hand.

And auto layout direction cannot be overridden on an instance the way padding can. This is the same limitation as section 1 seen from the other end: a consumer of your component cannot flip it themselves even if you wanted them to. This is observed behaviour in the current product rather than a documented limitation stated on a specific help page; nothing in Figma's own materials calls it out by name.

**What to do.** Do not build a mirrored twin of your library, and section 4 is the full argument. Whether you build direction into the components at all depends on who needs to see RTL and when, which is the axis section 4 resolves. If you do build it, generate the variants with one of the tools above rather than authoring them, review every generated set against your own mirroring rules, and size the job first with the measurement in section 12, since the number of components that genuinely need it is usually far smaller than the library.

---

## 4. Do you need a second library?

**The short answer.** No. One library, one token set, one component implementation, plus a small set of RTL-specific artefacts that are not a mirrored copy. Where designers have to work in right to left every day, direction goes inside those same components as a property, which is still not a second file. This is the question most teams arrive with, so it is worth going through properly.

It helps to split it into three decisions rather than one, because the answer is only really contested for the middle one.

| Artefact | One or two? | Why it is not close |
|---|---|---|
| Component code | One | Logical properties and a direction setting make a second implementation pure cost |
| Design tokens | One | Values are direction-neutral. Only some names change, per section 10 |
| Figma library | One, plus targeted artefacts | Full duplication is not worth it, but nothing at all is also wrong |

**The case against a mirrored Figma library.** It has to be maintained in lockstep. Every property added, every token rebound, every variant introduced happens twice, and the second time is done by whoever remembers. Copied design libraries drift; that is one of the most reliable findings in this entire field and it is the reason modes and variables exist at all. You would be adopting exactly the maintenance model the tooling was built to replace, for a language axis, at the moment the tooling cannot help you.

**The case for building something, though**, because this is where teams who read "just use logical properties" go wrong. The engineering fix mirrors *boxes*. It does not decide that the chevron should flip and the media controls should not, that the chart axis should stay put, that the stacked button order changes, or that your 32-character label becomes 42 characters in Arabic. Those are design decisions. If no RTL artefact exists, nobody makes them deliberately. They get made accidentally, by a developer, at implementation time, under deadline.

**So build the small set, not the twin.** Four things, in rough order of value per hour spent:

1. **A bidirectionality note on every component's documentation page**, saying how that component mirrors and what does not. This is Codex's model, though it is worth being precise about how far Codex actually goes: its own component-authoring checklist lists "show how the component adapts to LTR and RTL reading directions" as one of several optional elements a spec sheet can carry, not a mandatory gate, with the page stating outright that "these elements are not all required... use your own discretion." Treat it as a strong convention worth adopting deliberately, not evidence that a major system enforces it.
2. **An icon manifest** marking every icon as mirroring or not, decided once when the icon is drawn. Retrofitting this across a mature icon set means re-reviewing every glyph, which is a genuinely miserable afternoon.
3. **RTL mockups of the ten or so screens where direction changes a decision**, not of the component library. Navigation, forms with mixed-direction inputs, anything with a chart, anything with a media player.
4. **Real Arabic text in your Figma files**, rather than Lorem Ipsum or English. Nearly free, and it surfaces the expansion problem in section 7 at design time instead of in QA.

**What changes if designers work in right to left every day.** The four artefacts above answer the common case, where right to left is a rendering concern and the people producing designs work left to right. They do not answer the other one, and the difference is not a matter of degree. A bidirectionality note describes a component. It does not let anyone place one. A designer whose daily work is an Arabic screen needs to drag a real component onto a real frame and have it face the right way, and no quantity of documentation substitutes for that.

For that team the answer is still one library, with direction inside it: a `Direction` property on the sets whose children reverse, generated by one of the tools in section 3 rather than authored by hand, then reviewed. This is the option section 3's table costs at double the variants on the affected sets, and the reason to pay it here is that nothing else lets a designer stay on live instances. A detached mirror answers the question once and is wrong the next time the component changes; a property on the component is correct for as long as the component is.

Two things keep that from decaying. The property has to become an authoring rule rather than a migration, so a component added next month ships both directions on the day it ships at all, which is the discipline Codex's specification sheet encodes as a suggested element rather than a gate. And real Arabic or Hebrew strings go in the file from the first component onward, because a direction property proves the layout mirrors and proves nothing at all about whether the words fit.

The cost is worth stating at full size rather than in passing. On one measured library (section 12) a direction property meant 58 of 82 component sets gaining a second copy of every variant, taking the file from roughly 741 variants to roughly 1,200, with every future variant on those sets authored twice from then on. That is the price of designing in right to left daily. It is lower than a twin library, though not for the reason usually given: both duplicate the same work, but a missing variant is visible inside its own component set, and a component missing from another file is visible to nobody.

**What to do.** If right to left is reviewed in a browser and designed in left to right, build one library plus the four artefacts, and do not put direction in the components. If designers work in right to left every day, build one library with a generated direction property on the sets that need it, and accept the doubling on those sets as the cost of the workflow. The dividing line is not how important right to left is to the business, it is whether anyone has to design in it before code exists. Where that line is unclear, start with the four artefacts, because they are prerequisites either way and none of the work is wasted if you later add the property.

And if your product is Arabic-*first* rather than Arabic-also, invert the default: design right to left and treat the Latin version as the adaptation. The direction you design in is the one that gets the attention.

---

## 5. Building components that survive the flip

**The short answer.** Auto layout everywhere, no absolute positioning, direction-encoding icons as swappable instances rather than fixed vectors, and no left or right in your layer names.

This is the most useful section for someone building the library today, because these choices cost nothing now and determine how much work the RTL adaptation is later.

**Use auto layout for everything that has an order.** An auto layout frame has a defined sequence of children, so a mirrored implementation reverses the sequence and the spacing follows. Absolutely positioned elements have coordinates, and coordinates do not flip. A badge pinned 8px from the left edge of a card stays 8px from the left in Arabic, on the wrong side, and no amount of correct CSS elsewhere will save it. Every absolutely positioned element in a component is a manual fix later.

**Watch asymmetric padding.** Padding of 16 on one side and 12 on the other is fine and normal, but it is directional, so somebody has to know it flips. This is worth calling out in the component's notes precisely because it is the failure nobody sees in review.

**Make direction-encoding icons swappable.** If a chevron, arrow or send icon is a flattened vector baked into the component, the mirrored version needs a different component. If it is an instance-swap property, the mirrored build swaps it and nothing else changes. This is the single highest-leverage structural choice in the list, because it turns an icon problem into a property.

**And record the decision as data on the icon, which is what a manifest actually is.** Codex is the reference implementation here and worth copying rather than paraphrasing. Its icons carry `shouldFlip`, a flag saying the icon is mirrored in right-to-left mode, alongside `shouldFlipExceptions`, a list of language codes where that flag does not apply. The example the documentation itself uses is the help icon: flipped in right-to-left mode, but not for Hebrew or Yiddish, which is exactly the per-language split section 2 warns is undocumented almost everywhere else. A third property, `langCodeMap`, maps a language code to a different glyph entirely, for the cases where mirroring is not enough and the icon is simply drawn differently.

Three fields, and between them they express every case the mirroring rules produce: always flip, flip except here, use a different drawing. If you write your manifest as a spreadsheet with those three columns, it can be read by a person and consumed by a build, and the decision is made once by whoever drew the icon rather than repeatedly by whoever implements the screen.

**Do not put direction in names.** `Icon left` becomes wrong the moment the layout mirrors. `Icon leading` stays true. The same applies to properties, variants and tokens: leading and trailing, or start and end, rather than left and right. This costs nothing while you are building and is a rename across every consuming file later.

**Anti-patterns worth naming**, since each has bitten someone:

- **The pinned badge.** Absolutely positioned, so it lands on the wrong side. The most common single RTL defect in a component library.
- **The baked-in arrow.** A flattened chevron that cannot be swapped, so the mirrored build needs a fork of the component.
- **The mirrored photograph.** A plugin flipped everything, including the hero image, and now the text in the photo reads backwards.
- **The mirrored chart.** A time series running right to left while its labels do not, so the trend appears reversed.
- **`Icon left`.** A name that is now false, sitting in a Code Connect mapping, in a variant value, and in three developers' heads.

**What to do.** Treat these as ordinary component-quality rules and apply them whether or not RTL is on the roadmap. They are all cheap while building and expensive to retrofit, and most of them (auto layout over absolute positioning, swappable icons, names that describe role rather than position) are things a good library wants anyway.

---

## 6. Does Arabic need bigger text?

**The short answer.** Choose an Arabic UI typeface deliberately, set it against your existing type scale, and add extra line height only if measurement on real content says you need it. Do not copy a percentage from a blog post, and this holds after re-checking it against both government sources again.

This section is unusual because the practitioner consensus and the primary sources still point in opposite directions, and the disagreement has not resolved in the time since.

**What the commentary says.** Widely repeated advice holds that Arabic needs more vertical space than Latin. A representative example, current as of June 2026, states "a working rule is 1.7 to 1.85 line height for Arabic body text, vs 1.5 to 1.6 for Latin," with headings at 1.3 to 1.4 against 1.1 to 1.2. The mechanism offered is real enough: Arabic is a connected script with ascenders, descenders and diacritics occupying vertical space Latin does not use, and at the same nominal size Arabic can read smaller while needing more leading.

**What two Arabic-first government design systems actually ship, re-checked directly against their current pages.** Both still contradict it.

| | UAE Design System 2.0 | Dubai Design System |
|---|---|---|
| Arabic typeface | Noto Kufi Arabic for body, Alexandria for headings | The Dubai font, recommended for Arabic and English both |
| Type scale | The same sizes as English; minimum body line height of 1.5x | Identical sizes and line heights to Latin at every breakpoint |
| Arabic-specific line height | None beyond the shared 1.5x minimum | None at all |

Two systems whose primary readers are Arabic speakers, both publicly documented, both still declining to differentiate. Dubai goes further and recommends one typeface for both scripts specifically to keep the presentation unified, while allowing a substitute typeface where brand identity requires it, provided the same legibility standard is met.

**How to read the disagreement honestly.** Three explanations are available and the published evidence still does not choose between them. Either the commentary is right and these systems are under-refined, shipping a Latin-derived scale because it was cheaper. Or the commentary is right about typefaces in general and wrong about *these* typefaces, because a face designed for UI use (Noto Kufi Arabic and the Dubai font are both purpose-built, not repurposed print faces) may already carry the vertical metrics that make extra leading unnecessary. Or the advice generalises from print and editorial typography, where longer line lengths make leading matter more, to interface text, where it matters less.

The second is the most likely and the least verifiable, and it has a concrete consequence: if it is true, **the typeface is the decision and the line height is downstream of it.** Nobody has published measurements either way, which is worth knowing before anyone on your team quotes a number with confidence.

**What to do.** Pick an Arabic UI typeface deliberately, set it against your existing scale as both government systems do, then look at real Arabic content at body sizes and add a per-script line-height mode only if it reads tight. Do not write 1.7 into a token file on the strength of blog consensus that two Arabic-first systems decline to follow. If you do end up needing a different line height, a Figma mode is the right mechanism, since line height is a number and numbers are exactly what variables can carry.

---

## 7. Text length, which is not in dispute

**The short answer.** Arabic runs roughly 20 to 30 percent longer than English, and short strings are far worse. Build every text container to grow.

This is the one typography claim with no disagreement attached, and it has more practical consequence for your Figma file than the line-height argument does.

The expansion figure is a rule of thumb from localisation vendors rather than a measured constant. Independent localisation-industry sources checked this pass converge on the same 20 to 30 percent range (some quote 25 to 30), so treat the number loosely and the direction firmly. What is not loose is the pattern: the shorter the string, the more dramatic the change. A paragraph averages out. A single word on a button, a menu item or a column header does not, and Arabic does not abbreviate the way English does, because shortening changes the meaning.

**The worked case is the one that catches everyone.** An English button reading `Save` is four characters. You size the button to fit it, perhaps with a fixed width because it looked neater on the artboard. The Arabic equivalent is longer, and now it truncates.

The fix is not a bigger button. It is a button that hugs its content with a sensible minimum width, specified that way in the component rather than discovered in QA. Which is exactly why section 4 recommends putting real Arabic strings in your Figma files: a fixed-width button looks perfectly fine forever with the word `Save` in it.

**What to do.** Hug content, set minimum widths rather than fixed ones, and let anything holding translated text wrap to two lines without breaking. Then paste Arabic into your components and see what falls over. This is cheap, it takes an afternoon, and it finds more real defects than any other single activity in this guide.

---

## 8. Numerals, dates and mixed-direction text

**The short answer.** Default to Western digits for product UI unless you know your audience wants otherwise, never build sentences by joining fragments, and force phone numbers and URLs to stay left to right.

**Numerals are a locale and context decision, not a direction decision, and it splits by region and surface rather than by a single Arabic-wide rule.** Arabic can be written with Eastern Arabic-Indic digits (١٢٣) or the Western digits (123) most of the world uses, and practice is not uniform: Morocco, Algeria and Tunisia lean toward Western digits in most written contexts, while Egypt, the Gulf states and the Levant lean toward Arabic-Indic in formal text. Product UI and technical surfaces (anything with codes, IDs, or a mixed audience) skew further toward Western digits than editorial or marketing content does, because so much surrounding software is not localised and mixing digit styles across an experience reads worse than picking the less traditional one consistently. One large digital-library project chose Western digits throughout for exactly that reason, despite scholars considering it improper. Where the audience is genuinely mixed, a digit-style toggle is the more defensible choice than guessing; where it is not, pick one and hold it everywhere rather than letting it vary by component.

Whichever you pick, digits run left to right inside right-to-left text. The number is not mirrored; only its position in the line is decided by the surrounding direction.

**Mixed-direction text will surprise you, and it is not your CSS.** When left-to-right and right-to-left text share a line, the arrangement is decided by the Unicode Bidirectional Algorithm, currently at Unicode 17.0.0 (revision 51, dated 2025-08-13), which continues to define exactly this behaviour in its neutral-resolution rules. The part with practical consequences is what happens to *neutral* characters: punctuation, spaces and symbols have no direction of their own, so they take the direction of what surrounds them. Paired punctuation is also mirrored by glyph, a rule the Unicode Consortium had to add explicitly after the plain algorithm got it wrong, so an opening parenthesis renders as a closing one when resolved right to left.

The practical result is an Arabic sentence ending with an English product name, where the full stop appears at the wrong end of the line. It looks like a bug in your layout and it is the algorithm behaving as specified.

**Two rules prevent most of this**, and both are cheap now and nearly unfixable later. Never build a user-facing string by joining fragments together, because the arrangement depends on the whole string and a template that works with one value breaks with another. And wrap embedded opposite-direction content in directional isolation so it cannot disturb the text around it.

**What to do.** Western digits as the default for product UI, made a locale setting rather than hard-coded, with Arabic-Indic considered for editorial or marketing surfaces aimed at an audience that expects it. Whole sentences with placeholders, never concatenation. Force left-to-right on phone numbers, URLs, email addresses and postal codes. And when you make test content, mix scripts, because a pure-Arabic test string exercises none of the failures above.

---

## 9. Reviewing it, since nothing will error

**The short answer.** Right-to-left defects render perfectly. Nothing logs, nothing fails, and the layout looks plausible to a reviewer who does not read the script. The review process is the control, not the tooling.

That single property explains why RTL bugs survive so long. A mirrored photograph, an inverted chart, a stranded chevron and a 4px padding inversion all produce a screen that looks fine.

The cheapest useful thing is to put a direction toggle in whatever component explorer your engineers use, on the first day of the work rather than at the end. It makes right-to-left one click away instead of a build configuration, and the failure mode being prevented is attention rather than coverage: nobody finds these bugs unless somebody is looking at RTL.

Then use real translated strings rather than mirrored English, because mirrored English exercises neither the expansion nor the bidirectional behaviour. Make every test fixture mix scripts, since the failures cluster at direction boundaries. And have somebody who reads the language review it, which is the step teams skip and the only one that catches a mirrored photograph or a sentence that is grammatically correct and reads oddly. The CHI paper in section 2 is a reminder that even native-reader review is checking against convention, not against measured preference, so treat a clean review as good evidence rather than proof.

**What to do.** Direction toggle on day one, real translated content, mixed-script fixtures, and a native reader in the review. None of this is expensive and there is no automated substitute for the last one.

---

## 10. Naming, so nothing has to be renamed later

**The short answer.** Leading and trailing, not left and right, in tokens, icons, properties and layer names.

Tokens are the easy part, because the values themselves are direction-neutral. A 16px gap is 16px in both directions. Only the names carry direction.

| Instead of | Use |
|---|---|
| `spacing.left`, `spacing.right` | `spacing.inline-start`, `spacing.inline-end` |
| `radius.top-left` | `radius.start-start` |
| `icon.chevron-right` | `icon.chevron-forward` or `icon.chevron-next` |
| A layer called `Icon left` | `Icon leading` |
| A variant value `Left` | `Leading` |

The icon naming point bites hardest, because icon names propagate into product code and into Code Connect mappings. A component asking for `chevron-right` in a mirrored layout is either wrong or has a permanently confusing name, and renaming an icon set after adoption means a change across every consuming repository.

**What to do.** Adopt these names before you need them. The rename is nearly free today and expensive later, and `chevron-forward` is not worse than `chevron-right` in a left-to-right product, so there is no cost to doing it early even if right-to-left never happens.

---

## 11. What your developers need from you

**The short answer.** Not much, and none of it is a mirrored Figma file. They need your mirroring decisions written down, an icon manifest, and containers that were designed to grow.

Worth understanding roughly what happens on their side, so you know what you are and are not responsible for.

Modern stylesheets describe spacing in terms of start and end rather than left and right, and the browser resolves it from one direction setting. Component libraries expose a single direction property at the root of the application, and everything below it flips. Bootstrap rebuilt its spacing utilities around this naming (`.ms-3` instead of `.ml-3`) so that both directions come out of one source, generating the RTL build with a dedicated tool (RTLCSS) rather than hand-maintaining a second stylesheet. Ant Design added a `direction` prop to its root `ConfigProvider` in an initial pull request in late 2019, then needed a second, larger pull request covering more than 40 components before coverage was broad, and its own documentation still flags at least one incomplete case today (the Rate component's half-star rendering is not yet implemented for RTL). That is the honest shape of the job: wiring the switch is a day, auditing every component against it is the project, and even a large, well-resourced library can carry a known gap for years.

The consequence for you is that **the engineering work is largely mechanical and the design work is largely judgement.** They can flip the boxes without you. They cannot decide that the chart should not mirror, that the help icon mirrors in Urdu but not Hebrew, or that this particular illustration would be offensive reversed.

So the handoff is: your mirroring rules per component, your icon manifest, your language scope, and components whose containers were built to grow. That is it. If you also hand them a mirrored Figma file, they will mostly not need it.

**What to do.** Write the rules down rather than drawing them. And ask your engineers for the direction toggle from section 9 early, because that is the thing that lets you review the real output instead of an approximation of it.

---

## 12. How much of your library actually needs this, and how do you measure it?

**The short answer.** Fewer components than the library's size suggests, and you can count them in an afternoon rather than estimating them. The measure is order reversal, because that is the one edit Figma will not let a designer make on an instance.

Everything in sections 3 and 4 turns on a number nobody has: how much of a given library is actually direction-baked. Estimating it by eye produces the two familiar failures, a quote of several weeks that kills the work and a quote of two days that discovers the truth halfway through. It is measurable, and the measurement is worth more than any estimate in this guide.

**Start from the constraint rather than from appearances.** Padding, alignment and constraints can be overridden on an instance. Child order cannot. So a component that mirrors purely by swapping padding values is one a designer can handle in place, and a component whose children have to reverse is one that needs a direction property or a detach. Order reversal is therefore not one symptom among several, it is the line between the two categories, and it is what to count.

In practice that means walking every component set and asking one question of every frame inside it: is this a horizontal auto layout with two or more children in the flow? A plugin-API pass over an entire library takes seconds and needs no writes.

**A worked case.** One production library, 82 component sets and 741 variants, measured that way:

| | Sets | Variants |
|---|---|---|
| Contain a horizontal row that must reverse | 58 | 461 |
| Direction-safe exactly as drawn | 24 | 280 |

The 24 are the shapes with nothing to reorder: icon-only buttons, avatars, spinners, a switch, a scroll bar, radio and checkbox inputs, single-slot containers. They need no direction property at any point, which is a quarter of the library removed from the estimate before any work starts. On the other side, 461 variants is what a direction property would double, and knowing that before quoting is the difference between a costed decision and a guess.

**Three ways this measurement goes wrong, all of them producing a confident number.**

**Reading only the first variant of each set.** A first pass over the library above returned 41 sets and 238 variants, and placed the primary Button in the direction-safe column. Button's first variant carries no icon, so the row it needs to reverse had only one child in it at the moment of measurement. Walking every variant returned 58 and 461. The first number was wrong by roughly 40 percent, in the direction that makes the work look smaller, which is the direction a wrong estimate is least likely to be challenged in.

**Filtering on what is currently visible.** A leading icon hidden in the variant you happen to read is still a child that a boolean property will reveal, and the row still reverses when it does. Count structural children, not visible ones.

**Counting absolutely positioned children as siblings.** A focus ring stretched over a control, or any layer pinned above the flow, is not part of the order. Including those put a 120-variant icon-only set into the needs-work column in the same measurement, which is the opposite error and costs just as much. Exclude anything absolutely positioned before counting.

**Measure the other four surfaces in the same pass, because they are the review checklist later.** Asymmetric horizontal padding, where the two sides differ. Absolutely positioned children whose horizontal constraint pins them to one edge. End alignment, meaning a horizontal frame aligned to its end or a vertical frame whose cross-axis alignment sits at one side. Asymmetric corner radius, which is how date-range caps and speech bubbles are built. And rotation, since a chevron rotated 180 degrees inverts rather than swaps.

**The one worth singling out is alignment**, because it is an enum rather than a number and so it is invisible to a scan looking for values. In the library above, the entire mechanism placing a chat bubble on one side of the conversation was a single cross-axis alignment set to the end. A first pass that looked at padding and corner radius reported that component completely clean. If your measurement returns nothing for a component you know mirrors, the finding is about the measurement.

**What to do.** Measure before estimating, and measure by order reversal first. Publish the two numbers, sets that need a direction property and sets that do not, because the second number is the one that makes the work fundable. Then keep the full flip list, since it stops being an estimate the moment the work starts and becomes the review checklist for whatever a plugin generates.

---

## 13. Cheat sheet

| Concern | Do this | Not this |
|---|---|---|
| Figma library | One, plus per-component mirroring notes | A mirrored twin library |
| Designers who work in RTL daily | One library, generated direction property on the sets that need it | A second file, or detached mirrored frames |
| Sizing the work | Measure order reversal across every variant | Estimate from the library's size |
| Mirroring plugins | Trial on a duplicate, review what they generate | Trust the output, or build your own |
| Icon manifest | A flag, a language exception list, a per-language glyph map | A note in a description field |
| Looking for a Direction mode | Accept it does not exist yet | Waiting for it |
| Component layout | Auto layout throughout | Absolutely positioned elements |
| Directional icons | An instance-swap property | A flattened vector |
| Icon names | `chevron-forward` | `chevron-right` |
| Layer and variant names | `Icon leading` | `Icon left` |
| Spacing tokens | `inline-start`, `inline-end` | `left`, `right` |
| Media controls | Never mirror | Mirror with everything else |
| Charts | Mirror only if the meaning survives | Mirror by default |
| Photographs | Never mirror by default | Let a plugin decide |
| Phone numbers, URLs, emails | Force left to right | Inherit the paragraph direction |
| Digits | Western by default in product UI, locale-configurable | Hard-code either style everywhere |
| UI strings | Whole sentences with placeholders | Joined fragments |
| Arabic type scale | Same scale, chosen typeface, measure before changing | Copy 1.7 line height from a blog post |
| Text containers | Hug content, minimum widths | Fixed widths sized to English |
| Figma placeholder text | Real Arabic | Lorem Ipsum or English |
| Review | A direction toggle plus a native reader | Screenshots only |

---

## 14. The short version

Figma cannot mirror your components and still cannot as of September 2026, with three community feature requests open and unanswered between them. Do not plan around a Direction mode. Keep one library.

Build components so the flip is cheap: auto layout everywhere, nothing absolutely positioned, directional icons as swappable instances, and no left or right in any name.

Learn what actually mirrors. Layout, navigation, directional icons and progression flip. Media controls, clocks, numbers, photographs and most charts do not. Some rules differ between Arabic and Hebrew, so write down which languages you support, and treat even the settled-looking rules as convention rather than measured fact: the one academic study that checked user preference against vendor guidance found real gaps between them.

Instead of a mirrored library, build four things: a bidirectionality note per component, an icon mirroring manifest, RTL mockups of the handful of screens where direction changes a decision, and real Arabic text in your Figma files. Write the manifest the way Codex does, as a flip flag with a list of language exceptions, because the exceptions are the part everyone discovers late.

That answers the case where right to left is reviewed in a browser. If designers have to work in right to left every day, before code exists, the four artefacts are prerequisites rather than the answer: a note cannot be placed on a frame. Then put direction in the components, as a property on the sets whose children reverse, generated by one of the mirroring plugins rather than authored by hand, and accept that those sets carry two copies of every variant from then on. Measure first, because that count is usually well under the whole library, and a quarter of it typically needs nothing at all.

On type, choose an Arabic typeface deliberately and keep your existing scale until measurement tells you otherwise. The claim that Arabic needs a bigger line height is popular and is still contradicted by both Arabic-first government systems checked for this guide.

Design every container to grow, because Arabic runs longer and short strings expand worst.

Hand developers your rules, not your mirrored artboards. Then get a direction toggle in front of yourself early, because none of these bugs announce themselves.

---

## 15. What to re-check later

- **The Figma layout gap is still the big one**, and resolving it would change most of this guide. Auto layout direction remains unbound to variables. The direction-and-alignment request has been open since June 2025 with no staff response as of the most recent post, May 19, 2026; a narrower request for RTL-aware wrapping, opened August 2025, is also unanswered. Figma's July 2026 auto layout update reworked padding, stroke and fill-container handling for CSS parity and touched none of this. If either request ships, sections 1, 3 and 5 all change, and it is worth checking both threads specifically rather than only Figma's general release notes, since a shipped feature might land without a dedicated announcement.
- **Figma's RTL text support has not moved since March 2022.** Repeated searches through this pass turned up nothing newer than the original launch thread. That absence is the finding, not a gap in the research.
- **The mirroring plugins are the fastest-moving thing in this guide, and the September pass changed what section 3 says about them.** An earlier pass treated the whole category as frame-flippers whose output is detached and therefore unmaintainable, which is true of most of them and not of all: RTL Layout documents mirroring the parent component rather than the instance, and generating an RTL variant on a component set. That capability is what makes the direction-property route affordable, so if it changes, sections 3 and 4 change with it. Everything asserted about these tools comes from their own product pages rather than from a trial, which is the weakest sourcing in this guide and the easiest to fix: run one against a duplicate of a real library and the claim resolves in an afternoon.
- **A third Figma feature request appears to ask for auto layout direction as a variable in those words alone**, alongside the two already tracked here. It surfaced this pass only as a search result and a feed URL; the topic page itself returned an access error to the fetch tool, so its opening date, reply count and whether it has a staff response are all unread. Treat the existence of a third thread as likely and its contents as unverified, and check all three as a set rather than individually.
- **The measurement in section 12 comes from one library**, 82 sets and 741 variants, so the ratio it reports (roughly three quarters of sets carrying a reversible row) should be treated as one data point rather than a benchmark. The method transfers; the proportion may not. A second library measured the same way would be worth more than any further reading on this topic.
- **The per-language Material exceptions (Hebrew progress indicators, Urdu and Persian help icons, the Arabic/Farsi-only question mark mirror) could not be confirmed by directly reading Material's current bidirectionality page this session**, despite several attempts; the page renders through client-side JavaScript that did not return readable text to the fetch tool used. The specific claims rest on convergent search-engine summaries rather than a page actually opened, which is weaker sourcing than the rest of this guide and worth a manual browser check before anyone treats the Hebrew exception as certain. Note also that the *archived* Material 1 page (the one a "material.io/archive" link now redirects to, at `m1.material.io`) does not itself contain these per-language splits, only the general mirror/do-not-mirror list; the specific exceptions, if they are real, live on the current Material 3 site and nowhere else checked.
- **The Arabic typography disagreement in section 6 is unresolved**, and remains the weakest evidence here on the "more line height" side even after a second check. Two Arabic-first government systems still ship an undifferentiated scale; widely repeated advice still says to increase leading; no measurement was found on either side in this pass either. If your team resolves this with real testing, that result is worth more than anything published so far.
- **User research on right-to-left interfaces exists, and it is worth reading rather than treating as absent.** Goldenberg and Tractinsky's CHI 2021 paper (234 participants, a review of live interfaces plus a preference survey) is the one solid piece of user-outcome evidence found in this field, and it found real gaps between vendor guidance and user preference. It has not been independently replicated as far as this pass could find, and its detailed per-element findings were not fully accessible through the tools used this session (the ACM and ResearchGate hosts returned access errors), so the citation here rests on the abstract and search-indexed summaries rather than a full read of the results section. Read the paper directly before building a specific claim on it.
- **The mirroring rules outside the Material exceptions are unusually well supported**, and it is worth saying why. Microsoft's guidance comes from decades of shipping Windows and Office in Arabic and Hebrew, Codex from Wikipedia's several hundred language editions, and the algorithm from the Unicode standards process, itself updated as recently as August 2025 without changing the fundamentals cited here. Those are independent constraint sets arriving at the same list, which is stronger than the usual design-system agreement where everyone is citing everyone else.
- **A previously cited commercial RTL guide (Finastra's design system) no longer resolves.** The domain that hosted it failed to resolve on every attempt this pass. It has been dropped from sources rather than cited from memory.

---

## Sources

**Primary: specifications and platform documentation**

- [Unicode Standard Annex #9, *Unicode Bidirectional Algorithm*](http://www.unicode.org/reports/tr9/). Neutral character resolution and paired-punctuation mirroring, behind section 8. Current as of Unicode 17.0.0, revision 51 (2025-08-13).
- [Unicode blog, *PRI 231: bidi parenthesis algorithm*](https://blog.unicode.org/2012/06/pri-231-bidi-parenthesis-algorithm.html). Why the plain algorithm needed an extra rule for paired punctuation.
- [Microsoft Learn, *Mirroring*](https://learn.microsoft.com/en-us/globalization/fonts-layout/mirroring). Scroll bar position, control mirroring, the media-control exception, and the four validation criteria for bidirectional interfaces. Last updated 2024-03-26.
- [Apple, *Supporting Right-to-Left Languages*](https://developer.apple.com/library/archive/documentation/MacOSX/Conceptual/BPInternational/SupportingRight-To-LeftLanguages/SupportingRight-To-LeftLanguages.html). Automatic mirroring under Auto Layout and the phone-number exception, re-confirmed live this pass. Archived documentation.
- [Apple Human Interface Guidelines, *Right to left*](https://developer.apple.com/design/human-interface-guidelines/right-to-left). The current, non-archived HIG page covering the same ground. Renders through client-side JavaScript; its content was corroborated through search rather than read directly this session.
- [Figma Help Center, *Add right-to-left text*](https://help.figma.com/hc/en-us/articles/4972283635863-Add-right-to-left-text). What Figma's RTL support covers: text direction, alignment, mixed-direction paragraphs and font fallback, nothing about layout.
- [Figma Forum, *Launched: Add support for RTL languages*](https://forum.figma.com/suggest-a-feature-11/launched-add-support-for-rtl-languages-34566). The March 2022 launch.
- [Figma Forum, *Use variables to control auto layout settings like direction, alignment, hug, fill*](https://forum.figma.com/suggest-a-feature-11/feature-request-use-variables-to-control-auto-layout-settings-like-direction-alignment-hug-fill-41822). The open request behind sections 1 and 3, running from June 2025 with its latest post May 19, 2026 and no staff response.
- [Figma Forum, *RTL support for wrap in auto layout*](https://forum.figma.com/suggest-a-feature-11/rtl-support-for-wrap-in-auto-layout-43630). The narrower, also-open request behind section 1's wrapping note, opened August 2025.
- [Figma release notes, *Design closer to CSS with the updated auto layout option*](https://www.figma.com/release-notes/). The July 2026 auto layout change, checked for and confirmed not to touch direction or RTL.
- [Figma Help Center, *Use auto layout with CSS Flexbox in mind*](https://help.figma.com/hc/en-us/articles/42031586813719-Use-auto-layout-with-CSS-Flexbox-in-mind). Detail on what the July 2026 update actually changed (padding, strokes, fill-container sizing, gap stacks).
- [MDN, `margin-inline`](https://developer.mozilla.org/docs/Web/CSS/margin-inline). The logical-property definition referenced in section 11.
- [Figma Forum, *Please add auto layout direction as a variable*](https://forum.figma.com/t/please-add-auto-layout-direction-as-a-variable/48086). A probable third open request on the same gap. Surfaced through search and a feed URL only; the topic page returned an access error this pass, so its contents are unread. See section 15.

**Primary: design systems**

- [Wikimedia Codex, Bidirectionality style guide](https://doc.wikimedia.org/codex/v1.9.0/style-guide/bidirectionality.html). The mirror and do-not-mirror lists in section 2, the numbers rule and the address rule.
- [Wikimedia Codex, Designing components](https://doc.wikimedia.org/codex/latest/contributing/designing-components.html). Confirms bidirectionality is one of several optional spec-sheet elements ("use your own discretion"), not a mandatory requirement as an earlier pass of this guide overstated it.
- [Wikimedia Codex, Developing with Codex](https://doc.wikimedia.org/codex/latest/using-codex/developing.html). Codex's own limitation to pages that are entirely one direction, with mixed LTR/RTL content unsupported except in special cases.
- [Wikimedia Codex, Types and constants](https://doc.wikimedia.org/codex/latest/components/types-and-constants.html). The icon direction metadata behind sections 2 and 5: `shouldFlip`, `shouldFlipExceptions` (with the help icon, Hebrew and Yiddish worked example) and `langCodeMap`. Read directly this pass.
- [Phabricator T300053, Bidirectionality guidelines](https://phabricator.wikimedia.org/T300053). How Wikimedia scoped the work; closed and resolved, merged into the Codex style guide.
- [Material Design 3, Bidirectionality and RTL](https://m3.material.io/foundations/layout/bidirectionality-rtl). Material's current guidance page. Not independently readable through the fetch tool this session; see the caveat in section 15.
- [Material Design archive, Bidirectionality](https://m1.material.io/usability/bidirectionality.html). The page a "material.io/archive" link now redirects to (301). Carries the general mirror/do-not-mirror list; does not carry the Hebrew, Urdu or Farsi exceptions, which appear only on the current Material 3 page above.
- [UAE Design System 2.0, Typography](https://designsystem.gov.ae/guidelines/typography). Noto Kufi Arabic and Alexandria, the shared type scale, the 1.5 minimum body line height, re-verified this pass.
- [Dubai Design System, Typography](https://designsystem.dubai.ae/foundations/typography). One typeface recommended for both scripts, identical sizes and line heights at every breakpoint, re-verified this pass.
- [Bootstrap 5.3, RTL](https://getbootstrap.com/docs/5.3/getting-started/rtl/). The logical utility naming (`.ms-3` vs `.ml-3`), the RTLCSS build tool, and building both directions from one source, referenced in section 11.
- [Ant Design, `ConfigProvider`](https://ant.design/components/config-provider/). The root direction property, the maintained list of components supporting it, and the still-open Rate-component half-star gap.
- [Ant Design PR #18006](https://github.com/ant-design/ant-design/pull/18006) and [PR #19380](https://github.com/ant-design/ant-design/pull/19380). The initial RTL pull request (six components) and the follow-up that extended coverage to more than 40, the evidence that coverage is the project rather than the switch.

**Primary: user-outcome research**

- [Goldenberg, Y. and Tractinsky, N., *Towards the Right Direction in BiDirectional User Interfaces*, CHI 2021](https://dl.acm.org/doi/abs/10.1145/3411764.3445461) ([arXiv preprint](https://arxiv.org/abs/2101.08070)). A review of live bidirectional interfaces plus a 234-participant preference survey, finding user direction preferences inconsistent with published vendor guidance in a meaningful share of cases. The paper's abstract and search-indexed summaries were read; the ACM and ResearchGate hosts returned access errors for the full results section, so treat the detailed per-element findings as unread until a direct copy is obtained.

**Vendor documentation: mirroring plugins**

Everything cited from these pages is the vendor's description of its own tool. None of it was verified by running the plugin, and section 3 says so in the text.

- [RTL Layout](https://www.rtllayout.com/) and its [Figma Community listing](https://www.figma.com/community/plugin/1299598792826701614/rtl-layout-mirror-translate-and-adapt-arabic-100-languages-in-figma). The source of section 3's claim that a plugin can work on components rather than frames: mirroring the parent component because an instance's layout is not editable, and generating an RTL variant on a component set behind a toggleable property.
- [RTL Converter](https://www.figma.com/community/plugin/1648270885436375973/rtl-converter). Its published description of what it changes (reversing horizontal auto-layout rows, swapping alignment, mirroring free-positioned children, flipping directional icons) is the clearest short statement of the mirroring operation in the category.
- [RTL Hero](https://www.figma.com/community/plugin/1534631933456309077/rtl-hero), [Aura RTL](https://www.figma.com/community/plugin/1606768950228528655/aura-rtl), [RTLAuto](https://rtlauto.com/). The rest of the category, listed for completeness rather than compared.

**Commentary, labelled as such in the text**

- [Itiel Maimon, RTL guidelines](https://github.com/ItielMaN/rtl-guidelines). A widely referenced practitioner compilation, re-confirmed live this pass.
- [Voxire, *Arabic RTL typography for web design*](https://voxire.com/blog/arabic-rtl-typography-web-design-2026/). The source of the 1.7 to 1.85 line-height figures that section 6 declines to adopt, re-confirmed live and current as of June 2026.
- [Freezil, *Arabic typography for non-Arabic designers*](https://freezil.com/blog/arabic-typography-guide). A practitioner guide to Arabic typeface selection, re-confirmed live this pass.

**Cited but not resolved to a URL**

- The text-expansion figures in section 7 are consistent across several localisation-vendor sources but were not traced to a primary measurement. Treat the percentages as rules of thumb; no source explained its methodology.
- The digital-library project in section 8 that chose Western digits throughout was reported second-hand in a discussion of numeral practice. The project was not identified and the account was not re-sourced this pass either.
- Figma's text alignment options and the inability to override auto layout direction on an instance (section 3) are described from the current product rather than from a documentation page stating the limitation.
- A previously cited Finastra design-system RTL page (`design.fusionfabric.cloud/foundations/rtl`) failed to resolve on every attempt this pass and has been dropped rather than cited from an earlier reading.
