const INTERACTIVE_SELECTOR = [
  'a[href]',
  'button:not(:disabled)',
  'input:not(:disabled)',
  'select:not(:disabled)',
  'summary',
  '[role="button"]',
  '[role="menuitem"]',
  '[role="switch"]',
  '[role="tab"]',
  '[data-haptic]',
].join(',');

export function initInteractionHaptics() {
  document.addEventListener(
    'click',
    (event) => {
      const target = event.target;
      if (!(target instanceof Element) || !target.closest(INTERACTIVE_SELECTOR)) return;
      navigator.vibrate?.(18);
    },
    { capture: true },
  );
}
