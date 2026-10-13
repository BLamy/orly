/**
 * ScrollBar — a Vegas-style scroll bar over an abstract range (seconds for the timeline, px for the
 * track list). Drag the thumb to scroll, click the trough to page; on the horizontal bar, drag a thumb
 * END to zoom (the visible span stretches, as in Vegas). Double-clicking the horizontal thumb zooms to fit.
 *
 *   <ScrollBar orientation="horizontal" total={dur} visible={span} value={scrollT}
 *              onScroll={(v) => …} onZoom={(start, span) => …} onFit={() => …} />
 */
import { useRef, type PointerEvent as ReactPointerEvent } from 'react';

export interface ScrollBarProps {
  orientation: 'horizontal' | 'vertical';
  /** content extent */
  total: number;
  /** visible extent */
  visible: number;
  /** start of the visible window */
  value: number;
  onScroll(value: number): void;
  /** horizontal only: edge drags change the visible span */
  onZoom?(start: number, visible: number): void;
  onFit?(): void;
}

const MIN_THUMB = 22;
const EDGE = 6;

export default function ScrollBar({ orientation, total, visible, value, onScroll, onZoom, onFit }: ScrollBarProps) {
  const ref = useRef<HTMLDivElement>(null);
  const horiz = orientation === 'horizontal';
  const extent = Math.max(total, visible, 1e-9);
  const frac = Math.min(1, visible / extent);

  const geom = () => {
    const r = ref.current?.getBoundingClientRect();
    const len = r ? (horiz ? r.width : r.height) : 1;
    const thumb = Math.max(MIN_THUMB, frac * len);
    // the thumb travels len − thumb px for (extent − visible) units
    const travel = Math.max(1, len - thumb);
    const unitsPerPx = Math.max(0, extent - visible) / travel;
    return { r, len, thumb, unitsPerPx };
  };

  const onDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    const g = geom();
    const r = g.r;
    if (!r) return;
    const p0 = horiz ? e.clientX - r.left : e.clientY - r.top;
    const thumbStart = (extent - visible > 0 ? (value / (extent - visible)) * (g.len - g.thumb) : 0);
    const inThumb = p0 >= thumbStart && p0 <= thumbStart + g.thumb;
    if (!inThumb) {
      // page toward the click
      onScroll(Math.max(0, Math.min(extent - visible, value + (p0 < thumbStart ? -visible : visible) * 0.9)));
      return;
    }
    const edge = horiz && onZoom ? (p0 - thumbStart <= EDGE ? 'start' : thumbStart + g.thumb - p0 <= EDGE ? 'end' : null) : null;
    const el = e.currentTarget;
    el.setPointerCapture(e.pointerId);
    const v0 = value;
    const vis0 = visible;
    const unitsPerPxTrack = extent / g.len;
    const move = (ev: PointerEvent) => {
      const p = horiz ? ev.clientX - r.left : ev.clientY - r.top;
      const d = p - p0;
      if (edge === 'start') {
        const start = Math.max(0, Math.min(v0 + vis0 - 1e-3, v0 + d * unitsPerPxTrack));
        onZoom?.(start, v0 + vis0 - start);
      } else if (edge === 'end') {
        onZoom?.(v0, Math.max(1e-3, vis0 + d * unitsPerPxTrack));
      } else {
        onScroll(Math.max(0, Math.min(Math.max(0, extent - visible), v0 + d * g.unitsPerPx)));
      }
    };
    const up = () => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
  };

  // thumb placement in CSS (layout-independent, so it is right before any measuring): the same
  // geometry as geom(): size max(MIN, frac·len), start ratio·(len − size)
  const size = `max(${MIN_THUMB}px, ${frac * 100}%)`;
  const ratio = extent - visible > 0 ? Math.max(0, Math.min(1, value / (extent - visible))) : 0;
  const at = `calc((100% - ${size}) * ${ratio})`;
  const style = horiz ? { left: at, width: size } : { top: at, height: size };

  return (
    <div ref={ref} className={`tl-scroll tl-scroll-${horiz ? 'h' : 'v'}`} onPointerDown={onDown} role="scrollbar" aria-orientation={orientation} aria-valuemin={0} aria-valuemax={extent} aria-valuenow={value}>
      <div className="tl-scroll-thumb" style={style} onDoubleClick={horiz ? onFit : undefined}>
        {horiz && onZoom ? (
          <>
            <span className="tl-scroll-grip is-start" />
            <span className="tl-scroll-grip is-end" />
          </>
        ) : null}
      </div>
    </div>
  );
}
