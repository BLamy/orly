// default React import required: the Storybook manager builder compiles JSX
// to React.createElement (classic runtime), unlike Vite's automatic runtime
import React, { useMemo, useRef, useState } from 'react';
import type { CaptionInfo, ChannelInfo } from '../core/timeline';

const LABEL_W = 190;

export interface TimelineEditorDoc {
  channels: ChannelInfo[];
  captions: CaptionInfo[];
}

type Drag =
  | { kind: 'move-kf' | 'resize-kf'; id: number; at: number; dur: number; x0: number }
  | { kind: 'move-cap' | 'resize-cap'; id: number; at: number; dur: number; x0: number }
  | { kind: 'scrub' };

function snap(v: number, fine: boolean): number {
  const grid = fine ? 0.005 : 0.05;
  return Math.max(0, Math.round(v / grid) * grid);
}

/**
 * The Figma-Motion-style timeline: captions + one row per channel, tween
 * spans as bars, instant keys as diamonds, a scrubbing playhead over a ms
 * ruler. Purely presentational — edits go out through callbacks, so it runs
 * in the Storybook manager panel against channel data just as well as
 * against a live Timeline.
 */
export function TimelineEditor({
  doc,
  duration,
  t,
  onSeek,
  onKeyframe,
  onCaption,
}: {
  doc: TimelineEditorDoc;
  duration: number;
  t: number;
  onSeek: (t: number) => void;
  onKeyframe: (id: number, patch: { at?: number; dur?: number }) => void;
  onCaption: (id: number, patch: { at?: number; dur?: number; text?: string }) => void;
}) {
  const [pps, setPps] = useState(60); // pixels per second
  const [filter, setFilter] = useState('');
  const [editingCap, setEditingCap] = useState<number | null>(null);
  const dragRef = useRef<Drag | null>(null);

  const channels = useMemo(
    () => (filter ? doc.channels.filter((c) => c.key.toLowerCase().includes(filter.toLowerCase())) : doc.channels),
    [doc, filter],
  );

  const trackW = Math.max(duration * pps + 120, 400);

  const timeAtEvent = (e: React.PointerEvent, track: HTMLElement) => {
    const rect = track.getBoundingClientRect();
    return Math.max(0, (e.clientX - rect.left) / pps);
  };

  const onTrackPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return; // spans/diamonds handle their own
    dragRef.current = { kind: 'scrub' };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    onSeek(timeAtEvent(e, e.currentTarget));
  };

  const beginDrag = (e: React.PointerEvent, d: Drag) => {
    e.stopPropagation();
    dragRef.current = d;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d) return;
    if (d.kind === 'scrub') {
      const track = (e.target as HTMLElement).closest('.viz-tl-track') as HTMLElement | null;
      if (track) onSeek(timeAtEvent(e, track));
      return;
    }
    const ds = (e.clientX - d.x0) / pps;
    const fine = e.shiftKey;
    if (d.kind === 'move-kf') onKeyframe(d.id, { at: snap(d.at + ds, fine) });
    if (d.kind === 'resize-kf') onKeyframe(d.id, { dur: snap(Math.max(0, d.dur + ds), fine) });
    if (d.kind === 'move-cap') onCaption(d.id, { at: snap(d.at + ds, fine) });
    if (d.kind === 'resize-cap') onCaption(d.id, { dur: snap(Math.max(0.2, d.dur + ds), fine) });
  };

  const onPointerUp = () => {
    dragRef.current = null;
  };

  // adaptive ruler ticks: 1s normally, 2s zoomed out, 0.5s zoomed in
  const tickEvery = pps < 40 ? 2 : pps > 140 ? 0.5 : 1;
  const ticks: number[] = [];
  for (let s = 0; s <= duration + 1e-6; s += tickEvery) ticks.push(Number(s.toFixed(3)));

  return (
    <div className="viz-tl" onPointerMove={onPointerMove} onPointerUp={onPointerUp}>
      <div className="viz-tl-toolbar">
        <input
          className="viz-tl-filter"
          placeholder="filter channels…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        <span className="viz-tl-meta">
          {channels.length}/{doc.channels.length} channels · {doc.captions.length} captions
        </span>
        <span className="viz-tl-zoom">
          <svg width="12" height="12" viewBox="0 0 12 12"><circle cx="5" cy="5" r="3.6" fill="none" stroke="currentColor" strokeWidth="1.4"/><path d="M8 8 11 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
          <input
            type="range"
            min={20}
            max={240}
            value={pps}
            onChange={(e) => setPps(Number(e.target.value))}
            aria-label="Zoom"
          />
        </span>
      </div>

      <div className="viz-tl-scroll">
        <div className="viz-tl-inner" style={{ width: LABEL_W + trackW }}>
          {/* ruler */}
          <div className="viz-tl-row viz-tl-ruler-row">
            <div className="viz-tl-label viz-tl-ruler-label" />
            <div
              className="viz-tl-track viz-tl-ruler"
              style={{ width: trackW }}
              onPointerDown={onTrackPointerDown}
            >
              {ticks.map((s) => (
                <span key={s} className="viz-tl-tick" style={{ left: s * pps }}>
                  <i />
                  {Number.isInteger(s) ? `${s}s` : ''}
                </span>
              ))}
            </div>
          </div>

          {/* captions track */}
          <div className="viz-tl-row viz-tl-cap-row">
            <div className="viz-tl-label">captions</div>
            <div className="viz-tl-track" style={{ width: trackW }} onPointerDown={onTrackPointerDown}>
              {doc.captions.map((c) => (
                <div
                  key={c.id}
                  className="viz-tl-cap"
                  style={{ left: c.at * pps, width: Math.max(c.dur * pps, 24) }}
                  title={c.text}
                  onPointerDown={(e) => beginDrag(e, { kind: 'move-cap', id: c.id, at: c.at, dur: c.dur, x0: e.clientX })}
                  onDoubleClick={() => setEditingCap(c.id)}
                >
                  {editingCap === c.id ? (
                    <input
                      autoFocus
                      defaultValue={c.text}
                      onPointerDown={(e) => e.stopPropagation()}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                        if (e.key === 'Escape') setEditingCap(null);
                        e.stopPropagation();
                      }}
                      onBlur={(e) => {
                        onCaption(c.id, { text: e.target.value });
                        setEditingCap(null);
                      }}
                    />
                  ) : (
                    <span>{c.text}</span>
                  )}
                  <div
                    className="viz-tl-handle"
                    onPointerDown={(e) => beginDrag(e, { kind: 'resize-cap', id: c.id, at: c.at, dur: c.dur, x0: e.clientX })}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* channel tracks */}
          {channels.map((ch) => (
            <div key={ch.key} className="viz-tl-row">
              <div className="viz-tl-label" title={ch.key}>
                {ch.key}
              </div>
              <div className="viz-tl-track" style={{ width: trackW }} onPointerDown={onTrackPointerDown}>
                {ch.keys.map((k) =>
                  k.dur > 0 ? (
                    <div
                      key={k.id}
                      className="viz-tl-span"
                      style={{ left: k.at * pps, width: Math.max(k.dur * pps, 6) }}
                      title={`→ ${k.label}  ·  ${k.at.toFixed(2)}s +${k.dur.toFixed(2)}s`}
                      onPointerDown={(e) => beginDrag(e, { kind: 'move-kf', id: k.id, at: k.at, dur: k.dur, x0: e.clientX })}
                    >
                      <span>{k.label}</span>
                      <div
                        className="viz-tl-handle"
                        onPointerDown={(e) => beginDrag(e, { kind: 'resize-kf', id: k.id, at: k.at, dur: k.dur, x0: e.clientX })}
                      />
                    </div>
                  ) : (
                    <div
                      key={k.id}
                      className="viz-tl-diamond"
                      style={{ left: k.at * pps - 5 }}
                      title={`= ${k.label}  ·  ${k.at.toFixed(2)}s`}
                      onPointerDown={(e) => beginDrag(e, { kind: 'move-kf', id: k.id, at: k.at, dur: k.dur, x0: e.clientX })}
                    />
                  ),
                )}
              </div>
            </div>
          ))}

          {/* playhead */}
          <div className="viz-tl-playhead" style={{ left: LABEL_W + t * pps }}>
            <div className="viz-tl-playhead-knob" />
          </div>
        </div>
      </div>
    </div>
  );
}
