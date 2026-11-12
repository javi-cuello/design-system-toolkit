# Changelog — Adoption score
All notable changes. Format: Keep a Changelog; versioning: SemVer.

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
