# Failure modes, indexed by symptom

Companion to `SKILL.md`. Written symptom-first, because that is what you have when you are stuck. Everything here is Kirby 5.

## "My template isn't being used"

The template is chosen by the **content file name**, not the folder name and not the blueprint. `/content/1_about/about.txt` uses `site/templates/about.php`; if the file is `default.txt`, you get `default.php` no matter what the folder is called. Check the actual filename before anything else.

If the template lives in a plugin, `ls site/templates/` will not show it — grep `site/plugins/` for the `templates` extension key.

## "My blueprint isn't being used"

Same rule: `site/blueprints/pages/<content-file-name>.yml`. A blueprint named after the folder rather than the content file matches nothing and produces the Panel's bare default form.

A YAML parse error usually presents as a missing or half-rendered blueprint rather than an error message. Values containing `:` followed by a space, or starting with a special character, need quoting.

## "My controller isn't running"

The controller filename must equal the template filename exactly, including the plural/singular you got wrong (`projects.php` vs `project.php`). Controllers also do not run for content representations unless there is a matching `<template>.<ext>.php` controller.

## "My condition is always true"

`$page->anything()` returns a **Field object**, which is always truthy. Use `->isNotEmpty()` / `->isEmpty()`. This also bites in `??`, in ternaries, and in `empty()`.

```php
if ($page->subtitle()->isNotEmpty()) { … }
$value = $page->subtitle()->or('Fallback');
```

## "My field returns the wrong thing / an object I didn't expect"

The field name collides with a `$page` method — `image`, `num`, `children`, `files`, `audio`, `videos`, `url`, `slug`. Read it through the content object: `$page->content()->get('image')`. Better, rename the field.

## "The page 404s but the folder exists"

It is a draft — inside a `_drafts/` folder — or the site is cached. Drafts are invisible to visitors by design. Also check that a route pattern is not shadowing the page: routes match before page resolution unless given `'env' => 'site'`.

## "Pages are missing from my listing"

`->children()` returns what the context permits; `->listed()` returns only pages with a numeric folder prefix. An unlisted page (no prefix) is reachable by URL and absent from every `listed()` collection — which is usually the intent, and occasionally the bug.

## "My changes don't appear"

In order of likelihood: the page cache (`site/cache/`, clear it), the media cache for a changed image (`/media`, delete it), an opcode cache on the server, or an environment config file overriding what you edited. Content edited outside the Panel does not reliably invalidate the page cache.

## "My crop or resize did nothing, and the image is stretched"

The file is an SVG. `crop()` and `resize()` on one return the **original `File`, unchanged** — no thumbnail, no exception, no log line. Verified on Kirby 5.5.3: a 240x80 SVG asked for `crop(800, 600)` came back a 240x80 `File` whose `url()` is the source file.

That is the right behaviour for a vector, and it is only a bug where the caller assumed otherwise. The usual shape is a template that hardcodes the size it asked for:

```php
<img src="<?= $file->crop(800, 600)->url() ?>" width="800" height="600">   <!-- lies for an SVG -->

<?php $thumb = $file->crop(800, 600) ?>                                    <!-- correct for both -->
<img src="<?= $thumb->url() ?>" width="<?= $thumb->width() ?>" height="<?= $thumb->height() ?>">
```

It reaches production because logos want SVG and photos want JPEG, and one `site/blueprints/files/image.yml` usually accepts both. Take the dimensions off the returned file, or split the blueprint so a cover cannot be a vector.

## "HTML from my content is escaped, or worse, isn't"

Kirby escapes nothing automatically. `<?= $page->text() ?>` is raw. `->html()` and `->escape()` escape; `->kirbytext()` renders Markdown and KirbyTags and deliberately allows HTML through. Untrusted KirbyText needs `['markdown' => ['safe' => true]]`.

Escaping in an attribute, in CSS, in JS or in a URL needs that context passed — `->escape('attr')` and so on. The default `html` context in an attribute is not sufficient.

## "My text has a line break I didn't write"

Kirby's Markdown runs with **`breaks` on by default**, so a single newline inside a paragraph becomes a `<br>`. A prose field wrapped across two lines in the content file — which is what a text editor does, and what a heredoc in a seeding script does — renders with a break mid-sentence.

Keep a paragraph on one line in the content file, or set `'markdown' => ['breaks' => false]` in config if the project would rather have CommonMark's rule. The Panel writes one line per paragraph, so this shows up on hand-written and generated content, not on content an editor typed.

## "It works locally and breaks on the server"

- `.htaccess` is Apache only. On nginx or Caddy the rewrite rules and the blocking of `/content`, `/site`, `/kirby` must be written by hand. Missing blocks mean content files are publicly downloadable.
- Case-sensitive filesystem. macOS is not; Linux is. `Header.php` vs `header.php`.
- `'debug' => true` left in the base config leaks stack traces. It belongs in `config.localhost.php`.
- **`config.<host>.php` is selected from `SERVER_NAME`, not the `Host:` header.** `Environment::detectHost()` only consults `HTTP_HOST` in insecure mode, so `curl -H "Host: staging.example.com"` does **not** load `config.staging.example.com.php` — it silently keeps the local one, and a test of an environment override quietly proves nothing. Verified on 5.5.3. To exercise a host config locally, move the local one aside or set `SERVER_NAME`.
- File permissions on `/content`, `/media` and `site/accounts/`, all of which Kirby writes to.
- **A web root that is a git clone serves the whole clone.** Kirby's `.htaccess` blocks dotfiles, `/content`, `/site` and `/kirby` and nothing else; every other tracked path is a URL, and a `.php` under `tests/` or `bin/` *executes* on request. A live site served its deploy script, its crontab, a README carrying the SSH address, and ran its fixture suite as PHP for anyone who asked. Either the web root is a `public/` folder, or `.htaccess` sends `bin/`, `ops/`, `tests/`, `docs/`, `*.md` and `package*.json` to `index.php` — and the check that proves it has to ask production, because `php -S` honours no `.htaccess`.
- **`content.salt` changes what `contentToken()` distinguishes.** With the default (the model's content path) every model has its own salt; with a fixed production salt, a token whose signed value does not contain the model's id is the same for every model. Fixtures run under the default pass either way — see `SKILL.md`, "Signed tokens".

## "Two editors overwrote each other"

The filesystem is the database. The Panel's change/preview workflow in Kirby 5 coordinates Panel editors, but nothing coordinates the Panel against your text editor or a deploy that ships `/content`. Decide per project whether content is deployed or is the live source, and do not do both.

## "Sorting the pages changed my git diff enormously"

Reordering in the Panel renames the folders on disk (`1_alpha` → `2_alpha`). That is the sort order, so the rename *is* the change. Expect it.

## "The query in my blueprint does nothing"

Optional chaining, ternaries and operators (`page.cover.toFile?.url`, `a ? b : c`, `&&`) require the Kirby 5.1+ query runner. On an earlier patch they fail quietly rather than erroring. Check the installed version.

## "My template stopped parsing after I wrote a comment"

`?>` inside a `//` or `#` comment **closes the PHP block**. The parser does not treat it as commented out, so a line like `// only inside <?php … ?>` ends PHP mid-function and the file dies with an unclosed brace far below, pointing at the wrong line. Write such comments without the closing delimiter, or use `/* */`. The same rule bites a scanner that blanks `//` comments across a whole template: outside a PHP block `//` is not a comment at all, it is the middle of `https://`, so blanking it eats the rest of the line — one project shipped a lint that way and every line carrying a URL silently passed every rule.

## "Performance falls over on a large site"

Kirby reads the filesystem. A few thousand pages is comfortable; tens of thousands of folders is not, and `$site->index()` on such a site walks all of them. The answers are the page cache, narrowing collections before iterating, and — past a certain size — keeping the records in a database and exposing them as **virtual pages** rather than folders.

## "My route 500s on some inputs and works on others" (Remote)

`Kirby\Http\Remote::get()` is inconsistent by design: a connection-level failure (DNS, timeout, refused) **throws**, while an HTTP-level failure (404, 500) **returns** a response whose `->code()` you must check. Callers need both a try/catch and a code check — one without the other passes testing against reachable hosts and dies in production against dead ones. Observed live: one uncaught DNS failure aborted a whole batch route.

Two further properties of the same class, both load-bearing once you check links or fetch assets:

- **Redirects are followed, and the response knows where it landed** — `->info()['url']` is the effective URL. That is often the only evidence you get: a resource that no longer exists may answer `200` because it redirected to an index or a listing, so comparing the effective URL against the identifier you asked for distinguishes "alive" from "quietly gone" when the status code cannot.
- **The status code is not a content type.** A `404` can carry a perfectly good image (some icon services answer exactly that way), and a `200` can carry an HTML error page where you expected a file. Gate on `Content-Type` and a plausible body length, not on the code alone — and when a probe exists to recognise a known placeholder response, decide deliberately what happens if the probe itself fails, because "treat everything as suspect" and "trust everything" are both reachable from one unchecked assumption.

## "My maintenance route dies after ~30 seconds"

PHP's `max_execution_time` (default 30s) applies to routes like any other request. A route that makes many outbound requests — a link checker, an API sync — hits it as soon as slow hosts appear, which is typically *after* it has worked in testing. `set_time_limit()` at the top of the route action, sized to the batch — and on shared hosting that is only half the limit; see the next entry.

## "The route works when I run it and fails from cron"

**The web server has its own ceiling, and `set_time_limit()` cannot raise it.** A live site on LiteSpeed shared hosting answered 503 at exactly 120s to a route that had `set_time_limit(900)` — measured with a dry run given a batch too large to finish. The batch of 40 had crept past two minutes as the queue reached slower external sites, so the cron's curl reported the route failed three mornings running, while every page it reached before the cut was still written and stamped. Run by hand the same batch finished in 81s and looked fine. Find the ceiling by giving a dry run more than it can finish and timing the error, then give the route a time budget below it — stop *starting* items once the budget is spent, leaving room for the slowest single item — rather than tuning the batch size, which only holds until the queue gets slower.

## "The built-in server half-works"

`php -S localhost:8000 kirby/router.php` resolves the router path against the **current working directory**. Started from the wrong directory it does not fail cleanly: some requests may still return 200 while others fatal with `Failed opening required 'kirby/router.php'`. Always start it from the project root, and suspect cwd first when this mixed symptom appears.

## "`update()` reported no error but the field is empty"

`$page->update()` passes the data through the blueprint's form fields, so a **`select`, `multiselect`, `radio` or `checkboxes` field silently drops any value that is not in its `options`**. There is no exception and no changed return value; the write simply does not contain what you sent. Observed live four times in one day, on two sites, costing hours each time — code had grown a new vocabulary term (a new role, a wider country list) and the blueprint had not.

What makes it expensive is that the drop is **destructive, partial, and selective**, verified on a scratch page:

| Written | Result |
|---|---|
| Invalid option into a populated field | Field is **wiped to empty** — the previous valid value is gone, not preserved |
| Invalid option alongside valid fields in one call | The other fields still apply, so the write looks like it worked |
| A field the blueprint does not declare at all | Passes straight through and persists |
| `multiselect` given a mix of valid and invalid | Invalid entries filtered out individually, valid ones kept |
| A key that shares its name with a field that saves nothing (`info`, `headline`, …) | **Dropped from the file on every write**, whatever the call was writing |

The last two are the surprising pair: undeclared fields — sync stamps, bookkeeping flags — are written without question, while a *declared* option field is policed. So "my other writes work" tells you nothing about this one.

The last row is the same filter from the other side: a declared field that has no value (`info` and the other display-only types) is left out of what `update()` stores, and since the write replaces the file, the stored key of the same name goes with it. Naming an info field after the stamp it displays — `confirmed` showing `{{ page.confirmed }}` — looks tidy and wipes that stamp on the next write of any kind, Panel save or code. It cost a live mailing list every subscriber's confirmation and sign-up stamps in one night, and the confirm route's own `update(['confirmed' => …])` could never have stuck. Give display fields their own names (`confirmedinfo`).

The rules that follow:

- When code can produce a value for an option field, the blueprint's `options` are part of that code's contract. Derive both from one list where the language allows it, and extend the blueprint in the same commit as the vocabulary.
- **Read the value back after the first write** of any new option value. This is the only symptom you get.
- A display-only field never shares a name with a stored key.
- Crossing a site boundary — pushing content into another Kirby via an API or import route — crosses a *second* blueprint you do not control. Two country names differing only in spelling (`Bosnia and Herzegovina` against `Bosnia & Herzegovina`) arrive empty and nothing anywhere reports it. Map the vocabulary at the boundary and pin the mapping with a test.

## "A page's folder vanished after an `error.logic`"

`update()` returns a **new** page object and freezes the one it was called on (its storage becomes `ImmutableMemoryStorage`). Writing through the frozen object again does not just fail: `save()` first clones it, the clone starts on disk storage pointing at the real folder, and moving that clone into memory storage deletes the content file and the folder — then the write reaches the frozen storage and throws `error.logic`. The exception arrives after the data is gone. Observed live in Kirby 5.6 (2026-10-28): a helper updated a subscriber and the caller stamped a second field on its own, older reference; each subscriber it touched was deleted.

The rules that follow:

- Reassign every time: `$page = $page->update([...])`, and a helper that writes returns the page it wrote.
- Prefer one `update()` with every field over two in a row; a collection fetched before a write still hands back the frozen objects, so look a page up again (or write before the pass that touched it).
- Restore a deleted page from version control, and reproduce against a copy, never the live content.

## "A content file has the same field twice"

Nothing in the text-file format prevents a duplicated field, and scripts that append `Field: value` to content files create exactly that (observed live: an empty `Description:` left by one write, a second `Description:` appended by the next, and a third by a retry). Kirby's own `$page->update()` replaces fields and cannot produce duplicates — prefer it whenever the site can be booted; when editing files directly, parse and replace the field rather than appending, and dedupe on sight.

## Version drift

Do not assume an API from memory. `getkirby.com/docs` covers the current release; older versions are at `getkirby.com/docs/archive`. Check `composer.json` for the constraint the project actually installs, and read the update guide before using something introduced after it.
