# Templating — templates, controllers, models, snippets, collections, files

Companion to [SKILL.md](../SKILL.md). Everything here is Kirby 5.

## Contents

- [Templates](#templates)
- [Controllers](#controllers)
- [Page models](#page-models)
- [Snippets](#snippets)
- [Field methods](#field-methods)
- [Pages and collections](#pages-and-collections)
- [Files](#files)
- [Escaping and KirbyText](#escaping-and-kirbytext)
- [Caching](#caching)

## Templates

`site/templates/<name>.php`. Plain PHP, no template engine. `default.php` is the only required file and the fallback when no template matches the content filename.

```php
<?php snippet('header') ?>

<article>
  <h1><?= $page->title()->html() ?></h1>
  <?= $page->text()->kirbytext() ?>
</article>

<?php snippet('footer') ?>
```

Available without doing anything: `$page`, `$site`, `$pages` (top-level pages), `$kirby`.

Kirby's own convention is the alternative syntax (`<?php foreach (…): ?> … <?php endforeach ?>`) and short echo tags. Match the project.

### Content representations

A file named `<template>.<extension>.php` renders the same page in another format at `<url>.<extension>`:

```
site/templates/project.php        → /projects/alpha
site/templates/project.json.php   → /projects/alpha.json
```

Kirby sets the content type from the extension. Useful for JSON endpoints without writing routes, and for RSS/XML feeds.

## Controllers

`site/controllers/<template>.php`, filename identical to the template. Returns a closure returning an associative array; each key becomes a variable in the template.

```php
<?php

return function ($page, $site, $kirby) {
  $articles = $page->children()->listed()->flip()->paginate(10);

  return [
    'articles'   => $articles,
    'pagination' => $articles->pagination()
  ];
};
```

Injection is **by parameter name**, not position — ask for `$site`, `$page`, `$pages`, `$kirby` in any order, or none. Controllers are the place for query logic, form handling and anything that would otherwise put a `foreach` with business rules inside markup.

A controller runs only when its template renders. It does not run for a content representation unless a matching `<template>.<ext>.php` controller exists.

## Page models

`site/models/<template>.php`, class `<Template>Page extends Page`.

The name Kirby looks for is `str_replace(['.', '-', '_'], '', $filename) . 'Page'` — separators dropped, **nothing re-cased**. So `my-template.php` makes Kirby ask for `mytemplatePage`, and the conventional `MyTemplatePage` is found only because PHP class lookup is case-insensitive. Both work; know which one is doing the work, because it is the reason a model can stop loading after a rename that looks harmless.

```php
<?php

class ProjectPage extends Page
{
    public function cover()
    {
        return $this->image('cover.jpg') ?? $this->images()->first();
    }
}
```

Inside a model use `$this`, not `$page`. Models are for behaviour that belongs to a page type wherever it is used — computed values, overridden `children()` for virtual pages, custom `title()`. Controllers are for one template's rendering; models travel with the object.

Models can also be registered from a plugin under the `pageModels` key.

Content logic lives here so a fixture can call it ([SKILL.md](../SKILL.md#content-logic-belongs-to-the-page-model)). A pure function of its input is public and static. One that needs the page stays an instance method, and the fixture constructs a page:

```php
$page = new EventPage(['slug' => 'x', 'template' => 'event', 'content' => ['website' => $url]]);
$check('a ticket link goes to the booking form', $page->bookingUrl(), 'https://tickets.example.com/e/1/book');
```

## Snippets

`site/snippets/`, called by path without the extension. Subfolders are addressed with slashes.

```php
<?php snippet('layout/header') ?>
<?php snippet('card', ['item' => $article]) ?>
<?php snippet('card', compact('item')) ?>
```

Snippets see the global template variables plus whatever is passed. They do **not** automatically see a controller's variables unless passed explicitly — a frequent surprise.

### Slots

For snippets that wrap content rather than only receive data:

```php
<?php snippet('box', slots: true) ?>
  <?php slot('header') ?><h2>Title</h2><?php endslot() ?>
  <?php slot() ?><p>Body</p><?php endslot() ?>
<?php endsnippet() ?>
```

Inside the snippet:

```php
<div class="box">
  <?php if ($header = $slots->header()): ?><header><?= $header ?></header><?php endif ?>
  <?= $slot ?>
</div>
```

`$slot` is the default (unnamed) slot; `$slots->name()` reaches a named one.

## Field methods

Every field access returns a `Field` object. These convert or test it:

```php
->value()  ->isEmpty()  ->isNotEmpty()  ->or('Fallback')
->toDate()  ->toBool()  ->toInt()
->toPage()  ->toFile()  ->toPages()  ->toStructure()  ->toBlocks()
->kirbytext()  ->html()  ->escape()
```

## Pages and collections

```php
$page->children()                 // direct children, all statuses the context allows
$page->children()->listed()       // only listed pages
$page->children()->unlisted()
$page->drafts()
$page->index()                    // all descendants, recursively
$site->index()
$page->parent()  $page->siblings()  $page->prev()  $page->next()
```

Collections are immutable and chainable:

```php
$site->index()
     ->filterBy('template', 'note')
     ->filterBy('tags', 'design', ',')
     ->sortBy('date', 'desc')
     ->limit(5);
```

Other regulars:

```php
->find('slug')  ->findBy('field', 'value')  ->first()  ->last()  ->not($page)
->flip()  ->group()  ->pluck()  ->paginate(10)  ->pagination()
```

`page('projects/alpha')` and `page('page://…')` both resolve to a page from anywhere. The argument is the **page id** — the content path without num prefixes — not the URL.

## Files

```php
$page->files()                     // all files
$page->images()  $page->documents()  $page->videos()
$page->image('cover.jpg')          // one file, null if missing
$page->file('report.pdf')
```

File metadata lives in a sidecar text file, `cover.jpg.txt`, in the same content format as a page, with a matching blueprint under `site/blueprints/files/`. So `$image->alt()`, `$image->caption()` are just fields.

Thumbnails are generated on demand into `/media` and cached there:

```php
<?= $image->resize(1200)->url() ?>
<?= $image->crop(400, 300)->url() ?>
<?= $image->thumb(['width' => 800, 'quality' => 80, 'format' => 'webp'])->url() ?>
<?= $image->srcset([400, 800, 1200]) ?>
```

`/media` is regenerable — gitignore it, and delete it when thumbs look stale.

`crop()` and `resize()` return the **original file unchanged** for an SVG, with no thumbnail and no error. Read the size off the returned object rather than repeating the numbers you asked for.

## Escaping and KirbyText

| Method | Does |
|---|---|
| `->kirbytext()` | renders Markdown and KirbyTags, such as `(image: cover.jpg)`, as block-level HTML |
| `->kirbytextinline()` | the same without wrapping paragraphs: for a heading or a table cell |
| `->html()` | escapes for HTML |
| `->escape($context)` | escapes for a named context |

The safety rules are in [SKILL.md](../SKILL.md#security-escaping-is-not-automatic).

## Caching

`'cache' => ['pages' => ['active' => true]]` in config turns on the page cache. It caches full output, but it declines more on its own than people expect. As read in the 5.5.3 source:

- `Page::isCacheable()` returns false for any method but GET and HEAD.
- It returns false for **any request carrying query data or URL params**, and for the `changes` version.
- `Page::render()` records whether the render touched auth or cookies. If it did, `Responder::isPrivate()` refuses to serve that entry to anyone else.

So a query string and a logged-in visitor are already handled.

The `'ignore'` option takes page ids or a closure taking the page. It suits output that varies for a reason the request cannot show. Examples are the time of day, a random pick, or a live call to an external API.

Content edited outside the Panel does not clear the cache. The Panel flushes on save, but a text editor does not. So a project edited by hand wants the cache off in `config.localhost.php` and on in the base config. Clear `site/cache/` when in doubt.
