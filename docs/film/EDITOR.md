# Film Editor: a Vegas-class non-linear editor for orly-2 films

`/?film-edit=<slug>` (dev server only for save, import and render; read-only preview works anywhere).

orly-2 films are not baked footage. Each film is a deterministic function of:
- its locked timeline (`narration/timeline.json`);
- its shot modules (procedural Canvas2D painters);
- its narration line clips;
- its music cue renders;
- its mix.

The editor is a true non-linear editor over that live media:
- A **shot** is a clip whose frames are painted on demand at any source time, at full quality, by the same engine the frame-exact renderer uses.
- The preview equals the render.

Sony Vegas Pro is the reference for workflow and feel: tracks top-to-bottom, events, auto-crossfades by overlap, fade handles, event volume/opacity lines, envelopes, Event Pan/Crop, ripple, snapping, JKL, markers/regions, loop bar, Render As.

## Model (`apps/bookshelf/src/editor/model/types.ts`: THE contract)

`Project` → `media` pool + `tracks[]` (video/audio) → `events[]`. Times are seconds.

- **Source time.** An event plays `src(t) = srcIn + (t − start) × rate`.
- **Transitions.** Overlapping events on one track form a transition. For video, the later event's `transition.kind` sets the composite (default crossfade); for audio it is a crossfade using the two events' fade curves.
- **Stacking.** Track 0 is the top track and is in front.
- **Persistence.** The project is plain JSON in `films/<slug>/edit/project.json`, with the timeline view (cursor, zoom, scroll, loop) saved in `view` and restored on load. Backups go to `films/<slug>/edit/backups/<iso>.json`, keeping the last 30 (File ▸ Restore backup… lists them). Autosave writes `edit/autosave.json` every 30 s while dirty and never touches `project.json`; a newer autosave is offered for recovery on load, and a real save deletes it.
- **Splits are frame-exact.** Clicks put the cursor on the frame grid, S cuts at the nearest frame, and a drag that involves a video event quantizes even a snapped target (a narration word) to a frame. A split inside a transition (an overlap) is refused with a status message: it would restart the transition. A split inside a fade bakes the cut part of the fade into the half's volume (audio) or opacity (video) envelope, so both halves play exactly what the original did.

### Import from a film (`model/importFilm.ts`)

**V1 "Picture"** holds one shot event per timeline shot:
- A cut is a butt edit.
- A shot with `transitionIn` kind K and duration d becomes an overlap. The previous event extends by d/2 past the cut. This event starts d/2 early with `srcIn = −d/2` and `transition.kind = K`.
- The film's `duck` cues and chapters become markers. Chapters become regions.
- Each shot event and its narration line events share a group (they select and move together; the shot's beats are keyed to the film clock). Toolbar / Ctrl+Shift+U "Ignore Event Grouping" acts on single events; a line that drifts from its shot shows a red sync-offset badge in frames.

**A1 "Narration"** holds one event per line clip (`narration/clips/<lineId>.wav`):
- The clip is placed so that its speech lands exactly where `timeline.json` has the line.
- `speech` and `words` are filled on the media for snapping and captions.

**A2–A3 "Music"** holds the cues from `score/cues.json`:
- Cues use their render, `gainDb`, `fadeIn`/`fadeOut` and `start`.
- Overlapping cues alternate between A2 and A3, so their crossfades stay visible.
- The music tracks carry `duck: {by: [A1], depthDb, attack, release}` from the cue's duck settings (default 6 dB, 20/500 ms).

**V0 "Titles"** (top, empty) is for user text events.

**Round trip.** Importing the film and exporting with no edits must reproduce the film. Picture is identical frame for frame. Audio is equal within the mix's loudness tolerance: the editor has no keyed shelf or room tone, so it is close but not bit-exact. Those are listed as known differences.

## Engines

**Video compositor** (`engine/compositor.ts`, implements `VideoCompositor`):
1. Per frame, for each video track from bottom to top, find the active events.
2. Paint each into an offscreen buffer: shot via `ShotSource.paint` (the reel's shot painter, exported from `viz/film/core/reel.ts` as `createShotSource`); image, video, text or colour.
3. Apply Pan/Crop keyframes and event FX (canvas `filter` plus vignette), and opacity (level × envelope × fades).
4. Composite overlaps through transition functions. The film's registered `TransitionFn`s are reused (iris, inkBleed, paperWipe, fadeBlack, lampChange). The editor adds wipeLeft/Right, push and dipWhite.
5. Composite tracks with opacity, blend mode and track FX, then apply the optional master film finish.

Shot overlays (stage-space SVG) are returned with opacity and transform for the preview DOM stack.

**Audio engine** (`engine/audio.ts`, implements `AudioEngine`). The WebAudio graph is:
- events: BufferSource → event gain (fades × volume line × volume envelope) → event panner → event FX;
- tracks: track bus (gain, pan, track envelope, FX, mute/solo, duck) → master (gain, limiter, ceiling, meters).
- A mono source stays mono into the event panner, whose constant-power law puts it at −3 dB per channel at centre (as the film mix's ffmpeg upmix does) and at 0 dB on one side when panned hard.
- The master limiter (`engine/limiter.ts`, an AudioWorklet) is a look-ahead brickwall with FINITE memory: a sample's gain depends only on the input 80 ms before and 5 ms after it. Unlike WebAudio's compressor it never overshoots the ceiling, and an export rendered in chunks joins sample-exactly.
- Voices at rate 1 are placed on the sample grid (buffer sample m always plays at context sample m + align), so a voice that straddles an export chunk's start plays the same samples as in a one-shot render.

`renderOffline` builds the identical graph in an `OfflineAudioContext`, so export equals preview:
- Ducking is computed deterministically. Gain automation on the ducked bus is derived from the union of the keying tracks' event speech spans (attack/release ramps to −depthDb), the same in live and offline graphs.
- A live edit during playback replaces only the voices of events that changed (by identity, effective fades or medium).
- Fade and keyframe curves have one definition (`engine/envelope.ts curveShape`): a fade-out is the time mirror of the same-named fade-in, for sound, picture and the timeline drawing alike.
- `peaks()` serves waveform drawing from cached decoded buffers.

**Clock.** While playing, `audio.now()` is the master clock and the preview paints the frame for it on rAF. When stopped, the cursor drives the picture. Scrubbing calls `audio.scrub`.

## Server (`apps/bookshelf/editor-server.ts`, a Vite plugin, `apply: 'serve'`)

| Method | Route | Purpose |
|---|---|---|
| GET | `/__editor/films` | films that have a timeline: `[{slug, title, duration, hasProject}]` |
| GET / PUT | `/__editor/project/<slug>` | load or save the project; save writes a backup and validates the JSON (and drops a pending autosave) |
| PUT | `/__editor/project/<slug>?autosave=1` | write `edit/autosave.json` (validated; no backup; `project.json` untouched) |
| GET / DELETE | `/__editor/project/<slug>/autosave` | the autosave for recovery, or discard it |
| GET | `/__editor/project/<slug>/backups[/<file>]` | list the backups, or fetch one |
| GET | `/__editor/film/<slug>` | everything the importer needs: timeline, cues, lines, clips list and on-screen text |
| GET | `/__editor/media/<slug>/<path>` | streams files under `films/<slug>/` with HTTP Range (narration clips, score renders, imported media) |
| POST | `/__editor/import/<slug>` | uploads a media file into `films/<slug>/edit/media/` and returns its media entry (probed with ffprobe) |
| POST | `/__editor/render/<slug>` | `{from?, to?, width?, height?, fps?, preset}` starts `generator/film/edit-render.mjs` |
| GET | `/__editor/render/<slug>/status` | progress |

Every request's Host must be localhost, an IP literal or listed in `server.allowedHosts` (checked before anything else: the routes run ahead of Vite's own host check, so this is what stops DNS rebinding). Writes also need an Origin from that list and a loopback peer. Media responses carry `X-Content-Type-Options: nosniff` and `Content-Security-Policy: sandbox`.

## Export (`generator/film/edit-render.mjs`)

Frame-exact, reusing the film render infrastructure (`lib/browser`, `lib/site`, `lib/ffmpeg`).

**Harness.** `/?film-edit-render=<slug>[&project=<url>]` exposes `window.__edit`:
`{ready, fps, duration, width, height, seek(t) → after paint, renderAudio(from, to) → base64 PCM16 chunk}`.

**Audio.** Exported in 60 s chunks through `renderOffline` (each with a pre-roll covering the limiter's memory and FX tails, and the limiter's look-ahead trimmed), then written as a WAV. Chunks join sample-exactly (the smoke test checks a seam under sustained limiting).

**Video.** Segments are captured by workers as in `render.mjs` (JPEG via CDP, x264).

**Mux.** ffmpeg muxes `films/<slug>/edit/exports/<name>.mp4`, adding chapters from regions.

**Checks.** The frame count is right, and audio and video lengths agree within one frame.

## UI (`editor/ui/*`, dark Vegas-style chrome; React and canvas, no new dependencies)

```
┌ menu bar: File Edit View Insert Tools Help ─────────── toolbar (save, undo/redo, snap, ripple, auto-xfade, tools) ┐
├ Explorer tabs: Project Media | Transitions | Video FX | Generators | Markers ┬ Video Preview (transport, TC, quality, overlays toggle) ┤
├──────────────────────────────────────────────────────────────────────────────┴──── Inspector (event / track / project) ──┤
├ track headers │ ruler (TC, markers, regions, loop bar) ─────────────────────────────────────────────────────── │ meters │
│ V0 Titles     │ [event][event]                                                                                         │  L R   │
│ V1 Picture    │ [shot thumb ▸▸▸]⨯[shot]…                                                                               │        │
│ A1 Narration  │ [~~wave~~][~~wave~~] …                                                                                 │        │
│ A2 Music      │ [~~~~ cue ~~~~]                                                                                        │        │
└ status bar: cursor TC, selection length, zoom, dirty/saved, render progress ──────────────────────────────────────────────┘
```

### Timeline (`ui/timeline/*`)

**Drawing.** The lanes are drawn on one canvas (with a DPR backing store), virtualised to the visible range:
- shot thumbnails (`compositor.thumbnail`, painted synchronously by the compositor and scheduled in idle time by the timeline's cache, which retries a miss when the compositor's `onInvalidate` says media became ready) and waveforms (`audio.peaks`, scaled by the event volume);
- fade handles and curves, the event volume/opacity line (tinted when boosted above 0 dB), event envelope points, and track envelopes across their lanes;
- FX and Pan/Crop buttons at an event's top right (click to open), a red sync-offset badge on a drifted narration line, and a red title strip on a shot that failed to paint;
- transitions as an ✕ over the overlap;
- markers and regions, the loop bar, the cursor and the play head.

**Interaction:**

| Area | Behaviour |
|---|---|
| Selection | click, shift (range), ctrl/cmd (toggle); marquee with the Selection tool or Ctrl-drag on empty track space |
| Time selection | drag empty track space (Normal tool) or the loop bar |
| Move | drag events within or across same-kind tracks; ripple per mode; a purely vertical drag keeps the time. The Video Preview shows the drag live (a trim shows its edge frame) |
| Edges | trim with source limits for files; shots are unlimited |
| Slip and rate | alt-drag slips (`srcIn`); ctrl-drag an edge to time-stretch (rate) |
| Fades and levels | drag the top corners for fades; drag the top edge for event volume/opacity |
| Envelopes | double-click an envelope line to add a point; drag the line (inserts a point) or a point; double-click or right-click ▸ Delete a point; right-click a point for its curve. Track envelopes: track menu ▸ Insert Volume / Pan / Composite Level Envelope, or V / P |
| Snapping | to the cursor, event edges, markers, regions, frames, and narration word boundaries (from media `words`) |
| Zoom and scroll | ctrl/cmd+wheel or +/- to zoom around the cursor; wheel to scroll; shift+wheel to scroll horizontally (View ▸ Mouse wheel zooms swaps wheel and ctrl+wheel, the Vegas default) |
| Drops from the Explorer | media and generators insert at the snapped drop time on the track under the pointer; a transition goes on the nearest cut; a Video FX onto an event (or the selection it is in), or onto a lane or header for track FX (`ui/dnd.ts` contract, `ui/timeline/drop.ts`) |

**Track headers:** name (double-click to rename), M, S and lock, a level slider (dB or %), pan (its own row on a tall track, a compact knob on the volume row otherwise), an FX button, a duck indicator (click: the Track inspector's Ducking; remove it from the track menu), drag to reorder, and resize height.

### Shortcuts (Vegas)

| Key | Action |
|---|---|
| Space | play/stop (stop returns to the play start) |
| Enter | play/pause (pause leaves the cursor) |
| J / K / L | shuttle (repeat L for 2×, 4×) |
| ← / → | frame step |
| Ctrl+← / Ctrl+→ | previous/next edit point |
| Home / End | start / end |
| S | split at the cursor (the selected events under it; with nothing selected, every event under it on every unlocked track) |
| Delete | delete |
| Ctrl+X / C / V | cut, copy, paste at the cursor (also in the event menu) |
| Ctrl+Shift+V | paste insert (ripples later material) |
| Alt+[ / Alt+] | trim the selection's start / end to the cursor |
| Ctrl+Z / Ctrl+Shift+Z (Ctrl+Y) | undo / redo |
| M | marker |
| R | region from the loop bar |
| Q | toggle looping |
| I / O | loop in / out |
| F8 (or F) | snapping |
| 0–9 | go to marker 1–9 (0: marker 10) |
| D | cycle edit tools |
| V / P | insert or remove the focused track's volume (video: composite level) / pan envelope |
| Ctrl+Shift+U | ignore event grouping |
| Ctrl+L | cycle ripple mode |
| Ctrl+S | save |
| Ctrl+Shift+N | new text event (on the top-most video track that is free there, else a new track on top) |
| Ctrl+D | open the Event Pan/Crop (non-modal: the transport keys keep working) |

Timecode reads `HH:MM:SS:FF`; `;` before the frames only at drop-frame rates (29.97, 59.94). Undo grouping is per gesture: a slider drag is one step however long it pauses (pointerup and focusout seal it). Ctrl+Z in an Inspector field commits the field and undoes it.

## File ownership (parallel build: each builder edits ONLY its files)

| Area | Files |
|---|---|
| model | `editor/model/{ops,history?,snap,importFilm,validate,id}.ts`, `editor/model/*.test.ts` (node --test, erasable TS only) |
| video | `viz/film/core/reel.ts` (add `createShotSource` export, no behaviour change), `editor/engine/{compositor,transitions,fx,pancrop,text}.ts`, `editor/render/EditRenderHarness.tsx` |
| audio | `editor/engine/{audio,wav,envelope,duck}.ts`, `editor/engine/*.test.ts` |
| server and export | `apps/bookshelf/editor-server.ts`, `apps/bookshelf/vite.config.ts` (register the plugin), `generator/film/edit-render.mjs`, `package.json` scripts (`film:edit-render`, `editor:test`) |
| timeline | `editor/ui/timeline/*` |
| shell | `editor/ui/{Editor,MenuBar,Toolbar,Explorer,Preview,Inspector,PanCropDialog,RenderDialog,StatusBar,Meters,shortcuts,theme,dnd}.tsx/.ts`, `editor/ui/editor.css`, `apps/bookshelf/src/App.tsx` (routes) |
| shared, fixed | `editor/model/types.ts`, `editor/state/store.ts`. Builders may ADD fields only with a note in the report; the integrator reconciles. |

**Store rule:** `useEditor(sel)` selectors must return primitives or existing references, never fresh objects or arrays.

## Verification

- `npm run editor:test`: model ops (split, split guards and fade baking, trim, ripple, slip, move with snapping and frame quantizing, grouping, sync offsets, import round-trip invariants), gesture-based undo grouping, envelopes and fades, duck, the master limiter (ceiling, transparency, finite memory), WAV encoding, the dev-server helpers (including the host check) and the timeline gestures.
- `npx tsc -p apps/bookshelf/tsconfig.json --noEmit` and `npx tsc -p apps/bookshelf/tsconfig.node.json` (Vite config + dev server) are clean (`npm run typecheck` runs both).
- **Playwright smoke** (`node tools/film/editor-smoke.mjs [--slug <slug>]`, against the dev server on :5199, which it starts when it is not answering; screenshots and exports in `.orly-work/editor/`):
  1. open `?film-edit=<slug>` (importing when there is no project), and expect no page errors;
  2. screenshot the full UI;
  3. play 2 s and confirm that the audio clock advanced and the preview changed;
  4. editing feel: a click lands on a frame; S with nothing selected splits every track; S inside a transition is refused; an Alt-drag slip shows live in the preview and Esc cancels it; late shot thumbnails fill in by themselves;
  5. split, undo and redo; save and reload; then restore the import and save it; drag a generator and a Video FX from the Explorer onto the timeline, and undo them; autosave leaves `project.json` alone; a foreign Host is refused;
  6. export 0:00–0:06 through `POST /__editor/render` and ffprobe it: 144 frames at 24 fps, with audio, lengths within a frame;
  7. **round trip (picture):** export a 10 s window of the unedited import from the first transition and compare it (PSNR ≥ 35 dB) with the same frames from the film's own render harness, and with `render/film.mp4`. The film.mp4 comparison gates only while film.mp4 is newer than the clock and the shot modules; an older film.mp4 shows an older cut, and the smoke says so;
  8. **round trip (audio):** the whole import through `__edit.renderAudio` against `mix/master.wav`: loudness within 1 LU, sample peak at the limiter ceiling; and a chunk seam under sustained limiting (170–190 s in one render vs two chunks) within 2 LSB.

**Known differences from the film mix.** The editor has no keyed music low shelf, music high-pass, narration 70 Hz high-pass or room-tone floor. Narration dynamics are static gains (the stem's measured compressor and peak-stage reduction). The integrated loudness still lands within about 0.3 LU of the master.
