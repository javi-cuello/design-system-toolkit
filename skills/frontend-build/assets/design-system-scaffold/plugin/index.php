<?php

/**
 * Registers assets/design-system/components/<name>/<name>.php as
 * snippet('__PREFIX__/<name>'), and serves the gallery at /design-system.
 *
 * Adding a component is adding a folder. Nothing here lists them.
 */
$root = dirname(__DIR__, 3) . '/assets/design-system';

/**
 * Extra attributes for a component's control, escaped and validated.
 *
 * One implementation rather than a copy of this loop in every snippet: true
 * renders a boolean attribute, anything else is escaped for attribute
 * context, and a name that is not a plain attribute name throws — a caller's
 * typo must fail the render, not ship as markup.
 */
function __PREFIX___attrs(array $attrs): string
{
    $out = '';
    foreach ($attrs as $k => $v) {
        if (preg_match('/^[a-z][a-z0-9-]*$/', $k) !== 1) {
            throw new InvalidArgumentException('__PREFIX___attrs: "' . $k . '" is not an attribute name');
        }
        $out .= $v === true ? ' ' . $k : ' ' . $k . '="' . esc($v, 'attr') . '"';
    }
    return $out;
}

/**
 * A story's control values for this request: the query string where it says
 * something, the control's default where it does not. The gallery and the
 * frame both need the same answer — the gallery to build the frame's URL,
 * the frame to render — so it is computed once here.
 */
function __PREFIX___controls(array $story): array
{
    $props = [];
    foreach ($story['controls'] ?? [] as $name => $control) {
        $raw   = is_string(get($name)) ? get($name) : null;
        $value = $raw ?? ($control['default'] ?? '');
        $props[$name] = ($control['type'] ?? 'text') === 'boolean'
            ? ($value === true || $value === '1')
            : $value;
    }
    return $props;
}

$snippets = [
    '__PREFIX__-gallery'       => $root . '/gallery/gallery.php',
    '__PREFIX__-gallery-frame' => $root . '/gallery/frame.php',
];
foreach (glob($root . '/components/*/*.php') ?: [] as $file) {
    $name = basename($file, '.php');
    // components/button/button.php is the component; button.stories.php is not
    if (basename(dirname($file)) === $name) {
        $snippets['__PREFIX__/' . $name] = $file;
    }
}

$stories = function () use ($root) {
    $out = [];
    foreach (glob($root . '/components/*/*.stories.php') ?: [] as $file) {
        $out[basename($file, '.stories.php')] = require $file;
    }
    ksort($out);
    return $out;
};

// The gallery is a workbench: it reflects query strings into snippets, so it
// is served only where config opts in. Never turn this on in production.
Kirby::plugin('__VENDOR__/design-system', [
    'snippets' => $snippets,
    'routes' => option('__VENDOR__.designsystem.gallery') !== true ? [] : [
        [
            'pattern' => 'design-system',
            'action'  => fn () => new Kirby\Http\Response(
                snippet('__PREFIX__-gallery', ['components' => $stories(), 'current' => null], true)
            ),
        ],
        [
            // the component alone, with the design system's stylesheet and
            // nothing else — this is what the gallery iframes, and what a
            // parity run would measure
            'pattern' => 'design-system/(:any)/frame',
            'action'  => function (string $name) use ($stories) {
                $all = $stories();
                return isset($all[$name]) === false ? false : new Kirby\Http\Response(
                    snippet('__PREFIX__-gallery-frame', ['name' => $name, 'story' => $all[$name]], true)
                );
            },
        ],
        [
            'pattern' => 'design-system/(:any)',
            'action'  => function (string $name) use ($stories) {
                $all = $stories();
                return isset($all[$name]) === false ? false : new Kirby\Http\Response(
                    snippet('__PREFIX__-gallery', ['components' => $all, 'current' => $name], true)
                );
            },
        ],
    ],
]);
