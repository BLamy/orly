import { useEffect, useRef, type MouseEvent, type ReactNode, type RefObject } from 'react';

export function CollapsingHeader({
  hidden,
  scrolled,
  scrollRootRef,
  collapsedHeight = 'calc(env(safe-area-inset-top, 0px) + 8px)',
  heightProperty = '--mobile-header-height',
  className = '',
  onClick,
  children,
}: {
  hidden: boolean;
  scrolled: boolean;
  scrollRootRef: RefObject<HTMLElement | null>;
  collapsedHeight?: string;
  heightProperty?: `--${string}`;
  className?: string;
  onClick?: (event: MouseEvent<HTMLElement>) => void;
  children: ReactNode;
}) {
  const headerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const header = headerRef.current;
    const root = scrollRootRef.current;
    if (!header || !root) return;

    const setHeight = () => {
      root.style.setProperty(heightProperty, hidden ? collapsedHeight : `${header.getBoundingClientRect().height}px`);
    };
    setHeight();
    if (hidden) return;

    const observer = new ResizeObserver(setHeight);
    observer.observe(header);
    return () => observer.disconnect();
  }, [collapsedHeight, hidden, heightProperty, scrollRootRef]);

  return (
    <header
      ref={headerRef}
      className={`mobile-collapsing-header${scrolled ? ' is-scrolled' : ''}${hidden ? ' is-hidden' : ''}${className ? ` ${className}` : ''}`}
      onClick={onClick}
    >
      {children}
    </header>
  );
}
