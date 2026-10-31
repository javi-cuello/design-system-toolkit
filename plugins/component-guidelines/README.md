# Component guidelines

Select a single component instance; a floating panel appears just below it showing that component's **Usage** and **Don't** guidelines, parsed from its (or its Component Set's) description. Refreshes automatically as selection changes.

Hand-written vanilla JS, no build step · import `manifest.json` via Figma → Plugins → Development.

## Description format expected
A heading word alone on its own line, followed by one guideline per line, until the next heading or end of text:

    Usage
    Use Primary for the single most important action
    Choose Role first for hierarchy, then Size

    Don't
    Use more than one Primary button in the same context

Other headings (Behaviour/Behavior, Composition, Code gen notes) are recognized as section boundaries but not shown. No guidelines found → the panel says so rather than showing nothing silently.

## Data this plugin stores
None. No clientStorage, no pluginData — purely reads descriptions and reports UI height back to main for resizing.
