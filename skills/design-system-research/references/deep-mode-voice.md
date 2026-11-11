# Deep-Mode Deliverable: Voice and Structure

## 1. What the guide is for

A deep-mode guide teaches a designer a territory once, then stays open beside their work as a lookup. Read start to finish, it should feel like a good magazine piece. Scanned six months later, it should give one section's answer in a glance. Both uses have to work.

It fails in two known ways. **Compressed:** question headings, correct citations, a verdict per axis, and prose so dense that a reader finishes a section without knowing what it said. **Report:** every sentence true, but it opens with how it was checked, reports each source's status mid-explanation, moves from example to example with nothing joining them, and never once sounds like a person explaining something. A reader called one "a report and summary" and "a stream of examples, not a reading piece" (2026-11-04). The rules below exist to avoid both, and the second is the one this file was rewritten to fix (2026-11-11).

The model is the educational web press: A List Apart, Smashing Magazine, CSS-Tricks, web.dev's *Learn* courses, and practitioners such as Josh Comeau, Ahmad Shadeed, Julia Evans, Brad Frost, Nathan Curtis and Amy Hupe. What they share is below; each rule names where it came from.

## 2. Who reads it

**A designer, unless the brief says otherwise.** Auto layout, variants, instances and padding are theirs; code is not. Open with what they can see (what changes on screen) and only then bring in a mechanism from another discipline, explained through an example they know ("padding written as leading and trailing instead of left and right") before it is named. A code term they need to pass on goes after the plain explanation, flagged: "For the developer: `ps-` instead of `pl-`." A section that only makes sense to someone who already knows how code works has skipped a step. One reader stopped at a first section that asked whether Figma could mirror "the way code does": "you cannot start with that if I have no context of how code works", and at a sentence about spacing, "what spacing? where? how?" (2026-11-04).

**A knowledgeable peer, not a pupil.** Smashing asks its authors to "assume that your reader is a knowledgeable peer" ([Smashing, write for us](https://www.smashingmagazine.com/write-for-us/)). Explain the mechanism fully, never the obvious.

## 3. The opening screen

What a reader sees before scrolling decides whether they read on. A List Apart: "Don't warm up to your subject by preceding it with generalizations", and "If your tutorial solves a problem, state the problem" ([A List Apart, style guide](https://alistapart.com/about/style-guide/)). Amy Hupe, on long pages: "start with the most useful chunk" ([Hupe](https://www.amyhupe.co.uk/articles/dont-be-afraid-of-the-big-long-page/)).

So the first screen holds only:

1. **The title**, plain and descriptive.
2. **A one-line subtitle**: what the guide decides, and for whom.
3. **The problem, as a scene.** Two to four sentences: a moment the reader recognises, with something concrete going wrong in it. Never how the guide was researched, never "this piece sets out".
4. **What this answers**: the questions a practitioner arrives with, as a short linked list, in the order they come up, then a pointer to the cheat sheet and the short version. It is the guide's contents, so it is also the index; past about fifteen sections, group it by part. Generate the anchors from the headings and check they resolve.

Series position ("Part 3 of 9"), the reading order and links to the other parts go at the end of the guide or in the reading site's frame, never stacked above the problem.

## 4. Anatomy of a section

Sections are not numbered: a heading is its question, and a pointer to another section links its title ("[which layers carry readiness](#which-layers-carry-readiness)"), never "section 5" (the maintainer, 2026-11-11: "we don't need numbers"). They are separated by `---` and follow the decision axes from scoping, never a system-by-system tour. A long topic may group them under `# Part one/two/three` headings. Each section runs in this order.

**A title that is a question.** The one a practitioner would actually ask: "Should it be `isDisabled` or `disabled`?", never "The boolean prefix". A question tells the reader whether this is the section they need; a topic noun needs the vocabulary they came to learn. **Keep it short: about six words, rarely past eight.** It is read in the contents rail as well as the page, and a question that wraps there is two questions or a sentence; the detail goes into the one-sentence answer below it. "What does an agent do differently?", not "What does an agent do with a design system that a person does not?" (2026-11-11).

**A one-sentence answer.** Plain, unlabelled. A reader who stops here still has something correct and usable.

**The problem they can see.** Then the scene: the situation where the question bites, with real values, before any mechanism is named. web.dev opens its box-model lesson exactly so: "The content ends up 142px wide, instead of the 100px you specified", then "Why is that?" ([web.dev, box model](https://web.dev/learn/css/box-model)). One question like that is allowed per section, straight after something the reader has just seen; it is the hook. Rhetorical questions anywhere else stay out.

**The mechanism.** How the thing works, explained in the reader's terms, carried by the same scene. This is the part that lets a reader decide whether the advice transfers to their case, and notice when its reason expires.

**The worked case**, with its traps (section 5), and **the systems' stories**: a named system that hit this and what it did.

**The advice.** What to do, as a colleague would say it, naming the place and the steps (section 10). Its one key sentence is bold so a scanner finds it. It says which parts are consensus and which are judgement, and names the constraint the advice depends on where one exists; where the evidence is split, it still lands a verdict. No label in front: never "**What to do.**", never "**Recommendation:**".

## 5. Worked cases and traps

**Every major claim gets a worked case.** The situation, the version that looks reasonable, exactly what it costs in real values, the corrected version. Two code fences side by side, two table rows, or a five-line arithmetic walk. The test: could a reader reproduce the failure in their own file from what is written? A claim that resists this has not been understood well enough to publish.

**Show the flawed version first.** The magazines teach by showing the thing that looks right and breaks, then the reasoning, then the fix; Shadeed's sections run "The problem", then "The solution" ([Shadeed, subgrid](https://ishadeed.com/article/learn-css-subgrid/)). Not "percentage line heights inherit badly", but sixteen-pixel body text, a thirty-two-pixel title inheriting a 24px computed value, and the lines that overlap.

**Let the reader predict, once.** Where a case has a surprising result, set it up and pause before showing it: Comeau writes "See if you can figure out what's going on here" before his reveals ([Comeau, flexbox](https://www.joshwcomeau.com/css/interactive-guide-to-flexbox/)). In a guide, that is one plain sentence ("Before reading on, work out what the title's line height will be") ahead of the answer. Optional, and at most once per section.

**Name the traps** wherever a decision has more than one way to go wrong: each with what it looks like, why it happens and what it breaks. Prefer traps a real system hit and documented; label invented ones as illustrative. A run of five may be a table; two are two paragraphs.

**Tell the system stories.** Shopify collapsing seven booleans into two enums, Chakra dropping the `is` prefix, GOV.UK's scale point 36 rendering at 27px: each is a story a reader remembers and can retell in their own review. Reach for one wherever a claim would otherwise be abstract, and tell it as a story, a few sentences with a cause and an outcome, never as a list of names.

Both forms make the costs as concrete as the benefits. A guide whose costs are abstract and whose benefits are specific has picked a side without arguing it.

## 6. Figures

**Draw what is visual.** Where the topic is something on a screen (a layout, a mirrored row, padding, a truncated label), the running example is drawn, not only described. A paragraph asking the reader to "picture a settings row" is a diagram not yet made. Past about 300 words of prose with no figure, look for what to draw: a reader stopped twice at long imageless sections (2026-11-04).

**Every figure has a sentence before it and a sentence after it.** Before: what it shows ("Here is the same row in English and Arabic."). After: what to notice ("The icon moved; the number didn't."). A figure dropped in cold makes the reader work out why it is there.

**Mechanics.** Inline SVG in the markdown (the reading site renders it); `<title>` and `role="img"` carry its text alternative; a light ground; real labels in the real script; no blank lines inside the `<svg>` block (they end the HTML block in markdown); a before and after side by side where the point is a change. Give each `<svg>` `style="display:block;width:100%;height:auto;margin:2em 0"`, since an svg is inline by default and sits against the text above in some markdown viewers. Keep a word in another script out of the middle of an English sentence: "in Arabic it's تسجيل الدخول, 12" renders scrambled, so put it in parentheses at the end of a clause. Render every diagram in a browser and look at it before delivering: Arabic or Hebrew text in SVG anchors the opposite way under `direction="rtl"`, a mistake only a look catches.

**Tables compare; prose explains.** A table earns its place putting a before and after side by side, or comparing options on axes the prose has already introduced. Two tests: could a reader who has read only the surrounding prose understand it, and does removing it lose information or only tidiness? A guide whose argument lives in its tables reads as a report.

## 7. Analogy

**One analogy per hard concept, placed after the worked case, with its limit named.** web.dev gives its picture-frame analogy only after the definitions, introduced plainly: "here's an analogy for what you've learned so far" ([web.dev, box model](https://web.dev/learn/css/box-model)). Comeau calls the flexbox primary axis "like a kebab" ([Comeau](https://www.joshwcomeau.com/css/interactive-guide-to-flexbox/)). The risks are real: Julia Evans finds that with strained analogies "it's a struggle to extract the actual technical facts" ([Evans, confusing explanations](https://jvns.ca/blog/confusing-explanations/)), and A List Apart warns off extended metaphors "unless you can carry it off" ([A List Apart, style guide](https://alistapart.com/about/style-guide/)).

So: an analogy only where a relationship is abstract (Core as a foundation two sibling libraries build on), after the concrete case has done the explaining, in one or two sentences, with one sentence on where it stops holding. The same image may come back later in the guide; it is never reinvented per section, and a section with nothing abstract gets none.

## 8. Paragraphs and pace

**One idea per paragraph.** Two to four sentences, rarely past 70 words. A paragraph that explains a mechanism, gives its example and draws the lesson is three paragraphs. A run of parallel items is a bulleted list, not a sentence held together by semicolons. Long blocks read as a report before a word is read (2026-11-04: "we shouldn't have so long paragraphs", on a 140-word block).

**One new idea at a time.** Evans names "introducing too many concepts at a time" as a pattern that loses readers ([Evans](https://jvns.ca/blog/confusing-explanations/)). At most one new term per paragraph, and about three per section; a section that needs more is two sections. Each term is defined in a clause where it first appears.

**One running example.** A section is carried by one scene (a settings row, a `Save` button, a filter chip) and comes back to it as the explanation develops. A further example joins only to show what the running one can't, and is introduced by what it shows. If the paragraphs could be reordered without anyone noticing, the section is a stream and needs its thread.

**Connective sentences are the reading.** "That's why", "the catch is", "so": these turn facts into a piece someone can read through. Before a number, a table or a system's story, say plainly what question it answers ("How much of a library does this affect? The count below answers it."), never as a teaser. Cutting connectives for density is the report failure again.

**Explain where the claim is made.** A cross-reference may point to more detail; it never stands in for the explanation. "Only some token names do (section 5)" leaves the reader holding a vague claim for four sections. Give the example on the spot (`spacing.left` lands on the wrong side in Arabic; `spacing.inline-start` doesn't), then point onward.

**No packed openers.** The one-sentence answer is not a string of label-and-answer pairs ("Digits: as typed. Punctuation: follows the paragraph."). That is compression at the top of a section (2026-11-04: "this is the super compact report style that i don't like").

## 9. Voice

**Plain, warm and dry.** A List Apart asks for "an informal, conversational tone" ([style guide](https://alistapart.com/about/style-guide/)). Contractions where speech uses them. A dry aside is welcome where it is true and short ("Boring, but it holds."); a punchline, a pun or a wink is not. No performance: no "let's dive in", no staccato drama, no aphorism formulas.

**Educational, not paternalistic.** No "here's something reassuring", no "as you'll remember", no "the trap that trips everyone", no telling the reader how they feel or what to pin above their desk. When something confuses most people, say so as a fact about the material ("the confusing part"), not a prediction about the reader.

**"You" in worked cases and advice; the problem everywhere else.** The opening scene and the explanation talk about the problem and the people in it: "the designer", "a library with forty components". Worked cases, the advice, the cheat sheet and the short version talk to the reader, since each is where the reader acts; a quotation keeps its own words: "Open the component's description and add a line `Right to left: mirrors`." The magazines use "you" throughout, and a conversational second-person version of a lesson teaches measurably better: retention d = 0.30 and transfer d = 0.54 in a meta-analysis ([Ginns, Martin and Marsh, 2013](https://doi.org/10.1007/s10648-013-9228-0)), largest in short lessons, and best when not overdone ([Mayer, personalization principle](https://www.cambridge.org/core/books/abs/cambridge-handbook-of-multimedia-learning/principles-of-multimedia-learning-based-on-social-cues-personalization-voice-and-image-principles/19309D764FD015A556334531A463DE03)). The explanation stays third person because it cannot know the reader's library, team or deadline, and stand-ins like "a team building this" are fine there; in the advice, where the reader is about to act, they read as a report. This is a ruling of 2026-11-11, replacing the no-second-person rule of 2026-11-09.

**No narrator.** No "I" or "my" in the guide's own sentences: it has no named author, and a first-person aside borrows an authority the anonymous register hasn't earned. A judgement is marked by its reason, not by an owner: "The safer default is `inline-start`, because it survives a language switch", never "this series' judgement" or "in my view". A cited title (*How I Organize Variables in Figma*) is fine.

**State the claim before the caveat.** "Shared core wins where both sides are live. It costs more where one side is still being written", not "in some contexts a shared core can work well, though". This governs order, not honesty: where evidence is split, name both sides and still land a verdict.

**Mixed feelings allowed.** Where the evidence is genuinely split, say what each side is optimising for. A guide with a clean answer to everything hasn't looked hard enough.

## 10. Claims, caveats and sources in the flow

**Specifics are the texture.** Exact values, real token names, versions, dates, measured outcomes (a weight of 653, 8% coverage, a 1-second spinner delay). Vague claims are cut or re-verified, never padded.

**Advice names the place and the steps.** "Mark where it mirrors" is not advice until it says where and how: which panel, which property, what to type ("select the icon, and in the Design panel's instance section choose Create instance swap property"). A step the reader can't carry out from the sentence alone is a vague claim (2026-11-04: "mark where, how? often advice is very vague").

**Evidence status stays out of the explanation.** A sentence explaining auto layout does not also report that a forum thread was re-read in November and has six replies. Say what is true, as plainly as the evidence allows. Where trust really changes with the source, one plain clause does it ("the vendor says", "Figma's help page says"); dates checked, plan tiers "as of" a day, and release notes go to *What to re-check later*. Test: delete every parenthesis and source-status clause from a paragraph; if it reads better and says the same, they belonged at the end.

**A link sits on the noun.** "[Figma's help page on variable modes](…) says…", never "(see source 14)" or a bare URL mid-sentence.

**An aside for a caveat that doesn't change the advice.** A blockquote straight after the paragraph, opening with `**Aside.**`: an edge case, a version difference, a historical note. A caveat that changes the advice goes in the advice.

**Narrate changes in the world, never in the document.** If the world changed (CSS gained percentage letter-spacing, GOV.UK moved a scale point), that belongs in the body and is often the best thing in the section. If the guide was wrong, the body states the right thing and the correction is recorded in *What to re-check later*.

## 11. The back matter

After the question sections, in this order, each separated by `---`:

```
## Cheat sheet
The one lookup table a reader pins beside their work: this becomes that,
and here is what not to write. Skipped only where the topic has no lookup shape.

## The short version
Everything above as plain prose that stands alone: a reader who reads only
this can act. Not a numbered restatement; a summary someone could read aloud.
It resolves to the reader's stated context, marks consensus against
judgement, and says what to write down for the people downstream. A
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

Every rule above improves a draft, and each can be applied until it damages one. Both earlier failures of this skill came from over-correcting: an essay rewritten into wall-to-wall tables, then the tables stripped to nearly none. Aim at the defect, then stop. Do not "fix":

- **A long section on a genuinely complex axis.** Compress the dull parts, not the load-bearing ones.
- **Correct technical vocabulary.** `advance width`, `pseudo-class` and `units-per-em` are the right words; the words to cut are the inflated ones.
- **Repetition of a term.** Cycling synonyms for one concept is worse.
- **A table that genuinely compares.**
- **A split verdict honestly stated.**
- **A section of an existing guide that already reads well.** A rewrite that changes everything loses what the reader liked. (A requested full rewrite is different: it recomposes every section, since patched sentences still read as patches.)

## 13. Hard rules and mechanics

- **No em dashes or en dashes anywhere in the file.** A period, comma, colon or parentheses instead. Hyphens inside identifiers (`heading-01`) are fine.
- **Three greps over the body**, excluding *Sources* and *What to re-check later*: `grep -niE "previous version|earlier draft|earlier revision|prior revision|this guide previously|got .{0,15}wrong|has been corrected|been reverted"` (revision narrated in the body); `grep -woiE "\bI\b|\bmy\b"` (a narrator); and `grep -niE "\byou(r|rs|rself|rselves)?\b"`, whose every hit must sit in a worked case, the advice, the cheat sheet, the short version or a quotation.
- **If the `humanizer` skill is installed**, run its audit on the draft before saving; where it and this file conflict, the dash ban wins.
- **Quotes in a guide**: at most one per source, under 15 words. Verbatim identifiers are facts and are reproduced exactly.
- **Never overwrite a section you have not read.** Revising a guide means reading all of it first, sources included; a rewrite that silently drops a source block is worse than none.
- **A research artifact is raw material.** If the Research feature produced a report, re-verify anything surprising, restructure by decision axis and rewrite in this voice; never paste its sections in.
- **The file**: written to the outputs directory and presented; deep mode never ends as prose in chat. Descriptive kebab-case filename (`typography-naming.md`).
