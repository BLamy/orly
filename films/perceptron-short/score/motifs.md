# Score motifs: The Machine That Learned to See (perceptron-short)

One through-composed cue (`m01`, 0 to 67.75 s) covers shots ch01-s01, ch01-s02 and ch01-s03. This
document describes **revision 11**, re-fitted to the re-locked clock (`narration/timeline.json`, film
67.75 s; ch01-s03 was re-narrated). All times are absolute seconds.

## The governing idea: the withheld third

The film is about a machine that guesses wrong and is nudged until it is right, and the harmony
does the same thing. The lab and the machine live in open fifths, sus2/sus4 chords and mixolydian
colours (C/D, G/D), which are neither major nor minor: wonder held in reserve. The first third we
hear is the wrong one, **F natural** (over Bb), just after "wrong". Each wrong guess returns to F.
On "right" the same voice moves up one semitone to **F#**, and D major sounds for the first time.
The weight update becomes a single semitone, the dial nudged a little toward the right answer.
After the answer the third is withheld again for Minsky and Papert (a bare G5). Bb/F comes back for
the winter, the 'wrong' cell is quoted once under the XOR plate, and nothing resolves until "Its
descendants", where the Bb chord opens to D by two semitones (F to F#, Bb to A): the nudge again,
this time as voice-leading.

## Clock and frame

- **Tempo:** 71.4 BPM in 4/4, one bar per cycle: `setcps(.2975)` (bar 3.3613 s, beat 0.8403 s,
  16th 0.2101 s).
- **Two frames.** Shots s01/s02 did not move, so bars -1 to 6 keep the revision-8 bar frame,
  `T(bar, 16th) = (bar + .4872)·16 + 16th`. Every s03 word moved later by a different amount
  (+0.12 to +0.5 s), so from 25 s on every onset is written against its word, `A(seconds)`, and the
  pulses (the sum, the nudge, the reborn heartbeat) are counted in beats from their anchor word.
- **Length:** 67.75 s × 0.2975 = **20.156 cycles**; onsets are clipped at the body edge and the
  render adds 6 s of pure decay (73.75 s total, length error 0 ms).
- **Mix (cues.json):** gainDb -3, fadeIn 1.5, fadeOut 0.8 (66.95-67.75), light duck (ratio 3,
  20/150 ms, 3 dB), **lastStrike 64.94**.

| time | picture / narration and what the music does there |
|---|---|
| 0.00 | black; M2 drone fades in from silence |
| 1.20-3.19 | "Once, a machine learned to see." (drone only, 11-22 dB under) |
| 3.32 | M1 asked: celesta D5 3.32, A5 4.16, E6 5.00 (rings across the cut at 5.21, clear by "Its" 5.61) over a short Dsus2 string breath |
| 6.47 | music-box glint E6/A6 after "eye"; M3 pizz pulse enters 6.68; quarters under "four hundred light cells"; music box A6/D6 after "twenty by twenty" |
| 11.72-21.8 | C/D on "wires"; pizz ratchet under "motors turned" (14.24-14.87); G/D; G add9 under the name; the pulse stops |
| 22.23 | M4 enters right after "Rosenblatt": cello A2 22.23, B2 22.65, **D3 23.07 on the iris (23.00)** with celesta D5 (M1 asked again) |
| 25.17 | celesta A5 in the gap after "rule" (ends 24.88); Dsus2; E6 26.95 as "shape" ends |
| 29.89 | the sum: pizz **D2 on "tugs"**, A2 30.73, D3 31.57, E3 32.41, **A3 on "total" (33.07)** |
| 33.47 | C/D on "decides"; Bb [bb3,d4] and contrabass Bb1 on "guesses" (34.97); celesta **E6 on "wrong" (35.39)** |
| 35.79 | **F6** as "wrong" ends: the first third of the film (string F4 doubling, pp) |
| 36.63 | the nudge: pizz **A2 on "nudge"**, 37.47, 38.31 (forward: velocity .72/.67/.71, lpf 1200); contrabass A1 37.47 |
| 39.00 | Bb under "a little toward the right answer"; L0106 ends 40.53 |
| 40.62 | M1 tries in the 0.95 s pre-gap: D5 40.62, A5 40.94, E6 41.25; **F6 41.89** after "Wrong" (no contrabass under L0107) |
| 42.99 | E6/**F6 43.20** after "again"; A7sus4 from 42.37 |
| 43.87 | M1 rises D5 43.87, **A5 44.08** in the "then"/"quite" gap; A7 (C#) at 44.08 |
| 45.32 | the held breath after "suddenly": celesta E6, cello B2 45.32, A2 45.77 |
| **46.21** | **"right"** 46.21-46.64: bare celesta **F#6** and the low D (contrabass .36, cello). The **D-major bloom** (the film's only one) begins 46.64 as the word ends, holds to 47.20 (release .75) and recedes before "It could learn" (the clear air is 2.0 s). Try 5's verdict (47.91) gets the echo: **D6 47.70, F#6 47.91** (dry celesta + dry music box). A soft [f#3,a3,d4] (47.06) and the re-struck contrabass D2 (46.77, .26) carry the warmth across the gap |
| 48.64 | "It could learn" (bed about -25.1 LUFS M raw at 48.64, margin 16.8 dB on "It"); **Bm on "only simple patterns"** (49.58): the limit |
| 52.24 | "1969 … Minsky and Papert": **G5, no third** |
| 55.18 | "showed just how simple": **Bb/F returns**; under the XOR plate's flicker the 'wrong' cell is quoted once, **E6 56.97 → F6 57.18 over Bb**; strings thin to the drone and on **"years" (57.61)**, as the light dims, the drone's F2 lets go (Bb1 alone) for "for years, interest faded"; nothing resolves |
| 59.49 | cello A2 answers after "faded" (59.45) |
| **59.95** | **"Its descendants"**: Bb opens to D (two semitones), cello B2 then D3 60.37, M2 [d2,a2] back; **M3 reborn** (pizz D2/A2 quarters, 8ths from 61.53, last D2 on "still" 63.21); G/D on "today's" (61.14) |
| 62.83 | **M1 completed** across "still learn from mistakes": D5 62.83, A5 63.21, E6 63.63; A7sus4 (63.21) → A7 (63.92) |
| **64.94** | **the last D chord + celesta F#6**, 0.15 s after "mistakes" ends (64.79). Strings (held 3 16ths, release 1.5) and contrabass let go over about 2 s; **one music-box D6 answers at 65.72**. About -23.3 LUFS M raw at 65.1, -25.2 at 65.8, -34.7 at 66.4, **-41.3 at 66.95** when the 0.8 s fade begins (2.01 s after the strike), so the fade only smooths the tail |

**Register rule under speech.** The narrator is a warm, slow baritone (fundamental roughly
90-250 Hz, formants up to about 3 kHz). While he speaks, sustained material stays **below D3**
(drone, pizz, cello) or **at D5 and above** (celesta, music box), and the mid-range strings stay at
velocity .085-.13 behind `lpf(1100-1300)`. They swell only where the voice is silent: the opening
breath, the bloom after "right", and the last chord after "mistakes". Measured (music at -3 dB with
the 3 dB duck, 250-3500 Hz, per word against `narration/narration.wav`): every fully voiced word sits
at least 10.6 dB above the music; the only exceptions are two unstressed "it"s in L0105.

**Soundfont facts that matter.** `gm_celesta` **sounds an octave above the written note** (F#6
written is about 2960 Hz). `gm_music_box` sounds at pitch and has no zone at E7, so it stays at or
below A6. The bowed `gm_contrabass` and `gm_cello` samples swell about 1.1 s and 2.9 s after each
onset, so re-strikes are timed to put a trough, not a peak, under the narrator's next word. Orbit
reverbs are generated from noise on each render, so wet tails vary by a few dB between renders; the
wet celesta notes before speech are therefore kept short (release 1.1-1.4) rather than relying on
velocity alone.

---

## Revision 11: re-fit to the 2026-10-07 clock (done)

ch01-s03 was re-narrated again. Shot boundaries and the film length (67.75 s) did not change, so the
cue window, `setcps(.2975)` and the 20.156-cycle body stay. Every anchor in this document is now on
the new clock: s01, s02 and "Nobody gave it the rule." are unchanged (the celesta A5 25.17 sits in the
widened 24.88-25.99 gap); from "Show it a shape" through "right" every anchor is +0.37 s; L0108 is
+0.17 s. Changes beyond the shift: the bloom holds to **47.20** (release .75) because the clear air
after "right" is now 2.0 s; the contrabass re-strike is at **46.77** (1.87 s before "It could
learn", as before); on **"years" (57.61)**, where the light dims, the drone's F2 lets go and only
Bb1 holds (one step thinner); the last chord's strings are held 3 16ths with a 1.5 s release, since
the fade now starts 2.01 s after the strike; the music-box answer is at 65.72.

Measured (render sourceHash 90f803f37d5fe5ba): 73.75 s, length error 0 ms, no Strudel errors, 0
clipped; **-25.8 LUFS I, LRA 8.7, TP -7.4 dBTP**. Strike onset 64.94 (50 ms RMS -31.5 at 64.94,
-25.1 at 65.02). Momentary music (raw) -17.3 at 47.4 (the bloom), -25.1 at 48.64 ("It"), -23.3 at
65.1 (the last chord), -34.7 at 66.4, -41.3 at 66.95 when the fade begins. Speech-band margins
(music at -3 dB with the 3 dB duck): "right" 13.7, "It" 16.8, "could" 18.2, "tugs" 19.8, "total"
17.1, "wrong" 16.3, "nudge" 14.9, "Wrong" 17.4, "years" 17.7, "mistakes" 11.2. As before, only the
two unstressed "it"s of L0105 are under 9 dB.

## M1: The Question (the learning theme)

- **Shape:** D5, A5, E6 rising (root, fifth, ninth). It stops on the ninth, an open question.
- **Instrument:** `gm_celesta`, in the film's wet room (orbit 5, room .7, rsize 5, lpf 1900) when
  asking, in a small dry room (orbit 8) for trial and error; `gm_music_box` doubles or echoes it.
- **Development:**
  1. *Asked* (3.32-5.00) in the gap after "see"; the E6 rings across the cut to the lab.
  2. *Asked again from inside the machine*: D5 23.07 on the iris, A5 25.17 after "rule", E6 26.95.
  3. *Answered wrong*: E6 → **F6** (35.39/35.79, 41.25/41.89, 42.99/43.20). See M5.
  4. *Rising toward right*: D5 43.87, A5 44.08, E6 45.32, **F#6 46.21 on "right"**; the echo
     D6 47.70 → F#6 47.91 on try 5's verdict.
  5. *Quoted wrong once more* under the XOR plate (E6 56.97 → F6 57.18), unresolved.
  6. *Completed*: D5 62.83, A5 63.21, E6 63.63, **F#6 64.94** on the last chord; the music box
     answers D6 at 65.72.

## M2: The Night Lab (drone)

- **Colour:** D, open fifth D2+A2 (`gm_contrabass`, `lpf(420)`, slow attacks), re-bowed every two
  bars.
- **Harmony:** a pedal to "guesses", **Bb1** under "guesses wrong" (34.97), **A1** (37.47) as the
  nudge settles, silent under L0107, the low **D2 on "right"** (46.21, .36), re-struck softer at
  46.77 (.26).
- **The closing walk:** **B1** (49.58, the limit), **[G1,D2]** (52.24, G5), **[Bb1,F2]** (55.18, F2 released on "years" 57.61,
  the winter, held to 59.95), **[D2,A2]** (59.95, "Its descendants"), **A1** (63.21, "still"),
  **D2** (64.94, the last chord, release 2.2).

## M3: The Relay Pulse (the machine)

- **Colour:** plucked open fifths, `gm_pizzicato_strings`, low register.
- **Development:** enters at 6.68 after "eye", quarters under the eye, a 16th-note ratchet on
  "motors turned", halves under the name, then silence in the machine's mind. **The sum:** D2 on
  "tugs" 29.89, A2, D3, E3 one per beat, A3 on "total" 33.07. **The nudge:** three A2 plucks from
  "nudge" (36.63, 37.47, 38.31), now forward: about 4.4 dB louder than revision 8, lpf 1200, so the
  dials audibly move about 10 dB under the word.
- **Reborn** under "Its descendants, today's neural networks": D2 59.95, A2 60.79, quickening to
  8ths (61.53, 61.95, 62.37, 62.79), a last D2 on **"still" (63.21)**; velocity .24-.28, lpf 1200.

## M4: The Builder (the human theme)

- **Shape:** A2, B2, D3 (held), a rising step and third (`gm_cello`, `lpf(600)`).
- **Placement:** right after "Rosenblatt": A2 22.23, B2 22.65, **D3 23.07** on the iris.
- **Development:** B2 45.32, A2 45.77 to **D2 on "right"** (46.21); after "faded" A2 59.49 (a major
  seventh against Bb, a reach, not a resolution), B2 on "Its" (59.95), D3 60.37; B2 62.37, A2 63.21,
  home to D2 on the last chord (64.94).

## M5: The Nudge (F to F#, wrong to right)

- **Cell:** one semitone. Wrong is **F natural** over Bb; right is **F#** over **D major**,
  prepared by A7sus4 → A7 (C# leading tone, 44.08).
- **Wrong:** E6 35.39 on "wrong", **F6 35.79** as it ends, doubled pp by a string F4. In L0107
  every F6 sits in a word gap (41.89, 43.20).
- **Right:** on "right" only the celesta F#6 and the low D sound, so the word stays clear (13.7 dB).
- **The bloom:** `[f#3,d4,f#4,a4,d5]` .6, `lpf(3000)`, attack .4, 46.64-47.20, release .75, with the
  low piano [D1,D2] and the dry music box (F#6 46.64, A5 47.06). About -17.3 LUFS M raw at 47.4 (the
  film's loudest moment), -23.4 at 48.4, -25.1 at 48.64, so it fits the 2.0 s gap and "It could
  learn" is clear (16.8 / 18.2 dB). On top, the **echo** on try 5's verdict, D6 47.70 → F#6 47.91 (dry
  celesta .25 + dry music box .24).
- **After the answer:** Bm (49.58), G5 (52.24), Bb/F (55.18) with the XOR quote (56.97/57.18),
  D on "Its descendants" (59.95), G/D, A7sus4 (63.21), A7 (63.92), the last **D** (64.94).
- **The last chord:** strings `[d3,a3,d4,f#4,a4]` .28 in the small room (lpf 2200), held 3 16ths, release 1.5;
  celesta F#6 .24; piano [D1,D2] .17 (release 1.4); contrabass [D2,A2] .22 (release 1.2) and cello D2 .2
  (release 1.2); one music-box D6 (.17) answers 0.78 s later (65.72).

## Arc in one line

M2 drone from black → M1 asked → M3 pulse over modal chords → M4 builder into the iris, M1 asked
again → M3 the sum → M5 the first wrong on Bb → M3 the nudge → M5 wrong again → A7 with M1 rising →
F#, and D major blooms on "right", echoed on try 5's verdict → Bm, the limit → G5, Minsky and
Papert → Bb, the winter, the wrong cell quoted under XOR → D on "Its descendants", M4 answers, M3
reborn → M1 completed, the last D chord rings 2 s and a music box answers it into the dark.

All of it renders through `score.mjs render` (strudel.cc Export to WAV) with no Strudel errors.
