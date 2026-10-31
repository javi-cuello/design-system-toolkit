# Extending Kirby — plugins, hooks, routes, config, users, API, virtual content

Companion to `SKILL.md`. Everything here is Kirby 5.

## Plugin anatomy

The smallest plugin is one file:

```
site/plugins/my-plugin/index.php
```

```php
<?php

Kirby::plugin('my-name/my-plugin', [
  // extension keys
]);
```

Named arguments read better once the array grows:

```php
Kirby::plugin(
    name: 'my-name/my-plugin',
    extends: [
        'snippets'  => [ /* … */ ],
        'templates' => [ /* … */ ],
        'hooks'     => [ /* … */ ]
    ]
);
```

The name is `vendor/plugin-name` and must be unique across the installation; it is also the key used to read plugin options from config (`option('my-name/my-plugin.setting')`).

Three setups, in increasing order of ceremony:

- **Basic** — everything in `index.php`, or `require`d from it. Fine up to a few hundred lines.
- **Autoloader** — `Kirby\Toolkit\Dir` / Composer PSR-4 autoloading of classes in `src/`, with `index.php` doing only registration. Use when the plugin has real classes.
- **Composer package** — publishable, installed by `composer require`, landing in `site/plugins/<name>/` via the Kirby installer. Use when others will install it.

Panel-facing plugins (custom fields, sections, views) additionally ship a built `index.js` and are the one case where a build step is unavoidable.

## Extension keys

Around sixty exist. The ones that carry most work:

| Key | Registers |
|---|---|
| `snippets`, `templates`, `blueprints`, `collections` | files by name → absolute path |
| `routes` | frontend routes (same shape as config routes) |
| `hooks` | event listeners |
| `pageMethods`, `pagesMethods`, `fileMethods`, `filesMethods`, `siteMethods`, `userMethods` | methods on those objects; `$this` is the object |
| `fieldMethods` | methods on every field object; receives `$field` |
| `pageModels` | template name → class name |
| `fields`, `sections`, `blocks` | custom Panel field / section / block types |
| `kirbyTags` | new `(tag: …)` syntax |
| `validators` | new blueprint validation rules |
| `translations` | UI strings per language |
| `options` | the plugin's own default options |
| `api`, `areas`, `dialogs`, `drawers`, `dropdowns`, `permissions`, `commands` | Panel and API surface |
| `cacheTypes`, `components`, `authChallenges` | core replacement points |

`components` overrides core behaviour — the URL builder, the markdown parser, the thumb driver, `snippet` resolution. Powerful and global; if two plugins override the same component, the last loaded wins silently.

## Hooks

`entity.action:before` or `:after`.

```php
'hooks' => [
  'page.update:after' => function ($newPage, $oldPage) {
    // …
  },
  'file.create:after' => function ($file) {
    // …
  },
  'route:before' => function ($route, $path, $method) {
    // …
  }
]
```

Arguments differ per hook — check the hook reference rather than guessing; a wrong signature fails at call time, not at registration. `:before` hooks can modify the incoming data by returning it, and can abort by throwing. Inside a hook, `$this` is the `Kirby` instance.

Hooks also register in `config.php` under a `hooks` key, which is the right place for site-specific reactions that will never be reused.

## Routes

```php
// site/config/config.php
return [
  'routes' => [
    [
      'pattern' => 'search',
      'action'  => function () {
        $query = get('q');
        return page('search')->render(['query' => $query]);
      }
    ],
    [
      'pattern' => 'api/projects/(:any)',
      'method'  => 'GET|POST',
      'action'  => function ($slug) {
        $project = page('projects/' . $slug);
        return $project ? ['title' => $project->title()->value()] : false;
      }
    ]
  ]
];
```

Placeholders: `(:any)` up to the next slash, `(:all)` including slashes, `(:num)`, `(:alpha)`, `(:alphanum)`, or a raw regex. They become the action's arguments in pattern order.

Return values: a page object, a file object, an HTML string, an array (serialised to JSON), a `Kirby\Http\Response`, or `false`/`null`/`''` for a 404.

Routes are matched **before** Kirby's own page resolution by default, so a route pattern that collides with a page slug shadows the page. Give a route `'env' => 'site'` to run after, when that is what you want.

### Maintenance routes (cron-called workers)

A recurring shape for content that maintains itself — link checkers, API syncs, imports. The pieces that make it safe, each earned in a live run:

```php
'routes' => [[
  'pattern' => 'link-check',
  'action'  => function () {
    $token = option('vendor.plugin.token');
    if (empty($token) || hash_equals($token, (string)get('token')) !== true) {
      return new Kirby\Http\Response('Unauthorized', 'text/plain', 401);
    }
    set_time_limit(300);                  // outbound requests outlive PHP's 30s default
    $start = microtime(true);             // …but not the web server's own cut (gotchas)
    kirby()->impersonate('kirby');        // content writes need an authenticated context

    // …batch work, starting no item once microtime(true) - $start passes
    // the budget: $page->update([…]), $parent->createChild([…])…

    return ['checked' => $n];             // array → JSON response
  }
]]
```

- The token is a plugin option (`option('vendor.plugin.token')`), overridden per environment — never a literal in the route.
- `impersonate('kirby')` is required before `update()`/`createChild()`/`changeStatus()` from a public route; without it writes fail on permissions.
- Process in bounded batches (N items per call, oldest-stamped first) and **stamp every item visited — including failures** — or permanently-failing items recycle to the front of the queue and starve the rest.
- Batch + cron beats one long run: each call stays inside timeouts, and the cron provides the loop.
- Take a **bounded size override** (`&limit=`, clamped) as well as the small default. The default keeps the cron cheap; the override is how a backlog gets cleared deliberately, and without it a queue that falls behind can only catch up at the cron's pace.
- **`Remote::get` is one request at a time, and a route that checks many links spends its life waiting.** Kirby has no batch fetch; `curl_multi` is the answer, and the difference is not marginal — a hundred URLs went from minutes to 42 seconds in one project, because the batch now costs its slowest member rather than the sum of them all. Structure such a route in phases: fetch everything concurrently, decide, then fetch whatever the decisions turned out to need (also concurrently). Note `curl_close()` is deprecated from PHP 8.5 and has done nothing since 8.0 — `curl_multi_remove_handle()` alone is correct.

```php
// one round trip for the whole batch, not one per item
$multi = curl_multi_init();
foreach ($urls as $url) { $ch = curl_init($url); curl_setopt_array($ch, [...]); curl_multi_add_handle($multi, $ch); $handles[$url] = $ch; }
do { curl_multi_exec($multi, $running); if ($running) curl_multi_select($multi, 1.0); } while ($running);
```

## Config

`site/config/config.php` returns an array. Environment-specific files are picked by hostname and merged over it:

```
config.php                        base
config.localhost.php              local dev
config.staging.example.com.php    staging
config.example.com.php            production
config.cli.php                    CLI runs
env.php                           deployment-specific indirection
```

Options that shape a project most: `debug`, `url`, `languages`, `cache`, `panel`, `routes`, `hooks`, `date.handler`, `markdown`, `thumbs`, `smartypants`, `api`, `email`, plus any plugin's namespaced options.

`'debug' => true` in the base config is the classic production leak. Put it in `config.localhost.php` only.

Read options in code with `option('key', $default)` or `$kirby->option('key')`.

## Users, roles and permissions

Users are content too — folders under `site/accounts/`, one per user, with an `index.php` holding credentials and a content file for the fields. Roles are blueprints at `site/blueprints/users/<role>.yml`; the file name is the role id, and `admin` always exists with everything permitted.

```yaml
title: Editor
description: Can edit content but not settings
permissions:
  access:
    settings: false
  pages:
    delete: false
  site:
    update: false
```

Permissions cascade: a blueprint's own `options:` can further restrict what a role may do to that specific model. Frontend authentication uses the same user store — `$kirby->user()`, `$kirby->impersonate()`, and a login form calling `$user->login($password)`.

## Multi-language

Enable with `'languages' => true`; language definitions live in `site/languages/<code>.php` and hold the code, name, locale, direction, URL prefix and custom translation strings. Content files gain the language suffix (`article.en.txt`). In templates, `$kirby->languages()`, `$kirby->language()`, `$page->url('de')`, and `t('key')` for interface strings.

A field marked `translate: false` in the blueprint stays shared across all languages.

## The API

Kirby ships a REST API at `/api`, authenticated by session or HTTP Basic (which must be explicitly enabled and requires HTTPS). It is the Panel's own backend, so everything the Panel does is available. Extend it with the `api` extension key. For headless use, most projects prefer their own routes or content representations over the built-in API, because the built-in shapes are Panel-shaped rather than frontend-shaped.

## Virtual content

Pages need not exist on disk. Override `children()` in a page model, or register `pages` from a plugin, to build page objects from an API, a database, a CSV or an RSS feed — they then behave like any other page for templates, collections and routing. This is Kirby's answer to "but I have 50,000 records": keep those in a database and expose them as virtual pages, rather than creating 50,000 folders.

`site/config/` also permits a real database connection (`Db::connect()`), used the same way inside models.
