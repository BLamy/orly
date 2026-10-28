# Score motifs: Handwired, Explained (handwired-explained)

The music director's bible for the 13 cues in `cues.json`. **Clock: 1455.42 s** (`narration/timeline.json`,
locked). Times in this file are **absolute film seconds** unless marked cue-local; in Strudel code, cue-local time =
absolute time − `cue.start`.

**`cues.json` is the authority for times.** Each cue's `notes` open with ONE paragraph headed `CURRENT CLOCK`
(window, shots, lines under it, the speech-free gaps that hold its IN and OUT joins, its last-strike target). The
body after it is the brief, with every hit anchored to a beat or word (`'half' 70.02`); look anchors up in
`narration/timeline.json` (beats and line/word times there are **shot-local**: add `shot.start`). Never place a hit
from a number you remember: re-read it from the clock.

The director's `lastStrike` values are **targets** (`lastStrikeFrom: "director-target"`). When your render exists,
replace `lastStrike` with the measured onset of the cue's final chord or note and set `lastStrikeFrom: "composer"`,
or delete both fields so `score.mjs analyze` measures it. The mixer starts each fade at least 1.6 s after
`lastStrike` (QA `mix.fadeAfterStrike`), so the final chord must be struck where the brief says, not later.

## The governing idea: the score is a select

The film's subject is a program that has no `if`: both branches always run and a 0/1 number picks which one you
see. So the score is built the same way (story Device 4).

- **Both branches always play.** The main theme (M1) is written as **two lines a whole tone apart**, U (upper) and
  L (lower), always sounding in the code. A **gain gate** of exactly **1 or 0** picks which one we hear
  (`U.gain(gate)`, `L.gain(1 − gate)`): the score *is* a `select`, literally, in the Strudel source.
- **The musical eleven.** At a = 4.5 the gate sits at **0.5**: both lines at half level, the same tune smeared
  against itself a whole tone apart, slightly wrong and unresolved. Every return of the eleven (ch01, ch04 twice,
  ch10, and patient rather than wrong in ch12) uses the **same voicing**, so the ear recognises it.
- **The bit is a whole tone.** In the ramps (ch04-s03) the copper path's tone sits on G and steps up a whole tone to
  A across four to five: lower line = 0, upper line = 1. The interval that separates the two branches is the bit.
- **The struck branch ran too.** A gate at 0 silences a line without stopping it: in ch12-s03 every struck tag
  closes its gate while the line keeps playing underneath.

The second idea is **the bar hangs on the fifth**: the **detent figure** (M2) gives each tag a three-stroke life,
*tie* (on the tonic), *flip* (on the dominant), *strike* (the drawer closes, back on the tonic: V → I). A belief that
still holds **leaves the third stroke unplayed, and the bar hangs on V**. The two beliefs still contested at the end
(tag 2, learn the weights; tag 10, fully differentiable) replace the third stroke with the gate at 0.5. **The film
ends hanging on D, the fifth of G: no final chord anywhere** (ch12-s07), as its subject ends unresolved.

## Sound world

Silhouette paper theatre, warm and close: felt piano (piano with lpf 1400-2200, low velocity), soundfont strings
(`gm_string_ensemble_1`, `gm_pad_bowed`, `gm_cello`, `gm_contrabass`, `gm_pizzicato_strings`), `gm_orchestral_harp`,
a muted reed (`gm_clarinet` lpf ~1100; `gm_bassoon`/`gm_english_horn`/`gm_oboe`/`gm_reed_organ` as colours),
muted `gm_marimba` for the gallery, low drones, paper noise. Percussion is **wood, paper and brass only**:
`gm_woodblock`, low `gm_taiko_drum`/`gm_melodic_tom` (drawers, thunks), filtered white/pink/brown noise (paper
snaps, pencil scratches, sand, bellows).

**Machines clack, never chime** (brief; repeated in nearly every shot note). This film therefore does **not** use
celesta, music box, glockenspiel, tubular bells, `gm_fx_crystal`, tinkle bell or any bell-like patch, even as a high
colour; the high colour is harp, high pizzicato, high felt piano behind an lpf, or a reed. (`gm_vibraphone` also
hangs the offline export.) A **modern pulse** appears only when the story reaches the GPU era: heard first as labour
(m06's furnace), let loose only in October (m10), and restrained even there (a soft sine thump and an lpf-300
sawtooth bass, nothing brighter).

## Room for the voice (Chris Brift: mid-life British baritone, slow, ~141 wpm)

- His fundamentals sit about 85-180 Hz, the words' intelligibility in 1-4 kHz. Under a line: held material only
  (pads lpf ≤ 1200, a low pedal, one soft note per breath), **no melodic onset on a stressed word**, and nothing
  bright in 1-4 kHz. Motif statements, swells and the busy machine figures go in the **breaths and the speech-free
  gaps** (the clock has them listed in each cue's CURRENT CLOCK paragraph and below).
- Clacks pinned to beats that fall under words are **ghost-level** (velocity ≤ .2, decay ≤ .04, no reverb tail); the
  full-level clacks live in the gaps. Lines with real numbers (ch04, ch07-s02, ch08-s04, ch09) get the barest bed.
- Loudness: render each cue to about **−23 to −25 LUFS integrated**, true peak below −6 dBTP, neighbouring cues within
  ±3 LU of each other; `gainDb` −4 for every cue; the ducked bus uses ONE setting for the whole film
  (`{ratio: 3, attack: 20, release: 250, depthDb: 3}`: the score is written around the voice, so the duck is light).

## Motifs

### M1 · The Select (both branches) — the main theme

- **Key / harmony:** home **G**. U is a short G-major cell over a G pedal (B–D–E–D: 3-5-6-5, warm and plain); L is the
  identical cell a whole tone down (A–C–D–C: over the G pedal it reads as F over G, a soft suspended mixolydian
  colour). Alone, each line is consonant; together at half level they are parallel major seconds (B/A, D/C, E/D):
  **the musical eleven**.
- **Tempo:** 60 at home (one 4-s bar per cycle); it takes the tempo of whatever cue it rides in.
- **Instruments:** two matched voices (felt piano ×2 by default; pizzicato or harp in the loom; marimba in the
  gallery), panned .58 / .42 so the gate is heard as a *place* that moves.

```js
// M1 · the select. Both lines are ALWAYS scheduled; the gate decides what is heard.
setcpm(60/4)                                         // one 4/4 bar = 4 s
const U = "<[b4 d5 e5@2] [d5@3 ~] [b4 d5 g5@2] [e5@2 d5@2]>"
const L = "<[a4 c5 d5@2] [c5@3 ~] [a4 c5 f5@2] [d5@2 c5@2]>"   // U a whole tone down
const gate  = "<1 1 0 0.5>"                          // 1 = upper heard, 0 = lower heard, 0.5 = the musical eleven
const ngate = "<0 0 1 0.5>"                          // 1 - gate (write both; keep leading zeros on decimals)
$: note(U).s("piano").velocity(0.3).lpf(1700).pan(0.58).gain(gate).room(0.35)
$: note(L).s("piano").velocity(0.3).lpf(1700).pan(0.42).gain(ngate).room(0.35)
$: note("g2").s("gm_contrabass").attack(1.5).release(3).gain(0.22)   // the pedal both branches share
```

**Development.**

| cue | chapter | what M1 does |
|---|---|---|
| m01 | 1 | born on the push; the ternary scored live (gate 1 on 'five', 0 on 'three', 0.5 on 'half'); title: both at half over D, hanging |
| m02 | 2 | absent (the past belongs to M4); returns under 'years' / 'hand' in ch02-s06: the present tense |
| m03 | 3 | very quiet, transposed to C (U E–G–A–G), under the recipe; dips under each strike; thins to one line |
| m04 | 4 | the dive's spine: one line for JavaScript's one road; the bit as a whole tone; the two belts; the eleven explained, then the quarter, then clean |
| m05 | 4 | full gate in D major (the promise); the eleven under a broken promise; cadences D → G on 'return' |
| m06 | 5 | both lines at FULL, thin and high on harp/pizz: the loom runs both, no decision; an octave down at the lamp change |
| m07 | 6 | two quiet lines over the escapement; held at EQUAL level on the two-sided card (a choice, not a verdict); alternating leads in the float-grouping shot; a calm sixth at the return |
| m08 | 7 | in Bb at dawn; at 0.5 for tag 10 (contested); **unfrozen** in the gallery: the cell spread into a marimba arpeggio whose notes drift off the grid and settle back (the music learning its own places); 0.5 again under the question tag |
| m09 | 8 | nearly absent: two short tones a whole tone apart for the two tickets; both lines at half level, briefly, as the Deep Dive I plate returns |
| m10 | 9 | rides above the October pulse, gate wide open; one pass each in the two-pass search; first full resolution in the chapter on 'toy' |
| m11 | 10 | the gate wavers as strangers disagree, settles on L; the stranger's eleven; closes cleanly on the rivet (kept) |
| m12 | 11 | **absent** (a chapter about a rule, not a gate) |
| m13 | 12 | the gate opens column by column with the wave; closes to 0 on struck tags while the line runs on; 0.5 held for the two contested tags (patient, not wrong); one line lifts a step on 'find'; thins to a single line and hangs on D |

### M2 · The Detent Figure — a tag's life

- **Strokes:** *tie* = a soft detent click (high woodblock, very short) with the cue's tonic barely touched below;
  *flip* = a paper-card snap (white-noise burst, hpf 1800) over the dominant; *strike* = a dry pencil scratch
  (band-passed noise, ~0.3 s) resolving into a **wooden drawer closing** (low taiko/tom + brown-noise thump) with the
  bass falling **V → I**. A held belief stops after the flip: **the bar hangs on V**.
- **Tempo:** none of its own; every stroke sits on the beat the picture names (tie / flip / strike beats in the
  clock).

```js
// M2 · the detent figure: three strokes; place each one with tl() on its beat (see Craft below)
const tie    = stack(s("gm_woodblock").note("e6").velocity(0.22).decay(0.03).sustain(0),
                     note("g2").s("gm_pizzicato_strings").velocity(0.12))                    // I, barely
const flip   = stack(s("white").hpf(1800).lpf(7000).decay(0.035).sustain(0).gain(0.16),
                     note("d3").s("gm_pizzicato_strings").velocity(0.14))                    // V
const strike = stack(s("white").bpf(3000).bpq(2).attack(0.02).decay(0.3).sustain(0).gain(0.07), // the pencil
                     s("gm_taiko_drum").note("c2").velocity(0.3).decay(0.25).late(0.32),         // the drawer
                     s("brown").lpf(300).decay(0.15).sustain(0).gain(0.2).late(0.32),
                     note("g2").s("gm_contrabass").velocity(0.3).late(0.32))                     // V -> I lands
// the relay clack (every X-ray, every per-cut clack in the shot notes): dry, no tail
const relay  = stack(s("gm_woodblock").note("g5").velocity(0.45).decay(0.04).sustain(0),
                     s("white").hpf(2500).decay(0.025).sustain(0).gain(0.1))
```

**The tags' ledger in sound** (from the shot notes; transpose tie/flip/strike to each cue's I and V):

| where | strokes | meaning |
|---|---|---|
| m01 ch01-s05 | tie ×3, a softer fourth tie on 'whyTie' | beliefs hung, untested |
| m01 ch01-s07, ch01-s08 | tie, flip, — | the refrain and the title: the bar hangs (on D) |
| m02 ch02-s01 / s03 | tie | the oldest tag; Kleene's tag |
| m02 ch02-s05 | tie, flip, gate 0.5 | tag 2, contested |
| m03 ch03-s03, s06 | flip, strike; flip, strike, then tie | the first cadences of the film; a new tag hangs |
| m05 ch04-s08 / s09 | re-tie; tie, flip, — | tag 6 re-tied as a promise; the refrain hangs on A |
| m06 ch05-s03 / s06 | flip, strike; tie alone | "it is a network"; the GPU question tied on |
| m07 ch06-s05b | tie, flip, strike | tag 7 ends |
| m08 ch07-s05 | tie, flip, gate 0.5 | tag 10, contested |
| m09 ch08-s02 / s03 / s08 | tie; flip + ten pencil scratches; strike on G major | the summer's certainty ends (the strike is saved for the drawer) |
| m10 ch09-s03b / s07 | tie; flip, strike within seconds; the pulse cuts | tag 9 held for hours |
| m11 ch10-s02 / s03 | flip, rivet (no strike); tie, — | tag 6 kept; the "why?" hung for the end |
| m12 ch11-s02…s05 | tie; rivet; strike (D → G); tie, flip, — | a belief ended by its rule; the open question hangs on D |
| m13 ch12-s02 / s06 | two re-hang clicks; tie, flip, — | the last hands: the third stroke never comes |

### M3 · The Escapement — the host clockwork

- **Key / harmony:** a two-pitch woodblock tick-tock (A5 / E5 by default), with a pizzicato frame ostinato on the
  cue's pedal (D in m07: D2 A2 F#2 A2). **Frame grammar: four ticks and a rest** — the clock rests *between* frames,
  never inside one (L0606).
- **Tempo:** 72 (one frame = 5 beats: `setcpm(72/5)` if you write a frame per cycle); the patterns run doubles it.
- **Plant and returns:** planted in **m02** as the Kleene dial's three slow ticks (ch02-s03 'dial'); the bed of
  **m07** (Deep Dive II), with two out-of-phase escapements locking for the replay desks; returns slowed under the
  1951 page in **m10** (ch09-s04 'kleene') before the October tick swallows it; its last three ticks close m07.

```js
// M3 · the escapement: inputs in · the loom runs once · next state copied back · the page moves · (rest)
setcpm(72/5)
$: note("a5 e5 a5 e5 ~").s("gm_woodblock").velocity(0.16).decay(0.03).sustain(0).pan(0.45)
$: note("d2 a2 f#2 a2 ~").s("gm_pizzicato_strings").velocity(0.22).lpf(900)
$: note("d2").s("gm_contrabass").attack(2).release(4).gain(0.15)          // the pedal under the loop that cannot stop
```

### M4 · The Oldest Tag — the reed (the past, the human voices)

- **Key / harmony:** **E minor** (the relative minor of home): M1's contour in minor and in augmentation
  (E–G–A–G, twice as slow), on a muted clarinet, a gramophone in the next room (sparse vinyl dust). Low E pedal.
- **Tempo:** 56, unhurried.
- **Development:** born in **m02** (McCulloch & Pitts, Kleene: drops a register for the winterBlue office; in the
  lab shot it **divides into two voices a whole tone apart** and one frays into breath: the first time the old idea
  behaves like M1); one quote in **m07** at 'kleene' (Kleene's finite machine, found again inside the host loop); a
  faint echo in **m08** on 'lanterns' (the neurons of 1943 couldn't learn); the reed drone and the single held high
  reed note of **m11** (strangers argue like the old voices).

```js
// M4 · the oldest tag: the select's own shape, older
setcpm(56/4)
$: note("<[e4@2 g4@2] [a4@3 g4] e4@4 ~>").s("gm_clarinet").velocity(0.3).attack(0.15).release(1.2).lpf(1100).room(0.35)
$: s("white*32").degradeBy(0.95).decay(0.008).sustain(0).hpf(3000).gain(0.02)   // gramophone dust
$: note("e2").s("gm_contrabass").attack(2).release(3).gain(0.18)
```

### M5 · The Pulse — the GPU era

- **Key / harmony:** **G mixolydian** (G major plus F natural: literally the union of both branches' notes), a G pedal
  ostinato with the flat seventh.
- **Tempo:** 112, sixteenth-note ratchet.
- **Development:** heard first as **labour** in **m06**'s furnace (ch05-s06: a slow, heavy ratchet and a bellows drone
  on low E, never melodic); let loose in **m10** (October: the film's only driving pulse), thinned to a whisper under
  tag 9, **cut to near-silence on its strike**, resumed lighter at half its tempo feel, and resolved for the first time
  on 'toy' when the project goes public.

```js
// M5 · the October pulse: relays and ratchets, restrained modern weight underneath
setcpm(112/4)
$: s("gm_woodblock*16").note("a5").velocity("[0.3 0.1 0.16 0.1]*4").decay(0.02).sustain(0)
$: s("white*16").hpf(4000).decay(0.012).sustain(0).gain("[0.05 0.02]*8")              // the relay contacts
$: s("sine*2").note("g1").decay(0.18).sustain(0).gain(0.3)                               // soft thump, beats 1 and 3
$: note("g1 g1 f1 g1 g1 d2 f1 g1").s("sawtooth").lpf(300).decay(0.12).sustain(0).gain(0.15)
```

## Tonal plan (the harmony tells the story)

Home is **G**. History lives in its relative minor (E minor); the recipe in the plain subdominant (C); the dives move
round the home key (G for the ramps, D for the promise and the clockwork that cannot stop, A minor for the cool loom,
Bb for the warm dawn of unfreezing); the summer's certainties and the rule darken home to G minor; October is G
mixolydian (both branches at once); the film ends hanging on D.

| cue | window (s) | shots | key centre | tempo | intensity | why |
|---|---|---|---|---|---|---|
| m01 | 0.00-100.50 | ch01-s01…s08 | G; title hangs on D | 60 | 0.3 (0.4 title) | the select is born; the eleven; the title unresolved |
| m02 | 99.00-191.40 | ch02-s01…s06 | E minor → G | 56 | 0.25 | the oldest tag in the reed; the present returns in G |
| m03 | 190.20-279.60 | ch03-s01…s06 | C, hangs on G | 72 | 0.25 | plain, orderly: the recipe; the first strikes |
| m04 | 278.60-429.55 | ch03-s07, ch04-s01…s07, s12…s14 | G (E minor cool; F#→G tie) | 66 | 0.3 | the core arithmetic in the home key; the bit is a whole tone |
| m05 | 428.95-494.60 | ch04-s08…s11 | D → G | 66 | 0.35 (0.5 bar) | the promise on the dominant, cadencing home |
| m06 | 493.80-588.60 | ch04-s16, ch05-s01…s06 | A minor/dorian; F; low E drone | 76 | 0.3 | the cool loom; the furnace as labour; a question hangs on E |
| m07 | 587.60-790.25 | ch05-s07, ch06-s01…s13 | D (patterns in A) | 72 (144) | 0.3 | a dominant pedal: the loop that never cadences |
| m08 | 789.55-982.40 | ch07-s01…s12 | Bb; G minor | 69 (80) | 0.35 (0.55 bloom) | dawn on the flat side; the gallery learns its places |
| m09 | 981.20-1095.20 | ch08-s01…s08 | G minor → Eb → G major | 52 | 0.2 (0.45 alone) | home darkened; the climb back by method; a Picardy drawer |
| m10 | 1094.50-1220.70 | ch09-s01…s08 | G mixolydian → G | 112 | 0.45 | both branches at once, driving; first resolution on 'toy' |
| m11 | 1219.50-1274.10 | ch10-s01…s04 | E minor | 54 | 0.2 | the strangers sound like the old voices |
| m12 | 1273.10-1368.40 | ch11-s01…s05 | G minor; F colour; hangs on D | 58 | 0.3 | a rule, not a gate; ends on the shared D |
| m13 | 1366.40-1437.00 | ch12-s01…s07 | G, hangs on D | 60 | 0.35 (0.5 wave) | home, unresolved; one clack, then silent cards |

Neighbouring joins are written to be consonant: m01's D is the seventh of m02's E minor; m02's G is V of m03's C;
m03 hangs on G into m04's G; m04's G-D is IV-I of m05's D; m05 ends on G, m06 enters on an X-ray clack in near-silence;
m06 hangs on E (V of A) into m07's D bed after a clack; m07 and m08 are joined by silence and a clack; m08 fades on
G-minor whispers into m09's low G; m09's G-major drawer hands to m10's G; m10's G chord to m11's E minor (shared G);
m11's low E to m12's G minor (the drone thins first); m12's low D **is** m13's first note.

## Joins and silences

Every cue change sits in a speech-free gap, and the incoming cue sounds alone for at least 1.5 s before the next line
(QA `score.cueJoins` passes on this sheet). Convention: **each chapter's closing X-ray clack is the first event of the
next cue** (m04, m06, m07), except where the X-ray belongs to its own chapter's figure (m07's three closing ticks,
m08's valve clack). The tightest joins: m02→m03 (1.6 s clear before L0301), m04→m05 (the fade starts as L0428 ends;
1.7 s clear before L0414), m07→m08 (1.7 s before L0701).

| silence (scored) | where | what it is |
|---|---|---|
| no music, only paper room tone and one clack | m01, ch01-s01/s02 | the film opens on the wire, not on a theme |
| 1.6 s of near-silence after 'eleven' | m04, ch04-s06 | the musical eleven explained, then air |
| true silence for a beat after 'rests' | m07, ch06-s02 | the clock rests between frames |
| near-silence under the shut gate | m08, ch07-s03 | the coldest moment of the dives |
| nothing under August | m09, ch08-s01 | the record doesn't say why |
| the October pulse cut on the strike | m10, ch09-s07 | tag 9 held for hours |
| silent end and credit cards after the last clack | after m13 (1437.00-1455.42) | no final chord anywhere |

## Craft notes for composers

- **Length is exact**: `cycles = (end − start) × cps`, cps = bpm/240 with `setcpm(bpm/4)`; compose an arrangement that
  *ends* (intro / body / outro), clip onsets to the body (`score.mjs` does `filterWhen(t < bodyCycles)`), and let the
  last chord decay in the 6-s tail. Rubato cues place events by seconds with a time-line helper (the one below is from
  neural-net-history m10, verified):

```js
const CPS = BPM/240, DUR = /* end - start */ 0
const Q = 128, qn = s => Math.round(s * CPS * Q)
const tl = (...evs) => { const out = []; let cur = 0
  for (const [t, d, p] of evs) { const a = qn(t), b = qn(t + d); if (a < cur) throw new Error('tl overlap at ' + t)
    if (a > cur) out.push([a - cur, silence]); out.push([b - a, p]); cur = b }
  const end = qn(DUR); if (end > cur) out.push([end - cur, silence]); if (cur > end) throw new Error('tl past DUR')
  return stepcat(...out).slow(end / Q) }
// $: tl([cueLocalSeconds, durationSeconds, pattern], ...)
```

- **Soundfont ranges**: a note outside a GM voice's sample range is dropped with `[webaudio] error: no soundfont zone
  found`, and that render FAILS. Render each `$:` layer alone when a report shows one; keep contrabass ≥ E1, cello
  ≥ C2, clarinet ≥ E3, oboe ≥ Bb3, and check `gm_reed_organ`, `gm_marimba`, `gm_taiko_drum`, `gm_bassoon` with a
  short test render before relying on them.
- Write decimals with a leading zero (`0.32`, never `.32`, and never `@.32` weights: they parse as notes).
- `gm_vibraphone` hangs the offline export (and is a chime: not in this film anyway).
- Ghost the clacks under words; save full-level clacks for the gaps; keep reverb on the clacks near zero (the
  machines are dry, the music around them may breathe).
- Read the spectrogram PNG after every render; check that nothing bright sits in 1-4 kHz under the stressed words.
