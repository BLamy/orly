// ElevenLabs TTS with character timestamps. We concatenate a chapter's step
// `spoken` segments into one script, synthesize once, and read each segment's
// start time directly from the character alignment — exact cues, no STT.
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';

const SEP = ' ';

export async function synthesizeChapter({
  spokenSegments,
  voiceId,
  apiKey = process.env.ELEVENLABS_API_KEY,
  modelId = 'eleven_multilingual_v2',
  // Joiner between segments. The default single space keeps the historical
  // storyboard behavior; pass '\n\n' (paragraph break) for natural ~0.6s
  // pauses between narration lines (used by the v3 video pipeline).
  sep = SEP,
}) {
  if (!apiKey) throw new Error('ELEVENLABS_API_KEY is required for TTS');
  const client = new ElevenLabsClient({ apiKey });

  // Build the script and remember each segment's character offset.
  let text = '';
  const offsets = [];
  spokenSegments.forEach((seg, i) => {
    if (i > 0) text += sep;
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
  return { mp3, cues, audioEnd, alignedExact, scriptLen: text.length, alignLen: nChars };
}
