# Component guidelines

This Figma plugin shows a component's guidelines right where you use it. Select one component instance. A floating panel appears just below it with the **Usage** and **Don't** guidelines. They come from the description of the component or its component set. The panel refreshes as the selection changes.

## Install

It is hand-written vanilla JS with no build step. In Figma, go to Plugins → Development → Import plugin from manifest… and pick `manifest.json`.

## Description format expected

Write a heading word alone on its own line. Follow it with one guideline per line, until the next heading or the end of the text:

    Usage
    Use Primary for the single most important action
    Choose Role first for hierarchy, then Size

    Don't
    Use more than one Primary button in the same context

Other headings mark where a section ends but are not shown. These are Behaviour or Behavior, Composition and Code gen notes. When it finds no guidelines, the panel says so.

## Data this plugin stores

It writes one relaunch-data entry, `component-guidelines`, on the document root. That puts the plugin under **Tools** in the file's right panel. It writes the entry on every open. It uses no clientStorage, no other pluginData and no network. It only reads descriptions and tells the main code the window's height for resizing.

## Test

    node plugins/component-guidelines/tests/test-guidelines.js

`bin/check` runs it.
