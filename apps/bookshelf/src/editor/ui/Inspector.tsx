/**
 * Inspector: the properties of the selected event, the focused track, or the project (Vegas's Event Properties,
 * Track FX and Project Properties folded into one docked panel).
 *
 *   <Inspector onPanCrop={…} request={{ tab: 'event', nonce }} />
 *
 * Every edit is one `editor.apply(label, p => op(p, …), { coalesce })` over the model's ops (model/ops.ts), so locks,
 * source limits, clamping and keyframe rebasing behave exactly as on the timeline; typing or scrubbing a field
 * coalesces into a single undo step per field and target. Numeric fields scrub (drag the label: Shift ×0.1, Ctrl/⌘ ×10), step with
 * ↑/↓, commit on Enter or blur and revert on Esc.
 *
 * FX parameters are keyframable: the ◆ button keys the value at the cursor (event-relative time for event FX,
 * timeline time for track FX, as types.ts defines); once keyed, editing the value writes the key at the cursor.
 *
 * Also exports the small field kit (NumField, Row, Section, Select) the shell's dialogs share, and the FX metadata
 * (VIDEO_FX_UI) the Explorer lists.
 */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { FONT } from '../../viz/film/silhouette/type';
import { AUDIO_FX_PARAMS, type AudioFxParamSpec } from '../engine/audio';
import { sampleValue } from '../engine/pancrop';
import { TRANSITIONS_UI } from '../engine/transitions';
import {
  GAIN_MAX_DB,
  RATE_MAX,
  RATE_MIN,
  addAudioFx,
  addVideoFx,
  findEvent,
  moveEvents,
  moveFx,
  previousNeighbour,
  removeFx,
  resetPanCrop,
  setAudioFxParam,
  setEventGain,
  setEventOpacity,
  setEventProps,
  setEventText,
  setFade,
  setFxEnabled,
  setRate,
  setTrackDuck,
  setTrackProps,
  setTransition,
  setVideoFxValue,
  slipEvents,
  trimEnd,
  updateMedia,
  type EventPropsPatch,
  type FxTarget,
  type TrackPatch,
} from '../model/ops';
import type { AudioFx, AudioFxKind, BlendMode, EditEvent, Fade, FadeCurve, Keyframe, Project, TextSpec, Track, TransitionKind, VideoFx, VideoFxKind } from '../model/types';
import { eventEnd } from '../model/types';
import { editor, useEditor } from '../state/store';
import { keyLabel } from './shortcuts';
import { KIND_COLOR, clamp, fmtDb, parseTimecode, timecode } from './theme';

// ===========================================================================
// edits (each one undoable, coalesced per target and field)
// ===========================================================================
const apply = (label: string, fn: (p: Project) => Project, coalesce: string) => editor.apply(label, fn, { coalesce });
const evProps = (id: string, label: string, patch: EventPropsPatch) => apply(label, (p) => setEventProps(p, id, patch), `ev:${id}:${Object.keys(patch).join()}`);
const trProps = (id: string, label: string, patch: TrackPatch) => apply(label, (p) => setTrackProps(p, id, patch), `tr:${id}:${Object.keys(patch).join()}`);
const editProject = (label: string, fn: (p: Project) => Project) => apply(label, fn, `pr:${label}`);
const ripple = () => editor.getState().ui.ripple;

// ===========================================================================
// field kit
// ===========================================================================
export function Section(props: { title: string; actions?: ReactNode; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(props.defaultOpen ?? true);
  return (
    <section className="fe-sec">
      <div className="fe-sec-head">
        <button
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          style={{ border: 0, background: 'transparent', color: 'inherit', font: 'inherit', textTransform: 'inherit', letterSpacing: 'inherit', padding: 0, cursor: 'default' }}
        >
          {open ? '▾' : '▸'} {props.title}
        </button>
        {props.actions && <span className="fe-sec-actions">{props.actions}</span>}
      </div>
      {open && <div className="fe-sec-body">{props.children}</div>}
    </section>
  );
}

export function Row(props: { label: ReactNode; children: ReactNode; htmlFor?: string; title?: string }) {
  return (
    <div className="fe-row" title={props.title}>
      <label className="fe-label" htmlFor={props.htmlFor}>
        {props.label}
      </label>
      <div className="fe-inline">{props.children}</div>
    </div>
  );
}

export interface NumFieldProps {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  /** step for ↑/↓ and for one pixel of label scrubbing ×(range/200 when larger) */
  step?: number;
  digits?: number;
  unit?: string;
  /** custom display / parse (timecode fields) */
  format?: (v: number) => string;
  parse?: (s: string) => number | null;
  /** a scrub label rendered before the input */
  label?: string;
  title?: string;
  disabled?: boolean;
  width?: number | string;
  ariaLabel?: string;
}

/** numeric text field: type + Enter, ↑/↓ steps, drag the label to scrub */
export function NumField(props: NumFieldProps) {
  const { value, onChange, min = -Infinity, max = Infinity, step = 1, digits = 2, unit } = props;
  const [draft, setDraft] = useState<string | null>(null);
  const fmt = props.format ?? ((v: number) => (Number.isFinite(v) ? v.toFixed(digits) : '∞'));
  const parse = props.parse ?? ((s: string) => {
    const n = Number(s.replace(/[^\d.eE+-]/g, ''));
    return s.trim() && Number.isFinite(n) ? n : null;
  });
  const set = (v: number) => onChange(clamp(v, min, max));
  const commit = () => {
    if (draft == null) return;
    const v = parse(draft);
    if (v != null && v !== value) set(v);
    setDraft(null);
  };
  const scrub = (e: React.PointerEvent<HTMLSpanElement>) => {
    if (props.disabled || e.button !== 0) return;
    e.preventDefault();
    const x0 = e.clientX;
    const v0 = value;
    const el = e.currentTarget;
    el.setPointerCapture(e.pointerId);
    const move = (ev: PointerEvent) => {
      const k = ev.shiftKey ? 0.1 : ev.ctrlKey || ev.metaKey ? 10 : 1;
      set(+(v0 + (ev.clientX - x0) * step * k).toFixed(Math.max(digits, 3)));
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
  return (
    <>
      {props.label && (
        <span className="fe-label is-scrub" onPointerDown={scrub} title="Drag to adjust (Shift: fine, Ctrl/⌘: coarse)">
          {props.label}
        </span>
      )}
      <input
        className="fe-input is-num"
        style={props.width != null ? { width: props.width, flex: 'none' } : undefined}
        aria-label={props.ariaLabel ?? props.label}
        title={props.title}
        disabled={props.disabled}
        value={draft ?? `${fmt(value)}${unit && draft == null ? ` ${unit}` : ''}`}
        spellCheck={false}
        onFocus={(e) => {
          setDraft(fmt(value));
          requestAnimationFrame(() => e.target.select());
        }}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            commit();
            e.currentTarget.blur();
          } else if (e.key === 'Escape') {
            setDraft(null);
            e.currentTarget.blur();
          } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault();
            const d = (e.key === 'ArrowUp' ? 1 : -1) * step * (e.shiftKey ? 10 : 1);
            const nv = clamp(+(value + d).toFixed(6), min, max);
            set(nv);
            setDraft(fmt(nv));
          }
        }}
      />
    </>
  );
}

/** a timecode field (HH:MM:SS;FF; also accepts seconds and 'NNNf') */
function TimeField(props: { value: number; onChange: (v: number) => void; fps: number; min?: number; ariaLabel?: string }) {
  return (
    <NumField
      value={props.value}
      onChange={props.onChange}
      min={props.min ?? 0}
      step={1 / props.fps}
      format={(v) => timecode(v, props.fps)}
      parse={(s) => parseTimecode(s, props.fps)}
      ariaLabel={props.ariaLabel}
    />
  );
}

export function Select<T extends string>(props: { value: T; options: readonly (T | { value: T; label: string })[]; onChange: (v: T) => void; ariaLabel?: string; disabled?: boolean; id?: string }) {
  return (
    <select id={props.id} className="fe-select" value={props.value} aria-label={props.ariaLabel} disabled={props.disabled} onChange={(e) => props.onChange(e.target.value as T)}>
      {props.options.map((o) => {
        const v = typeof o === 'string' ? o : o.value;
        return (
          <option key={v} value={v}>
            {typeof o === 'string' ? o : o.label}
          </option>
        );
      })}
    </select>
  );
}

function Check(props: { checked: boolean; onChange: (v: boolean) => void; children: ReactNode; title?: string }) {
  return (
    <label className="fe-check" title={props.title}>
      <input type="checkbox" checked={props.checked} onChange={(e) => props.onChange(e.target.checked)} />
      {props.children}
    </label>
  );
}

function TextInput(props: { value: string; onChange: (v: string) => void; ariaLabel?: string; id?: string; placeholder?: string }) {
  return <input id={props.id} className="fe-input" value={props.value} aria-label={props.ariaLabel} placeholder={props.placeholder} onChange={(e) => props.onChange(e.target.value)} spellCheck={false} />;
}

/** a range slider + numeric field pair; `log` makes the slider logarithmic (frequencies), the field stays linear */
function Slider(props: { value: number; onChange: (v: number) => void; min: number; max: number; step: number; digits?: number; unit?: string; ariaLabel: string; format?: (v: number) => string; log?: boolean }) {
  const { min, max } = props;
  const lg = props.log && min > 0;
  const toPos = (v: number) => (lg ? (Math.log(v / min) / Math.log(max / min)) * 1000 : v);
  const fromPos = (x: number) => (lg ? +(min * Math.pow(max / min, x / 1000)).toPrecision(4) : x);
  return (
    <>
      <input
        className="fe-range"
        type="range"
        min={lg ? 0 : min}
        max={lg ? 1000 : max}
        step={lg ? 1 : props.step}
        value={toPos(clamp(props.value, min, max))}
        aria-label={props.ariaLabel}
        aria-valuetext={`${props.value.toFixed(props.digits ?? 2)}${props.unit ? ` ${props.unit}` : ''}`}
        onChange={(e) => props.onChange(fromPos(Number(e.target.value)))}
      />
      <NumField value={props.value} onChange={props.onChange} min={min} max={max} step={props.step} digits={props.digits} unit={props.unit} format={props.format} width={78} ariaLabel={props.ariaLabel} />
    </>
  );
}

// ===========================================================================
// FX metadata
// ===========================================================================
interface ParamUi {
  min: number;
  max: number;
  step: number;
  unit?: string;
  digits?: number;
}
/** slider ranges for the video FX (engine/fx.ts documents the value semantics; new FX start at ops VIDEO_FX_DEFAULT).
 *  Audio FX parameters come from the audio engine's own table (AUDIO_FX_PARAMS). */
export const VIDEO_FX_UI: Record<VideoFxKind, ParamUi & { label: string; desc: string }> = {
  brightness: { label: 'Brightness', desc: 'Lift or lower the exposure', min: -1, max: 1, step: 0.01 },
  contrast: { label: 'Contrast', desc: '1 = unchanged', min: 0, max: 3, step: 0.01 },
  saturation: { label: 'Saturation', desc: '1 = unchanged, 0 = monochrome', min: 0, max: 3, step: 0.01 },
  hue: { label: 'Hue shift', desc: 'Rotate every hue', min: -180, max: 180, step: 1, unit: '°', digits: 0 },
  blur: { label: 'Blur', desc: 'Gaussian blur, px at 1080p', min: 0, max: 60, step: 0.1, unit: 'px', digits: 1 },
  sepia: { label: 'Sepia', desc: 'Warm archival tone', min: 0, max: 1, step: 0.01 },
  grayscale: { label: 'Grayscale', desc: 'Remove colour', min: 0, max: 1, step: 0.01 },
  invert: { label: 'Invert', desc: 'Negative image', min: 0, max: 1, step: 0.01 },
  vignette: { label: 'Vignette', desc: 'Darken the edges', min: 0, max: 1, step: 0.01 },
  filmFinish: { label: 'Film finish', desc: "The film kit's grain, flicker, bloom and halation", min: 0, max: 1, step: 0.01 },
};
export const VIDEO_FX_KINDS = Object.keys(VIDEO_FX_UI) as VideoFxKind[];

const AUDIO_FX_LABEL: Record<AudioFxKind, string> = {
  eq3: '3-band EQ',
  compressor: 'Compressor',
  highpass: 'High-pass',
  lowpass: 'Low-pass',
  reverb: 'Reverb',
  delay: 'Delay',
};
export const AUDIO_FX_KINDS = Object.keys(AUDIO_FX_LABEL) as AudioFxKind[];

/** an audio FX's parameter defaults, from the engine's table (engine/audio.ts AUDIO_FX_PARAMS) */
export function audioFxDefaults(kind: AudioFxKind): Record<string, number> {
  const out: Record<string, number> = {};
  for (const spec of AUDIO_FX_PARAMS[kind]) out[spec.key] = spec.default;
  return out;
}

/** slider resolution and display digits for an engine parameter spec */
function paramUi(spec: AudioFxParamSpec): { step: number; digits: number; unit?: string } {
  const range = spec.max - spec.min;
  const step = spec.log ? 1 : range <= 1.5 ? 0.001 : range <= 30 ? 0.01 : range <= 100 ? 0.1 : 1;
  const digits = spec.unit === 'Hz' ? 0 : step >= 1 ? 0 : step >= 0.1 ? 1 : step >= 0.01 ? 2 : 3;
  return { step, digits, unit: spec.unit || undefined };
}

const KEY_EPS = 1 / 240;

/** set the value at `t`: a constant stays constant; keyframes get a key at t (replacing one within half a frame) */
function setValueAt(value: number | Keyframe[], t: number, v: number): number | Keyframe[] {
  if (typeof value === 'number') return v;
  const keys = value.filter((k) => Math.abs(k.t - t) > KEY_EPS);
  const at = value.find((k) => Math.abs(k.t - t) <= KEY_EPS);
  keys.push({ t: at ? at.t : t, v, curve: at?.curve ?? 'linear' });
  return keys.sort((a, b) => a.t - b.t);
}

/** toggle a key at t: constant → one key; on a key → remove it (the last key turns back into a constant) */
function toggleKeyAt(value: number | Keyframe[], t: number): number | Keyframe[] {
  if (typeof value === 'number') return [{ t, v: value, curve: 'linear' }];
  const on = value.find((k) => Math.abs(k.t - t) <= KEY_EPS);
  if (!on) return setValueAt(value, t, sampleValue(value, t));
  const rest = value.filter((k) => k !== on);
  return rest.length ? rest : on.v;
}

// ===========================================================================
// the panel
// ===========================================================================
export type InspectorTab = 'event' | 'track' | 'project';

export interface InspectorProps {
  onPanCrop: () => void;
  /** show a tab on request (the timeline's "Properties…" / "FX…" items); `nonce` repeats a request */
  request?: { tab: InspectorTab; nonce: number } | null;
}

export default function Inspector(props: InspectorProps) {
  const project = useEditor((s) => s.project);
  const selection = useEditor((s) => s.ui.selection);
  const focusTrack = useEditor((s) => s.ui.track);
  const [tab, setTab] = useState<InspectorTab>('project');
  useEffect(() => {
    if (props.request) setTab(props.request.tab);
  }, [props.request]);

  // follow the user's focus: selecting events shows the event, focusing a track (with nothing selected) the track
  const prevSel = useRef(selection);
  const prevTrack = useRef(focusTrack);
  useEffect(() => {
    if (selection !== prevSel.current && selection.length) setTab('event');
    else if (focusTrack !== prevTrack.current && focusTrack && !selection.length) setTab('track');
    prevSel.current = selection;
    prevTrack.current = focusTrack;
  }, [selection, focusTrack]);

  if (!project) return <section className="fe-panel" aria-label="Inspector" />;
  const hits = selection.map((id) => findEvent(project, id)).filter((h): h is NonNullable<typeof h> => h != null);
  const track = project.tracks.find((t) => t.id === focusTrack) ?? hits[0]?.track ?? null;

  return (
    <section className="fe-panel" aria-label="Inspector">
      <div className="fe-tabs" role="tablist">
        {(['event', 'track', 'project'] as const).map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} className={`fe-tab${tab === t ? ' is-active' : ''}`} onClick={() => setTab(t)}>
            {t === 'event' ? `Event${hits.length > 1 ? `s (${hits.length})` : ''}` : t === 'track' ? 'Track' : 'Project'}
          </button>
        ))}
      </div>
      <div className="fe-panel-body" role="tabpanel">
        {tab === 'event' &&
          (hits.length === 1 ? (
            <EventInspector project={project} track={hits[0].track} event={hits[0].event} onPanCrop={props.onPanCrop} />
          ) : hits.length > 1 ? (
            <MultiInspector project={project} hits={hits} />
          ) : (
            <div className="fe-empty">
              No event selected.
              <br />
              Click an event on the timeline.
            </div>
          ))}
        {tab === 'track' && (track ? <TrackInspector project={project} track={track} /> : <div className="fe-empty">Click a track header to inspect a track.</div>)}
        {tab === 'project' && <ProjectInspector project={project} />}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// event
// ---------------------------------------------------------------------------
const FADE_CURVES: FadeCurve[] = ['linear', 'fast', 'slow', 'smooth', 'sharp'];

function EventInspector({ project, track, event: e, onPanCrop }: { project: Project; track: Track; event: EditEvent; onPanCrop: () => void }) {
  const fps = project.fps;
  const media = project.media[e.mediaId];
  const isVideo = track.kind === 'video';
  const prev = previousNeighbour(track, e);
  const overlapsPrev = !!prev && eventEnd(prev) > e.start + 1e-6;
  const id = e.id;

  return (
    <>
      <Section title="Event">
        <Row label="Name" htmlFor="fe-ev-name">
          <TextInput id="fe-ev-name" value={e.label ?? ''} placeholder={media?.label ?? e.mediaId} onChange={(v) => evProps(id, 'Rename event', { label: v })} />
        </Row>
        <Row label="Media">
          <span className="fe-swatch" style={{ background: media ? KIND_COLOR[media.kind] : '#555' }} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={media ? `${media.kind} · ${media.id}` : 'missing media'}>
            {media ? media.label : <span style={{ color: 'var(--fe-danger)' }}>missing: {e.mediaId}</span>}
          </span>
        </Row>
        <Row label="Flags">
          <Check checked={!!e.mute} onChange={(v) => evProps(id, v ? 'Mute event' : 'Unmute event', { mute: v })}>
            Mute
          </Check>
          <Check checked={!!e.lock} onChange={(v) => evProps(id, v ? 'Lock event' : 'Unlock event', { lock: v })}>
            Lock
          </Check>
          <input
            className="fe-color"
            type="color"
            aria-label="Event colour"
            value={e.color ?? (media ? KIND_COLOR[media.kind] : '#888888')}
            onChange={(ev) => evProps(id, 'Event colour', { color: ev.target.value })}
          />
        </Row>
      </Section>

      <Section title="Timing">
        <Row label="Start">
          <TimeField fps={fps} value={e.start} ariaLabel="Start" onChange={(v) => apply('Move event', (p) => moveEvents(p, [id], v - (findEvent(p, id)?.event.start ?? v), { ripple: ripple() }), `ev:${id}:start`)} />
        </Row>
        <Row label="Length">
          <TimeField
            fps={fps}
            value={e.length}
            min={1 / fps}
            ariaLabel="Length"
            onChange={(v) => apply('Trim event', (p) => trimEnd(p, id, (findEvent(p, id)?.event.start ?? e.start) + v, { ripple: ripple() }), `ev:${id}:end`)}
          />
        </Row>
        <Row label="End">
          <TimeField fps={fps} value={eventEnd(e)} ariaLabel="End" onChange={(v) => apply('Trim event', (p) => trimEnd(p, id, v, { ripple: ripple() }), `ev:${id}:end`)} />
        </Row>
        <Row label="Source in" title="Source time at the event start (Alt-drag on the timeline slips it)">
          <NumField value={e.srcIn} step={1 / fps} digits={3} unit="s" min={media?.kind === 'shot' ? -Infinity : 0} ariaLabel="Source in" onChange={(v) => apply('Slip event', (p) => slipEvents(p, [id], v - (findEvent(p, id)?.event.srcIn ?? v)), `ev:${id}:slip`)} />
        </Row>
        <Row label="Velocity" title="Playback rate (audio pitch follows, as in Vegas)">
          <Slider value={e.rate * 100} min={RATE_MIN * 100} max={RATE_MAX * 100} step={1} digits={0} unit="%" ariaLabel="Velocity" onChange={(v) => apply('Event velocity', (p) => setRate(p, id, v / 100), `ev:${id}:rate`)} />
        </Row>
      </Section>

      <Section title="Fades">
        <FadeRow label="Fade in" len={e.fadeIn.len} curve={e.fadeIn.curve} max={e.length} onChange={(f) => apply('Fade in', (p) => setFade(p, id, 'in', f), `ev:${id}:fadeIn`)} />
        <FadeRow label="Fade out" len={e.fadeOut.len} curve={e.fadeOut.curve} max={e.length} onChange={(f) => apply('Fade out', (p) => setFade(p, id, 'out', f), `ev:${id}:fadeOut`)} />
        {isVideo ? (
          <Row label="Opacity">
            <Slider value={(e.opacity ?? 1) * 100} min={0} max={100} step={1} digits={0} unit="%" ariaLabel="Event opacity" onChange={(v) => apply('Event level', (p) => setEventOpacity(p, id, v / 100), `ev:${id}:opacity`)} />
          </Row>
        ) : (
          <Row label="Gain">
            <Slider value={e.gainDb ?? 0} min={-60} max={GAIN_MAX_DB} step={0.1} digits={1} unit="dB" ariaLabel="Event gain" onChange={(v) => apply('Event volume', (p) => setEventGain(p, id, v), `ev:${id}:gain`)} />
          </Row>
        )}
      </Section>

      {isVideo && (
        <Section title="Transition in">
          <Row label="Kind" title="How this event composites over the overlap with the previous event on its track">
            <Select<TransitionKind>
              ariaLabel="Transition kind"
              value={e.transition?.kind ?? 'crossfade'}
              options={TRANSITIONS_UI.map((t) => ({ value: t.kind, label: t.label }))}
              onChange={(k) => apply('Set transition', (p) => setTransition(p, id, k), `ev:${id}:transition`)}
            />
          </Row>
          <div className="fe-hint" style={{ padding: '2px 0' }}>
            {overlapsPrev && prev ? `Overlap ${(eventEnd(prev) - e.start).toFixed(2)} s with ${project.media[prev.mediaId]?.label ?? prev.id}.` : 'No overlap: drag this event over its neighbour to make a transition.'}
          </div>
        </Section>
      )}

      {isVideo && (
        <Section title="Pan / Crop">
          <Row label="Keys">
            <span className="fe-dim">{e.panCrop?.length ? `${e.panCrop.length} keyframe${e.panCrop.length > 1 ? 's' : ''}` : 'identity'}</span>
            <button className="fe-btn" style={{ marginLeft: 'auto' }} onClick={onPanCrop}>
              Edit… <span className="fe-dim">{keyLabel('panCrop')}</span>
            </button>
          </Row>
          {!!e.panCrop?.length && (
            <button className="fe-btn" style={{ marginTop: 4 }} onClick={() => editor.apply('Reset Pan/Crop', (p) => resetPanCrop(p, id))}>
              Reset to full frame
            </button>
          )}
        </Section>
      )}

      {media?.kind === 'text' && <TextSection event={e} spec={media.text} />}
      {media?.kind === 'color' && (
        <Section title="Solid colour">
          <Row label="Colour">
            <input className="fe-color" type="color" aria-label="Solid colour" value={toHex(media.color)} onChange={(ev) => apply('Solid colour', (p) => updateMedia(p, media.id, { color: ev.target.value }), `md:${media.id}:color`)} />
            <span className="fe-mono fe-dim">{media.color}</span>
          </Row>
        </Section>
      )}

      {isVideo ? (
        <VideoFxChain list={e.videoFx ?? []} target={{ scope: 'event', id }} localT={(cursor) => cursor - e.start} />
      ) : (
        <AudioFxChain list={e.audioFx ?? []} target={{ scope: 'event', id }} />
      )}
    </>
  );
}

function FadeRow(props: { label: string; len: number; curve: FadeCurve; max: number; onChange: (f: Fade) => void }) {
  return (
    <Row label={props.label}>
      <NumField value={props.len} min={0} max={props.max} step={1 / 24} digits={2} unit="s" ariaLabel={`${props.label} length`} onChange={(len) => props.onChange({ len, curve: props.curve })} />
      <Select<FadeCurve> ariaLabel={`${props.label} curve`} value={props.curve} options={FADE_CURVES} onChange={(curve) => props.onChange({ len: props.len, curve })} />
    </Row>
  );
}

function MultiInspector({ project, hits }: { project: Project; hits: { track: Track; event: EditEvent }[] }) {
  const start = Math.min(...hits.map((h) => h.event.start));
  const end = Math.max(...hits.map((h) => eventEnd(h.event)));
  const ids = hits.map((h) => h.event.id);
  const key = `multi:${ids.join(',')}`;
  const allMuted = hits.every((h) => h.event.mute);
  return (
    <Section title={`${hits.length} events`}>
      <Row label="Span">
        <span className="fe-mono">
          {timecode(start, project.fps)} – {timecode(end, project.fps)}
        </span>
      </Row>
      <Row label="Mute">
        <Check checked={allMuted} onChange={(v) => apply(v ? 'Mute events' : 'Unmute events', (p) => setEventProps(p, ids, { mute: v }), `${key}:mute`)}>
          All muted
        </Check>
      </Row>
      <Row label="Fades">
        <NumField value={hits[0].event.fadeIn.len} min={0} max={30} step={1 / 24} digits={2} unit="s" ariaLabel="Set fade in and out on all" onChange={(len) => apply('Set fades', (p) => setFade(setFade(p, ids, 'in', { len }), ids, 'out', { len }), `${key}:fades`)} />
      </Row>
      <div className="fe-hint" style={{ padding: '4px 0' }}>
        {hits.filter((h) => h.track.kind === 'video').length} video · {hits.filter((h) => h.track.kind === 'audio').length} audio. Select a single event to edit all of its properties.
      </div>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// text generator
// ---------------------------------------------------------------------------
const FONT_OPTIONS = Object.values(FONT).map((f) => ({ value: f as string, label: f.replace(/"/g, '') }));

function TextSection({ event: e, spec }: { event: EditEvent; spec: TextSpec }) {
  const t: TextSpec = { ...spec, ...e.text };
  const set = (patch: Partial<TextSpec>, label = 'Edit text', field?: string) =>
    apply(label, (p) => setEventText(p, e.id, patch), `ev:${e.id}:text:${field ?? Object.keys(patch).join(',')}`);
  const fonts = FONT_OPTIONS.some((f) => f.value === t.font) ? FONT_OPTIONS : [{ value: t.font, label: t.font.replace(/"/g, '') }, ...FONT_OPTIONS];
  return (
    <Section title="Text" actions={e.text ? <button className="fe-icon-btn" title="Drop this event's overrides and use the media's text" onClick={() => editor.apply('Reset text', (p) => setEventText(p, e.id, null))}>Reset</button> : undefined}>
      <textarea className="fe-textarea" aria-label="Text content" value={t.content} rows={3} onChange={(ev) => set({ content: ev.target.value }, 'Edit text', 'content')} />
      <Row label="Font">
        <Select ariaLabel="Font" value={t.font} options={fonts} onChange={(font) => set({ font }, 'Text font')} />
      </Row>
      <Row label="Size">
        <NumField value={t.size} min={4} max={400} step={1} digits={0} unit="px" ariaLabel="Text size" onChange={(size) => set({ size }, 'Text size')} />
      </Row>
      <Row label="Weight">
        <NumField value={t.weight ?? 400} min={100} max={900} step={100} digits={0} ariaLabel="Weight" onChange={(weight) => set({ weight }, 'Text weight')} />
        <Check checked={!!t.italic} onChange={(italic) => set({ italic }, 'Italic')}>
          Italic
        </Check>
      </Row>
      <Row label="Colour">
        <input className="fe-color" type="color" aria-label="Text colour" value={toHex(t.color)} onChange={(ev) => set({ color: ev.target.value }, 'Text colour')} />
        <Select<TextSpec['align']> ariaLabel="Alignment" value={t.align} options={['left', 'center', 'right']} onChange={(align) => set({ align }, 'Text align')} />
      </Row>
      <Row label="Position" title="Anchor in stage px (1280×720)">
        <NumField label="X" value={t.x} min={-640} max={1920} step={1} digits={0} onChange={(x) => set({ x }, 'Move text')} />
        <NumField label="Y" value={t.y} min={-360} max={1080} step={1} digits={0} onChange={(y) => set({ y }, 'Move text')} />
      </Row>
      <Row label="Type-on" title="Characters per second (0 = all at once)">
        <NumField value={t.typeOn ?? 0} min={0} max={200} step={1} digits={0} unit="cps" ariaLabel="Type-on speed" onChange={(typeOn) => set({ typeOn }, 'Type-on')} />
      </Row>
      <Row label="Outline">
        <Check checked={!!t.outline} onChange={(v) => set({ outline: v ? { color: '#000000', width: 2 } : undefined }, 'Text outline', 'outline')}>
          On
        </Check>
        {t.outline && (
          <>
            <input className="fe-color" type="color" aria-label="Outline colour" value={toHex(t.outline.color)} onChange={(ev) => set({ outline: { ...t.outline!, color: ev.target.value } }, 'Text outline', 'outline')} />
            <NumField value={t.outline.width} min={0} max={30} step={0.5} digits={1} unit="px" width={64} ariaLabel="Outline width" onChange={(width) => set({ outline: { ...t.outline!, width } }, 'Text outline', 'outline')} />
          </>
        )}
      </Row>
      <Row label="Shadow">
        <Check checked={!!t.shadow} onChange={(v) => set({ shadow: v ? { color: '#000000', blur: 8, dx: 0, dy: 2 } : undefined }, 'Text shadow', 'shadow')}>
          On
        </Check>
        {t.shadow && (
          <>
            <input className="fe-color" type="color" aria-label="Shadow colour" value={toHex(t.shadow.color)} onChange={(ev) => set({ shadow: { ...t.shadow!, color: ev.target.value } }, 'Text shadow', 'shadow')} />
            <NumField value={t.shadow.blur} min={0} max={60} step={0.5} digits={1} unit="px" width={64} ariaLabel="Shadow blur" onChange={(blur) => set({ shadow: { ...t.shadow!, blur } }, 'Text shadow', 'shadow')} />
          </>
        )}
      </Row>
      <Row label="Plate">
        <Check checked={!!t.plate} onChange={(v) => set({ plate: v ? { color: '#000000', padding: 12, radius: 4 } : undefined }, 'Text plate', 'plate')}>
          On
        </Check>
        {t.plate && (
          <>
            <input className="fe-color" type="color" aria-label="Plate colour" value={toHex(t.plate.color)} onChange={(ev) => set({ plate: { ...t.plate!, color: ev.target.value } }, 'Text plate', 'plate')} />
            <NumField value={t.plate.padding} min={0} max={120} step={1} digits={0} unit="px" width={64} ariaLabel="Plate padding" onChange={(padding) => set({ plate: { ...t.plate!, padding } }, 'Text plate', 'plate')} />
          </>
        )}
      </Row>
      <div className="fe-hint" style={{ padding: '4px 0 0' }}>
        Edits apply to this event only; positions are stage px (1280×720).
      </div>
    </Section>
  );
}

/** <input type=color> needs #rrggbb; map short hex and named/rgba colours as well as the browser can */
function toHex(c: string): string {
  if (/^#[0-9a-f]{6}$/i.test(c)) return c;
  if (/^#[0-9a-f]{3}$/i.test(c)) return `#${c[1]}${c[1]}${c[2]}${c[2]}${c[3]}${c[3]}`;
  const cv = document.createElement('canvas').getContext('2d');
  if (!cv) return '#000000';
  cv.fillStyle = '#000';
  cv.fillStyle = c;
  const v = String(cv.fillStyle);
  return /^#[0-9a-f]{6}$/i.test(v) ? v : '#000000';
}

// ---------------------------------------------------------------------------
// FX chains
// ---------------------------------------------------------------------------
const fxKey = (target: FxTarget, fxId: string, what: string) => `fx:${target.scope}:${target.id}:${fxId}:${what}`;

/** a video FX chain; `localT(cursor)` maps the timeline cursor to the FX's keyframe time base */
function VideoFxChain(props: { list: VideoFx[]; target: FxTarget; localT: (cursor: number) => number }) {
  const { list, target } = props;
  const keyed = list.some((f) => typeof f.value !== 'number');
  // follow the cursor only when some value is keyframed (otherwise the panel would re-render every frame of playback)
  const cursor = useEditor((s) => (keyed ? s.ui.cursor : 0));
  const t = props.localT(cursor);
  const [adding, setAdding] = useState<VideoFxKind>('brightness');
  const setValue = (fx: VideoFx, value: number | Keyframe[], label: string) => apply(label, (p) => setVideoFxValue(p, target, fx.id, value), fxKey(target, fx.id, label));
  return (
    <Section
      title={`${target.scope === 'track' ? 'Track' : 'Event'} video FX${list.length ? ` (${list.length})` : ''}`}
      actions={
        <>
          <select className="fe-select" style={{ width: 110, height: 20 }} aria-label="Video FX to add" value={adding} onChange={(e) => setAdding(e.target.value as VideoFxKind)}>
            {VIDEO_FX_KINDS.map((k) => (
              <option key={k} value={k}>
                {VIDEO_FX_UI[k].label}
              </option>
            ))}
          </select>
          <button className="fe-icon-btn" title="Add to the chain" onClick={() => editor.apply(`Add ${VIDEO_FX_UI[adding].label}`, (p) => addVideoFx(p, target, adding))}>
            +
          </button>
        </>
      }
    >
      {!list.length && <div className="fe-hint" style={{ padding: 0 }}>No video FX. Add one here or drag one from the Video FX tab.</div>}
      {list.map((fx, i) => {
        const ui = VIDEO_FX_UI[fx.kind];
        const isKeyed = typeof fx.value !== 'number';
        const onKey = isKeyed && (fx.value as Keyframe[]).some((k) => Math.abs(k.t - t) <= KEY_EPS);
        const v = sampleValue(fx.value, t);
        return (
          <div key={fx.id} className={`fe-fx${fx.enabled ? '' : ' is-off'}`}>
            <FxHead target={target} id={fx.id} label={ui.label} desc={ui.desc} enabled={fx.enabled} index={i} count={list.length} />
            <div className="fe-fx-body">
              <div className="fe-inline">
                <button
                  className={`fe-kf-btn${isKeyed ? ' is-keyed' : ''}${onKey ? ' is-on-key' : ''}`}
                  title={isKeyed ? (onKey ? 'Delete the keyframe at the cursor' : 'Add a keyframe at the cursor') : 'Animate: key this value at the cursor'}
                  aria-label="Toggle keyframe"
                  onClick={() => editor.apply(onKey ? 'Delete keyframe' : 'Add keyframe', (p) => setVideoFxValue(p, target, fx.id, toggleKeyAt(fx.value, t)))}
                >
                  ◆
                </button>
                <Slider value={v} min={ui.min} max={ui.max} step={ui.step} digits={ui.digits ?? 2} unit={ui.unit} ariaLabel={ui.label} onChange={(nv) => setValue(fx, setValueAt(fx.value, t, nv), ui.label)} />
              </div>
              {isKeyed && (
                <div className="fe-hint" style={{ padding: '2px 0 0 24px' }}>
                  {(fx.value as Keyframe[]).length} keys ·{' '}
                  <button className="fe-icon-btn" style={{ height: 18 }} onClick={() => editor.apply('Clear keyframes', (p) => setVideoFxValue(p, target, fx.id, v))}>
                    clear keys
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </Section>
  );
}

/** enable / reorder / remove: the head row every FX shares */
function FxHead(props: { target: FxTarget; id: string; label: string; desc?: string; enabled: boolean; index: number; count: number }) {
  const { target, id, label, index, count } = props;
  return (
    <div className="fe-fx-head">
      <input
        type="checkbox"
        checked={props.enabled}
        aria-label={`Enable ${label}`}
        onChange={(e) => editor.apply(`${e.target.checked ? 'Enable' : 'Bypass'} ${label}`, (p) => setFxEnabled(p, target, id, e.target.checked))}
      />
      <span className="fe-fx-name" title={props.desc}>
        {label}
      </span>
      <button className="fe-icon-btn" disabled={index === 0} title="Move up the chain" aria-label={`Move ${label} up`} onClick={() => editor.apply('Reorder FX', (p) => moveFx(p, target, id, index - 1))}>
        ↑
      </button>
      <button className="fe-icon-btn" disabled={index === count - 1} title="Move down the chain" aria-label={`Move ${label} down`} onClick={() => editor.apply('Reorder FX', (p) => moveFx(p, target, id, index + 1))}>
        ↓
      </button>
      <button className="fe-icon-btn" title="Remove" aria-label={`Remove ${label}`} onClick={() => editor.apply(`Remove ${label}`, (p) => removeFx(p, target, id))}>
        ✕
      </button>
    </div>
  );
}

function AudioFxChain(props: { list: AudioFx[]; target: FxTarget }) {
  const { list, target } = props;
  const [adding, setAdding] = useState<AudioFxKind>('eq3');
  return (
    <Section
      title={`${target.scope === 'track' ? 'Track' : 'Event'} audio FX${list.length ? ` (${list.length})` : ''}`}
      actions={
        <>
          <select className="fe-select" style={{ width: 110, height: 20 }} aria-label="Audio FX to add" value={adding} onChange={(e) => setAdding(e.target.value as AudioFxKind)}>
            {AUDIO_FX_KINDS.map((k) => (
              <option key={k} value={k}>
                {AUDIO_FX_LABEL[k]}
              </option>
            ))}
          </select>
          <button className="fe-icon-btn" title="Add to the chain" onClick={() => editor.apply(`Add ${AUDIO_FX_LABEL[adding]}`, (p) => addAudioFx(p, target, adding, { params: audioFxDefaults(adding) }))}>
            +
          </button>
        </>
      }
    >
      {!list.length && <div className="fe-hint" style={{ padding: 0 }}>No audio FX.</div>}
      {list.map((fx, i) => {
        const label = AUDIO_FX_LABEL[fx.kind];
        return (
          <div key={fx.id} className={`fe-fx${fx.enabled ? '' : ' is-off'}`}>
            <FxHead target={target} id={fx.id} label={label} enabled={fx.enabled} index={i} count={list.length} />
            <div className="fe-fx-body">
              {AUDIO_FX_PARAMS[fx.kind].map((spec) => {
                const ui = paramUi(spec);
                const v = fx.params[spec.key] ?? spec.default;
                return (
                  <Row key={spec.key} label={spec.label}>
                    <Slider
                      value={v}
                      min={spec.min}
                      max={spec.max}
                      step={ui.step}
                      digits={ui.digits}
                      unit={ui.unit}
                      log={spec.log}
                      ariaLabel={`${label} ${spec.label}`}
                      onChange={(nv) => apply(`${label} ${spec.label}`, (pr) => setAudioFxParam(pr, target, fx.id, spec.key, nv), fxKey(target, fx.id, spec.key))}
                    />
                  </Row>
                );
              })}
            </div>
          </div>
        );
      })}
    </Section>
  );
}

// ---------------------------------------------------------------------------
// track
// ---------------------------------------------------------------------------
const BLENDS: BlendMode[] = ['normal', 'screen', 'multiply', 'add', 'overlay', 'lighten', 'darken'];

function TrackInspector({ project, track: tr }: { project: Project; track: Track }) {
  const id = tr.id;
  const isVideo = tr.kind === 'video';
  const others = project.tracks.filter((t) => t.kind === 'audio' && t.id !== id);
  const duck = tr.duck;
  // a new duck keys on every other audio track that carries narration (else all of them); times are seconds
  const defaultKeys = () => {
    const speech = others.filter((o) => o.events.some((ev) => {
      const m = project.media[ev.mediaId];
      return m?.kind === 'audio' && m.role === 'narration';
    }));
    return (speech.length ? speech : others).map((o) => o.id);
  };
  const setDuck = (patch: Partial<NonNullable<Track['duck']>>, label = 'Duck settings') =>
    apply(label, (p) => setTrackDuck(p, id, { by: defaultKeys(), depthDb: 6, attack: 0.02, release: 0.5, ...tr.duck, ...patch }), `tr:${id}:duck`);
  return (
    <>
      <Section title={`${isVideo ? 'Video' : 'Audio'} track`}>
        <Row label="Name" htmlFor="fe-tr-name">
          <TextInput id="fe-tr-name" value={tr.name} onChange={(v) => trProps(id, 'Rename track', { name: v })} />
        </Row>
        <Row label="State">
          <Check checked={tr.mute} onChange={(v) => trProps(id, v ? 'Mute track' : 'Unmute track', { mute: v })}>
            Mute
          </Check>
          <Check checked={tr.solo} onChange={(v) => trProps(id, v ? 'Solo track' : 'Unsolo track', { solo: v })}>
            Solo
          </Check>
          <Check checked={tr.lock} onChange={(v) => trProps(id, v ? 'Lock track' : 'Unlock track', { lock: v })}>
            Lock
          </Check>
          <input className="fe-color" type="color" aria-label="Track colour" value={toHex(tr.color ?? (isVideo ? KIND_COLOR.shot : KIND_COLOR.audio))} onChange={(e) => trProps(id, 'Track colour', { color: e.target.value })} />
        </Row>
        {isVideo ? (
          <>
            <Row label="Level">
              <Slider value={(tr.opacity ?? 1) * 100} min={0} max={100} step={1} digits={0} unit="%" ariaLabel="Track level" onChange={(v) => trProps(id, 'Track level', { opacity: v / 100 })} />
            </Row>
            <Row label="Blend">
              <Select<BlendMode> ariaLabel="Composite mode" value={tr.blend ?? 'normal'} options={BLENDS} onChange={(blend) => trProps(id, 'Composite mode', { blend })} />
            </Row>
          </>
        ) : (
          <>
            <Row label="Volume">
              <Slider value={tr.gainDb ?? 0} min={-60} max={GAIN_MAX_DB} step={0.1} digits={1} unit="dB" ariaLabel="Track volume" onChange={(v) => trProps(id, 'Track volume', { gainDb: v })} />
            </Row>
            <Row label="Pan">
              <Slider
                value={(tr.pan ?? 0) * 100}
                min={-100}
                max={100}
                step={1}
                digits={0}
                ariaLabel="Track pan"
                format={(v) => (Math.abs(v) < 0.5 ? 'C' : v < 0 ? `L${Math.round(-v)}` : `R${Math.round(v)}`)}
                onChange={(v) => trProps(id, 'Track pan', { pan: v / 100 })}
              />
            </Row>
          </>
        )}
        <Row label="Events">
          <span className="fe-dim">
            {tr.events.length} · {timecode(tr.events.reduce((s, e) => s + e.length, 0), project.fps)} total
          </span>
        </Row>
      </Section>

      {!isVideo && (
        <Section title="Ducking">
          <Row label="Duck">
            <Check checked={!!duck} onChange={(v) => (v ? setDuck({}, 'Enable ducking') : editor.apply('Disable ducking', (p) => setTrackDuck(p, id, null)))}>
              Duck this track under
            </Check>
          </Row>
          {duck && (
            <>
              <div style={{ padding: '2px 0 4px 84px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                {others.length ? (
                  others.map((o) => (
                    <Check
                      key={o.id}
                      checked={duck.by.includes(o.id)}
                      onChange={(v) => setDuck({ by: v ? [...duck.by, o.id] : duck.by.filter((x) => x !== o.id) }, 'Duck keys')}
                    >
                      {o.name}
                    </Check>
                  ))
                ) : (
                  <span className="fe-dim">No other audio tracks.</span>
                )}
              </div>
              <Row label="Depth">
                <Slider value={duck.depthDb} min={0} max={36} step={0.5} digits={1} unit="dB" ariaLabel="Duck depth" onChange={(depthDb) => setDuck({ depthDb })} />
              </Row>
              <Row label="Attack" title="Milliseconds to reach the full duck">
                <NumField value={duckMs(duck.attack)} min={1} max={4000} step={5} digits={0} unit="ms" ariaLabel="Duck attack" onChange={(ms) => setDuck({ attack: ms / 1000 })} />
              </Row>
              <Row label="Release" title="Milliseconds to recover">
                <NumField value={duckMs(duck.release)} min={1} max={10000} step={10} digits={0} unit="ms" ariaLabel="Duck release" onChange={(ms) => setDuck({ release: ms / 1000 })} />
              </Row>
            </>
          )}
        </Section>
      )}

      {isVideo ? (
        <VideoFxChain list={tr.videoFx ?? []} target={{ scope: 'track', id }} localT={(cursor) => cursor} />
      ) : (
        <AudioFxChain list={tr.audioFx ?? []} target={{ scope: 'track', id }} />
      )}
    </>
  );
}

/** the model stores duck times in seconds (shown as ms); 5 or more is a legacy millisecond value (engine/duck.ts) */
const duckMs = (v: number) => (v >= 5 ? v : v * 1000);

// ---------------------------------------------------------------------------
// project
// ---------------------------------------------------------------------------
const SIZES = [
  { value: '1920x1080', label: '1920×1080 (HD 1080)' },
  { value: '1280x720', label: '1280×720 (HD 720)' },
  { value: '3840x2160', label: '3840×2160 (UHD)' },
  { value: '960x540', label: '960×540 (preview)' },
];

function ProjectInspector({ project: p }: { project: Project }) {
  const size = `${p.width}x${p.height}`;
  const sizes = SIZES.some((s) => s.value === size) ? SIZES : [{ value: size, label: `${p.width}×${p.height} (custom)` }, ...SIZES];
  let events = 0;
  let end = 0;
  for (const t of p.tracks) {
    events += t.events.length;
    for (const e of t.events) end = Math.max(end, eventEnd(e));
  }
  return (
    <>
      <Section title="Project">
        <Row label="Title" htmlFor="fe-pr-title">
          <TextInput id="fe-pr-title" value={p.title} onChange={(title) => editProject('Project title', (x) => ({ ...x, title }))} />
        </Row>
        <Row label="Film">
          <span className="fe-mono">{p.slug}</span>
        </Row>
        <Row label="Frame size">
          <Select
            ariaLabel="Frame size"
            value={size}
            options={sizes}
            onChange={(v) => {
              const [w, h] = v.split('x').map(Number);
              editProject('Frame size', (x) => ({ ...x, width: w, height: h }));
            }}
          />
        </Row>
        <Row label="Frame rate">
          <Select ariaLabel="Frame rate" value={String(p.fps)} options={[...new Set([String(p.fps), '24', '25', '30'])].map((v) => ({ value: v, label: `${v} fps` }))} onChange={(v) => editProject('Frame rate', (x) => ({ ...x, fps: Number(v) }))} />
        </Row>
        <Row label="Audio">
          <span className="fe-dim">{(p.sampleRate / 1000).toFixed(1)} kHz stereo</span>
        </Row>
        <Row label="Length">
          <span className="fe-mono">{timecode(end, p.fps)}</span>
        </Row>
        <Row label="Contents">
          <span className="fe-dim">
            {p.tracks.length} tracks · {events} events · {Object.keys(p.media).length} media · {p.markers.length} markers · {p.regions.length} regions
          </span>
        </Row>
      </Section>
      <Section title="Master">
        <Row label="Gain">
          <Slider value={p.master.gainDb} min={-24} max={12} step={0.1} digits={1} unit="dB" ariaLabel="Master gain" onChange={(gainDb) => editProject('Master gain', (x) => ({ ...x, master: { ...x.master, gainDb } }))} />
        </Row>
        <Row label="Limiter" title="Brickwall ceiling (sample peak)">
          <Slider value={p.master.limiterDb} min={-12} max={0} step={0.1} digits={1} unit="dB" ariaLabel="Limiter ceiling" onChange={(limiterDb) => editProject('Limiter ceiling', (x) => ({ ...x, master: { ...x.master, limiterDb } }))} />
        </Row>
        <Row label="Film finish" title="The film kit's finish pass over the whole output (grain, weave, halation)">
          <Slider value={p.master.finish * 100} min={0} max={100} step={1} digits={0} unit="%" ariaLabel="Film finish" onChange={(v) => editProject('Film finish', (x) => ({ ...x, master: { ...x.master, finish: v / 100 } }))} />
        </Row>
        <div className="fe-hint" style={{ padding: '2px 0' }}>
          Master {fmtDb(p.master.gainDb)} → limiter at {fmtDb(p.master.limiterDb)}.
        </div>
      </Section>
      {p.source && (
        <Section title="Provenance" defaultOpen={false}>
          <Row label="Imported">
            <span className="fe-dim">{new Date(p.source.at).toLocaleString()}</span>
          </Row>
          {p.source.timelineSha && (
            <Row label="Timeline">
              <span className="fe-mono fe-dim">{p.source.timelineSha.slice(0, 12)}</span>
            </Row>
          )}
          {p.source.cuesSha && (
            <Row label="Cues">
              <span className="fe-mono fe-dim">{p.source.cuesSha.slice(0, 12)}</span>
            </Row>
          )}
          <Row label="Saved">
            <span className="fe-dim">{new Date(p.updatedAt).toLocaleString()}</span>
          </Row>
        </Section>
      )}
    </>
  );
}
