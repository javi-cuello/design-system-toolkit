# {{name}}

{{purpose}}

## Run
Figma → Plugins → Development → Import plugin from manifest → select this folder's `manifest.json`.
A changed manifest needs a re-import; "run last plugin" will not pick it up.

## Data this plugin stores
{{storage}}

<!-- Answer concretely, and keep it true as the plugin changes. If it stores nothing,
     say so outright — "Nothing. No clientStorage, no pluginData, no network calls."
     Otherwise name each location and what lives there: clientStorage (5 MB per plugin,
     per user, survives file changes) · pluginData / sharedPluginData (100 kB per entry,
     enforced, travels with the node). This section is what the conformance check looks
     for, and it is the only place a reader can learn what the plugin keeps. -->
