# Right-to-left in a Figma design system

What to build, decide and write down when a product whose library lives in Figma needs Arabic, Hebrew, Farsi or Urdu.

*Part 1 of 2. [Part 2](rtl-design-systems-part-2.md) covers Arabic type, digits, mixed-language text, handoff and review.*

A product team has been asked for an Arabic version of its app. The designer opens the library: every row runs left to right, every padding field says left or right, and every button was sized around an English label. Nobody can say which of those will break in Arabic, or whether the honest answer is a second, mirrored library.

---

## What this answers

- [The mirrored layout](#the-mirrored-layout): what changes in a right-to-left interface
- [The flip list](#the-flip-list): what flips, and what stays put
- [Figma versus code](#figma-versus-code): which of the two does the flipping
- [One library, not two](#one-library-not-two): whether a second, mirrored library is needed
- [The Direction variant](#the-direction-variant): when a Direction variant earns its place
- [Components that flip cheaply](#components-that-flip-cheaply): how to build components that flip cheaply
- [Sizing the work](#sizing-the-work): how much of the library is affected

For a lookup, use the [cheat sheet](#cheat-sheet); [the short version](#the-short-version) is this part in four paragraphs. Arabic type, digits, mixed-language text, handoff and review are in [Part 2](rtl-design-systems-part-2.md).

---

## The mirrored layout

The whole layout turns around, like a reflection in a mirror, because readers of Arabic, Hebrew, Farsi and Urdu start scanning a screen from the right edge.

Take a row from a settings screen: an icon, a label, and a small arrow (a chevron) that says "tap to go further". An English reader meets it from the left: icon, then label, then the chevron on the right edge, pointing right, towards where the tap leads.

An Arabic reader starts on the right. So the icon and label move to the right edge, and the chevron moves to the left edge and points left, because "forward" in a right-to-left language is to the left. Here is the same row in both languages.

<svg style="display:block;width:100%;height:auto;margin:2em 0" viewBox="0 0 600 236" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="f1t" font-family="system-ui, -apple-system, sans-serif">
  <title id="f1t">The same settings row in English and Arabic. In English the bell icon and the label Notifications sit on the left and the chevron points right on the right edge. In Arabic the icon and label sit on the right and the chevron points left on the left edge.</title>
  <rect width="600" height="236" rx="12" fill="#f5f6f8"/>
  <text x="24" y="32" font-size="13" font-weight="600" fill="#5b6270">English: read from the left →</text>
  <rect x="24" y="44" width="552" height="56" rx="10" fill="#fff" stroke="#d8dce3"/>
  <path d="M52 66a8 8 0 0 1 16 0v8l3 4H49l3-4z M57 81a3 3 0 0 0 6 0" fill="none" stroke="#15171c" stroke-width="2" stroke-linejoin="round"/>
  <text x="84" y="78" font-size="16" fill="#15171c">Notifications</text>
  <path d="M546 64l8 8-8 8" fill="none" stroke="#1f4fd8" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="576" y="140" font-size="13" font-weight="600" fill="#5b6270" text-anchor="end">← Arabic: read from the right</text>
  <rect x="24" y="152" width="552" height="56" rx="10" fill="#fff" stroke="#d8dce3"/>
  <path d="M532 174a8 8 0 0 1 16 0v8l3 4h-22l3-4z M537 189a3 3 0 0 0 6 0" fill="none" stroke="#15171c" stroke-width="2" stroke-linejoin="round"/>
  <text x="516" y="186" font-size="16" fill="#15171c" text-anchor="end">الإشعارات</text>
  <path d="M62 172l-8 8 8 8" fill="none" stroke="#1f4fd8" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>

Every part kept its job and swapped its side: the icon is still first and the chevron still last.

That reflection covers the whole screen, not one row. The navigation drawer opens from the right. The back button moves to the top right and points right. Progress bars fill from right to left, and text lines up against the right edge.

Because "left" and "right" swap meaning, designers and developers use two words that don't. **Leading** is the side where reading starts: left in English, right in Arabic. **Trailing** is the side where it ends. The icon in the row is leading in both languages; only its place on screen changed.

**Treat right to left as a mirror image of the layout, not a translation of the text.** Describe sides as leading and trailing from now on, in specs, notes and Figma names (code says start and end), because those are the only side words that stay true in both directions. Almost every decision below is about one of the settings row's three parts.

---

## The flip list

Layout, navigation, arrows and anything that shows progress flip; media controls, clocks, numbers and photographs stay as they are, and those are the ones that ship wrong.

The chevron in the settings row flips because it means "forward", and forward changed direction. The trouble starts with things that look directional but were never tied to reading direction. Here is one of each kind.

<svg style="display:block;width:100%;height:auto;margin:2em 0" viewBox="0 0 600 196" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="f2t" font-family="system-ui, -apple-system, sans-serif">
  <title id="f2t">What flips and what stays. A back arrow points left in English and right in Arabic. Media controls, a clock and a phone number look exactly the same in both languages.</title>
  <rect width="600" height="196" rx="12" fill="#f5f6f8"/>
  <text x="200" y="30" font-size="13" font-weight="600" fill="#5b6270" text-anchor="middle">English</text>
  <text x="440" y="30" font-size="13" font-weight="600" fill="#5b6270" text-anchor="middle">Arabic</text>
  <text x="24" y="72" font-size="14" font-weight="600" fill="#1f4fd8">Flips</text>
  <text x="24" y="90" font-size="12" fill="#5b6270">Back arrow</text>
  <rect x="120" y="48" width="160" height="52" rx="10" fill="#fff" stroke="#d8dce3"/>
  <path d="M212 74h-28m10-10l-10 10 10 10" fill="none" stroke="#15171c" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  <rect x="360" y="48" width="160" height="52" rx="10" fill="#fff" stroke="#d8dce3"/>
  <path d="M424 74h28m-10-10l10 10-10 10" fill="none" stroke="#15171c" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="24" y="146" font-size="14" font-weight="600" fill="#15171c">Stays</text>
  <text x="24" y="164" font-size="12" fill="#5b6270">Media, time,</text>
  <text x="24" y="180" font-size="12" fill="#5b6270">numbers</text>
  <g id="stay">
    <rect x="120" y="120" width="160" height="56" rx="10" fill="#fff" stroke="#d8dce3"/>
    <path d="M140 140v12l9-6z M152 140v12l9-6z" fill="#15171c"/>
    <circle cx="186" cy="146" r="9" fill="none" stroke="#15171c" stroke-width="2"/>
    <path d="M186 140v6l4 3" fill="none" stroke="#15171c" stroke-width="2" stroke-linecap="round"/>
    <text x="206" y="151" font-size="13" fill="#15171c">555 0142</text>
  </g>
  <use href="#stay" x="240"/>
</svg>

The back arrow turned round. The media controls, the clock and the phone number didn't, and each has its own reason.

A video player's fast-forward button points right in Cairo and Tel Aviv too, because media controls copy the old tape machines, not the reading direction ([Microsoft's guidance on mirroring](https://learn.microsoft.com/en-us/globalization/fonts-layout/mirroring) names this example). Clocks still run clockwise, a mirrored phone number is a wrong phone number, and a mirrored photograph has its writing backwards.

The clearest published list comes from [Wikimedia's Codex guidance on bidirectionality](https://doc.wikimedia.org/codex/v1.9.0/style-guide/bidirectionality.html), the design system behind Wikipedia's hundreds of languages:

| Flips | Stays put |
|---|---|
| Layout, containers, navigation | Media controls: play, pause, rewind, fast-forward |
| Text alignment | Clocks and time-related icons |
| Directional icons: back, forward, next | Checkmarks and icons for right-hand use |
| Buttons and button groups | Phone numbers, postal codes |
| Sliders, toggles, pagination, ratings | Web addresses, email addresses, numbers |
| Progress sequences and steppers | Currency symbols |
| In-page elements | Icons with no clear direction |
| Captions and labels for images | Images and illustrations themselves |
| | Charts, where mirroring would change the reading |

The catch is that right to left isn't one language. Hebrew and Arabic disagree on details. A help icon with a question mark in it mirrors in Arabic and Farsi, whose question mark is written mirrored, but not in Hebrew, whose question mark isn't.

Codex builds that into its icon data: each icon can say that it flips and list the languages where it doesn't ([Codex types and constants](https://doc.wikimedia.org/codex/latest/components/types-and-constants.html)). So a system with a single right-to-left mode has decided to be slightly wrong in at least one language, which is fine as long as someone made the decision.

These rules are convention, not measured preference. The only user study found, [a 2021 survey of 234 readers of right-to-left languages](https://arxiv.org/abs/2101.08070), found their preferences didn't always match the guidance, which makes the list a starting point rather than the final word.

**Start from Codex's list, and write down which languages you actually support ("Arabic and Farsi; Hebrew not yet").** Record each exception you take as a decision with a name and a date, so someone can revisit it when a reader says it feels wrong.

---

## Figma versus code

The code flips it: a built product can mirror the whole interface from one switch, while Figma has no such switch for layout, so the library stays drawn left to right.

Go back to the settings row. Say its padding is 16 on the leading side and 12 on the trailing side; in Figma's auto layout panel that is typed as "left 16, right 12". A developer can write it the same way, or as "16 at the start, 12 at the end". The second way uses **logical properties**: spacing named by role rather than by side, which swaps sides by itself when the page is switched to right to left.

The switch is a single setting on the page, which the W3C asks to live in the page rather than the styling ([W3C, structural markup and right-to-left text](https://www.w3.org/International/questions/qa-html-dir)). For the developer: it is `dir="rtl"`. Rows reverse their order on their own when it is on, so with the switch and logical properties together the row mirrors correctly, with no second design.

If the developer wrote "left" and "right" instead, the order still reverses but the padding doesn't. Here are the three outcomes, one under the other.

<svg style="display:block;width:100%;height:auto;margin:2em 0" viewBox="0 0 600 262" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="f3t" font-family="system-ui, -apple-system, sans-serif">
  <title id="f3t">Padding in three rows. English: 16 on the left, leading, and 12 on the right. Arabic, mirrored correctly: 16 has moved to the right, still leading. Arabic, padding written as left and right: the order has flipped but 16 stayed on the left, so the leading side gets 12.</title>
  <rect width="600" height="262" rx="12" fill="#f5f6f8"/>
  <text x="24" y="30" font-size="13" font-weight="600" fill="#5b6270">English</text>
  <rect x="24" y="40" width="552" height="48" rx="10" fill="#fff" stroke="#d8dce3"/>
  <rect x="24" y="40" width="48" height="48" fill="#1f4fd8" fill-opacity=".14"/>
  <rect x="540" y="40" width="36" height="48" fill="#1f4fd8" fill-opacity=".14"/>
  <text x="48" y="69" font-size="13" font-weight="700" fill="#1f4fd8" text-anchor="middle">16</text>
  <text x="558" y="69" font-size="13" font-weight="700" fill="#1f4fd8" text-anchor="middle">12</text>
  <text x="84" y="69" font-size="15" fill="#15171c">Notifications</text>
  <path d="M520 58l7 6-7 6" fill="none" stroke="#15171c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="24" y="112" font-size="13" font-weight="600" fill="#5b6270">Arabic, mirrored correctly</text>
  <rect x="24" y="122" width="552" height="48" rx="10" fill="#fff" stroke="#d8dce3"/>
  <rect x="24" y="122" width="36" height="48" fill="#1f4fd8" fill-opacity=".14"/>
  <rect x="528" y="122" width="48" height="48" fill="#1f4fd8" fill-opacity=".14"/>
  <text x="42" y="151" font-size="13" font-weight="700" fill="#1f4fd8" text-anchor="middle">12</text>
  <text x="552" y="151" font-size="13" font-weight="700" fill="#1f4fd8" text-anchor="middle">16</text>
  <text x="516" y="151" font-size="15" fill="#15171c" text-anchor="end">الإشعارات</text>
  <path d="M80 140l-7 6 7 6" fill="none" stroke="#15171c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="24" y="194" font-size="13" font-weight="600" fill="#c62828">Arabic, padding written as left and right</text>
  <rect x="24" y="204" width="552" height="48" rx="10" fill="#fff" stroke="#c62828"/>
  <rect x="24" y="204" width="48" height="48" fill="#c62828" fill-opacity=".12"/>
  <rect x="540" y="204" width="36" height="48" fill="#c62828" fill-opacity=".12"/>
  <text x="48" y="233" font-size="13" font-weight="700" fill="#c62828" text-anchor="middle">16</text>
  <text x="558" y="233" font-size="13" font-weight="700" fill="#c62828" text-anchor="middle">12</text>
  <text x="528" y="233" font-size="15" fill="#15171c" text-anchor="end">الإشعارات</text>
  <path d="M92 222l-7 6 7 6" fill="none" stroke="#15171c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>

In the bottom row the 16 stayed on the left, which in Arabic is the trailing side, so the label sits 12 from its edge instead of 16. A chevron pointing the wrong way gets caught in review. Four pixels can ship like that for years.

Figma has half of this. Since 2022 it handles right-to-left text well: Arabic, Hebrew, Farsi and Urdu can be typed, and Figma works out which way each paragraph runs, even when a line mixes Arabic with an English product name ([Figma, add right-to-left text](https://help.figma.com/hc/en-us/articles/4972283635863-Add-right-to-left-text)).

What it lacks is right-to-left layout. An auto layout frame only knows left to right; it has no idea of leading or trailing, so there is nothing for a switch to flip. Its padding fields say left and right, and text alignment offers left, centre or right, with no "leading".

Variables can't fill the gap the way dark mode swaps every colour, because what needs to change isn't a value: a variable can't set a row's direction or alignment. Nor can a designer fix it one instance at a time, since an instance can't override its layout direction or the order of its children.

People have asked. A [request to control auto layout direction with variables](https://forum.figma.com/suggest-a-feature-11/feature-request-use-variables-to-control-auto-layout-settings-like-direction-alignment-hug-fill-41822) has been open since June 2025, and requests for right-to-left wrapping go back to [2023](https://forum.figma.com/suggest-a-feature-11/add-auto-layout-wrap-from-right-to-left-7535). The July 2026 auto layout update brought Figma closer to code but didn't touch direction ([Figma, auto layout and CSS flexbox](https://help.figma.com/hc/en-us/articles/42031586813719-Use-auto-layout-with-CSS-Flexbox-in-mind)). So a "Direction" mode that flips every component can't be built today: it is a feature Figma doesn't have.

**Plan for a library drawn left to right and a product that mirrors in the browser.** Spend your design effort on the decisions code can't make for you: what flips, what doesn't, and which side each padding belongs to.

---

## One library, not two

A second, mirrored library is almost never needed: keep one library, and build four small things beside it.

A mirrored copy sounds tidy until it has to be maintained: every new variant, renamed property and rebinding has to happen twice, and copied libraries drift. The tokens don't need a copy or a mode either. Most spacing tokens are a scale, `space/16`, which says how much space, not where it goes; what changes in Arabic is which side the value lands on, and the layout and the code decide that.

Direction gets into tokens only through their names, and usually only in component tokens, the ones tied to one side of one component. Take `button/padding-left: space/16`. In Arabic that 16 should move to the right, but the name still says left, and a developer will apply it to the left. Named `button/padding-start`, after the side code calls `inline-start`, it is true in both directions. A system with no component tokens has nothing to rename.

The opposite mistake is to say "the code handles it" and build nothing. Code mirrors boxes; it doesn't know that the chevron flips and the fast-forward button doesn't, or that a 7-character label is now 12. If nobody writes those decisions down, a developer makes them under deadline.

So instead of a second library, build these four things, in order of value for the time they take:

1. **A short "Right to left" note in each component's description**, saying what mirrors and what doesn't.
2. **An icon list** that marks each icon as mirroring or not, decided when the icon is drawn (see [components that flip cheaply](#components-that-flip-cheaply)).
3. **Right-to-left mockups of the ten or so screens where direction changes a decision**: navigation, forms where people type in more than one language, charts, media.
4. **Real Arabic text in the Figma files**, because translated labels often run far longer than English, and real text shows which buttons cut them off while that is cheap to fix ([Part 2, text expansion](rtl-design-systems-part-2.md#text-expansion)).

The note goes in the component's description: the same text Dev Mode shows a developer and an AI tool reads through Figma's MCP server. It isn't a separate annotation or a page of specs. A heading of its own, `Right to left`, lets people find it and lets a check tell that it is there.

Not every component needs one: it earns its place where something mirrors in a way code wouldn't guess, like uneven padding, or deliberately doesn't, like playback controls. An avatar or a spinner needs none. [Codex lists a note like this](https://doc.wikimedia.org/codex/latest/contributing/designing-components.html) as an optional part of its component specs.

Here is the note for the settings row, and for a media player, where the point is what stays.

<svg style="display:block;width:100%;height:auto;margin:2em 0" viewBox="0 0 600 228" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="f5t" font-family="system-ui, -apple-system, sans-serif">
  <title id="f5t">Two component descriptions as they appear in Figma. Settings row, under a Right to left heading: mirrors the order, the chevron and the padding, 16 leading and 12 trailing; nothing stays. Media player, under a Right to left heading: mirrors the layout around the controls; the playback controls and the progress bar's direction stay as they are.</title>
  <rect width="600" height="228" rx="12" fill="#f5f6f8"/>
  <rect x="20" y="20" width="270" height="188" rx="10" fill="#fff" stroke="#d8dce3"/>
  <text x="36" y="46" font-size="12" font-weight="600" fill="#5b6270">Description · Settings row</text>
  <text x="36" y="72" font-size="13" fill="#15171c">A row that opens a settings page.</text>
  <text x="36" y="106" font-size="14" font-weight="700" fill="#1f4fd8">Right to left</text>
  <text x="36" y="130" font-size="13" fill="#15171c">• Mirrors: order, chevron</text>
  <text x="36" y="152" font-size="13" fill="#15171c">• Padding: 16 leading, 12 trailing</text>
  <text x="36" y="174" font-size="13" fill="#15171c">• Stays: nothing</text>
  <rect x="310" y="20" width="270" height="188" rx="10" fill="#fff" stroke="#d8dce3"/>
  <text x="326" y="46" font-size="12" font-weight="600" fill="#5b6270">Description · Media player</text>
  <text x="326" y="72" font-size="13" fill="#15171c">Plays a video with its controls.</text>
  <text x="326" y="106" font-size="14" font-weight="700" fill="#1f4fd8">Right to left</text>
  <text x="326" y="130" font-size="13" fill="#15171c">• Mirrors: title, menu, layout</text>
  <text x="326" y="152" font-size="13" fill="#15171c">• Stays: play, rewind, fast-forward</text>
  <text x="326" y="174" font-size="13" fill="#15171c">• Stays: progress fills left to right</text>
</svg>

Three lines is usually enough. The player's note is mostly about what stays, which is exactly what a developer would otherwise get wrong.

**Keep one library, and write each component's right-to-left decisions into its description, under a `Right to left` heading, before a developer has to guess them.** Leave the scale tokens alone, and rename only component tokens whose names say left or right.

---

## The Direction variant

A Direction variant earns its place when designers draw right-to-left screens in Figma before any code exists, because a note can't be placed on a canvas and they need instances that face the right way.

Picture a team whose designers sign off Arabic mockups before handoff. The settings row in their file still points its chevron right, and the only way to make an Arabic screen is to detach it and rebuild it by hand.

The answer then is a new variant axis, `Direction`, with `LTR` and `RTL`, on the component sets whose contents reverse, inside the same set: every variant gets an `RTL` twin drawn mirrored, and a designer working in Arabic picks `Direction=RTL` like any other variant. Here is the settings row's set with the new axis.

<svg style="display:block;width:100%;height:auto;margin:2em 0" xmlns="http://www.w3.org/2000/svg" role="img" font-family="system-ui, -apple-system, sans-serif" viewBox="0 0 600 250" aria-labelledby="f11t">
  <title id="f11t">A settings row component set with a Direction axis. Two columns, LTR and RTL, and two rows, State=Rest and State=Hover. Each RTL variant is the LTR one drawn mirrored: chevron on the left, icon and label on the right.</title>
  <rect width="600" height="250" rx="12" fill="#f5f6f8"/>
  <rect x="20" y="20" width="560" height="210" rx="10" fill="none" stroke="#9747ff" stroke-dasharray="5 4"/>
  <text x="36" y="44" font-size="12" font-weight="600" fill="#9747ff">Settings row · component set</text>
  <text x="180" y="72" font-size="12" font-weight="700" fill="#15171c">Direction=LTR</text>
  <text x="420" y="72" font-size="12" font-weight="700" fill="#1f4fd8">Direction=RTL</text>
  <text x="36" y="112" font-size="11" fill="#5b6270">State=Rest</text>
  <text x="36" y="172" font-size="11" fill="#5b6270">State=Hover</text>
  <rect x="130" y="90" width="200" height="36" rx="8" fill="#fff" stroke="#d8dce3"/><circle cx="150" cy="108" r="6" fill="none" stroke="#15171c" stroke-width="1.5"/><text x="164" y="113" font-size="12" fill="#15171c">Notifications</text><path d="M308 100 L316 108 L308 116" stroke="#1f4fd8" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <rect x="360" y="90" width="200" height="36" rx="8" fill="#fff" stroke="#d8dce3"/><circle cx="540" cy="108" r="6" fill="none" stroke="#15171c" stroke-width="1.5"/><text x="526" y="113" font-size="12" fill="#15171c" text-anchor="end">الإشعارات</text><path d="M382 100 L374 108 L382 116" stroke="#1f4fd8" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <rect x="130" y="150" width="200" height="36" rx="8" fill="#eef2fd" stroke="#d8dce3"/><circle cx="150" cy="168" r="6" fill="none" stroke="#15171c" stroke-width="1.5"/><text x="164" y="173" font-size="12" fill="#15171c">Notifications</text><path d="M308 160 L316 168 L308 176" stroke="#1f4fd8" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <rect x="360" y="150" width="200" height="36" rx="8" fill="#eef2fd" stroke="#d8dce3"/><circle cx="540" cy="168" r="6" fill="none" stroke="#15171c" stroke-width="1.5"/><text x="526" y="173" font-size="12" fill="#15171c" text-anchor="end">الإشعارات</text><path d="M382 160 L374 168 L382 176" stroke="#1f4fd8" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="300" y="214" font-size="12" fill="#5b6270" text-anchor="middle">Every variant gets a mirrored twin, in the same set</text>
</svg>

Each right-hand variant is its left-hand twin drawn mirrored, and both sit in the one set a designer already knows.

It isn't free. Every set whose row reverses gains a second copy of every variant, so if half the sets have such a row, the variant count grows by half. [Sizing the work](#sizing-the-work) shows how to count them.

What it buys is visibility: a missing variant shows inside its own set, while a component missing from a twin library shows to nobody.

Nobody has to draw the twins by hand. Most mirroring plugins flip a frame on demand, which leaves a detached copy that goes stale; [RTL Layout](https://www.rtllayout.com/) says it mirrors the main component instead and can add a right-to-left variant to a set. That is the vendor's description, not a tested result, and a plugin only mirrors boxes, so its output still needs checking against [the flip list](#the-flip-list). (A product that is Arabic first turns all of this around: English is the adaptation.)

Which case a team is in depends on when it first sees a screen in Arabic:

- **Arabic first appears in the built product.** Designers work in English and someone reviews the Arabic version in the browser. One library and the four things are enough, because nobody places an Arabic instance on a canvas.
- **Designers draw Arabic screens before any code exists.** Then the sets whose rows reverse need a `Direction` property, with the `RTL` variants generated by a plugin rather than drawn.
- **Either way, the four things come first,** since the notes and the icon list are the `RTL` variants' source.

The toolkit reads that answer from two lines in the project's settings:

- `rtlLanguages: ["ar"]`: the product ships Arabic. The component audit then checks every component for the habits in [components that flip cheaply](#components-that-flip-cheaply).
- `rtlInFigma: true`: designers draw Arabic screens in Figma. The audit then also asks for a `Direction` variant on every set whose row reverses, and checks each `RTL` variant against its `LTR` twin: parts in reverse order, wide text aligned right.

Decide which case you are in, and write it down where your tools can read it. **If you're not sure, start as the first case: adding a direction property later costs the same as adding it now.** When you do add one, generate the variants on a duplicate of the library first and review them against your notes.

---

## Components that flip cheaply

Four habits make a component cheap to flip: rows in auto layout, uneven padding written down, directional icons behind a swap property, and no left or right in any name.

The code does the flipping, but only for what is built in a way it can flip. Each habit is cheap now and expensive to retrofit.

### Order in auto layout

Auto layout gives a row an order, and code can reverse an order, the way the settings row reversed. A layer placed by hand has no order, only a position.

The commonest right-to-left bug in a component library is one of those: a badge positioned absolutely, 8 pixels from the left edge of its card. Here is that card, and the same card with the badge in auto layout.

<svg style="display:block;width:100%;height:auto;margin:2em 0" viewBox="0 0 600 236" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="f6t" font-family="system-ui, -apple-system, sans-serif">
  <title id="f6t">A card with a New badge and a title, in English and Arabic. On the left, the badge is positioned absolutely 8 pixels from the left: in Arabic the title moves right but the badge stays left, away from it. On the right, the badge is in auto layout: in Arabic it moves to the right with the title.</title>
  <rect width="600" height="236" rx="12" fill="#f5f6f8"/>
  <text x="40" y="38" font-size="13" font-weight="700" fill="#c62828">Absolute, 8 px from the left</text>
  <text x="330" y="38" font-size="13" font-weight="700" fill="#1b7f3b">In auto layout</text>
  <text x="22" y="92" font-size="10" fill="#5b6270">EN</text>
  <text x="22" y="168" font-size="10" fill="#5b6270">AR</text>
  <rect x="40" y="56" width="230" height="60" rx="8" fill="#fff" stroke="#d8dce3"/>
  <rect x="48" y="64" width="40" height="18" rx="9" fill="#1f4fd8"/><text x="68" y="77" font-size="11" fill="#fff" text-anchor="middle">New</text>
  <text x="48" y="104" font-size="14" fill="#15171c">Summer offer</text>
  <rect x="40" y="132" width="230" height="60" rx="8" fill="#fff" stroke="#d8dce3"/>
  <rect x="48" y="140" width="40" height="18" rx="9" fill="#1f4fd8" stroke="#c62828" stroke-width="2"/><text x="68" y="153" font-size="11" fill="#fff" text-anchor="middle">جديد</text>
  <text x="262" y="180" font-size="14" fill="#15171c" text-anchor="end">عرض الصيف</text>
  <text x="40" y="216" font-size="12" fill="#c62828">The badge stays left, away from the title</text>
  <rect x="330" y="56" width="230" height="60" rx="8" fill="#fff" stroke="#d8dce3"/>
  <rect x="338" y="64" width="40" height="18" rx="9" fill="#1f4fd8"/><text x="358" y="77" font-size="11" fill="#fff" text-anchor="middle">New</text>
  <text x="338" y="104" font-size="14" fill="#15171c">Summer offer</text>
  <rect x="330" y="132" width="230" height="60" rx="8" fill="#fff" stroke="#d8dce3"/>
  <rect x="512" y="140" width="40" height="18" rx="9" fill="#1f4fd8"/><text x="532" y="153" font-size="11" fill="#fff" text-anchor="middle">جديد</text>
  <text x="552" y="180" font-size="14" fill="#15171c" text-anchor="end">عرض الصيف</text>
  <text x="330" y="216" font-size="12" fill="#1b7f3b">The badge follows the title</text>
</svg>

On the left, the Arabic title moved right and the badge stayed left, stranded away from it. On the right, the badge follows the title because it has a place in an order rather than a position on a side.

The fix is to put the badge in the flow: a vertical auto layout holding the badge, then the title.

Sometimes a layer has to stay absolute, like a status dot on the corner of an avatar. Then the component's `Right to left` note says so: "Dot: pinned to the leading edge". The developer then pins it to the start, not the left.

A focus ring stretched over the whole component is fine: it has no side to get wrong.

### Write uneven padding down

A row with 16 on the leading side and 12 on the trailing side is normal. [Figma versus code](#figma-versus-code) showed how easily that difference lands on the wrong side once it reaches code.

The fix is one line in the component's `Right to left` note: "Padding: 16 leading, 12 trailing". It tells the developer the padding flips with the layout, so they write it the logical way.

Uneven padding doesn't need a `Direction` variant as well: padding is something a developer writes, and the note is where they read it. Here is that choice as a decision.

<svg style="display:block;width:100%;height:auto;margin:2em 0" viewBox="0 0 600 196" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="f7t" font-family="system-ui, -apple-system, sans-serif">
  <title id="f7t">A decision: do the designers draw Arabic screens in Figma before code exists? No: write a Right to left note in the description, and that is all. Yes: write the note, and also add a Direction variant with LTR and RTL options to the sets whose rows reverse.</title>
  <rect width="600" height="196" rx="12" fill="#f5f6f8"/>
  <rect x="120" y="18" width="360" height="44" rx="10" fill="#fff" stroke="#1f4fd8" stroke-width="2"/>
  <text x="300" y="45" font-size="13" font-weight="600" fill="#15171c" text-anchor="middle">Do designers draw Arabic screens before code?</text>
  <path d="M220 62 L150 104 M380 62 L450 104" stroke="#5b6270" stroke-width="1.5" fill="none"/>
  <text x="170" y="86" font-size="12" font-weight="700" fill="#5b6270" text-anchor="end">No</text>
  <text x="430" y="86" font-size="12" font-weight="700" fill="#5b6270">Yes</text>
  <rect x="30" y="106" width="240" height="70" rx="10" fill="#fff" stroke="#d8dce3"/>
  <text x="150" y="134" font-size="13" font-weight="600" fill="#15171c" text-anchor="middle">Note in the description</text>
  <text x="150" y="156" font-size="12" fill="#5b6270" text-anchor="middle">Padding: 16 leading, 12 trailing</text>
  <rect x="330" y="106" width="240" height="70" rx="10" fill="#fff" stroke="#d8dce3"/>
  <text x="450" y="134" font-size="13" font-weight="600" fill="#15171c" text-anchor="middle">Note, plus a Direction variant</text>
  <text x="450" y="156" font-size="12" fill="#5b6270" text-anchor="middle">Direction = LTR, RTL</text>
</svg>

Both branches write the note. Only the team that draws Arabic in Figma adds the variant on top.

### Make directional icons swappable

In the product, the chevron flips however it was built in Figma: a developer marks the icon as mirroring, and the browser turns it round in Arabic. So the way the chevron is built matters in one place only, Figma itself, when someone needs an Arabic version on the canvas for a mockup, a handoff or a review.

There the two builds behave very differently. Here is the same Arabic mockup made from each.

<svg style="display:block;width:100%;height:auto;margin:2em 0" viewBox="0 0 600 250" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="f8t" font-family="system-ui, -apple-system, sans-serif">
  <title id="f8t">Making an Arabic mockup of a settings row in Figma. On the left, the chevron is drawn into the component: it still points right, and the only way to make it point left is to fork the component. On the right, the chevron is an instance controlled by an Icon property: the designer picks chevron-left in the properties panel, and the same component points the right way.</title>
  <rect width="600" height="250" rx="12" fill="#f5f6f8"/>
  <text x="30" y="34" font-size="13" font-weight="700" fill="#c62828">Chevron drawn into the component</text>
  <text x="320" y="34" font-size="13" font-weight="700" fill="#1b7f3b">Chevron behind an Icon property</text>
  <text x="30" y="56" font-size="11" fill="#5b6270">Arabic mockup in Figma</text>
  <text x="320" y="56" font-size="11" fill="#5b6270">Arabic mockup in Figma</text>
  <rect x="30" y="66" width="250" height="48" rx="8" fill="#fff" stroke="#d8dce3"/>
  <text x="264" y="95" font-size="14" fill="#15171c" text-anchor="end">الإشعارات</text>
  <path d="M46 82 L54 90 L46 98" stroke="#c62828" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="30" y="140" font-size="12" fill="#c62828">Still points right: the wrong way</text>
  <text x="30" y="162" font-size="12" fill="#5b6270">Only fix: fork the component</text>
  <rect x="320" y="66" width="250" height="48" rx="8" fill="#fff" stroke="#d8dce3"/>
  <text x="554" y="95" font-size="14" fill="#15171c" text-anchor="end">الإشعارات</text>
  <path d="M344 82 L336 90 L344 98" stroke="#1b7f3b" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <rect x="320" y="128" width="250" height="72" rx="8" fill="#fff" stroke="#d8dce3"/>
  <text x="334" y="150" font-size="11" font-weight="600" fill="#5b6270">Properties</text>
  <text x="334" y="180" font-size="13" fill="#15171c">Icon</text>
  <rect x="400" y="164" width="156" height="26" rx="6" fill="#f5f6f8" stroke="#1f4fd8"/>
  <text x="410" y="182" font-size="12" fill="#15171c">chevron-left ▾</text>
  <text x="320" y="224" font-size="12" fill="#1b7f3b">Same component, one property changed</text>
</svg>

The drawn chevron can only be fixed by forking the component. The swappable one needs a single property changed.

So a mirrored chevron doesn't need a new variant. It needs three things:

- the chevron as an icon instance, not drawn shapes;
- an `Icon` instance-swap property on the component, so anyone using it can pick another icon;
- both chevrons, left and right, in the icon set.

Even with no Arabic mockups ever made in Figma, the swap property costs nothing. Then each icon needs its flip decision recorded, as Codex does in data (whether it flips, the languages where it doesn't, a different icon where one is needed), or as one line in each icon's description: `Right to left: mirrors` or `Right to left: stays`.

In code, the developer then flips every marked icon in one place. The flip follows the direction of whatever surrounds the icon, so an arrow inside a block of English on an Arabic page correctly stays as it is (toolkit: `knowledge/code/i18n.md#logical-properties-and-mirroring`).

### No sides in names

A layer called `Left icon` becomes false the moment the layout mirrors, because in Arabic it sits on the right. `Leading icon` stays true in both directions. Here is the same button in each language, with both names checked against it.

<svg style="display:block;width:100%;height:auto;margin:2em 0" viewBox="0 0 600 186" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="f9t" font-family="system-ui, -apple-system, sans-serif">
  <title id="f9t">A button with an icon, in English and Arabic. In English the icon is on the left; in Arabic it is on the right. A layer named Left icon is true only in English. A layer named Leading icon is true in both.</title>
  <rect width="600" height="186" rx="12" fill="#f5f6f8"/>
  <text x="30" y="36" font-size="11" fill="#5b6270">English</text>
  <rect x="30" y="46" width="150" height="40" rx="8" fill="#1f4fd8"/>
  <circle cx="52" cy="66" r="7" fill="none" stroke="#fff" stroke-width="2"/>
  <text x="68" y="71" font-size="14" fill="#fff">Search</text>
  <text x="30" y="116" font-size="11" fill="#5b6270">Arabic</text>
  <rect x="30" y="126" width="150" height="40" rx="8" fill="#1f4fd8"/>
  <circle cx="158" cy="146" r="7" fill="none" stroke="#fff" stroke-width="2"/>
  <text x="142" y="151" font-size="14" fill="#fff" text-anchor="end">بحث</text>
  <text x="230" y="60" font-size="13" fill="#15171c">Layer <tspan font-weight="700">Left icon</tspan></text>
  <text x="430" y="60" font-size="13" fill="#1b7f3b">true</text>
  <text x="230" y="80" font-size="13" fill="#15171c">Layer <tspan font-weight="700">Leading icon</tspan></text>
  <text x="430" y="80" font-size="13" fill="#1b7f3b">true</text>
  <text x="230" y="140" font-size="13" fill="#15171c">Layer <tspan font-weight="700">Left icon</tspan></text>
  <text x="430" y="140" font-size="13" fill="#c62828">false: it's on the right</text>
  <text x="230" y="160" font-size="13" fill="#15171c">Layer <tspan font-weight="700">Leading icon</tspan></text>
  <text x="430" y="160" font-size="13" fill="#1b7f3b">true</text>
</svg>

Only the role name survives the mirror.

Names matter most where they leave Figma: property names, variant values, icon names and tokens travel into the product's code and into Code Connect, where renaming later is expensive. Two role pairs are in use, and each has its place:

| Instead of | Use | Why this pair |
|---|---|---|
| Layer or property `Left icon` | `Leading icon` | Figma names take `Leading`/`Trailing` (toolkit rule 21), the word designers and SwiftUI use |
| Variant value `Left` | `Leading` | the same |
| `button/padding-left`, `button/padding-right` | `button/padding-start`, `button/padding-end` | token names are read by code, which says `inline-start` and `inline-end` |
| `card/radius-top-left` | `card/radius-start-start` | after CSS's `border-start-start-radius` |
| `icon.chevron-right` | `icon.chevron-forward` | an icon names its meaning, not a side |

The rule is the same in both columns: never left or right. [Spacing tokens by intent](../foundations/spacing-tokens-by-intent.md) names its tokens by start and end for the same reason. Scale tokens like `space/16` need no change, and renaming now costs nothing, while renaming later means a change in every codebase that uses the name.

### Checking all four

Once the project's settings say the product ships Arabic, the toolkit's component audit checks each habit and names the layer and the fix for every finding:

- a row without auto layout: "Select "Actions" and add auto layout";
- a pinned badge: "Set its position to Auto, or note: Badge: pinned to the leading edge";
- a chevron nobody can swap: "Create an instance swap property; name it Icon";
- a side in a name: "Rename it by role: "Leading icon"".

**Treat all four habits as ordinary component quality, whether or not right to left is on your roadmap yet.** Start with names that leave Figma, since those are the ones code will copy.

---

## Sizing the work

Usually less of the library is affected than a guess would say: the count that matters is the components with a row whose parts must reverse, across every variant, and it takes an afternoon.

That line comes from what an instance can and can't change. On an instance, padding, alignment and constraints can be changed; the order of its parts can't. So:

- **a component that only needs its padding swapped** can be handled where it is used, or with a note;
- **a component whose parts must reverse** needs a `Direction` variant, or gets detached, wherever designers draw Arabic screens (see [the Direction variant](#the-direction-variant)).

In practice that means counting every horizontal auto layout frame with two or more layers in it, which a read-only plugin script does for a whole library in seconds; the toolkit's component audit does it once Arabic is named in the project's settings. The result is two numbers, sets and variants that contain a row that must reverse. The safe ones are shapes with nothing to reorder: icon-only buttons, avatars, spinners, switches, radio buttons, checkboxes, containers with a single slot. Here is the sort, with an example of each side.

<svg style="display:block;width:100%;height:auto;margin:2em 0" xmlns="http://www.w3.org/2000/svg" role="img" font-family="system-ui, -apple-system, sans-serif" viewBox="0 0 600 200" aria-labelledby="f12t">
  <title id="f12t">Sorting a library into two groups. Must reverse: a settings row with icon, label and chevron, and a button with an icon and a label, because each has a row of two or more parts. Safe as drawn: an avatar, a switch and a spinner, which have nothing to reorder.</title>
  <rect width="600" height="200" rx="12" fill="#f5f6f8"/>
  <text x="30" y="38" font-size="13" font-weight="700" fill="#c62828">Must reverse</text>
  <text x="30" y="56" font-size="11" fill="#5b6270">a row of two or more parts</text>
  <rect x="30" y="74" width="150" height="36" rx="8" fill="#fff" stroke="#d8dce3"/><circle cx="50" cy="92" r="6" fill="none" stroke="#15171c" stroke-width="1.5"/><text x="64" y="97" font-size="12" fill="#15171c">Settings</text><path d="M158 84 L166 92 L158 100" stroke="#1f4fd8" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/><rect x="30" y="124" width="110" height="36" rx="8" fill="#1f4fd8"/><circle cx="50" cy="142" r="6" fill="none" stroke="#fff" stroke-width="1.5"/><text x="64" y="147" font-size="12" fill="#fff">Search</text>
  <line x1="300" y1="24" x2="300" y2="176" stroke="#d8dce3"/>
  <text x="330" y="38" font-size="13" font-weight="700" fill="#1b7f3b">Safe as drawn</text>
  <text x="330" y="56" font-size="11" fill="#5b6270">nothing to reorder</text>
  <circle cx="348" cy="98" r="18" fill="#c9d3ea"/><rect x="390" y="86" width="44" height="24" rx="12" fill="#1f4fd8"/><circle cx="422" cy="98" r="9" fill="#fff"/><circle cx="478" cy="98" r="14" fill="none" stroke="#d8dce3" stroke-width="4"/><path d="M478 84 A14 14 0 0 1 492 98" stroke="#1f4fd8" stroke-width="4" fill="none"/>
  <text x="330" y="150" font-size="11" fill="#5b6270">avatar · switch · spinner</text>
</svg>

The safe column drops out of the estimate before any work starts, which is often what gets the work approved.

The count is easy to get wrong in ways that still produce a confident-looking number:

- **Reading only the first variant.** A Button whose first variant has no icon looks safe until the variant with a leading icon. Reading only the first gives a count that is low, in the direction nobody questions.
- **Skipping hidden layers.** A hidden leading icon is still part of the row, and a boolean property will show it.
- **Counting absolutely positioned layers.** A focus ring stretched over a control isn't part of the order. Counted, it puts an icon-only button in the wrong column.

A few more things are worth recording during the count, because together they become the review checklist. The component audit records all four, with the line to add to each component's note:

- padding that differs left and right;
- layers pinned to one edge;
- alignment set to the right or the end, like a chat bubble's side, which a scan of padding and corner radius never sees;
- corners rounded on one side only, like the ends of a date range or a speech bubble.

**Measure before you estimate, and walk every variant, not the first.** Publish both numbers, and keep the list as the checklist for anything a plugin generates.

---

## Cheat sheet

| Concern | Do this | Not this |
|---|---|---|
| Figma library | One, plus a mirroring note per component | A mirrored twin |
| Designers working in RTL daily | A generated direction property on the sets that need it | A second file, or detached frames |
| Sizing the work | Count rows that must reverse, across every variant | Estimate from library size |
| Mirroring plugins | Trial on a duplicate; review the output | Trust it |
| Icon list | Flip flag, language exceptions, per-language icon | A note in a description |
| Direction mode | Accept it doesn't exist | Wait for it |
| Layout | Auto layout throughout | Absolute positioning |
| Directional icons | Instance-swap property | Flattened vector |
| Figma names | `Leading icon`, `chevron-forward` | `Left icon`, `chevron-right` |
| Token names | `button/padding-start` | `button/padding-left` |
| Padding in code | Logical: `inline-start`, `inline-end` | Physical: left and right |
| Direction in code | One switch on the page (`dir`) | Direction set in the styling |
| Media controls, clocks | Never mirror | Mirror with everything else |
| Charts, photographs | Mirror only if meaning survives; photos never | Mirror by default |

---

## The short version

Right to left mirrors the whole layout, not just the text. Layout, navigation, arrows and progress flip; media controls, clocks, numbers, photographs and most charts don't. Some rules differ between Arabic and Hebrew, so write down which languages you support, and treat the rules as convention, since the one study of real users found gaps.

In the built product, the code mirrors everything from one switch, as long as spacing is written as start and end rather than left and right. Figma can't do this for layout, so don't plan around a Direction mode. Keep one library, drawn left to right.

Build so the flip is cheap: auto layout, nothing absolutely positioned, swappable directional icons with their flip decision recorded as data, and no "left" or "right" in any name. Instead of a twin library, write a mirroring note per component, keep an icon list, mock up the screens where direction changes a decision, and put real Arabic in your files.

If your designers work right to left before code exists, add a generated direction property to the sets whose children reverse, after counting them across every variant. Consensus covers the flip list, logical properties and the direction switch; the four things in place of a twin library are a judgement built on that evidence. [Part 2](rtl-design-systems-part-2.md) takes the text: type, digits, mixed-language lines, handoff and review.

---

## What to re-check later

Researched August 2026, re-verified in September, and re-checked twice in November 2026.

- **Figma layout direction.** No 2026 Figma release touched it. The variables-for-direction request had six replies and no staff reply by November 2026; the 2023 wrapping thread had 28, and a 2024 support reply there called right-to-left wrap "on our radar", the only Figma statement found. If either request ships, most of this part changes; check the threads, since a feature can land without its own announcement.
- **The plugins.** The generated direction property rests on vendor descriptions (RTL Layout, RTL Converter, RTL Hero, Aura RTL, RTLAuto, Design RTL). One trial on a duplicate of a real library would settle it.
- **The CHI paper.** Only the abstract and summaries of the CHI 2021 paper were read.
- **Tested on a real library.** The counting method in [sizing the work](#sizing-the-work) was tried on a real production library; no figures from it are given here.
- **Evidence notes.** Instances can't override auto layout direction or child order: observed product behaviour, not a documented limitation.
- **Names.** Figma names take `Leading`/`Trailing` (the toolkit's figma-standard rule 21) and token names take `start`/`end`, matching [Spacing tokens by intent](../foundations/spacing-tokens-by-intent.md); an earlier wording here allowed either pair anywhere.
- **The figures** are drawn for this guide; the Arabic label is الإشعارات (Notifications).

---

## Sources

**Primary: specifications and platforms**

- [W3C, Structural markup and right-to-left text](https://www.w3.org/International/questions/qa-html-dir).
- [Microsoft Learn, Mirroring](https://learn.microsoft.com/en-us/globalization/fonts-layout/mirroring).
- [MDN, `margin-inline`](https://developer.mozilla.org/docs/Web/CSS/margin-inline).
- Figma: [Add right-to-left text](https://help.figma.com/hc/en-us/articles/4972283635863-Add-right-to-left-text); [the 2022 launch](https://forum.figma.com/suggest-a-feature-11/launched-add-support-for-rtl-languages-34566); [variables for auto layout direction](https://forum.figma.com/suggest-a-feature-11/feature-request-use-variables-to-control-auto-layout-settings-like-direction-alignment-hug-fill-41822); RTL wrap, [2023](https://forum.figma.com/suggest-a-feature-11/add-auto-layout-wrap-from-right-to-left-7535) and [2025](https://forum.figma.com/suggest-a-feature-11/rtl-support-for-wrap-in-auto-layout-43630); [auto layout and CSS flexbox](https://help.figma.com/hc/en-us/articles/42031586813719-Use-auto-layout-with-CSS-Flexbox-in-mind).

**Primary: design systems**

- Wikimedia Codex: [bidirectionality](https://doc.wikimedia.org/codex/v1.9.0/style-guide/bidirectionality.html), [designing components](https://doc.wikimedia.org/codex/latest/contributing/designing-components.html), [types and constants](https://doc.wikimedia.org/codex/latest/components/types-and-constants.html).

**Primary: user research**

- Goldenberg and Tractinsky, *Towards the Right Direction in BiDirectional User Interfaces*, CHI 2021 ([ACM](https://dl.acm.org/doi/abs/10.1145/3411764.3445461), [arXiv](https://arxiv.org/abs/2101.08070)).

**The toolkit's own pages**

- `knowledge/code/i18n.md`: logical properties and mirroring. `standards/figma-standard.md` rule 21 (position words).

**Vendor descriptions, not verified by a trial**

- [RTL Layout](https://www.rtllayout.com/); [RTL Converter](https://www.figma.com/community/plugin/1648270885436375973/rtl-converter); [RTL Hero](https://www.figma.com/community/plugin/1534631933456309077/rtl-hero), [Aura RTL](https://www.figma.com/community/plugin/1606768950228528655/aura-rtl), [RTLAuto](https://rtlauto.com/), [Design RTL](https://www.figma.com/community/plugin/1578227189613846734/design-rtl).

**Cited but not resolved to a primary source**

- Figma's instance-override limits on direction (observed, not documented).
