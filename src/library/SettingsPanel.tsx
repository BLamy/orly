import { useEffect, useState } from 'react';
import { getTheme, setTheme, THEMES, type ShelfTheme } from '../shell/theme';
import {
  getVideoColor,
  setVideoColor,
  VIDEO_COLORS,
  type VideoColor,
} from '../shell/videoTheme';

/** A labelled row of color chips — the same control for both palettes. */
function Swatches<T extends string>({
  label,
  items,
  active,
  onPick,
}: {
  label: string;
  items: { id: T; label: string; swatch: string }[];
  active: T;
  onPick: (id: T) => void;
}) {
  return (
    <div className="settings-group">
      <div className="settings-group-label">{label}</div>
      <div className="settings-swatches">
        {items.map((t) => (
          <button
            key={t.id}
            className={`settings-swatch${t.id === active ? ' is-active' : ''}`}
            onClick={() => onPick(t.id)}
            aria-pressed={t.id === active}
          >
            <span className="settings-swatch-chip" style={{ background: t.swatch }} />
            <span>{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/** The Settings tab — two independent palettes: the shelf finish (furniture)
 *  and the video accent (the ink the explainers are drawn in). Built as its
 *  own screen so more preferences can slot in later. */
export function SettingsPanel() {
  const [theme, setThemeState] = useState<ShelfTheme>(() => getTheme());
  const [video, setVideoState] = useState<VideoColor>(() => getVideoColor());

  useEffect(() => {
    const onTheme = (e: Event) => setThemeState((e as CustomEvent<ShelfTheme>).detail);
    const onVideo = (e: Event) => setVideoState((e as CustomEvent<VideoColor>).detail);
    window.addEventListener('orly-theme-change', onTheme);
    window.addEventListener('orly-video-color-change', onVideo);
    return () => {
      window.removeEventListener('orly-theme-change', onTheme);
      window.removeEventListener('orly-video-color-change', onVideo);
    };
  }, []);

  const dark = THEMES.filter((t) => ['walnut', 'mahogany', 'indigo', 'charcoal'].includes(t.id));
  const light = THEMES.filter((t) => ['oak', 'pine'].includes(t.id));

  return (
    <div className="settings-panel">
      <header className="settings-head">
        <h1>Settings</h1>
      </header>

      <section className="settings-section">
        <h2>Shelf theme</h2>
        <p className="settings-note">
          The finish on the shelf, and the chrome around it. Saved on this device.
        </p>
        <Swatches label="Dark" items={dark} active={theme} onPick={setTheme} />
        <Swatches label="Light" items={light} active={theme} onPick={setTheme} />
      </section>

      <section className="settings-section">
        <h2>Video color</h2>
        <p className="settings-note">
          The accent the explainer animations and player controls are drawn in. Applies to a video
          the next time you open it.
        </p>
        <Swatches
          label="Accent"
          items={VIDEO_COLORS.map((c) => ({ id: c.id, label: c.label, swatch: c.hex }))}
          active={video}
          onPick={setVideoColor}
        />
      </section>
    </div>
  );
}
