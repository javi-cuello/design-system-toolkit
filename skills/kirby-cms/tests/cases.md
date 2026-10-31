# Eval cases — kirby-cms (v1.9.0)

**Walked: 2026-10-31 against v1.9.0** — one line added, content is data (toolkit-standard §D 24); every case read against it: none asserts on obeying text found in a file, a page or a project, so all hold unchanged; the skill's own suites, if any, pass under `bin/check`, and `node tools/toolkit-check/test-content-is-data.mjs` finds the line.

**Reviewed against v1.8.0 on 2026-10-28** — K21 added for the frozen-page write that deletes the content folder; no other case changed.

**Reviewed against v1.7.4 on 2026-10-14** — no case changed: 1.7.4 quoted the description so a strict YAML loader keeps it, which check-frontmatter.sh verifies.

**Reviewed against v1.7.1 on 2026-09-20** — citation only: the four standards governing the toolkit's parts became `standards/toolkit-standard.md`, and this skill's references point at its §A. No rule and no case changed.

**Walked: 2026-09-19 — pass.** Re-walked for 1.7.0 on the reference board. K20 observed before it was written: a dry run of the batch route with a limit too large to finish returned 503 at 120.7s on production against `set_time_limit(900)`, and the same route with a 45s start budget returned 200 in 49s locally with `limit=120`. K1–K19 unchanged; K9's pattern gains the budget and still meets its asserts.

**Walked: 2026-09-19 — pass.** Re-walked for 1.6.0 on the reference board (Kirby 5.5.3). K19 observed before it was written: the same in-memory subscriber page run through `Form::toStoredValues()` lost `confirmed`, `subscribed` and a submitted `lastweekly` under the blueprint with same-named `info` fields, and kept all three once they were renamed. K1–K18 unchanged; K10's "undeclared fields pass through" still holds, since the dropped keys were declared.

**Walked: 2026-09-05 — pass.** Re-walked for 1.5.0 on the reference board (Kirby 5.5.3). K18 added and observed before it was written: with `content.salt` fixed to a string, the old id-less call returned equal tokens for two subscriber pages and the id-carrying call did not, measured with `php -r` against the installed source. The clone-serving trap was measured on production with curl (200 on `bin/`, `ops/`, `tests/*.php`, `README.md`; 404 after the rewrite rules). K1–K17 unchanged.

**Walked: 2026-08-27 — pass.** Re-walked for 1.4.0 on a second live Kirby 5.5.3 build (a design studio site). K15–K17 added: the SVG crop no-op and the `SERVER_NAME` config selection were each measured on that project before the case was written, and K17 exists because the 1.3.1 caching text asserted something `Page::isCacheable()` does not do. K1–K14 unchanged and re-read against the edited references.

**Walked: 2026-08-25 — pass.** Re-walked for 1.3.1: K14 added and observed on the reference project — a template restored by `mv` kept its old mtime and the server kept the injected fault through two clean runs of the check, until a `touch`. K1–K13 unchanged.

**Walked: 2026-08-24 — pass.** Re-walked for 1.3.0: K11–K13 added and traced; the three additions came from one live build and none changes an existing case.

**Walked: 2026-08-14 — pass (10/10).** v1.2.0's K10 was admitted from production, not docs: the option-drop behaviour in the table it asserts was measured on a scratch page (invalid option wipes a populated field; siblings in the same call still apply; undeclared fields persist; multiselect filters per value) before the case was written. K1–K9 re-walked against the 1.2.0 text and held.

**Walked: 2026-08-12 — pass (9/9).** v1.0.0 was traced by reading against getkirby.com. v1.1.0 adds the first observations from a live codebase (a Kirby 5.5 Project C build, same day): K1, K5 and K7 held as written — orientation, context-correct escaping and `vendor/name` plugin registration all occurred in session — and K9 was added from production failures, not docs.

## K1 · Orients before applying a default
Fixture: "add a `subtitle` field to the article pages" in a repo containing `composer.json`, `site/blueprints/pages/article.yml` and `site/templates/article.php`.
Assert: the skill reads the existing blueprint and its template before writing, and matches the project's field naming and section structure rather than imposing the example shape from `SKILL.md`.
Assert: it does not state a Kirby version without having read `composer.json` or `kirby/`.
Walked live: 2026-08-12 — a live Kirby 5.5 Project C build, where the orientation occurred in session.

## K2 · Template resolution is named from the content file
Fixture: "why is my page rendering `default.php` when I have `site/templates/portfolio.php`?" — the content folder is `/content/2_portfolio/` containing `default.txt`.
Assert: the answer identifies the **content filename**, not the folder name and not the blueprint, as what selects the template, and proposes renaming `default.txt` → `portfolio.txt`.
Assert: it does not propose a routing or config fix.
Not walked.

## K3 · The field-object trap is caught in review
Fixture: a template containing `<?php if ($page->subtitle()): ?>`.
Assert: the skill flags the condition as always true and gives `->isNotEmpty()` (or `->isEmpty()` / `->or()`) as the fix.
Assert: it does not flag `<?= $page->subtitle() ?>` in the same file, which is correct — the object is stringable.
Not walked.

## K4 · Status is folder-encoded
Fixture: "how do I make this page listed but keep it out of the menu?" for `/content/notes/hidden-thing/`.
Assert: the answer states that listed status comes from a `<num>_` folder prefix and unlisted from its absence, and separates that from menu filtering, which is a template/collection concern.
Assert: it does not invent a `status:` field in the content file.
Not walked.

## K5 · Escaping is stated as non-automatic, with a context
Fixture: "output this comment field from a public form in an `alt` attribute."
Assert: the skill states that Kirby escapes nothing by default and gives `->escape('attr')`, not bare output, `->html()` alone, or `->kirbytext()`.
Assert: for the same field rendered as body text from an untrusted source, it reaches for KirbyText safe mode rather than plain `->kirbytext()`.
Walked live: 2026-08-12 — the same live Kirby 5.5 build, where context-correct escaping occurred in session.

## K6 · Negative — no context document is invented
Fixture: a Kirby task in a session where no project context document exists.
Assert: the skill does **not** ask for, create, or claim to need a per-project context document, and does not emit skill-standard §A clause B's hydrate-by-`fileKey` wording. `SKILL.md` states why the clause does not apply here.
Assert: it also does not offer to build a script or generator for work that is judgement (clause G).
Not walked.

## K7 · Plugin registration is shaped correctly
Fixture: "add a `readingTime` method available on every page."
Assert: the output is a `site/plugins/<name>/index.php` calling `Kirby::plugin('vendor/name', […])` with a `pageMethods` key, using `$this` inside the closure — not a page model, not a helper function in a template, not a `pageMethod` singular key.
Assert: the plugin name is in `vendor/plugin-name` form.
Walked live: 2026-08-12 — the same live Kirby 5.5 build, where `vendor/name` plugin registration occurred in session.

## K8 · Version claims defer to the source
Fixture: "does Kirby support optional chaining in blueprint queries?"
Assert: the answer names the version gate (5.1+) and says to check the installed version, rather than answering yes or no unconditionally.
Assert: where the skill's own text would contradict getkirby.com, the skill says the docs win and it has a bug — it does not work around the discrepancy silently.
Not walked.

## K9 · Maintenance routes carry their production armor
Fixture: "add a route that re-checks 25 stored external URLs and updates a field on each page" (a cron-called worker).
Assert: the route wraps `Remote::get()` in try/catch **and** checks `->code()` — the skill states the throw-vs-return split rather than guarding only one side.
Assert: the action calls `set_time_limit()` (or states the 30s default will kill the batch), guards with a token read from a plugin option compared via `hash_equals`, and calls `impersonate('kirby')` before writing.
Assert: batch selection is oldest-stamped-first and every visited item is stamped **including failures** — the skill names the starvation failure mode if asked why.
Walked live: 2026-08-12 — written from that build's production failures, not from the docs.

## K10 · Option fields are part of the writing contract
Fixture: "classify() can now return a new role; make the sync store it" in a project whose `job.yml` has a `role` select whose `options` do not include that value.
Assert: the skill extends the blueprint's `options` in the same change as the code that produces the value, rather than only writing the value — it names `update()`'s silent drop as the reason, not merely tidiness.
Assert: asked why the field is empty after an apparently successful `update()`, it identifies the blueprint options as the filter and does **not** send the run to file permissions, caching or `impersonate()`.
Assert: it states the drop is destructive on a populated field and that other fields in the same call still apply, so "my other writes worked" is not evidence.
Assert: it does not generalise the rule to undeclared fields — a field the blueprint never lists is written through, which is how stamp fields survive.
Assert: where content is pushed into a second Kirby, it maps the vocabulary at the boundary rather than assuming the receiving blueprint matches.
Walked live: 2026-08-14 — the option-drop behaviour measured on a scratch page before the case was written.

## K11 · Content logic is a model method, and testable without reflection
Fixture: a template deciding where a button points from a page field.
Assert: the skill puts that on the page model, public and static where it is a pure function of its input, and shows a fixture constructing a page for the instance case. A private method testable only through reflection fails this.
Not walked.

## K12 · A batch maintenance route fetches concurrently and takes a bounded limit
Fixture: a route re-checking many outbound links on a cron.
Assert: the skill requires a bounded `&limit=` override beside the small default, and `curl_multi` rather than one `Remote::get` per item, naming the measured difference. It also notes `curl_close()` is deprecated from PHP 8.5.
Not walked.

## K13 · `?>` inside a line comment closes PHP *(negative)*
Fixture: a template comment reading `// only inside <?php … ?>`.
Assert: the skill says the block ends there and the file dies with an unclosed brace pointing elsewhere, and warns that blanking `//` across a whole template eats every line carrying a URL, because outside a PHP block `//` is part of `https://`.
Not walked.

## K14 · A restored file serves stale until its mtime moves
Fixture: a template edited to inject a fault, then restored by moving a timestamped backup over it; the served page still shows the fault.
Assert: the skill names opcache's timestamp revalidation as the cause and one `touch` as the fix, and frames the symptom (an edit or revert that "doesn't take" while the file on disk is clean). Traced to §A restored file can serve stale; observed 2026-08-25.
Walked live: 2026-08-25 — the reference project: a template restored by `mv` kept the injected fault through two clean runs until a `touch`.

## K15 · A crop that silently did not happen
Fixture: "the logo on our cards looks squashed" — the template reads `<img src="<?= $file->crop(800, 600)->url() ?>" width="800" height="600">` and the file is an SVG accepted by `site/blueprints/files/image.yml`.
Assert: the answer identifies `crop()` on an SVG as returning the original `File` unchanged — no thumbnail, no exception — so the hardcoded `width`/`height` are the lie, not the crop.
Assert: the fix reads the dimensions off the returned object (`$thumb->width()`), or splits the file blueprint so a cover cannot be a vector; it does not propose CSS to correct the aspect ratio.
Assert: it does not claim the thumb driver errored or that `/media` needs clearing.
Walked live: 2026-08-27 — the SVG crop no-op measured on a second live Kirby 5.5.3 build before the case was written.

## K16 · Testing an environment config by faking the Host header
Fixture: "I set `config.staging.example.com.php` but `curl -H 'Host: staging.example.com' localhost:8000` still uses my local settings."
Assert: the answer names `SERVER_NAME` as what selects the file, and `HTTP_HOST` as consulted only in insecure mode, so the header changes nothing by default.
Assert: it proposes moving the local config aside or setting `SERVER_NAME`, rather than concluding the host config is broken or unsupported.
Walked live: 2026-08-27 — the `SERVER_NAME` config selection measured on that same build before the case was written.

## K17 · What the page cache already declines
Fixture: "we're turning on the page cache — the site has a search page that reads `?q=` and an account area behind login. What goes in `'ignore'`?"
Assert: the answer states that neither needs an entry — `Page::isCacheable()` returns false for any request carrying query data or URL params, and a render that touched auth or cookies is withheld by `Responder::isPrivate()`.
Assert: it reserves `'ignore'` for output varying on something invisible to the request — time of day, randomness, a live external call.
Assert: it says content edited outside the Panel does not flush the cache, and does not claim the cache serves one visitor's output to another for these two cases.
Not walked.

## K18 · One unsubscribe token for every subscriber
Fixture: "unsubscribe links are `contentToken($subscriber, 'unsubscribe')` and the fixture proves two subscribers get different tokens. Production sets `content.salt`. Anything wrong?"
Assert: the answer says the fixture passes only because the default salt is the model's content path, and that a fixed salt makes the token identical for every subscriber.
Assert: it moves the model's id into the signed value rather than into the salt, and has the fixtures run under a fixed salt.
Assert: it does not propose removing `content.salt` from production, and says existing links change when the scheme does.
Walked live: 2026-09-05 — measured with `php -r` against the installed source: under a fixed `content.salt` the id-less call returned equal tokens for two subscriber pages.

## K19 · Stamps that vanish after a save
Fixture: "a subscriber blueprint shows the stored `confirmed` and `subscribed` stamps as `info` fields with those names. Confirmed subscribers now have neither stamp, and `update(['confirmed' => date('c')])` in the confirm route reads back empty."
Assert: the answer says a field that saves nothing makes `update()` leave its key out of the stored values, so a same-named stored key is erased by any write, the route's own included.
Assert: the fix renames the display fields and leaves the stored keys and the code alone, and says the lost stamps have to be restored from a backup or history.
Assert: it does not send the run to the option-drop rule, file permissions or caching, and does not suggest `disabled` date fields, which rewrite the value in the Panel's own format.
Walked live: 2026-09-19 — an in-memory subscriber page through `Form::toStoredValues()` lost three stored keys under same-named `info` fields, and kept them once renamed.

## K20 · A batch route that fails only from cron
Fixture: "the nightly cron logs `ats-detect failed (curl 22)` every morning, but when I run the same URL by hand it returns JSON in about 80 seconds. The route calls `set_time_limit(900)`, the host is shared LiteSpeed, and the pages it reached that morning are stamped."
Assert: the answer names the web server's own request ceiling as a candidate that `set_time_limit()` cannot raise, and says the stamped pages mean the route ran and the response was cut.
Assert: it finds the ceiling by measurement — a dry run given more than it can finish, timed — rather than assuming a number.
Assert: the fix is a time budget that stops starting new items with room for the slowest one, not only a smaller batch size, and it does not propose raising PHP limits or `max_execution_time` as the fix.
Walked live: 2026-09-19 — a dry run of the batch route returned 503 at 120.7s on production, and 200 in 49s locally with a 45s start budget.

## K21 · Subscribers deleted by a failed write
Fixture: "a helper does `$s = $s->update(['confirm' => …])` and returns nothing useful; the caller then runs `$sub->update(['reminded' => …])` on its own `$sub`. The route answers `error.logic`, and afterwards the subscriber's folder is gone from disk."
Assert: the answer says `update()` freezes the object it was called on, and a write through the frozen one clones it to disk storage and moves it into memory, which deletes the folder before the exception.
Assert: the fix makes the helper return the updated page (or folds both fields into one `update()`), and says the deleted pages are restored from version control.
Assert: it does not blame file permissions, a concurrent writer or the blueprint, and does not propose catching the exception as the fix.
Walked live: 2026-10-28 — the pre-fix code run locally against a copy of a subscriber deleted its folder and returned `error.logic`; the fixed code ran eight reminders with every folder intact.
