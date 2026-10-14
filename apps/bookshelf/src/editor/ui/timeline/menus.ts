/**
 * Timeline context menus — event, track and ruler menus (Vegas layout), built from the current store state.
 * Every command is one `editor.apply` of a model operation (editor/model/ops.ts) or a UI-only `editor.set`;
 * dialogs the shell owns (Properties, Pan/Crop, FX) are requested with emitTimelineCommand.
 *
 *   eventMenu(eventId, t)                 right-click on an event (acts on the selection containing it)
 *   trackMenu(trackId | null, hooks)      right-click on a track header or an empty lane
 *   rulerMenu(hit, hooks)                 right-click on the ruler, marker bar, a marker/region tab or the loop bar
 *   envelopePointMenu(target, index)      right-click on an event or track envelope point (Vegas: delete, curve type)
 */
import type { FadeCurve, Keyframe, Project } from '../../model/types';
import { TRANSITIONS_UI } from '../../engine/transitions';
import {
  addEnvelopePoint,
  addMarker,
  addRegion,
  addTrack,
  clearEnvelope,
  deleteEnvelopePoint,
  deleteMarkers,
  deleteRegions,
  expandGroups,
  findEvent,
  groupEvents,
  previousNeighbour,
  removeEvents,
  removeTrack,
  setEventGain,
  setEventOpacity,
  setEnvelopeCurve,
  setEventProps,
  setFade,
  setRate,
  setTrackDuck,
  setTrackHeight,
  setTransition,
  splitEvents,
  toggleTrackFlag,
  ungroupEvents,
  type EnvelopeTarget,
} from '../../model/ops.ts';
import { newId } from '../../model/id.ts';
import { editor } from '../../state/store';
import { SEP, type MenuItem } from './ContextMenu';
import { ENVELOPES, type EnvelopeKind } from './curves.ts';
import { eventLabel } from './draw.ts';
import { duplicateTrack } from './edits.ts';
import type { Hit } from './hit.ts';
import { emitTimelineCommand } from './viewport.ts';

export interface MenuHooks {
  /** start an inline rename */
  rename(kind: 'track' | 'marker' | 'region', id: string): void;
}

const FADE_CURVES: { id: FadeCurve; label: string }[] = [
  { id: 'linear', label: 'Linear' },
  { id: 'fast', label: 'Fast' },
  { id: 'slow', label: 'Slow' },
  { id: 'smooth', label: 'Smooth' },
  { id: 'sharp', label: 'Sharp' },
];

/** the same names as the Explorer's Transitions tab (engine/transitions.ts) */
const TRANSITIONS = TRANSITIONS_UI.map((t) => ({ id: t.kind, label: t.label }));

const KEY_CURVES: { id: NonNullable<Keyframe['curve']>; label: string }[] = [
  { id: 'linear', label: 'Linear' },
  { id: 'fast', label: 'Fast' },
  { id: 'slow', label: 'Slow' },
  { id: 'smooth', label: 'Smooth' },
  { id: 'hold', label: 'Hold' },
];

const ENV_LABEL: Record<EnvelopeKind, string> = { volume: 'Volume', pan: 'Pan', opacity: 'Opacity' };

const current = () => {
  const s = editor.getState();
  return s.project ? { project: s.project, ui: s.ui } : null;
};

/** the ids a menu on `eventId` acts on: the selection if it contains the event, else the event's group */
const targetIds = (p: Project, selection: readonly string[], eventId: string, groups: boolean): string[] =>
  selection.includes(eventId) ? expandGroups(p, selection, groups) : expandGroups(p, [eventId], groups);

// ---------------------------------------------------------------------------
// Event
// ---------------------------------------------------------------------------
export function eventMenu(eventId: string, t: number): MenuItem[] {
  const st = current();
  if (!st) return [];
  const { project: p, ui } = st;
  const ref = findEvent(p, eventId);
  if (!ref) return [];
  const { event: e, track } = ref;
  const groups = !ui.ignoreGroups;
  const ids = targetIds(p, ui.selection, eventId, groups);
  const many = ids.length > 1;
  const isVideo = track.kind === 'video';
  const locked = !!(e.lock || track.lock);
  const inside = (x: number) => x > e.start + 1e-6 && x < e.start + e.length - 1e-6;
  const splitT = inside(ui.cursor) ? ui.cursor : t;

  const fadeMenu = (which: 'in' | 'out'): MenuItem[] => {
    const f = which === 'in' ? e.fadeIn : e.fadeOut;
    const name = which === 'in' ? 'In' : 'Out';
    return [
      ...FADE_CURVES.map((c): MenuItem => ({ label: c.label, checked: f.curve === c.id, onSelect: () => editor.apply(`Fade ${name} Type`, (q) => setFade(q, ids, which, { curve: c.id })) })),
      SEP,
      { label: `Remove Fade ${name}`, disabled: f.len <= 0, onSelect: () => editor.apply(`Remove Fade ${name}`, (q) => setFade(q, ids, which, { len: 0 })) },
    ];
  };

  const envKinds: EnvelopeKind[] = isVideo ? ['opacity'] : ['volume', 'pan'];
  const envMenu: MenuItem[] = envKinds.map((k) => {
    const on = !!e.envelopes?.[k]?.length;
    return {
      label: ENV_LABEL[k],
      checked: on,
      onSelect: () =>
        editor.apply(on ? `Remove ${ENV_LABEL[k]} Envelope` : `Add ${ENV_LABEL[k]} Envelope`, (q) =>
          ids.reduce((acc, id) => {
            const target = { scope: 'event' as const, id, env: k };
            return on ? clearEnvelope(acc, target) : addEnvelopePoint(acc, target, { t: 0, v: ENVELOPES[k].dflt });
          }, q),
        ),
    };
  });

  const levelSet = isVideo ? (e.opacity ?? 1) !== 1 : (e.gainDb ?? 0) !== 0;
  const items: MenuItem[] = [
    { kind: 'header', label: many ? `${ids.length} events` : eventLabel(e, p.media[e.mediaId]) },
    {
      label: inside(ui.cursor) ? 'Split at Cursor' : 'Split Here',
      shortcut: 'S',
      disabled: locked,
      onSelect: () => {
        // name the right halves up front so the selection can follow them
        const rightIds: Record<string, string> = {};
        for (const id of ids) rightIds[id] = newId('e');
        editor.apply('Split', (q) => splitEvents(q, ids, splitT, { rightIds }));
        const now = editor.getState().project;
        const created = now ? Object.values(rightIds).filter((id) => findEvent(now, id)) : [];
        if (created.length) editor.set({ selection: [...ids, ...created] });
      },
    },
    {
      label: 'Delete',
      shortcut: 'Delete',
      danger: true,
      onSelect: () => {
        editor.apply(many ? 'Delete Events' : 'Delete Event', (q) => removeEvents(q, ids, editor.getState().ui.ripple, { groups }));
        editor.set({ selection: [] });
      },
    },
    SEP,
    { label: 'Cut', shortcut: 'Ctrl+X', disabled: locked, onSelect: () => emitTimelineCommand({ kind: 'clipboard', op: 'cut' }) },
    { label: 'Copy', shortcut: 'Ctrl+C', onSelect: () => emitTimelineCommand({ kind: 'clipboard', op: 'copy' }) },
    { label: 'Paste', shortcut: 'Ctrl+V', onSelect: () => emitTimelineCommand({ kind: 'clipboard', op: 'paste' }) },
    SEP,
    { label: 'Mute', checked: !!e.mute, onSelect: () => editor.apply(e.mute ? 'Unmute Event' : 'Mute Event', (q) => setEventProps(q, ids, { mute: !e.mute })) },
    { label: 'Lock', checked: !!e.lock, onSelect: () => editor.apply(e.lock ? 'Unlock Event' : 'Lock Event', (q) => setEventProps(q, ids, { lock: !e.lock })) },
    SEP,
    { label: 'Fade In Type', submenu: fadeMenu('in'), disabled: locked },
    { label: 'Fade Out Type', submenu: fadeMenu('out'), disabled: locked },
  ];
  if (isVideo) {
    items.push({
      label: 'Transition',
      disabled: locked || !previousNeighbour(track, e),
      submenu: TRANSITIONS.map((tr) => ({
        label: tr.label,
        checked: (e.transition?.kind ?? 'crossfade') === tr.id,
        onSelect: () => editor.apply('Transition', (q) => setTransition(q, eventId, tr.id === 'crossfade' ? null : tr.id)),
      })),
    });
  }
  items.push(
    { label: 'Envelopes', submenu: envMenu, disabled: locked },
    {
      label: isVideo ? 'Reset Opacity' : 'Reset Volume',
      disabled: !levelSet || locked,
      onSelect: () => editor.apply(isVideo ? 'Reset Opacity' : 'Reset Volume', (q) => (isVideo ? setEventOpacity(q, ids, 1) : setEventGain(q, ids, 0))),
    },
    {
      label: 'Reset Playback Rate',
      disabled: Math.abs(e.rate - 1) < 1e-6 || locked,
      onSelect: () => editor.apply('Reset Rate', (q) => setRate(q, eventId, 1, 'span')),
    },
    SEP,
    {
      label: 'Group',
      submenu: [
        { label: 'Create New Group', disabled: ids.length < 2, onSelect: () => editor.apply('Group Events', (q) => groupEvents(q, ids)) },
        { label: 'Remove from Group', disabled: !ids.some((id) => findEvent(p, id)?.event.group), onSelect: () => editor.apply('Ungroup Events', (q) => ungroupEvents(q, ids)) },
        { label: 'Select All in Group', disabled: !e.group, onSelect: () => editor.set({ selection: expandGroups(p, [eventId], true) }) },
      ],
    },
    { label: 'Select Events to End', onSelect: () => editor.set({ selection: track.events.filter((x) => x.start >= e.start).map((x) => x.id) }) },
    SEP,
  );
  if (isVideo) items.push({ label: 'Event Pan/Crop…', shortcut: 'Ctrl+D', onSelect: () => emitTimelineCommand({ kind: 'panCrop', eventId }) });
  items.push(
    { label: 'Event FX…', onSelect: () => emitTimelineCommand({ kind: 'eventFx', eventId }) },
    { label: 'Properties…', onSelect: () => emitTimelineCommand({ kind: 'eventProperties', eventId }) },
  );
  return items;
}

// ---------------------------------------------------------------------------
// Track
// ---------------------------------------------------------------------------
/** audio tracks carrying narration (the default duck keys) */
function narrationTracks(p: Project, exclude: string): string[] {
  const audio = p.tracks.filter((t) => t.kind === 'audio' && t.id !== exclude);
  const byMedia = audio.filter((t) => t.events.some((e) => {
    const m = p.media[e.mediaId];
    return m?.kind === 'audio' && m.role === 'narration';
  }));
  return (byMedia.length ? byMedia : audio.filter((t) => /narrat|voice|\bvo\b/i.test(t.name))).map((t) => t.id);
}

/** where a new track of `kind` goes, relative to the clicked track (same kind: above it) */
function insertIndex(p: Project, kind: 'video' | 'audio', at: number): number | undefined {
  return p.tracks[at]?.kind === kind ? at : undefined; // undefined: ops.addTrack's default place for the kind
}

export function trackMenu(trackId: string | null, hooks: MenuHooks): MenuItem[] {
  const st = current();
  if (!st) return [];
  const p = st.project;
  const at = trackId ? p.tracks.findIndex((t) => t.id === trackId) : -1;
  const track = at >= 0 ? p.tracks[at] : undefined;
  const insert = (kind: 'video' | 'audio') => () => {
    const id = newId(kind === 'video' ? 'tv' : 'ta');
    editor.apply(kind === 'video' ? 'Insert Video Track' : 'Insert Audio Track', (q) => addTrack(q, kind, { id, index: insertIndex(q, kind, at) }));
    editor.set({ track: id });
  };
  const items: MenuItem[] = [
    { label: 'Insert Video Track', onSelect: insert('video') },
    { label: 'Insert Audio Track', onSelect: insert('audio') },
  ];
  if (!track) return items;
  const tid = track.id;
  items.unshift({ kind: 'header', label: track.name });
  items.push(
    {
      label: 'Duplicate Track',
      onSelect: () => {
        let id = '';
        editor.apply('Duplicate Track', (q) => {
          const r = duplicateTrack(q, tid);
          id = r.id;
          return r.project;
        });
        if (id) editor.set({ track: id });
      },
    },
    {
      label: 'Delete Track',
      danger: true,
      onSelect: () => {
        const gone = new Set(track.events.map((e) => e.id));
        editor.apply('Delete Track', (q) => removeTrack(q, tid));
        const ui = editor.getState().ui;
        editor.set({ selection: ui.selection.filter((id) => !gone.has(id)), track: ui.track === tid ? null : ui.track });
      },
    },
    SEP,
    { label: 'Mute', checked: track.mute, onSelect: () => editor.apply(track.mute ? 'Unmute Track' : 'Mute Track', (q) => toggleTrackFlag(q, tid, 'mute')) },
    { label: 'Solo', checked: track.solo, onSelect: () => editor.apply(track.solo ? 'Unsolo Track' : 'Solo Track', (q) => toggleTrackFlag(q, tid, 'solo')) },
    { label: 'Lock', checked: track.lock, onSelect: () => editor.apply(track.lock ? 'Unlock Track' : 'Lock Track', (q) => toggleTrackFlag(q, tid, 'lock')) },
    { label: 'Rename…', onSelect: () => hooks.rename('track', tid) },
    {
      label: 'Track Height',
      submenu: (
        [
          ['Small', 36, (h: number) => h <= 40],
          ['Medium', 64, (h: number) => h > 40 && h <= 80],
          ['Large', 112, (h: number) => h > 80],
        ] as const
      ).map(([label, h, is]): MenuItem => ({ label, checked: is(track.height), onSelect: () => editor.apply('Track Height', (q) => setTrackHeight(q, tid, h)) })),
    },
    SEP,
    ...trackEnvelopeItems(track.kind === 'audio' ? ['volume', 'pan'] : ['opacity'], tid, track.envelopes),
    SEP,
    { label: 'Select All Events in Track', disabled: track.events.length === 0, onSelect: () => editor.set({ selection: track.events.map((e) => e.id), track: tid }) },
    { label: 'Track FX…', onSelect: () => emitTimelineCommand({ kind: 'trackFx', trackId: tid }) },
  );
  if (track.kind === 'audio') {
    const keys = narrationTracks(p, tid);
    const duck = track.duck;
    const noKeys = !duck && keys.length === 0;
    const setDepth = (depthDb: number) => () =>
      editor.apply('Track Ducking', (q) => setTrackDuck(q, tid, duck ? { ...duck, depthDb } : { by: keys, depthDb, attack: 0.02, release: 0.5 }));
    const remove = () => editor.apply('Remove Ducking', (q) => setTrackDuck(q, tid, null));
    items.push({
      label: 'Duck Under Narration',
      checked: !!duck,
      disabled: noKeys,
      submenu: [
        { label: duck ? 'Ducking On' : 'Enable (6 dB)', checked: !!duck, disabled: noKeys, onSelect: duck ? remove : setDepth(6) },
        SEP,
        ...[3, 6, 9, 12].map((d): MenuItem => ({ label: `${d} dB`, checked: duck?.depthDb === d, disabled: noKeys, onSelect: setDepth(d) })),
        SEP,
        { label: 'Remove Ducking', disabled: !duck, onSelect: remove },
      ],
    });
  }
  items.push({ label: 'Track Properties…', onSelect: () => emitTimelineCommand({ kind: 'trackProperties', trackId: tid }) });
  return items;
}

/**
 * Vegas "Insert/Remove Envelope ▸ Volume / Pan / Composite Level" for a track: inserting puts one point at 0 s with
 * the neutral value, which draws the envelope across the lane; double-click its line to add more points.
 */
export function trackEnvelopeItems(kinds: readonly EnvelopeKind[], trackId: string, envelopes: { volume?: Keyframe[]; pan?: Keyframe[]; opacity?: Keyframe[] } | undefined): MenuItem[] {
  return kinds.map((k): MenuItem => {
    const on = !!envelopes?.[k]?.length;
    const target: EnvelopeTarget = { scope: 'track', id: trackId, env: k };
    const name = k === 'opacity' ? 'Composite Level' : ENV_LABEL[k];
    return {
      label: on ? `Remove ${name} Envelope` : `Insert ${name} Envelope`,
      shortcut: k === 'volume' ? 'V' : k === 'pan' ? 'P' : undefined,
      onSelect: () => {
        editor.apply(on ? `Remove Track ${name} Envelope` : `Insert Track ${name} Envelope`, (q) => (on ? clearEnvelope(q, target) : addEnvelopePoint(q, target, { t: 0, v: ENVELOPES[k].dflt })));
        if (!on) editor.set({ showEnvelopes: true });
      },
    };
  });
}

/** right-click on an envelope point: delete it, or set the curve of the segment that starts at it */
export function envelopePointMenu(target: EnvelopeTarget, index: number): MenuItem[] {
  const st = current();
  if (!st) return [];
  const p = st.project;
  const keys = target.scope === 'event' ? findEvent(p, target.id)?.event.envelopes?.[target.env] : p.tracks.find((t) => t.id === target.id)?.envelopes?.[target.env];
  const k = keys?.[index];
  if (!keys || !k) return [];
  return [
    { kind: 'header', label: `${ENV_LABEL[target.env]} point · ${ENVELOPES[target.env].label(k.v)}` },
    {
      label: 'Delete Point',
      danger: true,
      disabled: keys.length <= 1,
      onSelect: () => editor.apply('Delete Envelope Point', (q) => deleteEnvelopePoint(q, target, index)),
    },
    {
      label: 'Reset Point',
      onSelect: () => editor.apply('Reset Envelope Point', (q) => addEnvelopePoint(q, target, { ...k, v: ENVELOPES[target.env].dflt })),
    },
    SEP,
    ...KEY_CURVES.map((c): MenuItem => ({
      label: c.label,
      checked: (k.curve ?? 'linear') === c.id,
      disabled: index >= keys.length - 1,
      onSelect: () => editor.apply('Envelope Curve', (q) => setEnvelopeCurve(q, target, index, c.id)),
    })),
    SEP,
    { label: `Remove ${ENV_LABEL[target.env]} Envelope`, danger: true, onSelect: () => editor.apply('Remove Envelope', (q) => clearEnvelope(q, target)) },
  ];
}

// ---------------------------------------------------------------------------
// Ruler / marker bar / loop bar
// ---------------------------------------------------------------------------
export function rulerMenu(hit: Hit, hooks: MenuHooks): MenuItem[] {
  const st = current();
  if (!st) return [];
  const { project: p, ui } = st;
  const t = Math.max(0, hit.t);
  const items: MenuItem[] = [];
  if (hit.zone === 'marker') {
    const id = hit.id;
    items.push(
      { label: 'Rename Marker…', onSelect: () => hooks.rename('marker', id) },
      { label: 'Delete Marker', danger: true, onSelect: () => editor.apply('Delete Marker', (q) => deleteMarkers(q, [id])) },
      SEP,
    );
  } else if (hit.zone === 'region') {
    const id = hit.id;
    const r = p.regions.find((x) => x.id === id);
    items.push(
      { label: 'Rename Region…', onSelect: () => hooks.rename('region', id) },
      { label: 'Select Region as Loop', disabled: !r, onSelect: () => r && editor.set({ loop: { start: r.start, end: r.end } }) },
      { label: 'Delete Region', danger: true, onSelect: () => editor.apply('Delete Region', (q) => deleteRegions(q, [id])) },
      SEP,
    );
  }
  items.push(
    { label: 'Insert Marker Here', shortcut: 'M', onSelect: () => editor.apply('Insert Marker', (q) => addMarker(q, t)) },
    {
      label: 'Insert Region from Loop',
      shortcut: 'R',
      disabled: !ui.loop || ui.loop.end - ui.loop.start <= 0,
      onSelect: () => {
        const loop = editor.getState().ui.loop;
        if (loop) editor.apply('Insert Region', (q) => addRegion(q, loop.start, loop.end));
      },
    },
    SEP,
    { label: 'Set Loop In Here', onSelect: () => editor.set({ loop: { start: t, end: Math.max(t, ui.loop?.end ?? t) } }) },
    { label: 'Set Loop Out Here', onSelect: () => editor.set({ loop: { start: Math.min(t, ui.loop?.start ?? t), end: t } }) },
    { label: 'Looping', shortcut: 'Q', checked: ui.looping, disabled: !ui.loop, onSelect: () => editor.set({ looping: !ui.looping }) },
    { label: 'Clear Loop', disabled: !ui.loop, onSelect: () => editor.set({ loop: null, looping: false }) },
    SEP,
    { label: 'Snapping', shortcut: 'F', checked: ui.snapping, onSelect: () => editor.set({ snapping: !ui.snapping }) },
    { label: 'Show Envelopes', checked: ui.showEnvelopes, onSelect: () => editor.set({ showEnvelopes: !ui.showEnvelopes }) },
  );
  return items;
}
