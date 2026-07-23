import { downloadBook, removeBook, useDownloadStatus } from '../offline/downloads';

/** Small overlay affordance on a book card/row: download for offline, or
 * remove it from My Shelf. Stops the click from also opening the book. */
export function DownloadButton({ slug }: { slug: string }) {
  const status = useDownloadStatus(slug);

  const activate = () => {
    if (status === 'downloaded' || status === 'downloading') removeBook(slug);
    else downloadBook(slug);
  };
  const onClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    activate();
  };
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.stopPropagation();
    e.preventDefault();
    activate();
  };

  const label =
    status === 'downloaded'
      ? 'Remove from My Shelf'
      : status === 'downloading'
        ? 'Downloading…'
        : 'Save for offline';

  return (
    // Every card/row this sits inside is ALREADY a <button> (open the book) —
    // a real nested <button> is invalid HTML (and unreliable to click), so
    // this is a span acting as its own button instead.
    <span
      className={`dl-btn${status ? ` is-${status}` : ''}`}
      onClick={onClick}
      onKeyDown={onKeyDown}
      role="button"
      tabIndex={0}
      aria-label={label}
      title={label}
    >
      {status === 'downloading' ? (
        <span className="dl-spinner" aria-hidden="true" />
      ) : status === 'downloaded' ? (
        <svg viewBox="0 0 20 20" width="14" height="14" fill="currentColor" aria-hidden="true">
          <path d="M5 10l3.5 3.5L15 6.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path d="M10 3v9m0 0-3.5-3.5M10 12l3.5-3.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4 14v1.5A1.5 1.5 0 0 0 5.5 17h9a1.5 1.5 0 0 0 1.5-1.5V14" strokeLinecap="round" />
        </svg>
      )}
    </span>
  );
}
