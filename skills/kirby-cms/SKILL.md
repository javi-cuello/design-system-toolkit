---
name: kirby-cms
description: "Working reference for Kirby CMS (v5) — how a Kirby site is actually assembled and how to write correct Kirby code. Use whenever a task involves a Kirby project: reading or writing templates, snippets, controllers, page models, blueprints, plugins, hooks, routes, config, content files, or the Panel. Also use when asked how Kirby works, how it stores content, why a template or blueprint is not picked up, how to add a field, how to build a plugin, or how Kirby compares to a database-backed CMS. Covers the flat-file content model, the naming conventions that wire everything together, the field-object trap, and the escaping rules."
---

# Kirby CMS — working reference

**Version 1.8.0** — history in CHANGELOG.md.

Kirby is a **flat-file, file-based PHP CMS**. There is no database. The filesystem *is* the content store, and almost everything is wired together by **filename convention** rather than configuration. Getting the conventions wrong is the single largest source of "why isn't this working" in Kirby, so most of this skill is the naming rules and the places they bite.

Current major version: **Kirby 5** (5.5.x as of August 2026). Kirby 6 is announced for the second half of 2026 as a free upgrade for v4/v5 licence holders. Everything below is Kirby 5 unless marked otherwise; if a project's `composer.json` or `kirby/` folder says v3 or v4, check the relevant [update guide](https://getkirby.com/docs/guide/updates/update-to-v5) before assuming an API exists.

## Orient in the project before writing anything

Kirby projects vary enormously in structure while sharing one core, so read the project before applying any default here. Four cheap reads answer nearly everything:

1. **Version** — `composer.json` (`getkirby/cms` constraint) or `kirby/composer.json`. Do not infer from the docs you remember.
2. **Shape** — `ls site/` tells you which extension points this project uses at all. A site with no `site/controllers/` puts its logic in templates; a site with `site/plugins/` may register templates and blueprints from inside a plugin, where `ls site/templates/` will never show them.
3. **Conventions** — read two or three existing blueprints and their matching templates side by side. Field naming, snippet granularity and whether the project uses blocks, structures or plain fields are project decisions, and matching them matters more than any preference stated here.
4. **Config** — `site/config/config.php` plus any `config.<host>.php`. This is where routes, hooks, languages, cache and `debug` live, and it silently changes behaviour you would otherwise attribute to core.

*Why this skill carries no project-context block (skill-standard §A clause B):* a Kirby project describes itself. Its conventions are readable from its own blueprints, templates and config in seconds, so recording them in a separate document would create a second source of truth that goes stale against the code. Clause B exists for conventions that are **not** derivable from the artefact — the Figma case. This is the other case.

*Why no engine (clause G):* nothing here is deterministic-and-repeated. The work is reading a codebase and writing PHP and YAML against it — judgement, not computation.

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

nginx and Caddy do not read `.htaccess` — on those servers the rewrite **and the folder blocking** must be configured by hand, and a missing block means content files are publicly downloadable. Treat that as a security check on any non-Apache deployment.

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

## The content store

Every page is a **folder** under `/content`. The folder name is the URL slug; nesting is the URL path. Inside the folder, a single text file holds the fields, and any files (images, PDFs) sit beside it.

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

**Status is encoded in the folder name.** This is the rule that surprises people coming from a database CMS:

| Status | On disk | Behaviour |
|---|---|---|
| Draft | inside a `_drafts/` folder of its parent | not publicly reachable; visible in the Panel |
| Unlisted | folder with **no** numeric prefix | reachable by URL, absent from `->listed()` collections |
| Listed | folder prefixed `<num>_`, e.g. `1_alpha` | reachable and included in sorted collections |

The prefix also *is* the sort order. `1_`, `2_`, `3_` for manual order; a date stamp like `20260812_` for chronological order; `0_` for alphabetical. Changing sort order in the Panel renames folders on disk — expect that in your git diff and do not fight it.

**Two more consequences worth holding on to.** Content is git-tracked, so a content change is a commit and a rollback is a `git revert`; and the Panel is a writer to the same files you edit by hand, so a hand edit made while an editor has the page open can be overwritten. Kirby 5's change/preview workflow mitigates this in the Panel, not against your text editor.

### The content file format

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

Fields are `Name: value`, separated by **exactly four dashes on their own line**. Values may be multi-line and may contain anything expressible as plain text — Markdown, YAML, JSON. Structure and blocks fields store YAML and JSON respectively inside a single field value, which is why they are readable in the file but should never be hand-edited casually.

Field names are matched case-insensitively and must be alphanumeric plus underscore; **no dashes**, which is the most common blueprint typo.

Multi-language sites add the language code before the extension: `about.en.txt`, `about.de.txt`. The default language file is the fallback.

**The template is chosen by the content filename, not the folder name.** `/content/1_about/about.txt` renders through `site/templates/about.php`. Rename the file to `default.txt` and the same page renders through `default.php`. This is also how you change a page's type by hand.

## The rendering chain

For a request, Kirby resolves the page, then assembles output through up to four layers — only the template is required:

```
site/models/project.php        class ProjectPage extends Page   — behaviour on the page object
site/controllers/project.php   return function ($page) {…}      — variables for the template
site/templates/project.php     the HTML                          — required
site/snippets/*.php            partials called from the template
```

All four are keyed by **the same name as the content file**, which is the through-line of the whole system. A controller named `projects.php` will never run for a template named `project.php`.

Templates get `$page`, `$site`, `$pages` and `$kirby` for free. Controllers receive whichever of those they name as parameters — injection is by parameter name, and order is irrelevant.

See [`references/templating.md`](references/templating.md) for the full layer-by-layer detail, snippet slots, and content representations (`project.json.php` for a `.json` variant of a page).

## Field objects — the trap that costs the most time

**Every field access returns a `Field` object, never a string.** `$page->text()` is an object; it is always truthy, even when the field is empty. So:

```php
<?php if ($page->text()): ?>          // ALWAYS true — this is the bug
<?php if ($page->text()->isNotEmpty()): ?>   // correct
```

The object is stringable, so `<?= $page->title() ?>` prints fine and hides the problem until you write a condition. Fields carry a long list of conversion and test methods — `->value()`, `->isEmpty()`, `->or()`, `->toDate()`, `->toBool()`, `->toInt()`, `->toPage()`, `->toFile()`, `->toPages()`, `->toStructure()`, `->toBlocks()`, `->kirbytext()`, `->html()`, `->escape()`.

**Reserved names.** A field whose name collides with a `$page` method — `image`, `num`, `audio`, `videos`, `children`, `files` — cannot be read as `$page->image()`, because that resolves to the method. Reach it through the content object instead:

```php
$page->content()->get('image')
```

Prefer not to create the collision: name the field `cover` or `hero_image`.

**Writing has its own version of this trap.** `$page->update()` runs the data through the blueprint, so a value that is not among a `select` or `multiselect` field's `options` is dropped without an error — while a field the blueprint never declares is written without question, and a stored key that shares its name with a display-only field (`info`) is erased by every write. And `update()` returns a new page and freezes the old one: a second write through the old reference deletes the page's folder before it throws `error.logic`, so always `$page = $page->update(...)`. When code produces values for an option field, the blueprint is part of that code's contract; see [`references/gotchas.md`](references/gotchas.md) for the exact behaviour and what it costs.

## Blueprints

Blueprints are YAML files under `site/blueprints/` that define the Panel — which fields an editor sees, how they are laid out, and what a page may contain. **A page blueprint is matched to a page by the same template name**, so `site/blueprints/pages/project.yml` configures every page whose content file is `project.txt`.

```yaml
title: Project

tabs:
  content:
    label: Content
    icon: text
    columns:
      main:
        width: 2/3
        sections:
          fields:
            type: fields
            fields:
              headline:
                label: Headline
                type: text
              text:
                label: Text
                type: textarea
      sidebar:
        width: 1/3
        sections:
          gallery:
            type: files
            template: image
  seo:
    label: SEO
    fields:
      description:
        type: text
```

The nesting is `tabs → columns → sections → fields`, and every level is optional — a blueprint can be `title:` plus a bare `fields:` block. The one rule that catches people: **once a tab or column mixes sections with fields, the fields must be wrapped in a `fields` section**, as above.

Blueprints also carry the **query language**, a dot-notation mirror of the PHP API used to populate options and pick parents: `site.children.listed.template('note')`, `page.siblings`, `kirby.users.role('editor')`. Full detail, section types, field types, `extends`, and the v5.1 query features (optional chaining, ternaries, operators) are in [`references/blueprints.md`](references/blueprints.md).

## Extending: plugins, hooks, routes, config

A plugin is a folder under `site/plugins/` with an `index.php` that calls `Kirby::plugin()`:

```php
<?php

Kirby::plugin('my-name/my-plugin', [
  'snippets' => [
    'header' => __DIR__ . '/snippets/header.php'
  ],
  'templates' => [
    'blog' => __DIR__ . '/templates/blog.php'
  ],
  'pageMethods' => [
    'readingTime' => function () {
      return ceil(str_word_count($this->text()->toString()) / 200);
    }
  ],
  'hooks' => [
    'page.delete:before' => function () {
      throw new Exception('Nope');
    }
  ]
]);
```

The name must be `vendor/plugin-name` and must be unique. Around sixty extension keys exist — `routes`, `fields`, `sections`, `blocks`, `fieldMethods`, `pageModels`, `collections`, `validators`, `translations`, `api`, Panel areas and dialogs, and more; the current list is in [`references/plugins-hooks-routes.md`](references/plugins-hooks-routes.md) with the ones you actually reach for.

**Hooks** are named `entity.action:before` / `:after` — `page.create:after`, `file.delete:before`, `user.login:after`, `site.update:before`. They register in a plugin as above, or under a `hooks` key in `config.php`.

**Routes** take `pattern`, `action` and optional `method`, and may live in `config.php` or a plugin. Placeholders `(:any)`, `(:all)`, `(:num)`, `(:alpha)`, `(:alphanum)` become the action's arguments in order. The action may return a page, a file, an HTML string, an array (serialised to JSON), a `Response`, or `false` for a 404.

**Config** is `site/config/config.php` returning an array. Environment overrides are picked by hostname: `config.localhost.php`, `config.staging.example.com.php`, plus `config.cli.php`. Never leave `'debug' => true` in the base config — it is the config mistake that leaks stack traces to production.

## Security: escaping is not automatic

Kirby does not escape output for you. `<?= $page->text() ?>` prints raw.

```php
<?= $site->copyright()->escape() ?>                       <!-- HTML body -->
<img alt="<?= $image->alt()->escape('attr') ?>">          <!-- attribute -->
<script>let x = "<?= $page->js()->escape('js') ?>";</script>
```

Contexts are `html` (default), `attr`, `css`, `js`, `url`, and picking the wrong one is as unsafe as picking none. KirbyText permits raw HTML and `javascript:` links, so untrusted KirbyText needs safe mode — `->kirbytext(['markdown' => ['safe' => true]])`, or `'markdown.safe' => true` globally.

Escaping is unnecessary for content you and your editors author. It is mandatory for anything from a form, an API, a database, or a Panel with untrusted users.

## Signed tokens: `contentToken()` and the salt

`$kirby->contentToken($model, $value)` is Kirby's HMAC for links that must keep working without being stored — an unsubscribe link, a preview link. Its salt is `content.salt`, and **the default salt is the model's own content path**, so two pages get different tokens even when `$value` is the same string. A production host sets `content.salt` to a fixed secret, as Kirby's own source says it must, and at that moment the salt is the same for every model: a call like `contentToken($subscriber, 'unsubscribe')` returns **one token for every subscriber**, and a fixture that passed under the default salt says nothing about it. Put the model's id into the signed value — `contentToken($subscriber, 'unsubscribe:' . $subscriber->id())` — and run the fixtures with a fixed salt so they test the production shape. Found on a live 5.5.3 board where the only way the collision showed was running the fixtures on the server (see the next entry for why that was possible).

## UUIDs and permalinks

Kirby 4+ gives pages, files and users a permanent UUID, generated on creation and stored in the content file. Picker fields store them rather than paths, so moving or renaming a page does not break the reference:

```
Cover: file://VYnAL00UhvmOxq8J
----
Related:
- page://hb38HvnQfm8HlQ6e
```

`page()`, `url()` and the collection finders resolve a UUID or a path interchangeably. `$model->permalink()` gives the stable URL form, `https://example.com/@/page/<uuid>`.

## Content logic belongs to the page model, and it is testable there

Anything that reads a page's own content and decides something — grouping, excerpting, normalising a board's markup, deciding where a button points — is a method on the page model, not a branch in the template. Two reasons beyond tidiness: several templates usually need the same answer, and a model method is the only one of the two a fixture can call without a request.

Make such a method **public and static where it is a pure function of its input** (`JobPage::normaliseProse($html)`), because a private one can only be tested through reflection, and a test that needs reflection is a test that will be skipped. Where it needs the page, keep it an instance method and construct a page in the fixture:

```php
$page = new JobPage(['slug' => 'x', 'template' => 'job', 'content' => ['website' => $url]]);
$check('ashby goes to the form', $page->applyUrl(), 'https://jobs.ashbyhq.com/acme/1/application');
```

## A restored file can serve stale: opcache trusts mtime

PHP's opcache revalidates a compiled template by timestamp. Restoring a file by moving a backup over it (`mv default.php.bak default.php`) restores the *old* mtime — older than the cached compile — so the server keeps serving the edited version while the file on disk is already clean. The fix is one `touch` after any restore that preserves timestamps; the symptom is a template edit (or its revert) that "doesn't take" while the file plainly says otherwise. Found while proving a structural gate red by injecting a fault into a template and reverting it: the revert read as failed until the mtime moved.

## Where the rest is

- [`references/templating.md`](references/templating.md) — templates, controllers, models, snippets and slots, content representations, collections and pagination, files and thumbnails.
- [`references/blueprints.md`](references/blueprints.md) — blueprint anatomy, section and field types, `extends`, query language, blocks and the page builder.
- [`references/plugins-hooks-routes.md`](references/plugins-hooks-routes.md) — extension keys, plugin setups, hook catalogue shape, routing, the API, virtual pages.
- [`references/gotchas.md`](references/gotchas.md) — the failure modes, each with its symptom, so a stuck run can be searched by symptom rather than by cause.

Primary source for everything here is [getkirby.com/docs](https://getkirby.com/docs). When a claim in this skill and the docs disagree, the docs win and this skill has a bug — say so rather than working around it.
