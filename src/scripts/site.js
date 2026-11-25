// The theme switch and the contents drawer. Inlined at the end of every page.
// The switch names the other theme, as the app's does. Figures follow the theme through CSS
// (.only-light / .only-dark), so nothing here touches the images.
(() => {
  const KEY = 'rnatwine-manual-theme';
  const root = document.documentElement;
  const dark = matchMedia('(prefers-color-scheme: dark)');
  const isDark = () => (root.dataset.theme ? root.dataset.theme === 'dark' : dark.matches);
  const toggles = document.querySelectorAll('[data-theme-toggle]');
  const label = () => {
    const d = isDark();
    toggles.forEach((b) => {
      b.textContent = d ? 'Light' : 'Dark';
      b.setAttribute('aria-label', `Switch to the ${d ? 'light' : 'dark'} theme`);
    });
  };
  toggles.forEach((b) =>
    b.addEventListener('click', () => {
      const next = isDark() ? 'light' : 'dark';
      root.dataset.theme = next;
      try { localStorage.setItem(KEY, next); } catch {}
      label();
    }),
  );
  dark.addEventListener('change', label);
  label();

  // Contents drawer (narrow windows)
  const btn = document.querySelector('.navbtn');
  const scrim = document.querySelector('.scrim');
  const set = (open) => {
    document.body.classList.toggle('nav-open', open);
    if (btn) btn.setAttribute('aria-expanded', String(open));
    if (scrim) scrim.hidden = !open;
  };
  btn?.addEventListener('click', () => set(!document.body.classList.contains('nav-open')));
  scrim?.addEventListener('click', () => set(false));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') set(false); });
  document.querySelectorAll('.rail a').forEach((a) => a.addEventListener('click', () => set(false)));
})();
