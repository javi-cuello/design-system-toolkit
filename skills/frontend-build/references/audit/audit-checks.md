# The audit's checks and report

The detail behind the audit steps in [SKILL.md](../../SKILL.md), *Audit*. It says which checks run on which input, how to look at the screenshots, and how to write findings. The judgement pass itself is [audit-pass.md](audit-pass.md).

## Contents

- [What each input takes](#what-each-input-takes)
- [Looking at the screenshots](#looking-at-the-screenshots)
- [Walking the whole of the knowledge](#walking-the-whole-of-the-knowledge)
- [Reporting findings](#reporting-findings)

## What each input takes

| Input | What is read | Then judgement |
|---|---|---|
| **A design** (Figma) | The live file, which an audit reads by toolkit-standard §D 5's exception; the stored snapshot for everything else | design-standard, area by area, on screenshots of the frames |
| **A build** (a URL or a running site) | The rendered page in a headless browser | design-standard and code-standard's *needs a read* rules, on screenshots at phone and desktop width, both themes |
| **Both** | Each of the above | Each of the above. The comparison of the two is parity's, so name `design-code-parity` instead of comparing |

**A design's mechanical checks.** Run the Figma audit skills by name:

- `figma-components-audit`: each component's structure, tokens, states, contrast and targets (figma-standard rules 26, 31 and 32 among them);
- `figma-foundations-audit`: the file as a whole, meaning page order, name collisions, separators and part naming.

No skill checks a whole screen's contrast yet. Read it at the judgement pass.

**A build's mechanical checks.**

| Command | What it checks |
|---|---|
| `node tools/ui-check/check.mjs <url> … --project <label>` | design-standard's mechanical rules |
| `node tools/ui-check/axe.mjs <url> …` | WCAG A/AA, by axe-core |
| `node tools/project-check/check.mjs --repo <dir>` | In a project: code-standard's gates |

The project gates are `tools/css-lint`, `tools/tokens`, the structure check of `tools/parity/pages.mjs`, axe and overflow.

**Both.** Run each of the above in one pass.

## Looking at the screenshots

Take the screenshots in the same run as the checks:

```
node tools/ui-check/check.mjs <url> … --project <label> --shots <dir>
```

- **Which shots.** Every page type the change touches, at desktop width in light and dark, and at phone width.
- **What to look for.** Open every file and look for what no check measures. Examples: crowded tables, a label repeated on every row, a grid with empty cells. Look for anything clipped, overlapping or unreadable in one theme.
- **Who looks.** A person or the session itself. Work an agent did is looked at the same way; its own report that it looked is not the look.
- **Not a review.** Permission to push without asking is not a review either.

This is toolkit-standard §D 0's sixth question, done as a step rather than remembered.

*Why:* a batch of agent-made visual fixes was once pushed on permission, with its screenshots never opened. Within minutes the maintainer found a nine-column table of red marks, a status repeated on every row, and tile grids with empty cells. Every gate had passed.

## Walking the whole of the knowledge

`knowledge/README.md` lists the knowledge pages. Walk every one that applies, section by section, against every page type. Record each gap as three parts: the site does X, the section says Y, the fix.

| Item's weight | How it is walked |
|---|---|
| `weak` | Not walked: it is a research question, not guidance (toolkit-standard §D 21) |
| `contested` | A gap is a choice, not a defect: record which way the site went, and why |
| Any other | A gap is a finding |

*Why:* a docs site was audited, and every finding was fixed and re-verified. A later walk of the knowledge found dozens of gaps the audit had never raised. There was no `<time>` on any date, no provenance on component pages, and filters were dead without script. The auditor had treated the knowledge as recommendations, and nothing walked it page by page.

## Reporting findings

Write each finding as one line a person can act on, the way design-standard rule 10 asks:

1. what is wrong, and what it does to people;
2. the fix;
3. the rule it breaks, by handle, in brackets after the sentence, for the maintainer who records it.

- **Order.** Group findings by area, most severe first, and name what was not checked.
- **The knowledge is the default.** The knowledge pages that apply to a screen are the default it is held to, not suggestions. A deviation from one is a finding, cited by its page and section. The exception is a ruling on it in the project's context document (toolkit-standard §D 14).
- **Only a rule is a breach.** Only a rule is cited as a breach of a standard.
- **Accepted deviations.** A deviation the project accepts is recorded as that ruling, not raised again next time.
