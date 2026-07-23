export type ShelfTab = 'shelf' | 'library';

/** My Shelf / Library switcher — a fixed bottom bar on mobile (iOS
 * UITabBarController-style), a plain top nav row on desktop. */
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
      <button
        className={`tabbar-item${tab === 'shelf' ? ' active' : ''}`}
        onClick={() => onChange('shelf')}
        aria-current={tab === 'shelf' ? 'page' : undefined}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path d="M4 19.5V6a1 1 0 0 1 1-1h5.5a2 2 0 0 1 1.5.7 2 2 0 0 1 1.5-.7H19a1 1 0 0 1 1 1v13.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 5.7v13.8" strokeLinecap="round" />
        </svg>
        <span>My Shelf</span>
      </button>
      <button
        className={`tabbar-item${tab === 'library' ? ' active' : ''}`}
        onClick={() => onChange('library')}
        aria-current={tab === 'library' ? 'page' : undefined}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <rect x="4" y="4" width="16" height="16" rx="2" />
          <path d="M8 4v16M8 9h8M8 13h5" strokeLinecap="round" />
        </svg>
        <span>Library</span>
      </button>
    </nav>
  );
}
