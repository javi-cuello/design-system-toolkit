# Profile: editorial and long reads

What a site of articles, essays and series must specify, past what a docs site does: the front page as a magazine, art direction, the article frame, editorial type, openings and section breaks, figures and breakouts, quotes, side notes, navigation within an article and across a series, theme, print and static delivery. It binds the fundamentals (`../design/visual.md`, `../design/content.md`, `../design/accessibility.md`, `../design/ux.md`) and the patterns (`../patterns/navigation.md`, `../patterns/pagination.md`) to one kind of product, and takes the reading frame, notes and on-this-page list from [documentation](documentation.md) rather than restating them. It serves the [design-standard](../../../standards/design-standard.md) principles *serve a real need*, *clear words, clear hierarchy*, *as little as possible, and no simpler* and *for everyone, in any context*, and applies design-standard rule 7 (headings sit with their content). The design-standard *Application profiles* entry names this file; it admits nothing as a rule.

---

## Front page as a magazine

**Use when**
- [weak] A site publishes articles over time and its home page lists them: a lead story, the latest pieces, series and issues.

**How**
- [weak] **One lead story**, larger than the rest, then the others at one size. Emphasis is a budget ([visual: emphasis and the attention budget](../design/visual.md#emphasis-and-the-attention-budget)); two leads are none.
- [weak] **Series and issues are groups with a name**: a series lists its parts in order; an issue, if the site has them, is a dated set. Each shows its title, its part count and its newest part.
- [weak] **List or card.** A list (title, standfirst, date) scans fastest and suits text-led archives; a card adds an image and suits pieces whose picture carries the story. Choose per section, not per item (the toolkit's judgement; no source opened measures it).
- [weak] **Images earn their size.** NN/g: "Large images are visually appealing, but they can harm the overall user experience if they aren't appropriately prioritized", and "Most sites will do best with a balanced approach" ([Whitenton 2014](https://www.nngroup.com/articles/image-focused-design/)). Imagery in general is [visual: imagery and illustration](../design/visual.md#imagery-and-illustration).
- [weak] **Art direction within templates.** Dan Mall: "Art direction is about evoking the right emotion", design "the technical execution of that connection"; "We've all but perfected the art of designing templates" but "we're still relearning how to design pages and create moments" ([A List Apart, 2010](https://alistapart.com/article/art-direction-and-design/)). Let a piece choose from a few named variants of the template (a hero treatment, an accent, a display face) rather than carry its own stylesheet.
- [weak] **Go with the web's grain.** Chimero: "I believe every material has a grain, including the web"; the web "adapts to the width of the viewport to fill it up" ([The Web's Grain, 2015](https://frankchimero.com/blog/2015/the-webs-grain/)). A front page drawn as a fixed print spread breaks at the first width nobody drew.

**Cases**
- Every item on the home page is a card with a stock photo → a list for text pieces; cards only where the image is the story.
- A feature needs its own colour and type → a named variant on the article, from the template's set; a one-off stylesheet becomes the next template's debt.
- Three "featured" pieces at the same large size → one lead; the others join the list.

**Accessibility**
- [required] 1.1.1 Non-text Content: a card's image that repeats its title is decorative. 2.4.4 Link Purpose: one link per item, named by the title, not "Read more".
- [required] Implementation: code-standard rule 18 (decorative images).

**Build**
- [weak] The front page is a list of `article` elements, each with a heading linking the piece and a `time` ([HTML semantics: lists, description lists and figures](../../code/html-semantics.md#lists-description-lists-and-figures)); a whole-card click target stretches the heading's link with a pseudo-element, never a link wrapping the card.
- [required] A variant is an attribute on `article` (`data-variant="feature"`) that re-points tokens, styled from the attribute (code-standard rule 6); the set lives with the template.
- [weak] Card images carry `width`, `height` and `loading="lazy"` below the first screen ([performance: images](../../code/performance.md#images)).

**Check**
- *Script:* could check each item has one link, named by its title, and a `time` with `datetime`.
- *Judgement:* does the eye land on one piece first?

**Sources:** NN/g, A List Apart and Chimero as linked. Mall argues for per-piece direction; the toolkit keeps it to named variants, because a piece styled from scratch is a template nobody maintains.

---

## Art direction: type, colour and space

**Use when**
- [weak] Giving an article site its look: the home hero, the article header, the index and the space between them; hierarchy (one lead) is [Front page as a magazine](#front-page-as-a-magazine).

**How**
- [strong] **Large titles are light and tight.** Stripe, Vercel and Linear set their page titles at 48 to 56px, weight 300 to 590, with negative tracking (Vercel −2.88px on 48px, about −0.06em); none sets a large sans title at 700. Bold belongs to serif or condensed display faces (Increment's Tiempos at 700, Figma's condensed sans). Tracking stays within [visual: typography](../design/visual.md#typography)'s limit, about −0.025em at display sizes: Vercel's −0.06em is one face's choice, not the toolkit's default.
- [strong] **A headline is a few words.** Sketch's is three ("Designers, welcome home."), Increment's measured article title three, Stripe's eight. A sentence that explains goes in the standfirst under it, at about 1.2 times body size (A List Apart 24px over 18px body; Sketch 24px).
- [strong] **The background is flat, with one gesture.** Stripe has one ribbon on white, Sketch one soft gradient, rauno.me one yellow disc, The Pudding one colour field per story; Linear, Vercel and Increment are flat. None layers texture, gradient and image together.
- [strong] **One accent hue**, spent on links, kickers and the main action: Stripe purple, Increment blue, Craig Mod blue; Linear and Vercel use none and let imagery carry colour. A kicker is a link to its section, so this keeps [visual: emphasis](../design/visual.md#emphasis-and-the-attention-budget)'s accent-where-action-is.
- [moderate] **The article header repeats the index's title face and scale.** Vercel and Linear set the article title at the same 48px as the index heading and add a kicker above and author and date below; Figma keeps its 90px title and changes the page colour; Stripe keeps its kicker colour and grid lines.
- [strong] **The nav is quiet**: 14 to 16px at weight 400, grey links, at most one filled button (Linear, Vercel, Stripe).
- [strong] **Index entries are regular**: a meta line (date or topic), the title, one or two grey lines of summary, a hairline between rows (Increment, Vercel, Linear). Only the newest or lead piece is featured (Stripe).
- [moderate] **Sections get room.** Section gaps measured 100 to 128px, about 6 to 8rem (Figma, Sketch), and 224px, 14rem (Linear). Spending white space on purpose reads as care (the toolkit's judgement; no source measures the effect).

**Cases**
- A hero headline of two sentences at 72px bold → the first clause as the title at weight 400 to 500 (the toolkit's reading of three sites), the rest as the standfirst.
- A soft gradient, a texture and a coloured band on one page → one gesture, repeated in the article header so the two pages belong together.
- Home titles at 800, article titles at 700, topic titles at 600 → one large-title weight and scale for the home hero and the article header; smaller headings step down from it.
- Topic links set as bordered pills in bold beside a bold name → plain links at 400 in grey; the name at 600 at most.

**Accessibility**
- [required] 1.4.3 Contrast: muted text over a gradient is measured against the gradient where the text sits, not the page background; a glow behind grey text can take it under 4.5:1.
- [required] 1.4.12 Text Spacing: nothing may be lost or clipped when the user sets letter-spacing to 0.12em and line height to 1.5; titles get no fixed height, no `overflow: hidden` and no `!important` on their tracking.

**Build**
- [weak] The gesture is one pseudo-element (`::before`) behind the hero and the article header, from tokens (`--glow-*` or a ribbon image), redefined for dark mode ([theming and dark mode](../design/visual.md#theming-and-dark-mode)) and hidden in [print](#print).
- [required] Title weight and tracking come from the text styles, one style for the large title used by both headers (code-standard rule 54).

**Check**
- *Script:* could flag (thresholds are the toolkit's judgement) a large title over 40px at weight 700 or more in a sans face that is not condensed, a hero `h1` over about eight words, more than one accent hue in links and kickers, and muted text whose sampled background fails 4.5:1.
- *Judgement:* does the article header look like it came from the same site as the home page?

**Sources:** [Stripe](https://stripe.com/blog), [Vercel](https://vercel.com/blog), [Linear](https://linear.app/now), [Sketch](https://www.sketch.com), [Figma's Shortcut](https://www.figma.com/blog/), [Increment](https://increment.com), [A List Apart](https://alistapart.com), [Craig Mod](https://craigmod.com), [The Pudding](https://pudding.cool) and [rauno.me](https://rauno.me), measured from their rendered pages (computed styles and screenshots) on 11 November 2026; where tracking disagrees with visual.md, visual's limit holds, since one face's tight setting does not carry to another; Medium and The Verge refused or walled the automated visit and are not counted. Galleries (Awwwards, Land-book) were not crawled.

---

## The article frame

**Use when**
- [weak] Building the top of an article: everything above the first paragraph of the body.

**How**
- [weak] In order: **kicker** (the section or series, a link), **title** (the one `h1`), **standfirst** (one or two sentences saying what the piece is and why read it), **byline**, **date**, **reading time**, then the **hero** if there is one.
- [weak] **Dates**: the published date, and an updated date when the piece changed in substance, each labelled ("Updated 3 November 2026"). An unlabelled second date reads as a mistake (the toolkit's judgement; no source checked states it).
- [weak] **Reading time** is an estimate from the word count; round it to whole minutes. No source on the method could be opened (Medium's help page refused), so no words-per-minute figure is given here.
- [weak] **The hero** supports the title, not the reverse (NN/g, as in [Front page](#front-page-as-a-magazine)). With no picture worth showing, no hero: the title and standfirst are the opening.
- [weak] Metadata for sharing (title, description, image) is [HTML semantics: share previews](../../code/html-semantics.md#share-previews).

**Cases**
- The title sits under a full-height hero and the first screen shows no words → a hero at most part of the first screen, or the title over or above it.
- The page shows "Nov 3" and "11/5" → one format, written out, labelled published and updated.
- A standfirst repeats the title → rewrite it to say what the reader gets.

**Accessibility**
- [required] 1.3.1 and 2.4.6: the title is the `h1`; kicker and standfirst are not headings. 1.1.1: the hero's `alt` says what it shows, or is empty if it only decorates.
- [required] Implementation: code-standard rule 1 (one `h1`), code-standard rule 18.

**Build**
- [required] `article` holds a `header`: the kicker a link in a `p`, the `h1`, the standfirst a `p`, then byline and dates in a `p` or `dl`; each date `<time datetime="2026-11-03">` with the written date as text ([i18n: numbers, dates, plurals and lists](../../code/i18n.md#numbers-dates-plurals-and-lists)).
- [moderate] The hero is a `figure` with `img` (`width`, `height`, `fetchpriority="high"` if it is the largest paint) and a `figcaption` for credit ([HTML semantics: images and alt](../../code/html-semantics.md#images-and-alt); [performance: images](../../code/performance.md#images)).
- [required] Reading time is computed at build time from the body text and written into the HTML: the source determines it, so it is generated (toolkit-standard §D 23).

**Check**
- *Script:* could check one `h1` per article, every date a `time` with a valid `datetime`, an updated date labelled, and the `h1` inside the first viewport at 390px.
- *Judgement:* could a reader decide from the frame alone whether to read on?

**Sources:** NN/g as linked. The order is the common one on reading sites by the toolkit's own reading, not a measured survey.

---

## Editorial type

**Use when**
- [weak] Setting the reading type of an article site. Sizes, leading, spacing between prose elements and the scale are [visual: type for UI and long-form content](../design/visual.md#type-for-ui-and-long-form-content); this section adds only what long reads change.

**How**
- [moderate] **A text face and a display face may be two families.** [Visual: typography](../design/visual.md#typography) advises one family; that is for tools, where type serves controls. A reading site pairs a text face for the body with a display face for titles and the front page: Santa Maria, "One typeface can be enough to say what you need to say, and two is usually plenty" ([A List Apart, 2009](https://alistapart.com/article/on-web-typography/)); Tufte CSS sets its body in a serif and "shifts gracefully to other serif fonts like Palatino and Georgia" ([Tufte CSS](https://edwardtufte.github.io/tufte-css/)). Two families, no third; the chrome around the article (menus, buttons) keeps the system's sans.
- [contested] **Measure.** Bringhurst: "Anything from 45 to 75 characters is widely regarded as a satisfactory length of line", and "The 66-character line (counting both letters and spaces) is widely regarded as ideal" ([webtypography.net 2.1.2](http://webtypography.net/2.1.2)); Butterick 45 to 90 ([line length](https://practicaltypography.com/line-length.html)); Craig Mod "approximately 12-15 words per line" on tablets ([A Simpler Page](https://craigmod.com/essays/a_simpler_page/)). The toolkit's target stays visual's 65 to 75, capped at 80.
- [weak] **Small caps are the face's own.** Rutter: "Genuine small caps are not simply shrunken versions of the full caps"; synthesised ones "only produce a parody" ([webtypography.net 3.2.2](http://webtypography.net/3.2.2)). Use `font-variant-caps` only with a face that has them; track them as [visual: typography](../design/visual.md#typography) says.
- [required] **Balanced titles, pretty paragraphs.** `text-wrap: balance` evens a heading's lines and works on "six or less for Chromium and ten or less for Firefox" lines; `pretty` uses "a slower algorithm that favors better layout over speed", is "intended for body copy", and "has a negative effect on performance" ([MDN `text-wrap`](https://developer.mozilla.org/en-US/docs/Web/CSS/text-wrap); [MDN `text-wrap-style`](https://developer.mozilla.org/en-US/docs/Web/CSS/text-wrap-style): Baseline 2024, newly available since October 2024, and "Some parts of this feature may have varying levels of support", so both are enhancements).
- [required] **Hyphenation** helps narrow columns. Browsers "will only hyphenate if this attribute [`lang`] is present and the appropriate hyphenation dictionary is available" ([MDN `hyphens`](https://developer.mozilla.org/en-US/docs/Web/CSS/hyphens)). Never justify: 1.4.8 asks that "Text is not justified" ([Understanding 1.4.8](https://www.w3.org/WAI/WCAG22/Understanding/visual-presentation.html)).

**Cases**
- An article site uses the product's UI sans at 16px for 4,000-word essays → a text face at a reading size; the sans stays for the chrome.
- Three families: a display, a serif body and a slab for pull quotes → two; the pull quote takes the display face.
- A title wraps with one word on its last line → `text-wrap: balance` on headings.
- `hyphens: auto` does nothing → the page has no `lang`, or the wrong one.

**Accessibility**
- [moderate] 1.4.8 (AAA, the toolkit's target): at most 80 characters, not justified. 1.4.4 and 1.4.12 as in visual. 3.1.1 Language of Page is also what hyphenation needs.
- [required] Implementation: code-standard rule 7 (prose scale), code-standard rule 54 (type from the text styles).

**Build**
- [required] The prose container sets the text face, the measure in `ch` and `text-wrap: pretty` on `p`; headings take `text-wrap: balance` ([visual: typography](../design/visual.md#typography); code-standard rule 7).
- [required] `<html lang>` set, and `lang` on any passage in another language ([i18n: language and direction](../../code/i18n.md#language-and-direction)); `hyphens: auto` on the prose only, never on headings or code.
- [weak] Both faces self-hosted, subset, WOFF2, with metric-matched fallbacks ([performance: fonts](../../code/performance.md#fonts)).

**Check**
- *Script:* could count rendered characters per body line, and flag `text-align: justify`, `hyphens: auto` without `lang`, more than two families in the prose, and `font-variant-caps` on a face without the `smcp` feature.
- *Judgement:* does the body read as a book page, and the chrome as a tool?

**Sources:** as linked. Line length disagrees (Bringhurst 45 to 75, Butterick 45 to 90, WCAG 80); the toolkit keeps visual's 65 to 75 capped at 80. Visual advises one family and the editorial sources allow two; the toolkit allows two here because a reading face and a display face do different jobs, and keeps one in tools.

---

## Openings and section breaks

**Use when**
- [weak] Marking where a piece, or a new part of it, begins below the headings.

**How**
- [weak] **The lede** (first paragraph) is set flush left: Butterick calls an indent on the first paragraph optional, because its start is already obvious ([first-line indents](https://practicaltypography.com/first-line-indents.html)).
- [weak] **Indent or space, never both.** Butterick: "If you use a first-line indent on a paragraph, don't use space between. And vice versa", with an indent between one and four times the point size. On screen, space between paragraphs is the common choice (the toolkit's judgement).
- [required] **Drop caps.** `initial-letter` sets "the size and sink for dropped, raised, and sunken initial letters" and is "not Baseline because it does not work in some of the most widely-used browsers" ([MDN `initial-letter`](https://developer.mozilla.org/en-US/docs/Web/CSS/initial-letter)); caniuse shows partial support in Chromium from 110 and Safari from 9, and none in Firefox ([caniuse](https://caniuse.com/css-initial-letter), read 2026-11-11). Use it behind `@supports`, with a floated `::first-letter` or a plain first letter as the fallback ([CSS-Tricks](https://css-tricks.com/snippets/css/drop-caps/)).
- [weak] **New-thought small caps.** Tufte "starts each section with a bit of vertical space, a non-indented paragraph, and the first few words of the sentence set in small caps" ([Tufte CSS](https://edwardtufte.github.io/tufte-css/)): a break that needs no heading.
- [required] **Ornaments.** A scene change with no heading is an `hr`, which "represents a paragraph-level thematic break" ([HTML `hr`](https://html.spec.whatwg.org/multipage/grouping-content.html)); draw the ornament in CSS.

**Cases**
- Paragraphs are indented and spaced → drop one; on screen, keep the space.
- A drop cap is a `span` around the first letter → `::first-letter`; the word stays whole in the markup.
- Section breaks are three asterisks typed as a paragraph → an `hr`, styled.

**Accessibility**
- [required] 1.3.1: a thematic break is an `hr`, announced as a separator; a typed "* * *" is read as punctuation.
- [required] 1.4.12: a drop cap must not fix the paragraph's line height.

**Build**
- [required] `.prose > p:first-of-type::first-letter` floated as the fallback, and `@supports (initial-letter: 3)` for the real thing ([browser support: progressive enhancement and feature queries](../../code/browser-support.md#progressive-enhancement-and-feature-queries)).
- [required] New-thought small caps are a `span` with an attribute hook, set with `font-variant-caps: small-caps` (code-standard rule 6).
- [weak] `hr` drawn with a background image or `::after` content, never an image element in the flow, so assistive technology meets the break as a separator and nothing else.

**Check**
- *Script:* could flag paragraphs with both `text-indent` and a block margin, and `initial-letter` outside `@supports`.
- *Judgement:* does each opening mark one thing, or do drop cap, small caps and ornament all fire at once?

**Sources:** as linked.

---

## Figures, captions and breakouts

**Use when**
- [weak] An article mixes prose at the measure with images, charts, tables or code that need more width.

**How**
- [moderate] **One grid with named lines.** The article is a grid whose middle column is the measure, with wider tracks either side; each child is placed by name. Ryan Mulligan's version names `full`, `feature`, `popout` and `content` lines, each width from a custom property, mirrored on both sides ([Layout breakouts, 2022](https://ryanmulligan.dev/blog/layout-breakouts/)). Three are enough here: `content`, `popout`, `full`. Tufte CSS calls the widest a `fullwidth` figure that takes "(almost) the full width of the screen" ([Tufte CSS](https://edwardtufte.github.io/tufte-css/)).
- [weak] **Prose is the default; breakouts are the exception**, placed by an attribute.
- [weak] **Captions** sit under the figure, say what it shows and credit its source.
- [weak] Narrow screens: every track but `content` collapses to the gutter, so a `popout` figure becomes content width and `full` goes edge to edge.

**Cases**
- Each wide figure uses negative margins tuned to the column → place it on the grid's `popout` line; the arithmetic is the grid restated.
- A full-bleed image overflows at 390px → the `full` track is `minmax(gutter, 1fr)`, never a fixed width.
- A chart's caption is a paragraph after it → a `figcaption` inside its `figure`.

**Accessibility**
- [required] 1.4.10 Reflow: no breakout scrolls the page sideways at 320px. 1.1.1: the `figcaption` is not the `alt`.
- [required] Implementation: code-standard rule 2 (DOM order stays reading order).

**Build**
- [required] `grid-template-columns: [full-start] minmax(var(--gutter), 1fr) [popout-start] minmax(0, var(--popout)) [content-start] min(var(--measure), 100% - 2 * var(--gutter)) [content-end] minmax(0, var(--popout)) [popout-end] minmax(var(--gutter), 1fr) [full-end];` as a variant of the one layout container component (`[data-layout="article"]`, code-standard rule 11), built from the gutter token the page grid states once (code-standard rule 46) and the prose measure token; children sit on `content` by default, `[data-width="popout"]` and `[data-width="full"]` on theirs (code-standard rule 6; check the hook name against the components' own attributes first, code-standard rule 39).
- [required] The article band still holds exactly one container (code-standard rule 3): the article variant replaces the default container in that band rather than nesting inside it, and the band is full-bleed so `full` can reach the edges ([responsive: one page grid and one container element](../../code/responsive.md#one-page-grid-and-one-container-element)). No page rule restates the gutter or the width.
- [weak] Figures are `figure` and `figcaption` ([HTML semantics: lists, description lists and figures](../../code/html-semantics.md#lists-description-lists-and-figures)); a wide table scrolls in its own region ([responsive: tables on small screens](../../code/responsive.md#tables-on-small-screens)).

**Check**
- *Script:* could check no element in the article has a negative inline margin, `scrollWidth ≤ innerWidth` at 320px, and every `figure` holding an image has a `figcaption` or a reason.
- *Judgement:* does each breakout earn its width?

**Sources:** Mulligan and Tufte as linked. Responsive.md puts a breakout outside the container, in its own band; the toolkit uses that for page sections, and for an article, where figures alternate with prose too often for separate bands, the container's article variant, which keeps code-standard rules 3, 11 and 46.

---

## Quotes

**Use when**
- [weak] Quoting a source in the body, highlighting a line from the piece, or setting a quotation at the start.

**How**
- [required] **Block quote**: words from another source, set in from the measure, at full text contrast. A greyed quote is harder to read than the text around it, and WCAG 1.4.3 holds for it like any text.
- [required] **Attribution outside the quote**: "Attribution for the quotation, if any, must be placed outside the blockquote element" ([HTML `blockquote`](https://html.spec.whatwg.org/multipage/grouping-content.html)), in a `figcaption` when the two are a `figure`.
- [required] **Pull quote**: a line from the piece repeated large. DPUB-ARIA's `doc-pullquote` is "A distinctively placed or highlighted quotation from the current content designed to draw attention to a topic or highlight a key point", and the spec requires a duplicated occurrence to be hidden from assistive technologies ([DPUB-ARIA 1.1](https://www.w3.org/TR/dpub-aria-1.1/)); DAISY: "The addition of an `aria-hidden` attribute in these cases prevents the content from being read again to users of assistive technologies" ([DAISY KB, pull quotes](https://kb.daisy.org/publishing/docs/html/dpub-aria/doc-pullquote.html)). The role is not deprecated in 1.1 (checked on the spec 2026-11-11; the roles 1.1 deprecates are `doc-biblioentry` and `doc-endnote`).
- [required] **Epigraph**: "A quotation set at the start of the work or a section that establishes the theme or sets the mood" (DPUB-ARIA `doc-epigraph`); Tufte sets it in italics ([Tufte CSS](https://edwardtufte.github.io/tufte-css/)).

**Cases**
- A pull quote is read twice by a screen reader → `aria-hidden="true"` on the repeat.
- A pull quote quotes nothing in the text → it is a block quote or a heading; a pull quote repeats.
- The source sits inside the `blockquote` as a dash and a name → move it to a `figcaption`.
- Block quotes in a muted grey → body text colour; set them apart by indent or a rule, not by fading.

**Accessibility**
- [required] 1.4.3 Contrast for every quote. 1.3.1: a block quote is a `blockquote`, not an indented `p`.

**Build**
- [required] `<figure><blockquote cite="…"><p>…</p></blockquote><figcaption>Name, <cite>Work</cite></figcaption></figure>` (HTML).
- [required] A pull quote is `<aside role="doc-pullquote" aria-hidden="true">`, placed on the `popout` line ([Figures](#figures-captions-and-breakouts)); hidden content in general is [accessibility: hidden content](../../code/accessibility.md#hidden-content).
- [required] An epigraph is a `blockquote` with `role="doc-epigraph"` at the start of its section (ARIA).

**Check**
- *Script:* could flag a `doc-pullquote` without `aria-hidden` whose text appears in the body, and a quote colour below 4.5:1.
- *Judgement:* does the pull quote say the piece's point, or a line chosen for its length?

**Sources:** WHATWG, DPUB-ARIA, DAISY and Tufte as linked.

---

## Side notes and notes

**Use when**
- [weak] An article has asides or citations. Whether a note should exist, its markup and its numbering are [documentation: footnotes and side notes](documentation.md#footnotes-and-side-notes); this section adds layout.

**How**
- [moderate] **Side notes on wide screens.** Gwern: sidenotes put "the notes in the page margin to let the reader instantly read them", and on the web footnotes "wind up degrading to simply endnotes" ([Sidenotes in web design](https://gwern.net/sidenote)). Tufte CSS uses "the margin for sidenotes, margin notes, and small figures" ([Tufte CSS](https://edwardtufte.github.io/tufte-css/)).
- [contested] **On narrow screens the sources differ.** Tufte hides them "until the user toggles them into view"; Nystrom's books shift "the aside into the text, inline"; Butterick uses "pop-ins defaulted to expanded"; Gwern uses floating footnotes (the last three as Gwern reports them). The toolkit places the note after its paragraph, shown, as documentation already does: no control, no script, and nothing hidden on the device where a reader can least afford to hunt.
- [weak] **Long notes collide.** Tufte's sidenotes "will not handle gracefully many complex or lengthy sidenotes (which will overlap)" (Gwern). Keep side notes short; a long aside becomes an endnote.
- [weak] Side notes need a margin: the article grid's `popout` track on one side ([Figures](#figures-captions-and-breakouts)).

**Cases**
- Two side notes in one paragraph overlap → shorten them, or move one to the endnotes.
- On a phone the notes vanish behind a "⊕" toggle → show them after their paragraph.

**Accessibility**
- [required] 1.3.1 and 2.4.4 as in documentation. 1.4.10: the margin column folds into the flow at 320px.

**Build**
- [required] The note follows its paragraph in the DOM, an `aside` with the id its marker links; at the wide breakpoint it moves to the margin track with `grid-column` only, never a float with negative margins (code-standard rule 2; [responsive: breakpoints](../../code/responsive.md#breakpoints)).

**Check**
- *Script:* could check side notes do not overlap at the widest breakpoint and sit after their paragraph at 390px.
- *Judgement:* is the note short enough for the margin?

**Sources:** Gwern and Tufte as linked; the toolkit takes the inline fallback.

---

## In-article navigation

**Use when**
- [weak] A piece is long enough to be returned to or skimmed: several `h2` sections, or a reader who will come back for one part.

**How**
- [weak] **A contents list.** NN/g: "A table of contents increases the discoverability of the content that is low on the page"; sticky is easy in a rail, but they recommend a "nonsticky implementation of a table of contents when placed within the main body" ([NN/g, Wang and Brown 2023](https://www.nngroup.com/articles/table-of-contents/)). The list itself is [navigation: in-page navigation](../patterns/navigation.md#in-page-navigation-on-this-page) and documentation's [on-this-page navigation](documentation.md#on-this-page-navigation).
- [weak] **The current section, marked.** NN/g suggests "highlighting the current section in the table of contents", so "Users get feedback on scrolling progress and learn where they are on the page".
- [weak] **Progress bars.** A bar across the top restates the scrollbar. Viget's eye-tracking study of custom scroll indicators is often cited as showing readers rarely notice them; its page refused to load here, so that claim is unchecked. The toolkit's position rests on NN/g: mark the current section in the contents, and add no bar.
- [weak] **Back to top.** NN/g suggests one "especially when you have a long page with a nonsticky table of contents".

**Cases**
- A sticky contents box floats over the body on a phone → the list after the standfirst, not sticky.
- A reading-progress bar and a contents rail on one page → drop the bar.

**Accessibility**
- [required] 2.4.1, 2.4.5 and 2.4.11 as in navigation; a progress bar, if kept, is decorative (`aria-hidden`) unless it says something the page does not.

**Build**
- [required] As [navigation: in-page navigation](../patterns/navigation.md#in-page-navigation-on-this-page): a labelled `nav`, generated from the `h2` ids, `aria-current="true"` set by an `IntersectionObserver` (code-standard rule 64).
- [required] Back to top is a link to the `h1`'s id at the end of the article, not a floating button that covers text (2.4.11).

**Check**
- *Script:* could check entries match headings, and that no fixed element covers body text at 390px.
- *Judgement:* is the piece long enough to need it?

**Sources:** NN/g as linked; Viget's study could not be opened (HTTP 429, 2026-11-11).

---

## Series navigation

**Use when**
- [weak] A piece is one part of a series read in order.

**How**
- [moderate] **Say where the reader is**: "Part 2 of 5" under the kicker, with the series name linking its contents page.
- [moderate] **A series contents list**: every part by title, in order, the current one marked, at the top or the foot of each part.
- [weak] **Previous and next by title**, at the end of the piece: [pagination: pagination anatomy](../patterns/pagination.md#pagination-anatomy) labels them with the neighbour's title for "a short run of related pages read in order"; no Previous on part 1, no Next on the last.
- [weak] One article is never split across pages to make a series: linear content should "almost never be broken up" (NN/g, in [pagination: choosing](../patterns/pagination.md#choosing-pagination-load-more-or-infinite-scroll)).
- [moderate] WCAG 2.4.8 Location: "Information about the user's location within a set of web pages is available"; its techniques include G127, "Identifying a web page's relationship to a larger collection of web pages" ([Understanding 2.4.8](https://www.w3.org/WAI/WCAG22/Understanding/location.html)).

**Cases**
- The series page lists parts newest first → in reading order; the front page can still show the newest.
- "Next" links to part 3 with no title → "Next: The second draft".
- A part not yet published appears as a dead link → list it as text with its expected date, or leave it out.

**Accessibility**
- [moderate] 2.4.8 (AAA), 2.4.4 Link Purpose, 1.3.1 (the parts are an `ol`).
- [required] Implementation: code-standard rule 64 (`aria-current="page"` on this part).

**Build**
- [required] The series list is a `nav` labelled by the series name, holding an `ol` of links ([HTML semantics: navigation markup](../../code/html-semantics.md#navigation-markup)); "Part 2 of 5" is text in the header, not a heading.
- [required] Previous and next are a second labelled `nav` with `rel="prev"` and `rel="next"` links naming the titles (HTML).
- [required] The list and the part numbers are generated from the series' data at build time, never typed per page (toolkit-standard §D 23).

**Check**
- *Script:* could check every part of a series carries the same list, in the same order, with exactly one current entry.
- *Judgement:* could a reader landing on part 3 from a search find part 1?

**Sources:** WCAG and the pagination page as linked.

---

## Theme for long reads

**Use when**
- [weak] An article site offers light and dark, or follows the system.

**How**
- [weak] Follow `prefers-color-scheme` until the reader picks, as [documentation: page frame](documentation.md#page-frame-and-visual) does; the theme itself is [visual: theming and dark mode](../design/visual.md#theming-and-dark-mode).
- [weak] **No flash on a static page.** The HTML is built before anyone visits, so it cannot know the reader's choice: Comeau, "the HTML is generated ahead of time", and without care "you'll wind up with that telltale flicker". The fix is a blocking script that runs before content, because "scripts are blocking; nothing will be painted to the screen until that JS code has been evaluated" ([Comeau, 2020](https://www.joshwcomeau.com/react/dark-mode/)).
- [weak] Images that read badly on dark (diagrams on white grounds) get a dark version or a frame, not an inverting filter.

**Cases**
- A reader who chose dark sees a white page for a moment on every article → the stored choice is applied by an inline script in `<head>`.

**Accessibility**
- [required] 1.4.3 and 1.4.11 in each theme; 1.4.8's first bullet (colours the reader can select) is what a theme toggle partly answers.

**Build**
- [moderate] As [tokens: themes and modes](../../code/tokens.md#themes-and-modes): `<meta name="color-scheme" content="light dark">`, then an inline script in `<head>` that sets the root attribute from storage. Comeau injects his at the start of `body`; the toolkit puts it in `head`, before the stylesheets, as tokens.md's web.dev source does.
- [required] Diagram images use `picture` with a `prefers-color-scheme` source ([accessibility: reduced motion and colour scheme in code](../../code/accessibility.md#reduced-motion-and-colour-scheme-in-code)).

**Check**
- *Script:* could load a page with a stored dark choice and capture the first paint.
- *Judgement:* does any image glare in dark mode?

**Sources:** Comeau as linked; tokens.md's sources for the meta tag and the head script.

---

## Print

**Use when**
- [weak] Articles may be printed or saved as PDF, as long reads often are. The print block in general is [browser support: print styles](../../code/browser-support.md#print-styles); this section adds what articles need.

**How**
- [weak] **Hide the chrome**: navigation, contents rail, share buttons, theme toggle, related links. Rachel Andrew lists "navigation" among the things "you might want to hide" ([Smashing, 2018](https://www.smashingmagazine.com/2018/05/print-stylesheets-in-2018/)).
- [weak] **Print link URLs** after external links (`a[href^="http"]::after { content: " (" attr(href) ")"; }`, after Andrew), so a citation survives paper.
- [required] **Keep headings with their text**: `h2, h3 { break-after: avoid-page; }`, "To avoid a paragraph being detached from the heading immediately preceding it" (Andrew); design-standard rule 7 on paper.
- [weak] **Figures whole**: `figure { break-inside: avoid; }`, since "you don't want a half of it to end up on one page and the other half on another page" (Andrew); and `p { orphans: 2; widows: 2; }`.
- [weak] Side notes print after their paragraph; a pull quote may be left out, since it repeats.

**Cases**
- A printed essay ends a page on a lone heading → `break-after: avoid-page` on headings.
- Links print as underlined words with nowhere to go → the URL after each external link.

**Accessibility**
- [required] No WCAG criterion names print; reading order holds (code-standard rule 2).

**Build**
- [weak] One `@media print` block in the sheet, taking the light tier of the tokens ([browser support: print styles](../../code/browser-support.md#print-styles)); `[data-print="hide"]` on the chrome.

**Check**
- *Script:* could emulate print media and check the navigation is hidden and each external link shows its URL.
- *Judgement:* would a printed copy still cite its sources?

**Sources:** Andrew as linked.

---

## Static delivery

**Use when**
- [weak] Publishing articles as a static site, or any site whose reading should not depend on script.

**How**
- [weak] **The content is in the HTML**, as [documentation: page frame](documentation.md#page-frame-and-visual) asks: readable, indexable and quotable with script off. Script adds the contents highlighting and the theme toggle only.
- [weak] **Fonts self-hosted**, so the page reads the same from a cache, offline or behind a network that blocks font hosts, and no third party is asked for every page view. Format, subsetting and fallbacks are [performance: fonts](../../code/performance.md#fonts).
- [weak] Images sized, and lazy below the first screen ([performance: images](../../code/performance.md#images)).

**Cases**
- An article's text arrives from a JSON request after load → render it at build time.
- Titles flash from a fallback face to the display face and the lines rewrap → a metric-matched fallback ([performance: fonts](../../code/performance.md#fonts)), so the swap moves nothing.
- The page claims to work offline but its fonts load from a font host → self-host them, or drop the claim.

**Accessibility**
- [required] Content in the HTML serves every reader whose script fails; 1.3.1 holds without script.
- [required] Implementation: code-standard rule 20 (a no-script path).

**Build**
- [required] Pages generated at build time with the text, dates, reading time, contents list and series list in the HTML (code-standard rule 20; toolkit-standard §D 23); `@font-face` sources on the site's own origin.

**Check**
- *Script:* could fetch each page without script and check the body text is present, and flag any font request to another origin.
- *Judgement:* does anything a reader needs wait for script?

**Sources:** the linked toolkit pages, which carry their own sources.
