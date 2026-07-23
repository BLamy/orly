import { useOnline } from '../offline/useOnline';

export function OfflineBanner() {
  const online = useOnline();
  if (online) return null;
  return (
    <div className="offline-banner" role="status">
      Offline — showing downloaded books
    </div>
  );
}
