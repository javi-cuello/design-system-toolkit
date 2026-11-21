# Deep-mode deliverable: voice and structure

The voice and shape of a deep-mode guide. Read it in the same turn the guide is written, every time.

## Contents

- [1. What the guide is for](#1-what-the-guide-is-for)
- [2. Who reads it](#2-who-reads-it)
- [3. The opening screen](#3-the-opening-screen)
- [4. Anatomy of a section](#4-anatomy-of-a-section)
- [5. Worked cases and traps](#5-worked-cases-and-traps)
- [6. Figures](#6-figures)
- [7. Analogy](#7-analogy)
- [8. Paragraphs and pace](#8-paragraphs-and-pace)
- [9. Voice](#9-voice)
- [10. Claims, caveats and sources in the flow](#10-claims-caveats-and-sources-in-the-flow)
- [11. The back matter](#11-the-back-matter)
- [12. What to leave alone](#12-what-to-leave-alone)
- [13. Hard rules and mechanics](#13-hard-rules-and-mechanics)

## 1. What the guide is for

A deep-mode guide teaches a designer a territory once. Then it stays open beside their work as a lookup. Read start to finish, it should feel like a good magazine piece. Scanned six months later, it should give one section's answer at a glance. Both uses have to work.

It fails in two known ways:

- **Compressed.** Correct citations and a verdict per axis, but prose so dense that a reader ends a section not knowing what it said.
- **Report.** Every sentence is true, but it opens with how it was checked. It reports each source's status mid-explanation and jumps from example to example with nothing joining them. It never sounds like a person explaining something. A reader called one "a stream of examples, not a reading piece".

The rules below exist to avoid both. The second is the one this file was rewritten to fix.

The model is the educational web press: A List Apart, Smashing Magazine, CSS-Tricks and web.dev's *Learn* courses. Practitioners too, such as Josh Comeau, Ahmad Shadeed, Julia Evans, Brad Frost, Nathan Curtis and Amy Hupe. What they share is below, and each rule names where it came from.

## 2. Who reads it

**A designer, unless the brief says otherwise.** Auto layout, variants, instances and padding are theirs; code is not. Open with what they can see: what changes on screen. Only then bring in a mechanism from another discipline. Explain it through an example they know before naming it ("padding written as leading and trailing instead of left and right").

A code term they need to pass on goes after the plain explanation, flagged. For example: "For the developer: `ps-` instead of `pl-`". A section that only makes sense to someone who knows code has skipped a step. One reader stopped at a first section that assumed they knew how code mirrors a layout. Another stopped at a bare mention of spacing and asked which spacing, and where.

**A knowledgeable peer, not a pupil.** Smashing asks its authors to "assume that your reader is a knowledgeable peer" ([Smashing, write for us](https://www.smashingmagazine.com/write-for-us/)). Explain the mechanism fully, never the obvious.

## 3. The opening screen

What a reader sees before scrolling decides whether they read on. A List Apart says "If your tutorial solves a problem, state the problem", and warns off warming up with generalisations ([A List Apart, style guide](https://alistapart.com/about/style-guide/)). Amy Hupe, on long pages, says to lead with the most useful chunk ([Hupe](https://www.amyhupe.co.uk/articles/dont-be-afraid-of-the-big-long-page/)).

So the first screen holds only:

1. **The title**, plain and descriptive.
2. **A one-line subtitle**: what the guide decides, and for whom.
3. **The problem, as a scene.** Two to four sentences: a moment the reader knows, with something concrete going wrong in it. Never how the guide was researched, never "this piece sets out".
4. **What this answers.** The guide's sections as a short linked list, each title followed by the question it settles in a few plain words. List them in order, then point to the cheat sheet and the short version. It is the guide's contents, so it is also the index. Past about fifteen sections, group it by part. Generate the anchors from the headings and check they resolve.

Series position ("Part 3 of 9"), the reading order and links to other parts go at the end of the guide. Or they go in the reading site's frame. They never sit above the problem.

## 4. Anatomy of a section

Sections are not numbered: a heading is a short label. A pointer to another section links its title ("[which layers carry readiness](#which-layers-carry-readiness)"), never "section 5". Sections are separated by `---` and follow the decision axes from scoping, never a system-by-system tour. A long topic may group them under `# Part one/two/three` headings. Each section runs in this order.

**A title that is a short label, never a question.** Use two to five words. Make it a noun phrase that names the subject: "The boolean prefix", "Agent-ready as an outcome", "Where readiness lives". No question mark, no sentence, no number. In the contents rail, a long or questioning title reads as a list of quiz items and wraps. The question the section settles goes into its one-sentence answer and into *What this answers*, never into the heading.

**A one-sentence answer.** Plain and unlabelled. A reader who stops here still has something correct and usable.

**The problem they can see.** Then comes the scene: where the question bites, with real values, before any mechanism is named. The web.dev box-model lesson opens so: "The content ends up 142px wide, instead of the 100px you specified". Then it asks "Why is that?" ([web.dev, box model](https://web.dev/learn/css/box-model)). One such question is allowed per section, straight after something the reader has just seen; it is the hook. Rhetorical questions anywhere else stay out.

**The mechanism.** How the thing works, in the reader's terms, carried by the same scene. This part lets a reader decide whether the advice transfers to their case. It also lets them notice when its reason expires.

**The worked case**, with its traps ([5](#5-worked-cases-and-traps)), and **the systems' stories**: a named system that hit this and what it did.

**The advice.** What to do, as a colleague would say it, naming the place and the steps ([10](#10-claims-caveats-and-sources-in-the-flow)). Its one key sentence is bold so a scanner finds it. Where the evidence is split, it still lands a verdict. No label goes in front: never "**What to do.**", never "**Recommendation:**".

The advice ends with its weight on toolkit-standard §D 21's scale, which this file does not restate:

- Write it as `*Weight: moderate.*` before the sentence that gives the reason.
- Give more than one weight where the advice's parts differ.
- Name the constraint the advice depends on, where one exists.

## 5. Worked cases and traps

**Every major claim gets a worked case.** The situation, the version that looks reasonable, exactly what it costs in real values, and the corrected version. Use two code fences side by side, two table rows, or a five-line arithmetic walk. The test: could a reader reproduce the failure in their own file from what is written? A claim that resists this is not yet understood well enough to publish.

Take the case from a source where one exists. Where none does, an illustrative case is allowed, said so in the sentence that introduces it ("take an illustrative change"). Only its situation is invented: its arithmetic and behaviour are real. It never says a named system did it.

**Show the flawed version first.** The magazines teach by showing the thing that looks right and breaks, then the reasoning, then the fix. Shadeed's sections run "The problem", then "The solution" ([Shadeed, subgrid](https://ishadeed.com/article/learn-css-subgrid/)). Not "percentage line heights inherit badly". Instead: sixteen-pixel body text, a thirty-two-pixel title inheriting a 24px computed value, and the lines that overlap.

**Let the reader predict, once.** Where a case has a surprising result, set it up and pause before showing it. Comeau writes "See if you can figure out what's going on here" before his reveals ([Comeau, flexbox](https://www.joshwcomeau.com/css/interactive-guide-to-flexbox/)). In a guide, that is one plain sentence ahead of the answer ("Before reading on, work out what the title's line height will be"). It is optional, and used at most once per section.

**Name the traps** wherever a decision has more than one way to go wrong. Give each what it looks like, why it happens and what it breaks. Prefer traps a real system hit and documented; label invented ones as illustrative. A run of five may be a table; two are two paragraphs.

**Tell the system stories.** Shopify collapsing seven booleans into two enums, Chakra dropping the `is` prefix, GOV.UK's scale point 36 rendering at 27px. Each is a story a reader remembers and can retell in their own review. Reach for one wherever a claim would otherwise be abstract. Tell it as a story, a few sentences with a cause and an outcome, never as a list of names.

Both forms make the costs as concrete as the benefits. A guide whose costs are abstract and whose benefits are specific has picked a side without arguing it.

## 6. Figures

**Draw what is visual.** Where the topic is something on a screen, draw the running example, not only describe it. That covers a layout, a mirrored row, padding or a truncated label. A paragraph asking the reader to "picture a settings row" is a diagram not yet made. Past about 300 words of prose with no figure, look for what to draw. Readers stop at long sections with no image.

**Check the gaps by count, not by feel.** Before delivering, this prints nothing:

```sh
awk '/^## Cheat sheet/{exit} /<svg/{if(n>1000)print FNR": "n" words since the last figure"; n=0; next} {n+=NF} END{if(n>1000)print "end: "n}' guide.md
```

Each line it prints is a stretch to draw in. Or it is a section whose subject truly has no picture, said so in the reply. Every main section with something visual in it carries at least one figure of its own running example. A rule left unchecked was missed once already, so the count is the check.

**One idea per figure, drawn with real content.** A figure that marks three things at once makes the reader sort colours before seeing the point. Draw the same object once per idea, with only that idea shaded and labelled with its token and value. Draw real content: a heading with words in it, a price, a button that says what it does. Grey bars standing in for text hide the very thing spacing, layout and type figures are about.

**Show a tool setup as well as telling it.** The advice may be a setup in a tool (Figma variables, auto layout, a token pipeline). Then draw the tool's state as a labelled sketch. Show the panel, its rows and the field bound, and call it a sketch with an as-of date, never a screenshot. Follow it with numbered steps a reader can carry out in their own file, each one action, with the menu names as of that date. A real screenshot comes only from a file the person names.

**Every figure has a sentence before it and a sentence after it.** Before: what it shows ("Here is the same row in English and Arabic."). After: what to notice ("The icon moved; the number didn't."). A figure dropped in cold makes the reader work out why it is there.

**Mechanics.** Each figure follows these:

- Inline SVG in the markdown, which the reading site renders. `<title>` and `role="img"` carry its text alternative.
- A light ground, and real labels in the real script.
- No blank lines inside the `<svg>` block: they end the HTML block in markdown.
- A before and after side by side, where the point is a change.
- Each `<svg>` gets `style="display:block;width:100%;height:auto;margin:2em 0"`. An svg is inline by default and sits against the text above in some markdown viewers.
- Keep a word in another script out of the middle of an English sentence. "in Arabic it's تسجيل الدخول, 12" renders scrambled, so put it in parentheses at the end of a clause.
- Render every diagram in a browser and look at it before delivering. Arabic or Hebrew text in SVG anchors the opposite way under `direction="rtl"`, a mistake only a look catches.

**Tables compare; prose explains.** A table earns its place putting a before and after side by side. Or it compares options on axes the prose has already introduced. Two tests: could a reader who has read only the surrounding prose understand it? Does removing it lose information, or only tidiness? A guide whose argument lives in its tables reads as a report.

## 7. Analogy

**One analogy per hard concept, after the worked case, with its limit named.** The web.dev picture-frame analogy comes only after the definitions ([web.dev, box model](https://web.dev/learn/css/box-model)). Comeau calls the flexbox primary axis "like a kebab" ([Comeau](https://www.joshwcomeau.com/css/interactive-guide-to-flexbox/)).

The risks are real. Julia Evans finds that strained analogies make the technical facts hard to extract ([Evans, confusing explanations](https://jvns.ca/blog/confusing-explanations/)). A List Apart warns off extended metaphors unless the writer can carry one off ([A List Apart, style guide](https://alistapart.com/about/style-guide/)).

So use an analogy only where a relationship is abstract, such as Core as a foundation two sibling libraries build on. Place it after the concrete case has done the explaining, in one or two sentences. Add one sentence on where it stops holding. The same image may come back later in the guide; it is never reinvented per section. A section with nothing abstract gets none.

## 8. Paragraphs and pace

**One idea per paragraph.** Two to four sentences, rarely past 70 words. A paragraph that explains a mechanism, gives its example and draws the lesson is three paragraphs. A run of parallel items is a bulleted list, not a sentence held together by semicolons. Long blocks read as a report before a word is read.

**One new idea at a time.** Evans names "introducing too many concepts at a time" as a pattern that loses readers ([Evans](https://jvns.ca/blog/confusing-explanations/)). Allow at most one new term per paragraph, and about three per section. A section that needs more is two sections. Define each term in a clause where it first appears.

**One running example.** One scene carries a section (a settings row, a `Save` button, a filter chip). The section comes back to it as the explanation develops. A further example joins only to show what the running one can't. Introduce it by what it shows. If the paragraphs could be reordered without anyone noticing, the section is a stream and needs its thread.

**Connective sentences are the reading.** "That's why", "the catch is", "so": these turn facts into a piece someone can read through. Before a number, a table or a system's story, say plainly what question it answers. For example: "How much of a library does this affect? The count below answers it." Never use it as a teaser. Cutting connectives for density is the report failure again.

**Explain where the claim is made.** A cross-reference may point to more detail; it never stands in for the explanation. "Only some token names do (section 5)" leaves the reader holding a vague claim for four sections. Give the example on the spot, then point onward: `spacing.left` lands on the wrong side in Arabic, and `spacing.inline-start` doesn't.

**No packed openers.** The one-sentence answer is not a string of label-and-answer pairs ("Digits: as typed. Punctuation: follows the paragraph."). That is compression at the top of a section, the compact report style readers reject.

## 9. Voice

**Plain, warm and dry.** A List Apart asks for "an informal, conversational tone" ([style guide](https://alistapart.com/about/style-guide/)). Use contractions where speech uses them. A dry aside is welcome where it is true and short ("Boring, but it holds."). A punchline, a pun or a wink is not. No performance: no "let's dive in", no staccato drama, no aphorism formulas.

**Educational, not paternalistic.** No "here's something reassuring", no "as you'll remember", no "the trap that trips everyone". Never tell the reader how they feel or what to pin above their desk. When something confuses most people, say so as a fact about the material ("the confusing part"), not a prediction about the reader.

**"You" in worked cases and advice; the problem everywhere else.** The opening scene and the explanation talk about the problem and its people. For example: "the designer", "a library with forty components". Worked cases, the advice, the cheat sheet and the short version talk to the reader, since each is where the reader acts. A quotation keeps its own words: "Open the component's description and add a line `Right to left: mirrors`."

Why "you" there: the magazines use it throughout, and a conversational second-person lesson teaches measurably better. A meta-analysis found retention d = 0.30 and transfer d = 0.54 ([Ginns, Martin and Marsh, 2013](https://doi.org/10.1007/s10648-013-9228-0)). The effect is largest in short lessons, and best when not overdone ([Mayer, personalization principle](https://www.cambridge.org/core/books/abs/cambridge-handbook-of-multimedia-learning/principles-of-multimedia-learning-based-on-social-cues-personalization-voice-and-image-principles/19309D764FD015A556334531A463DE03)).

The explanation stays third person because it cannot know the reader's library, team or deadline. Stand-ins like "a team building this" are fine there. In the advice, where the reader is about to act, they read as a report. This ruling replaced an earlier rule that banned the second person outright.

**No narrator.** No "I" or "my" in the guide's own sentences. The guide has no named author, and a first-person aside borrows an authority the anonymous register hasn't earned. Mark a judgement by its reason, not by an owner: "The safer default is `inline-start`, because it survives a language switch". Never write "this series' judgement" or "in my view". A cited title (*How I Organize Variables in Figma*) is fine.

**State the claim before the caveat.** Write "Shared core wins where both sides are live. It costs more where one side is still being written." Do not write "in some contexts a shared core can work well, though". This governs order, not honesty. Where evidence is split, name both sides and still land a verdict.

**Mixed feelings allowed.** Where the evidence is truly split, say what each side is optimising for. A guide with a clean answer to everything hasn't looked hard enough.

## 10. Claims, caveats and sources in the flow

**Specifics are the texture.** Exact values, real token names, versions, dates and measured outcomes: a weight of 653, 8% coverage, a 1-second spinner delay. Vague claims are cut or re-verified, never padded.

**Advice names the place and the steps.** "Mark where it mirrors" is not advice until it says where and how. Name the panel, the property and what to type. For example: "select the icon, and in the Design panel's instance section choose Create instance swap property". A step the reader can't carry out from the sentence alone is a vague claim.

**Evidence status stays out of the explanation.** A sentence on auto layout does not also say a forum thread was re-read. Say what is true, as plainly as the evidence allows. Where trust really changes with the source, one plain clause does it ("the vendor says", "Figma's help page says"). Dates checked, plan tiers "as of" a day, and release notes go to *What to re-check later*.

The test: delete every parenthesis and source-status clause from a paragraph. If it reads better and says the same, they belonged at the end.

**A link sits on the noun.** Write "[Figma's help page on variable modes](…) says…". Never "(see source 14)" or a bare URL mid-sentence.

**An aside for a caveat that doesn't change the advice.** Put it in a blockquote right after the paragraph, opening with `**Aside.**`. Use it for an edge case, a version difference or a historical note. A caveat that changes the advice goes in the advice.

**Narrate changes in the world, never in the document.** A change in the world belongs in the body. It is often the best thing in the section. Examples: CSS gained percentage letter-spacing, or GOV.UK moved a scale point. If the guide was wrong, the body states the right thing. The correction is recorded in *What to re-check later*.

## 11. The back matter

After the sections come these, in this order, each separated by `---`:

```
## Cheat sheet
The one lookup table a reader pins beside their work: this becomes that,
and here is what not to write. Skipped only where the topic has no lookup shape.

## The short version
Everything above as plain prose that stands alone: a reader who reads only
this can act. Not a numbered restatement; a summary someone could read aloud.
It resolves to the reader's stated context, says how much each part
weighs on the §D 21 scale, and says what to write down for the people downstream. A
change-management lesson (aliases, deprecation paths, the fact that every
good system has renamed something) belongs here, not in a closing essay.

## What to re-check later
When it was researched and against what. Volatile tool mechanics, spec
versions, betas, single-source claims, each weak source's status, the guide's
own corrections, and an honest note on how good the evidence is.

## Sources
**Primary** first, then **Commentary**, every entry a list item with a link to
the deepest URL actually opened, each page of a source on its own line. A
"Cited but not resolved to a URL" heading for anything never opened; never an
invented link.
```

Then, for a guide in a series, the series line: its part number and links to the previous and next parts.

## 12. What to leave alone

Every rule above improves a draft, and each can be applied until it damages one. Both earlier failures of this skill came from over-correcting. An essay was rewritten into wall-to-wall tables, then the tables were stripped to nearly none. Aim at the defect, then stop. Do not "fix":

- **A long section on a truly complex axis.** Compress the dull parts, not the load-bearing ones.
- **Correct technical vocabulary.** `advance width`, `pseudo-class` and `units-per-em` are the right words. The words to cut are the inflated ones.
- **Repetition of a term.** Cycling synonyms for one concept is worse.
- **A table that truly compares.**
- **A split verdict honestly stated.**
- **A section of an existing guide that already reads well.** A rewrite that changes everything loses what the reader liked. A requested full rewrite is different: it recomposes every section, since patched sentences still read as patches.

## 13. Hard rules and mechanics

- **No em dashes or en dashes anywhere in the file.** Use a period, comma, colon or parentheses instead. Hyphens inside identifiers (`heading-01`) are fine.
- **Three greps over the body**, excluding *Sources* and *What to re-check later*. Each is in the block below.
- **Headings are labels.** The two heading checks in the block below return nothing: no question heading, and no `##` or `###` heading past five words.
- **If the `humanizer` skill is installed**, run its audit on the draft before saving. Where it and this file conflict, the dash ban wins.
- **Quotes in a guide**: at most one per source, under 15 words. Verbatim identifiers are facts and are reproduced exactly.
- **Never overwrite a section you have not read.** Revising a guide means reading all of it first, sources included. A rewrite that silently drops a source block is worse than none.
- **A research artifact is raw material.** If the Research feature produced a report, re-verify anything surprising. Restructure it by decision axis and rewrite it in this voice; never paste its sections in.
- **The file** is written to the outputs directory and presented. Deep mode never ends as prose in chat. Use a descriptive kebab-case filename (`typography-naming.md`).

The register greps and heading checks:

```sh
# 1. Revision narrated in the body: every hit moves to What to re-check later
grep -niE "previous version|earlier draft|earlier revision|prior revision|this guide previously|got .{0,15}wrong|has been corrected|been reverted" guide.md
# 2. A narrator: no hits outside quoted titles and proper nouns
grep -woiE "\bI\b|\bmy\b" guide.md
# 3. Second person: every hit sits in a worked case, the advice, the cheat sheet,
#    the short version or a quotation (quoted speech and URLs ignored)
grep -niE "\byou(r|rs|rself|rselves)?\b" guide.md
# Headings: both print nothing
grep -nE '^#{2,4} .*\?[[:space:]]*$' guide.md
awk '/^#{2,3} /{if(NF-1>5)print FNR": "$0}' guide.md
```
