/**
 * Timeline edits — the few Project → Project transforms that are specific to timeline GESTURES, layered on the
 * model's operations (editor/model/ops.ts, which every plain command uses directly).
 *
 *   moveRange(p, ids, trackDelta)                              legal dt floor + the trackDelta a drag can reach
 *   dragMove(p, {ids, dt, trackDelta, copy?, ripple, autoCrossfade})   drag / ctrl-drag copy + auto-crossfade
 *   trimRange(p, ids, edge, ripple)                            legal dt range for trimming several events at once
 *   dragTrim(p, {ids, edge, dt, ripple, autoCrossfade})        the same edge of every selected event, + crossfades
 *   crossfadeFixup(before, after, touched, autoCrossfade)      Vegas auto-crossfade after a move/trim
 *   duplicateTrack(p, id)                                      -> { project, id }  (Track menu)
 *
 * Auto-crossfade (Vegas): an AUDIO overlap made by a gesture sets the pair's fades to the overlap, and a pair pulled
 * apart drops the crossfade fades it had. A VIDEO overlap is itself the transition (the compositor runs the later
 * event's `transition.kind` across it), so only the kind is touched: 'cut' for a new overlap when auto-crossfade is
 * off, back to the default crossfade when it is on. Locked events never change.
 *
 * Pure (no DOM); imported by the node tests.
 */
import type { EditEvent, Project, Track } from '../../model/types';
import { eventEnd } from '../../model/types.ts';
import { projectIds, uniqueId } from '../../model/id.ts';
import { EPS, MIN_EVENT_LEN, expandGroups, findEvent, isEditable, moveEvents, sourceLimits, trimEnd, trimStart, type RippleMode } from '../../model/ops.ts';

export type Edge = 'start' | 'end';

/** where an event lives (built once per gesture for O(1) lookups) */
export interface EventRef {
  ti: number;
  track: Track;
  ev: EditEvent;
}

export function indexEvents(p: Project): Map<string, EventRef> {
  const m = new Map<string, EventRef>();
  p.tracks.forEach((track, ti) => {
    for (const ev of track.events) m.set(ev.id, { ti, track, ev });
  });
  return m;
}

/** the shortest an event may become through a timeline drag: one frame */
export const minLength = (p: Project): number => Math.max(MIN_EVENT_LEN, 1 / (p.fps || 24));

/** present, unlocked events among ids (each once) */
function editable(p: Project, ids: readonly string[]): EventRef[] {
  const idx = indexEvents(p);
  const seen = new Set<string>();
  const out: EventRef[] = [];
  for (const id of ids) {
    const r = idx.get(id);
    if (!r || seen.has(id) || !isEditable(r.track, r.ev)) continue;
    seen.add(id);
    out.push(r);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Auto-crossfade
// ---------------------------------------------------------------------------
interface Span {
  track: string;
  start: number;
  end: number;
}

function spans(p: Project): Map<string, Span> {
  const m = new Map<string, Span>();
  for (const tr of p.tracks) for (const e of tr.events) m.set(e.id, { track: tr.id, start: e.start, end: eventEnd(e) });
  return m;
}

const overlapOf = (a: Span | undefined, b: Span | undefined): number =>
  a && b && a.track === b.track ? Math.min(a.end, b.end) - Math.max(a.start, b.start) : 0;

/** overlapping pairs (earlier, later, overlap) on a track where at least one event is in `touched` */
function overlappingPairs(tr: Track, touched: ReadonlySet<string>): [EditEvent, EditEvent, number][] {
  const out: [EditEvent, EditEvent, number][] = [];
  const ev = tr.events;
  for (let i = 0; i < ev.length; i++) {
    const a = ev[i];
    const aEnd = eventEnd(a);
    for (let j = i + 1; j < ev.length && ev[j].start < aEnd - EPS; j++) {
      const b = ev[j];
      if (touched.has(a.id) || touched.has(b.id)) out.push([a, b, Math.min(aEnd, eventEnd(b)) - b.start]);
    }
  }
  return out;
}

/** fades never cross: each ≤ length, together ≤ length (the fade-out yields first) */
function clampFades(e: EditEvent): EditEvent {
  const fi = Math.max(0, Math.min(e.fadeIn.len, e.length));
  const fo = Math.max(0, Math.min(e.fadeOut.len, e.length - fi));
  if (fi === e.fadeIn.len && fo === e.fadeOut.len) return e;
  return { ...e, fadeIn: { ...e.fadeIn, len: fi }, fadeOut: { ...e.fadeOut, len: fo } };
}

/**
 * Re-derive the crossfades around `touched` events after a gesture (see the header for the rules).
 * `before` is the project at press time, so separations and new overlaps can be told apart.
 */
export function crossfadeFixup(before: Project, after: Project, touched: ReadonlySet<string>, autoCrossfade: boolean): Project {
  if (touched.size === 0 || after === before) return after;
  const was = spans(before);
  const now = spans(after);
  const patch = new Map<string, EditEvent>();
  const cur = (e: EditEvent) => patch.get(e.id) ?? e;

  for (const tr of after.tracks) {
    for (const [a0, b0, ov] of overlappingPairs(tr, touched)) {
      const a = cur(a0);
      const b = cur(b0);
      if (tr.kind === 'audio') {
        if (!autoCrossfade) continue;
        if (isEditable(tr, a)) patch.set(a.id, { ...a, fadeOut: { ...a.fadeOut, len: ov } });
        if (isEditable(tr, b)) patch.set(b.id, { ...b, fadeIn: { ...b.fadeIn, len: ov } });
      } else if (!isEditable(tr, b)) {
        continue;
      } else if (!autoCrossfade && overlapOf(was.get(a.id), was.get(b.id)) <= EPS) {
        patch.set(b.id, { ...b, transition: { kind: 'cut' } });
      } else if (autoCrossfade && b.transition?.kind === 'cut') {
        const { transition: _cut, ...rest } = b;
        patch.set(b.id, rest);
      }
    }
  }

  // audio pairs pulled apart: drop the crossfade fades they had
  for (const tr of before.tracks) {
    if (tr.kind !== 'audio') continue;
    for (const [a0, b0, ov0] of overlappingPairs(tr, touched)) {
      if (overlapOf(now.get(a0.id), now.get(b0.id)) > EPS) continue;
      for (const [id, which] of [
        [a0.id, 'fadeOut'],
        [b0.id, 'fadeIn'],
      ] as const) {
        const ref = findEvent(after, id);
        const e = patch.get(id) ?? ref?.event;
        if (ref && e && isEditable(ref.track, e) && Math.abs(e[which].len - ov0) < 1e-3) patch.set(id, { ...e, [which]: { ...e[which], len: 0 } });
      }
    }
  }
  if (patch.size === 0) return after;
  return {
    ...after,
    tracks: after.tracks.map((tr) => (tr.events.some((e) => patch.has(e.id)) ? { ...tr, events: tr.events.map((e) => clampFades(patch.get(e.id) ?? e)) } : tr)),
  };
}

// ---------------------------------------------------------------------------
// Move
// ---------------------------------------------------------------------------
/**
 * The legal move for a selection (groups included): dt ≥ −(earliest start), and the largest |trackDelta| ≤ the
 * requested one for which every event lands on an unlocked track of its own kind (ops.moveEvents refuses the
 * whole move otherwise, so a drag clamps first).
 */
export function moveRange(p: Project, ids: readonly string[], trackDelta: number, groups = true): { minDt: number; trackDelta: number } {
  const refs = editable(p, expandGroups(p, ids, groups));
  let minStart = Infinity;
  for (const r of refs) minStart = Math.min(minStart, r.ev.start);
  const ok = (d: number) =>
    refs.every((r) => {
      const t = p.tracks[r.ti + d];
      return !!t && t.kind === r.track.kind && !t.lock;
    });
  let d = Math.round(trackDelta);
  while (d !== 0 && !ok(d)) d += d > 0 ? -1 : 1;
  return { minDt: Number.isFinite(minStart) ? -minStart : 0, trackDelta: d };
}

export interface DragMoveOpts {
  ids: readonly string[];
  dt: number;
  trackDelta: number;
  /** ctrl-drag: drop copies (fresh ids and groups), leave the originals */
  copy?: boolean;
  ripple: RippleMode;
  autoCrossfade: boolean;
  /** false: Ignore Event Grouping (only the ids move) */
  groups?: boolean;
}

/** copies of events placed dt later and trackDelta rows down; returns the project and the new ids */
function copyEvents(p: Project, refs: readonly EventRef[], dt: number, trackDelta: number): { project: Project; created: string[] } {
  const taken = projectIds(p);
  const groups = new Map<string, string>();
  const adds = new Map<number, EditEvent[]>();
  const created: string[] = [];
  for (const r of refs) {
    const ev: EditEvent = { ...r.ev, id: uniqueId('e', taken), start: Math.max(0, r.ev.start + dt) };
    if (r.ev.group) {
      let g = groups.get(r.ev.group);
      if (!g) groups.set(r.ev.group, (g = uniqueId('g', taken)));
      ev.group = g;
    }
    created.push(ev.id);
    const ti = r.ti + trackDelta;
    adds.set(ti, [...(adds.get(ti) ?? []), ev]);
  }
  const project: Project = {
    ...p,
    tracks: p.tracks.map((tr, ti) => {
      const a = adds.get(ti);
      return a ? { ...tr, events: [...tr.events, ...a].sort((x, y) => x.start - y.start || (x.id < y.id ? -1 : 1)) } : tr;
    }),
  };
  return { project, created };
}

/** a drag move (ops.moveEvents, or copies for ctrl-drag) followed by the auto-crossfade fix-up */
export function dragMove(p: Project, o: DragMoveOpts): Project {
  const groups = o.groups !== false;
  const ids = expandGroups(p, o.ids, groups);
  const range = moveRange(p, ids, o.trackDelta, groups);
  const dt = Math.max(o.dt, range.minDt);
  if (o.copy) {
    const { project, created } = copyEvents(p, editable(p, ids), dt, range.trackDelta);
    return crossfadeFixup(p, project, new Set(created), o.autoCrossfade);
  }
  const next = moveEvents(p, ids, dt, { trackDelta: range.trackDelta, ripple: o.ripple, groups });
  return crossfadeFixup(p, next, new Set(ids), o.autoCrossfade);
}

// ---------------------------------------------------------------------------
// Trim
// ---------------------------------------------------------------------------
/**
 * Legal dt for moving `edge` of every event in ids by the same amount: each keeps ≥ 1 frame, files stay inside
 * their source, and (without ripple, where the head really moves) nothing starts before 0.
 */
export function trimRange(p: Project, ids: readonly string[], edge: Edge, ripple: RippleMode): [number, number] {
  let lo = -Infinity;
  let hi = Infinity;
  const minLen = minLength(p);
  for (const { ev: e } of editable(p, ids)) {
    const lim = sourceLimits(p.media[e.mediaId]);
    const rate = e.rate || 1;
    if (edge === 'end') {
      lo = Math.max(lo, minLen - e.length);
      hi = Math.min(hi, (lim.max - e.srcIn) / rate - e.length);
    } else {
      hi = Math.min(hi, e.length - minLen);
      lo = Math.max(lo, (lim.min - e.srcIn) / rate);
      if (ripple === 'off') lo = Math.max(lo, -e.start);
    }
  }
  return lo > hi ? [0, 0] : [lo, hi];
}

export interface DragTrimOpts {
  ids: readonly string[];
  edge: Edge;
  /** seconds the edge moves (clamped to trimRange) */
  dt: number;
  ripple: RippleMode;
  autoCrossfade: boolean;
}

/**
 * Trim the same edge of several events by dt (Vegas trims every selected event together). Each event goes
 * through ops.trimStart / ops.trimEnd at its CURRENT position, so ripple from an earlier one is accounted for.
 */
export function dragTrim(p: Project, o: DragTrimOpts): Project {
  const refs = editable(p, o.ids);
  if (refs.length === 0) return p;
  const [lo, hi] = trimRange(p, o.ids, o.edge, o.ripple);
  const dt = Math.max(lo, Math.min(hi, o.dt));
  if (Math.abs(dt) < EPS) return p;
  // earliest first, so a ripple never moves an event before its own trim reads it
  const order = refs.slice().sort((a, b) => a.ev.start - b.ev.start);
  let out = p;
  for (const r of order) {
    const now = findEvent(out, r.ev.id)?.event;
    if (!now) continue;
    out = o.edge === 'end' ? trimEnd(out, now.id, eventEnd(now) + dt, { ripple: o.ripple }) : trimStart(out, now.id, now.start + dt, { ripple: o.ripple });
  }
  return crossfadeFixup(p, out, new Set(refs.map((r) => r.ev.id)), o.autoCrossfade);
}

// ---------------------------------------------------------------------------
// Tracks
// ---------------------------------------------------------------------------
/** copy a track (events with fresh ids and fresh groups) directly below it; solo is not copied */
export function duplicateTrack(p: Project, id: string): { project: Project; id: string } {
  const at = p.tracks.findIndex((t) => t.id === id);
  if (at < 0) return { project: p, id };
  const src = p.tracks[at];
  const taken = projectIds(p);
  const groups = new Map<string, string>();
  const nid = uniqueId(src.kind === 'video' ? 'tv' : 'ta', taken);
  const copy: Track = {
    ...src,
    id: nid,
    name: `${src.name} (copy)`,
    solo: false,
    events: src.events.map((e) => {
      const n: EditEvent = { ...e, id: uniqueId('e', taken) };
      if (e.group) {
        let g = groups.get(e.group);
        if (!g) groups.set(e.group, (g = uniqueId('g', taken)));
        n.group = g;
      }
      return n;
    }),
  };
  const tracks = p.tracks.slice();
  tracks.splice(at + 1, 0, copy);
  return { project: { ...p, tracks }, id: nid };
}
