/** the scroller of the navigation-stack screen that holds `el` (each screen scrolls on its own, not the page) */
export function screenScroller(el: Element | null | undefined): HTMLElement | null {
  return (el?.closest('[data-slot="screen"] .bl-scroll') as HTMLElement | null) ?? null;
}
