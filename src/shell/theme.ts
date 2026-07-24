export type ShelfTheme = 'walnut' | 'mahogany' | 'charcoal' | 'oak' | 'pine';

export const THEMES: { id: ShelfTheme; label: string; swatch: string }[] = [
  { id: 'walnut', label: 'Walnut', swatch: '#241a10' },
  { id: 'mahogany', label: 'Mahogany', swatch: '#2e1512' },
  { id: 'charcoal', label: 'Charcoal', swatch: '#121111' },
  { id: 'oak', label: 'Oak', swatch: '#d9b579' },
  { id: 'pine', label: 'Pine', swatch: '#ecdcb8' },
];

const THEME_IDS = new Set(THEMES.map((t) => t.id));

const KEY = 'orly-theme';

export function getTheme(): ShelfTheme {
  if (typeof window === 'undefined') return 'walnut';
  const v = window.localStorage.getItem(KEY);
  return v && THEME_IDS.has(v as ShelfTheme) ? (v as ShelfTheme) : 'walnut';
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
