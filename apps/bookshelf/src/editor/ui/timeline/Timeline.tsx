/**
 * Timeline — the Vegas track view: track headers, ruler band and lanes on one high-DPI canvas,
 * scroll bars, context menus.
 *
 *   <Timeline compositor={compositor} audio={audio} height={320} />
 *
 * State lives in the editor store (editor/state/store.ts): the project, cursor, selection, zoom, scroll,
 * loop, snapping/ripple/auto-crossfade/tool modes. Edits are `editor.apply(label, p => <edits.ts op>)`.
 * Local state is presentation only: vertical scroll, live track-height drafts, menus and inline renames.
 *
 * Pointer model (Vegas):
 *   click event          select (+ group), cursor to the click; ctrl toggles, shift selects a range
 *   drag event           move (ripple per ui.ripple, auto-crossfade on overlap); ctrl-drag copies;
 *                        alt-drag slips; across tracks of the same kind
 *   drag edge            trim (files stop at their source); ctrl-drag edge time-stretches
 *   drag top corners     fades;  drag the top of the body: event volume / opacity line
 *   envelope             double-click the line to add a point, drag the line or a point, double-click a point
 *                        (or its menu) to delete; track envelopes are drawn across their lane and work the same
 *   drag empty lane      time selection (loop bar); Selection tool or Ctrl-drag: marquee;  ruler: scrub the cursor;
 *                        loop bar: set / move / resize the loop
 *   event FX / Pan/Crop  the buttons at an event's top right open them
 *   double-click event   loop = the event;  double-click a region tab: loop = the region
 *   middle-drag          pan;  wheel: scroll tracks;  shift+wheel: scroll time;  ctrl/⌘+wheel: zoom at pointer
 *   drop (Explorer)      media / generators insert at the (snapped) drop time on the track under the pointer;
 *                        a transition goes on the nearest cut; a video FX onto an event or a lane / header (drop.ts)
 *   keys (focused)       + / − / ↑ / ↓ zoom around the cursor, PgUp/PgDn focus track, Esc cancels a drag,
 *                        ContextMenu / Shift+F10 opens the menu for the selection
 * While a button is down the drag paints a DRAFT project; release commits it as one undo step. The draft is also
 * pushed to the compositor, so the Video Preview shows a move, trim or slip live (a trim shows its edge frame through
 * ui.previewT); release or Esc hands the compositor back the store's project.
 * Clicks put the cursor on the frame grid (the renderer is frame-exact, and so must the cut S makes there be).
 */
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type DragEvent as ReactDragEvent, type KeyboardEvent as ReactKeyboardEvent, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from 'react';
import type { AudioEngine, Keyframe, Project, VideoCompositor } from '../../model/types';
import { projectDuration } from '../../model/types';
import { editor, useEditor, type EditorUi } from '../../state/store';
import ContextMenu, { type MenuItem } from './ContextMenu';
import { addEnvelopePoint, deleteEnvelopePoint, expandGroups, setTrackHeight, updateMarker, updateRegion, type EnvelopeTarget } from '../../model/ops.ts';
import { snapToFrame } from '../../model/snap.ts';
import { ENVELOPES, keyValue } from './curves.ts';
import { dragKind, readDrop } from '../dnd';
import { planDrop, type DropTarget } from './drop.ts';
import { indexEvents } from './edits.ts';
import { clamp, layoutTracks, rowAt, scrollExtent, timecode, tToX, xToT, zoomAround, zoomLimits } from './geometry.ts';
import { startGesture, hoverCursor, type Gesture, type GestureEnv, type Pointer } from './gestures.ts';
import { eventBox, hitTest, type Hit } from './hit.ts';
import { envelopePointMenu, eventMenu, rulerMenu, trackMenu, type MenuHooks } from './menus.ts';
import { LaneCanvas, type LaneInputs } from './renderer.ts';
import ScrollBar from './ScrollBar';
import { M, RULER_H } from './style.ts';
import TrackHeaders from './TrackHeaders';
import { emitTimelineCommand, setLaneWidth, zoomTimeline, zoomToFit } from './viewport.ts';
import './timeline.css';

export interface TimelineProps {
  compositor: VideoCompositor | null;
  audio: AudioEngine | null;
  /** total height in CSS px (default: fill the parent) */
  height?: number;
}

/** in-flight press / drag */
interface Press {
  pointerId: number;
  button: number;
  x: number;
  y: number;
  hit: Hit;
  mods: Pointer;
  moved: boolean;
  gesture: Gesture | null;
  env: GestureEnv | null;
  /** UI fields to restore if the drag is cancelled */
  uiBefore: Pick<EditorUi, 'cursor' | 'loop' | 'selection'>;
  /** press position in time / lane space (marquee anchor survives autoscroll) */
  t: number;
  laneY: number;
  /** middle-button pan origin */
  pan?: { scrollT: number; scrollY: number };
}

interface Runtime {
  press: Press | null;
  draft: Project | null;
  last: Pointer | null;
  hover: Hit | null;
  snapT: number | null;
  badge: { x: number; y: number; text: string } | null;
  marquee: { x0: number; y0: number; x1: number; y1: number } | null;
  playhead: number | null;
  /** shift-click range anchor */
  anchor: string | null;
  autoRaf: number;
  scrollY: number;
  heights: Map<string, number> | null;
  focused: boolean;
}

const sameHit = (a: Hit | null, b: Hit | null): boolean => {
  if (a === b) return true;
  if (!a || !b || a.zone !== b.zone) return false;
  if (a.zone === 'event' && b.zone === 'event') return a.eventId === b.eventId && a.part === b.part && a.env?.index === b.env?.index && a.env?.kind === b.env?.kind;
  if (a.zone === 'marker' && b.zone === 'marker') return a.id === b.id;
  if (a.zone === 'loopBar' && b.zone === 'loopBar') return a.part === b.part;
  if (a.zone === 'trackEnv' && b.zone === 'trackEnv') return a.trackId === b.trackId && a.kind === b.kind && a.index === b.index && a.part === b.part;
  return a.zone !== 'event' && a.zone !== 'trackEnv';
};

const modsOf = (e: { ctrlKey: boolean; metaKey: boolean; altKey: boolean; shiftKey: boolean }) => ({ ctrl: e.ctrlKey || e.metaKey, alt: e.altKey, shift: e.shiftKey });

/** the cursor time readout in the corner (its own subscription so the timeline does not re-render per frame) */
function CursorReadout() {
  const cursor = useEditor((s) => s.ui.cursor);
  const fps = useEditor((s) => s.project?.fps ?? 24);
  return <div className="tl-tc">{timecode(cursor, fps)}</div>;
}

function ModeReadout() {
  const ripple = useEditor((s) => s.ui.ripple);
  const snapping = useEditor((s) => s.ui.snapping);
  const xf = useEditor((s) => s.ui.autoCrossfade);
  return (
    <div className="tl-modes">
      <button type="button" className={`tl-mode${snapping ? ' is-on' : ''}`} title="Snapping (F)" onClick={() => editor.set({ snapping: !snapping })}>
        Snap
      </button>
      <button
        type="button"
        className={`tl-mode${ripple !== 'off' ? ' is-on' : ''}`}
        title="Auto ripple (Ctrl+L): off / affected tracks / all tracks, markers and regions"
        onClick={() => editor.set({ ripple: ripple === 'off' ? 'tracks' : ripple === 'tracks' ? 'all' : 'off' })}
      >
        {ripple === 'all' ? 'Ripple All' : ripple === 'tracks' ? 'Ripple' : 'Ripple Off'}
      </button>
      <button type="button" className={`tl-mode${xf ? ' is-on' : ''}`} title="Automatic crossfades on overlap" onClick={() => editor.set({ autoCrossfade: !xf })}>
        X-fade
      </button>
    </div>
  );
}

export default function Timeline({ compositor, audio, height }: TimelineProps) {
  const project = useEditor((s) => s.project);
  const focusTrack = useEditor((s) => s.ui.track);
  const pxPerSec = useEditor((s) => s.ui.pxPerSec);
  const scrollT = useEditor((s) => s.ui.scrollT);
  const playing = useEditor((s) => s.ui.playing);

  const rootRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<LaneCanvas | null>(null);
  const compositorRef = useRef(compositor);
  compositorRef.current = compositor;

  const [size, setSize] = useState({ w: 0, h: 0 });
  const [scrollY, setScrollY] = useState(0);
  const [heights, setHeights] = useState<Map<string, number> | null>(null);
  const [menu, setMenu] = useState<{ x: number; y: number; items: MenuItem[] } | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [inline, setInline] = useState<{ kind: 'marker' | 'region'; id: string; x: number; value: string } | null>(null);
  const [focused, setFocused] = useState(false);

  const rt = useRef<Runtime>({
    press: null,
    draft: null,
    last: null,
    hover: null,
    snapT: null,
    badge: null,
    marquee: null,
    playhead: null,
    anchor: null,
    autoRaf: 0,
    scrollY: 0,
    heights: null,
    focused: false,
  });
  rt.current.scrollY = scrollY;
  rt.current.heights = heights;
  rt.current.focused = focused;

  // selection as a Set, memoised per selection array (the store keeps the array identity until it changes)
  const selCache = useRef<{ arr: readonly string[]; set: Set<string> }>({ arr: [], set: new Set() });
  const selectedSet = (arr: readonly string[]): Set<string> => {
    if (selCache.current.arr !== arr) selCache.current = { arr, set: new Set(arr) };
    return selCache.current.set;
  };

  const inputs = useCallback((): LaneInputs => {
    const s = editor.getState();
    const r = rt.current;
    return {
      project: r.draft ?? s.project,
      ui: s.ui,
      scrollY: r.scrollY,
      heights: r.heights,
      selected: selectedSet(s.ui.selection),
      overlay: { playhead: r.playhead, hover: r.press ? null : r.hover, snapT: r.snapT, marquee: r.marquee, badge: r.badge, focused: r.focused },
    };
  }, []);

  // ---- renderer lifecycle ----
  useLayoutEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const r = new LaneCanvas(c, inputs);
    rendererRef.current = r;
    return () => {
      r.dispose();
      rendererRef.current = null;
    };
  }, [inputs]);
  useEffect(() => rendererRef.current?.setCompositor(compositor), [compositor]);
  useEffect(() => rendererRef.current?.setAudio(audio), [audio]);

  // ---- size / DPR ----
  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => {
      const rect = el.getBoundingClientRect();
      const dpr = Math.min(3, window.devicePixelRatio || 1);
      rendererRef.current?.resize(rect.width, rect.height, dpr);
      setLaneWidth(rect.width);
      setSize((s) => (s.w === Math.round(rect.width) && s.h === Math.round(rect.height) ? s : { w: Math.round(rect.width), h: Math.round(rect.height) }));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener('resize', measure); // browser zoom changes devicePixelRatio
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);

  const invalidate = useCallback((staticToo = true) => rendererRef.current?.invalidate(staticToo), []);

  // ---- store → repaint ----
  useEffect(() => {
    let prev = editor.getState();
    const unsubscribe = editor.subscribe(() => {
      const s = editor.getState();
      const a = prev.ui;
      const b = s.ui;
      const staticChanged =
        s.project !== prev.project ||
        a.selection !== b.selection ||
        a.pxPerSec !== b.pxPerSec ||
        a.scrollT !== b.scrollT ||
        a.loop !== b.loop ||
        a.looping !== b.looping ||
        a.showEnvelopes !== b.showEnvelopes ||
        a.track !== b.track;
      if (staticChanged) invalidate(true);
      else if (a.cursor !== b.cursor || a.playing !== b.playing) invalidate(false);
      // keep a moved cursor in view (frame step, go to end, stop returning to the play start) unless the
      // user is dragging or the play head is driving the scroll
      if (a.cursor !== b.cursor && !rt.current.press && !b.playing) {
        const w = rendererRef.current?.width ?? 0;
        const vis = w / b.pxPerSec;
        if (w > 0 && (b.cursor < b.scrollT || b.cursor > b.scrollT + vis)) editor.set({ scrollT: Math.max(0, b.cursor - vis * 0.1) });
      }
      prev = s;
    });
    return () => {
      unsubscribe();
    };
  }, [invalidate]);
  useEffect(() => invalidate(true), [scrollY, heights, invalidate]);
  useEffect(() => invalidate(false), [focused, invalidate]);

  // ---- layout derived for headers / scroll bars ----
  const layout = useMemo(() => (project ? layoutTracks(project.tracks, heights ?? undefined, M.minTrackH, M.maxTrackH) : { rows: [], total: 0 }), [project, heights]);
  const lanesH = Math.max(0, size.h - RULER_H);
  const maxScrollY = Math.max(0, layout.total + M.tailPad - lanesH);
  useEffect(() => {
    if (scrollY > maxScrollY) setScrollY(maxScrollY);
  }, [scrollY, maxScrollY]);
  const duration = project ? projectDuration(project) : 0;
  const visibleT = size.w > 0 ? size.w / pxPerSec : 0;
  const lim = useMemo(() => zoomLimits(duration, size.w || 900, project?.fps ?? 24), [duration, size.w, project?.fps]);

  // ---- playback: play head + page scrolling ----
  useEffect(() => {
    const r = rendererRef.current;
    if (!playing) {
      rt.current.playhead = null;
      r?.thumbs.setBusy(false);
      invalidate(false);
      return;
    }
    r?.thumbs.setBusy(true);
    let raf = 0;
    const tick = () => {
      const s = editor.getState();
      const t = audio ? audio.now() : s.ui.cursor;
      rt.current.playhead = t;
      const w = rendererRef.current?.width ?? 0;
      if (w > 0 && !rt.current.press) {
        const vis = w / s.ui.pxPerSec;
        if (t > s.ui.scrollT + vis * 0.98 || t < s.ui.scrollT) editor.set({ scrollT: Math.max(0, t - vis * 0.02) });
      }
      invalidate(false);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, audio, invalidate]);

  // ---- helpers ----
  const local = (e: { clientX: number; clientY: number }): { x: number; y: number } => {
    const r = canvasRef.current?.getBoundingClientRect();
    return r ? { x: e.clientX - r.left, y: e.clientY - r.top } : { x: 0, y: 0 };
  };
  const pointerOf = (e: { clientX: number; clientY: number; ctrlKey: boolean; metaKey: boolean; altKey: boolean; shiftKey: boolean }): Pointer => ({ ...local(e), ...modsOf(e) });

  const setCanvasCursor = (c: string) => {
    const el = canvasRef.current;
    if (el && el.style.cursor !== c) el.style.cursor = c;
  };

  const clearDrag = () => {
    const r = rt.current;
    // the compositor showed the draft: hand it the store's project again (a commit already pushed the new one)
    if (r.draft) {
      const p = editor.getState().project;
      if (p) compositorRef.current?.setProject(p);
    }
    if (editor.getState().ui.previewT != null) editor.set({ previewT: null });
    r.press = null;
    r.draft = null;
    r.snapT = null;
    r.badge = null;
    r.marquee = null;
    if (r.autoRaf) cancelAnimationFrame(r.autoRaf);
    r.autoRaf = 0;
  };

  /** run the active gesture for pointer p under the current view */
  const runGesture = useCallback(
    (p: Pointer) => {
      const r = rt.current;
      const pr = r.press;
      if (!pr?.gesture || !pr.env) return;
      const s = editor.getState();
      const sc = rendererRef.current?.scene();
      if (!sc) return;
      const env: GestureEnv = { ...pr.env, ui: { ...pr.env.ui, ripple: s.ui.ripple, autoCrossfade: s.ui.autoCrossfade, snapping: s.ui.snapping }, view: sc.view, rows: sc.rows, scrollY: sc.scrollY, height: sc.height };
      const f = pr.gesture.update(env, p);
      const draftChanged = f.project !== undefined && f.project !== r.draft;
      if (f.project !== undefined) r.draft = f.project === pr.env.base ? null : f.project;
      // live preview of the drag: the compositor paints the draft (and a trim's edge frame)
      if (draftChanged) compositorRef.current?.setProject(r.draft ?? pr.env.base);
      const previewT = f.previewT ?? null;
      if (f.ui || previewT !== (s.ui.previewT ?? null)) editor.set({ ...f.ui, ...(previewT !== (s.ui.previewT ?? null) ? { previewT } : {}) });
      r.snapT = f.snapT;
      r.badge = f.badge ? { x: p.x, y: p.y, text: f.badge } : null;
      r.marquee = pr.gesture.kind === 'marquee' ? { x0: tToX(sc.view, pr.t), y0: RULER_H + pr.laneY - sc.scrollY, x1: p.x, y1: p.y } : null;
      invalidate(draftChanged);
    },
    [invalidate],
  );

  /** edge autoscroll while dragging: scroll, then re-run the gesture at the same pointer */
  const autoScroll = useCallback(() => {
    const r = rt.current;
    r.autoRaf = 0;
    const p = r.last;
    const pr = r.press;
    const w = rendererRef.current?.width ?? 0;
    if (!p || !pr?.moved || !pr.gesture?.autoScroll || w <= 0) return;
    const band = M.autoScrollPx;
    const over = p.x < band ? p.x - band : p.x > w - band ? p.x - (w - band) : 0;
    if (!over) return;
    const { ui } = editor.getState();
    const dxPx = clamp(over, -60, 60) * 0.35;
    editor.set({ scrollT: Math.max(0, ui.scrollT + dxPx / ui.pxPerSec) });
    runGesture(p);
    r.autoRaf = requestAnimationFrame(autoScroll);
  }, [runGesture]);

  // ---- selection on click ----
  const clickSelect = (hit: Extract<Hit, { zone: 'event' }>, mods: Pointer, p: Project) => {
    const { ui } = editor.getState();
    const groups = !ui.ignoreGroups;
    const group = expandGroups(p, [hit.eventId], groups);
    if (mods.ctrl) {
      const on = ui.selection.includes(hit.eventId);
      const next = on ? ui.selection.filter((id) => !group.includes(id)) : [...new Set([...ui.selection, ...group])];
      editor.set({ selection: next, track: hit.trackId });
    } else if (mods.shift && rt.current.anchor) {
      const idx = indexEvents(p);
      const a = idx.get(rt.current.anchor);
      const b = idx.get(hit.eventId);
      if (a && b) {
        const t0 = Math.min(a.ev.start, b.ev.start);
        const t1 = Math.max(a.ev.start + a.ev.length, b.ev.start + b.ev.length);
        const r0 = Math.min(a.ti, b.ti);
        const r1 = Math.max(a.ti, b.ti);
        const ids: string[] = [];
        for (let i = r0; i <= r1; i++) for (const e of p.tracks[i].events) if (e.start < t1 - 1e-9 && e.start + e.length > t0 + 1e-9) ids.push(e.id);
        editor.set({ selection: expandGroups(p, ids, groups), track: hit.trackId });
        return;
      }
    } else {
      editor.set({ selection: group, track: hit.trackId, cursor: Math.max(0, snapToFrame(hit.t, p.fps)) });
    }
    rt.current.anchor = hit.eventId;
  };

  // ---- pointer handlers ----
  const onPointerDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    rootRef.current?.focus({ preventScroll: true });
    if (inline) setInline(null);
    const s = editor.getState();
    const p = s.project;
    const sc = rendererRef.current?.scene();
    if (!p || !sc) return;
    const ptr = pointerOf(e);
    const r = rt.current;
    if (r.press) return;

    if (e.button === 1) {
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      r.press = { pointerId: e.pointerId, button: 1, x: ptr.x, y: ptr.y, hit: { zone: 'empty', t: 0 }, mods: ptr, moved: true, gesture: null, env: null, uiBefore: { cursor: s.ui.cursor, loop: s.ui.loop, selection: s.ui.selection }, t: 0, laneY: 0, pan: { scrollT: s.ui.scrollT, scrollY: r.scrollY } };
      setCanvasCursor('grabbing');
      return;
    }
    if (e.button !== 0) return;

    const hit = hitTest(sc, ptr.x, ptr.y);
    let ids: string[] = [];
    if (hit.zone === 'event') {
      const sel = s.ui.selection;
      const groups = !s.ui.ignoreGroups;
      if (!sel.includes(hit.eventId) && !ptr.ctrl && !ptr.shift) editor.set({ selection: expandGroups(p, [hit.eventId], groups), track: hit.trackId });
      const now = editor.getState().ui.selection;
      ids = now.includes(hit.eventId) ? expandGroups(p, now, groups) : [...new Set([...now, ...expandGroups(p, [hit.eventId], groups)])];
    } else if (hit.zone === 'lane' || hit.zone === 'trackEnv') {
      if (s.ui.track !== hit.trackId) editor.set({ track: hit.trackId });
    }
    const ui = editor.getState().ui;
    const env: GestureEnv = { base: p, ui, view: sc.view, rows: sc.rows, scrollY: sc.scrollY, height: sc.height };
    const gesture = startGesture(hit, env, ptr, ids);
    r.press = {
      pointerId: e.pointerId,
      button: 0,
      x: ptr.x,
      y: ptr.y,
      hit,
      mods: ptr,
      moved: false,
      gesture,
      env,
      uiBefore: { cursor: ui.cursor, loop: ui.loop, selection: ui.selection },
      t: xToT(sc.view, ptr.x),
      laneY: ptr.y - RULER_H + sc.scrollY,
    };
    r.last = ptr;
    e.currentTarget.setPointerCapture(e.pointerId);
    if (gesture) setCanvasCursor(gesture.cursor);
    // scrubbing starts on the press (Vegas moves the cursor immediately)
    if (gesture?.kind === 'scrub') {
      r.press.moved = true;
      runGesture(ptr);
      audio?.scrub(editor.getState().ui.cursor);
    }
    invalidate(false);
  };

  const lastScrub = useRef(0);
  const onPointerMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const r = rt.current;
    const ptr = pointerOf(e);
    const pr = r.press;
    if (pr && pr.pointerId === e.pointerId) {
      r.last = ptr;
      if (pr.pan) {
        const { ui } = editor.getState();
        editor.set({ scrollT: Math.max(0, pr.pan.scrollT - (ptr.x - pr.x) / ui.pxPerSec) });
        setScrollY(clamp(pr.pan.scrollY - (ptr.y - pr.y), 0, maxScrollY));
        return;
      }
      if (!pr.moved) {
        if (Math.hypot(ptr.x - pr.x, ptr.y - pr.y) < M.dragSlop) return;
        pr.moved = true;
      }
      if (!pr.gesture) return;
      runGesture(ptr);
      if (pr.gesture.kind === 'scrub' && audio && performance.now() - lastScrub.current > 45) {
        lastScrub.current = performance.now();
        audio.scrub(editor.getState().ui.cursor);
      }
      if (pr.gesture.autoScroll && !r.autoRaf) r.autoRaf = requestAnimationFrame(autoScroll);
      return;
    }
    if (e.buttons) return;
    // hover: grab zones and cursors
    const sc = rendererRef.current?.scene();
    if (!sc) return;
    const hit = hitTest(sc, ptr.x, ptr.y);
    let locked = false;
    if (hit.zone === 'event') {
      const ref = indexEvents(sc.project).get(hit.eventId);
      locked = !!(ref && (ref.ev.lock || ref.track.lock));
    }
    setCanvasCursor(hoverCursor(hit, ptr, sc.ui.tool, locked));
    if (!sameHit(hit, r.hover)) {
      r.hover = hit;
      invalidate(false);
    }
  };

  const finishPress = (e: ReactPointerEvent<HTMLCanvasElement>, cancelled: boolean) => {
    const r = rt.current;
    const pr = r.press;
    if (!pr || pr.pointerId !== e.pointerId) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
    const s = editor.getState();
    const p = s.project;
    const g = pr.gesture;
    if (pr.pan || !p) {
      clearDrag();
      setCanvasCursor('default');
      invalidate(true);
      return;
    }
    if (cancelled) {
      editor.set(pr.uiBefore);
    } else if (pr.moved && g) {
      const draft = r.draft;
      const base = pr.env?.base;
      if (draft && base && draft !== base) {
        const before = new Set<string>();
        if (g.kind === 'move' && pr.mods.ctrl) for (const t of base.tracks) for (const ev of t.events) before.add(ev.id);
        editor.apply(g.label, (cur) => (cur === base ? draft : cur));
        if (before.size) {
          // ctrl-drag copy: select the copies
          const created: string[] = [];
          for (const t of draft.tracks) for (const ev of t.events) if (!before.has(ev.id)) created.push(ev.id);
          if (created.length) editor.set({ selection: created });
        }
      }
    } else if (!pr.moved) {
      if (g?.commitOnClick && pr.env) {
        const f = g.update(pr.env, pr.mods);
        const base = pr.env.base;
        if (f.project && f.project !== base) editor.apply(g.label, (cur) => (cur === base ? (f.project as Project) : cur));
      } else {
        const hit = pr.hit;
        switch (hit.zone) {
          case 'event':
            if (hit.part === 'fxBtn') emitTimelineCommand({ kind: 'eventFx', eventId: hit.eventId });
            else if (hit.part === 'panCropBtn') emitTimelineCommand({ kind: 'panCrop', eventId: hit.eventId });
            else clickSelect(hit, pr.mods, p);
            break;
          case 'lane':
          case 'empty':
          case 'trackEnv':
            if (!pr.mods.ctrl && !pr.mods.shift) editor.set({ selection: [], cursor: Math.max(0, snapToFrame(hit.t, p.fps)) });
            break;
          case 'marker': {
            const m = p.markers.find((x) => x.id === hit.id);
            if (m) editor.set({ cursor: m.t });
            break;
          }
          case 'region': {
            const rg = p.regions.find((x) => x.id === hit.id);
            if (rg) editor.set({ cursor: hit.part === 'start' ? rg.start : rg.end });
            break;
          }
          default:
            break;
        }
      }
    }
    clearDrag();
    const sc = rendererRef.current?.scene();
    if (sc) {
      const ptr = pointerOf(e);
      r.hover = hitTest(sc, ptr.x, ptr.y);
      setCanvasCursor(hoverCursor(r.hover, ptr, sc.ui.tool, false));
    }
    invalidate(true);
  };

  const onDoubleClick = (e: ReactMouseEvent<HTMLCanvasElement>) => {
    const sc = rendererRef.current?.scene();
    const p = editor.getState().project;
    if (!sc || !p) return;
    const { x, y } = local(e);
    const hit = hitTest(sc, x, y);
    /** Vegas: double-click an envelope's line to add a point there (on the curve, keeping the segment's shape) */
    const addPoint = (target: EnvelopeTarget, keys: readonly Keyframe[], t: number, label: string) => {
      const curve = keys.filter((x) => x.t <= t).at(-1)?.curve;
      editor.apply(label, (q) => addEnvelopePoint(q, target, { t, v: keyValue(keys, t, ENVELOPES[target.env].dflt), ...(curve ? { curve } : {}) }));
    };
    switch (hit.zone) {
      case 'event': {
        const ref = indexEvents(p).get(hit.eventId);
        if (!ref) return;
        if (hit.part === 'fxBtn' || hit.part === 'panCropBtn') return;
        if (hit.part === 'envPoint' && hit.env) {
          const { kind, index } = hit.env;
          const keys = ref.ev.envelopes?.[kind] ?? [];
          if (keys.length <= 1) return; // the last point is the envelope itself: remove it from the menu
          editor.apply('Delete Envelope Point', (q) => deleteEnvelopePoint(q, { scope: 'event', id: hit.eventId, env: kind }, index));
          return;
        }
        if (hit.part === 'envLine' && hit.env) {
          const rel = Math.max(0, Math.min(ref.ev.length, snapToFrame(hit.t, p.fps) - ref.ev.start));
          addPoint({ scope: 'event', id: hit.eventId, env: hit.env.kind }, ref.ev.envelopes?.[hit.env.kind] ?? [], rel, 'Add Envelope Point');
          return;
        }
        editor.set({ loop: { start: ref.ev.start, end: ref.ev.start + ref.ev.length } });
        return;
      }
      case 'trackEnv': {
        const tr = p.tracks.find((x) => x.id === hit.trackId);
        const keys = tr?.envelopes?.[hit.kind] ?? [];
        const target: EnvelopeTarget = { scope: 'track', id: hit.trackId, env: hit.kind };
        if (hit.part === 'point') {
          if (keys.length > 1) editor.apply('Delete Track Envelope Point', (q) => deleteEnvelopePoint(q, target, hit.index));
        } else addPoint(target, keys, Math.max(0, snapToFrame(hit.t, p.fps)), 'Add Track Envelope Point');
        return;
      }
      case 'marker': {
        const m = p.markers.find((x) => x.id === hit.id);
        if (m) setInline({ kind: 'marker', id: m.id, x: tToX(sc.view, m.t), value: m.label });
        return;
      }
      case 'region': {
        const r = p.regions.find((x) => x.id === hit.id);
        if (r) editor.set({ loop: { start: r.start, end: r.end } });
        return;
      }
      case 'loopBar':
        if (hit.part === 'body') editor.set({ looping: !editor.getState().ui.looping });
        return;
      default:
        return;
    }
  };

  // ---- menus ----
  const hooks = useMemo<MenuHooks>(
    () => ({
      rename(kind, id) {
        if (kind === 'track') {
          setRenaming(id);
          return;
        }
        const s = editor.getState();
        const sc = rendererRef.current?.scene();
        if (!s.project || !sc) return;
        if (kind === 'marker') {
          const m = s.project.markers.find((x) => x.id === id);
          if (m) setInline({ kind, id, x: tToX(sc.view, m.t), value: m.label });
        } else {
          const r = s.project.regions.find((x) => x.id === id);
          if (r) setInline({ kind, id, x: tToX(sc.view, r.start), value: r.label });
        }
      },
    }),
    [],
  );

  const openMenuAt = (clientX: number, clientY: number, hit: Hit) => {
    const p = editor.getState().project;
    if (!p) return;
    let items: MenuItem[] = [];
    if (hit.zone === 'event' && hit.part === 'envPoint' && hit.env) {
      items = envelopePointMenu({ scope: 'event', id: hit.eventId, env: hit.env.kind }, hit.env.index);
    } else if (hit.zone === 'trackEnv' && hit.part === 'point') {
      items = envelopePointMenu({ scope: 'track', id: hit.trackId, env: hit.kind }, hit.index);
    } else if (hit.zone === 'event') {
      const { ui } = editor.getState();
      if (!ui.selection.includes(hit.eventId)) editor.set({ selection: expandGroups(p, [hit.eventId], !ui.ignoreGroups), track: hit.trackId });
      items = eventMenu(hit.eventId, hit.t);
    } else if (hit.zone === 'lane' || hit.zone === 'trackEnv') {
      editor.set({ track: hit.trackId });
      items = trackMenu(hit.trackId, hooks);
    } else if (hit.zone === 'empty') {
      items = trackMenu(null, hooks);
    } else {
      items = rulerMenu(hit, hooks);
    }
    if (items.length) setMenu({ x: clientX, y: clientY, items });
  };

  const onContextMenu = (e: ReactMouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (rt.current.press) return;
    const sc = rendererRef.current?.scene();
    if (!sc) return;
    const { x, y } = local(e);
    openMenuAt(e.clientX, e.clientY, hitTest(sc, x, y));
  };

  const onHeaderMenu = useCallback(
    (trackId: string, x: number, y: number) => {
      const items = trackMenu(trackId || null, hooks);
      if (items.length) setMenu({ x, y, items });
    },
    [hooks],
  );

  const onResize = useCallback((trackId: string, h: number | null, commit: boolean) => {
    if (commit && h != null) editor.apply('Track Height', (q) => setTrackHeight(q, trackId, h));
    setHeights((prev) => {
      const next = new Map(prev ?? []);
      if (h == null || commit) next.delete(trackId);
      else next.set(trackId, h);
      return next.size ? next : null;
    });
  }, []);

  const closeMenu = useCallback(() => {
    setMenu(null);
    rootRef.current?.focus({ preventScroll: true });
  }, []);

  // ---- wheel (native, non-passive so it can preventDefault) ----
  const maxScrollYRef = useRef(maxScrollY);
  maxScrollYRef.current = maxScrollY;
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      const scale = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? el.clientHeight : 1;
      const dx = e.deltaX * scale;
      const dy = e.deltaY * scale;
      const s = editor.getState();
      const w = rendererRef.current?.width ?? 0;
      if (!s.project || w <= 0) return;
      e.preventDefault();
      // Vegas's default ("mouse wheel zooms"): a plain wheel zooms and Ctrl/⌘ scrolls; else the other way round
      const zoom = (e.ctrlKey || e.metaKey) !== !!s.ui.wheelZoom && !e.shiftKey;
      if (zoom) {
        const r = canvasRef.current?.getBoundingClientRect();
        const x = r ? clamp(e.clientX - r.left, 0, w) : w / 2;
        const view = { scrollT: s.ui.scrollT, pxPerSec: s.ui.pxPerSec, width: w };
        const lim = zoomLimits(projectDuration(s.project), w, s.project.fps);
        editor.set(zoomAround(view, Math.exp(-dy * 0.0025), xToT(view, x), lim));
        return;
      }
      const horiz = e.shiftKey ? dy || dx : dx;
      const vert = e.shiftKey ? 0 : dy;
      if (horiz) editor.set({ scrollT: Math.max(0, s.ui.scrollT + horiz / s.ui.pxPerSec) });
      if (vert) setScrollY((y) => clamp(y + vert, 0, maxScrollYRef.current));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);
  // ---- keyboard (when the timeline has focus) ----
  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.target !== rootRef.current) return; // inputs inside handle their own keys
    const mod = e.ctrlKey || e.metaKey;
    const r = rt.current;
    if (e.key === 'Escape' && r.press) {
      e.preventDefault();
      e.stopPropagation(); // the drag's Esc, not the editor's "clear the selection"
      const pr = r.press;
      if (canvasRef.current?.hasPointerCapture(pr.pointerId)) canvasRef.current.releasePointerCapture(pr.pointerId);
      editor.set(pr.uiBefore);
      clearDrag();
      setCanvasCursor('default');
      invalidate(true);
      return;
    }
    if (!mod && !e.altKey && (e.key === '+' || e.key === '=' || (e.key === 'ArrowUp' && !e.shiftKey))) {
      e.preventDefault();
      zoomTimeline(1.25);
      return;
    }
    if (!mod && !e.altKey && (e.key === '-' || e.key === '_' || (e.key === 'ArrowDown' && !e.shiftKey))) {
      e.preventDefault();
      zoomTimeline(0.8);
      return;
    }
    if (e.key === 'PageUp' || e.key === 'PageDown') {
      e.preventDefault();
      const p = editor.getState().project;
      if (!p || p.tracks.length === 0) return;
      const i = p.tracks.findIndex((t) => t.id === editor.getState().ui.track);
      const j = clamp((i < 0 ? 0 : i) + (e.key === 'PageUp' ? -1 : 1), 0, p.tracks.length - 1);
      editor.set({ track: p.tracks[j].id });
      const row = layout.rows[j];
      if (row && (row.top < scrollY || row.top + row.height > scrollY + lanesH)) setScrollY(clamp(row.top - 8, 0, maxScrollY));
      return;
    }
    if (e.key === 'ContextMenu' || (e.key === 'F10' && e.shiftKey)) {
      e.preventDefault();
      const s = editor.getState();
      const sc = rendererRef.current?.scene();
      const cr = canvasRef.current?.getBoundingClientRect();
      if (!s.project || !sc || !cr) return;
      const id = s.ui.selection[0];
      const ref = id ? indexEvents(s.project).get(id) : undefined;
      const row = ref ? sc.rows[ref.ti] : undefined;
      if (ref && row) {
        const b = eventBox(sc, row, ref.ev);
        const x = clamp((Math.max(b.x0, 0) + Math.min(b.x1, sc.view.width)) / 2, 0, sc.view.width);
        openMenuAt(cr.left + x, cr.top + b.y + b.h / 2, { zone: 'event', part: 'body', eventId: ref.ev.id, trackId: ref.track.id, row: ref.ti, t: s.ui.cursor });
      } else {
        const items = trackMenu(s.ui.track, hooks);
        if (items.length) setMenu({ x: cr.left + 40, y: cr.top + RULER_H + 10, items });
      }
    }
  };

  // ---- inline marker / region rename ----
  const commitInline = (value: string | null) => {
    const ed = inline;
    setInline(null);
    rootRef.current?.focus({ preventScroll: true });
    if (!ed || value == null || value === ed.value) return;
    if (ed.kind === 'marker') editor.apply('Rename Marker', (q) => updateMarker(q, ed.id, { label: value }));
    else editor.apply('Rename Region', (q) => updateRegion(q, ed.id, { label: value }));
  };

  // ---- drops from the Explorer (../dnd.ts, ./drop.ts) ----
  /** where a drag is over: lanes by hit test; over the header column, the row's track */
  const dropTarget = (e: { clientX: number; clientY: number }): DropTarget | null => {
    const sc = rendererRef.current?.scene();
    if (!sc) return null;
    const { x, y } = local(e);
    if (y < RULER_H) return { t: xToT(sc.view, Math.max(0, x)), trackId: null, eventId: null };
    if (x < 0) {
      const ri = rowAt(sc.rows, y - RULER_H + sc.scrollY);
      return { t: editor.getState().ui.cursor, trackId: ri >= 0 ? sc.rows[ri].track.id : null, eventId: null };
    }
    const hit = hitTest(sc, x, y);
    if (hit.zone === 'event') return { t: hit.t, trackId: hit.trackId, eventId: hit.eventId };
    if (hit.zone === 'lane') return { t: hit.t, trackId: hit.trackId, eventId: null };
    return { t: hit.t, trackId: null, eventId: null };
  };
  const onDragOver = (e: ReactDragEvent<HTMLDivElement>) => {
    const kind = dragKind(Array.from(e.dataTransfer.types));
    if (!kind || !editor.getState().project) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    // a guide at the insert time for media (transitions / FX target a cut or an event, not a time)
    const at = kind === 'media' || kind === 'generator' ? dropTarget(e) : null;
    const t = at && e.clientX >= (canvasRef.current?.getBoundingClientRect().left ?? 0) ? at.t : null;
    if (rt.current.snapT !== t) {
      rt.current.snapT = t;
      invalidate(false);
    }
  };
  const clearDropGuide = () => {
    if (rt.current.snapT !== null && !rt.current.press) {
      rt.current.snapT = null;
      invalidate(false);
    }
  };
  const onDrop = (e: ReactDragEvent<HTMLDivElement>) => {
    const payload = readDrop((type) => e.dataTransfer.getData(type));
    clearDropGuide();
    const s = editor.getState();
    const p = s.project;
    if (!payload || !p) return;
    e.preventDefault();
    const at = dropTarget(e);
    if (!at) return;
    const plan = planDrop(p, payload, at, { selection: s.ui.selection, cursor: s.ui.cursor, loop: s.ui.loop, snapping: s.ui.snapping, ripple: s.ui.ripple, pxPerSec: s.ui.pxPerSec });
    if (!plan.ok) {
      editor.set({ status: plan.status });
      return;
    }
    editor.apply(plan.label, plan.apply);
    if (editor.getState().project === p) {
      editor.set({ status: `${plan.label}: nothing to change there` });
      return;
    }
    editor.set({ ...(plan.select ? { selection: plan.select } : {}), ...(plan.track ? { track: plan.track } : {}) });
    rootRef.current?.focus({ preventScroll: true });
  };

  // ---- scroll bars ----
  const onHScroll = useCallback((v: number) => editor.set({ scrollT: Math.max(0, v) }), []);
  const onHZoom = useCallback(
    (start: number, vis: number) => {
      const w = rendererRef.current?.width ?? 0;
      if (w <= 0 || vis <= 0) return;
      editor.set({ pxPerSec: clamp(w / vis, lim.min, lim.max), scrollT: Math.max(0, start) });
    },
    [lim],
  );

  const hExtent = scrollExtent(duration, visibleT);

  return (
    <div
      ref={rootRef}
      className={`tl-root${focused ? ' is-focused' : ''}`}
      style={{ height: height ?? '100%', ['--tl-header-w' as string]: `${M.headerW}px`, ['--tl-ruler-h' as string]: `${RULER_H}px`, ['--tl-scroll' as string]: `${M.scrollbar}px` }}
      tabIndex={0}
      role="application"
      aria-label="Timeline"
      onKeyDown={onKeyDown}
      onDragOver={onDragOver}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) clearDropGuide();
      }}
      onDrop={onDrop}
      onFocus={(e) => e.target === rootRef.current && setFocused(true)}
      onBlur={(e) => e.target === rootRef.current && setFocused(false)}
    >
      <div className="tl-corner">
        <CursorReadout />
        <ModeReadout />
      </div>
      <div className="tl-head-col">
        {project ? (
          <TrackHeaders project={project} rows={layout.rows} scrollY={scrollY} focusTrack={focusTrack} renaming={renaming} onRename={setRenaming} onMenu={onHeaderMenu} onResize={onResize} />
        ) : null}
      </div>
      <div ref={wrapRef} className="tl-canvas-wrap">
        <canvas
          ref={canvasRef}
          className="tl-canvas"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={(e) => finishPress(e, false)}
          onPointerCancel={(e) => finishPress(e, true)}
          onPointerLeave={() => {
            if (!rt.current.press && rt.current.hover) {
              rt.current.hover = null;
              invalidate(false);
            }
          }}
          onDoubleClick={onDoubleClick}
          onContextMenu={onContextMenu}
        />
        {!project && <div className="tl-empty">No project loaded</div>}
        {inline && (
          <input
            className="tl-inline"
            style={{ left: clamp(inline.x, 0, Math.max(0, size.w - 160)), top: M.loopBar + M.ruler }}
            defaultValue={inline.value}
            autoFocus
            onFocus={(e) => e.currentTarget.select()}
            onBlur={(e) => commitInline(e.currentTarget.value)}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === 'Enter') commitInline(e.currentTarget.value);
              else if (e.key === 'Escape') commitInline(null);
            }}
          />
        )}
      </div>
      <div className="tl-vscroll">
        <ScrollBar orientation="vertical" total={layout.total + M.tailPad} visible={lanesH} value={scrollY} onScroll={(v) => setScrollY(clamp(v, 0, maxScrollY))} />
      </div>
      <div className="tl-zoom">
        <button type="button" title="Zoom out (−)" onClick={() => zoomTimeline(0.8)}>
          −
        </button>
        <button type="button" title="Zoom in (+)" onClick={() => zoomTimeline(1.25)}>
          +
        </button>
        <button type="button" title="Zoom to fit (Ctrl+Shift+F)" onClick={zoomToFit}>
          Fit
        </button>
        <span className="tl-zoom-label">{pxPerSec >= 100 ? `${Math.round(pxPerSec / (project?.fps ?? 24))} px/f` : `${pxPerSec < 10 ? pxPerSec.toFixed(1) : Math.round(pxPerSec)} px/s`}</span>
      </div>
      <div className="tl-hscroll">
        <ScrollBar orientation="horizontal" total={hExtent} visible={visibleT} value={scrollT} onScroll={onHScroll} onZoom={onHZoom} onFit={zoomToFit} />
      </div>
      {menu && <ContextMenu x={menu.x} y={menu.y} items={menu.items} onClose={closeMenu} />}
    </div>
  );
}
