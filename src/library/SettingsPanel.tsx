import { useEffect, useState } from 'react';
import { getTheme, setTheme, THEMES, type ShelfTheme } from '../shell/theme';

/** The Settings tab — currently the shelf theme, grouped dark vs light. Built
 *  as its own screen so more preferences can slot in later. */
export function SettingsPanel() {
  const [theme, setThemeState] = useState<ShelfTheme>(() => getTheme());

  useEffect(() => {
    const on = (e: Event) => setThemeState((e as CustomEvent<ShelfTheme>).detail);
    window.addEventListener('orly-theme-change', on);
    return () => window.removeEventListener('orly-theme-change', on);
  }, []);

  const dark = THEMES.filter((t) => ['walnut', 'mahogany', 'indigo', 'charcoal'].includes(t.id));
  const light = THEMES.filter((t) => ['oak', 'pine'].includes(t.id));

  const Group = ({ label, items }: { label: string; items: typeof THEMES }) => (
    <div className="settings-group">
      <div className="settings-group-label">{label}</div>
      <div className="settings-swatches">
        {items.map((t) => (
          <button
            key={t.id}
            className={`settings-swatch${t.id === theme ? ' is-active' : ''}`}
            onClick={() => setTheme(t.id)}
            aria-pressed={t.id === theme}
          >
            <span className="settings-swatch-chip" style={{ background: t.swatch }} />
            <span>{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="settings-panel">
      <header className="settings-head">
        <h1>Settings</h1>
      </header>
      <section className="settings-section">
        <h2>Theme</h2>
        <p className="settings-note">Pick a shelf finish. It's saved on this device.</p>
        <Group label="Dark" items={dark} />
        <Group label="Light" items={light} />
      </section>
    </div>
  );
}
