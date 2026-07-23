export type ShelfTheme = 'walnut' | 'pine';

const KEY = 'orly-theme';

export function getTheme(): ShelfTheme {
  if (typeof window === 'undefined') return 'walnut';
  const v = window.localStorage.getItem(KEY);
  return v === 'pine' ? 'pine' : 'walnut';
}

export function applyTheme(theme: ShelfTheme) {
  document.documentElement.setAttribute('data-theme', theme);
}

export function setTheme(theme: ShelfTheme) {
  window.localStorage.setItem(KEY, theme);
  applyTheme(theme);
  window.dispatchEvent(new CustomEvent('orly-theme-change', { detail: theme }));
}

export function initTheme() {
  applyTheme(getTheme());
}
