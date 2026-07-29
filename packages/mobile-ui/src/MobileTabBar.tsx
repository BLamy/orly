import type { ReactNode } from 'react';

export interface MobileTabItem<T extends string> {
  id: T;
  label: string;
  icon: ReactNode;
}

export function MobileTabBar<T extends string>({
  active,
  items,
  onChange,
  hidden = false,
  className = '',
  ariaLabel = 'Sections',
}: {
  active: T;
  items: readonly MobileTabItem<T>[];
  onChange: (tab: T) => void;
  hidden?: boolean;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <nav
      className={`mobile-tab-bar${hidden ? ' is-hidden' : ''}${className ? ` ${className}` : ''}`}
      aria-label={ariaLabel}
    >
      {items.map((item) => (
        <button
          key={item.id}
          className={`mobile-tab-item tabbar-item${active === item.id ? ' active' : ''}`}
          onClick={() => onChange(item.id)}
          aria-current={active === item.id ? 'page' : undefined}
        >
          {item.icon}
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
