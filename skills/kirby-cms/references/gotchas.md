# Failure modes, indexed by symptom

Companion to [SKILL.md](../SKILL.md). Written symptom-first, because that is what you have when you are stuck. Everything here is Kirby 5.

## Contents

- Not picked up: [template](#my-template-isnt-being-used), [blueprint](#my-blueprint-isnt-being-used), [controller](#my-controller-isnt-running)
- Fields: [always true](#my-condition-is-always-true), [wrong thing](#my-field-returns-the-wrong-thing--an-object-i-didnt-expect), [escaping](#html-from-my-content-is-escaped-or-worse-isnt), [line breaks](#my-text-has-a-line-break-i-didnt-write)
- Pages: [404](#the-page-404s-but-the-folder-exists), [missing from a listing](#pages-are-missing-from-my-listing), [sorting diff](#sorting-the-pages-changed-my-git-diff-enormously), [blueprint query](#the-query-in-my-blueprint-does-nothing)
- Stale output: [changes don't appear](#my-changes-dont-appear), [restored file serves stale](#a-restored-file-serves-the-old-version)
- Files: [crop or resize did nothing](#my-crop-or-resize-did-nothing-and-the-image-is-stretched)
- Deploys: [works locally, breaks on the server](#it-works-locally-and-breaks-on-the-server), [one token for every model](#every-model-gets-the-same-signed-token), [built-in server](#the-built-in-server-half-works), [large sites](#performance-falls-over-on-a-large-site)
- Writes: [editors overwrote each other](#two-editors-overwrote-each-other), [`update()` dropped a value](#update-reported-no-error-but-the-field-is-empty), [folder vanished](#a-pages-folder-vanished-after-an-errorlogic), [duplicate field](#a-content-file-has-the-same-field-twice)
- Code: [comment broke parsing](#my-template-stopped-parsing-after-i-wrote-a-comment)
- Routes: [500 on some inputs](#my-route-500s-on-some-inputs-and-works-on-others-remote), [dies after 30 seconds](#my-maintenance-route-dies-after-30-seconds), [fails only from cron](#the-route-works-when-i-run-it-and-fails-from-cron)
- [Version drift](#version-drift)

## "My template isn't being used"

The template is chosen by the **content file name**, not the folder name and not the blueprint. `/content/1_about/about.txt` uses `site/templates/about.php`. A file named `default.txt` gets `default.php`, whatever the folder is called. Check the actual filename before anything else.

If the template lives in a plugin, `ls site/templates/` will not show it. Grep `site/plugins/` for the `templates` extension key.

## "My blueprint isn't being used"

Same rule: `site/blueprints/pages/<content-file-name>.yml`. A blueprint named after the folder rather than the content file matches nothing. The Panel then shows its bare default form.

A YAML parse error usually shows as a missing or half-rendered blueprint, not an error message. Quote a value that contains `:` followed by a space, or starts with a special character.

## "My controller isn't running"

The controller filename must equal the template filename exactly, plural or singular included (`projects.php` against `project.php`). A controller also does not run for a content representation unless a matching `<template>.<ext>.php` controller exists.

## "My condition is always true"

`$page->anything()` returns a **Field object**, which is always truthy. Use `->isNotEmpty()` or `->isEmpty()`. This also bites in `??`, in ternaries, and in `empty()`.

```php
if ($page->subtitle()->isNotEmpty()) { … }
$value = $page->subtitle()->or('Fallback');
```

## "My field returns the wrong thing / an object I didn't expect"

The field name collides with a page method. The names that collide:

```
image  num  children  files  audio  videos  url  slug
```

Read it through the content object, `$page->content()->get('image')`. Better, rename the field.

## "The page 404s but the folder exists"

It is a draft, inside a `_drafts/` folder, or the site is cached. Drafts are invisible to visitors by design. Also check that a route pattern is not shadowing the page. Routes match before page resolution unless given `'env' => 'site'`.

## "Pages are missing from my listing"

`->children()` returns what the context permits. `->listed()` returns only pages with a numeric folder prefix. An unlisted page (no prefix) is reachable by URL and absent from every `listed()` collection. That is usually the intent, and occasionally the bug.

## "My changes don't appear"

In order of likelihood:

1. The page cache: clear `site/cache/`.
2. The media cache for a changed image: delete `/media`.
3. An opcode cache on the server; see the next entry for a restored file.
4. An environment config file overriding what you edited.

Content edited outside the Panel does not reliably clear the page cache.

## "A restored file serves the old version"

PHP's opcache revalidates a compiled template by its timestamp. Restoring a file by moving a backup over it (`mv default.php.bak default.php`) restores the *old* mtime. That is older than the cached compile, so the server keeps serving the edited version while the file on disk is clean.

The symptom is an edit, or its revert, that "doesn't take" while the file plainly says otherwise. The fix is one `touch` after any restore that keeps timestamps.

## "My crop or resize did nothing, and the image is stretched"

The file is an SVG. `crop()` and `resize()` on one return the **original `File`, unchanged**: no thumbnail, no exception, no log line. Verified on Kirby 5.5.3: a 240x80 SVG asked for `crop(800, 600)` came back as the 240x80 source file.

That is right for a vector, and a bug only where the caller assumed otherwise. The usual shape is a template that hardcodes the size it asked for:

```php
<img src="<?= $file->crop(800, 600)->url() ?>" width="800" height="600">   <!-- lies for an SVG -->

<?php $thumb = $file->crop(800, 600) ?>                                    <!-- correct for both -->
<img src="<?= $thumb->url() ?>" width="<?= $thumb->width() ?>" height="<?= $thumb->height() ?>">
```

It reaches production because logos want SVG, photos want JPEG, and one `site/blueprints/files/image.yml` usually accepts both. Take the dimensions off the returned file, or split the blueprint so a cover cannot be a vector. Do not correct the aspect ratio in CSS, and do not clear `/media`: the thumb driver did not fail.

## "HTML from my content is escaped, or worse, isn't"

Kirby escapes nothing automatically, so `<?= $page->text() ?>` is raw. `->html()` and `->escape()` escape. `->kirbytext()` renders Markdown and KirbyTags and deliberately lets HTML through. Untrusted KirbyText needs `['markdown' => ['safe' => true]]`.

Escaping in an attribute, CSS, JS or a URL needs that context passed, as in `->escape('attr')`. The default `html` context is not enough in an attribute.

## "My text has a line break I didn't write"

Kirby's Markdown runs with **`breaks` on by default**, so a single newline inside a paragraph becomes a `<br>`. A text editor or a seeding script's heredoc wraps prose across lines. Such a field renders with a break mid-sentence.

Keep a paragraph on one line in the content file. Or set `'markdown' => ['breaks' => false]` in config if the project wants CommonMark's rule. The Panel writes one line per paragraph, so this shows on hand-written and generated content only.

## "It works locally and breaks on the server"

| Cause | What to do |
|---|---|
| `.htaccess` is Apache only | On nginx or Caddy, write the rewrite rules and the blocks on `/content`, `/site` and `/kirby` by hand. Without the blocks, content files are publicly downloadable. |
| A case-sensitive filesystem | macOS is not case-sensitive; Linux is. `Header.php` and `header.php` differ there. |
| `'debug' => true` in the base config | It leaks stack traces. It belongs in `config.localhost.php` only. |
| File permissions | Kirby writes to `/content`, `/media` and `site/accounts/`. |

**`config.<host>.php` is selected from `SERVER_NAME`, not the `Host:` header.** `Environment::detectHost()` consults `HTTP_HOST` only in insecure mode (verified on 5.5.3).

- So `curl -H "Host: staging.example.com"` does **not** load `config.staging.example.com.php`. It silently keeps the local one, and the test proves nothing.
- To exercise a host config locally, move the local one aside or set `SERVER_NAME`. The host config is not broken.

**A web root that is a git clone serves the whole clone.** Kirby's `.htaccess` blocks dotfiles and the three core folders, and nothing else. Every other tracked path is a URL, and a `.php` under `tests/` or `bin/` *executes* on request. One live site served its deploy script, its crontab and a README with the SSH address, and ran its fixtures for anyone.

- Make the web root a `public/` folder.
- Or have `.htaccess` send these paths to `index.php`: bin/, ops/, tests/, docs/, \*.md and package\*.json.
- Prove it against production: `php -S` honours no `.htaccess`.

## "Every model gets the same signed token"

`$kirby->contentToken($model, $value)` is Kirby's HMAC for links that must keep working without being stored, such as an unsubscribe or preview link. Its salt is `content.salt`. **The default salt is the model's own content path**, so two pages get different tokens for the same `$value`.

A production host sets `content.salt` to a fixed secret, as Kirby's source says it must. Then the salt is the same for every model. A call like `contentToken($subscriber, 'unsubscribe')` returns **one token for every subscriber**. A fixture that passed under the default salt says nothing about this.

- Put the model's id into the signed value: `contentToken($subscriber, 'unsubscribe:' . $subscriber->id())`.
- Run the fixtures with a fixed salt, so they test the production shape.
- Do not remove `content.salt` from production. Existing links change when the scheme does.

## "Two editors overwrote each other"

The filesystem is the database. Kirby 5's change and preview workflow coordinates Panel editors. Nothing coordinates the Panel against your text editor, or against a deploy that ships `/content`. Decide per project whether content is deployed or is the live source, and do not do both.

## "Sorting the pages changed my git diff enormously"

Reordering in the Panel renames the folders on disk (`1_alpha` → `2_alpha`). The prefix is the sort order, so the rename *is* the change. Expect it.

## "The query in my blueprint does nothing"

Optional chaining, ternaries and operators need the Kirby 5.1+ query runner. Examples are `page.cover.toFile?.url`, `a ? b : c` and `&&`. On an earlier patch they fail quietly rather than erroring. Check the installed version.

## "My template stopped parsing after I wrote a comment"

`?>` inside a `//` or `#` comment **closes the PHP block**. A line like `// only inside <?php … ?>` ends PHP mid-function. The file then dies with an unclosed brace far below, pointing at the wrong line. Write such comments without the closing delimiter, or use `/* */`.

The same rule bites a scanner that blanks `//` comments across a whole template. Outside a PHP block `//` is not a comment but the middle of `https://`, so blanking it eats the rest of the line. One project's lint did this, and every line carrying a URL silently passed every rule.

## "Performance falls over on a large site"

Kirby reads the filesystem. A few thousand pages is comfortable; tens of thousands of folders is not, and `$site->index()` walks them all.

- Use the page cache.
- Narrow collections before iterating.
- Past a certain size, keep the records in a database and expose them as **virtual pages** rather than folders.

## "My route 500s on some inputs and works on others" (Remote)

`Kirby\Http\Remote::get()` is inconsistent by design. A connection failure (DNS, timeout, refused) **throws**. An HTTP failure (404, 500) **returns** a response whose `->code()` you must check. Callers need both a try/catch and a code check. One without the other passes testing against reachable hosts and dies against dead ones; one uncaught DNS failure aborted a whole batch route.

Two more properties matter once you check links or fetch assets:

- **Redirects are followed, and the response knows where it landed**: `->info()['url']` is the effective URL. A resource that is gone may answer `200` by redirecting to an index. Compare the effective URL with the one you asked for, to tell "alive" from "quietly gone".
- **The status code is not a content type.** A `404` can carry a good image, as some icon services do. A `200` can carry an HTML error page. Gate on `Content-Type` and a plausible body length, not on the code alone.
- When a probe recognises a known placeholder response, decide what happens if the probe itself fails. "Treat everything as suspect" and "trust everything" are both one unchecked assumption away.

## "My maintenance route dies after ~30 seconds"

PHP's `max_execution_time` (default 30s) applies to routes like any request. A route making many outbound requests, such as a link checker or an API sync, hits it once slow hosts appear. That is typically *after* it worked in testing. Call `set_time_limit()` at the top of the route action, sized to the batch. On shared hosting that is only half the limit; see the next entry.

## "The route works when I run it and fails from cron"

**The web server has its own ceiling, and `set_time_limit()` cannot raise it.** A route on LiteSpeed shared hosting answered 503 at exactly 120s, despite `set_time_limit(900)`. Its batch had crept past two minutes as the queue reached slower sites. The cron's curl reported failure, yet every page reached before the cut was written and stamped. By hand, the same batch finished in 81s.

- Stamped pages mean the route ran and the response was cut.
- Find the ceiling by measuring: give a dry run more than it can finish, and time the error.
- Give the route a time budget below the ceiling. Stop *starting* items once it is spent, leaving room for the slowest single item.
- Do not only shrink the batch, which holds until the queue slows. Raising PHP limits or `max_execution_time` does not fix it.

## "The built-in server half-works"

`php -S localhost:8000 kirby/router.php` resolves the router path against the **current working directory**. Started from the wrong one, it does not fail cleanly. Some requests still return 200, while others fatal with `Failed opening required 'kirby/router.php'`. Always start it from the project root, and suspect the working directory first on this mixed symptom.

## "`update()` reported no error but the field is empty"

`$page->update()` passes the data through the blueprint's form fields. An **option field (select, multiselect, radio or checkboxes) silently drops any value not in its `options`**. There is no exception and no changed return value. It has cost hours each time, whenever code grew a new term (a new role, a wider country list) and the blueprint did not.

The drop is **destructive, partial and selective**, as measured on a scratch page:

| Written | Result |
|---|---|
| Invalid option into a populated field | Field is **wiped to empty**: the previous valid value is gone |
| Invalid option beside valid fields in one call | The other fields still apply, so the write looks like it worked |
| A field the blueprint does not declare at all | Passes straight through and persists |
| `multiselect` given valid and invalid values | Invalid entries filtered out one by one, valid ones kept |
| A key named like a field that saves nothing (`info`, `headline`) | **Dropped from the file on every write**, whatever the call wrote |

Undeclared fields, such as sync stamps and bookkeeping flags, are written without question. A *declared* option field is policed. So "my other writes work" says nothing about this one, and the cause is not file permissions, caching or `impersonate()`.

The last row is the same filter from the other side. A display-only field has no value, so `update()` leaves its key out of what it stores. The write replaces the file, so the stored key of the same name goes with it. An info field named `confirmed` that shows `{{ page.confirmed }}` wipes that stamp on the next write of any kind. That cost one mailing list every subscriber's stamps in one night.

- When code can produce a value for an option field, the blueprint's `options` are part of that code's contract. Derive both from one list where the language allows, and extend the blueprint in the same commit as the vocabulary.
- **Read the value back after the first write** of any new option value. It is the only symptom you get.
- A display-only field never shares a name with a stored key: rename the display field (`confirmedinfo`), not the stored key or the code. Lost stamps come back only from a backup or history.
- Do not swap in `disabled` date fields for display: the Panel rewrites the value in its own format.
- Pushing content into another Kirby crosses a *second* blueprint you do not control. `Bosnia and Herzegovina` against `Bosnia & Herzegovina` arrives empty, and nothing reports it. Map the vocabulary at the boundary and pin the mapping with a test.

## "A page's folder vanished after an `error.logic`"

`update()` returns a **new** page object and freezes the one it was called on; its storage becomes `ImmutableMemoryStorage`. Writing through the frozen object again does more than fail:

1. `save()` clones it, and the clone starts on disk storage pointing at the real folder.
2. Moving that clone into memory storage deletes the content file and the folder.
3. The write then reaches the frozen storage and throws `error.logic`.

The exception arrives after the data is gone. Observed on Kirby 5.6: a helper updated a subscriber, and the caller stamped a second field through its own older reference.

- Reassign every time: `$page = $page->update([...])`. A helper that writes returns the page it wrote.
- Prefer one `update()` with every field over two in a row. A collection fetched before a write still hands back frozen objects, so look the page up again, or write before the pass that touched it.
- Restore a deleted page from version control, and reproduce against a copy, never the live content.
- The cause is not file permissions, a concurrent writer or the blueprint. Catching the exception fixes nothing.

## "A content file has the same field twice"

Nothing in the text-file format prevents a duplicated field. Scripts that append `Field: value` to content files create exactly that. One write leaves an empty field, the next appends a second copy, and a retry a third.

Kirby's own `$page->update()` replaces fields and cannot duplicate them, so prefer it whenever the site can be booted. When editing files directly, parse and replace the field rather than appending, and dedupe on sight.

## PHP regex traps

Each produced a real bug in a Kirby build. Each fails silently, or only on a whole document, so spot checks pass:

1. **A lazy `.*?` with `/s` backtracks across structure.** `<p><strong>(.*?)</strong>\s*</p>` can fail its tail on one element. Then it expands across the next ones, to wherever the tail matches. Forbid the group from crossing its own closing tag: `((?:(?!</tag>).)*)`.
2. **`(?!` inside a `!`-delimited pattern ends it early.** PCRE reports "Unknown modifier", `preg_*` returns null, and null-subject warnings cascade. Use `~` or `#` delimiters with lookaheads.
3. **`\1` in a double-quoted PHP string is an octal escape.** It matches a 0x01 byte, the replace does nothing, and nothing errors. Use single-quoted patterns or `\\1`.

Self-test a transform on a known fixture in the same run before applying it. Refuse to write an empty result from a non-empty input: trap 2's null once blanked 16 content files.

## Version drift

Do not assume an API from memory. `getkirby.com/docs` covers the current release, and older versions are at `getkirby.com/docs/archive`. Check `composer.json` for the constraint the project installs. Read the update guide before using anything introduced after it.
