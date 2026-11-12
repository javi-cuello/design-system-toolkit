# Right-to-left in a Figma design system

What to build, decide and write down when a product whose library lives in Figma needs Arabic, Hebrew, Farsi or Urdu.

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
- [Arabic type](#arabic-type): how the Arabic typeface is set up
- [Arabic line height](#arabic-line-height): whether Arabic needs more line height
- [Text expansion](#text-expansion): how much longer translated text gets
- [Arabic digits](#arabic-digits): which digits Arabic uses
- [Mixed-language lines](#mixed-language-lines): what happens when languages share a line
- [Developer handoff](#developer-handoff): what developers need from design
- [Review when nothing breaks](#review-when-nothing-breaks): how to review bugs that render perfectly

For a lookup, use the [cheat sheet](#cheat-sheet); [the short version](#the-short-version) is the whole guide in six paragraphs.

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

Nothing in the row was translated into a new design; every part kept its job and swapped its side. The icon is still first and the chevron still last.

That reflection covers the whole screen, not one row. The navigation drawer opens from the right. The back button moves to the top right and points right. Progress bars fill from right to left, and text lines up against the right edge.

Because "left" and "right" swap meaning, designers and developers use two words that don't. **Leading** is the side where reading starts: left in English, right in Arabic. **Trailing** is the side where it ends. The icon in the row is leading in both languages; only its place on screen changed.

**Treat right to left as a mirror image of the layout, not a translation of the text.** Describe sides as leading and trailing from now on, in specs, names and notes, because those are the only side words that stay true in both directions. Almost every decision below is about one of the settings row's three parts.

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

A video player's fast-forward button points right in Cairo and Tel Aviv too, because media controls copy the old tape machines, not the reading direction. [Microsoft's globalisation guidance on mirroring](https://learn.microsoft.com/en-us/globalization/fonts-layout/mirroring) names exactly this example, which suggests someone shipped it wrong.

Clocks still run clockwise. Numbers still read left to right inside Arabic text, so a mirrored phone number is simply a wrong phone number. A mirrored photograph is usually just a wrong photograph, with any writing in it now backwards.

The clearest published list comes from [Wikimedia's Codex guidance on bidirectionality](https://doc.wikimedia.org/codex/v1.9.0/style-guide/bidirectionality.html). Codex is the design system behind Wikipedia, which serves hundreds of languages, so it had to get this right. The table below is its list, side by side.

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

Codex builds that into its icon data. Each icon can say that it flips and then list the languages where it doesn't, with Hebrew and Yiddish as the example for the help icon ([Codex types and constants](https://doc.wikimedia.org/codex/latest/components/types-and-constants.html)). Material is reported to make similar splits, such as progress bars that stay left to right in Hebrew.

So a system with a single right-to-left mode has decided to be slightly wrong in at least one language. That can be fine, as long as someone made the decision.

These rules are convention, not measured preference. The only user study found, [a 2021 survey of 234 people who read right-to-left languages](https://arxiv.org/abs/2101.08070) by Goldenberg and Tractinsky, found their preferences didn't always match the published guidance. It doesn't overturn the list; it makes the list a starting point rather than the final word.

**Start from Codex's list, and write down which languages you actually support ("Arabic and Farsi; Hebrew not yet").** Record each exception you take as a decision with a name and a date, so someone can revisit it when a reader says it feels wrong.

---

## Figma versus code

The code flips it: a built product can mirror the whole interface from one switch, while Figma has no such switch for layout, so the library stays drawn left to right.

Go back to the settings row and its padding, the space between the row's edge and its content. Say it is 16 on the leading side and 12 on the trailing side. In Figma's auto layout panel, that is typed as "left 16, right 12".

A developer can write the same padding in two ways. One says "16 on the left, 12 on the right", exactly what Figma shows. The other says "16 on the leading side, 12 on the trailing side".

The second way uses **logical properties**: spacing named by role rather than by side. When the page is switched to right to left, everything written that way swaps sides by itself.

The switch is a single setting on the page that tells the browser "this page reads right to left". The W3C asks for it to live in the page itself, not in the styling ([W3C, structural markup and right-to-left text](https://www.w3.org/International/questions/qa-html-dir)). For the developer: it is `dir="rtl"`.

Rows in code reverse their order on their own when that switch is on. So with the switch and logical properties together, the settings row mirrors correctly, padding included, with no second design.

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

Variables can't fill the gap the way a dark mode swaps every colour, because what needs to change here isn't a value. A variable can change padding, gaps and sizes per mode, but not a row's direction, its alignment, or whether it hugs or fills. Nor can a designer fix it one instance at a time: an instance can't override its layout direction or the order of its children.

People have asked. A [request to control auto layout direction with variables](https://forum.figma.com/suggest-a-feature-11/feature-request-use-variables-to-control-auto-layout-settings-like-direction-alignment-hug-fill-41822) has been open since June 2025 with no reply from Figma.

Requests for wrapping that runs right to left go back to [2023](https://forum.figma.com/suggest-a-feature-11/add-auto-layout-wrap-from-right-to-left-7535). The workaround posted there, flipping the frame and then each child, mirrors the text and icons along with the order. The large auto layout update of July 2026 made Figma's layout behave more like code's, but didn't touch direction ([Figma, auto layout and CSS flexbox](https://help.figma.com/hc/en-us/articles/42031586813719-Use-auto-layout-with-CSS-Flexbox-in-mind)).

So a "Direction" mode that flips every component, the way a dark mode flips every colour, can't be built today. That isn't a workaround nobody has found; it is a feature Figma doesn't have.

**Plan for a library drawn left to right and a product that mirrors in the browser.** Spend your design effort on the decisions code can't make for you: what flips, what doesn't, and which side each padding belongs to.

---

## One library, not two

A second, mirrored library is almost never needed: keep one library, and build four small things beside it.

A mirrored copy sounds tidy until it has to be maintained. Every new variant, every renamed property and every rebinding has to happen twice, and the second time depends on whoever remembers. Copied libraries drift, and avoiding that drift is the reason modes and variables exist at all.

The tokens don't need a copy either, and they don't need a mode. Most spacing tokens are a scale, `space/12` or `space/16`: they say how much space, not where it goes, and 16 is 16 in both languages.

A mode wouldn't help anyway. A mode swaps one value for another, the way dark mode swaps a colour. Here the value doesn't change; what changes is which side it lands on, and the component's layout and the code decide that, not the token.

Direction gets into tokens only through their names, and usually only in component tokens, the ones tied to one side of one component. Take `button/padding-left: space/16`. In Arabic that 16 should move to the right, but the name still says left, and a developer will apply it to the left. Named by role, `button/padding-leading`, it is true in both directions; code calls the same side `inline-start`. A system with no component tokens has nothing to rename.

The opposite mistake is to say "the code handles it" and build nothing. Code mirrors boxes. It doesn't know that the chevron flips and the fast-forward button doesn't, that the chart stays as it is, or that a 7-character button label is now 12 characters. If nobody writes those decisions down, a developer makes them under deadline.

So instead of a second library, build these four things, in order of value for the time they take:

1. **A short "Right to left" note in each component's description**, saying what mirrors and what doesn't.
2. **An icon list** that marks each icon as mirroring or not, decided when the icon is drawn (see [components that flip cheaply](#components-that-flip-cheaply)).
3. **Right-to-left mockups of the ten or so screens where direction changes a decision**: navigation, forms where people type in more than one language, charts, media.
4. **Real Arabic text in the Figma files**, because translated labels often run far longer than English ("Sign in" is 7 characters, its Arabic 12), and real text shows which buttons and tabs cut them off while that is still cheap to fix (see [text expansion](#text-expansion)).

The note goes in the component's description: the same text Dev Mode shows a developer and an AI tool reads through Figma's MCP server. It isn't a separate annotation or a page of specs. A heading of its own, `Right to left`, lets people find it and lets a check tell that it is there.

Not every component needs one. It earns its place where something mirrors in a way code wouldn't guess, like uneven padding or a directional icon, and where something deliberately doesn't mirror, like playback controls or a chart. An avatar or a spinner, with nothing to reorder, needs none. [Codex lists a note like this](https://doc.wikimedia.org/codex/latest/contributing/designing-components.html) as an optional part of its component specs, so it is a habit worth adopting rather than an industry rule.

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

The answer then is a new variant axis, `Direction`, with two options, `LTR` and `RTL`, on the component sets whose contents reverse. It lives inside the same component set, not in a second file. Every existing variant gets an `RTL` twin: `Size=md, State=Rest` becomes `Size=md, State=Rest, Direction=LTR` and `Size=md, State=Rest, Direction=RTL`, the second drawn mirrored.

A designer working in Arabic then picks `Direction=RTL` in the properties panel, like any other variant. Here is the settings row's component set with the new axis.

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

What it buys is visibility. A missing variant shows inside its own set; a component missing from a twin library shows to nobody. That is why it works best as an authoring rule, so a component added next month ships both directions from its first day.

Nobody has to draw the twins by hand. Several community plugins mirror Figma designs. Most flip a frame on demand, which leaves a detached copy that goes stale.

One, [RTL Layout](https://www.rtllayout.com/), says it works on the source instead: because an instance's layout can't be edited, it mirrors the main component and can add a right-to-left variant to a component set. That is the vendor's description, not a tested result, and a plugin only mirrors boxes too, so its output still needs checking against [the flip list](#the-flip-list).

A product that is Arabic first turns all of this around: it is designed right to left, and English is the adaptation.

Which case a team is in depends on when it first sees a screen in Arabic:

- **Arabic first appears in the built product.** Designers work in English, developers build, and someone reviews the Arabic version in the browser. One library and the four things are enough, because nobody places an Arabic instance on a canvas.
- **Designers draw Arabic screens before any code exists.** Mockups, handoff and sign-off all happen right to left, in Figma. Then the sets whose rows reverse need a `Direction` property, with the `RTL` variants generated by a plugin rather than drawn.
- **Either way, the four things come first.** The `RTL` variants have to follow the same decisions about what flips and what stays, so the notes and the icon list are their source.

The toolkit reads that answer from two lines in the project's settings:

- `rtlLanguages: ["ar"]`: the product ships Arabic. The component audit then checks every component for the habits in [components that flip cheaply](#components-that-flip-cheaply).
- `rtlInFigma: true`: designers draw Arabic screens in Figma. The audit then also asks for a `Direction` variant on every set whose row reverses, and checks each `RTL` variant against its `LTR` twin: parts in reverse order, wide text aligned right.

Decide which case you are in, and write it down where your tools can read it. **If you're not sure, start as the first case: adding a direction property later costs the same as adding it now.** When you do add one, generate the variants on a duplicate of the library first and review them against your notes.

---

## Components that flip cheaply

Four habits make a component cheap to flip: rows in auto layout, uneven padding written down, directional icons behind a swap property, and no left or right in any name.

The code does the flipping, but only for what is built in a way it can flip, and most of that is settled in the components long before anyone writes code. Each habit is cheap now and expensive to retrofit.

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

A focus ring or a hover layer that stretches over the whole component is fine. It covers both sides, so it has no side to get wrong.

### Write uneven padding down

A row with 16 on the leading side and 12 on the trailing side is normal. [Figma versus code](#figma-versus-code) showed how easily that difference lands on the wrong side once it reaches code.

The fix is one line in the component's `Right to left` note: "Padding: 16 leading, 12 trailing". It tells the developer the padding flips with the layout, so they write it the logical way.

Uneven padding doesn't need a `Direction` variant as well. A variant is for something designers place on a canvas; padding is something a developer writes, and the note is where they read it. The one reason for the variant is the earlier one, designers drawing Arabic screens before code, and even then the padding line stays in the note. Here is that choice as a decision.

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

Even with no Arabic mockups ever made in Figma, the swap property is worth having. It costs nothing, and it is how a component offers any choice of icon.

Then each icon needs its flip decision recorded. Codex keeps it as data, not prose: every icon carries three fields, whether it flips in right to left, the languages where it doesn't, and a different icon for a language that needs one.

The icon library can hold the same decision as one line in each icon's description, `Right to left: mirrors` or `Right to left: stays`. Arrows and chevrons usually mirror; play, pause and clocks stay.

In code, the developer then flips every marked icon in one place. The flip follows the direction of whatever surrounds the icon, so an arrow inside a block of English on an Arabic page correctly stays as it is ([toolkit: i18n](https://github.com/javi-cuello/design-system-toolkit/blob/main/knowledge/code/i18n.md#logical-properties-and-mirroring)).

### No sides in names

A layer called `Icon left` becomes false the moment the layout mirrors, because in Arabic it sits on the right. `Icon leading` stays true in both directions. Here is the same button in each language, with both names checked against it.

<svg style="display:block;width:100%;height:auto;margin:2em 0" viewBox="0 0 600 186" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="f9t" font-family="system-ui, -apple-system, sans-serif">
  <title id="f9t">A button with an icon, in English and Arabic. In English the icon is on the left; in Arabic it is on the right. A layer named Icon left is true only in English. A layer named Icon leading is true in both.</title>
  <rect width="600" height="186" rx="12" fill="#f5f6f8"/>
  <text x="30" y="36" font-size="11" fill="#5b6270">English</text>
  <rect x="30" y="46" width="150" height="40" rx="8" fill="#1f4fd8"/>
  <circle cx="52" cy="66" r="7" fill="none" stroke="#fff" stroke-width="2"/>
  <text x="68" y="71" font-size="14" fill="#fff">Search</text>
  <text x="30" y="116" font-size="11" fill="#5b6270">Arabic</text>
  <rect x="30" y="126" width="150" height="40" rx="8" fill="#1f4fd8"/>
  <circle cx="158" cy="146" r="7" fill="none" stroke="#fff" stroke-width="2"/>
  <text x="142" y="151" font-size="14" fill="#fff" text-anchor="end">بحث</text>
  <text x="230" y="60" font-size="13" fill="#15171c">Layer <tspan font-weight="700">Icon left</tspan></text>
  <text x="430" y="60" font-size="13" fill="#1b7f3b">true</text>
  <text x="230" y="80" font-size="13" fill="#15171c">Layer <tspan font-weight="700">Icon leading</tspan></text>
  <text x="430" y="80" font-size="13" fill="#1b7f3b">true</text>
  <text x="230" y="140" font-size="13" fill="#15171c">Layer <tspan font-weight="700">Icon left</tspan></text>
  <text x="430" y="140" font-size="13" fill="#c62828">false: it's on the right</text>
  <text x="230" y="160" font-size="13" fill="#15171c">Layer <tspan font-weight="700">Icon leading</tspan></text>
  <text x="430" y="160" font-size="13" fill="#1b7f3b">true</text>
</svg>

Only the role name survives the mirror.

Names matter most where they leave Figma: property names, variant values and icon names. Those travel into the product's code and into Code Connect, where renaming later is expensive. The table pairs each side name with its role name.

| Instead of | Use |
|---|---|
| `button/padding-left`, `button/padding-right` | `button/padding-leading`, `button/padding-trailing` |
| `card/radius-top-left` | `card/radius-top-leading` |
| `icon.chevron-right` | `icon.chevron-forward` or `icon.chevron-next` |
| Layer `Icon left` | `Icon leading` |
| Variant value `Left` | `Leading` |

Code calls leading and trailing `inline-start` and `inline-end`, and either pair works in a name as long as it never says left or right. Scale tokens like `space/16` need no change.

`chevron-forward` is no worse than `chevron-right` in a product that only ships English. Renaming now costs nothing; renaming later means a change in every codebase that uses the name.

### Checking all four

Once the project's settings say the product ships Arabic, the toolkit's component audit checks each habit and names the layer and the fix for every finding:

- a row without auto layout: "Select "Actions" and add auto layout";
- a pinned badge: "Set its position to Auto, or note: Badge: pinned to the leading edge";
- a chevron nobody can swap: "Create an instance swap property; name it Icon";
- a side in a name: "Rename it "Icon leading"".

**Treat all four habits as ordinary component quality, whether or not right to left is on your roadmap yet.** Start with names that leave Figma, since those are the ones code will copy.

---

## Sizing the work

Usually less of the library is affected than a guess would say: the count that matters is the components with a row whose parts must reverse, across every variant, and it takes an afternoon.

That line comes from what an instance can and can't change. On an instance, padding, alignment and constraints can be changed; the order of its parts can't. So:

- **a component that only needs its padding swapped** can be handled where it is used, or with a note;
- **a component whose parts must reverse** needs a `Direction` variant, or gets detached, wherever designers draw Arabic screens (see [the Direction variant](#the-direction-variant)).

In practice that means counting every horizontal auto layout frame with two or more layers in it. A read-only script using Figma's plugin API checks a whole library in seconds, and the toolkit's component audit does the count once Arabic is named in the project's settings.

The result is two numbers, laid out like this:

| | Sets | Variants |
|---|---|---|
| Contain a row that must reverse | counted | counted |
| Safe in either direction as drawn | the rest | the rest |

The safe ones are shapes with nothing to reorder: icon-only buttons, avatars, spinners, switches, radio buttons, checkboxes, containers with a single slot. Here is the sort, with an example of each side.

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

**Measure before you estimate, and walk every variant, not the first.** Publish both numbers, and keep the list of what needs flipping as the checklist for anything a plugin generates.

---

## Arabic type

Arabic type comes from a companion typeface, switched in by a variable mode, so the components themselves don't change.

A Latin interface typeface almost never has Arabic letters. When Arabic is typed into a text layer set in one, Figma, like the browser, borrows the letters from another font on the device. The result looks different on every screen, and nobody chose it.

So the first decision is a companion that matches the Latin typeface's weight and feel. Many families come in both scripts:

- Noto Sans and Noto Sans Arabic;
- IBM Plex Sans and IBM Plex Sans Arabic;
- or a single family drawn for both, like the Dubai font.

The weights have to line up too. If the Latin typeface uses Regular, Medium and Semibold, the Arabic one needs a match for each, or the closest it has.

### A typeface mode

A variable mode is the one tool in Figma that swaps a font family everywhere at once. Set it up in four steps:

1. **Make a variable collection** for type, say `Type`, with two modes: `Latin` and `Arabic`.
2. **Add string variables** for what differs: `font/family`, and `font/weight/medium` and so on if the Arabic weights have different names.
3. **Bind your text styles** to them. In each text style, bind the font family (and the weight) to the variables instead of picking a font.
4. **Switch a frame to Arabic.** Select a frame or a page and set the `Type` collection to `Arabic` in its layer panel. Every text layer inside, in every instance, takes the Arabic typeface.

Here is what the collection holds once it is set up.

<svg style="display:block;width:100%;height:auto;margin:2em 0" viewBox="0 0 600 226" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="f10t" font-family="system-ui, -apple-system, sans-serif">
  <title id="f10t">A variable collection called Type, with Latin and Arabic modes. font/family is Noto Sans in Latin and Noto Sans Arabic in Arabic. font/weight/medium is Medium in both. letter-spacing/label is 0.2 in Latin and 0 in Arabic. line-height/body is 24 in Latin and 28 in Arabic.</title>
  <rect width="600" height="226" rx="12" fill="#f5f6f8"/>
  <rect x="20" y="20" width="560" height="186" rx="10" fill="#fff" stroke="#d8dce3"/>
  <text x="36" y="46" font-size="12" font-weight="600" fill="#5b6270">Collection · Type</text>
  <text x="250" y="46" font-size="12" font-weight="700" fill="#15171c">Latin</text>
  <text x="420" y="46" font-size="12" font-weight="700" fill="#1f4fd8">Arabic</text>
  <line x1="36" y1="58" x2="564" y2="58" stroke="#d8dce3"/>
  <text x="36" y="84" font-size="13" fill="#15171c">font/family</text>
  <text x="250" y="84" font-size="13" fill="#15171c">Noto Sans</text>
  <text x="420" y="84" font-size="13" fill="#1f4fd8">Noto Sans Arabic</text>
  <text x="36" y="118" font-size="13" fill="#15171c">font/weight/medium</text>
  <text x="250" y="118" font-size="13" fill="#15171c">Medium</text>
  <text x="420" y="118" font-size="13" fill="#1f4fd8">Medium</text>
  <text x="36" y="152" font-size="13" fill="#15171c">letter-spacing/label</text>
  <text x="250" y="152" font-size="13" fill="#15171c">0.2</text>
  <text x="420" y="152" font-size="13" fill="#1f4fd8">0</text>
  <text x="36" y="186" font-size="13" fill="#15171c">line-height/body</text>
  <text x="250" y="186" font-size="13" fill="#15171c">24</text>
  <text x="420" y="186" font-size="13" fill="#1f4fd8">28, only if it reads tight</text>
</svg>

Family and weight change by mode; the letter spacing and line height rows are the ones the next paragraphs explain. Sizes stay out of the collection: `font/size/body` is the same number in both scripts, so it needs no mode.

Anyone who opens an Arabic frame needs the Arabic typeface available, either installed or one of Figma's Google Fonts, or Figma shows a missing-font warning.

### Other Arabic mode changes

A few type settings that suit Latin damage Arabic:

- **Letter spacing.** Arabic letters join up, and extra spacing pulls the joins apart, so the Arabic mode sets it to 0, even for labels tracked out in English.
- **Uppercase and italic.** Arabic has neither, and a mode can't switch them off. Where a label style sets capitals, the component's note says the capitals are for Latin only, so the developer doesn't apply them to Arabic.
- **Line height.** Only if Arabic reads tight; [Arabic line height](#arabic-line-height) takes that question on its own.

### No RTL variant for type

The typeface comes from the variable, not from the component:

- the text layer inside the button uses a text style;
- the text style's font family is bound to `font/family`;
- the frame's mode decides which typeface that is.

Here is one Button placed in two frames.

<svg style="display:block;width:100%;height:auto;margin:2em 0" xmlns="http://www.w3.org/2000/svg" role="img" font-family="system-ui, -apple-system, sans-serif" viewBox="0 0 600 200" aria-labelledby="f18t">
  <title id="f18t">One Button component, placed twice. In a frame set to the Latin mode its label is set in a Latin typeface; in a frame set to the Arabic mode, the same instance shows its Arabic label in the Arabic typeface. The component has no RTL variant; the frame's mode chose the typeface.</title>
  <rect width="600" height="200" rx="12" fill="#f5f6f8"/>
  <rect x="30" y="24" width="250" height="130" rx="10" fill="#fff" stroke="#d8dce3"/>
  <text x="46" y="48" font-size="11" font-weight="600" fill="#5b6270">Frame · Type: Latin</text>
  <rect x="80" y="76" width="150" height="44" rx="8" fill="#1f4fd8"/>
  <text x="155" y="104" font-size="15" fill="#fff" text-anchor="middle" font-family="Georgia, serif">Sign in</text>
  <rect x="320" y="24" width="250" height="130" rx="10" fill="#fff" stroke="#1f4fd8"/>
  <text x="554" y="48" font-size="11" font-weight="600" fill="#1f4fd8" text-anchor="end">Frame · Type: Arabic</text>
  <rect x="370" y="76" width="150" height="44" rx="8" fill="#1f4fd8"/>
  <text x="445" y="104" font-size="15" fill="#fff" text-anchor="middle">تسجيل الدخول</text>
  <text x="300" y="182" font-size="12" fill="#5b6270" text-anchor="middle">Same Button, no RTL variant: the frame's mode picks the typeface</text>
</svg>

Nothing on the component changed; the frame chose the typeface. Text length doesn't need a variant either, since a button that hugs its content grows to fit the Arabic label. The only thing that ever needs a `Direction` variant is the order of a row's parts, and only where designers draw Arabic screens in Figma.

### Text alignment

In Figma a text layer's alignment is a fixed side, left or right, and no mode or variable changes it. In code it does: the developer writes it as start, and it flips to the right in Arabic on its own. Whether that matters depends on the text box:

- **a label that hugs its text**, like a button label, has no spare room, so its alignment shows nothing;
- **a text box wider than its text**, like a paragraph filling a card, shows its alignment, so the component's note says "Text: aligned to the leading side" and the developer writes it as start.

Here is a paragraph that fills a card, three ways, with a hugging label beneath.

<svg style="display:block;width:100%;height:auto;margin:2em 0" xmlns="http://www.w3.org/2000/svg" role="img" font-family="system-ui, -apple-system, sans-serif" viewBox="0 0 600 220" aria-labelledby="f19t">
  <title id="f19t">A paragraph that fills a card, three ways. English, aligned left: correct. Arabic, still aligned left as drawn: the lines start on the left and end ragged towards the right, the wrong way round. Arabic, aligned right on the instance: correct. Beneath, a button label that hugs its text looks the same whatever its alignment.</title>
  <rect width="600" height="220" rx="12" fill="#f5f6f8"/>
  <text x="30" y="34" font-size="12" font-weight="700" fill="#15171c">English, aligned left</text>
  <text x="220" y="34" font-size="12" font-weight="700" fill="#c62828">Arabic, still left</text>
  <text x="410" y="34" font-size="12" font-weight="700" fill="#1b7f3b">Arabic, aligned right</text>
  <rect x="30" y="46" width="170" height="80" rx="8" fill="#fff" stroke="#d8dce3"/>
  <text x="42" y="70" font-size="12" fill="#15171c" text-anchor="start">You can change your</text><text x="42" y="88" font-size="12" fill="#15171c" text-anchor="start">notification settings</text><text x="42" y="106" font-size="12" fill="#15171c" text-anchor="start">at any time.</text>
  <rect x="220" y="46" width="170" height="80" rx="8" fill="#fff" stroke="#c62828"/>
  <text x="232" y="70" font-size="12" fill="#15171c" text-anchor="start">يمكنك تغيير إعدادات</text><text x="232" y="88" font-size="12" fill="#15171c" text-anchor="start">الإشعارات في أي وقت</text><text x="232" y="106" font-size="12" fill="#15171c" text-anchor="start">من صفحة الحساب</text>
  <rect x="410" y="46" width="170" height="80" rx="8" fill="#fff" stroke="#1b7f3b"/>
  <text x="568" y="70" font-size="12" fill="#15171c" text-anchor="end">يمكنك تغيير إعدادات</text><text x="568" y="88" font-size="12" fill="#15171c" text-anchor="end">الإشعارات في أي وقت</text><text x="568" y="106" font-size="12" fill="#15171c" text-anchor="end">من صفحة الحساب</text>
  <text x="30" y="156" font-size="12" font-weight="700" fill="#15171c">A label that hugs its text</text>
  <rect x="30" y="168" width="90" height="34" rx="8" fill="#1f4fd8"/><text x="75" y="190" font-size="13" fill="#fff" text-anchor="middle">Save</text>
  <rect x="134" y="168" width="90" height="34" rx="8" fill="#1f4fd8"/><text x="179" y="190" font-size="13" fill="#fff" text-anchor="middle">حفظ</text>
  <text x="244" y="190" font-size="12" fill="#5b6270">No spare room, so alignment shows nothing</text>
</svg>

The middle card is the one that ships when nobody writes the line: Arabic text starting on the left, ragged towards the right. For a team that draws Arabic screens in Figma, the `Direction=RTL` variant already carries the right alignment, drawn once by whoever maintains the library, so nobody sets it by hand in a mockup.

### Who does all this

That is a lot of decisions, but almost none of them land on the designers using the library. They are made once, by whoever maintains it, and built into the components. Here is the split.

<svg style="display:block;width:100%;height:auto;margin:2em 0" xmlns="http://www.w3.org/2000/svg" role="img" font-family="system-ui, -apple-system, sans-serif" viewBox="0 0 600 236" aria-labelledby="f21t">
  <title id="f21t">Who does what. The library maintainer, once: writes the Right to left notes, binds type and sample content to variables with an Arabic mode, and, only if the team draws Arabic in Figma, adds Direction=RTL variants. A designer making an Arabic mockup: two switches, the frame's mode set to Arabic and Direction set to RTL. A designer working only in English: nothing. A developer: reads the notes.</title>
  <rect width="600" height="236" rx="12" fill="#f5f6f8"/>
  <rect x="20" y="20" width="270" height="196" rx="10" fill="#fff" stroke="#d8dce3"/>
  <text x="36" y="46" font-size="13" font-weight="700" fill="#15171c">Library maintainer, once</text>
  <text x="36" y="74" font-size="12" fill="#15171c">• Right to left notes (the audit</text>
  <text x="48" y="92" font-size="12" fill="#15171c">drafts the lines)</text>
  <text x="36" y="118" font-size="12" fill="#15171c">• Type and sample text bound to</text>
  <text x="48" y="136" font-size="12" fill="#15171c">variables with an Arabic mode</text>
  <text x="36" y="162" font-size="12" fill="#15171c">• Direction=RTL variants, only if</text>
  <text x="48" y="180" font-size="12" fill="#15171c">the team draws Arabic in Figma</text>
  <rect x="310" y="20" width="270" height="118" rx="10" fill="#fff" stroke="#1f4fd8"/>
  <text x="326" y="46" font-size="13" font-weight="700" fill="#1f4fd8">Designer, Arabic mockup</text>
  <text x="326" y="74" font-size="12" fill="#15171c">1. Frame mode: Arabic</text>
  <text x="326" y="98" font-size="12" fill="#15171c">2. Direction: RTL</text>
  <text x="326" y="124" font-size="12" fill="#5b6270">That's all. The rest is built in.</text>
  <rect x="310" y="150" width="130" height="66" rx="10" fill="#fff" stroke="#d8dce3"/>
  <text x="322" y="174" font-size="12" font-weight="700" fill="#15171c">Designer, English</text>
  <text x="322" y="198" font-size="12" fill="#5b6270">Nothing</text>
  <rect x="450" y="150" width="130" height="66" rx="10" fill="#fff" stroke="#d8dce3"/>
  <text x="462" y="174" font-size="12" font-weight="700" fill="#15171c">Developer</text>
  <text x="462" y="198" font-size="12" fill="#5b6270">Reads the notes</text>
</svg>

A designer working in English does nothing different. A designer drawing an Arabic screen flips two switches, and the typeface, the digits, the order and the alignment come with them.

In code the same decisions become two rules. The font stack names both typefaces, or the page picks the family by language, so every Arabic letter gets the Arabic face. And line height is a ratio of the font size, like 1.5, from the tokens, never a fixed pixel number: a pixel line height that suits English cuts off the stacked marks of scripts like Thai or Vietnamese ([toolkit: i18n](https://github.com/javi-cuello/design-system-toolkit/blob/main/knowledge/code/i18n.md#font-coverage)).

**Pick an Arabic companion and switch it with a mode, not with copies of your components.** Set its letter spacing to 0, keep the type scale, and write "capitals for Latin only" into the note of any style that sets them.

---

## Arabic line height

Arabic doesn't automatically need more line height: keep the type scale, and add line height only if real Arabic at body size reads tight in the chosen typeface.

The usual advice says it does. [A typical 2026 article from Voxire](https://voxire.com/blog/arabic-rtl-typography-web-design-2026/), a practitioner's piece, suggests 1.7 to 1.85 times the font size for Arabic body text, against 1.5 to 1.6 for Latin. The reasoning holds as far as it goes: Arabic letters join up, they and the marks above and below them use vertical space Latin doesn't, and Arabic tends to look smaller at the same font size.

Two design systems built Arabic first don't do this. The [UAE's government design system](https://designsystem.gov.ae/guidelines/typography) sets body text in Noto Kufi Arabic at the same sizes as English, with a shared minimum line height of 1.5. [Dubai's design system](https://designsystem.dubai.ae/foundations/typography) uses one typeface, the Dubai font, for both scripts, with identical sizes and line heights at every breakpoint. Here is the same Arabic paragraph at both settings.

<svg style="display:block;width:100%;height:auto;margin:2em 0" xmlns="http://www.w3.org/2000/svg" role="img" font-family="system-ui, -apple-system, sans-serif" viewBox="0 0 600 200" aria-labelledby="f20t">
  <title id="f20t">The same Arabic paragraph at two line heights: 1.5 times the font size on the left, 1.8 times on the right. Whether the tighter one reads as cramped depends on the typeface; judge it on real Arabic, at body size.</title>
  <rect width="600" height="200" rx="12" fill="#f5f6f8"/>
  <text x="30" y="34" font-size="12" font-weight="700" fill="#15171c">Line height 1.5</text>
  <text x="320" y="34" font-size="12" font-weight="700" fill="#15171c">Line height 1.8</text>
  <rect x="30" y="46" width="250" height="120" rx="8" fill="#fff" stroke="#d8dce3"/>
  <text x="266" y="80" font-size="15" fill="#15171c" text-anchor="end">تتيح لك الإعدادات اختيار</text><text x="266" y="102" font-size="15" fill="#15171c" text-anchor="end">الإشعارات التي تصلك</text><text x="266" y="124" font-size="15" fill="#15171c" text-anchor="end">وطريقة وصولها إليك</text>
  <rect x="320" y="46" width="250" height="120" rx="8" fill="#fff" stroke="#d8dce3"/>
  <text x="556" y="80" font-size="15" fill="#15171c" text-anchor="end">تتيح لك الإعدادات اختيار</text><text x="556" y="107" font-size="15" fill="#15171c" text-anchor="end">الإشعارات التي تصلك</text><text x="556" y="134" font-size="15" fill="#15171c" text-anchor="end">وطريقة وصولها إليك</text>
  <text x="300" y="188" font-size="12" fill="#5b6270" text-anchor="middle">Judge it on real Arabic, in the chosen typeface, at body size</text>
</svg>

Whether the left one reads as cramped depends on the face it is set in, which is the point.

The likeliest explanation is that both sides are right, about different typefaces. Noto Kufi Arabic and the Dubai font were drawn for interfaces, with the vertical room already built in, while the general advice comes from typefaces and long-form text where it isn't. If so, the typeface is the real decision and line height follows from it. Nobody has published measurements that settle it either way.

There is a catch in Figma for a library that does need more. A variable can set a text style's line height only in pixels, not as a percentage. So a per-script mode needs one pixel value for every text size: `line-height/body` 24 in Latin and 28 in Arabic, `line-height/heading` 32 and 38, and so on.

**The typeface is the real decision, and line height follows from it.** Set a paragraph of real Arabic at body size in your chosen face before changing anything. If it does read tight and a pixel value per size is more upkeep than it is worth, make a separate set of Arabic text styles with their own percentage line height instead.

---

## Text expansion

Translated text gets longer than most layouts allow, and short labels grow far more than paragraphs, so every text container has to be able to grow.

Here is the case that breaks. "Sign in" is 7 characters, and its Arabic runs to 12 (تسجيل الدخول). A button drawn at a fixed width because "Sign in" looked tidy in it cuts the Arabic off. A button that hugs its content, with a minimum width so short labels don't look cramped, just grows.

<svg style="display:block;width:100%;height:auto;margin:2em 0" viewBox="0 0 600 150" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="f4t" font-family="system-ui, -apple-system, sans-serif">
  <title id="f4t">Three buttons. A fixed-width button fits Sign in. The same fixed width cuts the Arabic label off. A button that hugs its content grows to fit the whole Arabic label.</title>
  <rect width="600" height="150" rx="12" fill="#f5f6f8"/>
  <defs><clipPath id="f4c"><rect x="216" y="56" width="104" height="44" rx="8"/></clipPath></defs>
  <text x="76" y="40" font-size="12" font-weight="600" fill="#5b6270" text-anchor="middle">Fixed width</text>
  <rect x="24" y="56" width="104" height="44" rx="8" fill="#1f4fd8"/>
  <text x="76" y="83" font-size="15" font-weight="600" fill="#fff" text-anchor="middle">Sign in</text>
  <text x="268" y="40" font-size="12" font-weight="600" fill="#c62828" text-anchor="middle">Same width, Arabic</text>
  <g clip-path="url(#f4c)">
    <rect x="216" y="56" width="104" height="44" rx="8" fill="#1f4fd8"/>
    <text x="308" y="83" font-size="15" font-weight="600" fill="#fff" text-anchor="end">تسجيل الدخول</text>
  </g>
  <text x="472" y="40" font-size="12" font-weight="600" fill="#5b6270" text-anchor="middle">Hug, with a minimum width</text>
  <rect x="404" y="56" width="136" height="44" rx="8" fill="#1f4fd8"/>
  <text x="472" y="83" font-size="15" font-weight="600" fill="#fff" text-anchor="middle">تسجيل الدخول</text>
  <text x="300" y="132" font-size="12" fill="#5b6270" text-anchor="middle">7 characters in English, 12 in Arabic</text>
</svg>

The middle button looked perfect for as long as it held English, which is why nobody fixed it.

Translation agencies often say Arabic runs 20 to 30 percent longer than English, though none says how it was measured. The more useful figures come from IBM, quoted by [the W3C on text size in translation](https://www.w3.org/International/articles/article-text-size), and they go by length:

- text up to 10 characters can grow by 200 to 300 percent;
- 11 to 20 characters, by 180 to 200 percent;
- over 70 characters, by about 130 percent.

Those averages cover many languages, not Arabic alone, but they explain the pattern: paragraphs average out, button labels don't. Arabic also doesn't abbreviate the way English does, because shortening a word changes its meaning.

That is why real Arabic belongs in the file. Developers can catch the same problem without a translator: they swap every label for a deliberately longer fake version, about 40 percent longer, and check what overflows ([toolkit: i18n](https://github.com/javi-cuello/design-system-toolkit/blob/main/knowledge/code/i18n.md#text-expansion-and-no-fixed-widths-on-text)).

**Hug content and use minimum widths, never fixed ones.** Let labels wrap to two lines, and paste real Arabic into your components rather than trusting a percentage.

---

## Arabic digits

Arabic uses two digit styles, Eastern Arabic (١٢٣) and Western (123), and which one readers expect depends on the region and the kind of screen, so it is a decision per market.

An order total in an Arabic checkout can be written either way, and each is right somewhere:

- **Morocco, Algeria and Tunisia** lean Western in most contexts.
- **Egypt, the Gulf and the Levant** lean towards Eastern Arabic digits in formal text.
- **Apps and technical screens** lean Western further still, because so much of the software around them isn't translated.

Here is the same total both ways.

<svg style="display:block;width:100%;height:auto;margin:2em 0" xmlns="http://www.w3.org/2000/svg" role="img" font-family="system-ui, -apple-system, sans-serif" viewBox="0 0 600 170" aria-labelledby="f13t">
  <title id="f13t">The same total in an Arabic interface, twice. On the left with Western digits, 1,250, as is usual in Morocco, Algeria and Tunisia and in most apps. On the right with Eastern Arabic digits, ١٬٢٥٠, as is usual in formal text in Egypt, the Gulf and the Levant. In both, the digits run left to right.</title>
  <rect width="600" height="170" rx="12" fill="#f5f6f8"/>
  <text x="30" y="36" font-size="12" font-weight="700" fill="#15171c">Western digits</text>
  <text x="320" y="36" font-size="12" font-weight="700" fill="#15171c">Eastern Arabic digits</text>
  <rect x="30" y="50" width="250" height="56" rx="8" fill="#fff" stroke="#d8dce3"/>
  <text x="264" y="84" font-size="15" fill="#15171c" text-anchor="end">المجموع</text>
  <text x="46" y="85" font-size="18" font-weight="700" fill="#1f4fd8">1,250</text>
  <rect x="320" y="50" width="250" height="56" rx="8" fill="#fff" stroke="#d8dce3"/>
  <text x="554" y="84" font-size="15" fill="#15171c" text-anchor="end">المجموع</text>
  <text x="336" y="85" font-size="18" font-weight="700" fill="#1f4fd8">١٬٢٥٠</text>
  <text x="30" y="132" font-size="12" fill="#5b6270">Maghreb, most apps and technical screens</text>
  <text x="320" y="132" font-size="12" fill="#5b6270">Formal text in Egypt, the Gulf, the Levant</text>
  <text x="300" y="156" font-size="12" fill="#5b6270" text-anchor="middle">Either way, a number's digits run left to right</text>
</svg>

The digits differ; their order doesn't. In both, a number runs left to right.

Figma doesn't convert digits. It shows exactly the characters typed, so `123` stays `123` in an Arabic frame. The digit style is a decision written down and then typed, not a setting switched on.

The components don't change. A badge with a count, a price tag, a date picker: each shows whatever text it is given, in either style.

For a mixed audience, a setting people can change is safer than a guess. Otherwise, pick one style and use it everywhere, in four steps:

1. **Decide once, per market,** and write it in your design system's guidelines: "Arabic screens use Western digits", or "Eastern Arabic digits". If people can choose, say which is the default.
2. **Type real numbers in the Arabic mockups,** in that style. Prices, dates and counters are what people read first, so the wrong digits look wrong to an Arabic reader at once.
3. **Keep sample numbers in string variables** if you switch mockups by mode, as with the type collection. A `Content` collection with English and Arabic modes, bound to the text layers, swaps the label and its digits together.
4. **Check that the Arabic typeface has Eastern digits** before choosing that style. Most Arabic interface typefaces do.

Here is that `Content` collection.

<svg style="display:block;width:100%;height:auto;margin:2em 0" viewBox="0 0 600 170" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="f16t" font-family="system-ui, -apple-system, sans-serif">
  <title id="f16t">A variable collection called Content, with English and Arabic modes, holding sample text for mockups. content/total is 1,250 in English and ١٬٢٥٠ in Arabic. content/date is 4 Nov 2026 in English and ٤ نوفمبر ٢٠٢٦ in Arabic. A text layer bound to one of them shows the right digits when its frame switches mode.</title>
  <rect width="600" height="170" rx="12" fill="#f5f6f8"/>
  <rect x="20" y="20" width="560" height="130" rx="10" fill="#fff" stroke="#d8dce3"/>
  <text x="36" y="46" font-size="12" font-weight="600" fill="#5b6270">Collection · Content</text>
  <text x="250" y="46" font-size="12" font-weight="700" fill="#15171c">English</text>
  <text x="420" y="46" font-size="12" font-weight="700" fill="#1f4fd8">Arabic</text>
  <line x1="36" y1="58" x2="564" y2="58" stroke="#d8dce3"/>
  <text x="36" y="86" font-size="13" fill="#15171c">content/total</text>
  <text x="250" y="86" font-size="13" fill="#15171c">1,250</text>
  <text x="420" y="86" font-size="13" fill="#1f4fd8">١٬٢٥٠</text>
  <text x="36" y="124" font-size="13" fill="#15171c">content/date</text>
  <text x="250" y="124" font-size="13" fill="#15171c">4 Nov 2026</text>
  <text x="564" y="124" font-size="13" fill="#1f4fd8" text-anchor="end">٤ نوفمبر ٢٠٢٦</text>
</svg>

A text layer bound to `content/total` shows the right digits as soon as its frame switches to the Arabic mode.

**Decide the digit style per market, write it down, and type it into your mockups.** For the developer: the digit style is a setting on the language, never hard-coded, and every number goes through the platform's own number formatting rather than being assembled by hand ([toolkit: i18n](https://github.com/javi-cuello/design-system-toolkit/blob/main/knowledge/code/i18n.md#numbers-dates-plurals-and-lists)).

---

## Mixed-language lines

When languages share a line, each piece keeps the direction it was written in, and the surprises come where they meet: punctuation lands at the wrong end, and text glued from fragments reads in the wrong order.

Arabic interface text often carries pieces that aren't Arabic: a number, a product name, a web address, someone's name in English. None of that needs a change to the components. It needs a few decisions written down, and the right text in the mockups.

### Always left to right

Whichever digit style is chosen, the digits inside a number run left to right: one thousand two hundred and fifty is `1,250`, never `052,1`.

The same goes for whole pieces of text that only make sense one way: phone numbers, web addresses, email addresses, postal codes, card numbers and codes. They sit inside an Arabic layout, but they read left to right.

In Figma, typed as they are, they display correctly. Where a component holds one, like a phone number field, its `Right to left` note says "Phone number: stays left to right". The developer then sets that field's direction, so the number isn't rearranged as someone types it.

### Why punctuation moves

When English and Arabic share a line, a standard set of rules from Unicode, the body that defines how text is stored, decides how the pieces are arranged ([Unicode, UAX #9](https://www.unicode.org/reports/tr9/)). Letters have a direction. Punctuation and spaces don't, so they take the direction of the text around them, and at the end of a phrase that is the direction of the whole interface.

So an English phrase ending in an exclamation mark, inside an Arabic interface, shows its mark at the wrong end. Here it is as typed, as shown, and isolated.

<svg style="display:block;width:100%;height:auto;margin:2em 0" viewBox="0 0 600 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="f17t" font-family="system-ui, -apple-system, sans-serif">
  <title id="f17t">An English phrase, Ship it!, inside an Arabic interface. As typed, the exclamation mark comes last. As shown, it jumps to the left end, reading !Ship it, because the mark has no direction of its own and takes the Arabic direction of the interface. Isolated, the phrase keeps its own direction and shows Ship it! as typed.</title>
  <rect width="600" height="160" rx="12" fill="#f5f6f8"/>
  <text x="30" y="36" font-size="12" font-weight="700" fill="#15171c">As typed</text>
  <text x="220" y="36" font-size="12" font-weight="700" fill="#c62828">In an Arabic interface</text>
  <text x="420" y="36" font-size="12" font-weight="700" fill="#1b7f3b">Isolated</text>
  <rect x="30" y="50" width="160" height="44" rx="8" fill="#fff" stroke="#d8dce3"/>
  <text x="110" y="78" font-size="16" fill="#15171c" text-anchor="middle">Ship it!</text>
  <rect x="220" y="50" width="170" height="44" rx="8" fill="#fff" stroke="#c62828"/>
  <text x="374" y="78" font-size="16" fill="#15171c" text-anchor="end"><tspan fill="#c62828" font-weight="700">!</tspan>Ship it</text>
  <rect x="420" y="50" width="160" height="44" rx="8" fill="#fff" stroke="#1b7f3b"/>
  <text x="564" y="78" font-size="16" fill="#15171c" text-anchor="end">Ship it!</text>
  <text x="220" y="116" font-size="11" fill="#c62828">The mark takes the page's direction</text>
  <text x="420" y="116" font-size="11" fill="#1b7f3b">The phrase keeps its own</text>
  <text x="300" y="144" font-size="12" fill="#5b6270" text-anchor="middle">Same characters, same order in the file; only the display differs</text>
</svg>

The characters and their order in the file are identical in all three; only the display differs.

It looks like a bug, but it is the rules working as written. Brackets got a rule of their own for the same reason, after the plain rules kept pairing them wrong ([Unicode blog, PRI 231](https://blog.unicode.org/2012/06/pri-231-bidi-parenthesis-algorithm.html)).

Figma follows the same rules, so an Arabic mockup with real mixed text shows these cases before code does. That is one more reason for real Arabic in the files.

### One piece per sentence

A sentence with a changing part, like "Sara invited you", is one piece of text with a gap, `{name} invited you`, never two pieces placed side by side. There are two reasons. How the rules arrange a line depends on the whole sentence, so pieces arranged separately go wrong. And word order differs between languages, so a translator has to be able to move the gap.

In Figma that means one text layer for the sentence, not a name layer beside a text layer in an auto layout row. The row would reverse in Arabic, and the sentence would read in the wrong order.

### Marking user text

Some text comes from somewhere else and could run in either direction: a person's name, a search term, a product title. An English name inside an Arabic sentence, or the other way round, can scramble the punctuation around it.

Developers can isolate that text, so it keeps its own direction and can't disturb the sentence. But they need to know which text it is, and only design knows. Text the team writes, like a button label or a heading, needs no mark, because it is always in the interface's language. Here are both ways to build the invitation sentence.

<svg style="display:block;width:100%;height:auto;margin:2em 0" xmlns="http://www.w3.org/2000/svg" role="img" font-family="system-ui, -apple-system, sans-serif" viewBox="0 0 600 220" aria-labelledby="f14t">
  <title id="f14t">Two ways to build the sentence Sara invited you. Glued fragments: a name piece and a text piece placed side by side, so their order is fixed and a translation cannot move the name. One sentence with a gap: the text {name} invited you, which a translator can reorder, with the name inserted into an isolated slot so it cannot scramble the sentence around it.</title>
  <rect width="600" height="220" rx="12" fill="#f5f6f8"/>
  <text x="30" y="36" font-size="13" font-weight="700" fill="#c62828">Glued fragments</text>
  <rect x="30" y="52" width="70" height="30" rx="6" fill="#fff" stroke="#d8dce3"/><text x="65.0" y="72" font-size="12" fill="#15171c" text-anchor="middle">Sara</text><rect x="106" y="52" width="120" height="30" rx="6" fill="#fff" stroke="#d8dce3"/><text x="166.0" y="72" font-size="12" fill="#15171c" text-anchor="middle">invited you</text>
  <text x="30" y="106" font-size="12" fill="#5b6270">Two pieces in a fixed order.</text>
  <text x="30" y="126" font-size="12" fill="#5b6270">A language that puts the name last</text>
  <text x="30" y="144" font-size="12" fill="#5b6270">can't, and the punctuation goes astray.</text>
  <text x="320" y="36" font-size="13" font-weight="700" fill="#1b7f3b">One sentence with a gap</text>
  <rect x="320" y="52" width="200" height="30" rx="6" fill="#fff" stroke="#d8dce3"/>
  <rect x="328" y="57" width="62" height="20" rx="4" fill="#eef2fd" stroke="#1f4fd8" stroke-dasharray="3 3"/>
  <text x="359" y="71" font-size="12" fill="#1f4fd8" text-anchor="middle">{name}</text>
  <text x="398" y="72" font-size="12" fill="#15171c">invited you</text>
  <text x="320" y="106" font-size="12" fill="#5b6270">The translator moves the gap where</text>
  <text x="320" y="126" font-size="12" fill="#5b6270">the language needs it. The dashed slot</text>
  <text x="320" y="144" font-size="12" fill="#5b6270">is marked "either direction" in the spec.</text>
  <text x="300" y="196" font-size="12" fill="#5b6270" text-anchor="middle">Mark text from users (names, search terms, titles) as either direction</text>
</svg>

The glued version fixes the order for every language. The version with a gap lets the translator move it, and the dashed slot is the text to mark.

**Write each sentence as one text layer with gaps, and mark every piece of text that comes from users as "either direction".** Mark it in two places:

1. **In the component, for text people type or the product fills in.** Find the text property that holds it, like `Name` on an avatar row, `Title` on a product card or `Value` on a search field, and add one line per property to the component's `Right to left` note: "Name: either direction". It sits beside the padding and alignment lines, in the description Dev Mode shows.
2. **In a mockup, for a gap inside a sentence.** Where a screen shows "Sara invited you", select that text layer and add a Dev Mode annotation: "{name}: either direction". Annotations stay attached to the layer, so the developer sees it on the exact text.

Keep numbers, addresses and codes left to right, and test with real mixed content. For the developer: that is `dir="auto"` or `<bdi>` around the inserted text, never invisible Unicode control characters typed into the strings ([W3C, inline markup and bidirectional text](https://www.w3.org/International/articles/inline-bidi-markup/); [toolkit: i18n](https://github.com/javi-cuello/design-system-toolkit/blob/main/knowledge/code/i18n.md#bidirectional-text)).

---

## Developer handoff

Developers need the decisions from design, not a mirrored copy of the Figma file: they can flip the layout themselves, but they can't work out on their own what should and shouldn't flip.

Flipping the boxes is the mechanical part. [Bootstrap](https://getbootstrap.com/docs/5.3/getting-started/rtl/), a widely used code framework, renamed its spacing classes from "left" and "right" to "start" and "end" and now produces its right-to-left version automatically, instead of maintaining a second one.

Ant Design's history shows where the real work is. Its direction switch arrived in late 2019 covering six components ([#18006](https://github.com/ant-design/ant-design/pull/18006)); a second change extended it to more than 40 ([#19380](https://github.com/ant-design/ant-design/pull/19380)); and [its documentation](https://ant.design/components/config-provider/) still says the half-star in its rating component doesn't work right to left. Adding the switch took a day. Checking every component against it was the project.

What developers can't decide alone is the judgement: that the chart doesn't mirror, that the help icon mirrors in Urdu but not in Hebrew, that a particular illustration reversed would be offensive. The engineering is mostly mechanical; the design is mostly judgement.

There is a newer wrinkle. A lot of component code now starts from Figma itself, through Dev Mode or an AI agent reading the file through Figma's MCP server, the connection that lets AI tools read Figma files.

That generated code mirrors only partly. Asked for a filter chip with 12 padding on the left and 8 on the right, the MCP server wrote the padding the physical way, as left and right, even though the logical way exists in the same code style. Here is the chip, what was generated, and what the code needs.

<svg style="display:block;width:100%;height:auto;margin:2em 0" xmlns="http://www.w3.org/2000/svg" role="img" font-family="system-ui, -apple-system, sans-serif" viewBox="0 0 600 200" aria-labelledby="f15t">
  <title id="f15t">A filter chip in Figma with 12 padding on the left and 8 on the right. The code Figma's MCP server generated: pl-12 pr-8, left and right, which stay on the same sides in Arabic. What the code needs: ps-12 pe-8, start and end, which swap in Arabic.</title>
  <rect width="600" height="200" rx="12" fill="#f5f6f8"/>
  <text x="30" y="36" font-size="12" font-weight="700" fill="#15171c">In Figma</text>
  <rect x="30" y="52" width="130" height="36" rx="18" fill="#fff" stroke="#d8dce3"/>
  <rect x="30" y="52" width="24" height="36" fill="#1f4fd8" opacity=".15"/>
  <rect x="144" y="52" width="16" height="36" fill="#1f4fd8" opacity=".15"/>
  <text x="96" y="75" font-size="12" fill="#15171c" text-anchor="middle">Remote</text>
  <text x="42" y="108" font-size="11" fill="#1f4fd8" text-anchor="middle">12</text>
  <text x="152" y="108" font-size="11" fill="#1f4fd8" text-anchor="middle">8</text>
  <text x="210" y="36" font-size="12" font-weight="700" fill="#c62828">What the MCP server wrote</text>
  <rect x="210" y="52" width="170" height="36" rx="6" fill="#fff" stroke="#c62828"/>
  <text x="222" y="75" font-size="13" font-family="ui-monospace, Menlo, monospace" fill="#15171c">pl-12 pr-8</text>
  <text x="210" y="108" font-size="11" fill="#c62828">left and right: stays put in Arabic</text>
  <text x="410" y="36" font-size="12" font-weight="700" fill="#1b7f3b">What the code needs</text>
  <rect x="410" y="52" width="170" height="36" rx="6" fill="#fff" stroke="#1b7f3b"/>
  <text x="422" y="75" font-size="13" font-family="ui-monospace, Menlo, monospace" fill="#15171c">ps-12 pe-8</text>
  <text x="410" y="108" font-size="11" fill="#1b7f3b">start and end: swaps in Arabic</text>
  <text x="300" y="160" font-size="12" fill="#5b6270" text-anchor="middle">The row's order mirrored by itself. The padding didn't.</text>
</svg>

The chip's row came out in a form that reverses by itself, so the order mirrors for free. The padding doesn't, and neither would anything positioned absolutely from one side. It is the broken padding row from [Figma versus code](#figma-versus-code), generated automatically, and no setting was found to change it.

**Write the rules down rather than drawing them, ask for a direction switch early, and tell whoever generates code from your files to convert padding to logical properties.** For the developer: in Tailwind that is `ps-` and `pe-` instead of `pl-` and `pr-`, and a lint rule against `pl-`, `pr-` and `padding-left` in component code catches the rest.

---

## Review when nothing breaks

Review it by looking, deliberately, with real text and a native reader, because right-to-left bugs render perfectly.

A mirrored photograph, an upside-down chart, a stranded chevron and the four-pixel padding swap all produce a screen that looks plausible. Nothing shows an error, so nothing tells a reviewer to look.

That makes review the real control, and it works only if people actually see the right-to-left version. A direction switch in the component explorer (Storybook or similar) keeps it one click away. It won't guarantee anyone checks everything, but it means people look.

What they look at matters as much. Mirrored English tests neither length nor mixed-language behaviour, so the test content is real translated text. Bugs cluster where the direction changes, so that content mixes scripts. And only someone who reads the language catches the mirrored photograph, which is the step teams skip.

Some of this can be automated. The toolkit proposes code checks that render each page right to left and look for overflowing text, flag padding and alignment written as left and right in component code, flag invisible control characters in text files, and check that each page declares its language ([toolkit: i18n](https://github.com/javi-cuello/design-system-toolkit/blob/main/knowledge/code/i18n.md)). They are proposals there, not checks that run yet.

**Ask for a direction switch on day one, review with real text and mixed-script content, and get a native reader to look.**

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
| Names | `chevron-forward`, `Icon leading`, `inline-start` | `chevron-right`, `Icon left`, `left` |
| Padding in code | Logical: leading and trailing | Physical: left and right |
| Direction in code | One switch on the page (`dir`) | Direction set in the styling |
| Media controls, clocks | Never mirror | Mirror with everything else |
| Charts, photographs | Mirror only if meaning survives; photos never | Mirror by default |
| Phone numbers, web and email addresses | Always left to right | Follow the paragraph |
| Text from users | Marked in the spec; wrapped by developers | Pasted straight into a sentence |
| Digits | A setting per language, Western by default in apps | Hard-coded either way |
| Sentences | Whole sentences with gaps | Fragments glued together |
| Arabic type | A chosen face, the same scale, measure first | 1.7 copied from a blog |
| Containers | Hug content, minimum widths | Fixed widths sized to English |
| Placeholder text | Real Arabic | Lorem ipsum or English |
| Code generated from Figma | Convert padding to logical; tell the agent | Ship "left 12, right 8" as generated |
| Review | Direction switch plus a native reader | Screenshots |

---

## The short version

Right to left mirrors the whole layout, not just the text. Layout, navigation, arrows and progress flip; media controls, clocks, numbers, photographs and most charts don't. Some rules differ between Arabic and Hebrew, so write down which languages you support, and treat the rules as convention, since the one study of real users found gaps.

In the built product, the code mirrors everything from one switch, as long as spacing is written as leading and trailing rather than left and right. Figma can't do this for layout, so don't plan around a Direction mode. Keep one library, drawn left to right.

Build so the flip is cheap: auto layout, nothing absolutely positioned, swappable directional icons with their flip decision recorded as data, and no "left" or "right" in any name.

Instead of a twin library, write a mirroring note per component, keep an icon list, mock up the screens where direction changes a decision, and put real Arabic in your files. If your designers work right to left before code exists, add a generated direction property to the sets whose children reverse, after counting them across every variant.

Choose the Arabic typeface deliberately and keep your scale until real text says otherwise. Expect short labels to grow most, and let every container grow. Decide the digit style per market, write sentences whole, and mark text from users.

Give developers rules, not mirrored artboards. Code generated from Figma mirrors the order but not the padding, so ask for it to be converted. And get a direction switch in front of reviewers early, because none of these bugs announce themselves. Consensus covers the flip list, logical properties and the direction switch; the four things in place of a twin library, and line height following the typeface, are judgements built on that evidence.

---

## What to re-check later

Researched August 2026, re-verified in September, and re-checked twice in November 2026.

- **What the November passes found.** No 2026 Figma release touched layout direction. The variables-for-direction request had six replies, the latest on 19 May 2026, a September 2025 question asking for a roadmap, and no staff reply. The older 2023 wrapping thread had 28 replies, with posts as recent as June 2026, beside a narrower August 2025 one. Two more mirroring plugins turned up, Design RTL and Make It RTL. Search results show a 2024 support reply in a wrapping thread calling right-to-left wrap "on our radar", the only Figma statement found. Vertical-flow wrap, reported in September 2026, was seen only in commentary, not in Figma's release notes.
- **Figma layout direction.** If either open request ships, [Figma versus code](#figma-versus-code), [one library, not two](#one-library-not-two), [the Direction variant](#the-direction-variant) and [components that flip cheaply](#components-that-flip-cheaply) all change. Check the threads themselves, since a feature can land without its own announcement.
- **The plugins.** The generated direction property rests on vendor descriptions (RTL Layout, RTL Converter, RTL Hero, Aura RTL, RTLAuto, Design RTL; Make It RTL is named in a forum thread but unread). One trial on a duplicate of a real library would settle it.
- **Figma's code output.** The MCP server's physical padding (Tailwind `pl-` and `pr-` rather than `ps-` and `pe-`) was tested on one component, on 4 November 2026. Dev Mode's own code panel and its other output languages are untested; one component with uneven padding would settle each.
- **Arabic line height.** No measurement exists on either side. A team that tests it would hold the best evidence published.
- **Material's per-language exceptions and the CHI paper's details.** Material 3's bidirectionality page renders only with script and couldn't be read, so its splits (question-mark icons, Hebrew progress bars) come from consistent search summaries and aren't confirmed; the archived Material 1 page doesn't carry them. Only the abstract and summaries of the CHI 2021 paper were read, not its per-element results.
- **Unicode.** UAX #9 reached revision 52 with Unicode 18.0 on 1 September 2026. The 18.0 beta lists no significant changes to it, and the rules cited here predate it, but the final revision's Modifications section wasn't read.
- **Tested on a real library.** The counting method in [sizing the work](#sizing-the-work) and the code test in [developer handoff](#developer-handoff) were tried on a real production library; no figures from it are given here.
- **Evidence notes.** Instances can't override auto layout direction or child order: observed product behaviour, not a documented limitation. The 20 to 30 percent Arabic expansion figure is a vendor rule of thumb. The regional digit patterns are drawn from commentary, and an account of a large digital-library project choosing Western digits despite scholars' objections was second-hand and has been left out. Logical properties are still a candidate in the toolkit's code knowledge, used by habit in one project and not yet tested by an incident. Voxire's line-height figures are commentary.
- **Corrections.** A previously cited Finastra right-to-left guide no longer resolves and has been dropped. An earlier version's button example used "Save", whose Arabic (حفظ) is shorter than the English; it now uses "Sign in".
- **The figures** are drawn for this guide; the Arabic labels are الإشعارات (Notifications) and تسجيل الدخول (Sign in).

---

## Sources

**Primary: specifications and platforms**

- [Unicode, UAX #9 Bidirectional Algorithm](https://www.unicode.org/reports/tr9/). Revision 52, Unicode 18.0, 1 September 2026; the [18.0 beta](https://www.unicode.org/versions/beta-18.0.0.html) lists no significant changes, and the neutral and paired-punctuation rules cited here predate it.
- [Unicode blog, PRI 231](https://blog.unicode.org/2012/06/pri-231-bidi-parenthesis-algorithm.html). Why paired punctuation needed its own rule.
- [W3C, Structural markup and right-to-left text](https://www.w3.org/International/questions/qa-html-dir); [Inline markup and bidirectional text](https://www.w3.org/International/articles/inline-bidi-markup/); [Text size in translation](https://www.w3.org/International/articles/article-text-size).
- [Microsoft Learn, Mirroring](https://learn.microsoft.com/en-us/globalization/fonts-layout/mirroring).
- [Apple, Supporting right-to-left languages](https://developer.apple.com/library/archive/documentation/MacOSX/Conceptual/BPInternational/SupportingRight-To-LeftLanguages/SupportingRight-To-LeftLanguages.html) (archived) and [HIG, Right to left](https://developer.apple.com/design/human-interface-guidelines/right-to-left) (renders in script; corroborated by search).
- [MDN, `margin-inline`](https://developer.mozilla.org/docs/Web/CSS/margin-inline).
- Figma: [Add right-to-left text](https://help.figma.com/hc/en-us/articles/4972283635863-Add-right-to-left-text); [the 2022 launch](https://forum.figma.com/suggest-a-feature-11/launched-add-support-for-rtl-languages-34566); [variables for auto layout direction](https://forum.figma.com/suggest-a-feature-11/feature-request-use-variables-to-control-auto-layout-settings-like-direction-alignment-hug-fill-41822); RTL wrap, [2023](https://forum.figma.com/suggest-a-feature-11/add-auto-layout-wrap-from-right-to-left-7535) and [2025](https://forum.figma.com/suggest-a-feature-11/rtl-support-for-wrap-in-auto-layout-43630); [auto layout and CSS flexbox](https://help.figma.com/hc/en-us/articles/42031586813719-Use-auto-layout-with-CSS-Flexbox-in-mind); a probable third request, [auto layout direction as a variable](https://forum.figma.com/t/please-add-auto-layout-direction-as-a-variable/48086), unread.
- Figma MCP server, `get_design_context`: tested directly on a production library's filter chip, 4 November 2026 (no public page documents its CSS property choice).

**Primary: design systems**

- Wikimedia Codex: [bidirectionality](https://doc.wikimedia.org/codex/v1.9.0/style-guide/bidirectionality.html), [designing components](https://doc.wikimedia.org/codex/latest/contributing/designing-components.html), [developing](https://doc.wikimedia.org/codex/latest/using-codex/developing.html) (pages entirely in one direction; mixed content unsupported except special cases), [types and constants](https://doc.wikimedia.org/codex/latest/components/types-and-constants.html), [T300053](https://phabricator.wikimedia.org/T300053).
- [Material 3, Bidirectionality and RTL](https://m3.material.io/foundations/layout/bidirectionality-rtl) (unreadable without script) and [Material 1 archive](https://m1.material.io/usability/bidirectionality.html).
- [UAE Design System 2.0, Typography](https://designsystem.gov.ae/guidelines/typography); [Dubai Design System, Typography](https://designsystem.dubai.ae/foundations/typography).
- [Bootstrap 5.3, RTL](https://getbootstrap.com/docs/5.3/getting-started/rtl/); [Ant Design ConfigProvider](https://ant.design/components/config-provider/), [#18006](https://github.com/ant-design/ant-design/pull/18006), [#19380](https://github.com/ant-design/ant-design/pull/19380).

**Primary: user research**

- Goldenberg and Tractinsky, *Towards the Right Direction in BiDirectional User Interfaces*, CHI 2021 ([ACM](https://dl.acm.org/doi/abs/10.1145/3411764.3445461), [arXiv](https://arxiv.org/abs/2101.08070)). Abstract and summaries read; per-element results not.

**The toolkit's own pages**

- `knowledge/code/i18n.md`: language and direction, logical properties and mirroring (including the MCP code-output case), bidirectional text, numbers and dates, text expansion, font coverage. Logical properties are listed as a candidate in `knowledge/code/candidates.md`.

**Vendor descriptions, not verified by a trial**

- [RTL Layout](https://www.rtllayout.com/) and its [Community listing](https://www.figma.com/community/plugin/1299598792826701614/rtl-layout-mirror-translate-and-adapt-arabic-100-languages-in-figma); [RTL Converter](https://www.figma.com/community/plugin/1648270885436375973/rtl-converter); [RTL Hero](https://www.figma.com/community/plugin/1534631933456309077/rtl-hero), [Aura RTL](https://www.figma.com/community/plugin/1606768950228528655/aura-rtl), [RTLAuto](https://rtlauto.com/), [Design RTL](https://www.figma.com/community/plugin/1578227189613846734/design-rtl); Make It RTL (Flip UI), named in the 2023 wrap thread, unread.

**Commentary**

- [Itiel Maimon, RTL guidelines](https://github.com/ItielMaN/rtl-guidelines); [Voxire, Arabic RTL typography](https://voxire.com/blog/arabic-rtl-typography-web-design-2026/); [Freezil, Arabic typography for non-Arabic designers](https://freezil.com/blog/arabic-typography-guide); [Art Direction Daily, vertical wrap](https://artdirectiondaily.com/issues/2026-09-25-figma-wraps-top-to-bottom.html).

**Cited but not resolved to a primary source**

- The 20 to 30 percent Arabic expansion figure (vendor rule of thumb); Figma's instance-override limits on direction (observed, not documented).
