<?php
/**
 * One component, alone, with the design system's stylesheet and nothing
 * else. The gallery iframes this rather than rendering inline, so the
 * workbench chrome cannot reach into the component — and so a later parity
 * run measures the component rather than the page around it.
 *
 * @var string $name
 * @var array  $story
 */
$props = __PREFIX___controls($story);
?><!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title><?= esc($story['title'] ?? $name) ?></title>
  <meta name="robots" content="noindex">
  <?= css('assets/css/main.css') ?>
  <style>
    body { display: grid; place-items: center; min-height: 100vh; padding: 2rem; }
  </style>
</head>
<body>
<?php snippet('__PREFIX__/' . $name, $props) ?>
</body>
</html>
