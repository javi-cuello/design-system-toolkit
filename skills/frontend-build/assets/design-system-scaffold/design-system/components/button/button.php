<?php
/**
 * __PREFIX__/button — the worked example.
 *
 * Kind 2, native interactive: the custom element carries the variant, the
 * real <button> or <a> inside carries the behaviour, the semantics and the
 * accessibility. Never put `disabled` on the wrapper — the browser would
 * stop keeping it out of the tab order and out of form submission.
 */
$size     = $size     ?? 'md';
$variant  = $variant  ?? 'secondary';
$type     = $type     ?? 'button';
$disabled = $disabled ?? false;
$label    = $label    ?? '';

$extra = __PREFIX___attrs($attrs ?? []);
?>
<__PREFIX__-button size="<?= esc($size, 'attr') ?>" variant="<?= esc($variant, 'attr') ?>">
  <?php if (!empty($href) && $disabled === false): ?>
  <a href="<?= esc($href, 'attr') ?>"<?= $extra ?>><?= esc($label) ?></a>
  <?php elseif (!empty($href)): ?>
  <?php /* no href: unfocusable and unfollowable, which is a disabled link */ ?>
  <a aria-disabled="true"<?= $extra ?>><?= esc($label) ?></a>
  <?php else: ?>
  <button type="<?= esc($type, 'attr') ?>"<?= $disabled ? ' disabled' : '' ?><?= $extra ?>><?= esc($label) ?></button>
  <?php endif ?>
</__PREFIX__-button>
