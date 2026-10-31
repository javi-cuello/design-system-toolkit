<?php
/**
 * Props only — the gallery renders these through the real snippet, so what
 * the gallery shows is what a template gets.
 */
return [
    'title' => 'Button',
    'tier'  => 'Native interactive',
    'about' => 'A custom element carrying the variant, wrapping a real <button> or <a>. '
             . 'The browser owns activation, focus, disabled and form submission.',
    'api' => [
        'label'    => 'the text',
        'size'     => 'lg · md · sm',
        'variant'  => 'primary · secondary',
        'href'     => 'renders an <a>; without it, a <button>',
        'disabled' => 'true renders a disabled <button> or an <a> without href',
        'type'     => 'submit · button  (when it is a button)',
        'attrs'    => 'extra attributes, e.g. popovertarget',
    ],
    'controls' => [
        'label'    => ['type' => 'text',    'default' => 'Book a call'],
        'size'     => ['type' => 'select',  'options' => ['lg', 'md', 'sm'], 'default' => 'md'],
        'variant'  => ['type' => 'select',  'options' => ['primary', 'secondary'], 'default' => 'primary'],
        'disabled' => ['type' => 'boolean', 'default' => false],
    ],
];
