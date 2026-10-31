# Standards

The rules the toolkit holds itself and every project to: how a Figma library is built and named, how its snapshot reaches code, how an interface looks and reads, how its code is written, and what a skill or plugin must be before it ships. Each rule says why it exists, what evidence admitted it, and which check enforces it, so a rule can be trusted, tested and retired.

## Which standard to read

| Standard | Read it when you… |
|---|---|
| [toolkit-standard](toolkit-standard.md) | change anything in the toolkit. It is the root: how a rule is admitted, enforced and changed (§C) and how the parts fit together (§D). |
| [figma-standard](figma-standard.md) | build, name or audit a component library in Figma. |
| [snapshot-standard](snapshot-standard.md) | work on how a design file reaches a project's stored snapshot, or on a tool that reads it. |
| [design-standard](design-standard.md) | design or review an interface: UX, interaction, visual, content, accessibility. |
| [code-standard](code-standard.md) | write the HTML, CSS and JavaScript of a site, an app or a design-system component. |
| [skill-standard](skill-standard.md) | write or change a skill (Part A) or a Figma plugin (Part B). |

A project can override a design or naming rule in its own context document, with a reason, as one `**Overrides:**` line; an instruction given in the session outranks both. Guidance past the rules, with sources, is in [`knowledge/`](../knowledge/README.md).

## How a rule is cited

By handle, never by copying its text: `figma-standard rule 11`, `toolkit-standard §D 6`, `skill-standard §A clause H`. A copy freezes and starts to disagree with the original; `tools/toolkit-check/check-standards.mjs` resolves every handle and fails on one that points nowhere.

## What else is here

- [`audit-settings.json`](audit-settings.json): the house defaults the audit tools read (markers, option order, token collections), which a project's context document can override per library.
- [`naming-preferences.json`](naming-preferences.json): the house's naming preferences (separators, the private prefix, property case and words), owned by figma-standard and read by every tool; a project overrides them in its context document's `naming-preferences` block, and an audit files a departure as a preference, never a defect.
- [`changelog/`](changelog/): one history file per standard, newest first. A standard's version and its history line move in the same commit.
- [`tests/`](tests/): `check.sh` (the structural checks over skills, plugins and standards, run by `bin/check`), `check-frontmatter.sh`, `scan-clause-d.py` (project data that escaped into a skill) and `cases.md` (the cases that test the standards themselves).

## Changing a standard

Follow [toolkit-standard](toolkit-standard.md) §C: a rule enters from a real run or a decision, names its check, bumps the version and its history line together, and `bin/check` stays green.
