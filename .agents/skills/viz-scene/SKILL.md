---
name: viz-scene
description: >
  Author a 3blue1brown-style animated explainer scene with the apps/bookshelf/src/viz timeline
  toolkit. Use whenever a task asks for a "viz", "3b1b animation", "timeline
  scene", "animated explainer" of a concept (math, ML, distributed systems,
  algorithms), or to embed such a scene in a book/video. Covers the Timeline
  API, primitives, file conventions, narration, and verification.
---

# Authoring a viz scene

`apps/bookshelf/src/viz/` is a scrubbable animation suite: one `Timeline` holds every value as
channels + tweens; `sample(t)` is a **pure function of time**; a rAF `Player`
owns the only clock. Nothing self-animates — a component renders values handed
to it. This is what makes scenes seekable, editable in the Storybook Motion
panel, and syncable to narration. NEVER use `d3.transition`, `setInterval`,
CSS animations, or `Math.random()`/`Date.now()` inside a scene.

## File pattern (copy `apps/bookshelf/src/viz/explainers/fourier/` exactly)

Create `apps/bookshelf/src/viz/explainers/<slug>/` with FOUR files:

1. **`scene.ts`** — pure timeline builder + ALL math/data at module scope:

```ts
import { Timeline, ease } from '../../core';

export function buildScene() {
  const tl = new Timeline();
  const dotX = tl.channel('dotX', 200);          // name channels clearly — they
  const reveal = tl.channel('reveal', 0);        // appear in the Motion editor
  let t = 0.4;
  t = tl.caption({ at: t, dur: 3, text: 'Plain-language hook — one idea.' });
  tl.tween(reveal, 1, { at: t - 2.4, dur: 1.4, ease: ease.draw });
  t = tl.tween(dotX, 1080, { at: t, dur: 1.2, ease: ease.move });
  t = tl.hold(t, 0.8);                           // reading room between beats
  return { tl, dotX, reveal };
}
```

2. **`<Name>.tsx`** — pure render + the Player wiring (this exact shape):

```tsx
import { Player, colors } from '../../core';
import type { TimelineOverrides } from '../../core';
import { buildScene } from './scene';
import overrides from './overrides.json';

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = { file: 'apps/bookshelf/src/viz/explainers/<slug>/overrides.json', slug: '<slug>' };

export function Name() {
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player timeline={scene.tl} loop motion={MOTION}>
        {(s) => (
          <circle cx={s.get(scene.dotX)} cy={360} r={20} fill={colors.ACCENT} />
        )}
      </Player>
    </div>
  );
}
```

3. **`<Name>.stories.tsx`** — CSF3, title `'Explainers/<Human Title>'`.
4. **`overrides.json`** — exactly `{}`. The Storybook **Motion** panel saves
   timing edits into this file ("save to source"); the scene applies it on
   load, so committed JSON is the timing source of truth. Keyframe ids are
   creation-order — if you restructure `scene.ts`, reset the overrides.

## Timeline API

- `tl.channel(key, initial, interp?)` → typed ref. Default interpolator is
  d3.interpolate (numbers, colors like `'#38bdf8'`, arrays, `{x,y,k}` objects).
- `tl.tween(ch, to, { at, dur, ease })` → returns end time; chain a cursor:
  `let t = 0; t = tl.tween(...); t = tl.hold(t, 0.8);`
- `tl.set(ch, to, at)` — instant change (renders as a diamond in the editor).
- `tl.caption({ at, dur, text, tex? })` — lower-third narration beat.
- `tl.hold(at, dur)` — stillness; use between beats so captions can be read.
- `stagger(n, { at, each = 0.06, dur, ease })` — group entrances. For big
  grids, derive per-item progress from ONE channel instead:
  `cellU = (i, j) => clamp01(p * total - (i * cols + j))`.
- In render: `s.get(channel)`; `s.captions` is handled by the Player.
- Seeded randomness only: `mulberry32(seed)` / `gaussian(rand)` from core,
  called at module scope to precompute data. Heavy math (integration, DFTs,
  optimizer paths) is ALWAYS precomputed at module scope; per-frame work must
  be closed-form in the sampled values.

## Motion language (from `core/easing.ts`)

| intent | ease | duration |
|---|---|---|
| element enters | `ease.enter` | 0.5–0.8s |
| move / morph | `ease.move` | 0.8–1.5s |
| path/axis draw-on | `ease.draw` | 1.0–1.6s |
| constant processes (packets, clocks) | `ease.linear` | per distance |
| celebratory pop (badges, bars) | `ease.pop` | 0.4–0.6s |
| between beats | `tl.hold()` | 0.6–1.2s |

Captions: plain-language, curious, a little wry (3b1b tone). One idea per
caption. Math goes in `tex`/`MathLabel`, not prose.

## Primitives (`apps/bookshelf/src/viz/primitives/`) — read the file before using

- `Axes` — grid + ticks; `reveal` 0..1 draws on. Scales are d3 `scaleLinear`
  into stage coords (stage is 1280×720; keep bottom ~12% clear for captions).
- `FunctionPlot` — `f(x)` curve; `reveal` (draw-on), `morph={{from, u}}`
  (pointwise lerp — fixed 200 samples makes any curve morph structure-stable),
  `area={{sweep}}`.
- `Vec` — arrow in stage coords; `grow` 0..1, label at tip/mid.
- `NumberLine`, `Brace` — 1-D scales and interval annotations.
- `MatrixGrid` — heatmap (values 0..1); `cellU(i,j)` entrance, `highlight`
  row/col/cell, `showValues`. SVG-fine to ~400 cells.
- `ContourField` — iso-contours of `f(x,y)` (loss landscapes). Keep default
  faint fills.
- `ParticleCloud` — canvas point cloud for ≥500 points; `compute(s)` derives
  every position from sampled channels + precomputed per-point data (lerp
  between precomputed formations is the standard trick).
- `Packet` — traveling message dot, position = pure function of its `u` channel.
- `NodeBadge`, `TimerArc` — labeled system nodes + countdowns (distributed
  systems scenes).
- **Architecture diagrams** (client→server→db stories, cloud/Pulumi/AWS/Vercel
  topologies): `Zone` (labeled boundary containers — provider/region/az/vpc/
  subnet/group, nestable, draw-on + dim), `ServiceNode` (typed infra node with
  glyph + color per kind: client, browser, mobile, server, gateway, lb, fn,
  db, cache, queue, storage, search, cdn, external; `replicas` ×N chip,
  `status` ok/warn/down, `glow`), `Connection` (edges with elbow/waypoint
  routing, protocol label chips, draw-on, and an animated dash `flow` — tween
  it linearly and traffic streams along the edge), `RequestFlow` (a multi-hop
  request packet with per-waypoint dwell and an optional `roundTrip` response
  retracing the path — one linear `u` channel tells a whole request story).
- `MathLabel` (from core) — KaTeX at a stage point.
- Camera: `<Camera {...s.get(cam)}>` with a `{x, y, k}` channel — ALWAYS
  `tl.channel('cam', CAMERA_HOME, cameraInterp)` (smooth zoom; a plain lerp
  swerves on combined pan+zoom).

Missing primitive? Build a local subcomponent inside your explainer dir —
do NOT modify core/ or primitives/ in a scene PR.

## Colors (`core/colors.ts` — derived from the shelf palette)

`ACCENT` #38bdf8 (primary) · `SECONDARY` #a78bfa · `POSITIVE` #34d399 ·
`WARM` #fbbf24 (emphasis/maxima) · `NEGATIVE` #fb7185 · `MUTED` #8da2be ·
`heat(v)` sequential ramp · background is dark (#0a0e1a) — design for it.

## Narration (two-stage, by design)

- **While authoring/editing**: the Storybook **Motion** panel (tab next to
  Controls) has a 🔊 voice toggle — captions are spoken with the free
  in-browser voice during playback. Iterate here; costs nothing.
- **Publishing (ElevenLabs, only when a scene is final)**: Motion panel →
  "narration ⬇" exports `<slug>.narration.json`; then
  `npm run viz:narrate -- --script <slug>.narration.json` writes
  `public/viz-audio/<slug>.mp3` + `<slug>.cues.json` (needs
  `ELEVENLABS_API_KEY` in `.env`). Wire it:
  `<Player audio={{ url: '/viz-audio/<slug>.mp3', cues }} ...>` — the MP3
  becomes the playback clock and cues retime captions to the recording.

## Using scenes in BOOKS (the orly play surface) — v3 contract

**The scene IS the video.** A book chapter is exactly one authored scene at
`apps/bookshelf/src/viz/books/<bookSlug>/chapter-<n>.tsx`; there is no D3 diagram anymore.
`generator/video.mjs` extracts the scene's captions, narrates them with
ElevenLabs (one MP3 per chapter), and the book player plays the scene with the
MP3 as the clock — captions retimed to the recording and shown as CC.

Because of that, in book scenes **captions ARE the narration script**:
- One caption = one spoken line. Full natural sentences (1–2 per caption,
  ≤ ~220 chars), written for the EAR: no markdown, no literal paths/symbols,
  expand identifiers into words. Put exact code in on-screen labels instead.
- A chapter is typically 8–16 captions and 60–120s of timeline.
- Caption `at`/`dur` pace the silent scrub; the narration cues re-time them at
  playback, so leave breathing room (`tl.hold`) after each beat.
- **Clean endings:** never draw a closing beat over half-faded content — fade
  prior elements to ≤ 0.15, slide them off, or back the closing text with an
  opaque panel. The player's CC pill covers the bottom strip, so keep y ≳ 630
  free of load-bearing content.
- Add a colocated `chapter-<n>.stories.tsx` (CSF3, title
  `'Books/<Title>/Chapter <n>'`) so the chapter scrubs in the Motion panel.

### Book-local single-file scenes

Write `apps/bookshelf/src/viz/books/<bookSlug>/chapter-<n>.tsx` — ONE file holding layout
data, `buildScene()`, `Render`, and `vizScene`. It is **auto-registered by
glob** as slug `books/<bookSlug>/chapter-<n>` (no edit to `apps/bookshelf/src/viz/scenes.ts`,
no catalog entry — `check-viz-catalog.mjs` ignores `books/` slugs). Skeleton:

```tsx
// apps/bookshelf/src/viz/books/<bookSlug>/chapter-1.tsx
import { Timeline, Camera, CAMERA_HOME, MathLabel, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';
import { ContourField, Vec } from '../../primitives';

// Real math at module scope — motion must be EARNED, not decorative.
const LOSS = (x: number, y: number) => /* closed-form landscape */ x * x + y * y;

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME);
  const fieldU = tl.channel('fieldU', 0);
  const texU = tl.channel('texU', 0);

  // BEAT 0 — the caption IS the spoken line; camera pushes into the subject
  tl.caption({ at: 0.3, dur: 4, text: 'Every run leaves a landscape behind it.' });
  tl.tween(fieldU, 1, { at: 0.5, dur: 1.4, ease: ease.draw });
  tl.tween(cam, { x: 620, y: 348, k: 1.15 }, { at: 1.2, dur: 1.4, ease: ease.move });
  tl.tween(texU, 1, { at: 3.0, dur: 0.6, ease: ease.enter });
  tl.hold(4.6, 0.8);
  // …more beats: morph the SAME object, spotlight one thing, pull back for the payoff
  return { tl, cam, fieldU, texU };
}

const scene = buildScene();

export function Render({ s }: { s: SceneState }) {
  return (
    <Camera {...s.get(scene.cam)}>
      <ContourField f={LOSS} reveal={s.get(scene.fieldU)} />
      <MathLabel tex={'L(\\theta)'} x={980} y={140} opacity={s.get(scene.texU)} />
    </Camera>
  );
}
export const vizScene = () => scene;
```

(Add a `.stories.tsx` beside it — the Storybook glob covers `apps/bookshelf/src/viz/**`, and
the /new-book verify stage scrubs each chapter in the Motion panel; the book
player itself needs only the two exports above.)

### The narration contract (v3)

- **captions = the script.** `generator/video.mjs` reads the scene's captions
  in order and synthesizes them as the chapter's voiceover; the manifest's
  `cues` array records where each caption's first word lands in the MP3, and
  the player re-times caption display to those cues (the MP3 is the clock).
- **Never add audio inside the scene itself.** Do not run `viz:narrate` or
  pass `Player audio` in the scene/story — the book pipeline supplies the
  voice at build time; the Storybook story plays silent (or with the Motion
  panel's free voice toggle while iterating).

### Quality bar checklist (a scene ships only if all hold)

- [ ] Studied 2–3 exemplars under `apps/bookshelf/src/viz/explainers/` first (e.g.
      `almostnode-server`, `differential-dataflow`) — beat-sheet comments,
      layout constants, channel naming, restraint.
- [ ] CINEMATIC, not diagrammatic. Every chapter uses a `Camera` channel
      (push in on the subject, pull back for the payoff) AND at least one
      centerpiece beyond boxes-and-arrows: a `ParticleCloud` formation lerp,
      a `FunctionPlot` morph, a `MatrixGrid` heat/highlight, a `ContourField`,
      or an equivalent local visual machine. `Zone`/`ServiceNode`/`Connection`
      are allowed as SUPPORTING cast, never the whole show — a fixed-camera
      box diagram with a traveling dot is a FAILED chapter.
- [ ] ONE persistent object transforms across beats (dots reshape, a curve
      morphs, a tape grows and is then re-read) instead of slide-swapping
      panels. `MathLabel`/`tex` for any math — never math as plain prose.
- [ ] Highlight discipline: spotlight exactly one thing per beat, fade
      competing layers to ≤ 0.15 ("a whisper"), stagger group entrances.
- [ ] Motion language respected: `ease.enter` 0.5–0.8s, `ease.move` 0.8–1.5s,
      `ease.draw` 1.0–1.6s, `ease.linear` for packets/flows, `tl.hold()`
      between beats.
- [ ] Bottom ~12% of the stage (y ≳ 633) kept clear.
- [ ] Deterministic + pure: no `Math.random()`/`Date.now()`/`d3.transition`;
      heavy math precomputed at module scope; every frame a pure function of
      sampled channels (scrub-safe — seeking the book's audio must be exact).

### Plumbing (catalog scenes)

- **Registry**: `apps/bookshelf/src/viz/scenes.ts` — explicit `VIZ_SCENES` entries for
  catalog scenes (lazy `import()`, code-split) + the `import.meta.glob`
  auto-registration of `books/*/*.tsx`. Module contract for both: export
  `Render({ s }: { s: SceneState })` and `vizScene = () => scene`.
- **Catalog**: `generator/viz-catalog.json` lists only the shared prebuilt
  scenes; keep registry + catalog + prompt table in sync
  (`node generator/check-viz-catalog.mjs`). Book-local scenes never enter it.
- **Validator**: `generator/validate.mjs` — catalog slugs must exist in the
  catalog (unknown → dropped); `books/...` slugs must have their `.tsx` on
  disk (missing → HARD error: author the scene first); bad `beat` values are
  dropped with a warning.

## Verify before opening a PR

1. `npx tsc --noEmit` — clean.
2. Storybook lists the story: `curl -s http://localhost:6006/index.json | grep <slug>`
   (start with `npm run storybook` if not running; any free port).
3. Scrub the story — every slider position must render correctly (if something
   only looks right when played from 0, state has leaked; fix the closed form).
4. `npm run build` — still green (viz code never enters the app bundle).
