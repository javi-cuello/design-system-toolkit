# Fixture library — design system context

A context document cut to what Audit lite reads: the routing that names the library, its audit settings, the
project's naming preferences and the rulings log.

```json snapshot-routing
{ "files": { "library": [{ "key": "KEY123", "name": "Fixture library", "roles": ["components", "tokens"] }] } }
```

```json audit-settings
{
  "libraries": {
    "KEY123": {
      "name": "Fixture library",
      "tokens": { "semantic": "Semantic", "stateAxis": "Status" },
      "optionOrder": { "Status": ["Default", "Hover", "Pressed"] },
      "descriptionStructure": "one sentence, then Use when."
    }
  }
}
```

```json naming-preferences
{ "booleanPrefix": "Has " }
```

## 6. Rulings log

| Date | Scope | Ruling | Why |
|---|---|---|---|
| 2026-11-01 | Button | Icon-only buttons keep a fixed 40 px width. | Recorded from the audit dashboard, on Button. |
| 2026-10-01 | Chip | ~~Chips may hard-code their radius.~~ | Superseded by the radius tokens. |
| 2026-11-02 | All | Private parts start with a dot. | Decided in review. |
