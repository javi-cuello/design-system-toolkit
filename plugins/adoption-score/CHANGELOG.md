# Changelog — Adoption score
All notable changes. Format: Keep a Changelog; versioning: SemVer.

## [0.5.0] - 2026-11-12
### Added
- A row's red count, underlined, selects its failing layers and zooms to them (the first page holding any; up to 200 failures a check, a layer failing twice selected once). Fixing stays with Check designs or the designer. The System components row is not clickable while system libraries are set: other libraries' instances are counted by key, not by layer.

## [0.4.1] - 2026-11-12
### Changed
- The scope is a row of radio buttons above Run (All pages, This page, Selection), as what the next scan covers: the segmented control under the heading read as a filter on the results.

## [0.4.0] - 2026-11-12
### Added
- Selection scope: scans the selected frames, instances or sections; the widget itself is left out of the selection.
### Changed
- The scope is a segmented control on the card (All pages, This page, Selection) instead of a dropdown in the widget's menu.

## [0.3.3] - 2026-11-12
### Changed
- Check names are medium weight; a row's failure count is red when anything failed; the checked total stays grey.
- With no libraries set, the card says the score may be too high until your libraries are connected, with a small secondary Connect libraries button under it.
- The card before a first run drops its line describing the checks.
- Text styles is now Text style bound, like Colour bound.

## [0.3.2] - 2026-11-12
### Changed
- With no system libraries set, the card says every library counts and offers Connect your system libraries, which opens the window.
- The System libraries window is shorter: both fields stacked at full width, one line of help under each.
- Each row's second line names what failed (2 detached · 7 checked) instead of what passed; the share stays a pass rate, like the total. One screen reads 1 screen.

## [0.3.1] - 2026-11-12
### Fixed
- Saving System libraries clears the card's old error; it clears the last result only when the set of libraries changed, so a reordered list, a renamed link or a new token keeps it.

## [0.3.0] - 2026-11-12
### Added
- System libraries… in the widget's menu: links to the libraries that are the design system, and a Figma token kept on this computer. Each run fetches those libraries' published components (one REST call per library), and only their instances count as System components; without libraries, every library counts, as before.
### Changed
- The card takes the plugins' look: FigUI3's light-theme text, border, brand and status colours, 11/16 body and 13px heading, a 32px button with a 5px radius, a 13px window radius and a footer under a hairline.

## [0.2.0] - 2026-11-12
### Changed
- A Scope menu (select the widget): all pages, or only the page it sits on, so an archive page can be left out.
- A section's frames are screens of their own, so a screen detached from a template inside a section is not counted as a detach.
- Detaches count only frames Figma marks as detached, inside a screen: a whole screen detached from a template, and a frame merely named like a component, no longer count.

## [0.1.0] - 2026-11-12
### Added
- Initial release: A widget that scores how closely a file's screens use its design system: library instances, detaches, colour, spacing and text styles.
