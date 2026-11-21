# Blueprints — Panel configuration, fields, sections, query language, blocks

Companion to [SKILL.md](../SKILL.md). Everything here is Kirby 5.

## Contents

- [What a blueprint controls](#what-a-blueprint-controls)
- [Anatomy](#anatomy)
- [Section types](#section-types)
- [Field types](#field-types)
- [Reuse: extends and presets](#reuse-extends-and-presets)
- [Query language](#query-language)
- [Translations](#translations)

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

Column widths are fractions: 1/2, 1/3, 2/3, 1/4, 2/4 and 3/4.

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

The core field types:

```
blocks  checkboxes  color  date  email  entries  files  gap  headline  hidden
info  layout  line  link  list  multiselect  number  object  pages  radio
range  select  slug  stats  structure  tags  tel  text  textarea  time
toggle  toggles  url  users  writer
```

Plugins can register custom types under the `fields` extension key.

The structural ones to know:

| Type | What it is | Stored as | Read with |
|---|---|---|---|
| `structure` | a repeatable set of subfields | YAML in one field value | `->toStructure()` |
| `object` | one grouped set of subfields | YAML in one field value | `->toObject()` |
| `blocks` | the page builder | JSON | `->toBlocks()` |
| `layout` | blocks arranged into columns | JSON | `->toLayouts()` |
| `pages`, `files`, `users` | pickers | **UUIDs** | `->toPages()`, `->toFile()`, `->toUsers()` |
| `writer` | inline rich text | HTML | the field itself |
| `textarea` | long text | Markdown or KirbyText | `->kirbytext()` |

The core block types are text, heading, image, video, gallery, quote, code, list, markdown and line. A snippet at `site/snippets/blocks/<type>.php` overrides one. A new block takes a blueprint at `site/blueprints/blocks/<name>.yml` and a matching snippet.

Field names are letters, digits and underscores only, with no dashes. They should not collide with a page method, such as image, num, children, files, audio or videos. Do not use `title` as a custom field in a page blueprint: it is already the page title.

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

Whole blueprints extend too, as in `extends: pages/article`, and so do sections and tabs. Shared parts live in the `fields/`, `sections/` and `tabs/` folders under `site/blueprints/`. This keeps twelve page types from drifting apart. Look for it before adding a field by hand in several files.

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

| Root keyword | Refers to |
|---|---|
| `site`, `page`, `file`, `user`, `kirby` | that object |
| `item` | the entry inside a structure or options loop |
| `block` | the current block |
| `this` | the current model (v5.1+) |

`{{ … }}` interpolation is used in display strings, such as a section's `text`, `info` and `image.query`.

Kirby 5.1's query runner adds:

```
page.cover.toFile?.url          optional chaining
a ? b : c                       ternaries
==  !=  >  <  &&  ||            comparison and logical operators
+  -  *  /                      arithmetic
```

On an older v5 patch these fail silently rather than with a useful error. Check the installed version before using them.

## Translations

Any label can take a language map instead of a string:

```yaml
headline:
  label:
    en: Headline
    de: Überschrift
  type: text
```

On multi-language sites, field **values** are translated per language automatically. A field marked `translate: false` stays shared across languages. That suits a numeric price or a page-wide toggle.
