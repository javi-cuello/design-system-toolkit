# Changelog — Adoption score
All notable changes. Format: Keep a Changelog; versioning: SemVer.

## [0.2.0] - 2026-11-12
### Changed
- A Scope menu (select the widget): all pages, or only the page it sits on, so an archive page can be left out.
- A section's frames are screens of their own, so a screen detached from a template inside a section is not counted as a detach.
- Detaches count only frames Figma marks as detached, inside a screen: a whole screen detached from a template, and a frame merely named like a component, no longer count.

## [0.1.0] - 2026-11-12
### Added
- Initial release: A widget that scores how closely a file's screens use its design system: library instances, detaches, colour, spacing and text styles.
