# The research collection

Where a deep-mode guide goes, and how it stays consistent with the articles already there. Read it before searching in deep mode.

## A deep-mode guide is an article, not a store

- The guide joins the toolkit's curated collection of editorial pieces in `research/`, at the repo root. It is read like a magazine: one focused question per piece, argued to a clear thesis.
- Before writing, read `research/README.md` for its rules and folders.
- Check the toolkit's knowledge base too. A broad survey of what the knowledge base already holds is not a piece. Narrow it to the one question the knowledge base cannot answer. Or put the finding in the knowledge base instead (SKILL.md Step 8).
- File the guide in the topic folder and sub-topic that fit it.
- `research/` is public, so names and quotes follow toolkit-standard §D 6. A project is "a product library" or "Project A".

## Start from what research/ already holds

Before searching:

1. List the articles in `research/README.md` whose question is this one or a neighbour of it. A neighbour shares the sub-topic, or has a section on the same subject.
2. Read them.
3. If one already asks the question, update it instead of writing a second.
4. If a neighbour covers part of this one, link to that section rather than retelling it. Or move the part to whichever piece owns it.

After writing, go back to each neighbour the finding touches:

1. Correct a fact the new research changed, a number it contradicts, or advice it now disagrees with.
2. Set that article's `updated` day in `research/index.html`.
3. Say in the reply which articles changed and why.

*Why:* articles written one at a time drift apart. An audit of 35 found 19 contradictions and 10 overlapping sections, because no run had read its neighbours.

## Find neighbours by identifier, not by title

Titles and your own words miss an article whose subject is named differently. For example, a surfaces article holds the elevation token names a token-naming piece cites.

Before writing, grep `research/` for:

- every backticked identifier the draft cites: each token, prop and variable name;
- each system's own term for the subject.

Every article a hit lands in is a neighbour. Read it, then link it or name it in the reply as untouched.

*Why:* a run that searched only its own words missed an article that ships the very token names it cited.

## Twenty minutes at most

An article reads in 20 minutes or less. That is 4,760 words at the 238 words a minute the page counts by. Figures (inline `svg`) and comments are not counted. Measure it so:

```sh
perl -0pe 's/<svg.*?<\/svg>//gs; s/<!--.*?-->//gs' FILE | wc -w
```

Over that, the article answers more than one question, or carries evidence that belongs in the knowledge base. Then do one of these:

- Split the second question into its own piece.
- Split one long question into Part 1 and Part 2, each under 20 minutes, linked both ways.
- Move the evidence into the knowledge page and keep the argument here.

Cut repetition before content. Scripts, raw results and experiment data never go in the collection. Keep them in the toolkit or a scratch folder, and state their numbers in the prose.
