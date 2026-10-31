/**
 * Event Pan/Crop (Vegas, Ctrl+D): place the source frame in the output, optionally keyframed.
 *
 *   <PanCropDialog eventId compositor onClose />
 *
 * The workspace shows the event's SOURCE (the media at the dialog's time) with the OUTPUT frame drawn over it as a
 * rectangle, exactly as Vegas does: drag inside the rectangle to pan, drag a corner to zoom (about the centre),
 * drag the round handle to rotate (Shift snaps to 15°), wheel to zoom. Numeric X / Y / zoom / rotation sit beside it.
 *
 * Model (types.ts PanCrop): output = R(rot)·zoom·source + (x·W, y·H), source centred on the output centre.
 * So the output frame seen in source space is the rectangle with half-size (W/2, H/2)/zoom, rotated by −rot,
 * centred at  c = −R(−rot)·(x·W, y·H)/zoom.
 *
 * Keyframes (event-relative time) live in the strip under the workspace: click to move the dialog's time, click a
 * diamond to jump to it, drag a diamond to retime it. With zero or one key the crop is static and edits change it;
 * "Add key" starts an animation, after which edits write the key at the dialog's time. Edits apply to the project
 * live (one undo step per gesture), so the main preview shows the result as you drag.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { panCropAt } from '../engine/pancrop';
import { deletePanCropKey, findEvent, movePanCropKey, resetPanCrop, setPanCropKey } from '../model/ops';
import type { EditEvent, Keyframe, PanCrop, Project, VideoCompositor } from '../model/types';
import { PANCROP_IDENTITY, srcAt } from '../model/types';
import { editor, useEditor } from '../state/store';
import { NumField, Select } from './Inspector';
import { clamp, timecode } from './theme';

type KeyCurve = NonNullable<Keyframe['curve']>;
const CURVES: KeyCurve[] = ['linear', 'smooth', 'fast', 'slow', 'hold'];
const KEY_EPS = 1 / 240;

const STAGE_W = 600;
const STAGE_H = 400;
/** the source image fills this fraction of the stage width, leaving room to zoom out past it */
const SOURCE_FRAC = 0.62;

const rad = (deg: number) => (deg * Math.PI) / 180;
const rotate = (x: number, y: number, deg: number): [number, number] => {
  const r = rad(deg);
  const c = Math.cos(r), s = Math.sin(r);
  return [x * c - y * s, x * s + y * c];
};

/** output-frame rectangle in source px (origin = source centre) */
function frameRect(pc: PanCrop, W: number, H: number): { c: [number, number]; corners: [number, number][]; top: [number, number] } {
  const z = Math.max(1e-3, pc.zoom);
  const toSrc = (ox: number, oy: number): [number, number] => {
    const [rx, ry] = rotate(ox - pc.x * W, oy - pc.y * H, -pc.rot);
    return [rx / z, ry / z];
  };
  return {
    c: toSrc(0, 0),
    corners: [toSrc(-W / 2, -H / 2), toSrc(W / 2, -H / 2), toSrc(W / 2, H / 2), toSrc(-W / 2, H / 2)],
    top: toSrc(0, -H / 2 - H * 0.12 * z),
  };
}

/** inverse of frameRect's centre: the (x, y) that put the frame centre at source point c for this zoom/rot */
function offsetFor(c: [number, number], zoom: number, rot: number, W: number, H: number): { x: number; y: number } {
  const [rx, ry] = rotate(c[0] * zoom, c[1] * zoom, rot);
  return { x: -rx / W, y: -ry / H };
}

/** where an edit at event-local t lands: a static crop (≤ 1 key) is edited in place; an animated one keys t
 *  (snapped onto an existing key within half a frame) */
function editTime(keys: readonly Keyframe<PanCrop>[], t: number): number {
  if (keys.length <= 1) return keys[0]?.t ?? 0;
  return keys.find((k) => Math.abs(k.t - t) <= KEY_EPS)?.t ?? t;
}

function keyBefore(keys: readonly Keyframe<PanCrop>[], t: number): Keyframe<PanCrop> | undefined {
  let k: Keyframe<PanCrop> | undefined;
  for (const x of keys) if (x.t <= t + KEY_EPS) k = x;
  return k;
}

export interface PanCropDialogProps {
  eventId: string;
  compositor: VideoCompositor | null;
  onClose: () => void;
}

export default function PanCropDialog({ eventId, compositor, onClose }: PanCropDialogProps) {
  const project = useEditor((s) => s.project);
  const hit = project ? findEvent(project, eventId) : null;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || (e.key === 'Enter' && !(e.target instanceof HTMLInputElement))) {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fe-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="fe-dialog" role="dialog" aria-modal="true" aria-labelledby="fe-pc-title" style={{ width: 880 }}>
        <div className="fe-dialog-head">
          <span id="fe-pc-title">Event Pan/Crop{hit ? ` — ${hit.event.label ?? project?.media[hit.event.mediaId]?.label ?? hit.event.id}` : ''}</span>
          <button className="fe-icon-btn" onClick={onClose} aria-label="Close" title="Close (Esc)">
            ✕
          </button>
        </div>
        <div className="fe-dialog-body">
          {!project || !hit ? (
            <div className="fe-empty">The event no longer exists.</div>
          ) : hit.track.kind !== 'video' ? (
            <div className="fe-empty">Pan/Crop applies to video events. Select a video event and press Ctrl+D.</div>
          ) : (
            <PanCropEditor project={project} event={hit.event} compositor={compositor} />
          )}
        </div>
        <div className="fe-dialog-foot">
          <button className="fe-btn is-primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

function PanCropEditor({ project, event: e, compositor }: { project: Project; event: EditEvent; compositor: VideoCompositor | null }) {
  const W = project.width;
  const H = project.height;
  const fps = project.fps;
  const keys = e.panCrop ?? [];
  const cursor = editor.getState().ui.cursor;
  const [lt, setLt] = useState(() => clamp(cursor - e.start, 0, e.length));
  const pc = panCropAt(keys, lt);
  const onKey = keys.find((k) => Math.abs(k.t - lt) <= KEY_EPS);
  const from = keyBefore(keys, lt);

  // stage mapping: source px → stage px
  const k = (STAGE_W * SOURCE_FRAC) / W;
  const cx = STAGE_W / 2;
  const cy = STAGE_H / 2;
  const toStage = ([x, y]: [number, number]): [number, number] => [cx + x * k, cy + y * k];
  const toSource = (sx: number, sy: number): [number, number] => [(sx - cx) / k, (sy - cy) / k];

  const commit = useCallback(
    (next: PanCrop, label = 'Pan/Crop') => {
      const v: PanCrop = { x: +next.x.toFixed(5), y: +next.y.toFixed(5), zoom: +clamp(next.zoom, 0.05, 40).toFixed(5), rot: +next.rot.toFixed(3) };
      const at = editTime(keys, lt);
      const curve = keys.find((k) => Math.abs(k.t - at) <= KEY_EPS)?.curve ?? keyBefore(keys, at)?.curve ?? 'smooth';
      editor.apply(label, (p) => setPanCropKey(p, e.id, at, v, curve), { coalesce: `pc:${e.id}:${at.toFixed(4)}` });
    },
    [e.id, lt, keys],
  );
  /** add a key at the dialog's time (the first key of a static crop goes at 0 so the move starts from it) */
  const addKey = () =>
    editor.apply('Add keyframe', (p) => {
      const base = keys.length ? p : setPanCropKey(p, e.id, 0, pc, 'smooth');
      return lt <= KEY_EPS ? base : setPanCropKey(base, e.id, lt, pc, keyBefore(keys, lt)?.curve ?? 'smooth');
    });

  // ---- source image (the compositor's thumbnail of the media at the dialog's time; retried until it is ready)
  const imgRef = useRef<HTMLCanvasElement | null>(null);
  const src = srcAt(e, e.start + lt);
  useEffect(() => {
    const cv = imgRef.current;
    if (!cv || !compositor) return;
    const w = Math.round(STAGE_W * SOURCE_FRAC);
    const h = Math.round((w * H) / W);
    cv.width = w;
    cv.height = h;
    const ctx = cv.getContext('2d');
    let tries = 0;
    let raf = 0;
    const draw = () => {
      const th = compositor.thumbnail(e.mediaId, src, w, h);
      if (th && ctx) {
        ctx.clearRect(0, 0, w, h);
        ctx.drawImage(th, 0, 0, w, h);
      } else if (tries++ < 90) raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [compositor, e.mediaId, src, W, H]);

  // ---- direct manipulation
  const svgRef = useRef<SVGSVGElement | null>(null);
  const rect = frameRect(pc, W, H);
  const stagePt = (ev: { clientX: number; clientY: number }): [number, number] => {
    const r = svgRef.current!.getBoundingClientRect();
    return [((ev.clientX - r.left) / r.width) * STAGE_W, ((ev.clientY - r.top) / r.height) * STAGE_H];
  };
  const drag = (ev: React.PointerEvent, mode: 'move' | 'scale' | 'rotate') => {
    if (ev.button !== 0) return;
    ev.preventDefault();
    ev.stopPropagation();
    const el = ev.currentTarget as Element;
    el.setPointerCapture(ev.pointerId);
    const p0 = toSource(...stagePt(ev));
    const pc0 = pc;
    const c0 = rect.c;
    const d0 = Math.hypot(p0[0] - c0[0], p0[1] - c0[1]) || 1;
    const a0 = Math.atan2(p0[1] - c0[1], p0[0] - c0[0]);
    const move = (e2: PointerEvent) => {
      const p = toSource(...stagePt(e2));
      if (mode === 'move') {
        const c: [number, number] = [c0[0] + p[0] - p0[0], c0[1] + p[1] - p0[1]];
        commit({ ...pc0, ...offsetFor(c, pc0.zoom, pc0.rot, W, H) });
      } else if (mode === 'scale') {
        const d = Math.hypot(p[0] - c0[0], p[1] - c0[1]) || 1;
        const zoom = clamp((pc0.zoom * d0) / d, 0.05, 40);
        commit({ ...pc0, zoom, ...offsetFor(c0, zoom, pc0.rot, W, H) });
      } else {
        const a = Math.atan2(p[1] - c0[1], p[0] - c0[0]);
        // the frame turns by −rot in source space, so dragging the handle clockwise turns the image anticlockwise
        let rot = pc0.rot - ((a - a0) * 180) / Math.PI;
        if (e2.shiftKey) rot = Math.round(rot / 15) * 15;
        commit({ ...pc0, rot, ...offsetFor(c0, pc0.zoom, rot, W, H) });
      }
    };
    const up = () => {
      el.removeEventListener('pointermove', move as EventListener);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
    };
    el.addEventListener('pointermove', move as EventListener);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
  };
  const onWheel = (ev: React.WheelEvent) => {
    const zoom = clamp(pc.zoom * Math.exp(-ev.deltaY * 0.0015), 0.05, 40);
    commit({ ...pc, zoom, ...offsetFor(rect.c, zoom, pc.rot, W, H) }, 'Pan/Crop zoom');
  };

  const poly = rect.corners.map((p) => toStage(p).join(',')).join(' ');
  const [tx, ty] = toStage(rect.top);
  const [tcx, tcy] = toStage([(rect.corners[0][0] + rect.corners[1][0]) / 2, (rect.corners[0][1] + rect.corners[1][1]) / 2]);
  const [ccx, ccy] = toStage(rect.c);
  const srcW = STAGE_W * SOURCE_FRAC;
  const srcH = (srcW * H) / W;

  return (
    <div className="fe-pc">
      <div>
        <div className="fe-pc-stage" style={{ width: STAGE_W, height: STAGE_H }} onWheel={onWheel}>
          <canvas ref={imgRef} style={{ left: cx - srcW / 2, top: cy - srcH / 2, width: srcW, height: srcH }} aria-label="Source frame" />
          <svg ref={svgRef} viewBox={`0 0 ${STAGE_W} ${STAGE_H}`} aria-label="Output frame: drag to pan, drag a corner to zoom, drag the handle to rotate">
            <rect x={cx - srcW / 2} y={cy - srcH / 2} width={srcW} height={srcH} fill="none" stroke="rgba(255,255,255,0.25)" strokeDasharray="4 3" />
            <polygon points={poly} fill="rgba(240,165,58,0.08)" stroke="#f0a53a" strokeWidth={1.5} style={{ cursor: 'move' }} onPointerDown={(ev) => drag(ev, 'move')} />
            {/* "F" marks the frame's top-left, like Vegas, so rotation and flips read */}
            <text x={toStage(rect.corners[0])[0] + 6} y={toStage(rect.corners[0])[1] + 16} fill="#f0a53a" fontSize={14} fontWeight={700} transform={`rotate(${-pc.rot} ${toStage(rect.corners[0])[0]} ${toStage(rect.corners[0])[1]})`} pointerEvents="none">
              F
            </text>
            <line x1={tcx} y1={tcy} x2={tx} y2={ty} stroke="#f0a53a" strokeWidth={1} />
            <circle cx={tx} cy={ty} r={6} fill="#1e2024" stroke="#f0a53a" strokeWidth={1.5} style={{ cursor: 'grab' }} onPointerDown={(ev) => drag(ev, 'rotate')}>
              <title>Rotate (Shift snaps to 15°)</title>
            </circle>
            {rect.corners.map((p, i) => {
              const [x, y] = toStage(p);
              return <rect key={i} x={x - 5} y={y - 5} width={10} height={10} fill="#f0a53a" style={{ cursor: 'nwse-resize' }} onPointerDown={(ev) => drag(ev, 'scale')} />;
            })}
            <path d={`M${ccx - 6} ${ccy}h12M${ccx} ${ccy - 6}v12`} stroke="#f0a53a" strokeWidth={1} pointerEvents="none" />
          </svg>
        </div>
        <KeyStrip event={e} lt={lt} setLt={setLt} fps={fps} />
      </div>

      <div>
        <div className="fe-row">
          <span className="fe-label">Time</span>
          <span className="fe-mono">
            {timecode(lt, fps)} <span className="fe-dim">(event)</span>
          </span>
        </div>
        <div className="fe-row">
          <span className="fe-label">Key</span>
          <div className="fe-inline">
            <button className="fe-icon-btn" title="Previous keyframe" aria-label="Previous keyframe" disabled={!keys.some((x) => x.t < lt - KEY_EPS)} onClick={() => setLt(keys.filter((x) => x.t < lt - KEY_EPS).at(-1)!.t)}>
              ◀◆
            </button>
            <button className="fe-icon-btn" title="Next keyframe" aria-label="Next keyframe" disabled={!keys.some((x) => x.t > lt + KEY_EPS)} onClick={() => setLt(keys.find((x) => x.t > lt + KEY_EPS)!.t)}>
              ◆▶
            </button>
            {onKey ? (
              <button className="fe-icon-btn" disabled={keys.length <= 1} title="Delete this keyframe" onClick={() => editor.apply('Delete keyframe', (p) => deletePanCropKey(p, e.id, keys.indexOf(onKey)))}>
                Delete key
              </button>
            ) : (
              <button className="fe-icon-btn" title="Add a keyframe here (animates the crop)" onClick={addKey}>
                Add key
              </button>
            )}
          </div>
        </div>
        <div className="fe-row" title="Horizontal offset of the source centre, % of the frame width">
          <NumField label="X" value={pc.x * 100} step={0.1} digits={2} unit="%" onChange={(v) => commit({ ...pc, x: v / 100 })} />
        </div>
        <div className="fe-row" title="Vertical offset of the source centre, % of the frame height">
          <NumField label="Y" value={pc.y * 100} step={0.1} digits={2} unit="%" onChange={(v) => commit({ ...pc, y: v / 100 })} />
        </div>
        <div className="fe-row" title="100% = the source fills the frame; larger enlarges">
          <NumField label="Zoom" value={pc.zoom * 100} min={5} max={4000} step={0.5} digits={1} unit="%" onChange={(v) => commit({ ...pc, zoom: v / 100 })} />
        </div>
        <div className="fe-row" title="Degrees, clockwise">
          <NumField label="Rotation" value={pc.rot} min={-3600} max={3600} step={0.5} digits={1} unit="°" onChange={(v) => commit({ ...pc, rot: v })} />
        </div>
        <div className="fe-row" title="How the crop moves from this key to the next">
          <span className="fe-label">Curve</span>
          <Select<KeyCurve>
            ariaLabel="Keyframe curve"
            value={from?.curve ?? 'smooth'}
            options={CURVES}
            disabled={!from || keys.length < 2}
            onChange={(curve) => from && editor.apply('Keyframe curve', (p) => setPanCropKey(p, e.id, from.t, from.v, curve))}
          />
        </div>
        <div className="fe-inline" style={{ marginTop: 8, flexWrap: 'wrap' }}>
          <button className="fe-btn" onClick={() => commit({ ...PANCROP_IDENTITY }, 'Reset Pan/Crop key')}>
            Full frame
          </button>
          <button className="fe-btn" onClick={() => commit({ ...pc, x: 0, y: 0 }, 'Centre Pan/Crop')}>
            Centre
          </button>
          <button className="fe-btn" onClick={() => commit({ ...pc, rot: 0, ...offsetFor(rect.c, pc.zoom, 0, W, H) }, 'Straighten')}>
            Straighten
          </button>
          <button className="fe-btn is-danger" disabled={!keys.length} onClick={() => editor.apply('Clear Pan/Crop', (p) => resetPanCrop(p, e.id))}>
            Clear all
          </button>
        </div>
        <div className="fe-hint" style={{ padding: '10px 0 0' }}>
          Drag inside the frame to pan, a corner to zoom, the handle to rotate; wheel zooms. {keys.length > 1 ? `${keys.length} keys: edits write the key at this time.` : 'Static crop: add a key at another time to animate.'}
        </div>
      </div>
    </div>
  );
}

/** the keyframe strip: event length across, diamonds for keys, a playhead for the dialog's time */
function KeyStrip(props: { event: EditEvent; lt: number; setLt: (t: number) => void; fps: number }) {
  const { event: e, lt, setLt, fps } = props;
  const keys = useMemo(() => e.panCrop ?? [], [e.panCrop]);
  const ref = useRef<HTMLDivElement | null>(null);
  const tAt = (clientX: number) => {
    const r = ref.current!.getBoundingClientRect();
    return clamp(Math.round((((clientX - r.left) / r.width) * e.length) * fps) / fps, 0, e.length);
  };
  const scrub = (ev: React.PointerEvent) => {
    if (ev.button !== 0) return;
    const el = ev.currentTarget as HTMLElement;
    el.setPointerCapture(ev.pointerId);
    setLt(tAt(ev.clientX));
    const move = (e2: PointerEvent) => setLt(tAt(e2.clientX));
    const up = () => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
  };
  /** drag a diamond to retime its key (ops keep it between its neighbours, so the index is stable) */
  const dragKey = (ev: React.PointerEvent, index: number) => {
    if (ev.button !== 0) return;
    ev.stopPropagation();
    const el = ev.currentTarget as HTMLElement;
    el.setPointerCapture(ev.pointerId);
    setLt(keys[index].t);
    const move = (e2: PointerEvent) => {
      const t = tAt(e2.clientX);
      editor.apply('Move keyframe', (p) => movePanCropKey(p, e.id, index, t), { coalesce: `pck:${e.id}:${index}` });
      const k = (findEvent(editor.getState().project!, e.id)?.event.panCrop ?? [])[index];
      if (k) setLt(k.t);
    };
    const up = () => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
  };
  const pct = (t: number) => `${(clamp(t / e.length, 0, 1) * 100).toFixed(3)}%`;
  return (
    <div ref={ref} className="fe-pc-strip" onPointerDown={scrub} role="slider" aria-label="Pan/Crop time" aria-valuemin={0} aria-valuemax={e.length} aria-valuenow={lt} tabIndex={0}
      onKeyDown={(ev) => {
        if (ev.key === 'ArrowLeft' || ev.key === 'ArrowRight') {
          ev.preventDefault();
          setLt(clamp(lt + (ev.key === 'ArrowRight' ? 1 : -1) / fps, 0, e.length));
        }
      }}
    >
      {keys.map((k, i) => (
        <span
          key={i}
          title={`key at ${timecode(k.t, fps)} (${k.curve ?? 'linear'})`}
          onPointerDown={(ev) => dragKey(ev, i)}
          style={{ position: 'absolute', left: pct(k.t), top: 6, width: 12, height: 12, marginLeft: -6, transform: 'rotate(45deg)', background: Math.abs(k.t - lt) <= KEY_EPS ? '#f0a53a' : '#8c929c', border: '1px solid #16171a', cursor: 'ew-resize' }}
        />
      ))}
      <span style={{ position: 'absolute', left: pct(lt), top: 0, bottom: 0, width: 2, marginLeft: -1, background: '#e25c4f', pointerEvents: 'none' }} />
    </div>
  );
}
