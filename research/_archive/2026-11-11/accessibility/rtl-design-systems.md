# Right-to-left in a Figma design system

What to build, decide and write down when a product needs Arabic, Hebrew, Farsi or Urdu and its design system lives in Figma.

Someone has asked for a right-to-left language, and you need to know what that means for your library. You don't need to know how code works to follow this guide; where code matters, it's explained as it comes up.

By the end you'll know what changes on screen, what should flip and what shouldn't, what Figma can and can't do about it, how much of your library is affected, and what to hand developers so the product comes out right.

---

## What this answers

The questions tend to arrive in this order:

- What actually changes when an interface reads right to left?
- What should flip, and what should stay put?
- Who does the flipping: Figma, or the code?
- Do you need a second, mirrored library?
- How do you build components so the flip is cheap?
- How much of your library is affected?
- How do you set up Arabic type, does it need bigger text, and how much longer does translated text get?
- What about numbers and sentences that mix languages?
- What do developers need, and how do you review the result?

If you only have a minute, section 12 is the cheat sheet and section 13 is the short version.

---

## 1. What actually changes when an interface reads right to left?

The whole layout turns around, like a reflection in a mirror. Arabic, Hebrew, Farsi and Urdu are read from right to left, so people scan a screen starting from the right edge, and the interface has to follow their eyes.

Take a row from a settings screen: an icon, a label, and a small arrow (a chevron) that says "tap to go further". In English, you read it from the left: icon first, then the label, then the chevron pointing right, towards where you're going.

In Arabic, the reader starts on the right, so the icon and label move to the right edge, and the chevron moves to the left edge and points left, because "forward" in a right-to-left language is to the left.

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

That reflection applies to the whole screen, not just one row. The navigation drawer opens from the right. The back button moves to the top right and points right. Progress bars fill from right to left. Text is aligned to the right edge.

Because "left" and "right" swap meaning, it's useful to have words that don't. Designers and developers say **leading** for the side where reading starts (left in English, right in Arabic) and **trailing** for the side where it ends. The icon in the row above is leading in both languages; only its position on screen changed. You'll see those two words throughout this guide, because they're what lets one design describe both directions.

**Right-to-left isn't a translation of the text; it's a mirror image of the layout. Keep the settings row in mind, because almost every decision in this guide is about one of its three parts.**

---

## 2. What should flip, and what should stay put?

Most things flip: layout, navigation, arrows, and anything that shows progress. But some things must never flip, and those are the ones that ship wrong.

The chevron in the settings row flips because it means "forward", and forward changed direction. The trouble starts with things that look directional but don't follow reading direction at all.

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

Take a video player. Its fast-forward button points right in Cairo and Tel Aviv too, because media controls copy the old tape machines, not the reading direction. Microsoft's globalisation guidance calls out exactly this example, which suggests someone shipped it wrong ([Microsoft Learn](https://learn.microsoft.com/en-us/globalization/fonts-layout/mirroring)).

Clocks still run clockwise. Numbers still read left to right inside Arabic text, so a mirrored phone number is simply a wrong phone number. And a mirrored photograph is usually just a wrong photograph, with any writing in it now backwards.

The clearest published list comes from Wikimedia's Codex design system, which had to get this right for the hundreds of languages Wikipedia serves ([Codex](https://doc.wikimedia.org/codex/v1.9.0/style-guide/bidirectionality.html)):

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

There's a further catch: right-to-left isn't one language. Hebrew and Arabic disagree on some details. A help icon with a question mark in it mirrors in Arabic and Farsi, because their question mark is written mirrored, but not in Hebrew, whose question mark isn't.

Codex builds this into its icon data: each icon can say it flips, and then list the languages where it doesn't, with Hebrew and Yiddish as the example for the help icon ([Codex types](https://doc.wikimedia.org/codex/latest/components/types-and-constants.html)). Material is reported to make similar splits, such as progress bars that stay left to right in Hebrew.

So if your system has a single right-to-left mode, it has decided to be slightly wrong in at least one language. That can be fine, as long as someone decided it.

One more thing to hold lightly: these rules are convention, not measured preference. The only user study found, a 2021 survey of 234 people who read right-to-left languages, found their preferences didn't always match the published guidance ([Goldenberg and Tractinsky, CHI 2021](https://arxiv.org/abs/2101.08070)). It doesn't overturn the list. It's a reason to treat the list as the best starting point rather than the final word.

**Start from Codex's list, write down which languages you actually support ("Arabic and Farsi; Hebrew not yet"), and record each exception as a decision someone can revisit.**

---

## 3. Who does the flipping: Figma, or the code?

The code does. In a built product, the whole interface can mirror from one switch. Figma has no such switch for layout, so your library stays drawn left to right.

Here's how the code side works, in design terms. Think about the padding in the settings row, the space between the row's edge and its content. Say it's 16 on the leading side and 12 on the trailing side. In Figma you'd type those into auto layout as "left 16, right 12".

A developer can write the same thing in two ways. One way says "16 on the left, 12 on the right", which is exactly what Figma shows. The other says "16 on the leading side, 12 on the trailing side".

That second way is called using **logical properties**, and it's the important one: when the page is switched to right-to-left, everything written that way swaps sides automatically.

The switch itself is a single setting on the page that tells the browser "this page reads right to left" (developers know it as `dir="rtl"`), and the W3C asks for that setting to live in the page itself, not in the styling ([W3C](https://www.w3.org/International/questions/qa-html-dir)).

Rows in code also reverse their order by themselves when the switch is on. So with the switch and logical properties together, the settings row mirrors correctly, padding included, with no second design.

If the developer used "left" and "right" instead, the order still reverses but the padding doesn't. The 16 stays on the left, which in Arabic is now the trailing side:

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

Four pixels is easy to miss. The chevron pointing the wrong way gets caught in review; the padding can ship like that for years.

Now Figma. It has half of this. Since 2022 it handles right-to-left text well: you can type Arabic, Hebrew, Farsi or Urdu, and Figma works out which way each paragraph runs, even when a line mixes Arabic with an English product name ([Figma help](https://help.figma.com/hc/en-us/articles/4972283635863-Add-right-to-left-text)).

What it doesn't have is right-to-left layout. An auto layout frame only knows "left to right"; it has no idea of leading or trailing, so there's nothing for a switch to flip. Its padding fields are left and right, and text alignment is left, centre or right, with no "leading".

You might hope variables could fill the gap, the way a dark mode swaps every colour at once. They can't, because what needs to change isn't a number. A variable can change padding, gaps and sizes per mode, but not the direction of a row, its alignment, or whether it hugs or fills. Nor can a designer fix it one instance at a time: an instance can't override its layout direction or the order of its children.

People have asked Figma for this. A request to control auto layout direction with variables has been open since June 2025 with no reply from Figma ([forum](https://forum.figma.com/suggest-a-feature-11/feature-request-use-variables-to-control-auto-layout-settings-like-direction-alignment-hug-fill-41822)).

Requests for wrapping that runs right to left go back to 2023, and the workaround people post there, flipping the frame and then each child, mirrors the text and icons along with the order ([forum](https://forum.figma.com/suggest-a-feature-11/add-auto-layout-wrap-from-right-to-left-7535)). The big auto layout update in July 2026 made Figma's layout behave more like code's, but it didn't touch direction ([Figma help](https://help.figma.com/hc/en-us/articles/42031586813719-Use-auto-layout-with-CSS-Flexbox-in-mind)).

So a "Direction" mode that flips every component, the way dark mode flips every colour, can't be built today. That isn't a workaround you've failed to find. It's a feature Figma doesn't have.

**Plan for a library drawn left to right and a product that mirrors in the browser, and spend your design effort on the decisions code can't make for you: what flips, what doesn't, and how padding is meant to behave.**

---

## 4. Do you need a second, mirrored library?

Almost certainly not. Keep one library, and build four small things alongside it instead.

A mirrored copy sounds tidy, but think about what it costs over time. Every new variant, every renamed property, every rebinding has to happen twice, and the second time depends on whoever remembers. Copied libraries drift. Avoiding that drift is the reason modes and variables exist in the first place.

Your tokens don't need a copy either, and they don't need a mode. Most spacing tokens are a scale: `space/12`, `space/16`. They say how much space, not where it goes, and 16 is 16 in both languages. Keep them exactly as they are.

A mode wouldn't help anyway. A mode swaps one value for another, the way dark mode swaps a colour. Here the value doesn't change. What changes is which side it's on, and that's decided by the component's layout and the code, not by the token.

Direction only gets into tokens through their names, and usually only in component tokens, the ones tied to one side of one component: `button/padding-left: space/16`. In Arabic that 16 should move to the right, but the name still says left, and a developer will apply it to the left. Name the side by role instead, `button/padding-leading` (code calls it `inline-start`), and it's true in both directions. If your system has no component tokens, there's nothing to rename.

The opposite mistake is to say "the code handles it" and build nothing. Code mirrors boxes. It doesn't know that the chevron should flip and the fast-forward button shouldn't, that the chart stays as it is, or that a 7-letter button label is now 12 letters. If nobody writes those decisions down, a developer makes them under deadline.

So, instead of a second library, build these four things, in order of value for the time they take:

1. **A short "Right to left" note in each component's description**, saying what mirrors and what doesn't (more on this just below).
2. **An icon list** that marks each icon as mirroring or not, decided when the icon is drawn (section 5).
3. **Right-to-left mockups of the ten or so screens where direction changes a decision**: navigation, forms where people type in more than one language, charts, media.
4. **Real Arabic text in your Figma files**, because translated labels are often far longer than English ("Sign in" is 7 characters, its Arabic 12), and real text shows you which buttons and tabs cut them off while it's still cheap to fix (more in section 8).

The note goes in the component's description, the same text Dev Mode shows a developer and an AI tool reads through Figma's MCP server. It isn't a separate annotation or a page of specs. Give it its own heading, `Right to left`, so people can find it and a check can tell it's there.

Not every component needs one. Write it where something mirrors in a way code wouldn't guess, like uneven padding or a directional icon, and where something deliberately doesn't mirror, like playback controls or a chart. An avatar or a spinner, with nothing to reorder, needs none. Codex lists a note like this as an optional part of its component specs, so it's a habit worth adopting rather than an industry rule ([Codex](https://doc.wikimedia.org/codex/latest/contributing/designing-components.html)).

Here's what the note looks like for the settings row, and for a media player where the point is what stays:

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

Three lines is usually enough. What matters is that the decision is written where the developer will read it, before they have to guess.

There's one situation where notes aren't enough: when designers work in right-to-left every day, before any code exists. A note can't be placed on a canvas. They need an instance that actually faces the right way.

Then the answer is a new variant axis, `Direction`, with two options, `LTR` and `RTL`, on the component sets whose contents reverse. It lives inside the same component set, not in a second file. Every variant you have today gets an `RTL` twin: `Size=md, State=Rest` becomes `Size=md, State=Rest, Direction=LTR` and `Size=md, State=Rest, Direction=RTL`, the second drawn mirrored. A designer working in Arabic picks `Direction=RTL` in the properties panel, like any other variant.

Here's what that looks like for the settings row:

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

It isn't free. Every set whose row reverses gains a second copy of every variant. If half your sets have such a row, your variant count grows by half. Section 6 shows how to count them.

But a missing variant is visible inside its own set, while a component missing from a twin library is visible to nobody. Make it an authoring rule, so a component added next month ships both directions from day one.

You don't have to build that property by hand. Several community plugins mirror Figma designs. Most flip a frame on demand, which gives you a detached copy that goes stale.

One, RTL Layout, says it works on the source instead: because an instance's layout can't be edited, it mirrors the main component and can add a right-to-left variant to a component set ([RTL Layout](https://www.rtllayout.com/)). That's the vendor's description, so try it on a duplicate of your library first, and check what it produces against section 2, because a plugin only mirrors boxes too.

If your product is Arabic-first, turn all of this around: design right to left, and treat English as the adaptation.

So which one is you? It depends on when your team first sees a screen in Arabic.

- **Your team first sees Arabic in the built product.** Designers work in English, developers build, and someone reviews the Arabic version in the browser. Keep one library and build the four things above. You don't need anything else in Figma, because nobody places an Arabic instance on a canvas.
- **Your designers draw Arabic screens before any code exists.** Mockups, handoff, sign-off: all in right-to-left, in Figma. Then they need instances that actually face the right way. Add a `Direction` property (`LTR`, `RTL`) to the component sets whose rows reverse, and let a plugin generate the `RTL` variants rather than drawing them by hand.
- **Either way, start with the four things.** The direction property doesn't replace them. Its `RTL` variants have to follow the same decisions, what flips and what stays, so the notes and the icon list come first.

Write the answer down where your tools can read it. In the toolkit, it's two lines in the project's settings:

- `rtlLanguages: ["ar"]`: the product ships Arabic. The component audit then checks every component for the habits in section 5.
- `rtlInFigma: true`: your designers draw Arabic screens in Figma. The audit then also asks for a `Direction` variant on every set whose row reverses, and checks each `RTL` variant against its `LTR` twin: parts in reverse order, wide text aligned right.

**If you're not sure which you are, start as the first case. Adding a direction property later costs the same as adding it now.**

---

## 5. How do you build components so the flip is cheap?

The code does the flipping, but only for what's built in a way it can flip. Most of that is decided in your components, long before anyone writes code.

There are four habits worth building. Each one is cheap today and expensive to retrofit, so we'll take them one at a time.

### Put anything with an order in auto layout

Auto layout gives a row an order. Code can reverse an order, the way the settings row reversed in section 1.

A layer placed by hand has no order, only a position. The commonest right-to-left bug in a component library is one of these: a badge positioned absolutely, 8 pixels from the left edge of its card.

In English it looks fine. In Arabic the title moves to the right and the badge stays on the left, the wrong side:

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

The fix is to put the badge in the flow: a vertical auto layout holding the badge, then the title. Now it has a place in an order, not a position on a side.

Sometimes a layer has to stay absolute, like a dot on the corner of an avatar. Then write it in the component's `Right to left` note: "Dot: pinned to the leading edge". The developer then knows to pin it to the start, not the left.

A focus ring or a hover layer that stretches across the whole component is fine. It covers both sides, so there's no side to get wrong.

### Write uneven padding down

A row with 16 on the leading side and 12 on the trailing side is completely normal. Section 3 showed how easily that difference ends up on the wrong side once it reaches code.

The fix is one line in the component's `Right to left` note: "Padding: 16 leading, 12 trailing". That tells the developer the padding flips with the layout, so they write it the logical way.

Does uneven padding need a `Direction` variant as well? No. A variant is for something designers place on a canvas. Padding is something a developer writes, and the note is where they read it.

The only reason to add a `Direction` variant is the one in section 4: your designers draw Arabic screens before any code exists. Then the `RTL` variant carries everything mirrored at once, the order, the icons and the padding, and the padding still goes in the note for the developer.

<svg style="display:block;width:100%;height:auto;margin:2em 0" viewBox="0 0 600 196" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="f7t" font-family="system-ui, -apple-system, sans-serif">
  <title id="f7t">A decision: do your designers draw Arabic screens in Figma before code exists? No: write a Right to left note in the description, and that is all. Yes: write the note, and also add a Direction variant with LTR and RTL options to the sets whose rows reverse.</title>
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

### Make directional icons swappable

First, what code does. In the product, the chevron flips automatically, however it was built in Figma. That's the settings row in section 1. A developer marks the icon as mirroring, and the browser turns it round in Arabic.

So the way you build the chevron matters for one place only: Figma itself, when someone needs an Arabic version on the canvas. A mockup, a handoff, a review.

There, the two builds behave very differently:

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

So you don't need a new variant for a mirrored chevron. You need:

- the chevron as an icon instance, not drawn shapes;
- an `Icon` instance-swap property on the component, so anyone using it can pick another icon;
- both chevrons, left and right, in your icon set.

If nobody ever makes Arabic mockups in Figma, the swap property is still worth having. It costs nothing, and it's how a component offers any icon choice.

Then record, for every icon, whether it flips. Codex keeps that decision as data, not prose. Each icon carries three fields: whether it flips in right-to-left, the languages where it doesn't, and a different icon for a language that needs one.

You can keep the same decision in the icon library itself: one line in each icon's description, `Right to left: mirrors` or `Right to left: stays`. Arrows and chevrons usually mirror; play, pause and clocks stay.

In code, the developer then flips every marked icon in one place. It follows the direction of whatever surrounds the icon, so an arrow inside a block of English on an Arabic page correctly stays as it is ([toolkit: i18n](https://github.com/javi-cuello/design-system-toolkit/blob/main/knowledge/code/i18n.md#logical-properties-and-mirroring)).

### Keep left and right out of every name

A layer called `Icon left` becomes false the moment the layout mirrors. In Arabic it sits on the right. `Icon leading` stays true in both directions:

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

Names matter most where they leave Figma: property names, variant values and icon names. Those travel into the product's code and into Code Connect, where renaming later is expensive:

| Instead of | Use |
|---|---|
| `button/padding-left`, `button/padding-right` | `button/padding-leading`, `button/padding-trailing` |
| `card/radius-top-left` | `card/radius-top-leading` |
| `icon.chevron-right` | `icon.chevron-forward` or `icon.chevron-next` |
| Layer `Icon left` | `Icon leading` |
| Variant value `Left` | `Leading` |

Code calls leading and trailing `inline-start` and `inline-end`. Either pair works in a name, as long as it never says left or right. Your scale tokens, like `space/16`, need no change.

`chevron-forward` is no worse than `chevron-right` in an English-only product. Renaming now costs nothing. Renaming later means a change in every codebase that uses it.

### Checking all four

The toolkit's component audit checks each habit, once the project's settings say the product ships Arabic. For every finding it names the layer and the fix:

- a row without auto layout: "Select "Actions" and add auto layout";
- a pinned badge: "Set its position to Auto, or note: Badge: pinned to the leading edge";
- a chevron nobody can swap: "Create an instance swap property; name it Icon";
- a side in a name: "Rename it "Icon leading"".

**Treat all of this as ordinary component quality, whether or not right-to-left is on your roadmap yet.**

---

## 6. How much of your library is affected?

Usually less than you'd guess, and you can measure it in an afternoon. Count the components that have a row whose parts need to reverse, across every variant.

Why that line? Because of what an instance can and can't change. On an instance you can change padding, alignment and constraints. You can't change the order of its parts.

So:

- **A component that only needs its padding swapped** can be handled where it's used, or with a note.
- **A component whose parts must reverse** needs a `Direction` variant, or gets detached, if your designers draw Arabic screens (section 4).

In practice, that means counting every horizontal auto layout frame with two or more layers in it. A read-only script using Figma's plugin API can check a whole library in seconds. The toolkit's component audit does this count for you once Arabic is named in the project's settings.

You'll end up with two numbers:

| | Sets | Variants |
|---|---|---|
| Contain a row that must reverse | your count | your count |
| Safe in either direction as drawn | the rest | the rest |

The safe ones are shapes with nothing to reorder: icon-only buttons, avatars, spinners, switches, radio buttons, checkboxes, containers with a single slot. They drop out of the estimate before any work starts, which is often what gets the work approved.

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

The count is easy to get wrong in ways that still produce a confident-looking number:

- **Reading only the first variant.** A Button whose first variant has no icon looks safe, until you reach the variant with a leading icon. Walk every variant, or the count comes out low, in the direction nobody questions.
- **Skipping hidden layers.** A hidden leading icon is still part of the row. A boolean property will show it.
- **Counting absolutely positioned layers.** A focus ring stretched over a control isn't part of the order. Count it and an icon-only button lands in the wrong column.

While you count, record a few more things, because together they become your review checklist. The component audit records all four for you, with the line to add to each component's note:

- padding that differs left and right;
- layers pinned to one edge;
- alignment set to the right or the end, like a chat bubble's side, which a scan of padding and corner radius never sees;
- corners rounded on one side only, like the ends of a date range or a speech bubble.

**Measure before you estimate, publish both numbers, and keep the list of what needs flipping as the checklist for anything a plugin generates.**

---

## 7. How do you set up Arabic type?

Your Latin typeface almost certainly can't show Arabic. So the first job is choosing a second typeface, and the second is making Figma switch to it without copying your components.

After that come the smaller questions: spacing, capitals, line height and alignment. We'll go through them in that order.

### Start with a typeface that has Arabic letters

Most Latin interface typefaces have no Arabic letters. Type Arabic into a text layer set in one, and Figma, like the browser, borrows the letters from another font on the device. It looks different on every screen, and nobody chose it.

So pick an Arabic companion that matches your Latin typeface's weight and feel. Many families come in both scripts:

- Noto Sans and Noto Sans Arabic;
- IBM Plex Sans and IBM Plex Sans Arabic;
- or a single family drawn for both, like the Dubai font.

Check the weights before you commit. If your Latin typeface uses Regular, Medium and Semibold, the Arabic one needs a match for each, or the closest one it has.

### Switch the typeface with a variable mode

Yes, change the font family with a mode. It's the one tool in Figma that swaps the typeface everywhere at once.

1. **Make a variable collection** for type, say `Type`, with two modes: `Latin` and `Arabic`.
2. **Add string variables** for what differs: `font/family`, and `font/weight/medium` and so on if the Arabic weights have different names.
3. **Bind your text styles** to them. In each text style, bind the font family (and the weight) to the variables instead of picking a font.
4. **Switch a frame to Arabic.** Select a frame or a page and set the `Type` collection to `Arabic` in its layer panel. Every text layer inside, in every instance, takes the Arabic typeface.

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

Your sizes stay out of this collection. `font/size/body` is the same number in both scripts, so it doesn't need a mode.

Anyone who opens an Arabic frame needs the Arabic typeface available, either installed or one of Figma's Google Fonts. Otherwise Figma shows a missing-font warning.

### What else the Arabic mode changes

A few type settings that suit Latin damage Arabic:

- **Letter spacing.** Arabic letters join up. Extra spacing pulls the joins apart, so set it to 0 in the Arabic mode, even for labels you track out in English.
- **Uppercase and italic.** Arabic has neither, and a mode can't switch them off. If a label style sets capitals, say in the component's note that the capitals are for Latin only, so the developer doesn't apply them to Arabic.
- **Line height.** Only if Arabic reads tight. That's the next question.

### Does Arabic need bigger text, or more line height?

Not automatically. Keep your type scale, and only add line height if real Arabic at body size actually looks tight.

The usual advice says Arabic needs more line height. A typical 2026 article suggests 1.7 to 1.85 times the font size for Arabic body text, against 1.5 to 1.6 for Latin ([Voxire](https://voxire.com/blog/arabic-rtl-typography-web-design-2026/), commentary). The reasoning is sound as far as it goes: Arabic letters join up, they and the marks above and below them use vertical space Latin doesn't, and Arabic tends to look smaller at the same font size.

But two design systems built Arabic-first don't do this. The UAE's government design system uses Noto Kufi Arabic for body text and the same sizes as English, with a shared minimum line height of 1.5 ([UAE](https://designsystem.gov.ae/guidelines/typography)). Dubai's design system uses one typeface, the Dubai font, for both scripts, with identical sizes and line heights at every breakpoint ([Dubai](https://designsystem.dubai.ae/foundations/typography)).

<svg style="display:block;width:100%;height:auto;margin:2em 0" xmlns="http://www.w3.org/2000/svg" role="img" font-family="system-ui, -apple-system, sans-serif" viewBox="0 0 600 200" aria-labelledby="f20t">
  <title id="f20t">The same Arabic paragraph at two line heights: 1.5 times the font size on the left, 1.8 times on the right. Whether the tighter one reads as cramped depends on the typeface; judge it on real Arabic, at body size.</title>
  <rect width="600" height="200" rx="12" fill="#f5f6f8"/>
  <text x="30" y="34" font-size="12" font-weight="700" fill="#15171c">Line height 1.5</text>
  <text x="320" y="34" font-size="12" font-weight="700" fill="#15171c">Line height 1.8</text>
  <rect x="30" y="46" width="250" height="120" rx="8" fill="#fff" stroke="#d8dce3"/>
  <text x="266" y="80" font-size="15" fill="#15171c" text-anchor="end">تتيح لك الإعدادات اختيار</text><text x="266" y="102" font-size="15" fill="#15171c" text-anchor="end">الإشعارات التي تصلك</text><text x="266" y="124" font-size="15" fill="#15171c" text-anchor="end">وطريقة وصولها إليك</text>
  <rect x="320" y="46" width="250" height="120" rx="8" fill="#fff" stroke="#d8dce3"/>
  <text x="556" y="80" font-size="15" fill="#15171c" text-anchor="end">تتيح لك الإعدادات اختيار</text><text x="556" y="107" font-size="15" fill="#15171c" text-anchor="end">الإشعارات التي تصلك</text><text x="556" y="134" font-size="15" fill="#15171c" text-anchor="end">وطريقة وصولها إليك</text>
  <text x="300" y="188" font-size="12" fill="#5b6270" text-anchor="middle">Judge it on real Arabic, in your typeface, at body size</text>
</svg>

Who's right? The likeliest explanation is that both are, about different typefaces. Noto Kufi Arabic and the Dubai font were drawn for interfaces, with the vertical room already built in, while the general advice comes from typefaces and long-form text where it isn't. If that's true, **the typeface is the real decision, and line height follows from it.** Nobody has published measurements that settle it either way.

If Arabic does read tight, there's a catch in Figma. A variable can set a text style's line height only in pixels, not as a percentage. So a per-script mode needs one pixel value for every text size: `line-height/body` is 24 in Latin and 28 in Arabic, `line-height/heading` 32 and 38, and so on. If that's more upkeep than it's worth, make a separate set of Arabic text styles with their own percentage line height instead.

### Does every component with text need an RTL variant?

No. The typeface comes from the variable, not from the component:

- the text layer inside the button uses your text style;
- the text style's font family is bound to `font/family`;
- the frame's mode decides which typeface that is.

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

Text length doesn't need a variant either: a button that hugs its content grows to fit the Arabic label (section 8). The only thing that ever needs a `Direction` variant is the order of a row's parts, and only if you draw Arabic screens in Figma (section 4).

### Does text alignment change?

Not in Figma. A text layer's alignment is a fixed side, left or right, and no mode or variable changes it. In code it does: the developer writes it as start, and it flips to the right in Arabic on its own.

Whether that matters depends on the text box:

- **A label that hugs its text,** like a button label, has no spare room, so its alignment shows nothing. Nothing to do.
- **A text box wider than its text,** like a paragraph filling a card, shows its alignment. The component's note says "Text: aligned to the leading side", so the developer writes it as start.

If your team draws Arabic screens in Figma, the `Direction=RTL` variant from section 4 carries the right alignment already, drawn once by whoever maintains the library. Nobody sets it by hand in a mockup.

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

### Who does all this?

That's a lot of decisions, but almost none of them land on the designers using the library. They're made once, by whoever maintains it, and built into the components:

<svg style="display:block;width:100%;height:auto;margin:2em 0" xmlns="http://www.w3.org/2000/svg" role="img" font-family="system-ui, -apple-system, sans-serif" viewBox="0 0 600 236" aria-labelledby="f21t">
  <title id="f21t">Who does what. The library maintainer, once: writes the Right to left notes, binds type and sample content to variables with an Arabic mode, and, only if the team draws Arabic in Figma, adds Direction=RTL variants. A designer making an Arabic mockup: two switches, the frame's mode set to Arabic and Direction set to RTL. A designer working only in English: nothing. A developer: reads the notes.</title>
  <rect width="600" height="236" rx="12" fill="#f5f6f8"/>
  <rect x="20" y="20" width="270" height="196" rx="10" fill="#fff" stroke="#d8dce3"/>
  <text x="36" y="46" font-size="13" font-weight="700" fill="#15171c">Library maintainer, once</text>
  <text x="36" y="74" font-size="12" fill="#15171c">• Right to left notes (the audit</text>
  <text x="48" y="92" font-size="12" fill="#15171c">writes the lines for you)</text>
  <text x="36" y="118" font-size="12" fill="#15171c">• Type and sample text bound to</text>
  <text x="48" y="136" font-size="12" fill="#15171c">variables with an Arabic mode</text>
  <text x="36" y="162" font-size="12" fill="#15171c">• Direction=RTL variants, only if</text>
  <text x="48" y="180" font-size="12" fill="#15171c">you draw Arabic in Figma</text>
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

So a designer working in English does nothing different. A designer drawing an Arabic screen flips two switches. Everything else, the typeface, the digits, the order, the alignment, comes with them.

### What developers do

In code, the same decisions become two rules. The font stack names both typefaces, or the page picks the family by language, so every Arabic letter gets the Arabic one. And line height is a ratio of the font size, like 1.5, from your tokens, never a fixed pixel number; a fixed pixel line height that suits English cuts off the stacked marks of scripts like Thai or Vietnamese ([toolkit: i18n](https://github.com/javi-cuello/design-system-toolkit/blob/main/knowledge/code/i18n.md#font-coverage)).

**Pick an Arabic companion, switch it with a mode, set letter spacing to 0, keep the scale, and change line height only if real Arabic reads tight.**

---

## 8. How much longer does translated text get?

Longer than you'd plan for, and short labels grow far more than paragraphs. Build every text container to grow.

Translation agencies often say Arabic runs 20 to 30 percent longer than English, though none of them says how they measured it.

The more useful figures come from IBM, quoted by the W3C, and they're by length: text up to 10 characters can grow by 200 to 300 percent, 11 to 20 characters by 180 to 200 percent, and text over 70 characters by about 130 percent ([W3C](https://www.w3.org/International/articles/article-text-size)).

Those averages cover many languages, not Arabic alone, but they explain the pattern: paragraphs average out, button labels don't. Arabic also doesn't abbreviate the way English does, because shortening a word changes its meaning.

Here's what that does to a button. "Sign in" is 7 characters, and its Arabic runs to 12 (تسجيل الدخول). A button drawn at a fixed width because "Sign in" looked tidy in it cuts the Arabic off. A button that hugs its content, with a minimum width so short labels don't look cramped, just grows:

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

A fixed-width button looks perfect for ever with "Sign in" in it, which is exactly why real Arabic belongs in your file. Developers can catch the same problem without a translator: they swap every label for a deliberately longer fake version, about 40 percent longer, and check what overflows ([toolkit: i18n](https://github.com/javi-cuello/design-system-toolkit/blob/main/knowledge/code/i18n.md#text-expansion-and-no-fixed-widths-on-text)).

**Hug content, use minimum widths rather than fixed ones, let labels wrap to two lines, and paste real Arabic into your components.**

---

## 9. What about numbers, punctuation and mixed sentences?

Arabic text often carries pieces that aren't Arabic: numbers, a product name, a web address, someone's name in English. Each kind behaves a little differently, and most of the surprises show up only when they meet.

None of it needs a change to your components. It needs a few decisions written down, and the right text in your mockups. We'll go through digits first, then the things that always run left to right, then punctuation and whole sentences.

### Which digits does Arabic use?

There are two styles. Eastern Arabic digits (١٢٣) and the Western ones you're used to (123). Which one people expect depends on the region and the kind of screen:

- **Morocco, Algeria and Tunisia** lean Western in most contexts.
- **Egypt, the Gulf and the Levant** lean towards Eastern Arabic digits in formal text.
- **Apps and technical screens** lean Western further still, because so much of the software around them isn't translated.

If your audience is mixed, a setting people can change is safer than a guess. Otherwise pick one and use it everywhere.

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

### Digits in Figma

Figma doesn't convert digits. It shows exactly the characters you type, so `123` stays `123` in an Arabic frame. The digit style is a decision you write down and then type, not a setting you switch on:

1. **Decide once, per market,** and write it in your design system's guidelines: "Arabic screens use Western digits", or "Eastern Arabic digits". If people can choose, say which is the default.
2. **Type real numbers in the Arabic mockups,** in that style. Prices, dates and counters are what people read first, so the wrong digits look wrong to an Arabic reader at once.
3. **Keep sample numbers in string variables** if you switch mockups by mode, as in section 7. A `Content` collection with English and Arabic modes, bound to the text layers, swaps the label and its digits together.
4. **Check the Arabic typeface has Eastern digits** before choosing that style. Most Arabic interface typefaces do.

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

Your components don't change. A badge with a count, a price tag, a date picker: each shows whatever text it's given, in either style.

For your developer: the digit style is a setting on the language, never hard-coded, and every number goes through the platform's own number formatting rather than being assembled by hand ([toolkit: i18n](https://github.com/javi-cuello/design-system-toolkit/blob/main/knowledge/code/i18n.md#numbers-dates-plurals-and-lists)).

### What always runs left to right?

Whichever digit style you choose, the digits inside a number still run left to right: one thousand two hundred and fifty is `1,250`, never `052,1`.

The same goes for whole pieces of text that only make sense one way: phone numbers, web addresses, email addresses, postal codes, card numbers and codes. They sit inside an Arabic layout, but they read left to right.

In Figma, type them as they are and they display correctly. Where a component holds one, like a phone number field, add a line to its `Right to left` note: "Phone number: stays left to right". The developer then sets that field's direction, so the number isn't rearranged as someone types it.

### Why does punctuation end up in the wrong place?

When English and Arabic share a line, a standard set of rules from Unicode, the body that defines how text is stored, decides how the pieces are arranged ([UAX #9](https://www.unicode.org/reports/tr9/)).

Letters have a direction. Punctuation and spaces don't, so they take the direction of the text around them. At the end of a phrase, that's the direction of the whole interface.

So an English phrase ending in an exclamation mark, inside an Arabic interface, shows its mark at the wrong end:

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

It looks like a bug, but it's the rules working exactly as written. (Brackets got their own rule for the same reason, after the plain rules kept pairing them wrong ([Unicode](https://blog.unicode.org/2012/06/pri-231-bidi-parenthesis-algorithm.html)).)

Figma follows the same rules, so an Arabic mockup with real mixed text shows you these cases before code does. That's one more reason to put real Arabic in your files.

### Write every sentence as one piece

A sentence with a changing part, like "Sara invited you", is one piece of text with a gap: `{name} invited you`. Never two pieces placed side by side.

There are two reasons. How the rules arrange a line depends on the whole sentence, so pieces arranged separately go wrong. And word order differs between languages, so a translator has to be able to move the gap.

In Figma, that means one text layer for the sentence, not a name layer next to a text layer in an auto layout row. The row would reverse in Arabic, and the sentence would read in the wrong order.

### Mark text that comes from users

Some text comes from somewhere else, and could be in either direction: a person's name, a search term, a product title. An English name inside an Arabic sentence, or the other way round, can scramble the punctuation around it.

Developers can isolate that text, so it keeps its own direction and can't disturb the sentence. But they need to know which text it is, and that's something only design knows. Mark it in two places:

1. **In the component, for text people type or the product fills in.** Find the text property that holds it, like `Name` on an avatar row, `Title` on a product card or `Value` on a search field. Add one line per property to the component's `Right to left` note: "Name: either direction". It sits beside the padding and alignment lines, in the description Dev Mode shows.
2. **In a mockup, for a gap inside a sentence.** Where a screen shows "Sara invited you", select that text layer and add a Dev Mode annotation: "{name}: either direction". Annotations stay attached to the layer, so the developer sees it on the exact text.

Text your team writes, like a button label or a heading, needs no mark. It's always in the interface's language.

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

For your developer: that's `dir="auto"` or `<bdi>` around the inserted text, never invisible Unicode control characters typed into the strings ([W3C](https://www.w3.org/International/articles/inline-bidi-markup/); [toolkit: i18n](https://github.com/javi-cuello/design-system-toolkit/blob/main/knowledge/code/i18n.md#bidirectional-text)).

**Decide the digit style per market and type it in your mockups, keep numbers, addresses and codes left to right, write each sentence as one text layer with gaps, mark text from users as either direction, and test with real mixed content.**

---

## 10. What do developers need from you?

Not a mirrored copy of your Figma file. Developers can flip the layout themselves. What they can't work out on their own is the decisions behind it, and those are what you hand over.

Developers can flip the boxes without design's help. Bootstrap, a widely used code framework, renamed its spacing classes from "left" and "right" to "start" and "end" and now produces its right-to-left version automatically, instead of maintaining a second one ([Bootstrap](https://getbootstrap.com/docs/5.3/getting-started/rtl/)).

Ant Design's history shows what the real work is. Its direction switch arrived in late 2019 covering six components ([#18006](https://github.com/ant-design/ant-design/pull/18006)), a second change extended it to more than 40 ([#19380](https://github.com/ant-design/ant-design/pull/19380)), and its documentation still says the half-star in its rating component doesn't work right to left ([Ant Design](https://ant.design/components/config-provider/)). Adding the switch took a day. Checking every component against it was the project.

What developers can't decide alone is the judgement: that the chart doesn't mirror, that the help icon mirrors in Urdu but not in Hebrew, that a particular illustration reversed would be offensive. **The engineering is mostly mechanical; the design is mostly judgement.**

There's a newer wrinkle. A lot of component code now starts from Figma itself, through Dev Mode or an AI agent reading your file through Figma's MCP server (the connection that lets AI tools read Figma files).

So does that generated code mirror? Partly. Asked for a filter chip with 12 padding on the left and 8 on the right, the MCP server wrote the padding as "left 12, right 8", the physical way from section 3, even though the logical way exists in the same code style.

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

The chip's row itself came out in a form that reverses automatically, so the order mirrors for free. The padding doesn't, and neither would anything positioned absolutely from one side. It's section 3's broken row again, generated automatically. No setting was found to change this.

**Write the rules down rather than drawing them, ask for a direction switch early, and tell whoever generates code from your files to convert padding to logical properties.** For your developer: in Tailwind that's `ps-`/`pe-` instead of `pl-`/`pr-`, and a lint rule against `pl-`, `pr-` and `padding-left` in component code catches the rest.

---

## 11. How do you review it, when nothing breaks visibly?

By looking, deliberately, because right-to-left bugs render perfectly. A mirrored photograph, an upside-down chart, a stranded chevron and the four-pixel padding swap all produce a screen that looks plausible, and nothing shows an error.

That's why review is the real control. Ask for a direction switch in your component explorer (Storybook or similar) from day one, so right-to-left is always one click away. It won't guarantee anyone checks everything, but it means people actually look.

Use real translated text, because mirrored English tests neither length nor mixed-language behaviour. Make your test content mix scripts, because bugs cluster where the direction changes. And have someone who reads the language review it. That's the step teams skip, and it's the only one that catches the photograph.

Some of this can be automated. The toolkit proposes code checks that render each page right to left and look for overflowing text, flag padding and alignment written as "left" and "right" in component code, flag invisible control characters in text files, and check that each page declares its language ([toolkit: i18n](https://github.com/javi-cuello/design-system-toolkit/blob/main/knowledge/code/i18n.md)). These are proposals there, not checks that run yet.

**Ask for a direction switch on day one, review with real text and mixed-script content, and get a native reader to look.**

---

## 12. Cheat sheet

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

## 13. The short version

Right-to-left mirrors the whole layout, not just the text. Learn what flips: layout, navigation, arrows and progress do; media controls, clocks, numbers, photographs and most charts don't. Some rules differ between Arabic and Hebrew, so write down which languages you support, and treat the rules as convention, since the one study of real users found gaps.

In the built product, the code mirrors everything from one switch, as long as spacing is written as leading and trailing rather than left and right. Figma can't do this for layout, so don't plan around a Direction mode. Keep one library, drawn left to right.

Build so the flip is cheap: auto layout, nothing absolutely positioned, swappable directional icons with their flip decision recorded as data, and no "left" or "right" in any name.

Instead of a twin library, write a mirroring note per component, keep an icon list, mock up the screens where direction changes a decision, and put real Arabic in your files. If designers have to work in right-to-left before code exists, add a generated direction property to the sets whose children reverse, after counting them across every variant.

Choose the Arabic typeface deliberately and keep your scale until real text says otherwise. Expect short labels to grow most, and let every container grow.

Give developers rules, not mirrored artboards. Code generated from Figma mirrors the order but not the padding, so ask for it to be converted. And get a direction switch in front of reviewers early, because none of these bugs announce themselves.

---

## 14. What to re-check later

**How this was researched.** First researched in August 2026, re-verified in September, and re-checked twice in November 2026. The November passes found no 2026 Figma release touching layout direction. They re-read the variables-for-direction request (six replies, the latest on 19 May 2026, a September 2025 question asking for a roadmap, no staff reply), found the older 2023 wrapping thread (28 replies, posts as recent as June 2026) beside the narrower August 2025 one, and found two more mirroring plugins, Design RTL and Make It RTL. Search results show a 2024 support reply in a wrapping thread calling right-to-left wrap "on our radar", the only Figma statement found. Vertical-flow wrap, reported in September 2026, was seen only in commentary, not in Figma's release notes. The section 6 method and the section 10 code test were tried on a real production library; no figures from it are given here. The diagrams are drawn for this guide; the Arabic labels are الإشعارات (Notifications) and تسجيل الدخول (Sign in).

**What would change this guide.**

- **Figma layout direction.** If either open request ships, sections 3, 4 and 5 change. Check the threads themselves, since a feature can land without its own announcement.
- **The plugins.** Section 4's generated direction property rests on vendor descriptions (RTL Layout, RTL Converter, RTL Hero, Aura RTL, RTLAuto, Design RTL; Make It RTL is named in a forum thread but unread). One trial on a duplicate of a real library would settle it.
- **Figma's code output.** The MCP server's physical padding (Tailwind `pl-`/`pr-` rather than `ps-`/`pe-`) was tested on one component, on 4 November 2026. Dev Mode's own code panel and its other output languages are untested; one component with uneven padding would settle each.
- **Arabic line height.** No measurement exists on either side. A team that tests it would hold the best evidence published.
- **Material's per-language exceptions and the CHI paper's details.** Material 3's bidirectionality page renders only with script and couldn't be read, so its splits (question-mark icons, Hebrew progress bars) come from consistent search summaries and aren't confirmed; the archived Material 1 page doesn't carry them. Only the abstract and summaries of the CHI 2021 paper were read, not its per-element results.
- **Unicode.** UAX #9 reached revision 52 with Unicode 18.0 on 1 September 2026. The 18.0 beta lists no significant changes to it, and the rules cited here predate it, but the final revision's Modifications section wasn't read.

**Evidence notes.** Instances can't override auto layout direction or child order: observed product behaviour, not a documented limitation. The 20 to 30 percent Arabic expansion figure is a vendor rule of thumb. The regional digit patterns are drawn from commentary, and an account of a large digital-library project choosing Western digits despite scholars' objections was second-hand and has been left out. Logical properties are still a candidate in the toolkit's code knowledge, used by habit in one project and not yet tested by an incident. A previously cited Finastra right-to-left guide no longer resolves and has been dropped. An earlier version's button example used "Save", whose Arabic (حفظ) is shorter than the English; it now uses "Sign in".

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

**Not resolved to a primary source**

- The 20 to 30 percent Arabic expansion figure (vendor rule of thumb); Figma's instance-override limits on direction (observed, not documented).
