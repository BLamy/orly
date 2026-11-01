# Score motifs: Durable Objects, Unbound (durable-objects-unbound)

Composer: Claude Opus 5.5 (`claude-opus-5-5`, high effort) through Claude Code. Original Strudel, rendered with
strudel.cc's own Export to WAV (`generator/film/score.mjs`). No samples beyond Strudel's default piano and General
MIDI soundfonts; no paid assets.

**Times.** `cues.json` is the only authority for times: each cue's `notes` open with a `CURRENT CLOCK` paragraph.
This file carries no clock times at all. The playable sources in `score/cues/` are GENERATED from the templates in
`score/src/` by `score/tools/fill.mjs`, which resolves every word anchor (`@{L0616.still}`) against the locked
`narration/timeline.json`. A re-fit is: `fill.mjs windows`, `fill.mjs fill`, re-render the cues whose source changed.

## The governing idea: one interval, kept as a promise

The film follows one message and its **tick**, the acknowledgement that it is saved, through every failure that
could break it. The whole score grows from the tick's single interval: **a rising perfect fourth, A to D**. The
fourth is the smallest complete cadence (dominant to tonic), so the score can say three things with it:

- **kept**: A rises to D. The promise lands.
- **withheld**: A is played and left hanging (the held letter behind the latch; the dark crown on a claimed but
  unopened Plate).
- **broken**: A rises to the wrong note, E-flat (a semitone off: the false tick rung by a stale owner).

Harmony makes the same argument across the film. The home is **D**, but for most of the film D is **minor or
bare** (night, winterBlue). A suspension, **A-sus4**, stands for "claimed, not opened" and returns as the shut
door in the neighbours' chapter. It resolves only when the room really reopens, and then only to an **open fifth**
(D–A, no third). The **major third, F-sharp, is withheld until dawn**: the film's last chord, D major with an added
ninth, is the first time the score says D major at all.

## Sound world (silhouette theatre under a narrator)

- **Low and mid sustain**: `gm_string_ensemble_1` and `gm_cello` with slow attacks, low-passed (about 600–1100 Hz)
  so they sit under the voice; a warm synthetic **harbour drone** (triangle/sawtooth low-passed under 400 Hz) for
  the town at night, because sustained soundfont basses loop audibly. No held `gm_contrabass` pedals.
- **Restrained detail**: felt `piano` (low-passed about 1.6–2.2 kHz, low velocity) and `gm_orchestral_harp`, placed in
  the narrator's breaths and in the gaps between lines, never on stressed words.
- **Pulse**: `gm_pizzicato_strings` for the lease clock and the ribbon's frames, soft and low.
- **No chimes, celesta, music box or glass bells** for the machinery. The Tooth, the stamp and the seals are not
  scored as bells. The "house bell" is a struck low harp-and-piano dyad, warm and wooden, not a chime.
- **Silence** is a motif: the music drops out for every failure demonstration (the guttered lamp, the pulled pins,
  the sleeper, "dies", the snapped thread, "Forty-two is gone") and returns only when the pin goes back.

## The motifs

### T · the Tick (the stamp)
Two notes, short and dry: **A then D**, a rising fourth. Felt piano, very soft.
- ch01: born small and dry on 'tick', then answers itself a little warmer on 'true' (with harp).
- ch02: the held letter, released: A held under the latch, D only when the letter goes out.
- ch06: built in full for the first time since the prologue, in four stages: a held breath (A alone), two soft
  pizzicato glints on the two "Still"s, the bell dyad, then T.
- ch06/ch07 failures: **T broken** (A then E-flat, a semitone smear) for the bell a stale owner rings anyway.
- ch07: T quietly on 'back' (restore), withheld in the shut-door case, full and clear on 'tick' at the relight.
- ch08: slow, on 'proof', harmonised for the first time in D major.

```js
const T = (v = .2) => note("<a4 d5>").s("piano").velocity(v).lpf(2000).release(1.2)   // kept
const Tbroken = (v = .2) => note("<a4 eb5>").s("piano").velocity(v).lpf(2000)           // a stale bell's tick
```

### P · the Promise theme (the room; Kenton Varda's desk lamp)
T is its head: **A3 D4 | E4 F4 G4 F4 | E4 D4**, rising from the tick and falling home. D minor (Dorian
colour via B-natural in the harmony: Dm9 · G/B · Bbmaj7 · C · Dm). First full statement under the title.
- ch02 (desk lamps, duskRose, 2020): P in **F major**, warm, felt piano over strings: C4 F4 | G4 A4 Bb4 A4 | G4 F4.
- ch04: P in F alone for Kenton's desk, then in counterpoint with R.
- ch08: P and R merged into **one line** (P's rising head, R's falling tail) for the two lamps in one frame.
- dawn: P in **D major**, F-sharp at last.

### R · Ryan Dahl's lamp (the second voice)
P inverted, in the cello: **D3 A2 | G2 F2 E2 F2 | G2 A2**, the falling fourth answering the tick's rise. It enters
in ch04 "answering the Kenton theme without quoting it", then sounds with P as **two lines in counterpoint** for the
first time, crossing on 'braid'. In celld's town (ch07) R is the green colour's bass line.

### W · the Well (the bucket; depth and the long walk)
A slow descending tetrachord in the low strings: **D3 C3 Bb2 A2**, one step per bar, under the harbour drone: the
bucket going down the shaft, the scroll going down the rope, the long walk to the bucket. Major-mode inflections
(B-natural) when the Well proves something; the walk in ch07 is W at half speed.

### C · the Clock and the Candle (lease time)
A soft pizzicato ostinato on the tick's two pitches, **A2 D3 A2 D3**: a clockwork tock. It advances one step per
stamp in the epochs scene. When a keeper sleeps it slows and sours (D3 becomes E-flat 3). In ch05-s05 several
copies run slightly out of phase and are drawn together; one drops out on the snapped thread.

### S · the Suspension (claimed, not opened)
**A-sus4** (A2 D3 E3 A3): held while B's crown is dark in ch05, returns as the shut door in ch07 (it never
resolves under "the door stays shut"), and resolves only on 'relights' at the end of ch07, to the open fifth D–A.
The F-sharp waits for dawn.

### G · celld's colour (labGreen)
Not a new tune: P and R transposed to **G** (the subdominant: the same story told in a neighbouring key), voiced on
harp and a warm low string pad. A dry wooden knock (low pizzicato plus a soft `gm_woodblock` at very low level)
for each neighbour's press (fsync).

## Cue plan (eight act cues)

| cue | chapter | key and colour | motifs |
|---|---|---|---|
| m01 | ch01 The Tick | D bare fifths; harbour drone; silence for the guttered lamp | T born; T answered; P first statement under the title |
| m02 | ch02 One Room in the Whole World | F major (desk lamps) → A minor fifth (the relay, serverCyan) | P in F; T as the latch; held fifth A–E handing to ch03 |
| m03 | ch03 The Well That Learned to Say No | D minor; the race as a two-voice canon | W; T for "latest"; canon cut off by refusal; warm cadence on 'say no'; drone drops out on 'quiet' |
| m04 | ch04 Two Lineages, One Commit | F / B-flat; counterpoint | P (Kenton) + R (Ryan) braided; held chord opening upward to A-sus on 'Let us open it' |
| m05 | ch05 The Plate and the Candle | D minor terrace; G for celld | C; silence for the gust and the sleeper; clashing drones (D against E-flat) for two rooms; S for the dark crown; quiet two-chord close |
| m06 | ch06 The Ribbon | A minor → D | C as the ribbon's frames; W into the Well; T built in full; T broken for the false bell; silence for the pin |
| m07 | ch07 The Neighbours | D → G (celld) → A-sus4 → D open fifth | W at half speed (the long walk); G; T broken; S never resolving; resolves on 'relights'; T full on 'tick' |
| m08 | ch08 What Travels | D, then D major at dawn | each pin's gesture once; C as a clerk's metronome; P+R in one voice; T slow on 'proof'; D major add9 rings out under the end card |

Every cue ends with an arranged close and a decay. Its final chord is struck at least 1.6 s before the mixer's fade
(`lastStrike`), and every join between cues sits in the speech-free gap at a chapter turn.
