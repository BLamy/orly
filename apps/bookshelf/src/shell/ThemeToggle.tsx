import { useEffect, useRef, useState } from 'react';
import { getTheme, setTheme, THEMES, type ShelfTheme } from './theme';

/** Shelf-finish picker — walnut/mahogany/charcoal (dark) and oak/pine
 *  (light). A swatch button opens a small dropdown of all finishes. */
export function ThemeToggle() {
  const [theme, setThemeState] = useState<ShelfTheme>(() => getTheme());
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onChange = (e: Event) => setThemeState((e as CustomEvent<ShelfTheme>).detail);
    window.addEventListener('orly-theme-change', onChange);
    return () => window.removeEventListener('orly-theme-change', onChange);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDocPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onDocPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDocPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const current = THEMES.find((t) => t.id === theme) ?? THEMES[0];

  return (
    <div className="theme-picker" ref={rootRef}>
      <button
        className="theme-toggle"
        onClick={() => setOpen((o) => !o)}
        aria-label={`Shelf finish: ${current.label}. Choose a different one.`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="theme-swatch" style={{ background: current.swatch }} />
        <span>{current.label}</span>
      </button>
      {open && (
        <ul className="theme-menu" role="listbox" aria-label="Shelf finish">
          {THEMES.map((t) => (
            <li key={t.id}>
              <button
                className={`theme-menu-item${t.id === theme ? ' is-active' : ''}`}
                role="option"
                aria-selected={t.id === theme}
                onClick={() => {
                  setTheme(t.id);
                  setOpen(false);
                }}
              >
                <span className="theme-swatch" style={{ background: t.swatch }} />
                {t.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
