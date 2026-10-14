/**
 * replay-qa-promo shared DOM piece: one FROZEN product tile (a cropped RrwebScreen, no chrome, no cursor) with the
 * collage's depth language: a tilt about y, a lift toward camera, a blur/sink for the hand-off, and an optional small
 * grey label on its top-left corner. Used by the ch05-s05 pull-back and the ch06-s01 collage so their tiles match.
 *
 *   <ProductTile take="bug-sync" at={MARKS['bug-sync'].report} crop={CROPS.syncChipsTitle} x={680} y={230} w={490}
 *     tiltY={-8} lift={0.4} label="…" labelU={1} />
 */
import type { CSSProperties } from 'react';
import { RrwebScreen } from '../../../film/promo';
import { SANS } from '../../../film/promo';
import { SLUG, type Crop, cropH } from './takes';

export interface ProductTileProps {
  take: string;
  /** ms into the take (frozen) */
  at: number;
  crop: Crop;
  /** stage px: top-left and width of the page area */
  x: number;
  y: number;
  w: number;
  tiltY?: number;
  tiltX?: number;
  /** 0..1: lifts the tile toward camera (scale 1 → 1.04, a deeper shadow, 6 px up) */
  lift?: number;
  /** stage px of CSS blur (the collage sinking into the end card) */
  blur?: number;
  /** 0..1: sinks the tile (down and away) */
  sink?: number;
  opacity?: number;
  label?: string;
  labelU?: number;
  radius?: number;
  zoom?: { x: number; y: number; scale: number };
}

export function ProductTile(p: ProductTileProps) {
  const lift = Math.max(0, Math.min(1, p.lift ?? 0));
  const sink = Math.max(0, Math.min(1, p.sink ?? 0));
  const h = cropH(p.crop, p.w);
  const wrap: CSSProperties = {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 1280,
    height: 720,
    transformOrigin: `${p.x + p.w / 2}px ${p.y + h / 2}px`,
    transform: `translateY(${-6 * lift + 40 * sink}px) scale(${(1 + 0.04 * lift) * (1 - 0.08 * sink)})`,
    filter: (p.blur ?? 0) > 0.2 ? `blur(${p.blur}px)` : undefined,
    opacity: p.opacity ?? 1,
    pointerEvents: 'none',
  };
  const lu = Math.max(0, Math.min(1, p.labelU ?? 1));
  return (
    <div style={wrap}>
      <RrwebScreen
        slug={SLUG}
        take={p.take}
        at={p.at}
        crop={p.crop}
        box={{ x: p.x, y: p.y, w: p.w }}
        chrome="none"
        radius={p.radius ?? 10}
        tilt={{ x: p.tiltX ?? 0, y: p.tiltY ?? 0 }}
        zoom={p.zoom}
        style={{
          boxShadow: `0 ${18 + 14 * lift}px ${50 + 30 * lift}px -16px rgba(40,10,60,${0.32 + 0.12 * lift}), 0 6px 18px -8px rgba(40,10,60,.22), 0 0 0 1px rgba(20,18,22,.06)`,
        }}
      />
      {p.label && lu > 0 && (
        <div
          style={{
            position: 'absolute',
            left: p.x,
            top: p.y - 28,
            font: `500 15px ${SANS}`,
            letterSpacing: '-0.2px',
            color: '#7d7784',
            opacity: lu,
            transform: `translateY(${(1 - lu) * 6}px)`,
            filter: lu < 1 ? `blur(${((1 - lu) * 3).toFixed(2)}px)` : undefined,
            whiteSpace: 'nowrap',
          }}
        >
          {p.label}
        </div>
      )}
    </div>
  );
}

export default ProductTile;
