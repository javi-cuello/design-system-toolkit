# stock-ui reference

Detail moved from [README.md](README.md).

## stock-ui.css

What `stock-ui.css` holds:

- **Tokens:** colour light and dark, type, space, radius, stroke, focus, control height.
- **Reset:** the reset, with the one reduced-motion block.
- **Base:** the base look of plain elements: headings, links, focus, tables, code.
- **Shared components:**

| Component | Class |
|---|---|
| button | `.button`, `.button--primary`, `.button--soft`, `.button--ghost` |
| checkbox | `.checkbox` (on a native `input type=checkbox`) |
| dialog | `.modal` |
| badge | `.sev`, `.pill` |
| figures strip | `.kpis` |
| empty state | `.empty-state`, `__title`, `__text`, `__action`, `.empty-state--small` |
| sidebar list | `.sidenav` |
| tabs and toolbar | |
| segmented control | `.segmented`, `.seg` |
| choice chips | `.chips`, `.chip`: a segmented control drawn as separate rounded chips (a filter over the data below) |

- **The page frame:** skip link, masthead with name, sections and theme switch, reading column (`.container`), footer. Its markup is in the comment above it. The masthead shares the container's leading and trailing edges. Knobs: `--column` and `--gutter-min`, set on an ancestor of both (`:root`, `.shell`) so they move together; `--aside` and `--rail`; `--masthead-inline`, the masthead's own padding, for a shell with a side navigation.
