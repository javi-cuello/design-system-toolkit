<?php
/**
 * The workbench. Lists every component that has a story, and renders the
 * current one through its own snippet with the controls applied.
 *
 * Deliberately knows nothing about any design tool. A parity or drift check
 * attaches later by reading the same story files — see the design-code-parity
 * skill — and this page grows a deviations tab then. Until it does, the
 * gallery works on the first day of a project with no design source wired up.
 *
 * @var array       $components  name => story
 * @var string|null $current
 */
$story = $current ? $components[$current] : null;
$props = $story ? __PREFIX___controls($story) : [];
$frame = $story ? '/design-system/' . $current . '/frame?' . http_build_query(
    array_map(fn ($v) => $v === true ? '1' : $v, array_filter($props, fn ($v) => $v !== false && $v !== ''))
) : null;
?><!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title><?= $story ? esc($story['title'] ?? $current) . ' · ' : '' ?>Design system</title>
  <meta name="robots" content="noindex">
  <style>
    /* The workbench's own chrome. It never reaches the component, which is
       in an iframe — that isolation is the reason this file carries CSS at
       all rather than using the system it is displaying. */
    :root { color-scheme: light dark; --line: color-mix(in oklab, currentColor 18%, transparent); }
    * { box-sizing: border-box; }
    body { margin: 0; font: 15px/1.5 system-ui, sans-serif; display: grid; grid-template-columns: 15rem 1fr; min-height: 100vh; }
    nav { border-right: 1px solid var(--line); padding: 1.25rem; }
    nav h1 { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.08em; opacity: 0.6; margin: 0 0 0.75rem; }
    nav ul { list-style: none; margin: 0; padding: 0; }
    nav a { display: block; padding: 0.3rem 0; color: inherit; text-decoration: none; }
    nav a[aria-current] { font-weight: 700; }
    main { padding: 1.75rem 2rem; min-width: 0; }
    h2 { margin: 0 0 0.25rem; }
    .tier { font-size: 0.8125rem; opacity: 0.7; margin: 0 0 1rem; }
    .about { max-width: 60ch; }
    iframe { width: 100%; height: 18rem; border: 1px solid var(--line); border-radius: 0.5rem; margin-block: 1.25rem; background: canvas; }
    form { display: flex; flex-wrap: wrap; gap: 1rem; align-items: end; padding: 1rem; border: 1px solid var(--line); border-radius: 0.5rem; }
    label { display: grid; gap: 0.25rem; font-size: 0.8125rem; }
    table { border-collapse: collapse; margin-top: 1.5rem; font-size: 0.875rem; }
    th, td { text-align: left; padding: 0.35rem 1rem 0.35rem 0; border-bottom: 1px solid var(--line); vertical-align: top; }
    code { font-family: ui-monospace, monospace; }
  </style>
</head>
<body>

<nav>
  <h1>Components</h1>
  <ul>
    <?php foreach ($components as $name => $item): ?>
    <li>
      <a href="/design-system/<?= esc($name, 'attr') ?>"<?= $name === $current ? ' aria-current="page"' : '' ?>>
        <?= esc($item['title'] ?? $name) ?>
      </a>
    </li>
    <?php endforeach ?>
  </ul>
</nav>

<main>
  <?php if ($story === null): ?>
  <h2>Design system</h2>
  <p class="about">
    <?= count($components) ?> component<?= count($components) === 1 ? '' : 's' ?>.
    Each one is a folder under <code>assets/design-system/components/</code> holding its
    markup, its styles and this story. Adding a folder adds a component; nothing lists them.
  </p>
  <?php else: ?>
  <h2><?= esc($story['title'] ?? $current) ?></h2>
  <?php if (!empty($story['tier'])): ?><p class="tier"><?= esc($story['tier']) ?></p><?php endif ?>
  <?php if (!empty($story['about'])): ?><p class="about"><?= esc($story['about']) ?></p><?php endif ?>

  <iframe src="<?= esc($frame, 'attr') ?>" title="<?= esc($story['title'] ?? $current, 'attr') ?> preview"></iframe>

  <?php if (!empty($story['controls'])): ?>
  <?php /* a plain GET form, so every state of the component has a URL */ ?>
  <form method="get" action="/design-system/<?= esc($current, 'attr') ?>">
    <?php foreach ($story['controls'] as $name => $control): ?>
    <label>
      <span><?= esc($name) ?></span>
      <?php if (($control['type'] ?? 'text') === 'select'): ?>
      <select name="<?= esc($name, 'attr') ?>">
        <?php foreach ($control['options'] ?? [] as $option): ?>
        <option<?= $props[$name] === $option ? ' selected' : '' ?>><?= esc($option) ?></option>
        <?php endforeach ?>
      </select>
      <?php elseif (($control['type'] ?? 'text') === 'boolean'): ?>
      <input type="checkbox" name="<?= esc($name, 'attr') ?>" value="1"<?= $props[$name] ? ' checked' : '' ?>>
      <?php else: ?>
      <input type="text" name="<?= esc($name, 'attr') ?>" value="<?= esc($props[$name], 'attr') ?>">
      <?php endif ?>
    </label>
    <?php endforeach ?>
    <button type="submit">Apply</button>
  </form>
  <?php endif ?>

  <?php if (!empty($story['api'])): ?>
  <table>
    <caption class="visually-hidden">Props</caption>
    <thead><tr><th scope="col">Prop</th><th scope="col">Takes</th></tr></thead>
    <tbody>
      <?php foreach ($story['api'] as $prop => $takes): ?>
      <tr><td><code><?= esc($prop) ?></code></td><td><?= esc($takes) ?></td></tr>
      <?php endforeach ?>
    </tbody>
  </table>
  <?php endif ?>
  <?php endif ?>
</main>

</body>
</html>
