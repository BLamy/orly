import { useEffect, useRef, useState } from 'react';
import { composeCover, type BookMeta } from './cover';
import { assetUrl, resolveAnimal } from './shared';

const COVER_W = 600;
const COVER_H = 800;

/** How far from centre a cover still counts as "the one you're looking at",
 *  in item widths — past this it's fully turned away. */
const TURN_SPAN = 1.9;
const MAX_TURN = 62; // degrees

function CoverCard({ book }: { book: BookMeta }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    let dead = false;
    composeCover(book, COVER_W, COVER_H, resolveAnimal(book) ? assetUrl(resolveAnimal(book)!) : null).then(
      (cov) => {
        if (dead) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        const w = Math.max(1, Math.round(rect.width));
        const h = Math.max(1, Math.round(rect.height));
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.drawImage(cov, 0, 0, w, h);
      },
    );
    return () => {
      dead = true;
    };
  }, [book]);
  return <canvas ref={canvasRef} className="cf-canvas" />;
}

/** Landscape cover flow — the phone turned sideways becomes a rack of covers
 *  you flick through, the way Apple Music's landscape browser did.
 *
 *  The strip is an ordinary scroll-snap list, so the physics, momentum, and
 *  rubber-banding are the platform's own rather than hand-rolled; all this adds
 *  is a per-frame transform keyed to each cover's distance from the centre
 *  line. Reading scroll position on rAF (not on every scroll event) keeps the
 *  turn in step with what the compositor is actually showing. */
export function CoverFlow({
  books,
  onOpen,
}: {
  books: BookMeta[];
  onOpen: (slug: string) => void;
}) {
  const stripRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [centre, setCentre] = useState(0);

  useEffect(() => {
    const strip = stripRef.current;
    if (!strip) return;
    let raf = 0;
    let lastCentre = -1;

    const frame = () => {
      raf = requestAnimationFrame(frame);
      const mid = strip.scrollLeft + strip.clientWidth / 2;
      let best = 0;
      let bestDist = Infinity;
      for (let i = 0; i < itemRefs.current.length; i++) {
        const el = itemRefs.current[i];
        if (!el) continue;
        const itemMid = el.offsetLeft + el.offsetWidth / 2;
        const d = (itemMid - mid) / el.offsetWidth; // distance in item widths
        const t = Math.max(-1, Math.min(1, d / TURN_SPAN));
        // Turn away from the viewer with distance, and drop back in z so the
        // centre cover reads as the near one. The eased |t| keeps the middle
        // of the strip flat-on for a moment instead of snapping through it.
        const ease = Math.sign(t) * Math.pow(Math.abs(t), 0.85);
        el.style.transform =
          `translateZ(${-140 * Math.abs(ease)}px) ` +
          `translateX(${-ease * 18}%) ` +
          `rotateY(${-ease * MAX_TURN}deg) ` +
          `scale(${1 - 0.12 * Math.abs(ease)})`;
        el.style.zIndex = String(100 - Math.round(Math.abs(d) * 10));
        if (Math.abs(d) < bestDist) {
          bestDist = Math.abs(d);
          best = i;
        }
      }
      if (best !== lastCentre) {
        lastCentre = best;
        setCentre(best);
      }
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [books]);

  const current = books[centre];

  return (
    <div className="cf">
      <div className="cf-strip" ref={stripRef}>
        {books.map((b, i) => (
          <button
            key={b.slug}
            ref={(el) => {
              itemRefs.current[i] = el;
            }}
            className="cf-item"
            // Tapping an off-centre cover brings it to the middle first (the
            // way flicking to it would); only the centred one opens.
            onClick={() => {
              if (i === centre) onOpen(b.slug);
              else itemRefs.current[i]?.scrollIntoView({ behavior: 'smooth', inline: 'center' });
            }}
            aria-label={i === centre ? `Open ${b.title}` : `Show ${b.title}`}
          >
            <CoverFlowFace book={b} />
          </button>
        ))}
      </div>
      {current && (
        <div className="cf-caption">
          <div className="cf-title">{current.title}</div>
          {current.subtitle && <div className="cf-sub">{current.subtitle}</div>}
        </div>
      )}
    </div>
  );
}

/** The cover plus its reflection — the reflection is what made the original
 *  read as a glass shelf rather than a row of thumbnails. */
function CoverFlowFace({ book }: { book: BookMeta }) {
  return (
    <span className="cf-face">
      <CoverCard book={book} />
      <span className="cf-reflection" aria-hidden="true">
        <CoverCard book={book} />
      </span>
    </span>
  );
}
