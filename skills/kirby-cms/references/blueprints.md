# Blueprints — Panel configuration, fields, sections, query language, blocks

Companion to `SKILL.md`. Everything here is Kirby 5.

## What a blueprint controls

A blueprint is YAML that defines what the Panel shows for a model and what that model may contain. It does not affect the frontend. A page with no blueprint still renders; it just cannot be edited usefully in the Panel.

```
site/blueprints/site.yml            the site itself, and the Panel dashboard
site/blueprints/pages/<name>.yml    pages whose content file is <name>.txt
site/blueprints/files/<name>.yml    files, selected by the `template:` given in a files section
site/blueprints/users/<role>.yml    user roles — the file name is the role id
site/blueprints/blocks/<name>.yml   custom blocks for the blocks field
```

The page blueprint is matched by the **same name as the template**, which is the same name as the content file. One name wires content file → template → controller → model → blueprint.

## Anatomy

```yaml
title: Project
icon: image
status:
  draft: true
  unlisted: true
  listed: true

options:
  changeSlug: false
  delete: true

tabs:
  content:
    label: Content
    icon: text
    columns:
      main:
        width: 2/3
        sections:
          main:
            type: fields
            fields:
              headline: { label: Headline, type: text }
              text:     { label: Text, type: textarea }
      side:
        width: 1/3
        sections:
          images:
            type: files
            template: image
            layout: cards
  meta:
    label: Meta
    fields:
      description:
        type: text
```

Levels, outermost first: **tabs → columns → sections → fields**. Every level is optional; the minimum useful blueprint is `title:` plus `fields:`.

Column widths are `1/2`, `1/3`, `2/3`, `1/4`, `2/4`, `3/4`.

**The mixing rule:** as soon as a tab or column contains both sections and fields, the fields must be wrapped in a section of `type: fields`. Fields sitting loose beside a `pages:` section is the most common blueprint parse surprise.

## Section types

Five built in: `fields`, `pages`, `files`, `info`, `stats`. Plugins can add more.

```yaml
sections:
  subpages:
    type: pages
    label: Articles
    template: article        # restricts what can be created here
    create: article
    parent: site.find("blog")
    layout: table            # list | cardlets | cards | table
    sortBy: date desc
    status: listed
  attachments:
    type: files
    template: document
    max: 5
    accept: application/pdf
  note:
    type: info
    label: Heads up
    text: This page is generated nightly. Manual edits are overwritten.
```

`template:` on a files section chooses which `site/blueprints/files/*.yml` applies to uploads — that is how a file gets its own metadata fields.

## Field types

`blocks`, `checkboxes`, `color`, `date`, `email`, `entries`, `files`, `gap`, `headline`, `hidden`, `info`, `layout`, `line`, `link`, `list`, `multiselect`, `number`, `object`, `pages`, `radio`, `range`, `select`, `slug`, `stats`, `structure`, `tags`, `tel`, `text`, `textarea`, `time`, `toggle`, `toggles`, `url`, `users`, `writer`. Plugins can register custom types under the `fields` extension key.

Structural ones to know:

- **`structure`** — a repeatable set of subfields, stored as YAML in one field value; read with `->toStructure()`.
- **`object`** — a single grouped set of subfields, same storage idea; `->toObject()`.
- **`blocks`** — the page builder; stored as JSON, read with `->toBlocks()`. Core block types are text, heading, image, video, gallery, quote, code, list, markdown, line; each can be overridden by a snippet at `site/snippets/blocks/<type>.php`, and new ones defined with a blueprint at `site/blueprints/blocks/<name>.yml` plus a matching snippet.
- **`layout`** — blocks arranged into columns; `->toLayouts()`.
- **`pages` / `files` / `users`** — pickers, which store **UUIDs**, read with `->toPages()`, `->toFile()`, `->toUsers()`.
- **`writer`** — inline rich text producing HTML, unlike `textarea` which produces Markdown/KirbyText.

Field names must be alphanumeric plus underscore — no dashes — and should avoid colliding with `$page` methods (`image`, `num`, `children`, `files`, `audio`, `videos`). Do not use `title` as a custom field in a page blueprint; it is already the page title.

## Reuse: extends and presets

```yaml
# site/blueprints/fields/seo.yml
label: SEO description
type: textarea
maxlength: 160

# in a page blueprint
fields:
  description:
    extends: fields/seo
    label: Meta description      # local keys override the extended ones
```

Whole blueprints extend too — `extends: pages/article` — and sections and tabs can be extended the same way. Shared parts live under `site/blueprints/fields/`, `site/blueprints/sections/`, `site/blueprints/tabs/`. This is how a project keeps twelve page types from drifting apart, and it is worth looking for before adding a field by hand in several files.

## Query language

Dot notation mirroring the PHP API, used wherever a blueprint needs live data.

```yaml
options:
  type: query
  query: site.children.listed.template('note')

parent: site.find("blog")
info: "{{ page.date.toDate('d.m.Y') }} — {{ page.location }}"
query: site.index.filterBy("template", "in", ["note", "album"])
```

Root keywords: `site`, `page`, `file`, `user`, `kirby`, `item` (inside a structure or options loop), `block`, and `this` (v5.1+). `{{ … }}` interpolation is used in display strings — a section's `text`, `info`, `image.query`.

Kirby 5.1's query runner adds optional chaining (`page.cover.toFile?.url`), ternaries, comparison and logical operators (`==`, `!=`, `>`, `<`, `&&`, `||`) and arithmetic. On an older v5 patch these silently fail rather than erroring usefully — check the version before using them.

## Translations

Any label can take a language map instead of a string:

```yaml
headline:
  label:
    en: Headline
    de: Überschrift
  type: text
```

Field **values** are translated per language automatically on multi-language sites; a field marked `translate: false` stays shared across languages, which is what you want for things like a numeric price or a page-wide toggle.
