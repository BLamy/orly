import { useEffect, useRef } from 'react';
import { drawCover, type BookMeta } from './cover';

const ASSET_BASE =
  (import.meta as unknown as { env?: { BASE_URL?: string } }).env?.BASE_URL ?? '/';
const assetUrl = (p?: string) => (p ? ASSET_BASE + String(p).replace(/^\//, '') : '');

// A small composed O'RLY cover (used as a series separator in the player sidebar).
export function BookCoverThumb({ book, width = 60 }: { book: BookMeta; width?: number }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const W = 300;
    const H = 400; // compose at higher res, then downscale for crispness
    const off = document.createElement('canvas');
    off.width = W;
    off.height = H;
    const octx = off.getContext('2d');
    const ctx = canvas.getContext('2d');
    if (!octx || !ctx) return;
    const h = Math.round(width / 0.75);
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = width * dpr;
    canvas.height = h * dpr;
    const render = (img: HTMLImageElement | null) => {
      drawCover(octx, W, H, book, img);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingQuality = 'high';
      ctx.clearRect(0, 0, width, h);
      ctx.drawImage(off, 0, 0, width, h);
    };
    if (!book.animal) return render(null);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => render(img);
    img.onerror = () => render(null);
    img.src = assetUrl(book.animal);
  }, [book, width]);
  return <canvas ref={ref} className="learn-series-cover" style={{ width, height: width / 0.75 }} />;
}
