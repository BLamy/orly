export type ShelfTab = 'browse' | 'library' | 'shelf' | 'settings';

interface TabDef {
  id: ShelfTab;
  label: string;
  icon: JSX.Element;
}

const TABS: TabDef[] = [
  {
    id: 'browse',
    label: 'Browse',
    // stacked play — a "feed" of videos
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <rect x="3" y="3.5" width="18" height="17" rx="2.5" />
        <path d="M10 9l5 3-5 3z" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    id: 'library',
    label: 'Library',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <rect x="4" y="4" width="16" height="16" rx="2" />
        <path d="M8 4v16M8 9h8M8 13h5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'shelf',
    label: 'Saved',
    // bookmark
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M6 4h12a1 1 0 0 1 1 1v15l-7-4-7 4V5a1 1 0 0 1 1-1z" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: 'settings',
    label: 'Settings',
    // gear
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <circle cx="12" cy="12" r="3.2" />
        <path d="M12 3v2.2M12 18.8V21M3 12h2.2M18.8 12H21M5.6 5.6l1.6 1.6M16.8 16.8l1.6 1.6M18.4 5.6l-1.6 1.6M7.2 16.8l-1.6 1.6" strokeLinecap="round" />
      </svg>
    ),
  },
];

/** Browse / Library / Saved / Settings switcher — a fixed bottom bar on mobile
 * (iOS UITabBarController-style), a plain top nav row on desktop. */
export function TabBar({
  tab,
  onChange,
  mobile,
  hidden,
}: {
  tab: ShelfTab;
  onChange: (t: ShelfTab) => void;
  mobile: boolean;
  /** Twitter-style: slides off the bottom while the shelf list is being
   *  scrolled down, back in on scroll-up (mobile bottom bar only). */
  hidden?: boolean;
}) {
  return (
    <nav
      className={`${mobile ? 'tabbar-bottom' : 'tabbar-top'}${mobile && hidden ? ' is-hidden' : ''}`}
      aria-label="Shelf sections"
    >
      {TABS.map((t) => (
        <button
          key={t.id}
          className={`tabbar-item${tab === t.id ? ' active' : ''}`}
          onClick={() => onChange(t.id)}
          aria-current={tab === t.id ? 'page' : undefined}
        >
          {t.icon}
          <span>{t.label}</span>
        </button>
      ))}
    </nav>
  );
}
