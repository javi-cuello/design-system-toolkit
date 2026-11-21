# The content store — folders, content files, status, UUIDs

How a Kirby site lies on disk and how a page's fields are stored. Everything here is Kirby 5.

## Contents

- [The folder structure](#the-folder-structure)
- [Pages are folders](#pages-are-folders)
- [Status and sort order](#status-and-sort-order)
- [The content file format](#the-content-file-format)
- [UUIDs and permalinks](#uuids-and-permalinks)

## The folder structure

```
/content        the content store — one folder per page, tracked in git
/site           everything you write: blueprints, templates, snippets, controllers, models, plugins, config
/kirby          the core — never edit, replaced wholesale on update
/media          generated thumbnails and plugin assets — regenerable, gitignore it
/assets         your CSS/JS/images (convention, not enforced)
index.php       the front controller; every request routes through it
.htaccess       Apache rewrite rules; also blocks direct access to /content, /site and /kirby
```

**nginx and Caddy do not read `.htaccess`.** On those servers the rewrite and the folder blocking must be configured by hand. A missing block makes content files publicly downloadable, so treat it as a security check on any non-Apache deployment.

Inside `/site`:

```
site/blueprints/    site.yml, pages/, files/, users/, blocks/   — Panel configuration (YAML)
site/templates/     default.php is required; one file per page type
site/snippets/      reusable partials
site/controllers/   optional logic layer, one per template
site/models/        optional page subclasses, one per template
site/plugins/       one folder per plugin, entry point index.php
site/config/        config.php and environment variants
site/languages/     one .php per language on multi-language sites
```

## Pages are folders

Every page is a **folder** under `/content`. The folder name is the URL slug, and nesting is the URL path. One text file in the folder holds the fields, and any files (images, PDFs) sit beside it.

```
/content/
├── site.txt                       fields of $site
├── 1_about/
│   └── about.txt                  → rendered by site/templates/about.php
└── projects/
    ├── projects.txt
    ├── _drafts/
    │   └── unfinished/
    │       └── project.txt
    ├── 1_alpha/
    │   ├── project.txt
    │   └── cover.jpg
    │   └── cover.jpg.txt          file metadata (alt text, caption…)
    └── archived-thing/
        └── project.txt
```

**The content file name chooses the template.** `content/1_about/about.txt` renders through `site/templates/about.php`, whatever the folder is called.

Content is tracked in git, so a content change is a commit and a rollback is a `git revert`. The Panel writes the same files you edit by hand. A hand edit made while an editor has the page open can be overwritten. Kirby 5's change and preview workflow guards Panel editors against each other, not against your text editor.

## Status and sort order

Status is encoded in the folder name; [SKILL.md](../SKILL.md#status-lives-in-the-folder-name) holds the table.

The numeric prefix is also the sort order:

| Prefix | Order |
|---|---|
| `1_`, `2_`, `3_` | manual |
| a date stamp, such as `20260812_` | chronological |
| `0_` | alphabetical |

Changing the sort order in the Panel renames folders on disk. Expect that in the git diff and do not fight it.

## The content file format

```
Title: An interesting article
----
Date: 2026-08-08
----
Cover: file://VYnAL00UhvmOxq8J
----
Text:

Really interesting content here, over
as many lines as you like.
```

- Fields are `Name: value`, separated by **exactly four dashes on their own line**.
- A value may span lines and hold any plain text: Markdown, YAML, JSON.
- Structure fields store YAML and blocks fields store JSON, inside one field value. They are readable in the file but should never be hand-edited casually.
- Field names match case-insensitively and are letters, digits and underscores only. **No dashes**: it is the most common blueprint typo.
- Multi-language sites add the language code before the extension: `about.en.txt`, `about.de.txt`. The default language's file is the fallback.

## UUIDs and permalinks

Kirby 4 and later give every page, file and user a permanent UUID. It is generated on creation and stored in the content file. Picker fields store UUIDs rather than paths, so moving or renaming a page keeps the reference.

```
Cover: file://VYnAL00UhvmOxq8J
----
Related:
- page://hb38HvnQfm8HlQ6e
```

`page()`, `url()` and the collection finders take a UUID or a path alike. `$model->permalink()` gives the stable URL form, `https://example.com/@/page/<uuid>`.
