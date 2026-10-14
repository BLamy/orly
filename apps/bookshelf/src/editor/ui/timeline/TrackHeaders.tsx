/**
 * Track headers — the Vegas track list to the left of the lanes.
 *
 * Per track: number badge (drag to reorder), name (double-click to rename), FX, Mute / Solo / Lock, a level
 * fader (audio dB with a fader law, video opacity %), pan (audio: its own row on a tall track, a compact knob on
 * the volume row otherwise, so every audio track can pan), a duck indicator (click: the Track inspector's Ducking
 * settings; removal is in the track menu), and a bottom edge to drag the height. Rows mirror the lane layout
 * exactly (same `rows`, same vertical scroll).
 *
 * Every change goes through the store: continuous controls coalesce into one undo step per gesture
 * (`editor.apply(…, { coalesce })`); height and order are committed on release.
 */
import { memo, useCallback, useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import type { Project, Track } from '../../model/types';
import { editor } from '../../state/store';
import { moveTrack, renameTrack, setTrackLevel, setTrackPan, toggleTrackFlag } from '../../model/ops.ts';
import type { TrackRow } from './geometry.ts';
import { M } from './style.ts';
import { emitTimelineCommand } from './viewport.ts';

// ---------------------------------------------------------------------------
// fader law: position 0..1 ↔ dB, unity at ~84 %, +12 dB at the top
// ---------------------------------------------------------------------------
const FADER_MAX_DB = 12;
const AMP_MAX = 10 ** (FADER_MAX_DB / 20);
export function faderToDb(pos: number): number {
  if (pos <= 0.001) return -120;
  return Math.min(FADER_MAX_DB, 20 * Math.log10(pos * pos * AMP_MAX));
}
export function dbToFader(db: number): number {
  if (db <= -120) return 0;
  return Math.max(0, Math.min(1, Math.sqrt(10 ** (db / 20) / AMP_MAX)));
}
const fmtDb = (db: number) => (db <= -119.9 ? '-inf dB' : `${db > 0 ? '+' : ''}${db.toFixed(1)} dB`);
const fmtPan = (p: number) => (Math.abs(p) < 0.005 ? 'Center' : p < 0 ? `${Math.round(-p * 100)}% L` : `${Math.round(p * 100)}% R`);
const fmtPanShort = (p: number) => (Math.abs(p) < 0.005 ? 'C' : p < 0 ? `L${Math.round(-p * 100)}` : `R${Math.round(p * 100)}`);
/** a track this tall gets the full-width pan row; shorter audio tracks get the compact knob */
const PAN_ROW_MIN_H = 76;

interface HeaderProps {
  track: Track;
  index: number;
  top: number;
  height: number;
  focused: boolean;
  renaming: boolean;
  duckNames: string;
  dragging: boolean;
  onRename(id: string | null): void;
  onMenu(id: string, x: number, y: number): void;
  onResizeStart(id: string, e: ReactPointerEvent<HTMLDivElement>): void;
  onReorderStart(id: string, e: ReactPointerEvent<HTMLDivElement>): void;
}

const TrackHeader = memo(function TrackHeader({ track, index, top, height, focused, renaming, duckNames, dragging, onRename, onMenu, onResizeStart, onReorderStart }: HeaderProps) {
  const id = track.id;
  const audio = track.kind === 'audio';
  const compact = height < 50;
  const tiny = height < 34;
  const [draft, setDraft] = useState(track.name);
  const inputRef = useRef<HTMLInputElement>(null);

  // focus synchronously on mount: a frame's delay would send the first keystrokes to the timeline (where a bare
  // key is a shortcut)
  useLayoutEffect(() => {
    if (!renaming) return;
    setDraft(track.name);
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [renaming, track.name]);

  const commitName = () => {
    const name = draft.trim();
    if (name && name !== track.name) editor.apply('Rename Track', (q) => renameTrack(q, id, name));
    onRename(null);
  };

  const toggle = (key: 'mute' | 'solo' | 'lock', label: string) => () =>
    editor.apply(`${track[key] ? `Un${label.toLowerCase()}` : label} Track`, (q) => toggleTrackFlag(q, id, key));

  const level = audio ? dbToFader(track.gainDb ?? 0) : (track.opacity ?? 1);
  const setLevel = (pos: number) => {
    if (audio) editor.apply('Track Volume', (q) => setTrackLevel(q, id, Math.round(faderToDb(pos) * 10) / 10), { coalesce: `track-gain-${id}` });
    else editor.apply('Track Opacity', (q) => setTrackLevel(q, id, Math.round(pos * 1000) / 1000), { coalesce: `track-opacity-${id}` });
  };
  const setPan = (pan: number) => editor.apply('Track Pan', (q) => setTrackPan(q, id, pan), { coalesce: `track-pan-${id}` });

  const cls = ['tl-th', audio ? 'is-audio' : 'is-video', focused ? 'is-focused' : '', track.mute ? 'is-muted' : '', track.lock ? 'is-locked' : '', dragging ? 'is-dragging' : '', compact ? 'is-compact' : '', tiny ? 'is-tiny' : '']
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={cls}
      style={{ top, height, ...(track.color ? { ['--tl-track-color' as string]: track.color } : {}) }}
      onPointerDown={(e) => {
        if (e.button === 0) editor.set({ track: id });
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        editor.set({ track: id });
        onMenu(id, e.clientX, e.clientY);
      }}
    >
      <div className="tl-th-strip" />
      <div className="tl-th-main">
        <div className="tl-th-row">
          <div className="tl-th-num" title="Drag to reorder" onPointerDown={(e) => onReorderStart(id, e)}>
            {index + 1}
          </div>
          {renaming ? (
            <input
              ref={inputRef}
              className="tl-th-name-input"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commitName}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === 'Enter') commitName();
                else if (e.key === 'Escape') onRename(null);
              }}
            />
          ) : (
            <div className="tl-th-name" title={`${track.name} (double-click to rename)`} onDoubleClick={() => onRename(id)}>
              {track.name}
            </div>
          )}
          <div className="tl-th-buttons">
            {!tiny && (
              <button type="button" className="tl-th-btn tl-th-fx" title="Track FX…" onClick={() => emitTimelineCommand({ kind: 'trackFx', trackId: id })} aria-label="Track FX">
                FX{(track.videoFx?.length || track.audioFx?.length) ? <i className="tl-th-dot" /> : null}
              </button>
            )}
            <button type="button" className={`tl-th-btn tl-th-m${track.mute ? ' is-on' : ''}`} title="Mute" aria-pressed={track.mute} onClick={toggle('mute', 'Mute')}>
              M
            </button>
            <button type="button" className={`tl-th-btn tl-th-s${track.solo ? ' is-on' : ''}`} title="Solo" aria-pressed={track.solo} onClick={toggle('solo', 'Solo')}>
              S
            </button>
            <button type="button" className={`tl-th-btn tl-th-l${track.lock ? ' is-on' : ''}`} title="Lock" aria-pressed={track.lock} onClick={toggle('lock', 'Lock')} aria-label="Lock">
              <svg viewBox="0 0 12 12" width="10" height="10" aria-hidden="true">
                <path d={track.lock ? 'M3.5 5V3.6a2.5 2.5 0 0 1 5 0V5' : 'M3.5 5V3.6a2.5 2.5 0 0 1 4.8-.9'} fill="none" stroke="currentColor" strokeWidth="1.3" />
                <rect x="2" y="5" width="8" height="6" rx="1" fill="currentColor" />
              </svg>
            </button>
          </div>
        </div>
        {!compact && (
          <div className="tl-th-row tl-th-controls">
            <label className="tl-th-slider" title={audio ? 'Track volume (double-click: 0 dB)' : 'Track opacity (double-click: 100%)'}>
              <span className="tl-th-cap">{audio ? 'Vol' : 'Level'}</span>
              <input
                type="range"
                min={0}
                max={1000}
                value={Math.round(level * 1000)}
                onChange={(e) => setLevel(Number(e.target.value) / 1000)}
                onDoubleClick={() => setLevel(audio ? dbToFader(0) : 1)}
              />
              <span className="tl-th-val">{audio ? fmtDb(track.gainDb ?? 0) : `${Math.round((track.opacity ?? 1) * 100)}%`}</span>
            </label>
            {audio && height < PAN_ROW_MIN_H && (
              <label className="tl-th-slider tl-th-pan-mini" title={`Track pan: ${fmtPan(track.pan ?? 0)} (double-click: center)`}>
                <input type="range" min={-100} max={100} value={Math.round((track.pan ?? 0) * 100)} onChange={(e) => setPan(Number(e.target.value) / 100)} onDoubleClick={() => setPan(0)} aria-label="Track pan" />
                <span className="tl-th-val">{fmtPanShort(track.pan ?? 0)}</span>
              </label>
            )}
          </div>
        )}
        {!compact && audio && height >= PAN_ROW_MIN_H && (
          <div className="tl-th-row tl-th-controls">
            <label className="tl-th-slider" title="Track pan (double-click: center)">
              <span className="tl-th-cap">Pan</span>
              <input type="range" min={-100} max={100} value={Math.round((track.pan ?? 0) * 100)} onChange={(e) => setPan(Number(e.target.value) / 100)} onDoubleClick={() => setPan(0)} />
              <span className="tl-th-val">{fmtPan(track.pan ?? 0)}</span>
            </label>
          </div>
        )}
        {audio && track.duck && !tiny && (
          <button
            type="button"
            className="tl-th-duck"
            title={`Ducked ${track.duck.depthDb} dB under ${duckNames || 'its key tracks'} — click for the ducking settings (remove it from the track menu)`}
            onClick={() => emitTimelineCommand({ kind: 'trackProperties', trackId: id })}
          >
            Duck −{track.duck.depthDb} dB
          </button>
        )}
      </div>
      <div className="tl-th-resize" title="Drag to resize" onPointerDown={(e) => onResizeStart(id, e)} />
    </div>
  );
});

export interface TrackHeadersProps {
  project: Project;
  rows: TrackRow[];
  scrollY: number;
  focusTrack: string | null;
  renaming: string | null;
  onRename(id: string | null): void;
  onMenu(trackId: string, x: number, y: number): void;
  /** live height while resizing (null clears the override); commit applies it to the project */
  onResize(trackId: string, height: number | null, commit: boolean): void;
}

export default function TrackHeaders({ project, rows, scrollY, focusTrack, renaming, onRename, onMenu, onResize }: TrackHeadersProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [reorder, setReorder] = useState<{ id: string; to: number; lineY: number } | null>(null);

  const names = new Map(project.tracks.map((t, i) => [t.id, `${i + 1} ${t.name}`]));
  // the drag handlers read the latest layout through refs, so they stay stable and the memoised
  // headers only re-render when their own track changes
  const rowsRef = useRef(rows);
  rowsRef.current = rows;
  const scrollRef = useRef(scrollY);
  scrollRef.current = scrollY;
  const resizeRef = useRef(onResize);
  resizeRef.current = onResize;

  const onResizeStart = useCallback((id: string, e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    const onResize = resizeRef.current;
    const row = rowsRef.current.find((r) => r.track.id === id);
    if (!row) return;
    const y0 = e.clientY;
    const h0 = row.height;
    const el = e.currentTarget;
    el.setPointerCapture(e.pointerId);
    let h = h0;
    const move = (ev: PointerEvent) => {
      h = Math.max(M.minTrackH, Math.min(M.maxTrackH, Math.round(h0 + ev.clientY - y0)));
      onResize(id, h, false);
    };
    const up = () => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
      // commit a real change; otherwise just drop the live override
      if (h !== h0) onResize(id, h, true);
      else onResize(id, null, false);
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
  }, []);

  const onReorderStart = useCallback((id: string, e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    editor.set({ track: id });
    const el = e.currentTarget;
    el.setPointerCapture(e.pointerId);
    const rows = rowsRef.current;
    const from = rows.findIndex((r) => r.track.id === id);
    let to = from;
    let moved = false;
    const y0 = e.clientY;
    const move = (ev: PointerEvent) => {
      if (!moved && Math.abs(ev.clientY - y0) < 4) return;
      moved = true;
      const box = boxRef.current?.getBoundingClientRect();
      if (!box) return;
      const scrollY = scrollRef.current;
      const ly = ev.clientY - box.top + scrollY;
      // insertion slot: before the row whose middle is below the pointer
      let slot = rows.length;
      for (let i = 0; i < rows.length; i++) {
        if (ly < rows[i].top + rows[i].height / 2) {
          slot = i;
          break;
        }
      }
      const lineY = slot < rows.length ? rows[slot].top : (rows.at(-1)?.top ?? 0) + (rows.at(-1)?.height ?? 0);
      to = slot > from ? slot - 1 : slot;
      setReorder({ id, to, lineY });
    };
    const up = () => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
      setReorder(null);
      if (moved && to !== from) editor.apply('Move Track', (q) => moveTrack(q, id, to));
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
  }, []);

  // rows are positioned in lane space inside a translated layer: scrolling moves one transform instead of
  // re-rendering every header
  return (
    <div ref={boxRef} className="tl-headers" onContextMenu={(e) => e.preventDefault()}>
      <div className="tl-headers-inner" style={{ transform: `translateY(${-scrollY}px)` }}>
        {rows.map((r) => {
          const y = r.top - scrollY;
          if (y + r.height < -200 || y > 4000) return null;
          const duckNames = r.track.duck ? r.track.duck.by.map((b) => names.get(b) ?? b).join(', ') : '';
          return (
            <TrackHeader
              key={r.track.id}
              track={r.track}
              index={r.index}
              top={r.top}
              height={r.height}
              focused={focusTrack === r.track.id}
              renaming={renaming === r.track.id}
              duckNames={duckNames}
              dragging={reorder?.id === r.track.id}
              onRename={onRename}
              onMenu={onMenu}
              onResizeStart={onResizeStart}
              onReorderStart={onReorderStart}
            />
          );
        })}
        {reorder && <div className="tl-th-insert" style={{ top: reorder.lineY - 1 }} />}
        <div
          className="tl-headers-tail"
          style={{ top: (rows.at(-1)?.top ?? 0) + (rows.at(-1)?.height ?? 0) }}
          onContextMenu={(e) => {
            e.preventDefault();
            onMenu('', e.clientX, e.clientY);
          }}
        />
      </div>
    </div>
  );
}
