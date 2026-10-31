/**
 * Context menu — a small, keyboard-navigable menu with submenus, rendered in a portal at the pointer.
 *
 *   <ContextMenu x={clientX} y={clientY} items={items} onClose={() => setMenu(null)} />
 *
 *   items: { label, shortcut?, checked?, disabled?, danger?, onSelect?, submenu? } | SEP | { header }
 *
 * Arrow keys move, → / Enter open a submenu, ← closes it, Enter / Space run an item, Esc closes; a press
 * outside, a wheel, a resize or a blur closes too. The menu keeps itself on screen.
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { createPortal } from 'react-dom';

export interface MenuAction {
  kind?: 'item';
  label: string;
  shortcut?: string;
  /** shows a check mark (toggles, radio choices) */
  checked?: boolean;
  disabled?: boolean;
  danger?: boolean;
  onSelect?: () => void;
  submenu?: MenuItem[];
}
export type MenuItem = MenuAction | { kind: 'separator' } | { kind: 'header'; label: string };

export const SEP: MenuItem = { kind: 'separator' };

const isAction = (i: MenuItem): i is MenuAction => i.kind === undefined || i.kind === 'item';
const enabled = (i: MenuItem): boolean => isAction(i) && !i.disabled;

interface ListProps {
  items: MenuItem[];
  x: number;
  y: number;
  /** x of the parent item's left edge (a submenu that does not fit on the right opens to the left) */
  flipX?: number;
  depth: number;
  onClose: () => void;
  /** close just this submenu (← key) */
  onBack?: () => void;
  autoFocus: boolean;
}

function MenuList({ items, x, y, flipX, depth, onClose, onBack, autoFocus }: ListProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ left: x, top: y });
  const [active, setActive] = useState(() => (autoFocus ? items.findIndex(enabled) : -1));
  const [open, setOpen] = useState<{ index: number; x: number; y: number; flipX: number; focus: boolean } | null>(null);

  // keep on screen
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let left = x;
    let top = y;
    if (left + r.width > vw - 4) left = flipX != null ? Math.max(4, flipX - r.width) : Math.max(4, vw - r.width - 4);
    if (top + r.height > vh - 4) top = Math.max(4, vh - r.height - 4);
    setPos({ left, top });
  }, [x, y, flipX, items]);

  useEffect(() => {
    if (autoFocus) ref.current?.focus({ preventScroll: true });
  }, [autoFocus]);

  const openSub = useCallback(
    (index: number, focus: boolean) => {
      const el = ref.current?.querySelector<HTMLElement>(`[data-index="${index}"]`);
      const item = items[index];
      if (!el || !item || !isAction(item) || !item.submenu || item.disabled) {
        setOpen(null);
        return;
      }
      const r = el.getBoundingClientRect();
      setOpen({ index, x: r.right - 2, y: r.top - 4, flipX: r.left + 2, focus });
    },
    [items],
  );

  const run = (index: number) => {
    const item = items[index];
    if (!item || !isAction(item) || item.disabled) return;
    if (item.submenu) {
      openSub(index, true);
      return;
    }
    onClose();
    item.onSelect?.();
  };

  const step = (dir: 1 | -1) => {
    if (!items.some(enabled)) return;
    let i = active;
    for (let n = 0; n < items.length; n++) {
      i = (i + dir + items.length) % items.length;
      if (enabled(items[i])) break;
    }
    setActive(i);
    setOpen(null);
  };

  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (open?.focus) return; // the submenu owns the keys
    let handled = true;
    switch (e.key) {
      case 'ArrowDown':
        step(1);
        break;
      case 'ArrowUp':
        step(-1);
        break;
      case 'ArrowRight':
        if (active >= 0) openSub(active, true);
        break;
      case 'ArrowLeft':
        if (onBack) onBack();
        else handled = false;
        break;
      case 'Enter':
      case ' ':
        if (active >= 0) run(active);
        break;
      case 'Escape':
        onClose();
        break;
      case 'Tab':
        onClose();
        break;
      default:
        handled = false;
    }
    if (handled) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    <>
      <div
        ref={ref}
        className="tl-menu"
        role="menu"
        tabIndex={-1}
        style={{ left: pos.left, top: pos.top, zIndex: 1000 + depth }}
        onKeyDown={onKeyDown}
        onContextMenu={(e) => e.preventDefault()}
      >
        {items.map((item, i) => {
          if (item.kind === 'separator') return <div key={i} className="tl-menu-sep" role="separator" />;
          if (item.kind === 'header') return <div key={i} className="tl-menu-header">{item.label}</div>;
          const cls = ['tl-menu-item', i === active ? 'is-active' : '', item.disabled ? 'is-disabled' : '', item.danger ? 'is-danger' : ''].join(' ');
          return (
            <div
              key={i}
              data-index={i}
              className={cls}
              role="menuitem"
              aria-disabled={item.disabled || undefined}
              aria-haspopup={item.submenu ? 'menu' : undefined}
              aria-checked={item.checked}
              onPointerEnter={() => {
                setActive(i);
                if (item.submenu) openSub(i, false);
                else setOpen(null);
              }}
              onClick={() => run(i)}
            >
              <span className="tl-menu-check">{item.checked ? '✓' : ''}</span>
              <span className="tl-menu-label">{item.label}</span>
              {item.shortcut ? <span className="tl-menu-key">{item.shortcut}</span> : null}
              {item.submenu ? <span className="tl-menu-arrow">›</span> : null}
            </div>
          );
        })}
      </div>
      {open && (() => {
        const item = items[open.index];
        if (!item || !isAction(item) || !item.submenu) return null;
        return (
          <MenuList
            key={open.index}
            items={item.submenu}
            x={open.x}
            y={open.y}
            flipX={open.flipX}
            depth={depth + 1}
            onClose={onClose}
            onBack={() => {
              setOpen(null);
              ref.current?.focus({ preventScroll: true });
            }}
            autoFocus={open.focus}
          />
        );
      })()}
    </>
  );
}

export interface ContextMenuProps {
  x: number;
  y: number;
  items: MenuItem[];
  onClose: () => void;
}

export default function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      if (rootRef.current && e.target instanceof Node && rootRef.current.contains(e.target)) return;
      onClose();
    };
    const close = () => onClose();
    window.addEventListener('pointerdown', onDown, true);
    window.addEventListener('wheel', close, { passive: true });
    window.addEventListener('resize', close);
    window.addEventListener('blur', close);
    return () => {
      window.removeEventListener('pointerdown', onDown, true);
      window.removeEventListener('wheel', close);
      window.removeEventListener('resize', close);
      window.removeEventListener('blur', close);
    };
  }, [onClose]);
  return createPortal(
    <div ref={rootRef} className="tl-menu-root">
      <MenuList items={items} x={x} y={y} depth={0} onClose={onClose} autoFocus />
    </div>,
    document.body,
  );
}
