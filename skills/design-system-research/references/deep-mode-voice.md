# Deep-Mode Deliverable: Voice and Structure

The deep-mode output is an **educational reference guide**. Someone reads it start to finish and comes away understanding the territory, then keeps it open and scans back to one section when a decision comes up. Both uses have to work.

The failure this file exists to prevent is a guide that passes every structural check and is unreadable: numbered sections, correct citations, a verdict per axis, and prose so compressed that a reader finishes a section without knowing what it said. That is the failure mode of a technical guide, and it is much easier to produce than an essay that rambles.

## The two things that make it work

- **It explains the mechanism before it judges.** The reader is told how Figma derives an Auto line height (ascender plus descender plus line gap, over units-per-em) before being told not to use it. That order is what lets a reader decide whether the rule transfers to their situation, and notice when its reason expires.
- **It shows the failure with real values.** Not "percentage line heights inherit badly" but sixteen-pixel body text, a thirty-two-pixel title inheriting a 24px computed value, and the overlapping lines that result. A disadvantage the reader can recognise in their own file beats one they have to take on trust.

## Structure

```
# [Plain descriptive title naming the topic]

[One-line subtitle: what the guide decides, and for whom]

[Researched <month year>. <What was verified against what.>]

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

**The short answer.** [One or two plain sentences. A reader who stops here
has still got something correct and usable.]

[Prose that explains how the thing works before judging it. A concrete
scenario where the question actually comes up. Named systems as evidence,
told as short stories rather than listed. Real token names, real values,
real dates. Jargon defined in passing at first use.

A table wherever it earns its place: a before and after, or a comparison
on axes the prose has already introduced. Never a table the reader meets
before they understand the question.

Advantages and disadvantages argued in prose at equal specificity, or as
bulleted runs where the list is genuinely a list.]

**What to do.** [Ends every numbered section. Written as advice from a
colleague, not a clipped ruling. Says which parts are consensus and which
are this guide's judgment, and names the constraint the advice depends on
where one exists.]

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
[Volatile tool mechanics, spec versions, features in beta, claims resting
on a single source, and an honest note on how good the evidence is.]

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

## Voice rules

These define the deliverable. Violating them produces a different, worse artifact.

**Explain, do not compress.** The failure mode of a technical guide is a correct sentence nobody can use. When a claim depends on a mechanism, spend the paragraph explaining the mechanism. When a term is load-bearing, define it where it first appears, in a clause, without ceremony. When two things are easy to confuse, say plainly that they are different and what each governs. Length is not the enemy; density with no way in is.

**State the claim before the caveat.** A sentence that hedges before it commits reads as unsure of a position the evidence actually supports: "in some contexts a shared core can work well, though" buries the claim a reader has to dig for. Say the position, then the exception: "Shared core wins where both sides are live. It costs more where one side is still being written." This governs sentence and paragraph order, not honesty about uncertainty: where the evidence is genuinely split, land a verdict after naming both sides (see Mixed feelings allowed, below), rather than declining to land one.

**Never end a section without the reader knowing what it said.** The short answer at the top and the advice at the bottom are both load-bearing for this. If a reader could finish a section and not be able to state its conclusion, the section has failed regardless of how well it argues.

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
