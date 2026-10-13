/**
 * Menu bar (File Edit View Insert Tools Help), Vegas layout.
 *
 *   <MenuBar menus={buildMenus(…)} title={…} />
 *
 * Menus are data (MenuDef[]) built by the editor shell, so every item is the same command the toolbar and the
 * keymap run, and its shortcut label comes from shortcuts.ts. Behaviour follows desktop menus: click opens,
 * hovering another title while one is open switches to it, ↑/↓ move through items, ←/→ switch menus, Enter
 * activates, Esc or a click outside closes. Keys handled here are marked defaultPrevented so the editor's keymap
 * (a window listener) ignores them.
 */
import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from 'react';

export interface MenuItem {
  label: string;
  onSelect: () => void;
  /** shortcut hint shown on the right */
  keys?: string;
  /** a check mark (toggles) or a bullet (radio groups) */
  checked?: boolean;
  radio?: boolean;
  disabled?: boolean;
}
export type MenuEntry = MenuItem | 'separator';
export interface MenuDef {
  label: string;
  items: MenuEntry[];
}

export default function MenuBar({ menus, title }: { menus: MenuDef[]; title?: ReactNode }) {
  const [open, setOpen] = useState<number | null>(null);
  const barRef = useRef<HTMLDivElement | null>(null);
  const popRef = useRef<HTMLDivElement | null>(null);

  // close on a click outside
  useEffect(() => {
    if (open == null) return;
    const onDown = (e: PointerEvent) => {
      if (!barRef.current?.contains(e.target as Node)) setOpen(null);
    };
    window.addEventListener('pointerdown', onDown, true);
    return () => window.removeEventListener('pointerdown', onDown, true);
  }, [open]);

  // focus the first enabled item when a menu opens from the keyboard
  const focusItem = (dir: 1 | -1 | 0) => {
    const items = [...(popRef.current?.querySelectorAll<HTMLButtonElement>('button.fe-menu-item:not(:disabled)') ?? [])];
    if (!items.length) return;
    const i = items.indexOf(document.activeElement as HTMLButtonElement);
    const next = dir === 0 ? 0 : i < 0 ? (dir > 0 ? 0 : items.length - 1) : (i + dir + items.length) % items.length;
    items[next].focus();
  };

  const onKeyDown = (e: ReactKeyboardEvent) => {
    if (open == null) return;
    const handled = () => {
      e.preventDefault();
      e.stopPropagation();
    };
    if (e.key === 'Escape') {
      handled();
      setOpen(null);
    } else if (e.key === 'ArrowDown') {
      handled();
      focusItem(1);
    } else if (e.key === 'ArrowUp') {
      handled();
      focusItem(-1);
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      handled();
      const n = menus.length;
      setOpen((o) => ((o ?? 0) + (e.key === 'ArrowRight' ? 1 : -1) + n) % n);
      requestAnimationFrame(() => focusItem(0));
    } else if (e.key === ' ' || e.key === 'Enter') {
      // let the focused item's click run, but keep the keymap from also seeing Space/Enter
      e.nativeEvent.preventDefault();
      (document.activeElement as HTMLElement | null)?.click();
      e.stopPropagation();
    } else {
      e.stopPropagation();
      e.preventDefault();
    }
  };

  return (
    <nav className="fe-menubar" ref={barRef} onKeyDown={onKeyDown} aria-label="Menu bar">
      <span className="fe-brand" aria-hidden="true">
        <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
          <path d="M2 3h12v10H2zM4 5v6h2V5zm3 0v6h2V5zm3 0v6h2V5z" />
        </svg>
        FILM EDIT
      </span>
      {menus.map((m, i) => (
        <div key={m.label} className={`fe-menu${open === i ? ' is-open' : ''}`}>
          <button
            aria-haspopup="menu"
            aria-expanded={open === i}
            onClick={() => setOpen((o) => (o === i ? null : i))}
            onMouseEnter={() => open != null && open !== i && setOpen(i)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown' && open == null) {
                e.preventDefault();
                setOpen(i);
                requestAnimationFrame(() => focusItem(0));
              }
            }}
          >
            {m.label}
          </button>
          {open === i && (
            <div className="fe-menu-pop" role="menu" aria-label={m.label} ref={popRef}>
              {m.items.map((it, k) =>
                it === 'separator' ? (
                  <div key={`sep${k}`} className="fe-menu-sep" role="separator" />
                ) : (
                  <button
                    key={it.label}
                    role={it.radio ? 'menuitemradio' : it.checked != null ? 'menuitemcheckbox' : 'menuitem'}
                    aria-checked={it.checked}
                    className="fe-menu-item"
                    disabled={it.disabled}
                    onClick={() => {
                      setOpen(null);
                      it.onSelect();
                    }}
                  >
                    {it.checked && <span className="fe-check-mark">{it.radio ? '●' : '✓'}</span>}
                    {it.label}
                    {it.keys && <span className="fe-kbd">{it.keys}</span>}
                  </button>
                ),
              )}
            </div>
          )}
        </div>
      ))}
      {title && <div className="fe-title">{title}</div>}
    </nav>
  );
}
