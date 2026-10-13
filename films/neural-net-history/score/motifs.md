# Score motifs: Who Taught the Machine? (neural-net-history)

The music director's bible for the 21 cues in `cues.json`. The clock is `narration/timeline.json`
(film **2121.42 s** since review round 1). Every time below is in **absolute film seconds** unless it is
marked cue-local. In Strudel code, cue-local time = absolute time − `cue.start`.

## Clock re-fit, 2026-10-12 (the clock is now 2139.5417 s)

Ten lines were re-narrated (L0415, L0505, L0610, L0612, L0701, L0821, L0832b, L0902, L1501, L1517). Every cue keeps its
id, motifs and intent; the cues whose insides moved were re-fitted to the new words and re-rendered:

- **m05** the cello's A2 -> D3 and the 'light' overtone move onto the new L0415 words (+0.2 s); window unchanged.
- **m06** from the desks' second key on, +0.583 s (L0505 longer); window 448.48-555.65, fade after L0512.
- **m08** the bet (L0610) is 5.6 s longer: the waltz grows from ten bars to **fourteen**, Jackel's A7 on 'Jackel', the tune
  starting again for Vapnik's counter-bet, still stopping on the E half-diminished chord on 'paid' (M2's unanswered question);
  the whisper (M3 running back), the protected pipe, the chess slip and the fog all +7.46 s; window 624.52-776.97.
- **m09** L0701 now tells both bets (13.9 s): the thaw's open fifth walks **I - vi - IV - V in Bb** under it (Gm on 'By 2000',
  Eb on 'By 2005', F on 'Each man lost one bet'), two tiny high replies in its breaths, the pizzicato wink on 'lost', and the
  M1 warm-up candle (F -> Bb) follows exactly as before; window 775.47-871.08.
- **m11** the Florence hold is 2.6 s shorter (it still cuts dead on 'fifteen'); M4's fourth now lands A2 on 'light', D3 on
  'him' (L0832b longer); window 1042.48-1129.89.
- **m12** the auction's beats (L0902) placed on the new words; everything after +0.46 s; window 1128.39-1222.35.
- **m19** from the phone on, +0.5 s (L1501); window 1895.35-2011.15.
- **m21** the film ends 0.125 s earlier: window 2039.42-2139.54 (the last chord has long decayed by then).

## Review round 1: the clock moved (read this first)

The prologue was re-narrated slower, eight chapter openers gained head-holds and a new shot (ch06-s03b,
the kernel trick) was added, so every window moved. **The cue sheet (`cues.json`) is the authority for
times:** each cue's notes open with its new window, its IN and OUT joins (each inside a speech-free gap,
QA `score.cueJoins`), and its LAST STRIKE BY target, and every hit in the notes has been re-mapped to
the new clock through the beat and word names it cites. Times quoted further down this bible (the
development tables, the scored silences) are from the earlier clock unless marked *new clock*: use the
names, not the numbers. Motifs, keys and instrumentation are unchanged. What moved between cues:

| moved | from → to | why |
|---|---|---|
| the wick glint at the end of the title (`wickCatch` 74.98) | m01 → **m02's first note** | the m01→m02 join must finish by 74.6 (1.5 s before L0201) |
| M2's wry walk for the false-clue card (`falseClue` 555.31, `falseClueTurn` 556.31) | m06 → **m07's opening** | the join is in the 3.4 s gap after L0512 |
| **the slip motif** (`slipPinned` 1205.94, `draught` 1207.14: A→D, D held over A-E, solo celesta) | m12 → **m13's opening** | a join after it could not finish before L1002 (1209.68); same pitches and instrument, so m21 still resolves it |
| ch12-s08 (the stampede) now plays **before** ch12-s03 (Anthropic, then Bard / LLaMA / GPT-4 and Claude the same day) | inside m16 | the shots were re-ordered; m16 now ends on the founding figure (two equal plucks on `sameDayChips` 1631.83) |
| THE LABS UNDER THE SAME LIGHT (ch15-s05, the founding figure once per lamp) | m20 → **m19** | the only usable gap inside ch15-s05 lies between Anthropic's lines and OpenAI's: one cue now carries both labs (fairness); m20 is the holdouts and Widrow |
| the m04→m05 join | kept **before** the snow line (364.95-365.70, a short fade on the decaying held D) | the hand-off's later gap (374.3) would have put the winter's first line inside the sterile cue |
| m21's window | now runs to the film's end (2121.42) | the end cards are 31.5 s; the last suspension decays inside the window |
| m16's stampede no longer stops dead | the double-speed pulse falls back to **M5c at m12's own eighths and level** on `sitBack` and carries through the cut into the founding (review r1) | the stampede's energy carries into ch12-s03 instead of restarting after a flashback; the founding stays identical to m12's |

All 21 cues are rendered at their new windows (m11, m12, m16, m17 and m18 were the last; their sources
now place every event in absolute film seconds, so the next clock move is a find-and-replace on beat
times rather than a re-derivation).


## The governing idea: a flame is a held note

The film measures beliefs with candles, so the score measures them with one held note.

- **Lit** = the melody leaps **up a fourth** onto a note and holds it, over a consonant chord.
- **Doubted** = the note stays put while the **harmony moves underneath it**, so the same note becomes
  a **suspended fourth** (the world changed under the belief; the belief did not move).
- **Gone** = the held note **falls one step** (4 → 3) and the chord fades.

A belief that is still burning stops on the suspension and never resolves. **The film's last chord is
that suspension** (Asus4 in D: lit as the new unlettered candle catches at `b6` 2088.08, the bass drops under the held D at the cut to black, about 2089.5, and it rings out over the silent Turing card; *new clock*). Cue boundaries land on
candle lightings wherever the clock allows, so "how long" becomes something you hear: the longer a
belief burns, the longer its note is held across the cue.

The second idea is **the dissenter's walk**. The holdouts at the rim carry hand-lanterns, and their
theme (M4) **begins with the candle's rising fourth but keeps walking stepwise** instead of holding:
persistence, not certainty. When a holdout reaches the centre (Lake Tahoe, ch 9), M4's opening fourth
turns into M1's held note. When he walks back to the rim (ch 13), M1's held note becomes M4 again.

## Tonal plan (the harmony tells the story)

The home key is **D**. Learning lives in D; the winters darken it to D minor; the eras that are not
about learning (1958's hype, the knowledge boom) sit in brighter, slightly foreign keys. AlexNet
reclaims D major. The Transformer dive moves to the dominant (A). The case reopens in D minor, and the
film ends on the unresolved Asus4 of D.

| cue | chapter | key centre | why |
|---|---|---|---|
| m01 | 1 Prologue | D (Dsus2/Dadd9; D dorian walk) | the lit box asks on E6, the ninth: a question with no third |
| m02 | 2 1940s | **G major** | warm, curious, celesta; the logic candle in G |
| m03 | 3 1958 labs | **C major** → A minor | bright public optimism, organ; minor turn for the limit and the gutter |
| m04 | 4 sterile | **D minor** | the home key, darkened: the field turns away from learning |
| m05 | 4 winter | D minor / D pedal; F major for the lamplighters | the snow; the few lit windows in the relative major |
| m06 | 5 messenger | **F major** (dawnGold) | the thaw; backprop's arpeggio is born warm |
| m07 | 5 knowledge | **C major** → C minor | the rival suspect's boom, brittle and bright; its own winter |
| m08 | 6 quiet years | D minor, with F major for the SVM bowl | piano; the clean bowl is perfectly resolved, the fog is not |
| m09 | 7 accomplices | **Bb major** → D major | data and fire brighten the key towards home |
| m10 | 8 Florence I | D dorian → D major | the machine ostinato builds in the home key |
| m11 | 8 Florence II | **D major** | the cliff, vindication, a new candle in the home key |
| m12 | 9 gold rush | D major pulse; E minor for Go | speed; the Go candle lit and gone (the slip motif now opens m13) |
| m13 | (9's slip) 10 Transformer | the slip motif in D (A→D over A-E), then **A minor → A major** at "at once" | the dominant: everything looks at everything |
| m14 | 11 read everything | D major (study), D mixolydian ostinato | the coat comes back |
| m15 | 11-12 scale, rim, gardener | D major → B minor (rim) → **G major** (gardener) | ch 2's child-machine key returns for "education, at last" |
| m16 | 12 return | **D** (the prologue's exact sonority, now answered) | the question gets harmony: Dmaj9 on "new door" |
| m17 | 13 reopened | **D minor** | the home key darkened again: doubt from the centre |
| m18 | 14 two shores | **E aeolian**, harmonised two ways (L: E minor, R: G/C major) | neutral, neither shore owns the key |
| m19 | 15 call, now, the labs | D major; the founding figure (D A B F#) for both labs, level | wonder, not triumph; fairness: one cue, one phrase for both labs |
| m20 | 15 holdouts, leaving | D minor | the holdouts' suspension; Widrow's full motif with its fall |
| m21 | 15 reveal, open | **D major**, ending on **Asus4** | every era's instrument in one wave; the unresolved suspension |

## House rules for every composer

**Register under speech.** The narrator is a warm, unhurried mid-life RP baritone (fundamental about
90-250 Hz, formants to about 3 kHz). While he speaks, sustained material stays **below D3** (drones,
contrabass, cello pedals, pizz), and any mid-range strings or pads sit at velocity .10-.15 behind
`lpf(1000-1400)`. Melody in the 200 Hz-2 kHz band belongs in the **gaps between lines** (the clock gives
every gap). Swells only where the voice is silent (beats listed in each cue's notes). Never put a moving
melody in the 300-1200 Hz band under a line.

**High voices are NOT safe by register alone (critic round 1, 2026-10-12; replaces "D5 and above is
safe").** Celesta, harp, music box, bowed glass and high string holds sounding D5-E6 (587-1320 Hz) sit in
the vowel band, and their upper partials and hiss-like noise (e.g. white noise hpf 3k) sit in the consonant
band. Under a line, a high voice must **sound above about D7** (remember `gm_celesta` sounds an octave up,
`gm_pad_bowed` sounds high: `[d4,a4]` is heard at D6/A6) **or be at least 6 dB lower** than it would be in
the clear (about half the velocity); otherwise it belongs in the **breaths**. A note the picture pins to a
word (a wick catching on "All") becomes a soft, short single note, and the bright statement goes into the
next breath. Strike a held high note and let it go (the strings or a low pedal hold the pitch). Watch the
tails too: a seal, a chord or a celesta note that rings past a line's first word counts as under the line.
**Check:** measure each line in the 250-2 kHz and 1-4 kHz bands (render + `gainDb`, whole line, no duck);
every line at least **7.5 dB** clear in both (renders vary 1-2 dB in reverberant passages, so aim for 9).
Passed this way: m19 v9, m21 v5, m02 and m04 (critic round 1 voice-band pass).

**Length and endings.** `cycles = (end - start) × cps`. Compose with `arrange([n, pattern], …)` or
one-shot sequences with `.slow(n)` so the music is through-composed and **ends**: the last onset falls
**before the overlap region** (the final 2-4 s of the window, where the next cue fades in), and the
last sound is a struck or released chord that decays naturally. A cue with `fadeOut: 0` is not faded
(only m21, by design: its window now runs to the film's end and its last chord decays inside it). Every other cue is faded over `[end - fadeOut, end]`
and cut at `end`, so its music should already be decaying there.

**Phase.** To hit a word on a downbeat, shift the bar frame as perceptron-short did: choose cps, then
an offset P (in cycles) so that `(t_word - cue.start) × cps - P` is a whole bar; write the code in
16th-note positions from the cue start (`T(bar, sixteenth) = (bar + P)·16 + sixteenth`). Rubato cues
(m01, m05, m17, m21) may instead use one bar = 1 s or 2 s (`setcpm(60)` / `setcpm(30)`) and place
events by absolute seconds.

**Loudness.** Render each cue to about **-21 LUFS integrated (±2)**, true peak below **-3 dBTP**; the
loudest music-only swells (title, the cliff in Florence, the reveal) may reach about -16 LUFS
momentary. Neighbouring cues should sit within about ±3 LU of each other. `gainDb` in cues.json sets the
mix role on top of that. Duck: every cue carries the same light sidechain object (ratio 3, 20/250 ms,
depth 3 dB), because the music is written around the voice; do not rely on the duck to clear space.

**Soundfont facts (verified on strudel.cc, 2026-10-06).**
- `gm_celesta` **sounds an octave above the written note**: write A3→D4 to hear A4→D5.
- `gm_music_box`: keep at or below **A6** written.
- `gm_contrabass`: **no zone below about C1** (A0 and B0 fail). Keep it at D1 or above.
- `gm_clarinet`: no zone at C2 or C7; keep it **D3-C6** (it is the "low clarinet" colour at D3-A3).
- Valid and in range across C1-C7/C8 in tests: `piano`, `gm_cello`, `gm_pizzicato_strings`,
  `gm_string_ensemble_1`, `gm_orchestral_harp`, `gm_drawbar_organ` (the "valve organ"), `gm_pad_bowed`
  (the "bowed glass"), `gm_french_horn` (C1-C7), `gm_synth_brass_1`, `gm_fx_crystal`,
  `gm_tubular_bells`, `gm_timpani`, `gm_vibraphone`, `gm_woodblock`; oscillators `sawtooth`,
  `triangle`, `sine`, `square`; noise `pink`, `brown`, `white`.
- The bowed `gm_contrabass`/`gm_cello` samples swell about 1 s and 3 s after onset (loop modulation),
  so a long held note crescendos by itself: re-strike so a trough falls under the next word.
- A render whose report lists `[webaudio] error` (e.g. "no soundfont zone found") **fails**. Solo
  each `$:` layer to find the note and move it into range.
- No national-instrument colours anywhere (no pentatonic "oriental" figures, no erhu, koto, banjo,
  bagpipe, fife). Two Shores is a harp and pizzicato, nothing more.

**Instrument palette by era** (the M1 candle motif is re-orchestrated in each):

| era | M1's instrument | bed |
|---|---|---|
| 2026 frame, the study | celesta (and the study's low clarinet for the file) | low D drone, tape hiss (`pink`, hpf 2.5k, gain ≤ .015), pizz |
| 1940s (ch 2) | celesta | soft strings, far-off low rumble |
| 1950s labs (ch 3) | valve organ (`gm_drawbar_organ`, lpf 1200-1600, low velocity) | motor whirr (`brown` noise bursts), pizz |
| the winters (ch 4, 5's gutter) | solo cello; **low clarinet over cello** for the sterile candle | bowed glass (`gm_pad_bowed`), cello harmonics |
| 1980s knowledge boom (ch 5) | `gm_synth_brass_1`, bright and brittle | a typing rhythm (woodblock / short pizz 16ths) |
| quiet years (ch 6-7) | solo piano | piano left-hand pulse |
| GPU era (ch 7-12) | warm synth pad (`triangle`/`sawtooth` + lpf) over the pulse | oscillator pulse, fan-whine shimmer |
| 2023 worry (ch 13) | low horn (`gm_french_horn`) + low strings, darker voicing | sparse strings |
| Two Shores (ch 14) | harp, panned dead centre for a candle | harp L / pizz R |
| the end (ch 15) | solo celesta | everything, then nothing |

---

## M1: The Candle (the leitmotif)

- **Shape:** rising fourth onto a held note → the harmony drops under it (sus4) → the note falls a step.
- **Home form (D):** A → **D**, held over D major (lit) · the D held over A-E (Asus4, doubted) · D falls
  to **C#** as A major sounds (gone). The half-cadence ending is deliberate: a belief dies, the story
  goes on.
- **Tempo:** wherever the cue's tempo is; the classic statement is 60 BPM, four bars.
- **Strudel (home form, written for celesta + strings; four 4-s bars):**

```js
setcpm(60/4)                                         // 60 BPM, one 4/4 bar per cycle
// LIT: rising fourth (celesta sounds A4 -> D5)
$: note("[a3 d4 ~@14]").slow(4).s("gm_celesta").velocity(.5).room(.6).rsize(4)
// the flame itself: D held (lit, then doubted), falling to C# (gone)
$: note("~ d4@9 c#4@6").slow(4).s("gm_string_ensemble_1").attack(.6).release(2).velocity(.3).lpf(1600)
// harmony: D major (lit) -> A-E under the held D = Asus4 (doubted) -> A (gone)
$: note("[d2,a2,f#3]@4 [a1,e2,a2]@8 ~@4").slow(4).s("gm_string_ensemble_1").attack(.8).release(2.5).velocity(.2).lpf(900)
$: note("d2@4 a1@8 ~@4").slow(4).s("gm_contrabass").velocity(.25).lpf(400)
// still burning: replace the flame with "~ d4@15" and the harmony with "[d2,a2,f#3]@4 [a1,e2,a2]@12"
```

- **Development across the film:**

| where | belief | form |
|---|---|---|
| m01 title (62-71.5) | (the motif itself) | celesta, lit + held suspension; the fall **held back**; rings into ch 2 |
| m02 106-122 / 176-179 | THE BRAIN IS A LOGIC MACHINE (G: D→G over G, G over D-A, G→F#) | celesta lights it on 107.08; strings suspend on "Gerard" 116.77; **first full statement** with the fall on "sixteen" 178.32 |
| m03 212.6 / 298.1 | A MACHINE THAT LEARNS WILL SOON SEE… (C: G→C) | valve organ; suspension under Minsky; falls on "seven" 298.06 |
| m04 345.5 | MANY LAYERS ARE A DEAD END (D minor: A→D over Dm) | low clarinet over cello, dark; held through the whole winter (m05) as a cello pedal |
| m06 501 | sterile candle goes out | its own colour (low clarinet over cello) falls on "seventeen" 500.97, cleanly |
| m07 537.6 / 582.8 | KNOWLEDGE, BY HAND (C) | synth brass lights it; cello falls **a step short** on "seven" (guttered); a thin high note stays for Cyc |
| m08 650.7 | FIDDLY, AND BEATEN ANYWAY (D minor) | solo piano, plain; suspension under the rim |
| m09 729.4 / 794 | WARM UP LAYER BY LAYER (Bb) | warm synth pad under piano; suspension on "nearly" (746.8); the piano falls as it gutters |
| m10 805 | FEATURES BY EXPERTS (D) | plainly, with respect |
| m11 1002 / 1010 / 1023 | expert features out; fiddly out; **LEARNED FEATURES lit** (D major, full strings) | kind piano falls (two, the second lower); full-strings lighting held on the suspension: still burning |
| m12 1049.6 / 1070.4 / 1095.3 / 1132.7 | the creed; A GO MACHINE IS A DECADE AWAY; **the slip motif** | Go candle lit and gone inside one cue (two years); the slip motif = the first two gestures only, solo celesta, exposed, **in D exactly as it will return in m21** |
| m13 1135.3 / 1301.9 | LANGUAGE MUST BE READ IN ORDER (A: E→A) | cello lights it; strings carry it in full on "twenty" |
| m15 1398.3 | SCALE IS THE MAIN LEVER (D) | synth; stops on the suspension (still burning) |
| m16 1476-1488 | the X-ray chord | one note of the motif per era colour, building one chord |
| m17 1574.1 / 1623.7 | WORRY (D minor, low horn + strings) / Cyc's taper out | darker than any earlier lighting, held, never resolved; the 39-year taper gets the suspension only |
| m18 1660 / 1706.6 / 1715.6 / 1752.5 | CHOKEPOINT; COMPUTE DOESN'T MATTER (the match); ONE TO THREE YEARS; THE GAP IS MONTHS | harp: lit twice a third apart; the match = the whole motif in two seconds; "two" resolves softly; the gap candle stops on the suspension |
| m19 1779.4 / 1789.3 / 1798.3 | the prizes | the rising fourth only, three times, at the same level |
| m20 1883-1889 / 1897-1903 | the three holdouts; Widrow | cello: lit on "win", suspended under "dangerous" and "far enough"; then **the full motif with its fall** for Widrow |
| m21 1917.9 / 1970.0-1972 | the verdict; **the new unlettered candle** | lit on "Learning"; finally solo celesta, slowed: lit as the match catches, held suspension, **no resolution: the film's last chord** |

## M2: The Case (the lit box, the walk, the file seal)

Three small objects that belong to the detective's study, the frame of the whole film.

- **The lit box:** a low D drone (contrabass D2 or a sine D1), faint tape hiss, and **one high piano
  tone, E6**, the ninth: a question with no third. Heard on "wonder" (4.27) and only once more, at the
  return to the scene (m16, 1455-1468), where it is finally **answered by a warm Dmaj9 on "new door"
  (1466.23)**.
- **The walk:** a low pizzicato line in D dorian, slow and inquisitive, quarter notes, with one
  chromatic step: `D2 F2 G2 G#2 | A2 ~ C3 A2`. It "stops dead" on every "file".
- **The file seal:** two notes, **A → D falling a fifth**, plucked and doubled by a soft low clarinet
  (D3-A3). It is the refrain's sound every time ("Put that in the file": 43.93, 104.83, 288.67, 561.09,
  1045.87). In ch 8 (1045.87) it is struck once on a low tubular bell instead.
- **Strudel:**

```js
setcpm(60/4)
$: note("d2").s("gm_contrabass").velocity(.25).attack(2).release(4).lpf(400)          // the box's drone
$: s("pink").gain(.012).hpf(2500).lpf(9000)                                             // tape hiss
$: note("<[~ e6 ~ ~] ~ ~ ~>").s("piano").velocity(.3).room(.8).rsize(6)                // the one tone (a ninth)
$: note("<~ [d2 f2 g2 g#2] [a2 ~ c3 a2] [a2@2 d2@2]>").s("gm_pizzicato_strings").velocity(.45).lpf(1500)  // walk + seal
```

- **Development:** m01 (drone, tone, walk, three plucks for three suspects, seal) · m02 (walk for the
  pinning, seal under "could not learn") · m03 (sly two-note clarinet "detective" figure for the false
  clue, seal) · m06 (wry, off-kilter walk for the false clue card) · m07 (seal, Tokyo aside) · m11 (the
  bell) · m16 (the box returns and is answered) · m21 (the stamp and the lamp click are left silent;
  the drone is gone; only the cursor's world remains).

## M3: The Messenger (the learning theme)

The thing that actually learns. It is an arpeggio that goes **up** (light flows forward through the
layers), stops on a **question** (the error glows), and comes **back down** the same notes (the
messenger tugs each knob by its share of the blame). When the learning works, the next forward pass
lands on the **third**: solved.

- **Key/tempo:** born in F major at 63 BPM in m06; it lives in D for the rest of the film.
- **Shape (in D):** forward `D3 F#3 A3 D4` → error `E4` held over a soft `[D4,Eb4]` glass rub → backward
  `E4 D4 A3 F#3 | D3` (pizz, one tug per note) → trained forward `D3 F#3 A3 D4 → F#4`.
- **Strudel:**

```js
setcpm(63/4)
$: note("<[d3 f#3 a3 d4] ~ ~ ~ [d3 f#3 a3 d4] [f#4@4]>").s("gm_celesta").velocity(.45).room(.5)   // forward / trained
$: note("<~ [d4,eb4] ~ ~ ~ ~>").s("gm_pad_bowed").velocity(.25).attack(.3).release(1.5)          // the error glows
$: note("<~ e4 [e4 d4 a3 f#3] [d3 ~ ~ ~] ~ ~>").s("gm_pizzicato_strings").velocity(.5)            // the messenger runs back
$: note("<d2 d2 [a1,e2] d2 d2 [d2,a2]>").s("gm_cello").velocity(.25).attack(.4).release(2)
```

- **Development:** m05 (a hidden hint: the Helsinki window's celesta glints are M3's first three notes,
  unnoticed, 410) · **m06** (born: XOR, 469.5-491.9; the training scrub accelerates; "By itself"
  491.4 lands on F#) · m07 (s10's lead-in, slow and warm) · m08 (**the whisper**: the descending figure
  on piano, each note half as loud, gone at 692.6; then the **protected pipe**: the same figure at even
  volume over an organ pedal, 694.5-699.8) · m10 (the messenger runs down the cathedral stairs, quicker
  and quicker, until the mosaic resolves, 887.5-892.3) · m13 (the scribe's whisper again; "tuned by our
  messenger" 1202.7) · **m21** (the forward wave across the lantern network: M3 forward, one era
  instrument per layer, 1924-1928).

## M4: The Rim (the lamplighters; human persistence)

The holdouts' theme. It opens with M1's rising fourth, then keeps walking. Solo cello, D dorian, two
bars, warm and low, with plenty of air.

- **Shape:** `A2 D3 – E3 | F3 – G3 F3 | E3 C3 | D3`; harmony `Dm – Bb – C – Dm` (or F/A for warmth).
- **Tempo:** 54 BPM.
- **Winter colour:** solo cello sul tasto (low velocity, lpf 1200), `gm_pad_bowed` glass high and thin,
  and single cello harmonics (D5/A5 sounding) as the snow.
- **Strudel:**

```js
setcpm(54/4)
$: note("<[a2 d3@2 e3] [f3@2 g3 f3] [e3 c3@3] d3>").s("gm_cello").velocity(.45).attack(.15).release(1.5)
$: note("<[d2,a2] [bb1,f2] [c2,g2] [d2,a2]>").s("gm_contrabass").velocity(.2).attack(.5).release(2)
$: note("<[d5,a5] ~ ~ ~>").s("gm_pad_bowed").velocity(.12).attack(1.5).release(3)                // winter glass
```

- **Development:** m04/m05 (the winter: the cello alone; **first full statement** at 405.3-414.6, "a
  few windows stayed lit", in F major, celesta glints per window; the suspension at 421.8 "takes his
  place, far from the flame") · m08 (three hand-lanterns answer each other, 664.9) · m11 (**"Now, it
  found him"** 1035.3: M4's opening fourth becomes M1's held note; the dissenter reaches the centre) ·
  m15 (the crowded rim of ch 11: cello, 1406-1430) · m17 (Hinton walks back to the rim: M1's held note
  turns back into M4's walk, 1564-1573) · m18 (**the Two Shores melody is M4 played by harp**, in E
  aeolian, harmonised two ways) · m20 (Widrow: M4's opening, then M1 in full, then the windows go dark) ·
  m21 (M4's walk under "someone at the rim is suspicious", 1962-1968, before the match).

**Two Shores (M4 transformed).** A harp plays M4's contour in E aeolian
(`B3 E4 – F#4 | G4 – A4 G4 | F#4 D4 | E4`), harmonised **two ways at once**: left channel in E minor
(`Em – C – D – Em`), right channel the same melody over `G – C – D – Em`. Equal level, equal warmth,
equal register. They meet in the centre on one cooler held chord for Bletchley and the hotline
(`Esus4 add9`, 1739-1749). No pentatonic scale, no national instruments.

## M5: The Engine (the machine pulse)

The teaching machines' ostinato. It is M3's arpeggio made regular: the messenger turned into a
mechanism. It always locks to the picture's machine (knob turns, stencil steps on twos, attention
pours on downbeats) and drops out the instant the machine stops.

- **a) 1958, the Mark I (m03):** valve organ eighths `D3 A3 D4 A3` (C major in m03: `C3 G3 C4 G3`) and a
  motor whirr (a short `brown`-noise burst, lpf 700) **only on knob turns**; it drops out on "hear it
  learn" (242.8) so the whirrs are heard alone.
- **b) The stencil (m08, m10):** a dry wooden tick on twos (`gm_woodblock` / dry pizz), one per stencil
  step.
- **c) The GPU pulse (m09 → m16, m19):** oscillator eighths `D2 D3 A2 D3` (`sawtooth`, lpf 600-1100,
  decay .18) with a high fan-whine shimmer. Enters on "fire" (775.91), never earlier. Its density
  doubles with each power of ten in m15.
- **d) Attention (m13):** eight voices of one chord (`A3 D4 F#4 A4 B4 C#5 D5 E5` in D, transposed
  to A in m13), each panned across the field, entering one by one on "eight" (1256.2) and sounding in
  unison on "multiplication" (1286.4).
- **Strudel (all four, one bar each):**

```js
setcpm(92/4)
$: note("<[d3 a3 d4 a3]*2 ~ ~ ~>").s("gm_drawbar_organ").velocity(.25).lpf(1200)          // a) valve organ
$: s("<[~ ~ ~ brown] ~ ~ ~>").decay(.25).sustain(0).lpf(700).gain(.15)                      // a) motor whirr on the turn
$: note("<~ [d5 ~ a4 ~]*2 ~ ~>").s("gm_woodblock").velocity(.2)                             // b) stencil ticks on twos
$: note("<~ ~ [d2 d3 a2 d3]*2 ~>").s("sawtooth").lpf(900).decay(.18).sustain(0).gain(.18)   // c) GPU pulse
$: note("<~ ~ ~ [a3 d4 f#4 a4 b4 c#5 d5 e5]>").s("gm_celesta")
   .pan("<0 .14 .28 .42 .57 .71 .85 1>").velocity(.35).room(.4)                              // d) eight heads
```

All five snippets were rendered through `score.mjs file` on 2026-10-06 with no `[webaudio]` errors.

---

## Scored silences (keep them silent) — *clock 2139.54 s (2026-10-12)*

| time | where | how |
|---|---|---|
| 29.58-30.2 | the lamp click (ch 1, ch01-s04 head) | m01 rests under the click, then the walk |
| 66.06-67.58 | after the rewind, the first beat of the title (`title` 67.58) | m01 rests after the rewind sucks back |
| 376.75-387.25 | Pitts's lamp on the sill (ch04-s04; L0408 377.75-382.64) | m05: one cello harmonic, barely there, or nothing |
| 387.25-394.94 | Rosenblatt (ch04-s05) | m05: silence through the line; M1 on solo cello only on the dedication (`dedication` 394.94) |
| 1660.65-1664.08 | Hinton lifts his own slip (ch 13) | m17 stops dead on `down` 1660.65; nothing until the quote (`Machines` 1664.08) |
| 1829.99-1831.28 | the struck match is shaken out (ch 14) | m18: the whole motif in two seconds, then silence to `steady` |
| 2038.15-2039.42 | between the last witnesses and the reveal | real gap between m20 and m21 |
| about 2094.15-2097.95 | the stamp (`b3` 2094.84) and the lamp click (`b4` 2097.34) (ch 15) | m21: the music rests after the slip is read; the struck match (`b5` 2104.89) also lands in near-silence |
| about 2118-2139.54 | the Turing card and the end cards | m21's body is silent: its last suspension has decayed |
