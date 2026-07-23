import { useEffect, useState } from 'react';
import { getTheme, setTheme, type ShelfTheme } from './theme';

/** Walnut (dark wood) / Pine (light wood) shelf-theme switcher — a small
 *  pill toggle, at home in a header row on either mobile or desktop. */
export function ThemeToggle() {
  const [theme, setThemeState] = useState<ShelfTheme>(() => getTheme());

  useEffect(() => {
    const onChange = (e: Event) => setThemeState((e as CustomEvent<ShelfTheme>).detail);
    window.addEventListener('orly-theme-change', onChange);
    return () => window.removeEventListener('orly-theme-change', onChange);
  }, []);

  const next: ShelfTheme = theme === 'walnut' ? 'pine' : 'walnut';

  return (
    <button
      className="theme-toggle"
      onClick={() => setTheme(next)}
      aria-label={`Switch to ${next} shelf`}
      title={`Switch to ${next} shelf`}
    >
      {theme === 'walnut' ? (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path d="M20.5 14.5A8.5 8.5 0 1 1 9.5 3.5a7 7 0 0 0 11 11Z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <circle cx="12" cy="12" r="4.5" />
          <path d="M12 2.5v3M12 18.5v3M21.5 12h-3M5.5 12h-3M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1M18.4 18.4l-2.1-2.1M7.7 7.7 5.6 5.6" strokeLinecap="round" />
        </svg>
      )}
      <span>{theme === 'walnut' ? 'Walnut' : 'Pine'}</span>
    </button>
  );
}
