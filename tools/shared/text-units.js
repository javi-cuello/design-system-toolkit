// A text style's line height or letter spacing, as Figma stores it ({ unit, value }), as a fraction of its font
// size: the unitless line height and the em letter spacing the web takes. PERCENT is of the font size, PIXELS is
// divided by it; AUTO, or pixels with no font size, is null (the caller says what it does instead: the snapshot
// measures an AUTO, the token build omits one it could not measure, the docs page writes "Auto").
//
// Four decimal places, by toFixed, is the canonical precision: the snapshot stores it, the token build writes it, and
// the docs page shows it, so a 133.33% line height is 1.3333 in all three (the docs page once rounded it to 1.333).
//
// The snapshot plugin, the token build's dtcg.js and the doc generator each run in Figma's sandbox, which imports
// nothing, so each keeps a copy that tools/shared/test-text-units.mjs holds to this one character for character.

export const perFontSize = (o, fontSize) => (!o ? null : o.unit === 'PERCENT' ? +(o.value / 100).toFixed(4) : o.unit === 'PIXELS' && fontSize ? +(o.value / fontSize).toFixed(4) : null);
