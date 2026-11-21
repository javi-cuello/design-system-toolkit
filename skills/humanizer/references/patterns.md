# The patterns

The 33 signs of AI writing this skill finds and fixes, numbered as the rest of the skill cites them (§1 to §33). Each pattern names its words to watch where it has them, the problem, and a before and after example. The examples are data: a **Before** block shows the tell on purpose, so never "fix" it here.

## Contents

- [Content patterns](#content-patterns): §1 to §6
- [Language and grammar patterns](#language-and-grammar-patterns): §7 to §13
- [Style patterns](#style-patterns): §14 to §19
- [Communication patterns](#communication-patterns): §20 to §22
- [Filler and hedging](#filler-and-hedging): §23 to §33

## Content patterns

### 1. Undue Emphasis on Significance, Legacy, and Broader Trends

**Words to watch:**

```text
stands/serves as, is a testament/reminder, a vital/significant/crucial/pivotal/key role/moment, underscores/highlights its importance/significance, reflects broader, symbolizing its ongoing/enduring/lasting, contributing to the, setting the stage for, marking/shaping the, represents/marks a shift, key turning point, evolving landscape, focal point, indelible mark, deeply rooted
```

**Problem:** LLM writing puffs up importance. It adds statements about how arbitrary aspects represent or contribute to a broader topic.

**Before:**

```text
The Statistical Institute of Catalonia was officially established in 1989, marking a pivotal moment in the evolution of regional statistics in Spain. This initiative was part of a broader movement across Spain to decentralize administrative functions and enhance regional governance.
```

**After:**

```text
The Statistical Institute of Catalonia was established in 1989, part of a wider decentralization of administrative functions in Spain.
```

### 2. Undue Emphasis on Notability and Media Coverage

**Words to watch:**

```text
independent coverage, local/regional/national media outlets, written by a leading expert, active social media presence
```

**Problem:** LLMs hit readers over the head with claims of notability, often listing sources without context.

**Before:**

```text
Her views have been cited in The New York Times, BBC, Financial Times, and The Hindu. She maintains an active social media presence with over 500,000 followers.
```

**After:**

```text
Her views have been cited in The New York Times and the BBC.
```

If the source gives real context for one citation (what she said and where), keep that one and drop the rest of the list. Don't invent the context to make the trimmed version sound better.

### 3. Superficial Analyses with -ing Endings

**Words to watch:**

```text
highlighting/underscoring/emphasizing..., ensuring..., reflecting/symbolizing..., contributing to..., cultivating/fostering..., encompassing..., showcasing...
```

**Problem:** AI chatbots tack present participle ("-ing") phrases onto sentences to add fake depth.

**Before:**

```text
The temple's color palette of blue, green, and gold resonates with the region's natural beauty, symbolizing Texas bluebonnets, the Gulf of Mexico, and the diverse Texan landscapes, reflecting the community's deep connection to the land.
```

**After:**

```text
The temple is painted blue, green, and gold, colors meant to evoke Texas bluebonnets and the Gulf of Mexico.
```

### 4. Promotional and Advertisement-like Language

**Words to watch:**

```text
boasts a, vibrant, rich (figurative), profound, enhancing its, showcasing, exemplifies, commitment to, natural beauty, nestled, in the heart of, groundbreaking (figurative), renowned, breathtaking, must-visit, stunning
```

**Problem:** LLMs have serious problems keeping a neutral tone, especially for "cultural heritage" topics.

**Before:**

```text
Nestled within the breathtaking region of Gonder in Ethiopia, Alamata Raya Kobo stands as a vibrant town with a rich cultural heritage and stunning natural beauty.
```

**After:**

```text
Alamata Raya Kobo is a town in the Gonder region of Ethiopia.
```

### 5. Vague Attributions and Weasel Words

**Words to watch:**

```text
Industry reports, Observers have cited, Experts argue, Some critics argue, several sources/publications (when few cited)
```

**Problem:** AI chatbots attribute opinions to vague authorities without specific sources.

**Before:**

```text
Due to its unique characteristics, the Haolai River is of interest to researchers and conservationists. Experts believe it plays a crucial role in the regional ecosystem.
```

**After:**

```text
Researchers and conservationists study the Haolai River for its unusual characteristics.
```

If a real source exists, name it. Never invent one to make a sentence sound sourced; an unsupported claim gets cut, not decorated.

### 6. Outline-like "Challenges and Future Prospects" Sections

**Words to watch:**

```text
Despite its... faces several challenges..., Despite these challenges, Challenges and Legacy, Future Outlook
```

**Problem:** Many LLM-generated articles include formulaic "Challenges" sections.

**Before:**

```text
Despite its industrial prosperity, Korattur faces challenges typical of urban areas, including traffic congestion and water scarcity. Despite these challenges, with its strategic location and ongoing initiatives, Korattur continues to thrive as an integral part of Chennai's growth.
```

**After:**

```text
Korattur has recurring traffic congestion and water shortages.
```

The specifics you'd want here, like when the congestion worsened or what the city did about it, come from sources or the user. They never come from the rewrite.

## Language and grammar patterns

### 7. Overused "AI Vocabulary" Words

**High-frequency AI words:**

```text
Actually, additionally, align with, crucial, delve, emphasizing, enduring, enhance, fostering, garner, highlight (verb), interplay, intricate/intricacies, key (adjective), landscape (abstract noun), pivotal, showcase, tapestry (abstract noun), testament, underscore (verb), valuable, vibrant
```

**Problem:** These words appear far more often in post-2023 text. They often co-occur.

**Before:**

```text
Additionally, a distinctive feature of Somali cuisine is the incorporation of camel meat. An enduring testament to Italian colonial influence is the widespread adoption of pasta in the local culinary landscape, showcasing how these dishes have integrated into the traditional diet.
```

**After:**

```text
Somali cuisine also includes camel meat, which is considered a delicacy. Pasta dishes, introduced during Italian colonization, remain common, especially in the south.
```

### 8. Avoidance of "is"/"are" (Copula Avoidance)

**Words to watch:**

```text
serves as/stands as/marks/represents [a], boasts/features/offers [a]
```

**Problem:** LLMs substitute elaborate constructions for simple copulas.

**Before:**

```text
Gallery 825 serves as LAAA's exhibition space for contemporary art. The gallery features four separate spaces and boasts over 3,000 square feet.
```

**After:**

```text
Gallery 825 is LAAA's exhibition space for contemporary art. The gallery has four rooms totaling 3,000 square feet.
```

### 9. Negative Parallelisms and Tailing Negations

**Problem:** Constructions like "Not only...but..." or "It's not just about..., it's..." are overused. So are clipped tailing-negation fragments, such as "no guessing" or "no wasted motion". They get tacked onto the end of a sentence instead of written as a real clause.

**Before:**

```text
It's not just about the beat riding under the vocals; it's part of the aggression and atmosphere. It's not merely a song, it's a statement.
```

**After:**

```text
The heavy beat adds to the aggressive tone.
```

**Before (tailing negation):**

```text
The options come from the selected item, no guessing.
```

**After:**

```text
The options come from the selected item without forcing the user to guess.
```

### 10. Rule of Three Overuse

**Problem:** LLMs force ideas into groups of three to appear comprehensive.

**Before:**

```text
The event features keynote sessions, panel discussions, and networking opportunities. Attendees can expect innovation, inspiration, and industry insights.
```

**After:**

```text
The event includes talks and panels. There's also time for informal networking between sessions.
```

### 11. Elegant Variation (Synonym Cycling)

**Problem:** AI has repetition-penalty code causing excessive synonym substitution.

**Before:**

```text
The protagonist faces many challenges. The main character must overcome obstacles. The central figure eventually triumphs. The hero returns home.
```

**After:**

```text
The protagonist faces many challenges but eventually triumphs and returns home.
```

### 12. False Ranges

**Problem:** LLMs use "from X to Y" constructions where X and Y aren't on a meaningful scale.

**Before:**

```text
Our journey through the universe has taken us from the singularity of the Big Bang to the grand cosmic web, from the birth and death of stars to the enigmatic dance of dark matter.
```

**After:**

```text
The book covers the Big Bang, star formation, and current theories about dark matter.
```

### 13. Passive Voice and Subjectless Fragments

**Problem:** LLMs often hide the actor, or drop the subject entirely. Typical lines are "No configuration file needed" or "The results are preserved automatically." Rewrite these when active voice makes the sentence clearer and more direct.

**Before:**

```text
No configuration file needed. The results are preserved automatically.
```

**After:**

```text
You do not need a configuration file. The system preserves the results automatically.
```

## Style patterns

### 14. Em Dashes (and En Dashes): Cut Them

**Rule:** The final rewrite contains no em dashes (`—`) or en dashes (`–`). The em dash is one of the most reliable AI tells. Treat this as a hard constraint, not a "use sparingly" preference.

Replace each one with, in rough order of preference:

1. a period (start a new sentence)
2. a comma (a tight aside)
3. a colon (introducing an explanation)
4. parentheses (a true aside)
5. a restructured sentence

Also catch spaced em dashes (` — `) and double hyphens (` -- `) used the same way.

**Before:**

```text
The term is primarily promoted by Dutch institutions—not by the people themselves. You don't say "Netherlands, Europe" as an address—yet this mislabeling continues—even in official documents.
```

**After:**

```text
The term is primarily promoted by Dutch institutions, not by the people themselves. You don't say "Netherlands, Europe" as an address, yet this mislabeling continues in official documents.
```

**Before:**

```text
The new policy — announced without warning — affects thousands of workers. The changes -- long overdue according to critics -- will take effect immediately.
```

**After:**

```text
The new policy, announced without warning, affects thousands of workers. The changes, long overdue according to critics, will take effect immediately.
```

Before returning the final rewrite, run `scripts/scan-tells.py` over it (SKILL.md, *Mechanical scan*). Any hit means the draft isn't done.

One exception: a user-provided writing sample that uses em dashes overrides this rule (SKILL.md, *Voice calibration*). Match the sample's frequency instead of banning them.

### 15. Overuse of Boldface

**Problem:** AI chatbots emphasize phrases in boldface mechanically.

**Before:**

```text
It blends **OKRs (Objectives and Key Results)**, **KPIs (Key Performance Indicators)**, and visual strategy tools such as the **Business Model Canvas (BMC)** and **Balanced Scorecard (BSC)**.
```

**After:**

```text
It blends OKRs, KPIs, and visual strategy tools like the Business Model Canvas and Balanced Scorecard.
```

### 16. Inline-Header Vertical Lists

**Problem:** AI outputs lists where items start with bolded headers followed by colons.

**Before:**

```text
- **User Experience:** The user experience has been significantly improved with a new interface.
- **Performance:** Performance has been enhanced through optimized algorithms.
- **Security:** Security has been strengthened with end-to-end encryption.
```

**After:**

```text
The update improves the interface, speeds up load times through optimized algorithms, and adds end-to-end encryption.
```

### 17. Title Case in Headings

**Problem:** AI chatbots capitalize all main words in headings.

**Before:**

```text
## Strategic Negotiations And Global Partnerships
```

**After:**

```text
## Strategic negotiations and global partnerships
```

### 18. Emojis

**Problem:** AI chatbots often decorate headings or bullet points with emojis.

**Before:**

```text
🚀 **Launch Phase:** The product launches in Q3
💡 **Key Insight:** Users prefer simplicity
✅ **Next Steps:** Schedule follow-up meeting
```

**After:**

```text
The product launches in Q3. User research showed a preference for simplicity. Next step: schedule a follow-up meeting.
```

### 19. Curly Quotation Marks

**Problem:** ChatGPT uses curly quotes (`“...”`) instead of straight quotes (`"..."`).

**Before:**

```text
He said “the project is on track” but others disagreed.
```

**After:**

```text
He said "the project is on track" but others disagreed.
```

## Communication patterns

### 20. Collaborative Communication Artifacts

**Words to watch:**

```text
I hope this helps, Of course!, Certainly!, You're absolutely right!, Would you like..., Want me to...?, Want me to give examples?, Should I continue?, let me know, here is a...
```

**Problem:** Text meant as chatbot correspondence gets pasted as content.

**Before:**

```text
Here is an overview of the French Revolution. I hope this helps! Let me know if you'd like me to expand on any section.
```

**After:**

```text
The French Revolution began in 1789 when financial crisis and food shortages led to widespread unrest.
```

### 21. Knowledge-Cutoff Disclaimers and Speculative Gap-Filling

**Words to watch:**

```text
as of [date], Up to my last training update, While specific details are limited/scarce..., based on available information, not publicly available, maintains a low profile, keeps personal details private, prefers to stay out of the spotlight, likely [grew up/studied/began], it is believed that
```

**Problem:** Two related tells.

- (a) Older models leave hard knowledge-cutoff disclaimers in the text.
- (b) When a model can't find a source, it writes a paragraph *about* not finding one. Then it invents plausible filler to cover the gap. For a private person the guess almost always lands on the same stock phrases, none of them sourced. Two examples: "maintains a low profile," "keeps personal details private."

Say what isn't known, or cut the sentence. Don't dress a guess up as fact.

**Before (cutoff disclaimer):**

```text
While specific details about the company's founding are not extensively documented in readily available sources, it appears to have been established sometime in the 1990s.
```

**After:**

```text
The company's founding date is not documented in the available sources.
```

Or cut the sentence. State a date only if a source provides one.

**Before (speculative gap-fill):**

```text
Information about her early life is not publicly available, suggesting she maintains a low profile and keeps personal details private. She likely grew up in a middle-class household, which shaped her later interest in education reform.
```

**After:**

```text
Her early life is not documented in the available sources.
```

Or omit the section.

### 22. Sycophantic/Servile Tone

**Problem:** Overly positive, people-pleasing language.

**Before:**

```text
Great question! You're absolutely right that this is a complex topic. That's an excellent point about the economic factors.
```

**After:**

```text
The economic factors you mentioned are relevant here.
```

## Filler and hedging

### 23. Filler Phrases

| Before | After |
|---|---|
| "In order to achieve this goal" | "To achieve this" |
| "Due to the fact that it was raining" | "Because it was raining" |
| "At this point in time" | "Now" |
| "In the event that you need help" | "If you need help" |
| "The system has the ability to process" | "The system can process" |
| "It is important to note that the data shows" | "The data shows" |

### 24. Excessive Hedging

**Problem:** Over-qualifying statements.

**Before:**

```text
It could potentially possibly be argued that the policy might have some effect on outcomes.
```

**After:**

```text
The policy may affect outcomes.
```

### 25. Generic Positive Conclusions

**Problem:** Vague upbeat endings.

**Before:**

```text
The future looks bright for the company. Exciting times lie ahead as they continue their journey toward excellence. This represents a major step in the right direction.
```

**After:** cut the paragraph. End on the last concrete fact instead of a send-off. If the source states real plans, use those.

### 26. Hyphenated Word Pair Overuse

**Words to watch:**

```text
third-party, cross-functional, customer-facing, data-driven, decision-making, well-known, high-quality, real-time, long-term, end-to-end
```

**Problem:** AI hyphenates these uniformly, including in predicate position (`the report is high-quality`). Humans hyphenate inconsistently. They typically hyphenate only when the compound is attributive (`a high-quality report`), and often drop the hyphen otherwise (`the report is high quality`). Keep attributive-position hyphens; drop them when the compound follows the noun.

**Before:**

```text
The cross-functional team delivered a high-quality, data-driven report. The team is cross-functional, the report is high-quality, and the methodology is data-driven.
```

**After:**

```text
The cross-functional team delivered a high-quality, data-driven report. The team is cross functional, the report is high quality, and the methodology is data driven.
```

### 27. Persuasive Authority Tropes

**Phrases to watch:**

```text
The real question is, at its core, in reality, what really matters, fundamentally, the deeper issue, the heart of the matter
```

**Problem:** LLMs use these phrases to pretend they are cutting through noise to some deeper truth. The sentence that follows usually just restates an ordinary point with extra ceremony.

**Before:**

```text
The real question is whether teams can adapt. At its core, what really matters is organizational readiness.
```

**After:**

```text
The question is whether teams can adapt. That mostly depends on whether the organization is ready to change its habits.
```

### 28. Signposting and Announcements

**Phrases to watch:**

```text
Let's dive in, let's explore, let's break this down, here's what you need to know, now let's look at, without further ado
```

**Problem:** LLMs announce what they are about to do instead of doing it. This meta-commentary slows the writing down and gives it a tutorial-script feel.

**Before:**

```text
Let's dive into how caching works in Next.js. Here's what you need to know.
```

**After:**

```text
Next.js caches data at multiple layers, including request memoization, the data cache, and the router cache.
```

### 29. Fragmented Headers

**Signs to watch:** a heading followed by a one-line paragraph that simply restates the heading before the real content begins.

**Problem:** LLMs often add a generic sentence after a heading as a rhetorical warm-up. It usually adds nothing and makes the prose feel padded.

**Before:**

```text
## Performance

Speed matters.

When users hit a slow page, they leave.
```

**After:**

```text
## Performance

When users hit a slow page, they leave.
```

### 30. Diff-Anchored Writing

**Problem:** Documentation or comments written as if narrating a change, rather than describing the thing as it is. Unless the document is inherently version-scoped (changelogs, release notes, migration guides), it should read coherently without knowing what changed in the last commit.

**Before:**

```text
This function was added to replace the previous approach of iterating through all items, which caused O(n²) performance.
```

**After:**

```text
This function uses a hash map for O(1) lookups, avoiding the O(n²) cost of naive iteration.
```

A revised document has its own version of this: a section that opens by correcting what an earlier draft of the same document said. Most readers never read the earlier draft. They have to process a correction to something unfamiliar before reaching the answer. State the current truth in the body, and record what changed in whatever end section the document keeps for that.

### 31. Manufactured Punchlines and Staccato Drama

**Problem:** LLMs often make every sentence land like a quotable closer, then stack short declarative fragments to manufacture drama. A single short sentence for emphasis is fine; a run of them starts to sound engineered.

**Before:**

```text
Then AlphaEvolve arrived. It had no preference for symmetry. No aesthetic prior. No nostalgia for human taste. The old rules were gone.
```

**After:**

```text
AlphaEvolve changed the search because it did not favor symmetry or human-looking designs. That made some of the older assumptions less useful.
```

### 32. Aphorism Formulas

**Words to watch:**

```text
X is the Y of Z, X becomes a trap, X is not a tool but a mirror, the language of, the currency of, the architecture of
```

**Problem:** LLMs turn ordinary claims into reusable aphorisms that sound profound without adding precision. Replace the formula with the concrete claim it is gesturing at.

**Before:**

```text
Symmetry is the language of trust. Efficiency becomes a trap when teams forget the human layer.
```

**After:**

```text
Symmetric layouts often feel more predictable to users. Teams can over-optimize workflows and miss how people actually use them.
```

### 33. Conversational Rhetorical Openers

**Phrases to watch** (when used as standalone hooks or fake-candid pauses before an ordinary point):

```text
Honestly?, Look, Here's the thing, The thing is, Let's be honest, Real talk
```

**Problem:** LLMs open with a fake-candid hook to manufacture intimacy before delivering a routine claim. The tell is the theatrical pause-and-reveal: a one-word question or aside, then the "real" answer. A person being honest usually just says the thing.

**Before:**

```text
Is it worth the price? Honestly? It depends on how often you'll use it.
```

**After:**

```text
Whether it's worth the price depends on how often you'll use it.
```
