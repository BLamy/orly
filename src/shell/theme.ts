export type ShelfTheme = 'walnut' | 'mahogany' | 'indigo' | 'charcoal' | 'oak' | 'pine';

export const THEMES: { id: ShelfTheme; label: string; swatch: string; chrome: string }[] = [
  { id: 'walnut', label: 'Walnut', swatch: '#241a10', chrome: '#160f09' },
  { id: 'mahogany', label: 'Mahogany', swatch: '#2e1512', chrome: '#170a09' },
  { id: 'indigo', label: 'Indigo', swatch: '#1a2438', chrome: '#0f1726' },
  { id: 'charcoal', label: 'Charcoal', swatch: '#121111', chrome: '#0c0c0c' },
  { id: 'oak', label: 'Oak', swatch: '#d9b579', chrome: '#e8cfa0' },
  { id: 'pine', label: 'Pine', swatch: '#ecdcb8', chrome: '#f4ecdb' },
];

const THEME_IDS = new Set(THEMES.map((t) => t.id));

const KEY = 'orly-theme';

/** The shelf's out-of-the-box finish. */
export const DEFAULT_THEME: ShelfTheme = 'mahogany';

export function getTheme(): ShelfTheme {
  if (typeof window === 'undefined') return DEFAULT_THEME;
  const v = window.localStorage.getItem(KEY);
  return v && THEME_IDS.has(v as ShelfTheme) ? (v as ShelfTheme) : DEFAULT_THEME;
}

export function applyTheme(theme: ShelfTheme) {
  document.documentElement.setAttribute('data-theme', theme);
  // Retint the mobile browser's own chrome (Android Chrome's address bar,
  // iOS 15+ Safari's tab bar) to match — this is the ONLY way to do that:
  // it's read live off this meta tag, unlike manifest.webmanifest's
  // theme_color, which is baked in at build time and only affects an
  // installed PWA's splash screen, not the in-browser chrome.
  const meta = document.querySelector('meta[name="theme-color"]');
  const chrome = THEMES.find((t) => t.id === theme)?.chrome;
  if (meta && chrome) meta.setAttribute('content', chrome);
}

export function setTheme(theme: ShelfTheme) {
  window.localStorage.setItem(KEY, theme);
  applyTheme(theme);
  window.dispatchEvent(new CustomEvent('orly-theme-change', { detail: theme }));
}

export function initTheme() {
  applyTheme(getTheme());
}
