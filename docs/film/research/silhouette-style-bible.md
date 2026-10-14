# Silhouette Style Bible: orly-2 long-form films

Art direction for long-form (20–40 min) educational animated films rendered in JavaScript (SVG + Canvas2D on deterministic `sample(t)` timelines). The look is silhouette / paper-cut theatre: black cut-out figures and architecture, backlit dusky gradients, haze, candle glow and multiplane depth.

This document is a **style system**, not a story. Every number below was measured from the reference frame or checked in a working probe render (§12).

- Reference frame: `.orly-work/reference/silhouette-reference.png` (1074×616, a 35:37 film paused at 9:57).
- Probe kit (Canvas2D, deterministic): `.orly-work/probes/silhouette-style/silhouette-kit.js`
- Palette generator (CIELAB ladder → hex): `.orly-work/probes/silhouette-style/palette.mjs` → `palettes.json`
- Renderer (Playwright, 1920×1080): `.orly-work/probes/silhouette-style/render.mjs` (`node render.mjs moods|trans|clip`)
- Outputs: `.orly-work/probes/silhouette-style/out/` (`mood-*.png`, `contact.png`, `trans-*.png`, `clip.mp4`, `clip-ends.png`)

All pixel numbers are at **1920×1080**. The orly engine stage is 1280×720 (`apps/bookshelf/src/viz/engine/core/stage.tsx:3-4`), so multiply by **0.667** for stage units. `CanvasLayer` already supersamples ×2 (`engine/core/canvas-layer.tsx:5`), so a 1280×720 stage canvas has a 2560×1440 backing store, which is enough for 1080p output.

---

## 0. What the reference actually does (measured)

I sampled the reference frame in 30×30 px patches (`sample.mjs`) and converted the results to CIELAB with d3-color:

| Element | Hex | L* | C* | h |
|---|---|---|---|---|
| Action figure, mid-left (darkest ink) | `#13100e` | 4.9 | 1.7 | 57 |
| Action figure, right (slightly hazed) | `#241c19` | 11.2 | 5.1 | 45 |
| Framing pillar (FG, right edge) | `#191210` | 6.2 | 3.7 | 37 |
| Checker floor, light / dark tile | `#342d27` / `#27211c` | 19 / 13 | 6 | 65 |
| Back wall, upper | `#3c2d24` | 20.0 | 10.5 | 55 |
| Back wall, panel | `#48362e` | 24.5 | 11 | 49 |
| Side wall (mirror) | `#5b463d` | 31.8 | 12 | 48 |
| Window panes, upper | `#715348` | 38.3 | 16.5 | 45 |
| Window panes, middle | `#8c6b61` | 48.4 | 16.6 | 41 |
| Window panes, at horizon (brightest) | `#ad8b76` | 60.7 | 19.8 | 56 |
| Haze band at table height | `#68584b`–`#776558` | 39–44 | 11–12 | 60–63 |
| Candle halo | `#a88257` | 57.4 | 31 | 69 |
| Candle core | `#ecd492` | 85.8 | 36 | 87 |

What I take from these measurements:

1. **A fixed value ladder does the work, and colour stays quiet.** Chroma stays at or below 20 everywhere except the practical light (candle, C* 31–36). The mood comes from hue. Readability comes from lightness.
2. **Silhouettes are never pure #000.** They are warm near-black at L* 5. A figure one layer deeper is lifted to about L* 11 by the haze.
3. **Figures are staged against light.** Both figures stand in front of window bays (L* 38–61), so the local contrast is ΔL* ≥ 33. Neither figure overlaps the dark wall.
4. **Backlight brightens toward the horizon.** The vertical profile of the window column peaks at about 58% of frame height, not at the top. It reads as a low sun behind the glass.
5. **There is one haze band, not uniform fog.** The haze peaks at table height (≈ y 0.48–0.62 of the frame) and dissolves the legs of the furniture behind the table.
6. **Figures carry inner cut-lines.** Light hairlines inside the black shapes mark coat seams, a row of buttons, cuffs and the curls of the periwig. They read like knife cuts letting light through. Lace (the cravat) is rendered as a *semi-transparent* light grey.
7. **Ornament lives in the midground.** Pierced chair splats, a mace, a tassel fringe and gothic tracery are all in the set layers. The action figures stay simple.
8. **The foreground is the darkest layer.** The pillar, the near floor and the table end sit at L* 6–19. They frame the image and anchor depth.
9. **The glow is local.** The candle has a hot core and a soft amber halo of about 80 px that warms the chair behind it, with no global bloom. About 15% of the frame is darker than L* 8 (measured: 0.153 of the pixels have luminance < 20/255).

---

## 1. Lineage and the techniques we borrow

| Source | What it is | Technique we take |
|---|---|---|
| **Lotte Reiniger**, *Die Abenteuer des Prinzen Achmed* (1926), the oldest surviving animated feature, made in Potsdam 1923–26 with Walter Ruttmann, Berthold Bartosch and Carl Koch | Hinged black-card and thin-metal puppets, animated frame by frame on a glass table lit from below, shot from above. Backgrounds were layered on several glass planes, a multiplane setup about a decade before Disney's multiplane camera (1937). Release prints were **tinted per sequence** (amber interiors, blue nights, green etc.). | (a) Jointed puppets with overlapping hinge lobes. (b) Layered glass planes, i.e. our multiplane. (c) **One tint per sequence**, i.e. our mood palettes (§2). (d) Strict profile staging. (e) Translucent tissue layers for atmosphere, i.e. our haze sheets. |
| **Michel Ocelot**, *Ciné si* (1989), *Princes et Princesses* (2000), *Les Contes de la nuit* (2011) | Strict-profile black silhouettes against jewel-bright, ornamental, luminous backgrounds. Theatrical framing (storytellers in a little cinema stage each tale). Very economical motion, and sometimes a single light eye-glint. | (a) Backgrounds carry the richness while the figures stay simple. (b) Ornamental pattern as a mood carrier. (c) The **eye-glint** used sparingly for moments of insight. (d) A "storyteller's frame": a proscenium we can return to between eras. |
| **"The Tale of the Three Brothers"**, from *Harry Potter and the Deathly Hallows – Part 1* (2010), directed by Ben Hibon with Framestore | A CG homage to shadow puppetry. The figures are elongated and spindly with visible articulation, in a grey-umber palette with gold accents. Smoke and ink-like dissolves, and a camera that travels *through* flat layered sets. | (a) A camera that dollies through flat planes, i.e. our parallax. (b) Elongated proportions (9 heads) reserved for mythic or allegorical beats. (c) Ink/smoke dissolve transitions. |
| **Shadow theatre**: Chinese *piyingxi* (translucent, dyed hide puppets on rods), Indonesian *wayang kulit* (perforated hide, lit by a flickering oil lamp, the *blencong*), Turkish *Karagöz* | Light passes *through* the puppet's perforations. Colour shows through translucent hide. A flickering flame source. | (a) **Interior cut-lines and perforations** (wayang chisel work) as our detail language. (b) Translucent coloured panels for special sequences. (c) Flicker as a living-light signature. (d) **Shadow-screen depth mode** (§3.4). |
| **Limbo** (Playdead, 2010) / **Inside** (2016) | Monochrome silhouettes, heavy film grain, strong vignette, foreground and background defocus, layered fog, and a black protagonist with two white eye dots. | (a) Defocus as a depth cue (FG blur > BG blur). (b) Grain and vignette as the "finish". (c) Fog sheets between planes. (d) Restraint. |
| **Scherenschnitte**, Kara Walker's cut-paper tableaux, Hans Christian Andersen's paper cuts | Cut paper as narrative tableau, with history told in profile. | The tableau composition: a single-plane frieze for "document" moments such as a timeline, a lineage or a debate. |

---

## 2. Palette and lighting model

### 2.1 The value ladder (fixed across all moods)

Every mood uses the **same CIELAB lightness ladder**, measured from the reference. Only hue and chroma change. This keeps readability identical whether a scene is dusk-rose or server-cyan.

| Token | Role | L* |
|---|---|---|
| `fg` | framing occluders (pillars, curtains, near branches) | 2.5 |
| `ink` | action-plane silhouettes | 5 |
| `set` | midground architecture and furniture (before haze) | 22 |
| `sky[0]` | backlight, top of frame | 24 |
| `setHaze` | set pieces seen through haze | 34 |
| `sky[1]` | backlight upper | 38 |
| `haze` | fog sheet colour | 44 |
| `sky[2]` | backlight middle | 49 |
| `halo` | practical-light halo | 60 |
| `sky[3]` | backlight horizon peak (at 58–62% of frame height) | 62 |
| `rim` | rim light and inner cut-lines | 74 |
| `core` | flame, LED or screen core | 88 |

**Rule:** an action silhouette's local background must be L* ≥ 30 (ΔL* ≥ 25 from ink). The QA pass can check this by sampling a 12 px ring around each puppet's bounding box.

### 2.2 Mood palettes (generated by `palette.mjs`, checked: every mood lands on L* 24/38/49/62/22/44/5/88)

| Mood | Use | sky ramp (top → horizon) | set | setHaze | haze | fg | ink | rim | halo | core |
|---|---|---|---|---|---|---|---|---|---|---|
| **duskRose** | the reference look: formal rooms, scholarly debate, the "classical" register | `#49342e #705248 #8e6c62 #b18e79` | `#413129` | `#5e4c43` | `#776457` | `#0d0805` | `#14100e` | `#d8ac93` | `#af895d` | `#f5d998` |
| **candleAmber** | night study, a single mind working, intimacy | `#493428 #71533a #916d45 #b58f54` | `#423126` | `#5f4c3f` | `#7b634d` | `#0f0803` | `#15100c` | `#ddad64` | `#b78744` | `#f3da90` |
| **winterBlue** | AI winters, snow, loss, funding cuts | `#2e3b47 #485c6d #637887 #8899a1` | `#2e363d` | `#48515a` | `#5f6a72` | `#050a0f` | `#0d1115` | `#a5b9c4` | `#7b95a0` | `#e1ddca` |
| **labGreen** | 1950s–80s labs: fluorescent tubes, phosphor CRTs, institutional rooms | `#303c37 #4a5e52 #667a65 #90997c` | `#2d372f` | `#47534a` | `#606b5c` | `#050b07` | `#0e1210` | `#afba96` | `#899666` | `#dee0a5` |
| **dawnGold** | breakthroughs, thaw, renaissance (backprop return, 2012) | `#3b3744 #6f524f #956b43 #b3903e` | `#41312a` | `#5f4c43` | `#7b6349` | `#0f0704` | `#15100d` | `#daaf48` | `#b08a41` | `#f2db85` |
| **serverCyan** | data centres, GPUs, the scaling era | `#2d3a4e #3d5e6e #477d87 #62a1a2` | `#28373e` | `#41535a` | `#4b6e73` | `#010b10` | `#0a1216` | `#75c3c5` | `#36a0a3` | `#92edea` |
| **emberRed** *(extra)* | rivalry, race, high stakes; use sparingly | `#4d3136 #804a49 #a66155 #cc8368` | `#462f2e` | `#644948` | `#865e56` | `#100707` | `#160f0f` | `#f99e7d` | `#d0794e` | `#fcd791` |
| **parchment** *(extra, inverted)* | technical "plates": diagrams, equations, maps. Ink on paper, maximum legibility | `#e9dcc3 #e4d4b8 #ddcaa9 #d3bd98` | `#b9a27e` | `#cbb791` | `#efe5d2` | `#2a211b` | `#1a1310` | `#fff6e6` | `#f2c879` | `#fff3d0` |

How the colours are derived (from `palette.mjs`; regenerate rather than hand-edit):

```js
// L* fixed per token; per mood choose [hue, chroma] in HCL
const L = { ink:5, fg:2.5, set:22, setHaze:34, sky:[24,38,49,62], haze:44, halo:60, rim:74, core:88 };
hex = d3.hcl(h, c, L.token).formatHex()  // fall back to c*0.8 if out of gamut
```

Mood changes between sequences are a 1.5–3 s **palette crossfade**: interpolate every token in Lab (`d3.interpolateLab`). This is Reiniger's per-sequence tint made continuous.

**Accent budget:** at most **one** saturated accent per shot, and it must be motivated by a practical light (a flame, a phosphor screen, a GPU LED). Accent pixels should cover ≤ 3% of the frame.

### 2.3 Backlight model

```js
// L0 backlight: vertical ramp whose brightest stop sits at the horizon line (0.58–0.62 H), then a wide low "sun" ellipse
g = linearGradient(0,0 → 0,H): [0: sky0] [0.30: sky1] [0.50: sky2] [horizon: sky3] [1.0: sky2]
r = radialGradient(cx=W*0.5, cy=H*horizon, r0=0, r1=0.55W): [0: rim @0.35α] → [1: rim @0]
```

- Move the sun ellipse's `cx` with the story: it can trail a character, or sit behind the "idea" object.
- Windows, doors and arches are **holes in the wall layer** (evenodd fill), never shapes painted on top. The backlight then shows through *every* opening consistently, including fretwork, keyholes and the gaps in pierced chair splats.

### 2.4 Atmospheric perspective

The fill colour for a layer at haze amount `h` is `mix(set, haze, h)` for architecture, and `mix(ink, haze, h)` for figures and props on deeper planes.

- Apply this **in the fill colour itself**. It costs nothing, needs no extra pass, and avoids grey "veils".
- Architecture that frames the backlight (window walls) keeps `h ≤ 0.2`. When the probe used 0.45, the walls rose to nearly the brightness of the glass and the windows stopped reading. At 0.18 the probe measured: upper wall L* 26.9, wall at haze height L* 33.9, glass L* 62.0, ink L* 6.5, floor L* 13.0. That matches the reference ladder.
- **Fog sheets** are vertical-gradient rectangles drawn *between* layers:

```js
hazeSheet(yCenter=0.60H, height=0.40H, alpha=0.30)  // between back wall and midground
hazeSheet(yCenter=0.70H, height=0.22H, alpha=0.12)  // between midground and action plane
// stops: 0 → α0, 0.55 → α, 1 → 0.4α   (peaks just below centre, i.e. "ground fog")
```

- Drift the fog sheets horizontally at 4–12 px/s using a seeded fbm offset. This is the only "always moving" element besides flame flicker, and it keeps holds alive.

### 2.5 Glow and bloom

- **Practical light** (candle, lamp, LED, screen) uses three additive radial gradients (`globalCompositeOperation='lighter'`):
  - outer room glow r = 260 px, α 0.16, colour `halo`
  - inner halo r = 70 px, α 0.35, colour `halo`
  - hot core r = 22 px, α 0.75, colour `core`
  - plus the flame shape itself, filled with `core`
- **Flicker** is a deterministic fbm of quantised time:

```js
tq = floor(t*24)/24;  k = 1 + 0.07*fbm(tq*9.0, seed);  sway = 1.2px * fbm(tq*3.1, seed+5)
```

  This gives ±7% intensity and a ±1.2 px flame-tip sway. Each light needs its own seed, otherwise the lights pulse in sync. Fluorescent tubes are the exception: a 1-frame dropout to 0.85 every 6–14 s (seeded), with no continuous flicker.
- **Bloom (global):** draw the frame at quarter resolution with the filter `brightness(1.5) contrast(2.4) blur(6px)`, then composite the result with `screen` at α 0.22. Only near-highlights survive the contrast step, so the blacks stay black: the probe's ink measured L* 6.5 after bloom.
- **Light wrap:** when a figure overlaps a practical light, the light's halo is drawn *after* the figure on the near side. The silhouette edge "melts" by 2–4 px into the glow, which is the single most photographic cue available.

### 2.6 Rim light and inner cut-lines

**Rim light (crescent).** The rim is the silhouette minus the same silhouette shifted *away* from the key light, tinted `rim`, at α 0.55. The offset is 2.0 px at 1080p (1.3 px on the stage).

```js
off.drawImage(actionLayer); off.gco='source-in'; off.fill(rim)
off.gco='destination-out'; off.drawImage(actionLayer, -dir.x*2, -dir.y*2)
main.globalAlpha=0.55; main.drawImage(off)
```

Only the action plane gets a rim; deeper planes never do. Set `dir` per shot toward the brightest backlight region.

**Inner cut-lines.** These are 1.2–1.8 px strokes in `rim` at α 0.45–0.60, drawn in each puppet part's local space (they move with the joint):
- Allow at most **8 per figure**.
- Use them for: lapel edges, button rows (3 px dots), pocket flaps, cuffs, hems, hair locks, knitted ribbing, hoodie drawstrings.
- Semi-transparent garments (lace, a shirt collar, smoke, a screen's glare) are filled with `rim` at α 0.20–0.30.

**SVG version** (scene-level static parts only; SVG filters per frame are too expensive for 50k frames):

```html
<filter id="rim"><feOffset dx="-2" dy="0.6" in="SourceAlpha" result="s"/>
  <feComposite in="SourceAlpha" in2="s" operator="out" result="c"/>
  <feFlood flood-color="var(--rim)" flood-opacity=".55"/><feComposite in2="c" operator="in"/>
  <feMerge><feMergeNode in="SourceGraphic"/><feMergeNode/></feMerge></filter>
```

---

## 3. Depth: the multiplane model

### 3.1 The camera (perspective, not just pan)

The existing engine camera is 2-D `{x, y, k}` (`engine/core/stage.tsx:28-48`). Films need a **depth-aware** camera `{x, y, z, lens}`. Each layer has a depth `z` measured from the camera's rest position. With the action plane at `ZA = 1000`:

```js
scale(layer) = (ZA * cam.lens) / (layer.z - cam.z)
screen = center + (world - cam.xy) * scale(layer)
```

- **Pan / truck:** change `cam.x` or `cam.y`. Parallax comes out of `scale` automatically: near layers slide faster.
- **Dolly:** change `cam.z`. Near layers grow faster than far ones. This is the multiplane "push in" (verified in `clip-ends.png`).
- **Zoom:** change `cam.lens`. Every layer scales equally and there is *no* parallax. Use it rarely; it reads flat (a "Ken Burns" move).
- **Dolly-zoom** (Vertigo): `cam.z` up while `cam.lens` goes down so the action plane holds its size. Reserve it for one revelation per film.

### 3.2 Layer table (z, parallax, haze, blur, value)

| Layer | Content | z | parallax `ZA/z` | haze `h` | blur @1080p | value |
|---|---|---|---|---|---|---|
| **L0 backlight** | sky or gradient, sun ellipse | ∞ (screen-locked; allow 0.03 drift) | 0.00–0.05 | — | none (it is a gradient) | sky ramp |
| **L1 far** | skyline, distant hills, a far city, tracery seen through a window | 4000 | 0.25 | 0.70 | 3 px | ≈ L* 38–44 |
| **L2 back** | the room's back wall with window holes, bookcases | 1800 | 0.56 | 0.15–0.20 (window walls), up to 0.45 for walls with no openings | 1.5 px | L* 22–30 |
| *fog sheet A* | haze band | — | screen-locked | α 0.30, band 0.40H centred at 0.60H | — | `haze` |
| **L3 mid** | furniture behind the action, machines, a second rank of figures | 1300 | 0.77 | 0.25 | 0.75 px | L* 20–30 |
| *fog sheet B* | low haze | — | screen-locked | α 0.12, band 0.22H centred at 0.70H | — | `haze` |
| **L4 action** | principal puppets, the hero prop, the practical light | 1000 | 1.00 | 0–0.06 | 0 (always the sharpest plane) | `ink` L* 5 |
| **L5 near** | floor edge, table end, near chair | 650 | 1.54 | 0, darkened toward `fg` | 4 px | L* 3–13 |
| **L6 frame** | pillar, curtain, branch, door jamb crossing the frame | 400 | 2.50 | 0 | 8–12 px | `fg` L* 2.5 |

Rules:
- **Only one plane is sharp** (L4). Blur grows faster in front of it (L5, L6) than behind it. This "Limbo" cue makes a flat image feel photographed.
- **Overscan.** Author layer art wider than the frame by `W/scale + 2·panRange`. Far layers need less world width. Near layers need *more* margin because they slide fastest.
- **Floors** span depths. Draw them as a perspective grid in their own pass (checker tiles projected as `y = horizon + K/z`) and pan them with the action plane.
- **Budget.** Most shots should use L0, L2, A, L3, L4 and one of L5/L6. Hold back L1 and L6 for establishing and transition shots.

### 3.3 Camera grammar

- **Camera on ones, puppets on twos (§4.5).** Ease camera moves with cubic in/out over **4–12 s**. A 35-minute film should almost never be static, but the moves must be slow: the frame should travel no more than about 6% of frame width per second on the action plane.
- **Default move:** a slow truck plus a slight dolly (`x: ±120`, `z: 0→120` over the shot). The probe clip used exactly this; open `out/clip.mp4`.
- **Push in** on the speaker or object during a key idea (`z` +150–250).
- **Pull back** to reveal scale (a lab becomes a building, the building becomes a city).
- **Rack focus** is allowed: change which plane has blur 0 over 0.8 s, then re-time the blur table.

### 3.4 Alternative depth mode: "shadow-screen"

For framing devices (the storyteller's theatre, dream and allegory sequences), simulate a real shadow-puppet screen instead of a camera. The penumbra width is:

```
penumbra = lightSize * d / D
```

where `d` is the puppet-to-screen distance and `D` is the light-to-puppet distance. A puppet pressed against the screen is crisp and life-size. A puppet pulled toward the lamp grows larger and softer:

```js
scale = (D + d) / D;  blur = 18px * d / D;  alpha = 1 - 0.35 * d/(D + d)
```

Add the visible screen texture: muslin weave as a 2% multiply, a hot-spot vignette centred on the lamp, and lamp flicker on the whole screen (±3%). This mode gives the film a second register and an elegant way to visualise "projection" and "representation".

---

## 4. Character design: articulated silhouette puppets, 1940s → 2020s

### 4.1 Readability

- **Profile first.** Heads, feet and noses face left or right. Avoid three-quarter and frontal views; they collapse into blobs. A frontal view is allowed only for a single "address the audience" moment, and only as a bust.
- **Negative space.** Keep a visible gap between the arms and the torso, and between the legs, whenever a pose matters. A gesture made in front of the body is invisible.
- **Thumbnail test.** At 64 px tall (the probe figures scaled 12%), you must be able to tell *which era* and *which person* it is. Each recurring person gets a **silhouette signature** of 2–3 features (§4.4).
- **Proportion.** 7.5 heads for adults (realist register). Use 9 heads (Three-Brothers elongation) only for allegory or myth. Children and machines may break the rule.
- **On-screen size.** In a two-shot the figure is 48–55% of frame height (reference ≈ 50%; probe 53% ≈ 570 px). A close-up is 70–85%. Crowds are ≥ 180 px, and smaller figures become "texture", not characters.
- **Eyes.** None by default. The **eye-glint** is a 3–4 px hole showing backlight (Ocelot/Limbo). Use it only for a realisation or a doubt, about one shot per chapter.
- **Glasses** are cut-out lenses through which the backlight shows: `destination-out` the lens, then fill it with `rim` at α 0.35, with a 2.2 px ink frame and arm. They read instantly at small sizes (verified in the probe frames). Era determines the frame: round wire (1940s), browline (1950s), heavy black (1960s), aviator or oversized (1970s–80s), small rectangles (1990s–2010s), thin round (2020s).

### 4.2 Rig specification

Root = pelvis. The tree (draw order back → front):

```
pelvis(root)
├─ thighB → shinB → footB                       (far leg: drawn first)
├─ upperArmB → forearmB → handB                 (far arm)
├─ coattail / skirt / labcoatHem  [secondary]
├─ torso
│   ├─ neck → head → { hair|hat [secondary], glasses, jaw? }
│   └─ tie | scarf | lanyard | hoodStrings      [secondary]
├─ thighF → shinF → footF
└─ upperArmF → forearmF → handF → propSocket     (near arm: drawn last)
```

- Each part is a `Path2D` (or SVG path) in local coordinates with a `pivot` in parent space. The world matrix is `parent · translate(pivot) · rotate(angle)`. The probe implements this with `DOMMatrix` in about 15 lines (`drawPuppet`, `silhouette-kit.js`).
- **Hinge lobes:** each limb's proximal end is a semicircle of radius `0.55 × limb width` centred on the pivot, so rotation never opens a gap. This is Reiniger's overlapping-joint trick.
- **Rotation limits (degrees, positive = forward):**
  - shoulder −170…+60
  - elbow 0…+150
  - wrist −60…+60
  - hip −90…+45
  - knee −150…0
  - neck −25…+25
  - torso lean −15…+20
- **Hand swaps** (a sprite set, never rotate one hand into another): `relaxed`, `open-present`, `point`, `grip` (chalk, pen, mug), `fist`, `pinch` (holding a card or chip), `palm-down` (on a table), `typing` (two-frame loop), `chin` (thinking). Swap on a hold frame.
- **Mirror rule.** Do not flip a puppet with `scale(-1, 1)` if it has asymmetric details (a pocket, a hair part, a watch, a lanyard). Author a left-facing set, or keep those details on a part that the flip swaps. The probe flips the second figure, and this is exactly what mis-places its lapel line.
- **Secondary parts** (hair, coattails, ties, hood strings) follow the parent with a lag of **one twos-tick** (2 frames) at **0.6** amplitude, using a damped spring sampled at quantised time. They stay deterministic because the spring is integrated in closed form or replayed from `t = shotStart`.

### 4.3 Era wardrobe (silhouette-relevant features only)

| Era | Men's silhouette | Women's silhouette | Hair / face | Props in hand |
|---|---|---|---|---|
| 1940s | double-breasted, wide lapels, high-waisted pleated trousers with cuffs, fedora, overcoat | shoulder-padded dress or skirt suit, A-line knee skirt, small hat | slick side part, pencil moustache, full beard (rare: one McCulloch-type) | pipe with a smoke wisp, cigarette, fountain pen, chalk |
| 1950s | narrow tie, boxy suit, **lab coat** (flared hem below the knee), short-sleeve shirt | full skirt, fitted cardigan | crew cut, flat-top, browline glasses | slide rule, clipboard, punch cards |
| 1960s | slim suit, turtleneck, cardigan | shift dress, beehive or bob | heavy black frames, receding or bald heads | reel tape, a book, chalk |
| 1970s | wide collars, sweater vest, flared trousers | long straight hair, wide trousers | sideburns, full beards, aviator glasses | printout ribbons (fanfold), coffee mug |
| 1980s | rolled sleeves, loosened tie, chunky sweater | big shoulders, permed hair | oversized glasses, moustaches | keyboard, floppy disk, overhead transparencies |
| 1990s | polo or chambray shirt, khakis, oversized blazer | blazer, long hair | goatee, rimless glasses | cheque, CRT, pager |
| 2000s | fleece, cargo trousers, lanyard | ponytail, fleece | — | laptop (thick), flip phone |
| 2010s | **hoodie** (hood bump at the back of the neck, drawstrings as cut-lines), T-shirt, sneakers, backpack | — | beards, rectangular glasses | laptop, over-ear headphones, whiteboard marker |
| 2020s | quarter-zip, gilet, minimalist knit | — | earbud dot, thin round glasses | phone, standing desk, a lanyard badge |

### 4.4 Silhouette signatures (registry pattern)

Keep a `characters.json` with, for each recurring person: `{ id, era, heightHeads, posture, features[2-3], wardrobe, glasses, hand-prop }`. Treat features as **candidates to verify against archival photographs** before use:
- a full beard for an older 1940s neurophysiologist type;
- slight build and youth for a teenage logician;
- bald head plus heavy glasses for a 1960s MIT figure;
- "the man who always stands" posture for a researcher known not to sit.

Signatures must be respectful. **Never exaggerate a real person's physical traits for comedy.** Identify people with a name card (§6) on first appearance, and never by caricature.

### 4.5 Motion: limited animation for puppets, smooth camera

- **Puppets on twos.** At 24 fps output, sample every puppet pose at `tq = floor(t*12)/12` (12 poses/s). The camera, light, fog, particles and flicker run on ones. This split is the heart of the "cut-paper" feel and also halves pose computation. It is implemented in the probe.
- **Pose to pose.** Key the poses, ease between them with cubic in/out, and **hold**. A hold must be ≥ 0.5 s. Something else (fog, flame) keeps the frame alive.
- **No squash or stretch.** Paper does not deform. Animate by rotation of rigid parts only. Translation is allowed for the root and for "slides" across the stage.
- **Breathing:** torso ±0.6° on a 4 s sine (on twos). **Idle:** a 1° head drift every 6–9 s (seeded).
- **Walks:** a 16-frame step at 24 fps (8 drawings on twos). Plant the feet: compute the root x from the planted foot, never slide it. In long shots, walk *across* the frame in profile. Never walk toward camera.
- **Talking:** **no mouth flap.** Drive a head bob of ±2° and an occasional hand beat from ElevenLabs word timestamps. Put the beats on stressed words, at most one beat per 1.2 s.
- **Gesture vocabulary** (pose library keys):
  - `present` (forearm +60°, open palm)
  - `point` (arm 90°, `point` hand)
  - `write` (3-frame chalk loop)
  - `think` (hand to chin, head −6°)
  - `doubt` (hand behind back, head tilted back +6°, body angled away)
  - `dissent` (turn away: a 180° profile flip on a hold, using the left-facing set)
  - `triumph` (both arms up)
  - `despair` (head −20°, torso forward +8°, arms slack)
  - `authority` (both hands behind back, chest +4°)
  - `lean` (palm-down on a table)
- **Staging debates.** Opponents face each other across a **vertical divider**: a window mullion, a pillar or a candle. The divider sits on the centre third. Each side's backlight can differ subtly in hue (±15° h) to "colour" the two positions without labels.

---

## 5. Prop and architecture vocabulary

Every set piece is built from three things: **one hero silhouette** (the recognisable profile), **one pierced detail** (backlight through holes), and **one repeating ornament** (rhythm). The table lists layers and construction notes. Facts marked † should be verified by the research or story team before the art is locked.

| Setting | Hero silhouette | Pierced detail (light through) | Repeating ornament | Mood | Teaching hooks |
|---|---|---|---|---|---|
| **1940s Chicago study** | tall sash window with an elevated-train trestle and a skyline in L1 | rolltop desk pigeonholes, radiator fins | bookshelf spines, the steel lattice of the El trestle | candleAmber, winterBlue outside | chalkboard of threshold "neurons" (logic gates drawn as lanterns) |
| **Dartmouth, summer 1956** | a white colonial hall with a **cupola**, under elms (Dartmouth Hall†) | sash windows, cupola louvres | clapboard lines, window rhythm | dawnGold (summer evening), fireflies as particles | the typed proposal as a paper prop; a ring of chairs |
| **Mark I Perceptron** (Cornell Aeronautical Laboratory, Buffalo†) | equipment racks and the camera "eye" on a stand | the **20×20 photocell retina** (400 cells†) as a pierced grid that lights up | the **plugboard of random wires** (sagging quadratic curves) and **rows of motor-driven potentiometer knobs** (the weights†) | labGreen plus floodlight white | a knob's rotation *is* a weight update; cards with shapes held in front of the eye |
| **Cornell lab / IBM 704 era** | tall cabinets, tape drives with **reels** | console lamp grid | reels (spinning on ones while puppets stay on twos), punch cards | labGreen | simulation vs hardware |
| **The 1969 *Perceptrons* book** | a giant book standing in a landscape | its cover's **two-spiral figure†** as a cut-out maze | page edges | duskRose → winterBlue | the book's shadow lengthens across a field and becomes the winter (match cut) |
| **AI-winter landscapes** | bare oaks and birches, an empty observatory or lab | **one lit window** in a dark building (the few who persisted) | snow in 3 depth layers, fence posts | winterBlue | snowfall density bound to the funding level |
| **1980s labs** | CRT terminal (trapezoid monitor plus keyboard), tall workstation cabinets | the green phosphor screen glow (light-wrap on the face) | **fanfold printer paper** streaming (a cut-paper ribbon), ceiling fluorescent tubes | labGreen | the paper ribbon becomes the backprop "signal path" |
| **Bell Labs, Holmdel†** | the mirrored-glass box building and the **transistor-shaped water tower†** | cheque windows, the atrium grid | cheques on a conveyor, rows of handwritten digits | duskRose / labGreen | handwritten digits as paper cards that flow through a convolution stencil |
| **Classical ML (1990s–2000s)** | library stacks, a lecture hall | a decision tree as a real tree with lanterns at the leaves | margins as a street between two rows of lanterns (SVM) | parchment plates | the kernel trick as paper lifted and folded into 3D |
| **2012 bedroom (Toronto†)** | single bed, desk, tower PC with a side window | **two GPU cards** with glowing fans (GTX 580†) | heat shimmer, window frost | candleAmber plus a serverCyan accent | the network splits into **two lanes**, one per GPU, matching the paper's figure |
| **ECCV 2012, Florence†** | Duomo dome and Renaissance arcades | arcade arches | the audience row | dawnGold | the result reveal: a chart drawn as a falling candle-wax line |
| **Modern offices** | glass walls, whiteboards, standing desks | the glass-wall reflection (a second, hazed copy of the figures) | laptop lids, monitor rows | duskRose / serverCyan | whiteboard arrows become attention threads |
| **Data centres** | a long rack aisle with a hard vanishing point | **LED dots** (cyan, a few warm red) | cable trays, perforated floor tiles, cooling-tower steam, power lines | serverCyan | city lights equal parameters; heat haze equals energy |
| **Chips** | a GPU die as a city plan (top view), a wafer as a moon, HBM as towers | die streets lit as traces | wafers, cleanroom "bunny-suit" silhouettes, lithography tool as a cathedral organ | serverCyan / dawnGold | parallelism as a hall of many scribes vs one master |
| **US–China geopolitics** | **two shores across water**, each with a skyline at equal height and value | windows of both cities lighting up | ships carrying chip-crates, a **chain or gate across the strait** (export controls), a **Go board** as the shared stage | emberRed (tension), duskRose (dignity) | symmetrical composition; equal size, value and dignity for both sides |

Staging notes for geopolitics: **no flags dominating the frame, no animal emblems (dragon or eagle), and no ethnic caricature.** Use architecture, light and objects. Shadow theatre itself has a deep Chinese tradition (*piyingxi*), so a translucent-dyed-hide treatment for some China-side imagery is a respectful nod, *if* the US side gets an equally specific craft treatment (for example Reiniger black card). Never show company logos or brand marks. Products are generic silhouettes.

**Construction recipe for ornament (cheap, high payoff):**

```js
// repeat a tiny path along a line: tassels, balusters, rack LEDs, book spines, fence posts
for (x = x0; x < x1; x += pitch) p.addPath(motif, new DOMMatrix().translate(x, y))
// pierced ornaments: build one Path2D with outer + holes and fill 'evenodd'
```

Probe example: the tassel fringe is a 26 px pitch × 52 motifs, a single `fill()`.

---

## 6. Visual metaphors that teach (same art language)

Rule: **bind every visual variable to a real quantity.** A metaphor that is only decoration is a lie. Each recipe says what maps to what.

| Idea | Metaphor | Binding (visual ← quantity) | Recipe |
|---|---|---|---|
| Neuron / threshold unit | **paper lantern** with a wick | glow `k` ← activation; the wick catches only above the threshold line marked on the lantern | `halo(r=70·a, α=0.35·a)`; the threshold is a cut-line ring; firing is a 0.2 s flare on ones |
| Weights | **strings on a loom** between lantern rows | thickness ← \|w\| (0.8–6 px); colour ← sign (`rim` warm = +, `winterBlue.rim` cool = −); tension sag ← 1/\|w\| | quadratic curve with sag `s = 40/(1+\|w\|)`; learning re-tensions the strings on twos |
| Perceptron learning rule | the **potentiometer knob** (Mark I) | rotation ← Δw | the knob turns on the frame the error is "felt"; the loom string thickens at the same moment |
| Linear separability / XOR | **one straight cut of the scissors** through a paper scene of lanterns | a single cut line can separate AND/OR but never XOR | animate the scissor cut along a line; for XOR the cut always leaves an "enemy" lantern on the wrong side; a hidden layer = **two cuts** combined |
| Hidden layers / representation | **folding paper** | each fold ← one layer's nonlinearity; after folding, the classes separate with one straight cut | Canvas fold: split the sheet along a crease line and mirror the far half with a shading ramp |
| Gradient descent | **a traveller with a lantern descending misty hills** | the lantern radius ← information available (local gradient only); stride ← learning rate; fog ← you can't see the global minimum | hills as 4–6 parallax ridges in the L1–L3 haze ladder; too large a stride overshoots the valley; momentum = the traveller's cloak swinging (lagged secondary) |
| Backpropagation | **a messenger running back along the loom**, tugging each string by its share of the blame | tug size ← ∂L/∂w | a glowing knot travels right→left along strings; each string's thickness changes as it passes |
| Convolution | **a pierced stencil-lantern** (tin lantern) sliding over a tapestry | the stencil pattern ← kernel; the projected brightness on the wall ← dot product; stride ← slide step | the stencil steps on twos; each step lights one cell of the feature-map wall in L2 |
| Pooling | a **sieve or ladle** keeping only the brightest bead | max ← the bead that stays | a 2×2 bead tray tips and three beads fall away |
| ReLU | a **weir**: water passes only above zero | output ← max(0, x) | water drawn as light-filled paper ribbon |
| Two-GPU AlexNet | **two parallel halls** joined by occasional bridges | cross-GPU layers ← the bridges | two columns of rooms; bridges light only at the layers that connect the halls |
| Dropout | **lanterns randomly snuffed** each step | p ← fraction snuffed (seeded per step) | the snuffed lantern's smoke wisp is drawn on ones |
| Tokens | **paper slips on a line** (a cut-paper banner) | — | each slip is a mini card at 0.6 scale; parchment palette |
| Embeddings | **constellations**: words as stars in a night sky | position ← vector (projected); nearness ← similarity | stars drift into clusters during a dolly through L1 |
| Attention | **threads of light between word-slips** | thread opacity and width ← attention weight (softmax row sums to 1 = a fixed amount of light poured among threads) | query = a lantern on the slip, keys = small mirrors; the value travels along the brightest thread; multi-head = threads in 4–8 distinct hues from the mood ramp (the one place a categorical palette is allowed) |
| Softmax | **pouring a fixed jug of light** into cups | cup level ← probability; total constant | the jug empties as the cups fill; the cups are lantern glass |
| Next-token prediction | a **typesetter's case**: type sorts slide out by probability | slide distance ← p | the chosen sort is set into a composing stick, on twos |
| Scaling | **a growing city at night** | lit windows ← parameters (log-scale); districts ← compute; the road ← loss on log axes (straight line) | buildings rise on twos; windows light on ones in seeded order |
| AI winter | **literal snow** | snowfall density ← funding or interest (bind to a real series where possible) | 3 snow layers (L1 small/slow/blurred 2 px, L3 medium, L5 large/fast/blurred 6 px), seeded |
| Training compute | **a furnace or forge** | heat glow ← FLOPs (log) | emberRed halo, sparks as particles |
| RLHF / alignment | a **gardener shaping a hedge** (topiary) | each clip ← a preference update | snips on twos, leaves fall |

**Diagram plates.** For equations and precise diagrams, cut to a **parchment plate**: an inverted palette, ink on paper, a camera hold, and type set in §7 fonts. Bring the metaphor object onto the plate as an ink silhouette so the visual language continues. The existing orly engine primitives (axes, matrix, plot in `apps/bookshelf/src/viz/primitives/`) can render on plates if their colour tokens are re-pointed to the parchment palette.

---

## 7. Typography (Google Fonts; all loaded and rendered in the probe)

| Use | Font | Weights | Size @1080p | Treatment |
|---|---|---|---|---|
| Film and chapter titles | **Cormorant Garamond** | 600 (roman), 500 italic (subtitle) | 84–110 px | `core` colour on dark, letter-spacing +2px; cut-paper lift: shadow 0/3/6 px `ink` @ 0.5 |
| Chapter label ("CHAPTER III") | **Cormorant SC** | 500 | 30–36 px | tracking 0.25 em, α 0.8 |
| Quotes | **EB Garamond** | 400 italic | 38–44 px, ≤ 42 characters per line | parchment `#efe3cf`; attribution in Cormorant SC 500, 26 px, tracking 0.15 em |
| Date / place stamps 1940s–60s | **Special Elite** (typewriter) | 400 | 28–32 px | α 0.85, bottom-left, 72 px margin |
| Date / place stamps 1970s–80s | **VT323** (phosphor) | 400 | 36–40 px | `labGreen.core`, 1 px glow |
| Date / place stamps 1990s–2020s | **IBM Plex Mono** | 400 / 500 | 26–28 px | uppercase, tracking 0.08 em |
| Myth / allegory cards | **IM Fell English** / **IM Fell English SC** | 400, italic | 40–64 px | real letterpress irregularity; use rarely |
| Name cards | Cormorant SC 600 (name) + EB Garamond italic 400 (role, years) | — | 34 / 26 px | appears on first appearance only, 3.5 s, fade 0.4 s |
| Diagram labels | EB Garamond 400/500 | — | ≥ 26 px | `ink` on parchment; math via the engine's KaTeX (`engine/core/math.tsx`) at matching size |

The era-adaptive date stamp is a cheap, strong period signal: the stamp's typeface changes as history advances.

**Canvas gotcha (verified):** Canvas `fillText` does **not** wait for webfonts. Before the first frame, call `await Promise.all(specs.map(s => document.fonts.load(s)))` with the exact weight and style strings. Without it the probe silently rendered Times. Note that `document.fonts.check('40px "EB Garamond"')` still reports `false` when only italic was loaded; that is expected.

**Minimum size:** no text under 26 px at 1080p. Never put text over patterned backgrounds; place it over the L0 gradient or a 0.55 α ink plate.

**Backlit type (special):** letters cut *out* of a black card, so light shines through them. Draw the card in `ink`, `destination-out` the text, then let the L0 gradient and a halo show through.

---

## 8. Texture and finish (cheap and deterministic)

Two textures, two different anchors:
- **Paper grain is locked to the layers.** It belongs to the cut paper and parallaxes with it.
- **Film grain is locked to the screen.** It belongs to the "lens".

| Effect | Recipe | Numbers (verified in the probe) |
|---|---|---|
| **Paper fibre** | one 512² tile made once from a seeded mulberry32: 2600 short strokes, ±10% white/black, on mid-grey; fill each bright layer with `createPattern` | `soft-light`, α 0.35, inside the layer transform, **only on L0–L3** |
| **Film grain** | 8 tiles of 256² made once (sum of 3 uniforms ≈ gaussian); each twos-tick picks `tile[tq12 % 8]` with a seeded offset; pattern scale 1.5 | `overlay`, α 0.07 (0.05 on parchment plates); changes at **12 Hz** (on twos) |
| **Vignette** | elliptical radial gradient (scaled 0.92·W/H horizontally) | clear to 0.38 H radius → `ink` α 0.55 at 1.02 H |
| **Bloom** | quarter-res, `brightness(1.5) contrast(2.4) blur(6px)`, `screen` | α 0.22 |
| **Exposure flicker** | `vnoise(tq12*0.9)` → multiply (dark) or screen (warm) full-frame fill | ±1.2% |
| **Gate weave** | translate the whole composited plate before the finish passes | x ±0.6 px, y ±0.8 px, `vnoise(tq12*0.35)` (slow drift, updated on twos); overscan the plate 2 px |
| **Edge irregularity** | bake 0.3–0.6 px fbm displacement into paths **at authoring time**; no per-frame "boil" | optional cut-line boil: 3 variants cycled on twos at 0.25 px, only in shadow-screen mode |
| **Dust and hair** | seeded events: one speck about every 4 s for 1 frame; one hair about every 40 s for 2 frames | α 0.25 ink, never over faces or text |
| **Dither** | grain already breaks banding in the 8-bit gradients; keep it ≥ 0.05 | — |

**Encoding (measured on the 3 s probe clip, 1920×1080 @24, x264 `-preset slow`):**

| Setting | Bitrate |
|---|---|
| crf 18 + `-tune grain` | 9.2 Mb/s |
| crf 20 + `-tune grain` | 5.6 Mb/s (≈ 1.5 GB for 35 min) |
| crf 22 + `-tune grain` | 3.3 Mb/s |
| crf 20 without the tune | 4.5 Mb/s |

Grain is the main bitrate cost. Changing it on twos (not on ones) halves its entropy. Recommendation: **crf 20, `-tune grain`, yuv420p** for the master, plus a lower crf 23 web proxy.

---

## 9. Transitions

| Transition | Use | Recipe | Duration | Cost (probe) |
|---|---|---|---|---|
| **Iris** (feathered) | close a chapter; motivated on a light source (the candle, an LED, a lantern) | radial gradient mask `r = rMax·(1−u)`, 14 px feather; close on A to black, hold 6–12 frames, open on B centred on B's practical light | 0.8–1.2 s each way | 33 ms/frame |
| **Ink bleed** | era change, memory, an "idea spreading" | a precomputed quarter-res field `f = 1.25·r(origin) + 0.45·fbm(x/18, x/6, x/2.2 stretched)` (paper fibres); B is revealed where `f < u·max` with a 0.035 soft edge; a 2 px **wet edge** in ink at α 0.85 | 1.5–2.5 s | 70 ms/frame (JS per-pixel; precompute or use WebGL if needed) |
| **Paper fold / page turn** | turning to a diagram plate or a book prop | split A at a crease line; the far half scales X from 1 to 0 with a shading ramp (`ink` α 0 → 0.45 toward the crease), revealing B beneath | 1.0–1.4 s | trivial |
| **Occluder wipe** | invisible cut inside continuous action | an L6 pillar or curtain crosses the frame at parallax 2.5; cut under it at the frame where it fully covers | 0.4–0.7 s | free (it is layout) |
| **Lamp change** | big mood shifts (dusk → winter) | fade the backlight to the `fg` value and back up in the new mood while the silhouettes hold; a theatre lighting cue | 1.5 s down, 1.5 s up | free |
| **Tint crossfade** | gentle mood drift inside one sequence | interpolate all palette tokens in Lab | 2–4 s | free |
| **Match cuts** | connecting eras by shape | see the list below | cut | free |

Match cuts:
- the candle flame becomes a GPU status LED;
- the 20×20 photocell retina becomes an ImageNet thumbnail grid, which becomes the AlexNet first-layer filter grid;
- the loom becomes the attention matrix;
- snowfall becomes dropout (snuffed lanterns);
- the checker floor becomes a Go board, which becomes a pixel grid;
- printer fanfold paper becomes a token banner;
- the book's shadow becomes night (winter);
- the window mullions become rack aisles.

Pacing: roughly one transition device per 60–120 s. Most cuts should be plain cuts or occluder wipes. Signature transitions (ink bleed, fold, iris) mark chapter and era boundaries only.

---

## 10. Don'ts (what makes silhouette work look cheap)

1. **Pure `#000` on a flat background.** Use the L* ladder: warm near-black ink, a graded backlight and haze between planes.
2. **Same-value overlaps.** An ink figure in front of an ink chair merges into one blob. Put the figure against light (ΔL* ≥ 25) or add a fog sheet between them.
3. **Front or three-quarter views and crossed arms.** The profile and the gesture vanish.
4. **"Flash puppet" motion.** Smooth on-ones tweening of every joint, squash and stretch, rubbery limbs. Paper is rigid: rotate the parts, animate the puppets on twos and hold.
5. **Visible joint gaps or wrong pivots.** Use hinge lobes, and keep pivots at anatomical joints.
6. **Mirroring asymmetric puppets with `scale(-1, 1)`** (pockets, partings and lanyards jump sides).
7. **Foot sliding, moonwalks and walks toward camera.**
8. **Mouth flaps.**
9. **A camera that slides a flat picture.** That is a pan without parallax. Every move needs at least 2 planes at different z.
10. **Uniform blur on everything, or blur on the action plane.**
11. **Global glow, lens flares, chromatic aberration and neon** (outside the serverCyan practicals). Glow must have a source.
12. **Saturated colour everywhere.** Keep chroma ≤ 20 except practical lights.
13. **Overdetailed silhouettes.** Detail belongs in pierced ornament and in ≤ 8 cut-lines per figure. Outline strokes around black shapes look like clip-art.
14. **Stock vector clip-art, emoji-like props, real logos or brand marks, or flags as wallpaper.**
15. **Drop shadows** under silhouettes (they are already shadows), bevels and gradients *inside* figures.
16. **Gradient banding.** Never ship gradients without grain or dither.
17. **Grain or flicker too strong** for a 35-minute watch: grain α > 0.10, flicker > 2%, weave > 1 px.
18. **Text in default sans-serif, text under 26 px, or text over patterned backgrounds.**
19. **Everything moving at once.** One focal motion per moment. Fog and flame are the only "ambient" motion.
20. **Symmetric, centred, static staging for minutes on end.** Use thirds, dividers and the slow camera.
21. **Caricaturing real people or nations.**

---

## 11. Implementation notes for orly-2 (proposal only; no tracked files changed)

The existing engine already gives us:
- the pure timeline `Timeline` / `sample(t)` (`engine/core/timeline.ts`);
- seeded `mulberry32` and `gaussian` (`engine/core/prng.ts:8,20`); reuse these for every seed;
- `CanvasLayer` drawing in stage coordinates at 2× backing (`engine/core/canvas-layer.tsx:13-50`);
- easing vocabulary (`engine/core/easing.ts`);
- KaTeX math (`engine/core/math.tsx`).

The existing palette (`engine/core/colors.ts`) is the dark-UI explainer palette. Films need the mood tokens of §2 instead. Suggested module layout:

```
apps/bookshelf/src/viz/film/silhouette/
  palette.ts       // MOODS (from palettes.json), mixLab(), crossfadeMood(a,b,u)
  multiplane.ts    // Layer{z,haze,blur}, Camera3{x,y,z,lens}, layerTransform(), overscan()
  puppet.ts        // Rig (parts, pivots, limits), pose library, onTwos(t), secondary lag, hand swaps
  light.ts         // backlight(), practical(), flicker(seed), rimPass(), lightWrap()
  set/             // ornament(), lancet(), evenodd walls, floors, snow, fog sheets
  finish.ts        // paper/grain tiles (seeded), vignette, bloom, weave, flicker, dust
  transitions.ts   // iris, inkBleed(field), fold, lampChange, tint
  type.ts          // font specs + document.fonts.load preloader
```

Channels such as camera, pose angles and mood `u` are ordinary Timeline channels. The film renderer calls `sample(t)` and then paints Canvas2D in the fixed order of §3.2. **Cache static layers** (back wall, set) per shot as offscreen bitmaps with their blur baked in, then `drawImage` them with the layer transform each frame.

**Probe performance (uncached, everything redrawn each frame, headless Chromium, 1920×1080):**
- median **70.9 ms/frame**, p95 73.1 ms (72-frame clip); the first frame costs about 110 ms (texture generation);
- a 35-min film at 24 fps (50,400 frames) is about 60 min on one worker, before PNG export;
- caching and parallel workers by shot should bring this well under that.

Puppet art production (not yet probed; recommendation): the probe's procedurally coded puppets prove the rig but look crude. For quality, author **puppet sheets** as SVG with named parts and pivot markers:
- either by hand in a vector tool;
- or by generating silhouette sheets with an image model and vectorising them. The repo already calls `gpt-image-1` in `generator/cover.mjs:30`. Neither `potrace` nor `autotrace` is installed, so add `brew install potrace` or an npm port and probe it first.

Parts are then loaded as `Path2D(d)`.

---

## 12. Probe record (reproduce)

```bash
cd /Users/blamy/Documents/Codex/orly-2/.orly-work/probes/silhouette-style
node sample.mjs                 # reference measurements (§0)
node palette.mjs                # palettes.json + table (§2.2)
node render.mjs moods           # out/mood-*.png (8 moods; duskRose includes the typography test)
node render.mjs trans           # out/trans-bleed-0.35.png, trans-bleed-0.6.png, trans-iris-0.75.png
node render.mjs clip            # out/clip/f0000..f0071.png (3 s pan+dolly) + timing
ffmpeg -framerate 24 -i out/clip/f%04d.png -c:v libx264 -preset slow -tune grain -pix_fmt yuv420p -crf 20 out/c20.mp4
```

Verified results:

**1. Value ladder.** In the 1080p render (duskRose), sampled 8×8 patches gave:

| Patch | Probe L* | Reference L* |
|---|---|---|
| Upper wall | 26.9 | 20–25 |
| Wall at haze height | 33.9 | 32 |
| Glass | 62.0 | 60.7 |
| Ink | 6.5 | 4.9 |
| Floor | 13.0 | 13–19 |

**2. Fonts.** All 7 families loaded via `document.fonts.load` and rendered (`out/mood-duskRose.png`).

**3. Parallax.** A dolly of `z` 0→120 plus a truck of x −120→+120: figures grow and shift more than the window wall (`out/clip-ends.png`).

**4. Moods.** All 8 moods are readable with identical value structure (`out/contact.png`).

**5. Known probe shortcomings** (deliberately left for the production kit):
- crude puppet shapes and rounded (not pointed) lancets;
- the L6 pillar is outside the frame in this camera setup;
- the second figure is mirrored, which demonstrates Don't #6.
