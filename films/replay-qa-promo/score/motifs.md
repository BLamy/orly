# Score motifs: Replay QA, { fully managed } (replay-qa-promo, look "promo")

**One through-composed cue, `m01`, 0 to 82.71 s (the whole film).** Read this file before you write a note.

The narrator talks almost without a break. Every speech-free gap but one is shorter than 2 s, and QA
`score.cueJoins` needs each join in the clear with the incoming cue sounding alone for 1.5 s. A second cue
could only join in the agent-pair gap ('handoff1' to 'w1'), and that would split the film's one continuous groove
for no gain. So the score is a single arranged track:

- an intro (the haze)
- the build and the drive
- the time-travel section (half time, the tape-stop, the four-beat silence)
- the verdict breath
- the lift and the end card resolve

It ENDS with the last chord: it is not a loop that gets cut off.

Brief (look.md, music): modern, bright and warm product-promo electronica. Soft four-on-the-floor and broken-beat
drums, warm analog-style pads, plucked synths, and a sub that stays below the voice. It **drives the cut**. Machines clack or tick. **Never a chime:** no
celesta, glockenspiel, music box, vibraphone, tubular bells, bell or "ding" synth patches anywhere.

---

## 1. The clock: a tempo map with every cut on the grid

No constant tempo puts this film's cuts on beats: the best single tempo misses by about 80 ms RMS. Instead the score
runs on a **tempo map**. The tempo is constant within each phrase, every phrase starts exactly on a cut or a hit
word, and every tempo change happens at a cut, where the edit hides it. The local tempo stays between 117 and 126 BPM (nominal
**122 BPM**, 4/4, with a few 2/4 and 3/4 bars to absorb the edit). Results:

- **Every scene change is a bar line**, except the one marked *push* (the ch05-s02 cut, 24.2.4). It lands one 16th
  before beat 3 (an anticipated hit: put the stab on that 16th).
- Every beat in `timeline.json` (type hits, braces, ✓s) is within ±62 ms of a 16th on the grid. The table in §5
  gives each one's bar.beat.16th.

`BARS` = `[bar start (s), beats in the bar, beat length (s)]`, bar 1 = index 0. Paste it as is. It is generated
from `narration/timeline.json` on the locked 82.71 s clock (regenerated 2026-10-14 after ch05-s05 was cut: the bar-line anchors are the cuts, 'Introducing', 'caret', 'b-tapestop', 'time', 'Four', 'click' and 'managed'). §3 and §4 use this map's bar numbers (bar.beat.16th as in §5), and `score/cues/m01.strudel` is the realisation. If the clock moves, regenerate it rather than nudging
numbers.

```js
const BARS = [[0,2,0.5083],[1.0167,4,0.5083],[3.05,4,0.5083],[5.0833,4,0.4778],[6.9944,2,0.4778],[7.95,4,0.4972],[9.9389,4,0.4972],[11.9278,4,0.4972],[13.9167,4,0.4851],[15.8572,4,0.4851],[17.7976,4,0.4851],[19.7381,2,0.4851],[20.7083,4,0.4833],[22.6417,4,0.4833],[24.575,2,0.4833],[25.5417,4,0.4881],[27.494,3,0.4881],[28.9583,4,0.4919],[30.9257,4,0.4919],[32.8932,4,0.4919],[34.8606,2,0.4919],[35.8443,1,0.5307],[36.375,4,0.4872],[38.324,4,0.4837],[40.2588,4,0.4837],[42.1935,4,0.4837],[44.1283,2,0.4837],[45.0957,4,0.4912],[47.0607,4,0.4913],[49.026,3,0.4913],[50.5,4,0.4896],[52.4583,4,0.4896],[54.4167,4,0.4896],[56.375,4,0.4896],[58.3333,4,0.4861],[60.2777,4,0.4861],[62.2222,4,0.4861],[64.1666,4,0.4861],[66.1111,2,0.4861],[67.0833,4,0.4881],[69.0357,4,0.4881],[70.9881,4,0.4881],[72.9405,2,0.4881],[73.9167,4,0.4923],[75.886,2,0.4923],[76.8707,4,0.4923],[78.84,4,0.4923],[80.8094,4,0.4923]]
```

| bars | section | from → to (s) | local BPM | meter | what anchors it |
|---|---|---|---|---|---|
| 1–3 | haze (no drums) | 0.000 → 5.083 | 118.0 | 2/4, 4/4, 4/4 | 'Introducing' is the bar-4 downbeat; the blur cut into ch01-s03 is 3.4.1 (the crest beat) |
| 4–5 | lift (no drums) | 5.083 → 7.950 | 125.6 | 4/4, 2/4 | the whip (cut to ch02-s01) is 5.2.1, the last beat before the drop |
| 6–8 | build | 7.950 → 13.917 | 120.7 | 4/4, 4/4, 4/4 | the kick enters on 'caret' (6.1.1); cut ch02-s02 = 7.2.1; cut ch03 = bar 9 |
| 9–12 | loop | 13.917 → 20.708 | 123.7 | 4/4, 4/4, 4/4, 2/4 | cut ch03-s01 = bar 9; ✓1 9.2.1, ✓2 11.2.2, ✓3 11.4.3; the fill is bar 12; cut ch04 = bar 13 |
| 13–15 | drive, proof one | 20.708 → 25.542 | 124.1 | 4/4, 4/4, 2/4 | cut ch04-s01 = bar 13; 'b-hosted' 13.4.2, 'b-schedule' 14.2.3, 'b-strip' 14.3.2 |
| 16–17 | drive, proof two | 25.542 → 28.958 | 122.9 | 4/4, 3/4 | cut ch04-s02 = bar 16 (now a bar line, no push); 'Against' 16.1.3, 'b-staging' 16.3.1, 'b-preview' 16.4.2, 'b-local' 17.1.3 |
| 18–21 | drive, proof three | 28.958 → 35.844 | 122.0 | 4/4, 4/4, 4/4, 2/4 | cut ch04-s03 = bar 18; 'b-pr' 18.3.2, 'b-chips' 19.2.3, 'b-check' 19.4.3 |
| 22 | **tape-stop** | 35.844 → 36.375 | 113.1 | 1/4 | 'b-tapestop' = bar 22, one beat: everything pitch-falls into the ch05 cut |
| 23–27 | rewind, half time | 36.375 → 45.096 | 123.2 | 4/4, 4/4, 4/4, 4/4, 2/4 | cut ch05-s01 = bar 23; 'intime' ('time') = bar 24; cut ch05-s02 = **push** 24.2.4; 'ribbon' 26.3.4 |
| 28 | **silence** | 45.096 → 47.061 | 122.1 | 4/4 | 'Four' = bar 28: four beats of nothing; ends on the word 'click' (bar 29) |
| 29–30 | rewind | 47.061 → 50.500 | 122.1 | 4/4, 3/4 | the kick returns on 'click' = bar 29 |
| 31–34 | rewind, hush | 50.500 → 58.333 | 122.5 | 4/4, 4/4, 4/4, 4/4 | cut ch05-s03 = bar 31 ('shatter' 31.1.2); 'matchcut' 33.4.2; the last 'can' 34.3.2 |
| 35–39 | rewind → verdict | 58.333 → 67.083 | 123.4 | 4/4, 4/4, 4/4, 4/4, 2/4 | cut ch05-s04 = bar 35; 'counter' 36.1.2; 'u258' 36.3.1; 'snapback' 37.3.3; 'place' 37.4.4; 'starting' 38.3.4; L0508 ends 39.1.2: bar 39 (2/4) is the verdict hinge |
| 40–43 | lift | 67.083 → 73.917 | 122.9 | 4/4, 4/4, 4/4, 2/4 | cut ch06-s01 = bar 40 (the D lands); woven words w1 40.1.3 … w6 42.1.4; 'confirm' 42.2.4; 'chip' 42.4.2 |
| 44–45 | end card | 73.917 → 76.871 | 121.9 | 4/4, 2/4 | cut ch06-s02 = bar 44; 'End-to-end' 44.4.3, 'fully' 45.2.3; **'managed' = bar 46 downbeat (D6/9)** |
| 46–48 | ring-out | 76.871 → 82.708 | 121.9 | 4/4, 4/4, 4/4 | the D6/9 rings under the last line; **the button = 47.2.2** (first 16th after 'time') = lastStrike; nothing after it |

### The lane helper (verified: rendered through strudel.cc Export, onsets within 5 ms of the map, zero errors)

Events are written in **seconds** from the map. Each lane compiles into one mini-notation sequence on a fixed
`setcps(.5)` time base, so an onset sits exactly where the map puts it whatever the local tempo.

```js
const CPS = .5
setcps(CPS)
const N = 46                        // cycles spanned by each compiled lane (>= body 41.354 + tail)
const T = (bar, beat = 1, s16 = 0) => BARS[bar - 1][0] + (beat - 1 + s16 / 4) * BARS[bar - 1][2]
const Q = (bar) => BARS[bar - 1][2] / 4          // one 16th in this bar, seconds
// [sec, lenSec, value, velocity?, {param: v}?] -> pattern; overlapping events go to parallel lanes
function lane(evs, defs = {}, ctl = note) {
  const sorted = [...evs].sort((a, b) => a[0] - b[0]); const lanes = []
  for (const e of sorted) { let l = lanes.find((x) => x.end <= e[0] + 1e-6); if (!l) { l = { end: 0, evs: [] }; lanes.push(l) } l.evs.push(e); l.end = e[0] + e[1] }
  const seq = (l, val) => { let pos = 0; const out = []; for (const e of l.evs) { const a = e[0] * CPS, d = e[1] * CPS; if (a - pos > 1e-6) out.push('~@' + (a - pos).toFixed(5)); out.push(val(e) + '@' + d.toFixed(5)); pos = a + d } if (N - pos > 1e-6) out.push('~@' + (N - pos).toFixed(5)); return mini('[' + out.join(' ') + ']') }
  const keys = Object.keys(defs)
  return stack(...lanes.map((l) => { let p = ctl(seq(l, (e) => e[2])).velocity(seq(l, (e) => e[3] ?? .8)); for (const k of keys) p = p[k](seq(l, (e) => (e[4] && e[4][k] != null ? e[4][k] : defs[k]))); return p.slow(N) }))
}
// every beat of bars b0..b1 -> fn(bar, beat) returns an event, a list of events, or null
const each = (b0, b1, fn) => { const out = []; for (let b = b0; b <= b1; b++) for (let k = 1; k <= BARS[b - 1][1]; k++) { const r = fn(b, k); if (r) out.push(...(Array.isArray(r[0]) ? r : [r])) } return out }
```

Drums use `ctl = s`, e.g. `lane(each(6, 12, (b, k) => [T(b, k), .2, 'bd', .9]), {}, s).bank('RolandTR909')`.
The music director's smoke test (bars 1–12: pad, arp, kick, hats and rim) rendered through strudel.cc Export
with no `[webaudio]` errors, with the kick's onsets on 'caret' and the ch03 cut to within 5 ms. That raw test
peaked at +2.5 dBFS, so set gains low: aim for a render around −20 LUFS I with TP ≤ −3 dBTP.

---

## 2. Key and harmony

**D major with a lydian lift.** The E/D chord carries the G♯, the bright "lift" the brief asks for. **B minor**
(the relative minor) is the plum time-travel register. The film's harmonic sentence is
**I – II/I – vi – IV** (Dmaj9 – E/D – Bm9 – Gmaj9), with these exceptions:

- the build sits on I and IV
- the drive moves through the whole sentence
- ch05 lives on vi (Bm9 – Gmaj7 – Em9 – F♯7sus4)
- the verdict suspends on Asus2 and resolves to D
- the end card plays the sentence once more, brightest, and lands on **D6/9** on 'managed'

**Register rule (the narrator is a mid-life American baritone, F0 about 100–140 Hz).** Under speech:

- Keep 250 Hz to 3.5 kHz sparse: pads behind `lpf` 800–1200, low velocity, voiced from D3 up (never doubled at
  the narrator's octave).
- Put the brightness above 5 kHz: hats, air, pluck transients.
- Keep the sub below 110 Hz: a sine at D1–A1, `lpf` 120.
- Bass harmonics come out (`lpf` ≤ 300) under lines.

The plucks and stabs speak fully only in the gaps and on the hits. The cue is ducked lightly (ratio 4, 4 dB), so
it must already be written around the voice.

---

## 3. The motifs

Bar numbers below are on the §1 map (bar.beat.16th, 1-based, as in §5). `score/cues/m01.strudel` is the realisation.

### M1 · "Point it" (the hook)
The film's tune: a rising plucked figure **D5 – E5 – F♯5 – A5**, answered by **B5 – A5**. It is the URL being
typed and the product going to work. Rhythm: four 16ths and a dotted 8th, then the answer on the "&".
**Development:**
- the haze: one filtered note at a time, as the arpeggio's top voice (bars 2–4)
- the build: under "Point it at your app" only the typed-key ticks and one soft A5 on 'app' (6.2.3); the hook's
  first clear statement is complete, at full voice, in the breath after 'typed' (bar 7)
- the drive: harmonised in thirds (the breath before 'Against', bar 15; the pickup into proof three, 17.3), with a
  G♯5 replacing A5 on the E/D bar (bar 19)
- ch05: **stuck on one note** (F♯4, one length, the checkpoint that never moves, bars 36–38)
- the lift: in octaves in the bloom after 'confirm' (43.2.1), its A a 16th ahead of the end-card cut
- the end card: its answer under the tagline (B4 on 'End-to-end' 44.4.3, A4 on 'fully' 45.2.3, soft and dark),
  then its call rolled upward in 32nds (D5 E5 F♯5 A5, about 60 ms apart, each held) into the D6/9 on 'managed'
  (bar 46): the hook arriving home. The button (47.2.2) echoes D5/F♯5, muted.

```js
// M1 as realised in the breath after 'typed' (bar 7): a filter-envelope saw, dotted-8th delay (nothing bell-like)
$: lane([[T(7,1,0),Q(7),'d5',.8],[T(7,1,1),Q(7),'e5',.8],[T(7,1,2),Q(7),'f#5',.82],[T(7,1,3),Q(7)*3,'a5',.82],[T(7,2,2),Q(7),'b5',.72],[T(7,2,3),Q(7)*2,'a5',.66]])
  .s('sawtooth').attack(.002).decay(.2).sustain(0).release(.06).lpf(500).lpenv(3.4).lpdecay(.12).hpf(200)
  .delay(.22).delaytime(B(13) * .75).delayfeedback(.28).gain(.36 * G).room(.15).orbit(2)
```

### M2 · "Always on" (the machine pulse)
The managed platform as a rhythm. A soft, round four-on-the-floor kick (TR-909 `bd`, `lpf` 3000; in the loop,
drive and lift layered over a sine kick with a fast pitch drop). 16th closed hats with an accent on the off-beat
8th (`hh`, `hpf` 6000). A soft clap on 2 and 4 (`cp`, low gain, small room). The **✓ clack** is the film's machine
sound: a dry 909 `rim`, `lpf` 2500, never pitched like a bell. It returns as the ✓ clacks in ch03, the off-beat
chip clacks in ch04-s03, the frame clacks on the ribbon in ch05, the verdict's rim tick and the final button.
**Development:**
- kick alone (build, from 'caret' 6.1.1)
- plus hats (from the ch02-s02 cut, 7.2.1)
- plus clap (ch03, bar 9)
- full groove with round bass (ch04, bars 13–21)
- half time with a muffled kick (ch05, from bar 23)
- **gone for exactly four beats** (bar 28, 'Four')
- back on 'click' (bar 29)
- thinned to a rim tick (the verdict hinge, bar 39)
- full again (lift, bar 40); under the voice its top is kept above 8 kHz and its claps darkened
- stops on the resolve ('managed', bar 46)

```js
$: lane(each(6, 21, (b, k) => [T(b, k), .25, 'bd', .85]), {}, s).bank('RolandTR909').lpf(3000).gain(.7)
$: lane(each(7, 21, (b, k) => [[T(b,k,2), .08, 'hh', .45], [T(b,k,1), .05, 'hh', .18], [T(b,k,3), .05, 'hh', .2]]), {}, s).bank('RolandTR909').hpf(6000).gain(.45)
```

### M3 · "Haze" (the warm pad and the sentence)
A warm analog pad: two saws detuned ±7 cents, `lpf` 600–1400 with slow `lpenv` openings, room 0.4, every voicing
from D3 up (`hpf` 180). A sine sub carries the roots below 110 Hz. It plays the harmonic sentence
**Dmaj9 – E/D – Bm9 – Gmaj9**, `[d3,a3,c#4,e4]` `[d3,b3,e4,g#4]` `[d3,f#3,a3,b3,c#4]` `[g3,b3,d4,f#4,a4]`.
**Development:**
- the haze: pads alone, the filter opening with the colour sweep
- under the drive: chords re-struck on bar lines
- ch05: Bm9 dark, low, reversed (swells that cut off on the downbeat)
- the verdict: thinned to open fifths A–E–B
- the end card: the widest voicing, landing on D6/9 `[d3,a3,e4,f#4,b4]` over sub D1 on 'managed', ringing under
  the last line and released a 16th or two before the button

```js
$: lane([[0, T(4), '[d3,a3,c#4,e4]', .5], [T(4), T(6) - T(4), '[d3,b3,e4,g#4]', .5]], { attack: .25, release: .3 })
  .s('sawtooth').lpf(800).lpq(1.5).hpf(180).gain(.3).room(.4).orbit(1)
```

### M4 · "In time" (the rewind)
The hook of the film, and the one dark register (B minor). Its sounds:
- the **tape-stop**: the last G chord, a G1 saw and a slowed kick pitch-fall two octaves over the one-beat bar 22
  (`.penv(-24)`, `pattack` = the bar) into the ch05 cut
- the **reversed swell**: a pad with attack equal to its length and release 0.03, so it crests and cuts off on
  the downbeat like a reversed sample
- the **frame clack**: one dry rim per beat from 'rewind' (bars 23–24) and on the ribbon (26.3–27.2)
- the **four-beat silence**: every lane empty for bar 28 and no reverb tail left over (whatever plays into it is
  dry or short)
- the **16th hat pulse that stops dead** ('counter' 36.1.2 to 'u258' 36.3.1)
- the **stuck pluck**: M1 frozen on F♯4, one length, repeating

**Development:** it enters on the ch05 cut (bar 23), stops time on 'Four' (bar 28), comes back on 'click' (bar 29),
and hushes under "A screen recording can't see that" (bars 31–33). On the match cut (33.4.2) the kick and a warm
bass B1 return and the harmony lifts B minor → G → D on the last 'can' (34.3.2): the turn from the problem to the
product. It ends with the stuck pluck restarting once on 'starting' (38.3.4).

```js
// the reversed swell that crests on 'time' (the bar-24 downbeat) and cuts off
$: lane([[T(23), T(24) - T(23) - .05, '[d3,f#3,a3,b3,c#4]', .62, { attack: T(24) - T(23) - .08 }]], { attack: 1 })
  .s('sawtooth').release(.03).lpf(1000).lpq(2).hpf(160).gain(.34).orbit(3)
// the stuck checkpoint: one note, one length
$: lane([[36, 1], [36, 2], [36, 3], [36, 4], [37, 1], [37, 2]].map(([b, k]) => [T(b, k, 2), Q(b) * 1.5, 'f#4', .5]))
  .s('square').attack(.002).decay(.09).sustain(0).release(.03).lpf(1400).gain(.3).orbit(4)
```

### M5 · "The verdict" (felt piano, at the hinge)
Two chords on a felt piano (`piano`, `lpf` 1400–1500, small room), unnarrated, in the breath after "starting
over" (the 2/4 hinge bar 39):
- **"not yet"**: an open, unresolved Asus2 `[a3,e4,b4]` (no third) a 16th into bar 39, as 'over' ends, over pads
  thinned to A–E–B, a rim tick and a quiet A1 sub; then the ramp (pad filter opening, pink riser, a 32nd snare
  roll on beat 2)
- **"good"**: the warmer, fuller D `[d3,a3,e4,f#4]` on the bar-40 downbeat (the ch06-s01 cut), landing with the
  band and doubling the lift's pad

The pair is the end card's resolve in miniature: the D heard on bar 40 is the D the film lands on at 'managed'.

```js
$: lane([[T(39, 1, 1), .7, '[a3,e4,b4]', .58, { release: .5, lpf: 1400 }], [T(40), 1.6, '[d3,a3,e4,f#4]', .48, { release: 1.2, lpf: 1500 }]],
  { release: 1, lpf: 1500 }).s('piano').gain(1.55 * G).room(.38).orbit(4)
```

---

## 4. The arrangement, section by section

Intensity is the target felt energy (0–1). Positions are bar.beat.16th on the map; every hit is listed with its
anchor in §5.

1. **Haze (bars 1–3, intensity 0.2).** M3 alone, Dmaj9 at full haze level from the first frame, `lpf` opening
   with the colour sweep ('sweep' 2.4.3). A filtered 16th saw arpeggio in M1's notes (`lpf` 380, low). A
   pink-noise riser and the pad crest on the blur cut (3.4.1), resolving onto the 'Introducing' downbeat (bar 4).
2. **Lift (bars 4–5, 0.3).** On 'Introducing', a **muted downbeat**: a low filtered thump (kick at `lpf` 280) and
   the pad steps up to E/D. A tight filtered **clack per frame stamp**, a **sine sub drop** (D2 falling to D1) on
   'mark' (4.3.4, "Replay QA"). The arpeggio accelerates with the map. The whip (5.2.1) gets a reversed-noise
   whoosh that fills the last beat and cuts off on the drop.
3. **Build (bars 6–8, 0.45).** **The kick enters on 'caret' (6.1.1).** The typed keys are tiny muted clicks on
   16ths under 'keys' → 'typed'; under "Point it at your app" only those and one soft A5 on 'app' (6.2.3). M1's
   first clear statement is at full voice in the breath after 'typed' (bar 7). **Hats enter on the ch02-s02 cut
   (7.2.1).** A small filtered stab and brace transient on 'url' (8.2.1, "Just a quick chat"). Pad: D → Gmaj9.
4. **Loop (bars 9–12, 0.55 → 0.65).** Soft clap on 2 and 4. **One clack per ✓:** 'b-check1' 9.2.1, 'b-check2'
   11.2.2, 'b-check3' 11.4.3: the shot's only accents. The **one-bar fill** (bar 12, 2/4): snare 16ths and a tom
   roll with a noise riser, landing on the cut into ch04 (bar 13).
5. **Drive (bars 13–21, 0.75).** The full groove: round sine bass (off-beat 8ths, `lpf` 200), light open hat on 2
   and 4, M1 in thirds. **The triplet of proofs:**
   - **proof one**: a filtered stab on bar 13 (cut ch04-s01), a muted pluck on 'b-hosted' (13.4.2), a brace-snap
     transient on 'b-schedule' (14.2.3), a soft tick per date on the strip from 'b-strip' (14.3.2)
   - **proof two**: the stab on bar 16 (cut ch04-s02, a bar line), the brace snap on 'Against' (16.1.3), three
     rising plucked accents on 'b-staging' 16.3.1, 'b-preview' 16.4.2 and 'b-local' 17.1.3
   - **proof three**: the stab on bar 18 (cut ch04-s03), the brace snap on 'b-pr' (18.3.2), a soft off-beat clack
     per chip from 'b-chips' (19.2.3), a muted tick on 'b-check' (19.4.3)

   Pad sentence I – II/I – vi – IV, one chord per bar. The groove holds to 'b-tapestop' (bar 22, one beat), where
   the **tape-stop** pitch-falls everything into the ch05 cut.
6. **Rewind (bars 23–27, 0.4, dark).** B minor, half time: a muffled kick on 1, a soft clap on 3, no 16ths.
   Reversed swells crest and cut off on each bar line; the first on **'intime' (bar 24)**. A dry frame tick per beat
   from 'rewind' for two bars, softer and duller each time. On the ch05-s02 push (24.2.4), a low muted stab. A
   dry frame clack per beat on the ribbon (26.3.4 →). The last swell is dry and is sucked into the hole.
7. **Silence (bar 28, 0).** On 'Four' every lane stops dead for exactly four beats, with no reverb tail. The
   narrator says "Four dropped frames" into the hole: the dropped frames are heard as missing time.
8. **Rewind (bars 29–38, 0.45 → 0.5).**
   - **The kick returns on 'click' (bar 29)**, half time, Bm9 → Gmaj9.
   - On the shatter (31.1.2, just after the ch05-s03 cut): a dry, unpitched clatter of rim and hat hits scattered
     over one beat (**not glassy, not pitched**).
   - The hush (bars 31–33) under "Twenty-five of twenty-seven…" and "A screen recording can't see that": Em9
     behind `lpf` 680, a half-time pulse (muffled kick on 1, filtered rim on 3) and a very quiet high tick per beat.
   - On 'matchcut' (33.4.2) the kick and a warm bass B1 return; G → D lands on the last 'can' (34.3.2).
   - Bar 35 (cut ch05-s04), back in B minor: **the 16th closed-hat pulse starts on 'counter' (36.1.2) and STOPS
     DEAD on 'u258' (36.3.1)**. Under it, the stuck pluck (M4) on F♯4.
   - Muted plucks ride the snap-backs from 'snapback' (37.3.3) and settle on 'place' (37.4.4). The pluck restarts
     once on 'starting' (38.3.4, "starting over"), over F♯7sus4.
9. **Verdict at the hinge (bar 39, 2/4, 0.35 → 0.6).** From the end of 'over' (39.1.2): M5's Asus2 over pads
   thinned to A–E–B, a soft rim tick and a quiet A1 sub; then the ramp in the same bar (pad filter opening, a pink
   riser, a 32nd snare roll on beat 2), and M5's D lands with the band on bar 40.
10. **Lift (bars 40–43, 0.85).** Full band, the brightest voicing: four-on-the-floor, round bass, the lydian E/D.
    Under L0601 the top stays above his consonant band (arpeggio `hpf` 6000, closed hats eased at `hpf` 8500, the
    open hat only on 2 and 4 at `hpf` 9000, claps behind `lpf` 2500) and the weight sits in the sub and kick. A
    **low thump under each woven word** ('w1' 40.1.3, 'w2' 40.3.3, 'w3' 41.1.3, 'w4' 41.2.3, 'w5' 41.4.3). **The
    bloom**, the one swell, runs from the end of 'confirm' to 'Replay': the arpeggio full, the air sheen full, open
    hats on every 8th to the end-card cut, and M1 in octaves (43.2.1), its A a 16th ahead of the cut. A soft clack
    on 'chip' (42.4.2); a short riser from 42.4 into the end card.
11. **End card (bars 44–45, 0.8 → resolve).** The sentence once more, wide: Dmaj9 on bar 44 (cut), E/D on 'tag1'
    (44.4.3) with M1's answer B4, A13sus on 'grow' (45.2.3) with its A4. **On 'managed' (the bar-46 downbeat) the
    full band strikes D6/9 once** (kick, sub D1, the wide pad) under M1's call rolled upward in 32nds, D5 E5 F♯5 A5.
    **The drums stop there.**
12. **Ring-out and button (bars 46–48).** The D6/9 rings under "Catch bugs that only exist in time"; the pad and
    sub release a 16th or two before the button. **The button, 47.2.2** (the first 16th after 'time'): sub D1, the
    muted D5/F♯5 pluck (`lpf` 600), one dry rim clack. It is the cue's **lastStrike**; nothing is struck after it,
    and it rings (sub release 2.8 s, the pluck's room and delay) for more than 2.3 s before the mix fade. The
    caret's blinks are silent.

---

## 5. Every hit on the grid (generated from the locked 82.71 s timeline)

`bar.beat.16th`, with the error to the nearest 16th in ms. Cuts are in **bold**. Hit what the shot notes ask for;
leave the rest silent.

| anchor | s | grid | err |
|---|---|---|---|
| **cut ch01-s01** | 0.000 | 1.1.1 | 0 |
| ch01-s01:haze | 0.000 | 1.1.1 | 0 |
| ch01-s01:line | 0.200 | 1.1.3 | −54 |
| ch01-s01:write | 2.227 | 2.3.3 | −60 |
| ch01-s01:sweep | 2.824 | 2.4.3 | +28 |
| ch01-s01:landed | 3.562 | 3.2.1 | +4 |
| **cut ch01-s03** | 4.583 | 3.4.1 | +8 |
| ch01-s03:word | 4.583 | 3.4.1 | +8 |
| ch01-s03:close | 5.910 | 4.2.4 | −9 |
| ch01-s03:mark | 6.370 | 4.3.4 | −27 |
| **cut ch02-s01** | 7.500 | 5.2.1 | +28 |
| ch02-s01:caret | 7.950 | 6.1.1 | 0 |
| ch02-s01:keys | 8.000 | 6.1.1 | +50 |
| ch02-s01:app | 8.720 | 6.2.3 | +24 |
| ch02-s01:typed | 9.206 | 6.3.3 | +13 |
| **cut ch02-s02** | 10.417 | 7.2.1 | −19 |
| ch02-s02:pullback | 10.417 | 7.2.1 | −19 |
| ch02-s02:caption | 10.467 | 7.2.1 | +31 |
| ch02-s02:settle | 11.668 | 7.4.3 | −11 |
| ch02-s02:url | 12.444 | 8.2.1 | +19 |
| ch02-s02:chat | 12.882 | 8.3.1 | −40 |
| **cut ch03-s01** | 13.917 | 9.1.1 | 0 |
| ch03-s01:b-title | 14.017 | 9.1.2 | −21 |
| ch03-s01:b-rows | 14.317 | 9.1.4 | +36 |
| ch03-s01:b-check1 | 14.414 | 9.2.1 | +12 |
| ch03-s01:b-working | 14.617 | 9.2.3 | −28 |
| ch03-s01:b-check2 | 18.360 | 11.2.2 | −44 |
| ch03-s01:b-check3 | 19.493 | 11.4.3 | −3 |
| ch03-s01:b-dots | 20.469 | 12.2.3 | +3 |
| **cut ch04-s01** | 20.708 | 13.1.1 | 0 |
| ch04-s01:b-time | 20.758 | 13.1.1 | +50 |
| ch04-s01:b-tag | 21.008 | 13.1.3 | +58 |
| ch04-s01:b-hosted | 22.262 | 13.4.2 | −17 |
| ch04-s01:b-schedule | 23.410 | 14.2.3 | +44 |
| ch04-s01:b-strip | 23.710 | 14.3.2 | −19 |
| ch04-s01:b-sleep | 24.361 | 14.4.3 | +28 |
| **cut ch04-s02** | 25.542 | 16.1.1 | 0 |
| ch04-s02:b-row | 25.592 | 16.1.1 | +50 |
| ch04-s02:b-lift | 25.642 | 16.1.2 | −22 |
| ch04-s02:b-brace | 25.842 | 16.1.3 | +56 |
| ch04-s02:b-staging | 26.527 | 16.3.1 | +9 |
| ch04-s02:b-preview | 27.119 | 16.4.2 | −9 |
| ch04-s02:b-local | 27.769 | 17.1.3 | +31 |
| **cut ch04-s03** | 28.958 | 18.1.1 | 0 |
| ch04-s03:b-table | 29.008 | 18.1.1 | +50 |
| ch04-s03:b-pr | 30.082 | 18.3.2 | +17 |
| ch04-s03:b-pill | 30.349 | 18.3.4 | +38 |
| ch04-s03:b-chips | 31.683 | 19.2.3 | +20 |
| ch04-s03:b-check | 32.693 | 19.4.3 | +46 |
| ch04-s03:b-fresh | 33.645 | 20.2.3 | +14 |
| ch04-s03:b-slow | 35.142 | 21.1.3 | +36 |
| ch04-s03:b-stack | 35.444 | 21.2.2 | −31 |
| ch04-s03:b-tapestop | 35.844 | 22.1.1 | 0 |
| **cut ch05-s01** | 36.375 | 23.1.1 | 0 |
| ch05-s01:chips | 36.475 | 23.1.2 | −22 |
| ch05-s01:rewind | 36.525 | 23.1.2 | +28 |
| ch05-s01:line | 36.575 | 23.1.3 | −44 |
| ch05-s01:braces | 37.044 | 23.2.2 | +60 |
| ch05-s01:intime | 38.324 | 24.1.1 | 0 |
| **cut ch05-s02** | 39.167 | 24.2.4 | −4 |
| ch05-s02:tilt | 39.217 | 24.2.4 | +46 |
| ch05-s02:settle | 41.847 | 25.4.2 | +16 |
| ch05-s02:ms67 | 42.739 | 26.2.2 | −59 |
| ch05-s02:ribbon | 43.470 | 26.3.4 | −54 |
| ch05-s02:four | 45.096 | 28.1.1 | 0 |
| ch05-s02:hollow | 46.141 | 28.3.2 | −60 |
| ch05-s02:noclick | 46.841 | 28.4.3 | +26 |
| word click | 47.061 | 29.1.1 | 0 |
| ch05-s02:refresh | 47.851 | 29.2.3 | +53 |
| **cut ch05-s03** | 50.500 | 31.1.1 | 0 |
| ch05-s03:shatter | 50.600 | 31.1.2 | −22 |
| ch05-s03:hollow25 | 50.800 | 31.1.3 | +55 |
| ch05-s03:nothing | 53.192 | 32.2.3 | −1 |
| ch05-s03:screenrec | 54.432 | 33.1.1 | +15 |
| ch05-s03:recfade | 55.581 | 33.3.3 | −60 |
| ch05-s03:matchcut | 56.039 | 33.4.2 | +31 |
| word can | 57.474 | 34.3.2 | −3 |
| ch05-s03:rootcause | 57.510 | 34.3.2 | +33 |
| **cut ch05-s04** | 58.333 | 35.1.1 | 0 |
| ch05-s04:tilt | 58.383 | 35.1.1 | +50 |
| ch05-s04:settle | 59.868 | 35.4.2 | −45 |
| ch05-s04:counter | 60.379 | 36.1.2 | −20 |
| ch05-s04:u258 | 61.215 | 36.3.1 | −35 |
| ch05-s04:nobody | 62.631 | 37.1.4 | +45 |
| ch05-s04:snapback | 63.404 | 37.3.3 | −33 |
| ch05-s04:place | 64.031 | 37.4.4 | −14 |
| ch05-s04:over | 65.563 | 38.3.4 | +60 |
| word starting | 65.563 | 38.3.4 | +60 |
| end of over | 66.260 | 39.1.2 | +28 |
| **cut ch06-s01** | 67.083 | 40.1.1 | 0 |
| ch06-s01:fan | 67.133 | 40.1.1 | +50 |
| ch06-s01:w1 | 67.383 | 40.1.3 | +56 |
| ch06-s01:pair | 67.383 | 40.1.3 | +56 |
| ch06-s01:w2 | 68.254 | 40.3.3 | −49 |
| ch06-s01:w3 | 69.224 | 41.1.3 | −55 |
| ch06-s01:w4 | 69.792 | 41.2.3 | +24 |
| ch06-s01:w5 | 70.739 | 41.4.3 | −5 |
| ch06-s01:w6 | 71.354 | 42.1.4 | 0 |
| word confirm | 71.796 | 42.2.4 | −46 |
| ch06-s01:chip | 72.583 | 42.4.2 | +9 |
| **cut ch06-s02** | 73.917 | 44.1.1 | 0 |
| ch06-s02:mark | 74.317 | 44.1.4 | +31 |
| ch06-s02:tag1 | 75.582 | 44.4.3 | −58 |
| word End-to-end | 75.582 | 44.4.3 | −58 |
| ch06-s02:grow | 76.569 | 45.2.3 | −56 |
| word fully | 76.569 | 45.2.3 | −56 |
| word managed | 76.871 | 46.1.1 | 0 |
| ch06-s02:url | 77.545 | 46.2.2 | +59 |
| end of time | 79.391 | 47.2.1 | +58 |
| ch06-s02:caret | 79.791 | 47.3.1 | −34 |

Where a hit word's onset matters more than the grid (a stab under a spoken number), place it at the anchor's own
time with `T()` replaced by the seconds from `timeline.json`. Keep the drums on the grid.

## 6. Mix contract (cues.json)

- `gainDb` −3. Render about −20 LUFS I, TP ≤ −3 dBTP, no clipped samples.
- `fadeIn` 0: the haze pad is at full level from the first frame.
- `fadeOut` 0.9: the button rings more than 2.3 s before it begins (`fadeAfterStrike` 1.6 is the floor).
- `duck` {ratio 4, attack 20, release 250, depthDb 4}.
- **lastStrike** = the button (47.2.2, the first 16th after 'time'), not 'managed'.
- Speech-free gaps where the music may speak at full voice:
  - 'landed' → 'Introducing'
  - 'mark' → 'caret'
  - 'typed' → the ch02-s02 cut
  - 'b-dots' → 'Then'
  - 'b-stack' → 'rewind'
  - the verdict hinge (the end of 'over' → 'w1')
  - the bloom (the end of 'confirm' → 'Replay', the longest, about 2 s)
- A render whose report lists any `[webaudio] error` FAILS: render each `$:` layer alone to find it.
