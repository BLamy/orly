import { useEffect, useState } from 'react';
import { isSubscribed, onSubscriptionsChanged, toggleSubscription } from '../offline/subscriptions';

/** "Subscribe" to a series — new books added to it later auto-download.
 * Same nested/not-nested split as DownloadButton (series rows are
 * themselves buttons; series page headers aren't). */
export function SubscribeButton({ series, nested = false }: { series: string; nested?: boolean }) {
  const [subscribed, setSubscribed] = useState(() => isSubscribed(series));
  useEffect(() => {
    setSubscribed(isSubscribed(series));
    return onSubscriptionsChanged(() => setSubscribed(isSubscribed(series)));
  }, [series]);

  const Tag = nested ? 'span' : 'button';
  const activate = () => toggleSubscription(series);
  const onClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    activate();
  };
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!nested || (e.key !== 'Enter' && e.key !== ' ')) return;
    e.stopPropagation();
    e.preventDefault();
    activate();
  };

  const label = subscribed ? 'Unsubscribe' : 'Subscribe — auto-download new books';

  return (
    <Tag
      className={`sub-btn${subscribed ? ' is-subscribed' : ''}`}
      onClick={onClick}
      onKeyDown={nested ? onKeyDown : undefined}
      role={nested ? 'button' : undefined}
      tabIndex={nested ? 0 : undefined}
      aria-label={label}
      aria-pressed={subscribed}
      title={label}
    >
      <svg viewBox="0 0 20 20" width="13" height="13" fill={subscribed ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <path d="M10 3c-3 0-4.5 2-4.5 5v2.5L4 13h12l-1.5-2.5V8c0-3-1.5-5-4.5-5z" strokeLinejoin="round" />
        <path d="M8.2 15.5a1.8 1.8 0 0 0 3.6 0" strokeLinecap="round" />
      </svg>
      {!nested && <span>{subscribed ? 'Subscribed' : 'Subscribe'}</span>}
    </Tag>
  );
}
