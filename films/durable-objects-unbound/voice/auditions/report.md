# Narrator casting — durable-objects-unbound (2026-11-01)

Author: claude-opus-5-5 (high), film voice/narration engineer. Model: eleven_multilingual_v2.

Brief archetype: a measured, warm, clear mid-life British documentary narrator; no imitation of a real person; a voice no other film uses.

| voice | id | speed | sample | speech span | wpm | I (LUFS) | TP (dBTP) | LRA | credits |
|---|---|---|---|---|---|---|---|---|---|
| George (premade) | JBFqnCBsd6RMkjVDRZzb | 0.9 | L0101–L0108, 570 chars, 108 words | 42.03 s | 154.2 | −23.4 | −4.3 | 2.9 | 251 |

**Locked: George at speed 0.9** (stability 0.60, similarity 0.80, style 0.05, speaker boost).

- Documented archetype: warm, middle-aged British storyteller (docs/film/research/elevenlabs-narration.md row 10); premade, used by id, nothing added to the account. Unused by every other film's voice.json.
- Pace 154.2 wpm is inside the 110–155 window (at its upper edge). Fit check against the current screenplay: 3268 words / 154.2 wpm = 1271.6 s speech + ~214.5 s scripted lead-ins, gaps and holds ≈ 1486 s (24.8 min), inside 20–28 min and under the 1680 s ceiling. The rule allowed a second audition only if the pace was materially outside the window or the prediction exceeded the ceiling; neither applied, so no further auditions were run.
- Levels are steady (LRA 2.9 LU) with ample true-peak headroom.
- **Human listening is unassessed.** Pending pronunciation sign-offs are in voice.json listening[] (celld, workerd, Deno, SQLite, S3, epoch, Vogels, Litestream).
