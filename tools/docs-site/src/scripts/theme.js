// The theme switch every toolkit site shares (the docs site, the contract editor): System, Light, Dark. System
// removes the choice, so the page follows the reader's setting again; the choice is remembered in this browser.
// The stored choice is applied before paint by a line in each page's head; this wires the buttons.
{
  const root = document.documentElement;
  const choices = [...document.querySelectorAll('[data-theme-choice]')];
  const paint = () => { const t = root.dataset.theme || 'system'; for (const b of choices) b.setAttribute('aria-pressed', String(b.dataset.themeChoice === t)); };
  for (const b of choices) b.addEventListener('click', () => {
    const t = b.dataset.themeChoice;
    if (t === 'system') delete root.dataset.theme; else root.dataset.theme = t;
    try { t === 'system' ? localStorage.removeItem('theme') : localStorage.setItem('theme', t); } catch {}
    paint();
  });
  paint();
}
