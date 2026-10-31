---
name: film-promo
description: >
  Author a shot for an orly-2 PROMO film (a product-marketing film, script.json "look": "promo", rendered
  frame-exactly in JavaScript): the defineShot contract with the dom() layer, the promo kit (hazes, bracketed
  kinetic type, typed prompts, step lists, pills, the agent pair), RrwebScreen for cleaned rrweb recordings of
  the product (seek, crop, zoom, tilt, cursor), narration-anchored timing and the contact-sheet verification loop.
  Use for shots of any film whose films/<slug>/look.md says look "promo", and in the film-shots workflow with look promo.
---

# Promo shots

A promo shot is the same frame-exact `defineShot` module as a documentary shot, but in the **promo register**:
read the film's `films/<slug>/look.md` (its devices, palette, the takes and their marks) and Read its reference frames
`films/<slug>/reference/contact-sheet.jpg` first. Ignore silhouette, puppet and multiplane craft.

## Files

| what | where |
|---|---|
| the kit | `apps/bookshelf/src/viz/film/promo/` (`look.ts` painters, `RrwebScreen.tsx`, `index.ts` agentPair + transitions + finish) |
| a film's shots | `apps/bookshelf/src/viz/films/<slug>/shots/<shotId>.tsx` |
| the clock | `apps/bookshelf/src/viz/films/<slug>/timeline.json` (LOCKED; never edit) |
| product footage | `public/generated/<slug>/rr/<take>.json` (cleaned rrweb takes: `duration` ms, `marks` {name: ms}) |
| take contact sheets | `node tools/promo/rr-sheet.mjs --slug <slug> --take <take> [--n 8 \| --at 0,1200,…]` → `.orly-work/promo/sheets/<take>.png` |
| smoke example | `apps/bookshelf/src/viz/films/promo-kit/shots/ch01-s0{1,2}.tsx` |

## The shot module

```tsx
import { Timeline, ease } from '../../../core';
import { defineShot } from '../../../film/core/shot';
import { PROMO, RrwebScreen, bracket, env, haze, kinetic, paper, steps, typed, agentPair, mark, takeIfLoaded } from '../../../film/promo';

const SLUG = 'replay-qa-promo';
export default defineShot({
  id: 'ch02-s01',
  mood: 'parchment',                         // required by the contract; promo shots paint their own background
  build({ timing: T }) {
    const tl = new Timeline();
    const tape = tl.channel('tape', 0);      // ms into the take, driven by the clock
    const typedAt = T.word('L0201', 'point') - 0.1;
    tl.tween(tape, 5200, { at: typedAt, dur: 3.2, ease: ease.linear });   // play the take's typing at real speed
    const zoom = tl.channel('zoom', 1);
    tl.tween(zoom, 1.9, { at: T.word('L0202', 'staging'), dur: 0.9, ease: ease.enter });
    tl.hold(0, T.duration);
    return { tl, tape, zoom, typedAt };
  },
  paint(f, s, scene) {                       // canvas: background, type, diagrams (f.c is in stage px, 1280×720)
    const c = f.c, t = f.t;
    paper(c);
    haze(c, { t, preset: 'dawn', u: 0.4, y0: 0.5 });
    typed(c, { text: 'staging.your-app.dev', t, at: scene.typedAt, cps: 14, x: 90, y: 150, size: 64 });
  },
  dom(s, scene) {                            // DOM: product footage (frame-exact rrweb), above the canvas
    return (
      <RrwebScreen slug={SLUG} take="new-project" at={s.get(scene.tape)}
        box={{ x: 600, y: 210, w: 600 }} chrome="browser" url="qa.replay.io"
        tilt={{ x: 6, y: -14 }} zoom={{ x: 720, y: 330, scale: s.get(scene.zoom) }} cursor />
    );
  },
});
```

- `paint` draws the canvas (under the DOM layer); `dom` returns the product footage; `overlay` (SVG) sits above both
  if you need type ON TOP of a screen (or draw that type in a second RrwebScreen-free shot).
- Sample a take with a channel in **ms** (`tape`), tweened against the clock: real speed = 1000 ms per s; hold it to
  freeze a frame; speed it up ×1.5–2 through scrolls; never run past `take.duration`.
- Marks: `mark(takeIfLoaded(SLUG, 'bug-react'), 'rootcause')` gives the ms of a named moment once the take is loaded;
  in `build()` prefer the literal ms values from the take's `marks` (they are fixed in the cleaned file).

## RrwebScreen (props)

`slug, take, at` (ms) · `box {x, y, w}` (stage px; height follows the recording's aspect, or `crop`) ·
`chrome 'browser'|'none'` + `url` · `tilt {x, y, z}` (deg, perspective 1800) · `zoom {x, y, scale}` (magnify around a
recording-px point; the viewport is 1440×900) · `crop {x, y, w, h}` (recording px: show only part of the page, e.g. the
bug title, a status column) · `cursor` (drawn cursor + click pulses from the take) · `opacity` · `radius` · `shadow`.

Legibility: at 1080p a 1440-px recording shown 600 stage px wide renders its 13-px UI text at ~8 px: too small to read.
For anything the viewer must READ, `crop` to the region and show it ≥ 900 stage px wide, or `zoom` ≥ 1.8 on it.
Full-page views are for a beat of context (≤ 1.5 s) or as one tile in a collage.

## The promo kit (look.ts; header comment has every option)

`paper` · `haze {preset: dawn | ember | violet | rose | brand, u, y0, drift}` · `hairlines` · `squareDots` ·
`bracket {text, x, y, size, u, out, dots: corners | wide | none}` · `kinetic {words: [{text, at}], t, x, y, size, align,
grad, out}` · `typed {text, t, at, cps, x, y, size, caret, align}` · `steps {title, items: [{icon, label, detail, at, done,
color}], working}` · `pill {x, y, text, color, u}` · `blurText` · `icon(c, kind, …)` (sparkle map play rewind bug clock
branch check film server) · `replayMark(c, x, y, h)` (the Replay logo mark) · `counter(n, t, at, dur)` ·
`env(t, at, dur, fade)` · `smooth/easeOut/easeInOut` · `PROMO` colours · `SANS/MONO` fonts.
From index.ts: `agentPair {t, x, y, scale, exchanges: [{at, verdict, ok}], labels, chip, u}` (the subtle developer ↔
critic beat). Transitions: `blur`, `whip` (plus the core `cut`, `crossfade`, `fadeBlack`).

## Rules

1. **Pure:** no Math.random / Date.now / rAF / CSS animation in shots. RrwebScreen is seeked per frame; never "play" it.
2. **Truthful:** numbers and claims only from the script (fact-checked) and what the take really shows at those marks.
   Never add secrets, e-mails or tokens; the takes are redacted, keep it that way.
3. **Legible:** text ≥ 22 px cap-height-equivalent at 720p stage scale for anything the narration relies on; product
   text the viewer must read is cropped/zoomed (above); type sits on paper or a soft plate, never on a busy screen.
4. **On the beat:** reveals land on the word that names them (0.1–0.3 s early); cuts and type hits on downbeats.
5. **One accent:** Replay red-pink on paper; green only for ✓/good, coral for ✕.
6. **Scoped edits:** only your shot files (and `sets/<shotId>-*.ts`); never edit timeline.json or the kit (report kit
   needs in your result instead).

## Verify (every shot, every revision)

```bash
npx tsc -p apps/bookshelf/tsconfig.json --noEmit
node generator/film/sheets.mjs --slug <slug> --shot <shotId>      # contact sheet (frame every 2 s + every beat)
node generator/film/stills.mjs --slug <slug> --times <abs s,…>    # full-res stills at chosen moments
```

The harness waits for rrweb takes to load (core/pending) before each frame. Read the sheet: composition against the
reference frames, legibility of product text, beats on words, no blank or loading screens, no dom() error label.
Live: `http://127.0.0.1:5199/?film-studio=<slug>`.
