# Arabic text in a right-to-left design system

How to set up Arabic type, digits and mixed-language text in a Figma library, and what to hand the developers and reviewers who build it.

*Part 2 of 2. [Part 1](rtl-design-systems.md) covers the mirrored layout, what flips, and how to build components that flip cheaply.*

A product team has its library ready to mirror. Then the first Arabic screen arrives: the labels fall back to a font nobody chose, "Sign in" no longer fits its button, an order total could be written in two kinds of digits, and an English product name drags its exclamation mark to the wrong end of the line. None of that is layout, and none of it flips by itself.

---

## What this answers

- [Arabic type](#arabic-type): how the Arabic typeface is set up
- [Arabic line height](#arabic-line-height): whether Arabic needs more line height
- [Text expansion](#text-expansion): how much longer translated text gets
- [Arabic digits](#arabic-digits): which digits Arabic uses
- [Mixed-language lines](#mixed-language-lines): what happens when languages share a line
- [Developer handoff](#developer-handoff): what developers need from design
- [Review when nothing breaks](#review-when-nothing-breaks): how to review bugs that render perfectly

For a lookup, use the [cheat sheet](#cheat-sheet); [the short version](#the-short-version) is this part in three paragraphs.

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
- **Uppercase and italic.** Arabic has neither, and a mode can't switch them off. Where a label style sets capitals, the component's `Right to left` note (the description section [Part 1](rtl-design-systems.md#one-library-not-two) sets up) says the capitals are for Latin only, so the developer doesn't apply them to Arabic.
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

Nothing on the component changed; the frame chose the typeface. Text length doesn't need a variant either, since a button that hugs its content grows to fit the Arabic label. The only thing that ever needs a [`Direction` variant](rtl-design-systems.md#the-direction-variant) is the order of a row's parts, and only where designers draw Arabic screens in Figma.

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

In code the same decisions become two rules. The font stack names both typefaces, or the page picks the family by language, so every Arabic letter gets the Arabic face. And line height is a ratio of the font size, like 1.5, from the tokens, never a fixed pixel number: a pixel line height that suits English cuts off the stacked marks of scripts like Thai or Vietnamese (toolkit: `knowledge/code/i18n.md#font-coverage`).

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

That is why real Arabic belongs in the file. Developers can catch the same problem without a translator: they swap every label for a deliberately longer fake version, about 40 percent longer, and check what overflows (toolkit: `knowledge/code/i18n.md#text-expansion-and-no-fixed-widths-on-text`).

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

**Decide the digit style per market, write it down, and type it into your mockups.** For the developer: the digit style is a setting on the language, never hard-coded, and every number goes through the platform's own number formatting rather than being assembled by hand (toolkit: `knowledge/code/i18n.md#numbers-dates-plurals-and-lists`).

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

Keep numbers, addresses and codes left to right, and test with real mixed content. For the developer: that is `dir="auto"` or `<bdi>` around the inserted text, never invisible Unicode control characters typed into the strings ([W3C, inline markup and bidirectional text](https://www.w3.org/International/articles/inline-bidi-markup/); toolkit: `knowledge/code/i18n.md#bidirectional-text`).

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

The chip's row came out in a form that reverses by itself, so the order mirrors for free. The padding doesn't, and neither would anything positioned absolutely from one side. It is the broken padding row from [Figma versus code](rtl-design-systems.md#figma-versus-code), generated automatically, and no setting was found to change it.

**Write the rules down rather than drawing them, ask for a direction switch early, and tell whoever generates code from your files to convert padding to logical properties.** For the developer: in Tailwind that is `ps-` and `pe-` instead of `pl-` and `pr-`, and a lint rule against `pl-`, `pr-` and `padding-left` in component code catches the rest.

---

## Review when nothing breaks

Review it by looking, deliberately, with real text and a native reader, because right-to-left bugs render perfectly.

A mirrored photograph, an upside-down chart, a stranded chevron and the four-pixel padding swap all produce a screen that looks plausible. Nothing shows an error, so nothing tells a reviewer to look.

That makes review the real control, and it works only if people actually see the right-to-left version. A direction switch in the component explorer (Storybook or similar) keeps it one click away. It won't guarantee anyone checks everything, but it means people look.

What they look at matters as much. Mirrored English tests neither length nor mixed-language behaviour, so the test content is real translated text. Bugs cluster where the direction changes, so that content mixes scripts. And only someone who reads the language catches the mirrored photograph, which is the step teams skip.

Some of this can be automated. The toolkit proposes code checks that render each page right to left and look for overflowing text, flag padding and alignment written as left and right in component code, flag invisible control characters in text files, and check that each page declares its language (toolkit: `knowledge/code/i18n.md`). They are proposals there, not checks that run yet.

**Ask for a direction switch on day one, review with real text and mixed-script content, and get a native reader to look.**

---

## Cheat sheet

| Concern | Do this | Not this |
|---|---|---|
| Arabic type | A companion face switched by a variable mode, letter spacing 0 | Copies of components per script |
| Line height | The same scale, measured in the chosen face first | 1.7 copied from a blog |
| Containers | Hug content, minimum widths | Fixed widths sized to English |
| Placeholder text | Real Arabic | Lorem ipsum or English |
| Digits | A setting per language, decided per market | Hard-coded either way |
| Phone numbers, web and email addresses | Always left to right | Follow the paragraph |
| Sentences | Whole sentences with gaps | Fragments glued together |
| Text from users | Marked "either direction" in the spec; isolated by developers | Pasted straight into a sentence |
| Code generated from Figma | Convert padding to logical; tell the agent | Ship "left 12, right 8" as generated |
| Review | Direction switch plus a native reader | Screenshots |

---

## The short version

Choose the Arabic typeface deliberately, switch it in with a variable mode rather than copies of your components, set its letter spacing to 0 and keep your type scale until real text says otherwise. Expect short labels to grow most, and let every container grow.

Decide the digit style per market and type it into your mockups. Keep numbers and addresses left to right, write sentences whole with gaps, and mark every piece of text that comes from users as "either direction".

Give developers rules, not mirrored artboards. Code generated from Figma mirrors the order but not the padding, so ask for it to be converted. And get a direction switch in front of reviewers early, because none of these bugs announce themselves. Line height following the typeface is a judgement; no measurement settles it either way.

---

## What to re-check later

Researched August 2026, re-verified in September, and re-checked twice in November 2026.

- **Figma's code output.** The MCP server's physical padding (Tailwind `pl-` and `pr-` rather than `ps-` and `pe-`) was tested on one component, on 4 November 2026. Dev Mode's own code panel is untested.
- **Arabic line height.** No measurement exists on either side. A team that tests it would hold the best evidence published.
- **Unicode.** UAX #9 reached revision 52 with Unicode 18.0 on 1 September 2026; the rules cited here predate it, but the final revision's Modifications section wasn't read.
- **Tested on a real library.** The code test in [developer handoff](#developer-handoff) was tried on a real production library; no figures from it are given here.
- **Evidence notes.** The 20 to 30 percent Arabic expansion figure is a vendor rule of thumb. The regional digit patterns are drawn from commentary. Logical properties are still a candidate in the toolkit's code knowledge. Voxire's line-height figures are commentary.
- **Corrections.** A previously cited Finastra right-to-left guide no longer resolves and has been dropped. An earlier button example used "Save", whose Arabic (حفظ) is shorter than the English; it now uses "Sign in".
- **The figures** are drawn for this guide; the Arabic label is تسجيل الدخول (Sign in).

---

## Sources

**Primary: specifications and platforms**

- [Unicode, UAX #9 Bidirectional Algorithm](https://www.unicode.org/reports/tr9/); [Unicode blog, PRI 231](https://blog.unicode.org/2012/06/pri-231-bidi-parenthesis-algorithm.html).
- [W3C, Inline markup and bidirectional text](https://www.w3.org/International/articles/inline-bidi-markup/); [Text size in translation](https://www.w3.org/International/articles/article-text-size).
- Figma MCP server, `get_design_context`: tested directly on a production library's filter chip, 4 November 2026 (no public page documents its CSS property choice).

**Primary: design systems**

- [UAE Design System 2.0, Typography](https://designsystem.gov.ae/guidelines/typography); [Dubai Design System, Typography](https://designsystem.dubai.ae/foundations/typography).
- [Bootstrap 5.3, RTL](https://getbootstrap.com/docs/5.3/getting-started/rtl/); [Ant Design ConfigProvider](https://ant.design/components/config-provider/), [#18006](https://github.com/ant-design/ant-design/pull/18006), [#19380](https://github.com/ant-design/ant-design/pull/19380).

**The toolkit's own pages**

- `knowledge/code/i18n.md`: bidirectional text, numbers and dates, text expansion, font coverage, and the MCP code-output case.

**Commentary**

- [Voxire, Arabic RTL typography](https://voxire.com/blog/arabic-rtl-typography-web-design-2026/); [Freezil, Arabic typography for non-Arabic designers](https://freezil.com/blog/arabic-typography-guide).

**Cited but not resolved to a primary source**

- The 20 to 30 percent Arabic expansion figure (vendor rule of thumb).
