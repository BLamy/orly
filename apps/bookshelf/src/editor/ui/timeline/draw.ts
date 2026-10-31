/**
 * Timeline painter — the ruler band and the track lanes on one DPR-scaled canvas.
 *
 *   paintStatic(ctx, scene, sel, media)    -> tabs     lanes, events, transitions, markers, regions, loop bar,
 *                                                     ruler (cached by the caller in an offscreen layer)
 *   paintOverlay(ctx, scene, overlay)                  cursor, play head, hover handles, snap guide,
 *                                                     marquee and the drag badge (every frame, cheap)
 *
 * Only what is visible is painted: rows outside the vertical window are skipped and each row's events come
 * from a binary search over its sorted events (hit.ts `visibleEvents`), so a 33-minute film with ~420
 * events paints in about a millisecond. Shot thumbnails and waveforms come from caches that fill in idle
 * time (thumbs.ts); a miss paints a placeholder and the cache asks for a repaint when the data lands.
 *
 * Also drawn: track envelopes across their lanes (over the events, Vegas style), the FX / Pan/Crop buttons in an
 * event's title strip, and a red A/V sync-offset badge on a narration line that has drifted from its shot
 * (model/ops.ts syncOffsets; Vegas's out-of-sync numbers, in frames).
 *
 * Coordinates are CSS px; the caller has already scaled ctx by devicePixelRatio.
 */
import type { AudioEngine, EditEvent, Media, Project, Track } from '../../model/types';
import { srcAt } from '../../model/types';
import { syncOffsets } from '../../model/ops.ts';
import { fadeInGain, fadeOutGain, keyValue, ENVELOPES } from './curves.ts';
import { rulerTicks, timecode, tToX, xToT, type TrackRow } from './geometry.ts';
import { EVENT_BTN, envY, envelopeKinds, eventBox, eventButtons, levelFrac, rowY, trackEnvY, trackEnvelopeKinds, visibleEvents, type Box, type Hit, type LaneScene, type Tab } from './hit.ts';
import { eventColor, M, RULER_H, TL } from './style.ts';
import { thumbHeight, type PeakCache, type ThumbCache } from './thumbs.ts';

export interface PaintMedia {
  thumbs: ThumbCache;
  peaks: PeakCache;
  audio: AudioEngine | null;
  dpr: number;
  /** media that painted as a placeholder (a shot that failed): the event's title strip turns red */
  failed?: (mediaId: string) => boolean;
}

export interface Badge {
  x: number;
  y: number;
  text: string;
}

export interface OverlayState {
  cursor: number;
  /** play head while playing (null when stopped) */
  playhead: number | null;
  hover: Hit | null;
  /** live snapping guide (timeline seconds) */
  snapT: number | null;
  /** marquee rectangle in canvas px */
  marquee: { x0: number; y0: number; x1: number; y1: number } | null;
  badge: Badge | null;
  /** keyboard focus ring */
  focused: boolean;
}

// ---------------------------------------------------------------------------
// small helpers
// ---------------------------------------------------------------------------
/** mix two #rrggbb colours */
function mix(a: string, b: string, u: number): string {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  if (a.length !== 7 || b.length !== 7 || Number.isNaN(pa) || Number.isNaN(pb)) return a;
  const ch = (p: number, s: number) => (p >> s) & 255;
  const c = (s: number) => Math.round(ch(pa, s) + (ch(pb, s) - ch(pa, s)) * u);
  return `#${((1 << 24) | (c(16) << 16) | (c(8) << 8) | c(0)).toString(16).slice(1)}`;
}

let hatch: CanvasPattern | null | undefined;
/** diagonal hatch for muted events and locked lanes (made once) */
function hatchPattern(ctx: CanvasRenderingContext2D): CanvasPattern | null {
  if (hatch !== undefined) return hatch;
  const c = document.createElement('canvas');
  c.width = c.height = 8;
  const g = c.getContext('2d');
  if (!g) return (hatch = null);
  g.strokeStyle = 'rgba(255,255,255,0.9)';
  g.lineWidth = 1.5;
  g.beginPath();
  g.moveTo(-2, 10);
  g.lineTo(10, -2);
  g.stroke();
  return (hatch = ctx.createPattern(c, 'repeat'));
}

/** text clipped to a width, with an ellipsis */
function fitText(ctx: CanvasRenderingContext2D, text: string, maxW: number): string {
  if (maxW <= 6) return '';
  if (ctx.measureText(text).width <= maxW) return text;
  let lo = 0;
  let hi = text.length;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (ctx.measureText(`${text.slice(0, mid)}…`).width <= maxW) lo = mid;
    else hi = mid - 1;
  }
  return lo > 0 ? `${text.slice(0, lo)}…` : '';
}

/** what an event is called on the timeline (a narration line: its id and the opening of what it says) */
export function eventLabel(e: EditEvent, m: Media | undefined): string {
  if (e.label) return e.label;
  if (!m) return e.mediaId;
  if (m.kind === 'shot') return m.label && m.label !== m.shotId ? `${m.shotId} · ${m.label}` : m.shotId;
  if (m.kind === 'text') return (e.text?.content ?? m.text.content).split('\n')[0] || m.label;
  if (m.kind === 'audio' && m.role === 'narration' && m.tags?.text) return `${m.label} · ${m.tags.text}`;
  return m.label;
}

/** sync offsets per project (projects are immutable: memoised by identity) */
const syncCache = new WeakMap<Project, Map<string, number>>();
function syncOf(p: Project): Map<string, number> {
  let m = syncCache.get(p);
  if (!m) syncCache.set(p, (m = syncOffsets(p)));
  return m;
}

// ---------------------------------------------------------------------------
// static layer
// ---------------------------------------------------------------------------
export function paintStatic(ctx: CanvasRenderingContext2D, s: LaneScene, sel: ReadonlySet<string>, media: PaintMedia): Tab[] {
  const W = s.view.width;
  const H = s.height;
  ctx.fillStyle = TL.empty;
  ctx.fillRect(0, 0, W, H);

  const ticks = rulerTicks(s.view.pxPerSec, s.project.fps);
  const t0 = xToT(s.view, 0);
  const t1 = xToT(s.view, W);

  // ---- lanes ----
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, RULER_H, W, H - RULER_H);
  ctx.clip();
  const visRows = s.rows.filter((r) => {
    const y = rowY(s, r);
    return y + r.height > RULER_H && y < H;
  });
  for (const r of visRows) paintLane(ctx, s, r);
  paintTimeGuides(ctx, s, ticks.major, t0, t1);
  media.thumbs.beginFrame();
  const sync = syncOf(s.project);
  for (const r of visRows) {
    const evs = visibleEvents(s, r);
    for (const { e, b } of evs) paintEvent(ctx, s, r.track, e, b, sel.has(e.id), media, sync.get(e.id));
    paintTransitions(ctx, s, r.track, evs);
    if (s.ui.showEnvelopes) paintTrackEnvelopes(ctx, s, r);
  }
  ctx.restore();

  // ---- ruler band ----
  return paintRuler(ctx, s, ticks, t0, t1);
}

function paintLane(ctx: CanvasRenderingContext2D, s: LaneScene, r: TrackRow): void {
  const y = rowY(s, r);
  const W = s.view.width;
  const focus = s.ui.track === r.track.id;
  ctx.fillStyle = focus ? TL.laneFocus : r.index % 2 ? TL.laneAlt : TL.lane;
  ctx.fillRect(0, y, W, r.height);
  if (r.track.lock) {
    const pat = hatchPattern(ctx);
    if (pat) {
      ctx.globalAlpha = 0.035;
      ctx.fillStyle = pat;
      ctx.fillRect(0, y, W, r.height);
      ctx.globalAlpha = 1;
    }
  }
  ctx.fillStyle = TL.laneEdge;
  ctx.fillRect(0, y + r.height - 1, W, 1);
}

/** grid, region bands, loop shading, marker lines (under the events) */
function paintTimeGuides(ctx: CanvasRenderingContext2D, s: LaneScene, major: number, t0: number, t1: number): void {
  const H = s.height;
  const lanesH = H - RULER_H;
  ctx.fillStyle = TL.gridMajor;
  for (let i = Math.ceil(t0 / major); i * major <= t1; i++) {
    const x = Math.round(tToX(s.view, i * major));
    ctx.fillRect(x, RULER_H, 1, lanesH);
  }
  for (const r of s.project.regions) {
    if (r.end < t0 || r.start > t1) continue;
    const a = tToX(s.view, r.start);
    const b = tToX(s.view, r.end);
    ctx.fillStyle = TL.regionShade;
    ctx.fillRect(a, RULER_H, b - a, lanesH);
  }
  const loop = s.ui.loop;
  if (loop && loop.end > t0 && loop.start < t1) {
    const a = tToX(s.view, loop.start);
    const b = tToX(s.view, loop.end);
    ctx.fillStyle = TL.loopShade;
    ctx.globalAlpha = s.ui.looping ? 1.6 : 0.8;
    ctx.fillRect(a, RULER_H, b - a, lanesH);
    ctx.globalAlpha = 1;
  }
  ctx.save();
  ctx.setLineDash([3, 4]);
  ctx.lineWidth = 1;
  ctx.strokeStyle = TL.marker;
  ctx.globalAlpha = 0.45;
  ctx.beginPath();
  for (const m of s.project.markers) {
    if (m.t < t0 || m.t > t1) continue;
    const x = Math.round(tToX(s.view, m.t)) + 0.5;
    ctx.moveTo(x, RULER_H);
    ctx.lineTo(x, H);
  }
  ctx.stroke();
  ctx.strokeStyle = TL.region;
  ctx.beginPath();
  for (const r of s.project.regions) {
    for (const t of [r.start, r.end]) {
      if (t < t0 || t > t1) continue;
      const x = Math.round(tToX(s.view, t)) + 0.5;
      ctx.moveTo(x, RULER_H);
      ctx.lineTo(x, H);
    }
  }
  ctx.stroke();
  ctx.restore();
}

// ---------------------------------------------------------------------------
// events
// ---------------------------------------------------------------------------
function paintEvent(ctx: CanvasRenderingContext2D, s: LaneScene, track: Track, e: EditEvent, b: Box, selected: boolean, media: PaintMedia, syncOffset: number | undefined): void {
  const W = s.view.width;
  const vx0 = Math.max(b.x0, -2);
  const vx1 = Math.min(b.x1, W + 2);
  if (vx1 <= vx0 || b.h <= 2) return;
  const m = s.project.media[e.mediaId];
  const failed = !!media.failed?.(e.mediaId);
  const base = failed ? { body: '#4a2626', head: TL.syncBad } : e.color ? { body: e.color, head: e.color } : eventColor(m);
  const body = selected ? mix(base.body, '#ffffff', 0.16) : base.body;
  const head = selected ? mix(base.head, '#ffffff', 0.22) : base.head;

  ctx.save();
  ctx.beginPath();
  ctx.rect(b.x0, b.y, b.x1 - b.x0, b.h);
  ctx.clip();
  ctx.fillStyle = body;
  ctx.fillRect(vx0, b.y, vx1 - vx0, b.h);

  if (b.bodyH >= 6 && m) {
    if (m.kind === 'audio') paintWaveform(ctx, s, e, b, vx0, vx1, media);
    else if (m.kind === 'color') {
      ctx.fillStyle = m.color;
      ctx.fillRect(vx0, b.bodyTop + 2, vx1 - vx0, b.bodyH - 4);
    } else if (m.kind === 'text') paintTextBody(ctx, e, m, b, vx0, vx1);
    else paintThumbs(ctx, s, e, m, b, vx0, vx1, media);
  }
  if (m?.kind === 'shot') paintShotNotches(ctx, s, e, m.duration, b);
  paintGainShape(ctx, s, track, e, b);
  if (s.ui.showEnvelopes) paintEnvelopes(ctx, s, track, e, b, vx0, vx1);

  if (b.headH) {
    ctx.fillStyle = head;
    ctx.fillRect(vx0, b.y, vx1 - vx0, b.headH);
    if (Math.abs(e.rate - 1) > 1e-3) paintZigzag(ctx, vx0, vx1, b.y + b.headH - 1.5);
    const btns = eventButtons(s, track, e, b);
    const sync = syncOffset !== undefined ? paintSyncBadge(ctx, s, b, syncOffset, btns.length ? btns[btns.length - 1].x : b.x1) : 0;
    paintLabel(ctx, e, m, b, vx0, Math.min(vx1, (btns.length ? btns[btns.length - 1].x : b.x1) - sync), failed);
    for (const btn of btns) paintEventButton(ctx, btn.part, btn.x, b.y + (b.headH - EVENT_BTN) / 2, btn.on);
  } else if (b.h >= 12) {
    paintLabel(ctx, e, m, b, vx0, vx1);
  }

  if (e.mute || track.mute) {
    ctx.fillStyle = TL.muteHatch;
    ctx.fillRect(vx0, b.y, vx1 - vx0, b.h);
    const pat = hatchPattern(ctx);
    if (pat) {
      ctx.globalAlpha = 0.12;
      ctx.fillStyle = pat;
      ctx.fillRect(vx0, b.y, vx1 - vx0, b.h);
      ctx.globalAlpha = 1;
    }
  }
  ctx.restore();

  // outline (outside the clip so the selection ring is fully visible)
  if (selected) {
    ctx.strokeStyle = TL.select;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(b.x0 + 0.75, b.y + 0.75, b.x1 - b.x0 - 1.5, b.h - 1.5);
  } else {
    ctx.strokeStyle = 'rgba(0,0,0,0.55)';
    ctx.lineWidth = 1;
    ctx.strokeRect(b.x0 + 0.5, b.y + 0.5, b.x1 - b.x0 - 1, b.h - 1);
  }
}

function paintLabel(ctx: CanvasRenderingContext2D, e: EditEvent, m: Media | undefined, b: Box, vx0: number, vx1: number, failed = false): void {
  const lx = Math.max(b.x0, 0) + 4;
  let maxW = Math.min(b.x1, vx1) - lx - 4;
  if (maxW < 10) return;
  ctx.font = M.font;
  ctx.textBaseline = 'middle';
  const cy = b.headH ? b.y + b.headH / 2 + 0.5 : b.y + 8;
  let x = lx;
  if (e.lock) {
    paintLock(ctx, x, cy);
    x += 11;
    maxW -= 11;
  }
  let text = eventLabel(e, m);
  if (Math.abs(e.rate - 1) > 1e-3) text += `  ${e.rate.toFixed(2)}×`;
  if (e.mute) text = `[M] ${text}`;
  if (failed) text = `⚠ ${text} · failed to paint`;
  ctx.fillStyle = TL.text;
  ctx.fillText(fitText(ctx, text, maxW), x, cy);
}

/** Vegas's out-of-sync number: frames the line's speech has drifted from its shot, right-aligned before `right`;
 *  returns the width used */
function paintSyncBadge(ctx: CanvasRenderingContext2D, s: LaneScene, b: Box, offset: number, right: number): number {
  const frames = Math.round(offset * s.project.fps);
  const text = `${frames > 0 ? '+' : ''}${frames}f`;
  ctx.font = M.fontSmall;
  const w = ctx.measureText(text).width + 6;
  const x = right - w - 2;
  if (x < Math.max(b.x0, 0) + 24) return 0;
  ctx.fillStyle = TL.syncBad;
  ctx.fillRect(x, b.y + 1, w, b.headH - 2);
  ctx.fillStyle = '#fff';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + 3, b.y + b.headH / 2 + 0.5);
  return w + 4;
}

/** the FX ("fx") and Pan/Crop (a crop frame) buttons at an event's top right */
function paintEventButton(ctx: CanvasRenderingContext2D, part: 'fxBtn' | 'panCropBtn', x: number, y: number, on: boolean): void {
  const z = EVENT_BTN;
  ctx.fillStyle = on ? 'rgba(20,22,26,0.85)' : 'rgba(20,22,26,0.55)';
  ctx.fillRect(x, y, z, z);
  ctx.strokeStyle = on ? TL.select : TL.textDim;
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, z - 1, z - 1);
  ctx.fillStyle = on ? TL.select : TL.textDim;
  ctx.strokeStyle = on ? TL.select : TL.textDim;
  if (part === 'fxBtn') {
    ctx.font = '600 8px system-ui, sans-serif';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillText('fx', x + z / 2, y + z / 2 + 0.5);
    ctx.textAlign = 'left';
  } else {
    ctx.strokeRect(x + 3.5, y + 3.5, z - 7, z - 7);
    ctx.fillRect(x + 2, y + 2, 2, 2);
    ctx.fillRect(x + z - 4, y + z - 4, 2, 2);
  }
}

function paintLock(ctx: CanvasRenderingContext2D, x: number, cy: number): void {
  ctx.strokeStyle = TL.text;
  ctx.fillStyle = TL.text;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(x + 4, cy - 1.5, 2.4, Math.PI, 0);
  ctx.stroke();
  ctx.fillRect(x + 0.8, cy - 1.5, 6.4, 5);
}

function paintZigzag(ctx: CanvasRenderingContext2D, x0: number, x1: number, y: number): void {
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  let up = true;
  ctx.moveTo(x0, y);
  for (let x = x0; x <= x1; x += 3) {
    ctx.lineTo(x, up ? y - 1.5 : y + 1);
    up = !up;
  }
  ctx.stroke();
}

/** small notches where a shot's natural span begins and ends (src 0 / src = duration) */
function paintShotNotches(ctx: CanvasRenderingContext2D, s: LaneScene, e: EditEvent, duration: number, b: Box): void {
  if (!Number.isFinite(duration)) return;
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  for (const src of [0, duration]) {
    const t = e.start + (src - e.srcIn) / (e.rate || 1);
    if (t <= e.start + 1e-6 || t >= e.start + e.length - 1e-6) continue;
    const x = tToX(s.view, t);
    ctx.beginPath();
    ctx.moveTo(x - 3.5, b.y);
    ctx.lineTo(x + 3.5, b.y);
    ctx.lineTo(x, b.y + 4.5);
    ctx.closePath();
    ctx.fill();
  }
}

function paintThumbs(ctx: CanvasRenderingContext2D, s: LaneScene, e: EditEvent, m: Media, b: Box, vx0: number, vx1: number, media: PaintMedia): void {
  const aspect = s.project.width / Math.max(1, s.project.height);
  const th = b.bodyH;
  const tw = Math.max(8, th * aspect);
  const hq = thumbHeight(th * media.dpr);
  const wq = Math.max(4, Math.round(hq * aspect));
  const slots = Math.max(1, Math.ceil((b.x1 - b.x0) / tw));
  const k0 = Math.max(0, Math.floor((vx0 - b.x0) / tw));
  const k1 = Math.min(slots - 1, Math.ceil((vx1 - b.x0) / tw));
  // source step shared by nearby zoom levels: a power of two of the slot's source span, ≥ one frame
  const slotSrc = (tw / s.view.pxPerSec) * Math.abs(e.rate || 1);
  const q = Math.max(1 / s.project.fps, 2 ** Math.round(Math.log2(Math.max(1e-3, slotSrc / 2))));
  for (let k = k0; k <= k1; k++) {
    const sx = b.x0 + k * tw;
    let src = srcAt(e, xToT(s.view, sx));
    src = Math.round(src / q) * q;
    const priority = k === 0 ? 0 : k === slots - 1 ? 1 : 2 + k / 1000;
    const img = media.thumbs.get(m.id, src, wq, hq, priority);
    if (img) ctx.drawImage(img, sx, b.bodyTop, tw, th);
    else {
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.fillRect(sx + 1, b.bodyTop + 1, tw - 2, th - 2);
    }
    if (k > 0) {
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(sx, b.bodyTop, 1, th);
    }
  }
}

function paintTextBody(ctx: CanvasRenderingContext2D, e: EditEvent, m: Extract<Media, { kind: 'text' }>, b: Box, vx0: number, vx1: number): void {
  const content = (e.text?.content ?? m.text.content).replace(/\s+/g, ' ');
  const lx = Math.max(b.x0, 0) + 6;
  ctx.font = `600 ${Math.min(22, Math.max(10, b.bodyH * 0.45))}px Georgia, serif`;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(255,240,215,0.8)';
  ctx.fillText('T', lx, b.bodyTop + b.bodyH / 2);
  ctx.font = M.font;
  ctx.fillStyle = TL.text;
  ctx.fillText(fitText(ctx, content, Math.min(b.x1, vx1) - lx - 26), lx + 18, b.bodyTop + b.bodyH / 2);
}

/**
 * Waveform: one column per CSS px, anchored to the event start so columns map to the same source span
 * while scrolling (no shimmer). `peaks` is min/max interleaved per column ([min0, max0, min1, …]); a
 * buffer of one value per column is drawn as a symmetric envelope.
 */
function paintWaveform(ctx: CanvasRenderingContext2D, s: LaneScene, e: EditEvent, b: Box, vx0: number, vx1: number, media: PaintMedia): void {
  const pps = s.view.pxPerSec;
  const rate = e.rate || 1;
  const c0 = Math.max(0, Math.floor(vx0 - b.x0));
  const c1 = Math.min(Math.ceil(b.x1 - b.x0), Math.ceil(vx1 - b.x0));
  const n = c1 - c0;
  const mid = b.bodyTop + b.bodyH / 2;
  // the waveform shows what plays: scaled by the event volume (a boost draws taller, clipped to the body)
  const amp = (b.bodyH / 2 - 1) * Math.pow(10, (e.gainDb ?? 0) / 20);
  ctx.fillStyle = TL.waveformMid;
  ctx.fillRect(vx0, Math.round(mid), vx1 - vx0, 1);
  if (n <= 0) return;
  const src0 = e.srcIn + (c0 / pps) * rate;
  const src1 = e.srcIn + (c1 / pps) * rate;
  const pk = media.peaks.get(media.audio, e.mediaId, src0, src1, n);
  if (!pk) return;
  const pairs = pk.length >= n * 2;
  ctx.fillStyle = TL.waveform;
  ctx.beginPath();
  // upper edge left→right, lower edge right→left
  for (let i = 0; i < n; i++) {
    const hi = pairs ? pk[i * 2 + 1] : Math.abs(pk[i]);
    ctx.lineTo(b.x0 + c0 + i, mid - Math.min(1, Math.max(0, hi)) * amp);
  }
  for (let i = n - 1; i >= 0; i--) {
    const lo = pairs ? pk[i * 2] : -Math.abs(pk[i]);
    ctx.lineTo(b.x0 + c0 + i + 1, mid - Math.max(-1, Math.min(0, lo)) * amp);
  }
  ctx.closePath();
  ctx.fill();
}

/**
 * The event's gain shape: fade-in curve → level line → fade-out curve, with the area above it shaded
 * (the Vegas look). Nothing is drawn for a unity, fade-less event.
 */
function paintGainShape(ctx: CanvasRenderingContext2D, s: LaneScene, track: Track, e: EditEvent, b: Box): void {
  if (b.bodyH < 6) return;
  const pps = s.view.pxPerSec;
  const lf = levelFrac(track, e);
  const fi = e.fadeIn.len * pps;
  const fo = e.fadeOut.len * pps;
  // an event volume above 0 dB sits at the top of the body like unity; the line is tinted so a boost is visible
  const boosted = track.kind === 'audio' && (e.gainDb ?? 0) > 0.05;
  if (lf > 0.999 && fi < 0.5 && fo < 0.5 && !boosted) return;
  const top = b.bodyTop;
  const bottom = b.bodyTop + b.bodyH;
  const levelY = bottom - b.bodyH * lf;
  const pts: [number, number][] = [];
  const steps = (w: number) => Math.max(2, Math.min(48, Math.ceil(w / 3)));
  if (fi >= 0.5) {
    const n = steps(fi);
    for (let i = 0; i <= n; i++) {
      const u = i / n;
      pts.push([b.x0 + u * fi, bottom - b.bodyH * lf * fadeInGain(e.fadeIn.curve, u)]);
    }
  } else pts.push([b.x0, levelY]);
  if (fo >= 0.5) {
    const n = steps(fo);
    for (let i = 0; i <= n; i++) {
      const u = i / n;
      pts.push([b.x1 - fo + u * fo, bottom - b.bodyH * lf * fadeOutGain(e.fadeOut.curve, u)]);
    }
  } else pts.push([b.x1, levelY]);

  ctx.beginPath();
  ctx.moveTo(b.x0, top);
  ctx.lineTo(b.x1, top);
  for (let i = pts.length - 1; i >= 0; i--) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
  ctx.fillStyle = TL.fadeShade;
  ctx.fill();

  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.strokeStyle = boosted ? TL.levelBoost : lf < 0.999 ? TL.levelLine : TL.fadeLine;
  ctx.lineWidth = boosted ? 2 : 1.2;
  ctx.stroke();
}

function paintEnvelopes(ctx: CanvasRenderingContext2D, s: LaneScene, track: Track, e: EditEvent, b: Box, vx0: number, vx1: number): void {
  if (b.bodyH < 8) return;
  for (const kind of envelopeKinds(track)) {
    const keys = e.envelopes?.[kind];
    if (!keys || keys.length === 0) continue;
    const color = kind === 'pan' ? TL.envPan : kind === 'opacity' ? TL.envOpacity : TL.envVolume;
    const dflt = ENVELOPES[kind].dflt;
    const x0 = Math.max(b.x0, vx0);
    const x1 = Math.min(b.x1, vx1);
    ctx.beginPath();
    for (let x = x0, first = true; ; x = Math.min(x1, x + 3)) {
      const y = envY(b, kind, keyValue(keys, xToT(s.view, x) - e.start, dflt));
      if (first) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
      first = false;
      if (x >= x1) break;
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    for (const k of keys) {
      const x = tToX(s.view, e.start + k.t);
      if (x < x0 - 4 || x > x1 + 4) continue;
      const y = envY(b, kind, k.v);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x - 2.5, y - 2.5, 5, 5);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.strokeRect(x - 2.5, y - 2.5, 5, 5);
    }
  }
}

/** a track's envelopes across its whole lane (timeline time), over the events */
function paintTrackEnvelopes(ctx: CanvasRenderingContext2D, s: LaneScene, r: TrackRow): void {
  if (r.height < 14) return;
  const W = s.view.width;
  for (const kind of trackEnvelopeKinds(r.track)) {
    const keys = r.track.envelopes?.[kind];
    if (!keys || keys.length === 0) continue;
    const color = kind === 'pan' ? TL.envPan : TL.envTrack;
    const dflt = ENVELOPES[kind].dflt;
    ctx.beginPath();
    for (let x = 0, first = true; ; x = Math.min(W, x + 3)) {
      const y = trackEnvY(s, r, kind, keyValue(keys, xToT(s.view, x), dflt));
      if (first) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
      first = false;
      if (x >= W) break;
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    for (const k of keys) {
      const x = tToX(s.view, k.t);
      if (x < -4 || x > W + 4) continue;
      const y = trackEnvY(s, r, kind, k.v);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }
}

/** overlaps on a track: shade the overlap and draw the ✕ (audio: the two fade curves; video: + kind) */
function paintTransitions(ctx: CanvasRenderingContext2D, s: LaneScene, track: Track, evs: readonly { e: EditEvent; b: Box }[]): void {
  for (let i = 0; i < evs.length; i++) {
    const a = evs[i];
    const aEnd = a.e.start + a.e.length;
    for (let j = i + 1; j < evs.length && evs[j].e.start < aEnd - 1e-6; j++) {
      const bb = evs[j];
      const t0 = bb.e.start;
      const t1 = Math.min(aEnd, bb.e.start + bb.e.length);
      const x0 = tToX(s.view, t0);
      const x1 = tToX(s.view, t1);
      const w = x1 - x0;
      if (w < 1) continue;
      const top = bb.b.bodyTop;
      const h = bb.b.bodyH;
      const bottom = top + h;
      ctx.fillStyle = 'rgba(255,255,255,0.07)';
      ctx.fillRect(x0, bb.b.y, w, bb.b.h);
      ctx.strokeStyle = TL.xfade;
      ctx.lineWidth = 1.2;
      const n = Math.max(2, Math.min(40, Math.ceil(w / 3)));
      const curveOut = track.kind === 'audio' ? a.e.fadeOut.curve : 'linear';
      const curveIn = track.kind === 'audio' ? bb.e.fadeIn.curve : 'linear';
      ctx.beginPath();
      for (let k = 0; k <= n; k++) {
        const u = k / n;
        const y = bottom - h * fadeOutGain(curveOut, u);
        if (k) ctx.lineTo(x0 + u * w, y);
        else ctx.moveTo(x0 + u * w, y);
      }
      for (let k = 0; k <= n; k++) {
        const u = k / n;
        const y = bottom - h * fadeInGain(curveIn, u);
        if (k) ctx.lineTo(x0 + u * w, y);
        else ctx.moveTo(x0 + u * w, y);
      }
      ctx.stroke();
      const kind = bb.e.transition?.kind;
      if (track.kind === 'video' && kind && kind !== 'crossfade' && w > 34 && h >= 14) {
        ctx.font = M.fontSmall;
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';
        const label = fitText(ctx, kind, w - 6);
        const tw = ctx.measureText(label).width + 6;
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(x0 + w / 2 - tw / 2, top + h / 2 - 7, tw, 14);
        ctx.fillStyle = TL.text;
        ctx.fillText(label, x0 + w / 2, top + h / 2 + 0.5);
        ctx.textAlign = 'left';
      }
    }
  }
}

// ---------------------------------------------------------------------------
// ruler band: loop bar, time ruler, marker / region bar
// ---------------------------------------------------------------------------
function paintRuler(ctx: CanvasRenderingContext2D, s: LaneScene, ticks: ReturnType<typeof rulerTicks>, t0: number, t1: number): Tab[] {
  const W = s.view.width;
  const fps = s.project.fps;
  ctx.fillStyle = TL.rulerBg;
  ctx.fillRect(0, 0, W, RULER_H);

  // loop bar
  ctx.fillStyle = TL.rulerBand;
  ctx.fillRect(0, 0, W, M.loopBar);
  const loop = s.ui.loop;
  if (loop) {
    const a = tToX(s.view, loop.start);
    const b = tToX(s.view, loop.end);
    ctx.fillStyle = s.ui.looping ? TL.loopOn : TL.loopOff;
    ctx.fillRect(a, 1, Math.max(1, b - a), M.loopBar - 2);
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.fillRect(a, 0, 2, M.loopBar);
    ctx.fillRect(b - 2, 0, 2, M.loopBar);
  }

  // time ruler
  const base = M.loopBar + M.ruler;
  ctx.fillStyle = TL.tickMinor;
  for (let i = Math.ceil(t0 / ticks.minor); i * ticks.minor <= t1; i++) {
    const t = i * ticks.minor;
    const r = t / ticks.major;
    if (Math.abs(r - Math.round(r)) < 1e-6) continue;
    ctx.fillRect(Math.round(tToX(s.view, t)), base - 4, 1, 4);
  }
  ctx.fillStyle = TL.tickMajor;
  ctx.font = M.mono;
  ctx.textBaseline = 'top';
  for (let i = Math.ceil(t0 / ticks.major) - 1; i * ticks.major <= t1; i++) {
    const t = i * ticks.major;
    if (t < 0) continue;
    const x = Math.round(tToX(s.view, t));
    ctx.fillStyle = TL.tickMajor;
    ctx.fillRect(x, base - 10, 1, 10);
    ctx.fillStyle = TL.rulerText;
    ctx.fillText(timecode(t, fps), x + 3, M.loopBar + 4);
  }
  ctx.fillStyle = TL.laneEdge;
  ctx.fillRect(0, base - 1, W, 1);

  // marker / region bar
  ctx.fillStyle = TL.rulerBand;
  ctx.fillRect(0, base, W, M.markerBar);
  ctx.fillStyle = '#000';
  ctx.fillRect(0, RULER_H - 1, W, 1);
  const tabs: Tab[] = [];
  ctx.font = M.fontSmall;
  ctx.textBaseline = 'middle';
  const ty = base + 2;
  const th = M.markerBar - 4;
  const tab = (x: number, label: string, color: string, align: 'left' | 'right'): [number, number] => {
    const w = Math.max(8, Math.min(160, ctx.measureText(label).width + 8));
    const a = align === 'left' ? x : x - w;
    ctx.fillStyle = color;
    ctx.fillRect(a, ty, w, th);
    ctx.fillRect(Math.round(x), base, 1, M.markerBar);
    if (label) {
      ctx.fillStyle = '#16171a';
      ctx.fillText(fitText(ctx, label, w - 6), a + 4, ty + th / 2 + 0.5);
    }
    return [a, a + w];
  };
  s.project.regions.forEach((r, i) => {
    if (r.end < t0 - 20 / s.view.pxPerSec || r.start > t1) return;
    const a = tToX(s.view, r.start);
    const b = tToX(s.view, r.end);
    const [s0, s1] = tab(a, r.label || `R${i + 1}`, TL.region, 'left');
    tabs.push({ kind: 'regionStart', id: r.id, x0: s0, x1: s1 });
    const [e0, e1] = tab(b, '', TL.region, 'right');
    tabs.push({ kind: 'regionEnd', id: r.id, x0: e0, x1: e1 + 3 });
  });
  s.project.markers.forEach((m, i) => {
    if (m.t < t0 - 160 / s.view.pxPerSec || m.t > t1) return;
    const [a, b] = tab(tToX(s.view, m.t), m.label || String(i + 1), TL.marker, 'left');
    tabs.push({ kind: 'marker', id: m.id, x0: a - 3, x1: b });
  });
  return tabs;
}

// ---------------------------------------------------------------------------
// overlay
// ---------------------------------------------------------------------------
function findBox(s: LaneScene, rowIndex: number, id: string): { e: EditEvent; b: Box; track: Track } | null {
  const row = s.rows[rowIndex];
  if (!row) return null;
  const e = row.track.events.find((x) => x.id === id);
  return e ? { e, b: eventBox(s, row, e), track: row.track } : null;
}

export function paintOverlay(ctx: CanvasRenderingContext2D, s: LaneScene, o: OverlayState): void {
  const W = s.view.width;
  const H = s.height;
  const h = o.hover;
  if (h?.zone === 'event') {
    const f = findBox(s, h.row, h.eventId);
    if (f) paintHoverHandles(ctx, s, f.e, f.b, f.track, h.part, h.env);
  } else if (h?.zone === 'trackEnv' && h.part === 'point') {
    const row = s.rows[h.row];
    const k = row?.track.envelopes?.[h.kind]?.[h.index];
    if (row && k) {
      ctx.strokeStyle = TL.handle;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(tToX(s.view, k.t), trackEnvY(s, row, h.kind, k.v), 5.5, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  if (o.snapT != null) {
    const x = Math.round(tToX(s.view, o.snapT)) + 0.5;
    ctx.strokeStyle = TL.snap;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, M.loopBar);
    ctx.lineTo(x, H);
    ctx.stroke();
  }

  if (o.marquee) {
    const { x0, y0, x1, y1 } = o.marquee;
    const x = Math.min(x0, x1);
    const y = Math.min(y0, y1);
    ctx.fillStyle = TL.marqueeFill;
    ctx.fillRect(x, y, Math.abs(x1 - x0), Math.abs(y1 - y0));
    ctx.strokeStyle = TL.marqueeStroke;
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, Math.abs(x1 - x0), Math.abs(y1 - y0));
  }

  // edit cursor: line through ruler and lanes, a flag in the ruler
  const cx = Math.round(tToX(s.view, o.cursor)) + 0.5;
  if (cx > -8 && cx < W + 8) {
    ctx.strokeStyle = TL.cursor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx, M.loopBar);
    ctx.lineTo(cx, H);
    ctx.stroke();
    ctx.fillStyle = TL.cursor;
    ctx.beginPath();
    ctx.moveTo(cx - 5, M.loopBar);
    ctx.lineTo(cx + 5, M.loopBar);
    ctx.lineTo(cx, M.loopBar + 6);
    ctx.closePath();
    ctx.fill();
  }
  if (o.playhead != null) {
    const px = Math.round(tToX(s.view, o.playhead)) + 0.5;
    if (px > -2 && px < W + 2) {
      ctx.strokeStyle = TL.playhead;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(px, M.loopBar);
      ctx.lineTo(px, H);
      ctx.stroke();
    }
  }

  if (o.badge) paintBadge(ctx, o.badge, W, H);
  if (o.focused) {
    ctx.strokeStyle = 'rgba(106,168,255,0.55)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, RULER_H + 0.5, W - 1, H - RULER_H - 1);
  }
}

function paintHoverHandles(ctx: CanvasRenderingContext2D, s: LaneScene, e: EditEvent, b: Box, track: Track, part: string, env?: { kind: 'volume' | 'pan' | 'opacity'; index: number }): void {
  const pps = s.view.pxPerSec;
  ctx.fillStyle = TL.handle;
  ctx.strokeStyle = TL.handle;
  switch (part) {
    case 'fadeIn':
    case 'fadeOut': {
      const x = part === 'fadeIn' ? b.x0 + e.fadeIn.len * pps : b.x1 - e.fadeOut.len * pps;
      ctx.beginPath();
      ctx.moveTo(x - 5, b.y);
      ctx.lineTo(x + 5, b.y);
      ctx.lineTo(x, b.y + 6);
      ctx.closePath();
      ctx.fill();
      ctx.fillRect(Math.round(x), b.y, 1, b.h);
      break;
    }
    case 'trimStart':
    case 'trimEnd': {
      const x = part === 'trimStart' ? b.x0 : b.x1 - 2;
      ctx.fillRect(Math.round(x), b.y, 2, b.h);
      break;
    }
    case 'level': {
      const y = b.bodyTop + b.bodyH * (1 - levelFrac(track, e));
      ctx.fillStyle = TL.levelLine;
      ctx.fillRect(b.x0, Math.round(y) - 1, b.x1 - b.x0, 2);
      break;
    }
    case 'envPoint': {
      const k = env ? e.envelopes?.[env.kind]?.[env.index] : undefined;
      if (env && k) {
        const x = tToX(s.view, e.start + k.t);
        const y = envY(b, env.kind, k.v);
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x - 4.5, y - 4.5, 9, 9);
      }
      break;
    }
    default:
      break;
  }
}

function paintBadge(ctx: CanvasRenderingContext2D, bd: Badge, W: number, H: number): void {
  ctx.font = M.mono;
  ctx.textBaseline = 'middle';
  const lines = bd.text.split('\n');
  const w = Math.max(...lines.map((l) => ctx.measureText(l).width)) + 12;
  const h = lines.length * 14 + 6;
  let x = bd.x + 14;
  let y = bd.y + 16;
  if (x + w > W - 4) x = bd.x - w - 10;
  if (y + h > H - 4) y = bd.y - h - 8;
  ctx.fillStyle = TL.badgeBg;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.fillStyle = TL.badgeText;
  lines.forEach((l, i) => ctx.fillText(l, x + 6, y + 10 + i * 14));
}
