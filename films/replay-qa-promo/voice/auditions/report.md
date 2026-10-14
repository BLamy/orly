# Voice auditions: replay-qa-promo

Date: 2026-10-14. Model: `eleven_multilingual_v2`, settings stability 0.6, similarity 0.8, style 0.05, speaker boost on, speed 1.0.
Sample: the film's opening 580 characters (103 words, L0101 to L0503, through `voice/lexicon.json`).
Spend: 5 x 255 = **1,275 credits** (ledger `narration/ledger.json`; run budget 8,000).
Measurements: `report.json` (wpm from the character alignment, EBU R128 integrated loudness / LRA / true peak), plus per-sentence RMS spread and inter-sentence pauses taken from the alignment.

All five are ElevenLabs **premade** voices: available to every account by id, nothing added, cloned or designed. None is chosen for resembling a real person. None is used by another film (neural-net-history: `MlHIkPdx2ZF9MhznglHQ`; perceptron-short: `EapdDtSsMC291mjfSNe7`).

## Ranking

| # | Voice | id | Description (ElevenLabs premade) | wpm @1.0 | LUFS / LRA / TP | sentence RMS sd / range | median pause | est. film runtime* |
|---|---|---|---|---|---|---|---|---|
| **1** | **Eric** | `cjVigY5qzO86Huf0OWal` | smooth, trustworthy; American, middle-aged, conversational | 147.5 | -24.2 / 2.5 / -5.7 | 0.93 / 4.1 dB | 0.51 s | **~92 s** |
| 2 | Alice | `Xb7hH8MSUJpSbSDYk0k2` | clear, engaging educator; British, middle-aged | 136.5 | -22.5 / 1.7 / -1.6 | 0.63 / 3.1 dB | 0.32 s | ~98 s (~94 s at 1.05) |
| 3 | Matilda | `XrExE9yKIg1WjnnlVkGX` | knowledgeable, professional; American, middle-aged | 133.2 | -22.7 / 1.7 / -3.0 | 0.75 / 2.8 dB | 0.51 s | ~100 s (~96 s at 1.05) |
| 4 | George | `JBFqnCBsd6RMkjVDRZzb` | warm, captivating storyteller; British, middle-aged | 145.0 | -23.6 / 2.3 / -4.0 | 0.99 / 4.5 dB | 0.35 s | ~93 s |
| 5 | Chris | `iP95p4xoKVk53GoZ742B` | charming, down-to-earth; American, middle-aged | 145.1 | -23.3 / 3.1 / -3.5 | 1.26 / 6.1 dB | 0.44 s | ~93 s |

\* 177 script words at the measured pace, plus about 20 s of shot lead-ins, holds, pauseAfter/preGap and line gaps. The brief's target is ~90 s with a hard ceiling of 100 s.

## Why Eric

- **Register.** The brief asks for a warm, confident, modern mid-life narrator with a plain, friendly promo read, explicitly *not* a documentary or trailer voice. Eric's documented character (smooth, trustworthy, conversational) is the closest fit. George is a storyteller voice, the same family as the house documentary narrators, so he is the wrong register for a product promo.
- **Runtime.** At speed 1.0 Eric fits the ~90 s target with room for the script's pauses. Alice and Matilda read about 10% slower. They would need speed 1.05 (the top of the promo band) and would still sit near the 100 s ceiling.
- **Consistency.** Eric's loudness was the most even of the three voices that fit the runtime (sentence RMS sd 0.93 dB, LRA 2.5). Chris swung most (6.1 dB range, LRA 3.1). Alice and Matilda were the most even overall, which is why they rank 2 and 3.
- **Pauses.** Eric's ~0.5 s median breath between sentences suits the short, one-idea lines. The film's explicit pauses (pauseAfter, preGap, insertGaps) add to that.
- **Lexicon terms.** "Replay Q A" took 0.50 s, the crispest read of the five. "local host" took 0.70 s as two words.

## Note on the wpm target

The workflow's default wpm band of 100-115 comes from the documentary pipeline. It cannot be met here: at 110 wpm the 177-word script alone runs about 97 s, so the film would be about 115 s, over the brief's 100 s ceiling. The promo band of speed 0.98-1.05 also cannot bring any of these voices below about 130 wpm. Where the two conflict the brief wins, so the target used was a normal conversational promo pace (about 135-150 wpm) that fits 90 s.

## Locked

`voice/voice.json`: Eric `cjVigY5qzO86Huf0OWal`, `eleven_multilingual_v2`, speed 1.0, seed 1016863915, ~147.5 wpm.
Runner-up if a human ear rejects Eric: Alice at speed 1.05 (British), then Matilda at 1.05.

**A human listening check is still recommended** before narration. Play the five `*-eleven_multilingual_v2-s1.mp3` files in this folder. After narration, sign off the pronunciation entries in `voice.json` `listening[]` (`npm run film:voice -- listen --slug replay-qa-promo`).
