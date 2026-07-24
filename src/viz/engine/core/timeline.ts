import { interpolate } from 'd3';

/**
 * The scrubbability invariant: nothing in the viz suite animates itself.
 * All time lives in one Timeline; `sample(t)` is a pure function of t, so
 * seeking, scrubbing, and replaying are exact. (This is deliberately NOT
 * d3.transition, which is fire-and-forget and cannot seek.)
 *
 * Timelines are also EDITABLE: every keyframe/caption gets a stable id (its
 * creation order, deterministic because scenes are built deterministically),
 * the Motion Studio retimes them via updateKeyframe/updateCaption, and
 * subscribers re-render on `version` bumps. exportOverrides() captures edits
 * as a compact diff that applyOverrides() can replay next session.
 */

export type Ease = (u: number) => number;

export interface ChannelRef<T> {
  readonly key: string;
  /** phantom — carries T for inference; never set */
  readonly __type?: T;
}

export interface CaptionItem {
  id: number;
  text: string;
  tex?: string;
  /** fade envelope 0..1 (in/out over CAPTION_FADE seconds) */
  u: number;
}

export interface SceneState {
  readonly t: number;
  get<T>(ch: ChannelRef<T>): T;
  captions: CaptionItem[];
}

interface Keyframe<T> {
  id: number;
  at: number;
  dur: number;
  to: T;
  ease: Ease;
}

interface Channel<T> {
  initial: T;
  interp: (a: T, b: T) => (u: number) => T;
  keys: Keyframe<T>[];
  /** value at the start of each keyframe (accounts for overlaps); lazily built */
  startValues?: T[];
}

interface Caption {
  id: number;
  at: number;
  dur: number;
  text: string;
  tex?: string;
}

/** Read-only structure for the timeline editor. */
export interface KeyframeInfo {
  id: number;
  at: number;
  dur: number;
  label: string;
}
export interface ChannelInfo {
  key: string;
  keys: KeyframeInfo[];
}
export interface CaptionInfo {
  id: number;
  at: number;
  dur: number;
  text: string;
  tex?: string;
}

export interface TimelineOverrides {
  keyframes?: Record<number, { at?: number; dur?: number }>;
  captions?: Record<number, { at?: number; dur?: number; text?: string }>;
}

export interface NarrationLine {
  id: number;
  at: number;
  text: string;
}

const CAPTION_FADE = 0.35;

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);

function labelOf(v: unknown): string {
  if (typeof v === 'number') return Number.isInteger(v) ? String(v) : v.toFixed(2);
  if (typeof v === 'string') return v;
  try {
    const s = JSON.stringify(v);
    return s.length > 24 ? `${s.slice(0, 21)}…` : s;
  } catch {
    return '·';
  }
}

export class Timeline {
  private channels = new Map<string, Channel<unknown>>();
  private captionList: Caption[] = [];
  private minDuration = 0;
  private nextId = 1;
  private originals = new Map<number, { at: number; dur: number; text?: string }>();
  private listeners = new Set<() => void>();
  private _version = 0;

  get version(): number {
    return this._version;
  }

  /** Notified after any edit (retime, caption change, overrides). */
  subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private bump(): void {
    this._version++;
    this.listeners.forEach((fn) => fn());
  }

  /**
   * Declare a value with its initial state. The default interpolator is
   * d3.interpolate (numbers, colors, arrays, plain objects); pass `interp`
   * for anything it can't handle.
   */
  channel<T>(key: string, initial: T, interp?: (a: T, b: T) => (u: number) => T): ChannelRef<T> {
    if (this.channels.has(key)) throw new Error(`Timeline: duplicate channel "${key}"`);
    this.channels.set(key, {
      initial,
      interp: (interp ??
        ((a: T, b: T) =>
          (interpolate as (x: unknown, y: unknown) => (u: number) => T)(a, b))) as Channel<unknown>['interp'],
      keys: [],
    });
    return { key };
  }

  /** Schedule a change; returns the end time so beats can chain. */
  tween<T>(ch: ChannelRef<T>, to: T, o: { at: number; dur: number; ease?: Ease }): number {
    const c = this.channels.get(ch.key);
    if (!c) throw new Error(`Timeline: unknown channel "${ch.key}"`);
    const id = this.nextId++;
    const dur = Math.max(0, o.dur);
    c.keys.push({ id, at: o.at, dur, to, ease: o.ease ?? ((u) => u) });
    c.keys.sort((a, b) => a.at - b.at || a.dur - b.dur);
    c.startValues = undefined;
    this.originals.set(id, { at: o.at, dur });
    return o.at + o.dur;
  }

  /** Step change (dur 0). */
  set<T>(ch: ChannelRef<T>, to: T, at: number): number {
    return this.tween(ch, to, { at, dur: 0 });
  }

  caption(o: { at: number; dur: number; text: string; tex?: string }): number {
    const id = this.nextId++;
    this.captionList.push({ id, ...o });
    this.originals.set(id, { at: o.at, dur: o.dur, text: o.text });
    return o.at + o.dur;
  }

  /** Stillness — extends the timeline without changing anything. */
  hold(at: number, dur: number): number {
    this.minDuration = Math.max(this.minDuration, at + dur);
    return at + dur;
  }

  get duration(): number {
    let d = this.minDuration;
    for (const c of this.channels.values())
      for (const k of c.keys) d = Math.max(d, k.at + k.dur);
    for (const c of this.captionList) d = Math.max(d, c.at + c.dur);
    return d;
  }

  /** Caption start times — the Player's beat-step targets. */
  get beats(): number[] {
    const set = new Set(this.captionList.map((c) => c.at));
    return [...set].sort((a, b) => a - b);
  }

  // ---------------------------------------------------------------- editing

  /** Read-only structure for the timeline editor UI. */
  describe(): { channels: ChannelInfo[]; captions: CaptionInfo[] } {
    const channels: ChannelInfo[] = [];
    for (const [key, c] of this.channels) {
      if (c.keys.length === 0) continue;
      channels.push({
        key,
        keys: c.keys.map((k) => ({ id: k.id, at: k.at, dur: k.dur, label: labelOf(k.to) })),
      });
    }
    return {
      channels,
      captions: this.captionList.map((c) => ({ ...c })),
    };
  }

  updateKeyframe(id: number, patch: { at?: number; dur?: number }): void {
    for (const c of this.channels.values()) {
      const k = c.keys.find((k) => k.id === id);
      if (!k) continue;
      if (patch.at !== undefined) k.at = Math.max(0, patch.at);
      if (patch.dur !== undefined) k.dur = Math.max(0, patch.dur);
      c.keys.sort((a, b) => a.at - b.at || a.dur - b.dur);
      c.startValues = undefined;
      this.bump();
      return;
    }
  }

  updateCaption(id: number, patch: { at?: number; dur?: number; text?: string }): void {
    const c = this.captionList.find((c) => c.id === id);
    if (!c) return;
    if (patch.at !== undefined) c.at = Math.max(0, patch.at);
    if (patch.dur !== undefined) c.dur = Math.max(0.2, patch.dur);
    if (patch.text !== undefined) c.text = patch.text;
    this.bump();
  }

  /** Compact diff vs the authored scene — persist this, not the whole doc. */
  exportOverrides(): TimelineOverrides {
    const out: Required<TimelineOverrides> = { keyframes: {}, captions: {} };
    for (const c of this.channels.values()) {
      for (const k of c.keys) {
        const o = this.originals.get(k.id);
        if (!o) continue;
        const patch: { at?: number; dur?: number } = {};
        if (k.at !== o.at) patch.at = k.at;
        if (k.dur !== o.dur) patch.dur = k.dur;
        if (Object.keys(patch).length) out.keyframes[k.id] = patch;
      }
    }
    for (const c of this.captionList) {
      const o = this.originals.get(c.id);
      if (!o) continue;
      const patch: { at?: number; dur?: number; text?: string } = {};
      if (c.at !== o.at) patch.at = c.at;
      if (c.dur !== o.dur) patch.dur = c.dur;
      if (o.text !== undefined && c.text !== o.text) patch.text = c.text;
      if (Object.keys(patch).length) out.captions[c.id] = patch;
    }
    return out;
  }

  applyOverrides(o: TimelineOverrides): void {
    for (const [id, patch] of Object.entries(o.keyframes ?? {})) {
      for (const c of this.channels.values()) {
        const k = c.keys.find((k) => k.id === Number(id));
        if (!k) continue;
        if (patch.at !== undefined) k.at = Math.max(0, patch.at);
        if (patch.dur !== undefined) k.dur = Math.max(0, patch.dur);
        c.keys.sort((a, b) => a.at - b.at || a.dur - b.dur);
        c.startValues = undefined;
        break;
      }
    }
    for (const [id, patch] of Object.entries(o.captions ?? {})) {
      const c = this.captionList.find((c) => c.id === Number(id));
      if (!c) continue;
      if (patch.at !== undefined) c.at = Math.max(0, patch.at);
      if (patch.dur !== undefined) c.dur = Math.max(0.2, patch.dur);
      if (patch.text !== undefined) c.text = patch.text;
    }
    this.bump();
  }

  /** Discard all edits, back to the authored scene. */
  resetOverrides(): void {
    for (const c of this.channels.values()) {
      for (const k of c.keys) {
        const o = this.originals.get(k.id);
        if (!o) continue;
        k.at = o.at;
        k.dur = o.dur;
      }
      c.keys.sort((a, b) => a.at - b.at || a.dur - b.dur);
      c.startValues = undefined;
    }
    for (const c of this.captionList) {
      const o = this.originals.get(c.id);
      if (!o) continue;
      c.at = o.at;
      c.dur = o.dur;
      if (o.text !== undefined) c.text = o.text;
    }
    this.bump();
  }

  /** The narration script (ordered captions) — input to the publish step. */
  exportNarration(): NarrationLine[] {
    return [...this.captionList]
      .sort((a, b) => a.at - b.at)
      .map((c) => ({ id: c.id, at: c.at, text: c.text }));
  }

  // --------------------------------------------------------------- sampling

  /** PURE: the complete visual state at time t. Channels are sampled lazily. */
  sample(t: number): SceneState {
    const time = Math.max(0, Math.min(t, this.duration));
    const channels = this.channels;
    const cache = new Map<string, unknown>();

    const captions: CaptionItem[] = [];
    for (const c of this.captionList) {
      if (time < c.at || time > c.at + c.dur) continue;
      const u = clamp01(Math.min((time - c.at) / CAPTION_FADE, (c.at + c.dur - time) / CAPTION_FADE, 1));
      captions.push({ id: c.id, text: c.text, tex: c.tex, u });
    }

    const valueAt = (c: Channel<unknown>, startValues: unknown[], at: number): unknown => {
      let v = c.initial;
      for (let i = 0; i < c.keys.length; i++) {
        const k = c.keys[i];
        if (at <= k.at) break;
        const u = k.dur === 0 ? 1 : clamp01((at - k.at) / k.dur);
        if (u >= 1) {
          v = k.to;
        } else {
          v = c.interp(startValues[i] ?? v, k.to)(k.ease(u));
          break;
        }
      }
      return v;
    };

    const sampleChannel = (key: string): unknown => {
      const c = channels.get(key);
      if (!c) throw new Error(`Timeline: unknown channel "${key}"`);
      if (!c.startValues) {
        // value at the start of each keyframe, honouring mid-flight overlaps
        const sv: unknown[] = [];
        for (let i = 0; i < c.keys.length; i++) {
          sv.push(valueAt(c, sv, c.keys[i].at));
        }
        c.startValues = sv;
      }
      return valueAt(c, c.startValues, time);
    };

    return {
      t: time,
      captions,
      get<T>(ch: ChannelRef<T>): T {
        if (!cache.has(ch.key)) cache.set(ch.key, sampleChannel(ch.key));
        return cache.get(ch.key) as T;
      },
    };
  }
}

/** Start times for n items entering as a group (40–80ms apart reads best). */
export function stagger(
  n: number,
  o: { at: number; each?: number; dur: number; ease?: Ease },
): Array<{ at: number; dur: number; ease?: Ease }> {
  const each = o.each ?? 0.06;
  return Array.from({ length: n }, (_, i) => ({ at: o.at + i * each, dur: o.dur, ease: o.ease }));
}
