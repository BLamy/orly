// TTS with exact per-step cues, behind a provider switch (TTS_PROVIDER):
//   - "elevenlabs" (default) — one synthesis per chapter with character
//     timestamps; each segment's cue is read from the alignment.
//   - "pocket" (aka "local") — kyutai pocket-tts running locally (free, CPU);
//     each segment is synthesized separately so cues are exact by construction.
//     See tts-pocket.mjs.
// Both return { audio, ext, cues, audioEnd, alignedExact, ... }; `mp3` is kept
// as an alias of `audio` for older callers.
import { synthesizeChapterPocket } from './tts-pocket.mjs';

const SEP = ' ';

export function ttsProvider(explicit) {
  return String(explicit || process.env.TTS_PROVIDER || 'elevenlabs').toLowerCase();
}

export async function synthesizeChapter(opts) {
  const provider = ttsProvider(opts.provider);
  if (provider === 'pocket' || provider === 'pocket-tts' || provider === 'local') {
    return synthesizeChapterPocket(opts);
  }
  if (provider !== 'elevenlabs') {
    throw new Error(`unknown TTS_PROVIDER "${provider}" (use "elevenlabs" or "pocket")`);
  }
  return synthesizeChapterElevenLabs(opts);
}

async function synthesizeChapterElevenLabs({
  spokenSegments,
  voiceId,
  apiKey = process.env.ELEVENLABS_API_KEY,
  modelId = 'eleven_multilingual_v2',
}) {
  if (!apiKey) {
    throw new Error('ELEVENLABS_API_KEY is required for TTS (or set TTS_PROVIDER=pocket to narrate locally with pocket-tts)');
  }
  // Lazy import so the local (pocket) path works without the ElevenLabs SDK.
  const { ElevenLabsClient } = await import('@elevenlabs/elevenlabs-js');
  const client = new ElevenLabsClient({ apiKey });

  // Build the script and remember each segment's character offset.
  let text = '';
  const offsets = [];
  spokenSegments.forEach((seg, i) => {
    if (i > 0) text += SEP;
    offsets.push(text.length);
    text += String(seg).trim();
  });

  const res = await client.textToSpeech.convertWithTimestamps(voiceId, { text, modelId });
  const mp3 = Buffer.from(res.audioBase64, 'base64');
  const al = res.alignment; // maps to the literal input characters
  const starts = al.characterStartTimesSeconds;
  const ends = al.characterEndTimesSeconds;
  const nChars = al.characters.length;
  const alignedExact = nChars === text.length;

  // Each segment's cue = start time of its first character. If the alignment
  // length doesn't match the input (rare normalization), fall back to a
  // proportional estimate so we never crash.
  const cues = offsets.map((off) => {
    if (alignedExact) return starts[Math.min(off, nChars - 1)] ?? 0;
    const frac = text.length ? off / text.length : 0;
    return (ends[nChars - 1] ?? 0) * frac;
  });
  // monotonic guard
  for (let i = 1; i < cues.length; i++) if (cues[i] < cues[i - 1]) cues[i] = cues[i - 1];

  const audioEnd = ends[nChars - 1] ?? 0;
  return { audio: mp3, ext: 'mp3', mp3, cues, audioEnd, alignedExact, scriptLen: text.length, alignLen: nChars };
}
