# ElevenLabs narration back-end: research and probe report

Date: 2026-10-05. Scope: research and probes only. No tracked source files were changed. No voices were created, cloned, designed or added to the account.
Probe scripts are in `.orly-work/probes/elevenlabs/` (gitignored). Raw outputs are in `.orly-work/probes/elevenlabs/out/`.

## TL;DR

| Decision | Recommendation |
|---|---|
| Narrator archetype | An elderly British male academic: soft-spoken, unhurried, warm and wry. **No real person's voice is cloned or imitated.** Hinton appears in the film as a character, so the narrator must not sound like him or anyone else real. |
| Voice (provisional #1) | **"AK - British Posh Well-Spoken Old Man"** `y0SYydk17lMbUIUvSf3N`. This is a shared-library voice. It synthesized through the API **without being added** to the account. It reads naturally slow (102 wpm on multilingual_v2 at speed 1.0) and its median F0 is about 105–113 Hz. Shortlist and listening files are below. A human ear has to make the final pick. |
| Model | **`eleven_multilingual_v2`** as the production default. Long-form stability is good, `speed` works, stitching works (`previous_request_ids` / `previous_text` / `next_text`), alignment is exact, and the per-request limit is 10k characters. **`eleven_v4`** is an A/B candidate. It is the newest flagship, supports stitching, tags and timestamps, and is about 3.5x cheaper **until the promo ends on 2026-10-12**, but it **ignored `speed`** in our probe. Use **`eleven_v3`** only for isolated expressive inserts, if at all: it rejects both `previous_text` and `previous_request_ids`. |
| Settings (mlv2) | `stability 0.60, similarity_boost 0.80, style 0.05, use_speaker_boost true, speed 1.05` for AK (gives about 105–115 wpm), with a fixed `seed` for each film. |
| Request strategy | Pack lines into chunks of about 1,000–1,200 characters that never cross a scene boundary. Join lines inside a chunk with `\n\n`. Call `/with-timestamps` and send `previous_request_ids` (the last 3 from the same run) plus `next_text`. Take each line's start and end from the returned alignment. Cache each chunk by content hash. Decode to 48 kHz PCM and concatenate with fixed gaps. The prototype is `narrate-film.mjs` and it worked end to end live. |
| Cost of about 5,000 words | Measured: 28.4k input characters, which comes to **about 12.4k credits on mlv2/v3** (0.4375 cr/char measured) or **about 3.5k on v4 during the promo**. Budget about 2.5x for retakes and A/B passes: roughly 31k credits on mlv2. |
| Quota | **Unknown.** The API key is scoped and lacks `user_read`, so the subscription endpoint returns 401. The usage API works: July 282,752 / Aug 92,433 / Sep 42,177 credits. The 192 kbps output was accepted, which means the account is on Creator tier or higher. Action: add the `user_read` + `voices_read` scopes to the key, or check the dashboard. |

## 1. What the key can do (probe `00-perms.mjs`)

`ELEVENLABS_API_KEY` is a **scoped key**. Per-endpoint results (`out/00-perms.log`):

| Endpoint | Result |
|---|---|
| `GET /v1/user/subscription`, `GET /v1/user` | 401 missing `user_read` |
| `GET /v1/models` | 401 missing `models_read` |
| `GET /v2/voices`, `/v1/voices`, `/v1/shared-voices` | 401 missing `voices_read` |
| `GET /v1/history` | 401 missing `speech_history_read` |
| `GET /v1/pronunciation-dictionaries` | 401 missing `pronunciation_dictionaries_read` |
| `GET /v1/voices/settings/default` | OK → `{stability:0.5, use_speaker_boost:true, similarity_boost:0.75, style:0, speed:1}` |
| `GET /v1/usage/character-stats` | **OK**, including `breakdown_type=voice|model`, which also returns full voice names |
| `POST /v1/text-to-speech/{id}/with-timestamps` | **OK** |

As a result, the requested probes (1) subscription tier, limit, reset date and voice slots and (2) the account's voice list **could not run as specified**. Two workarounds were used:

- **Usage instead of subscription** (`02-usage.mjs`, `out/usage-90d-by-day.json`). Over the last 90 days 417,362 credits were used: July 282,752, Aug 92,433, Sep 42,177, Oct 1–4 0. The peak day was 2026-07-16 at 97,423. *All* of that usage was on voice **"Archer - Conversational"** (`Fahco4VZzobUeiPqni1S`, the current orly default in `generator/cli.mjs:25`, `video.mjs:33`, `viz-narrate.mjs:25`) and model `eleven_multilingual_v2`. Archer is described as "English, casual, thirties", so it does not fit this archetype. Today's probe spend shows up in the same units: 444 credits after probe 4, which matches the `character-cost` response headers exactly.
- **Tier inference.** `output_format=mp3_44100_192` was accepted on every call. The SDK documents 192 kbps as requiring Creator tier or higher (`node_modules/@elevenlabs/elevenlabs-js/api/resources/textToVoice/client/requests/VoiceDesignRequestModel.d.ts:10`), so the account is **Creator or higher**. `pcm_44100` (Pro or higher) was not tested.
- **Voice slots and reset date: unknown.** To fix this, add the `user_read` and `voices_read` scopes to the key, or mint a second read-only key. Then rerun `node .orly-work/probes/elevenlabs/01-account.mjs`, which is already written and prints tier, `character_count/limit`, `next_character_count_reset_unix`, `voice_slots_used/voice_limit` and the model table.

## 2. Docs research (current as of Oct 2026)

Sources: elevenlabs.io/docs models page, the convert-with-timestamps API reference, the v3 and v4 prompting best-practices pages, the request-stitching guide, the voice settings reference, the text-to-voice design reference, and SDK 2.68.0 type definitions (`node_modules/@elevenlabs/elevenlabs-js`).

### Models

| model_id | Max chars/request | Timestamps (probe) | Stitching (probe) | `speed` (probe) | Notes |
|---|---|---|---|---|---|
| `eleven_v4` | 10,000 (~10 min) | ✅ exact char alignment | ✅ `previous_request_ids` and `previous_text` accepted | ❌ **no effect** (0.85 and 1.0 both gave 6.72 s, 124 wpm) | New flagship, 90+ languages, audio tags. Launch promo is ~72% off until **2026-10-12** (third-party reports). The post-promo price is uncertain. |
| `eleven_v4_turbo` | n/s | – | – | – | Realtime (~100 ms). Not needed for offline films. |
| `eleven_v3` | 5,000 | ✅ | ❌ 400 `unsupported_model` for both `previous_text/next_text` and `previous_request_ids/next_request_ids` | weak (130 → 121 wpm at 0.85; v3 is stochastic) | Audio tags. The docs call it "previous generation". |
| `eleven_multilingual_v2` | 10,000 | ✅ (`normalized_alignment` is +2 chars for "fifty-eight") | ✅ request ids | ✅ (102 → 86 wpm at 0.85) | Docs: "most stable on long-form generations". The orly default today (`generator/tts.mjs:105`). |
| `eleven_flash_v2_5` | 40,000 | (not probed) | (not probed) | – | 50% cheaper, lower quality. Use only for drafts. |
| `eleven_turbo_v2_5` | – | – | – | – | Deprecated in favour of flash v2.5. |

### `with-timestamps` request (`POST /v1/text-to-speech/{voice_id}/with-timestamps?output_format=…`)

Body fields: `text`, `model_id`, `voice_settings{stability 0–1 (0.5), similarity_boost 0–1 (0.75), style 0–1 (0), use_speaker_boost (true), speed (1.0; the UI and docs range is 0.7–1.2)}`, `seed` (0–4294967295, best-effort determinism), `previous_text`/`next_text`, `previous_request_ids`/`next_request_ids` (max 3 each, **< 2 h old**; when present they override the *_text fields), `apply_text_normalization` (auto|on|off), `language_code` (not for mlv2), `pronunciation_dictionary_locators` (max 3).

Response: `audio_base64`, `alignment{characters[], character_start_times_seconds[], character_end_times_seconds[]}` and `normalized_alignment`.

Useful response headers (measured): `request-id` (feed it to stitching), `character-cost` (credits billed), `history-item-id`, `tts-latency-ms`.

### Output formats

The `codec_rate_bitrate` grammar covers mp3 (22.05/44.1 kHz, 32–192 kbps), pcm (8–48 kHz), opus, wav, μ-law and a-law. mp3_44100_192 needs Creator or higher. pcm_44100 needs Pro or higher. **Recommendation:** request `mp3_44100_192` (it was accepted), decode once to 48 kHz PCM for the mix, and never re-encode the stem until the final AAC encode. If the tier allows it, `pcm_44100`/`wav_44100` avoids the mp3 decoder delay entirely (see §5).

### v3/v4 audio tags and pacing

- Tags such as `[thoughtfully]`, `[sighs]`, `[exhales]`, `[whispers]`, `[curious]`, `[chuckles]`, `[laughs]`, `[sarcastic]` and `[mischievously]`, plus sound-effect tags.
- **There is no SSML `<break>` on v3/v4.** Pace with ellipses, commas, line breaks and short sentences.
- The docs advise "narrative styling", meaning text written like a script.
- Probe `ak-v4-tags`: tag characters **appear in the alignment**. They have near-zero duration, and the tag's sound is attributed to the closing `]` (`[chuckles]` spans 3.68–4.40 s). The cue matcher therefore has to strip tags from the needle (implemented in `stripTags`), and captions must strip tags.
- On mlv2, tags are read aloud, so keep tags out of mlv2 scripts.

### Stability, similarity and style for documentary narration (docs + practice)

- **Stability:** lower values give a broader emotional range, higher values become monotone. For a calm lecturer, 0.55–0.65 on mlv2. For v3/v4, ~0.5 ("Natural"). Raise it if a chunk wobbles; lower it if it sounds flat.
- **similarity_boost:** 0.75–0.85 keeps the library voice's timbre. Above ~0.9 it can amplify artefacts from the source recording.
- **style:** 0–0.1. Non-zero values cost latency and exaggerate the source speaker's mannerisms, which can drift over long reads.
- **use_speaker_boost:** true.
- **speed:** 0.7–1.2 per the docs. Use it to trim wpm on mlv2. Do not rely on it for v4.

### Voice Library API (needs `voices_read` / `voices_write`)

- `GET /v1/shared-voices` filters: `page_size ≤ 100`, `category`, `gender`, `age`, `accent`, `language`, `locale`, `search`, `use_cases[]`, `descriptives[]`, `featured`, `min_notice_period_days`, `include_custom_rates`, `include_live_moderated`, `sort` (created_date | usage_character_count_1y | trending | cloned_by_count), `page`.
- Unauthenticated access is limited to 3 voices and no filters ("You must be logged in to use filters").
- `POST /v1/voices/add/{public_user_id}/{voice_id}` with body `{new_name, bookmarked?}` adds a library voice to the account and consumes a voice slot. The `public_owner_id` comes from the shared-voices listing.
- Record each voice's `notice_period` (days the owner must give before withdrawing it) and `rate` (credit multiplier; every shortlisted voice is x1).

### Voice Design API (not used in this phase)

- `POST /v1/text-to-voice/design` takes `voice_description` and `model_id ∈ {eleven_multilingual_ttv_v2, eleven_ttv_v3}`, plus `text` (100–1000 chars) or `auto_generate_text`, `loudness` (−1..1, 0 ≈ −24 LUFS), `guidance_scale`, `seed`, `quality`, `should_enhance`, and `reference_audio_base64`/`prompt_strength` (ttv_v3 only).
- It returns `previews[{generated_voice_id, audio_base_64}]`.
- Save a preview with `POST /v1/text-to-voice` (`voice_name`, `voice_description`, `generated_voice_id`), which uses a slot.
- This is the clean way to get a bespoke, non-impersonating "elderly Oxbridge professor" voice if no library voice passes the listening test. A suggested prompt: *"An elderly English academic in his late seventies, soft-spoken and unhurried, warm and gently wry, received pronunciation with a slight age-roughened grain, speaking close to the microphone in a quiet study; measured pauses, thoughtful, never theatrical."* Do not mention any real person.

## 3. Voice search (probes `03`, `04`, `05`)

The scoped key blocks `/v1/shared-voices` filters, and the claude.ai Chrome session was not signed in to ElevenLabs (credentials were not entered). Candidates were therefore gathered from:

- ElevenLabs' own public SEO pages `elevenlabs.io/voice-library/{old-male,elderly-male-voices,documentary-narrator-voices,…}` (`03-public-library.mjs`).
- A third-party mirror of the shared library (json2video.com, 9,650 voices with ids, descriptions, credit multipliers and preview URLs), ranked by `04-catalog-rank.mjs` for British + old + narrator terms.

Every recommended id was **re-verified against ElevenLabs**: its preview mp3 lives on `storage.googleapis.com/eleven-public-prod/...` under that voice id, and the top three tested ids synthesized successfully. No candidate is described as a clone of a public figure. "Damiaan", described as a clone of a named philosopher, was excluded. No catalog entry mentions Hinton.

Preview measurements (`05-previews.mjs`, `audio-metrics.mjs`) come from ffmpeg EBU R128 plus a syllable-nuclei counter with no STT. On our own lines with known word counts the counter under-reads by a consistent ~12% (George 144 vs 163, AK 90 vs 102 wpm), so the **calibrated wpm = est × 1.13**. Previews are each voice owner's own sample reads, so treat their pace only as a hint.

### Ranked candidates

| # | Voice (library name) | voice_id | Why | Preview wpm (cal.) | Median F0 | Synth-tested? | Needs adding? |
|---|---|---|---|---|---|---|---|
| 1 | **AK - British Posh Well-Spoken Old Man** | `y0SYydk17lMbUIUvSf3N` | "warm, steady-paced British elderly male … calm, authoritative … documentary" | 113 | 105 Hz | ✅ mlv2/v3/v4: 102 / 130 / 124 wpm | No for API use (worked directly). Add it for production stability. |
| 2 | James - English Storyteller | `GrVxA7Ub86nJH91Viyiv` | "60-year-old English male … upper-middle-class … slightly laconic" (the wry quality) | 165 (3 s clip) | 84 Hz | no | Unknown. Probably works directly, like #1. |
| 3 | Alistair – Culture (classic, seasoned older British male) | `UzI1NsMEV3ni5JRkRSls` | "classic, seasoned voice of an older British male … crisp, elegant" | 168 (3 s clip) | 110 Hz | no | Same as #2 |
| 4 | Grandfather Joe - Gentle, Warm and Wise Grandad | `0lp4RIz96WD1RUtvEu3Q` | "warm, conversational old-age British … nature-documentary narrator" | 145 | 122 Hz | ✅ mlv2 118 wpm; hot master (−14.7 LUFS) | No (worked directly) |
| 5 | Frederick Surrey | `j9jfwdrw7BRfcR43Qohk` | "calm, well spoken British narrator … nature, science, history". Ageless rather than elderly. | 141 | 91 Hz | ✅ mlv2 148 wpm | No (worked directly) |
| 6 | Liam Dale - British Male 60's | `w2ZdKT3ghAOcMRbpjC3u` | "mature, native British male … 60's" | 176 | 131 Hz | no | ? |
| 7 | Peter Baker - Senior Deep British Narration | `Ix8C14HEHgIQkJswik2o` | senior, deep, professional VO | 172 | 92 Hz | no | ? |
| 8 | Nigel - Classic, Polished | `l9yjqAhh8GXv7ZJxsLZO` | "distinct, seasoned English male … warmth, clarity" | 177 | 130 Hz | no | ? |
| 9 | Beezle Wheezelby | `BBfN7Spa3cqLPH1xAS22` | "wise old British narrator … soft and wizened". Risks sounding fantasy-flavoured. | 145 | 120 Hz | no | ? |
| 10 | George (premade) | `JBFqnCBsd6RMkjVDRZzb` | Warm British storyteller, middle-aged. A **safe fallback that is always available** to every account. | 180 | 152 Hz | ✅ mlv2 163 wpm at 1.0, 125 at 0.85 | No (premade) |

Also seen but not preferred:
- "Older Joe – Calm Authoritative Narrator" (`qxePw1S1QmBgjlU3GIy5`, older British RP). It appeared on the public `old-male` page, but its preview could not be resolved.
- Father Christmas (`1wg2wOjdEWKA7yQD8Kca`, too festive).
- Nathaniel (`7S3KNdLDL7aRgBVRQb1z`, too fast at 188 wpm).
- Knox Dark (`dPah2VEoifKnZT37774q`): "a serious older man reads in a slow methodical way" with F0 76 Hz, but its accent is unconfirmed.

**Listening files.** These are the measurements, but the pick has to be made by ear:
- Previews: `.orly-work/probes/elevenlabs/out/previews/<voice_id>.mp3`
- Same-line synths: `.orly-work/probes/elevenlabs/out/synth/*.mp3`

Suggested gate: one 600–900 character paragraph from the real script, rendered on the top 3 voices on mlv2 and on v4, and judged blind (~3.5k mlv2 credits for all six).

## 4. Synthesis probe (`06-synth.mjs`, results in `out/synth-results.json`)

Test line (96 chars, 14 words, 23 syllables): *"In nineteen fifty-eight, a psychologist named Frank Rosenblatt built a machine that could learn."* Line 2 (108 chars, 19 words) was used for the stitching tests.

| tag | model | speed | credits | dur (s) | **wpm** | LUFS / TP | F0 | latency | alignment |
|---|---|---|---|---|---|---|---|---|---|
| george-mlv2-s100 | mlv2 | 1.00 | 42 | 5.15 | 163 | −23.9 / −6.3 | 119 | 1.5 s | exact 96=96 |
| george-mlv2-s085 | mlv2 | 0.85 | 42 | 6.73 | 125 | −23.1 / −4.3 | 140 | 1.4 s | exact |
| **ak-mlv2-s100** | mlv2 | 1.00 | 42 | 8.27 | **102** | −30.5 / −9.7 | 113 | 4.6 s (cold) | exact |
| ak-mlv2-s085 | mlv2 | 0.85 | 42 | 9.75 | 86 | −31.7 / −11.6 | 111 | 1.7 s | exact |
| ak-v3-s100 | v3 | 1.00 | 42 | 6.48 | 130 | −18.6 / −1.9 | 105 | 0.3 s | exact |
| ak-v3-s085 | v3 | 0.85 | 42 | 6.96 | 121 | −18.3 / −1.2 | 95 | 0.3 s | exact |
| ak-v4-s100 | v4 | 1.00 | **12** | 6.72 | 124 | −27.8 / −8.2 | 134 | 0.4 s | exact |
| ak-v4-s085 | v4 | 0.85 | 12 | 6.72 | 124 | −28.2 / −7.9 | 136 | 0.4 s | exact (**speed ignored**) |
| frederick-mlv2-s100 | mlv2 | 1.00 | 42 | 5.67 | 148 | −22.1 / −6.0 | 88 | 4.4 s | exact |
| gjoe-mlv2-s100 | mlv2 | 1.00 | 42 | 7.11 | 118 | −14.7 / −1.0 | 160 | 4.3 s | exact |
| ak-mlv2-l2-previds | mlv2 + `previous_request_ids` | 1.00 | 48 | 10.03 | 114 | −31.1 | 108 | 2.5 s | exact |
| ak-v4-l2-previds | v4 + `previous_request_ids` | 1.00 | 13 | 8.16 | 138 | −28.9 | 117 | 0.5 s | exact |
| ak-v4-l2-prevtext | v4 + `previous_text` | 1.00 | 13 | 8.40 | 134 | −29.2 | 119 | 0.5 s | exact |
| ak-v4-tags | v4 with `[thoughtfully]`/`[chuckles]` | 1.00 | 10 | 5.28 | 125 | −30.1 | 129 | 0.4 s | exact, tags included |
| ak-v3-l2-prevtext | v3 + `previous_text` | – | 0 | – | – | – | – | – | **400 unsupported_model** |
| ak-v3-l2-previds | v3 + `previous_request_ids` | – | 0 | – | – | – | – | – | **400 unsupported_model** |

Alignment checks on every successful call:
- `alignment.characters.join('') === text`
- all three arrays have equal length
- start times are monotonic
- `lead-in = 0`
- mlv2's `normalized_alignment` is 2 chars longer (number normalisation); use `alignment`, not `normalized_alignment`, for cues

Two quirks:
- **v4 alignment overruns the mp3 by ~80 ms**: the last char end is 6.80 s against a decoded 6.72 s. Clamp cue ends to the decoded duration (the prototype does this).
- The first request to a library voice on mlv2 had ~4.5 s latency, which looks like a cold voice load. Later requests took ~1.5–2.5 s.

Speaking-rate takeaways:
- AK on mlv2 is the slowest and most "unhurried" at 102 wpm, with long natural pauses (1.3 s of silence in 8.3 s).
- The same voice on v3/v4 runs 124–138 wpm with fewer pauses. The newer models read it more briskly, and v4 gives no `speed` knob to slow it down.
- For a "slow distinguished" target of **~110–120 wpm**, use mlv2 at speed 1.05–1.10, or v4 at 1.0 with ellipses and paragraph breaks.
- Loudness varies widely between voices and models (−14.7 to −31.7 LUFS), so the mix stage **must** loudness-normalise the narration stem (two-pass `loudnorm`, e.g. to −18 LUFS for the dialogue stem before the music bed).

**Spend:** 1,452 input characters in total (14 synth calls plus the 87-character end-to-end test), billed as **455 credits** (`out/spend-ledger.json`, `samples/narration/ledger.json`). That is within the ~1,500-character cap.

**Billing rates measured via the `character-cost` header and confirmed by the usage API:**
- mlv2 and v3: 42 credits per 96 chars = **0.4375 credits/char**
- v4: 12–13 per 96–108 chars = **0.125 credits/char**, which is about 28% of the mlv2 rate and consistent with a ~72% launch promo ending 2026-10-12
- Assume v4 costs **at least** the mlv2 rate after the promo.

## 5. Recommended request strategy (about 5,000 words, consistent prosody, exact per-line timing)

The prototype is `.orly-work/probes/elevenlabs/narrate-film.mjs` (verified live, see below). Design:

1. **Script format.** Use `lines[{id, scene, text}]` plus `voice`, `model`, `settings` and `seed`, with one sentence or caption beat per line. Keep a separate `display` text for captions and a `spoken` text for the voice. Reuse orly's `sanitizeSpoken` rules (`generator/tts.mjs:14`) for dashes, quotes and ellipses, and add pronunciation respellings ("McCulloch", "Pitts", "Rosenblatt", "Minsky", "Papert", "AlexNet", "Sutskever", "Krizhevsky", "ImageNet", years spelled as words where the model mis-reads them).
2. **Chunking.** Pack consecutive lines into chunks of **≤ 1,200 characters** (≈ 8–12 lines, ≈ 70–90 s of audio) and **never across a scene boundary**. Join lines with `"\n\n"` so the model takes a natural breath between them. 1,200 characters is well under every model limit (v3 5k, mlv2/v4 10k). It keeps any single retake cheap (~525 credits on mlv2) while giving the model enough context for paragraph-level intonation.
3. **Prosody continuity.**
   - On mlv2/v4, send `previous_request_ids = last ≤3 request-ids from this run` and `next_text = first 500 chars of the next chunk`.
   - When re-rendering an isolated chunk later, the ids will be more than 2 h old. Send `previous_text` (the last 1,000 chars of the previous chunk) and `next_text` instead.
   - Use the same `seed` and voice settings for the whole film.
   - Never mix models within one film. v3 cannot take any context, so if it is used at all, keep it to one-off expressive inserts that are cut separately.
4. **Exact per-line timing.**
   - Use `/with-timestamps` for every chunk. For each line, match its alphanumerics (tags stripped, case- and punctuation-blind) forward through the chunk's `alignment`. The line **start** is the first matched character's start time and the line **end** is the last matched character's end time, clamped to the decoded duration.
   - This extends orly's `cuesFromAlignment` (`generator/tts.mjs:59`), which only matched 24 characters and returned starts.
   - The global time is chunk offset + cue. Chunks are decoded to 48 kHz mono s16 and concatenated with a fixed `gap` (e.g. 0.6 s, or per-scene). Offsets are therefore sample-exact and independent of mp3 encoder padding.
   - Emit `timeline.json` (chunks with request ids and costs, lines with start and end) and `narration.wav`. The film engine's `sample(t)` timelines can bind to `lines[].start/end` directly.
5. **Caching and retakes.**
   - Each chunk is cached under `sha256(voice, model, settings, seed, format, text, prev text, next text)`. The key includes neighbour text, so editing one line re-bills that chunk **and** its two neighbours (≈3 chunks, ≈1.6k mlv2 credits). For cheaper edits, drop neighbour text from the key and accept slightly less context fidelity, which re-bills one chunk.
   - A rerun with no changes spends 0 (verified).
   - Keep every take: the ledger records request ids and costs.
6. **QA loop per chunk** (automatable):
   - all lines matched (no `unmatched`)
   - wpm within the target band (100–125)
   - no silence longer than 1.5 s inside a line
   - LUFS within ±4 LU of the film median
   - a forced-alignment sanity check: the line durations predicted by the alignment sum to within 2% of the decoded chunk duration
   - A failing chunk is re-rolled with a new seed. After 2 failures, flag it for human review.

Live verification (`samples/live-tiny.json`, v4, `--max-chars 60` to force 2 chunks):

```
3 lines, 17 words, 2 chunks (max 60), 87 chars, est 11 credits on eleven_v4
chunk 0: 2 lines, 5.12s, cost 7, ctx=next_text
chunk 1: 1 lines, 2.40s, cost 4, ctx=previous_request_ids
wrote samples/narration/narration.wav (8.72s) + timeline.json; run spend 11 credits
lines: a1 0.00–1.36, a2 2.16–4.96, b1 5.72–7.96   (wav 48 kHz mono, 8.72 s)
rerun: fully cached, 0 new credits
```

Dry run on a 5,005-word fixture (`samples/dry-5000.json`): **275 lines → 25 chunks, 28,385 chars**, est. **12,419 credits (mlv2 or v3)** or **3,549 (v4 promo)**. Runtime is ~41.7 min at 120 wpm and ~45.5 min at 110 wpm, plus 0.3 min of gaps. For a 20–40 minute film, aim for **2,600–4,800 words** at ~115–120 wpm.

## 6. Cost and quota plan

| Item | Characters | mlv2 credits | v4 credits (promo) |
|---|---|---|---|
| Voice-pick gate (3 voices × 2 models × ~800-char paragraph) | 4,800 | ~2,100 (mlv2 half) | ~300 (v4 half) |
| Full narration pass of ~5,000 words | ~28,400 | ~12,400 | ~3,550 |
| Retakes (assume 30% of chunks re-rolled once) | ~8,500 | ~3,700 | ~1,070 |
| Script revisions after the review loop (assume a second full pass) | ~28,400 | ~12,400 | ~3,550 |
| **Total for the pilot** | ~70k | **~31k credits** | **~8.5k credits** |

The remaining quota cannot be read with this key. Usage was 92k credits in August and 42k in September, and the 192 kbps output implies Creator or higher (Creator has historically included ~100k credits per month). On that basis **~31k credits for the pilot should fit in one billing period**, but confirm before the full pass.

- Add `user_read` to the key, then run `01-account.mjs`. It prints `character_limit - character_count` and `next_character_count_reset_unix`.
- If headroom is tight:
  1. Draft every pass on v4 while the promo lasts (until 2026-10-12, one week away) or on `eleven_flash_v2_5` (half price), and render only the final mlv2 pass.
  2. Cache aggressively; the prototype already does.
  3. Exclude neighbour text from the cache key so that an edit re-bills a single chunk.
  4. Plans with `can_extend_character_limit` allow usage-based overage.

## 7. Actions before the build phase

1. **Key scopes.** Add `user_read`, `voices_read` and `models_read` to the ElevenLabs key (and `voices_write` only if we decide to add the chosen voice to the account). This is a dashboard change, so the user should make it.
2. **Listening gate.** Have a human pick from candidates #1–#5 using a real script paragraph on mlv2 and v4. If none passes, use Voice Design with the archetype prompt in §2. That is a separate, explicitly approved step, because it creates a voice.
3. **Lock the voice.** Once chosen, add the voice to the account with `POST /v1/voices/add/{public_user_id}/{voice_id}`, which needs approval and uses a slot. A shared voice can otherwise be withdrawn after its notice period. Record `voice_id`, `notice_period` and `rate` in the film config.
4. **Promote the prototype.** Move `narrate-film.mjs` into `generator/film/narrate.mjs` (the build phase), wire `timeline.json` into the reel engine, and add the loudness-normalisation and QA checks from §5.6.
5. **Model choice.** Default to `eleven_multilingual_v2`. Re-evaluate `eleven_v4` by ear and by post-promo price. If v4 wins on quality, control pace by writing (ellipses, short sentences) because `speed` is ignored.

## Files

- `.orly-work/probes/elevenlabs/lib.mjs`: key loader (never prints the key) and `el()` fetch helper
- `00-perms.mjs`: scope map · `01-account.mjs`: subscription, models and voices (blocked by scopes; ready to rerun) · `02-usage.mjs`: usage stats
- `03-public-library.mjs`, `04-catalog-rank.mjs`, `05-previews.mjs`, `audio-metrics.mjs`: voice discovery and measurement
- `06-synth.mjs` + `runs-*.json`: synthesis probes with a spend cap and ledger
- `narrate-film.mjs` + `samples/`: prototype long-form narration back-end
- `out/`: logs, JSON results, `previews/*.mp3`, `synth/*.{mp3,json}`, `spend-ledger.json`
