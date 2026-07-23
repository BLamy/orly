import { useEffect, useState } from 'react';

const DISMISS_KEY = 'orly-install-dismissed';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS Safari's own flag — not covered by the standard display-mode query.
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIosSafari(): boolean {
  const ua = window.navigator.userAgent;
  const isIos = /iPad|iPhone|iPod/.test(ua) || (ua.includes('Mac') && navigator.maxTouchPoints > 1);
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|Chrome/.test(ua);
  return isIos && isSafari;
}

/**
 * "Add to Home Screen" prompt.
 * - Android/Chrome/Edge fire `beforeinstallprompt`; we defer it and drive our
 *   own banner UI, calling `.prompt()` on click (the browser has no built-in
 *   banner we can style, so this is the only way to offer install from inside
 *   the page rather than waiting for the browser's own omnibox icon).
 * - iOS Safari never fires that event — there is no programmatic install API
 *   at all — so the only option is a banner that tells the user to use
 *   Share → Add to Home Screen themselves.
 * Dismissing (either path) is remembered so it doesn't nag every visit.
 */
export function InstallBanner() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHint, setShowIosHint] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(DISMISS_KEY) === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (isStandalone()) return;
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    if (isIosSafari()) setShowIosHint(true);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* private mode — session-only */
    }
  };

  if (dismissed || isStandalone() || (!deferred && !showIosHint)) return null;

  return (
    <div className="install-banner" role="status">
      {deferred ? (
        <>
          <span>Install this app for offline reading and a full-screen player.</span>
          <div className="install-banner-actions">
            <button
              className="install-banner-go"
              onClick={async () => {
                await deferred.prompt();
                await deferred.userChoice;
                setDeferred(null);
                dismiss();
              }}
            >
              Install
            </button>
            <button className="install-banner-dismiss" onClick={dismiss} aria-label="Dismiss">
              ✕
            </button>
          </div>
        </>
      ) : (
        <>
          <span>
            Install this app: tap <b>Share</b> → <b>Add to Home Screen</b>.
          </span>
          <button className="install-banner-dismiss" onClick={dismiss} aria-label="Dismiss">
            ✕
          </button>
        </>
      )}
    </div>
  );
}
