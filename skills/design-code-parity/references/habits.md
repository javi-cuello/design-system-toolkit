# Working habits

How to read a snapshot before building from it, and the habits the loop is worked in. [SKILL.md](../SKILL.md) links here.

## Contents

- [Read a snapshot before building from it](#read-a-snapshot-before-building-from-it)
- [The loop to work in](#the-loop-to-work-in)
  - [A fix that is not about this project goes to the toolkit](#a-fix-that-is-not-about-this-project-goes-to-the-toolkit)
  - [Verify narrow, then once](#verify-narrow-then-once)
  - [Fast by default, and the time is part of the verdict](#fast-by-default-and-the-time-is-part-of-the-verdict)
  - [Then look at it, in every state it has](#then-look-at-it-in-every-state-it-has)
  - [Nothing is done until somebody has looked at it](#nothing-is-done-until-somebody-has-looked-at-it)
  - [Read the frame before styling it](#read-the-frame-before-styling-it)

## Read a snapshot before building from it

A snapshot is a diff, and reading it is a step of its own. Do not discover it a component at a time while building. Every arrival, before any code:

1. **Diff the whole snapshot against the last one**. Cover component specs, token files, screen frames, the icon set and the component list in the meta block. Name what moved and what it implies. Look for a component added or renamed, an axis gained, a token whose value changed. Look too for a frame that lost its ready-for-dev mark, and an asset the frames draw that the exporter could not carry.
2. **Say it back to the designer as a list, before building.** Half of it will be intended. The other half is what they want to hear about. One example is a style set to a value that reads differently in CSS. Others are a phone frame left behind a desktop one, or a frame renamed out of the mapped set. The loop's own report is the place to look, not the maintainer's pointing finger.
3. **Separate "the design changed" from "the export changed".** A value the designer moved is work. A value that moved because the exporter measured differently is a bug in the loop, and building on it ships the bug. The tell is whether the frames agree with the component spec. When they disagree, the file that instances the library is stale, not the code.

The report is cheap: a diff and a paragraph. It is what makes the next hour's build the intended one.

## The loop to work in

Each habit below was bought at the cost of a day.

### A fix that is not about this project goes to the toolkit

This loop is the same in every project that runs it. So a fix made inside one repo belongs in `tools/parity/`, or in this skill if it is method, with the repo calling it. Examples: a waiver that should have been bounded, a parser that met an unknown spelling, a gate that let something through.

Decide at the moment the mismatch is found, not at the session's close (toolkit-standard §D 8). The signals are a red row that ends in a waiver, a decision or an `'unset'` ruling. A stylesheet comment saying why the code differs from the design ("Figma draws X, so…") is the same signal.

That change says whether it is the project's fact or the toolkit's lesson, and writes it there in the same commit. A project's fact goes to its context document (§D 12). A toolkit lesson goes to a code- or figma-standard rule, a scaffold file, an engine rule, or a skill rule.

The run helps. `--accept` lists every ruling new since the last accepted run as *lessons to triage*. That covers the mapping's rulings and the stylesheet comments that explain a deviation, in the folders `parity.stylesheets` names. It prints one line per ruling, however many targets share it.

A comment is keyed by its words, not its line. Keyed by line, an insertion re-lists every comment below it, and a reworded comment on an old line is never listed. The run also names a *toolkit candidate* where another registered project rules the same property in the same words.

An accept that finds any lesson is refused, before a browser opens, until `--triaged` names where they went. It names the toolkit file that took them (a rulings log, a standard, a case, checked to exist), or says `none — <why>`.

The check is `lessons.mjs` `triage`, through `tools/project-check/loop.mjs` `where`. That is the verifier every project commit's `Toolkit:` trailer goes through.

Why: a list printed as the index moved on was forgotten by the next run. Two projects once ran this loop with about twenty pieces written twice, each carrying fixes the other lacked. Prove a move by replaying real input through the old path and the new one, and diffing what they write.

### Verify narrow, then once

A full run is a minute, and the temptation is to spend it after every edit. One project ran its suite 115 times in a day. Batch the edits, check each against the one component or screen it touched, and run the whole suite once before the commit.

Make the measurement baseline refuse acceptance after a scoped run. Accepting one drops every entry the run did not cover. The next full run then reports them all as new, which costs two more full runs to discover.

### Fast by default, and the time is part of the verdict

A run that takes six times longer than it did is a defect, even when every row matches. One such run stayed green through three review rounds because nothing measured time (toolkit-standard §D 0's third question carries the case).

So every run prints and saves its time per phase and per target (`timing.mjs`). A full run more than a quarter slower than the accepted one warns and names the phase. Waits are on signals and bounded, never a fixed sleep. Pictures are taken on `--shots` and kept on `--accept --shots`, not on every push.

The engine's reference (`tools/parity/REFERENCE.md`, *Fast by default*) says what is reused, keyed on what, what is opt-in, and what a project must not do. A change to anything that runs compares its time before and after on the same input, as its output is compared (toolkit-standard §D 0).

There is no incremental run that reuses a target's last measurement by a hash of its inputs. A key that misses an asset is a wrong green. A scoped run (`bin/parity <target>`) is already the few-second iteration.

### Then look at it, in every state it has

Components included. `bin/parity --shots` renders each mapped state of a screen and each component's variant matrix into a folder to open. It uses both themes and the same fills, clicks and scroll positions the probe uses (`tools/parity/shots.mjs`). A project keeps no command of its own for it.

A green run is not a correct page: four defects once shipped past one, each in a state nobody had opened. Parity answers *does what I mapped still match*. The pictures answer *is this right*. Only the second catches a property no mapping names, a layer a spec stopped carrying, or a control the design added.

### Nothing is done until somebody has looked at it

Build this step into the habit. Green is exactly when it gets skipped. A Button once reported 414 matching assertions while half as tall again as its design, in Times, with no shadow and no spinner. Take the picture, read it against the frame, and only then say the component is built.

### Read the frame before styling it

When someone points at something that looks wrong, read the frame first. A defect reported by eye is a question about what the design draws there, and the snapshot is one file away. Once, a switch's label spacing was fixed and committed, then deleted within the hour: the frame had replaced the switch with a filter group. The order is always the same: read the frame, then decide whether what is there is the thing at all.
