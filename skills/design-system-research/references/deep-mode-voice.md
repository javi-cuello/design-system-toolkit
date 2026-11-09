# Deep-Mode Deliverable: Voice and Structure

The deep-mode output is an **educational reference guide**. Someone reads it start to finish and comes away understanding the territory, then keeps it open and scans back to one section when a decision comes up. Both uses have to work.

The failure this file exists to prevent is a guide that passes every structural check and is unreadable: numbered sections, correct citations, a verdict per axis, and prose so compressed that a reader finishes a section without knowing what it said. That is the failure mode of a technical guide, and it is much easier to produce than an essay that rambles.

Its second form is the report: a guide that opens with how it was checked, says what each source's status is in the middle of explaining a mechanism, never talks to the reader, and moves from one example to the next with nothing joining them. Every sentence is true and the reader still feels audited rather than taught. A person called it "a report and summary" and "a stream of examples, not a reading piece" (2026-11-04). The rules under *Write it as a lesson, not a report* below are its fix.

## The two things that make it work

- **It explains the mechanism before it judges.** The reader is told how Figma derives an Auto line height (ascender plus descender plus line gap, over units-per-em) before being told not to use it. That order is what lets a reader decide whether the rule transfers to their situation, and notice when its reason expires.
- **It shows the failure with real values.** Not "percentage line heights inherit badly" but sixteen-pixel body text, a thirty-two-pixel title inheriting a 24px computed value, and the overlapping lines that result. A disadvantage the reader can recognise in their own file beats one they have to take on trust.

## Structure

```
# [Plain descriptive title naming the topic]

[One-line subtitle: what the guide decides, and for whom]

[One or two sentences, to the reader: the situation they are in and what
they will be able to do by the end. Never how the guide was researched;
that goes in What to re-check later.]

---

## What this answers

[The questions a practitioner actually arrives with, as a short list, in the
order they come up. Then a pointer to the cheat sheet and the short version.
This section is why a reader keeps reading; it is not optional.

Past roughly fifteen numbered sections, add a linked index here too, grouped
by part where the guide has parts. The question list says what the guide
covers; the index says where each answer is, and a long guide without one can
only be read forwards. Generate the anchors from the headings rather than
typing them, and check they resolve.]

---

## 1..N. [One decision axis each, numbered, titled as a question]

[The opening paragraph answers the title in one or two plain sentences,
with no label in front of it. A reader who stops here has still got
something correct and usable.]

[Prose that explains how the thing works before judging it, carried by one
scenario the reader can picture, which the section keeps returning to.
Named systems as evidence, told as short stories rather than listed. Real
token names, real values, real dates. Jargon defined in passing at first
use.

A table wherever it earns its place: a before and after, or a comparison
on axes the prose has already introduced. Never a table the reader meets
before they understand the question.

Advantages and disadvantages argued in prose at equal specificity, or as
bulleted runs where the list is genuinely a list.]

[The closing paragraph is the advice, with no label in front of it: what
to do, as a colleague would say it, with its one key sentence in bold so a
scanning reader finds it. Says which parts are consensus and which are this
guide's judgment, and names the constraint the advice depends on where one
exists.]

---

## N+1. Cheat sheet
[The one lookup table a reader pins beside their work: this becomes that,
and here is what not to write. Skip only where the topic has no lookup shape.]

---

## N+2. The short version
[Everything above, compressed into plain prose that works standalone. A
reader who only reads this section should be able to act. Not a numbered
restatement of the sections; a summary someone could read aloud.]

---

## N+3. What to re-check later
[When it was researched and what was verified against what. Volatile tool
mechanics, spec versions, features in beta, claims resting on a single
source, the status of each weak source (a search summary, a vendor's own
description, an abstract read without the paper), and an honest note on how
good the evidence is.]

---

## Sources
[**Primary** first, **Commentary** separately and labelled, every entry a list
item with a resolvable link. A section for anything cited but never opened.]
```

Sections are numbered so a reader can cite one, and separated by `---`. They follow the decision axes from scoping, never a system-by-system tour. A long topic may group sections into `# Part one/two/three` headings.

## Titling sections as questions

Title each numbered section as the question a practitioner would actually ask, not as the name of the topic. "Should it be `isDisabled` or `disabled`?" rather than "The boolean prefix". "Is loading just disabled with a spinner?" rather than "Loading and disabled".

This is not decoration. A question title tells the reader whether this section is the one they need, which is what makes the document scannable six months later. A topic-noun title requires them to already know the vocabulary, which is exactly what they came here to learn.

## Tables support the prose; they do not replace it

A table earns its place when it does something prose cannot: put a before and after side by side, or compare four options across three axes the reader already understands. It fails when it is doing the explaining.

Two tests. **Could a reader who has read only the surrounding prose understand this table?** If the table is where the concepts are introduced, move them into the prose and keep the table for the comparison. **Does removing the table lose information, or only lose tidiness?** If the paragraph above already says everything, cut the table.

A guide whose argument lives in its tables reads as a report. The register here is a guide, and the difference is that a guide explains.

## The two example forms every guide carries

**A worked before/after case for each major claim.** A concrete scenario walked end to end with real values: here is the situation, here is the version that looks reasonable, here is exactly what it costs, here is the corrected version. Two code fences beside each other, or two table rows, or a five-line arithmetic walk. The test is whether a reader could reproduce the failure in their own file from what you wrote. A claim that resists this treatment usually has not been understood well enough to write about yet.

**Named traps wherever a section has more than one way to go wrong.** A short run of them, each with what it looks like, why it happens, and what it breaks. Prefer traps a real system hit and documented, because those come with evidence; label invented ones as illustrative. Write them as prose with a bolded lead, or as a table where the shape genuinely repeats. A gallery of five traps in a table is fine; a gallery of two is two paragraphs.

Both forms exist to make disadvantages as concrete as advantages. A guide whose costs are abstract and whose benefits are specific has already picked a side without arguing for it.

## Write it as a lesson, not a report

A guide is explanation, in the Diátaxis sense: it is read to understand, so its tone is discursive and it walks the reader through. Diátaxis keeps explanation apart from reference, which is austere lookup ([Diátaxis, explanation](https://diataxis.fr/explanation/)). This skill adds a third kind to keep apart: evidence notes, saying how each fact was established. Mixed into the explanation, reference and evidence notes make it read as a report. So the guide keeps each in its own place: the explanation in the numbered sections, the lookup in the cheat sheet, the evidence notes in `What to re-check later` and `Sources`.

**Start where the reader is.** Name the reader and what they already know before writing a line. For most of these guides that is a designer: auto layout, variants, instances and padding are theirs, but code is not. Open with what the reader can see and already understands (what changes on screen), and only then bring in a mechanism from another discipline. Explain that mechanism in the reader's terms, through an example they know ("padding written as leading and trailing instead of left and right"), before naming it. A code term the reader needs to pass on goes after the plain explanation, flagged for the developer ("For the developer: `ps-` instead of `pl-`"). A section that only makes sense to someone who already knows how code works has skipped a step. On the right-to-left guide, a person stopped at its first section, which asked whether Figma could mirror "the way code does": "you cannot start with that if I have no context of how code works", and at "if your spacing is": "what spacing? where? how?" (2026-11-04).

**Short paragraphs, one idea each.** Two to four sentences, rarely past 70 words. A paragraph that explains a mechanism, gives its example and draws the lesson is three paragraphs. A run of parallel items (a checklist, the things to measure) is a bulleted list, not a sentence with semicolons. Long blocks are the first thing a reader sees, before a word is read, and they read as a report (2026-11-04: "we shouldn't have so long paragraphs", on a 140-word block).

**Advice names the place and the steps.** "Mark where it mirrors" is not advice until it says where and how: which panel, which property, what to type ("in the component's description, add a line `Right to left: mirrors`"; "select the icon, and in the Design panel's instance section choose Create instance swap property"). A step the reader can't carry out from the sentence alone is a vague claim, cut or made specific as *Specifics are the texture* says (2026-11-04: "mark where, how? often advice is very vague").

**No packed openers.** The answering opening paragraph stays: one or two plain sentences. What it is not is a string of label-and-answer pairs ("Digits: as typed. Punctuation: follows the paragraph. Mixed text: isolate it."), which is *Explain, do not compress* failing at the top of a section. Give the plain answer, then the situation the reader is in, then one point at a time, each with its example (2026-11-04: "this is the super compact report style that i don't like").

**Never make the reader wait for the point.** A claim is explained where it is made. A cross-reference ("see section 5") may point to more detail, never stand in for the explanation: "only some token names do (section 5)" leaves the reader holding a vague claim for four sections. Give the example on the spot (`spacing.left` lands on the wrong side in Arabic; `spacing.inline-start` doesn't), then point onward if there is more (2026-11-04).

**Show what is visual.** Where the topic is something on a screen (a layout, a mirrored row, padding, a truncated label), the running example is drawn, not only described. A paragraph asking the reader to "picture a settings row" is a diagram not yet made. Draw it as inline SVG in the markdown (the reading site renders it; `<title>` and `role="img"` carry its text alternative), on a light ground, with real labels in the real script, no blank lines inside the `<svg>` block (they end the HTML block in markdown), and a before and after side by side where the point is a change. Give each `<svg>` its own spacing, `style="display:block;width:100%;height:auto;margin:2em 0"`, because an svg is inline by default, so a viewer's paragraph margins never reach it and it sits against the text above; the person reads these in more than one Markdown viewer. Keep a word in another script out of the middle of an English sentence: "in Arabic it's تسجيل الدخول, 12" renders with its comma and number scrambled, so put it in parentheses at the end of a clause. A run of prose with no figure, past about 300 words, is the cue to look for what to draw: the same person stopped twice at long sections with no images (2026-11-04: "we shouldn't have sections this long without images"). Render the diagrams in a browser and look at them before delivering: Arabic or Hebrew text in SVG anchors the opposite way under `direction="rtl"`, which is exactly the kind of mistake only a look catches.

**Talk about the problem, not to the reader.** The guide never uses the second person: no "you", no "your". The collection is read as editorial pieces, and "you" assumes the reader's situation (their library, their team, their deadline) when the guide cannot know it. Address the problem instead, through the people in it: "a team building this", "the designer", "a library with forty components". Imperatives stay where they belong, in the advice ("Add a line to the component's description"). The register is still direct and plain, with contractions where speech would use them. In experiments with students in multimedia lessons, a conversational, second-person version of the same material taught better than a formal one. In a meta-analysis, retention improved (d = 0.30) and transfer more (d = 0.54) ([Ginns, Martin and Marsh, 2013](https://doi.org/10.1007/s10648-013-9228-0)). The effect was largest in lessons under about 35 minutes, so expect less of it over a long guide. Mayer, who named it the *personalization principle*, adds that it works best when not overdone ([Mayer, Cambridge Handbook of Multimedia Learning](https://www.cambridge.org/core/books/abs/cambridge-handbook-of-multimedia-learning/principles-of-multimedia-learning-based-on-social-cues-personalization-voice-and-image-principles/19309D764FD015A556334531A463DE03)). Dropping the "you" is a deliberate editorial choice that gives up part of that effect: a modest one, largest in short lessons, which these long pieces are not. The guide keeps the plain speech and directness that remain. Google's developer style guide asks for the second person ([Google, second person](https://developers.google.com/style/person)), a developer-documentation convention; these pieces are essays. Directness is not chumminess: no jokes, no "don't worry", no telling the reader how they feel. And there is no narrator either, since the no-"I" rule below still holds. `grep -niE "\byou(r|rs|rself|rselves)?\b"` over the body, ignoring quoted speech and URLs, returns nothing.

**Keep evidence status out of the explanation.** A sentence explaining how auto layout works should not also report that the forum thread was re-read in November, has six replies, and that a summary of another page could not be confirmed. Say what is true, as plainly as the evidence allows, and cite it. Where the reader's trust really does change with the source, one plain clause does it ("the vendor says", "Figma's own help page says"), and the detail of how it was checked moves to `What to re-check later`. A test of the draft: read a paragraph with every parenthesis and every source-status clause removed; if it reads better and says the same thing, the clauses belonged at the end.

**One running example, not a stream of them.** A section is carried by one scenario the reader can picture (a settings row, a `Save` button, a filter chip) and comes back to it as the explanation develops. Further examples join only when they show something the running one cannot, and each is introduced by what it shows. A run of systems or plugins named one after another is a list for `Sources`, not a paragraph. If a section's paragraphs could be reordered without anyone noticing, it is a stream and needs its thread.

**Lead into each fact.** Before a number, a table or a system's story, say plainly what question it answers ("How much of a library does this affect? The count below answers it."), never as a teaser or a guess at what the reader expects. The connective sentences ("that's why", "the catch is") are what turn facts into a piece someone can read through, and cutting them for density is the report failure again.

## Voice rules

These define the deliverable. Violating them produces a different, worse artifact.

**Explain, do not compress.** The failure mode of a technical guide is a correct sentence nobody can use. When a claim depends on a mechanism, spend the paragraph explaining the mechanism. When a term is load-bearing, define it where it first appears, in a clause, without ceremony. When two things are easy to confuse, say plainly that they are different and what each governs. Length is not the enemy; density with no way in is.

**State the claim before the caveat.** A sentence that hedges before it commits reads as unsure of a position the evidence actually supports: "in some contexts a shared core can work well, though" buries the claim a reader has to dig for. Say the position, then the exception: "Shared core wins where both sides are live. It costs more where one side is still being written." This governs sentence and paragraph order, not honesty about uncertainty: where the evidence is genuinely split, land a verdict after naming both sides (see Mixed feelings allowed, below), rather than declining to land one.

**Never end a section without the reader knowing what it said.** The answering opening paragraph and the advice at the bottom are both load-bearing for this. If a reader could finish a section and not be able to state its conclusion, the section has failed regardless of how well it argues.

**Educational, not paternalistic.** No "here's something reassuring," no "as you'll remember," no "the trap that trips everyone," no telling the reader what to pin above their desk. Respect that the reader is a competent practitioner meeting good evidence for the first time. When something genuinely confuses most people, say so as a fact about the material ("the confusing part, worth flagging"), not as a prediction about the reader.

**State things; don't perform them.** No signposting ("let's dive in"), no manufactured punchlines or staccato drama, no aphorism formulas, no rhetorical questions as section hooks beyond the section title itself.

**No em dashes or en dashes anywhere in the final file.** Replace each with a period, comma, colon, or parentheses, or restructure. This is a hard rule. (Hyphens inside token names like `heading-01` are fine; those are identifiers, not punctuation.)

**Specifics are the texture.** Exact values, real token names, version numbers, dates, measured outcomes (a weight of 653, an 8% coverage figure, a 1-second spinner delay). Vague claims get cut or re-verified, never padded.

**Tell the system stories.** A named system that renamed something, and why, is worth more than three sentences of principle. Shopify collapsing seven booleans into two enums, Chakra dropping the `is` prefix, GOV.UK's scale point 36 rendering at 27px: each of those is a story a reader remembers and can retell in their own review. Reach for one wherever a claim would otherwise be abstract.

**At most one recurring image, and most guides need none.** Real token names and worked cases (Specifics are the texture, above) are the guide's default texture; a metaphor is the exception, not a habit. Where a topic has a relationship abstract enough to need a picture (Core as a foundation two sibling libraries build on, tokens as plumbing), one image may resurface two or three times across the guide, stated plainly rather than played for effect. It does not get reinvented per section, and a section with nothing to hang doesn't get one manufactured for it.

**Narrate changes in the world, never changes in the document.** A guide gets revised, and the temptation is to write the revision into the body: "the previous version of this guide said X, that is wrong, here is Y." A first-time reader, who is most readers, now has to process a correction to something they never read before reaching the answer. Fix the body so it simply states the current truth, and put the record of what changed in `What to re-check later`, where a returning reader will look for it.

The distinction that matters: if **the world** changed, that belongs in the body and is often the most interesting thing in the section (CSS gained percentage letter-spacing, Firefox shipped `text-box-trim`, GOV.UK moved a scale point). If **the guide** was wrong, the body says the right thing and the correction is recorded at the end. Sources sections and re-check sections are inherently version-scoped and may reference earlier revisions freely.

**No narrator. A stray "I" or "my" in the body is a defect, not a slip.** The guide has no named author, unlike the practitioner voices it studies (Perez-Cruz, Frost and Pitre all write as an identified person describing their own work); a first-person aside, "the default I would suggest," "the one I got wrong first time," borrows an authority the anonymous register has not earned and claims nowhere else. `grep -woiE "\bI\b|\bmy\b"` over the body should return nothing except inside quoted titles and proper nouns: a cited article called *How I Organize Variables in Figma* is fine, the guide's own sentences are not.

**Mixed feelings allowed.** Where the evidence is genuinely split, say so and explain what each side is optimising for. A guide with a clean answer to everything has not looked hard enough. The per-section advice still has to land a verdict on the split, phrased as judgment.

**Opinionated ending.** The short version resolves to the reader's stated context, marks consensus against judgment, and says what to write down for the people downstream. Where a change-management lesson exists (aliases, deprecation paths, the fact that every good system has renamed something), it belongs there rather than in a separate closing meditation.

## What to leave alone

Every rule above is a way to improve a draft, and each one can be applied until it damages the writing. Both known failures of this skill came from over-applying a correction rather than from missing one: an essay register rewritten into wall-to-wall tables, then the tables stripped to almost none. Aim at the specific defect, then stop.

Concretely, do not "fix" these:

- **A long section on a genuinely complex axis.** Length is not padding when the mechanism takes a paragraph to explain. Compress the dull parts, not the load-bearing ones.
- **Formal or technical vocabulary that is correct.** The vocabulary to cut is the small set of inflated words, not everything that sounds precise. `advance width`, `pseudo-class` and `units-per-em` are the right words.
- **Repetition of a term.** Cycling synonyms for the same concept is worse than repeating it. If it is the override matching mechanism throughout, call it that throughout.
- **A table that genuinely compares.** The rule is that tables support prose, not that tables are suspect. A before/after or a five-system comparison is doing real work.
- **An unresolved verdict where the evidence is split.** Say the evidence is split and still land a judgment. That is honesty, not indecision.
- **Quirks in an existing guide you are revising.** If a section already reads well, leave it. A revision that rewrites everything loses the parts a reader liked and costs you the chance to notice what actually needed changing.

**If the `humanizer` skill is installed**, run its audit pass on the draft before saving. It covers the general prose tells (inflated significance, promotional language, superficial `-ing` clauses, rule of three, vague attributions, filler, hedging) at a level of detail this file does not duplicate, and the rules here deliberately keep only what is specific to a research guide. The one hard rule the two share is the em dash ban, and a conflict is resolved in favour of banning them.

## Mechanics

- Write the file to the outputs directory and present it. Deep mode never ends with prose-only in chat.
- Keep quotes to the skill's limits (at most one per source, under 15 words). Verbatim identifiers are facts and are reproduced exactly.
- **Sources are markdown list items, each with a link**, at the deepest URL actually resolved: the specific help article, issue, or file in the repo, not the site root. Group under **Primary** and **Commentary** headings. Where several pages from one source are cited, give each its own line rather than collapsing them into a prose run. A source you know exists but never opened gets its own line under a "Cited but not resolved to a URL" heading, never an invented URL.
- **Never overwrite a file section you have not read.** Rewriting an existing guide means reading all of it first, including the sources. A rewrite that silently drops a source block is a worse outcome than not rewriting at all, and the loss is usually unrecoverable.
- If the research feature produced a report artifact earlier in the conversation, treat it as raw material: re-verify anything surprising, restructure by decision axis, and rewrite entirely in this voice. Never paste report sections into the guide.
- Filename: descriptive kebab-case. `-guide.md` is conventional but not required when a plainer name describes the contents better (`typography-naming.md`).
