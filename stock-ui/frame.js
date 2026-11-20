// The page frame's behaviour (stock-ui.css, the frame's markup in its comment), for every surface that draws it.
// Loaded at the end of <body>, after the frame's markup.
{
  const root = document.documentElement;

  // The sections' Menu button (below 40rem; stock-ui.css hides it wider), shown by an inline line after the nav
  // (the frame's markup), so without script the sections scroll in their row. It opens the list under the masthead; Escape, a click outside or focus
  // leaving close it, Escape returning focus to the button (menus.md *Hamburger and mobile menus*).
  const menu = document.querySelector('[data-menu]');
  const toggle = menu && menu.querySelector('button');
  if (toggle) {
    const openMenu = (open) => toggle.setAttribute('aria-expanded', String(open));
    toggle.addEventListener('click', () => openMenu(toggle.getAttribute('aria-expanded') !== 'true'));
    menu.addEventListener('keydown', (e) => { if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') { openMenu(false); toggle.focus(); } });
    menu.addEventListener('focusout', (e) => { if (!menu.contains(e.relatedTarget)) openMenu(false); });
    document.addEventListener('click', (e) => { if (!menu.contains(e.target)) openMenu(false); });
    matchMedia('(min-width: 40rem)').addEventListener('change', () => openMenu(false));
  }

  // The masthead's real height, for everything that sits below it (anchors, anything sticky): it wraps
  // differently with the width, the fonts and the reader's text size.
  const masthead = document.querySelector('[data-masthead]');
  if (masthead) new ResizeObserver(() => root.style.setProperty('--masthead', masthead.offsetHeight + 'px')).observe(masthead);
}
