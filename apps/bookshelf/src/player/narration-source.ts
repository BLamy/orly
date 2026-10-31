import { useEffect, useState } from 'react';

/** Keep recorded audio seekable when a static host ignores byte ranges. */
export function useNarrationSource(url: string | null) {
  const [resolved, setResolved] = useState<{ url: string; src: string } | null>(null);

  useEffect(() => {
    if (!url) return;
    const controller = new AbortController();
    let alive = true;
    let objectUrl: string | null = null;
    const load = async () => {
      try {
        // A supported range costs one byte. A 200 response already contains the
        // complete recording, which becomes the browser's seekable local file.
        const response = await fetch(url, {
          headers: { Range: 'bytes=0-0' },
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`Narration response ${response.status}`);
        if (response.status === 206 && response.headers.get('Content-Range')?.startsWith('bytes 0-0/')) {
          await response.body?.cancel();
          if (alive) setResolved({ url, src: url });
        } else if (response.status === 200) {
          const recording = await response.blob();
          if (!alive) return;
          objectUrl = URL.createObjectURL(recording);
          setResolved({ url, src: objectUrl });
        } else {
          throw new Error('Unexpected partial narration response');
        }
      } catch {
        // Preserve the existing media-error handling if fetching fails.
        if (alive) setResolved({ url, src: url });
      }
    };
    void load();
    return () => {
      alive = false;
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url]);

  const src = resolved?.url === url ? resolved.src : null;
  return { src, pending: !!url && !src };
}
